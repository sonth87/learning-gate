# Plan: App "System Design Mastery" (sdmastery) — tài liệu + triển khai

## Context
Learning Gate đã có 5 app (Python, K8s, CI/CD, PMP, Redis). Cần thêm app **System Design**, nơi mô hình hóa là trọng tâm:
- **Nội dung đọc** lấy từ System Design Core (repo `steve-bang/systemdesigncore`, `content/phases/**`: 53 MDX, 7 phase, 40 bài, tiếng Việt). Ghi nguồn ở từng bài và có trang Credits.
- **Mô hình** đối chiếu với designed-to-scale.vercel.app (40 bài, 9 chương; scene isometric theo bước). Chỉ tham chiếu, tự dựng scene, không chép dữ liệu scene hay lời giảng.
- **Phần nâng cấp riêng**: engine mô phỏng theo thời gian (tải tăng thì nghẽn, lỗi lan, hồi phục), trạng thái thành phần, người học tự tác động (núm tải, tiêm lỗi, chỉnh tham số, tua timeline), và bài tập có chấm điểm. Vòng học: Xem → Đoán → Phá → Sửa → Giải thích.

Ràng buộc người dùng đã chốt:
- **Feature module riêng** theo mẫu PMP, không đi qua engine DevOps.
- Nội dung **tiếng Việt trước**; UI, telemetry và inspector song ngữ như workbench hiện tại; bản EN của bài làm sau.
- Thực thi bằng **subagent**: Sonnet làm, Opus review.
- **Việc đầu tiên là viết bộ docs đầy đủ** để luôn biết đang làm gì, cần làm gì, làm thế nào.

## Quy ước tên
- App id `sdmastery`, course/slot id `sysdesign`, module id `S<phase>-<nn>` (ví dụ `S1-03`).
- Nguồn nội dung: `content/sysdesign/`. Bản build: `src/data/courses/sysdesign/`. Feature: `src/features/sysdesign-course/`. App shell: `src/apps/sdmastery/`. Docs: `docs/sysdesign/`.

## Tiền điều kiện (người dùng làm)
- **Commit các thay đổi đang dở** trong `src/components/scale-workbench/{MemoryStageSvg,ScaleStageSvg,ScaleWorkbenchLayout}.tsx`, `src/index.css`, `src/stores/useWorkbenchStore.ts` trước khi agent chạm vào. M3 sẽ sửa đúng các file này.
- Tạo branch `feat/sdmastery`.

---

## M0 — Bộ tài liệu (làm trước tiên, Sonnet viết, Opus review)
Tạo `docs/sysdesign/`. Mỗi file là "nguồn sự thật" cho phần của nó và phải được cập nhật khi thực tế thay đổi.

| File | Nội dung |
|---|---|
| `README.md` | Mục lục, trạng thái hiện tại (milestone nào đang làm), link nhanh tới TASKS và DECISIONS |
| `00-vision.md` | Mục tiêu, 3 lớp (Tư duy, Cơ chế, Luyện tập), điểm khác biệt so với 2 trang nguồn, 8 góc nhìn mô hình, vòng học 5 bước, phạm vi và ngoài phạm vi |
| `01-sources-and-credits.md` | SDC: repo, commit hash đã lấy, tình trạng giấy phép (README ghi MIT nhưng không có LICENSE; footer web ghi "All rights reserved"; người dùng sẽ tự liên hệ tác giả), quy tắc ghi nguồn (frontmatter `source` ở từng bài, dòng nguồn trên UI, trang Credits, giữ ghi chú MIT). DTS: chỉ tham chiếu, những gì được và không được làm |
| `02-curriculum.md` | **Bảng tổng**: từng bài gồm id, phase, tiêu đề, file SDC nguồn, chủ đề DTS đối chiếu, mô hình/scene, kịch bản mô phỏng, dạng bài tập, trạng thái. Gồm 40 bài SDC, các chủ đề chỉ DTS có (storage engines, index, files, realtime, service discovery, sagas, batch/stream, security, testing, CI/CD) và các phần mình thêm (multi-region, CRDT, cost, các case study) |
| `03-architecture.md` | Cây thư mục, luồng dữ liệu `content/ → build → JSON → feature → app`, ranh giới module, danh sách tái sử dụng (xem dưới), các điểm chạm vào code dùng chung |
| `04-simulation-engine.md` | `SystemModel`, primitive spec, thuật toán tick (luồng tải, ρ, hàng đợi, latency M/M/c xấp xỉ, timeout, lỗi, retry, cache hit/warm-up, replication lag, circuit breaker, token bucket), ngưỡng máy trạng thái, LoadProfile, TimedEvent, seed RNG, ring buffer snapshot, các bất biến phải test |
| `05-live-stage.md` | Chế độ `live-sim`: kênh `frameRef` tách khỏi `scene`, packet pool, queue pile, state overlay cho mọi shape, `SimTimeline` cùng sparkline, controls, inspector `liveSlot`; các lỗi hiện có cần sửa kèm (mục M3) |
| `06-activities-and-grading.md` | Schema từng dạng bài tập (predict, spot-bottleneck, tune-to-limit, estimate, fix-challenge, order, timeline-read, postmortem, design-constraint), bộ chấm, cách lưu điểm vào WpState |
| `07-content-authoring.md` | Định dạng `content/sysdesign/modules/<id>/` (module.json, lesson.md, quiz.json, cards.json, sim.json/activities.json), cách **chuyển một bài SDC** (biên tập tay theo `docs/scale-workbench-guidelines.md` §5: bỏ giai thoại "Tôi còn nhớ…", chuẩn hóa văn phong và thuật ngữ, Mermaid thành visual/scene), checklist một bài "xong" |
| `08-workflow.md` | Quy trình subagent (dưới), Definition of Done, các lệnh kiểm tra, quy tắc branch và commit |
| `TASKS.md` | Bảng việc: ID, mô tả, phụ thuộc, người làm (agent), tiêu chí nghiệm thu, trạng thái (todo/doing/review/done). Mọi agent cập nhật file này khi xong việc |
| `DECISIONS.md` | Nhật ký quyết định kiểu ADR (đã chốt: feature riêng, VI trước, subagent, kênh frame riêng cho live mode…) |
| `reference/dts-models.md` | Thẻ đối chiếu cho từng bài DTS, viết bằng lời của mình: khái niệm, thành phần scene, trình tự bước, metric chính |

