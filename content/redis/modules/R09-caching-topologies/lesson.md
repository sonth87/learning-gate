# Mô hình Caching: Cache-Aside, Write-Through, Write-Behind và xử lý bất nhất dữ liệu

> [!NOTE] Khái niệm cốt lõi & Bài toán thực tế
> Nếu trang chi tiết sản phẩm có 50,000 lượt xem mỗi phút nhưng giá sản phẩm cả ngày chỉ đổi 1–2 lần, việc bắt PostgreSQL thực thi lại câu `SELECT` phức tạp 50,000 lần/phút là rất lãng phí. Đặt **Redis làm bộ nhớ đệm (*Cache*)** đứng phía trước giúp giảm thời gian đọc từ `25ms` xuống dưới **`0.4ms`**:
> - **`Cache Hit`:** Dữ liệu đã có sẵn trong Redis -> ứng dụng đọc và trả về ngay cho client.
> - **`Cache Miss`:** Khóa chưa có trong Redis (hoặc đã hết hạn `TTL`) -> ứng dụng truy vấn Database, sau đó ghi bản sao lên Redis kèm `TTL` để các request tiếp theo dùng lại.
> - **`Cache Invalidation`:** Quá trình xóa hoặc làm mới bản đệm cũ khi dữ liệu gốc trong Database thay đổi, nhằm ==tránh tình trạng người dùng đọc phải dữ liệu cũ (*Stale Data*)==.

> [!NOTE] Phân biệt trực tiếp 3 chiến lược đọc/ghi Cache
> - **Cache-Aside (*Lazy Loading*):** Ứng dụng kiểm tra Redis trước; chỉ khi `Cache Miss` mới đọc từ Database và nạp ngược lên Redis.
> - **Write-Through:** Mọi thao tác ghi đều cập nhật đồng bộ cả Database và Redis trước khi trả kết quả thành công.
> - **Write-Behind (*Write-Back*):** Ứng dụng ghi ngay vào Redis (`< 1ms`) và trả kết quả, sau đó worker nền gom theo lô (*batch*) để cập nhật xuống Database sau.

## 1. Bức tranh toàn cảnh 4 Mô hình Caching (Caching Topologies)

Không có một mô hình duy nhất cho mọi bài toán. Kỹ sư thiết kế chọn mô hình dựa trên **tỷ lệ Đọc/Ghi**, mức chấp nhận độ trễ dữ liệu cũ và tầm quan trọng của dữ liệu:

```visual
kind: illustration
diagram: "redis:r09"
badge: "Caching Topologies · R09"
title: "Kiến Trúc 4 Luồng Đọc/Ghi Giữa Application, Redis và Database"
subtitle: "So sánh đường đi dữ liệu của Cache-Aside, Write-Through và nguy cơ Race Condition khi đồng bộ kép"
caption: "90% microservice Web/API hiện đại chọn Cache-Aside kết hợp UNLINK sau khi commit Database."
callouts:
  - num: 1
    label: "Cache-Aside (Lazy Populate)"
    desc: "App tự kiểm tra Redis trước; nếu Miss mới đọc DB rồi nạp ngược lên Redis kèm TTL bắt buộc."
    tone: sky
  - num: 2
    label: "Invalidate thay vì Update đè"
    desc: "Khi sửa dữ liệu gốc ở DB, xoá khoá bằng UNLINK an toàn và nhẹ hơn nhiều so với tính toán lại rồi SET đè."
    tone: emerald
  - num: 3
    label: "Write-Through & Write-Behind"
    desc: "Write-Through giữ cache luôn tươi mới cho luồng đọc nóng; Write-Behind gom batch tăng tốc ghi nhưng chấp nhận rủi ro mất mát nếu sập nguồn."
    tone: amber
```

- [>] **1. Cache-Aside (*Lazy Loading*)** [!badge:emerald:Phổ biến nhất - 90% hệ thống]: Ứng dụng chủ động điều phối cả hai bên. Điểm cộng lớn nhất là Redis **chỉ tốn RAM cho những dữ liệu thực sự có người hỏi thăm**, và nếu Redis gặp sự cố ngắn hạn, ứng dụng vẫn có thể tự động đọc trực tiếp Database (*fallback*) thay vì tê liệt toàn bộ.
- [>] **2. Read-Through / Write-Through** [!badge:sky:Cache luôn tươi mới]: Mọi thao tác ghi đều ghi đồng bộ vào cả Database lẫn Redis trước khi trả kết quả. Triệt tiêu hiện tượng *Cold Miss* ngay sau khi tạo mới bản ghi (như vừa nạp tiền ví hoặc đổi quyền VIP), đánh đổi bằng độ trễ ghi cao hơn.
- [>] **3. Write-Behind (*Write-Back*)** [!badge:amber:Thông lượng ghi cực đại]: Ứng dụng ghi thẳng vào Redis (`HINCRBY`, `ZINCRBY`, `XADD`) trả kết quả tức thì dưới `1ms`, sau đó Worker nền gom lô (*Batch UPSERT*) ghi xuống PostgreSQL/ClickHouse. Rất hợp cho **đếm lượt xem video, tim livestream, tọa độ xe**, nhưng không dùng cho số dư ngân hàng nếu chưa thiết kế chống mất điện kỹ lưỡng!
- [>] **4. Stale-While-Revalidate (*SWR* — Trả bản cũ trong lúc âm thầm làm mới)** [!badge:violet:Độ trễ mượt mà]: Nhúng mốc hết hạn mềm bên trong dữ liệu; khi vừa quá hạn mềm, khách hàng vẫn nhận phản hồi tức thì trong `0.4ms` trong khi 1 tác vụ nền lặng lẽ cập nhật lại giá trị mới từ Database.

