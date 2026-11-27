# Quy Chuẩn Thiết Kế & Sư Phạm `ScaleWorkbench` (Áp Dụng Bắt Buộc Cho Cả 6 Ứng Dụng Learning Gate)

Tài liệu này khóa cứng toàn bộ quy tắc về **phân loại bài học, đồ họa Isometric 2.5D, animation, tương tác chi tiết, bố cục co giãn và chuẩn hóa thuật ngữ Tiếng Việt / Tiếng Anh** để áp dụng thống nhất xuyên suốt cả 6 ứng dụng: `PyMastery`, `RedisMastery`, `KubeMastery`, `CicdMastery`, `PmpMastery` và `SdMastery` (System Design Mastery).

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

5. **Loại bỏ văn phong "gồng", y khoa hóa / quân sự hóa, giật tít hoặc khẩu ngữ thiếu chuyên nghiệp trên TOÀN BỘ ứng dụng (gồm cả UI Component, Quiz, Flashcards, Simulator, War-Room, Glossary & Giáo trình):**
   - **Cấm dùng các động từ y khoa hóa / huyền bí hóa** như: *"Giải phẫu"*, *"Phẫu thuật"*, *"Mổ xẻ"*, *"Bắt bệnh"*, *"Khám bệnh"*, *"Cầm máu"*, *"Cứu mạng"*, *"Giải mã"* (trừ khi nói về `decode` dữ liệu nhị phân/UTF-8/JWT), *"Đọc vị"*, *"Giải ngố"*.
     - Thay bằng từ bình thường: **`Phân tích`**, **`Cấu trúc của...`**, **`Giải thích chi tiết`**, **`Kiểm tra / Chẩn đoán lỗi`**, **`Khắc phục sự cố`**, **`Tìm hiểu`**.
     - Ví dụ trên nút bấm / nhãn UI: ❌ *"Chấm bài & Giải phẫu đáp án"*, *"Giải phẫu tư duy PMI"*, *"Phẫu thuật lại các câu từng chọn nhầm"*, *"SẬP BẪY"* → ✅ **`Chấm bài & Xem giải thích`**, **`Giải thích theo chuẩn PMI`**, **`Ôn lại các câu trả lời sai`**, **`CHƯA ĐÚNG`**.
   - **Cấm dùng các từ quân sự hóa / cường điệu hóa / giật tít** như: *"Phép thuật ngầm"*, *"Vũ khí (tối thượng / số 1 / hạng nặng)"*, *"Tuyệt chiêu"*, *"Bí kíp / Bảo bối / Thần chú"*, *"Phản xạ sinh tử / vàng"*, *"Phân biệt sinh tử"*, *"Quy tắc sống còn"*, *"Tử huyệt"*, *"Chí mạng"*, *"Thảm họa"*, *"Cú lừa (đo lường / kinh điển)"*, *"Cẩm nang tác chiến"*, *"So găng"*, *"Sát thủ"*, *"Cứu hỏa / Chữa cháy"*.
     - Thay bằng ngôn ngữ sư phạm điềm đạm, chuẩn xác, tôn trọng người học: **`Nguyên lý cốt lõi`**, **`Cơ chế hoạt động`**, **`Công cụ tiêu chuẩn`**, **`Nguyên tắc quan trọng`**, **`Lưu ý thực tế`**, **`Sai lầm phổ biến`**, **`Lỗi nghiêm trọng`**, **`Hướng dẫn xử lý sự cố`**, **`So sánh trực tiếp`**.


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

---

## 6. Chế độ `live-sim` (System Design Mastery)

Ngoài 3 chế độ ở §1, ứng dụng `SdMastery` có thêm chế độ sân khấu **`live-sim`**: dùng `ScaleStageSvg` với `scene` cố định cho cả bước, còn trạng thái theo thời gian (tải, hàng đợi, trạng thái node, packet) đi qua một kênh frame riêng (`frameSource`, dữ liệu `LiveSimFrame` do engine mô phỏng sinh ra qua adapter của feature). Bước không khai báo `liveSim` vẫn chạy đúng như các quy chuẩn ở trên. Các quy tắc §2, §3, §5 áp dụng nguyên vẹn cho `live-sim`.

