# TASKS — Bảng việc System Design Mastery (`sdmastery`)

> Cập nhật: 2026-11-26. Nguồn: [`_brief/PLAN.md`](./_brief/PLAN.md). Quy trình giao việc: [`08-workflow.md`](./08-workflow.md). Quyết định đã chốt: [`DECISIONS.md`](./DECISIONS.md).

## Cách dùng file này

**Trạng thái**

| Giá trị | Ý nghĩa |
|---|---|
| `todo` | Chưa bắt đầu. |
| `doing` | Implementer đang làm. Chỉ ghi `doing` khi thật sự đã nhận việc. |
| `review` | Implementer đã xong, đã chạy lệnh kiểm tra, đang chờ Reviewer (Opus). |
| `done` | Reviewer đã duyệt và commit đã nằm trên `feat/sdmastery`. |
| `blocked` | Chờ việc khác hoặc chờ quyết định. Ghi lý do ở cột Ghi chú/Nghiệm thu. |

**Quy tắc cập nhật**
1. Implementer: đổi `todo` → `doing` khi nhận; đổi → `review` khi xong và các lệnh kiểm tra đã xanh. Ghi commit hash ngắn vào cuối dòng nếu có.
2. Reviewer: đổi → `done` khi đạt, hoặc trả về `doing` kèm danh sách sửa (thêm dòng dưới bảng, mục "Ghi chú review").
3. Mỗi task = 1 commit trên `feat/sdmastery` (xem `08-workflow.md` §8). Commit chứa luôn thay đổi của TASKS.md.
4. Cột **Song song với** cho biết task có thể chạy cùng lúc (worktree riêng) vì không chạm chung file. Nếu cột trống hoặc ghi "—" thì chạy tuần tự.
5. Cột **Agent**: theo ADR-015 (2026-11-26) **mọi task triển khai do Sonnet làm**, kể cả các dòng còn ghi `Opus`; điều phối viên (Opus) review, kiểm soát chất lượng, merge và cập nhật file này.
6. Phụ thuộc cấp milestone: **M0** → (**M1** ∥ **M2**) → **M3** (cần T2.1) → **M4** → **M5 (cổng duyệt)** → (**M6** ∥ **M7**) → **M8**.

Số dòng trong cột "File chạm chính" lấy từ BRIEF §4 và đã đối chiếu code tại 2026-11-26 (commit `7bf4997`). Kiểm tra lại trước khi sửa (xem `03-architecture.md` §5). File dùng chung (chạy tuần tự) liệt kê ở `08-workflow.md` §6.

---

## M0 — Bộ tài liệu

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T0.0 | Tiền điều kiện của người dùng: commit thay đổi dở ở `scale-workbench/`, tạo branch | — | Người dùng | git | Branch `feat/sdmastery` tồn tại; không còn thay đổi dở ở `MemoryStageSvg`, `ScaleStageSvg`, `ScaleWorkbenchLayout`, `index.css`, `useWorkbenchStore` | — | done |
| T0.1 | Viết `README.md`, `00-vision.md`, `01-sources-and-credits.md`, `03-architecture.md`, `08-workflow.md`, `TASKS.md`, `DECISIONS.md` | T0.0 | Sonnet | `docs/sysdesign/` (các file trên) | Đủ 7 file; đường dẫn/lệnh/số dòng khớp code; không có từ cấm ở guidelines §5 | T0.2, T0.3, T0.4 | done |
| T0.2 | Viết `02-curriculum.md` (bảng tổng duy nhất) và `reference/dts-models.md` (thẻ đối chiếu 40 bài DTS) | T0.0 | Sonnet | `docs/sysdesign/02-curriculum.md`, `docs/sysdesign/reference/dts-models.md` | 74 bài, id `S<level>-<nn>` không trùng, đủ 40 bài SDC (8+5+5+6+7+3+6); mỗi dòng có đủ cột; 40 chủ đề DTS đều có bài chính; thẻ DTS viết bằng lời riêng, không chép câu giảng/scene | T0.1, T0.3, T0.4 | done |
| T0.3 | Viết `04-simulation-engine.md`, `05-live-stage.md`, `06-activities-and-grading.md`, `07-content-authoring.md` | T0.0 | Sonnet | `docs/sysdesign/04-*`, `05-*`, `06-*`, `07-*` | `04` có kiểu, thuật toán tick, ngưỡng state, bất biến test, scenario S1-03 có số kiểm tay; `05` có kênh frame, packet pool, các lỗi sửa kèm; `06` có schema từng dạng bài và bộ chấm; `07` có định dạng module và checklist bài "xong" | T0.1, T0.2, T0.4 | done |
| T0.4 | Sửa nhỏ `docs/scale-workbench-guidelines.md` (6 app, mục `live-sim`) và `content/README.md` (thêm `content/sysdesign/`) | T0.0 | Sonnet | hai file trên | Chỉ thêm, không xoá quy chuẩn cũ | T0.1–T0.3 | done |
| T0.5 | Review toàn bộ M0: đối chiếu chéo, kiểm số dòng với code, văn phong §5, nhất quán id/tên/số liệu; sửa trực tiếp | T0.1–T0.4 | Opus | `docs/sysdesign/**`, hai file ở T0.4 | Danh sách sửa xử lý hết; README mục lục khớp file thật; mọi chỗ "Chưa quyết" trỏ tới một task có thật | — | done |

