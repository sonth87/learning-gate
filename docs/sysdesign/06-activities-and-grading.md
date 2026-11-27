# 06 — Bài tập (activities) và chấm điểm

> Nguồn sự thật cho M4 và cho trường `activities.json` của mỗi module (07). Vòng học của app: **Xem → Đoán → Phá → Sửa → Giải thích**; tài liệu này định nghĩa 9 dạng bài tập phục vụ các bước Đoán, Phá, Sửa, Giải thích, và cách chấm, lưu, thưởng XP.
>
> Phụ thuộc: `04-simulation-engine.md` (§6 `analyze`, §7 `grade`, `simulate`, `InputChange`, `Constraint`), `05-live-stage.md` (stage, `pickMode`, `LiveSimSession`, nút "Xem trên mô phỏng"). Văn phong UI theo `docs/scale-workbench-guidelines.md` §5 (không ẩn dụ giật tít, không từ y khoa/quân sự hoá).

---

## 1. Nguyên tắc

1. **Chấm bằng hàm thuần, xác định (deterministic)**: `gradeActivity(activity, answer, ctx) → GradeResult`. Không IO, không `Date`, không `Math.random`; mọi thứ ngẫu nhiên (nếu có) qua seed của scenario. Cùng đầu vào cho cùng kết quả (doctor và test dựa vào đây).
2. **Đáp án đúng được suy ra từ engine khi có thể** (bottleneck, node quá tải đầu tiên, SPOF, tải tối đa). Tác giả vẫn ghi `expected` để làm tài liệu, và **doctor kiểm `expected` khớp engine**; nhờ đó nội dung không lệch khi engine đổi.
3. **Không dạy sai**: bài có "bẫy" (ví dụ "thêm app server") phải có `traps[]` và doctor khẳng định bẫy **không đạt**.
4. **Phản hồi giải thích**, không chỉ đúng/sai: luôn kèm số liệu từ mô phỏng và nút **Xem trên mô phỏng**.
5. **Lưu nhẹ, hợp nhất an toàn**: kết quả đi vào `WpState` hiện có (mục 6), thay đổi type tối thiểu.

---

## 2. Kiểu dữ liệu chung (`activities/types.ts`)

```ts
import type { Constraint, TimeWindow, NodeId, LinkId, InputChange, NodeState } from '../sim';

export type Loc = { vi: string; en?: string };          // en thiếu ⇒ UI dùng vi
export type ActivityKind =
  | 'predict' | 'spot-bottleneck' | 'tune-to-limit' | 'estimate' | 'fix-challenge'
  | 'order' | 'timeline-read' | 'postmortem' | 'design-constraint';

export type Gate = 'required' | 'optional';

/** Trỏ về một khoảnh khắc trên mô phỏng để nút "Xem trên mô phỏng" mở ra. */
export interface ReplayRef {
  simId: string;
  seekSec?: number;                       // mặc định 0
  /** thay đổi áp dụng trước khi phát (vd các thay đổi của người học) */
  changes?: Change[];
  focus?: { nodes?: NodeId[]; links?: LinkId[] };
  speed?: 1 | 2 | 5;
  autoplay?: boolean;
}

/** Thay đổi người học được phép làm (đồng nhất với InputChange của engine, chỉ lấy loại tĩnh). */
export type Change =
  | { type: 'knob'; node: NodeId; key: string; value: number | string | boolean }
  | { type: 'link'; link: LinkId; patch: Record<string, unknown> };

export type AllowedAction =
  | { type: 'knob'; node: NodeId; key: string; min?: number; max?: number; values?: (number | string | boolean)[] }
  | { type: 'link'; link: LinkId; fields: ('timeoutMs' | 'retry' | 'breaker' | 'fallback' | 'weight')[] };

export interface ActivityBase {
  id: string;                             // `${moduleId}.A${n}`, duy nhất toàn khoá, vd 'S1-03.A2'
  kind: ActivityKind;
  title: Loc;
  prompt: Loc;                            // đề bài
  difficulty: 1 | 2 | 3;
  hints?: Loc[];                          // tối đa 3, từ gợi ý nhẹ đến gợi ý mạnh
  explain: Loc;                           // giải thích sau khi chấm; hỗ trợ biến {node.field@t:dp} (mục 8.3)
  sim?: ReplayRef;                        // trạng thái stage khi bắt đầu bài (seek, focus, preset)
  replay?: ReplayRef;                     // "Xem trên mô phỏng" sau khi chấm (mặc định = sim)
  passScore?: number;                     // mặc định 70 (trừ fix/design: theo ràng buộc)
  xp?: number;                            // ghi đè XP gốc theo kind (bảng mục 7)
  relatedCards?: string[];                // id flashcard gợi ý ôn khi làm sai
  tags?: string[];
  standalone?: boolean;                   // true: không gắn vào step (lab/war-room)
}

export interface CheckItem {
  id: string;
  label: Loc | string;
  pass: boolean;
  weight: number;                         // trọng số trong score
  got?: number | string;
  want?: number | string;
}

export interface GradeResult {
  activityId: string;
  kind: ActivityKind;
  passed: boolean;
  score: number;                          // 0..100
  stars: 0 | 1 | 2 | 3;
  checks: CheckItem[];
  verdict: 'correct' | 'partial' | 'wrong';
  vars: Record<string, number | string>;  // biến đã tính, dùng nội suy explain
  usage?: { changes?: number; costPerHour?: number };
  replay?: ReplayRef;                     // đã điền changes của người học
}

export interface GradeContext {
  sims: Record<string, SimDoc>;           // sim.json đã nạp (scenario + presets + expect)
  simulate: typeof import('../sim').simulate;
  analyze: typeof import('../sim');       // findBottleneck, findSpofs, maxSustainableRps, structuralWarnings
  evaluate: typeof import('../sim').evaluate;
  hintsUsed: number;                      // chỉ để ghi nhận, không ảnh hưởng score (ảnh hưởng XP)
}

export function gradeActivity(a: Activity, answer: ActivityAnswer, ctx: GradeContext): GradeResult;
/** Bản bất đồng bộ cho fix/design: chạy simulate theo lô, nhường luồng mỗi ~50 tick. */
export function gradeActivityAsync(a: Activity, answer: ActivityAnswer, ctx: GradeContext, signal?: AbortSignal): Promise<GradeResult>;
```

**Sao các dạng "Đoán/Chỉ ra" cần engine?** Đáp án là kết quả chạy `simulate(scenario)` (một lần, ≤ 1 s) hoặc đọc từ `expect` đã hiệu lực; `GradeContext` cung cấp cả hai. Ở UI, nếu `simulate` chạy lâu, hiện trạng thái "Đang kiểm tra…" và dùng `gradeActivityAsync`.

---

## 3. Chín dạng bài tập

Ghi chú: cột "Bài tập" của `02-curriculum.md` chỉ dùng chín giá trị `ActivityKind` dưới đây; bài không có activity (chỉ quiz và cards) ghi `—`. Không có kind `quiz-only`.

Mỗi dạng: **mục đích**, **kiểu TS**, **cách chấm**, **JSON ví dụ** (dựa trên bài mẫu S1-03: `sim.json` ở 04 §10). `answer` là thứ UI gửi vào `gradeActivity`.

### 3.1 `predict` — Đoán trước, rồi xem

Mô phỏng tạm dừng ở `at` giây; người học dự đoán trước khi chạy tiếp (bước **Đoán**).

