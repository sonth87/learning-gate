## 1. Vấn đề của lời gọi đồng bộ: dịch vụ đặt hàng bị trói chặt vào các tác vụ phụ

```step
category: SETUP
short: Ghép nối chặt
scene: s1-sync
sim: S2-11/sync-coupled
callout:
  kind: key-idea
  title: Phụ thuộc thời gian (Temporal Coupling)
  vi: "Khi A gọi đồng bộ B, C và D trong cùng một request, A chỉ nhanh bằng tổng thời gian của cả chuỗi và chỉ sống khi tất cả cùng sống."
whatChanged:
  - "+ Order Service gọi đồng bộ nối tiếp sang Order DB, Email và Loyalty"
  - "~ Mọi bước phụ đều nằm trực tiếp trên đường chờ của người mua"
telemetry:
  - label: "Lưu lượng đơn"
    value: "{global.offeredRps@10:0} req/s"
  - label: "p99 đồng bộ (t = 10 s)"
    value: "{global.p99@10:0} ms"
    tone: warn
  - label: "Lỗi khi bình thường"
    value: "{global.errorRate@10:0%}"
    tone: ok
```

**Ghép nối đồng bộ (Synchronous Coupling)** xảy ra khi một dịch vụ chính thực hiện tuần tự mọi tác vụ phụ ngay bên trong luồng xử lý request của người dùng trước khi trả phản hồi.

Xét luồng thanh toán đơn hàng nhận 500 req/s: sau khi ghi đơn vào `Order DB` (khoảng 5 ms), `Order Service` tiếp tục gọi sang `Email Service` (45 ms qua SMTP ngoài) và `Loyalty Service` (12 ms để cộng điểm). Hệ quả kép xuất hiện ngay:
- **Độ trễ cộng dồn:** thời gian chờ của khách bằng tổng độ trễ các chặng nối tiếp, đẩy p99 vượt 150 ms dù việc ghi đơn cốt lõi chỉ tốn vài mili-giây.
- **Độ khả dụng nhân lùi:** nếu mỗi trong 4 dịch vụ phụ đạt độ khả dụng 99,5%, xác suất toàn chuỗi thành công giảm còn $0{,}995^4 \approx 98\%$.

Giống như quầy thu ngân bắt khách đứng đợi nhân viên chạy đi in hoá đơn khuyến mãi và gửi bưu phẩm xong mới cho bước ra khỏi quầy.

## 2. Quan sát sự cố: dịch vụ Email dừng làm toàn bộ luồng mua hàng thất bại

```step
category: PROBLEM
short: Email sập
scene: s2-live-sync
live: sync-crash
activity: S2-11.A1
gate: optional
callout:
  kind: watch-out
  title: Tác vụ phụ làm tê liệt nghiệp vụ chính
  vi: "Khách hàng chấp nhận nhận email xác nhận chậm vài phút, nhưng không chấp nhận lỗi 500 khi bấm nút thanh toán."
whatChanged:
  - "~ Tại t = 20 s, Email Service dừng hoạt động đến t = 45 s"
  - "~ Tỷ lệ lỗi đặt hàng vọt lên 100% dù Order DB hoàn toàn khoẻ"
```

Trong kịch bản mô phỏng trực tiếp, hệ thống đang xử lý ổn định 500 đơn/giây thì tại **t = 20 s**, nhà cung cấp SMTP gặp sự cố khiến `Email Service` ngừng hoạt động:

- Từ **t = 20 s đến t = 45 s**, lời gọi đồng bộ `checkout → email_svc` thất bại hoàn toàn.
- Vì `Order Service` coi bước gửi thư là một chặng bắt buộc trong hàm xử lý đơn, toàn bộ 500 đơn/giây đều trả lỗi về phía khách hàng (`goodput = 0 req/s`).
- `Order DB` và `Loyalty Service` chỉ mới dùng khoảng 25–42% năng lực nhưng bị bỏ không suốt thời gian `Email Service` ngừng chạy.

Nguyên tắc thiết kế rút ra: chỉ giữ lại các kiểm tra quyết định tính hợp lệ của giao dịch (như trừ tồn kho, xác nhận thanh toán) trên đường đồng bộ; mọi phản ứng phụ sau khi đơn đã thành lập cần tách ra khỏi request gốc.

## 3. Tách rời bằng Pub/Sub và Event Bus: phát một sự kiện, trả lời ngay

