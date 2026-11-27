## 1. Khi nào cần phân mảnh ngang (Sharding) và vai trò của Shard Key

```step
category: SETUP
short: Khi nào Shard
scene: s1-why-shard
callout:
  kind: key-idea
  title: Quyết định khó đảo ngược nhất ở tầng dữ liệu
  vi: "Mọi ưu điểm mở rộng lẫn mọi điểm nghẽn sau này của cụm phân mảnh đều do cách bạn chọn cột Shard Key ngay từ đầu quyết định."
whatChanged:
  - "+ Chia cơ sở dữ liệu thành 4 phân mảnh độc lập (4 × 3.000 = 12.000 ops/s)"
  - "+ Shard Router App định tuyến mỗi bản ghi về đúng phân mảnh theo Shard Key"
telemetry:
  - label: "Số phân mảnh"
    value: "4 shards"
  - label: "Tổng năng lực danh nghĩa"
    value: "12.000 ops/s"
    tone: ok
  - label: "ρ khi tải đều (t = 10 s)"
    value: "0,36"
    tone: ok
```

Khi lượng ghi vượt trần máy chủ lớn nhất hoặc bảng dữ liệu chạm hàng chục terabyte khiến việc sao lưu và dựng chỉ mục trên một máy quá chậm, ta buộc phải **phân mảnh ngang (Horizontal Sharding)**: cắt các hàng dữ liệu ra nhiều máy chủ độc lập (**Shards**), mỗi máy chỉ giữ một phần tập dữ liệu.

Trọng tâm của thiết kế phân mảnh là chọn **Shard Key** (còn gọi là **Partition Key**), ví dụ `user_id`, `tenant_id` hoặc `order_id`. Tầng định tuyến dùng giá trị của khoá này để xác định duy nhất một phân mảnh sở hữu bản ghi đó cho cả thao tác ghi lẫn đọc.

## 2. Phân mảnh theo khoảng (Range Sharding): mạnh cho quét dải, dễ lệch tải theo thời gian

```step
category: MECHANISM
short: Range Sharding
scene: s2-range-hotspot
callout:
  kind: watch-out
  title: Cẩn thận với khoá tăng đơn điệu
  vi: "Chia khoảng theo ngày tạo hoặc ID tự tăng sẽ dồn 100% lượt ghi mới vào phân mảnh cuối cùng, biến cụm N máy thành năng lực của đúng 1 máy."
whatChanged:
  - "+ Chia bản ghi theo dải giá trị liên tục của khoá trên 4 phân mảnh"
  - "~ Dữ liệu mới phát sinh dồn cục bộ vào Shard 4 gây quá tải điểm nóng"
telemetry:
  - label: "Truy vấn theo khoảng"
    value: "Nhanh (1–2 shard)"
    tone: ok
  - label: "Tải trên Shard mới nhất"
    value: "78% tổng lưu lượng"
    tone: bad
```

**Range Sharding** gán mỗi phân mảnh một đoạn liên tục của không gian khoá — ví dụ tên khách hàng `A–F` vào Shard 1, `G–M` vào Shard 2, hoặc đơn hàng theo từng tháng.

Ưu điểm lớn là các câu truy vấn lọc theo khoảng (`WHERE created_at BETWEEN '2026-11-01' AND '2026-11-07'`) chỉ cần đọc đúng 1 hoặc 2 phân mảnh liên quan.

Tuy nhiên, Range Sharding rất dễ sinh **điểm nóng (Hot Spot)**: nếu dùng cột thời gian hoặc mã tự tăng làm Shard Key, mọi lượt tạo đơn và xem đơn mới đều dập dồn vào phân mảnh phụ trách khoảng hiện tại, trong khi các phân mảnh lưu tháng cũ gần như không dùng tới CPU.

## 3. Phân mảnh theo hàm băm (Hash Sharding): rải đều các khoá liên tiếp

```step
category: TECHNIQUE
short: Hash Sharding
scene: s3-hash-even
callout:
  kind: technique
  title: Phá vỡ tính tuần tự bằng hàm băm
  vi: "Hàm băm tốt (như MurmurHash3, xxHash hoặc FNV-1a) biến hai mã đơn hàng sát nhau thành hai vị trí ngẫu nhiên đều trên các phân mảnh."
whatChanged:
  - "+ Đổi quy tắc định tuyến sang shard_id = hash(shard_key) mod 4"
  - "~ Lưu lượng từ các ID liên tiếp được chia đều xấp xỉ 25% cho mỗi phân mảnh"
telemetry:
  - label: "Công thức chọn đích"
    value: "hash(key) mod 4"
  - label: "Tỷ trọng mỗi Shard"
    value: "≈ 25%"
    tone: ok
```

