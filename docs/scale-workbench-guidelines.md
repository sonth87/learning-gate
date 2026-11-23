# Quy Chuẩn Thiết Kế & Sư Phạm `ScaleWorkbench` (Áp Dụng Bắt Buộc Cho Cả 5 Ứng Dụng Learning Gate)

Tài liệu này khóa cứng toàn bộ quy tắc về **phân loại bài học, đồ họa Isometric 2.5D, animation, tương tác chi tiết, bố cục co giãn và chuẩn hóa thuật ngữ Tiếng Việt / Tiếng Anh** để áp dụng thống nhất xuyên suốt cả 5 ứng dụng: `PyMastery`, `RedisMastery`, `KubeMastery`, `CicdMastery` và `PmpMastery`.

---

## 1. Phân Loại Sư Phạm Trung Thực — Không Ép Nhét Sơ Đồ
Tuyệt đối **không gượng ép vẽ sơ đồ khối hệ thống** cho những bài học thuần cú pháp, toán tử hoặc giải đề văn bản. Mỗi bài/bước bắt buộc chọn đúng 1 trong 3 chế độ sân khấu:
1. **`isometric` (Sơ đồ Kiến trúc & Luồng 2.5D):** Chỉ dùng khi bài học thực sự có luồng dữ liệu đi qua các thành phần hệ thống, tiến trình, mạng, I/O stream, pipeline, bất đồng bộ hoặc cụm phân tán.
2. **`memory-2d` (Bản vẽ Cấu trúc Bộ nhớ, Mảng, Cây & Ma trận 2D):** Dùng cho cấu trúc dữ liệu (chuỗi, slicing, con trỏ Heap, bảng băm, cây đệ quy, đồ thị, bảng DP, ma trận quyết định 2×2).
3. **`code-trace` (Bàn Thực thi Trực tiếp & Bảng Phân tích từng bước):** Dùng cho bài cú pháp, toán tử, nhánh điều kiện cơ bản, vòng lặp cơ bản, kiểm thử đơn vị hoặc giải phẫu câu hỏi tình huống.

---

## 2. Quy Chuẩn Đồ Họa Isometric 2.5D & Đường Nối (`ScaleStageSvg`)
1. **Hình khối 8 lớp bo góc `Q` tỷ lệ 2:1:**
   - Mọi khối `block` và đế `slab` đều bo tròn đỉnh bằng đường cong Bezier bậc hai (`Q`), tỷ lệ trục ngang/dọc chuẩn `2:1`, không có đường kẻ đen chia mặt bên trong (dùng gờ vát sáng trắng `inner white bevel` + bóng đổ nâu ấm `#6b5236` dưới sàn).
   - Không bao giờ nhồi chữ dài tràn ra ngoài khối. Khối trụ (`db`), máy trạm (`device`) và nhóm tác vụ (`crowd`) luôn đặt tên trong thẻ `.pill` tự co giãn độ rộng bên dưới.
2. **Định tuyến Cổng Mặt Bên Chính Xác (`NE`, `SE`, `SW`, `NW` Isometric Ports):**
   - Đường nối `.link` bắt buộc xuất phát và kết thúc vuông góc tại đúng tâm cạnh isometric (`NE`, `SE`, `SW`, `NW`) của hình khối — không bao giờ lơ lửng ngoài rìa hoặc cắt chéo qua đỉnh khối.
   - Khi một khối có nhiều đường nối đi ra/đi vào, tự động phân bổ sang các cổng khác nhau (`NE` cho nhánh trên, `SE` cho nhánh dưới) để không chồng chéo hay gãy khúc ngược.
3. **Animation Kịch Bản Rơi Nảy & Biến Đổi Mượt Giữa Các Step (`Persistent rAF Choreography & Morphing`):**
   - Thẻ `<svg>` **luôn giữ nguyên trên DOM xuyên suốt bài học** (tuyệt đối không gắn `key` ép remount lại sơ đồ khi chuyển step).
   - Khi mở bước đầu hoặc bấm `Chạy lại`: các khối sắp xếp từ sau ra trước, rơi nhẹ từ trên xuống theo đường cong nảy `easeOutBack` (`680ms`, trễ lệch `125ms`), bóng sàn đậm dần khi tiếp đất. **Chỉ sau khi cả 2 khối đầu mút đã chạm sàn**, đường nối `.link` mới bắt đầu vẽ từ nguồn tới đích (`540ms`), mũi tên (`marker-end`) bật ở cuối hành trình (`> 95%`), rồi thẻ `.pill` và hạt tín hiệu mới xuất hiện.
   - Khi chuyển `Step 1 → Step 2 → Step 3`: các khối cũ giữ nguyên `id` sẽ **trượt mượt sang vị trí mới (`760ms`)** trong khi dây nối co giãn bám theo thời gian thực; khối không còn dùng bay nhẹ lên mờ dần (`380ms`); thành phần kiến trúc mới rơi xuống kèm đệm sáng mặt sàn (`spot`), vùng nhóm nét đứt (`StageZoneSlab` như `NAMESPACE · ZERO-TRUST`, `REDIS IN-MEMORY ENGINE`), ký hiệu ngắt mạch `✕` (`cut`) / nhịp tim xanh (`heartbeat`) và **Bảng ghi chú nhỏ (`StageNoteCard`)** ở góc sân khấu.
   - Chữ bên trong khối `block` đặt cao thoáng (`y = 15.5` cho 1 dòng, `y = 10 / 22.5` cho 2 dòng) để không bao giờ chạm đường viền vát đáy.

