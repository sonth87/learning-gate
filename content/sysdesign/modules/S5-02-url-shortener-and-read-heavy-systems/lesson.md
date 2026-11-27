## 1. Đặc trưng của hệ thống Read-Heavy 99% đọc

```step
category: SETUP
short: Tải 99% đọc
scene: s1-read-heavy
callout:
  kind: key-idea
  title: Tối ưu đường đọc, tách rời thống kê
  vi: "Trong hệ thống có tỷ lệ đọc/ghi 100:1, Database không phải điểm nghẽn vì lượt ghi mà vì lượt đọc trượt Cache. Giữ Hit Ratio trên 90% là yếu tố quyết định của chi phí và độ trễ."
whatChanged:
  - "+ Dựng đường đi chuẩn cho URL Shortener: Client → CDN → LB → API → Cache → NoSQL"
  - "~ Tách luồng đếm lượt nhấp sang Queue + Worker để không làm chậm chuyển hướng"
telemetry:
  - label: "Tỷ lệ đọc / ghi"
    value: "99% / 1%"
  - label: "Đích p99 đọc"
    value: "≤ 80 ms"
```

Phần lớn dịch vụ phổ biến trên Internet đều nghiêng mạnh về chiều đọc: trang tin tức, mạng xã hội, chia sẻ video hay dịch vụ rút gọn liên kết (URL Shortener). Với URL Shortener, mỗi liên kết được tạo một lần nhưng có thể được nhấp hàng nghìn đến hàng triệu lần.

Do đó, ưu tiên thiết kế hoàn toàn khác hệ thống cân bằng:
- **Đường đọc (Hot Path):** Phải đạt độ trễ cực thấp (dưới 50–80 ms) nhờ đa tầng đệm từ CDN Edge tới Redis Cache trong RAM.
- **Đường ghi (Cold Path):** Lưu lượng nhỏ (~40 ghi/giây so với 4.000–12.000 đọc/giây), ưu tiên sinh mã ngắn không trùng lặp.
- **Thống kê lượt nhấp:** Đẩy sự kiện bất đồng bộ qua Message Queue để không cản trở tốc độ chuyển hướng.

## 2. Con số dẫn thiết kế: lưu lượng và dung lượng 5 năm

```step
category: TECHNIQUE
short: Ước lượng tải
scene: s2-napkin-math
activity: S5-02.A1
gate: optional
callout:
  kind: technique
  title: Đổi yêu cầu thành con số phần cứng
  vi: "Trước khi chọn loại Database hay cỡ RAM Cache, hãy nhân số bản ghi mỗi tháng với kích thước trung bình để biết dữ liệu 5 năm lớn cỡ nào."
whatChanged:
  - "+ Tính toán 100 triệu URL/tháng (~40 ghi/s) và 10 tỷ lượt đọc/tháng (~4.000–12.000 đọc/s)"
  - "~ Xác định tập dữ liệu nóng 20% cần giữ trong RAM Cache"
telemetry:
  - label: "Ghi trung bình"
    value: "≈ 40 req/s"
  - label: "Đọc đỉnh"
    value: "12.000 req/s"
```

Giả sử hệ thống nhận **100 triệu URL tạo mới mỗi tháng** và **10 tỷ lượt chuyển hướng mỗi tháng** (tỷ lệ đọc/ghi 100:1):
- **Lưu lượng ghi:** `100.000.000 / 2.592.000 giây ≈ 40 URL/giây`.
- **Lưu lượng đọc:** Trung bình khoảng `4.000 req/s`, đỉnh cao điểm đạt `12.000 req/s`.
- **Dung lượng mỗi bản ghi:** Mã ngắn (7 byte) + URL gốc trung bình (200 byte) + siêu dữ liệu (43 byte) ≈ **250 byte**.

