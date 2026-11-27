## 1. Từ góc nhìn hàm trong mã nguồn sang góc nhìn thành phần hệ thống

```step
category: SETUP
short: Góc nhìn khối
scene: s1-overview
callout:
  kind: key-idea
  title: Hệ thống là các khối tương tác
  vi: "Ở cấp độ kiến trúc, ta không nhìn từng dòng lệnh đơn lẻ mà nhìn các thành phần độc lập gửi và nhận dữ liệu qua mạng."
whatChanged:
  - "+ Chuyển từ góc nhìn hàm get_user() sang chuỗi Client → App Server → Database"
  - "+ Quan sát luồng gói tin request và response đi qua từng chặng"
telemetry:
  - label: "Số chặng cơ bản"
    value: "3 thành phần"
  - label: "Tổng thời gian ví dụ"
    value: "260 ms"
```

Khi viết mã nguồn, lập trình viên làm việc với hàm, lớp và mô-đun bên trong một tiến trình. Khi thiết kế hệ thống, ta nâng tầm nhìn lên **góc nhìn kiến trúc (Architecture-level View)**: hệ thống là tập hợp các **thành phần (Components)** phối hợp với nhau qua các đường truyền mạng.

Một hàm đọc hồ sơ người dùng chỉ dài hai dòng lệnh, nhưng khi chạy thực tế nó đi qua ít nhất ba khối: **Client** gửi yêu cầu qua Internet (50 ms), **App Server** kiểm tra quyền và xử lý nghiệp vụ (10 ms), rồi truy vấn **Database** lấy bản ghi (200 ms).

Nhìn hệ thống thành từng khối riêng biệt giúp trả lời ngay ba câu hỏi thực tế: thành phần nào đang chiếm phần lớn thời gian (200 / 260 ms nằm ở Database), thành phần nào ngừng hoạt động sẽ làm gián đoạn toàn dịch vụ, và cần mở rộng ở khối nào khi người dùng tăng.

## 2. Tầng đón nhận lưu lượng: Client và Load Balancer

```step
category: MECHANISM
short: Client và LB
scene: s2-entry
callout:
  kind: watch-out
  title: Không tin dữ liệu từ phía Client
  vi: "Kiểm tra hợp lệ ở trình duyệt chỉ giúp trải nghiệm mượt hơn; mọi quy tắc bảo mật và giá tiền bắt buộc phải kiểm tra lại ở phía Server."
whatChanged:
  - "+ Thêm Load Balancer đứng trước tầng App Server để điều phối lưu lượng"
  - "~ Ghi nhớ ranh giới tin cậy giữa thiết bị người dùng và hạ tầng máy chủ"
telemetry:
  - label: "Độ tin cậy Client"
    value: "Không tin cậy"
    tone: warn
  - label: "Vai trò Load Balancer"
    value: "Chia tải & Dự phòng"
    tone: ok
```

Hai khối đầu tiên mà mọi yêu cầu từ bên ngoài đi qua là **Client** và **Load Balancer**:

- **Client (Trình duyệt / Ứng dụng di động):** Hiển thị giao diện, gửi request và dựng kết quả trả về. Vì mã chạy trên thiết bị của người dùng có thể bị chỉnh sửa tuỳ ý, hệ thống không bao giờ tin dữ liệu nhạy cảm do Client gửi lên (như đơn giá sản phẩm hay quyền hạn) mà phải xác thực lại ở máy chủ.
- **Load Balancer (Bộ cân bằng tải):** Nhận lưu lượng từ người dùng và phân phối sang nhiều máy chủ ứng dụng phía sau (ví dụ xoay vòng lần lượt theo *Round-robin* hoặc ưu tiên máy ít kết nối *Least Connections*).

Ở quy mô thử nghiệm vài trăm người dùng, một máy chủ ứng dụng có thể nhận request trực tiếp chưa cần Load Balancer. Khi cần chạy nhiều máy song song để tăng năng lực và tránh gián đoạn khi một máy bảo trì, Load Balancer trở thành điểm vào tiêu chuẩn.

## 3. Tầng xử lý và lưu trữ: App Server, Cache và Database

```step
category: MECHANISM
short: App, Cache, DB
scene: s3-storage
callout:
  kind: good-to-know
  title: Thiết kế App không trạng thái
  vi: "Khi App Server không giữ phiên đăng nhập trong RAM cục bộ (Stateless), bất kỳ máy nào trong cụm cũng xử lý được request tiếp theo của người dùng."
whatChanged:
  - "+ Ghép nối đầy đủ chuỗi đọc phổ biến: App Server → Cache → Database"
  - "~ Phân tách vai trò đọc nhanh trên RAM với lưu trữ bền vững trên đĩa"
telemetry:
  - label: "App Server"
    value: "Ưu tiên Stateless"
    tone: ok
  - label: "Đọc RAM vs Đọc đĩa"
    value: "Nhanh gấp hàng nghìn lần"
    tone: ok
```

