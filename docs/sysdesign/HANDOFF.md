# HANDOFF — Tiếp quản dự án System Design Mastery (`sdmastery`)

> Viết ngày 2026-11-26 cho agent tiếp quản (Gemini). Người viết: Claude (điều phối viên ở giai đoạn M0–M3).
> Đọc hết file này trước khi sửa bất kỳ dòng code nào. File này là điểm vào; chi tiết nằm ở các docs được trỏ tới.

---

## 1. Dự án là gì (30 giây)

Learning Gate là một app React 19 + Vite + zustand + Tailwind 4, chạy nhiều "learning app" trong một desktop ảo (`@sonth87/device-layout`). Đã có 5 app: Python, Docker & K8s, CI/CD, PMP, Redis. Ta đang thêm app thứ 6: **System Design Mastery**.

Điểm khác biệt của app này: **mô hình hóa chạy được**. Không chỉ sơ đồ tĩnh, mà có engine mô phỏng theo thời gian (tải tăng thì thành phần nghẽn, lỗi lan, hồi phục), người học tự tác động (kéo tải, tiêm lỗi, chỉnh tham số, tua timeline) và làm bài tập có chấm điểm. Vòng học: Xem → Đoán → Phá → Sửa → Giải thích.

- **Nội dung đọc** chuyển thể từ System Design Core (SDC, tác giả Steve / `steve-bang`, **đã đồng ý cho dùng** — ADR-014). Bản gốc nằm ở `content/sysdesign/_source/sdc/` (chỉ đọc).
- **Mô hình/scene** đối chiếu với designed-to-scale.vercel.app (DTS) — **chỉ tham chiếu**, tự dựng, không chép lời/scene/số liệu (ADR-004). Thẻ đối chiếu: `docs/sysdesign/reference/dts-models.md`.
- Ngôn ngữ: nội dung bài **tiếng Việt trước**; UI/telemetry/inspector song ngữ vi/en.

Id: app `sdmastery`, course/slot `sysdesign`, bài `S<level>-<nn>` (ví dụ `S1-03`). Chương trình chốt: **74 bài, level 0–7** (`docs/sysdesign/02-curriculum.md`).

---

## 2. Trạng thái tại thời điểm bàn giao

Branch làm việc: **`feat/sdmastery`** (chưa push lên remote). Người dùng cũng commit việc riêng của họ lên branch này (ví dụ `f42d8e1` sửa nội dung Python) — luôn `git pull --rebase`/rebase trước khi merge, không đụng file không thuộc phạm vi.

### 2.1 Đã xong và đã merge vào `feat/sdmastery`

| Mốc | Nội dung | Commit chính |
|---|---|---|
| M0 | Bộ docs `docs/sysdesign/` (vision, nguồn, curriculum 74 bài, kiến trúc, spec engine/stage/activities, hướng dẫn biên soạn, workflow, TASKS, DECISIONS ADR-001..017, thẻ DTS) | `0ba5606` + các commit docs sau |
| T1.2 | Slot lưu trữ `sysdesign` (durable storage, cloud sync, backup, SettingsModal) | `189c468` |
| T1.4 | `npm run sd:build`, `sd:doctor`, `sd:test` (+ `scripts/lib/sysdesign-content.mjs`) | `3634e53` |
| T1.5 | `scripts/import-sdc.mjs` + 47 file SDC gốc tại commit `fe4234da…` + `manifest.json` | `4a6b9b0` |
| T1.1a–c | Feature module `src/features/sysdesign-course/` (types, store, data, logic, credits, SdLearnShell, views Home/Roadmap/Module/Quiz/Flash/Credits, `scale/sdLessonBuilder.ts`, `scale/sdSceneBuilder.ts`) | `e497895`, `c0bcde4`, `b9a355d` |
| T1.3 | App shell `src/apps/sdmastery/`, đăng ký registry/dock/logo, 7 tab (learn, credits làm thật; lab/warroom/cases/atlas/interview là placeholder) | `cd6e3e0` |
| T2.1–T2.3, T2.7a | Engine mô phỏng thuần TS `src/features/sysdesign-course/sim/` (types, model/compile, rng, profiles, events, engine, latency, cache, primitives, packets) + 41 test bất biến | `a2745ba`…`fc40a01` |
| Sửa builder | Bỏ fallback "code-trace" (khung IDE) cho bước không phải code; dựng memory-2d; scene kế thừa; doctor quy tắc 20–21 | `5ff8349` |
| Bài S1-03 | Bài thật 11 bước chuyển thể từ SDC phase-1/lesson-3, `stage.json`, `sim.json` (`S1-03/ramp`), 6 quiz, 7 card, test neo số liệu | `a5c3b37` |

