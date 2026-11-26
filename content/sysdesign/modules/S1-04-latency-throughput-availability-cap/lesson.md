## 1. Bốn khái niệm định lượng nền tảng của thiết kế hệ thống

```step
category: SETUP
short: Bốn khái niệm
scene: s1-overview
callout:
  kind: key-idea
  title: Thay tính từ mơ hồ bằng đại lượng đo được
  vi: "Một bản thiết kế tốt không viết hệ thống cần nhanh và luôn chạy, mà chỉ rõ p99 dưới bao nhiêu ms, chịu bao nhiêu req/s, cam kết mấy chữ số 9 và ứng xử ra sao khi đứt mạng."
whatChanged:
  - "+ Mô hình chuẩn: Người dùng → Load Balancer → App Tier (2 máy) → Database"
  - "~ Mỗi thành phần gắn liền với các chỉ số Latency, Throughput, Availability và CAP"
telemetry:
  - label: "Năng lực App Tier"
    value: "1.200 req/s"
    tone: ok
  - label: "Năng lực Database"
    value: "800 req/s"
    tone: ok
  - label: "RTT mạng ngoài"
    value: "≈ 30 ms"
```

Sau khi nắm vai trò các thành phần, mẫu giao tiếp và cách dò điểm nghẽn, bước tiếp theo là chuẩn hóa bốn khái niệm cốt lõi xuất hiện trong mọi quyết định kiến trúc:

1. **Latency (Độ trễ):** thời gian để hoàn tất trọn vẹn **một request**, tính bằng mili-giây (`ms`), quyết định trực tiếp cảm nhận mượt hay trễ của người dùng.
2. **Throughput (Thông lượng):** số lượng request hệ thống xử lý thành công **trong một giây** (`req/s` hoặc `TPS`), quyết định quy mô tải phục vụ được.
3. **Availability (Độ sẵn sàng):** tỉ lệ phần trăm thời gian hệ thống phản hồi bình thường trên tổng thời gian vận hành, là cơ sở ký cam kết chất lượng dịch vụ (SLA).
4. **Định lý CAP:** quy luật đánh đổi giữa tính nhất quán tức thời (**C**) và tính sẵn sàng phản hồi (**A**) khi mạng phân tán bị chia cắt (**P**).

## 2. Latency và Throughput ở tải ổn định: hai đại lượng độc lập

```step
category: MECHANISM
short: Hai chiều đo
scene: s2-steady
live: steady
callout:
  kind: good-to-know
  title: Nhanh trên từng việc khác với làm được nhiều việc cùng lúc
  vi: "Thêm máy chạy song song giúp nhân bội thông lượng nhưng không tự rút ngắn thời gian thực thi của một tác vụ đơn lẻ."
whatChanged:
  - "~ Chạy tải ổn định 360 req/s trên 2 máy App và 1 Database"
  - "~ Thông lượng hoàn thành khớp 360 req/s, p50 ≈ 48 ms và p99 ≈ 67 ms"
telemetry:
  - label: "Thông lượng"
    value: "360 req/s"
    tone: ok
  - label: "Trung vị p50"
    value: "≈ 48 ms"
    tone: ok
  - label: "Đuôi p99"
    value: "≈ 67 ms"
    tone: ok
```

Sai lầm phổ biến của người mới là đồng nhất độ trễ thấp với thông lượng cao. Trên thực tế đây là hai chiều đo độc lập:

- Một tiến trình xử lý tuần tự từng bức ảnh mất `10 giây/ảnh` có Latency cao (`10 s`) và Throughput thấp (`0,1 ảnh/s`).
- Nếu chạy **100 Worker song song**, mỗi bức ảnh riêng lẻ vẫn mất đúng `10 giây` (Latency không đổi), nhưng cả cụm hoàn thành `100 ảnh / 10 giây = 10 ảnh/s` (Throughput tăng gấp 100 lần).