```step
category: TECHNIQUE
short: Phát sự kiện
scene: s3-pubsub
callout:
  kind: key-idea
  title: Đảo chiều phụ thuộc nhận thức
  vi: "Order Service chỉ công bố sự thật là đơn hàng vừa được tạo (OrderCreated), không cần biết có bao nhiêu dịch vụ đang lắng nghe phía sau."
whatChanged:
  - "+ Đặt Event Bus ở giữa; bỏ các lời gọi đồng bộ sang Email và Loyalty"
  - "~ Độ trễ p99 đặt hàng giảm mạnh vì không còn đợi SMTP 45 ms"
telemetry:
  - label: "Chặng đồng bộ"
    value: "Order → DB"
    tone: ok
  - label: "p99 sau khi tách"
    value: "≈ 68 ms"
    tone: ok
  - label: "Số dịch vụ Order cần biết"
    value: "0 subscriber"
    tone: ok
```

Mô hình **Publish/Subscribe (Pub/Sub)** tách bên tạo thông tin (**Publisher**) khỏi các bên phản ứng (**Subscriber**) thông qua một kênh trung gian gọi là **Topic** trên **Event Bus**.

Thay vì gọi từng dịch vụ đích danh, `Order Service` lưu đơn hàng rồi phát đúng một sự kiện miền (Domain Event) mang tên `OrderCreated` kèm mã đơn, mã khách và tổng tiền, sau đó trả kết quả thành công ngay cho người mua.

Cách tổ chức này gỡ bỏ hai loại ràng buộc:
- **Về mặt hiệu năng:** đường đồng bộ rút ngắn chỉ còn chặng lưu dữ liệu đơn hàng, p99 giảm từ hơn 160 ms xuống khoảng 68 ms.
- **Về mặt mở rộng mã nguồn:** khi doanh nghiệp muốn thêm dịch vụ phát hiện gian lận hoặc đồng bộ kho phân tích, nhóm mới chỉ cần đăng ký đọc Topic `OrderCreated` mà không sửa một dòng mã nào của `Order Service`.

## 4. Phân biệt Message Queue với Pub/Sub Topic: chia việc hay quảng bá?

```step
category: MECHANISM
short: Queue và Topic
scene: s4-queue-vs-topic
callout:
  kind: compare
  title: Tiêu chí chọn nhanh
  vi: "Dùng Queue khi muốn chia một khối lượng việc cho nhiều worker làm chung. Dùng Topic khi một sự kiện cần kích hoạt nhiều nghiệp vụ khác nhau."
whatChanged:
  - "+ Đối chiếu cơ chế phân phối thông điệp của Queue và Topic"
  - "~ Kết hợp cả hai bằng mẫu Topic kèm hàng đợi cho từng nhóm đăng ký"
telemetry:
  - label: "Message Queue"
    value: "1 thông điệp → 1 worker"
  - label: "Pub/Sub Topic"
    value: "1 sự kiện → N nhóm"
    tone: ok
```

Dù đều truyền thông điệp bất đồng bộ, **Message Queue** (đã học ở S2-04) và **Pub/Sub Topic** phục vụ hai mục đích khác hẳn nhau:

| Tiêu chí | Message Queue (Point-to-Point) | Pub/Sub Topic (Fan-out) |
|---|---|---|
| Ngữ nghĩa thông điệp | Mệnh lệnh cần làm (`SendEmailJob`) | Sự kiện đã xảy ra (`OrderCreated`) |
| Ai nhận được? | **Đúng 1 worker** trong nhóm lấy đi xử lý | **Mọi nhóm đăng ký** đều nhận một bản sao |
| Khi thêm người nhận mới | Tải được chia nhỏ hơn trên cùng công việc | Một nghiệp vụ mới cùng chạy song song |

Trong hệ thống thực tế (như Kafka Consumer Group hoặc SNS nối SQS), hai mô hình thường ghép lại: **Topic** nhân bản sự kiện ra từng kênh đăng ký (`Sub: Email`, `Sub: Loyalty`), còn bên trong mỗi kênh lại hoạt động như một **Queue** để nhiều worker cùng loại chia nhau xử lý.

## 5. Cô lập sự cố và tự bắt kịp: khi một Subscriber ngừng hoạt động

```step
category: MECHANISM
short: Tự bắt kịp
scene: s5-live-pubsub
live: pubsub-resilient
callout:
  kind: good-to-know
  title: Bền vững theo từng nhóm đăng ký
  vi: "Mỗi subscription giữ vị trí đọc (offset) riêng. Nhánh chậm không cản nhánh nhanh và không làm mất sự kiện trong thời gian lưu giữ."
whatChanged:
  - "~ Email Service sập từ t = 20 s đến t = 42 s nhưng lỗi đặt hàng vẫn 0%"
  - "~ Sub: Email tích luỹ sự kiện tồn và tự xả sạch sau khi Email hồi phục"
```

