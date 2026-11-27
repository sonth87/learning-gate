## 1. Vì sao không tồn tại giải pháp kiến trúc hoàn hảo?

```step
category: SETUP
short: Luôn đánh đổi
scene: s1-axes
callout:
  kind: key-idea
  title: Bản chất của quyết định kiến trúc
  vi: "Không có giải pháp nào tối ưu đồng thời mọi tiêu chí. Mỗi lựa chọn kỹ thuật đều mua một lợi ích bằng cách chấp nhận một chi phí tương ứng."
whatChanged:
  - "+ Xác định 4 trục đối lập thường xuyên xuất hiện trong thiết kế hệ thống"
  - "~ Bỏ kỳ vọng tìm kiếm một kiến trúc không có nhược điểm"
telemetry:
  - label: "Số phương án hoàn hảo"
    value: "0"
  - label: "Trọng tâm quyết định"
    value: "Đánh đổi có chủ đích"
    tone: ok
```

**Đánh đổi kiến trúc (Trade-off)** là việc chấp nhận giảm nhẹ một thuộc tính hoặc chịu thêm một loại chi phí để đạt được thuộc tính quan trọng hơn đối với bài toán hiện tại.

Trong môi trường thực tế, các mục tiêu kỹ thuật thường kéo ngược chiều nhau:

- **Hiệu năng (Performance) và Tính nhất quán (Consistency):** Muốn trả lời cực nhanh từ bộ nhớ đệm gần người dùng thì phải chấp nhận dữ liệu có thể trễ vài giây so với bản gốc.
- **Khả năng mở rộng (Scalability) và Độ đơn giản (Simplicity):** Tách nhỏ dịch vụ và phân mảnh dữ liệu giúp chịu tải lớn nhưng làm việc triển khai, theo dõi và gỡ lỗi phức tạp hơn.
- **Chi phí (Cost) và Độ tin cậy (Reliability):** Duy trì cụm dự phòng đa vùng giúp giảm thời gian gián đoạn nhưng làm tăng hoá đơn hạ tầng hằng tháng.

Bạn có thể hình dung việc thiết kế giống như phân bổ một tấm chăn có diện tích cố định: kéo phủ kín phía này thì phía đối diện phải hở ra, nên điều quan trọng là xác định đúng phần nào cần ưu tiên giữ ấm.

## 2. Không có Best Practice tách rời khỏi bối cảnh

```step
category: PROBLEM
short: Tuỳ bối cảnh
scene: s2-context
callout:
  kind: watch-out
  title: Bối cảnh quyết định đúng sai
  vi: "Một mẫu kiến trúc phát huy hiệu quả cao ở bối cảnh này có thể trở thành lựa chọn gây hại ở bối cảnh khác nếu khác quy mô, dữ liệu và đội ngũ."
whatChanged:
  - "+ Đặt Monolith vs Microservices và SQL vs NoSQL vào từng bối cảnh cụ thể"
  - "~ Thay câu hỏi cái nào tốt hơn bằng cái nào khớp ràng buộc hiện tại"
telemetry:
  - label: "Giao dịch tài chính"
    value: "Ưu tiên ACID (SQL)"
    tone: ok
  - label: "Nhóm 5 kỹ sư"
    value: "Ưu tiên Monolith"
    tone: ok
```

Nhận định tuyệt đối như *Microservices luôn tốt hơn Monolith* hay *NoSQL hiện đại hơn SQL* đều thiếu phần điều kiện đi kèm.

Hãy đối chiếu hai trường hợp cụ thể:

| Lựa chọn | Lợi ích đạt được (Gains) | Chi phí phải trả (Costs) | Bối cảnh phù hợp |
|---|---|---|---|
| **Monolith** | Triển khai 1 khối, giao dịch chung 1 Database, không tốn độ trễ mạng nội bộ | Khó mở rộng riêng từng phần, nhiều nhóm dễ đụng độ trên cùng kho mã | Nhóm nhỏ, cần ra mắt nhanh, tải vừa phải |
| **Microservices** | Mở rộng và phát hành độc lập từng dịch vụ, cô lập lỗi tốt | Tăng độ trễ mạng, khó đảm bảo nhất quán xuyên dịch vụ, vận hành nặng | Hàng chục nhóm độc lập, lưu lượng lớn không đồng đều |

Tương tự, cơ sở dữ liệu NoSQL phù hợp cho luồng bài đăng phi cấu trúc quy mô lớn, nhưng lại không phù hợp cho sổ cái thanh toán đòi hỏi giao dịch **ACID** chặt chẽ. Bối cảnh thay đổi thì phương án thắng cuộc thay đổi theo.

## 3. Khung lập Ma trận đánh đổi (Trade-off Matrix) 3 bước