Trên mô phỏng tải ổn định **360 req/s**, hãy thử kéo núm `Số instance App` từ 2 lên 4: năng lực tối đa của tầng App tăng từ 1.200 lên 2.400 req/s, nhưng `p50` vẫn giữ quanh **48 ms** vì mỗi request vẫn phải đi qua 30 ms mạng Internet, 10 ms xử lý ở App và 8 ms truy vấn Database.

## 3. Đường cong Latency–Throughput khi tải tăng: thông lượng kịch trần, p99 dựng đứng

```step
category: PROBLEM
short: Đường bão hòa
scene: s3-ramp
live: ramp
activity: S1-04.A1
gate: optional
callout:
  kind: watch-out
  title: Trung bình và p50 che giấu trải nghiệm tệ nhất
  vi: "Khi thành phần nghẽn vượt 80% công suất, p99 tăng vọt sớm hơn rất nhiều so với p50. Luôn theo dõi p95 và p99 thay vì chỉ nhìn trung bình."
whatChanged:
  - "~ Tải tăng đều từ 100 lên 1.000 req/s trong 60 giây"
  - "~ DB chạm trần 800 req/s ở t ≈ 47 s; p99 vọt từ 63 lên 265 rồi > 900 ms"
telemetry:
  - label: "p99 tại 475 req/s"
    value: "≈ 74 ms"
    tone: ok
  - label: "p99 tại 730 req/s"
    value: "≈ 131 ms"
    tone: warn
  - label: "p99 tại 805 req/s"
    value: "≈ 265 ms"
    tone: bad
```

Dù độc lập ở tải thấp, Latency và Throughput va vào nhau ngay khi một thành phần tiến sát giới hạn năng lực. Quan sát kịch bản tăng tải từ **100 lên 1.000 req/s**:

| Mốc thời gian | Tải vào | ρ của DB | Thông lượng đạt | p50 | p99 |
|---|---|---|---|---|---|
| t = 15 s | 325 req/s | 0,41 | 325 req/s | 48 ms | 66 ms |
| t = 35 s | 625 req/s | 0,78 | 625 req/s | 50 ms | 89 ms |
| t = 42 s | 730 req/s | 0,91 | 730 req/s | 56 ms | 131 ms |
| t = 47 s | 805 req/s | 1,01 | ≈ 800 req/s | 78 ms | 265 ms |
| t = 55 s | 925 req/s | 1,16 | ≈ 800 req/s | 736 ms | 924 ms |

Ở `t = 42 s`, trung vị `p50` mới nhích nhẹ lên 56 ms nhưng 1% người dùng chậm nhất (`p99`) đã phải chờ **131 ms**. Vượt quá 800 req/s, thông lượng thực tế không thể tăng thêm nữa trong khi hàng đợi trước Database đẩy độ trễ tăng dựng đứng cho tới khi tràn Timeout.

## 4. Chọn đúng kỹ thuật: khi nào tối ưu Latency, khi nào tối ưu Throughput

```step
category: TECHNIQUE
short: Tối ưu riêng
scene: s4-optimize
callout:
  kind: compare
  title: Hai bộ công cụ cho hai mục tiêu
  vi: "Muốn một request chạy nhanh hơn thì cắt bớt công việc trên đường đi của nó; muốn hệ thống gánh nhiều người hơn thì mở rộng mức độ song song và giảm tải vào nút thắt."
whatChanged:
  - "+ Phân nhóm kỹ thuật hạ độ trễ đơn lẻ so với kỹ thuật nâng thông lượng tổng"
telemetry:
  - label: "Ưu tiên Latency"
    value: "Tương tác trực tiếp"
  - label: "Ưu tiên Throughput"
    value: "Xử lý lô & tải lớn"
```

Tùy bản chất sản phẩm mà bạn chọn đòn bẩy kỹ thuật tương ứng:

