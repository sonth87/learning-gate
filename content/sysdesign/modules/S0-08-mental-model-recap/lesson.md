## 1. Bốn lăng kính tư duy giữ vững mọi quyết định kiến trúc

```step
category: SETUP
short: 4 lăng kính
scene: s1-four-shifts
callout:
  kind: key-idea
  title: Công cụ thay đổi liên tục, tư duy nền tảng giữ nguyên giá trị
  vi: "Trước khi đi sâu vào các con số định lượng và từng thành phần hạ tầng ở các chương sau, bài này đúc kết lại 4 chuyển dịch tư duy quan trọng nhất của Phase 0."
whatChanged:
  - "+ Tổng hợp 4 trụ cột tư duy xuyên suốt từ S0-01 đến S0-07"
telemetry:
  - label: "Số trụ cột tư duy"
    value: "4 mindset"
  - label: "Vai trò"
    value: "Kim chỉ nam thiết kế"
    tone: ok
```

Từ `S0-01` đến `S0-07`, chúng ta chưa vội bàn sâu về cấu hình chi tiết của từng phần mềm cụ thể mà tập trung xây dựng cách tiếp cận bài toán. Bạn có thể thuộc lòng hàng chục mẫu kiến trúc, nhưng nếu đặt nhầm bối cảnh hoặc bỏ qua ràng buộc, hệ thống vẫn quá tải hoặc vượt ngân sách.

Toàn bộ Phase 0 hội tụ về **4 chuyển dịch tư duy cốt lõi**:
1. **Không tồn tại giải pháp tốt nhất cho mọi trường hợp** — chỉ có thiết kế khớp nhất với bối cảnh hiện tại.
2. **Luôn hỏi câu hỏi Tại sao** — hiểu lý do gốc thay vì sao chép kiến trúc của nơi khác.
3. **Sự đánh đổi quan trọng hơn tên công nghệ** — ràng buộc quyết định công cụ, không phải chiều ngược lại.
4. **Tư duy toàn hệ thống vượt lên trên tư duy mã nguồn đơn lẻ** — quan tâm tới luồng dữ liệu, độ trễ mạng, điểm hỏng và vận hành.

## 2. Mindset 1 — Không có giải pháp tối ưu tuyệt đối

```step
category: MECHANISM
short: Khớp bối cảnh
scene: s2-no-best
callout:
  kind: compare
  title: Thay câu hỏi Công nghệ nào tốt nhất bằng Bối cảnh này cần gì nhất
  vi: "Khi chấp nhận mọi lựa chọn đều có mặt mạnh và mặt hạn chế, bạn ngừng tìm kiếm sự hoàn hảo trừu tượng để tập trung khớp đúng nhu cầu thực tế."
whatChanged:
  - "+ Minh họa cùng câu hỏi chọn nơi lưu trữ nhưng 3 bối cảnh dẫn tới 3 lựa chọn khác nhau"
telemetry:
  - label: "Câu hỏi sai"
    value: "DB nào mạnh nhất?"
    tone: bad
  - label: "Câu hỏi đúng"
    value: "Khớp ràng buộc nào?"
    tone: ok
```

Khi mới chuyển từ lập trình tính năng sang thiết kế hệ thống, phản xạ tự nhiên là tìm một câu trả lời đúng duy nhất cho mọi dự án. Thực tế kỹ thuật không vận hành như vậy:
- **Sổ cái tài chính cần giao dịch nhiều bảng chặt chẽ:** cơ sở dữ liệu quan hệ (như PostgreSQL) phát huy tối đa thế mạnh toàn vẹn ACID.
- **Lưu mã xác thực tự hết hạn sau 5 phút ở độ trễ dưới 1 ms:** kho khóa-giá trị trên bộ nhớ RAM (như Redis) gọn và hiệu quả hơn hẳn.
- **Thu thập 250.000 bản ghi tọa độ mỗi giây:** động cơ lưu trữ tối ưu ghi tuần tự và phân mảnh ngang mới đáp ứng nổi thông lượng.

Một thiết kế tốt ở quy mô 10 triệu người dùng lại là gánh nặng dư thừa cho một nhóm khởi nghiệp 5.000 người dùng. Bối cảnh thay đổi thì lời giải đúng cũng thay đổi theo.

## 3. Mindset 2 — Luôn hỏi Tại sao bằng chuỗi truy nguyên 5 Whys

