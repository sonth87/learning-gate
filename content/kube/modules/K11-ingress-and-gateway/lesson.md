# Đưa ứng dụng ra Internet với Ingress, TLS HTTPS & Góc nhìn Gateway API 2026

Ở bài `K10`, bạn đã biết rằng một `Service` kiểu `LoadBalancer` trên AWS hay Google Cloud sẽ cấp cho bạn một địa chỉ IP công cộng ngoài Internet. Nhưng hãy làm một phép tính kinh tế thực tế:

- [!] Giả sử hệ thống thương mại điện tử của bạn có **20 microservices** (`auth`, `catalog`, `cart`, `orders`, `web-ui`...).
- [!] Nếu mỗi microservice đều tạo 1 `Service` kiểu `LoadBalancer` riêng, bạn phải trả tiền thuê **20 bộ cân bằng tải đám mây** hàng tháng (tốn hàng trăm USD vô ích), đồng thời phải quản lý rời rạc 20 tên miền/IP và 20 chứng chỉ SSL!

Giải pháp chuẩn công nghiệp là đặt ==một cổng gác HTTP/HTTPS thông minh duy nhất ở tầng 7 (Layer 7)== đứng đầu cụm: chỉ thuê **đúng 1 Cloud LoadBalancer duy nhất**, gom toàn bộ chứng chỉ TLS HTTPS về một đầu mối rồi phân luồng vào từng `ClusterIP Service` nội bộ theo Hostname và URL Path (`/api`, `/`). Đó chính là vai trò của **`Ingress`** (cùng thế hệ kế nhiệm **Gateway API**).

## 1. Phân biệt Ingress Resource (Bản luật) và Ingress Controller (Người gác cổng)

> [!WARNING] Bẫy số 1 khi mới học Ingress: Tờ giấy luật vs Người gác cổng thực thi!
> Bản thân tệp YAML `kind: Ingress` **chỉ là một tờ giấy ghi luật định tuyến**! Nếu cụm của bạn (ví dụ cụm `kind` hoặc `kubeadm` mới dựng) chưa cài đặt một Pod **Ingress Controller** đang chạy thực tế (như `ingress-nginx`, `Traefik`, `HAProxy` hoặc `AWS Load Balancer Controller`), thì việc gõ `kubectl apply -f ingress.yaml` **hoàn toàn không mở cổng nhận lưu lượng Internet**!

```visual
kind: flow
title: Luồng Lưu Lượng Internet Qua 1 LoadBalancer & Ingress Controller Tầng 7
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
    badge: 2. Người gác cổng
    title: Ingress Controller
    desc: Pod Nginx / Envoy / Traefik đọc Secret shop-tls-cert để giải mã HTTPS ở cửa ngõ
    code: "TLS Termination"
    tone: emerald
    edge: đọc luật Ingress YAML
  - icon: workflow
    badge: 3. Rẽ nhánh URL
    title: Định Tuyến Layer 7
    desc: Khớp Hostname & Path — đường dẫn /api rẽ sang api-svc:3000, còn / rẽ sang web-svc:80
    code: "/api -> api-svc | / -> web-svc"
    tone: violet
    edge: HTTP nội bộ gọn nhẹ
  - icon: boxes
    badge: 4. Đích nội bộ
    title: Pods Microservices
    desc: Ứng dụng Node.js & React chạy HTTP thuần an toàn đằng sau các ClusterIP Service
    code: "Pods :3000 & :80"
    tone: amber
```

## 2. Cấu trúc chuẩn của `networking.k8s.io/v1` Ingress [!badge:sky:Chuẩn K8s 1.30+]

Hãy quan sát một Manifest `Ingress` chuẩn ổn định hiện đại (`apiVersion: networking.k8s.io/v1` — thay thế hoàn toàn các nhánh cũ `extensions/v1beta1` và `networking.k8s.io/v1beta1` đã bị gỡ bỏ):

