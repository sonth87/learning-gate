## 1. Cảm nhận quy mô (Scale Intuition): mỗi bậc 10 lần đòi hỏi một kiến trúc khác nhau

```step
category: SETUP
short: Thang quy mô
scene: s1-spectrum
callout:
  kind: key-idea
  title: Định lượng thay cho cảm tính
  vi: "Cụm từ nhiều người dùng không đủ để chọn kiến trúc. Đổi quy mô ra RPS, dung lượng và băng thông mới cho biết một máy chủ đơn lẻ còn đủ hay đã phải phân tán."
whatChanged:
  - "+ Đối chiếu 5 bậc quy mô từ 1K đến 10M DAU"
  - "~ Mỗi lần tăng 10× làm dịch chuyển điểm nghẽn chính của hệ thống"
telemetry:
  - label: "Bậc nhảy kiến trúc"
    value: "Mỗi 10× DAU"
  - label: "Sai số chấp nhận"
    value: "±30%"
    tone: ok
  - label: "Đơn vị tải chuẩn"
    value: "req/s (RPS)"
```

**Scale Intuition** là khả năng quy đổi nhanh quy mô sản phẩm thành các con số hạ tầng cụ thể: số request mỗi giây (`RPS`), số máy chủ ứng dụng, dung lượng đĩa, băng thông mạng và bộ nhớ `RAM` cho `Cache`. Trong thiết kế hệ thống, ước lượng nhẩm (**Napkin Math**) không cần chính xác tới từng chữ số thập phân; chỉ cần đúng **bậc độ lớn** (sai số trong khoảng ±30%) là đủ để loại bỏ phương án sai ngay từ đầu.

Khi quy mô người dùng hoạt động hằng ngày (`DAU`) tăng theo cấp số nhân 10, kiến trúc phải thay đổi về chất chứ không chỉ nhân bản máy tính:

| Quy mô DAU | RPS điển hình | Hạ tầng tiêu biểu | Điểm nghẽn thường gặp |
|---|---|---|---|
| **1.000** | 1 – 5 req/s | 1 App + 1 Database trên máy nhỏ | Hầu như chưa nghẽn |
| **10.000** | 10 – 50 req/s | 2 App sau Load Balancer + 1 Database | Truy vấn thiếu chỉ mục (`Index`) |
| **100.000** | 100 – 800 req/s | Cụm App + `Redis Cache` + `Read Replica` + `CDN` | Tải đọc/ghi trên Database chính |
| **1.000.000+** | 1.000 – 10.000+ req/s | Đa vùng, `Cache` phân tán, `Queue`, `Sharding` | Ghi đồng thời, khóa nóng, mạng liên vùng |

## 2. Các hằng số quy đổi chuẩn trong Napkin Math

```step
category: TECHNIQUE
short: Số chuẩn nhớ
scene: s2-constants
callout:
  kind: good-to-know
  title: Làm tròn theo lũy thừa của 10
  vi: "Làm tròn 86.400 giây thành 100.000 giây (10^5) giúp phép chia nhẩm chỉ còn là dịch dấu phẩy và tạo sẵn biên an toàn khoảng 15%."
whatChanged:
  - "+ Bảng ánh xạ thời gian, đơn vị dữ liệu và năng lực tham chiếu mỗi node"
telemetry:
  - label: "Số giây / ngày"
    value: "86.400 ≈ 10^5 s"
  - label: "Số giây / năm"
    value: "≈ 3,15 × 10^7 s"
  - label: "Tỉ lệ byte sang bit"
    value: "1 B = 8 bit"
    tone: warn
```

Để tính nhẩm trong vài chục giây mà không nhầm số 0, bạn chỉ cần ghi nhớ bốn nhóm hằng số nền tảng dựa trên lũy thừa của 10:

1. **Thời gian.** Một ngày có `24 × 3.600 = 86.400 giây`, khi tính nhẩm xấp xỉ thành `10^5 giây`. Một tháng (`30 ngày`) xấp xỉ `2,6 × 10^6 giây`, và một năm (`365 ngày`) xấp xỉ `3,15 × 10^7 giây` (dễ nhớ là `π × 10^7 giây`).
2. **Đơn vị dung lượng.** Dùng hệ thập phân cho ước lượng nhanh: `1 KB ≈ 10^3 B`, `1 MB ≈ 10^6 B`, `1 GB ≈ 10^9 B`, `1 TB ≈ 10^12 B`, `1 PB ≈ 10^15 B`.
3. **Đơn vị mạng.** Lưu trữ tính bằng **Byte (`B`)**, nhưng đường truyền mạng thường đo bằng **bit mỗi giây (`Mb/s`, `Gb/s`)**. Luôn nhân 8 khi đổi từ `MB/s` sang `Mb/s`.
4. **Năng lực tham chiếu một node** (phụ thuộc độ phức tạp xử lý và phần cứng): App Server logic vừa khoảng `500 – 1.500 req/s`, `SQL Database` có chỉ mục tốt khoảng `1.000 – 5.000 truy vấn đơn giản/s`, và một node `Redis` trong `RAM` đạt khoảng `50.000 – 100.000 thao tác/s`.

## 3. Từ DAU sang RPS trung bình và RPS cao điểm (Peak RPS)

```step
category: MECHANISM
short: DAU sang RPS
scene: s3-rps-chain
activity: S0-05.A1
gate: optional
callout:
  kind: watch-out
  title: Không bao giờ thiết kế theo tải trung bình
  vi: "Lưu lượng người dùng dồn vào giờ cao điểm trưa và tối. Hệ thống chỉ vừa khít mức RPS trung bình sẽ quá tải hàng ngày vào khung giờ đỉnh."
whatChanged:
  - "+ Chuỗi tính DAU × số thao tác / 86.400 → Avg RPS → Peak RPS"
  - "~ Tách riêng RPS đọc và RPS ghi ngay từ đầu"
telemetry:
  - label: "Ví dụ 200K DAU"
    value: "≈ 116 req/s TB"
  - label: "Peak (×3 TB)"
    value: "≈ 348 req/s"
    tone: warn
  - label: "Hệ số Peak phổ biến"
    value: "2× đến 3×"
```

Bước đầu tiên của mọi bài toán ước lượng là đổi số người dùng hoạt động mỗi ngày (`DAU`) thành lưu lượng thực tế gõ vào hệ thống mỗi giây, tách riêng luồng đọc (`Read RPS`) và luồng ghi (`Write RPS`):

- **RPS trung bình (`Avg RPS`)** = `(DAU × số thao tác mỗi người mỗi ngày) / 86.400`.
- **RPS cao điểm (`Peak RPS`)** = `Avg RPS × hệ số đỉnh` (thường chọn từ `2` đến `3` cho ứng dụng tiêu dùng; với sự kiện mở bán chớp nhoáng có thể gấp `5 – 10` lần).

Xét một trang thương mại điện tử có `200.000 DAU`, mỗi người xem `10 trang/ngày` và mỗi lượt tải trang gọi `5 API`:
- Tổng số lời gọi API mỗi ngày: `200.000 × 10 × 5 = 10.000.000 request/ngày`.
- `Avg RPS` = `10.000.000 / 86.400 ≈ 116 req/s` (hoặc nhẩm nhanh `10^7 / 10^5 = 100 req/s`).
- `Peak RPS` (nhân 3) = `116 × 3 ≈ 348 req/s`. Đây mới là con số đầu vào để tính số lượng máy chủ.

## 4. Từ Peak RPS sang số lượng máy chủ và khoảng dự phòng (Headroom)

