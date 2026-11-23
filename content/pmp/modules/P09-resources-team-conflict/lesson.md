## 1. Thỏa ước làm việc nhóm (`Team Charter`) và sự khác biệt với Điều lệ dự án (`Project Charter`)

Khi tập hợp một nhóm kỹ thuật gồm các thành viên từ nhiều bộ phận hoặc thói quen làm việc khác nhau, giai đoạn đầu thường phát sinh ma sát trong phối hợp: khác biệt giờ làm việc, thời gian phản hồi code review kéo dài hoặc cách góp ý chuyên môn thiếu thống nhất.

Trong **PMBOK® Guide 8 (`§2.6` — Miền Resources, quy trình `Lead the Team`)**, công cụ nền tảng để thiết lập kỷ luật tự quản ngay từ đầu là **Team Charter** (*còn gọi là Social Contract / Ground Rules — Thỏa ước làm việc của nhóm*):

- **Phân biệt với `Project Charter`:** Trong khi `Project Charter` do Sponsor ký để phê duyệt dự án và trao quyền cho PM, thì ==Team Charter do toàn bộ thành viên trong nhóm cùng thảo luận và đồng thuận xây dựng==.
- **Nội dung cốt lõi:** Quy định khung giờ làm việc chung (*Core Hours*), chuẩn mực giao tiếp tôn trọng khi phản biện kỹ thuật, cam kết thời gian review code, và cơ chế biểu quyết khi phát sinh bất đồng. Khi chính đội ngũ tham gia thiết lập quy tắc, mức độ tự giác tuân thủ sẽ cao hơn nhiều so với nội quy áp đặt từ trên xuống.

## 2. Mô hình 5 giai đoạn phát triển nhóm `Tuckman` và phong cách lãnh đạo tương ứng

Nhà tâm lý học Bruce Tuckman chỉ ra rằng mọi đội nhóm đều trải qua **5 giai đoạn phát triển**. PM cần ==điều chỉnh linh hoạt phong cách lãnh đạo tương ứng với từng giai đoạn trưởng thành của nhóm==:

- **Forming (*Hình thành*) → Chỉ dẫn rõ (*Directing*):** Khi các thành viên mới bắt đầu làm việc cùng nhau, tâm lý chung còn dè dặt và phụ thuộc vào điều phối của PM. Lúc này PM cần làm rõ mục tiêu dự án và hướng dẫn nhóm cùng xây dựng `Team Charter`.
- **Storming (*Sóng gió*) → Huấn luyện (*Coaching*):** Khi bắt tay vào công việc thực tế, nhóm bắt đầu nảy sinh bất đồng về giải pháp kỹ thuật hoặc cách phối hợp. Đây là giai đoạn bình thường trong tiến trình phát triển nhóm; PM cần lắng nghe, giữ môi trường trao đổi an toàn và huấn luyện nhóm giải quyết bất đồng dựa trên dữ liệu khách quan.
- **Norming (*Ổn định*) → Hỗ trợ (*Supporting*):** Nhóm bắt đầu hiểu ý nhau, tự giác tuân thủ quy ước review code. PM lùi lại một bước để khích lệ sự tin cậy.
- **Performing (*Bứt phá*) → Trao quyền (*Delegating*):** Nhóm vận hành trơn tru như một cỗ máy tự tổ chức. PM trao quyền tối đa ở tầng kỹ thuật để tập trung tháo gỡ các rào cản chiến lược bên ngoài.
- **Adjourning (*Giải tán*) → Ghi nhận & Chuyển tiếp:** Khi dự án đóng lại, PM tổ chức vinh danh thành quả và giúp thành viên tự tin bước sang dự án mới.

> [!WARNING]
> **Bẫy động học nhóm cực hay hỏi trong đề thi:** Giả sử đội của bạn đang chạy cực mượt ở giai đoạn `Performing`, bỗng nhiên khách hàng mở rộng phạm vi nên công ty điều thêm **2 lập trình viên mới tinh** vào nhóm (hoặc rút 1 trụ cột đi). Nhóm sẽ chuyển sang giai đoạn nào? Đáp án bắt buộc là ==quay ngược về giai đoạn Forming== — vì cấu trúc mối quan hệ và quy ước phối hợp phải thiết lập lại từ đầu!

