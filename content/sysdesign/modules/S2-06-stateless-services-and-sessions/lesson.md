## 1. Điều gì xảy ra khi máy chủ ứng dụng giữ phiên trong RAM riêng?

```step
category: SETUP
short: Lỗi mất phiên
scene: s1-local-session
callout:
  kind: key-idea
  title: Điều kiện để mở rộng ngang thật sự
  vi: "Một cụm máy chủ chỉ mở rộng ngang trơn tru khi bất kỳ request kế tiếp nào của người dùng cũng có thể chạy trên bất kỳ máy chủ nào trong cụm."
whatChanged:
  - "+ Người dùng đăng nhập tại App A; đối tượng phiên nằm trong RAM riêng của App A"
  - "~ Request kế tiếp được Round Robin đẩy sang App B không có phiên → trả lỗi 401"
telemetry:
  - label: "Số máy App"
    value: "2 máy"
  - label: "Xác suất sai máy"
    value: "50% (với 3 máy là 67%)"
    tone: bad
```

Khi mới chạy một máy chủ duy nhất, lập trình viên thường cất luôn thông tin phiên đăng nhập (`user_id`, quyền hạn, giỏ hàng tạm) vào một bảng băm trong bộ nhớ RAM của tiến trình ứng dụng:

```python
# Thiết kế giữ trạng thái cục bộ (Stateful): chỉ sống trong RAM của 1 máy
LOCAL_SESSIONS: dict[str, dict] = {}

def login(user_id: int) -> str:
    sid = secrets.token_urlsafe(24)
    LOCAL_SESSIONS[sid] = {"user_id": user_id, "cart": []}
    return sid
```

Ngay khi đặt thêm **App B** và **App C** phía sau Load Balancer chạy Round Robin, sự cố lập tức xuất hiện: người dùng vừa đăng nhập thành công ở App A, nhưng cú nhấp chuột mở giỏ hàng một giây sau lại được điều phối sang App B. Vì `LOCAL_SESSIONS` trên App B hoàn toàn trống, hệ thống báo chưa đăng nhập (`401 Unauthorized`).

## 2. Giải pháp vá tạm: Sticky Session (Session Affinity)

```step
category: TECHNIQUE
short: Sticky Session
scene: s2-sticky
callout:
  kind: watch-out
  title: Thuận tiện ban đầu nhưng trói buộc về sau
  vi: "Sticky Session giúp ứng dụng cũ chạy tạm trên nhiều máy mà chưa cần sửa code, nhưng làm giảm hiệu quả chia đều tải."
whatChanged:
  - "~ Bật Sticky Session (ip-hash hoặc cookie affinity) trên Load Balancer"
  - "~ Một nhóm khách hoạt động mạnh bị ghim chặt vào App A làm ρ vọt lên 0,92"
telemetry:
  - label: "Định tuyến LB"
    value: "Sticky (ip-hash)"
    tone: warn
  - label: "ρ của App A"
    value: "0,92 (lệch tải)"
    tone: warn
  - label: "ρ của App B"
    value: "0,28"
    tone: ok
```

Cách nhanh nhất mà nhiều đội nghĩ tới là cấu hình **Sticky Session (Session Affinity)** trên Load Balancer: băm địa chỉ IP của client (`ip-hash`) hoặc đọc một cookie định danh máy chủ để luôn gửi cùng một người dùng về cố định một máy trong suốt phiên làm việc.

Cách này giải quyết được lỗi văng đăng nhập tức thời nhưng tạo ra sự lệch tải nghiêm trọng:
- Hàng nghìn nhân viên trong cùng một toà nhà văn phòng hoặc mạng di động NAT đi ra ngoài bằng chung một địa chỉ IP công cộng sẽ bị dồn hết vào đúng một máy chủ.
- Ngay cả khi chia theo cookie, nếu 10 khách hàng doanh nghiệp trên App A đồng loạt chạy tác vụ nặng, Load Balancer không được phép san bớt các request tiếp theo của họ sang App B đang rảnh rỗi.

## 3. Điểm yếu lớn nhất của Sticky Session: máy chủ sập là mất trạng thái

