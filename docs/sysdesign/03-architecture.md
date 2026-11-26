# 03 — Kiến trúc

> Ngày: 2026-11-26. Mô tả **cấu trúc đích**. Phần nào chưa có trong repo được đánh dấu `(chưa có — Tx.y)`. Cập nhật file này khi cấu trúc thực tế khác.

## 1. Cây thư mục đích

```text
content/sysdesign/                         # nguồn nội dung (sửa tay ở đây)
├── course.json                            # tên phase/level, ngưỡng đỗ quiz (T1.4)
├── modules/
│   └── S1-03-data-flow-and-bottlenecks/   # <id>-<slug>; id dạng S<phase>-<nn>
│       ├── module.json                    # id, level, order, title, source, ... (07 §2.2)
│       ├── lesson.md                      # chia bước theo `##` (8–12, tối đa 12; 07 §2.3)
│       ├── stage.json                     # scene từng step + cấu hình live-sim (07 §2.4)
│       ├── sim.json                       # SystemModel + SimScenario (nếu có mô phỏng; 04 §10)
│       ├── activities.json                # bài tập có chấm điểm (nếu có; 06)
│       ├── quiz.json
│       └── cards.json
└── _source/
    └── sdc/                               # BẢN GỐC SDC, CHỈ ĐỌC (T1.5)
        ├── manifest.json                  # path, sha, url, fetchedAt
        └── phase-<n>/...                  # file MDX gốc, không build vào app

scripts/
├── build-sysdesign.mjs                    # content/sysdesign → src/data/courses/sysdesign (T1.4)
├── sysdesign-doctor.mjs                   # kiểm định nội dung (T1.4)
├── run-sysdesign-tests.mjs                # bundle esbuild + chạy test (T1.4)
└── import-sdc.mjs                         # tải SDC theo commit cố định (T1.5)

src/data/courses/sysdesign/                # SINH RA bởi sd:build, KHÔNG sửa tay
├── curriculum.json
└── sims.json

src/features/sysdesign-course/
├── types.ts                               # dùng lại WpState/WpQuestion/WpCard (T1.1a)
├── store.ts                               # nav stack + progress (saveDurableProgress('sysdesign', …))
├── data.ts                                # dynamic import JSON
├── logic.ts
├── SdLearnShell.tsx                       # dùng ScaleWorkbenchLayout
├── views/                                 # SdHomeView, SdRoadmapView, SdModuleView, SdQuizView, SdFlashView
├── credits.ts                             # hằng SDC_ATTRIBUTION (01 §3.2)
├── scale/
│   ├── sdLessonBuilder.ts                 # module → ScaleLesson[] (theo buildPmpScaleLessons); điền liveSim, activityId, attribution
│   └── sdSceneBuilder.ts                  # stage.json + SystemModel → StageScene (07 §1.1)
├── sim/                                   # ENGINE, thuần TS (M2) — cây file đầy đủ ở 04 §9.1
│   ├── types.ts  model.ts  primitives.ts  engine.ts  latency.ts  cache.ts  packets.ts
│   ├── rng.ts    profiles.ts  events.ts  recorder.ts  analyze.ts  grade.ts  hashing.ts  trace.ts
│   ├── timeline/                          # mô phỏng sự kiện (04 §12; Chưa quyết, T6.0a)
│   └── __tests__/sim.test.ts
├── live/                                  # adapter engine → workbench (M3, T3.6)
│   ├── liveSimAdapter.ts                  # cài LiveSimAdapter/LiveSimSession (05 §2.1), SimFrame → LiveSimFrame
│   └── NodeLivePanel.tsx                  # nội dung liveSlot của inspector (05 §3.6)
└── activities/                            # M4: ActivityGate + từng dạng bài (06)

src/apps/sdmastery/
├── SdMasteryApp.tsx                       # shell, 7 tab
├── components/                            # SdHeader.tsx, SdMobileBottomNav.tsx, view từng tab
├── store/useSdStore.ts
├── types/sd.types.ts
└── data/                                  # dữ liệu riêng của app (atlas, war-room, cases, interview)

