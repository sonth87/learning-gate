## 1. Nghịch lý người giỏi thực chiến lại sập bẫy đề PMP

Ngoài đời thực, một PM hoặc Tech Lead được khen "nhạy bén" thường là người biết **chữa cháy tức thì**: khách nhắn Zalo xin thêm nút bấm thì bảo dev làm luôn 2 tiếng cho xong chuyện; thành viên làm lỗi thì rút việc giao cho Senior gánh; phòng ban khác gây khó dễ thì nhờ Sếp lớn gọi điện can thiệp.

Trong phòng thi PMP, [!badge:rose:Bẫy đề thi] **mọi thói quen "đường tắt" đó đều dẫn tới đáp án 0 điểm**! PMI thiết kế bài thi cho những dự án quy mô lớn, đa quốc gia — nơi một quyết định cảm tính chưa qua phân tích tác động sẽ gây sụp đổ dây chuyền về chi phí, pháp lý và chất lượng.

```visual
kind: compare
title: "Đối đầu trực diện: 6 Thói quen Đời thực vs 6 Phản xạ Vàng PMI/PMA"
subtitle: "Chỉ cần đảo chiều 6 cặp phản xạ này, bạn sẽ loại ngay 50–75% đáp án nhiễu trong đề thi"
left:
  badge: "BẪY ĐỜI THỰC (TRƯỢT PMP)"
  title: "Phản xạ Chữa cháy & Đường tắt"
  tone: "rose"
  bullets:
    - "1. Hành động ngay: Nghe tin đồn liền đổi kế hoạch, cập nhật lịch hoặc ra lệnh sửa ngay."
    - "2. Đẩy lên Sponsor: Gặp xung đột hay thiếu hụt nhỏ cũng chạy lên xin ý kiến cấp trên."
    - "3. Đuổi người / Thay máu: Ai làm chậm hoặc mắc lỗi liền đòi Functional Manager đổi người."
    - "4. Sửa lén chiều khách (Gold Plating): Thấy việc nhỏ 'không tốn tiền' liền làm tặng ngoài Baseline."
    - "5. Email dằn mặt tập thể: Gửi mail CC cả công ty hoặc mách sếp khi chưa nói chuyện riêng."
    - "6. Né xung đột (Withdraw): Lờ đi bất đồng chuyên môn với hy vọng mọi chuyện tự êm xuôi."
right:
  badge: "PHẢN XẠ VÀNG (ĐỖ PMP)"
  title: "Tư duy Kỷ luật & Tự chủ chuẩn PMI"
  tone: "emerald"
  bullets:
    - "1. Think Before Act: Luôn xác thực sự thật, đọc tài liệu gốc và đánh giá tác động ĐẦU TIÊN."
    - "2. Limit Escalate: PM tự giải quyết mọi việc trong thẩm quyền được giao bởi Project Charter."
    - "3. Do Not Remove: Đào tạo, huấn luyện (coaching), ghép cặp (pairing) và tìm nguyên nhân hệ thống."
    - "4. Follow the Process: Chạm Baseline phải qua Change Control (CCB); chạm Backlog phải qua PO."
    - "5. Direct Communication: Ưu tiên gặp trực tiếp / gọi mặt đối mặt 1-1 một cách tôn trọng."
    - "6. Confront Problems: Đối diện sớm với sự cố & giải quyết xung đột bằng Collaborate / Problem Solve."
```

## 2. Nhịp 4 bước "Phanh gấp — Phân tích — Hợp tác — Quy trình" cho câu hỏi `FIRST / NEXT`

Mỗi khi đề bài hỏi ==What should the project manager do FIRST / NEXT?==, hãy chạy tình huống qua phễu lọc 4 trạm của [!badge:sky:PMA Bridge] dưới đây:

```visual
kind: flow
title: "Chu trình Phản xạ Chuẩn khi gặp biến cố trong đề PMP"
subtitle: "Không bao giờ nhảy cóc từ Trạm 1 thẳng sang Trạm 4!"
footer: "Mẹo vàng: Đáp án chứa các động từ Assess, Analyze, Review, Meet with, Investigate thường thắng các động từ Escalate, Replace, Immediately change, Reject."
steps:
  - icon: "search"
    badge: "BƯỚC 1 · FIRST"
    title: "Kiểm chứng tại nguồn"
    desc: "Xác nhận thông tin có thật không, đối chiếu Plan / Charter / Log hiện hành."
    tone: "amber"
    edge: "Đã rõ sự thật"
  - icon: "scale"
    badge: "BƯỚC 2 · ASSESS"
    title: "Đánh giá tác động"
    desc: "Họp với nhóm chuyên môn phân tích ảnh hưởng lên Scope, Time, Finance, Risk, Value."
    tone: "sky"
    edge: "Có phương án"
  - icon: "handshake"
    badge: "BƯỚC 3 · COLLABORATE"
    title: "Trao đổi trực tiếp"
    desc: "Làm việc mặt đối mặt với cá nhân/bên liên quan ở cấp thẩm quyền gần nhất."
    tone: "emerald"
    edge: "Cần phê duyệt?"
  - icon: "shield"
    badge: "BƯỚC 4 · GOVERN"
    title: "Thực thi đúng quy trình"
    desc: "Nộp Change Request lên CCB / đưa vào Backlog của PO và cập nhật tài liệu sống."
    tone: "violet"
```

## 3. Khi nào PM MỚI ĐƯỢC PHÉP leo thang lên Project Sponsor?

[!badge:emerald:Phản xạ vàng] Quy tắc `Limit Escalate` không có nghĩa là "không bao giờ gặp Sponsor", mà là **chỉ leo thang khi vấn đề vượt khỏi ranh giới thẩm quyền của PM**:

- [x] Thay đổi vượt ngoài dung sai cho phép của `Scope / Schedule / Cost Baseline` hoặc cần xin giải ngân **Management Reserve** ( khi không có CCB riêng, Sponsor nắm quyền này).
- [x] Mục tiêu kinh doanh thay đổi khiến **Business Case không còn khả thi**, cần xem xét tái định hướng hoặc huỷ dự án.
- [x] Rủi ro cấp chiến lược ảnh hưởng sang các dự án/phòng ban khác vượt ngoài phạm vi dự án (*Escalate* threat/opportunity).
- [!] **Tuyệt đối KHÔNG mang "câu hỏi rỗng" lên Sponsor:** Trước khi báo cáo, PM bắt buộc phải hoàn tất phân tích tác động và mang theo **các phương án giải quyết kèm khuyến nghị rõ ràng**.

> [!REMEMBER] Khắc cốt ghi tâm trước khi sang Cấp độ 1
> Trong bài thi PMP, bạn không phải "thư ký chuyển tin" hay "cảnh sát bắt lỗi". Bạn là một **Servant & Accountable Leader**: bình tĩnh trước biến cố, bảo vệ chất lượng, tôn trọng vai trò chuyên môn và dùng quy trình làm lá chắn cho giá trị dự án.
