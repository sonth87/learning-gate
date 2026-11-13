## 1. Bộ ba Scope Baseline, Quy tắc 100% WBS & Ma trận Truy vết (RTM)

Trong **PMBOK® Guide 8 (`§2.2`)**, Miền hiệu suất **Scope** (6 quy trình — đổi *Create WBS* thành *Develop Scope Structure* để bao hàm cả WBS lẫn Backlog phân cấp) [!badge:amber:PMBOK 8] định nghĩa ranh giới cực kỳ rạch ròi: **cái gì thuộc dự án và cái gì KHÔNG thuộc dự án**.

Hai bảo bối giúp PM không bao giờ để lọt yêu cầu hay làm thừa việc gồm:
- [x] **Requirements Traceability Matrix (RTM — Ma trận truy vết yêu cầu)**: Bảng nối ngược từng yêu cầu từ lúc khởi phát (**Business Need / Objective**) xuyên qua **WBS Deliverables**, **Thiết kế** cho tới tận **Test Cases**. Cứ thấy đề hỏi *"làm sao biết yêu cầu này gắn với mục tiêu kinh doanh nào hoặc đã có kịch bản test chưa?"* → chọn ngay **RTM**!
- [x] **Bộ ba bất biến của `Scope Baseline`**: Gồm đúng 3 thành phần ==Project Scope Statement== (mô tả sản phẩm, tiêu chí nghiệm thu & **Project Exclusions** — những thứ loại trừ rõ ràng) + ==WBS== (phân rã theo hướng sản phẩm bàn giao tuân thủ **100% Rule**, tầng thấp nhất là **Work Package**) + ==WBS Dictionary== (mô tả chi tiết kỹ thuật, tài khoản chi phí, tiêu chuẩn chất lượng cho từng nút WBS).

## 2. Chặn đứng Hai Kẻ Thù của Phạm vi: Scope Creep vs Gold Plating

Mọi sự phình to phạm vi không đi qua kiểm soát thay đổi chính thức đều bị PMI coi là thất bại quản trị [!badge:rose:Bẫy đề thi], bất kể xuất phát từ thiện chí hay không tốn thêm tiền mặt ngay lúc đó:

```visual
kind: compare
title: "Phân biệt Sống còn: Scope Creep vs Gold Plating"
subtitle: "Đọc đúng nguồn gốc ai là người tự ý thêm việc để chọn cách chặn chuẩn xác"
left:
  badge: "TỪ PHÍA KHÁCH / STAKEHOLDER"
  title: "Scope Creep (Trượt phạm vi)"
  tone: "rose"
  bullets:
    - "Nguồn gốc: Khách hàng hoặc Stakeholder bên ngoài liên tục nhờ vả 'tiện tay sửa thêm chút xíu' trực tiếp với Developer."
    - "Bản chất: Mở rộng phạm vi từ từ mà KHÔNG đánh giá tác động và KHÔNG đi qua Integrated Change Control (CCB)."
    - "Cách chặn: Đối chiếu Scope Statement (Exclusions) & RTM, đưa mọi yêu cầu phát sinh vào quy trình Change Request chính thức."
right:
  badge: "TỪ NỘI BỘ ĐỘI DỰ ÁN"
  title: "Gold Plating (Mạ vàng sản phẩm)"
  tone: "amber"
  bullets:
    - "Nguồn gốc: Thành viên nội bộ hoặc PM tự ý làm thêm tính năng ngoài yêu cầu để 'làm đẹp lòng khách hàng' dù khách không xin."
    - "Hậu quả ẩn: Tiêu tốn thời gian test, làm phát sinh bug mới, tăng chi phí bảo trì vận hành mà không tạo giá trị khách cần."
    - "Cách chặn: Dừng ngay lập tức việc làm thêm; nhắc lại nguyên tắc 100% Scope Baseline (nếu thực sự hữu ích, phải đề xuất Change Request!)."
```

## 3. Nhúng Chất lượng (`QA vs QC`) & Dòng chảy Nghiệm thu Bàn giao

Kết hợp **Nguyên tắc #3 (Embed Quality)** [!badge:amber:PMBOK 8] với chuỗi kiểm soát phạm vi, PMI vạch rõ hai khái niệm đầu tiên: **Quality** (mức độ đáp ứng yêu cầu — **bắt buộc phải cao, không bao giờ thoả hiệp**) khác hẳn **Grade** (cấp hạng nhiều hay ít tính năng cao cấp — *Low Grade* vẫn hoàn toàn hợp lệ nếu nhẹ gọn, không lỗi; còn *Low Quality* luôn là thảm hoạ!).

