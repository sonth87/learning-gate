## 1. Ba mẫu giao tiếp định hình độ trễ, độ tin cậy và mức gắn kết

```step
category: SETUP
short: Ba mẫu chính
scene: s1-overview
callout:
  kind: key-idea
  title: Nguyên tắc lựa chọn
  vi: "Không có mẫu giao tiếp nào tối ưu cho mọi tình huống. Hãy tách phần kết quả người dùng cần biết ngay khỏi các tác vụ hậu kỳ có thể xử lý sau."
whatChanged:
  - "+ Chuỗi đặt hàng cơ bản ở 180 req/s: Client → API → Order → Email"
  - "~ Khi mọi dịch vụ khỏe mạnh, p99 toàn chuỗi chỉ khoảng 116 ms"
telemetry:
  - label: "Lưu lượng vào"
    value: "180 req/s"
  - label: "p99 bình thường"
    value: "≈ 116 ms"
    tone: ok
  - label: "Tỉ lệ lỗi"
    value: "0%"
    tone: ok
```

Sau khi xác định các thành phần của hệ thống, câu hỏi kiến trúc tiếp theo là các thành phần đó trao đổi thông tin với nhau theo cơ chế nào. Cách kết nối quyết định trực tiếp bốn thuộc tính vận hành:

- **Độ trễ cảm nhận:** người dùng phải chờ toàn bộ chuỗi hoàn tất hay nhận xác nhận sớm ngay khi bước cốt lõi xong.
- **Khả năng hấp thụ đỉnh tải:** lưu lượng tăng vọt sẽ dồn thẳng vào dịch vụ đích hay được giữ lại trong bộ đệm.
- **Độ tin cậy khi có lỗi:** một dịch vụ phụ gặp sự cố sẽ làm hỏng ngay yêu cầu chính hay được thử lại độc lập ở nền.
- **Mức gắn kết (Coupling):** dịch vụ gửi có bị phụ thuộc chặt vào tốc độ và trạng thái sống của dịch vụ nhận hay không.

Trong thiết kế hệ thống phân tán, ba mẫu phổ biến nhất là **Request-Response đồng bộ**, **Message Queue bất đồng bộ** và **Event-Driven (Pub/Sub)**.

## 2. Giao tiếp đồng bộ (Request-Response): đơn giản nhưng khóa luồng chờ

```step
category: MECHANISM
short: Gọi đồng bộ
scene: s2-sync
callout:
  kind: good-to-know
  title: Khi nào nên giữ đồng bộ
  vi: "Ưu tiên gọi đồng bộ khi người dùng không thể đi bước tiếp theo nếu thiếu kết quả (đăng nhập lấy token, tìm kiếm, trừ tồn kho) và thời gian xử lý ngắn."
whatChanged:
  - "+ Đánh dấu đường găng đồng bộ từ Client tới tận Email Service"
  - "~ Tổng thời gian phản hồi bằng tổng tuần tự mọi chặng trên chuỗi"
telemetry:
  - label: "API + Order"
    value: "8 + 18 ms"
    tone: ok
  - label: "Email Service"
    value: "25 ms (nền)"
    tone: ok
  - label: "p50 toàn chuỗi"
    value: "≈ 79 ms"
```

Với mẫu **Request-Response đồng bộ**, bên gọi gửi yêu cầu qua HTTP hoặc gRPC rồi giữ nguyên kết nối chờ tới khi bên nhận trả kết quả. Độ trễ đầu-cuối của một yêu cầu bằng tổng thời gian mạng và xử lý của tất cả các chặng nối tiếp.

| Tiêu chí | Điểm mạnh của đồng bộ | Hạn chế của đồng bộ |
|---|---|---|
| Luồng logic | Tuyến tính, dễ đọc log và gỡ lỗi | Chặn luồng xử lý suốt thời gian chờ |
| Phản hồi | Biết ngay thành công hay thất bại | Tác vụ dài dễ chạm ngưỡng Timeout |
| Phụ thuộc | Dễ bọc giao dịch nhất quán tức thì | Dịch vụ sau chậm kéo chậm toàn bộ dịch vụ trước |

