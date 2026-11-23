## 1. Năm cách tiếp cận phát triển dự án theo PMBOK® 8 (`Predictive, Iterative, Incremental, Agile, Hybrid`)

Khi triển khai một sản phẩm hay hệ thống mới, không có phương pháp quản lý nào phù hợp cho mọi bối cảnh. Trong [!badge:amber:PMBOK 8] (`Standard §4.2`), PMI phân loại các cách tiếp cận trên một **dải phổ liên tục (Development Spectrum)** dựa vào **Ma trận Stacey**: mức độ bất định của **Yêu cầu (What)** × mức độ bất định của **Kỹ thuật (How)**, kết hợp với **Chi phí thay đổi (Cost of Change)**.

Xét trên cùng bối cảnh xây dựng nền tảng thương mại điện tử và hạ tầng thanh toán, có thể phân biệt 5 cách tiếp cận như sau:

1. **Predictive (*Waterfall — Tuần tự dự báo trước*):** Dựng phòng máy chủ vật lý hoặc cổng khai báo thuế theo thông tư pháp luật đã chốt cứng 100%. Thiết kế xong xuôi từ đầu rồi mới thi công tuần tự, ==bàn giao trọn gói 1 lần duy nhất ở cuối dự án== vì đập đi xây lại cực kỳ tốn kém.
2. **Iterative (*Lặp tinh chỉnh — Tối ưu ĐỘ ĐÚNG ĐẮN*):** Thiết kế giao diện đặt lệnh chứng khoán phức tạp mà khách hàng chưa hình dung rõ mình thích bố cục nào. Đội thiết kế dựng bản nháp đen trắng (*Wireframe*) → bản màu (*Mockup*) → bản bấm thử (*Prototype*) qua nhiều vòng góp ý cho thật trúng ý rồi mới đóng gói bàn giao.
3. **Incremental (*Tăng trưởng từng phần — Tối ưu TỐC ĐỘ BÀN GIAO*):** Bức tranh tổng thể đã rõ nhưng công ty cần lên sóng kiếm tiền sớm: Tháng 1 phát hành xong 100% tính năng Giỏ hàng + Tiền mặt (dùng thật được ngay); Tháng 2 gắn thêm Ví điện tử; Tháng 3 gắn thêm Tích điểm thành viên.
4. **Agile / Adaptive (*Thích ứng linh hoạt = Iterative + Incremental*):** Cắt dự án thành các nhịp ngắn cố định **1–4 tuần (Sprint / Timebox)** — mỗi Sprint vừa lấy phản hồi làm rõ yêu cầu mơ hồ, vừa xuất xưởng một phần mềm chạy thật.
5. **Hybrid (*Lai ghép có chủ đích*):** Dự án Trạm sạc Xe điện Thông minh — nhánh đào móng lắp trụ điện chạy theo **Predictive** (vì không thể đào đường 2 tuần một lần!), còn nhánh App di động tìm trạm sạc chạy theo **Agile Scrum**.

```visual
kind: groups
title: "5 Cách Tiếp Cận Phát Triển Chuẩn PMBOK® 8 §4.2"
subtitle: "Nhìn đúng từ khoá mục tiêu của đề bài để chọn phương pháp trong 15 giây"
columns: 3
items:
  - num: "1"
    title: "Predictive (Waterfall)"
    badge: "Bàn giao 1 lần cuối"
    tone: "sky"
    desc: "Yêu cầu rõ ràng · Công nghệ quen thuộc · Chi phí sửa đổi vật lý cao."
    bullets:
      - "Khoá chặt Scope trước → ước lượng Schedule & Finance"
      - "Từ khoá: fixed scope, clear requirements, high cost of change"
  - num: "2"
    title: "Iterative (Lặp làm mịn)"
    badge: "Tối ưu ĐỘ ĐÚNG ĐẮN"
    tone: "amber"
    desc: "Yêu cầu mờ cần thử nghiệm nhiều vòng · Bàn giao khi đã chốt chuẩn."
    bullets:
      - "Lặp qua Prototype / Proof of Concept để làm rõ kỳ vọng"
      - "Từ khoá: correctness, feedback on prototypes, refine understanding"
  - num: "3"
    title: "Incremental (Chia mảnh)"
    badge: "Tối ưu TỐC ĐỘ GIAO"
    tone: "cyan"
    desc: "Yêu cầu khá rõ nhưng cần đưa từng phần hoàn chỉnh ra dùng sớm."
    bullets:
      - "Mỗi đợt phát hành là một lát cắt hoàn thiện dùng được ngay"
      - "Từ khoá: speed of delivery, usable subset early, phased rollout"
  - num: "4"
    title: "Adaptive / Agile"
    badge: "Iterative + Incremental"
    tone: "emerald"
    desc: "Bất định cao cả yêu cầu lẫn kỹ thuật · Môi trường phần mềm dễ sửa đổi."
    bullets:
      - "Sprint ngắn 1–4 tuần: vừa học hỏi phản hồi vừa giao Increment chạy thật"
      - "Cố định Time & Cost, linh hoạt tối ưu Scope theo giá trị trên Backlog"
  - num: "5"
    title: "Hybrid (Lai ghép)"
    badge: "~60% bối cảnh đề PMP"
    tone: "violet"
    desc: "Phối hợp Predictive + Agile theo từng hợp phần hoặc từng giai đoạn."
    bullets:
      - "Phần cứng/pháp lý chạy Predictive + Phần mềm/UX chạy Agile"
      - "Cầu nối an toàn khi tổ chức truyền thống chuyển dịch sang linh hoạt"
```

