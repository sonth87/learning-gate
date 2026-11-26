## 1. Mỗi hệ thống có một bài toán trung tâm riêng

```step
category: SETUP
short: Điểm trọng tâm
scene: s1-overview
callout:
  kind: key-idea
  title: Không dùng một khuôn mẫu chung
  vi: "Đáp án rập khuôn chỉ liệt kê Load Balancer, Cache và Database sẽ thiếu chiều sâu. Mỗi bài toán có một nút thắt đặc thù cần ưu tiên giải quyết trước."
whatChanged:
  - "+ Bảng đối chiếu bài toán cốt lõi của 4 hệ thống thực tế"
  - "~ Xác định vùng cần dành nhiều thời gian nhất ở chặng Elaborate"
telemetry:
  - label: "Số hệ thống mẫu"
    value: "4 nhóm chính"
  - label: "Khung dẫn dắt"
    value: "SNAKE (45 phút)"
```

Khi bước vào một buổi thiết kế hệ thống, sai lầm phổ biến nhất là trình bày cùng một sơ đồ chung chung cho mọi đề bài. Người đánh giá không tìm kiếm danh sách các thành phần quen thuộc, mà muốn kiểm tra xem bạn có nhận ra **nút thắt đặc thù** của bài toán đang xét hay không.

Bốn nhóm hệ thống kinh điển đại diện cho bốn kiểu thử thách kỹ thuật khác nhau:

- **Mạng xã hội bảng tin (Twitter/X):** Thử thách nằm ở **khuếch đại ghi (Write Amplification)** khi phân phối bài đăng tới hàng triệu người theo dõi. (Xem chi tiết ở bài `S5-03`).
- **Nền tảng video (YouTube):** Thử thách nằm ở **đường ống chuyển mã bất đồng bộ** và **băng thông CDN** quy mô exabyte. (Xem chi tiết ở bài `S7-05`).
- **Nhắn tin thời gian thực (WhatsApp):** Thử thách nằm ở **kết nối bền vững (WebSocket)**, đảm bảo thứ tự và giao nhận khi ngoại tuyến. (Xem chi tiết ở bài `S7-01`).
- **Lưu trữ đồng bộ tệp (Google Drive):** Thử thách nằm ở **chia khối (Chunking)**, đồng bộ phần thay đổi và xử lý xung đột phiên bản.

## 2. Twitter: Chiến lược Hybrid Fan-out và bài toán người nổi tiếng

```step
category: MECHANISM
short: Twitter Fan-out
scene: s2-twitter
activity: S6-04.A1
gate: required
callout:
  kind: technique
  title: Chọn tối ưu đọc hay ghi
  vi: "Với tỉ lệ đọc gấp nhiều lần ghi (ví dụ 92% đọc), đẩy trước vào Redis Timeline Cache giúp tải bảng tin dưới 50 ms, nhưng cần tách riêng tài khoản triệu người theo dõi."
whatChanged:
  - "+ Phân tích số liệu ước lượng: ~2.300 tweet/s dẫn tới ~460.000 cập nhật/s"
  - "~ Áp dụng Hybrid Fan-out: đẩy cho tài khoản thường, kéo cho người nổi tiếng"
telemetry:
  - label: "Tải đọc đỉnh"
    value: "~12.000–36.000 req/s"
  - label: "Tài khoản nổi tiếng"
    value: "Fan-out on Read"
    tone: warn
```

Khi áp dụng SNAKE cho bài toán bảng tin Twitter:

1. **Scope & Numbers:** Giả sử 100 triệu người dùng hoạt động hằng ngày (DAU), 200 triệu bài đăng mỗi ngày (~2.300 bài/giây) và 1 tỷ lượt xem bảng tin (~12.000 lượt đọc/giây trung bình, ~36.000 ở đỉnh). Nếu mỗi người có trung bình 200 người theo dõi, một bài đăng tạo ra 200 lượt cập nhật bảng tin, tức ~460.000 lượt ghi/giây vào bộ nhớ đệm.
2. **API & Key Components:** Tách luồng ghi (`POST /v1/tweets`) và luồng đọc (`GET /v1/timeline?cursor=...`). Dùng hàng đợi Kafka làm bộ đệm giữa dịch vụ đăng bài và các worker phân phối.
3. **Elaborate (Điểm đào sâu):** Áp dụng **Hybrid Fan-out**. Với tài khoản thường (< 10.000 người theo dõi), thực hiện **Fan-out on Write**: đẩy ID bài đăng vào `Redis Sorted Set` của từng người theo dõi. Với tài khoản nổi tiếng (> 10.000 người theo dõi), bỏ qua bước đẩy hàng loạt mà dùng **Fan-out on Read**: trộn bài đăng của họ ngay lúc người xem tải bảng tin.

