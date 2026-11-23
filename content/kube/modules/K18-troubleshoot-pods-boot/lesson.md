# Chẩn đoán lỗi K8s Thực chiến (Phần 1): Quy trình Triage & 4 Trạng thái Kẹt Khởi động

Trên lý thuyết, mọi tệp YAML bạn viết đều chạy mượt mà lên trạng thái `Running` xanh mướt. Nhưng trong công việc thực tế của một kỹ sư Backend/DevOps trực ca vận hành (*On-call*), 80% giá trị chuyên môn của bạn tỏa sáng vào khoảnh khắc bạn gõ `kubectl get pods` và nhìn thấy hàng chữ báo động: `Pending`, `ImagePullBackOff`, `CreateContainerConfigError` hay ==`CrashLoopBackOff`==!

Khi sự cố xảy ra, người mới thường vội vàng xóa Pod đi tạo lại hoặc sửa tệp YAML theo cảm tính. Ngược lại, kỹ sư chuyên nghiệp luôn tuân thủ **Quy trình Chẩn đoán 3 Bước (*3-Step K8s Triage*)** một cách có hệ thống.

```visual
kind: illustration
diagram: "kube:k18"
alt: "Cây quyết định chẩn đoán sự cố khởi động Pod từ Pending, ImagePullBackOff, CreateContainerConfigError đến CrashLoopBackOff --previous"
title: "Sơ Đồ Quyết Định Chẩn Đoán Lỗi Khởi Động Pod: Đọc Events Hạ Tầng vs Logs Phiên Cũ"
subtitle: "Rẽ nhánh chính xác ngay từ giây thứ 5 dựa trên việc tiến trình ứng dụng đã từng được chạy hay chưa"
caption: "Sơ đồ phân nhánh chẩn đoán SRE giữa 3 lỗi kẹt trước vạch xuất phát (xem describe pod) và lỗi sập sau khi chạy (xem logs --previous)"
callouts:
  - num: 1
    label: "Bước 1: Nhìn cột STATUS & RESTARTS trên get pods"
    desc: "Xác định nhanh tên trạng thái báo lỗi và con số RESTARTS để biết container đã từng thực thi dòng code nào hay chưa."
    tone: sky
  - num: 2
    label: "Nhánh chưa kịp chạy: Pending / ImagePull / ConfigError"
    desc: "Ứng dụng chưa bật nên log trống trơn; 100% nguyên nhân (thiếu RAM/PVC, sai tag ảnh, thiếu Secret) nằm ở Events của describe pod."
    tone: amber
  - num: 3
    label: "Nhánh chạy rồi sập: CrashLoopBackOff (logs --previous)"
    desc: "Tiến trình Python / Node.js đã chạy nhưng văng lỗi thoát != 0; dùng cờ --previous để đọc trọn vẹn Traceback của phiên vừa sập."
    tone: rose
```

## 1. Quy trình chẩn đoán sự cố Pod 3 bước chuẩn (`get` → `describe` → `logs`)

Mỗi khi một Pod không đạt trạng thái `READY 1/1` và `Running`, hãy gõ tuần tự từ ngoài vào trong và **rẽ nhánh chuẩn xác dựa trên việc container đã từng chạy được dòng code nào hay chưa**:

```visual
kind: flow
title: Quy Trình Chẩn Đoán 3 Bước Chuẩn SRE (3-Step K8s Triage)
subtitle: Phân nhánh rõ ràng giữa lỗi hạ tầng TRƯỚC khi bật container và lỗi mã nguồn BÊN TRONG container
footer: "Chỉ duy nhất CrashLoopBackOff (trong 4 trạng thái kẹt đầu) là tiến trình code đã chạy thật sự nên mới có dữ liệu trong kubectl logs!"
steps:
  - icon: search
    badge: Bước 1 · Toàn cảnh
    title: Kiểm Tra Trạng Thái Pod
    desc: Xác định chính xác chữ báo lỗi ở cột STATUS và số lần RESTARTS
    code: "kubectl get pods -n <ns>"
    tone: sky
    edge: nếu kẹt TRƯỚC khi chạy
  - icon: doctor
    badge: Bước 2 · Sự kiện Hạ tầng
    title: Đọc Events Cuối Trang
    desc: Dùng cho Pending, ImagePullBackOff, CreateContainerConfigError (chưa có log!)
    code: "kubectl describe pod <pod>"
    tone: amber
    edge: nếu code ĐÃ chạy rồi sập
  - icon: terminal
    badge: Bước 3 · Nhật ký Code
    title: Đọc Traceback Phiên Cũ
    desc: Dùng cho CrashLoopBackOff, Error hoặc RESTARTS > 0 để bắt ngoại lệ Python/JS
    code: "kubectl logs <pod> --previous"
    tone: rose
```