Từ mức 250 byte/bản ghi, ta dễ dàng ước lượng dung lượng lưu trữ sau 5 năm (60 tháng) để quyết định việc phân mảnh (Sharding) trên NoSQL theo khóa `short_code`.

## 3. Chiến lược sinh mã ngắn: Hash va chạm vs Counter + Base62

```step
category: MECHANISM
short: Sinh mã Base62
scene: s3-id-generation
callout:
  kind: compare
  title: Tránh va chạm và tránh lộ thứ tự
  vi: "Dùng bộ đếm cấp theo lô kết hợp mã hóa Base62 loại bỏ hoàn toàn va chạm, nhưng cần xáo trộn bit ID trước khi mã hóa để người ngoài không đoán được số lượng liên kết."
whatChanged:
  - "+ So sánh Hash cắt 7 ký tự (phải kiểm tra trùng DB) với Counter + Base62"
  - "~ Áp dụng cấp phát theo dải (Range) và xáo ID để vừa nhanh vừa khó đoán"
telemetry:
  - label: "Không gian 7 ký tự"
    value: "62^7 ≈ 3,5 nghìn tỷ"
    tone: ok
  - label: "Va chạm"
    value: "0%"
    tone: ok
```

Một mã ngắn 7 ký tự dùng bảng chữ cái **Base62** (`[0-9][a-z][A-Z]`) tạo ra `62^7 ≈ 3,5 nghìn tỷ` tổ hợp — dư dùng cho hàng trăm năm. Có hai cách sinh mã phổ biến:

1. **Băm URL (MD5/SHA256) rồi lấy 7 ký tự đầu:** Không cần bộ đếm tập trung, nhưng dễ xảy ra **va chạm** khi hai URL khác nhau ra cùng tiền tố. Mỗi lần tạo buộc phải truy vấn kiểm tra Database xem mã đã tồn tại chưa.
2. **Bộ đếm tăng dần + Base62:** Mỗi máy chủ API xin một dải số (ví dụ từ `1.000.000` đến `1.001.000`) từ Coordinator/DB rồi tự cấp phát trong RAM, không va chạm và không cần kiểm tra lại DB. Để tránh đối thủ đoán được thứ tự tăng dần của sản phẩm, ta **xáo trộn (obfuscate/Feistel)** con số ID trước khi đổi sang Base62.

## 4. Đánh đổi mã HTTP: 301 vs 302 và luồng thống kê bất đồng bộ

```step
category: TECHNIQUE
short: 301 vs 302
scene: s4-301-vs-302
callout:
  kind: compare
  title: Tốc độ trình duyệt vs Dữ liệu phân tích
  vi: "HTTP 301 bảo trình duyệt tự nhớ vĩnh viễn nên các lần bấm sau không tới server; HTTP 302 luôn đi qua server giúp đếm chính xác lượt nhấp."
whatChanged:
  - "+ Đặt rõ ranh giới dùng 301 (giảm tải) và 302 (đo lường analytics)"
  - "~ Đẩy sự kiện nhấp chuột sang Queue + Worker để giữ đường đọc gọn nhẹ"
telemetry:
  - label: "301 Permanent"
    value: "Ít tải server"
  - label: "302 Found"
    value: "Đủ dữ liệu click"
```

Khi server trả về địa chỉ URL gốc cho trình duyệt, lựa chọn mã trạng thái HTTP quyết định hành vi bộ nhớ đệm của trình duyệt:

| Tiêu chí | HTTP 301 (Moved Permanently) | HTTP 302 (Found / Temporary) |
|---|---|---|
| **Hành vi trình duyệt** | Lưu đệm vĩnh viễn, lần sau tự chuyển hướng | Luôn gửi yêu cầu lại về server/CDN |
| **Tải lên hệ thống** | Rất thấp (giảm lưu lượng lặp lại từ cùng thiết bị) | Cao hơn vì mọi lượt nhấp đều đi qua biên |
| **Thống kê lượt nhấp** | Bị thiếu hụt dữ liệu phân tích | Ghi nhận chính xác 100% lượt nhấp |

