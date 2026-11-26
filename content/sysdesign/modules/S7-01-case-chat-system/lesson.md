## 1. Đề bài và quy mô 20 triệu kết nối đồng thời

```step
category: SETUP
short: Quy mô 20M
scene: s1-scale
callout:
  kind: key-idea
  title: Hai bài toán của hệ thống Chat
  vi: "Chat quy mô lớn vừa phải giữ hàng chục triệu socket mở đồng thời, vừa phải đảm bảo mọi tin nhắn đến nơi đúng thứ tự và không bị lưu trùng."
whatChanged:
  - "+ Thiết lập đường truyền Thiết bị → WS Gateway → Chat Service → Message Store"
  - "~ Tải mục tiêu: 20 triệu kết nối mở, 23.000 tin/giây, p99 ≤ 180 ms"
telemetry:
  - label: "Kết nối đồng thời"
    value: "20 triệu"
  - label: "Thông lượng tin"
    value: "23.000 tin/s"
  - label: "Độ trễ p99 đích"
    value: "≤ 180 ms"
    tone: ok
```

Một hệ thống chat thời gian thực quy mô lớn phục vụ khoảng 20 triệu kết nối đồng thời với lưu lượng trung bình 23.000 tin nhắn mỗi giây. Khác với API web truyền thống đóng kết nối sau mỗi request, mỗi thiết bị ở đây giữ một kênh hai chiều liên tục để nhận tin tức thì.

Yêu cầu cốt lõi gồm bốn điểm: giao tin khi cả hai trực tuyến với độ trễ p99 dưới 180 ms, không mất tin khi người nhận ngoại tuyến, giữ đúng thứ tự trong từng hội thoại, và không lưu trùng dù mạng chập chờn.

## 2. Tách tầng WebSocket Gateway giữ socket khỏi Chat Service

```step
category: MECHANISM
short: Tách Gateway
scene: s2-split
callout:
  kind: good-to-know
  title: Tách state khỏi logic
  vi: "WebSocket Gateway chỉ làm nhiệm vụ giữ kết nối TCP/TLS; mọi xử lý nghiệp vụ đẩy sang Chat Service không trạng thái."
whatChanged:
  - "+ Tách WS Gateway (giữ socket) khỏi Chat Service (stateless)"
  - "+ Thêm WS Gateway 2 làm cụm dự phòng chia tải biên"
telemetry:
  - label: "WS Gateway"
    value: "Có trạng thái"
    tone: warn
  - label: "Chat Service"
    value: "Stateless"
    tone: ok
```

Nếu gộp cả việc giữ socket và xử lý logic vào một server duy nhất, mỗi lần triển khai bản mới sẽ ngắt hàng loạt kết nối người dùng. Do đó, kiến trúc tách làm hai lớp rõ ràng:

- **WS Gateway** (có trạng thái): chỉ giữ socket, giải mã khung WebSocket và chuyển tiếp dữ liệu. Mỗi máy chịu được khoảng 50.000–200.000 kết nối tùy cấu hình bộ nhớ.
- **Chat Service** (không trạng thái): nhận sự kiện từ Gateway, kiểm tra quyền, ghi cơ sở dữ liệu và tìm đường gửi tiếp. Nhờ stateless, tầng này mở rộng ngang rất nhanh khi lưu lượng tin nhắn tăng.

## 3. Session Registry: biết người nhận đang ở Gateway nào

```step
category: TECHNIQUE
short: Session Registry
scene: s3-registry
callout:
  kind: technique
  title: Ánh xạ trong RAM
  vi: "Chat Service tra cứu Session Registry để biết chính xác WS Gateway nào đang giữ socket của người nhận."
whatChanged:
  - "+ Thêm Session Registry ánh xạ user_id → gateway_id"
  - "~ Làm mới TTL bằng gói heartbeat định kỳ từ thiết bị"
telemetry:
  - label: "Độ trễ tra cứu"
    value: "< 1 ms"
    tone: ok
  - label: "Cơ chế làm mới"
    value: "Heartbeat + TTL"
```

