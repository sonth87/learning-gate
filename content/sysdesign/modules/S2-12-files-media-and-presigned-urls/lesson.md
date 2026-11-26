## 1. Sai lầm phổ biến: lưu thẳng tệp nhị phân vào Database

```step
category: SETUP
short: Tách khỏi DB
scene: s1-blob-in-db
callout:
  kind: key-idea
  title: Quy tắc vàng với Media
  vi: "Database dùng để lưu metadata nhẹ (tên tệp, kích thước, chủ sở hữu, URL). Toàn bộ byte của ảnh và video phải nằm trên Object Storage."
whatChanged:
  - "+ Tách luồng metadata sang Database và luồng tệp nhị phân sang Object Storage"
  - "~ Kích thước mỗi bản ghi trong Database giảm từ vài MB xuống vài trăm byte"
telemetry:
  - label: "Dòng metadata DB"
    value: "≈ 300 byte"
    tone: ok
  - label: "Chi phí lưu trữ DB"
    value: "Đắt gấp 5–10×"
    tone: bad
```

Khi ứng dụng mới có vài trăm người dùng, lưu ảnh đại diện dưới dạng cột `BLOB` trong PostgreSQL hoặc MySQL có vẻ tiện lợi vì chỉ cần một nơi sao lưu. Nhưng khi lưu lượng tăng lên vài terabyte mỗi ngày, kiến trúc này nhanh chóng bộc lộ ba vấn đề:

- **Chi phí đắt đỏ:** Ổ đĩa hiệu năng cao của Database đắt gấp 5 đến 10 lần Object Storage (như S3, GCS, R2).
- **Sao lưu và nhân bản chậm:** Mỗi bản sao lưu (backup) hoặc Read Replica đều phải chép hàng terabyte ảnh tĩnh ít khi thay đổi, kéo dài thời gian phục hồi.
- **Chiếm bộ nhớ đệm (Buffer Pool):** Đọc các cột BLOB lớn đẩy dữ liệu chỉ mục nóng ra khỏi RAM của Database.

Giải pháp chuẩn là **tách riêng**: Database chỉ giữ một dòng metadata nhẹ (`id`, `owner_id`, `object_key`, `status`), còn nội dung tệp nằm trên **Object Storage**.

## 2. Điểm nghẽn Upload: tệp lớn đi qua App Server

```step
category: PROBLEM
short: Nghẽn App Server
scene: s2-live-upload
activity: S2-12.A1
gate: optional
callout:
  kind: watch-out
  title: Đừng dùng App Server làm trạm trung chuyển byte
  vi: "Khi người dùng tải video 2 GB qua App Server trên mạng di động chậm, luồng xử lý bị giữ hàng phút và nhanh chóng cạn kiệt trước khi tới Storage."
whatChanged:
  - "+ Mô phỏng tải tăng từ 100 lên 1.000 req/s với 70% lượt ghi tệp"
  - "~ App Server chạm ngưỡng quá tải đầu tiên khi phải chuyển tiếp byte"
telemetry:
  - label: "Năng lực 2 App"
    value: "300 req/s"
    tone: warn
  - label: "Tải đỉnh"
    value: "1.000 req/s"
    tone: bad
```

Ngay cả khi đã dùng Object Storage, nhiều hệ thống vẫn mắc lỗi thiết kế luồng tải lên: Client gửi toàn bộ tệp tới **API Server**, rồi API Server mới đẩy tiếp sang Object Storage.

Cách làm này biến tầng API thành ống trung chuyển bất đắc dĩ. Một video 2 GB tải trên mạng di động có thể giữ một worker thread hoặc kết nối mở suốt nhiều phút. Khi hàng trăm người dùng tải lên cùng lúc, số lượng kết nối đồng thời tăng vọt, RAM bị chiếm dụng để đệm dữ liệu và tầng API không còn tài nguyên phục vụ các yêu cầu thông thường khác.

Chạy mô phỏng trực tiếp để quan sát tầng API bão hòa trước tiên khi lưu lượng upload tăng dần.

## 3. Presigned URL và Multipart Upload: tải thẳng lên Storage

```step
category: TECHNIQUE
short: Presigned URL
scene: s3-presigned
callout:
  kind: technique
  title: Cấp vé một lần cho Client
  vi: "API Server chỉ xác thực quyền và ký một URL có hạn ngắn (Presigned URL). Client dùng URL đó đẩy byte thẳng lên Object Storage."
whatChanged:
  - "+ API chỉ xử lý yêu cầu xin chữ ký nhẹ (~5 ms), không nhận byte tệp"
  - "~ Chia tệp lớn thành nhiều phần (Multipart) để gửi song song và nối lại khi đứt mạng"
telemetry:
  - label: "Tải qua API"
    value: "Chỉ vài KB JSON"
    tone: ok
  - label: "Thời hạn URL ký"
    value: "5–15 phút"
```

Để giải phóng hoàn toàn App Server khỏi việc vận chuyển byte, ta dùng cơ chế **Presigned URL**:

1. Client gọi API `POST /uploads/init` kèm tên tệp, kích thước và định dạng.
2. API kiểm tra quyền người dùng, tạo dòng metadata trạng thái `pending` trong Database, rồi dùng khóa bí mật ký một **Presigned URL** cho phép ghi đúng một khóa đối tượng trong 5–15 phút.
3. Client dùng phương thức `PUT` đẩy thẳng dữ liệu từ thiết bị lên **Object Storage**, bỏ qua hoàn toàn App Server.

