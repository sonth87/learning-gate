## 1. Không có kiến trúc hoàn hảo, chỉ có đánh đổi phù hợp ngữ cảnh

```step
category: SETUP
short: Tư duy đánh đổi
scene: s2-matrix
callout:
  kind: key-idea
  title: Mỗi lựa chọn đều có cái giá đi kèm
  vi: "Kỹ năng phân biệt thiết kế vững vàng nằm ở khả năng liệt kê các phương án thay thế, phân tích ưu nhược điểm và giải thích vì sao chấp nhận sự đánh đổi đó trong bối cảnh hiện tại."
whatChanged:
  - "+ Dựng ma trận đánh đổi theo 4 trục: Consistency, Availability, Latency và Cost"
telemetry:
  - label: "Số phương án cần xét"
    value: "≥ 2 phương án"
    tone: ok
  - label: "Căn cứ quyết định"
    value: "Bối cảnh & Số liệu"
    tone: ok
```

Trong kiến trúc phần mềm, không tồn tại giải pháp tối ưu cho mọi chiều cùng lúc. Muốn dữ liệu nhất quán tuyệt đối thì phải chấp nhận độ trễ cao hơn hoặc giảm khả năng phục vụ khi đứt mạng; muốn độ trễ cực thấp thì phải đầu tư thêm bộ nhớ đệm và hạ tầng phân tán; muốn mở rộng độc lập nhiều đội ngũ thì phải gánh thêm độ phức tạp vận hành.

Thay vì chọn một công nghệ chỉ vì nhiều tập đoàn lớn đang dùng, kiến trúc sư cần đặt ít nhất hai phương án lên bàn cân và đối chiếu trực tiếp với ràng buộc thực tế của dự án.

## 2. Cặp đánh đổi Consistency so với Availability (Định lý CAP)

```step
category: MECHANISM
short: CP hay AP?
scene: s2-matrix
callout:
  kind: compare
  title: Chọn theo mức độ thiệt hại nghiệp vụ
  vi: "Dữ liệu tài chính chọn Consistency (CP) vì sai số gây mất tiền; dữ liệu tương tác mạng xã hội chọn Availability (AP) vì phản hồi nhanh quan trọng hơn lệch vài đơn vị."
whatChanged:
  - "~ Ánh xạ thanh toán sang CP và lượt thích sang AP"
telemetry:
  - label: "Thanh toán / Tồn kho"
    value: "Ưu tiên CP"
    tone: warn
  - label: "Lượt thích / Bảng tin"
    value: "Ưu tiên AP"
    tone: ok
```

Theo định lý **CAP**, khi xảy ra chia cắt mạng (Partition), hệ thống phân tán phải chọn giữa tính nhất quán (**CP**) hoặc tính sẵn sàng (**AP**):
- **Hệ thống thanh toán, trừ tồn kho:** Bắt buộc chọn **CP** (từ chối ghi nếu không đồng bộ được) để tránh bán trùng hoặc sai số dư.
- **Bộ đếm lượt thích, bảng tin mạng xã hội:** Chọn **AP** để luôn phản hồi dưới `10 ms`, chấp nhận đồng bộ trễ 1–2 giây.

## 3. Cặp đánh đổi Latency–Cost và Simplicity–Scalability

```step
category: TECHNIQUE
short: Cost & Simple
scene: s2-matrix
callout:
  kind: good-to-know
  title: Đo tỷ suất lợi ích trên chi phí
  vi: "Đừng tối ưu độ trễ vượt quá ngưỡng người dùng cần thiết, và đừng dựng Microservices khi đội ngũ chỉ có 3 kỹ sư."
whatChanged:
  - "~ Đối chiếu ngưỡng độ trễ mục tiêu với ngân sách vận hành"
  - "~ Chọn Modular Monolith cho sản phẩm mới cần ra mắt nhanh"
telemetry:
  - label: "Web tương tác"
    value: "p99 < 200 ms"
    tone: ok
  - label: "Đội 3 kỹ sư"
    value: "Modular Monolith"
    tone: ok
```

Hai trục đánh đổi tiếp theo quyết định trực tiếp tính khả thi của dự án:
- **Latency so với Cost:** Tốc độ luôn đi kèm chi phí. Hãy chốt ngưỡng độ trễ mục tiêu (dưới 50 ms cho thời gian thực, dưới 200 ms cho web tương tác) trước khi đầu tư thêm hạ tầng.
- **Simplicity so với Scalability:** Với đội ngũ 3 kỹ sư và mục tiêu ra mắt trong 6 tuần, **Modular Monolith** giúp đi nhanh và ít lỗi vận hành hơn hẳn việc dựng Microservices ngay từ đầu.