---

## M1 — Khung app và feature module (theo mẫu PMP)

Mẫu: `src/features/pmp-course/`, `scripts/build-pmp.mjs`, `scripts/pmp-doctor.mjs`.

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T1.1a | Feature module: `types.ts`, `store.ts`, `data.ts`, `logic.ts` (nav stack, progress qua `saveDurableProgress('sysdesign', …)`, dynamic import JSON), `credits.ts` (hằng `SDC_ATTRIBUTION`, 01 §3.2); ngưỡng `rankOfSd` tạm theo PMP (06 §7) | T0.5, T1.2 (kiểu `ProgressSlotId` có `'sysdesign'`); JSON mẫu từ T1.4 hoặc fixture tạm | Sonnet | `src/features/sysdesign-course/{types,store,data,logic,credits}.ts` | `npm run build` + `npm run lint` xanh; `types.ts` dùng lại `WpState/WpQuestion/WpCard`; không import từ `src/apps/` | T1.4, T1.5, M2 | done (e497895) |
| T1.1b | `SdLearnShell.tsx` + view Home/Roadmap/Module/Quiz/Flash (chuyển từ PMP) | T1.1a | Sonnet | `src/features/sysdesign-course/SdLearnShell.tsx`, `views/Sd*View.tsx` | Mở được shell với fixture; Quiz chấm bằng `gradeQuestion`, Flash dùng `rateCard` (Leitner, không `srsRepo`) | M2 | done (c0bcde4) |
| T1.1c | `scale/sdLessonBuilder.ts` + `scale/sdSceneBuilder.ts`: `module.json` + `lesson.md` (khối `step`, tối đa 12 step) + `stage.json` → `ScaleLesson[]` (07 §1.1, §2.3–§2.4) | T1.1a | Sonnet | `src/features/sysdesign-course/scale/*` | Một bài fixture dựng ra `ScaleLessonStep[]` hợp lệ và hiển thị trong `ScaleWorkbenchLayout`; không sửa `courseLessonBuilder.ts` dùng chung | M2 | done (b9a355d) |
| T1.2 | Slot lưu trữ `sysdesign`: `durableProgressStorage.ts` (12 `ProgressSlotId`, 22-28 `LOCAL_MIRROR_KEYS`, ~326-336 `inflightQueues`); `cloudSyncService.ts:22`; `backupService.ts:29,113`; `useCloudSyncStore.ts` (import ~35, switch ~96/126/143); `SettingsModal.tsx` (import ~25, state ~41-42, hydrate ~101, danh sách ~493, chuỗi liệt kê app ~229/248) | T0.5 | Sonnet | các file db/stores/SettingsModal ở cột trái | `npm run build` xanh (TypeScript buộc `Record`/switch đầy đủ); export backup có slot `sysdesign`; import lại không mất tiến độ | M2 (không chạm chung file); **tuần tự với T1.3, T4.1** | done (189c468) |
| T1.3 | App shell `src/apps/sdmastery/` (`SdMasteryApp`, `SdHeader`, `SdMobileBottomNav`, `useSdStore`, `sd.types`), 7 tab (tab chưa làm = placeholder); đăng ký ở `appRegistry.tsx` (`SD_MASTERY_CONFIG`, `LearningAppId` 257, `ALL_LEARNING_APPS` 264, `switchLearningApp` 272), `AppLogos.tsx` (`SdMasteryLogo`), `App.tsx:117-126`, `useWorkbenchStore.ts:69-82` (cursor `{moduleId:'S0-01',stepIndex:0}`), accent (`--dts-*` mới hoặc `cyan`) | T1.1b, T1.2 | Sonnet | `src/apps/sdmastery/**`, `src/apps/appRegistry.tsx`, `src/components/common/AppLogos.tsx`, `src/App.tsx`, `src/stores/useWorkbenchStore.ts`, `src/index.css` (nếu thêm accent) | App mở được từ dock và launcher; chuyển được 7 tab; ⌘1..7 chuyển tab; light/dark đúng; 5 app cũ vẫn mở bình thường | M2; **tuần tự với T1.2** | done (cd6e3e0) — UI chưa kiểm bằng mắt |
| T1.4 | `scripts/build-sysdesign.mjs`, `scripts/sysdesign-doctor.mjs` (khung quy tắc 07 §6; phần chạy engine nối ở T4.6), `scripts/run-sysdesign-tests.mjs` + npm scripts `sd:build`, `sd:doctor`, `sd:test` | T0.5 | Sonnet | `scripts/*sysdesign*.mjs`, `package.json` | `sd:build` sinh `src/data/courses/sysdesign/{curriculum,sims}.json` từ fixture; doctor bắt: trùng id, thiếu `source` ở bài từ SDC (schema 01 §3.1), quiz/cards thiếu, schema `stage.json`/`sim.json` sai, secret, từ cấm §5; `sd:test` chạy được một test mẫu. Quyết việc có theo dõi `src/data/courses/sysdesign/` trong git (theo thông lệ khoá khác) | M2, T1.1a | done (3634e53) |
| T1.5 | `scripts/import-sdc.mjs`: tải `content/phases/**` theo commit cố định vào `content/sysdesign/_source/sdc/` + `manifest.json` | T0.5 | Sonnet | `scripts/import-sdc.mjs`, `content/sysdesign/_source/sdc/**` | Manifest có path, sha, url, fetchedAt cho từng file; chạy lại cho kết quả giống hệt; `_source/` không vào bundle; doctor cảnh báo nếu file trong `_source/` khác manifest | T1.1a–c, T1.4, M2 | done (4a6b9b0) |
| T1.6 | Review M1 (Opus): chạy hết lệnh kiểm tra, kiểm hồi quy 5 app | T1.1a–T1.5 | Opus | — | `build`, `lint`, `sd:*`, `course:*`, `pmp:doctor` xanh; mở 5 app cũ không lỗi | — | todo |

