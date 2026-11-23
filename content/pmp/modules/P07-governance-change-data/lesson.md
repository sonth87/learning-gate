## 1. Vai trò của Điều lệ dự án (`Project Charter`) và thẩm quyền phê duyệt thay đổi (`CCB` vs `Product Owner`)

Trong **PMBOK® Guide 8 (`§2.1`)**, miền **Governance** (*Quản trị điều phối — 9 quy trình*) đóng vai trò khung pháp lý và cơ chế kiểm soát của toàn bộ dự án. Hai vấn đề thường gây nhầm lẫn là vai trò thực chất của **Project Charter** và ranh giới khi nào thay đổi cần trình **Hội đồng CCB** so với khi nào chỉ cần **Product Owner** phê duyệt.

- **Project Charter (*Điều lệ dự án*):** Văn bản chính thức do **Project Sponsor ký ban hành** để công nhận sự tồn tại của dự án và trao thẩm quyền hợp pháp cho PM sử dụng ngân sách, hạ tầng và nhân sự liên phòng ban (thường được ví như giấy khai sinh của dự án). Nếu chỉ được giao nhiệm vụ bằng lời nói mà chưa có `Project Charter`, PM không có cơ sở chính thức để điều phối nguồn lực từ các phòng ban khác.
- **Thẩm quyền phê duyệt thay đổi — `CCB` (*Change Control Board*) vs `Product Owner` (`PO`):**
  - **Trình `CCB` qua quy trình `PICC` (*Perform Integrated Change Control — Kiểm soát thay đổi tích hợp*):** Áp dụng khi dự án chạy theo **Predictive** (hoặc phần hợp đồng cố định của dự án **Hybrid**) và **đã khóa `Scope / Schedule / Cost Baseline`**. Mọi thay đổi làm dịch chuyển đường cơ sở đã cam kết đều phải qua CCB xét duyệt chính thức.
  - **Chỉ cần `Product Owner` điều chỉnh `Product Backlog` (KHÔNG cần CCB):** Áp dụng khi thay đổi tính năng nằm trong phạm vi dự án **Agile** (nơi Timebox và Ngân sách giữ ổn định, còn phạm vi chi tiết linh hoạt theo giá trị). Tuy nhiên, nếu trong dự án Hybrid mà thay đổi làm ảnh hưởng **cột mốc hợp đồng hoặc vượt tổng trần ngân sách**, vẫn phải trình CCB/Sponsor phê duyệt.

```visual
kind: compare
title: "Đối chiếu Project Charter và Project Management Plan"
subtitle: "Nắm chắc người ký duyệt, mục đích sử dụng và thời điểm kiểm soát thay đổi của hai tài liệu trụ cột"
left:
  badge: "SPONSOR KÝ BAN HÀNH"
  title: "Project Charter (Điều lệ dự án)"
  tone: "amber"
  bullets:
    - "Công nhận chính thức sự tồn tại của dự án dựa trên Business Case và Benefits Management Plan."
    - "Cấp thẩm quyền hợp pháp cho Project Manager huy động nguồn lực liên phòng ban."
    - "Nêu mục tiêu cấp cao, mốc lớn (Summary Milestones), ngân sách khái quát và rủi ro tổng thể."
    - "PM có thể tham gia soạn thảo, nhưng người ký phê duyệt BẮT BUỘC là Sponsor."
right:
  badge: "PM TÍCH HỢP & ĐIỀU HÀNH"
  title: "Project Management Plan (Kế hoạch QLDA)"
  tone: "emerald"
  bullets:
    - "Bản thiết kế tổng thể chỉ rõ cách thức thực thi, theo dõi, kiểm soát và đóng dự án."
    - "Tổng hợp các kế hoạch thành phần và 3 đường cơ sở: Scope, Schedule, Cost Baselines."
    - "TRƯỚC khi chốt Baseline: PM và đội dự án cập nhật hoàn thiện không cần trình CCB."
    - "SAU khi đã chốt Baseline: mọi thay đổi chạm tới Baseline đều phải đi qua PICC / CCB."
```

## 2. Quy trình 5 bước Kiểm soát Thay đổi Tích hợp (`PICC`) qua Hội đồng `CCB`

Sau khi dự án Predictive đã chốt `Baseline`, bất kỳ yêu cầu thêm/bớt tính năng, dời lịch, rút quỹ *Management Reserve*, hay đề xuất sửa sai (*Corrective Action · Preventive Action · Defect Repair*) đều phải đi qua **đúng thứ tự 5 bước** dưới đây:

