## 1. Giải mã thuật ngữ đời thường & Căn bệnh "Chữa cháy đường tắt" trong ngành phần mềm

Trước khi bước vào tư duy của PMI, hãy làm quen với 4 vai trò và khái niệm quản trị bạn sẽ gặp xuyên suốt mọi câu hỏi tình huống:

- **Project Sponsor (*Nhà tài trợ dự án*):** Lãnh đạo cấp cao bỏ ngân sách, phê duyệt bài toán kinh doanh và ký giấy khai sinh dự án (tương đương Giám đốc Khối / Phó Tổng Giám đốc phụ trách sản phẩm).
- **Project Charter (*Hiến chương / Giấy khai sinh dự án*):** Văn bản chính thức do Sponsor ký để trao quyền cho PM huy động nhân sự, máy chủ và ngân sách.
- **Baseline (*Đường cơ sở đã chốt*):** Bản cam kết chuẩn về Phạm vi (`Scope`), Tiến độ (`Schedule`) và Chi phí (`Cost`) đã được phê duyệt để làm thước đo đối chiếu.
- **CCB (*Change Control Board* — Hội đồng kiểm soát thay đổi):** Nhóm thẩm quyền xét duyệt các yêu cầu thay đổi làm ảnh hưởng đến `Baseline`.

Ngoài đời thực ở các công ty công nghệ, một Tech Lead hay PM được khen "nhanh nhẹn" thường xử lý sự cố theo kiểu **đường tắt cảm tính**: khách hàng nhắn Zalo xin thêm nút xuất báo cáo PDF thì bảo dev làm lén 2 tiếng cho êm chuyện; lập trình viên Junior viết code lỗi thì rút việc tự thức đêm code thay (*Hero Coding*); phòng Hạ tầng cấp máy chủ chậm thì mách thẳng Giám đốc (`Sponsor`) nhờ gây sức ép.

Trong bài thi PMP, [!badge:rose:Bẫy đề thi] ==100% những phản xạ "nhanh tay chữa cháy" đó đều dẫn tới đáp án 0 điểm!== Lý do rất thực tế: PMI thiết kế chuẩn mực cho các dự án quy mô lớn, đa phòng ban — nơi một lần "tự ý sửa code 2 tiếng không qua kiểm định" có thể làm sập cổng thanh toán hoặc vi phạm hợp đồng hàng triệu USD.

## 2. Đối đầu trực diện: 6 Thói quen Đời thực vs 6 Phản xạ Vàng chuẩn PMI

Chỉ cần đảo ngược 6 thói quen quản lý cảm tính sang 6 nguyên tắc kỷ luật dưới đây, bạn sẽ loại bỏ được ngay 2 phương án nhiễu trong hầu hết các câu hỏi PMP:

```visual
kind: compare
title: "6 Thói quen Đời thực (Rớt điểm) vs 6 Phản xạ Vàng PMI (Ăn điểm)"
subtitle: "Thay thế phản xạ chữa cháy cá nhân bằng tư duy lãnh đạo hệ thống"
left:
  badge: "THÓI QUEN ĐỜI THỰC (LOẠI NGAY)"
  title: "Cảm tính · Đường tắt · Đổ lỗi"
  tone: "rose"
  bullets:
    - "1. Nghe tin đồn liền đổi lịch, sửa code ngay hoặc ra lệnh dừng dự án."
    - "2. Hơi vướng mắc nội bộ đã gửi mail cầu cứu Project Sponsor giải quyết hộ."
    - "3. Ai làm chậm hoặc gây bug liền đòi đuổi việc, cắt thưởng hoặc đổi sang Senior khác."
    - "4. Thấy tính năng nhỏ 'tiện tay làm giúp khách' ngoài cam kết mà không kiểm soát."
    - "5. Gửi email CC toàn công ty để phê bình khi chưa từng nói chuyện riêng 1-1."
    - "6. Làm ngơ bất đồng kỹ thuật trong nhóm với hy vọng vài hôm sẽ tự lắng xuống."
right:
  badge: "PHẢN XẠ VÀNG CHUẨN PMI (CHỌN)"
  title: "Phân tích · Hợp tác · Đúng quy trình"
  tone: "emerald"
  bullets:
    - "1. Think Before Act: Xác minh sự thật tại nguồn và phân tích tác động ĐẦU TIÊN."
    - "2. Chủ động giải quyết: PM tự xử lý mọi vấn đề nằm trong thẩm quyền Project Charter."
    - "3. Không vội thay người: Tìm nguyên nhân gốc rễ, đào tạo, kèm cặp (Mentoring/Pairing)."
    - "4. Tôn trọng quy trình: Đụng tới Baseline phải qua CCB; đụng tới Backlog phải qua PO."
    - "5. Giao tiếp trực tiếp: Ưu tiên trao đổi mặt đối mặt (1-on-1) kín đáo và tôn trọng."
    - "6. Đối diện sớm: Giải quyết xung đột bằng phân tích dữ liệu thắng–thắng (Collaborate)."
```