Với tệp lớn hàng trăm MB đến vài GB, kết hợp thêm **Multipart Upload**: chia tệp thành các mảnh 5–10 MB, tải song song nhiều mảnh cùng lúc và chỉ cần gửi lại đúng mảnh bị lỗi nếu mạng di động chập chờn.

## 4. Xử lý nền và phân phối qua CDN

```step
category: MECHANISM
short: Queue & CDN
scene: s4-async-cdn
callout:
  kind: good-to-know
  vi: "Không bắt người dùng chờ nén ảnh hay chuyển mã video. Đưa sự kiện vào Queue để Worker xử lý nền và phân phối kết quả qua CDN."
whatChanged:
  - "+ Object Storage phát sự kiện vào Queue cho Media Worker tạo thumbnail"
  - "~ Lượt xem ảnh/video được phục vụ trực tiếp từ CDN Edge gần người dùng"
telemetry:
  - label: "Cache Hit CDN"
    value: "80–95%"
    tone: ok
  - label: "Xử lý nền"
    value: "Bất đồng bộ"
```

Ảnh gốc từ điện thoại thường nặng 4–8 MB, còn video có thể ở độ phân giải 4K. Người dùng lướt danh sách không bao giờ cần tải ảnh gốc nặng như vậy.

Ngay khi Object Storage nhận đủ các phần tải lên, nó phát sự kiện vào **Message Queue**. Cụm **Media Worker** đọc từng công việc để tạo các phiên bản thu nhỏ (thumbnail 200 px, bản web 1080 px) hoặc cắt video thành các đoạn ngắn nhiều độ phân giải (HLS/DASH) rồi lưu lại lên Storage.

Ở chiều đọc, **CDN** đứng trước Object Storage. Lượt xem đầu tiên lấy từ Storage, các lượt sau được trả ngay từ máy chủ biên gần người dùng, vừa giảm độ trễ từ vài trăm mili-giây xuống vài chục mili-giây, vừa cắt giảm chi phí băng thông ra ngoài (egress) của Storage gốc.

## 5. Vòng đời lưu trữ, dọn rác và bảo mật Bucket

```step
category: PITFALL
short: Vòng đời & Key
scene: s5-lifecycle-sec
activity: S2-12.A2
gate: optional
callout:
  kind: watch-out
  title: Dữ liệu mồ côi và quyền truy cập Bucket
  vi: "Tắt hoàn toàn quyền liệt kê công khai (Public List) trên Bucket. Với dữ liệu riêng tư, dùng Presigned URL khi đọc thay vì mở công khai."
whatChanged:
  - "+ Áp dụng chính sách Lifecycle chuyển tệp cũ (> 90 ngày) sang tầng lưu trữ lạnh"
  - "~ Bổ sung tác vụ dọn rác định kỳ cho các upload bỏ dở quá 24 giờ"
telemetry:
  - label: "Tiết kiệm chi phí"
    value: "40–70%"
    tone: ok
  - label: "Quyền Bucket"
    value: "Private + Least Privilege"
```

Khi vận hành ở quy mô lớn, ba vấn đề thực tế luôn xuất hiện:

- **Tăng trưởng dung lượng và chi phí:** Ảnh và video cũ ít được truy cập sau 30–90 ngày. Chính sách **Storage Lifecycle** tự động chuyển các đối tượng cũ sang tầng lưu trữ lạnh (như Glacier/Archive) có giá rẻ hơn nhiều lần, hoặc xóa hẳn tệp tạm.
- **Tệp mồ côi (Orphaned Files):** Người dùng bắt đầu tải lên (tạo dòng `pending` trong DB) rồi tắt ứng dụng giữa chừng. Cần quy tắc tự động hủy các phiên Multipart chưa hoàn tất sau 24 giờ và xóa hai pha khi người dùng xóa bài viết.
- **Bảo mật truy cập:** Không bao giờ bật quyền liệt kê toàn bộ Bucket công khai. Tệp riêng tư (hóa đơn, tài liệu nội bộ) phải giữ chế độ Private và chỉ cấp Presigned URL đọc có thời hạn ngắn sau khi API kiểm tra quyền.

## 6. Tổng kết kiến trúc Files & Media

```step
category: RECAP
short: Tổng kết Media
scene: s6-recap
callout:
  kind: key-idea
  title: Đường đi chuẩn cho mọi hệ thống Media
  vi: "Metadata vào Database, byte thẳng lên Object Storage qua Presigned URL, biến đổi hậu kỳ qua Queue + Worker, và phân phối qua CDN."
whatChanged:
  - "+ Hoàn thiện luồng ghi trực tiếp và luồng đọc qua biên CDN"
  - "~ Tách biệt hoàn toàn băng thông tệp lớn khỏi tầng xử lý logic API"
telemetry:
  - label: "Ghi tệp"
    value: "Presigned + Multipart"
  - label: "Đọc tệp"
    value: "CDN Edge"
```

Khi thiết kế tính năng liên quan tới tệp tin và đa phương tiện, hãy kiểm tra đủ 4 mảnh ghép:

1. **Tách lớp lưu trữ:** Metadata trong Database, byte trong Object Storage.
2. **Tải lên trực tiếp:** API chỉ cấp Presigned URL; dùng Multipart cho tệp lớn để hỗ trợ tải song song và tiếp tục khi rớt mạng.
3. **Xử lý nền & CDN:** Dùng Queue + Worker để nén ảnh, cắt video; dùng CDN để gánh 80–95% lưu lượng đọc.
4. **Chi phí & An toàn:** Bật quy tắc Lifecycle chuyển tầng lạnh, dọn Multipart treo và khóa quyền truy cập công khai trên Bucket.
