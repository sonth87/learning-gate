# 07 — Hướng dẫn biên soạn nội dung (`content/sysdesign/`)

> Dành cho người/agent biên soạn bài (M6) và cho M1 (builder + doctor). Định dạng này **khớp** mẫu hiện có của `content/pmp/` và `content/redis/` (xem `content/README.md`) và mở rộng thêm cho mô phỏng, bài tập, nguồn trích dẫn.
>
> Bắt buộc đọc cùng: `docs/scale-workbench-guidelines.md` (§1 chế độ stage, §5 văn phong), `04-simulation-engine.md` (`sim.json`), `05-live-stage.md` (`liveSim`), `06-activities-and-grading.md` (`activities.json`), `01-sources-and-credits.md` (giấy phép/ghi nguồn), `02-curriculum.md` (bảng bài, trạng thái), `reference/dts-models.md` (thẻ đối chiếu DTS).

---

## 1. Cấu trúc thư mục

```text
content/sysdesign/
├── course.json                          # cấp học (levels), ngưỡng quiz
├── _source/                             # BẢN GỐC CHỈ ĐỌC — không build, không sửa tay
│   └── sdc/
│       ├── manifest.json                # path, sha, url, ngày lấy (do scripts/import-sdc.mjs sinh)
│       └── phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx   # y nguyên bản gốc
└── modules/
    └── S1-03-data-flow-and-bottlenecks/
        ├── module.json                  # metadata + source
        ├── lesson.md                    # nội dung đọc, mỗi `##` là một step
        ├── stage.json                   # cách vẽ scene từng step + preset live-sim
        ├── sim.json                     # mô hình + kịch bản mô phỏng (04)
        ├── activities.json              # bài tập có chấm (06)
        ├── quiz.json                    # câu hỏi tự kiểm tra
        └── cards.json                   # flashcard (Leitner)
```
Build ra `src/data/courses/sysdesign/{curriculum.json,sims.json}` (T1.4). **Không sửa tay** các file build (như `content/README.md`).

### 1.1 Chọn: `stage.json` (dữ liệu) thay vì curator TypeScript

Các app cũ dựng scene bằng TS (`*ScaleCurator.ts`, ví dụ `src/apps/pmpmastery/data/pmpScaleCurator.ts`) qua `ModuleCuratedBlueprint.buildStep`. App này **chọn JSON `stage.json`** vì:
1. **Doctor kiểm được tĩnh.** `id` node/link trong scene phải trùng `sim.json`; scene live-sim phải cố định cấu trúc (05 §3.5). Với TS không kiểm được nếu không biên dịch.
2. **Scene dẫn xuất từ model.** `sdSceneBuilder` sinh `StageScene` từ `SystemModel` + cấu hình hiển thị, tác giả không chép lại danh sách node ở mỗi step (đúng nhu cầu "reveal dần" của bài mô hình hoá).
3. **Dễ review** (diff JSON nhỏ), người không viết TS cũng sửa được; agent Sonnet ít lỗi hơn.
4. Có **lối thoát**: `scenes.<key>.raw` cho phép dán nguyên `StageScene` khi cần hình đặc biệt.
Đánh đổi: ít linh hoạt hơn helper TS; chấp nhận. Builder `scale/sdLessonBuilder.ts` + `scale/sdSceneBuilder.ts` (theo `buildPmpScaleLessons`, `courseLessonBuilder.ts:1014`) đọc `stage.json`, **không** dùng `ModuleCuratedBlueprint`.

---

## 2. Định dạng từng file

### 2.1 `course.json`

```json
{
  "courseId": "sysdesign",
  "passQuiz": 0.7,
  "levels": {
    "0": "Mental Model Shift: tư duy hệ thống, đánh đổi và ràng buộc",
    "1": "Foundation: thành phần, giao tiếp, luồng dữ liệu và điểm nghẽn",
    "2": "Core Building Blocks: Load Balancing, Caching, Database, Queue",
    "3": "Distributed Fundamentals: lỗi, nhất quán, đồng thuận, giao dịch, thời gian",
    "4": "Scalability và Performance: hiệu năng, CDN, rate limiting, quan sát hệ thống",
    "5": "Real-World Patterns: kiến trúc theo thời gian, hệ thống đọc nhiều, news feed",
    "6": "Mastery: khung tư duy, quyết định kiến trúc, phỏng vấn, vận hành",
    "7": "Case Studies: thiết kế hệ thống hoàn chỉnh"
  }
}
```
Cấp 0–6 theo 7 phase của SDC; cấp 7 (Case Studies) là phần bổ sung. Các chủ đề chỉ có ở DTS và phần tự thêm (★) được xếp **vào đúng phase** theo `02-curriculum.md` (nguồn sự thật cho id, tên phase và thứ tự; nếu 02 đổi thì file này theo 02). Thứ tự học là `(level, order)`, không phải theo tên thư mục (`content/README.md` mục "Thứ tự học").

### 2.2 `module.json` (schema đầy đủ)

```ts
export interface SdModuleJson {
  id: string;                      // 'S1-03' = S<level>-<nn>, duy nhất toàn khoá
  slug: string;                    // = tên thư mục: 'S1-03-data-flow-and-bottlenecks'
  level: number;                   // 0..7 (theo 02-curriculum.md)
  order: number;                   // thứ tự học trong level = vị trí dòng trong bảng phase của 02 (S1-03 đứng thứ 5 ở Phase 1)
  title: string;                   // VI, nói thẳng khái niệm (guidelines §5.3)
  summary: string;                 // 1–2 câu, VI
  titleEn?: string; summaryEn?: string;       // bản EN (làm sau, M8)
  durationMin: number;             // 8–20
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: { vi: string; en?: string }[];  // 3–5 mục tiêu, bắt đầu bằng động từ, không ẩn dụ
  tags: string[];
  prerequisites?: string[];        // id module nên học trước
  related?: string[];              // id module liên quan (liên kết chéo)
  uses?: string[];                 // id module mà activities/stage của bài này dùng lại sim (06 §8.1 mục 4)
  concepts?: string[];             // khoá glossary / thuật ngữ nên hiện ở TermPopover
  dtsRef?: string;                 // id thẻ đối chiếu trong reference/dts-models.md (chỉ tham chiếu nội bộ)
  source?: SdSource | SdSource[];  // BẮT BUỘC với bài chuyển thể từ SDC; schema do 01-sources-and-credits.md §3.1 quy định
  status?: 'draft' | 'review' | 'done';   // chỉ để theo dõi; doctor cảnh báo nếu 'draft' vào build production
}