| T2.4–T2.7, T2.9 | Engine phần 2: `recorder.ts` (ring buffer cột, checkpoint 5 s, `scrub`, ghi đè tương lai), `analyze.ts` (bottleneck, `maxSustainableRps`, SPOF), `hashing.ts`, `grade.ts` (`Constraint`, `evaluate`, `simulate` headless), `trace.ts` (`traceRequest` waterfall); đủ bất biến I1–I22 | `559ee2a`…`734f198` |
| T3.1–T3.3 | Stage live-sim (code dùng chung): kiểu `Live*` trong `scale-workbench/types.ts`, `PacketKind` + `retry/timeout/dropped`, `live/useSimClock.ts` + `simClockMath.ts`, `ScaleStageSvg` prop `frameSource` (overlay trạng thái mọi shape, queue pile, packet pool ≤200, breaker gate, lag marker, `liveSlot`, `pickMode`) qua `live/liveStageApplier.ts` + `live/liveFrameMath.ts`; sửa **F1** packet chạy ×2, **F2** reset camera theo khoá cấu trúc, **F3** thứ tự hook `legendKinds` | `2d8e535`…`341a0fa` |

Trạng thái kiểm tra tại **`341a0fa`** (HEAD lúc bàn giao): `npm run build` xanh; `sd:build` 1 module (6 quiz, 7 card, 1 sim); `sd:doctor` **0 lỗi 0 cảnh báo**; `sd:test` **7/7 file** (gồm test stage live ở `src/components/scale-workbench/live/__tests__/`); `course:doctor`, `course:test` (15 test), `pmp:doctor` xanh. Không còn worktree/nhánh agent nào dở dang.

### 2.2 Chưa làm của M2/M3

- **T2.8** review engine (chưa ai làm).
- **T3.4–T3.6**: timeline, controls, nối vào `ScaleWorkbenchLayout` → hiện **chưa có chỗ nào trong app dùng `frameSource`**; live-sim mới chạy được trong test/harness. Bài S1-03 bước 6, 9 vẫn hiển thị tĩnh.
- **T3.7**: kiểm hồi quy bằng mắt 5 app cũ (F1 làm packet chạy **chậm đi một nửa so với trước** — đây là tốc độ đúng — và chỉ hiện sau khi đường nối vẽ xong; cần người dùng xác nhận chấp nhận).

---

## 3. Đọc theo thứ tự này

1. `docs/sysdesign/README.md` — mục lục.
2. `docs/sysdesign/DECISIONS.md` — ADR-001..017 (đừng làm ngược các quyết định này; muốn đổi thì thêm ADR mới).
3. `docs/sysdesign/TASKS.md` — bảng việc, phụ thuộc, tiêu chí nghiệm thu. **Nguồn sự thật về việc cần làm.**
4. `docs/sysdesign/08-workflow.md` — Definition of Done, checklist review, file dùng chung.
5. Theo việc đang làm: `04-simulation-engine.md` (engine), `05-live-stage.md` (stage live-sim), `06-activities-and-grading.md` (bài tập), `07-content-authoring.md` + `02-curriculum.md` + `reference/dts-models.md` (nội dung).
6. Quy chuẩn chung của repo: `docs/scale-workbench-guidelines.md` (đặc biệt §1 chọn chế độ sân khấu, §5 văn phong) và `content/README.md`.
7. Bài mẫu đã xong để bắt chước: `content/sysdesign/modules/S1-03-data-flow-and-bottlenecks/`.

---

## 4. Quy tắc bắt buộc

