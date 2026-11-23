## 1. Nhận diện các bên liên quan (`Stakeholders`), `Power/Interest Grid` và Ma trận `SEAM`

Khi triển khai hệ thống Quản lý Kho mới thay thế quy trình cũ, nhiều PM chỉ tập trung báo cáo với lãnh đạo phê duyệt ngân sách mà bỏ qua người vận hành trực tiếp (như thủ kho hoặc kế toán kho). Đến giai đoạn vận hành thực tế, những người dùng cuối này có thể phản đối vì lo ngại quy trình mới gây phức tạp hoặc phơi bày sai sót cũ, dẫn đến dự án bị đình trệ.

Trong **PMBOK® Guide 8 (`§2.5`)**, PMI hợp nhất **Gắn kết Bên liên quan** và **Truyền thông** vào một miền duy nhất là **Stakeholders** (7 quy trình). Cần nắm rõ 3 khái niệm cốt lõi sau:

- **Stakeholder (*Bên liên quan*):** Bất kỳ cá nhân hay tổ chức nào tác động đến dự án, bị ảnh hưởng bởi dự án, hoặc **tự cảm thấy mình bị ảnh hưởng** (từ Sponsor, đội Dev, bộ phận Pháp chế đến người dùng cuối). Việc nhận diện (`Identify Stakeholders`) phải làm **ngay từ lúc khởi tạo và lặp lại liên tục** khi sang pha mới.
- **Power / Interest Grid (*Lưới Quyền lực × Mức độ quan tâm*):** Chia các bên vào 4 ô để phân bổ sức lực hợp lý: *Quyền cao + Quan tâm cao → Theo sát chặt chẽ (`Manage Closely`)*; *Quyền cao + Quan tâm thấp → Giữ hài lòng, tránh làm phiền chi tiết (`Keep Satisfied`)*; *Quyền thấp + Quan tâm cao → Cập nhật thông tin đầy đủ (`Keep Informed`)*; *Thấp + Thấp → Theo dõi định kỳ (`Monitor`)*.
- **SEAM (*Stakeholder Engagement Assessment Matrix* — Ma trận đánh giá mức độ ủng hộ):** Bảng đo thái độ thực tế gồm 5 cột, đánh dấu chữ **`C` (*Current* — Thái độ hiện tại)** và **`D` (*Desired* — Thái độ mong muốn)** để ==chủ động thiết kế hành động kéo C dịch chuyển về đúng D==!

```visual
kind: flow
title: "Thang 5 Nấc Thái độ trên Ma trận SEAM (Kéo C dịch chuyển sang D)"
subtitle: "Không bao giờ phớt lờ người đang ở ô Resistant có ảnh hưởng cao!"
steps:
  - icon: "eye"
    badge: "1. UNAWARE"
    title: "Chưa biết thông tin"
    desc: "Chưa rõ dự án làm gì và ảnh hưởng thế nào tới mình → Truyền thông mục tiêu và phạm vi sớm."
    tone: "slate"
    edge: "Nếu lo mất quyền lợi"
  - icon: "alert"
    badge: "2. RESISTANT"
    title: "Phản đối / Ngầm chống đối"
    desc: "Sợ thay đổi làm tăng việc hoặc mất vị thế → Gặp riêng 1-1 lắng nghe nỗi lo gốc rễ!"
    tone: "rose"
    edge: "Tháo gỡ nghi ngại"
  - icon: "scale"
    badge: "3. NEUTRAL"
    title: "Đứng ngoài trung lập"
    desc: "Biết về dự án nhưng thờ ơ → Chỉ rõ lợi ích thiết thực mà hệ thống mới mang lại cho họ."
    tone: "amber"
    edge: "Mời tham gia góp ý"
  - icon: "handshake"
    badge: "4. SUPPORTIVE"
    title: "Đồng hành ủng hộ (Đích chuẩn)"
    desc: "Tin tưởng mục tiêu dự án và sẵn sàng phối hợp nhân sự, nghiệm thu tích cực."
    tone: "emerald"
    edge: "Trao vai trò hạt nhân"
  - icon: "award"
    badge: "5. LEADING"
    title: "Tiên phong dẫn dắt"
    desc: "Chủ động vận động đồng nghiệp khác cùng đón nhận dự án (dành cho Sponsor & Champions)."
    tone: "cyan"
```

> [!WARNING]
> **Trình tự chuẩn khi phát hiện một Stakeholder mới giữa chừng dự án:** Tuyệt đối không gửi bừa tài liệu ngay! Hãy đi đúng 4 bước: ==(1) Ghi danh vào Stakeholder Register → (2) Phân tích quyền lực, mối quan tâm và thái độ hiện tại → (3) Cập nhật Stakeholder Engagement Plan & Communications Plan → (4) Chủ động gặp gỡ gắn kết==.

## 2. Công thức số kênh truyền thông và 3 phương thức giao tiếp chuẩn PMI

Khi quy mô đội dự án và số lượng bên liên quan tăng lên, độ phức tạp giao tiếp tăng theo hàm bậc hai dựa trên công thức **Số kênh liên lạc = `N × (N - 1) / 2`** (trong đó `N` là tổng số người tham gia, cần tính cả PM nếu đề bài chưa cộng). Ví dụ: nhóm 5 người có `5 × 4 / 2 = 10 kênh`, nhưng khi tăng lên `N = 10` thì số kênh tăng lên **`10 × 9 / 2 = 45 kênh`**.

