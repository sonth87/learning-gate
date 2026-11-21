# Tường lửa Mạng Zero-Trust (`NetworkPolicy`) & Đóng gói Đa môi trường (`Helm` vs `Kustomize`)

Bạn đã đi được một chặng đường rất xa: từ đóng gói container, triển khai Deployment không gián đoạn, định tuyến qua Service/Gateway API, quản lý lưu trữ PVC cho tới gia cố `securityContext` và RBAC. Ở chặng cuối của Level 5, chúng ta giải quyết hai bài toán kiến trúc lớn trước khi bước vào vận hành doanh nghiệp quy mô lớn:

- [!] **Về mạng nội bộ:** Mặc định trong Kubernetes, mạng nội bộ phẳng hoàn toàn — làm sao chặn đứng việc một Pod Frontend bị xâm nhập tự ý kết nối thẳng vào cổng `5432` của PostgreSQL?
- [!] **Về quản lý cấu hình đa môi trường:** Khi một dịch vụ cần tới 8 tệp YAML (`Deployment`, `Service`, `HTTPRoute`, `HPA`, `ConfigMap`, `ServiceAccount`, `NetworkPolicy`...) nhân lên cho 4 môi trường (`dev`, `qa`, `staging`, `prod`), làm sao thoát khỏi *"địa ngục Copy-Paste 32 tệp YAML"*?

Câu trả lời chính là tường lửa nội bộ ==`NetworkPolicy`== cùng bộ đôi quản lý cấu hình chuẩn công nghiệp năm 2026: ==`Helm`== và ==`Kustomize`==!

```visual
kind: illustration
diagram: "kube:k17"
alt: "Tường lửa mạng nội bộ Zero-Trust với NetworkPolicy (Default Deny + Whitelist + DNS Egress 53) và bộ máy đóng gói biểu mẫu Helm Chart"
title: "Giải Phẫu Tường Lửa Mạng Zero-Trust (NetworkPolicy) & Khuôn Đúc Gói Helm / Kustomize"
subtitle: "Khóa chặt lưu lượng ngang Đông-Tây giữa các tầng dịch vụ và tái sử dụng một bộ khuôn mẫu YAML duy nhất cho mọi môi trường"
caption: "Mô hình tường lửa Pod-to-Pod thực thi bởi Cilium/Calico (nhớ mở cổng 53 cho CoreDNS) và quy trình kết xuất cấu hình đa môi trường"
callouts:
  - num: 1
    label: "Zero-Trust NetworkPolicy: Khóa mặc định & Mở chọn lọc"
    desc: "Áp dụng default-deny (podSelector: {}) chặn 100% kết nối lạ, sau đó chỉ mở đúng luồng hợp lệ từ web -> api -> postgres:5432."
    tone: emerald
  - num: 2
    label: "Lưu ý sống còn khi khóa chiều ra (Egress) — Cổng 53 DNS"
    desc: "Khi bật kiểm soát Egress, luôn phải mở cổng UDP/TCP 53 sang kube-system để Pod không bị mù phân giải tên miền CoreDNS."
    tone: cyan
  - num: 3
    label: "Helm & Kustomize — Chuẩn hóa triển khai GitOps"
    desc: "Dùng Helm Chart (khuôn mẫu + values.yaml) hoặc Kustomize (kubectl apply -k) để đồng bộ sạch sẽ qua ArgoCD / Flux."
    tone: cyan
```

## 1. Giải thích bình dị `NetworkPolicy`: Dựng tường thẻ từ giữa các phòng ban!

> [!NOTE] Sự thật bất ngờ: Mặc định hành lang mạng Kubernetes mở toang 100%!
> Nhiều người lầm tưởng chia `Namespace` (`marketing` và `production`) là mạng đã tự cách ly. **Không hề!** Mặc định khi chưa có `NetworkPolicy`, toàn bộ cụm K8s giống như một tòa nhà không có cửa khóa giữa các tầng — **mọi Pod ở bất kỳ Namespace nào cũng đều gọi thẳng được vào IP/cổng của mọi Pod khác**!
> **`NetworkPolicy`** đóng vai trò **hệ thống cửa thẻ từ ở tầng IP/Port (Layer 3/4)**: bạn khóa mặc định toàn bộ cửa phòng (`Default Deny`), rồi chỉ quẹt thẻ mở đúng đường từ `web` → `api` và từ `api` → `postgres:5432`!

