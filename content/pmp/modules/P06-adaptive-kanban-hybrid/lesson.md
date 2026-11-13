## 1. Lập kế hoạch Cuốn chiếu & Luật bất khả xâm phạm của Velocity

Dự án thích ứng **không phải là không lập kế hoạch**, mà là lập kế hoạch liên tục ở nhiều tầng thông qua ==Progressive Elaboration== (làm rõ dần khi có thêm thông tin) và ==Rolling Wave Planning== [!badge:amber:PMBOK 8] (lập chi tiết cho chặng gần trước mắt, giữ mức khái quát cho chặng xa).

Để ước lượng tương đối mà không sa lầy vào tranh cãi giờ công tuyệt đối, nhóm chuyên môn dùng **Story Points** (kết hợp **Độ phức tạp · Khối lượng · Độ bất định**) thông qua kỹ thuật đồng thuận như **Planning Poker**. Từ đó hình thành **Velocity** — tổng Story Points của các hạng mục đạt chuẩn **Definition of Done** trong một Iteration.

```visual
kind: compare
title: "Sử dụng Story Points & Velocity trong phòng thi PMP"
subtitle: "Ranh giới sinh tử giữa bẫy KPI quản lý vi mô và tư duy trao quyền chuẩn PMI"
left:
  badge: "BẪY ĐỜI THỰC (SAI)"
  title: "Biến Velocity thành cây gậy KPI"
  tone: "rose"
  bullets:
    - "So sánh Nhóm A (50 điểm) giỏi hơn Nhóm B (30 điểm) rồi thưởng phạt theo điểm."
    - "PM hoặc Tech Lead ước lượng sẵn Story Points rồi giao chỉ tiêu tăng 15% Velocity mỗi kỳ."
    - "Cộng cả phần trăm dở dang (80% xong) của User Story chưa đạt DoD vào Velocity cuối Sprint."
right:
  badge: "PHẢN XẠ CHUẨN PMI (ĐÚNG)"
  title: "Velocity là công cụ dự báo nội bộ nhóm"
  tone: "emerald"
  bullets:
    - "Mỗi nhóm có hệ quy chiếu điểm riêng: tuyệt đối KHÔNG dùng Velocity để so sánh hai nhóm."
    - "Chỉ những Developers trực tiếp làm việc mới ước lượng; Velocity tự ổn định để dự báo Release."
    - "Nguyên tắc nhị phân 0% hoặc 100%: chưa đạt trọn vẹn Definition of Done thì tính 0 điểm ở Sprint đó."
```

> [!WARNING] Bẫy đề thi cực độc về "Tăng Velocity"
> Nếu Sponsor đòi tăng Velocity gấp đôi cho Sprint tới, đáp án đúng **không bao giờ** là ép nhóm làm thêm giờ hay thổi phồng điểm ước lượng! Hãy chọn ==tháo gỡ Impediments, giảm nợ kỹ thuật hoặc cắt nhỏ phụ thuộc== để dòng chảy giá trị thông suốt tự nhiên.

## 2. Luồng kéo Kanban, Giới hạn WIP & Tín hiệu Biểu đồ Thích ứng

Khác với Scrum đóng khung theo Timebox cố định, **Kanban** vận hành theo **luồng kéo liên tục (Pull System)** [!badge:sky:PMA Bridge]. Vũ khí mạnh nhất của Kanban là ==WIP Limit (Work in Progress Limit)== — giới hạn số lượng hạng mục tối đa được phép nằm đồng thời ở mỗi trạng thái.