## 3. YouTube: Đường ống chuyển mã và tối ưu băng thông CDN

```step
category: TECHNIQUE
short: YouTube & CDN
scene: s3-youtube
callout:
  kind: good-to-know
  vi: "Lưu trữ video gốc chỉ là bước đầu; mỗi video cần chuyển mã thành nhiều độ phân giải (360p, 720p, 1080p) để phát thích ứng theo băng thông người xem."
whatChanged:
  - "+ Tách luồng Upload + Encoding bất đồng bộ khỏi luồng phát qua CDN"
  - "~ Dồn 90% lưu lượng xem video phổ biến về các nút biên CDN"
telemetry:
  - label: "Lưu trữ thô/năm"
    value: "~180 PB (chưa nhân bản)"
  - label: "Tiết kiệm băng thông"
    value: "CDN Edge Cache"
    tone: ok
```

Với bài toán nền tảng video như YouTube, trọng tâm chuyển từ cơ sở dữ liệu quan hệ sang **lưu trữ đối tượng** và **mạng phân phối nội dung**:

1. **Numbers:** Nếu có 500.000 video tải lên mỗi ngày (trung bình 1 GB cho bản gốc 1080p), sau khi chuyển mã thành nhiều định dạng (360p, 720p, 1080p, 4K) tổng dung lượng mỗi video lên tới ~5 GB, tương đương ~2,5 PB/ngày. Ở chiều xem, 1 tỷ lượt xem mỗi ngày với tốc độ bit trung bình 5 Mbps tiêu thụ hàng exabyte băng thông mỗi tháng.
2. **Encoding Pipeline:** Khi người dùng tải lên, tệp thô được lưu vào Object Storage (như S3) và trả phản hồi đang xử lý ngay lập tức. Một hàng đợi kích hoạt các worker chuyển mã song song theo từng phân đoạn video, tạo ảnh thu nhỏ và cập nhật Metadata DB.
3. **CDN Strategy:** Nhóm 10% video thịnh hành được đẩy chủ động ra biên CDN để giảm độ trễ khởi phát xuống dưới 100 ms và giảm mạnh chi phí truyền tải từ origin. Phần đuôi dài (long-tail) được nạp theo nhu cầu (on-demand) với chính sách loại bỏ LRU.

## 4. WhatsApp: Kết nối WebSocket và đảm bảo giao nhận

```step
category: TECHNIQUE
short: WhatsApp Chat
scene: s4-whatsapp
callout:
  kind: key-idea
  title: Tách Gateway giữ kết nối và dịch vụ xử lý
  vi: "100 triệu kết nối mở đồng thời đòi hỏi tầng WebSocket Gateway có trạng thái kết nối, phối hợp với Presence Service và hàng đợi bền vững cho người nhận ngoại tuyến."
whatChanged:
  - "+ Duy trì kết nối hai chiều qua WebSocket Gateway"
  - "~ Lưu tin nhắn vào hàng đợi bền vững khi người nhận ngoại tuyến"
telemetry:
  - label: "Lưu lượng đỉnh"
    value: "~3,3 triệu tin/s"
  - label: "Đảm bảo giao nhận"
    value: "At-least-once + ACK"
    tone: ok
```

Bài toán nhắn tin tức thời kiểm tra khả năng thiết kế giao tiếp hai chiều và xử lý trạng thái kết nối:

1. **Numbers:** Với 100 tỷ tin nhắn/ngày (~1,1 triệu tin/giây trung bình, ~3,3 triệu tin/giây đỉnh) và 100 triệu người dùng trực tuyến cùng lúc, hệ thống cần hàng trăm máy chủ WebSocket Gateway.
2. **Delivery Guarantees:** Khi người gửi đẩy tin qua WebSocket, Message Service lưu tin vào kho theo hội thoại kèm số thứ tự tăng dần, rồi tra Presence Service để tìm Gateway của người nhận. Nếu người nhận đang ngoại tuyến, tin nhắn nằm trong hàng đợi bền vững và gửi thông báo đẩy (push notification). Khi nhận thành công, thiết bị gửi gói tin `ACK` để cập nhật trạng thái đã nhận và đã đọc.
3. **Group Messaging:** Thay vì nhân bản nội dung tin nhắn cho từng thành viên nhóm (tối đa 256 người), lưu nội dung một lần và chỉ phân phối con trỏ tham chiếu tới các thành viên trực tuyến hoặc hàng đợi ngoại tuyến.

