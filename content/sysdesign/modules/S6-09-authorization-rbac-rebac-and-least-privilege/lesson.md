## 1. Đã đăng nhập không đồng nghĩa với được phép: AuthN và AuthZ

```step
category: SETUP
short: AuthN vs AuthZ
scene: s1-authn-vs-authz
callout:
  kind: key-idea
  title: Nguyên tắc cốt lõi
  vi: "Xác thực (AuthN) chỉ trả lời bạn là ai. Phân quyền (AuthZ) phải trả lời bạn có được phép xem hay sửa đúng tài nguyên này không — và phải kiểm tra ở mọi request."
whatChanged:
  - "+ Người dùng Tenant A gửi token hợp lệ nhưng gọi hóa đơn #902 của Tenant B"
  - "~ AuthZ bỏ qua kiểm tra sở hữu khiến DB trả nhầm dữ liệu chéo tenant"
telemetry:
  - label: "Xác thực JWT"
    value: "Hợp lệ (Tenant A)"
    tone: ok
  - label: "Kiểm tra sở hữu"
    value: "Thiếu"
    tone: bad
  - label: "Rò rỉ dữ liệu"
    value: "Cao"
    tone: bad
```

Một nhầm lẫn phổ biến khi thiết kế hệ thống nhiều khách hàng (multi-tenant) là chỉ kiểm tra người dùng đã đăng nhập ở API Gateway rồi tin tưởng mọi tham số đi kèm. Khi `GET /invoices/902` đi vào hệ thống với JWT hợp lệ của Tenant A, lớp xác thực (Authentication) cho qua vì chữ ký token đúng. Nếu tầng ứng dụng chỉ chạy `SELECT * FROM invoices WHERE id = 902`, hóa đơn của Tenant B sẽ bị lộ ngay lập tức.

Đây là lỗ hổng **IDOR (Insecure Direct Object Reference)**. Kiểm tra theo route (ví dụ chỉ kiểm tra `isAuthenticated`) là chưa đủ; hệ thống phải kiểm tra quyền theo từng đối tượng cụ thể ở mọi yêu cầu đọc, sửa, xóa.

## 2. Kiểm tra quyền sở hữu và Row-Level Security tại Database

```step
category: TECHNIQUE
short: Ownership & RLS
scene: s2-ownership-rls
callout:
  kind: technique
  title: Phòng vệ hai lớp
  vi: "Luôn lấy tenant_id từ token đã xác thực thay vì từ URL hay body, đồng thời bật Row-Level Security (RLS) ở Database làm chốt chặn cuối."
whatChanged:
  - "+ Mọi truy vấn gắn thêm điều kiện tenant_id trích từ JWT"
  - "+ Database kích hoạt Row-Level Security theo phiên kết nối"
telemetry:
  - label: "Lọc ở App"
    value: "WHERE tenant_id = 'A'"
    tone: ok
  - label: "Chốt chặn DB"
    value: "RLS Enabled"
    tone: ok
```

Để chặn IDOR triệt để, mọi truy vấn phải gắn ngữ cảnh sở hữu lấy từ phiên hoặc token đã xác thực:

```sql
-- An toàn: tenant_id lấy từ JWT ở server, không lấy từ request body
SELECT id, amount, status
FROM invoices
WHERE id = $1 AND tenant_id = $2;
```

Tuy nhiên, chỉ dựa vào kỷ luật lập trình viên ở tầng ứng dụng vẫn có rủi ro sót điều kiện `WHERE` ở một endpoint mới. Với **Row-Level Security (RLS)** trong PostgreSQL, Database tự động áp dụng chính sách lọc theo biến phiên `app.current_tenant` cho mọi câu lệnh `SELECT`, `INSERT`, `UPDATE`, `DELETE`. Ngay cả khi code ứng dụng quên lọc, Database vẫn từ chối trả về dòng dữ liệu của tenant khác.

## 3. Chống Mass Assignment bằng danh sách trường cho phép ghi

```step
category: PROBLEM
short: Mass Assignment
scene: s3-mass-assignment
callout:
  kind: watch-out
  title: Cẩn thận khi bind JSON
  vi: "Không bao giờ ánh xạ trực tiếp JSON từ client vào model cơ sở dữ liệu; kẻ tấn công có thể tự thêm trường role hoặc tenant_id."
whatChanged:
  - "+ Client gửi thêm trường role: admin trong payload cập nhật hồ sơ"
  - "~ API lọc theo allow-list, chỉ giữ lại name và phone"
telemetry:
  - label: "Trường gửi lên"
    value: "name, role"
    tone: warn
  - label: "Trường cho ghi"
    value: "Allow-list: name"
    tone: ok
```

