## 1. Năm thành phần cốt lõi trên đường đi của một request web

```step
category: SETUP
short: 5 thành phần
scene: s1-overview
callout:
  kind: key-idea
  title: Nhìn hệ thống theo chuỗi thành phần
  vi: "Một chức năng trong mã nguồn chỉ là một hàm, nhưng khi vận hành thực tế là chuỗi năm thành phần tương tác qua mạng, mỗi khối có năng lực xử lý μ và kiểu lỗi riêng."
whatChanged:
  - "+ Đường đi chuẩn: Client → Load Balancer → App Server → Cache → Database"
  - "~ Ở tải 200 req/s có Cache ấm, mức sử dụng ρ của Database chỉ khoảng 0,10"
telemetry:
  - label: "Tải đầu vào"
    value: "200 req/s"
  - label: "ρ App Server"
    value: "0,25"
    tone: ok
  - label: "ρ Database"
    value: "0,10"
    tone: ok
```

Khi đọc mã nguồn của một API lấy thông tin người dùng, lập trình viên thường chỉ thấy một lời gọi truy vấn dữ liệu. Ở góc nhìn kiến trúc hệ thống, mỗi lượt truy cập đi qua năm khối chức năng tách biệt: **Client**, **Load Balancer**, **App Server**, **Cache** và **Database**.

Mỗi thành phần đảm nhận một trách nhiệm chuyên biệt, có tốc độ xử lý tối đa μ khác nhau và cách mở rộng khác nhau:

- **Client** hiển thị giao diện và phát sinh yêu cầu qua Internet.
- **Load Balancer** nhận lưu lượng vào và chia đều cho các máy chủ ứng dụng.
- **App Server** thực thi quy tắc nghiệp vụ và điều phối luồng dữ liệu.
- **Cache** giữ dữ liệu đọc lặp lại trong RAM để phản hồi dưới một mili-giây.
- **Database** lưu trữ bền vững trên đĩa và bảo toàn tính đúng đắn của dữ liệu.

Nắm rõ giới hạn của từng khối là điều kiện đầu tiên để khoanh vùng sự cố thay vì tối ưu cảm tính.

## 2. Client: môi trường ngoài tầm kiểm soát và nguyên tắc xác thực phía server

```step
category: MECHANISM
short: Client
scene: s2-client
callout:
  kind: watch-out
  title: Không bao giờ tin dữ liệu từ Client
  vi: "Kiểm tra dữ liệu ở trình duyệt hoặc ứng dụng di động chỉ nhằm phản hồi nhanh cho trải nghiệm người dùng; mọi quy tắc bảo mật, quyền hạn và giá tiền bắt buộc phải tính lại ở Server."
whatChanged:
  - "+ Nổi bật khối Client (trình duyệt, ứng dụng di động) ở rìa ngoài Internet"
telemetry:
  - label: "Độ trễ mạng Internet"
    value: "≈ 30 ms"
  - label: "Độ tin cậy dữ liệu gửi lên"
    value: "Không tin cậy"
    tone: warn
```

**Client** (trình duyệt web, ứng dụng di động, thiết bị IoT) là tầng trình diễn nơi người dùng tương tác trực tiếp. Khác với các máy chủ đặt trong trung tâm dữ liệu, bạn không kiểm soát được thiết bị, tốc độ mạng hay phiên bản phần mềm của Client.

Người dùng hoặc tác nhân xấu luôn có thể chỉnh sửa mã JavaScript, can thiệp gói tin HTTP hoặc gọi thẳng vào API mà bỏ qua giao diện. Nếu Client gửi tổng tiền đơn hàng tính sẵn và Server ghi nhận nguyên giá trị đó, kẻ tấn công có thể sửa giá sản phẩm xuống mức tuỳ ý.

```python
def create_order(user_id: int, item_ids: list[int]) -> dict:
    # Chỉ nhận danh sách mã sản phẩm từ Client, tự tra giá gốc tại Server
    items = db.fetch_items(item_ids)
    total_cents = sum(item.price_cents for item in items)
    return db.insert_order(user_id=user_id, total_cents=total_cents)
```

Vì vậy, kiểm tra hợp lệ ở Client chỉ giúp báo lỗi tức thì trên màn hình, còn quyền quyết định hợp lệ luôn thuộc về tầng máy chủ.

## 3. Load Balancer: điều phối lưu lượng và loại bỏ máy chủ hỏng

