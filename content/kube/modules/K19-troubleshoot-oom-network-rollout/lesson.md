# Khám bệnh K8s Thực chiến (Phần 2): Xử lý OOMKilled (137), Mất mạng 502 & Cứu hộ Rollout

Ở bài `K18`, bạn đã làm chủ cách chẩn đoán những sự cố ngăn cản Pod khởi động ngay từ vạch xuất phát. Nhưng những ca trực đêm gay cấn nhất của đời kỹ sư lại xảy ra khi **tất cả các Pod tưởng chừng đã `Running` êm xuôi**, hoặc nổ ra ngay **giữa lúc đang triển khai phiên bản mới vào giờ cao điểm**!

Trong module tổng kết khoá học này, bạn sẽ trực tiếp xử lý 4 kịch bản sự cố vận hành cấp độ Production phổ biến nhất: tràn bộ nhớ **`OOMKilled` (`Exit Code 137`)**, đứt mạch **`502 Bad Gateway` (`Endpoints: <none>`)**, **cứu hộ khẩn cấp bằng `rollout undo`**, và **triệt tiêu lỗi rớt gói tin khi Rolling Update**.

---

## 1. Ca bệnh #5 — Pod đột tử lúc tải nặng: `OOMKilled` (`Exit Code 137`)

### Triệu chứng nhận biết:
Bình thường dịch vụ xuất hoá đơn `pdf-exporter` vẫn chạy `Running`. Nhưng cứ mỗi khi khách hàng yêu cầu kết xuất tệp báo cáo lớn, kết nối bị ngắt ngang, cột `RESTARTS` tăng vọt hoặc `STATUS` nhấp nháy chữ **`OOMKilled`**.

Khi chạy `kubectl describe pod pdf-exporter-...`, bạn sẽ bắt gặp dòng bằng chứng thép không thể nhầm lẫn:
```text
Last State:   Terminated (Reason: OOMKilled, Exit Code: 137)
Limits:       memory=32Mi
```

### Giải mã con số `137` theo toán học Linux:
Trong hệ điều hành Unix/Linux, khi một tiến trình bị kết liễu bởi tín hiệu số **`N`**, mã thoát (Exit Code) được tính bằng **`128 + N`**. Tín hiệu cưỡng bức tối hậu `SIGKILL` mang mã số **`9`** → **`128 + 9 = 137`**!
Khi tiến trình Node.js cấp phát V8 Heap + Buffer vượt quá trần `resources.limits.memory` (ví dụ bị đặt quá chật hẹp chỉ `32Mi`), cơ chế **cgroups OOM Killer** của nhân Linux lập tức bắn `SIGKILL (9)` không một lời báo trước.

### Hướng xử lý dứt điểm:
1. **Trước mắt (Hạ tầng):** Nâng `resources.limits.memory` (và `requests.memory` tương ứng) trong `Deployment` lên ngưỡng thực tế an toàn cho Node.js (ví dụ `256Mi` hoặc `512Mi`).
2. **Về lâu dài (Mã nguồn Node.js):** Thay vì đọc toàn bộ tệp 200MB vào biến RAM bằng `fs.readFileSync`, hãy chuyển sang xử lý theo luồng từng mảnh nhỏ bằng **Node.js Streams (`pipeline`)**!

---

## 2. Ca bệnh #6 — Pod vẫn `Running` xanh mướt nhưng khách ăn lỗi `502 Bad Gateway`!

### Triệu chứng nhận biết:
Đây là chiếc bẫy đánh lừa thị giác kinh điển nhất: bạn gõ `kubectl get pods`, thấy cả 2 bản sao `checkout-api` đều hiện `1/1 Running`, nhật ký ứng dụng vẫn in `Server listening on port 3000` không một dòng lỗi! Thế nhưng mọi yêu cầu đi từ Ingress vào `Service/checkout-svc` đều trả về **`502 Bad Gateway`** hoặc `Connection Refused`!