---

## 3. Tương Tác Giải Thích Sâu Trên Từng Khối, Đường Nối & Nhãn (`Hover & Click Inspector`)
Mọi thành phần trên sơ đồ (`block`, `db`, `device`, `crowd`, đường nối `.link`, thẻ `.pill` và các phần tử trong `memory-2d`) đều phải tương tác được:
- **Khi Hover:** Nổi bật phần tử + hiển thị **Tooltip tóm tắt nhanh** (*Tên thành phần + Vai trò 1 câu + gợi ý nhấn để xem chi tiết*).
- **Khi Click:** Mở **Thẻ Giải Thích Chi Tiết (Component Inspector)** ngay góc sân khấu gồm 4 mục rõ ràng:
  1. **Là gì? (`What`):** Định nghĩa đơn giản, trực diện.
  2. **Hoạt động thế nào? (`How`):** Cơ chế xử lý đầu vào/đầu ra hoặc hành vi runtime.
  3. **Tại sao cần / Tại sao lại thế? (`Why`):** Lý do thiết kế kỹ thuật & đánh đổi (trade-off).
  4. **Mẹo thực chiến & Case Study (`Tips & Production Case`):** Lỗi thực tế thường gặp và cách phòng tránh.

---

## 4. Bố Cục Linh Hoạt 3 Cột (`Collapsible Left` + `Resizable Right`)
1. **Cột trái (Syllabus) thu gọn được:**
   - Có nút thu gọn thành **thanh dọc tối giản (`60px`)** chỉ hiển thị **Icon thư mục màu + Số thứ tự chương (`00`..`08`)** và tiến độ gọn.
   - Khi thu gọn: **Hover** vào bất kỳ chương nào hiển thị ngay **Tooltip nổi** đầy đủ tên chương & số bài hoàn thành; **Click** mở menu chọn bài nhanh hoặc bung rộng lại.
2. **Cột phải (Dẫn chuyện) kéo thay đổi độ rộng được (`Resizable`):**
   - Có thanh kéo phân cách dọc giữa Sân khấu trung tâm và Cột phải, cho phép kéo mượt từ `320px` đến `640px` (nhấp đúp để về mặc định `392px`), lưu bền vững trong `useWorkbenchStore`.
3. **Thanh điều hướng phụ & Header thích ứng theo kích thước cửa sổ (`@container` + Segmented Control):**
   - Vì ứng dụng nằm trong cửa sổ kéo thả của `DeviceLayout` (màn hình có thể lớn nhưng cửa sổ app có thể thu nhỏ ~`750px–950px`), mọi thanh menu ngang bắt buộc dùng CSS Container Queries (`@container`, `@[620px]:inline`, `@[960px]:inline`) thay vì chỉ dùng breakpoint màn hình (`lg:`).
   - Gom các chế độ luyện tập chính (`Bài tập · Quiz · Flashcard · Code thật`) vào một **Segmented Pill Control** gọn gàng, đặt nhãn ngắn 1–2 từ, tách riêng các nút phụ (`Lộ trình`, `XP`) sang góc phải để không bao giờ bị tràn hoặc khuất chữ.

---

## 5. Quy Chuẩn Sư Phạm, Ngôn Từ & Thuật Ngữ Kỹ Thuật Tiếng Việt (Cấm Ẩn Dụ Hóa Quá Đà / Dịch Máy / Từ Lóng Tối Nghĩa)

1. **Giữ nguyên thuật ngữ Tiếng Anh chuyên ngành phổ biến:**
   - Luôn giữ nguyên: `Event Loop`, `Coroutine`, `async / await`, `Non-blocking I/O`, `Blocking I/O`, `Thread`, `ThreadPool`, `ProcessPool`, `GIL`, `Bytecode`, `Call Stack`, `Heap`, `Immutable`, `Mutable`, `Shallow Copy`, `Deep Copy`, `Hashable`, `Hash Table`, `Generator`, `Decorator`, `Context Manager`, `Traceback`, `stdin / stdout / stderr`, `Exit Code`, `Rate Limit`, `Cache Hit / Cache Miss`, `Deadlock`, `Race Condition`.

