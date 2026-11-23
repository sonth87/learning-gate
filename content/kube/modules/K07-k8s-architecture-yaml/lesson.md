# Kiến trúc Kubernetes, Bản đồ Phân cấp & Vòng lặp Đối soát YAML

Ở 7 bài đầu tiên (`K00`–`K06`), bạn đã thành thạo đóng gói và chạy đa dịch vụ trên **một máy chủ duy nhất** bằng Docker Compose. Nhưng điều gì xảy ra khi sản phẩm tăng trưởng vọt lên hàng trăm nghìn người dùng đồng thời?

- [!] Máy chủ duy nhất cháy ổ cứng hoặc hết sạch RAM lúc 3 giờ sáng — ai sẽ tự động chuyển 15 container sang máy chủ lành lặn khác trong vài giây mà không cần kỹ sư thức dậy?
- [>] Làm sao nâng cấp phiên bản API thanh toán trên 12 máy chủ cùng lúc mà không làm rớt bất kỳ giao dịch nào?

**Kubernetes (`K8s` — chữ `8` là viết tắt của 8 chữ cái giữa `K` và `s`)** ra đời để làm ==Hệ điều hành của cả cụm nhiều máy chủ==: bạn chỉ cần nộp một **bản thiết kế trạng thái mong muốn**, còn K8s tự động canh gác và chữa lành hệ thống suốt 24/7!

## 1. Khi nào chưa cần Kubernetes, và khi nào nên dùng Kubernetes?

> [!NOTE] Nguyên tắc lựa chọn hạ tầng phù hợp năm 2026
> Không phải dự án nào cũng cần sử dụng Kubernetes ngay từ ngày đầu tiên. Hãy chọn công cụ phù hợp với quy mô và bài toán vận hành thực tế:
> - **Chưa cần K8s (1 máy chủ VPS đơn lẻ / Dự án nội bộ nhỏ):** **`Docker Compose v2`** trên 1 máy Linux thừa sức chạy mượt hàng nghìn người dùng với chi phí vận hành gần như bằng 0.
> - **Chưa cần tự quản lý K8s (Startup MVP / Web & AI API cần co giãn tự động nhanh):** Các nền tảng Serverless Container như **`Google Cloud Run`**, **`AWS App Runner`** hoặc **`Fly.io`** nhận thẳng Docker Image của bạn và tự lo HTTPS + autoscale (thậm chí thu về 0 khi vắng khách).
> - **Khi Kubernetes thực sự phù hợp:** Hệ thống có nhiều dịch vụ đa ngôn ngữ (Node.js, Python FastAPI, Go, Workers), cần **tự chữa lành đa máy chủ (`Self-Healing`)**, định tuyến & tường lửa nội bộ chặt chẽ, kiểm soát chi phí phần cứng ở quy mô lớn và **không bị khóa chặt vào một đám mây duy nhất (`Cloud-Agnostic`)**.

Khi bước vào thế giới K8s, người mới hay choáng ngợp vì có quá nhiều tên gọi (`Pod`, `Deployment`, `Service`, `Ingress`...). Hãy nhìn **Phân Cấp 6 Tầng Đối Tượng** dưới đây trước tiên — bạn sẽ thấy mọi mảnh ghép ăn khớp vô cùng tự nhiên:

```visual
kind: flow
title: "Phân Cấp 6 Tầng Đối Tượng Trong Kubernetes"
subtitle: "Nắm vững chuỗi 6 mắt xích này để không bị nhầm lẫn giữa các loại tài nguyên YAML của K8s"
steps:
  - icon: box
    badge: "Tầng 1 · Nhân lõi"
    title: "Container"
    desc: "Tiến trình ứng dụng (FastAPI / Node.js) đóng gói từ Docker Image của bạn"
    code: "shop-api:1.4.0"
    tone: slate
    edge: "bọc vào trong"
  - icon: package
    badge: "Tầng 2 · Đơn vị cơ bản (K08)"
    title: "Pod"
    desc: "Đơn vị nhỏ nhất trên K8s bọc 1+ container dùng chung 1 địa chỉ IP nội bộ"
    code: "kind: Pod"
    tone: sky
    edge: "nhân bản & hồi sinh"
  - icon: layers
    badge: "Tầng 3–4 · Điều phối (K09)"
    title: "ReplicaSet & Deployment"
    desc: "Giữ đủ quân số 3 Pod sống và cuộn phiên bản mới không rớt mạng"
    code: "kind: Deployment"
    tone: emerald
    edge: "cung cấp điểm truy cập ổn định"
  - icon: network
    badge: "Tầng 5 · Định tuyến nội bộ (K10)"
    title: "Service"
    desc: "Cấp IP ảo & tên miền DNS bất biến đứng trước các Pod hay đổi IP"
    code: "kind: Service"
    tone: cyan
    edge: "mở cửa đón Internet"
  - icon: globe
    badge: "Tầng 6 · Cổng chính HTTPS (K11)"
    title: "Ingress / Gateway API"
    desc: "Giải mã chứng chỉ HTTPS ngoài Internet rồi rẽ nhánh /api, /web vào từng Service"
    code: "Ingress / HTTPRoute"
    tone: amber
```

