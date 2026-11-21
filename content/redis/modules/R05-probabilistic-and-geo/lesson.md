# Cấu trúc xác suất & Không gian: Bitmap, HyperLogLog, Bloom Filter & Geo

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Khi hệ thống mới có 10,000 người dùng, lưu mọi thứ chính xác từng chữ vào `Set` hay `Hash` chẳng tốn bao nhiêu bộ nhớ. Nhưng khi nền tảng vươn tới **50 triệu người dùng**, bài toán vật lý của RAM hiện nguyên hình:
> - Nếu lưu 50 triệu chuỗi ID người đọc vào một `Set` chỉ để đếm xem bài báo có bao nhiêu người đọc duy nhất (*Unique Visitors*), riêng **1 bài báo đã ngốn đứt ~3.5 GB RAM**!
> - Nếu kẻ xấu dùng bot hỏi dồn dập hàng triệu mã đơn hàng ảo không tồn tại (`order_id = -99182...`), Redis không thấy trong cache nên đẩy 100% câu hỏi xuyên thủng xuống làm gục Database!
>
> Đó là lúc các kỹ sư rút ra **4 cấu trúc dữ liệu nén không gian & xác suất thông minh** (tất cả đều **có sẵn mặc định trong Redis 8**):
> 1. **`Bitmap` (Bản đồ bit `0/1`):** Thay vì ghi tên `"user_42"`, ta dùng 1 dãy công tắc đèn siêu nhỏ mà mỗi người chỉ chiếm đúng **1 bit** (`0` = vắng, `1` = có mặt) — lưu điểm danh 100 triệu người chỉ mất `~12 MB`!
> 2. **`HyperLogLog` (`HLL` — Bộ ước lượng số lượng duy nhất):** Thuật toán toán học kỳ diệu đếm hàng trăm triệu người truy cập không trùng lặp mà ==luôn chỉ tốn tối đa đúng `12 KB` RAM== (đổi lại chấp nhận sai số siêu nhỏ `±0.81%` — quá hoàn hảo để hiện *"1.24M lượt xem"*).
> 3. **`Bloom Filter` (Bộ lọc gác cổng xác suất):** Hoạt động như người bảo vệ cầm danh sách rút gọn ở cổng: nếu Bloom nói **"Chắc chắn KHÔNG có!" (`0`)** thì **đúng 100%** (không bao giờ bỏ sót người thật — *0% False Negative*), giúp chặn đứng truy vấn rác ngay tại cửa! Nếu nói **"Có vẻ có" (`1`)**, có xác suất nhầm rất nhỏ (ví dụ `1%` *False Positive* — dương tính giả) được phép đi tiếp vào kiểm tra kỹ hơn.
> 4. **`Geospatial` (Chỉ mục bản đồ 2 chiều):** Biến kinh độ & vĩ độ thành một con số 52-bit (**`Geohash`**) đặt lên `Skip List` của `ZSet`, giúp tìm các tài xế quanh bán kính `3 km` chỉ trong vài mili-giây!

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

## 1. Bảng quyết định nhanh: Khi nào chọn Set, Bitmap, HyperLogLog hay Bloom Filter?

> [!ANALOGY] Hình dung sự đánh đổi giữa "Giữ từng cái tên" và "Tiết kiệm 99% RAM"
> - **`Set`** = Cuốn sổ hộ khẩu ghi đủ họ tên (tốn giấy nhất nhưng đọc lại được từng tên).
> - **`Bitmap`** = Tờ phiếu trắc nghiệm tô ô tròn `0/1` theo số báo danh `0..N`.
> - **`HyperLogLog`** = Máy đếm lưu lượng khán giả ở cổng sân vận động trên tờ giấy nhớ `12 KB` (biết tổng số người, nhưng không lưu tên ai).
> - **`Bloom Filter`** = Máy quét vé nhanh ở vòng ngoài chặn 99% vé giả trước khi vào quầy kiểm tra chính.