## 2. Chiến lược đồng bộ dữ liệu: Nên cập nhật đè hay xóa Cache khi Database thay đổi?

Đây là câu hỏi phỏng vấn System Design kinh điển! Giả sử sản phẩm `id=108` vừa giảm giá từ `5.000.000đ` xuống `4.290.000đ`. Tại sao ==chuẩn công nghiệp luôn là: Ghi Database thành công trước -> Xóa (`UNLINK`) Cache sau==?

```visual
kind: compare
title: "Bẫy Bất Nhất Dữ Liệu (Dual-Write Race) vs Chuẩn Mực Xoá Sau Commit"
subtitle: "Tại sao tự SET đè hoặc xoá Cache TRƯỚC khi ghi Database đều dễ sinh ra dữ liệu cũ nằm lì suốt hàng giờ?"
left:
  badge: "SAI LẦM PHỔ BIẾN"
  title: "Cập nhật đè Cache hoặc Xoá Cache TRƯỚC DB"
  tone: rose
  code: |
    # Bẫy: Xoá Cache TRƯỚC khi commit DB -> Luồng đọc chen ngang!
    await redis.delete(f"cache:product:{id}")
    # [!] Ngay mili-giây này Request B nhảy vào thấy Miss,
    # đọc giá CŨ từ DB và SET ngược lại vào Redis suốt 1 giờ!
    await db.execute("UPDATE products SET price = $1...", price)
  lang: python
  bullets:
    - "**Race Condition khi 2 luồng cùng SET đè:** Request A cập nhật DB trước, Request B cập nhật DB sau, nhưng vì trễ mạng nên B `SET` Redis trước rồi A `SET` đè giá cũ lên sau!"
    - "**Lãng phí tài nguyên:** Nếu mặt hàng đổi giá 50 lần/phút nhưng cả tiếng mới có 1 người xem, tính toán lại JSON 50 lần là vô ích."
right:
  badge: "CHUẨN PRODUCTION"
  title: "1. Commit DB -> 2. UNLINK Cache bất đồng bộ"
  tone: emerald
  code: |
    # 1. Ghi nguồn sự thật (PostgreSQL) thành công trước
    await db.execute("UPDATE products SET price = $1 WHERE id = $2", price, id)

    # 2. Gỡ khoá cũ dưới nền O(1) bằng UNLINK (thay vì DEL)
    await redis.unlink(f"cache:product:{id}")
  lang: python
  bullets:
    - "**Xác suất lệch cực thấp:** Dữ liệu chỉ được nạp lại vào Redis khi thực sự có người đọc tiếp theo sau khi DB đã lưu xong bản mới."
    - "**`UNLINK` thay vì `DEL`:** Tháo con trỏ khóa trong `O(1)`, nhường việc giải phóng RAM cho luồng nền mà không làm khựng Event Loop."
```

> [!WARNING] Xử lý thế nào nếu `db.execute()` thành công nhưng câu lệnh `redis.unlink()` ngay sau đó bị đứt mạng?
> 1. **Lưới bảo hiểm số 1 — Luôn gắn `TTL` có hạn (`300s–900s`):** Đảm bảo dù `unlink` có rớt mạng thì dữ liệu cũ cũng tự biến mất sau vài phút chứ không bao giờ sai lệch vĩnh viễn!
> 2. **Lưới bảo hiểm số 2 (Hệ thống lớn):** Thử lại (`retry`) lệnh `unlink` tối đa 2 lần, hoặc dùng luồng **CDC (*Change Data Capture* — như Debezium đọc nhật ký WAL của PostgreSQL)** tự động bắn sự kiện xóa cache cho tới khi thành công.

## 3. Ba Kỹ thuật Thiết kế Khóa Cache & Hệ sinh thái Thư viện Thực tế

