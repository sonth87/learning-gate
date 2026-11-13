## 1. Quy trình 65 giây: Đọc ngược từ Câu chốt cuối cùng

Một câu hỏi PMP điển hình dài 4–6 dòng: 2 dòng đầu thường là **nhiễu bối cảnh** (*"Bạn đang quản lý dự án nâng cấp hệ thống ERP đa quốc gia trị giá 12 triệu USD tại 4 múi giờ..."*), dòng thứ 3–4 mới chứa **sự kiện nút thắt**, và dòng cuối cùng quyết định **loại đáp án cần chọn**. Nếu đọc xuôi từ đầu, não bạn sẽ tốn 30 giây tải thông tin rác rồi phải đọc lại lần hai!

```visual
kind: flow
title: "Phẫu thuật đề PMP trong 65 giây (4 Bước chuẩn phòng thi)"
subtitle: "Giữ nhịp trung bình 65–75 giây/câu để luôn dư 15 phút rà soát các câu gắn cờ (Flag) cuối mỗi chặng!"
steps:
  - icon: "target"
    badge: "0–8 GIÂY · BƯỚC 1"
    title: "Đọc câu chốt cuối cùng TRƯỚC"
    desc: "Khoá chặt từ khoá điều khiển: **FIRST / NEXT**, **BEST**, **SHOULD HAVE done**, hay **NOT / EXCEPT**."
    tone: "amber"
    edge: "Biết rõ đang tìm gì"
  - icon: "compass"
    badge: "8–20 GIÂY · BƯỚC 2"
    title: "Quét Ra-đa Vòng đời"
    desc: "Tìm tín hiệu **Agile** (`Sprint, PO, Backlog`), **Predictive** (`Baseline, WBS, CCB`) hay **Hybrid**."
    tone: "cyan"
    edge: "Khóa bộ luật chơi"
  - icon: "search"
    badge: "20–40 GIÂY · BƯỚC 3"
    title: "Tách Nhiễu khỏi Vấn đề gốc"
    desc: "Bỏ qua tính từ kịch tính; gạch chân **sự kiện vừa xảy ra ở câu áp chót** và bước PM **đã làm xong**."
    tone: "sky"
    edge: "Định vị mắt xích"
  - icon: "shield"
    badge: "40–65 GIÂY · BƯỚC 4"
    title: "Lọc qua Phễu 4 tầng PMI"
    desc: "Kiểm chứng đáp án theo thứ tự: **An toàn/Pháp lý → Minh bạch → Phân tích trước → Hợp tác cùng nhóm**."
    tone: "emerald"
```

## 2. Giải phẫu 4 Từ khoá Điều khiển làm xoay chuyển đáp án

Cùng một tình huống sự cố y hệt nhau, chỉ cần đề thi đổi **1 từ khoá in hoa** ở câu cuối là đáp án đúng sẽ dịch chuyển sang phương án hoàn toàn khác [!badge:rose:Bẫy đề thi]:

```visual
kind: anatomy
title: "Bốn từ khoá điều khiển trục thời gian trong câu hỏi PMP"
subtitle: "Sai lầm lớn nhất của PM giàu kinh nghiệm là chọn đáp án 'BEST' cho câu hỏi đang hỏi 'FIRST'!"
items:
  - keyword: "do FIRST / NEXT"
    role: "Bước kế tiếp ngay lập tức"
    tone: "amber"
    summary: "Tìm **hành động khởi đầu** ngay tại thời điểm đề bài dừng lại — hầu như luôn là **xác minh dữ liệu, gặp trực tiếp lắng nghe, hoặc đánh giá tác động**."
    bullets:
      - "Nếu đề bài CHƯA phân tích → chọn **Assess / Review / Meet to understand root cause**."
      - "Cẩn thận: Nếu đề bài ghi *'PM đã phân tích xong tác động cùng nhóm'*, thì `NEXT` mới bước sang nộp Change Request / thực thi!"
  - keyword: "do BEST"
    role: "Giải pháp căn cơ nhất"
    tone: "emerald"
    summary: "Trong nhiều phương án đều hợp lệ, chọn hành động **giải quyết tận gốc vấn đề (Root Cause)** và bảo vệ **Value** lâu dài nhất."
    bullets:
      - "Huấn luyện/đào tạo kỹ năng & cải tiến quy trình (QA/Retro) luôn thắng việc kiểm tra thủ công chắp vá."
      - "Hợp tác giải quyết vấn đề (*Collaborate / Problem Solve*) luôn thắng thoả hiệp nửa vời (*Compromise*)."
  - keyword: "SHOULD HAVE done"
    role: "Quay ngược về quá khứ"
    tone: "violet"
    summary: "Sự cố đã nổ ra rồi; đề hỏi lẽ ra trước đó PM làm gì ở khâu **Initiating / Planning** thì đã **ngăn chặn** được chuyện này."
    bullets:
      - "Stakeholder phàn nàn cuối dự án → lẽ ra phải **nhận diện sớm & gắn kết từ đầu**."
      - "Nhóm cãi nhau vì quy ước làm việc → lẽ ra phải **đồng kiến tạo Team Charter** từ khi thành lập nhóm."
  - keyword: "NOT / EXCEPT / LEAST"
    role: "Đảo ngược câu hỏi"
    tone: "rose"
    summary: "3 đáp án sẽ là chuẩn mực vàng của PMI, duy nhất **1 đáp án vi phạm quy trình hoặc tư duy** — bạn phải chọn chính phương án sai đó!"
    bullets:
      - "Khi thấy chữ `EXCEPT` hoặc `LEAST likely`, hãy tự nhẩm: *'Tìm phương án tệ nhất theo mắt PMI'* để không quen tay bấm vào câu hay nhất."
```

## 3. Ra-đa nhận diện Vòng đời & Phễu 4 tầng chốt đáp án

Đừng bao giờ mang công cụ của Waterfall áp vào câu Agile (hoặc ngược lại) nếu đề bài không nói là Hybrid! Hãy quét nhanh bảng tín hiệu sau:

| Tín hiệu xuất hiện trong thân đề | Chế độ tư duy phải bật ngay | Đáp án nhiễu cần gạch bỏ tức khắc |
| --- | --- | --- |
| `Sprint`, `Iteration`, `Product Backlog`, `Velocity`, `Daily Standup` | **Adaptive / Agile** — Trao quyền nhóm tự tổ chức, PO giữ ưu tiên Backlog, Servant Leader gỡ rào cản. | *"Trình Change Request lên CCB để đổi thứ tự User Story"* hoặc *"PM tự phân chia task cho từng Developer"*. |
| `Scope/Cost Baseline`, `WBS`, `Critical Path`, `Change Control Board` | **Predictive** — Tôn trọng Baseline đã khoá, đánh giá tác động tích hợp rồi mới qua PICC/CCB. | *"Nhờ Product Owner sắp lại Backlog cho Sprint tới"* hoặc *"Tự sửa thiết kế rồi cập nhật tài liệu sau"*. |
| *"Phần cứng cố định theo mốc hợp đồng, phần mềm giao diện chạy theo Sprint 2 tuần"* | **Hybrid** — Áp luật **Predictive** cho nhánh phần cứng/tích hợp cổng mốc, và luật **Agile** cho nội bộ nhánh phần mềm! | Áp cứng một quy trình duy nhất lên cả hai nhánh bất chấp đặc thù công việc. |

> [!IMPORTANT] Phễu kiểm chứng 4 tầng trước khi bấm Next
> 1. **An toàn tính mạng, Pháp luật & Đạo đức PMI:** Nếu có nguy cơ mất an toàn lao động hoặc vi phạm luật/bản quyền → dừng/báo cáo khắc phục ngay lập tức (ưu tiên tuyệt đối số 1).
> 2. **Tính minh bạch & Trung thực dữ liệu (`WPD → WPI → WPR`):** Không bao giờ che giấu tin xấu hoặc làm đẹp báo cáo theo áp lực của bất kỳ ai.
> 3. **Phân tích trước — Hành động sau:** Hiểu gốc rễ & tác động chéo trước khi đề xuất giải pháp.
> 4. **Trao quyền & Trực tiếp:** Đối thoại trực tiếp (Face-to-face / Video call) và cùng nhóm đồng giải quyết thay vì gửi email đổ lỗi hay đẩy lên Sponsor.
