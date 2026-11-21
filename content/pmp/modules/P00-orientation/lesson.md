## 1. Từ điển nhập môn bằng ngôn ngữ đời thường: PMI, ECO và PMBOK® Guide 8 là gì?

Nếu bạn là Software Engineer, Business Analyst (BA) hay Tech Lead lần đầu mở tài liệu ôn thi **PMP®** (*Project Management Professional*), cảm giác choáng ngợp đầu tiên luôn đến từ một rừng chữ viết tắt. Hãy dùng hình ảnh một kỳ sát hạch Kiến trúc sư Phần mềm để giải mã ngay 5 thuật ngữ nền tảng nhất trước khi đi sâu vào chiến thuật:

- **PMI (*Project Management Institute* — Viện Quản lý Dự án Hoa Kỳ):** Tổ chức quốc tế ra đề và cấp chứng chỉ PMP trên toàn cầu.
- **ECO (*Exam Content Outline* — Khung đề cương thi chính thức):** Bản thiết kế quy định đề thi sẽ kiểm tra những kỹ năng thực tế nào và chiếm bao nhiêu phần trăm điểm số. Phiên bản mới nhất là [!badge:violet:ECO 07/2026]. Hãy coi `ECO` chính là **đề cương câu hỏi thi**.
- **PMBOK® Guide 8th Edition (*Project Management Body of Knowledge* — Bộ quy chuẩn Kiến thức QLDA bản 8):** Cuốn sách khung chuẩn mực giải thích nguyên tắc, miền công việc và quy trình quản trị. Nếu `ECO` là đề cương ra đề, thì `PMBOK® 8` chính là **tài liệu kiến trúc tham chiếu**.
- **OCM (*Organizational Change Management* — Quản trị thay đổi con người trong tổ chức):** Nghệ thuật giúp nhân viên và người dùng thực sự đón nhận hệ thống mới thay vì tẩy chay quay về dùng file Excel cũ.
- **ESG (*Environmental, Social, and Governance* — Môi trường, Xã hội & Quản trị):** Tiêu chuẩn phát triển bền vững, tiết kiệm tài nguyên máy chủ/năng lượng, an toàn lao động và đạo đức dữ liệu.

> [!NOTE]
> **Góc nhìn dự án phần mềm:** Trước đây nhiều kỹ sư nghĩ làm PM chỉ là kẻ bảng Gantt và giục lập trình viên code đúng hạn. Trong chuẩn mới của PMI, một dự án chỉ thành công khi phần mềm đó ==hợp pháp lý, người dùng chịu sử dụng và tạo ra giá trị kinh doanh bền vững==.

## 2. Cấu trúc đề thi ECO 07/2026: Cú nhảy vọt lịch sử của Business Environment

Bài thi PMP gồm **180 câu hỏi** (175 câu tính điểm + 5 câu thử nghiệm *pretest* ẩn ngẫu nhiên không báo trước) làm trong **240 phút**, chia thành 3 chặng 60 câu với 2 kỳ nghỉ giải lao 10 phút. Thay đổi chấn động nhất của [!badge:violet:ECO 07/2026] là miền **Business Environment** tăng gấp hơn 3 lần: từ `8%` vọt lên ==26% tổng điểm bài thi==!

```visual
kind: groups
title: "Bản đồ 3 Miền Đề Thi PMP (ECO 07/2026 — Tổng 26 Tasks)"
subtitle: "~60% câu hỏi đặt trong bối cảnh Agile / Hybrid · Hơn 90% là bài toán xử lý tình huống"
columns: 3
items:
  - num: "33%"
    title: "People (Con người)"
    badge: "8 Tasks"
    tone: "emerald"
    desc: "Cô đọng năng lực lãnh đạo đội ngũ kỹ thuật và các bên liên quan."
    bullets:
      - "Lãnh đạo phục vụ (Servant Leadership), Trí tuệ cảm xúc (EI) và An toàn tâm lý"
      - "Hoà giải xung đột cộng tác, huấn luyện (Coaching) và trao quyền tự chủ"
  - num: "41%"
    title: "Process (Quy trình)"
    badge: "10 Tasks"
    tone: "amber"
    desc: "Vận hành dự án trơn tru từ lập kế hoạch đến bàn giao chất lượng."
    bullets:
      - "May đo linh hoạt (Tailoring) giữa Predictive, Iterative, Incremental, Agile & Hybrid"
      - "Kiểm soát Phạm vi, Tiến độ, Ngân sách, Chất lượng, Mua sắm và Rủi ro"
  - num: "26%"
    title: "Business Environment"
    badge: "8 Tasks · Tăng từ 8%"
    tone: "cyan"
    desc: "PM đóng vai trò cầu nối chiến lược kinh doanh chứ không chỉ giữ tiến độ."
    bullets:
      - "Thẩm định bài toán đầu tư (Business Case) và hiện thực hoá lợi ích (Benefits)"
      - "Tuân thủ luật pháp (Compliance), chuyển đổi tổ chức (OCM), ESG và quản trị AI"
```

