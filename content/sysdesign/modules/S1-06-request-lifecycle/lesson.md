## 1. Bóc tách vòng đời một request thành các chặng đo được

```step
category: SETUP
short: Tổng quan chặng
scene: s1-overview
callout:
  kind: key-idea
  title: Cộng dồn theo chặng nối tiếp
  vi: "Người dùng chỉ cảm nhận một con số tổng khi trang tải xong, nhưng kỹ sư phải tách con số đó thành từng đoạn trên trục thời gian để biết thời gian nằm ở mạng hay ở máy chủ."
whatChanged:
  - "+ Thiết bị gọi tuần tự: phân giải DNS rồi kết nối Web Server và Database"
  - "~ Tổng thời gian trung bình khoảng 129 ms khi mọi chặng đều khoẻ mạnh"
telemetry:
  - label: "Tổng trung bình"
    value: "≈ 129 ms"
  - label: "Chặng DNS"
    value: "≈ 20 ms"
    tone: ok
  - label: "Kết nối + Web + DB"
    value: "≈ 109 ms"
    tone: ok
```

Khi người dùng chạm vào một liên kết và thấy trang phản hồi chậm, câu báo cáo thường chỉ vỏn vẹn là ứng dụng bị trễ. Để tìm đúng nguyên nhân, ta cần theo dõi **vòng đời của một request (Request Lifecycle)** từ lúc rời thiết bị đến lúc nhận đủ dữ liệu trả về.

Một lượt truy cập lần đầu đi qua các chặng nối tiếp:
1. **Phân giải DNS:** đổi tên miền sang địa chỉ IP của máy chủ.
2. **Thiết lập kết nối:** bắt tay TCP và thoả thuận mã hoá TLS qua mạng Internet.
3. **Gửi request và xử lý tại Web Server:** truyền gói tin HTTP và chạy mã nghiệp vụ.
4. **Truy vấn Database và tải phản hồi:** lấy dữ liệu lưu trữ rồi gửi kết quả ngược về thiết bị.

Vì các chặng diễn ra nối tiếp nhau, tổng độ trễ bằng tổng thời gian của từng đoạn cộng lại.

## 2. Chặng 1 — Phân giải DNS và thời gian sống TTL của bản ghi

```step
category: MECHANISM
short: Phân giải DNS
scene: s2-dns
callout:
  kind: good-to-know
  title: DNS chỉ tốn phí ở lần truy cập nguội
  vi: "Sau lần tra cứu đầu tiên, trình duyệt và hệ điều hành giữ địa chỉ IP trong bộ nhớ đệm theo thời gian TTL, giúp các request kế tiếp bỏ qua hoàn toàn chặng mạng này."
whatChanged:
  - "+ Nổi bật chặng Thiết bị → DNS Resolver (mạng ~18 ms + xử lý ~2 ms)"
telemetry:
  - label: "Tra cứu DNS nguội"
    value: "≈ 20 ms"
  - label: "Khi trúng bộ đệm DNS"
    value: "≈ 0 ms"
    tone: ok
  - label: "TTL mặc định"
    value: "60 giây"
```

Thiết bị không thể gửi gói tin IP chỉ bằng tên miền như `shop.example.com`. Trước tiên, hệ điều hành kiểm tra bộ nhớ đệm cục bộ; nếu chưa có, nó hỏi **DNS Resolver** để tìm địa chỉ IP tương ứng.

Một lượt tra cứu DNS chưa có trong bộ đệm thường mất khoảng **15–30 ms** tuỳ khoảng cách tới máy chủ phân giải. Kết quả trả về luôn đi kèm thông số **TTL (Time To Live)**:
- **TTL dài** (ví dụ vài giờ) giúp hầu hết lượt gọi sau đó tốn 0 ms cho DNS, giảm tải cho máy chủ tên miền.
- **TTL ngắn** (ví dụ 30–60 giây) giúp chuyển hướng lưu lượng sang địa chỉ IP máy chủ dự phòng nhanh hơn khi đổi hạ tầng, đổi lại số lượt phải hỏi lại DNS tăng lên.

## 3. Chặng 2 — Bắt tay kết nối TCP và TLS phụ thuộc số vòng RTT

