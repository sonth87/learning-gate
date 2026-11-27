## 1. Chuyển từ chọn công nghệ trước sang xuất phát từ bài toán

```step
category: SETUP
short: Tư duy thiết kế
scene: s1-flow
callout:
  kind: key-idea
  title: Hiểu bài toán trước khi gọi tên công nghệ
  vi: "Thuộc lòng tên các mẫu kiến trúc không tạo ra thiết kế tốt. Mọi quyết định kỹ thuật phải bắt nguồn từ yêu cầu, ràng buộc và số liệu đo được."
whatChanged:
  - "+ Thiết lập luồng quyết định 4 bước: Yêu cầu → Ràng buộc → Đánh đổi → Kiến trúc"
telemetry:
  - label: "Câu hỏi đầu tiên"
    value: "Bài toán & Quy mô?"
    tone: ok
  - label: "Lỗi phổ biến"
    value: "Chọn công nghệ trước"
    tone: warn
```

Một lỗi phổ biến khi tiếp cận bài toán thiết kế là vội vàng liệt kê hàng loạt công nghệ như NoSQL, Kafka, Microservices ngay khi vừa nghe đề bài. Cách làm này dẫn đến thiết kế dư thừa quá mức cho sản phẩm nhỏ hoặc thiếu hụt ở đúng chỗ hệ thống thực sự chịu tải cao.

Khung tư duy thiết kế hệ thống đảo ngược trình tự đó: **làm rõ yêu cầu → xác định ràng buộc → liệt kê đánh đổi → chọn và bảo vệ phương án**. Ví dụ, một mạng xã hội mới có 100 người dùng với 2 kỹ sư chỉ cần một cơ sở dữ liệu SQL đơn giản để ra mắt trong vài tuần, thay vì dựng cụm phân tán tốn hàng tháng vận hành.

## 2. Thiết kế theo yêu cầu và ba nhóm ràng buộc cốt lõi

```step
category: TECHNIQUE
short: Ba ràng buộc
scene: s2-constraints
callout:
  kind: good-to-know
  title: Yêu cầu phi chức năng quyết định kiến trúc
  vi: "Yêu cầu chức năng cho biết hệ thống làm gì, còn yêu cầu phi chức năng (RPS, p99, độ sẵn sàng, ngân sách) mới là thứ định hình cấu trúc hạ tầng."
whatChanged:
  - "+ Phân loại ba nhóm ràng buộc: Kỹ thuật, Kinh doanh và Quy mô tải"
telemetry:
  - label: "Ràng buộc cứng"
    value: "Không thể vi phạm"
    tone: bad
  - label: "Ràng buộc mềm"
    value: "Linh hoạt theo ngữ cảnh"
    tone: ok
```

Trước khi vẽ sơ đồ, cần chốt hai loại yêu cầu:
- **Yêu cầu chức năng:** Các tính năng cốt lõi hệ thống phải thực hiện (ví dụ: rút gọn liên kết, chuyển hướng, thống kê lượt nhấn).
- **Yêu cầu phi chức năng và ràng buộc:** Chia thành ba trụ cột là **Kỹ thuật** (giới hạn I/O của DB, độ trễ mạng vật lý), **Kinh doanh** (ngân sách tối đa, thời hạn ra mắt, quy mô đội ngũ, tuân thủ dữ liệu) và **Quy mô tải** (tỉ lệ đọc/ghi, đỉnh lưu lượng so với trung bình).

Chỉ cần phép tính nhanh: `40 writes/s`, `4.000 reads/s` và `3 TB` dữ liệu sau 5 năm cho thấy một máy chủ SQL kết hợp bộ nhớ đệm đọc là đủ, tránh chia mảnh sớm không cần thiết.

## 3. Hướng tiếp cận Top-Down so với Bottom-Up

```step
category: MECHANISM
short: Hai hướng
scene: s3-approaches
callout:
  kind: compare
  title: Chọn hướng theo bản chất bài toán
  vi: "Top-Down giữ bức tranh toàn cảnh trước khi đi vào chi tiết; Bottom-Up chốt mô hình dữ liệu cốt lõi trước. Thực tế thường kết hợp cả hai."
whatChanged:
  - "~ Đối chiếu quy trình Top-Down và Bottom-Up theo từng loại bài toán"
telemetry:
  - label: "Phỏng vấn & Hệ mới"
    value: "Ưu tiên Top-Down"
    tone: ok
  - label: "Bài toán lõi dữ liệu"
    value: "Kiểm chứng Bottom-Up"
    tone: ok
```

