## 1. Ghép nối toàn bộ công cụ của Phase 0 và Phase 1 vào bài toán thực tế

```step
category: SETUP
short: Ba đề thực hành
scene: s1-overview
callout:
  kind: key-idea
  title: Hiểu khái niệm mới là nửa chặng đường
  vi: "Năng lực thiết kế chỉ hình thành khi bạn tự đặt câu hỏi làm rõ, tính ra con số RPS và dung lượng, vẽ luồng dữ liệu, tìm đúng nút nghẽn và bảo vệ được đánh đổi của mình."
whatChanged:
  - "+ Kết nối khung câu hỏi S0-07 và phép tính nhẩm S0-05 vào kiến trúc Phase 1"
  - "~ Luyện tập qua 3 đề bài: phân tích ứng dụng, URL Shortener và tải Avatar"
telemetry:
  - label: "Số đề thực hành"
    value: "3 bài toán"
  - label: "Trọng tâm mô phỏng"
    value: "URL Shortener 2.500 req/s"
    tone: ok
```

Xuyên suốt Phase 1, bạn đã làm việc với từng mảnh ghép nền tảng: năm thành phần cơ bản (`S1-01`), vòng đời kết nối (`S1-06`), mẫu giao tiếp đồng bộ/bất đồng bộ (`S1-02`), phương pháp tìm điểm nghẽn theo $\rho = \lambda/\mu$ (`S1-03`), bộ tứ Latency–Throughput–Availability–CAP (`S1-04`) và đường cong hàng đợi (`S1-07`).

Bài chốt Phase 1 yêu cầu vận dụng đồng thời tất cả các công cụ trên qua ba bài tập tăng dần độ sâu:

1. **Bài 1:** Phân tích ngược một luồng thao tác trên ứng dụng quen thuộc và dự báo điểm nghẽn khi lưu lượng tăng gấp 10 lần.
2. **Bài 2:** Thiết kế đầu-cuối dịch vụ rút gọn liên kết (**URL Shortener**) từ ước lượng công suất đến gỡ nghẽn trên mô phỏng trực tiếp.
3. **Bài 3:** Phân tích đánh đổi giữa ba kiến trúc xử lý tính năng tải ảnh đại diện (**Upload Avatar**).

## 2. Bài 1: Quy trình 3 bước phân tích ngược một ứng dụng đang chạy

```step
category: TECHNIQUE
short: Lần luồng thực
scene: s2-reverse
callout:
  kind: technique
  title: Tách đường găng dưới 200 ms khỏi phần xử lý hậu kỳ
  vi: "Khi nhìn bất kỳ thao tác nào như Đăng ảnh hay Đặt hàng, hãy hỏi: bước nào người dùng bắt buộc chờ trên màn hình, bước nào đang được đẩy xuống Queue chạy sau?"
whatChanged:
  - "+ Áp dụng khung Thành phần → Luồng dữ liệu → Điểm nghẽn ở quy mô ×10"
telemetry:
  - label: "Phần đồng bộ"
    value: "≤ 200 ms"
    tone: ok
  - label: "Phần bất đồng bộ"
    value: "Queue + Worker"
```

Khi tự luyện tập phân tích một thao tác thực tế (chẳng hạn người dùng bấm **Đặt hàng** trên sàn thương mại điện tử hoặc **Đăng ảnh** lên mạng xã hội), hãy đi đúng ba bước có cấu trúc:

- **Bước A — Liệt kê thành phần theo vai trò:** Client di động, CDN cho ảnh tĩnh, Load Balancer, cụm API Stateless, Redis Cache giữ thông tin sản phẩm/tồn kho nóng, Database quan hệ lưu đơn hàng, và Message Queue nối sang cụm Worker.
- **Bước B — Tách luồng đồng bộ và bất đồng bộ:** trên đường đồng bộ, API kiểm tra giỏ hàng, giữ chỗ tồn kho, ghi bản ghi đơn hàng và trả ngay `order_id` trong khoảng 200 ms. Khâu thu tiền cổng ngoài, xuất hóa đơn và gửi thông báo đẩy sang Queue để Worker xử lý nền.
- **Bước C — Dự báo điểm nghẽn ở quy mô gấp 10:** ở tải thường, khóa tranh chấp tồn kho sản phẩm khuyến mãi là điểm nóng; khi tải nhân 10, thông lượng ghi vào một Database chính sẽ chạm $\rho = 1$ trước tiên, đòi hỏi tối ưu truy vấn hoặc phân mảnh theo `user_id`.

