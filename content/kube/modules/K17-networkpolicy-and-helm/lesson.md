# Tường lửa Mạng Zero-Trust & Đóng gói Ứng dụng: NetworkPolicy & Helm Charts

Bạn đã đi được một chặng đường rất xa: từ đóng gói container, triển khai Deployment không gián đoạn, định tuyến qua Service/Ingress, quản lý lưu trữ PVC cho tới gia cố `securityContext` và RBAC. Ở chặng cuối của Level 5, chúng ta giải quyết hai bài toán kiến trúc lớn còn lại trước khi bước ra môi trường doanh nghiệp quy mô lớn:

- [!] **Về mạng nội bộ:** Mặc định trong Kubernetes, mạng nội bộ phẳng hoàn toàn — làm sao chặn đứng việc một Pod Frontend bị xâm nhập tự ý kết nối thẳng vào cổng `5432` của PostgreSQL?
- [!] **Về quản lý cấu hình:** Khi một dịch vụ cần tới 8 tệp YAML (`Deployment`, `Service`, `Ingress`, `HPA`, `ConfigMap`, `ServiceAccount`, `NetworkPolicy`...) nhân lên cho 4 môi trường (`dev`, `qa`, `staging`, `prod`), làm sao thoát khỏi *"địa ngục Copy-Paste 32 tệp YAML"*?

Câu trả lời chính là cặp công cụ tiêu chuẩn: {sky:`NetworkPolicy`} và trình quản lý gói ==`Helm`==!

```visual
kind: illustration
diagram: "kube:k17"
alt: "Tường lửa mạng nội bộ Zero-Trust với NetworkPolicy (Default Deny + Whitelist + DNS Egress 53) và bộ máy đóng gói biểu mẫu Helm Chart"
title: "Giải Phẫu Tường Lửa Mạng Zero-Trust (NetworkPolicy) & Khuôn Đúc Gói Helm v3"
subtitle: "Khoá chặt lưu lượng ngang Đông-Tây giữa các tầng dịch vụ và tái sử dụng một bộ khuôn mẫu YAML duy nhất cho mọi môi trường"
caption: "Mô hình tường lửa Pod-to-Pod thực thi bởi Cilium/Calico (nhớ mở cổng 53 cho CoreDNS) và quy trình kết xuất bản phát hành của Helm Chart"
callouts:
  - num: 1
    label: "Zero-Trust NetworkPolicy: Khoá mặc định & Mở chọn lọc"
    desc: "Áp dụng default-deny (podSelector: {}) chặn 100% kết nối lạ, sau đó chỉ mở đúng luồng hợp lệ từ web -> api -> postgres:5432."
    tone: emerald
  - num: 2
    label: "Lưu ý sống còn khi khoá chiều ra (Egress) — Cổng 53 DNS"
    desc: "Khi bật kiểm soát Egress, luôn phải mở cổng UDP/TCP 53 sang kube-system để Pod không bị mù phân giải tên miền CoreDNS."
    tone: cyan
  - num: 3
    label: "Helm Chart — Tách khuôn templates/ và thông số values.yaml"
    desc: "Loại bỏ hoàn toàn cảnh sao chép hàng chục tệp YAML thủ công và hỗ trợ tự động quay lui an toàn với cờ --atomic."
    tone: violet
```

## 1. Sự thật bất ngờ: Mặc định mạng Kubernetes mở toang 100%!

Theo thiết kế mặc định của Kubernetes khi bạn **chưa tạo bất kỳ `NetworkPolicy` nào**, ==mọi Pod ở bất kỳ Namespace nào cũng đều có thể kết nối trực tiếp tới mọi Pod khác trên toàn cụm== (*Allow All*)! Nếu trang Landing Page tiếp thị ở namespace `marketing` bị dính lỗ hổng bảo mật, kẻ tấn công từ đó có thể quét mạng và gõ thẳng vào cổng `5432` của Database thanh toán ở namespace `production`!

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
    - "Chỉ cần 1 container ngoại vi bị xâm nhập, tin tặc tự do dò quét ngang (*Lateral Movement*) khắp toàn cụm"
right:
  badge: "ZERO-TRUST · Default Deny + Whitelist"
  title: Khoá cửa mặc định · Chỉ mở đúng luồng hợp lệ
  tone: emerald
  code: |
    spec:
      podSelector: {}       # Khớp TẤT CẢ Pod trong Namespace!
      policyTypes:
        - Ingress           # Bỏ trống ingress -> Chặn 100% chiều vào!
  lang: yaml
  bullets:
    - "**Bước 1 (`default-deny`):** Dùng đối tượng rỗng ==`podSelector: {}`== khoá sạch 100% kết nối gọi vào mọi Pod trong Namespace"
    - "**Bước 2 (`Additive Whitelist`):** Thêm luật cho phép có chọn lọc — nhiều `NetworkPolicy` cùng nhắm tới 1 Pod sẽ **cộng gộp (hợp)** các nguồn hợp lệ!"
