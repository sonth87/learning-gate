## 1. Phương pháp Quản lý Giá trị Thu được (`Earned Value Management - EVM`) qua ví dụ thực tế

Trong miền **Finance** (`PMBOK 8 §2.4`), **EVM (*Earned Value Management* — Quản lý giá trị thu được)** tích hợp phạm vi, tiến độ và chi phí để đo lường hiệu suất thực tế của dự án. Thay vì ghi nhớ rời rạc các công thức `BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, TCPI`, có thể suy luận toàn bộ từ một ví dụ định lượng cụ thể:

Giả sử dự án gồm **4 module phần mềm tương đương nhau, thực hiện trong 4 tháng** (mỗi tháng hoàn thành 1 module). Ngân sách dự kiến mỗi module là **100 triệu VNĐ** (`$4,000`), do đó Tổng ngân sách kế hoạch **`BAC` (*Budget at Completion*) = 400 triệu VNĐ** (`$16,000`).

Kết thúc **Tháng thứ 2**, số liệu đo đạc thực tế ghi nhận 3 thông số gốc:

1. **`PV` (*Planned Value* — Giá trị kế hoạch):** Theo lịch đến hết tháng 2 phải hoàn thành 2 module → `PV = 200 triệu VNĐ` (`$8,000`).
2. **`EV` (*Earned Value* — Giá trị thu được thực tế):** Đội kỹ thuật hoàn thành trọn vẹn **1,5 module** → giá trị công việc đã thực hiện là `EV = 1,5 × 100 = 150 triệu VNĐ` (`$6,000`).
3. **`AC` (*Actual Cost* — Chi phí thực tế đã chi):** Chi phí nhân sự và hạ tầng thực tế đã giải ngân là **`AC = 200 triệu VNĐ`** (`$8,000`).

Từ 3 thông số `PV = 200tr`, `EV = 150tr`, `AC = 200tr`, nguyên tắc tính toán là ==luôn đặt EV đứng đầu trong mọi phép trừ (Variance) và phép chia (Index)==:

- **Đo lường Chi phí (`EV` so với `AC`):** Chênh lệch chi phí `CV = EV - AC = 150 - 200 = -50tr` (âm = vượt chi phí). Chỉ số hiệu quả chi phí ==CPI = EV / AC = 150 / 200 = 0.75== → mỗi 1 đồng chi ra chỉ tạo ra `0.75` đồng giá trị công việc (**`< 1.0` là đang vượt ngân sách**).
- **Đo lường Tiến độ (`EV` so với `PV`):** Chênh lệch tiến độ `SV = EV - PV = 150 - 200 = -50tr` (âm = chậm lịch). Chỉ số hiệu quả tiến độ ==SPI = EV / PV = 150 / 200 = 0.75== → tiến độ mới đạt 75% kế hoạch (**`< 1.0` là đang chậm tiến độ**).
- **Dự báo tổng chi phí khi hoàn thành (`EAC` — *Estimate at Completion*):** Nếu hiệu suất chi tiêu `CPI = 0.75` tiếp tục duy trì đến cuối dự án, tổng chi phí dự kiến sẽ là **`EAC = BAC / CPI = 400 / 0.75 ≈ 533 triệu VNĐ`** (vượt 133 triệu). Nếu sai lệch vừa qua chỉ là **sự cố đơn lẻ không lặp lại** và phần còn lại thực hiện theo đúng định mức gốc, khi đó `EAC = AC + (BAC - EV) = 200 + (400 - 150) = 450 triệu VNĐ`.
- **Đo mức độ áp lực phần còn lại (`TCPI` — *To-Complete Performance Index*):** Giá trị công việc còn lại là `BAC - EV = 250tr`, trong khi ngân sách còn lại chỉ còn `BAC - AC = 200tr` → **`TCPI = 250 / 200 = 1.25`**. Điều này có nghĩa để không vượt tổng mức 400tr ban đầu, từ thời điểm này mỗi 1 đồng chi ra phải tạo được `1.25` đồng giá trị (`TCPI > 1.0` cho thấy áp lực ngân sách rất cao).

