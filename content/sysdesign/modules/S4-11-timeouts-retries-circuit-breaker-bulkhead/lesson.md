## 1. Gọi mạng thiếu Timeout và hiệu ứng cạn kiệt luồng (Thread Starvation)

```step
category: SETUP
short: Ngân sách chờ
scene: s1-timeout-hang
callout:
  kind: key-idea
  title: Mọi lời gọi qua mạng đều phải có hạn chót rõ ràng
  vi: "Một dịch vụ phụ thuộc ngừng hoạt động hẳn thường ít nguy hiểm hơn một dịch vụ phản hồi cực chậm: phản hồi chậm giam giữ toàn bộ luồng của bên gọi cho tới khi cạn sạch Pool."
whatChanged:
  - "+ Đường gọi đồng bộ từ Checkout Service (350 req/s) sang Payment Service"
  - "~ Khi Payment chậm từ 35 ms lên 415 ms, số luồng bị giữ đồng thời tăng gấp 12 lần"
telemetry:
  - label: "Độ trễ Payment bình thường"
    value: "35 ms"
    tone: ok
  - label: "Khi đối tác bị chậm"
    value: "415 ms"
    tone: bad
  - label: "Timeout mặc định trên link"
    value: "320 ms"
    tone: warn
```

Trong hệ phân tán, gửi một gói tin qua mạng không bao giờ đảm bảo sẽ nhận lại phản hồi kịp lúc. Nếu đặt **Timeout** quá dài (ví dụ mặc định `30–60 giây` của nhiều thư viện HTTP) hoặc bỏ trống không đặt, một dịch vụ phía dưới bị chậm sẽ kéo sập dây chuyền bên gọi theo Định luật Little ($L = \lambda \times W$):

- Ở trạng thái bình thường (`λ = 350 req/s`, `W = 0,035 s`), `Checkout Service` chỉ giữ trung bình $350 \times 0,035 \approx 13$ kết nối đang mở.
- Nếu `Payment Service` bị treo `10 giây` mỗi lượt gọi, cần tới $350 \times 10 = 3.500$ luồng đồng thời — làm cạn sạch Thread Pool chỉ trong tích tắc!

Thực hành chuẩn tách rõ **Connect Timeout** (ngắn, khoảng `100–500 ms` để bắt tay TCP) và **Request/Read Timeout** (đặt nhỉnh hơn phân vị đuôi `p99.9` lúc khoẻ mạnh, ví dụ `300–500 ms`).

## 2. Bão thử lại (Retry Storm) và trạng thái kẹt giả bền (Metastable Failure)

```step
category: PROBLEM
short: Bão Retry ×4
scene: s2-live-storm
live: retry-storm
activity: S4-11.A1
gate: optional
callout:
  kind: watch-out
  title: Retry tức thì biến sự cố thoáng qua 14 giây thành quá tải vĩnh viễn
  vi: "Khi Payment đang quá tải mà mỗi lượt lỗi lập tức gọi bồi thêm 3 lần nữa, lưu lượng tăng gấp 4–6 lần khiến hàng đợi không bao giờ xả được ngay cả khi nguyên nhân gốc đã hết."
whatChanged:
  - "~ t = 12..26 s: Payment chậm tạm thời +380 ms trong 14 giây rồi tự hết"
  - "~ Cấu hình retry max = 3, backoff = none làm tải vào Payment vọt lên 2.100 req/s"
```

**Thử lại (Retry)** rất hiệu quả với các lỗi rớt gói thoáng qua đơn lẻ, nhưng trở thành chất xúc tác gây sập hệ thống khi dịch vụ đích đang quá tải.

