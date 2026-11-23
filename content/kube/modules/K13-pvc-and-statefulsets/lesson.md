# Lưu trữ bền vững trong K8s: PersistentVolumeClaim, StorageClass & StatefulSet

Ở Level 0 và Level 1, khi chạy PostgreSQL bằng Docker Compose trên một máy chủ duy nhất, bạn chỉ cần khai báo một `volumes: pgdata` nằm ngay trên ổ cứng của máy đó. Nhưng trên một cụm Kubernetes gồm **15 máy chủ Worker Nodes**, câu chuyện thú vị hơn rất nhiều:

- [>] Hôm nay Pod chạy ở `worker-node-1`. Đêm nay `worker-node-1` bảo trì phần cứng, `Scheduler` dời Pod sang `worker-node-8`.
- [!] Nếu dữ liệu chỉ nằm trên ổ cứng nội bộ của `worker-node-1`, Pod mới ở `worker-node-8` sẽ thấy một thư mục trống trơn!

Để dữ liệu có thể **"tự tháo ra và bay theo Pod"** bất chấp Pod dời sang máy chủ nào, Kubernetes tách lưu trữ thành 3 mảnh ghép gọn gàng: `StorageClass`, `PersistentVolumeClaim (PVC)` và `PersistentVolume (PV)` — kết hợp cùng ==`StatefulSet`== dành cho các hệ thống cần danh tính cố định như Cơ sở dữ liệu.

```visual
kind: illustration
diagram: "kube:k13"
alt: "Quy trình cấp phát ổ đĩa động qua StorageClass, PVC, PV và kiến trúc định danh cố định db-0, db-1 của StatefulSet"
title: "Cơ Chế Lưu Trữ Bền Vững: Dynamic Provisioning (PVC/PV) & Định Danh StatefulSet"
subtitle: "Tự động cắt ổ đĩa đám mây đi theo Pod khắp mọi Node và giữ tên tuổi gắn kết 1-1 cho từng máy chủ Database"
caption: "Chu trình cấp phát ổ đĩa tự động qua CSI Driver từ StorageClass -> PVC <-> PV và cách StatefulSet kết hợp Headless Service giữ định danh pg-0, pg-1"
callouts:
  - num: 1
    label: "StorageClass — Định nghĩa hạng ổ đĩa đám mây"
    desc: "Kỹ sư hạ tầng định nghĩa sẵn loại đĩa SSD (gp3, pd-ssd) và chính sách giữ dữ liệu Retain để ứng dụng chỉ việc chọn tên hạng đĩa."
    tone: sky
  - num: 2
    label: "Cặp ghép đôi 1:1 giữa PVC và ổ đĩa thật PV"
    desc: "Khi nộp yêu cầu PVC, CSI Driver tự động tạo ổ đĩa đám mây PV và tự tháo-lắp ổ đĩa đó đi theo Pod nếu Node cũ gặp sự cố."
    tone: emerald
  - num: 3
    label: "StatefulSet & Headless Service — Danh tính bất biến"
    desc: "Mỗi bản sao Database mang số thứ tự cố định (pg-0, pg-1), tên miền DNS riêng và ổ đĩa PVC riêng biệt không bao giờ bị trộn lẫn."
    tone: cyan
```

## 1. Cơ chế cấp phát ổ đĩa động: `StorageClass` → `PVC` → `PV`

> [!NOTE] Phân vai 3 thành phần lưu trữ: `StorageClass`, `PVC` và `PV`
> Thay vì bắt lập trình viên Python hay Node.js phải cấu hình trực tiếp mã ổ cứng vật lý AWS EBS `vol-0a1b2c3d`, Kubernetes tách việc cấp phát lưu trữ thành 3 đối tượng độc lập:
> 1. **`StorageClass`:** Do kỹ sư hạ tầng định nghĩa sẵn các loại ổ đĩa trên Cloud (ví dụ `gp3` là SSD tốc độ cao, `efs` là ổ mạng dùng chung) kèm chính sách thu hồi dữ liệu.
> 2. **`PersistentVolumeClaim — PVC`:** Bản khai báo yêu cầu lưu trữ của ứng dụng (ví dụ xin `10Gi` dung lượng thuộc `storageClassName: gp3` với chế độ truy cập `ReadWriteOnce`).
> 3. **`PersistentVolume — PV`:** Ổ đĩa vật lý/đám mây thực tế do **CSI Driver** tự động tạo ra khi nhận được `PVC`, sau đó gắn kết 1-1 (`Bound`) với `PVC` đó (có thể hình dung `StorageClass` như danh mục các hạng ổ đĩa, `PVC` là phiếu yêu cầu của ứng dụng, còn `PV` là ổ đĩa thực tế được cấp phát).