```step
category: MECHANISM
short: Load Balancer
scene: s3-lb
callout:
  kind: good-to-know
  title: Load Balancer cũng cần dự phòng
  vi: "Một Load Balancer đơn lẻ sẽ trở thành điểm lỗi đơn (SPOF). Thực tế sản xuất luôn triển khai tối thiểu cặp Active-Standby hoặc phân tải qua nhiều vùng khả dụng."
whatChanged:
  - "+ Thêm Load Balancer đứng trước tầng App Server"
  - "~ Kiểm tra sức khoẻ định kỳ mỗi 3 giây để ngắt lưu lượng khỏi máy lỗi"
telemetry:
  - label: "Năng lực μ của LB"
    value: "10.000 req/s"
  - label: "ρ của LB (200 req/s)"
    value: "0,02"
    tone: ok
  - label: "Health Check"
    value: "3 giây"
```

Khi lưu lượng vượt quá khả năng xử lý của một máy chủ ứng dụng hoặc hệ thống cần duy trì hoạt động lúc triển khai phiên bản mới, ta đặt **Load Balancer** ở cửa ngõ vào tầng Backend.

Load Balancer thực hiện hai cơ chế chính:
1. **Chia tải (Routing):** phân phối request theo thuật toán như `Round Robin` (xoay vòng tuần tự khi các request đồng đều) hoặc `Least Connections` (ưu tiên máy đang giữ ít kết nối mở nhất khi thời gian xử lý chênh lệch lớn).
2. **Kiểm tra sức khoẻ (Health Check):** gửi tín hiệu thăm dò định kỳ tới từng App Server. Nếu một máy ngừng phản hồi, Load Balancer tự động rút máy đó khỏi danh sách nhận tải.

Ở quy mô nhỏ như công cụ nội bộ ít người dùng hoặc bản thử nghiệm đầu tiên, một máy chủ đơn là đủ; chỉ thêm Load Balancer khi cần mở rộng ngang hoặc yêu cầu độ sẵn sàng cao.

## 4. App Server: thực thi nghiệp vụ và lợi thế của thiết kế Stateless

```step
category: MECHANISM
short: App Server
scene: s4-app
callout:
  kind: compare
  title: Stateless so với Stateful
  vi: "App Server Stateless không cất phiên đăng nhập trong RAM cục bộ của máy, nhờ đó bất kỳ instance nào cũng xử lý được mọi request và dễ dàng thêm bớt máy tự động."
whatChanged:
  - "+ Nổi bật App Server xử lý nghiệp vụ ở khoảng 10 ms mỗi request"
  - "~ Thiết kế Stateless cho phép tăng số instance ngang không cần gắn cứng máy"
telemetry:
  - label: "Năng lực μ mỗi App"
    value: "800 req/s"
  - label: "ρ của App (200 req/s)"
    value: "0,25"
    tone: ok
  - label: "Độ trễ xử lý nền"
    value: "≈ 10 ms"
```

**App Server** là nơi kiểm tra quyền truy cập, thực thi quy tắc nghiệp vụ và kết hợp dữ liệu từ Cache hoặc Database để tạo câu trả lời.

Quyết định kiến trúc quan trọng nhất ở tầng này là chọn **Stateless** hay **Stateful**:

| Đặc tính | Stateless App Server | Stateful App Server |
|---|---|---|
| Nơi lưu phiên (Session) | Token đã ký hoặc kho chung (Redis, DB) | Biến trong bộ nhớ RAM riêng của từng máy |
| Định tuyến từ LB | Máy nào nhận request cũng xử lý được | Phải bật Sticky Session ghim vào đúng máy cũ |
| Khi một máy khởi động lại | Không mất phiên đăng nhập của người dùng | Toàn bộ người dùng trên máy đó bị văng phiên |
| Mở rộng ngang (Scale-out) | Thêm hoặc huỷ instance linh hoạt theo tải | Khó cân bằng tải đều khi số phiên lệch nhau |

Nhờ đặc tính dễ nhân bản ngang, mặc định hiện đại cho dịch vụ web và API là thiết kế Stateless; chỉ giữ trạng thái cục bộ với các bài toán đặc thù như máy chủ trò chơi thời gian thực.

## 5. Cache: giảm tải đọc bằng RAM và bài toán dữ liệu cũ

