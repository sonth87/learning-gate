## 1. Biết thay đổi an toàn trước khi người dùng phát hiện

```step
category: SETUP
short: Mục tiêu test
scene: s1-manual-gap
callout:
  kind: key-idea
  title: Tốc độ phản hồi và độ tin cậy
  vi: "Kiểm thử tự động trả lời câu hỏi thay đổi mới có an toàn không trước khi khách hàng gặp lỗi. Chi phí sửa lỗi tăng theo cấp số nhân nếu lọt ra production."
whatChanged:
  - "+ Đội ngũ chỉ bấm thử tay vài ca chuẩn trước khi phát hành"
  - "~ Lỗi làm tròn tiền tệ ở ca biên lọt qua và khách hàng phát hiện"
telemetry:
  - label: "Phản hồi thủ công"
    value: "Chậm · Dễ sót"
    tone: warn
  - label: "Tỉ lệ lọt lỗi"
    value: "Cao"
    tone: bad
```

Khi hệ thống còn nhỏ, lập trình viên có thể bấm thử vài thao tác trên trình duyệt trước khi phát hành. Nhưng khi số lượng tính năng và thành viên tăng lên, kiểm thử thủ công trở nên chậm chạp và dễ bỏ sót các trường hợp biên (edge cases) như làm tròn số thập phân, múi giờ hoặc đơn hàng rỗng.

Mục tiêu của kiểm thử tự động là cung cấp tín hiệu **nhanh và đáng tin** ngay trên máy lập trình viên hoặc trong CI, để lỗi được chặn trước khi gộp mã nguồn.

## 2. Unit Test và Test Doubles: cô lập logic thuần túy

```step
category: TECHNIQUE
short: Unit & Doubles
scene: s2-unit-doubles
callout:
  kind: technique
  title: Cô lập bằng Test Double
  vi: "Unit Test chỉ kiểm tra một hàm hoặc một lớp logic thuần túy. Mọi phụ thuộc ngoài (cổng thanh toán, đồng hồ, mạng) được thay bằng Test Double."
whatChanged:
  - "+ Tách hàm tính thuế/làm tròn chạy cô lập dưới 10 ms mỗi test"
  - "+ Thay cổng thanh toán thật bằng Payment Test Double (Stub/Fake)"
telemetry:
  - label: "Thời gian chạy"
    value: "< 10 ms / test"
    tone: ok
  - label: "Phụ thuộc mạng"
    value: "Không"
    tone: ok
```

**Unit Test** kiểm tra đơn vị nhỏ nhất của logic nghiệp vụ (ví dụ hàm tính chiết khấu và làm tròn tiền tệ) mà không cần khởi động Database hay gọi mạng.

Để cô lập, ta dùng **Test Doubles**:
- **Stub:** trả về giá trị cố định (ví dụ `payment.charge()` luôn trả `SUCCESS`) để kiểm nhánh thành công hoặc lỗi.
- **Fake:** bản cài đặt nhẹ chạy trong RAM (ví dụ `InMemoryOrderRepo`) giữ được hành vi cơ bản mà không cần ổ đĩa.
- **Mock:** ghi nhận xem hàm phụ thuộc có được gọi đúng số lần và đúng tham số hay không.

Lưu ý: đừng lạm dụng Mock cho mọi thứ. Mock quá sâu vào chi tiết nội bộ khiến test dễ gãy mỗi khi tái cấu trúc code dù hành vi đúng không đổi.

## 3. Integration Test với Database thật trong container

```step
category: MECHANISM
short: Integration Test
scene: s3-integration-container
callout:
  kind: watch-out
  title: Mock không bắt được lỗi SQL
  vi: "Unit Test có thể xanh toàn bộ nhưng lên môi trường thật vẫn lỗi vì sai kiểu cột, thiếu migration hoặc truy vấn SQL sai cú pháp."
whatChanged:
  - "+ Dựng PostgreSQL thật trong Docker container (Testcontainers) trên CI"
  - "~ Kiểm chứng truy vấn, ràng buộc khóa ngoại và làm tròn DECIMAL"
telemetry:
  - label: "Database kiểm thử"
    value: "Postgres Container"
    tone: ok
  - label: "Thời gian chạy"
    value: "Vài giây"
    tone: warn
```

Một hàm tính toán có thể pass 100% Unit Test, nhưng khi lưu xuống PostgreSQL lại bị cắt số thập phân vì cột định nghĩa là `INTEGER` thay vì `NUMERIC(12,2)`. Đây là lỗ hổng mà Test Double không thể phát hiện.

**Integration Test** giải quyết khoảng trống này bằng cách chạy thành phần thật (Database, Redis, Kafka) trong container Docker tạm thời (như Testcontainers) ngay trong pipeline CI. Sau khi chạy xong bộ test, container tự hủy, đảm bảo mỗi lần chạy đều sạch sẽ và lặp lại được.

## 4. Contract Testing giữa các đội microservice

```step
category: TECHNIQUE
short: Contract Test
scene: s4-contract-testing
callout:
  kind: good-to-know
  title: Khớp API không cần E2E nặng nề
  vi: "Contract Testing (Consumer-Driven) đảm bảo đội gọi và đội cung cấp API luôn khớp schema mà không cần dựng đồng thời hàng chục microservice."
whatChanged:
  - "+ Order (Consumer) ghi nhận schema mong đợi vào file Contract"
  - "+ Payment (Provider) chạy xác minh Contract ngay trên CI của mình"
telemetry:
  - label: "Phạm vi"
    value: "Biên giới 2 đội"
    tone: ok
  - label: "Phát hiện lệch API"
    value: "Trước khi merge"
    tone: ok
```

