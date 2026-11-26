# 02 — Chương trình chốt (curriculum)

> Nguồn sự thật duy nhất cho danh sách bài của `sdmastery` (course id `sysdesign`). Mọi tài liệu khác (TASKS, 07-content-authoring, build script) tham chiếu id ở đây. Khi thêm, bớt, đổi tên hay đổi thứ tự bài, sửa file này trước. Đối chiếu mô hình DTS: [`reference/dts-models.md`](./reference/dts-models.md). Quy trình chuyển bài SDC: [`07-content-authoring.md`](./07-content-authoring.md).

Nguồn đã khảo sát: SDC commit `fe4234da7d6fe719e8e18547856fc0a730155420` (40 bài trong 7 phase) và DTS (40 bài trong 9 chương). Tiêu đề bài ở đây là tiêu đề của app, viết trực diện theo `docs/scale-workbench-guidelines.md` §5, có thể khác tiêu đề gốc SDC.

## 1. Quy ước

**Id bài.** `S<phase>-<nn>`, ví dụ `S1-03`. Phase 0..6 là 7 phase của SDC. Id `01..N` của bài SDC giữ đúng số thứ tự bài trong phase của SDC (`S1-03` = `phase-1/lesson-3`). Bài bổ sung nhận id tiếp nối trong phase phù hợp (S1-06, S2-06, …). Phase 7 là nhóm riêng "Case Studies", không có tương ứng ở SDC.

**Thứ tự học khác thứ tự id.** Bảng mỗi phase xếp theo thứ tự học đề xuất. Bài bổ sung có thể nằm xen giữa bài SDC (ví dụ S1-06 đứng sau S1-01 vì giải thích đường đi của một request trước khi vào S1-03). Id không đổi theo vị trí; người học thấy thứ tự theo bảng. Danh sách đồng bộ với `module.json` và roadmap trong app.

**Cột nguồn SDC.** Dạng `p<phase>/l<n>` kèm slug rút gọn. Đường dẫn đầy đủ: `content/phases/phase-<p>/lessons/lesson-<n>-<slug>.mdx` (commit nêu trên). `—` nghĩa là bài không có nguồn SDC.

**Cột DTS.** Id bài DTS đối chiếu (xem `reference/dts-models.md`). `(một phần)` là bài SDC này chỉ phủ một phần chủ đề DTS; phần còn lại nằm ở bài khác. Nếu một chủ đề DTS không được bài SDC nào phủ đủ thì thành bài bổ sung với nguồn DTS-chính.

**Cột Sim.** `live`: mô phỏng có tải (LoadProfile, `live-sim`). `sự kiện`: engine chạy kịch bản sự kiện/timeline cố định, không cần núm tải (ví dụ partition, crash, lịch sử nhiều client). `—`: không cần mô phỏng; cột chi tiết ghi công cụ thay thế.

**Dạng bài tập.** Giá trị là `ActivityKind` (06 §2): `predict`, `spot-bottleneck`, `tune-to-limit`, `estimate`, `fix-challenge`, `order`, `timeline-read`, `postmortem`, `design-constraint`. Mọi bài đều có quiz và cards (Leitner); cột này chỉ ghi dạng hoạt động chấm điểm ngoài quiz. `—` nghĩa là bài không có activity, chỉ có quiz và cards.

**Số liệu trong kịch bản.** Các con số ở mục "Kịch bản mô phỏng" là bản phác để định hướng. Khi viết `sim.json`, tham số do dự án tự chọn và kết quả do engine tính (07 §3 bước 8); không lấy lại giá trị metric cố định của DTS (`01-sources-and-credits.md` §2). Riêng S1-03 đã chốt theo `04-simulation-engine.md` §10.

**Ưu tiên.** P0 = bài mẫu M5 (một bài duy nhất). P1 = bài kiểm chứng một primitive hoặc công cụ dùng lại nhiều nơi. P2 = các bài còn lại. Ưu tiên chỉ ảnh hưởng thứ tự nếu phải cắt phạm vi; thứ tự thực thi thật là batch ở mục 6.

**Batch.** Số batch M6 (mục 6); `M5` là bài mẫu làm ở M5, trước mọi batch.

**Trạng thái.** `todo` | `doing` | `review` | `done`. Cập nhật cùng `TASKS.md`.

**Ký hiệu ★.** Phần mình thêm, không có trong SDC lẫn DTS (hoặc chỉ nhắc rất ngắn).

## 2. Thống kê

Tổng: **74 bài** = 40 bài SDC + 22 bài bổ sung từ chủ đề DTS + 12 bài tự thêm (★).

| Phase | Tên | Tổng | SDC | Bổ sung (DTS) | ★ | Có sim (live) | Có sim (sự kiện) | Không sim |
|---|---|---|---|---|---|---|---|---|
| 0 | Mental Model Shift | 9 | 8 | 0 | 1 | 1 | 0 | 8 |
| 1 | Foundation | 8 | 5 | 2 | 1 | 6 | 1 | 1 |
| 2 | Core Building Blocks | 12 | 5 | 7 | 0 | 8 | 3 | 1 |
| 3 | Distributed Fundamentals | 9 | 6 | 2 | 1 | 0 | 9 | 0 |
| 4 | Scalability & Performance | 11 | 7 | 3 | 1 | 10 | 1 | 0 |
| 5 | Real-World Patterns | 6 | 3 | 2 | 1 | 4 | 2 | 0 |
| 6 | Mastery | 12 | 6 | 5 | 1 | 3 | 2 | 7 |
| 7 | Case Studies | 7 | 0 | 1 | 6 | 6 | 1 | 0 |
| | **Cộng** | **74** | **40** | **22** | **12** | **38** | **19** | **17** |

Ưu tiên: P0 = 1, P1 = 30, P2 = 43. Tổng bài có mô phỏng (live hoặc sự kiện): 57/74.

Số bài dùng từng dạng bài tập (một bài có thể có nhiều dạng): `predict` 36, `spot-bottleneck` 12, `tune-to-limit` 16, `estimate` 19, `fix-challenge` 15, `order` 10, `timeline-read` 10, `postmortem` 15, `design-constraint` 21. Bài không có activity (chỉ quiz và cards): 1 (S0-08).

## 3. Phase 0 và Phase 6: biến khung tư duy thành công cụ

Hướng dẫn: `docs/scale-workbench-guidelines.md` §1 cấm ép sơ đồ cho bài thuần tư duy. Với các bài này, nội dung đọc dùng `code-trace` hoặc `memory-2d`; phần tương tác là một công cụ nhỏ, dữ liệu của công cụ nối vào engine ở các bài sau (BRIEF §2.9). Các bài thuần tư duy (S0-01..S0-08, S6-01, S6-02, S6-04) không dùng `live-sim`; trong Phase 0 chỉ S0-09 dùng sim, và cố ý để người học làm quen giao diện trước S1-03.

| Khung SDC | Bài | Công cụ tương tác | Dữ liệu đi vào đâu |
|---|---|---|---|
| Problem-first, hỏi "Why" | S0-01 | Làm rõ yêu cầu: chọn câu hỏi, mỗi câu lộ một ràng buộc | Thành câu hỏi bắt buộc ở bước đầu của Design Case |
| Trade-off matrix | S0-02, S6-03 | Ma trận có trọng số; A/B hai phương án bằng số engine | Radar ở Trade-off view; ADR lưu vào ghi chú |
| Thinking in constraints | S0-04 | Ngân sách ràng buộc (compute, RAM, network, DB, người) | Điều kiện chấm của fix-challenge và design-constraint |
| Scale intuition | S0-05 | Estimator DAU → RPS → storage → băng thông → RAM | Nút "Đưa vào mô phỏng": đặt peak RPS và read:write cho bài sau |
| System thinking (I → P → S → O) | S0-06 | Lắp ô trống theo luồng yêu cầu | Chạy một lượt packet để kiểm luồng |
| 7 câu hỏi hệ thống | S0-07 | Requirements Card | Brief dùng lại ở Design Cases và Interview Mode |
| Bottleneck 3 bước (đo, tìm, sửa) | S1-03 | Tracer + chaos + fix | Bài mẫu M5 |
| Architecture evolution | S5-01 | Evolution timeline chạy được (v1 → vN, diff) | Dùng lại ở Design Cases |
| SNAKE | S6-02 | Interview Mode 5 chặng có đồng hồ | M7 |
| Khung quyết định kiến trúc | S6-01, S6-03 | Luồng quyết định bấm được; ADR | Ghi chú của người học |
| Clock và ordering | S3-06 | Timeline nhiều process (Lamport, vector clock) | Time view dùng chung với S3-02, S3-08 |

## 4. Bảng bài theo phase

Mỗi phase có một bảng tổng và một tiểu mục chi tiết cho từng bài. Bảng giữ các cột nhận diện; mô hình/scene và kịch bản sim nằm ở tiểu mục.

### Phase 0 — Tư duy hệ thống

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S0-01 | Problem-first: hỏi bài toán trước khi chọn công nghệ | `p0/l1` code-first-to-problem-first | — | — | design-constraint | P2 | 2 | todo |
| S0-02 | Trade-off thay vì giải pháp hoàn hảo | `p0/l2` perfect-solution-to-trade-of… | — | — | predict, design-constraint | P1 | 2 | todo |
| S0-03 | Components và Communication: bài khởi động | `p0/l3` foundation-exercises | — | — | order | P2 | 2 | todo |
| S0-04 | Thinking in Constraints: giới hạn compute, memory, network, DB, nhân sự | `p0/l4` thinking-in-constraints | — | — | estimate, design-constraint | P1 | 2 | todo |
| S0-05 | Scale Intuition và Napkin Math | `p0/l5` scale-intuition | `napkin-math` | — | estimate | P1 | 3 | todo |
| S0-06 | System Thinking: Input → Processing → Storage → Output | `p0/l6` system-thinking-framework | — | — | order, spot-bottleneck | P2 | 3 | todo |
| S0-07 | Khung 7 câu hỏi khi thiết kế hệ thống | `p0/l7` system-question-framework | — | — | design-constraint | P1 | 3 | todo |
| S0-08 | Tổng kết 4 mindset của Phase 0 | `p0/l8` mental-model-recap | — | — | — | P2 | 3 | todo |
| S0-09 | Cách đọc mô phỏng và telemetry ★ | — | — | live | predict | P1 | 2 | todo |

#### S0-01 — Problem-first: hỏi bài toán trước khi chọn công nghệ

- Mục tiêu học: Phân biệt Code-first với Problem-first; biết hỏi "Why" và "cho ai, bao nhiêu" trước khi nghĩ tới "How".
- Mô hình/scene: `code-trace`: so sánh hai quy trình cho yêu cầu "đếm view" (nhảy vào code ngay, hay hỏi yêu cầu trước).
- Mô phỏng: Không cần sim. Công cụ "Làm rõ yêu cầu": brief mơ hồ, người học chọn câu hỏi để hỏi; mỗi câu làm lộ một ràng buộc ẩn (độ chính xác, độ trễ, quy mô) và làm đổi thiết kế đề xuất.
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-1-code-first-to-problem-first.mdx`; Ưu tiên P2, batch 2.

#### S0-02 — Trade-off thay vì giải pháp hoàn hảo

- Mục tiêu học: Đọc và lập Trade-off Matrix; hiểu "good enough" là một quyết định có điều kiện, không phải thỏa hiệp.
- Mô hình/scene: `memory-2d`: ma trận quyết định có trọng số (cache hay không cache) + các cặp trade-off thường gặp.
- Mô phỏng: Không cần sim trực tiếp. Số liệu hai cột A/B (có cache / không cache) lấy từ hai lần chạy engine đã ghi sẵn (snapshot), người học đổi trọng số và xem phương án thắng đổi theo.
- Bài tập: predict, design-constraint.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-2-perfect-solution-to-trade-off-thinking.mdx`; Ưu tiên P1, batch 2.

#### S0-03 — Components và Communication: bài khởi động