---

## M2 — Engine mô phỏng (thuần TS, `src/features/sysdesign-course/sim/`)

Chi tiết thuật toán: `04-simulation-engine.md` (cây file §9.1). Cấm import React/DOM/`@/components` trong `sim/`.

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T2.1 | Kiểu dữ liệu và compile: `SystemModel`, `NodeSpec`, `LinkSpec`, `Knob`, `SimScenario`, `LoadProfile`, `TimedEvent`, `InputChange`, `SimState`, `SimFrame`; `validate`/`compile` (DAG, id) | T0.5 | Opus | `sim/{types,model}.ts` | `tsc` xanh; kiểu khớp 04 §1; `SimModelError` cho chu trình/id sai | M1 | doing |
| T2.2 | `rng.ts` (seed, `tickRng`), `profiles.ts` (`rpsAt`: steady, ramp giữ `to` sau `overSec`, spike, diurnal, custom), `events.ts` (crash, recover, slowdown, partition, heal, cache-expire-all, hot-key, deploy, rollback) | T2.1 | Sonnet | `sim/{rng,profiles,events}.ts` | Cùng seed cho cùng chuỗi; mỗi profile trả đúng RPS tại t mẫu; test trong `__tests__/` | T2.3 (sau T2.1) | doing |
| T2.3 | `engine.ts` (`createSim`, `stepState` bước 0..7), `primitives.ts`, `latency.ts`, `cache.ts`, `packets.ts`; tick 100 ms; λ → ρ → hàng đợi → p50/p95/p99 → timeout/lỗi → retry; cache warm-up/cohort, replication lag, breaker, token bucket, hysteresis | T2.1 | Opus | `sim/{engine,primitives,latency,cache,packets}.ts` | Bất biến I1–I6, I8, I10, I14–I19 (04 §9.5) đạt; deterministic; số S1-03 khớp `expect` ở 04 §10 | T2.2 | doing |
| T2.4 | `recorder.ts`: ring buffer, checkpoint 5 s, `inputLog`, `scrub`, ghi đè tương lai | T2.3 | Sonnet | `sim/recorder.ts` | I11–I13 đạt; bộ nhớ giới hạn theo `ringCapacityTicks` | T2.5, T2.6, T2.9 | todo |
| T2.5 | `analyze.ts` (bottleneck, `maxSustainableRps`, SPOF bằng articulation point, cảnh báo cấu trúc) + `hashing.ts` (mod-N, ring, Zipf) | T2.1 (T2.3 cho phần dùng frame) | Sonnet | `sim/{analyze,hashing}.ts` | I9, I20 đạt; test trên đồ thị mẫu tìm đúng SPOF | T2.4, T2.6 | todo |
| T2.6 | `grade.ts`: `Constraint`, `evaluate`, `simulate` headless | T2.3, T2.5 | Sonnet | `sim/grade.ts` | I21 (preset `fix-cache-and-db` đạt, `trap-more-apps` không đạt); test cửa sổ, trọng số lưu lượng | T2.4 | todo |
| T2.7 | `__tests__/sim.test.ts` + fixtures + nối vào `sd:test`; bench I22 | T2.3 (tăng dần theo T2.4–T2.6) | Sonnet | `sim/__tests__/*`, `scripts/run-sysdesign-tests.mjs` | Đủ I1–I22 của 04 §9.5; ghi số đo thực tế vào cột "đo được" | — | todo |
| T2.9 | `trace.ts`: `traceRequest` (waterfall request đại diện cho `RequestTracer`, 04 §9.2) | T2.3 | Sonnet | `sim/trace.ts` | Cùng `packetId` cho cùng trace; chặng chậm nhất ở S1-03 t=40 là DB; kind `retry` có chặng timeout | T2.4–T2.6 | todo |
| T2.8 | Review M2 (Opus): đối chiếu xu hướng và độ lớn với lý thuyết hàng đợi; chốt 04 §11 mục 1 | T2.1–T2.7, T2.9 | Opus | — | Mọi bất biến xanh; không import React/`@/components`; ghi giới hạn mô hình vào 04 | — | todo |

