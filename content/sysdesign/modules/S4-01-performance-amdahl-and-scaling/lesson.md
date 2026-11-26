## 1. Ba chiều hiệu năng và sự đánh đổi giữa Latency với Throughput

```step
category: SETUP
short: Ba chiều tải
scene: s1-dimensions
callout:
  kind: key-idea
  title: Mở rộng là gỡ đúng chiều tài nguyên đang giới hạn
  vi: "Mọi điểm nghẽn đều thuộc ít nhất một trong ba chiều Compute, Storage hoặc Network. Áp dụng kỹ thuật của chiều này cho điểm nghẽn ở chiều khác chỉ làm tăng chi phí."
whatChanged:
  - "+ Xác lập mô hình 4 tầng: Người dùng → Load Balancer → App Tier → Cache → Primary DB"
  - "+ Gắn 3 chiều tài nguyên: Compute (App), Storage I/O (DB) và Network (RTT/Băng thông)"
telemetry:
  - label: "Ba chiều mở rộng"
    value: "Compute · Storage · Network"
  - label: "SLO mục tiêu"
    value: "p99 ≤ 120 ms · lỗi ≤ 1%"
    tone: ok
```

Hiệu năng của một hệ thống phân tán chịu sự chi phối của ba chiều vật lý độc lập:

- **Compute (Tính toán):** năng lực CPU và RAM xử lý logic nghiệp vụ, mã hoá, nén hoặc suy luận mô hình tại tầng ứng dụng.
- **Storage (Lưu trữ):** thông lượng đọc/ghi đĩa (`IOPS`), băng thông tuần tự và dung lượng dữ liệu tại tầng cơ sở dữ liệu.
- **Network (Mạng):** độ trễ truyền dẫn theo khoảng cách địa lý (`RTT`) và băng thông đường truyền giữa các dịch vụ.

Khi đo lường, cần tách bạch **Throughput** (số request hoàn tất mỗi giây) và **Latency** (thời gian hoàn tất một request). Gom lô (*Batching*) hoặc tăng mức xử lý đồng thời có thể đẩy Throughput lên cao nhưng làm từng request đợi lâu hơn; ngược lại, giữ hàng đợi cực ngắn ưu tiên Latency thấp nhưng cần nhiều tài nguyên dự phòng hơn.

## 2. Mở rộng dọc (Scale-up): đơn giản nhưng đụng trần phần cứng và SPOF

```step
category: MECHANISM
short: Scale-up trần
scene: s2-scale-up
callout:
  kind: watch-out
  title: Hai giới hạn cứng của một máy chủ lớn
  vi: "Scale-up gặp trần vật lý của bo mạch lớn nhất, giá thuê tăng nhanh hơn công suất, và toàn bộ dịch vụ vẫn phụ thuộc vào một điểm lỗi đơn duy nhất."
whatChanged:
  - "~ Tăng cỡ máy App lên tối đa sizeFactor = 4 (năng lực 3.600 req/s)"
  - "~ Đỉnh tải 4.200 req/s vượt trần máy lớn nhất làm ρ = 1,17 và tràn hàng đợi"
telemetry:
  - label: "Trần năng lực 1 máy"
    value: "3.600 req/s"
    tone: warn
  - label: "Đỉnh tải ban ngày"
    value: "4.200 req/s (ρ = 1,17)"
    tone: bad
  - label: "Chi phí cỡ máy ×4"
    value: "×5,28 giá cơ sở"
    tone: warn
```

**Mở rộng dọc (Vertical Scaling / Scale-up)** là nâng cấp tài nguyên cho chính máy chủ hiện tại (nhiều lõi vCPU hơn, thêm RAM, đổi sang ổ NVMe nhanh hơn).

Ưu điểm lớn nhất của Scale-up là **không đòi hỏi thay đổi kiến trúc phần mềm**: ứng dụng nguyên khối không cần bộ cân bằng tải, không lo đồng bộ phiên làm việc hay phân mảnh dữ liệu. Vì lý do đó, Scale-up thường là lựa chọn thực dụng đầu tiên cho cơ sở dữ liệu quan hệ.

Tuy nhiên, Scale-up sớm đụng ba rào cản:
1. **Trần phần cứng:** không thể mua một máy có số lõi CPU hay băng thông bộ nhớ vô hạn.
2. **Chi phí phi tuyến:** máy chủ cấu hình cực lớn thường đắt hơn đáng kể trên mỗi đơn vị công suất (trong mô phỏng, chi phí tăng theo luỹ thừa $\text{sizeFactor}^{1,2}$).
3. **Điểm lỗi đơn (SPOF):** khởi động lại để nâng cấp hoặc hỏng phần cứng làm gián đoạn 100% lưu lượng.