- Mục tiêu học: Nhận diện thành phần (Client, LB, App, Cache, DB, Queue) và kiểu giao tiếp sync/async trên một hệ thống thật; xác định bước chậm.
- Mô hình/scene: `isometric` tĩnh có packet: client → LB → app → cache/DB; link sync nét liền, async nét đứt.
- Mô phỏng: Không cần sim. Bài khởi động ngắn; phần định lượng nằm ở S1-01..S1-03. Giữ ở mức nhận diện để tránh trùng nội dung với Phase 1.
- Bài tập: order.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-3-foundation-exercises.mdx`; Ưu tiên P2, batch 2.
- Ghi chú: SDC lesson-3 trùng phần lớn với phase-1 lesson-1/2/3; giữ làm bài vào đề, cắt phần giảng lặp.

#### S0-04 — Thinking in Constraints: giới hạn compute, memory, network, DB, nhân sự

- Mục tiêu học: Bắt đầu thiết kế từ giới hạn thật (CPU, RAM, băng thông, kết nối DB, quy mô team) thay vì từ công nghệ ưa thích.
- Mô hình/scene: `memory-2d`: bảng 5 loại giới hạn kèm thanh ngân sách.
- Mô phỏng: Không cần sim. Công cụ "Ngân sách ràng buộc": đặt giới hạn, tính ra thông lượng tối đa. Cùng bộ ràng buộc này trở thành điều kiện chấm ở các bài fix-challenge.
- Bài tập: estimate, design-constraint.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-4-thinking-in-constraints.mdx`; Ưu tiên P1, batch 2.

#### S0-05 — Scale Intuition và Napkin Math

- Mục tiêu học: Ước lượng nhanh DAU → RPS (trung bình, peak) → storage → băng thông → RAM cache với sai số ±30%.
- Mô hình/scene: `memory-2d`: thang log 1K/1M/1B và bảng ước lượng; công cụ estimator.
- Mô phỏng: Không cần sim. Estimator có nút "Đưa vào mô phỏng": kết quả thành tham số tải (peak RPS, read:write) dùng ngay ở bài sau.
- Bài tập: estimate.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-5-scale-intuition.mdx`; Đối chiếu DTS `napkin-math`; Ưu tiên P1, batch 3.

#### S0-06 — System Thinking: Input → Processing → Storage → Output

- Mục tiêu học: Phân rã một tính năng ("cập nhật profile") thành chuỗi thành phần và chỉ ra chỗ lỗi nếu mỗi thành phần hỏng.
- Mô hình/scene: `isometric` có ô trống (slot) để lắp thành phần theo luồng yêu cầu.
- Mô phỏng: Không cần sim. Tương tác lắp ô trống; kiểm tra luồng bằng packet chạy một lượt.
- Bài tập: order, spot-bottleneck.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-6-system-thinking-framework.mdx`; Ưu tiên P2, batch 3.

#### S0-07 — Khung 7 câu hỏi khi thiết kế hệ thống