```visual
kind: flow
title: Chu Trình Cấp Phát Ổ Đĩa Tự Động (Dynamic Provisioning)
subtitle: Từ khai báo hạng đĩa hạ tầng đám mây tới thư mục bền vững bên trong Container
footer: "CSI Driver tự động cấp phát ổ đĩa thật trên Cloud và gắn kết (Bound 1:1) với PVC của bạn"
steps:
  - icon: layers
    badge: Hạ tầng / Cloud
    title: StorageClass
    desc: Khai báo loại ổ đĩa do kỹ sư hạ tầng định nghĩa sẵn (SSD gp3, pd-ssd, EFS)
    code: "storageClassName: gp3"
    tone: sky
    edge: tham chiếu hạng đĩa
  - icon: file-code
    badge: Dev / DevOps khai báo
    title: PersistentVolumeClaim (PVC)
    desc: Yêu cầu cấp 10Gi thuộc hạng gp3 với chế độ truy cập ReadWriteOnce
    code: "upload-pvc (10Gi)"
    tone: amber
    edge: CSI cắt & Bind 1:1
  - icon: disk
    badge: CSI Driver tự tạo
    title: PersistentVolume (PV)
    desc: Ổ đĩa đám mây thực tế (AWS EBS vol-0a1b2c3d) gắn chặt với PVC
    code: "Status: Bound"
    tone: cyan
    edge: volumeMounts
  - icon: container
    badge: Ứng dụng đọc/ghi
    title: Pod / Deployment
    desc: Gắn PVC vào đường dẫn bên trong container, dữ liệu đi theo Pod sang mọi Node
    code: "/app/uploads"
    tone: emerald
```

```visual
kind: groups
title: Ba Chế Độ Truy Cập Ổ Đĩa Cốt Lõi (accessModes) [!badge:sky:Bắt buộc phân biệt]
subtitle: Khả năng chia sẻ ổ đĩa phụ thuộc trực tiếp vào công nghệ phần cứng đám mây bên dưới
columns: 3
items:
  - num: 1
    icon: disk
    title: ReadWriteOnce (RWO)
    badge: 1 Node Đọc-Ghi
    tone: emerald
    desc: Chuẩn phổ biến số 1 cho ổ đĩa khối đám mây (Block Storage).
    bullets:
      - "Ổ đĩa chỉ được cắm đọc-ghi vào ==CÙNG một Worker Node duy nhất== tại một thời điểm"
      - "Hỗ trợ gốc bởi **AWS EBS (`gp3`)**, **GCP Persistent Disk**, Azure Disk"
    footer: Mặc định cho Database & Pod đơn Node
  - num: 2
    icon: eye
    title: ReadOnlyMany (ROX)
    badge: Nhiều Node Chỉ Đọc
    tone: sky
    desc: Chia sẻ dữ liệu tĩnh an toàn cho hàng chục máy chủ cùng lúc.
    bullets:
      - "Cho phép nhiều Worker Node gắn ổ đĩa cùng lúc ở chế độ **chỉ đọc** (không được ghi)"
      - "Rất hợp để nạp bộ trọng số mô hình AI/ML lớn cho nhiều Pod Python cùng đọc"
    footer: An toàn chống ghi đè ngoài ý muốn
  - num: 3
    icon: network
    title: ReadWriteMany (RWX)
    badge: Nhiều Node Đọc-Ghi
    tone: cyan
    desc: Chia sẻ thư mục ghi đồng thời xuyên suốt nhiều máy chủ vật lý.
    bullets:
      - "Nhiều Pod rải rác trên nhiều Worker Node khác nhau **cùng đọc và ghi đồng thời** vào chung một thư mục"
      - "Đòi hỏi hệ thống tệp qua mạng (**AWS EFS**, **GCP Filestore**, **Azure Files**, **CephFS/NFS**)"
    footer: Bắt buộc khi nhiều bản sao API cùng ghi chung kho tệp tải lên
```

