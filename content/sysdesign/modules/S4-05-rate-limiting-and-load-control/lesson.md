## 1. Bài toán Láng giềng ồn ào và vai trò của Rate Limiting ở cổng vào

```step
category: SETUP
short: Cổng bảo vệ
scene: s1-noisy-neighbor
callout:
  kind: key-idea
  title: Không hệ thống nào an toàn nếu tin rằng lưu lượng bên ngoài luôn ôn hoà
  vi: "Một vòng lặp lỗi phía client hoặc một script cào dữ liệu có thể chiếm sạch Connection Pool trong vài giây, kéo theo toàn bộ người dùng hợp lệ bị gián đoạn."
whatChanged:
  - "+ Mô hình cổng vào gồm Người dùng hợp lệ, Script cào dữ liệu, Limiter và Gateway"
  - "~ Khi chưa áp hạn mức, 3.300 req/s từ script đẩy Catalog API lên ρ = 2,75"
telemetry:
  - label: "Khách thật / Script"
    value: "1.100 / 3.300 req/s"
  - label: "Năng lực Catalog API"
    value: "1.600 req/s"
    tone: warn
  - label: "ρ của API khi tràn"
    value: "2,75"
    tone: bad
```

**Rate Limiting (Giới hạn tốc độ)** là cơ chế kiểm soát số lượng request mà một định danh (người dùng, khoá API, địa chỉ IP hoặc tổ chức) được phép gửi tới hệ thống trong một đơn vị thời gian.

Trong kiến trúc đa người dùng, thiếu Rate Limiting dẫn tới bốn rủi ro trực tiếp:
1. **Hiệu ứng Láng giềng ồn ào (*Noisy Neighbor*):** một script lỗi bắn hàng nghìn request mỗi giây làm tràn hàng đợi kết nối của ứng dụng và cơ sở dữ liệu, khiến mọi khách hàng khác bị Timeout.
2. **Thất thoát chi phí đám mây:** các dịch vụ tính tiền theo lượt gọi hoặc băng thông tăng vọt hoá đơn vì lưu lượng rác.
3. **Lạm dụng bảo mật:** tấn công dò mật khẩu (*Brute-force*), quét mã khuyến mãi hoặc cào toàn bộ kho dữ liệu.
4. **Mất công bằng tài nguyên:** gói miễn phí chiếm dụng phần công suất cam kết cho gói doanh nghiệp.

## 2. Mô phỏng chặn dòng lũ bằng Token Bucket để bảo vệ Goodput

```step
category: PROBLEM
short: Script tràn tải
scene: s2-live-flood
live: flood
activity: S4-05.A1
gate: optional
callout:
  kind: watch-out
  title: Nhìn Goodput của người dùng thật thay vì tổng số phản hồi 200
  vi: "Từ chối nhanh 3.140 req/s rác bằng mã HTTP 429 ở cổng vào (mất 0,3 ms) giúp giải phóng Catalog API để phục vụ trọn vẹn 100% người dùng hợp lệ."
whatChanged:
  - "~ Đợt tràn tải từ t = 12 s tới t = 48 s nâng tổng lưu lượng lên 4.400 req/s"
  - "~ Chỉnh núm ratePerSec về 160 rps để quan sát Goodput và p99 tự khôi phục"
```

Trên sân khấu trực tiếp, hệ thống nhận `1.100 req/s` từ **Người dùng hợp lệ** (25%) và `3.300 req/s` từ **Script cào dữ liệu** (75%) trong khoảng giây 15–48:

- **Khi chưa giới hạn (`ratePerSec = 5.000`):** cả `4.400 req/s` đi thẳng xuống `Catalog API` (`μ = 1.600 req/s`). Mức sử dụng vọt lên $\rho = 2,75$, hàng đợi tràn cứng khiến `p99` vượt `1.500 ms` và **Goodput** tụt sâu vì request chờ quá hạn.
- **Khi bật hạn mức (`ratePerSec = 160`, `burst = 60`):** `Token Bucket Limiter` cắt ngay `3.140 req/s` của script bằng phản hồi `HTTP 429` chỉ mất `0,3 ms`. Lưu lượng lọt vào `Catalog API` giảm về $1.100 + 160 = 1.260 \text{ req/s}$ ($\rho \approx 0,79$), `p99` hạ xuống quanh `68 ms` và toàn bộ `1.100 req/s` của người dùng thật đều thành công.

## 3. Cơ chế Token Bucket: tốc độ nạp dài hạn và sức chứa cụm ngắn hạn

```step
category: MECHANISM
short: Token Bucket
scene: s3-token-bucket
callout:
  kind: key-idea
  title: Hai tham số điều khiển hai thang thời gian khác nhau
  vi: "burst (B) cho phép người dùng mở ứng dụng tải liền một cụm vài chục tài nguyên cùng lúc; ratePerSec (R) khóa chặt tốc độ tiêu thụ trung bình dài hạn."
whatChanged:
  - "+ Minh hoạ trạng thái xô token qua 2 biến duy nhất: tokens và lastRefill"
telemetry:
  - label: "Bộ nhớ mỗi khoá"
    value: "O(1) (2 số thực)"
    tone: ok
  - label: "Thời gian kiểm tra"
    value: "O(1)"
    tone: ok
```

**Token Bucket** là thuật toán giới hạn tốc độ phổ biến nhất trên các API Gateway hiện đại nhờ tách bạch hai tham số vật lý rõ ràng:

- **Sức chứa xô (`burst` = $B$):** số token tối đa xô có thể tích trữ khi client đang nghỉ.
- **Tốc độ nạp (`ratePerSec` = $R$):** số token được rót thêm vào xô mỗi giây.

Khi một request đến tại thời điểm $t_{\text{now}}$, bộ giới hạn tính lượng token nạp bù kể từ lần kiểm tra trước ($t_{\text{last}}$) mà không cần tiến trình chạy ngầm định kỳ:

$$\text{tokens} = \min\bigl(B,\; \text{tokens} + (t_{\text{now}} - t_{\text{last}}) \times R\bigr)$$

Nếu $\text{tokens} \ge 1$, hệ thống trừ đi $1$ token và cho request đi tiếp; nếu $\text{tokens} < 1$, request bị từ chối ngay với mã `429`. Nhờ công thức lười (*lazy refill*) này, mỗi định danh chỉ tốn đúng hai con số trong bộ nhớ.

## 4. Phân biệt vai trò của burst và ratePerSec dưới tải duy trì

```step
category: TECHNIQUE
short: Đo ngưỡng xô
scene: s4-bucket-tune
activity: S4-05.A2
gate: required
callout:
  kind: good-to-know
  title: Burst không cộng thêm vào thông lượng bền vững
  vi: "Sức chứa xô B = 500 chỉ cho phép vay trước tối đa 500 request ở giây đầu tiên; nếu client tiếp tục gửi nhanh hơn R, lượng token vay hết ngay và tốc độ đầu ra bị khóa đúng bằng R."
whatChanged:
  - "~ Cấu hình Token Bucket cố định ở R = 1.800 token/s và B = 500 token"
  - "~ Tầng Catalog API phía sau có 2 instance (3.200 req/s) để cô lập giới hạn tại xô"
telemetry:
  - label: "Tốc độ nạp R"
    value: "1.800 token/s"
    tone: warn
  - label: "Sức chứa xô B"
    value: "500 token"
  - label: "Năng lực API phía sau"
    value: "3.200 req/s"
    tone: ok
```

Một nhầm lẫn thường gặp khi cấu hình API Gateway là cộng `ratePerSec` với `burst` rồi cho rằng hệ thống sẽ cho qua $R + B$ request mỗi giây lâu dài, hoặc ngược lại đặt `burst = 1` khiến trình duyệt vừa tải trang chủ (gửi song song 10 lời gọi GraphQL/REST hợp lệ) đã bị chặn oan.