/** Bản sao kiểu của schema ở 01-sources-and-credits.md §3.1 (nguồn sự thật; đổi ở 01 trước). Bài ghép nhiều bài SDC dùng mảng. */
export interface SdSource {
  kind: 'sdc' | 'original';        // 'original': bài tự viết (có thể bỏ source)
  path?: string;                   // đường dẫn trong repo SDC; phải có trong _source/sdc/manifest.json
  sha?: string;                    // commit đã lấy, 40 ký tự; phải khớp manifest
  url?: string;                    // link blob tại đúng commit
  adaptedBy?: string;              // 'sonnet' | tên người
  adaptedAt?: string;              // YYYY-MM-DD
  changes?: string;                // 1–2 câu: đã sửa gì so với bản gốc
  adaptation?: 'edited' | 'rewritten';  // mức biên tập (01 §3.1); doctor dùng cùng ngưỡng trùng nguyên văn (mục 6, quy tắc 15)
}
```
Quy tắc nguồn:
- `source.kind:'sdc'` ⇒ **bắt buộc** `path`, `sha`, `url`, `adaptedBy`, `adaptedAt`, `changes`; `path`/`sha` khớp `_source/sdc/manifest.json`. Bài tự viết (★, chủ đề chỉ có ở DTS) có thể bỏ `source` hoặc ghi `kind:'original'`.
- DTS chỉ xuất hiện ở `dtsRef` (id thẻ đối chiếu nội bộ); **không** có `source` kiểu `sdc` cho DTS (không giấy phép, không sao chép lời giảng/dữ liệu scene — `01-sources-and-credits.md` §2). Trang Credits ghi DTS là tài liệu tham khảo mô hình.
- Ý nghĩa từng trường và quy tắc doctor: `01-sources-and-credits.md` §3.1. Thiếu `adaptation` ⇒ hiểu là `edited`.
- UI sinh dòng nguồn từ `source` (01 §3.2): `sdLessonBuilder` điền `ScaleModuleLesson.attribution` (05 §2), Layout hiển thị cuối cột phải (T3.6); trang Credits liệt kê bài (T7.6).

Ví dụ:
```json
{
  "id": "S1-03",
  "slug": "S1-03-data-flow-and-bottlenecks",
  "level": 1,
  "order": 5,
  "title": "Data Flow và Bottleneck: tìm và sửa điểm nghẽn",
  "summary": "Theo dõi một request đi qua các thành phần, đo tải và độ trễ ở từng chặng, và tìm thành phần giới hạn thông lượng của toàn hệ thống.",
  "durationMin": 16,
  "difficulty": "Beginner",
  "objectives": [
    { "vi": "Mô tả đường đi của một request từ client tới database và quay về" },
    { "vi": "Tính mức sử dụng ρ = λ/μ của một thành phần và giải thích vì sao độ trễ tăng vọt khi ρ tiến tới 1" },
    { "vi": "Xác định điểm nghẽn bằng quy trình đo, tìm, sửa" },
    { "vi": "Giải thích vì sao thêm server ở tầng không nghẽn không cải thiện hệ thống" }
  ],
  "tags": ["bottleneck", "latency", "throughput", "queueing", "capacity"],
  "prerequisites": ["S1-01", "S1-06", "S1-02"],
  "related": ["S4-01"],
  "dtsRef": "latency-throughput",
  "source": {
    "kind": "sdc",
    "path": "content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
    "sha": "fe4234da7d6fe719e8e18547856fc0a730155420",
    "url": "https://github.com/steve-bang/systemdesigncore/blob/fe4234da7d6fe719e8e18547856fc0a730155420/content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
    "adaptedBy": "sonnet",
    "adaptedAt": "2026-11-26",
    "changes": "Bỏ giai thoại mở đầu; chuẩn hóa thuật ngữ; thay Mermaid bằng scene; thêm mô phỏng ramp tải, công thức ρ, bài tập có chấm.",
    "adaptation": "edited"
  },
  "status": "draft"
}
```

### 2.3 `lesson.md`

**Quy tắc cấu trúc**
- Dòng `# Tiêu đề` đầu file (nếu có) bị builder bỏ; tiêu đề lấy từ `module.json`.
- Mỗi `##` là **một step** (một bước trên stepper và một cảnh trên stage). **8–12 step** là chuẩn; **tối đa 12** (doctor: lỗi nếu > 12, cảnh báo nếu < 6). (Builder dùng chung `splitMarkdownSections` ở `courseLessonBuilder.ts` cắt 10 step; builder riêng của app này nâng lên 12 — T1.1c, không sửa builder dùng chung.)
- Mỗi step 120–250 từ (không kể code/bảng); một ý chính. Đoạn dài hơn nên tách step.
- Thứ tự theo guidelines §5.4: **Khái niệm → Cơ chế → Liên hệ** (liên hệ đời thường 1 câu, cuối đoạn).
- **Tiêu đề `##` nói thẳng khái niệm** (guidelines §5.3), có đánh số `1.`, `2.`… Ví dụ đúng: `## 3. Cache giảm tải cho database: Cache Hit Ratio và Cache Miss`.
- Giữ nguyên thuật ngữ EN (`Latency`, `Throughput`, `Bottleneck`, `Cache Hit`, `Circuit Breaker`, `Retry`, `Backoff`, `Jitter`…).

