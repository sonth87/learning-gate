## 1. Vì sao bộ đếm tự tăng (AUTO_INCREMENT) vỡ ngay khi chia Shard?

```step
category: SETUP
short: Vì sao trùng ID
scene: s1-shard-collision
callout:
  kind: key-idea
  title: Bốn tiêu chí của một bộ sinh định danh phân tán
  vi: "Duy nhất toàn cục không cần phối hợp chéo mạng, gọn nhẹ (ưu tiên 64 bit), sắp xếp xấp xỉ theo thời gian để tối ưu chỉ mục đĩa, và không trở thành điểm lỗi đơn."
whatChanged:
  - "+ Minh hoạ hai Shard cơ sở dữ liệu độc lập cùng sinh khoá id = 1, 2, 3 gây đụng độ"
  - "~ Xác định bốn yêu cầu kỹ thuật cần cân đối khi thiết kế định danh ở quy mô lớn"
telemetry:
  - label: "1 Database đơn"
    value: "SERIAL / AUTO_INCREMENT"
    tone: ok
  - label: "Nhiều DB Shard"
    value: "Đụng độ khoá chính!"
    tone: bad
```

Khi ứng dụng còn nằm trên một cơ sở dữ liệu duy nhất, kiểu `SERIAL` hoặc `BIGINT AUTO_INCREMENT` giải quyết trọn vẹn bài toán khoá chính: gọn 8 byte, tăng tuần tự và được động cơ lưu trữ đảm bảo không bao giờ trùng.

Khi dữ liệu vượt ngưỡng một máy và được chia ngang thành nhiều **Shard** (`S2-09`), mỗi Shard tự tăng bộ đếm riêng sẽ lập tức sinh ra `order_id = 101` ở cả Shard 1 lẫn Shard 2. Ngay khi gộp báo cáo, lưu vào Cache chung hoặc tham chiếu từ dịch vụ thanh toán, hai đơn hàng của hai người dùng khác nhau sẽ ghi đè lên nhau.

Một cách vá thủ công là đặt bước nhảy theo số Shard (Shard 1 sinh `1, 3, 5...`, Shard 2 sinh `2, 4, 6...`), nhưng cách này trở nên cứng nhắc và cực kỳ rủi ro mỗi khi cần thêm từ 2 Shard lên 3 hay 8 Shard.

## 2. Bộ cấp số tập trung (Ticket Server): điểm lỗi đơn và bài toán cấp theo lô

```step
category: PROBLEM
short: Ticket SPOF
scene: s2-ticket-live
live: ticket-spof
activity: S3-05.A1
gate: optional
callout:
  kind: watch-out
  title: Mọi dịch vụ xếp hàng chờ một bộ đếm
  vi: "Đặt một Ticket Server đứng giữa để phát số tuần tự giúp giữ khoá 64-bit gọn đẹp, nhưng biến chính máy cấp số thành điểm nghẽn thông lượng và điểm lỗi đơn (SPOF) cho toàn bộ luồng ghi."
whatChanged:
  - "~ Dựng luồng Order Service xin ID đồng bộ từ Ticket Server trước khi ghi DB"
  - "~ Tại giây 20, Ticket Server ngừng chạy làm 100% lệnh tạo đơn thất bại (75% tổng tải)"
telemetry:
  - label: "Lỗi trước sự cố (t = 15 s)"
    value: "{global.errorRate@15:0%}"
    tone: ok
  - label: "Lỗi khi sập Ticket (t = 25 s)"
    value: "{global.errorRate@25:0%}"
    tone: bad
  - label: "Đọc còn sống (t = 25 s)"
    value: "{global.goodputRps@25:0} req/s"
    tone: warn
```

Hướng tiếp cận đầu tiên (từng được Flickr phổ biến bằng MySQL `REPLACE INTO` hoặc Redis `INCR`) là dựng một **Ticket Server** tập trung chuyên cấp số nguyên 64 bit tăng dần cho mọi máy ứng dụng.