Cập nhật thêm `docs/scale-workbench-guidelines.md` (đổi "5 ứng dụng" thành 6, bổ sung mục chế độ `live-sim`) và `content/README.md` (thêm `content/sysdesign/`).

---

## M1 — Khung app và feature module (theo mẫu PMP)
Mẫu cần sao chép: `src/features/pmp-course/` (types dùng lại `WpState/WpQuestion/WpCard` từ `src/features/workpath/types`, `store.ts`, `data.ts`, `logic.ts`, `PmpLearnShell.tsx` dùng `ScaleWorkbenchLayout`, `views/PmpQuizView.tsx`, `views/PmpFlashView.tsx`, `views/PmpRoadmapView.tsx`) và `scripts/build-pmp.mjs`, `scripts/pmp-doctor.mjs`.

- **T1.1 Feature module** `src/features/sysdesign-course/`: `types.ts`, `store.ts` (nav stack + progress dùng `saveDurableProgress('sysdesign', …)`), `data.ts` (dynamic import JSON), `logic.ts`, `SdLearnShell.tsx`, các view Home/Roadmap/Module/Quiz/Flash (chuyển từ PMP sang), `scale/sdLessonBuilder.ts` (theo `buildPmpScaleLessons` trong `src/features/devops-course/scale/courseLessonBuilder.ts:1014`).
- **T1.2 Lưu trữ và đồng bộ**: thêm slot `sysdesign` ở
  - `src/db/durableProgressStorage.ts:12,22-28,334`
  - `src/db/cloudSyncService.ts:22`
  - `src/db/backupService.ts:29,113`
  - `src/stores/useCloudSyncStore.ts` (import và 3 switch ~98/129/145)
  - `src/components/layout/SettingsModal.tsx` (~26/43/101/494)
- **T1.3 App shell** `src/apps/sdmastery/`: `SdMasteryApp.tsx` (theo `src/apps/redismastery/RedisMasteryApp.tsx`: root class `pylearn-root dts-shell …`, `useMenuAction`/`useContextAction`, `ScaleCommandPalette`, `NotesDrawer`, `TermPopover`, `SettingsModal`), `components/SdHeader.tsx` (bọc `ScaleAppHeader`), `SdMobileBottomNav.tsx`, `store/useSdStore.ts`, `types/sd.types.ts`. Các tab: `learn | lab | warroom | cases | atlas | interview | credits`, các tab chưa làm thì để placeholder. Đăng ký:
  - `src/apps/appRegistry.tsx`: `SD_MASTERY_CONFIG`, `LearningAppId`, `ALL_LEARNING_APPS`, nhánh trong `switchLearningApp` ~277
  - `src/components/common/AppLogos.tsx`: `SdMasteryLogo`
  - `src/App.tsx:117-126`: thêm vào dock
  - `src/stores/useWorkbenchStore.ts:69-82`: cursor `{moduleId:'S0-01',stepIndex:0}`, expandedLevel
  - accent: thêm `--dts-*` mới hoặc dùng `cyan`
