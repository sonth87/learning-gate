## 1. Ràng buộc (Constraints) là tham số định hình bản thiết kế

```step
category: SETUP
short: Điểm xuất phát
scene: s1-framework
callout:
  kind: key-idea
  title: Thiết kế hệ thống = Ràng buộc + Đánh đổi
  vi: "Ràng buộc xác định tập hợp các phương án khả thi; đánh đổi giúp chọn ra phương án phù hợp nhất bên trong tập khả thi đó."
whatChanged:
  - "+ Đặt 3 nhóm giới hạn (kỹ thuật, nguồn lực, con người) làm đầu vào thiết kế"
  - "~ Loại bỏ ngay từ đầu các bản vẽ vượt ngân sách hoặc quá sức bảo trì"
telemetry:
  - label: "Ví dụ ngân sách trần"
    value: "2.000 USD/tháng"
    tone: warn
  - label: "Bản vẽ tách rời thực tế"
    value: "15.000 USD/tháng"
    tone: bad
```

Một bản vẽ kiến trúc gồm hàng chục dịch vụ, cụm lưu trữ phân tán và tự động mở rộng đa vùng sẽ không có giá trị triển khai nếu chi phí vận hành lên tới `15.000 USD/tháng` trong khi ngân sách toàn dự án chỉ có `2.000 USD/tháng` và đội ngũ chỉ gồm 2 lập trình viên.

Trong kỹ thuật hệ thống, **ràng buộc (Constraints)** không phải là vật cản ngoài ý muốn mà chính là **tham số đầu vào của bài toán thiết kế**. Một hệ thống thực tế luôn bị đóng khung bởi ba nhóm giới hạn:

1. **Giới hạn kỹ thuật:** Năng lực CPU, dung lượng RAM, tốc độ ánh sáng trong cáp quang, thông lượng đĩa và số kết nối Database.
2. **Giới hạn nguồn lực:** Ngân sách hạ tầng hằng tháng và thời hạn ra mắt sản phẩm.
3. **Giới hạn con người:** Số lượng kỹ sư, công nghệ nhóm đã nắm vững và khả năng trực vận hành.

Nắm rõ ràng buộc ngay từ bước đầu giúp tránh cả hai thái cực: thiết kế quá mức gây lãng phí và thiết kế thiếu hụt gây nghẽn sớm.

## 2. Giới hạn 1 — Compute (CPU): ước lượng số lõi và số máy chủ

```step
category: MECHANISM
short: Giới hạn CPU
scene: s2-compute
callout:
  kind: good-to-know
  title: Nhớ bậc độ lớn của một lõi CPU
  vi: "Một lõi CPU ứng dụng web thông thường xử lý cỡ 1.000 req/s đơn giản; nắm bậc độ lớn này giúp tính nhanh số máy cần thiết hoặc nhận ra khi nào phải tối ưu thuật toán."
whatChanged:
  - "+ Phân bổ ngân sách Compute cho yêu cầu 10.000 req/s và bài toán xử lý ảnh lô lớn"
  - "~ So sánh mở rộng phần cứng với tối ưu thuật toán song song"
telemetry:
  - label: "1 lõi Web thông thường"
    value: "≈ 1.000 req/s"
  - label: "Đích 1 triệu ảnh / 30 phút"
    value: "≈ 556 ảnh/giây"
    tone: warn
```

Năng lực tính toán của CPU là hữu hạn. Ở mức bậc độ lớn tham khảo, một lõi CPU hiện đại xử lý được khoảng `1.000 req/s` nghiệp vụ web thông thường, khoảng `50.000` lượt tuần tự hoá JSON hoặc khoảng `1.000.000` phép băm mỗi giây.

Hãy xem cách giới hạn CPU dẫn dắt quyết định thiết kế trong bài toán thu nhỏ **1.000.000 bức ảnh** với thời hạn cứng **30 phút** (`1.800 giây`):

- Tốc độ xử lý tối thiểu cần đạt: `1.000.000 / 1.800 ≈ 556 ảnh/giây`.
- Nếu mỗi máy chủ hiện xử lý được `100 ảnh/giây`, chạy 1 máy mất `10.000 giây` (gần 2,8 giờ) — vi phạm ràng buộc thời gian.
- **Hướng 1 (Thêm máy):** Thuê 6 máy chạy song song đạt `600 ảnh/giây`, đáp ứng ngay thời hạn 30 phút.
- **Hướng 2 (Tối ưu mã):** Song song hoá trên đa nhân nâng năng lực mỗi máy lên `400 ảnh/giây`, chỉ cần thuê 2 máy nhưng tốn thêm thời gian lập trình.

