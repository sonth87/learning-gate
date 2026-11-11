# Sức khoẻ Pod & Vòng đời dừng êm ái: Startup, Readiness, Liveness Probes & Graceful Shutdown

Một trong những ngộ nhận phổ biến nhất của lập trình viên mới lên Kubernetes là: *"Hễ `kubectl get pods` báo `STATUS = Running`, nghĩa là ứng dụng Node.js của tôi đã sẵn sàng phục vụ khách hàng!"*

**Sai hoàn toàn!** Đối với nhân Linux và `kubelet`, trạng thái `Running` chỉ đơn thuần có nghĩa là tiến trình `node dist/server.js` vừa được nạp vào bộ nhớ (PID đã tồn tại). Trong thực tế:
- Ứng dụng có thể mất thêm 8 giây đầu để kết nối PostgreSQL, nạp bộ nhớ đệm Redis hoặc khởi tạo Prisma Client — nếu khách hàng bị đẩy vào ngay giây thứ 1, họ sẽ ăn trọn lỗi `502 Bad Gateway`!
- Tệ hơn, sau 3 ngày chạy liên tục, tiến trình Node.js có thể bị treo vòng lặp sự kiện (Event Loop bị nghẽn cứng hoặc Deadlock kết nối) khiến mọi HTTP request quay vòng vô tận dù tiến trình chưa hề thoát (`Running` giả tạo)!

Để Kubernetes thực sự hiểu được "nhịp tim" bên trong ứng dụng của bạn, chúng ta cần trang bị **3 cảm biến thăm dò sức khoẻ (Probes)** cùng quy trình **Dừng êm ái (Graceful Shutdown)**.

---

## 1. Phân biệt rõ nhiệm vụ của 3 loại Probe: `startupProbe` vs `readinessProbe` vs `livenessProbe`

Hãy hình dung 3 chiếc Probe giống như 3 trạm kiểm tra y tế với hậu quả xử lý **hoàn toàn khác nhau** khi thất bại:

| Loại Probe | Câu hỏi kiểm tra cốt lõi | Hậu quả khi kiểm tra THẤT BẠI | Khi nào dùng? |
| --- | --- | --- | --- |
| **`startupProbe`** *(Khởi động)* | *"Ứng dụng đã khởi tạo xong lần đầu tiên chưa?"* | Tạm khoá `liveness` & `readiness` chờ đợi. Chỉ khi quá tổng quỹ thời gian (`periodSeconds * failureThreshold`) mới giết và khởi động lại container. | Ứng dụng khởi động chậm (nạp mô hình AI, warm cache lớn, dịch vụ legacy mất 30–60 giây để mở cổng). |
| **`readinessProbe`** *(Sẵn sàng nhận khách)* | *"Hiện tại Pod này có đủ khả năng xử lý request mới không?"* | **KHÔNG giết Pod!** Chỉ nhẹ nhàng **rút IP của Pod ra khỏi danh sách `Endpoints` của `Service`** để ngưng đẩy khách mới vào, đợi lúc khoẻ lại nối vào tiếp! | **Bắt buộc cho MỌI dịch vụ HTTP/API** để Rolling Update không rớt mạng! |
| **`livenessProbe`** *(Còn sống hay chết lâm sàng)* | *"Tiến trình có bị treo cứng (deadlock) không thể tự hồi phục không?"* | **Trừng phạt nặng nhất: `kubelet` GIẾT thẳng container và khởi động lại từ đầu** (`RESTARTS` tăng lên +1). | Phát hiện ứng dụng treo đơ vòng lặp không phản hồi dù tiến trình vẫn tồn tại. |

---

## 2. Cạm bẫy chết người số 1 trên Production: Gắn kiểm tra Database vào `livenessProbe`!

Hãy tưởng tượng kịch bản thảm hoạ từng đánh sập hàng loạt hệ thống lớn:
1. Bạn viết một endpoint duy nhất `/health` trong Express thực hiện câu lệnh `SELECT 1` xuống PostgreSQL, rồi gắn chung `/health` cho **cả `readinessProbe` lẫn `livenessProbe`** với `timeoutSeconds: 1`.
2. Vào giờ cao điểm, PostgreSQL hơi quá tải nên phản hồi `SELECT 1` mất `1.3 giây` (vượt quá `1s`).
3. `livenessProbe` báo thất bại 3 lần liên tiếp → Kubernetes tưởng cả 20 Pod API đều bị hỏng nên **đồng loạt giết và khởi động lại cả 20 Pod cùng một lúc**!
4. Khi 20 Pod Node.js bật dậy đồng thời, chúng lập tức mở 200 kết nối TCP mới đập thẳng vào PostgreSQL đang thoi thóp (hiệu ứng **Thundering Herd**), đánh sập hoàn toàn cơ sở dữ liệu và đẩy toàn bộ cụm vào vòng xoáy **`CrashLoopBackOff` dây chuyền**!

