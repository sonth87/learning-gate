## 1. Nghịch lý ở mức sử dụng 96%: chưa quá tải nhưng p99 đã vọt gấp 7 lần

```step
category: SETUP
short: Nghịch lý 96%
scene: s1-setup
callout:
  kind: key-idea
  title: Ngẫu nhiên tạo ra hàng đợi trước khi chạm 100%
  vi: "Request từ người dùng không bao giờ đến cách đều từng mili-giây như dây chuyền đồng hồ. Các cụm đến sát nhau làm phát sinh hàng chờ ngay từ khi CPU vượt 75–80%."
whatChanged:
  - "+ Xét Checkout API có năng lực tối đa μ = 500 req/s, xử lý nền S = 10 ms"
  - "~ Tại 480 req/s (ρ = 0,96), không rớt request nào nhưng p99 vọt lên ~248 ms"
telemetry:
  - label: "Mức sử dụng ρ"
    value: "0,96 (480 / 500)"
    tone: bad
  - label: "p99 lúc rảnh (50 req/s)"
    value: "≈ 34 ms"
    tone: ok
  - label: "p99 tại 480 req/s"
    value: "≈ 248 ms"
    tone: bad
```

Khi tính nhẩm công suất, một sai lầm phổ biến là lấy máy chủ xử lý tối đa $\mu = 500$ req/s để gánh thẳng lưu lượng $\lambda = 480$ req/s vì nghĩ rằng $480 < 500$ vẫn còn dư 20 req/s.

Trong thực tế, khoảng cách giữa các request đến và thời gian CPU thực thi từng request đều biến thiên ngẫu nhiên. Khi máy đang bận 96% thời gian, chỉ cần một chùm 5–10 request đến dồn trong vài chục mili-giây là hàng đợi hình thành ngay lập tức, và máy chủ hầu như không còn khoảng trống rảnh để xả hết hàng đợi đó trước khi chùm tiếp theo ập tới.

## 2. Đường cong hàng đợi M/M/1: quy luật W = S / (1 − ρ)

```step
category: MECHANISM
short: Luật W=S/(1−ρ)
scene: s2-curve
callout:
  kind: good-to-know
  title: Điểm gãy ở vùng ρ ≈ 0,75 – 0,80
  vi: "Mẫu số (1 − ρ) chính là tỉ lệ thời gian rảnh còn lại của máy chủ. Khi phần rảnh thu hẹp từ 20% xuống 4%, hệ số nhân thời gian phản hồi nhảy vọt từ 5 lần lên 25 lần."
whatChanged:
  - "+ Lượng hóa thời gian phản hồi trung bình W theo mức sử dụng ρ"
  - "~ Đường cong phẳng ở ρ < 0,6 nhưng bẻ gập dựng đứng ngay sau ρ = 0,80"
telemetry:
  - label: "Hệ số tại ρ = 0,50"
    value: "×2 lần S"
    tone: ok
  - label: "Hệ số tại ρ = 0,80"
    value: "×5 lần S"
    tone: warn
  - label: "Hệ số tại ρ = 0,96"
    value: "×25 lần S"
    tone: bad
```

Trong lý thuyết hàng đợi cơ bản (mô hình $M/M/1$), tổng thời gian trung bình một request nằm tại nút (gồm thời gian xếp hàng cộng thời gian xử lý nền $S$) được xấp xỉ bởi công thức:

$$W = \frac{S}{1 - \rho}, \quad \text{với } \rho = \frac{\lambda}{\mu} < 1$$

Với thời gian xử lý nền $S = 10\text{ ms}$, hãy xem $W$ biến đổi phi tuyến như thế nào theo $\rho$:

| Mức sử dụng $\rho$ | Phần rảnh $(1 - \rho)$ | Hệ số nhân $\frac{1}{1 - \rho}$ | Thời gian trung bình $W$ |
|---|---|---|---|
| **0,20** (rảnh) | 80% | 1,25× | 12,5 ms |
| **0,50** (vừa phải) | 50% | 2,0× | 20,0 ms |
| **0,80** (điểm gãy) | 20% | 5,0× | 50,0 ms |
| **0,90** (bão hòa) | 10% | 10,0× | 100,0 ms |
| **0,96** (sát trần) | 4% | 25,0× | 250,0 ms |

## 3. Quan sát mô phỏng tăng tải 50 → 480 req/s trên dịch vụ μ = 500

```step
category: PROBLEM
short: Xem đường cong
scene: s3-queue-live
live: queueing
activity: S1-07.A1
gate: optional
callout:
  kind: watch-out
  title: Thêm instance hạ ρ ngay cả khi thông lượng không đổi
  vi: "Thử nâng Số instance của Checkout API từ 1 lên 2 ở giây 60: lưu lượng vẫn 480 req/s nhưng ρ giảm từ 0,96 xuống 0,48, kéo p99 rơi thẳng từ 248 ms về 36 ms."
whatChanged:
  - "~ Lưu lượng tăng tuyến tính từ 50 lên 480 req/s trong 60 giây"
  - "~ p50 tăng lên 41 ms còn p99 vọt lên 248 ms khi ρ chạm 0,96"
telemetry:
  - label: "p99 tại 265 req/s"
    value: "≈ 36 ms"
    tone: ok
  - label: "p99 tại 401 req/s"
    value: "≈ 64 ms"
    tone: warn
  - label: "p99 tại 480 req/s"
    value: "≈ 248 ms"
    tone: bad
```

Trên sân khấu mô phỏng trực tiếp `S1-07/queueing`, lưu lượng đổ vào `Checkout API` ($\mu = 500$ req/s) tăng dần từ **50 lên 480 req/s**:

- **Từ giây 0 đến giây 30** ($\lambda$: 50 → 265 req/s, $\rho$: 0,10 → 0,53): tải tăng hơn 5 lần nhưng `p99` hầu như đi ngang từ **34 ms lên 36 ms**.
- **Giây 49** ($\lambda = 401$ req/s, $\rho = 0,80$): đường cong đi vào vùng điểm gãy, `p99` nhích lên **64 ms**.
- **Giây 56** ($\lambda = 451$ req/s, $\rho = 0,90$): nút chuyển sang trạng thái bão hòa (`saturated`), `p99` nhảy lên **113 ms**.
- **Giây 60** ($\lambda = 480$ req/s, $\rho = 0,96$): chỉ tăng thêm chưa đầy 20% tải so với giây 49, nhưng `p99` đã tăng gấp gần 4 lần lên **248 ms**.

## 4. Định cỡ thực tế: luôn chừa khoảng dự phòng (Headroom) tối thiểu 20%

```step
category: TECHNIQUE
short: Chừa Headroom
scene: s4-headroom
activity: S1-07.A3
gate: required
callout:
  kind: technique
  title: Công thức số máy chủ có tính tới SLO độ trễ
  vi: "Khi chia lưu lượng đỉnh cho năng lực mỗi máy, luôn nhân năng lực máy với ngưỡng sử dụng mục tiêu ρ_max (thường 0,70 đến 0,80) thay vì lấy tròn 100%."
whatChanged:
  - "+ Xác định trần tải thực tế giữ được SLO p99 ≤ 80 ms trên máy μ = 500 req/s"
telemetry:
  - label: "Ngưỡng ρ khuyến nghị"
    value: "0,70 – 0,80"
    tone: ok
  - label: "Trần giữ p99 ≤ 80 ms"
    value: "≈ 426 req/s (ρ ≈ 0,85)"
    tone: warn
```

Từ đường cong hàng đợi, ta rút ra quy tắc thiết kế dung lượng bắt buộc trong thực tế: **trần thông lượng đạt SLO độ trễ luôn thấp hơn trần thông lượng lý thuyết $\mu$**.

Khi tính số lượng máy chủ cần cấp phát cho tải đỉnh $\lambda_{\text{peak}}$, công thức an toàn là:

$$\text{Số máy} = \left\lceil \frac{\lambda_{\text{peak}}}{\mu_{\text{mỗi máy}} \times \rho_{\text{mục tiêu}}} \right\rceil$$

Ví dụ với $\lambda_{\text{peak}} = 1.400$ req/s, mỗi máy $\mu = 500$ req/s và chọn $\rho_{\text{mục tiêu}} = 0,75$: năng lực hữu dụng mỗi máy là $500 \times 0,75 = 375$ req/s, suy ra cần $\lceil 1.400 / 375 \rceil = 4$ máy (thay vì 3 máy sẽ bị chạy ở $\rho = 0,93$ làm vọt `p99`).

## 5. Định luật Little (L = λW): tính số luồng và kết nối đang bận đồng thời

```step
category: MECHANISM
short: Luật L = λW
scene: s5-little
activity: S1-07.A2
gate: optional
callout:
  kind: key-idea
  title: Bất biến đúng cho mọi hệ thống ổn định
  vi: "Số yêu cầu đang nằm đồng thời trong hệ thống (L) luôn bằng tốc độ hoàn thành trung bình (λ) nhân thời gian lưu trú trung bình của một yêu cầu (W, tính bằng giây)."
whatChanged:
  - "+ Băng minh họa L = λ × W khi độ trễ tăng từ 50 ms lên 250 ms"
telemetry:
  - label: "Khi W = 0,05 s"
    value: "L = 20 yêu cầu"
    tone: ok
  - label: "Khi W = 0,25 s"
    value: "L = 100 yêu cầu"
    tone: warn
```

