## 1. Bài toán tải ghi 250.000 cập nhật vị trí mỗi giây

```step
category: SETUP
short: 250k ghi/giây
scene: s1-write-heavy
activity: S7-04.A1
gate: optional
callout:
  kind: key-idea
  title: Tách chỉ mục nóng trong RAM khỏi lịch sử chuyến đi
  vi: "Với 1 triệu tài xế gửi GPS mỗi 4 giây (250.000 ghi/giây), hệ thống chỉ lưu vị trí mới nhất trong RAM để ghép chuyến thay vì ghi đè liên tục xuống đĩa."
whatChanged:
  - "+ Thiết lập luồng Tài xế → Load Balancer → Location API → Geo Index Shards"
  - "~ Tải ghi vị trí: 1.000.000 ÷ 4 s = 250.000 lượt/giây"
telemetry:
  - label: "Số tài xế"
    value: "1.000.000"
  - label: "Chu kỳ gửi"
    value: "4 giây"
  - label: "Tải ghi"
    value: "250.000 ghi/s"
    tone: warn
```

Hệ thống gọi xe có hai luồng dữ liệu trái ngược: hành khách đặt xe và tìm tài xế xung quanh (đọc lân cận), trong khi 1 triệu tài xế đang chạy liên tục gửi tọa độ GPS mỗi 4 giây (tạo ra **250.000 lượt ghi/giây**).

Vì mục đích ghép chuyến chỉ cần **vị trí mới nhất** của tài xế, dữ liệu này được giữ trong cụm **Geo Index Shards** trên RAM phân mảnh theo không gian với TTL ngắn, tách biệt hoàn toàn khỏi cơ sở dữ liệu giao dịch chuyến đi.

## 2. Geohash: lưới tĩnh mã hóa 2D thành tiền tố chuỗi 1D

```step
category: MECHANISM
short: Lưới Geohash
scene: s2-geohash-grid
callout:
  kind: good-to-know
  title: Quét 9 ô để tránh sót biên giới
  vi: "Geohash biến tọa độ (lat, lng) thành chuỗi ngắn. Để không bỏ sót tài xế đứng ngay bên kia ranh giới ô, luôn truy vấn ô hiện tại cộng 8 ô xung quanh."
whatChanged:
  - "+ Biểu diễn lưới Geohash 1D theo tiền tố chuỗi"
  - "~ Đánh dấu ô w3gv2 (Sân bay) tập trung mật độ xe cao"
telemetry:
  - label: "Truy vấn lân cận"
    value: "Ô tâm + 8 ô kề"
  - label: "Độ dài tiền tố"
    value: "5–6 ký tự"
```

**Geohash** chia bản đồ thế giới thành lưới chữ nhật đệ quy và mã hóa từng ô thành một chuỗi ký tự (ví dụ `w3gv2`). Hai vị trí gần nhau thường chia sẻ chung phần tiền tố đầu.

Điểm cần lưu ý: hai tài xế đứng cách nhau 50 mét nhưng nằm ở hai bên ranh giới một ô lớn có thể mang hai chuỗi Geohash khác nhau. Vì vậy, khi tìm xe quanh khách, Location API luôn tính Geohash của khách cùng **8 ô lân cận** để quét đầy đủ.

## 3. Quadtree: chia cây thích ứng theo mật độ tài xế

```step
category: TECHNIQUE
short: Cây Quadtree
scene: s3-quadtree
callout:
  kind: compare
  title: Thích ứng mật độ nhưng khó phân mảnh hơn
  vi: "Quadtree tự động chia nhỏ những ô đông xe như trung tâm hoặc sân bay, giúp mỗi nút lá giữ lượng tài xế đồng đều hơn lưới Geohash cố định."
whatChanged:
  - "+ Dựng cây Quadtree 4 nhánh theo mật độ tài xế"
  - "~ Nhánh Sân bay tự động chia sâu nhiều cấp hơn vùng ngoại ô"
telemetry:
  - label: "Vùng ngoại ô"
    value: "Ô lớn (ít chia)"
  - label: "Khu sân bay"
    value: "Chia sâu nhiều cấp"
    tone: warn
```

Khác với lưới Geohash có kích thước ô cố định theo độ dài chuỗi, **Quadtree** bắt đầu từ một vùng lớn và chỉ tách thành 4 góc phần tư khi số lượng tài xế trong ô vượt ngưỡng cho phép (ví dụ 100 xe).