Quan sát mô phỏng trực tiếp `S3-05/ticket-spof` (lưu lượng 1.200 req/s gồm 25% đọc đơn cũ và 75% tạo đơn mới):
- Mỗi lần tạo đơn phải tốn thêm một chặng mạng nội bộ để xin số thứ tự.
- Khi `Ticket Server` dừng đột ngột ở **giây 20**, toàn bộ 900 lệnh tạo đơn mỗi giây bị từ chối ngay lập tức (**tỷ lệ lỗi vọt lên 75%**), dù cả 3 máy `Order Service` và cụm `Order DB Shards` hoàn toàn khoẻ mạnh.

Để giảm tải mạng và loại bỏ SPOF, các hệ thống dùng Ticket Server buộc phải chạy ít nhất hai máy chẵn/lẻ hoặc cho ứng dụng **xin sẵn từng lô 1.000 ID trong RAM** (Segment Allocation). Đổi lại, nếu một máy ứng dụng khởi động lại thì phần ID còn dư trong lô bị bỏ trống (làm dãy ID có khoảng khuyết và mất thứ tự thời gian chặt giữa các máy).

## 3. UUID v4 (128 bit ngẫu nhiên): không cần phối hợp nhưng phân mảnh B-tree

```step
category: MECHANISM
short: UUID v4 & B-tree
scene: s3-uuid-btree
callout:
  kind: watch-out
  title: Tác động vật lý của khoá ngẫu nhiên lên ổ đĩa
  vi: "UUID v4 rải điểm chèn đều khắp mọi trang lá của cây chỉ mục B-tree, gây tách trang (Page Split) liên tục, lãng phí bộ nhớ đệm Buffer Pool và nhân bội I/O ghi ngẫu nhiên."
whatChanged:
  - "+ So sánh đường đi chèn bản ghi mới vào cây B-tree giữa khoá ngẫu nhiên và khoá tăng dần"
  - "~ Chỉ ra chi phí kích thước gấp đôi (16 byte vs 8 byte) trên mọi chỉ mục phụ"
telemetry:
  - label: "Kích thước UUID"
    value: "128 bit (16 byte)"
    tone: warn
  - label: "Xác suất đụng độ"
    value: "≈ 0 (122 bit ngẫu nhiên)"
    tone: ok
  - label: "Hiệu năng chèn B-tree"
    value: "Kém (Page Split cao)"
    tone: bad
```

Để loại bỏ hoàn toàn sự phối hợp giữa các máy, ứng dụng có thể tự sinh **UUID v4** (128 bit, trong đó 122 bit hoàn toàn ngẫu nhiên, không gian `2^122 ≈ 5,3 × 10^36` giá trị). Xác suất hai máy bất kỳ sinh trùng gần như bằng không ngay cả khi ngoại tuyến.

Tuy nhiên, dùng UUID v4 làm **khoá chính (Clustered / Primary Key)** trong PostgreSQL hay MySQL InnoDB gây ra hai tổn thất hiệu năng lớn khi bảng vượt hàng chục triệu dòng:
1. **Tách trang ngẫu nhiên (Random Page Splits):** Cây B-tree giữ các dòng sắp xếp theo giá trị khoá. Khoá tăng dần luôn nối gọn vào trang lá ngoài cùng bên phải (đang nằm sẵn trong RAM). Ngược lại, mỗi UUID v4 nhảy vào một trang lá bất kỳ giữa cây: phải đọc trang đó từ đĩa lên RAM, chèn vào trang đã đầy gây tách đôi trang (50% rỗng) và ghi bẩn ra đĩa.
2. **Phình kích thước mọi chỉ mục phụ:** Trong InnoDB, mọi Secondary Index đều lưu kèm giá trị Primary Key để tra ngược, nên khoá 16 byte (hoặc tệ hơn là chuỗi `CHAR(36)`) làm phình bộ nhớ đệm đáng kể so với `BIGINT` 8 byte.

## 4. UUID v7: giữ chuẩn 128 bit nhưng khôi phục chèn tuần tự theo thời gian