Để triệt tiêu điểm nóng do khoá tuần tự, **Hash Sharding** đưa `shard_key` qua một hàm băm xác định rồi chia cho số phân mảnh `N`:

$$\text{shard\_id} = \text{hash}(\text{shard\_key}) \bmod N$$

Dù `order:1001`, `order:1002`, `order:1003`, `order:1004` được sinh ra cùng một giây, giá trị băm của chúng rải đều vào cả 4 phân mảnh, giúp mỗi máy nhận xấp xỉ **25%** lưu lượng đọc và ghi.

Cái giá phải trả ngay lập tức là thứ tự tự nhiên trên khoá bị xoá bỏ: câu truy vấn tìm khoảng giá trị trên `shard_key` không còn nằm liền kề trên một máy mà phải hỏi toàn bộ `N` phân mảnh.

## 4. Điểm nóng dữ liệu (Hot Key / phân phối Zipf): khi hàm băm không cứu được

```step
category: PROBLEM
short: Điểm nóng Zipf
scene: s4-live-hotkey
live: hotkey
activity: S2-09.A1
gate: optional
callout:
  kind: watch-out
  title: Hàm băm rải đều nhiều khoá khác nhau, không tách được một khoá duy nhất
  vi: "Mọi truy vấn đọc cùng một khoá nổi tiếng luôn cho ra đúng một giá trị băm nên tất cả đều đổ dồn vào cùng một phân mảnh."
whatChanged:
  - "~ Tại t = 15 s, một khoá nổi tiếng chiếm s = 70% lưu lượng xuống cụm NoSQL"
  - "~ Phân mảnh chứa khoá nóng nhận 77,5% tải, kéo ρ vọt lên 1,13 và tràn hàng đợi"
```

Hash Sharding chỉ chia tải đều khi lưu lượng trải qua nhiều khoá khác nhau. Trong thực tế, lưu lượng mạng xã hội và thương mại điện tử tuân theo **phân phối Zipf**: một bài đăng của người nổi tiếng hoặc một mặt hàng mở bán giờ vàng có thể chiếm **70%** tổng truy cập (`s = 0,70`).

Vì `hash("post:celeb_99")` luôn trả về cùng một chỉ số phân mảnh, phân mảnh xấu số đó phải gánh toàn bộ 70% lưu lượng nóng cộng thêm 1/4 của 30% lưu lượng nền còn lại:

$$f_{\text{hot}} = s + \frac{1 - s}{N} = 0{,}70 + \frac{0{,}30}{4} = 0{,}775 \text{ (77,5\%)}$$

Thông lượng tối đa của cả cụm 4 máy (danh nghĩa 12.000 ops/s) lập tức sụt xuống chỉ còn $\mu_{\text{eff}} = 3.000 / 0{,}775 \approx 3.871$ ops/s! Ở mức tải xuống DB là 4.358 ops/s, cụm rơi vào quá tải ngay sau giây 15.

## 5. Sai lầm phổ biến: thêm thật nhiều Shard để chống một Hot Key

```step
category: PITFALL
short: Bẫy thêm Shard
scene: s5-trap-shards
activity: S2-09.A2
gate: optional
callout:
  kind: watch-out
  title: Chi phí tăng gấp 4 nhưng năng lực chỉ nhích thêm 8%
  vi: "Tăng từ 4 lên 16 shard chỉ chia nhỏ phần 30% lưu lượng lạnh, còn 70% lưu lượng của khoá nổi tiếng vẫn nằm nguyên trên một máy duy nhất."
whatChanged:
  - "~ Thử tăng Số phân mảnh từ 4 lên 16 (chi phí NoSQL tăng từ 2,00 lên 8,00 USD/giờ)"
  - "~ Năng lực hiệu dụng chỉ nhích từ 3.871 lên 4.174 ops/s (< tải 4.358 ops/s)"
telemetry:
  - label: "f_hot ở 16 Shards"
    value: "71,9% trên 1 máy"
    tone: bad
  - label: "μ hiệu dụng (16 Shards)"
    value: "≈ 4.174 ops/s"
    tone: bad
  - label: "Chi phí cụm Shard"
    value: "8,00 USD/giờ (×4)"
    tone: warn
```

Phản xạ quen thuộc khi thấy cụm NoSQL báo quá tải là kéo thanh **Số phân mảnh** tăng gấp bội. Hãy kiểm tra bằng công thức ở `N = 16` phân mảnh khi `s = 0,70`:

$$f_{\text{hot}} = 0{,}70 + \frac{0{,}30}{16} = 0{,}71875 \implies \mu_{\text{eff}} = \frac{3.000}{0{,}71875} \approx 4.174 \text{ ops/s}$$

