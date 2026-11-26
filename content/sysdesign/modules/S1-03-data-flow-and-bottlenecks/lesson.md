## 1. Điểm nghẽn (Bottleneck): thông lượng của hệ thống bị giới hạn bởi thành phần chậm nhất

```step
category: SETUP
short: Điểm nghẽn
scene: s1-path
callout:
  kind: key-idea
  title: Luật cốt lõi
  vi: "Thông lượng tối đa của cả hệ thống bằng thông lượng tối đa của thành phần chậm nhất trên đường đi của request. Tối ưu một thành phần khác không làm hệ thống nhanh hơn."
whatChanged:
  - "+ Đường đi của một request: Client, Load Balancer, App, Cache, Database"
  - "~ Database là thành phần đầu tiên chạm ρ = 1 khi tải tăng"
telemetry:
  - label: "ρ của Database"
    value: "1,00"
    tone: bad
  - label: "ρ của mỗi App"
    value: "0,56"
    tone: ok
  - label: "Tải vào (t = 35 s)"
    value: "≈ 3.000 req/s"
```

**Điểm nghẽn (Bottleneck)** là thành phần giới hạn thông lượng của toàn bộ đường đi: mọi request đều phải qua nó, nên cả hệ thống không thể xử lý nhanh hơn nó. Điều này kéo theo một hệ quả thực tế: thêm tài nguyên cho thành phần không phải điểm nghẽn không làm hệ thống nhanh hơn.

Hãy xem một chuỗi sản xuất ba bước: cắt vải 1 phút, may 5 phút, đóng gói 30 giây mỗi sản phẩm. Cả chuỗi ra một sản phẩm mỗi 5 phút. Rút bước cắt vải xuống 10 giây không đổi gì, vì bước may vẫn là bước chậm nhất.

Với một request đi qua hệ thống, ta cộng thời gian các chặng. Giả sử mạng của client 50 ms mỗi chiều, server 10 ms mỗi chiều, Database 500 ms. Tổng là 50 + 10 + 500 + 10 + 50 = 620 ms.

| Cách tối ưu | Tiết kiệm | Tỉ lệ trên 620 ms |
|---|---|---|
| Server 10 ms xuống 1 ms (qua hai chiều) | 18 ms | khoảng 3% |
| Database 500 ms xuống 50 ms | 450 ms | khoảng 73% |

Bạn có thể hình dung giống một đường ống: tốc độ nước chảy qua cả đường ống do đoạn hẹp nhất quyết định.

## 2. Đường đi của request: độ trễ là tổng thời gian các chặng nối tiếp

```step
category: MECHANISM
short: Đường đi request
scene: s2-flow
callout:
  kind: good-to-know
  vi: "Độ trễ (Latency) trả lời câu hỏi một request mất bao lâu. Thông lượng (Throughput) trả lời câu hỏi mỗi giây xử lý được bao nhiêu request. Hai đại lượng này do hai tiêu chí khác nhau quyết định."
whatChanged:
  - "+ Cache nằm giữa App và Database (read-through)"
  - "~ Khoảng 53% request cuối cùng mới đi tới Database"
telemetry:
  - label: "Tỉ lệ đọc"
    value: "90%"
  - label: "Cache Hit (trên lượt đọc)"
    value: "≈ 52%"
    tone: ok
  - label: "Request tới Database"
    value: "≈ 53%"
    tone: warn
```

**Data flow** là đường đi của dữ liệu qua các thành phần. Trong hệ thống của bài này, một request đi theo thứ tự: Client, Load Balancer, một trong ba App, rồi Cache. Nếu Cache có dữ liệu (Cache Hit) thì App nhận kết quả ngay. Nếu không (Cache Miss), Cache hỏi tiếp Database rồi nhớ lại kết quả. Response đi ngược đường cũ.

**Độ trễ của một request** bằng tổng thời gian các chặng nối tiếp: mạng, xử lý ở từng thành phần, thời gian chờ trong hàng đợi trước mỗi thành phần. Một chặng chậm kéo cả tổng lên.