```step
category: TECHNIQUE
short: Tính số máy
scene: s4-servers
callout:
  kind: key-idea
  title: Chừa Headroom và tối thiểu 2 instance
  vi: "Vận hành máy chủ ở mức sử dụng ρ ≤ 0,7 giúp tránh vùng độ trễ tăng dựng đứng và đủ sức gánh tải khi một máy phải khởi động lại."
whatChanged:
  - "+ Áp dụng trần sử dụng mục tiêu ρ_target = 0,6–0,7 khi chia công suất"
  - "+ Áp quy tắc tối thiểu N ≥ 2 để loại bỏ điểm lỗi đơn (SPOF)"
telemetry:
  - label: "Trần ρ khuyến nghị"
    value: "0,60 – 0,70"
    tone: ok
  - label: "Số máy tối thiểu (HA)"
    value: "≥ 2 instance"
```

Có `Peak RPS` không có nghĩa là lấy thẳng `Peak RPS / μ` để ra số máy. Nếu một máy xử lý tối đa `μ = 500 req/s` và hệ thống nhận `1.500 req/s` lúc cao điểm, đặt đúng 3 máy sẽ đẩy mức sử dụng `ρ = λ / μ = 1,00`. Theo lý thuyết hàng đợi, khi `ρ` vượt `0,8`, thời gian chờ tăng vọt theo đường cong dốc đứng, và nếu 1 máy dừng để cập nhật phiên bản, 2 máy còn lại nhận `1.500 / 1.000` (`ρ = 1,50`) dẫn tới sập dây chuyền.

Công thức thực tế để tính số instance tầng ứng dụng không trạng thái (`Stateless`):

- **Công suất an toàn mỗi máy** = `μ × ρ_target` (thường chọn `ρ_target = 0,7`, tức chừa 30% dự phòng).
- **Số máy cần thiết** = `max(2, ceil(Peak RPS / (μ × 0,7)))`.

Với `Peak RPS = 1.500 req/s` và `μ = 500 req/s`: mỗi máy nhận an toàn `500 × 0,7 = 350 req/s`, suy ra cần `ceil(1.500 / 350) = 5 instance` (tổng năng lực `2.500 req/s`, ngay cả khi mất 1 máy vẫn còn `2.000 req/s > 1.500 req/s`).

## 5. Ước lượng dung lượng lưu trữ: tách Metadata khỏi Media và nhân hệ số sao chép

```step
category: TECHNIQUE
short: Tính lưu trữ
scene: s5-storage
activity: S0-05.A2
gate: required
callout:
  kind: technique
  title: Luôn tách dữ liệu có cấu trúc và tệp nhị phân lớn
  vi: "Metadata văn bản tăng vài trăm GB mỗi năm vừa vặn trong Database, còn ảnh và video tăng hàng trăm TB phải đặt ở Object Storage."
whatChanged:
  - "+ Công thức lưu trữ nhiều năm có nhân hệ số sao chép (Replication Factor)"
  - "~ Phân tách dung lượng Database (Metadata) và Object Storage (Media)"
telemetry:
  - label: "Bản ghi người dùng / bài đăng"
    value: "0,5 – 2 KB"
  - label: "Ảnh nén / Video ngắn"
    value: "0,5 MB / 50 MB"
    tone: warn
  - label: "Hệ số sao chép chuẩn"
    value: "×3 bản sao"
```

Khi tính dung lượng lưu trữ (`Storage`), sai lầm hay gặp nhất là gộp chung văn bản có cấu trúc (`Metadata`) với ảnh hoặc video (`Media`), hoặc quên nhân hệ số sao chép (`Replication Factor`) và thời gian lưu giữ (`Retention`).

Kích thước tham chiếu thường dùng: một dòng hồ sơ người dùng khoảng `1 KB`, một bài đăng hoặc tin nhắn kèm siêu dữ liệu khoảng `500 B`, một ảnh nén web khoảng `300 KB – 2 MB`, một phút video `720p` khoảng `50 MB`.