Chi tiết (kênh frame riêng `frameSource`, packet pool, `SimTimeline`, controls, inspector `liveSlot`, các lỗi cần sửa kèm): xem [`docs/sysdesign/05-live-stage.md`](./sysdesign/05-live-stage.md).

---

## 7. Quy Chuẩn Chống Lỗi Vẽ Mô Hình, Hạt Tín Hiệu Nhân Quả & Lớp HUD (Bài Học Kinh Nghiệm Bắt Buộc)

Toàn bộ các lỗi thiết kế và hiển thị sơ đồ từng gặp phải dưới đây **tuyệt đối không được tái phạm** khi thêm bài học mới hoặc chỉnh sửa `ScaleStageSvg`, `MemoryStageSvg` và `sdSceneBuilder`:

### 7.1. Không Đặt Thẻ Popup / Ghi Chú (`noteCard`, `outputPill`) Bên Trong Nhóm Zoom `<svg>`
- ❌ **Lỗi từng gặp:** Vẽ `noteCard` (*"GÓC NHÌN KIẾN TRÚC"*, *"CHƯA CHẠM 100% ĐÃ RẤT CHẬM"*) hoặc `outputPill` trực tiếp bên trong nhóm `<g ref={sceneCamRef}>` / `<g ref={camGroupRef}>` của `<svg>` và cộng kích thước của thẻ vào `baseBounds`. Hậu quả: khi người dùng zoom in/out hoặc pan sơ đồ, thẻ popup bị phóng to/thu nhỏ và trôi theo sơ đồ, đồng thời đẩy lệch tâm các khối kiến trúc chính.
- ✅ **Quy tắc bắt buộc:** Mọi thẻ popup tổng kết, thẻ ghi chú góc sân khấu (`noteCard` trong `ScaleStageSvg`, `outputPill` trong `MemoryStageSvg`), thanh công cụ zoom và thẻ `StageInspectorPortal` **phải đặt ở lớp HTML HUD bên ngoài `<svg>`** (`position: absolute`, `data-no-pan="true"`), đứng cố định ở góc khung hình và có khả năng nhấn thu gọn (`−` / `+`) để không bao giờ bị biến dạng theo mức zoom hay chiếm mất `viewBox` của mô hình.

### 7.2. Hạt Tín Hiệu (`Packets`) Phải Thể Hiện Đúng Nhân Quả Đa Chặng, Vận Tốc Vật Lý & Hiệu Ứng Chạm Đích
- ❌ **Lỗi từng gặp:**
  1. Cho các hạt chạy đều đều một tốc độ theo `% chiều dài dây` bất kể dây dài hay ngắn, thậm chí khi node quá tải lại cho hạt chạy nhanh hơn (`0.72` so với `0.44`).
  2. Chỉ có hạt `request` đi từ `App → DB` mà quên hạt `response` màu xanh lá (`#9fd28f`) trả ngược từ `DB → App`.
  3. Không có sự liên kết nhân quả giữa các chặng nối tiếp: chặng `App → DB` đang bị chậm (`200 ms` / `500 ms` / quá tải), nhưng chặng trước `Client ↔ LB ↔ App` vẫn bắn hạt Response xanh lá về nhanh liên tục như thể `App` không phải đợi `DB`.
  4. Trong nhánh chọn màu SVG của hạt, đặt điều kiện `isSlow` (`variant === 'slow'`) trước `isResp` (`kind === 'response'`), làm các hạt Response trả về chậm bị tô nhầm thành màu vàng (`#efb041`) thay vì giữ màu xanh lá (`#9fd28f`).