```ts
export interface PredictActivity extends ActivityBase {
  kind: 'predict';
  at: number;                              // dừng mô phỏng tại t (giây)
  question: PredictQuestion;
  reveal: { playFromSec: number; playToSec: number; speed?: 1 | 2 | 5 };
}
export type PredictQuestion =
  | { type: 'node'; rule: { first: NodeState; after: number }; expected: NodeId[]; partial?: NodeId[] }
  | { type: 'choice'; options: Loc[]; correct: number }
  | { type: 'number'; metric: string; atSec: number; expected: number; tolerancePct: number; unit?: string };
export type PredictAnswer = { node: NodeId } | { choice: number } | { value: number } | null;
```
- `node`: đáp án = **node đầu tiên** đạt state `first` sau thời điểm `after` (tính từ engine bằng cách duyệt `RunSeries`; hòa trong ≤ 0,5 s ⇒ cả hai được chấp nhận). `expected` là tài liệu và được doctor đối chiếu. `partial` = node cho điểm một phần (40 điểm), ví dụ node thứ hai.
- Chấm: `node`: 100 nếu thuộc tập đúng; 40 nếu thuộc `partial`; 0 nếu khác. `choice`: 100/0. `number`: như `estimate` (§3.4) với `tolerancePct`.
- `passScore` mặc định 70 ⇒ `node` đúng mới đạt.

```json
{
  "id": "S1-03.A1",
  "kind": "predict",
  "title": { "vi": "Node nào quá tải trước?" },
  "prompt": { "vi": "Tải đang tăng từ 200 lên 5 000 req/s. Mô phỏng dừng ở giây thứ 20. Theo bạn, node nào sẽ chuyển sang trạng thái Quá tải đầu tiên?" },
  "difficulty": 1,
  "at": 20,
  "question": {
    "type": "node",
    "rule": { "first": "overloaded", "after": 20 },
    "expected": ["db"]
  },
  "reveal": { "playFromSec": 20, "playToSec": 42, "speed": 2 },
  "hints": [
    { "vi": "So sánh năng lực xử lý của từng node với lưu lượng đi vào node đó, không phải tổng lưu lượng." },
    { "vi": "Cache giữ lại khoảng một nửa số lượt đọc. Phần còn lại cộng với mọi lượt ghi đi tới database." }
  ],
  "explain": { "vi": "Database nhận khoảng 53% lưu lượng (phần cache không trả lời và toàn bộ lượt ghi), nhưng năng lực chỉ 1 600 req/s. Database là node đầu tiên quá tải, vào giây {t.first.db:0}; lưu lượng vào DB là {db.lambda@36:0} req/s so với năng lực 1 600 req/s (ρ = {db.rho@36:2}). Lưu lượng vào các node app chỉ bằng ρ = {app1.rho@36:2}." },
  "sim": { "simId": "S1-03/ramp", "seekSec": 20, "autoplay": false },
  "replay": { "simId": "S1-03/ramp", "seekSec": 20, "focus": { "nodes": ["db"] }, "autoplay": true, "speed": 2 }
}
```

### 3.2 `spot-bottleneck` — Chỉ ra điểm nghẽn / điểm lỗi đơn

Người học click node (hoặc nhiều node) trên stage đang đóng băng ở một thời điểm hoặc trên cấu trúc tĩnh.

```ts
export interface SpotActivity extends ActivityBase {
  kind: 'spot-bottleneck';
  mode: 'bottleneck' | 'spof' | 'slow-dependency' | 'retry-amplifier';
  atSec?: number;                          // mode bottleneck/slow-dependency: thời điểm xem
  maxPicks: number;                        // 1 cho bottleneck; >1 cho spof
  expected: NodeId[];                      // tài liệu; doctor kiểm bằng analyze
  scoring?: 'jaccard' | 'exact';           // mặc định 'jaccard'
}
export type SpotAnswer = { picks: NodeId[] };
```
- `mode` ánh xạ sang hàm engine: `bottleneck` → `findBottleneck(model, frame@atSec).nodeId`; `spof` → `findSpofs(model)` lấy node có `severity:'error'`; `slow-dependency` → node có `reason:'slow-dependency'` trỏ về callee; `retry-amplifier` → link có `amplification` lớn nhất trong frame.
- Chấm: Jaccard `|P∩T|/|P∪T|·100`. `maxPicks` ngăn chọn tất cả. `pass` khi ≥ `passScore` (mặc định 99 với `maxPicks=1`, 70 với multi).

```json
{
  "id": "S1-03.A2",
  "kind": "spot-bottleneck",
  "title": { "vi": "Chỉ ra điểm nghẽn" },
  "prompt": { "vi": "Tại giây 38, người dùng thấy p99 vượt 2 giây dù 3 node app còn rảnh. Nhấn vào node là điểm nghẽn của hệ thống." },
  "difficulty": 1,
  "mode": "bottleneck",
  "atSec": 38,
  "maxPicks": 1,
  "expected": ["db"],
  "hints": [{ "vi": "Tìm node có hàng đợi chất đống phía trước và ρ ≥ 1." }],
  "explain": { "vi": "{db.name} đang ρ = {db.rho@38:2} với hàng đợi {db.queue@38:0} request; trong khi app chỉ ρ = {app1.rho@38:2}. Mọi request phải đi qua DB nên p99 toàn hệ thống bị quyết định bởi thời gian chờ ở DB ({db.queueWaitMs@38:0} ms)." },
  "sim": { "simId": "S1-03/ramp", "seekSec": 38, "autoplay": false }
}
```

### 3.3 `tune-to-limit` — Tinh chỉnh tới giới hạn

Hai biến thể (`objective`):
- `max-load`: tìm **tải tối đa** hệ thống giữ SLO (người học nhập số sau khi thử bằng núm tải).
- `min-cost`: tìm cấu hình **rẻ nhất** vẫn đạt SLO ở tải cố định.

```ts
export interface TuneActivity extends ActivityBase {
  kind: 'tune-to-limit';
  objective: 'max-load' | 'min-cost';
  constraints: Constraint[];               // SLO phải giữ
  runSec: number;                          // thời gian mỗi lần thử (≥ cửa sổ constraint)
  // max-load
  loadUnit?: 'rps';
  reference?: { value: number; tolPassPct: number; tolFullPct: number };  // vd 3010 ± 10% ± 5%
  // min-cost
  allowed?: AllowedAction[];
  fixedLoadRps?: number;
  par?: { costPerHour: number; changes: number };
}
export type TuneAnswer =
  | { objective: 'max-load'; value: number }
  | { objective: 'min-cost'; changes: Change[] };
```
- `max-load`: chấm **bằng kiểm chứng chạy mô phỏng**, không chỉ so số: (1) chạy ở tải `value` ⇒ phải đạt `constraints` (`claimHolds`); (2) chạy ở `value·1,15` ⇒ phải **không** đạt (`claimTight`); (3) `err = |value − reference.value|/reference.value`. Điểm: `100` nếu `claimHolds ∧ claimTight ∧ err ≤ tolFull`; `70` nếu `claimHolds ∧ err ≤ tolPass`; `40` nếu `claimHolds` nhưng quá bảo thủ (`!claimTight`); `0` nếu `!claimHolds`. Cần 2 lần `simulate` ngắn (`runSec` ≈ 30 s ⇒ 600 tick).
- `min-cost`: chạy cấu hình; phải đạt `constraints` và đúng `allowed`; điểm `= 100·clamp(par.costPerHour/cost, 0, 1)`; đạt khi `cost ≤ par.costPerHour·1,25`.

