## 1. Tiến hóa kiến trúc là một dải liên tục, không phải lựa chọn nhị phân

```step
category: SETUP
short: Lộ trình v1 → vN
scene: s1-evolution-tape
callout:
  kind: key-idea
  title: Bắt đầu đơn giản, mở rộng theo nhu cầu thật
  vi: "Nhiều nền tảng lớn như Shopify, GitHub hay Stack Overflow đều khởi đầu bằng Monolith để tối đa tốc độ phát triển, chỉ tách nhỏ khi quy mô đội ngũ và tải thực sự đòi hỏi."
whatChanged:
  - "+ Trình bày 4 giai đoạn tiến hóa từ MVP Monolith đến Microservices"
  - "~ Mỗi giai đoạn giải quyết một ngưỡng tăng trưởng khác nhau về tải và nhân sự"
telemetry:
  - label: "v1 (MVP)"
    value: "< 10 kỹ sư"
  - label: "v4 (Micro)"
    value: "50+ kỹ sư"
```

Sai lầm phổ biến nhất khi thiết kế hệ thống mới là dựng ngay hàng chục Microservices từ ngày đầu tiên khi sản phẩm chưa có người dùng. Độ phức tạp của mạng phân tán, triển khai nhiều kho mã nguồn và gỡ lỗi xuyên dịch vụ sẽ làm chậm tốc độ ra mắt sản phẩm gấp nhiều lần.

Kiến trúc thực tế tiến hóa qua bốn nấc thang rõ rệt:
1. **MVP Monolith (v1):** Một kho mã nguồn, một Database, một quy trình triển khai đơn giản. Phù hợp nhóm dưới 10 người.
2. **Scaled Monolith (v2):** Vẫn một kho mã nguồn nhưng chạy nhiều instance sau Load Balancer, thêm Cache và Read Replica cho Database.
3. **Modular Monolith (v3):** Tổ chức mã nguồn thành các module nghiệp vụ độc lập giao tiếp qua giao diện rõ ràng, chuẩn bị sẵn ranh giới sạch.
4. **Microservices (v4):** Tách thành các dịch vụ triển khai độc lập, mỗi dịch vụ sở hữu Database riêng khi nhiều nhóm cùng phát triển song song.

## 2. Bán kính ảnh hưởng (Blast Radius) và ngưỡng kích hoạt tách dịch vụ

```step
category: PROBLEM
short: Bán kính lỗi
scene: s2-blast-radius
callout:
  kind: watch-out
  title: Khi một lỗi nhỏ kéo sập toàn ứng dụng
  vi: "Trong Monolith dùng chung một tiến trình cho 6 nhóm, một lỗi rò rỉ bộ nhớ ở module Báo cáo có thể làm ngừng luôn luồng Thanh toán."
whatChanged:
  - "+ Tách dịch vụ theo ranh giới năng lực nghiệp vụ (Orders, Catalog, Payments)"
  - "~ Mỗi dịch vụ sở hữu Database riêng để cô lập dữ liệu và chu kỳ triển khai"
telemetry:
  - label: "Phạm vi ảnh hưởng"
    value: "Cô lập theo service"
    tone: ok
  - label: "Độc lập triển khai"
    value: "Theo từng nhóm"
```

Khi công ty tăng lên 50–100 kỹ sư cùng sửa chung một kho mã nguồn Monolith, ba **ngưỡng kích hoạt (Scale Triggers)** sẽ xuất hiện:
- **Xung đột triển khai:** 6 nhóm phải chờ nhau ghép mã và phát hành chung một lịch; một lỗi nhỏ ở module Báo cáo làm cả hệ thống Checkout ngừng hoạt động.
- **Mở rộng tài nguyên không đồng đều:** Dịch vụ Xử lý ảnh cần nhiều CPU, trong khi dịch vụ Thanh toán cần ổn định cao nhưng không thể mở rộng riêng lẻ.
- **Ranh giới dữ liệu mờ nhạt:** Các bảng dữ liệu bị nối (JOIN) chéo giữa nhiều miền nghiệp vụ khác nhau.

Khi tách sang Microservices, nguyên tắc cốt lõi là **tách theo năng lực nghiệp vụ (Bounded Context)** và **mỗi service sở hữu Database riêng**. Không chia theo tầng kỹ thuật (như tách riêng UI service, DB service).