2. **Tuyệt đối tránh cách ghép từ tối nghĩa, khẩu ngữ cụt lủn hoặc dịch từng chữ:**
   - ❌ Sai: *"await nhường mượt"*, *"tốt cho sync I/O"*, *"1 Thread giữ bytecode/lúc"*, *"time.sleep() làm đơ!"*, *"nhả từng hạt"*.
   - ✅ Đúng: **`Nhường luồng tại await (Non-blocking)`**, **`Xử lý tác vụ Blocking I/O`**, **`1 Thread thực thi Bytecode tại một thời điểm`**, **`Hàm đồng bộ làm nghẽn Event Loop`**, **`Sinh tuần tự từng phần tử (Lazy Evaluation)`**.

3. **Cấm đưa "Ẩn dụ tự chế" (Over-metaphorization) lên Tiêu đề (`#`, `##`, `###`), Mục tiêu bài học (`objectives`), Khối `visual`, `telemetry` hoặc `whatChanged`:**
   - **Quy tắc Trực diện:** Tiêu đề mục và mục tiêu bài học phải nói thẳng tên khái niệm kỹ thuật hoặc bài toán thực tế bằng ngôn ngữ bình thường, rõ ràng để người học nhìn là biết ngay mục đó dạy cái gì và tra cứu lại dễ dàng.
   - ❌ Sai: `## 1. Máy lọc nước theo giọt (O(1) RAM) vs Hồ bơi chứa sẵn (O(N) RAM)`
   - ✅ Đúng: `## 1. Tại sao cần Generator? Xử lý từng phần tử (O(1) RAM) thay vì nạp toàn bộ vào List (O(N) RAM)`
   - ❌ Sai: `## 1. Giải ngố từ gốc: "Vách ngăn tầm nhìn" Namespaces vs "Cầu dao điện nước" cgroups`
   - ✅ Đúng: `## 1. Cơ chế cô lập Container trong Linux: Namespaces (cô lập tầm nhìn) và cgroups (giới hạn tài nguyên)`
   - ❌ Sai: `## 1. Phân biệt "Tờ giấy luật" (Ingress / HTTPRoute) và "Người gác cổng" (Controller)`
   - ✅ Đúng: `## 1. Kiến trúc định tuyến HTTP trên Kubernetes: Bản khai báo (Ingress / HTTPRoute) và Bộ thực thi (Controller)`
   - ❌ Sai: `## 1. Mô hình tư duy từ con số 0: Nhà riêng vs Chung cư (VM vs Container) & Khuôn bánh vs Chiếc bánh (Image vs Container)`
   - ✅ Đúng: `## 1. Phân biệt Máy ảo (VM) với Container, và Image với Container đang chạy`

4. **Trình tự giải thích chuẩn sư phạm 3 bước (Direct Pedagogical Order):**
   - Khi biên soạn nội dung bài học (`lesson.md` / `curriculum.json`), hộp ghi chú (`callout`) và giải thích câu hỏi (`quiz` / `cards`), bắt buộc tuân theo trình tự:
     1. **Bước 1 — Định nghĩa & Bài toán thực tế (Concept First):** Nêu thẳng khái niệm kỹ thuật là gì và nó giải quyết vấn đề gì bằng câu chữ bình thường, mạch lạc.
     2. **Bước 2 — Cơ chế hoạt động & Code/Cấu hình (Mechanism & Code):** Giải thích cụ thể hệ thống xử lý ra sao, đầu vào/đầu ra thế nào.
     3. **Bước 3 — Ví dụ liên hệ trực quan (Supporting Analogy — Tùy chọn ở cuối đoạn):** Nếu khái niệm trừu tượng, có thể bổ sung 1 câu ví dụ đời thường ngắn gọn ở cuối đoạn mở đầu (*"Bạn có thể hình dung cơ chế này giống như..."*) để củng cố trí nhớ — tuyệt đối không dùng từ vựng ẩn dụ thay thế cho thuật ngữ chính trong phần còn lại của bài.

5. **Loại bỏ văn phong "gồng", giật tít hoặc khẩu ngữ thiếu chuyên nghiệp:**
   - Tránh lạm dụng các từ ngữ phóng đại hoặc khẩu ngữ như: *"Giải ngố"*, *"Phép thuật ngầm"*, *"Vũ khí tối thượng"*, *"Phản xạ sinh tử"*, *"Bí mật động trời"*, *"Thần chú"*, *"Cú lừa kinh điển"*.
   - Thay bằng ngôn ngữ sư phạm điềm đạm, chuẩn xác, tôn trọng người học: *"Nguyên lý cốt lõi"*, *"Cơ chế hoạt động bên dưới"*, *"Công cụ tiêu chuẩn"*, *"Nguyên tắc quan trọng"*, *"Lưu ý thực tế"*, *"Sai lầm phổ biến"*.


