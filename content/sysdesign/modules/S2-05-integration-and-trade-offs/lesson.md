## 1. Khoảng trống tích hợp: biết từng mảnh chưa đủ để dựng hệ thống

```step
category: SETUP
short: Tương tác lớp
scene: s1-gap
callout:
  kind: key-idea
  title: Kiến trúc nằm ở đường nối
  vi: "Thiết kế hệ thống không phải liệt kê tên công nghệ, mà là xác định thứ tự dữ liệu đi qua các thành phần và các đánh đổi phát sinh khi ghép chúng lại."
whatChanged:
  - "+ Đặt bài toán ghép Load Balancer, Cache, Database, Queue và Worker"
  - "~ Mỗi thành phần thêm vào đều giải quyết một nút thắt nhưng tăng độ phức tạp vận hành"
telemetry:
  - label: "Số thành phần"
    value: "6 lớp"
  - label: "Ràng buộc chính"
    value: "SLO · Ngân sách"
```

Nhiều kỹ sư hiểu rõ từng thành phần riêng lẻ: biết Redis là bộ nhớ đệm nhanh, biết PostgreSQL đảm bảo giao dịch, biết Message Queue giúp xử lý nền. Nhưng khi đứng trước một bài toán thực tế, câu hỏi khó nhất lại là: **đặt thành phần nào ở đâu, thứ tự gọi ra sao, và cái giá phải trả khi kết hợp chúng là gì?**

Mỗi mảnh ghép đều kéo theo một hệ quả cho mảnh ghép bên cạnh:
- **Cache** tăng tốc độ đọc nhưng tạo ra bài toán dữ liệu cũ (stale data) và cần dung lượng đủ lớn để giữ tỷ lệ trúng (Hit Ratio) cao.
- **Queue + Worker** giải phóng luồng API khỏi tác vụ nặng nhưng biến phản hồi thành bất đồng bộ (eventual processing).
- **Load Balancer** giúp mở rộng ngang tầng ứng dụng nhưng đòi hỏi ứng dụng không giữ trạng thái cục bộ.

Vì vậy, ta không bao giờ thêm thành phần theo thói quen, mà phải xuất phát từ yêu cầu và ràng buộc cụ thể.

## 2. Khung quyết định 5 bước từ bài toán đến kiến trúc

```step
category: TECHNIQUE
short: Khung 5 bước
scene: s2-framework
callout:
  kind: technique
  title: Xây cho hiện tại, mở rộng khi có số đo
  vi: "Luôn bắt đầu từ phiên bản đơn giản nhất đáp ứng được tải mục tiêu, sau đó chỉ thêm Cache, Queue hay Load Balancer tại đúng điểm đo thấy quá tải."
whatChanged:
  - "+ Hệ thống hóa 5 bước: Yêu cầu → Thành phần lõi → Luồng dữ liệu → Đánh đổi → Tiến hóa"
  - "~ Loại bỏ thành phần dư thừa khi lưu lượng còn thấp"
telemetry:
  - label: "Bước 1"
    value: "Yêu cầu & SLO"
  - label: "Bước 4"
    value: "Đánh đổi chi phí"
```

Để ghép các thành phần một cách có hệ thống, hãy đi qua 5 bước cố định:

1. **Xác định yêu cầu và ràng buộc:** Làm rõ tính năng cần có, độ trễ mục tiêu (ví dụ p99 ≤ 150 ms), lưu lượng (req/s) và ngân sách vận hành.
2. **Chọn thành phần bắt buộc:** Tách rõ thứ không thể thiếu (App Server, Database cho metadata, Object Storage cho tệp lớn) và thứ tùy chọn (Cache, Queue, CDN).
3. **Vẽ luồng dữ liệu (Data Flow):** Theo dõi đường đi từng bước của lượt đọc và lượt ghi để thấy ranh giới đồng bộ vs bất đồng bộ.
4. **Đánh giá đánh đổi cho từng nút thêm vào:** Thành phần này giải quyết nút thắt nào, tốn bao nhiêu chi phí/giờ, và có phương án nào đơn giản hơn không?
5. **Bắt đầu đơn giản và tiến hóa:** Chỉ thêm lớp mới khi số đo thực tế chứng minh nút hiện tại đã chạm giới hạn.

## 3. Case 1: Nền tảng Blog và dịch vụ xử lý ảnh

```step
category: PROBLEM
short: Nghẽn đồng bộ
scene: s3-live-sync-problem
activity: S2-05.A2
gate: optional
callout:
  kind: watch-out
  title: Tác vụ nặng chặn luồng chính
  vi: "Khi dung lượng Cache quá nhỏ và tầng API gánh tải vượt công suất, cả lượt đọc bài viết lẫn lượt tải ảnh đều tăng p99 vượt ngưỡng SLO."
whatChanged:
  - "+ Chạy mô phỏng ở tải 1.800 req/s (85% đọc bài viết, 15% đăng bài kèm ảnh)"
  - "~ Tầng API đơn lẻ và Database phía sau Cache nhỏ nhanh chóng bão hòa"
telemetry:
  - label: "Tải đầu vào"
    value: "1.800 req/s"
  - label: "Đọc / Ghi"
    value: "85% / 15%"
```

Hãy xét hệ thống nền tảng Blog cho phép người dùng đọc bài viết (85% lưu lượng) và đăng bài kèm xử lý nén ảnh (15% lưu lượng).

Nếu để một instance API đơn lẻ nhận toàn bộ 1.800 req/s trong khi Cache chỉ chứa được 20.000 key (trên tập 80.000 bài viết nóng), hai sự cố xảy ra cùng lúc:
- Tầng **API** (công suất 1.200 req/s mỗi máy) vượt quá tải (`ρ = 1,50`), hàng đợi phình to.
- Tỷ lệ trúng Cache thấp đẩy hơn một nửa lượt đọc cộng toàn bộ lượt ghi xuống **Database** (công suất 1.200 req/s), khiến DB cũng nghẽn theo.