**Thông lượng** thì khác: nó bị giới hạn bởi thành phần có mức tải cao nhất so với năng lực của chính nó. Để tính tải lên Database, ta xét: 90% request là đọc, Cache trả lời khoảng 52% lượt đọc, nên tỉ lệ tới Database là 0,9 × (1 − 0,52) + 0,1 ≈ 0,53, tức hơn một nửa số request vẫn xuống Database (gồm các lượt đọc Cache Miss và toàn bộ lượt ghi).

## 3. Bước 1: đo thời gian từng chặng, không đoán

```step
category: TECHNIQUE
short: Đo từng chặng
scene: s3-trace
callout:
  kind: watch-out
  title: Đo trước khi sửa
  vi: "Mỗi nhóm trong team thường có một giả thuyết riêng (Database chậm, mạng chậm, code kém). Chỉ số đo từng chặng mới cho biết giả thuyết nào đúng."
whatChanged:
  - "+ Gắn thời gian cho từng chặng của một request"
  - "~ Database chiếm 300 ms trên tổng 427 ms"
telemetry:
  - label: "Tổng thời gian (ví dụ)"
    value: "427 ms"
  - label: "Chặng Database"
    value: "300 ms"
    tone: bad
  - label: "Tỉ trọng Database"
    value: "70%"
    tone: warn
```

Bước đầu tiên của phân tích điểm nghẽn là **đo thời gian từng chặng** của một request cụ thể. Ví dụ dưới đây là một request tải trang hồ sơ người dùng, lần này Cache Miss nên request đi xuống Database. Đây là số liệu minh hoạ cho một hệ thống khác với mô phỏng ở các bước sau.

| Chặng | Thời gian |
|---|---|
| Client tới Load Balancer | 50 ms |
| Load Balancer tới App | 10 ms |
| App kiểm tra Cache (Miss) | 5 ms |
| App truy vấn Database | 300 ms |
| App ghi kết quả vào Cache | 2 ms |
| App trả về Load Balancer | 10 ms |
| Load Balancer trả về Client | 50 ms |
| **Tổng** | **427 ms** |

Chặng Database chiếm 300 / 427, khoảng 70% tổng thời gian. Trên sơ đồ, mỗi đường nối gộp thời gian đi và về của chặng đó (ví dụ Client và Load Balancer: 50 + 50 = 100 ms).

Một lưu ý khi đọc kết quả: đo một request cho biết thời gian nằm ở đâu, còn câu hỏi hệ thống chịu được bao nhiêu tải thì cần đo theo mức sử dụng ở bước 5.

## 4. Công cụ đo: log thời gian, APM, tracing và EXPLAIN

```step
category: TECHNIQUE
short: Công cụ đo
mode: code
callout:
  kind: technique
  title: Ba lớp công cụ
  vi: "Log thời gian tự viết cho câu trả lời nhanh, APM và Distributed Tracing cho cả đường đi của request, EXPLAIN ANALYZE cho từng câu truy vấn."
```

Có ba cách phổ biến để lấy số đo ở môi trường thật, từ đơn giản đến đầy đủ.

**Log thời gian tự viết** đo từng đoạn mã bằng đồng hồ đơn điệu (`time.perf_counter`) và ghi thành một dòng log có cấu trúc:

```python
import logging
import time

log = logging.getLogger("profile")

def load_profile(user_id: int) -> dict:
    t0 = time.perf_counter()
    user = cache.get(f"user:{user_id}")
    t_cache = time.perf_counter() - t0

    t_db = 0.0
    if user is None:  # Cache Miss
        t1 = time.perf_counter()
        user = db.query("SELECT id, name, email FROM users WHERE id = %s", user_id)
        t_db = time.perf_counter() - t1
        cache.set(f"user:{user_id}", user, ttl=300)

    total = time.perf_counter() - t0
    log.info("load_profile total=%.0fms cache=%.0fms db=%.0fms",
             total * 1e3, t_cache * 1e3, t_db * 1e3)
    return user

# Dòng log mẫu: load_profile total=307ms cache=5ms db=300ms
```