```step
category: TECHNIQUE
short: Hỏi 5 Whys
scene: s3-five-whys
callout:
  kind: technique
  title: Đào qua 3–5 tầng Tại sao thường lộ ra giải pháp đơn giản hơn nhiều
  vi: "Đừng thêm thành phần hạ tầng mới chỉ để che lấp một thiếu sót cơ bản ở tầng dữ liệu hoặc truy vấn."
whatChanged:
  - "+ Truy nguyên đề xuất thêm cụm Cache về nguyên nhân gốc là thiếu chỉ mục SQL"
telemetry:
  - label: "Trước khi hỏi"
    value: "+1 cụm máy mới"
    tone: warn
  - label: "Sau 4 câu Tại sao"
    value: "+1 chỉ mục (6 ms)"
    tone: ok
```

Mỗi thành phần mới đưa vào sơ đồ đều mang theo chi phí vận hành, điểm hỏng mới và nguy cơ lệch dữ liệu. Kỹ thuật **5 Whys (hỏi Tại sao liên tiếp)** giúp bạn kiểm chứng xem thành phần đó có thực sự cần thiết hay không:

1. *Đề xuất:* Dựng thêm cụm Redis Cache cho trang danh sách đơn hàng. **Tại sao?**
2. *Trả lời:* Vì API trả kết quả mất 1,8 giây. **Tại sao API chậm?**
3. *Trả lời:* Vì câu truy vấn cơ sở dữ liệu chiếm 1,75 giây. **Tại sao truy vấn lâu?**
4. *Trả lời:* Vì cơ sở dữ liệu phải đọc tuần tự toàn bộ 5 triệu dòng. **Tại sao chưa dùng chỉ mục?**
5. *Trả lời:* Vì cột `user_id` kết hợp `created_at` chưa được tạo chỉ mục khi ra mắt tính năng.

Chỉ cần thêm một chỉ mục ghép đúng thứ tự cột, truy vấn giảm xuống 6 ms mà không phải nuôi thêm cụm Cache hay xử lý bài toán xóa bộ đệm khi đơn hàng đổi trạng thái.

## 4. Mindset 3 — Đánh đổi quan trọng hơn trào lưu công nghệ

```step
category: MECHANISM
short: Ưu tiên đánh đổi
scene: s4-tradeoffs
callout:
  kind: key-idea
  title: Công nghệ chỉ là phương tiện hiện thực hóa sự đánh đổi bạn đã chọn
  vi: "Kiến trúc sư giỏi nêu rõ hệ thống chấp nhận hy sinh điều gì và bảo vệ điều gì trước khi gọi tên bất kỳ phần mềm hay dịch vụ đám mây nào."
whatChanged:
  - "+ Đặt 3 cặp đánh đổi kinh điển làm bộ lọc trước khi chọn công cụ"
telemetry:
  - label: "Bước 1"
    value: "Xếp hạng đánh đổi"
  - label: "Bước 2"
    value: "Chọn công cụ khớp"
    tone: ok
```

Chọn công nghệ vì nó đang phổ biến rồi cố ép vào bài toán sẽ dẫn tới hệ thống cồng kềnh khó bảo trì. Quy trình ngược lại luôn bền vững hơn:
- **Xác định cặp đánh đổi then chốt:** bài toán này cần ưu tiên tính nhất quán tức thời hay độ sẵn sàng cao? Cần độ trễ cực thấp hay tối ưu chi phí hạ tầng? Cần triển khai nhanh bằng dịch vụ quản lý sẵn hay tự vận hành để kiểm soát sâu?
- **Chấp nhận mặt hạn chế một cách có ý thức:** ví dụ chọn bộ nhớ đệm có thời gian sống 60 giây đồng nghĩa chấp nhận người dùng có thể nhìn thấy giá cũ tối đa 60 giây, đổi lại giảm 90% tải đọc cho cơ sở dữ liệu.
- **Chọn công cụ khớp với quyết định đó** và ghi lại lý do để đội ngũ sau này hiểu rõ biên an toàn của hệ thống.

## 5. Mindset 4 — Tư duy toàn hệ thống vượt lên trên tư duy mã nguồn

```step
category: MECHANISM
short: Hệ thống > Code
scene: s5-system-vs-code
callout:
  kind: watch-out
  title: Mã nguồn sạch bên trong một kiến trúc sai vẫn thất bại khi ra thực tế
  vi: "Tối ưu một vòng lặp nhanh thêm 0,2 ms không giải quyết được việc dịch vụ phụ thuộc bị treo 5 giây làm cạn sạch luồng xử lý của toàn cụm."
whatChanged:
  - "+ So sánh phạm vi quan tâm của lập trình viên hàm đơn lẻ với kiến trúc sư hệ thống"
telemetry:
  - label: "Cấp mã nguồn"
    value: "Thuật toán, cấu trúc lớp"
  - label: "Cấp hệ thống"
    value: "Luồng, lỗi, tải, giám sát"
    tone: ok
```