Ví dụ hợp lý cho đồng bộ là luồng đăng nhập: kiểm tra mật khẩu từ Database mất 40 ms, ký JWT mất 5 ms, ghi nhật ký 15 ms; tổng khoảng 60 ms và trình duyệt bắt buộc phải có token mới mở được phiên làm việc.

## 3. Điểm yếu của chuỗi đồng bộ: dịch vụ cuối chậm kéo sập toàn đường đi

```step
category: PROBLEM
short: Nghẽn liên đới
scene: s3-sync-live
live: sync
activity: S1-02.A1
gate: optional
callout:
  kind: watch-out
  title: Cạn kiệt luồng vì phụ thuộc chậm
  vi: "Khi dịch vụ cuối chậm gấp 21 lần, các luồng trong pool bị giữ lâu hơn nên thông lượng tối đa sụt mạnh theo công thức μ = poolSize / S."
whatChanged:
  - "~ Tại t = 20 s, Email Service bị chậm thêm +500 ms (từ 25 ms lên 525 ms)"
  - "~ Năng lực Email Service tụt từ 600 xuống 80 req/s, ρ vọt lên 2,25"
telemetry:
  - label: "ρ Email (sau 20 s)"
    value: "2,25"
    tone: bad
  - label: "p99 toàn chuỗi"
    value: "> 1.500 ms"
    tone: bad
  - label: "Lỗi đơn hàng"
    value: "100% (từ t = 22 s)"
    tone: bad
```

Hãy quan sát mô phỏng trực tiếp chuỗi đặt hàng đồng bộ ở tải ổn định **180 req/s**: `Client → API Server → Order Service → Email Service`.

- **Trước giây 20:** `Email Service` mất trung bình 25 ms. Với `poolSize = 42` luồng xử lý đồng thời, giới hạn của pool là `42 / 0,025 = 1.680 req/s`, cao hơn năng lực CPU 600 req/s nên hệ thống phục vụ êm ở `ρ = 0,30` và `p99 ≈ 116 ms`.
- **Từ giây 20:** đối tác SMTP bên ngoài phản hồi chậm thêm **+500 ms**, đẩy thời gian mỗi lần gửi thư lên `S = 0,525 s`. Lúc này 42 luồng bị giữ chặt, làm thông lượng tối đa của `Email Service` tụt xuống `42 / 0,525 = 80 req/s`.
- **Hệ quả dây chuyền:** tải vào vẫn là 180 req/s nên `ρ = 180 / 80 = 2,25`. Hàng đợi chất đầy trước `Email Service`, kéo `p99` vượt Timeout 1.500 ms của `Order Service`. Người dùng đặt mua hàng thất bại hàng loạt chỉ vì khâu gửi email biên nhận bị nghẽn.

## 4. Giao tiếp bất đồng bộ với Message Queue: trả sớm mã 202 Accepted

```step
category: TECHNIQUE
short: Message Queue
scene: s4-async
sim: S1-02/async
callout:
  kind: technique
  title: Cắt phụ thuộc thời gian bằng hàng đợi
  vi: "Đặt Message Queue giữa Order Service và Email Worker giúp người dùng nhận xác nhận đơn ngay, còn việc gửi thư tách sang tiến trình nền."
whatChanged:
  - "+ Thêm Message Queue và Email Worker tách khỏi đường chờ của Client"
  - "~ Order Service đẩy thông điệp mất ~1,5 ms rồi trả ngay 202 Accepted"
telemetry:
  - label: "p50 phía Client"
    value: "{metrics.p50@10:0} ms"
    tone: ok
  - label: "p99 phía Client"
    value: "{metrics.p99@10:0} ms"
    tone: ok
  - label: "ρ của Worker"
    value: "{worker.rho@10:2}"
    tone: warn
```

Người mua cần biết đơn hàng đã giữ chỗ thành công, không cần nhìn màn hình quay tròn chờ máy chủ SMTP gửi thư. Mẫu **Message Queue** tách luồng thành hai nửa độc lập:

1. **Đường đồng bộ ngắn (Producer):** `Order Service` lưu đơn, ghi một thông điệp công việc vào `Message Queue` (chỉ tốn khoảng 1,5 ms) rồi trả ngay mã HTTP `202 Accepted` hoặc `201 Created` cho người dùng. Độ trễ `p99` phía Client giảm xuống còn khoảng **80 ms**.
2. **Đường xử lý nền (Consumer / Worker):** `Email Worker` chủ động kéo (`pull`) từng thông điệp từ hàng đợi theo đúng năng lực của mình, gọi `Email Service` và xác nhận hoàn tất (`ACK`).

Đánh đổi cần chấp nhận là **tính nhất quán cuối cùng (Eventual Consistency)**: đơn đã tạo xong nhưng vài giây hoặc vài chục giây sau người dùng mới nhận được email trong hộp thư.

## 5. Đối chiếu trực tiếp: Queue biến sự cố chậm thành backlog an toàn

```step
category: MECHANISM
short: Hấp thụ sự cố
scene: s5-async-live
live: async
callout:
  kind: key-idea
  title: Hàng đợi đệm thời gian, không tự sinh công suất
  vi: "Message Queue giữ trải nghiệm người dùng ổn định qua đợt nghẽn tạm thời, nhưng tổng năng lực Worker về dài hạn vẫn phải lớn hơn tốc độ đến trung bình."
whatChanged:
  - "~ Cùng sự cố chậm +500 ms từ t = 20 s đến t = 45 s trên nhánh gửi thư"
  - "~ Client giữ nguyên p99 ≈ 80 ms, lỗi 0%; Queue tích lũy rồi xả backlog"
telemetry:
  - label: "p99 Client (t = 35 s)"
    value: "≈ 80 ms"
    tone: ok
  - label: "Lỗi phía Client"
    value: "0%"
    tone: ok
  - label: "Backlog đỉnh (t = 45 s)"
    value: "≈ 2.017 việc"
    tone: warn
```

Chạy mô phỏng bất đồng bộ ở cùng mức tải **180 req/s** và cùng sự cố chậm **+500 ms** từ giây 20 đến giây 45 để thấy sự khác biệt định lượng:

- **Trải nghiệm người dùng không suy suyển:** `Order Service` chỉ nói chuyện với `Message Queue` nên `p99` phía Client giữ phẳng ở **80 ms** và tỉ lệ lỗi bằng **0%** suốt cả sự cố.
- **Sự cố chuyển thành backlog có kiểm soát:** trong 25 giây đối tác chậm, năng lực của 1 `Email Worker` giảm xuống dưới 180 req/s. Phần chênh lệch được giữ an toàn trong `Message Queue`, đạt đỉnh khoảng **2.017 công việc** ở giây 45.
- **Tự hồi phục hoặc mở rộng độc lập:** ngay khi đối tác hết chậm sau giây 45, Worker (năng lực 250 req/s > 180 req/s) tự rút dần backlog. Bạn cũng có thể kéo núm `Số Worker` lên 2 hoặc 3 để xả sạch hàng chờ ngay trong lúc đối tác đang chậm.

## 6. Giao nhận At-Least-Once và bắt buộc thiết kế Worker lũy đẳng

```step
category: TECHNIQUE
short: Idempotency
mode: code
callout:
  kind: watch-out
  title: At-Least-Once luôn đi kèm khả năng lặp tin
  vi: "Nếu Worker xử lý xong nhưng mất kết nối trước khi gửi ACK, Queue sẽ giao lại đúng thông điệp đó cho Worker khác. Không kiểm tra trùng sẽ gây thu tiền hoặc gửi thư hai lần."
whatChanged:
  - "+ Đối chiếu 3 mức bảo đảm giao nhận và mẫu mã kiểm tra khóa lũy đẳng"
telemetry:
  - label: "Mức phổ biến nhất"
    value: "At-Least-Once"
  - label: "Yêu cầu bắt buộc"
    value: "Idempotency Key"
    tone: warn
```