- **T1.4 Build và doctor**:
  - `scripts/build-sysdesign.mjs`: `content/sysdesign/` → `src/data/courses/sysdesign/{curriculum,sims}.json`
  - `scripts/sysdesign-doctor.mjs`: trùng id, `source` bắt buộc với bài từ SDC, quiz/cards ≥1, schema sim/activity hợp lệ, mỗi activity có lời giải đạt và starter không đạt (chạy qua engine), secret scan, cấm từ ngữ theo guidelines §5
  - `scripts/run-sysdesign-tests.mjs` (esbuild, theo `scripts/run-engine-tests.mjs`)
  - npm scripts `sd:build`, `sd:doctor`, `sd:test`
- **T1.5 Nhập nguồn SDC**: `scripts/import-sdc.mjs` tải `content/phases/**` theo commit cố định vào `content/sysdesign/_source/sdc/` (chỉ đọc) kèm `manifest.json` (path, sha, url, ngày lấy). Bản gốc này không được build vào app.

## M2 — Engine mô phỏng (thuần TS, không phụ thuộc UI)
Thư mục `src/features/sysdesign-course/sim/`:
- `model.ts`: `SystemModel`, `PrimitiveSpec` (client, dns, cdn, lb, gateway, service, cache, sql, nosql, queue, worker, blob, rate-limiter), `LinkSpec` (latency, sync/async, timeout, retry, breaker).
- `engine.ts`: `createSim(scenario)` và `step(state, inputs, dt)`. Mỗi tick 100ms, mô hình dòng chảy: lan truyền λ (hit ratio, fan-out, retry) → ρ → hàng đợi → latency p50/p95/p99 → timeout/lỗi → retry. Node có trạng thái: cache warm-up, replication lag, breaker, token bucket.
- `profiles.ts` (steady, ramp, spike, diurnal, custom), `events.ts` (crash, recover, slowdown, partition, cache-expire-all, hot-key, deploy-bad).
- `rng.ts` (seed), `recorder.ts` (ring buffer `SimFrame`, tua về t bất kỳ bằng cách chạy lại từ checkpoint).
- `analyze.ts` (bottleneck, SPOF bằng articulation point, cảnh báo cấu trúc), `grade.ts` (ràng buộc định lượng: SLO, error, cost; ràng buộc cấu trúc).
- `__tests__/sim.test.ts`, kiểm các bất biến: Little's Law; ρ→1 thì latency tăng vọt; thêm server ở tầng không nghẽn không cải thiện; cache hit 90% làm λ vào DB còn 10%; retry storm xuất hiện khi không có backoff; consistent hashing dời khoảng 1/N key; cùng seed cho cùng kết quả.

## M3 — Stage chế độ live-sim (sửa code dùng chung, rủi ro hồi quy cho 5 app cũ)
Dựa trên khảo sát `ScaleStageSvg.tsx`: scene đổi mỗi tick sẽ reset camera (dòng 1099), dựng lại layout và ẩn packet khoảng 380ms. Vì vậy **giữ `scene` cố định, đẩy trạng thái theo tick qua kênh riêng**.
- **T3.1** `src/components/scale-workbench/types.ts`: thêm `'live-sim'` vào `StageRenderMode` (268), `liveSim?: LiveSimSpec` vào `ScaleLessonStep`, kiểu `SimFrame`.
- **T3.2** `useSimClock` (rAF bước cố định, tốc độ 1×/2×/5×, play/pause, scrub), dùng lại phím Space/R của layout (456-463).
- **T3.3** `ScaleStageSvg.tsx`: prop tùy chọn `frameRef`/`subscribeFrame`, áp dụng trong vòng rAF (1880-1909) qua ref map. Thêm overlay trạng thái và `loadPct` cho cả `db/device/crowd` (`renderNodeBody` 2049+), lớp queue pile sau `layer-ents` (3035), packet pool N phần tử trong `layer-packets` (2968). **Sửa kèm**: vòng packet thứ hai (1938) cộng trùng dt làm packet chạy x2; reset camera theo khóa cấu trúc thay vì identity của `scene`; `legendKinds` useMemo đặt sau `return null` (ScaleWorkbenchLayout 480/496), sai rules of hooks.
- **T3.4** `SimTimeline` (thanh tua, sparkline SVG tự vẽ, mốc sự kiện) đặt giữa stage (1184) và stepper (1188); `LiveTelemetryStrip` subscribe riêng để layout không re-render mỗi tick.
- **T3.5** Controls: `LoadKnob`, `ChaosToolbox`, panel tham số; `StageEntityInspector` thêm `liveSlot` (số liệu, sparkline từng node); `RequestTracer` (bấm packet để xem waterfall).
- **T3.6** `ScaleWorkbenchLayout.tsx`: thêm nhánh `live-sim` vào renderer (1134-1183), gắn controls cạnh cụm 1054-1129. Bước không có `liveSim` phải chạy y hệt hiện tại.