```step
category: TECHNIQUE
short: UUID v7 tuần tự
scene: s4-uuid-v7
callout:
  kind: good-to-know
  title: Chuẩn RFC 9562 thay thế UUID v4 cho khoá cơ sở dữ liệu
  vi: "UUID v7 đặt 48 bit mốc thời gian Unix (mili-giây) lên đầu rồi mới tới các bit ngẫu nhiên, giúp các ID sinh sau luôn lớn hơn ID sinh trước và nối đuôi êm ái vào B-tree."
whatChanged:
  - "+ Cấu trúc 128 bit của UUID v7: 48 bit unix_ts_ms đứng đầu + 74 bit ngẫu nhiên/đếm"
  - "~ Giữ tính tự sinh không phối hợp của UUID đồng thời loại bỏ tách trang ngẫu nhiên"
telemetry:
  - label: "Phần đầu (48 bit)"
    value: "Unix Timestamp (ms)"
    tone: ok
  - label: "Tương thích cột"
    value: "Chuẩn UUID 16 byte"
    tone: ok
```

Nếu hệ cơ sở dữ liệu của bạn đã chuẩn hoá kiểu cột `UUID` 16 byte nhưng muốn chấm dứt hiện tượng phân mảnh B-tree của UUID v4, **UUID v7** (chuẩn hoá trong RFC 9562) là lựa chọn nâng cấp trực tiếp tốt nhất.

Bằng cách đặt **48 bit thời gian mili-giây** ở các bit trọng số cao nhất (đủ dùng tới năm 10889) theo sau bởi 4 bit phiên bản (`0111`), 2 bit biến thể và 74 bit ngẫu nhiên (hoặc bộ đếm con trong cùng mili-giây), mọi UUID v7 mới sinh đều tập trung về nhánh phải cùng của chỉ mục B-tree, đưa tốc độ `INSERT` về sát với `BIGINT` tuần tự mà vẫn không cần máy chủ cấp số hay cấu hình mã máy.

## 5. Cấu trúc 64-bit Snowflake: gọn nửa dung lượng, hàng triệu ID mỗi giây

```step
category: MECHANISM
short: Cấu trúc 64-bit
scene: s5-snowflake-bits
activity: S3-05.A2
gate: optional
callout:
  kind: key-idea
  title: Phép chia không gian 64 bit kinh điển (1 + 41 + 10 + 12)
  vi: "Vừa khít một số nguyên có dấu 64-bit (BIGINT): 1 bit dấu bằng 0, 41 bit thời gian mili-giây (~69 năm), 10 bit định danh máy (1.024 nút) và 12 bit số thứ tự cục bộ (4.096 ID/ms/máy)."
whatChanged:
  - "+ Trực quan hoá dải 64 bit của Snowflake trên băng bộ nhớ memory-2d"
  - "+ Tính năng lực phát hành: 4.096 ID/ms = 4.096.000 ID/giây trên mỗi nút độc lập"
telemetry:
  - label: "Kích thước lưu trữ"
    value: "64 bit (8 byte BIGINT)"
    tone: ok
  - label: "Số nút tối đa"
    value: "2^10 = 1.024 máy"
    tone: default
  - label: "Trần mỗi máy"
    value: "4.096 ID / mili-giây"
    tone: ok
```

Khi hệ thống đòi hỏi định danh gọn đúng **64 bit (`BIGINT`)** để tối ưu RAM, băng thông mạng và tốc độ so sánh số nguyên (như Twitter/X, Discord, Instagram), mẫu thiết kế **Snowflake** phân chia 64 bit thành bốn trường không chồng lấn:

1. **1 bit dấu (Bit 63 = `0`):** Giữ toàn bộ giá trị là số nguyên dương trong mọi ngôn ngữ lập trình (Java `long`, PostgreSQL `BIGINT`).
2. **41 bit Timestamp (mili-giây tính từ mốc Epoch tuỳ chọn):** `2^41 ms ≈ 69,7 năm`. Vì nằm ở nhóm bit cao nhất, sắp xếp theo giá trị số cũng chính là sắp xếp xấp xỉ theo thời gian tạo.
3. **10 bit Machine / Worker ID:** Phân biệt tối đa `2^10 = 1.024` tiến trình sinh ID chạy song song (có thể tách thành 5 bit Datacenter + 5 bit Worker, cấp tự động lúc khởi động qua ZooKeeper/etcd hoặc dải IP Pod).
4. **12 bit Sequence:** Bộ đếm cục bộ trong RAM tăng từ `0` đến `4.095` cho các ID sinh trong **cùng một mili-giây** trên cùng một máy, và đặt lại về `0` khi sang mili-giây kế tiếp.

