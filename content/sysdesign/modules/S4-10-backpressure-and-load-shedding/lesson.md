## 1. Giới hạn của hàng đợi: hấp thụ đỉnh ngắn nhưng không tạo ra công suất

```step
category: SETUP
short: Ảo tưởng Queue
scene: s1-unbounded
callout:
  kind: key-idea
  title: Hàng đợi chỉ mượn thời gian của tương lai, không sinh thêm CPU
  vi: "Đặt hàng đợi giữa Producer nhanh và Consumer chậm giúp làm phẳng các đợt tăng vọt vài giây, nhưng nếu tải trung bình vượt năng lực tiêu thụ lâu dài thì tồn đọng sẽ tăng tới vô cùng."
whatChanged:
  - "+ Đường ống bất đồng bộ: API Producer (2.000/s) → Task Queue → Worker Consumer (1.000/s)"
  - "~ Chênh lệch λ − μ = 1.000 việc/giây tích tụ liên tục bên trong Task Queue"
telemetry:
  - label: "Tốc độ đẩy vào (λ)"
    value: "2.000 việc/s"
  - label: "Tốc độ tiêu thụ (μ)"
    value: "1.000 việc/s"
    tone: warn
  - label: "Tốc độ phình Queue"
    value: "+1.000 việc/s"
    tone: bad
```

Ở bài `S4-05`, **Rate Limiting** bảo vệ hệ thống trước sự lạm dụng từ từng khách hàng bên ngoài. Nhưng ngay cả khi mọi khách hàng đều tuân thủ hạn mức, hệ thống vẫn có thể rơi vào quá tải nội bộ: hàng nghìn người dùng hợp lệ cùng mua hàng, hoặc một tầng phía sau (`Worker Consumer`, `Database`) giảm một nửa thông lượng do ổ đĩa bận.

Nhiều đội ngũ đặt một **Hàng đợi không giới hạn (*Unbounded Queue*)** ở giữa với hy vọng không làm rớt request nào. Tuy nhiên, theo phương trình cân bằng dòng chảy, khi tốc độ đến $\lambda$ lớn hơn tốc độ xử lý $\mu$ trong khoảng thời gian $T$:

$$L(T) = (\lambda - \mu) \times T$$

Hàng đợi không tạo ra dù chỉ một đơn vị năng lực tính toán mới; nó chỉ tích luỹ phần việc dư thừa thành gánh nặng bộ nhớ và độ trễ ngày càng phình to.

## 2. Hai hệ quả của hàng đợi không giới hạn: tràn RAM và công việc quá hạn

```step
category: PROBLEM
short: Tuổi Backlog
scene: s2-backlog-age
callout:
  kind: watch-out
  title: Xử lý một request mà người dùng đã bỏ cuộc còn tệ hơn từ chối ngay từ đầu
  vi: "Khi thông điệp nằm trong hàng đợi 50 giây mới tới lượt, phía client đã hết hạn Timeout từ lâu, nhưng Worker vẫn tốn trọn CPU và I/O để chạy vô ích."
whatChanged:
  - "~ Ở giây thứ 50, tồn đọng đạt 50.000 thông điệp và tuổi chờ lên tới 50 giây"
  - "~ Toàn bộ năng lực Consumer bị đốt vào các tác vụ đã quá hạn chờ của người dùng"
telemetry:
  - label: "Tồn đọng tại t = 50 s"
    value: "≈ 50.000 việc"
    tone: bad
  - label: "Tuổi thông điệp cũ nhất"
    value: "≈ 50 giây"
    tone: bad
```

Để hàng đợi tăng tự do không giới hạn dẫn tới hai hậu quả dây chuyền nghiêm trọng:

1. **Cạn kiệt bộ nhớ (*Out-Of-Memory — OOM*):** mỗi phần tử trong hàng đợi giữ theo chuỗi JSON, ngữ cảnh request hoặc bộ đệm mạng. Khi tích luỹ hàng trăm nghìn phần tử, tiến trình `Broker` hoặc `API` chạm trần RAM, kích hoạt thu gom rác (*GC Pause*) liên tục rồi sập toàn bộ.
2. **Độ trễ leo thang và công việc vô ích (*Zombie Work*):** theo Định luật Little, thời gian một việc mới đến phải xếp hàng chờ là $W = L / \mu$. Ở giây thứ 50, tồn đọng $L = 50.000$ việc với $\mu = 1.000 \text{ việc/s}$ tạo ra độ trễ chờ **50 giây**. Nếu trình duyệt của khách có `Timeout = 10 s`, mọi kết quả mà Worker vất vả tính xong đều không còn ai nhận, thậm chí người dùng đã bấm tải lại làm lượng việc nhân đôi.

## 3. Hàng đợi có giới hạn (Bounded Queue) và cơ chế Phản áp lực (Back-pressure)

```step
category: MECHANISM
short: Bounded Queue
scene: s3-bounded
callout:
  kind: technique
  title: Định cỡ hàng đợi theo thời gian chờ tối đa chấp nhận được, không theo RAM trống
  vi: "Công thức thực tế: maxDepth = μ × W_max. Nếu Worker xử lý 1.000 việc/giây và nghiệp vụ chỉ chấp nhận chờ tối đa 1,5 giây thì maxDepth chỉ nên đặt là 1.500."
whatChanged:
  - "+ Đặt giới hạn cứng maxDepth = 1.500 để khóa trần thời gian nằm chờ ở 1,5 giây"
  - "+ Truyền tín hiệu Back-pressure ngược từ Consumer → Queue → API Producer"
telemetry:
  - label: "Quy tắc chọn maxDepth"
    value: "μ × W_tối_đa"
    tone: ok
  - label: "Phản hồi khi đầy"
    value: "HTTP 503 + Retry-After"
    tone: warn
```

**Back-pressure (Phản áp lực)** là cơ chế truyền tín hiệu nghẽn ngược chiều dòng dữ liệu (từ tầng tiêu thụ chậm về tầng sản xuất nhanh) để buộc phía gửi giảm tốc độ tương ứng với năng lực thực tế.

Nền tảng của Back-pressure là **mọi hàng đợi đều phải có kích thước hữu hạn (`maxDepth`)**:
- **Trong cùng tiến trình:** dùng kênh/hàng đợi giới hạn (như buffered channel trong Go, `ArrayBlockingQueue` trong Java) để luồng ghi tự tạm dừng khi đầy.
- **Giữa các dịch vụ luồng mạng:** dùng mô hình **Kéo theo tín dụng (*Pull / Credit-based*, như Reactive Streams, cửa sổ TCP hoặc `prefetch` của Consumer)**: Consumer chỉ cấp phép gửi thêm $k$ thông điệp sau khi đã xử lý xong $k$ thông điệp trước.
- **Ở biên HTTP đồng bộ:** khi Producer không còn khả năng đẩy tiếp xuống hàng đợi, nó lập tức trả mã `HTTP 503 Service Unavailable` kèm `Retry-After` thay vì ngâm kết nối.

## 4. Đo thông lượng bền vững trên đường ống có giới hạn

```step
category: TECHNIQUE
short: Đo trần ống
scene: s4-pipe-tune
activity: S4-10.A1
gate: optional
callout:
  kind: good-to-know
  title: Bounded Queue bảo vệ độ trễ, còn thông lượng vẫn thuộc về Consumer
  vi: "Khi giới hạn maxDepth = 1.500, hệ thống không còn phình bộ nhớ hay chờ 50 giây nữa, nhưng mọi phần lưu lượng vượt quá năng lực xả của Worker sẽ bị từ chối rõ ràng."
whatChanged:
  - "~ Cấu hình đường ống: 3 Worker Consumer (tổng μ = 1.500 việc/s) và maxDepth = 1.500"
telemetry:
  - label: "Năng lực API Producer"
    value: "3.600 req/s"
    tone: ok
  - label: "Sức chứa Queue"
    value: "1.500 ô"
  - label: "Năng lực 3 Worker"
    value: "1.500 việc/s"
    tone: warn
```

Đặt giới hạn `maxDepth = 1.500` giải quyết triệt để nguy cơ tràn RAM và giữ tuổi thông điệp trong ngưỡng vài giây. Tuy nhiên, cần hiểu rõ giới hạn thông lượng của đường ống này:

