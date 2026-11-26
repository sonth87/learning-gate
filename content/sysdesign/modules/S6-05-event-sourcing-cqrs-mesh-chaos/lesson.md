## 1. Event Sourcing: Lưu chuỗi sự kiện thay vì chỉ lưu trạng thái cuối

```step
category: SETUP
short: Event Sourcing
scene: s1-events
callout:
  kind: key-idea
  title: Nhật ký bất biến (Append-only)
  vi: "Thay vì ghi đè số dư hiện tại, Event Sourcing lưu từng biến cố theo thứ tự thời gian. Trạng thái hiện tại là kết quả cộng dồn khi phát lại (Replay) chuỗi sự kiện."
whatChanged:
  - "+ Lưu chuỗi sự kiện bất biến: Created → Deposited → Withdrawn"
  - "~ Dựng lại trạng thái tại bất kỳ thời điểm quá khứ nào (Time Travel)"
telemetry:
  - label: "Kiểu ghi"
    value: "Append-only"
    tone: ok
  - label: "Đánh đổi"
    value: "Tăng độ phức tạp schema"
    tone: warn
```

Trong cơ sở dữ liệu truyền thống, cập nhật số dư tài khoản từ 500 lên 1.000 sẽ ghi đè giá trị cũ, làm mất hoàn toàn lịch sử vì sao có con số đó. **Event Sourcing** giải quyết bằng cách chỉ ghi nối tiếp các sự kiện đã xảy ra: `UserCreated`, `MoneyDeposited(500)`, `MoneyWithdrawn(200)`, `MoneyDeposited(700)`.

Ưu điểm lớn nhất là **dấu vết kiểm toán (Audit Trail) đầy đủ**, khả năng tua ngược thời gian để gỡ lỗi và dễ dàng tạo thêm các góc nhìn dữ liệu mới từ cùng một dòng sự kiện. Ngược lại, nó làm tăng dung lượng lưu trữ, đòi hỏi xử lý tiến hóa schema sự kiện cẩn thận và không phù hợp cho ứng dụng CRUD đơn giản.

## 2. CQRS: Tách riêng mô hình ghi và mô hình đọc

```step
category: MECHANISM
short: CQRS Projection
scene: s2-cqrs
callout:
  kind: compare
  title: Tối ưu độc lập hai chiều đọc và ghi
  vi: "Đường ghi cần chuẩn hóa và kiểm tra ràng buộc nghiệp vụ; đường đọc cần truy vấn nhanh trên dữ liệu đã phi chuẩn hóa (Projection)."
whatChanged:
  - "+ Tách Write API → Event Log → Projector → Read DB"
  - "~ Read API đọc trực tiếp từ Read DB đã phi chuẩn hóa"
telemetry:
  - label: "Độ trễ đồng bộ"
    value: "Eventual Consistency"
    tone: warn
  - label: "Hiệu năng đọc"
    value: "Không cần JOIN phức tạp"
    tone: ok
```

Ở nhiều hệ thống có tỉ lệ đọc vượt xa ghi, dùng chung một mô hình dữ liệu buộc trang chi tiết phải thực hiện nhiều phép `JOIN` tốn kém. **CQRS (Command Query Responsibility Segregation)** tách đôi hệ thống:

- **Write Side:** `Write API` xác thực quy tắc nghiệp vụ và ghi sự kiện vào `Event Log`.
- **Read Side:** `Projector` đọc sự kiện bất đồng bộ để cập nhật `Read DB` (dạng bảng phẳng tối ưu cho truy vấn), còn `Read API` chỉ việc đọc trực tiếp.

Cái giá phải trả là **nhất quán cuối (Eventual Consistency)**: giữa lúc ghi xong ở `Event Log` và lúc `Projector` cập nhật xong `Read DB` luôn tồn tại một độ trễ (Lag).

## 3. Service Mesh: Đưa logic mạng xuống tầng Sidecar Proxy

```step
category: TECHNIQUE
short: Service Mesh
scene: s3-mesh
callout:
  kind: technique
  title: Tách hạ tầng khỏi mã nghiệp vụ
  vi: "Thay vì mỗi microservice tự viết lại mã Retry, Circuit Breaker và mTLS bằng nhiều ngôn ngữ khác nhau, Sidecar Proxy đứng cạnh mỗi container sẽ đảm nhận đồng nhất."
whatChanged:
  - "+ Gắn Sidecar Proxy chặn toàn bộ lưu lượng vào/ra của mỗi dịch vụ"
  - "~ Control Plane phân phối chính sách mTLS, Timeout và Circuit Breaker"
telemetry:
  - label: "Bảo mật nội bộ"
    value: "mTLS tự động"
    tone: ok
  - label: "Chi phí phụ trội"
    value: "Thêm 1 hop proxy"
    tone: warn
```

Khi hệ thống phình lên hàng chục microservice viết bằng nhiều ngôn ngữ khác nhau, việc đồng bộ cấu hình Timeout, Retry, Circuit Breaker và mã hóa mTLS trong từng thư viện ứng dụng trở thành gánh nặng bảo trì.

**Service Mesh** giải quyết bằng kiến trúc hai mặt phẳng:
- **Data Plane:** Các **Sidecar Proxy** (như Envoy) chạy song hành cùng từng instance dịch vụ, chặn mọi gói tin để thực thi cân bằng tải, ngắt mạch, thử lại có Jitter và thu thập Distributed Trace.
- **Control Plane:** Quản lý tập trung quy tắc định tuyến (Canary, chia tỉ lệ lưu lượng) và cấp phát chứng chỉ mTLS.

