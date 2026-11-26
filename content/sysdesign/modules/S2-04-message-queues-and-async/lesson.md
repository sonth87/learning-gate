## 1. Tác hại của việc nhồi tác vụ nặng vào luồng phản hồi đồng bộ

```step
category: SETUP
short: Nghẽn đồng bộ
scene: s1-sync-block
callout:
  kind: key-idea
  title: Tách việc cần trả lời ngay khỏi việc có thể hoàn tất sau
  vi: "Người dùng chỉ cần biết đơn hàng đã hợp lệ hay tệp đã tải lên xong; họ không cần giữ mở kết nối HTTP suốt 30 giây chờ xuất hoá đơn PDF hay nén video."
whatChanged:
  - "+ API thực hiện nối tiếp lưu đơn, tạo nhãn vận chuyển, xuất PDF và gửi email"
  - "~ Mỗi request giam kết nối nhiều giây làm cạn kiệt thread pool khi tải tăng"
telemetry:
  - label: "Thời gian chờ gộp"
    value: "5–30 giây"
    tone: bad
  - label: "Phụ thuộc chéo"
    value: "Email lỗi → Đơn lỗi"
    tone: bad
```

Khi đặt toàn bộ chuỗi công việc trong một request HTTP đồng bộ, hệ thống vấp phải ba rào cản lớn:

1. **Độ trễ phản hồi kém:** Cộng dồn các bước sinh ảnh thu nhỏ, mã hoá video hay gọi cổng gửi thư bên ngoài kéo dài hàng chục giây, vượt quá ngưỡng chờ của trình duyệt.
2. **Cạn kiệt tài nguyên đồng thời:** Theo định luật Little ($L = \lambda \cdot W$), thời gian giữ kết nối $W$ tăng gấp `50 lần` đồng nghĩa máy chủ cần số luồng/bộ nhớ gấp `50 lần` cho cùng một lưu lượng $\lambda$.
3. **Lan truyền lỗi (Tight Coupling):** Chỉ cần máy chủ gửi email bảo trì vài phút, toàn bộ thao tác đặt hàng chính của khách cũng thất bại theo.

## 2. Đặt Message Queue ở giữa: trả lời sớm và xử lý nền

```step
category: TECHNIQUE
short: Tách qua Queue
scene: s2-decoupled
callout:
  kind: good-to-know
  vi: "Thông điệp đưa vào Queue nên nhỏ gọn (chỉ truyền order_id, video_id) thay vì nhét cả khối dữ liệu hàng chục kilobyte để giữ băng thông Broker nhẹ và tránh dữ liệu cũ."
whatChanged:
  - "+ Chèn Message Queue nhận job bất đồng bộ từ API và cụm Worker kéo việc ở nền"
  - "~ API trả mã 202 Accepted trong ~50 ms; Worker tiêu thụ ổn định 600 job/s"
telemetry:
  - label: "p99 phản hồi API"
    value: "≈ 50 ms"
    tone: ok
  - label: "Tốc độ Worker"
    value: "600 job/s"
    tone: ok
  - label: "Liên kết dịch vụ"
    value: "Tách rời thời gian"
    tone: ok
```

**Message Queue (hàng đợi thông điệp)** đứng làm vùng đệm bền vững giữa hai phía:
- **Producer (API Server):** Thực hiện phần kiểm tra bắt buộc trên đường nóng, đẩy một bản tin mô tả công việc vào Queue (~`2 ms`) rồi trả lời ngay cho client (`202 Accepted` kèm đường dẫn tra cứu tiến độ).
- **Consumer (Worker Pool):** Các tiến trình chạy nền chủ động **kéo (`pull`)** từng thông điệp ra khỏi Queue theo đúng nhịp công suất của mình (`3 máy × 200 = 600 job/s`), xử lý nặng rồi cập nhật kết quả vào Database.

Nhờ vậy, API Server và Worker Pool mở rộng quy mô hoàn toàn độc lập; nếu Worker tạm dừng để nâng cấp, các thông điệp vẫn nằm chờ an toàn trong Queue.