## 3. Bài 2 (Phần A): Làm rõ yêu cầu và ước lượng công suất cho URL Shortener

```step
category: MECHANISM
short: Ước lượng tải
scene: s3-napkin
callout:
  kind: key-idea
  title: Tỉ lệ đọc gấp ~100 lần ghi định hình toàn bộ kiến trúc
  vi: "100 triệu lượt chuyển hướng so với 1 triệu lượt tạo mới mỗi ngày cho thấy đây là hệ thống thiên hẳn về đọc (Read-heavy) — đặt Cache đúng kích thước sẽ giải quyết phần lớn bài toán."
whatChanged:
  - "+ Chuyển đề bài 1M ghi/ngày và 100M đọc/ngày thành RPS đỉnh và TB lưu trữ"
telemetry:
  - label: "Đỉnh chuyển hướng"
    value: "2.500 – 3.500 req/s"
    tone: warn
  - label: "Đỉnh tạo link mới"
    value: "≈ 36 req/s"
    tone: ok
  - label: "Lưu trữ 5 năm"
    value: "≈ 0,91 TB"
    tone: ok
```

Áp dụng khung câu hỏi `S0-07` và phép tính nhẩm `S0-05` cho đề bài thiết kế dịch vụ rút gọn liên kết: tạo mới **1 triệu URL/ngày**, chuyển hướng **100 triệu lượt/ngày**, độ sẵn sàng **99,9%**, thời gian lưu giữ **5 năm**.

| Hạng mục ước lượng | Phép tính nhẩm (`86.400 giây/ngày`) | Kết luận kiến trúc |
|---|---|---|
| **Tải ghi (`POST /shorten`)** | Trung bình `10^6 / 86.400 ≈ 12 req/s`, đỉnh ×3 ≈ **36 req/s** | Rất nhẹ, một Database quan hệ đơn lẻ dư sức ghi |
| **Tải đọc (`GET /{code}`)** | Trung bình `10^8 / 86.400 ≈ 1.157 req/s`, đỉnh **2.500 – 3.500 req/s** | Chiếm ~95–99% lưu lượng → bắt buộc có Redis Cache |
| **Dung lượng 5 năm** | `10^6 × 365 × 5 = 1,825 tỉ hàng` × `500 byte` ≈ **912 GB (~0,9 TB)** | Nằm gọn trên ổ SSD của một máy SQL chuẩn |
| **Bộ nhớ Cache nóng** | Giữ 200.000 liên kết hoạt động mạnh × `500 byte` ≈ **100 MB RAM** | Cực rẻ nhưng nâng Hit Ratio lên trên 95% |

## 4. Bài 2 (Phần B): Sinh mã Base62 không va chạm và thiết kế API, Schema

```step
category: TECHNIQUE
short: Mã hóa Base62
mode: code
callout:
  kind: compare
  title: Base62 từ ID duy nhất thắng băm MD5 cắt ngắn
  vi: "Cắt 7 ký tự đầu của hàm băm MD5 có thể sinh trùng mã giữa hai URL khác nhau nên phải tốn thêm truy vấn kiểm tra va chạm; đổi số nguyên ID duy nhất sang hệ cơ số 62 đảm bảo không bao giờ trùng."
whatChanged:
  - "+ Cài đặt hàm đổi ID nguyên sang chuỗi Base62 và lược đồ bảng có chỉ mục"
telemetry:
  - label: "Không gian 6 ký tự"
    value: "62^6 ≈ 56,8 tỉ mã"
    tone: ok
  - label: "Chuyển hướng HTTP"
    value: "302 Found + Async click"
```

Hai giao diện API cốt lõi gồm `POST /api/shorten` (nhận `long_url`, trả `short_url`) và `GET /{short_code}` (trả phản hồi chuyển hướng `302` kèm header `Location`; dùng `302` thay vì `301` khi cần thống kê lượt bấm, và đẩy bản ghi đếm click vào Queue bất đồng bộ để không cản đường đọc).

Với bộ ký tự **Base62** gồm `0-9`, `a-z`, `A-Z`, chuỗi dài 6 ký tự biểu diễn được $62^6 \approx 56,8$ tỉ liên kết — dư hơn 30 lần nhu cầu 1,825 tỉ liên kết trong 5 năm:

```python
ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(unique_id: int) -> str:
    if unique_id == 0:
        return ALPHABET[0]
    chars: list[str] = []
    while unique_id > 0:
        unique_id, rem = divmod(unique_id, 62)
        chars.append(ALPHABET[rem])
    return "".join(reversed(chars))

# Bảng lưu trữ cốt lõi: bắt buộc đánh UNIQUE INDEX trên cột short_code
# CREATE TABLE urls (
#   id BIGSERIAL PRIMARY KEY,
#   short_code VARCHAR(10) UNIQUE NOT NULL,
#   long_url TEXT NOT NULL,
#   created_at TIMESTAMP NOT NULL DEFAULT NOW()
# );
```

## 5. Bài 2 (Phần C): Chẩn đoán và gỡ nghẽn bản nháp URL Shortener ở 2.500 req/s

```step
category: PROBLEM
short: Gỡ nghẽn nháp
scene: s5-draft-live
live: shortener
activity: S1-05.A1
gate: optional
callout:
  kind: watch-out
  title: Hai nút thắt nối tiếp nhau trên cùng một bản nháp
  vi: "Nếu chỉ thêm máy cho Shortener API mà quên nâng dung lượng key của Redis Cache, lượng đọc trượt Cache sẽ lập tức đánh sập URL Database ở phía sau."
whatChanged:
  - "~ Chạy bản nháp ở tải 2.500 req/s (95% đọc chuyển hướng, 5% ghi)"
  - "~ Cả Shortener API (ρ = 1,39) lẫn URL Database (ρ = 1,59) đều đang quá tải"
telemetry:
  - label: "ρ Shortener API"
    value: "1,39 (1 máy)"
    tone: bad
  - label: "Hit Ratio bản nháp"
    value: "≈ 21% (10k/200k key)"
    tone: bad
  - label: "ρ URL Database"
    value: "1,59 (quá tải)"
    tone: bad
```

Bản nháp đầu tiên đặt đủ năm khối `Client → Load Balancer → Shortener API → Redis Cache → URL Database`, nhưng khi đưa tải cao điểm **2.500 req/s** vào mô phỏng thì lỗi vọt lên 100% vì hai sai số cấu hình:

1. **Tầng `Shortener API` thiếu năng lực tính toán:** chỉ có 1 instance ($\mu = 1.800$ req/s) đón 2.500 req/s nên $\rho = 2.500 / 1.800 = 1,39$, tạo hàng đợi ngay ở cửa vào ứng dụng.
2. **Tầng `Redis Cache` định cỡ quá nhỏ so với tập khóa nóng:** có 200.000 liên kết đang được bấm thường xuyên nhưng Cache chỉ cấu hình giữ `10.000 key`, khiến Hit Ratio tụt xuống khoảng **21%**. Hơn 79% tổng lưu lượng tràn xuống `URL Database` ($\mu = 900$ req/s), đẩy $\rho$ của Database vượt ngưỡng 1,5.

Hãy áp dụng đúng quy trình `S1-03`: nâng `Shortener API` lên 2 instance và cấp đủ `200.000 key` cho `Redis Cache` (nâng Hit Ratio lên **96%**, kéo lưu lượng xuống Database giảm còn khoảng **220 req/s**, tức $\rho \approx 0,24$) thay vì nâng cỡ máy Database đắt đỏ.

## 6. Bài 2 (Phần D): Chịu đỉnh lan truyền 4.200 req/s và xóa điểm lỗi đơn

```step
category: TECHNIQUE
short: Chịu đỉnh tải
scene: s6-resilient
activity: S1-05.A2
gate: required
callout:
  kind: technique
  title: Kiểm tra đồng thời cả năng lực đỉnh lẫn độ sẵn sàng 99,9%
  vi: "Một kiến trúc hoàn chỉnh không chỉ chạy êm ở tải chuẩn mà còn phải giữ headroom qua đợt spike liên kết lan truyền và không sập toàn hệ thống khi 1 Load Balancer hoặc 1 API Server khởi động lại."
whatChanged:
  - "+ Nâng lên 2 Load Balancer, 3 Shortener API và Cache 200.000 key"
  - "~ Vượt mượt đỉnh 4.200 req/s với p99 ≈ 64 ms và tổng chi phí 1,20 USD/giờ"
telemetry:
  - label: "p99 tại 4.200 req/s"
    value: "≈ 64 ms"
    tone: ok
  - label: "Điểm lỗi đơn LB/API"
    value: "0 (đã dự phòng)"
    tone: ok
  - label: "Chi phí vận hành"
    value: "1,20 USD/giờ"
    tone: ok
```

