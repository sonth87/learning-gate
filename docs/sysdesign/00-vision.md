# 00 — Tầm nhìn: System Design Mastery

> Ngày: 2026-11-26. Nguồn sự thật cho mục tiêu và phạm vi. Chi tiết kỹ thuật ở các file `03`–`07`.

## 1. Mục tiêu

`System Design Mastery` (app id `sdmastery`, course/slot id `sysdesign`) là app thứ 6 của Learning Gate. Mục tiêu: giúp người học **thiết kế, đánh giá và sửa kiến trúc hệ thống bằng cách thao tác trên một mô hình chạy được**, thay vì chỉ đọc sơ đồ tĩnh.

Người học học xong phải làm được:
1. Ước lượng nhanh tải, dung lượng, chi phí (napkin math) và biết con số đó đưa tới quyết định gì.
2. Chỉ ra bottleneck và SPOF trong một kiến trúc, giải thích bằng số (ρ, hàng đợi, latency).
3. Chọn và biện minh đánh đổi (trade-off) giữa latency, throughput, consistency, availability, cost.
4. Dự đoán hệ thống sẽ hỏng thế nào khi tải tăng hoặc một thành phần lỗi, rồi sửa được.
5. Trình bày một thiết kế theo khung (SNAKE) trong thời gian giới hạn.

## 2. Người học mục tiêu

- Lập trình viên đã viết được backend/web, muốn chuyển từ "viết code chạy được" sang "thiết kế hệ thống chịu tải".
- Người chuẩn bị phỏng vấn system design.
- Không yêu cầu kiến thức hạ tầng sâu. Bài 0 và 1 dựng nền từ đầu.
- Đọc tiếng Việt. Thuật ngữ kỹ thuật giữ nguyên tiếng Anh (guidelines §5).

## 3. Ba lớp của sản phẩm

| Lớp | Câu hỏi nó trả lời | Nguồn | Dạng trong app |
|---|---|---|---|
| **Tư duy** | Vì sao quyết định thế này? Hỏi gì trước? Đánh đổi gì? | System Design Core (SDC) — nội dung đọc, biên tập tay, có ghi nguồn | `lesson.md`, khung câu hỏi, SNAKE, trade-off |
| **Cơ chế** | Thành phần này hoạt động thế nào, dữ liệu đi đường nào, bước nào xảy ra? | Đối chiếu Designed to Scale (DTS): chỉ tham chiếu mô hình, tự dựng scene | Scene isometric theo bước, inspector |
| **Luyện tập** | Tôi làm được chưa? Hệ thống phản ứng thế nào khi tôi tác động? | **Phần của mình**: engine mô phỏng theo thời gian, chaos, thử thách có chấm điểm | Chế độ `live-sim`, activities, War-Room, Lab, Interview |

Hai nguồn đều thiếu lớp thứ ba. Đó là điểm khác biệt chính của app.

## 4. Định vị so với hai nguồn

| | SDC | DTS | System Design Mastery |
|---|---|---|---|
| Hình thức | Bài viết dài kiểu blog, Mermaid tĩnh | Sơ đồ isometric theo bước, metric viết tay cố định | Bài học + sơ đồ + mô phỏng chạy được |
| Điểm mạnh | Khung tư duy, quyết định | Cơ chế, trực quan | Cả hai, cộng luyện tập |
| Tương tác | Không | Bấm bước tiếp theo | Núm tải, tiêm lỗi, chỉnh tham số, tua timeline, bài tập có chấm |
| Metric | Không có | Con số cố định từng bước | Do engine tính, thay đổi theo tác động |
| Chấm điểm | Không | Không | Có (ràng buộc SLO, cost, cấu trúc) |
| Ngôn ngữ | Tiếng Việt | Tiếng Anh | Tiếng Việt trước, UI song ngữ |

Lưu ý định hướng: định dạng bước của DTS gần trùng `ScaleLessonStep` của repo, nên **giá trị khác biệt phải nằm ở mô phỏng và luyện tập**, không phải ở việc có sơ đồ động.

## 5. Nguyên tắc: một mô hình, nhiều góc nhìn

Mỗi bài dựng trên một `SystemModel` (đồ thị thành phần có tham số). Cùng mô hình đó được chiếu ra tối đa 8 góc nhìn. Không bài nào cần đủ 8, chọn góc nhìn phục vụ đúng khái niệm.

