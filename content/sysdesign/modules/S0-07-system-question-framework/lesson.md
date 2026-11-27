## 1. Vì sao cần bảng kiểm câu hỏi trước khi vẽ sơ đồ kiến trúc?

```step
category: SETUP
short: Bảng kiểm 7 mục
scene: s1-checklist
callout:
  kind: key-idea
  title: Hỏi có hệ thống để không thiết kế lệch bài toán
  vi: "Một kiến trúc phục vụ 500 nhân viên nội bộ hoàn toàn khác kiến trúc phục vụ 20 triệu người dùng toàn cầu. Bảng kiểm 7 câu hỏi đảm bảo bạn khóa chặt biên bài toán trước khi chọn công nghệ."
whatChanged:
  - "+ Khởi tạo luồng chuyển đổi từ đề bài mơ hồ sang thẻ Requirements Card"
  - "+ Chia 7 câu hỏi thành 3 cụm: Khối lượng, Cam kết chất lượng và Thực tế vận hành"
telemetry:
  - label: "Số câu hỏi chuẩn"
    value: "7 nhóm"
  - label: "Thời gian làm rõ"
    value: "5 phút đầu"
    tone: ok
```

Khi nhận một đề bài như thiết kế hệ thống trò chuyện hoặc dịch vụ rút gọn liên kết, sai lầm phổ biến là liệt kê ngay WebSocket, Kafka hay phân mảnh cơ sở dữ liệu mà chưa biết hệ thống phục vụ bao nhiêu người và ngân sách ra sao.

Giống như bảng kiểm trước chuyến bay trong ngành hàng không, kỹ sư thiết kế hệ thống cần một danh sách câu hỏi cố định đi từ bối cảnh tổng thể đến ràng buộc vận hành. Bảng kiểm **7 nhóm câu hỏi** giúp bạn:
1. Chuyển mọi mô tả định tính mơ hồ thành con số đo được.
2. Phát hiện sớm các yêu cầu tự mâu thuẫn trước khi tốn công xây dựng.
3. Tạo ra một thẻ **Requirements Card** làm căn cứ xuyên suốt cho mọi quyết định kiến trúc sau đó.

## 2. Câu hỏi 1 & 2 — Quy mô (Scale) và Mẫu lưu lượng (Traffic Pattern)

```step
category: MECHANISM
short: Quy mô & Tải
scene: s2-scale-traffic
callout:
  kind: key-idea
  title: Quy mô cho con số tổng, mẫu lưu lượng cho hành vi
  vi: "Cùng 10 triệu request mỗi ngày, nhưng rải đều suốt 24 giờ chỉ khoảng 116 req/s, còn dồn vào 10 phút mở bán vé có thể vọt lên hơn 16.000 req/s."
whatChanged:
  - "+ Tách riêng quy mô người dùng (DAU, tăng trưởng) và hình dạng lưu lượng"
  - "+ Bổ sung hai chỉ số dẫn dắt kiến trúc: tỉ lệ Đọc:Ghi và hệ số đỉnh tải"
telemetry:
  - label: "Đọc nặng (≥ 90%)"
    value: "Ưu tiên Cache / CDN"
  - label: "Đỉnh nhọn (Spike)"
    value: "Queue + Autoscale"
    tone: warn
```

Hai câu hỏi đầu tiên xác định áp lực lưu lượng đặt lên hệ thống:

- **Câu hỏi 1 — Quy mô (Scale):** hiện tại có bao nhiêu người dùng hoạt động mỗi ngày (DAU), tổng số giao dịch mỗi ngày là bao nhiêu, và dự kiến tăng trưởng gấp mấy lần trong 12–24 tháng tới? Với 2.000 người dùng và tăng trưởng thấp, một khối ứng dụng đơn kèm SQL quản lý sẵn là lựa chọn gọn gàng nhất.
- **Câu hỏi 2 — Mẫu lưu lượng (Traffic Pattern):** người dùng tương tác theo hình dạng nào?
  - **Tỉ lệ Đọc : Ghi (`Read : Write`):** hệ thống đọc nhiều gấp 20–100 lần ghi sẽ hưởng lợi trực tiếp từ tầng Cache và Read Replica; ngược lại hệ thống ghi liên tục (như định vị tài xế mỗi 4 giây) cần tối ưu thông lượng ghi và phân mảnh.
  - **Độ dốc của đỉnh tải:** lưu lượng đều đặn theo giờ hành chính hay có đỉnh nhọn đột biến khi tung khuyến mãi?

