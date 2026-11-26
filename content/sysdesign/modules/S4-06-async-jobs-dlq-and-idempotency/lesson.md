## 1. Tách việc nặng khỏi đường nóng: Sync vs Async

```step
category: SETUP
short: Sync vs Async
scene: s1-sync-vs-async
callout:
  kind: key-idea
  title: Chỉ giữ bước cốt lõi trên đường phản hồi API
  vi: "Thay vì bắt người dùng chờ 2 giây để gửi email và xuất hóa đơn PDF, API chỉ cần lưu đơn, đẩy job vào Queue rồi trả lời ngay."
whatChanged:
  - "+ Thiết lập chuỗi Order API → Job Queue → Worker Pool → Order DB"
  - "~ Các tác vụ chậm được hoãn sang xử lý nền bởi Worker"
telemetry:
  - label: "Tải đầu vào"
    value: "900 đơn/s"
  - label: "Năng lực Worker"
    value: "1.200 job/s"
    tone: ok
```

Khi người dùng bấm đặt hàng, quy trình đồng bộ truyền thống thường gộp cả kiểm tra tồn kho, thanh toán, lưu cơ sở dữ liệu, gửi email xác nhận, tạo hóa đơn PDF và báo cho kho vận. Tổng thời gian dễ kéo dài gần 2 giây và giữ chặt kết nối mạng.

Bằng cách đưa **Message Queue** vào giữa, `Order API` chỉ thực hiện bước xác thực cần thiết, ghi nhận yêu cầu vào hàng đợi trong vài mili-giây rồi trả phản hồi thành công ngay cho người dùng. Cụm `Worker Pool` phía sau sẽ kéo từng việc về xử lý theo tốc độ riêng.

## 2. Chiến lược Retry an toàn: Exponential Backoff và Jitter

```step
category: TECHNIQUE
short: Retry & Backoff
scene: s2-retry-backoff
callout:
  kind: technique
  title: Giãn nhịp thử lại và phân biệt loại lỗi
  vi: "Chỉ thử lại các lỗi tạm thời (mạng nghẽn, timeout). Lỗi dữ liệu sai định dạng không bao giờ tự khỏi dù thử lại 100 lần."
whatChanged:
  - "+ Áp dụng Exponential Backoff + Jitter và trần số lần thử tối đa"
  - "~ Không thử lại với lỗi nghiệp vụ vĩnh viễn (4xx / JSON lỗi)"
telemetry:
  - label: "Khoảng chờ"
    value: "2s → 4s → 8s"
    tone: ok
  - label: "Số lần tối đa"
    value: "3–5 lần"
```

Trong môi trường phân tán, lỗi kết nối tạm thời xảy ra thường xuyên. Tuy nhiên, nếu Worker thử lại ngay lập tức không nghỉ, hàng loạt Worker sẽ cùng lúc dội thêm lưu lượng vào đúng dịch vụ đang quá tải.

Giải pháp chuẩn gồm ba phần:
- **Exponential Backoff:** Tăng thời gian chờ theo cấp số nhân sau mỗi lần lỗi (ví dụ 2 giây, 4 giây, 8 giây).
- **Jitter:** Cộng thêm độ lệch ngẫu nhiên vào thời gian chờ để các Worker không đồng loạt tỉnh dậy cùng một giây.
- **Thử lại có điều kiện:** Phân biệt lỗi tạm thời (mạng chập chờn) với lỗi vĩnh viễn (sai định dạng dữ liệu) để không tốn công thử lại vô ích.

## 3. Mô phỏng thông điệp độc (Poison Message) khi tắt DLQ

```step
category: PROBLEM
short: Poison Message
scene: s3-poison-live
live: dlq-poison
activity: S4-06.A1
gate: optional
callout:
  kind: watch-out
  title: Thiếu DLQ khiến job lỗi quay vòng làm tắc hàng đợi chính
  vi: "Khi Worker không thể xử lý một job và trả nó về Queue mà không có điểm dừng, hàng đợi sẽ tích tụ cho tới khi tràn."
whatChanged:
  - "~ Giây 15: bản cập nhật lỗi khiến Worker dính tỷ lệ lỗi 40%"
  - "~ Khi dlq = false, job lỗi liên tục quay vòng lại Job Queue"
telemetry:
  - label: "Tình trạng DLQ"
    value: "Đang tắt (false)"
    tone: bad
  - label: "Giới hạn Queue"
    value: "6.000 job"
```

Một **Poison Message** (thông điệp độc) là bản tin luôn gây lỗi mỗi khi Worker kéo ra xử lý — ví dụ dữ liệu thiếu trường bắt buộc hoặc làm Worker văng ngoại lệ.

