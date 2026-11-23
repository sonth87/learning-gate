# Đưa ứng dụng ra Internet với Ingress, TLS HTTPS & Bước ngoặt Gateway API 2026

Ở bài `K10`, bạn đã biết rằng một `Service` kiểu `LoadBalancer` trên AWS hay Google Cloud sẽ cấp cho bạn một địa chỉ IP công cộng ngoài Internet. Nhưng hãy làm một phép tính kinh tế thực tế:

- [!] Giả sử hệ thống thương mại điện tử của bạn có **20 microservices** (`auth`, `catalog`, `ai-search` bằng Python FastAPI, `orders` bằng Node.js, `web-ui`...).
- [!] Nếu mỗi dịch vụ đều tự mở 1 `Service` kiểu `LoadBalancer` riêng, bạn phải trả tiền thuê **20 bộ cân bằng tải đám mây** hàng tháng (tốn hàng trăm USD vô ích), đồng thời phải quản lý rời rạc 20 địa chỉ IP và 20 chứng chỉ SSL!

Giải pháp chuẩn công nghiệp là đặt ==một cổng gác HTTP/HTTPS thông minh duy nhất ở tầng 7 (Layer 7)== đứng đầu cụm: chỉ thuê **đúng 1 Cloud LoadBalancer duy nhất**, giải mã HTTPS tập trung một chỗ rồi phân luồng vào từng `ClusterIP Service` nội bộ theo tên miền và đường dẫn URL (`/api`, `/ai`, `/`). Đó chính là vai trò của **`Ingress`** và thế hệ chuẩn mới **`Kubernetes Gateway API`**.

```visual
kind: illustration
diagram: "kube:k11"
alt: "Cơ chế Ingress và Gateway API tầng 7 giải mã TLS HTTPS tại 1 Cloud LoadBalancer duy nhất rồi rẽ nhánh Host và Path vào ClusterIP nội bộ"
title: "Cơ Chế Định Tuyến Tầng 7: Ingress / Gateway API, Giải Mã TLS & Rẽ Nhánh Đường Dẫn"
subtitle: "Dùng chung 1 địa chỉ IP công cộng duy nhất cho hàng chục Microservices để tiết kiệm tối đa chi phí Cloud LoadBalancer"
caption: "Luồng lưu lượng HTTPS từ Internet đi qua 1 Cloud LoadBalancer vào Ingress/Gateway Controller để giải mã TLS rồi phân luồng theo Hostname và URL Path"
callouts:
  - num: 1
    label: "1 Cloud LoadBalancer công cộng duy nhất"
    desc: "Thay vì thuê 20 bộ cân bằng tải đắt đỏ cho 20 dịch vụ, toàn bộ lưu lượng HTTPS hội tụ về một địa chỉ IP cửa ngõ duy nhất."
    tone: sky
  - num: 2
    label: "Giải mã TLS & Định tuyến thông minh Layer 7"
    desc: "Controller (Envoy Gateway / Cilium / Traefik / Nginx) đọc Secret để giải mã HTTPS rồi đọc luật Host và Path (/api, /) để rẽ nhánh."
    tone: cyan
  - num: 3
    label: "Chuyển tiếp an toàn vào các ClusterIP nội bộ"
    desc: "Các microservice phía sau nằm kín trong mạng nội bộ dưới dạng ClusterIP và hỗ trợ chia phần trăm Canary chuẩn gốc với Gateway API."
    tone: emerald
```

## 1. Kiến trúc định tuyến HTTP trên K8s: Bản khai báo (`Ingress` / `HTTPRoute`) và Bộ thực thi (`Controller`)