## 3. Quan sát trực tiếp Spike gấp 10 lần: biến đỉnh tải thành Backlog

```step
category: PROBLEM
short: Hấp thụ Spike
scene: s3-live-spike
live: spike
activity: S2-04.A1
gate: optional
callout:
  kind: key-idea
  title: Làm phẳng đỉnh tải (Load Leveling)
  vi: "Thay vì phải định cỡ Database và Worker theo đỉnh 3.000 req/s tốn kém gấp 5 lần, Queue hứng phần chênh lệch thành backlog rồi xả đều ở mức 600 job/s."
whatChanged:
  - "~ Từ giây 15 đến giây 40, lưu lượng vọt từ 300 lên 3.000 req/s (gấp 10 lần)"
  - "~ p99 của API chỉ nhích từ 50 lên ~61 ms với 0% lỗi; backlog dồn trong Queue"
telemetry:
  - label: "Đỉnh lưu lượng"
    value: "3.000 req/s (×10)"
    tone: warn
  - label: "p99 của API"
    value: "≈ 61 ms"
    tone: ok
  - label: "Lỗi người dùng"
    value: "0%"
    tone: ok
```

Hãy bấm chạy kịch bản `S2-04/spike` để quan sát cách hàng đợi bảo vệ toàn hệ thống trong đợt mở bán cao điểm:

- Ở mức nền `300 req/s` (`t < 15 s`), 3 Worker chạy thong thả ở `ρ = 0,50`, hàng đợi gần như trống không.
- Khi đỉnh `3.000 req/s` ập tới (`t = 15–40 s`), API Server vẫn phản hồi trong `~61 ms` (`ρ = 0,67`). Chênh lệch `3.000 − 600 = 2.400 job/s` được tích luỹ vào `Message Queue` lên khoảng `58.000 job` mà Database phía sau chỉ nhận lưu lượng êm ả không đổi.
- Thử tăng núm `worker.replicas` từ `3` lên `8` (`1.600 job/s`) để quan sát tốc độ rút cạn backlog nhanh gấp nhiều lần sau khi đỉnh đi qua.

## 4. Cam kết giao nhận: cơ chế Ack và tính lũy đẳng (Idempotency)

```step
category: MECHANISM
short: Ack & Lũy đẳng
scene: s4-ack-idempotency
callout:
  kind: watch-out
  title: At-least-once luôn đi đôi với Idempotent Consumer
  vi: "Không có mạng phân tán nào đảm bảo Worker không sập đúng khoảnh khắc vừa ghi DB xong nhưng chưa kịp gửi gói tin Ack về Queue."
whatChanged:
  - "+ Queue chỉ xoá thông điệp khi nhận được Ack hoàn tất từ Worker"
  - "+ Worker kiểm tra khoá idempotency_key trong giao dịch DB để chống xử lý trùng"
telemetry:
  - label: "Xoá ngay khi giao"
    value: "At-most-once (mất job)"
    tone: bad
  - label: "Ack + Khử trùng"
    value: "Chuẩn sản xuất"
    tone: ok
```

 Chuyện gì xảy ra nếu một Worker tắt nguồn ngay khi đang chạy dở một job? Câu trả lời phụ thuộc mức cam kết giao nhận (**Delivery Guarantee**):

- **At-most-once (tối đa một lần):** Queue xoá thông điệp ngay lúc giao đi. Nhanh nhất nhưng Worker sập là mất việc vĩnh viễn — chỉ hợp với log/chỉ số cho phép rơi rớt.
- **At-least-once (ít nhất một lần):** Queue tạm ẩn thông điệp trong khoảng *Visibility Timeout* và chỉ xoá hẳn khi nhận tín hiệu **Ack** từ Worker. Nếu Worker sập trước khi Ack, thông điệp tự hiện lại để giao cho Worker khác.