```step
category: TECHNIQUE
short: Ma trận so sánh
scene: s3-matrix
activity: S0-02.A1
gate: optional
callout:
  kind: technique
  title: Đổi ưu tiên thì đổi kết quả
  vi: "Cùng hai ứng viên PostgreSQL và MongoDB, việc xếp hạng lại 3 ưu tiên hàng đầu của dự án sẽ đảo chiều phương án được chọn."
whatChanged:
  - "+ Chuẩn hoá 3 bước lập Trade-off Matrix có trọng số ưu tiên"
  - "+ Minh hoạ cách thứ tự ưu tiên quyết định phương án thắng"
telemetry:
  - label: "Bước 1"
    value: "Chốt ràng buộc"
  - label: "Bước 2"
    value: "Ghi rõ Lợi / Hại"
  - label: "Bước 3"
    value: "Khớp thứ tự ưu tiên"
    tone: ok
```

Để tránh tranh luận cảm tính trong nhóm, mọi quyết định kiến trúc lớn nên được trình bày qua **Ma trận đánh đổi** gồm ba bước:

1. **Xác định ràng buộc hiện tại (Constraints):** Ghi rõ quy mô người dùng hiện tại, tốc độ tăng trưởng, mục tiêu độ trễ, ngân sách, thời hạn ra mắt và công nghệ đội ngũ đã thành thạo.
2. **Liệt kê tường minh Lợi ích và Chi phí (Gains & Costs):** Viết song song mặt được và mặt mất của từng phương án. Ví dụ với **PostgreSQL**: được giao dịch ACID, truy vấn `JOIN` mạnh, nhóm đã quen dùng; mất ở chỗ mở rộng ngang tự động khó hơn và đổi lược đồ bảng lớn tốn công. Với **MongoDB**: được lược đồ linh hoạt và phân mảnh ngang thuận lợi; mất ở chỗ không hỗ trợ `JOIN` chuẩn và nhóm tốn thời gian học mới.
3. **Đối chiếu với thứ tự ưu tiên (Align Priorities):** Nếu ưu tiên số 1 là ra mắt MVP trong 2 tháng với dữ liệu đơn hàng cần toàn vẹn cao, PostgreSQL thắng rõ ràng. Nếu sản phẩm đã đạt 100 triệu người dùng với dữ liệu phi cấu trúc tăng nhanh, trọng số nghiêng về khả năng phân mảnh ngang.

## 4. Nghiên cứu tình huống A/B: khi nào thêm Cache, khi nào bỏ qua?

```step
category: MECHANISM
short: Có nên Cache?
scene: s4-cache-ab
callout:
  kind: compare
  title: Cache không miễn phí
  vi: "Cache đổi rủi ro dữ liệu trễ (Stale Data) và độ phức tạp xoá đệm lấy độ trễ đọc thấp và mức tải Database nhẹ hơn."
whatChanged:
  - "+ So sánh trực tiếp đường đi không Cache và đường đi qua Redis trên trang sản phẩm"
  - "~ Chỉ rõ điều kiện lưu lượng khiến phương án không Cache tốt hơn"
telemetry:
  - label: "Tải nhỏ (100 req/s)"
    value: "Đọc thẳng DB (đơn giản)"
    tone: ok
  - label: "Tải lớn (> 3.000 req/s)"
    value: "Cần Cache chắn DB"
    tone: warn
```

Quyết định có đặt Cache trước Database trên trang chi tiết sản phẩm thương mại điện tử hay không là ví dụ điển hình của tư duy đánh đổi.

- **Phương án A — Không dùng Cache:** Mọi request đọc thẳng Database. Lợi ích là giá bán và tồn kho luôn chính xác tuyệt đối, mã nguồn đơn giản vì không cần xử lý xoá đệm (Cache Invalidation), không tốn tiền thuê cụm RAM. Chi phí là độ trễ cao hơn và Database phải gánh toàn bộ lưu lượng đọc.
- **Phương án B — Dùng Cache (Redis):** Ứng dụng kiểm tra RAM trước, chỉ truy vấn Database khi Cache Miss. Lợi ích là phản hồi trong vài mili-giây và giảm mạnh tải đọc xuống Database. Chi phí là người mua có thể thấy mặt hàng vừa hết kho vẫn còn hàng trong vài chục giây hết hạn TTL, kèm thêm rủi ro **Cache Stampede** nếu hàng loạt khoá hết hạn cùng lúc mà thiếu độ lệch ngẫu nhiên (`TTL Jitter`).

Ở mức 100 req/s với kho hàng ít sản phẩm, Phương án A vượt trội nhờ tính chính xác và đơn giản. Ở mức hàng nghìn req/s, Database chạm trần năng lực nên bắt buộc chuyển sang Phương án B kèm cấu hình TTL hợp lý.