Ở nhiều framework, lập trình viên thường viết `user.update(request.json)` để tiết kiệm thời gian. Nếu bảng `users` có cột `role` hoặc `is_admin`, người dùng chỉ cần gửi `{"name": "An", "role": "admin"}` là có thể tự nâng quyền. Lỗ hổng này gọi là **Mass Assignment**.

Cách xử lý chuẩn là dùng **danh sách trường cho phép ghi (allow-list)** thông qua DTO hoặc schema xác thực tường minh. Ngược lại với deny-list (cấm một vài trường, rất dễ sót khi thêm cột mới), allow-list quy định chính xác những trường nào endpoint được phép nhận và loại bỏ toàn bộ phần còn lại.

## 4. Mô hình phân quyền: RBAC và ReBAC theo quan hệ

```step
category: MECHANISM
short: RBAC & ReBAC
scene: s4-rbac-rebac-graph
callout:
  kind: good-to-know
  title: Chọn đúng mô hình
  vi: "RBAC gọn cho quyền theo vai trò chức năng; ReBAC giải quyết bài toán chia sẻ tài nguyên, nhóm lồng nhau và thừa kế thư mục."
whatChanged:
  - "+ Hiển thị đồ thị RBAC (User → Role → Permission) và ReBAC (Zanzibar)"
  - "~ Quyền sửa tài liệu thừa kế qua quan hệ nhóm và thư mục cha"
telemetry:
  - label: "RBAC"
    value: "User → Role → Perm"
  - label: "ReBAC"
    value: "(User, Rel, Object)"
    tone: ok
```

Khi hệ thống phát triển, kiểm tra quyền sở hữu đơn thuần không còn đủ cho các kịch bản cộng tác:

| Tiêu chí | RBAC (Role-Based) | ReBAC (Relationship-Based) |
|---|---|---|
| Cấu trúc | `User → Role → Permission` | Bộ ba `(user, relation, object)` |
| Điểm mạnh | Đơn giản, dễ kiểm toán theo vai trò | Hỗ trợ chia sẻ từng file, nhóm lồng nhau, thừa kế cha-con |
| Nhược điểm | Bùng nổ số lượng role nếu phân quyền chi tiết | Cần lưu đồ thị quan hệ và tối ưu truy vấn |
| Ví dụ | `admin` được xóa hóa đơn toàn công ty | `Bình` là `member` của `Team Design`, nên sửa được `Doc` trong `Folder Q4` |

Thay vì rải logic kiểm tra quyền ở hàng chục microservice, các đội thường tách một **Policy Decision Point (AuthZ Service)** dùng chung (như mô hình Google Zanzibar / OpenFGA) để quyết định nhất quán tại một nơi.

## 5. Nguyên tắc quyền tối thiểu (Least Privilege)

```step
category: TECHNIQUE
short: Least Privilege
scene: s5-least-privilege
callout:
  kind: technique
  title: Tách credential theo dịch vụ
  vi: "Mỗi dịch vụ chỉ được cấp đúng quyền cần cho nhiệm vụ của nó. Dịch vụ xuất báo cáo không được giữ khóa quản trị toàn bộ Database."
whatChanged:
  - "+ Tách tài khoản DB riêng cho dịch vụ báo cáo (chỉ SELECT bảng invoices)"
  - "~ Thu hẹp phạm vi ảnh hưởng nếu xảy ra lỗ hổng truy vấn"
telemetry:
  - label: "Quyền dịch vụ"
    value: "SELECT invoices"
    tone: ok
  - label: "Bán kính ảnh hưởng"
    value: "Tối thiểu"
    tone: ok
```

Khi nhiều dịch vụ dùng chung một chuỗi kết nối `superuser` tới Database, chỉ một lỗ hổng SQL Injection ở dịch vụ phụ ít quan trọng (như dịch vụ xuất báo cáo PDF) có thể làm lộ hoặc xóa sạch toàn bộ bảng dữ liệu nhạy cảm của hệ thống.

Theo nguyên tắc **Least Privilege (Quyền tối thiểu)**:
- Mỗi microservice có tài khoản Database hoặc IAM Role riêng biệt.
- Chỉ cấp đúng thao tác (`SELECT` thay vì `ALL PRIVILEGES`) và giới hạn trên đúng tập bảng cần dùng.
- Tách riêng tài khoản di trú schema (chỉ dùng trong pipeline CI/CD) khỏi tài khoản chạy ứng dụng hằng ngày.

## 6. Phòng tránh lỗi Confused Deputy