```json
{
  "id": "S1-03.A3",
  "kind": "tune-to-limit",
  "title": { "vi": "Tìm tải tối đa hệ thống chịu được" },
  "prompt": { "vi": "Dùng núm tải để tìm lưu lượng cao nhất (req/s) mà hệ thống hiện tại vẫn giữ p99 ≤ 300 ms và lỗi ≤ 1%. Nhập kết quả." },
  "difficulty": 2,
  "objective": "max-load",
  "constraints": [
    { "id": "p99", "kind": "slo-latency", "metric": "p99", "maxMs": 300, "window": { "fromSec": 20, "toSec": 40 }, "allowViolationPct": 2 },
    { "id": "err", "kind": "slo-error", "maxRate": 0.01, "window": { "fromSec": 20, "toSec": 40 } }
  ],
  "runSec": 40,
  "reference": { "value": 2950, "tolPassPct": 10, "tolFullPct": 5 },
  "hints": [{ "vi": "Tìm node đầu tiên có ρ chạm 1 khi tăng tải, rồi tính lưu lượng làm ρ của nó bằng 1." }],
  "explain": { "vi": "Giới hạn do database quyết định: năng lực 1 600 req/s chia cho tỉ lệ {db.share@0:2} lưu lượng đổ vào DB ≈ {ref.value:0} req/s. Vượt mức này hàng đợi ở DB tăng không dừng." },
  "sim": { "simId": "S1-03/ramp", "seekSec": 0, "autoplay": false }
}
```
(Giá trị `reference.value` ở ví dụ lấy từ `expect.maxSustainableRpsApprox` ≈ 3 010 và độ lệch do retry; doctor tính lại bằng bisection và so với số ghi trong file, sai > 3% thì báo lỗi để tác giả cập nhật.)

### 3.4 `estimate` — Ước lượng nhanh (sai số %)

Napkin math; đáp án số, chấm theo **sai số tương đối** hoặc theo bậc độ lớn.

```ts
export interface EstimateActivity extends ActivityBase {
  kind: 'estimate';
  quantity: string;                        // mô tả đại lượng cần ước lượng
  unit: string;                            // 'req/s', 'GB', 'ms'
  truth:
    | { type: 'fixed'; value: number }
    | { type: 'engine'; metric: string; atSec: number; node?: NodeId }   // lấy từ chạy sim
    | { type: 'formula'; expr: string; vars: Record<string, number> };    // chỉ + - * / ^ ceil floor
  scale: 'linear' | 'log10';               // linear: sai số %; log10: sai số bậc độ lớn
  tol: { full: number; pass: number };      // linear: 0.15/0.30 (±15%/±30%); log10: 0.15/0.3 (bậc)
  workings?: Loc[];                         // gợi ý các bước tính (hiện sau khi chấm)
  apply?: { node: NodeId; key: string };    // tuỳ chọn: đưa kết quả của người học vào sim ("kết quả đưa vào sim")
}
export type EstimateAnswer = { value: number } | null;
```
Chấm: `err = scale==='linear' ? |x−t|/t : |log10(x/t)|`. Điểm: `100` nếu `err ≤ tol.full`; `70` nếu `≤ tol.pass`; `40` nếu `≤ 2·tol.pass`; ngược lại `0`. Đạt khi ≥ `passScore`. `x ≤ 0` ⇒ 0. UI hiển thị "Bạn: 1 200; Đáp án: 1 650 (lệch −27%)" kèm `workings`.

```json
{
  "id": "S1-03.A4",
  "kind": "estimate",
  "title": { "vi": "Database nhận bao nhiêu request?" },
  "prompt": { "vi": "Hệ thống nhận 3 000 req/s, 90% là lượt đọc, cache trả lời khoảng 52% lượt đọc. Mỗi lượt ghi đều đi tới database. Ước lượng số req/s database phải xử lý." },
  "difficulty": 2,
  "quantity": "Lưu lượng vào database",
  "unit": "req/s",
  "truth": { "type": "formula", "expr": "3000*(0.9*(1-0.52)+0.1)", "vars": {} },
  "scale": "linear",
  "tol": { "full": 0.1, "pass": 0.25 },
  "workings": [
    { "vi": "Đọc đi tới DB: 3 000 × 0,9 × (1 − 0,52) = 1 296 req/s." },
    { "vi": "Ghi đi tới DB: 3 000 × 0,1 = 300 req/s." },
    { "vi": "Tổng ≈ 1 596 req/s ≈ 1 600: DB đã gần ρ = 1." }
  ],
  "hints": [{ "vi": "Tách lượt đọc và lượt ghi. Cache chỉ giúp lượt đọc." }],
  "explain": { "vi": "Giá trị đúng ≈ {truth:0} req/s. Con số này sát năng lực 1 600 req/s của DB, nên ở 3 000 req/s hệ thống đã sát giới hạn." },
  "replay": { "simId": "S1-03/ramp", "seekSec": 33, "focus": { "nodes": ["db"] } }
}
```

### 3.5 `fix-challenge` — Thử thách sửa (trọng tâm)

Hệ thống đang vi phạm SLO. Người học có **ngân sách** và **tập hành động được phép**; kết quả được chấm bằng cách chạy lại mô phỏng từ t=0 với các thay đổi.

```ts
export interface FixActivity extends ActivityBase {
  kind: 'fix-challenge';
  simId: string;                           // trong sim.json
  presetStart?: string;                    // preset khởi điểm (mặc định: scenario gốc)
  budget: { maxChanges: number; maxCostPerHour?: number };
  allowed: AllowedAction[];
  goal: Constraint[];                      // ràng buộc cứng; tất cả phải đạt để pass
  soft?: Constraint[];                     // ràng buộc mềm; tính vào sao
  observe: { runSec: number };             // thời gian quan sát (t=0 → runSec)
  par: { changes: number; costPerHour: number };
  solution: Change[];                      // đáp án mẫu (doctor kiểm đạt 3 sao)
  traps?: { id: string; label: Loc; changes: Change[]; why: Loc }[]; // bẫy: doctor kiểm không đạt
}
export type FixAnswer = { changes: Change[] };
```
**Cách đánh giá** (thuần, tái lập):
1. **Chuẩn hoá thay đổi:** gộp các thay đổi trùng `(node,key)` giữ giá trị cuối; loại thay đổi trả về giá trị gốc (không tính). `changeCount = Σ changeCost` (`Knob.changeCost` mặc định 1; link patch tính 1 mỗi trường).
2. **Hợp lệ:** mỗi thay đổi phải nằm trong `allowed` (đúng `node/key`, trong `[min,max]` hoặc thuộc `values`); sai ⇒ `checks` ghi `invalid-change`, `passed=false`, `score=0`.
3. **Ngân sách:** `changeCount ≤ budget.maxChanges`; nếu có `maxCostPerHour`: `costPerHour(model sau thay đổi) ≤ …`.
4. **Chạy:** `simulate(scenario, changes@tick0)` trong `observe.runSec`, không sinh chấm. `evaluate(goal ∪ soft, run, model')`.
5. **Điểm & sao:**
   - `passed` ⇔ mọi `goal` đạt ∧ ngân sách đạt.
   - ★ = passed. ★★ = passed ∧ mọi `soft` đạt. ★★★ = ★★ ∧ `changeCount ≤ par.changes` ∧ `costPerHour ≤ par.costPerHour·1,1`.
   - `score = 100·(Σ w_i·pass_i)/(Σ w_i)` với `goal` trọng số 3, `soft` trọng số 1, cộng bonus hiệu quả tối đa 10 điểm theo `par`. Nếu `!passed` thì `score ≤ 69` (không vượt `passScore` mặc định 70).