Trong thời đoạn dài $T$ giây, tổng số request tối đa đi qua được một Token Bucket là:

$$N_{\max}(T) = B + R \times T \implies \text{Tốc độ trung bình} = R + \frac{B}{T}$$

Khi $T$ đủ lớn (ví dụ 30–60 giây), số hạng $B / T$ tiến sát `0` và thông lượng bền vững bằng đúng $R$. Hãy kiểm chứng quy luật này bằng cách tìm ngưỡng tải bền vững trong bài thực hành bên dưới.

## 5. So sánh 5 thuật toán: Fixed Window, Sliding Log, Sliding Counter và Leaky Bucket

```step
category: MECHANISM
short: So 5 thuật toán
scene: s5-algorithms
callout:
  kind: compare
  title: Chọn Token Bucket cho cổng vào API, Leaky Bucket khi cần làm phẳng dòng ra
  vi: "Token Bucket cho phép cụm burst hợp lệ đi qua nhanh khi còn token, còn Leaky Bucket xếp hàng và nhỏ giọt ra ngoài với tốc độ cố định không có đỉnh nhọn."
whatChanged:
  - "+ Đối chiếu hành vi ranh giới cửa sổ, bộ nhớ và độ mượt của 5 thuật toán"
telemetry:
  - label: "Lỗi mép Fixed Window"
    value: "Lọt tới 2× hạn mức"
    tone: warn
  - label: "Bộ nhớ Sliding Counter"
    value: "O(1) (2 ô đếm)"
    tone: ok
```

Ngoài Token Bucket, bốn thuật toán khác giải quyết những bài toán cụ thể:

| Thuật toán | Bộ nhớ / khoá | Đặc điểm cốt lõi | Tình huống sử dụng |
|---|---|---|---|
| **Fixed Window Counter** | $O(1)$ | Chia thời gian thành ô cố định (vd mỗi phút); dễ bị lọt **gấp đôi hạn mức** nếu client dồn tải ở giây `00:59` và `01:00` | Bộ đếm thống kê thô theo ngày/tháng |
| **Sliding Window Log** | $O(N)$ | Giữ danh sách timestamp mọi request trong cửa sổ trượt; chính xác tuyệt đối nhưng tốn RAM khi hạn mức lớn | Thao tác nhạy cảm tần suất thấp (đổi mật khẩu, OTP) |
| **Sliding Window Counter** | $O(1)$ | Lấy số đếm ô hiện tại cộng phần trăm trọng số của ô liền trước; khử đỉnh nhọn mép cửa sổ với bộ nhớ tối thiểu | Hạn mức API theo phút/giờ quy mô lớn |
| **Leaky Bucket** | $O(B)$ | Đưa request vào hàng đợi FIFO và xả ra với nhịp cố định đều đặn | Điều tiết tốc độ gọi sang cổng thanh toán/đối tác bên ngoài |

## 6. Bộ đếm phân tán trên nhiều API Gateway và lỗi tranh chấp (Race Condition)

```step
category: PITFALL
short: Đếm phân tán
scene: s6-distributed
callout:
  kind: watch-out
  title: Hai lỗi kinh điển khi mở rộng ngang tầng API Gateway
  vi: "Giữ bộ đếm riêng trong RAM từng Gateway làm hạn mức bị nhân lên N lần; còn tách rời lệnh GET rồi mới INCR trên Redis gây Race Condition dưới tải đồng thời."
whatChanged:
  - "+ Đồng bộ trạng thái xô token của cả 2 Gateway vào cụm Redis tập trung"
  - "+ Gộp toàn bộ bước đọc, nạp bù và trừ token vào một Lua Script nguyên tử"
telemetry:
  - label: "Độ lệch nếu đếm cục bộ"
    value: "N × hạn mức"
    tone: bad
  - label: "Đồng bộ chuẩn"
    value: "Redis + Lua nguyên tử"
    tone: ok
```

