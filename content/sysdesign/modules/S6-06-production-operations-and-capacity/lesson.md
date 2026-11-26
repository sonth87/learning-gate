## 1. Tư duy làm chủ hệ thống trên môi trường Production

```step
category: SETUP
short: Vận hành thật
scene: s1-incident
callout:
  kind: key-idea
  title: Mọi hệ thống đều sẽ gặp sự cố
  vi: "Câu hỏi không phải liệu hệ thống có lỗi hay không, mà là khi lỗi xảy ra lúc 3 giờ sáng, ta phát hiện nhanh cỡ nào, giảm thiểu ra sao và học được gì."
whatChanged:
  - "+ Quy trình ứng phó 5 pha: Phát hiện → Đánh giá → Giảm thiểu → Thông báo → RCA"
  - "~ Tách biệt hành động khôi phục nhanh (Rollback) khỏi việc tìm nguyên nhân gốc"
telemetry:
  - label: "Ưu tiên số 1"
    value: "Khôi phục dịch vụ"
    tone: ok
  - label: "Văn hóa RCA"
    value: "Không đổ lỗi cá nhân"
```

Khi vận hành một hệ thống thực tế, ranh giới giữa việc viết xong tính năng và làm chủ hệ thống nằm ở cách đối mặt với sự cố. Thay vì hoảng loạn tìm lỗi trong mã nguồn khi người dùng đang bị ảnh hưởng, quy trình ứng phó chuẩn gồm năm pha rõ ràng:

1. **Phát hiện (Detection):** Cảnh báo tự động theo triệu chứng người dùng cảm nhận (tỉ lệ lỗi > 1%, p95 vượt ngưỡng) giúp đội trực biết sự cố trong vài phút thay vì đợi phản ánh từ bên ngoài.
2. **Đánh giá (Assessment):** Xác định nhanh phạm vi ảnh hưởng: bao nhiêu phần trăm yêu cầu lỗi, dịch vụ nào bị tác động và xu hướng đang tăng hay ổn định.
3. **Giảm thiểu tức thời (Mitigation):** Ưu tiên khôi phục trạng thái ổn định nhanh nhất bằng Rollback phiên bản, tắt Feature Flag hoặc chuyển hướng lưu lượng. Việc tìm nguyên nhân gốc để làm sau khi dịch vụ đã hồi phục.
4. **Thông báo (Communication):** Cập nhật trạng thái định kỳ cho đội nội bộ, bộ phận hỗ trợ và người dùng nếu cần.
5. **Phân tích nguyên nhân gốc (Postmortem):** Ghi lại dòng thời gian, nguyên nhân hệ thống và danh sách hành động phòng ngừa.

## 2. Postmortem không đổ lỗi và cảnh báo theo triệu chứng

```step
category: TECHNIQUE
short: Postmortem
scene: s2-postmortem
callout:
  kind: watch-out
  title: Cảnh báo theo triệu chứng, không chỉ theo CPU
  vi: "Người dùng không quan tâm CPU đang 85% hay 50%, họ chỉ quan tâm trang có lỗi hay chậm không. Hãy cảnh báo dựa trên Error Rate, Latency và Error Budget."
whatChanged:
  - "+ Mẫu Postmortem không đổ lỗi gồm Timeline, Root Cause và Action Items"
  - "~ Chuyển cảnh báo từ ngưỡng tài nguyên sang chỉ số trải nghiệm (Golden Signals)"
telemetry:
  - label: "4 Golden Signals"
    value: "Latency · Traffic · Errors · Saturation"
  - label: "Action Items"
    value: "Có người phụ trách & hạn"
    tone: ok
```

Một báo cáo **Postmortem** hiệu quả luôn tuân thủ nguyên tắc **không đổ lỗi (Blameless)**: lỗi không nằm ở việc một kỹ sư gõ nhầm cấu hình, mà nằm ở quy trình cho phép cấu hình lỗi đi thẳng tới 100% người dùng mà không qua kiểm thử tải hay triển khai từng phần (Canary).