```

> [!WARNING] Điều kiện bắt buộc: Phải có CNI Plugin hỗ trợ thực thi!
> Bản thân API Server của Kubernetes **chỉ lưu trữ bản thiết kế luật `NetworkPolicy`**, còn việc chặn gói tin thực tế dưới nhân Linux do **CNI Plugin** đảm nhiệm (như **Cilium**, **Calico**, **Antrea**, Weave Net). Nếu cụm dùng mạng cơ bản không hỗ trợ như `flannel` thuần tuý, các tệp `NetworkPolicy` sẽ **bị phớt lờ âm thầm** mà không báo lỗi!

### Hai bước thiết lập Zero-Trust chuẩn mực (`networking.k8s.io/v1`):

1. **Bước 1 — Khoá chặt cửa vào bằng `default-deny-ingress`:** Cú pháp `podSelector: {}` áp dụng cho **tất cả mọi Pod** trong Namespace hiện tại; khai báo `policyTypes: ["Ingress"]` mà cố tình bỏ trống mục `ingress:` sẽ từ chối 100% kết nối chiều vào:

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

2. **Bước 2 — Mở đường có chọn lọc (Chỉ cho `shop-api` gọi vào `postgres:5432`):** Vì `NetworkPolicy` mang tính **cộng gộp (*Additive Whitelist* — không có luật Deny đè Allow)**, gói tin được đi qua nếu thoả mãn ít nhất một chính sách cho phép:

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

## 2. Helm Charts: "`npm` và `package.json` của thế giới Kubernetes"

> [!ANALOGY] Ánh xạ từ Node.js / Handlebars sang Helm trong 30 giây
> Thay vì nhân bản hàng chục tệp YAML gần giống hệt nhau giữa `staging` và `production`, **Helm** gom toàn bộ tài nguyên của ứng dụng vào một gói duy nhất gọi là **Helm Chart**, kết hợp khuôn mẫu động (`templates/`) với tệp tham số (`values.yaml`)!

```visual
kind: groups
title: Giải Phẫu Cấu Trúc Một Gói Helm Chart Chuẩn [!badge:sky:Package Manager]
subtitle: "Ánh xạ trực tiếp sang tư duy quản lý gói quen thuộc của lập trình viên Node.js / npm"
columns: 2
items:
  - num: 1
    icon: file-code
    title: Chart.yaml
    badge: Tương đương package.json
    tone: sky
    desc: Khai báo siêu dữ liệu định danh của gói Helm Chart.
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
    tone: violet
    desc: Các tệp YAML chứa biểu thức nội suy Go Template.
    bullets:
      - "Đọc giá trị từ `.Values`, hỗ trợ hàm đường ống như `{{ .Values.replicaCount | default 2 }}` (nếu `values.yaml` truyền `5` thì ra `5`, chỉ dùng `2` khi bị bỏ trống)"
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

## 3. Chuyển tiếp sang bức tranh tự động hoá: Từ Helm đến **CI/CD & GitOps (ArgoCD)**

Trong môi trường doanh nghiệp năm 2026, không một kỹ sư nào ngồi gõ tay `kubectl apply` hay `helm upgrade` từ laptop cá nhân lên cụm Production nữa! Toàn bộ chu trình được khép kín tự động bằng **CI/CD + GitOps**:

```visual
kind: flow
title: Chu Trình Phát Hành Tự Động Hoá Doanh Nghiệp (Helm + CI/CD + GitOps)
subtitle: Git trở thành nguồn chân lý duy nhất (Single Source of Truth) điều khiển cụm Production
steps:
  - icon: git-commit
    badge: 1. Lập trình viên
    title: Git Push Code
    desc: Đẩy mã nguồn Node.js mới lên nhánh chính GitHub / GitLab
    code: "git push origin main"
    tone: sky
    edge: kích hoạt CI
  - icon: package
    badge: 2. Đường ống CI
    title: Test & Build Image
    desc: Chạy kiểm thử, đóng gói Multi-stage Image và đẩy lên kho GHCR
    code: "shop-api:2.1.0"
    tone: violet
    edge: cập nhật tag
  - icon: folder-git
    badge: 3. Kho cấu hình
    title: Cập nhật values-prod.yaml
    desc: CI tự động nâng tag phiên bản mới vào tệp tham số Helm trên Git
    code: 'tag: "2.1.0"'
    tone: amber
    edge: tự động kéo về
  - icon: refresh
    badge: 4. GitOps Controller
    title: ArgoCD / Flux Đồng Bộ
    desc: Phát hiện thay đổi trên Git và tự động render + đồng bộ Helm Chart vào cụm K8s!
    code: "Synced & Healthy"
    tone: emerald
```

*(Bạn có thể nhấn nút chuyển sang ứng dụng **CI/CD Architecture** ngay bên dưới bài học để chinh phục trọn vẹn nửa mảnh ghép tự động hoá đó!)*

> [!REMEMBER] Ghi nhớ bỏ túi
> - Mặc định mạng K8s là **Allow All xuyên mọi Namespace** · `NetworkPolicy` đòi hỏi **CNI hỗ trợ** (**Cilium / Calico / Antrea**) mới chặn gói tin thực tế!
> - **`podSelector: {}`** khớp toàn bộ Pod trong Namespace · Nhiều luật `NetworkPolicy` hoạt động theo kiểu **cộng gộp cho phép (*Additive Whitelist*)**.
> - Trong Helm: **`Chart.yaml`** giống `package.json`, **`values.yaml`** chứa biến mặc định, và lệnh triển khai chuẩn là **`helm upgrade --install <release> <chart> -f values-prod.yaml`**.