Phía sau Load Balancer là ba thành phần đảm nhiệm phần cốt lõi của nghiệp vụ:

- **App Server (Máy chủ ứng dụng):** Thực thi quy tắc nghiệp vụ và điều phối luồng dữ liệu. Thiết kế **không trạng thái (Stateless)** — lưu trạng thái phiên ở kho chung thay vì biến toàn cục trong bộ nhớ máy lẻ — giúp thêm hoặc bớt máy chủ ứng dụng linh hoạt.
- **Cache (Bộ nhớ đệm trong RAM):** Giữ sẵn các dữ liệu được đọc lặp lại nhiều lần (như thông tin mặt hàng phổ biến) kèm thời hạn sống **TTL**. Lượt đọc trúng đệm (**Cache Hit**) trả kết quả ngay mà không chạm xuống đĩa; khi dữ liệu gốc cập nhật, cần xoá hoặc chờ khoá cũ hết hạn.
- **Database (Cơ sở dữ liệu bền vững):** Lưu trữ nguồn dữ liệu chính xác lâu dài trên ổ cứng. Vì thao tác đĩa và khoá giao dịch tốn nhiều tài nguyên hơn RAM, Database thường là thành phần cần được bảo vệ tải kỹ nhất.

Phần tính toán chi tiết thông lượng từng khối sẽ được học kỹ ở các bài `S1-01` và `S1-03`.

## 4. Hai kiểu giao tiếp: Đồng bộ (Sync) và Bất đồng bộ (Async)

```step
category: TECHNIQUE
short: Sync và Async
scene: s4-sync-async
callout:
  kind: compare
  title: Đường nét liền và đường nét đứt
  vi: "Giao tiếp đồng bộ (nét liền) bắt bên gọi đứng chờ phản hồi ngay; giao tiếp bất đồng bộ (nét đứt) ghi việc vào Message Queue rồi trả lời sớm."
whatChanged:
  - "+ Bổ sung nhánh bất đồng bộ nét đứt từ App Server qua Message Queue tới Worker"
  - "+ So sánh tác vụ cần phản hồi tức thì với tác vụ chạy nền kéo dài"
telemetry:
  - label: "Sync (nét liền)"
    value: "Đợi kết quả ngay"
  - label: "Async (nét đứt)"
    value: "Đệm qua Queue"
    tone: ok
```

Biết tên các thành phần mới là một nửa bức tranh; nửa còn lại là **cách chúng giao tiếp (Communication Patterns)**:

- **Đồng bộ (Synchronous — đường nét liền trên sơ đồ):** Bên gửi mở kết nối và chờ cho tới khi bên nhận xử lý xong mới đi bước kế tiếp. Phù hợp khi người dùng bắt buộc phải biết kết quả ngay lập tức, chẳng hạn kiểm tra mật khẩu lúc đăng nhập hoặc xác nhận thanh toán.
- **Bất đồng bộ (Asynchronous — đường nét đứt qua Message Queue):** `App Server` chỉ ghi một gói công việc vào **Message Queue** rồi phản hồi ngay cho người dùng; các tiến trình **Worker** phía sau lần lượt lấy việc ra xử lý.

```python
# Chọn kiểu giao tiếp theo yêu cầu phản hồi và thời gian xử lý
if needs_immediate_result:
    return call_downstream_sync(request)   # Đăng nhập, đọc hồ sơ
else:
    queue.enqueue("heavy_task", payload)   # Xử lý ảnh/video, gửi email
    return {"status": "accepted"}
```

Giao tiếp bất đồng bộ giúp giao diện phản hồi nhanh trong vài giây ngay cả khi tác vụ nền cần hàng chục giây, đồng thời dùng hàng đợi làm vùng đệm hấp thụ các đợt lưu lượng tăng đột biến.

## 5. Đọc luồng dữ liệu để nhận diện bước chậm nhất

```step
category: PROBLEM
short: Bước chậm nhất
scene: s5-slow-step
callout:
  kind: key-idea
  title: Chuỗi chỉ nhanh bằng mắt xích chậm nhất
  vi: "Trên một đường đi nối tiếp, tối ưu chặng 10 ms không tạo khác biệt đáng kể nếu chặng Database đang mất 500 ms."
whatChanged:
  - "+ Gắn thời gian minh hoạ lên từng chặng để tìm mắt xích chiếm tỷ trọng lớn nhất"
  - "~ Nhận diện Database (500 ms) là bước giới hạn tốc độ phản hồi trang chủ"
telemetry:
  - label: "Tổng thời gian tải"
    value: "940 ms"
  - label: "Chặng Database"
    value: "500 ms (53%)"
    tone: bad
```

Khi đã vẽ được sơ đồ thành phần và đường truyền, ta lần theo **luồng dữ liệu (Data Flow)** của một thao tác cụ thể để tìm bước chậm nhất.