| Cấu trúc | RAM cho 10 triệu mục | Lấy lại danh sách tên? | Kiểm tra 1 mục tồn tại? | Bài toán sinh ra để giải |
| --- | --- | --- | --- | --- |
| **Set** (`SADD`) | ~`400 MB – 650 MB` | Có (`SSCAN`) | Chính xác 100% (`SISMEMBER`) | Tập nhỏ/vừa cần đọc lại danh sách phần tử gốc |
| **Bitmap** (`SETBIT`) | **`1.2 MB`** (`10M bits`) | Theo số thứ tự bit | Chính xác 100% (`GETBIT`) | Cờ điểm danh `0/1` cho ID số nguyên (`DAU`, chuỗi đăng nhập liên tục `BITOP AND`) |
| **HyperLogLog** (`PFADD`) | **`12 KB`** (cố định!) | **Không** | **Không** | Đếm lượt khách truy cập duy nhất (`PFCOUNT`, gộp tuần/tháng bằng `PFMERGE`) |
| **Bloom Filter** (`BF.ADD`) | **`~11.5 MB`** (sai số `1%`) | **Không** | ==Không bao giờ âm tính giả!== | Chặn **Cache Penetration**, kiểm tra nhanh username đã tồn tại, lọc tin trùng |

## 2. Giải phẫu lệnh Bitmap, HyperLogLog & Bloom Filter trên Redis 8

Một nâng cấp lớn của **Redis 8**: trước đây muốn dùng lệnh `BF.ADD` bạn phải cài riêng bản *Redis Stack* hoặc nạp module *RedisBloom*; nay **Redis 8 đã tích hợp sẵn nhóm cấu trúc xác suất ngay trong nhân mặc định**!

```visual
kind: anatomy
title: Bộ Lệnh Thực Chiến Cho Bitmap, HyperLogLog & Bloom Filter
subtitle: Đúng công cụ cho đúng bài toán dữ liệu lớn
items:
  - keyword: SETBIT / BITCOUNT / BITOP
    role: Bitmap trên nền String
    tone: sky
    summary: Bật/tắt bit ở vị trí `offset` (`SETBIT`), đếm tổng số bit `1` siêu nhanh bằng tập lệnh phần cứng CPU (`BITCOUNT`), và tính phép `AND`/`OR` giữa nhiều ngày (`BITOP`).
    bullets:
      - "Ví dụ kinh điển: `BITOP AND streak:3d dau:d1 dau:d2 dau:d3` lọc ra toàn bộ user online liên tiếp đủ cả 3 ngày chỉ trong vài mili-giây!"
    example: |
      SETBIT dau:2026-11-14 1042 1
      BITCOUNT dau:2026-11-14
    lang: redis
  - keyword: PFADD / PFCOUNT / PFMERGE
    role: HyperLogLog (Trần 12 KB)
    tone: cyan
    summary: Ghi nhận phần tử vào thanh ghi xác suất (`PFADD`), lấy con số ước lượng duy nhất (`PFCOUNT`), và gộp nhiều ngày thành khoá tuần/tháng (`PFMERGE`).
    example: |
      PFADD uv:home:d1 "u1" "u2" "u1"
      PFCOUNT uv:home:d1
    lang: redis
  - keyword: BF.RESERVE / BF.MADD / BF.EXISTS
    role: Bloom Filter · Redis 8
    tone: emerald
    summary: Khởi tạo bộ lọc với tỷ lệ dương tính giả & sức chứa dự kiến (`BF.RESERVE key error_rate capacity`), thêm phần tử (`BF.ADD`/`BF.MADD`) và kiểm tra (`BF.EXISTS`).
    bullets:
      - "**Định luật bất biến:** `BF.EXISTS` trả về `0` = **100% chắc chắn KHÔNG tồn tại** (chặn ngay, khỏi hỏi Database!). Trả về `1` = **Có khả năng tồn tại** (cho đi tiếp vào Cache/DB)."
      - "Lưu ý: Không thể xoá 1 phần tử lẻ khỏi Bloom Filter chuẩn (nếu nghiệp vụ bắt buộc phải xoá, Redis 8 hỗ trợ thêm biến thể **Cuckoo Filter** với nhóm lệnh `CF.*`)."
    example: |
      BF.RESERVE bf:skus 0.01 100000
      BF.MADD bf:skus "sku:1" "sku:2"
      BF.EXISTS bf:skus "sku:fake-999"
    lang: redis
```

