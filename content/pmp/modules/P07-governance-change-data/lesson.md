## 1. Thẩm quyền Khai sinh Dự án: Project Charter vs Project Management Plan

Trong **PMBOK® Guide 8 (`§2.1`)**, Miền hiệu suất **Governance** [!badge:amber:PMBOK 8] đóng vai trò hệ thần kinh trung ương kết nối mọi miền khác (hợp nhất Integration truyền thống cùng *Manage Quality Assurance* và *Plan Sourcing Strategy* thành 9 quy trình).

Câu hỏi bẫy kinh điển ở giai đoạn khởi tạo xoay quanh thời điểm PM thực sự có thẩm quyền sử dụng nguồn lực tổ chức:

```visual
kind: compare
title: "Đối chiếu Project Charter và Project Management Plan"
subtitle: "Không bao giờ nhầm người ký, mục đích và cách thức cập nhật của hai tài liệu xương sống"
left:
  badge: "SPONSOR KÝ BAN HÀNH"
  title: "Project Charter (Hiến chương dự án)"
  tone: "amber"
  bullets:
    - "Giấy khai sinh chính thức của dự án, dựa trên Business Case và Benefits Management Plan."
    - "Trao thẩm quyền chính thức cho Project Manager huy động nguồn lực tổ chức."
    - "Ghi mục tiêu cấp cao, mốc Milestone lớn, ngân sách tóm tắt và rủi ro tổng thể ban đầu."
    - "PM có thể hỗ trợ soạn thảo, nhưng BẮT BUỘC Sponsor (hoặc thực thể ngoài dự án) ký duyệt."
right:
  badge: "PM TÍCH HỢP & ĐIỀU HÀNH"
  title: "Project Management Plan (Kế hoạch QLDA)"
  tone: "emerald"
  bullets:
    - "Bản thiết kế tổng thể chỉ rõ CÁCH thực thi, giám sát, kiểm soát và đóng dự án."
    - "Tích hợp mọi kế hoạch con (Subsidiary Plans) và 3 đường cơ sở: Scope, Schedule, Cost Baselines."
    - "TRƯỚC khi khoá Baseline: PM và nhóm chủ động tinh chỉnh linh hoạt không cần qua CCB."
    - "SAU khi khoá Baseline: mọi thay đổi chạm tới Baseline bắt buộc phải có Change Request được duyệt."
```

- [!] **Phản xạ phòng thi**: Nếu đề bài mô tả dự án chưa có **Project Charter** được ký mà trưởng phòng đòi mượn người làm thiết kế ngay, hành động ĐẦU TIÊN là ==hoàn tất và trình Sponsor ký duyệt Project Charter== (trừ các nghiên cứu tiền khả thi phục vụ Business Case).

## 2. Chuỗi Bất biến Xử lý Yêu cầu Thay đổi (PICC & CCB)

Khi dự án Predictive (hoặc phần khung Predictive của dự án Hybrid) đã khoá **Baseline**, mọi đề xuất thêm/bớt phạm vi, dịch lịch, xin dùng *Management Reserve* hay sửa lỗi quy trình (*Corrective / Preventive / Defect Repair*) đều phải đi qua quy trình **Perform Integrated Change Control (PICC)** [!badge:rose:Bẫy đề thi]:

```visual
kind: flow
title: "Chuỗi 5 Mắt xích Vàng xử lý Change Request sau khi đã khoá Baseline"
subtitle: "Sai một mắt xích là mất điểm ở các câu hỏi FIRST / NEXT!"
steps:
  - icon: "search"
    badge: "1. ĐÁNH GIÁ TRƯỚC"
    title: "Phân tích Tác động"
    desc: "Cùng nhóm chuyên môn đánh giá ảnh hưởng toàn diện lên Scope, Time, Cost, Quality, Risk."
    tone: "amber"
    edge: "Lập hồ sơ"
  - icon: "file"
    badge: "2. CHÍNH THỨC HOÁ"
    title: "Ghi Change Request"
    desc: "Lập phiếu Change Request văn bản và cập nhật trạng thái chờ duyệt vào Change Log."
    tone: "sky"
    edge: "Trình thẩm quyền"
  - icon: "scale"
    badge: "3. PHÁN QUYẾT"
    title: "CCB Xét duyệt"
    desc: "Trình CCB (hoặc Sponsor theo Change Management Plan) kèm các phương án khuyến nghị."
    tone: "violet"
    edge: "Được duyệt / Bác bỏ"
  - icon: "refresh"
    badge: "4. ĐỒNG BỘ PLAN"
    title: "Cập nhật Baseline & Log"
    desc: "Ghi kết quả vào Change Log. Nếu ĐƯỢC DUYỆT: cập nhật Baselines và PM Plan liên quan."
    tone: "emerald"
    edge: "Thực thi"
  - icon: "play"
    badge: "5. TRIỂN KHAI"
    title: "Truyền thông & Thực hiện"
    desc: "Thông báo cho các Stakeholder bị ảnh hưởng và chỉ đạo nhóm thực thi theo Baseline mới."
    tone: "cyan"
```

