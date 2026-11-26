# DECISIONS — Nhật ký quyết định (ADR ngắn)

Mỗi quyết định: Ngữ cảnh / Quyết định / Hệ quả. Quyết định mới thêm vào cuối với số tăng dần. Muốn đổi một quyết định: thêm ADR mới ghi rõ "thay thế ADR-xxx", không sửa lịch sử.

Trạng thái chung: tất cả ADR dưới đây có hiệu lực từ 2026-11-26.

---

## ADR-001 — Feature module riêng theo mẫu PMP
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Learning Gate có 5 app. Kube/CI-CD/Redis đi qua engine DevOps (`src/features/devops-course/`), PMP có feature riêng (`src/features/pmp-course/`) dùng lại `WpState/WpQuestion/WpCard` từ `src/features/workpath/types`. System Design cần engine mô phỏng, activities và tab riêng mà engine DevOps không có.
- **Quyết định:** Tạo `src/features/sysdesign-course/` theo mẫu PMP (types, store, data, logic, `SdLearnShell`, views), build riêng bằng `scripts/build-sysdesign.mjs`. App shell ở `src/apps/sdmastery/`. Không đi qua engine DevOps.
- **Hệ quả:** Nhân bản một phần khung (store, view quiz/flash). Đổi lại không phải sửa engine DevOps và không rủi ro hồi quy cho Kube/CI-CD/Redis. Cần slot lưu trữ riêng `sysdesign` ở 5 file db/stores (task T1.2).

## ADR-002 — Nội dung tiếng Việt trước, UI song ngữ
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Nguồn SDC bằng tiếng Việt; workbench hiện tại song ngữ ở UI, telemetry, inspector. Song ngữ toàn bộ bài học làm nhân đôi công sức biên tập.
- **Quyết định:** `lesson.md`, quiz, cards viết tiếng Việt (giữ thuật ngữ Anh theo guidelines §5). UI, telemetry và inspector hỗ trợ VI/EN ngay từ đầu. Bản EN của bài học làm ở M8 (T8.1).
- **Hệ quả:** Cấu trúc dữ liệu phải chừa chỗ cho EN (không cứng chuỗi VI trong code). Chưa quyết định dạng file EN (xem T8.1).

## ADR-003 — Thực thi bằng subagent: Sonnet làm, Opus review
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Phạm vi lớn (74 bài, engine, stage, activities). Cần tốc độ nhưng không đánh đổi độ chính xác kỹ thuật.
- **Quyết định:** Implementer (Sonnet) nhận một task trong `TASKS.md`; Reviewer (Opus) đọc diff, chạy lại lệnh kiểm tra, review đúng sai và (với nội dung) độ chính xác kỹ thuật, văn phong §5, ghi nguồn. Mỗi task một commit. Chi tiết: `08-workflow.md`.
- **Hệ quả:** Docs phải đủ cụ thể để agent mới không cần hỏi lại. Việc cần phán đoán khó (T2.1, T2.3, T3.3, T3.6, T4.4) giao Opus làm. Cần quy tắc song song/tuần tự rõ để tránh xung đột file dùng chung.

## ADR-004 — SDC là nguồn nội dung đọc (có ghi nguồn); DTS chỉ tham chiếu mô hình
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** SDC có giấy phép mâu thuẫn (README ghi MIT, không có LICENSE, footer "All rights reserved"). DTS không có giấy phép.
- **Quyết định:** Dùng nội dung SDC làm nguồn, biên tập tay, ghi nguồn ở từng bài (`source` trong `module.json`), dòng nguồn trên UI, trang Credits, giữ ghi chú MIT. Người dùng tự liên hệ tác giả; nếu tác giả phản đối thì rút nội dung gốc, giữ phần mô phỏng/bài tập của mình. DTS: chỉ ghi lại khái niệm nào dùng mô hình gì (viết bằng lời riêng ở `reference/dts-models.md`), tự dựng scene, không chép dữ liệu scene hay lời giảng. Chi tiết: `01-sources-and-credits.md`.
- **Hệ quả:** Doctor bắt buộc `source` với bài từ SDC. Bản gốc ở `content/sysdesign/_source/sdc/` chỉ đọc, không build vào app. Phải thiết kế để gỡ nội dung SDC được mà không phá phần mô phỏng/bài tập.

