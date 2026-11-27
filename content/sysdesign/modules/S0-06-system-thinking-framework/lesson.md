## 1. Góc nhìn hệ thống (System Thinking) so với góc nhìn từng hàm

```step
category: SETUP
short: Góc nhìn tổng
scene: s1-overview
callout:
  kind: key-idea
  title: Nhìn đường đi trước khi đọc từng dòng mã
  vi: "Một hàm viết gọn vẫn thất bại nếu thành phần phía sau quá tải hoặc đường truyền bị ngắt. Góc nhìn hệ thống đặt câu hỏi dữ liệu đi từ đâu tới đâu và điều gì xảy ra khi một mắt xích chậm lại."
whatChanged:
  - "+ Đường đi cơ bản từ Người dùng qua API Server tới Database"
  - "~ Mở rộng tầm nhìn từ bên trong một hàm sang ranh giới mạng giữa các thành phần"
telemetry:
  - label: "Cấp độ mã nguồn"
    value: "Hàm · Biến · Thuật toán"
  - label: "Cấp độ hệ thống"
    value: "Luồng · Độ trễ · Điểm lỗi"
    tone: ok
```

Khi mới phát triển phần mềm, lập trình viên thường tập trung vào bên trong một hàm: nhận tham số, gọi `cache.get()`, nếu trống thì chạy câu lệnh `SELECT` rồi trả về kết quả. Góc nhìn mức mã nguồn (**Code-level view**) cần thiết để viết logic đúng, nhưng không cho thấy điều gì xảy ra bên ngoài tiến trình đó.

**Tư duy hệ thống (System Thinking)** lùi lại một bước để quan sát toàn bộ các thành phần và mối tương tác giữa chúng trên đường mạng:

- Request xuất phát từ thiết bị nào, đi qua mấy chặng mạng trước khi chạm tới hàm xử lý?
- Nếu `Cache` mất kết nối hoặc `Database` phản hồi chậm gấp 20 lần bình thường, luồng xử lý ở `API Server` bị kẹt ra sao?
- Công việc nào người dùng bắt buộc phải chờ ngay, công việc nào có thể tách ra xử lý nền?

Nắm được bức tranh tổng thể giúp bạn khoanh vùng sự cố trong vài phút bằng số đo từng chặng thay vì đọc mò hàng nghìn dòng mã.

## 2. Khuôn mẫu phổ quát: Input → Processing → Storage → Output

```step
category: MECHANISM
short: Chuỗi I-P-S-O
scene: s2-ipso
callout:
  kind: good-to-know
  title: Bốn bước hiện diện ở mọi quy mô
  vi: "Dù hệ thống có 3 hay 300 dịch vụ, mọi tính năng đều quy về bốn pha: tiếp nhận đầu vào, thực thi nghiệp vụ, lưu trữ bền vững và phát đầu ra."
whatChanged:
  - "+ Thêm Load Balancer điều phối đầu vào trước tầng Processing"
  - "+ Gắn nhãn 4 pha Input → Processing → Storage → Output trên luồng"
telemetry:
  - label: "Pha 1 – 2"
    value: "Input → Processing"
  - label: "Pha 3 – 4"
    value: "Storage → Output"
    tone: ok
```

Mọi hệ thống phần mềm — từ trang đặt hàng thương mại điện tử, ứng dụng nhắn tin đến đường ống phân tích dữ liệu — đều vận hành theo khuôn mẫu bốn pha **Input → Processing → Storage → Output**:

| Hệ thống | Input (Đầu vào) | Processing (Xử lý) | Storage (Lưu trữ) | Output (Đầu ra) |
|---|---|---|---|---|
| **Đặt đơn hàng** | Người dùng gửi giỏ hàng và địa chỉ | Kiểm tra tồn kho, tính thuế phí | Ghi đơn hàng vào `Database` | Trả mã đơn hàng và gửi xác nhận |
| **Nhắn tin** | Thiết bị gửi bản tin văn bản | Xác thực phiên, định tuyến người nhận | Lưu lịch sử tin nhắn theo hội thoại | Đẩy tin nhắn tới thiết bị đích |
| **Nền tảng video** | Người dùng tải tệp video gốc | Kiểm tra định dạng, mã hóa đa độ phân giải | Lưu tệp lên `Object Storage`, siêu dữ liệu vào `DB` | Phát luồng video qua `CDN` |

