## 1. Dữ liệu bản rõ trên đường truyền và ba trạng thái cần bảo vệ

```step
category: SETUP
short: Ba trạng thái
scene: s1-http-plaintext
callout:
  kind: key-idea
  title: Bảo vệ đủ 3 trạng thái
  vi: "Dữ liệu cần được bảo vệ khi đang truyền (In-Transit), khi đang lưu trên đĩa hoặc bản sao lưu (At-Rest), và khi quản lý khóa truy cập (Secrets)."
whatChanged:
  - "+ Thiết bị gửi yêu cầu HTTP không mã hóa qua mạng công cộng"
  - "~ Mật khẩu và session token bị lộ ngay trên đường truyền"
telemetry:
  - label: "Đang truyền"
    value: "HTTP (Bản rõ)"
    tone: bad
  - label: "Rủi ro nghe lén"
    value: "Cao"
    tone: bad
```

Khi một thiết bị gửi yêu cầu qua Wi-Fi công cộng bằng HTTP thường, toàn bộ tiêu đề (Authorization header, cookie phiên) và nội dung gói tin đều là bản rõ. Bất kỳ điểm định tuyến trung gian nào cũng có thể đọc hoặc chỉnh sửa gói tin đó.

Để bảo vệ dữ liệu toàn diện, kiến trúc hệ thống phải bao phủ ba trạng thái:
1. **In-Transit (đang truyền):** giữa người dùng và hệ thống, cũng như giữa các dịch vụ nội bộ với nhau.
2. **At-Rest (đang lưu):** trong Database, ổ đĩa, và đặc biệt là các bản sao lưu (backup) hay kho đối tượng.
3. **Secrets (khóa và mật khẩu):** thông tin xác thực mà ứng dụng dùng để kết nối Database hoặc dịch vụ thứ ba.

## 2. TLS Handshake: bảo vệ đường truyền bằng mã hóa bất đối xứng và đối xứng

```step
category: MECHANISM
short: Bắt tay TLS
scene: s2-tls-handshake
activity: S6-10.A1
gate: optional
callout:
  kind: technique
  title: Kết hợp hai loại mã hóa
  vi: "TLS dùng mã hóa bất đối xứng ở bước bắt tay để xác minh danh tính máy chủ và thỏa thuận khóa phiên, rồi dùng mã hóa đối xứng (AES-GCM) để truyền dữ liệu nhanh."
whatChanged:
  - "+ Trình bày 5 bước bắt tay TLS 1.3 từ ClientHello đến dữ liệu mã hóa"
  - "~ Khóa phiên đối xứng chỉ tồn tại cho phiên kết nối hiện tại"
telemetry:
  - label: "Giao thức"
    value: "TLS 1.3 (1-RTT)"
    tone: ok
  - label: "Mã hóa dữ liệu"
    value: "AES-256-GCM"
    tone: ok
```

**TLS (Transport Layer Security)** giải quyết đồng thời hai bài toán: xác thực máy chủ đúng là chủ sở hữu tên miền (nhờ chứng chỉ số do CA ký) và mã hóa toàn bộ lưu lượng trên đường truyền.

Trong **TLS 1.3**, quá trình bắt tay chỉ mất 1 lượt khứ hồi (1-RTT): Client gửi `ClientHello`, Server trả `ServerHello` kèm chứng chỉ X.509, Client xác minh chứng chỉ với CA gốc rồi hai bên suy ra khóa phiên đối xứng dùng chung. Nếu dùng thẳng mã hóa bất đối xứng cho mọi gói tin thì CPU sẽ quá tải, nên TLS chuyển ngay sang mã hóa đối xứng (AES-GCM hoặc ChaCha20) cho toàn bộ dữ liệu ứng dụng phía sau.

## 3. Vòng đời chứng chỉ và Mutual TLS (mTLS) trong mạng nội bộ