## 2. Kiến trúc Cụm Kubernetes: Control Plane (Điều phối) và Worker Nodes (Thực thi)

```visual
kind: illustration
diagram: "kube:k07"
src: "/illustrations/kube/k8s-control-plane-brain.jpg"
alt: "Kiến trúc tổng thể cụm Kubernetes gồm Control Plane (API Server, etcd, Scheduler, Controller) và Worker Node (kubelet, containerd, kube-proxy)"
title: "Kiến Trúc Cụm Kubernetes: Control Plane (Điều Phối) & Worker Node (Thực Thi)"
subtitle: "Luồng phối hợp giữa cổng trung tâm kube-apiserver, sổ cái etcd, các đại lý trên Node và vòng lặp đối soát trạng thái 24/7"
caption: "Kiến trúc phân tách giữa Control Plane ra quyết định với các Worker Node chạy Pod qua containerd và vòng lặp tự phục hồi Reconciliation Loop"
callouts:
  - num: 1
    label: "Control Plane — Thành phần điều phối & Sổ cái etcd"
    desc: "Mọi thao tác đều đi qua cổng HTTPS duy nhất là kube-apiserver; chỉ thành phần này được phép đọc/ghi trực tiếp vào kho dữ liệu etcd."
    tone: cyan
  - num: 2
    label: "Worker Node — Bộ ba kubelet, containerd & kube-proxy"
    desc: "kubelet nhận chỉ thị từ API Server để ra lệnh cho containerd bật Pod, trong khi kube-proxy duy trì bảng định tuyến mạng trên Node."
    tone: emerald
  - num: 3
    label: "Vòng lặp Đối soát (Reconciliation Loop) 24/7"
    desc: "Controller Manager liên tục so sánh trạng thái thực tế với YAML mong muốn để tự động đẻ bù Pod mới ngay khi có máy chủ gặp sự cố."
    tone: cyan
```

Một cụm (**Cluster**) Kubernetes luôn chia thành hai nhóm thành phần rõ rệt: **Control Plane** (thành phần điều phối, lưu trữ sổ cái và ra quyết định lập lịch) và **Worker Nodes** (các máy chủ thực sự cấp CPU/RAM để chạy container ứng dụng của bạn). Có thể hình dung Control Plane như ban điều hành trung tâm, còn Worker Nodes như các phân xưởng thực thi:

```visual
kind: layers
title: "Kiến Trúc Một Cụm Kubernetes Chuẩn — Control Plane vs Worker Nodes"
subtitle: "Nguyên tắc bảo mật cốt lõi: Chỉ duy nhất kube-apiserver được phép đọc/ghi trực tiếp vào kho dữ liệu etcd!"
columns:
  - title: Control Plane (Thành phần điều phối)
    badge: Quản trị & Ra quyết định
    tone: cyan
    layers:
      - label: kube-apiserver
        sub: Cổng giao tiếp REST API (HTTPS) duy nhất của toàn cụm — mọi lệnh kubectl đều gửi YAML/JSON tới đây
        note: Cửa ngõ trung tâm
        tone: sky
      - label: etcd
        sub: Cơ sở dữ liệu phân tán dạng Key-Value lưu nguồn sự thật duy nhất (Single Source of Truth) của cụm
        note: Sổ cái trạng thái
        tone: amber
      - label: kube-scheduler
        sub: Quan sát Pod mới chưa có chỗ (Pending), tính toán CPU/RAM trống rồi gán Pod về Worker Node phù hợp
        note: Người xếp chỗ
        tone: cyan
      - label: kube-controller-manager
        sub: Các vòng lặp tuần tra 24/7 — thấy yêu cầu 3 bản sao mà thực tế còn 2 là lập tức yêu cầu tạo bù bản thứ 3
        note: Tuần tra tự động
        tone: cyan
    footer: Trên Cloud (EKS, GKE, AKS), nhà cung cấp quản lý sẵn toàn bộ Control Plane cho bạn!
  - title: Worker Node (Máy chủ chạy ứng dụng)
    badge: Thực thi Workload
    tone: emerald
    layers:
      - label: kubelet
        sub: Đại lý quản đốc cắm chốt trên từng Worker Node — nhận chỉ thị từ apiserver, báo cáo sức khỏe Node/Pod
        note: Quản đốc tại chỗ
        tone: emerald
      - label: containerd (Container Runtime)
        sub: Bộ máy chuẩn CRI trực tiếp kéo OCI Image và khởi chạy tiến trình Linux Container
        note: Chạy tiến trình
        tone: sky
      - label: kube-proxy (hoặc Cilium eBPF)
        sub: Duy trì bảng định tuyến mạng trên mỗi Node để dẫn gói tin từ Service tới đúng IP của Pod khỏe mạnh
        note: Định tuyến mạng
        tone: cyan
    footer: Có thể co giãn linh hoạt từ 2 máy đến hàng nghìn Worker Node theo tải thực tế
```

