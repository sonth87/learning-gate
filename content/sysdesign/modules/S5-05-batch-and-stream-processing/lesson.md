## 1. Tách tải phân tích khỏi Database sản xuất bằng Batch Processing

```step
category: SETUP
short: Batch & Kho
scene: s1-setup
callout:
  kind: key-idea
  title: Không phân tích trên OLTP
  vi: "Chạy truy vấn tổng hợp hàng tỉ dòng trên database sản xuất sẽ chiếm hết I/O và làm chậm người dùng thật. Hãy đẩy sự kiện sang Event Log rồi tổng hợp vào Data Warehouse."
whatChanged:
  - "+ Tách luồng sự kiện phân tích qua Event Log sang Data Warehouse"
  - "~ Job Batch chạy định kỳ ban đêm, độ tươi dữ liệu trễ theo chu kỳ"
telemetry:
  - label: "Tải thêm lên OLTP"
    value: "0%"
    tone: ok
  - label: "Độ tươi dữ liệu Batch"
    value: "Theo giờ / ngày"
    tone: warn
```

Khi đội kinh doanh muốn thống kê top video được xem nhiều nhất trong ngày, việc chạy `COUNT(*)` và `GROUP BY` trực tiếp trên cơ sở dữ liệu sản xuất (OLTP) sẽ khóa bộ nhớ đệm và I/O, kéo độ trễ của người dùng đang truy cập tăng vọt.

Giải pháp nền tảng là tách luồng dữ liệu: ứng dụng đẩy sự kiện sang **Event Log**, rồi một hệ thống **Batch Processing** đọc các tệp nhật ký lớn vào ban đêm, tính toán tổng hợp và ghi kết quả vào **Data Warehouse**. Cơ sở dữ liệu chính hoàn toàn không bị ảnh hưởng.

## 2. Map-Shuffle-Reduce và bài toán lệch khóa nóng (Hot Key Skew)

```step
category: PROBLEM
short: Lệch khóa nóng
scene: s2-skew
callout:
  kind: watch-out
  title: Một khóa nóng làm chậm cả job
  vi: "Trong Map-Shuffle-Reduce, nếu một video chiếm 40% lượng truy cập, đúng một Reducer sẽ phải gánh 40% dữ liệu và kéo thời gian hoàn thành lên hàng giờ."
whatChanged:
  - "~ Một video nổi tiếng chiếm 40% tổng sự kiện đổ về cùng một Reducer"
  - "+ Áp dụng Combiner và Salting khóa nóng rút thời gian từ 3 giờ xuống 20 phút"
telemetry:
  - label: "Dữ liệu vào Reducer nóng"
    value: "40% tổng tải"
    tone: bad
  - label: "Thời gian trước / sau sửa"
    value: "3 giờ → 20 phút"
    tone: ok
```

Batch Processing quy mô lớn vận hành theo mô hình **Map-Shuffle-Reduce**:
- **Map:** Đọc từng khối dữ liệu song song và phát ra cặp `(key, 1)`.
- **Shuffle:** Gom mọi bản ghi có cùng `key` qua mạng về chung một **Reducer**.
- **Reduce:** Cộng dồn để ra kết quả cuối cho từng `key`.

Điểm yếu lớn nhất của bước Shuffle là **lệch dữ liệu (Skew)**. Nếu một video chiếm 40% tổng sự kiện, một Reducer duy nhất phải xử lý 40% dữ liệu và chạy mất 3 giờ, trong khi các Reducer khác đã xong từ phút thứ 5.

Hai kỹ thuật khắc phục chuẩn gồm: bật **Combiner** để cộng dồn cục bộ ngay tại Mapper trước khi gửi qua mạng, và **Salting** (gắn thêm hậu tố ngẫu nhiên như `video_1#0` đến `video_1#9`) để chia tải khóa nóng sang 10 Reducer rồi mới gộp lại ở bước hai.

## 3. Stream Processing: Window, Watermark và khử trùng lặp

```step
category: MECHANISM
short: Luồng & Window
scene: s3-window
callout:
  kind: good-to-know
  title: Cửa sổ theo thời gian sự kiện
  vi: "Stream xử lý từng sự kiện ngay khi đến. Window chia luồng vô hạn thành khung thời gian, còn Watermark quyết định chờ sự kiện đến trễ bao lâu trước khi chốt số."
whatChanged:
  - "+ Chuyển từ Batch sang Stream Processing xử lý liên tục"
  - "+ Dùng Window, Watermark và khử trùng lặp theo event_id"
telemetry:
  - label: "Độ tươi dữ liệu Stream"
    value: "Vài giây"
    tone: ok
  - label: "Độ chính xác"
    value: "Chống trùng & trễ"
    tone: ok
```

Khi sản phẩm cần phát hiện xu hướng hoặc gian lận ngay trong vài giây, chờ job Batch cuối ngày là quá muộn. **Stream Processing** tính toán liên tục ngay khi sự kiện vừa đi vào Event Log.