Quan sát mô phỏng trực tiếp trên sân khấu với tải gốc `350 req/s` vào `Payment Service` (`μ = 500 req/s`):
- **t = 0..12 s:** `Payment` chạy ổn định ở $\rho = 0,70$, tỷ lệ lỗi `0%`.
- **t = 12..26 s:** một đợt nghẽn tạm thời cộng thêm `380 ms` làm các lượt gọi chạm ngưỡng `timeoutMs = 320 ms`. Vì `checkout-payment` cấu hình `retry: { max: 3, backoff: "none" }`, mỗi request quá hạn lập tức sinh thêm tới 3 lần gọi mới, đẩy lưu lượng đập vào `Payment` vọt lên `1.400 – 2.100 req/s` (**gấp 4 đến 6 lần** tải gốc) và chất đầy hàng đợi `2.500` phần tử!
- **Sau t = 26 s:** dù sự cố chậm ở `Payment` đã chấm dứt hoàn toàn, đống hàng đợi `2.500` phần tử tiếp tục làm mọi request mới bị Timeout và tiếp tục đẻ thêm Retry — khoá chặt hệ thống trong **trạng thái lỗi giả bền (*Metastable State*)** không thể tự thoát ra!

## 3. Ba chốt hãm Retry: Exponential Backoff, Full Jitter và Retry Budget

```step
category: TECHNIQUE
short: Backoff+Jitter
scene: s3-jitter
callout:
  kind: key-idea
  title: Retry Budget khóa cứng trần khuếch đại tải ở mức ≤ 10%
  vi: "Thay vì cho phép mọi request thất bại đều nhân 3 lần gọi, một xô ngân sách 10% chỉ cho phép tổng lưu lượng thử lại tối đa bằng 0,1 lần lưu lượng gốc."
whatChanged:
  - "+ Tăng thời gian chờ luỹ thừa kèm ngẫu nhiên hoá Full Jitter trong đoạn [0, d_k]"
  - "+ Đặt budgetRatio = 0,1 để tự động ngưng Retry khi lỗi xảy ra trên diện rộng"
telemetry:
  - label: "Công thức Full Jitter"
    value: "random(0, min(cap, B0 · 2^(k−1)))"
  - label: "Trần khuếch đại với Budget 10%"
    value: "≤ ×1,10 tải gốc"
    tone: ok
```

Để thử lại an toàn mà không bao giờ châm ngòi bão Retry, cần kết hợp đồng thời bốn quy tắc:

1. **Exponential Backoff:** giãn khoảng chờ theo cấp số nhân sau mỗi lần thất bại thứ $k$: $d_k = \min(D_{\max}, B_0 \cdot 2^{k-1})$ (ví dụ `150 ms → 300 ms → 600 ms`).
2. **Full Jitter:** nếu 1.000 client cùng bị ngắt kết nối tại giây 12 và cùng đợi đúng `150 ms`, tất cả sẽ vẫn đập đồng loạt vào máy chủ ở `12,15 s`. Lấy ngẫu nhiên đều $t_{\text{sleep}} \sim \text{Uniform}(0, d_k)$ giúp tán mỏng đám đông đều khắp trục thời gian.
3. **Retry Budget (`budgetRatio = 0.1`):** mỗi client/dịch vụ duy trì một tỷ lệ ngân sách tối đa `10%` lưu lượng thử lại so với lưu lượng gốc. Khi lỗi hiếm (`< 1%`) thì 100% lỗi đều được thử lại; khi dịch vụ dưới sập hàng loạt thì ngân sách cạn ngay, chặn đứng hệ số khuếch đại ở `×1,1` thay vì `×4`.
4. **Chỉ Retry ở đúng một tầng:** nếu Mobile App thử 3 lần, Gateway thử 3 lần và Service thử 3 lần, một thao tác của khách sẽ nhân thành $3 \times 3 \times 3 = 27$ lượt gọi xuống tầng cuối!

## 4. Circuit Breaker: ngắt mạch nhanh và tự thăm dò hồi phục

```step
category: MECHANISM
short: Circuit Breaker
scene: s4-breaker
callout:
  kind: technique
  title: Thất bại trong dưới 1 ms thay vì giam luồng chờ hết 320 ms Timeout
  vi: "Khi biết chắc dịch vụ phía dưới đang hỏng nặng, tiếp tục gửi request chỉ làm tốn luồng bên gọi và cản trở bên nhận xả hàng đợi."
whatChanged:
  - "+ Vận hành vòng khép kín 3 trạng thái: Closed → Open → Half-Open → Closed"
telemetry:
  - label: "Ngưỡng mở mạch (Open)"
    value: "Lỗi ≥ 45% trong 2 s"
    tone: warn
  - label: "Độ trễ khi mạch đang Open"
    value: "< 1 ms (Fail-fast)"
    tone: ok
```