## 3. Cái giá của Microservices: nhiều chặng mạng và lan truyền lỗi

```step
category: PROBLEM
short: Đa chặng mạng
scene: s3-live-multihop
callout:
  kind: watch-out
  title: Gọi trong RAM (nanô-giây) thành gọi qua mạng (mili-giây)
  vi: "Một lời gọi hàm trong Monolith mất vài phần triệu giây và không bao giờ mất gói tin. Khi tách service, mỗi chặng qua mạng có thể chậm hoặc đứt bất cứ lúc nào."
whatChanged:
  - "+ Mô phỏng chuỗi gọi Gateway → Orders → Catalog & Payments"
  - "~ Từ giây 20, Payments chậm bất thường làm nghẽn ngược lên Orders và Gateway"
telemetry:
  - label: "Chuỗi gọi"
    value: "4–6 hops"
    tone: warn
  - label: "Rủi ro chính"
    value: "Lan truyền Timeout"
    tone: bad
```

Tách dịch vụ giải quyết vấn đề tổ chức nhóm nhưng đưa mạng máy tính vào giữa các lời gọi hàm. Một trang chi tiết đơn hàng giờ phải đi qua nhiều chặng (hop): `Gateway → Orders → Catalog` và `Gateway → Orders → Payments`.

Trong mô phỏng trực tiếp, hãy quan sát điều gì xảy ra khi tải tăng hoặc khi một dịch vụ phía sau (`Payments`) bị chậm đột ngột:
- Nếu **Orders** chờ vô hạn hoặc không có **Circuit Breaker / Timeout ngắn**, toàn bộ luồng xử lý của Orders bị kẹt khi đợi Payments.
- Dòng nghẽn dội ngược lên **API Gateway**, làm các tính năng không liên quan như xem danh mục sản phẩm cũng bị lỗi theo.

## 4. Phản mẫu Distributed Monolith và cách phòng tránh

```step
category: PITFALL
short: Bẫy Monolith
scene: s4-distributed-monolith
callout:
  kind: compare
  title: Tệ hơn cả Monolith truyền thống
  vi: "Nếu tách nhiều service nhưng vẫn dùng chung một Database hoặc bắt buộc phải triển khai đồng thời cùng nhau, bạn đã tạo ra Distributed Monolith: vừa chậm vì mạng, vừa phụ thuộc chặt như cũ."
whatChanged:
  - "+ Nhận diện 3 dấu hiệu của Distributed Monolith và giải pháp thay thế"
  - "~ Dùng bản đọc cục bộ cập nhật qua Event và Contract Test ở CI"
telemetry:
  - label: "Chung DB"
    value: "Cấm kỵ"
    tone: bad
  - label: "Giao tiếp lệch nhịp"
    value: "Event + Cache"
    tone: ok
```

Một bẫy rất dễ gặp khi chuyển sang Microservices là **Distributed Monolith** — hệ thống trông có vẻ phân tán nhưng thực chất vẫn khóa chặt vào nhau:

- **Dùng chung Database:** Service A đọc thẳng bảng của Service B. Chỉ cần B đổi tên cột là A hỏng ngay. **Cách sửa:** Giao tiếp qua API hoặc sự kiện bất đồng bộ.
- **Vòng lặp gọi liên tục (Chatty Calls):** Trang lịch sử đơn hàng gọi 20 lần sang Catalog để lấy tên sản phẩm. **Cách sửa:** Hỗ trợ API lấy theo lô (batch) hoặc lưu bản sao đọc cục bộ cập nhật qua sự kiện (Event).
- **Triển khai đồng bộ (Lockstep Deploy):** Phải phát hành cùng lúc 4 service vì thay đổi hợp đồng API. **Cách sửa:** Dùng **Contract Test** trong CI và chỉ thay đổi API theo hướng tương thích ngược.

## 5. Di chuyển an toàn từ Monolith bằng Strangler Fig

```step
category: TECHNIQUE
short: Strangler Fig
scene: s5-strangler-tape
activity: S5-01.A1
gate: optional
callout:
  kind: technique
  title: Không bao giờ viết lại toàn bộ từ đầu (Big Bang Rewrite)
  vi: "Mẫu Strangler Fig đặt một Gateway ở cửa ngõ để bóc tách từng tính năng sang service mới, vừa chạy song song vừa kiểm chứng an toàn trên tải thật."
whatChanged:
  - "+ Trình tự 5 bước bóc tách dịch vụ Thanh toán khỏi Monolith qua API Gateway"
  - "~ Cho phép quay lui (rollback) tức thì tại Gateway nếu service mới gặp sự cố"
telemetry:
  - label: "Chiến lược"
    value: "Từng phần"
    tone: ok
  - label: "Rủi ro chuyển đổi"
    value: "Thấp"
    tone: ok
```

