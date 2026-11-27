## 1. Nhiều máy chủ nhưng người dùng chỉ biết một địa chỉ

```step
category: SETUP
short: Một điểm vào
scene: s1-problem
callout:
  kind: key-idea
  title: Bài toán điều phối khi mở rộng ngang
  vi: "Thêm máy chủ mới chỉ tăng năng lực thực tế khi có một thành phần đứng trước nhận lưu lượng chung và phân phối hợp lý cho toàn cụm."
whatChanged:
  - "+ Cụm có 3 máy App (mỗi máy 360 req/s) nhưng Client chỉ trỏ vào IP của App A"
  - "~ App A quá tải ở 600 req/s (ρ = 1,67) trong khi App B và App C bỏ không"
telemetry:
  - label: "Lưu lượng vào"
    value: "600 req/s"
  - label: "ρ của App A"
    value: "1,67 (quá tải)"
    tone: bad
  - label: "App B & App C"
    value: "0 req/s"
    tone: warn
```

Khi một máy chủ ứng dụng đơn lẻ (`μ = 360 req/s`) không còn chịu nổi mức lưu lượng `600 req/s`, nâng cấp dọc (mua máy nhiều CPU/RAM hơn) sớm chạm trần phần cứng và vẫn để lại một điểm lỗi đơn: máy đó dừng là toàn bộ dịch vụ ngừng phục vụ.

Hướng mở rộng bền vững hơn là **mở rộng ngang (Horizontal Scaling)**: chạy song song 3 máy chủ vừa phải để đạt tổng công suất `3 × 360 = 1.080 req/s`. Tuy nhiên, trình duyệt và ứng dụng di động chỉ gọi tới một tên miền duy nhất. Nếu không có lớp điều phối ở giữa, toàn bộ lưu lượng vẫn dồn vào địa chỉ của một máy đầu tiên.

## 2. Đặt Load Balancer phía trước cụm ứng dụng

```step
category: TECHNIQUE
short: Vai trò của LB
scene: s2-even
callout:
  kind: good-to-know
  vi: "Ngoài chia tải, Load Balancer còn che giấu địa chỉ nội bộ của máy chủ, tập trung giải mã TLS và hỗ trợ cập nhật phần mềm không gián đoạn."
whatChanged:
  - "+ Đặt Load Balancer nhận toàn bộ 600 req/s rồi chia đều sang 3 máy App"
  - "~ Mỗi máy App xử lý 200 req/s, mức sử dụng hạ xuống ρ = 0,56"
telemetry:
  - label: "Tải mỗi máy App"
    value: "200 req/s"
    tone: ok
  - label: "Mức sử dụng ρ"
    value: "0,56"
    tone: ok
  - label: "Độ trễ p99"
    value: "≈ 99 ms"
    tone: ok
```

**Load Balancer (bộ cân bằng tải)** đứng giữa Internet và cụm máy chủ nội bộ. Client chỉ gửi request tới Load Balancer; bộ cân bằng chọn một máy đích khoẻ mạnh, chuyển tiếp request vào mạng nội bộ tốc độ cao rồi trả phản hồi về cho client.

Ở trạng thái cơ sở với thuật toán **Round Robin**, các request đi lần lượt theo vòng tròn `App A → App B → App C → App A`. Mỗi máy nhận đúng `200 req/s` trên năng lực `360 req/s` (`ρ = 0,56`), giữ độ trễ đuôi `p99` quanh `99 ms` và vẫn dư công suất dự phòng nếu một máy cần bảo trì.

## 3. Điểm mù của Round Robin khi thời gian xử lý lệch nhau

