## 1. Cơ sở dữ liệu quan hệ (SQL): chuẩn hoá bảng và giao dịch ACID

```step
category: SETUP
short: Mô hình SQL
scene: s1-sql-tables
callout:
  kind: key-idea
  title: Điểm mạnh cốt lõi của SQL
  vi: "SQL tách dữ liệu thành các bảng chuẩn hoá nối bằng khoá ngoại và bảo vệ thao tác nhiều bước bằng giao dịch ACID."
whatChanged:
  - "+ Biểu diễn đơn hàng #901 qua 3 bảng orders, order_items và payments"
  - "+ Khối giao dịch ACID đảm bảo trừ kho và thu tiền thành công cùng nhau"
telemetry:
  - label: "Mô hình"
    value: "Bảng & Khoá ngoại"
  - label: "Đảm bảo ghi"
    value: "ACID đa bảng"
    tone: ok
```

**Cơ sở dữ liệu quan hệ (Relational Database / SQL)** như PostgreSQL hay MySQL lưu trữ dữ liệu thành các bảng có lược đồ (Schema) xác định trước. Mỗi thực thể được chuẩn hoá thành dòng riêng và liên kết qua khoá ngoại (`FOREIGN KEY`), tránh lưu lặp thông tin khách hàng ở từng đơn hàng.

Khi người dùng thanh toán, hệ thống cần trừ tồn kho, tạo dòng ở `orders` và ghi bút toán vào `payments`. Khối giao dịch **ACID** (`Atomicity`, `Consistency`, `Isolation`, `Durability`) đảm bảo cả ba bước thành công trọn vẹn hoặc hoàn tác toàn bộ nếu một bước gặp lỗi, không bao giờ để xảy ra trạng thái thu tiền nhưng mất đơn.

SQL đặc biệt phù hợp khi quan hệ giữa các thực thể chặt chẽ, dữ liệu tài chính đòi hỏi toàn vẹn cao và ứng dụng cần truy vấn tổng hợp linh hoạt qua phép nối `JOIN`.

## 2. Giới hạn của bảng cứng khi danh mục hàng hoá đa dạng

```step
category: PROBLEM
short: Bảng thưa cột
scene: s2-sparse-schema
callout:
  kind: watch-out
  title: Chi phí của lược đồ cứng
  vi: "Ép hàng nghìn loại sản phẩm khác cấu trúc vào chung một bảng sinh ra hàng trăm cột NULL, còn tách nhỏ kiểu EAV lại kéo theo nhiều phép JOIN tốn kém."
whatChanged:
  - "~ Bảng sản phẩm dùng chung phát sinh nhiều cột NULL cho từng ngành hàng"
  - "~ Thêm thuộc tính mới trên bảng hàng trăm triệu dòng phải chạy ALTER TABLE"
telemetry:
  - label: "Thuộc tính trống"
    value: "Nhiều cột NULL"
    tone: warn
  - label: "Đọc chi tiết"
    value: "Tốn nhiều JOIN"
    tone: bad
```

Khi sàn thương mại điện tử mở rộng từ quần áo sang đồ điện tử và sách, mỗi ngành hàng lại có tập thuộc tính riêng: áo có kích cỡ và chất liệu, laptop có CPU và dung lượng RAM, sách có mã ISBN và số trang.

Nếu gom tất cả vào một bảng rộng, mỗi dòng có hàng chục cột `NULL` không dùng tới và việc thay đổi cấu trúc trên bảng lớn trở nên nặng nề. Ngược lại, nếu tách theo mô hình thực thể - thuộc tính - giá trị (EAV) thành nhiều bảng phụ, chỉ riêng thao tác hiển thị một trang sản phẩm cũng phải thực hiện nhiều phép `JOIN` qua hàng triệu bản ghi.

Khi mẫu truy cập chủ đạo là đọc và ghi trọn vẹn một hồ sơ độc lập theo định danh, chi phí ghép bảng của SQL trở thành gánh nặng không cần thiết.