```visual
kind: compare
title: "Mạng Phẳng Mặc Định (Allow All) vs Tường Lửa Zero-Trust (NetworkPolicy)"
subtitle: "Cô lập kết nối ở tầng IP/Port (Layer 3 / Layer 4) dựa trên nhãn (Labels) của Pod"
left:
  badge: "MẶC ĐỊNH K8S · Mở Toang 100%"
  title: Mọi Namespace thông suốt không rào chắn
  tone: rose
  code: |
    # Chưa có NetworkPolicy:
    [Pod: landing-page (ns: marketing)]
           │  (Kết nối thẳng không ai chặn!)
           ▼
    [Pod: postgres:5432 (ns: production)]
  lang: text
  bullets:
    - "Tạo `Namespace` mới **KHÔNG tự động dựng tường lửa mạng** ngăn cách các Pod"
    - "Chỉ cần 1 container ngoại vi bị xâm nhập, kẻ tấn công tự do dò quét ngang (*Lateral Movement*) khắp toàn cụm"
right:
  badge: "ZERO-TRUST · Default Deny + Whitelist"
  title: Khóa cửa mặc định · Chỉ mở đúng luồng hợp lệ
  tone: emerald
  code: |
    spec:
      podSelector: {}       # Khớp TẤT CẢ Pod trong Namespace!
      policyTypes:
        - Ingress           # Bỏ trống ingress -> Chặn 100% chiều vào!
  lang: yaml
  bullets:
    - "**Bước 1 (`default-deny`):** Dùng đối tượng rỗng ==`podSelector: {}`== khóa sạch 100% kết nối gọi vào mọi Pod trong Namespace"
    - "**Bước 2 (`Additive Whitelist`):** Thêm luật cho phép có chọn lọc — nhiều `NetworkPolicy` cùng nhắm tới 1 Pod sẽ **cộng gộp (hợp)** các nguồn hợp lệ!"
```

> [!WARNING] Hai cái bẫy thực tế khi bật `NetworkPolicy` lần đầu
> 1. **Phải có CNI Plugin hỗ trợ thực thi:** API Server chỉ lưu tờ giấy luật `NetworkPolicy`, còn người chặn gói tin thực sự là **CNI Plugin** (**`Cilium`** eBPF, **`Calico`**, `Antrea`). Nếu cụm dùng mạng tối giản không hỗ trợ (như `flannel` thuần), luật sẽ bị phớt lờ âm thầm!
> 2. **Đừng tự khóa mù DNS cổng `53`:** Nếu bạn bật `policyTypes: ["Egress"]` (kiểm soát chiều đi ra), hãy luôn nhớ mở cổng `UDP/TCP 53` sang `kube-system` để Pod vẫn hỏi được danh bạ `CoreDNS`!

### Hai bước thiết lập Zero-Trust chuẩn mực (`networking.k8s.io/v1`):

1. **Bước 1 — Khóa chặt cửa vào bằng `default-deny-ingress`:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}         # Áp dụng cho toàn bộ Pod trong Namespace hiện tại
  policyTypes:
    - Ingress             # Không có mục ingress: -> Từ chối 100% kết nối gọi vào!
```

2. **Bước 2 — Mở đường có chọn lọc (Chỉ cho `shop-api` gọi vào `postgres:5432`):**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-postgres
spec:
  podSelector:
    matchLabels:
      app: postgres       # Bảo vệ các Pod Database
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: shop-api   # CHỈ nhận kết nối từ các Pod của shop-api
      ports:
        - protocol: TCP
          port: 5432
```

## 2. Helm Charts: Trình quản lý gói (`Package Manager`) của Kubernetes

Thay vì nhân bản hàng chục tệp YAML gần giống hệt nhau giữa `staging` và `production`, **Helm** gom toàn bộ tài nguyên của ứng dụng vào một gói duy nhất gọi là **Helm Chart**, kết hợp khuôn mẫu động (`templates/`) với tệp tham số (`values.yaml`)!

```visual
kind: groups
title: Giải Phẫu Cấu Trúc Một Gói Helm Chart Chuẩn [!badge:sky:Package Manager]
subtitle: "Ánh xạ trực tiếp sang tư duy quản lý gói quen thuộc (pyproject.toml / package.json)"
columns: 2
items:
  - num: 1
    icon: file-code
    title: Chart.yaml
    badge: Định danh gói Chart
    tone: sky
    desc: Khai báo siêu dữ liệu của gói giống pyproject.toml hay package.json.
    bullets:
      - "Chứa tên gói (`name`), phiên bản Chart (`version`), phiên bản ứng dụng (`appVersion`) và các gói phụ thuộc (`dependencies`)"
    code: |
      apiVersion: v2
      name: shop-api
      version: 1.2.0
      appVersion: "2.1.0"
    codeLang: yaml
  - num: 2
    icon: code
    title: "templates/*.yaml"
    badge: Khuôn mẫu động
    tone: cyan
    desc: Các tệp YAML chứa biểu thức nội suy Go Template.
    bullets:
      - "Đọc giá trị từ `.Values`, hỗ trợ hàm mặc định như `{{ .Values.replicaCount | default 2 }}`"
    code: |
      spec:
        replicas: {{ .Values.replicaCount | default 2 }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
    codeLang: yaml
  - num: 3
    icon: settings
    title: values.yaml
    badge: Cấu hình mặc định gốc
    tone: emerald
    desc: Bộ thông số mặc định đi kèm sẵn bên trong Chart.
    bullets:
      - "Cung cấp giá trị an toàn mặc định cho `replicaCount`, `image.repository`, `resources`..."
    code: |
      replicaCount: 3
      image:
        repository: ghcr.io/acme/shop-api
        tag: "2.1.0"
    codeLang: yaml
  - num: 4
    icon: rocket
    title: "values-staging.yaml / values-prod.yaml"
    badge: Ghi đè theo môi trường
    tone: amber
    desc: Truyền cờ -f lúc triển khai và hỗ trợ quay lui toàn bộ gói.
    bullets:
      - "Lệnh chuẩn idempotent (vừa cài mới nếu chưa có, vừa nâng cấp nếu đã có): ==`helm upgrade --install`=="
      - "Lưu lịch sử **Release Revision** để quay lui đồng bộ cả 8 tài nguyên bằng `helm rollback`"
    code: |
      helm upgrade --install shop ./chart -f values-prod.yaml
      helm rollback shop 1
    codeLang: shell
```