---

## M3 — Stage chế độ `live-sim` (sửa code dùng chung, rủi ro hồi quy 5 app cũ)

Chạy **tuần tự** (cùng chạm `types.ts`, `i18n.ts`, `ScaleStageSvg.tsx`, `ScaleWorkbenchLayout.tsx`, `StageEntityInspector.tsx`). Chi tiết: `05-live-stage.md` (phân rã §10). Nguyên tắc: giữ `scene` cố định, trạng thái đi qua kênh frame riêng `frameSource` (ADR-005).

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T3.1 | Kiểu + sửa kèm không đổi hành vi: `'live-sim'` vào `StageRenderMode` (types.ts:268); `PacketKind` (132) + `retry/timeout/dropped`; kiểu `Live*` (05 §2); `ScaleLessonStep.liveSim/activityId/activityGate`; `ScaleModuleLesson.attribution?` (304); `i18n.ts` packets (69/154/245); `LegendDot` (Layout 124-142); **F3** đưa `legendKinds` (496) lên trước `return null` (480) | T2.1, T1.6 | Sonnet | `scale-workbench/types.ts`, `i18n.ts`, `ScaleWorkbenchLayout.tsx` | `npm run build` + `lint` xanh, hết lỗi rules-of-hooks ở layout; 5 app cũ không đổi hành vi | — | todo |
| T3.2 | `useSimClock` (rAF bước cố định, 1×/2×/5×, play/pause, seek) + hàm thuần `stepAccumulator`; dùng lại phím Space/R (456-463) | T3.1 | Sonnet | `scale-workbench/live/useSimClock.ts` (mới) | Test hàm thuần: không trôi khi tab ẩn/hiện; tốc độ đúng | — | todo |
| T3.3 | `ScaleStageSvg`: prop `frameSource`, `renderLiveSlot`, `pickMode`, `onPacketPick`; vòng rAF áp frame qua ref map; overlay trạng thái cho mọi shape (`renderNodeBody` 2049+); queue pile sau `layer-ents` (3035); packet pool trong `layer-packets` (2968); LUT link. **Sửa kèm (commit riêng)**: F1 packet chạy ×2 (1881 và 1945); F2 reset camera theo khoá cấu trúc (1099-1105) | T3.1 | Opus | `ScaleStageSvg.tsx` | Chạy Redis/K8s/PMP/Python: stage vẫn rơi nảy, morph, packet không chạy ×2 (đo theo 05 §9.2 mục 4); camera không reset khi frame đổi | — | todo |
| T3.4 | `SimTimeline` (thanh tua, sparkline SVG tự vẽ, mốc sự kiện) giữa stage (1184) và stepper (1188); `LiveTelemetryStrip` tự subscribe; nhóm i18n `live` (phần timeline/telemetry) | T3.2, T3.3 | Sonnet | `scale-workbench/live/*` (mới), `ScaleWorkbenchLayout.tsx`, `i18n.ts` | Kéo thanh tua đổi t và frame; layout không re-render mỗi tick (React Profiler) | — | todo |
| T3.5 | Controls: `LoadKnob`, `ChaosToolbox`, `KnobPanel`, `RequestTracer`; `StageEntityInspectorCard`/`StageInspectorPortal` thêm `liveSlot`; `NodeLivePanel` ở feature; i18n `live` phần còn lại | T3.3, T3.4, T2.9 | Sonnet | `scale-workbench/live/*`, `StageEntityInspector.tsx`, `i18n.ts`, `sysdesign-course/live/NodeLivePanel.tsx` | Kéo tải thấy DB đỏ và hàng đợi dồn; bấm packet ra waterfall; inspector hiển thị số liệu node | — | todo |
| T3.6 | `ScaleWorkbenchLayout.tsx`: nhánh `live-sim` vào renderer (1134-1183), controls cạnh cụm 1054-1129, prop `liveSimAdapter`, selector phím, render `attribution` cuối cột phải; `sysdesign-course/live/liveSimAdapter.ts`; `sdLessonBuilder` điền `liveSim`, `activityId`, `attribution` | T3.4, T3.5 | Opus | `ScaleWorkbenchLayout.tsx`, `sysdesign-course/live/liveSimAdapter.ts`, `sysdesign-course/scale/sdLessonBuilder.ts` | Bước không có `liveSim` chạy y hệt hiện tại; bước `live-sim` 60 fps với ~200 packet; dòng nguồn hiện ở bài có `source` | — | todo |
| T3.7 | Review M3 (Opus) + kiểm hồi quy bằng tay theo `05-live-stage.md` §9; quyết Web Worker (04 §11 mục 3) | T3.1–T3.6 | Opus | — | Redis, K8s, CI/CD, PMP, Python xác nhận isometric như cũ; ghi kết quả vào "Ghi chú review" | — | todo |

