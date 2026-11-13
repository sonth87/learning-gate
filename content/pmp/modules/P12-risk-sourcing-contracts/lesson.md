## 1. Lằn ranh sinh tử: Risk (Tương lai) vs Issue (Hiện tại)

Trong **Miền #7 Risk** (`PMBOK 8 §2.7`), 40% số ca mất điểm đến từ một cái bẫy cực kỳ đơn giản: đề bài mô tả một sự cố **vừa mới nổ ra**, nhưng thí sinh lại chọn *"Cập nhật Risk Register"*. Hãy dùng **bộ lọc thì thời gian 3 giây** dưới đây trước khi nhìn đáp án:

```visual
kind: compare
title: "Phân biệt tuyệt đối Risk (Chưa xảy ra) vs Issue (Đã xảy ra)"
subtitle: "Chỉ cần nhìn xác suất < 100% hay = 100% là loại ngay được 2 đáp án nhiễu!"
left:
  badge: "TƯƠNG LAI · XÁC SUẤT (0% – 99%)"
  title: "Risk (Rủi ro: Threat hoặc Opportunity)"
  tone: "amber"
  bullets:
    - "Dấu hiệu từ khoá: *có thể (might/may)*, *nguy cơ*, *lo ngại nếu...*, *dự báo sắp...*."
    - "Sổ ghi chép ĐẦU TIÊN: **Risk Register** (gán Risk Owner ngay khi nhận diện)."
    - "Bước tiếp theo: Phân tích định tính (**P × I**) → định lượng (nếu cần) → lập **Risk Response Plan**."
right:
  badge: "HIỆN TẠI · ĐÃ XẢY RA (100%)"
  title: "Issue (Sự cố / Vấn đề hiện hữu)"
  tone: "rose"
  bullets:
    - "Dấu hiệu từ khoá: *vừa nghỉ việc*, *hệ thống đã sập*, *nhà thầu vừa báo phá sản*, *phát hiện lỗi*."
    - "Sổ ghi chép ĐẦU TIÊN: **Issue Log** (chỉ định Issue Owner xử lý)."
    - "Nếu rủi ro này đã lường trước: kích hoạt **Contingency Plan**. Nếu hoàn toàn bất ngờ: tạo **Workaround** (giải pháp ứng biến tức thời)."
```

## 2. Mười chiến lược ứng phó Rủi ro & Hai loại rủi ro phái sinh

Sau khi xếp hạng ưu tiên rủi ro ở bước Qualitative Risk Analysis, PM cùng Risk Owner chọn đúng 1 trong **5 chiến lược cho mối đe doạ (Threat)** hoặc **5 chiến lược cho cơ hội tích cực (Opportunity)**:

```visual
kind: groups
title: "Đối xứng 5 Chiến lược Threat ↔ 5 Chiến lược Opportunity"
subtitle: "Nhớ cặp đối xứng để không bao giờ nhầm tên chiến lược trong phòng thi!"
columns: 2
items:
  - icon: "shield"
    title: "5 Chiến lược đối phó Threat (Tiêu cực)"
    badge: "GIẢM P HOẶC I"
    tone: "rose"
    bullets:
      - "**Escalate:** Vượt thẩm quyền của PM hoặc ảnh hưởng tới mục tiêu chương trình/danh mục → chuyển lên Sponsor/Program Manager (PM không theo dõi nữa)."
      - "**Avoid (Né tránh):** Đổi kế hoạch, cắt bỏ hạng mục rủi ro hoặc kéo dài lịch để đưa xác suất `P = 0%`."
      - "**Transfer (Chuyển giao):** Mua bảo hiểm, bảo lãnh hoặc ký hợp đồng khoán sang bên thứ ba (thường tốn phí)."
      - "**Mitigate (Giảm thiểu):** Hành động sớm để giảm `P` hoặc `I` (ví dụ: làm POC, thêm kiểm thử tự động, đào tạo trước)."
      - "**Accept (Chấp nhận):** *Active* = lập sẵn Contingency Reserve/Plan; *Passive* = ghi nhận và theo dõi định kỳ."
  - icon: "zap"
    title: "5 Chiến lược nắm bắt Opportunity (Tích cực)"
    badge: "TĂNG P HOẶC I"
    tone: "emerald"
    bullets:
      - "**Escalate:** Cơ hội mang tầm chiến lược vượt ngoài phạm vi dự án → chuyển lên cấp Program/Portfolio khai thác."
      - "**Exploit (Khai thác triệt để):** Đảm bảo cơ hội chắc chắn xảy ra `P = 100%` (ví dụ: cử kỹ sư giỏi nhất vào làm để chắc chắn ăn thưởng vượt tiến độ)."
      - "**Share (Chia sẻ):** Liên danh (Joint Venture) với đối tác có năng lực đặc biệt để cùng hưởng lợi ích."
      - "**Enhance (Tăng cường):** Tác động vào nguyên nhân để tăng `P` hoặc `I` (bổ sung máy móc để tăng khả năng xong sớm)."
      - "**Accept (Chấp nhận):** Sẵn sàng đón nhận nếu cơ hội tự đến mà không đầu tư thêm nguồn lực chủ động."
```