```step
category: PROBLEM
short: Rủi ro sập máy
scene: s3-sticky-crash
activity: S2-06.A1
gate: optional
callout:
  kind: watch-out
  title: Mở rộng và thu hồi tự động trở nên bất khả thi
  vi: "Không chỉ khi máy hỏng đột ngột, ngay cả lúc Autoscaling tắt bớt máy ban đêm hoặc triển khai bản mới cũng làm đứt phiên của người dùng trên máy đó."
whatChanged:
  - "~ App A dừng hoạt động đột ngột, toàn bộ phiên trong RAM cục bộ biến mất"
  - "~ Người dùng chuyển sang App B bị mất giỏ hàng và buộc phải đăng nhập lại"
telemetry:
  - label: "Trạng thái App A"
    value: "Ngừng hoạt động"
    tone: bad
  - label: "Phiên trên App A"
    value: "Mất 100%"
    tone: bad
```

Rủi ro nghiêm trọng hơn của thiết kế giữ trạng thái cục bộ nằm ở lúc xảy ra sự cố hoặc bảo trì:

1. **Sự cố phần cứng hoặc tràn bộ nhớ (OOM):** Khi tiến trình trên App A dừng đột ngột, toàn bộ dữ liệu phiên và giỏ hàng chưa thanh toán nằm trong RAM riêng của App A mất trắng. Khi Health Check chuyển hướng người dùng sang App B, họ bị văng ra màn hình đăng nhập ngay giữa bước thanh toán.
2. **Cản trở Autoscaling và Rolling Deploy:** Bạn không thể tự do tắt bớt máy ảo khi vắng khách hay thay container mới mỗi lần phát hành code nếu mỗi máy đang ôm hàng nghìn phiên độc quyền chưa lưu ra ngoài.

## 4. Kiến trúc chuẩn 1: tách phiên ra kho bộ nhớ đệm dùng chung

```step
category: MECHANISM
short: Session Cache
scene: s4-shared-session
callout:
  kind: key-idea
  title: Máy chủ ứng dụng trở thành linh kiện thay thế tự do
  vi: "Khi trạng thái nằm ở kho dùng chung bên ngoài, mọi máy App đều hoàn toàn ngang hàng: hỏng máy nào chỉ cần thay máy mới mà người dùng không hề nhận ra."
whatChanged:
  - "+ Đặt cụm Session Cache (Redis) dùng chung cho cả App A, App B và App C"
  - "~ Bỏ Sticky Session, trả Load Balancer về chế độ chia tải tự do"
telemetry:
  - label: "Độ trễ đọc phiên"
    value: "≈ 0,8 ms"
    tone: ok
  - label: "Mất phiên khi sập App"
    value: "0%"
    tone: ok
  - label: "Thu hồi phiên"
    value: "Tức thì (DEL key)"
    tone: ok
```

Để biến tầng ứng dụng thành **phi trạng thái (Stateless)**, ta dời toàn bộ dữ liệu phiên sang một kho lưu trữ khoá-giá trị trong bộ nhớ RAM dùng chung (phổ biến nhất là **Redis** hoặc **Memcached**):

```python
def get_current_user(session_id: str) -> dict | None:
    raw = redis_client.get(f"session:{session_id}")
    return json.loads(raw) if raw else None

def save_session(session_id: str, payload: dict) -> None:
    # Lưu dùng chung kèm thời hạn tự huỷ 1.800 giây (30 phút)
    redis_client.setex(f"session:{session_id}", 1800, json.dumps(payload))
```

Trình duyệt chỉ giữ một `session_id` ngẫu nhiên không đoán được trong cookie `HttpOnly`. Dù Load Balancer gửi request số 1 vào App A, request số 2 vào App B hay request số 3 vào App C, máy nào cũng tra cứu `session:<id>` trong chưa đầy `1 ms` và phục vụ liền mạch. Lưu ý quan trọng: bản thân cụm **Session Cache** lúc này giữ trạng thái nên cần chạy tối thiểu mô hình **Primary + Replica** để tránh trở thành điểm lỗi đơn mới.

## 5. Kiến trúc chuẩn 2: thẻ tự chứa chữ ký số (Stateless Token / JWT)

