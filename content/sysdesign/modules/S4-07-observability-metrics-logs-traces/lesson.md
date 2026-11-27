## 1. Vì sao CPU thấp nhưng người dùng vẫn báo chậm?

```step
category: SETUP
short: Triệu chứng
scene: s1-symptom
callout:
  kind: key-idea
  title: Đo trải nghiệm người dùng thay vì chỉ nhìn tài nguyên máy
  vi: "CPU máy chủ chỉ 35% không chứng minh hệ thống nhanh: request có thể đang kẹt chờ API bên ngoài hoặc hàng đợi kết nối."
whatChanged:
  - "+ Thiết lập luồng Checkout Service → Inventory, Fraud API, Order DB"
  - "~ Người mua báo trang thanh toán chậm dù CPU Checkout chỉ 35%"
telemetry:
  - label: "CPU Checkout"
    value: "35%"
    tone: ok
  - label: "p99 thực tế"
    value: "> 500 ms"
    tone: bad
```

Khi vận hành hệ thống phân tán, một tình huống rất hay gặp là người dùng phàn nàn trang thanh toán chậm, nhưng biểu đồ CPU và RAM của máy chủ ứng dụng vẫn bình thường. Nếu chỉ theo dõi tài nguyên hạ tầng, đội ngũ kỹ thuật sẽ không biết lỗi nằm ở đâu.

**Observability** là khả năng hiểu trạng thái bên trong hệ thống thông qua các tín hiệu phát ra bên ngoài: **Metrics** (số đo tổng hợp cho biết chuyện gì đang xảy ra), **Logs** (sự kiện chi tiết cho biết vì sao) và **Traces** (đường đi qua nhiều dịch vụ cho biết chậm ở chặng nào).

## 2. Bộ chỉ số RED và phân vị p99 trên bảng điều khiển

```step
category: TECHNIQUE
short: RED & p99
scene: s2-red-dashboard
callout:
  kind: compare
  title: Trung bình che giấu đuôi chậm — hãy nhìn p95 và p99
  vi: "Nếu 99 lượt mất 50 ms và 1 lượt mất 5 giây, trung bình chỉ là 100 ms. Phân vị p99 mới phơi bày trải nghiệm của nhóm người dùng chậm nhất."
whatChanged:
  - "+ Theo dõi bộ chỉ số RED (Rate, Errors, Duration) cho cả 4 dịch vụ"
  - "~ Khoanh vùng Fraud API có Duration p99 cao vượt trội (480 ms)"
telemetry:
  - label: "Chỉ số dịch vụ"
    value: "RED Method"
    tone: ok
  - label: "Dịch vụ nghi vấn"
    value: "Fraud API"
    tone: bad
```

Để giám sát từng dịch vụ một cách nhất quán, phương pháp **RED** đo ba đại lượng cốt lõi: **Rate** (số yêu cầu mỗi giây), **Errors** (tỷ lệ lỗi) và **Duration** (độ trễ theo phân vị p50, p95, p99).

Nhìn vào bảng điều khiển RED của luồng thanh toán: cả `Inventory Service` và `Order DB` đều có p99 dưới 30 ms, trong khi `Checkout Service` có p99 trên 500 ms dù bản thân nó xử lý chỉ mất 12 ms. Manh mối chỉ thẳng về `Fraud API`.

## 3. Distributed Tracing và sự cố Deploy cấu hình lỗi

```step
category: PROBLEM
short: Trace & Deploy
scene: s3-trace-live
live: checkout-trace
activity: S4-07.A2
gate: optional
callout:
  kind: watch-out
  title: Trace Waterfall chỉ ra 85%+ thời gian nằm ở Fraud API
  vi: "Gắn trace_id ở API Gateway giúp ghép các span lại thành thác nước; kết hợp mốc deploy giúp khoanh vùng ngay nguyên nhân tăng lỗi."
whatChanged:
  - "~ Giây 0..29: Fraud API chiếm phần lớn độ trễ p99 của Checkout"
  - "~ Giây 30: Deploy cấu hình lỗi (40% error) → Giây 45: Rollback"
telemetry:
  - label: "Tải Checkout"
    value: "600 req/s"
  - label: "Mốc Rollback"
    value: "t = 45 s"
    tone: ok
```

Khi `API Gateway` gắn một `trace_id` duy nhất cho mỗi giao dịch và truyền qua HTTP header, hệ thống thu thập được biểu đồ **Trace Waterfall** cho thấy `Fraud API` chiếm phần lớn thời gian chờ của toàn bộ quá trình thanh toán.

