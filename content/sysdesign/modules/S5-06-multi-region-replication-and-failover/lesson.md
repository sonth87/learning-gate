## 1. Active-Passive so với Active-Active trong kiến trúc đa vùng

```step
category: SETUP
short: Hai mô hình
scene: s1-setup
callout:
  kind: key-idea
  title: Chọn giữa đơn giản và độ trễ thấp
  vi: "Active-Passive giữ một vùng làm Primary duy nhất để tránh xung đột dữ liệu. Active-Active cho phép nhiều vùng cùng nhận ghi gần người dùng nhưng phải giải quyết xung đột."
whatChanged:
  - "+ Dựng hai vùng Region A (Primary) và Region B (Replica) qua Global Router"
  - "~ Chi phí hạ tầng và băng thông liên vùng tăng gấp đôi so với một vùng"
telemetry:
  - label: "RTT liên vùng"
    value: "100 ms"
    tone: warn
  - label: "Chi phí mặc định"
    value: "2,45 USD/giờ"
```

Khi ứng dụng chỉ chạy ở một vùng địa lý (Single-Region), sự cố mất điện hoặc đứt cáp quang tại vùng đó sẽ làm toàn bộ dịch vụ ngừng hoạt động. Triển khai **Multi-Region** đặt bản sao hệ thống ở ít nhất hai khu vực địa lý tách biệt để vừa chịu lỗi cấp vùng vừa phục vụ người dùng ở gần hơn.

Hai mô hình phổ biến nhất là:
- **Active-Passive:** Chỉ Region A nhận lệnh ghi chính; Region B chạy bản sao để đọc cục bộ và sẵn sàng tiếp quản khi Region A gặp sự cố.
- **Active-Active:** Cả hai vùng cùng nhận cả đọc lẫn ghi cục bộ để giảm độ trễ cho người dùng ở hai châu lục, đổi lại phải xử lý xung đột khi hai nơi sửa cùng một bản ghi.

## 2. Giới hạn vật lý: RTT liên vùng và chi phí ghi đồng bộ

```step
category: PROBLEM
short: RTT liên vùng
scene: s2-rtt
activity: S5-06.A2
gate: optional
callout:
  kind: watch-out
  title: Không thể vượt qua tốc độ ánh sáng
  vi: "Ghi đồng bộ xuyên vùng buộc mọi giao dịch phải chờ thêm ít nhất 100 ms khứ hồi qua đại dương, đẩy p99 của thao tác ghi tăng vọt."
whatChanged:
  - "~ Đường ghi xuyên vùng appb-dba chịu độ trễ vật lý RTT = 100 ms"
  - "~ Đọc tại Replica Region B nhanh tại chỗ nhưng gặp Replication Lag"
telemetry:
  - label: "Độ trễ sàn ghi xuyên vùng"
    value: "≥ 100 ms"
    tone: bad
  - label: "Đọc nội vùng Replica"
    value: "~5 ms (có Lag)"
    tone: ok
```

Nếu chọn sao chép **đồng bộ (Synchronous)** từ Region A sang Region B để đạt RPO = 0, mọi lệnh ghi ở Region A phải đợi gói tin đi sang Region B và quay về (`RTT = 100 ms`) trước khi trả lời thành công. Với các ứng dụng cần phản hồi nhanh, ngưỡng sàn 100 ms là cái giá quá đắt.

Ngược lại, nếu dùng sao chép **bất đồng bộ (Asynchronous)**, thao tác ghi tại vùng chính rất nhanh nhưng bản sao ở Region B luôn trễ hơn một khoảng **Replication Lag**. Người dùng vừa ghi ở Primary rồi đọc ngay tại Replica có thể thấy dữ liệu cũ, vi phạm bảo đảm Read-Your-Writes.

## 3. Mô phỏng sự cố: Region A ngừng hoạt động và Failover sang Region B

```step
category: PROBLEM
short: Failover vùng
scene: s3-live-failover
live: region-failover
activity: S5-06.A3
gate: optional
callout:
  kind: watch-out
  title: Công suất dự phòng khi mất một vùng
  vi: "Khi Region A ngừng hoạt động, Global Router dồn 100% lưu lượng sang Region B. Nếu Region B thiếu công suất dự phòng, hệ thống vẫn sập dây chuyền."
whatChanged:
  - "~ Ở giây 20, Region A ngừng hoạt động, lưu lượng dồn sang Region B"
  - "~ App Region B chỉ có 1 instance (1.500 req/s) nên quá tải trước 2.000 req/s"
telemetry:
  - label: "Tải sau failover"
    value: "2.000 req/s"
  - label: "Năng lực App B mặc định"
    value: "1.500 req/s"
    tone: bad
```