- **Khi mục tiêu là hạ Latency (API giao diện người dùng, tìm kiếm, trò chơi thời gian thực):** đặt **Cache** trên RAM để bỏ qua chặng đọc đĩa, tạo **Index** biến quét bảng thành tra cứu cây cân bằng, đặt **CDN** gần người dùng để giảm RTT mạng ngoài, và gộp các lời gọi tuần tự thành gọi song song.
- **Khi mục tiêu là nâng Throughput (xử lý sự kiện lớn, xuất báo cáo lô, luồng ghi cao điểm):** **mở rộng ngang (Horizontal Scaling)** tầng Stateless sau Load Balancer, dùng **Connection Pool** giảm chi phí mở kết nối, đẩy tác vụ nặng sang **Message Queue + Worker**, và gom ghi theo lô (Batching).

Lưu ý rằng một kỹ thuật tốt như **Cache** cải thiện đồng thời cả hai: lượt đọc trúng Cache vừa trả lời trong dưới 1 ms (giảm Latency), vừa bớt truy vấn đập vào Database (nâng trần Throughput của toàn hệ thống).

## 5. Độ sẵn sàng (Availability): quy đổi bậc số 9 ra thời gian ngừng hoạt động

```step
category: MECHANISM
short: Bậc số 9
scene: s5-nines
activity: S1-04.A2
gate: required
callout:
  kind: key-idea
  title: Quy luật giảm 10 lần mỗi chữ số 9
  vi: "Từ 99,9% lên 99,99%, khoảng thời gian ngừng tối đa cả năm thu hẹp từ gần 9 giờ xuống chưa đầy 53 phút — không còn chỗ cho việc tắt máy bảo trì thủ công."
whatChanged:
  - "+ Quy đổi từ tỉ lệ phần trăm Uptime sang ngày, giờ, phút ngừng mỗi năm"
telemetry:
  - label: "Ba số 9 (99,9%)"
    value: "8,76 giờ/năm"
    tone: ok
  - label: "Bốn số 9 (99,99%)"
    value: "52,6 phút/năm"
    tone: warn
  - label: "Năm số 9 (99,999%)"
    value: "5,26 phút/năm"
    tone: bad
```

**Độ sẵn sàng (Availability)** đo tỉ lệ thời gian hệ thống phục vụ hợp lệ trên tổng thời gian quan sát:

$$\text{Availability} = \frac{\text{Uptime}}{\text{Uptime} + \text{Downtime}}$$

Ngành công nghiệp thường gọi tắt mức cam kết SLA theo số lượng chữ số 9. Với một năm chuẩn `365 × 24 × 60 = 525.600 phút`:

| Mức độ sẵn sàng | Tên gọi | Ngừng tối đa / năm | Ngừng tối đa / tháng | Ngữ cảnh phù hợp |
|---|---|---|---|---|
| **99%** | Hai số 9 | 3,65 ngày | ≈ 7,3 giờ | Công cụ nội bộ, môi trường thử nghiệm |
| **99,9%** | Ba số 9 | 8,76 giờ | ≈ 43,8 phút | Ứng dụng web, thương mại điện tử tiêu chuẩn |
| **99,99%** | Bốn số 9 | 52,56 phút | ≈ 4,38 phút | Cổng thanh toán, ngân hàng số, hạ tầng đám mây |
| **99,999%** | Năm số 9 | 5,26 phút | ≈ 26 giây | Hệ thống viễn thông lõi, điều khiển khẩn cấp |

## 6. Cái giá của mỗi chữ số 9 và các viên gạch xây dựng High Availability

```step
category: PITFALL
short: Giá của HA
scene: s6-ha-cost
callout:
  kind: watch-out
  title: Đừng đặt mục tiêu 99,999% khi nghiệp vụ chỉ cần 99,9%
  vi: "Mỗi chữ số 9 cộng thêm thường làm chi phí hạ tầng và công sức trực vận hành tăng gấp nhiều lần. Hãy đối chiếu thiệt hại mỗi phút ngừng hoạt động với chi phí duy trì dự phòng."
whatChanged:
  - "+ Chỉ ra các điểm lỗi đơn (LB đơn lẻ, DB đơn lẻ) trên kiến trúc hiện tại"
telemetry:
  - label: "Mức khởi đầu hợp lý"
    value: "99,9% (ba số 9)"
    tone: ok
  - label: "Yêu cầu cho 99,99%"
    value: "Tự động Failover"
    tone: warn
```

