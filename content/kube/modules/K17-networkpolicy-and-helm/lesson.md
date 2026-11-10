# Tường lửa Mạng Zero-Trust & Đóng gói Ứng dụng: NetworkPolicy & Helm Charts

Bạn đã đi được một chặng đường rất xa: từ đóng gói container, triển khai Deployment không gián đoạn, định tuyến qua Service/Ingress, quản lý lưu trữ PVC cho tới gia cố `securityContext` và RBAC. Ở chặng cuối của Level 5, chúng ta giải quyết hai bài toán kiến trúc lớn còn lại trước khi bước ra môi trường doanh nghiệp quy mô lớn:

1. **Về mạng nội bộ:** Mặc định trong Kubernetes, mạng nội bộ phẳng hoàn toàn — làm sao chặn đứng việc một Pod Frontend bị xâm nhập tự ý kết nối thẳng vào cổng `5432` của PostgreSQL?
2. **Về quản lý cấu hình:** Khi một dịch vụ cần tới 8 tệp YAML (`Deployment`, `Service`, `Ingress`, `HPA`, `ConfigMap`, `ServiceAccount`, `NetworkPolicy`...) nhân lên cho 4 môi trường (`dev`, `qa`, `staging`, `prod`), làm sao thoát khỏi "địa ngục Copy-Paste 32 tệp YAML"?

Câu trả lời chính là cặp công cụ tiêu chuẩn: **`NetworkPolicy`** và trình quản lý gói **`Helm`**!

---

## 1. Sự thật bất ngờ: Mặc định mạng Kubernetes mở toang 100%!

Theo thiết kế mặc định của Kubernetes, **mọi Pod trong bất kỳ Namespace nào cũng đều có thể gửi gói tin trực tiếp tới mọi Pod ở tất cả các Namespace khác** mà không hề bị chặn! Hãy hình dung nếu trang Landing Page tiếp thị ở namespace `marketing` bị dính lỗ hổng bảo mật, kẻ tấn công từ đó có thể quét mạng và gõ thẳng vào cổng `5432` của Database thanh toán ở namespace `production`!

Để dựng tường lửa ở tầng IP/Port (Layer 3 / Layer 4) giữa các Pod (với điều kiện cụm dùng CNI hỗ trợ như **Cilium**, **Calico** hoặc **Antrea**), ta dùng **`NetworkPolicy` (`networking.k8s.io/v1`)** theo triết lý **Zero-Trust: Chặn tất cả mặc định (Default Deny), chỉ mở đúng luồng cần thiết (Explicit Allow)**.

### Bước 1 — Khoá chặt cửa vào bằng chính sách `default-deny-ingress`:
Một mẹo cú pháp cực kỳ quan trọng trong `NetworkPolicy`:
- `podSelector: {}` (đối tượng rỗng) có nghĩa là **áp dụng cho TẤT CẢ mọi Pod** trong Namespace hiện tại!
- Khi khai báo `policyTypes: ["Ingress"]` mà **cố tình bỏ trống không viết trường `ingress:`**, Kubernetes hiểu là: *"Không cho phép bất kỳ gói tin chiều vào (Ingress) nào tới các Pod này cả!"*

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}         # Áp dụng cho toàn bộ Pod trong Namespace này
  policyTypes:
    - Ingress             # Không có mục ingress: -> Từ chối 100% kết nối gọi vào!
```

### Bước 2 — Mở đường có chọn lọc (Ví dụ: Chỉ cho `shop-api` gọi vào `postgres:5432`):
Các `NetworkPolicy` trong K8s hoạt động theo tính chất **cộng gộp (Additive Whitelist)**. Ngay khi ta thêm một luật cho phép mới nhắm vào các Pod mang nhãn `app: postgres`, chỉ duy nhất các Pod mang nhãn `app: shop-api` mới đi qua được cổng TCP `5432`:

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

---

## 2. Helm Charts: "`npm` và `package.json` của thế giới Kubernetes"

Nếu bạn từng dùng công cụ tạo khuôn mẫu (template engine) như Handlebars/EJS trong Node.js, bạn sẽ hiểu **Helm** chỉ trong 30 giây! Thay vì nhân bản hàng chục tệp YAML gần giống hệt nhau giữa `staging` và `production` (chỉ khác nhau mỗi số `replicas`, mức RAM và tên miền), **Helm** gom toàn bộ tài nguyên của ứng dụng vào một gói duy nhất gọi là **Helm Chart**:

| Tệp / Thư mục trong Helm Chart | Liên hệ trực tiếp với dự án Node.js / npm |
| --- | --- |
| **`Chart.yaml`** | Giống hệt **`package.json`**: khai báo tên gói (`name`), phiên bản Chart (`version`), phiên bản ứng dụng (`appVersion`) và các gói phụ thuộc (`dependencies`). |
| **`templates/*.yaml`** | Các tệp khuôn mẫu K8s chứa biến động dạng `{{ .Values.replicaCount }}` để sinh ra YAML hoàn chỉnh. |
| **`values.yaml`** | Bộ thông số cấu hình **mặc định gốc** của ứng dụng. |
| **`values-staging.yaml` / `values-prod.yaml`** | Các tệp ghi đè thông số riêng cho từng môi trường khi chạy `helm upgrade --install shop ./chart -f values-prod.yaml`. |

### Cách hoạt động của khuôn mẫu `templates/` + `values.yaml`:
Giả sử tệp khuôn mẫu `templates/deployment.yaml` viết:
```yaml
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```
Khi bạn truyền vào tệp `values.yaml`:
```yaml
replicaCount: 3
image:
  repository: ghcr.io/acme/shop-api
  tag: "2.1.0"
```
Helm sẽ kết xuất (render) ra chính xác một bản Manifest Kubernetes chuẩn chỉnh rồi nộp lên API Server, đồng thời lưu lại lịch sử phiên bản phát hành (Release Revision) để bạn có thể quay lui đồng bộ cả 8 tài nguyên cùng lúc bằng `helm rollback`!

---

## 3. Chuyển tiếp sang bức tranh tự động hoá: Từ Helm đến **CI/CD & GitOps (ArgoCD)**

Trong môi trường doanh nghiệp năm 2026, không một kỹ sư nào ngồi gõ tay `kubectl apply` hay `helm upgrade` từ máy tính cá nhân lên cụm Production nữa! Toàn bộ chu trình sẽ được nối liền tự động:
1. Lập trình viên đẩy code Node.js lên Git → Đường ống **CI (GitHub Actions / GitLab CI)** chạy kiểm thử, đóng gói Multi-stage Docker Image và cập nhật thẻ phiên bản mới `tag: "2.1.0"` vào tệp `values-prod.yaml` trên nhánh Git cấu hình.
2. Trình điều phối **GitOps (ArgoCD / Flux)** nằm trong cụm Kubernetes phát hiện tệp `values-prod.yaml` trên Git vừa thay đổi liền tự động đồng bộ bản Helm Chart mới vào cụm!

*(Bạn có thể nhấn nút chuyển sang ứng dụng **CI/CD Architecture** ngay bên dưới bài học để chinh phục trọn vẹn nửa mảnh ghép tự động hoá đó!)*
