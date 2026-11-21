## 1. Giải mã bằng ví dụ phần mềm: `WBS` (Quy tắc 100%), `RTM` và `Scope Baseline` là gì?

Khi nhận dự án xây dựng **Ứng dụng Ngân hàng Số**, nếu bạn chỉ ghi danh sách việc lặt vặt kiểu *"Tuần 1 họp thiết kế, Tuần 2 viết code, Tuần 3 sửa bug"* thì rất dễ bỏ sót cả một mảng chức năng lớn! Trong **PMBOK® Guide 8 (`§2.2` — Miền Scope)**, PMI sử dụng 3 công cụ cực kỳ chặt chẽ để khóa ranh giới **những gì thuộc dự án và những gì KHÔNG thuộc dự án**:

- **WBS (*Work Breakdown Structure* — Cây phân rã công việc theo sản phẩm bàn giao):** Sơ đồ hình cây chẻ nhỏ sản phẩm lớn thành các cụm kết quả cụ thể (ví dụ: `1.1 Module Định danh eKYC`, `1.2 Module Chuyển khoản 24/7`, `1.3 Cổng đối soát`). Cây WBS bắt buộc tuân thủ ==Quy tắc 100% (100% Rule)==: tổng toàn bộ nhánh con cộng lại phải bằng **đúng 100% nhánh cha** — không thiếu bất kỳ hạng mục nào và không đẻ thừa việc ngoài phạm vi! Tầng lá thấp nhất của WBS dùng để ước lượng thời gian và chi phí gọi là **Work Package (*Gói công việc*)**.
- **Scope Baseline (*Đường cơ sở phạm vi*):** Bộ ba văn kiện bất biến gồm **(1) Project Scope Statement** (mô tả sản phẩm, tiêu chí nghiệm thu và mục **Exclusions** ghi rõ những gì *loại trừ không làm*) + **(2) WBS** + **(3) WBS Dictionary** (từ điển mô tả chi tiết kỹ thuật, điều kiện chất lượng cho từng gói công việc trên WBS).
- **RTM (*Requirements Traceability Matrix* — Ma trận truy vết yêu cầu):** Bảng đối chiếu nối liền mạch từng yêu cầu từ gốc **Mục tiêu kinh doanh** → **Nút WBS** → **Thiết kế kỹ thuật** → **Kịch bản kiểm thử (Test Case)**. Hễ cần kiểm tra xem một tính năng có phục vụ mục tiêu đầu tư nào không hay đã được viết test chưa, PM mở ngay `RTM`!

## 2. Hai kẻ thù thầm lặng phá nát dự án: `Scope Creep` vs `Gold Plating`

Trong ngành phần mềm, dự án trễ hạn và cháy túi thường không phải do một thay đổi khổng lồ, mà do hàng chục thay đổi nhỏ lọt qua kẽ tay không ai kiểm soát. Hãy phân biệt thật rõ nguồn gốc của 2 căn bệnh này:

```visual
kind: compare
title: "Phân biệt Sống còn: Scope Creep vs Gold Plating"
subtitle: "Dù khách hàng nhờ vả hay lập trình viên tự tặng thêm, không qua kiểm soát thay đổi đều là SAI!"
left:
  badge: "TỪ PHÍA KHÁCH HÀNG / STAKEHOLDER"
  title: "Scope Creep (Khách lén nhét thêm việc)"
  tone: "rose"
  bullets:
    - "Tình huống thực tế: Khách hàng đi ăn trưa với Developer rồi nhắn riêng 'Tiện tay thêm giúp anh nút xuất báo cáo ra định dạng biểu đồ động nhé, nhỏ xíu thôi!'."
    - "Bản chất: Phạm vi bị phình to từng chút một từ bên ngoài mà KHÔNG đánh giá tác động và KHÔNG đi qua CCB (hoặc PO trong Agile)."
    - "Cách chặn chuẩn PMI: Đối chiếu Project Scope Statement (Exclusions) & RTM, hướng dẫn đưa mọi yêu cầu mới vào quy trình Change Request chính thức."
right:
  badge: "TỪ NỘI BỘ ĐỘI DỰ ÁN"
  title: "Gold Plating (Dev tự ý vẽ thêm tính năng)"
  tone: "amber"
  bullets:
    - "Tình huống thực tế: Senior Dev thấy còn dư 2 ngày nên tự ý code thêm hiệu ứng chuyển cảnh 3D và bộ lọc giọng nói dù khách hàng không hề yêu cầu để 'gây bất ngờ'."
    - "Tác hại ngầm: Chiếm mất giờ kiểm thử của Tester, đẻ ra lỗi mới không đáng có và đẩy gánh nặng bảo trì lâu dài lên vai hệ thống."
    - "Cách chặn chuẩn PMI: Dừng ngay việc làm thêm ngoài Baseline! Nếu ý tưởng thực sự đắt giá, phải lập Change Request trình duyệt đàng hoàng."
```

> [!WARNING]
> **Bẫy "Miễn phí không tốn tiền" trong đề thi:** Đề bài rất hay gài câu *"Lập trình viên khẳng định tính năng làm thêm này hoàn toàn không tốn thêm chi phí và không làm trễ lịch"*. Đừng mắc lừa! ==Mọi hạng mục nằm ngoài Scope Baseline chưa được phê duyệt đều là Gold Plating và phải từ chối thực hiện trực tiếp==.

