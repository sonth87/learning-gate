## 1. Vì sao phải tối ưu truy vấn và chỉ mục trước khi mở rộng cụm Database?

```step
category: SETUP
short: Quét toàn bảng
scene: s1-seq-scan
callout:
  kind: key-idea
  title: Nhân bản một truy vấn tệ chỉ tạo ra một cụm máy đắt đỏ và vẫn chậm
  vi: "Cùng một câu tìm đơn hàng trên bảng 50 triệu dòng có thể tốn 1.800 ms nếu quét toàn bảng, hoặc chỉ 2 ms nếu có đúng chỉ mục. Tối ưu truy vấn và Index luôn là tuyến phòng thủ đầu tiên rẻ nhất."
whatChanged:
  - "+ Truy vấn tìm bản ghi trên bảng 50 triệu dòng khi chưa có chỉ mục phù hợp"
  - "~ Database buộc phải quét tuần tự ~625.000 trang đĩa (Seq Scan), đẩy ρ lên sát trần"
telemetry:
  - label: "Số dòng phải kiểm tra"
    value: "50.000.000 dòng"
    tone: bad
  - label: "Thời gian Seq Scan"
    value: "≈ 1.800 ms"
    tone: bad
  - label: "Khi có B+Tree Index"
    value: "≈ 2–4 ms"
    tone: ok
```

Ở bài `S2-08` và `S2-09`, chúng ta đã thấy việc vận hành Read Replicas (xử lý độ trễ sao chép) và Sharding (mất JOIN liên phân mảnh, phức tạp khi chia lại khoá) đắt đỏ đến mức nào. Trong thực tế, phần lớn sự cố nghẽn cơ sở dữ liệu ở quy mô vừa và lớn không đến từ giới hạn phần cứng mà đến từ **thiếu chỉ mục phù hợp** hoặc **mẫu câu truy vấn khuếch đại I/O**.

Khi bạn chạy `SELECT id, total FROM orders WHERE email = 'an@example.com'` trên bảng 50 triệu dòng (chiếm khoảng `625.000` trang đĩa 8 KB) mà cột `email` chưa có chỉ mục, cơ sở dữ liệu không biết dòng cần tìm nằm ở đâu nên phải đọc từ trang đầu tiên đến trang cuối cùng (**Full Table Scan / Seq Scan**). Ngược lại, chỉ một cấu trúc chỉ mục đúng chỗ sẽ cắt giảm lượng trang đọc đi hơn một trăm nghìn lần.

## 2. Cây B+Tree: vì sao 50 triệu dòng chỉ cần 3–4 bước nhảy?

```step
category: MECHANISM
short: Cấu trúc B+Tree
scene: s2-btree-structure
callout:
  kind: good-to-know
  title: Hệ số phân nhánh (Branching Factor) giữ cho cây cực thấp và rộng
  vi: "Khác cây nhị phân mỗi nút chỉ rẽ 2 nhánh, mỗi trang B+Tree 8 KB chứa khoảng 300–500 khoá phân tách. Nhờ vậy 500^3 = 125 triệu dòng chỉ cần chiều cao 3–4 tầng, và các tầng trên luôn nằm sẵn trong RAM."
whatChanged:
  - "+ Dựng cây cân bằng B+Tree gồm trang gốc, trang nhánh trong RAM và tầng trang lá nối kép"
  - "~ Số trang phải chạm giảm từ 625.000 xuống còn 3–4 trang (1–2 lần đọc SSD thực tế)"
telemetry:
  - label: "Độ phức tạp tra cứu"
    value: "O(log_B N)"
    tone: ok
  - label: "Chiều cao cây (50M dòng)"
    value: "3–4 tầng"
    tone: ok
```

Loại chỉ mục mặc định trong PostgreSQL, MySQL (InnoDB), Oracle và SQL Server là **B+Tree**:

- **Các nút trong (Root và Internal Pages):** Chỉ lưu các giá trị khoá phân vạch đã sắp xếp và con trỏ tới trang tầng dưới. Với kích thước trang `8 KB` (PostgreSQL) hoặc `16 KB` (InnoDB), một nút rẽ tới hàng trăm nhánh ($B \approx 400\text{--}500$). Toàn bộ tầng gốc và tầng nhánh 1–2 chỉ chiếm vài chục MB nên gần như luôn nằm thường trực trong **Buffer Pool RAM**.
- **Tầng nút lá (Leaf Pages):** Chứa toàn bộ khoá kèm vị trí dòng vật lý (hoặc chứa luôn bản ghi trong Clustered Index của InnoDB). Đặc biệt, các trang lá được nối với nhau bằng **danh sách liên kết kép** theo đúng thứ tự sắp xếp, giúp các truy vấn khoảng (`BETWEEN`, `>=`, `ORDER BY ... LIMIT 20`) chỉ cần nhảy xuống lá đầu tiên rồi trượt ngang mượt mà không cần quay lên gốc.

