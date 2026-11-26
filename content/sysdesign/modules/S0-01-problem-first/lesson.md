## 1. Phản xạ chọn công cụ trước (Solution-first) và hệ quả trong thiết kế hệ thống

```step
category: SETUP
short: Chọn công cụ
scene: s1-reflex
callout:
  kind: key-idea
  title: Nguyên tắc cốt lõi
  vi: "Công nghệ chỉ là phương tiện. Một quyết định kiến trúc đúng luôn bắt đầu từ việc định nghĩa bài toán cần giải quyết, không bắt đầu từ tên công cụ."
whatChanged:
  - "+ Nhận diện phản xạ ghép thẳng triệu chứng với công cụ quen thuộc"
  - "~ Dựng thêm thành phần mới khi chưa đo nguyên nhân gốc không giúp hết nghẽn"
telemetry:
  - label: "Phản xạ quen thuộc"
    value: "Thấy chậm → Redis"
    tone: warn
  - label: "Bước bị bỏ qua"
    value: "Đo nguyên nhân gốc"
    tone: bad
```

**Tư duy chọn công cụ trước (Code-first / Solution-first)** là phản xạ nhảy thẳng vào giải pháp kỹ thuật quen thuộc ngay khi vừa nghe tên yêu cầu: nghe dữ liệu đọc nhanh liền chọn Redis, nghe xử lý nền liền dựng Kafka, nghe mở rộng liền tách Microservices trên Kubernetes.

Trong lập trình hằng ngày, phản xạ này giúp viết mã nhanh cho các tác vụ nhỏ đã rõ đầu vào. Nhưng ở cấp độ kiến trúc hệ thống, chọn công cụ trước khi hiểu bài toán dẫn tới hai rủi ro trực tiếp: giải quyết sai chỗ đang chậm, và gánh thêm chi phí vận hành của một thành phần mới mà hệ thống chưa thực sự cần.

Khi được hỏi vì sao chọn một công nghệ, câu trả lời kiểu công nghệ đó nhanh chưa đủ cơ sở kỹ thuật. Kiến trúc sư cần trả lời ba ý: nhanh hơn phương án nào, giải quyết giới hạn cụ thể nào, và đổi lại hệ thống phải chịu chi phí gì. Bạn có thể hình dung việc này giống như kê đơn trước khi xét nghiệm triệu chứng.

## 2. Năm câu hỏi bị bỏ sót khi nhảy thẳng vào giải pháp

```step
category: PROBLEM
short: 5 câu bỏ sót
scene: s2-questions
callout:
  kind: watch-out
  title: Không đoán điểm chậm
  vi: "Nhận xét trang web bị chậm không phải là một định nghĩa bài toán. Bài toán chỉ rõ ràng khi biết chậm ở đâu, chậm khi nào và mục tiêu là bao nhiêu mili-giây."
whatChanged:
  - "+ Bổ sung 5 câu hỏi làm rõ triệu chứng trước khi đề xuất Cache"
  - "~ Phân biệt mô tả mơ hồ với yêu cầu đo lường được"
telemetry:
  - label: "Mô tả mơ hồ"
    value: "Trang web chậm"
    tone: bad
  - label: "Định lượng rõ"
    value: "p95 = 3 s, đích < 1 s"
    tone: ok
```

Hãy xét tình huống phổ biến: nhóm nhận phản hồi rằng trang chủ phản hồi chậm, và một lập trình viên đề xuất thêm tầng Cache bằng Redis ngay trong ngày. Chuỗi suy luận này bỏ sót năm câu hỏi nền tảng:

1. **Chậm ở chặng nào?** Thời gian nằm ở truy vấn Database, mạng đường trục hay lời gọi API bên thứ ba?
2. **Chậm vào thời điểm nào?** Xảy ra liên tục cả ngày hay chỉ xuất hiện vào khung giờ cao điểm?
3. **Mức độ chậm là bao nhiêu?** Độ trễ hiện tại là 150 ms hay 3.000 ms, và ngưỡng chấp nhận của người dùng là bao nhiêu?
4. **Cache có giải quyết đúng nguyên nhân không?** Nếu dữ liệu thay đổi liên tục hoặc cá nhân hoá theo từng người dùng, tỉ lệ Cache Hit sẽ rất thấp.
5. **Chi phí mới phát sinh là gì?** Tốn thêm bao nhiêu RAM, ai xử lý lỗi dữ liệu cũ (Stale Data) khi bản ghi gốc thay đổi?

Bỏ qua năm câu hỏi này khiến nhóm dễ triển khai xong cụm Cache mà độ trễ thực tế hầu như không giảm.

