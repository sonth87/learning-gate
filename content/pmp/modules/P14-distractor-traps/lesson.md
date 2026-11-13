## 1. Hệ thống 12 Bẫy Đáp Án Nhiễu (Distractors) chia theo 4 Nhóm Tâm lý

Người ra đề PMP không viết đáp án sai ngẫu nhiên — họ thiết kế **3 phương án nhiễu** sao cho giống hệt những thói quen "chữa cháy êm chuyện" ngoài doanh nghiệp. Trong hệ thống phân tích lỗi `WeaknessTag` bên PMP Mindmap, toàn bộ đáp án bẫy quy về **4 cụm nhận diện tức thời**:

```visual
kind: groups
title: "Bản đồ 12 Bẫy Đáp Án Nhiễu Kinh Điển (Gặp là cảnh giác đỏ!)"
subtitle: "Chỉ cần nhận mặt 4 nhóm này, bạn sẽ loại sạch 2 đáp án nhiễu trong 20 giây đầu tiên!"
columns: 2
items:
  - num: 1
    title: "Nhóm Cực đoan & Trừng phạt (1–3)"
    badge: "LOẠI NGAY 99%"
    tone: "rose"
    bullets:
      - "**#1 Từ khoá tuyệt đối:** *luôn luôn (always), không bao giờ (never), ngay lập tức huỷ dự án, từ chối mọi thay đổi* (trừ vi phạm đạo đức/an toàn)."
      - "**#2 Sa thải / Thay người:** Đòi đuổi thành viên làm chậm, trả người về phòng ban hoặc chấm dứt hợp đồng Vendor ngay lần lỗi đầu."
      - "**#3 Ép buộc độc đoán:** Ép làm thêm giờ (Overtime) liên tục, phạt lương hoặc ra lệnh một chiều thay vì huấn luyện."
  - num: 2
    title: "Nhóm Đẩy bóng & Né trách nhiệm (4–6)"
    badge: "BẪY ĐỜI THỰC SỐ 1"
    tone: "amber"
    bullets:
      - "**#4 Leo thang lên Sponsor:** Xin Sponsor quyết hộ xung đột nhóm, xin thêm tiền/thời gian khi chưa phân tích phương án nén lịch."
      - "**#5 Đùn đẩy sang HR / PMO / Functional Manager:** Nhờ HR hoà giải mâu thuẫn kỹ thuật hoặc nhờ PMO viết hộ kế hoạch."
      - "**#6 Đẩy việc cho Khách hàng:** Bắt khách hàng tự kiểm thử tìm lỗi nội bộ thay cho bước Control Quality."
  - num: 3
    title: "Nhóm Thụ động & Đường tắt (7–9)"
    badge: "SAI TƯ DUY PMI"
    tone: "violet"
    bullets:
      - "**#7 Trì hoãn thụ động:** *'Chờ xem tuần sau thế nào'*, *'Đợi đến cuối Sprint mới gỡ Impediment đang chặn nhóm hôm nay'*."
      - "**#8 Giao tiếp gián tiếp lạnh lùng:** Gửi email hàng loạt (mass email) nhắc nhở cả đội thay vì gặp riêng 1-1 trực tiếp."
      - "**#9 Đi đường tắt / Che giấu:** Cắt bớt test cho kịp ngày giao, thêm tính năng ngầm (*Gold Plating*), làm đẹp số liệu báo cáo."
  - num: 4
    title: "Nhóm Nhảy cóc & Tráo vai trò (10–12)"
    badge: "BẪY QUY TRÌNH TINH VI"
    tone: "sky"
    bullets:
      - "**#10 Nhảy cóc quy trình:** Cập nhật Baseline hoặc bắt tay sửa code **trước khi** đánh giá tác động và trình CCB duyệt."
      - "**#11 Tráo sổ Risk ↔ Issue:** Đem sự cố đã xảy ra ghi vào `Risk Register` (hoặc đem rủi ro tương lai ghi vào `Issue Log`)."
      - "**#12 Lẫn lộn vai trò Agile:** PM/Scrum Master tự sắp xếp `Product Backlog`, tự ước lượng Story Points thay Developers, hoặc PO giao việc chỉ định từng người."
```

> [!WARNING] Khi nào MỚI ĐƯỢC PHÉP Escalate lên Sponsor?
> Chỉ có **3 trường hợp hiếm hoi** PM được leo thang lên Sponsor: **(1)** Vấn đề vượt quá hạn mức ngân sách/thẩm quyền trong Project Charter (như xin dùng *Management Reserve* hoặc lệch hẳn *Business Case*), **(2)** Rủi ro cấp chiến lược được chọn chiến lược `Escalate`, hoặc **(3)** Dự án không còn giá trị kinh doanh và cần xem xét đóng sớm (chỉ Sponsor có quyền đóng/huỷ dự án).

## 2. Chẩn đoán các ca "Mắc bẫy Quen tay" phổ biến nhất

