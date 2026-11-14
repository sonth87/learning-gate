# Cấu trúc xác suất & Không gian: Bitmap, HyperLogLog, Bloom Filter & Geo

Khi ứng dụng của bạn tăng trưởng từ **10,000** lên **50,000,000 người dùng**, những cấu trúc dữ liệu chính xác tuyệt đối như `Set` hay `Hash` bắt đầu đụng bức tường vật lý của chi phí phần cứng:

- [>] Lưu 50 triệu chuỗi UUID khách ghé thăm một bài báo vào `Set` để đếm lượt xem duy nhất (*Unique Visitors*) ngốn đứt **~3.5 GB RAM** chỉ cho **1 bài báo**!
- [+] Kẻ xấu bắn bot hỏi liên tục các mã đơn hàng không tồn tại (`order_id = -9918273...`) khiến Redis luôn báo *Cache Miss* và dồn 100% truy vấn xuyên thủng xuống giết chết PostgreSQL (**Cache Penetration**).
- [!] Đây là lúc các kỹ sư Hệ thống lớn rút ra **4 vũ khí tối thượng của Redis 8**: nén trạng thái nhị phân bằng **Bitmap**, đếm hàng trăm triệu thực thể chỉ tốn `12 KB` bằng **HyperLogLog**, dựng khiên lọc **Bloom Filter** (nay đã tích hợp sẵn mặc định trong nhân Redis 8!), và tìm kiếm bán kính bản đồ bằng **Geospatial (`GEOSEARCH`)**.

```visual
kind: illustration
diagram: redis:r05
alt: Bốn cấu trúc dữ liệu chuyên dụng cho quy mô lớn trên Redis 8 — Mảng bit Bitmap, thanh ghi 12KB HyperLogLog, bộ lọc nhiều hàm băm Bloom Filter và lưới Geohash 52-bit
badge: Quy mô hàng chục triệu User · Redis 8
title: Bản Đồ 4 Vũ Khí Nén Không Gian & Xác Suất Trong Redis 8
subtitle: Giảm 99% chi phí RAM nhờ thao tác bit, ước lượng xác suất thông minh và mã hoá không gian 2 chiều thành số nguyên 52-bit
caption: Nhấn vào sơ đồ để phóng to — đối chiếu cơ chế vận hành của Bitmap, HyperLogLog (12KB), Bloom Filter và chỉ mục Geohash
callouts:
  - num: 1
    label: Bitmap & HyperLogLog (Đếm Quy Mô Lớn)
    desc: Bitmap tiêu tốn đúng 1 bit/user (~12MB cho 100 triệu user) cho phép giao/hợp theo ngày; HyperLogLog đóng trần cứng 12KB để đếm Unique với sai số chỉ 0.81%.
    tone: sky
  - num: 2
    label: Bloom Filter Tích Hợp Sẵn Trong Redis 8 (BF.*)
    desc: Nếu Bloom Filter trả lời 0 ("Chắc chắn chưa từng thấy!"), bạn chặn đứng truy vấn ngay trên RAM 100% chính xác mà không bao giờ chạm tới Database đĩa.
    tone: emerald
  - num: 3
    label: Geospatial Trên Nền ZSet + Geohash 52-bit
    desc: Đan xen bit kinh độ (Longitude) và vĩ độ (Latitude) thành điểm score 52-bit trên Skip List, tìm tài xế quanh 3km bằng GEOSEARCH trong vài mili-giây.
    tone: amber
```

## 1. Bảng quyết định nhanh: Khi nào dùng Set, Bitmap, HyperLogLog hay Bloom?

> [!ANALOGY] Hình dung sự đánh đổi giữa "Chính xác từng tên" và "Siêu tiết kiệm RAM"
> - **`Set`** giống cuốn **sổ hộ khẩu đầy đủ họ tên**: tốn nhiều giấy nhất nhưng đọc lại được từng cái tên.
> - **`Bitmap`** giống **bảng điểm danh đánh dấu tích `0/1` theo số thứ tự học sinh**: cực gọn nếu mã học sinh là số nguyên liên tiếp `0..N`.
> - **`HyperLogLog`** giống **máy ước lượng đám đông ở sân vận động**: chỉ chiếm đúng 1 tờ giấy nhớ `12 KB` để báo "có khoảng 84,300 khán giả (±0.81%)", nhưng không lưu tên bất kỳ ai.
> - **`Bloom Filter`** giống **người gác cổng câu lạc bộ**: nói *"Anh chắc chắn KHÔNG có trong danh sách!"* thì đúng **100%**, còn nói *"Có vẻ có tên đấy"* thì có xác suất nhầm rất nhỏ (ví dụ `1%` *False Positive*) có thể cấu hình trước!

