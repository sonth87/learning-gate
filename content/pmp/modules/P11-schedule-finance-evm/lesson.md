## 1. Hiểu trọn bộ `EVM` trong 60 giây không cần học vẹt qua câu chuyện 4 Module Phần mềm

Nhắc đến **EVM (*Earned Value Management* — Quản trị giá trị thu được)** trong miền **Finance** (`PMBOK 8 §2.4`), nhiều kỹ sư choáng váng vì hàng chục chữ viết tắt `BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, TCPI`. Thực ra bạn chỉ cần đọc câu chuyện thực tế 60 giây dưới đây là **tự suy ra mọi công thức suốt đời không quên**:

Giả sử bạn nhận làm **4 module phần mềm y hệt nhau trong 4 tháng** (mỗi tháng xong 1 module). Định mức ngân sách mỗi module là **100 triệu VNĐ** (`$4,000`), vậy Tổng ngân sách chuẩn ban đầu **`BAC` (*Budget at Completion*) = 400 triệu VNĐ** (`$16,000`).

Kết thúc **Tháng thứ 2**, bạn mở sổ kiểm tra sức khoẻ dự án thấy 3 con số gốc:

1. **`PV` (*Planned Value* — Giá trị kế hoạch đáng lẽ phải đạt):** Hết tháng 2 theo lịch phải làm xong 2 module → `PV = 200 triệu VNĐ` (`$8,000`).
2. **`EV` (*Earned Value* — Giá trị công việc THỰC SỰ đã hoàn thành):** Đội kỹ thuật mới code và test xong trọn vẹn **1,5 module** → giá trị thực thu về là `EV = 1,5 × 100 = 150 triệu VNĐ` (`$6,000`).
3. **`AC` (*Actual Cost* — Số tiền thực tế ĐÃ CHI ra khỏi két):** Kế toán báo đã chi lương và thuê máy chủ hết **`AC = 200 triệu VNĐ`** (`$8,000`).

Từ 3 con số `PV = 200tr`, `EV = 150tr`, `AC = 200tr`, quy tắc vàng là ==luôn đặt EV đứng đầu mọi phép trừ và phép chia==:

- **Đo Chi phí (`EV` so với tiền thực tiêu `AC`):** Chênh lệch chi phí `CV = EV - AC = 150 - 200 = -50tr` (âm = lố tiền!). Tỷ số hiệu quả chi phí ==CPI = EV / AC = 150 / 200 = 0.75== → mỗi 1 đồng bỏ ra chỉ thu về được `0.75` đồng sản phẩm (**`< 1.0` là đang vượt ngân sách!**).
- **Đo Tiến độ (`EV` so với kế hoạch `PV`):** Chênh lệch tiến độ `SV = EV - PV = 150 - 200 = -50tr` (âm = chậm lịch!). Tỷ số hiệu quả tiến độ ==SPI = EV / PV = 150 / 200 = 0.75== → tốc độ làm việc mới đạt 75% kế hoạch (**`< 1.0` là đang trễ tiến độ!**).
- **Dự báo tổng tiền lúc về đích (`EAC` — *Estimate at Completion*):** Nếu đội cứ tiếp tục giữ phong độ tiêu tiền `CPI = 0.75` này tới cuối dự án, tổng chi phí thực tế lúc xong cả 4 module sẽ vọt lên **`EAC = BAC / CPI = 400 / 0.75 ≈ 533 triệu VNĐ`** (đội vốn thêm 133 triệu!). Còn nếu sự cố vừa qua chỉ là **tai nạn cá biệt 1 lần** và chặng sau quay về đúng định mức gốc thì `EAC = AC + (BAC - EV) = 200 + (400 - 150) = 450 triệu VNĐ`.
- **Đo độ căng thẳng chặng còn lại (`TCPI` — *To-Complete Performance Index*):** Việc còn lại là `BAC - EV = 250tr`, trong khi tiền còn lại trong két chỉ còn `BAC - AC = 200tr` → **`TCPI = 250 / 200 = 1.25`**. Nghĩa là muốn không lố mốc 400tr ban đầu, từ giờ mỗi 1 đồng chi ra đội phải vắt sức làm được `1.25` đồng giá trị (`TCPI > 1.0` là rất chật vật!).