## 3. Câu hỏi 3 — Kích thước và vòng đời dữ liệu (Data Lifecycle)

```step
category: MECHANISM
short: Dữ liệu & Lưu
scene: s3-data
callout:
  kind: good-to-know
  title: Đừng trộn tệp nhị phân lớn vào bảng giao dịch
  vi: "Nhân số bản ghi mới mỗi ngày với kích thước trung bình một bản ghi để biết tốc độ phình dữ liệu và tách sớm dữ liệu nóng khỏi dữ liệu lưu trữ dài hạn."
whatChanged:
  - "+ Ước lượng dung lượng tích lũy và phân tầng dữ liệu nóng - lạnh"
telemetry:
  - label: "1 GB/tháng"
    value: "12 GB/năm (1 SQL)"
    tone: ok
  - label: "100 GB/ngày"
    value: "36,5 TB/năm (Phân tầng)"
    tone: warn
```

Câu hỏi thứ ba làm rõ gánh nặng lưu trữ và truy xuất theo thời gian:
- Mỗi bản ghi nặng bao nhiêu byte và chứa loại dữ liệu gì (văn bản có cấu trúc, JSON linh hoạt hay ảnh/video nhiều megabyte)?
- Mỗi ngày hệ thống sinh thêm bao nhiêu GB, thời gian bắt buộc lưu giữ là 90 ngày hay 5 năm?
- Tỉ lệ truy cập tập trung vào dữ liệu mới tạo gần đây (dữ liệu nóng) hay quét lịch sử nhiều năm (dữ liệu lạnh)?

Nếu nhật ký sự kiện tăng 100 GB mỗi ngày (tương đương 36,5 TB mỗi năm), việc giữ toàn bộ trên ổ SSD của cơ sở dữ liệu chính sẽ đẩy chi phí lên rất cao và làm chậm truy vấn; ta chỉ nên giữ 30 ngày gần nhất trên kho tốc độ cao và đẩy phần cũ sang kho lưu trữ đối tượng chi phí thấp.

## 4. Câu hỏi 4 & 5 — Độ sẵn sàng (Availability) và Tính nhất quán (Consistency)

```step
category: MECHANISM
short: Uptime & Đồng bộ
scene: s4-avail-cons
callout:
  kind: compare
  title: Mỗi chữ số 9 thêm vào làm chi phí và độ phức tạp tăng mạnh
  vi: "Không phải mọi tính năng trong cùng một sản phẩm đều cần chung một mức độ sẵn sàng và nhất quán như nhau."
whatChanged:
  - "+ Đối chiếu yêu cầu uptime và tính nhất quán theo từng nghiệp vụ cụ thể"
telemetry:
  - label: "99,9% Uptime"
    value: "≤ 8,76 giờ nghỉ/năm"
  - label: "99,99% Uptime"
    value: "≤ 52,6 phút nghỉ/năm"
    tone: warn
```

Hai câu hỏi tiếp theo khóa chặt mức độ chịu lỗi và độ chính xác tức thời của dữ liệu:

| Nhóm câu hỏi | Khi cần mức nghiêm ngặt cao | Khi chấp nhận nới lỏng hợp lý |
|---|---|---|
| **4. Độ sẵn sàng (Availability)** | Cổng thanh toán, đặt chuyến xe (99,99% — cần dự phòng đa vùng, tự động chuyển đổi không gián đoạn) | Công cụ báo cáo nội bộ (99%–99,9% — cho phép cửa sổ bảo trì ban đêm) |
| **5. Tính nhất quán (Consistency)** | Số dư ví, tồn kho vé cuối cùng (**Strong Consistency** — đọc sau khi ghi phải thấy đúng số mới ngay) | Bộ đếm lượt xem, bảng tin mạng xã hội (**Eventual Consistency** — lệch 2–5 giây không ảnh hưởng nghiệp vụ) |

Khi gặp sự cố đứt kết nối mạng giữa các cụm máy chủ, bạn không thể giữ đồng thời cả tính nhất quán tức thời tuyệt đối lẫn khả năng nhận mọi lượt ghi ở cả hai phía; hỏi rõ câu 4 và câu 5 giúp chọn đúng hướng ưu tiên.

## 5. Câu hỏi 6 & 7 — Mục tiêu độ trễ (Latency) và Ngân sách vận hành (Cost)

