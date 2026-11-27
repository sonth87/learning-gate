## 1. Vì sao cần bàn mô phỏng theo thời gian thay vì sơ đồ tĩnh?

```step
category: SETUP
short: Bàn mô phỏng
scene: s1-intro
callout:
  kind: key-idea
  title: Sơ đồ sống theo lưu lượng
  vi: "Cùng một sơ đồ kiến trúc có thể chạy êm ở 100 req/s nhưng quá tải ở 350 req/s. Mô phỏng theo thời gian giúp bạn thấy chính xác khoảnh khắc hệ thống đổi trạng thái."
whatChanged:
  - "+ Mô hình tối giản: Người dùng gửi request vào 1 App Service (μ = 300 req/s)"
  - "+ Kết nối cấu trúc sân khấu với biến thiên lưu lượng theo thời gian"
telemetry:
  - label: "Năng lực App Service (μ)"
    value: "300 req/s"
  - label: "Độ trễ xử lý gốc"
    value: "15 ms (+ 30 ms mạng)"
    tone: ok
```

Một bức vẽ tĩnh chỉ cho biết thành phần nào nối với thành phần nào, nhưng không cho biết chuyện gì xảy ra khi lưu lượng người dùng tăng gấp tám lần trong một phút.

Từ Phase 1 trở đi, các bài học sử dụng **bàn mô phỏng trực tiếp (`live-sim`)**. Để bạn làm quen trọn vẹn với từng đồng hồ đo mà không bị rối bởi nhiều tầng máy chủ, bài này dùng sơ đồ tối giản nhất: nhóm **Người dùng (`client`)** gửi request qua Internet (`RTT ≈ 30 ms`) tới một **App Service (`svc`)** duy nhất có năng lực xử lý tối đa **`μ = 300 req/s`** và thời gian xử lý cơ bản **`15 ms`**.

Trong kịch bản của bài, lưu lượng đầu vào `λ` tăng đều đặn từ `50 req/s` lên `400 req/s` trong `70 giây` (mỗi giây tăng đúng `5 req/s`), sau đó giữ ở `400 req/s` tới giây thứ `80`.

## 2. Đọc mức sử dụng ρ = λ / μ và màu trạng thái khối

```step
category: MECHANISM
short: Mức sử dụng ρ
scene: s2-rho
callout:
  kind: key-idea
  title: Ngưỡng ρ = 1,00 là ranh giới ổn định
  vi: "Khi ρ < 1, thành phần xử lý kịp lượng request đến; khi ρ ≥ 1, request đến nhanh hơn tốc độ xử lý nên hàng đợi tích luỹ mỗi giây."
whatChanged:
  - "+ Giải nghĩa tỷ số mức sử dụng ρ = λ / μ trên thanh tải của khối"
  - "+ Phân biệt 4 trạng thái vận hành: healthy, busy, saturated và overloaded"
telemetry:
  - label: "ρ ở 150 req/s (t = 20 s)"
    value: "0,50 (healthy)"
    tone: ok
  - label: "ρ ở 270 req/s (t = 44 s)"
    value: "0,90 (saturated)"
    tone: warn
  - label: "ρ ở 350 req/s (t = 60 s)"
    value: "1,17 (overloaded)"
    tone: bad
```

Con số quan trọng đầu tiên trên mọi khối thành phần là **mức sử dụng (Utilization)**:

$$\rho = \frac{\lambda}{\mu}$$

Trong đó `λ` (*lambda*) là số request đi vào thành phần mỗi giây, còn `μ` (*mu*) là số request tối đa thành phần đó xử lý được mỗi giây. Trên sân khấu, thanh phần trăm trên lưng khối hiển thị `loadPct = min(100%, ρ × 100%)` và khối tự chuyển qua bốn cấp trạng thái:

- **`healthy` (`ρ < 0,75`):** Còn nhiều dư địa năng lực; ở `t = 20 s` (`λ = 150 req/s`), `ρ = 150 / 300 = 0,50`.
- **`busy` (`0,75 ≤ ρ < 0,90`):** Bắt đầu bận; ở `t = 40 s` (`λ = 250 req/s`), `ρ ≈ 0,83`.
- **`saturated` (`0,90 ≤ ρ` mới chạm ngưỡng):** Bão hoà; ở `t = 44 s` (`λ = 270 req/s`), `ρ = 0,90`.
- **`overloaded` (`ρ ≥ 1,00` kéo dài kèm hàng đợi dồn):** Quá tải; phần dư `λ − μ` cộng dồn liên tục vào hàng đợi.