**APM và Distributed Tracing** (công cụ như OpenTelemetry cùng một hệ thống quan sát) gắn mỗi request một trace gồm nhiều span, mỗi span là một chặng có thời gian bắt đầu và kết thúc. Biểu đồ waterfall của trace cho thấy ngay span nào dài nhất.

**EXPLAIN ANALYZE** cho biết một câu truy vấn mất thời gian ở đâu. Kết quả có dòng `Seq Scan on users ... Execution Time: 285 ms` nghĩa là Database quét toàn bộ bảng, dấu hiệu thiếu chỉ mục (Index).

## 5. Bước 2: tìm điểm nghẽn bằng mức sử dụng ρ = λ / μ

```step
category: TECHNIQUE
short: Tìm bằng ρ
scene: s5-hot
callout:
  kind: key-idea
  title: Điểm nghẽn là thành phần có ρ cao nhất
  vi: "ρ ≥ 1 nghĩa là request đến nhanh hơn thành phần xử lý được, hàng đợi trước nó tăng không dừng."
whatChanged:
  - "+ Gắn mức sử dụng ρ lên từng thành phần tại t = 35 s"
  - "~ Database ρ = 1,00 trong khi mỗi App chỉ 0,56"
telemetry:
  - label: "ρ của Database"
    value: "1,00"
    tone: bad
  - label: "ρ của mỗi App"
    value: "0,56"
    tone: ok
  - label: "Tải bền vững tối đa"
    value: "≈ 3.010 req/s"
    tone: warn
```

Thời gian của một request cho biết chặng nào chậm. Còn để biết thành phần nào **giới hạn thông lượng**, ta so **mức sử dụng** ρ = λ / μ, với λ là số request đến mỗi giây và μ là số request thành phần xử lý tối đa mỗi giây.

Năng lực μ trong hệ thống của bài: Load Balancer 20.000, mỗi App 1.800, Cache 40.000, Database 1.600 (req/s). Khi tải vào λ = 3.000 req/s:

| Thành phần | Tải đến | μ | ρ |
|---|---|---|---|
| Load Balancer | 3.000 | 20.000 | 0,15 |
| App (mỗi instance, chia đều 3) | 1.000 | 1.800 | 0,56 |
| Cache | 3.000 | 40.000 | 0,07 |
| Database | 0,53 × 3.000 ≈ 1.590 | 1.600 | 1,00 |

Database có ρ cao nhất nên là điểm nghẽn. Tải bền vững tối đa của cả hệ thống là μ của Database chia cho tỉ lệ request xuống Database: 1.600 / 0,531 ≈ 3.010 req/s. Vượt mức đó, phần dư λ − μ cộng dồn mỗi giây vào hàng đợi.

## 6. Quan sát tải tăng dần: Database chạm ρ = 1 trước tầng App

```step
category: PROBLEM
short: Tải tăng dần
scene: s6-live
live: ramp
callout:
  kind: watch-out
  title: Độ trễ tăng dựng đứng gần ρ = 1
  vi: "Độ trễ không tăng đều theo tải. Khi ρ tiến tới 1, thời gian chờ trong hàng đợi chiếm phần lớn, nên p99 tăng nhanh trước khi lỗi xuất hiện."
whatChanged:
  - "~ Tải tăng từ 200 lên 5.000 req/s trong 60 giây"
  - "~ Database ρ = 0,6 (t = 20 s), 0,9 (t ≈ 31 s), 1,0 (t ≈ 35 s)"
telemetry:
  - label: "p99 (t = 20 s, rồi t = 35 s)"
    value: "≈ 64 ms, rồi ≈ 143 ms"
    tone: warn
  - label: "Lỗi (t = 35 s, rồi t = 40 s)"
    value: "≈ 0,9%, rồi ≈ 53%"
    tone: bad
  - label: "ρ của App (t = 40 s)"
    value: "0,63"
    tone: ok
```

Kịch bản mô phỏng của bài tăng tải từ 200 lên 5.000 req/s trong 60 giây, rồi giữ ở 5.000 tới giây thứ 90. Kết quả theo mốc thời gian (không có nhiễu ngẫu nhiên):