```visual
kind: anatomy
title: "Ba Kỹ Thuật Thiết Kế Khóa Cache An Toàn"
subtitle: "Chống lỗi lệch cấu trúc khi cập nhật code mới, chống cạn kiệt RAM và chặn truy vấn rác"
items:
  - keyword: "Versioned Key"
    role: "Triển khai Zero-Downtime"
    tone: cyan
    summary: "Nhúng hậu tố phiên bản cấu trúc (`v1`, `v2`) vào tên khoá khi thay đổi định dạng dữ liệu."
    bullets:
      - "Khi bản code mới thêm trường `discount_pct` vào JSON, đổi tên khoá sang ==`cache:product:v2:108`== giúp container code cũ và code mới chạy song song êm ái lúc triển khai (Rolling Update)!"
    example: |
      SET cache:product:v2:108 '{"price":4290000,"discount_pct":15}' EX 600
    lang: redis
  - keyword: "Mandatory Atomic TTL"
    role: "Kỷ luật Quản trị Bộ nhớ"
    tone: emerald
    summary: "Mọi khoá Cache ĐỀU PHẢI gắn hạn sống (`EX` / `PX`) ngay trong cùng 1 câu lệnh `SET`."
    bullets:
      - "Không bao giờ viết rời `SET` rồi mới `EXPIRE` kẻo sinh ra **Zombie Key** tồn tại vĩnh viễn ăn mòn RAM."
    example: |
      SET cache:product:v2:108 '{"price":4290000}' EX 600
    lang: redis
  - keyword: "Negative Cache"
    role: "Ngăn truy vấn ID không tồn tại"
    tone: amber
    summary: "Lưu chuỗi đánh dấu rỗng (`\"__NULL__\"`) với TTL ngắn (`30s–60s`) khi Database trả về 0 dòng."
    bullets:
      - "Ngăn chặn việc khách hỏi đi hỏi lại một mã giảm giá không tồn tại làm chọc thẳng xuống Database ở mọi request."
    example: |
      SET cache:coupon:GHOST2026 "__NULL__" EX 45
    lang: redis
```

> [!TIP] Thư viện Caching đa tầng (L1 RAM + L2 Redis) & Tính năng `CLIENT TRACKING` của Redis 8
> Trên thực tế Production, thay vì tự viết `if cached: ...` lặp lại ở hàng trăm API, các kỹ sư thường dùng thư viện chuẩn hỗ trợ **Cache 2 tầng** (L1 trên RAM cục bộ của ứng dụng siêu nhanh `~50ns` + L2 trên Redis dùng chung) hoặc tính năng **Server-Assisted Client-Side Caching (`CLIENT TRACKING`)** tích hợp sẵn trong `redis-py` và `ioredis` (khi khóa trên Redis thay đổi, Redis chủ động gửi tin nhắn báo ứng dụng xóa ngay bản đệm L1 cục bộ!):
> - **Python / FastAPI:** **`cashews`** (hỗ trợ sẵn Cache-Aside, SWR, Singleflight, Client-side tracking), **`fastapi-cache2`**, hoặc `cachetools` + `redis.asyncio`.
> - **Node.js / TypeScript:** **`bentocache`** (đa tầng L1+L2 + SWR cực mạnh) hoặc `cache-manager`.
> - **Java / Spring Boot:** **`Caffeine` (L1) + `Redisson` / `Spring Cache` (L2)**.

## 4. Mẫu triển khai Cache-Aside chuẩn mực (Python Async & TypeScript)

```python
# Python (FastAPI + redis.asyncio): Cache-Aside + Negative Cache ngắn hạn + UNLINK sau khi ghi DB
import json

SENTINEL_NULL = "__NULL__"

async def get_product_by_id(r, db, product_id: int) -> dict | None:
    key = f"cache:product:v2:{product_id}"
    cached = await r.get(key)
    if cached is not None:
        return None if cached == SENTINEL_NULL else json.loads(cached)

    row = await db.fetch_one("SELECT id, name, price FROM products WHERE id = $1", product_id)
    if row is None:
        await r.set(key, SENTINEL_NULL, ex=45)  # Negative Cache 45 giây
        return None

    payload = dict(row)
    await r.set(key, json.dumps(payload), ex=600)  # Gộp nguyên tử SET + EX
    return payload

async def update_product_price(r, db, product_id: int, new_price: int) -> None:
    await db.execute("UPDATE products SET price = $1 WHERE id = $2", new_price, product_id)
    await r.unlink(f"cache:product:v2:{product_id}")  # Xoá bất đồng bộ sau khi DB commit!
```

> [!REMEMBER] Ghi nhớ cốt lõi từ R09
> 1. **Cache-Aside + Xóa sau khi ghi DB (`Commit DB -> UNLINK Cache`)** là công thức mặc định an toàn và phổ biến nhất cho 90% hệ thống Web/API.
> 2. Luôn gộp nguyên tử **`SET key val EX <ttl>`**; không bao giờ lưu nguyên đối tượng ORM khổng lồ vài MB vào một khóa Cache.
> 3. Kết hợp ==Versioned Key (`v1`, `v2`)== khi nâng cấp cấu trúc JSON và ==Negative Caching (`"__NULL__"` TTL `30–60s`)== cho các bản ghi không tồn tại.