```visual
kind: troubleshoot
title: "Khám bệnh 4 Ca chọn nhầm kinh điển của Tech Lead / PM lâu năm"
subtitle: "Đối chiếu triệu chứng suy nghĩ ngoài đời với phác đồ chỉnh tư duy PMI"
items:
  - symptom: "Thành viên chủ chốt mắc lỗi làm trễ Sprint → Chọn 'Thay bằng Senior khác'"
    badge: "Bẫy #2"
    tone: "rose"
    cause: "Mang áp lực tiến độ ngắn hạn ngoài đời vào bài thi, quên mất chi phí chuyển giao và tinh thần Empowerment."
    fix: "Gặp riêng 1-1 tìm hiểu nguyên nhân gốc rễ, tổ chức đào tạo / Pair Programming / Mentoring và rà soát lại quy trình QA."
  - symptom: "Nhóm đang bị chặn bởi quyền truy cập DB → Chọn 'Đợi họp Sprint Retrospective cuối tuần'"
    badge: "Bẫy #7"
    tone: "amber"
    cause: "Nhầm lẫn giữa 'cải tiến quy trình dài hạn' (Retro) với 'gỡ rào cản tức thời' (Daily Impediment Removal)."
    fix: "Servant Leader phải hành động **ngay trong ngày** để làm việc với bên nắm quyền DB, mở đường cho nhóm chạy tiếp Sprint."
  - symptom: "Khách hàng gửi email phàn nàn gay gắt → Chọn 'Gửi lại bảng báo cáo chi tiết chứng minh nhóm làm đúng'"
    badge: "Bẫy #8"
    tone: "sky"
    cause: "Phản xạ phòng thủ bằng văn bản khiến khoảng cách gắn kết (Engagement Gap) càng nới rộng."
    fix: "Thiết lập cuộc gặp trực tiếp (Interactive Communication) để lắng nghe mối lo thực sự, rồi mới cùng rà soát Stakeholder/Comm Plan."
```

## 3. Nghệ thuật Phân thắng bại khi còn 2 Phương án Đều Đúng (50/50)

Thử thách lớn nhất của bài thi PMP nằm ở chỗ: sau khi gạch bỏ 2 câu bẫy, bạn còn lại **Đáp án B và Đáp án C đều đúng chuẩn PMI!** Lúc này, tuyệt đối không đoán mò — hãy đặt cả hai lên **Bàn cân 3 Tầng Phân Thắng Bại**:

```visual
kind: compare
title: "Bàn cân 3 Tầng Phân Thắng Bại cho cặp đáp án 50/50"
subtitle: "Nếu cả hai đều không vi phạm quy trình, phương án bên PHẢI luôn thắng phương án bên TRÁI!"
left:
  badge: "ĐÚNG MỘT NỬA · VỀ NHÌ"
  title: "Phương án Hẹp / Bị động / Chữa ngọn"
  tone: "amber"
  bullets:
    - "**Tầng 1 (Thái độ):** Chỉ ghi chép vào sổ (`Log/Document`) rồi ngồi theo dõi thụ động hoặc thông báo một chiều."
    - "**Tầng 2 (Chiều sâu):** Chỉ xử lý triệu chứng bề mặt của riêng một cá nhân / một lỗi đơn lẻ (ví dụ: sửa tay 1 bug)."
    - "**Tầng 3 (Trình tự):** Đưa ra quyết định/hành động đóng khung **trước khi** thu thập đủ dữ liệu hoặc chưa tham khảo ý kiến đội dự án."
right:
  badge: "ĐÁP ÁN CHIẾN THẮNG PMI"
  title: "Phương án Chủ động · Tận gốc · Đúng nhịp"
  tone: "emerald"
  bullets:
    - "**Tầng 1 (Chủ động > Bị động):** Vừa cập nhật hồ sơ vừa **chủ động triệu tập các bên liên quan cùng giải quyết** (*Collaborate*)."
    - "**Tầng 2 (Gốc rễ > Triệu chứng):** Giải quyết **Root Cause** và cập nhật chuẩn làm việc chung (`DoD`, `Team Charter`, `QA`) để lỗi không tái diễn."
    - "**Tầng 3 (Đánh giá trước > Hành động sau):** Nếu một câu là *Bước 1 (Phân tích cùng nhóm)* và câu kia là *Bước 2 (Trình duyệt giải pháp)* trong câu hỏi `FIRST`, **Bước 1 luôn thắng!**"
```

> [!REMEMBER] Mẹo kiểm tra "Ai bao hàm ai?"
> Khi phân vân giữa hai câu tốt, hãy tự hỏi: *"Hành động nào diễn ra TRƯỚC và mở đường cho hành động kia?"* hoặc *"Hành động nào trao quyền cho CẢ NHÓM cùng thảo luận thay vì một mình PM tự quyết?"* — bên trao quyền & đi đúng bước đầu tiên luôn là đáp án ăn điểm!
