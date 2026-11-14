# Hashes, nén bộ nhớ listpack & đột phá HEXPIRE trên từng trường (Redis 8)

Khi lưu thông tin một người dùng hoặc một giỏ hàng lên Redis, phản xạ đầu tiên của rất nhiều lập trình viên JavaScript / Python là `JSON.stringify(user)` rồi ném thẳng vào một `String`. Cách đó chạy được ở quy mô nhỏ, nhưng nhanh chóng bộc lộ **3 nỗi đau lớn** khi lên Production:

- [>] Mỗi lần chỉ muốn cộng thêm `1` điểm thưởng (`credits`) hay đổi trạng thái `online`, app phải tải nguyên cục JSON `20KB` về, `JSON.parse`, sửa 1 trường rồi `SET` đè lại — vừa tốn băng thông vừa dính **Lost Update (ghi đè mất dữ liệu)** khi 2 request chạy song song!
- [+] Nếu tách lẻ thành 10 khoá String rời (`user:42:name`, `user:42:tier`, `user:42:credits`...), bộ khung quản lý con trỏ `redisObject` + `dictEntry` của 10 khoá trên bảng băm toàn cục sẽ **ngốn RAM gấp 3–5 lần** dữ liệu thật.
- [!] **Redis Hash** giải quyết trọn vẹn cả hai: gom các cặp `field -> value` phẳng vào chung một khoá (giống hệt `Record<string, string>` trong TS hay `dict[str, str]` trong Python), đóng gói liền mạch bằng cấu trúc siêu nén **`listpack`**, và từ **Redis 7.4 / Redis 8** còn hỗ trợ vũ khí từng được mong chờ suốt hơn 10 năm: ==hẹn giờ tự huỷ trên từng trường riêng lẻ (`HEXPIRE`)==!

```visual
kind: illustration
diagram: redis:r02
alt: Cấu trúc Redis Hash đóng gói siêu gọn bằng listpack trên CPU cache, ngưỡng nâng cấp lên hashtable và cơ chế HEXPIRE tự huỷ từng field trên Redis 8
badge: Cấu trúc dữ liệu · Hashes & HEXPIRE
title: Giải Phẫu Redis Hash — Nén Bộ Nhớ listpack & Hẹn Giờ Từng Trường HEXPIRE
subtitle: Đọc/ghi thuộc tính lẻ O(1), tiết kiệm tới 70% RAM cho đối tượng nhỏ và tự động gỡ trường tạm đúng giây hết hạn
caption: Nhấn vào sơ đồ để phóng to — quan sát ranh giới chuyển đổi tự động từ listpack sang hashtable và dòng thời gian của HEXPIRE
callouts:
  - num: 1
    label: Biểu Diễn Kép (listpack -> hashtable)
    desc: Khi số trường <= 128 và mỗi giá trị <= 64 bytes, toàn bộ Hash nằm trên 1 dải byte liên tiếp (listpack) cực thân thiện CPU Cache, không tốn con trỏ rời.
    tone: emerald
  - num: 2
    label: Thao Tác Thuộc Tính Lẻ Nguyên Tử
    desc: HSET, HMGET và HINCRBY tác động thẳng vào đúng trường cần sửa trong 1 nhịp nguyên tử mà không đụng tới các trường anh em.
    tone: sky
  - num: 3
    label: Đột Phá Redis 8 — Per-Field TTL (HEXPIRE / HTTL)
    desc: Đặt hạn sống độc lập cho từng field (như OTP phụ, mã flash-voucher, token tạm) ngay bên trong Hash mẹ mà không làm bay màu cả đối tượng!
    tone: amber
```

## 1. Khi nào chọn JSON String, khi nào chọn Redis Hash?

> [!ANALOGY] Quy tắc ngón tay cái cho dân Backend
> Hãy coi **JSON String** như một **thùng hàng đóng băng niêm phong kín** (luôn lấy cả thùng, không bao giờ mở lẻ từng món), còn **Redis Hash** như một **tủ ngăn kéo có nhãn từng ô** (`name`, `credits`, `cart_qty` — muốn mở ngăn nào sửa ngăn nấy độc lập, không cần bê cả tủ ra ngoài!).