```step
category: TECHNIQUE
short: mTLS & Gia hạn
scene: s3-mtls-internal
callout:
  kind: watch-out
  title: Chứng chỉ hết hạn lúc 3 giờ sáng
  vi: "Chứng chỉ TLS luôn có hạn dùng. Gia hạn thủ công rất dễ quên và gây sập toàn bộ dịch vụ; phải tự động hóa qua ACME và đặt cảnh báo trước hạn."
whatChanged:
  - "+ Bật mTLS cho chặng nội bộ giữa Load Balancer, App và Database"
  - "~ Tự động gia hạn chứng chỉ trước hạn 30 ngày qua cert-manager"
telemetry:
  - label: "Chặng nội bộ"
    value: "mTLS 2 chiều"
    tone: ok
  - label: "Gia hạn chứng chỉ"
    value: "Tự động (ACME)"
    tone: ok
```

Một sự cố kinh điển trong vận hành là chứng chỉ TLS hết hạn vào ban đêm khiến mọi trình duyệt và ứng dụng di động từ chối kết nối. Cách phòng tránh là tự động hóa hoàn toàn việc cấp và gia hạn chứng chỉ (ví dụ ACME / `cert-manager`) kết hợp cảnh báo ở mốc 30, 14 và 7 ngày trước khi hết hạn.

Bên trong data center, không nên mặc định mạng nội bộ là an toàn tuyệt đối. **Mutual TLS (mTLS)** yêu cầu cả dịch vụ gọi (client) và dịch vụ nhận (server) đều phải xuất trình chứng chỉ hợp lệ. Nhờ vậy, ngay cả khi một máy chủ bị xâm nhập, kẻ tấn công cũng không thể giả mạo dịch vụ khác hoặc nghe lén lưu lượng nội bộ.

## 4. Mã hóa tĩnh với Envelope Encryption (DEK, KEK và KMS)

```step
category: MECHANISM
short: KMS & DEK/KEK
scene: s4-envelope-kms
callout:
  kind: key-idea
  title: Tách khóa khỏi dữ liệu
  vi: "Không bao giờ lưu khóa giải mã cạnh dữ liệu. KMS giữ khóa gốc (KEK) và chỉ cấp hoặc mở bọc khóa dữ liệu (DEK) cho dịch vụ có quyền."
whatChanged:
  - "+ Dựng cây phân cấp khóa: KMS (KEK) bọc DEK, DEK mã hóa dữ liệu"
  - "~ Xoay vòng KEK chỉ cần bọc lại DEK mà không mã hóa lại dữ liệu gốc"
telemetry:
  - label: "Khóa gốc (KEK)"
    value: "Cố định trong KMS"
    tone: ok
  - label: "Xoay vòng khóa"
    value: "Chỉ bọc lại DEK"
    tone: ok
```

Giả sử một bản sao lưu Database vô tình bị đẩy lên kho lưu trữ công khai. Nếu bản sao lưu không mã hóa (hoặc khóa giải mã nằm cùng thư mục), toàn bộ dữ liệu khách hàng sẽ bị đọc sạch.

**Envelope Encryption** giải quyết vấn đề này bằng hai tầng khóa:
- **DEK (Data Encryption Key):** khóa đối xứng dùng để mã hóa trực tiếp dữ liệu và bản sao lưu.
- **KEK (Key Encryption Key):** khóa chính nằm hoàn toàn bên trong **KMS (Key Management Service)**, dùng để bọc (wrap) các DEK.

Dữ liệu lưu kèm DEK *đã được bọc*. Khi cần **xoay vòng khóa (key rotation)** định kỳ, hệ thống chỉ cần gọi KMS giải mã DEK và bọc lại bằng phiên bản KEK mới mà không phải đọc và mã hóa lại hàng terabyte dữ liệu đang nằm trên đĩa.

## 5. Secrets Manager và quét khóa trong CI/CD

```step
category: TECHNIQUE
short: Secrets Manager
scene: s5-secrets-rotation
callout:
  kind: technique
  title: Không đưa secret vào mã nguồn
  vi: "Khóa API hay mật khẩu Database đưa vào Git chỉ một lần là coi như đã lộ vĩnh viễn. Phải quản lý qua Secrets Manager và quét tự động ở CI."
whatChanged:
  - "+ App lấy mật khẩu Database động từ Secrets Manager lúc chạy"
  - "~ Bật secret scanning chặn commit chứa khóa API trước khi merge"
telemetry:
  - label: "Lưu trữ secret"
    value: "Secrets Manager"
    tone: ok
  - label: "Xoay vòng DB"
    value: "Tự động theo lịch"
    tone: ok
```

