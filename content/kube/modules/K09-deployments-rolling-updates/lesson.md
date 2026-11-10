# Deployment, Tự chữa lành, Rolling Update không gián đoạn & Rollback tức thì

Ở bài `K08`, bạn đã biết cách viết một `Pod` đơn lẻ. Nhưng có một quy luật sắt đá trong môi trường thực tế: **trên Production, không bao giờ người ta triển khai ứng dụng bằng `Pod` trần (naked Pod)!**

Tại sao vậy? Vì một `Pod` đứng lẻ loi không có người giám hộ: nếu Worker Node chứa nó bị cúp điện hoặc chính bạn lỡ tay `kubectl delete pod shop-web`, chiếc Pod đó **chết vĩnh viễn không bao giờ sống lại**! Để biến những chiếc Pod mỏng manh thành một dịch vụ bất tử có khả năng tự nhân bản và nâng cấp không cần tắt máy (Zero-Downtime), chúng ta trao quyền quản lý cho **`Deployment`**.

---

## 1. Chuỗi phân cấp quyền lực: `Deployment` → `ReplicaSet` → `Pod`

Khi bạn nộp một bản khai báo `Deployment` lên cụm, thực chất có một cấu trúc 3 tầng tự động vận hành:

| Tầng tài nguyên | Vai trò chính xác | Bạn có sửa tay trực tiếp không? |
| --- | --- | --- |
| **`Deployment`** | Quản lý chiến lược **chuyển đổi giữa các phiên bản** (Rolling Update từ `v1.1` lên `v1.2`, lưu lịch sử Revision để Rollback). | **CÓ** — Đây là manifest duy nhất bạn viết và `kubectl apply`. |
| **`ReplicaSet`** | Quản đốc điểm danh quân số của **một phiên bản cụ thể** (luôn canh gác đảm bảo đủ đúng `replicas: 3` Pod đang sống). | **KHÔNG** — Do `Deployment` tự động tạo và điều phối ngầm. |
| **`Pod`** | Tiến trình thực thi thực tế mang tên hậu tố ngẫu nhiên (`shop-api-6b7f8c9-x92lm`). | **KHÔNG** — Nếu Pod sập, `ReplicaSet` tự tạo Pod mới thay thế ngay! |

---

## 2. Nguyên tắc khớp nối sống còn: `selector.matchLabels` ⊆ `template.metadata.labels`

Trong một `Deployment` (`apiVersion: apps/v1`), có hai nơi khai báo nhãn rất dễ làm người mới nhầm lẫn:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shop-api          # (A) Kính lúp để Deployment nhận diện "con của mình"
  template:
    metadata:
      labels:
        app: shop-api        # (B) Con dấu đóng lên trán từng Pod lúc mới đẻ ra!
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/shop-api:1.2.0
```

Hãy tưởng tượng `(B)` là thẻ tên đeo lên áo từng Pod sinh ra từ khuôn mẫu `template`, còn `(A)` là câu truy vấn mà `Deployment` dùng để đếm quân số. **Mọi cặp khoá-giá trị trong `(A)` BẮT BUỘC phải có mặt y hệt trong `(B)`!** Nếu `(A)` ghi `app: api-v1` còn `(B)` ghi `app: shop-api`, Kubernetes API Server sẽ lập tức từ chối tệp YAML với lỗi kinh điển:
`Invalid value: 'selector' does not match template 'labels'`.

---

## 3. Chiến lược nâng cấp không gián đoạn: `RollingUpdate` (`maxUnavailable: 0`)

Khi bạn đổi `image` từ `1.2.0` lên `1.3.0`, mặc định Kubernetes dùng chiến lược **`RollingUpdate`** — tạo thêm một `ReplicaSet` mới cho bản `1.3.0`, tăng dần từng Pod mới đồng thời rút dần từng Pod cũ của `1.2.0`.

Để đảm bảo **Zero-Downtime tuyệt đối** ngay cả ở thời điểm cao điểm (không bao giờ để hụt tổng năng lực phục vụ dưới mức 3 Pod), ta tinh chỉnh hai tham số vàng trong `spec.strategy.rollingUpdate`:

- **`maxUnavailable: 0`:** Trong suốt quá trình nâng cấp, số lượng Pod sẵn sàng phục vụ **không được phép tụt xuống thấp hơn `replicas` ban đầu** dù chỉ 1 Pod!
- **`maxSurge: 1`:** Cho phép cụm tạo vọt thêm tối đa `1` Pod mới vượt trên con số `replicas` (tức tạm thời có `3 + 1 = 4` Pod). Chỉ khi Pod thứ 4 này khởi động xong và báo khoẻ mạnh (`Ready`), Kubernetes mới được phép tắt 1 Pod cũ!

```yaml
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
```

---

## 4. Co giãn nóng (`scale`) và Cứu hoả khẩn cấp (`rollout undo`)

Một trong những khoảnh khắc khiến mọi kỹ sư Node.js yêu Kubernetes nhất là khả năng **quay ngược thời gian trong 2 giây** khi một bản phát hành mới bị lỗi!

Nhờ `Deployment` vẫn giữ lại các `ReplicaSet` cũ trong lịch sử (`revisionHistoryLimit`, mặc định 10 bản), nếu bản `2.0.0-crash` vừa đẩy lên dính lỗi `TypeError` làm Pod rơi vào `CrashLoopBackOff`, bạn không cần cuống cuồng chờ GitHub Actions chạy lại `npm run build` mất 10 phút:

```bash
# 1. Co giãn tức thì số lượng bản sao khi tải tăng đột biến:
kubectl scale deployment/shop-api --replicas=5

# 2. Xem lịch sử các lần cập nhật (Revision) của Deployment:
kubectl rollout history deployment/checkout

# 3. Quay ngược tức khắc về phiên bản ổn định ngay liền trước đó:
kubectl rollout undo deployment/checkout

# 4. Theo dõi tiến trình xoay vòng cho tới khi hoàn tất 100%:
kubectl rollout status deployment/checkout
```

Ngay khi gõ `kubectl rollout undo`, Deployment hạ `ReplicaSet` bị lỗi về `0` và nâng `ReplicaSet` ổn định trước đó lên lại `replicas` ban đầu — hệ thống phục hồi xanh mượt chỉ trong vài giây!
