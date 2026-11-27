## 1. Bên dưới một lệnh ghi: nghịch lý giữa RAM cực nhanh và ổ đĩa bền vững

```step
category: SETUP
short: RAM và Ổ đĩa
scene: s1-ram-vs-disk
callout:
  kind: key-idea
  title: Ghi tuần tự luôn nhanh hơn ghi ngẫu nhiên hàng chục lần
  vi: "Bộ nhớ RAM nhanh (~100 ns) nhưng bay hơi khi mất điện; ổ đĩa giữ bền dữ liệu nhưng ghi ngẫu nhiên từng trang 8 KB vừa chậm vừa có nguy cơ rách trang (Torn Page) nếu cúp điện giữa chừng."
whatChanged:
  - "+ Đặt vấn đề: làm sao trả lời COMMIT vừa bền vững vừa không bị nghẽn I/O đĩa?"
telemetry:
  - label: "Truy cập RAM"
    value: "≈ 100 ns (bay hơi)"
  - label: "Đọc/ghi SSD"
    value: "≈ 50–150 µs (bền)"
    tone: ok
```

Khi ứng dụng gọi `INSERT` hoặc `UPDATE` và nhận về phản hồi `COMMIT OK`, **Storage Engine** (như InnoDB trong MySQL, trình quản lý trang của PostgreSQL hay RocksDB) phải giải bài toán hai vế đối nghịch nhau:

1. Nếu chỉ sửa dữ liệu trong RAM rồi báo thành công ngay: tốc độ cực nhanh, nhưng chỉ cần rút dây nguồn là dữ liệu đã hứa `COMMIT` biến mất sạch (vi phạm chữ **D — Durability**).
2. Nếu bắt buộc tìm đúng trang dữ liệu `8 KB` của bảng và tất cả các trang chỉ mục B+Tree liên quan để ghi đè ngẫu nhiên xuống đĩa ngay lập tức: thông lượng sụp xuống rất thấp, chưa kể nếu mất điện lúc mới ghi được `4 KB` trên trang `8 KB` thì trang gốc bị hỏng dở dang (**Torn Page**).

Lời giải nền tảng xuất hiện trong hầu hết mọi cơ sở dữ liệu hiện đại là tách **đường đảm bảo độ bền** khỏi **đường sắp xếp cấu trúc trang**.

## 2. Write-Ahead Log (WAL), Group Commit và Checkpoint

```step
category: MECHANISM
short: Nhật ký WAL
scene: s2-wal-group-commit
callout:
  kind: technique
  title: Ghi nhật ký trước khi đụng vào trang dữ liệu
  vi: "Mọi thay đổi được ghi nối đuôi tuần tự vào cuối tệp WAL và gọi fsync() trước. Các trang dữ liệu đã sửa trong RAM (Dirty Pages) được gom lại để xả xuống đĩa thong thả ở nền."
whatChanged:
  - "+ Thêm tệp nhật ký chỉ nối đuôi (WAL) gắn số thứ tự LSN tăng dần"
  - "+ Gộp nhiều giao dịch vào 1 lần fsync (Group Commit) và cắt ngắn bằng Checkpoint"
telemetry:
  - label: "Kiểu I/O của WAL"
    value: "Tuần tự 100%"
    tone: ok
  - label: "Gộp nhiều TX 1 lần fsync"
    value: "Group Commit"
    tone: ok
```

**Write-Ahead Logging (WAL)** vận hành theo ba cơ chế gắn kết chặt chẽ:

1. **Ghi nhật ký nối đuôi trước:** Giao dịch sửa trang dữ liệu trong vùng đệm RAM (**Dirty Page**) đồng thời ghi một bản ghi nhỏ mang số thứ tự `LSN` vào cuối tệp WAL. Vì đầu ghi chỉ tiến thẳng ở cuối tệp, băng thông ghi tuần tự đạt mức tối đa của phần cứng.
2. **Group Commit:** Thay vì gọi lệnh hệ điều hành `fsync()` tốn kém cho từng giao dịch lẻ, khi có 20 giao dịch hoàn tất trong cùng 1–2 mili-giây, Engine gom cả 20 bản ghi WAL vào **một lần `fsync()` duy nhất**, nhân thông lượng `COMMIT` lên hàng chục lần mà vẫn giữ trọn độ bền.
3. **Checkpoint và Khôi phục (Crash Recovery):** Nếu tệp WAL dài vô tận, lúc khởi động lại sau mất điện sẽ mất hàng giờ phát lại từ đầu. Do đó định kỳ tiến trình nền xả các Dirty Pages cũ xuống đĩa và đóng dấu **Checkpoint**: khi gặp sự cố, Engine chỉ cần đọc và phát lại (**Redo**) đoạn WAL ngắn từ sau mốc Checkpoint gần nhất.