## 3. Phân biệt rạch ròi bộ ba dễ nhầm nhất: `QA` vs `QC` vs `Validate Scope`

Trong một dự án phần mềm thực tế, sản phẩm từ lúc viết dòng code đầu tiên đến lúc khách hàng ký biên bản thanh toán phải đi qua **3 chốt chặn hoàn toàn khác nhau về mục đích**:

- **QA (*Manage Quality / Quality Assurance* — Đảm bảo chất lượng ở QUY TRÌNH):** Diễn ra ngay trong lúc đang làm dự án (*Executing*). QA không đi bắt từng con bug trên màn hình, mà **kiểm toán quy trình làm việc** (*Quality Audit*): *"Đội dự án có thực sự tuân thủ quy trình Peer Code Review và chạy CI/CD tự động như đã cam kết không, hay đang bỏ bước?"* → Mục tiêu là **Phòng ngừa lỗi từ gốc (Prevention)**.
- **QC (*Control Quality* — Kiểm soát chất lượng SẢN PHẨM nội bộ):** Đội dự án / Tester trực tiếp chạy kiểm thử đo đếm sản phẩm so với đặc tả kỹ thuật để bắt bug (*Inspection / Correctness*). Sản phẩm vượt qua cửa QC nội bộ sẽ mang tên **`Verified Deliverable` (*Sản phẩm đã xác minh kỹ thuật*)**.
- **Validate Scope (*Khách hàng nghiệm thu phạm vi*):** Đem chính `Verified Deliverable` đó sang cùng Khách hàng / Sponsor chạy nghiệm thu nghiệp vụ (*UAT — Acceptance*). Khi khách hàng gật đầu ký biên bản chấp nhận, sản phẩm chính thức trở thành **`Accepted Deliverable` (*Sản phẩm đã được nghiệm thu*)** đủ điều kiện chuyển sang bước Đóng dự án!

```visual
kind: flow
title: "Chuỗi Nghiệm thu Một chiều Bất biến trong Đề thi PMP"
subtitle: "Luôn chạy Control Quality (nội bộ) TRƯỚC khi họp Validate Scope (khách hàng)!"
steps:
  - icon: "wrench"
    badge: "1. EXECUTING + QA"
    title: "Thực thi & Manage Quality"
    desc: "Đội phát triển tạo ra Deliverable; QA kiểm toán quy trình để ngăn ngừa lỗi hệ thống."
    tone: "sky"
    edge: "Deliverable"
  - icon: "search"
    badge: "2. NỘI BỘ TEST"
    title: "Control Quality (QC)"
    desc: "Kiểm tra độ đúng kỹ thuật nội bộ, diệt sạch lỗi trước khi mang ra ngoài."
    tone: "amber"
    edge: "Verified Deliverable"
  - icon: "handshake"
    badge: "3. KHÁCH DUYỆT UAT"
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

## 4. Tình huống thực chiến & Bảng bắt bệnh nhanh phòng thi

```visual
kind: troubleshoot
title: "Chẩn đoán 3 Tình huống Đứt gãy Chất lượng & Nghiệm thu Kinh điển"
subtitle: "Nhìn vị trí phát hiện vấn đề để khoanh trúng quy trình cần củng cố"
items:
  - symptom: "Đang họp nghiệm thu UAT (Validate Scope) thì khách hàng bấm đâu cũng văng lỗi kỹ thuật"
    badge: "LỖ HỔNG Ở CONTROL QUALITY"
    tone: "rose"
    cause: "Đội dự án đã bỏ qua hoặc làm qua loa bước kiểm thử nội bộ (QC / Definition of Done)."
    fix: "Siết chặt lại bước **Control Quality** nội bộ để đảm bảo sản phẩm đạt chuẩn Verified trước khi mời khách hàng nghiệm thu."
  - symptom: "Dù Tester làm việc hết công suất, cùng một kiểu lỗi bảo mật vẫn lặp đi lặp lại ở mọi module mới"
    badge: "LỖ HỔNG Ở MANAGE QUALITY (QA)"
    tone: "amber"
    cause: "Quy trình viết code đang thiếu chuẩn phòng ngừa — chỉ lo vớt lỗi ở cuối dòng."
    fix: "Thực hiện **Manage Quality** (Quality Audit + Phân tích nguyên nhân gốc rễ 5 Whys / Biểu đồ xương cá Ishikawa) để cải tiến lại quy trình."
  - symptom: "Phần mềm chạy mượt không một con bug (đạt QC), nhưng khách hàng vẫn từ chối ký nghiệm thu"
    badge: "LỆCH YÊU CẦU / KỲ VỌNG"
    tone: "cyan"
    cause: "Khâu thu thập yêu cầu và thống nhất tiêu chí nghiệm thu ban đầu bị hiểu sai ý nghiệp vụ."
    fix: "Cùng khách hàng rà soát lại **Project Scope Statement & RTM**; nếu cần điều chỉnh tính năng thì thực hiện qua quy trình Change Request."
```

> [!TIP]
> **Mẹo nhớ 1 dòng ăn trọn điểm:** ==QA soi QUY TRÌNH== · ==QC soi LỖI NỘI BỘ tạo ra Verified Deliverable== · ==Validate Scope xin CHỮ KÝ KHÁCH HÀNG tạo ra Accepted Deliverable==!
