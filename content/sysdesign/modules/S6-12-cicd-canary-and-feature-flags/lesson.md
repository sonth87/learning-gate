## 1. Từ triển khai thủ công đến CI/CD dựng một lần dùng nhiều môi trường

```step
category: SETUP
short: Build một lần
scene: s1-ci-pipeline
callout:
  kind: key-idea
  title: Artifact bất biến
  vi: "CI chạy kiểm thử tự động trên môi trường sạch và dựng đúng một artifact bất biến (gắn mã SHA). Cùng artifact đó được thúc đẩy từ Staging lên Production."
whatChanged:
  - "+ Thiết lập luồng CI dựng image v2.3 bất biến sau khi pass test"
  - "~ Loại bỏ lỗi chạy được trên máy cá nhân nhưng hỏng khi lên server"
telemetry:
  - label: "Artifact"
    value: "Immutable (SHA)"
    tone: ok
  - label: "Sai khác môi trường"
    value: "Không"
    tone: ok
```

Triển khai thủ công bằng cách SSH vào từng máy chủ và chạy lệnh biên dịch lại rất dễ gặp lỗi kinh điển: thiếu biến môi trường, lệch phiên bản thư viện hoặc chạy được trên máy lập trình viên nhưng không khởi động được trên server.

Với **CI (Continuous Integration)**, mỗi lần đẩy mã nguồn đều chạy build và kiểm thử trên một môi trường sạch. Khi đạt chuẩn, hệ thống đóng gói đúng **một artifact bất biến** (như Docker image gắn mã SHA) và đẩy lên Registry. **Continuous Delivery** sau đó lấy chính artifact đó để triển khai lên Staging rồi Production, chỉ thay đổi cấu hình môi trường bên ngoài.

## 2. Blue-Green Deployment: chuyển mạch 100% tức thì

```step
category: TECHNIQUE
short: Blue-Green
scene: s2-blue-green
callout:
  kind: technique
  title: Đánh đổi tài nguyên lấy tốc độ chuyển
  vi: "Blue-Green dựng hai cụm giống hệt nhau: Blue chạy bản cũ, Green chạy bản mới. Khi Green sẵn sàng, Load Balancer chuyển toàn bộ lưu lượng sang Green."
whatChanged:
  - "+ Dựng cụm Green (v2.4) song song với cụm Blue (v2.3)"
  - "~ Sẵn sàng chuyển 100% lưu lượng hoặc hoàn tác ngay tại Load Balancer"
telemetry:
  - label: "Thời gian cắt chuyển"
    value: "Tức thì"
    tone: ok
  - label: "Chi phí hạ tầng"
    value: "2× trong lúc deploy"
    tone: warn
```

Trong **Blue-Green Deployment**, cụm **Blue** đang phục vụ 100% người dùng. Đội ngũ triển khai bản mới lên cụm **Green** hoàn toàn tách biệt, chạy smoke test kiểm tra sức khỏe, rồi chuyển hướng Load Balancer sang Green.

Ưu điểm lớn nhất là thời gian gián đoạn bằng không và có thể chuyển ngược về Blue ngay lập tức nếu phát hiện lỗi. Nhược điểm là bạn phải gánh gấp đôi chi phí máy chủ trong thời gian triển khai, và mọi lỗi chỉ lộ diện khi 100% người dùng đã tràn sang Green.

## 3. Canary Rollout và tự động rollback khi vượt ngưỡng lỗi

```step
category: PROBLEM
short: Canary Rollout
scene: s3-canary-live
live: canary-rollout
activity: S6-12.A1
gate: optional
callout:
  kind: watch-out
  title: Thu hẹp bán kính ảnh hưởng
  vi: "Canary chỉ mở cho một tỉ lệ nhỏ người dùng (5% → 25% → 100%), so sánh Error Rate và p99 với cụm Stable, và tự động rollback nếu vượt ngưỡng."
whatChanged:
  - "~ t = 18 s: bản v2.4 lỗi được deploy lên nhánh Canary (25% tải)"
  - "+ t = 36 s: hệ thống tự động rollback Canary về trạng thái ổn định"
telemetry:
  - label: "App Stable (v2.3)"
    value: "Ổn định"
    tone: ok
  - label: "Canary (t = 18–36 s)"
    value: "Lỗi → Auto-rollback"
    tone: bad
```

**Canary Rollout** khắc phục nhược điểm của Blue-Green bằng cách chỉ định tuyến một phần nhỏ lưu lượng (ví dụ 5%, sau đó 25%) sang phiên bản mới `app_canary`, trong khi phần lớn vẫn nằm ở `app_stable`.

Hệ thống giám sát liên tục so sánh **Error Rate** và **p99** giữa hai nhánh. Trong mô phỏng trực tiếp, ở giây thứ 18 bản `v2.4` chứa lỗi được đẩy lên `app_canary`, làm tỉ lệ lỗi tăng vọt trên nhánh thử nghiệm. Nhờ có ngưỡng bảo vệ tự động, ở giây 36 bộ điều phối lập tức rút lưu lượng và rollback về bản ổn định mà không ảnh hưởng toàn bộ người dùng.

## 4. Di trú Database không gián đoạn: Expand-Migrate-Contract

```step
category: MECHANISM
short: Expand-Contract
scene: s4-expand-contract
activity: S6-12.A2
gate: optional
callout:
  kind: key-idea
  title: Tương thích hai chiều khi rollout
  vi: "Không bao giờ đổi tên hoặc xóa cột đang dùng trong một bước. Trong lúc rollout, cả bản cũ và bản mới đều truy vấn chung một Database."
whatChanged:
  - "+ Chia di trú cột thành 5 bước nhỏ tương thích với bản cũ"
  - "~ Chỉ xóa cột cũ (Contract) sau khi bản v2.3 đã tắt hoàn toàn"
telemetry:
  - label: "Tương thích ngược"
    value: "Giữ ở bước 1–4"
    tone: ok
  - label: "An toàn rollback"
    value: "Có"
    tone: ok
```