```visual
kind: flow
title: "5 Bước Xử lý Yêu cầu Thay đổi (PICC & CCB)"
subtitle: "Đảo lộn thứ tự các bước trong câu hỏi FIRST / NEXT sẽ dẫn đến phương án sai"
steps:
  - icon: "search"
    badge: "BƯỚC 1 · FIRST"
    title: "Phân tích tác động cùng nhóm"
    desc: "Đánh giá ảnh hưởng chéo lên Phạm vi, Tiến độ, Chi phí, Chất lượng và Rủi ro trước tiên."
    tone: "amber"
    edge: "Rõ tác động"
  - icon: "file"
    badge: "BƯỚC 2 · LOG"
    title: "Lập Change Request & Ghi sổ"
    desc: "Chính thức hoá thành văn bản Change Request và ghi trạng thái chờ xét vào Change Log."
    tone: "sky"
    edge: "Đệ trình phương án"
  - icon: "scale"
    badge: "BƯỚC 3 · DECIDE"
    title: "Hội đồng CCB xem xét"
    desc: "CCB (hoặc Sponsor theo quy định trong Change Management Plan) phê duyệt, hoãn hoặc bác bỏ."
    tone: "cyan"
    edge: "Có quyết định"
  - icon: "refresh"
    badge: "BƯỚC 4 · UPDATE"
    title: "Cập nhật Change Log & Baselines"
    desc: "Ghi kết quả vào Change Log; nếu ĐƯỢC DUYỆT thì cập nhật lại Baselines và PM Plan."
    tone: "emerald"
    edge: "Đồng bộ thông tin"
  - icon: "play"
    badge: "BƯỚC 5 · EXECUTE"
    title: "Thông báo & Triển khai thực hiện"
    desc: "Truyền thông tới các Stakeholder liên quan và chỉ đạo đội dự án thực hiện theo Baseline mới."
    tone: "violet"
```

> [!WARNING]
> **Hai lỗi thường gặp trong đề thi PMP về Change Control:**
> 1. **Trình yêu cầu khi chưa đánh giá tác động:** Vừa nghe khách hàng đề xuất thay đổi liền chọn *"Submit a change request to the CCB immediately"* là **SAI** — PM phải ==phân tích tác động cùng đội chuyên môn trước== rồi mới đệ trình.
> 2. **Bỏ qua bước ghi nhận khi bị từ chối:** Khi CCB bác bỏ yêu cầu (*Rejected*), PM vẫn bắt buộc ==cập nhật trạng thái Rejected kèm lý do vào Change Log== và thông báo minh bạch cho người đề xuất.

## 3. Quy trình chuyển hóa dữ liệu dự án: `WPD → WPI → WPR` và Quản trị Tri thức

Để trả lời chính xác các câu hỏi về theo dõi và báo cáo tiến độ, cần phân biệt cách dữ liệu dự án được thu thập, phân tích và đóng gói qua 3 cấp độ:

```visual
kind: anatomy
title: "Dòng chảy Dữ liệu (WPD → WPI → WPR) và Hai loại Tri thức Dự án"
subtitle: "Phân biệt dữ liệu thô, thông tin đã đối chiếu kế hoạch và báo cáo gửi lãnh đạo"
items:
  - keyword: "WPD (Work Performance Data)"
    role: "Dữ liệu đo đạc thô tại hiện trường (Executing)"
    tone: "slate"
    summary: "Số liệu thực tế chưa đối chiếu với kế hoạch: ví dụ *'Task A đã hoàn thành 60%'*, *'Phát sinh 14 lỗi trên Jira'*, *'Đã chi thực tế 500 triệu VNĐ'*."
  - keyword: "WPI (Work Performance Information)"
    role: "Thông tin đã phân tích so chuẩn (Controlling)"
    tone: "sky"
    summary: "Kết quả sau khi đem WPD đối chiếu với Baseline: ví dụ *'CPI = 0.85, dự án đang vượt ngân sách 15% và có nguy cơ trễ mốc UAT 2 tuần'*."
  - keyword: "WPR (Work Performance Reports)"
    role: "Báo cáo tổng hợp phục vụ ra quyết định (Governance)"
    tone: "emerald"
    summary: "Tập hợp WPI thành Dashboard, biểu đồ S-Curve, Status Report gửi tới Sponsor, CCB và các bên liên quan."
  - keyword: "Explicit vs Tacit Knowledge"
    role: "Tri thức Hiện vs Tri thức Ẩn"
    tone: "amber"
    summary: "**Explicit** có thể văn bản hóa trên tài liệu/Confluence (tài liệu kiến trúc, số liệu); **Tacit** là kinh nghiệm thực tiễn gắn với cá nhân chuyên gia — cần truyền đạt qua **trao đổi, kèm cặp trực tiếp (Shadowing / Pairing) và hội thảo chia sẻ**."
```

## 4. Quy trình Đóng dự án hoặc Giai đoạn (`Close Project or Phase`)

Một sai lầm phổ biến là cho rằng khi khách hàng ký nghiệm thu hoặc khi dự án bị hủy giữa chừng thì có thể giải tán nhân sự ngay lập tức mà không cần thực hiện thủ tục đóng.

> [!TIP]
> **Quy tắc bắt buộc khi Đóng dự án (kể cả khi bị hủy sớm):**
> 1. Xác nhận sản phẩm bàn giao đã có nghiệm thu chính thức (`Accepted Deliverables`) hoặc kiểm kê toàn bộ phần việc đã hoàn thành tới thời điểm dừng và ghi rõ lý do chấm dứt dự án.
> 2. Chuyển giao sản phẩm sang bộ phận Vận hành (*Operations*), hoàn tất thanh lý hợp đồng và đánh giá mức độ hài lòng của các bên.
> 3. Lưu trữ bài học kinh nghiệm từ *Lessons Learned Register* vào **Kho tri thức chung của tổ chức (*OPA — Organizational Process Assets*)**, phát hành *Final Report*, và ==giải phóng nhân sự đội dự án ở bước cuối cùng==.