## 5. Ba cặp đánh đổi kỹ thuật mọi kiến trúc sư thường gặp

```step
category: MECHANISM
short: 3 cặp phổ biến
scene: s5-pairs
callout:
  kind: good-to-know
  title: Tách theo từng tính năng
  vi: "Trong cùng một ứng dụng, luồng thanh toán cần CP và đồng bộ, nhưng luồng đếm lượt thích hay xử lý video nên chọn AP và bất đồng bộ."
whatChanged:
  - "+ Tổng hợp quy tắc chọn cho CAP, Chuẩn hoá dữ liệu và Sync/Async"
  - "~ Áp dụng đánh đổi ở cấp từng luồng nghiệp vụ thay vì áp cứng toàn hệ thống"
telemetry:
  - label: "Thanh toán / Kho"
    value: "CP · Chuẩn hoá · Sync"
    tone: ok
  - label: "Bảng tin / Xử lý video"
    value: "AP · Phi chuẩn hoá · Async"
    tone: ok
```

Ba cặp đánh đổi xuất hiện lặp đi lặp lại ở hầu hết hệ thống phân tán:

1. **Tính nhất quán và Tính sẵn sàng (Consistency vs Availability — CAP):** Khi mạng phân tách, hệ thống thanh toán và trừ tồn kho phải chọn **CP** (thà từ chối tạm thời còn hơn ghi sai số dư); ngược lại bảng tin mạng xã hội hay gợi ý sản phẩm chọn **AP** (luôn phản hồi nhanh, chấp nhận nhất quán cuối cùng sau vài giây).
2. **Chuẩn hoá và Phi chuẩn hoá (Normalization vs Denormalization):** Tách bảng chuẩn 3NF tránh trùng lặp và giữ toàn vẹn khi ghi nhiều, nhưng tốn phép `JOIN` khi đọc. Lưu sẵn cột `like_count` ngay trong bảng `posts` giúp đọc một bảng cực nhanh khi tỉ lệ đọc chiếm 99%, đổi lại phải đồng bộ số đếm mỗi khi có lượt thích mới.
3. **Đồng bộ và Bất đồng bộ (Sync vs Async):** Xử lý chuyển mã video đồng bộ bắt người dùng chờ 36 giây trên một kết nối HTTP dễ quá hạn; đẩy việc nặng vào hàng đợi (Queue) trả phản hồi sau 2 giây nhưng đòi hỏi thêm worker nền và cơ chế thử lại khi lỗi.

```python
# Bất đồng bộ: tách phần lưu nhanh (2 s) khỏi phần xử lý nặng (34 s)
def upload_video(video_file) -> dict:
    video_id = storage.save_raw(video_file)          # ~2 s
    queue.publish("process_video", {"id": video_id}) # Đẩy vào hàng đợi nền
    return {"status": "processing", "id": video_id}  # Trả kết quả sớm cho người dùng
```

## 6. Nguyên tắc Đủ tốt (Good Enough) và lợi suất giảm dần khi tối ưu

```step
category: PITFALL
short: Mức đủ tốt
scene: s6-goodenough
callout:
  kind: watch-out
  title: Biết điểm dừng tối ưu
  vi: "Tốn hai tuần giảm độ trễ từ 50 ms xuống 20 ms hầu như không tạo khác biệt cảm nhận cho người dùng nhưng làm chậm các tính năng cốt lõi khác."
whatChanged:
  - "+ Phân tích đường cong công sức và hiệu quả (quy luật 80/20)"
  - "+ Thiết lập điều kiện dừng tối ưu dựa trên mục tiêu SLO"
telemetry:
  - label: "Thêm Index (2 giờ)"
    value: "800 ms → 300 ms (−62%)"
    tone: ok
  - label: "Đổi sang Cassandra (2 tháng)"
    value: "150 ms → 100 ms"
    tone: bad
```

Một kỹ năng thiết yếu trong đánh đổi là nhận biết **lợi suất giảm dần (Diminishing Returns)** để dừng tối ưu đúng lúc.

Xét bài toán giảm thời gian phản hồi API từ `800 ms` xuống mục tiêu `< 200 ms`:

- **Bước 1 — Bổ sung chỉ mục Database:** Tốn 2 giờ làm việc, độ trễ giảm từ `800 ms` xuống `300 ms` (cải thiện khoảng 62%).
- **Bước 2 — Đặt thêm tầng Redis Cache:** Tốn 1 tuần triển khai và kiểm thử, độ trễ giảm từ `300 ms` xuống `150 ms` — **đã đạt mục tiêu `< 200 ms`**.
- **Bước 3 — Chuyển đổi sang cơ sở dữ liệu phân tán khác và viết lại toàn bộ truy vấn:** Tốn 2 tháng nhân sự chỉ để rút từ `150 ms` xuống `100 ms`.

