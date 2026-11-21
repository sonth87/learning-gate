## 1. Giải mã bằng ví dụ phần mềm: Phân biệt tức thì `Risk` (Chưa nổ) vs `Issue` (Đã nổ)

Trong **Miền #7 Risk** (`PMBOK 8 §2.7`), lỗi mất điểm oan uổng nhất của thí sinh là không nhìn kỹ **thì thời gian của động từ** trong câu hỏi. Hãy xét hai câu thông báo sau trong buổi họp sáng của đội phát triển:

- **Câu A:** *"Cổng thanh toán đối tác dạo này hay chập chờn, **có nguy cơ** cuối tuần Flash Sale sẽ bị quá tải!"* → Sự việc **chưa xảy ra** (xác suất từ `1%` đến `99%`). Đó là **Risk (*Rủi ro*)**! Bạn ghi vào **`Risk Register`**, gán người chịu trách nhiệm theo dõi (**`Risk Owner`**), đánh giá xác suất × mức thiệt hại (`P × I`) và chuẩn bị sẵn phương án dự phòng (**`Contingency Plan`**).
- **Câu B:** *"Cổng thanh toán đối tác **vừa sập hoàn toàn từ 8 giờ sáng nay**, khách hàng đang không trả tiền được!"* → Sự việc **đã nổ ra rồi** (xác suất `= 100%`). Nó không còn là rủi ro nữa mà đã biến thành **Issue (*Sự cố hiện hữu*)**! ==Hễ sự kiện đã xảy ra, bạn phải ghi ngay vào Issue Log==: nếu trước đó đã chuẩn bị sẵn kịch bản dự phòng thì kích hoạt ngay `Contingency Plan`; còn nếu đây là tai hoạ bất ngờ chưa từng nghĩ tới thì phải tung giải pháp ứng biến tức thời gọi là **`Workaround`**!

```visual
kind: compare
title: "Bộ Lọc 3 Giây Phân Tách Tuyệt Đối: Risk vs Issue"
subtitle: "Sai sổ ghi chép (Risk Register vs Issue Log) là chọn nhầm đáp án ngay lập tức!"
left:
  badge: "TƯƠNG LAI · XÁC SUẤT < 100%"
  title: "Risk (Rủi ro: Đe doạ hoặc Cơ hội)"
  tone: "amber"
  bullets:
    - "Từ khoá nhận diện: *có thể (might/may/could)*, *nguy cơ*, *lo ngại rằng*, *nếu xảy ra thì...*."
    - "Hồ sơ ghi nhận đầu tiên: **Risk Register** (kèm chỉ định Risk Owner ngay lập tức)."
    - "Quy trình tiếp theo: Phân tích định tính (Qualitative P×I) → Định lượng (nếu dự án lớn) → Lập Risk Response."
right:
  badge: "HIỆN TẠI · ĐÃ XẢY RA = 100%"
  title: "Issue (Sự cố / Vấn đề đang diễn ra)"
  tone: "rose"
  bullets:
    - "Từ khoá nhận diện: *đã nghỉ việc (has resigned)*, *vừa bị khoá*, *nhà thầu vừa báo trễ*, *phát hiện lỗi*."
    - "Hồ sơ ghi nhận đầu tiên: **Issue Log** (gán Issue Owner đứng mũi chịu sào xử lý)."
    - "Hành động: Đã có phương án sẵn → chạy **Contingency Plan**; chưa từng lường trước → lập **Workaround**!"
```

## 2. Mười chiến lược ứng phó Rủi ro & Hai loại rủi ro phát sinh sau đó

Trong chuẩn PMI, từ `Risk` mang nghĩa trung tính bao gồm cả **Threat (*Mối đe doạ xấu*)** lẫn **Opportunity (*Cơ hội tốt — ví dụ hoàn thành sớm được thưởng lớn*)**. Mỗi chiều có đúng **5 chiến lược đối xứng nhau**:

```visual
kind: groups
title: "Đối xứng 5 Chiến lược Threat ↔ 5 Chiến lược Opportunity"
subtitle: "Học theo từng cặp gương soi giúp bạn nhớ trọn 10 chiến lược trong 2 phút"
columns: 2
items:
  - icon: "shield"
    title: "5 Chiến lược xử lý Threat (Tiêu cực)"
    badge: "ĐẨY LÙI P HOẶC I"
    tone: "rose"
    bullets:
      - "**Escalate (Báo cấp trên):** Vượt thẩm quyền PM hoặc lan sang dự án khác → bàn giao hẳn lên Program/Sponsor."
      - "**Avoid (Né tránh — đưa P về 0%):** Bỏ tính năng quá mạo hiểm, đổi công nghệ an toàn hoặc lùi lịch né mùa bão."
      - "**Transfer (Chuyển giao):** Mua bảo hiểm, yêu cầu bảo lãnh ngân hàng hoặc thuê khoán bên thứ ba gánh trách nhiệm tài chính."
      - "**Mitigate (Giảm thiểu):** Làm thử POC sớm, thêm máy chủ dự phòng hoặc đào tạo trước để hạ xác suất/thiệt hại."
      - "**Accept (Chấp nhận):** *Active* = để sẵn tiền/thời gian trong Contingency Reserve; *Passive* = ghi sổ theo dõi."
  - icon: "zap"
    title: "5 Chiến lược đón bắt Opportunity (Tích cực)"
    badge: "KHUẾCH ĐẠI P HOẶC I"
    tone: "emerald"
    bullets:
      - "**Escalate:** Cơ hội chiến lược vượt tầm dự án → chuyển lên cấp danh mục đầu tư của tập đoàn khai thác."
      - "**Exploit (Khai thác 100% — đẩy P lên 100%):** Điều ngay kiến trúc sư giỏi nhất vào làm để chắc chắn giành khoản thưởng hoàn thành sớm."
      - "**Share (Chia sẻ):** Lập liên danh (Joint Venture) với công ty đối tác có thế mạnh chuyên biệt để cùng chia lợi ích."
      - "**Enhance (Tăng cường):** Cấp thêm tài nguyên để tăng khả năng về đích sớm (tăng P hoặc I nhưng chưa tới 100%)."
      - "**Accept:** Không tốn thêm tiền đầu tư, nếu cơ hội tự gõ cửa thì vui vẻ đón nhận."
```

Sau khi triển khai biện pháp ứng phó, đừng nhầm lẫn hai khái niệm hậu kiểm sau:
- **Residual Risk (*Rủi ro tàn dư*):** Phần nguy cơ nhỏ **còn sót lại** sau khi đã phòng bị (ví dụ: đã dựng máy chủ dự phòng nhưng vẫn còn 1% nguy cơ đứt cáp quang cả hai vùng).
- **Secondary Risk (*Rủi ro thứ cấp*):** Rủi ro **mới tinh đẻ ra trực tiếp từ giải pháp ứng phó** (ví dụ: thuê công ty ngoài viết module bảo mật để `Transfer` rủi ro thiếu nhân sự lại đẻ ra rủi ro mới là lộ bí mật mã nguồn!).

## 3. Chọn loại Hợp đồng Mua sắm (`FFP · CPFF · CPIF · T&M`) theo nguyên tắc "Ai gánh rủi ro đội vốn?"

Khi dự án đi thuê nhà thầu ngoài (*Vendor / Seller*), quy trình **Plan Sourcing Strategy** (`PMBOK 8 §2.1 & Appendix X4`) dạy bạn chọn loại hợp đồng dựa trên câu hỏi cốt lõi: **Phạm vi công việc đã rõ ràng tới đâu và ai là người chịu thiệt khi chi phí phát sinh vượt dự tính?**