Xét ứng dụng mạng xã hội có `1.000.000 DAU`, mỗi người đăng `2 bài/ngày` (`2 × 10^6 bài/ngày`), trong đó 50% bài có đính kèm 1 ảnh nén `1,5 MB`:
- **Metadata trong Database:** `2 × 10^6 × 500 B = 1 GB/ngày`, tương đương `365 GB/năm`. Nhân `3 bản sao` (Primary + 2 Replica) mới khoảng `1,1 TB/năm` — một cụm `PostgreSQL` đơn hoàn toàn quản lý tốt trong năm đầu.
- **Ảnh trên Object Storage:** `10^6 ảnh/ngày × 1,5 MB = 1,5 TB/ngày`, tức khoảng `547,5 TB/năm`. Khối lượng này bắt buộc lưu trên `Object Storage` (như `S3`) kết hợp nén ảnh và chuyển dữ liệu cũ sang tầng lưu trữ lạnh (`Cold Tier`).

## 6. Ước lượng băng thông mạng và dung lượng RAM cho Cache

```step
category: MECHANISM
short: Mạng và RAM
scene: s6-bw-ram
callout:
  kind: good-to-know
  title: Quy tắc 80/20 cho bộ nhớ đệm RAM
  vi: "Khoảng 20% nội dung mới hoặc phổ biến thường tạo ra 80% lượt đọc. Giữ trọn 20% lượng dữ liệu đọc trong ngày trên RAM mang lại Cache Hit Ratio rất cao."
whatChanged:
  - "+ Tính Ingress (luồng ghi vào) và Egress (luồng đọc ra qua CDN)"
  - "+ Tính dung lượng RAM Cache theo quy tắc tập làm việc nóng 20%"
telemetry:
  - label: "Tập dữ liệu nóng"
    value: "≈ 20% dữ liệu ngày"
    tone: ok
  - label: "Tỉ lệ gánh của CDN"
    value: "85% – 95% Egress"
    tone: ok
```

Từ `RPS` và kích thước bản tin trung bình (`Payload`), ta suy ra ngay băng thông mạng và bộ nhớ `RAM` cần cấp cho `Cache`:

1. **Băng thông vào (`Ingress`)** = `Peak Write RPS × kích thước bản ghi/tệp tải lên`.
2. **Băng thông ra (`Egress`)** = `Peak Read RPS × kích thước phản hồi`. Nếu có `CDN` đạt `Hit Ratio = 90%` cho ảnh tĩnh, máy chủ gốc (`Origin`) chỉ phải chịu `10%` băng thông `Egress`. Ví dụ: `Peak Read = 3.000 lượt xem ảnh/s × 500 KB = 1,5 GB/s` (`12 Gb/s`); sau `CDN` 90%, `Origin` chỉ còn phát ra `150 MB/s` (`1,2 Gb/s`).
3. **Dung lượng `RAM Cache` (quy tắc 20%).** Giả sử mỗi ngày hệ thống có `10.000.000` bản ghi văn bản được truy cập (mỗi bản ghi `1 KB`, tổng `10 GB`). Để giữ 20% tập nóng nhất trong `Redis` kèm khoảng 30% chi phí cấu trúc con trỏ khoá, lượng `RAM` cần cấp là `10 GB × 0,2 × 1,3 = 2,6 GB` — nằm gọn trên một node `Redis` `4 GB` hoặc `8 GB`.

## 7. Tỉ lệ Đọc/Ghi dẫn dắt kiến trúc và 3 sai lầm phổ biến khi ước lượng

```step
category: PITFALL
short: Tỉ lệ Đọc/Ghi
scene: s7-rw-patterns
callout:
  kind: compare
  title: Tỉ lệ Đọc/Ghi quyết định hướng tối ưu
  vi: "Hệ thống 95% đọc được giải quyết bằng Cache và CDN; hệ thống 80% ghi lại phụ thuộc vào hàng đợi bất đồng bộ, ghi theo lô và phân mảnh dữ liệu."
whatChanged:
  - "+ Phân nhánh kiến trúc theo 3 mẫu Read-Heavy, Balanced và Write-Heavy"
  - "~ Cảnh báo 3 lỗi tính nhẩm thường dẫn tới thiết kế lệch quy mô"
telemetry:
  - label: "Read-Heavy"
    value: "≥ 90% lượt đọc"
  - label: "Balanced"
    value: "50% – 85% đọc"
  - label: "Write-Heavy"
    value: "≥ 50% lượt ghi"
    tone: warn
```