Ví dụ một lượt tải trang chủ lần đầu đi qua các bước nối tiếp: phân giải DNS và bắt tay kết nối (170 ms), truyền request tới máy chủ và xử lý ứng dụng (40 ms), truy vấn **Database** chưa có chỉ mục (500 ms), dựng kết quả trả về và hiển thị trên trình duyệt (230 ms). Tổng cộng mất **940 ms**, trong đó riêng Database chiếm hơn một nửa thời gian.

Nhìn vào bảng phân rã này, hướng xử lý hợp lý hiện ra rõ ràng: bổ sung chỉ mục cho truy vấn chậm và đặt Cache cho dữ liệu trang chủ đưa chặng 500 ms về khoảng 5 ms, kéo tổng thời gian xuống còn **445 ms** mà không cần đụng tới các chặng vốn đã nhanh.

## 6. Thực hành phân tích luồng đăng ảnh thực tế

```step
category: REAL_CODE
short: Luồng đăng ảnh
scene: s6-post-flow
activity: S0-03.A1
gate: required
callout:
  kind: technique
  title: Kết hợp Sync và Async trong cùng một tính năng
  vi: "Bước xác nhận bài đăng của tác giả dùng Sync để phản hồi ngay; bước phân phối bài đăng tới hàng nghìn người theo dõi dùng Async qua Queue."
whatChanged:
  - "+ Áp dụng cả 7 thành phần vào luồng đăng ảnh mạng xã hội"
  - "+ Tách phần lưu bài đăng đồng bộ khỏi phần phân phối bảng tin bất đồng bộ"
telemetry:
  - label: "Chặng của người đăng"
    value: "Sync (phản hồi nhanh)"
    tone: ok
  - label: "Chặng phân phối Feed"
    value: "Async qua Queue"
    tone: ok
```

Hãy ghép toàn bộ kiến thức khởi động vào một tính năng quen thuộc: **người dùng đăng một bức ảnh mới lên mạng xã hội**.

Nếu hệ thống thực hiện đồng bộ từ đầu đến cuối — lưu ảnh, ghi Database, rồi lần lượt chèn bài viết mới vào bảng tin Cache của hàng chục nghìn người theo dõi trước khi trả kết quả — người đăng ảnh sẽ phải nhìn màn hình xoay chờ rất lâu hoặc bị ngắt kết nối.

Thiết kế thực tế chia luồng thành hai nửa rõ rệt:

1. **Nửa đồng bộ (Sync):** Ứng dụng di động gửi thông tin bài đăng qua `Load Balancer` vào `App Server`; `App Server` lưu bản ghi gốc vào `Database`, đẩy một sự kiện `fanout_post` vào `Message Queue`, rồi trả ngay thông báo đăng thành công cho tác giả.
2. **Nửa bất đồng bộ (Async):** `Worker` nền đọc sự kiện từ `Message Queue`, truy vấn danh sách người theo dõi và cập nhật dần vào tầng `Cache` bảng tin để người theo dõi mở ứng dụng là đọc thấy nhanh.

Hãy sắp xếp đúng thứ tự các bước của luồng này trong bài tập bên dưới.

## 7. Tóm tắt: ba câu hỏi khởi động trước mọi hệ thống

```step
category: RECAP
short: Tóm tắt
scene: s7-recap
callout:
  kind: key-idea
  title: Khung quan sát hệ thống
  vi: "Trước bất kỳ tính năng nào, hãy hỏi: gồm những thành phần nào, nối với nhau đồng bộ hay bất đồng bộ, và bước nào đang chậm nhất?"
whatChanged:
  - "+ Tổng kết mô hình tư duy Thành phần · Giao tiếp · Bước giới hạn"
telemetry:
  - label: "Thành phần cốt lõi"
    value: "Client · LB · App · Cache · DB · Queue"
  - label: "Bước tiếp theo"
    value: "S0-04: Ràng buộc thực tế"
    tone: ok
```

Bài khởi động này thiết lập cách nhìn một phần mềm như một hệ thống gồm các khối phối hợp:

1. **Nhận diện thành phần (Components):** Tách bạch vai trò giao diện không tin cậy (`Client`), điều phối tải (`Load Balancer`), xử lý không trạng thái (`App Server`), đọc nhanh trong RAM (`Cache`), lưu trữ nguồn sự thật (`Database`) và xử lý nền (`Message Queue` + `Worker`).
2. **Chọn kiểu giao tiếp (Communication):** Dùng **Sync** khi người dùng cần câu trả lời tức thì; dùng **Async** qua hàng đợi khi tác vụ kéo dài hoặc cần đệm tải.
3. **Lần theo luồng dữ liệu:** Tìm chặng chiếm tỷ trọng thời gian lớn nhất để cải thiện đúng chỗ.

Sang Phase 1 (`S1-01` đến `S1-03`), bạn sẽ định lượng chính xác từng thành phần này bằng tốc độ xử lý `μ`, mức sử dụng `ρ` và mô phỏng trực tiếp.