Khi gặp một đề bài mới chưa từng làm, phân rã yêu cầu theo đúng bốn cột này giúp bạn xác định ngay hệ thống cần những khối chức năng nào mà không bỏ sót bước.

## 3. Tầng tiếp nhận và xử lý: Client, Load Balancer và Stateless API

```step
category: MECHANISM
short: Client và API
scene: s3-input-proc
callout:
  kind: watch-out
  title: Không bao giờ tin dữ liệu từ phía Client
  vi: "Trình duyệt và ứng dụng di động nằm ngoài tầm kiểm soát của hệ thống: người dùng có thể sửa tham số, rớt mạng giữa chừng hoặc gửi trùng request."
whatChanged:
  - "+ Làm rõ ranh giới kiểm tra hợp lệ tại Load Balancer và API Server"
telemetry:
  - label: "Đặc tính Client"
    value: "Không tin cậy · Mạng biến động"
    tone: warn
  - label: "Đặc tính API Server"
    value: "Stateless · Mở rộng ngang"
    tone: ok
```

Hai chặng đầu của chuỗi `Input → Processing` đảm nhiệm việc tiếp nhận lưu lượng từ môi trường công cộng và thực thi quy tắc nghiệp vụ:

1. **Client (Trình duyệt, Mobile App, đối tác gọi API):** khởi tạo request và hiển thị kết quả. Vì môi trường thiết bị và mạng di động không ổn định, mọi dữ liệu từ `Client` đều phải coi là **chưa đáng tin cậy**.
2. **Load Balancer:** điểm vào thống nhất phía trước cụm ứng dụng, phân phối đều request sang các máy khỏe mạnh và tự động ngắt máy lỗi qua cơ chế `Health Check`.
3. **API Server (Processing Layer):** xác thực danh tính, kiểm tra tính hợp lệ của đầu vào, thực thi quy tắc nghiệp vụ và điều phối lời gọi xuống tầng dữ liệu. `API Server` được thiết kế **không giữ trạng thái cục bộ (`Stateless`)** để có thể tăng giảm số lượng máy chủ linh hoạt theo tải.

## 4. Tầng lưu trữ bền vững và tầng tăng tốc đọc: Database, Object Storage và Cache

```step
category: MECHANISM
short: DB và Cache
scene: s4-storage-cache
callout:
  kind: compare
  title: Cache là lớp tăng tốc, không phải nguồn dữ liệu gốc
  vi: "Dữ liệu trong RAM Cache có thể mất khi khởi động lại hoặc hết hạn TTL. Mọi bản ghi quan trọng bắt buộc phải nằm bền vững trong Database hoặc Object Storage."
whatChanged:
  - "+ Đặt Redis Cache phía trước Database để hấp thụ phần lớn lượt đọc lặp lại"
telemetry:
  - label: "Đọc từ RAM Cache"
    value: "< 1 ms"
    tone: ok
  - label: "Truy vấn Database"
    value: "5 – 50 ms"
```

Trong pha `Storage`, cần tách bạch rõ **nơi giữ dữ liệu gốc (`Source of Truth`)** và **nơi lưu bản sao tạm để đọc nhanh**:

- **Database (`SQL` / `NoSQL`):** lưu trữ bền vững dữ liệu có cấu trúc, đảm bảo tính toàn vẹn qua giao dịch và không mất dữ liệu khi máy chủ sập nguồn. Vì phải chạm đĩa và duy trì khóa chỉ mục, `Database` thường là thành phần khó mở rộng ngang nhất.
- **Object Storage (như `S3`, `GCS`):** lưu tệp nhị phân lớn (ảnh, video, tài liệu xuất báo cáo). Nguyên tắc chuẩn là **chỉ lưu đường dẫn và siêu dữ liệu trong `Database`**, còn nội dung tệp đặt trên `Object Storage` để tối ưu chi phí và nối thẳng với `CDN`.
- **Cache (`Redis`, `Memcached`):** giữ tập dữ liệu đọc nhiều trong `RAM` với độ trễ dưới 1 mili-giây. Theo mẫu `Cache-Aside`, `API` kiểm tra `Cache` trước; nếu không có (`Cache Miss`) mới đọc `Database` rồi nạp ngược vào `Cache` kèm thời gian sống `TTL`.

## 5. Tầng xử lý bất đồng bộ: Message Queue và Background Worker