```step
category: PROBLEM
short: Nghẽn máy chậm
scene: s3-rr-overload
callout:
  kind: watch-out
  title: Đếm số lượt gọi khác với đo số việc đang tồn
  vi: "Round Robin giả định mọi request tốn chi phí ngang nhau. Khi một máy vướng nhiều tác vụ dài, tiếp tục chia đều số lượt sẽ đẩy máy đó vượt ngưỡng."
whatChanged:
  - "~ App B nhận loạt tác vụ báo cáo nặng làm thời gian xử lý tăng từ 20 ms lên 55 ms"
  - "~ Năng lực App B giảm còn ~164 req/s nhưng Round Robin vẫn ép vào 200 req/s"
telemetry:
  - label: "ρ của App B"
    value: "1,22 (nghẽn)"
    tone: bad
  - label: "ρ của App A, C"
    value: "0,56"
    tone: ok
  - label: "Lỗi toàn cục"
    value: "≈ 33%"
    tone: bad
```

Trong thực tế, các endpoint hiếm khi đồng nhất: truy vấn xem thông tin chỉ mất `20 ms`, nhưng xuất báo cáo hoặc xử lý tệp có thể giữ kết nối lâu gấp nhiều lần.

Trên mô hình, khi **App B** phải gánh loạt truy vấn nặng làm thời gian xử lý trung bình tăng lên `55 ms` (với giới hạn `9` kết nối đồng thời), thông lượng tối đa của riêng App B giảm xuống `9 / 0,055 ≈ 164 req/s`. Vì Round Robin không theo dõi trạng thái bận thực tế mà vẫn đều đặn giao `200 req/s` cho mỗi máy, hàng đợi trước App B dồn ứ nhanh chóng (`ρ = 1,22`) trong khi App A và App C vẫn dư gần một nửa công suất.

## 4. Các thuật toán chia tải thích ứng: Least Connections, Weighted và IP Hash

```step
category: MECHANISM
short: Các thuật toán
scene: s4-least-conn
callout:
  kind: compare
  title: Chọn thuật toán theo đặc trưng tải
  vi: "Dùng Round Robin cho request đồng nhất, Least Connections khi độ dài request biến thiên mạnh, và Weighted khi cấu hình phần cứng các máy khác nhau."
whatChanged:
  - "~ Đổi thuật toán trên LB từ Round Robin sang Least Connections"
  - "~ Lưu lượng vào App B tự hạ xuống ~110 req/s; cả 3 máy cân bằng ở ρ ≈ 0,68"
telemetry:
  - label: "App A & App C"
    value: "≈ 245 req/s / máy"
    tone: ok
  - label: "App B (đang chậm)"
    value: "≈ 110 req/s"
    tone: ok
  - label: "ρ toàn cụm"
    value: "≈ 0,68"
    tone: ok
```

Bốn thuật toán cân bằng tải phổ biến giải quyết bốn bài toán khác nhau:

| Thuật toán | Nguyên tắc chọn đích | Trường hợp phù hợp |
|---|---|---|
| **Round Robin** | Xoay vòng tuần tự từng máy | Máy chủ đồng cấu hình, thời gian xử lý các request xấp xỉ nhau |
| **Least Connections** | Chọn máy có ít kết nối đang mở nhất | Độ dài request chênh lệch lớn, kết nối giữ lâu (WebSocket, báo cáo) |
| **Weighted Round Robin** | Chia theo tỷ lệ trọng số cấu hình (ví dụ `4:2:2`) | Cụm pha trộn máy nhiều vCPU với máy nhỏ, hoặc điều tiết tỷ lệ bản mới |
| **IP Hash** | Băm địa chỉ IP client để ghim về cố định một máy | Ứng dụng cũ bắt buộc giữ trạng thái trên RAM cục bộ (dễ lệch tải) |

Khi chuyển sang **Least Connections**, Load Balancer thấy App B đang tồn nhiều kết nối chưa đóng nên tự động nắn phần lớn request mới sang App A và App C. Mức sử dụng của cả ba máy hội tụ quanh `ρ ≈ 0,68` và không còn request nào bị rớt.

## 5. Quan sát trực tiếp: tác vụ nặng, máy chủ sập và chuyển đổi thuật toán

