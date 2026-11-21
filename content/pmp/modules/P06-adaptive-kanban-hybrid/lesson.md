## 1. Giải mã bằng ví dụ phần mềm: Vì sao giới hạn số việc làm dở (`WIP Limit`) lại giúp giao hàng nhanh hơn?

Hãy tưởng tượng một lập trình viên Backend tên Nam cùng lúc nhận **5 thẻ Jira song song** (`WIP = 5` — *Work in Progress*, tức công việc đang làm dở). Sáng Nam đang viết dở API thanh toán thì QA gọi hỏi bug đơn hàng, trưa BA kéo vào họp làm rõ giỏ hàng, chiều lại checkout sang nhánh khác sửa hotfix. Kết quả là Nam mất tới 40% năng lượng não bộ chỉ để **chuyển đổi ngữ cảnh (*Context Switching*)**, cột `QA Testing` ùn ứ 15 thẻ nằm chờ kiểm thử, và trung bình 1 tính năng nhỏ phải ngâm 12 ngày mới tới tay người dùng!

**Kanban** giải quyết triệt để căn bệnh ôm đồm đó bằng cơ chế **Luồng kéo (*Pull System*)** và vũ khí cốt lõi là ==WIP Limit (Giới hạn số lượng thẻ tối đa được phép nằm đồng thời ở mỗi cột)==. Quy luật toán học đứng sau nó chính là **Định luật Little (*Little's Law*)**:

- **Công thức trực quan:** `Cycle Time (Thời gian hoàn tất 1 việc) = WIP (Số việc đang ôm dở) / Throughput (Tốc độ đầu ra trung bình)`.
- **Hệ quả thực tế:** Khi năng lực của nhóm không đổi, ==muốn giảm một nửa thời gian hoàn thành từng tính năng (Cycle Time), cách nhanh nhất không phải là thức đêm làm thêm giờ mà là cắt giảm một nửa số việc đang bày dở dang (WIP)!==
- **Phản xạ khi chạm trần WIP:** Giả sử cột `Testing` đặt trần `WIP Limit = 3` và hiện đã có đủ `3/3` thẻ. Lập trình viên vừa code xong thẻ thứ 4 **tuyệt đối không được nhét tràn sang cột Testing**, cũng **không kéo thêm thẻ mới về code chất đống**, mà cả đội phải xắn tay phụ gỡ nghẽn khâu kiểm thử cho thẻ cũ thông thoát trước (*Swarming — "Stop starting, start finishing!"*).

## 2. Lập kế hoạch cuốn chiếu, Story Points & Luật cấm tối kỵ của Velocity

Trong môi trường biến động, đội dự án lập kế hoạch qua hai kỹ thuật linh hoạt của [!badge:amber:PMBOK 8]: **Progressive Elaboration** (*làm rõ dần chi tiết khi có thêm thông tin thực tế*) và **Rolling Wave Planning** (*lập kế hoạch cuốn chiếu — lên chi tiết cho 1–2 chặng gần trước mắt, còn các quý xa chỉ phác thảo khung lớn*).

Khi ước lượng công việc Agile, thay vì đoán mò số giờ tuyệt đối dễ sai lệch, các Developers dùng đơn vị tương đối gọi là **Story Points** (tổng hợp 3 yếu tố: **Độ phức tạp logic · Khối lượng việc · Độ rủi ro/mơ hồ**) bằng trò chơi đồng thuận **Planning Poker** hoặc phân nhóm nhanh **Affinity Estimating**. Tổng số Story Points của các thẻ **đạt chuẩn 100% DoD** trong 1 Sprint gọi là **Velocity** (*tốc độ trung bình của nhóm*).

```visual
kind: compare
title: "Sử dụng Story Points & Velocity: Bẫy Quản lý Vi mô vs Chuẩn PMI"
subtitle: "Velocity là thước đo dự báo dung lượng nội bộ — KHÔNG PHẢI thước đo thi đua!"
left:
  badge: "BẪY ĐỜI THỰC (LOẠI NGAY)"
  title: "Biến Velocity thành cây gậy chấm KPI"
  tone: "rose"
  bullets:
    - "So sánh Nhóm A đạt 60 điểm là chăm chỉ hơn Nhóm B đạt 25 điểm rồi xét thưởng phạt."
    - "PM tự ước lượng điểm hoặc ép nhóm phải cam kết tăng Velocity thêm 20% ở Sprint sau."
    - "Thẻ làm xong 90% code nhưng chưa test xong vẫn được tính tạm 90% điểm vào Velocity kỳ này."
right:
  badge: "PHẢN XẠ CHUẨN PMI (CHỌN)"
  title: "Dùng Velocity để dự báo lịch phát hành bền vững"
  tone: "emerald"
  bullets:
    - "Mỗi nhóm có thang quy chiếu điểm riêng: CẤM TUYỆT ĐỐI so sánh Velocity giữa hai nhóm khác nhau!"
    - "Chỉ những người trực tiếp làm việc (Developers) mới có quyền ước lượng Story Points."
    - "Luật nhị phân 0% hoặc 100%: chưa đạt trọn vẹn DoD thì kỳ đó tính 0 điểm, dời sang Sprint kế tiếp."
```

> [!WARNING]
> **Bẫy đề thi về ép tăng Velocity:** Nếu lãnh đạo hỏi làm sao để tăng tốc độ giao giá trị của nhóm Agile, hãy loại ngay đáp án *"tăng giờ làm thêm"* hoặc *"giao chỉ tiêu Velocity cao hơn"*. Đáp án chuẩn luôn là ==tháo gỡ rào cản hệ thống (Impediments), tự động hoá CI/CD để giảm nợ kỹ thuật và hạn chế đa nhiệm==!

## 3. Đọc vị 3 biểu đồ theo dõi thích ứng trong 10 giây

Đề thi PMP thường mô tả hình dáng đường biểu đồ đang biến động rồi hỏi PM nhận ra vấn đề gì:

```visual
kind: groups
title: "Giải mã 3 Biểu đồ Thích ứng Kinh điển (Information Radiators)"
subtitle: "Nhìn đúng hình dáng đường cong để chẩn đoán trúng bệnh của dòng chảy công việc"
columns: 3
items:
  - num: 1
    icon: "trend"
    title: "Burndown Chart"
    badge: "VIỆC CÒN LẠI GIẢM VỀ 0"
    tone: "amber"
    desc: "Đo khối lượng việc còn tồn đọng theo từng ngày trong Sprint."
    bullets:
      - "Đường thực tế đi ngang mãi không giảm: thẻ việc chẻ còn quá to hoặc nhóm đang kẹt Impediment."
      - "Điểm mù: không phân biệt được nhóm làm chậm hay do PO vừa chèn thêm việc mới."
  - num: 2
    icon: "layers"
    title: "Burnup Chart"
    badge: "TÁCH BẠCH PHẠM VI TỔNG"
    tone: "emerald"
    desc: "Vẽ tách riêng 2 đường: Đường Tổng phạm vi ở trên và Đường Việc đã hoàn tất ở dưới."
    bullets:
      - "Nhìn thấy ngay lập tức thời điểm phạm vi Release bị cộng thêm mà không phủ nhận nỗ lực của nhóm."
      - "Công cụ minh bạch nhất để báo cáo dự báo ngày phát hành với Sponsor."
  - num: 3
    icon: "eye"
    title: "Cumulative Flow (CFD)"
    badge: "SOI CỔ CHAI KANBAN"
    tone: "cyan"
    desc: "Các dải màu xếp chồng biểu diễn lượng thẻ tích tụ ở từng cột theo thời gian."
    bullets:
      - "Chiều cao dải màu = WIP hiện tại; bề ngang dải màu = Cycle Time trung bình."
      - "Một dải màu phình rộng bất thường báo hiệu nút cổ chai đang tắc nghẽn ngay tại công đoạn đó!"
```

## 4. Tình huống thực chiến: Điều phối dự án Hybrid giữa phần cứng và phần mềm

Giả sử bạn điều hành dự án Kiosk Ngân hàng Tự động (**Hybrid**): đội sản xuất vỏ máy & đầu đọc thẻ chạy theo lịch **Predictive** cố định 6 tháng, trong khi đội viết phần mềm nhận diện khuôn mặt trên Kiosk chạy theo **Agile Sprint 2 tuần**. Nếu hai đội mạnh ai nấy chạy, ngày ghép máy chắc chắn vỡ trận!

```visual
kind: flow
title: "4 Bước Đồng bộ Dự án Hybrid & Chuyển đổi Tổ chức sang Thích ứng"
subtitle: "PM đóng vai trò 'Bộ phiên dịch hai chiều' nối nhịp giữa kỷ luật mốc lớn và linh hoạt Sprint"
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
    desc: "Cung cấp báo cáo Milestone/Ngân sách tổng cho Ban giám đốc, đồng thời che chắn không gian tự chủ cho các Sprint."
    tone: "cyan"
    edge: "Lan toả bền vững"
  - icon: "award"
    badge: "BƯỚC 4"
    title: "Cải tiến & Đúc kết tài sản quy trình"
    desc: "Thu hoạch bài học thực tế từ các đợt tích hợp để tinh chỉnh khung Hybrid của doanh nghiệp."
    tone: "emerald"
```

> [!TIP]
> **Câu thần chú gỡ rối Kanban & Hybrid:** Thấy hàng đợi ùn ứ ở một khâu → ==siết trần WIP Limit và điều phối nhóm hỗ trợ gỡ nghẽn tại chỗ==; thấy hai nhánh Waterfall và Agile lệch pha → ==thiết lập cột mốc tích hợp chung (Shared Integration Milestones) và họp đồng bộ liên nhóm==!
