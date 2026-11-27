## 1. Bốn cam kết ACID cục bộ và bài toán chiếc ghế cuối cùng

```step
category: SETUP
short: Bốn cam kết ACID
scene: s1-setup
callout:
  kind: key-idea
  title: ACID bảo vệ một cơ sở dữ liệu
  vi: "Atomicity đảm bảo thành công trọn gói hoặc huỷ hết; Consistency giữ đúng ràng buộc dữ liệu; Isolation cô lập các giao dịch chạy song song; Durability giữ bền kết quả đã COMMIT qua sự cố mất điện."
whatChanged:
  - "+ Hai máy Booking API cùng truy cập bảng seats trên một Seat DB"
  - "+ Ghế A12 chỉ còn đúng 1 chỗ trống khi hai khách bấm mua cùng lúc"
telemetry:
  - label: "Số ghế A12 còn lại"
    value: "1 ghế"
    tone: warn
  - label: "Tải đặt vé"
    value: "320 req/s"
  - label: "ρ của Seat DB"
    value: "0,18"
    tone: ok
```

Khi nhiều tiến trình ứng dụng cùng đọc và sửa dữ liệu tiền tệ hoặc tồn kho trên một cơ sở dữ liệu quan hệ, **giao dịch (Transaction)** gom nhiều câu lệnh SQL thành một đơn vị thực thi tuân theo bốn tính chất **ACID**:

- **Atomicity (Nguyên tử):** Mọi thao tác trong khối `BEGIN ... COMMIT` hoặc cùng có hiệu lực, hoặc cùng được hoàn nguyên (`ROLLBACK`) nếu gặp lỗi giữa chừng.
- **Consistency (Toàn vẹn):** Giao dịch luôn đưa dữ liệu từ trạng thái hợp lệ này sang trạng thái hợp lệ khác theo các ràng buộc (`CHECK`, `UNIQUE`, `FOREIGN KEY`).
- **Isolation (Cô lập):** Kiểm soát mức độ các giao dịch đang chạy dở nhìn thấy hoặc ghi đè dữ liệu của nhau.
- **Durability (Bền vững):** Một khi DB trả về `COMMIT`, bản ghi đã nằm an toàn trên nhật ký WAL nên không mất khi sập nguồn.

Tuy nhiên, chữ **I (Isolation)** thường bị hiểu lầm nhiều nhất: mặc định các hệ quản trị như PostgreSQL dùng mức `Read Committed` để ưu tiên thông lượng, hoàn toàn không chạy tuần tự từng giao dịch một.

## 2. Lỗi Lost Update: bọc BEGIN...COMMIT vẫn bán trùng một ghế

```step
category: PROBLEM
short: Lỗi Lost Update
scene: s2-lost-update
callout:
  kind: watch-out
  title: BEGIN...COMMIT không tự khoá lệnh SELECT
  vi: "Ở mức cô lập Read Committed mặc định, câu lệnh SELECT thường chỉ đọc ảnh chụp tại mili-giây đó mà không giữ khoá. Hai giao dịch cùng đọc left = 1 sẽ cùng ghi left = 0."
whatChanged:
  - "~ TX1 và TX2 cùng đọc seats_left = 1 ở t1 và t2"
  - "~ TX2 ghi đè kết quả của TX1 ở t4, làm 1 ghế xuất ra 2 vé"
telemetry:
  - label: "Mức cô lập mặc định"
    value: "Read Committed"
    tone: warn
  - label: "Số vé phát hành"
    value: "2 vé / 1 ghế"
    tone: bad
```

Xét chu trình **Read-Modify-Write** kinh điển được viết trong mã ứng dụng:

```python
def book_seat_naive(db, seat_id: str, user_id: int) -> bool:
    with db.transaction():  # BEGIN ... COMMIT (Read Committed)
        row = db.query_one("SELECT seats_left FROM seats WHERE id = %s", seat_id)
        if row.seats_left <= 0:
            return False
        db.execute("UPDATE seats SET seats_left = %s WHERE id = %s",
                   row.seats_left - 1, seat_id)
        db.execute("INSERT INTO bookings(seat_id, user_id) VALUES (%s, %s)",
                   seat_id, user_id)
        return True
```

Khi hai khách cùng đặt ghế `A12` (`seats_left = 1`) cách nhau 2 ms trên hai instance `Booking API 1` và `Booking API 2`:

1. `TX1` chạy `SELECT` thấy `seats_left = 1`.
2. `TX2` chạy `SELECT` ngay sau đó (khi `TX1` chưa kịp `COMMIT`) nên cũng thấy `seats_left = 1`.
3. `TX1` ghi `seats_left = 0` và chèn vé thứ nhất.
4. `TX2` lấy giá trị cũ trong RAM ứng dụng (`1 - 1 = 0`), ghi đè `seats_left = 0` và chèn vé thứ hai.

Cả hai giao dịch đều `COMMIT` thành công mà không báo lỗi SQL nào: cập nhật của `TX1` đã bị xoá sạch (**Lost Update**).

## 3. Khoá dòng bi quan SELECT FOR UPDATE và câu UPDATE nguyên tử

```step
category: TECHNIQUE
short: Khoá FOR UPDATE
scene: s3-pessimistic-lock
callout:
  kind: technique
  title: Đẩy phép kiểm tra xuống cùng chỗ với phép ghi
  vi: "SELECT ... FOR UPDATE buộc giao dịch sau xếp hàng đợi khoá dòng; còn câu UPDATE một dòng kèm điều kiện WHERE seats_left > 0 vừa gọn vừa giữ khoá trong thời gian ngắn nhất."
whatChanged:
  - "+ Bổ sung khoá dòng độc quyền SELECT ... FOR UPDATE trên bản ghi A12"
  - "+ Hoặc gộp kiểm tra và trừ kho vào một câu UPDATE nguyên tử"
telemetry:
  - label: "Cơ chế đồng bộ"
    value: "Row-level Lock"
    tone: ok
  - label: "Vé bán vượt"
    value: "0 vé"
    tone: ok
```

Khi tỷ lệ đụng độ trên cùng một bản ghi cao (như mở bán vé sự kiện nóng), kiểm soát **bi quan (Pessimistic Concurrency Control)** chủ động xếp hàng các giao dịch trên dòng dữ liệu đó.

**Cách 1 — Khoá dòng khi đọc quyết định (`SELECT ... FOR UPDATE`):**
Thêm mệnh đề `FOR UPDATE` vào câu `SELECT`. `TX1` giành khoá độc quyền trên dòng `A12`; `TX2` chạm vào dòng này phải tạm dừng đợi tới khi `TX1` `COMMIT`. Ngay khi mở khoá, `TX2` đọc lại phiên bản mới nhất (`seats_left = 0`) và từ chối đặt vé an toàn.

**Cách 2 — Gộp vào một câu `UPDATE` nguyên tử (Atomic Conditional Update):**
Nếu không cần tính toán phức tạp ở tầng ứng dụng, tránh hoàn toàn vòng đọc-rồi-ghi bằng một lệnh SQL duy nhất:

```sql
UPDATE seats
SET seats_left = seats_left - 1
WHERE id = 'A12' AND seats_left > 0
RETURNING id;
```

Cơ sở dữ liệu tự khoá dòng, kiểm tra `seats_left > 0` và trừ `1` trong một bước nguyên tử; giao dịch thứ hai nhận về `0` dòng khớp điều kiện nên biết ngay ghế đã hết.

## 4. Kiểm soát lạc quan (Optimistic CAS) bằng cột phiên bản

```step
category: TECHNIQUE
short: Optimistic CAS
scene: s4-optimistic-cas
callout:
  kind: compare
  title: Chọn Bi quan hay Lạc quan?
  vi: "Tranh chấp thấp (sửa hồ sơ, chỉnh giỏ hàng): Optimistic CAS tránh chi phí giữ khoá. Tranh chấp rất cao trên 1 dòng nóng: SELECT FOR UPDATE tốt hơn vì CAS sẽ phải thử lại liên tục."
whatChanged:
  - "+ Thêm cột version tăng dần sau mỗi lần sửa dòng dữ liệu"
  - "~ Giao dịch ghi kèm điều kiện WHERE id = 'A12' AND version = v_đã_đọc"
telemetry:
  - label: "Khoá giữ lúc đọc"
    value: "0 khoá"
    tone: ok
  - label: "Phát hiện ghi đè"
    value: "WHERE version = v"
    tone: ok
```

Khi phần lớn thời gian các giao dịch không chạm vào cùng một dòng (ví dụ hai nhân viên hiếm khi sửa chung một đơn hàng), việc xin khoá `FOR UPDATE` ở mọi lượt đọc gây tốn kém không cần thiết. **Kiểm soát lạc quan (Optimistic Concurrency Control — Compare-And-Swap / CAS)** cho phép đọc tự do không khoá, nhưng kiểm chứng tại thời điểm ghi:

```sql
-- Bước 1: Đọc dữ liệu kèm số phiên bản hiện tại (giả sử nhận ver = 1, left = 1)
SELECT seats_left, version FROM seats WHERE id = 'A12';

-- Bước 2: Chỉ cập nhật nếu không ai sửa dòng này kể từ lúc đọc
UPDATE seats
SET seats_left = 0, version = version + 1
WHERE id = 'A12' AND version = 1 AND seats_left > 0;
```

- `TX1` đến trước thấy `version = 1` khớp nên đổi thành `version = 2` (`1 row affected`).
- `TX2` đến sau vẫn mang điều kiện `WHERE version = 1`, câu lệnh trả về `0 rows affected`. Ứng dụng phát hiện xung đột ngay lập tức để đọc lại trạng thái mới hoặc báo ghế đã có người lấy.

## 5. Phổ mức cô lập: từ Read Committed, Snapshot đến Serializable

```step
category: MECHANISM
short: Các mức cô lập
scene: s5-isolation-levels
activity: S3-07.A2
gate: optional
callout:
  kind: good-to-know
  title: Snapshot Isolation vẫn có thể lọt Write Skew
  vi: "Repeatable Read / Snapshot Isolation giúp mỗi giao dịch nhìn một ảnh chụp tĩnh từ lúc mở, nhưng nếu hai giao dịch đọc chung một tập rồi cập nhật hai dòng khác nhau, bất biến toàn cục vẫn có thể vỡ."
whatChanged:
  - "+ So sánh Read Committed, Repeatable Read (Snapshot) và Serializable"
  - "+ Minh hoạ lỗi Write Skew khi hai giao dịch cập nhật hai dòng giao nhau"
telemetry:
  - label: "Cơ chế đọc không khoá"
    value: "MVCC"
  - label: "Mức cô lập cao nhất"
    value: "Serializable"
    tone: ok
```

Các cơ sở dữ liệu hiện đại dùng **MVCC (Multi-Version Concurrency Control)** giữ nhiều phiên bản bản ghi để lượt đọc thông thường không chặn lượt ghi. Tuỳ mức cô lập được chọn, hệ thống ngăn chặn các bất thường khác nhau:

| Mức cô lập | Bất thường đã chặn | Bất thường còn có thể xảy ra |
|---|---|---|
| **Read Committed** | Dirty Read (đọc dữ liệu chưa `COMMIT`) | Non-Repeatable Read, Lost Update, Write Skew |
| **Repeatable Read / Snapshot** | Dirty Read, Non-Repeatable Read (PostgreSQL tự báo lỗi nếu 2 bên ghi đè *cùng* 1 dòng) | **Write Skew** trên 2 dòng khác nhau |
| **Serializable (SSI)** | Toàn bộ bất thường đồng thời (tương đương chạy tuần tự) | Phải bắt ngoại lệ `serialization_failure` để thử lại |

Ví dụ điển hình của **Write Skew** dưới Snapshot Isolation: quy định bệnh viện yêu cầu mỗi ca có ít nhất 1 bác sĩ trực. Đang có An và Bình cùng trực (`count = 2`). Cả hai bấm xin nghỉ cùng lúc: giao dịch của An đếm thấy `2 >= 2` nên sửa dòng `An -> nghỉ`; giao dịch của Bình cũng đếm ảnh chụp thấy `2 >= 2` nên sửa dòng `Bình -> nghỉ`. Vì hai câu `UPDATE` chạm **hai dòng khác nhau**, Snapshot Isolation cho cả hai `COMMIT`, để lại ca trực còn `0` bác sĩ. Muốn chặn, phải dùng `Serializable` hoặc khoá tường minh các dòng liên quan bằng `FOR UPDATE`.

## 6. Khoá dòng chưa tồn tại, Deadlock và chốt chặn UNIQUE

```step
category: PITFALL
short: Deadlock & Khóa
scene: s6-deadlock-unique
callout:
  kind: watch-out
  title: Không thể SELECT FOR UPDATE một dòng chưa sinh ra
  vi: "Kiểm tra SELECT không thấy vé rồi mới INSERT vẫn bị lọt khi hai giao dịch chạy song song. Ràng buộc UNIQUE trên cơ sở dữ liệu là lớp bảo vệ cuối cùng không thể bỏ qua."
whatChanged:
  - "~ Hai giao dịch khoá cặp ghế ngược chiều (A1→A2 và A2→A1) gây Deadlock"
  - "+ Sắp xếp thứ tự khoá tăng dần và đặt UNIQUE (event_id, seat_id)"
telemetry:
  - label: " Xử lý Deadlock ở DB"
    value: "Huỷ 1 giao dịch"
    tone: warn
  - label: "Chốt chặn trùng bản ghi"
    value: "UNIQUE Index"
    tone: ok
```