Trong mô phỏng trực tiếp này, `Job Queue` đang tắt DLQ (`dlq = false`). Từ giây 15, một bản phát hành lỗi làm Worker gặp tỷ lệ lỗi 40%. Quan sát xem hàng đợi tích tụ ra sao khi các thông điệp lỗi cứ quay vòng trở lại, và thử bật công tắc `dlq` trong bảng điều khiển để kiểm chứng sự khác biệt.

## 4. Dead Letter Queue (DLQ): cách ly lỗi để giữ luồng chính thông suốt

```step
category: TECHNIQUE
short: Bật DLQ
scene: s4-dlq-fix
callout:
  kind: good-to-know
  title: Cách ly lỗi để điều tra và phát lại sau
  vi: "Đặt ngưỡng max_retries rõ ràng: vượt ngưỡng thì đẩy sang DLQ, giải phóng Worker cho các đơn hàng hợp lệ."
whatChanged:
  - "+ Bật Dead Letter Queue để nhận các job lỗi quá số lần thử"
  - "~ Hàng đợi chính duy trì mức tồn đọng thấp và ổn định"
telemetry:
  - label: "Tình trạng DLQ"
    value: "Đã bật (true)"
    tone: ok
  - label: "Luồng chính"
    value: "Thông suốt"
    tone: ok
```

**Dead Letter Queue (DLQ)** là một hàng đợi tách biệt chuyên dùng để chứa những thông điệp đã thất bại vượt quá số lần thử lại cho phép (ví dụ quá 3 hoặc 5 lần).

Nhờ có DLQ, các thông điệp độc không còn quay vòng chiếm dụng CPU của Worker hay làm đầy bộ nhớ của hàng đợi chính. Đội ngũ vận hành có thể đặt cảnh báo khi DLQ có tin mới, đọc nội dung lỗi để sửa mã nguồn rồi đẩy ngược lại hàng đợi chính để xử lý bù.

## 5. Idempotency Key: an toàn khi job được giao lặp lại

```step
category: MECHANISM
short: Idempotency
scene: s5-idempotency
activity: S4-06.A2
gate: required
callout:
  kind: key-idea
  title: At-least-once + Idempotency = Đúng một lần về mặt nghiệp vụ
  vi: "Worker có thể sập ngay sau khi ghi DB nhưng trước khi gửi Ack, khiến Queue giao lại job đó. Idempotency Key chặn việc xử lý trùng."
whatChanged:
  - "+ Gắn idempotency_key duy nhất cho mỗi job từ phía API"
  - "+ Đặt ràng buộc UNIQUE trên idempotency_key trong Order DB"
telemetry:
  - label: "Cơ chế giao tin"
    value: "At-least-once"
    tone: warn
  - label: "Bảo vệ trùng"
    value: "UNIQUE key"
    tone: ok
```

Hầu hết các hệ thống hàng đợi (SQS, RabbitMQ, Redis Streams) đảm bảo giao tin **at-least-once**: nếu Worker xử lý xong đơn hàng và ghi xuống `Order DB`, nhưng tắt đột ngột trước khi kịp gửi tín hiệu xác nhận (`Ack`) về Queue, hàng đợi sẽ hiểu là job chưa xong và giao lại cho Worker khác.

Nếu Worker không có tính **lũy đẳng (Idempotency)**, khách hàng sẽ bị tạo hai đơn hàng hoặc trừ tiền hai lần. Cách khắc phục chuẩn là gắn một `idempotency_key` duy nhất cho mỗi yêu cầu ngay từ đầu, và kiểm tra hoặc chèn khóa này bằng ràng buộc `UNIQUE` trong cùng giao dịch Database khi lưu kết quả.

## 6. Tổng kết: thiết kế hàng đợi bất đồng bộ tin cậy

```step
category: RECAP
short: Tóm tắt
scene: s6-recap
callout:
  kind: key-idea
  title: Bộ tứ bảo vệ đường xử lý nền
  vi: "Đẩy việc chậm sang Queue, giãn nhịp Retry bằng Backoff + Jitter, cách ly lỗi qua DLQ và khóa trùng bằng Idempotency Key."
whatChanged:
  - "+ Hoàn thiện kiến trúc bất đồng bộ chống tắc nghẽn và chống trùng lặp"
telemetry:
  - label: "Độ trễ API"
    value: "Thấp & Ổn định"
    tone: ok
  - label: "Độ tin cậy"
    value: "DLQ + Idempotent"
    tone: ok
```

Xử lý bất đồng bộ giúp API phản hồi nhanh và hấp thụ tốt các đợt tăng tải ngắn hạn. Tuy nhiên, độ tin cậy thực sự của hệ thống nền nằm ở việc kiểm soát vòng đời lỗi: giới hạn hàng đợi (`maxDepth`), giãn nhịp retry, tách thông điệp độc sang DLQ và bảo đảm mọi thao tác ghi của Worker đều lũy đẳng thông qua Idempotency Key.