---

## M4 — Activities và chấm điểm (`src/features/sysdesign-course/activities/`)

Chi tiết: `06-activities-and-grading.md`. Activities phụ thuộc `sim/`, không phụ thuộc stage nội bộ. Kết quả lưu vào `WpState.exercises[activityId]` qua `recordActivity` (ADR-011; PLAN ghi `recordCheck`/`recordQuiz`, 06 §6 giải thích vì sao đổi). Quiz vẫn dùng `recordQuiz`.

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T4.1 | `ActivityGate`/`ActivityCard` + `activities/types.ts` + `gradeActivity` khung; store `recordActivity`, `saveActivityDraft`, `skipActivity`; **file dùng chung**: `ExerciseRecord` + `best`/`stars` (`workpath/types.ts:111`), `mergeWpStates` giữ hai field (`durableProgressStorage.ts`, nhánh `exercises` 175-197); Layout thêm prop `renderStepActivity`, `isStepLocked` (05 §2.1) | T3.6 | Sonnet | `activities/*`, `sysdesign-course/store.ts`, `src/features/workpath/types.ts`, `src/db/durableProgressStorage.ts`, `ScaleWorkbenchLayout.tsx` | Gate chặn đến khi đạt/bỏ qua/xem lời giải; điểm sống sót qua reload và qua `mergeWpStates` (test); `course:test` và `pmp:doctor` xanh | — (**tuần tự với T1.2 và mọi task chạm Layout**) | todo |
| T4.2 | Dạng `predict` và `spot-bottleneck` | T4.1 | Sonnet | `activities/Predict*`, `activities/SpotBottleneck*` | Ca đúng/sai/một phần trong test | T4.3, T4.5 | todo |
| T4.3 | Dạng `tune-to-limit` và `estimate` | T4.1 | Sonnet | `activities/TuneToLimit*`, `activities/Estimate*` | `max-load`: 2950 ⇒ 100, 2000 ⇒ 40, 4000 ⇒ 0 trên S1-03 (06 §9) | T4.2, T4.5 | todo |
| T4.4 | Dạng `fix-challenge` (ngân sách, `allowed`, `par`, sao; engine chấm) | T4.1, T2.6 | Opus | `activities/FixChallenge*` | Starter không đạt, lời giải ★★★, bẫy không đạt, thay đổi ngoài `allowed` ⇒ `invalid-change` | — | todo |
| T4.5 | Dạng `order`, `timeline-read`, `postmortem`, `design-constraint` (v1: preset + slot `enabled`) | T4.1 | Sonnet | `activities/*` | Mỗi dạng có test chấm | T4.2, T4.3 | todo |
| T4.6 | Nối `sysdesign-doctor` phần chạy engine cho activities (06 §8.2) | T4.1, T1.4 | Sonnet | `scripts/sysdesign-doctor.mjs` | Activity thiếu lời giải đạt hoặc starter đạt ⇒ lỗi; `expected` lệch engine ⇒ lỗi | T4.2–T4.5 | todo |
| T4.7 | Review M4 (Opus) | T4.1–T4.6 | Opus | — | Mọi dạng chấm đúng; điểm vào `WpState`; không hồi quy app khác | — | todo |