## 3. Mở rộng ngang (Scale-out) và bài toán chu kỳ tải ngày đêm

```step
category: TECHNIQUE
short: Scale-out ngang
scene: s3-live-diurnal
live: diurnal
callout:
  kind: compare
  title: Scale-out vượt trần phần cứng và chịu lỗi từng máy
  vi: "Thay vì mua một máy cực đắt vẫn hụt hơi ở đỉnh 4.200 req/s, ghép 6 máy cỡ chuẩn cho tổng công suất 5.400 req/s với chi phí thấp hơn và không còn SPOF."
whatChanged:
  - "~ Mô phỏng tải chu kỳ ngày đêm (Diurnal): đáy 600 req/s → đỉnh 4.200 req/s"
  - "~ So sánh trực tiếp núm sizeFactor = 4 (vỡ SLO) với replicas = 6 (đạt SLO)"
```

**Mở rộng ngang (Horizontal Scaling / Scale-out)** kết hợp nhiều máy chủ cỡ vừa đứng sau Load Balancer để chia sẻ lưu lượng. Điều kiện tiên quyết là tầng ứng dụng phải **phi trạng thái (Stateless)** để request bất kỳ rơi vào máy nào cũng xử lý đúng.

Trong mô phỏng chu kỳ ngày đêm (`600 → 4.200 → 600 req/s`), hãy thử hai phương án bằng núm chỉnh trên sân khấu:
- Nâng `sizeFactor = 4` (tối đa của Scale-up): năng lực chỉ đạt `3.600 req/s`, nên từ giây 28 đến giây 52 máy quá tải và vi phạm SLO, dù chi phí tầng App tăng gấp `5,28 lần`.
- Giữ `sizeFactor = 1` và nâng `replicas = 6`: tổng năng lực đạt `5.400 req/s` ($\rho_{\text{đỉnh}} \approx 0,78$), `p99` giữ dưới `90 ms` suốt cả chu kỳ và chi phí chỉ gấp `6 × 0,12 = 0,72 USD/giờ`.

Dù vậy, giữ cố định 6 máy suốt ban đêm (khi tải chỉ `600 req/s`, $\rho \approx 0,11$) làm lãng phí hơn hai phần ba tài nguyên. Đó là lý do cần **Autoscaling**.

## 4. Autoscaling và cái bẫy độ trễ khởi động nguội (Cold-Start Lag)

```step
category: PITFALL
short: Trễ Cold Start
scene: s4-live-cold
live: cold-start
callout:
  kind: watch-out
  title: Autoscaling phản ứng theo chỉ số quá khứ, không phải tức thì
  vi: "Khi lưu lượng tăng dựng đứng trong vài giây, các máy mới mất hàng chục giây đến vài phút để cấp phát, tải ảnh container và làm nóng JIT trước khi gánh được tải."
whatChanged:
  - "+ Đợt Flash Sale ở t = 8 s đẩy tải từ 1.000 vọt lên 3.100 req/s trong 2 giây"
  - "+ Nhóm 3 máy mới kích hoạt lúc t = 10 s nhưng mất ~25 s khởi động và làm nóng"
```

**Autoscaling** tự động thêm hoặc bớt số instance theo chỉ số (CPU, mức sử dụng $\rho$, độ dài hàng đợi), bám sát đường cong ngày đêm để tiết kiệm chi phí giờ thấp điểm.

Tuy nhiên, trong kịch bản **Flash Sale** trên sân khấu, lưu lượng nhảy vọt từ `1.000` lên `3.100 req/s` ở **t = 8 s** trong khi đang chạy `2 instance` (`1.800 req/s`):
- **t = 8..10 s:** độ trễ lấy mẫu metric và ra quyết định mở rộng.
- **t = 10..15 s:** `3 instance` mới đang khởi tạo tiến trình (`WARMING`, công suất bằng `0`), khiến 2 máy cũ quá tải nặng, tỷ lệ lỗi vọt lên trên `40%`.
- **t = 15..35 s:** máy mới bắt đầu nhận kết nối nhưng trình biên dịch JIT và Connection Pool còn nguội nên năng lực tăng dần từ `30%` lên `100%`; tới khoảng giây 26 lỗi mới về `0%`.