**Khối `step` (metadata của step)** — một fenced block ngay sau tiêu đề `##`, YAML (parse bằng `yaml` như `pmp-doctor.mjs`):

````markdown
## 3. Cache giảm tải cho database: Cache Hit Ratio và Cache Miss

```step
category: TECHNIQUE
short: Thêm cache
scene: s3-cache
sim: S1-03/ramp
callout:
  kind: key-idea
  title: Cache chỉ giúp lượt đọc
  vi: Mọi lượt ghi vẫn đi tới database, nên tỉ lệ ghi cao làm cache kém hiệu quả.
whatChanged:
  - "+ Cache nằm giữa app và database"
  - "~ Lưu lượng vào database giảm còn khoảng một nửa"
telemetry:
  - label: Hit Ratio
    value: "{cache.hitRatio@10:0%}"
    tone: ok
  - label: ρ của DB
    value: "{db.rho@30:2}"
    tone: warn
```
(nội dung markdown của step...)
````

| Khoá | Bắt buộc | Giá trị |
|---|---|---|
| `category` | có | `SETUP \| PROBLEM \| TECHNIQUE \| MECHANISM \| PITFALL \| REAL_CODE \| RECAP` (khớp `StepCategory`). Step đầu = `SETUP`, cuối = `RECAP`. Khác với app cũ (suy ra từ từ khoá tiêu đề), app này **khai báo tường minh**. |
| `short` | có | Nhãn stepper ≤ 16 ký tự (VI). Tuỳ chọn `shortEn`. |
| `scene` | khuyến nghị | khoá trong `stage.json` `scenes`; hoặc `@prev` (giữ cảnh bước trước, không morph); hoặc `none` (không cần sơ đồ: builder dùng `memory-2d` bảng so sánh nếu `stage.json` có, ngược lại `code-trace`). Doctor cảnh báo step không có `scene`/`live` (trừ `RECAP`). |
| `live` | không | khoá trong `stage.json` `live` ⇒ step `stageMode:'live-sim'` (05). Bắt buộc có `scene` (cấu trúc). |
| `sim` | khi dùng `{…}` | id sim trong `sim.json` dùng để phân giải biến trong `telemetry`/`callout`; `live` mặc định suy ra `sim` từ preset. |
| `activity` + `gate` | không | id activity (06) và `required \| optional` (mặc định `optional`). Tối đa 1 activity mỗi step. |
| `callout` | không | `kind ∈ key-idea \| watch-out \| good-to-know \| compare \| technique`, `title?`, `vi`, `en?` (khớp `ScaleLessonStep.callout`). |
| `whatChanged` | không | mảng chuỗi; ký tự đầu `+`, `~`, `-` (hoặc `−`) ⇒ `StepDiffItem.op`; tối đa 4 dòng; mỗi dòng ≤ 90 ký tự. |
| `telemetry` | không | tối đa 3 phần tử `{label, value, tone?}`; `value` là chuỗi tĩnh hoặc biến `{node.field@t:dp}` (cú pháp ở 06 §8.3) lấy **từ engine lúc build** — **không viết số tay** khi step có `sim`. `tone ∈ default|ok|warn|bad`. Với step `live`, telemetry động lấy từ `live.telemetry` (`stage.json`). |

Chuỗi hiển thị song ngữ: dạng `vi:`/`en:` hoặc một chuỗi (hiểu là VI; EN thiếu ⇒ giao diện EN hiển thị VI; doctor báo thống kê EN thiếu ở mức `info`).

**Khối markdown được hỗ trợ** (render bởi `BlueprintMarkdown`, `src/components/scale-workbench/BlueprintMarkdown.tsx`):
- Văn bản, danh sách, bảng, `**đậm**`, `*nghiêng*`, `` `code` ``, `==nổi bật==`, liên kết `[text](https://…)`, huy hiệu `[!badge:tone:text]` (tone: `violet|amber|…` như PMP).
- Callout kiểu GitHub trong thân bài: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]` (khác với `callout` trong khối `step`: khối `step.callout` hiển thị ở **hộp riêng** cột phải).
- Code fence có ngôn ngữ (`yaml`, `json`, `sql`, `python`, `bash`, `text`). **Mermaid không hỗ trợ** — phải chuyển (mục 3 bước 5).
- Khối ```` ```visual ```` (YAML `kind: flow | layers | groups | anatomy | compare | troubleshoot | illustration`) cho sơ đồ tĩnh nhỏ (xem ví dụ trong `content/pmp/modules/P00-orientation/lesson.md`). Dùng `visual` cho bảng so sánh/ngăn tầng; dùng `scene` cho kiến trúc có luồng.

**Gắn scene/sim/activity theo step**: toàn bộ qua khối `step` ở trên (một nơi duy nhất để doctor kiểm).

**Bản EN (làm sau, M8):** `lesson.en.md` cùng số step, cùng thứ tự; builder ghép theo chỉ số; doctor kiểm số step bằng nhau.

### 2.4 `stage.json`

