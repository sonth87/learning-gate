## 1. Bài toán cập nhật thời gian thực và cái giá của Short Polling

```step
category: SETUP
short: Short Polling
scene: s1-polling
activity: S4-09.A1
gate: optional
callout:
  kind: watch-out
  title: Hỏi lặp lại tạo ra cơn bão request rỗng
  vi: "Với Short Polling mỗi 2 giây, 1 triệu thiết bị tạo ra 500.000 req/s liên tục ngay cả khi 95% thời gian không có dữ liệu mới."
whatChanged:
  - "+ Thiết bị gửi yêu cầu HTTP định kỳ tới Edge Gateway → Polling API"
  - "~ 95% phản hồi trả về rỗng nhưng vẫn tiêu tốn CPU và kết nối"
telemetry:
  - label: "Tỷ lệ rỗng"
    value: "95%"
    tone: bad
  - label: "Độ trễ nhận tin"
    value: "0–2.000 ms"
```

Khi một người dùng gửi tin nhắn mới hoặc tỷ số trận đấu thay đổi, làm thế nào máy chủ báo ngay cho thiết bị của người nhận? Cách đơn giản nhất là **Short Polling**: thiết bị định kỳ gọi HTTP `GET /updates` sau mỗi vài giây.

Cách này dễ cài đặt nhưng không mở rộng được: phần lớn thời gian không có sự kiện mới, nên tới 95% lượt gọi trả về danh sách rỗng. Dù vậy, máy chủ API vẫn phải phân tích HTTP header, xác thực token và kiểm tra dữ liệu cho hàng trăm nghìn yêu cầu mỗi giây.

## 2. Mô phỏng cơn bão Polling đổ vào tầng API

```step
category: PROBLEM
short: Bão Polling
scene: s2-polling-live
live: polling-storm
activity: S4-09.A2
gate: optional
callout:
  kind: key-idea
  title: Request rỗng vẫn chiếm dụng năng lực xử lý của API
  vi: "Khi tải Polling tăng lên 12.000 req/s, tầng Polling API chạm ngưỡng ρ = 1 rất nhanh trong khi không hề mang lại giá trị mới cho người dùng."
whatChanged:
  - "~ Tải Polling tăng từ 1.000 lên 12.000 req/s trong 45 giây"
  - "~ Quan sát Polling API (4.500 req/s) bão hòa trước Edge Gateway"
telemetry:
  - label: "Năng lực API"
    value: "4.500 req/s"
    tone: warn
  - label: "Đỉnh tải"
    value: "12.000 req/s"
```

Trong mô phỏng trực tiếp này, lưu lượng hỏi tin tăng dần từ 1.000 lên 12.000 req/s. Dù `Edge Gateway` có tổng năng lực 18.000 req/s, tầng `Polling API` phía sau chỉ xử lý được 4.500 req/s.

Mỗi lượt hỏi rỗng đều đi xuyên qua Gateway để chạm vào API. Hãy chạy mô phỏng để thấy API quá tải nhanh như thế nào, và so sánh chi phí nhân bản 9 máy API chỉ để trả lời các yêu cầu rỗng so với việc chuyển sang kết nối đẩy chủ động.

## 3. Long Polling: giữ kết nối chờ đến khi có sự kiện

```step
category: TECHNIQUE
short: Long Polling
scene: s3-long-polling
callout:
  kind: compare
  title: Giảm lượt gọi rỗng nhưng vẫn tốn chi phí mở lại HTTP
  vi: "Long Polling giữ request mở cho tới khi có tin mới hoặc hết thời gian chờ, giúp bỏ các phản hồi rỗng nhưng mỗi tin nhận xong vẫn phải gửi HTTP request mới."
whatChanged:
  - "~ Server treo yêu cầu HTTP thay vì trả về rỗng ngay lập tức"
  - "~ Thiết bị chỉ mở request kế tiếp sau khi nhận tin hoặc timeout"
telemetry:
  - label: "Request rỗng"
    value: "Giảm mạnh"
    tone: ok
  - label: "Chi phí HTTP"
    value: "Vẫn lặp lại"
    tone: warn
```

**Long Polling** cải tiến bước đầu bằng cách không trả về rỗng ngay: máy chủ giữ kết nối HTTP mở (ví dụ tối đa 30 giây) cho đến khi có dữ liệu mới thì mới trả phản hồi. Ngay khi nhận được dữ liệu hoặc hết hạn, thiết bị lập tức mở một kết nối mới.

Nhờ vậy, số lượng yêu cầu rỗng giảm mạnh. Tuy nhiên, nếu tin nhắn đến liên tục (như phòng chat sôi động), thiết bị vẫn phải lặp đi lặp lại chu trình gửi HTTP header và định tuyến qua API cho từng tin một.

## 4. Server-Sent Events (SSE): luồng đẩy một chiều gọn nhẹ