Hãy thử sửa cấu hình trong mô phỏng để đưa hệ thống về trạng thái ổn định dưới ngưỡng ngân sách.

## 4. Phương án A (Đồng bộ) vs Phương án B (Queue + Worker + Cache)

```step
category: MECHANISM
short: Đồng bộ vs Queue
scene: s4-sync-vs-async
callout:
  kind: compare
  title: So sánh hai phương án xử lý ảnh
  vi: "Xử lý ảnh đồng bộ giữ kết nối API hàng giây khiến số kết nối đồng thời tăng vọt; đẩy sang Queue + Worker giữ API phản hồi dưới 20 ms."
whatChanged:
  - "+ Tách luồng nén ảnh sang Queue và Media Worker chạy nền"
  - "~ Nâng dung lượng Cache phủ đủ 80.000 bài viết nóng để bảo vệ Database"
telemetry:
  - label: "API p99 (Đồng bộ)"
    value: "> 1.500 ms"
    tone: bad
  - label: "API p99 (Queue)"
    value: "< 100 ms"
    tone: ok
```

Khi ghép dịch vụ xử lý ảnh vào nền tảng Blog, ta đứng trước lựa chọn cốt lõi:

| Tiêu chí | Phương án A: Xử lý đồng bộ | Phương án B: Queue + Worker + Cache |
|---|---|---|
| **Trải nghiệm đăng ảnh** | Chờ nén ảnh xong mới nhận phản hồi (2–5 giây) | API nhận tệp, đẩy job vào Queue và trả lời ngay |
| **Ảnh hưởng khi tải tăng đột biến** | Cạn worker thread của API, kéo sập luôn luồng đọc bài | Hàng đợi hấp thụ đột biến; luồng đọc vẫn phục vụ bình thường |
| **Độ phức tạp & Chi phí** | Thấp (không cần Queue/Worker) | Cao hơn một chút (thêm Queue, Worker và trạng thái xử lý) |

Với yêu cầu tải cao và độ trễ đọc p99 thấp, **Phương án B** tách biệt hoàn toàn tải ghi nặng khỏi đường đọc nóng được bảo vệ bởi Cache.

## 5. Thiết kế chịu tải đỉnh và loại bỏ điểm lỗi đơn

```step
category: TECHNIQUE
short: Chịu đỉnh SPOF
scene: s5-live-hardened
activity: S2-05.A1
gate: optional
callout:
  kind: good-to-know
  vi: "Một kiến trúc tốt vừa phải vượt qua tải thường ngày lẫn đỉnh tăng vọt, vừa không có thành phần đơn lẻ nào làm sập toàn bộ hệ thống."
whatChanged:
  - "+ Nhân bản Load Balancer (2) và API (3+) để xóa điểm lỗi đơn (SPOF)"
  - "~ Bổ sung Worker dự phòng để xả kịp hàng đợi khi tải vọt lên 3.400 req/s"
telemetry:
  - label: "Mục tiêu đỉnh"
    value: "3.400 req/s"
  - label: "Dự phòng SPOF"
    value: "LB ≥ 2, API ≥ 2"
```

Khi hệ thống chạy qua một đợt tăng tải đột biến lên 3.400 req/s, mọi mắt xích đều phải có khoảng thở:
- **Load Balancer và API Server** cần ít nhất 2 instance trở lên để vừa gánh đủ lưu lượng đỉnh, vừa tránh điểm lỗi đơn (SPOF) nếu một máy gặp sự cố.
- **Cache** phải đủ dung lượng cho tập dữ liệu nóng để Database không bị đánh úp bởi Cache Miss.
- **Media Worker** cần đủ số lượng để tiêu thụ hết 15% lượt ghi tại đỉnh (`3.400 × 0,15 = 510 job/s`), tránh tồn đọng hàng đợi kéo dài.

## 6. Tổng kết: nguyên tắc ghép nối thực tế

```step
category: RECAP
short: Tổng kết ghép
scene: s6-recap
callout:
  kind: key-idea
  title: Bốn câu hỏi trước khi thêm thành phần
  vi: "Trước khi đặt thêm bất kỳ hộp nào vào sơ đồ, hãy hỏi: nó giải quyết nút thắt nào, tốn thêm bao nhiêu chi phí, có phương án đơn giản hơn không, và nó tạo ra điểm lỗi mới nào?"
whatChanged:
  - "+ Hoàn thiện kiến trúc Blog + Media cân bằng giữa p99, chi phí và độ tin cậy"
  - "~ Sẵn sàng chuyển sang các mẫu kiến trúc phân tán lớn hơn ở Phase 5"
telemetry:
  - label: "Đọc nóng"
    value: "LB → API → Cache"
  - label: "Ghi nặng"
    value: "Queue → Worker → Blob"
```

Ghép các thành phần thành hệ thống hoàn chỉnh là quá trình cân bằng liên tục giữa **Hiệu năng (SLO)**, **Độ tin cậy (không SPOF)** và **Chi phí vận hành**:

- Dùng **Cache** để chặn lưu lượng đọc lặp lại trước khi chạm Database.
- Dùng **Queue + Worker** để cách ly các tác vụ chậm/nặng khỏi luồng yêu cầu trực tiếp.
- Dùng **nhân bản ngang (LB + nhiều API/Worker)** cho các tầng không giữ trạng thái để chịu đỉnh và loại bỏ điểm lỗi đơn.
- Luôn kiểm chứng bằng số đo và mô phỏng dưới cả tải thường ngày lẫn tải đột biến.