> [!WARNING] Lưu ý quan trọng: Khai báo YAML sẽ không hoạt động nếu cụm thiếu Controller
> Tài nguyên `kind: Ingress` (hoặc `kind: HTTPRoute`) chỉ là **bản khai báo quy tắc định tuyến** lưu trong `etcd`. Để thực sự tiếp nhận lưu lượng mạng, giải mã TLS và chuyển tiếp request theo các quy tắc đó, cụm của bạn bắt buộc phải cài đặt và chạy một **Controller Pod** thực thi thực tế (như **`Envoy Gateway`**, **`Traefik`**, **`Cilium`** hoặc `AWS Load Balancer Controller`). Nếu cụm (ví dụ `kind` hay `minikube` mới tạo) chưa cài Controller, lệnh `kubectl apply -f ingress.yaml` vẫn thành công nhưng sẽ không mở cổng đón khách nào cả (tương tự việc có bảng quy định giao thông nhưng chưa có đơn vị thực thi điều phối tại ngã tư).

```visual
kind: flow
title: Luồng Lưu Lượng Internet Qua 1 LoadBalancer & Bộ Điều Khiển Tầng 7
subtitle: Tiết kiệm chi phí tối đa — 1 IP Public duy nhất giải mã HTTPS rồi rẽ nhánh vào hàng chục ClusterIP nội bộ
steps:
  - icon: globe
    badge: 1. Khách hàng
    title: HTTPS Request
    desc: Trình duyệt gọi vào 1 Cloud LoadBalancer công cộng duy nhất của toàn cụm
    code: "https://shop.example.com/api"
    tone: sky
    edge: giải mã TLS (443)
  - icon: shield-check
    badge: 2. Bộ thực thi
    title: Ingress / Gateway Controller
    desc: Pod Envoy / Cilium / Traefik đọc Secret shop-tls-cert để giải mã HTTPS ở cửa ngõ
    code: "TLS Termination"
    tone: emerald
    edge: đọc luật định tuyến YAML
  - icon: workflow
    badge: 3. Rẽ nhánh URL
    title: Định Tuyến Layer 7
    desc: Khớp Hostname & Path — đường dẫn /api rẽ sang api-svc:3000, còn / rẽ sang web-svc:80
    code: "/api -> api-svc | / -> web-svc"
    tone: cyan
    edge: HTTP nội bộ gọn nhẹ
  - icon: boxes
    badge: 4. Đích nội bộ
    title: Pods Microservices
    desc: Ứng dụng FastAPI, Node.js & React chạy HTTP thuần an toàn đằng sau các ClusterIP Service
    code: "Pods :3000, :8000 & :80"
    tone: amber
```

## 2. Cấu trúc chuẩn của `networking.k8s.io/v1` Ingress [!badge:sky:Chuẩn K8s 1.30+]

Trong phần lớn các hệ thống hiện hữu (và trong đề thi chứng chỉ CKAD/CKA), bạn sẽ gặp Manifest `Ingress` chuẩn ổn định `apiVersion: networking.k8s.io/v1`:

```yaml Manifest Ingress chuẩn hiện đại (networking.k8s.io/v1) kèm TLS HTTPS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
spec:
  ingressClassName: nginx     # Chỉ định bộ điều khiển nào tiếp nhận bản luật này
  tls:
    - hosts:
        - shop.example.com
      secretName: shop-tls-cert
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-svc
                port:
                  number: 3000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-svc
                port:
                  number: 80
```