## 3. B-Tree Engine cập nhật tại chỗ: đọc nhanh nhưng chịu thuế khi ghi rải rác

```step
category: MECHANISM
short: B-Tree tại chỗ
scene: s3-btree-inplace
callout:
  kind: good-to-know
  title: Khuếch đại ghi cấp độ trang đĩa
  vi: "Trong B-Tree, mỗi khoá có một ngôi nhà cố định trên đĩa. Chỉ đổi 50 byte của một dòng cũng làm bẩn nguyên trang 8–16 KB và tốn thêm chi phí tách đôi trang (Page Split) khi trang đầy."
whatChanged:
  - "+ Minh hoạ Buffer Pool xả hàng loạt trang 8 KB ngẫu nhiên trong B-Tree Engine"
telemetry:
  - label: "Đơn vị đọc/ghi đĩa"
    value: "Trang 8–16 KB"
    tone: warn
  - label: "Thế mạnh số một"
    value: "Đọc điểm & khoảng"
    tone: ok
```

Các hệ quản trị quan hệ truyền thống (PostgreSQL, MySQL InnoDB, Oracle) xây dựng Storage Engine xoay quanh **B+Tree cập nhật tại chỗ (Update-in-Place)**:

- **Ưu điểm lớn lúc đọc:** Mỗi khoá chỉ tồn tại ở **đúng một trang lá duy nhất** trên cây. Truy vấn theo khoá hoặc quét khoảng chỉ cần đi từ gốc xuống lá trong 3–4 bước là có ngay bản ghi chuẩn, không phải dò qua nhiều tệp chồng chéo.
- **Điểm nghẽn khi tải ghi ngẫu nhiên khổng lồ:** Dù lúc `COMMIT` đã có WAL che chắn, sớm muộn tiến trình Checkpoint cũng phải xả các trang bẩn trong Buffer Pool ra đúng vị trí vật lý trên đĩa. Khi hàng chục nghìn thiết bị cùng chèn khoá rải rác (ví dụ UUID ngẫu nhiên hoặc luồng sự kiện đa nguồn), hầu như mọi trang 8 KB đều bị bẩn, gây bão ghi ngẫu nhiên, tách trang (**Page Split**) và phải ghi bảo vệ chống rách trang (*Doublewrite Buffer* / *Full-Page Writes*).

## 4. LSM-Tree Engine: MemTable, SSTable bất biến và Compaction chạy nền

```step
category: TECHNIQUE
short: Cây LSM-Tree
scene: s4-lsm-memtable-sstable
callout:
  kind: key-idea
  title: Không bao giờ sửa đè một tệp đã viết xong trên ổ đĩa
  vi: "LSM-Tree gom thay đổi trong cây cân bằng trên RAM (MemTable), đầy thì xả một mạch thành tệp đã sắp xếp (SSTable), rồi dùng tiến trình Compaction gộp tệp giống thuật toán Merge Sort."
whatChanged:
  - "+ Chuyển từ ghi đè trang tại chỗ sang ghi MemTable + xả tuần tự SSTable bất biến"
  - "+ Xoá bản ghi bằng cách ghi thêm thẻ đánh dấu xoá (Tombstone) thay vì tìm sửa tệp cũ"
telemetry:
  - label: "Ghi xuống ổ đĩa"
    value: "Tuần tự (Flush + Merge)"
    tone: ok
  - label: "Cơ chế lệnh DELETE"
    value: "Ghi thẻ Tombstone"
```

Để phá vỡ trần IOPS ghi ngẫu nhiên, **LSM-Tree (Log-Structured Merge-Tree)** — trái tim của RocksDB, LevelDB, Apache Cassandra và ScyllaDB — loại bỏ hoàn toàn thao tác ghi đè tại chỗ:

1. **Đường ghi cực gọn:** Bản ghi mới nối đuôi vào `WAL` (để chống mất điện) và chèn vào cấu trúc cây có thứ tự trên RAM gọi là **MemTable** (thường là *SkipList* hoặc *Red-Black Tree*). Xong hai bước trong bộ nhớ/tuần tự này là trả kết quả ngay!
2. **Xả thành SSTable (Sorted String Table):** Khi `MemTable` đạt ngưỡng (ví dụ `64 MB`), nó đóng băng và được xả một mạch tuần tự thành tệp **SSTable tầng L0** trên đĩa, trong đó các khoá đã xếp tăng dần và tệp là **bất biến (immutable)**. Ngay cả lệnh `DELETE` cũng không chạm tệp cũ mà chỉ ghi một bản ghi đặc biệt gọi là **Tombstone (bia mộ)**.
3. **Compaction chạy nền:** Theo thời gian sẽ sinh ra nhiều tệp SSTable. Tiến trình nền đọc tuần tự nhiều tệp SSTable, chạy thuật toán *Merge Sort* giữ lại phiên bản mới nhất của mỗi khoá, vứt bỏ các bản ghi cũ đã bị đè cùng các Tombstone hết hạn, rồi ghi ra các tệp gọn gàng ở tầng `L1`, `L2` (nơi các khoảng khoá không còn chồng lấn nhau).

## 5. Tối ưu đường đọc của LSM-Tree bằng Bloom Filter và chỉ mục thưa

```step
category: TECHNIQUE
short: Bloom Filter
scene: s5-lsm-read-bloom
callout:
  kind: technique
  title: Vài bit trong RAM giúp né hàng loạt lần mở tệp trên đĩa
  vi: "Vì một khoá trên LSM-Tree có thể nằm ở MemTable hoặc rải qua L0, L1, L2, mỗi SSTable gắn kèm một Bloom Filter để biết chắc chắn tệp nào KHÔNG chứa khoá cần tìm mà không cần chạm đĩa."
whatChanged:
  - "+ Gắn bộ lọc xác suất Bloom Filter và Sparse Index trên RAM cho từng tệp SSTable"
telemetry:
  - label: "Âm tính giả (bỏ sót nhầm)"
    value: "0% (tuyệt đối không có)"
    tone: ok
  - label: "Chi phí bộ nhớ điển hình"
    value: "≈ 10 bit / khoá (~1% FP)"
    tone: ok
```

Cái giá tự nhiên của LSM-Tree nằm ở **đường đọc**: khi tìm một khoá `user:9981` (đặc biệt khi khoá đó chưa từng tồn tại!), hệ thống phải kiểm tra `MemTable`, rồi lần lượt các tệp `L0`, `L1`, `L2` từ mới đến cũ.

Hai cấu trúc gọn nhẹ trong RAM giải cứu đường đọc của LSM-Tree:

- **Bloom Filter riêng cho mỗi SSTable:** Một mảng bit kết hợp $k$ hàm băm. Khi hỏi khoá $x$: nếu có bất kỳ bit nào bằng `0`, khoá **chắc chắn 100% không nằm trong tệp SSTable đó** → bỏ qua tệp ngay không tốn một lần đọc đĩa nào! Nếu mọi bit đều bằng `1`, khoá *có thể* có mặt (xác suất dương tính giả chỉ khoảng `1%` khi cấp ~10 bit/khoá).
- **Sparse Index (Chỉ mục thưa):** Vì bên trong SSTable các khoá đã sắp xếp sẵn, RAM không cần nhớ vị trí mọi dòng mà chỉ cần nhớ khoá đầu tiên của mỗi khối `4–16 KB`, sau đó nhảy thẳng tới đúng khối trên đĩa.

## 6. Đối chiếu trực tiếp dưới tải 85.000 ghi/giây và đỉnh trễ Compaction

```step
category: PROBLEM
short: Đua tải ghi lớn
scene: s6-write-heavy-live
live: write-heavy
activity: S4-08.A1
gate: optional
callout:
  kind: watch-out
  title: LSM-Tree thắng lớn về thông lượng ghi nhưng cần canh chừng Compaction
  vi: "Ở tải ghi ngẫu nhiên 85.000 ops/s, B-Tree nghẽn cứng quanh mốc ~38.000 ops/s, còn LSM-Tree xử lý trọn vẹn. Đổi lại, khi Compaction chạy mạnh ở giây 50..56, băng thông đĩa bị chia sẻ làm p99 nhích lên tạm thời."
whatChanged:
  - "~ Bơm luồng cảm biến IoT (90% ghi) tăng từ 10k lên 85k ops/s vào cả hai Engine"
  - "~ Giây 18: B-Tree chạm ρ = 1,00; LSM-Tree giữ ρ ≈ 0,71 và Compaction ở giây 50"
telemetry:
  - label: "Trần ghi B-Tree"
    value: "≈ 38.000 ops/s"
    tone: bad
  - label: "Tải LSM-Tree (85k ops/s)"
    value: "ρ ≈ 0,71 (ổn định)"
    tone: ok
  - label: "Nhịp Compaction (t = 50 s)"
    value: "+8 ms (gộp SSTable)"
    tone: warn
```

