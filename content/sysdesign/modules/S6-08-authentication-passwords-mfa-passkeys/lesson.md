## 1. Lưu mật khẩu an toàn: Băm chậm có Salt riêng (Argon2id / bcrypt)

```step
category: SETUP
short: Băm mật khẩu
scene: s1-hashing
callout:
  kind: key-idea
  title: Không bao giờ lưu mật khẩu dạng thô hoặc băm nhanh
  vi: "Hàm băm nhanh như SHA-256 cho phép kẻ tấn công thử hàng tỷ tổ hợp mỗi giây trên GPU nếu bảng người dùng bị lộ. Cần hàm băm chậm tốn bộ nhớ (Argon2id) kèm Salt ngẫu nhiên riêng cho từng tài khoản."
whatChanged:
  - "+ Chuyển từ lưu mật khẩu thô / SHA-256 sang Argon2id có Salt riêng"
  - "~ Mỗi lần kiểm tra đăng nhập tốn chủ đích ~50–100 ms CPU để cản vét cạn"
telemetry:
  - label: "Thuật toán khuyến nghị"
    value: "Argon2id / bcrypt"
  - label: "Độ dài Salt"
    value: "128 bit ngẫu nhiên"
    tone: ok
```

Xác thực (Authentication) trả lời câu hỏi: **người gửi yêu cầu có đúng là chủ tài khoản hay không?** Rủi ro lớn nhất ở bước đầu tiên là biến chính cơ sở dữ liệu thành nguồn làm lộ mật khẩu nếu xảy ra rò rỉ dữ liệu.

- **Không lưu văn bản thô (Plaintext) và không dùng mã hóa hai chiều:** Hệ thống không cần biết lại mật khẩu gốc, chỉ cần xác minh khi người dùng nhập lại.
- **Không dùng hàm băm nhanh (MD5, SHA-256):** Các hàm này sinh ra để kiểm tra tính toàn vẹn tệp ở tốc độ cao, nên phần cứng hiện đại có thể dò hàng tỷ mật khẩu mỗi giây.
- **Dùng hàm băm chậm có Salt riêng (Argon2id, bcrypt):** Gắn thêm chuỗi ngẫu nhiên (`Salt`) riêng cho từng tài khoản để vô hiệu hóa bảng tra cứu sẵn (Rainbow Table), đồng thời cấu hình độ tốn kém CPU và RAM để mỗi lần thử mất vài chục mili-giây.

## 2. Session tập trung so với JWT và Refresh Token

```step
category: MECHANISM
short: Session vs JWT
scene: s2-tokens
callout:
  kind: compare
  title: Đánh đổi giữa khả năng thu hồi và tính phi trạng thái
  vi: "Session lưu ở Redis giúp thu hồi quyền truy cập ngay lập tức khi đổi mật khẩu, nhưng mỗi request phải tra kho chung. JWT tự xác thực không cần tra DB, nhưng khó thu hồi trước khi hết hạn."
whatChanged:
  - "+ Đối chiếu Session ID (Redis) với cặp Access Token (15 phút) + Refresh Token"
  - "~ Lưu Refresh Token trong HttpOnly Cookie và xoay vòng (Rotation) khi cấp mới"
telemetry:
  - label: "Access Token TTL"
    value: "5–15 phút"
    tone: ok
  - label: "Thu hồi tức thì"
    value: "Session / Refresh Store"
```

Sau khi đăng nhập thành công, người dùng không gửi lại mật khẩu ở mọi yêu cầu kế tiếp. Có hai mô hình duy trì phiên phổ biến:

1. **Session tập trung (Stateful Session):** Máy chủ sinh mã phiên ngẫu nhiên lưu trong `Redis` và gửi cookie `HttpOnly; Secure; SameSite=Lax` về trình duyệt. Ưu điểm là có thể **thu hồi ngay lập tức** khi người dùng đăng xuất từ xa hoặc đổi mật khẩu.
2. **Token đã ký (JWT + Refresh Token):** Cấp **Access Token** ngắn hạn (5–15 phút) mang chữ ký số để các dịch vụ tự xác thực không cần gọi Auth DB, đi kèm **Refresh Token** dài hạn lưu ở kho kiểm soát được để cấp lại Access Token mới và hỗ trợ thu hồi khi phát hiện bất thường.

