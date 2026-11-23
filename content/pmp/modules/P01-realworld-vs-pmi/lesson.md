## 1. Khác biệt giữa thói quen xử lý tình huống thực tế và quy chuẩn quản trị dự án của PMI

Trước khi đối chiếu các tình huống, cần nắm rõ 4 vai trò và khái niệm quản trị xuất hiện xuyên suốt trong đề thi PMP:

- **Project Sponsor (*Nhà tài trợ dự án*):** Lãnh đạo cấp cao phê duyệt ngân sách, bài toán kinh doanh và ký ban hành Điều lệ dự án (tương đương Giám đốc Khối hoặc Phó Tổng Giám đốc phụ trách sản phẩm).
- **Project Charter (*Điều lệ dự án*):** Văn bản chính thức do Sponsor phê duyệt để công nhận sự tồn tại của dự án và trao quyền cho PM huy động nhân sự, hạ tầng, ngân sách (thường được ví như giấy khai sinh của dự án).
- **Baseline (*Đường cơ sở đã phê duyệt*):** Bản cam kết chuẩn về Phạm vi (`Scope`), Tiến độ (`Schedule`) và Chi phí (`Cost`) dùng làm thước đo kiểm soát sai lệch.
- **CCB (*Change Control Board* — Hội đồng kiểm soát thay đổi):** Nhóm thẩm quyền xem xét và phê duyệt hoặc từ chối các yêu cầu thay đổi làm ảnh hưởng đến `Baseline`.

Trong thực tế vận hành ở nhiều đội ngũ kỹ thuật, người quản lý thường xử lý sự cố theo thói quen ứng biến nhanh: khách hàng nhắn tin xin thêm nút xuất báo cáo PDF thì bảo lập trình viên làm thêm 2 giờ cho xong việc; lập trình viên Junior viết code lỗi thì tự thức đêm sửa thay (*Hero Coding*); bộ phận Hạ tầng cấp máy chủ chậm thì báo thẳng lên Giám đốc (`Sponsor`) để gây sức ép.

Trong bài thi PMP, [!badge:rose:Sai lầm phổ biến] ==hầu hết các cách xử lý cảm tính, bỏ qua quy trình đó đều là phương án sai==. Lý do là chuẩn mực PMI hướng đến các dự án quy mô lớn, đa phòng ban — nơi việc tự ý thay đổi mã nguồn không qua kiểm soát có thể gây mất an toàn hệ thống hoặc vi phạm cam kết hợp đồng.

## 2. Đối chiếu 6 thói quen thực tế với nguyên tắc xử lý chuẩn PMI

Việc chuyển từ thói quen ứng biến cá nhân sang 6 nguyên tắc kỷ luật dưới đây giúp loại bỏ nhanh các phương án nhiễu trong đa số câu hỏi PMP:

```visual
kind: compare
title: "6 Thói quen Ứng biến Cảm tính vs 6 Nguyên tắc Xử lý Chuẩn PMI"
subtitle: "Thay thế phản ứng vội vàng bằng quy trình phân tích và quản trị có hệ thống"
left:
  badge: "THÓI QUEN CẢM TÍNH (LOẠI BỎ)"
  title: "Vội vàng · Đường tắt · Đổ lỗi"
  tone: "rose"
  bullets:
    - "1. Nghe tin đồn liền đổi lịch, sửa code ngay hoặc ra lệnh dừng dự án."
    - "2. Gặp vướng mắc nội bộ liền gửi mail yêu cầu Project Sponsor giải quyết hộ."
    - "3. Nhân sự làm chậm hoặc gây lỗi liền đề nghị sa thải, cắt thưởng hoặc thay người khác."
    - "4. Tiện tay làm thêm tính năng nhỏ ngoài cam kết cho khách hàng mà không qua kiểm soát."
    - "5. Gửi email CC nhiều người để phê bình khi chưa từng trao đổi riêng 1-1."
    - "6. Làm ngơ bất đồng kỹ thuật trong nhóm với hy vọng vấn đề sẽ tự lắng xuống."
right:
  badge: "NGUYÊN TẮC CHUẨN PMI (CHỌN)"
  title: "Phân tích · Hợp tác · Đúng quy trình"
  tone: "emerald"
  bullets:
    - "1. Think Before Act: Xác minh dữ liệu tại nguồn và phân tích tác động ĐẦU TIÊN."
    - "2. Chủ động giải quyết: PM tự xử lý mọi vấn đề nằm trong thẩm quyền Project Charter."
    - "3. Không vội thay người: Tìm nguyên nhân gốc rễ, đào tạo, kèm cặp (Mentoring/Pairing)."
    - "4. Tôn trọng quy trình: Tác động Baseline phải qua CCB; tác động Backlog phải qua PO."
    - "5. Giao tiếp trực tiếp: Ưu tiên trao đổi mặt đối mặt (1-on-1) kín đáo và tôn trọng."
    - "6. Đối diện sớm: Giải quyết xung đột bằng phân tích dữ liệu hướng tới đồng thuận (Collaborate)."
```

