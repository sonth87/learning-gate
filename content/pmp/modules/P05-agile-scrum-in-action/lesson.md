## 1. Khái niệm cốt lõi trong vận hành Scrum (`Product Backlog, Sprint, Cross-functional Team, Impediment`)

Trong thực tế ở nhiều doanh nghiệp, mô hình Scrum thường bị vận hành sai lệch: Tech Lead vừa đóng vai Scrum Master vừa giao việc theo KPI, hoặc các bên liên quan gửi yêu cầu chèn thẳng vào giữa Sprint. Nếu áp dụng các thói quen sai lệch này vào đề thi PMP, người học sẽ chọn sai đáp án.

Trước khi giải quyết các câu hỏi tình huống, cần nắm chính xác định nghĩa chuẩn của 4 khái niệm cốt lõi trong **Scrum**:

- **Product Backlog (*Danh sách hạng mục sản phẩm*):** Hàng đợi duy nhất chứa toàn bộ tính năng, cải tiến và sửa lỗi của sản phẩm, được sắp xếp theo thứ tự ưu tiên dựa trên **giá trị kinh doanh và mức độ rủi ro**.
- **Sprint (*Nhịp lặp cố định 1–4 tuần*):** Khoảng thời gian đóng khung (*Timebox*) cố định để đội phát triển chuyển hóa các hạng mục ưu tiên đầu bảng thành phần mềm hoạt động hoàn chỉnh (**Increment**).
- **Cross-functional & T-shaped Team (*Nhóm đa chức năng chữ T*):** Nhóm từ 3–9 thành viên có đủ năng lực (Backend, Frontend, QA, UX...) để hoàn thành tính năng đầu-cuối mà không phụ thuộc bên ngoài; mỗi người chuyên sâu 1 lĩnh vực (*nét dọc chữ T*) và sẵn sàng hỗ trợ kỹ năng lân cận (*nét ngang chữ T*) khi cần thiết.
- **Impediment (*Rào cản / Trở ngại*):** Bất kỳ vướng mắc nào vượt quá khả năng tự xử lý của nhóm đang làm gián đoạn công việc (ví dụ: chờ bộ phận An ninh mạng cấp quyền truy cập suốt nhiều ngày).

## 2. Phân định trách nhiệm giữa 3 vai trò trong Scrum (`Product Owner, Scrum Master, Developers`)

Phần lớn câu hỏi bẫy về Agile trong đề PMP xoay quanh việc một vai trò **làm thay hoặc can thiệp vào thẩm quyền của vai trò khác**. Nắm chắc phân định trách nhiệm dưới đây giúp loại bỏ ngay các phương án sai:

```visual
kind: groups
title: "Phân định Trách nhiệm 3 Vai trò trong Scrum"
subtitle: "Phương án để vai trò này can thiệp vào thẩm quyền cốt lõi của vai trò khác là phương án sai"
columns: 3
items:
  - icon: "target"
    title: "Product Owner (PO)"
    badge: "WHY & WHAT · Tối ưu Giá trị"
    tone: "emerald"
    desc: "Một người duy nhất chịu trách nhiệm tối đa hoá giá trị sản phẩm và quản lý Product Backlog."
    bullets:
      - "Xếp thứ tự ưu tiên trên Product Backlog dựa trên Giá trị kinh doanh & Rủi ro"
      - "Người DUY NHẤT có thẩm quyền huỷ Sprint khi mục tiêu Sprint không còn phù hợp"
      - "KHÔNG ĐƯỢC: Tự ước lượng điểm hộ nhóm hoặc chỉ định cụ thể dev nào làm task nào"
  - icon: "users"
    title: "Developers (Đội phát triển)"
    badge: "HOW & HOW MUCH · Thực thi"
    tone: "sky"
    desc: "Những người trực tiếp thiết kế, lập trình và kiểm thử để tạo ra Increment trong mỗi Sprint."
    bullets:
      - "Độc quyền ước lượng khối lượng công việc (Story Points) và quyết định số lượng việc kéo vào Sprint"
      - "Tự tổ chức giải pháp kỹ thuật, chia việc hàng ngày và sở hữu Sprint Backlog"
      - "KHÔNG ĐƯỢC: Tự ý nhận yêu cầu chèn ngang từ Stakeholder bên ngoài mà không qua PO"
  - icon: "shield"
    title: "Scrum Master / Agile PM"
    badge: "SERVANT LEADER · Huấn luyện"
    tone: "amber"
    desc: "Người bảo vệ quy trình Scrum, tháo gỡ rào cản và duy trì sự tập trung cho nhóm."
    bullets:
      - "Gỡ các Impediments vượt tầm nhóm và hướng dẫn các bên tôn trọng Timebox"
      - "Ngăn chặn yêu cầu chèn ngang giữa Sprint, hướng Stakeholder làm việc với PO"
      - "KHÔNG ĐƯỢC: Giao việc áp đặt như cấp trên hoặc tự ý sắp xếp lại Product Backlog"
```

> [!NOTE]
> **Vai trò của Agile Project Manager:** Khi đề bài sử dụng chức danh *Agile Project Manager*, người này cần thực hành phong cách **Servant Leader / Scrum Master**: ==huấn luyện đội tự tổ chức và tạo điều kiện phối hợp, tuyệt đối không phân công công việc vi mô==.

## 3. Phân biệt 3 tiêu chuẩn kiểm soát chất lượng: `DoR`, `Acceptance Criteria` và `DoD`