## 3. Đánh đổi của chỉ mục: chi phí khuếch đại ghi (Write Amplification)

```step
category: TECHNIQUE
short: Đánh đổi lúc ghi
scene: s3-write-tradeoff
activity: S4-04.A2
gate: optional
callout:
  kind: compare
  title: Mỗi chỉ mục phụ làm nhanh lúc đọc nhưng đánh thuế mọi lệnh ghi
  vi: "Nếu một bảng gắn k chỉ mục phụ, một câu INSERT đơn lẻ phải ghi 1 trang bảng gốc cộng thêm k vị trí rải rác trên k cây B+Tree, kéo theo ghi thêm nhật ký WAL và nguy cơ tách trang (Page Split)."
whatChanged:
  - "+ Minh hoạ 1 lệnh INSERT trên bảng có 4 chỉ mục phụ phải sửa 5 cấu trúc dữ liệu"
  - "+ Rà soát và gỡ bỏ các chỉ mục thừa có số lượt quét idx_scan = 0"
telemetry:
  - label: "Chi phí mỗi lệnh INSERT"
    value: "1 + k cấu trúc"
    tone: warn
  - label: "Kiểm tra chỉ mục bỏ không"
    value: "pg_stat_user_indexes"
```

Vì sao ta không tạo chỉ mục trên tất cả mọi cột của bảng? Bởi vì chỉ mục không miễn phí:

1. **Khuếch đại I/O lúc ghi ($1 + k$):** Khi chèn một dòng mới vào bảng có $k$ chỉ mục phụ, cơ sở dữ liệu phải ghi vào bảng gốc **và** tìm đúng trang lá trên từng cây trong số $k$ cây B+Tree để chèn khoá mới (thường nằm ở các trang đĩa ngẫu nhiên khác nhau). Lệnh `DELETE` phải xoá trên cả $k$ cây, còn `UPDATE` phải sửa mọi cây có chứa cột bị đổi giá trị.
2. **Chiếm dụng bộ nhớ đệm RAM và dung lượng đĩa:** Càng nhiều chỉ mục, các trang chỉ mục càng tranh chỗ trong Buffer Pool với dữ liệu thật.
3. **Chỉ mục độ chọn lọc quá thấp (Low Cardinality):** Đánh chỉ mục đơn lên cột `gender` hay `is_deleted` (nơi điều kiện lọc trả về 50–90% bảng) khiến bộ lập kế hoạch bỏ qua chỉ mục (vì nhảy đọc ngẫu nhiên đắt hơn quét tuần tự), thành ra chỉ mục đó chỉ làm chậm thao tác ghi. Nếu chỉ hay tìm đơn đang treo (chiếm 2% bảng), hãy dùng **Partial Index**: `CREATE INDEX idx_pending ON orders(created_at) WHERE status = 'PENDING'`.

## 4. Composite Index: thứ tự cột quyết định theo quy tắc tiền tố trái

```step
category: TECHNIQUE
short: Composite Index
scene: s4-composite-prefix
callout:
  kind: key-idea
  title: Giống danh bạ sắp theo Họ → Tên đệm → Tên gọi
  vi: "Chỉ mục ghép (user_id, status, created_at) tra cực nhanh theo user_id, hoặc (user_id, status), hoặc cả 3 cột; nhưng nếu câu truy vấn bỏ trống cột đầu user_id thì thứ tự của các cột sau bị xé lẻ hoàn toàn."
whatChanged:
  - "+ Tạo chỉ mục ghép nhiều cột CREATE INDEX ON orders(user_id, status, created_at)"
  - "~ Quy tắc đặt cột bằng (=) bên trái và cột khoảng (>, <) / ORDER BY bên phải"
telemetry:
  - label: "Khớp từ cột đầu tiên"
    value: "Index Scan nhanh"
    tone: ok
  - label: "Bỏ qua cột đầu tiên"
    value: "Rơi về Seq Scan"
    tone: bad
```

Khi truy vấn lọc kết hợp nhiều điều kiện như `WHERE user_id = 42 AND status = 'PAID' ORDER BY created_at DESC LIMIT 10`, hai chỉ mục đơn lẻ thường kém hiệu quả hơn nhiều so với một **Composite Index (chỉ mục ghép)** tuân theo **Quy tắc tiền tố trái (Leftmost Prefix Rule)**:

```sql
CREATE INDEX idx_orders_user_status_date
ON orders (user_id, status, created_at DESC);
```

Cây B+Tree nối ba cột thành khoá ghép sắp từ trái sang phải:

- `WHERE user_id = 42` → **Dùng tốt** (tiền tố cột 1).
- `WHERE user_id = 42 AND status = 'PAID'` → **Dùng tốt** (tiền tố cột 1 + 2), và nếu thêm `ORDER BY created_at DESC LIMIT 10` thì kết quả trên lá đã xếp sẵn không tốn bước `Sort`!
- `WHERE status = 'PAID'` (thiếu `user_id`) → **Không tra thẳng được**, vì các dòng `'PAID'` nằm rải rác dưới hàng triệu `user_id` khác nhau.
- **Lưu ý cột khoảng:** Nếu viết `WHERE user_id = 42 AND created_at > '2026-01-01' AND status = 'PAID'` trên chỉ mục `(user_id, created_at, status)`, ngay tại cột khoảng `created_at > ...` thứ tự của cột thứ ba `status` không còn liền mạch nữa. Do đó luôn xếp **cột so sánh bằng (`=`) ở bên trái, cột khoảng (`>`, `<`) ở bên phải**.

## 5. Covering Index: đọc trọn câu trả lời ngay trên lá mà không chạm bảng gốc

```step
category: TECHNIQUE
short: Covering Index
scene: s5-covering-index
callout:
  kind: technique
  title: Cắt đứt bước nhảy Heap Fetch bằng mệnh đề INCLUDE
  vi: "Khi trang lá của chỉ mục đã chứa đủ mọi cột xuất hiện trong SELECT và WHERE, Database thực hiện Index-Only Scan — không cần nhảy ngẫu nhiên sang bảng Heap để lấy nốt cột còn thiếu."
whatChanged:
  - "+ Bổ sung cột tải theo bằng INCLUDE (total) để biến chỉ mục thành Covering Index"
  - "~ Tránh viết SELECT * vì lấy toàn bộ cột sẽ phá hỏng ngay Index-Only Scan"
telemetry:
  - label: "Truy cập bảng Heap"
    value: "0 trang (Index-Only)"
    tone: ok
  - label: "Kẻ thù của Covering Index"
    value: "SELECT *"
    tone: warn
```

Với chỉ mục thông thường `(user_id, created_at DESC)`, khi chạy câu truy vấn hiển thị danh sách đơn:

```sql
SELECT user_id, created_at, total
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

Database tìm được 20 mục trên lá chỉ mục rất nhanh, nhưng vì lá **chưa có cột `total`**, nó phải cầm 20 địa chỉ vật lý (`ctid`) nhảy đọc ngẫu nhiên tới 20 trang khác nhau của bảng gốc (**Heap Fetch**).

Bằng cách đính kèm cột cần lấy vào phần tải của lá (**Covering Index**):

```sql
CREATE INDEX idx_orders_user_covering
ON orders (user_id, created_at DESC) INCLUDE (total);
```

Giờ đây toàn bộ dữ liệu câu truy vấn cần đều nằm gọn trên một vài trang lá liên tiếp (**Index-Only Scan**). Đây cũng là lý do kỹ thuật cốt lõi vì sao không nên viết thói quen `SELECT *`: lấy dư 30 cột không dùng tới sẽ ép Database quay về đọc bảng Heap và ngốn băng thông mạng.

## 6. Đọc EXPLAIN ANALYZE và các cách viết SQL tự vô hiệu hoá chỉ mục

```step
category: PITFALL
short: Đọc EXPLAIN
scene: s6-explain-anti-patterns
callout:
  kind: watch-out
  title: Đã tạo Index không có nghĩa là câu truy vấn thực sự dùng được Index
  vi: "Bọc hàm lên cột được đánh chỉ mục hoặc đặt dấu % ở đầu mẫu LIKE làm bộ tối ưu không thể so khớp trên cây B+Tree. Luôn xác nhận bằng EXPLAIN ANALYZE thay vì đoán."
whatChanged:
  - "+ Kiểm tra kế hoạch thực thi thực tế bằng EXPLAIN (ANALYZE, BUFFERS)"
  - "~ Viết lại điều kiện bọc hàm và biểu thức không tận dụng được thứ tự chỉ mục"
telemetry:
  - label: "Dấu hiệu thiếu Index"
    value: "Seq Scan + thời gian cao"
    tone: bad
  - label: "Dấu hiệu Index chưa sát"
    value: "Rows Removed by Filter lớn"
    tone: warn
