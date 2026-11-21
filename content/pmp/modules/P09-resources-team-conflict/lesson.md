## 1. Giải mã bằng ví dụ đội kỹ thuật: `Team Charter` là gì và khác `Project Charter` ra sao?

Khi ghép 4 kỹ sư Backend cũ với 3 lập trình viên Mobile mới tuyển vào cùng một dự án, tuần đầu tiên thường nảy sinh đủ chuyện dở khóc dở cười: người quen thức code lúc 1 giờ sáng rồi ngủ tới trưa làm nhỡ buổi họp Daily, người gửi Pull Request 5 ngày không ai review, lúc góp ý code thì dùng lời lẽ gay gắt chạm tự ái nhau!

Trong **PMBOK® Guide 8 (`§2.6` — Miền Resources, quy trình `Lead the Team`)**, công cụ đầu tiên để phòng ngừa hỗn loạn nội bộ chính là **Team Charter** (*còn gọi là Social Contract / Ground Rules — Bản thoả ước làm việc của đội*):

- **Đừng bao giờ nhầm với `Project Charter`:** Nếu `Project Charter` do Sponsor ký để khai sinh dự án và trao quyền cho PM, thì ==Team Charter do chính toàn bộ thành viên trong nhóm cùng ngồi thảo luận và đồng thuận viết ra==!
- **Nội dung thiết thực bên trong:** Quy ước giờ họp chung không ai vắng mặt (*Core Hours*), chuẩn mực giao tiếp tôn trọng khi tranh luận kỹ thuật, cam kết review code trong vòng 4 giờ, và cách nhóm biểu quyết khi bất đồng ý kiến. Khi chính tay anh em lập ra luật chơi, cả đội sẽ tự giác giữ kỷ luật mà không cần PM đứng canh từng người.

## 2. Năm bậc phát triển nhóm của `Tuckman` & Phong cách lãnh đạo linh hoạt

Nhà tâm lý học Bruce Tuckman chỉ ra rằng mọi đội nhóm đều trải qua **5 giai đoạn tâm lý tự nhiên**. Một PM giỏi không giữ khư khư một kiểu lãnh đạo duy nhất, mà phải ==uyển chuyển đổi phong cách dẫn dắt theo từng nấc trưởng thành của đội==:

- **Forming (*Hình thành*) → Chỉ dẫn rõ (*Directing*):** Ngày đầu tiên 7 thành viên mới ngồi vào bàn, ai cũng lịch sự dè dặt nhìn PM chờ phân việc. Lúc này PM cần nêu mục tiêu dự án thật rõ và tạo không gian để cả đội cùng viết `Team Charter`.
- **Storming (*Sóng gió*) → Huấn luyện (*Coaching*):** Sang tuần thứ 3, Backend và Mobile bắt đầu cãi nhau gay gắt về chuẩn thiết kế API. Đừng hoảng hốt dập tắt tranh luận — đây là bước chuyển mình tất yếu! PM dùng Trí tuệ cảm xúc lắng nghe và huấn luyện nhóm tranh biện dựa trên số liệu khách観.
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

## 3. Trí tuệ Cảm xúc (`EI`), Động lực Nội tại & Quản trị Nhóm Từ xa (`Virtual Team`)

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

## 4. Năm chế độ Giải quyết Xung đột & Phản xạ vàng khi nhân sự đuối sức

Khi hai Senior Engineer cãi nhau nảy lửa về việc chọn PostgreSQL hay MongoDB, bạn xử lý thế nào? Hãy khắc cốt ghi tâm **thang can thiệp 3 bước** và **5 chế độ giải quyết xung đột** sau:

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
> **Phản xạ vàng trước nhân sự làm việc kém hiệu quả:** Gặp câu hỏi *"Một lập trình viên liên tục trễ task 2 Sprint gần đây"*, hãy gạch bỏ ngay đáp án đòi sa thải, cắt thưởng hay trả về phòng chức năng! Đáp án chuẩn luôn là: ==Hẹn gặp riêng 1-1 một cách tôn trọng và thấu cảm để tìm nguyên nhân gốc rễ → hỗ trợ đào tạo (Training), kèm cặp (Coaching / Pair Programming) hoặc tái phân bổ công việc phù hợp sở trường==.