> [!WARNING] Quy tắc vàng tiết kiệm 90% thời gian trực chiến!
> Nếu Pod đang ở trạng thái **`Pending`**, **`ImagePullBackOff`** hoặc **`CreateContainerConfigError`**, container ứng dụng của bạn **chưa từng được bật lên dù chỉ 1 mili-giây**! Vì thế gõ `kubectl logs` hay `kubectl exec` lúc đó hoàn toàn vô tác dụng — câu trả lời 100% nằm ở mục ==`Events:`== cuối lệnh **`kubectl describe pod <tên-pod>`**! Trong 4 trạng thái trên, **chỉ duy nhất `CrashLoopBackOff`** chứng tỏ container ứng dụng đã thực sự được khởi chạy.

## 2. Phân tích 4 trạng thái lỗi khởi động phổ biến

Hãy đối chiếu từng trạng thái lỗi với đúng mắt xích bị tắc trong vòng đời khởi tạo Pod để bắt trúng mạch ngay từ giây đầu tiên:

```visual
kind: troubleshoot
title: Bảng Chẩn Đoán 4 Trạng Thái Lỗi Khởi Động Phổ Biến [!badge:rose:On-Call Playbook]
subtitle: Triệu chứng trên get pods -> Thủ phạm gốc rễ -> Câu lệnh chẩn đoán quyết định
items:
  - symptom: "1. Pending (Tắc ở khâu Lập lịch & Gắn đĩa — kube-scheduler / CSI)"
    badge: Chưa xếp được Node
    tone: amber
    cause: "PVC chưa `Bound` được ổ đĩa (`Warning FailedScheduling: pod has unbound immediate PersistentVolumeClaims` do gõ sai tên `storageClassName` kiểu `fast-ssd-typo`), hoặc toàn cụm cạn sạch CPU/RAM không Node nào đủ đáp ứng `resources.requests`."
    fix: "Đọc Events của Pod, sau đó kiểm tra trạng thái PVC và đối chiếu danh sách StorageClass có thật trên cụm."
    cmd: kubectl describe pod <name> && kubectl get pvc && kubectl get storageclass
  - symptom: "2. ErrImagePull / ImagePullBackOff (Tắc ở khâu Kéo ảnh — containerd)"
    badge: Không tải được Image
    tone: rose
    cause: "Gõ sai tên Image hoặc sai tag phiên bản không tồn tại trên GHCR/Docker Hub (ví dụ `1.4.0-typo`), hoặc kéo từ kho ảnh riêng tư (Private Registry) nhưng quên gắn `imagePullSecrets` (bị từ chối 401/403 Unauthorized)."
    fix: "Đọc dòng `Failed to pull image ... not found / unauthorized` ở mục Events của `describe pod`, sửa lại đúng tag hoặc bổ sung `imagePullSecrets`."
    cmd: kubectl describe pod <name>
  - symptom: "3. CreateContainerConfigError (Tắc ở khâu Lắp ráp Env/Mount — kubelet)"
    badge: Thiếu ConfigMap / Secret
    tone: cyan
    cause: "Xảy ra TRƯỚC KHI container chạy: Pod tham chiếu tới một `Secret` hoặc `ConfigMap` chưa từng được tạo trong cùng Namespace, hoặc gõ lệch tên khóa trong `secretKeyRef` / `configMapKeyRef`."
    fix: "Xem Events để biết thiếu chính xác tên Secret/ConfigMap hay key nào, rồi đối chiếu danh sách thực tế trong Namespace."
    cmd: kubectl describe pod <name> && kubectl get secrets,cm
  - symptom: "4. CrashLoopBackOff (Tắc ở khâu Thực thi mã nguồn — Tiến trình Python / Node.js)"
    badge: Code chạy lên rồi sập!
    tone: rose
    cause: "Image đã tải xong, cấu hình đã nạp đủ, container chạy `uvicorn` / `node` nhưng văng lỗi thoát mã `!= 0` ngay lập tức (như `ModuleNotFoundError`, `ValidationError` hay `TypeError`)! kubelet khởi động lại theo chu kỳ lùi lũy thừa."
    fix: "Đọc bản ghi stdout/stderr kèm dòng Traceback của phiên container vừa chết ngay trước đó bằng cờ `--previous` (`-p`)."
    cmd: kubectl logs <name> --previous
```

## 3. Chu kỳ lùi lũy thừa (`Exponential Backoff`) & Cách đọc log với cờ `--previous` (`-p`) ở `CrashLoopBackOff`