> [!WARNING]
> **Bẫy học vẹt kiểu đại học:** Đề thi PMP hiện đại gần như không hỏi thuộc lòng định nghĩa khô khan. Đề sẽ kể một câu chuyện rắc rối dài 3–5 dòng ở công ty rồi hỏi: ==What should the project manager do FIRST / NEXT / BEST?== Cả 4 đáp án đều nghe lịch sự, nhưng chỉ **1 đáp án đi đúng trình tự tư duy chuẩn PMI**.

## 3. Kiến trúc 3 tầng của PMBOK® Guide 8 và Bản đồ PMP Mindmap

[!badge:amber:PMBOK 8] kết hợp tư duy hướng giá trị của bản 7 với hệ thống quy trình rõ ràng của bản 6 thành **3 tầng gắn kết chặt chẽ**:

- **Tầng 1 — 6 Nguyên tắc hành động (*Guiding Principles*):** Kim chỉ nam đạo đức và ra quyết định (*Holistic View · Focus on Value · Embed Quality · Accountable Leader · Integrate Sustainability · Empowered Culture*).
- **Tầng 2 — 5 Nhóm trọng tâm (*Focus Areas*):** Nhịp vận hành xuyên suốt mọi dự án (*Initiating · Planning · Executing · Monitoring & Controlling · Closing*) — ở Waterfall thì chạy theo pha lớn, còn ở Agile thì lặp lại gọn nhẹ trong mỗi Sprint 2 tuần!
- **Tầng 3 — 7 Miền hiệu suất (*Performance Domains — 40 quy trình*):** Gom gọn 10 mảng kiến thức cũ thành 7 miền trực quan: `Governance` (9), `Scope` (6), `Schedule` (3), `Finance` (4), `Stakeholders` (7), `Resources` (5) và `Risk` (6).

```visual
kind: layers
title: "Cầu nối Kiến trúc PMBOK® 8 sang 14 Chủ đề PMP Mindmap (PMA)"
subtitle: "Learning Gate rèn phản xạ ra quyết định · PMP Mindmap cung cấp sơ đồ tra cứu & 54 bộ đề"
columns:
  - title: "Khung Chuẩn PMBOK® 8 & ECO 2026"
    badge: "Tư duy & Cấu trúc mới"
    tone: "amber"
    layers:
      - label: "Business Value, Strategy & Sustainability"
        detail: "Nguyên tắc #1, #2, #5 + Miền Business Environment (26%)"
        tone: "cyan"
      - label: "Agile, Hybrid & Tailoring Approaches"
        detail: "Chiếm ~60% bối cảnh câu hỏi tình huống trong đề thi"
        tone: "emerald"
      - label: "Governance · Stakeholders · Resources"
        detail: "Điều phối thay đổi, gắn kết con người và dẫn dắt đội nhóm"
        tone: "amber"
      - label: "Scope · Schedule · Finance · Risk"
        detail: "Đổi tên Cost thành Finance; kết hợp cả Baseline lẫn Backlog"
        tone: "sky"
  - title: "14 Chủ đề trên PMP Mindmap (PMA)"
    badge: "Kho Dẫn chứng & Luyện đề"
    tone: "sky"
    layers:
      - label: "intro · business · value (Book Map)"
        detail: "Business Case, MVP/MMF, Compliance, OCM và phát triển bền vững"
        tone: "cyan"
      - label: "core.mindset · core.agile · core.adaptive"
        detail: "6 Phản xạ vàng, Scrum Roles/Events, Kanban WIP & Velocity"
        tone: "emerald"
      - label: "governance · quality · procurement · stakeholder · resource"
        detail: "Charter, CCB, QA/QC, Hợp đồng FFP/T&M, ma trận SEAM & Tuckman"
        tone: "amber"
      - label: "scope · schedule · finance · risk"
        detail: "WBS, Đường găng CPM, câu chuyện EVM (CPI/SPI) và Risk vs Issue"
        tone: "sky"
```

## 4. Tình huống thực chiến & Phản xạ vàng phòng thi

Giả sử bạn là Tech Lead vừa chuyển sang làm PM cho dự án Ví điện tử. Giữa dự án, Ngân hàng Nhà nước ban hành thông tư bắt buộc xác thực sinh trắc học mới (thuộc **Business Environment — Compliance**), khiến đội kỹ thuật hoang mang (thuộc **People**) và lịch phát hành bị đe doạ (thuộc **Process**). Một câu hỏi PMP thực thụ sẽ lồng ghép cả 3 miền này trong cùng một tình huống!

> [!TIP]
> **Lộ trình 4 bước học nhàn — nhớ sâu trên hệ thống này:**
> 1. Đọc từng bước bài học để hiểu **bản chất tiếng Việt đời thường** và câu chuyện phần mềm trước tiên.
> 2. Quan sát sơ đồ tương tác bên trái để nắm ==mối quan hệ nhân quả thay vì học vẹt công thức==.
> 3. Làm ngay bộ Quiz cuối bài để phát hiện những "thói quen chữa cháy ngoài đời" đang làm bạn chọn sai.
> 4. Bấm sang các nhánh dẫn chứng trên **PMP Mindmap** để luyện phản xạ tốc độ cao `~80 giây/câu`.