## 5. Google Drive: Chia khối dữ liệu và giải quyết xung đột

```step
category: TECHNIQUE
short: Drive Sync
scene: s5-gdrive
callout:
  kind: watch-out
  title: Không dùng Last-Write-Wins cho tệp người dùng
  vi: "Ghi đè theo đồng hồ có thể làm mất dữ liệu khi hai thiết bị sửa ngoại tuyến. Cần giữ lịch sử phiên bản và tạo bản sao xung đột để người dùng tự gộp."
whatChanged:
  - "+ Chia tệp thành các khối 4 MB và băm SHA-256 trước khi đồng bộ"
  - "~ Chỉ tải lên các khối thay đổi (Delta Sync) để giảm băng thông"
telemetry:
  - label: "Kích thước khối"
    value: "4 MB + SHA-256"
  - label: "Tiết kiệm băng thông"
    value: "Delta Sync & Dedup"
    tone: ok
```

Với hệ thống đồng bộ tệp đám mây như Google Drive, điểm nhấn nằm ở thuật toán tiết kiệm băng thông và bảo toàn dữ liệu:

1. **Chunking & Deduplication:** Một tệp 1 GB được cắt thành 250 khối 4 MB, mỗi khối gắn mã băm SHA-256. Khi người dùng sửa vài dòng văn bản, ứng dụng chỉ cần tải lên đúng khối có mã băm thay đổi (4 MB thay vì 1 GB). Nếu nhiều người dùng tải lên cùng một khối dữ liệu giống nhau, hệ thống chỉ lưu một bản duy nhất trong Object Storage.
2. **Metadata vs Block Storage:** Tách biệt hoàn toàn Metadata DB (chứa cấu trúc thư mục, danh sách mã khối, số phiên bản, quyền truy cập) khỏi Block Storage.
3. **Conflict Resolution:** Khi hai thiết bị cùng chỉnh sửa một tệp trong lúc ngoại tuyến và đồng bộ lại, máy chủ phát hiện xung đột số phiên bản, lưu cả hai phiên bản và gắn nhãn bản sao xung đột để tránh mất dữ liệu thầm lặng.

## 6. Tổng kết: Nhịp độ 45 phút và các dấu hiệu đánh giá

```step
category: RECAP
short: Tóm tắt 45 phút
scene: s6-signals
callout:
  kind: key-idea
  title: Công thức trả lời có chiều sâu
  vi: "Chốt phạm vi nhanh ở 7 phút đầu, tính số để tìm điểm nghẽn ở phút thứ 14, vẽ luồng đọc ghi ở phút 33 và dành trọn phần cuối đào sâu đúng nút thắt của đề bài."
whatChanged:
  - "+ Bảng phân bổ 45 phút và danh sách tín hiệu tích cực cần thể hiện"
telemetry:
  - label: "Nút thắt Twitter"
    value: "Fan-out & Hot Key"
  - label: "Nút thắt Drive"
    value: "Chunking & Conflict"
```

Một buổi thiết kế hiệu quả không đòi hỏi bạn phải nhớ thuộc lòng mọi chi tiết hạ tầng, mà đòi hỏi tư duy có cấu trúc:

- **Làm rõ trước khi vẽ:** Luôn hỏi về quy mô, tỉ lệ đọc/ghi và tính năng nằm ngoài phạm vi trước khi chọn công nghệ.
- **Số liệu dẫn dắt kiến trúc:** Phép tính nhẩm ở chặng Numbers phải chỉ ra đúng nơi cần Cache, Sharding hay CDN.
- **Trình bày rõ sự đánh đổi:** Luôn giải thích vì sao chọn phương án này thay vì phương án khác (ví dụ Hybrid Fan-out đánh đổi độ phức tạp mã nguồn để tránh nổ hàng đợi ở người nổi tiếng).
- **Chủ động đề cập lỗi và giám sát:** Nêu phương án xử lý khi hàng đợi đầy, nút mạng đứt hoặc cách theo dõi chỉ số p99 và tỉ lệ lỗi.