Vì mạng lỗi lúc gửi Ack sẽ khiến thông điệp được giao lần thứ hai, mã nguồn Worker bắt buộc phải **lũy đẳng (Idempotent)** — thực thi lặp lại cùng một `message_id` vẫn cho kết quả y như chạy một lần:

```python
def handle_payment_job(msg: dict) -> None:
    with db.transaction():
        inserted = db.execute(
            "INSERT INTO processed_msgs(msg_id) VALUES (%s) ON CONFLICT DO NOTHING",
            msg["msg_id"],
        )
        if inserted.rowcount == 0:
            return  # Đã xử lý ở lần giao trước, bỏ qua an toàn
        ledger.record_charge(msg["order_id"], msg["amount"])
    queue.ack(msg["receipt"])
```

## 5. Xử lý thông điệp độc bằng Dead Letter Queue (DLQ)

```step
category: TECHNIQUE
short: Dead Letter Q
scene: s5-dlq
callout:
  kind: technique
  title: Thử lại có giới hạn rồi cách ly
  vi: "Lỗi mạng thoáng qua sẽ tự khỏi sau vài lần thử lại có Backoff; còn dữ liệu sai định dạng thì thử 1.000 lần vẫn lỗi nên phải tách sang DLQ."
whatChanged:
  - "+ Đếm số lần thất bại retry_count trên mỗi thông điệp"
  - "~ Chạm ngưỡng 3 lần lỗi liên tiếp: gỡ khỏi Queue chính và đẩy sang DLQ"
telemetry:
  - label: "Ngưỡng thử tối đa"
    value: "3–5 lần"
  - label: "Tác dụng với Queue"
    value: "Không nghẽn dây chuyền"
    tone: ok
```

Một rủi ro thực tế khác là **thông điệp độc (Poison Message)**: bản tin bị thiếu trường bắt buộc hoặc kích hoạt một lỗi chia cho 0 trong code Worker. Nếu cứ `nack` trả về hàng đợi vô điều kiện, thông điệp đó sẽ lặp vòng `nhận → sập → trả về → nhận lại` vô tận, đốt sạch CPU của Worker và chặn đứng các job hợp lệ phía sau.

Giải pháp chuẩn là cấu hình **Dead Letter Queue (DLQ)**: sau tối đa `N` lần thử thất bại (thường `3–5 lần` kèm giãn cách Exponential Backoff), Broker tự động chuyển nguyên bản thông điệp sang hàng đợi cách ly `DLQ` và bắn cảnh báo để kỹ sư kiểm tra payload thật, triển khai bản vá lỗi rồi **phát lại (replay)** từ DLQ về hàng đợi chính.

## 6. Phân biệt Work Queue (Point-to-Point) và Pub/Sub

```step
category: MECHANISM
short: Queue & Pub/Sub
scene: s6-queue-vs-pubsub
callout:
  kind: compare
  title: Chia việc cho một nhóm hay phát loa cho nhiều dịch vụ
  vi: "Chọn Work Queue khi một tác vụ chỉ cần đúng 1 Worker thực hiện; chọn Pub/Sub khi một sự kiện cần kích hoạt nhiều dịch vụ độc lập cùng lúc."
whatChanged:
  - "+ Đối chiếu mô hình Competing Consumers trên Queue với phát tán sự kiện Topic"
telemetry:
  - label: "Work Queue"
    value: "1 tin → 1 Worker"
    tone: ok
  - label: "Pub/Sub Topic"
    value: "1 sự kiện → N dịch vụ"
```

Hai mô hình nhắn tin bất đồng bộ thường đi cặp với nhau nhưng giải quyết hai mục đích khác hẳn:

| Đặc điểm | Message Queue (Point-to-Point) | Publish / Subscribe (Pub/Sub) |
|---|---|---|
| Ai nhận thông điệp? | Đúng **1 Worker** trong nhóm cạnh tranh nhau nhận | **Mọi dịch vụ đăng ký (Subscriber)** đều nhận bản sao riêng |
| Mục tiêu chính | Chia tải công việc nặng, làm phẳng đỉnh lưu lượng | Tách rời dịch vụ phát sự kiện khỏi các dịch vụ phản ứng |
| Ví dụ điển hình | Nén video, xuất tệp báo cáo, gửi từng email cụ thể | Sự kiện `order.placed` đồng thời báo Kho, Email, Điểm thưởng, Phân tích |