---

## M5 — Bài mẫu `S1-03 Data Flow & Bottlenecks` (cổng duyệt)

Kịch bản và số liệu chốt: `04-simulation-engine.md` §10 (ramp 200 → 5.000 RPS, DB chạm ρ = 1 ở t ≈ 35 s); activities mẫu: `06-activities-and-grading.md` §3 (S1-03.A1–A6).

| ID | Mô tả | Phụ thuộc | Agent | File chạm chính | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T5.1 | Chuyển SDC phase-1/lesson-3 thành `lesson.md`, `module.json` (có `source`), `quiz.json`, `cards.json`; đối chiếu `reference/dts-models.md` (`latency-throughput`, `request-lifecycle`) | T4.7, T1.5 | Sonnet | `content/sysdesign/modules/S1-03-*/` | Checklist bài "xong" ở `07-content-authoring.md` §5; có dòng nguồn; không còn giai thoại | T5.2 | todo |
| T5.2 | `stage.json` + `sim.json` (`S1-03/ramp` đúng 04 §10); tracer waterfall | T3.6, T2.8 | Sonnet | `content/sysdesign/modules/S1-03-*/{stage,sim}.json` | DB đỏ trước tầng app; `expect` đạt; tua được | T5.1 | todo |
| T5.3 | `activities.json` (A1–A6 theo 06 §3) | T5.2, T4.7 | Sonnet | `.../activities.json` | `sd:doctor`: starter không đạt, lời giải đạt, bẫy không đạt | — | todo |
| T5.4 | Review nội dung + trải nghiệm (Opus), chạy app thật theo 05 §9.4 | T5.1–T5.3 | Opus | — | Checklist `08-workflow.md` §5 đạt; `build`, `lint`, `sd:*`, `course:*`, `pmp:doctor` xanh | — | todo |
| T5.5 | **Cổng duyệt của người dùng**: tự chạy hết bài mẫu và duyệt | T5.4 | Người dùng | — | Người dùng ghi "duyệt" hoặc danh sách sửa vào "Ghi chú review". **Không nhân rộng (M6, M7) trước khi có "duyệt"** (ADR-008) | — | todo |

---

## M6 — Nhân rộng nội dung (15 batch theo `02-curriculum.md` §6, ADR-013)

Mỗi bài là một task con trong batch: `lesson.md` (biên tập tay), `module.json` (có `source` nếu từ SDC), `stage.json`, `sim.json` (nếu có), `activities.json`, `quiz.json`, `cards.json`. Bài trong cùng batch chạm thư mục riêng nên chạy song song bằng worktree; phần mở rộng engine/công cụ của batch (cột "Cần thêm") làm **trước** các bài, tuần tự, có test. Sau mỗi batch cập nhật cột Trạng thái của `02-curriculum.md` (gộp khi merge). Batch chạy theo thứ tự số; batch sau có thể bắt đầu khi phần "Cần thêm" của nó đã xong.

Điều kiện chung: T5.5 = done.