**Circuit Breaker (Cầu dao ngắt mạch)** đặt trên đường gọi sang phụ thuộc bên ngoài, hoạt động như một máy trạng thái tự động gồm ba pha:

- **Closed (Đóng — Bình thường):** cho các request đi qua và liên tục cập nhật trung bình trượt tỷ lệ lỗi/Timeout trong cửa sổ `windowSec` (chỉ tính khi lưu lượng vượt mức tối thiểu `minRps` để tránh nhảy mạch nhầm lúc đêm vắng).
- **Open (Mở — Ngắt mạch):** ngay khi tỷ lệ lỗi chạm ngưỡng `errorThreshold` (ví dụ `45%`), cầu dao bật sang `Open` trong `openSec` giây. Mọi lượt gọi mới được từ chối tức thì tại chỗ trong `< 1 ms` (hoặc chuyển sang phương án dự phòng *Fallback* như xếp hàng thanh toán sau), vừa giải phóng luồng cho `Checkout` vừa tạo khoảng lặng hoàn toàn để `Payment` xả sạch hàng đợi tồn đọng.
- **Half-Open (Mở hé — Thăm dò):** hết `openSec`, cầu dao chỉ cho một lưu lượng nhỏ `probeRps` đi qua kiểm tra; nếu tỷ lệ thành công đạt `closeAfterOk` (`80%`) thì đóng mạch trở lại `Closed`, ngược lại lập tức ngắt về `Open`.

## 5. Truyền hạn chót (Deadline Propagation) và Huỷ công việc quá hạn

```step
category: TECHNIQUE
short: Deadline Cancel
scene: s5-deadline
callout:
  kind: watch-out
  title: Bên gọi đã bỏ cuộc không có nghĩa bên nhận tự động dừng chạy
  vi: "Nếu Checkout ngắt chờ ở 320 ms nhưng không gửi tín hiệu huỷ kèm hạn chót, Payment vẫn lấy yêu cầu đó từ hàng đợi ra đốt CPU rồi trả về một kết nối đã đóng."
whatChanged:
  - "+ Đính kèm hạn chót tuyệt đối (Deadline) xuyên qua chuỗi gọi dịch vụ"
  - "+ Bật cancelOnTimeout = true để dọn bỏ ngay các yêu cầu quá hạn tại Payment"
telemetry:
  - label: "Cơ chế giao thức"
    value: "gRPC Deadline / Context Cancel"
    tone: ok
  - label: "Tác dụng tại hàng đợi đích"
    value: "Loại bỏ việc quá hạn"
    tone: ok
```

Timeout phía người gọi mới giải quyết được một nửa bài toán. Nếu trình duyệt có hạn chót tổng `1.000 ms`, tầng `API Gateway` đã mất `100 ms`, `Checkout` mất `200 ms`, rồi `Checkout` lại gọi tiếp xuống `Payment` với một bộ đếm Timeout mới toanh `1.000 ms` và không huỷ kết nối khi quá hạn, tầng dưới sẽ lãng phí tài nguyên cho những kết quả chắc chắn bị vứt bỏ.

Hai kỹ thuật bắt buộc đi đôi với Timeout:
1. **Truyền hạn chót (*Deadline Propagation*):** thay vì đặt Timeout tĩnh độc lập ở từng chặng, truyền một mốc thời gian hết hạn tuyệt đối (như header `grpc-timeout` trong gRPC hoặc ngữ cảnh `context.WithDeadline`). Mỗi chặng trừ lùi phần thời gian đã tiêu thụ; nếu thời gian còn lại $\le 0$ thì dừng ngay không gọi tiếp.
2. **Huỷ khi quá hạn (`cancelOnTimeout: true`):** phát tín hiệu đóng luồng (`RST_STREAM` trên HTTP/2, gRPC cancel) và kiểm tra hạn chót ngay lúc lấy khỏi hàng đợi ở phía nhận để cắt sạch công việc dư thừa.