| # | Góc nhìn | Cho thấy | Ví dụ khái niệm |
|---|---|---|---|
| 1 | Topology (isometric) | Thành phần và quan hệ | Request lifecycle, LB, CDN |
| 2 | Flow (sequence + packet) | Request đi qua những chặng nào, mất bao lâu | Tracer waterfall, sync/async |
| 3 | Capacity | ρ từng node, độ dày link theo RPS, đường hockey-stick | Bottleneck, queueing, W = S/(1−ρ) |
| 4 | Data | Hash ring, shard map, hot-key heatmap, replication lag | Sharding, consistent hashing, replication |
| 5 | Time & Consistency | Lịch sử nhiều client (kiểu Jepsen), đọc cũ hay mới | Consistency models, clock, read-your-writes |
| 6 | Failure | Blast radius, SPOF, chaos | Redundancy, circuit breaker, retry storm |
| 7 | Trade-off | Radar latency/throughput/consistency/availability/cost; CAP/PACELC | Quyết định kiến trúc |
| 8 | Evolution | Phiên bản v1→vN, diff kiến trúc | Từ 1 server đến 1 triệu user |

Hệ quả thiết kế: mô hình và engine không biết gì về góc nhìn. Mỗi góc nhìn là một cách trình bày `SimFrame` và `SystemModel`.

## 6. Vòng học: Xem → Đoán → Phá → Sửa → Giải thích

| Bước | Người học làm gì | Cơ chế trong app |
|---|---|---|
| **Xem** | Theo kịch bản có sẵn; metric do engine tính | Bước `live-sim`, đọc `lesson.md` |
| **Đoán** | Dự đoán trước khi chạy (node nào đỏ trước, p99 khoảng bao nhiêu) | Activity `predict`, `spot-bottleneck`, `estimate` |
| **Phá** | Tự tiêm lỗi hoặc tăng tải để thấy hệ thống hỏng | Chaos toolbox, `LoadKnob`, tua timeline |
| **Sửa** | Khắc phục trong ngân sách và số thay đổi tối đa, đạt SLO | Activity `fix-challenge`, `tune-to-limit`; engine chấm |
| **Giải thích** | Giải thích vì sao hệ thống hỏng và vì sao cách sửa hiệu quả | Quiz, flashcard (Leitner), `postmortem` |

Ví dụ kịch bản "Từ 1 server đến 1 triệu user" nằm ở BRIEF §2.11 (gợi ý cho Evolution timeline ở S5-01 và tab Design Cases). Kịch bản của bài mẫu S1-03 đã chốt ở `04-simulation-engine.md` §10.

## 7. Khung tư duy của SDC trở thành công cụ

| Khung SDC | Trở thành |
|---|---|
| Bottleneck 3 bước (đo → tìm → sửa) | Tracer + chaos + fix-challenge |
| Khung câu hỏi hệ thống | Bước bắt buộc đầu mỗi Design Case; câu trả lời quyết định tham số sim |
| Thinking in constraints | Ràng buộc của thử thách (SLO, ngân sách) |
| Scale intuition | Bài ước lượng; kết quả đưa vào sim |
| Trade-off | Ma trận quyết định có số liệu A/B; lưu ADR vào ghi chú |
| Architecture evolution | Evolution timeline chạy được |
| SNAKE (Scope → Numbers → API → Key components → Elaborate) | Interview Mode 5 chặng, bấm giờ |
| Clock / ordering | Timeline nhiều client (Lamport / vector clock) |

## 8. Các tab của app

Thứ tự và id: `learn | lab | warroom | cases | atlas | interview | credits`. Tab chưa làm là placeholder từ T1.3.

| Tab | Mục đích | Milestone |
|---|---|---|
| `learn` | Lộ trình bài học: đọc + scene + sim + activities + quiz + flashcard. Là tab chính, dùng `SdLearnShell` và `ScaleWorkbenchLayout` | M1, M3–M6 |
| `lab` | Canvas Lab: tự dựng kiến trúc trên lưới 2D vuông góc, chạy sim, được chấm theo ràng buộc | M7 (T7.1) |
| `warroom` | Sự cố giả lập chạy trên engine: quan sát dấu hiệu, tìm nguyên nhân, khắc phục, viết postmortem | M7 (T7.2) |
| `cases` | Design Cases (URL shortener, news feed, chat…) kèm Evolution timeline | M7 (T7.3) |
| `atlas` | Pattern Atlas và Glossary: tra cứu mẫu thiết kế và thuật ngữ, gắn với `TermPopover` | M7 (T7.4) |
| `interview` | Interview Mode theo SNAKE, 5 chặng, bấm giờ | M7 (T7.5) |
| `credits` | Ghi công nguồn, giấy phép, danh sách bài chuyển từ SDC | M7 (T7.6, khuyến nghị làm sớm) |

