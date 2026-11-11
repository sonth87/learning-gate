# Đưa ứng dụng ra Internet với Ingress, TLS HTTPS & Góc nhìn Gateway API 2026

Ở bài `K10`, bạn đã biết rằng một `Service` kiểu `LoadBalancer` trên AWS hay Google Cloud sẽ cấp cho bạn một địa chỉ IP công cộng ngoài Internet. Nhưng hãy làm một phép tính thực tế:
- Giả sử hệ thống thương mại điện tử của bạn có **20 microservices** (`auth`, `catalog`, `cart`, `orders`, `web-ui`...).
- Nếu mỗi microservice đều tạo 1 `Service` kiểu `LoadBalancer` riêng, bạn phải trả tiền thuê **20 bộ cân bằng tải đám mây** hàng tháng (tốn hàng trăm USD vô ích), đồng thời ứng dụng Web phải quản lý 20 tên miền/IP rời rạc và 20 chứng chỉ bảo mật SSL!

Giải pháp chuẩn công nghiệp là đặt **một cổng gác HTTP/HTTPS thông minh duy nhất ở tầng 7 (Layer 7)** đứng đầu cụm, nhận toàn bộ lưu lượng từ tên miền `https://shop.example.com` rồi phân luồng vào từng `ClusterIP Service` nội bộ dựa theo đường dẫn URL (`/api`, `/auth`, `/`). Trong Kubernetes, tài nguyên kinh điển đảm nhận việc đó là **`Ingress`** (cùng người kế nhiệm thế hệ mới là **Gateway API**).

---

## 1. Phân biệt Ingress Resource (Bản luật) và Ingress Controller (Người gác cổng)

Một điều cực kỳ quan trọng cần nhớ: bản thân tệp YAML `kind: Ingress` **chỉ là một tờ giấy ghi luật định tuyến**! Nếu cụm của bạn chưa cài đặt một **Ingress Controller** (như `ingress-nginx`, `Traefik`, `HAProxy` hoặc `AWS Load Balancer Controller`), thì việc nộp tệp `Ingress` lên cụm sẽ không có tác dụng gì cả.

Khi đã có Ingress Controller (chỉ tốn **đúng 1 LoadBalancer công cộng duy nhất**), luồng gói tin đi như sau:

```text
Người dùng (https://shop.example.com/api/orders)
      │
      ▼  [1 LoadBalancer duy nhất ngoài Internet]
[ Ingress Controller (Nginx / Envoy) ]  <-- Giải mã chứng chỉ TLS (shop-tls-cert)
      │
      ├── Nếu đường dẫn bắt đầu bằng "/api"  ──►  Service: api-svc:3000  ──►  Pods API Node.js
      └── Nếu đường dẫn bắt đầu bằng "/"     ──►  Service: web-svc:80    ──►  Pods Giao diện React
```

---

## 2. Cấu trúc chuẩn của `networking.k8s.io/v1` Ingress

Hãy quan sát một Manifest `Ingress` chuẩn hiện đại:

```yaml
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

### Bốn chi tiết kỹ thuật bắt buộc phải nắm vững:
1. **`ingressClassName: nginx`:** Đặt trực tiếp bên trong `spec` (thay thế hoàn toàn cho kiểu viết cũ bằng annotation `kubernetes.io/ingress.class` đã lỗi thời).
2. **`pathType` là trường BẮT BUỘC:**
   - `Prefix`: Khớp theo tiền tố phân tách bởi dấu `/` (ví dụ `/api` khớp cả `/api`, `/api/v1`, `/api/orders`, nhưng **không** khớp nhầm sang `/apikeys`!).
   - `Exact`: Chỉ khớp chính xác tuyệt đối từng ký tự (ví dụ `/healthz` chỉ khớp đúng `/healthz`).
3. **Cấu trúc `backend.service` mới (từ K8s 1.19+):** Không còn viết `serviceName` và `servicePort` như bản nháp `v1beta1` ngày xưa nữa! Chuẩn `networking.k8s.io/v1` tách rõ `backend.service.name` và `backend.service.port.number` (hoặc `port.name`).
4. **Giải mã HTTPS (`spec.tls`):** Chứng chỉ công khai (`tls.crt`) và khoá riêng (`tls.key`) được lưu trong một Kubernetes Secret kiểu `kubernetes.io/tls` (thường được công cụ **`cert-manager`** tự động xin cấp miễn phí và gia hạn từ Let's Encrypt!). Ingress Controller sẽ đứng ra giải mã HTTPS ở cửa ngõ (TLS Termination), nên ứng dụng Node.js bên trong chỉ cần chạy HTTP thuần trên cổng `3000` cực kỳ nhẹ nhàng.

---

## 3. Bức tranh năm 2026: Sự chuyển giao từ Ingress sang **Kubernetes Gateway API**

Dù `Ingress` (`networking.k8s.io/v1`) vẫn cực kỳ phổ biến và xuất hiện trong 90% dự án hiện hữu, nó có một hạn chế thiết kế: khi bạn muốn làm những tác vụ nâng cao như **chia 90% khách vào bản cũ, 10% khách sang bản Canary**, sửa HTTP Header hay giới hạn tốc độ (Rate Limit), bạn phải nhét hàng chục dòng `annotations:` đặc thù riêng của Nginx không tương thích với Envoy hay Istio.

Vì thế, cộng đồng Kubernetes đã chuẩn hoá **Gateway API (`gateway.networking.k8s.io/v1`)** làm thế hệ kế nhiệm dài hạn:
- Tách bạch quyền hạn rõ ràng: Đội Hạ tầng quản lý cổng và TLS thông qua tài nguyên **`Gateway`**, còn từng đội Phát triển ứng dụng tự khai báo đường đi riêng của mình qua **`HTTPRoute`**.
- Tính năng chia trọng số Canary (`weight: 90` / `weight: 10`), viết lại URL và khớp Header đều được tích hợp thành trường chuẩn ngay trong `spec`, không còn phụ thuộc vào rừng annotation riêng lẻ nữa!

| Tiêu chí so sánh | `Ingress` (`networking.k8s.io/v1`) | `Gateway API` (`gateway.networking.k8s.io/v1`) |
| --- | --- | --- |
| **Mô hình quyền hạn** | Chung 1 tệp YAML duy nhất cho cả TLS lẫn đường dẫn ứng dụng. | Tách thành `GatewayClass`, `Gateway` (Hạ tầng) và `HTTPRoute` (Dev). |
| **Chia lưu lượng Canary** | Phải dùng `annotations` riêng của từng hãng (Nginx, Traefik). | Hỗ trợ chuẩn gốc qua trường `backendRefs[].weight`. |
| **Lời khuyên thực tế 2026** | Nắm vững vì 90% hệ thống hiện hữu đang chạy ổn định. | Ưu tiên chọn khi thiết kế cụm mới cần kiến trúc đa đội ngũ (multi-team) hoặc Canary. |