Khi hệ thống chạy $N$ máy `API Gateway` sau Load Balancer (Round-robin), nếu mỗi máy tự đếm trong RAM cục bộ, một client có hạn mức `100 req/phút` sẽ gửi lọt $100 \times N$ request. Do đó, trạng thái giới hạn phải đặt trên kho tốc độ cao dùng chung như **Redis**.

Tuy nhiên, nếu ứng dụng đọc `GET` số đếm về máy chủ, kiểm tra nhỏ hơn hạn mức rồi mới gửi lệnh `INCR`, hai chục luồng đồng thời cùng đọc thấy `99 < 100` sẽ cùng cho qua. Giải pháp chuẩn là gói trọn phép **đọc – tính token nạp bù – trừ token – ghi lại** vào một **Redis Lua Script** để Redis thực thi tuần tự nguyên tử trong dưới `1 ms`.

Với những khoá siêu nóng hàng trăm nghìn req/s, Gateway có thể kết hợp **xin cấp phát token theo lô nhỏ** (ví dụ lấy 20 token vào bộ đệm cục bộ dùng trong `100 ms`) và quy định rõ chính sách **Fail-open** (cho qua tạm thời nếu Redis mất kết nối để không làm gián đoạn giao dịch chính).

## 7. Cài đặt thực tế: Redis Lua Token Bucket và bộ Header phản hồi HTTP 429

```step
category: REAL_CODE
short: Lua & HTTP 429
mode: code
callout:
  kind: technique
  title: Luôn trả kèm Retry-After để ngăn client thử lại mù quáng
  vi: "Trả mã 429 mà thiếu Retry-After khiến nhiều SDK lập tức gửi lại ngay, vô tình biến thông báo từ chối thành đợt dội tải mới vào chính Gateway."
whatChanged:
  - "+ Cài đặt Lua Script nguyên tử trả về đồng thời quyết định cho phép và số token còn dư"
  - "+ Gắn bộ Header chuẩn RateLimit-* và Retry-After trên phản hồi HTTP"
```

Đoạn mã Lua chạy trực tiếp trên Redis dưới đây cập nhật Token Bucket nguyên tử và trả về cả số giây cần chờ khi hết token:

```lua
-- KEYS[1]: rate:tenant_42 | ARGV: [burst, ratePerSec, nowMs, requested]
local burst = tonumber(ARGV[1])
local rate  = tonumber(ARGV[2])
local now   = tonumber(ARGV[3])
local cost  = tonumber(ARGV[4])

local data = redis.call("HMGET", KEYS[1], "tokens", "ts")
local tokens = tonumber(data[1]) or burst
local lastTs = tonumber(data[2]) or now

local elapsedSec = math.max(0, now - lastTs) / 1000.0
tokens = math.min(burst, tokens + elapsedSec * rate)

if tokens >= cost then
  tokens = tokens - cost
  redis.call("HSET", KEYS[1], "tokens", tokens, "ts", now)
  redis.call("PEXPIRE", KEYS[1], math.ceil((burst / rate) * 2000))
  return {1, math.floor(tokens), 0}
end

local waitSec = math.ceil((cost - tokens) / rate)
redis.call("HSET", KEYS[1], "tokens", tokens, "ts", now)
return {0, 0, waitSec}
```

Khi phần tử đầu trả về `0`, API Gateway phản hồi mã `HTTP 429 Too Many Requests` kèm các trường Header minh bạch để phía gọi chủ động đặt lịch chờ:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 160
RateLimit-Remaining: 0
RateLimit-Reset: 1
Retry-After: 1
```

## 8. Phân tầng hạn mức theo khách hàng (Multi-tenant) và điểm áp dụng

```step
category: TECHNIQUE
short: Đa mức Quota
scene: s8-multi-tenant
callout:
  kind: key-idea
  title: Ghép nhiều khoá giới hạn từ ngoài vào trong
  vi: "Một tổ chức doanh nghiệp có 10.000 nhân viên dùng chung một IP văn phòng sẽ bị khoá nhầm nếu hệ thống chỉ giới hạn thô theo địa chỉ IP."