## 3. Cơ chế cốt lõi của K8s: Vòng lặp Đối soát (`Reconciliation Loop`)

==Vòng lặp Đối soát (Reconciliation Loop)== là cơ chế cốt lõi giúp Kubernetes vận hành theo tư duy **Khai báo (`Declarative`)**: thay vì ra lệnh từng bước, bạn chỉ nộp bản khai báo **trạng thái mong muốn (`Desired State`)** (ví dụ `replicas: 3`) vào `etcd`. Các Controller liên tục theo dõi **trạng thái hiện tại (`Current State`)** trên cụm — mỗi khi `Current != Desired`, hệ thống tự động tạo bù hoặc điều chỉnh Pod về đúng trạng thái đã khai báo (tương tự như chiếc máy điều hòa đặt ở mức `24°C`: cảm biến liên tục đo nhiệt độ phòng và tự bật/tắt lốc lạnh để duy trì đúng `24°C`).

```visual
kind: compare
title: Chuyển Dịch Tư Duy — Mệnh Lệnh (Imperative) vs Khai Báo (Declarative)
subtitle: Sự khác biệt cốt lõi giữa việc tự gõ docker run trên máy lẻ và điều phối tự động bằng Kubernetes
left:
  badge: "CÁCH CŨ · Imperative (Mệnh lệnh)"
  title: Ra lệnh từng bước thủ công
  tone: amber
  code: |
    # Bắt máy chủ làm ngay hành động này 1 lần:
    docker run -d --name shop-api -p 3000:3000 app:1.0
  lang: bash
  bullets:
    - "Bạn chỉ định **cách làm từng bước**: chạy lệnh xong là CLI kết thúc trách nhiệm"
    - "Nếu 2 giờ sáng ổ cứng máy chủ hỏng làm sập tiến trình, **không ai tự chuyển sang máy khác**"
    - "Sửa tay lâu ngày dẫn đến lệch cấu hình (*Configuration Drift*)"
right:
  badge: "CHUẨN K8S · Declarative (Khai báo)"
  title: Giao trạng thái đích cho Vòng lặp Đối soát
  tone: emerald
  code: |
    # Nộp bản thiết kế trạng thái mong muốn:
    kubectl apply -f deployment.yaml   # replicas: 3
  lang: bash
  bullets:
    - "Bạn chỉ mô tả **trạng thái mong muốn** (`Desired State: replicas: 3`) trong tệp YAML lưu trên Git"
    - "Controller chạy vòng lặp đối soát liên tục 24/7 với **trạng thái hiện tại** (`Current State`)"
    - "Tự động chữa lành (**Self-Healing**): hễ `Current != Desired` là tự tạo bù Pod sang Node khỏe mạnh!"
```

```visual
kind: flow
title: Vòng Lặp Đối Soát Tự Phục Hồi (Reconciliation / Control Loop)
subtitle: Điều gì diễn ra tự động lúc 3 giờ sáng khi Worker Node #2 bất ngờ mất điện?
steps:
  - icon: file-code
    badge: 1. Desired State
    title: Khai Báo Đích
    desc: Bạn nộp YAML yêu cầu duy trì replicas là 3 vào etcd qua kube-apiserver
    code: "replicas: 3"
    tone: sky
    edge: quan sát 24/7
  - icon: eye
    badge: 2. Observe & Diff
    title: Phát Hiện Lệch
    desc: Node #2 sập làm chết 1 Pod — Controller thấy thực tế chỉ còn 2 Pod sống
    code: "Current (2) != Desired (3)"
    tone: amber
    edge: tạo bù 1 Pod
  - icon: cpu
    badge: 3. Schedule
    title: Xếp Chỗ Mới
    desc: kube-scheduler tìm thấy Node #3 còn dư CPU/RAM và gán Pod mới sang đó
    code: "Pending -> Node #3"
    tone: cyan
    edge: kubelet kéo Image
  - icon: shield-check
    badge: 4. Self-Healing
    title: Hội Tụ Đủ Quân Số
    desc: kubelet trên Node #3 bảo containerd bật Pod mới — dịch vụ lành lặn 100%
    code: "2 + 1 === 3 Ready"
    tone: emerald
```