```ts
export interface StageFile {
  version: 1;
  /** Hiển thị cho MỌI node có trong sim.json/model; thiếu ⇒ builder suy mặc định từ NodeSpec.kind */
  nodes: Record<string, {
    shape?: 'block' | 'db' | 'device' | 'crowd';
    tone?: 'green' | 'blue' | 'orange' | 'purple' | 'yellow' | 'rose' | 'neutral';
    icon?: StageIconKind;
    label?: { vi: string; en?: string };
    sublabel?: { vi: string; en?: string };
    x?: number; y?: number;                    // gợi ý; composeIsometricLayout vẫn có thể ghi đè (guidelines §2.6)
    inspector?: Partial<StageInspectorInfo>;   // ghi đè What/How/Why/Tips (guidelines §3), VI bắt buộc, EN tuỳ chọn
  }>;
  links?: Record<string, {
    label?: { vi: string; en?: string };
    style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
    fromPort?: 'NE' | 'SE' | 'SW' | 'NW'; toPort?: 'NE' | 'SE' | 'SW' | 'NW';
    curve?: number;
    inspector?: Partial<StageInspectorInfo>;
  }>;
  zones?: Record<string, { nodeIds: string[]; label: { vi: string; en?: string }; tone?: string }>;
  scenes: Record<string, SceneDef>;            // khoá = giá trị `scene:` ở step
  live?: Record<string, LiveDef>;              // khoá = giá trị `live:` ở step
}

export interface SceneDef {
  mode?: 'isometric' | 'memory-2d' | 'code-trace';           // mặc định isometric (live → live-sim)
  show: { nodes: string[] | '*'; links?: string[] | '*' };    // tập con của model, reveal dần theo step
  /** Minh hoạ tĩnh (khi không live): trạng thái từng node/link */
  state?: Record<string, { loadPct?: number; dead?: boolean; dimmed?: boolean; highlighted?: boolean;
                           badge?: { text: { vi: string; en?: string }; tone?: 'default' | 'ok' | 'warn' | 'bad' } }>;
  linkState?: Record<string, { style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut' }>;
  packets?: 'auto' | { id: string; linkId: string; kind: string; speed?: number; offset?: number; reverse?: boolean }[];
  zones?: string[];
  noteCard?: { title: { vi: string; en?: string }; lines: { text: { vi: string; en?: string }; tone?: string }[]; position?: string };
  raw?: unknown;                                              // StageScene đầy đủ, thay hết các trường trên
}

export interface LiveDef {
  sim: string;                                                // id trong sim.json
  startAtSec?: number; autoplay?: boolean; speed?: 1 | 2 | 5;
  controls: { timeline?: boolean; load?: boolean; chaos?: string[]; knobs?: { node: string; key: string }[]; tracer?: boolean };
  telemetry?: { metric: string; label: { vi: string; en?: string }; format: 'rps' | 'ms' | 'pct' | 'usd-hour' | 'count';
                tone?: { warnAbove?: number; badAbove?: number } }[];
  slo?: { metric: 'p99' | 'errorRate'; value: number }[];
  pauseAtSec?: number[];
  focus?: { nodes?: string[]; links?: string[] };
}
```
Quy tắc: step `live` dùng scene với `show.nodes:'*'` hoặc tập cố định (cấu trúc không đổi trong step); **không** điền `state.loadPct/dead/badge` cho scene dùng với `live` (05 §3.3). `StageNode.id` = `NodeSpec.id`, `StageLink.id` = `LinkSpec.id` (doctor kiểm).

Ví dụ rút gọn cho S1-03:
```json
{
  "version": 1,
  "nodes": {
    "client": { "shape": "crowd", "tone": "blue", "label": { "vi": "Người dùng", "en": "Users" } },
    "lb":     { "shape": "block", "tone": "purple", "icon": "layers", "label": { "vi": "Load Balancer" } },
    "app1":   { "shape": "block", "tone": "green", "label": { "vi": "App 1" } },
    "app2":   { "shape": "block", "tone": "green", "label": { "vi": "App 2" } },
    "app3":   { "shape": "block", "tone": "green", "label": { "vi": "App 3" } },
    "cache":  { "shape": "block", "tone": "yellow", "icon": "zap", "label": { "vi": "Cache" } },
    "db":     { "shape": "db", "tone": "orange", "label": { "vi": "Database" } }
  },
  "zones": { "backend": { "nodeIds": ["app1", "app2", "app3", "cache", "db"], "label": { "vi": "TẦNG BACKEND" } } },
  "scenes": {
    "s1-request-path": { "show": { "nodes": ["client", "lb", "app1", "db"] }, "packets": "auto" },
    "s2-full": { "show": { "nodes": "*" }, "zones": ["backend"] }
  },
  "live": {
    "ramp": {
      "sim": "S1-03/ramp",
      "autoplay": false,
      "controls": { "timeline": true, "load": true, "chaos": ["kill", "slow"], "tracer": true },
      "telemetry": [
        { "metric": "offeredRps", "label": { "vi": "Lưu lượng" }, "format": "rps" },
        { "metric": "p99", "label": { "vi": "p99" }, "format": "ms", "tone": { "warnAbove": 300, "badAbove": 1000 } },
        { "metric": "errorRate", "label": { "vi": "Lỗi" }, "format": "pct", "tone": { "warnAbove": 0.01, "badAbove": 0.05 } }
      ],
      "slo": [{ "metric": "p99", "value": 300 }],
      "pauseAtSec": [20]
    }
  }
}
```

### 2.5 `sim.json`
`{ "sims": [ SimDoc, … ] }`, mỗi `SimDoc` đúng như ví dụ ở **04 §10** (`id`, `scenario`, `slos?`, `expect?`, `presets?`). Một module có thể có nhiều sim (vd bản `ramp` và bản `spike`). `id` dạng `<moduleId>/<tên>`; duy nhất toàn khoá.

### 2.6 `activities.json`
Mảng `Activity` (06 §3). `id` dạng `S1-03.A1`, đánh số liên tục.