## 3. Document Store: gom dữ liệu lồng nhau theo đơn vị đọc

```step
category: TECHNIQUE
short: Document Store
scene: s3-doc-model
callout:
  kind: technique
  title: Thiết kế theo mẫu đọc
  vi: "Những dữ liệu thường xuyên được đọc cùng nhau trên một màn hình được gom chung vào một tài liệu JSON/BSON tự mô tả."
whatChanged:
  - "+ Gom thông tin cơ bản, thông số kỹ thuật và danh sách biến thể vào một tài liệu"
  - "~ Trang chi tiết sản phẩm chỉ cần 1 lần đọc theo _id, không cần JOIN"
telemetry:
  - label: "Đơn vị lưu"
    value: "JSON / BSON"
  - label: "Số lần đọc trang"
    value: "1 truy vấn _id"
    tone: ok
```

**Document Store** (như MongoDB, Firestore) lưu mỗi bản ghi dưới dạng một tài liệu có cấu trúc cây gồm đối tượng lồng nhau và mảng con. Lược đồ linh hoạt cho phép tài liệu giày chạy bộ chứa trường `drop: 8mm` trong khi tài liệu laptop chứa `ram: 16GB` ngay trong cùng một tập hợp (Collection).

Vì toàn bộ thuộc tính và danh sách biến thể của sản phẩm nằm cạnh nhau trên đĩa theo khoá `_id`, ứng dụng tải xong trang chi tiết trong đúng một lượt đọc mà không cần nối bảng. Việc phân mảnh ngang (Sharding) theo `product_id` cũng thuận lợi vì mỗi tài liệu là một đơn vị khép kín.

Bạn có thể hình dung Document Store giống như kẹp toàn bộ giấy tờ của một hồ sơ bệnh án vào chung một bìa cứng thay vì cất từng tờ ở một tủ riêng.

## 4. Key-Value Store: bảng băm phẳng đạt độ trễ dưới mili-giây

```step
category: TECHNIQUE
short: Key-Value O(1)
scene: s4-kv-model
callout:
  kind: good-to-know
  vi: "Key-Value Store đạt tốc độ rất cao nhờ từ bỏ hoàn toàn cấu trúc quan hệ và truy vấn phụ bên trong giá trị."
whatChanged:
  - "+ Ánh xạ trực tiếp khoá chuỗi (sess:u42) sang khối dữ liệu nhị phân hoặc chuỗi"
  - "+ Hỗ trợ tự động xoá dữ liệu tạm thời bằng TTL"
telemetry:
  - label: "Độ phức tạp"
    value: "O(1) theo khoá"
    tone: ok
  - label: "Độ trễ điển hình"
    value: "< 1 ms (RAM)"
    tone: ok
```

**Key-Value Store** (như Redis, Memcached cho dữ liệu trong RAM, hoặc DynamoDB ở chế độ khoá đơn) tối giản mô hình lưu trữ thành một bảng băm phân tán khổng lồ: một khoá duy nhất trỏ thẳng tới một khối giá trị (`key -> value`).

Hệ quản trị không cần phân tích cấu trúc bên trong giá trị mà đi thẳng tới ô nhớ bằng hàm băm với độ phức tạp `O(1)`. Kết hợp với cơ chế tự hết hạn `TTL`, đây là lựa chọn tự nhiên cho phiên đăng nhập (`sess:u42`), bộ đếm giới hạn tốc độ (Rate Limiting), mã OTP và giỏ hàng tạm thời.

Cái giá phải trả là bạn chỉ hỏi được theo đúng khoá: nếu muốn tìm mọi phiên thuộc người dùng ở Hà Nội mà không lập chỉ mục phụ bên ngoài, hệ thống buộc phải quét toàn bộ không gian khoá.

## 5. Những gì phải đánh đổi khi rời bỏ mô hình quan hệ