### Nguyên tắc vàng tách bạch `/healthz` và `/readyz` trong Node.js:
- **Endpoint `/healthz` (dành cho `livenessProbe` và `startupProbe`):** Chỉ kiểm tra nội tại tiến trình Node.js còn phản hồi Event Loop hay không (`res.status(200).json({ ok: true })`), **TUYỆT ĐỐI KHÔNG gọi sang Database, Redis hay API bên thứ ba**, và đặt `timeoutSeconds` rộng rãi (`3–5s`)!
- **Endpoint `/readyz` (dành cho `readinessProbe`):** Có thể kiểm tra trạng thái kết nối sẵn sàng tới Pool Database/Redis. Khi DB chập chờn 5 giây, `readinessProbe` chỉ tạm thời rút Pod khỏi `Service` (trả mã 503 an toàn tại cổng vào), tuyệt đối không giết Pod gây bão khởi động lại!

```yaml
containers:
  - name: api
    image: ghcr.io/acme/shop-api:1.5.0
    ports:
      - containerPort: 3000
    startupProbe:
      httpGet:
        path: /healthz
        port: 3000
      periodSeconds: 5
      failureThreshold: 12    # Cho phép tối đa 5 * 12 = 60 giây khởi động lần đầu
    readinessProbe:
      httpGet:
        path: /readyz
        port: 3000
      periodSeconds: 5
      failureThreshold: 3
    livenessProbe:
      httpGet:
        path: /healthz        # Nhẹ, không chạm vào DB ngoài!
        port: 3000
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
```

---

## 3. Bí quyết Zero-Downtime thực sự khi tắt Pod: Đua tốc độ lúc `Terminating` & `preStop` Hook

Ngay cả khi đã có `readinessProbe`, nhiều đội ngũ vẫn thấy khách hàng thỉnh thoảng bị lỗi `502 Bad Gateway` trong vài giây đầu của mỗi đợt Rolling Update! Nguyên nhân nằm ở **hai luồng chạy song song bất đồng bộ** khi Kubernetes xoá một Pod cũ:

1. **Luồng A (Mạng cụm):** API Server báo cho `EndpointSlice` và `Ingress Controller` (Nginx/Envoy) xoá địa chỉ IP của Pod cũ khỏi bảng chia tải. Quá trình đồng bộ mạng này qua các máy chủ mất khoảng **1 đến 3 giây**.
2. **Luồng B (`kubelet` trên Node):** Cùng tích tắc đó, `kubelet` gửi tín hiệu **`SIGTERM`** thẳng vào tiến trình Node.js! Nếu code Express của bạn vừa thấy `SIGTERM` đã gọi `process.exit(0)` tắt sập cổng `3000` ngay lập tức trong `0.01 giây`, thì những gói tin khách hàng đang trên đường bay tới từ Luồng A (trong 2 giây trễ mạng kia) sẽ đâm sầm vào cánh cửa đóng kín → **`502 Bad Gateway`**!

### Công thức giải quyết triệt để 3 bước:
1. **Thêm móc `lifecycle.preStop` ngủ đệm 5 giây (`sleep 5`):** `kubelet` sẽ chạy `preStop` **TRƯỚC KHI** gửi `SIGTERM` vào ứng dụng, trong khi Luồng A vẫn tiến hành rút IP của Pod khỏi `Service`/`Ingress` ngay lập tức! Sau 5 giây, không còn bất kỳ request mới nào bay tới Pod này nữa.
2. **Bắt tín hiệu `SIGTERM` trong code Node.js:** Gọi `server.close()` để ngừng nhận kết nối mới, đợi các giao dịch thanh toán đang chạy dở hoàn tất êm đẹp rồi mới đóng kết nối DB và thoát mã `0`.
3. **Đặt `terminationGracePeriodSeconds: 30`:** Quỹ thời gian ân hạn tối đa (tính tổng cả thời gian chạy `preStop` + thời gian đóng `SIGTERM`) trước khi `kubelet` buộc phải rút súng bắn tín hiệu cưỡng bức `SIGKILL`.