```step
category: PROBLEM
short: Chạy mô phỏng
scene: s5-live-algo
live: balance
activity: S2-01.A1
gate: optional
callout:
  kind: technique
  title: Thử đổi thuật toán ngay khi đang chạy
  vi: "Mở bảng điều khiển núm chỉnh của LB Chính, chuyển từ round-robin sang least-conn trong khoảng giây 10–35 để thấy hàng đợi trên App B tự rút cạn."
whatChanged:
  - "~ Kịch bản chạy liên tiếp 3 biến cố ở mức tải 600 req/s trong 80 giây"
  - "~ Giây 10: App B chậm · Giây 38: App C sập · Giây 64: LB Chính sập"
telemetry:
  - label: "Mục tiêu p99"
    value: "≤ 220 ms"
  - label: "Mục tiêu lỗi"
    value: "≤ 2%"
```

Hãy bấm chạy kịch bản mô phỏng để quan sát chuỗi ba sự cố thực tế trên cùng một dòng thời gian:

1. **Giây 10 – 35:** App B chậm đi `+35 ms`. Dưới chế độ `round-robin`, App B chuyển đỏ và làm hỏng 1/3 lưu lượng toàn hệ thống.
2. **Giây 38 – 56:** App C ngừng hoạt động đột ngột. Vì chu kỳ `healthCheckSec` mặc định đang để `20 giây`, Load Balancer vẫn mù quáng gửi request vào máy chết suốt 18 giây.
3. **Giây 64 – 80:** Chính LB Chính ngừng hoạt động, cắt đứt toàn bộ đường vào khi LB Dự phòng chưa được bật.

## 6. Health Checks: phát hiện máy lỗi mà không loại nhầm máy chậm

```step
category: TECHNIQUE
short: Health Check
scene: s6-healthcheck
callout:
  kind: watch-out
  title: Phân biệt máy chết với máy bận tạm thời
  vi: "Nếu đặt Timeout của Health Check quá gắt (như 100 ms) và loại máy ngay lần lỗi đầu, một nhịp tăng tải DB sẽ làm LB gỡ sạch mọi máy App khỏi pool."
whatChanged:
  - "+ LB định kỳ gọi GET /health tới từng máy App mỗi 1–3 giây"
  - "~ Khi App C quá hạn liên tiếp, LB gỡ App C khỏi vòng chia tải và dồn sang A, B"
telemetry:
  - label: "Chu kỳ thăm dò"
    value: "1–3 giây"
    tone: ok
  - label: "Ngưỡng gỡ máy"
    value: "2–3 lần liên tiếp"
  - label: "ρ App A & B còn lại"
    value: "0,83"
    tone: warn
```

Để không đẩy người dùng vào máy chủ đã sập, Load Balancer chạy vòng lặp **Health Check** định kỳ tới điểm cuối `/health` của từng instance:

```python
@app.get("/health/ready")
def readiness_check():
    if not db.ping(timeout_ms=500) or not cache.ping(timeout_ms=200):
        return {"status": "unhealthy"}, 503
    return {"status": "ok"}, 200
```

Ba quy tắc vận hành quan trọng của Health Check:
- **Kiểm tra phụ thuộc cốt lõi:** Điểm cuối *readiness* cần xác nhận máy chủ thực sự kết nối được Database/Cache chứ không chỉ trả `200 OK` rỗng.
- **Chu kỳ và Timeout cân bằng:** Timeout khoảng `2–5 giây` kèm ngưỡng `2–3` lần thất bại liên tiếp giúp phát hiện máy chết trong vài giây mà tránh hiện tượng chập chờn (*flapping*) gỡ nhầm máy chỉ đang chậm tạm thời.
- **Chế độ dự phòng khi cạn pool (Fail-open):** Nếu toàn bộ máy chủ đồng loạt báo lỗi nhẹ do phụ thuộc chung chậm, nhiều bộ cân bằng chọn giữ kết nối tới các máy hiện có thay vì cắt trắng 100% lưu lượng.

## 7. Loại bỏ điểm lỗi đơn bằng cặp Load Balancer Active-Standby