| ID | Batch | Bài | Cần thêm (engine/công cụ) | Phụ thuộc riêng | Agent | Trạng thái |
|---|---|---|---|---|---|---|
| T6.0a | Chốt phạm vi mô phỏng sự kiện | — | Quyết 3 câu ở 04 §12 (engine `sim/timeline/` hay kịch bản tĩnh; vị trí Time view; phạm vi Raft); cập nhật 04 §12 + ADR; người dùng xem đề xuất | T5.5; **phải xong trước T6.4** | Opus | todo |
| T6.0b | Hiện thực mô phỏng sự kiện | — | `sim/timeline/` (actor, message, đồng hồ, quorum, lock, saga, CRDT), checker (stale read, RYW, lost update), Time view; test | T6.0a; **phải xong trước T6.4 (phần S2-06, S2-11), T6.7, T6.8** | Opus | todo |
| T6.1 | 1 | S1-07, S1-04, S1-01, S1-02, S1-06 | Capacity view (đường latency–throughput), kịch bản fan-out | — | Sonnet | todo |
| T6.2 | 2 | S0-01, S0-02, S0-03, S0-04, S0-09 | Công cụ Làm rõ yêu cầu, Trade-off Matrix, Ngân sách ràng buộc | T6.1 (S0-09 tham chiếu giao diện sim đã ổn định) | Sonnet | todo |
| T6.3 | 3 | S0-05, S0-06, S0-07, S0-08, S1-05 | Estimator ("Đưa vào mô phỏng"), Requirements Card, slot lắp ô | — | Sonnet | todo |
| T6.4 | 4 | S2-01, S2-06, S2-02, S2-04, S2-11 | lb (least-conn, health check), cache stampede/singleflight, queue (ack, DLQ) | T6.0b cho S2-06, S2-11 | Sonnet | todo |
| T6.5 | 5 | S2-03, S2-07, S2-08, S2-09, S2-10 | replication lag, shard + hot key (Zipf), hash ring, Data view; chốt sticky read-after-write (04 §11 mục 4) | — | Sonnet | todo |
| T6.6 | 6 | S4-11, S4-05, S4-10, S4-01, S3-09 | timeout/retry/breaker/bulkhead, token bucket, back-pressure, autoscaling, failover theo zone | — | Sonnet | todo |
| T6.7 | 7 | S3-01, S3-02, S3-03, S3-05, S3-06 | partition CP/AP, quorum, Raft rút gọn, đồng hồ lệch (trên `sim/timeline/`) | T6.0b | Sonnet | todo |
| T6.8 | 8 | S3-04, S3-07, S3-08, S4-04, S4-08 | 2PC/saga, lock/isolation, CRDT; B-tree/LSM trong `memory-2d` | T6.0b | Sonnet | todo |
| T6.9 | 9 | S4-02, S4-03, S4-06, S4-07, S4-09 | CDN edge, idempotency, dashboard + trace (nền War-Room), realtime | T6.0b cho S4-06 | Sonnet | todo |
| T6.10 | 10 | S1-08, S2-12, S2-05, S5-01, S5-02, S5-03 | Evolution timeline; ghép primitive đã có | — | Sonnet | todo |
| T6.11 | 11 | S5-04, S5-05, S5-06, S6-01, S6-02, S6-03 | registry/discovery, batch/stream, multi-region (sự kiện), Trade-off view radar | T6.0b cho S5-06 | Sonnet | todo |
| T6.12 | 12 | S6-04, S6-05, S6-06, S6-07, S6-08 | cost view, chaos blast radius | Người dùng chốt vị trí S6-08..S6-12 (02 §8) trước batch này | Sonnet | todo |
| T6.13 | 13 | S6-09, S6-10, S6-11, S6-12 | canary/rollback trên engine tải | — | Sonnet | todo |
| T6.14 | 14 | S7-01, S7-02, S7-03, S7-04 | lưới geohash/quadtree (`memory-2d`) | T7.1, T7.3 | Sonnet | todo |
| T6.15 | 15 | S7-05, S7-06, S7-07 | scene trie | T7.1, T7.3; T6.0b cho S7-06 | Sonnet | todo |
| T6.16 | Review từng batch (Opus) — một dòng "Ghi chú review" cho mỗi batch | — | Checklist nội dung `08-workflow.md` §5; mọi bài đạt checklist `07` §5; `sd:doctor` xanh | mỗi batch | Opus | todo |

Nghiệm thu chung mỗi bài: checklist "xong" ở `07-content-authoring.md` §5; bài không từ SDC thì không có `source.kind:'sdc'`, viết bằng lời riêng từ `reference/dts-models.md`, nội dung chính xác kỹ thuật, có nguồn tham khảo công khai cho phần ★.

---

## M7 — Các tab mở rộng (song song theo tab)

Điều kiện chung: T5.5 = done (trừ T7.6). Mỗi tab chạm thư mục riêng trong `src/apps/sdmastery/` và `src/features/sysdesign-course/`; chạy song song được. Tab đăng ký trong `SdMasteryApp` đã có placeholder từ T1.3.