```visual
kind: anatomy
title: 4 Chi Tiết Kỹ Thuật Bắt Buộc Trong networking.k8s.io/v1 Ingress
subtitle: Nắm chắc 4 trường này để không bao giờ vướng lỗi cú pháp từ các bài viết v1beta1 cũ trên mạng
items:
  - keyword: ingressClassName
    role: Chọn bộ điều khiển
    tone: sky
    summary: Đặt trực tiếp dưới `spec:` để chỉ định lớp Ingress Controller nào xử lý bản luật này.
    bullets:
      - "Thay thế chính thức cho kiểu viết cũ bằng annotation `kubernetes.io/ingress.class` trước đây"
    example: "spec:\n  ingressClassName: traefik"
    lang: yaml
  - keyword: pathType
    role: Kiểu khớp URL (Bắt buộc)
    tone: emerald
    summary: Trường BẮT BUỘC trong mỗi mục `paths[]` — thiếu nó API Server sẽ từ chối ngay!
    bullets:
      - "**`Prefix`:** Khớp theo phân đoạn `/` (`/api` khớp `/api`, `/api/v1`, `/api/orders`, nhưng **không** khớp nhầm `/apikeys`!)"
      - "**`Exact`:** Chỉ khớp chính xác tuyệt đối từng ký tự (`/healthz` chỉ khớp đúng `/healthz`)"
    example: "path: /api\npathType: Prefix"
    lang: yaml
  - keyword: backend.service
    role: Cấu trúc đích chuẩn v1
    tone: cyan
    summary: Tách tường minh tên Service và số cổng (hoặc tên cổng) bên dưới khóa `service:`.
    bullets:
      - "Không còn viết gộp `serviceName` / `servicePort` như bản nháp `v1beta1` ngày xưa nữa!"
    example: "backend:\n  service:\n    name: api-svc\n    port:\n      number: 3000"
    lang: yaml
  - keyword: spec.tls & secretName
    role: Giải mã HTTPS ở cửa ngõ
    tone: amber
    summary: Tham chiếu tới một Kubernetes `Secret` (cùng namespace với Ingress) kiểu `kubernetes.io/tls`.
    bullets:
      - "Secret này lưu cặp chứng chỉ công khai **`tls.crt`** và khóa riêng **`tls.key`** (thường được **`cert-manager`** tự động xin cấp & gia hạn miễn phí từ Let's Encrypt)"
      - "Nhờ TLS Termination ở cửa ngõ, code FastAPI / Node.js bên trong chỉ cần chạy HTTP thuần gọn nhẹ"
    example: "tls:\n  - hosts: [shop.example.com]\n    secretName: shop-tls-cert"
    lang: yaml
```

## 3. Chuyển dịch tiêu chuẩn năm 2026: Từ `Ingress NGINX` sang `Kubernetes Gateway API`

> [!NOTE] Thay đổi quan trọng của hệ sinh thái Kubernetes năm 2026
> Suốt gần một thập kỷ, dự án cộng đồng **`Ingress NGINX` (`kubernetes/ingress-nginx`)** là lựa chọn phổ biến nhất, nhưng cộng đồng Kubernetes đã chính thức thông báo **ngừng phát triển tính năng mới và đưa `ingress-nginx` vào lộ trình nghỉ hưu (retirement)** vì gánh nặng bảo mật từ việc nhồi nhét hàng trăm `annotations` tùy biến!
> Trong năm 2026, toàn ngành dịch chuyển mạnh mẽ sang chuẩn chính thức thế hệ mới ==Kubernetes Gateway API (`gateway.networking.k8s.io/v1`)== được thực thi bởi các bộ máy hiện đại, an toàn và hiệu năng cao như **`Envoy Gateway`**, **`Cilium`** (tích hợp thẳng eBPF trong nhân Linux) và **`Traefik`**.

Tại sao **Gateway API** lại ưu việt hơn hẳn `Ingress` truyền thống?
- Trong `Ingress` cũ, mọi thứ (cổng 443, chứng chỉ TLS hạ tầng lẫn đường dẫn `/api` của đội Dev, rồi cả cấu hình Canary/Rate-Limit bằng rừng `annotations` độc quyền) bị nhồi chung vào **1 tệp YAML duy nhất**.
- Trong **Gateway API**, trách nhiệm được tách làm **2 tầng rành mạch theo đúng vai trò trong công ty**:
  1. **Đội Hạ tầng / Platform** quản lý cổng mạng & chứng chỉ HTTPS thông qua **`GatewayClass`** + **`Gateway`**.
  2. **Từng đội Lập trình viên (Python, Node.js...)** tự quản lý đường dẫn và chia tải Canary trong Namespace của mình thông qua ==`HTTPRoute`== — hoàn toàn chuẩn gốc không cần một dòng annotation kỳ dị nào!

