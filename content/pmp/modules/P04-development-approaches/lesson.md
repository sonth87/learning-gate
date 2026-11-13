## 1. Ma trận Stacey & Phổ Phát triển (`PMBOK 8 Standard §4.2`): Bắt mạch Độ bất định

Trong [!badge:amber:PMBOK 8], các phương pháp phát triển không đối đầu nhau kiểu "cũ — mới", mà nằm trên một **dải phổ liên tục (Spectrum)** từ định hướng kế hoạch đến định hướng thích ứng. Công cụ chẩn đoán nhanh nhất trên [!badge:sky:PMA Bridge] là **Ma trận Stacey** dựa trên 2 trục: **Độ bất định Yêu cầu (What)** × **Độ bất định Kỹ thuật (How)**, cộng thêm **Chi phí thay đổi (Cost of Change)**.

```visual
kind: groups
title: "5 Cách Tiếp Cận Phát Triển Chuẩn PMBOK® 8 §4.2"
subtitle: "Bắt đúng từ khoá mục tiêu trong đề bài để khoanh đáp án trong 15 giây"
columns: 3
items:
  - num: "1"
    title: "Predictive (Waterfall)"
    badge: "Bàn giao 1 lần cuối"
    tone: "sky"
    desc: "Yêu cầu rõ từ đầu · Công nghệ quen thuộc · Chi phí sửa đổi vật lý rất đắt."
    bullets:
      - "Khoá chặt Scope trước → ước lượng Schedule & Finance"
      - "VD: Xây cầu đường, lắp dây chuyền nhà máy, chuẩn pháp lý cứng"
  - num: "2"
    title: "Iterative (Lặp tinh chỉnh)"
    badge: "Tối ưu ĐỘ ĐÚNG ĐẮN"
    tone: "amber"
    desc: "Yêu cầu còn mơ hồ cần thử nghiệm · Thường bàn giao chính thức 1 lần khi đã chốt chuẩn."
    bullets:
      - "Lặp qua Prototype / Mockup / Wireframe để thu phản hồi làm rõ yêu cầu"
      - "Từ khoá đề thi: correctness, feedback on prototypes, refine understanding"
  - num: "3"
    title: "Incremental (Tăng trưởng)"
    badge: "Tối ưu TỐC ĐỘ GIAO"
    tone: "cyan"
    desc: "Bức tranh tổng thể khá rõ nhưng khách hàng cần dùng sớm từng phần hoàn chỉnh."
    bullets:
      - "Chia sản phẩm thành các mảnh độc lập dùng được ngay sau mỗi đợt release"
      - "Từ khoá đề thi: speed of delivery, usable subset early, phased rollout"
  - num: "4"
    title: "Adaptive / Agile"
    badge: "Iterative + Incremental"
    tone: "emerald"
    desc: "Bất định cao cả yêu cầu lẫn kỹ thuật · Môi trường số chi phí thay đổi thấp."
    bullets:
      - "Timebox ngắn 1–4 tuần: vừa lặp lấy phản hồi vừa giao Increment chạy được"
      - "Cố định Time & Cost, để Scope biến thiên theo giá trị trên Backlog"
  - num: "5"
    title: "Hybrid (Lai ghép)"
    badge: "~60% trọng tâm đề PMP"
    tone: "violet"
    desc: "Kết hợp có chủ đích Predictive + Adaptive theo hợp phần hoặc giai đoạn."
    bullets:
      - "Phần cứng/hạ tầng/mua sắm chạy Predictive + Phần mềm/UX chạy Agile"
      - "Bước đệm an toàn khi tổ chức truyền thống mới chuyển đổi sang Agile"
```

> [!WARNING] Cặp song sinh hay làm rớt điểm nhất: `Iterative` vs `Incremental`
> Hãy tưởng tượng vẽ bức tranh nàng Mona Lisa:
> - **Iterative (Vẽ phác thảo toàn bức → lên nét → tô màu):** Mỗi vòng làm *rõ và đúng hơn*, nhưng chỉ vòng cuối mới treo lên tường được.
> - **Incremental (Vẽ hoàn chỉnh khuôn mặt → vẽ hoàn chỉnh đôi tay → vẽ nền):** Mỗi lát cắt xong là *hoàn chỉnh 100% ở phần đó*.
> - **Agile:** Kết hợp cả hai trong từng Sprint ngắn!