```step
category: MECHANISM
short: Bắt tay TCP/TLS
scene: s3-connect
callout:
  kind: key-idea
  title: Số vòng khứ hồi quan trọng hơn băng thông
  vi: "Gói tin bắt tay chỉ dài vài trăm byte nên băng thông mạng gigabit không làm nó nhanh hơn; thời gian mở kết nối bị quyết định trực tiếp bởi độ trễ khứ hồi RTT nhân với số vòng trao đổi."
whatChanged:
  - "+ Mở kết nối HTTPS mới tới Web Server tốn nhiều vòng khứ hồi RTT"
telemetry:
  - label: "RTT mạng mẫu"
    value: "25 ms"
  - label: "TCP + TLS 1.3 (2 RTT)"
    value: "50 ms"
  - label: "Vòng HTTP (1 RTT)"
    value: "25 ms"
```

Sau khi biết địa chỉ IP, thiết bị phải thiết lập kênh truyền tin cậy và mã hoá trước khi gửi dữ liệu ứng dụng. Đơn vị đo chi phí mạng ở đây là **RTT (Round-Trip Time)** — thời gian một gói tin đi từ thiết bị tới máy chủ rồi quay về.

Với kết nối HTTPS tiêu chuẩn hiện nay:
- **Bắt tay TCP** cần **1 RTT** để hai đầu đồng bộ số thứ tự gói tin (`SYN` và `SYN-ACK`).
- **Bắt tay TLS 1.3** cần thêm **1 RTT** để thoả thuận khoá mã hoá (các bản TLS 1.2 cũ cần tới 2 RTT).
- **Truyền HTTP request và nhận byte phản hồi đầu tiên** tốn thêm **1 RTT** trên đường truyền.

Nếu RTT của người dùng là 25 ms, riêng ba vòng mạng trên đường kết nối mới đã chiếm `2 × 25 + 25 = 75 ms` (trong mô hình gộp trên link `client-web`), dù máy chủ chưa tốn một mili-giây xử lý nghiệp vụ nào.

## 4. Chặng 3 & 4 — Xử lý tại Web Server, truy vấn Database và hoàn tất

```step
category: MECHANISM
short: Web & Database
scene: s4-backend
callout:
  kind: compare
  title: Mạng nội bộ nhanh hơn mạng ngoài hàng chục lần
  vi: "Web Server và Database đặt cùng vùng khả dụng (Same-AZ) chỉ mất khoảng 0,5–1 ms truyền mạng, nhỏ hơn rất nhiều so với chặng Internet từ người dùng vào."
whatChanged:
  - "+ Thêm chặng nội bộ Web Server → Database (mạng ~1 ms + truy vấn ~15 ms)"
  - "~ Hoàn chỉnh biểu đồ thời gian ~129 ms của một request khoẻ mạnh"
telemetry:
  - label: "Xử lý Web Server"
    value: "≈ 18 ms"
  - label: "Truy vấn Database"
    value: "≈ 15 ms"
  - label: "Tổng toàn trình"
    value: "≈ 129 ms"
    tone: ok
```

Khi gói tin HTTP đến nơi, request đi vào mạng nội bộ trung tâm dữ liệu với độ trễ truyền dẫn giữa các máy chủ cùng vùng chỉ khoảng **1 ms**:

| Chặng trong vòng đời | Thời gian mẫu | Tỉ trọng |
|---|---|---|
| Phân giải DNS (lần đầu) | 20 ms | ~15,5% |
| Bắt tay TCP/TLS + vòng mạng HTTP (3 × 25 ms) | 75 ms | ~58,1% |
| Web Server kiểm tra xác thực và ghép dữ liệu | 18 ms | ~14,0% |
| Mạng nội bộ + Database truy vấn có chỉ mục | 16 ms | ~12,4% |
| **Tổng cộng** | **129 ms** | **100%** |

Đáng chú ý: khi mã ứng dụng gọn và câu truy vấn Database đã đánh chỉ mục tốt (15 ms), **hơn 70% thời gian của lần tải đầu tiên nằm ở DNS và các vòng khứ hồi mạng**, không phải ở CPU của máy chủ.

## 5. Tái sử dụng kết nối, HTTP/2 và độ trễ đọc bản ghi cũ

