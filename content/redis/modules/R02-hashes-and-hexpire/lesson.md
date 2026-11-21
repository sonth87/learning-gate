# Hashes, nén bộ nhớ listpack & đột phá HEXPIRE trên từng trường (Redis 8)

> [!NOTE] Bối cảnh & Giải nghĩa bình dân
> Khi cần lưu thông tin một người dùng (`name`, `tier`, `points`, `otp_code`) hoặc một giỏ hàng lên Redis, người mới thường làm theo 1 trong 2 cách chưa tối ưu:
> 1. **Gom hết thành 1 cục văn bản JSON lưu vào `String`:** Giống như đóng gói cả bộ hồ sơ vào **thùng các-tông dán băng keo kín mít**. Mỗi lần khách chỉ được cộng thêm `10` điểm thưởng, ứng dụng phải tải cả thùng JSON nặng `20KB` qua mạng về máy, cắt băng keo (`json.loads` / `JSON.parse`), sửa đúng 1 con số rồi dán thùng gửi đè lên lại — vừa tốn băng thông, vừa dễ **ghi đè mất dữ liệu của nhau (*Lost Update*)** khi 2 thao tác diễn ra cùng lúc!
> 2. **Xé lẻ thành 10 khóa `String` rời rạc (`user:42:name`, `user:42:points`...):** Giống như mua 10 cái két sắt to đùng chỉ để mỗi két cất đúng 1 tờ giấy nhỏ — phần "vỏ két" quản lý khóa của Redis sẽ ngốn RAM gấp 3–5 lần dữ liệu thật!
>
> **Redis Hash** giải quyết trọn vẹn cả hai nỗi đau: nó hoạt động giống hệt một **tủ hồ sơ nhiều ngăn kéo có dán nhãn từng ngăn (`field -> value`)** — tương đương `dict[str, str]` trong Python, `Map<string, string>` trong JS/Java hay `map[string]string` trong Go:
> - **`listpack` (Danh sách đóng gói liền khối):** Với các Hash vừa và nhỏ, Redis xếp tất cả ngăn kéo nằm sát cạnh nhau trên một dải bộ nhớ phẳng không tốn con trỏ thừa, tiết kiệm tới **60%–70% RAM**.
> - **`HEXPIRE` (Hẹn giờ tự hủy cho từng trường — Đột phá trên Redis 7.4 / Redis 8):** Trước đây bạn chỉ có thể hẹn giờ hủy cả cái tủ (`EXPIRE user:42`). Nay trên **Redis 8**, bạn có thể gắn đồng hồ tự hủy riêng cho đúng ngăn kéo `otp_code` sau 60 giây mà ==giữ nguyên toàn bộ hồ sơ `user:42` còn lại==!

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

## 1. Khi nào chọn JSON String, khi nào chọn Redis Hash (hoặc Redis JSON)?

> [!ANALOGY] Quy tắc chọn nhanh trong 5 giây
> - Chọn **JSON String** khi dữ liệu là **thùng hàng nguyên đai nguyên kiện** (cấu trúc lồng nhau nhiều tầng phức tạp và API luôn đọc/trả về 100% cục dữ liệu đó).
> - Chọn **Redis Hash** khi dữ liệu là **bảng thuộc tính phẳng hay được đọc/sửa từng phần** (cộng điểm `HINCRBY`, đổi số lượng món hàng trong giỏ, kiểm tra 2 trường nhỏ mà không muốn kéo cả cục `50KB` về ứng dụng).