Với sự kiện biết trước giờ mở bán, không được chờ Autoscaling tự phản ứng mà phải **chủ động mở rộng trước (Pre-warming / Scheduled Scaling)** — hãy thử tăng núm `Pre-warmed instances` lên `4` để kiểm chứng.

## 5. Định luật Amdahl: phần tuần tự chặn đứng lợi ích mở rộng ngang

```step
category: MECHANISM
short: Định luật Amdahl
scene: s5-amdahl-law
callout:
  kind: key-idea
  title: Công thức Định luật Amdahl
  vi: "Hệ số tăng tốc tối đa của toàn hệ thống không bao giờ vượt quá nghịch đảo của tỷ trọng công việc tuần tự: S_max = 1 / (1 − p)."
whatChanged:
  - "+ Tách công việc thành phần song song hoá được (p) và phần tuần tự (1 − p)"
telemetry:
  - label: "Khi 1 − p = 20%, N = 4"
    value: "S(4) = 2,5×"
  - label: "Khi 1 − p = 20%, N → ∞"
    value: "S_max = 5,0×"
    tone: warn
```

Vì sao nhiều hệ thống nhân bản hàng chục máy chủ ứng dụng mà thông lượng toàn cục vẫn dậm chân tại chỗ? **Định luật Amdahl** định lượng chính xác giới hạn này. Gọi $p$ ($0 \le p \le 1$) là tỷ trọng công việc có thể chia song song cho $N$ máy, còn $1 - p$ là phần bắt buộc thực hiện tuần tự hoặc đi qua một tài nguyên dùng chung duy nhất:

$$S(N) = \frac{1}{(1 - p) + \frac{p}{N}}$$

Xét một tác vụ có $p = 80\%$ song song và $1 - p = 20\%$ tuần tự (ví dụ giữ khóa dòng dữ liệu nóng, ghi vào một Primary DB duy nhất, hoặc tổng hợp kết quả cuối):
- Với $N = 4$: $S(4) = \frac{1}{0,20 + 0,80/4} = 2,5\times$ (dù tốn gấp 4 lần máy).
- Khi $N \to \infty$: số hạng $p / N \to 0$, nên $S_{\max} = \frac{1}{1 - p} = \frac{1}{0,20} = 5\times$.

Trong kiến trúc phân tán, mọi thành phần không mở rộng đồng thời theo $N$ (như Primary DB chưa tách tải) đều đóng vai trò nút cổ chai tuần tự.

## 6. Đo trần thông lượng thực tế khi tầng dữ liệu làm nút cổ chai tuần tự

```step
category: PROBLEM
short: Trần nối tiếp
scene: s6-amdahl-limit
sim: S4-01/amdahl
activity: S4-01.A1
gate: optional
callout:
  kind: good-to-know
  title: Đọc tỷ lệ lưu lượng xuyên qua Cache
  vi: "Khi Cache chỉ chứa một phần tập khóa nóng, phần lớn lượt đọc bị trượt Cache cộng với 100% lượt ghi sẽ hội tụ thành cổ chai tuần tự tại Primary DB."
whatChanged:
  - "~ App Tier có 4 instance (3.600 req/s), nhưng Cache chỉ giữ 20.000 / 80.000 key"
  - "~ Hit Ratio đạt ~42% khiến ~64% tổng lưu lượng dồn thẳng vào Primary DB"
telemetry:
  - label: "Cache Hit Ratio"
    value: "{cache.hitRatio@10:0%}"
    tone: warn
  - label: "Tỷ lệ xuống DB"
    value: "{db.share@10:0%}"
    tone: bad
  - label: "ρ của DB ở t = 30 s"
    value: "{db.rho@30:2}"
    tone: bad
```

Xét kịch bản `S4-01/amdahl`: đội vận hành đã mở rộng tầng `App Tier` lên `4 instance` (tổng năng lực `3.600 req/s`), nhưng `Redis Cache` chỉ được cấp `20.000 key` trên tập dữ liệu đang hoạt động `80.000 key`.

Hệ quả định lượng:
- Tỷ lệ đọc trúng Cache chỉ đạt khoảng `42,5%`.
- Với `85%` lượt đọc và `15%` lượt ghi, tỷ lệ request đi xuống `Primary DB` là $0,85 \times (1 - 0,425) + 0,15 \approx 63,9\%$.
- Vì `Primary DB` chỉ xử lý tối đa `1.400 req/s`, trần lưu lượng bền vững của toàn hệ thống bị khóa quanh mức $1.400 / 0,639 \approx 2.190 \text{ req/s}$ (thấp hơn rất xa con số `3.600 req/s` của tầng App).

