## 1. Sự cố hàng đợi dùng chung: chiến dịch tiếp thị chặn OTP

```step
category: SETUP
short: Nghẽn hàng đợi
scene: s1-shared-queue
callout:
  kind: watch-out
  title: Hàng đợi FIFO dùng chung là điểm nghẽn nghiệp vụ
  vi: "Khi chiến dịch tiếp thị đẩy 10 triệu tin vào chung hàng đợi với mã OTP, người dùng phải chờ hàng chục phút mới nhận được mã xác thực."
whatChanged:
  - "+ Mô hình hóa luồng OTP (15%) và Chiến dịch tiếp thị (85%)"
  - "~ Hàng đợi FIFO dùng chung bị chiến dịch tiếp thị lấp đầy"
telemetry:
  - label: "Chiến dịch"
    value: "10 triệu tin"
    tone: bad
  - label: "Trễ OTP"
    value: "Hàng chục phút"
    tone: bad
```

Hệ thống thông báo đa kênh phục vụ cả Push, SMS và Email cho hai nhóm lưu lượng rất khác nhau: thông báo giao dịch khẩn cấp (mã OTP, thanh toán) và chiến dịch tiếp thị hàng loạt (khuyến mãi 10 triệu người dùng).

Nếu đẩy cả hai vào chung một hàng đợi FIFO, mỗi đợt chạy chiến dịch sẽ tạo ra hàng triệu thông điệp nằm chắn phía trước, khiến mã OTP hết hạn trước khi tới tay khách hàng.

## 2. Tách hàng đợi và nhóm Worker theo độ ưu tiên

```step
category: TECHNIQUE
short: Priority Queue
scene: s2-priority-lanes
callout:
  kind: key-idea
  title: Cô lập hoàn toàn theo làn ưu tiên
  vi: "Tách riêng Priority Queue (High / Low) và tách riêng nhóm Worker tiêu thụ để lưu lượng tiếp thị không bao giờ ảnh hưởng đến OTP."
whatChanged:
  - "+ Tách Priority Queue thành làn High (OTP) và Low (Tiếp thị)"
  - "+ Tách riêng hai nhóm Delivery Workers độc lập"
telemetry:
  - label: "Làn High (OTP)"
    value: "Cô lập 100%"
    tone: ok
  - label: "Làn Low (Marketing)"
    value: "Tự điều tiết"
```

Giải pháp chuẩn là áp dụng mẫu Bulkhead ngay từ tầng hàng đợi:
- **Làn High (OTP / Giao dịch):** hàng đợi riêng và cụm worker riêng, ưu tiên thông lượng tức thời.
- **Làn Low (Tiếp thị):** hàng đợi riêng với cụm worker có bộ điều tiết tốc độ đầu ra (rate shaping) để gửi đều đặn mà không làm quá tải nhà cung cấp SMS/Push.

## 3. Chiến dịch 4.800 req/s kèm nhà cung cấp phản hồi chậm

```step
category: PROBLEM
short: Đối tác chậm
scene: s3-blast-live
live: blast
activity: S7-03.A1
gate: optional
callout:
  kind: watch-out
  title: Retry tức thì khuếch đại sự cố đối tác
  vi: "Ở t = 15 s, nhà cung cấp chậm 320 ms; cấu hình Retry 3 lần không Jitter làm lưu lượng đập vào đối tác tăng vọt và nghẽn toàn bộ Worker."
whatChanged:
  - "~ Đỉnh chiến dịch 4.800 req/s tại t = 12 s"
  - "~ Nhà cung cấp chậm 320 ms trong 14 giây từ t = 15 s"
telemetry:
  - label: "Đỉnh tải"
    value: "4.800 req/s"
    tone: warn
  - label: "Độ trễ đối tác"
    value: "320 ms (t = 15 s)"
    tone: bad
```

Trong mô phỏng trực tiếp, chiến dịch đẩy tải lên 4.800 req/s ở giây 12, rồi nhà cung cấp ngoài bị chậm 320 ms ở giây 15. Vì đường nối `workers-providers` đang đặt Retry 3 lần tức thì (không Backoff, không Jitter, không Circuit Breaker), hàng đợi Worker nhanh chóng tràn ngập.

Hãy mở rộng `notify_api`, `queue`, `workers` và cấu hình **Exponential Backoff + Full Jitter + Circuit Breaker** để hệ thống tự phục hồi sau giây 35.

## 4. Chống gửi trùng bằng khóa khử trùng

```step
category: TECHNIQUE
short: Chống gửi trùng
scene: s4-dedup-recap
callout:
  kind: good-to-know
  title: Giao ít nhất một lần nhưng hiệu ứng đúng một lần
  vi: "Gắn dedup_key cho mỗi cặp (sự kiện, người nhận) để kiểm tra nguyên tử trước khi gọi nhà cung cấp, chặn triệt để gửi trùng khi retry."
whatChanged:
  - "+ Bổ sung kiểm tra dedup_key tại Delivery Workers"
telemetry:
  - label: "Khử trùng"
    value: "dedup_key + TTL"
    tone: ok
```

Vì hàng đợi phân tán đảm bảo giao thông điệp theo cơ chế ít nhất một lần (at-least-once), một thông điệp có thể được giao lại nếu worker khởi động lại trước khi gửi ACK.

Để người dùng không nhận 2–3 tin giống hệt nhau, Worker cần kiểm tra nguyên tử một khóa `dedup_key` (lưu trong Redis hoặc DB với TTL) trước khi gọi API nhà cung cấp.

## 5. Điều tiết tốc độ đầu ra theo hạn mức đối tác

```step
category: MECHANISM
short: Rate Shaping
scene: s2-priority-lanes
callout:
  kind: technique
  title: Không vượt quá quota của nhà cung cấp
  vi: "Đặt bộ điều tiết tốc độ ở đầu ra của Delivery Workers để giữ nhịp gửi nằm trong hạn mức cho phép của APNs, FCM và cổng SMS."
whatChanged:
  - "+ Bổ sung Outbound Rate Shaping ở Delivery Workers"
telemetry:
  - label: "Hạn mức đối tác"
    value: "Giới hạn theo kênh"
    tone: ok
```

Mỗi nhà cung cấp bên thứ ba đều có giới hạn số thông báo mỗi giây. Nếu Worker đẩy đồng loạt hết công suất khi hàng đợi tiếp thị xả tải, đối tác sẽ trả lỗi 429 hoặc tạm khóa tài khoản gửi tin. Bộ điều tiết tốc độ đầu ra giúp làm phẳng lưu lượng trước khi ra ngoài.

## 6. Tổng kết và phân tích sự cố

```step
category: RECAP
short: Tóm tắt
scene: s4-dedup-recap
activity: S7-03.A2
gate: optional
callout:
  kind: key-idea
  title: Bộ ba phòng vệ cho hệ thống thông báo
  vi: "Tách hàng đợi theo độ ưu tiên, Retry có Jitter kèm Circuit Breaker và khử trùng bằng dedup_key."
whatChanged:
  - "+ Tổng kết kiến trúc hệ thống Thông báo đa kênh"
telemetry:
  - label: "Phục hồi"
    value: "Jitter + Breaker"
    tone: ok
```

Kết hợp tách hàng đợi ưu tiên, Retry có Jitter, Circuit Breaker, điều tiết tốc độ đầu ra và khử trùng giúp hệ thống thông báo vận hành ổn định ở quy mô hàng chục triệu tin. Hãy hoàn thành bài phân tích sự cố `S7-03.A2`.