1. **Nội dung bài phải bám SDC.** Chuyển thể từ `content/sysdesign/_source/sdc/phase-*/lessons/*.mdx` theo quy trình 13 bước của `07-content-authoring.md`; biên tập tay (bỏ giai thoại ngôi thứ nhất, giảm trộn Anh-Việt, tiêu đề trực diện); ghi `source` đúng schema `01-sources-and-credits.md` §3.1. Bài không có nguồn SDC (chủ đề chỉ DTS có hoặc ★) thì `source.kind: "original"`.
2. **Mô hình đối chiếu DTS nhưng tự dựng.** Không chép câu chữ, dữ liệu scene, số metric của DTS. Số liệu trong bài lấy từ engine của mình.
3. **Không dùng khung IDE/code-trace cho bước không phải code.** Người dùng đã phản hồi trực tiếp về việc này. Mỗi bước dùng scene isometric hoặc memory-2d; chỉ `mode: code` khi bước có code thật. Doctor (quy tắc 20–21) chặn vi phạm.
4. **Văn phong** theo `docs/scale-workbench-guidelines.md` §5: giữ thuật ngữ EN, không ẩn dụ trên tiêu đề, không từ y khoa/quân sự hóa (doctor có danh sách từ cấm).
5. **`sim/` là TypeScript thuần**: không import React/DOM/`@/components`/`@/apps`/`@/stores`, không `Math.random`/`Date`; deterministic theo seed. Không nới test để cho qua — sửa engine, hoặc sửa spec 04 kèm ghi chú `[cập nhật Tx.y: lý do]`.
6. **Workbench không import feature.** `src/components/scale-workbench/*` chỉ biết kiểu `Live*` của chính nó; adapter nằm ở `src/features/sysdesign-course/live/`.
7. **File dùng chung 6 app** (`src/components/scale-workbench/*`, `src/features/workpath/types.ts`, `src/db/durableProgressStorage.ts`, `src/apps/appRegistry.tsx`, …; danh sách đủ ở `08-workflow.md` §6): sửa tuần tự, giữ tương thích ngược tuyệt đối, kiểm hồi quy app cũ.
8. **Không sửa** `content/sysdesign/_source/**` (doctor so sha256 với manifest), không sửa tay `src/data/courses/sysdesign/*.json` (sinh bởi `sd:build`).
9. **Không đụng việc riêng của người dùng** (hiện họ hay sửa `src/data/curriculum/*`, `src/data/glossary/*`, `src/data/workpath/*`). Commit chỉ file của mình (`git add <đường dẫn cụ thể>`).
10. **Không push** khi người dùng chưa yêu cầu.
11. **Cổng duyệt ADR-008:** không nhân rộng nội dung (M6/M7) trước khi người dùng ghi "duyệt" bài mẫu S1-03 (T5.5).
12. Không báo "đã kiểm UI" nếu chưa thật sự mở trình duyệt và nhìn. Ghi rõ "chưa kiểm bằng mắt" khi đúng là vậy.

---

## 5. Lệnh và Definition of Done

```bash
npm run build                  # tsc -b && vite build — phải xanh
npm run sd:build               # content/sysdesign → src/data/courses/sysdesign/*.json
npm run sd:doctor              # phải 0 lỗi; cảnh báo phải giải thích được
npm run sd:test                # tự tìm src/features/sysdesign-course/**/__tests__/*.test.ts
npm run course:build && npm run course:doctor && npm run course:test   # không hồi quy K8s/CI-CD/Redis
npm run pmp:doctor             # không hồi quy PMP
npm run dev -- --port 5199 --strictPort   # chạy thử UI
```

- `npm run lint` hiện **không chạy được** (repo chưa cài `eslint`: `eslint: command not found`). Đừng coi đó là lỗi của bạn; nếu người dùng đồng ý cài eslint thì thêm baseline.
- Một task "xong" khi: đạt tiêu chí nghiệm thu trong TASKS.md, mọi lệnh trên xanh, docs liên quan đã cập nhật, 1 commit gọn với message `feat(sdmastery): T<x.y> — …` (hoặc `fix(...)`, `content(sdmastery): S<id> — …`, `docs(sdmastery): …`), và cập nhật cột Trạng thái trong `TASKS.md` (`done (<hash>)`).
- Sau khi người dùng duyệt UI thì mới đánh dấu các mục "kiểm bằng mắt".

---

## 6. Việc tiếp theo (đúng thứ tự)

Chi tiết từng task (file chạm, nghiệm thu) ở `TASKS.md`. Tóm tắt:

1. **Quyết vấn đề SLO p99 của S1-03** (xem §7 mục đầu) cùng người dùng hoặc theo đề xuất, trước khi viết activity fix-challenge.
2. **T2.8** — review engine: đối chiếu xu hướng với lý thuyết hàng đợi; ghi giới hạn mô hình vào 04 (đọc các ghi chú `[cập nhật T2.x]` và §11 của 04).
3. **T3.4** `SimTimeline` (thanh tua, sparkline SVG tự vẽ — repo không có thư viện chart, mốc sự kiện) + `LiveTelemetryStrip`.
4. **T3.5** controls: `LoadKnob`, `ChaosToolbox`, `KnobPanel`, `RequestTracer` (waterfall từ `sim/trace.ts`), `liveSlot` trong inspector, `NodeLivePanel`.
5. **T3.6** nối vào `ScaleWorkbenchLayout.tsx` (nhánh renderer `live-sim`, prop `liveSimAdapter`, dòng `attribution` cuối cột phải), `src/features/sysdesign-course/live/liveSimAdapter.ts`, `sdLessonBuilder` điền `liveSim`/`activityId`/`attribution`, phân giải biến telemetry `{node.field@t:dp}`. **Kèm sửa**: nút "Code thật"/sandbox của workbench đang hiện đoạn Python "Hello" mặc định cho bài System Design — với course `sdmastery` phải ẩn hoặc thay bằng nội dung phù hợp.
   Nghiệm thu chính: ở bài S1-03 bước 6 (`live: ramp`) kéo tải thấy DB chuyển vàng → cam → đỏ, hàng đợi dồn, tua timeline được; bước 9 (`live: trap`) thêm App không cứu được hệ thống.
6. **T3.7** — kiểm hồi quy 5 app cũ theo `05-live-stage.md` §9 (danh sách bài cụ thể ở đó): animation rơi nảy, morph, packet không chạy ×2, inspector hover/click như cũ. Cần người dùng nhìn bằng mắt.
7. **M4 (T4.1–T4.7)** — activities + chấm điểm (`06-activities-and-grading.md`): `ActivityGate`, các dạng predict, spot-bottleneck, tune-to-limit, estimate, fix-challenge, order, timeline-read, postmortem, design-constraint; lưu vào `WpState.exercises` (ADR-011, cần thêm `best`/`stars` vào `ExerciseRecord` và sửa nhánh `exercises` của `mergeWpStates`); T4.6 nối doctor chạy engine kiểm activity.
8. **M5 phần còn lại** — T5.2 (tracer cho S1-03), T5.3 `activities.json` A1–A6 cho S1-03 (gắn vào bước 5, 6, 8, 9), T5.4 review, **T5.5 cổng duyệt của người dùng**. Dừng lại chờ người dùng duyệt.
9. Sau "duyệt": **M6** theo 15 batch ở `02-curriculum.md` §6 (batch 1: S1-07, S1-04, S1-01, S1-02, S1-06), **M7** các tab mở rộng (Lab, War-Room, Cases, Atlas, Interview), **M8** (bản EN, A/B compare…).

---

## 7. Vấn đề đã biết / bẫy