Ngân sách tiền bạc và thời hạn bàn giao sẽ quyết định chọn Hướng 1 hay Hướng 2.

## 3. Giới hạn 2 — Memory (RAM): phân bổ dung lượng bộ nhớ vật lý

```step
category: MECHANISM
short: Giới hạn RAM
scene: s3-memory
activity: S0-04.A1
gate: optional
callout:
  kind: technique
  title: Chỉ đệm phần dữ liệu nóng khi ngân sách hẹp
  vi: "Thay vì nạp toàn bộ người dùng đăng ký vào RAM tốn hàng terabyte, chỉ đệm nhóm người dùng hoạt động trong ngày giúp giảm chi phí 10 lần mà vẫn giữ tỉ lệ trúng cao."
whatChanged:
  - "+ Chia thanh ngân sách RAM trên một máy chủ 16 GB (HĐH, App, Kết nối DB, Cache)"
  - "+ Đối chiếu chi phí đệm toàn bộ với đệm theo người dùng hoạt động"
telemetry:
  - label: "100 kết nối DB"
    value: "≈ 1 GB RAM"
  - label: "Quỹ Cache trên máy 16 GB"
    value: "≈ 10–11 GB"
    tone: ok
```

Bộ nhớ RAM nhanh nhưng đắt và bị giới hạn cứng trên từng máy chủ. Khi lập ngân sách RAM cho một máy `16 GB`, ta không được lấy trọn `16 GB` cho dữ liệu ứng dụng mà phải trừ lùi từng khoản: hệ điều hành chiếm khoảng `2 GB`, tiến trình ứng dụng khoảng `2 GB`, 100 kết nối Database (mỗi kết nối khoảng `10 MB`) chiếm `1 GB`, phần còn lại khoảng `10–11 GB` mới dành cho Cache hoặc phiên người dùng.

Xét ứng dụng mạng xã hội có `10 triệu` tài khoản đăng ký nhưng chỉ `1 triệu` người dùng hoạt động mỗi ngày, mỗi bảng tin cần đệm 100 bài viết × `1 KB` = `100 KB`:

- **Đệm toàn bộ 10 triệu người:** Cần `1 TB RAM`, chi phí cụm Redis rất lớn trong khi 90% vùng nhớ nằm không.
- **Chỉ đệm người dùng hoạt động hoặc dùng cơ chế LRU giới hạn dung lượng:** Giảm nhu cầu RAM xuống 10–100 lần, vừa khớp trần ngân sách mà vẫn phục vụ phần lớn lưu lượng thực tế.

## 4. Giới hạn 3 — Network: giới hạn vật lý của độ trễ và băng thông

```step
category: MECHANISM
short: Giới hạn mạng
scene: s4-network
callout:
  kind: watch-out
  title: Không thể vượt tốc độ ánh sáng trong cáp quang
  vi: "Tín hiệu quang đi trong sợi thuỷ tinh đạt khoảng 200.000 km/s. Đặt App Server ở Mỹ còn Database ở châu Âu khiến mỗi truy vấn mất tối thiểu hàng trăm mili-giây khứ hồi."
whatChanged:
  - "+ Khấu trừ ngân sách độ trễ 200 ms qua DNS, TCP, TLS và truyền gói tin"
  - "~ Giữ App Server và Database cùng vùng địa lý hoặc bổ sung CDN / Read Replica"
telemetry:
  - label: "Chi phí mạng ban đầu"
    value: "≈ 100 ms"
    tone: warn
  - label: "Quỹ còn lại cho Server"
    value: "≤ 100 ms"
    tone: ok
```

Khác với CPU hay RAM có thể nâng cấp bằng tiền, độ trễ đường truyền xa bị chặn dưới bởi vật lý: ánh sáng truyền trong cáp quang đạt khoảng `200.000 km/s`, cộng thêm trễ định tuyến qua các trạm mạng khiến một vòng khứ hồi xuyên lục địa mất `100–200 ms`.

Nếu mục tiêu trải nghiệm tải trang là `200 ms`, riêng phần thiết lập mạng lần đầu (phân giải DNS `20 ms`, bắt tay TCP `20 ms`, thoả thuận TLS `40 ms`, truyền gói tin `20 ms`) đã tiêu tốn `100 ms`. Máy chủ phía sau chỉ còn quỹ **tối đa `100 ms`** để hoàn tất toàn bộ xử lý.

Hệ quả trực tiếp lên thiết kế:
- Với tệp tĩnh (ảnh, JS, CSS nặng vài MB) phục vụ người dùng toàn cầu, bắt buộc đặt **CDN** ở biên gần người dùng để hạ độ trễ mạng từ `200 ms` xuống `20 ms`.
- Không bao giờ để một trang thực hiện nối tiếp 10 truy vấn xuyên châu lục (`10 × 210 ms = 2,1 giây`); phải đặt App và Database cùng vùng, hoặc dùng bản sao đọc (**Read Replica**) tại vùng người dùng.