## 6. Cài đặt và giải mã ngược Metadata từ một số Snowflake

```step
category: REAL_CODE
short: Giải mã bit
scene: s6-snowflake-decode
callout:
  kind: technique
  title: Lợi thế gỡ lỗi trong vận hành thực tế
  vi: "Chỉ cần dịch phải 22 bit một mã đơn hàng bất kỳ trong log lỗi, kỹ sư trực hệ thống biết ngay mili-giây tạo đơn và mã máy chủ đã sinh ra nó mà không cần truy vấn Database."
whatChanged:
  - "+ Phép dịch bit ghép (<<, |) lúc sinh ID và tách ngược (>>, &) lúc chẩn đoán"
  - "~ Khi sequence chạm 4.095 trong cùng 1 ms, vòng lặp đợi sang mili-giây kế tiếp"
telemetry:
  - label: "Tách thời gian"
    value: "(id >> 22) + EPOCH"
    tone: ok
  - label: "Tách mã máy"
    value: "(id >> 12) & 0x3FF"
    tone: default
```

Việc ghép và tách các trường của Snowflake chỉ tốn vài chu kỳ lệnh CPU bằng phép toán thao tác bit:

```python
EPOCH_MS = 1704067200000  # 2024-01-01T00:00:00Z

def pack_snowflake(now_ms: int, worker_id: int, seq: int) -> int:
    return ((now_ms - EPOCH_MS) << 22) | ((worker_id & 0x3FF) << 12) | (seq & 0xFFF)

def unpack_snowflake(sf_id: int) -> dict:
    return {
        "timestamp_ms": (sf_id >> 22) + EPOCH_MS,
        "worker_id": (sf_id >> 12) & 0x3FF,
        "sequence": sf_id & 0xFFF,
    }
```

Lưu ý quan trọng với ứng dụng Web: kiểu `Number` chuẩn IEEE-754 của JavaScript chỉ biểu diễn chính xác số nguyên tới `2^53 - 1` (`53 bit`), nhỏ hơn `64 bit` của Snowflake. Vì vậy khi trả Snowflake qua JSON API cho trình duyệt, **luôn tuần tự hoá thành kiểu chuỗi (`"1859204..."`)** để trình duyệt không làm tròn mất các bit cuối.

## 7. Cạm bẫy đồng hồ nhảy lùi (Clock Rollback) với bộ sinh Snowflake

```step
category: PITFALL
short: Đồng hồ nhảy lùi
scene: s7-clock-rollback
callout:
  kind: watch-out
  title: Điểm nhạy cảm lớn nhất của Snowflake
  vi: "Nếu dịch vụ đồng bộ giờ NTP chỉnh giật lùi đồng hồ hệ thống về lại mili-giây vừa đi qua và sequence reset về 0, cùng một máy có thể phát ra chính xác ID đã cấp trước đó!"
whatChanged:
  - "+ Mô tả kịch bản NTP giật lùi đồng hồ vật lý làm lặp lại cặp (timestamp, seq)"
  - "+ Hai lớp phòng vệ: tạm dừng chờ nếu lệch nhỏ (< 5 ms), báo lỗi nếu lệch lớn"
telemetry:
  - label: "Lệch lùi ≤ 5 ms"
    value: "Đợi qua last_ts rồi cấp"
    tone: warn
  - label: "Lệch lùi lớn"
    value: "Từ chối & Cảnh báo"
    tone: bad
```