```step
category: MECHANISM
short: Độ trễ & Chi phí
scene: s5-lat-cost
callout:
  kind: watch-out
  title: Chi phí không chỉ là hóa đơn thuê máy chủ
  vi: "Một kiến trúc 15 dịch vụ rời rạc có thể rẻ tiền máy ở tải thấp nhưng làm đội ngũ 3 kỹ sư kiệt sức vì trực vận hành, triển khai và gỡ lỗi xuyên mạng."
whatChanged:
  - "+ Chốt ngưỡng độ trễ p99 theo trải nghiệm người dùng và khóa trần chi phí/đội ngũ"
telemetry:
  - label: "Gợi ý tìm kiếm"
    value: "p99 < 80 ms"
  - label: "Xuất báo cáo lô"
    value: "Vài chục giây (Async)"
    tone: ok
```

Hai câu hỏi cuối cùng đặt hệ thống vào giới hạn trải nghiệm thực tế và nguồn lực doanh nghiệp:
- **Câu hỏi 6 — Độ trễ (Latency):** người dùng chấp nhận chờ bao lâu ở phân vị **p95 và p99**? Gợi ý ô tìm kiếm hay chuyển hướng liên kết cần dưới 100 ms; trang chi tiết sản phẩm khoảng 200–300 ms; còn xuất tệp đối soát cuối tháng có thể chạy nền vài phút rồi gửi thông báo. Ngoài ra, người dùng tập trung ở một quốc gia hay phân tán nhiều châu lục (cần CDN ở biên)?
- **Câu hỏi 7 — Chi phí và Đội ngũ (Cost & Constraints):** ngân sách hạ tầng mỗi tháng là bao nhiêu, quy mô đội kỹ thuật mấy người, có ràng buộc pháp lý lưu dữ liệu theo lãnh thổ hay hệ thống cũ bắt buộc tích hợp không?

## 6. Bốn sai lầm thường gặp khi đặt câu hỏi làm rõ

```step
category: PITFALL
short: Sai lầm khi hỏi
scene: s6-mistakes
callout:
  kind: watch-out
  title: Đừng chấp nhận tính từ chung chung mà không đổi ra số
  vi: "Những cụm từ như cực nhanh, tải khổng lồ hay không bao giờ lỗi chưa phải là yêu cầu kỹ thuật; hãy hỏi tiếp để chốt ngưỡng số học cụ thể."
whatChanged:
  - "+ Đối chiếu 3 câu trả lời mơ hồ thường gặp với cách hỏi đào sâu để lấy số đo"
telemetry:
  - label: "Mơ hồ"
    value: "Cần rất sẵn sàng"
    tone: bad
  - label: "Đo lường được"
    value: "99,9% (≤ 43 phút/tháng)"
    tone: ok
```

Ngay cả khi nhớ đủ 7 mục, quá trình thu thập yêu cầu vẫn dễ trượt nếu mắc bốn lỗi sau:
1. **Hỏi quá chung chung:** chỉ hỏi quy mô lớn hay nhỏ thay vì hỏi số người dùng đồng thời giờ cao điểm và tốc độ tăng trưởng năm tới.
2. **Chấp nhận câu trả lời cảm tính:** khi bên yêu cầu nói hệ thống phải luôn trực tuyến, cần hỏi rõ thời gian gián đoạn chấp nhận được là 40 phút mỗi tháng (99,9%) hay dưới 5 phút mỗi năm (99,999%), kèm mức chênh lệch chi phí tương ứng.
3. **Không chỉ ra mâu thuẫn sớm:** nếu đề bài đòi độ trễ dưới 10 ms toàn cầu, nhất quán tức thời mọi giao dịch nhưng ngân sách chỉ 100 USD/tháng, kỹ sư phải trình bày thẳng sự đánh đổi để thống nhất thứ tự ưu tiên.
4. **Quên hỏi ràng buộc phi kỹ thuật:** bỏ qua thời hạn ra mắt sản phẩm hoặc số lượng kỹ sư bảo trì thực tế.

## 7. Thực hành — Từ thẻ 7 câu hỏi sang cấu hình URL Shortener