## 2. Đường găng (`Critical Path`) và hai kỹ thuật nén tiến độ (`Crashing` vs `Fast-Tracking`)

Trong **Miền #3 Schedule** (`PMBOK 8 §2.3`), **Đường găng (*Critical Path*)** là chuỗi các công việc phụ thuộc dài nhất quyết định thời gian hoàn thành tối thiểu của toàn dự án — các công việc trên đường này có độ dự trữ **`Total Float = 0`**. Bất kỳ sự chậm trễ nào trên Đường găng đều làm lùi ngày kết thúc chung của dự án.

Khi cần cân bằng nguồn lực bị quá tải (*Over-allocated*), cần phân biệt: **Resource Leveling** phân bổ lại tải cho phép thay đổi và ==thường làm kéo dài Đường găng==; còn **Resource Smoothing** chỉ điều chỉnh công việc trong phạm vi Float sẵn có nên **không làm thay đổi Đường găng**. Khi cần rút ngắn tiến độ trên Đường găng mà giữ nguyên phạm vi, PM áp dụng 1 trong 2 kỹ thuật nén lịch trình:

```visual
kind: compare
title: "Hai Kỹ thuật Nén Tiến độ trên Đường găng: Crashing vs Fast-Tracking"
subtitle: "Chỉ áp dụng cho các công việc nằm trên Critical Path — không cắt giảm kiểm thử"
left:
  badge: "BỔ SUNG NGUỒN LỰC · TĂNG CHI PHÍ"
  title: "Crashing (Tăng nguồn lực)"
  tone: "amber"
  bullets:
    - "Bổ sung nhân sự, mua công cụ hỗ trợ hoặc trả phí làm thêm giờ cho các công việc trên Đường găng."
    - "Hệ quả: **Tăng chi phí trực tiếp (Cost)** — chỉ khả thi khi dự án còn dư địa ngân sách (CPI tốt)."
    - "Nguyên tắc lựa chọn: Ưu tiên nén các công việc trên Đường găng có chi phí tăng thêm trên mỗi ngày thấp nhất."
right:
  badge: "CHẠY SONG SONG · TĂNG RỦI RO LÀM LẠI"
  title: "Fast-Tracking (Thực hiện gối đầu)"
  tone: "emerald"
  bullets:
    - "Chuyển các công việc vốn thực hiện tuần tự sang chạy song song một phần (ví dụ: vừa chốt khung API đã lập trình giao diện trước khi đặc tả hoàn tất 100%)."
    - "Chỉ áp dụng được cho **Phụ thuộc tùy ý (Discretionary)**, không áp dụng cho phụ thuộc vật lý bắt buộc."
    - "Hệ quả: **Tăng rủi ro phải làm lại (Rework)** nếu đầu vào thay đổi."
```

> [!WARNING]
> **Tình huống giới hạn ngân sách trong đề thi:** Nếu đề bài nêu *"Khách hàng yêu cầu rút ngắn lịch 3 tuần nhưng Sponsor khẳng định không cấp thêm ngân sách"*, cần loại bỏ ngay các phương án thuê thêm nhân sự hay làm thêm giờ có trả phí (`Crashing`) — phương án hợp lệ là ==rà soát Đường găng để áp dụng Fast-Tracking kèm kiểm soát rủi ro làm lại==.

## 3. Phân biệt hai quỹ dự phòng: `Contingency Reserve` (rủi ro đã biết) và `Management Reserve` (rủi ro chưa lường trước)

Đề thi PMP thường xuyên kiểm tra ranh giới thẩm quyền giữa **hai loại quỹ dự phòng** trong cấu trúc ngân sách dự án:

```visual
kind: layers
title: "Kiến trúc Ngân sách Dự án & Thẩm quyền Giải ngân Quỹ Dự phòng"
subtitle: "Cost Baseline bao gồm Contingency Reserve nhưng KHÔNG bao gồm Management Reserve"
columns:
  - title: "Cost Baseline (Đường cơ sở chi phí = BAC)"
    badge: "THẨM QUYỀN CỦA PM"
    tone: "emerald"
    layers:
      - label: "1. Chi phí trực tiếp của các Gói công việc (Work Packages)"
        detail: "Chi phí nhân sự, bản quyền phần mềm, hạ tầng ước tính cho từng gói công việc."
        tone: "sky"
      - label: "2. Contingency Reserve (Quỹ dự phòng rủi ro ĐÃ BIẾT)"
        detail: "Dành cho Known-Unknowns đã xác định trong Risk Register — PM có thẩm quyền sử dụng khi rủi ro xảy ra."
        tone: "emerald"
  - title: "Project Budget (Tổng Ngân sách Dự án)"
    badge: "CẦN PHÊ DUYỆT SPONSOR / CCB"
    tone: "amber"
    layers:
      - label: "Toàn bộ Cost Baseline (Phần bên trái)"
        detail: "Đường cong chữ S (S-Curve) làm chuẩn đối chiếu tính toán chỉ số EVM."
        tone: "emerald"
      - label: "3. Management Reserve (Quỹ dự phòng quản lý CHƯA LƯỜNG TRƯỚC)"
        detail: "Dành cho Unknown-Unknowns (biến cố bất ngờ chưa có trong Risk Register) — cần nộp Change Request xin phê duyệt từ CCB/Sponsor."
        tone: "rose"
```

## 4. Phân tích chỉ số `EVM` và bước xử lý đầu tiên khi có sai lệch

```visual
kind: groups
title: "Tổng hợp Tín hiệu Chẩn đoán Chỉ số EVM"
subtitle: "Đối chiếu dấu âm/dương của Variance và ngưỡng 1.0 của Index để đánh giá trạng thái dự án"
columns: 3
items:
  - num: 1
    title: "CPI = EV / AC"
    badge: "HIỆU QUẢ CHI PHÍ"
    tone: "sky"
    desc: "Đo giá trị công việc thu được trên mỗi đơn vị chi phí đã chi."
    bullets:
      - "`CPI < 1.0` (hay `CV < 0`): Đang vượt ngân sách (Over budget)."
      - "`CPI > 1.0` (hay `CV > 0`): Đang tiết kiệm ngân sách (Under budget)."
  - num: 2
    title: "SPI = EV / PV"
    badge: "HIỆU QUẢ TIẾN ĐỘ"
    tone: "emerald"
    desc: "Đo tỷ lệ khối lượng hoàn thành so với kế hoạch tiến độ."
    bullets:
      - "`SPI < 1.0` (hay `SV < 0`): Đang chậm tiến độ (Behind schedule)."
      - "`SPI > 1.0` (hay `SV > 0`): Đang nhanh hơn tiến độ (Ahead of schedule)."
  - num: 3
    title: "Bước xử lý FIRST khi lệch chuẩn"
    badge: "PHÂN TÍCH NGUYÊN NHÂN"
    tone: "amber"
    desc: "Cần làm gì đầu tiên khi phát hiện CPI = 0.82 hoặc SPI = 0.85?"
    bullets:
      - "KHÔNG vội xin thêm tiền Sponsor hay yêu cầu làm thêm giờ ngay lập tức."
      - "Luôn phân tích sai lệch và nguyên nhân gốc rễ (Variance / Root Cause Analysis) cùng nhóm trước."
```

> [!TIP]
> **Kết hợp phân tích Schedule và EVM:** Nếu đề cho **`SPI = 0.84` và `CPI = 1.15`**, dự án đang **chậm tiến độ nhưng còn dư ngân sách** → phương án hợp lý để khôi phục tiến độ trên Đường găng là ==Crashing (tận dụng phần dư ngân sách để bổ sung nguồn lực rút ngắn thời gian)==.
