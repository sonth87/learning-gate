# Kiến trúc Kubernetes, Vòng lặp Điều khiển & Giải phẫu Manifest YAML

Khi bạn chạy 2–3 container trên một máy chủ đơn lẻ, **Docker Compose** làm rất tốt nhiệm vụ của nó. Nhưng điều gì xảy ra khi lượng người dùng tăng gấp 50 lần vào đêm Flash Sale?
- Một máy chủ vật lý hết sạch RAM hoặc cháy ổ cứng lúc 3 giờ sáng — ai sẽ tự động chuyển 15 container sang máy chủ lành lặn khác trong vòng vài giây mà không cần kỹ sư thức dậy?
- Làm sao nâng cấp phiên bản API thanh toán trên 12 máy chủ cùng lúc mà không làm rớt bất kỳ giao dịch nào của khách hàng?

**Kubernetes (K8s)** ra đời để đóng vai trò như một **"Hệ điều hành của cả trung tâm dữ liệu"**: bạn không còn ra lệnh thủ công cho từng máy lẻ nữa, mà giao cho K8s một bản thiết kế trạng thái mong muốn để nó tự động duy trì suốt ngày đêm.

---

## 1. Bức tranh toàn cảnh: Control Plane vs Worker Nodes

Một cụm (Cluster) Kubernetes luôn chia thành hai nhóm máy rõ rệt giống như **Ban điều hành trung tâm** và **Đội xưởng sản xuất**:

| Nhóm | Thành phần cốt lõi | Vai trò thực tế (liên hệ dễ nhớ) |
| --- | --- | --- |
| **Control Plane** *(Bộ não điều phối)* | **`kube-apiserver`** | **Cổng giao tiếp duy nhất** của toàn cụm (REST API qua HTTPS). Mọi lệnh `kubectl` bạn gõ đều gửi JSON/YAML tới đây. |
| **Control Plane** | **`etcd`** | Kho cơ sở dữ liệu phân tán dạng Key-Value lưu **nguồn sự thật duy nhất** về trạng thái toàn cụm. |
| **Control Plane** | **`kube-scheduler`** | Người xếp chỗ thông minh: nhìn Pod mới chưa có nhà (`Pending`), tính xem Worker Node nào còn đủ CPU/RAM rồi gán Pod về Node đó. |
| **Control Plane** | **`kube-controller-manager`** | Các vòng lặp tuần tra không ngủ: thấy yêu cầu 3 bản sao mà thực tế chỉ còn 2 thì lập tức tạo bù bản thứ 3. |
| **Worker Node** *(Máy chủ chạy app)* | **`kubelet`** | "Quản đốc" cắm chốt trên từng máy Worker: nhận chỉ thị từ `apiserver`, bảo Container Runtime kéo Image và bật/khám sức khoẻ Pod. |
| **Worker Node** | **`containerd`** *(Runtime)* | Bộ máy cấp thấp thực sự khởi chạy tiến trình Linux Container (chuẩn CRI hiện đại thay thế Docker shim cũ). |
| **Worker Node** | **`kube-proxy`** | Duy trì bảng định tuyến mạng (`iptables` / `IPVS` / `eBPF`) trên mỗi Node để chuyển gói tin từ Service tới đúng IP của Pod. |

---

## 2. Tư duy Cốt lõi nhất của K8s: Imperative vs Declarative Control Loop

Khi dùng Docker CLI ở Cấp độ 0, bạn làm việc theo lối **Mệnh lệnh (Imperative)**: *"Này máy chủ, hãy chạy lệnh `docker run` này ngay đi!"*. Nếu 2 tiếng sau tiến trình sập và máy chủ khởi động lại lệch cấu hình, không ai nhớ trạng thái chuẩn ban đầu là gì.

Kubernetes vận hành theo triết lý **Khai báo (Declarative)** xoay quanh **Vòng lặp Điều khiển (Reconciliation / Control Loop)** bất tận:

```text
  [ Trạng thái Mong muốn (Desired State) ]  <--- Bạn nộp file YAML (ví dụ: replicas: 3)
                     │
                     ▼  (So sánh liên tục 24/7)
  [ Trạng thái Thực tế (Actual State) ]     <--- Đang sống 2 Pod (do Node #2 vừa sập)
                     │
                     ▼
  Hành động tự chữa lành (Self-Healing): Đẻ ngay 1 Pod mới sang Node #3 để 2 + 1 === 3!
```

Giống như chiếc điều hoà nhiệt độ đặt ở `24°C`: bạn không tự tay bật/tắt lốc lạnh từng phút, mà bộ cảm biến tự đo nhiệt độ phòng thực tế để điều chỉnh khớp với con số `24°C` đã khai báo.

---

## 3. Bốn trường gốc bắt buộc trong mọi Manifest YAML của Kubernetes

Dù bạn viết một `Pod` nhỏ xíu 12 dòng hay một `Deployment` phức tạp 200 dòng, **100% tài nguyên Kubernetes** đều bắt đầu bằng đúng **4 trường gốc (root fields)** ở sát lề trái:

```yaml
apiVersion: v1              # 1. Nhóm và phiên bản API (ví dụ: v1, apps/v1, networking.k8s.io/v1)
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

### Cảnh báo bẫy lịch sử API Version (chuẩn K8s >= 1.30 năm 2026)
Kubernetes phát triển rất chặt chẽ theo giai đoạn `alpha` → `beta` → `v1` (ổn định). Rất nhiều bài hướng dẫn cũ trên Internet vẫn viết `apiVersion: extensions/v1beta1` cho `Deployment` hoặc `Ingress` — nhánh API nháp này **đã bị gỡ bỏ hoàn toàn từ Kubernetes 1.16 / 1.22**!
- Với `Pod`, `Service`, `ConfigMap`, `Secret`, `Namespace`, `PersistentVolumeClaim`: luôn dùng **`apiVersion: v1`**.
- Với `Deployment`, `StatefulSet`, `DaemonSet`: luôn dùng **`apiVersion: apps/v1`** (và bắt buộc khai báo tường minh `spec.selector.matchLabels` khớp với `spec.template.metadata.labels`).

---

## 4. Làm quen hai lệnh quan sát nền tảng trên `kubectl`

`kubectl` là công cụ dòng lệnh nói chuyện trực tiếp với `kube-apiserver`:

```bash
# Liệt kê Pod ở namespace mặc định (default):
kubectl get pods

# Liệt kê TẤT CẢ Pod trên toàn bộ mọi namespace trong cụm (gồm cả kube-system, staging...):
kubectl get pods -A

# Xem hồ sơ khám sức khoẻ chi tiết (Node được xếp chỗ, IP, trạng thái và bảng Events cuối cùng):
kubectl describe pod payment-pod
```

Hãy ghi nhớ thói quen phản xạ của kỹ sư K8s chuyên nghiệp: `kubectl get` cho bạn biết **cái gì đang bất thường**, còn mục **`Events:`** ở cuối lệnh `kubectl describe` sẽ chỉ tận tay cho bạn **tại sao nó bất thường**!