```visual
kind: flow
title: "5 Giai đoạn Phát triển Nhóm Tuckman & Vai trò tương ứng của PM"
subtitle: "Quy luật động học quan trọng: Thêm hoặc thay thành viên giữa chừng sẽ kéo nhóm lùi về Forming!"
steps:
  - icon: "compass"
    badge: "1. FORMING"
    title: "Hình thành → Chỉ dẫn rõ (Directing)"
    desc: "Mọi người còn khách sáo, dè dặt, chưa rõ ai làm gì. PM định hướng mục tiêu rõ ràng và xúc tác lập Team Charter."
    tone: "sky"
    edge: "Bắt đầu cọ xát"
  - icon: "zap"
    badge: "2. STORMING"
    title: "Sóng gió → Huấn luyện (Coaching)"
    desc: "Tranh cãi kiến trúc code, va chạm cá tính mạnh. PM bình tĩnh lắng nghe, dẫn dắt giải quyết xung đột dựa trên dữ liệu."
    tone: "rose"
    edge: "Hiểu nhịp nhau"
  - icon: "handshake"
    badge: "3. NORMING"
    title: "Ổn định → Hỗ trợ (Supporting)"
    desc: "Quy ước vận hành êm ái, đồng đội bắt đầu tin tưởng bọc lót nhau. PM lùi lại khích lệ và củng cố tinh thần."
    tone: "amber"
    edge: "Vào guồng cao"
  - icon: "award"
    badge: "4. PERFORMING"
    title: "Bứt phá → Trao quyền (Delegating)"
    desc: "Đội tự tổ chức ăn ý, tự xử lý vấn đề kỹ thuật cực nhanh. PM trao quyền tối đa để tập trung gỡ rào cản chiến lược."
    tone: "emerald"
    edge: "Về đích dự án"
  - icon: "check"
    badge: "5. ADJOURNING"
    title: "Giải tán → Ghi nhận & Chuyển tiếp"
    desc: "Đóng dự án, tôn vinh đóng góp của tập thể, đúc kết bài học và hỗ trợ anh em yên tâm nhận nhiệm vụ mới."
    tone: "cyan"
```

## 3. Trí tuệ Cảm xúc (`EI`), Động lực nội tại và Quản trị nhóm phân tán (`Virtual Team`)

Chiếm tới **33% tổng điểm đề thi**, miền **People** của [!badge:violet:ECO 07/2026] đòi hỏi PM dẫn dắt kỹ sư tri thức bằng sự thấu cảm thay vì mệnh lệnh hành chính:

```visual
kind: groups
title: "3 Trụ cột Giữ Lửa & Gắn Kết Đội Ngũ Kỹ Thuật Hiện Đại"
subtitle: "Hiểu tâm lý con người để giải quyết tận gốc tình trạng chán nản, im lặng hoặc cô lập"
columns: 3
items:
  - num: 1
    icon: "lightbulb"
    title: "Emotional Intelligence (EI)"
    badge: "TRÍ TUỆ CẢM XÚC"
    tone: "cyan"
    desc: "Nhận diện và điều tiết cảm xúc của bản thân trước khi phản ứng với đồng đội."
    bullets:
      - "Nội tâm: Self-Awareness (nhận biết mình đang bực) & Self-Management (kiềm chế, không nổi nóng)."
      - "Xã hội: Empathy (đặt mình vào áp lực của người khác) & Relationship Management."
  - num: 2
    icon: "target"
    title: "Động lực Nội tại (Daniel Pink)"
    badge: "AUTONOMY · MASTERY · PURPOSE"
    tone: "emerald"
    desc: "Với kỹ sư phần mềm, 3 nguồn động lực bền bỉ nhất vượt xa tiền thưởng ngắn hạn là:"
    bullets:
      - "Autonomy (Tự chủ): được tin tưởng tự chọn giải pháp thực hiện công việc."
      - "Mastery (Tinh thông): được học công nghệ mới, được đàn anh kèm cặp nâng tay nghề."
      - "Purpose (Ý nghĩa): hiểu rõ dòng code của mình giúp ích gì cho hàng triệu người dùng."
  - num: 3
    icon: "users"
    title: "Nhóm Phân tán (Virtual Team)"
    badge: "VƯỢT LỆCH MÚI GIỜ"
    tone: "sky"
    desc: "Làm việc từ xa đa quốc gia dễ sinh hiểu lầm văn hoá và cảm giác bị bỏ rơi."
    bullets:
      - "Thống nhất khung giờ giao thoa hợp lý (Overlap Hours) công bằng giữa các múi giờ."
      - "Dùng bảng trực quan chung kết hợp cuộc gọi bật camera định kỳ để xây dựng kết nối con người."
```