Hai cạm bẫy thường xuất hiện ngay sau khi đội ngũ kỹ thuật đưa `SELECT ... FOR UPDATE` vào hệ thống:

1. **Kiểm tra sự tồn tại trên dòng chưa có:** Nếu bạn viết `SELECT id FROM bookings WHERE event_id = 9 AND seat_id = 'A12' FOR UPDATE`, khi ghế chưa ai đặt thì câu truy vấn trả về **0 dòng** — không có dòng vật lý nào để gắn khoá (trừ khi dùng Predicate/Gap Lock ở Serializable). Cả hai giao dịch cùng thấy rỗng rồi cùng chạy `INSERT`. Giải pháp bắt buộc: tạo ràng buộc `UNIQUE (event_id, seat_id)` ngay trên bảng `bookings` (hoặc `INSERT ... ON CONFLICT DO NOTHING`) để B-Tree chỉ mục chặn cứng bản ghi trùng thứ hai.
2. **Deadlock khi khoá nhiều dòng:** Khách 1 đặt cặp ghế `['A1', 'A2']`, khách 2 đặt `['A2', 'A1']`. `TX1` giữ `A1` chờ `A2`, trong khi `TX2` giữ `A2` chờ `A1`. Bộ phát hiện chu trình của DB sẽ huỷ một giao dịch. Cách phòng ngừa triệt để ở tầng mã nguồn là **chuẩn hoá thứ tự xin khoá** (`ORDER BY seat_id ASC`) trước khi chạy `SELECT ... FOR UPDATE`.

## 7. Cạm bẫy giữ khoá khi gọi API ngoài làm cạn Connection Pool

```step
category: PITFALL
short: Cạn Pool kết nối
scene: s7-hold-lock-live
live: lock-pool
activity: S3-07.A1
gate: optional
callout:
  kind: watch-out
  title: "Định luật Little trên Connection Pool: μ = Pool / T_giữ"
  vi: "Mỗi mili-giây chờ mạng bên trong khối BEGIN...COMMIT đều chiếm giữ một kết nối DB quý giá. Khi T_giữ tăng gấp 30 lần, thông lượng tối đa của cả cơ sở dữ liệu tụt xuống đúng 30 lần."
whatChanged:
  - "~ t = 16 s: giữ giao dịch DB trong lúc chờ Payment API phản hồi (~250 ms)"
  - "~ Thông lượng Seat DB sụp từ 1.800 xuống 80 req/s (ρ = 4,00), p99 vượt 1.200 ms"
telemetry:
  - label: "Pool / T_giữ (t < 16 s)"
    value: "20 / 8 ms → 1.800 ops/s"
    tone: ok
  - label: "Pool / T_giữ (t ≥ 16 s)"
    value: "20 / 250 ms → 80 ops/s"
    tone: bad
  - label: "ρ của Seat DB (t = 25 s)"
    value: "4,00 (cạn sạch pool)"
    tone: bad
```

Sai lầm nghiêm trọng nhất trong môi trường thực tế là đặt lời gọi HTTP tới cổng thanh toán ngay bên trong khối giao dịch đang giữ khoá và kết nối DB:

- **Trước giây 16:** Mỗi giao dịch SQL chỉ chạy cục bộ mất `8 ms`. Với `poolSize = 20` kết nối, năng lực của pool là `20 / 0,008 = 2.500 ops/s` (giới hạn bởi CPU DB ở `1.800 ops/s`). Với tải `320 req/s`, `Seat DB` thảnh thơi ở `ρ = 0,18`, `p99 ≈ 132 ms`.
- **Từ giây 16:** Một bản cập nhật giữ nguyên giao dịch SQL mở trong khi chờ cổng thanh toán phản hồi chậm, kéo thời gian chiếm giữ mỗi kết nối lên `250 ms` (`0,25 s`). Theo định luật Little, thông lượng tối đa mà 20 kết nối phục vụ được tụt thẳng xuống `20 / 0,25 = 80 ops/s`!
- Dù CPU của `Seat DB` gần như rảnh rỗi, toàn bộ 20 kết nối đều bị ngâm chờ mạng. Với `320 req/s` đổ vào, `ρ` vọt lên `4,00`, hàng đợi tràn `800` request và cả lượt xem danh sách ghế lẫn lượt mua đều báo lỗi quá hạn.

## 8. Giải pháp kiến trúc: mẫu Giữ chỗ (Reservation) tách rời giao dịch