## ADR-005 — Live-sim: scene cố định + `SimFrame` qua kênh riêng
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Khảo sát `ScaleStageSvg.tsx`: đổi identity của `scene` sẽ reset camera và đóng inspector (1099-1105), dựng lại layout, ẩn packet khoảng 380ms. Nếu scene đổi mỗi tick (100ms) thì stage không dùng được.
- **Quyết định:** Mỗi bước `live-sim` có `scene` cố định (cấu trúc, vị trí). Trạng thái theo tick (state node, loadPct, queue, packet, throughput) đi qua một kênh frame riêng (PLAN gọi là `frameRef`/`subscribeFrame`; tên chốt ở `05-live-stage.md` §2: prop `frameSource: LiveSimSource` với `getFrame()` cho rAF và `subscribe()` cho UI), áp dụng thẳng vào DOM trong vòng rAF qua ref map. Stage chỉ nhận `LiveSimFrame` (kiểu của workbench); adapter ở feature (`sysdesign-course/live/`) đổi `SimFrame` của engine sang, nên stage không biết engine.
- **Hệ quả:** M3 sửa file dùng chung (types, `ScaleStageSvg`, `ScaleWorkbenchLayout`) nên chạy tuần tự và cần kiểm hồi quy 5 app cũ (Redis, K8s, CI/CD, PMP, Python). Kèm sửa 3 lỗi hiện có (packet x2, reset camera, `legendKinds` hook). Stage không cần đổi nếu sau này đổi engine.