6. **Phản hồi:** `checks` liệt kê từng ràng buộc (giá trị đo vs ngưỡng, `worstAtSec` để nhảy tới). Với bẫy trúng (`traps` khớp tập thay đổi) hiển thị `why` ("Thêm instance app không giảm p99 vì DB mới là điểm nghẽn").

```json
{
  "id": "S1-03.A5",
  "kind": "fix-challenge",
  "title": { "vi": "Đưa p99 về dưới 300 ms" },
  "prompt": { "vi": "Hệ thống bắt đầu vi phạm SLO từ giây 35. Với tối đa 3 thay đổi và chi phí không quá 2,50 USD/giờ, hãy giữ p99 ≤ 300 ms và lỗi ≤ 1% trong suốt 90 giây (kể cả khi tải đạt 5 000 req/s)." },
  "difficulty": 3,
  "simId": "S1-03/ramp",
  "budget": { "maxChanges": 3, "maxCostPerHour": 2.5 },
  "allowed": [
    { "type": "knob", "node": "cache", "key": "capacityKeys", "min": 10000, "max": 100000 },
    { "type": "knob", "node": "db", "key": "sizeFactor", "min": 1, "max": 4 },
    { "type": "knob", "node": "app1", "key": "replicas", "min": 1, "max": 6 },
    { "type": "knob", "node": "app2", "key": "replicas", "min": 1, "max": 6 },
    { "type": "knob", "node": "app3", "key": "replicas", "min": 1, "max": 6 },
    { "type": "link", "link": "cache-db", "fields": ["retry", "timeoutMs", "breaker"] }
  ],
  "goal": [
    { "id": "p99", "kind": "slo-latency", "metric": "p99", "maxMs": 300, "window": { "fromSec": 0, "toSec": 90 }, "allowViolationPct": 2 },
    { "id": "err", "kind": "slo-error", "maxRate": 0.01, "window": { "fromSec": 0, "toSec": 90 } }
  ],
  "soft": [
    { "id": "db-calm", "kind": "node-state", "node": "db", "notIn": ["saturated", "overloaded", "down"], "window": { "fromSec": 0, "toSec": 90 }, "allowViolationPct": 5 },
    { "id": "retry-safe", "kind": "structural", "rule": "has-retry-backoff", "link": "cache-db" }
  ],
  "observe": { "runSec": 90 },
  "par": { "changes": 3, "costPerHour": 2.3 },
  "solution": [
    { "type": "knob", "node": "cache", "key": "capacityKeys", "value": 50000 },
    { "type": "knob", "node": "db", "key": "sizeFactor", "value": 2 },
    { "type": "link", "link": "cache-db", "patch": { "retry": { "max": 2, "backoff": "exponential", "baseMs": 100, "jitter": "full", "budgetRatio": 0.1 } } }
  ],
  "traps": [
    {
      "id": "more-apps",
      "label": { "vi": "Tăng gấp đôi số instance của cả 3 app" },
      "changes": [
        { "type": "knob", "node": "app1", "key": "replicas", "value": 2 },
        { "type": "knob", "node": "app2", "key": "replicas", "value": 2 },
        { "type": "knob", "node": "app3", "key": "replicas", "value": 2 }
      ],
      "why": { "vi": "Tầng app không phải điểm nghẽn. Thêm instance làm tăng chi phí nhưng p99 gần như không đổi, vì mọi request vẫn phải chờ ở database." }
    }
  ],
  "hints": [
    { "vi": "Tìm node có ρ ≥ 1 trước khi quyết định thêm tài nguyên ở đâu." },
    { "vi": "Có hai cách giảm áp lực lên database: giảm lượng request đi tới nó, hoặc tăng năng lực của nó." },
    { "vi": "Cache có đủ chỗ cho tập key đang dùng hay chưa? Hãy xem Hit Ratio trong Inspector." }
  ],
  "explain": { "vi": "Cache lớn hơn nâng Hit Ratio từ {cache.hitRatio@10:0%} lên {cache.hitRatio'@10:0%}, nên lưu lượng vào DB giảm. Scale-up DB gấp đôi đưa ρ xuống {db.rho'@60:2} ở tải 5 000 req/s. Retry có backoff, jitter và budget ngăn việc mỗi lỗi tạo thêm 2 lần gọi." },
  "replay": { "simId": "S1-03/ramp", "seekSec": 30, "focus": { "nodes": ["db", "cache"] }, "autoplay": true }
}
```

### 3.6 `order` — Sắp xếp

Dùng cho đường đi request, các bước leader election/Raft, thứ tự khôi phục sự cố, vòng đời cache miss.

```ts
export interface OrderActivity extends ActivityBase {
  kind: 'order';
  items: { id: string; text: Loc; why?: Loc }[];     // thứ tự khai báo = thứ tự ĐÚNG
  shuffleSeed: number;                                // hoán vị cố định để UI tái lập; doctor kiểm ≠ thứ tự đúng
  partialCredit?: 'adjacent-pairs' | 'none';          // mặc định 'adjacent-pairs'
  groups?: string[][];                                // các item được phép hoán đổi nhau (cùng nhóm)
}
export type OrderAnswer = { order: string[] };
```
Điểm = `100·(số cặp liền kề đúng)/(n−1)` (cặp trong cùng `groups` coi đúng nếu cùng nhóm). Đạt khi `score ≥ passScore` (mặc định 100 với n ≤ 4; 80 với n > 4).

```json
{
  "id": "S1-03.A6",
  "kind": "order",
  "title": { "vi": "Thứ tự một request đi qua hệ thống" },
  "prompt": { "vi": "Sắp xếp các chặng theo thứ tự một lượt đọc bị cache miss đi qua hệ thống." },
  "difficulty": 1,
  "items": [
    { "id": "lb", "text": { "vi": "Load Balancer chọn một app" } },
    { "id": "app", "text": { "vi": "App hỏi cache" } },
    { "id": "miss", "text": { "vi": "Cache không có key (Cache Miss)" } },
    { "id": "db", "text": { "vi": "Request đi tới database" } },
    { "id": "fill", "text": { "vi": "Kết quả được ghi vào cache và trả về" } }
  ],
  "shuffleSeed": 7,
  "explain": { "vi": "Cache Miss đi hết đường tới DB nên độ trễ gồm cả chặng cache lẫn chặng DB; đó là lý do p99 chịu ảnh hưởng của DB dù đa số request là Cache Hit." }
}
```

### 3.7 `timeline-read` — Đọc lịch sử nhiều client

Dựa trên lịch sử thao tác (kiểu Jepsen): học consistency, replication lag, clock.

```ts
export interface HistoryOp {
  id: string;
  client: string;                           // 'A' | 'B' | 'C'
  op: 'write' | 'read';
  key: string;
  value?: number | string;                  // write: giá trị ghi; read: giá trị trả về
  start: number; end: number;               // ms trên trục thời gian thực
  node?: string;                            // replica phục vụ
}
export interface TimelineReadActivity extends ActivityBase {
  kind: 'timeline-read';
  history: HistoryOp[];
  question: 'find-stale-reads' | 'find-violations-of-ryw' | 'find-non-monotonic' | 'find-linearizability-violations';
  expected: string[];                       // id op; doctor kiểm bằng checker của sim/timeline/ (nếu có, 04 §12) hoặc khoá tay
  scoring?: 'f1' | 'exact';                 // mặc định 'f1'
}
export type TimelineReadAnswer = { picks: string[] };
```
Chấm F1 giữa `picks` và `expected` (`precision`, `recall`); đạt khi F1 ≥ 0,8 (hoặc exact). *Chưa quyết (chốt ở T6.0a, 04 §12):* checker tự động trong `sim/timeline/` hay chỉ `expected` viết tay có doctor kiểm bằng định nghĩa thủ công (mặc định: viết tay cho tới khi có engine sự kiện).