## 6. Rủi ro thực thi trùng lặp khi Retry và khoá Idempotency Key

```step
category: PITFALL
short: Idempotency Key
scene: s6-idempotency
callout:
  kind: watch-out
  title: Trong mạng phân tán, lỗi Timeout có nghĩa là KHÔNG BIẾT kết quả
  vi: "Gói tin có thể rớt trên đường đi tới Payment (chưa trừ tiền), nhưng cũng có thể Payment đã trừ tiền xong rồi mới rớt gói tin trên đường quay về."
whatChanged:
  - "+ Đính kèm Idempotency-Key duy nhất theo mã đơn hàng trên mọi lần gọi ghi"
  - "+ Kiểm tra và ghi nhận kết quả nguyên tử bằng ràng buộc UNIQUE trong Database"
telemetry:
  - label: "Thao tác tự nhiên luỹ đẳng"
    value: "GET · PUT toàn phần · DELETE"
    tone: ok
  - label: "Bắt buộc có Idempotency-Key"
    value: "POST tạo đơn / trừ tiền"
    tone: warn
```

Trước khi bật Retry cho bất kỳ API nào, câu hỏi đầu tiên phải trả lời là: **thao tác này có luỹ đẳng (*Idempotent*) hay không?** Một thao tác được gọi là luỹ đẳng nếu thực hiện 1 lần hay $N$ lần với cùng tham số đều để lại trạng thái hệ thống y hệt nhau.

Đọc dữ liệu (`GET`) tự nhiên luỹ đẳng, nhưng lệnh trừ tiền `POST /payments/charge` thì không. Khi `Checkout` gặp `Timeout` ở mili-giây thứ 320, nó hoàn toàn không thể phân biệt được yêu cầu bị kẹt trước lúc trừ tiền hay đã trừ tiền thành công ở mili-giây 319.

Giải pháp chuẩn là **Idempotency Key**:
- Phía tạo yêu cầu sinh một mã định danh duy nhất gắn với ý định giao dịch (ví dụ `idem_key = order_88412_attempt`) và giữ nguyên mã này trong mọi lần Retry của cùng đơn đó.
- Dịch vụ `Payment` lưu `idem_key` có ràng buộc `UNIQUE` cùng một giao dịch cơ sở dữ liệu với bút toán trừ tiền: nếu gặp lại đúng `idem_key` đã hoàn tất, nó không trừ tiền lần hai mà trả lại ngay kết quả đã lưu trước đó.

## 7. Mẫu vách ngăn Bulkhead: cô lập sự cố không cho lan ngang toàn trang

```step
category: TECHNIQUE
short: Cô lập Bulkhead
scene: s7-bulkhead
callout:
  kind: key-idea
  title: Đừng để một phụ thuộc phụ làm chìm cả con tàu chính
  vi: "Tách riêng Thread Pool và Connection Pool cho từng dịch vụ phụ thuộc đảm bảo rằng tệ nhất cũng chỉ có đúng tính năng gắn với phụ thuộc đó bị suy giảm."
whatChanged:
  - "+ Phân tách rạch ròi Khoang Bulkhead Đọc (Catalog 65%) và Khoang Thanh toán (35%)"
  - "~ Khi Payment gặp sự cố, 100% khách xem hàng ở Catalog vẫn phản hồi trong ~25 ms"
telemetry:
  - label: "Khoang Catalog (65% tải)"
    value: "650 req/s · 0% lỗi"
    tone: ok
  - label: "Phạm vi ảnh hưởng tối đa"
    value: "Cô lập trong khoang 35%"
    tone: warn
```

Tên gọi **Bulkhead** mượn từ kết cấu các khoang kín nước độc lập trong thân tàu thuỷ: nếu mũi tàu va phải đá ngầm làm ngập một khoang, vách ngăn giữ cho nước không tràn sang các khoang còn lại nên con tàu vẫn nổi.

