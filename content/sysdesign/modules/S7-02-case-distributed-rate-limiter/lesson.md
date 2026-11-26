## 1. Bẫy bộ đếm cục bộ trên nhiều API Gateway

```step
category: SETUP
short: Đếm cục bộ lệch
scene: s1-local-skew
callout:
  kind: watch-out
  title: Ngưỡng bị nhân theo số Gateway
  vi: "Nếu 3 API Gateway giữ bộ đếm riêng trong RAM, một client qua Load Balancer Round-robin có thể dùng gấp 3 lần hạn mức cho phép."
whatChanged:
  - "+ Đặt bài toán giới hạn 100 req/s trên cụm 3 API Gateway"
  - "~ Bộ đếm cục bộ làm Backend API nhận tải vượt ngưỡng"
telemetry:
  - label: "Số API Gateway"
    value: "3 máy"
  - label: "Độ lệch ngưỡng"
    value: "Gấp 3 lần"
    tone: bad
```

Khi hệ thống mở rộng ngang với nhiều API Gateway phía sau Load Balancer, việc đặt bộ đếm Rate Limiter cục bộ trong bộ nhớ của từng Gateway gây ra sai lệch nghiêm trọng: mỗi máy chỉ thấy 1/3 lưu lượng của cùng một khách hàng.

Để thực thi đúng một hạn mức duy nhất trên toàn cụm, mọi Gateway phải đọc và cập nhật chung một kho trạng thái tập trung.

## 2. Bộ đếm tập trung trên Redis: thêm 1 hop và nguy cơ SPOF

```step
category: MECHANISM
short: Redis tập trung
scene: s2-central-redis
callout:
  kind: compare
  title: Độ chính xác đổi lấy độ trễ và độ phức tạp
  vi: "Kho đếm Redis tập trung giải quyết lệch ngưỡng bằng Lua script nguyên tử, nhưng cộng thêm 1 hop mạng và tạo điểm phụ thuộc mới."
whatChanged:
  - "+ Đưa bộ đếm sang cụm Redis Counter Store dùng chung"
  - "~ Thực thi kiểm tra bằng Lua script nguyên tử"
telemetry:
  - label: "Độ trễ thêm"
    value: "+1 hop (~0,5 ms)"
    tone: warn
  - label: "Sai số đếm"
    value: "≈ 0%"
    tone: ok
```

Đưa bộ đếm lên **Redis** giúp mọi API Gateway dùng chung một giá trị duy nhất. Tuy nhiên, nếu dùng hai lệnh rời rạc (`GET` rồi `INCR`), hai Gateway đọc cùng lúc sẽ gây Race Condition. Giải pháp chuẩn là chạy **Lua script** nguyên tử ngay trên Redis để kiểm tra và cộng bộ đếm trong một lượt mạng (~0,5 ms).

Cái giá của thiết kế này là thêm 1 hop mạng cho mỗi request và biến Redis thành thành phần trọng yếu: nếu Redis chậm hoặc sập, toàn bộ Gateway có thể bị nghẽn theo.

## 3. Token Bucket và Sliding Window dưới tải đột biến

```step
category: TECHNIQUE
short: Thuật toán lọc
scene: s3-algorithms
callout:
  kind: key-idea
  title: Chọn thuật toán theo đặc tính burst
  vi: "Token Bucket cho phép hấp thụ burst ngắn trong giới hạn xô; Sliding Window Counter làm mượt lưu lượng và chặn lỗi ranh giới cửa sổ."
whatChanged:
  - "+ So sánh hành vi Token Bucket và Sliding Window Counter"
telemetry:
  - label: "Token Bucket"
    value: "Hấp thụ burst"
    tone: ok
  - label: "Sliding Window"
    value: "Chặn ranh giới"
```

Hai thuật toán phổ biến nhất cho Rate Limiter phân tán:

- **Token Bucket:** mỗi khóa có một xô dung lượng `burst`, được nạp đều `ratePerSec` token mỗi giây. Thiết kế này cho phép người dùng hợp lệ gửi một đợt burst ngắn mà không bị chặn oan, trong khi tốc độ trung bình dài hạn vẫn bị khóa chặt ở `ratePerSec`.
- **Sliding Window Counter:** kết hợp bộ đếm của cửa sổ trước và cửa sổ hiện tại theo tỷ lệ thời gian đã trôi qua, loại bỏ tình trạng lọt gấp đôi hạn mức ở thời điểm chuyển giao giữa hai phút như Fixed Window.

