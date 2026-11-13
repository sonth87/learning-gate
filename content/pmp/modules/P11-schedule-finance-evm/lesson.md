## 1. Đường găng (Critical Path), Nén tiến độ & Điều phối nguồn lực

Trong [!badge:amber:PMBOK 8] **Miền #3 Schedule** (`Guide §2.3`), câu hỏi PMP hiếm khi bắt bạn cộng trừ sơ đồ mạng phức tạp bằng tay, mà xoáy thẳng vào **ý nghĩa ra quyết định** của ==Critical Path== (chuỗi công việc dài nhất quyết định tổng thời gian ngắn nhất của dự án, nơi `Total Float = 0`). Mọi nỗ lực rút ngắn tiến độ trên nhánh có Float dương đều vô nghĩa nếu Đường găng vẫn đứng yên!

- [x] **Total Float vs Free Float:** `Total Float` là độ trễ tối đa không làm trễ **ngày kết thúc dự án**; `Free Float` là độ trễ tối đa không làm trễ **ngày bắt đầu sớm của việc kế tiếp ngay sau nó**.
- [>] **Resource Leveling vs Resource Smoothing:** Khi một chuyên gia bị phân bổ quá tải (Over-allocated), **Leveling** giải quyết triệt để quá tải nhưng ==thường làm kéo dài Đường găng==. Ngược lại, **Smoothing** chỉ san phẳng nguồn lực trong phạm vi Float sẵn có nên ==không làm thay đổi Đường găng== (nhưng đôi khi không xử lý hết quá tải).

```visual
kind: compare
title: "Hai kỹ thuật Nén tiến độ (Schedule Compression) trên Đường găng"
subtitle: "Chỉ áp dụng cho các tác vụ trên Critical Path — tuyệt đối không cắt giảm Scope hay hạ chuẩn Quality!"
left:
  badge: "TĂNG CHI PHÍ · ÍT RỦI RO HƠN"
  title: "Crashing (Nén bằng nguồn lực)"
  tone: "amber"
  bullets:
    - "Bổ sung thêm người, thiết bị, trả phí làm thêm giờ hoặc thuê chuyên gia đẩy nhanh việc trên Đường găng."
    - "Đánh đổi trực tiếp: **Tăng chi phí (Cost)**; chỉ chọn khi dự án còn dư địa ngân sách."
    - "Mẹo phòng thi: Chọn tác vụ trên Đường găng có **chi phí nén trên mỗi ngày thấp nhất**."
right:
  badge: "TĂNG RỦI RO LÀM LẠI · KHÔNG TỐN TIỀN NGAY"
  title: "Fast-Tracking (Làm gối đầu song song)"
  tone: "emerald"
  bullets:
    - "Chuyển các việc vốn làm tuần tự sang chạy **song song một phần** (ví dụ: viết code khi thiết kế mới xong 70%)."
    - "Chỉ áp dụng được cho **Discretionary Dependencies** (phụ thuộc tuỳ ý/best practice), KHÔNG phá được phụ thuộc vật lý bắt buộc."
    - "Đánh đổi trực tiếp: **Tăng rủi ro phải làm lại (Rework)** và đứt gãy giao tiếp."
```

> [!WARNING] Bẫy đề thi kinh điển về Nén lịch
> Đề bài nêu: *"Khách hàng yêu cầu giao sớm 2 tuần nhưng Sponsor tuyên bố không cấp thêm bất kỳ đồng ngân sách nào"*. [!badge:rose:Bẫy đề thi] Chọn thuê thêm lập trình viên hoặc OT có lương (`Crashing`). [!badge:emerald:Phản xạ vàng] Loại ngay Crashing, rà soát Đường găng để tìm các phụ thuộc tuỳ ý có thể **Fast-Tracking** kèm theo dõi sát rủi ro!

## 2. Ranh giới Túi tiền: Contingency Reserve vs Management Reserve

Sang **Miền #4 Finance** (`Guide §2.4` — đổi tên từ *Cost* cũ để bao quát cả dòng tiền và lợi ích tài chính), điểm chết người nhất là thẩm quyền giải ngân hai quỹ dự phòng. Hãy khắc sâu kiến trúc xếp lớp của ngân sách dự án:

```visual
kind: layers
title: "Cấu trúc Cộng dồn Ngân sách & Ranh giới Thẩm quyền Giải ngân"
subtitle: "Cost Baseline bao gồm Contingency Reserve nhưng KHÔNG bao gồm Management Reserve"
columns:
  - title: "Cost Baseline (Đường cơ sở chi phí)"
    badge: "THẨM QUYỀN CỦA PM"
    tone: "emerald"
    footer: "Dùng để đo lường hiệu suất EVM (BAC = tổng Cost Baseline)."
    layers:
      - label: "1. Activity Cost Estimates → Work Package Estimates"
        sub: "Ước lượng chi phí trực tiếp thực hiện công việc (nhân công, vật tư, công cụ)."
        note: "Nền tảng"
        tone: "sky"
      - label: "2. Contingency Reserve (Quỹ dự phòng rủi ro đã biết)"
        sub: "Dành cho **Known-Unknowns** (rủi ro đã có trong Risk Register, tính qua EMV/Monte Carlo)."
        note: "PM tự quyết"
        tone: "emerald"
  - title: "Project Budget (Tổng Ngân sách Dự án)"
    badge: "CẦN CCB / SPONSOR DUYỆT"
    tone: "amber"
    footer: "Khi duyệt rút Management Reserve, số tiền đó được chuyển vào Cost Baseline."
    layers:
      - label: "Cost Baseline (Toàn bộ phần bên trái)"
        sub: "Ngân sách cam kết theo từng giai đoạn (Time-phased budget / S-Curve)."
        note: "BAC"
        tone: "emerald"
      - label: "3. Management Reserve (Quỹ dự phòng quản lý)"
        sub: "Dành cho **Unknown-Unknowns** (biến cố bất ngờ chưa từng nhận diện trước đó)."
        note: "Change Request!"
        tone: "rose"
```

## 3. Đọc nhanh Bảng mạch EVM (Earned Value Management)

Thay vì hoảng loạn trước một rừng chữ viết tắt, bạn chỉ cần nắm **3 cặp tín hiệu sống còn** dựa trên 3 thông số gốc: `PV` (giá trị kế hoạch), `EV` (giá trị thực tế đã làm ra), và `AC` (tiền thực tế đã chi):

```visual
kind: groups
title: "Bảng giải mã tín hiệu EVM trong 15 giây"
subtitle: "Luôn đặt EV đứng đầu mọi công thức chênh lệch và tỷ số!"
columns: 3
items:
  - num: 1
    title: "Chẩn đoán Hiện tại (CPI & SPI)"
    badge: "EV ĐỨNG TRƯỚC"
    tone: "sky"
    bullets:
      - "`CPI = EV / AC`: **< 1.0** là đang **vượt ngân sách** (Over budget); **> 1.0** là tiết kiệm chi phí."
      - "`SPI = EV / PV`: **< 1.0** là đang **chậm tiến độ** (Behind schedule); **> 1.0** là vượt tiến độ."
      - "Ví dụ: `CPI = 0.82, SPI = 1.08` → Vượt tiến độ nhưng đang đốt tiền quá tay (khả năng cao do lạm dụng Crashing!)."
  - num: 2
    title: "Dự báo Đích đến (EAC)"
    badge: "3 KỊCH BẢN ĐỀ THI"
    tone: "amber"
    bullets:
      - "Sai lệch hiện tại là **điển hình kéo dài** tới cuối: `EAC = BAC / CPI`."
      - "Sai lệch vừa qua chỉ là **sự cố cá biệt một lần**, phần còn lại về đúng kế hoạch: `EAC = AC + (BAC - EV)`."
      - "Cả chi phí lẫn tiến độ đều ép chặt phần việc còn lại: `EAC = AC + [(BAC - EV) / (CPI × SPI)]`."
  - num: 3
    title: "Áp lực Phần còn lại (TCPI)"
    badge: "ĐỘ KHẢ THI"
    tone: "rose"
    bullets:
      - "`TCPI = (BAC - EV) / (BAC - AC)` đo hiệu suất chi phí **cần đạt** cho phần việc còn lại để không lố BAC."
      - "`TCPI > 1.0`: Khó thở — phải chi tiêu tiết kiệm/hiệu quả hơn chuẩn ban đầu."
      - "Nếu `TCPI` vọt lên quá cao (ví dụ `1.35`) nghĩa là `BAC` cũ đã bất khả thi → cần trình dự báo `EAC` mới để xin duyệt lại."
```

> [!REMEMBER] Phản xạ vàng khi thấy CPI < 1 hoặc SPI < 1
> Khi báo cáo WPR cho thấy `CPI = 0.85` hoặc `SPI = 0.88`, hành động **FIRST** của PM không bao giờ là xin thêm tiền hay ép OT ngay, mà là ==phân tích nguyên nhân gốc rễ của sai lệch (Variance / Root Cause Analysis)== cùng đội dự án rồi mới chọn phương án khắc phục!