Vì Snowflake nhúng trực tiếp đồng hồ tường (`wall-clock`) vào 41 bit đầu, nó phụ thuộc chặt vào tính đơn điệu của thời gian trên từng máy. Khi tiến trình đồng bộ giờ **NTP** phát hiện đồng hồ máy chạy nhanh hơn giờ chuẩn và thực hiện bước nhảy lùi (`step backward`) vài chục mili-giây, `now_ms < last_timestamp_ms` xảy ra.

Mọi bộ sinh Snowflake sản xuất đều bắt buộc cài đặt chốt chặn trạng thái `last_timestamp_ms`:
- **Cấu hình NTP ở chế độ làm chậm mượt (`slewing` / `chrony`):** Thay vì nhảy giật lùi, hệ điều hành cho đồng hồ trôi chậm lại đôi chút cho tới khi khớp giờ chuẩn, giữ thời gian luôn tiến về phía trước.
- **Chốt chặn trong mã nguồn:** Nếu `now_ms < last_ts` với độ lệch nhỏ (ví dụ `≤ 5 ms`), luồng sinh ID tạm ngủ vài mili-giây chờ đồng hồ vượt qua `last_ts` (hoặc mượn tiếp dải `sequence` của chính `last_ts`). Nếu lệch lớn bất thường (hàng trăm ms), nút lập tức ngừng cấp ID, bắn cảnh báo vận hành và để Load Balancer chuyển tải sang máy khác thay vì mạo hiểm sinh trùng khoá chính.

## 8. Cạm bẫy lộ thông tin kinh doanh và mẫu thiết kế hai định danh

```step
category: PITFALL
short: Lộ quy mô đơn
scene: s8-public-private-id
callout:
  kind: watch-out
  title: Không phơi bày trực tiếp ID tuần tự nhạy cảm ra URL bên ngoài
  vi: "ID tự tăng làm lộ tốc độ tăng trưởng đơn hàng cho đối thủ; còn Snowflake công khai làm lộ chính xác mili-giây tạo bản ghi và số hiệu máy chủ nội bộ."
whatChanged:
  - "+ Tách bạch Khoá chính nội bộ (Internal PK) với Mã công khai (Public ID)"
  - "~ Vừa giữ tốc độ JOIN / B-tree tối đa bên trong, vừa chống đoán mò từ bên ngoài"
telemetry:
  - label: "Khoá nội bộ (PK / FK)"
    value: "BIGINT Snowflake"
    tone: ok
  - label: "Mã trên URL / API"
    value: "NanoID / UUIDv4"
    tone: ok
```

Nếu sàn thương mại điện tử đặt thẳng `/orders/100450` lên đường dẫn công khai, đối thủ chỉ cần đặt một đơn lúc 9 giờ sáng và một đơn lúc 9 giờ tối rồi trừ hai con số là biết chính xác doanh số trong ngày; kẻ tấn công cũng dễ dàng quét tuần tự nếu một API kiểm tra quyền truy cập bị sót lỗi (IDOR). Ngay cả với Snowflake, người ngoài vẫn giải mã được thời điểm tạo đơn tới từng mili-giây.

Giải pháp chuẩn trong thiết kế cơ sở dữ liệu là **tách cặp định danh kép** cho các bảng đối mặt người dùng:
- **Nội bộ (`id BIGINT PRIMARY KEY`):** Dùng Snowflake (hoặc `AUTO_INCREMENT` trên hệ đơn) cho mọi phép `JOIN`, khoá ngoại và phân trang con trỏ tốc độ cao.
- **Công khai (`public_id VARCHAR / UUID UNIQUE`):** Sinh thêm một chuỗi ngẫu nhiên mật mã học ngắn gọn như `ord_9kF3xP8m2QvL` (NanoID / UUID v4) có đánh chỉ mục `UNIQUE` để hiển thị trên URL và hóa đơn.

## 9. Gỡ bỏ cổ chai Ticket Server khi lưu lượng ghi tăng cao