### Cặp lệnh bắt mạch trong 5 giây:
Đừng nhìn Pod nữa — hãy kiểm tra ngay cầu nối **`Endpoints`** và nhãn thực tế của Pod:
```bash
kubectl get endpoints checkout-svc
kubectl get pods --show-labels
kubectl describe svc checkout-svc
```
Nếu `kubectl get endpoints checkout-svc` hiện **`<none>`** (rỗng không có địa chỉ IP nào), chắc chắn bạn đã dính 1 trong 2 lỗi ghép nối sau trên `Service`:
1. **Lệch nhãn `selector`:** Pod mang nhãn `app: checkout-api`, nhưng `Service` lại đi tìm `selector: { app: checkout-backend }`!
2. **Lệch cổng `targetPort`:** Code Express bên trong Pod lắng nghe ở cổng `3000`, nhưng `Service` lại chuyển tiếp gói tin sang `targetPort: 8080`!

Chỉ cần chỉnh lại `selector` và `targetPort` của `Service` khớp khít với Pod, danh sách `Endpoints` sẽ lập tức điền đủ 2 địa chỉ IP `Ready` và trang thanh toán sống lại tức thì mà không cần khởi động lại Pod nào!

---

## 3. Ca bệnh #7 — Nguyên tắc Cứu hoả Số 1 trên Production: "Cầm máu trước, mổ xẻ lỗi sau!"

Giả sử lúc 20:00 tối cao điểm, bản phát hành mới `v3.0.0` vừa đẩy lên namespace `production` khiến toàn bộ giao diện `frontend` rơi vào `CrashLoopBackOff`.

Sai lầm của kỹ sư thiếu kinh nghiệm là ngồi mở VS Code mò tìm dòng code sai, sửa code, đợi CI build lại Docker Image mất 12 phút trong khi hàng ngàn khách hàng đang giận dữ rời bỏ giỏ hàng!
Nguyên tắc vàng của SRE (Site Reliability Engineering) là **Giảm tối đa Thời gian Phục hồi (MTTR — Mean Time To Recovery)**: dùng ngay lịch sử Revision có sẵn của `Deployment` để quay ngược về bản ổn định trước đó chỉ trong **3 giây**:

```bash
# Kiểm tra nhanh lịch sử phát hành của Deployment trên namespace production
kubectl rollout history deployment/frontend -n production

# Cầm máu khẩn cấp: Quay lùi ngay về bản ổn định liền trước!
kubectl rollout undo deployment/frontend -n production
```

Sau khi hệ thống đã xanh trở lại và khách hàng mua sắm bình thường, lúc đó đội ngũ mới ung dung kéo nhật ký lỗi về môi trường Staging để sửa code căn cơ!

---

## 4. Ca bệnh #8 — Gia cố toàn diện chống rớt mạng lúc Rolling Update

Cuối cùng, để một dịch vụ API đạt chuẩn **Zero-Downtime thực thụ 100%** mỗi ngày phát hành 20 lần mà không rớt một kết nối nào của khách hàng, bạn cần kết hợp đồng bộ **3 chốt chặn** từ suốt khoá học vào cùng một bản `Deployment`:

| Chốt chặn trong `Deployment` | Lỗ hổng nếu bỏ sót | Cấu hình chuẩn Production |
| --- | --- | --- |
| **1. Chiến lược `RollingUpdate`** | Mặc định K8s cho phép `maxUnavailable: 25%` — giết bớt Pod cũ ngay cả khi Pod mới chưa chạy xong, làm hụt năng lực chịu tải. | `maxUnavailable: 0` và `maxSurge: 1` (bật thêm 1 Pod mới khoẻ hẳn rồi mới tắt 1 Pod cũ). |
| **2. Cảm biến `readinessProbe`** | Pod mới vừa tạo container đã bị bơm khách vào dù Node.js chưa mở xong cổng 3000 và DB Pool. | `httpGet` kiểm tra `/readyz` trên cổng `3000` (`periodSeconds: 5`). |
| **3. Móc tắt êm `lifecycle.preStop`** | Khi Pod cũ bị thu hồi, tiến trình đóng cổng nhanh hơn tốc độ xoá IP trên Ingress/kube-proxy (đua tốc độ mạng 1–3s). | `preStop.exec.command: ["sh", "-c", "sleep 5"]` kèm `terminationGracePeriodSeconds: 30`. |

Chúc mừng bạn đã đi tới thử thách cuối cùng của hành trình **Docker & Kubernetes Thực chiến** — hãy hoàn thành 4 ca xử lý sự cố cuối cùng để khẳng định bản lĩnh làm chủ cụm sản xuất!
