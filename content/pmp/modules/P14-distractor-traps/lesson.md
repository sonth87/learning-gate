## 1. Nhận diện 12 dạng đáp án nhiễu (`Distractors`) phổ biến trong đề thi PMP

Nhiều PM có kinh nghiệm thực tế lâu năm vẫn thường chọn sai ở đề thi PMP vì ban ra đề thường sử dụng **chính những thói quen xử lý nhanh nhưng thiếu bài bản ngoài thực tế** để thiết kế thành các phương án nhiễu.

Nhận diện được **12 dạng phương án nhiễu** chia thành 4 nhóm dưới đây sẽ giúp bạn loại nhanh 2 đáp án sai ngay từ vòng đọc đầu tiên:

```visual
kind: groups
title: "Phân loại 12 Dạng Đáp án Nhiễu Phổ biến trong Đề thi PMP"
subtitle: "Tổng hợp 12 mẫu phương án sai thường gặp nhất thành 4 nhóm nhận diện"
columns: 2
items:
  - num: 1
    title: "Nhóm 1: Cực đoan & Trừng phạt (Bẫy #1 – #3)"
    badge: "LOẠI BỎ 99%"
    tone: "rose"
    bullets:
      - "**#1 Từ ngữ tuyệt đối hoá:** *Always, never, completely ignore, reject all changes, immediately halt the project* (chỉ hợp lệ khi đe dọa an toàn/pháp luật)."
      - "**#2 Đuổi người / Đổi nhân sự:** Sa thải kỹ sư mắc lỗi, trả người về phòng ban hoặc chấm dứt hợp đồng Vendor ngay khi mới phát sinh vướng mắc."
      - "**#3 Áp đặt mệnh lệnh:** Bắt cả đội làm thêm giờ không lương liên tục, kỷ luật cảnh cáo hoặc tự quyết thay chuyên môn của nhóm."
  - num: 2
    title: "Nhóm 2: Đẩy trách nhiệm (Bẫy #4 – #6)"
    badge: "THÓI QUEN ĐẨY VIỆC"
    tone: "amber"
    bullets:
      - "**#4 Cầu cứu Sponsor quá sớm:** Đẩy mâu thuẫn nội bộ hoặc xin thêm tiền/thời gian lên Sponsor khi PM chưa tự phân tích các phương án xử lý."
      - "**#5 Đùn sang HR / PMO / Phòng ban khác:** Nhờ HR giải quyết tranh cãi kỹ thuật hoặc nhờ PMO đi thuyết phục Stakeholder thay mình."
      - "**#6 Đẩy trách nhiệm sang Khách hàng:** Giao sản phẩm chưa kiểm thử kỹ để khách hàng tự phát hiện lỗi."
  - num: 3
    title: "Nhóm 3: Thụ động & Đường tắt (Bẫy #7 – #9)"
    badge: "TRÁI NGUYÊN TẮC PMI"
    tone: "cyan"
    bullets:
      - "**#7 Chờ đợi bị động:** *'Wait and see next week'*, hoặc đợi đến cuối Sprint mới gỡ rào cản đang làm tắc công việc hôm nay."
      - "**#8 Giao tiếp văn bản gián tiếp:** Gửi email tập thể nhắc nhở chung chung thay vì gặp riêng 1-1 trao đổi trực tiếp."
      - "**#9 Cắt giảm chất lượng / Che giấu:** Bỏ qua bước kiểm thử tích hợp cho kịp lịch, làm thêm tính năng ngoài phạm vi (Gold Plating), báo cáo sai sự thật."
  - num: 4
    title: "Nhóm 4: Bỏ qua quy trình & Sai vai trò (Bẫy #10 – #12)"
    badge: "LỖI QUY TRÌNH"
    tone: "sky"
    bullets:
      - "**#10 Bỏ qua quy trình thay đổi:** Tự sửa Baseline hoặc cho đội dev lập trình yêu cầu mới trước khi đánh giá tác động và trình CCB."
      - "**#11 Ghi nhầm sổ Risk ↔ Issue:** Đem sự cố đã xảy ra ghi vào Risk Register, hoặc đem nguy cơ tương lai ghi vào Issue Log."
      - "**#12 Xâm phạm vai trò Scrum:** Scrum Master/PM tự sắp xếp Product Backlog, tự ước lượng Story Points, hoặc PO đứng chia task cho từng dev."
```