| Cấu trúc | RAM cho 10 triệu mục | Đọc lại danh sách? | Kiểm tra 1 mục tồn tại? | Bài toán sinh ra để giải |
| --- | --- | --- | --- | --- |
| **Set** (`SADD`) | ~`400 MB – 650 MB` | Có (`SSCAN`) | Chính xác 100% (`SISMEMBER`) | Tập nhỏ/vừa cần lấy lại danh sách phần tử gốc |
| **Bitmap** (`SETBIT`) | **`1.2 MB`** (`10M bits`) | Theo offset bit | Chính xác 100% (`GETBIT`) | Cờ trạng thái `0/1` cho ID số nguyên (`DAU`, chuỗi Retention `BITOP AND`) |
| **HyperLogLog** (`PFADD`) | **`12 KB`** (cố định!) | **Không** | **Không** | Đếm lượng khách truy cập duy nhất (`PFCOUNT`, gộp ngày bằng `PFMERGE`) |
| **Bloom Filter** (`BF.ADD`) | **`~11.5 MB`** (sai số `1%`) | **Không** | **Không bao giờ âm tính giả!** | Chặn **Cache Penetration**, kiểm tra email/username đã đăng ký, chống gửi trùng quảng cáo |

## 2. Giải phẫu lệnh Bitmap, HyperLogLog & Bloom Filter trên Redis 8

Một điểm nâng cấp cực đáng giá của **Redis 8**: trước đây muốn dùng `BF.ADD` bạn phải cài riêng gói *Redis Stack* hoặc nạp module *RedisBloom* thủ công; nay **Redis 8 đã tích hợp sẵn các cấu trúc dữ liệu mở rộng ngay trong bản phát hành chính thức**!

```visual
kind: anatomy
title: Bộ Lệnh Thực Chiến Cho Bitmap, HyperLogLog & Bloom Filter
subtitle: Đúng công cụ cho đúng bài toán dữ liệu lớn
items:
  - keyword: SETBIT / BITCOUNT / BITOP
    role: Bitmap trên nền String
    tone: sky
    summary: Bật/tắt bit thứ `offset` (`SETBIT`), đếm tổng số bit `1` siêu nhanh bằng tập lệnh CPU POPCNT (`BITCOUNT`), và tính `AND`/`OR`/`XOR` giữa nhiều ngày (`BITOP`).
    bullets:
      - "Ví dụ kinh điển: `BITOP AND streak:3d dau:d1 dau:d2 dau:d3` lọc ra toàn bộ user online đủ cả 3 ngày chỉ trong vài mili-giây!"
    example: |
      SETBIT dau:2026-11-14 1042 1
      BITCOUNT dau:2026-11-14
    lang: redis
  - keyword: PFADD / PFCOUNT / PFMERGE
    role: HyperLogLog (12 KB max)
    tone: violet
    summary: Ghi nhận phần tử vào thanh ghi xác suất (`PFADD`), lấy ước lượng lực lượng duy nhất (`PFCOUNT`), và gộp nhiều khoá HLL thành 1 khoá tuần/tháng (`PFMERGE`).
    example: |
      PFADD uv:home:d1 "u1" "u2" "u1"
      PFCOUNT uv:home:d1
    lang: redis
  - keyword: BF.RESERVE / BF.MADD / BF.MEXISTS
    role: Bloom Filter · Redis 8
    tone: emerald
    summary: Cấp phát bộ lọc với tỷ lệ dương tính giả & sức chứa dự kiến (`BF.RESERVE key error_rate capacity`), thêm phần tử (`BF.ADD`/`BF.MADD`) và kiểm tra (`BF.EXISTS`/`BF.MEXISTS`).
    bullets:
      - "**Định luật bất biến:** `BF.EXISTS` trả về `0` = **100% chắc chắn KHÔNG tồn tại** (chặn ngay, khỏi hỏi DB!). Trả về `1` = **Có khả năng tồn tại** (cho phép đi tiếp xuống Cache/DB)."
      - "Lưu ý: Không thể xoá 1 phần tử khỏi Bloom Filter chuẩn (nếu bắt buộc phải xoá, hãy tìm hiểu biến thể *Cuckoo Filter* `CF.*`)."
    example: |
      BF.RESERVE bf:skus 0.01 100000
      BF.MADD bf:skus "sku:1" "sku:2"
      BF.EXISTS bf:skus "sku:fake-999"
    lang: redis
```