Thay vì đóng băng phát triển tính năng trong 6 tháng để viết lại toàn bộ Monolith, hãy dùng mẫu **Strangler Fig** (cây tầm gửi):

1. Đặt **API Gateway** (hoặc Reverse Proxy) đứng trước Monolith làm cửa ngõ duy nhất.
2. Xây dựng service mới (ví dụ `Payments Service`) kèm Database riêng cho phần dữ liệu thanh toán.
3. Định tuyến thử nghiệm một tỷ lệ nhỏ lưu lượng `/payments/*` (Canary) hoặc chạy đối chiếu song song.
4. Khi số đo ổn định, chuyển toàn bộ lưu lượng `/payments/*` sang service mới.
5. Gỡ bỏ mã nguồn thanh toán cũ khỏi Monolith và lặp lại cho miền nghiệp vụ tiếp theo.

## 6. Gia cố chuỗi gọi Microservices chịu tải đột biến

```step
category: TECHNIQUE
short: Gia cố đa chặng
scene: s6-live-hardened
activity: S5-01.A2
gate: optional
callout:
  kind: good-to-know
  vi: "Chuỗi Microservices chỉ bền vững khi từng mắt xích không có điểm lỗi đơn (SPOF) và được bảo vệ bằng Timeout/Circuit Breaker."
whatChanged:
  - "+ Mở bài tập thiết kế: bảo vệ Gateway, Orders và đường nối tới Payments"
  - "~ Đáp ứng cả tải thường ngày 1.500 req/s lẫn đỉnh đột biến 3.000 req/s"
telemetry:
  - label: "Tải chuẩn"
    value: "1.500 req/s"
  - label: "Đỉnh đột biến"
    value: "3.000 req/s"
```

Trong một hệ thống Microservices nhiều chặng, thiết kế cấu hình không chỉ là tăng số lượng máy chủ, mà còn phải chặn lỗi lan truyền:
- Loại bỏ điểm lỗi đơn (SPOF) ở các tầng cửa ngõ như `Gateway` và dịch vụ điều phối `Orders`.
- Đảm bảo năng lực xử lý của `Orders` và `Catalog` đủ gánh đỉnh 3.000 req/s.
- Cấu hình bảo vệ đường gọi `orders-payments` để khi Payments chập chờn, chuỗi gọi không bị treo kéo dài.

## 7. Tổng kết tư duy tiến hóa kiến trúc

```step
category: RECAP
short: Tổng kết
scene: s7-recap
callout:
  kind: key-idea
  title: Ba câu hỏi trước khi tách Microservice
  vi: "Đội ngũ đã đủ lớn để vướng xung đột phát hành chưa? Ranh giới dữ liệu đã tách bạch chưa? Hạ tầng đã sẵn sàng cho giám sát phân tán và Circuit Breaker chưa?"
whatChanged:
  - "+ Tổng hợp quy tắc chọn Monolith vs Microservices theo giai đoạn"
  - "~ Nhấn mạnh: độ phức tạp kiến trúc phải đi sau nhu cầu thực tế"
telemetry:
  - label: "Giai đoạn đầu"
    value: "Modular Monolith"
  - label: "Di chuyển"
    value: "Strangler Fig"
```

Tóm tắt bốn nguyên tắc vàng khi tiến hóa kiến trúc:
- **Khởi đầu gọn:** Monolith hoặc Modular Monolith luôn là điểm xuất phát tốt nhất cho tốc độ phát triển sản phẩm.
- **Tách đúng lúc, đúng chỗ:** Chỉ tách theo năng lực nghiệp vụ khi có xung đột đội ngũ hoặc nhu cầu mở rộng tài nguyên độc lập.
- **Mỗi service một dữ liệu:** Tránh tuyệt đối Distributed Monolith dùng chung Database.
- **Di chuyển từng bước:** Dùng Strangler Fig qua API Gateway kết hợp Timeout, Circuit Breaker và Contract Test.
