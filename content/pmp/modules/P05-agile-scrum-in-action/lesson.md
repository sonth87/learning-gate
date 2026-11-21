## 1. Giải mã thuật ngữ Scrum bằng ngôn ngữ của đội phát triển phần mềm

Trong các công ty công nghệ Việt Nam, chữ "Scrum" đôi khi bị biến tướng: Tech Lead vừa làm Scrum Master vừa chấm KPI giao việc cho anh em, còn khách hàng thích thì nhắn tin chèn thẳng tính năng mới vào giữa tuần! Nếu mang hình ảnh đó vào phòng thi PMP, bạn sẽ sập bẫy ngay lập tức.

Hãy nắm rõ bản chất đời thường của các khái niệm cốt lõi trong **Scrum** trước khi giải tình huống:

- **Product Backlog (*Danh sách hạng mục sản phẩm*):** Hàng đợi duy nhất chứa mọi tính năng, cải tiến và sửa lỗi của sản phẩm, được sắp xếp từ trên xuống dưới theo **giá trị kinh doanh và mức độ rủi ro**.
- **Sprint (*Nhịp chạy nước rút cố định 1–4 tuần*):** Khoảng thời gian đóng khung (*Timebox*) không đổi để đội phát triển biến các yêu cầu đầu bảng thành một phần mềm chạy thật gọi là **Increment**.
- **Cross-functional & T-shaped Team (*Nhóm đa chức năng chữ T*):** Đội từ 3–9 thành viên có đủ kỹ năng (Backend, Frontend, QA, UX...) để hoàn tất tính năng từ đầu đến cuối; mỗi người giỏi sâu 1 chuyên môn (*nét dọc chữ T*) nhưng sẵn sàng phụ giúp mảng lân cận (*nét ngang chữ T*) khi đồng đội quá tải.
- **Impediment (*Rào cản / Vật ngáng đường*):** Bất kỳ trở ngại nào vượt khỏi tầm tự xử lý của nhóm đang làm tắc công việc (ví dụ: chờ phòng Bảo mật mở cổng mạng 5 ngày chưa xong).

## 2. Tam giác quyền hạn bất khả xâm phạm của 3 vai trò trong Scrum

Hơn 50% câu bẫy Agile trong đề PMP cố tình gài một nhân vật **bước nhầm sang quyền hạn của người khác**. Chỉ cần thuộc ranh giới 3 cột dưới đây, bạn sẽ loại đáp án sai trong tích tắc:

```visual
kind: groups
title: "Ranh giới Quyền hạn 3 Vai trò Scrum (Khiên chắn lọc đáp án nhiễu)"
subtitle: "Hễ đáp án để vai trò này làm thay việc của vai trò kia → Gạch bỏ ngay lập tức!"
columns: 3
items:
  - icon: "target"
    title: "Product Owner (PO)"
    badge: "WHY & WHAT · Tối ưu Giá trị"
    tone: "emerald"
    desc: "Một người duy nhất chịu trách nhiệm tối đa hoá giá trị sản phẩm và quản lý Product Backlog."
    bullets:
      - "Xếp thứ tự ưu tiên trên Product Backlog dựa trên Giá trị kinh doanh & Rủi ro"
      - "Người DUY NHẤT có thẩm quyền huỷ Sprint khi mục tiêu Sprint không còn ý nghĩa"
      - "CẤM: Tự ước lượng điểm hộ nhóm hoặc chỉ định cụ thể dev nào làm task nào"
  - icon: "users"
    title: "Developers (Đội phát triển)"
    badge: "HOW & HOW MUCH · Thực thi"
    tone: "sky"
    desc: "Những người trực tiếp tạo ra Increment hoàn chỉnh trong mỗi Sprint."
    bullets:
      - "Độc quyền ước lượng khối lượng công việc (Story Points) và quyết định kéo bao nhiêu việc vào Sprint"
      - "Tự tổ chức cách thiết kế kỹ thuật, chia việc hàng ngày và sở hữu Sprint Backlog"
      - "CẤM: Tự ý nhận yêu cầu chèn ngang từ Stakeholder bên ngoài mà không qua PO"
  - icon: "shield"
    title: "Scrum Master / Agile PM"
    badge: "SERVANT LEADER · Huấn luyện"
    tone: "amber"
    desc: "Người bảo vệ quy trình Scrum, tháo gỡ rào cản và che chắn sự tập trung cho nhóm."
    bullets:
      - "Gỡ các Impediments vượt tầm nhóm và hướng dẫn các bên tôn trọng Timebox"
      - "Chắn sóng khi phòng ban khác đòi nhét việc giữa Sprint, hướng họ gặp PO"
      - "CẤM: Đóng vai 'ông sếp giao việc' hoặc tự tay sắp xếp lại Product Backlog"
```

> [!NOTE]
> **Góc nhìn chuyển vai cho PM truyền thống:** Khi đề bài gọi nhân vật của bạn là *Agile Project Manager*, hãy lập tức khoác chiếc áo **Servant Leader / Scrum Master**: ==huấn luyện đội tự tổ chức và tạo điều kiện giao tiếp, tuyệt đối không ra lệnh phân công vi mô==!

## 3. Phân biệt sống còn 3 cổng chất lượng: `DoR` vs `Acceptance Criteria` vs `DoD`