Dù chọn 301 hay 302, việc ghi nhận thống kê (thời gian, quốc gia, thiết bị) không bao giờ được ghi trực tiếp vào Database chính trong lúc chuyển hướng. Server chỉ cần phát một sự kiện nhẹ vào **Message Queue** để **Analytics Worker** gom lô ghi sang kho phân tích sau.

## 5. Mô phỏng tải 4.000 → 12.000 req/s qua CDN, Cache và NoSQL

```step
category: PROBLEM
short: Tải đỉnh 12k RPS
scene: s5-live-shortener
activity: S5-02.A2
gate: optional
callout:
  kind: watch-out
  title: Tập dữ liệu nóng vượt dung lượng Cache
  vi: "Khi lưu lượng tăng từ 4.000 lên 12.000 req/s, nếu Cache chỉ chứa 50.000 key trên tập nóng 200.000 key, hàng loạt Cache Miss sẽ đánh sập NoSQL."
whatChanged:
  - "+ Chạy mô phỏng tăng tải 4.000 → 12.000 req/s với 99% lượt đọc"
  - "~ Quan sát tác động của dung lượng Cache, số instance API và số shard NoSQL"
telemetry:
  - label: "Tải đỉnh"
    value: "12.000 req/s"
  - label: "Mục tiêu p99"
    value: "≤ 80 ms"
```

Trong mô phỏng trực tiếp, hệ thống đang gánh lưu lượng tăng từ 4.000 lên 12.000 req/s (99% là đọc). Cấu hình mặc định gặp hai vấn đề:
1. Tầng **Shortener API** chỉ có 2 máy (`4.000 req/s` tổng năng lực) nên bị nghẽn khi lưu lượng vượt mức CDN hấp thụ.
2. **Redis Cache** chỉ chứa 50.000 key trong khi tập liên kết nóng là 200.000 key, đẩy quá nhiều truy vấn trượt đệm xuống **NoSQL**.

Hãy chỉnh cấu hình trong thử thách sửa lỗi (tối đa 3 thay đổi, ngân sách ≤ 2,00 USD/giờ) để giữ `p99 ≤ 80 ms` và tỷ lệ lỗi `≤ 1%` suốt đợt tăng tải.

## 6. Tổng kết kiến trúc hệ thống Read-Heavy

```step
category: RECAP
short: Tổng kết
scene: s6-recap
callout:
  kind: key-idea
  title: Bốn trụ cột của URL Shortener
  vi: "Mã ngắn Base62 từ bộ đếm theo lô + xáo ID, đa tầng đệm CDN + Redis, NoSQL phân mảnh theo mã ngắn, và tách luồng thống kê sang Queue."
whatChanged:
  - "+ Tổng hợp đầy đủ đường đọc nóng, đường ghi lạnh và luồng phân tích"
  - "~ Ghi nhớ: mọi hệ thống 99% đọc đều xoay quanh tỷ lệ trúng Cache"
telemetry:
  - label: "Đường đọc"
    value: "CDN → Cache → NoSQL"
  - label: "Thống kê"
    value: "Async Queue"
```

Mẫu kiến trúc URL Shortener áp dụng được cho hầu hết hệ thống read-heavy:
- **Sinh ID:** Bộ đếm cấp theo lô + xáo trộn bit + mã hóa Base62 7 ký tự.
- **Tối ưu đọc:** Tận dụng CDN Edge và Redis Cache phủ trọn tập key nóng (20% URL tạo 80%+ lượt truy cập).
- **Mở rộng dữ liệu:** Phân mảnh NoSQL theo khóa `short_code` để tra cứu theo khóa chính trong vài mili-giây.
- **Tách tác vụ phụ:** Đẩy đếm lượt nhấp và kiểm tra liên kết rác sang Queue/Worker chạy nền.