- Nếu một cụm tăng vọt ngắn kéo dài `1 giây` đẩy `2.500 việc` vào đường ống đang có `3 Worker` (`μ = 1.500 việc/s`), phần dư `1.000 việc` nằm gọn trong `1.500 ô` của hàng đợi và không mất việc nào.
- Nhưng nếu lưu lượng ổn định duy trì liên tục suốt nhiều chục giây cao hơn `1.500 việc/s`, `1.500 ô` đệm sẽ đầy kín và cơ chế Back-pressure bắt đầu từ chối phần vượt ngưỡng.

Hãy dùng thanh trượt tải trong bài tập dưới đây để kiểm chứng ngưỡng lưu lượng bền vững của đường ống.

## 5. Vấn đề của đánh rớt cào bằng và mô phỏng kết hợp cắt tải

```step
category: PROBLEM
short: Rớt cào bằng
scene: s5-live-overload
live: overload
callout:
  kind: watch-out
  title: Đầy hàng đợi mà không phân loại sẽ đánh rớt mất đơn hàng có giá trị cao
  vi: "Khi tổng tải 2.000 req/s dồn vào ống 1.000 req/s, nếu chỉ bật maxDepth = 1.500 thì 50% Đơn thanh toán P0 bị đánh rớt ngang bằng với 50% Sự kiện gợi ý P2."
whatChanged:
  - "~ Tổng tải 2.000 req/s gồm 800 req/s Đơn thanh toán (P0) và 1.200 req/s Sự kiện gợi ý (P2)"
  - "~ Chỉnh maxDepth = 1.500 và hạ Shedder xuống 150 rps ngay trên sân khấu trực tiếp"
```

Quan sát kịch bản trực tiếp trên sân khấu với `2 Worker` (`μ = 1.000 việc/s`) trước lưu lượng `2.000 req/s` (`800` đơn thanh toán **P0** + `1.200` sự kiện gợi ý **P2**):

1. **Mặc định (`maxDepth = 150.000`, `Shedder = 3.000`):** hàng đợi phình không phanh thêm `1.000 việc/giây`, tuổi thông điệp leo thẳng qua hàng chục giây.
2. **Chỉ giới hạn hàng đợi (`maxDepth = 1.500`, giữ nguyên `Shedder`):** độ trễ được kẹp gọn, nhưng hàng đợi đánh rớt ngẫu nhiên **50% mọi luồng** — tức chỉ `400/800` đơn thanh toán P0 thành công, thiệt hại trực tiếp tới doanh thu!
3. **Kết hợp cắt tải ưu tiên (`maxDepth = 1.500` và kéo `Low-priority admit rate` về `150 rps`):** `1.050 req/s` luồng P2 bị cắt gọn ngay cổng vào; tổng lượng vào hàng đợi còn $800 + 150 = 950 < 1.000 \text{ việc/s}$. Cả **100% đơn thanh toán P0** được xử lý tức thì với `Backlog = 0`!

## 6. Cắt tải chủ động theo độ ưu tiên (Priority Load Shedding)

```step
category: TECHNIQUE
short: Load Shedding
scene: s6-priority-shed
callout:
  kind: key-idea
  title: Khi không đủ công suất cho tất cả, hãy chủ động chọn thứ được giữ lại
  vi: "Load Shedding khác Rate Limiting ở mục tiêu: Rate Limiting giữ công bằng lúc bình thường, còn Load Shedding chủ động bỏ việc ít quan trọng lúc khẩn cấp để giữ vững luồng cốt lõi."
whatChanged:
  - "+ Gắn nhãn độ ưu tiên P0..P3 cho mọi request ngay từ rìa hệ thống"
  - "~ Cắt giảm dần từ P3 → P2 khi mức bận vượt ngưỡng, giữ nguyên 100% P0"
telemetry:
  - label: "Đơn thanh toán P0"
    value: "800 / 800 thành công (100%)"
    tone: ok
  - label: "Luồng gợi ý P2 giữ lại"
    value: "150 / 1.200 req/s"
    tone: warn
  - label: "Tồn đọng Queue"
    value: "0 thông điệp"
    tone: ok
```

