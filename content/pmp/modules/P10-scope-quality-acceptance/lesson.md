## 1. Cấu trúc phân rã công việc (`WBS`), Ma trận truy vết (`RTM`) và `Scope Baseline`

Trong dự án xây dựng **Ứng dụng Ngân hàng Số**, nếu chỉ liệt kê các đầu việc rời rạc theo thời gian thì rất dễ bỏ sót thành phần chức năng quan trọng. Trong **PMBOK® Guide 8 (`§2.2` — Miền Scope)**, PMI sử dụng 3 công cụ cốt lõi để xác lập ranh giới **những gì thuộc phạm vi dự án và những gì nằm ngoài phạm vi**:

- **WBS (*Work Breakdown Structure* — Cấu trúc phân rã công việc theo sản phẩm bàn giao):** Sơ đồ phân cấp chia nhỏ sản phẩm lớn thành các thành phần bàn giao cụ thể (ví dụ: `1.1 Module Định danh eKYC`, `1.2 Module Chuyển khoản 24/7`, `1.3 Cổng đối soát`). WBS tuân thủ ==Quy tắc 100% (100% Rule)==: tổng các nhánh con phải bao phủ **đúng 100% phạm vi của nhánh cha** — không thiếu hạng mục đã cam kết và không tự ý thêm phần việc ngoài phạm vi. Mức thấp nhất của WBS dùng để ước lượng thời gian và chi phí gọi là **Work Package (*Gói công việc*)**.
- **Scope Baseline (*Đường cơ sở phạm vi*):** Tập hợp 3 tài liệu chính thức gồm **(1) Project Scope Statement** (mô tả phạm vi sản phẩm, tiêu chí nghiệm thu và mục **Exclusions** ghi rõ các phần *loại trừ không thực hiện*) + **(2) WBS** + **(3) WBS Dictionary** (mô tả chi tiết kỹ thuật và điều kiện chất lượng cho từng gói công việc trên WBS).
- **RTM (*Requirements Traceability Matrix* — Ma trận truy vết yêu cầu):** Bảng liên kết từng yêu cầu từ nguồn gốc **Mục tiêu kinh doanh** → **Nút WBS** → **Thiết kế kỹ thuật** → **Kịch bản kiểm thử (Test Case)**. Khi cần kiểm tra một tính năng phục vụ mục tiêu đầu tư nào hoặc đã có ca kiểm thử tương ứng chưa, PM tra cứu trực tiếp trên `RTM`.

## 2. Phân biệt hai rủi ro làm biến dạng phạm vi: `Scope Creep` và `Gold Plating`

Dự án vượt ngân sách và trễ hạn thường không chỉ bắt nguồn từ một thay đổi lớn, mà từ hàng loạt bổ sung nhỏ không qua quy trình kiểm soát. Cần phân biệt rõ nguồn gốc của 2 hiện tượng sau:

```visual
kind: compare
title: "Phân biệt hai hiện tượng lệch phạm vi: Scope Creep và Gold Plating"
subtitle: "Dù yêu cầu đến từ khách hàng hay do đội dự án tự thêm vào, việc bỏ qua kiểm soát thay đổi đều sai quy chuẩn"
left:
  badge: "TỪ PHÍA KHÁCH HÀNG / STAKEHOLDER"
  title: "Scope Creep (Phạm vi phình to không kiểm soát)"
  tone: "rose"
  bullets:
    - "Tình huống thực tế: Khách hàng trao đổi riêng với Developer 'Tiện tay thêm giúp anh nút xuất báo cáo ra định dạng biểu đồ động nhé, nhỏ xíu thôi!'."
    - "Bản chất: Phạm vi tăng dần từng phần nhỏ từ yêu cầu bên ngoài mà KHÔNG đánh giá tác động và KHÔNG đi qua CCB (hoặc PO trong Agile)."
    - "Cách xử lý chuẩn PMI: Đối chiếu Project Scope Statement (Exclusions) & RTM, hướng dẫn đưa yêu cầu mới vào quy trình Change Request chính thức."
right:
  badge: "TỪ NỘI BỘ ĐỘI DỰ ÁN"
  title: "Gold Plating (Tự ý thêm tính năng ngoài yêu cầu)"
  tone: "amber"
  bullets:
    - "Tình huống thực tế: Senior Dev thấy còn dư 2 ngày nên tự ý lập trình thêm hiệu ứng chuyển cảnh 3D và bộ lọc giọng nói dù khách hàng không yêu cầu."
    - "Tác hại thực tế: Tiêu tốn thời gian kiểm thử của Tester, phát sinh lỗi mới không cần thiết và tăng gánh nặng bảo trì lâu dài."
    - "Cách xử lý chuẩn PMI: Dừng việc làm thêm ngoài Baseline; nếu ý tưởng thực sự có giá trị, phải lập Change Request trình phê duyệt trước."
```

> [!WARNING]
> **Lưu ý với phương án "miễn phí, không tốn thêm ngân sách":** Đề bài thường đặt tình huống *"Lập trình viên khẳng định tính năng làm thêm này hoàn toàn không tốn thêm chi phí và không làm trễ lịch"*. Theo chuẩn PMI, ==mọi hạng mục nằm ngoài Scope Baseline chưa được phê duyệt đều là Gold Plating và không được tự ý thực hiện==.

## 3. Phân biệt 3 hoạt động kiểm soát: `Quality Assurance (QA)`, `Quality Control (QC)` và `Validate Scope`

Từ lúc sản phẩm được xây dựng đến khi khách hàng ký biên bản chấp nhận, sản phẩm phải đi qua **3 hoạt động kiểm soát khác nhau về mục tiêu và chủ thể thực hiện**:

- **QA (*Manage Quality / Quality Assurance* — Đảm bảo chất lượng quy trình):** Diễn ra xuyên suốt quá trình thực thi (*Executing*). QA không trực tiếp sửa lỗi trên sản phẩm, mà **kiểm toán quy trình làm việc** (*Quality Audit*) để xác minh đội dự án có tuân thủ quy chuẩn (như Peer Code Review, chạy CI/CD tự động) hay không → Mục tiêu là **Phòng ngừa lỗi từ gốc (Prevention)**.
- **QC (*Control Quality* — Kiểm soát chất lượng sản phẩm nội bộ):** Đội dự án / Tester trực tiếp kiểm thử, đo lường sản phẩm so với đặc tả kỹ thuật để phát hiện sai sót (*Inspection / Correctness*). Sản phẩm vượt qua bước QC nội bộ trở thành **`Verified Deliverable` (*Sản phẩm đã xác minh kỹ thuật*)**.
- **Validate Scope (*Khách hàng nghiệm thu phạm vi*):** Đem `Verified Deliverable` trình diễn và nghiệm thu nghiệp vụ (*UAT — User Acceptance Testing*) cùng Khách hàng / Sponsor. Khi khách hàng ký biên bản chấp nhận, sản phẩm chính thức trở thành **`Accepted Deliverable` (*Sản phẩm đã được nghiệm thu*)** để chuyển sang thủ tục Đóng dự án.

```visual
kind: flow
title: "Trình tự Kiểm soát Chất lượng và Nghiệm thu trong Đề thi PMP"
subtitle: "Luôn hoàn thành Control Quality (nội bộ) TRƯỚC khi tiến hành Validate Scope (khách hàng)"
steps:
  - icon: "wrench"
    badge: "1. EXECUTING + QA"
    title: "Thực thi & Manage Quality"
    desc: "Đội phát triển tạo ra Deliverable; QA kiểm toán quy trình để ngăn ngừa lỗi hệ thống."
    tone: "sky"
    edge: "Deliverable"
  - icon: "search"
    badge: "2. KIỂM TRA NỘI BỘ"
    title: "Control Quality (QC)"
    desc: "Kiểm tra độ chính xác kỹ thuật nội bộ, khắc phục lỗi trước khi chuyển sang bước nghiệm thu."
    tone: "amber"
    edge: "Verified Deliverable"
  - icon: "handshake"
    badge: "3. KHÁCH NGHIỆM THU"
    title: "Validate Scope"
    desc: "Khách hàng / Sponsor kiểm tra tính phù hợp nghiệp vụ và ký nghiệm thu chính thức."
    tone: "emerald"
    edge: "Accepted Deliverable"
  - icon: "lock"
    badge: "4. KẾT THÚC"
    title: "Close Project or Phase"
    desc: "Bàn giao sản phẩm sang vận hành, thanh lý hợp đồng và lưu trữ bài học kinh nghiệm."
    tone: "cyan"
```

## 4. Phân tích 3 tình huống sai lệch phổ biến về chất lượng và nghiệm thu

```visual
kind: troubleshoot
title: "Phân tích 3 Tình huống Sai lệch Chất lượng & Nghiệm thu Thường gặp"
subtitle: "Xác định đúng giai đoạn phát sinh vấn đề để chọn quy trình khắc phục tương ứng"
items:
  - symptom: "Đang họp nghiệm thu UAT (Validate Scope) thì khách hàng phát hiện nhiều lỗi kỹ thuật"
    badge: "THIẾU SÓT Ở CONTROL QUALITY"
    tone: "rose"
    cause: "Đội dự án đã bỏ qua hoặc thực hiện chưa đầy đủ bước kiểm thử nội bộ (QC / Definition of Done)."
    fix: "Tăng cường bước **Control Quality** nội bộ để đảm bảo sản phẩm đạt chuẩn Verified trước khi mời khách hàng nghiệm thu."
  - symptom: "Dù Tester kiểm tra kỹ, cùng một dạng lỗi bảo mật vẫn lặp đi lặp lại ở mọi module mới"
    badge: "VẤN ĐỀ Ở MANAGE QUALITY (QA)"
    tone: "amber"
    cause: "Quy trình lập trình đang thiếu chuẩn phòng ngừa — chỉ xử lý sửa lỗi ở cuối công đoạn."
    fix: "Thực hiện **Manage Quality** (Quality Audit + Phân tích nguyên nhân gốc rễ 5 Whys / Biểu đồ Ishikawa) để cải tiến lại quy trình."
  - symptom: "Phần mềm vận hành ổn định không có lỗi kỹ thuật (đạt QC), nhưng khách hàng vẫn từ chối nghiệm thu"
    badge: "LỆCH YÊU CẦU / KỲ VỌNG"
    tone: "cyan"
    cause: "Khâu thu thập yêu cầu và thống nhất tiêu chí nghiệm thu ban đầu chưa khớp với nhu cầu nghiệp vụ."
    fix: "Cùng khách hàng rà soát lại **Project Scope Statement & RTM**; nếu cần điều chỉnh tính năng thì thực hiện qua quy trình Change Request."
```

> [!TIP]
> **Tóm tắt phân biệt nhanh:** ==QA kiểm toán QUY TRÌNH== · ==QC kiểm tra SẢN PHẨM NỘI BỘ tạo ra Verified Deliverable== · ==Validate Scope lấy XÁC NHẬN KHÁCH HÀNG tạo ra Accepted Deliverable==.
