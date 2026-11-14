# Lưu trữ bền vững trong K8s: PersistentVolumeClaim, StorageClass & StatefulSet

Ở Level 0 và Level 1, khi chạy PostgreSQL bằng Docker Compose trên một máy chủ duy nhất, bạn chỉ cần khai báo một `volumes: pgdata` nằm ngay trên ổ cứng của máy đó. Nhưng trên một cụm Kubernetes gồm **15 máy chủ Worker Nodes**, câu chuyện phức tạp hơn gấp bội:

- [>] Hôm nay Pod chạy ở `worker-node-1`. Đêm nay `worker-node-1` bảo trì phần cứng, `Scheduler` dời Pod sang `worker-node-8`.
- [!] Nếu dữ liệu nằm trên ổ cứng cục bộ của `worker-node-1`, Pod mới ở `worker-node-8` sẽ thấy một thư mục trống trơn!

Để dữ liệu có thể **"đi theo Pod"** bất chấp Pod trôi dạt sang máy chủ nào, Kubernetes thiết kế kiến trúc lưu trữ tách làm 3 lớp thông minh: {sky:`StorageClass`}, {amber:`PersistentVolumeClaim (PVC)`} và {emerald:`PersistentVolume (PV)`} — kết hợp cùng ==`StatefulSet`== dành riêng cho Cơ sở dữ liệu phân tán.

```visual
kind: illustration
diagram: "kube:k13"
alt: "Quy trình cấp phát ổ đĩa động qua StorageClass, PVC, PV và kiến trúc định danh cố định db-0, db-1 của StatefulSet"
title: "Giải Phẫu Lưu Trữ Bền Vững: Dynamic Provisioning (PVC/PV) & Định Danh StatefulSet"
subtitle: "Tự động cắt ổ đĩa đám mây đi theo Pod khắp mọi Node và giữ tên tuổi gắn kết 1-1 cho từng máy chủ Database"
caption: "Chu trình cấp phát ổ đĩa tự động qua CSI Driver từ StorageClass -> PVC <-> PV và cách StatefulSet kết hợp Headless Service giữ định danh pg-0, pg-1"
callouts:
  - num: 1
    label: "StorageClass — Thực đơn hạng ổ đĩa đám mây"
    desc: "Kỹ sư hạ tầng định nghĩa sẵn loại đĩa SSD (gp3, pd-ssd) và chính sách giữ dữ liệu Retain để ứng dụng chỉ việc chọn tên hạng đĩa."
    tone: sky
  - num: 2
    label: "Cặp ghép đôi 1:1 giữa phiếu PVC và ổ đĩa thật PV"
    desc: "Khi nộp phiếu PVC, CSI Driver tự động tạo ổ đĩa đám mây PV và tự tháo-lắp ổ đĩa đó đi theo Pod nếu Node cũ gặp sự cố."
    tone: emerald
  - num: 3
    label: "StatefulSet & Headless Service — Danh tính bất biến"
    desc: "Mỗi bản sao Database mang số thứ tự cố định (pg-0, pg-1), tên miền DNS riêng và ổ đĩa PVC riêng biệt không bao giờ bị trộn lẫn."
    tone: violet
```

## 1. Mô hình "Phiếu yêu cầu ổ đĩa": `StorageClass` → `PVC` → `PV`

> [!ANALOGY] Tách bạch Hạ tầng đám mây và Nhu cầu ứng dụng
> Thay vì bắt lập trình viên Node.js phải biết mã ổ cứng vật lý AWS EBS `vol-0a1b2c3d` hay giao thức mạng lưu trữ CSI phức tạp, Kubernetes biến việc xin cấp ổ đĩa thành quy trình **Dynamic Provisioning** tự động hoá hoàn toàn như gọi món theo thực đơn!