Khi ứng dụng bị lỗi lúc khởi động (ví dụ thiếu biến môi trường làm `pydantic-settings` của FastAPI báo lỗi hoặc `TypeError` trong Node.js), container bật lên trong `0.2 giây` rồi chết. Để tránh một container lỗi liên tục đốt cháy 100% CPU của Worker Node, `kubelet` áp dụng thuật toán **Lùi lũy thừa nhân đôi (*Exponential Backoff*)**:

```visual
kind: flow
title: Quy Luật Lùi Lũy Thừa (Exponential Backoff) & Cách Bắt Trọn Stack Trace
subtitle: "Thời gian chờ khởi động lại nhân đôi liên tiếp và chạm trần tối đa ở 5 phút (300 giây)"
steps:
  - icon: flame
    badge: 0.2s đầu tiên
    title: Tiến Trình Sập (Exit != 0)
    desc: Ứng dụng văng ngoại lệ chưa bắt (Traceback / Uncaught Exception) và thoát lỗi ngay
    code: "Exit Code: 1"
    tone: rose
    edge: kubelet hãm phanh
  - icon: refresh
    badge: Nhân đôi chu kỳ nghỉ
    title: Exponential Backoff
    desc: Nghỉ tăng dần lũy thừa 10s -> 20s -> 40s -> 80s -> 160s...
    code: "10s -> 20s -> 40s..."
    tone: amber
    edge: khóa trần tối đa
  - icon: shield
    badge: Trần chờ 300s
    title: Chạm Trần 5 Phút
    desc: Thời gian chờ tối đa giữ ở mức 5 phút (300s) giữa mỗi lần thử bật lại
    code: "Max delay: 5m (300s)"
    tone: cyan
    edge: truy xuất phiên cũ
  - icon: terminal
    badge: Cờ quan trọng --previous
    title: Bắt Tận Tay Stack Trace
    desc: Lấy trọn vẹn stdout/stderr của phiên bản container vừa mới chết ngay trước đó!
    code: "kubectl logs <pod> --previous"
    tone: emerald
```

Nếu bạn chỉ gõ `kubectl logs <pod>` đúng lúc `kubelet` vừa tạo container mới chưa kịp in lỗi, màn hình có thể trống trơn. Thêm cờ ==`--previous`== (viết tắt `-p`) là chìa khóa bắt buộc:

```bash
kubectl logs order-worker-10001 --previous
```

> [!TIP] Tăng tốc chẩn đoán nhanh hơn trên Terminal thực tế với `k9s` & `kubectl debug`
> - Trong công cụ giao diện TUI **`k9s`**, bạn chỉ cần di vệt sáng vào Pod đang đỏ rồi bấm phím **`d`** (tương đương `describe`), phím **`l`** (xem `logs`) hoặc phím **`p`** (xem ngay `logs --previous`!) trong 0.5 giây!
> - Nếu gặp container tối giản (như Distroless) không có `/bin/sh` để gõ `exec`, K8s hiện đại cung cấp lệnh **`kubectl debug -it <pod> --image=busybox:1.36`** để gắn tạm một container chẩn đoán vào chung không gian mạng với Pod đó!

## 4. Hướng dẫn thực hành chẩn đoán & khắc phục lỗi (`Troubleshoot`)

Trong 4 ca trực chiến `K18.1` → `K18.4` ngay sau bài học:

- [x] **Bước 1 — Chẩn đoán lỗi bằng Terminal thật:** Bạn được cung cấp một **Khung Terminal Chẩn đoán** kết nối trực tiếp vào cụm mô phỏng đang gặp sự cố. Hãy gõ lệnh chẩn đoán lỗi trước (`kubectl get pods`, `kubectl describe pod ...`, `kubectl get pvc`, `kubectl logs ... --previous`) để tự mắt tìm ra bằng chứng lỗi thay vì đoán mò!
- [x] **Bước 2 — Nộp bản vá YAML:** Sau khi xác định đúng thủ phạm gốc rễ, hãy sửa cấu hình YAML ở trình soạn thảo bên dưới và bấm chấm điểm — bộ mô phỏng sẽ tự động `apply` bản vá và kiểm tra các Pod chuyển sang **`Running` (`Ready`)** xanh mướt!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`Pending`**, **`ImagePullBackOff`**, **`CreateContainerConfigError`** xảy ra **TRƯỚC KHI container chạy** → Bắt buộc dùng **`kubectl describe pod <pod>`** đọc mục **`Events`** (không có `logs`!).
> - **`CrashLoopBackOff`** là trạng thái duy nhất trong 4 trạng thái trên mà **code đã chạy thật rồi sập** → Nghỉ lùi lũy thừa **`10s → 20s → 40s...` (tối đa `5m` / `300s`)** → Dùng **`kubectl logs <pod> --previous`**!
> - Gặp `pod has unbound immediate PersistentVolumeClaims` → Kiểm tra ngay `kubectl get pvc` và `kubectl get storageclass`.