## 3. Sai lầm thiết kế quá mức: áp dụng kiến trúc của tập đoàn lớn cho sản phẩm mới

```step
category: PITFALL
short: Làm quá mức
scene: s3-overeng
callout:
  kind: compare
  title: Khác quy mô thì khác bài toán
  vi: "Kiến trúc giải quyết bài toán của hàng trăm nhóm kỹ sư sẽ trở thành gánh nặng vận hành nếu áp vào một nhóm nhỏ đang thử nghiệm sản phẩm."
whatChanged:
  - "+ Đối chiếu chi phí vận hành Microservices sớm với Monolith gọn"
  - "~ Sao chép công nghệ của công ty lớn nhưng không có cùng bài toán"
telemetry:
  - label: "Quy mô ban đầu"
    value: "Chưa có tải lớn"
    tone: default
  - label: "Hậu quả tách 15 dịch vụ"
    value: "Triển khai 2 giờ"
    tone: bad
```

Một biểu hiện điển hình khác của tư duy chọn công nghệ trước là sao chép kiến trúc của các công ty công nghệ lớn bất chấp bối cảnh hiện tại.

Tình huống thực tế: một nhóm khởi nghiệp chưa có người dùng thực tế quyết định tách hệ thống thành 15 Microservices ngay từ tháng đầu tiên vì thấy các nền tảng phát trực tuyến lớn dùng mô hình này. Sau sáu tháng vận hành:

- Mỗi lần phát hành tính năng nhỏ mất khoảng 2 giờ để phối hợp triển khai giữa các dịch vụ.
- Khi phát sinh lỗi, nhóm tốn nhiều giờ lần theo chuỗi lời gọi qua mạng để tìm dịch vụ gây lỗi.
- Khối lượng vận hành vượt xa năng lực của đội ngũ nhỏ, làm chậm tiến độ ra mắt sản phẩm.

Các tập đoàn lớn dùng Microservices để giải quyết bài toán hàng trăm nhóm kỹ sư làm việc độc lập trên lưu lượng hàng triệu request mỗi giây. Khi sản phẩm mới chỉ cần kiểm chứng thị trường nhanh, một khối **Monolith** có cấu trúc mô-đun rõ ràng giải quyết đúng bài toán với chi phí thấp hơn nhiều.

## 4. Quy trình Problem-first: đo lường, truy nguyên nhân, so sánh và chọn phương án

```step
category: MECHANISM
short: 4 bước xử lý
scene: s4-process
callout:
  kind: technique
  title: Đo rồi mới quyết định
  vi: "Thay vì chọn ngay một công cụ duy nhất, hãy liệt kê các lựa chọn khả thi và bắt đầu từ phương án đơn giản nhất giải quyết đúng nguyên nhân gốc."
whatChanged:
  - "+ Thiết lập quy trình 4 bước của tư duy Problem-first"
  - "~ Bắt đầu bằng thêm Index đơn giản thay vì dựng cụm Cache phức tạp"
telemetry:
  - label: "Thời gian ở DB"
    value: "80% tổng độ trễ"
    tone: warn
  - label: "Bước khởi đầu"
    value: "Tạo Index cột lọc"
    tone: ok
```

Cùng bài toán trang web phản hồi chậm, quy trình **Problem-first** đi qua bốn bước tuần tự thay vì đoán công cụ:

1. **Định lượng vấn đề (Define & Measure):** Đo thời gian từng chặng và xác định 80% tổng độ trễ nằm ở Database, trong đó 3 câu truy vấn chậm nhất chiếm 90% tải.
2. **Tìm nguyên nhân gốc (Understand Why):** Kiểm tra kế hoạch thực thi truy vấn và thấy bảng đang bị quét tuần tự toàn bộ do thiếu chỉ mục (Index) phù hợp với mẫu lọc thực tế.
3. **Đánh giá các phương án (Evaluate Options):**
   - *Phương án A:* Tạo chỉ mục đúng cột truy vấn — thao tác nhanh, rủi ro thấp, không thêm hạ tầng.
   - *Phương án B:* Dựng tầng Cache lưu kết quả — giảm tải đọc nhưng tăng độ phức tạp xoá đệm.
   - *Phương án C:* Thiết kế lại lược đồ bảng — triệt để nhưng tốn nhiều thời gian chuyển đổi.
4. **Chọn và kiểm chứng lại (Choose & Verify):** Thực hiện Phương án A trước, đo lại độ trễ; chỉ bổ sung Phương án B nếu tải đọc sau đó vẫn vượt ngưỡng.

## 5. Khung 5 câu hỏi kiểm chứng trước mọi quyết định kỹ thuật