Đạt **99%** chỉ cần một máy chủ và quy trình khởi động lại khi hỏng. Nhưng càng thêm chữ số 9, kiến trúc càng phải loại bỏ triệt để mọi **điểm lỗi đơn (Single Point of Failure - SPOF)**:

- **Lên 99,9% (43,8 phút/tháng):** cần tối thiểu 2 máy App sau cặp Load Balancer Active-Standby, bật **Health Check** tự động ngắt máy lỗi, triển khai không gián đoạn (Rolling Deployment) và hệ thống cảnh báo sớm.
- **Lên 99,99% (4,38 phút/tháng):** con người không kịp đăng nhập xử lý sự cố trong 4 phút. Hệ thống bắt buộc phải có bản sao Database tự động chuyển đổi dự phòng (**Auto-Failover**), trải rộng trên nhiều vùng khả dụng (Multi-AZ / Multi-Region) và kiểm thử diễn tập lỗi định kỳ.

Vì chi phí tăng phi tuyến, hầu hết sản phẩm tiêu dùng bắt đầu ở **99,9%** kết hợp **suy giảm nhẹ nhàng (Graceful Degradation)** — ví dụ khi dịch vụ gợi ý lỗi thì trang chủ vẫn hiển thị danh sách phổ biến thay vì trả trang trắng.

## 7. Mở đầu về Định lý CAP: đánh đổi bắt buộc khi mạng bị chia cắt

```step
category: MECHANISM
short: Mở đầu CAP
scene: s7-cap
callout:
  kind: key-idea
  title: Partition không phải lựa chọn, mà là thực tế vật lý
  vi: "Trong hệ phân tán qua mạng, đứt kết nối giữa các máy chủ (P) chắc chắn có lúc xảy ra. Câu hỏi thực tế là: đúng vào lúc hai bản sao không liên lạc được nhau, bạn chọn C hay chọn A?"
whatChanged:
  - "+ Cây quyết định CAP khi kết nối sao chép giữa Node A và Node B bị đứt"
telemetry:
  - label: "Ưu tiên đúng dữ liệu"
    value: "CP (từ chối tạm thời)"
    tone: warn
  - label: "Ưu tiên luôn phản hồi"
    value: "AP (chấp nhận dữ liệu cũ)"
    tone: ok
```

Khi bạn nhân bản dữ liệu sang nhiều máy chủ ở nhiều vùng để tăng độ sẵn sàng, bạn bước vào phạm vi của **Định lý CAP**:

- **Consistency (C - Tính nhất quán tức thời):** mọi lượt đọc ở bất kỳ nút nào đều thấy bản ghi mới nhất vừa được xác nhận (hoặc nhận thông báo lỗi).
- **Availability (A - Tính sẵn sàng trong CAP):** mọi yêu cầu gửi tới một nút còn sống đều nhận được phản hồi dữ liệu hợp lệ (không trả lỗi từ chối).
- **Partition Tolerance (P - Chịu chia cắt mạng):** hệ thống vẫn tiếp tục vận hành theo cam kết ngay cả khi gói tin giữa các nút lưu trữ bị đứt hoặc rớt.

Vì cáp mạng, switch và định tuyến liên vùng luôn có xác suất gặp sự cố, một cơ sở dữ liệu phân tán **bắt buộc phải có P**. Khi mạng bình thường, hệ thống vừa nhất quán vừa sẵn sàng; nhưng ngay khi chia cắt mạng xảy ra giữa hai nút, bạn chỉ chọn được một trong hai: **CP** (khóa/từ chối phía mất liên lạc để bảo toàn dữ liệu đúng) hoặc **AP** (cho cả hai phía tiếp tục phục vụ rồi đồng bộ sau). Cơ chế Quorum và các mức nhất quán chi tiết sẽ được khảo sát sâu ở bài **S3-01**.

