# Kiến trúc Kubernetes, Vòng lặp Điều khiển & Giải phẫu Manifest YAML

Khi bạn chạy 2–3 container trên một máy chủ đơn lẻ, **Docker Compose** làm rất tốt nhiệm vụ của nó. Nhưng điều gì xảy ra khi lượng người dùng tăng gấp 50 lần vào đêm Flash Sale?

- [!] Một máy chủ vật lý hết sạch RAM hoặc cháy ổ cứng lúc 3 giờ sáng — ai sẽ tự động chuyển 15 container sang máy chủ lành lặn khác trong vài giây mà không cần kỹ sư thức dậy?
- [>] Làm sao nâng cấp phiên bản API thanh toán trên 12 máy chủ cùng lúc mà không làm rớt bất kỳ giao dịch nào của khách hàng?

**Kubernetes (K8s)** ra đời để đóng vai trò như ==Hệ điều hành của cả trung tâm dữ liệu==: bạn không còn ra lệnh thủ công cho từng máy lẻ nữa, mà giao cho K8s một {sky:bản thiết kế trạng thái mong muốn} để nó {emerald:tự động duy trì suốt ngày đêm}.

## 1. Bức tranh toàn cảnh: Control Plane vs Worker Nodes

> [!ANALOGY] Hãy hình dung như sau
> Một cụm (**Cluster**) Kubernetes luôn chia thành hai nhóm máy rõ rệt giống như **Ban điều hành trung tâm** (*Control Plane* — chuyên ra quyết định và lưu sổ cái) và **Đội xưởng sản xuất** (*Worker Nodes* — nơi thực sự gánh CPU/RAM chạy container ứng dụng của bạn).

```visual
kind: layers
title: Kiến Trúc Một Cụm Kubernetes Chuẩn — Control Plane vs Worker Nodes
subtitle: Chỉ duy nhất kube-apiserver được phép đọc/ghi trực tiếp vào kho dữ liệu etcd
columns:
  - title: Control Plane (Bộ não điều phối)
    badge: Quản trị & Ra quyết định
    tone: violet
    layers:
      - label: kube-apiserver
        sub: Cổng giao tiếp REST API (HTTPS) duy nhất của toàn cụm — mọi lệnh kubectl đều gửi YAML/JSON tới đây
        note: Cửa ngõ trung tâm
        tone: sky
      - label: etcd
        sub: Kho cơ sở dữ liệu phân tán dạng Key-Value lưu nguồn sự thật duy nhất (Single Source of Truth) của cụm
        note: Sổ cái trạng thái
        tone: amber
      - label: kube-scheduler
        sub: Quan sát Pod mới chưa có chỗ (Pending), tính toán CPU/RAM trống rồi gán Pod về Worker Node phù hợp
        note: Người xếp chỗ
        tone: violet
      - label: kube-controller-manager
        sub: Các vòng lặp tuần tra 24/7 — thấy yêu cầu 3 bản sao mà thực tế còn 2 là lập tức yêu cầu tạo bù bản thứ 3
        note: Tuần tra tự động
        tone: cyan
    footer: Thường chạy 3 máy Control Plane trở lên trên Production để chống điểm lỗi đơn (HA)
  - title: Worker Node (Máy chủ chạy ứng dụng)
    badge: Thực thi Workload
    tone: emerald
    layers:
      - label: kubelet
        sub: Đại lý (agent) cắm chốt trên từng Worker Node — nhận chỉ thị từ apiserver, báo cáo sức khoẻ Node/Pod
        note: Quản đốc tại chỗ
        tone: emerald
      - label: containerd (Container Runtime)
        sub: Bộ máy cấp thấp chuẩn CRI trực tiếp kéo Image và khởi chạy tiến trình Linux Container (thay Docker shim cũ)
        note: Chạy tiến trình
        tone: sky
      - label: kube-proxy
        sub: Duy trì bảng định tuyến mạng (iptables / IPVS / eBPF) trên mỗi Node để dẫn gói tin từ Service tới đúng IP Pod
        note: Định tuyến mạng
        tone: cyan
    footer: Có thể co giãn linh hoạt từ vài máy đến hàng nghìn Worker Node theo tải thực tế
```

## 2. Tư duy cốt lõi nhất của K8s: Imperative vs Declarative Control Loop

Giống như chiếc điều hoà nhiệt độ đặt ở `24°C`: bạn không tự tay bật/tắt lốc lạnh từng phút, mà bộ cảm biến liên tục đo nhiệt độ phòng thực tế để tự điều chỉnh khớp với con số `24°C` đã khai báo.