```visual
kind: compare
title: Lưu Đối Tượng Bằng JSON String vs Redis Hash — Chọn Sao Cho Chuẩn?
subtitle: Đừng dùng một chiếc búa cho mọi chiếc đinh — hãy nhìn vào tần suất cập nhật lẻ và độ sâu lồng nhau của dữ liệu
left:
  badge: ĐỌC NGUYÊN KHỐI
  title: String chứa JSON / MsgPack
  tone: sky
  lang: python
  code: |
    # Python (redis-py): Phù hợp khi luôn trả nguyên khối JSON ra API
    import json
    r.set("cache:article:901", json.dumps(nested_article), ex=600)
  bullets:
    - "**Mạnh khi:** Dữ liệu lồng nhau nhiều tầng (mảng nằm trong object) và API luôn đọc/ghi nguyên khối 100%."
    - "**Yếu khi:** Cần cộng/trừ 1 con số liên tục hoặc chỉ cần đọc 2 trường nhỏ trong một object nặng `50KB`."
right:
  badge: SỬA LẺ NGUYÊN TỬ & SIÊU NÉN RAM
  title: Redis Hash (Cặp field -> value phẳng)
  tone: emerald
  lang: redis
  code: |
    HSET user:42 name "An" tier "pro" credits 200
    HINCRBY user:42 credits -15
    HMGET user:42 name credits
  bullets:
    - "**Mạnh khi:** Cập nhật từng trường độc lập (`HINCRBY`, `HSET`), đọc chọn lọc vài trường (`HMGET`) và cần tiết kiệm RAM cho hàng triệu bản ghi."
    - "**Lưu ý hệ sinh thái Redis 8:** Giá trị mỗi `field` trong Hash là chuỗi phẳng. Nếu bạn vừa có cây JSON lồng sâu nhiều tầng vừa muốn sửa lẻ nhánh con (`JSON.SET`, `JSON.NUMINCRBY`), **Redis 8** đã tích hợp sẵn kiểu dữ liệu **Redis JSON** nguyên bản mà không cần cài thêm plugin ngoài!"
```

## 2. Bí mật tiết kiệm RAM: `listpack` thay thế hoàn toàn `ziplist` cũ

Trước Redis 7, Hash nhỏ dùng cấu trúc `ziplist` nhưng mắc nhược điểm *dịch chuyển dây chuyền (cascade update)* khi chèn phần tử lớn ở giữa. Từ **Redis 7 → Redis 8**, cấu trúc nội bộ mặc định cho Hash nhỏ là ==`listpack` — một dải byte phẳng nằm liền kề nhau trên RAM==:

- **Hai ngưỡng cấu hình giữ Hash ở dạng siêu nén `listpack`** (trong `redis.conf`):
  1. `hash-max-listpack-entries` (mặc định `128` hoặc `512` tùy bản phân phối): Tổng số trường trong Hash không vượt quá ngưỡng này.
  2. `hash-max-listpack-value 64`: Độ dài tên trường và giá trị mỗi trường **từ `64 bytes` trở xuống**.
- Ngay khi vượt 1 trong 2 ngưỡng (ví dụ chèn thêm 1 đoạn mô tả dài `300 bytes` hoặc nhét hàng ngàn trường vào 1 Hash), Redis **tự động nâng cấp một chiều** Hash đó lên bảng băm **`hashtable`** để giữ tốc độ tra cứu `O(1)` (và không tự hạ ngược về `listpack` dù sau đó bạn xóa bớt trường).

## 3. Bộ lệnh Hash cốt lõi & Đột phá `HEXPIRE` trên từng trường (Redis 8)

```visual
kind: anatomy
title: Bản Đồ Lệnh Hash & Hẹn Giờ Từng Trường (Per-Field Expiration)
subtitle: Kết hợp nhuần nhuyễn nhóm lệnh O(1) với HEXPIRE/HTTL của Redis 8
items:
  - keyword: HSET & HMGET
    role: O(K) · Ghi & đọc chọn lọc
    tone: emerald
    summary: Ghi nhiều cặp `field value` cùng lúc bằng `HSET` (thay thế hoàn toàn `HMSET` cũ đã lỗi thời) và chỉ lấy đúng `K` trường cần dùng bằng `HMGET`.
    bullets:
      - "`HSET` trả về số lượng trường **được thêm mới** (trường cũ bị ghi đè vẫn cập nhật thành công nhưng không cộng vào số đếm trả về)."
    example: |
      HSET user:99 name "Linh" role "sre" quota 500
      HMGET user:99 name quota
    lang: redis
  - keyword: HINCRBY / HSETNX
    role: O(1) · Đếm & khởi tạo an toàn
    tone: sky
    summary: Cộng/trừ số nguyên ngay trên 1 trường cụ thể (`HINCRBY`) hoặc chỉ gán giá trị mặc định nếu trường đó chưa tồn tại (`HSETNX`).
    example: |
      HINCRBY cart:u:99 sku:ipad 1
      HSETNX cart:u:99 shipping "standard"
    lang: redis
  - keyword: HEXPIRE ... FIELDS
    role: Redis 7.4+ / 8.0 · Field TTL
    tone: amber
    summary: Gắn thời gian tự huỷ (giây) cho 1 hoặc nhiều trường bên trong Hash mà không ảnh hưởng tới các trường khác!
    bullets:
      - "Hỗ trợ đủ cờ điều kiện `NX` (chỉ đặt nếu trường chưa có hạn), `XX`, `GT`, `LT` đặt **trước** từ khoá `FIELDS <số-lượng-trường>`."
      - "Khi trường cuối cùng trong Hash hết hạn hoặc bị `HDEL`, toàn bộ khoá Hash rỗng cũng được Redis tự thu dọn sạch sẽ."
    example: |
      HEXPIRE cart:u:99 900 NX FIELDS 1 promo:flash20
      HTTL cart:u:99 FIELDS 1 promo:flash20
    lang: redis
  - keyword: HSCAN (thay HGETALL)
    role: Duyệt an toàn Big Hash
    tone: rose
    summary: Khi một Hash có hàng ngàn trường, bắt buộc dùng con trỏ phân trang `HSCAN` thay vì gọi `HGETALL` `O(N)` gây nghẽn Event Loop!
    example: HSCAN metrics:daily:2026-11-14 0 MATCH api:* COUNT 100
    lang: redis
```