> [!NOTE]
> **Hiểu đúng về Servant Leadership (Lãnh đạo phục vụ):** Làm PM theo chuẩn PMI không phải là chỉ huy áp đặt, cũng không phải làm thay công việc chuyên môn của nhóm. PM đóng vai trò người điều phối và hỗ trợ: ==bảo vệ sự tập trung của đội ngũ, tháo gỡ rào cản quy trình và tạo điều kiện để nhóm phát huy năng lực==.

## 3. Quy trình 4 bước phân tích câu hỏi tình huống `FIRST / NEXT`

Khi đề bài mô tả một biến cố vừa phát sinh và hỏi ==What should the project manager do FIRST / NEXT?==, hãy lần lượt kiểm tra phương án theo 4 bước tuần tự sau:

```visual
kind: flow
title: "Quy trình 4 Bước Phân tích và Hành động Chuẩn PMI"
subtitle: "Không nhảy cóc từ Bước 1 thẳng sang Bước 4 khi chưa đánh giá tác động"
steps:
  - icon: "search"
    badge: "BƯỚC 1 · VERIFY"
    title: "Kiểm chứng dữ liệu gốc"
    desc: "Xác nhận thông tin là sự thật hay tin đồn; kiểm tra Plan, Charter, Risk/Issue Log."
    tone: "amber"
    edge: "Nắm đúng sự thật"
  - icon: "scale"
    badge: "BƯỚC 2 · ASSESS"
    title: "Phân tích tác động cùng nhóm"
    desc: "Làm việc với đội chuyên môn để đánh giá ảnh hưởng lên Phạm vi, Tiến độ, Chi phí, Rủi ro."
    tone: "sky"
    edge: "Có các phương án"
  - icon: "handshake"
    badge: "BƯỚC 3 · COLLABORATE"
    title: "Trao đổi trực tiếp các bên"
    desc: "Đối thoại với cá nhân hoặc Stakeholder liên quan để thống nhất hướng giải quyết."
    tone: "emerald"
    edge: "Cần phê duyệt?"
  - icon: "shield"
    badge: "BƯỚC 4 · GOVERN"
    title: "Thực thi qua cổng quản trị"
    desc: "Trình Change Request lên CCB (Predictive) hoặc cùng PO sắp lại Backlog (Agile) và cập nhật hồ sơ."
    tone: "cyan"
```

> [!WARNING]
> **Nhận diện phương án bẫy:** Các lựa chọn mở đầu bằng *Immediately escalate*, *Ask HR to replace*, *Instruct the team to work overtime* hay *Pause all project work* thường là đáp án sai (ngoại trừ tình huống khẩn cấp đe dọa an toàn con người hoặc vi phạm pháp luật).

## 4. Thẩm quyền xử lý của PM và các trường hợp cần báo cáo lên Sponsor

Giả sử trong dự án nâng cấp hệ thống ngân hàng lõi, một lập trình viên báo tin hành lang rằng nhà cung cấp dịch vụ xác thực đám mây sắp tăng giá gấp đôi. Nếu chọn ngay *"Báo cho Sponsor xin thêm ngân sách"* thì đây là hành động vội vàng. Phản xạ đúng là: **kiểm tra lại hợp đồng đã ký với nhà cung cấp và đánh giá tác động tài chính thực tế trước**.

PM chỉ **được phép và cần thiết** leo thang vấn đề (*Escalate*) lên `Project Sponsor` trong **3 trường hợp vượt quá thẩm quyền của PM**:

1. Mức thay đổi vượt quá ngưỡng dung sai của `Baseline` hoặc cần giải ngân quỹ dự phòng cấp cao (**Management Reserve**) khi tổ chức không thiết lập CCB riêng.
2. Bối cảnh thị trường hoặc chiến lược thay đổi làm **bài toán đầu tư (Business Case) không còn hiệu quả**, cần Sponsor quyết định tái định hướng hoặc đóng dự án sớm (PM không có quyền tự hủy dự án).
3. Rủi ro hoặc xung đột mang tính liên phòng ban / cấp tập đoàn vượt ra ngoài ranh giới dự án.

> [!TIP]
> **Nguyên tắc trước khi báo cáo lên Sponsor:** ==Không chuyển một vấn đề chưa phân tích lên cấp trên.== PM cần hoàn tất việc đánh giá tác động và chuẩn bị sẵn **2–3 phương án xử lý kèm khuyến nghị cụ thể** để Sponsor ra quyết định.