```

Trước khi đưa câu truy vấn mới lên môi trường thật, chạy `EXPLAIN (ANALYZE, BUFFERS)` cho bạn biết chính xác số trang đọc trong RAM (`shared hit`), số trang đọc đĩa (`read`) và ba mẫu viết SQL hay làm hỏng chỉ mục nhất:

| Cách viết làm mù Index | Vì sao Index bị bỏ qua? | Cách viết lại chuẩn (Sargable) |
|---|---|---|
| `WHERE EXTRACT(YEAR FROM created_at) = 2026` | Cây lưu mốc thời gian gốc chứ không lưu kết quả hàm `YEAR(...)` | `WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'` |
| `WHERE LOWER(email) = 'an@x.com'` | Chỉ mục thường lưu chữ hoa/thường gốc | Tạo **Expression Index** `ON users (LOWER(email))` |
| `WHERE name LIKE '%nguyen%'` | Ký tự `%` đứng đầu không có tiền tố cố định để rẽ nhánh B+Tree | Dùng chỉ mục Trigram (`pg_trgm`) hoặc chuyển sang Search Engine (`S2-07`) |

Ngoài ra, nếu thấy `Index Scan` nhưng dòng `Rows Removed by Filter: 85000` rất cao, nghĩa là chỉ mục mới lọc được điều kiện đầu còn điều kiện phụ phải loại thủ công từng dòng — dấu hiệu nên ghép thêm cột đó vào Composite Index.

## 7. Lỗi N+1 của ORM: khi 220 req/s biến thành 5.500 câu SQL mỗi giây

```step
category: PROBLEM
short: Khuếch đại N+1
scene: s7-n-plus-1-live
live: n-plus-1
activity: S4-04.A1
gate: optional
callout:
  kind: watch-out
  title: Từng câu truy vấn đều có Index và chạy 3,5 ms nhưng cả trang vẫn sập
  vi: "Lỗi N+1 cực kỳ khó phát hiện trong log truy vấn chậm (Slow Query Log) vì không có câu SQL đơn lẻ nào quá 5 ms; thủ phạm nằm ở việc ứng dụng bắn 25 câu tuần tự cho mỗi lượt tải trang."
whatChanged:
  - "~ Tải người dùng tăng nhẹ từ 30 lên 220 req/s trên nhánh Order API (N+1)"
  - "~ Hệ số calls = 25 đẩy tải vào Orders DB lên 5.500 SQL/s (ρ = 2,50), p99 vọt quá 1.800 ms"
telemetry:
  - label: "Tải người dùng (t = 45 s)"
    value: "220 req/s"
    tone: ok
  - label: "Truy vấn dội vào DB"
    value: "5.500 SQL/s (×25)"
    tone: bad
  - label: "Độ trễ p99 (t = 45 s)"
    value: "≈ 1.830 ms"
    tone: bad
```

Ngay cả khi mọi bảng đều đã gắn B+Tree Index chuẩn (`3,5 ms` mỗi câu), hệ thống vẫn dễ dàng sụp đổ vì **lỗi truy vấn lặp N+1** do cơ chế tải lười (*lazy loading*) của ORM:

```python
# Bẫy N+1: 1 câu lấy 24 đơn + 24 câu lẻ trong vòng lặp = 25 vòng khứ hồi SQL!
orders = db.query("SELECT id, created_at FROM orders WHERE user_id = %s LIMIT 24", uid)
for o in orders:
    o.items = db.query("SELECT sku, qty, price FROM order_items WHERE order_id = %s", o.id)
```

Quan sát mô phỏng trực tiếp trên sân khấu:

- Ở mức tải chỉ `101 req/s` (giây 15), `Order API (N+1)` nhân hệ số `×25` đẩy `2.531 SQL/giây` xuống `Orders DB` (vượt trần `2.200 ops/s`), làm DB lập tức chuyển đỏ (`overloaded`).
- Tới giây 45 khi tải người dùng mới đạt `220 req/s` (CPU tầng API rảnh tới 93%), `Orders DB` bị dội `5.500 SQL/giây` (`ρ = 2,50`), hàng đợi chất cứng và độ trễ nối tiếp 25 vòng làm `p99` vượt `1.830 ms`!

## 8. Gom lô Batch WHERE IN, Query Cache và phi chuẩn hoá có kiểm soát

