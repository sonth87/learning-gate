## 1. Thách thức cốt lõi của News Feed: làm việc lúc đọc hay lúc đăng?

```step
category: SETUP
short: Bài toán Feed
scene: s1-feed-challenge
callout:
  kind: key-idea
  title: Chọn thời điểm tính toán
  vi: "Mỗi người dùng có một trang chủ cá nhân hóa khác nhau nên không thể dùng chung một bản cache. Câu hỏi kiến trúc lớn nhất là: dựng feed lúc người dùng mở app (Read) hay lúc tác giả đăng bài (Write)?"
whatChanged:
  - "+ Đặt bài toán News Feed: tải < 200 ms cho hàng triệu người dùng theo dõi nhiều tác giả"
  - "~ Xác định hai luồng chính: đọc Feed và phát bài mới (Fan-out)"
telemetry:
  - label: "Theo dõi TB"
    value: "200 người"
  - label: "Mục tiêu p99"
    value: "< 200 ms"
```

Khi người dùng mở mạng xã hội, họ kỳ vọng thấy ngay bài đăng mới nhất của hàng trăm người mình đang theo dõi trong chưa đầy 200 ms. Khác với trang tin tức chung nơi mọi người xem cùng một danh sách, **News Feed được cá nhân hóa riêng cho từng tài khoản**.

Điều này tạo ra hai áp lực trái ngược:
- **Khuếch đại đọc (Read Amplification):** Một lần mở app phải gom bài từ 200 người đang theo dõi.
- **Khuếch đại ghi (Write Amplification):** Một bài đăng mới phải truyền tới hàng nghìn (hoặc hàng chục triệu) người theo dõi.

Toàn bộ kiến trúc News Feed xoay quanh việc cân bằng hai chiều khuếch đại này.

## 2. Fan-out on Read (Pull Model): vì sao shard bài viết quá tải?

```step
category: PROBLEM
short: Fan-out on Read
scene: s2-live-read-overload
activity: S5-03.A1
gate: optional
callout:
  kind: watch-out
  title: Hàng triệu lượt tra cứu mỗi giây vào Post DB
  vi: "Nếu mỗi lượt mở feed (23.000 feed/giây) đều phải truy vấn 200 tác giả trên Post DB, hệ thống sẽ tạo ra 4,6 triệu lượt tra cứu/giây làm shard bài viết sụp đổ."
whatChanged:
  - "+ Chạy mô phỏng tải tăng dần 500 → 5.000 req/s khi Feed Cache chỉ phủ 1/3 tập nóng"
  - "~ Quan sát Post DB chạm ngưỡng bão hòa đầu tiên do lượt đọc trượt đệm dồn xuống"
telemetry:
  - label: "Tải đọc Feed"
    value: "90% lưu lượng"
  - label: "Áp lực Post DB"
    value: "Tăng vọt theo tải"
    tone: bad
```

Cách tiếp cận trực giác nhất là **Fan-out on Read (Pull)**: khi tác giả đăng bài, chỉ lưu một dòng vào `Post DB`. Khi người đọc mở ứng dụng, `Feed API` lấy danh sách 200 người họ đang theo dõi, truy vấn các bài mới nhất của từng người rồi gộp và sắp xếp lại.

Cách này cực kỳ nhẹ ở chiều ghi, nhưng **sụp đổ ở chiều đọc**:
- Nếu hệ thống có 23.000 lượt tải feed mỗi giây và mỗi người theo dõi 200 tác giả, `Post DB` phải chịu `23.000 × 200 = 4,6 triệu` lượt tra cứu mỗi giây.
- Trong mô phỏng trực tiếp, khi dung lượng `Feed Cache` chưa đủ lớn, phần lớn truy vấn trượt đệm dồn thẳng xuống `Post DB` khiến `Post DB` trở thành điểm nghẽn đầu tiên.

## 3. Tìm giới hạn tải của hệ thống hiện tại