Khi người dùng A gửi tin cho người dùng B, gói tin đi vào Gateway 1 rồi tới Chat Service. Nhưng B có thể đang nối vào Gateway 2 hoặc đang ngoại tuyến. Chat Service không thể phát quảng bá tới tất cả hàng trăm Gateway.

**Session Registry** (đặt trên cụm lưu trữ RAM phân mảnh như Redis) lưu bảng ánh xạ `user_id → gateway_id` với thời gian sống TTL. Thiết bị gửi gói heartbeat định kỳ để gia hạn TTL; nếu thiết bị mất mạng đột ngột, bản ghi tự hết hạn sau TTL mà không cần dọn thủ công.

## 4. Message Store: lưu trước khi phát, thứ tự và khử trùng

```step
category: TECHNIQUE
short: Message Store
scene: s4-store
callout:
  kind: key-idea
  title: Lưu bền vững trước khi giao
  vi: "Tin nhắn phải được ghi xuống Message Store và cấp seq_id theo hội thoại trước khi đẩy tới người nhận."
whatChanged:
  - "+ Phân mảnh Message Store theo conversation_id"
  - "+ Gắn client_msg_id để khử trùng nguyên tử khi retry"
telemetry:
  - label: "Khóa phân mảnh"
    value: "conversation_id"
  - label: "Khóa sắp xếp"
    value: "seq_id tăng dần"
    tone: ok
```

Kho lưu trữ tin nhắn (**Message Store**) chịu tải ghi rất lớn và liên tục, nên dùng cơ sở dữ liệu phân mảnh theo `conversation_id`. Mọi tin nhắn trong cùng một cuộc trò chuyện nằm trên cùng một phân mảnh, giúp đọc lịch sử theo trang rất nhanh.

Hai cơ chế bảo vệ tính đúng đắn:
1. **Thứ tự theo hội thoại:** mỗi tin được cấp một `seq_id` tăng dần (hoặc ID đơn điệu theo thời gian) trong phạm vi `conversation_id`, tránh lệch đồng hồ giữa các thiết bị.
2. **Chống gửi trùng (Idempotency):** thiết bị tự sinh `client_msg_id` (UUID) ngay lần bấm gửi đầu tiên. Nếu mạng rớt và thiết bị thử lại, Message Store kiểm tra `client_msg_id` để không lưu hai bản ghi cho cùng một tin nhắn.

## 5. Xử lý người nhận ngoại tuyến và đồng bộ theo sequence

```step
category: MECHANISM
short: Đồng bộ offline
scene: s5-offline
callout:
  kind: good-to-know
  title: Push là tín hiệu đánh thức
  vi: "Không dựa vào Push Notification để truyền toàn bộ dữ liệu theo thứ tự; hãy dùng nó để đánh thức và đồng bộ bằng seq_id."
whatChanged:
  - "~ Khi Session Registry không có bản ghi, chuyển nhánh sang Push"
  - "+ Thiết bị gửi last_seen_seq khi trực tuyến lại để kéo đủ tin thiếu"
telemetry:
  - label: "Trạng thái đích"
    value: "Ngoại tuyến"
    tone: warn
  - label: "Đồng bộ bù"
    value: "seq_id > last_seen"
    tone: ok
```

Khi tra Session Registry thấy người nhận không có Gateway hoạt động, Chat Service vẫn ghi tin vào Message Store như bình thường, sau đó gửi yêu cầu sang dịch vụ Push Notification (APNs/FCM) để báo có tin mới.

Khi người dùng mở lại ứng dụng và kết nối thành công tới một WS Gateway, thiết bị gửi kèm `last_seen_seq` của từng hội thoại. Server truy vấn nhanh các tin có `seq_id > last_seen_seq` để đồng bộ bù đầy đủ và đúng thứ tự.

## 6. Sự cố thực tế: WS Gateway sập gây Reconnect Storm