```json
{
  "id": "S3-02.A2",
  "kind": "timeline-read",
  "title": { "vi": "Lượt đọc nào trả về dữ liệu cũ?" },
  "prompt": { "vi": "Client A ghi x = 2 rồi gửi ngay lượt đọc tới replica. Chọn các lượt đọc vi phạm Read-Your-Writes." },
  "difficulty": 2,
  "question": "find-violations-of-ryw",
  "history": [
    { "id": "w1", "client": "A", "op": "write", "key": "x", "value": 1, "start": 0,   "end": 20,  "node": "primary" },
    { "id": "w2", "client": "A", "op": "write", "key": "x", "value": 2, "start": 100, "end": 120, "node": "primary" },
    { "id": "r1", "client": "A", "op": "read",  "key": "x", "value": 1, "start": 130, "end": 140, "node": "replica-1" },
    { "id": "r2", "client": "B", "op": "read",  "key": "x", "value": 1, "start": 135, "end": 145, "node": "replica-1" },
    { "id": "r3", "client": "A", "op": "read",  "key": "x", "value": 2, "start": 400, "end": 410, "node": "replica-1" }
  ],
  "expected": ["r1"],
  "explain": { "vi": "r1 của client A đọc giá trị 1 sau khi chính client A đã ghi 2 (w2 kết thúc lúc 120 ms): vi phạm Read-Your-Writes do replica chưa áp dụng w2. r2 là client khác nên chưa vi phạm RYW, chỉ là đọc dữ liệu cũ (stale) có thể chấp nhận theo Eventual Consistency." }
}
```

### 3.8 `postmortem` — Hậu kiểm sự cố

Chạy một sự cố (war-room, M7) hoặc replay một kịch bản, sau đó trả lời cấu trúc. Phần suy ngẫm không chấm.

```ts
export interface PostmortemQuestion {
  id: string;
  type: 'single' | 'multi' | 'rank';
  prompt: Loc;
  options: { id: string; text: Loc }[];
  correct: string[];                         // single: 1 phần tử; multi: tập; rank: thứ tự
  weight: number;                            // Σ weight = 100
  explain?: Loc;
}
export interface PostmortemActivity extends ActivityBase {
  kind: 'postmortem';
  incident: ReplayRef;                       // sim sự cố để xem lại
  questions: PostmortemQuestion[];           // gồm: nguyên nhân gốc, yếu tố góp phần, phát hiện chậm ở đâu, hành động phòng ngừa
  reflection?: { prompt: Loc; saveToNotes?: boolean };   // không chấm; lưu vào NotesDrawer nếu có
}
export type PostmortemAnswer = { answers: Record<string, string[]>; reflection?: string };
```
Chấm theo `weight` (single/multi: multi dùng `max(0, |đúng chọn| − |sai chọn|)/|correct|`; rank: tỉ lệ cặp đúng). Đạt khi `score ≥ 70`. Khung câu hỏi chuẩn (nên có đủ): *Nguyên nhân gốc là gì? · Điều gì làm sự cố lan rộng? · Tín hiệu nào cho phát hiện sớm nhất? · Hành động phòng ngừa nào hiệu quả nhất? (rank)*.

```json
{
  "id": "S4-11.A3",
  "kind": "postmortem",
  "title": { "vi": "Hậu kiểm: Retry storm sau khi triển khai" },
  "prompt": { "vi": "Xem lại sự cố từ giây 0 đến 60 và trả lời các câu hỏi." },
  "difficulty": 3,
  "incident": { "simId": "S4-11/retry-storm", "seekSec": 0, "autoplay": true, "speed": 2 },
  "questions": [
    {
      "id": "root",
      "type": "single",
      "prompt": { "vi": "Nguyên nhân gốc của sự cố là gì?" },
      "options": [
        { "id": "a", "text": { "vi": "Bản triển khai làm một dịch vụ phụ thuộc chậm hơn" } },
        { "id": "b", "text": { "vi": "Cache bị đầy bộ nhớ" } },
        { "id": "c", "text": { "vi": "Thiếu instance ở tầng load balancer" } }
      ],
      "correct": ["a"],
      "weight": 35
    },
    {
      "id": "amplify",
      "type": "multi",
      "prompt": { "vi": "Những yếu tố nào làm sự cố khuếch đại?" },
      "options": [
        { "id": "r", "text": { "vi": "Retry không có backoff" } },
        { "id": "j", "text": { "vi": "Không có jitter nên các retry đồng bộ" } },
        { "id": "t", "text": { "vi": "Timeout dài hơn thời gian xử lý trung bình" } },
        { "id": "d", "text": { "vi": "Dùng cơ sở dữ liệu SQL" } }
      ],
      "correct": ["r", "j", "t"],
      "weight": 35
    },
    {
      "id": "prevent",
      "type": "rank",
      "prompt": { "vi": "Sắp xếp các hành động phòng ngừa từ hiệu quả nhất đến ít hiệu quả nhất." },
      "options": [
        { "id": "cb", "text": { "vi": "Thêm Circuit Breaker" } },
        { "id": "bo", "text": { "vi": "Retry với Exponential Backoff và Jitter, có Retry Budget" } },
        { "id": "to", "text": { "vi": "Đặt timeout hợp lý" } }
      ],
      "correct": ["bo", "cb", "to"],
      "weight": 30
    }
  ],
  "reflection": { "prompt": { "vi": "Nếu là người trực hệ thống, bạn sẽ thêm cảnh báo nào để phát hiện sớm hơn?" }, "saveToNotes": true },
  "explain": { "vi": "Retry không backoff khiến mỗi lỗi sinh thêm tải ngay lập tức; khi dịch vụ phụ thuộc chậm, tải thực tế tăng ≈ {m.amplification@30:1}× và phản hồi dương làm tệ hơn." }
}
```

### 3.9 `design-constraint` — Thiết kế có ràng buộc

Học viên **dựng/sửa** kiến trúc (v1: bật các slot `enabled`, chỉnh knob và link trên stage; v2 (Canvas Lab, M7): kéo thả đồ thị mới) rồi hệ thống chạy qua **nhiều kịch bản** (tải đỉnh, sự cố) và kiểm ràng buộc, kể cả cấu trúc.

```ts
export interface DesignActivity extends ActivityBase {
  kind: 'design-constraint';
  simId: string;
  start: 'preset' | 'empty-canvas';          // 'empty-canvas' chỉ khi Canvas Lab (M7) sẵn sàng
  presetStart?: string;
  palette: { kind: string; max: number; unitCostPerHour?: number }[];   // loại thành phần được dùng
  scenarios: {
    id: string;
    label: Loc;
    simId: string;                           // scenario nền (có thể trùng simId)
    events?: { at: number; type: string; [k: string]: unknown }[];   // sự cố thêm, vd crash app2 ở giây 30
    loadOverride?: { kind: string; [k: string]: unknown };
    constraints: Constraint[];
    weight: number;
  }[];
  structural: Constraint[];                  // kind 'structural': no-spof, has-timeout…
  budget: { maxCostPerHour: number; maxChanges?: number };
  solution: { changes: Change[] };           // v1; ở M7 thay bằng đồ thị
  traps?: FixActivity['traps'];
}
export type DesignAnswer = { changes: Change[] };
```
Chấm: `score = Σ w_s·passRate(scenario_s) · 0,8 + 20 · (số ràng buộc cấu trúc đạt/tổng)`; đạt khi mọi kịch bản `weight ≥ 1` đạt **và** ngân sách đạt. Sao: ★ đạt; ★★ + mọi `structural` đạt; ★★★ + chi phí ≤ `par`.