Chất lượng mã nguồn luôn cần thiết, nhưng ở cấp độ hệ thống phân tán, phần lớn sự cố nghiêm trọng nằm ở **ranh giới giao tiếp giữa các thành phần**:

| Câu hỏi ở cấp mã nguồn | Câu hỏi ở cấp hệ thống |
|---|---|
| Hàm xử lý thanh toán đã tách lớp rõ ràng chưa? | Nếu cổng thanh toán đối tác phản hồi chậm 8 giây, luồng gọi có bị nghẽn dây chuyền không? |
| Câu lệnh cập nhật trạng thái đơn hàng có đúng cú pháp không? | Nếu trừ tiền thành công nhưng cơ sở dữ liệu nội bộ mất kết nối đúng lúc ghi, làm sao chống mất đơn hoặc trừ tiền hai lần? |
| Thuật toán chạy độ phức tạp bao nhiêu? | Khi lưu lượng tăng gấp 10 lần vào giờ cao điểm, thành phần nào chạm ngưỡng 100% đầu tiên và cảnh báo nào sẽ báo cho kỹ sư trực? |

## 6. Nối 4 Mindset với bộ công cụ thực hành và dấu hiệu tự kiểm tra

```step
category: TECHNIQUE
short: Bản đồ công cụ
scene: s6-tool-map
callout:
  kind: good-to-know
  title: Nhận diện sớm 4 dấu hiệu trượt về thói quen cũ
  vi: "Mỗi khi bạn định nói ai cũng dùng công nghệ X hoặc cứ thêm máy là xong, hãy dừng lại và mở đúng công cụ tương ứng của Phase 0."
whatChanged:
  - "+ Liên kết trực tiếp từng Mindset với các bài học và công cụ từ S0-01 đến S0-07"
telemetry:
  - label: "Công cụ Phase 0"
    value: "4 khung phân tích"
  - label: "Áp dụng tiếp"
    value: "Phase 1..7 & M7"
    tone: ok
```

Bốn tư duy không nằm trên lý thuyết suông mà đã được cụ thể hóa thành bốn nhóm công cụ bạn vừa đi qua:
- **Làm rõ bài toán & Bảng kiểm 7 câu hỏi (`S0-01`, `S0-07`):** hiện thực hóa tư duy *Luôn hỏi Tại sao* và đặt bài toán trước công nghệ.
- **Ma trận đánh đổi có trọng số (`S0-02`):** hiện thực hóa tư duy *Không có giải pháp hoàn hảo chung* và *Đánh đổi > Công nghệ*.
- **Ngân sách ràng buộc & Ước lượng Napkin Math (`S0-04`, `S0-05`):** neo mọi thảo luận vào giới hạn vật lý của CPU, RAM, mạng, ổ đĩa và chi phí.
- **Luồng `Input → Processing → Storage → Output` (`S0-03`, `S0-06`):** rèn phản xạ *Tư duy toàn hệ thống* và truy vết điểm hỏng trên toàn đường đi.

## 7. Tổng kết và sẵn sàng bước sang bàn mô phỏng trực tiếp

```step
category: RECAP
short: Khép lại tư duy
scene: s1-four-shifts
callout:
  kind: key-idea
  title: Đủ nền tảng tư duy để đọc số liệu mô phỏng
  vi: "Ở bài S0-09 kế tiếp, bạn sẽ làm quen trực tiếp với đồng hồ mức sử dụng ρ, phân vị độ trễ p99, hàng đợi và thanh tua thời gian trên bàn mô phỏng."
whatChanged:
  - "+ Hoàn tất chuỗi lý thuyết tư duy Phase 0, mở đường sang S0-09 và Phase 1 định lượng"
telemetry:
  - label: "Bước tiếp theo"
    value: "S0-09 · Đọc mô phỏng"
    tone: ok
```

Hãy giữ bốn câu hỏi phản tư ngắn gọn này trước mọi bản thiết kế bạn thực hiện từ đây về sau:
1. **Bối cảnh & Ràng buộc:** mình đã nắm rõ quy mô, mẫu lưu lượng, độ trễ mục tiêu và ngân sách chưa?
2. **Lý do gốc:** thành phần này giải quyết nút thắt cụ thể nào, có cách đơn giản hơn không?
3. **Sự đánh đổi:** khi chọn phương án này, hệ thống đang đánh đổi điều gì và điều đó có chấp nhận được với nghiệp vụ không?
4. **Chế độ hỏng:** khi một mắt xích chậm đi hoặc ngừng phản hồi, phần còn lại của hệ thống phản ứng ra sao?

Hãy thử sức với bộ câu hỏi tình huống và thẻ ghi nhớ của bài trước khi mở `S0-09` để thực hành đọc mô phỏng trực tiếp.