- **t = 20 s** (λ = 1.800): ρ của Database 0,60, p99 khoảng 64 ms. Hệ thống còn dư năng lực.
- **t ≈ 31 s** (λ ≈ 2.700): ρ của Database chạm 0,9, thành phần chuyển sang trạng thái bận.
- **t ≈ 35 s** (λ ≈ 3.000): ρ của Database bằng 1,00, p99 tăng lên khoảng 143 ms, bắt đầu có lỗi. Mỗi App mới ở ρ khoảng 0,56.
- **t = 40 s**: ρ của Database 1,13, hàng đợi trước Database dài ra (khoảng 500 request), hơn một nửa request lỗi hoặc quá hạn.

Có thêm một cơ chế làm tình hình xấu đi nhanh: link từ Cache tới Database cho phép thử lại tối đa 2 lần, không có Backoff. Mỗi request lỗi sinh thêm tải lên đúng thành phần đang quá tải.

Tầng App chỉ chạm ρ = 0,9 ở khoảng giây thứ 58, rất lâu sau Database. Nghẽn xảy ra ở Database trước, không phải ở nơi có nhiều instance nhất.

## 7. Các loại điểm nghẽn thường gặp: CPU, bộ nhớ, I/O, mạng, API ngoài và Database

```step
category: MECHANISM
short: Các loại nghẽn
scene: s7-diagnosis
callout:
  kind: compare
  title: Triệu chứng chỉ ra loại điểm nghẽn
  vi: "Số đo tài nguyên của từng thành phần (CPU, RAM, I/O, mạng, hàng đợi) cho biết điểm nghẽn thuộc loại nào, từ đó chọn đúng cách sửa."
whatChanged:
  - "+ Cây chẩn đoán: triệu chứng đo được dẫn tới loại điểm nghẽn"
telemetry:
  - label: "Loại phổ biến"
    value: "5 loại"
  - label: "Tình huống minh hoạ"
    value: "Pool 10 kết nối"
    tone: warn
```

Cùng một triệu chứng "chậm khi tải tăng" có nhiều nguyên nhân. Mỗi loại để lại dấu hiệu đo được khác nhau:

| Loại | Dấu hiệu | Cách đo | Hướng xử lý |
|---|---|---|---|
| CPU, logic ứng dụng | CPU gần 100% | Profiler (ví dụ `cProfile`) | Đổi thuật toán, chuyển việc nặng sang Queue, scale ngang |
| Bộ nhớ | RAM cạn, swap | Giám sát RAM, heap | Giảm kích thước dữ liệu giữ trong RAM, tăng RAM |
| I/O đĩa | Thời gian chờ I/O cao | Số liệu disk I/O | Chỉ mục, đĩa nhanh hơn, ghi theo lô |
| Mạng, API ngoài | RTT cao, Timeout | Đo thời gian từng lời gọi | Gọi song song, Cache, Timeout ngắn, Circuit Breaker, đặt dịch vụ gần người dùng |
| Database | Truy vấn chậm, hàng đợi trước DB, pool đầy | `EXPLAIN`, `pg_stat_statements` | Chỉ mục, Cache, tối ưu truy vấn, Read Replica |

Tình huống: ứng dụng báo trễ khoảng 10 giây, CPU và RAM bình thường, Redis chỉ có Connection Pool 10 kết nối trong khi khoảng 1.000 request đang xếp hàng chờ kết nối. Tăng pool lên 100 đưa độ trễ về khoảng 200 ms. Giới hạn kết nối (pool, thread) cũng là một dạng điểm nghẽn, và nó cũng được đo bằng ρ.

## 8. Bước 3: sửa đúng thành phần, giảm tải vào Database hoặc tăng năng lực Database