```visual
kind: compare
title: Lưu Đối Tượng Bằng JSON String vs Redis Hash — Chọn Sao Cho Chuẩn?
subtitle: Đừng dùng một búa cho mọi chiếc đinh — hãy nhìn vào tần suất cập nhật lẻ và độ sâu lồng nhau của dữ liệu
left:
  badge: ĐỌC NGUYÊN KHỐI
  title: String chứa JSON / MsgPack
  tone: sky
  lang: ts
  code: |
    // Phù hợp khi luôn trả nguyên cục JSON ra HTTP response
    await redis.set(
      'cache:article:901',
      JSON.stringify(nestedArticle),
      'EX', 600
    );
  bullets:
    - "**Mạnh khi:** Dữ liệu lồng nhau nhiều tầng (mảng trong object) và API luôn đọc/ghi nguyên khối 100%."
    - "**Yếu khi:** Cần tăng/giảm 1 con số liên tục hoặc chỉ đọc 2 trường nhỏ trong một object nặng `50KB`."
right:
  badge: SỬA LẺ & SIÊU NÉN RAM
  title: Redis Hash (Phẳng 1 cấp)
  tone: emerald
  lang: redis
  code: |
    HSET user:42 name "An" tier "pro" credits 200
    HINCRBY user:42 credits -15
    HMGET user:42 name credits
  bullets:
    - "**Mạnh khi:** Cập nhật từng trường độc lập (`HINCRBY`, `HSET`), đọc chọn lọc vài trường (`HMGET`) và cần tiết kiệm RAM cho hàng triệu bản ghi phẳng."
    - "**Lưu ý:** Giá trị của mỗi `field` trong Hash chỉ là chuỗi phẳng (không lồng Hash trực tiếp trong Hash — nếu cần toàn bộ cây JSON sâu có truy vấn chỉ mục, hãy cân nhắc module JSON của Redis 8)."
```

## 2. Bí mật tiết kiệm RAM: `listpack` thay thế hoàn toàn `ziplist` cũ

Trước Redis 7, Hash nhỏ dùng `ziplist` nhưng dính nhược điểm *cascade update* (sửa 1 phần tử có thể kéo theo dịch chuyển độ dài dây chuyền). Từ **Redis 7 → Redis 8**, cấu trúc nội bộ mặc định cho Hash nhỏ là **`listpack`** — một mảng byte phẳng liên tiếp không con trỏ phụ:

- **Điều kiện giữ ở dạng siêu nén `listpack`** (theo cấu hình mặc định trong `redis.conf`):
  1. `hash-max-listpack-entries 128` — Tổng số trường trong Hash **không vượt quá 128** (lưu ý: bản cấu hình một số hệ thống để `512`, ở runtime mặc định phổ biến là `128`–`512`).
  2. `hash-max-listpack-value 64` — Độ dài tên trường và giá trị mỗi trường **từ `64 bytes` trở xuống**.
- Ngay khi vượt 1 trong 2 ngưỡng trên (ví dụ thêm trường thứ `129` hoặc chèn 1 chuỗi dài `200B`), Redis **tự động nâng cấp một chiều** Hash đó sang **`hashtable`** để giữ tốc độ tra cứu `O(1)` (và sẽ không tự hạ ngược về `listpack` dù sau đó bạn xoá bớt trường).

## 3. Bộ lệnh Hash cốt lõi & Đột phá `HEXPIRE` trên Redis 8