Trên sân khấu trực tiếp, `Ingest Gateway` nhân đôi cùng một luồng cảm biến IoT (`90%` ghi) tăng từ `10.000` lên `85.000 ops/s` sang cả hai nhánh:

- **Nhánh `B-Tree Engine`:** Chạy êm ở tải thấp, nhưng ngay khoảng **giây 18** khi lưu lượng vượt `~38.000 ops/s`, tốc độ xả trang ngẫu nhiên chạm trần IOPS làm hàng đợi dồn ứ và chuyển sang trạng thái quá tải (`overloaded`).
- **Nhánh `LSM-Tree Engine`:** Tiếp tục hấp thụ mượt mà toàn bộ `85.000 ops/s` (`ρ ≈ 0,71`) nhờ chỉ ghi tuần tự.
- **Thử nghiệm tương tác:** Bạn có thể gạt tắt núm `Bật nhánh đối chiếu B-Tree` trong bảng điều khiển Live để quan sát riêng `LSM-Tree`: vào khoảng **giây 50 đến giây 56**, khi tiến trình Compaction gộp nhiều tệp SSTable lớn ở nền tranh giành I/O đĩa, độ trễ đuôi nhích nhẹ rồi nhanh chóng hạ về mức nền. Trong vận hành thật, kỹ sư luôn đặt giới hạn băng thông I/O (*rate limit*) cho luồng Compaction để tránh gây giật độ trễ `p99`.

## 7. Tam giác đánh đổi: B-Tree so với LSM-Tree

```step
category: MECHANISM
short: So B-Tree & LSM
scene: s7-amplification-triad
callout:
  kind: compare
  title: Không có Storage Engine nào tối ưu đồng thời cả Đọc, Ghi và Dung lượng
  vi: "Định lý thực nghiệm RUM Conjecture chỉ ra: giảm chi phí Ghi (như LSM-Tree) tất yếu đẩy một phần chi phí sang Đọc hoặc Dung lượng tạm thời chờ Compaction."
whatChanged:
  - "+ Đặt B-Tree và LSM-Tree lên bàn cân theo 3 chiều khuếch đại: Đọc, Ghi và Không gian"
telemetry:
  - label: "Ưu thế B-Tree"
    value: "Độ trễ đọc p99 ổn định"
    tone: ok
  - label: "Ưu thế LSM-Tree"
    value: "Thông lượng ghi & Tỉ lệ nén"
    tone: ok
```

Bảng đối chiếu trực diện giúp bạn chọn đúng công cụ lưu trữ cho hệ thống của mình:

| Tiêu chí | B-Tree Storage Engine (PostgreSQL, InnoDB) | LSM-Tree Storage Engine (RocksDB, Cassandra) |
|---|---|---|
| **Mẫu I/O khi ghi** | Ghi WAL tuần tự + xả trang bẩn 8–16 KB ngẫu nhiên | Ghi tuần tự 100% (WAL + xả SSTable + Compaction) |
| **Hiệu năng Đọc** | Nhanh và có độ trễ đuôi `p99` rất đều (1 vị trí/khoá) | Có thể phải kiểm tra vài tầng tệp (nhờ Bloom Filter giảm thiểu) |
| **Tỷ lệ nén trên đĩa** | Thấp hơn do trang chừa khoảng trống phòng tách trang (phân mảnh trong) | Cao hơn hẳn vì SSTable viết liền mạch không chừa lỗ rỗng |
| **Khóa giao dịch cấp dòng** | Rất thuận lợi để gắn khoá trực tiếp trên một vị trí duy nhất | Phức tạp hơn cho giao dịch đa dòng nặng |
| **Bài toán phù hợp nhất** | Đơn hàng, tài khoản ngân hàng, hệ thống OLTP đọc nhiều hơn ghi | Tin nhắn chat (Discord/Zalo), log sự kiện, chỉ số IoT, khoá-giá trị ghi dày đặc |

## 8. Bố cục vật lý cuối cùng: lưu trữ theo Dòng (OLTP) và theo Cột (OLAP)