## 8. Chọn CP hay AP cho từng tính năng nghiệp vụ thực tế

```step
category: TECHNIQUE
short: Chọn CP hay AP
scene: s8-cap-choice
callout:
  kind: technique
  title: Hỏi hậu quả của 5 giây lệch dữ liệu
  vi: "Hãy tự hỏi: điều tệ nhất xảy ra nếu người dùng nhìn thấy dữ liệu cũ trong 5 giây là gì? Nếu gây mất tiền hoặc bán trùng hàng thì chọn CP; nếu không đáng kể thì chọn AP."
whatChanged:
  - "+ Tách riêng quyết định CP/AP cho từng miền dữ liệu trong cùng một sàn TMĐT"
telemetry:
  - label: "Tiền tệ & Tồn kho"
    value: "Chọn CP"
    tone: warn
  - label: "Danh mục & Tương tác"
    value: "Chọn AP"
    tone: ok
```

Bạn không chọn CP hay AP cho cả công ty, mà chọn theo **bất biến nghiệp vụ của từng tính năng**:

| Tính năng | Lựa chọn | Lý do kỹ thuật |
|---|---|---|
| Số dư ví điện tử, thanh toán | **CP** | Báo lỗi thử lại sau 30 giây an toàn hơn để hai giao dịch rút vượt số dư thực |
| Đặt ghế máy bay, khóa tồn kho cuối | **CP** | Ngăn hai khách hàng cùng mua chiếc ghế hoặc món hàng cuối cùng |
| Mô tả sản phẩm, danh sách cửa hàng | **AP** | Hiển thị giá/ảnh cũ vài giây tốt hơn nhiều so với làm sập trang xem hàng |
| Giỏ hàng, bộ đếm lượt thích/xem | **AP** | Người dùng luôn thêm hàng hoặc bấm thích mượt mà; các bản sao hợp nhất sau |

Thực tế phần lớn luồng đọc hiển thị trên ứng dụng tiêu dùng ưu tiên **AP**, chỉ khoanh vùng **CP** chặt chẽ cho bước chốt đơn và hạch toán tiền tệ.

## 9. Tóm tắt: kết hợp cả bốn khái niệm trên một bài toán thiết kế

```step
category: RECAP
short: Tóm tắt
scene: s9-recap
callout:
  kind: key-idea
  title: Bốn con số mở đầu mọi bản thiết kế
  vi: "Luôn chốt rõ mục tiêu Latency (p50/p99), Throughput đỉnh (req/s), bậc Availability (số 9) và mô hình nhất quán (CP/AP) trước khi vẽ thành phần."
whatChanged:
  - "+ Ánh xạ từng yêu cầu phi chức năng sang quyết định kiến trúc cụ thể"
telemetry:
  - label: "Trần thông lượng mẫu"
    value: "800 req/s (do DB)"
    tone: warn
  - label: "99,9% so với 99,99%"
    value: "8,76 giờ so với 52,6 phút"
```

Bốn khái niệm trong bài luôn tác động qua lại với nhau trên cùng một sơ đồ kiến trúc:

1. **Latency và Throughput:** đo ở hai góc nhìn khác nhau (`ms/request` so với `req/s`), nhưng khi mức sử dụng $\rho$ vượt 80% và tiến sát trần thông lượng, độ trễ đuôi `p99` sẽ vọt dựng đứng tách xa `p50`.
2. **Availability:** quy đổi trực tiếp ra ngân sách thời gian ngừng hoạt động mỗi năm (`99,9% ≈ 8,76 giờ`, `99,99% ≈ 52,6 phút`). Mỗi chữ số 9 đòi hỏi loại bỏ điểm lỗi đơn bằng dự phòng và chuyển đổi tự động.
3. **Định lý CAP:** khi chia cắt mạng xảy ra giữa các bản sao, chọn **CP** cho tiền tệ/tồn kho và chọn **AP** cho nội dung đọc/tương tác xã hội.