## 3. Đọc đồng hồ độ trễ: vì sao theo dõi p99 thay vì chỉ nhìn p50?

```step
category: MECHANISM
short: Đọc p50 và p99
scene: s3-latency
callout:
  kind: watch-out
  title: p99 cảnh báo sớm hơn p50 và tỉ lệ lỗi
  vi: "Khi ρ tăng từ 0,50 lên 0,97, độ trễ trung vị p50 tăng chậm nhưng độ trễ đuôi p99 tăng vọt gấp nhiều lần ngay cả khi chưa có request nào báo lỗi."
whatChanged:
  - "+ Đối chiếu p50 (trung vị) với p99 (1% request chậm nhất) theo mức bận ρ"
  - "~ Nhận diện đường cong khúc côn cầu (hockey-stick) khi ρ tiến gần 1"
telemetry:
  - label: "t = 20 s (ρ = 0,50)"
    value: "p50 ≈ 44 ms · p99 ≈ 75 ms"
    tone: ok
  - label: "t = 48 s (ρ = 0,97)"
    value: "p50 ≈ 99 ms · p99 ≈ 469 ms"
    tone: warn
  - label: "Trần chờ của Client"
    value: "1.500 ms"
```

Thanh telemetry phía trên sân khấu hiển thị độ trễ phân vị thay vì số trung bình cộng đơn thuần:

- **`p50` (Trung vị):** 50% số request hoàn thành nhanh hơn mốc này — phản ánh trải nghiệm của người dùng điển hình.
- **`p99` (Độ trễ đuôi — Tail Latency):** 99% số request nhanh hơn mốc này, còn 1% chậm nhất phải chịu độ trễ từ mức này trở lên. Với 300 req/s, mỗi giây luôn có 3 người dùng rơi vào nhóm 1% đó.

Độ trễ không tăng tuyến tính theo tải mà uốn cong dựng đứng khi `ρ` tiến sát `1,00`: ở `t = 30 s` (`ρ = 0,67`), `p50 ≈ 45 ms` và `p99 ≈ 92 ms`; nhưng tới `t = 48 s` (`ρ = 0,97`), `p99` đã vọt lên `≈ 469 ms` do các đợt request ngẫu nhiên phải xếp hàng chờ nhau, dù lúc này tỉ lệ lỗi vẫn bằng `0%`.

## 4. Đọc hạt tín hiệu (Packet) và hàng đợi dồn trên dây nối

```step
category: MECHANISM
short: Hạt và hàng đợi
scene: s4-packets
callout:
  kind: good-to-know
  title: Quy ước tỷ lệ hạt tín hiệu
  vi: "Mỗi chấm chuyển động đại diện cho một nhóm request theo tỷ lệ tự động (ví dụ 1 chấm = 10 req/s) để sân khấu luôn mượt và dễ đọc ở cả tải thấp lẫn tải hàng nghìn req/s."
whatChanged:
  - "+ Phân biệt màu hạt request, response, hàng đợi chờ và lỗi quá hạn trên dây nối"
  - "~ Quan sát đống hàng đợi tích tụ trước cửa vào App Service khi λ > μ"
telemetry:
  - label: "Hàng đợi ở t = 50 s"
    value: "Bắt đầu tích luỹ"
    tone: warn
  - label: "Hàng đợi ở t = 60 s"
    value: "≈ 253 request"
    tone: bad
  - label: "Tỉ lệ lỗi ở t = 70 s"
    value: "100% (quá hạn 1.500 ms)"
    tone: bad
```

Dọc theo dây nối `client-svc`, các tín hiệu trực quan cho bạn biết trạng thái dòng chảy tức thời mà chưa cần đọc bảng số:

- **Hạt đi xuôi (`request`) và đi ngược (`response`):** Cho thấy lưu lượng đang lưu thông hai chiều bình thường.
- **Đống hàng đợi (Queue Pile) trước khối:** Khi `λ` vượt `300 req/s` (sau giây `50`), mỗi giây dư ra `λ − 300` request chưa được phục vụ. Tới `t = 60 s` (`λ = 350 req/s`), hàng đợi tích luỹ khoảng `253 request`, làm thời gian nằm chờ trong hàng đợi tăng thêm hơn `800 ms`.
- **Dây nối chuyển đỏ (`danger`) và hạt quá hạn (`timeout`):** Khi thời gian chờ cộng thời gian xử lý chạm ngưỡng `clientTimeoutMs = 1.500 ms` (quanh `t = 60–70 s`), người dùng ngắt chờ và đồng hồ **Lỗi (`errorRate`)** nhảy vọt.