Chạy lại đúng sự cố `Email Service` sập lúc **t = 20 s** trên kiến trúc Pub/Sub để đối chiếu với bước 2:

- **Luồng đặt hàng giữ 0% lỗi:** `Order Service` và `Order DB` hoàn tất toàn bộ 500 đơn/giây với p99 phẳng quanh 68 ms.
- **Các nhánh khác không bị vạ lây:** `Loyalty Service` có con trỏ đọc riêng trên `Sub: Loyalty`, nên khách vẫn được cộng điểm ngay lập tức.
- **Tự động bắt kịp (Catch-up):** trong 22 giây `Email Service` dừng chạy, `Sub: Email` giữ lại khoảng 11.000 sự kiện chưa xác nhận (ack). Khi 2 worker Email khởi động lại (tổng năng lực 1.200 sự kiện/giây > tốc độ đến 500 sự kiện/giây), cụm tiêu thụ bù với tốc độ ròng 700 sự kiện/giây và xả hết hàng đợi tồn chỉ sau khoảng 16 giây.

## 6. Lỗi ghi kép (Dual-Write): lưu được đơn hàng nhưng đánh rơi sự kiện

```step
category: PITFALL
short: Mất sự kiện
scene: s6-dual-write
callout:
  kind: watch-out
  title: Hai hệ thống lưu trữ không có giao dịch tự động chung
  vi: "Ghi vào Database rồi gọi tiếp hàm publish lên Event Bus là hai thao tác mạng tách rời; tiến trình có thể sập đúng vào khe hở ở giữa."
whatChanged:
  - "~ Tiến trình Order Service gặp sự cố ngay sau lệnh COMMIT xuống DB"
  - "- Sự kiện OrderCreated chưa kịp lên Event Bus và bị mất vĩnh viễn"
telemetry:
  - label: "Trạng thái Order DB"
    value: "Đã COMMIT đơn #904"
    tone: ok
  - label: "Trạng thái Event Bus"
    value: "Thiếu sự kiện #904"
    tone: bad
```

Khi mới áp dụng Pub/Sub, nhiều lập trình viên viết hai dòng lệnh nối tiếp trong ứng dụng: lưu vào Database trước, rồi gọi SDK phát sự kiện lên Event Bus sau. Đây là **bài toán ghi kép (Dual-Write Problem)**:

- **Cách 1 — COMMIT vào DB trước, publish lên Bus sau:** nếu container ứng dụng hết RAM (OOM), mất mạng tới Broker hoặc khởi động lại đúng sau dòng `db.commit()`, đơn hàng đã trừ tiền nhưng sự kiện `OrderCreated` biến mất mãi mãi. Không có email, không cộng điểm, kho không xuất hàng.
- **Cách 2 — Publish lên Bus trước, COMMIT vào DB sau:** sự kiện đã bay tới các subscriber, nhưng câu lệnh `db.commit()` bị lỗi ràng buộc và huỷ giao dịch (Rollback). Hệ thống gửi thư xác nhận và cộng điểm cho một đơn hàng không hề tồn tại (sự kiện ma).

## 7. Mẫu Transactional Outbox và Relay: biến hai thao tác thành một giao dịch ACID

```step
category: TECHNIQUE
short: Bảng Outbox
scene: s7-outbox
callout:
  kind: technique
  title: Nguyên lý Transactional Outbox
  vi: "Thay vì phát thẳng ra mạng, hãy ghi sự kiện như một dòng dữ liệu bình thường vào bảng outbox nằm ngay trong cùng Database với bảng nghiệp vụ."
whatChanged:
  - "+ Thêm bảng outbox_events ghi chung giao dịch ACID với bảng orders"
  - "+ Tiến trình Outbox Relay (hoặc CDC) đọc sự kiện chưa gửi đẩy sang Bus"
telemetry:
  - label: "Tính nguyên tử"
    value: "1 giao dịch SQL cục bộ"
    tone: ok
  - label: "Đảm bảo phát"
    value: "At-least-once"
    tone: ok
```

**Transactional Outbox** giải quyết triệt để lỗi ghi kép bằng cách tận dụng giao dịch ACID sẵn có của chính cơ sở dữ liệu nghiệp vụ:

```sql
BEGIN;
INSERT INTO orders (id, user_id, total_cents, status)
VALUES ('ord_904', 'u_42', 580000, 'CONFIRMED');

INSERT INTO outbox_events (event_id, aggregate_id, topic, payload, published_at)
VALUES ('evt_771', 'ord_904', 'OrderCreated', '{"orderId":"ord_904","total":580000}', NULL);
COMMIT;
```