Theo **Định luật Little (Little's Law)**, khi giữ ổn định năng lực xử lý, ==càng hạ thấp WIP thì Cycle Time (thời gian hoàn tất 1 việc) càng giảm==, giảm lãng phí chuyển ngữ cảnh (*context switching*) và làm **lộ ngay cổ chai (bottleneck)** để cả nhóm hợp sức giải cứu (*swarming*).

```visual
kind: groups
title: "Giải mã 3 Biểu đồ Theo dõi Thích ứng hay gặp nhất trong đề thi"
subtitle: "Nhìn đúng triệu chứng trên biểu đồ để chọn hành động tiếp theo chính xác"
columns: 3
items:
  - num: 1
    icon: "trend"
    title: "Burndown Chart"
    badge: "CÒN BAO NHIÊU VIỆC"
    tone: "amber"
    desc: "Theo dõi khối lượng công việc còn lại giảm dần về 0 theo thời gian Timebox."
    bullets:
      - "Đường thực tế đi ngang nhiều ngày: việc quá to chưa chẻ nhỏ hoặc đang vướng Impediment."
      - "Nhược điểm: không tách bạch được 'nhóm làm chậm' với 'PO vừa thêm phạm vi mới'."
  - num: 2
    icon: "layers"
    title: "Burnup Chart"
    badge: "TÁCH RÕ PHẠM VI"
    tone: "emerald"
    desc: "Có 2 đường riêng biệt: Đường tổng phạm vi (Total Scope) ở trên và Đường việc đã xong ở dưới."
    bullets:
      - "Thấy rõ ngay lúc phạm vi Release bị mở rộng hay thu hẹp mà không làm méo tốc độ thực của nhóm."
      - "Rất hợp để báo cáo tiến độ Release cho Sponsor và khách hàng."
  - num: 3
    icon: "eye"
    title: "Cumulative Flow (CFD)"
    badge: "BẮT BỆNH CỔ CHAI"
    tone: "cyan"
    desc: "Các dải màu xếp chồng thể hiện số lượng thẻ ở từng cột Kanban theo thời gian."
    bullets:
      - "Bề ngang dải màu = Cycle Time; bề dọc = WIP hiện tại ở bước đó."
      - "Một dải màu phình to bất thường (ví dụ cột QA Testing): cổ chai đang nghẽn ngay tại bước đó!"
```

- [!] **Khi cột Testing chạm trần WIP Limit**: Developers **không được** tiếp tục code thẻ mới đẩy sang chồng chất trước cửa Testing; phản xạ chuẩn là ==tạm dừng kéo việc mới và hỗ trợ giải phóng hàng đợi đang nghẽn== (*"Stop starting, start finishing"*).

## 3. Điều phối Dự án Hybrid & Lộ trình Chuyển đổi Tổ chức sang Agile

Hơn một nửa câu hỏi tình huống PMP hiện đại đặt bạn vào bối cảnh **Hybrid** [!badge:violet:ECO 07/2026] — nơi tổ chức kết hợp có chủ đích sự chặt chẽ của **Predictive** với tính linh hoạt của **Agile** tùy theo đặc thù từng hợp phần:

```visual
kind: flow
title: "Chiến lược Chuyển đổi từ Waterfall sang Agile / Hybrid an toàn"
subtitle: "Áp dụng khi tổ chức truyền thống có tâm lý ngại thay đổi hoặc dự án vừa có phần cứng vừa có phần mềm"
steps:
  - icon: "search"
    badge: "BƯỚC 1"
    title: "Đánh giá Độ sẵn sàng"
    desc: "Phân tích văn hoá tổ chức (EEF), hợp đồng pháp lý và tách rõ hợp phần ổn định với hợp phần biến động."
    tone: "sky"
    edge: "Thiết kế Tailoring"
  - icon: "git-branch"
    badge: "BƯỚC 2"
    title: "Dựng Khung Hybrid Cầu nối"
    desc: "Giữ mốc Governance/Phần cứng theo Predictive; chạy phần mềm/UI theo Sprint ngắn và đồng bộ qua Milestone chung."
    tone: "amber"
    edge: "Thí điểm & Huấn luyện"
  - icon: "users"
    badge: "BƯỚC 3"
    title: "Đào tạo & Thí điểm (Pilot)"
    desc: "Huấn luyện Agile Mindset cho cả nhóm lẫn lãnh đạo; áp dụng dần từng thực hành (Daily, Retro, Kanban) trên dự án Pilot."
    tone: "violet"
    edge: "Mở rộng bền vững"
  - icon: "award"
    badge: "BƯỚC 4"
    title: "Chuẩn hoá & Nhân rộng"
    desc: "Đúc kết Lessons Learned vào OPA, điều chỉnh quy trình PMO sang định hướng trao quyền và tập trung giá trị."
    tone: "emerald"
```

> [!REMEMBER] Ba quy tắc vàng khi gặp câu hỏi Hybrid trong phòng thi
> - [x] **Đồng bộ giao diện tích hợp**: Khi đội phần cứng (Predictive) phối hợp đội phần mềm (Agile), PM phải thiết lập ==lịch tích hợp chung, bản đồ phụ thuộc (Dependency Map) và họp đồng bộ định kỳ (như Scrum of Scrums)==.
> - [x] **Không cực đoan hoá**: Nếu lãnh đạo cấp cao vẫn yêu cầu báo cáo mốc ngân sách quý cố định, PM đóng vai **bộ chuyển đổi (translator)** — giữ báo cáo Milestone cấp cao cho lãnh đạo trong khi vẫn bảo vệ không gian Sprint linh hoạt cho đội phát triển.
> - [>] **Chuyển đổi từng bước**: Luôn loại bỏ các đáp án bắt tổ chức truyền thống *"chuyển 100% sang thuần Agile ngay lập tức"* mà không có bước đào tạo và chuyển tiếp Hybrid.