- ✅ **Quy tắc bắt buộc:**
  1. **Vận tốc tính theo pixel/giây trên chiều dài thực của dây (`~152 px/s` cơ sở)** nhân với hệ số ngữ nghĩa:
     - `Cache Hit / RPC nhanh`: `1.08x`.
     - `Health-check / Heartbeat (ping)`: `0.85x` (hạt tròn nhỏ viền xanh lá).
     - `Batch lớn / Multipart Upload (heavy)`: `0.70x` (khối vuông cam lớn `11.6×11.6`).
     - `Truy vấn DB chậm / Cache Miss / Đuôi p99 (slow)`: `0.34x` (bò chậm bằng 1/3 tốc độ Cache Hit để mắt thường thấy rõ sự khác biệt RAM vs. Disk).
  2. **Màu sắc bất biến theo `PacketKind`**:
     - `kind === 'response'` **luôn luôn có màu xanh lá `#9fd28f`** (dù phản hồi nhanh `1.08x` hay phản hồi chậm `variant: 'slow' 0.34x`).
     - `kind === 'request'` đi chiều vào bình thường có màu cam đào `#f3b47f`; khi chậm/chờ đợi (`retry` hoặc `variant: 'slow'`) có màu vàng hổ phách `#efb041`; khi bị từ chối/rớt gói (`dropped` / `error`) có màu đỏ `#e5534b`.
  3. **Lan truyền độ trễ nhân quả từ tầng sau lên tầng trước (`Downstream Bottleneck Propagation`)**:
     - Mọi chặng gọi đồng bộ (`solid`) xuống `Database` hoặc dịch vụ phía sau bắt buộc có cả hạt truy vấn đi xuống lẫn **hạt Response xanh lá (`#9fd28f`, `reverse: true`) trả ngược về** (chờ tại cổng đích hết thời gian xử lý `holdSec` rồi mới xuất phát quay về).
     - Khi chặng sau (`Database`) bị chậm (`200 ms`, `500 ms`, `loadPct >= 48%`, `style: "danger"`) và không được `Cache` ấm che chắn, độ trễ phải truyền ngược lên `App Server → Load Balancer → Client`: chiều vào từ User có mật độ Request dày (**3 hạt đổ vào**), trong khi chiều trả về từ `DB → App` và từ `App → LB → Client` chỉ có **1 hạt Response xanh lá bò chậm (`0.34x`)**, thể hiện trực quan việc *DB trả lời chậm làm kéo chậm phản hồi của Web/App Server về User*.
  4. **Hiệu ứng tại đích (`Hold` & `Arrival FX`)**:
     - Khi hạt chờ xử lý tại nút chậm (`holdSec >= 0.18s`), viền hạt co giãn nhịp nhàng (`stroke-width: 1.5px → 3.35px`) kèm vòng hào quang xung quanh.
     - Khi hoàn tất hành trình (`arrivalFx: 'ok'`), tỏa vòng sóng xanh lá (`#3fa456`) mở rộng `scale(0.8 → 2.1)`.
     - Khi bị chặn bởi Rate Limiter (`429`), Circuit Breaker `OPEN`, Node `DOWN` hoặc đẩy vào `DLQ` (`arrivalFx: 'fail'`), nổ vòng tròn đỏ kèm dấu `✕` trắng (`#e5534b`).
     - Lưu ý: `link.style === 'danger'` trên dây nối tới DB/Server dùng để chỉ đường truyền đang nóng/nghẽn (vẫn phải có hạt Response xanh lá trả về chậm), **không** được gộp chung với link bị cắt đứt hoàn toàn (`cut` / `dead`).

### 7.3. Hàng Đợi Trước Cửa Node Bận Phải Dồn Hàng FIFO Thực Sự (`Shift-and-Consume FIFO Queue`)
- ❌ **Lỗi từng gặp:** Vẽ 3–5 hạt vàng đứng đóng băng tại chỗ trước cửa DB/Server bận (`loadPct >= 68%`), còn hạt mới chạy từ nguồn đến đuôi hàng đợi rồi tự biến mất, không đẩy các hạt cũ nhích lên.
- ✅ **Quy tắc bắt buộc:** Khi dây nối có hàng đợi (`queueCount > 0` trên cả sân khấu tĩnh và `live-sim`):
  1. Hạt mới tiến tới cuối hàng sẽ **nhập thẳng vào ô cuối hàng (`qi = N - 1`)** và chuyển sang màu vàng hàng đợi (`#efb041`).
  2. Toàn bộ các hạt cũ đang chờ trong hàng (`qi = N - 1 .. 1`) **đồng loạt trượt lên 1 ô (`qi → qi - 1`)** về phía cửa DB/Server.
  3. Hạt cũ nhất ở đầu hàng (`qi = 0`) **tiến thẳng vào trong cổng DB/Server** (thu nhỏ dần và mờ đi khi chui vào node để được xử lý), sau đó hạt Response xanh lá (`#9fd28f`) mới đi ra từ chính cổng DB/Server để quay về nguồn.

