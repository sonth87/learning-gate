## 1. Vì sao cấu hình IP tĩnh sụp đổ khi instance thay đổi liên tục

```step
category: SETUP
short: Địa chỉ IP cũ
scene: s2-stale-ip
callout:
  kind: watch-out
  title: IP trên cloud là tạm thời
  vi: "Trong môi trường container và autoscaling, instance mới luôn nhận địa chỉ IP mới. Giữ danh sách IP tĩnh khiến một nửa hoặc toàn bộ lời gọi rơi vào địa chỉ chết."
whatChanged:
  - "~ Payments A bị thay thế bằng instance mới mang IP khác"
  - "~ Orders vẫn giữ IP cũ nên 50% lời gọi thanh toán trả lỗi"
telemetry:
  - label: "Tỉ lệ lỗi gọi Payments"
    value: "50%"
    tone: bad
  - label: "Số instance sống"
    value: "2 / 2"
    tone: ok
  - label: "IP cũ còn phản hồi"
    value: "0"
    tone: bad
```

Khi chỉ có hai service cố định là Orders và Payments, kỹ sư thường cấu hình thẳng địa chỉ IP của Payments vào biến môi trường của Orders. Cách làm này hoạt động trên máy đơn nhưng lập tức gặp sự cố trên môi trường cloud.

Mỗi lần triển khai phiên bản mới, nâng cấp máy chủ hay autoscale, container cũ bị hủy và container mới được tạo ở một địa chỉ IP khác. Nếu Payments A đổi từ `10.0.1.4` sang `10.0.1.9` mà Orders không hay biết, một nửa lưu lượng gửi tới `10.0.1.4` sẽ bị từ chối kết nối hoặc treo đến hết thời gian chờ.

## 2. Service Registry và Heartbeat: danh bạ sống của hệ thống

```step
category: TECHNIQUE
short: Registry & Beat
scene: s3-registry
callout:
  kind: key-idea
  title: Tự đăng ký và gia hạn TTL
  vi: "Service Registry giữ bản đồ tên service sang danh sách IP đang khỏe. Instance gửi Heartbeat định kỳ; thiếu liên tiếp vài nhịp là bị gỡ khỏi danh bạ."
whatChanged:
  - "+ Bật Service Registry làm danh bạ trung tâm cho Orders và Payments"
  - "+ Payments A và B tự đăng ký IP và gửi Heartbeat mỗi 5 giây"
telemetry:
  - label: "Tỉ lệ lỗi do IP cũ"
    value: "0%"
    tone: ok
  - label: "Chu kỳ Heartbeat"
    value: "5 s (TTL 15 s)"
    tone: ok
```

Để Orders không phải đoán địa chỉ IP, hệ thống đưa vào **Service Registry** (ví dụ Consul, etcd hoặc Eureka). Cơ chế vận hành gồm ba bước:

1. **Đăng ký khi khởi động:** Instance Payments mới bật lên sẽ tự gửi tên service, IP và cổng tới Registry.
2. **Duy trì bằng Heartbeat:** Instance gửi tín hiệu sống định kỳ (ví dụ mỗi 5 giây). Nếu quá thời hạn TTL (thường bằng 3 nhịp, tức 15 giây) mà không thấy tín hiệu, Registry tự động xóa IP đó khỏi danh sách khả dụng.
3. **Tra cứu động:** Orders hỏi Registry (hoặc nhận thông báo đẩy) để lấy danh sách IP mới nhất trước khi gửi request.

## 3. Client-side Discovery, Server-side Discovery và bẫy DNS TTL

```step
category: MECHANISM
short: Client vs LB
scene: s3-registry
callout:
  kind: good-to-know
  title: Chọn giữa Client-side và Server-side
  vi: "Client-side giảm một chặng mạng trung gian nhưng buộc mỗi service phải nhúng thư viện discovery. Server-side đẩy việc tra cứu về Load Balancer nội bộ."
whatChanged:
  - "~ So sánh luồng gọi trực tiếp từ Orders và luồng đi qua Load Balancer"
telemetry:
  - label: "Hop mạng Client-side"
    value: "1 hop (trực tiếp)"
    tone: ok
  - label: "Hop mạng Server-side"
    value: "2 hop (qua LB)"
    tone: warn
```

Có hai mô hình dùng Service Registry phổ biến:

| Tiêu chí | Client-side Discovery | Server-side Discovery |
|---|---|---|
| Cách hoạt động | Service gọi tự đọc Registry và tự chọn IP bằng thuật toán cục bộ | Service gọi gửi tới một Load Balancer nội bộ; LB tra cứu Registry |
| Độ trễ mạng | Ít hơn 1 hop mạng | Thêm 1 hop qua Load Balancer |
| Chi phí mã nguồn | Phải tích hợp SDK discovery vào mọi ngôn ngữ lập trình | Client chỉ gọi một địa chỉ ảo, độc lập ngôn ngữ |

Nhiều đội ngũ chọn dùng bản ghi DNS nội bộ để làm discovery cho đơn giản, nhưng lại vướng giới hạn của **DNS TTL**. Do hệ điều hành và runtime (như JVM) thường lưu cache DNS rất lâu bất chấp TTL ngắn, khi một instance chết, client vẫn có thể gửi nhầm request vào IP cũ trong nhiều phút.

## 4. Mô phỏng thực tế: điểm nghẽn khi một instance rời cụm