Nếu bạn chạy lệnh đổi tên cột `full_name` thành `display_name` trong một bước duy nhất, các instance `v2.3` đang chạy sẽ lập tức báo lỗi SQL hàng loạt và ngay cả rollback code cũng không cứu được.

Mẫu **Expand-Migrate-Contract** giải quyết triệt để vấn đề này qua nhiều lần triển khai nhỏ:
1. **Expand:** thêm cột mới `display_name` (cho phép `NULL`), giữ nguyên `full_name`.
2. **Dual-Write:** bản `v2.4` ghi cả hai cột khi có dữ liệu mới.
3. **Backfill:** chạy tác vụ nền chép dữ liệu cũ từ `full_name` sang `display_name`.
4. **Switch Read:** bản `v2.5` chuyển sang đọc từ `display_name`.
5. **Contract:** chỉ xóa `full_name` khi 100% instance cũ đã tắt hẳn.

## 5. Feature Flag: tách thời điểm Deploy khỏi Release

```step
category: TECHNIQUE
short: Feature Flag
scene: s5-feature-flags
callout:
  kind: technique
  title: Công tắc bật tắt tức thì
  vi: "Triển khai code lên server không đồng nghĩa với việc phải mở tính năng cho mọi người dùng ngay lập tức."
whatChanged:
  - "+ Bọc tính năng mới sau Feature Flag, chỉ bật cho 5% người dùng"
  - "~ Có thể tắt tính năng trong 1 giây qua cấu hình mà không cần deploy lại"
telemetry:
  - label: "Deploy vs Release"
    value: "Tách biệt"
    tone: ok
  - label: "Thời gian tắt lỗi"
    value: "< 1 giây"
    tone: ok
```

**Feature Flag** là các công tắc cấu hình động cho phép bật hoặc tắt một nhánh tính năng ngay lúc chạy mà không cần dựng lại hay triển khai lại ứng dụng.

Nhờ Feature Flag, lập trình viên có thể gộp mã nguồn nhỏ mỗi ngày lên nhánh chính (tránh xung đột code kéo dài) nhưng vẫn giữ tính năng ẩn. Khi sẵn sàng, đội sản phẩm mở dần cho nhân viên nội bộ, rồi 5% người dùng thật. Nếu có sự cố, chỉ cần gạt công tắc về `OFF` để khôi phục trong một giây. Nhớ dọn dẹp các flag cũ sau khi tính năng đã ổn định để tránh rác mã nguồn.

## 6. Đo năng lực giao hàng phần mềm với 4 chỉ số DORA

```step
category: MECHANISM
short: Chỉ số DORA
scene: s6-dora-metrics
callout:
  kind: good-to-know
  title: Cân bằng tốc độ và độ ổn định
  vi: "Bốn chỉ số DORA đo đồng thời hai mặt: tốc độ đưa thay đổi ra thị trường và khả năng giữ hệ thống ổn định, phục hồi nhanh khi có lỗi."
whatChanged:
  - "+ Trình bày 4 chỉ số DORA: Deployment Frequency, Lead Time, CFR, MTTR"
telemetry:
  - label: "Tốc độ"
    value: "Freq & Lead Time"
    tone: ok
  - label: "Ổn định"
    value: "CFR & MTTR"
    tone: ok
```

Để đánh giá quy trình CI/CD có thực sự hiệu quả hay không, các đội ngũ kỹ thuật sử dụng bộ **4 chỉ số DORA**:
- **Deployment Frequency:** tần suất đưa thay đổi lên production.
- **Lead Time for Changes:** thời gian từ lúc commit mã nguồn đến khi chạy trên production.
- **Change Failure Rate (CFR):** tỉ lệ phần trăm các lần triển khai gây sự cố phải sửa nóng hoặc rollback.
- **Time to Restore Service (MTTR):** thời gian trung bình để khôi phục dịch vụ khi xảy ra sự cố.

Một hệ thống tốt vừa giao hàng nhanh (lô nhỏ, đều đặn) vừa giữ CFR thấp và MTTR ngắn nhờ Canary Rollout và Feature Flag.

## 7. Tổng kết: quy trình phát hành an toàn

```step
category: RECAP
short: Tổng kết
scene: s1-ci-pipeline
callout:
  kind: key-idea
  title: Năm mảnh ghép phát hành hiện đại
  vi: "Artifact bất biến, Canary có tự động rollback, di trú Expand-Migrate-Contract, Feature Flag và theo dõi 4 chỉ số DORA."
whatChanged:
  - "~ Hoàn thiện chu trình đưa thay đổi lên production an toàn và hoàn tác nhanh"
telemetry:
  - label: "Triển khai"
    value: "Build Once + Canary"
    tone: ok
  - label: "Khôi phục"
    value: "Auto-rollback + Flag"
    tone: ok
```

Hãy ghi nhớ năm nguyên tắc khi thiết kế pipeline phát hành:
- **Build once, promote everywhere** bằng artifact bất biến gắn mã SHA.
- Dùng **Canary Rollout** (hoặc **Blue-Green** khi cần cắt chuyển tức thì) kèm ngưỡng **tự động rollback**.
- Thực hiện mọi thay đổi cấu trúc Database theo **Expand-Migrate-Contract**.
- Dùng **Feature Flag** để tách Deploy khỏi Release và đo lường liên tục bằng **4 chỉ số DORA**.