Các hệ thống hàng đợi cung cấp ba mức cam kết giao nhận: **At-Most-Once** (gửi tối đa một lần, có thể mất tin, chỉ hợp với log/metric phụ), **Exactly-Once** (đúng một lần, rất đắt và khó đạt xuyên hệ thống ngoài) và **At-Least-Once** (ít nhất một lần, không mất tin nhưng có thể giao lặp).

Vì thực tế hầu hết Queue dùng **At-Least-Once**, hàm xử lý của Worker bắt buộc phải **lũy đẳng (Idempotent)** — thực thi 1 lần hay 3 lần cùng một thông điệp đều ra đúng một trạng thái cuối:

```python
def send_order_receipt(job: dict, db, smtp_client) -> str:
    # Khóa lũy đẳng gắn cố định với mã đơn hàng và loại thông báo
    dedup_key = f"receipt:{job['order_id']}"

    # Ghi nhận khóa theo nguyên lý nguyên tử; nếu đã tồn tại thì bỏ qua an toàn
    inserted = db.execute_on_conflict_do_nothing(
        "INSERT INTO processed_jobs (dedup_key, created_at) VALUES (%s, NOW())",
        (dedup_key,),
    )
    if not inserted:
        return "duplicate-skipped"

    smtp_client.send(to=job["email"], subject=f"Xác nhận đơn #{job['order_id']}")
    return "sent"
```

## 7. Kiến trúc hướng sự kiện (Event-Driven): một sự kiện, nhiều bên đăng ký

```step
category: MECHANISM
short: Event-Driven
scene: s7-pubsub
callout:
  kind: compare
  title: Phân biệt Message Queue và Pub/Sub
  vi: "Message Queue chia một công việc cho đúng một Worker thực thi. Event Bus / Topic phát bản sao sự kiện cho mọi dịch vụ đăng ký quan tâm."
whatChanged:
  - "+ Order Service chỉ phát sự kiện order.created lên Event Bus"
  - "+ Email, Analytics và Loyalty độc lập đăng ký nhận bản sao sự kiện"
telemetry:
  - label: "Số lần Order phát"
    value: "1 sự kiện"
    tone: ok
  - label: "Số dịch vụ nhận"
    value: "3 dịch vụ độc lập"
```

Khi một hành động nghiệp vụ cần kích hoạt nhiều phản ứng khác nhau (gửi email, cộng điểm thưởng, cập nhật báo cáo doanh thu, huấn luyện gợi ý), việc để `Order Service` tự đẩy vào bốn hàng đợi riêng lẻ vẫn tạo sự phụ thuộc về mặt mã nguồn.

Kiến trúc **Event-Driven (Publish/Subscribe)** giải quyết bài toán mở rộng tính năng này:

- **Publisher (`Order Service`):** chỉ công bố sự kiện đã xảy ra (`order.created` kèm thông tin đơn) lên **Event Bus / Topic** mà không cần biết ai sẽ đọc.
- **Subscribers (`Email`, `Analytics`, `Loyalty`):** mỗi dịch vụ tự đăng ký nhận sự kiện và xử lý trên hàng chờ riêng. Khi cần thêm dịch vụ chống gian lận mới, đội phát triển chỉ cần đăng ký thêm một Subscriber mà không phải sửa hay triển khai lại `Order Service`.

Đổi lại, luồng sự kiện phân tán khó lần vết hơn chuỗi gọi trực tiếp nên cần gắn `trace_id` xuyên suốt mọi sự kiện và chỉ áp dụng khi thực sự có nhiều miền nghiệp vụ độc lập.

## 8. Ba sai lầm phổ biến khi kết hợp đồng bộ và bất đồng bộ