```json
{
  "id": "S5-02.A1",
  "kind": "design-constraint",
  "title": { "vi": "Thiết kế chịu được mất một instance" },
  "prompt": { "vi": "Giữ p99 ≤ 300 ms và lỗi ≤ 1% ở tải đỉnh 4 000 req/s, và vẫn đạt khi một instance app dừng ở giây 30. Chi phí tối đa 3 USD/giờ. Mọi link đồng bộ phải có timeout." },
  "difficulty": 3,
  "simId": "S1-03/ramp",
  "start": "preset",
  "palette": [
    { "kind": "service", "max": 6, "unitCostPerHour": 0.1 },
    { "kind": "lb", "max": 2, "unitCostPerHour": 0.025 }
  ],
  "scenarios": [
    {
      "id": "peak",
      "label": { "vi": "Tải đỉnh" },
      "simId": "S1-03/ramp",
      "loadOverride": { "kind": "steady", "rps": 4000 },
      "constraints": [
        { "id": "p99", "kind": "slo-latency", "metric": "p99", "maxMs": 300, "window": { "fromSec": 20, "toSec": 90 } },
        { "id": "err", "kind": "slo-error", "maxRate": 0.01, "window": { "fromSec": 20, "toSec": 90 } }
      ],
      "weight": 1
    },
    {
      "id": "lose-app",
      "label": { "vi": "Mất một instance" },
      "simId": "S1-03/ramp",
      "loadOverride": { "kind": "steady", "rps": 4000 },
      "events": [{ "at": 30, "type": "crash", "node": "app2" }],
      "constraints": [
        { "id": "p99-fail", "kind": "slo-latency", "metric": "p99", "maxMs": 300, "window": { "fromSec": 40, "toSec": 90 } }
      ],
      "weight": 1
    }
  ],
  "structural": [
    { "id": "has-timeout", "kind": "structural", "rule": "has-timeout" }
  ],
  "budget": { "maxCostPerHour": 3.0, "maxChanges": 6 },
  "solution": {
    "changes": [
      { "type": "knob", "node": "cache", "key": "capacityKeys", "value": 50000 },
      { "type": "knob", "node": "db", "key": "sizeFactor", "value": 2 },
      { "type": "knob", "node": "app1", "key": "replicas", "value": 2 },
      { "type": "knob", "node": "app2", "key": "replicas", "value": 2 },
      { "type": "knob", "node": "app3", "key": "replicas", "value": 2 }
    ]
  },
  "explain": { "vi": "Ở 4 000 req/s database cần cache đủ chỗ và cỡ máy lớn hơn (ρ ≈ {db.rho'@60:2}). Khi app2 dừng, hai node app còn lại (mỗi node 2 instance) có ρ ≈ {app1.rho'@60:2}, còn dư năng lực. Trong ~{lb.healthCheckSec:0} giây trước khi Load Balancer phát hiện app2 đã dừng, khoảng 1/3 request tới app2 bị lỗi." }
}
```
*(Ví dụ minh hoạ định dạng; `solution` và `par` của bài thật do tác giả điền và doctor chạy kiểm. Chi phí lời giải ≈ 2,6 USD/giờ với số liệu ở 04 §10: LB 0,025 + app 6×0,10 + cache 0,15 + DB 0,80·2^1,2 ≈ 1,84.)*

---

## 4. Gắn activity vào step (`activityId`, `gate`)

- **Định nghĩa** nằm trong `modules/<id>/activities.json` (mảng `Activity`).
- **Gắn** vào step bằng khoá `activity` (và `gate`) trong khối ```` ```step ```` ngay sau tiêu đề `##` của `lesson.md` (cú pháp ở 07 §2.3). Builder (`sdLessonBuilder.ts`) điền `ScaleLessonStep.activityId` và `activityGate` (kiểu ở 05 §2).
- Một step gắn **tối đa 1** activity. Một activity chỉ được gắn **1 lần** (trừ `standalone:true`).
- **Cổng:**
  - `gate: 'optional'` (mặc định): hiện thẻ bài tập ở cột phải; có thể bỏ qua, không chặn điều hướng.
  - `gate: 'required'`: nút **Bước tiếp** và **Hoàn thành bài** bị vô hiệu cho tới khi activity `passed` **hoặc** `solutionViewed` **hoặc** người học chủ động chọn "Bỏ qua bài này" (ghi `status:'skipped'`, không XP). Văn bản trạng thái: "Hoàn thành bài tập này để sang bước tiếp theo."
  - Cơ chế: `SdLearnShell` truyền `renderStepActivity` (render `ActivityGate`) và `isStepLocked` cho `ScaleWorkbenchLayout` (05 §2.1); workbench không import `activities/`.
  - Khuyến nghị tác giả: `required` ≤ 1 mỗi bài (thường `fix-challenge` cuối), còn lại `optional` để không làm gián đoạn dòng học.
- **Hoàn thành module** (`sdModuleProgress`): `[đã, tổng]` với tổng = `1 (đọc bài)` + `1 (quiz nếu có)` + `số activity required`. Một required activity "xong" khi `status ∈ {passed, skipped}` hoặc `solutionViewed`. `skippedModules` vẫn bỏ qua tất cả như hiện nay.
- **Tương tác với stage:** step có activity `predict`/`spot-bottleneck`/`fix-challenge` mở `pickMode`/knob panel của 05 (`LiveSimSpec.pauseAtSec`, `controls.knobs` lấy từ `allowed`). Người học thấy ngay tập núm cho phép; núm ngoài `allowed` bị ẩn/khoá.

---

## 5. Giao diện hoạt động (`ActivityGate`, `ActivityCard`)

Đặt ở cột phải trước mục objectives (05 §5.1). Trạng thái:

```
 ┌ Bài tập · Thử thách sửa ───────────────★☆☆ ┐
 │ Đưa p99 về dưới 300 ms                      │
 │ Còn 3 thay đổi · Chi phí tối đa 2,50 $/giờ  │
 │ [ Mở bảng núm ]   Gợi ý (0/3)   Nộp bài     │
 └─────────────────────────────────────────────┘
 sau khi nộp:
 ┌ Kết quả: Chưa đạt · 58/100 ───────────────┐
 │ ✔ Lỗi ≤ 1%        0,4% (≤ 1%)              │
 │ ✖ p99 ≤ 300 ms    1 840 ms tại giây 38      │
 │ ✔ Ngân sách thay đổi 2/3                    │
 │ Vì sao: Tầng app không phải điểm nghẽn…     │
 │ [ Xem trên mô phỏng ]  [ Thử lại ]  [ Gợi ý ]│
 └─────────────────────────────────────────────┘
```
Quy tắc:
- **Đúng/sai + giải thích + xem trên mô phỏng**: mọi kết quả phải có (1) bảng `checks` đã đo vs ngưỡng; (2) đoạn `explain` đã điền số; (3) nút **Xem trên mô phỏng** (`replay` với `changes` của người học nếu có): đưa timeline tới thời điểm tệ nhất (`worstAtSec`), nổi bật node/link liên quan.
- **Gợi ý (hints):** mở từng gợi ý một, ghi `hintsUsed`; không đổi `score`, chỉ đổi XP (§7).
- **Xem lời giải:** chỉ sau ≥ 2 lần nộp chưa đạt (hoặc sau khi đạt); đặt `solutionViewed=true`; hiển thị `solution` dạng danh sách thay đổi + nút "Áp dụng lên mô phỏng".
- **Nộp nhiều lần:** không giới hạn; ghi `attempts`. `fix-challenge` chạy ≈ 1 s ⇒ nút hiển thị "Đang kiểm tra…" và có thể huỷ (`AbortSignal`).
- **Tự lưu nháp:** thay đổi người học (dạng `Change[]`/lựa chọn) lưu vào `ExerciseRecord.code` (JSON ≤ 4 KB) mỗi 2 giây; mở lại bài tiếp tục từ nháp.
- **Ngôn từ:** dùng "Đạt", "Chưa đạt", "Gợi ý", "Xem giải thích", "Thử lại". Không dùng ngôn từ cảm thán hay quân sự hoá (guidelines §5). Dưới sai: *"Chưa đạt: p99 vẫn cao hơn 300 ms từ giây 36"*, không "Thất bại!".
- **Hỗ trợ:** `aria-live="polite"` cho kết quả; phím `Enter` nộp khi form hợp lệ; bàn phím điều khiển mọi lựa chọn.