Vì luồng sự kiện không có điểm kết thúc, hệ thống dùng **Window** (ví dụ Tumbling Window mỗi 1 phút hoặc Sliding Window trượt mỗi 10 giây) để gom nhóm tính toán. Thực tế mạng di động thường làm sự kiện đến muộn hoặc gửi lặp lại, nên cần kết hợp:
- **Watermark:** Mốc thời gian sự kiện (Event Time) cho biết hệ thống sẵn sàng chờ thêm bao lâu (ví dụ 30 giây) trước khi đóng cửa sổ.
- **Idempotent Deduplication:** Lưu `event_id` trong cửa sổ gần nhất để loại bỏ các bản ghi gửi trùng khi client retry.

## 4. Mô phỏng Consumer Lag: khi tải sự kiện tăng gấp 3 lần

```step
category: PROBLEM
short: Consumer Lag
scene: s4-live-lag
live: stream-lag
activity: S5-05.A1
gate: optional
callout:
  kind: watch-out
  title: Lag tăng khi tốc độ đến vượt tốc độ xử lý
  vi: "Consumer Lag là khoảng cách giữa sự kiện mới nhất trong Event Log và vị trí Processor đang đọc. Khi Processor chạm 100%, lag tăng tuyến tính theo thời gian."
whatChanged:
  - "~ Lưu lượng sự kiện tăng từ 1.000 lên 4.500 event/s trong 45 giây"
  - "~ 1 Stream Processor (μ = 2.000 event/s) bão hòa từ giây 13"
telemetry:
  - label: "Năng lực 1 Processor"
    value: "2.000 event/s"
    tone: warn
  - label: "Tải đỉnh mô phỏng"
    value: "4.500 event/s"
    tone: bad
```

Trong mô phỏng này, lưu lượng sự kiện tăng từ `1.000` lên `4.500 event/s`. Event Log đủ sức chứa `20.000 event/s` và Data Warehouse nhận được `12.000 event/s`, nhưng cụm Stream Processor hiện chỉ có 1 worker với năng lực `2.000 event/s`.

Khi tải vượt mốc `2.000 event/s`, Stream Processor chạm 100% công suất và hàng đợi trên Event Log bắt đầu dồn ứ thành **Consumer Lag**. Hãy chạy mô phỏng để dự đoán thành phần quá tải và tìm giới hạn tải của cấu hình hiện tại.

## 5. Mở rộng theo Partition và dùng thuật toán Sketch tiết kiệm RAM

```step
category: TECHNIQUE
short: Scale Partition
scene: s5-scale
activity: S5-05.A2
gate: optional
callout:
  kind: key-idea
  title: Số Partition giới hạn số Worker
  vi: "Mỗi Partition chỉ giao cho tối đa một Processor trong nhóm. Muốn mở rộng ngang lên 3 hoặc 4 Processor, Event Log phải có ít nhất 3 hoặc 4 Partition."
whatChanged:
  - "+ Chia Event Log thành 4 Partition và tăng lên 3 Stream Processor"
  - "+ Dùng HyperLogLog Sketch đếm người xem duy nhất chỉ với vài KB RAM"
telemetry:
  - label: "Consumer Lag sau scale"
    value: "Giữ dưới 2 giây"
    tone: ok
  - label: "Bộ nhớ HyperLogLog"
    value: "Vài KB / truy vấn"
    tone: ok
```

Để triệt tiêu Consumer Lag khi tải đạt `4.500 event/s`, ta cần tăng số Stream Processor lên ít nhất 3 worker (tổng năng lực `6.000 event/s`). Điều kiện tiên quyết là Event Log phải được chia thành **ít nhất 3–4 Partition**, vì hai worker trong cùng Consumer Group không thể đọc song song cùng một Partition.

Với các bài toán đếm người dùng duy nhất (Unique Users) trên hàng tỉ sự kiện, lưu toàn bộ `user_id` trong RAM là bất khả thi. Thuật toán xác suất **HyperLogLog (Sketch)** chỉ tốn vài KB bộ nhớ để cho kết quả xấp xỉ với sai số khoảng 1–2%.

## 6. Kết hợp Batch và Stream trong kiến trúc phân tích thực tế

```step
category: RECAP
short: Tổng kết
scene: s5-scale
callout:
  kind: good-to-know
  title: Tốc độ của Stream và độ chính xác của Batch
  vi: "Stream cung cấp số liệu tức thời trong vài giây cho bảng điều khiển; Batch chạy đối soát cuối ngày để đảm bảo số liệu tài chính chính xác tuyệt đối."
whatChanged:
  - "~ Kết hợp luồng Stream thời gian thực và Batch đối soát định kỳ"
telemetry:
  - label: "Độ tươi Stream"
    value: "Vài giây"
    tone: ok
  - label: "Độ chuẩn Batch"
    value: "100% đối soát"
    tone: ok
```

Trong thực tế, doanh nghiệp thường chạy song song **Stream** để phát hiện xu hướng hoặc gian lận tức thời và **Batch** cuối ngày để đối soát chính xác tuyệt đối trên toàn bộ dữ liệu thô từ Event Log.