```step
category: TECHNIQUE
short: 5 câu kiểm tra
scene: s5-fiveq
callout:
  kind: key-idea
  title: Hỏi Why tối thiểu ba lần
  vi: "Triệu chứng đầu tiên hiếm khi là nguyên nhân gốc. Hỏi liên tiếp tại sao ít nhất ba tầng giúp chạm tới đúng điểm cần sửa."
whatChanged:
  - "+ Áp dụng chuỗi 3 lần hỏi Why để bóc tách nguyên nhân gốc"
  - "+ Chuẩn hoá 5 câu hỏi tự kiểm tra trước khi thêm hạ tầng"
telemetry:
  - label: "Số tầng hỏi Why"
    value: "≥ 3 tầng"
    tone: ok
  - label: "Ưu tiên thiết kế"
    value: "Đơn giản trước"
    tone: ok
```

Trước khi đưa bất kỳ công nghệ mới nào vào bản thiết kế, hãy kiểm tra lần lượt năm câu hỏi:

1. **Bài toán thực sự là gì?** Diễn đạt bằng con số hiện tại và ngưỡng mục tiêu (ví dụ: thời gian tải trang chủ đang là 3.000 ms, cần đưa về dưới 1.000 ms).
2. **Tại sao vấn đề này xảy ra?** Đào sâu ít nhất ba tầng *Why*: Trang phản hồi chậm → vì truy vấn Database lâu → vì quét toàn bộ bảng `users` → vì cột `email` chưa có chỉ mục.
3. **Giải pháp này tác động lên đại lượng nào?** Nêu rõ cơ chế định lượng, ví dụ giảm tải truy vấn xuống Database từ 1.000 req/s còn 100 req/s nhờ Cache.
4. **Chi phí đi kèm là gì?** Tính đủ chi phí máy chủ, độ trễ mạng phát sinh, rủi ro lệch dữ liệu và công sức bảo trì của nhóm.
5. **Có phương án nào đơn giản hơn không?** Luôn xét việc thêm chỉ mục trước khi thêm Redis, và tối ưu Monolith trước khi tách dịch vụ.

## 6. Ví dụ đối chiếu: thiết kế tính năng đếm lượt xem video

```step
category: REAL_CODE
short: Đếm lượt xem
scene: s6-viewcount
callout:
  kind: compare
  title: Khác biệt sau 1 tháng vận hành
  vi: "Cách tiếp cận Code-first chạy được ngay trong bản thử nghiệm nhưng mất dữ liệu khi khởi động lại RAM; Problem-first làm rõ yêu cầu độ bền và lịch sử ngay từ đầu."
whatChanged:
  - "+ So sánh bộ đếm chỉ lưu trên Redis với kiến trúc kết hợp Cache và Database"
  - "~ Lộ rõ các ràng buộc về độ bền, thống kê theo thời gian và chống spam"
telemetry:
  - label: "Sai lệch chấp nhận"
    value: "1–2% (vài giây)"
    tone: ok
  - label: "Nguồn sự thật"
    value: "Database bền vững"
    tone: ok
```

Xét yêu cầu thiết kế bộ đếm lượt xem cho nền tảng video để thấy rõ hai hướng tư duy.

Với hướng **Code-first**, lập trình viên gọi thẳng `redis.incr("video:123:views")` ở mỗi lượt xem và đọc trực tiếp khoá đó để hiển thị. Thiết kế này viết xong rất nhanh nhưng bộc lộ bốn lỗ hổng khi chạy thật: khởi động lại tiến trình RAM làm mất số đếm nếu chưa kịp lưu đĩa; không có dữ liệu lịch sử theo ngày để tính xu hướng thịnh hành; và lưu lượng tự động từ bot dễ làm sai lệch bộ đếm.

```python
# Hướng Problem-first: làm rõ yêu cầu rồi tách đường đọc nhanh và đường ghi bền vững
def record_view(video_id: str, client_ip: str) -> None:
    if not rate_limiter.allow(f"{video_id}:{client_ip}"):
        return
    cache.incr(f"views:delta:{video_id}")  # Gom lượt tăng tạm trong RAM

# Tiến trình định kỳ mỗi 10 giây gom lô đẩy xuống Database bền vững
def flush_deltas_to_db(batch_deltas: dict[str, int]) -> None:
    db.batch_increment_views(batch_deltas)  # Lưu nguồn sự thật + lịch sử ngày
```