### 2.7 `quiz.json` và `cards.json`
Cùng kiểu với `WpQuestion`/`WpCard` (`src/features/workpath/types.ts`), tái dùng `gradeQuestion`:
```json
[
  {
    "id": "S1-03.q1",
    "type": "mc",
    "q": "Một thành phần có năng lực 1 000 req/s nhận 1 100 req/s trong 5 phút. Điều nào xảy ra với hàng đợi của nó?",
    "code": "",
    "choices": ["Hàng đợi luôn bằng 0", "Hàng đợi tăng đều đặn theo thời gian", "Hàng đợi tự ổn định ở mức nhỏ", "Hàng đợi giảm dần"],
    "answer": 1,
    "explain": "Khi tải vào λ vượt năng lực μ (ρ > 1), phần dư λ − μ = 100 req/s tích luỹ mỗi giây, nên hàng đợi tăng khoảng 100 request mỗi giây."
  },
  {
    "id": "S1-03.q2",
    "type": "tf",
    "q": "Thêm instance ở tầng ứng dụng luôn giảm p99 của toàn hệ thống.",
    "code": "",
    "choices": [],
    "answer": false,
    "explain": "p99 toàn hệ thống do chặng chờ lâu nhất quyết định. Nếu database là điểm nghẽn, thêm instance ở tầng app chỉ tăng chi phí."
  }
]
```
```json
[
  { "id": "S1-03.c1", "front": "Điểm nghẽn (Bottleneck) là gì?", "back": "Thành phần có ρ = λ/μ cao nhất trên đường đi của request; nó quyết định thông lượng tối đa của cả hệ thống." },
  { "id": "S1-03.c2", "front": "Công thức mức sử dụng ρ?", "back": "ρ = λ / (μ · c): tải vào chia cho năng lực xử lý. ρ ≥ 1 ⇒ hàng đợi tăng không dừng." }
]
```
Quy tắc: mỗi bài **≥ 4 câu quiz** (đủ ≥ 2 loại trong `mc|tf|output`) và **≥ 5 thẻ**; `explain` ≥ 40 ký tự, theo trình tự **Khái niệm → Cơ chế → Liên hệ**; câu `output` (đáp án số/chuỗi) dùng cho tính toán ρ, λ, hit ratio; `id` duy nhất toàn khoá (`<moduleId>.qN`, `<moduleId>.cN`; **không** trùng id activity `….A#`).

---

## 3. Quy trình chuyển MỘT bài SDC (từng bước)

Quy tắc nền (từ `content/README.md` §0): **biên tập tay từng mục**, không dùng script thay chuỗi hàng loạt. Mọi bài đều qua 13 bước dưới. Người làm ghi tiến độ vào `TASKS.md` và cập nhật `02-curriculum.md` ở bước cuối.

| # | Việc | Kết quả |
|---|---|---|
| 1 | **Đọc bản gốc** `_source/sdc/phase-N/lessons/<file>.mdx` đủ một lượt, ghi chú khái niệm, công thức, ví dụ số, hình Mermaid, bài tập tự làm | ghi chú nháp (không commit) |
| 2 | **Lập dàn ý step** (8–12): gán `category`, tên step bằng khái niệm kỹ thuật, ý chính, step nào cần hình/mô phỏng/bài tập | dàn ý |
| 3 | **Chọn chế độ stage** cho từng step theo guidelines §1: kiến trúc/luồng ⇒ `isometric` (hoặc `live-sim` nếu có kịch bản chạy); bảng/cây quyết định ⇒ `memory-2d`; công thức/code ⇒ `code-trace` | cột `scene/live` trong dàn ý |
| 4 | **Biên tập lời giảng** (xem 3.1) viết `lesson.md` + khối `step` | `lesson.md` |
| 5 | **Chuyển Mermaid** sang `visual` (bảng, layers, flow) hoặc scene; không để fence `mermaid` | |
| 6 | **Kiểm số liệu và khẳng định kỹ thuật** (3.2) | ghi vào `source.changes` các điểm đã sửa |
| 7 | **Mô hình đối chiếu DTS:** mở thẻ ở `reference/dts-models.md` (mục `dtsRef`) để biết khái niệm cần mô hình gì, thành phần scene, trình tự bước, metric chính. **Tự dựng** `stage.json` bằng lời, bố cục và đặt tên của mình; không mở/chép bundle DTS, không chép thứ tự bước và lời chú thích | `stage.json` |
| 8 | **Mô phỏng:** viết `sim.json` theo 04 (model, load, events, slos, expect, presets); chạy thử bằng `sd:test`/script nháp, chỉnh số cho `expect` hợp lý (bottleneck đúng chỗ, mốc thời gian) | `sim.json` |
| 9 | **Bài tập** theo 06: tối thiểu 1 `predict` hoặc `spot-bottleneck` (nếu có sim) và 1 `fix-challenge`/`tune-to-limit`/`estimate` cho bài nặng; viết `solution`, `traps`; gắn vào step trong khối `step` | `activities.json` |
| 10 | **Quiz và flashcard** **tự viết** dựa trên nội dung bài (không chép câu hỏi gốc), đúng quy tắc 2.7 | `quiz.json`, `cards.json` |
| 11 | **Ghi nguồn**: điền `module.json.source` (`path`, `sha`, `url`, `adaptedBy`, `adaptedAt`, `changes`), kiểm `sha` khớp `manifest.json`, mô tả `changes` trung thực | `module.json` |
| 12 | **Chạy kiểm tra:** `npm run sd:build && npm run sd:doctor && npm run sd:test`; mở app xem bài (stage, live-sim, activity, quiz, card, dòng nguồn); nếu chạm code chung: `npm run build && npm run lint` | log xanh |
| 13 | **Cập nhật** `02-curriculum.md` (trạng thái bài: `todo → doing → review → done`, ghi mô hình/sim/activity thực tế đã có) và `TASKS.md`; chuyển `review` để Opus duyệt | commit riêng cho bài |

### 3.1 Biên tập lời giảng (bước 4) — những gì phải sửa