## 5. Giới hạn 4 — Database: thông lượng ghi, dung lượng và trần kết nối

```step
category: MECHANISM
short: Giới hạn DB
scene: s5-database
callout:
  kind: technique
  title: Gom lô (Batching) khi gặp trần ghi
  vi: "Khi một máy PostgreSQL đơn lẻ chạm trần 10.000 lượt ghi rời rạc mỗi giây, gom 100 bản ghi vào một lệnh chèn lô nâng thông lượng hiệu dụng lên gấp nhiều lần mà không cần đổi công nghệ."
whatChanged:
  - "+ Tổng hợp giới hạn đọc, ghi, dung lượng đĩa và số kết nối hoạt động của Database"
  - "+ Chọn giải pháp gom lô ghi phù hợp với kỹ năng sẵn có của đội ngũ"
telemetry:
  - label: "Kết nối hoạt động thực tế"
    value: "≈ 200–500 kết nối"
    tone: warn
  - label: "Gom lô 100 bản ghi"
    value: "Đạt ~100.000 writes/s"
    tone: ok
```

Mỗi hệ quản trị cơ sở dữ liệu đều có trần thông lượng đọc/ghi và trần kết nối đồng thời. Với một máy chủ PostgreSQL tiêu chuẩn, số kết nối cấu hình tối đa thường quanh mức `500` (hiệu quả nhất ở khoảng `200` kết nối hoạt động nhờ bộ gom kết nối *Connection Pool*), dung lượng thuận lợi cho một nút dưới khoảng `10 TB`, và tốc độ ghi đơn lẻ khoảng `10.000–50.000 writes/s` tuỳ ổ SSD.

Xét hệ thống ghi nhật ký sự kiện cần nhận `50.000 lượt ghi/giây`, trong khi nhóm kỹ sư chỉ thành thạo PostgreSQL và chấp nhận nhật ký hiển thị trễ 1–2 giây:

- Chuyển ngay sang hệ cơ sở dữ liệu phân tán mới đòi hỏi học lại mô hình truy vấn và vận hành phức tạp.
- Giữ PostgreSQL nhưng **đệm và gom lô (Batch Writes)** mỗi 100 bản ghi thành một giao dịch chèn giúp thông lượng vượt mức `50.000 writes/s`, vừa thoả mãn ràng buộc kỹ thuật vừa khớp ràng buộc con người.

## 6. Giới hạn 5 — Nhân sự: quy mô đội ngũ và gánh nặng vận hành

```step
category: PROBLEM
short: Giới hạn nhóm
scene: s6-human
callout:
  kind: watch-out
  title: Ràng buộc hay bị quên nhất
  vi: "Mỗi dịch vụ tách riêng đều đòi hỏi quy trình triển khai, giám sát, cảnh báo và trực sự cố riêng. Nhóm 3 kỹ sư không thể duy trì tốt 8 Microservices trên Kubernetes."
whatChanged:
  - "+ Đối chiếu năng lực bảo trì theo 3 bậc quy mô nhóm: 1–3, 5–10 và 20+ kỹ sư"
  - "~ Ưu tiên dịch vụ quản lý sẵn (Managed Services) khi đội ngũ mỏng"
telemetry:
  - label: "Nhóm 1–3 kỹ sư"
    value: "Monolith + Managed DB"
    tone: ok
  - label: "8 dịch vụ cho 3 người"
    value: "2 người kẹt ở vận hành"
    tone: bad
```

Giới hạn dễ bị bỏ sót nhất trên bàn giấy là **năng lực vận hành của đội ngũ (Human Constraints)**: số lượng kỹ sư, công nghệ đã quen thuộc và khả năng trực xử lý sự cố 24/7.

Quy tắc thực tế theo quy mô đội ngũ:

| Quy mô nhóm | Kiến trúc phù hợp | Lựa chọn nên tránh |
|---|---|---|
| **1–3 kỹ sư** | Monolith gọn, ngôn ngữ nhóm đã rành, nền tảng PaaS / Managed Database | Tách Microservices, tự dựng cụm Kubernetes |
| **5–10 kỹ sư** | Modular Monolith, tách tối đa 2–3 dịch vụ ở chỗ thật sự nghẽn | Tách hàng chục dịch vụ nhỏ cùng nhiều loại DB lạ |
| **20+ kỹ sư** | Microservices theo miền nghiệp vụ, có nhóm hạ tầng (Platform/Ops) riêng | Dồn toàn bộ nhóm vào sửa chung một khối mã thiếu ranh giới |