```step
category: TECHNIQUE
short: Sửa đúng chỗ
scene: s8-fix
callout:
  kind: technique
  title: Ưu tiên cách rẻ trước
  vi: "Thứ tự thường hợp lý: tối ưu truy vấn và chỉ mục, tăng Cache Hit Ratio, rồi mới tăng năng lực Database. Cách nào cũng phải đo lại sau khi sửa."
whatChanged:
  - "~ Cache từ 25.000 lên 50.000 key, Hit Ratio từ 52% lên 74%"
  - "~ Database tăng cỡ máy gấp đôi (1.600 lên 3.200 req/s)"
  - "~ Request xuống Database giảm từ 53% còn 34%"
telemetry:
  - label: "ρ của Database (λ = 5.000)"
    value: "0,53"
    tone: ok
  - label: "p99 (λ = 5.000)"
    value: "≈ 106 ms"
    tone: ok
  - label: "Chi phí"
    value: "1,27 lên 2,31 USD/giờ"
    tone: warn
```

Bước thứ ba là **sửa đúng thành phần là điểm nghẽn**. Với Database có ba hướng:

1. **Tối ưu truy vấn và chỉ mục.** Thêm chỉ mục cho câu truy vấn quét toàn bảng đưa 300 ms xuống khoảng 5 ms, tức nhanh gấp 60 lần. Chọn đúng cột cần lấy (không dùng `SELECT *`) cũng giảm thời gian truyền.
2. **Giảm số request xuống Database bằng Cache.** Trong mô phỏng, Cache tăng từ 25.000 lên 50.000 key nâng Cache Hit Ratio lên khoảng 74%, tỉ lệ request xuống Database còn 0,9 × 0,26 + 0,1 ≈ 0,34.
3. **Tăng năng lực Database** (scale-up). Cỡ máy gấp đôi nâng μ lên 3.200 req/s.

Kết hợp cách 2 và 3, ở tải đỉnh 5.000 req/s ρ của Database còn khoảng 0,53 và p99 khoảng 106 ms. Cái giá là chi phí tăng từ khoảng 1,27 lên 2,31 USD/giờ.

Ví dụ khác: trang thanh toán mất 2.590 ms, trong đó một API tính phí vận chuyển bên ngoài chiếm 2.000 ms (khoảng 77%). Cache kết quả với Hit Ratio 85% cho thời gian trung bình 0,85 × 5 + 0,15 × 2.000 ≈ 304 ms, tổng còn khoảng 894 ms (giảm khoảng 65%).

## 9. Sai lầm phổ biến: thêm instance ở tầng không phải điểm nghẽn

```step
category: PITFALL
short: Thêm app vô ích
scene: s9-live
live: trap
callout:
  kind: watch-out
  title: Sai chỗ thì tốn tiền mà không hiệu quả
  vi: "Khi Database là điểm nghẽn, nhân đôi số instance App làm ρ của App giảm nhưng tải vào Database không đổi, nên p99 gần như giữ nguyên."
whatChanged:
  - "~ Mỗi App từ 1 lên 2 instance, ρ của App giảm còn khoảng 0,28"
  - "~ Tải vào Database không đổi, ρ vẫn bằng 1,00"
telemetry:
  - label: "ρ của App (t = 35 s)"
    value: "0,56 xuống 0,28"
    tone: ok
  - label: "ρ của Database"
    value: "1,00 (không đổi)"
    tone: bad
  - label: "p99 (t = 35 s)"
    value: "≈ 143 ms (đổi dưới 1%)"
    tone: bad
```

Khi hệ thống chậm, phản xạ thường gặp là thêm server. Phản xạ này chỉ đúng nếu server được thêm đúng ở thành phần là điểm nghẽn.

Trong mô phỏng, nhân đôi số instance của cả ba App làm ρ của mỗi App giảm từ 0,56 xuống 0,28. Nhưng số request xuống Database vẫn như cũ, nên ρ của Database vẫn bằng 1,00 và p99 ở t = 35 s gần như không đổi (khoảng 143 ms, chênh lệch dưới 1%). Chi phí thì tăng từ khoảng 1,27 lên 1,58 USD/giờ.

Một ví dụ số khác cho cùng sai lầm: API mất 1.000 ms, trong đó server 50 ms và Database 950 ms. Viết lại code server từ 50 xuống 10 ms chỉ giảm tổng còn 960 ms (cải thiện 4%). Thêm chỉ mục đưa Database từ 950 xuống 50 ms, tổng còn 100 ms (cải thiện 90%).