> [!WARNING] Cạm bẫy kinh điển khiến Pod đứng hình mãi ở `Pending`
> Nếu trong `PVC` bạn gõ nhầm tên `storageClassName: ssd-nonexistent` (một hạng ổ đĩa không có trong `kubectl get storageclass` của cụm), tờ phiếu `PVC` sẽ nằm chờ mãi ở trạng thái `Pending` (chưa `Bound`), kéo theo **mọi Pod gắn chiếc `PVC` đó cũng bị kẹt cứng ở trạng thái ==`Pending`==** chưa thể khởi chạy!

## 2. Gắn `PVC` vào Pod hoặc Deployment (`volumes` + `volumeMounts`)

Sau khi viết tờ phiếu `PersistentVolumeClaim`, bạn nối nó vào ứng dụng qua 2 bước quen thuộc: khai báo nguồn `volumes[].persistentVolumeClaim.claimName` ở cấp Pod và gắn đường dẫn `volumeMounts[].mountPath` vào bên trong Container:

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

## 3. Tại sao Database không dùng `Deployment` mà bắt buộc cần `StatefulSet`?

Với Web API không lưu trạng thái (*Stateless*), các bản sao trong `Deployment` có thể thay thế lẫn nhau hoàn toàn (`shop-api-7f8d9`, `shop-api-2x9k1`) — bản sao nào bật trước hay tắt trước đều không ảnh hưởng.

Nhưng với cụm cơ sở dữ liệu **PostgreSQL Primary – Replica**, **Redis Cluster** hay **Kafka**, `Deployment` không thể đáp ứng vì 2 yêu cầu kỹ thuật bắt buộc:

- [!] **Không thể dùng chung 1 ổ đĩa nhị phân:** Nếu 2 tiến trình PostgreSQL trên 2 máy cùng ghi đè vào chung 1 thư mục tệp dữ liệu, Database sẽ **hỏng dữ liệu (`data corruption`)** ngay lập tức! Mỗi bản sao Database bắt buộc phải có **một `PVC` riêng biệt** gắn với riêng nó.
- [!] **Cần danh tính và số thứ tự cố định (*Sticky Identity*):** Máy chính `postgres-0` đóng vai trò Primary (nhận ghi), còn `postgres-1` là Replica (sao chép dữ liệu từ đúng địa chỉ `postgres-0`). Nếu `postgres-0` khởi động lại, nó **bắt buộc phải giữ nguyên tên ==`postgres-0`== và gắn lại đúng ổ đĩa cũ `data-postgres-0`**!

Đó chính là lý do **`StatefulSet` (`apiVersion: apps/v1`)** ra đời:

```visual
kind: layers
title: So Sánh Kiến Trúc Deployment (Stateless) vs StatefulSet (Stateful)
subtitle: Sự khác biệt từ bảng tên định danh Pod, thứ tự vòng đời cho tới khuôn đúc ổ đĩa riêng biệt
columns:
  - title: Deployment (Stateless Web / AI / REST API)
    badge: Bản sao vô danh · Thay thế tùy ý
    tone: sky
    layers:
      - label: "Tên Pod ngẫu nhiên (api-6d8f9b-x7k2p)"
        sub: Xóa đi tạo lại sẽ mang hậu tố mã băm hoàn toàn mới
        note: Không cố định
        tone: sky
      - label: Khởi tạo & Xóa song song hàng loạt
        sub: Bật/tắt 5 replica cùng một lúc không phân biệt trước sau
        note: Tốc độ cao
        tone: cyan
      - label: Chia sẻ chung 1 PVC (nếu khai báo volumes)
        sub: Mọi bản sao trỏ vào cùng một claimName duy nhất
        note: Cấm dùng cho DB!
        tone: amber
      - label: Service ClusterIP chuẩn (Virtual IP)
        sub: Cân bằng tải ngẫu nhiên tới bất kỳ Pod nào đang Ready
        note: 1 IP ảo chung
        tone: slate
    footer: Lý tưởng cho FastAPI / Express / Next.js API không lưu trạng thái trên đĩa
  - title: StatefulSet (Database, Queue, Cache cụm)
    badge: Định danh bất biến · Ổ đĩa độc lập
    tone: emerald
    layers:
      - label: "Đánh số thứ tự cố định từ 0 (postgres-0, postgres-1)"
        sub: Khởi động lại vẫn giữ nguyên tên cũ và vai trò Primary/Replica
        note: Sticky Identity
        tone: emerald
      - label: Thứ tự bật / tắt tuần tự nghiêm ngặt
        sub: "postgres-0 phải Ready mới bật postgres-1 · Thu nhỏ tắt ngược từ 2 -> 1"
        note: An toàn cụm DB
        tone: cyan
      - label: Khuôn đúc volumeClaimTemplates riêng từng Pod
        sub: "Tự sinh PVC độc lập: data-postgres-0, data-postgres-1"
        note: Chống hỏng dữ liệu
        tone: cyan
      - label: "Headless Service (spec.clusterIP: None)"
        sub: Cấp bản ghi DNS A trỏ đích danh thẳng tới IP riêng từng Pod
        note: Định tuyến chính xác
        tone: sky
    footer: Nền tảng cho PostgreSQL HA, MongoDB ReplicaSet, Redis Cluster, Kafka
```