Trong kiến trúc phần mềm, nếu một ứng dụng dùng chung một Thread Pool 200 luồng cho cả `Tìm kiếm sản phẩm`, `Xem trang chủ` lẫn `Gọi đối tác xuất hoá đơn/thanh toán`, chỉ cần đối tác bên ngoài phản hồi chậm vài giây là cả 200 luồng sẽ bị hút cạn vào chặng gọi chậm đó — biến sự cố của một tính năng nhỏ thành sập toàn bộ website!

Triển khai **Bulkhead** ở hai cấp độ:
1. **Cấp luồng / Semaphore trong tiến trình:** cấp cho mỗi dịch vụ đích một Pool kết nối và giới hạn đồng thời riêng biệt (ví dụ tối đa 24 luồng được phép đợi `Payment`, phần còn lại vẫn phục vụ `Catalog`).
2. **Cấp dịch vụ / Cụm pod:** tách thành nhóm tiến trình riêng như `Catalog Pool` và `Checkout Service` trên sơ đồ của bài.

## 8. Thực hành dập bão Retry và khôi phục tự động trên đường gọi Payment

```step
category: TECHNIQUE
short: Dập bão Retry
scene: s8-fix-storm
activity: S4-11.A2
gate: required
callout:
  kind: technique
  title: Phối hợp đồng bộ cả 3 lớp trên cùng một đường nối
  vi: "Circuit Breaker giữ độ trễ thấp trong lúc đang lỗi; Retry Budget + Backoff + Jitter ngăn khuếch đại tải; cancelOnTimeout giữ sạch hàng đợi để phục hồi tức thì."
whatChanged:
  - "~ Bật cancelOnTimeout, Exponential Backoff + Full Jitter + Budget 10%"
  - "+ Bổ sung Circuit Breaker tự mở khi lỗi ≥ 45% và tự đóng lại sau khi thăm dò"
telemetry:
  - label: "p99 trong lúc mở mạch"
    value: "≈ 59 ms (Fail-fast)"
    tone: ok
  - label: "Tải vào Payment ở t = 45 s"
    value: "350 req/s (ρ = 0,70)"
    tone: ok
  - label: "Lỗi sau hồi phục (t ≥ 32 s)"
    value: "0,0%"
    tone: ok
```

Khi kết hợp đầy đủ các cơ chế phòng vệ trên đường nối `checkout-payment`, diễn biến của chính sự cố chậm 14 giây thay đổi hoàn toàn:

1. **Khi sự cố bắt đầu (t = 12 s):** tỷ lệ Timeout tăng vượt `45%`, `Circuit Breaker` chuyển sang trạng thái `Open` chỉ sau `2 giây`, từ chối nhanh để giữ `p99` toàn cục thấp quanh `59 ms` thay vì ngâm luồng quá `1.200 ms`.
2. **Trong suốt đợt chậm (t = 12..26 s):** `cancelOnTimeout: true` không cho phép yêu cầu quá hạn tích tụ trong hàng đợi của `Payment`, đồng thời `budgetRatio: 0.1` khóa cứng lượng thử lại tối đa 10%.
3. **Ngay khi Payment hết chậm (t > 26 s):** ở chu kỳ `Half-Open` kế tiếp, `30 req/s` thăm dò thành công 100%, cầu dao đóng lại về `Closed` và lưu lượng trở về đúng `350 req/s` ($\rho = 0,70$, `0%` lỗi) mà không cần bất kỳ can thiệp thủ công nào!

Hãy áp dụng cấu hình này trong bài thử thách bên dưới.

## 9. Phân tích sự cố thực tế: Retry chồng nhiều tầng làm khuếch đại tải luỹ thừa