## ADR-006 — Engine fluid model, tick 100ms, deterministic theo seed
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Cần mô phỏng đúng xu hướng và độ lớn (hockey-stick, retry storm, cache stampede) mà không mô phỏng từng request (tốn, khó tua).
- **Quyết định:** Mô hình dòng chảy theo tick 100ms mô phỏng: lan truyền λ → ρ=λ/(μ·c) → hàng đợi → latency xấp xỉ M/M/c → timeout/lỗi → retry. RNG có seed; cùng seed cho cùng kết quả; lưu snapshot để tua. Thuần TS, không import React. UI ghi rõ: đúng xu hướng và độ lớn, không đúng số tuyệt đối.
- **Hệ quả:** Phải có test bất biến (Little's Law, ρ→1, cache hit, retry storm, consistent hashing, seed) trước khi dùng engine cho nội dung (T2.7). Không mô phỏng được hành vi từng request cụ thể; `RequestTracer` dùng packet đại diện.

## ADR-007 — Canvas Lab dùng lưới 2D vuông góc; isometric dành cho bài học
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Isometric của stage dựa vào `composeIsometricLayout` và vị trí do scene định sẵn; không có phép chiếu world→iso để người học kéo-thả tự do.
- **Quyết định:** Bài học dùng isometric với ô trống (slot) có sẵn trong scene. Canvas Lab (tab `lab`) dùng lưới 2D vuông góc, cùng `SystemModel` và engine.
- **Hệ quả:** Hai bộ renderer. Mô hình dữ liệu dùng chung nên thiết kế ở Lab có thể đưa ngược vào bài học. Làm ở M7 (T7.1).

## ADR-008 — Bài mẫu S1-03 là cổng duyệt trước khi nhân rộng
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Phạm vi rất lớn; sai hướng trải nghiệm sẽ tốn công nhân rộng.
- **Quyết định:** M5 làm trọn một bài `S1-03 Data Flow & Bottlenecks` (đọc, scene, sim ramp tải, tracer, đoán, thử thách sửa, quiz, cards, dòng nguồn). Dừng lại để người dùng tự chạy và duyệt (T5.5). Chỉ sau khi duyệt mới bắt đầu M6 và M7.
- **Hệ quả:** M6/M7 bị chặn bởi T5.5. Mọi phản hồi từ bài mẫu có thể kéo theo sửa M2-M4.

## ADR-009 — Flashcard dùng Leitner của `WpState`, không dùng `srsRepo`
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Có hai hệ SRS: `src/db/srsRepo.ts` (chỉ Python dùng) và Leitner trong `src/features/workpath/logic.ts` (`rateCard`, `BOX_DAYS` 1/2/4/8/16, dòng 35) gắn với `WpState` mà PMP đang dùng.
- **Quyết định:** Flash của `sdmastery` dùng `rateCard` và `WpState`, lưu qua `saveDurableProgress('sysdesign', …)`.
- **Hệ quả:** Tiến độ flashcard đi theo backup/cloud sync cùng slot `sysdesign` (T1.2). Không cần schema IndexedDB mới.

## ADR-010 — Chương trình 74 bài, 8 level, id `S<level>-<nn>`
- **Ngày:** 2026-11-26 (review M0)
- **Ngữ cảnh:** BRIEF §2.10 gợi ý lộ trình ~60 bài theo 10 nhóm; PLAN dùng 7 phase SDC làm xương sống id. Cần một bảng duy nhất.
- **Quyết định:** 74 bài = 40 SDC + 22 bài bổ sung cho chủ đề DTS + 12 bài ★. Level 0–6 theo 7 phase SDC, level 7 = Case Studies. Bài SDC giữ số thứ tự bài gốc; bài bổ sung nhận số tiếp nối trong level phù hợp. Thứ tự học là `(level, order)` theo bảng của `02-curriculum.md`, không theo id. URL Shortener và News Feed không có module case riêng (dùng S5-02, S5-03).
- **Hệ quả:** `02-curriculum.md` là nguồn sự thật; `course.json` có 8 level. Đổi level của một bài là đổi id.

## ADR-011 — Kết quả activity lưu vào `WpState.exercises`
- **Ngày:** 2026-11-26 (review M0)
- **Ngữ cảnh:** Activity cần điểm tốt nhất, sao, nháp, số lần nộp; `WpState` dùng chung với mọi app và đi qua backup/cloud sync.
- **Quyết định:** Mỗi activity là một khoá `exercises[activityId]` (`ExerciseRecord`), thêm hai field tuỳ chọn `best`, `stars`; `mergeWpStates` giữ max của hai field. Không thêm field cấp `WpState`. Chi tiết `06-activities-and-grading.md` §6.
- **Hệ quả:** T4.1 sửa `src/features/workpath/types.ts` và `src/db/durableProgressStorage.ts` (file dùng chung, tuần tự với T1.2) và chạy hồi quy `course:test`.

## ADR-012 — Scene bài học viết bằng `stage.json`, không dùng curator TypeScript
- **Ngày:** 2026-11-26 (review M0)
- **Ngữ cảnh:** App cũ dựng scene bằng `*ScaleCurator.ts`. Bài live-sim cần id node/link trùng `sim.json` và scene cố định theo step, kiểm được bằng doctor.
- **Quyết định:** Mỗi module có `stage.json`; `scale/sdSceneBuilder.ts` dựng `StageScene` từ `stage.json` + `SystemModel`. Có lối thoát `raw`. Chi tiết `07-content-authoring.md` §1.1, §2.4.
- **Hệ quả:** Doctor kiểm tĩnh được id và cấu trúc; ít linh hoạt hơn helper TS.

## ADR-013 — Thứ tự M6 theo primitive của engine, không theo phase
- **Ngày:** 2026-11-26 (review M0)
- **Ngữ cảnh:** Làm theo phase 0 → 7 buộc engine mở rộng rải rác và đặt bài tư duy (Phase 0) trước khi giao diện sim ổn định.
- **Quyết định:** 15 batch theo `02-curriculum.md` §6: batch 1 dùng lại primitive của bài mẫu (S1-07, S1-04, S1-01, S1-02, S1-06); Phase 0 ở batch 2–3; case study ở batch 14–15. `TASKS.md` dùng `T6.<số batch>`. Bài cần mô phỏng sự kiện bị chặn bởi T6.0a/T6.0b (`04-simulation-engine.md` §12).
- **Hệ quả:** Mỗi batch kèm phần mở rộng engine hoặc công cụ mà nó cần, có test bất biến tương ứng.

## ADR-014 — Tác giả SDC đồng ý sử dụng
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** ADR-004 dùng nội dung SDC trong lúc chờ xác nhận giấy phép mâu thuẫn và dự phòng rút nội dung nếu tác giả phản đối.
- **Quyết định:** Tác giả SDC (Steve, `steve-bang`) đã đồng ý cho dùng nội dung; người dùng xác nhận ngày 2026-11-26. Cập nhật ADR-004 (không thay thế): vẫn ghi nguồn từng bài, có trang Credits, giữ ghi chú MIT như cam kết. Phần "rút nội dung nếu phản đối" chỉ còn là ghi chú lịch sử.
- **Hệ quả:** Việc xác nhận giấy phép không còn là việc chờ người dùng. Thiết kế truy vết (`source`, `_source/`, tách sim/bài tập khỏi `lesson.md`) giữ nguyên.

## ADR-015 — Sonnet triển khai, Opus điều phối và review; TASKS.md do điều phối viên cập nhật
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** ADR-003 chia vai Sonnet làm, Opus review; cần nói rõ hơn về phân quyền và tránh xung đột khi nhiều agent chạy song song.
- **Quyết định:** Mọi task triển khai do Sonnet thực hiện. Agent điều phối (Opus) chỉ review và kiểm soát chất lượng. Mỗi agent làm việc trong worktree riêng và **không sửa `TASKS.md`**; điều phối viên cập nhật `TASKS.md` sau khi review.
- **Hệ quả:** Không xung đột khi merge `TASKS.md`. Agent báo cáo kết quả trong báo cáo cuối; trạng thái task chỉ đổi sau review.

## ADR-016 — Theo dõi `src/data/courses/sysdesign/` trong git; builder/doctor dùng chung thư viện đọc nội dung
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** T1.4 phải quyết việc có commit file do `sd:build` sinh ra hay không. Các khoá khác (kube, cicd, pmp) commit `src/data/courses/<khoá>/*.json`.
- **Quyết định:** Theo thông lệ: `src/data/courses/sysdesign/{curriculum,sims}.json` **được theo dõi trong git**, không sửa tay, chỉ sinh bằng `npm run sd:build`; file không có dấu thời gian để kết quả build tất định (diff chỉ đổi khi nội dung đổi). `curriculum.json` chứa `lesson` (markdown thô, builder runtime tách step ở T1.1c), `quiz`, `cards`, `stage`, `activities`, `simIds`; `sims.json` là `{ sims: { <simId>: SimDoc } }`. Builder và doctor chia sẻ `scripts/lib/sysdesign-content.mjs` (đọc `content/sysdesign/`, tách step), bỏ qua `_source/`. Doctor đọc thẳng `content/`, không đọc file build. Bài bị coi là chuyển thể từ SDC (bắt buộc `source`) khi dòng của nó trong `02-curriculum.md` có cột SDC dạng `p<n>/l<n>`.
- **Hệ quả:** Mọi PR đổi nội dung phải kèm file build đã sinh lại. Phần chạy engine của doctor (rule 10, 11 đầy đủ, 12 đầy đủ) để TODO trỏ T4.6.

## ADR-017 — Màu nhận diện teal, accent UI `cyan`, tab placeholder và trang tổng quan bài
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** T1.3 cần màu cho icon và accent cho app thứ 6. Năm app cũ dùng emerald (Python), sky (Docker & K8s), violet (CI/CD), amber (PMP), rose (Redis). `iconColor` là cặp hex nên không bị ràng buộc bởi bộ accent của `CourseUi`.
- **Quyết định:** (1) `iconColor` và logo dùng teal `#14B8A6 → #0F766E`, không trùng 5 app. (2) Các view Learn dùng accent `cyan` có sẵn của `CourseBtn/CourseBar/CourseInline` và các token `--dts-blue-*` của bàn học, nên không thêm token `--dts-*` mới và không sửa `src/index.css`. (3) Tab chưa làm (`lab`, `warroom`, `cases`, `atlas`, `interview`) hiển thị `SdPlaceholder` nêu mô tả một câu và task sẽ làm; tab `credits` làm thật (T7.6 làm sớm theo khuyến nghị của TASKS). (4) Con trỏ mặc định `{moduleId:'S0-01', stepIndex:0}` trỏ tới bài chưa có; `ScaleWorkbenchLayout` tự rơi về bài đầu tiên nên không crash. (5) Thanh điều hướng dưới (`SdMobileBottomNav`) dùng container query có tên `@[680px]/app:hidden` cùng ngưỡng 680px với header thay vì breakpoint `lg:` của các app cũ (guidelines §4). (6) Click một bài ở Home/Roadmap mở `SdModuleView` (tổng quan: mục tiêu, tiến độ, nguồn, lối vào bàn học/quiz/flashcard) thay vì chuyển thẳng vào bàn học như PMP.
- **Hệ quả:** Teal và cyan cùng họ màu nhưng khác sắc độ; nếu cần thống nhất thì đổi `iconColor` và logo ở một chỗ. Mọi tab placeholder thay thế bằng component thật ở T7.x mà không đổi `SdMasteryApp`, ngoài một dòng render.

## ADR-018 — Bàn giao cho agent đơn (Gemini): tự triển khai và tự review
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Người dùng chuyển phần việc tiếp theo cho một agent khác (Gemini) làm việc một mình, không có mô hình Sonnet/Opus nhiều agent của giai đoạn M0–M3.
- **Quyết định:** Thay ADR-003 và ADR-015 kể từ commit bàn giao. Agent tiếp quản vừa triển khai vừa tự review theo checklist `08-workflow.md` §4–§5, được và phải tự cập nhật `TASKS.md`, làm tuần tự trên `feat/sdmastery`. Cột **Agent** và trạng thái `review` trong `TASKS.md` được bỏ qua. Các trường hợp phải dừng hỏi người dùng ghi ở `HANDOFF.md` §0.
- **Hệ quả:** Điểm vào duy nhất cho agent mới là `HANDOFF.md`. Các mục mô tả subagent/worktree trong `08-workflow.md` chỉ còn giá trị tham khảo.

## ADR-019 — SLO p99 của bài mẫu S1-03 dùng ngưỡng 130 ms khớp timeout 100 ms của chặng `app→cache`
- **Ngày:** 2026-11-26
- **Ngữ cảnh:** Trong mô hình S1-03, các đường nối `app1..3 → cache` có `timeoutMs = 100 ms` (để minh họa timeout ngắn bảo vệ tầng App). Khi Database quá tải sau `t ≈ 35 s`, các request Cache Miss bị cắt tại 100 ms ở `app→cache` và chuyển sang lỗi timeout (tỉ lệ lỗi tăng lên 53%), làm p99 toàn cục dừng ở `≈ 194 ms` (`t = 20 s: 64 ms`, `t = 35 s: 143 ms`, sau khi sửa `fix-cache-and-db`: `106 ms`). Nếu đặt SLO `p99 ≤ 300 ms` cho `fix-challenge` (`S1-03.A5`), cả bản gốc (`194 ms`) lẫn bẫy `trap-more-apps` (`159 ms`) đều đạt điều kiện p99 và chỉ trượt ở điều kiện tỉ lệ lỗi.
- **Quyết định:** Giữ nguyên cách tính `metrics.latency` của engine (để bảo toàn toàn bộ 60 bài test bất biến `sim.test.ts`, `sim2.test.ts` và số liệu đã biên soạn trong `lesson.md` của S1-03), và đặt ngưỡng SLO độ trễ của bài tập `S1-03.A5` (`fix-challenge`) cùng đường SLO trên timeline `stage.json` của S1-03 ở mức **`p99 ≤ 130 ms`** (kèm `err ≤ 1%`). Riêng bài tập `S1-03.A3` (`tune-to-limit` `max-load` trên cửa sổ `[20, 40]`) giữ `p99 ≤ 300 ms` và `err ≤ 1%` theo tiêu chí nghiệm thu T4.3 (`2950 ⇒ 100`, `2000 ⇒ 40`, `4000 ⇒ 0`).
- **Hệ quả:** Ở `S1-03.A5`, kịch bản gốc (`p99 = 194 ms`, `err = 42,1%`) và bẫy nhân đôi App (`p99 = 159 ms`, `err = 42,1%`) đều vi phạm **cả hai** ràng buộc `p99` và `err`; lời giải `fix-cache-and-db` (`p99 = 106 ms ≤ 130 ms`, `err = 0%`) đạt cả hai và khớp trực tiếp với mốc `t ≈ 35 s (p99 ≈ 143 ms)` trong bài giảng.

## ADR-020 — Engine sự kiện rời rạc `sim/timeline/`, phạm vi Raft và vị trí nhóm bài Security/Shipping

- **Bối cảnh:** `04-simulation-engine.md` §12 và `02-curriculum.md` §8 để mở 3 quyết định trước M6/M7: (1) dùng engine rời rạc `sim/timeline/` hay chỉ khai báo `HistoryOp[]` tĩnh cho 13 bài sự kiện loại B (`S2-06`, `S2-11`, `S3-01..S3-08`, `S4-06`, `S5-06`, `S7-06`); (2) phạm vi mô phỏng Raft ở `S3-03` và vị trí hiển thị Time view; (3) giữ `S6-08..S6-12` (Security & Shipping) ở Level 6 hay tách Level riêng; đồng thời `04 §11 #3` hỏi có cần Web Worker cho fluid engine không.
- **Quyết định:**
  1. Hiện thực `src/features/sysdesign-course/sim/timeline/` thuần TypeScript (hàng đợi ưu tiên theo ms ảo, `mulberry32`, không React/DOM), cung cấp đầy đủ `DiscreteEventWorld`, đồng hồ vật lý lệch / `LamportClock` / `VectorClock`, `simulateQuorumScenario` (`N/W/R`, `CP/AP`, `stickyReadAfterWrite`, `readRepair`), `simulateRaftScenario`, `simulate2pcScenario`, `simulateSagaScenario` (`useIdempotencyKey`), `simulateConcurrencyControl` (`none | optimistic | pessimistic`), bộ `GCounter / PNCounter / LWWRegister / ORSet` và các checker (`findStaleReads`, `findRywViolations`, `findNonMonotonicReads`, `findLostUpdates`, `findDoubleCharges`).
  2. Phạm vi Raft trong `S3-03` giới hạn ở **bầu cử Leader (`term`, heartbeat timeout, đa số phiếu), ghi log theo quorum và `fencingToken`** chặn leader cũ (zombie); không cài log compaction hay thay đổi membership. Time view trong bài học hiển thị qua `memory-2d` (`tape` / `refs`) và hoạt động `timeline-read` ngay trong luồng bài học, giữ nguyên một sân khấu duy nhất của `ScaleWorkbenchLayout`.
  3. Giữ `S6-08..S6-12` trong Level 6 theo đúng bảng `02-curriculum.md` hiện hành.
  4. Không tách Web Worker cho fluid engine: benchmark thực tế 30 node / 49 link chỉ mất trung vị ~0,10 ms/tick (< 1% ngân sách khung hình 16 ms), chạy trực tiếp trên main thread giúp thanh tua và tương tác đồng bộ tức thì.
- **Hệ quả:** `sd:doctor` và bài học loại B dùng chung một nguồn chân lý tất định cho lịch sử thao tác phân tán; `LinkSpec.cancelOnTimeout` đồng thời được bổ sung cho kịch bản War-Room #8 mà không làm thay đổi hành vi mặc định (`false`) của các mô hình hiện có.