Trong dự án phần mềm, khi BA/PO và lập trình viên cãi nhau *"Ủa thẻ Jira này xong chưa?"*, nguyên nhân luôn do nhầm lẫn 3 khái niệm sau. Hãy định vị chúng theo đúng dòng thời gian của một tính năng **Đăng nhập bằng OTP**:

- **Definition of Ready (`DoR` — Chuẩn sẵn sàng ĐẦU VÀO trước khi vào Sprint):** Bộ điều kiện kiểm tra xem một User Story trên Product Backlog đã đủ rõ nghiệp vụ, có mockup màn hình, rõ API SMS và đủ nhỏ (*chuẩn INVEST*) để nhóm tự tin kéo vào buổi họp `Sprint Planning` hay chưa. *(Nhóm dành không quá ~10% thời gian Sprint cho hoạt động **Backlog Refinement** để làm rõ DoR cho Sprint sau).*
- **Acceptance Criteria (`AC` — Tiêu chí nghiệm thu RIÊNG của từng User Story):** Điều kiện đúng/sai về mặt tính năng gắn riêng cho thẻ Đăng nhập OTP đó (ví dụ: *"Mã OTP có hiệu lực đúng 60 giây; nhập sai 5 lần liên tiếp phải khoá tạm thời 15 phút"*).
- **Definition of Done (`DoD` — Chuẩn xuất xưởng CHUNG của toàn bộ sản phẩm):** Quy ước chất lượng bắt buộc áp dụng cho **MỌI tính năng** trước khi được coi là hoàn tất (đã qua Peer Code Review, Unit Test đạt 85%, quét bảo mật SonarQube xanh, tích hợp lên môi trường Staging không lỗi). ==Tính năng thoả mãn AC nhưng chưa đạt đủ DoD thì tính 0 điểm Velocity, không được mang ra trình diễn ở Sprint Review và phải trả về Product Backlog để PO xét ưu tiên lại!==

## 4. Chẩn đoán 4 căn bệnh biến tướng của Sự kiện Scrum & Phản xạ phòng thi

Mọi sự kiện trong Scrum đều khóa khung thời gian tối đa (*Timebox*) để tránh họp hành lê thê. Hãy thuộc bảng bắt bệnh thực chiến sau cho các câu hỏi [!badge:violet:ECO 07/2026]:

```visual
kind: troubleshoot
title: "Chẩn đoán 4 Sự kiện Scrum Bị Biến Tướng & Cách Sửa Chuẩn PMI"
subtitle: "Bắt trúng triệu chứng ngoài đời để khoanh đúng hành động của Servant Leader"
items:
  - symptom: "Họp Daily Scrum kéo dài 45 phút, biến thành buổi báo cáo sếp & tranh cãi bug kỹ thuật"
    badge: "15 phút · Dành cho Developers"
    tone: "rose"
    cause: "Biến buổi đồng bộ kế hoạch 24h của nhóm thành buổi kiểm điểm tiến độ hoặc mổ xẻ code chi tiết."
    fix: "Huấn luyện nhóm giữ nghiêm Timebox **15 phút** xoay quanh Sprint Goal; các thảo luận kỹ thuật sâu tách sang nhóm nhỏ họp riêng ngay sau đó (*Parking Lot*); lãnh đạo nếu dự chỉ đứng nghe, không chất vấn."
  - symptom: "Giám đốc Kinh doanh lao vào bảo Developer code gấp 1 tính năng ngay giữa Sprint đang chạy"
    badge: "Bảo vệ Sprint Goal"
    tone: "amber"
    cause: "Xâm phạm cam kết Sprint và vòng qua đầu mối quản trị giá trị là Product Owner."
    fix: "==Bảo vệ đội phát triển khỏi sự gián đoạn!== Giải thích quy tắc làm việc và mời Giám đốc trao đổi với **Product Owner** để đánh giá giá trị, đưa vào Product Backlog cho Sprint tiếp theo."
  - symptom: "Buổi Sprint Review chỉ chiếu slide PowerPoint báo cáo phần trăm hoàn thành"
    badge: "Demo phần mềm chạy thật"
    tone: "sky"
    cause: "Mang tính năng dở dang chưa đạt DoD ra báo cáo một chiều, không thu được trải nghiệm thật."
    fix: "Chỉ trình diễn **Working Increment đã đạt 100% DoD**, mời Stakeholders dùng thử trực tiếp và thu thập phản hồi cập nhật lại Product Backlog."
  - symptom: "Đợi hết dự án 6 tháng mới họp rút kinh nghiệm khiến xung đột và lỗi quy trình tích tụ"
    badge: "Sprint Retrospective"
    tone: "emerald"
    cause: "Thiếu vòng lặp cải tiến quy trình định kỳ trong không gian an toàn tâm lý."
    fix: "Tổ chức **Sprint Retrospective** đều đặn cuối MỖI Sprint để cả nhóm tự nhìn lại cách phối hợp và chọn ngay 1–2 cải tiến khả thi áp dụng vào Sprint kế tiếp."
```

> [!TIP]
> **Mẹo phân biệt nhanh Sprint Review vs Sprint Retrospective:** ==Sprint Review soi vào SẢN PHẨM== (có mời khách hàng/Stakeholders góp ý tính năng); còn ==Sprint Retrospective soi vào CÁCH LÀM VIỆC & CON NGƯỜI== (buổi họp nội bộ khép kín của riêng Scrum Team!).