## 3. Chống Credential Stuffing ở Gateway và tầng Auth

```step
category: PROBLEM
short: Đợt dò mật khẩu
scene: s3-stuffing-live
live: stuffing
activity: S6-08.A1
gate: required
callout:
  kind: watch-out
  title: Tấn công Credential Stuffing làm nghẽn CPU tầng Auth
  vi: "Bot tự động thử hàng loạt cặp email và mật khẩu bị lộ từ các trang khác. Vì hàm băm Argon2id rất nặng CPU, lưu lượng tấn công dễ làm bão hòa tầng Auth và chặn người dùng thật."
whatChanged:
  - "~ Tải dò mật khẩu tăng từ 200 lên 1.400 req/s đánh thẳng vào Auth Service"
  - "~ Theo dõi hàng đợi và mức sử dụng ρ tại từng tầng trong luồng đăng nhập"
telemetry:
  - label: "Mối đe dọa"
    value: "Credential Stuffing"
    tone: bad
  - label: "Biện pháp chặn"
    value: "Rate Limit tại Gateway"
    tone: ok
```

**Credential Stuffing** xảy ra khi kẻ tấn công dùng bot thử hàng loạt cặp tài khoản–mật khẩu bị lộ từ các vụ rò rỉ khác lên hệ thống của bạn. Vì mỗi lần kiểm tra mật khẩu bằng Argon2id cố tình tiêu tốn nhiều CPU, một đợt dò mật khẩu không chỉ đe dọa chiếm đoạt tài khoản mà còn gây **từ chối dịch vụ (DoS)** cho người dùng hợp lệ.

Lớp phòng vệ gồm ba tuyến:
- **Rate Limiting tại API Gateway:** Giới hạn số lần thử thất bại theo cả địa chỉ IP lẫn tên tài khoản (ví dụ tối đa 5 lần/phút/tài khoản) để chặn bot trước khi chạm tới bước băm Argon2id tốn kém.
- **Từ chối mật khẩu đã bị lộ:** Kiểm tra mật khẩu đăng ký mới qua cơ sở dữ liệu mật khẩu rò rỉ (dạng k-anonymity).
- **Phản hồi đồng nhất khi quên mật khẩu:** Luôn trả về cùng một thông báo và thời gian tương đương bất kể email có tồn tại hay không, kèm token một lần hết hạn sau 15 phút.

## 4. MFA và Passkey (WebAuthn): Chống tấn công lừa đảo trung gian

```step
category: TECHNIQUE
short: MFA & Passkey
scene: s4-passkey
callout:
  kind: technique
  title: Passkey gắn chặt với tên miền (Origin-bound)
  vi: "Mã OTP 6 số qua SMS hoặc ứng dụng vẫn có thể bị đánh cắp qua trang đăng nhập giả mạo trung gian. Passkey dùng mật mã khóa công khai gắn cứng với tên miền thật của trang web."
whatChanged:
  - "+ Bổ sung yếu tố thứ hai (TOTP / Push) sau bước kiểm tra mật khẩu"
  - "+ Triển khai Passkey (WebAuthn): xác thực bằng sinh trắc học thiết bị và chữ ký số"
telemetry:
  - label: "Chống Phishing"
    value: "WebAuthn Origin-bound"
    tone: ok
  - label: "Trải nghiệm"
    value: "Không cần nhớ mật khẩu"
```

Khi mật khẩu bị lộ hoặc người dùng nhập nhầm vào trang giả mạo (Phishing):