Hãy thực hiện bài tập bên dưới để đo chính xác ngưỡng tải bắt đầu vi phạm SLO.

## 7. Quan sát tải tăng dần: tầng tuần tự quá tải trước tầng song song

```step
category: PROBLEM
short: Đoán nút nghẽn
scene: s7-live-amdahl
live: amdahl
activity: S4-01.A2
gate: optional
callout:
  kind: watch-out
  title: Sai lầm thêm máy theo cảm tính
  vi: "Nhìn đồ thị lỗi tổng tăng vọt rồi lập tức nhân đôi số pod ứng dụng mà không kiểm tra ρ của Database là nguyên nhân gây lãng phí hạ tầng phổ biến nhất."
whatChanged:
  - "~ Tải tăng đều từ 400 lên 4.800 req/s trong 60 giây"
  - "~ Tạm dừng ở t = 15 s để dự đoán thành phần chạm ngưỡng Quá tải trước"
```

Trên sân khấu trực tiếp, lưu lượng tăng tuyến tính từ `400` lên `4.800 req/s`. Ở giây thứ 15 (`λ ≈ 1.500 req/s`), cả hệ thống vẫn phản hồi nhanh vì mọi thành phần đều còn dưới ngưỡng bão hoà.

Khi cho mô phỏng chạy tiếp qua mốc `2.200 req/s`, hãy đối chiếu hai chỉ số:
- `Primary DB` vượt $\rho = 1,00$ từ khoảng giây 24 và rơi vào trạng thái **Quá tải** ở giây `27,4`, kéo `p99` toàn cục vọt qua `500 ms`.
- Cùng thời điểm đó, mỗi máy trong cụm `4 instance App` mới sử dụng khoảng `62%` năng lực. Nếu bạn kéo núm `replicas` của `App Tier` lên `9` máy mà giữ nguyên Cache và DB, đường cong `p99` và tỷ lệ lỗi hầu như không dịch chuyển.

## 8. Chiến lược mở rộng lai (Hybrid Scaling): thu hẹp tuần tự rồi mở rộng ngang

```step
category: TECHNIQUE
short: Thu hẹp tuần tự
scene: s8-fix-amdahl
activity: S4-01.A3
gate: required
callout:
  kind: technique
  title: Quy tắc hai bước phá trần Amdahl
  vi: "Trước tiên giảm tỷ lệ request chạm vào điểm tuần tự (tăng Cache Hit Ratio, tối ưu Index), sau đó kết hợp Scale-up cho tầng dữ liệu và Scale-out cho tầng tính toán."
whatChanged:
  - "~ Nâng Cache lên 80.000 key (Hit Ratio 85%), hạ lưu lượng xuống DB còn ~28%"
  - "~ Scale-up Primary DB ×2 (2.800 req/s) và Scale-out App ×7 (6.300 req/s)"
telemetry:
  - label: "Tỷ lệ xuống DB sau sửa"
    value: "≈ 27,8%"
    tone: ok
  - label: "Năng lực DB / App mới"
    value: "2.800 / 6.300 req/s"
    tone: ok
  - label: "Tổng chi phí"
    value: "≈ 2,61 USD/giờ"
    tone: ok
```

Hầu hết hệ thống quy mô lớn không chọn cực đoan một kiểu mở rộng mà phối hợp **Hybrid Scaling** theo đúng vai trò từng tầng:

1. **Thu hẹp phần tuần tự ($1 - p$) bằng bộ nhớ đệm và chỉ mục:** nâng `capacityKeys` của `Redis Cache` từ `20.000` lên đủ `80.000 key` đưa Hit Ratio lên `85%`, cắt tỷ lệ truy vấn xuống `Primary DB` từ `63,9%` xuống còn $0,85 \times 0,15 + 0,15 = 27,75\%$. Ở đỉnh `4.800 req/s`, DB chỉ còn nhận khoảng `1.332 req/s`.
2. **Scale-up có kiểm soát cho tầng giữ trạng thái:** tăng `sizeFactor = 2` cho `Primary DB` nâng năng lực lên `2.800 req/s`, đưa $\rho_{\text{DB}}$ về mức an toàn `0,48` mà chưa chạm trần phần cứng hay chi phí quá đắt.
3. **Scale-out tuyến tính cho tầng phi trạng thái:** khi DB không còn nghẽn, điểm giới hạn kế tiếp chuyển sang `App Tier` (`3.600 < 4.800 req/s`). Nâng `replicas` lên `7 instance` (`6.300 req/s`, $\rho \approx 0,76$) giúp vượt trọn đỉnh tải trong ngân sách.