## 9. Phạm vi

**Trong phạm vi**
- Feature module riêng `sysdesign-course` và app `sdmastery` (ADR-001).
- **74 bài** chia 8 level (0–7): 40 bài SDC (level 0–6 theo 7 phase của SDC), 22 bài bổ sung cho các chủ đề DTS mà SDC không phủ đủ (storage engines, index, files, realtime, service discovery, sagas, batch/stream, security, testing, CI/CD…) và 12 bài tự thêm ★ (Little's Law và tail latency, back-pressure, CRDT, multi-region, cost, cách đọc mô phỏng, 6 case study ở level 7). Danh sách và id chốt ở `02-curriculum.md` (ADR-010).
- Engine mô phỏng fluid model (ADR-006), chế độ `live-sim` (ADR-005), activities có chấm điểm.
- Quiz, flashcard Leitner, ghi chú, tiến độ lưu bền và đồng bộ qua slot `sysdesign`.

**Ngoài phạm vi** (ít nhất đến hết M7)
- Bản EN của nội dung bài học (M8).
- Mô phỏng từng request hoặc đo hiệu năng thật. Engine chỉ đúng xu hướng và độ lớn, không đúng số tuyệt đối; UI phải nói rõ điều này.
- Auto-layout tự do trên isometric (Lab dùng lưới 2D, ADR-007).
- Chép dữ liệu scene hoặc lời giảng của DTS (cấm).
- Hạ tầng thật: không triển khai, không gọi dịch vụ ngoài.
- Multi-region trên engine tải, Raft nâng cao, A/B compare (M8). Bài S5-06 (multi-region) và S3-03 (Raft) ở M6 dùng mô phỏng sự kiện có phạm vi hẹp (`04-simulation-engine.md` §12).

## 10. Tiêu chí thành công

Đo được:
1. Bài mẫu `S1-03` được người dùng duyệt (cổng T5.5).
2. Engine pass đủ bộ test bất biến (T2.7) và `npm run sd:test` xanh.
3. Stage `live-sim` chạy 60fps với khoảng 200 packet; kéo tải thấy DB chuyển đỏ và hàng đợi dồn; tua timeline được.
4. 5 app cũ dùng workbench (Redis, K8s, CI/CD, PMP, Python) vẫn diễn hoạt như trước M3 (rơi nảy, morph, packet không chạy x2).
5. Mọi bài từ SDC có `source`; `sd:doctor` xanh; trang Credits liệt kê đầy đủ.
6. Mỗi bài "xong" theo checklist ở `07-content-authoring.md` (có quiz, cards, ít nhất một hoạt động tương tác khi bài có sim).
7. Backup JSON có slot `sysdesign`; import lại không mất tiến độ.

## 11. Rủi ro và cách giảm

| Rủi ro | Cách giảm |
|---|---|
| Phạm vi quá lớn | Chia milestone; bài mẫu là cổng duyệt (ADR-008); mỗi task nhỏ, một commit |
| Isometric khó cho Canvas Lab tự do | Lab dùng lưới 2D vuông góc cùng `SystemModel` (ADR-007) |
| Engine sai dạy sai trực giác | Test bất biến (T2.7), Opus review thuật toán (T2.8), ghi rõ giới hạn trong UI |
| Song ngữ tốn công | Nội dung VI trước, UI song ngữ, EN của bài ở M8 (ADR-002) |
| Giấy phép SDC không rõ | Ghi nguồn đầy đủ, giữ ghi chú MIT, bản gốc chỉ đọc và tách riêng để rút được (ADR-004); người dùng liên hệ tác giả |
| Sửa file dùng chung làm hồi quy 5 app cũ | M3 chạy tuần tự, có task kiểm hồi quy riêng (T3.7); bước không có `liveSim` phải chạy y hệt cũ |
| Lỡ chép nội dung DTS | `reference/dts-models.md` viết bằng lời riêng; checklist review nội dung có mục "không chép DTS" |
| Văn phong lệch guidelines §5 | Doctor chặn từ cấm; checklist review nội dung |
