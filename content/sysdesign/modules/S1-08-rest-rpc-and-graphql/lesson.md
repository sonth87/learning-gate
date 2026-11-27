## 1. Hợp đồng giao tiếp: ba cách thiết kế API

```step
category: SETUP
short: Hợp đồng API
scene: s1-contract
callout:
  kind: key-idea
  title: Đơn vị chi phí trên mạng di động
  vi: "Trên mạng di động 4G có RTT 100–150 ms, số vòng khứ hồi (Round Trip) quyết định độ trễ màn hình nhiều hơn tốc độ xử lý vài mili-giây ở backend."
whatChanged:
  - "+ Thiết bị di động kết nối qua API Gateway tới 3 service nội bộ"
  - "~ Mỗi lượt gọi qua mạng ngoài chịu 1 RTT mạng di động"
telemetry:
  - label: "RTT mạng 4G"
    value: "120 ms"
  - label: "Mạng nội bộ DC"
    value: "1 ms"
```

Khi ứng dụng di động hiển thị màn hình hồ sơ cá nhân gồm thông tin người dùng, đơn hàng gần nhất và danh sách sản phẩm đã xem, thiết bị cần lấy dữ liệu từ ba dịch vụ phía sau: Users, Orders và Items.

Để client và server hiểu nhau, hai bên cần một **hợp đồng API** quy định định dạng yêu cầu, kiểu dữ liệu trả về và cách xử lý lỗi. Ba phong cách phổ biến nhất hiện nay là **REST**, **GraphQL** và **gRPC**.

Trên mạng nội bộ trung tâm dữ liệu, một vòng khứ hồi (RTT) chỉ tốn khoảng 1 ms. Nhưng từ điện thoại dùng mạng 4G tới máy chủ, mỗi RTT tốn từ 100 đến 150 ms. Vì vậy, cùng một màn hình nhưng cách thiết kế API đòi hỏi 3 vòng khứ hồi sẽ chậm hơn gấp ba lần cách chỉ cần 1 vòng khứ hồi.

## 2. REST: tài nguyên rõ ràng và tận dụng cache HTTP

```step
category: TECHNIQUE
short: Mô hình REST
scene: s2-rest
callout:
  kind: good-to-know
  vi: "REST tận dụng tốt chuẩn HTTP sẵn có: GET có thể cache ở CDN và trình duyệt mà không cần viết thêm hạ tầng riêng."
whatChanged:
  - "+ Thiết bị gọi tuần tự các endpoint tài nguyên GET /users, /orders, /items"
  - "~ Dữ liệu trả về dạng JSON chuẩn dễ đọc và dễ cache theo URL"
telemetry:
  - label: "Số endpoint"
    value: "3"
  - label: "Định dạng"
    value: "JSON"
```

**REST (Representational State Transfer)** tổ chức hệ thống quanh các **tài nguyên (Resource)** có địa chỉ URL cố định và thao tác bằng các động từ HTTP chuẩn: `GET` để đọc, `POST` để tạo, `PUT` hoặc `PATCH` để cập nhật, `DELETE` để xóa.

Điểm mạnh lớn nhất của REST là sự đơn giản và khả năng tương thích với toàn bộ hạ tầng web. Mọi trình duyệt, proxy và CDN đều hiểu mã trạng thái HTTP (`200`, `404`, `500`) và tiêu đề `Cache-Control`. Nếu một endpoint `GET /products/42` ít thay đổi, CDN có thể lưu đệm trực tiếp mà không cần chạm tới backend.

Tuy nhiên, cấu trúc cố định của từng tài nguyên lại bộc lộ hạn chế khi màn hình di động cần gom dữ liệu từ nhiều tài nguyên khác nhau trong một lần mở trang.

## 3. Vấn đề của REST trên 4G: nhiều round trip và dư payload

```step
category: PROBLEM
short: Chi phí REST 4G
scene: s3-rest-waterfall
activity: S1-08.A1
gate: optional
callout:
  kind: watch-out
  title: Gọi nối tiếp và Over-fetching
  vi: "Gọi 3 endpoint nối tiếp trên mạng 4G tạo ra 360 ms chỉ riêng tiền mạng, đồng thời tải về hàng chục KB trường dữ liệu không hiển thị."
whatChanged:
  - "+ Waterfall hiển thị 3 chặng REST nối tiếp trên đường truyền 4G"
  - "~ Tổng thời gian tải màn hình lên tới 405 ms dù server chỉ mất 45 ms"
telemetry:
  - label: "Số round trip"
    value: "3 RTT"
    tone: bad
  - label: "Payload thừa"
    value: "48 KB"
    tone: warn
  - label: "Thời gian màn hình"
    value: "405 ms"
    tone: bad
```

Khi màn hình cần biết danh sách đơn hàng của người dùng rồi mới lấy chi tiết từng sản phẩm trong đơn, client dùng REST thường rơi vào cảnh **gọi nối tiếp (Sequential Round Trips)**:

| Chặng gọi REST | RTT mạng | Xử lý server | Payload trả về |
|---|---|---|---|
| `GET /users/me` | 120 ms | 15 ms | 12 KB (dùng 2 KB) |
| `GET /orders?user=me` | 120 ms | 15 ms | 24 KB (dùng 4 KB) |
| `GET /items?ids=...` | 120 ms | 15 ms | 20 KB (dùng 2 KB) |
| **Tổng cộng** | **360 ms** | **45 ms** | **56 KB (thừa 48 KB)** |

Hiện tượng trả về cả bản ghi lớn trong khi giao diện chỉ dùng vài trường gọi là **Over-fetching**. Trên mạng di động băng thông hẹp và gói tin dễ rớt, gửi thừa 48 KB JSON làm tốn pin, tốn dung lượng và kéo dài thời gian dựng màn hình.

## 4. GraphQL: hỏi đúng thứ cần trong một round trip

```step
category: TECHNIQUE
short: GraphQL 1 RTT
scene: s4-graphql-waterfall
callout:
  kind: key-idea
  title: Gom truy vấn ở Gateway
  vi: "GraphQL chuyển các bước gọi nối tiếp từ mạng ngoài 4G (120 ms/chặng) vào mạng nội bộ trung tâm dữ liệu (1 ms/chặng)."
whatChanged:
  - "+ Client gửi 1 query GraphQL duy nhất chỉ định rõ các trường cần lấy"
  - "~ Thời gian màn hình giảm từ 405 ms xuống còn 167 ms, payload còn 8 KB"
telemetry:
  - label: "Số round trip"
    value: "1 RTT"
    tone: ok
  - label: "Payload thực"
    value: "8 KB"
    tone: ok
  - label: "Thời gian màn hình"
    value: "167 ms"
    tone: ok
```

**GraphQL** giải quyết cả hai vấn đề trên bằng một endpoint duy nhất. Thay vì server quyết định hình dạng JSON trả về, **client gửi câu truy vấn khai báo chính xác các trường mình cần** (tên người dùng, mã đơn hàng, tên sản phẩm).

Lúc này, GraphQL Gateway đóng vai trò điều phối: nó nhận 1 request từ điện thoại (1 RTT = 120 ms), sau đó tự gọi ba service Users, Orders, Items qua mạng nội bộ (mỗi chặng nội bộ chỉ 1 ms + 15 ms xử lý). Toàn bộ thời gian màn hình rút xuống còn khoảng 167 ms và payload chỉ còn 8 KB vừa khít nhu cầu hiển thị.

## 5. Đánh đổi của GraphQL: truy vấn nặng, N+1 và cache HTTP

```step
category: MECHANISM
short: Đánh đổi GraphQL
scene: s5-graphql-tradeoff
callout:
  kind: compare
  title: Linh hoạt đi kèm trách nhiệm bảo vệ
  vi: "Mở quyền truy vấn tự do cho client đồng nghĩa server có thể nhận câu hỏi lồng nhau quá sâu hoặc phát sinh hàng trăm truy vấn N+1."
whatChanged:
  - "+ Bổ sung giới hạn độ sâu (Depth Limit) và DataLoader gom truy vấn"
  - "~ Đánh đổi khả năng cache tự động theo URL của HTTP GET"
telemetry:
  - label: "Độ sâu tối đa"
    value: "5 tầng"
  - label: "HTTP CDN Cache"
    value: "Khó hơn"
    tone: warn
```

Sự linh hoạt của GraphQL mang lại ba cái giá cần kiểm soát:

1. **Truy vấn quá sâu hoặc quá đắt:** Client có thể viết câu hỏi lồng nhau nhiều tầng (`user -> friends -> posts -> comments -> author`), làm CPU và Database quá tải. Hệ thống bắt buộc phải đặt giới hạn độ sâu (Depth Limit) và điểm chi phí tối đa cho mỗi truy vấn.
2. **Lỗi N+1 ở Resolver:** Nếu một đơn hàng có 20 sản phẩm và resolver gọi từng truy vấn riêng lẻ xuống Items service, một request sẽ nhân thành 21 lượt gọi nội bộ. Cần dùng mẫu gom lô theo khung thời gian ngắn (**DataLoader**) để gộp thành 1 truy vấn hàng loạt.
3. **Cache ở lớp HTTP:** Do phần lớn yêu cầu GraphQL gửi qua phương thức `POST` tới cùng một URL `/graphql`, CDN truyền thống không thể cache tự động theo đường dẫn như REST `GET`.

## 6. Trong trung tâm dữ liệu: gRPC và Protobuf nhị phân

```step
category: TECHNIQUE
short: gRPC nội bộ
scene: s6-grpc-waterfall
callout:
  kind: technique
  title: Giao tiếp giữa các service
  vi: "Giữa các microservice trong cùng Data Center, gRPC dùng HTTP/2 và Protobuf nhị phân giúp giảm kích thước gói tin và CPU giải mã."
whatChanged:
  - "+ Giao tiếp nội bộ chuyển từ JSON sang Protobuf nhị phân trên HTTP/2"
  - "~ Kích thước payload giảm còn 2 KB, thời gian giải mã dưới 1 ms"
telemetry:
  - label: "Định dạng"
    value: "Protobuf"
    tone: ok
  - label: "Payload nội bộ"
    value: "2 KB"
    tone: ok
```