Nhờ vậy, vùng ngoại ô thưa xe chỉ cần một nút lớn, còn khu vực sân bay hoặc trung tâm đông đúc được chia sâu hơn để tránh một nút chứa quá nhiều bản ghi. Đánh đổi là cấu trúc cây trong RAM khó phân mảnh ngang (sharding) hơn so với khóa chuỗi Geohash.

## 4. Điểm nóng sân bay (Hot Cell) và phân mảnh Geo Shards

```step
category: PROBLEM
short: Điểm nóng Geo
scene: s4-hotkey-live
live: hotkey
activity: S7-04.A2
gate: optional
callout:
  kind: watch-out
  title: Lệch tải dồn vào một phân mảnh sân bay
  vi: "Ở t = 15 s, khu vực sân bay dồn 70% tải cập nhật vào cùng một ô Geohash, làm quá tải cục bộ đúng một Geo Shard trong khi các shard khác vẫn rảnh."
whatChanged:
  - "~ Kích hoạt sự cố hot-key tại sân bay ở t = 15 s (70% tải vào 1 shard)"
  - "~ Quan sát hàng đợi tăng vọt trên Geo Index Shards"
telemetry:
  - label: "Tỉ trọng ô nóng"
    value: "70% vào 1 shard"
    tone: bad
  - label: "Giải pháp"
    value: "Chia nhỏ ô + thêm shard"
    tone: ok
```

Trong mô phỏng trực tiếp, từ giây thứ 15, hàng nghìn tài xế tụ tập chờ khách tại sân bay tạo thành một **hot cell** chiếm tới 70% lưu lượng ghi dồn vào duy nhất một phân mảnh của `geo_shards`.

Cách khắc phục:
1. **Chia nhỏ ô nóng (Sub-sharding):** tăng độ dài Geohash hoặc gắn thêm hậu tố băm ngẫu nhiên (ví dụ `w3gv2#0`..`w3gv2#3`) riêng cho các vùng điểm nóng đã biết.
2. **Mở rộng số phân mảnh (`shards`) và `Location API`** để hấp thụ đỉnh tải 11.000 req/s trong bài tập `S7-04.A3`.

## 5. Ghép tài xế và truyền dữ liệu hai chiều

```step
category: MECHANISM
short: Ghép tài xế
scene: s5-recap
callout:
  kind: good-to-know
  title: Ghép chuyến theo vùng lân cận và trạng thái rảnh
  vi: "Dịch vụ điều phối đọc danh sách tài xế rảnh từ Geo Index Shards, lọc theo khoảng cách thực tế và gửi yêu cầu nhận cuốc qua WebSocket."
whatChanged:
  - "+ Kết nối luồng đọc lân cận phục vụ ghép tài xế"
telemetry:
  - label: "Truy vấn ghép"
    value: "Geo Shards (RAM)"
    tone: ok
```

Khi hành khách đặt xe, dịch vụ điều phối truy vấn Geo Index Shards quanh tọa độ đón để lấy danh sách tài xế đang rảnh trong bán kính mục tiêu, xếp hạng theo thời gian di chuyển ước tính (ETA) rồi đẩy lời mời nhận chuyến qua kết nối WebSocket.

## 6. Tổng kết thiết kế hệ thống gọi xe

```step
category: RECAP
short: Tóm tắt
scene: s5-recap
activity: S7-04.A3
gate: optional
callout:
  kind: key-idea
  title: Ba nguyên tắc cho hệ thống định vị thời gian thực
  vi: "Lưu vị trí nóng trong RAM, dùng Geohash (+8 ô kề) hoặc Quadtree cho tìm kiếm lân cận, và chia nhỏ ô nóng sân bay để cân bằng tải các phân mảnh."
whatChanged:
  - "+ Tổng kết kiến trúc Geo Index Shards cân bằng tải"
telemetry:
  - label: "Tải ghi gốc"
    value: "250.000 ghi/s"
  - label: "Chống lệch tải"
    value: "8 Geo Shards"
    tone: ok
```

Hệ thống gọi xe kết hợp chặt chẽ giữa ước lượng tải ghi (250.000 cập nhật/giây), cấu trúc chỉ mục không gian (Geohash, Quadtree) và kỹ thuật xử lý hot-key ở tầng dữ liệu.

Hãy hoàn thành bài tập thiết kế `S7-04.A3` để xác nhận cấu hình chịu được điểm nóng sân bay lẫn đỉnh tải 11.000 req/s.