```step
category: PROBLEM
short: Confused Deputy
scene: s6-confused-deputy
callout:
  kind: watch-out
  title: Đừng mượn quyền mù quáng
  vi: "Khi dịch vụ trung gian có đặc quyền cao thực thi yêu cầu hộ người dùng mà không kiểm tra lại quyền của người dùng đó, kẻ gọi có thể lợi dụng đặc quyền của dịch vụ."
whatChanged:
  - "~ Worker dùng quyền admin của chính nó để xóa tệp theo ID client gửi"
  - "+ Cần truyền ngữ cảnh danh tính user để AuthZ kiểm tra lại"
telemetry:
  - label: "Ngữ cảnh kiểm tra"
    value: "Thiếu user_id gốc"
    tone: bad
  - label: "Rủi ro lạm quyền"
    value: "Cao"
    tone: bad
```

**Confused Deputy (Phó thác nhầm quyền)** xảy ra khi một dịch vụ có quyền rộng (ví dụ Worker xử lý tệp hoặc dịch vụ tạo báo cáo) nhận đầu vào từ người dùng, rồi dùng chính danh nghĩa của dịch vụ đó để đọc hoặc xóa tài nguyên mà bản thân người dùng không có quyền chạm tới.

Để khắc phục, dịch vụ trung gian phải **hành động với danh nghĩa người dùng (on-behalf-of)**: chuyển tiếp token/danh tính người dùng cuối tới lớp AuthZ hoặc kiểm tra tường minh xem `original_user_id` có quyền trên tài nguyên đích trước khi dùng quyền hệ thống thực thi.

## 7. Audit Log và điểm nghẽn hiệu năng ở AuthZ Service

```step
category: PROBLEM
short: Audit & AuthZ
scene: s7-bottleneck-check
activity: S6-09.A1
gate: optional
callout:
  kind: key-idea
  title: Ghi vết bất biến & tối ưu AuthZ
  vi: "Audit Log ghi lại ai đã làm gì lên tài nguyên nào và kết quả ra sao. Đồng thời phải theo dõi tải lên AuthZ Service vì mọi request đều đi qua nó."
whatChanged:
  - "~ Tải tăng lên 825 req/s khiến AuthZ Service (μ = 600 req/s) bị quá tải"
  - "+ Đẩy ghi Audit Log ra luồng bất đồng bộ để không làm chậm request"
telemetry:
  - label: "ρ của AuthZ (t = 25 s)"
    value: "1,38"
    tone: bad
  - label: "ρ của DB (t = 25 s)"
    value: "0,33"
    tone: ok
```

Mọi quyết định phân quyền quan trọng (đặc biệt là thao tác nhạy cảm hoặc lệnh bị từ chối `Deny`) cần ghi vào **Audit Log** bất biến gồm: `timestamp`, `actor_id`, `tenant_id`, `action`, `resource_id`, `decision`, `source_ip`. Audit Log giúp phát hiện sớm hành vi dò quét IDOR và phục vụ điều tra sau sự cố.

Về mặt kiến trúc, vì mọi request đều đi qua AuthZ Service nên nếu dịch vụ này truy vấn đồ thị quyền chưa có bộ nhớ đệm (cache) hoặc ghi Audit Log đồng bộ, nó rất dễ trở thành điểm nghẽn của toàn luồng như bạn có thể kiểm tra trong bài tập trên sân khấu.

## 8. Tổng kết: danh sách kiểm tra phân quyền

```step
category: RECAP
short: Tổng kết
scene: s2-ownership-rls
callout:
  kind: key-idea
  title: Bốn chốt chặn bảo vệ dữ liệu
  vi: "Kiểm tra quyền sở hữu ở mọi request, lọc trường ghi bằng allow-list, áp dụng Least Privilege và luôn truyền danh tính người dùng qua các bước trung gian."
whatChanged:
  - "~ Tổng hợp 4 lớp bảo vệ cho hệ thống nhiều tenant"
telemetry:
  - label: "Chống IDOR"
    value: "Ownership + RLS"
    tone: ok
  - label: "Chống leo thang"
    value: "Allow-list + Least Priv"
    tone: ok
```

Khi thiết kế hoặc rà soát một hệ thống nhiều tenant, hãy đối chiếu 5 điểm sau:
- **Mọi endpoint** đều kiểm tra quyền sở hữu theo `tenant_id` / `owner_id` lấy từ token đã xác thực, kết hợp **RLS** ở Database.
- **Mọi payload ghi** đều đi qua **allow-list** tường minh để chặn Mass Assignment.
- **RBAC** cho quyền theo vai trò chức năng, **ReBAC** cho quyền chia sẻ theo đồ thị quan hệ.
- **Least Privilege** cho từng credential dịch vụ và truyền ngữ cảnh người dùng để tránh **Confused Deputy**.
- **Audit Log** bất biến ghi lại mọi truy cập nhạy cảm và kết quả Allow/Deny.