```step
category: MECHANISM
short: LB dự phòng
scene: s7-standby
activity: S2-01.A2
gate: optional
callout:
  kind: key-idea
  title: Mọi hộp đơn lẻ đều là SPOF
  vi: "Có 10 máy App phía sau vẫn vô nghĩa nếu cửa ngõ chỉ có đúng 1 Load Balancer. Cặp Active-Standby qua Virtual IP giúp tầng cân bằng tải tự chịu lỗi."
whatChanged:
  - "+ Bổ sung LB Dự phòng ở vùng khả dụng thứ hai nối nhịp tim với LB Chính"
  - "~ Khi LB Chính dừng ở giây 64, LB Dự phòng nhận lại Virtual IP trong 0,5 giây"
telemetry:
  - label: "Cơ chế phát hiện"
    value: "VRRP Heartbeat"
  - label: "Thời gian chuyển"
    value: "< 1 giây"
    tone: ok
  - label: "Điểm lỗi đơn"
    value: "0"
    tone: ok
```

Một Load Balancer đơn lẻ chính là **điểm lỗi đơn (Single Point of Failure — SPOF)** của cả kiến trúc. Để khắc phục, môi trường sản xuất luôn triển khai ít nhất một cặp **Active-Standby** (hoặc cụm Active-Active ở quy mô lớn):

- Phía ngoài, DNS trỏ tới một địa chỉ **Virtual IP (VIP)** duy nhất do LB Chính nắm giữ.
- LB Dự phòng liên tục kiểm tra tín hiệu **Heartbeat** từ LB Chính qua mạng nội bộ liên vùng.
- Ngay khi LB Chính mất tín hiệu quá ngưỡng cho phép, LB Dự phòng phát bản tin nhận quyền sở hữu địa chỉ VIP và tiếp tục phân phối lưu lượng xuống cụm App mà phía trình duyệt không hề hay biết địa chỉ phần cứng đã đổi.

## 8. Layer 4 so với Layer 7 và triển khai không gián đoạn

```step
category: TECHNIQUE
short: L4, L7 & Drain
scene: s8-l4-l7
callout:
  kind: compare
  title: Mặc định chọn Layer 7 cho Web và API
  vi: "Layer 7 tốn thêm một chút CPU đọc HTTP nhưng đổi lại định tuyến linh hoạt theo đường dẫn, giải mã TLS tập trung và hỗ trợ tách dịch vụ rất gọn."
whatChanged:
  - "+ Layer 7 đọc URL path (/users, /orders) để đẩy về đúng nhóm dịch vụ"
  - "+ Connection Draining giữ kết nối đang chạy hoàn tất trước khi tắt App C cập nhật"
telemetry:
  - label: "Layer 4 (TCP/UDP)"
    value: "Định tuyến IP:Port"
  - label: "Layer 7 (HTTP/S)"
    value: "Path, Header, TLS"
    tone: ok
  - label: "Rolling Deploy"
    value: "0 s gián đoạn"
    tone: ok
```

Theo mô hình mạng OSI, cân bằng tải chia thành hai tầng chính:

| Tiêu chí | Layer 4 (Transport) | Layer 7 (Application) |
|---|---|---|
| Dữ liệu nhìn thấy | Chỉ địa chỉ IP và cổng TCP/UDP | Đầy đủ URL path, HTTP method, header, cookie |
| Hiệu năng & độ trễ | Rất nhanh, chuyển tiếp gói tin trực tiếp | Tốn thêm vài mili-giây giải mã TLS và đọc HTTP |
| Ứng dụng điển hình | Cơ sở dữ liệu TCP, máy chủ game, lưu lượng thô cực lớn | Ứng dụng Web, API Gateway, định tuyến Microservices |

Load Balancer còn là chìa khoá cho **triển khai cuốn chiếu không gián đoạn (Zero-Downtime Rolling Deployment)**: trước khi nâng cấp App C, ta chuyển nó sang trạng thái **Connection Draining** — ngừng giao request mới, chờ các request đang chạy trả kết quả xong rồi mới tắt tiến trình, cập nhật mã nguồn, kiểm tra `/health` xanh trở lại và đưa vào pool, lặp tuần tự cho từng máy.