Đánh đổi của Service Mesh là tăng độ phức tạp vận hành và thêm độ trễ xử lý qua lớp proxy, nên không cần thiết với hệ thống nhỏ dưới 10 dịch vụ.

## 4. Chaos Engineering: Chủ động tiêm lỗi để đo phạm vi ảnh hưởng

```step
category: PROBLEM
short: Tiêm lỗi Chaos
scene: s4-chaos-live
live: chaos
activity: S6-05.A1
gate: required
callout:
  kind: watch-out
  title: Kiểm chứng giả thuyết chịu lỗi
  vi: "Đừng đợi sự cố xảy ra mới biết cơ chế dự phòng có hoạt động hay không. Tiêm lỗi có kiểm soát giúp lộ rõ điểm yếu và đo Blast Radius."
whatChanged:
  - "~ Tại t = 18 s: Tiêm lỗi chậm +450 ms vào Projector"
  - "~ Theo dõi hàng đợi Event Log dồn ứ và độ trễ lan truyền"
telemetry:
  - label: "Mốc tiêm lỗi"
    value: "t = 18 s (Slowdown)"
    tone: warn
  - label: "Nguyên tắc vàng"
    value: "Giới hạn Blast Radius"
    tone: ok
```

**Chaos Engineering** là phương pháp chủ động tiêm lỗi vào hệ thống đang chạy (tắt instance, làm chậm mạng, chia cắt liên kết) dựa trên một giả thuyết rõ ràng:

1. **Đặt giả thuyết trạng thái ổn định:** Ví dụ, nếu `Projector` chậm lại hoặc gặp sự cố, `Write API` vẫn phải tiếp nhận lệnh ghi bình thường nhờ bộ đệm `Event Log`, không được sập dây chuyền.
2. **Thu hẹp phạm vi ảnh hưởng (Blast Radius):** Bắt đầu trên một phân vùng nhỏ hoặc một tỉ lệ nhỏ lưu lượng trước khi mở rộng.
3. **Quan sát và rút kinh nghiệm:** Trong mô phỏng trực tiếp, khi `Projector` bị làm chậm thêm 450 ms từ giây 18, hãy quan sát xem thành phần nào chạm ngưỡng quá tải trước và luồng nào bị ảnh hưởng.

## 5. Cạm bẫy thường gặp khi áp dụng kiến trúc nâng cao

```step
category: PITFALL
short: Bẫy vận hành
scene: s2-cqrs
callout:
  kind: watch-out
  title: Đừng dùng Event Sourcing hay Service Mesh cho hệ thống nhỏ
  vi: "Độ trễ đồng bộ (Projection Lag) có thể khiến người dùng vừa tạo đơn xong nhưng tải lại trang chưa thấy. Đồng thời, thêm Sidecar Proxy làm tăng độ trễ và độ phức tạp gỡ lỗi."
whatChanged:
  - "! Bỏ qua xử lý Read-your-own-writes gây lỗi trải nghiệm khi Projection Lag tăng"
  - "! Dùng Service Mesh khi chỉ có vài dịch vụ gây lãng phí CPU và khó vận hành"
telemetry:
  - label: "Rủi ro CQRS"
    value: "Dữ liệu đọc trễ"
    tone: warn
  - label: "Giải pháp UX"
    value: "Read-your-own-writes"
    tone: ok
```

Một số lỗi phổ biến khi triển khai các mẫu hình này:

- **Quên cơ chế Read-your-own-writes:** Khi `Projector` bị trễ, người dùng vừa cập nhật hồ sơ xong nhưng màn hình đọc vẫn hiện dữ liệu cũ. Cần trả thẳng trạng thái mới từ phản hồi ghi hoặc gắn phiên bản sự kiện để chờ đồng bộ cục bộ.
- **Thay đổi schema sự kiện không tương thích:** Event Log là bất biến nên không thể sửa lịch sử; mọi thay đổi cấu trúc sự kiện phải hỗ trợ đọc ngược các phiên bản cũ (Upcasting).

## 6. Tổng kết: Áp dụng đúng quy mô và độ trưởng thành

```step
category: RECAP
short: Tóm tắt
scene: s5-recap
activity: S6-05.A2
gate: optional
callout:
  kind: key-idea
  title: Không lạm dụng mẫu hình phức tạp
  vi: "Event Sourcing, CQRS, Service Mesh và Chaos Engineering đều mang lại sức mạnh lớn ở quy mô phân tán, nhưng đi kèm chi phí vận hành cao."
whatChanged:
  - "+ Tổng hợp điều kiện áp dụng từng kỹ thuật nâng cao"
telemetry:
  - label: "Event Sourcing"
    value: "Cần Audit & Replay"
  - label: "Chaos Testing"
    value: "Cần Monitoring tốt trước"
```

Tóm tắt tiêu chí lựa chọn bốn kỹ thuật nâng cao:

- **Event Sourcing:** Chọn khi nghiệp vụ đòi hỏi dấu vết kiểm toán chặt chẽ (tài chính, thanh toán) hoặc cần tái dựng trạng thái theo thời gian.
- **CQRS:** Chọn khi mô hình đọc và ghi chênh lệch lớn về tỉ lệ hoặc độ phức tạp truy vấn, và hệ thống chấp nhận độ trễ đồng bộ ngắn.
- **Service Mesh:** Chọn khi số lượng microservice đủ lớn, cần áp dụng mTLS và chính sách mạng đồng nhất không phụ thuộc ngôn ngữ lập trình.
- **Chaos Engineering:** Chỉ triển khai sau khi hệ thống đã có giám sát (Metrics, Logs, Traces) đầy đủ để đo chính xác tác động khi tiêm lỗi.