## M4 — Activities và chấm điểm
`src/features/sysdesign-course/activities/`: `ActivityGate` (chặn hoặc cho bỏ qua bước), các dạng predict, spot-bottleneck, tune-to-limit, estimate (sai số ±%), fix-challenge (ngân sách và mục tiêu, engine chấm), order, timeline-read, postmortem. Kết quả ghi vào `WpState` qua `recordCheck`/`recordQuiz`. Quiz và Flash dùng view từ M1.

## M5 — Bài mẫu (cổng duyệt với người dùng)
`S1-03 Data Flow & Bottlenecks`: lấy SDC phase-1/lesson-3, đối chiếu DTS "Latency & Throughput" và "How a Request Travels". Gồm: đọc, scene, mô phỏng ramp tải (DB nghẽn), tracer waterfall, đoán chỗ nghẽn, thử thách sửa, quiz và cards, dòng nguồn. **Dừng lại để người dùng duyệt trải nghiệm** trước khi nhân rộng.

## M6 — Nhân rộng nội dung (song song theo bài)
Mỗi bài là một task: chuyển SDC sang `lesson.md` (biên tập tay), `module.json` (có `source`), `quiz.json`, `cards.json`, scene và sim, activities. Thứ tự theo phase 0 → 6, rồi các chủ đề chỉ DTS có, rồi phần mình thêm. Mỗi batch khoảng 4–6 bài, cập nhật `02-curriculum.md`.

## M7 — Các tab mở rộng
Canvas Lab (lưới 2D vuông góc, cùng `SystemModel`), War-Room (sự cố chạy trên engine), Design Cases kèm Evolution timeline, Pattern Atlas/Glossary (gắn vào `TermPopover` qua `src/data/glossary/devopsAndPmpData.ts`), Interview Mode (SNAKE, bấm giờ), Credits.

## M8 — Sau này
Bản EN của bài học, A/B compare, multi-region/Raft nâng cao.

---

## Quy trình subagent (ghi chi tiết trong `08-workflow.md`)
1. **Implementer (Sonnet)** nhận một task trong `TASKS.md`, kèm đường dẫn docs liên quan và tiêu chí nghiệm thu. Làm xong thì chạy kiểm tra và cập nhật TASKS sang `review`.
2. **Reviewer (Opus)** đọc diff, đối chiếu với docs và tiêu chí, chạy lại lệnh kiểm tra, review đúng sai. Với nội dung thì review thêm độ chính xác kỹ thuật, guidelines §5 và việc ghi nguồn. Đạt thì `done`; chưa đạt thì trả về kèm danh sách sửa.
3. **Song song**: task nào chạm các file khác nhau thì chạy song song bằng `isolation: worktree` (ví dụ M1 song song M2; các bài trong M6). Task chạm file dùng chung (M3, đăng ký app ở T1.3, slot ở T1.2) thì chạy tuần tự.
4. Mỗi task hoàn thành tương ứng một commit trên `feat/sdmastery`. Không push nếu chưa được yêu cầu.

Thứ tự phụ thuộc: **M0** → (**M1** ∥ **M2**) → **M3** (cần T2.1 types) → **M4** → **M5 (duyệt)** → **M6** ∥ **M7** → M8.

## Tái sử dụng (không viết lại)
- `ScaleWorkbenchLayout`, `ScaleStageSvg`, `StageEntityInspector`, `ScaleCommandPalette`, `ScaleAppHeader`, `BlueprintMarkdown` (`src/components/scale-workbench/`)
- `WpState`, Leitner `rateCard`, `gradeQuestion` (`src/features/workpath/`)
- `saveDurableProgress` (`src/db/durableProgressStorage.ts`), `NotesDrawer`, `TermPopover` (`src/components/common/`)
- Mẫu build/doctor/test: `scripts/build-pmp.mjs`, `scripts/pmp-doctor.mjs`, `scripts/run-engine-tests.mjs`

## Kiểm tra
- Mỗi task: `npm run build` (tsc + vite), `npm run lint`, `npm run sd:build && npm run sd:doctor && npm run sd:test`.
- Không hồi quy: `npm run course:build && npm run course:doctor && npm run course:test`, `npm run pmp:doctor`.
- Sau M3: chạy app (skill `run` / `npm run dev`), mở Redis, K8s, PMP, Python và xác nhận stage isometric vẫn diễn hoạt như cũ (rơi nảy, morph, packet không chạy x2). Mở bài live-sim: kéo tải thấy DB đỏ và hàng đợi dồn, tua timeline được, 60fps với khoảng 200 packet.
- M5: người dùng tự chạy hết bài mẫu và duyệt.
- Backup/cloud sync: export JSON có slot `sysdesign`, import lại không mất tiến độ.