whatChanged:
  - "+ Áp dụng 3 lớp hạn mức: theo Tenant gói cước, theo API Key và trần Toàn cục"
telemetry:
  - label: "Khoá nhận diện ưu tiên"
    value: "API Key / Tenant ID"
    tone: ok
  - label: "Khoá cho khách ẩn danh"
    value: "IP + Đường dẫn nhạy cảm"
```

Trong hệ thống SaaS thực tế, một quy tắc đơn lẻ không bao giờ đủ. Kiến trúc chuẩn lồng ghép **ba tầng hạn mức**:

1. **Theo gói thuê bao của tổ chức (*Per-Tenant Tier*):** ví dụ gói `Free` tối đa `20 req/s`, gói `Pro` `500 req/s`, gói `Enterprise` `5.000 req/s` gắn với `tenant_id` trong JWT hoặc API Key. Tránh dùng IP đơn thuần cho lưu lượng đã xác thực vì nhiều người dùng doanh nghiệp đi qua chung một cổng `NAT` văn phòng hoặc mạng di động `CGNAT`.
2. **Theo người dùng hoặc loại thao tác (*Per-User / Endpoint*):** giới hạn chặt riêng cho các API tốn tài nguyên (xuất báo cáo, tìm kiếm toàn văn, gửi mã xác thực: `5 lần/phút`).
3. **Trần bảo vệ toàn cục (*Global Safety Cap*):** ngay cả khi hàng nghìn khách hàng hợp lệ cùng tăng đột biến vượt tổng công suất thực của cụm backend, một trần bảo vệ tổng sẽ kích hoạt cơ chế cắt tải theo độ ưu tiên (sẽ học tiếp ở bài `S4-10`).

## 9. Tóm tắt: thiết kế lớp kiểm soát tốc độ đầu vào bền vững

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Nguyên lý cốt lõi của Rate Limiting
  vi: "Chặn lạm dụng càng gần rìa mạng càng rẻ, tách rõ burst và ratePerSec, đồng bộ nguyên tử khi phân tán và hướng dẫn client lùi nhịp bằng Retry-After."
whatChanged:
  - "+ Tổng kết quy trình lựa chọn thuật toán, lưu trữ trạng thái và giao thức phản hồi"
telemetry:
  - label: "Thuật toán mặc định"
    value: "Token Bucket (O(1))"
    tone: ok
  - label: "Đồng bộ đa Gateway"
    value: "Redis Lua Script"
    tone: ok
```

Bốn quyết sách kiến trúc cần nắm vững khi triển khai Rate Limiting:

1. **Đặt ở ngay cổng vào (Edge / API Gateway):** loại bỏ lưu lượng vượt hạn mức trong dưới một mili-giây trước khi tốn luồng ứng dụng hay kết nối cơ sở dữ liệu, giữ vững Goodput cho người dùng hợp lệ.
2. **Hiểu đúng tham số thuật toán:** dùng **Token Bucket** khi cần vừa chấp nhận cụm thao tác ngắn hạn (`burst`) vừa ghim chặt thông lượng trung bình (`ratePerSec`); dùng **Sliding Window Counter** cho hạn mức cửa sổ ít bộ nhớ và **Leaky Bucket** khi cần làm phẳng dòng gọi đi.
3. **Đồng bộ không tranh chấp:** lưu bộ đếm dùng chung trên cụm Redis qua **Lua Script nguyên tử**, kèm chính sách dự phòng rõ ràng nếu kho Redis gián đoạn.
4. **Hợp đồng giao tiếp chuẩn:** phân biệt khoá theo `Tenant ID / User ID` thay vì chỉ dựa vào IP, và luôn trả `HTTP 429` kèm `Retry-After` để phía client tự điều chỉnh nhịp gọi.