Trong quá trình phát triển sản phẩm, bất đồng về việc *"một đầu việc đã thực sự hoàn tất hay chưa"* thường xuất phát từ việc nhầm lẫn 3 khái niệm sau. Xét theo dòng đời của tính năng **Đăng nhập bằng OTP**:

- **Definition of Ready (`DoR` — Chuẩn sẵn sàng đầu vào Sprint):** Điều kiện kiểm tra xem một User Story trên Product Backlog đã đủ rõ nghiệp vụ, có thiết kế giao diện, rõ đặc tả kỹ thuật và đủ nhỏ (*chuẩn INVEST*) để nhóm đưa vào `Sprint Planning` hay chưa. *(Nhóm thường dành không quá ~10% thời gian Sprint cho **Backlog Refinement** để chuẩn bị DoR cho Sprint kế tiếp).*
- **Acceptance Criteria (`AC` — Tiêu chí nghiệm thu riêng của từng User Story):** Các điều kiện chức năng đúng/sai gắn riêng cho User Story đó (ví dụ: *"Mã OTP có hiệu lực đúng 60 giây; nhập sai 5 lần liên tiếp phải khóa tạm thời 15 phút"*).
- **Definition of Done (`DoD` — Tiêu chuẩn hoàn thành chung của sản phẩm):** Quy chuẩn chất lượng bắt buộc áp dụng cho **mọi Increment** trước khi bàn giao (đã qua Peer Code Review, Unit Test đạt ngưỡng quy định, quét bảo mật đạt chuẩn, triển khai ổn định trên Staging). ==Hạng mục đạt AC nhưng chưa đạt DoD thì không được tính điểm Velocity, không được trình diễn ở Sprint Review và phải chuyển về Product Backlog để PO sắp xếp lại.==

## 4. Nhận diện 4 sai lệch phổ biến trong Sự kiện Scrum và cách điều chỉnh chuẩn PMI

Mọi sự kiện trong Scrum đều có khung thời gian tối đa (*Timebox*) nhằm giữ nhịp kiểm tra và thích ứng hiệu quả. Bảng sau tổng hợp 4 sai lệch thường gặp trong đề thi [!badge:violet:ECO 07/2026] và cách xử lý chuẩn xác:

```visual
kind: troubleshoot
title: "4 Sai lệch Phổ biến trong Sự kiện Scrum & Cách Điều chỉnh Chuẩn PMI"
subtitle: "Nhận diện vấn đề vận hành để chọn hành động phù hợp của Servant Leader"
items:
  - symptom: "Họp Daily Scrum kéo dài 45 phút, biến thành buổi báo cáo sếp & tranh cãi bug kỹ thuật"
    badge: "15 phút · Dành cho Developers"
    tone: "rose"
    cause: "Biến buổi đồng bộ kế hoạch 24h của nhóm thành buổi kiểm điểm tiến độ hoặc mổ xẻ code chi tiết."
    fix: "Huấn luyện nhóm giữ nghiêm Timebox **15 phút** xoay quanh Sprint Goal; các thảo luận kỹ thuật sâu tách sang nhóm nhỏ họp riêng ngay sau đó (*Parking Lot*); lãnh đạo nếu dự chỉ quan sát, không chất vấn."
  - symptom: "Giám đốc Kinh doanh yêu cầu Developer lập trình gấp 1 tính năng ngay giữa Sprint đang chạy"
    badge: "Bảo vệ Sprint Goal"
    tone: "amber"
    cause: "Xâm phạm cam kết Sprint và bỏ qua đầu mối quản trị giá trị là Product Owner."
    fix: "==Bảo vệ đội phát triển khỏi sự gián đoạn!== Giải thích quy tắc vận hành và mời Giám đốc trao đổi với **Product Owner** để đánh giá giá trị, đưa vào Product Backlog cho Sprint tiếp theo."
  - symptom: "Buổi Sprint Review chỉ chiếu slide PowerPoint báo cáo phần trăm hoàn thành"
    badge: "Demo phần mềm chạy thật"
    tone: "sky"
    cause: "Mang tính năng dở dang chưa đạt DoD ra báo cáo một chiều, không thu được phản hồi thực tế."
    fix: "Chỉ trình diễn **Working Increment đã đạt 100% DoD**, mời Stakeholders dùng thử trực tiếp và thu thập phản hồi để cập nhật lại Product Backlog."
  - symptom: "Đợi hết dự án 6 tháng mới họp rút kinh nghiệm khiến xung đột và lỗi quy trình tích tụ"
    badge: "Sprint Retrospective"
    tone: "emerald"
    cause: "Thiếu vòng lặp cải tiến quy trình định kỳ trong không gian an toàn tâm lý."
    fix: "Tổ chức **Sprint Retrospective** đều đặn cuối MỖI Sprint để cả nhóm tự nhìn lại cách phối hợp và chọn ngay 1–2 cải tiến khả thi áp dụng vào Sprint kế tiếp."
```

> [!TIP]
> **Phân biệt nhanh Sprint Review và Sprint Retrospective:** ==Sprint Review tập trung vào SẢN PHẨM== (kiểm tra Increment cùng khách hàng/Stakeholders); còn ==Sprint Retrospective tập trung vào QUY TRÌNH & CON NGƯỜI== (buổi họp cải tiến nội bộ của riêng Scrum Team).