Kết quả phép tính `Read RPS : Write RPS` chỉ thẳng nơi cần tập trung tài nguyên:

- **Read-Heavy (`≥ 90%` đọc, tỷ lệ `10:1` đến `100:1`):** trang tin tức, bảng tin mạng xã hội, dịch vụ rút gọn link. Trọng tâm là `CDN`, `Redis Cache` nhiều lớp và `Read Replica`; chấp nhận trễ đồng bộ ngắn ở các lượt xem.
- **Balanced (`50% – 85%` đọc):** thương mại điện tử, đặt vé. Kết hợp `Cache` cho danh mục sản phẩm đọc nhiều với chỉ mục và giao dịch chặt chẽ cho luồng đặt đơn.
- **Write-Heavy (`≥ 50%` ghi):** thu thập log, cảm biến `IoT`, sự kiện phân tích. `Cache` đọc ít tác dụng; trọng tâm chuyển sang `Message Queue` làm bộ đệm hấp thụ đỉnh tải, ghi gộp theo lô (`Batch Write`) và lưu trữ tối ưu ghi tuần tự.

**Ba sai lầm cần tránh khi làm Napkin Math:** (1) lấy `Avg RPS` thay vì `Peak RPS` để chọn cỡ máy; (2) nhầm `MegaByte/s` với `Megabit/s` làm thiếu 8 lần băng thông mạng; (3) tính số lẻ quá chi tiết tới hàng đơn vị nhưng lại bỏ sót hệ số nhân 10 của số lời gọi API ẩn trên mỗi màn hình.

## 8. Tóm tắt: quy trình 5 bước Napkin Math nối thẳng vào tham số mô phỏng

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Đầu ra của ước lượng là đầu vào của kiến trúc
  vi: "Năm con số Peak RPS, tỉ lệ Đọc/Ghi, số máy chủ, tốc độ tăng lưu trữ và dung lượng tập nóng trong RAM chính là bộ tham số khởi tạo cho mọi bài thiết kế hệ thống."
whatChanged:
  - "+ Chốt chuỗi 5 bước ước lượng nhanh từ DAU tới RAM và CDN"
telemetry:
  - label: "Chuỗi chuẩn"
    value: "5 bước nối tiếp"
  - label: "Đầu ra chính"
    value: "Peak RPS · Storage · RAM"
    tone: ok
```

Trước khi vẽ sơ đồ khối hay chọn công nghệ cho bất kỳ bài toán nào ở các chương sau, hãy chạy nhanh quy trình 5 bước trên nháp:

1. **Từ `DAU` ra `Avg RPS`:** nhân số thao tác mỗi ngày rồi chia `86.400` (nhẩm nhanh bằng `10^5`), tách riêng lượt đọc và lượt ghi.
2. **Nhân hệ số đỉnh ra `Peak RPS`:** nhân `2×` đến `3×` (hoặc cao hơn nếu đề bài có tải đột biến) để lấy lưu lượng thiết kế.
3. **Chia công suất có dự phòng ra số máy:** giữ mức sử dụng mục tiêu `ρ ≤ 0,7` và đảm bảo tối thiểu `2 instance` cho tính sẵn sàng.
4. **Tính lưu trữ theo vòng đời:** tách riêng `Metadata` và `Media`, nhân `365 ngày × số năm lưu giữ × hệ số sao chép`.
5. **Định cỡ băng thông và `RAM Cache`:** đổi `B/s` sang `bit/s` (nhân 8), tính phần `CDN` gánh, và lấy khoảng `20%` dữ liệu truy cập trong ngày để định cỡ bộ nhớ `Cache`.