```visual
kind: flow
title: Chu Trình Cấp Phát Ổ Đĩa Tự Động (Dynamic Provisioning)
subtitle: Từ thực đơn hạ tầng đám mây tới thư mục bền vững bên trong Container
footer: "CSI Driver tự động cắt ổ đĩa thật trên Cloud và gắn (Bind 1:1) với tờ phiếu PVC của bạn"
steps:
  - icon: layers
    badge: Hạ tầng / Cloud
    title: StorageClass
    desc: Thực đơn loại ổ đĩa do kỹ sư hạ tầng định nghĩa sẵn (SSD gp3, standard, EFS)
    code: "storageClassName: gp3"
    tone: sky
    edge: tham chiếu hạng đĩa
  - icon: file-code
    badge: Dev / DevOps nộp phiếu
    title: PersistentVolumeClaim (PVC)
    desc: Phiếu xin cấp 10Gi thuộc hạng gp3 với chế độ truy cập ReadWriteOnce
    code: "upload-pvc (10Gi)"
    tone: amber
    edge: CSI cắt & Bind 1:1
  - icon: disk
    badge: CSI Driver tự tạo
    title: PersistentVolume (PV)
    desc: Chiếc ổ đĩa đám mây thật sự (AWS EBS vol-0a1b2c3d) gắn chặt với PVC
    code: "Status: Bound"
    tone: violet
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
      - "Ổ đĩa chỉ được gắn đọc-ghi bởi các Pod nằm trên ==CÙNG một Worker Node duy nhất== tại một thời điểm"
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
      - "Hợp để nạp bộ tài nguyên tĩnh hoặc mô hình ML dùng chung"
    footer: An toàn chống ghi đè ngoài ý muốn
  - num: 3
    icon: network
    title: ReadWriteMany (RWX)
    badge: Nhiều Node Đọc-Ghi
    tone: violet
    desc: Chia sẻ thư mục ghi đồng thời xuyên suốt nhiều máy chủ vật lý.
    bullets:
      - "Nhiều Pod rải rác trên nhiều Worker Node khác nhau **cùng đọc và ghi đồng thời** vào chung một thư mục"
      - "Đòi hỏi hệ thống tệp qua mạng (**AWS EFS**, **Azure Files**, **CephFS** hoặc **NFS**)"
    footer: Bắt buộc khi nhiều API cùng ghi chung kho upload
```

> [!WARNING] Cạm bẫy kinh điển khiến Pod kẹt mãi ở `Pending`
> Nếu trong `PVC` bạn gõ nhầm tên `storageClassName: ssd-nonexistent` (một hạng ổ đĩa không tồn tại trong danh sách `kubectl get storageclass` của cụm), tờ phiếu `PVC` sẽ nằm chờ vô thời hạn ở trạng thái `Pending` (chưa `Bound`), kéo theo **mọi Pod tham chiếu tới `PVC` đó cũng đứng hình ở trạng thái ==`Pending`==** chưa thể khởi chạy!

## 2. Gắn `PVC` vào Pod hoặc Deployment (`volumes` + `volumeMounts`)

Sau khi viết `PersistentVolumeClaim`, bạn nối nó vào ứng dụng qua 2 bước quen thuộc: khai báo nguồn `volumes[].persistentVolumeClaim.claimName` ở cấp Pod và gắn đường dẫn `volumeMounts[].mountPath` (nơi code Node.js đọc/ghi tệp thực tế, ví dụ `/app/uploads`) vào bên trong Container:

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

Đối với ứng dụng Node.js API không lưu trạng thái (*Stateless*), 3 bản sao trong `Deployment` hoàn toàn giống hệt nhau như những hạt cát vô danh (`shop-api-7f8d9`, `shop-api-2x9k1`) — bản nào khởi động trước, tắt trước cũng được.

Nhưng với một cụm cơ sở dữ liệu **PostgreSQL Primary – Replica** hoặc **Redis Cluster / Kafka**, `Deployment` sụp đổ ngay vì 2 lý do sống còn:

- [!] **Không thể dùng chung 1 ổ cứng dữ liệu:** Nếu 2 tiến trình PostgreSQL trên 2 máy cùng mở và ghi đè vào chung 1 thư mục tệp nhị phân, cơ sở dữ liệu sẽ **hỏng (data corruption)** ngay lập tức! Mỗi bản sao Database bắt buộc phải có **một chiếc `PVC` độc lập riêng biệt** đi theo nó suốt đời.
- [!] **Cần danh tính và tên miền cố định (*Sticky Identity*):** Bản sao `postgres-0` đóng vai trò Primary (nhận ghi), còn `postgres-1` là Replica (sao chép luồng WAL từ đúng địa chỉ `postgres-0`). Nếu `postgres-0` khởi động lại, nó **bắt buộc phải lấy lại đúng cái tên ==`postgres-0`== và gắn lại đúng ổ đĩa cũ `pgdata-postgres-0`**!