src/components/scale-workbench/            # CODE DÙNG CHUNG — thay đổi ở M3 (xem mục 5)
├── types.ts                               # + 'live-sim', PacketKind mới, Live* (LiveSimFrame, LiveSimSource, LiveSimSpec…), attribution
├── i18n.ts                                # + packets mới, nhóm `live`
├── ScaleStageSvg.tsx                      # + frameSource (kênh frame riêng), overlay, queue pile, packet pool
├── ScaleWorkbenchLayout.tsx               # + nhánh live-sim, controls, liveSimAdapter, dòng nguồn
├── StageEntityInspector.tsx               # + liveSlot
└── live/ (mới)                            # useSimClock, SimTimeline, LiveTelemetryStrip, LoadKnob, ChaosToolbox, KnobPanel, RequestTracer
```

Trạng thái thực tế 2026-11-26: chỉ có `docs/sysdesign/`; mọi thứ khác ở trên là đích. Mẫu để sao chép đã có: `src/features/pmp-course/`, `src/apps/redismastery/`, `scripts/build-pmp.mjs`, `scripts/pmp-doctor.mjs`, `scripts/run-engine-tests.mjs`.

## 2. Luồng dữ liệu

```text
 content/sysdesign/modules/<id>/*          (lesson.md, module.json, quiz, cards, sim, activities)
        │  npm run sd:build   (scripts/build-sysdesign.mjs)
        ▼
 src/data/courses/sysdesign/{curriculum,sims}.json     [sinh ra, không sửa tay]
        │  dynamic import           (features/sysdesign-course/data.ts)
        ▼
 feature: sdLessonBuilder.ts  ──►  ScaleLesson[] / ScaleLessonStep[]  (scene cố định, liveSim spec, attribution)
        │
        │            ┌────────────────────────────────────────────┐
        │            │ sim/engine.ts: createSim, step(dt=100ms)   │
        │            │ ← inputs: LoadKnob, ChaosToolbox, tham số  │
        │            └──────────────┬─────────────────────────────┘
        │                           │ SimFrame mỗi tick (recorder: ring buffer, tua)
        │                           ▼
        │            live/liveSimAdapter.ts: SimFrame → LiveSimFrame, LiveSimSession
        ▼                           ▼
 app: SdMasteryApp (tab learn → SdLearnShell → ScaleWorkbenchLayout(liveSimAdapter))
        │  scene (cố định)             │  LiveSimFrame qua frameSource (getFrame / subscribe)
        ▼                              ▼
 stage: ScaleStageSvg  — vẽ scene một lần; áp LiveSimFrame trong vòng rAF qua ref map
        ▲
        └── activities/ chấm bằng sim/grade.ts → recordCheck/recordQuiz → WpState → saveDurableProgress('sysdesign')
```

Điểm cần nhớ:
- `content/` là nguồn duy nhất; `src/data/courses/sysdesign/` chỉ sinh ra từ `sd:build`.
- `scene` cố định trong suốt một bước (ADR-005). Chỉ frame thay đổi theo tick. PLAN gọi kênh này là `frameRef`/`subscribeFrame`; tên chốt ở 05 §2 là `frameSource: LiveSimSource` (`getFrame()` cho rAF, `subscribe()` cho UI).
- Tiến độ đi qua `WpState` rồi `saveDurableProgress('sysdesign', …)`; backup/cloud sync lấy từ slot này.
- Bản gốc SDC nằm ngoài luồng này (`_source/` không vào `sd:build`).

## 3. Ranh giới module

| Module | Được import | Không được import |
|---|---|---|
| `sim/` | Chỉ TypeScript thuần (và `sim/` khác) | React, DOM, `window`, `src/components/**` (kể cả kiểu), `src/apps/**`, zustand. Không dùng `Math.random`, `Date.now`; dùng `rng.ts` |
| `live/` (adapter) | `sim/`, kiểu `Live*` từ `scale-workbench/types`, React (chỉ `NodeLivePanel`) | `src/apps/**` |
| `activities/` | `sim/`, React, kiểu từ `types.ts`, `src/features/workpath` | `src/components/scale-workbench/**` stage nội bộ, `src/apps/**` |
| `scale/sdLessonBuilder.ts` | Kiểu `ScaleLesson*` từ `scale-workbench/types`, `sim/model` (kiểu) | React |
| `SdLearnShell`, `views/` | feature nội bộ, `ScaleWorkbenchLayout` | `src/apps/**` |
| `ScaleStageSvg` (stage) | Chỉ nhận `scene` và `LiveSimFrame` qua `frameSource` (kiểu ở `scale-workbench/types.ts`) | `sim/engine`, `sysdesign-course/**`. Stage không biết engine |
| `src/apps/sdmastery/` | `src/features/sysdesign-course`, component dùng chung | Nội bộ của app khác |
| `scripts/*.mjs` | Node, `yaml`, esbuild (qua vite) | Code trong `src/` trừ khi bundle qua esbuild như `run-engine-tests.mjs` |

Hệ quả: engine test được độc lập bằng `npm run sd:test` mà không cần trình duyệt; đổi engine không buộc đổi stage; stage vẫn dùng được cho app khác nếu họ tạo `SimFrame`.

Quy tắc phụ thuộc (mũi tên = "được import"): `apps/sdmastery → features/sysdesign-course (views, shell, activities, live) → sim`. `components/scale-workbench` không phụ thuộc `features/sysdesign-course`; feature cấp `LiveSimAdapter` cho workbench qua prop.

## 4. Quy ước đặt tên và id

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| App id | `sdmastery` | `LearningAppId` |
| Course/slot id | `sysdesign` | `saveDurableProgress('sysdesign', …)`, `src/data/courses/sysdesign/` |
| Module id | `S<level>-<nn>`; level 0..7 (0–6 theo 7 phase SDC, 7 = Case Studies), `nn` hai chữ số. Bài SDC giữ số thứ tự bài gốc; bài bổ sung nhận số tiếp nối (02 §1) | `S1-03`, `S0-01`, `S7-01` |
| Thư mục module | `<id>-<slug-kebab>` | `S1-03-data-flow-and-bottlenecks` |
| Activity, quiz, card, sim | `<id>.A<n>`, `<id>.q<n>`, `<id>.c<n>`, `<id>/<tên>` | `S1-03.A5`, `S1-03/ramp` |
| Tab id | `learn`, `lab`, `warroom`, `cases`, `atlas`, `interview`, `credits` | |
| Prefix code | `Sd` cho component/hook/store (`SdLearnShell`, `useSdStore`, `SdHeader`) | |
| Logo | `SdMasteryLogo` | `AppLogos.tsx` |
| Config | `SD_MASTERY_CONFIG` | `appRegistry.tsx` |
| npm scripts | `sd:build`, `sd:doctor`, `sd:test` | |
| Branch | `feat/sdmastery` | |
| Task id | `T<milestone>.<n>` | `T1.3` |

Chương trình chốt: 74 bài = 40 SDC + 22 bổ sung từ chủ đề DTS + 12 tự thêm (★), level 0–7; danh sách và id ở `02-curriculum.md` (ADR-010). Cursor mặc định trong `useWorkbenchStore`: `{ moduleId: 'S0-01', stepIndex: 0 }`.

## 5. Điểm chạm vào code dùng chung

> **Số dòng ghi tại 2026-11-26. Kiểm tra lại trước khi sửa** (mở file, tìm đúng ký hiệu). Các file đang có thay đổi dở phải được commit trước (T0.0).

### 5.1 Đăng ký app (T1.3)

| File | Vị trí | Việc làm |
|---|---|---|
| `src/apps/appRegistry.tsx` | AppConfig Redis 210-255 (mẫu) | Thêm `SD_MASTERY_CONFIG` (id, name, icon, iconColor, render, defaultSize 1280×820, minSize 320×420, launchMode `single`, contextMenu, menuBarMenus "Công cụ" + "Chuyển mục" `tab:<id>` ⌘1..7) |
| `src/apps/appRegistry.tsx` | `LearningAppId` 257-262 | Thêm `'sdmastery'` |
| `src/apps/appRegistry.tsx` | `ALL_LEARNING_APPS` 264-270 | Thêm vào danh sách (thứ tự launcher) |
| `src/apps/appRegistry.tsx` | `switchLearningApp` 272-314 (ternary chọn config ~277-286) | Thêm nhánh `sdmastery` |
| `src/App.tsx` | 117-126 (dock pin list); 198 (apps prop) | Thêm app vào dock |
| `src/components/common/AppLogos.tsx` | Redis 266-317 (mẫu; viewBox 120, `useSvgId`) | Thêm `SdMasteryLogo`, gradient khớp `iconColor` |
| `src/stores/useWorkbenchStore.ts` | 69-82 | Cursor mặc định `{moduleId:'S0-01',stepIndex:0}`, `expandedLevels`; persist key `lg_scale_workbench_v1` |
| `src/index.css` | 81-102 phụ thuộc root class; biến `--dts-<accent>-*` | Dùng accent `cyan` có sẵn hoặc thêm bộ `--dts-*` mới (cả light và dark) |

Root class của app phải là `pylearn-root dts-shell @container/app` kèm `pylearn-light dts-light` hoặc `pylearn-dark dts-dark` (như `RedisMasteryApp.tsx`).

### 5.2 Slot lưu trữ và đồng bộ (T1.2)

| File | Vị trí |
|---|---|
| `src/db/durableProgressStorage.ts` | 12 (`ProgressSlotId`), 22-28 (`LOCAL_MIRROR_KEYS`), ~326-336 (`inflightQueues`) |
| `src/db/cloudSyncService.ts` | 22 (`ALL_PROGRESS_SLOTS`) |
| `src/db/backupService.ts` | 29, 113 |
| `src/stores/useCloudSyncStore.ts` | import ~35; 3 switch ~96 / 126 / 143 |
| `src/components/layout/SettingsModal.tsx` | import ~25; state ~41-42; hydrate ~101; danh sách slot ~493; chuỗi liệt kê app ~229 / 248 |

IndexedDB `course_state` khoá theo `courseId`, nên không đổi schema.

### 5.3 Stage và workbench (M3, T3.1–T3.6; T4.1 chèn `ActivityGate`)

| File | Vị trí | Việc làm |
|---|---|---|
| `src/components/scale-workbench/types.ts` | `PacketKind` 132; `StageRenderMode` 268; `ScaleLessonStep` 281; `ScaleModuleLesson` 304 | T3.1: thêm `'live-sim'`; `PacketKind` + `retry`/`timeout`/`dropped`; kiểu `Live*` (`LiveSimFrame`, `LiveSimSource`, `LiveSimSpec`, `LiveSimAdapter`…); `ScaleLessonStep.liveSim/activityId/activityGate`; **`ScaleModuleLesson.attribution?`** (dòng nguồn, 01 §3.2) |
| `src/components/scale-workbench/i18n.ts` | kiểu `packets: Record<PacketKind,string>` 69; giá trị VI 154, EN 245 | T3.1: nhãn 3 packet mới (bắt buộc, nếu không `tsc` đỏ); T3.4/T3.5: nhóm `live` (05 §7) |
| `src/components/scale-workbench/ScaleStageSvg.tsx` | props 996-1003; `camRef` 1065; reset camera khi `scene` đổi 1099-1105 | T3.3: thêm prop `frameSource` (kênh frame riêng), `renderLiveSlot`, `pickMode`, `onPacketPick`; đổi điều kiện reset camera sang khoá cấu trúc |
| `ScaleStageSvg.tsx` | vòng packet rAF 1880-1909; vòng packet thứ hai 1938-1970 | Áp `SimFrame`; sửa lỗi packet chạy x2 (cộng dt hai lần) |
| `ScaleStageSvg.tsx` | `renderNodeBody` 2049+ (chỉ `block` vẽ loadPct 2221-2260; db/device/crowd bỏ qua) | Overlay trạng thái và `loadPct` cho db/device/crowd |
| `ScaleStageSvg.tsx` | layers: floor 2804, links 2886, packets 2968, exiting 3019, ents 3035, link-labels 3072, note-card 3121 | Packet pool trong `layer-packets` (2968); queue pile sau `layer-ents` (3035) |
| `ScaleWorkbenchLayout.tsx` | props 149-161; cursor store 207-222; `isPlaying/replayNonce` 224-225; phím 438-467 (Space/R 456-463) | Dùng lại phím; thêm clock |
| `ScaleWorkbenchLayout.tsx` | `LegendDot` 124-142 (switch theo `PacketKind`, không có `default`) | T3.1: thêm 3 kind mới |
| `ScaleWorkbenchLayout.tsx` | `legendKinds` useMemo 496 sau `return null` 480 | T3.1: **sửa** vi phạm rules of hooks (F3, 05 §3.7) |
| `ScaleWorkbenchLayout.tsx` | stage 1133-1184 (renderer ternary 1134-1183); controls 1054-1129; stepper 1188-1245; cột phải 1300-1539 | T3.6: nhánh `live-sim`; `SimTimeline` giữa stage (1184) và stepper (1188); gắn controls; prop `liveSimAdapter`; render `attribution` cuối cột phải; T4.1: chèn `ActivityGate` trước objectives (~1423) |
| `StageEntityInspector.tsx` | `StageEntityInspectorCard` 441+; `StageInspectorPortal` 532-642; `resolveFallbackInspector` 399-439 | T3.5: thêm `liveSlot` (số liệu, sparkline từng node) |

Rủi ro hồi quy: Redis, K8s, CI/CD, PMP, Python cùng dùng stage này. Bước không có `liveSim` phải chạy y hệt trước đây (T3.7 kiểm).

### 5.4 Trạng thái học (`WpState`) — dùng chung với mọi app

| File | Vị trí | Việc làm |
|---|---|---|
| `src/features/workpath/types.ts` | `interface ExerciseRecord` 111-121 | T4.1: thêm `best?: number; stars?: 0\|1\|2\|3` (tuỳ chọn, không phá dữ liệu cũ; 06 §6.2) |
| `src/db/durableProgressStorage.ts` | `mergeWpStates` 116; nhánh `exercises` 175-197 (sao chép tường minh từng field) | T4.1: giữ `best`/`stars` khi hợp nhất (lấy max). Cùng file với T1.2 (slot) ⇒ hai task tuần tự |

`mergeWpStates` được mọi store gọi (workpath, devops-course, pmp-course, `cloudSyncService`, `backupService`) và có test ở `src/features/devops-course/engine/__tests__/engine.test.ts`; T4.1 phải chạy `npm run course:test` để xác nhận không hồi quy.

### 5.5 Khác

| File | Việc làm |
|---|---|
| `package.json` | Thêm `sd:build`, `sd:doctor`, `sd:test` (T1.4) cạnh các script `course:*`, `pmp:*` |
| `src/data/glossary/devopsAndPmpData.ts` | Gắn glossary vào `TermPopover` (T7.4) |
| `docs/scale-workbench-guidelines.md`, `content/README.md` | Đã bổ sung mục System Design (T0.4) |

## 6. Danh sách tái sử dụng (không viết lại)

| Thứ | Vị trí |
|---|---|
| Workbench và stage | `src/components/scale-workbench/`: `ScaleWorkbenchLayout`, `ScaleStageSvg`, `StageEntityInspector`, `ScaleCommandPalette`, `ScaleAppHeader`, `BlueprintMarkdown` |
| Trạng thái học và Leitner | `src/features/workpath/`: `WpState`, `rateCard` (`BOX_DAYS` 1/2/4/8/16 ở `logic.ts:35`), `gradeQuestion`; kiểu `WpState/WpQuestion/WpCard` ở `types` |
| Lưu bền | `saveDurableProgress` ở `src/db/durableProgressStorage.ts` |
| Ghi chú và thuật ngữ | `NotesDrawer`, `TermPopover` ở `src/components/common/`; `src/db/notesRepo.ts` |
| Mẫu feature | `src/features/pmp-course/` (types, store, data, logic, `PmpLearnShell`, views `PmpQuizView`, `PmpFlashView`, `PmpRoadmapView`) |
| Mẫu app shell | `src/apps/redismastery/RedisMasteryApp.tsx` (+ `RedisHeader`, `RedisMobileBottomNav`, `useRedisStore`) |
| Mẫu builder bài | `buildPmpScaleLessons` tại `src/features/devops-course/scale/courseLessonBuilder.ts:1014` |
| Mẫu build/doctor/test | `scripts/build-pmp.mjs`, `scripts/pmp-doctor.mjs`, `scripts/run-engine-tests.mjs` (bundle một entry bằng esbuild, alias `@`→`src`, `node:assert/strict`, hàm `test()` tự viết; esbuild có qua vite, không khai báo trực tiếp) |

Không dùng: `src/db/srsRepo.ts` (chỉ Python dùng; ADR-009). Không có thư viện chart: sparkline và đồ thị tự vẽ SVG.
