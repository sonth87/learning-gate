## 1. Nguyên tắc #1 — Adopt a Holistic View (`PMBOK 8 §3.3`): Hiệu ứng cánh bướm của mọi thay đổi

[!badge:amber:PMBOK 8] hợp nhất *Systems Thinking* và *Navigate Complexity* cũ thành nguyên tắc số 1: **Tư duy Toàn diện / Hệ thống**. Một dự án không bao giờ đứng cô lập — nó là mạng lưới liên kết chặt chẽ giữa các biến số nội tại (`Scope · Schedule · Finance · Quality · Resources · Risk`) với chiến lược tổ chức và môi trường bên ngoài.

- [!] [!badge:rose:Bẫy đề thi] Khi đề bài mô tả: *"Rút ngắn lịch 2 tuần"*, *"Đổi một linh kiện nhỏ"* hay *"Chuyển 1 Senior sang dự án khác"*, đừng bao giờ chỉ sửa đúng một tài liệu đơn lẻ!
- [x] [!badge:emerald:Phản xạ vàng] Luôn thực hiện **Holistic Impact Assessment**: đánh giá hiệu ứng dây chuyền lên **toàn bộ các ràng buộc còn lại** và khả năng tương thích với vận hành thực tế trước khi chốt phương án.

## 2. Nguyên tắc #2 — Focus on Value (`PMBOK 8 §3.4`): Output ≠ Outcome ≠ Benefits

Hoàn thành đúng hạn và đúng ngân sách một phần mềm **không một ai thèm mở lên dùng** là thất bại hoàn toàn dưới góc nhìn PMI!

```visual
kind: flow
title: "Chuỗi Chuyển hoá Giá trị (Value Delivery Chain)"
subtitle: "PM không chỉ dừng ở bước bàn giao Deliverable mà phải hướng tới Outcome và Benefits"
footer: "Nếu thị trường thay đổi làm gãy mắt xích Outcome/Benefits, PM phải phân tích lại Business Case và báo cáo Sponsor xem xét điều chỉnh hoặc dừng dự án có kiểm soát!"
steps:
  - icon: "box"
    badge: "OUTPUT"
    title: "Deliverable (Đầu ra)"
    desc: "Ứng dụng di động đặt lịch khám bệnh vừa được code xong."
    tone: "slate"
    edge: "Người dùng đón nhận"
  - icon: "users"
    badge: "OUTCOME"
    title: "Kết quả sử dụng"
    desc: "70% bệnh nhân chuyển sang đặt lịch online, giảm cảnh xếp hàng chờ đợi."
    tone: "sky"
    edge: "Đo lường định kỳ"
  - icon: "award"
    badge: "BENEFITS"
    title: "Lợi ích chiến lược"
    desc: "Tăng 25% công suất phục vụ (NPV dương) & điểm hài lòng bệnh nhân tăng vọt."
    tone: "emerald"
```

Để hiện thực hoá giá trị sớm và giảm rủi ro lãng phí, đề thi thường xuyên đặt bẫy giữa hai khái niệm cốt lõi trong [!badge:sky:PMA Bridge]:

| Khái niệm | Mục tiêu cốt lõi | Ví dụ nhận diện trong đề PMP |
| :--- | :--- | :--- |
| **MVP** *(Minimum Viable Product)* | **Học hỏi & kiểm chứng giả thuyết** thị trường với nỗ lực nhỏ nhất để thu phản hồi thật. | Tung trang đích + luồng đặt hàng cơ bản trong 3 tuần để xem khách có thực sự muốn mua gói dịch vụ mới không. |
| **MMF** *(Minimum Marketable Feature)* | **Tạo giá trị sử dụng / thương mại thực tế** từ tập tính năng hoàn chỉnh nhỏ nhất có thể phát hành. | Phát hành trọn vẹn module "Thanh toán QR một chạm" để thu phí và phục vụ người dùng ngay lập tức. |

## 3. Nguyên tắc #5 (Mới) — Integrate Sustainability Within All Project Areas (`PMBOK 8 §3.7`)

Đây là nguyên tắc mới toanh của [!badge:amber:PMBOK 8] và khớp trực tiếp với miền **Business Environment 26%** của [!badge:violet:ECO 07/2026]. PM phải nhúng tư duy phát triển bền vững (*People · Planet · Prosperity / ESG*) ở **cả hai chiều không tách rời**:

```visual
kind: groups
title: "Hai Chiều Bền vững Bắt buộc trong PMBOK® 8 §3.7"
subtitle: "Không hy sinh môi trường, xã hội và chi phí vòng đời dài hạn để lấy thành tích ngắn hạn"
columns: 2
items:
  - icon: "wrench"
    title: "Sustainability OF the Project"
    badge: "Cách làm dự án"
    tone: "cyan"
    desc: "Tính bền vững ngay trong quá trình triển khai và mua sắm của dự án."
    bullets:
      - "Lựa chọn nhà thầu tuân thủ an toàn lao động, đạo đức chuỗi cung ứng và tiêu chuẩn khí thải"
      - "Tối ưu tiêu thụ năng lượng, giảm rác thải vật liệu và bảo vệ sức khoẻ làm việc bền vững của nhóm"
  - icon: "refresh"
    title: "Sustainability BY the Product"
    badge: "Vòng đời sản phẩm"
    tone: "emerald"
    desc: "Tác động dài hạn của sản phẩm sau khi dự án đã đóng và bàn giao sang vận hành."
    bullets:
      - "Thiết kế sản phẩm tiết kiệm điện năng/tài nguyên đám mây, dễ bảo trì và tái chế cuối vòng đời"
      - "Đưa rủi ro môi trường, xã hội và pháp lý ESG vào ngay Elicit Requirements & Risk Register"
```

> [!IMPORTANT] Dũng khí dừng dự án (Sunk Cost Fallacy)
> Chi phí đã tiêu là **chi phí chìm (Sunk Cost)** — không bao giờ dùng lý do *"đã lỡ làm được 80% rồi"* để xin chạy cố một dự án không còn mang lại giá trị hoặc vi phạm chuẩn mực bền vững/pháp lý. Phản xạ đúng: ==Đánh giá lại Business Case & Benefits Management Plan → Báo cáo minh bạch lên Sponsor để tái định hướng hoặc huỷ dự án chính thức==.
