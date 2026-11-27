# BRIEF — ngữ cảnh gốc cho dự án System Design Mastery (sdmastery)

> File này là ngữ cảnh thô tổng hợp từ phiên lập kế hoạch (2026-11-26). Các tài liệu chính thức trong `docs/sysdesign/` được viết dựa trên file này. Plan đã duyệt: `docs/sysdesign/_brief/PLAN.md`.

## 1. Nguồn nội dung

### 1.1 System Design Core (SDC) — nguồn nội dung đọc
- Web: https://www.systemdesigncore.site/roadmap — Tác giả: Steve (GitHub `steve-bang`). Tiếng Việt.
- Repo: https://github.com/steve-bang/systemdesigncore — commit đã khảo sát: `fe4234da7d6fe719e8e18547856fc0a730155420` (2026-02-18).
- Nội dung: `content/phases/phase-<n>/index.mdx` + `content/phases/phase-<n>/lessons/*.mdx` (53 file MDX ~970KB gồm cả blog/docs). Raw URL: `https://raw.githubusercontent.com/steve-bang/systemdesigncore/<sha>/<path>`.
- Giấy phép: README repo ghi "This project is licensed under the MIT License" nhưng KHÔNG có file LICENSE và phần Author của README còn placeholder template ("Your Name"); footer web ghi "© 2026 System Design Core. All rights reserved." → mâu thuẫn. Người dùng sẽ tự liên hệ tác giả sau. Trong lúc đó: dùng theo điều kiện MIT, ghi nguồn từng bài + trang Credits, giữ ghi chú MIT; nếu tác giả phản đối thì rút nội dung gốc (phần mô phỏng/bài tập của mình giữ nguyên).
- Hình thức: bài viết dài kiểu blog, mở đầu bằng giai thoại ("Tôi còn nhớ lần đầu…"), Mermaid tĩnh, code block, bài tập tự làm trên giấy. Văn phong trộn Anh-Việt nhiều ("game changer", "Problem solved"). Không có tương tác/chấm điểm.
- Danh sách bài (path trong repo `content/phases/`):
  - phase-0 Mental Model Shift: lesson-1-code-first-to-problem-first; lesson-2-perfect-solution-to-trade-off-thinking; lesson-3-foundation-exercises (Components & Communication); lesson-4-thinking-in-constraints; lesson-5-scale-intuition; lesson-6-system-thinking-framework; lesson-7-system-question-framework; lesson-8-mental-model-recap
  - phase-1 Foundation: lesson-1-components-trong-he-thong-web; lesson-2-communication-patterns (sync/async); lesson-3-data-flow-and-bottlenecks; lesson-4-cac-khai-niem-quan-trong (latency/throughput/availability/CAP); lesson-5-bai-tap-tong-hop
  - phase-2 Core Building Blocks: lesson-1-load-balancing; lesson-2-caching; lesson-3-database (scaling); lesson-4-message-queues-async-processing-decoupling-services; lesson-5-integration-trade-off-thinking
  - phase-3 Distributed Fundamentals: lesson-1-reality-of-distributed-systems (failure models, CAP); lesson-2-consistency-models-strong-and-eventual-consistency; lesson-3-consensus-leader-election; lesson-4-distributed-transactions-data-integrity; lesson-5-distributed-id-and-ordering; lesson-6-time-event-ordering-clock-problem-trong-distributed-systems
  - phase-4 Scalability & Performance: lesson-1-performance-bottleneck-thinking; lesson-2-caching-strategy-trade-consistency-de-lay-speed; lesson-3-cdn-and-edge-computing-distributed-cache-gan-user; lesson-4-database-scaling-optimization; lesson-5-rate-limiting-and-load-control; lesson-6-asynchronous-processin-queues; lesson-7-monitoring-observability-performance-debugging
  - phase-5 Real-World Patterns: lesson-1-architecture-evolution-mindset; lesson-2-head-heavy-systems (read-heavy); lesson-3-social-feed-systems
  - phase-6 Mastery: lesson-1-system-design-thinking-framework; lesson-2-snake-framework (Scope→Numbers→API→Key components→Elaborate); lesson-3-trade-offs-and-architecture-decision-making; lesson-4-real-interview-strategy; lesson-5-advanced-architecture-topics; lesson-6-architect-mindset-production-thinking
  - khác: content/blog/*.mdx (4 bài), content/docs/getting-started.mdx, content/docs/interview/preparation.mdx

### 1.2 Designed to Scale (DTS) — nguồn đối chiếu mô hình
- Web: https://designed-to-scale.vercel.app — tác giả Dilum Sanjaya. KHÔNG có giấy phép → chỉ tham chiếu (khái niệm nào dùng mô hình gì, thành phần scene, trình tự bước). Tự dựng scene bằng `StageScene` của mình; KHÔNG chép dữ liệu scene/lời giảng.
- [ĐÃ KHÔNG CÒN — dùng `reference/dts-models.md`] Bundle JS đã tải ở scratchpad: `/private/tmp/claude-501/-Users-skyline-PROJECTS-learning-gate/c69525ff-0ea8-495e-af14-86b3ac110981/scratchpad/dts/main.js` (bài EN nằm inline trong bundle; mỗi bài là object `{id,title,summary,minutes,level,metrics,legend,goals[{text,step}],steps[{short,chapter,title,body[],callout,changes[],metrics,scene{entities,links,flows}}]}`). Nếu mất, tải lại: `curl -sL https://designed-to-scale.vercel.app/ ` → tìm `/assets/index-*.js`.
- Định dạng bước: chapter ∈ setup/problem/solution/technique/tradeoff/insight/recap; callout kind insight/tip/warn; `changes` dạng `+ / ~ / −`; `metrics` CỐ ĐỊNH viết tay từng bước (không tính); scene entity: block(glyph server/balancer/globe…), db, device, crowd, queue, panel(chart bars|hockey), zone, ghost; tags `{text,tone,icon}`; flows `{route[],bounce,rate,kind}`; trạng thái dead/heat/cpu.
- Cấu trúc 9 chương / 40 bài (8–15 phút, ~8–13 bước):
  01 Foundations: request-lifecycle, latency-throughput, napkin-math
  02 Scaling: vertical-horizontal, load-balancing, stateless, caching, cdn
  03 Data & Storage: sql-nosql, indexes, storage-engines, replication, sharding, consistent-hashing, unique-ids, cap, consensus, transactions, files
  04 Communication: apis, queues, pubsub, realtime
  05 Reliability: redundancy, rate-limiting, timeouts-retries, observability
  06 Architecture: microservices, service-discovery, sagas, batch-stream
  07 Security: authentication, authorization, encryption
  08 Shipping: testing, cicd
  09 Whole Systems: hld-lld, design-url-shortener, design-news-feed, design-chat
- Có đề cập: circuit breaker, bulkhead, jitter, idempotency, outbox, hot key/celebrity, Little's Law, hockey-stick, Raft/quorum, Bloom, read-your-writes, linearizability (sơ), websocket. Không có: geohash/quadtree, vector clock/CRDT, multi-region sâu, quiz/bài tập, mô phỏng tham số.

### 1.3 So sánh & định vị
- DTS = lớp CƠ CHẾ (sơ đồ động có kịch bản). SDC = lớp TƯ DUY (khung quyết định, văn bản). Cả hai thiếu lớp LUYỆN TẬP (mô phỏng chạy được, thử thách, chấm điểm) → đó là phần của mình.
- Lưu ý: định dạng bước của DTS gần trùng `ScaleLessonStep` của repo (category, callout, whatChanged, telemetry, crowd/block/db/device, tag DOWN) → giá trị khác biệt phải nằm ở mô phỏng + luyện tập.

## 2. Thiết kế đã thống nhất

### 2.1 Nguyên tắc "một mô hình, nhiều góc nhìn"
Một `SystemModel` (đồ thị có tham số) chiếu ra 8 góc nhìn: Topology (isometric), Flow (sequence + packet), Capacity (ρ gauge, độ dày link theo RPS, đường cong hockey-stick), Data (hash ring, shard map, hot-key heatmap, replication lag), Time & Consistency (lịch sử nhiều client kiểu Jepsen), Failure (blast radius, SPOF, chaos), Trade-off (radar latency/throughput/consistency/availability/cost; CAP/PACELC), Evolution (v1→vN, diff kiến trúc).

### 2.2 Primitive có hợp đồng hành vi
```ts
interface PrimitiveSpec {
  kind: 'client'|'dns'|'cdn'|'lb'|'gateway'|'service'|'cache'|'sql'|'nosql'|'queue'|'log'|'worker'|'blob'|'search'|'rate-limiter'|'coordinator';
  stateful: boolean;
  capacity: { opsPerSec: number; concurrency: number };   // μ, c
  latency: { baseMs: number; jitter: number };            // service time S
  scaling: 'horizontal'|'vertical'|'partitioned';
  failureModes: FailureMode[];      // crash, slow, partition, data-loss, split-brain
  costPerHour: number;
  knobs: Knob[];                    // TTL, replicas, shards, eviction, timeout, retry...
  inspector: StageInspectorInfo;
}
```
Link: latency mạng (cùng AZ / khác AZ / khác region), sync/async, timeout, retry policy, circuit breaker.

### 2.3 Khái niệm → mô hình đặc trưng
Latency numbers → thang log zoom; Throughput/bottleneck → ống nước, chỗ hẹp đỏ; Queueing → W=S/(1−ρ) dựng đứng khi ρ>0.8; Tail latency fan-out → 1−0.99^100=63%; Caching → split theo hit ratio, stampede khi TTL đồng loạt; Replication lag → 2 làn thời gian, read-your-writes; Consistency → Jepsen history + checker; CAP → kéo cắt link giữa 2 DC, chọn CP/AP; Partitioning → hash ring, mod-N dời ~100% vs ring ~1/N; Hot key → heatmap Zipf; Retry storm → vòng phản hồi dương, jitter/backoff dập; Circuit breaker → state machine Closed/Open/Half-open; Idempotency → timeline retry & duplicate; Rate limit → token bucket; Raft → log replication, partition, quorum N/2+1.

### 2.4 Trục thời gian
```ts
interface SimScenario { model: SystemModel; durationSec: number; load: LoadProfile; events: TimedEvent[]; seed: number; }
type LoadProfile =
  | { kind: 'steady'; rps: number }
  | { kind: 'ramp'; from: number; to: number; overSec: number }
  | { kind: 'spike'; base: number; peak: number; atSec: number; holdSec: number }
  | { kind: 'diurnal'; min: number; max: number }
  | { kind: 'custom'; points: [number, number][] };
type TimedEvent =
  | { at: number; type: 'crash' | 'recover'; node: string }
  | { at: number; type: 'slowdown'; node: string; addMs: number }
  | { at: number; type: 'partition'; link: string }
  | { at: number; type: 'cache-expire-all'; node: string }
  | { at: number; type: 'hot-key'; node: string; share: number }
  | { at: number; type: 'deploy'; node: string; version: string; bad?: boolean };
```
UI kiểu video editor: ⏮ ⏯ ⏭, tốc độ 1×/2×/5×, thời gian t, sparkline RPS/p99/Error, đường SLO, mốc sự kiện, kéo để tua. Engine deterministic, lưu snapshot mỗi tick → tua lại.

### 2.5 Máy trạng thái node (engine tính)
| State | Điều kiện | Hình ảnh |
|---|---|---|
| idle | ρ<0.1 | xám nhạt, packet thưa |
| healthy | ρ<0.7 | màu gốc, CPU xanh |
| busy | 0.7–0.9 | ngả vàng |
| saturated | ≥0.9, hàng đợi tăng | cam, hàng đợi chất đống trước node, rung nhẹ |
| overloaded | vượt timeout, có lỗi | đỏ, packet đỏ rơi khỏi đường |
| down | crash/OOM | xám đá, X đỏ, tag DOWN (đã có `dead`) |
| recovering | vừa restart, cache nguội | vòng warming đầy dần |
Link/packet: độ dày ∝ RPS; "1 chấm = N req/s" tự co giãn (≤~200 chấm); màu theo loại: request, response, cache-hit (quay đầu sớm), retry (cam), timeout (mờ dần), dropped (rơi); breaker là cổng trên link; replication lag là khoảng cách 2 vạch.

### 2.6 Engine (fluid model theo tick, thuần TS, deterministic seed)
Mỗi tick (100ms mô phỏng): (1) lan truyền λ theo đồ thị (tách theo hit ratio/routing, nhân theo fan-out, cộng retry); (2) mỗi node ρ=λ/(μ·c); ρ<1 → latency xấp xỉ M/M/c; ρ≥1 → hàng đợi tăng, vượt timeout → lỗi; (3) lỗi sinh retry → λ tick sau tăng (retry storm tự xuất hiện); (4) node có trạng thái giữ state (cache hit ratio nguội sau restart, replication lag tích lũy); (5) xuất RPS, p50/p95/p99, error rate, cost theo node & toàn hệ thống → đổ vào telemetry. Ghi rõ trong app: mô phỏng đúng xu hướng & độ lớn, không đúng số tuyệt đối.
Grader: ràng buộc định lượng (p99<200ms @10k RPS, error<0.1%, cost<$X) + phân tích cấu trúc (SPOF = articulation point, stateful không replica, cache không TTL, sync xuyên region trên hot path, queue không DLQ).

### 2.7 Tương tác của người học
Núm tải (RPS, kiểu profile); Inspector có núm chỉnh (replicas, capacity, TTL, timeout, retry, pool size); Chaos toolbox (kill, slow, cắt link, expire cache, hot key, deploy lỗi); Ô trống để lắp (slot có sẵn trong scene — tránh auto-layout tự do trên isometric); Lần theo 1 request (bấm chấm → waterfall từng chặng); A/B compare; Đổi thuật toán khi đang chạy (LB RR↔least-conn, cache-aside↔write-through, mod-N↔ring).

### 2.8 Học thay vì xem — vòng lặp mỗi bài
Xem (kể chuyện có kịch bản, metric do engine tính) → Đoán trước (bấm node sẽ đỏ trước) → Phá (tiêm lỗi) → Sửa (thử thách: ngân sách, số thay đổi tối đa, mục tiêu SLO; engine chấm) → Giải thích (quiz, SRS, hậu kiểm sự cố).
Dạng bài tập: chỉ ra bottleneck/SPOF; tinh chỉnh tới giới hạn; ước lượng nhanh (±30%); đoán rồi xem; sắp xếp (Raft); đọc timeline (read nào stale); postmortem; thiết kế có ràng buộc.

### 2.9 Biến khung tư duy SDC thành công cụ
Bottleneck 3 bước (đo→tìm→sửa) → tracer + chaos + fix; Khung câu hỏi → bước bắt buộc đầu Design Case, câu trả lời quyết định tham số sim; Thinking in constraints → ràng buộc thử thách; Scale intuition → bài ước lượng, kết quả đưa vào sim; Trade-off → ma trận quyết định với số liệu A/B, lưu ADR vào ghi chú; Architecture evolution → Evolution timeline chạy được; SNAKE → Interview Mode 5 chặng bấm giờ; Clock/ordering → timeline nhiều client (lamport/vector clock).

### 2.10 Lộ trình gộp (D = có ở DTS, S = có ở SDC, ★ = mình thêm)
0 Tư duy hệ thống: problem-first(S), trade-off(S), constraints(S), khung câu hỏi(S), cách đọc mô phỏng★
1 Nền tảng định lượng: request lifecycle(D), latency/throughput & queueing(D,S), Little's Law & tail latency★, napkin math(D,S), bottleneck 3 bước(S)
2 Scale: vertical/horizontal(D), LB(D,S), stateless(D), caching(D,S), CDN/edge(D,S)
3 Dữ liệu: SQL/NoSQL(D), index(D), storage engine(D), replication(D), sharding & hot key(D,S), consistent hashing(D), transactions/isolation(D)
4 Giao tiếp: sync/async(S), REST/RPC/GraphQL(D), queue(D,S), pub/sub(D), realtime(D), back-pressure★
5 Hệ phân tán: failure models(S), CAP/PACELC(D,S), consistency models(S), clock/ordering(S), vector clock/CRDT★, consensus/Raft(D,S), distributed ID(D,S), saga/outbox(D,S), multi-region★
6 Độ tin cậy & vận hành: redundancy(D), rate limit/load control(D,S), timeout/retry/circuit breaker(D), observability(D,S), testing & CI/CD(D), security AuthN/AuthZ/encryption(D), cost★
7 Kiến trúc thực tế: monolith/microservices(D), service discovery(D), batch/stream(D), evolution(S), read-heavy(S)
8 Case studies: URL shortener(D,S), news feed(D,S), chat(D), rate limiter★, notification★, ride-hailing/geo★, video★, payment★, autocomplete★
9 Làm chủ: SNAKE & Interview Mode(S), ADR/ra quyết định(S), chủ đề nâng cao(S)
(~60 bài). LƯU Ý: Plan đã duyệt dùng khung 7 phase của SDC làm xương sống cho id `S<phase>-<nn>`; bảng trên là gợi ý gộp — tài liệu `02-curriculum.md` phải chốt 1 bảng duy nhất, ghi rõ id, nguồn SDC (nếu có), chủ đề DTS đối chiếu (nếu có).

### 2.11 Ví dụ kịch bản bài "Từ 1 server đến 1 triệu user"
1 SETUP 1 VM app+DB, 100 user, p99 40ms ρ5% · 2 PROBLEM 5k user, node đỏ, p99 2.1s ρ97% · 3 TECHNIQUE tách DB, LB + 3 app, p99 120ms · 4 PROBLEM 50k user, DB đỏ, app rảnh (thêm app vô ích) · 5 TECHNIQUE thêm cache 90/10, DB ρ18% · 6 PITFALL TTL đồng loạt → stampede, DB100% lỗi34%, bật jitter/singleflight · 7 TECHNIQUE read replica, góc nhìn Time, lag 800ms, lỗi read-your-writes · 8 MECHANISM sticky read-after-write · 9 RECAP Evolution v1→v5 + radar, cost ×8.

### 2.12 War-Room chạy trên engine
retry storm sau deploy chậm; cascading failure do thiếu timeout; hot partition ngày sale; cache stampede nửa đêm; split brain khi partition; đơn trùng do thiếu idempotency; queue backlog do consumer chậm; DNS TTL chặn failover; connection pool quá nhỏ.

### 2.13 Rủi ro
Phạm vi quá lớn (phải chia giai đoạn, có cổng duyệt bài mẫu); isometric khó cho Canvas Lab tự do (→ Lab dùng lưới 2D vuông góc, cùng SystemModel); engine sai dạy sai trực giác (→ test bất biến); song ngữ tốn công (→ VI trước).

## 3. Quyết định người dùng đã chốt
- Feature module RIÊNG theo mẫu PMP (`src/features/pmp-course`), không đi qua engine DevOps.
- Nội dung tiếng Việt trước; UI/telemetry/inspector song ngữ; EN của bài làm sau.
- Thực thi bằng subagent: Sonnet triển khai, Opus review.
- Bỏ bản nháp tin nhắn gửi tác giả (người dùng tự làm sau).
- Việc đầu tiên: bộ docs đầy đủ trong `docs/sysdesign/`.
- Branch làm việc: `feat/sdmastery`.

## 4. Kết quả khảo sát codebase (tóm tắt, có số dòng tại thời điểm 2026-11-26)

### 4.1 Đăng ký app (mẫu Redis)
- `src/apps/appRegistry.tsx`: AppConfig Redis 210-255 (id, name, icon, rawIcon, fullBleedIcon, iconColor[from,to], render, defaultFullscreen, mobileFullscreen, defaultSize 1280×820, minSize 320×420, hasMenuBar, launchMode 'single', contextMenu, menuBarMenus "Công cụ"(quickSearch/openSettings/close) + "Chuyển mục"(tab:<id> ⌘1..)); `LearningAppId` 257-262; `ALL_LEARNING_APPS` 264-270 (thứ tự launcher); `switchLearningApp` 272-314 (ternary chọn config 277-286 — phải thêm nhánh).
- `src/App.tsx:117-126` dock pin list; `src/App.tsx:198` apps prop.
- `src/components/common/AppLogos.tsx` logo SVG viewBox 120, `useSvgId`, gradient khớp iconColor (Redis 266-317).
- `src/stores/useWorkbenchStore.ts:69-82` cursors/expandedLevels mặc định theo app id; persist key `lg_scale_workbench_v1`.
- `src/apps/redismastery/RedisMasteryApp.tsx`: root class `pylearn-root dts-shell @container/app` + `pylearn-light dts-light` / `pylearn-dark dts-dark` (index.css 81-102 phụ thuộc); `useMenuAction('redismastery', handleAction, windowId)`, `useContextAction`; tab learn render course app; tab khác `h-full overflow-y-auto`; `ScaleCommandPalette`, `NotesDrawer`, `TermPopover`, `SettingsModal`; `RedisHeader` bọc `ScaleAppHeader` (appId, brandTitle, logo, primaryTabs, moreItems); `RedisMobileBottomNav`.
- Accent: `DevOpsAccent = 'sky'|'cyan'|'amber'|'rose'|'emerald'` với biến `--dts-<accent>-bg/soft/ink` trong index.css (light & dark).

### 4.2 Mẫu PMP (feature riêng) — mẫu sẽ theo
- `src/features/pmp-course/`: types.ts (dùng lại `WpState/WpQuestion/WpCard` từ `src/features/workpath/types`), store.ts, data.ts, logic.ts, links.tsx, PmpLearnShell.tsx (dùng ScaleWorkbenchLayout), views (PmpHomeView, PmpRoadmapView, PmpModuleView, PmpQuizView, PmpFlashView, PmpCanvasView, PmpDecisionTreeView, PmpLookupView), components/PmpShared.tsx.
- `scripts/build-pmp.mjs` (content/pmp → src/data/courses/pmp), `scripts/pmp-doctor.mjs`; `buildPmpScaleLessons` tại `src/features/devops-course/scale/courseLessonBuilder.ts:1014`.
- Slot lưu trữ phải thêm `sysdesign`: `src/db/durableProgressStorage.ts:12` (ProgressSlotId), 22-28 (LOCAL_MIRROR_KEYS), ~334; `src/db/cloudSyncService.ts:22` ALL_PROGRESS_SLOTS; `src/db/backupService.ts:29,113`; `src/stores/useCloudSyncStore.ts` import ~37 + switch ~98/129/145; `src/components/layout/SettingsModal.tsx` ~26/43/101/494. IndexedDB `course_state` key theo courseId → không đổi schema.
- Định dạng content DevOps (tham khảo): `content/<id>/course.json`, `modules/<ID>-<slug>/{module.json,lesson.md,quiz.json,cards.json,drills.json,exercises.json}`; lesson.md chia step theo `##` (tối đa 10), visual block ```visual (YAML kind flow|layers|groups|anatomy|compare|troubleshoot|illustration); quiz `{id,type:mc|tf|output,q,code,choices,answer,explain}`; cards `{id,front,back}`.
- Flashcards: dùng Leitner của WpState (`rateCard`, BOX_DAYS 1/2/4/8/16 ở `src/features/workpath/logic.ts:35`), KHÔNG dùng `src/db/srsRepo.ts` (chỉ Python dùng).
- Notes: `src/db/notesRepo.ts` + `src/components/common/NotesDrawer.tsx` (generic).
- Test runner: `scripts/run-engine-tests.mjs` bundle 1 entry bằng esbuild (alias @→src), không framework, dùng `node:assert/strict` + hàm `test()` tự viết. esbuild chỉ có qua vite (không khai báo trực tiếp).
- Docs hiện có: `docs/scale-workbench-guidelines.md` (quy chuẩn bắt buộc; §5 văn phong: cấm ẩn dụ trên tiêu đề, cấm từ y khoa/quân sự hóa như "giải phẫu", "bắt bệnh", "vũ khí", "tuyệt chiêu", "sinh tử", "thảm họa", "chữa cháy"; giữ thuật ngữ EN; trình tự Khái niệm → Cơ chế → Liên hệ), `content/README.md` (quy trình biên soạn; "rà soát thủ công từng bài, không dùng script thay chuỗi hàng loạt").

### 4.3 Stage & workbench (cho chế độ live-sim)
- `ScaleWorkbenchLayout.tsx` props 149-161 (courseId, lessons, getModuleStatus, onMarkLessonComplete, onOpenQuiz/Exercises/Flashcards/Readings, onRunCodeSnippet, sandboxTitle, runCodeLabel). Cursor ở store (207-222); isPlaying/replayNonce local (224-225); phím ←/→, R, Space (438-467). Vùng: syllabus trái 503-875/942-954; breadcrumb 962-1006; telemetry strip 1009-1051; controls 1054-1129; stage 1133-1184; legend 1157-1164; stepper 1188-1245; resize 1249-1266; phải: narrative 1300, callout 1306-1328, whatChanged 1330-1358, nav 1362-1419, objectives/practice 1423-1539; mobile nav 1544-1576. Renderer ternary 1134-1183. BUG: `legendKinds` useMemo ở 496 sau `return null` ở 480 (rules of hooks).
- `ScaleStageSvg.tsx` props 996-1003 (scene, lang, theme, isPlaying, replayNonce, className). Không có phép chiếu world→iso; x/y là toạ độ SVG; `composeIsometricLayout` 274-403 (ghi đè x/y cho scene 1-4 node), `buildIsoLink` 459-579, zones 582-647. Camera `camRef` 1065; **reset camera + đóng inspector mỗi khi `scene` đổi identity (1099-1105)**. Animation thuần rAF: choreography effect 1513-1935 diff snapshot trước/sau (enter/move/exit, TIMING dòng 37), ghi attribute qua ref map 1040-1051; packet 1880-1909 `phase=(sec*speed+offset)%1` + getPointAtLength; **vòng packet thứ 2 (1938-1970) cũng cộng dt → packet chạy x2 sau khi đổi step**. Node: chỉ `block` vẽ loadPct (2221-2260, ngưỡng 65/90); dead 2133-2198; badge 2200-2219; db/device/crowd bỏ qua loadPct & badge. Layers trong sceneCamRef: floor 2804, links 2886, packets 2968, exiting 3019, ents 3035, link-labels 3072, note-card 3121. Kết luận: scene đổi mỗi tick sẽ reset camera, dựng lại layout, ẩn packet ~380ms → **giữ scene cố định, đẩy SimFrame qua kênh riêng (frameRef/subscribe) áp dụng trong rAF**.
- `StageEntityInspector.tsx`: hover → hoveredKey + tooltip; click → `StageInspectorPortal` (532-642); fallback `resolveFallbackInspector` 399-439 dùng ENTITY_KNOWLEDGE + entityKnowledgeExtra.ts; chưa có slot số liệu live.
- `useWorkbenchStore`: language, workbenchTheme, cursors, expandedLevels, recentSteps, isProgressExpanded, isSearchPaletteOpen, searchPaletteCourseId, isLeftSidebarCollapsed, isCodeTraceCollapsed, rightSidebarWidth. Không có playback/sim state.
- Không có thư viện chart; sparkline phải tự vẽ SVG.
- Đề xuất type: `SimFrame { t; nodes: Record<id,{loadPct?, state, queue?, badge?}>; links: Record<id,{style?, throughput?}>; packets: Array<{id, linkId, kind, progress}>; metrics: Record<string,number> }`.