Để phát hiện sớm, chiến lược giám sát dựa trên bốn tín hiệu vàng (Golden Signals): **Độ trễ (Latency)**, **Lưu lượng (Traffic)**, **Tỉ lệ lỗi (Errors)** và **Độ bão hòa (Saturation)**. Mọi hành động cải thiện sau sự cố phải có người phụ trách và thời hạn cụ thể.

## 3. Lập kế hoạch công suất 6 tháng theo chu kỳ ngày đêm

```step
category: PROBLEM
short: Dự báo 6 tháng
scene: s3-diurnal-live
live: capacity
activity: S6-06.A2
gate: optional
callout:
  kind: technique
  title: Thiết kế cho đỉnh tăng trưởng, không cho trung bình
  vi: "Lưu lượng tăng trưởng kép theo tháng (ví dụ +20%/tháng) kết hợp biến động đỉnh ngày đêm khiến hệ thống chạm ngưỡng bão hòa nhanh hơn dự tính tuyến tính."
whatChanged:
  - "~ Mô phỏng chu kỳ tải ngày đêm (900 → 3.400 req/s) kèm sự cố chậm DB tại t = 42 s"
  - "~ Đánh dấu thời điểm cần bổ sung công suất trước khi ρ chạm ngưỡng nguy hiểm"
telemetry:
  - label: "Tăng trưởng kép"
    value: "1,20^6 ≈ 2,99× sau 6 tháng"
    tone: warn
  - label: "Biến động ngày đêm"
    value: "900 → 3.400 req/s"
```

**Capacity Planning** giúp đội ngũ mở rộng hạ tầng chủ động trước khi sự cố quá tải xảy ra. Nếu tải đỉnh hiện tại là 1.000 req/s và tốc độ tăng trưởng là 20% mỗi tháng, sau 6 tháng lưu lượng sẽ tăng theo cấp số nhân:

$$\text{Tải sau 6 tháng} = 1.000 \times (1 + 0,20)^6 \approx 2.986 \text{ req/s}$$

Vì các thay đổi cấu trúc như thêm Read Replica hoặc Sharding cơ sở dữ liệu thường mất nhiều tuần chuẩn bị và kiểm thử tải, kế hoạch công suất 6 tháng phải vạch rõ mốc thời gian nâng cấp từng tầng (API, Cache, Database) khi mức sử dụng tiến gần 70–75%.

Trong mô phỏng trực tiếp, lưu lượng dao động theo chu kỳ ngày đêm từ 900 lên 3.400 req/s và tại giây 42 xảy ra sự cố chậm truy vấn trên Primary DB. Hãy quan sát biểu đồ độ trễ và tỉ lệ lỗi để chuẩn bị cho bài tập phân tích sự cố.

## 4. Chuyển đổi hệ thống an toàn với Strangler Fig và Dual-Write

```step
category: TECHNIQUE
short: Chuyển đổi
scene: s4-migration
activity: S6-06.A1
gate: required
callout:
  kind: good-to-know
  vi: "Không bao giờ chuyển đổi toàn bộ dữ liệu hoặc lưu lượng trong một lần duy nhất (Big-Bang). Luôn giữ đường lùi (Rollback) ở từng bước nhỏ."
whatChanged:
  - "+ Áp dụng Strangler Fig: bộ định tuyến chuyển dần 1% → 10% → 50% → 100%"
  - "~ Kiểm chứng dữ liệu song song (Dual-Write & Dual-Read) trước khi tắt hệ thống cũ"
telemetry:
  - label: "Chiến lược"
    value: "Canary & Strangler Fig"
    tone: ok
  - label: "Mục tiêu"
    value: "Zero Downtime"
```

Khi cần thay thế hệ thống cũ hoặc chuyển đổi cơ sở dữ liệu đang phục vụ hàng triệu người dùng, cách tiếp cận an toàn là **Strangler Fig**:

1. **Dual-Write:** Ghi đồng thời vào cả hệ thống cũ và mới (lỗi ở hệ thống mới chỉ ghi log, chưa ảnh hưởng người dùng).
2. **Đối soát & Dual-Read:** Đọc song song cả hai nguồn để kiểm tra sai lệch dữ liệu trong khi vẫn trả kết quả từ nguồn cũ.
3. **Chuyển lưu lượng từng bước:** Dùng Feature Flag chuyển dần 1%, 5%, 25%, 100% lưu lượng đọc sang nguồn mới, giữ nguyên cơ chế lùi về nguồn cũ nếu Error Rate tăng.
4. **Ngừng hệ thống cũ:** Chỉ gỡ bỏ đường ghi cũ sau khi đã chạy ổn định hoàn toàn.

## 5. Cạm bẫy thường gặp khi vận hành và chuyển đổi hệ thống

```step
category: PITFALL
short: Bẫy vận hành
scene: s2-postmortem
callout:
  kind: watch-out
  title: Tránh cảnh báo chỉ theo CPU và triển khai Big-Bang
  vi: "Cảnh báo theo CPU > 80% dễ gây nhiễu khi hệ thống vẫn phục vụ tốt, trong khi bỏ sót lỗi logic khiến Error Rate tăng vọt. Tương tự, cắt chuyển 100% lưu lượng một lần làm mất đường lùi."
whatChanged:
  - "! Đặt cảnh báo tràn lan theo tài nguyên thô gây mỏi mệt cho đội trực (Alert Fatigue)"
  - "! Triển khai thay đổi schema hoặc chuyển đổi dữ liệu không qua Canary 1% → 10%"
telemetry:
  - label: "Bẫy cảnh báo"
    value: "Alert Fatigue"
    tone: warn
  - label: "Chuẩn triển khai"
    value: "Canary + Auto-rollback"
    tone: ok
```

Hai sai lầm phổ biến nhất trong vận hành Production:

- **Nhiễu cảnh báo (Alert Fatigue):** Nếu mỗi tuần đội trực nhận hàng chục cảnh báo giả chỉ vì CPU tăng tạm thời, họ sẽ phản ứng chậm khi sự cố thực sự xảy ra. Chỉ đánh thức người trực khi SLO về độ trễ hoặc tỉ lệ lỗi bị vi phạm.
- **Thiếu kiểm chứng đường lùi:** Kế hoạch Rollback chỉ có giá trị khi đã được thử nghiệm trước; nếu migration làm thay đổi cấu trúc bảng không tương thích ngược, lệnh hoàn tác mã nguồn vẫn không thể cứu vãn dữ liệu.

## 6. Tổng kết: Tư duy vận hành và quyết định kiến trúc (ADR)

```step
category: RECAP
short: Tóm tắt
scene: s5-recap
callout:
  kind: key-idea
  title: Gắn kết kỹ thuật với tác động kinh doanh
  vi: "Mọi đề xuất kiến trúc hay đầu tư công suất đều cần được ghi lại qua ADR kèm số liệu chi phí, rủi ro và phương án hoàn tác rõ ràng."
whatChanged:
  - "+ Tổng hợp vòng lặp vận hành: Giám sát → Sự cố → Postmortem → Capacity Plan"
telemetry:
  - label: "Chuẩn tài liệu"
    value: "ADR & Runbook"
  - label: "Mục tiêu"
    value: "Ổn định & Chủ động"
```

Tư duy vận hành trưởng thành thể hiện qua ba thói quen cốt lõi:

- **Luôn có đường lùi và Runbook:** Mọi thay đổi đều có kế hoạch Rollback và tài liệu hướng dẫn xử lý nhanh khi cảnh báo kích hoạt.
- **Học từ sự cố qua Postmortem:** Biến mỗi lần gián đoạn thành nâng cấp về tự động hóa, Canary và ngưỡng cảnh báo.
- **Dự báo công suất bằng số liệu:** Tính tăng trưởng kép và kiểm thử tải định kỳ để mở rộng trước khi hệ thống chạm ngưỡng bão hòa.