Đó chính là lý do **`StatefulSet` (`apiVersion: apps/v1`)** ra đời với những đặc quyền khác biệt hoàn toàn so với `Deployment`:

```visual
kind: layers
title: So Sánh Kiến Trúc Deployment (Stateless) vs StatefulSet (Stateful)
subtitle: Sự khác biệt từ định danh Pod, thứ tự vòng đời cho tới khuôn đúc ổ đĩa riêng biệt
columns:
  - title: Deployment (Stateless Web / API)
    badge: Bản sao vô danh · Thay thế tuỳ ý
    tone: sky
    layers:
      - label: "Tên Pod ngẫu nhiên (api-6d8f9b-x7k2p)"
        sub: Xoá đi tạo lại sẽ mang hậu tố hash hoàn toàn mới
        note: Không cố định
        tone: sky
      - label: Khởi tạo & Xoá song song hàng loạt
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
    footer: Lý tưởng cho Express / Fastify / Next.js API không lưu trạng thái
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
        sub: "Tự đẻ PVC độc lập: data-postgres-0, data-postgres-1"
        note: Chống hỏng dữ liệu
        tone: violet
      - label: "Headless Service (spec.clusterIP: None)"
        sub: Cấp bản ghi DNS A trỏ đích danh thẳng tới IP riêng từng Pod
        note: Định tuyến chính xác
        tone: sky
    footer: Bắt buộc cho PostgreSQL HA, MongoDB ReplicaSet, Redis Cluster, Kafka
```

## 4. Cặp bài trùng bất khả phân ly: Headless Service (`clusterIP: None`) + `StatefulSet`

Mọi `StatefulSet` đều yêu cầu trường `spec.serviceName` (ví dụ `serviceName: postgres-headless`) trỏ tới một **Headless Service** — tức là một `Service` đặc biệt cấu hình ==`spec.clusterIP: None`==.

Khi thấy `clusterIP: None`, Kubernetes không cấp Virtual IP cân bằng tải ngẫu nhiên nữa, mà lập tức tạo bản ghi DNS A trả thẳng về IP riêng của từng chiếc Pod theo đúng số thứ tự:

- [x] `postgres-0.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ chính **`postgres-0`** (Primary nhận ghi)!
- [x] `postgres-1.postgres-headless.default.svc.cluster.local` → Trỏ thẳng đích danh vào máy chủ đọc phụ **`postgres-1`** (Replica đọc dữ liệu)!

```visual
kind: troubleshoot
title: Hai Tình Huống Vận Hành Lưu Trữ Phải Nhớ Lòng Trên Production
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
    cause: "KHÔNG PHẢI LỖI! Khi xoá hoặc scale down `StatefulSet`, Kubernetes cố tình giữ lại toàn bộ `PVC` sinh từ `volumeClaimTemplates` để ngăn thảm hoạ bấm nhầm bay màu Database sản xuất."
    fix: "Nếu thực sự muốn dọn sạch ổ đĩa ở môi trường thử nghiệm, bạn phải xoá tường minh từng PVC sau khi đã sao lưu."
    cmd: kubectl get pvc && kubectl delete pvc data-postgres-0
```

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`ReadWriteOnce` (`RWO`)** = gắn đọc-ghi cho các Pod trên **cùng 1 Worker Node** (AWS EBS `gp3`) · **`ReadWriteMany` (`RWX`)** = nhiều Node cùng đọc-ghi qua mạng (EFS/NFS).
> - Nếu `PVC` kẹt ở `Pending` (chưa `Bound`), chiếc Pod gắn nó cũng sẽ bị giữ ở **`Pending`**.
> - **`StatefulSet`** đánh số Pod bắt đầu từ **`0`** (`postgres-0`), tạo `PVC` riêng qua **`volumeClaimTemplates`**, đi kèm **Headless Service (`spec.clusterIP: None`)**, và **không tự động xoá `PVC`** khi xoá `StatefulSet`!