> [!WARNING] Hai cái bẫy giết điểm nhiều nhất trong câu hỏi Thay đổi
> 1. **Nộp đơn rỗng lên CCB**: Thấy khách hàng gửi email xin đổi liền *"trình ngay lên CCB"* là **SAI** — PM phải **phân tích tác động cùng nhóm trước** rồi mới trình CCB!
> 2. **Quên ghi nhận yêu cầu bị từ chối**: Ngay cả khi CCB **từ chối (Rejected)**, PM vẫn bắt buộc ==cập nhật trạng thái Rejected kèm lý do vào Change Log== và thông báo lại cho người đề xuất.

## 3. Dòng chảy Dữ liệu (`WPD → WPI → WPR`), Tri thức & Đóng Dự án

Miền Governance giữ cho thông tin và bài học kinh nghiệm không bị đứt gãy từ lúc chạy việc tới lúc khép lại dự án [!badge:sky:PMA Bridge]:

```visual
kind: anatomy
title: "Giải phẫu Dòng dữ liệu Hiệu suất, Quản trị Tri thức & Thủ tục Đóng"
subtitle: "Phân biệt chuẩn xác đầu vào/đầu ra để không bao giờ chọn nhầm thuật ngữ"
items:
  - keyword: "WPD → WPI → WPR"
    role: "Dòng chảy dữ liệu thực thi"
    tone: "cyan"
    summary: "Biến số liệu thô tại hiện trường thành báo cáo ra quyết định cấp lãnh đạo."
    bullets:
      - "WPD (Work Performance Data): Số thô chưa so sánh — ví dụ 'đã tiêu 40.000$', 'xong 65% gói việc A', '12 lỗi phần mềm'."
      - "WPI (Work Performance Information): Đã đối chiếu với Baseline ở quy trình Control — ví dụ 'CPI = 0.85, dự báo vượt ngân sách 15%'."
      - "WPR (Work Performance Reports): Bản tổng hợp trực quan (Dashboard, Status Report) đóng gói từ WPI để gửi Stakeholder/CCB."
  - keyword: "Tacit vs Explicit"
    role: "Manage Project Knowledge"
    tone: "violet"
    summary: "Hai dạng tri thức phải kết hợp song hành xuyên suốt dự án, không đợi cuối kỳ."
    bullets:
      - "Explicit Knowledge (Tri thức hiện): Dễ viết thành chữ, sơ đồ, tài liệu, số liệu trong Lessons Learned Register."
      - "Tacit Knowledge (Tri thức ẩn): Kinh nghiệm nghề, trực giác, bối cảnh ngầm — chỉ truyền tải hiệu quả qua đối thoại, kèm cặp (shadowing), workshop và văn hoá tin cậy."
  - keyword: "Close Project / Phase"
    role: "Khép vòng đời chính thức"
    tone: "emerald"
    summary: "Bắt buộc thực hiện kể cả khi dự án hoàn thành 100% HAY bị huỷ bỏ giữa chừng."
    bullets:
      - "Xác nhận khách hàng đã ký nghiệm thu sản phẩm (Accepted Deliverables từ Validate Scope) → bàn giao sang vận hành."
      - "Đo lường sự hài lòng, họp tổng kết bài học cuối và chuyển vào Lessons Learned Repository (OPA) của tổ chức."
      - "Hoàn thiện Final Report, thanh lý hợp đồng và GIẢI PHÓNG NGUỒN LỰC ở bước sau cùng!"
```

> [!IMPORTANT] Khi dự án bị chấm dứt sớm (Early Termination)
> Tuyệt đối **không** giải tán đội dự án ngay lập tức! PM phải mở quy trình **Close Project or Phase** để: ==(1) Ghi nhận chính thức lý do dừng dự án, (2) Kiểm kê và bàn giao phần sản phẩm dở dang đã hoàn tất tới thời điểm đó, (3) Đúc kết Lessons Learned vào OPA, rồi mới (4) Giải phóng nhân sự==.
