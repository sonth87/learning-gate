## 1. Yêu cầu cốt lõi của hệ thống Thanh toán

```step
category: SETUP
short: Bức tranh tổng
scene: s1-overview
callout:
  kind: key-idea
  title: Ba nguyên tắc bất biến
  vi: "Không làm mất tiền, không trừ tiền hai lần khi mạng chập chờn, và mọi biến động số dư đều phải kiểm toán được."
whatChanged:
  - "+ Kiến trúc Checkout → Payment Service → PSP & Ledger DB + Outbox"
telemetry:
  - label: "Tính nhất quán"
    value: "ACID tại Ledger DB"
  - label: "Chống trừ kép"
    value: "Idempotency Key"
```

Khác với mạng xã hội hay hệ thống đọc tin tức có thể chấp nhận sai lệch tạm thời (Eventual Consistency), một hệ thống thanh toán phải đảm bảo độ chính xác tuyệt đối về tiền tệ:

- **Không trừ tiền hai lần (Exactly-once charge):** Nếu người dùng bấm nút thanh toán hai lần hoặc mạng bị Timeout, thẻ của khách chỉ được trừ đúng một lần.
- **Không mất dữ liệu giao dịch:** Mọi khoản tiền đã trừ hoặc hoàn trả phải có bản ghi bất biến để đối soát và kiểm toán.
- **Tách biệt lõi hạch toán:** `checkout` chỉ lo đơn hàng và giỏ hàng, còn `payment_svc` quản lý tương tác với cổng thanh toán ngoài (`provider`) và ghi vào `ledger_db`.

## 2. Sổ cái kép (Double-Entry Ledger) bất biến

```step
category: MECHANISM
short: Sổ cái kép
scene: s2-ledger
callout:
  kind: key-idea
  title: Tổng ghi nợ và ghi có luôn bằng 0
  vi: "Không cập nhật đè cột balance. Mọi giao dịch đều ghi thêm ít nhất hai dòng: Debit tài khoản nguồn và Credit tài khoản đích."
whatChanged:
  - "+ Ledger DB dùng mô hình Append-only, cấm UPDATE và DELETE"
  - "~ Mỗi giao dịch cân bằng Debit (−100k) và Credit (+100k)"
telemetry:
  - label: "Tổng kiểm tra"
    value: "Σ(Debit + Credit) = 0"
    tone: ok
  - label: "Hoàn tiền"
    value: "Ghi bút toán đảo chiều"
```

Sai lầm phổ biến nhất khi mới làm ví điện tử là chỉ có một bảng `accounts(user_id, balance)` rồi chạy `UPDATE accounts SET balance = balance - 100`. Nếu có sự cố hoặc kiện tụng, bạn không thể biết 100 đó đi đâu, vào lúc nào.

Trong **Sổ cái kép (Double-Entry Ledger)**:

- Bảng `ledger_entries` chỉ cho phép thêm mới (**Append-only**), tuyệt đối không sửa hay xoá dòng cũ.
- Khi khách A trả 100.000đ cho Người bán B, hệ thống ghi cùng lúc hai dòng trong một ACID Transaction:
  - Tài khoản A: `DEBIT -100.000`
  - Tài khoản B: `CREDIT +100.000`
- Nếu cần hoàn tiền, hệ thống ghi một bút toán mới đảo chiều (`+100.000` cho A, `-100.000` cho B). Nhờ vậy, tổng mọi dòng trên toàn sổ cái luôn bằng 0.

## 3. Idempotency Key: xử lý Timeout chưa biết kết quả

```step
category: TECHNIQUE
short: Idempotency Key
scene: s3-idempotency
callout:
  kind: watch-out
  title: Timeout không có nghĩa là thất bại
  vi: "Khi gọi PSP bị Timeout, tiền có thể đã bị trừ xong và chỉ gói tin phản hồi bị mất. Gửi lại mà không có Idempotency Key sẽ trừ tiền lần hai."
whatChanged:
  - "+ Client tạo UUID Idempotency-Key cố định cho mỗi lần thanh toán"
  - "~ Payment Service lưu key vào DB trước khi gọi PSP"
telemetry:
  - label: "Trạng thái Timeout"
    value: "Chưa biết kết quả"
    tone: warn
  - label: "Khi gửi lại cùng Key"
    value: "Trả kết quả cũ"
    tone: ok
```