- Mục tiêu học: Dùng checklist 7 câu hỏi (scale, traffic, data, availability, consistency, latency, ràng buộc) để biến brief thành yêu cầu đo được.
- Mô hình/scene: `code-trace`/biểu mẫu "Requirements Card".
- Mô phỏng: Không cần sim. Câu trả lời sinh tham số sim (read:write, SLO, peak RPS) và lưu thành Brief dùng lại ở Design Cases và Interview Mode (M7).
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-7-system-question-framework.mdx`; Ưu tiên P1, batch 3.

#### S0-08 — Tổng kết 4 mindset của Phase 0

- Mục tiêu học: Củng cố: không có best solution, luôn hỏi why, trade-off quan trọng hơn công nghệ, tư duy hệ thống trước tư duy code.
- Mô hình/scene: `memory-2d`: sơ đồ nối 4 mindset với 4 công cụ đã dùng ở S0-01..S0-07.
- Mô phỏng: Không cần sim. Ôn tập bằng quiz tình huống và flashcards.
- Bài tập: không có activity chấm điểm; chỉ quiz và flashcards.
- Nguồn SDC `content/phases/phase-0/lessons/lesson-8-mental-model-recap.mdx`; Ưu tiên P2, batch 3.

#### S0-09 — Cách đọc mô phỏng và telemetry ★

- Mục tiêu học: Biết dùng LoadKnob, đồng hồ ρ, p50/p99, timeline và inspector để đọc một mô phỏng; hiểu giới hạn "đúng xu hướng, không đúng số tuyệt đối".
- Mô hình/scene: `isometric` tối giản: 1 client → 1 service.
- Kịch bản mô phỏng (live): Ramp 50 → 400 RPS trên 1 service (μ = 300 RPS). Người học thấy ρ tăng, node đổi màu, hàng đợi chất trước node, p99 vọt; tua timeline về lúc còn ổn.
- Bài tập: predict.
- Ưu tiên P1, batch 2.
- Ghi chú: Bài tự thêm. Xếp cuối Phase 0 vì bài mô phỏng đầu tiên thực sự là S1-03; có thể hiện dạng tour ở Home.

### Phase 1 — Nền tảng định lượng

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S1-01 | Các thành phần của một hệ thống web | `p1/l1` components-trong-he-thong-we… | `request-lifecycle` (một phần) | live | predict | P1 | 1 | todo |
| S1-06 | Vòng đời một request: DNS, kết nối, server, database | — | `request-lifecycle` | sự kiện | estimate, timeline-read | P1 | 1 | todo |
| S1-02 | Communication Patterns: sync, async, event-driven | `p1/l2` communication-patterns | `queues` (một phần), `pubsub` (một phần) | live | predict, spot-bottleneck | P1 | 1 | todo |
| S1-08 | REST, RPC và GraphQL: chi phí trên mạng di động | — | `apis` | — | estimate | P2 | 10 | todo |
| S1-03 | Data Flow và Bottleneck: tìm và sửa điểm nghẽn | `p1/l3` data-flow-and-bottlenecks | `latency-throughput` (một phần), `request-lifecycle` (một phần) | live | predict, spot-bottleneck, tune-to-limit, estimate, fix-challenge, order | P0 | M5 | review (T5.1–T5.4 xong: 11 step, stage.json, sim.json, activities.json A1–A6, quiz, cards; chờ T5.5 cổng duyệt người dùng) |
| S1-04 | Latency, Throughput, Availability và CAP (mở đầu) | `p1/l4` cac-khai-niem-quan-trong | `latency-throughput` (một phần), `cap` (một phần) | live | predict, estimate | P1 | 1 | todo |
| S1-07 | Hàng đợi, Little's Law và tail latency ★ | — | `latency-throughput` | live | predict, estimate, tune-to-limit | P1 | 1 | todo |
| S1-05 | Bài tập tổng hợp Phase 1 | `p1/l5` bai-tap-tong-hop | `design-url-shortener` (một phần) | live | fix-challenge, design-constraint | P2 | 3 | todo |

#### S1-01 — Các thành phần của một hệ thống web

- Mục tiêu học: Biết vai trò, giới hạn và kiểu hỏng của Client, Load Balancer, App Server, Cache, Database.
- Mô hình/scene: `isometric`: client → LB → app → cache → DB; inspector từng khối có vai trò, cách scale, failure mode.
- Kịch bản mô phỏng (live): Steady 200 RPS. Bấm từng thành phần xem ρ và latency nền; tắt cache để thấy ρ của DB nhảy từ khoảng 0,1 lên 0,5.
- Bài tập: predict.
- Nguồn SDC `content/phases/phase-1/lessons/lesson-1-components-trong-he-thong-web.mdx`; Đối chiếu DTS `request-lifecycle` (một phần); Ưu tiên P1, batch 1.

#### S1-06 — Vòng đời một request: DNS, kết nối, server, database

- Mục tiêu học: Cộng dồn thời gian từng chặng (DNS, handshake, server, query, download) và nhận ra chặng nào chiếm phần lớn.
- Mô hình/scene: `isometric`: device → DNS → web server → DB, kèm waterfall.
- Kịch bản mô phỏng (sự kiện): Một request được lần theo (tracer waterfall), không phải tải. Núm: RTT, thời gian query. Hai ca: query chậm (15 → 400 ms), người dùng ở xa (RTT 200 ms).
- Bài tập: estimate, timeline-read.
- Đối chiếu DTS `request-lifecycle`; Ưu tiên P1, batch 1.
- Ghi chú: Chủ đề chỉ DTS có. Cung cấp tracer cho S1-03.

#### S1-02 — Communication Patterns: sync, async, event-driven

- Mục tiêu học: Chọn giữa Request-Response, Message Queue và Event-Driven theo yêu cầu độ trễ, độ tin cậy, coupling.
- Mô hình/scene: `isometric`: hai chuỗi gọi song song (sync chain và qua queue).
- Kịch bản mô phỏng (live): Chuỗi 3 service gọi sync; làm service cuối chậm thêm 500 ms: p99 cả chuỗi tăng, thread cạn. Bản có queue hấp thụ và trả lời sớm.
- Bài tập: predict, spot-bottleneck.
- Nguồn SDC `content/phases/phase-1/lessons/lesson-2-communication-patterns.mdx`; Đối chiếu DTS `queues` (một phần), `pubsub` (một phần); Ưu tiên P1, batch 1.

#### S1-08 — REST, RPC và GraphQL: chi phí trên mạng di động

- Mục tiêu học: Chọn kiểu API theo số round trip, kích thước payload và nhu cầu truy vấn linh hoạt; phân trang cursor và versioning.
- Mô hình/scene: `isometric`: device (4G) → API → services; so sánh 3 kiểu.
- Mô phỏng: Không cần live-sim. Dùng waterfall tĩnh so sánh số round trip và payload của REST, GraphQL, gRPC ở cùng một màn hình.
- Bài tập: estimate.
- Đối chiếu DTS `apis`; Ưu tiên P2, batch 10.
- Ghi chú: Chủ đề chỉ DTS có.

#### S1-03 — Data Flow và Bottleneck: tìm và sửa điểm nghẽn  (bài mẫu P0)

- Mục tiêu học: Áp dụng quy trình 3 bước đo, tìm, sửa; hiểu hệ thống chỉ nhanh bằng thành phần chậm nhất và thêm server ở tầng không nghẽn không giúp gì.
- Mô hình/scene: `isometric`: client → LB → app ×3 → cache (read-through) → DB. Model và id node/link đúng như `S1-03/ramp` ở `04-simulation-engine.md` §10.
- Kịch bản mô phỏng (live, `S1-03/ramp`): Ramp 200 → 5.000 RPS trong 60 s, giữ đỉnh tới giây 90; 90% đọc, cache trả lời khoảng 52% lượt đọc. DB qua ρ = 0,9 ở t ≈ 31 s và chạm ρ = 1 ở t ≈ 35 s (λ ≈ 3.010 RPS) trong khi app mới ở ρ ≈ 0,56; hàng đợi chất trước DB, p99 vọt; thêm instance app không cải thiện. Tracer waterfall cho thấy thời gian nằm ở chặng DB. Tua timeline về t ≈ 20 s (ρ DB ≈ 0,6).
- Bài tập: predict (S1-03.A1), spot-bottleneck (A2), tune-to-limit (A3: tải tối đa ≈ 2.950–3.010 RPS), estimate (A4), fix-challenge (A5), order (A6). JSON mẫu ở `06-activities-and-grading.md` §3.
- Nguồn SDC `content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx`; Đối chiếu DTS `latency-throughput` (một phần), `request-lifecycle` (một phần); Ưu tiên P0, batch M5.
- Ghi chú: BÀI MẪU (M5). Thử thách sửa (A5): giữ p99 ≤ 300 ms và lỗi ≤ 1% suốt 90 s (kể cả ở đỉnh 5.000 RPS), tối đa 3 thay đổi, chi phí ≤ 2,50 USD/giờ. Núm được phép: dung lượng cache (`capacityKeys`), cỡ máy DB (`sizeFactor`), số instance từng app (bẫy: không cứu được SLO), retry/timeout/breaker của link `cache-db`. Lời giải mẫu: cache 50.000 key + DB ×2 + retry có backoff và jitter (≈ 2,31 USD/giờ).

#### S1-04 — Latency, Throughput, Availability và CAP (mở đầu)

- Mục tiêu học: Phân biệt latency với throughput; đọc "số 9" thành downtime/năm; nắm CAP ở mức khái niệm.
- Mô hình/scene: `isometric` + Capacity view: đường latency–throughput, bảng số 9.
- Kịch bản mô phỏng (live): Steady rồi ramp trên 1 service; vẽ đường throughput so với latency và p50/p99. Phần CAP đẩy sang S3-01.
- Bài tập: predict, estimate.
- Nguồn SDC `content/phases/phase-1/lessons/lesson-4-cac-khai-niem-quan-trong.mdx`; Đối chiếu DTS `latency-throughput` (một phần), `cap` (một phần); Ưu tiên P1, batch 1.

#### S1-07 — Hàng đợi, Little's Law và tail latency ★

- Mục tiêu học: Hiểu W = S/(1−ρ) dựng đứng khi ρ > 0,8; dùng Little's Law (L = λW); thấy fan-out làm p99 của backend thành p50 của trang.
- Mô hình/scene: `isometric` + Capacity view; thêm scene fan-out 100 backend.
- Kịch bản mô phỏng (live): Ramp ρ 0,3 → 0,97 và quan sát W. Kịch bản fan-out: 100 backend, mỗi backend p99 = 1%: xác suất request chậm là 1 − 0,99^100 ≈ 63%. Núm: số server, độ trễ nền.
- Bài tập: predict, estimate, tune-to-limit.
- Đối chiếu DTS `latency-throughput`; Ưu tiên P1, batch 1.
- Ghi chú: Phần mình thêm (★), mở rộng nửa sau của DTS latency-throughput.

#### S1-05 — Bài tập tổng hợp Phase 1

- Mục tiêu học: Áp dụng nền tảng cho 3 đề: phân tích hệ thống có sẵn, phác thảo URL shortener, trade-off tải avatar.
- Mô hình/scene: `isometric`: bản nháp URL shortener (client → LB → app → DB).
- Kịch bản mô phỏng (live): Bản nháp chạy 2.000 RPS read-heavy; người học chỉ ra điểm nghẽn rồi sửa trong ngân sách.
- Bài tập: fix-challenge, design-constraint.
- Nguồn SDC `content/phases/phase-1/lessons/lesson-5-bai-tap-tong-hop.mdx`; Đối chiếu DTS `design-url-shortener` (một phần); Ưu tiên P2, batch 3.
- Ghi chú: Bài chốt Phase 1. Dùng công cụ của S0-05 và S0-07.

### Phase 2 — Thành phần cốt lõi

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S2-01 | Load Balancing: thuật toán, health check, Layer 4 và Layer 7 | `p2/l1` load-balancing | `load-balancing` | live | predict, spot-bottleneck, fix-challenge | P1 | 4 | todo |
| S2-06 | Stateless services và nơi lưu session | — | `stateless` | sự kiện | predict, fix-challenge | P2 | 4 | todo |
| S2-02 | Caching: hit ratio, TTL, invalidation, stampede | `p2/l2` caching | `caching` | live | predict, tune-to-limit, fix-challenge | P1 | 4 | todo |
| S2-04 | Message Queues và xử lý bất đồng bộ | `p2/l4` message-queues-async-process… | `queues`, `pubsub` (một phần) | live | predict, tune-to-limit, timeline-read | P1 | 4 | todo |
| S2-11 | Pub/Sub, event và outbox | — | `pubsub` | sự kiện | predict, postmortem | P2 | 4 | todo |
| S2-07 | SQL, document và key-value: chọn loại lưu trữ | — | `sql-nosql` | — | design-constraint | P2 | 5 | todo |
| S2-03 | Database Scaling: vertical, replica, sharding | `p2/l3` database | `replication` (một phần), `sharding` (một phần) | live | tune-to-limit, design-constraint | P1 | 5 | todo |
| S2-08 | Replication: replication lag, read-your-writes, failover | — | `replication` | live | timeline-read, predict, postmortem | P1 | 5 | todo |
| S2-09 | Sharding, shard key và hot key | — | `sharding` | live | spot-bottleneck, tune-to-limit, predict | P1 | 5 | todo |
| S2-10 | Consistent Hashing và virtual node | — | `consistent-hashing` | live | predict, estimate | P1 | 5 | todo |
| S2-12 | Files và media: object storage, presigned URL, CDN | — | `files` | sự kiện | predict, estimate | P2 | 10 | todo |
| S2-05 | Integration và trade-off: ghép các thành phần | `p2/l5` integration-trade-off-thinki… | — | live | design-constraint, fix-challenge | P2 | 10 | todo |

#### S2-01 — Load Balancing: thuật toán, health check, Layer 4 và Layer 7

- Mục tiêu học: Chọn thuật toán phân phối, hiểu health check, active-standby cho chính LB, định tuyến theo path.
- Mô hình/scene: `isometric`: client → LB (+ standby) → 3 app.
- Kịch bản mô phỏng (live): Steady 600 RPS. Bật request nặng: Round Robin làm server B nghẽn; đổi sang Least Connections khi đang chạy. Kill server C (health check loại khỏi pool); kill LB (SPOF) rồi bật standby.
- Bài tập: predict, spot-bottleneck, fix-challenge.
- Nguồn SDC `content/phases/phase-2/lessons/lesson-1-load-balancing.mdx`; Đối chiếu DTS `load-balancing`; Ưu tiên P1, batch 4.

#### S2-06 — Stateless services và nơi lưu session

- Mục tiêu học: Hiểu vì sao request kế tiếp phải chạy được trên bất kỳ server nào; đưa state ra ngoài (session store, token, object storage).
- Mô hình/scene: `isometric`: LB → 3 app + session store + object storage.
- Kịch bản mô phỏng (sự kiện): Sticky session: server A chết thì session và giỏ hàng mất, người dùng đăng nhập lại. Chuyển state ra session store: mất server không ảnh hưởng. Ca file lưu trên đĩa cục bộ.
- Bài tập: predict, fix-challenge.
- Đối chiếu DTS `stateless`; Ưu tiên P2, batch 4.
- Ghi chú: Chủ đề chỉ DTS có.

#### S2-02 — Caching: hit ratio, TTL, invalidation, stampede

- Mục tiêu học: Đo lợi ích cache bằng hit ratio; chọn TTL và invalidation; hiểu thundering herd và cách dập.
- Mô hình/scene: `isometric`: app → cache → DB + panel hit ratio.
- Kịch bản mô phỏng (live): Ramp 1.000 → 5.000 RPS, kéo hit ratio 0% → 90%: ρ của DB giảm tương ứng (λ vào DB còn 10%). Ca stampede: TTL đồng loạt hết hạn lúc t = 60 s, DB ρ = 1, lỗi tăng; bật jitter và singleflight để dập.
- Bài tập: predict, tune-to-limit, fix-challenge.
- Nguồn SDC `content/phases/phase-2/lessons/lesson-2-caching.mdx`; Đối chiếu DTS `caching`; Ưu tiên P1, batch 4.

#### S2-04 — Message Queues và xử lý bất đồng bộ

- Mục tiêu học: Dùng queue để trả lời sớm; hiểu delivery guarantee, ack, DLQ, thứ tự theo key.
- Mô hình/scene: `isometric`: API → queue → workers (+ DLQ).
- Kịch bản mô phỏng (live): Spike ×10: backlog tăng nhưng response API không đổi; thêm worker để xả. Worker chết giữa chừng: không ack thì job mất, có ack thì redeliver. Poison message chuyển sang DLQ sau 3 lần.
- Bài tập: predict, tune-to-limit, timeline-read.
- Nguồn SDC `content/phases/phase-2/lessons/lesson-4-message-queues-async-processing-decoupling-services.mdx`; Đối chiếu DTS `queues`, `pubsub` (một phần); Ưu tiên P1, batch 4.

#### S2-11 — Pub/Sub, event và outbox

- Mục tiêu học: Phân biệt queue với topic; tách coupling giữa checkout và các dịch vụ phụ; xử lý "đã lưu nhưng chưa phát event" bằng outbox.
- Mô hình/scene: `isometric`: order service → event bus → nhiều subscriber (+ outbox).
- Kịch bản mô phỏng (sự kiện): Email service chết: gọi sync làm checkout lỗi; chuyển sang publish thì checkout không ảnh hưởng. Ca crash giữa lúc lưu và phát event: outbox không để mất event.
- Bài tập: predict, postmortem.
- Đối chiếu DTS `pubsub`; Ưu tiên P2, batch 4.
- Ghi chú: Chủ đề chỉ DTS có (SDC S2-04 chỉ chạm qua).

#### S2-07 — SQL, document và key-value: chọn loại lưu trữ

- Mục tiêu học: Biết mỗi loại store giỏi gì và đánh đổi gì; dùng nhiều loại cho đúng việc (polyglot persistence).
- Mô hình/scene: `memory-2d`: cùng một đơn hàng biểu diễn ở 3 mô hình dữ liệu; `isometric`: một app, ba store.
- Mô phỏng: Không cần live-sim. Bảng so sánh + bài chọn store theo yêu cầu (giao dịch, schema linh hoạt, tra cứu theo key, tìm kiếm).
- Bài tập: design-constraint.
- Đối chiếu DTS `sql-nosql`; Ưu tiên P2, batch 5.
- Ghi chú: Chủ đề chỉ DTS có.

#### S2-03 — Database Scaling: vertical, replica, sharding

- Mục tiêu học: Nắm thang scale của DB và dấu hiệu khi nào chuyển bậc; đây là bài tổng quan, cơ chế chi tiết ở S2-08..S2-10.
- Mô hình/scene: `isometric`: app → DB, ba biến thể (vertical, + replica, + shard).
- Kịch bản mô phỏng (live): Ramp 500 → 8.000 RPS. So sánh A/B ba nhánh trên cùng tải: ρ của DB, p99 và chi phí.
- Bài tập: tune-to-limit, design-constraint.
- Nguồn SDC `content/phases/phase-2/lessons/lesson-3-database.mdx`; Đối chiếu DTS `replication` (một phần), `sharding` (một phần); Ưu tiên P1, batch 5.

#### S2-08 — Replication: replication lag, read-your-writes, failover

- Mục tiêu học: Hiểu leader/follower, vì sao follower lệch, cách đảm bảo đọc được bản vừa ghi, và quy trình promote follower.
- Mô hình/scene: `isometric` + Time view (2 làn thời gian leader/follower).
- Kịch bản mô phỏng (live): Tải ghi tăng làm lag tích lũy (đến khoảng 800 ms): đọc ở follower trả dữ liệu cũ; định tuyến đọc về leader 5 s sau khi ghi. Leader chết: failover, follower lên leader. Ca migration xóa cột lan sang mọi replica.
- Bài tập: timeline-read, predict, postmortem.
- Đối chiếu DTS `replication`; Ưu tiên P1, batch 5.
- Ghi chú: Chủ đề chỉ DTS có; SDC S2-03 chỉ chạm phần read replica.

#### S2-09 — Sharding, shard key và hot key

- Mục tiêu học: Chọn shard key; thấy range gây hot spot, hash cân bằng nhưng gây truy vấn xuyên shard; xử lý hot key.
- Mô hình/scene: `isometric` + Data view: shard map, heatmap theo shard.
- Kịch bản mô phỏng (live): Shard theo range: shard cuối nhận 78% ghi. Đổi sang hash: 25% mỗi shard. Ca celebrity (Zipf): một key chiếm 70% truy cập, xử lý bằng cache hoặc tách key. Thêm shard theo mod N làm dời khoảng 80% hàng.
- Bài tập: spot-bottleneck, tune-to-limit, predict.
- Đối chiếu DTS `sharding`; Ưu tiên P1, batch 5.
- Ghi chú: Chủ đề chỉ DTS có; SDC chạm ở S2-03 và S4-04.

#### S2-10 — Consistent Hashing và virtual node

- Mục tiêu học: Hiểu vì sao hash mod N dời gần như toàn bộ key khi N đổi, còn vòng băm chỉ dời khoảng 1/N; virtual node cân bằng tải.
- Mô hình/scene: Data view: hash ring tương tác.
- Kịch bản mô phỏng (live): Thêm/bỏ node trên cụm cache: mod N dời khoảng 100% key (miss spike, DB ρ vọt), ring dời khoảng 1/N. Bật virtual node: phần chia giữa các node đều lại.
- Bài tập: predict, estimate.
- Đối chiếu DTS `consistent-hashing`; Ưu tiên P1, batch 5.
- Ghi chú: Chủ đề chỉ DTS có.

#### S2-12 — Files và media: object storage, presigned URL, CDN

- Mục tiêu học: Không để file lớn trong DB; upload trực tiếp lên storage, upload nhiều phần, xử lý nền, lifecycle cho chi phí.
- Mô hình/scene: `isometric`: client → app → object storage → CDN; hàng đợi xử lý ảnh/video.
- Kịch bản mô phỏng (sự kiện): Upload 2 GB qua app server giữ thread hàng phút; chuyển sang presigned URL và multipart. Ước tính tăng trưởng storage (1 triệu ảnh/ngày × 2 MB) và chi phí sau lifecycle.
- Bài tập: predict, estimate.
- Đối chiếu DTS `files`; Ưu tiên P2, batch 10.
- Ghi chú: Chủ đề chỉ DTS có.

#### S2-05 — Integration và trade-off: ghép các thành phần

- Mục tiêu học: Ghép LB, cache, DB, queue thành kiến trúc hoàn chỉnh theo bài toán; chọn thành phần bằng khung quyết định.
- Mô hình/scene: `isometric`: blog platform và image processing service.
- Kịch bản mô phỏng (live): Chạy hai phương án cho dịch vụ xử lý ảnh (đồng bộ và qua queue + worker) cùng tải; so sánh p99, chi phí và số điểm hỏng.
- Bài tập: design-constraint, fix-challenge.
- Nguồn SDC `content/phases/phase-2/lessons/lesson-5-integration-trade-off-thinking.mdx`; Ưu tiên P2, batch 10.

### Phase 3 — Nền tảng hệ phân tán

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S3-01 | Hệ phân tán thực tế: failure model và CAP | `p3/l1` reality-of-distributed-syste… | `cap` | sự kiện | predict, design-constraint | P1 | 7 | todo |
| S3-09 | Redundancy, availability zone và failover | — | `redundancy` | sự kiện | spot-bottleneck, estimate, postmortem | P1 | 6 | todo |
| S3-02 | Consistency model: strong và eventual | `p3/l2` consistency-models-strong-an… | `cap` (một phần) | sự kiện | timeline-read, tune-to-limit | P1 | 7 | todo |
| S3-03 | Consensus và leader election (Raft) | `p3/l3` consensus-leader-election | `consensus` | sự kiện | order, predict, timeline-read | P1 | 7 | todo |
| S3-07 | Transaction và isolation level | — | `transactions` | sự kiện | predict, timeline-read, postmortem | P2 | 8 | todo |
| S3-04 | Distributed transaction: 2PC, Saga, idempotency | `p3/l4` distributed-transactions-dat… | `sagas`, `transactions` (một phần) | sự kiện | order, predict, postmortem | P2 | 8 | todo |
| S3-05 | Distributed ID và thứ tự sự kiện | `p3/l5` distributed-id-and-ordering | `unique-ids` | sự kiện | predict, estimate, fix-challenge | P2 | 7 | todo |
| S3-06 | Thời gian và thứ tự: clock drift, Lamport, vector clock | `p3/l6` time-event-ordering-clock-pr… | `cap` (một phần) | sự kiện | order, timeline-read | P2 | 7 | todo |
| S3-08 | CRDT và hợp nhất dữ liệu không cần phối hợp ★ | — | — | sự kiện | predict, timeline-read | P2 | 8 | todo |

#### S3-01 — Hệ phân tán thực tế: failure model và CAP

- Mục tiêu học: Nắm partial failure, network partition; hiểu CAP là lựa chọn khi có partition (CP hay AP).
- Mô hình/scene: `isometric`: 2 data center nối bằng link có thể cắt.
- Kịch bản mô phỏng (sự kiện): Cắt link giữa 2 vùng ở t = 30 s. Chọn CP: phía thiểu số từ chối ghi, người dùng thấy lỗi. Chọn AP: cả hai phía nhận ghi, cùng một ghế bán hai lần; link nối lại thì hợp nhất xung đột.
- Bài tập: predict, design-constraint.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-1-reality-of-distributed-systems.mdx`; Đối chiếu DTS `cap`; Ưu tiên P1, batch 7.