```step
category: TECHNIQUE
short: Stateless JWT
scene: s5-jwt
callout:
  kind: compare
  title: Session Store so với JWT
  vi: "Session Store thêm ~1 ms tra mạng nhưng xoá phiên được ngay lập tức; JWT không tốn lượt tra cứu kho phiên nhưng khó thu hồi trước khi hết hạn."
whatChanged:
  - "~ Đóng gói user_id, vai trò và mốc hết hạn exp vào thẻ JWT có chữ ký mật mã"
  - "- Bỏ chặng tra cứu kho phiên trên luồng đọc thông thường"
telemetry:
  - label: "Tra cứu kho phiên"
    value: "0 lượt / request"
    tone: ok
  - label: "Thu hồi tức thì"
    value: "Cần thêm Denylist"
    tone: warn
```

Một hướng thứ hai là đẩy trạng thái xác thực về phía chính request bằng **JSON Web Token (JWT)**. Sau khi kiểm tra mật khẩu, máy chủ phát hành một chuỗi dữ liệu gồm `user_id`, quyền cơ bản và hạn dùng ngắn (`exp`, ví dụ `15 phút`), được ký bằng khoá bí mật HMAC hoặc cặp khoá bất đối xứng RSA/ECDSA.

Ở các request tiếp theo, bất kỳ máy App nào cũng tự kiểm tra chữ ký số bằng CPU trong vài phần mười mili-giây mà không cần gọi sang Redis.

| Tiêu chí | Shared Session Store (Redis) | Stateless Token (JWT) |
|---|---|---|
| Chi phí mỗi request | Thêm 1 lượt gọi mạng nội bộ (`~0,8 ms`) | Chỉ tính toán kiểm tra chữ ký trên CPU |
| Kích thước cookie/header | Rất nhỏ (chỉ mã `session_id` 24–32 byte) | Lớn hơn (vài trăm byte tới vài KB gửi lặp lại) |
| Thu hồi khẩn cấp (khoá tài khoản, đăng xuất từ xa) | Xoá 1 khoá trên Redis là có hiệu lực ngay | Token cũ vẫn hợp lệ tới hạn `exp` nếu không tra thêm danh sách thu hồi (*denylist*) |

Thực tế nhiều hệ thống kết hợp cả hai: dùng Access Token JWT ngắn hạn (`5–15 phút`) cho các API gọi dày đặc, và lưu Refresh Token dài hạn trong kho tập trung để kiểm soát thu hồi.

## 6. Đừng bỏ sót trạng thái ẩn: tệp tải lên trên ổ đĩa cục bộ

```step
category: PITFALL
short: Tệp trên đĩa
scene: s6-object-storage
callout:
  kind: watch-out
  title: Mọi dữ liệu ghi xuống ổ đĩa riêng đều biến dịch vụ thành Stateful
  vi: "Kiểm tra ba thứ trước khi kết luận dịch vụ đã Stateless: biến toàn cục trong RAM, tệp ghi ra thư mục cục bộ và tác vụ hẹn giờ chạy ngầm trên 1 máy."
whatChanged:
  - "+ Chuyển toàn bộ ảnh đại diện, báo cáo xuất ra sang Object Storage dùng chung"
  - "~ Database chỉ lưu URL / khoá đối tượng, tầng App không giữ tệp nào trên đĩa"
telemetry:
  - label: "Ổ đĩa cục bộ App"
    value: "Chỉ chứa mã chạy"
    tone: ok
  - label: "Độ bền tệp"
    value: "Sao lưu đa vùng"
    tone: ok
```

Nhiều hệ thống đã đưa phiên sang Redis nhưng vẫn gặp lỗi ngắt quãng vì quên mất **tệp nhị phân trên đĩa cục bộ**. Ví dụ người dùng tải ảnh đại diện lên được xử lý bởi App A và lưu vào `/var/www/uploads/u42.png`. Một giây sau trình duyệt tải ảnh đó nhưng Load Balancer lại dẫn vào App C — máy này không có tệp trên đĩa nên trả về `404 Not Found`; tệ hơn, khi container App A được tái tạo lúc triển khai phiên bản mới, bức ảnh biến mất vĩnh viễn.