## 5. Thực hành quan sát trực tiếp: dự đoán thời điểm chạm ngưỡng ρ = 1

```step
category: TECHNIQUE
short: Tải 50 → 400
scene: s5-live-tour
live: tour
activity: S0-09.A1
gate: required
callout:
  kind: technique
  title: Tính trước rồi bấm chạy kiểm chứng
  vi: "Mô phỏng dừng sẵn ở giây 20 (λ = 150 req/s). Hãy dùng tốc độ tăng tải để tính thời điểm λ chạm μ = 300 req/s trước khi bấm Play xem đường cong p99 vọt lên."
whatChanged:
  - "+ Mở sân khấu live-sim với thanh thời gian, đồng hồ Lưu lượng, p99 và Lỗi"
  - "+ Tạm dừng ở t = 20 s để thực hành dự đoán mốc bão hoà"
telemetry:
  - label: "Lưu lượng tại t = 0 s"
    value: "50 req/s"
  - label: "Tốc độ tăng tải"
    value: "+5 req/s mỗi giây"
    tone: ok
  - label: "Năng lực μ của Service"
    value: "300 req/s"
    tone: warn
```

Trên sân khấu bên trái bây giờ là phiên chạy trực tiếp **`S0-09/ramp`**, được tạm dừng tại **`t = 20 s`**:

1. Nhìn lên thanh đồng hồ phía trên: **Lưu lượng** đang ở `150 req/s`, **`p99`** khoảng `75 ms` (xanh an toàn so với đường chuẩn SLO `250 ms`), **Lỗi** bằng `0%`.
2. Nhìn vào khối **`App Service`**: thanh tải mới ở mức `50%` (`ρ = 0,50`).
3. Biết lưu lượng bắt đầu từ `50 req/s` ở `t = 0 s` và tăng đều lên `400 req/s` ở `t = 70 s` (tức tăng `5 req/s` mỗi giây), hãy tính xem ở giây thứ mấy thì lưu lượng đến bằng đúng năng lực `μ = 300 req/s` (`ρ = 1,00`), nhập câu trả lời vào thẻ bài tập bên dưới rồi quan sát đoạn tua kiểm chứng.

## 6. Dùng Thanh tua, Núm tải, Núm Instance và Bảng chi tiết thực thể

```step
category: TECHNIQUE
short: Tua và tra cứu
scene: s6-inspector
live: explore
activity: S0-09.A2
gate: optional
callout:
  kind: technique
  title: Ba thao tác khám phá trên mọi bài live-sim
  vi: "1) Kéo thanh Timeline về trước/sau mốc sự cố; 2) Nhấn vào khối hoặc dây nối để mở Inspector đọc ρ, hàng đợi và What/How/Why; 3) Đổi núm cấu hình để xem đường cong hạ xuống."
whatChanged:
  - "+ Mở đầy đủ điều khiển: Timeline, LoadKnob, núm Số instance và Tracer"
  - "+ So sánh hành vi trước và sau khi nâng App Service lên 2 instance"
telemetry:
  - label: "1 instance ở 400 req/s"
    value: "ρ = 1,33 (quá tải)"
    tone: bad
  - label: "2 instance ở 400 req/s"
    value: "ρ = 0,67 (ổn định)"
    tone: ok
```

Ở bước này, toàn bộ bảng điều khiển của bàn mô phỏng đã được mở khoá để bạn tự do thử nghiệm:

- **Thanh tua thời gian (Timeline):** Kéo con trượt qua lại giữa `t = 20 s`, `t = 50 s` và `t = 65 s` để đối chiếu thời điểm `p99` vượt SLO `250 ms` (quanh `t = 46 s`) với thời điểm bắt đầu xuất hiện lỗi quá hạn (sau `t = 59 s`).
- **Bảng chi tiết thực thể (Inspector):** Nhấp trực tiếp vào khối **`App Service`** hoặc dây nối để xem các thông số thời gian thực (`ρ`, chiều dài hàng đợi, độ trễ tại nút) cùng phần giải thích *Là gì / Hoạt động thế nào / Tại sao*.
- **Núm cấu hình (`Số instance`) và `Tracer`:** Thử tăng `Số instance` của `App Service` từ `1` lên `2` (nâng tổng năng lực lên `600 req/s`): ngay cả ở đỉnh `400 req/s`, `ρ` giảm về `0,67` và hàng đợi biến mất. Bạn cũng có thể bấm nút chụp một gói tin (`Tracer`) để xem thanh thời gian từng chặng mạng, chờ hàng đợi và xử lý.

## 7. Giới hạn của mô phỏng: đúng xu hướng nhân quả, không thay số đo thật

```step
category: PITFALL
short: Đúng xu hướng
scene: s7-limits
callout:
  kind: watch-out
  title: Mô hình là bản đồ rút gọn
  vi: "Mô phỏng giúp hiểu rõ cơ chế hàng đợi, điểm nghẽn và khuếch đại lỗi, nhưng không bao giờ thay thế được việc đo benchmark và đọc APM trên hệ thống thực tế."
whatChanged:
  - "+ Làm rõ những gì mô phỏng phản ánh chính xác và những gì đã được lược giản"
telemetry:
  - label: "Phản ánh chính xác"
    value: "Quan hệ ρ, hàng đợi, p99"
    tone: ok
  - label: "Không thay thế"
    value: "Số đo Production thật"
    tone: warn
```

Trước khi sử dụng mô phỏng xuyên suốt khoá học, cần nắm rõ ranh giới trung thực của công cụ này:

- **Những gì mô phỏng làm đúng:** Bảo toàn dòng lưu lượng qua đồ thị thành phần, tái hiện chính xác hiện tượng độ trễ đuôi `p99` tăng vọt phi tuyến khi `ρ → 1`, sự tích luỹ hàng đợi khi `λ > μ`, hiệu ứng che chắn tải của Cache và hiện tượng thử lại (Retry) làm trầm trọng thêm quá tải.
- **Những gì mô phỏng lược giản:** Máy chủ ngoài đời thực còn chịu ảnh hưởng của thu gom rác bộ nhớ (GC pause), tranh chấp khoá dòng dữ liệu (Lock Contention), nhiễu láng giềng trên đám mây và phân phối kích thước gói tin không đồng nhất.

Vì vậy, hãy dùng các con số trong mô phỏng để **rèn phản xạ đọc tín hiệu và kiểm chứng xu hướng nhân quả**, còn khi vận hành hệ thống thật, luôn đo bằng công cụ quan sát thực tế.

## 8. Tóm tắt: quy trình 4 bước đọc mọi bài mô phỏng

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Sẵn sàng bước vào Phase 1
  vi: "Quan sát cấu trúc → So sánh λ với μ để tính ρ → Theo dõi p99 và hàng đợi trước khi lỗi nổ ra → Thử nghiệm núm chỉnh và kiểm tra lại trên Timeline."
whatChanged:
  - "+ Tổng kết quy trình 4 bước đọc mô phỏng và telemetry cho toàn khoá học"
telemetry:
  - label: "Tín hiệu cảnh báo sớm"
    value: "ρ → 1 & p99 vọt cao"
    tone: warn
  - label: "Chặng tiếp theo"
    value: "Phase 1: Định lượng nền tảng"
    tone: ok
```

Mỗi khi gặp một bài học có mô phỏng ở các chương tiếp theo, hãy áp dụng quy trình bốn bước:

1. **Đọc cấu trúc và năng lực gốc:** Nhấp vào các khối để biết đường đi của request và năng lực `μ` của từng thành phần.
2. **Theo dõi mức sử dụng `ρ = λ / μ`:** Thành phần nào tiến sát `ρ = 1,00` trước tiên chính là cổ chai giới hạn toàn hệ thống.
3. **Nhìn `p99` và hàng đợi làm tín hiệu báo trước:** Đừng đợi tới khi đồng hồ `errorRate` báo đỏ; khi `p99` tăng dựng đứng là hàng đợi đã bắt đầu dồn ứ.
4. **Tua lại và thử giả thuyết:** Dùng thanh Timeline tua về mốc chuyển trạng thái, chỉnh núm cấu hình và xác nhận cả `ρ`, `p99` lẫn chi phí đều nằm trong ngưỡng mục tiêu.