Dừng lại ở Bước 2 là quyết định kỹ thuật hợp lý. Ngưỡng cảm nhận phản hồi tức thời của con người vào khoảng `100 ms`; đầu tư thêm hai tháng cho vài chục mili-giây cuối cùng mang lại tỷ suất hoàn vốn (ROI) rất thấp.

## 7. Ba mô hình ra quyết định và bài tập cân bằng danh mục sản phẩm

```step
category: TECHNIQUE
short: 3 mô hình chọn
scene: s7-models
activity: S0-02.A2
gate: required
callout:
  kind: key-idea
  title: Cửa một chiều và cửa hai chiều
  vi: "Quyết định dễ đảo ngược thì chọn nhanh để thử nghiệm; quyết định khó đảo ngược thì phải phân tích kỹ ràng buộc và chi phí dài hạn."
whatChanged:
  - "+ Áp dụng Reversibility, Impact vs Effort và Regret Minimization"
  - "+ Thực hành cân bằng chi phí, độ trễ và TTL Jitter cho danh mục sản phẩm"
telemetry:
  - label: "Tải thường / Đỉnh"
    value: "3.200 / 4.200 req/s"
  - label: "Ngân sách tối đa"
    value: "≤ 1,30 USD/giờ"
    tone: warn
  - label: "Yêu cầu cấu trúc"
    value: "Có TTL Jitter ≥ 10%"
    tone: ok
```

Khi đứng trước nhiều lựa chọn, ba mô hình tư duy sau giúp chốt quyết định nhanh và an toàn:

1. **Khả năng đảo ngược (Reversibility):** Chọn thư viện ORM hay đổi giữa Redis và Memcached là quyết định dễ đảo ngược, nên chọn nhanh. Chọn loại Database chính hoặc tách Monolith sang Microservices có chi phí quay lui rất đắt, cần cân nhắc kỹ.
2. **Tác động so với Công sức (Impact vs Effort):** Ưu tiên làm ngay việc tác động cao – công sức thấp (như tạo chỉ mục thiếu); lên kế hoạch kỹ cho việc tác động cao – công sức lớn; loại bỏ việc tác động thấp – công sức cao (như tự viết lại hệ thống xác thực chuẩn).
3. **Giảm thiểu hối tiếc (Regret Minimization):** Với sản phẩm cần chạy ổn định sớm, ưu tiên ngăn xếp công nghệ trưởng thành mà nhóm nắm vững thay vì công nghệ mới chưa ổn định hệ sinh thái.

Trong bài tập bên dưới, dịch vụ Danh mục sản phẩm phục vụ `3.200 req/s` lúc bình thường và tăng lên `4.200 req/s` giờ cao điểm (92% đọc trên 80.000 sản phẩm). Hãy cân đối số instance `Catalog API`, dung lượng `Product Cache` và độ lệch `TTL Jitter` để đạt SLO ở cả hai mức tải mà vẫn giữ chi phí dưới `1,30 USD/giờ`.

## 8. Tóm tắt: tư duy theo sự đánh đổi có điều kiện

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Ba câu hỏi phản xạ
  vi: "Mỗi khi định nói giải pháp này là tốt nhất, hãy dừng lại hỏi: Tốt nhất cho ai, trong bối cảnh nào, và mình đang đánh đổi điều gì?"
whatChanged:
  - "+ Củng cố quy trình 5 bước ra quyết định kiến trúc dựa trên đánh đổi"
telemetry:
  - label: "Nguyên lý nền"
    value: "Chỉ có đánh đổi"
    tone: ok
  - label: "Đích hướng tới"
    value: "Đủ tốt & Vận hành bền"
    tone: ok
```

Tư duy **Trade-off** thay thế câu hỏi đi tìm giải pháp hoàn hảo bằng một quy trình năm bước rõ ràng:

1. **Làm rõ bối cảnh:** Nắm chắc lưu lượng, đặc thù dữ liệu, ngân sách và năng lực đội ngũ hiện tại.
2. **Viết tường minh mặt được và mặt mất:** Không giấu chi phí vận hành, độ trễ hay rủi ro lệch dữ liệu của phương án mình thích.
3. **Xếp hạng ưu tiên:** Đặt trọng số cho từng tiêu chí để biết thuộc tính nào không được phép thoả hiệp.
4. **Chọn mức đủ tốt có ROI cao:** Dừng tối ưu khi đã đạt SLO thay vì theo đuổi sự hoàn mỹ tốn kém.
5. **Chủ động quản lý hệ quả:** Khi đã chấp nhận dùng Cache để lấy tốc độ, chủ động thiết kế TTL và Jitter để kiểm soát mặt trái của lựa chọn đó.