Quy tắc chuẩn là không bao giờ lưu dữ liệu nghiệp vụ vào ổ đĩa cục bộ của máy chủ ứng dụng (ngoài bộ đệm tạm có thể xoá bất kỳ lúc nào). Mọi ảnh, tài liệu và bản xuất dữ liệu cần ghi thẳng lên **Object Storage** dùng chung (như Amazon S3, Google Cloud Storage, MinIO), còn Database chỉ lưu dòng metadata đường dẫn.

## 7. Thực hành mô phỏng: chuyển đổi từ máy đơn giữ phiên sang cụm Stateless

```step
category: PROBLEM
short: Sửa cụm App
scene: s7-live-crash
live: session
activity: S2-06.A2
gate: required
callout:
  kind: technique
  title: Đảm bảo công suất N + 1 và sao lưu kho phiên
  vi: "Ở mức tải 650 req/s với mỗi máy App chịu 450 req/s, bạn cần bật đủ 3 máy để khi 1 máy sập ở giây 22 thì 2 máy còn lại (900 req/s) vẫn gánh dư dả."
whatChanged:
  - "~ Giây 22: App A dừng đột ngột khi đang chạy ở tải 650 req/s"
  - "~ Bật cụm Stateless 3 máy, rút ngắn Health Check và nhân bản Session Cache"
telemetry:
  - label: "Tải đầu vào"
    value: "650 req/s"
  - label: "Năng lực mỗi App"
    value: "450 req/s"
  - label: "Ngân sách chi phí"
    value: "≤ 1,85 USD/giờ"
    tone: warn
```

Trong mô phỏng trực tiếp này, cấu hình xuất phát chỉ chạy duy nhất **App A** (`450 req/s`) với Sticky Session và chu kỳ Health Check dài `18 giây`. Ngay từ đầu máy đã quá tải ở `650 req/s`, và tới giây `22` khi App A dừng hoạt động thì tỷ lệ lỗi vọt lên `100%`.

Hãy hoàn thành bài tập sửa hệ thống bằng cách:
- Bật thêm cả **App B** và **App C** để tổng công suất đạt `1.350 req/s` lúc bình thường và giữ được `900 req/s` (`ρ ≈ 0,72`) sau khi App A ngừng chạy.
- Chuyển định tuyến trên Load Balancer sang `round-robin` (hoặc `least-conn`) kèm chu kỳ Health Check `1 giây` để gỡ máy hỏng ngay lập tức.
- Tăng `replicas` của **Session Cache** lên `2` để kho lưu phiên cũng được bảo vệ trước lỗi phần cứng đơn lẻ.

## 8. Tóm tắt: ba quy tắc vàng của tầng dịch vụ phi trạng thái

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Tách tính toán khỏi lưu trữ
  vi: "Giữ tầng tính toán hoàn toàn phi trạng thái để mở rộng ngang tức thì; gom trạng thái về đúng các hệ lưu trữ chuyên dụng có cơ chế sao chép bền vững."
whatChanged:
  - "+ Tổng kết cách tách tầng tính toán Stateless khỏi tầng lưu trữ trạng thái"
telemetry:
  - label: "Phiên đăng nhập"
    value: "Redis / JWT"
    tone: ok
  - label: "Tệp nhị phân"
    value: "Object Storage"
    tone: ok
  - label: "Tầng App"
    value: "100% Stateless"
    tone: ok
```

Trước khi mở rộng ngang bất kỳ dịch vụ nào sau Load Balancer, hãy kiểm chứng ba điểm cốt lõi:

1. **Không cậy vào Sticky Session để bảo toàn dữ liệu:** Sticky Session chỉ là giải pháp chuyển tiếp ngắn hạn cho hệ thống cũ; nó gây lệch tải và mất sạch phiên mỗi khi máy chủ khởi động lại.
2. **Chọn đúng cách lưu phiên:** Dùng **Shared Session Store (Redis có bản sao)** khi cần thu hồi phiên tức thì và lưu giỏ hàng/trạng thái thay đổi nhanh; dùng **JWT ngắn hạn** khi muốn giảm lượt tra cứu nội bộ giữa nhiều dịch vụ.
3. **Đưa mọi tệp ra khỏi đĩa cục bộ:** Tệp tải lên thuộc về **Object Storage**, dữ liệu giao dịch thuộc về **Database**; máy chủ ứng dụng chỉ giữ mã thực thi để có thể tạo mới hoặc huỷ bỏ tự do trong vài giây.