```visual
kind: groups
title: "3 Phương thức Truyền thông Chuẩn PMI theo Ngữ cảnh"
subtitle: "Vấn đề nhạy cảm, xung đột hoặc hiểu lầm bắt buộc phải ưu tiên Interactive!"
columns: 3
items:
  - num: 1
    icon: "users"
    title: "Interactive (Tương tác 2 chiều)"
    badge: "NHẠY CẢM · PHỨC TẠP"
    tone: "emerald"
    desc: "Đối thoại trực tiếp thời gian thực giúp kiểm chứng sự thấu hiểu và cảm xúc tức thì."
    bullets:
      - "Họp mặt đối mặt, gọi video, hội thảo thiết kế (Workshop), Daily Standup."
      - "Lựa chọn SỐ 1 khi thuyết phục người Resistant, báo tin xấu hoặc gỡ xung đột."
  - num: 2
    icon: "file"
    title: "Push (Đẩy thông tin 1 chiều)"
    badge: "LƯU VẾT CHÍNH THỨC"
    tone: "amber"
    desc: "Gửi tới người nhận cụ thể — xác nhận được ĐÃ GỬI nhưng chưa chắc họ ĐÃ ĐỌC HIỂU."
    bullets:
      - "Email thông báo lịch, biên bản họp (Meeting Minutes), báo cáo tuần, văn bản pháp lý."
      - "Dùng để xác nhận cam kết bằng chữ viết sau khi đã trao đổi trực tiếp."
  - num: 3
    icon: "search"
    title: "Pull (Tự tra cứu kho chung)"
    badge: "ĐÔNG NGƯỜI · DỮ LIỆU LỚN"
    tone: "sky"
    desc: "Đặt tài liệu trên cổng tập trung để hàng trăm người tự mở xem khi có nhu cầu."
    bullets:
      - "Trang Confluence/Wiki, kho tài liệu API, bảng Dashboard công khai, video E-learning."
      - "Tránh làm ngập hòm thư của các Stakeholder chỉ cần tra cứu định kỳ."
```

## 3. Phân biệt Kế hoạch gắn kết các bên liên quan (`Stakeholder Engagement Plan`) và Kế hoạch quản lý truyền thông (`Communications Management Plan`)

Đây là cặp phương án rất dễ gây nhầm lẫn trong đề thi khi thường xuất hiện cùng lúc trong các lựa chọn. Có thể phân biệt nhanh theo bảng đối chiếu sau:

```visual
kind: compare
title: "Khi nào cập nhật Stakeholder Engagement Plan vs Communications Management Plan?"
subtitle: "Phân biệt giữa vấn đề ĐỊNH DẠNG/KÊNH TRUYỀN TIN và vấn đề THÁI ĐỘ/MỨC ĐỘ ỦNG HỘ"
left:
  badge: "THÔNG TIN GÌ · ĐỊNH DẠNG NÀO · BAO LÂU?"
  title: "Communications Management Plan"
  tone: "sky"
  bullets:
    - "Triệu chứng đề bài: 'Giám đốc phàn nàn báo cáo quá dài khó đọc', 'Chi nhánh nước ngoài bị sót email lịch bảo trì', 'Sai ngôn ngữ hoặc trễ bản tin tuần'."
    - "Nội dung quản lý: Ai nhận thông tin gì, tần suất gửi, định dạng (Dashboard tóm tắt hay bảng chi tiết), kênh truyền và người phụ trách gửi."
    - "Từ khoá nhận diện: Information needs, report format, frequency, distribution channel."
right:
  badge: "VÌ SAO HỌ PHẢN ĐỐI · LÀM SAO ĐỒNG THUẬN?"
  title: "Stakeholder Engagement Plan"
  tone: "emerald"
  bullets:
    - "Triệu chứng đề bài: 'Trưởng phòng nghiệp vụ cố tình vắng họp liên tiếp', 'Người dùng nghi ngờ hệ thống mới và từ chối hợp tác UAT'."
    - "Nội dung quản lý: Chiến lược làm việc và hành động cụ thể để xây dựng lòng tin, tháo gỡ kháng cự và dịch chuyển mức ủng hộ trên bảng SEAM."
    - "Từ khoá nhận diện: Resistance, attitude, buy-in, expectations, engagement gap."
```

## 4. Tình huống thực tế và nguyên tắc lựa chọn giữa hai kế hoạch

Giả sử bạn gửi báo cáo tiến độ PDF đều đặn mỗi sáng thứ Hai, nhưng Giám đốc Vận hành vẫn liên tục bác bỏ sản phẩm ở buổi họp cuối tháng vì cho rằng đội dự án không hiểu quy trình kho bãi của ông ấy.

> [!TIP]
> **Nguyên tắc phân biệt nhanh:**
> - Nếu vấn đề là ==báo cáo vẫn gửi đầy đủ nhưng người nhận phản đối, thờ ơ hoặc lệch kỳ vọng== → Gặp trực tiếp lắng nghe và cập nhật **Stakeholder Engagement Plan**.
> - Nếu vấn đề là ==họ có thiện chí ủng hộ nhưng không nắm được tiến độ do báo cáo khó hiểu, gửi sai kênh hoặc thiếu người nhận== → Cập nhật **Communications Management Plan**.