```visual
kind: compare
title: So Sánh Ingress Truyền Thống vs Chuẩn Mới Kubernetes Gateway API (2026)
subtitle: Hiểu cả hai giúp bạn vừa vận hành tốt các cụm hiện hữu, vừa tự tin thiết kế kiến trúc mới chuẩn 2026!
left:
  badge: "HỆ THỐNG HIỆN HỮU · Ingress"
  title: networking.k8s.io/v1
  tone: sky
  code: |
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      annotations:
        nginx.ingress.kubernetes.io/canary-weight: "10"
  lang: yaml
  bullets:
    - "**Mô hình 1 tệp gom chung:** Hạ tầng TLS và đường dẫn ứng dụng nằm lẫn lộn trong 1 manifest"
    - "**Canary / Header Routing / Rewrite:** Phải phụ thuộc vào `annotations` riêng lẻ của từng hãng; dự án `ingress-nginx` cộng đồng đang rút lui"
    - "**Khi nào gặp:** Rất phổ biến trong các cụm hiện có và bài thi nền tảng — bắt buộc phải đọc/viết thành thạo"
right:
  badge: "CHUẨN MẶC ĐỊNH MỚI 2026 · Gateway API"
  title: gateway.networking.k8s.io/v1 (Envoy / Cilium / Traefik)
  tone: emerald
  code: |
    apiVersion: gateway.networking.k8s.io/v1
    kind: HTTPRoute
    spec:
      parentRefs:
        - name: prod-gateway
      rules:
        - backendRefs:
            - { name: api-v1, port: 3000, weight: 90 }
            - { name: api-v2, port: 3000, weight: 10 }
  lang: yaml
  bullets:
    - "**Phân quyền sạch sẽ:** Đội Infra nắm `Gateway` (TLS/IP), đội Dev tự chủ viết `HTTPRoute` (hoặc `GRPCRoute`)"
    - "**Tính năng chuẩn gốc trong `spec`:** Chia phần trăm Canary (`weight: 90` / `10`), khớp Header, sửa URL chạy đồng nhất trên **Envoy Gateway, Cilium, Traefik, Istio, GKE, EKS**"
    - "**Lời khuyên 2026:** Lựa chọn số 1 khi khởi tạo cụm Kubernetes mới!"
```

> [!TIP] Tóm tắt cách chọn bộ điều khiển cửa ngõ năm 2026
> - Dựng cụm mới hoặc thay thế `ingress-nginx` cũ → Ưu tiên **Gateway API** với **`Envoy Gateway`**, **`Cilium`** hoặc **`Traefik`**.
> - Duy trì cụm đang dùng `Ingress` ổn định trên Cloud → Có thể dùng Cloud-native Ingress (`AWS Load Balancer Controller` / `GKE Ingress`) hoặc `Traefik` trước khi lên kế hoạch chuyển sang `HTTPRoute`.

> [!REMEMBER] Ghi nhớ bỏ túi
> - **1 bộ điều khiển cửa ngõ** + nhiều `ClusterIP Service` giúp chỉ tốn **1 Cloud LoadBalancer duy nhất** và tập trung quản lý chứng chỉ HTTPS (`cert-manager`).
> - Tệp `kind: Ingress` (`networking.k8s.io/v1`) vô tác dụng nếu cụm chưa chạy Pod Controller · Luôn khai báo `spec.ingressClassName`, `pathType` (`Prefix` / `Exact`), và `spec.tls[].secretName`.
> - Xu hướng 2026 dịch chuyển từ `ingress-nginx` sang ==Gateway API (`gateway.networking.k8s.io/v1`)== trên nền **Envoy Gateway / Cilium / Traefik**: đội Hạ tầng giữ `Gateway`, đội Dev viết luật HTTP & Canary ở **`HTTPRoute`**.