Khi `payment_svc` gọi `provider` qua Internet và gặp Timeout ở giây thứ 0,6, có hai khả năng xảy ra:
1. Gói tin chưa tới `provider` (khách chưa mất tiền).
2. `provider` đã trừ tiền thành công, nhưng phản hồi bị rớt trên đường về.

Để xử lý an toàn, client sinh một `Idempotency-Key` (ví dụ UUID v4) gắn vào đơn thanh toán:
- `payment_svc` kiểm tra khoá này trong `ledger_db` (ràng buộc `UNIQUE`). Nếu khoá đã có kết quả `SUCCEEDED` hoặc `FAILED`, trả về ngay kết quả cũ mà không gọi lại `provider`.
- Nếu cần thử lại sang `provider`, `payment_svc` truyền chính `Idempotency-Key` đó sang API của đối tác để phía đối tác cũng khử trùng lặp tương tự.

## 4. Mô phỏng trực tiếp: sự cố chậm từ cổng thanh toán

```step
category: PROBLEM
short: PSP gặp sự cố
scene: s4-live
live: payment
callout:
  kind: watch-out
  title: Bão thử lại khi PSP chậm
  vi: "Từ giây 18 đến 38, PSP chậm gấp 12 lần. Timeout ngắn (600 ms) cộng Retry không Backoff làm lưu lượng dội ngược tăng vọt."
whatChanged:
  - "~ Giây 18–38: PSP chậm 12x làm Timeout liên tiếp"
  - "~ Quan sát độ trễ p99 và tỷ lệ lỗi trên bảng đo"
telemetry:
  - label: "Khoảng sự cố"
    value: "t = 18 s → 38 s"
    tone: bad
  - label: "Mục tiêu p99"
    value: "≤ 350 ms"
```

Trong mô phỏng trực tiếp, hệ thống nhận đều đặn 600 req/s. Tại giây 18, `provider` gặp sự cố chậm gấp 12 lần kéo dài 20 giây:

- Do đường nối `payment_svc-provider` đang đặt `timeoutMs: 600` và `retry` tối đa 2 lần không có Backoff, mỗi yêu cầu bị Timeout lập tức đẻ thêm 2 yêu cầu gọi lại.
- Hàng loạt kết nối bị giữ chờ làm độ trễ p99 vọt lên và tỷ lệ lỗi vượt ngưỡng cho phép.

Hãy theo dõi biểu đồ trực tiếp và thử nghiệm điều chỉnh cấu hình để hiểu tác động của việc thử lại mù quáng lên hệ thống thanh toán.

## 5. Transactional Outbox và Saga cho luồng bất đồng bộ

```step
category: TECHNIQUE
short: Outbox và Saga
scene: s5-outbox
callout:
  kind: technique
  title: Tránh lỗi ghi kép hai hệ thống
  vi: "Không gọi thẳng Event Bus sau khi COMMIT Ledger DB vì app có thể sập ở giữa. Hãy ghi bảng Outbox trong cùng ACID Transaction."
whatChanged:
  - "+ Ghi bảng ledger_entries và outbox trong cùng 1 transaction"
  - "~ Worker đẩy sự kiện từ Outbox sang Event Bus cho đơn hàng"
telemetry:
  - label: "Giao nhận sự kiện"
    value: "At-least-once"
  - label: "Phía nhận (Consumer)"
    value: "Phải luỹ đẳng"
```

Sau khi `payment_svc` trừ tiền và ghi `ledger_db` thành công, các dịch vụ khác như Đơn hàng, Kho hàng và Gửi hoá đơn cần được thông báo. Nếu viết code theo kiểu: `db.commit()` rồi mới gọi `kafka.publish()`, khi máy chủ sập ngay giữa hai dòng lệnh, tiền đã trừ nhưng đơn hàng mãi mãi ở trạng thái chờ thanh toán.

Giải pháp là mẫu **Transactional Outbox** (kết hợp **Saga** nếu thanh toán nằm trong chuỗi đặt vé/đặt phòng):
- Ghi bản ghi sổ cái và một dòng sự kiện vào bảng `outbox` trong **cùng một Transaction cục bộ** trên `ledger_db`.
- Một tiến trình nền đọc các dòng chưa gửi từ `outbox` và đẩy sang `outbox` Event Bus theo cơ chế At-least-once (ít nhất một lần). Các dịch vụ nhận sự kiện cũng phải kiểm tra `event_id` để đảm bảo luỹ đẳng.

## 6. Đối soát cuối ngày (Reconciliation T+1)