## 4. So sánh A/B hai phương án trên cùng một mức tải

```step
category: PROBLEM
short: So sánh A/B
scene: s1-ab
live: ab-tradeoff
activity: S6-03.A1
gate: optional
callout:
  kind: watch-out
  title: Đừng dùng búa tạ cho bài toán đọc nhiều
  vi: "Khi Database quá tải do đọc lặp lại, nâng cấp phần cứng DB (Phương án A) thường đắt gấp nhiều lần so với mở rộng dung lượng Cache (Phương án B) trên cùng mức tải."
whatChanged:
  - "~ Chạy tải 3.000 req/s (85% đọc) qua mô hình Order API → Cache → Catalog DB"
  - "~ Catalog DB (μ = 1.600 req/s) bão hòa vì Cache mới chứa 10.000 / 60.000 key"
telemetry:
  - label: "Phương án A (Scale DB ×3)"
    value: "> 2,40 USD/giờ"
    tone: bad
  - label: "Phương án B (Cache 60k)"
    value: "1,32 USD/giờ"
    tone: ok
```

Trên mô hình thực nghiệm, hệ thống danh mục chịu tải `3.000 req/s` với `85%` lượt đọc trên tập `60.000` sản phẩm nóng. Vì Catalog Cache chỉ chứa `10.000` key, quá nhiều lượt miss đổ xuống Catalog DB khiến DB quá tải.

## 5. Đối chiếu kết quả Phương án A (Scale DB) và Phương án B (Cache 60k)

```step
category: TECHNIQUE
short: Chốt phương án
scene: s1-ab
callout:
  kind: key-idea
  title: Tối ưu đúng điểm nghẽn đọc bằng Cache
  vi: "Mở rộng Cache lên 60.000 key chặn phần lớn lượt đọc lặp lại xuống DB, đạt SLO p99 ≤ 110 ms với chi phí chỉ 1,32 USD/giờ."
whatChanged:
  - "+ Phương án B tiết kiệm ~45% chi phí/giờ so với Phương án A"
telemetry:
  - label: "Ngân sách tối đa"
    value: "≤ 1,45 USD/giờ"
    tone: ok
  - label: "Tiết kiệm đạt được"
    value: "~45% chi phí"
    tone: ok
```

Ta có hai lựa chọn rõ ràng: **Phương án A** giữ nguyên Cache và nâng cỡ DB lên `×3` (chi phí vượt `2,40 USD/giờ`), hoặc **Phương án B** mở rộng Cache lên `60.000` key để chặn phần lớn lượt đọc xuống DB (chi phí chỉ `1,32 USD/giờ`). Hãy thực hành trong bài tập để tự kiểm chứng kết quả A/B.

## 6. Ghi lại và bảo vệ quyết định bằng Architecture Decision Record (ADR)

```step
category: RECAP
short: Viết ADR chuẩn
scene: s3-adr
callout:
  kind: good-to-know
  title: Lưu lại lý do để đội ngũ hiểu bối cảnh
  vi: "Một bản ADR ngắn gọn gồm 4 mục (Context, Options, Decision, Consequences) giúp bảo vệ quyết định bằng số liệu và ghi rõ những nhược điểm chấp nhận đánh đổi."
whatChanged:
  - "+ Hoàn thiện mẫu ADR ngắn cho quyết định chọn Phương án B"
telemetry:
  - label: "Mức tiết kiệm đạt được"
    value: "~45% chi phí/giờ"
    tone: ok
  - label: "Hệ quả cần quản lý"
    value: "Cache Invalidation"
    tone: warn
```

Sau khi chọn phương án tối ưu từ phép so sánh A/B, kỹ sư cần ghi lại quyết định vào **Architecture Decision Record (ADR)** ngắn gọn để làm tài liệu chung cho cả đội:

- **Context:** Tải 3.000 req/s, DB nghẽn, trần ngân sách `≤ 1,45 USD/giờ`.
- **Options Considered:** Phương án A (nâng DB ×3, tốn > 2,40 USD/giờ) so với Phương án B (Cache 60.000 key, tốn 1,32 USD/giờ).
- **Decision:** Chọn Phương án B vì đạt `p99 ≤ 110 ms` và tiết kiệm khoảng 45% chi phí.
- **Consequences:** Chấp nhận thêm độ phức tạp đồng bộ và xóa Cache khi cập nhật giá sản phẩm.