## 9. Bốn bài Kiểm thử tải (Load Testing) để lộ điểm nghẽn sớm

```step
category: TECHNIQUE
short: Kiểm thử tải
scene: s9-load-tests
callout:
  kind: good-to-know
  title: Đừng đợi người dùng thật làm bài kiểm thử Stress Test
  vi: "Mỗi hình dạng đường cong tải trong phòng thử nghiệm được thiết kế để bộc lộ một nhóm lỗi hoàn toàn khác nhau trước khi phát hành."
whatChanged:
  - "+ Đối chiếu 4 mẫu kiểm thử tải: Baseline, Stress, Spike và Soak Test"
telemetry:
  - label: "Công cụ phổ biến"
    value: "k6 · Locust · Gatling"
  - label: "Số mẫu kiểm thử chuẩn"
    value: "4 mẫu"
    tone: ok
```

Thay vì chờ sự cố ngoài môi trường sản xuất, quy trình kỹ thuật chuẩn chủ động mô phỏng lưu lượng bằng bốn dạng kiểm thử tải bổ trợ nhau:

- **Baseline Test:** chạy mức lưu lượng trung bình hằng ngày để ghi nhận độ trễ nền (`p50`, `p95`, `p99`) làm mốc so sánh khách quan sau mỗi lần sửa mã.
- **Stress Test (Ramp):** tăng tải bậc thang vượt công suất thiết kế nhằm xác định chính xác thành phần nào chạm $\rho = 1$ đầu tiên và hệ thống suy giảm êm hay sập dây chuyền.
- **Spike Test:** dồn tải gấp nhiều lần trong vài giây để kiểm chứng độ trễ Cold Start của Autoscaling, giới hạn hàng đợi và tốc độ tự phục hồi sau đỉnh.
- **Soak Test (Endurance):** duy trì tải khá cao liên tục nhiều giờ để phát hiện rò rỉ bộ nhớ (Memory Leak), cạn kiệt Connection Pool hoặc hiện tượng phân mảnh/đầy ổ đĩa ghi nhật ký.

## 10. Tóm tắt: quy trình tư duy hiệu năng và mở rộng hệ thống

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Ba câu hỏi trước mọi quyết định thêm tài nguyên
  vi: "Điểm nghẽn nằm ở chiều nào? Phần tuần tự (1 − p) chiếm bao nhiêu? Tải tăng từ từ theo chu kỳ hay dựng đứng tức thì?"
whatChanged:
  - "+ Hệ thống hoá chiến lược chọn Scale-up, Scale-out, Autoscaling và tối ưu Amdahl"
telemetry:
  - label: "Công thức Amdahl"
    value: "S(N) = 1 / ((1−p) + p/N)"
  - label: "Chiến lược thực tế"
    value: "Hybrid + Pre-warming"
    tone: ok
```

Năm nguyên tắc cốt lõi cần ghi nhớ:

1. **Định vị đúng chiều nghẽn:** phân biệt nghẽn Compute (CPU ứng dụng), Storage (`IOPS`/quét bảng ở DB) và Network (`RTT`/băng thông) bằng số đo thực tế trước khi chọn công cụ.
2. **Kết hợp Scale-up và Scale-out:** dùng Scale-out cho tầng ứng dụng phi trạng thái để vượt trần phần cứng và loại bỏ SPOF; dùng Scale-up vừa phải kết hợp Cache/Replica cho tầng dữ liệu giữ trạng thái.
3. **Tôn trọng Định luật Amdahl:** nhân bản tầng song song vô tác dụng nếu không thu hẹp tỷ trọng công việc tuần tự ($1 - p$) đổ dồn về một nút chung.
4. **Tính đến độ trễ Cold Start:** Autoscaling tối ưu chi phí theo chu kỳ ngày đêm, nhưng các đợt tăng vọt biết trước bắt buộc phải Pre-warm máy chủ và bộ nhớ đệm sẵn.
5. **Lặp lại vòng đo lường:** sau khi gỡ xong một điểm nghẽn, điểm nghẽn luôn dịch chuyển sang thành phần kế tiếp — hãy kiểm chứng lại bằng Stress, Spike và Soak Test.