Dù bạn trả tiền gấp 4 lần cho 16 máy chủ (danh nghĩa 48.000 ops/s), năng lực thực tế chỉ tăng chưa đầy 8% và vẫn thấp hơn lượng tải 4.358 ops/s đang đi xuống DB (`ρ = 1,04 > 1`). Thậm chí nếu tăng tới vô hạn phân mảnh ($N \to \infty$), trần thông lượng vẫn bị chặn cứng ở $3.000 / 0{,}70 \approx 4.286$ ops/s!

## 6. Hai hướng giải cứu Hot Key: bộ nhớ đệm khoá nóng và tách khoá (Key Salting)

```step
category: TECHNIQUE
short: Xử lý Hot Key
scene: s6-fix-hotkey
activity: S2-09.A3
gate: required
callout:
  kind: technique
  title: Chặn đọc nóng ở tầng trên, chẻ ghi nóng thành K mảnh con
  vi: "Với đọc nóng, mở rộng Cache kèm Singleflight (hoặc L1 RAM tại App). Với ghi nóng, gắn hậu tố ngẫu nhiên 0..K−1 vào khoá rồi cộng gộp khi đọc."
whatChanged:
  - "~ Mở rộng Hot-Key Cache lên 100.000 key (Hit Ratio đạt 90%), giữ nguyên 4 Shards"
  - "~ Lượng truy vấn lọt xuống NoSQL giảm từ 4.358 còn 988 ops/s (ρ = 0,26)"
telemetry:
  - label: "Tải xuống Shards"
    value: "988 ops/s"
    tone: ok
  - label: "ρ của Shard nóng"
    value: "0,26"
    tone: ok
  - label: "Tổng chi phí"
    value: "2,68 USD/giờ"
    tone: ok
```

Tuỳ điểm nóng thuộc loại đọc hay ghi, ta xử lý đúng bản chất:

1. **Khi Hot Key thiên về đọc (xem bài đăng, giá sản phẩm):**
   - Đặt **Hot-Key Cache** đủ lớn kèm **Singleflight** (chỉ cho 1 request xuống DB nạp lại khi hết hạn). Trong mô phỏng, nâng dung lượng Cache lên 100.000 key đưa Hit Ratio lên 90%, hạ tải xuống cụm 4 shard còn 988 ops/s (`ρ = 0,26`, p99 ≈ 46 ms).
   - Nếu một khoá nóng vượt cả băng thông một node Redis, lưu đệm ngắn (TTL 1–2 giây) ngay trong **RAM cục bộ (L1 In-process Cache)** của từng máy `App`.
2. **Khi Hot Key thiên về ghi (đếm lượt thích trực tiếp, bỏ phiếu):**
   - Dùng **Key Salting (tách khoá con):** cộng thêm hậu tố ngẫu nhiên từ `0` đến `K - 1` (ví dụ `likes:post_99#0` … `likes:post_99#7`). Tám khoá con băm ra nhiều phân mảnh khác nhau chia đều lượt ghi; khi đọc chỉ cần đọc cả `K` khoá con rồi cộng tổng.

## 7. Đánh đổi của Sharding: truy vấn xuyên phân mảnh (Scatter-Gather) và giao dịch

```step
category: MECHANISM
short: Scatter-Gather
scene: s7-scatter-gather
callout:
  kind: compare
  title: Đuôi độ trễ bị quyết định bởi phân mảnh chậm nhất
  vi: "Một câu truy vấn không mang Shard Key phải gửi tới toàn bộ N phân mảnh; chỉ cần 1 máy khựng GC là cả câu truy vấn chậm theo."
whatChanged:
  - "+ Truy vấn lọc theo cột phụ không chứa Shard Key phải quét cả 4 phân mảnh"
  - "~ Mất khả năng JOIN trực tiếp và giao dịch ACID rẻ giữa các phân mảnh"
telemetry:
  - label: "Truy vấn có Shard Key"
    value: "Chạm đúng 1 shard"
    tone: ok
  - label: "Truy vấn thiếu Shard Key"
    value: "Chạm cả N shards"
    tone: bad
```

Phân mảnh phá vỡ sự tiện lợi của một cơ sở dữ liệu nguyên khối ở ba khía cạnh:

- **Truy vấn Scatter-Gather:** nếu ứng dụng cần tìm `WHERE status = 'PENDING'` hay sắp xếp `ORDER BY created_at LIMIT 20` mà không kèm `user_id` (Shard Key), bộ định tuyến buộc phải phát câu lệnh tới **tất cả `N` phân mảnh**, chờ phân mảnh chậm nhất trả lời rồi mới trộn kết quả. Khi `N = 20`, xác suất dính ít nhất một máy đang khựng I/O tăng gấp gần 20 lần.
- **Không còn phép nối JOIN và khoá ngoại xuyên máy:** dữ liệu liên quan nên được gom cùng Shard Key (ví dụ bảng `orders` và `order_items` cùng phân mảnh theo `user_id`) hoặc dựng bảng chỉ mục phụ riêng.
- **Giao dịch đa phân mảnh đắt đỏ:** cập nhật hai tài khoản nằm ở hai phân mảnh khác nhau đòi hỏi giao thức hai pha (2PC) hoặc chuyển sang mẫu Saga bất đồng bộ.

## 8. Thách thức mở rộng cụm: vì sao `hash(key) mod N` gây bão dời dữ liệu

```step
category: PITFALL
short: Đổi số lượng N
scene: s8-modn-pain
callout:
  kind: watch-out
  title: Thay đổi mẫu số làm đảo lộn gần hết phép chia dư
  vi: "Khi tăng từ N lên N + 1 phân mảnh với công thức hash(key) mod N, trung bình N / (N + 1) tổng số bản ghi sẽ đổi phân mảnh sở hữu."
whatChanged:
  - "~ Tăng cụm từ 4 lên 5 máy theo công thức hash(key) mod N"
  - "~ Khoảng 4 / 5 = 80% toàn bộ dữ liệu phải di chuyển sang máy khác"
telemetry:
  - label: "Tỷ lệ khoá bị dời (4 → 5)"
    value: "80%"
    tone: bad
  - label: "Công thức tổng quát"
    value: "N / (N + 1)"
    tone: warn
```

Công thức `hash(key) mod N` chỉ yên ổn chừng nào số phân mảnh `N` giữ cố định. Khi dữ liệu lớn lên buộc phải thêm máy thứ 5 (`N` đổi từ 4 sang 5), hầu hết các khoá đều ra số dư mới:

| Giá trị `h = hash(key)` | `h mod 4` (cũ) | `h mod 5` (mới) | Kết quả |
|---|---|---|---|
| `0, 1, 2, 3` | `0, 1, 2, 3` | `0, 1, 2, 3` | Giữ nguyên (4 giá trị) |
| `4, 5, 6, 7` | `0, 1, 2, 3` | `4, 0, 1, 2` | **Đổi máy hết** |
| `8..19` | … | … | **16 / 20 = 80% đổi máy!** |

Tổng quát, chuyển từ $N$ lên $N + 1$ máy làm dời khoảng $\frac{N}{N + 1}$ tập dữ liệu (từ 9 lên 10 máy phải chép lại **90%** toàn bộ ổ đĩa qua mạng!). Đây chính là động lực ra đời của **Consistent Hashing** ở bài kế tiếp (S2-10).

## 9. Tóm tắt: ba tiêu chí vàng khi chọn Shard Key

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba tiêu chí đánh giá một Shard Key tốt
  vi: "Độ đa dạng giá trị cao (High Cardinality), tần suất truy cập phân bố đều, và luôn có mặt trong mệnh đề WHERE của các truy vấn quan trọng nhất."
whatChanged:
  - "+ Hoàn thiện khung thiết kế phân mảnh và phòng chống điểm nóng dữ liệu"
telemetry:
  - label: "Chống đọc nóng"
    value: "Cache + Singleflight"
    tone: ok
  - label: "Chống ghi nóng"
    value: "Key Salting (#0..K-1)"
    tone: ok
```

Ghi nhớ bốn kết luận thực chiến của bài học:

1. **Range so với Hash:** Range Sharding hỗ trợ quét dải giá trị nhưng dễ tạo điểm nóng trên khoá tăng dần; Hash Sharding rải đều các khoá khác nhau nhưng mất khả năng quét khoảng trực tiếp.
2. **Hot Key làm tê liệt thông lượng cụm:** khi một khoá chiếm tỷ trọng $s$ lưu lượng, phân mảnh chứa nó nhận $f_{\text{hot}} = s + (1 - s)/N$, kéo trần cả cụm về $\mu_{\text{shard}} / f_{\text{hot}}$. Chỉ thêm phân mảnh không giải quyết được.
3. **Sửa đúng bản chất Hot Key:** dùng **Cache + Singleflight** (và L1 RAM cache) cho khoá đọc nóng; dùng **Key Salting** tách thành $K$ khoá con cho bộ đếm ghi nóng.
4. **Tránh resharding bằng `mod N`:** không băm trực tiếp theo số máy vật lý; hãy dùng tầng bảng ánh xạ phân mảnh logic hoặc **Consistent Hashing** (S2-10).
