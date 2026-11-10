# Lưu trữ bền vững trong K8s: PersistentVolumeClaim, StorageClass & StatefulSet

Ở Level 0 và Level 1, khi chạy PostgreSQL bằng Docker Compose trên một máy chủ duy nhất, bạn chỉ cần khai báo một `volumes: pgdata` nằm ngay trên ổ cứng của máy đó. Nhưng trên một cụm Kubernetes gồm **15 máy chủ Worker Nodes**, câu chuyện phức tạp hơn gấp bội:
- Hôm nay Pod chạy ở `worker-node-1`. Đêm nay `worker-node-1` bảo trì phần cứng, `Scheduler` dời Pod sang `worker-node-8`.
- Nếu dữ liệu nằm trên ổ cứng cục bộ của `worker-node-1`, Pod mới ở `worker-node-8` sẽ thấy một thư mục trống trơn!

Để dữ liệu có thể **"đi theo Pod"** bất chấp Pod trôi dạt sang máy chủ nào, Kubernetes thiết kế một kiến trúc lưu trữ tách làm 3 lớp thông minh: **`StorageClass`**, **`PersistentVolume (PV)`** và **`PersistentVolumeClaim (PVC)`** — kết hợp cùng **`StatefulSet`** dành riêng cho Cơ sở dữ liệu phân tán.

---

## 1. Mô hình "Phiếu yêu cầu ổ đĩa": `StorageClass` → `PVC` → `PV`

Thay vì bắt lập trình viên Node.js phải biết mã ổ cứng vật lý AWS EBS `vol-0a1b2c3d` hay giao thức mạng lưu trữ CSI phức tạp, Kubernetes tách bạch việc **"Cung cấp hạ tầng"** và **"Xin cấp dung lượng"**:

| Thành phần | Ai quản lý? | Liên hệ thực tế dễ hình dung |
| --- | --- | --- |
| **`StorageClass`** *(ví dụ: `gp3`, `standard`)* | Kỹ sư Hạ tầng / Cloud | **Bảng thực đơn loại ổ đĩa** (SSD tốc độ cao `gp3` của AWS, ổ tiêu chuẩn `standard`, hay ổ mạng dùng chung NFS/EFS). |
| **`PersistentVolumeClaim` (`PVC`)** | Lập trình viên / DevOps | **Phiếu đăng ký mượn ổ đĩa** nộp lên cụm: *"Cho ứng dụng của tôi xin 1 ổ `10Gi` thuộc hạng `gp3`, chế độ 1 Node đọc-ghi (`ReadWriteOnce`)!"* |
| **`PersistentVolume` (`PV`)** | Tự động tạo bởi CSI Driver | **Chiếc ổ đĩa thật sự** được đám mây cắt ra và gắn (Bind `1:1`) với tờ phiếu `PVC` của bạn. |

```text
[ Pod / Deployment ] ──gắn──► [ PVC: upload-pvc (10Gi, gp3) ] ◄──Bind──► [ PV thật trên AWS EBS ]
```

### Ba chế độ truy cập (`accessModes`) cốt lõi cần phân biệt:
- **`ReadWriteOnce` (`RWO`):** Ổ đĩa chỉ được gắn đọc-ghi bởi **các Pod nằm trên CÙNG 1 Worker Node duy nhất** tại một thời điểm (chuẩn phổ biến nhất của ổ đĩa khối đám mây như AWS EBS `gp3`, GCP Persistent Disk).
- **`ReadOnlyMany` (`ROX`):** Nhiều Node cùng đọc một lúc (không được ghi).
- **`ReadWriteMany` (`RWX`):** Nhiều Pod nằm rải rác trên nhiều Worker Node khác nhau **cùng đọc và ghi đồng thời** vào chung một thư mục (đòi hỏi hệ thống tệp qua mạng như AWS EFS, Azure Files, CephFS hoặc NFS).

### Cạm bẫy kinh điển khiến Pod kẹt mãi ở `Pending`:
Nếu trong `PVC` bạn gõ nhầm tên `storageClassName: ssd-nonexistent` (một hạng ổ đĩa không tồn tại trong danh sách `kubectl get storageclass` của cụm), tờ phiếu `PVC` sẽ nằm chờ vô thời hạn ở trạng thái `Pending` (chưa `Bound`), kéo theo mọi Pod tham chiếu tới `PVC` đó cũng đứng hình ở trạng thái **`Pending`**!

---

## 2. Gắn `PVC` vào Pod hoặc Deployment (`volumes` + `volumeMounts`)