```step
category: TECHNIQUE
short: Mẫu Giữ chỗ
scene: s8-reservation-fix
activity: S3-07.A3
gate: required
callout:
  kind: key-idea
  title: Giao dịch DB chỉ làm việc với dữ liệu cục bộ
  vi: "Thay một giao dịch dài bằng hai giao dịch ngắn vài mili-giây kẹp quanh bước gọi mạng: Tạm giữ chỗ có thời hạn → Thu tiền ngoài DB → Xác nhận vé."
whatChanged:
  - "+ Tách quy trình thành TX1 (HELD 5 phút), gọi Payment API ngoài DB, rồi TX2 (CONFIRMED)"
  - "~ Thời gian giữ kết nối DB quay về 8 ms, khôi phục thông lượng 1.800 ops/s"
telemetry:
  - label: "Thời gian giữ kết nối DB"
    value: "≈ 8 ms / pha"
    tone: ok
  - label: "Trạng thái trung gian"
    value: "HELD + expires_at"
    tone: ok
```

Để vừa không bán trùng ghế vừa không bao giờ giữ kết nối DB qua lời gọi mạng, các hệ thống đặt vé và thương mại điện tử tách luồng thành **ba bước với trạng thái giữ chỗ tạm thời (Reservation Pattern)**:

1. **Giao dịch cục bộ 1 (~5–8 ms):** Dùng `UPDATE` nguyên tử chuyển ghế sang trạng thái `HELD`, gắn `booking_id` và mốc hết hạn `expires_at = NOW() + INTERVAL '5 minutes'`, rồi **`COMMIT` ngay lập tức** để trả kết nối về pool.
2. **Gọi dịch vụ ngoài (không giữ kết nối DB):** Gửi yêu cầu trừ tiền tới `Payment API` kèm `Idempotency-Key = booking_id` (sẽ học sâu ở bài `S3-04`). Dù cổng thanh toán mất 300 ms hay 3 giây, `Seat DB` hoàn toàn không bị ảnh hưởng.
3. **Giao dịch cục bộ 2 (~5 ms):** Nếu thanh toán thành công, chạy `UPDATE` đổi trạng thái sang `CONFIRMED`. Nếu thẻ bị từ chối hoặc quá hạn 5 phút mà khách bỏ dở, tiến trình quét nền thu hồi các ghế `HELD` đã quá `expires_at` về lại `AVAILABLE`.

## 9. Tổng kết: khung chọn kỹ thuật kiểm soát đồng thời

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba quy tắc cốt lõi
  vi: "Không đọc-sửa-ghi không khoá ở Read Committed; luôn có ràng buộc UNIQUE làm chốt chặn cuối; không bao giờ gọi mạng bên trong giao dịch SQL."
whatChanged:
  - "+ Tổng hợp bảng chọn kỹ thuật theo mức độ tranh chấp và phạm vi dữ liệu"
telemetry:
  - label: "Tranh chấp cao 1 dòng"
    value: "FOR UPDATE / Atomic SQL"
  - label: "Tranh chấp thấp"
    value: "Optimistic CAS (version)"
  - label: "Có gọi API ngoài"
    value: "Reservation 3 bước"
    tone: ok
```

Khi thiết kế các thao tác đọc và ghi đồng thời trên một cơ sở dữ liệu đơn lẻ, hãy kiểm tra theo thứ tự sau:

1. **Một dòng, phép toán đơn giản (trừ tồn kho, cộng số dư):** Ưu tiên câu `UPDATE ... SET left = left - 1 WHERE id = ? AND left > 0` nguyên tử.
2. **Một hoặc vài dòng, logic kiểm tra phức tạp, đụng độ cao:** Dùng `SELECT ... FOR UPDATE` với thứ tự khoá chuẩn hoá (`ORDER BY id ASC`) để triệt tiêu Deadlock.
3. **Đụng độ thấp, đọc nhiều hơn ghi:** Dùng cột `version` với điều kiện CAS `WHERE id = ? AND version = ?` để tránh chi phí khoá.
4. **Bất biến cắt ngang nhiều dòng (như lịch trực tối thiểu):** Dùng mức cô lập `Serializable` hoặc khoá tường minh dòng cha đại diện.
5. **Luôn đặt ràng buộc toàn vẹn ở DB (`UNIQUE`, `CHECK >= 0`)** và **tách mọi lời gọi HTTP/RPC ra ngoài khối `BEGIN...COMMIT`** bằng mẫu Giữ chỗ (`HELD` → Thanh toán → `CONFIRMED`).