**Định luật Little (Little's Law)** liên kết ba đại lượng quan sát được của mọi thành phần ổn định mà không phụ thuộc vào dạng phân phối xác suất:

$$L = \lambda \cdot W$$

Trong đó $L$ là số lượng request trung bình đang hiện diện đồng thời bên trong thành phần (gồm cả đang chạy trên CPU và đang đứng chờ), $\lambda$ là thông lượng (`req/s`), và $W$ là thời gian phản hồi trung bình **đổi ra đơn vị giây**.

Ứng dụng thực chiến quan trọng nhất của Định luật Little là **định cỡ Connection Pool / Thread Pool** và giải thích sự cố cạn kết nối:

- Ở trạng thái bình thường: dịch vụ xử lý $\lambda = 400$ req/s, mỗi câu truy vấn Database mất $W = 0,05\text{ s}$ (`50 ms`) $\Rightarrow$ trung bình chỉ chiếm $L = 400 \times 0,05 = 20$ kết nối mở cùng lúc.
- Khi Database chậm 5 lần ($W = 0,25\text{ s}$): vẫn cùng lưu lượng $400$ req/s nhưng số kết nối bị giữ đồng thời vọt lên $L = 400 \times 0,25 = 100$ kết nối, làm cạn ngay một pool chỉ cấu hình 50 kết nối!

## 6. Khuếch đại độ trễ đuôi khi gọi song song (Parallel Fan-out)

```step
category: PROBLEM
short: Toán Fan-out
scene: s6-fanout-math
callout:
  kind: watch-out
  title: Đuôi p99 của máy con biến thành trung vị p50 của trang cha
  vi: "Khi một trang phải gom đủ kết quả từ 100 dịch vụ hoặc phân mảnh song song, xác suất gặp ít nhất một nhánh rơi vào vùng 1% chậm nhất lên tới 63,4%."
whatChanged:
  - "+ Cây xác suất dính đuôi 1 − (1 − p)^N với N = 1, 6 và 100 nhánh"
telemetry:
  - label: "Fan-out 6 nhánh"
    value: "5,9% gặp p99 con"
    tone: warn
  - label: "Fan-out 100 nhánh"
    value: "63,4% gặp p99 con"
    tone: bad
```

Trong các hệ thống tìm kiếm, bảng tin hoặc trang tổng hợp microservice, một bộ điều phối thường phát yêu cầu song song tới $N$ nút phía dưới và phải chờ nút trả lời **muộn nhất**:

$$T_{\text{tổng}} = \max(T_1, T_2, \dots, T_N)$$

Giả sử các nhánh độc lập và mỗi nhánh có xác suất $p = 1\%$ rơi vào vùng trễ đuôi `p99`. Xác suất để cả $N$ nhánh **đều nhanh** là $(1 - p)^N = 0,99^N$. Do đó xác suất request cha bị dính ít nhất một nhánh chậm là:

$$P(\text{chậm}) = 1 - (1 - p)^N$$

- Với $N = 1$ nhánh: chỉ **1,0%** lượt gọi chịu độ trễ đuôi.
- Với $N = 6$ nhánh: $1 - 0,99^6 \approx \mathbf{5,9\%}$ (tăng gần 6 lần).
- Với $N = 50$ nhánh: $1 - 0,99^{50} \approx \mathbf{39,5\%}$.
- Với $N = 100$ nhánh: $1 - 0,99^{100} \approx \mathbf{63,4\%}$ — nghĩa là quá nửa số người dùng (hơn cả `p50` của trang!) phải chịu mức trễ `p99` của từng máy con.

## 7. Mô phỏng Fan-out 6 phân mảnh: một nhánh trễ kéo tụt toàn hệ thống

```step
category: MECHANISM
short: Fan-out 6 Shard
scene: s7-fanout-live
live: fanout
callout:
  kind: key-idea
  title: Một phân mảnh gặp GC pause đủ làm chậm 100% người dùng
  vi: "Trong mô hình all-parallel, tốc độ của cả cụm không quyết định bởi trung bình 6 máy, mà bị ghìm bởi đúng máy chậm nhất ở từng thời điểm."
whatChanged:
  - "~ Aggregator gọi song song (all-parallel) xuống 6 phân mảnh ở tải 420 req/s"
  - "~ Tại t = 25 s, Shard 6 chậm +90 ms kéo p99 toàn trang từ 82 lên 375 ms"
telemetry:
  - label: "p99 riêng Shard 1..5"
    value: "≈ 49 ms"
    tone: ok
  - label: "p99 tổng (trước 25 s)"
    value: "≈ 82 ms"
    tone: warn
  - label: "p99 tổng (sau 25 s)"
    value: "≈ 375 ms"
    tone: bad
```

Quan sát mô phỏng trực tiếp `S1-07/fanout` tại lưu lượng **420 req/s**, trong đó `Aggregator` phát truy vấn song song xuống đủ `Shard 1..6` (mỗi shard bận $\rho = 0,70$):

1. **Giai đoạn bình thường (trước giây 25):** mỗi shard riêng lẻ có `p99 ≈ 49 ms`. Tuy nhiên chỉ riêng phép lấy $\max(T_1 \dots T_6)$ cộng 11 ms mạng và điều phối đã đẩy `p99` đầu-cuối của `Aggregator` lên **82 ms**.
2. **Khi xuất hiện một nhánh trễ (từ giây 25):** `Shard 6` bị chậm thêm **+90 ms** (mô phỏng chu kỳ thu gom rác bộ nhớ hoặc nén đĩa nền), làm `p99` cục bộ của riêng `Shard 6` lên 360 ms. Dù 5 phân mảnh `Shard 1..5` vẫn phản hồi nhanh ở 49 ms, **100% truy vấn tại Aggregator** đều phải đứng đợi `Shard 6`, kéo trung vị `p50` toàn trang nhảy từ 41 ms lên **95 ms** và `p99` vọt lên **375 ms**.

## 8. Bốn kỹ thuật kiểm soát độ trễ đuôi cho kiến trúc phân tán

```step
category: TECHNIQUE
short: Giảm đuôi trễ
scene: s8-mitigate
sim: S1-07/fanout
callout:
  kind: technique
  title: Hedged Requests — đổi 5% tải phụ lấy đuôi p99 mượt
  vi: "Nếu sau ngưỡng p95 (ví dụ 35 ms) một nhánh vẫn chưa trả lời, gửi ngay bản sao truy vấn thứ hai sang replica khác và lấy kết quả nào về trước."
whatChanged:
  - "+ Tổng hợp 4 biện pháp cắt đuôi chậm ở cả cấp phân mảnh lẫn bộ điều phối"
telemetry:
  - label: "ρ của Shard khỏe"
    value: "{s1.rho@30:2}"
    tone: ok
  - label: "p99 khi dính Shard 6"
    value: "{metrics.p99@30:0} ms"
    tone: bad
```

Để ngăn hiệu ứng khuếch đại đuôi phá hỏng trải nghiệm ở quy mô lớn, các hệ thống tìm kiếm và lưu trữ phân tán kết hợp bốn biện pháp:

1. **Hạn chế Scatter-Gather:** thiết kế khóa phân mảnh (Shard Key) sao cho đa số truy vấn chỉ cần gõ đúng 1 phân mảnh thay vì phát tán ra toàn bộ $N$ máy.
2. **Ngân sách Timeout ngắn kèm kết quả một phần:** với trang tìm kiếm hoặc gợi ý, đặt hạn chót nghiêm ngặt (ví dụ 80 ms) tại `Aggregator`; nếu `Shard 6` chưa kịp trả lời thì trả ngay kết quả gộp từ 5 phân mảnh đã xong thay vì bắt người dùng chờ 375 ms.
3. **Hedged Requests (Yêu cầu phòng hộ):** khi một lời gọi vượt mốc `p95` mà chưa phản hồi, gửi thêm một yêu cầu y hệt tới bản sao (Replica) thứ hai của phân mảnh đó; chỉ tăng khoảng 5% tải nhưng cắt bỏ gần như toàn bộ các gai GC pause đơn lẻ.
4. **Giữ đồng đều mức bận $\rho$ giữa các máy con:** dùng cân bằng tải `least-connections` và tránh khóa nóng (Hot Key) để không một phân mảnh nào trượt vượt mốc $\rho > 0,80$.

## 9. Tóm tắt: ba quy luật định lượng hàng đợi và độ trễ đuôi

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Ba công thức kiểm tra nhanh trước khi chốt thiết kế
  vi: "Dùng W = S/(1−ρ) để chừa headroom, dùng L = λW để tính kích thước pool kết nối, và dùng 1 − (1−p)^N để cảnh giác với mọi lệnh gọi fan-out song song."
whatChanged:
  - "+ Hệ thống hóa 3 công thức tính nhẩm công suất, độ đồng thời và độ trễ đuôi"
telemetry:
  - label: "Headroom an toàn"
    value: "Chừa ≥ 20% (ρ ≤ 0,80)"
    tone: ok
  - label: "Công thức Pool"
    value: "L = λ × W"
```

Ba quy luật toán học trong bài giải thích hầu hết các hiện tượng tăng vọt độ trễ trong hệ thống thực tế:

1. **Đường cong hàng đợi $W = \frac{S}{1 - \rho}$:** thời gian chờ tăng phi tuyến và dựng đứng khi $\rho > 0,80$. Luôn định cỡ cụm máy để vận hành dưới 75–80% công suất ở đỉnh tải.
2. **Định luật Little $L = \lambda \cdot W$:** số luồng/kết nối bị chiếm giữ tỉ lệ thuận với cả lưu lượng lẫn thời gian phản hồi. Khi phụ thuộc phía dưới chậm gấp 5 lần, nhu cầu kết nối đồng thời cũng phình gấp 5 lần.
3. **Khuếch đại đuôi $1 - (1 - p)^N$:** càng gọi song song nhiều dịch vụ hoặc phân mảnh trên cùng một request, đuôi `p99` của từng nút lẻ càng trở thành độ trễ thường ngày của người dùng cuối.