SDC viết kiểu blog dài, mở bằng giai thoại, trộn Anh–Việt, Mermaid tĩnh (BRIEF §1.1). Khi chuyển:

1. **Bỏ giai thoại ngôi thứ nhất** ("Tôi còn nhớ lần đầu…", "Hồi đó mình…"). Thay bằng **bài toán thực tế** nêu thẳng (guidelines §5.4 bước 1). Nếu giai thoại mang thông tin kỹ thuật, chuyển thành "Tình huống:" ba dòng, phi cá nhân.
2. **Khái niệm → Cơ chế → Liên hệ.** Mở mỗi step bằng định nghĩa/bài toán, sau đó cơ chế (số, công thức, đầu vào/đầu ra), ví dụ liên hệ đời thường **một câu ở cuối** nếu thật cần.
3. **Giảm trộn Anh–Việt không cần thiết nhưng giữ thuật ngữ** (guidelines §5.1): giữ `Cache Hit`, `Throughput`, `Circuit Breaker`; bỏ khẩu ngữ như *"game changer"*, *"Problem solved"*, *"boom"*, *"magic"*, *"best practice thần thánh"*.
4. **Sửa tiêu đề theo §5.3:** tên khái niệm hoặc bài toán, không ẩn dụ, không giật tít. Cấm các từ ở §5.5 (*giải phẫu, mổ xẻ, bắt bệnh, vũ khí, tuyệt chiêu, sinh tử, thảm họa, chữa cháy…*); thay bằng *Phân tích, Cấu trúc của…, Nguyên lý cốt lõi, Sai lầm phổ biến, Hướng dẫn xử lý sự cố*.
5. **Chia nhỏ** đoạn dài thành step; mỗi step có một ý chính; bỏ lặp.
6. **Bài tập "tự làm trên giấy" của SDC** ⇒ chuyển thành `activities.json` (có chấm) hoặc `estimate`/`order`; không giữ nguyên.
7. **Hình Mermaid** ⇒ `visual` (flow/layers/groups/compare) hoặc `scene`/`live`.

#### Ví dụ trước/sau (tự viết để minh hoạ phong cách; không trích nguyên văn nguồn)

**Trước** (kiểu blog, mô tả phong cách; ví dụ tự viết):
```markdown
## Game changer: Hiểu về bottleneck

Tôi còn nhớ lần đầu hệ thống của team sập đúng đêm khuyến mãi. Mọi người lao vào
thêm server như điên nhưng... boom, vẫn chậm! Sau đó mới biết nguyên nhân nằm ở
database. Problem solved khi mình đo đúng chỗ. Vậy bottleneck là cái điểm "nút cổ chai"
trong hệ thống, giống cái cổ chai nước ấy.
```
**Sau** (theo guidelines §5.3–§5.4):
````markdown
## 1. Điểm nghẽn (Bottleneck): thành phần giới hạn thông lượng của cả hệ thống

```step
category: SETUP
short: Điểm nghẽn
scene: s1-request-path
callout:
  kind: key-idea
  vi: Thêm tài nguyên cho thành phần không phải điểm nghẽn không làm tăng thông lượng của hệ thống.
```

**Điểm nghẽn (Bottleneck)** là thành phần có mức sử dụng cao nhất trên đường đi của request.
Thông lượng tối đa của cả hệ thống bằng thông lượng tối đa của thành phần này, vì mọi request
đều phải đi qua nó.

Mức sử dụng của một thành phần: ρ = λ / μ, với λ là số request đến mỗi giây và μ là số request nó
xử lý tối đa mỗi giây. Khi ρ ≥ 1, hàng đợi trước thành phần tăng không dừng và độ trễ tăng theo.

Bạn có thể hình dung giống một đường ống: tốc độ nước chảy qua cả đường ống bị quyết định bởi đoạn hẹp nhất.
````
Chỗ thay đổi: bỏ giai thoại và khẩu ngữ; tiêu đề nói thẳng khái niệm; định nghĩa trước, cơ chế sau, ví dụ liên hệ một câu ở cuối; giữ thuật ngữ EN `Bottleneck`.