Khi đội Payment đổi tên trường `amount_cents` thành `total_cents`, mọi Unit Test của Order Service dùng Mock cũ vẫn xanh, nhưng lên staging sẽ gãy. Dựng toàn bộ môi trường End-to-End để bắt lỗi này thì quá chậm và tốn kém.

Với **Consumer-Driven Contract Testing** (như Pact):
1. Đội gọi (Consumer) định nghĩa hợp đồng gồm request mẫu và cấu trúc response tối thiểu cần có, đẩy lên Contract Broker.
2. Đội cung cấp (Provider) tự động tải hợp đồng đó về chạy kiểm chứng trên CI của mình. Nếu PR mới làm đổi tên trường khiến hợp đồng gãy, CI chặn ngay trước khi merge.

## 5. Tháp Kiểm thử (Test Pyramid) và xử lý Flaky Test

```step
category: MECHANISM
short: Tháp kiểm thử
scene: s5-test-pyramid
activity: S6-11.A1
gate: optional
callout:
  kind: key-idea
  title: Flaky Test là nợ kỹ thuật
  vi: "Tháp chuẩn có đáy rộng (Unit), giữa vừa (Integration/Contract), đỉnh hẹp (E2E). Mọi Flaky Test phải được cách ly và sửa ngay để giữ niềm tin vào CI."
whatChanged:
  - "+ Sắp xếp 4 tầng test theo tốc độ phản hồi và chi phí bảo trì"
  - "~ Cảnh báo thói quen bấm chạy lại khi gặp Flaky Test"
telemetry:
  - label: "Đáy tháp"
    value: "70% Unit Test"
    tone: ok
  - label: "Đỉnh tháp"
    value: "≤ 10% E2E Test"
    tone: warn
```

Nếu đảo ngược tháp (ít Unit Test, nhồi hàng trăm E2E Test qua trình duyệt), bộ CI sẽ mất hàng giờ để chạy và thường xuyên báo đỏ giả vì trễ mạng hoặc animation UI.

**Flaky Test** (test lúc xanh lúc đỏ dù không đổi code) thường xuất phát từ việc phụ thuộc đồng hồ hệ thống, thứ tự bất đồng bộ hoặc dùng chung dữ liệu giữa các test chạy song song. Nếu đội ngũ quen bấm "chạy lại" cho qua, họ sẽ sớm bỏ qua cả lỗi thật. Nguyên tắc đúng là cách ly (quarantine) test chập chờn và sửa triệt để nguyên nhân gốc.

## 6. Load Test và Chaos / Fault Injection Test

```step
category: TECHNIQUE
short: Load & Chaos
scene: s6-flaky-and-load
callout:
  kind: technique
  title: Kiểm thử ngoài tính đúng đắn
  vi: "Test chức năng chỉ chứng minh hệ thống chạy đúng với 1 người dùng. Load Test và Chaos Test chứng minh hệ thống đứng vững khi đông người và khi có lỗi."
whatChanged:
  - "+ Phân biệt 4 bài test phi chức năng: Baseline, Stress/Spike, Soak, Chaos"
  - "~ Kiểm chứng Timeout, Retry và Circuit Breaker dưới lỗi giả lập"
telemetry:
  - label: "Soak Test"
    value: "8–24 giờ liên tục"
  - label: "Chaos Test"
    value: "Tiêm lỗi chủ động"
    tone: warn
```

Trước các đợt cao điểm hoặc khi thay đổi kiến trúc mạng, cần bổ sung hai nhóm kiểm thử phi chức năng:
- **Load Test:** gồm *Baseline* (đo p50/p99 chuẩn), *Stress/Spike* (tăng tải tìm điểm gãy và độ trễ Autoscaling) và *Soak Test* (chạy tải cao 8–24 giờ để phát hiện rò rỉ bộ nhớ hoặc cạn connection pool).
- **Chaos / Fault Injection Test:** chủ động làm chậm hoặc ngắt một phụ thuộc (như Payment Gateway hoặc một Redis node) để kiểm chứng Timeout, Retry có Backoff và Circuit Breaker hoạt động đúng thiết kế.

## 7. Tổng kết: chiến lược kiểm thử thực dụng

```step
category: RECAP
short: Tổng kết
scene: s3-integration-container
callout:
  kind: key-idea
  title: Đặt đúng test vào đúng chỗ
  vi: "Nhiều Unit Test cho logic, Integration Test với container thật cho DB, Contract Test cho ranh giới giữa các đội, và ít E2E cho luồng trọng yếu."
whatChanged:
  - "~ Kết hợp đủ 4 tầng kiểm thử cùng Load/Chaos Test định kỳ"
telemetry:
  - label: "Phản hồi nhanh"
    value: "Unit + Contract"
    tone: ok
  - label: "Độ tin cậy thật"
    value: "Integration + Chaos"
    tone: ok
```

Một chiến lược kiểm thử bền vững không phải là viết thật nhiều E2E Test, mà là phân bổ hợp lý:
- **Unit Test** (mili-giây) bảo vệ mọi nhánh logic tính toán.
- **Integration Test** (vài giây) kiểm chứng truy vấn SQL và migration trên container thật.
- **Contract Test** giữ ổn định giao tiếp API giữa các đội độc lập.
- **E2E, Load & Chaos Test** bảo vệ các hành trình cốt lõi và khả năng chịu tải của toàn hệ thống.