Trong mô phỏng trực tiếp này, ngoài độ trễ cao sẵn có của `Fraud API`, ở giây 30 một bản thay đổi cấu hình lỗi được đẩy lên làm tỷ lệ lỗi vọt lên 40%, trước khi được rollback ở giây 45. Quan sát biểu đồ độ trễ và tỷ lệ lỗi theo thời gian để thấy tác động tức thì của thay đổi cấu hình.

## 4. Cảnh báo theo SLO và Error Budget Burn Rate

```step
category: TECHNIQUE
short: SLO & Alert
scene: s4-slo-alert
activity: S4-07.A1
gate: optional
callout:
  kind: technique
  title: Cảnh báo theo triệu chứng người dùng cảm nhận, không spam CPU
  vi: "Đặt ngưỡng SLO rõ ràng (ví dụ p99 ≤ 300 ms, khả dụng 99,9%) và chỉ gọi trực ban khi tốc độ đốt Error Budget tăng đột biến."
whatChanged:
  - "+ Chuyển quy tắc cảnh báo từ ngưỡng CPU sang SLO Error Budget Burn Rate"
  - "+ Gắn Runbook hành động cụ thể cho từng cảnh báo P0/P1"
telemetry:
  - label: "SLO khả dụng"
    value: "99,9% / tháng"
    tone: ok
  - label: "Error Budget"
    value: "43,2 phút"
```

Nếu đặt cảnh báo mỗi khi CPU vượt 80%, kỹ sư trực ban sẽ nhận hàng trăm thông báo giả vào giờ cao điểm và dần bỏ qua cả những cảnh báo thật.

Thay vào đó, hãy định nghĩa **SLI** (chỉ số đo thực tế như tỷ lệ thành công hoặc p99) và **SLO** (mục tiêu cam kết, ví dụ 99,9% thành công trong 30 ngày). Phần dư 0,1% là **Error Budget**. Khi một thay đổi cấu hình làm lỗi vọt lên 40%, tốc độ đốt Error Budget tăng gấp hàng trăm lần bình thường, kích hoạt cảnh báo chính xác trong vòng vài chục giây.

## 5. Log có cấu trúc với Correlation ID

```step
category: TECHNIQUE
short: Log có trace_id
scene: s5-recap
callout:
  kind: good-to-know
  title: Gắn trace_id vào mọi dòng log để truy vết nhanh
  vi: "Thay vì tìm kiếm văn bản tự do trên hàng triệu dòng log, cấu trúc JSON kèm trace_id giúp lọc trọn vẹn ngữ cảnh lỗi của một request trong vài giây."
whatChanged:
  - "+ Chuẩn hoá log dạng JSON với các trường level, service, trace_id và error_code"
telemetry:
  - label: "Định dạng chuẩn"
    value: "JSON + trace_id"
    tone: ok
```

Khi Trace đã chỉ ra `Fraud API` là chặng gây chậm hoặc trả mã `500`, kỹ sư cần biết chính xác hàm nào đang văng ngoại lệ. Log văn bản thuần như `Error connecting` gần như vô nghĩa khi có hàng nghìn request chạy song song; ngược lại, log JSON có `trace_id`, `user_id` và `duration_ms` cho phép ghép nối tức thì với span lỗi trên biểu đồ Trace.

## 6. Tổng kết: Phản ứng sự cố và Postmortem không đổ lỗi

```step
category: RECAP
short: Tóm tắt
scene: s5-recap
activity: S4-07.A3
gate: required
callout:
  kind: key-idea
  title: "Quy trình khép kín: Phát hiện → Khoanh vùng → Khôi phục → Học hỏi"
  vi: "Dùng RED metrics để phát hiện sớm, Trace để tìm đúng dịch vụ, Log có trace_id để đọc chi tiết lỗi và Postmortem để gia cố hệ thống."
whatChanged:
  - "+ Hoàn thành bộ ba Observability, cảnh báo SLO và Postmortem"
telemetry:
  - label: "Ba trụ cột"
    value: "Metric · Log · Trace"
    tone: ok
  - label: "Văn hóa"
    value: "Blameless Postmortem"
    tone: ok
```

Sau khi khôi phục dịch vụ (ví dụ rollback bản cấu hình lỗi), bước cuối cùng là viết **Postmortem không đổ lỗi**. Thay vì truy tìm cá nhân bấm nút deploy, cả nhóm cùng dựng lại dòng thời gian sự cố (khi nào lỗi bắt đầu, khi nào phát hiện, khi nào phục hồi) và thống nhất các hành động kỹ thuật cụ thể như bật triển khai Canary, thêm cảnh báo Burn Rate và làm mới cấu hình tức thì khi rollback.
