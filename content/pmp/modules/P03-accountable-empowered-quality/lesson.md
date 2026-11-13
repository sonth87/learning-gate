## 1. Nguyên tắc #3 — Embed Quality (`PMBOK 8 §3.5`): Phòng ngừa luôn thắng Dò lỗi

Trong [!badge:amber:PMBOK 8], chất lượng không phải là "trạm gác kiểm tra ở tuần cuối cùng", mà phải được **nhúng ngay vào quy trình làm việc và thiết kế sản phẩm** (*Prevention over Inspection*). Có 3 ranh giới sinh tử giúp bạn lấy trọn điểm mọi câu hỏi chất lượng:

```visual
kind: anatomy
title: "Giải phẫu 3 Cặp Khái niệm Chất lượng Hay Bị Đánh Tráo Nhất"
subtitle: "Nắm chắc bảng này để không bao giờ sập bẫy cắt giảm kiểm thử hay nhầm QA với QC"
items:
  - keyword: "Quality vs Grade"
    role: "Mức đáp ứng yêu cầu vs Cấp hạng"
    tone: "amber"
    summary: "==Low Grade== (ít tính năng cao cấp, giao diện tối giản) hoàn toàn CÓ THỂ CHẤP NHẬN để tiết kiệm chi phí; nhưng ==Low Quality== (nhiều bug, sai đặc tả) là **TUYỆT ĐỐI CẤM**!"
    bullets:
      - "Thiếu ngân sách → hạ Grade / cắt giảm Scope thứ yếu qua Change Control, KHÔNG BAO GIỜ cắt giảm Quality."
  - keyword: "Cost of Quality (CoQ)"
    role: "Conformance vs Nonconformance"
    tone: "emerald"
    summary: "Đầu tư tiền vào **Cost of Conformance** (đào tạo, chuẩn hoá quy trình, CI/CD, test) rẻ hơn gấp chục lần cái giá của **Cost of Nonconformance** (làm lại, bảo hành, mất uy tín)."
    bullets:
      - "Lỗi do khách hàng phát hiện ngoài thị trường (External Failure Cost) là loại chi phí đắt đỏ và nguy hiểm nhất."
  - keyword: "QA · QC · Validate"
    role: "Quy trình → Nội bộ → Khách hàng"
    tone: "sky"
    summary: "**Manage Quality / QA** kiểm tra & cải tiến *quy trình* (thuộc Governance PMBOK 8); **Control Quality / QC** kiểm sản phẩm nội bộ tạo ra `Verified Deliverable`; **Validate Scope** cùng khách nghiệm thu tạo ra `Accepted Deliverable`."
    bullets:
      - "Luôn chạy Control Quality TRƯỚC Validate Scope (trừ phi kiểm thử song song trong Sprint Review)."
```

## 2. Nguyên tắc #4 — Be an Accountable Leader (`PMBOK 8 §3.6`): Chính trực & Báo tin xấu sớm

Nguyên tắc này hoà quyện tinh thần **Stewardship** (người quản gia chính trực) với **Quy tắc Đạo đức và Ứng xử Nghề nghiệp PMI** (*Responsibility, Respect, Fairness, Honesty*).

- [x] **Trung thực tuyệt đối với dữ liệu:** Khi `SPI < 1` hoặc phát hiện lỗi nghiêm trọng, PM phải **báo cáo minh bạch ngay lập tức** kèm phân tích nguyên nhân và phương án khắc phục — [!badge:rose:Bẫy đề thi] tuyệt đối không "làm đẹp số liệu" dù chính cấp trên ép buộc!
- [x] **Không dung túng vi phạm đạo đức / xung đột lợi ích:** Từ chối quà biếu vượt chuẩn từ nhà thầu, khai báo ngay nếu có người thân dự thầu, tôn trọng bản quyền sở hữu trí tuệ và bảo mật dữ liệu (kể cả khi dùng công cụ AI công cộng).
- [x] **Lãnh đạo thích ứng (Situational Leadership):** Định hướng rõ khi nhóm mới thành lập (*Forming*), nhưng lùi lại huấn luyện và phục vụ khi nhóm đã trưởng thành (*Performing*).

## 3. Nguyên tắc #6 — Build an Empowered Culture (`PMBOK 8 §3.8`): An toàn tâm lý & Tự tổ chức

Một tập thể sợ bị đổ lỗi sẽ giấu giếm rủi ro cho đến khi dự án nổ tung. [!badge:emerald:Phản xạ vàng] PM và Scrum Master kiến tạo văn hoá trao quyền thông qua sự đối lập rõ rệt với kiểu quản lý vi mô (*Micromanagement*):

```visual
kind: compare
title: "Quản lý Vi mô Áp đặt vs Văn hoá Trao quyền Chuẩn PMBOK 8"
subtitle: "Người trực tiếp thực thi công việc là người hiểu rõ nhất nỗ lực và giải pháp kỹ thuật"
left:
  badge: "MICROMANAGEMENT (SAI)"
  title: "Áp đặt · Đổ lỗi · Kiểm soát từng giờ"
  tone: "rose"
  bullets:
    - "PM hoặc Tech Lead tự ước lượng giờ công rồi ép các thành viên cam kết chạy theo."
    - "Khi xảy ra sự cố Production, mở cuộc họp truy tìm 'thủ phạm' để kỷ luật cá nhân."
    - "Tự đặt ra nội quy nhóm từ trên xuống rồi dán lên tường bắt mọi người ký tên."
right:
  badge: "EMPOWERED CULTURE (ĐÚNG)"
  title: "Tự tổ chức · An toàn tâm lý · Học hỏi"
  tone: "emerald"
  bullets:
    - "Nhóm chuyên môn trực tiếp ước lượng (Planning Poker / Bottom-up) và tự chia đầu việc."
    - "Tổ chức Blameless Retrospective / Lessons Learned để sửa lỗ hổng quy trình hệ thống."
    - "Cả nhóm cùng thảo luận và đồng thuận xây dựng Team Charter (Social Contract) chung."
```

> [!TIP] Câu thần chú nhận diện Servant Leader trong đề thi
> Mỗi khi nhóm bị kẹt bởi thủ tục rườm rà, xung đột phòng ban hoặc bị các Stakeholder bên ngoài lao vào gián đoạn công việc, nhiệm vụ tối thượng của bạn là làm **chiếc lá chắn bảo vệ sự tập trung của nhóm** và **tháo gỡ trở ngại (Remove Impediments)**.