6. **Ground-Floor `2:1` Port Plane & Đa dạng Bố cục Chiều sâu Isometric (Không xếp ngang kiểu chữ M)**:
   - Mọi thực thể Isometric (`block`, `device`, `crowd`, `db`) và đường nối đều định vị trên cùng **mặt sàn `2:1` (`getGroundCenter`)** kết hợp cắt biên đa giác thực tế (`getSilhouettePolygon`), giúp mũi tên luôn cắm đúng chính giữa 50% cạnh tường (`SW`/`SE` ở `±28px`) và thoát ra mượt mà từ cạnh bên mà không bị lệch lên góc mái.
   - Không xếp phẳng các node theo một hàng ngang `y ≈ 0` (gây uốn vòng chữ M trên không và làm `viewBox` giãn quá rộng khiến khối bị thu nhỏ). Sử dụng `composeIsometricLayout` phân bổ theo cấu trúc đồ thị thực tế: **Đường chéo `2:1`**, **Góc vuông Isometric `NE → SE` / `SE → NE`**, **Rẽ nhánh bậc thang Echelon (Fan-Out / Fan-In)** và **Zíc-zắc Kim cương 4 nút**, giữ `viewBox` gọn (`~620×335`) để khối luôn to, rõ, sắc nét.

7. **Ô Thẻ 2D Tự Co Giãn (`MemoryStageSvg`), Khoảng Cách Node Thoáng Đều & Hint Tự Thu Gọn**:
   - Với chế độ `tape` 2D: khi nhãn dài hơn 4 ký tự (ví dụ các tầng `Dockerfile` hoặc chu trình `Health Probes`), tự động mở rộng thành thẻ giai đoạn (`108px–180px`), tự ngắt dòng tiêu đề phụ và xếp lệch tầng cho các nhãn con trỏ bên dưới để không bao giờ tràn chữ hay đè nhãn.
   - Khoảng cách mặt sàn Isometric (`composeIsometricLayout`): duy trì biên độ chuẩn `2:1` rộng rãi (`dx ≈ 196..228px, dy ≈ ±98..114px`, độ tách dọc `Δgy >= 150px` cho các nhánh Fan-In / Fan-Out / 4 nút như `K17 NetworkPolicy`) để các khối, nhãn dưới chân khối và thẻ đường nối không bao giờ chạm hay che khuất nhau.
   - Nhãn gợi ý tương tác góc trái trên (`"Nhấn vào khối, đường nối hoặc nhãn để xem giải thích sâu"`): hiển thị 3.2 giây đầu khi mở sân khấu rồi **tự động thu gọn mượt thành nút icon tròn `26×26px`**, và **tự bung rộng lại khi rê chuột (`hover`)** vào để giữ sân khấu sạch thoáng.
   - Cả hai sân khấu 2.5D (`ScaleStageSvg`) và 2D (`MemoryStageSvg`) đều tích hợp thanh công cụ **`−` · `100%` · `+`** gọn nhẹ (nhấn trực tiếp vào con số `%` để đặt lại thu phóng & vị trí về mặc định, không dùng nút `Đặt lại` rời), cập nhật trực tiếp `<g transform>` trên DOM kèm `setPointerCapture` để kéo di chuyển (Drag-to-Pan) mượt 60–120fps không giật cục.

8. **Chuẩn Hiển Thị Code IDE (`WorkbenchCodeSurface`) & Bảng Phân Tích Nhanh Thu Gọn Được (`CodeTraceStage`)**:
   - Mọi khung hiển thị code (sân khấu `CodeTraceStage`, khung `Chạy thử Code` và các khối code trong `BlueprintMarkdown`) bắt buộc hiển thị chuẩn trình soạn thảo mã nguồn: có **cột đánh số dòng (`1..N`)**, **cuộn ngang `whitespace-pre` không tự xuống dòng giữa câu lệnh**, **tô màu cú pháp 1-1** (`renderHighlightedPython` / `renderHighlightedConfig`) và **nút đổi giao diện 6 bảng màu IDE** (`Nord`, `Dracula`, `Monokai`, `Midnight`, `Solarized`, `GitHub Light`) đồng bộ xuyên suốt ứng dụng.
   - `Bảng phân tích nhanh` bên phải của `CodeTraceStage` có nút **thu gọn thành thanh dọc gọn `42px`** (và mở rộng lại bất cứ lúc nào), nhường tối đa chiều ngang cho khung soạn thảo code khi cần đọc những dòng mã dài.
