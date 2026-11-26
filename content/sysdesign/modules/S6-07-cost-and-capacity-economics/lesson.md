## 1. Chi phí theo giờ và Cost per Million Requests

```step
category: SETUP
short: Chi phí / 1M
scene: s1-economics
callout:
  kind: key-idea
  title: Chi phí là một chỉ số thiết kế ngang hàng với p99
  vi: "Một kiến trúc đạt p99 = 30 ms nhưng tốn gấp 4 lần ngân sách cho phép không phải là thiết kế tốt. Cần đo cả chi phí theo giờ ($/giờ) lẫn chi phí trên mỗi triệu request."
whatChanged:
  - "+ Công thức quy đổi Cost per Million Requests từ $/giờ và thông lượng thực tế"
  - "~ So sánh hiệu quả chi phí giữa giờ cao điểm và giờ thấp điểm ban đêm"
telemetry:
  - label: "Đơn vị chuẩn"
    value: "USD / 1M requests"
  - label: "Mục tiêu"
    value: "Đạt SLO với chi phí thấp nhất"
```

Khi đánh giá một kiến trúc, ngoài độ trễ p99 và tỉ lệ lỗi, kiến trúc sư cần theo dõi hai chỉ số tài chính:

1. **Chi phí theo giờ (`$/giờ`):** Tổng chi phí thuê máy chủ ứng dụng, bộ nhớ đệm, cơ sở dữ liệu và cân bằng tải trong một giờ.
2. **Chi phí trên mỗi triệu request (`Cost per 1M requests`):** Đo hiệu suất kinh tế thực tế của hệ thống ở một mức tải $\lambda$ (req/s):

$$\text{Cost per 1M req} = \frac{\text{USD/giờ}}{\lambda \times 3.600} \times 10^6$$

Ví dụ, một cụm có giá 1,80 USD/giờ xử lý 2.000 req/s (7,2 triệu request/giờ) sẽ tốn `1,80 / 7,2 = 0,25 USD` cho mỗi triệu request. Nhưng nếu ban đêm tải tụt xuống 400 req/s mà cụm vẫn giữ nguyên cấu hình tĩnh, chi phí trên mỗi triệu request nhảy vọt gấp 5 lần lên `1,25 USD`.

## 2. Quy luật hiệu suất giảm dần khi đẩy Headroom quá cao

```step
category: MECHANISM
short: Giảm dần
scene: s2-diminishing
callout:
  kind: compare
  title: Đường cong chi phí và lợi ích p99
  vi: "Hạ mức sử dụng ρ từ 0,95 xuống 0,70 giúp p99 giảm mạnh hàng trăm mili-giây. Nhưng hạ tiếp ρ từ 0,40 xuống 0,20 tốn gấp đôi tiền mà p99 chỉ giảm thêm vài mili-giây."
whatChanged:
  - "+ So sánh mức cải thiện p99 trên mỗi USD bỏ thêm ở các ngưỡng ρ khác nhau"
  - "~ Xác định vùng tối ưu vận hành: ρ mục tiêu quanh 0,65–0,75 ở tải đỉnh"
telemetry:
  - label: "Vùng ρ tối ưu"
    value: "0,65 – 0,75 (đỉnh)"
    tone: ok
  - label: "Vùng lãng phí"
    value: "ρ < 0,30 (dư tải quá mức)"
    tone: warn
```

Theo lý thuyết hàng đợi, độ trễ chỉ tăng dựng đứng khi mức sử dụng $\rho = \lambda / \mu$ tiến sát 1,0. Điều này tạo ra **quy luật hiệu suất giảm dần (Diminishing Returns)** khi mua thêm công suất dự phòng (Headroom):

- **Từ $\rho = 0,95$ xuống $0,70$:** Thời gian chờ trong hàng đợi biến mất gần hết, p99 giảm mạnh. Đây là khoản đầu tư mang lại giá trị cao nhất.
- **Từ $\rho = 0,70$ xuống $0,30$:** Hàng đợi vốn đã gần bằng 0, nên việc nhân đôi số máy chủ tốn thêm 100% chi phí nhưng chỉ giúp p99 giảm thêm vài mili-giây do thời gian xử lý cơ bản không đổi.

Do đó, mục tiêu kinh tế là giữ $\rho$ ở mức an toàn (quanh 0,65–0,75 tại đỉnh tải) thay vì cấp dư tài nguyên xuống dưới 0,30.

## 3. Dư tải cố định so với Autoscaling theo chu kỳ ngày đêm

```step
category: PROBLEM
short: Chu kỳ ngày đêm
scene: s3-diurnal-live
live: diurnal
activity: S6-07.A1
gate: optional
callout:
  kind: watch-out
  title: Bẫy cấp dư cố định (Over-provisioning)
  vi: "Giữ 6 máy chủ chạy cả ngày lẫn đêm chỉ để phục vụ 2 giờ cao điểm khiến 60% ngân sách bị lãng phí vào ban đêm khi tải giảm còn 1/5."
whatChanged:
  - "~ Chạy tải chu kỳ ngày đêm: 600 req/s ban đêm lên 3.600 req/s ban ngày"
  - "~ Quan sát thời điểm cấu hình nhỏ chạm trần thông lượng bền vững"
telemetry:
  - label: "Đáy ban đêm"
    value: "600 req/s"
  - label: "Đỉnh ban ngày"
    value: "3.600 req/s (gấp 6×)"
    tone: warn
```

Lưu lượng người dùng thực tế hiếm khi đi ngang mà dao động theo **chu kỳ ngày đêm (Diurnal)**: thấp điểm lúc nửa đêm và đạt đỉnh vào ban ngày.

