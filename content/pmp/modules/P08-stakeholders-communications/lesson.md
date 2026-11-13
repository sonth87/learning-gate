## 1. Phân loại Quyền lực & Dịch chuyển Thái độ bằng Ma trận SEAM

Trong **PMBOK® Guide 8 (`§2.5`)**, PMI hợp nhất **Stakeholder Engagement** và **Communications** vào chung một miền duy nhất là **Stakeholders** (7 quy trình) [!badge:amber:PMBOK 8] — bởi giao tiếp chính là phương tiện cốt lõi để gắn kết con người.

Việc nhận diện bên liên quan (**Identify Stakeholders**) diễn ra **ngay từ lúc khởi tạo và lặp lại liên tục** suốt dự án. Sau khi ghi vào **Stakeholder Register**, PM phân tích vị thế bằng **Power/Interest Grid** (*High Power + High Interest → Manage Closely*; *High Power + Low Interest → Keep Satisfied*; *Low Power + High Interest → Keep Informed*; *Low + Low → Monitor*) hoặc **Salience Model** (*Power · Urgency · Legitimacy*).

Tiếp theo, để đo và thu hẹp khoảng cách thái độ giữa trạng thái hiện tại (**C — Current**) và trạng thái kỳ vọng (**D — Desired**), PM dùng **Stakeholder Engagement Assessment Matrix (SEAM)** [!badge:sky:PMA Bridge]:

```visual
kind: flow
title: "Thang 5 Nấc Thái độ trên Ma trận Gắn kết SEAM (C → D)"
subtitle: "Nhiệm vụ của PM là thiết kế chiến lược đưa Stakeholder chủ chốt từ trái sang phải"
steps:
  - icon: "eye"
    badge: "1. UNAWARE"
    title: "Chưa biết gì"
    desc: "Chưa nắm thông tin về dự án và tác động tới họ → Cần cung cấp bức tranh mục tiêu rõ ràng."
    tone: "slate"
    edge: "Nếu lo sợ mất quyền lợi"
  - icon: "alert"
    badge: "2. RESISTANT"
    title: "Phản đối / Kháng cự"
    desc: "Ngầm chặn hoặc phản bác thay đổi → Gặp riêng 1-1 lắng nghe nỗi lo gốc rễ, KHÔNG né tránh!"
    tone: "rose"
    edge: "Giải toả nghi ngại"
  - icon: "scale"
    badge: "3. NEUTRAL"
    title: "Trung lập"
    desc: "Biết dự án nhưng không ủng hộ cũng không chống → Minh bạch lợi ích thực tế liên quan tới họ."
    tone: "amber"
    edge: "Tạo sự đồng thuận"
  - icon: "handshake"
    badge: "4. SUPPORTIVE"
    title: "Ủng hộ (Đích phổ biến)"
    desc: "Đồng tình và sẵn sàng phối hợp nguồn lực giúp dự án thành công."
    tone: "emerald"
    edge: "Trao vai trò lan toả"
  - icon: "award"
    badge: "5. LEADING"
    title: "Dẫn dắt / Tiên phong"
    desc: "Chủ động vận động người khác cùng ủng hộ dự án (thường cần ở Sponsor và Key Champions)."
    tone: "cyan"
```

- [!] **Thứ tự chuẩn khi xuất hiện Stakeholder mới giữa dự án**: ==(1) Cập nhật vào Stakeholder Register → (2) Phân tích mức ảnh hưởng, mối quan tâm và thái độ hiện tại → (3) Cập nhật Stakeholder Engagement Plan & Communications Plan → (4) Chủ động gặp gỡ gắn kết==.

## 2. Ba Phương thức Truyền thông (`Interactive · Push · Pull`)

Truyền thông hiệu quả không phải là spam thật nhiều tài liệu, mà là đưa **đúng thông tin, đúng định dạng, đúng thời điểm** theo công thức kênh liên lạc $N(N-1)/2$:

```visual
kind: groups
title: "Chọn đúng Phương thức Giao tiếp theo Tình huống Đề thi"
subtitle: "Ưu tiên số 1 của PMI cho vấn đề phức tạp/nhạy cảm luôn là Interactive!"
columns: 3
items:
  - num: 1
    icon: "users"
    title: "Interactive (Tương tác 2 chiều)"
    badge: "NHẠY CẢM · PHỨC TẠP"
    tone: "emerald"
    desc: "Trao đổi thời gian thực giúp xác nhận sự thấu hiểu và đọc được ngôn ngữ cơ thể ngay lập tức."
    bullets:
      - "Họp mặt trực tiếp, gọi video, workshop giải quyết vấn đề, Daily Standup."
      - "BẮT BUỘC ưu tiên khi giải quyết xung đột, hiểu lầm, tin xấu hoặc thuyết phục người Resistant."
  - num: 2
    icon: "file"
    title: "Push (Đẩy thông tin 1 chiều)"
    badge: "GHI NHẬN CHÍNH THỨC"
    tone: "amber"
    desc: "Gửi tới danh sách người nhận xác định — đảm bảo ĐÃ GỬI nhưng chưa đảm bảo người nhận ĐÃ HIỂU."
    bullets:
      - "Email thông báo mốc lịch, biên bản cuộc họp, bản tin trạng thái tuần (Status Report), công văn."
      - "Phù hợp lưu dấu vết văn bản (audit trail) và cập nhật thông tin một chiều định kỳ."
  - num: 3
    icon: "search"
    title: "Pull (Tự tra cứu theo nhu cầu)"
    badge: "KHỐI LƯỢNG LỚN · ĐÔNG NGƯỜI"
    tone: "sky"
    desc: "Đặt thông tin lên kho tập trung để số đông người nhận tự truy cập bất cứ lúc nào cần."
    bullets:
      - "Cổng nội bộ Intranet, Confluence Wiki, kho tài liệu kỹ thuật, bảng Radiator công khai, E-learning."
      - "Lý tưởng cho hàng trăm người dùng cuối hoặc kho dữ liệu tham chiếu đồ sộ."
```

## 3. Tuyệt chiêu Tách Bẫy: Stakeholder Plan vs Communications Plan

Trong phòng thi, hai lựa chọn *"Update the Stakeholder Engagement Plan"* và *"Update the Communications Management Plan"* luôn đứng cạnh nhau để bẫy bạn [!badge:rose:Bẫy đề thi]. Hãy dùng lăng kính phân tách sắc lẹm sau:

```visual
kind: compare
title: "Khi nào sửa Stakeholder Engagement Plan vs Communications Management Plan?"
subtitle: "Mẹo 3 giây nhìn từ khoá triệu chứng để chọn trúng 100%"
left:
  badge: "CÁI GÌ · KÊNH NÀO · BAO LÂU?"
  title: "Communications Management Plan"
  tone: "sky"
  bullets:
    - "Triệu chứng: 'Tôi không nhận được báo cáo tuần', 'Báo cáo dài quá khó đọc', 'Gửi nhầm định dạng hoặc sai ngôn ngữ'."
    - "Quy định: Ai nhận thông tin gì, tần suất bao lâu, định dạng nào (Dashboard vs PDF), kênh nào (Push/Pull/Interactive) và ai chịu trách nhiệm gửi."
    - "Từ khoá mở khoá: Information needs, format, frequency, distribution channel, missed reports."
right:
  badge: "TẠI SAO HỌ CHỐNG ĐỐI / THỜ Ơ?"
  title: "Stakeholder Engagement Plan"
  tone: "emerald"
  bullets:
    - "Triệu chứng: 'Trưởng phòng vận hành liên tục vắng họp và chê dự án', 'Khách hàng mất niềm tin, sợ hệ thống mới làm mất việc'."
    - "Quy định: Chiến lược xây dựng mối quan hệ, tháo gỡ rào cản tâm lý và thu hẹp khoảng cách thái độ trên ma trận SEAM (ví dụ từ Resistant → Supportive)."
    - "Từ khoá mở khoá: Attitude, resistance, buy-in, influence, expectations, level of engagement."
```

> [!TIP] Khẩu quyết bỏ túi trước khi vào phòng thi
> **Báo cáo vẫn tới đều nhưng lòng người vẫn chống đối** → mở ==Stakeholder Engagement Plan==! **Lòng người rất thiện chí nhưng thông tin bị sót, trễ hoặc rối rắm** → mở ==Communications Management Plan==!