```step
category: TECHNIQUE
short: Đối soát T+1
scene: s6-reconcile
activity: S7-06.A1
gate: optional
callout:
  kind: good-to-know
  vi: "Mọi hệ thống phân tán đều có xác suất lệch trạng thái cực nhỏ do sự cố mạng hiếm gặp. Đối soát cuối ngày là lưới an toàn cuối cùng."
whatChanged:
  - "+ So khớp tệp sao kê PSP cuối ngày với Ledger DB"
  - "~ Tự động đánh dấu các đơn lệch để bù sổ cái hoặc hoàn tiền"
telemetry:
  - label: "Tần suất"
    value: "Hàng ngày (T+1)"
  - label: "Phân loại lệch"
    value: "Thiếu ở DB / Thiếu ở PSP"
```

Dù đã có Idempotency Key, Webhook và Outbox, vẫn có thể xuất hiện trường hợp hiếm gặp khiến `ledger_db` và `provider` không khớp nhau (ví dụ PSP xử lý xong nhưng Webhook bị chặn, hoặc giao dịch bị đảo ngược bởi ngân hàng phát hành thẻ).

Quy trình **Đối soát (Reconciliation)** chạy định kỳ cuối ngày (T+1):
1. Tải tệp sao kê quyết toán (Settlement File) từ `provider`.
2. So khớp từng mã giao dịch với `ledger_db` theo số tiền, trạng thái và loại tiền tệ.
3. Phân loại giao dịch lệch: nếu PSP đã thu tiền nhưng `ledger_db` chưa ghi nhận thì kích hoạt truy vấn kiểm tra lại hoặc tạo bút toán bù; nếu lệch không thể tự sửa thì đẩy vào hàng đợi cảnh báo để kế toán vận hành xử lý.

## 7. Thực hành thiết kế cấu hình trong ngân sách

```step
category: TECHNIQUE
short: Cấu hình SLO
scene: s4-live
activity: S7-06.A2
gate: required
callout:
  kind: technique
  title: Sửa đúng điểm nghẽn trên đường gọi ngoài
  vi: "Khi cổng thanh toán bên ngoài chậm, tăng cỡ máy Database nội bộ không giúp ích gì. Cần kiểm soát Timeout, Retry Backoff và Circuit Breaker."
whatChanged:
  - "~ Tối ưu đường nối payment_svc-provider trong giới hạn chi phí"
telemetry:
  - label: "Ngân sách"
    value: "≤ 1,05 USD/giờ"
  - label: "SLO p99"
    value: "≤ 350 ms"
```

Trong bài tập thiết kế tiếp theo, bạn cần cấu hình hệ thống chịu được đợt chậm 12 lần của `provider` từ giây 18 đến giây 38 mà vẫn giữ tổng chi phí dưới 1,05 USD/giờ. Hãy chú ý cấu hình đường nối `payment_svc-provider` thay vì nâng cấp phần cứng không liên quan.

## 8. Tóm tắt kiến trúc Hệ thống Thanh toán

```step
category: RECAP
short: Tóm tắt
scene: s7-recap
callout:
  kind: key-idea
  title: Bốn chốt chặn an toàn
  vi: "Sổ cái kép bất biến, Idempotency Key cho mọi lệnh ghi, Transactional Outbox cho sự kiện và Đối soát cuối ngày cho lưới an toàn."
whatChanged:
  - "+ Tổng hợp quy trình khép kín của hệ thống Thanh toán"
telemetry:
  - label: "Hạch toán"
    value: "Double-Entry Append-only"
  - label: "An toàn mạng"
    value: "Idempotency + Backoff"
```

Bốn nguyên tắc không thể thiếu khi thiết kế hệ thống Thanh toán:

1. **Sổ cái kép (Double-Entry Ledger):** Lưu mọi biến động dưới dạng bút toán Debit/Credit chỉ ghi thêm (Append-only) với tổng bằng 0.
2. **Idempotency Key:** Coi Timeout là trạng thái chưa biết kết quả; gắn khoá duy nhất để thử lại an toàn không trừ tiền hai lần.
3. **Transactional Outbox & Saga:** Đảm bảo ghi sổ cái và phát sự kiện sang dịch vụ khác xảy ra đồng bộ về mặt dữ liệu.
4. **Đối soát cuối ngày (Reconciliation):** Tự động so khớp sổ cái nội bộ với sao kê của đối tác PSP để phát hiện sớm mọi sai lệch.