Bài `S2-11` kế tiếp sẽ đi sâu vào kiến trúc Pub/Sub và mẫu Transactional Outbox.

## 7. Luật bảo toàn thông lượng: Queue hấp thụ đỉnh chứ không sinh thêm công suất

```step
category: PITFALL
short: Trần công suất
scene: s7-live-capacity
live: capacity
activity: S2-04.A2
gate: required
callout:
  kind: watch-out
  title: Đừng nhầm bộ đệm với năng lực xử lý
  vi: "Nếu tốc độ nước chảy vào bồn luôn lớn hơn vòi xả ở đáy, bồn to đến mấy rồi cũng tràn. Tốc độ bền vững dài hạn bằng đúng năng lực cụm Worker."
whatChanged:
  - "~ Giữ lưu lượng cố định liên tục để đo ngưỡng không làm tràn Queue và Worker"
telemetry:
  - label: "Năng lực API"
    value: "4.500 req/s"
  - label: "Năng lực 3 Worker"
    value: "600 job/s"
    tone: warn
```

Một ngộ nhận phổ biến khi mới dùng hàng đợi là nghĩ rằng chỉ cần đặt Kafka hay RabbitMQ phía trước thì hệ thống chịu được lưu lượng cao mãi mãi.

Thực tế, Queue chỉ mua cho bạn **thời gian** trong các đợt tăng vọt ngắn hạn ($\lambda_{\text{peak}} > \mu_{\text{worker}}$ trong vài chục giây). Còn xét trung bình dài hạn, điều kiện ổn định bắt buộc là $\lambda_{\text{avg}} < \mu_{\text{worker}}$. Hãy dùng mô phỏng ở bước này để xác định chính xác trần lưu lượng bền vững của cấu hình 3 Worker hiện tại.

## 8. Thứ tự thông điệp khi chạy nhiều Worker song song

```step
category: MECHANISM
short: Giữ thứ tự
scene: s8-ordering
activity: S2-04.A3
gate: optional
callout:
  kind: key-idea
  title: Thứ tự theo khoá thực thể thay vì thứ tự toàn cục
  vi: "Ép toàn bộ hệ thống chạy trên 1 hàng đợi đơn luồng sẽ bóp nghẹt thông lượng. Chia Partition theo order_id giúp vừa giữ thứ tự từng đơn vừa mở rộng ngang."
whatChanged:
  - "+ Băm Partition Key (order_id) để các sự kiện cùng đơn hàng vào chung 1 phân vùng"
  - "+ Mỗi phân vùng chỉ gán cho tối đa 1 Worker đọc tuần tự tại một thời điểm"
telemetry:
  - label: "Không khoá phân vùng"
    value: "Dễ đảo thứ tự"
    tone: bad
  - label: "Có Partition Key"
    value: "Tuần tự theo thực thể"
    tone: ok
```

Trên một hàng đợi FIFO thông thường có nhiều Worker cùng kéo việc song song, thông điệp số 1 (`PAID`) và thông điệp số 2 (`SHIPPED`) của cùng đơn hàng `#108` có thể rơi vào hai Worker khác nhau. Nếu Worker 1 bị tạm dừng GC hoặc phải thử lại mạng, nó có thể ghi chữ `PAID` đè lên sau khi Worker 2 đã ghi `SHIPPED`.

Để bảo toàn thứ tự mà vẫn mở rộng ngang hàng chục Worker:
1. Dùng hàng đợi phân vùng (như Kafka Topic hoặc SQS FIFO Message Group) với **Partition Key = `order_id`**. Mọi sự kiện của cùng một đơn hàng luôn đi vào đúng một phân vùng và chỉ do một luồng Worker xử lý tuần tự.
2. Kèm thêm kiểm tra trạng thái hợp lệ hoặc cột số phiên bản (`WHERE version < %s`) ở tầng Database như lớp bảo vệ thứ hai.

