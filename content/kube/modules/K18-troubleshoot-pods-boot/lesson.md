# Khám bệnh K8s Thực chiến (Phần 1): Quy trình Triage & 4 Trạng thái Kẹt Khởi động

Trên lý thuyết, mọi tệp YAML bạn viết đều chạy mượt mà lên trạng thái `Running` xanh mướt. Nhưng trong công việc thực tế của một kỹ sư DevOps/Backend trực ca vận hành (On-call), 80% giá trị chuyên môn của bạn toả sáng vào khoảnh khắc bạn gõ `kubectl get pods` và nhìn thấy một hàng chữ đỏ rực: `Pending`, `ImagePullBackOff`, `CreateContainerConfigError` hay `CrashLoopBackOff`!

Khi sự cố xảy ra, người mới thường hoảng loạn xoá đại Pod đi tạo lại hoặc sửa mò mẫm tệp YAML theo cảm tính. Ngược lại, kỹ sư giàu kinh nghiệm luôn tuân thủ **Quy trình Chẩn đoán 3 Bước (3-Step K8s Triage)** chính xác như bác sĩ đọc phim X-quang.

---

## 1. Quy trình Khám bệnh 3 Bước Bất biến (Không bao giờ đoán mò!)

Mỗi khi một Pod không đạt trạng thái `READY 1/1` và `Running`, hãy gõ tuần tự đúng 3 lệnh sau theo chiều từ ngoài vào trong:

```text
Bước 1: Nhìn toàn cảnh trạng thái   ──►  kubectl get pods (-n <namespace>)
                                                │
       ┌────────────────────────────────────────┴────────────────────────────────────────┐
       ▼ (Nếu kẹt TRƯỚC khi code chạy:                                                   ▼ (Nếu code ĐÃ chạy rồi sập:
          Pending, ImagePullBackOff,                                                        CrashLoopBackOff, Error,
          CreateContainerConfigError)                                                       RESTARTS > 0)
Bước 2: Đọc bảng Sự kiện hạ tầng    ──►  kubectl describe pod <tên-pod>      Bước 3: Đọc nhật ký ứng dụng ──► kubectl logs <tên-pod>
        (Cuộn xuống mục Events ở cuối!)                                              (Thêm --previous nếu vừa khởi động lại!)
```

> **Quy tắc vàng tiết kiệm thời gian:** Nếu Pod đang ở trạng thái `Pending`, `ImagePullBackOff` hoặc `CreateContainerConfigError`, container ứng dụng của bạn **chưa từng được bật lên dù chỉ 1 mili-giây**! Vì thế gõ `kubectl logs` lúc đó sẽ chẳng có dòng nhật ký code nào cả — câu trả lời 100% nằm ở mục **`Events:`** cuối lệnh **`kubectl describe pod`**!

---

## 2. Giải phẫu chi tiết 4 ca bệnh kẹt khởi động kinh điển

Hãy đối chiếu từng trạng thái lỗi với nguyên nhân gốc rễ trong vòng đời khởi tạo Pod để bắt đúng mạch ngay từ giây đầu tiên:

| Trạng thái trên `get pods` | Đang tắc ở khâu nào? | Thủ phạm phổ biến nhất trong thực tế | Lệnh chẩn đoán quyết định |
| --- | --- | --- | --- |
| **1. `Pending`** | **Lập lịch & Gắn đĩa** (`kube-scheduler` / CSI) | • `PVC` chưa `Bound` được ổ đĩa (do sai tên `storageClassName` như `fast-ssd-typo`).<br>• Cụm cạn sạch CPU/RAM không Node nào đủ đáp ứng `resources.requests`. | `kubectl describe pod <name>` + `kubectl get pvc` |
| **2. `ImagePullBackOff`** *(hoặc `ErrImagePull`)* | **Kéo ảnh Container** (`containerd` trên Node) | • Gõ sai tên Image hoặc sai thẻ phiên bản (ví dụ `1.4.0-typo` không tồn tại trên kho GHCR/Docker Hub).<br>• Kho ảnh riêng tư (Private Registry) nhưng quên gắn `imagePullSecrets`. | `kubectl describe pod <name>` *(đọc dòng `Failed to pull image ... not found`)* |
| **3. `CreateContainerConfigError`** | **Lắp ráp cấu hình** (`kubelet` chuẩn bị Env/Mount) | • Pod tham chiếu tới một **`Secret`** hoặc **`ConfigMap`** chưa từng được tạo trong cùng Namespace (hoặc gõ lệch tên/khoá trong `secretKeyRef`). | `kubectl describe pod <name>` + `kubectl get secrets,cm` |
| **4. `CrashLoopBackOff`** | **Thực thi mã nguồn** (Bên trong tiến trình Node.js) | • Image đã kéo xong, cấu hình đã nạp đủ, container bật lên chạy `node dist/server.js` nhưng **văng ngoại lệ chưa bắt (Uncaught Exception) thoát mã lỗi `!= 0`** ngay lập tức!<br>• `kubelet` cố khởi động lại theo chu kỳ lùi luỹ thừa (`10s → 20s → 40s... → 5m`). | **`kubectl logs <name> --previous`** *(đọc Stack Trace của lần sập ngay trước đó!)* |

---

## 3. Bí quyết dùng cờ `--previous` (`-p`) khi bắt bệnh `CrashLoopBackOff`

Khi một ứng dụng Node.js bị lỗi lúc khởi động (chẳng hạn bản phát hành mới `2.0.0-crash` quên kiểm tra biến `undefined` dẫn tới `TypeError: Cannot read properties of undefined`), container bật lên trong `0.2 giây` rồi chết, sau đó `kubelet` có thể đang ở trạng thái tạm nghỉ chờ `40 giây` hoặc vừa mới tạo lại container mới chưa kịp in lỗi.

Nếu bạn chỉ gõ `kubectl logs <pod>`, đôi khi bạn thấy màn hình trống trơn của lần thử mới. Thêm cờ **`--previous`** (viết tắt `-p`):

```bash
kubectl logs order-worker-10001 --previous
```

Kubernetes sẽ lấy ra **bản ghi stdout/stderr đầy đủ của phiên bản container vừa mới chết ngay trước đó**, giúp bạn nhìn thấy tận mắt dòng Stack Trace của Node.js và biết ngay phiên bản nào đang bị hỏng để hạ cấp về bản ổn định!

---

## 4. Hướng dẫn làm các bài tập Thực hành Khám bệnh (`Troubleshoot`) ở Module này

Trong 4 ca trực chiến `K18.1` → `K18.4` ngay sau bài học:
1. Bạn sẽ được cung cấp một **Khung Terminal Chẩn đoán** kết nối trực tiếp vào cụm mô phỏng đang gặp sự cố thực tế.
2. Hãy tập thói quen chuyên nghiệp: **gõ lệnh khám bệnh trước** (`kubectl get pods`, `kubectl describe pod ...`, `kubectl get pvc`, `kubectl logs ... --previous`) để tự mắt tìm ra chứng cứ lỗi cụ thể thay vì đoán mò.
3. Sau khi xác định đúng thủ phạm, hãy sửa bản vá cấu hình YAML ở trình soạn thảo bên dưới và bấm chấm điểm — bộ mô phỏng sẽ tự động `apply` bản vá của bạn vào cụm và kiểm tra xem các Pod đã chuyển sang trạng thái **`Running` (`Ready`)** xanh mướt hay chưa!
