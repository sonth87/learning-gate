## 1. Giải mã bằng ví dụ phần mềm: Giấy khai sinh dự án (`Project Charter`) & Khi nào cần `CCB` vs khi nào chỉ cần `PO`?

Trong **PMBOK® Guide 8 (`§2.1`)**, miền **Governance** (*Quản trị điều phối — 9 quy trình*) đóng vai trò bộ khung xương pháp lý và kiểm soát của toàn bộ dự án. Người mới học PMP thường bối rối nhất ở 2 câu hỏi thực tế: *"Project Charter dùng làm gì?"* và *"Tại sao lúc thì bắt trình Hội đồng CCB rườm rà, lúc thì bảo chỉ cần Product Owner gật đầu là xong?"*

Hãy dùng câu chuyện xây dựng hệ thống ERP cho tập đoàn để phân biệt rạch ròi ngay từ phút đầu:

- **Project Charter (*Hiến chương / Giấy khai sinh dự án*):** Hãy tưởng tượng Tổng Giám đốc miệng bảo bạn làm PM dự án mới, nhưng chưa hề ký văn bản bổ nhiệm chính thức. Khi bạn sang phòng Hạ tầng xin cấp 10 máy chủ Cloud hay sang phòng Nhân sự mượn 3 lập trình viên giỏi, các trưởng phòng sẽ từ chối ngay vì *"anh lấy tư cách gì điều người của tôi?"*. `Project Charter` do **Project Sponsor ký ban hành** chính là ==tờ giấy khai sinh trao thẩm quyền chính thức cho PM sử dụng tiền bạc và nhân sự của tổ chức==!
- **Khi nào BẮT BUỘC trình `CCB` (*Change Control Board*) vs khi nào chỉ cần `PO` (*Product Owner*)?**
  - **Trình `CCB` qua quy trình `PICC` (*Perform Integrated Change Control — Kiểm soát thay đổi tích hợp*):** Khi dự án chạy theo **Predictive** (hoặc phần khung hợp đồng cố định của dự án **Hybrid**) **đã chốt khoá `Scope / Schedule / Cost Baseline`**. Mọi thay đổi làm xê dịch đường cơ sở đã cam kết đều phải qua CCB xét duyệt chính thức!
  - **Chỉ cần `Product Owner` sắp xếp lại `Product Backlog` (KHÔNG cần CCB):** Khi thay đổi tính năng nằm gọn bên trong dự án **Agile** (nơi Timebox và Ngân sách giữ ổn định, còn phạm vi chi tiết linh hoạt theo giá trị). Tuy nhiên, nếu trong dự án Hybrid mà thay đổi đó phá vỡ **cột mốc hợp đồng pháp lý hoặc vượt tổng trần ngân sách công ty**, thì vẫn phải trình lên CCB/Sponsor!

```visual
kind: compare
title: "Đối chiếu Project Charter và Project Management Plan"
subtitle: "Nắm chắc ai ký, mục đích và thời điểm khoá sổ của hai tài liệu trụ cột"
left:
  badge: "SPONSOR KÝ BAN HÀNH"
  title: "Project Charter (Giấy khai sinh dự án)"
  tone: "amber"
  bullets:
    - "Khai sinh chính thức dự án dựa trên Business Case và Benefits Management Plan."
    - "Cấp thẩm quyền hợp pháp cho Project Manager huy động nguồn lực liên phòng ban."
    - "Nêu mục tiêu cấp cao, mốc lớn (Summary Milestones), ngân sách khái quát và rủi ro tổng thể."
    - "PM có thể chấp bút soạn giúp, nhưng người đặt bút ký duyệt BẮT BUỘC là Sponsor!"
right:
  badge: "PM TÍCH HỢP & ĐIỀU HÀNH"
  title: "Project Management Plan (Kế hoạch QLDA)"
  tone: "emerald"
  bullets:
    - "Bản thiết kế tổng thể chỉ rõ CÁCH THỨC thực thi, theo dõi, kiểm soát và đóng dự án."
    - "Gom toàn bộ các kế hoạch thành phần và 3 đường cơ sở: Scope, Schedule, Cost Baselines."
    - "TRƯỚC khi chốt Baseline: PM và đội dự án tự do cập nhật hoàn thiện không cần trình CCB."
    - "SAU khi đã chốt Baseline: hễ thay đổi chạm tới Baseline là bắt buộc phải đi qua PICC / CCB!"
```

## 2. Chuỗi 5 bước bất biến của quy trình Kiểm soát Thay đổi Tích hợp (`PICC`)

Sau khi dự án Predictive đã chốt `Baseline`, bất kỳ yêu cầu thêm/bớt tính năng, dời lịch, xin rút quỹ *Management Reserve*, hay hành động sửa sai quy trình (*Corrective Action · Preventive Action · Defect Repair*) đều phải đi qua **đúng thứ tự 5 mắt xích bất biến** dưới đây:

```visual
kind: flow
title: "5 Mắt xích Vàng xử lý Change Request (PICC & CCB)"
subtitle: "Đảo lộn bất kỳ mắt xích nào trong câu hỏi FIRST / NEXT là mất điểm ngay!"
steps:
  - icon: "search"
    badge: "BƯỚC 1 · FIRST"
    title: "Phân tích tác động cùng nhóm"
    desc: "Đánh giá ảnh hưởng chéo lên Phạm vi, Tiến độ, Chi phí, Chất lượng và Rủi ro trước tiên."
    tone: "amber"
    edge: "Rõ cái giá phải trả"
  - icon: "file"
    badge: "BƯỚC 2 · LOG"
    title: "Lập Change Request & Ghi sổ"
    desc: "Chính thức hoá thành văn bản Change Request và ghi trạng thái chờ xét vào Change Log."
    tone: "sky"
    edge: "Đệ trình phương án"
  - icon: "scale"
    badge: "BƯỚC 3 · DECIDE"
    title: "Hội đồng CCB phán quyết"
    desc: "CCB (hoặc Sponsor theo quy định trong Change Management Plan) phê duyệt, hoãn hoặc bác bỏ."
    tone: "cyan"
    edge: "Có kết quả duyệt"
  - icon: "refresh"
    badge: "BƯỚC 4 · UPDATE"
    title: "Cập nhật Change Log & Baselines"
    desc: "Ghi phán quyết vào Change Log; nếu ĐƯỢC DUYỆT thì cập nhật lại Baselines và PM Plan."
    tone: "emerald"
    edge: "Đồng bộ thông tin"
  - icon: "play"
    badge: "BƯỚC 5 · EXECUTE"
    title: "Thông báo & Triển khai thực hiện"
    desc: "Truyền thông tới các Stakeholder liên quan và chỉ đạo đội dự án làm theo Baseline mới."
    tone: "violet"
```

> [!WARNING]
> **Hai cú lừa kinh điển nhất trong đề PMP về Change Control:**
> 1. **Trình đơn rỗng lên CCB:** Vừa nghe khách hàng ngỏ ý muốn đổi tính năng liền chọn *"Submit a change request to the CCB immediately"* là **SAI** — PM bắt buộc phải ==phân tích tác động cùng đội chuyên môn trước== rồi mới đệ trình!
> 2. **Bỏ mặc đơn bị từ chối:** Khi CCB bác bỏ yêu cầu (*Rejected*), PM vẫn bắt buộc ==cập nhật trạng thái Rejected kèm lý do vào Change Log== và thông báo minh bạch cho người đề xuất.

## 3. Nhà máy tinh luyện dữ liệu (`WPD → WPI → WPR`) & Quản trị Tri thức

Để không bị lạc trong các câu hỏi hỏi về báo cáo, hãy hình dung dữ liệu từ công trường phần mềm đi qua 3 khâu tinh luyện:

```visual
kind: anatomy
title: "Dòng chảy Dữ liệu (WPD → WPI → WPR) và Hai loại Tri thức Dự án"
subtitle: "Phân biệt dữ liệu thô, thông tin đã so chuẩn và báo cáo đóng gói gửi lãnh đạo"
items:
  - keyword: "WPD (Work Performance Data)"
    role: "Số đo thô tại hiện trường (Executing)"
    tone: "slate"
    summary: "Con số trần trụi chưa đem so với kế hoạch: ví dụ *'Task A đã làm xong 60%'*, *'Phát sinh 14 bug trên Jira'*, *'Đã chi thực tế 500 triệu VNĐ'*."
  - keyword: "WPI (Work Performance Information)"
    role: "Thông tin đã phân tích so chuẩn (Controlling)"
    tone: "sky"
    summary: "Kết quả sau khi đem WPD đối chiếu với Baseline: ví dụ *'CPI = 0.85, dự án đang vượt ngân sách 15% và có nguy cơ trễ mốc UAT 2 tuần'*."
  - keyword: "WPR (Work Performance Reports)"
    role: "Báo cáo đóng gói trực quan (Governance)"
    tone: "emerald"
    summary: "Tập hợp WPI thành Dashboard, biểu đồ S-Curve, Status Report gửi tới Sponsor, CCB và các bên liên quan để ra quyết định."
  - keyword: "Explicit vs Tacit Knowledge"
    role: "Tri thức Hiện vs Tri thức Ẩn"
    tone: "amber"
    summary: "**Explicit** viết ra giấy/Confluence được ngay (tài liệu kiến trúc, số liệu); **Tacit** là kinh nghiệm xương máu trong đầu chuyên gia — phải truyền qua **trò chuyện, kèm cặp trực tiếp (Shadowing / Pairing) và hội thảo chia sẻ**!"
```

## 4. Tình huống thực chiến: Thủ tục Đóng dự án (`Close Project or Phase`)

Một sai lầm rất nhiều kỹ sư mắc phải là nghĩ *"Khách hàng vừa ký nghiệm thu xong là cho anh em giải tán sang dự án mới ngay trong chiều!"* hoặc *"Dự án bị công ty cắt vốn huỷ giữa chừng thì dừng luôn khỏi làm thủ tục đóng"*.

> [!TIP]
> **Quy tắc bất di bất dịch khi Đóng dự án (hoặc khi dự án bị Huỷ sớm):**
> 1. Xác nhận sản phẩm bàn giao đã có chữ ký nghiệm thu chính thức (`Accepted Deliverables`) hoặc kiểm kê toàn bộ phần việc đã hoàn thành tới thời điểm bị huỷ để ghi rõ lý do dừng dự án.
> 2. Chuyển giao sản phẩm sang bộ phận Vận hành (*Operations*), hoàn tất thanh lý hợp đồng và khảo sát mức độ hài lòng của các bên.
> 3. Đúc kết bài học cuối kỳ chuyển từ *Lessons Learned Register* của dự án vào **Kho tri thức chung của toàn công ty (*OPA — Organizational Process Assets*)**, xuất bản *Final Report*, và ==chỉ giải phóng nhân sự đội dự án ở bước cuối cùng==!