```step
category: TECHNIQUE
short: Queue và Worker
scene: s5-async
callout:
  kind: technique
  title: Tách việc người dùng không cần chờ ngay ra khỏi đường nóng
  vi: "Gửi email, cập nhật chỉ mục tìm kiếm hay đồng bộ thống kê nếu chạy đồng bộ sẽ cộng dồn độ trễ và làm lỗi phụ lan sang thao tác chính."
whatChanged:
  - "+ Bổ sung nhánh bất đồng bộ API Server → Message Queue → Background Worker"
  - "~ Đường phản hồi cho người dùng tách rời khỏi tiến trình xử lý nền"
telemetry:
  - label: "Đường đồng bộ"
    value: "Trả lời người dùng ngay"
    tone: ok
  - label: "Đường bất đồng bộ"
    value: "Queue đệm · Worker xử lý nền"
```

Không phải thao tác nào trong một tính năng cũng cần hoàn thành trước khi trả kết quả `Output` về màn hình người dùng. Nếu khi tạo đơn hàng hoặc cập nhật hồ sơ mà `API Server` tự gọi máy chủ gửi email và dựng lại chỉ mục tìm kiếm theo kiểu đồng bộ, người dùng phải chờ thêm vài giây và dễ gặp lỗi nếu dịch vụ email tạm ngưng.

Bổ sung cặp **Message Queue** và **Background Worker** giải quyết hai vấn đề cùng lúc:

1. **Giảm độ trễ cảm nhận:** `API Server` chỉ ghi dữ liệu cốt lõi vào `Database`, đẩy một thông điệp sự kiện nhỏ vào `Queue` (mất khoảng `1 – 2 ms`), rồi trả phản hồi thành công ngay cho `Client`.
2. **Cách ly lỗi và làm phẳng đỉnh tải:** khi lưu lượng tăng vọt, thông điệp xếp hàng an toàn trong `Queue`; cụm `Worker` kéo việc về xử lý theo đúng tốc độ bền vững và tự động thử lại nếu gặp lỗi tạm thời.

## 6. Lần theo một tính năng hoàn chỉnh: người dùng cập nhật hồ sơ (Update Profile)

```step
category: TECHNIQUE
short: Luồng cập nhật
scene: s6-profile-flow
activity: S0-06.A1
gate: optional
callout:
  kind: key-idea
  title: Xoá Cache sau khi ghi Database để giữ dữ liệu nhất quán
  vi: "Khi hồ sơ trong Database vừa đổi, bản cũ trong Redis trở thành dữ liệu lỗi thời (Stale). Xoá khoá user:123 buộc lượt đọc kế tiếp nạp lại bản mới."
whatChanged:
  - "+ Gắn thời gian từng chặng trên luồng POST /users/123 (tổng đồng bộ ≈ 137 ms)"
telemetry:
  - label: "Tổng thời gian đồng bộ"
    value: "137 ms"
    tone: ok
  - label: "Chặng lâu nhất"
    value: "Database (100 ms)"
    tone: warn
  - label: "Tác vụ nền (Worker)"
    value: "Không chặn người dùng"
```

Hãy ghép toàn bộ các thành phần vừa học để lần theo thao tác người dùng bấm **Lưu hồ sơ (`POST /users/123`)**:

| Thứ tự | Chặng thực thi | Kiểu giao tiếp | Thời gian minh hoạ |
|---|---|---|---|
| 1 | `Client` gửi `POST /users/123` tới `Load Balancer`, chuyển tiếp vào `API Server` | Đồng bộ | 10 ms |
| 2 | `API Server` kiểm tra quyền sở hữu tài khoản và định dạng email, tên hiển thị | Nội bộ | 20 ms |
| 3 | `API Server` thực thi `UPDATE` vào `Database` và xác nhận giao dịch thành công | Đồng bộ | 100 ms |
| 4 | `API Server` xoá khoá `user:123` trên `Redis Cache` (`Cache Invalidation`) | Đồng bộ | 5 ms |
| 5 | `API Server` đẩy sự kiện `user.updated` vào `Message Queue` | Bất đồng bộ | 2 ms |
| 6 | `API Server` trả `200 OK` về `Client` — người dùng thấy thông báo lưu xong | Đồng bộ | **Tổng: 137 ms** |
| 7 | `Background Worker` nhận sự kiện từ `Queue`, gửi email thông báo và cập nhật chỉ mục tìm kiếm | Xử lý nền | Chạy độc lập |