**Load Shedding (Cắt tải)** là kỹ thuật chủ động từ chối một phần lưu lượng khi sức khoẻ nội bộ của chính máy chủ hoặc cụm phụ thuộc chạm ngưỡng nguy hiểm (CPU cao, hàng đợi đầy, độ trễ `p99` vọt tăng).

Để cắt tải thông minh thay vì đánh rớt mù quáng, các hệ thống lớn gắn **Nhãn ưu tiên (*Priority Tier*)** vào ngữ cảnh của từng request:

| Bậc ưu tiên | Ví dụ nghiệp vụ | Ngưỡng bắt đầu cắt tải |
|---|---|---|
| **P0 — Critical** | Thanh toán, xác nhận đơn, đăng nhập | Chỉ từ chối ở ngưỡng bảo vệ cứng `> 98%` |
| **P1 — Interactive** | Tìm kiếm, xem chi tiết sản phẩm | Cắt khi mức tải nội bộ vượt `92%` |
| **P2 — Best-effort** | Khối gợi ý cá nhân hoá, đếm lượt xem | Cắt dần khi mức tải vượt `82%` |
| **P3 — Background** | Đồng bộ báo cáo, tác vụ dọn dẹp | Tạm dừng đầu tiên ngay từ mức `75%` |

Nhờ suy giảm có kiểm soát (*Graceful Degradation*), người dùng có thể tạm thấy danh sách gợi ý mặc định nhưng luôn thanh toán thành công.

## 7. Quản lý hàng đợi nâng cao khi nghẽn: LIFO, CoDel và Adaptive Limit

```step
category: MECHANISM
short: LIFO & CoDel
scene: s7-lifo-codel
callout:
  kind: compare
  title: Dưới tải nghẽn kéo dài, hàng đợi FIFO có thể làm hỏng 100% request
  vi: "Trong FIFO, mọi request mới đều phải xếp sau toàn bộ đống tồn đọng cũ, nên từng request một tới lượt đều vừa kịp quá hạn Timeout của người gọi."
whatChanged:
  - "+ Đối chiếu FIFO truyền thống với LIFO, CoDel và giới hạn đồng thời thích ứng"
telemetry:
  - label: "Chỉ số cảnh báo chuẩn"
    value: "backlogAgeSec (tuổi chờ)"
    tone: ok
  - label: "Cơ chế lọc việc cũ"
    value: "CoDel / Queue TTL"
    tone: ok
```

Ngay bên trong một hàng đợi đã giới hạn kích thước, thứ tự lấy việc và quy tắc loại bỏ quyết định trực tiếp lượng **Goodput** thu được lúc quá tải:

- **Chuyển sang LIFO khi nghẽn (*Last-In, First-Out*):** phục vụ request vừa mới đến trước tiên giúp đa số request được trả lời ngay trong vài chục mili-giây; chỉ những phần tử nằm kẹt dưới đáy quá lâu mới bị huỷ theo thời gian hết hạn.
- **CoDel (*Controlled Delay*) và kiểm tra hạn chót khi lấy ra:** gắn dấu thời gian lúc đưa vào hàng đợi (`enqueuedAt`). Khi Worker lấy một việc ra mà thấy `now - enqueuedAt` đã vượt ngân sách chờ cho phép, Worker **bỏ qua ngay lập tức** không tốn CPU xử lý để lấy việc mới hơn.
- **Giới hạn đồng thời thích ứng (*Adaptive Concurrency Limit*):** thay vì đoán trước một con số tĩnh, dịch vụ liên tục so sánh độ trễ hiện tại với độ trễ nền lúc rảnh ($RTT_{\min}$); hễ tỷ số tăng lên là dấu hiệu hàng đợi bắt đầu hình thành, bộ điều khiển tự động thu hẹp số request chạy đồng thời.

## 8. Phân tích sự cố thực tế: bẫy HTTP 202 trên hàng đợi không giới hạn