```step
category: TECHNIQUE
short: Đo giới hạn tải
scene: s3-live-limit
activity: S5-03.A2
gate: optional
callout:
  kind: technique
  title: Định lượng trần chịu tải trước khi nâng cấp
  vi: "Dùng núm tải để đo chính xác lưu lượng tối đa mà cụm Feed hiện tại vẫn giữ p99 ≤ 120 ms và tỷ lệ lỗi ≤ 1%."
whatChanged:
  - "+ Giữ nguyên cấu hình phần cứng ban đầu và thử các mức tải ổn định khác nhau"
  - "~ Xác định ngưỡng tải tối đa trước khi hàng đợi ở Post DB phình to"
telemetry:
  - label: "Ngưỡng p99"
    value: "≤ 120 ms"
  - label: "Ngưỡng lỗi"
    value: "≤ 1%"
```

Trước khi thêm máy chủ hay mở rộng bộ nhớ đệm, hãy đo chính xác **trần tải bền vững** của kiến trúc hiện tại. Khi tăng dần lưu lượng đầu vào, thành phần có tỷ lệ sử dụng `ρ` chạm 1 đầu tiên sẽ kéo `p99` vượt ngưỡng `120 ms`.

## 4. Fan-out on Write (Push Model) và Timeline Cache chỉ lưu ID

```step
category: MECHANISM
short: Fan-out on Write
scene: s4-fanout-write
callout:
  kind: key-idea
  title: Đẩy sẵn danh sách ID vào Redis Sorted Set
  vi: "Khi người dùng đăng bài, Fan-out Worker chèn sẵn post_id vào Timeline Cache của từng người theo dõi. Lúc mở app, Feed API chỉ cần đọc 1 lần từ RAM trong dưới 10 ms."
whatChanged:
  - "+ Tách luồng phát bài sang Message Queue và Fan-out Worker"
  - "~ Timeline Cache chỉ lưu post_id (tối đa 1.000 ID/người), lấy bài theo lô"
telemetry:
  - label: "Đọc Feed Cache"
    value: "< 10 ms"
    tone: ok
  - label: "Kích thước mỗi mục"
    value: "8 byte (post_id)"
    tone: ok
```

Để giải quyết điểm nghẽn đọc, ta đảo ngược thời điểm làm việc bằng **Fan-out on Write (Push Model)**:

1. Tác giả đăng bài → `Feed API` lưu bài vào `Post DB` và đẩy sự kiện vào **Message Queue**.
2. Cụm **Fan-out Worker** lấy danh sách người theo dõi của tác giả, rồi chèn `post_id` vào **Timeline Cache** (thường là Redis Sorted Set) của từng người theo dõi.
3. Để tiết kiệm RAM, mỗi Timeline Cache **chỉ lưu tối đa 500–1.000 `post_id`** thay vì lưu toàn bộ văn bản và ảnh. Khi người dùng mở app, `Feed API` đọc 20 `post_id` từ Redis trong vài mili-giây rồi lấy nội dung bài viết theo lô (Batch) từ Cache/DB.

## 5. Vấn đề người nổi tiếng (Celebrity) và kiến trúc Hybrid

```step
category: PITFALL
short: Hybrid Celebrity
scene: s5-hybrid-celebrity
callout:
  kind: compare
  title: Đẩy cho đa số, kéo cho người nổi tiếng
  vi: "Nếu một ngôi sao có 50 triệu người theo dõi đăng bài, Fan-out on Write tạo ra 50 triệu lệnh ghi cùng lúc làm tắc nghẽn Queue và tốn nhiều phút mới phát xong."
whatChanged:
  - "+ Kết hợp Hybrid: Push cho tài khoản thường, Pull cho tài khoản Celebrity"
  - "~ Chỉ đẩy (Push) vào Timeline Cache của những người dùng hoạt động gần đây"
telemetry:
  - label: "Tài khoản thường"
    value: "Push (Write)"
    tone: ok
  - label: "Celebrity (> 100k)"
    value: "Pull (Read)"
    tone: ok
```

Thuần túy Fan-out on Write gặp một rào cản lớn: **tài khoản người nổi tiếng (Celebrity)**. Một bài đăng từ người có 50 triệu người theo dõi sẽ sinh ra 50 triệu tác vụ ghi vào Redis, gây tồn đọng (backlog) khổng lồ trong Queue và làm trễ bài viết của những người dùng khác.