```step
category: PROBLEM
short: Mất instance
scene: s4-live-churn
live: discovery-churn
activity: S5-04.A1
gate: optional
callout:
  kind: watch-out
  title: Công suất còn lại sau khi gỡ IP chết
  vi: "Service Registry giúp tránh gọi nhầm vào IP chết, nhưng toàn bộ lưu lượng sẽ dồn sang các instance còn sống. Nếu thiếu headroom, instance còn lại sẽ quá tải."
whatChanged:
  - "~ Ở giây 18, Payments A ngừng hoạt động và bị gỡ khỏi Registry"
  - "~ Toàn bộ 1.500 req/s dồn sang Payments B (năng lực 1.200 req/s)"
telemetry:
  - label: "Tải đầu vào"
    value: "1.500 req/s"
  - label: "Năng lực Payments B"
    value: "1.200 req/s"
    tone: warn
```

Trong mô phỏng này, Orders nhận ổn định `1.500 req/s` và chia đều cho Payments A và Payments B (mỗi node có năng lực `1.200 req/s`, mức sử dụng `ρ = 0,63`). Tại giây thứ 18, Payments A dừng hoạt động để thay thế.

Nhờ Service Registry, Orders ngừng gửi request vào Payments A. Tuy nhiên, toàn bộ `1.500 req/s` lập tức chuyển sang Payments B, đẩy mức sử dụng của Payments B vượt `1,00` và tạo hàng đợi tăng dần. Hãy quan sát biểu đồ để dự đoán node quá tải và xác định điểm nghẽn ở bài tập kế tiếp.

## 5. Readiness Check, Slow-Start và Connection Draining

```step
category: TECHNIQUE
short: Readiness
scene: s5-readiness
activity: S5-04.A2
gate: optional
callout:
  kind: key-idea
  title: Liveness khác với Readiness
  vi: "Tiến trình đã chạy (Liveness) chưa chắc đã sẵn sàng nhận tải (Readiness). Phải chờ nạp xong cache và pool kết nối mới mở cổng nhận traffic."
whatChanged:
  - "+ Bật Readiness Check chặn traffic vào Payments A khi mới khởi động"
  - "+ Áp dụng Slow-Start tăng dần tải và Draining khi tắt instance cũ"
telemetry:
  - label: "Lỗi lúc khởi động"
    value: "0%"
    tone: ok
  - label: "Lỗi lúc tắt máy"
    value: "0%"
    tone: ok
```

Khi instance mới thay thế cho Payments A vừa bật lên, nếu Registry đưa ngay 50% lưu lượng vào nó, một loạt lỗi sẽ xảy ra vì kết nối DB chưa mở hoặc bộ nhớ đệm còn rỗng. Quy trình chuẩn dùng ba lớp bảo vệ vòng đời instance:

- **Readiness Check:** Khác với Liveness (chỉ hỏi tiến trình còn sống không), Readiness trả lời câu hỏi instance đã nạp đủ cấu hình và sẵn sàng phục vụ chưa. Chưa đạt Readiness thì Registry giữ nó ngoài danh sách.
- **Slow-Start:** Sau khi đạt Readiness, Load Balancer hoặc client tăng dần tỉ lệ traffic từ 5% lên 100% trong vài chục giây để trình biên dịch JIT và cache kịp làm nóng.
- **Connection Draining:** Khi chuẩn bị tắt instance cũ, Registry đánh dấu ngừng nhận request mới nhưng giữ tiến trình sống thêm 15–30 giây để xử lý nốt các request đang chạy dở.

## 6. Service Registry đa node, Service Mesh và API Gateway

```step
category: RECAP
short: Gateway & Mesh
scene: s6-quorum
callout:
  kind: good-to-know
  title: Tách bạch North-South và East-West
  vi: "API Gateway lo giao tiếp từ ngoài vào (North-South); Service Mesh lo giao tiếp giữa các service nội bộ (East-West) qua sidecar proxy."
whatChanged:
  - "+ Chạy Service Registry 3 node theo Quorum, chịu được mất 1 node"
  - "+ Phân định API Gateway ở rìa và Sidecar Proxy cho lưu lượng nội bộ"
telemetry:
  - label: "Độ sẵn sàng Registry"
    value: "2 / 3 node (Quorum)"
    tone: ok
  - label: "Bảo vệ biên"
    value: "API Gateway"
    tone: ok
```

Nếu Service Registry chỉ có 1 máy chủ, chính nó sẽ trở thành điểm lỗi đơn. Thực tế luôn triển khai cụm **3 hoặc 5 node** dùng thuật toán đồng thuận (như Raft); cụm 3 node vẫn đọc ghi bình thường khi mất 1 node vì vẫn giữ được đa số 2/3.

Khi số lượng service tăng lên hàng chục, việc mỗi đội tự viết code retry, timeout và mã hóa mTLS trở nên lặp lại và dễ sai. **Service Mesh** (như Istio hoặc Linkerd) gắn một **Sidecar Proxy** chạy cạnh mỗi instance để gánh toàn bộ hạ tầng giao tiếp nội bộ (**East-West**). Trong khi đó, **API Gateway** đứng ở rìa hệ thống (**North-South**) để lo xác thực người dùng, giới hạn tốc độ (Rate Limit), kết thúc TLS và định tuyến từ ngoài vào đúng service.
