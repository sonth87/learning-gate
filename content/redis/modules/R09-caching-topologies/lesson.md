# Kiến trúc Caching Thực chiến: Cache-Aside, Write-Through, Write-Behind & Bẫy Bất nhất

Phil Karlton từng để lại câu nói kinh điển trong giới kỹ thuật phần mềm: *"Chỉ có hai bài toán thực sự khó trong Khoa học Máy tính: đặt tên biến và ==làm mất hiệu lực bộ nhớ đệm (Cache Invalidation)==."* Đưa Redis đứng chắn trước PostgreSQL hay MySQL giúp bạn hạ độ trễ đọc từ `25ms` xuống dưới `{emerald:0.4ms}` và tăng thông lượng gấp 50 lần — nhưng nếu chọn sai mô hình đồng bộ đọc/ghi, khách hàng sẽ nhìn thấy số dư ví cũ, giá khuyến mãi sai lệch hoặc giỏ hàng "bóng ma" suốt hàng giờ liền!

> [!ANALOGY] Ẩn dụ Tủ kệ Quầy pha chế & Kho lạnh Trung tâm
> Hãy hình dung **PostgreSQL** là kho lạnh dưới tầng hầm (chứa toàn bộ nguyên liệu chuẩn xác, bền vững nhưng đi lấy mất 3 phút), còn **Redis** là kệ nguyên liệu ngay tầm tay Barista (lấy mất 1 giây).
> - **Cache-Aside (Lazy Loading):** Khách gọi món nào Barista mới ngó lên kệ; nếu hết thì chạy xuống hầm lấy lên dùng và châm đầy kệ cho các ly sau.
> - **Write-Through:** Mỗi khi quản lý đổi công thức, họ bắt buộc cập nhật sổ kho dưới hầm **đồng thời** thay luôn bình nguyên liệu trên kệ rồi mới báo hoàn tất.
> - **Write-Behind (Write-Back):** Giờ cao điểm bán hàng vội, Barista ghi tạm số lượng tiêu thụ lên bảng trắng trên quầy, cứ 5 giây trợ lý mới gom một mẻ đem xuống hầm cập nhật sổ cái một thể!

## 1. Bức tranh toàn cảnh 4 Mô hình Caching (Caching Topologies)

Không có mô hình nào hoàn hảo cho mọi bài toán. Kỹ sư Hệ thống chọn topology dựa trên **tỷ lệ Đọc/Ghi (Read/Write Ratio)**, mức chấp nhận dữ liệu trễ (*Staleness Tolerance*) và chi phí dựng lại dữ liệu:

```visual
kind: illustration
diagram: "redis:r09"
badge: "Caching Topologies · R09"
title: "Giải phẫu 4 Luồng Đọc/Ghi Giữa Application, Redis và Database"
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

Hãy phân tích ưu/nhược điểm thực chiến của từng kiến trúc:

- [>] **1. Cache-Aside (*Lazy Loading*)** [!badge:emerald:Phổ biến nhất - 90% hệ thống]: Ứng dụng đóng vai nhạc trưởng điều phối cả hai bên. Khi đọc: gọi `GET` trên Redis → nếu trúng (*Cache Hit*) trả về ngay; nếu trượt (*Cache Miss*) mới truy vấn Database, `SET ... EX <ttl>` vào Redis rồi trả kết quả. **Điểm cộng lớn:** Redis chỉ chứa những dữ liệu thực sự có người hỏi thăm (không tốn RAM cho khoá "lạnh") và nếu cụm Redis có sập tạm thời, ứng dụng vẫn có thể tự động rơi (*fallback*) xuống đọc Database (dù chậm hơn) chứ không tê liệt hoàn toàn.
- [>] **2. Read-Through / Write-Through** [!badge:sky:Cache luôn tươi mới]: Ứng dụng coi tầng Cache như kho dữ liệu chính (thường thông qua thư viện trung gian hoặc proxy). Mọi thao tác ghi phải ghi thành công vào cả Database lẫn Redis trong cùng một luồng xử lý thì mới trả `200 OK`. Mô hình này triệt tiêu hiện tượng *Cold Miss* ngay sau khi vừa tạo mới bản ghi (ví dụ vừa phát hành mã giảm giá hoặc cập nhật hồ sơ VIP là người dùng đọc thấy ngay), đánh đổi bằng **độ trễ ghi cao hơn** và nguy cơ tốn RAM cho những bản ghi ghi xong chẳng ai đọc lại.
- [>] **3. Write-Behind (*Write-Back*)** [!badge:amber:Thông lượng ghi cực đại]: Ứng dụng chỉ ghi thẳng vào Redis (`HINCRBY`, `ZINCRBY`, `XADD`) và trả kết quả tức thì ở tốc độ dưới `1ms`. Một tiến trình Worker chạy nền định kỳ rút hàng đợi từ Redis gom thành lô lớn (*Batch UPSERT*) đẩy xuống PostgreSQL/ClickHouse. Cực kỳ lý tưởng cho **đếm lượt xem video, toạ độ tài xế, tim livestream**, nhưng {rose:tuyệt đối cẩn trọng} với giao dịch tiền tệ nếu chưa bật AOF bền vững!
- [>] **4. Refresh-Ahead / Stale-While-Revalidate (*SWR*)** [!badge:violet:P99 Latency phẳng lặng]: Thay vì để TTL vật lý xoá mất khoá khiến khách hàng xui xẻo đầu tiên phải chịu độ trễ đọc DB, ta nhúng thêm mốc `logicalExpireAt` bên trong JSON/Hash. Khi quá hạn logic, luồng đọc vẫn trả ngay dữ liệu cũ trong `0.5ms` đồng thời bắn tín hiệu cho đúng 1 luồng nền đi làm mới êm ái.

## 2. Cuộc chiến kinh điển: Nên Cập nhật Cache hay Xoá Cache? Và Xoá Trước hay Sau DB?

Đây là câu hỏi phỏng vấn System Design đánh trượt hơn một nửa ứng viên Senior Backend! Giả sử sản phẩm `id=108` vừa đổi giá từ `5.000.000đ` xuống `4.290.000đ`. Ta có 3 phương án xử lý lệch pha:

```visual
kind: compare
title: "Bẫy Bất Nhất Dữ Liệu (Dual-Write Race) vs Chuẩn Mực Xoá Sau Commit"
subtitle: "Tại sao tự SET đè hoặc xoá Cache TRƯỚC khi ghi Database đều dẫn tới thảm hoạ dữ liệu cũ vĩnh viễn?"
left:
  badge: "SAI LẦM PHỔ BIẾN"
  title: "Cập nhật đè Cache hoặc Xoá Cache TRƯỚC DB"
  tone: rose
  code: |
    // Bẫy 1: Xoá Cache trước -> Luồng đọc chen ngang!
    await redis.del(`cache:product:${id}`);
    // [!] Ngay mili-giây này Request B nhảy vào thấy Miss,
    // đọc giá CŨ từ DB và SET ngược lại vào Redis suốt 1 giờ!
    await db.query('UPDATE products SET price = $1...', [price]);
  lang: shell
  bullets:
    - "**Race Condition 2 luồng ghi:** Luồng A ghi DB trước, Luồng B ghi DB sau, nhưng gói tin mạng khiến B `SET` Redis trước rồi A `SET` đè giá cũ lên sau!"
    - "**Lãng phí CPU & RAM:** Nếu mặt hàng cập nhật giá 50 lần/phút nhưng chỉ có 1 người xem, bạn tốn 50 lần serialize JSON vô ích."
    - "Dùng lệnh `DEL` đồng bộ trên payload JSON/Hash lớn có thể làm nghẽn Event Loop của Redis."