#### S3-09 — Redundancy, availability zone và failover

- Mục tiêu học: Tính availability của chuỗi thành phần; loại SPOF; rải qua AZ; đo RTO/RPO; tránh lỗi đồng thời bằng canary.
- Mô hình/scene: `isometric`: zone A/B, LB cặp, app, DB leader/follower.
- Kịch bản mô phỏng (sự kiện): Tắt zone A: lưu lượng sang zone B, follower lên leader. Đo thời gian khôi phục. Ca release lỗi đẩy lên mọi server cùng lúc so với canary 1% có tự động rollback.
- Bài tập: spot-bottleneck, estimate, postmortem.
- Đối chiếu DTS `redundancy`; Ưu tiên P1, batch 6.
- Ghi chú: Chủ đề chỉ DTS có.

#### S3-02 — Consistency model: strong và eventual

- Mục tiêu học: Chọn mô hình nhất quán theo tính năng; hiểu quorum (N, W, R) và read-your-writes.
- Mô hình/scene: Time view: lịch sử đọc/ghi của nhiều client.
- Kịch bản mô phỏng (sự kiện): 3 replica; núm W và R. Với W + R > N đọc luôn thấy bản mới nhất, với W = R = 1 xuất hiện stale read. Người học chỉ ra đọc nào sai trong lịch sử.
- Bài tập: timeline-read, tune-to-limit.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-2-consistency-models-strong-and-eventual-consistency.mdx`; Đối chiếu DTS `cap` (một phần); Ưu tiên P1, batch 7.

#### S3-03 — Consensus và leader election (Raft)

- Mục tiêu học: Hiểu majority quorum, term, bầu leader, commit log, split brain và fencing token.
- Mô hình/scene: `isometric`: 3–5 node có term và log; hiển thị heartbeat.
- Kịch bản mô phỏng (sự kiện): Leader mất heartbeat, node khác bầu cử trong term mới. Partition 2/3 so với 1/3: chỉ phía đa số ghi được. Leader tạm dừng 20 s rồi tỉnh dậy: fencing token chặn ghi cũ.
- Bài tập: order, predict, timeline-read.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-3-consensus-leader-election.mdx`; Đối chiếu DTS `consensus`; Ưu tiên P1, batch 7.

#### S3-07 — Transaction và isolation level

- Mục tiêu học: Thấy lost update khi hai transaction đua nhau; dùng lock, UPDATE một câu, optimistic version, constraint; tránh giữ lock lúc gọi dịch vụ ngoài.
- Mô hình/scene: `isometric`: 2 client → DB (một dòng "ghế").
- Kịch bản mô phỏng (sự kiện): Hai transaction cùng đọc "còn 1 ghế" rồi cùng ghi. Lần lượt áp dụng FOR UPDATE, version, UNIQUE. Ca deadlock và ca giữ lock trong lúc thanh toán làm cạn connection pool.
- Bài tập: predict, timeline-read, postmortem.
- Đối chiếu DTS `transactions`; Ưu tiên P2, batch 8.
- Ghi chú: Chủ đề chỉ DTS có; SDC S3-04 chỉ nói transaction phân tán.

#### S3-04 — Distributed transaction: 2PC, Saga, idempotency

- Mục tiêu học: Hiểu vì sao ACID vỡ khi qua nhiều service; so 2PC với Saga; compensation; idempotency; timeout nghĩa là "chưa biết".
- Mô hình/scene: `isometric`: trip service → flight / hotel / car (mỗi service một DB).
- Kịch bản mô phỏng (sự kiện): Coordinator 2PC chết sau prepare: các khóa treo. Saga: mỗi bước commit cục bộ, lỗi thì chạy compensation ngược. Ca hoàn tác cũng lỗi (retry rồi escalate), ca timeout phải truy vấn trạng thái.
- Bài tập: order, predict, postmortem.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-4-distributed-transactions-data-integrity.mdx`; Đối chiếu DTS `sagas`, `transactions` (một phần); Ưu tiên P2, batch 8.

#### S3-05 — Distributed ID và thứ tự sự kiện

- Mục tiêu học: So counter tập trung, UUID, Snowflake; hiểu tradeoff giữa duy nhất, sắp xếp được và tính đoán được.
- Mô hình/scene: `isometric` + `memory-2d` (bố cục bit của Snowflake).
- Kịch bản mô phỏng (sự kiện): Hai shard có counter riêng sinh trùng id. Ticket server thành SPOF. UUID v4 làm index chèn ngẫu nhiên, UUID v7 chèn tuần tự. Đồng hồ lùi 2 s với Snowflake: máy phát phải tạm dừng.
- Bài tập: predict, estimate, fix-challenge.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-5-distributed-id-and-ordering.mdx`; Đối chiếu DTS `unique-ids`; Ưu tiên P2, batch 7.

#### S3-06 — Thời gian và thứ tự: clock drift, Lamport, vector clock

- Mục tiêu học: Hiểu vì sao đồng hồ vật lý không đủ; so physical clock, Lamport, vector clock, HLC; xác định "xảy ra trước" và đồng thời.
- Mô hình/scene: Time view: 3 process, message qua lại.
- Kịch bản mô phỏng (sự kiện): Kịch bản sự kiện cố định (không có tải): người học kéo độ lệch đồng hồ và xem Last-Write-Wins giữ nhầm bản cũ; bật Lamport và vector clock để phát hiện đồng thời.
- Bài tập: order, timeline-read.
- Nguồn SDC `content/phases/phase-3/lessons/lesson-6-time-event-ordering-clock-problem-trong-distributed-systems.mdx`; Đối chiếu DTS `cap` (một phần); Ưu tiên P2, batch 7.

#### S3-08 — CRDT và hợp nhất dữ liệu không cần phối hợp ★

- Mục tiêu học: Dùng cấu trúc dữ liệu hội tụ (G-Counter, OR-Set, LWW-Register) để hai replica ghi độc lập mà vẫn hợp nhất đúng.
- Mô hình/scene: Time view: 2–3 replica, mũi tên sync.
- Kịch bản mô phỏng (sự kiện): Hai replica cùng ghi trong lúc partition. LWW làm mất một bản cập nhật; G-Counter/OR-Set hợp nhất đầy đủ khi nối lại.
- Bài tập: predict, timeline-read.
- Ưu tiên P2, batch 8.
- Ghi chú: Phần mình thêm (★). DTS không có.

### Phase 4 — Hiệu năng và độ tin cậy

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S4-01 | Performance và scaling: bottleneck, Amdahl, vertical và horizontal | `p4/l1` performance-bottleneck-think… | `vertical-horizontal` | live | tune-to-limit, predict, fix-challenge | P1 | 6 | todo |
| S4-02 | Caching strategy: write-through, write-behind, invalidation, eviction | `p4/l2` caching-strategy-trade-consi… | `caching` (một phần) | live | predict, spot-bottleneck, fix-challenge | P2 | 9 | todo |
| S4-03 | CDN và edge computing | `p4/l3` cdn-and-edge-computing-distr… | `cdn` | live | predict, estimate | P2 | 9 | todo |
| S4-04 | Database optimization: index, query, N+1 | `p4/l4` database-scaling-optimizatio… | `indexes` | live | predict, estimate, fix-challenge | P2 | 8 | todo |
| S4-08 | Storage engine: WAL, B-tree và LSM-tree | — | `storage-engines` | live | predict, order | P2 | 8 | todo |
| S4-05 | Rate limiting và kiểm soát tải | `p4/l5` rate-limiting-and-load-contr… | `rate-limiting` | live | predict, tune-to-limit | P1 | 6 | todo |
| S4-10 | Back-pressure và load shedding ★ | — | `rate-limiting` (một phần) | live | tune-to-limit, postmortem | P1 | 6 | todo |
| S4-11 | Timeout, retry, circuit breaker và bulkhead | — | `timeouts-retries` | live | predict, fix-challenge, postmortem | P1 | 6 | todo |
| S4-06 | Xử lý bất đồng bộ: background job, retry, DLQ, idempotency | `p4/l6` asynchronous-processin-queue… | `queues` (một phần), `pubsub` (một phần) | sự kiện | predict, postmortem | P2 | 9 | todo |
| S4-09 | Cập nhật thời gian thực: polling, SSE, WebSocket | — | `realtime` | live | estimate, predict | P2 | 9 | todo |
| S4-07 | Observability: metric, log, trace, SLO | `p4/l7` monitoring-observability-per… | `observability` | live | timeline-read, spot-bottleneck, postmortem | P1 | 9 | todo |