```step
category: TECHNIQUE
short: Áp dụng thực tế
scene: s7-url-card
activity: S0-07.A1
gate: required
callout:
  kind: technique
  title: Mỗi dòng trên Requirements Card ánh xạ thẳng sang một quyết định
  vi: "Tỉ lệ 97% đọc dẫn tới Cache phủ đủ tập key nóng; yêu cầu 99,9% uptime dẫn tới tối thiểu 2 instance cho tầng ứng dụng; dữ liệu 900 GB cho phép giữ nguyên 1 cụm SQL gọn nhẹ."
whatChanged:
  - "+ Tổng hợp kết quả 7 câu hỏi của bài toán URL Shortener thành Requirements Card"
  - "+ Kiểm chứng cấu hình trực tiếp dưới đỉnh tải 3.500 req/s trong ngân sách 1,35 USD/giờ"
telemetry:
  - label: "Đỉnh tải mục tiêu"
    value: "3.500 req/s"
  - label: "Tỉ lệ Đọc : Ghi"
    value: "97% : 3%"
  - label: "Ngân sách trần"
    value: "≤ 1,35 USD/giờ"
    tone: ok
```

Hãy xem cách bảng kiểm 7 câu hỏi dẫn dắt thiết kế dịch vụ rút gọn liên kết:
1. **Quy mô:** khoảng 30 triệu liên kết mới/tháng và 1 tỷ lượt bấm/tháng.
2. **Mẫu lưu lượng:** trung bình ~1.160 req/s, giờ cao điểm **3.500 req/s**; 97% là đọc chuyển hướng, tập liên kết đang được bấm thường xuyên khoảng **100.000 key**.
3. **Dữ liệu:** mỗi bản ghi ~500 byte ⇒ 5 năm khoảng **900 GB**, vừa vặn trong một cơ sở dữ liệu SQL chuẩn mà chưa cần phân mảnh phức tạp.
4. **Độ sẵn sàng:** 99,9% — tầng API không được phụ thuộc vào một tiến trình đơn lẻ.
5. **Tính nhất quán:** tạo mã mới cần không trùng lặp; thống kê lượt bấm chấp nhận trễ vài giây.
6. **Độ trễ:** chuyển hướng **p99 ≤ 90 ms**.
7. **Ngân sách:** tối đa **1,35 USD/giờ**.

Hãy hoàn thành bài tập bên dưới để biến tấm thẻ này thành cấu hình hệ thống đạt chuẩn.

## 8. Tổng kết: Mang theo thẻ 7 câu hỏi vào mọi buổi thiết kế

```step
category: RECAP
short: Tổng kết
scene: s1-checklist
callout:
  kind: key-idea
  title: Tóm tắt 7 câu hỏi mở khóa mọi bài toán thiết kế
  vi: "Lắng nghe đề bài, đi tuần tự qua 7 nhóm câu hỏi, đổi tính từ thành con số, ghi thành Requirements Card và chỉ ra các đánh đổi ngay từ đầu."
whatChanged:
  - "+ Khép lại quy trình chuẩn bị yêu cầu trước khi bước sang bài tổng kết Phase 0"
telemetry:
  - label: "Khối lượng"
    value: "Scale · Traffic · Data"
  - label: "Chất lượng & Phí"
    value: "Uptime · Consistency · p99 · Cost"
    tone: ok
```

Bảy nhóm câu hỏi bạn vừa thực hành cũng chính là bước mở màn của mọi ca thiết kế thực tế trong tab **Case thiết kế** và chặng **Scope + Numbers** của **Phỏng vấn**:

| Thứ tự | Nhóm câu hỏi | Kết quả đầu ra trên Requirements Card |
|---|---|---|
| 1 | **Scale** | DAU hiện tại, tốc độ tăng trưởng 1–2 năm |
| 2 | **Traffic Pattern** | RPS trung bình/đỉnh, tỉ lệ Đọc : Ghi, biên độ đỉnh nhọn |
| 3 | **Data Size** | Kích thước bản ghi, tốc độ tăng GB/ngày, chu kỳ lưu nóng/lạnh |
| 4 | **Availability** | Mức uptime (99,9% hay 99,99%), có cho phép dừng bảo trì không |
| 5 | **Consistency** | Chỗ nào bắt buộc Strong, chỗ nào dùng được Eventual |
| 6 | **Latency** | Mục tiêu p95/p99 cho từng luồng thao tác, phân bố địa lý |
| 7 | **Cost & Team** | Ngân sách hạ tầng tối đa, quy mô đội vận hành, dịch vụ quản lý sẵn |