Giải pháp thực tế tại các mạng xã hội lớn là **Hybrid Fan-out**:
- **Với tài khoản thông thường (< 100.000 người theo dõi):** Dùng **Fan-out on Write** (Push) qua Queue + Worker để độ trễ mở feed gần như bằng 0.
- **Với tài khoản người nổi tiếng (≥ 100.000 người theo dõi):** Không Push lúc đăng. Khi người đọc mở trang chủ, `Feed API` đọc danh sách đã Push sẵn từ `Timeline Cache`, đồng thời **kéo (Pull)** nhanh vài bài mới nhất từ cache riêng của những người nổi tiếng họ đang theo dõi rồi trộn lại.
- **Tiết kiệm ghi thừa:** Không cần đẩy bài vào `Timeline Cache` của những tài khoản đã không đăng nhập hơn 30 ngày.

## 6. Cuộn trang con trỏ, dựng lại Cache và lớp xếp hạng

```step
category: TECHNIQUE
short: Gia cố Feed
scene: s6-live-hardened
activity: S5-03.A3
gate: optional
callout:
  kind: good-to-know
  vi: "Dùng Cursor Pagination theo timestamp/post_id để không bị trùng bài khi có bài mới chèn lên đầu, và giữ Cache đủ phủ tập người dùng hoạt động."
whatChanged:
  - "+ Áp dụng thử thách thiết kế: chịu tải chuẩn 2.000 req/s và đỉnh 4.500 req/s"
  - "~ Kết hợp nâng dung lượng Feed Cache và phân mảnh Post DB trong ngân sách"
telemetry:
  - label: "Tải chuẩn"
    value: "2.000 req/s"
  - label: "Đỉnh đột biến"
    value: "4.500 req/s"
```

Ba chi tiết hoàn thiện hệ thống News Feed ở quy mô sản xuất:
- **Phân trang bằng con trỏ (Cursor Pagination):** Khi người dùng cuộn xuống trang 2, có thể đã có 5 bài mới xuất hiện ở đầu trang 1. Dùng `OFFSET` sẽ trả lại trùng bài cũ; dùng `before_post_id` hoặc `before_timestamp` đảm bảo danh sách liền mạch.
- **Dựng lại Cache có điều tiết (Throttled Rebuild):** Nếu một cụm Redis mất dữ liệu, không đồng loạt gửi hàng triệu truy vấn xuống `Post DB` cùng lúc mà dựng lại theo yêu cầu với giới hạn tốc độ.
- **Lớp xếp hạng (Ranking):** Trước khi trả kết quả, lấy khoảng 200 ứng viên `post_id` từ Timeline Cache + Celebrity Pull rồi chấm điểm theo mức độ tương tác và độ mới.

## 7. Tổng kết kiến trúc Social Feed

```step
category: RECAP
short: Tổng kết Feed
scene: s7-recap
callout:
  kind: key-idea
  title: Cân bằng giữa tốc độ đọc và chi phí ghi
  vi: "Fan-out on Write cho 99% người dùng thường, Pull lúc đọc cho Celebrity, Timeline Cache chỉ giữ post_id và Cursor Pagination cho cuộn trang mượt mà."
whatChanged:
  - "+ Hoàn chỉnh kiến trúc Hybrid News Feed cho hàng triệu người dùng"
  - "~ Kết thúc chuỗi mẫu kiến trúc cốt lõi của Phase 5"
telemetry:
  - label: "Mô hình chuẩn"
    value: "Hybrid Push/Pull"
  - label: "Lưu Cache"
    value: "Chỉ post_id"
```

Tóm tắt bốn quyết định cốt lõi khi thiết kế News Feed:
1. **Dùng Hybrid Fan-out:** Push qua Queue + Worker cho tài khoản thường; Pull tại thời điểm đọc cho Celebrity để tránh bão ghi.
2. **Timeline Cache gọn nhẹ:** Chỉ lưu `post_id` (tối đa ~1.000 bài gần nhất) trong Redis Sorted Set, bỏ qua tài khoản không hoạt động.
3. **Phân trang con trỏ:** Tránh `OFFSET` gây trùng/sót bài khi dòng thời gian liên tục có bài mới.
4. **Bảo vệ Post DB:** Giữ tỷ lệ trúng Cache cao và dùng giới hạn tốc độ khi dựng lại Cache sau sự cố.