## 4. Mô phỏng tải đột biến: bảo vệ Backend API ở đỉnh 5.500 req/s

```step
category: PROBLEM
short: Tải đột biến
scene: s4-burst-live
live: burst
activity: S7-02.A2
gate: optional
callout:
  kind: watch-out
  title: Ngưỡng quá rộng làm sập tầng sau
  vi: "Khi ratePerSec đặt tới 6.000 rps trong khi 2 Backend API chỉ chịu được 3.000 req/s, đỉnh burst 5.500 req/s sẽ làm tràn hàng đợi API."
whatChanged:
  - "~ Mô phỏng đỉnh burst 5.500 req/s tại t = 12 s"
  - "~ Theo dõi p99 và lỗi của người dùng hợp lệ"
telemetry:
  - label: "Đỉnh tải (t = 12 s)"
    value: "5.500 req/s"
    tone: bad
  - label: "Năng lực API gốc"
    value: "3.000 req/s"
    tone: warn
```

Trong kịch bản mô phỏng trực tiếp, 35% lưu lượng đến từ người dùng hợp lệ và 65% đến từ nhánh gửi burst. Ở giây thứ 12, tổng tải vọt từ 1.800 lên 5.500 req/s.

Vì `ratePerSec` đang để quá cao (6.000), toàn bộ tải burst tràn thẳng xuống 2 instance Backend API gây quá tải dây chuyền. Hãy thử siết `ratePerSec`, `burst` và điều chỉnh số instance `api` để bảo vệ p99 ≤ 120 ms.

## 5. Dự phòng Redis và chính sách Fail-open

```step
category: TECHNIQUE
short: Fail-open & HA
scene: s5-failover
activity: S7-02.A1
gate: optional
callout:
  kind: key-idea
  title: Không để bộ lọc trở thành điểm sập chung
  vi: "Luôn triển khai Redis ít nhất 2 node dự phòng, đặt Timeout cực ngắn và chọn Fail-open cho luồng người dùng phổ thông."
whatChanged:
  - "+ Bổ sung yêu cầu Redis ≥ 2 node tránh SPOF"
  - "+ Áp dụng Fail-open khi kho đếm mất kết nối"
telemetry:
  - label: "Redis tối thiểu"
    value: "≥ 2 node"
    tone: ok
  - label: "Chính sách lỗi"
    value: "Fail-open"
    tone: ok
```

Một Rate Limiter tốt không bao giờ được làm sập hệ thống khi bản thân kho đếm gặp sự cố:
- Đặt Timeout rất ngắn (20–50 ms) khi Gateway gọi Redis.
- Chọn **Fail-open** cho đa số API thông thường (nếu Redis lỗi, tạm cho request đi qua) và chỉ dùng **Fail-closed** cho các điểm nhạy cảm như đăng nhập hoặc thanh toán.
- Luôn chạy cụm Redis từ 2 node trở lên để tránh SPOF.

Hãy hoàn thành bài tập thiết kế `S7-02.A1` để chốt cấu hình đạt chuẩn cả lúc tải đều lẫn lúc có burst.

## 6. Tổng kết thiết kế Rate Limiter phân tán

```step
category: RECAP
short: Tóm tắt
scene: s5-failover
callout:
  kind: key-idea
  title: Ba trụ cột của Rate Limiter phân tán
  vi: "Dùng Redis tập trung với Lua script nguyên tử để tránh lệch ngưỡng, chọn Token Bucket cho burst và luôn đặt Redis ≥ 2 node kèm Fail-open."
whatChanged:
  - "+ Tổng kết kiến trúc Rate Limiter phân tán"
telemetry:
  - label: "Kho đếm"
    value: "Redis + Lua"
    tone: ok
  - label: "Thuật toán"
    value: "Token Bucket"
    tone: ok
```

Rate Limiter phân tán là lớp lá chắn đầu tiên bảo vệ tầng API và Database trước các đợt tải đột biến. Khi triển khai thực tế, hãy luôn theo dõi tỷ lệ mã HTTP 429 và độ trễ của cụm Redis đếm ngưỡng.