## 3. Geospatial (`GEOADD` & `GEOSEARCH`): Tìm tài xế quanh bán kính trong chớp mắt

Làm sao Redis tìm được tất cả tài xế trong bán kính `3 km` quanh bạn mà không phải tính công thức lượng giác Haversine với toàn bộ 100,000 xe trong thành phố?
- Khi bạn gọi **`GEOADD key longitude latitude member`**, Redis đan xen các bit nhị phân của kinh độ và vĩ độ tạo thành một mã nguyên **Geohash 52-bit**, rồi nhét thẳng vào một **Sorted Set (`ZSet`)** chuẩn với `score = geohash_52bit`!
- Những điểm gần nhau ngoài đời thực sẽ chia sẻ chung tiền tố Geohash nên nằm sát cạnh nhau trên **Skip List**. Khi gọi **`GEOSEARCH`**, Redis chỉ cần quét đúng 9 ô lưới lân cận bằng `ZRANGE` rồi lọc khoảng cách chính xác ở bước cuối!

```redis
# Chú ý vàng: KINH ĐỘ (Longitude: -180..180) LUÔN đứng trước VĨ ĐỘ (Latitude: -85.05..85.05)!
GEOADD drivers:hcm 106.6980 10.7725 "driver:minh" 106.6588 10.8185 "driver:tuan"

# Đo khoảng cách đường chim bay giữa 2 điểm (đơn vị: m | km | mi | ft)
GEODIST drivers:hcm "driver:minh" "driver:tuan" km

# Chuẩn Redis 6.2+ / Redis 8: Dùng GEOSEARCH (thay thế GEORADIUS cũ đã deprecated!)
GEOSEARCH drivers:hcm FROMLONLAT 106.7000 10.7750 BYRADIUS 3 km ASC COUNT 5
```

> [!TRAP] Ba cái bẫy rất dễ vấp với Bitmap và Geospatial
> 1. **Truyền `offset` khổng lồ thưa thớt vào `SETBIT`:** Nếu user ID của bạn bắt đầu từ `4,000,000,000` (tối đa `2^32 - 1`) và bạn truyền thẳng vào `SETBIT key 4000000000 1`, Redis sẽ cấp phát ngay một chuỗi dài **`512 MB` toàn số 0** chỉ vì 1 bit ở cuối! Nếu ID lớn hoặc không bắt đầu từ 0, hãy trừ đi mốc cơ sở (`id - BASE_ID`) hoặc chia mảnh theo lô (`key = bitmap:${Math.floor(id / 1_000_000)}`).
> 2. **Viết ngược Vĩ độ - Kinh độ giống Google Maps:** Trên Google Maps ta quen đọc `(Lat, Lon)` = `(10.7725, 106.6980)`. Nhưng chuẩn hình học đề-các `(X, Y)` của Redis `GEOADD` và GeoJSON bắt buộc **`Longitude` (`106.6980`) trước, `Latitude` (`10.7725`) sau** — viết ngược sẽ báo lỗi vượt ngưỡng `85.05112878` độ vĩ!
> 3. **Tìm lệnh `GEODEL` không tồn tại:** Vì khoá Geo có `TYPE` thực chất là **`zset`**, muốn xoá 1 điểm toạ độ hãy gọi thẳng **`ZREM <key> <member>`**!

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Bitmap (`SETBIT`/`BITCOUNT`/`BITOP`):** 1 bit cho mỗi ID tuần tự — vô địch cho bài toán Điểm danh hàng ngày & Retention.
> - **HyperLogLog (`PFADD`/`PFCOUNT`/`PFMERGE`):** Đóng trần **`12 KB`**, sai số chuẩn **`0.81%`** — vô địch đếm Unique Visitors.
> - **Bloom Filter (`BF.RESERVE`/`BF.ADD`/`BF.EXISTS`):** Trả về `0` là **chắc chắn 100% chưa có**; trả về `1` có xác suất nhỏ dương tính giả — lá chắn chuẩn chống **Cache Penetration**.
> - **Geo (`GEOADD`/`GEODIST`/`GEOSEARCH`):** Nhớ câu thần chú **`Lon` trước `Lat` sau**, dùng `GEOSEARCH` thay `GEORADIUS` cũ, và xoá điểm bằng `ZREM`.