```step
category: TECHNIQUE
short: Gộp kết nối
scene: s5-http2
activity: S1-06.A2
gate: optional
callout:
  kind: technique
  title: Mở kết nối một lần, dùng cho nhiều request
  vi: "Keep-Alive và HTTP/2 ghép kênh nhiều tài nguyên (HTML, CSS, JSON, ảnh) chung trên một kết nối TLS đã mở, xoá bỏ chi phí 2 RTT bắt tay lặp lại cho từng file."
whatChanged:
  - "~ Các request tiếp theo dùng lại kết nối ấm và bản ghi DNS đã lưu đệm"
  - "~ Đánh đổi bộ đệm: đổi IP máy chủ thì client vẫn đọc bản ghi cũ tới hết TTL"
telemetry:
  - label: "Tiết kiệm DNS ấm"
    value: "−20 ms"
    tone: ok
  - label: "Tiết kiệm bắt tay TLS"
    value: "−50 ms"
    tone: ok
  - label: "Request trên kết nối ấm"
    value: "≈ 59 ms"
    tone: ok
```

Một màn hình ứng dụng thực tế không chỉ gửi một request duy nhất mà thường tải kèm hàng chục lời gọi API và tệp tài nguyên phụ. Nếu mỗi request đều tra DNS và bắt tay TCP/TLS lại từ đầu, thời gian chờ sẽ nhân lên gấp nhiều lần.

Hai cơ chế nền tảng giúp cắt bỏ phần lặp lại này:
- **Tái sử dụng kết nối (HTTP Keep-Alive & Connection Reuse):** giữ kênh TCP/TLS mở sau request đầu tiên. Các lời gọi tiếp theo trên kết nối ấm chỉ tốn đúng 1 RTT truyền dữ liệu cộng thời gian xử lý máy chủ (giảm từ ~129 ms xuống ~59 ms).
- **Ghép kênh HTTP/2 và HTTP/3:** gửi song song nhiều luồng request/response trên cùng một kết nối duy nhất mà không phải mở nhiều kết nối cạnh tranh nhau.

Tuy nhiên, việc lưu đệm DNS hay kết nối cũng kéo theo cửa sổ dữ liệu cũ: khi quản trị viên đổi IP máy chủ trên DNS chính, những trình phân giải còn giữ bản ghi chưa hết hạn TTL vẫn trả về địa chỉ IP cũ.

## 6. Tình huống 1 — Truy vấn Database chậm kéo dài toàn bộ Waterfall

```step
category: PROBLEM
short: Truy vấn chậm
scene: s6-live
live: trace
callout:
  kind: watch-out
  title: Một span chậm lấn át mọi tối ưu mạng
  vi: "Từ giây 25, một truy vấn thiếu chỉ mục làm thời gian Database tăng từ 15 ms lên 400 ms; tổng độ trễ nhảy vọt lên hơn 510 ms và chặng Database chiếm gần 80% toàn bộ Waterfall."
whatChanged:
  - "~ Giây 0–24: Database 15 ms, tổng trung bình ~129 ms"
  - "~ Giây 25 trở đi: Database chậm +385 ms (lên 400 ms), tổng nhảy lên ~514 ms"
telemetry:
  - label: "Tổng trước giây 25"
    value: "≈ 129 ms"
    tone: ok
  - label: "Tổng sau giây 25"
    value: "≈ 514 ms"
    tone: bad
  - label: "Tỉ trọng Database"
    value: "≈ 78%"
    tone: bad
```

Hãy bấm vào một hạt gói tin trên sân khấu mô phỏng kèm công cụ **Tracer** để đối chiếu biểu đồ thác nước (Waterfall) trước và sau giây thứ 25:

- **Trước giây 25:** lưu lượng chỉ 10 req/s (không có hàng đợi), thanh thời gian của Database ngắn gọn khoảng 15 ms, tổng thời gian một request xoay quanh 129 ms.
- **Từ giây 25:** một tính năng gợi ý sản phẩm chạy câu truy vấn chưa có chỉ mục làm thời gian xử lý tại Database tăng thêm 385 ms (lên **400 ms**). Dù mạng và Web Server không hề thay đổi, tổng thời gian trung bình vọt lên **514 ms** và p99 vượt **870 ms**.