```step
category: PITFALL
short: Retry đa tầng
scene: s9-postmortem
activity: S4-11.A3
gate: optional
callout:
  kind: watch-out
  title: Tích khuếch đại (1 + R_1)(1 + R_2)(1 + R_3) tăng theo hàm mũ
  vi: "Mỗi nhóm phát triển tự ý bật mặc định 2 lần thử lại ở thư viện của mình sẽ vô tình tạo ra hệ số nhân tải 3 × 3 × 3 = 27 lần đập thẳng vào cơ sở dữ liệu hoặc cổng thanh toán."
whatChanged:
  - "~ Tình huống sự cố: Retry chồng ở 3 lớp (App, Gateway, Service) nhân tải lên 27 lần"
  - "~ Chung Worker Pool làm liệt cả luồng Tìm kiếm và thiếu Idempotency-Key gây trừ tiền kép"
telemetry:
  - label: "3 tầng cùng đặt max = 2"
    value: "3 × 3 × 3 = 27 lượt gọi"
    tone: bad
  - label: "Quy tắc kiến trúc"
    value: "Chỉ Retry tại 1 tầng duy nhất"
    tone: ok
```

Trong các tổ chức nhiều đội ngũ, sự cố bão Retry nguy hiểm nhất thường sinh ra từ việc **cấu hình mặc định ẩn bên trong các SDK**: thư viện mạng trên di động tự thử lại 2 lần, proxy `API Gateway` mặc định thử lại 2 lần, và HTTP client trong `Checkout Service` cũng đặt thử lại 2 lần.

Khi tầng cuối bắt đầu chập chờn, một cái chạm tay duy nhất của người dùng bị nhân bản thành $3^3 = 27$ yêu cầu dội liên hoàn xuống dịch vụ đang yếu nhất, đi kèm nguy cơ trừ tiền nhiều lần nếu thiếu `Idempotency-Key` và làm tê liệt các API láng giềng nếu chưa tách khoang `Bulkhead`.

Hãy hoàn thành bài phân tích sự cố bên dưới để rà soát toàn bộ chuỗi phòng vệ này.

## 10. Tóm tắt: năm quy tắc gọi dịch vụ qua mạng an toàn

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Kỷ luật phòng vệ cho mọi lời gọi mạng đồng bộ
  vi: "Bỏ cuộc đúng hạn (Timeout + Cancel), thử lại có văn hoá (Backoff + Jitter + Budget + Idempotency), biết dừng hẳn khi hỏng nặng (Breaker) và khoá chặt phạm vi ảnh hưởng (Bulkhead)."
whatChanged:
  - "+ Tổng kết 5 lớp bảo vệ chống lỗi dây chuyền giữa các dịch vụ phân tán"
telemetry:
  - label: "Khuếch đại Retry an toàn"
    value: "≤ ×1,10 (Budget 10%)"
    tone: ok
  - label: "Cô lập phạm vi sự cố"
    value: "Bulkhead theo từng phụ thuộc"
    tone: ok
```

Năm quy tắc bắt buộc khi một dịch vụ gọi sang dịch vụ khác hoặc đối tác bên ngoài:

1. **Luôn đặt Timeout tường minh kèm huỷ việc quá hạn:** thiết lập cả Connect Timeout và Request Timeout theo phân vị đuôi thực tế, truyền hạn chót (*Deadline Propagation*) và bật `cancelOnTimeout` để không đốt CPU vào việc đã quá hạn.
2. **Thử lại có kỷ luật tại một tầng duy nhất:** kết hợp **Exponential Backoff**, **Full Jitter** và **Retry Budget (`≤ 10%`)** để sửa lỗi thoáng qua mà không bao giờ gây bão khuếch đại tải giả bền.
3. **Đảm bảo tính luỹ đẳng bằng Idempotency Key:** vì Timeout mang nghĩa chưa rõ kết quả, mọi thao tác ghi/thanh toán có Retry phải mang theo khoá khử trùng duy nhất.
4. **Ngắt mạch nhanh bằng Circuit Breaker:** tự động chuyển sang `Open` khi phụ thuộc lỗi hàng loạt để giải phóng luồng trong `< 1 ms`, cung cấp Fallback và thăm dò hồi phục qua `Half-Open`.
5. **Cô lập tài nguyên bằng Bulkhead:** tách riêng Thread Pool / Connection Pool cho từng phụ thuộc để sự cố ở một nhánh không bao giờ làm tê liệt phần còn lại của hệ thống.