## 2. Đường găng (`Critical Path`) & Hai đòn bẩy Nén tiến độ

Trong **Miền #3 Schedule** (`PMBOK 8 §2.3`), **Đường găng (*Critical Path*)** là chuỗi các công việc phụ thuộc dài nhất quyết định ngày kết thúc sớm nhất của toàn dự án — nơi mọi đầu việc trên đó đều có độ trễ cho phép **`Total Float = 0`**. Trễ 1 ngày trên Đường găng là ngày Go-Live của cả dự án lùi đúng 1 ngày!

Khi cân đối nhân sự bị quá tải (*Over-allocated*), nhớ phân biệt: **Resource Leveling** san tải triệt để nhưng ==thường làm kéo dài Đường găng==; còn **Resource Smoothing** chỉ xê dịch việc trong phạm vi Float dư sẵn có nên **không làm đổi Đường găng**. Khi bắt buộc phải rút ngắn lịch trình trên Đường găng mà không được cắt giảm phạm vi, PM cân nhắc 2 kỹ thuật:

```visual
kind: compare
title: "Hai Kỹ thuật Nén Tiến độ trên Đường găng: Crashing vs Fast-Tracking"
subtitle: "Chỉ tác động vào các công việc nằm trên Critical Path — tuyệt đối không cắt ẩu kiểm thử!"
left:
  badge: "ĐỔ THÊM TIỀN · ÍT RỦI RO LÀM LẠI"
  title: "Crashing (Nén bằng nguồn lực)"
  tone: "amber"
  bullets:
    - "Bơm thêm lập trình viên, mua công cụ tự động hoặc trả lương làm thêm giờ cho việc trên Đường găng."
    - "Cái giá phải trả: **Tăng chi phí trực tiếp (Cost)** — chỉ chọn khi dự án còn ngân sách (CPI tốt)."
    - "Nguyên tắc tối ưu: Ưu tiên nén tác vụ trên Đường găng có chi phí tăng thêm trên mỗi ngày thấp nhất."
right:
  badge: "CHẠY GỐI ĐẦU · TĂNG RỦI RO REWORK"
  title: "Fast-Tracking (Làm song song một phần)"
  tone: "emerald"
  bullets:
    - "Cho các việc vốn xếp nối đuôi nhau chuyển sang làm gối đầu song song (ví dụ: vừa chốt xong khung API đã code luôn giao diện trước khi tài liệu khoá 100%)."
    - "Chỉ làm được với **Phụ thuộc tuỳ ý (Discretionary)**, không áp dụng được cho phụ thuộc vật lý cứng."
    - "Cái giá phải trả: **Tăng vọt rủi ro hiểu lệch phải đập đi làm lại (Rework)**."
```

> [!WARNING]
> **Bẫy câu hỏi không cấp thêm tiền:** Nếu đề bài nêu *"Khách hàng ép rút ngắn lịch 3 tuần nhưng Sponsor khẳng định không cấp thêm đồng ngân sách nào"*, hãy gạch bỏ ngay mọi đáp án thuê thêm người hay trả phí OT (`Crashing`) — phương án duy nhất hợp lệ là ==rà soát Đường găng để Fast-Tracking kèm quản trị sát rủi ro làm lại==!

## 3. Hai túi tiền dự phòng sinh tử: `Contingency Reserve` vs `Management Reserve`

Đề thi PMP đặc biệt ưa thích kiểm tra xem bạn có nắm rõ **túi tiền nào PM được tự mở khoá, túi tiền nào phải xin phép cấp trên** hay không:

```visual
kind: layers
title: "Kiến trúc Ngân sách Dự án & Ranh giới Thẩm quyền Giải ngân"
subtitle: "Cost Baseline chứa Contingency Reserve nhưng KHÔNG chứa Management Reserve!"
columns:
  - title: "Cost Baseline (Đường cơ sở chi phí = BAC)"
    badge: "THẨM QUYỀN CỦA PM"
    tone: "emerald"
    layers:
      - label: "1. Chi phí trực tiếp của các Gói công việc (Work Packages)"
        detail: "Tiền lương kỹ sư, bản quyền phần mềm, hạ tầng máy chủ ước tính cho công việc."
        tone: "sky"
      - label: "2. Contingency Reserve (Quỹ dự phòng rủi ro ĐÃ BIẾT)"
        detail: "Dành cho Known-Unknowns đã liệt kê trong Risk Register — PM TỰ QUYẾT chi dùng khi rủi ro nổ ra!"
        tone: "emerald"
  - title: "Project Budget (Tổng Ngân sách Dự án)"
    badge: "PHẢI XIN SPONSOR / CCB"
    tone: "amber"
    layers:
      - label: "Toàn bộ Cost Baseline (Phần bên trái)"
        detail: "Đường cong chữ S (S-Curve) dùng làm chuẩn đối chiếu tính toán EVM."
        tone: "emerald"
      - label: "3. Management Reserve (Quỹ dự phòng quản lý CHƯA LƯỜNG TRƯỚC)"
        detail: "Dành cho Unknown-Unknowns (biến cố bất ngờ chưa từng có trong sổ rủi ro) — BẮT BUỘC nộp Change Request xin CCB/Sponsor!"
        tone: "rose"
```

## 4. Tình huống thực chiến & Phản xạ vàng đọc bảng đồng hồ EVM

```visual
kind: groups
title: "Tóm tắt Tín hiệu Chẩn đoán Nhanh EVM trong Phòng thi"
subtitle: "Nhìn dấu âm/dương và mốc 1.0 để đọc bệnh dự án trong 5 giây"
columns: 3
items:
  - num: 1
    title: "CPI = EV / AC"
    badge: "SỨC KHOẺ TIỀN BẠC"
    tone: "sky"
    desc: "Đo hiệu quả sử dụng từng đồng ngân sách đã bỏ ra."
    bullets:
      - "`CPI < 1.0` (hay `CV < 0`): Đang vượt ngân sách (Over budget)."
      - "`CPI > 1.0` (hay `CV > 0`): Đang tiết kiệm ngân sách (Under budget)."
  - num: 2
    title: "SPI = EV / PV"
    badge: "SỨC KHOẺ TIẾN ĐỘ"
    tone: "emerald"
    desc: "Đo tốc độ hoàn thành khối lượng so với lịch trình."
    bullets:
      - "`SPI < 1.0` (hay `SV < 0`): Đang trễ tiến độ (Behind schedule)."
      - "`SPI > 1.0` (hay `SV > 0`): Đang vượt trước tiến độ (Ahead of schedule)."
  - num: 3
    title: "Phản xạ FIRST khi lệch chuẩn"
    badge: "PHÂN TÍCH TRƯỚC"
    tone: "amber"
    desc: "Làm gì đầu tiên khi thấy CPI = 0.82 hoặc SPI = 0.85?"
    bullets:
      - "KHÔNG vội xin tiền Sponsor hay bắt nhóm OT ngay lập tức."
      - "Luôn phân tích nguyên nhân gốc rễ (Variance / Root Cause Analysis) cùng nhóm trước!"
```

> [!TIP]
> **Mẹo giải bài toán kết hợp Schedule + EVM:** Nếu đề cho **`SPI = 0.84` và `CPI = 1.15`**, bạn đọc ngay ra dự án đang **trễ tiến độ nhưng dư dả ngân sách** → phương án cứu tiến độ hợp lý nhất trên Đường găng lúc này chính là ==Crashing (dùng dư địa chi phí để bổ sung nguồn lực rút ngắn lịch)==!