> [!NOTE]
> **Ví dụ liên hệ giúp phân biệt Iterative và Incremental:** Có thể hình dung qua việc vẽ một bức tranh chân dung:
> - **Iterative:** Phác thảo toàn bộ bố cục bằng chì → lên mảng màu thô → hoàn thiện chi tiết. Mỗi vòng nét vẽ *chính xác hơn*, nhưng chỉ đến vòng cuối cùng sản phẩm mới hoàn chỉnh để sử dụng.
> - **Incremental:** Hoàn thiện 100% phần khuôn mặt → hoàn thiện phần nền → hoàn thiện chi tiết phụ. Mỗi phần xong là có *giá trị hoàn chỉnh ngay cho phần đó*.

## 2. Tam giác Ràng buộc đảo ngược (`Inverted Triangle`) và 4 mô hình `Hybrid` phổ biến

Sự khác biệt gốc rễ giữa tư duy truyền thống và tư duy thích ứng nằm ở **Tam giác Ràng buộc đảo ngược (Inverted Triangle of Constraints)**:

- Trong **Predictive**, ==Phạm vi (`Scope`) được ghim cố định làm đỉnh tam giác==; từ phạm vi đó PM mới tính ra cần bao nhiêu tháng (`Schedule`) và bao nhiêu tiền (`Finance`).
- Trong **Agile**, tổ chức **ghim cố định Thời gian (`Sprint 2 tuần`) và Chi phí (`quy mô đội 7 người ổn định`)**, rồi điều chỉnh **Phạm vi (`Product Backlog`)** sao cho ==những tính năng mang lại giá trị kinh doanh cao nhất luôn được làm trước==!

Ngoài đời và trong [!badge:violet:ECO 07/2026], bạn sẽ gặp 4 mẫu **Hybrid** phổ biến: (1) *Agile trước, Predictive sau* (nghiên cứu mẫu thử AI bằng Agile rồi triển khai đồng loạt cho 200 chi nhánh bằng Waterfall); (2) *Predictive trước, Agile sau*; (3) *Chạy song song đồng thời* (đội phần cứng và đội phần mềm khớp nhau tại các cột mốc tích hợp chung); và (4) *Khung lớn Predictive nhúng một mô-đun nhỏ Agile*.

## 3. Sự vận hành của 5 Focus Areas (`PMBOK 8 §4.3`) trong Predictive và Agile

Một hiểu lầm phổ biến là *"Làm Agile thì không cần lập kế hoạch hay kiểm soát"*. Thực tế, **5 Nhóm trọng tâm (Focus Areas)** của PMBOK 8 luôn hiện diện đầy đủ trong cả hai mô hình nhưng khác nhau về nhịp độ thực thi:

```visual
kind: layers
title: "5 Focus Areas (PMBOK® 8 §4.3): Pha Tuần tự Lớn vs Vòng lặp Ngắn"
subtitle: "Agile lập kế hoạch liên tục ở nhiều tầng thay vì dồn hết vào tháng đầu tiên"
columns:
  - title: "Trong Predictive (Plan-Driven)"
    badge: "Theo Pha Lớn Đầu Kỳ"
    tone: "sky"
    layers:
      - label: "1. Initiating & 2. Planning"
        detail: "Ký Charter → Lập PM Plan chi tiết toàn diện & khoá cứng Baselines đầu dự án"
        tone: "sky"
      - label: "3. Executing"
        detail: "Thi công theo WBS đã chốt, kiểm toán quy trình QA và điều phối nguồn lực"
        tone: "amber"
      - label: "4. Monitoring & Controlling + 5. Closing"
        detail: "Đo CPI/SPI, duyệt Change Request qua CCB, nghiệm thu & đóng pha cuối kỳ"
        tone: "cyan"
  - title: "Trong Adaptive / Agile (Change-Driven)"
    badge: "Lặp Gọn Mỗi Sprint"
    tone: "emerald"
    layers:
      - label: "1. Initiating & 2. Planning (Đa tầng)"
        detail: "Vision/Charter → Product Roadmap → Release Plan → Refinement → Sprint Planning"
        tone: "emerald"
      - label: "3. Executing"
        detail: "Đội đa chức năng tự tổ chức xây Increment, đồng bộ qua Daily Standup 15 phút"
        tone: "cyan"
      - label: "4. Monitoring & Controlling + 5. Closing"
        detail: "Giới hạn WIP, Burndown, demo ở Sprint Review, cải tiến ở Retro & đóng Release"
        tone: "amber"
```

## 4. Nguyên tắc `Tailoring` (tùy biến phương pháp) khi chuyển đổi sang Agile

**Tailoring (*May đo / Tùy biến quy trình*)** nghĩa là PM chủ động chọn lọc và điều chỉnh phương pháp sao cho phù hợp với văn hóa tổ chức, năng lực đội ngũ và độ phức tạp của sản phẩm, thay vì áp dụng rập khuôn một mô hình lý thuyết.

> [!TIP]
> **Xử lý tình huống chuyển đổi quy trình trong đề thi:** Nếu đề bài mô tả một tổ chức truyền thống (như ngân hàng lâu năm quen kiểm soát chặt chẽ) muốn chuyển sang Agile, đáp án đúng **không bao giờ** là *"Xoá bỏ ngay toàn bộ tài liệu và ép chuyển 100% sang Scrum từ tuần sau"*. Phương án chuẩn là ==triển khai mô hình Hybrid chuyển tiếp, chọn dự án thí điểm (Pilot) kết hợp đào tạo và huấn luyện (Coaching) từng bước==.