```step
category: PITFALL
short: Ba lỗi thiết kế
scene: s8-pitfalls
activity: S1-02.A2
gate: required
callout:
  kind: watch-out
  title: Luôn đặt giới hạn cho cả luồng chờ lẫn hàng đợi
  vi: "Lời gọi đồng bộ không có Timeout và hàng đợi không có Dead-Letter Queue đều dẫn tới cạn kiệt tài nguyên khi có lỗi bất thường."
whatChanged:
  - "~ Nhìn lại chuỗi đồng bộ lúc t = 32 s để xác định đúng nút gây nghẽn"
telemetry:
  - label: "Timeout khuyến nghị"
    value: "Bắt buộc mọi link sync"
    tone: warn
  - label: "Thông điệp lỗi lặp"
    value: "Đưa sang DLQ"
    tone: ok
```

Trong vận hành thực tế, ba lỗi thiết kế dưới đây thường biến một trục trặc nhỏ thành sự cố diện rộng:

1. **Nối chuỗi đồng bộ dài qua dịch vụ không thiết yếu:** đặt API bên thứ ba (gửi SMS, xuất PDF, đồng bộ CRM) ngay trong hàm xử lý HTTP của người dùng khiến cả độ trễ lẫn tỉ lệ lỗi nhân dồn theo mắt xích yếu nhất.
2. **Gọi đồng bộ không đặt `Timeout`:** nếu thiếu ngưỡng ngắt kết nối (ví dụ `timeout=2.0`), các socket treo sẽ giữ chặt toàn bộ worker pool của dịch vụ gọi cho tới khi máy chủ hết bộ nhớ hoặc kết nối.
3. **Thiếu `Exponential Backoff` và `Dead-Letter Queue (DLQ)` ở Worker:** một thông điệp hỏng định dạng (Poison Message) nếu cứ thất bại rồi được trả ngay về đầu hàng đợi sẽ lặp vô hạn và chiếm sạch CPU của cụm Worker. Cần giới hạn số lần thử lại (ví dụ tối đa 3–5 lần giãn cách lũy thừa) rồi tách sang DLQ để kiểm tra riêng.

## 9. Tóm tắt: khung 4 câu hỏi chọn mẫu giao tiếp

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
sim: S1-02/async
callout:
  kind: key-idea
  title: Quy tắc chọn nhanh
  vi: "Mặc định dùng đồng bộ cho luồng đọc và bước chốt trạng thái nhanh; chuyển sang Message Queue cho việc nặng hoặc dễ nghẽn; dùng Event-Driven khi nhiều dịch vụ độc lập cùng phản ứng với một sự kiện."
whatChanged:
  - "+ Tổng hợp bảng quyết định giữa Sync, Message Queue và Event-Driven"
telemetry:
  - label: "p99 chuỗi Sync (lỗi)"
    value: "{metrics.p99@10:0} ms khi tách Queue"
    tone: ok
  - label: "Chi phí cụm Async"
    value: "{metrics.costPerHour@10:2} USD/giờ"
```

Trước khi nối hai thành phần, hãy trả lời tuần tự bốn câu hỏi kiểm tra:

| Câu hỏi kiểm tra | Chọn mẫu nào |
|---|---|
| Người dùng có bắt buộc cần kết quả ngay để đi tiếp và tác vụ dưới vài trăm ms? | **Đồng bộ (Request-Response)** kèm `Timeout` rõ ràng |
| Tác vụ kéo dài nhiều giây, gọi đối tác hay biến động, hoặc cần đệm đỉnh tải? | **Bất đồng bộ qua Message Queue** + trả sớm `202 Accepted` |
| Cùng một sự kiện phát sinh nhưng có nhiều dịch vụ khác nhau cần tự phản ứng? | **Event-Driven (Pub/Sub)** để tách rời bên phát và bên nhận |
| Công việc chạy trên Queue / Event Bus có thể được giao lại khi mạng chập chờn? | Bắt buộc cài đặt **Idempotency Key** và **Dead-Letter Queue** |

Ghi nhớ bài học từ mô phỏng: khi `Email Service` chậm thêm 500 ms, chuỗi đồng bộ rơi xuống `0 req/s` thành công vì cạn pool 42 luồng, trong khi bản tách `Message Queue` giữ vững `p99 ≈ 80 ms` và không rớt đơn nào.