```step
category: TECHNIQUE
short: Dòng vs Cột
scene: s8-row-vs-column
activity: S4-08.A2
gate: required
callout:
  kind: key-idea
  title: Đặt những byte thường được đọc cùng nhau nằm cạnh nhau trên ổ đĩa
  vi: "Giao dịch lấy trọn thông tin 1 đơn hàng cần các cột của dòng đó nằm liền nhau (Row-oriented); còn báo cáo tính tổng doanh thu 1 tỷ đơn hàng chỉ trên 2 cột thì cần các giá trị của cùng 1 cột nằm liền nhau (Column-oriented)."
whatChanged:
  - "+ So sánh bố cục nối tiếp từng bản ghi (Row) với tách tệp theo từng cột (Column)"
  - "+ Lưu theo cột nén tốt gấp 5–10 lần nhờ mã hoá lặp Run-Length Encoding"
telemetry:
  - label: "OLTP (xem/sửa 1 bản ghi)"
    value: "Lưu theo Dòng (Row)"
    tone: ok
  - label: "OLAP (quét 2/60 cột tỷ dòng)"
    value: "Lưu theo Cột (Column)"
    tone: ok
```

Ngoài cách đánh chỉ mục (B-Tree hay LSM), quyết định thứ hai của Storage Engine là **sắp xếp các trường của bảng trên đĩa theo chiều nào**:

1. **Lưu trữ theo Dòng (Row-oriented — PostgreSQL, MySQL, RocksDB):** Toàn bộ các cột của dòng `1` nằm liền nhau, rồi tới dòng `2`. Cực nhanh khi truy xuất theo khoá chính (`SELECT * FROM orders WHERE id = 901`) hoặc chèn/sửa một đơn hàng. Nhưng nếu chạy báo cáo phân tích `SELECT AVG(amount) FROM events` trên bảng rộng `60` cột và `1 tỷ` dòng, Engine buộc phải kéo cả `60` cột từ đĩa lên RAM rồi vứt bỏ `59` cột!
2. **Lưu trữ theo Cột (Column-oriented — ClickHouse, BigQuery, Snowflake, định dạng tệp Parquet):** Tách riêng mỗi cột thành một dải byte liên tục (`amount.col`, `city.col`). Câu lệnh `AVG(amount)` chỉ đọc đúng `1/60` lượng dữ liệu đĩa! Hơn nữa, vì cùng một cột chứa toàn giá trị cùng kiểu lặp lại nhiều (như cột `city` có hàng nghìn chữ `'HN'` đứng liền nhau), thuật toán nén **Run-Length Encoding (`HN × 3000`)** rút gọn dung lượng 5–10 lần và cho phép CPU cộng hàng loạt phần tử bằng tập lệnh vector **SIMD**.

## 9. Tổng kết: bản đồ lựa chọn Storage Engine thực chiến

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba mảnh ghép hoàn chỉnh của tầng lưu trữ hiện đại
  vi: "WAL bảo vệ độ bền qua sự cố; B-Tree phục vụ giao dịch OLTP đọc nhanh ổn định; LSM-Tree nuốt trọn các luồng ghi cường độ lớn; và Columnar Store gánh các truy vấn phân tích quy mô hàng tỷ dòng."
whatChanged:
  - "+ Khung ánh xạ từ đặc tính tải đọc/ghi/phân tích sang đúng kiến trúc Storage Engine"
telemetry:
  - label: "Đảm bảo bền vững chung"
    value: "WAL + Group Commit"
    tone: ok
  - label: "Phân tách OLTP / OLAP"
    value: "Row DB → CDC → Columnar"
    tone: ok
```

Trong một hệ thống quy mô lớn, các loại Storage Engine không loại trừ nhau mà phối hợp đúng sở trường:

1. **Cơ sở dữ liệu nghiệp vụ chính (OLTP):** Dùng **B-Tree theo dòng** (như PostgreSQL / MySQL InnoDB) có `WAL + Group Commit + Checkpoint` để đảm bảo giao dịch ACID và độ trễ đọc `p99` thấp, ổn định.
2. **Kho lưu trữ ghi tần suất cực cao (tin nhắn, chuỗi thời gian, sự kiện người dùng):** Dùng **LSM-Tree** (như ScyllaDB, Cassandra hoặc RocksDB) kết hợp `Bloom Filter` để biến ghi ngẫu nhiên thành ghi tuần tự.
3. **Kho phân tích dữ liệu (OLAP / Data Warehouse):** Đẩy luồng thay đổi (CDC) sang kho **lưu trữ theo cột** (ClickHouse, Parquet trên Data Lake) để chạy các truy vấn tổng hợp nặng mà không làm nghẽn cơ sở dữ liệu sản xuất.