## 4. Năm phương pháp giải quyết xung đột và cách hỗ trợ thành viên suy giảm hiệu suất

Khi hai kỹ sư cấp cao bất đồng gay gắt về việc lựa chọn cơ sở dữ liệu hay kiến trúc hệ thống, PM cần nắm vững **thang can thiệp 3 bước** và **5 phương pháp giải quyết xung đột** sau:

```visual
kind: anatomy
title: "Thang Can thiệp 3 Bước & 5 Chế độ Xử lý Xung đột Chuẩn PMI"
subtitle: "Khoảng 90% câu hỏi xung đột trong đề PMP có đáp án đúng là Collaborate / Problem Solve!"
items:
  - keyword: "Thang can thiệp 3 Bước"
    role: "Ai giải quyết trước?"
    tone: "amber"
    summary: "Bước 1: Tranh luận chuyên môn lành mạnh → **để nhóm tự giải quyết** theo Team Charter. Bước 2: Leo thang thành căng thẳng cá nhân → PM **gặp riêng 1-1 kín đáo** tìm nguyên nhân gốc. Bước 3: Đưa các bên ngồi lại phân tích dữ liệu chung (chỉ báo HR khi vi phạm pháp luật/quấy rối/đạo đức!)."
  - keyword: "1. Collaborate / Problem Solve"
    role: "Thắng – Thắng (Win–Win · ƯU TIÊN SỐ 1)"
    tone: "emerald"
    summary: "Đối thoại cởi mở, mang số liệu benchmark thực tế ra phân tích để chọn giải pháp tốt nhất cho dự án. ==Tạo sự đồng thuận và cam kết dài hạn cao nhất==."
  - keyword: "2. Compromise / Reconcile"
    role: "Mỗi bên lùi một bước (Lose–Lose chấp nhận được)"
    tone: "sky"
    summary: "Dung hoà mỗi bên nhượng bộ một phần để đi tiếp khi thời gian không cho phép tìm phương án hoàn hảo 100%."
  - keyword: "3. Smooth · 4. Force · 5. Withdraw"
    role: "Ba chế độ tình thế cần hết sức thận trọng"
    tone: "rose"
    summary: "**Smooth** (xoa dịu điểm chung tạm thời); **Force / Direct** (áp đặt Win–Lose — ==CHỈ dùng khi khẩn cấp cứu nguy an toàn, bảo mật hoặc tuân thủ luật==); **Withdraw / Avoid** (né tránh — tệ nhất, trừ khi tạm nghỉ 30 phút cho hạ hoả cơn giận!)."
```

> [!TIP]
> **Cách xử lý chuẩn PMI khi thành viên suy giảm hiệu suất:** Khi đề bài nêu *"Một lập trình viên liên tục chậm tiến độ trong 2 Sprint gần đây"*, cần loại bỏ ngay các phương án sa thải, cắt thưởng hay trả về phòng chức năng. Phương án chuẩn là: ==Hẹn gặp riêng 1-1 một cách tôn trọng và thấu cảm để tìm nguyên nhân gốc rễ → hỗ trợ đào tạo (Training), kèm cặp (Coaching / Pair Programming) hoặc điều chỉnh phân công phù hợp năng lực==.