#### S4-01 — Performance và scaling: bottleneck, Amdahl, vertical và horizontal

- Mục tiêu học: So scale up với scale out; thấy giới hạn của máy lớn nhất, SPOF, Amdahl; dùng autoscaling và hiểu độ trễ khởi động.
- Mô hình/scene: `isometric`: tầng app + DB, thêm instance.
- Kịch bản mô phỏng (live): Ramp người dùng 100 → 12.000 → 500.000: scale up chạm trần và thành SPOF; scale out; autoscaling theo diurnal tiết kiệm chi phí ban đêm. Ca flash sale: server mới cần 3 phút khởi động nên vẫn có lỗi. Ca thêm app khi DB mới là điểm nghẽn.
- Bài tập: tune-to-limit, predict, fix-challenge.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-1-performance-bottleneck-thinking.mdx`; Đối chiếu DTS `vertical-horizontal`; Ưu tiên P1, batch 6.

#### S4-02 — Caching strategy: write-through, write-behind, invalidation, eviction

- Mục tiêu học: Chọn cache-aside / write-through / write-behind; xử lý invalidation, LRU, negative caching, multi-layer.
- Mô hình/scene: `isometric` + panel hit ratio.
- Kịch bản mô phỏng (live): Giá đổi nhưng cache còn bản cũ; thêm invalidation khi ghi và TTL. Cache đầy: LRU đẩy dữ liệu nóng ra khiến hit ratio giảm. Ca id không tồn tại làm 50% đọc miss: cache "không tìm thấy" và Bloom filter.
- Bài tập: predict, spot-bottleneck, fix-challenge.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-2-caching-strategy-trade-consistency-de-lay-speed.mdx`; Đối chiếu DTS `caching` (một phần); Ưu tiên P2, batch 9.

#### S4-03 — CDN và edge computing

- Mục tiêu học: Đặt bản sao gần người dùng; điều khiển bằng cache header; invalidation bằng URL có phiên bản; origin shield.
- Mô hình/scene: `isometric`: user (London/Sydney) → edge → origin.
- Kịch bản mô phỏng (live): User ở xa: RTT cao. Thêm edge: 90% request không tới origin (9.000 → 900 RPS). Edge nguội ở lần đầu. Spike ×20 vào edge, origin gần như không đổi. Trang cá nhân dùng Cache-Control private.
- Bài tập: predict, estimate.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-3-cdn-and-edge-computing-distributed-cache-gan-user.mdx`; Đối chiếu DTS `cdn`; Ưu tiên P2, batch 9.

#### S4-04 — Database optimization: index, query, N+1

- Mục tiêu học: Hiểu B-tree index, composite index (thứ tự cột), covering index, EXPLAIN, N+1, denormalization.
- Mô hình/scene: `memory-2d`: B-tree và bảng; `isometric`: app → DB.
- Kịch bản mô phỏng (live): Query trên 50 triệu hàng: full scan so với index (số hàng đọc, p95). Thêm index làm ghi chậm hơn. Ca N+1: số query mỗi request nhân theo số phần tử.
- Bài tập: predict, estimate, fix-challenge.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-4-database-scaling-optimization.mdx`; Đối chiếu DTS `indexes`; Ưu tiên P2, batch 8.

#### S4-08 — Storage engine: WAL, B-tree và LSM-tree

- Mục tiêu học: Hiểu vì sao ghi log trước, group commit, checkpoint; so B-tree (update tại chỗ) với LSM (ghi tuần tự, compaction); row so với column.
- Mô hình/scene: `memory-2d`: memtable, SSTable, compaction; `isometric`: DB đơn giản.
- Kịch bản mô phỏng (live): Tải 200.000 ghi nhỏ/giây: B-tree nghẽn ở khoảng 40.000, LSM đạt 200.000 nhờ ghi tuần tự. Compaction gây đỉnh latency định kỳ. Crash giữa chừng: WAL phát lại.
- Bài tập: predict, order.
- Đối chiếu DTS `storage-engines`; Ưu tiên P2, batch 8.
- Ghi chú: Chủ đề chỉ DTS có.

#### S4-05 — Rate limiting và kiểm soát tải

- Mục tiêu học: Triển khai token bucket / leaky bucket; chia sẻ bộ đếm giữa nhiều gateway; header phản hồi; quota theo tenant.
- Mô hình/scene: `isometric`: client + abuser → gateway (limiter) → API.
- Kịch bản mô phỏng (live): Một script flood 5.000 RPS đẩy API lên ρ ≈ 0,99. Bật limiter 10 req/s cho client đó: API về khoảng 45%. Hai gateway cần bộ đếm dùng chung. Tải thật ×5: loại bỏ request ưu tiên thấp.
- Bài tập: predict, tune-to-limit.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-5-rate-limiting-and-load-control.mdx`; Đối chiếu DTS `rate-limiting`; Ưu tiên P1, batch 6.

#### S4-10 — Back-pressure và load shedding ★

- Mục tiêu học: Hiểu vì sao hàng đợi không giới hạn chỉ dời lỗi sang sau; dùng bounded queue, back-pressure ngược về producer, loại bỏ theo ưu tiên.
- Mô hình/scene: `isometric`: producer → queue → consumer.
- Kịch bản mô phỏng (live): Consumer chậm gấp đôi: backlog tăng vô hạn và độ trễ cuối-đến-cuối tăng mãi. Với hàng đợi giới hạn và back-pressure, producer chậm lại và hệ thống ổn định. Bật shed theo ưu tiên: request quan trọng vẫn 100%.
- Bài tập: tune-to-limit, postmortem.
- Đối chiếu DTS `rate-limiting` (một phần); Ưu tiên P1, batch 6.
- Ghi chú: Phần mình thêm (★). SDC S4-05 chỉ giới thiệu back-pressure.

#### S4-11 — Timeout, retry, circuit breaker và bulkhead

- Mục tiêu học: Đặt timeout đúng, retry có backoff + jitter + budget, mở/đóng circuit breaker, idempotency key, cô lập thread pool.
- Mô hình/scene: `isometric`: checkout → payment service.
- Kịch bản mô phỏng (live): Payment chậm: thread của checkout cạn, lỗi lan. Retry 3 lần ngay lập tức làm tải payment ×4 (retry storm). Thêm backoff + jitter + retry budget: ×1,2. Breaker closed → open → half-open. Bulkhead giữ phần còn lại của site chạy.
- Bài tập: predict, fix-challenge, postmortem.
- Đối chiếu DTS `timeouts-retries`; Ưu tiên P1, batch 6.
- Ghi chú: Chủ đề chỉ DTS có (SDC S4-05/S6-05 chạm breaker và idempotency).

#### S4-06 — Xử lý bất đồng bộ: background job, retry, DLQ, idempotency

- Mục tiêu học: Giảm latency API bằng cách hoãn việc nặng; retry chiến lược; DLQ; idempotency; mở đầu event-driven.
- Mô hình/scene: `isometric`: API → queue → worker.
- Kịch bản mô phỏng (sự kiện): Tạo đơn trùng khi worker retry không có idempotency key; thêm key để một đơn chỉ xử lý một lần. Backoff cho job lỗi, DLQ cho lỗi vĩnh viễn.
- Bài tập: predict, postmortem.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-6-asynchronous-processin-queues.mdx`; Đối chiếu DTS `queues` (một phần), `pubsub` (một phần); Ưu tiên P2, batch 9.
- Ghi chú: S2-04 giảng cơ chế queue; bài này giảng mẫu thiết kế.

#### S4-09 — Cập nhật thời gian thực: polling, SSE, WebSocket

- Mục tiêu học: Chọn polling, long polling, SSE hay WebSocket; mở rộng khi có nhiều server giữ socket; offline và presence.
- Mô hình/scene: `isometric`: device → server → pub/sub giữa các server.
- Kịch bản mô phỏng (live): 1 triệu điện thoại poll mỗi 2 s: 500.000 RPS, 95% rỗng. Long polling rồi WebSocket. Nhiều server cần pub/sub để chuyển tin đúng server giữ socket.
- Bài tập: estimate, predict.
- Đối chiếu DTS `realtime`; Ưu tiên P2, batch 9.
- Ghi chú: Chủ đề chỉ DTS có.

#### S4-07 — Observability: metric, log, trace, SLO

- Mục tiêu học: Đọc RED metrics, percentile, alert theo burn rate, trace qua nhiều service; viết post-mortem.
- Mô hình/scene: `memory-2d`: dashboard; `isometric`: nhiều service + trace waterfall.
- Kịch bản mô phỏng (live): Sự cố "checkout chậm": đọc p99 theo service, mở trace và thấy fraud API chiếm khoảng 88% thời gian. Sửa bằng timeout + cache rồi chứng minh bằng p99. Ca thay đổi cấu hình 03:10 gây lỗi, rollback lúc 03:16.
- Bài tập: timeline-read, spot-bottleneck, postmortem.
- Nguồn SDC `content/phases/phase-4/lessons/lesson-7-monitoring-observability-performance-debugging.mdx`; Đối chiếu DTS `observability`; Ưu tiên P1, batch 9.
- Ghi chú: Nền cho War-Room.

### Phase 5 — Mẫu kiến trúc thực tế

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S5-01 | Architecture Evolution: monolith đến microservices | `p5/l1` architecture-evolution-minds… | `microservices` | live | order, design-constraint | P1 | 10 | todo |
| S5-02 | Hệ thống read-heavy: URL shortener và phân phối nội dung | `p5/l2` head-heavy-systems | `design-url-shortener` | live | estimate, fix-challenge | P1 | 10 | todo |
| S5-03 | Social feed: fan-out on read, on write và hybrid | `p5/l3` social-feed-systems | `design-news-feed` | live | predict, tune-to-limit, design-constraint | P1 | 10 | todo |
| S5-04 | Service discovery và API gateway | — | `service-discovery` | sự kiện | predict, spot-bottleneck | P2 | 11 | todo |
| S5-05 | Batch và stream processing | — | `batch-stream` | live | predict, tune-to-limit | P2 | 11 | todo |
| S5-06 | Multi-region: replication xuyên vùng, failover, xung đột ★ | — | — | sự kiện | design-constraint, timeline-read, tune-to-limit | P2 | 11 | todo |

#### S5-01 — Architecture Evolution: monolith đến microservices