Trên dịch vụ rút gọn liên kết thực tế, chỉ cần một đường dẫn được chia sẻ bởi tài khoản lớn là lưu lượng đọc có thể vọt từ 2.200 lên **4.200 req/s** trong vài giây. Đồng thời, cam kết độ sẵn sàng **99,9%** (`S1-04`) không cho phép để `Load Balancer` hay `Shortener API` chạy đơn độc 1 máy.

Kiểm tra nhanh bằng toán học công suất (`S1-07`):

- Với mỗi `Shortener API` có $\mu = 1.800$ req/s, 2 máy chỉ đạt $3.600 < 4.200$ req/s (quá tải ở đỉnh spike). Nâng lên **3 instance** cho tổng năng lực $5.400$ req/s, giữ mức sử dụng ở đỉnh $4.200 / 5.400 \approx 0,78$ (đúng ngưỡng headroom an toàn dưới 80%).
- Chạy cặp **2 `Load Balancer`** loại bỏ điểm lỗi đơn ở cửa ngõ chỉ với 0,025 USD/giờ tăng thêm.
- Nhờ `Redis Cache` 200.000 key giữ Hit Ratio ~96%, ngay cả ở đỉnh 4.200 req/s lượng truy vấn lọt xuống `URL Database` chỉ khoảng $4.200 \times (0,95 \times 0,04 + 0,05) \approx 370$ req/s ($\rho \approx 0,41$), không cần nâng cấp phần cứng Database.

## 7. Bài 3: Phân tích đánh đổi cho tính năng tải ảnh đại diện (Upload Avatar)

```step
category: MECHANISM
short: Đánh đổi Avatar
scene: s7-avatar
callout:
  kind: compare
  title: Thiết kế lai (Hybrid) kết hợp phản hồi tức thì với xử lý nền
  vi: "Thay vì bắt người dùng chờ nén đủ mọi kích cỡ hoặc trả trang trống chờ Worker, hãy tạo nhanh 1 bản thu nhỏ nhẹ trên đường đồng bộ rồi đẩy các bản độ phân giải cao sang Queue."
whatChanged:
  - "+ Đối chiếu định lượng Đồng bộ (4,6 s), Bất đồng bộ (1,6 s) và Lai (2,0 s)"
telemetry:
  - label: "Đồng bộ hoàn toàn"
    value: "≈ 4,6 giây"
    tone: bad
  - label: "Phương án Lai"
    value: "≈ 2,0 giây (có ảnh ngay)"
    tone: ok
```

Đề bài thứ ba yêu cầu xử lý khi người dùng cập nhật ảnh đại diện: kiểm tra hợp lệ (`500 ms`), nén ra 3 kích cỡ nhỏ/vừa/lớn (`2.000 ms`), tải lên Object Storage (`2.000 ms`) và cập nhật bản ghi người dùng (`100 ms`).

| Phương án | Thời gian chờ | Trải nghiệm người dùng | Độ phức tạp & Khả năng chịu tải |
|---|---|---|---|
| **A. Đồng bộ hết** | **4,6 giây** | Chờ lâu, dễ Timeout trên mạng di động yếu | Mã đơn giản nhưng giữ chặt luồng API, dễ nghẽn khi đông người đổi ảnh |
| **B. Bất đồng bộ thuần** | **1,6 giây** | Nhận phản hồi nhanh nhưng khung ảnh phải hiện trạng thái đang xử lý | Chịu đỉnh tải tốt nhờ Queue, nhưng cần cơ chế báo hoàn tất và xử lý lỗi ngầm |
| **C. Lai (Hybrid)** | **≈ 2,0 giây** | Thấy ngay ảnh đại diện cỡ nhỏ; vài giây sau tự thay bằng bản sắc nét | Cân bằng tốt nhất cho sản phẩm lớn: phần nặng vẫn tách sang Worker nền |

Khi lưu lượng thấp và nhóm phát triển ít người, **Phương án A** giúp ra mắt nhanh; khi phục vụ hàng triệu người dùng, **Phương án C (Hybrid)** đem lại trải nghiệm mượt mà mà không làm nghẽn tầng API.

## 8. Bốn sai lầm phổ biến cần tránh khi trình bày thiết kế hệ thống