```step
category: PITFALL
short: Đánh đổi NoSQL
scene: s5-nosql-tradeoffs
callout:
  kind: compare
  title: Không có kho lưu trữ vạn năng
  vi: "Bỏ JOIN giúp đọc một thực thể nhanh hơn, nhưng đẩy trách nhiệm giữ đồng bộ dữ liệu trùng lặp lên tầng mã nguồn ứng dụng."
whatChanged:
  - "~ Đặt song song Document Catalog và SQL Orders để thấy ranh giới đánh đổi"
telemetry:
  - label: "Cập nhật chéo"
    value: "Tầng App tự xử lý"
    tone: warn
  - label: "Sổ cái tiền tệ"
    value: "Giữ trên SQL"
    tone: ok
```

Chuyển sang Document hay Key-Value không làm biến mất độ phức tạp mà dịch chuyển nó sang chỗ khác. Có ba đánh đổi kỹ thuật cần cân nhắc kỹ trước khi chọn NoSQL:

| Khía cạnh | SQL chuẩn hoá | Document / Key-Value |
|---|---|---|
| Đọc thực thể lồng nhau | Tốn `JOIN` qua nhiều bảng | Nhanh, đọc trọn một khối |
| Cập nhật thông tin dùng chung | Sửa 1 dòng gốc duy nhất | Phải cập nhật lặp ở nhiều bản ghi (Denormalization) |
| Ràng buộc & Giao dịch rộng | DB cưỡng chế khoá ngoại và ACID | Hạn chế xuyên phân mảnh; ứng dụng tự kiểm tra |

Sai lầm phổ biến là đặt sổ cái số dư ví hoặc tồn kho vào kho không hỗ trợ giao dịch chặt, dẫn tới hai request đồng thời đọc cùng số dư cũ và trừ tiền sai lệch khi tải tăng cao.

## 6. Kiến trúc đa lưu trữ (Polyglot Persistence): mỗi kho làm đúng việc giỏi nhất

```step
category: MECHANISM
short: Đa lưu trữ
scene: s6-polyglot
activity: S2-07.A1
gate: required
callout:
  kind: key-idea
  title: Chọn theo mẫu truy cập
  vi: "Hệ thống lớn hiếm khi chỉ dùng một cơ sở dữ liệu; mỗi miền dữ liệu chọn loại lưu trữ khớp với mẫu đọc, ghi và mức nhất quán của riêng nó."
whatChanged:
  - "+ Commerce API kết nối đồng thời Key-Value, Document Store và SQL"
  - "~ Tách tải phiên, tải đọc catalog và tải ghi đơn hàng ra ba đường độc lập"
telemetry:
  - label: "Phiên đăng nhập"
    value: "Key-Value (< 1 ms)"
    tone: ok
  - label: "Catalog sản phẩm"
    value: "Document Store"
    tone: ok
  - label: "Đơn & Thanh toán"
    value: "SQL (ACID)"
    tone: ok
```

Trong thực tế, câu hỏi thiết kế không phải là chọn SQL hay NoSQL cho toàn bộ công ty, mà là **Polyglot Persistence** — phối hợp nhiều loại cơ sở dữ liệu trong cùng hệ thống theo từng mẫu truy cập cụ thể:

- **Key-Value Store** gánh hàng nghìn lượt kiểm tra phiên và giỏ hàng tạm mỗi giây với độ trễ dưới 1 ms.
- **Document Store** lưu hàng triệu sản phẩm có cấu trúc thuộc tính khác nhau, mở rộng ngang theo phân mảnh để chịu tải duyệt trang cao.
- **SQL Database** tập trung nguồn lực cho đơn hàng, thanh toán và đối soát tồn kho — lưu lượng thấp hơn lượt xem trang nhưng bắt buộc chuẩn ACID.

Hãy hoàn thành bài tập bên dưới để định cỡ từng kho lưu trữ sao cho chịu được cả giờ cao điểm xem hàng lẫn đợt thanh toán dồn dập trong ngân sách cho phép.

