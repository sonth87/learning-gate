## 1. Tam giác Quyền hạn Bất khả xâm phạm trong Scrum

Hơn một nửa số câu bẫy Agile trong đề PMP xoay quanh việc **ai đó bước nhầm sang sân của vai trò khác**. Chỉ cần thuộc nằm lòng ranh giới 3 cột dưới đây của [!badge:sky:PMA Bridge], bạn sẽ gạch bỏ ngay những phương án "nghe quen tai ngoài đời nhưng sai chuẩn Scrum":

```visual
kind: groups
title: "Ranh giới Quyền hạn 3 Vai trò Scrum (Tấm khiên lọc đáp án sai)"
subtitle: "Ai lấn sân người nấy trong đáp án → Loại ngay lập tức!"
columns: 3
items:
  - icon: "target"
    title: "Product Owner (PO)"
    badge: "WHY & WHAT · Giá trị"
    tone: "emerald"
    desc: "Một đầu mối duy nhất tối đa hoá giá trị sản phẩm và sở hữu Product Backlog."
    bullets:
      - "Định nghĩa tầm nhìn, sắp xếp thứ tự Product Backlog theo Giá trị / Rủi ro"
      - "Người DUY NHẤT có thẩm quyền huỷ Sprint khi Sprint Goal trở nên lỗi thời"
      - "KHÔNG ước lượng hộ nhóm và KHÔNG chia việc chi tiết cho từng Developer"
  - icon: "users"
    title: "Developers (Team)"
    badge: "HOW & HOW MUCH"
    tone: "sky"
    desc: "Nhóm đa chức năng (Cross-functional, T-shaped) từ 3–9 thành viên tự tổ chức."
    bullets:
      - "Trực tiếp ước lượng nỗ lực (Story Points), kéo việc vào Sprint & sở hữu Sprint Backlog"
      - "Tự quyết giải pháp kỹ thuật và chịu trách nhiệm chung tạo Increment đạt DoD"
      - "KHÔNG nhận lệnh chèn việc ngang hông từ Stakeholder bên ngoài"
  - icon: "shield"
    title: "Scrum Master / Agile PM"
    badge: "SERVANT LEADER"
    tone: "amber"
    desc: "Người huấn luyện quy trình, bảo vệ sự tập trung của nhóm và gỡ trở ngại."
    bullets:
      - "Gỡ Impediments vượt tầm nhóm, giữ các sự kiện đúng mục đích và Timebox"
      - "Chắn sóng khi Stakeholder làm phiền nhóm giữa Sprint, hướng họ làm việc qua PO"
      - "KHÔNG phải 'sếp' giao việc và KHÔNG tự ý sắp xếp lại Product Backlog"
```

## 2. Bản chất 5 Sự kiện Scrum & Căn bệnh biến tướng ngoài đời

Mọi sự kiện trong Scrum đều có **Timebox tối đa** nhằm đảm bảo tính minh bạch (*Transparency*), thanh tra (*Inspection*) và thích ứng (*Adaptation*). Ngoài sự kiện bao trùm là **Sprint (1–4 tuần)**, hãy cảnh giác cao độ với các "triệu chứng biến tướng" rất hay xuất hiện trong [!badge:violet:ECO 07/2026]:

```visual
kind: troubleshoot
title: "Chẩn đoán 4 Sự kiện Scrum & Phản xạ Sửa sai Chuẩn PMI"
subtitle: "Nhận diện ngay các anti-patterns kinh điển trong câu hỏi tình huống Agile"
items:
  - symptom: "Daily Scrum kéo dài 45 phút, biến thành buổi báo cáo PM & bàn sâu lỗi code"
    badge: "15 phút · Của Developers"
    tone: "rose"
    cause: "Nhầm Daily Standup thành cuộc họp trạng thái cho cấp quản lý hoặc bàn kỹ thuật chi tiết."
    fix: "Scrum Master huấn luyện nhóm giữ đúng Timebox **15 phút** để Developers tự đồng bộ kế hoạch 24h tới hướng về Sprint Goal; tách thảo luận kỹ thuật sâu sang buổi họp riêng ngay sau đó (Parking Lot); Stakeholder nếu dự chỉ được lắng nghe."
  - symptom: "Stakeholder chèn tính năng mới thẳng vào giữa Sprint đang chạy"
    badge: "Bảo vệ Sprint Goal"
    tone: "amber"
    cause: "Bỏ qua vai trò của Product Owner và phá vỡ cam kết Timebox của nhóm."
    fix: "==Bảo vệ Sprint hiện tại!== Hướng dẫn Stakeholder đưa yêu cầu cho **Product Owner** để đánh giá giá trị và xếp vào Product Backlog cho các Sprint tới (chỉ khi PO đồng thuận hoán đổi hạng mục tương đương không ảnh hưởng Sprint Goal mới xét điều chỉnh)."
  - symptom: "Sprint Review biến thành lễ ký giấy tờ nghiệm thu cứng nhắc hoặc chỉ chiếu slide"
    badge: "Demo sản phẩm chạy thật"
    tone: "sky"
    cause: "Trình diễn tính năng chưa xong (chưa đạt DoD) hoặc thiếu tương tác hai chiều với người dùng."
    fix: "Chỉ demo **Working Increment đã đạt 100% Definition of Done**, trực tiếp thu nhận phản hồi của Stakeholders để cùng PO cập nhật lại Product Backlog."
  - symptom: "Đợi kết thúc cả dự án 6 tháng mới họp rút kinh nghiệm (Lessons Learned)"
    badge: "Sprint Retrospective"
    tone: "emerald"
    cause: "Mang thói quen cuối kỳ của Waterfall vào Agile khiến lỗi quy trình lặp đi lặp lại qua nhiều Sprint."
    fix: "Tổ chức **Sprint Retrospective** ở cuối MỖI Sprint trong không gian an toàn tâm lý, chọn ra 1–2 hành động cải tiến cụ thể đưa ngay vào Sprint kế tiếp."
```

## 3. Ba Cổng Chất lượng: `DoR` vs `Acceptance Criteria` vs `DoD`

[!badge:rose:Bẫy đề thi] Đề thi cực kỳ thích tráo đổi 3 thuật ngữ này khi nhóm và PO tranh cãi *"Story này xong chưa?"*:

- [x] **Definition of Ready (`DoR` — Cổng ĐẦU VÀO Sprint):** Checklist kiểm tra một User Story trên Product Backlog đã đủ rõ, đủ nhỏ (*INVEST*) và đã rõ phụ thuộc để nhóm tự tin kéo vào `Sprint Planning` hay chưa. *(Lưu ý: Backlog Refinement tốn không quá ~10% năng lực nhóm để chuẩn bị DoR).*
- [x] **Acceptance Criteria (`AC` — Điều kiện RIÊNG từng Story):** Các tiêu chí nghiệp vụ/kịch bản kiểm thử cụ thể gắn riêng cho **từng User Story** (ví dụ: *"Nhập sai mật khẩu 5 lần thì khoá tài khoản 15 phút"*).
- [x] **Definition of Done (`DoD` — Chuẩn Chất lượng CHUNG toàn Increment):** Cam kết chất lượng áp dụng cho **MỌI hạng mục** trước khi được gọi là hoàn thành (code review xong, unit/integration test xanh, quét bảo mật đạt, cập nhật tài liệu...). ==Chưa đạt DoD → Không tính Velocity, không mang ra demo tại Sprint Review, trả lại Product Backlog để PO ưu tiên lại!==