```step
category: TECHNIQUE
short: SSE 1 chiều
scene: s4-sse
callout:
  kind: good-to-know
  title: Chuẩn HTTP cho luồng dữ liệu từ máy chủ xuống client
  vi: "SSE giữ một phản hồi HTTP không đóng để máy chủ đẩy liên tục từng sự kiện, tự động nối lại khi rớt mạng."
whatChanged:
  - "+ Thiết lập luồng một chiều Server → Client qua EventSource"
  - "+ Tự động gửi Last-Event-ID để đồng bộ bù khi mất kết nối"
telemetry:
  - label: "Hướng truyền"
    value: "1 chiều (S → C)"
    tone: ok
  - label: "Giao thức"
    value: "HTTP chuẩn"
    tone: ok
```

**Server-Sent Events (SSE)** giải quyết triệt để bài toán đẩy dữ liệu một chiều từ máy chủ xuống trình duyệt. Client mở một kết nối HTTP duy nhất với `Content-Type: text/event-stream`, và máy chủ liên tục ghi từng sự kiện mới xuống luồng đó mà không đóng kết nối.

SSE hoạt động trơn tru qua hạ tầng HTTP/2 hiện có, trình duyệt tự động hỗ trợ nối lại kèm `Last-Event-ID` nếu rớt mạng. Đây là lựa chọn rất gọn cho bảng tin trực tiếp, thông báo, giá chứng khoán hoặc luồng phản hồi chữ từ AI.

## 5. WebSocket và mở rộng nhiều Gateway qua Pub/Sub

```step
category: MECHANISM
short: WebSocket
scene: s5-websocket-pubsub
callout:
  kind: key-idea
  title: Kết nối bền làm Gateway có trạng thái — cần Pub/Sub để nối giữa các máy
  vi: "Khi Bob gửi tin vào API, tin nhắn phải đi qua Pub/Sub Bus để tìm đúng máy chủ Gateway đang giữ socket của Alice."
whatChanged:
  - "+ Nâng cấp kết nối sang WebSocket hai chiều tại Edge Gateway"
  - "+ Đặt Pub/Sub Bus làm cầu nối định tuyến giữa các Gateway"
telemetry:
  - label: "Hướng truyền"
    value: "2 chiều (Full-duplex)"
    tone: ok
  - label: "Định tuyến"
    value: "Pub/Sub Bus"
    tone: ok
```

Khi ứng dụng cần giao tiếp **hai chiều** độ trễ thấp (như chat, chỉnh sửa tài liệu chung, game), **WebSocket** nâng cấp kết nối HTTP ban đầu thành kênh TCP hai chiều bền vững.

Một thách thức kiến trúc quan trọng: mỗi kết nối WebSocket nằm trong bộ nhớ RAM của một `Edge Gateway` cụ thể. Khi có hàng chục máy Gateway, nếu người gửi nối vào Gateway 1 còn người nhận nối vào Gateway 2, Gateway 1 không thể tự đẩy thẳng tin sang socket trên Gateway 2. Giải pháp là đặt **Pub/Sub Bus** ở giữa: API lưu tin vào `Message DB`, phát sự kiện lên kênh Pub/Sub, và Gateway nào đang giữ socket của người nhận sẽ đẩy tin xuống thiết bị.

## 6. Ngoại tuyến, Presence và tổng kết

```step
category: RECAP
short: Tóm tắt
scene: s6-recap
callout:
  kind: key-idea
  title: Kết nối bền vững chỉ là đường ống; dữ liệu bền vững nằm ở DB
  vi: "Lưu tin vào DB trước khi đẩy socket, dùng heartbeat + TTL cho trạng thái trực tuyến và thêm jitter khi nối lại để tránh sập dây chuyền."
whatChanged:
  - "+ Hoàn thành mô hình SSE / WebSocket kết hợp Pub/Sub và Presence TTL"
telemetry:
  - label: "Presence"
    value: "Heartbeat + TTL"
  - label: "Reconnect"
    value: "Backoff + Jitter"
    tone: ok
```

Để hệ thống thời gian thực vận hành ổn định ở quy mô lớn, cần thêm ba mảnh ghép:
1. **Ngoại tuyến và đồng bộ:** Luôn lưu tin nhắn vào `Message DB` kèm số thứ tự trước khi đẩy qua WebSocket. Khi thiết bị ngoại tuyến mở lại, ứng dụng gửi Push Notification và đồng bộ bù từ số thứ tự cuối cùng.
2. **Presence (trực tuyến):** Thiết bị gửi nhịp tim (heartbeat) định kỳ để gia hạn khóa có TTL ngắn (ví dụ 30 giây) trong Redis; nếu mất kết nối đột ngột, khóa tự hết hạn.
3. **Chống bão nối lại:** Nếu một Gateway khởi động lại, hàng chục nghìn thiết bị không được nối lại cùng một giây mà phải dùng Backoff kèm Jitter.