---

## 6. Lưu kết quả vào `WpState` (lựa chọn và lý do)

Đã đọc `WpState` (`interface WpState` trong `src/features/workpath/types.ts`): có `lessons`, `quiz`, `quizWrong`, `exercises: Record<string, ExerciseRecord>`, `cards`, `log`, `xp`… PMP đã tái dụng `exercises` cho "case drill" qua `recordCaseDrill` (`src/features/pmp-course/store.ts`) — tiền lệ cùng loại.

### 6.1 Lựa chọn: dùng `exercises[activityId]` (không dùng `quiz`)

| Phương án | Ưu | Nhược | Quyết định |
|---|---|---|---|
| `recordQuiz` (`quiz[moduleId]`, `quizWrong`) | sẵn | Là **điểm tổng của một module**, gắn id câu hỏi; activity không phải trắc nghiệm, nhiều activity/module; sẽ làm sai logic `quizSatisfied` | **Không dùng** cho activity |
| `recordCheck`-kiểu riêng bằng field mới ở `WpState` (vd `activities: Record<…>`) | sạch về ngữ nghĩa | Phải sửa `normalizeWpState`, `mergeWpStates`, `stateRichness`, backup/cloud sync (nhiều file dùng chung), và các app khác sẽ mang field thừa | Không chọn ở v1 |
| **`exercises[activityId]` + 2 field tuỳ chọn** | `ExerciseRecord` đã có `status`, `attempts`, `hints`, `solutionViewed`, `lastScore`, `passedAt`, `code`; `mergeWpStates`, `stateRichness`, backup đã xử lý `exercises`; PMP có tiền lệ | cần 2 field mới để giữ điểm tốt nhất/sao và cập nhật `mergeWpStates` để không làm rơi chúng | **Chọn** |

Ánh xạ field:

| `ExerciseRecord` | Ý nghĩa với activity |
|---|---|
| `status` | `'todo' → 'started'` (mở bài/lưu nháp) `→ 'passed'` (đạt) hoặc `'skipped'` (bỏ qua bài required) |
| `attempts` | số lần nộp |
| `hints` | số gợi ý đã mở (tối đa lần cuối) |
| `solutionViewed` | đã xem lời giải |
| `lastScore` | chuỗi điểm lần nộp gần nhất, vd `"58"` |
| `passedAt`, `skippedAt` | như hiện có |
| `code` | **JSON nháp** câu trả lời đang làm (`{v:1, answer:…}` ≤ 4 KB) |
| **`best?: number`** (mới) | điểm tốt nhất 0..100 |
| **`stars?: 0\|1\|2\|3`** (mới) | số sao tốt nhất |

### 6.2 Chỗ cần mở rộng type (đụng file dùng chung — làm trong T4.1, tuần tự với mọi task khác chạm hai file này)

1. `src/features/workpath/types.ts` — `ExerciseRecord`: thêm `best?: number; stars?: 0 | 1 | 2 | 3;` (tuỳ chọn ⇒ không phá dữ liệu cũ, các app khác bỏ qua).
2. `src/db/durableProgressStorage.ts` — trong `mergeWpStates`, nhánh `exercises` (hiện sao chép tường minh từng field, dòng ~178–194): thêm
   ```ts
   best: Math.max(ea.best ?? 0, eb.best ?? 0) || undefined,
   stars: (Math.max(ea.stars ?? 0, eb.stars ?? 0) || undefined) as 0 | 1 | 2 | 3 | undefined,
   ```
   (Nếu không sửa, hai field bị rơi khi hợp nhất giữa tab/IndexedDB/cloud.) Kiểm bằng test hợp nhất trong `sim.test.ts` hoặc test riêng (đã có `mergeWpStates` được import ở `engine.test.ts`).
3. `ActivityId` không đụng độ với id module (`S1-03`) hay id exercise các app khác: prefix `S` + `.A`. Backup/restore dùng chung nên không đổi.

### 6.3 API store (`sysdesign-course/store.ts`, theo mẫu `recordCaseDrill`)

```ts
recordActivity: (r: {
  activityId: string; kind: ActivityKind; xpBase: number;
  score: number; stars: 0|1|2|3; passed: boolean;
  hintsUsed: number; solutionViewed: boolean;
}) => { xp: number; first: boolean; improved: boolean };

saveActivityDraft: (activityId: string, draftJson: string) => void;   // ghi ExerciseRecord.code, status 'started' nếu 'todo'
markActivitySolutionViewed: (activityId: string) => void;
skipActivity: (activityId: string) => void;                           // status 'skipped'
```
Hiện thực trong `mutate(...)` như các hàm sẵn có: cập nhật `attempts++`, `lastScore`, `best=max`, `stars=max`, `hints=max(hints,hintsUsed)`, `passedAt ??= Date.now()`; ghi `log` qua `logXp(s, \`activity:${id}:${score}\`, xp)`.

---

## 7. XP và tiến độ

Bảng XP gốc theo `kind` (`xp` trong activity ghi đè). Tham chiếu: `XP.exercise = 30`, `XP.exerciseAfterSolution = 10`, `XP.quizPerCorrect = 2` (`src/features/workpath/logic.ts:13`).

| kind | XP gốc |
|---|---|
| predict | 6 |
| spot-bottleneck | 8 |
| estimate | 8 |
| order | 6 |
| timeline-read | 10 |
| tune-to-limit | 15 |
| postmortem | 12 |
| fix-challenge | 30 |
| design-constraint | 40 |

```
starMult  = { 1: 0.6, 2: 0.85, 3: 1.0 }
hintMult  = max(0.4, 1 − 0.15·hintsUsed)
xpPass    = round(xpBase · starMult[stars] · hintMult)        // lần đạt đầu tiên
nếu solutionViewed trước khi đạt: xpPass = floor(xpBase · 0.25)
cải thiện sao ở lần sau: xp = round(xpBase · (starMult[new] − starMult[old]))   (≥ 0)
chưa đạt: 0 XP (vẫn ghi attempts/best)
```
- `first=true` khi `status` chuyển sang `passed` lần đầu; `improved=true` khi `stars` tăng hoặc `best` tăng ≥ 5 điểm.
- **Hiển thị:** huy hiệu sao trên thẻ module (Home/Roadmap/Learn): tổng sao `= Σ best stars của activity của module / (3·số activity)`. Lộ trình hiện số `đã đạt/tổng` cho activity required và optional riêng.
- **Liên hệ ôn tập:** nếu `!passed` và activity có `relatedCards` ⇒ UI gợi ý "Ôn các thẻ liên quan" (mở Flash lọc theo id thẻ). Không tự đổi hộp Leitner.
- **Cấp bậc (rank):** `rankOfSd` dùng `s.xp` như PMP (`rankOfPmp`); ngưỡng **Chưa quyết** — chốt ở T1.1a (tạm dùng ngưỡng của PMP), xem lại sau M6.