```step
category: TECHNIQUE
short: Cache
scene: s5-cache
callout:
  kind: key-idea
  title: Cache Hit Ratio quyết định mức giảm tải
  vi: "Với 90% lượt đọc và Cache Hit Ratio 89%, chỉ còn khoảng 20% tổng lưu lượng chạm tới Database. Nếu dữ liệu thay đổi liên tục hoặc mỗi người hỏi một khoá riêng biệt, Cache mang lại rất ít lợi ích."
whatChanged:
  - "+ Đặt Cache trước Database lưu 40.000 khoá nóng trên RAM"
  - "~ 89% lượt đọc nhận kết quả trong ~0,5 ms mà không cần truy vấn Database"
telemetry:
  - label: "Cache Hit Ratio"
    value: "89%"
    tone: ok
  - label: "Độ trễ tại Cache"
    value: "≈ 0,5 ms"
    tone: ok
  - label: "Lưu lượng lọt xuống DB"
    value: "≈ 40 req/s"
```

Truy xuất bộ nhớ RAM nhanh hơn đọc đĩa SSD từ hàng trăm đến hàng nghìn lần. **Cache** tận dụng chênh lệch này bằng cách giữ bản sao của các kết quả đọc phổ biến ngay trong RAM.

Mô hình thông dụng nhất là **Cache-Aside** (hoặc Read-Through): ứng dụng kiểm tra Cache trước; nếu trúng (**Cache Hit**), dữ liệu trả về trong chưa đầy 1 ms; nếu trượt (**Cache Miss**), hệ thống mới đọc Database rồi nạp kết quả vào Cache kèm thời gian sống **TTL (Time To Live)**.

Đánh đổi lớn nhất của Cache là **dữ liệu cũ (Stale Data)** khi bản gốc trong Database đã cập nhật nhưng bản lưu trên Cache chưa hết hạn:
- Đặt **TTL ngắn** (ví dụ 60–300 giây) phù hợp khi nghiệp vụ chấp nhận trễ vài phút.
- Kết hợp **xoá chủ động (Active Invalidation)** ngay sau lệnh ghi khi người dùng cần thấy dữ liệu mới tức thì.

Không nên đặt Cache cho dữ liệu ghi liên tục như bộ đếm tồn kho tức thời hoặc dữ liệu quá nhỏ mà Database tự trả lời đủ nhanh.

## 6. Database: nguồn sự thật bền vững và thứ tự tối ưu chuẩn

```step
category: MECHANISM
short: Database
scene: s6-db
activity: S1-01.A2
gate: optional
callout:
  kind: technique
  title: Bốn bậc tối ưu Database theo chi phí tăng dần
  vi: "Luôn kiểm tra chỉ mục (Index) và câu truy vấn trước, dùng Connection Pool ở bậc hai, tách Read Replica ở bậc ba, và chỉ phân mảnh Sharding khi một máy lớn đã chạm trần."
whatChanged:
  - "+ Nổi bật Database lưu trữ bền vững (μ = 400 req/s, xử lý nền ~8 ms)"
  - "~ Phục vụ toàn bộ lượt ghi và phần lượt đọc bị Cache Miss"
telemetry:
  - label: "Năng lực μ Database"
    value: "400 req/s"
  - label: "ρ khi Cache ấm"
    value: "0,10"
    tone: ok
  - label: "ρ ngay khi mất Cache"
    value: "0,49"
    tone: warn
```

**Database** là nguồn dữ liệu chuẩn xác cuối cùng (Source of Truth), chịu trách nhiệm ghi bền vững xuống đĩa và đảm bảo toàn vẹn giao dịch. Do phải phân tích câu truy vấn, giữ khoá đồng thời và đồng bộ I/O đĩa, Database thường có thông lượng tối đa μ thấp hơn nhiều so với tầng App hay Cache.

Khi Database bắt đầu bận, thứ tự can thiệp hiệu quả theo chi phí kỹ thuật là:
1. **Tối ưu truy vấn và chỉ mục (Index):** biến thao tác quét toàn bảng hàng giây thành tra cứu cây chỉ mục vài mili-giây.
2. **Tái sử dụng kết nối (Connection Pooling):** giữ sẵn tập kết nối mở thay vì bắt tay lại trên mỗi request.
3. **Bản sao đọc (Read Replicas):** tách lưu lượng đọc sang các máy phụ, đổi lấy độ trễ đồng bộ ngắn.
4. **Phân mảnh ngang (Sharding):** chia bảng lớn ra nhiều máy độc lập; chỉ dùng khi đã hết dư địa mở rộng dọc vì làm phức tạp truy vấn liên bảng.