Đặc biệt, hãy khắc cốt ghi tâm **dòng chảy một chiều của sản phẩm bàn giao** kèm sự phân vai giữa **QA · QC · Validate Scope** [!badge:emerald:Phản xạ vàng]:

```visual
kind: flow
title: "Dòng chảy Nghiệm thu Bất biến từ Thực thi đến Đóng dự án"
subtitle: "Tuyệt đối KHÔNG đảo ngược thứ tự giữa Control Quality và Validate Scope!"
steps:
  - icon: "wrench"
    badge: "EXECUTING"
    title: "1. Direct & Manage + QA"
    desc: "Tạo ra Deliverable đầu tiên; đồng thời Manage Quality (QA) kiểm toán QUY TRÌNH để phòng ngừa lỗi."
    tone: "sky"
    edge: "Deliverable"
  - icon: "search"
    badge: "NỘI BỘ KIỂM TRA"
    title: "2. Control Quality (QC)"
    desc: "Đội dự án/Tester đo kiểm SẢN PHẨM so với đặc tả kỹ thuật để tìm bug (Correctness)."
    tone: "amber"
    edge: "Verified Deliverable"
  - icon: "handshake"
    badge: "KHÁCH NGHIỆM THU"
    title: "3. Validate Scope"
    desc: "Khách hàng / Sponsor kiểm tra và ký chấp nhận chính thức về mặt nghiệp vụ (Acceptance)."
    tone: "emerald"
    edge: "Accepted Deliverable"
  - icon: "lock"
    badge: "CHỐT HỒ SƠ"
    title: "4. Close Project / Phase"
    desc: "Bàn giao sản phẩm đã nghiệm thu sang vận hành, lưu Lessons Learned và giải phóng nguồn lực."
    tone: "violet"
```

```visual
kind: troubleshoot
title: "Bảng Bắt bệnh Nhanh Tình huống Chất lượng & Nghiệm thu trong Đề thi"
subtitle: "Nhìn triệu chứng để biết khâu nào bị thủng và phải sửa ở đâu"
items:
  - symptom: "Khách hàng phát hiện đầy lỗi kỹ thuật ngay trong buổi họp nghiệm thu (Validate Scope)"
    badge: "THỦNG CHỐT QC"
    tone: "rose"
    cause: "Đội dự án đã đốt cháy giai đoạn hoặc làm sơ sài bước Control Quality (trong Agile là lỏng lẻo Definition of Done)."
    fix: "Rà soát và siết chặt lại quy trình kiểm thử nội bộ (Control Quality / DoD) trước khi đem trình diễn cho khách hàng."
  - symptom: "Tỷ lệ sản phẩm lỗi lặp đi lặp lại ở nhiều gói công việc dù đội Tester (QC) vẫn bắt lỗi rất chăm"
    badge: "THIẾU QA PHÒNG NGỪA"
    tone: "amber"
    cause: "Quy trình sản xuất/coding đang có lỗ hổng hệ thống — chỉ đi dò lỗi cuối nguồn (Inspection) chứ chưa phòng ngừa (Prevention)."
    fix: "Thực hiện Manage Quality (Quality Audit + Root Cause Analysis / Ishikawa / 5 Whys) để cải tiến lại chính quy trình làm việc."
  - symptom: "Sản phẩm chạy không có bug nào (đạt QC) nhưng khách hàng vẫn từ chối ký Validate Scope"
    badge: "LỆCH KỲ VỌNG YÊU CẦU"
    tone: "violet"
    cause: "Thu thập yêu cầu ban đầu thiếu sót hoặc thiếu xác nhận tiêu chí nghiệm thu (Acceptance Criteria) với Stakeholder."
    fix: "Đối chiếu Project Scope Statement & RTM cùng khách hàng; nếu cần sửa đổi phạm vi thì lập Change Request qua CCB."
```

> [!REMEMBER] Khẩu quyết 1 dòng cứu điểm tuyệt đối
> **QA** kiểm **Quy trình** (Executing) · **QC** kiểm **Độ đúng kỹ thuật nội bộ** ra `Verified Deliverables` · **Validate Scope** để **Khách hàng ký nhận** ra `Accepted Deliverables`!