Khi nhìn vào Waterfall lúc này, thanh span của Database chiếm gần bốn phần năm chiều ngang. Mọi nỗ lực nén JSON hay tinh chỉnh HTTP ở phía ngoài đều không giải quyết được độ trễ này nếu chưa tối ưu câu truy vấn.

## 7. Tình huống 2 — Người dùng ở xa địa lý làm RTT nhân bội

```step
category: PITFALL
short: Khoảng cách xa
scene: s7-rtt
activity: S1-06.A1
gate: required
callout:
  kind: watch-out
  title: Tốc độ ánh sáng đặt ngưỡng sàn vật lý
  vi: "Khi người dùng cách máy chủ nửa vòng Trái Đất với RTT 150–200 ms, ba vòng mạng của kết nối mới đã mất 450–600 ms dù Database trả lời chỉ trong 15 ms."
whatChanged:
  - "~ Tăng độ trễ khứ hồi mạng ngoài từ 25 ms lên 150 ms mỗi RTT"
  - "~ Riêng bắt tay kết nối và vòng HTTP chiếm 450 ms trên tổng ~490 ms"
telemetry:
  - label: "RTT xuyên lục địa"
    value: "150 ms"
    tone: warn
  - label: "Chi phí 3 RTT mạng"
    value: "450 ms"
    tone: bad
  - label: "Xử lý Web + DB"
    value: "≈ 40 ms"
    tone: ok
```

Ngược với tình huống truy vấn chậm, có những trường hợp log nội bộ tại máy chủ báo mọi API đều hoàn tất trong 35–40 ms, nhưng người dùng ở châu lục khác vẫn phản ánh trang tải mất nửa giây.

Nguyên nhân nằm ở giới hạn vật lý của truyền dẫn cáp quang xuyên lục địa. Khi **RTT tăng từ 25 ms lên 150 ms**, mọi bước yêu cầu trao đổi qua lại trên mạng đều bị nhân bội:
- Bắt tay TCP (1 RTT): **150 ms**
- Bắt tay TLS 1.3 (1 RTT): **150 ms**
- Gửi request và nhận phản hồi HTTP (1 RTT): **150 ms**

Chỉ riêng 3 vòng mạng đã tiêu tốn **450 ms**, lớn gấp hơn mười lần phần xử lý tại Web Server và Database cộng lại. Với bài toán này, tối ưu truy vấn SQL không hạ được ngưỡng sàn 450 ms; giải pháp đúng là đặt **CDN / Edge Node** chấm dứt kết nối TLS gần người dùng hoặc triển khai máy chủ đa vùng.

## 8. Tóm tắt: đọc biểu đồ thác nước để chọn đúng hướng tối ưu

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Chẩn đoán theo chặng chiếm tỉ trọng lớn nhất
  vi: "Chậm ở DNS thì chỉnh TTL và prefetch; chậm ở bắt tay kết nối thì bật Keep-Alive, HTTP/2 và CDN Edge; chậm ở máy chủ hoặc Database thì kiểm tra code, Cache và chỉ mục."
whatChanged:
  - "+ Đối chiếu từng chặng trong vòng đời request với biện pháp kỹ thuật tương ứng"
telemetry:
  - label: "Kết nối mới (RTT 25 ms)"
    value: "≈ 129 ms"
  - label: "Kết nối ấm tái sử dụng"
    value: "≈ 59 ms"
    tone: ok
```

Mỗi đoạn dài bất thường trên biểu đồ Waterfall chỉ thẳng tới một nhóm giải pháp riêng biệt:

1. **Chặng DNS dài:** kiểm tra cấu hình trình phân giải, đặt TTL hợp lý và dùng gợi ý phân giải sớm (`dns-prefetch`) cho tên miền tài nguyên phụ.
2. **Chặng bắt tay TCP/TLS dài:** bật tái sử dụng kết nối Keep-Alive, HTTP/2 hoặc HTTP/3 (QUIC 1-RTT/0-RTT), và chấm dứt TLS tại biên CDN gần người dùng.
3. **Chặng xử lý ứng dụng và Database dài:** đo span nội bộ, thêm chỉ mục cho câu truy vấn chậm hoặc đặt Cache cho dữ liệu đọc lặp lại.
4. **Chặng tải nội dung phản hồi dài:** nén phản hồi (`Brotli`, `gzip`), giảm trường thừa trong payload và phục vụ tệp tĩnh qua CDN.