| ID | Tab | Mô tả | Phụ thuộc | Agent | Nghiệm thu | Song song với | Trạng thái |
|---|---|---|---|---|---|---|---|
| T7.1 | `lab` | Canvas Lab: lưới 2D vuông góc, cùng `SystemModel` (ADR-007); mở `design-constraint` với canvas trống (06 §10) | T2.8, T4.7 | Opus | Kéo-thả primitive, nối link, chạy sim, chấm bằng `grade.ts`; lưu thiết kế vào ghi chú | T7.2–T7.6 | todo |
| T7.2 | `warroom` | War-Room: 9 sự cố chạy trên engine (02 §7.1); knob `cancelOnTimeout` (04 §11) | T3.7, T4.7 | Sonnet | Mỗi sự cố có kịch bản sim, dấu hiệu quan sát, nhiệm vụ khắc phục, `postmortem` | T7.1, T7.3–T7.6 | todo |
| T7.3 | `cases` | Design Cases + Evolution timeline (02 §7.2; URL Shortener và News Feed bọc S5-02, S5-03) | T3.7, T4.7 | Sonnet | Mỗi case có bước hỏi bắt buộc đầu tiên (khung câu hỏi SDC) và timeline v1→vN chạy được | T7.1, T7.2, T7.4–T7.6 | todo |
| T7.4 | `atlas` | Pattern Atlas/Glossary, gắn vào `TermPopover` qua `src/data/glossary/devopsAndPmpData.ts` (file dùng chung) | T5.5 | Sonnet | Thuật ngữ hiện popover ở bài học; không phá glossary của app khác | T7.1–T7.3, T7.5, T7.6 | todo |
| T7.5 | `interview` | Interview Mode: SNAKE 5 chặng, bấm giờ | T4.7 | Sonnet | Chạy đủ 5 chặng, có đồng hồ, lưu kết quả | T7.1–T7.4, T7.6 | todo |
| T7.6 | `credits` | Trang Credits (nội dung theo `01-sources-and-credits.md` §3.3). **Khuyến nghị làm sớm** (ngay sau T1.3) vì liên quan giấy phép | T1.3 | Sonnet | Liệt kê SDC (repo, sha, giấy phép, ghi chú MIT), DTS (tham chiếu), danh sách bài đã chuyển lấy từ `source` | bất kỳ | todo |
| T7.7 | Review M7 (Opus), một dòng cho mỗi tab | T7.1–T7.6 | Opus | — | Tab hoạt động; không hồi quy | — | todo |

---

## M8 — Sau này

| ID | Mô tả | Phụ thuộc | Agent | Nghiệm thu | Trạng thái |
|---|---|---|---|---|---|
| T8.1 | Bản EN của bài học (UI/telemetry/inspector đã song ngữ từ đầu) | M6 | Sonnet | **Chưa quyết** cấu trúc file EN (07 đề xuất `lesson.en.md` cùng số step) — quyết khi bắt đầu | todo |
| T8.2 | A/B compare hai kiến trúc cạnh nhau (ghost timeline, 04 §11 mục 5) | M7 | Opus | Hai sim chạy song song cùng profile; so metric | todo |
| T8.3 | Multi-region trên engine tải, Raft nâng cao | M7 | Opus | Mô phỏng partition liên region; log replication có quorum | todo |

---

## Ghi chú review

| Ngày | Task | Kết quả | Ghi chú |
|---|---|---|---|
| 2026-11-26 | T0.1–T0.4 | đạt (sau khi T0.5 sửa trực tiếp) | Đã đồng bộ: kịch bản S1-03 theo 04 §10 (02/05/06/07); schema `source` duy nhất ở 01 §3.1; `ScaleModuleLesson.attribution` (05 §2, 03 §5.3, T3.1/T3.6); file dùng chung `ExerciseRecord`/`mergeWpStates`/`PacketKind`/`LegendDot`/`legendKinds`/`i18n.ts` (03 §5, 08 §6, T3.1, T4.1); M6 theo 15 batch của 02 (ADR-013); thêm 04 §12 + T6.0a/b cho bài sự kiện; bỏ nhãn `quiz-only`; adapter engine → workbench chuyển từ `sim/view.ts` sang `sysdesign-course/live/`. Commit M0 do orchestrator làm |
| 2026-11-26 | T0.5 | done | Xem báo cáo review |