```yaml Manifest Ingress chuẩn hiện đại (networking.k8s.io/v1) kèm TLS HTTPS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
spec:
  ingressClassName: nginx     # Chỉ định bộ điều khiển nào tiếp nhận luật này
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
subtitle: Nắm chắc 4 trường này để không dính lỗi cú pháp từ các bài hướng dẫn v1beta1 lỗi thời trên mạng
items:
  - keyword: ingressClassName
    role: Chọn bộ điều khiển
    tone: sky
    summary: Đặt trực tiếp dưới `spec:` để chỉ định lớp Ingress Controller nào xử lý bản luật này.
    bullets:
      - "Thay thế chính thức cho kiểu viết cũ bằng annotation `kubernetes.io/ingress.class` thời K8s cũ"
    example: "spec:\n  ingressClassName: nginx"
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
    role: Cấu trúc đích mới (1.19+)
    tone: violet
    summary: Tách tường minh tên Service và số cổng (hoặc tên cổng) bên dưới khoá `service:`.
    bullets:
      - "Không còn viết gộp `serviceName` / `servicePort` như bản nháp `v1beta1` ngày xưa nữa!"
    example: "backend:\n  service:\n    name: api-svc\n    port:\n      number: 3000"
    lang: yaml
  - keyword: spec.tls & secretName
    role: Giải mã HTTPS ở cửa ngõ
    tone: amber
    summary: Tham chiếu tới một Kubernetes `Secret` (cùng namespace với Ingress) kiểu `kubernetes.io/tls`.
    bullets:
      - "Secret này lưu cặp chứng chỉ công khai **`tls.crt`** và khoá riêng **`tls.key`** (thường được **`cert-manager`** tự động xin cấp & gia hạn từ Let's Encrypt)"
      - "Nhờ TLS Termination ở cửa ngõ, code Node.js bên trong chỉ cần chạy HTTP thuần trên cổng `3000`"
    example: "tls:\n  - hosts: [shop.example.com]\n    secretName: shop-tls-cert"
    lang: yaml
```

## 3. Bức tranh năm 2026: Sự chuyển giao từ Ingress sang Kubernetes Gateway API

Dù `Ingress` (`networking.k8s.io/v1`) vẫn đang chạy ổn định trong ~90% dự án hiện hữu, nó vướng một hạn chế thiết kế: muốn chia tải Canary (`90%` bản cũ / `10%` bản mới), sửa HTTP Header hay Rate Limit, bạn phải nhồi hàng chục dòng `annotations:` riêng của Nginx không tương thích với Envoy hay Istio.

Vì vậy, cộng đồng Kubernetes đã chuẩn hoá ==Gateway API (`gateway.networking.k8s.io/v1`)== làm thế hệ kế nhiệm dài hạn:

```visual
kind: compare
title: So Sánh Ingress Kinh Điển vs Thế Hệ Mới Kubernetes Gateway API (2026)
subtitle: Sự tiến hoá từ một tệp YAML kiêm nhiệm sang kiến trúc phân quyền đa đội ngũ & Canary chuẩn gốc
left:
  badge: "HIỆN HỮU PHỔ BIẾN · Ingress"
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
    - "**Mô hình quyền hạn:** Gom chung cấu hình hạ tầng TLS và đường dẫn ứng dụng vào cùng 1 tệp YAML"
    - "**Tính năng nâng cao (Canary, Rewrite, Rate Limit):** Phải phụ thuộc vào rừng `annotations` đặc thù riêng của từng hãng (Nginx, Traefik)"
    - "**Lời khuyên 2026:** Bắt buộc nắm vững vì 90% hệ thống Production hiện có đang vận hành trên `Ingress`"
right:
  badge: "THẾ HỆ KẾ NHIỆM · Gateway API"
  title: gateway.networking.k8s.io/v1
  tone: emerald
  code: |
    apiVersion: gateway.networking.k8s.io/v1
    kind: HTTPRoute
    spec:
      rules:
        - backendRefs:
            - { name: api-v1, port: 3000, weight: 90 }
            - { name: api-v2, port: 3000, weight: 10 }
  lang: yaml
  bullets:
    - "**Tách bạch vai trò:** Đội Hạ tầng quản lý cổng & TLS qua `GatewayClass` + **`Gateway`**; từng đội Dev tự viết luật định tuyến riêng qua ==`HTTPRoute`=="
    - "**Hỗ trợ chuẩn gốc trong `spec`:** Chia trọng số Canary (`backendRefs[].weight`), khớp Header và viết lại URL mà không cần annotation riêng lẻ"
    - "**Lời khuyên 2026:** Ưu tiên chọn khi thiết kế cụm mới đa đội dự án (multi-team) hoặc cần Canary nâng cao"
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **1 Ingress Controller** + nhiều `ClusterIP Service` giúp chỉ tốn **1 Cloud LoadBalancer duy nhất** và tập trung quản lý HTTPS.
> - Tệp `kind: Ingress` (`apiVersion: networking.k8s.io/v1`) vô tác dụng nếu cụm chưa chạy Pod **Ingress Controller** · Luôn khai báo `spec.ingressClassName`, `pathType` (`Prefix` / `Exact`), và `spec.tls[].secretName` (Secret chứa `tls.crt` + `tls.key`).
> - Trong **Gateway API** (`gateway.networking.k8s.io/v1`), hạ tầng cổng nằm ở `Gateway`, còn đội phát triển viết luật HTTP & Canary ở **`HTTPRoute`**.