### 3.2 Kiểm số liệu và khẳng định kỹ thuật (bước 6)
- Mọi **con số cụ thể** (độ trễ, thông lượng, tỉ lệ) hoặc là (a) **suy ra từ mô phỏng của bài** (dùng biến `{…}`), hoặc (b) kèm "khoảng", "tuỳ phần cứng", hoặc có nguồn tài liệu chính thống ghi trong lời giảng/`source.changes`.
- Số liệu "latency numbers" nêu như **thang độ lớn** (µs/ms/chục ms), không như hằng số.
- Công thức (Little's Law `L = λ·W`, M/M/1 `W = S/(1−ρ)`, `1 − 0,99^N`, quorum `N/2 + 1`) tự tính lại một lần; lỗi sai trong bản gốc ghi vào `source.changes`.
- Khẳng định tuyệt đối ("luôn", "không bao giờ", "X nhanh hơn Y") phải sửa thành điều kiện cụ thể hoặc xoá.
- Không đưa token/khoá thật; ví dụ cấu hình dùng giá trị giữ chỗ (`content/README.md` §4).
- Công nghệ dùng ví dụ phải theo chuẩn 2026 (`content/README.md` §4) nếu có cấu hình/lệnh.

---

## 4. Nhập nguồn SDC (`_source/sdc/`)

- `scripts/import-sdc.mjs` (T1.5) tải `content/phases/**` ở **commit cố định** `fe4234da7d6fe719e8e18547856fc0a730155420` vào `content/sysdesign/_source/sdc/`, giữ đường dẫn con (`phase-1/lessons/…`). **Không sửa tay**; muốn cập nhật nguồn thì chạy lại script với commit mới và rà soát mọi module có `source.sha` cũ.
- `manifest.json` (sơ đồ cùng `01` §1.3):
```json
{
  "repo": "steve-bang/systemdesigncore",
  "commit": "fe4234da7d6fe719e8e18547856fc0a730155420",
  "files": [
    {
      "path": "content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
      "sha": "fe4234da7d6fe719e8e18547856fc0a730155420",
      "url": "https://raw.githubusercontent.com/steve-bang/systemdesigncore/fe4234da7d6fe719e8e18547856fc0a730155420/content/phases/phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx",
      "fetchedAt": "2026-11-26",
      "sha256": "(tuỳ chọn, để doctor phát hiện file bị sửa tay)",
      "bytes": 0
    }
  ]
}
```
Các trường `path`, `sha`, `url`, `fetchedAt` theo `01-sources-and-credits.md` §1.3; `sha256`/`bytes` là mở rộng tuỳ chọn.
- `_source/` **không** vào bản build (`build-sysdesign.mjs` bỏ qua), không bị lint nội dung §5 (là bản gốc), nhưng doctor dùng nó để đo "độ trùng nguyên văn" với `lesson.md` (mục 6).
- Nếu tác giả rút lại hoặc giấy phép đổi: theo `01-sources-and-credits.md` (rút nội dung gốc, giữ phần mô phỏng/bài tập/quiz/cards tự viết). Quy trình chi tiết **Chưa quyết**: người dùng quyết khi có phản hồi của tác giả, ghi thành ADR mới.

---

## 5. Checklist "một bài xong" (Definition of Done nội dung)

**Nguồn và văn phong**
- [ ] `module.json` đủ trường; `source` đúng (`sha` khớp `manifest.json`, `changes` trung thực); trang Credits sinh được.
- [ ] Không còn giai thoại ngôi thứ nhất, khẩu ngữ giật tít, từ cấm §5.5; tiêu đề `##` nói thẳng khái niệm.
- [ ] Mọi khẳng định kỹ thuật/số liệu đã kiểm; `source.changes` ghi các sửa đổi so với bản gốc.
- [ ] Không có giá trị metric cố định lấy từ DTS (các số trong `reference/dts-models.md` chỉ để hiểu độ lớn); số trong bài do engine tính hoặc do mình tự chọn làm tham số.
- [ ] Trình tự Khái niệm → Cơ chế → Liên hệ trong lời giảng, `callout`, `quiz.explain`.
- [ ] Không có Mermaid; hình đã thành `visual`/scene.

**Cấu trúc**
- [ ] 8–12 step, `category` tường minh, step đầu `SETUP`, cuối `RECAP`; mỗi step có `scene`/`live` hoặc lý do (RECAP).
- [ ] `whatChanged`/`telemetry` ngắn gọn; số telemetry lấy từ sim bằng biến `{…}` (không số tay).
- [ ] `stage.json`: id node/link khớp `sim.json`; chế độ stage đúng guidelines §1 (không ép sơ đồ).
- [ ] `inspector` (What/How/Why/Tips) cho node/link quan trọng (guidelines §3) hoặc dùng mặc định theo primitive.

**Mô phỏng và bài tập**
- [ ] `sim.json`: `expect` đúng (bottleneck, mốc thời gian), `slos` hợp lý, `presets` gồm lời giải và ≥ 1 bẫy.
- [ ] `activities.json`: mỗi activity được gắn đúng 1 lần; starter/không làm gì **không đạt**; `solution` đạt 3 sao; `traps` không đạt; `explain` có số từ sim (06 §8).
- [ ] Bài có ≥ 1 trải nghiệm tương tác thật (live-sim hoặc activity) trừ bài tư duy thuần (phase 0) ghi rõ lý do.

**Quiz/cards**
- [ ] ≥ 4 quiz (≥ 2 loại), ≥ 5 card; id duy nhất; `explain` đủ dài, đúng trình tự giải thích.

**Kiểm tra**
- [ ] `npm run sd:build && npm run sd:doctor && npm run sd:test` xanh.
- [ ] Mở app: đọc hết, chạy sim, làm activity, làm quiz, lật card, thấy dòng nguồn; chế độ sáng/tối; VI (EN hiển thị VI dự phòng); cửa sổ hẹp.
- [ ] Nếu bài chạm code dùng chung: `npm run build`, `npm run lint`, hồi quy 5 app (05 §9).
- [ ] `02-curriculum.md` và `TASKS.md` đã cập nhật; chuyển `review` để Opus duyệt (kỹ thuật + §5 + ghi nguồn).

---

## 6. Quy tắc doctor sẽ áp dụng (`scripts/sysdesign-doctor.mjs`)

Mức: **E** = lỗi (exit ≠ 0), **W** = cảnh báo (hiển thị, không fail; có thể bật `--strict`), **I** = thông tin.

**Định danh và cấu trúc**
1. (E) Trùng id module, `(level, order)`, quiz, card, activity, sim; id không theo mẫu (`S\d+-\d+`, `S\d+-\d+\.q\d+`, `…\.c\d+`, `…\.A\d+`, `<module>/<name>`). `slug` = tên thư mục.
2. (E) `module.json` thiếu trường bắt buộc / sai kiểu; `level` không có trong `course.json`.
3. (E) Bài có đánh dấu từ SDC mà `source` thiếu trường; `path`/`sha` không có hoặc không khớp `manifest.json`; `url` không khớp `sha`/`path`. (W) bài `kind:'original'` mà không có `dtsRef` hay giải thích nguồn khái niệm trong `changes`.
4. (E) `lesson.md`: > 12 step; step không có khối `step` hoặc thiếu `category`/`short`; step đầu ≠ `SETUP` hoặc cuối ≠ `RECAP`; `category` ngoài danh sách. (W) < 6 step; step không có `scene`/`live` (trừ `RECAP`); `short` > 16 ký tự; step > 300 từ.
5. (E) Có fence `mermaid`. (E) Tham chiếu `scene`/`live`/`activity` không tồn tại; `activity` dùng 2 lần hoặc activity không được gắn (trừ `standalone`).

**Văn phong (guidelines §5), quét `lesson.md`, `module.json`, `stage.json`, `activities.json`, `quiz.json`, `cards.json` và chuỗi i18n mới**
6. (E) Từ/cụm cấm (§5.5): *giải phẫu, phẫu thuật, mổ xẻ, bắt bệnh, khám bệnh, cầm máu, cứu mạng, đọc vị, giải ngố, phép thuật ngầm, vũ khí, tuyệt chiêu, bí kíp, bảo bối, thần chú, sinh tử, sống còn, tử huyệt, chí mạng, thảm họa/thảm hoạ, cú lừa, cẩm nang tác chiến, so găng, sát thủ, cứu hỏa, chữa cháy, sập bẫy*. Ngoại lệ `giải mã` chỉ trong ngữ cảnh decode.
7. (E) Giai thoại cá nhân: `Tôi còn nhớ`, `Tôi từng`, `Mình còn nhớ`, `Hồi đó tôi`, `Câu chuyện của tôi`, `I remember`. (W) Khẩu ngữ: `game changer`, `Problem solved`, `boom`, `magic`, `siêu dễ`, `cực kỳ đỉnh`.
8. (W) Tiêu đề có ẩn dụ dạng `"..." vs "..."` hoặc có ngoặc kép trong `##`/`title`/`objectives`.

**Quiz/card/bài tập**
9. (E) Quiz: `answer` ngoài phạm vi (`mc`: chỉ số hợp lệ; `tf`: boolean; `output`: chuỗi); thiếu `explain`. (W) < 4 quiz hoặc 1 loại; < 5 card; `explain` < 40 ký tự.
10. (E) Activity theo 06 §8 (schema, tham chiếu, engine: starter không đạt, solution 3 sao, traps không đạt, `expected` khớp engine).

**Mô phỏng và stage**
11. (E) `sim.json`: model hợp lệ (đồ thị DAG, id duy nhất, link tới node tồn tại, knob trong khoảng), scenario chạy hết `durationSec` không NaN/∞; `expect` thoả (bottleneck, mốc thời gian) khi chạy engine; mọi `preset` đúng `expectPass`.
12. (E) `stage.json`: mọi node/link trong `scenes`/`live` tồn tại trong sim; scene dùng cho `live` không có `state.loadPct/dead/badge`; `show` ⊆ model; `LiveDef.controls.knobs` ⊆ knob `live` của sim. (W) scene không phủ node nào của model.
13. (E) Biến `{…}` trong `telemetry`/`callout`/`explain` không phân giải được hoặc không hữu hạn.
14. (W) Telemetry tĩnh (số viết tay) trong step có `sim`.

**Nguồn và độ biên tập**
15. (E) So `lesson.md` với `_source/sdc/<path>` (n-gram 12 từ sau chuẩn hoá khoảng trắng/dấu): trùng nguyên văn ≥ 70% ⇒ lỗi "chưa biên tập"; ≥ 40% ⇒ cảnh báo. Chỉ áp cho bài có `source.kind:'sdc'`.
16. (E) `lesson.md`/`stage.json` chứa đường dẫn tới `_source/` hoặc tới bundle/domain dữ liệu DTS (`designed-to-scale`) ngoài `dtsRef` (id thẻ nội bộ).

**An toàn**
17. (E) Secret scan (Slack/Discord webhook, GitHub PAT, AWS Key thật, PEM) như `pmp-doctor.mjs`.
18. (W) Công nghệ lỗi thời trong ví dụ cấu hình (theo `content/README.md` §4), trừ khi gắn nhãn "outdated".

**Tổng hợp**
19. (I) Báo cáo: số module/step/quiz/card/activity/sim; % chuỗi EN còn thiếu; số module `status:'draft'`; danh sách module thiếu dòng trong `02-curriculum.md`.

---

## 7. Gợi ý thực hành cho agent biên soạn

- Làm theo **một bài một worktree/commit** (`feat(sdmastery): T6.<batch> S1-04 …`, quy ước ở `08-workflow.md` §8). Chạy `sd:doctor` thường xuyên khi viết, không dồn cuối.
- Viết `sim.json` **trước** khi viết số liệu trong lời giảng; lấy số từ engine bằng biến `{…}`.
- Viết `stage.json` tối giản trước (`show` tăng dần theo step); thêm `inspector` sau.
- Khi nghi ngờ về giấy phép/trích dẫn: **viết lại ý bằng lời của mình** (`source.adaptation: 'rewritten'`) thay vì giữ cấu trúc câu gốc.
- Không kéo nội dung từ DTS; thẻ `reference/dts-models.md` chỉ cho biết "cần mô hình gì".

---

## 8. Chưa quyết

| # | Vấn đề | Mặc định đề xuất |
|---|---|---|
| 1 | Tên phase/id module | theo `02-curriculum.md` (nguồn sự thật) |
| 2 | Quy trình rút nội dung nếu tác giả SDC phản đối | `01-sources-and-credits.md`; ở đây chỉ nêu cơ chế `source` |
| 3 | `lesson.en.md` ghép theo chỉ số step | chốt ở M8 |
| 4 | Dòng nguồn trên UI | Đã chốt: `ScaleModuleLesson.attribution` (05 §2) hiển thị cuối cột phải + trang Credits (01 §3.2) |
| 5 | Khối `visual` kiểu mới cho bảng đánh đổi (trade-off matrix) | dùng `compare` hiện có; thêm kind mới chỉ khi M6 cần |
