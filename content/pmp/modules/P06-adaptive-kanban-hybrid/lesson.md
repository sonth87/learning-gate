## 1. Cơ chế luồng kéo `Kanban` và Giới hạn công việc dở dang (`WIP Limit`)

Xét một tình huống phổ biến trong nhóm phát triển phần mềm: một lập trình viên Backend nhận cùng lúc **5 đầu việc song song** (`WIP = 5` — *Work in Progress*, tức số công việc đang thực hiện chưa hoàn tất). Khi vừa viết API thanh toán, vừa hỗ trợ kiểm lỗi đơn hàng, vừa tham gia họp làm rõ giỏ hàng và xử lý sửa lỗi khẩn cấp, lập trình viên mất phần lớn thời gian vào việc **chuyển đổi ngữ cảnh (*Context Switching*)**. Hệ quả là cột `QA Testing` bị ùn ứ thẻ chờ kiểm thử và thời gian hoàn thành một tính năng kéo dài nhiều ngày.

**Kanban** giải quyết tình trạng quá tải đa nhiệm này bằng cơ chế **Luồng kéo (*Pull System*)** dựa trên nguyên tắc cốt lõi là ==WIP Limit (Giới hạn số lượng đầu việc tối đa được phép xử lý đồng thời ở mỗi cột)==. Cơ sở toán học của nguyên tắc này là **Định luật Little (*Little's Law*)**:

- **Công thức:** `Cycle Time (Thời gian hoàn tất 1 việc) = WIP (Số việc đang làm dở) / Throughput (Tốc độ đầu ra trung bình)`.
- **Hệ quả vận hành:** Khi năng lực trung bình của nhóm không đổi, ==muốn rút ngắn thời gian hoàn thành từng tính năng (Cycle Time), giải pháp hiệu quả nhất là giảm số lượng công việc đang làm dở (WIP)== thay vì tăng giờ làm việc.
- **Cách xử lý khi chạm ngưỡng WIP:** Nếu cột `Testing` đặt giới hạn `WIP Limit = 3` và đã đủ `3/3` thẻ, lập trình viên hoàn tất code thẻ thứ 4 **không được đẩy sang cột Testing** và **không kéo thêm thẻ mới về làm**, mà cả đội cùng hỗ trợ giải phóng điểm nghẽn ở khâu kiểm thử (*Swarming — "Stop starting, start finishing"*).

## 2. Lập kế hoạch cuốn chiếu (`Rolling Wave`), `Story Points` và nguyên tắc sử dụng `Velocity`

Trong môi trường nhiều biến động, đội dự án lập kế hoạch thông qua hai kỹ thuật của [!badge:amber:PMBOK 8]: **Progressive Elaboration** (*làm rõ dần chi tiết khi có thêm dữ liệu thực tế*) và **Rolling Wave Planning** (*lập kế hoạch cuốn chiếu — lập chi tiết cho 1–2 chặng gần trước mắt, các giai đoạn xa hơn giữ ở mức tổng quan*).

Khi ước lượng công việc Agile, thay vì ước lượng số giờ tuyệt đối vốn dễ sai lệch, đội phát triển dùng đơn vị tương đối là **Story Points** (phản ánh tổng hợp 3 yếu tố: **Độ phức tạp logic · Khối lượng công việc · Độ rủi ro/chưa rõ ràng**) thông qua **Planning Poker** hoặc **Affinity Estimating**. Tổng số Story Points của các hạng mục **đạt trọn vẹn 100% DoD** trong một Sprint được gọi là **Velocity** (*tốc độ hoàn thành trung bình của nhóm*).

```visual
kind: compare
title: "Sử dụng Story Points & Velocity: Cách dùng sai vs Chuẩn PMI"
subtitle: "Velocity là chỉ số dự báo năng lực nội bộ của một nhóm — không phải công cụ so sánh KPI"
left:
  badge: "CÁCH DÙNG SAI (LOẠI BỎ)"
  title: "Biến Velocity thành chỉ tiêu KPI áp đặt"
  tone: "rose"
  bullets:
    - "So sánh Nhóm A đạt 60 điểm với Nhóm B đạt 25 điểm để đánh giá hiệu suất thưởng phạt."
    - "PM tự ước lượng điểm hoặc yêu cầu nhóm tăng Velocity thêm 20% ở Sprint tiếp theo."
    - "Thẻ hoàn thành 90% code nhưng chưa kiểm thử xong vẫn được tính 90% điểm vào Velocity kỳ này."
right:
  badge: "CHUẨN PMI (CHỌN)"
  title: "Dùng Velocity để dự báo kế hoạch phát hành bền vững"
  tone: "emerald"
  bullets:
    - "Mỗi nhóm có thang quy chiếu điểm riêng: tuyệt đối không so sánh Velocity giữa hai nhóm khác nhau."
    - "Chỉ những người trực tiếp thực hiện (Developers) mới có quyền ước lượng Story Points."
    - "Áp dụng quy tắc nhị phân 0% hoặc 100%: chưa đạt trọn vẹn DoD thì tính 0 điểm và dời sang Sprint sau."
```

> [!WARNING]
> **Lưu ý về yêu cầu tăng Velocity trong đề thi:** Khi câu hỏi đặt vấn đề làm thế nào để nâng cao tốc độ bàn giao giá trị của nhóm Agile, cần loại bỏ các phương án *"yêu cầu làm thêm giờ"* hoặc *"ép chỉ tiêu Velocity cao hơn"*. Phương án đúng là ==tháo gỡ rào cản hệ thống (Impediments), tự động hóa kiểm thử/CI/CD để giảm nợ kỹ thuật và giảm đa nhiệm==.

## 3. Đọc và phân tích 3 biểu đồ theo dõi thích ứng (`Burndown, Burnup, CFD`)

Đề thi PMP thường mô tả xu hướng biến động của các biểu đồ theo dõi tiến độ để kiểm tra khả năng chẩn đoán vấn đề của PM:

```visual
kind: groups
title: "Ba Biểu đồ Theo dõi Thích ứng (Information Radiators)"
subtitle: "Quan sát hình dáng đường biểu đồ để xác định nguyên nhân chậm tiến độ hoặc nghẽn quy trình"
columns: 3
items:
  - num: 1
    icon: "trend"
    title: "Burndown Chart"
    badge: "VIỆC CÒN LẠI GIẢM VỀ 0"
    tone: "amber"
    desc: "Theo dõi khối lượng công việc còn tồn đọng qua từng ngày trong Sprint."
    bullets:
      - "Đường thực tế đi ngang kéo dài: đầu việc còn quá lớn hoặc nhóm đang vướng Impediment."
      - "Hạn chế: không tách bạch được nhóm làm chậm hay do PO vừa bổ sung thêm phạm vi mới."
  - num: 2
    icon: "layers"
    title: "Burnup Chart"
    badge: "TÁCH BẠCH PHẠM VI TỔNG"
    tone: "emerald"
    desc: "Hiển thị riêng 2 đường: Đường Tổng phạm vi ở trên và Đường Việc đã hoàn tất ở dưới."
    bullets:
      - "Cho thấy ngay thời điểm phạm vi Release tăng lên mà vẫn ghi nhận đúng nỗ lực của nhóm."
      - "Phù hợp để báo cáo dự báo ngày phát hành minh bạch với Sponsor."
  - num: 3
    icon: "eye"
    title: "Cumulative Flow (CFD)"
    badge: "PHÁT HIỆN ĐIỂM NGHẼN KANBAN"
    tone: "cyan"
    desc: "Các dải màu xếp chồng biểu diễn lượng thẻ tích tụ ở từng công đoạn theo thời gian."
    bullets:
      - "Chiều cao dải màu = WIP hiện tại; bề ngang dải màu = Cycle Time trung bình."
      - "Một dải màu phình rộng bất thường báo hiệu điểm nghẽn đang tích tụ tại công đoạn đó."
```

## 4. Điều phối dự án `Hybrid` giữa các hợp phần Predictive và Agile

Xét bài toán dự án Kiosk Ngân hàng Tự động (**Hybrid**): đội sản xuất phần cứng (vỏ máy và đầu đọc thẻ) vận hành theo lịch **Predictive** cố định 6 tháng, trong khi đội phát triển phần mềm nhận diện khuôn mặt vận hành theo **Agile Sprint 2 tuần**. Nếu hai luồng triển khai tách rời không đồng bộ, việc tích hợp hệ thống sẽ gặp xung đột nghiêm trọng.

```visual
kind: flow
title: "4 Bước Đồng bộ Dự án Hybrid & Chuyển đổi Tổ chức sang Thích ứng"
subtitle: "PM đóng vai trò điều phối trung gian kết nối giữa các cột mốc cố định và nhịp Sprint linh hoạt"
steps:
  - icon: "search"
    badge: "BƯỚC 1"
    title: "Phân tách ranh giới & Bản đồ phụ thuộc"
    desc: "Xác định rõ giao diện tích hợp (Integration Milestones) và lập Dependency Map giữa nhánh Predictive và Agile."
    tone: "sky"
    edge: "Khớp lịch chung"
  - icon: "git-branch"
    badge: "BƯỚC 2"
    title: "Đồng bộ nhịp xuyên đội nhóm"
    desc: "Sắp xếp Product Backlog của đội phần mềm bám sát các mốc bàn giao phần cứng qua họp đồng bộ định kỳ."
    tone: "amber"
    edge: "Báo cáo đa tầng"
  - icon: "users"
    badge: "BƯỚC 3"
    title: "Phiên dịch quản trị cho Lãnh đạo"
    desc: "Cung cấp báo cáo Milestone/Ngân sách tổng cho Ban giám đốc, đồng thời giữ không gian tự chủ cho các Sprint."
    tone: "cyan"
    edge: "Lan toả bền vững"
  - icon: "award"
    badge: "BƯỚC 4"
    title: "Cải tiến & Đúc kết tài sản quy trình"
    desc: "Thu hoạch bài học thực tế từ các đợt tích hợp để tinh chỉnh khung Hybrid của doanh nghiệp."
    tone: "emerald"
```

> [!TIP]
> **Nguyên tắc xử lý cho Kanban & Hybrid:** Khi hàng đợi ùn ứ tại một công đoạn → ==siết trần WIP Limit và điều phối nhóm hỗ trợ gỡ nghẽn tại chỗ==; khi hai nhánh Predictive và Agile có nguy cơ lệch pha → ==thiết lập cột mốc tích hợp chung (Shared Integration Milestones) và tổ chức họp đồng bộ liên nhóm==.
