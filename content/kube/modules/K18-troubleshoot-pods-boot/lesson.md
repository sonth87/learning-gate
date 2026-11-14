# Khám bệnh K8s Thực chiến (Phần 1): Quy trình Triage & 4 Trạng thái Kẹt Khởi động

Trên lý thuyết, mọi tệp YAML bạn viết đều chạy mượt mà lên trạng thái `Running` xanh mướt. Nhưng trong công việc thực tế của một kỹ sư DevOps/Backend trực ca vận hành (*On-call*), 80% giá trị chuyên môn của bạn toả sáng vào khoảnh khắc bạn gõ `kubectl get pods` và nhìn thấy hàng chữ báo động: {amber:`Pending`}, {rose:`ImagePullBackOff`}, {violet:`CreateContainerConfigError`} hay ==`CrashLoopBackOff`==!

Khi sự cố xảy ra, người mới thường hoảng loạn xoá đại Pod đi tạo lại hoặc sửa mò mẫm tệp YAML theo cảm tính. Ngược lại, kỹ sư giàu kinh nghiệm luôn tuân thủ **Quy trình Chẩn đoán 3 Bước (*3-Step K8s Triage*)** chính xác như bác sĩ đọc phim X-quang.

```visual
kind: illustration
diagram: "kube:k18"
alt: "Cây quyết định chẩn đoán sự cố khởi động Pod từ Pending, ImagePullBackOff, CreateContainerConfigError đến CrashLoopBackOff --previous"
title: "Cây Quyết Định Khám Bệnh Khởi Động Pod: Đọc Events Hạ Tầng vs Logs Phiên Cũ"
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
    desc: "Tiến trình Node.js đã chạy nhưng văng lỗi thoát != 0; dùng cờ --previous để đọc trọn vẹn Stack Trace của phiên vừa sập."
    tone: rose
```

## 1. Quy trình Khám bệnh 3 Bước Bất biến (Không bao giờ đoán mò!)

Mỗi khi một Pod không đạt trạng thái `READY 1/1` và `Running`, hãy gõ tuần tự từ ngoài vào trong và **rẽ nhánh chuẩn xác dựa trên việc container đã từng chạy hay chưa**:

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
    title: Đọc Stack Trace Phiên Cũ
    desc: Dùng cho CrashLoopBackOff, Error hoặc RESTARTS > 0 để bắt ngoại lệ JS
    code: "kubectl logs <pod> --previous"
    tone: rose
```

> [!WARNING] Quy tắc vàng tiết kiệm 90% thời gian trực chiến!
> Nếu Pod đang ở trạng thái **`Pending`**, **`ImagePullBackOff`** hoặc **`CreateContainerConfigError`**, container ứng dụng của bạn **chưa từng được bật lên dù chỉ 1 mili-giây**! Vì thế gõ `kubectl logs` hay `kubectl exec` lúc đó hoàn toàn vô tác dụng — câu trả lời 100% nằm ở mục ==`Events:`== cuối lệnh **`kubectl describe pod <tên-pod>`**! Trong 4 trạng thái trên, **chỉ duy nhất ==`CrashLoopBackOff`==** chứng tỏ container ứng dụng đã thực sự được khởi chạy.

## 2. Giải phẫu chi tiết 4 ca bệnh kẹt khởi động kinh điển

Hãy đối chiếu từng trạng thái lỗi với đúng mắt xích bị tắc trong vòng đời khởi tạo Pod để bắt trúng mạch ngay từ giây đầu tiên:

```visual
kind: troubleshoot
title: Bảng Khám Bệnh 4 Trạng Thái Kẹt Khởi Động Kinh Điển [!badge:rose:On-Call Playbook]
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
    tone: violet
    cause: "Xảy ra TRƯỚC KHI container chạy: Pod tham chiếu tới một `Secret` hoặc `ConfigMap` chưa từng được tạo trong cùng Namespace, hoặc gõ lệch tên khoá trong `secretKeyRef` / `configMapKeyRef`."
    fix: "Xem Events để biết thiếu chính xác tên Secret/ConfigMap hay key nào, rồi đối chiếu danh sách thực tế trong Namespace."
    cmd: kubectl describe pod <name> && kubectl get secrets,cm
  - symptom: "4. CrashLoopBackOff (Tắc ở khâu Thực thi mã nguồn — Tiến trình Node.js)"
    badge: Code chạy lên rồi sập!
    tone: rose
    cause: "Image đã tải xong, cấu hình đã nạp đủ, container chạy `node dist/server.js` nhưng văng Uncaught Exception thoát mã lỗi `!= 0` ngay lập tức! kubelet khởi động lại theo chu kỳ lùi luỹ thừa."
    fix: "Đọc bản ghi stdout/stderr kèm dòng Stack Trace của phiên container vừa chết ngay trước đó bằng cờ `--previous` (`-p`)."
    cmd: kubectl logs <name> --previous