Nhờ tách bước 7 sang nhánh bất đồng bộ, người dùng nhận phản hồi trong `137 ms` thay vì phải chờ máy chủ email bên ngoài.

## 7. Dùng góc nhìn hệ thống để khoanh vùng điểm nghẽn khi tải tăng

```step
category: PROBLEM
short: Truy vết nghẽn
scene: s7-bottleneck
sim: S0-06/profile-flow
activity: S0-06.A2
gate: required
callout:
  kind: watch-out
  title: Đọc số đo trên toàn đồ thị thay vì đoán mò trong code
  vi: "Khi API chậm, nguyên nhân thường không nằm ở vòng lặp trong code ứng dụng mà ở thành phần lưu trữ phía dưới đã vượt ngưỡng năng lực xử lý."
whatChanged:
  - "~ Lưu lượng hỗn hợp (70% đọc, 30% ghi) tăng lên gần 2.000 req/s tại t = 40 s"
  - "~ Database chạm trạng thái quá tải trong khi API, Cache và Worker vẫn còn dư công suất"
telemetry:
  - label: "ρ của Database (t = 40 s)"
    value: "{db.rho@40:2}"
    tone: bad
  - label: "ρ của API Server (t = 40 s)"
    value: "{api.rho@40:2}"
    tone: warn
  - label: "Độ trễ p99 toàn cục"
    value: "{global.p99@40:0} ms"
    tone: bad
```

Xét kịch bản vận hành thực tế `S0-06/profile-flow`: hệ thống phục vụ hỗn hợp **70% lượt đọc hồ sơ** và **30% lượt cập nhật hồ sơ**, lưu lượng tăng dần từ `300` lên `2.200 req/s`. `Redis Cache` giữ được `75%` lượt đọc, nhưng `25%` lượt đọc `Cache Miss` cộng với toàn bộ `30%` lượt ghi (`0,7 × 0,25 + 0,3 = 47,5%` tổng lưu lượng) vẫn đổ thẳng vào `Database` có năng lực `μ = 800 req/s`.

Khi lưu lượng tổng đi qua mốc `1.684 req/s`, lượng truy vấn vào `Database` vượt `800 req/s` (`ρ > 1,00`). Tại giây thứ `40` (`≈ 1.989 req/s`), hàng đợi trước `Database` dồn hơn 500 truy vấn trong khi `API Server`, `Redis Cache` và `Background Worker` vẫn dưới ngưỡng bão hoà. Nhìn từ sơ đồ hệ thống và bảng số đo `ρ`, ta chỉ ra ngay nguyên nhân gốc nằm ở tầng `Database` thay vì mất hàng giờ đọc lại mã kiểm tra chuỗi ở `API Server`.

## 8. Tóm tắt: ba câu hỏi hệ thống cần đặt trước khi viết mã

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Chuyển dịch từ người viết hàm sang người thiết kế hệ thống
  vi: "Mã nguồn là chi tiết triển khai bên trong từng hộp; luồng dữ liệu, ranh giới đồng bộ/bất đồng bộ và điểm nghẽn giữa các hộp mới quyết định độ tin cậy ở quy mô lớn."
whatChanged:
  - "+ Tổng hợp bức tranh 2 miền: Đường nóng đồng bộ và Nhánh xử lý nền bất đồng bộ"
telemetry:
  - label: "Khuôn mẫu chung"
    value: "Input → Process → Store → Out"
  - label: "Trần bền vững của bài"
    value: "≈ 1.684 req/s"
    tone: ok
```

Để rèn luyện phản xạ **System Thinking** trong công việc hằng ngày và khi thiết kế kiến trúc:

1. **Vẽ luồng `Input → Processing → Storage → Output` trước:** xác định rõ dữ liệu đi qua những thành phần nào và thành phần nào giữ bản ghi gốc (`Source of Truth`).
2. **Tách đường nóng đồng bộ khỏi tác vụ nền:** chỉ giữ những bước bắt buộc để xác nhận kết quả cho người dùng trên đường đồng bộ; đẩy các tác vụ phụ hoặc tốn thời gian sang `Message Queue` và `Worker`.
3. **Đặt câu hỏi sự cố và điểm nghẽn cho từng mắt xích:** nếu thành phần này chậm gấp 10 lần hoặc ngừng phản hồi, bước nào bị chặn theo và chỉ số `ρ` nào sẽ báo hiệu đầu tiên?