| Loại hợp đồng viết tắt | Nghĩa đời thường & Ví dụ phần mềm | Ai gánh rủi ro đội chi phí? |
| :--- | :--- | :--- |
| **FFP** *(Firm Fixed Price — Giá trọn gói cố định)* | Phạm vi **đã cực kỳ rõ ràng 100%** (ví dụ: cắt giao diện cho đúng 12 màn hình Figma đã chốt). Chốt giá cứng 600 triệu — Vendor làm chậm tự bù lỗ! *(Biến thể: `FPIF` có thưởng vượt tiến độ; `FP-EPA` cho trượt giá nhiều năm).* | ==Seller (Nhà thầu) chịu rủi ro cao nhất== |
| **CPFF** *(Cost Plus Fixed Fee)* | Phạm vi **mờ mịt, nghiên cứu R&D mới** (ví dụ: thử nghiệm mô hình AI chẩn đoán ảnh X-quang). Người mua thanh toán toàn bộ chi phí thực tế hợp lệ + 1 khoản phí lời cố định cho Vendor. | ==Buyer (Người mua) gánh trọn rủi ro đội vốn== |
| **CPIF** *(Cost Plus Incentive Fee)* | Giống CPFF nhưng gắn thêm công thức **chia sẻ thưởng/phạt theo tỷ lệ** (ví dụ 80/20) nếu Vendor tiết kiệm được chi phí thực tế so với mức mục tiêu. | Buyer vẫn gánh chính, nhưng đôi bên cùng có động lực tiết kiệm |
| **T&M** *(Time & Materials — Công nhật & Vật tư)* | Thuê gấp 2 chuyên gia Cloud DevOps tính tiền theo đơn giá `$70/giờ` khi chưa ước lượng được tổng khối lượng. **Bắt buộc gắn trần tối đa `NTE` (*Not-To-Exceed*) và giới hạn thời gian!** | Rủi ro chia sẻ (nguy hiểm cho Buyer nếu quên khoá trần NTE!) |

> [!WARNING]
> **Bẫy ghép nhầm hợp đồng trong đề thi:** Nếu đề bài mô tả *"Yêu cầu dự án chưa rõ ràng và thay đổi liên tục qua từng tháng"*, đừng bao giờ chọn **FFP** (vì nhà thầu sẽ hét giá phòng thủ cực đắt hoặc liên tục kiện đòi tiền Change Request!). Hãy chọn hợp đồng linh hoạt (Agile Multi-tiered / Cost-reimbursable / T&M có trần).

## 4. Tình huống thực chiến: Xử lý tranh chấp với Nhà thầu (`Vendor Dispute`)

```visual
kind: flow
title: "Thang 4 Nấc Giải quyết Tranh chấp Hợp đồng Chuẩn PMI"
subtitle: "Không bao giờ doạ kiện ra toà hay ngắt thanh toán ngay ở bước đầu tiên!"
steps:
  - icon: "file"
    badge: "BƯỚC 1 · REVIEW"
    title: "Đọc kỹ Hợp đồng & SOW"
    desc: "Kiểm tra điều khoản phạm vi (Statement of Work), tiêu chuẩn SLA và quy trình thay đổi hợp đồng đã ký."
    tone: "sky"
    edge: "Có căn cứ pháp lý"
  - icon: "handshake"
    badge: "BƯỚC 2 · ƯU TIÊN SỐ 1"
    title: "Negotiation (Đàm phán trực tiếp)"
    desc: "PM phối hợp bộ phận Mua sắm ngồi lại thương lượng trực tiếp với Vendor tìm lối ra hợp tác."
    tone: "emerald"
    edge: "Nếu đàm phán bế tắc"
  - icon: "scale"
    badge: "BƯỚC 3 · TRUNG GIAN"
    title: "ADR (Hoà giải / Trọng tài)"
    desc: "Áp dụng cơ chế giải quyết tranh chấp thay thế (Mediation / Arbitration) ghi trong hợp đồng."
    tone: "amber"
    edge: "Phương án cuối cùng"
  - icon: "lock"
    badge: "BƯỚC 4 · TỐI HẬU"
    title: "Litigation (Khởi kiện ra Toà)"
    desc: "Chỉ dùng khi mọi nỗ lực ADR thất bại hoàn toàn vì cực kỳ tốn kém thời gian và chi phí."
    tone: "rose"
```

> [!TIP]
> **Câu thần chú Sourcing:** Mọi tranh chấp hợp đồng trong đề PMP, phương án được ưu tiên tốt nhất (**BEST**) để giữ tiến độ và quan hệ luôn là ==Đàm phán trực tiếp (Direct Negotiation)==!