- **Mô hình dư tải cố định (Over-provisioned Static Pool):** Cấp sẵn đủ máy cho đỉnh 3.600 req/s suốt 24 giờ. Mô hình này đơn giản nhưng gây lãng phí lớn trong hơn nửa ngày.
- **Mô hình căn chỉnh sát nhu cầu (Right-sized + Autoscaling):** Kết hợp lớp Cache đủ rộng để chặn tải đọc xuống Database, giữ nền tối thiểu cho giờ thấp điểm và tự động tăng giảm số instance App theo tải thực tế.

Trong mô phỏng trực tiếp, hãy thử dùng bài tập `tune-to-limit` để tìm giới hạn tải tối đa của cấu hình khởi điểm trước khi tối ưu.

## 4. Thử thách tối ưu: Đạt SLO trong trần ngân sách chặt chẽ

```step
category: TECHNIQUE
short: Tối ưu chi phí
scene: s4-rightsizing
activity: S6-07.A2
gate: required
callout:
  kind: technique
  title: Giảm tải vào thành phần đắt tiền trước
  vi: "Scale-up Database luôn đắt hơn nhiều so với mở rộng Cache hoặc thêm instance App không trạng thái. Hãy giải phóng Database bằng Cache trước khi tăng cỡ máy."
whatChanged:
  - "+ So sánh chi phí: Mở rộng Cache + thêm App vừa đủ vs Scale-up DB ×3"
  - "~ Giữ p99 ≤ 130 ms và lỗi ≤ 1% suốt chu kỳ 80 s với trần ≤ 1,85 USD/giờ"
telemetry:
  - label: "Ngân sách trần"
    value: "≤ 1,85 USD/giờ"
    tone: warn
  - label: "SLO p99"
    value: "≤ 130 ms"
    tone: ok
```

Khi đối mặt với ràng buộc kép vừa phải đạt SLO ở đỉnh 3.600 req/s, vừa không vượt trần chi phí `1,85 USD/giờ`, thứ tự ưu tiên đúng là:

1. **Mở rộng Cache phủ đủ tập dữ liệu nóng:** Giảm tỉ lệ request rơi xuống Primary DB mà không tốn chi phí tăng cỡ DB.
2. **Căn chỉnh đúng số instance App (Right-sizing):** Tính chính xác số máy cần thiết để $\rho$ tầng App ở đỉnh nằm trong vùng 0,7–0,8, tránh thêm dư thừa gây đội chi phí giờ.

## 5. Cạm bẫy kinh tế: Cấp dư tĩnh và Scale-up Database quá sớm

```step
category: PITFALL
short: Bẫy ngân sách
scene: s4-rightsizing
callout:
  kind: watch-out
  title: Tăng cỡ Database trước khi tối ưu Cache là lựa chọn đắt đỏ nhất
  vi: "Nâng cấp Primary DB lên gấp 3 lần tiêu tốn ngân sách rất nhanh nhưng vẫn không cứu được hệ thống nếu tầng App thiếu instance hoặc Cache Hit Ratio quá thấp."
whatChanged:
  - "! Nâng cỡ DB ×3 khi chưa mở rộng Cache làm vượt trần ngân sách 1,85 USD/giờ"
  - "! Giữ cố định 6–8 instance App suốt đêm khiến Cost per 1M requests tăng vọt"
telemetry:
  - label: "Bẫy chi phí"
    value: "Scale-up DB quá sớm"
    tone: bad
  - label: "Ưu tiên đúng"
    value: "Cache → App → DB"
    tone: ok
```

Trong tối ưu chi phí, kiến trúc sư thường mắc hai sai lầm:

- **Đổ tiền vào Database khi chưa sửa Cache:** Nâng cấp phần cứng cơ sở dữ liệu theo chiều dọc (`sizeFactor`) tăng chi phí theo cấp số nhân, trong khi mở rộng RAM của Redis Cache để chặn lượt đọc lặp lại rẻ hơn nhiều.
- **Tối ưu theo tải đỉnh mà quên tải nền ban đêm:** Một cấu hình chạy êm ở 3.600 req/s nhưng không tự thu gọn vào ban đêm sẽ đẩy chi phí trên mỗi triệu request tăng gấp 5–6 lần trong phần lớn thời gian trong ngày.

## 6. Tổng kết: Nguyên tắc vàng về kinh tế công suất

```step
category: RECAP
short: Tóm tắt chi phí
scene: s5-recap
callout:
  kind: key-idea
  title: Đầu tư đúng tầng, đúng thời điểm
  vi: "Tối ưu kinh tế hệ thống không phải là cắt giảm tài nguyên bằng mọi giá, mà là loại bỏ lãng phí ở thành phần đắt tiền và giữ headroom vừa đủ để đạt SLO."
whatChanged:
  - "+ Tổng kết 3 đòn bẩy kinh tế: Cache Hit Ratio, Right-sizing và Autoscaling"
telemetry:
  - label: "Đòn bẩy 1"
    value: "Cache giảm tải DB"
  - label: "Đòn bẩy 2"
    value: "Right-sizing (ρ ≈ 0,7)"
```

Ba nguyên tắc cần nhớ về kinh tế học chi phí và công suất:

- **Đo theo Cost per 1M requests:** Giúp nhìn rõ hiệu suất sử dụng hạ tầng giữa giờ cao điểm và thấp điểm.
- **Tôn trọng quy luật hiệu suất giảm dần:** Không mua thêm phần cứng để đẩy $\rho$ xuống quá thấp khi p99 đã đạt SLO.
- **Ưu tiên Cache và Right-sizing trước Scale-up DB:** Tận dụng bộ nhớ đệm và mở rộng ngang vừa đủ để bảo vệ ngân sách.