```visual
kind: compare
title: Chuyển Dịch Tư Duy — Mệnh Lệnh (Imperative) vs Khai Báo (Declarative)
subtitle: Sự khác biệt cốt lõi giữa việc tự gõ docker run trên máy lẻ và điều phối tự động bằng Kubernetes
left:
  badge: "CÁCH CŨ · Imperative (Mệnh lệnh)"
  title: Ra lệnh từng bước thủ công
  tone: amber
  code: |
    # Bắt máy chủ làm ngay hành động này:
    docker run -d --name shop-api -p 3000:3000 app:1.0
  lang: bash
  bullets:
    - "Bạn chỉ định **cách làm từng bước**: chạy lệnh xong là CLI kết thúc trách nhiệm"
    - "Nếu 2 giờ sáng ổ cứng máy chủ hỏng làm sập tiến trình, **không ai tự chuyển sang máy khác**"
    - "Sửa tay lâu ngày dẫn đến lệch cấu hình (*Configuration Drift*), không ai nhớ trạng thái chuẩn ban đầu"
right:
  badge: "CHUẨN K8S · Declarative (Khai báo)"
  title: Giao trạng thái đích cho Vòng lặp Điều khiển
  tone: emerald
  code: |
    # Nộp bản thiết kế trạng thái mong muốn:
    kubectl apply -f deployment.yaml   # replicas: 3
  lang: bash
  bullets:
    - "Bạn chỉ mô tả **kết quả mong muốn** (`Desired State: replicas: 3`) trong tệp YAML lưu trên Git"
    - "Controller chạy vòng lặp đối chiếu liên tục 24/7 với **trạng thái thực tế** (`Actual State`)"
    - "Tự động chữa lành (**Self-Healing**): hễ thiếu Pod là tự tạo bù sang Worker Node khoẻ mạnh!"
```

```visual
kind: flow
title: Vòng Lặp Điều Khiển Tự Chữa Lành (Reconciliation / Control Loop)
subtitle: Điều gì diễn ra tự động lúc 3 giờ sáng khi Worker Node #2 bất ngờ mất điện?
steps:
  - icon: file-code
    badge: 1. Desired State
    title: Khai Báo Đích
    desc: Bạn nộp YAML yêu cầu duy trì replicas là 3 vào etcd qua apiserver
    code: "replicas: 3"
    tone: sky
    edge: quan sát 24/7
  - icon: eye
    badge: 2. Observe & Diff
    title: Phát Hiện Lệch
    desc: Node #2 sập làm chết 1 Pod — Controller thấy thực tế chỉ còn 2 Pod sống
    code: "Actual (2) != Desired (3)"
    tone: amber
    edge: tạo bù 1 Pod
  - icon: cpu
    badge: 3. Schedule
    title: Xếp Chỗ Mới
    desc: kube-scheduler tìm thấy Node #3 còn dư CPU/RAM và gán Pod mới sang đó
    code: "Pending -> Node #3"
    tone: violet
    edge: kubelet kéo Image
  - icon: shield-check
    badge: 4. Self-Healing
    title: Hội Tụ Đủ Quân Số
    desc: kubelet trên Node #3 bảo containerd bật Pod mới — dịch vụ lành lặn 100%
    code: "2 + 1 === 3 Ready"
    tone: emerald
```

## 3. Bốn trường gốc bắt buộc trong mọi Manifest YAML của Kubernetes [!badge:sky:Chuẩn K8s 1.30+]

Dù bạn viết một `Pod` nhỏ xíu 12 dòng hay một `Deployment` phức tạp 200 dòng, **100% tài nguyên chuẩn của Kubernetes** đều bắt đầu bằng đúng ==4 trường gốc (`apiVersion`, `kind`, `metadata`, `spec`)== ở sát lề trái:

```visual
kind: anatomy
title: Giải Phẫu Bộ Tứ Trường Gốc Trong Mọi Manifest YAML Của Kubernetes
subtitle: Khác với Docker Compose (version/services) hay GitHub Actions (name/on/jobs), K8s luôn cố định 4 khoá gốc này
items:
  - keyword: apiVersion
    role: Nhóm & Phiên bản API
    tone: sky
    summary: Xác định nhóm chuẩn API mà kube-apiserver dùng để kiểm tra lược đồ tài nguyên.
    bullets:
      - "Nhóm cốt lõi (`Pod`, `Service`, `ConfigMap`, `Secret`, `Namespace`, `PersistentVolumeClaim`): dùng **`v1`**"
      - "Nhóm quản lý workload (`Deployment`, `StatefulSet`, `DaemonSet`, `ReplicaSet`): dùng ==`apps/v1`=="
    example: "apiVersion: apps/v1"
    lang: yaml
  - keyword: kind
    role: Loại đối tượng
    tone: violet
    summary: Tên kiểu tài nguyên Kubernetes mà bạn muốn khởi tạo hoặc cập nhật (viết PascalCase).
    bullets:
      - "Ví dụ phổ biến: `Pod`, `Deployment`, `Service`, `Ingress`, `ConfigMap`, `Secret`"
    example: "kind: Deployment"
    lang: yaml
  - keyword: metadata
    role: Định danh & Nhãn
    tone: amber
    summary: Chứa tên định danh (`name`), không gian tên (`namespace`) và bộ nhãn phân loại (`labels`).
    bullets:
      - "Nếu bỏ trống `metadata.namespace`, tài nguyên mặc định rơi vào namespace `default`"
    example: "metadata:\n  name: hello-k8s\n  labels:\n    app: hello-k8s"
    lang: yaml
  - keyword: spec
    role: Đặc tả trạng thái đích
    tone: emerald
    summary: Mô tả chi tiết trạng thái mong muốn (Desired State) mà bạn giao cho K8s duy trì.
    bullets:
      - "Cấu trúc bên trong `spec` thay đổi tuỳ theo từng `kind` (ví dụ `containers` cho Pod, `replicas` + `selector` + `template` cho Deployment)"
    example: "spec:\n  containers:\n    - name: web\n      image: nginx:1.27-alpine"
    lang: yaml
```