```step
category: TECHNIQUE
short: Sửa N+1 & Gom lô
scene: s8-batch-denorm
activity: S4-04.A3
gate: required
callout:
  kind: technique
  title: Đưa số câu SQL về hằng số O(1) không phụ thuộc số phần tử
  vi: "Gom toàn bộ ID vào một câu SELECT ... WHERE order_id IN (...) giúp dù trang hiển thị 24 hay 100 đơn thì cũng chỉ tốn đúng 2 câu truy vấn."
whatChanged:
  - "+ Chuyển từ vòng lặp 25 câu sang nhánh Batch IN (2 câu SQL) kết hợp Query Cache"
  - "~ Tại 220 req/s, truy vấn vào DB giảm từ 5.500 còn ~35 SQL/s, p99 hạ xuống ~47 ms"
telemetry:
  - label: "Số query mỗi request"
    value: "25 xuống còn 2"
    tone: ok
  - label: "ρ của Orders DB"
    value: "2,50 xuống 0,02"
    tone: ok
  - label: "p99 sau khi gom lô"
    value: "≈ 47 ms"
    tone: ok
```

Có ba kỹ thuật phối hợp để giải phóng cơ sở dữ liệu khỏi các vòng lặp và phép tính gom nhóm lặp đi lặp lại:

1. **Batch Loading (`WHERE ... IN` / Eager Loading):** Thu thập mảng `order_ids = [o.id for o in orders]` rồi lấy toàn bộ chi tiết trong **một câu thứ hai duy nhất** (`SELECT * FROM order_items WHERE order_id = ANY(%s)` trên chỉ mục `order_id`), sau đó ghép theo từ điển trong bộ nhớ ứng dụng. Số vòng mạng xuống DB giảm từ $N + 1$ về đúng **2 câu cố định**.
2. **Query / Entity Cache:** Khi kết quả của trang đơn hàng đã gom gọn, đặt một lớp Cache phía trước (dung lượng khớp tập khoá nóng) chặn thêm 85% lượt đọc lặp lại.
3. **Phi chuẩn hoá có chủ đích (Denormalization & Materialized Views):** Nếu mỗi lần xem danh sách đơn đều phải chạy `SUM(price * qty)` hoặc `COUNT(*)` trên hàng triệu dòng con, hãy lưu sẵn cột `total_amount` ngay trên bảng `orders` lúc tạo đơn (hoặc dùng `MATERIALIZED VIEW` làm mới định kỳ cho bảng thống kê), chấp nhận tốn thêm một chút công cập nhật lúc ghi để đổi lấy tốc độ đọc tức thì.

## 9. Tổng kết: trình tự tối ưu cơ sở dữ liệu từ rẻ đến đắt

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Đừng vội nâng cấp máy hay Sharding khi chưa kiểm tra EXPLAIN và số query/request
  vi: "Thứ tự chuẩn: (1) Xoá N+1 + đánh B+Tree / Composite / Covering Index → (2) Thêm Cache + Read Replicas cho tải đọc → (3) Partitioning / Sharding chỉ khi tải ghi vượt trần một máy."
whatChanged:
  - "+ Tổng hợp lộ trình 4 bước tối ưu và mở rộng tầng cơ sở dữ liệu"
telemetry:
  - label: "Hiệu quả gom lô + Index"
    value: "Giảm > 95% tải DB"
    tone: ok
  - label: "Chi phí hạ tầng tăng thêm"
    value: "≈ 0 USD (sửa truy vấn)"
    tone: ok
```

Trước khi đề xuất nâng gấp đôi cấu hình máy chủ hay chẻ nhỏ cơ sở dữ liệu, hãy luôn đi qua danh sách kiểm tra sau:

1. **Đếm số câu SQL trên một HTTP request:** Bật bộ đếm truy vấn ở môi trường phát triển để bắt sạch mọi vòng lặp **N+1** và đổi sang `JOIN` hoặc `WHERE id IN (...)`.
2. **Chạy `EXPLAIN (ANALYZE, BUFFERS)` cho các truy vấn nóng:** Gắn **B+Tree / Composite Index** (cột `=` bên trái, cột khoảng/`ORDER BY` bên phải), dùng `INCLUDE` làm **Covering Index** và bỏ thói quen `SELECT *`.
3. **Kiểm soát khuếch đại ghi ($1 + k$):** Xoá các chỉ mục thừa có `idx_scan = 0` để giữ tốc độ `INSERT`/`UPDATE`.
4. **Theo đúng thang mở rộng:** Tối ưu truy vấn & Index → Đặt Cache (`S2-02`) → Thêm Read Replicas (`S2-08`) → Bảng lớn thì Partitioning cục bộ → Chỉ Sharding (`S2-09`) ở chặng cuối cùng khi thông lượng ghi vượt sức một máy đơn.