```visual
kind: anatomy
title: Bản Đồ Lệnh Hash & Hẹn Giờ Từng Trường (Per-Field Expiration)
subtitle: Kết hợp nhuần nhuyễn nhóm lệnh O(1) với HEXPIRE/HTTL của Redis 8
items:
  - keyword: HSET & HMGET
    role: O(K) · Ghi & đọc chọn lọc
    tone: emerald
    summary: Ghi nhiều cặp `field value` cùng lúc bằng `HSET` (thay thế hoàn toàn `HMSET` cũ) và chỉ lấy đúng `K` trường cần dùng bằng `HMGET`.
    bullets:
      - "`HSET` trả về số lượng trường **được thêm mới** (các trường đã tồn tại bị ghi đè không tính vào số trả về, nhưng vẫn cập nhật thành công)."
    example: |
      HSET user:99 name "Linh" role "sre" quota 500
      HMGET user:99 name quota
    lang: redis
  - keyword: HINCRBY / HSETNX
    role: O(1) · Đếm & khởi tạo an toàn
    tone: sky
    summary: Tăng/giảm số nguyên ngay trên 1 trường cụ thể (`HINCRBY`) hoặc chỉ gán giá trị mặc định nếu trường chưa tồn tại (`HSETNX`).
    example: |
      HINCRBY cart:u:99 sku:ipad 1
      HSETNX cart:u:99 shipping "standard"
    lang: redis
  - keyword: HEXPIRE ... FIELDS
    role: Redis 7.4+ / 8.0 · Field TTL
    tone: amber
    summary: Gắn thời gian tự huỷ (giây) cho 1 hoặc nhiều trường bên trong Hash mà không ảnh hưởng tới các trường khác!
    bullets:
      - "Hỗ trợ đủ cờ điều kiện `NX` (chỉ đặt nếu trường chưa có hạn), `XX`, `GT`, `LT` trước từ khoá `FIELDS <numfields>`."
      - "Khi trường cuối cùng trong Hash hết hạn hoặc bị `HDEL`, toàn bộ khoá Hash rỗng cũng được Redis tự thu dọn."
    example: |
      HEXPIRE cart:u:99 900 NX FIELDS 1 promo:flash20
      HTTL cart:u:99 FIELDS 1 promo:flash20
    lang: redis
  - keyword: HSCAN (thay HGETALL)
    role: Duyệt an toàn Big Hash
    tone: rose
    summary: Khi một Hash có hàng chục ngàn trường, tuyệt đối dùng con trỏ `HSCAN` thay vì gọi `HGETALL` `O(N)` gây nghẽn Event Loop.
    example: HSCAN metrics:daily:2026-11-14 0 MATCH api:* COUNT 100
    lang: redis
```

Hãy xem kịch bản hoàn chỉnh của tính năng **Field-level TTL** trên Redis 8 với giỏ hàng thương mại điện tử:

```redis
# 1. Thêm 2 món hàng chính và 1 mã giảm giá chớp nhoáng vào giỏ hàng
HSET cart:u:777 sku:airpods "1" sku:case "2" promo:flash50 "GIAM50K"

# 2. Toàn bộ giỏ hàng sống 7 ngày (604800s), NHƯNG mã flash50 chỉ có hiệu lực 15 phút (900s)!
EXPIRE cart:u:777 604800
HEXPIRE cart:u:777 900 FIELDS 1 promo:flash50

# 3. Kiểm tra hạn sống riêng của từng trường bằng HTTL (-1 = không hạn riêng, >=0 = số giây còn lại, -2 = không tồn tại)
HTTL cart:u:777 FIELDS 2 sku:airpods promo:flash50
```

> [!TRAP] Hai cái bẫy kinh điển khi làm việc với Redis Hash
> 1. **Thói quen gọi `HGETALL` vô tội vạ:** Trên một Hash hồ sơ `8` trường thì `HGETALL` chỉ mất vài micro-giây. Nhưng nếu đồng nghiệp nhét toàn bộ danh sách 200,000 sản phẩm của cửa hàng vào **1 khoá Hash khổng lồ duy nhất (`catalog:all`)**, mỗi cú gọi `HGETALL catalog:all` sẽ đóng băng Event Loop và đổ hàng chục MB qua card mạng!
> 2. **Nhầm lẫn cú pháp `FIELDS <numfields>` của `HEXPIRE` / `HTTL`:** Luôn phải truyền chính xác **số lượng trường** ngay sau từ khoá `FIELDS` (ví dụ `HEXPIRE myhash 60 FIELDS 2 f1 f2`).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - Dùng **`HSET`** (ghi nhiều trường — bỏ `HMSET` cũ), **`HMGET`** (đọc đúng trường cần thiết) và **`HINCRBY`** (cộng trừ số lượng nguyên tử tại chỗ).
> - Hash nhỏ giữ dưới ngưỡng `hash-max-listpack-entries` & `hash-max-listpack-value` sẽ được nén liền khối bằng **`listpack`**, tiết kiệm RAM vượt trội.
> - Trên **Redis 8**, dùng **`HEXPIRE key seconds [NX|XX|GT|LT] FIELDS n f1 ...`** và **`HTTL`** để đặt hạn sống độc lập cho từng trường mà không cần đẻ thêm khoá String phụ.