---

## 8. Doctor: kiểm gì cho activities

`scripts/sysdesign-doctor.mjs` (bundle TS bằng esbuild như `run-sysdesign-tests.mjs`, import `sim/` và `activities/grade`) chạy với **mọi** `activities.json`:

### 8.1 Cấu trúc (không chạy engine)
1. Schema đúng theo kind (trường bắt buộc, kiểu); `id` đúng mẫu `^S\d+-\d+\.A\d+$` và có tiền tố `moduleId`; duy nhất toàn khoá.
2. Mỗi activity được gắn đúng 1 lần trong `lesson.md` (`standalone:true` miễn); mọi khoá `activity` trong khối `step` trỏ tới id có thật; `gate` ∈ {required, optional}; ≤ 1 activity/step; `required` ≤ 2/bài (cảnh báo nếu > 1).
3. `hints.length ≤ 3`; `explain` không rỗng; `difficulty` hợp lệ; `title/prompt` có `vi`.
4. Tham chiếu hợp lệ: `simId` tồn tại trong `sim.json` của module (hoặc module khác được khai báo `uses`); mọi `node/link` trong `allowed/focus/expected/constraints` tồn tại trong model; `Constraint.window ⊆ [0, durationSec]`; `key` của knob tồn tại và giá trị trong `[min,max]`.
5. `postmortem`: `Σ weight = 100`, mỗi câu có ≥ 1 đáp án đúng, `correct ⊆ options`. `order`: các `id` duy nhất; `shuffleSeed` cho hoán vị **≠** thứ tự đúng. `timeline-read`: `start ≤ end`, `expected ⊆ history`.
6. **Văn phong** (guidelines §5): quét `title/prompt/hints/explain/labels` tìm từ cấm (*giải phẫu, phẫu thuật, mổ xẻ, bắt bệnh, vũ khí, tuyệt chiêu, sinh tử, thảm họa, cứu hỏa, chữa cháy, …*) và ẩn dụ giật tít ở tiêu đề.
7. Secret scan chung (theo `pmp-doctor.mjs`).

### 8.2 Chạy engine (lõi của "đạt/không đạt")
```
for each activity a:
  empty = emptyAnswer(a)                          // predict: null; spot: {picks:[]}; fix/design/tune-min-cost: {changes:[]}; estimate: null; order: shuffled; ...
  r0 = gradeActivity(a, empty, ctx)
  assert r0.passed === false && r0.score < passScore       // "starter / không làm gì thì không đạt"

  if a.solution:                                   // fix, design, tune-min-cost, spot (tự suy), …
     r1 = gradeActivity(a, solutionAnswer(a), ctx)
     assert r1.passed && r1.stars === 3            // lời giải đạt đủ 3 sao (par hợp lý)
  computed-answer kinds (predict.node, spot, tune.max-load, estimate.engine):
     assert declaredExpected deepEquals computeFromEngine(a)   // expected khớp engine
     for tune.max-load: bisection ⇒ |ref − authored| / authored ≤ 3%
  for trap of a.traps:
     rt = gradeActivity(a, trapAnswer(trap), ctx)
     assert rt.passed === false                    // bẫy không đạt
     assert tập thay đổi của trap khớp 'why'
  determinism: gradeActivity(a, X) chạy 2 lần ⇒ JSON bằng nhau
  budget sanity: solution thoả budget; 'par' nằm trong khoảng hợp lý (par.changes ≤ budget.maxChanges)
  runtime: tổng thời gian gradeActivity(solution) ≤ 2 s (cảnh báo > 1 s)
```
Điểm bắt buộc "starter/không làm gì thì không đạt" cũng áp dụng cho `fix-challenge` và `design-constraint`: **scenario gốc** phải vi phạm ít nhất 1 ràng buộc cứng (bài phải có thứ để sửa); nếu scenario gốc đã đạt thì bài vô nghĩa, doctor báo lỗi.

### 8.3 Biến nội suy trong `explain`
Cú pháp `{<đối tượng>.<trường>@<t>:<dp>}`:
- `<đối tượng>`: id node (`db`), `m` (metric toàn cục), `ref` (`reference`), `truth`, `t.first.<node>` (thời điểm đầu tiên đạt state), `x'` hậu tố `'` = sau khi áp thay đổi của người học/lời giải.
- `<trường>`: `rho, lambda, served, queue, queueWaitMs, p50, p95, p99, errorRate, hitRatio, lagMs, loadPct, name, share…`
- `@<t>`: giây mô phỏng (mặc định `atSec`/`seekSec` của activity); `:<dp>` số chữ số thập phân; hậu tố `%` định dạng phần trăm (`:0%`).
- Doctor kiểm mọi biến **phân giải được** (không để chuỗi `{…}` thô trong UI) và giá trị hữu hạn.

---

## 9. Kiểm thử (`activities/__tests__/activities.test.ts`)

Theo style `engine.test.ts`; chạy qua `scripts/run-sysdesign-tests.mjs` (entry thứ hai hoặc test bundle chung):
1. Mỗi kind: bộ ca nhỏ (đúng, sai, một phần, rỗng).
2. `estimate`: bảng `err → score` (`0,05 → 100`, `0,20 → 70`, `0,40 → 40` với `tol {0.1,0.25}`).
3. `order`: `adjacent-pairs` với n=5 cho 4/3/2/0 cặp đúng.
4. `fix-challenge` trên S1-03: `solution` ⇒ ★★★; `trap-more-apps` ⇒ không đạt; `[]` ⇒ không đạt; thay đổi ngoài `allowed` ⇒ `invalid-change`.
5. `tune-to-limit max-load`: `value = 2950` ⇒ 100; `value = 2000` ⇒ 40 (bảo thủ); `value = 4000` ⇒ 0.
6. `mergeWpStates` giữ `best`/`stars` (sau mở rộng §6.2).
7. `recordActivity` XP đúng bảng §7 (có và không dùng gợi ý, có xem lời giải).

---

## 10. Chưa quyết

| # | Vấn đề | Mặc định đề xuất | Chốt ở |
|---|---|---|---|
| 1 | Chạy `gradeActivityAsync` ở main thread hay Web Worker | main thread, nhường luồng mỗi ~50 tick; quyết cùng 04 §9.3 | T4.4 |
| 2 | Checker consistency tự động (`sim/timeline/` checker, 04 §12) | v1 viết tay + doctor; checker tự động nếu T6.0a chọn làm engine sự kiện | T6.0a |
| 3 | Rank (`rankOfSd`) ngưỡng XP | tạm theo PMP; xem lại khi biết tổng XP khoá học | T1.1a |
| 4 | Cho phép `design-constraint` với canvas trống | chờ Canvas Lab; v1 chỉ preset + slot `enabled` | T7.1 |
| 5 | Có đóng góp XP/sao từ activity vào "Hoàn thành module" ngoài `required` | Không: chỉ `required` ảnh hưởng tiến độ | T4.1 |
| 6 | Giữ nhiều "bản nộp" để so sánh | Không ở v1 (chỉ `best` và nháp) | T4.1 |