### 7.4. Định Tuyến Đường Nối Isometric, Phân Làn `stage.layout` & Chống Đâm Xuyên Qua Node Trung Gian
- ❌ **Lỗi từng gặp:**
  1. Trong bài có nhiều `sim` (`S1-02`, `S2-11`, `S3-09`), nạp gộp toàn bộ `links` của mọi `sim` vào cùng một cảnh gây rò rỉ dây nối thừa đè chéo lên sơ đồ.
  2. Bỏ qua cấu hình phân làn `stage.layout` (`col, row`), hoặc xếp 3–4 node thẳng hàng cùng một trục khiến đường nối tắt (`Client → Web Server` khi có `DNS Resolver`, hoặc `API → Blob` khi có `Worker`) cắt xuyên qua chính giữa khối trung gian.
  3. Trong `Memory-2D`, để cố định `baseW = 720` làm cây nhiều nhánh ngang bị cắt cụt hai bên, hoặc đặt đỉnh cây quá cao chạm vào tiêu đề ở `y = -166`.
- ✅ **Quy tắc bắt buộc:**
  1. Chỉ lấy `links` từ đúng `sim` gắn với step/scene hiện tại; không tự động nhét mọi khóa của `stage.links` vào cảnh nếu không thuộc `sim` hoặc `show.links` của cảnh đó.
  2. Tôn trọng tọa độ phân làn `stage.layout` (`col, row`) trên lưới Isometric `2:1`; tự động đẩy lệch trục (`±0.88` theo hướng `SE`) cho các tầng trung gian chỉ có 1 node bị đường nối tắt đi vòng qua, kết hợp kiểm tra va chạm hộp bao (`obstacle detour`) trong `buildIsoLink`.
  3. Trong `Memory-2D` (`tree`), luôn tính `baseW` động theo bề rộng thực của các tầng và đẩy toàn bộ cây xuống nếu cạnh trên của tầng gốc cao hơn `y = -142`.

### 7.5. Biểu Đạt Đầy Đủ Đối Tượng Tham Gia, Thành Phần Phụ Trợ & Tiến Hóa Pipeline Theo Từng Bước
- ❌ **Lỗi từng gặp:**
  1. Bài học giảng về `DLQ`, `Presigned URL`, `Outbox Relay`, `Service Registry`, `KMS / Secrets Manager`, `Push Service + Người nhận`, hay `OTP Queue vs Marketing Queue` nhưng trên sơ đồ lại thiếu hẳn khối đó hoặc thiếu đường nối trực tiếp (`Client → Object Storage`, `SQL → Search Engine`).
  2. Ngay từ Bước 1 (`SETUP` / `PROBLEM` — kiến trúc ngây thơ ban đầu) đã vẽ luôn tất cả các khối giải pháp của Bước 4–5 (`Service Registry`, `Fan-out Queue`), làm mất tính tiến hóa của pipeline.
  3. Sử dụng mã biến viết tắt vô nghĩa (`O1, O2, O3, C1..C4, V2, V3`) làm nhãn `typeTag` trên thẻ sơ đồ, hoặc hiển thị nhầm Tooltip của khóa học khác (Python Namespace, Python GIL, K8s Pod, PMP).
- ✅ **Quy tắc bắt buộc:**
  1. Mọi thành phần chính và thành phần phụ trợ được phân tích trong lời giảng của bước nào phải xuất hiện đúng trên sơ đồ của bước đó với đường nối đúng chiều dữ liệu.
  2. Tuân thủ **Tiến hóa Pipeline (`Progressive Pipeline Evolution`)**: Bước `SETUP`/`PROBLEM` chỉ vẽ đúng kiến trúc khởi đầu (ví dụ `A → B`) để bộc lộ điểm nghẽn; sang các bước `MECHANISM`/`TECHNIQUE` mới thêm dần nhánh phân tách (`A → B → {C, D, E}`) hoặc chèn thành phần trung gian (`Z`) vào giữa.
  3. Tuyệt đối không dùng mã nháp (`O1..O3`, `C1..C4`) trên giao diện và đảm bảo `StageEntityInspector` ưu tiên từ điển thuật ngữ của đúng khóa học hiện tại.