Nguyên tắc kiểm tra nhanh: trước khi thêm tài nguyên, hỏi thành phần này có ρ cao nhất trên đường đi hay không.

## 10. Sai lầm khi tối ưu: tối ưu sớm, không đo lại và tối ưu quá mức

```step
category: PITFALL
short: Sai lầm tối ưu
scene: s10-loop
callout:
  kind: key-idea
  vi: "Mỗi lần sửa là một giả thuyết. Số đo trước và sau khi sửa là cách duy nhất xác nhận giả thuyết đó đúng."
whatChanged:
  - "+ Vòng lặp đo, tìm, sửa, đo lại"
telemetry:
  - label: "Mức cải thiện tối thiểu"
    value: "10%"
  - label: "Nếu dưới mức này"
    value: "Xem lại giả thuyết"
    tone: warn
```

Ngoài việc chọn sai thành phần (bước 9), có ba sai lầm khác khi tối ưu:

- **Tối ưu sớm (Premature Optimization).** Thêm Cache, phân trang, cụm Redis khi chưa đo xem phần nào chậm. Lời của Donald Knuth thường được trích: tối ưu sớm là gốc của nhiều vấn đề. Cách tránh: có số đo chỉ ra điểm nghẽn rồi mới sửa.
- **Không đo lại sau khi sửa.** Chỉ đo lại mới biết cải tiến có hiệu quả. Nếu mức cải thiện dưới khoảng 10%, giả thuyết có thể sai: kiểm tra lại số đo, hoặc thử cách khác.
- **Tối ưu quá mức.** Một API đang trả lời trong 100 ms. Giảm xuống 50 ms tốn nhiều công sức nhưng người dùng khó nhận ra, vì ngưỡng cảm nhận phản hồi là tức thì thường được nhắc ở khoảng 100 ms. Chỉ tối ưu khi hiệu năng hiện tại chưa đạt yêu cầu và lợi ích đáng kể.

Sau mỗi lần sửa, điểm nghẽn có thể chuyển sang thành phần kế tiếp. Ở bài này, sau khi sửa Database, tầng App là thành phần chạm ρ cao nhất (khoảng 0,93 ở tải 5.000 req/s).

## 11. Tóm tắt: quy trình đo, tìm, sửa và đo lại

```step
category: RECAP
short: Tóm tắt
scene: s11-recap
callout:
  kind: key-idea
  title: Quy trình
  vi: "Đo, tìm điểm nghẽn, sửa đúng chỗ, đo lại, lặp lại. Hệ thống chỉ nhanh bằng thành phần chậm nhất."
whatChanged:
  - "+ Quy trình 5 bước áp dụng cho mọi hệ thống"
telemetry:
  - label: "Điểm nghẽn của bài"
    value: "Database (ρ = 1,00)"
    tone: bad
  - label: "Tải bền vững tối đa"
    value: "≈ 3.010 req/s"
```

Điểm nghẽn là thành phần giới hạn thông lượng của cả đường đi. Quy trình xử lý gồm năm bước:

1. **Đo.** Lấy thời gian từng chặng của một request và mức sử dụng ρ = λ / μ của từng thành phần. Không đoán.
2. **Tìm.** Chọn thành phần có ρ cao nhất (và chặng chiếm nhiều thời gian nhất trong trace).
3. **Sửa.** Chỉ tác động vào thành phần đó: giảm tải đi vào nó hoặc tăng năng lực của nó. Chọn cách rẻ nhất đạt mục tiêu.
4. **Đo lại.** Xác nhận cải thiện bằng số liệu.
5. **Lặp lại.** Điểm nghẽn có thể chuyển sang thành phần kế tiếp.

Ghi nhớ các số của bài: Database μ = 1.600 req/s, tỉ lệ request xuống Database khoảng 0,53, nên tải bền vững tối đa khoảng 3.010 req/s. Thêm App không đổi con số này, còn tăng Cache Hit Ratio hoặc tăng năng lực Database thì có.
