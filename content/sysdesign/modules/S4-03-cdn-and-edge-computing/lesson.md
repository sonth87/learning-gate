## 1. Giới hạn vật lý của khoảng cách và lý do cần CDN

```step
category: SETUP
short: Khoảng cách RTT
scene: s1-distance
callout:
  kind: key-idea
  title: Không thể tối ưu code để vượt tốc độ ánh sáng
  vi: "Khi người dùng ở London hay Sydney gọi về Origin tại Singapore, riêng thời gian truyền tin khứ hồi qua cáp quang đã mất hàng trăm mili-giây."
whatChanged:
  - "+ Người dùng ở xa gửi yêu cầu trực tiếp qua Internet tới Origin Server"
  - "~ Độ trễ khứ hồi (RTT) cao dù máy chủ Origin xử lý rất nhanh"
telemetry:
  - label: "RTT xuyên vùng"
    value: "> 200 ms"
    tone: warn
  - label: "Năng lực Origin"
    value: "1.400 req/s"
```

Dù mã nguồn và cơ sở dữ liệu tại trung tâm dữ liệu gốc chạy nhanh đến đâu, người dùng ở nửa vòng Trái Đất vẫn thấy trang web phản hồi chậm. Nguyên nhân nằm ở vật lý: tín hiệu truyền qua cáp quang xuyên đại dương có độ trễ khứ hồi (RTT) tối thiểu hàng trăm mili-giây, chưa kể quá trình bắt tay TCP/TLS.

Giải pháp duy nhất để rút ngắn khoảng cách này là đưa bản sao nội dung ra các điểm **CDN Edge** nằm ngay gần người dùng cuối.

## 2. CDN Edge gánh 90% lượt đọc và giảm tải cho Origin

```step
category: TECHNIQUE
short: Edge Offload
scene: s2-edge-hit
callout:
  kind: good-to-know
  title: Một tầng biên gánh phần lớn lưu lượng đọc chung
  vi: "Đa số tài nguyên như ảnh, CSS, JavaScript hoặc bài viết công khai giống nhau với mọi người dùng, nên Edge có thể trả lời ngay tới 90%."
whatChanged:
  - "+ Đặt cụm CDN Edge giữa người dùng toàn cầu và Origin Server"
  - "~ 90% lượt đọc được trả ngay tại Edge (9.000 → 900 req/s về sau)"
telemetry:
  - label: "Edge Hit Ratio"
    value: "90%"
    tone: ok
  - label: "Tải qua Edge"
    value: "10%"
    tone: ok
```

Khi đặt **CDN Edge** ở biên mạng, yêu cầu từ người dùng ở London hoặc Sydney được định tuyến tới điểm hiện diện (POP) gần nhất. Nếu Edge đã có sẵn bản sao (Cache Hit), phản hồi quay về chỉ trong vài chục mili-giây mà không cần đi xuyên lục địa.

Không chỉ giảm độ trễ cho người dùng, CDN còn cắt giảm 90% lượng truy cập đi về trung tâm dữ liệu gốc: ở mức 9.000 req/s ngoài biên, chỉ khoảng 900 req/s bị miss đi tiếp về phía Origin.

## 3. Điều khiển hành vi bằng HTTP Cache Headers

```step
category: TECHNIQUE
short: Cache Headers
scene: s3-headers
callout:
  kind: technique
  title: Phân biệt rạch ròi tài nguyên công khai và riêng tư
  vi: "CDN quyết định có được phép lưu và lưu trong bao lâu hoàn toàn dựa vào header Cache-Control do Origin trả về."
whatChanged:
  - "+ Thiết lập quy tắc Cache-Control cho từng loại tài nguyên"
  - "~ Tài nguyên tĩnh dùng public, trang cá nhân dùng private"
telemetry:
  - label: "Tài nguyên tĩnh"
    value: "public, immutable"
    tone: ok
  - label: "Dữ liệu riêng tư"
    value: "private / no-store"
    tone: warn
```

Hành vi lưu trữ của trình duyệt và CDN được điều khiển thông qua header `Cache-Control`:

- `public, max-age=31536000, immutable`: cho phép mọi bộ nhớ đệm công khai (CDN và trình duyệt) lưu giữ suốt 1 năm mà không cần hỏi lại Origin.
- `public, max-age=300, s-maxage=600`: trình duyệt giữ 5 phút, còn CDN Edge giữ 10 phút (`s-maxage` ghi đè riêng cho bộ nhớ đệm dùng chung).
- `private, max-age=0, must-revalidate`: chỉ trình duyệt của người dùng được lưu, tuyệt đối không lưu trên CDN Edge dùng chung.
- `no-store`: cấm lưu trữ ở bất kỳ đâu, dùng cho dữ liệu nhạy cảm như giao dịch ngân hàng.

## 4. Làm mới nội dung ở Edge bằng Versioned URL

```step
category: TECHNIQUE
short: Versioned URL
scene: s4-versioning
callout:
  kind: key-idea
  title: Đổi tên file theo mã băm thay vì gọi Purge API
  vi: "Gắn mã băm nội dung vào tên file biến mọi lần cập nhật thành một URL mới tinh, giúp Edge nạp bản mới tức thì."
whatChanged:
  - "~ Thay đường dẫn tĩnh cố định bằng URL chứa mã băm phiên bản"
  - "~ Tránh độ trễ lan truyền và giới hạn tần suất của Purge API"
telemetry:
  - label: "Cơ chế"
    value: "app.abc123.js"
    tone: ok
  - label: "Cần Purge?"
    value: "Không"
    tone: ok
```