## 3. Geospatial (`GEOADD` & `GEOSEARCH`): Tìm tài xế quanh bán kính trong chớp mắt

Làm sao ứng dụng gọi xe tìm được tất cả tài xế trong bán kính `3 km` quanh bạn mà không phải tính công thức lượng giác cầu kỳ với toàn bộ 100,000 xe trong thành phố?
- Khi bạn gọi **`GEOADD key longitude latitude member`**, Redis đan xen các bit nhị phân của kinh độ và vĩ độ thành một mã số nguyên **Geohash 52-bit**, rồi lưu thẳng vào một **Sorted Set (`ZSet`)** với `score = geohash_52bit`!
- Hai tọa độ gần nhau ngoài đời thực sẽ có chung phần đầu mã Geohash nên nằm sát nhau trên **Skip List**. Khi gọi ==`GEOSEARCH` (chuẩn mới thay cho `GEORADIUS` cũ)==, Redis chỉ cần quét nhanh 9 ô lưới lân cận và lọc khoảng cách chính xác ở bước cuối!

```redis
# Chú ý vàng: KINH ĐỘ (Longitude: -180..180) LUÔN đứng trước VĨ ĐỘ (Latitude: -85.05..85.05)!
GEOADD drivers:hcm 106.6980 10.7725 "driver:minh" 106.6588 10.8185 "driver:tuan"

# Đo khoảng cách đường chim bay giữa 2 điểm (đơn vị: m | km | mi | ft)
GEODIST drivers:hcm "driver:minh" "driver:tuan" km

# Chuẩn Redis 6.2+ / Redis 8: Dùng GEOSEARCH (thay thế GEORADIUS cũ đã deprecated!)
GEOSEARCH drivers:hcm FROMLONLAT 106.7000 10.7750 BYRADIUS 3 km ASC COUNT 5
```

> [!WARNING] Ba cái bẫy rất dễ vấp với Bitmap và Geospatial
> 1. **Truyền số `offset` khổng lồ thưa thớt vào `SETBIT`:** Nếu ID người dùng bắt đầu từ `4,000,000,000` và bạn truyền thẳng vào `SETBIT key 4000000000 1`, Redis sẽ cấp phát ngay một chuỗi dài ==`512 MB` toàn số 0== chỉ vì bật 1 bit ở cuối! Nếu ID lớn, hãy trừ đi mốc cơ sở (`id - BASE_ID`) hoặc chia nhỏ khóa theo từng cụm 1 triệu ID.
> 2. **Viết ngược Vĩ độ – Kinh độ theo thói quen Google Maps:** Trên Google Maps ta quen đọc `(Lat, Lon)` = `(10.7725, 106.6980)`. Nhưng chuẩn tọa độ Đề-các `(X, Y)` của Redis `GEOADD` bắt buộc **`Longitude` (`106.6980`) trước, `Latitude` (`10.7725`) sau** — truyền ngược sẽ báo lỗi vượt ngưỡng vĩ độ `85.05°`!
> 3. **Đi tìm lệnh `GEODEL` không hề tồn tại:** Vì khóa Geo thực chất là một **`zset`** bên dưới, muốn xóa 1 tài xế hãy gọi thẳng lệnh **`ZREM <key> <member>`**!

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - **Bitmap (`SETBIT`/`BITCOUNT`/`BITOP`):** Tốn 1 bit cho mỗi ID liên tiếp — vô địch cho bài toán Điểm danh hàng ngày & Retention.
> - **HyperLogLog (`PFADD`/`PFCOUNT`/`PFMERGE`):** Đóng trần **`12 KB`**, sai số chuẩn **`0.81%`** — vô địch đếm Unique Visitors quy mô lớn.
> - **Bloom Filter (`BF.RESERVE`/`BF.ADD`/`BF.EXISTS`):** Trả về `0` là **chắc chắn 100% chưa từng tồn tại** — lá chắn vòng ngoài chống **Cache Penetration**.
> - **Geo (`GEOADD`/`GEODIST`/`GEOSEARCH`):** Thuộc nằm lòng ==`Longitude` (Kinh độ) trước, `Latitude` (Vĩ độ) sau==, dùng `GEOSEARCH` và xóa điểm bằng `ZREM`.