## 9. Giới hạn hàng đợi, giám sát tuổi Backlog và Backpressure

```step
category: PITFALL
short: Backpressure
scene: s9-backpressure
callout:
  kind: watch-out
  title: Theo dõi tuổi của job cũ nhất thay vì chỉ đếm số lượng job
  vi: "10.000 job tồn đọng chỉ mất 2 giây xả nếu bạn có 5.000 job/s, nhưng sẽ mất hơn 3 phút nếu chỉ có 50 job/s. Oldest Message Age mới phản ánh độ trễ người dùng chịu."
whatChanged:
  - "+ Giới hạn maxDepth để bảo vệ bộ nhớ của chính cụm Broker"
  - "+ Cảnh báo và Autoscale Worker theo chỉ số tuổi thông điệp cũ nhất (backlogAgeSec)"
telemetry:
  - label: "Chỉ số vàng"
    value: "Oldest Message Age"
    tone: ok
  - label: "Khi chạm maxDepth"
    value: "Trả 429 / 503 sớm"
    tone: warn
```

Không bao giờ cấu hình hàng đợi không giới hạn (*unbounded queue*): nếu cụm Worker ngừng chạy vì lỗi cấu hình, hàng triệu thông điệp dồn ứ sẽ làm tràn RAM/ổ đĩa của chính Message Broker và kéo sập toàn bộ hạ tầng nhắn tin.

Thay vào đó, luôn đặt trần `maxDepth` rõ ràng. Khi hàng đợi tiến sát trần, hệ thống chủ động phát tín hiệu **áp lực ngược (Backpressure)** — ví dụ tạm giảm tốc độ nhận hoặc trả mã `429 Too Many Requests / Retry-After` ngay ở cửa ngõ — đồng thời dùng chỉ số **Oldest Message Age (tuổi thông điệp cũ nhất chưa xử lý)** làm tín hiệu kích hoạt mở rộng thêm Worker.

## 10. Tóm tắt: năm quy tắc thiết kế xử lý bất đồng bộ với Message Queue

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Nhanh ở cửa vào, bền bỉ và lũy đẳng ở phía sau
  vi: "Queue giúp API trả lời nhanh và làm phẳng đỉnh tải, nhưng độ tin cậy thực sự nằm ở bộ ba Ack, Idempotency và Dead Letter Queue."
whatChanged:
  - "+ Tổng kết tách tải bất đồng bộ, Ack, Idempotency, DLQ và Partition Key"
telemetry:
  - label: "Độ tin cậy"
    value: "At-least-once + Idempotent"
    tone: ok
  - label: "Cô lập lỗi"
    value: "Max Retries → DLQ"
    tone: ok
```

Khi đưa Message Queue vào thiết kế hệ thống, hãy đảm bảo đủ năm mảnh ghép:

1. **Tách việc chậm khỏi đường nóng:** Chỉ giữ bước kiểm tra tối thiểu ở API để trả lời sớm, đẩy các tác vụ tốn thời gian hoặc gọi bên thứ ba qua Queue.
2. **Định cỡ Worker theo tải trung bình cộng biên dự phòng:** Queue hấp thụ đột biến ngắn hạn nhưng tốc độ xử lý dài hạn vẫn do tổng năng lực cụm Worker quyết định.
3. **At-least-once + Idempotency:** Chỉ gửi `Ack` sau khi đã lưu kết quả bền vững, và dùng `idempotency_key` để xử lý an toàn các lần giao lặp.
4. **Cấu hình Dead Letter Queue:** Giới hạn số lần thử lại để tách thông điệp độc sang DLQ thay vì làm tắc hàng đợi chính.
5. **Partition Key và Hàng đợi hữu hạn:** Băm theo khoá thực thể khi cần giữ thứ tự sự kiện, đặt trần `maxDepth` và giám sát sát sao `Oldest Message Age`.