Sau khi viết `PersistentVolumeClaim`, bạn nối nó vào ứng dụng qua 2 bước quen thuộc: khai báo nguồn `volumes[].persistentVolumeClaim.claimName` ở cấp Pod và gắn đường dẫn `volumeMounts[].mountPath` vào bên trong Container:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: upload-pvc
spec:
  storageClassName: gp3
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: media-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: media-api
  template:
    metadata:
      labels:
        app: media-api
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/media-api:1.2.0
          volumeMounts:
            - name: upload-storage
              mountPath: /app/uploads
      volumes:
        - name: upload-storage
          persistentVolumeClaim:
            claimName: upload-pvc
```

---

## 3. Tại sao Database không dùng `Deployment` mà bắt buộc cần `StatefulSet`?

Đối với ứng dụng Node.js API không lưu trạng thái (Stateless), 3 bản sao trong `Deployment` hoàn toàn giống hệt nhau như những hạt cát vô danh (`shop-api-7f8d9`, `shop-api-2x9k1`) — bản nào khởi động trước, tắt trước cũng được, và chúng có thể dùng chung cấu hình.

Nhưng hãy thử tưởng tượng một cụm cơ sở dữ liệu **PostgreSQL Primary – Replica** hoặc **Redis Cluster / Kafka**:
1. **Không thể dùng chung 1 ổ cứng dữ liệu:** Nếu 2 tiến trình PostgreSQL trên 2 máy cùng mở và ghi đè vào chung 1 tệp dữ liệu nhị phân, cơ sở dữ liệu sẽ hỏng (corrupt) ngay lập tức! Mỗi bản sao Database bắt buộc phải có **một chiếc `PVC` riêng biệt** đi theo nó suốt đời.
2. **Cần danh tính và tên miền cố định (Sticky Identity):** Bản sao `postgres-0` đóng vai trò Primary (nhận ghi), còn `postgres-1` là Replica (sao chép luồng WAL từ đúng địa chỉ `postgres-0`). Nếu `postgres-0` khởi động lại, nó **bắt buộc phải lấy lại đúng cái tên `postgres-0` và gắn lại đúng ổ đĩa cũ `pgdata-postgres-0`**!

Đó chính là lý do **`StatefulSet` (`apiVersion: apps/v1`)** ra đời với 3 đặc quyền khác biệt hoàn toàn so với `Deployment`:

| Đặc tính | `Deployment` (Stateless API) | `StatefulSet` (Database, Queue, Cache cụm) |
| --- | --- | --- |
| **Tên của các Pod** | Hậu tố ngẫu nhiên (`api-6d8f9b-x7k2p`). | Đánh số thứ tự cố định bất biến: **`postgres-0`**, **`postgres-1`**, **`postgres-2`**. |
| **Thứ tự bật / tắt** | Khởi tạo hoặc xoá song song hàng loạt. | Tuần tự nghiêm ngặt (`0` sẵn sàng rồi mới bật `1`; khi thu nhỏ thì tắt ngược từ `2` về `1`). |
| **Ổ đĩa riêng từng bản sao** | Mọi Pod dùng chung 1 `PVC` nếu gắn trong `volumes`. | Dùng khuôn đúc **`volumeClaimTemplates`** tự động đẻ ra `PVC` riêng cho từng Pod (`data-postgres-0`, `data-postgres-1`)! |
| **Định danh mạng DNS** | Cân bằng tải ngẫu nhiên qua Virtual IP. | Đi kèm **Headless Service (`clusterIP: None`)** tạo tên miền riêng cho từng Pod! |

---

## 4. Cặp bài trùng bất khả phân ly: Headless Service (`clusterIP: None`) + `StatefulSet`

Mọi `StatefulSet` đều yêu cầu trường `spec.serviceName` trỏ tới một **Headless Service** — tức là một `Service` đặc biệt đặt **`clusterIP: None`**. Khi thấy `clusterIP: None`, Kubernetes không cấp IP ảo cân bằng tải ngẫu nhiên nữa, mà lập tức tạo bản ghi DNS trả thẳng về IP riêng của từng chiếc Pod có thứ tự:

- `postgres-0.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ chính `postgres-0`!
- `postgres-1.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ đọc phụ `postgres-1`!

Đồng thời, lưu ý cực kỳ thực tế: khi bạn xoá một `StatefulSet` (hoặc giảm `replicas` từ 2 xuống 1), Kubernetes **cố tình KHÔNG tự động xoá các `PVC`** sinh ra từ `volumeClaimTemplates` để bảo vệ dữ liệu sản xuất quý giá khỏi thao tác bấm nhầm!