- [!] **Residual Risk (Rủi ro tàn dư):** Phần rủi ro *còn sót lại* sau khi đã thực thi chiến lược ứng phó (ví dụ: đã lắp hệ thống báo cháy nhưng vẫn còn 2% nguy cơ chập điện).
- [!] **Secondary Risk (Rủi ro thứ cấp):** Rủi ro *mới tinh nảy sinh trực tiếp* từ chính giải pháp ứng phó (ví dụ: thuê Vendor ngoài để `Transfer` rủi ro kỹ thuật lại đẻ ra rủi ro mới là lộ mã nguồn cho bên thứ ba!).

## 3. Chiến lược Mua sắm (Sourcing), Loại hợp đồng & Xử lý tranh chấp

Trong [!badge:amber:PMBOK 8], mua sắm được tích hợp thành quy trình **Plan Sourcing Strategy** thuộc Miền Governance (`§2.1`) và hướng dẫn sâu tại **Phụ lục X4**. Chìa khoá chọn hợp đồng nằm trọn ở **mức độ rõ ràng của Phạm vi (Scope)**:

| Loại hợp đồng | Khi nào chọn chuẩn PMI? | Ai gánh rủi ro chi phí chính? |
| --- | --- | --- |
| **FFP / FPIF / FP-EPA** *(Fixed-Price)* | Phạm vi **đã cực kỳ rõ ràng**, đặc tả chi tiết; thêm **EPA** nếu hợp đồng kéo dài nhiều năm dễ trượt giá/lạm phát. | **Seller (Nhà thầu)** chịu rủi ro đội vốn. |
| **CPFF / CPIF** *(Cost-Reimbursable)* | Phạm vi **R&D phức tạp, biến động mạnh**, không thể chốt cứng giá ngay đầu dự án; hoàn trả chi phí thực hợp lệ + phí thưởng. | **Buyer (Người mua)** chịu rủi ro chi phí thực tế. |
| **T&M** *(Time & Materials)* | Cần bổ sung chuyên gia nhanh, khối lượng chưa rõ; [!badge:emerald:Phản xạ vàng] luôn gắn kèm trần **NTE (Not-To-Exceed)** và giới hạn thời gian! | Chia sẻ theo đơn giá giờ công cố định. |
| **Agile Contracts** *(Dynamic Scope / Multi-tiered)* | Tách hợp đồng khung (Master Agreement) cho điều khoản cố định + phụ lục linh hoạt theo từng Sprint/Story Point hoặc cho phép chấm dứt sớm (*Early Cancellation*). | Hợp tác chia sẻ rủi ro để tối ưu **Value**. |

```visual
kind: flow
title: "Thang ưu tiên Xử lý Tranh chấp với Nhà thầu (Vendor Dispute)"
subtitle: "Tuyệt đối không nhảy thẳng sang kiện tụng hay đơn phương huỷ hợp đồng khi chưa qua 2 bước đầu!"
steps:
  - icon: "file"
    badge: "BƯỚC 1"
    title: "Rà soát Hợp đồng & SOW"
    desc: "Đối chiếu các điều khoản nghiệm thu, SLA, phạt vi phạm và quy trình thay đổi đã ký."
    tone: "sky"
    edge: "Nắm chắc căn cứ"
  - icon: "handshake"
    badge: "BƯỚC 2 · ƯU TIÊN SỐ 1"
    title: "Negotiation (Đàm phán trực tiếp)"
    desc: "PM cùng bộ phận mua sắm thương lượng trực tiếp với Vendor để tìm giải pháp đôi bên cùng có lợi."
    tone: "emerald"
    edge: "Bế tắc mới leo thang"
  - icon: "scale"
    badge: "BƯỚC 3"
    title: "ADR (Mediation / Arbitration)"
    desc: "Giải quyết tranh chấp thay thế qua trung gian hoà giải hoặc trọng tài thương mại theo điều khoản hợp đồng."
    tone: "amber"
    edge: "Bất khả kháng"
  - icon: "lock"
    badge: "BƯỚC 4 · CUỐI CÙNG"
    title: "Litigation (Kiện tụng ra Toà)"
    desc: "Phương án cuối cùng tốn kém thời gian và phá vỡ quan hệ nhất khi mọi nỗ lực ADR đều thất bại."
    tone: "rose"
```

> [!TIP] Quy tắc vàng khi làm việc với Vendor
> Mọi yêu cầu sửa đổi phạm vi bàn giao trong hợp đồng đã ký đều phải đi qua **Contract Change Control System** (phối hợp với bộ phận Procurement/Legal) — thành viên đội dự án không bao giờ được nhắn riêng bảo Vendor sửa tính năng ngoài SOW!