right:
  badge: "CHUẨN PRODUCTION"
  title: "Ghi DB thành công -> UNLINK Cache bất đồng bộ"
  tone: emerald
  code: |
    // 1. Ghi nguồn sự thật (Source of Truth) trước
    await db.query('UPDATE products SET price = $1 WHERE id = $2', [price, id]);

    // 2. Giải phóng khoá cũ dưới nền O(1) trên luồng chính
    await redis.unlink(`cache:product:${id}`);
  lang: shell
  bullets:
    - "**Cửa sổ lệch cực hẹp:** Kịch bản duy nhất gây lệch là Cache vừa tự hết hạn, Luồng Đọc A đọc DB cũ nhưng bị treo mạng lâu hơn cả tổng thời gian Luồng Ghi B commit DB + `UNLINK` (xác suất cực thấp, và luôn bị chặn bởi TTL)."
    - "**Lazy Evaluation:** Chỉ khi thực sự có khách vào xem mặt hàng đó thì JSON mới được dựng lại đúng 1 lần."
    - "**`UNLINK` thay vì `DEL`:** Gỡ con trỏ khỏi không gian khoá trong `O(1)`, đẩy việc thu hồi bộ nhớ sang luồng nền `bio_lazy_free`."
```

> [!TRAP] Xử lý thế nào nếu `db.update()` thành công nhưng lệnh `redis.unlink()` ngay sau đó bị rớt mạng?
> Đừng bao giờ bọc `db.update()` và `redis.unlink()` vào một Distributed Transaction 2PC nặng nề! Trong hệ thống quy mô vừa, **TTL bắt buộc trên mọi khoá cache** (ví dụ `300s–900s`) là lưới bảo hiểm tự nhiên giúp dữ liệu tự lành. Trong hệ thống tài chính/thương mại điện tử khắt khe hơn, kỹ sư dùng **Retry tối đa 2 lần với Backoff ngắn**, hoặc đọc luồng **Change Data Capture (CDC - Debezium đọc WAL của Postgres)** đẩy qua Kafka/Redis Streams để tiến trình nền chắc chắn gọi `UNLINK` đến khi thành công (*At-least-once invalidation*).

## 3. Ba Kỹ thuật Thiết kế Khoá Cache Bậc thầy

Bên cạnh luồng đọc/ghi, cách bạn tổ chức tên khoá và thời gian sống quyết định khả năng vận hành êm ái khi triển khai phiên bản code mới:

```visual
kind: anatomy
title: "3 Vũ Khí Vận Hành Bộ Nhớ Đệm Không Gián Đoạn"
subtitle: "Chống lỗi Schema khi deploy mới, chống cạn kiệt RAM và chặn truy vấn rác"
items:
  - keyword: "Versioned Key"
    role: "Triển khai Zero-Downtime & Xoá hàng loạt O(1)"
    tone: cyan
    summary: "Nhúng hậu tố phiên bản cấu trúc (`v1`, `v2`) hoặc con trỏ phiên bản danh mục vào tên khoá."
    bullets:
      - "Khi bản release mới đổi cấu trúc JSON (thêm trường `discountPct`), đổi tiền tố sang `cache:product:v2:108` giúp Pod mới và Pod cũ chạy song song trong lúc Rolling Update mà không văng lỗi parse!"
      - "Cần làm mới toàn bộ 50.000 khoá danh mục? Chỉ cần `INCR meta:catalog:ver` từ `3` lên `4` thay vì quét xoá hàng vạn khoá!"
    example: |
      INCR meta:catalog:ver
      SET cache:catalog:v4:featured "[101,108]" EX 900
    lang: redis
  - keyword: "Mandatory TTL"
    role: "Kỷ luật Quản trị Bộ nhớ"
    tone: emerald
    summary: "Mọi khoá mang tính chất Cache ĐỀU PHẢI gắn thời hạn sống (`EX` / `PX`) ngay trong lệnh `SET` nguyên tử."
    bullets:
      - "Tuyệt đối tránh tách rời `SET key val` rồi mới gọi `EXPIRE key 600` ở câu lệnh rời (nếu tiến trình crash giữa 2 lệnh, bạn sinh ra **khoá bất tử - Zombie Key** ăn mòn RAM vĩnh viễn!)."
      - "Luôn gộp nguyên tử: `SET cache:product:108 <json> EX 600`."
    example: |
      SET cache:product:108 '{"price":4290000}' EX 600
    lang: redis
  - keyword: "Negative Cache"
    role: "Lá chắn cho Bản ghi Không tồn tại"
    tone: amber
    summary: "Lưu giá trị đánh dấu rỗng (`\"__NULL__\"` hoặc `\"{}\"`) với TTL cực ngắn (`30s–60s`) khi Database trả về 0 dòng."
    bullets:
      - "Nếu khách hoặc đối tác tích hợp liên tục hỏi mã giảm giá `GHOST2026` không tồn tại, Cache-Aside ngây thơ sẽ thấy `nil` và chọc thẳng xuống Database ở MỌI request!"
      - "Đặt TTL ngắn (`30–60s`) để vừa bảo vệ DB, vừa đảm bảo nếu Admin tạo thật mã `GHOST2026` ngay sau đó thì hệ thống tự nhận diện sau chưa đầy 1 phút."
    example: |
      SET cache:coupon:GHOST2026 "__NULL__" EX 45
    lang: redis