Trong mô phỏng này, hệ thống nhận `2.000 req/s` chia đều cho Region A và Region B. Tại giây thứ 20, cụm App Region A gặp sự cố và ngừng phục vụ.

Global Router lập tức chuyển toàn bộ `2.000 req/s` sang App Region B. Tuy nhiên, App Region B mặc định chỉ chạy 1 instance (`μ = 1.500 req/s`), còn đường `appb-dba` đang bật Retry không có Backoff và trả lỗi cứng. Hãy quan sát biểu đồ và thực hành bài tập tìm giới hạn tải trước khi nâng cấp cấu hình.

## 4. Xung đột ghi đồng thời khi chạy Active-Active

```step
category: TECHNIQUE
short: Xung đột ghi
scene: s4-conflict
activity: S5-06.A1
gate: optional
callout:
  kind: compare
  title: Tránh mất dữ liệu khi hai vùng cùng ghi
  vi: "Last-Write-Wins dễ mất dữ liệu do lệch đồng hồ; hãy dùng CRDT hoặc định tuyến mỗi người dùng về một vùng sở hữu (Home Region)."
whatChanged:
  - "+ Global Router cắt vùng A hỏng và đẩy toàn bộ lưu lượng sang vùng B"
  - "+ Tăng App Region B và cấu hình Backoff + Jitter cho đường xuyên vùng"
telemetry:
  - label: "Chi phí sau nâng cấp"
    value: "2,80 USD/giờ"
    tone: ok
  - label: "Lỗi khi mất Region A"
    value: "≤ 1%"
    tone: ok
```

Khi xảy ra chia cắt mạng giữa hai vùng trong mô hình Active-Active, cả hai bên có thể nhận ghi vào cùng một bản ghi và tạo ra **xung đột ghi đồng thời**. Cách giải quyết đơn giản là **Last-Write-Wins (LWW)** dựa vào timestamp, nhưng đồng hồ máy chủ luôn có độ lệch nên dễ ghi đè nhầm bản ghi mới hơn. An toàn hơn là dùng **CRDT** cho các dữ liệu cộng dồn hoặc gắn mỗi người dùng vào một vùng chính (Home Region).

## 5. Global Routing, RTO và bài toán chi phí liên vùng

```step
category: TECHNIQUE
short: Routing & Phí
scene: s4-conflict
callout:
  kind: good-to-know
  title: Theo dõi cước truyền dữ liệu liên vùng
  vi: "GeoDNS TTL ngắn hoặc Anycast IP giúp hạ RTO xuống vài giây, nhưng nhân đôi hạ tầng kèm phí truyền dữ liệu liên vùng có thể đội chi phí lên 2–3 lần."
whatChanged:
  - "~ Cân bằng giữa mục tiêu RTO/RPO và chi phí hạ tầng đa vùng"
telemetry:
  - label: "RTO với Anycast"
    value: "Vài giây"
    tone: ok
  - label: "Chi phí Multi-Region"
    value: "2–3× một vùng"
    tone: warn
```

Về vận hành, **Global Routing** (GeoDNS TTL ngắn hoặc Anycast IP) giúp hạ thời gian phục hồi RTO xuống vài giây, nhưng cần tính kỹ **chi phí theo giờ**: nhân đôi máy chủ kèm phí truyền dữ liệu liên vùng (Cross-region Transfer) có thể đội ngân sách lên gấp 2–3 lần so với một vùng.

## 6. Tổng kết kiến trúc đa vùng và Failover

```step
category: RECAP
short: Tổng kết
scene: s1-setup
callout:
  kind: key-idea
  title: Dự phòng đủ công suất và kiểm soát Retry
  vi: "Một kiến trúc Multi-Region chỉ thực sự an toàn khi vùng dự phòng đủ năng lực gánh tải failover và các kết nối xuyên vùng có Backoff + Jitter."
whatChanged:
  - "~ Tóm tắt đánh đổi giữa RTO, RPO, độ trễ và chi phí đa vùng"
telemetry:
  - label: "Nguyên tắc Failover"
    value: "Đủ headroom"
    tone: ok
  - label: "Bảo vệ liên vùng"
    value: "Backoff + Jitter"
    tone: ok
```

Thiết kế đa vùng luôn là sự cân bằng giữa RPO, RTO, độ trễ vật lý và ngân sách. Hãy đảm bảo vùng dự phòng luôn có đủ công suất chịu tải khi mất vùng chính và kiểm soát chặt chẽ retry trên các đường truyền xuyên vùng.