## 2. Ba ranh giới thẩm quyền dễ nhầm lẫn từ thói quen công việc thực tế

Trong môi trường doanh nghiệp, người làm kỹ thuật hoặc quản lý thường quen tự xử lý nhanh hoặc chuyển các vấn đề nhân sự sang bộ phận HR và cấp trên. Trong đề thi PMP, cần đặc biệt lưu ý **3 ranh giới thẩm quyền** sau:

- **Khi nào mới chuyển sang Phòng Nhân sự (`HR`)?** Không nhờ HR giải quyết tranh cãi kỹ thuật hay thái độ làm việc thiếu tập trung. PM chỉ chuyển hồ sơ sang HR khi có **vi phạm pháp luật lao động, quấy rối, phân biệt đối xử hoặc vi phạm đạo đức nghề nghiệp nghiêm trọng**.
- **Khi nào mới báo lên `Project Sponsor`?** Chỉ khi vấn đề vượt quá phạm vi thẩm quyền trong `Project Charter` (ví dụ xin giải ngân *Management Reserve*, dự án mất tính khả thi kinh doanh cần xem xét dừng sớm, hoặc rủi ro cấp chiến lược cần *Escalate*).
- **Khi nào xử lý ngay trong ngày vs đợi đến `Sprint Retrospective`?** Rào cản đang chặn đứng công việc hiện tại (*Impediment / Blocker*) thì Servant Leader phải ==hành động tháo gỡ ngay==; còn nguyên nhân gốc rễ về quy trình làm việc sẽ đưa vào buổi `Retrospective` cuối Sprint để cải tiến hệ thống.

```visual
kind: troubleshoot
title: "Phân tích 3 Tình huống Chọn Sai Do Quán Tính Công việc Thực tế"
subtitle: "Nhận diện thói quen nghề nghiệp để tránh chọn nhầm phương án quen tay"
items:
  - symptom: "Kỹ sư mới vào làm chậm khiến Sprint có nguy cơ hụt mục tiêu → Chọn nhầm 'Xin đổi sang Senior khác'"
    badge: "BẪY #2"
    tone: "rose"
    cause: "Áp lực tiến độ ngoài đời khiến ta quên rằng thay người mới còn tốn thời gian bàn giao và kéo nhóm quay lại giai đoạn Forming."
    fix: "Trò chuyện riêng 1-1 tìm nguyên nhân gốc, ghép cặp **Pair Programming / Mentoring** với thành viên giàu kinh nghiệm để nâng năng lực bền vững."
  - symptom: "Môi trường Test bị hỏng làm đội ngừng việc từ sáng thứ Ba → Chọn nhầm 'Đưa vào họp Sprint Retrospective cuối tuần'"
    badge: "BẪY #7"
    tone: "amber"
    cause: "Nhầm giữa buổi họp cải tiến quy trình cuối kỳ với nhiệm vụ gỡ vật cản tức thời của Servant Leader."
    fix: "Chủ động làm việc **ngay trong ngày** với đội Hạ tầng/DevOps để khôi phục môi trường, còn ở buổi Retro cuối tuần mới bàn cách phòng ngừa lâu dài."
  - symptom: "Trưởng phòng nghiệp vụ gửi mail chỉ trích dự án gay gắt → Chọn nhầm 'Phản hồi email kèm số liệu chứng minh họ hiểu sai'"
    badge: "BẪY #8"
    tone: "sky"
    cause: "Tranh luận qua email khi đối phương đang bức xúc chỉ làm tăng căng thẳng."
    fix: "Chủ động hẹn **gặp trực tiếp mặt đối mặt (Interactive Communication)** lắng nghe nỗi lo thực sự và cùng rà soát lại kỳ vọng."
```

## 3. Quy tắc 3 tầng lựa chọn khi còn 2 phương án đều có vẻ hợp lý (`50/50`)

Tình huống khó nhất trong bài thi PMP là sau khi loại 2 phương án sai, trên màn hình vẫn còn **2 phương án đều đúng ngữ pháp, tích cực và dùng đúng thuật ngữ**. Khi đó, hãy đối chiếu cả hai qua **Quy tắc 3 tầng lựa chọn**:

```visual
kind: compare
title: "Quy tắc 3 Tầng Lựa chọn Khi Còn 2 Phương án Đều Hợp lý (50/50)"
subtitle: "So sánh hai phương án còn lại — phương án bên PHẢI luôn ưu tiên hơn bên TRÁI"
left:
  badge: "PHƯƠNG ÁN KÉM ƯU TIÊN HƠN"
  title: "Thụ động · Xử lý ngọn · Đi trước bước phân tích"
  tone: "amber"
  bullets:
    - "**Tầng 1 (Trình tự thời gian):** Nhảy sang bước đề xuất giải pháp hoặc trình duyệt khi chưa thu thập dữ liệu gốc."
    - "**Tầng 2 (Cách thức giao tiếp):** Chỉ ghi chép vào sổ theo dõi hoặc gửi thông báo văn bản một chiều (Push)."
    - "**Tầng 3 (Độ sâu giải pháp):** Chỉ xử lý tạm 1 lỗi đơn lẻ trước mắt mà không sửa lỗ hổng quy trình sinh ra lỗi đó."
right:
  badge: "ĐÁP ÁN ĐƯỢC ƯU TIÊN (CHỌN)"
  title: "Đúng nhịp đầu · Hợp tác trực tiếp · Trị tận gốc"
  tone: "emerald"
  bullets:
    - "**Tầng 1 (Đúng trình tự):** Trong câu hỏi `FIRST`, ==bước diễn ra TRƯỚC về mặt logic luôn thắng== (Đánh giá tác động luôn đứng trước Gửi Change Request)."
    - "**Tầng 2 (Trực tiếp & Trao quyền):** ==Đối thoại trực tiếp (Interactive) và cùng cả nhóm đồng giải quyết== luôn thắng PM tự quyết một mình."
    - "**Tầng 3 (Hệ thống & Lâu dài):** Trong câu hỏi `BEST`, ==giải pháp ngăn lỗi tái diễn (cập nhật QA / DoD / Team Charter)== luôn thắng giải pháp khắc phục tạm thời."
```

## 4. Thực hành phân tích hai ví dụ lựa chọn giữa các phương án gần đúng

**Ví dụ 1 (Câu hỏi `BEST`):** *Cuối Sprint, đội Agile nhận ra 2 User Story bị trả về vì lập trình viên và Tester hiểu khác nhau về yêu cầu bảo mật mật khẩu. Hành động nào giúp ngăn chặn tình trạng này tốt nhất (`BEST`) ở các Sprint tiếp theo?*

Sau khi loại 2 câu nhiễu, bạn còn lại:
- **Phương án B:** *Yêu cầu Tester kiểm tra kỹ mật khẩu sớm hơn vào giữa Sprint tới.* (Hợp lý, nhưng chỉ khắc phục cho riêng tính năng mật khẩu).
- **Phương án C:** *Đưa vấn đề vào buổi Sprint Retrospective để cả nhóm cùng thống nhất bổ sung tiêu chí rõ ràng vào `Definition of Ready (DoR)` và `Definition of Done (DoD)`.*

> [!TIP]
> **Phân tích lựa chọn:** Phương án C vừa **trao quyền cho cả đội tự thảo luận**, vừa **cải tiến quy trình hệ thống (`DoR / DoD`)** giúp ngăn chặn các sai lệch tương tự về sau → ==Phương án C là đáp án đúng==.

**Ví dụ 2 (Câu hỏi `FIRST`):** *Một khách hàng lâu năm gọi điện đề nghị bổ sung tính năng xuất hoá đơn điện tử vào dự án Predictive đã chốt Baseline. PM làm gì `FIRST`?*
- **Đáp án A:** *Đệ trình ngay phiếu Change Request lên Hội đồng CCB xin phê duyệt.*
- **Đáp án B:** *Họp với đội kỹ thuật để đánh giá tác động của yêu cầu mới lên phạm vi, lịch trình, chi phí và rủi ro.*
Dù cả A và B đều nằm trong quy trình quản lý thay đổi chuẩn, nhưng xét theo trình tự logic, ==không thể trình CCB khi chưa đánh giá tác động về chi phí, tiến độ và rủi ro== → **Đáp án B là đáp án đúng**.

> [!NOTE]
> **Kiểm tra quan hệ bao hàm:** Khi hai phương án đều hợp lý, hãy tự hỏi: *"Nếu thực hiện phương án X trước, phương án Y có diễn ra một cách tự nhiên ngay sau đó không?"* Phương án đóng vai trò bước tiền đề bao quát hơn thường là đáp án đúng.