```

## 4. Mẫu triển khai Cache-Aside + Invalidation chuẩn TypeScript

Dưới đây là mẫu chuẩn kết hợp trọn vẹn nguyên tắc **Nguyên tử hoá `SET ... EX`**, **Negative Caching ngắn hạn** và **Bất đồng bộ `UNLINK` sau khi Commit DB**:

```ts
import { createClient } from 'redis';

const SENTINEL_NULL = '__NULL__';

export async function getProductById(redis: ReturnType<typeof createClient>, db: DbPool, id: number) {
  const key = `cache:product:v2:${id}`;
  const cached = await redis.get(key);

  if (cached !== null) {
    return cached === SENTINEL_NULL ? null : JSON.parse(cached);
  }

  const row = await db.queryOne('SELECT id, name, price FROM products WHERE id = $1', [id]);
  if (!row) {
    // Negative Caching ngắn hạn 45 giây chặn truy vấn lặp vào ID không có thật
    await redis.set(key, SENTINEL_NULL, { EX: 45 });
    return null;
  }

  // Luôn gộp nguyên tử giá trị + EX trong duy nhất 1 lệnh SET
  await redis.set(key, JSON.stringify(row), { EX: 600 });
  return row;
}

export async function updateProductPrice(redis: ReturnType<typeof createClient>, db: DbPool, id: number, newPrice: number) {
  // 1. Commit xuống nguồn sự thật (PostgreSQL) trước
  await db.execute('UPDATE products SET price = $1 WHERE id = $2', [newPrice, id]);
  // 2. Xoá khoá bất đồng bộ bằng UNLINK (không khoá Event Loop như DEL)
  await redis.unlink(`cache:product:v2:${id}`);
}
```

- [+] **Khi nào dùng `Delayed Double Delete`?** Nếu hệ thống có những câu truy vấn đọc DB siêu nặng kéo dài tới `1–2 giây` dễ gây lệch trong cửa sổ hẹp, một số kiến trúc sư xoá trước khi ghi, commit DB, rồi hẹn giờ `500ms` sau bắn thêm một lệnh `UNLINK` lần hai qua hàng đợi nền.
- [!] **Cảnh báo chống Anti-pattern:** Đừng bao giờ lưu nguyên đối tượng ORM khổng lồ kèm hàng chục bảng `JOIN` vào một String JSON `5MB`! Hãy chỉ lưu đúng DTO gọn nhẹ cần thiết hoặc tách vào `Hash` để đọc từng trường bằng `HMGET`.

> [!REMEMBER] Ghi nhớ cốt lõi từ R09
> 1. **Cache-Aside + Invalidate on Write** là lựa chọn mặc định an toàn nhất: đọc trượt mới nạp (`SET key json EX ttl`), sửa DB xong thì gọi **`UNLINK key`** (không tự `SET` đè và không xoá trước khi commit DB!).
> 2. **Không bao giờ tách rời `SET` và `EXPIRE`**: Luôn dùng cờ nguyên tử `SET key val EX <giây>` (hoặc `MULTI`/`EXEC` với `HSET` + `EXPIRE`) để tránh sinh ra Zombie Key tồn tại vĩnh viễn.
> 3. **Versioned Key (`v1`, `v2`)** cứu bạn khỏi lỗi lệch cấu trúc JSON lúc Rolling Update, còn **Negative Caching (`"__NULL__"` với TTL `30–60s`)** chặn đứng các truy vấn lặp vào ID không tồn tại.