```

## 3. Giải mã chu kỳ lùi luỹ thừa & Bí quyết cờ `--previous` (`-p`) ở `CrashLoopBackOff`

Khi một ứng dụng Node.js bị lỗi lúc khởi động (chẳng hạn bản phát hành mới `2.0.0-crash` quên kiểm tra biến `undefined` dẫn tới `TypeError: Cannot read properties of undefined`), container bật lên trong `0.2 giây` rồi chết. Để tránh một container lỗi liên tục đốt cháy 100% CPU của Worker Node, `kubelet` áp dụng thuật toán **Lùi luỹ thừa nhân đôi (*Exponential Backoff*)**:

```visual
kind: flow
title: Quy Luật Lùi Luỹ Thừa (Exponential Backoff) & Cách Bắt Trọn Stack Trace
subtitle: "Thời gian chờ khởi động lại nhân đôi liên tiếp và chạm trần tối đa ở 5 phút (300 giây)"
steps:
  - icon: flame
    badge: 0.2s đầu tiên
    title: Tiến Trình Sập (Exit != 0)
    desc: Node.js văng ngoại lệ chưa bắt (Uncaught Exception) và thoát lỗi ngay
    code: "Exit Code: 1"
    tone: rose
    edge: kubelet hãm phanh
  - icon: refresh
    badge: Nhân đôi chu kỳ nghỉ
    title: Exponential Backoff
    desc: Nghỉ tăng dần luỹ thừa 10s -> 20s -> 40s -> 80s -> 160s...
    code: "10s -> 20s -> 40s..."
    tone: amber
    edge: khoá trần tối đa
  - icon: shield
    badge: Trần chờ 300s
    title: Chạm Trần 5 Phút
    desc: Thời gian chờ tối đa giữ ở mức 5 phút (300s) giữa mỗi lần thử bật lại
    code: "Max delay: 5m (300s)"
    tone: violet
    edge: truy xuất xác cũ
  - icon: terminal
    badge: Cờ sống còn --previous
    title: Bắt Tận Tay Stack Trace
    desc: Lấy trọn vẹn stdout/stderr của phiên bản container vừa mới chết ngay trước đó!
    code: "kubectl logs <pod> --previous"
    tone: emerald
```

Nếu bạn chỉ gõ `kubectl logs <pod>` đúng lúc `kubelet` vừa tạo container mới chưa kịp in lỗi, màn hình có thể trống trơn. Thêm cờ ==`--previous`== (viết tắt `-p`) là chìa khoá bắt buộc:

```bash
kubectl logs order-worker-10001 --previous
```

## 4. Hướng dẫn làm các bài tập Thực hành Khám bệnh (`Troubleshoot`) ở Module này

Trong 4 ca trực chiến `K18.1` → `K18.4` ngay sau bài học:

- [x] **Bước 1 — Khám bệnh bằng Terminal thật:** Bạn được cung cấp một **Khung Terminal Chẩn đoán** kết nối trực tiếp vào cụm mô phỏng đang gặp sự cố. Hãy gõ lệnh khám bệnh trước (`kubectl get pods`, `kubectl describe pod ...`, `kubectl get pvc`, `kubectl logs ... --previous`) để tự mắt tìm ra bằng chứng lỗi thay vì đoán mò!
- [x] **Bước 2 — Nộp bản vá YAML:** Sau khi xác định đúng thủ phạm gốc rễ, hãy sửa cấu hình YAML ở trình soạn thảo bên dưới và bấm chấm điểm — bộ mô phỏng sẽ tự động `apply` bản vá và kiểm tra các Pod chuyển sang **`Running` (`Ready`)** xanh mướt!

> [!REMEMBER] Ghi nhớ bỏ túi
> - **`Pending`**, **`ImagePullBackOff`**, **`CreateContainerConfigError`** xảy ra **TRƯỚC KHI container chạy** → Bắt buộc dùng **`kubectl describe pod <pod>`** đọc mục **`Events`** (không có `logs`!).
> - **`CrashLoopBackOff`** là trạng thái duy nhất trong 4 trạng thái trên mà **code đã chạy thật rồi sập** → Nghỉ lùi luỹ thừa **`10s → 20s → 40s...` (tối đa `5m` / `300s`)** → Dùng **`kubectl logs <pod> --previous`**!
> - Gặp `pod has unbound immediate PersistentVolumeClaims` → Kiểm tra ngay `kubectl get pvc` và `kubectl get storageclass`.