> [!NOTE]
> **Hiểu đúng về Servant Leadership (Lãnh đạo phục vụ):** Làm PM chuẩn PMI không phải là làm "sếp ra lệnh" cũng không phải "người gánh việc hộ nhóm". Bạn đóng vai trò người mở đường: ==bảo vệ sự tập trung của đội kỹ sư, tháo gỡ rào cản thủ tục và tạo môi trường để nhóm phát huy chuyên môn==.

## 3. Quy trình 4 bước giải mã câu hỏi `FIRST / NEXT` trong phòng thi

Khi đề bài dừng lại ngay lúc biến cố vừa phát sinh và hỏi ==What should the project manager do FIRST / NEXT?==, hãy chạy tình huống qua đúng 4 trạm tuần tự dưới đây:

```visual
kind: flow
title: "Chu trình 4 Trạm Phản xạ Chuẩn PMI trước mọi biến cố"
subtitle: "Tuyệt đối không nhảy cóc từ Trạm 1 thẳng sang Trạm 4!"
steps:
  - icon: "search"
    badge: "TRẠM 1 · VERIFY"
    title: "Kiểm chứng dữ liệu gốc"
    desc: "Xác nhận thông tin là sự thật hay tin đồn; mở Plan, Charter, Risk/Issue Log đối chiếu."
    tone: "amber"
    edge: "Nắm đúng sự thật"
  - icon: "scale"
    badge: "TRẠM 2 · ASSESS"
    title: "Phân tích tác động cùng nhóm"
    desc: "Họp với đội chuyên môn đánh giá ảnh hưởng dây chuyền lên Phạm vi, Tiến độ, Chi phí, Rủi ro."
    tone: "sky"
    edge: "Có các phương án"
  - icon: "handshake"
    badge: "TRẠM 3 · COLLABORATE"
    title: "Làm việc trực tiếp các bên"
    desc: "Đối thoại mặt đối mặt với cá nhân hoặc Stakeholder liên quan để thống nhất hướng tháo gỡ."
    tone: "emerald"
    edge: "Cần phê duyệt?"
  - icon: "shield"
    badge: "TRẠM 4 · GOVERN"
    title: "Thực thi qua cổng quản trị"
    desc: "Trình Change Request lên CCB (Predictive) hoặc cùng PO sắp lại Backlog (Agile) và cập nhật hồ sơ."
    tone: "cyan"
```

> [!WARNING]
> **Cảnh giác từ khoá:** Những đáp án mở đầu bằng *Immediately escalate*, *Ask HR to replace*, *Instruct the team to work overtime* hay *Pause all project work* gần như luôn là đáp án bẫy (trừ trường hợp khẩn cấp nguy hiểm tính mạng hoặc vi phạm pháp luật!).

## 4. Tình huống thực chiến: Khi nào PM mới được phép báo lên Sponsor?

Giả sử trong dự án nâng cấp Core Banking, một lập trình viên báo tin hành lang rằng nhà cung cấp dịch vụ xác thực đám mây sắp tăng giá gấp đôi. Nếu chọn *"Báo ngay cho Sponsor xin thêm tiền"* là bạn rơi thẳng vào bẫy! Phản xạ chuẩn phải là: **kiểm tra lại hợp đồng đã ký với nhà cung cấp và đánh giá tác động thực tế trước**.

Vậy khi nào PM **thực sự được phép và bắt buộc** leo thang (*Escalate*) lên `Project Sponsor`? Chỉ trong **3 trường hợp vượt ngoài thẩm quyền PM**:

1. Mức thay đổi vượt quá biên độ dung sai của `Baseline` hoặc cần xin giải ngân quỹ dự phòng cấp cao (**Management Reserve**) khi tổ chức không lập CCB riêng.
2. Bối cảnh thị trường thay đổi làm **bài toán đầu tư (Business Case) không còn sinh lời**, cần Sponsor quyết định tái định hướng hoặc đóng dự án sớm (PM không có quyền tự huỷ dự án!).
3. Rủi ro mang tầm liên phòng ban / toàn tập đoàn vượt khỏi ranh giới dự án.

> [!TIP]
> **Nguyên tắc vàng trước khi gõ cửa phòng Sponsor:** ==Không bao giờ mang một "vấn đề trống không" lên hỏi cấp trên!== PM phải hoàn tất bước phân tích tác động và cầm theo **2–3 phương án giải quyết kèm khuyến nghị tối ưu** để Sponsor ra quyết định.