## 4. Headless Service (`clusterIP: None`) & Lời khuyên thực tế năm 2026

Mọi `StatefulSet` đều yêu cầu trường `spec.serviceName` trỏ tới một **Headless Service** — tức là một `Service` đặc biệt đặt ==`spec.clusterIP: None`==. Khi thấy `clusterIP: None`, CoreDNS không gộp chung sau 1 IP ảo nữa mà cấp tên miền riêng trỏ thẳng vào từng bản sao:

- [x] `postgres-0.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ chính **`postgres-0`** (nhận lệnh `INSERT/UPDATE`)!
- [x] `postgres-1.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ phụ **`postgres-1`** (chuyên phục vụ truy vấn `SELECT` đọc báo cáo)!

> [!TIP] Góc nhìn kiến trúc thực tế năm 2026: Managed DB hay tự chạy DB trên K8s?
> - Nếu chạy trên AWS/GCP/Azure và đội ngũ nhỏ, việc dùng dịch vụ CSDL quản lý sẵn (**AWS RDS**, **Cloud SQL**, **Neon**) bên ngoài cụm K8s vẫn là cách nhàn nhất để có sao lưu tự động.
> - Nếu chạy tự chủ trên Kubernetes (On-Premise hoặc tối ưu chi phí Cloud), thay vì viết tay `StatefulSet` trần cho Postgres, các đội ngũ năm 2026 ưu tiên dùng Kubernetes Operator chuyên dụng như **`CloudNativePG`** để tự động hóa cả failover Primary-Replica và backup WAL lên S3!

```visual
kind: troubleshoot
title: Hai Tình Huống Vận Hành Lưu Trữ Thường Gặp Trên Production
items:
  - symptom: "Pod & PVC đứng hình mãi ở trạng thái Pending"
    badge: Lỗi cấu hình PVC
    tone: amber
    cause: "Gõ sai `storageClassName` không tồn tại trong cụm, hoặc yêu cầu `ReadWriteMany` trên loại ổ đĩa khối chỉ hỗ trợ `ReadWriteOnce` khiến PVC không thể `Bound`."
    fix: "Kiểm tra danh sách StorageClass thực tế của cụm và đối chiếu sự kiện chi tiết trên chiếc PVC."
    cmd: kubectl get storageclass && kubectl describe pvc upload-pvc
  - symptom: "Đã chạy kubectl delete statefulset postgres nhưng các PVC vẫn còn nguyên"
    badge: Cơ chế bảo vệ dữ liệu
    tone: emerald
    cause: "KHÔNG PHẢI LỖI! Khi xóa hoặc scale down `StatefulSet`, Kubernetes cố tình giữ lại toàn bộ `PVC` sinh từ `volumeClaimTemplates` để ngăn sự cố bấm nhầm xóa mất Database sản xuất."
    fix: "Nếu thực sự muốn dọn sạch ổ đĩa ở môi trường thử nghiệm, bạn phải xóa tường minh từng PVC sau khi đã sao lưu."
    cmd: kubectl get pvc && kubectl delete pvc data-postgres-0
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`ReadWriteOnce` (`RWO`)** = gắn đọc-ghi cho các Pod trên **cùng 1 Worker Node** (AWS EBS `gp3`) · **`ReadWriteMany` (`RWX`)** = nhiều Node cùng đọc-ghi qua mạng (EFS/NFS).
> - Nếu `PVC` kẹt ở `Pending` (chưa `Bound`), chiếc Pod gắn nó cũng sẽ bị giữ ở **`Pending`**.
> - **`StatefulSet`** đánh số Pod bắt đầu từ **`0`** (`postgres-0`), tạo `PVC` riêng qua **`volumeClaimTemplates`**, đi kèm **Headless Service (`spec.clusterIP: None`)**, và **không tự động xóa `PVC`** khi xóa `StatefulSet`!