## 9. Thử thách thực hành: cấu hình Load Balancer vượt qua ba sự cố

```step
category: PITFALL
short: Sửa cấu hình LB
scene: s9-live-fix
live: fix
activity: S2-01.A3
gate: required
callout:
  kind: watch-out
  title: Ba lỗ hổng phổ biến khi vận hành thực tế
  vi: "Để nguyên Round Robin cho tải hỗn hợp, để chu kỳ Health Check hàng chục giây và quên bật máy dự phòng cho chính Load Balancer."
whatChanged:
  - "~ Áp dụng tối đa 3 thay đổi trong ngân sách ≤ 1,35 USD/giờ"
  - "~ Giữ p99 ≤ 220 ms và tổng tỷ lệ lỗi ≤ 2% suốt 80 giây sự cố"
telemetry:
  - label: "Ngân sách đổi"
    value: "≤ 3 thay đổi"
  - label: "Chi phí tối đa"
    value: "1,35 USD/giờ"
    tone: warn
  - label: "SLO lỗi"
    value: "≤ 2%"
    tone: ok
```

Ở thử thách này, bạn không cần thuê thêm máy chủ ứng dụng mới (cụm 3 máy `1.080 req/s` đã đủ dư cho `600 req/s` ngay cả khi 1 máy ngừng hoạt động). Vấn đề nằm hoàn toàn ở cấu hình tầng cân bằng tải:

- Chọn thuật toán biết tự động giảm lưu lượng vào máy đang phản hồi chậm ở giai đoạn giây `10–35`.
- Rút ngắn thời gian phát hiện máy hỏng để không đánh rớt 1/3 request suốt giai đoạn giây `38–56`.
- Loại bỏ điểm lỗi đơn của chính Load Balancer trước khi sự cố giây `64` xảy ra.

## 10. Tóm tắt: bốn quyết định cốt lõi khi thiết kế Load Balancing

```step
category: RECAP
short: Tóm tắt
scene: s10-recap
callout:
  kind: key-idea
  title: Danh sách kiểm tra thiết kế
  vi: "Khi vẽ Load Balancer trong bất kỳ kiến trúc nào, hãy luôn trả lời rõ 4 điểm: Layer mấy, thuật toán gì, Health Check ra sao và dự phòng HA thế nào."
whatChanged:
  - "+ Tổng kết thuật toán chia tải, Health Check, Active-Standby và Layer 4/7"
telemetry:
  - label: "Mặc định Web/API"
    value: "Layer 7 + Least-Conn"
    tone: ok
  - label: "Độ sẵn sàng LB"
    value: "Cặp Active-Standby"
    tone: ok
```

Ghi nhớ bốn nguyên tắc nền tảng của tầng cân bằng tải:

1. **Chọn thuật toán theo đặc tính công việc:** Dùng `Round Robin` khi các request nhẹ và đồng đều; chuyển sang `Least Connections` ngay khi thời gian thực thi biến thiên lớn hoặc giữ kết nối dài; dùng `Weighted` khi pha trộn nhiều cỡ máy.
2. **Health Check có chừng mực:** Kiểm tra cả kết nối phụ thuộc quan trọng, đặt Timeout vài giây và yêu cầu thất bại liên tiếp nhiều lần trước khi rút máy để không loại nhầm máy đang bận.
3. **Không để Load Balancer thành SPOF:** Luôn ghép tối thiểu cặp Active-Standby có Heartbeat và Virtual IP trải qua hai vùng khả dụng.
4. **Chọn đúng tầng giao thức:** Ưu tiên Layer 7 cho Web/Microservices cần định tuyến theo URL, header và giải mã TLS; dùng Layer 4 cho giao thức TCP/UDP thuần cần thông lượng cực cao.