## 4. Bốn trường gốc bắt buộc trong mọi Manifest YAML của Kubernetes [!badge:sky:Chuẩn K8s 1.30+]

Dù bạn viết một `Pod` nhỏ 12 dòng hay một `Deployment` lớn 200 dòng, **100% tài nguyên chuẩn của Kubernetes** đều mở đầu bằng đúng ==4 trường gốc (`apiVersion`, `kind`, `metadata`, `spec`)== ở sát lề trái:

```visual
kind: anatomy
title: Cấu Trúc 4 Trường Gốc Trong Mọi Manifest YAML Của Kubernetes
subtitle: Khác với Docker Compose (services/volumes), mọi đối tượng K8s đều tuân thủ khuôn mẫu 4 khóa gốc đồng nhất này
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
    tone: cyan
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
      - "Cấu trúc bên trong `spec` thay đổi tùy theo từng `kind` (ví dụ `containers` cho Pod, `replicas` + `selector` + `template` cho Deployment)"
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
spec:                       # 4. Đặc tả trạng thái mong muốn (cấu trúc bên trong tùy thuộc vào kind)
  containers:
    - name: web
      image: nginx:1.27-alpine
      ports:
        - containerPort: 80
```

> [!WARNING] Cảnh báo bẫy lịch sử API Version (chuẩn K8s >= 1.30 năm 2026)
> Nhiều bài hướng dẫn cũ trước năm 2020 vẫn chỉ viết nhánh nháp `extensions/v1beta1` cũ cho `Deployment` hoặc `Ingress` — nhánh nháp này **đã bị gỡ bỏ hoàn toàn khỏi Kubernetes từ lâu**!
> - Với `Pod`, `Service`, `ConfigMap`, `Secret`, `Namespace`, `PersistentVolumeClaim`: luôn dùng **`apiVersion: v1`**.
> - Với `Deployment`, `StatefulSet`, `DaemonSet`, `ReplicaSet`: luôn dùng **`apiVersion: apps/v1`** (và khai báo rõ `spec.selector.matchLabels`).

## 5. Lệnh `kubectl` đầu tay & Bộ đồ nghề Cụm Local / TUI chuẩn 2026

`kubectl` là điều khiển từ xa dòng lệnh nói chuyện trực tiếp với `kube-apiserver` qua HTTPS:

```bash
# 1. Liệt kê Pod ở namespace mặc định (default):
kubectl get pods

# 2. Liệt kê TẤT CẢ Pod trên mọi namespace toàn cụm (gồm cả kube-system nơi coredns đang chạy):
kubectl get pods -A

# 3. Xem chi tiết trạng thái và sự kiện (Events) của Pod:
kubectl describe pod payment-pod
```

> [!TIP] Bộ công cụ thực hành K8s hiện đại năm 2026 giúp bạn thao tác nhanh gấp 5 lần!
> - **Dựng cụm K8s miễn phí ngay trên Laptop:** Dùng **`kind`** (*Kubernetes in Docker* — dựng cụm đa node chỉ trong 20 giây ngay bên trong Docker/OrbStack), **`minikube`**, hoặc **`k3s`** (bản K8s siêu nhẹ của CNCF tốn chưa tới 512MB RAM, cực hợp cho máy chủ nhỏ & Edge).
> - **Bộ ba trợ thủ Terminal của mọi kỹ sư SRE:** Cài thêm **`k9s`** (giao diện bảng điều khiển TUI trực quan ngay trong Terminal để xem log/describe/shell chỉ bằng 1 phím tắt) cùng cặp **`kubectx`** & **`kubens`** (chuyển đổi tức thì giữa các cụm và các namespace không cần gõ lặp lại `-n` mỏi tay)!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **Khi nào dùng gì:** 1 server nhỏ → `Docker Compose` · Serverless tự co giãn → `Cloud Run / Fly.io` · Hệ thống đa dịch vụ cần tự chữa lành đa máy chủ → **Kubernetes**.
> - **Chuỗi 6 tầng:** `Container` → `Pod` → `ReplicaSet` → `Deployment` → `Service` → `Ingress / Gateway API`.
> - **Control Plane:** `kube-apiserver` (cổng duy nhất chạm `etcd`), `etcd`, `kube-scheduler`, `kube-controller-manager` · **4 trường gốc YAML:** ==`apiVersion`, `kind`, `metadata`, `spec`==.