```yaml Manifest Pod tối giản hoàn chỉnh (chuẩn v1)
apiVersion: v1              # 1. Nhóm và phiên bản API (v1, apps/v1, networking.k8s.io/v1...)
kind: Pod                   # 2. Loại đối tượng muốn tạo (Pod, Deployment, Service, Secret...)
metadata:                   # 3. Định danh: tên (name), không gian tên (namespace), nhãn (labels)
  name: hello-k8s
  labels:
    app: hello-k8s
spec:                       # 4. Đặc tả trạng thái mong muốn (cấu trúc bên trong tuỳ thuộc vào kind)
  containers:
    - name: web
      image: nginx:1.27-alpine
      ports:
        - containerPort: 80
```

> [!WARNING] Cảnh báo bẫy lịch sử API Version (chuẩn K8s >= 1.30 năm 2026)
> Kubernetes phát triển nghiêm ngặt theo lộ trình `alpha` → `beta` → `v1` (ổn định). Rất nhiều bài viết cũ trên mạng vẫn hướng dẫn `apiVersion: extensions/v1beta1` cho `Deployment` hoặc `Ingress` — nhánh API nháp này ==đã bị gỡ bỏ hoàn toàn từ Kubernetes 1.16 / 1.22==!
> - [x] Với `Pod`, `Service`, `ConfigMap`, `Secret`, `Namespace`, `PersistentVolumeClaim`: luôn dùng **`apiVersion: v1`**.
> - [x] Với `Deployment`, `StatefulSet`, `DaemonSet`, `ReplicaSet`: luôn dùng **`apiVersion: apps/v1`** (và bắt buộc khai báo tường minh `spec.selector.matchLabels` khớp với `spec.template.metadata.labels`).

## 4. Làm quen hai lệnh quan sát nền tảng trên `kubectl`

`kubectl` là công cụ dòng lệnh nói chuyện trực tiếp với `kube-apiserver` qua HTTPS:

```bash
# 1. Liệt kê Pod ở namespace mặc định (default) — chưa thấy các Pod hệ thống như coredns:
kubectl get pods

# 2. Liệt kê TẤT CẢ Pod trên mọi namespace toàn cụm (gồm cả kube-system nơi coredns đang chạy, staging...):
kubectl get pods -A

# 3. Xem hồ sơ khám sức khoẻ chi tiết (Node được xếp chỗ, IP, trạng thái và bảng Events cuối cùng):
kubectl describe pod payment-pod
```

> [!TIP] Phản xạ vàng khi gỡ lỗi trên Kubernetes
> - **`kubectl get`** (kèm ==`-A`== tức `--all-namespaces` khi cần nhìn toàn cảnh cụm) cho bạn biết **cái gì đang bất thường**.
> - Bảng **`Events:`** nằm ở cuối lệnh **`kubectl describe`** sẽ chỉ tận tay cho bạn **tại sao nó bất thường** (thiếu RAM không xếp được chỗ, kéo sai tên Image, hay trượt bài kiểm tra sức khoẻ)!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Control Plane:** `kube-apiserver` (cổng REST duy nhất) · `etcd` (kho Key-Value nguồn sự thật duy nhất) · `kube-scheduler` (xếp Pod về Node) · `kube-controller-manager` (vòng lặp tự chữa lành).
> - **Worker Node:** `kubelet` (đại lý quản đốc gọi Runtime) · `containerd` (chạy container) · `kube-proxy` (định tuyến mạng Service).
> - **4 trường gốc bắt buộc:** `apiVersion`, `kind`, `metadata`, `spec` (`Deployment` chuẩn luôn dùng `apps/v1`, cờ xem mọi namespace là `-A`).