```step
category: PITFALL
short: Bốn lỗi tư duy
scene: s8-mistakes
callout:
  kind: watch-out
  title: Đừng dùng kiến trúc phức tạp khi con số chưa đòi hỏi
  vi: "Đề xuất hàng chục microservice và phân mảnh cơ sở dữ liệu cho hệ thống mới chỉ ghi 12 bản ghi mỗi giây là dấu hiệu không gắn kiến trúc với quy mô thực."
whatChanged:
  - "+ Rà soát 4 lỗi tư duy thường gặp nhất ở cuối Phase 1"
telemetry:
  - label: "Nguyên tắc 1"
    value: "Con số dẫn dắt"
    tone: ok
  - label: "Nguyên tắc 2"
    value: "Luôn nêu đánh đổi"
    tone: ok
```

Trước khi khép lại giai đoạn nền tảng, hãy tự kiểm tra bốn lỗi thiết kế điển hình:

1. **Thiết kế quá mức (Over-engineering):** đưa cụm điều phối phức tạp, tách 5–7 microservice và phân mảnh ngang ngay từ đầu cho bài toán chỉ có 12 lượt ghi/giây và chưa tới 1 TB dữ liệu. Hãy bắt đầu từ kiến trúc đơn giản nhất đáp ứng được số liệu, rồi chỉ mở rộng ở đúng thành phần sắp chạm trần.
2. **Nói chung chung thiếu đặc tả:** chỉ vẽ một hộp ghi chữ *Database* hoặc *Cache* mà không chỉ rõ dùng SQL hay Key-Value, đánh chỉ mục trên cột nào, lưu bao nhiêu key, TTL bao lâu.
3. **Quyết định cảm tính bỏ qua con số:** thêm thành phần vì nghe quen tai mà không tính $\lambda$, $\mu$, $\rho$ và dung lượng RAM/đĩa.
4. **Trình bày một chiều không nêu đánh đổi:** mọi lựa chọn (kể cả thêm Cache hay thêm Queue) đều mang theo chi phí mới như dữ liệu trễ TTL hoặc xử lý trùng lặp `Idempotency`; luôn nêu rõ bạn đổi cái gì lấy cái gì.

## 9. Tổng kết Phase 1: sẵn sàng bước vào các thành phần cốt lõi chuyên sâu

```step
category: RECAP
short: Chốt Phase 1
scene: s9-recap
callout:
  kind: key-idea
  title: Nhịp tư duy xuyên suốt mọi bài toán thiết kế
  vi: "Hỏi làm rõ yêu cầu → Ước lượng con số → Dựng bản nháp đơn giản → Đo ρ tìm điểm nghẽn → Sửa đúng chỗ với khoảng thở ≥ 20% → Chỉ rõ đánh đổi."
whatChanged:
  - "+ Hoàn thiện chuỗi kỹ năng nền tảng từ Phase 0 sang hết Phase 1"
telemetry:
  - label: "Trạng thái Phase 1"
    value: "Hoàn tất 7 mô-đun"
    tone: ok
  - label: "Chặng tiếp theo"
    value: "Phase 2: Thành phần cốt lõi"
```

Hoàn thành bài tổng hợp này nghĩa là bạn đã nắm vững bộ khung định lượng cốt lõi của thiết kế hệ thống:

- **Từ yêu cầu ra con số:** đổi lượt dùng theo ngày sang RPS trung bình, RPS đỉnh, tỉ lệ đọc:ghi, dung lượng đĩa nhiều năm và ngân sách ngừng hoạt động theo bậc số 9.
- **Từ con số ra kiến trúc:** chọn giao tiếp đồng bộ cho đường găng ngắn và bất đồng bộ qua Queue cho tác vụ nặng; đặt Cache khi đọc áp đảo ghi; giữ $\rho \le 0,75 - 0,80$ và định cỡ pool bằng $L = \lambda W$.
- **Từ bản nháp ra bản chạy thật:** đo $\rho$ từng nút để gỡ đúng điểm nghẽn và loại bỏ điểm lỗi đơn (SPOF) trong giới hạn chi phí.

Ở **Phase 2**, chúng ta sẽ đi sâu vào cơ chế bên trong của từng khối xây dựng chủ lực: thuật toán Load Balancing, chiến lược Caching & chống Stampede, Message Queues, Replication, Sharding và Consistent Hashing.