## 7. Tìm kiếm toàn văn và đồng bộ qua Change Stream

```step
category: TECHNIQUE
short: Search & CDC
scene: s7-search-sync
callout:
  kind: technique
  title: Nguồn sự thật và bản chiếu tìm kiếm
  vi: "SQL hoặc Document Store giữ bản gốc chính xác; Search Engine chỉ giữ bản chiếu tối ưu cho tìm kiếm, đồng bộ bất đồng bộ qua Change Stream."
whatChanged:
  - "+ Bổ sung Search Engine dùng chỉ mục đảo cho truy vấn từ khoá và lọc nhiều chiều"
  - "+ Đồng bộ thay đổi sản phẩm từ kho gốc sang Search qua luồng sự kiện CDC"
telemetry:
  - label: "Cấu trúc chỉ mục"
    value: "Inverted Index"
    tone: ok
  - label: "Độ trễ đồng bộ"
    value: "Vài trăm ms (CDC)"
```

Ngay cả khi đã có SQL, Document và Key-Value, truy vấn tìm kiếm kiểu `giày chạy bộ nam màu đỏ dưới 1,5 triệu` kèm sửa lỗi chính tả vẫn làm chậm cả SQL (`LIKE '%...%'` quét bảng) lẫn Document Store.

Giải pháp chuẩn là tách riêng một **Search Engine** (như Elasticsearch, OpenSearch) xây dựng **chỉ mục đảo (Inverted Index)**: ánh xạ từng từ đã tách sang danh sách mã tài liệu chứa từ đó. Để tránh lỗi ghi kép (ghi xong vào DB nhưng lỗi mạng khi gọi Search), ứng dụng chỉ ghi vào kho dữ liệu gốc; một đường ống **Change Data Capture (CDC) / Change Stream** đọc nhật ký thay đổi của DB và cập nhật sang Search ở nền sau vài trăm mili-giây.

## 8. Tóm tắt: khung quyết định chọn loại cơ sở dữ liệu

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Quy tắc chọn nhanh
  vi: "Bắt đầu từ mẫu truy cập và yêu cầu nhất quán. Khi chưa có lý do rõ ràng để tách, một cơ sở dữ liệu quan hệ hiện đại luôn là điểm xuất phát an toàn."
whatChanged:
  - "+ Tổng hợp ma trận ánh xạ bài toán sang 4 loại kho lưu trữ"
telemetry:
  - label: "Điểm xuất phát"
    value: "SQL (PostgreSQL)"
    tone: ok
  - label: "Mở rộng chuyên biệt"
    value: "KV · Doc · Search"
```

Mỗi mô hình lưu trữ tối ưu một nhóm thao tác và nhường lại phần còn lại:

| Loại lưu trữ | Tối ưu cho | Hạn chế chính |
|---|---|---|
| **SQL (Quan hệ)** | Giao dịch ACID, quan hệ nhiều bảng, báo cáo chuẩn xác | Khó phân mảnh ngang tự động, lược đồ cứng |
| **Document Store** | Thực thể lồng nhau đa hình, đọc trọn theo ID, dễ shard | Thiếu `JOIN` mạnh, dễ trùng lặp dữ liệu |
| **Key-Value Store** | Tra cứu `O(1)` cực nhanh theo khoá đơn, dữ liệu có `TTL` | Không lọc được theo thuộc tính bên trong value |
| **Search Engine** | Tìm kiếm toàn văn, xếp hạng độ khớp, lọc đa tiêu chí | Không dùng làm nguồn dữ liệu gốc (Source of Truth) |

Nguyên tắc thực tế: khởi đầu gọn với SQL (như PostgreSQL hỗ trợ cả cột `JSONB`), sau đó chỉ tách sang Key-Value, Document hoặc Search khi số đo cho thấy một mẫu truy cập chuyên biệt đã chạm ngưỡng.