Có hai cách triển khai bản thiết kế:
- **Top-Down:** Bắt đầu từ các khối lớn (Gateway, Service, Cache, Database), định nghĩa đường đi dữ liệu và hợp đồng API rồi mới phóng đại vào các điểm nóng. Hướng này giúp kiểm soát thời gian tốt và không bị sa lầy vào chi tiết phụ.
- **Bottom-Up:** Bắt đầu từ mô hình dữ liệu, thuật toán lõi rồi mới xây tầng API và mở rộng ra ngoài. Hướng này hữu ích khi nút thắt nằm ở cấu trúc lưu trữ đặc thù.

## 4. Mức thu phóng HLD: bản đồ dịch vụ và hợp đồng giao tiếp

```step
category: TECHNIQUE
short: Thu phóng HLD
scene: s4-zoom-hld
callout:
  kind: key-idea
  title: HLD là bản đồ và đánh đổi
  vi: "High-Level Design trả lời câu hỏi hệ thống gồm những hộp nào, dữ liệu chảy ra sao và vì sao chọn đánh đổi này thay vì phương án khác."
whatChanged:
  - "+ Phóng đại mức HLD: bản đồ dịch vụ và hợp đồng ở ranh giới"
telemetry:
  - label: "Đơn vị của HLD"
    value: "Service, Queue, Store"
    tone: ok
  - label: "Giao điểm HLD–LLD"
    value: "API & Schema Contract"
    tone: ok
```

Cùng một hệ thống nhưng có hai mức phóng đại rõ rệt. Ở mức **High-Level Design (HLD)**, ta nhìn bản đồ các dịch vụ, ranh giới dữ liệu, nơi đặt bộ nhớ đệm và các quyết định đánh đổi về độ trễ, tính nhất quán hay chi phí.

## 5. Mức thu phóng LLD: bên trong Service và thực hành cấu hình

```step
category: TECHNIQUE
short: Thu phóng LLD
scene: s5-zoom-lld
activity: S6-01.A1
gate: optional
callout:
  kind: watch-out
  title: Tránh thiết kế sai mức độ chi tiết
  vi: "Lội quá sâu vào tên cột SQL khi chưa chốt xong luồng tổng thể, hoặc chỉ vẽ hộp chung chung khi cần giải quyết tranh chấp dữ liệu đều làm bản thiết kế mất trọng tâm."
whatChanged:
  - "+ Phóng đại mức LLD: schema, máy trạng thái và trường hợp biên"
  - "+ Thực hành chuyển bảng yêu cầu thành cấu hình thực tế"
telemetry:
  - label: "Đơn vị của LLD"
    value: "Bảng, Trạng thái, Biên"
    tone: ok
  - label: "Mục tiêu bài tập"
    value: "p99 ≤ 100 ms, ≤ 1,20$/h"
    tone: ok
```

Khi phóng đại vào bên trong một hộp, ta chuyển sang **Low-Level Design (LLD)**: thiết kế schema bảng, chỉ mục, máy trạng thái đơn hàng, xử lý trùng lặp (Idempotency) và giới hạn hàng đợi. Chỗ hai mức gặp nhau chính là **hợp đồng giao tiếp (Contract)** ở ranh giới dịch vụ. Hãy hoàn thành bài tập bên cạnh để thực hành chuyển một bảng yêu cầu và ràng buộc thành cấu hình đạt chuẩn.

## 6. Tổng kết khung tư duy thiết kế hệ thống

```step
category: RECAP
short: Tổng kết
scene: s1-flow
callout:
  kind: good-to-know
  title: Luôn bắt đầu từ bài toán và số liệu
  vi: "Làm rõ yêu cầu, khóa chặt các ràng buộc, so sánh đánh đổi và thu phóng đúng mức HLD/LLD giúp mọi thiết kế đều có căn cứ kỹ thuật rõ ràng."
whatChanged:
  - "~ Tóm tắt quy trình 4 bước: Yêu cầu → Ràng buộc → Đánh đổi → Kiến trúc"
telemetry:
  - label: "Quy trình chuẩn"
    value: "4 bước liên hoàn"
    tone: ok
  - label: "Mức thiết kế"
    value: "HLD + LLD"
    tone: ok
```

Mọi bản thiết kế tốt đều bắt nguồn từ bài toán cụ thể, không phải từ danh sách công nghệ thời thượng. Khi nắm vững cách phân loại ràng buộc, chọn đúng hướng Top-Down hoặc Bottom-Up và biết lúc nào cần thu phóng HLD/LLD, bạn có thể tự tin giải quyết các hệ thống từ quy mô nhỏ đến hàng triệu người dùng.