Với hướng **Problem-first**, kỹ sư hỏi rõ bốn yêu cầu trước: số lượt xem hiển thị chấp nhận trễ vài giây và lệch 1–2%, nhưng không được mất tổng số đếm và cần thống kê theo khung giờ. Từ đó kiến trúc dùng Database làm nguồn lưu trữ bền vững, gom lô ghi định kỳ để giảm tải ghi, và dùng Cache phục vụ lượt đọc tốc độ cao.

## 7. Thực hành làm rõ ràng buộc và cấu hình hệ thống đếm lượt xem

```step
category: TECHNIQUE
short: Thiết kế đúng
scene: s7-clarify
activity: S0-01.A1
gate: required
callout:
  kind: technique
  title: Ràng buộc định hình cấu hình
  vi: "Khi hỏi đúng câu hỏi về lưu lượng đọc/ghi, SLO độ trễ và ngân sách, bạn biết chính xác tầng nào thiếu năng lực thay vì nâng cấp phần cứng đắt đỏ nhất."
whatChanged:
  - "+ Lộ rõ lưu lượng 2.500 req/s (85% đọc, 15% ghi) và trần chi phí 1,20 USD/giờ"
  - "~ Cấu hình đúng tầng View API và Cache thay vì nâng cấp Database tốn kém"
telemetry:
  - label: "Lưu lượng tổng"
    value: "2.500 req/s"
  - label: "SLO độ trễ p99"
    value: "≤ 100 ms"
    tone: ok
  - label: "Trần ngân sách"
    value: "≤ 1,20 USD/giờ"
    tone: warn
```

Giả sử sau khi đặt các câu hỏi Problem-first cho dịch vụ đếm và hiển thị lượt xem của 60.000 video đang hoạt động, bạn thu được bộ thông số định lượng sau:

- **Lưu lượng ổn định:** 2.500 req/s, trong đó 85% là lượt đọc số xem hiển thị trên trang và 15% là lượt ghi nhận lượt xem mới.
- **Mục tiêu chất lượng (SLO):** Độ trễ `p99 ≤ 100 ms`, tỉ lệ lỗi `≤ 1%`.
- **Ngân sách hạ tầng:** Tối đa `1,20 USD/giờ`, tối đa 2 thay đổi cấu hình.

Trong cấu hình khởi điểm chưa tối ưu: tầng `View API` chỉ có 1 instance (`μ = 1.600 req/s`), `Cache` chỉ cấp chỗ cho 10.000 khoá trên tập 60.000 video đang xem, còn `Database` có năng lực `1.000 req/s` với chi phí nâng cấp máy rất cao. Nếu phản xạ theo lối mòn "hệ thống chậm thì nâng cấp máy Database", cả tầng `View API` vẫn quá tải và ngân sách bị vượt. Hãy phân tích tải ở từng tầng và điều chỉnh đúng thông số trong bài tập bên dưới.

## 8. Tóm tắt: đặt bài toán trước giải pháp

```step
category: RECAP
short: Tóm tắt
scene: s8-recap
callout:
  kind: key-idea
  title: Câu hỏi mở đầu mọi thiết kế
  vi: "Mình đang giải quyết bài toán định lượng nào, nguyên nhân gốc nằm ở đâu, và đây có phải phương án đơn giản nhất đáp ứng ràng buộc hay chưa?"
whatChanged:
  - "+ Tổng kết 4 trụ cột chuyển đổi từ Code-first sang Problem-first"
telemetry:
  - label: "Trọng tâm"
    value: "Fit thay vì Best"
    tone: ok
  - label: "Thứ tự chuẩn"
    value: "Đo → Why → So sánh"
    tone: ok
```

Tư duy **Problem-first** không nằm ở việc thuộc lòng nhiều tên công nghệ mới, mà ở kỷ luật phân tích trước khi chọn giải pháp:

1. **Định nghĩa bài toán bằng số đo:** Thay mô tả cảm tính bằng độ trễ hiện tại, lưu lượng đọc/ghi và mục tiêu cần đạt.
2. **Truy nguyên nhân gốc:** Đặt câu hỏi *Why* liên tiếp dựa trên dữ liệu đo lường thay vì suy đoán.
3. **Đặt lên bàn cân nhiều phương án:** Mọi công cụ đều đi kèm chi phí hạ tầng, độ phức tạp vận hành và các trường hợp biên khi gặp sự cố.
4. **Ưu tiên sự đơn giản:** Giải pháp phù hợp nhất (*fit*) là giải pháp đơn giản nhất thoả mãn đầy đủ yêu cầu thực tế hôm nay.

Ở bài tiếp theo (`S0-02`), chúng ta sẽ đi sâu vào bước thứ ba của quy trình này: cách lập **Ma trận đánh đổi (Trade-off Matrix)** khi không có phương án nào hoàn hảo về mọi mặt.