Khi Gateway gọi sang Users, Orders hay Items trong cùng trung tâm dữ liệu, trình duyệt không tham gia vào chặng này. Ở đây, **gRPC** là lựa chọn phổ biến hơn REST và GraphQL.

gRPC sử dụng **Protocol Buffers (Protobuf)** để mã hóa dữ liệu thành nhị phân gọn nhẹ thay vì văn bản JSON. Nhờ không phải lặp lại tên trường cho mỗi bản ghi và chạy trên **HTTP/2** (ghép nhiều luồng trên một kết nối TCP duy nhất), payload giảm 3–4 lần và chi phí CPU giải mã giảm đáng kể.

Ngoài ra, tệp định nghĩa `.proto` đóng vai trò hợp đồng kiểu dữ liệu chặt chẽ, tự động sinh mã client/server cho nhiều ngôn ngữ khác nhau. Tuy vậy, dữ liệu nhị phân khó đọc trực tiếp khi kiểm tra gói tin mạng nếu thiếu công cụ giải mã đi kèm.

## 7. Phân trang con trỏ và tương thích phiên bản API

```step
category: PITFALL
short: Con trỏ & API
scene: s7-cursor-version
callout:
  kind: watch-out
  title: Tránh OFFSET trên bảng lớn
  vi: "Dùng OFFSET 1000000 buộc Database đọc và bỏ qua 1 triệu dòng trước khi lấy 20 dòng tiếp theo. Hãy dùng con trỏ (Cursor) dựa trên khóa đã đánh chỉ mục."
whatChanged:
  - "+ Chuyển phân trang từ OFFSET sang Cursor (after_id + limit)"
  - "~ Giữ tương thích ngược bằng cách thêm trường mới, không sửa trường cũ"
telemetry:
  - label: "Độ phức tạp Offset"
    value: "O(N)"
    tone: bad
  - label: "Độ phức tạp Cursor"
    value: "O(1) + Index"
    tone: ok
```

Hai chi tiết thiết kế ảnh hưởng trực tiếp tới hiệu năng và độ ổn định lâu dài của mọi API:

**Phân trang theo con trỏ (Cursor Pagination):** Với danh sách 2 triệu phần tử, truy vấn `LIMIT 20 OFFSET 1000000` buộc Database quét bỏ qua một triệu dòng đầu tiên, vừa chậm vừa dễ trùng hoặc sót dòng khi có dữ liệu mới chèn vào. Thay vào đó, API trả về một con trỏ (ví dụ `next_cursor = id_cuối`), lần gọi sau chỉ cần truy vấn `WHERE id > cursor LIMIT 20` để nhảy thẳng vào vị trí qua chỉ mục.

**Tương thích phiên bản (Versioning):** Thiết bị di động của người dùng không cập nhật ngay lập tức khi server ra bản mới. Đổi tên hoặc xóa một trường trong JSON hay Protobuf sẽ làm ứng dụng cũ gặp lỗi giải mã. Quy tắc an toàn là chỉ **thêm trường mới (Additive Change)**, giữ nguyên trường cũ trong giai đoạn chuyển tiếp, và chỉ tách phiên bản mới (`/v2/`) khi buộc phải thay đổi cấu trúc gây hỏng.

## 8. Tổng kết: chọn kiểu API nào cho từng lớp?

```step
category: RECAP
short: Chọn kiểu API
scene: s8-recap
callout:
  kind: key-idea
  title: Kiến trúc kết hợp thực tế
  vi: "Nhiều hệ thống dùng kết hợp: REST hoặc GraphQL ở biên ngoài cho thiết bị người dùng, và gRPC cho giao tiếp hiệu năng cao giữa các service nội bộ."
whatChanged:
  - "+ Hoàn chỉnh bức tranh chọn giao thức theo từng chặng mạng"
  - "~ Luôn ưu tiên giảm số RTT trên mạng ngoài trước khi tối ưu byte"
telemetry:
  - label: "Công khai / Cache"
    value: "REST"
  - label: "Mobile tổng hợp"
    value: "GraphQL"
  - label: "Nội bộ Service"
    value: "gRPC"
```

Không có giao thức nào tốt nhất cho mọi vị trí:

| Tiêu chí | REST | GraphQL | gRPC |
|---|---|---|---|
| **Thế mạnh chính** | Đơn giản, tận dụng CDN/HTTP cache | 1 RTT lấy đúng trường cho UI phức tạp | Nhị phân gọn, nhanh, hợp đồng chặt |
| **Điểm yếu** | Dễ nhiều RTT và dư payload | Khó cache HTTP, cần chặn truy vấn sâu | Cần công cụ giải mã, ít thân thiện trình duyệt |
| **Vị trí phù hợp** | API công khai, thao tác tài nguyên chuẩn | Mobile app, màn hình ghép nhiều nguồn | Giao tiếp nội bộ giữa các microservice |

Ghi nhớ nguyên tắc cốt lõi: trên đường truyền mạng di động, **giảm số vòng khứ hồi (RTT)** mang lại hiệu quả rõ rệt nhất cho trải nghiệm người dùng.