## 7. Quan sát mô phỏng: tác động dây chuyền khi tầng Cache mất dữ liệu

```step
category: PROBLEM
short: Mất Cache
scene: s7-live
live: steady
activity: S1-01.A1
gate: required
callout:
  kind: watch-out
  title: Thiết kế Database phải tính đến lúc Cache rỗng
  vi: "Ở giây 25, sự kiện xoá trắng Cache làm toàn bộ 180 req/s lượt đọc dồn thẳng xuống Database. Ở 200 req/s Database còn chịu được (ρ ≈ 0,49), nhưng ở 450 req/s Database lập tức quá tải."
whatChanged:
  - "~ Giây 0–24: Cache ấm (Hit 89%), ρ Database chỉ 0,10"
  - "~ Giây 25: Cache mất dữ liệu đột ngột, ρ Database vọt lên 0,49 rồi hạ dần khi Cache ấm lại"
telemetry:
  - label: "ρ DB trước sự cố"
    value: "0,10"
    tone: ok
  - label: "ρ DB lúc giây 26"
    value: "0,49"
    tone: warn
  - label: "p99 lúc giây 26"
    value: "≈ 72 ms"
```

Hãy quan sát mô phỏng trực tiếp ở lưu lượng ổn định **200 req/s** (90% đọc, 10% ghi):

- **Từ giây 0 đến 24:** Cache đang ấm với tỉ lệ trúng 89%. Trong 180 req/s lượt đọc, Cache giải quyết khoảng 160 req/s; chỉ khoảng 20 req/s đọc trượt cộng 20 req/s lượt ghi đi xuống Database (tổng ≈ 40 req/s). Với μ = 400 req/s, Database thảnh thơi ở **ρ = 0,10**.
- **Tại giây 25:** Sự cố làm Cache mất toàn bộ khoá đang lưu. Ngay ở giây 26, gần như cả 200 req/s đổ dồn xuống Database, đẩy **ρ nhảy gấp năm lần lên 0,49** và độ trễ p99 tăng từ khoảng 59 ms lên 72 ms trước khi Cache nạp ấm trở lại.

Điều này cho thấy các thành phần không hỏng độc lập: nếu ở tải cao 450 req/s bạn chỉ cấp phát Database vừa khít cho phần lưu lượng sau Cache (khoảng 90 req/s), một lần khởi động lại cụm Cache sẽ đánh sập Database ngay lập tức.

## 8. Tóm tắt: bảng đối chiếu năm thành phần hệ thống web

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Ghi nhớ cốt lõi
  vi: "Mỗi thành phần giải quyết một giới hạn riêng: LB mở đường nhân bản ngang, App giữ logic Stateless, Cache chắn tải đọc cho đĩa, còn Database giữ tính toàn vẹn cuối cùng."
whatChanged:
  - "+ Tổng hợp vai trò, cách mở rộng và rủi ro của cả 5 thành phần"
telemetry:
  - label: "Thành phần dễ nghẽn nhất"
    value: "Database"
    tone: warn
  - label: "Mặc định cho App Server"
    value: "Stateless"
    tone: ok
```

Bảng dưới đây tóm tắt đặc trưng kỹ thuật của năm thành phần nền tảng để tra cứu nhanh khi thiết kế:

| Thành phần | Vai trò chính | Hướng mở rộng | Điểm rủi ro cần lưu ý |
|---|---|---|---|
| **Client** | Hiển thị giao diện, gửi request | Phân phối tài nguyên tĩnh qua CDN | Môi trường không tin cậy; cấm chỉ kiểm tra hợp lệ ở Client |
| **Load Balancer** | Chia tải, kiểm tra sức khoẻ máy đích | Cặp Active-Standby hoặc nhiều vùng | Thành điểm lỗi đơn nếu chỉ đặt một máy duy nhất |
| **App Server** | Xử lý quy tắc nghiệp vụ | Mở rộng ngang nhiều instance Stateless | Lưu session cục bộ trong RAM làm kẹt khả năng mở rộng ngang |
| **Cache** | Giữ dữ liệu đọc nóng trên RAM | Cụm phân mảnh theo khoá | Dữ liệu cũ trước khi hết TTL; dồn tải xuống DB khi mất Cache |
| **Database** | Lưu trữ bền vững, giao dịch chuẩn xác | Chỉ mục → Pool → Read Replica → Shard | I/O đĩa chậm hơn RAM nhiều bậc; khó nhân bản ghi ngang |