```step
category: TECHNIQUE
short: Gỡ nghẽn cấp ID
scene: s9-scale-live
live: id-scale
activity: S3-05.A3
gate: required
callout:
  kind: technique
  title: Phi tập trung hoá bước sinh ID về ngay trong RAM ứng dụng
  vi: "Thay thế lời gọi mạng vào Ticket Server bằng bộ sinh Snowflake cục bộ trên từng instance Order Service giúp triệt tiêu cả điểm lỗi đơn lẫn cổ chai thông lượng ghi."
whatChanged:
  - "~ Tăng tải lên 3.600 req/s (75% là lệnh ghi tạo đơn = 2.700 đơn/giây)"
  - "~ Ticket Server (1.200 req/s) quá tải nặng làm lỗi vọt lên khi chưa chuyển sang Snowflake"
telemetry:
  - label: "ρ Ticket (t = 55 s)"
    value: "{ticket.rho@55:2}"
    tone: bad
  - label: "ρ DB Shards (t = 55 s)"
    value: "{db.rho@55:2}"
    tone: bad
  - label: "p99 ban đầu (t = 55 s)"
    value: "{global.p99@55:0} ms"
    tone: bad
```

Trên sân khấu `S3-05/id-scale`, đợt mở bán đẩy lưu lượng từ 600 lên **3.600 req/s** (75% tạo đơn mới = **2.700 lượt ghi/giây**). Kiến trúc hiện tại bộc lộ cùng lúc hai nút thắt:
1. `Ticket Server` đơn lẻ chỉ cấp tối đa 1.200 ID/giây (`ρ = 2,25` ở giây 55), đồng thời là điểm lỗi đơn của toàn cụm.
2. Cụm `Order DB Shards` hiện chỉ có 2 phân mảnh (tổng năng lực `2 × 2 × 650 = 2.600 ops/s`), bị quá tải khi gánh toàn bộ 3.600 req/s đọc và ghi (`ρ = 1,38`).

Khi chuyển việc sinh ID về **Snowflake nội tại trên từng máy `Order Service`** (tắt phụ thuộc `Ticket Server`) kết hợp mở rộng số phân mảnh `Order DB Shards` lên 4 với khoá chính 64-bit chèn tuần tự, độ trễ `p99` hạ từ hơn 800 ms xuống dưới **70 ms**, lỗi về **0%** và chi phí hạ tầng còn giảm nhẹ.

## 10. Tóm tắt: khung lựa chọn chiến lược định danh phân tán

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Ba quy tắc chọn nhanh trong thiết kế
  vi: "Cần 64-bit tốc độ cao và sắp xếp theo thời gian → Snowflake; cần chuẩn UUID 128-bit không quản lý mã máy → UUID v7; cần mã URL không đoán trước được → NanoID / UUID v4."
whatChanged:
  - "+ Tổng hợp bảng đối chiếu kích thước, thứ tự B-tree, độ phụ thuộc và bảo mật"
telemetry:
  - label: "64-bit hiệu năng cao"
    value: "Snowflake (1+41+10+12)"
    tone: ok
  - label: "128-bit không cấu hình"
    value: "UUID v7"
    tone: ok
```

Đối chiếu bốn phương án định danh phổ biến trong hệ phân tán:

| Phương án | Kích thước | Chèn tuần tự B-tree | Phối hợp / Phụ thuộc | Phù hợp nhất cho |
|---|---|---|---|---|
| `AUTO_INCREMENT` / Ticket Server | 64 bit | Rất tốt | Phụ thuộc máy cấp số (cần HA + xin theo lô) | Hệ đơn lẻ hoặc cần số thứ tự ngắn liên tục |
| **UUID v4** | 128 bit | Kém (tách trang ngẫu nhiên) | Không cần phối hợp, không cần đồng hồ | Mã token công khai, khoá ngoài B-tree (KV) |
| **UUID v7** | 128 bit | Tốt (48 bit thời gian đầu) | Chỉ cần đồng hồ địa phương tương đối | Mặc định hiện đại cho cột `UUID` trong SQL |
| **Snowflake** | 64 bit | Rất tốt (41 bit thời gian đầu) | Quản lý `worker_id` (10 bit) + canh giữ đồng hồ NTP | Giao dịch, tin nhắn, sự kiện thông lượng cực lớn |