```step
category: PROBLEM
short: Reconnect Storm
scene: s6-storm-live
live: storm
activity: S7-01.A1
gate: optional
callout:
  kind: watch-out
  title: Bão kết nối lại đánh sập dây chuyền
  vi: "Khi một WS Gateway sập ở t = 15 s, 200.000 thiết bị nối lại cùng một giây tạo áp lực bắt tay TLS gấp nhiều lần bình thường."
whatChanged:
  - "~ Mô phỏng WS Gateway 1 ngừng hoạt động ở t = 15 s"
  - "~ Thiết bị chưa bật Backoff + Jitter dồn tải sang cụm còn lại"
telemetry:
  - label: "Socket rớt (t = 15 s)"
    value: "200.000"
    tone: bad
  - label: "Giải pháp biên"
    value: "Backoff + Jitter"
    tone: ok
```

Trong mô phỏng trực tiếp, ở giây thứ 15, cụm WS Gateway 1 gặp sự cố. Nếu 200.000 thiết bị đều lập tức mở lại kết nối WebSocket (kèm bắt tay TCP và TLS tốn nhiều CPU), các Gateway còn lại sẽ quá tải dây chuyền.

Cách xử lý gồm hai lớp: đặt nhiều cụm Gateway dự phòng (loại bỏ SPOF) và cấu hình **Exponential Backoff + Full Jitter** trên thiết bị để rải đều thời gian nối lại trong khoảng vài chục giây thay vì dồn vào cùng một tích tắc.

## 7. Chat nhóm và dữ liệu tạm thời (Presence, Typing)

```step
category: TECHNIQUE
short: Nhóm & Presence
scene: s7-group
activity: S7-01.A3
gate: optional
callout:
  kind: compare
  title: Tách luồng bền vững và luồng tạm thời
  vi: "Tin nhắn nhóm lưu một lần vào Message Store rồi phát cho nhiều thành viên; trạng thái đang gõ chỉ giữ trong RAM với TTL ngắn."
whatChanged:
  - "+ Mở rộng mô hình sang chat nhóm và trạng thái Presence"
  - "~ Không ghi sự kiện Typing và Presence xuống đĩa"
telemetry:
  - label: "Lưu tin nhóm"
    value: "1 bản / hội thoại"
    tone: ok
  - label: "Presence / Typing"
    value: "RAM + TTL ngắn"
```

Với chat nhóm (vài chục đến vài trăm thành viên), ta không nhân bản dữ liệu tin nhắn cho từng người trong cơ sở dữ liệu mà chỉ lưu **một bản duy nhất** theo `conversation_id`, rồi Chat Service tra Session Registry của danh sách thành viên để đẩy qua các Gateway tương ứng.

Ngược lại, trạng thái trực tuyến (**Presence**) và **đang gõ** phát sinh với tần suất rất cao nhưng giá trị tức thời ngắn. Chúng không đi qua Message Store mà chỉ đi qua kênh bộ nhớ tạm với TTL vài giây, chấp nhận rơi gói khi mạng nghẽn.

## 8. Tổng kết và phân tích sự cố

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
activity: S7-01.A2
gate: optional
callout:
  kind: key-idea
  title: Bốn trụ cột của hệ thống Chat
  vi: "Tách Gateway giữ socket khỏi logic, tra định tuyến qua Session Registry, lưu Message Store theo seq_id + client_msg_id, và chống bão nối lại bằng Backoff + Jitter."
whatChanged:
  - "+ Tổng kết toàn bộ kiến trúc Chat thời gian thực"
telemetry:
  - label: "Tải bền vững"
    value: "23.000 tin/s"
    tone: ok
  - label: "Chống bão nối lại"
    value: "Backoff + Jitter"
    tone: ok
```

Qua bài toán Chat 20 triệu kết nối, ta thấy rõ cách kết hợp nhiều khối kiến trúc đã học: WebSocket Gateway ở biên, Stateless Service ở giữa, Session Registry trong RAM, Message Store phân mảnh theo hội thoại và cơ chế bảo vệ chống Reconnect Storm.

Hãy hoàn thành bài tập phân tích sự cố (`S7-01.A2`) và bài đo giới hạn thông lượng (`S7-01.A3`) để kiểm chứng khả năng vận hành của thiết kế.