## 2. Đảo ngược Tam giác Ràng buộc & 4 Mẫu Hybrid thực chiến

- [x] **Predictive:** Cố định **Scope** làm gốc → ước lượng thời gian và ngân sách cần thiết.
- [x] **Adaptive / Agile:** Đảo ngược đỉnh tam giác — cố định **Schedule (Timebox)** và **Finance (Team size ổn định)**, từ đó tối ưu hoá **Scope có giá trị cao nhất** làm được trong khung đó.
- [x] **4 mẫu Hybrid thường gặp trong [!badge:violet:ECO 07/2026]:** (1) *Agile rồi Predictive* (R&D mẫu thử bằng Agile → sản xuất hàng loạt bằng Predictive); (2) *Predictive rồi Agile*; (3) *Song song đồng thời* (Phần cứng Waterfall + Phần mềm Scrum hội tụ tại các mốc tích hợp); (4) *Khung lớn Predictive rải một hợp phần nhỏ Agile* (ví dụ 10% công việc thiết kế giao diện phức tạp).

## 3. 5 Focus Areas (`PMBOK 8 §4.3`) vận hành xuyên mọi phương pháp thế nào?

Đừng bao giờ nghĩ Agile "không lập kế hoạch" hay "không kiểm soát"! Trong [!badge:amber:PMBOK 8], cả **5 Focus Areas** đều hiện diện nhưng thay đổi nhịp điệu thực thi:

```visual
kind: layers
title: "5 Focus Areas (PMBOK® 8 §4.3): Tuần tự Lớn vs Vòng lặp Liên tục"
subtitle: "Agile lập kế hoạch và kiểm soát nhiều hơn cả Waterfall — chỉ là chia nhỏ theo từng nhịp ngắn!"
columns:
  - title: "Trong Predictive (Plan-Driven)"
    badge: "Theo Pha Lớn"
    tone: "sky"
    layers:
      - label: "1. Initiating & 2. Planning"
        sub: "Ký Charter → Lập PM Plan tổng thể chi tiết & khoá Baselines đầu kỳ"
        note: "Upfront"
        tone: "sky"
      - label: "3. Executing"
        sub: "Thực thi theo WBS, Manage QA và điều phối nguồn lực"
        note: "Theo Plan"
        tone: "amber"
      - label: "4. Monitoring & Controlling + 5. Closing"
        sub: "Đo CPI/SPI, duyệt Change Request qua CCB, nghiệm thu & đóng cuối kỳ"
        note: "Kiểm soát mốc"
        tone: "violet"
  - title: "Trong Adaptive / Agile (Change-Driven)"
    badge: "Lặp Trong Mỗi Sprint"
    tone: "emerald"
    layers:
      - label: "1. Initiating & 2. Planning (Đa tầng)"
        sub: "Vision/Charter → Roadmap → Release Plan → Refinement → Sprint Planning"
        note: "Progressive"
        tone: "emerald"
      - label: "3. Executing"
        sub: "Nhóm cross-functional tự tổ chức xây Increment, họp Daily 15 phút"
        note: "Timebox 1–4w"
        tone: "cyan"
      - label: "4. Monitoring & Controlling + 5. Closing"
        sub: "Kanban WIP, Burndown, nghiệm thu tại Sprint Review, cải tiến ở Retro & đóng Release"
        note: "Liên tục"
        tone: "amber"
```

> [!REMEMBER] Phản xạ khi tổ chức truyền thống muốn "chuyển sang Agile ngay ngày mai"
> Nếu ban lãnh đạo hào hứng đòi áp dụng 100% Agile thuần tuý ngay lập tức cho một tổ chức quen làm Waterfall lâu năm và sợ rủi ro: **KHÔNG nhảy vọt cực đoan!** Hãy khuyến nghị **cách tiếp cận Hybrid chuyển tiếp**, thí điểm trên hợp phần phù hợp kèm đào tạo & huấn luyện (Coaching).