```step
category: PITFALL
short: Sự cố OOM Queue
scene: s8-incident
activity: S4-10.A2
gate: required
callout:
  kind: watch-out
  title: Đừng dùng hàng đợi trong bộ nhớ làm thảm chùi chân giấu quá tải
  vi: "Trả ngay HTTP 202 Accepted rồi nhét việc vào mảng RAM không giới hạn giúp biểu đồ độ trễ API trông rất đẹp cho tới đúng giây toàn cụm sập vì hết bộ nhớ."
whatChanged:
  - "~ Tình huống sự cố: API trả 202 đẩy 2.400 việc/s vào Queue RAM khi Worker còn 900 việc/s"
  - "~ Hậu quả: 8 pod API bị OOMKilled sau 12 phút và đơn P0 kẹt sau hàng triệu log P2"
telemetry:
  - label: "Chênh lệch tích luỹ"
    value: "+1.500 việc/s vào RAM"
    tone: bad
  - label: "Hậu quả sau 12 phút"
    value: "OOM 32 GB · Mất việc"
    tone: bad
```

Một phản mẫu (*Anti-pattern*) rất phổ biến trong các dịch vụ web là tách tác vụ sang một hàng đợi nội bộ trong RAM (`goroutine channel`, `LinkedBlockingQueue`, mảng sự kiện Node.js/Python) không đặt giới hạn chiều sâu và trả về ngay `202 Accepted`.

Khi cơ sở dữ liệu phía sau chậm lại, hệ thống rơi vào bẫy kép:
1. Bảng điều khiển của tầng API vẫn báo độ trễ `5 ms` và `0%` lỗi nên không ai nhận được cảnh báo sớm, trong khi RAM phình đều đặn tới lúc hệ điều hành giết tiến trình (`OOMKilled`), xoá sạch mọi công việc đã hứa `202 Accepted`.
2. Việc quan trọng (thanh toán, đổi mật khẩu) nằm chung hàng đợi với việc phụ (ghi nhận lịch sử xem hàng), nên bị kẹt cứng phía sau hàng triệu thông điệp ưu tiên thấp.

Hãy hoàn thành bài phân tích sự cố bên dưới để chốt lại các biện pháp phòng vệ chuẩn.

## 9. Tóm tắt: phối hợp Rate Limiting, Back-pressure và Load Shedding

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba mảnh ghép kiểm soát tải bổ trợ nhau
  vi: "Rate Limiting giữ công bằng theo khách hàng ở rìa; Back-pressure kẹp chặt hàng đợi nội bộ; Load Shedding ưu tiên giữ trọn tính năng cốt lõi khi thiếu hụt công suất."
whatChanged:
  - "+ Tổng hợp vai trò của Bounded Queue, Back-pressure, Priority Shedding và CoDel"
telemetry:
  - label: "Kích thước hàng đợi"
    value: "Luôn hữu hạn (μ × W_max)"
    tone: ok
  - label: "Ưu tiên khi quá tải"
    value: "Bảo toàn 100% P0"
    tone: ok
```

Bốn nguyên tắc vận hành cần áp dụng cho mọi đường ống xử lý:

1. **Cấm tuyệt đối hàng đợi không giới hạn:** luôn đặt `maxDepth` dựa trên công thức $\mu \times W_{\max}$ để bảo vệ RAM và khoá trần thời gian chờ.
2. **Truyền phản áp lực (Back-pressure) trung thực:** dùng cơ chế kéo (*Pull / Credit*) giữa các tầng nội bộ và trả ngay `HTTP 503 + Retry-After` khi bộ đệm chạm ngưỡng thay vì che giấu quá tải.
3. **Cắt tải có phân biệt độ ưu tiên (Priority Load Shedding):** tách riêng hàng đợi hoặc ngưỡng nhận việc cho các bậc `P0..P3` để những tính năng cốt lõi vẫn đạt 100% ngay cả khi tổng lưu lượng vượt công suất thực.
4. **Đo tuổi thông điệp và huỷ việc quá hạn:** đặt cảnh báo theo `backlogAgeSec` (tuổi thông điệp cũ nhất) và loại bỏ sớm các tác vụ đã hết hạn chờ trước khi tốn tài nguyên xử lý.