- Mục tiêu học: Bắt đầu đơn giản, nhận biết scale trigger, tách theo business capability, tránh distributed monolith, di chuyển bằng strangler.
- Mô hình/scene: Evolution timeline v1 → vN + `isometric`.
- Kịch bản mô phỏng (live): Một codebase cho 6 team: lỗi ở module báo cáo làm checkout ngừng hoạt động. Tách service: 6 hop mỗi trang, payments timeout làm cả trang lỗi. Ca distributed monolith. Ca strangler: gateway chuyển dần /payments/* sang service mới.
- Bài tập: order, design-constraint.
- Nguồn SDC `content/phases/phase-5/lessons/lesson-1-architecture-evolution-mindset.mdx`; Đối chiếu DTS `microservices`; Ưu tiên P1, batch 10.

#### S5-02 — Hệ thống read-heavy: URL shortener và phân phối nội dung

- Mục tiêu học: Thiết kế cho 99% đọc: cache trước, tạo mã (counter + base62), 301 so với 302, shard theo key.
- Mô hình/scene: `isometric`: client → CDN → cache → KV store.
- Kịch bản mô phỏng (live): 4.000 RPS đọc (12.000 peak) và 40 ghi/s. Cache 90% giữ DB không nghẽn. Mã băm bị va chạm; chuyển sang counter + base62; che thứ tự bằng cách xáo id.
- Bài tập: estimate, fix-challenge.
- Nguồn SDC `content/phases/phase-5/lessons/lesson-2-head-heavy-systems.mdx`; Đối chiếu DTS `design-url-shortener`; Ưu tiên P1, batch 10.
- Ghi chú: Cũng là Design Case "URL Shortener" ở M7 (không tạo module riêng).

#### S5-03 — Social feed: fan-out on read, on write và hybrid

- Mục tiêu học: Chọn thời điểm làm việc (đọc hay ghi); timeline cache lưu id; celebrity; cursor pagination; ranking.
- Mô hình/scene: `isometric`: post → queue → fan-out workers → feed cache.
- Kịch bản mô phỏng (live): Fan-out on read: 23.000 feed/s × 200 truy vấn = 4,6 triệu lookup/s làm shard bài viết quá tải. Fan-out on write giải quyết. Celebrity 50 triệu follower làm backlog; hybrid (push cho phần lớn, pull cho người nổi tiếng) đưa độ trễ đăng về khoảng 2 s.
- Bài tập: predict, tune-to-limit, design-constraint.
- Nguồn SDC `content/phases/phase-5/lessons/lesson-3-social-feed-systems.mdx`; Đối chiếu DTS `design-news-feed`; Ưu tiên P1, batch 10.
- Ghi chú: Cũng là Design Case "News Feed" ở M7.

#### S5-04 — Service discovery và API gateway

- Mục tiêu học: Dùng registry + heartbeat để tìm instance; client-side so với server-side; readiness, slow start, draining; service mesh; gateway.
- Mô hình/scene: `isometric`: orders → registry → nhiều instance payments.
- Kịch bản mô phỏng (sự kiện): Instance được thay thế: 50% lời gọi lỗi vì địa chỉ cũ. Bật registry. Instance mới nhận traffic trước khi sẵn sàng; thêm readiness + slow start. Registry 3 node vẫn trả lời khi mất 1.
- Bài tập: predict, spot-bottleneck.
- Đối chiếu DTS `service-discovery`; Ưu tiên P2, batch 11.
- Ghi chú: Chủ đề chỉ DTS có.

#### S5-05 — Batch và stream processing

- Mục tiêu học: So batch (map-shuffle-reduce) và stream (window, watermark); hot key; lag và scale theo partition; sketch cho đếm unique.
- Mô hình/scene: `isometric`: event log → batch job / stream processor → warehouse.
- Kịch bản mô phỏng (live): Một video chiếm 40% dữ liệu: một reducer chạy 3 giờ; chia hot key và dùng combiner còn 20 phút. Stream: tải ×3, processor 100%, lag 4 phút; thêm processor chia partition thì lag còn vài giây.
- Bài tập: predict, tune-to-limit.
- Đối chiếu DTS `batch-stream`; Ưu tiên P2, batch 11.
- Ghi chú: Chủ đề chỉ DTS có.

#### S5-06 — Multi-region: replication xuyên vùng, failover, xung đột ★

- Mục tiêu học: So active-passive với active-active; tính RTT liên vùng, replication lag, xung đột; chi phí; định tuyến toàn cầu.
- Mô hình/scene: `isometric`: 2–3 region + global routing; Evolution timeline.
- Kịch bản mô phỏng (sự kiện): RTT liên vùng 100 ms; ghi đồng bộ xuyên vùng làm tăng p99. Region A mất: failover sang B với lag còn lại. Partition giữa region: chọn ghi đồng bộ hay chấp nhận xung đột (nối S3-08). Cost hiển thị theo giờ.
- Bài tập: design-constraint, timeline-read, tune-to-limit.
- Ưu tiên P2, batch 11.
- Ghi chú: Phần mình thêm (★). DTS chỉ nhắc ở S3-09.

### Phase 6 — Làm chủ và vận hành

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S6-01 | Khung tư duy thiết kế: requirement, constraint, top-down | `p6/l1` system-design-thinking-frame… | `hld-lld` | — | design-constraint | P2 | 11 | todo |
| S6-02 | SNAKE Framework cho phỏng vấn system design | `p6/l2` snake-framework | `hld-lld` (một phần) | — | design-constraint | P2 | 11 | todo |
| S6-03 | Trade-off và ra quyết định kiến trúc | `p6/l3` trade-offs-and-architecture-… | `cap` (một phần) | live | design-constraint | P2 | 11 | todo |
| S6-04 | Chiến lược phỏng vấn trên hệ thống thực tế | `p6/l4` real-interview-strategy | `design-chat` (một phần) | — | design-constraint | P2 | 12 | todo |
| S6-05 | Chủ đề nâng cao: Event Sourcing, CQRS, Service Mesh, Chaos Engineering | `p6/l5` advanced-architecture-topics | — | sự kiện | predict, postmortem | P2 | 12 | todo |
| S6-06 | Tư duy kiến trúc sư: vận hành production, capacity planning | `p6/l6` architect-mindset-production… | `observability` (một phần) | live | postmortem, estimate | P1 | 12 | todo |
| S6-07 | Chi phí và capacity: cost per request, đánh đổi cost và SLO ★ | — | — | live | tune-to-limit, fix-challenge | P2 | 12 | todo |
| S6-08 | Authentication: mật khẩu, session, MFA, passkey | — | `authentication` | — | spot-bottleneck | P2 | 12 | todo |
| S6-09 | Authorization: ownership, role, quan hệ, least privilege | — | `authorization` | — | spot-bottleneck | P2 | 13 | todo |
| S6-10 | Mã hóa và quản lý secret | — | `encryption` | — | order | P2 | 13 | todo |
| S6-11 | Testing: unit, integration, contract, end-to-end | — | `testing` | — | order | P2 | 13 | todo |
| S6-12 | CI/CD và chiến lược triển khai: blue-green, canary, feature flag | — | `cicd` | sự kiện | predict, postmortem | P2 | 13 | todo |

#### S6-01 — Khung tư duy thiết kế: requirement, constraint, top-down

- Mục tiêu học: Thiết kế theo yêu cầu và ràng buộc; so top-down với bottom-up; phân biệt HLD với LLD.
- Mô hình/scene: `memory-2d`: hai mức zoom (bản đồ dịch vụ / bên trong một service).
- Mô phỏng: Không cần sim. Biến thành luồng quyết định có thể bấm: requirement → constraint → chọn hướng, lưu vào Interview Mode.
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-1-system-design-thinking-framework.mdx`; Đối chiếu DTS `hld-lld`; Ưu tiên P2, batch 11.

#### S6-02 — SNAKE Framework cho phỏng vấn system design

- Mục tiêu học: Dùng 5 chặng Scope, Numbers, API, Key components, Elaborate trong 45 phút.
- Mô hình/scene: `code-trace`: 5 chặng có đồng hồ.
- Mô phỏng: Không cần sim trong bài. Bài giới thiệu khung và cho thử một lượt mẫu; luyện đầy đủ ở Interview Mode (M7).
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-2-snake-framework.mdx`; Đối chiếu DTS `hld-lld` (một phần); Ưu tiên P2, batch 11.

#### S6-03 — Trade-off và ra quyết định kiến trúc

- Mục tiêu học: Bảo vệ quyết định bằng số liệu; ma trận consistency/availability/latency/cost; viết ADR.
- Mô hình/scene: Trade-off view: radar latency / throughput / consistency / availability / cost.
- Kịch bản mô phỏng (live): A/B hai kiến trúc cùng tải, kết quả đổ vào radar; người học viết ADR ngắn và lưu vào ghi chú.
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-3-trade-offs-and-architecture-decision-making.mdx`; Đối chiếu DTS `cap` (một phần); Ưu tiên P2, batch 11.

#### S6-04 — Chiến lược phỏng vấn trên hệ thống thực tế

- Mục tiêu học: Áp SNAKE vào Twitter, YouTube, WhatsApp, Google Drive; biết điểm cần đào sâu ở mỗi hệ thống.
- Mô hình/scene: `memory-2d`: bảng phân tích 4 hệ thống.
- Mô phỏng: Không cần sim. Mỗi hệ thống liên kết tới case tương ứng ở Phase 7 (chat S7-01, video S7-05) và S5-03 (feed).
- Bài tập: design-constraint.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-4-real-interview-strategy.mdx`; Đối chiếu DTS `design-chat` (một phần); Ưu tiên P2, batch 12.

#### S6-05 — Chủ đề nâng cao: Event Sourcing, CQRS, Service Mesh, Chaos Engineering

- Mục tiêu học: Hiểu khi nào dùng event sourcing và CQRS, vai trò service mesh, cách thực hành chaos engineering.
- Mô hình/scene: `isometric`: event log → projection; công cụ Chaos toolbox.
- Kịch bản mô phỏng (sự kiện): Tiêm lỗi (kill, slow, cắt link) vào một sơ đồ mẫu và quan sát blast radius. CQRS: tách đường đọc và đường ghi, đo lag giữa hai bên.
- Bài tập: predict, postmortem.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-5-advanced-architecture-topics.mdx`; Ưu tiên P2, batch 12.

#### S6-06 — Tư duy kiến trúc sư: vận hành production, capacity planning

- Mục tiêu học: Xem sự cố là điều sẽ xảy ra: post-mortem, failure mindset, capacity planning 6 tháng, migration an toàn, ADR và review.
- Mô hình/scene: `isometric` + timeline sự cố.
- Kịch bản mô phỏng (live): Chạy profile diurnal có tăng trưởng 6 tháng: xác định thời điểm cần thêm capacity. Đọc một sự cố đã ghi (timeline) và viết post-mortem có chấm.
- Bài tập: postmortem, estimate.
- Nguồn SDC `content/phases/phase-6/lessons/lesson-6-architect-mindset-production-thinking.mdx`; Đối chiếu DTS `observability` (một phần); Ưu tiên P1, batch 12.

#### S6-07 — Chi phí và capacity: cost per request, đánh đổi cost và SLO ★

- Mục tiêu học: Tính chi phí theo giờ và theo request; thấy chi phí tăng nhanh hơn lợi ích khi đẩy headroom; autoscaling và right-sizing.
- Mô hình/scene: Trade-off view với cột cost; `isometric` hai thiết kế.
- Kịch bản mô phỏng (live): Cùng tải diurnal, hai thiết kế (dư capacity và autoscaling): so cost/giờ và p99. Thử thách đạt SLO với ngân sách cho trước.
- Bài tập: tune-to-limit, fix-challenge.
- Ưu tiên P2, batch 12.
- Ghi chú: Phần mình thêm (★).

#### S6-08 — Authentication: mật khẩu, session, MFA, passkey

- Mục tiêu học: Lưu mật khẩu bằng hash chậm có salt; session và token; credential stuffing; MFA, passkey; refresh token.
- Mô hình/scene: `isometric`: browser → server → DB; packet "tấn công" mô phỏng bằng luồng.
- Mô phỏng: Không cần live-sim. Dùng isometric có packet và tương tác chọn đúng biện pháp cho từng kịch bản tấn công (stuffing, phishing, token bị đánh cắp).
- Bài tập: spot-bottleneck.
- Đối chiếu DTS `authentication`; Ưu tiên P2, batch 12.
- Ghi chú: Chủ đề chỉ DTS có.

#### S6-09 — Authorization: ownership, role, quan hệ, least privilege

- Mục tiêu học: Kiểm tra quyền ở mọi request; allow-list trường ghi; RBAC và quan hệ; confused deputy; audit log.
- Mô hình/scene: `isometric`: client → API → DB nhiều tenant.
- Mô phỏng: Không cần live-sim. Người học chỉ ra lỗ hổng trong một luồng cho trước (mass assignment, IDOR, confused deputy) và chọn cách sửa.
- Bài tập: spot-bottleneck.
- Đối chiếu DTS `authorization`; Ưu tiên P2, batch 13.
- Ghi chú: Chủ đề chỉ DTS có.

#### S6-10 — Mã hóa và quản lý secret

- Mục tiêu học: TLS, mTLS, mã hóa at-rest với KMS, rotate key, secrets manager, tokenization, end-to-end.
- Mô hình/scene: `isometric`: device → LB → app → DB → backup.
- Mô phỏng: Không cần live-sim. Bài sắp xếp trình tự handshake TLS và bài chọn nơi áp dụng mã hóa cho từng đường dữ liệu.
- Bài tập: order.
- Đối chiếu DTS `encryption`; Ưu tiên P2, batch 13.
- Ghi chú: Chủ đề chỉ DTS có.

#### S6-11 — Testing: unit, integration, contract, end-to-end

- Mục tiêu học: Đặt đúng loại test vào đúng mức (test pyramid); test double; contract test giữa team; flaky test; test tải và test lỗi.
- Mô hình/scene: `code-trace` + `memory-2d` (test pyramid); `isometric` cho integration.
- Mô phỏng: Không cần sim. Bài xếp loại test theo tốc độ và độ tin cậy; trace một lỗi làm tròn qua các mức test.
- Bài tập: order.
- Đối chiếu DTS `testing`; Ưu tiên P2, batch 13.
- Ghi chú: Chủ đề chỉ DTS có.

#### S6-12 — CI/CD và chiến lược triển khai: blue-green, canary, feature flag

- Mục tiêu học: Pipeline build một lần, promote artifact; blue-green, canary; migration expand-migrate-contract; feature flag; đo DORA.
- Mô hình/scene: `isometric`: repo → CI → registry → staging → production.
- Kịch bản mô phỏng (sự kiện): Canary 5% → 25% → 100% với phiên bản lỗi: so error rate với bản cũ và rollback tự động. Ca đổi tên cột một bước làm bản cũ lỗi giữa lúc rollout.
- Bài tập: predict, postmortem.
- Đối chiếu DTS `cicd`; Ưu tiên P2, batch 13.
- Ghi chú: Chủ đề chỉ DTS có.

### Phase 7 — Case studies

Case studies. Không có nguồn SDC; kiến thức dựng từ các phase trước. URL Shortener là S5-02 và News Feed là S5-03 (đã có bài riêng), chỉ xuất hiện thêm ở tab Design Cases (M7) với khung SNAKE và Evolution timeline, không tạo module trùng.

| Id | Tiêu đề | SDC | DTS | Sim | Bài tập | Ưu | Batch | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| S7-01 | Case: Chat system | — | `design-chat` | live | design-constraint, postmortem, tune-to-limit | P2 | 14 | todo |
| S7-02 | Case: Rate limiter phân tán ★ | — | — | live | design-constraint, fix-challenge | P2 | 14 | todo |
| S7-03 | Case: Hệ thống thông báo (notification) ★ | — | — | live | design-constraint, postmortem | P2 | 14 | todo |
| S7-04 | Case: Ride-hailing và tìm kiếm theo vị trí ★ | — | — | live | estimate, spot-bottleneck, design-constraint | P2 | 14 | todo |
| S7-05 | Case: Video streaming ★ | — | — | live | estimate, tune-to-limit | P2 | 15 | todo |
| S7-06 | Case: Hệ thống thanh toán ★ | — | — | sự kiện | postmortem, design-constraint | P2 | 15 | todo |
| S7-07 | Case: Autocomplete (typeahead) ★ | — | — | live | estimate, fix-challenge | P2 | 15 | todo |

#### S7-01 — Case: Chat system

- Mục tiêu học: Thiết kế chat với 20 triệu kết nối: gateway giữ socket, session registry, message store theo conversation, offline và receipt.
- Mô hình/scene: `isometric`: device → gateways → chat service → message store; registry.
- Kịch bản mô phỏng (live): 23.000 tin/giây, 20 triệu kết nối. Một gateway chết làm rớt 200.000 socket: reconnect storm; bật backoff + jitter. Người nhận ngoại tuyến: lưu trước, push, sync theo số thứ tự.
- Bài tập: design-constraint, postmortem, tune-to-limit.
- Đối chiếu DTS `design-chat`; Ưu tiên P2, batch 14.

#### S7-02 — Case: Rate limiter phân tán ★

- Mục tiêu học: Thiết kế rate limiter dùng chung nhiều gateway: thuật toán, nơi lưu bộ đếm, độ chính xác so với độ trễ.
- Mô hình/scene: `isometric`: gateways → counter store → API.
- Kịch bản mô phỏng (live): So bộ đếm cục bộ (lệch ngưỡng) với bộ đếm tập trung (thêm 1 hop, SPOF); thử sliding window và token bucket dưới burst.
- Bài tập: design-constraint, fix-challenge.
- Ưu tiên P2, batch 14.

#### S7-03 — Case: Hệ thống thông báo (notification) ★

- Mục tiêu học: Thiết kế gửi push/email/SMS: hàng đợi theo ưu tiên, fan-out, retry, giới hạn của nhà cung cấp, chống gửi trùng.
- Mô hình/scene: `isometric`: event → queue → workers → providers.
- Kịch bản mô phỏng (live): Chiến dịch 10 triệu thông báo chặn hàng đợi của thông báo giao dịch; tách queue theo ưu tiên. Provider chậm: retry có jitter, circuit breaker.
- Bài tập: design-constraint, postmortem.
- Ưu tiên P2, batch 14.

#### S7-04 — Case: Ride-hailing và tìm kiếm theo vị trí ★

- Mục tiêu học: Lập chỉ mục vị trí bằng geohash/quadtree; khối lượng ghi cập nhật vị trí; ghép tài xế; hot cell.
- Mô hình/scene: `memory-2d` (lưới geohash, quadtree) + `isometric`.
- Kịch bản mô phỏng (live): 1 triệu tài xế gửi vị trí mỗi 4 s = 250.000 ghi/giây; shard theo geohash. Hot cell ở sân bay làm một shard quá tải; chia nhỏ ô.
- Bài tập: estimate, spot-bottleneck, design-constraint.
- Ưu tiên P2, batch 14.

#### S7-05 — Case: Video streaming ★

- Mục tiêu học: Upload, transcode theo hàng đợi, nhiều chất lượng, phân phối qua CDN, adaptive bitrate; chi phí storage và egress.
- Mô hình/scene: `isometric`: upload → queue → transcode workers → object storage → CDN.
- Kịch bản mô phỏng (live): Spike upload làm backlog transcode; thêm worker. Video viral: CDN hit ratio quyết định tải origin. Cost theo giờ.
- Bài tập: estimate, tune-to-limit.
- Ưu tiên P2, batch 15.

#### S7-06 — Case: Hệ thống thanh toán ★

- Mục tiêu học: Idempotency, ledger bất biến, saga/outbox, reconciliation; xử lý timeout "chưa biết kết quả".
- Mô hình/scene: `isometric`: checkout → payment service → provider; ledger DB.
- Kịch bản mô phỏng (sự kiện): Timeout từ provider rồi client retry: không có idempotency key thì tính tiền hai lần; có key thì trả kết quả cũ. Kết quả đối soát phát hiện giao dịch lệch.
- Bài tập: postmortem, design-constraint.
- Ưu tiên P2, batch 15.

#### S7-07 — Case: Autocomplete (typeahead) ★

- Mục tiêu học: Truy vấn tiền tố nhanh: trie hoặc prefix cache, xếp hạng offline, cập nhật chậm; hit ratio và độ trễ dưới 100 ms.
- Mô hình/scene: `memory-2d` (trie) + `isometric`.
- Kịch bản mô phỏng (live): 50.000 QPS truy vấn tiền tố; cache theo tiền tố 1–3 ký tự giữ hit ratio cao; tác vụ xây lại chỉ mục chạy nền và đẩy dữ liệu mới sau độ trễ.
- Bài tập: estimate, fix-challenge.
- Ưu tiên P2, batch 15.

## 5. Đối chiếu 40 chủ đề DTS

Mỗi chủ đề DTS có ít nhất một bài "chính" (phủ trọn), có thể kèm bài "một phần". Đây là kết quả xét từng chủ đề DTS với heading của 40 bài SDC.

| Chương DTS | Chủ đề DTS | Bài chính | Bài phủ một phần |
|---|---|---|---|
| 01 Foundations | `request-lifecycle` How a Request Travels | S1-06 | S1-01, S1-03 |
|  | `latency-throughput` Latency & Throughput | S1-07 | S1-03, S1-04 |
|  | `napkin-math` Napkin Math | S0-05 | — |
| 02 Scaling | `vertical-horizontal` Vertical vs Horizontal Scaling | S4-01 | — |
|  | `load-balancing` Load Balancing | S2-01 | — |
|  | `stateless` Stateless Services | S2-06 | — |
|  | `caching` Caching | S2-02 | S4-02 |
|  | `cdn` Content Delivery | S4-03 | — |
| 03 Data & Storage | `sql-nosql` SQL vs NoSQL | S2-07 | — |
|  | `indexes` Indexes | S4-04 | — |
|  | `storage-engines` Storage Engines | S4-08 | — |
|  | `replication` Replication | S2-08 | S2-03 |
|  | `sharding` Sharding | S2-09 | S2-03 |
|  | `consistent-hashing` Consistent Hashing | S2-10 | — |
|  | `unique-ids` Unique IDs at Scale | S3-05 | — |
|  | `cap` CAP & Consistency | S3-01 | S1-04, S3-02, S3-06, S6-03 |
|  | `consensus` Consensus & Leader Election | S3-03 | — |
|  | `transactions` Transactions & Isolation | S3-07 | S3-04 |
|  | `files` Files & Media | S2-12 | — |
| 04 Communication | `apis` REST, RPC & GraphQL | S1-08 | — |
|  | `queues` Message Queues | S2-04 | S1-02, S4-06 |
|  | `pubsub` Pub/Sub & Events | S2-11 | S1-02, S2-04, S4-06 |
|  | `realtime` Real-time Updates | S4-09 | — |
| 05 Reliability | `redundancy` Redundancy & Failover | S3-09 | — |
|  | `rate-limiting` Rate Limiting | S4-05 | S4-10 |
|  | `timeouts-retries` Timeouts & Retries | S4-11 | — |
|  | `observability` Observability | S4-07 | S6-06 |
| 06 Architecture | `microservices` Monolith vs Microservices | S5-01 | — |
|  | `service-discovery` Service Discovery & Gateways | S5-04 | — |
|  | `sagas` Sagas & Distributed Transactions | S3-04 | — |
|  | `batch-stream` Batch & Stream Processing | S5-05 | — |
| 07 Security | `authentication` Authentication | S6-08 | — |
|  | `authorization` Authorization | S6-09 | — |
|  | `encryption` Encryption & Secrets | S6-10 | — |
| 08 Shipping | `testing` Testing | S6-11 | — |
|  | `cicd` CI/CD & Deployments | S6-12 | — |
| 09 Whole Systems | `hld-lld` HLD & LLD | S6-01 | S6-02 |
|  | `design-url-shortener` Design a URL Shortener | S5-02 | S1-05 |
|  | `design-news-feed` Design a News Feed | S5-03 | — |
|  | `design-chat` Design a Chat System | S7-01 | S6-04 |

Cách xét: nếu heading SDC có nội dung tương ứng (ví dụ `S2-01` phủ load-balancing, `S3-03` phủ consensus) thì ghi bài đó là bài chính. Nếu SDC chỉ nhắc ngắn (ví dụ replication trong `S2-03`, transaction trong `S3-04`) thì ghi "một phần" và thêm bài bổ sung để phủ cơ chế đầy đủ.

## 6. Thứ tự triển khai M6 (nhân rộng nội dung)

Điều kiện bắt đầu: M5 xong (bài mẫu `S1-03` đã duyệt). Mỗi batch 4–6 bài, mỗi bài một task; batch chạy theo thứ tự dưới đây, bài trong cùng batch chạy song song bằng worktree. Cập nhật cột Trạng thái của file này sau mỗi batch.

Nguyên tắc sắp thứ tự: (1) dùng lại engine và scene của bài mẫu trước; (2) bài cần primitive mới đi cùng nhóm với các bài dùng chính primitive đó, để engine được mở rộng một lần và kiểm bằng test bất biến; (3) bài thuần công cụ tư duy (Phase 0) đặt sau khi giao diện sim đã ổn định; (4) case studies đi sau cùng vì cần đủ primitive và tab M7.

| Batch | Nội dung | Bài | Lý do |
|---|---|---|---|
| M5 | Bài mẫu | S1-03 | Cổng duyệt của người dùng trước khi nhân rộng |
| 1 | Phase 1 nền định lượng + queueing | S1-07, S1-04, S1-01, S1-02, S1-06 (5) | Dùng lại ngay scene, tracer và primitive của bài mẫu S1-03 (ρ, hàng đợi, latency M/M/c); mở rộng sang Little's Law và fan-out, nên engine chỉ cần thêm rất ít. |
| 2 | Phase 0 công cụ tư duy (phần 1) | S0-01, S0-02, S0-03, S0-04, S0-09 (5) | Không cần primitive mới. Xây các công cụ tương tác (Làm rõ yêu cầu, Trade-off Matrix, Ngân sách ràng buộc) và tour đọc mô phỏng; đặt sau batch 1 để S0-09 tham chiếu đúng giao diện đã ổn định. |
| 3 | Phase 0 công cụ tư duy (phần 2) + chốt Phase 1 | S0-05, S0-06, S0-07, S0-08, S1-05 (5) | Estimator và Requirements Card cần có trước S1-05; S1-05 chốt Phase 1 bằng cách dùng cả hai công cụ. |
| 4 | Phase 2: tầng stateless và bất đồng bộ | S2-01, S2-06, S2-02, S2-04, S2-11 (5) | Bổ sung primitive lb, cache (hit ratio, warm-up, stampede), queue (ack, DLQ); đây là các primitive được dùng lại ở hầu hết bài sau. |
| 5 | Phase 2: tầng dữ liệu | S2-03, S2-07, S2-08, S2-09, S2-10 (5) | Bổ sung sql/nosql, replication lag, shard, hash ring và Data view. Cần engine có replication lag và phân phối key (Zipf). |
| 6 | Độ tin cậy dưới tải | S4-11, S4-05, S4-10, S4-01, S3-09 (5) | Bổ sung timeout, retry, breaker, token bucket, back-pressure, autoscaling và failover. Gom thành một batch vì cùng dùng cơ chế vòng phản hồi (retry storm, shed). |
| 7 | Phase 3: phân tán cốt lõi | S3-01, S3-02, S3-03, S3-05, S3-06 (5) | Bổ sung partition, Time view (lịch sử nhiều client), quorum, Raft, đồng hồ lệch. Đây là engine "sự kiện" thay vì tải. |
| 8 | Phase 3 còn lại + dữ liệu nâng cao | S3-04, S3-07, S3-08, S4-04, S4-08 (5) | Dựa trên Time view và lock đã có; thêm index/B-tree/LSM trong `memory-2d`. |
| 9 | Phase 4 còn lại | S4-02, S4-03, S4-06, S4-07, S4-09 (5) | Mở rộng cache, CDN, async, observability (dashboard + trace), realtime; S4-07 đồng thời tạo nền cho War-Room. |
| 10 | Phase 1/2 còn lại + Phase 5 phần 1 | S1-08, S2-12, S2-05, S5-01, S5-02, S5-03 (6) | Các bài tích hợp: kết hợp primitive đã có (cache, queue, shard) thành kiến trúc; S5-02 và S5-03 đồng thời là Design Case. |
| 11 | Phase 5 phần 2 + Phase 6 phần 1 | S5-04, S5-05, S5-06, S6-01, S6-02, S6-03 (6) | Service discovery, batch/stream, multi-region; ba bài đầu Phase 6 dùng lại công cụ quyết định của Phase 0. |
| 12 | Phase 6 phần 2 | S6-04, S6-05, S6-06, S6-07, S6-08 (5) | Kiến trúc nâng cao, vận hành production (nối War-Room), cost, authentication. |
| 13 | Phase 6 phần 3 (bổ sung vận hành) | S6-09, S6-10, S6-11, S6-12 (4) | Bốn bài còn lại, ít cần mô phỏng; có thể chạy song song với các batch khác. |
| 14 | Phase 7 case studies (phần 1) | S7-01, S7-02, S7-03, S7-04 (4) | Tổng hợp toàn bộ primitive; làm sau khi các tab M7 (Design Cases, Canvas Lab) đã có để case dùng chung khung SNAKE. |
| 15 | Phase 7 case studies (phần 2) | S7-05, S7-06, S7-07 (3) | Ba case còn lại. |

Tổng: 15 batch, 73 bài, cộng S1-03 là 74 bài (khớp mục 2).

Đồng bộ: thứ tự này là thứ tự chính thức của M6 (ADR-013). `TASKS.md` dùng `T6.<số batch>` khớp đúng bảng trên (T6.1 = batch 1 … T6.15 = batch 15). Các điểm chặn thêm:
- Batch 4, 7, 8 và các bài sự kiện về lịch sử nhiều client/state machine (S2-06, S2-11, S3-01..S3-08, S4-06, S5-06, S7-06) cần mô phỏng sự kiện (`04-simulation-engine.md` §12): phải xong T6.0a (chốt phạm vi) trước batch 4 và T6.0b (hiện thực) trước batch tương ứng.
- Batch 14, 15 cần tab Design Cases và Canvas Lab (T7.1, T7.3).
- Công cụ hoặc góc nhìn mới (Capacity view, Trade-off Matrix, Estimator, Requirements Card, Data view, Time view, Evolution timeline) làm trong batch đầu tiên cần nó, ghi trong dòng task tương ứng.

## 7. Tab mở rộng (M7) liên quan đến chương trình

### 7.1 War-Room: kịch bản sự cố chạy trên engine

Mỗi kịch bản là một `SimScenario` có sự kiện theo thời gian, người học đọc telemetry, tìm nguyên nhân, chọn cách khắc phục rồi viết post-mortem (dạng `postmortem`). Gợi ý ban đầu (BRIEF §2.12), kèm bài nền tảng:

| # | Kịch bản | Primitive/sự kiện chính | Bài nền |
|---|---|---|---|
| 1 | Retry storm sau deploy chậm | service chậm (deploy), retry không backoff | S4-11, S6-12 |
| 2 | Cascading failure do thiếu timeout | slowdown một dependency, thread pool cạn | S4-11, S1-02 |
| 3 | Hot partition ngày sale | hot-key, phân phối Zipf trên shard | S2-09 |
| 4 | Cache stampede lúc nửa đêm | cache-expire-all, TTL đồng loạt | S2-02, S4-02 |
| 5 | Split brain khi partition | partition, hai leader | S3-03, S3-01 |
| 6 | Đơn trùng do thiếu idempotency | retry sau timeout, ghi hai lần | S4-06, S3-04, S7-06 |
| 7 | Queue backlog do consumer chậm | consumer slowdown, backlog tăng | S2-04, S4-10 |
| 8 | DNS TTL chặn failover | failover xong nhưng client vẫn cache DNS cũ | S3-09, S1-06 (cần primitive `dns` có TTL) |
| 9 | Connection pool quá nhỏ | pool bão hòa dù CPU thấp | S3-07, S1-03 |

### 7.2 Design Cases

Mỗi case là một đề thiết kế có Brief (từ S0-07), khung SNAKE (S6-02), mô hình chạy được và Evolution timeline (v1 → vN, bấm để xem diff). Danh sách ban đầu:

| Case | Bài nền / bài case | Ghi chú |
|---|---|---|
| URL Shortener | S5-02 (+ S1-05) | Case có sẵn từ SDC và DTS; không tạo module trùng |
| News Feed | S5-03 | Case có sẵn từ SDC và DTS |
| Chat system | S7-01 | DTS có |
| Rate limiter phân tán | S7-02 ★ | Nối S4-05 |
| Notification system | S7-03 ★ | Nối S2-04, S4-10 |
| Ride-hailing và geo | S7-04 ★ | Cần thêm `memory-2d` lưới/quadtree |
| Video streaming | S7-05 ★ | Nối S2-12, S4-03 |
| Payment system | S7-06 ★ | Nối S3-04, S4-11 |
| Autocomplete | S7-07 ★ | Cần scene trie |

### 7.3 Các tab khác

- **Canvas Lab:** lưới 2D vuông góc, cùng `SystemModel`; người học tự lắp từ primitive; chấm bằng grader của engine. Dùng ràng buộc từ S0-04.
- **Pattern Atlas / Glossary:** mục thuật ngữ nối `TermPopover`; mỗi mục trỏ về bài chính (ví dụ "Consistent Hashing" trỏ S2-10).
- **Interview Mode:** SNAKE 5 chặng có đồng hồ (S6-02), dùng Brief từ S0-07 và case từ 7.2.
- **Credits:** ghi nguồn SDC (từng bài có `source`) và ghi chú DTS "chỉ tham chiếu" (xem `01-sources-and-credits.md`).

## 8. Ghi chú cho người biên soạn và điểm còn mở

Đã chốt khi review M0 (2026-11-26):
- Thứ tự batch M6 theo mục 6 (ADR-013); `TASKS.md` M6 đã viết lại khớp.
- Bài "sự kiện" có hai loại: chạy được trên engine tải bằng `TimedEvent` (crash, partition, deploy…: S1-06, S2-12, S3-09, S5-04, S6-05, S6-12) và cần mô phỏng sự kiện riêng có Time view và state machine (S2-06, S2-11, S3-01..S3-08, S4-06, S5-06, S7-06). Phạm vi loại thứ hai ở `04-simulation-engine.md` §12, chốt ở T6.0a trước batch 4.
- URL Shortener và News Feed không tạo module case riêng; tab Design Cases bọc lại S5-02, S5-03 (mục 7.2).
- Giấy phép SDC: theo ADR-004, trong lúc chờ tác giả xác nhận vẫn chuyển thể theo điều kiện MIT, có ghi nguồn; nếu tác giả phản đối thì rút phần lời giảng gốc, giữ mô phỏng/bài tập (`01-sources-and-credits.md` §1.1).

Ghi chú biên soạn (giữ ranh giới để tránh lặp):
1. Trùng chủ đề trong chính SDC: caching (S2-02 và S4-02), database scaling (S2-03 và S4-04), queue (S2-04 và S4-06), CAP (S1-04 và S3-01). Cách chia: S2 giảng cơ chế, S4 giảng chiến lược/tối ưu; S1-04 chỉ giới thiệu.
2. S0-03 (SDC "Foundation Exercises") trùng nội dung với S1-01/S1-02/S1-03: giữ làm bài khởi động ngắn, không giảng lại.
3. S0-09 (cách đọc mô phỏng) đặt cuối Phase 0 vì bài mô phỏng đầu tiên thật sự là S1-03; có thể hiện thêm dạng tour ở Home, id giữ nguyên.
4. Phase 2 dài (12 bài) vì các bài bổ sung về dữ liệu (SQL/NoSQL, replication, sharding, consistent hashing, files) thuộc "Core Building Blocks".

Còn mở (người dùng quyết, không chặn M1/M2):
- Bảo mật và triển khai (S6-08..S6-12) đang nằm ở Phase 6 vì SDC không có phase tương ứng. Nếu muốn tách thành level riêng "Security & Shipping" thì id phải đổi theo quy ước `S<level>-<nn>` (ví dụ `S8-01..S8-05`) và `course.json` thêm level 8; nên quyết trước batch 12. Đề xuất: giữ ở Phase 6.