Hãy xem kịch bản thực tế của tính năng **Field-level TTL (`HEXPIRE`)** với giỏ hàng thương mại điện tử (trên CLI và Python / Node.js):

```redis
# 1. Thêm 2 món hàng chính và 1 mã giảm giá chớp nhoáng vào giỏ hàng
HSET cart:u:777 sku:airpods "1" sku:case "2" promo:flash50 "GIAM50K"

# 2. Toàn bộ giỏ hàng sống 7 ngày (604800s), NHƯNG mã flash50 chỉ có hiệu lực 15 phút (900s)!
EXPIRE cart:u:777 604800
HEXPIRE cart:u:777 900 FIELDS 1 promo:flash50

# 3. Kiểm tra hạn sống riêng của từng trường bằng HTTL (-1 = không hạn riêng, >=0 = số giây còn lại, -2 = không tồn tại)
HTTL cart:u:777 FIELDS 2 sku:airpods promo:flash50
```

```python
# Python (redis-py >= 5.1) & Node.js (ioredis) gọi thao tác Hash chọn lọc:
r.hset("cart:u:777", mapping={"sku:airpods": "1", "promo:flash50": "GIAM50K"})
r.hincrby("cart:u:777", "sku:airpods", 1)
r.execute_command("HEXPIRE", "cart:u:777", 900, "FIELDS", 1, "promo:flash50")
items = r.hmget("cart:u:777", ["sku:airpods", "promo:flash50"])  # Chỉ đọc đúng 2 trường cần thiết!
```

> [!WARNING] Hai cái bẫy kinh điển khi làm việc với Redis Hash
> 1. **Thói quen gọi `HGETALL` vô tội vạ:** Trên một Hash hồ sơ `8` trường thì `HGETALL` chỉ mất vài micro-giây. Nhưng nếu ai đó gom toàn bộ danh mục 200,000 sản phẩm vào **1 khóa Hash khổng lồ duy nhất (`catalog:all`)**, mỗi lệnh ==`HGETALL catalog:all` sẽ khóa cứng Event Loop== và đổ hàng chục MB qua card mạng! Hãy chỉ lấy đúng trường cần dùng bằng **`HMGET`** hoặc duyệt bằng **`HSCAN`**.
> 2. **Quên tham số đếm `<numfields>` sau từ khóa `FIELDS` của `HEXPIRE` / `HTTL`:** Cú pháp chuẩn luôn yêu cầu truyền rõ **số lượng trường** ngay sau chữ `FIELDS` (ví dụ `HEXPIRE myhash 60 FIELDS 2 f1 f2`).

> [!REMEMBER] Ghi nhớ bỏ túi (Tóm tắt 30 giây)
> - Dùng **`HSET`** (ghi nhiều trường — bỏ `HMSET` cũ), **`HMGET`** (đọc chọn lọc đúng trường cần thiết) và **`HINCRBY`** (cộng trừ số lượng nguyên tử tại chỗ).
> - Hash nhỏ giữ dưới ngưỡng cấu hình sẽ được đóng gói liền mạch bằng ==`listpack` tiết kiệm tới ~70% RAM== so với tách lẻ nhiều khóa String.
> - Trên **Redis 8** (lưu ý: `HEXPIRE` là tính năng mới từ Redis 7.4+/8, kiểm tra phiên bản nếu hạ tầng Cloud dùng nhánh cũ hơn), dùng **`HEXPIRE key seconds [NX|XX|GT|LT] FIELDS n f1 ...`** và **`HTTL`** để đặt hạn sống độc lập cho từng trường.