- **SLO p99 của S1-03 không phân biệt được lời giải đúng/sai (cần quyết trước T4.4/T5.3).** p99 trong engine chỉ tính request **thành công**, nên ở S1-03 p99 không vượt ≈194 ms dù 53% request lỗi → điều kiện "p99 ≤ 300 ms" luôn đạt, kể cả bản gốc và bẫy "thêm App". Hiện chỉ ràng buộc tỉ lệ lỗi phân biệt được. Hai hướng: (a) thêm chỉ số p99 có tính cả lỗi/timeout vào `GlobalMetrics` và dùng nó cho SLO (đề xuất — trực quan hơn cho người học); (b) hạ SLO xuống ≈100 ms kèm `allowViolationPct` (preset sửa đúng đạt ≈106 ms). Ghi lựa chọn vào DECISIONS.md và cập nhật 04 §10, 06 §3, `sim.json` của S1-03.
- **Các quy ước engine mới** (đã ghi trong 04 với `[cập nhật T2.x]`): SPOF báo cả node lá quan trọng (Tarjan thuần không bắt `db`); `NO_RATE_LIMIT_AT_EDGE` mức `warn`; bottleneck ưu tiên `hot-shard` trước `saturated`; `setInput` chỉ ghi log, `step()` mới áp; `traceRequest` gán `culpritNodeId` cho chặng timeout; `PACKET_SCALE_MAX = 1 000 000`; `maxSustainableRps` nên gọi ở tải ổn định (đã gồm retry).
- **messageKey chưa có bản dịch**: constraint trả `grade.<kind>.pass|fail`, cảnh báo trả `sim.warn.<CODE>` — lớp view (T3.5/T4.x) phải ánh xạ sang chuỗi vi/en.
- **Stage live chưa kiểm bằng mắt trong app thật**: agent đã kiểm bằng Chrome headless trên trang harness tạm (không commit) — DB đổi trạng thái, thanh tải, queue pile, breaker, chỉ 1 lần render React trong 9 s. Chưa kiểm màu overlay theo theme sáng/tối, `liveOptions.focus` chưa cài, khoá i18n `live.inspector.title` chưa thêm, chưa có IntersectionObserver.
- **Runner `sd:test`** tìm test ở `src/features/sysdesign-course/**/__tests__/` **và** `src/components/scale-workbench/live/**/__tests__/`.
- **Worktree của công cụ có thể tách từ `main`** thay vì `feat/sdmastery` → luôn `git reset --hard feat/sdmastery` (khi cây sạch) trước khi làm.
- **p99 không "vọt" như mô tả cũ**: engine chỉ tính p99 của request thành công, nên ở S1-03 p99 tăng 64 → 143 ms rồi **tỉ lệ lỗi** bùng lên 53% ở t≈40 s. Bài S1-03 viết theo số đo thật; `02-curriculum.md`/`04` có chỗ còn mô tả "p99 dựng đứng" — sửa cho khớp khi gặp.
- **Bước 6 và 9 của S1-03** hiện là scene tĩnh (chờ T3.6). Telemetry đang là số tĩnh khớp engine (biến `{…}` chưa phân giải).
- **Bước 4 của S1-03** dùng `mode: code` (có code APM/EXPLAIN thật) — hợp lệ theo quy tắc; nếu người dùng vẫn không thích khung code thì chuyển sang scene.
- **`attribution`**: dòng nguồn hiện hiển thị ở `SdModuleView`; field `ScaleModuleLesson.attribution` đến từ T3.1, hiển thị trong workbench ở T3.6.
- **Ngưỡng bất biến I4** đã nới từ <5% lên <10% (có lý do ghi trong 04). `packetScale` chưa có trần rõ (T2.7 xử lý).
- **Cursor mặc định** `S0-01` chưa có bài → workbench tự rơi về bài đầu (đã kiểm bằng đọc code).
- **Doctor chưa chạy engine** để kiểm `expect`/preset/activity (T4.6). Hiện số liệu S1-03 được neo bằng `src/features/sysdesign-course/__tests__/content-s1-03.test.ts`.
- **Chưa agent nào kiểm UI bằng mắt**; người dùng đã mở app và phản hồi về khung IDE (đã sửa ở `5ff8349`).

---

## 8. Quyết định đang chờ người dùng

| Việc | Hạn | Đề xuất |
|---|---|---|
| SLO p99 của S1-03 (§7): p99 tính cả lỗi, hay hạ ngưỡng | Trước T4.4 / T5.3 | Thêm p99 tính cả lỗi |
| Chấp nhận packet chạy đúng tốc độ (chậm hơn trước một nửa) ở 5 app cũ sau sửa F1 | Khi kiểm T3.7 | Chấp nhận (tốc độ cũ là lỗi) |
| Phạm vi "mô phỏng sự kiện" (partition, Raft, clock — 13 bài, chủ yếu level 3; `04` §12) | Trước batch 4 của M6 (T6.0a) | Engine sự kiện rời rạc nhỏ ở `sim/timeline/`; Raft chỉ bầu leader + quorum ghi |
| Nhóm Security & Shipping (S6-08..S6-12) giữ ở level 6 hay tách level 8 | Trước batch 12 | Giữ level 6 |
| Cài `eslint` vào devDependencies | Bất kỳ lúc nào | Cài để có thêm lớp kiểm tra |
| Duyệt bài mẫu S1-03 (T5.5) | Sau M3+M4+M5 | — |

---

## 9. Cách làm việc với người dùng

- Người dùng nói tiếng Việt, thích báo cáo ngắn, trực diện, có kết quả kiểm tra thật.
- Họ chú trọng **mô hình hóa trực quan** và trải nghiệm học tương tác, không thích nội dung "tự nghĩ ra" khi đã có nguồn.
- Khi xong một mốc: báo cái gì đã xong, kiểm tra gì (kèm dòng tổng kết lệnh), cái gì chưa kiểm được, và việc cần họ quyết.