- **MFA (Xác thực đa yếu tố):** Yêu cầu thêm mã dùng một lần (TOTP từ ứng dụng xác thực) hoặc xác nhận trên thiết bị tin cậy. Tuy nhiên, một trang giả mạo thời gian thực (Proxy Phishing) vẫn có thể lừa người dùng nhập mã OTP rồi chuyển tiếp ngay sang máy chủ thật.
- **Passkey (WebAuthn / FIDO2):** Sử dụng cặp khóa bất đối xứng lưu trong phần cứng bảo mật của thiết bị. Trình duyệt ký thử thách (Challenge) kèm **tên miền gốc (`Origin`)**, nên chữ ký tạo ra hoàn toàn vô dụng trên tên miền giả mạo.

## 5. Cạm bẫy bảo mật thường gặp trong luồng xác thực

```step
category: PITFALL
short: Bẫy xác thực
scene: s2-tokens
callout:
  kind: watch-out
  title: Lưu JWT trong localStorage và phản hồi lộ email tồn tại
  vi: "Lưu JWT ở localStorage khiến mã độc XSS có thể đánh cắp token dễ dàng. Ngoài ra, báo lỗi khác nhau giữa sai email và sai mật khẩu giúp bot dò ra danh sách tài khoản hợp lệ."
whatChanged:
  - "! Lưu Access/Refresh Token ở localStorage dễ bị đánh cắp qua lỗ hổng XSS"
  - "! Trả lời 'Email không tồn tại' tạo lỗ hổng dò tài khoản (Account Enumeration)"
telemetry:
  - label: "Lưu trữ an toàn"
    value: "HttpOnly Cookie"
    tone: ok
  - label: "Chống dò email"
    value: "Phản hồi đồng nhất"
    tone: ok
```

Khi thiết kế hệ thống xác thực, cần tránh hai lỗ hổng phổ biến:

- **Để lộ token cho JavaScript:** Luôn ưu tiên lưu Refresh Token và Session ID trong cookie có cờ `HttpOnly; Secure; SameSite=Lax` thay vì `localStorage`, giúp ngăn chặn đánh cắp phiên khi trang web chẳng may dính lỗ hổng XSS.
- **Lộ thông tin ở màn hình quên mật khẩu:** Phản hồi phải luôn đồng nhất (ví dụ: "Nếu email tồn tại, liên kết đặt lại đã được gửi") với thời gian xử lý tương đương để kẻ tấn công không thể dùng tính năng này quét danh sách người dùng.

## 6. Tổng kết: Mô hình xác thực phòng vệ nhiều lớp

```step
category: RECAP
short: Tóm tắt
scene: s5-recap
callout:
  kind: key-idea
  title: Bảo vệ cả dữ liệu tĩnh lẫn luồng đăng nhập
  vi: "Kết hợp Argon2id bảo vệ kho lưu trữ, Rate Limit bảo vệ CPU tầng Auth, Access Token ngắn hạn giảm rủi ro lộ phiên và Passkey chặn đứng tấn công lừa đảo."
whatChanged:
  - "+ Tổng hợp 4 lớp phòng vệ từ trình duyệt tới Auth DB"
telemetry:
  - label: "Kho mật khẩu"
    value: "Argon2id + Salt"
  - label: "Chống lừa đảo"
    value: "Passkey (WebAuthn)"
```

Bốn nguyên tắc thiết kế hệ thống xác thực an toàn:

1. **Lưu trữ chậm và có Salt:** Dùng Argon2id hoặc bcrypt với Salt riêng từng người dùng.
2. **Chặn sớm ở biên:** Áp dụng Rate Limiting tại API Gateway trước khi gọi vào tầng Auth.
3. **Phiên ngắn hạn có kiểm soát:** Dùng Session trong Redis hoặc JWT ngắn hạn (5–15 phút) kèm Refresh Token có thể thu hồi.
4. **Nâng cấp lên MFA và Passkey:** Ưu tiên WebAuthn để loại bỏ rủi ro mật khẩu yếu và trang đăng nhập giả mạo.