Việc dán chuỗi kết nối Database hay API key trực tiếp vào tệp cấu hình hoặc commit lên Git là nguyên nhân hàng đầu gây rò rỉ hệ thống. Ngay cả khi xóa ở commit sau, lịch sử Git vẫn giữ lại giá trị cũ.

Quy trình chuẩn gồm ba bước:
- **Lưu tập trung ở Secrets Manager:** ứng dụng xác thực qua IAM Role / Workload Identity để lấy secret lúc khởi chạy, không ghi vào đĩa.
- **Xoay vòng tự động (Dynamic Credentials):** tạo tài khoản DB ngắn hạn tự hết hạn và tự đổi mật khẩu định kỳ.
- **Quét trong CI (Secret Scanning):** chặn ngay lập tức mọi pull request có chuỗi giống khóa API hoặc private key.

## 6. Tokenization và mã hóa đầu cuối (End-to-End Encryption)

```step
category: TECHNIQUE
short: Token & E2EE
scene: s6-tokenization-e2ee
callout:
  kind: good-to-know
  title: Giảm phạm vi tin cậy
  vi: "Tokenization giúp hệ thống nghiệp vụ không phải chạm vào số thẻ thật; còn E2EE đảm bảo ngay cả máy chủ trung gian cũng không đọc được nội dung."
whatChanged:
  - "+ Thay số thẻ thật bằng mã token trong luồng xử lý của App và DB"
  - "~ Với E2EE, khóa giải mã chỉ nằm trên thiết bị người dùng cuối"
telemetry:
  - label: "Số thẻ trong DB"
    value: "Token (tok_9f2a)"
    tone: ok
  - label: "Quyền đọc Server"
    value: "Không (với E2EE)"
    tone: warn
```

Hai kỹ thuật chuyên sâu giúp thu hẹp hơn nữa bề mặt rủi ro:

| Kỹ thuật | Cách hoạt động | Mục tiêu chính |
|---|---|---|
| **Tokenization** | Cất số thẻ thật vào kho tách biệt (Vault), trả về chuỗi thay thế (`tok_9f2a`) cho App và DB lưu trữ | Giảm phạm vi hệ thống phải kiểm toán chuẩn thanh toán PCI-DSS |
| **Mã hóa đầu cuối (E2EE)** | Thiết bị gửi mã hóa bằng khóa công khai của người nhận; server chỉ chuyển tiếp bản mã | Đảm bảo server trung gian (kể cả nhà cung cấp dịch vụ) không đọc được tin nhắn |

Lưu ý đánh đổi: khi áp dụng E2EE, server không thể tìm kiếm toàn văn (full-text search) trên nội dung bản mã hay khôi phục dữ liệu nếu người dùng làm mất khóa riêng trên thiết bị.

## 7. Tổng kết: kiểm tra mã hóa cho hệ thống sản phẩm

```step
category: RECAP
short: Tổng kết
scene: s5-secrets-rotation
callout:
  kind: key-idea
  title: Chuẩn bảo vệ dữ liệu
  vi: "TLS/mTLS cho đường truyền, Envelope Encryption với KMS cho dữ liệu tĩnh, Secrets Manager cho khóa vận hành, và Tokenization/E2EE khi cần giới hạn niềm tin."
whatChanged:
  - "~ Hệ thống hoàn chỉnh lớp bảo vệ đường truyền, đĩa lưu trữ và secret"
telemetry:
  - label: "Đường truyền"
    value: "TLS 1.3 + mTLS"
    tone: ok
  - label: "Lưu trữ & Secret"
    value: "KMS + Secrets Mgr"
    tone: ok
```

Trước khi đưa một hệ thống lên môi trường thật, hãy rà soát bốn câu hỏi:
- Mọi kết nối ngoài dùng **TLS 1.3** và chứng chỉ được **tự động gia hạn** chưa?
- Kết nối nội bộ nhạy cảm đã bật **mTLS** chưa?
- Dữ liệu tĩnh và bản sao lưu đã dùng **Envelope Encryption** với khóa KEK tách riêng trong **KMS** chưa?
- Mật khẩu DB và API key đã chuyển sang **Secrets Manager** và được **quét tự động trong CI** chưa?