Với nhóm khởi nghiệp 3 người, chọn Monolith giúp hoàn thành sản phẩm trong 6 tuần và chỉ tốn khoảng nửa nhân sự cho vận hành; chọn 8 Microservices làm mất 6 tháng dựng hạ tầng và hút cạn 2 trên 3 kỹ sư vào việc duy trì hệ thống.

## 7. Quy trình thiết kế theo ràng buộc và bài tập cân đối ngân sách

```step
category: TECHNIQUE
short: Ngân sách thực
scene: s7-mistakes
activity: S0-04.A2
gate: required
callout:
  kind: technique
  title: Phân tách giới hạn cứng và giới hạn mềm
  vi: "Trần ngân sách tiền mặt và tốc độ ánh sáng là giới hạn cứng không thể thương lượng; độ tươi dữ liệu vài giây thường là giới hạn mềm có thể đánh đổi."
whatChanged:
  - "+ Áp dụng quy trình 5 bước kiểm tra ràng buộc và nhận diện 3 sai lầm phổ biến"
  - "+ Giải bài toán cấu hình đạt tải 3.600 req/s dưới trần 1,15 USD/giờ"
telemetry:
  - label: "Tải yêu cầu"
    value: "3.600 req/s (90% đọc)"
  - label: "Giới hạn cứng chi phí"
    value: "≤ 1,15 USD/giờ"
    tone: warn
  - label: "Số thay đổi tối đa"
    value: "≤ 2 thay đổi"
    tone: ok
```

Quy trình thiết kế bám sát ràng buộc gồm năm bước: (1) Liệt kê đủ 5 nhóm giới hạn; (2) Phân loại **giới hạn cứng** (không được vượt) và **giới hạn mềm** (có thể thương lượng); (3) Thiết kế đơn giản nhất bên trong khung giới hạn; (4) Kiểm tra chéo chi phí, độ trễ và khả năng bảo trì; (5) Ghi lại lý do quyết định.

Quy trình này ngăn chặn ba sai lầm phổ biến: thiết kế cho quy mô 10 triệu người dùng tưởng tượng khi hiện tại mới có 100 người; chọn ngôn ngữ mới mất 3 tháng học chỉ để chạy 1.000 req/s mà ngôn ngữ hiện tại dư sức đáp ứng; và cộng dồn các dịch vụ đắt đỏ vượt ngân sách cứng.

Trong bài tập bên dưới, nhóm nhỏ vận hành hệ thống nhận **3.600 req/s** (90% đọc trên 50.000 mục dữ liệu) với giới hạn cứng **chi phí `≤ 1,15 USD/giờ`**. Mỗi máy `App Server` chịu được `1.500 req/s` (`0,12 USD/giờ`), `PostgreSQL` chịu được `950 req/s` (`0,55 USD/giờ`, nâng cấp máy sẽ vượt ngân sách). Hãy dùng đúng ngân sách Compute và Cache để đạt `p99 ≤ 100 ms`.

## 8. Tóm tắt: làm việc cùng ràng buộc thay vì chống lại chúng

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Chuỗi tư duy hoàn chỉnh
  vi: "Bài toán (Problem) → Ràng buộc (Constraints) → Đánh đổi (Trade-offs) → Giải pháp vừa vặn (Right-sized Solution)."
whatChanged:
  - "+ Kết nối trọn vẹn 3 bài đầu thành chuỗi tư duy của kiến trúc sư hệ thống"
telemetry:
  - label: "5 nhóm ràng buộc"
    value: "CPU · RAM · Mạng · DB · Người"
  - label: "Tiêu chí nghiệm thu"
    value: "Chạy đạt SLO trong ngân sách"
    tone: ok
```

Ghi nhớ năm nhóm giới hạn định hình mọi bản thiết kế thực tế:

1. **Compute (CPU):** Đếm bậc độ lớn số request mỗi lõi để quyết định số máy hoặc tối ưu thuật toán.
2. **Memory (RAM):** Khấu trừ phần hệ điều hành, ứng dụng và kết nối trước khi tính dung lượng Cache; ưu tiên đệm tập dữ liệu nóng.
3. **Network:** Tôn trọng giới hạn vật lý của khoảng cách địa lý; dùng CDN và đặt dịch vụ gần dữ liệu.
4. **Database:** Theo dõi sát thông lượng đọc/ghi và trần kết nối; tận dụng chỉ mục, gom lô và Cache trước khi nâng cấp phần cứng đắt đỏ.
5. **Nhân sự và Ngân sách:** Độ phức tạp của kiến trúc không bao giờ được vượt quá số người bảo trì và trần chi phí cho phép.