Khi cập nhật logo hoặc file JavaScript trên Origin, nếu giữ nguyên URL cũ như `/app.js`, các điểm Edge vẫn tiếp tục phục vụ bản cũ cho tới khi hết `max-age`. Gọi Purge API để xóa thủ công trên hàng trăm Edge POP thường mất thời gian lan truyền và bị giới hạn số lần gọi.

Thực hành chuẩn cho tài nguyên tĩnh là **gắn mã băm nội dung vào URL** (ví dụ `app.8f3a1c.js`). Mỗi khi mã nguồn thay đổi, trình đóng gói tạo ra URL mới. Trang HTML trỏ sang URL mới nên trình duyệt và Edge lập tức tải bản mới, trong khi bản cũ vẫn có thể cache dài hạn với cờ `immutable`.

## 5. Mô phỏng Edge nguội lúc khởi động và Spike 9.000 req/s

```step
category: PROBLEM
short: Edge nguội
scene: s5-edge-live
live: edge-offload
activity: S4-03.A1
gate: optional
callout:
  kind: watch-out
  title: Edge nguội ban đầu đẩy tải lớn về Origin
  vi: "Khi Edge mới bật hoặc vừa bị xóa sạch, các lượt đọc đầu tiên đều bị miss. Origin Shield ở giữa giúp gộp các lượt miss trùng lặp."
whatChanged:
  - "~ Edge khởi động nguội (warm = 0) trong 15 giây đầu ở tải 3.000 req/s"
  - "~ Giây 25..50: Spike 9.000 req/s đổ vào sau khi Edge đã ấm"
telemetry:
  - label: "Tải nền / Đỉnh"
    value: "3.000 / 9.000 req/s"
  - label: "Origin Shield"
    value: "Đang bật"
    tone: ok
```

Trong kịch bản mô phỏng trực tiếp, cụm **CDN Edge** bắt đầu ở trạng thái nguội (`warm = 0`) và mất 15 giây để làm ấm dần với tải nền 3.000 req/s. Sau đó vào giây thứ 25, lưu lượng tăng đột biến gấp 3 lần lên 9.000 req/s.

Quan sát vai trò của **Origin Shield** đặt trước Origin Server: khi nhiều Edge POP cùng bị miss một khóa lúc còn nguội, Origin Shield gom các yêu cầu trùng lặp lại để Origin chỉ phải xử lý một lần cho mỗi tài nguyên.

## 6. Trang cá nhân hóa, Origin Shield và Edge Computing

```step
category: PITFALL
short: Trang cá nhân
scene: s6-private
activity: S4-03.A2
gate: required
callout:
  kind: watch-out
  title: Không bao giờ cache trang cá nhân dùng chung ở Edge
  vi: "Đặt Cache-Control: public cho trang hồ sơ hay giỏ hàng sẽ khiến người dùng sau nhìn thấy dữ liệu của người dùng trước."
whatChanged:
  - "~ Trang cá nhân gắn Cache-Control: private để đi thẳng qua Edge"
  - "+ Tận dụng Edge Computing cho xác thực JWT hoặc định tuyến A/B ở biên"
telemetry:
  - label: "Trang riêng tư"
    value: "Cache-Control: private"
    tone: bad
  - label: "Logic ở biên"
    value: "Edge Workers"
    tone: ok
```

Với các trang động hoặc cá nhân hóa theo từng tài khoản, bắt buộc phải trả về `Cache-Control: private` (hoặc tách phần khung HTML tĩnh để cache ở Edge rồi tải phần dữ liệu riêng qua API).

Ngoài lưu trữ, nền tảng CDN hiện đại còn hỗ trợ **Edge Computing** — chạy các đoạn mã nhẹ ngay tại Edge POP (như kiểm tra chữ ký JWT, chặn request không hợp lệ, hoặc phân nhóm A/B testing) để giảm tải cho Origin mà vẫn giữ độ trễ cực thấp.

## 7. Tổng kết: kiến trúc phân phối nội dung toàn cầu

```step
category: RECAP
short: Tóm tắt
scene: s7-recap
callout:
  kind: key-idea
  title: Bốn trụ cột của CDN và Edge
  vi: "Đưa nội dung tĩnh ra Edge, gom miss bằng Origin Shield, cập nhật bằng Versioned URL và bảo vệ trang riêng tư bằng Cache-Control: private."
whatChanged:
  - "+ Hoàn thành mô hình User → CDN Edge → Origin Shield → Origin"
telemetry:
  - label: "Giảm tải Origin"
    value: "90%+"
    tone: ok
  - label: "Cập nhật tĩnh"
    value: "Versioned URL"
    tone: ok
```

Khi thiết kế hệ thống phục vụ người dùng toàn cầu, CDN là lớp đệm đầu tiên giúp giảm độ trễ địa lý và bảo vệ trung tâm dữ liệu gốc trước các đợt tăng tải đột biến. Hãy kết hợp Edge caching với Origin Shield, dùng tên file gắn mã băm cho tài nguyên tĩnh và kiểm soát chặt chẽ `Cache-Control: private` cho nội dung cá nhân.