Vì cả hai câu `INSERT` nằm trong một giao dịch cục bộ: hoặc cả đơn hàng lẫn dòng outbox cùng được lưu bền vững, hoặc cả hai cùng huỷ. Không còn khe hở mất sự kiện.

Sau đó, một tiến trình nền gọi là **Outbox Relay** (quét định kỳ `WHERE published_at IS NULL FOR UPDATE SKIP LOCKED`, hoặc đọc luồng WAL qua **Change Data Capture** như Debezium) đẩy sự kiện lên Event Bus, chờ Broker xác nhận xong mới đánh dấu `published_at = NOW()`.

## 8. Đánh đổi của kiến trúc sự kiện: xử lý trùng lặp (Idempotency) và quan sát luồng

```step
category: PITFALL
short: Xử lý trùng
scene: s8-idempotent
activity: S2-11.A2
gate: required
callout:
  kind: watch-out
  title: Outbox đảm bảo không mất, nhưng có thể gửi lặp
  vi: "Nếu Relay đẩy sự kiện lên Bus thành công nhưng sập trước khi kịp cập nhật cột published_at, lần chạy lại sẽ phát sự kiện đó thêm một lần nữa."
whatChanged:
  - "+ Subscriber lưu bảng processed_events có ràng buộc UNIQUE(event_id)"
  - "+ Truyền mã trace_id vào header sự kiện để nối chuỗi quan sát phân tán"
telemetry:
  - label: "Ngữ nghĩa chuyển giao"
    value: "At-least-once"
    tone: warn
  - label: "Điều kiện ở Subscriber"
    value: "Idempotent theo event_id"
    tone: ok
```

Chuyển sang Pub/Sub kèm Outbox mang lại độ bền cao nhưng đi kèm ba đánh đổi kỹ thuật bắt buộc phải xử lý:

1. **Sự kiện có thể đến nhiều hơn một lần (At-least-once):** cả Outbox Relay lẫn Event Bus đều ưu tiên thử lại khi mất kết nối ACK. Do đó mọi subscriber phải **bất biến (Idempotent)** — ví dụ `Loyalty Service` chèn `event_id` vào bảng `processed_events` (có khoá `UNIQUE`) trong cùng giao dịch cộng điểm; nếu trùng khoá thì bỏ qua an toàn.
2. **Nhất quán cuối cùng (Eventual Consistency):** ngay giây đầu sau khi đặt đơn, điểm thưởng có thể chưa kịp tăng; giao diện cần hiển thị trạng thái đang cập nhật thay vì giả định tức thì.
3. **Khó lần vết hơn gọi hàm trực tiếp:** một hành động nay trải qua nhiều dịch vụ rời nhau, nên cần đính kèm `trace_id` (Distributed Tracing) vào metadata của mọi sự kiện và giám sát chặt độ trễ tồn đọng (consumer lag).

## 9. Tóm tắt: khi nào dùng Pub/Sub và quy tắc triển khai an toàn

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba mảnh ghép luôn đi cùng nhau
  vi: "Pub/Sub Topic để tách rời dịch vụ phụ, Transactional Outbox để không đánh rơi sự kiện lúc ghi, và Idempotent Consumer để chịu được sự kiện gửi lặp."
whatChanged:
  - "+ Hoàn chỉnh luồng đặt hàng bất đồng bộ chịu lỗi từ đầu tới cuối"
telemetry:
  - label: "Lỗi đặt hàng khi Email sập"
    value: "100% xuống 0%"
    tone: ok
  - label: "Mất sự kiện khi crash"
    value: "0 (nhờ Outbox)"
    tone: ok
```

Ghi nhớ bốn nguyên tắc cốt lõi của bài học:

1. **Tách tác vụ phụ khỏi luồng đồng bộ:** những việc không quyết định kết quả thành bại tức thời của request (gửi email, thông báo đẩy, tích điểm, thống kê) nên chuyển sang phát sự kiện qua Event Bus.
2. **Chọn đúng mô hình trung gian:** dùng **Message Queue** để chia tải một công việc cho nhóm worker cùng loại; dùng **Pub/Sub Topic** để phát quảng bá một sự kiện nghiệp vụ cho nhiều hệ thống con độc lập.
3. **Không bao giờ ghi kép trần (Dual-Write):** luôn ghi bảng nghiệp vụ và bảng `outbox_events` trong cùng một giao dịch ACID, rồi để Relay/CDC đẩy lên Broker.
4. **Thiết kế Subscriber bất biến:** lưu vết `event_id` đã xử lý để một sự kiện gửi lặp hai lần vẫn chỉ tạo tác dụng đúng một lần.