## 3. Góc nhìn năm 2026: Chọn `Helm` hay `Kustomize` (`kubectl apply -k`) & Chu trình GitOps?

Trong hệ sinh thái Kubernetes 2026, không phải lúc nào bạn cũng bắt buộc dùng khuôn mẫu `{{ ... }}` của Helm! Cộng đồng sử dụng song song **hai trường phái đóng gói bổ trợ hoàn hảo cho nhau**:

```visual
kind: compare
title: "So Sánh Hai Chuẩn Đóng Gói Cấu Hình K8s Năm 2026: Helm vs Kustomize"
subtitle: "Cả hai đều được hỗ trợ hạng nhất (first-class) bên trong ArgoCD và Flux GitOps!"
left:
  badge: "TEMPLATING + PACKAGE · Helm v3/v4"
  title: Khuôn mẫu động & Kho gói cộng đồng
  tone: sky
  code: |
    # Cài đặt gói bên thứ ba hoặc app đa biến số:
    helm upgrade --install shop ./chart \
      -f values-prod.yaml
  lang: shell
  bullets:
    - "**Cơ chế:** Dùng cú pháp khuôn mẫu `{{ .Values.xxx }}` để sinh ra YAML"
    - "**Mạnh nhất khi:** Cài đặt phần mềm hạ tầng bên thứ ba (`cert-manager`, `Envoy Gateway`, `Prometheus`, `CloudNativePG`) hoặc đóng gói sản phẩm phân phối cho nhiều khách hàng"
    - "Tích hợp sẵn quản lý vòng đời bản phát hành (`helm list`, `helm rollback`)"
right:
  badge: "NATIVE YAML OVERLAYS · Kustomize"
  title: Tích hợp sẵn trong kubectl apply -k
  tone: emerald
  code: |
    # Áp lớp ghi đè (overlay) không cần sửa YAML gốc:
    # base/deployment.yaml + overlays/prod/kustomization.yaml
    kubectl apply -k overlays/prod
  lang: shell
  bullets:
    - "**Cơ chế:** Giữ nguyên **100% tệp YAML thuần hợp lệ** ở `base/`, rồi đắp các bản vá nhỏ (`patches`, đổi `replicas`, nâng `newTag` image) ở từng thư mục `overlays/staging`, `overlays/prod`"
    - "**Mạnh nhất khi:** Quản lý các microservice nội bộ (Python, Node.js, Go) của công ty — đọc dễ hiểu, không sợ lỗi thụt lề Go Template, chạy sẵn bằng **`kubectl apply -k`** không cần cài thêm CLI!"
```

> [!TIP] Bức tranh tự động hóa doanh nghiệp: GitOps với `ArgoCD` / `Flux`
> Trên Production năm 2026, kỹ sư không ngồi gõ tay `kubectl apply` hay `helm upgrade` từ laptop cá nhân nữa! Mọi thay đổi (`values-prod.yaml` của Helm hoặc `kustomization.yaml` của Kustomize) đều được commit lên Git, và bộ điều khiển **GitOps (`ArgoCD` hoặc `Flux`)** nằm trong cụm sẽ tự động kéo về đồng bộ — biến Git thành nguồn sự thật duy nhất (*Single Source of Truth*).
> *(Bạn có thể mở ứng dụng **CI/CD & GitOps Mastery** để thực hành trọn vẹn quy trình tự động hóa đó!)*

> [!REMEMBER] Ghi nhớ bỏ túi
> - Mặc định mạng K8s là **Allow All xuyên mọi Namespace** · `NetworkPolicy` đòi hỏi **CNI hỗ trợ** (**Cilium / Calico / Antrea**) mới chặn gói tin thực tế!
> - **`podSelector: {}`** khớp toàn bộ Pod trong Namespace · Nhiều luật `NetworkPolicy` hoạt động theo kiểu **cộng gộp cho phép (*Additive Whitelist*)**.
> - Chọn **`Helm`** (`Chart.yaml` + `values.yaml`, `helm upgrade --install`) khi cần đóng gói giàu tham số/cài gói bên thứ ba; chọn **`Kustomize`** (`base/` + `overlays/`, `kubectl apply -k`) khi ưu tiên lớp phủ YAML thuần gọn sạch cho GitOps.
