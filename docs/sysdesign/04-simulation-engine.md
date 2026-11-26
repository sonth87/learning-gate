# 04 — Engine mô phỏng (`src/features/sysdesign-course/sim/`)

> Nguồn sự thật cho M2. Nội dung bám `docs/sysdesign/_brief/PLAN.md` (M2) và `_brief/BRIEF.md` (§2.2–§2.7). Engine là **TypeScript thuần**: không import React, DOM, `window`, `performance`, `Math.random`, `Date`. Mọi sự ngẫu nhiên đi qua RNG có seed (§5).
>
> Trạng thái: **spec M0**, chưa có code. Các con số "tham chiếu" trong §9 được tính tay bằng công thức ở §2 (đã kiểm tra bằng script nháp ngày 2026-11-26) để implementer đối chiếu; nếu code cho kết quả khác quá dung sai, sửa code hoặc sửa tài liệu này kèm ghi vào `DECISIONS.md`, không âm thầm đổi ngưỡng test.

---

## 0. Mục tiêu và phi mục tiêu

**Mục tiêu**
1. Cho người học thấy **xu hướng và độ lớn** đúng của hành vi hệ thống: tải tăng thì hàng đợi và latency tăng vọt (hockey-stick), node nghẽn trước rồi lỗi lan ngược lên, retry không backoff làm tệ thêm, cache nguội gây stampede, replica lag gây đọc cũ.
2. **Deterministic**: cùng `scenario + seed + inputLog` cho cùng chuỗi frame, từng bit. Nhờ đó tua (scrub) và chấm điểm lặp lại được.
3. **Rẻ**: ≤ 1 ms/tick cho ≤ 30 node và ≤ 40 link trên máy phổ thông, để chạy 5× tốc độ mà không giật và để chấm bài headless 120 s mô phỏng trong dưới 1,5 s.
4. **Giải thích được**: mọi con số hiển thị (ρ, queue, p99, hit ratio…) phải suy ra từ công thức trong tài liệu này, để Inspector có thể trả lời "vì sao node này đỏ".

**Phi mục tiêu**
- Không benchmark, không dự báo số tuyệt đối của hệ thống thật. Giao diện luôn ghi: "mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối".
- Không mô phỏng từng request (discrete-event). Dùng **mô hình dòng chảy (fluid model)**: mỗi tick tính tốc độ (req/s) chứ không đếm request. Chấm (packet) trên stage chỉ là mẫu hiển thị (§4), không phải request thật.
- Không mô phỏng GC, CPU cache, TCP congestion, byte băng thông (v1). Băng thông chỉ xuất hiện như một `LinkSpec.maxRps` tuỳ chọn.
- Engine tải (mục 1–11) không mô phỏng giao thức (Raft/Paxos, 2PC, clock, lock): `coordinator` chỉ là node generic. Các bài cần lịch sử nhiều client hoặc state machine dùng **mô phỏng sự kiện** riêng (§12, chốt phạm vi ở T6.0a). Raft trên engine tải và multi-region nâng cao thuộc M8.

---

## 1. Kiểu dữ liệu (`model.ts`, `types.ts`)

Mọi kiểu dưới đây **copy được**. Quy ước: thời gian trong model tính bằng **giây** (`sec`) hoặc **mili giây** (`Ms`) theo hậu tố; tốc độ là req/s (`rps`). `BilingualText` import từ `@/components/scale-workbench/types` **chỉ ở lớp view/adapter**, không ở `sim/` (engine không chứa chuỗi hiển thị, chỉ chứa mã `code`/`key`).

```ts
// ───────────── model.ts ─────────────
export type NodeId = string;
export type LinkId = string;

export type PrimitiveKind =
  | 'client' | 'dns' | 'cdn' | 'lb' | 'gateway' | 'service'
  | 'cache' | 'sql' | 'nosql' | 'queue' | 'log' | 'worker'
  | 'blob' | 'search' | 'rate-limiter' | 'coordinator';

export type KnobValue = number | string | boolean;

export interface Knob {
  key: string;                       // khoá trong NodeSpec.params, ví dụ 'ttlSec'
  type: 'number' | 'select' | 'bool';
  label: { vi: string; en: string };
  min?: number; max?: number; step?: number;     // type number
  options?: { value: string; label: { vi: string; en: string } }[]; // type select
  default: KnobValue;
  unit?: string;                     // 's', 'ms', 'rps', '%'
  /** true: người học được chỉnh khi đang chạy (mặc định true). false: chỉ đặt trong scenario. */
  live?: boolean;
  /** Chi phí đổi núm, dùng cho ngân sách fix-challenge (06). Mặc định 1 "thay đổi". */
  changeCost?: number;
}

export type FailureModeKind = 'crash' | 'slow' | 'partition' | 'data-loss' | 'split-brain';
export interface FailureMode {
  kind: FailureModeKind;
  /** Mô tả hành vi engine; hiển thị ở Inspector. */
  note: { vi: string; en: string };
}

export interface NodeSpec {
  id: NodeId;                        // phải trùng StageNode.id của scene (doctor kiểm)
  kind: PrimitiveKind;
  label: { vi: string; en: string };
  stateful: boolean;
  scaling: 'horizontal' | 'vertical' | 'partitioned';
  replicas: number;                  // số instance giống nhau (>=1)
  capacity: {
    opsPerSec: number;               // μ_i: thông lượng tối đa MỖI instance
    /** Số tác vụ song song tối đa mỗi instance (pool). Mặc định ceil(opsPerSec * baseMs/1000). */
    concurrency?: number;
  };
  latency: {
    baseMs: number;                  // S: service time khi không tải
    /** Hệ số biến thiên (coefficient of variation) của service time, 0..1. Mặc định 0.3. */
    cv?: number;
  };
  costPerHour: number;               // USD mỗi instance mỗi giờ
  costPerMillionReq?: number;        // phần tính theo request (CDN, serverless), tuỳ chọn
  zone?: string;                     // 'az-a' | 'az-b' | 'region-eu'…, dùng tính netMs mặc định
  /** Giá trị các núm; khoá phải nằm trong knobs. */
  params: Record<string, KnobValue>;
  knobs: Knob[];
  failureModes: FailureMode[];
  /** Khởi tạo state tại t=0 (vd cache đã ấm). */
  initial?: { warm?: number; lagMs?: number; queue?: number; down?: boolean };
  /** Ánh xạ sang stage nếu 1 NodeSpec gộp nhiều StageNode (replicas>1 vẽ nhiều khối). */
  view?: { stageIds?: string[] };
}

export type NetClass = 'loopback' | 'same-az' | 'cross-az' | 'cross-region' | 'internet';
/** RTT cộng thêm mặc định (ms) nếu LinkSpec.netMs không khai. */
export const DEFAULT_NET_MS: Record<NetClass, number> = {
  loopback: 0.05, 'same-az': 0.5, 'cross-az': 1.5, 'cross-region': 70, internet: 30,
};

export interface RetryPolicy {
  max: number;                       // số lần THỬ LẠI (không tính lần đầu), 0 = tắt
  backoff: 'none' | 'fixed' | 'exponential';
  baseMs: number;                    // fixed: delay; exponential: delay lần 1
  factor?: number;                   // exponential, mặc định 2
  capMs?: number;                    // trần backoff, mặc định 30_000
  jitter: 'none' | 'full' | 'equal'; // full: U(0,d); equal: d/2 + U(0,d/2)
  /** Retry budget: tổng retry tối đa = budgetRatio × lần gọi đầu (token bucket 10 s). undefined = không giới hạn. */
  budgetRatio?: number;
  /** Có thử lại khi bị rate-limit (429) không. Mặc định false. */
  retryOnLimited?: boolean;
}

export interface BreakerPolicy {
  errorThreshold: number;            // 0..1, mở khi errorRate (EWMA) >= ngưỡng
  minRps: number;                    // chỉ đánh giá khi lưu lượng >= minRps
  windowSec: number;                 // hằng số thời gian EWMA của errorRate
  openSec: number;                   // thời gian mở trước khi half-open
  probeRps: number;                  // lưu lượng thử ở half-open
  closeAfterOk: number;              // ngưỡng success ratio của probe để đóng lại (vd 0.8)
}

export interface LinkSpec {
  id: LinkId;                        // phải trùng StageLink.id
  from: NodeId;
  to: NodeId;
  mode: 'sync' | 'async' | 'pull' | 'replicate';
  /** Loại request đi qua: r = đọc, w = ghi. Mặc định 'rw'. */
  carries?: 'r' | 'w' | 'rw';
  weight?: number;                   // trọng số khi người gọi chọn 1 trong nhiều đích (split). Mặc định 1.
  fraction?: number;                 // xác suất 1 request đi qua link (route 'all'). Mặc định 1.
  calls?: number;                    // số lần gọi mỗi request (N+1 query = 5). Mặc định 1.
  /** Link chỉ mang phần read MISS của 1 cache khác (cache-aside). */
  onMissOf?: NodeId;
  netClass?: NetClass;
  netMs?: number;                    // ghi đè DEFAULT_NET_MS
  timeoutMs?: number;                // undefined = KHÔNG timeout (analyze cảnh báo)
  retry?: RetryPolicy;
  breaker?: BreakerPolicy;
  /** Khi lỗi: 'error' (mặc định) hoặc 'bypass'/'degrade' (người gọi vẫn thành công, ghi nhận degraded). */
  fallback?: 'error' | 'bypass' | 'degrade';
  maxRps?: number;                   // băng thông/giới hạn cứng của link (tuỳ chọn)
}

/** Cách 1 node chia lưu lượng ra các link đi ra. */
export type RouteMode = 'split' | 'all-parallel' | 'all-sequential';

export interface SystemModel {
  nodes: NodeSpec[];
  links: LinkSpec[];
  /** route theo node; mặc định: lb/cdn/dns/cache/queue = 'split', còn lại 'all-sequential'. */
  routes?: Record<NodeId, RouteMode>;
}

// ───────────── scenario ─────────────
export type LoadProfile =
  | { kind: 'steady'; rps: number }
  | { kind: 'ramp'; from: number; to: number; overSec: number }
  | { kind: 'spike'; base: number; peak: number; atSec: number; holdSec: number; riseSec?: number; fallSec?: number }
  | { kind: 'diurnal'; min: number; max: number; periodSec?: number }
  | { kind: 'custom'; points: [number, number][] };  // [tSec, rps], nội suy tuyến tính

export type TimedEvent =
  | { at: number; type: 'crash' | 'recover'; node: NodeId }
  | { at: number; type: 'slowdown'; node: NodeId; addMs: number; durationSec?: number }
  | { at: number; type: 'partition'; link: LinkId }
  | { at: number; type: 'heal'; link: LinkId }
  | { at: number; type: 'cache-expire-all'; node: NodeId }
  | { at: number; type: 'hot-key'; node: NodeId; share: number; durationSec?: number }
  | { at: number; type: 'deploy'; node: NodeId; version: string; bad?: boolean }
  | { at: number; type: 'rollback'; node: NodeId };

export interface SimOptions {
  dtMs: 100;                         // cố định 100; không cho đổi (checkpoint/test dựa vào đây)
  noise: boolean;                    // true: nhiễu Poisson nhẹ cho tải; test bất biến dùng false
  packetTravelSec: number;           // thời gian "bay" hiển thị của 1 chấm, mặc định 1.2
  maxPackets: number;                // mặc định 200
  checkpointEverySec: number;        // K, mặc định 5
  ringCapacityTicks: number;         // mặc định 6000 (10 phút)
}

export interface SimScenario {
  id: string;                        // 'S1-03/ramp'
  model: SystemModel;
  durationSec: number;
  load: LoadProfile;
  events: TimedEvent[];
  seed: number;                      // uint32
  mix?: { readRatio: number };       // mặc định 0.9
  clientTimeoutMs?: number;          // thời gian chờ tối đa người dùng, mặc định 3000
  options?: Partial<SimOptions>;
}
```

```ts
// ───────────── inputs: những gì người học chỉnh khi đang chạy ─────────────
export type InputChange =
  | { type: 'load'; multiplier: number }                       // núm tải ×0.1..×10
  | { type: 'load-profile'; profile: LoadProfile }             // đổi kiểu tải (tính từ t hiện tại)
  | { type: 'knob'; node: NodeId; key: string; value: KnobValue }
  | { type: 'link'; link: LinkId; patch: Partial<Pick<LinkSpec,
      'timeoutMs' | 'retry' | 'breaker' | 'weight' | 'fallback'>> }
  | { type: 'event'; event: Omit<TimedEvent, 'at'> };          // chaos tiêm tức thì (at = t hiện tại)

/** Bản ghi 1 thay đổi: nguồn sự thật để replay. Sắp xếp tăng dần theo tick. */
export interface InputRecord { tick: number; change: InputChange }

/** Giá trị đã gộp tại 1 thời điểm (kết quả fold InputRecord[] tới tick k). */
export interface SimInputs {
  loadMultiplier: number;
  loadProfileOverride?: { profile: LoadProfile; fromTick: number };
  params: Record<NodeId, Record<string, KnobValue>>;           // ghi đè NodeSpec.params
  links: Record<LinkId, Partial<LinkSpec>>;
}
```

```ts
// ───────────── state & frame ─────────────
export type NodeState =
  | 'idle' | 'healthy' | 'busy' | 'saturated' | 'overloaded' | 'down' | 'recovering';

export type BreakerState = 'closed' | 'open' | 'half-open';

/** Mã badge; UI ánh xạ sang chuỗi song ngữ. Engine không chứa văn bản. */
export type BadgeCode =
  | 'DOWN' | 'WARMING' | 'COLD' | 'LAG' | 'QUEUE' | 'LIMIT' | 'DEPLOY' | 'BAD_DEPLOY' | 'HOT' | 'SLOW' | 'PARTITION';

export interface LatencySummary { mean: number; p50: number; p95: number; p99: number } // ms

export interface ErrorBreakdown {  // tỉ lệ trên tổng request ngoài cùng (0..1)
  timeout: number; dropped: number; limited: number; down: number; fault: number; breaker: number;
}

export interface NodeFrame {
  state: NodeState;
  loadPct: number;                   // round(min(1,ρ)*100) → StageNode.loadPct
  rho: number;                       // ρ thô, có thể >1
  lambda: number;                    // rps vào node (kể cả retry), tổng r+w
  served: number;                    // rps được phục vụ
  queue: number;                     // số request đang chờ
  queuePct: number;                  // queue/queueLimit, 0..1 (vẽ queue pile)
  queueWaitMs: number;
  inflight: number;                  // L = λ·W (Little)
  latency: LatencySummary;           // thời gian tại node (không gồm downstream)
  subtreeLatency: LatencySummary;    // gồm downstream
  errorRate: number;                 // lỗi cục bộ (drop/limit/down/fault) trên request vào node
  badge?: { code: BadgeCode; value?: number; tone: 'default' | 'ok' | 'warn' | 'bad' };
  // trường tuỳ kind
  warm?: number;                     // cache/recovering, 0..1
  hitRatio?: number;                 // cache/cdn, 0..1 (đang hiệu lực = target × warm)
  lagMs?: number;                    // replica
  staleReadPct?: number;             // replica, 0..1
  tokens?: number;                   // rate limiter
  backlog?: number;                  // queue: số message
  backlogAgeSec?: number;            // queue: tuổi message cũ nhất ≈ backlog/drain
  hotShare?: number;                 // node partitioned có hot-key
  replicasUp?: number;
}

export interface LinkFrame {
  rps: number;                       // lưu lượng cung cấp lên link (gồm retry)
  retryRps: number;                  // phần retry
  throughput: number;                // rps thành công
  errorRate: number;                 // 1 - p_succ của 1 attempt
  timeoutRate: number;               // p_to
  latencyMs: number;                 // p50 của callee subtree + net (hiển thị link label)
  breaker?: BreakerState;
  style: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut'; // khớp StageLink.style
}

export type SimPacketKind =
  | 'request' | 'response' | 'cache-hit' | 'retry' | 'timeout' | 'dropped' | 'error';

export interface SimPacket {
  id: number;                        // tăng dần, ổn định qua các frame
  linkId: LinkId;
  kind: SimPacketKind;
  reverse: boolean;                  // true = chiều response
  progress: number;                  // 0..1 trên link tại thời điểm frame
  fate?: number;                     // 0..1: tại tiến độ này chấm mờ/rơi (timeout/dropped); undefined = tới đích
}

export interface GlobalMetrics {
  offeredRps: number;                // λ0 (người dùng gửi, chưa tính retry nội bộ)
  goodputRps: number;                // thành công trong clientTimeout
  errorRate: number;                 // 0..1
  errors: ErrorBreakdown;
  latency: LatencySummary;           // quan sát phía client (đã chặn bởi clientTimeoutMs)
  retryRps: number;                  // tổng retry nội bộ
  amplification: number;             // Σ rps mọi link / offeredRps
  queueTotal: number;
  inflight: number;
  costPerHour: number;
  costCumUsd: number;
}

export interface SimFrame {
  tick: number;
  t: number;                         // = tick * 0.1
  nodes: Record<NodeId, NodeFrame>;
  links: Record<LinkId, LinkFrame>;
  packets: SimPacket[];              // đang bay (≤ maxPackets)
  packetScale: number;               // "1 chấm = N req/s"
  metrics: GlobalMetrics;
  firedEvents: { type: TimedEvent['type']; node?: NodeId; link?: LinkId; source: 'scenario' | 'learner' }[];
}
```

`SimState` là trạng thái đầy đủ để checkpoint; **chỉ chứa số, mảng, object thuần (không Map/Set/class/hàm)** để `structuredClone` và `JSON.stringify` được:

```ts
export interface NodeRuntime {
  up: boolean;
  downSinceTick?: number;
  recoveringUntilTick?: number;       // restart + warm-up
  warmProgress: number;               // 0..1 (recovering), 1 khi bình thường
  queue: number;                      // request chờ (service/db) hoặc backlog (queue node)
  rhoPrev: number;                    // ρ tick trước (dùng cho least-conn, hysteresis)
  stateHoldTicks: number;             // đếm hysteresis
  stateShown: NodeState;
  slowAddMs: number; slowUntilTick?: number;
  hotShare: number; hotUntilTick?: number;
  deploy?: { startTick: number; endTick: number; bad: boolean; version: string };
  faultErrorRate: number;             // deploy xấu
  // cache/cdn
  cacheWarm: number; cacheCohort: number; cacheNextExpiryTick?: number;
  // replica
  lagBacklogWrites: number;
  // rate limiter
  tokens: number;
  // lb
  lbWeights: Record<LinkId, number>;  // trọng số đã làm mượt (least-conn)
  lbKnownDown: Record<LinkId, number>;// tick bắt đầu phát hiện chết, -1 nếu chưa
}

export interface LinkRuntime {
  partitioned: boolean;
  /** vòng đệm retry: ring[(tick + d) % len][attemptIdx-1], attemptIdx 1..max */
  retryRing: number[][];
  retryBudgetTokens: number;
  breaker: BreakerState;
  breakerErrEwma: number;
  breakerOpenUntilTick?: number;
  breakerProbeOk: number; breakerProbeN: number;
  lastPSucc: number;
}

export interface SimState {
  tick: number;
  nodes: Record<NodeId, NodeRuntime>;
  links: Record<LinkId, LinkRuntime>;
  costCumUsd: number;
  packetSeq: number;
  packetAcc: Record<LinkId, number>;             // phần dư sinh chấm
  inflightPackets: SimPacket[];                  // chấm đang bay (đã tính progress theo tick)
  packetScale: number;
  firedEventIdx: number;                         // con trỏ vào scenario.events đã sắp xếp
}
```

### 1.1 Bảng núm (`Knob`) chuẩn theo primitive

Mỗi primitive có bộ knob mặc định (file `primitives.ts` xuất `makeNode(kind, overrides)`). Khoá `params`:

| kind | Khoá `params` (mặc định) | Tác dụng |
|---|---|---|
| mọi node | `replicas` (1), `queueLimit` (μ·5 s), `poolSize` (= `capacity.concurrency`), `sizeFactor` (1), `enabled` (true) | số instance; độ sâu hàng đợi tối đa; pool giới hạn thông lượng `μ = min(opsPerSec, poolSize/S)`; scale-up (nhân `μ_i`, chi phí nhân `sizeFactor^1,2`); `enabled=false` = **slot trống** (node ma: không nhận tải, không tính tiền, link tới nó có trọng số 0) |
| `lb`, `dns` | `algorithm` ('round-robin' \| 'least-conn' \| 'weighted' \| 'random' \| 'ip-hash'), `healthCheckSec` (3; dns: `ttlSec`) | cách chia tải; độ trễ phát hiện node chết |
| `cache`, `cdn` | `ttlSec` (300), `ttlJitterPct` (0), `hitRatioMax` (0.9), `workingSetKeys` (100000), `capacityKeys` (100000), `warmupSec` (30), `singleflight` (false) | xem §2.7 |
| `sql`, `nosql` | `shards` (1, nosql/partitioned), `applyRps` (replica: tốc độ áp dụng log), `rewriteHotness` (0.02), `maxConnections` (500) | shard, lag, đọc cũ |
| `queue` | `maxDepth` (100000), `dlq` (false), `visibilitySec` (30) | backlog, DLQ |
| `worker` | `replicas`, `poolSize` | consumer |
| `rate-limiter` | `ratePerSec`, `burst` | token bucket |
| `service`, `gateway` | `replicas`, `poolSize`, `queueLimit` | |

Doctor kiểm: mọi khoá `params` phải thuộc `knobs`; giá trị trong `[min,max]`.

---

## 2. Thuật toán tick

`dt = 0,1 s` cố định (`DT = 0.1`). Hàm lõi **thuần**: `stepState(c: CompiledModel, s: SimState, inputs: SimInputs, scenario): { state: SimState; frame: SimFrame }`. `Sim` (§9) bọc nó và giữ recorder.

### 2.0 Compile (một lần cho mỗi model)
`compile(scenario) → CompiledModel`:
1. Kiểm tra: id duy nhất; link trỏ node tồn tại; **đồ thị đồng bộ (mode `sync`/`async`/`pull`) là DAG** (link `replicate` bị loại khỏi kiểm chu trình vì đi từ primary tới replica; DAG sau khi bỏ nó). Có chu trình → `SimModelError('CYCLE', path)`. Chỉ có ≥1 `client`. `routes` hợp lệ.
2. Sắp xếp topo (Kahn, thứ tự ổn định theo thứ tự khai trong `nodes[]` khi hoà) → `order: Int32Array`; `rev = reverse(order)`.
3. Dựng chỉ số `idx[nodeId]`, mảng link đi ra/đi vào theo node, bộ đệm scratch `Float64Array` (không cấp phát trong vòng tick).
4. Chuẩn hoá mặc định: `concurrency`, `cv`, route mặc định theo kind, `netMs` từ `netClass`/`zone`.

### 2.1 Thứ tự trong 1 tick

```
tick k (t = k·DT)
 0. Áp thay đổi:    inputs ← fold(inputLog tới k); sự kiện scenario & learner tới hạn → cập nhật NodeRuntime/LinkRuntime
 1. Tải vào:        λ0(k) → (λr, λw) tại mỗi client
 2. Năng lực node:  S_eff, μ_tot, c, replicasUp, hệ số recovering/deploy
 3. FORWARD  (topo): với n theo order: λ_in → admission → served_n → chia ra link đi ra (a0_e) + cộng retry đến hạn → λ_link
 4. BACKWARD (rev):  với n theo rev: mô hình phản hồi tại node → độ trễ & thành công của link → subtree (latency, succ, error kinds)
 5. Retry/Breaker:  lập lịch retry vào ring, cập nhật breaker/budget
 6. State:          queue, cache warm/cohort, lag, tokens, hysteresis, lb weights, recovering
 7. Metrics:        toàn cục, cost; sinh chấm; đóng gói SimFrame
```
Nguyên tắc **không có vòng lặp đại số**: retry của tick k chỉ ảnh hưởng tick > k (qua ring). Breaker/ρ/queue đọc giá trị cuối tick trước (`rhoPrev`, `breaker` đầu tick), nên lỗi lan ngược lên và retry storm xuất hiện như phản hồi dương trễ ≥ 1 tick, đúng bản chất.

### 2.2 Bước 0 — đầu vào và sự kiện
- `inputs` = fold `InputRecord[]` có `tick ≤ k` (cache con trỏ; chỉ fold tăng dần).
- Sự kiện scenario: con trỏ `firedEventIdx` trên `events` sắp xếp theo `at`; bắn khi `round(at/DT) ≤ k`. Sự kiện learner lấy từ `InputChange{type:'event'}`.
- Tác động từng sự kiện:

| Sự kiện | Tác động |
|---|---|
| `crash(node)` | `up=false`, `queue=0` (mất), `warmProgress=0`; mọi request tới node: lỗi `down`; nếu có LB phía trước, LB chỉ loại node sau `healthCheckSec` (§2.6) |
| `recover(node)` | `recoveringUntilTick = k + restartSec/DT` (restartSec mặc định 5) rồi warm-up `warmupSec` (§2.4: `μ_eff = μ·(0.3 + 0.7·warm)`); cache: `cacheWarm=0` |
| `slowdown(node,addMs,durationSec?)` | `slowAddMs += addMs`; `S_eff = S + slowAddMs` ⇒ `μ` giảm (vì `μ = min(opsPerSec, concurrency/S_eff)`) |
| `partition(link)` | `partitioned=true`: mọi attempt trên link **không phục vụ và không trả lời** → thành timeout (độ trễ = `timeoutMs`; không có timeout thì `∞` → bị chặn bởi `clientTimeoutMs`). Link `replicate` bị partition: `applyRps=0` |
| `heal(link)` | `partitioned=false` |
| `cache-expire-all(node)` | `cacheWarm=0`, `cacheCohort=0` (đã hết hạn cùng lúc), bắt đầu warm-up lại (§2.7) |
| `hot-key(node,share,durationSec?)` | `hotShare=share` (§2.6 node partitioned) |
| `deploy(node,version,bad?)` | rolling trong `rolloutSec=10`: `replicasUp = replicas − 1` đều rồi trở lại; sau rollout `warmProgress` từ 0.5→1 trong 10 s; nếu `bad`: `faultErrorRate=0.4`, `slowAddMs += 150` cho tới `rollback` |
| `rollback(node)` | huỷ `bad`, `faultErrorRate=0`, rollout lại 10 s |

### 2.3 Bước 1 — tải vào
```
λ0(t) = rpsAt(load, t) × loadMultiplier        // rpsAt: steady/ramp/spike/diurnal/custom, nội suy tuyến tính
nếu options.noise:  λ0 *= 1 + σ·Z   với σ = min(0.05, 1/√max(1, λ0·DT)),  Z ~ N(0,1) từ tickRng(seed,k,ch=1)
(λr, λw) = λ0 × (readRatio, 1 − readRatio)
```
`ramp`: sau `overSec` giữ nguyên `to` tới hết `durationSec`. Nhiều `client`: mỗi client có `params.loadShare` (tổng = 1; mặc định chia đều). `spike`: tăng tuyến tính `riseSec` (mặc định 2) → giữ `holdSec` → giảm `fallSec` (mặc định 2). `diurnal`: `min + (max−min)·(0.5 − 0.5·cos(2π·t/period))`, `period` mặc định `durationSec`.

### 2.4 Bước 2 — năng lực node
Với node `n` có `replicas`, `replicasUp` (bớt khi `down`/`deploy`):
```
S      = (baseMs + slowAddMs) / 1000                        // giây
conc0  = concurrency ?? ceil(opsPerSec · baseMs/1000)       // pool theo thiết kế, KHÔNG đổi khi slowdown
μ_i    = sizeFactor · min(opsPerSec, poolSize / S)          // poolSize mặc định = conc0; sizeFactor mặc định 1
μ_tot  = replicasUp · μ_i · rampFactor
rampFactor = 0.3 + 0.7·warmProgress   (recovering/deploy),  1 nếu bình thường
c      = max(1, round(μ_tot · S))                           // số "server" hiệu dụng cho công thức hàng đợi
```
Ví dụ: DB `opsPerSec=1600, baseMs=4` ⇒ `conc0=ceil(6.4)=7`, `μ_i=min(1600, 7/0.004=1750)=1600`. Slowdown +4 ms ⇒ `S=0.008`, `μ_i=min(1600, 7/0.008=875)=875` (capacity gần giảm một nửa — đúng trực giác "node chậm thì thông lượng giảm").

### 2.5 Bước 3 — FORWARD (lan truyền λ)
Với mỗi node theo `order`:

**a. Tải vào** `A_in = (Ar, Aw)` = tổng `λ_link` của mọi link đi vào, trong đó mỗi link `e`:
```
a0_e      = lượng do node nguồn gửi lần đầu (tính ở bước dưới)
rr_e      = Σ_j ring_e[k % len][j]                       // retry đến hạn tick này
A_e       = a0_e + rr_e
// cổng link (đọc trạng thái đầu tick):
partitioned  → forwarded_e = 0 (không phục vụ, chờ timeout)
breaker open → forwarded_e = 0 (fail-fast, không tới callee)
half-open    → forwarded_e = min(A_e, probeRps)
maxRps       → forwarded_e = min(forwarded_e, maxRps)
else         → forwarded_e = A_e
```
Ghi `A_e` (để vẽ link, đo `rps`) và `forwarded_e` (thực tới callee). Tải callee `λ_in = Σ forwarded_e`.

**b. Admission tại node** (theo kind, xem §2.8–2.9):
- `down`: `served=0`, mọi request vào lỗi `down` (fail-fast, độ trễ ≈ net).
- `rate-limiter`: token bucket (§2.10): `admitted = min(λ_in, tokens/DT + rate)`; phần bị từ chối → `limited` (429, rẻ).
- `lb`/`dns`: không có hàng đợi đáng kể (μ lớn), chia tải ra đích (§2.6).
- `cache`/`cdn`: tách hit/miss (§2.7).
- còn lại: hàng đợi (§2.5c).

**c. Hàng đợi và phục vụ** (service, db, worker, gateway…):
```
λ_adm   = λ_in (đã trừ limited)
served  = min(μ_tot, λ_adm + Q/DT)
Q'      = Q + (λ_adm − served)·DT      (≥ 0)
Qcap    = queueLimit ?? μ_tot·5
nếu Q' > Qcap:  dropped = (Q' − Qcap)/DT ;  Q' = Qcap     // 503 do hàng đợi đầy
ρ       = λ_in / μ_tot                  // ρ thô (kể cả khi >1)
```
Chú ý `served` tính cả request mà người gọi đã **timeout bỏ đi** (công việc lãng phí, `cancelOnTimeout=false` mặc định) — đó là cơ chế khiến retry storm làm tải thật tăng.

**d. Lan ra link đi ra** (`out` = tốc độ node gọi tiếp):
```
out_r = served_r · (đã trừ phần hit nếu cache),  out_w = served_w
route 'split':         mỗi class c: a0_e = out_c · share_e,   share_e = w_e / Σ w (trên các link carries c, đã loại đích bị coi là chết)
route 'all-parallel'/'all-sequential': a0_e = out_c · fraction_e · calls_e (mọi link carries c)
link onMissOf = X:     a0_e(r) = out_r · calls_e · (1 − hitRatio_X)
mode 'async' (vào queue): a0_e = out
mode 'pull'  (queue→worker): xem §2.9
mode 'replicate': xem §2.8
```

### 2.6 LB, DNS và hot shard
**Chia tải LB** — trọng số hiệu dụng `w_i` cho từng link đi ra tới đích `i` (đích gồm nhiều node rời nhau, hoặc 1 node `replicas>1`):

| `algorithm` | `w_i` |
|---|---|
| `round-robin` | `1` (đồng đều theo số đích sống; **không** để ý đích chậm) |
| `weighted` | `weight_i` |
| `random` | `1` (kỳ vọng như RR; chênh lệch thật do nhiễu thể hiện qua noise) |
| `least-conn` | mục tiêu `w*_i = μ_i · (1 − min(0.95, rhoPrev_i))`; `lbWeights_i ← lbWeights_i + 0.3·(w*_i − lbWeights_i)` (làm mượt ≈ 3 tick vì kết nối cần thời gian xả) |
| `ip-hash` | `weight_i`, cộng hiệu ứng hot key (dưới) |

**Phát hiện chết (health check):** `lbKnownDown_i = -1` khi đích sống. Khi `up=false` bắt đầu ở tick `k0` ⇒ `lbKnownDown_i = k0`; LB chỉ coi đích đó chết (loại khỏi `Σ w`) khi `k − k0 ≥ healthCheckSec/DT`. Trước đó vẫn gửi `share_i` tới nó ⇒ lỗi `down`. Lỗi trong khoảng phát hiện ≈ `share_i · healthCheckSec` request mỗi giây tải — test §9 (I17). `dns`: giống LB với `healthCheckSec := ttlSec` (client giữ bản ghi cũ trong TTL) ⇒ failover chậm (war-room "DNS TTL chặn failover").

**Node `partitioned` + hot key** (`shards = N`, `hotShare = s`): shard 0 nhận `s + (1−s)/N` tổng tải, mỗi shard còn lại `(1−s)/N`. `ρ_hot = λ·(s+(1−s)/N)/(μ_tot/N)`, `ρ_cold = λ·((1−s)/N)/(μ_tot/N)`. `ρ_node = max(ρ_hot, ρ_cold)` (dùng cho state/loadPct). Độ trễ node = hỗn hợp có trọng số lưu lượng của 2 nhóm (hàm `mixQuantile`, §2.11). Đây là cách "thêm shard không cứu hot key" xuất hiện.

### 2.7 Cache và CDN
Chỉ **đọc** có hit; ghi luôn đi tiếp xuống origin (write-through đơn giản).
```
coverage  = min(1, capacityKeys / workingSetKeys)^0.5
ttlFactor = 1 − exp(−ttlSec / 30)
h_target  = hitRatioMax · coverage · ttlFactor
h         = h_target · cacheWarm                     // hiệu lực
λ_hit  = λr·h    (phục vụ tại cache, kind packet 'cache-hit')
λ_miss = λr·(1−h)
```
- **Warm-up:** `cacheWarm ← cacheWarm + (1 − cacheWarm)·DT/warmupSec` mỗi tick (hằng số thời gian `warmupSec`). `cache-expire-all` và `crash` đặt `cacheWarm=0`.
- **Singleflight (request coalescing):** nếu bật, lượng miss chuyển xuống origin bị chặn bởi số **key khác nhau** đang thiếu: `λ_miss_fwd = min(λ_miss, workingSetKeys·(1−cacheWarm)/warmupSec)`. Phần còn lại chờ chung kết quả, độ trễ nhìn thấy = độ trễ origin, không sinh tải thêm. (Ví dụ `workingSetKeys=20000, warmupSec=30` ⇒ trần 667 rps tại t=0 sau expire-all.)
- **Cohort expiry (TTL đồng loạt):** `cacheCohort ∈ [0,1]` = phần entry cùng hết hạn một thời điểm. Khi cache đạt `cacheWarm ≥ 0.9` lần đầu, ghi `cacheNextExpiryTick = k + ttlSec/DT` và `cacheCohort = max(0, 1 − ttlJitterPct/0.2)`. Khi `k` chạm `cacheNextExpiryTick`: `cacheWarm ← cacheWarm·(1 − 0.9·cacheCohort)` rồi lập lịch chu kỳ kế tiếp. `ttlJitterPct ≥ 0.2` ⇒ cohort=0 ⇒ không có dip. (Nút giải thích: "TTL giống hệt nhau ⇒ hết hạn cùng giây ⇒ origin nhận cả thác miss".)
- Kết quả cache gửi xuống origin: `out_r = λ_miss_fwd`, `out_w = λw`.
- `cdn` dùng cùng công thức, `hitRatioMax` thường 0,95; `baseMs` nhỏ; `costPerMillionReq`.

### 2.8 DB, replica và replication lag
Primary và replica là **node riêng** nối bằng link `mode:'replicate'` (carries 'w'). Người gọi chia đọc cho các node DB bằng link `carries:'r'` + `weight`, ghi vào primary bằng link `carries:'w'`.

Với replica `R` nhận log từ primary `P` (tốc độ ghi hiệu dụng `w_P = served_w(P)`):
```
applyCap  = applyRps · (1 − 0.5·min(1, ρ_R))       // đọc nặng làm replica áp dụng chậm
applied   = min(lagBacklogWrites/DT + w_P, applyCap)   // 0 nếu link replicate bị partition
lagBacklogWrites' = max(0, lagBacklogWrites + (w_P − applied)·DT)
lagMs     = 1000 · lagBacklogWrites / max(applyCap, 1) + netMs
staleReadPct = min(1, (lagMs/1000) · rewriteHotness) · share_đọc_đi_replica
```
`rewriteHotness` (mặc định 0,02/s) = tỉ lệ đọc nhắm vào key vừa ghi trong 1 s. Biểu thị "read-your-writes" bị vi phạm (BRIEF §2.11 bước 7: kịch bản "replica lag 800 ms"); núm "sticky read-after-write" = chuyển các đọc sau ghi về primary: giảm `share_đọc_đi_replica` đúng phần `rewriteHotness·lag` (Chưa quyết: mô hình hoá như knob hay như tuỳ chọn routing trong scene — chốt ở T6.5, §11 mục 4).

### 2.9 Queue, worker, async
`queue` node: producer gọi qua link `mode:'async'`.
```
enqueue = min(A, maxDepth − backlog)/DT-style;   phần tràn → 'dropped' cho producer (lỗi 'queue-full')
drain   = Σ_{consumer c} min(μ_tot_c·share_c, available)    // link 'pull' tới worker
backlog' = backlog + (enqueue − drain)·DT
backlogAgeSec = backlog / max(drain, ε)
```
- Producer thấy **thành công ngay khi enqueue** (độ trễ `baseMs` của queue), không phụ thuộc consumer: đây là bất biến "decoupling" (§9 I10).
- Worker xử lý `drain` như `served` của service; từ đó lan xuống DB bằng link sync như thường.
- `dlq=true`: message lỗi (tỉ lệ `faultErrorRate` của worker) đi DLQ thay vì retry vô hạn; `dlq=false` và worker lỗi ⇒ backlog không giảm tương ứng (poison message) — analyze cảnh báo `QUEUE_NO_DLQ`.

### 2.10 Rate limiter (token bucket)
```
tokens ← min(burst, tokens + ratePerSec·DT)
admit  = min(λ_in, tokens/DT)                  // rps
tokens ← tokens − admit·DT
limited = λ_in − admit                         // trả 429, độ trễ ≈ 0,2 ms, không retry trừ khi retryOnLimited
```
Bất biến: Σ admitted trong cửa sổ `T` ≤ `ratePerSec·T + burst`.

### 2.11 Bước 4 — BACKWARD: độ trễ và thành công

#### a. Mô hình độ trễ tại 1 node
```
ρ_eff = min(ρ, 0.97)
Wq    = S · ρ_eff^(√(2(c+1)) − 1) / (c·(1 − ρ_eff))        // Sakasegawa M/M/c; c=1 ⇒ Wq = S·ρ/(1−ρ), W = S/(1−ρ)
qWait = Q / μ_tot                                           // thời gian chờ do backlog thật
W_rest = S + Wq                                             // phần "đàn hồi"
θ     = clamp(max(cv, ρ_eff), 0, 1)
shift = qWait + W_rest·(1 − θ)
scale = W_rest·θ
Latency ~ shift + Exp(scale)        // mean = qWait + W_rest
```
- Phân vị: `p(q) = shift + scale·(−ln(1 − q))`. Ví dụ `p99 = shift + 4,605·scale`, `p95 = shift + 2,996·scale`, `p50 = shift + 0,693·scale`.
  Khi `θ=1` (đầy tải, không cv) đây là xấp xỉ mũ `p99 ≈ W·ln(100) = 4,6·W`. Khi nhàn rỗi `θ=cv=0,3` đuôi mỏng (`p99 ≈ 2,1·W`).
- Xác suất vượt timeout `τ` (ms): `p_to(τ) = (τ ≤ shift) ? 1 : (scale ≤ 1e-6 ? 0 : exp(−(τ − shift)/scale))`.
- Có slowdown: `S` đã gồm `slowAddMs`; có `faultErrorRate` ⇒ thêm lỗi cục bộ `fault`.
- `inflight = served · (qWait + W_rest)/1000` (Little).
- Node `down`: không có phân phối; lỗi fail-fast.

Số tham chiếu (`μ=1000 rps, S=10 ms ⇒ c=10, cv=0,3`, tính tay):

| ρ | W (ms) | p50 | p95 | p99 |
|---|---|---|---|---|
| 0,1 | 10,0 | 9,1 | 16,0 | 20,8 |
| 0,5 | 10,2 | 8,6 | 20,3 | 28,5 |
| 0,7 | 10,9 | 8,6 | 26,1 | 38,4 |
| 0,9 | 16,8 | 12,1 | 46,9 | 71,2 |
| 0,95 | 26,6 | 18,8 | 76,9 | 117,5 |
| 0,97 | 39,8 | 27,9 | 116,8 | 178,9 |

(p99 tăng ×6,3 từ ρ=0,5 tới 0,97 dù `c=10` làm đường cong êm hơn M/M/1; với `c=1` còn dốc hơn.) Khi `ρ ≥ 0,97` độ trễ tiếp tục tăng qua `qWait` (backlog), không qua công thức nữa — tránh nổ số và đúng thực tế: quá tải thì độ trễ do hàng đợi tích luỹ.

#### b. Tóm tắt độ trễ và phép ghép (`latency.ts`)
`LatencySummary {mean,p50,p95,p99}`. Hàm hỗ trợ (đều thuần, không cấp phát trong vòng nóng):

- `fitShiftExp(s)`: `scale = (s.p99 − s.p50)/(ln100 − ln2) = (s.p99 − s.p50)/3,912`; `shift = s.p50 − scale·ln2`. (khôi phục phân phối từ tóm tắt để tính timeout/hỗn hợp/max.)
- `addSerial(a, b)`: `mean = a.mean + b.mean`, `p50 = a.p50 + b.p50`, `p95 = mean + √((a.p95−a.mean)² + (b.p95−b.mean)²)`, tương tự `p99` (cộng bình phương phần đuôi, độc lập).
- `mixQuantile(components[{weight, summary}], q)`: giải `Σ w_i·F_i(x) = q` bằng bisection 24 bước trên `[0, xmax]`, `F_i` là CDF shift-exp đã fit. Dùng cho LB split, cache hit/miss, hot shard.
- `maxQuantile(components, q)` (fan-out song song, phải đợi tất cả): giải `Π F_i(x) = q` bằng bisection; N đồng nhất rút gọn `p(q^{1/N})`.
- `addNet(s, ms)`: cộng `ms` vào mọi trường.

#### c. Độ trễ và thành công **subtree** (xử lý theo `rev`)
Cho node `n`, có `own` (LatencySummary tại node), các link đi ra `e` tới `m` với `sub_m`, `succ_m`:
1. **Kết quả 1 attempt trên link `e`** (người gọi → callee):
   ```
   net      = netMs của link
   Lm       = addNet(sub_m, net)                       // độ trễ nhìn từ người gọi
   p_to     = partitioned ? 1 : (timeoutMs ? P(Lm > timeoutMs) : 0)    // dùng fitShiftExp(Lm)
   p_fail_c = 1 − succ_m                               // lỗi cục bộ/downstream (không phải timeout)
   p_succ   = (1 − p_fail_c) · (1 − p_to)
   breaker open: p_succ = 0, độ trễ thất bại ≈ net (fail-fast), p_to = 0, kind 'breaker'
   ```
2. **Retry (xác suất thành công của yêu cầu gốc):** với `max = retry.max`, `r = 1 − p_succ` (xác suất 1 attempt hỏng):
   ```
   succ_link = 1 − r^(max+1)          (nếu budget cản: giảm số attempt hiệu dụng theo β∈[0,1], max_eff = max·β)
   expectedAttempts = Σ_{j=0}^{max_eff} r^j   (1 + r + r² + …)
   ```
   Độ trễ thành công của link: attempt đầu thành công dùng `Lm`; nếu `r > 0,01` thì `p99_link ≥ timeoutDetect + backoff_1 + Lm.p50` với `timeoutDetect = timeoutMs` (hoặc `Lm.p99` nếu không timeout). Cụ thể: `p99_link = max(Lm.p99, retryTail)`, `retryTail = timeoutDetect + d_1 + Lm.p50`, chỉ khi `r^1 > 0,01`; `p95_link` tương tự với ngưỡng `r > 0,05`.
3. **Kết hợp các link theo `route`:**
   - `split`: hỗn hợp có trọng số `share_e` ⇒ `mixQuantile`; `succ = Σ share_e·succ_link_e`.
   - `all-sequential`: `addSerial` các link (mỗi link nhân `calls·fraction` kỳ vọng, nếu `fraction<1` thì là hỗn hợp {0 với xác suất 1−fraction}); `succ = Π succ_link_e^(fraction)` (link `fallback: 'bypass'|'degrade'` coi `succ=1`, ghi `degraded`).
   - `all-parallel`: `maxQuantile` (độ trễ = chậm nhất), `succ = Π succ_link_e`.
   - `onMissOf`: link chỉ nhận phần miss: hỗn hợp {không có link, trọng số `h`} và {có link, trọng số `1−h`} cộng nối tiếp sau độ trễ cache.
4. **Cache read-through:** `subtree = mix(h: own_cache, 1−h: addSerial(own_cache, origin_link))` — `p99` lấy đuôi origin khi `1−h ≥ 1%`.
5. `subtree = addSerial(own, downstream)`; `succ_n = (1 − q_local) · succ_downstream`, `q_local = (dropped + limited + down)/λ_in + faultErrorRate`.
6. **Tail fan-out** (đã nằm ở `maxQuantile`): N=100 callee đồng nhất, mỗi callee `p50=30, p99=100 ms` ⇒ `p50_fanout ≈ 107 ms > p99_đơn = 100 ms`, `p99_fanout ≈ 182 ms` (tính tay; tương ứng `1 − 0,99^100 = 63%` request có ít nhất 1 callee chậm).
7. **Client:** `observed = min(T, clientTimeoutMs)`; `errorRate_e2e = 1 − succ_root·(1 − p_to_client)`; `goodput = λ0·(1 − errorRate_e2e)`.

Đơn vị đo "lỗi" phân loại: `ErrorBreakdown` được lan lên cùng `succ` (6 số, cộng tuyến tính có trọng số như `succ`).

### 2.12 Bước 5 — retry, breaker (cập nhật cuối tick)
Cho link `e` có `retry` (ngược lại bỏ qua), tại tick `k`:
```
A_j           = số attempt thứ j tại tick k (A_0 = a0_e; A_j = ring_e[k%len][j-1], j≥1)
fail_j        = A_j · r_e                           // r_e = 1 − p_succ (§2.11c)
canRetry_j    = (j < max) ∧ (kind lỗi ∈ retryable)  // 'limited' chỉ retry nếu retryOnLimited
sched_j+1     = fail_j · canRetry_j
budget:       tokens += budgetRatio·A_0·DT (trần 10 s·budgetRatio·A_0); sched ← min(sched, tokens/DT); tokens -= sched·DT
delay (ms)    = detect + backoff(j+1)
   detect  = timeoutMs (nếu lỗi do timeout) | net + 0 (lỗi nhanh)
   backoff = none: 0 | fixed: baseMs | exponential: min(capMs, baseMs·factor^j)
   jitter  : none: điểm đơn | full: đều trên [detect, detect + backoff] | equal: đều trên [detect + backoff/2, detect + backoff]
ring_e[(k + ceil(delay/DT)) % len][j] += sched   (trải đều trên các bucket nếu có jitter)
```
**Hệ quả có chủ ý:**
- `backoff:'none'` + `jitter:'none'` ⇒ toàn bộ retry rơi vào 1 bucket ⇒ xung đồng bộ (retry storm cổ điển).
- Cân bằng ổn định: `λ_link/a0 = Σ r^j` (1 + r + r² + …). Với `r=0,7, max=3` ⇒ ×2,53.
- Lỗi được tính tại thời điểm gửi (xấp xỉ: lỗi hiển thị sớm hơn thực tế tối đa `timeoutMs`). Ghi rõ ở UI: "độ trễ phát hiện lỗi = timeout".

**Circuit breaker** (link có `breaker`):
```
closed:    errEwma ← errEwma + (r_e − errEwma)·DT/windowSec   (chỉ khi A_e ≥ minRps)
           nếu errEwma ≥ errorThreshold → open, openUntil = k + openSec/DT
open:      fail-fast; hết openSec → half-open, probeN = probeOk = 0
half-open: chỉ forward min(A_e, probeRps); ước lượng succ_probe = EWMA p_succ (≥ 2 s)
           succ_probe ≥ closeAfterOk → closed (errEwma=0);  ngược lại → open lại
```
Khi open: người gọi không tạo retry xuống callee (`sched=0` để tránh vòng lặp vô ích), và nếu `fallback:'degrade'` thì request vẫn thành công (ghi `degraded`). Điều này cắt vòng phản hồi dương.

### 2.13 Bước 6 — trạng thái node & hysteresis
Ngưỡng (BRIEF §2.5), tính từ `ρ`, queue, lỗi cục bộ:

| State | Điều kiện "vào" (mức thô) | Hình ảnh |
|---|---|---|
| `down` | `up=false` | xám đá, X đỏ, tag DOWN |
| `recovering` | `k < recoveringUntilTick` hoặc `warmProgress < 1` sau restart/deploy | vòng warming (`warm`) |
| `overloaded` | `ρ ≥ 1` **và** (`Q/Qcap ≥ 0,5` hoặc `errorRate ≥ 1%` hoặc `p_to(τ_vào) ≥ 1%`) | đỏ, packet đỏ rơi khỏi đường |
| `saturated` | `ρ ≥ 0,9` hoặc (`ρ ≥ 0,8` và `Q` đang tăng) | cam, queue pile, rung nhẹ |
| `busy` | `0,7 ≤ ρ < 0,9` | ngả vàng |
| `healthy` | `0,1 ≤ ρ < 0,7` | màu gốc |
| `idle` | `ρ < 0,1` | xám nhạt |

**Hysteresis (chống nhấp nháy):** gọi `raw` là mức thô; `shown` là mức đang hiển thị (`stateShown`).
- `down` và `recovering` đổi **ngay** (do sự kiện).
- Mức *tăng nặng* (idle→…→overloaded): đổi ngay.
- Mức *giảm nhẹ*: chỉ đổi khi `raw` thấp hơn `shown` liên tục `HOLD = 10` tick (1 s) **và** `ρ < ngưỡng_vào_của_shown − 0,03` (khoảng đệm). Mỗi lần `raw ≥ shown` đặt lại `stateHoldTicks=0`.
- Thang bậc: `idle < healthy < busy < saturated < overloaded`. Giảm tối đa **1 bậc mỗi lần** sau mỗi đợt HOLD.

`loadPct = round(min(1, ρ)·100)`. `badge` ưu tiên: `DOWN` > `BAD_DEPLOY` > `DEPLOY` > `WARMING`/`COLD` (cache `warm<0.5`) > `QUEUE` (queue/Qcap ≥ 0,25) > `LAG` (lagMs ≥ 200) > `LIMIT` (limited>0) > `HOT` (hotShare>0) > `SLOW` (slowAddMs>0).

### 2.14 Bước 7 — metrics toàn cục, cost
```
costPerHour = Σ_n [enabled_n] · replicas_n · sizeFactor_n^1.2 · costPerHour_n  +  Σ_n costPerMillionReq_n · served_n·3600/1e6
costCumUsd  += costPerHour·DT/3600
amplification = (Σ_e A_e) / offeredRps        // thể hiện "khuếch đại" gọi nội bộ + retry
```
Nếu node `down`, vẫn tính tiền (instance còn bật). `replicas` là số instance được thanh toán.

---

## 3. Bảng hành vi theo primitive (tóm tắt)

| kind | Hàng đợi/μ | Chia lưu lượng | Trạng thái riêng | Lỗi đặc trưng |
|---|---|---|---|---|
| `client` | nguồn, không μ | theo `routes` | — | timeout phía người dùng |
| `dns` | μ rất lớn | LB-lite, độ trễ phát hiện = `ttlSec` | — | failover chậm |
| `cdn` | μ lớn, S nhỏ | miss → origin | cache warm/cohort | stampede về origin |
| `lb` | μ lớn | `algorithm` (§2.6) | `lbWeights`, health | chia lệch với RR khi node chậm |
| `gateway`/`service` | M/M/c | `all-*` hoặc `split` | — | queue đầy, timeout |
| `cache` | μ lớn | read-through miss | warm, cohort | stampede, evict |
| `sql`/`nosql` | M/M/c, μ nhỏ | — | lag (replica), hot shard | nghẽn đầu tiên trong đa số bài |
| `queue` | backlog | pull → worker | backlog, age | đầy → drop, poison |
| `worker` | M/M/c | xuống DB | — | consumer chậm → backlog |
| `rate-limiter` | không queue | admit/limit | tokens | 429 |
| `blob`/`search`/`log` | M/M/c generic | — | — | — |
| `coordinator` | M/M/c generic (v1) | — | — | Chưa quyết: quorum/Raft ở M8 |

---

## 4. Lấy mẫu chấm (packet) cho stage

Mục tiêu: stage vẽ ≤ 200 chấm, mỗi chấm đại diện N req/s, phản ánh **đúng tỉ lệ** loại lưu lượng, và **không làm thay đổi kết quả mô phỏng** (dùng luồng RNG riêng).

1. **Hệ số co giãn.** Tổng lưu lượng quan sát `Σ_e A_e` (mọi link, cả hướng response nếu bật). Số chấm đồng thời mong muốn ≈ `Σ_e A_e·travelSec/N`. Chọn `N` nhỏ nhất trong dãy `{1,2,5,10,20,50,100,200,500,1000,…}` sao cho số chấm ước lượng ≤ `maxPackets·0,8`. **Hysteresis:** chỉ đổi `N` khi ước lượng lệch > ×1,4 so với `packetScale` hiện tại (tránh nhãn "1 chấm = N req/s" nhảy).
2. **Sinh chấm trên từng link.** `acc_e ← acc_e + A_e·DT/N`; sinh `floor(acc_e)` chấm, `acc_e −= floor`. Không dùng RNG cho số lượng ⇒ ổn định.
3. **Phân loại** (dùng `tickRng(seed, k, ch=2)`, deterministic): với mỗi chấm mới trên link `e`, lấy tỉ lệ thật tại tick:
   - `retry` với xác suất `rr_e/A_e`;
   - phần còn lại chia theo kết cục 1 attempt: `request` (thành công) `p_succ`; `timeout` `(1−p_succ)·share_to`; `dropped` (drop/limited) …; `error` (5xx, breaker).
   - `cache-hit`: chấm trên link vào cache với xác suất `h` quay đầu sớm: kind `cache-hit`, `reverse=true` sinh ngay tại link `app→cache` với `fate` cho biết điểm quay đầu (progress 0,5 thay vì tới đích).
   - `response`: với mỗi chấm `request` thành công, sinh 1 chấm `response` ngược chiều trên cùng link sau `travelSec` (tiêu thụ cùng ngân sách).
4. **`fate`:** `timeout` ⇒ `fate = 0,6` (mờ dần giữa đường); `dropped` ⇒ `fate = 0,9` (rơi tại đích); `error` ⇒ tới đích rồi đổi sang đỏ.
5. **Tiến độ:** `progress = (k − spawnTick)·DT / packetTravelSec`; hết `≥1` hoặc vượt `fate` ⇒ bỏ khỏi `inflightPackets`. `SimFrame.packets = inflightPackets` (≤ `maxPackets`; nếu vượt: bỏ chấm `request`/`response` cũ nhất trước, giữ chấm lỗi — lỗi quan trọng hơn khi hiển thị).
6. **Tốc độ `N` hiển thị** qua `SimFrame.packetScale`; legend ghi "1 chấm = N req/s" (05-live-stage §5.8).

---

## 5. RNG, recorder, tua (scrub)

### 5.1 RNG có seed (`rng.ts`)
**Không có RNG trạng thái chạy dọc.** RNG của tick `k` suy từ `(seed, k, channel)` ⇒ mọi tick tái tạo độc lập, checkpoint không cần lưu RNG.
```ts
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** channel: 1 = tải/noise, 2 = phân loại chấm, 3 = jitter retry (nếu cần), 4 = dự phòng */
export function tickRng(seed: number, tick: number, channel: number): () => number {
  let h = (seed ^ Math.imul(tick + 1, 0x9E3779B1) ^ Math.imul(channel + 1, 0x85EBCA6B)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0;
  return mulberry32(h ^ (h >>> 16));
}
export function gauss(rand: () => number): number {   // luôn tiêu thụ đúng 2 giá trị
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
```
Hash khoá cho consistent hashing/mod-N dùng `fnv1a32` + avalanche (xem `hashing.ts` §9).

### 5.2 Recorder (`recorder.ts`)
- **Bản ghi nhẹ cho đồ thị:** ring buffer cột `Float32Array` dung lượng `ringCapacityTicks` (mặc định 6000 = 10 phút): `t`, các metric toàn cục (`offered, goodput, errorRate, p50, p95, p99, cost, retryRps`), mỗi node `rho, queue, state(enum 0..6), lambda`, mỗi link `rps, errorRate`. Truy vấn `series(key)` trả `Float32Array` view để vẽ sparkline. **Không** lưu `packets` và `firedEvents` chi tiết trong ring (tiết kiệm bộ nhớ); danh sách mốc sự kiện lưu riêng `markers[]`.
- **Checkpoint:** cứ `checkpointEverySec` (K=5 s ⇒ 50 tick) lưu `structuredClone(SimState)` + `tick`. Giữ tối đa `ringCapacityTicks/50 + 1` checkpoint (ring).
- **inputLog:** `InputRecord[]` sắp xếp theo tick. Ghi mọi `setInput`.
- **`frameAt(t)` / `scrub(t)`:** `k = round(t/DT)`; tìm checkpoint `c ≤ k` gần nhất; `state = clone(c.state)`; chạy `stepState` từ `c.tick` tới `k`, áp `inputLog` đúng tick; trả `SimFrame` đầy đủ (kể cả packets). Chi phí tối đa 49 tick ≈ vài chục ms; `scrub` kéo liên tục được vì UI chỉ yêu cầu frame mỗi `requestAnimationFrame` (gộp).
- **Đổi núm khi đang ở quá khứ (ghi đè tương lai):** nếu `setInput` gọi tại `k < tickHead`: (1) cắt `inputLog` các bản ghi `tick > k`; (2) bỏ checkpoint có `tick > k`; (3) đặt `tickHead = k`, `ringLength = k`; (4) thêm bản ghi mới; (5) mô phỏng tiếp từ `k` với đầu vào mới. Mốc sự kiện learner sau `k` cũng bị xoá (nhánh mới). UI phải cảnh báo "Thay đổi sẽ ghi đè phần timeline sau thời điểm này" (05-live-stage). *Chưa quyết:* giữ "ghost" của nhánh cũ để A/B compare (M8); v1 bỏ.
- **Quy tắc tương đương:** `scrub(t)` phải bằng frame của lần chạy thẳng tới `t` với cùng `inputLog` (test I8).

---

## 6. `analyze.ts`

```ts
export interface BottleneckReport {
  nodeId: NodeId;
  rho: number;
  headroom: number;           // μ_tot/λ: nhân với tải hiện tại thì tới ρ=1
  latencyShare: number;       // phần thời gian chờ trong tổng độ trễ đầu-cuối (0..1)
  reason: 'saturated' | 'queueing' | 'slow-dependency' | 'pool-limited' | 'hot-shard' | 'none';
  hotPath: NodeId[];          // các node trên đường nóng
}
export function findBottleneck(model: SystemModel, frames: SimFrame[] | SimFrame): BottleneckReport;
export function maxSustainableRps(model: SystemModel, frame: SimFrame): { rps: number; limitedBy: NodeId };
export function findSpofs(model: SystemModel): SpofReport[];
export function structuralWarnings(model: SystemModel): StructuralWarning[];
```

**Bottleneck.** Đường nóng = node có `λ ≥ 5%·offeredRps`. Với 1 `SimFrame` (hoặc trung bình cửa sổ):
1. Ứng viên = node trên đường nóng có `state ∈ {saturated, overloaded}` hoặc `ρ ≥ 0,8`. Chọn `ρ` lớn nhất; hoà (±0,02) thì chọn node có **đóng góp độ trễ chờ** lớn nhất `latencyShare = (queueWaitMs + Wq)/subtreeLatency.mean`.
2. `reason`: `ρ≥1` ⇒ `saturated`; `ρ<1` nhưng `Wq` chiếm >40% ⇒ `queueing`; node `service` có `poolSize/S < opsPerSec` ⇒ `pool-limited`; `hotShare>0` ⇒ `hot-shard`; node ρ thấp nhưng `subtreeLatency` lớn do callee ⇒ `slow-dependency` (trỏ về callee).
3. **Bottleneck kế tiếp (dự đoán):** `headroom_n = μ_tot_n / λ_n` (giả định tỉ lệ định tuyến cố định, bỏ qua retry); `maxSustainableRps = λ0·min_n headroom_n`, `limitedBy` = argmin. Đây là nền cho bài "ước lượng" và "tune-to-limit".

**SPOF bằng articulation point.**
1. Dựng đồ thị vô hướng `G` gồm node và các link "cứng" (loại link `fallback:'bypass'|'degrade'` và link `mode:'async'` — không nằm trên đường đồng bộ bắt buộc; giữ link `replicate`? **không**, vì không phục vụ request).
2. Gộp mọi `client` vào 1 đỉnh `ENTRY`. DFS Tarjan (lowlink) từ `ENTRY`: `v ≠ root` là articulation point nếu tồn tại con `u` với `low[u] ≥ disc[v]`; root là articulation point nếu có ≥ 2 con.
3. Chỉ báo cáo `v` nếu nhánh bị cắt chứa node **quan trọng** (kind ∈ `sql, nosql, queue, blob, search, coordinator` hoặc node có `stateful`).
4. Phân mức: `replicas ≥ 2` (stateless) hoặc stateful có replica (có node `replicate` tới nó) ⇒ `severity:'info'` (cấu trúc là điểm hẹp nhưng nhân bản); ngược lại `'error'`. Kết quả: `SpofReport {nodeId, severity, cuts: NodeId[] }`.
Ví dụ: `client → lb → [app1,app2,app3] → cache → db`: `lb`, `cache`, `db` là articulation point; cả ba có `replicas=1`, không replica ⇒ `error`; app1..3 không phải articulation point. Nếu đổi sang cache-aside với link `app→cache` có `fallback:'bypass'`, link đó bị loại khỏi G và `cache` không còn là SPOF.

**Cảnh báo cấu trúc** (`StructuralWarning {code, severity, nodeId?, linkId?, params?}`; `severity ∈ info|warn|error`):

| code | Điều kiện |
|---|---|
| `SPOF` | mục SPOF ở trên |
| `STATEFUL_NO_REPLICA` | `stateful` và không có replica/`replicas<2` (`sql,nosql,queue,blob,…`) |
| `CACHE_NO_TTL` | cache `ttlSec` không đặt hoặc ≥ 86400 và không có chiến lược invalidation |
| `CACHE_SYNC_TTL` | `ttlJitterPct < 0.1` và (`hitRatioMax ≥ 0,8`) — nguy cơ stampede |
| `SYNC_CROSS_REGION_HOT_PATH` | link `sync` có `netClass:'cross-region'` trên đường nóng |
| `QUEUE_NO_DLQ` | queue `dlq=false` |
| `UNBOUNDED_QUEUE` | `maxDepth` rất lớn (> 1e7) hoặc không đặt |
| `NO_TIMEOUT` | link `sync` không có `timeoutMs` |
| `RETRY_NO_BACKOFF` | `retry.max>0` và `backoff==='none'` |
| `RETRY_NO_JITTER` | `retry.max>0`, backoff ≠ none, `jitter==='none'` |
| `RETRY_AMPLIFICATION` | tích `(1+max)` dọc 1 đường ≥ 9 (ví dụ 3 tầng retry 2 lần ⇒ 27×) |
| `NO_BREAKER_ON_DEP` | link tới DB/dịch vụ ngoài có retry nhưng không có `breaker` |
| `NO_RATE_LIMIT_AT_EDGE` | không có `rate-limiter`/`gateway` giới hạn ở lối vào |
| `LB_NO_HEALTHCHECK` | `healthCheckSec` ≥ 30 hoặc không đặt |
| `SINGLE_AZ` | mọi node có cùng `zone` |
| `DB_FANIN_EXCEEDS_CONNS` | Σ(replicas·poolSize) các node gọi DB > `maxConnections` |

Mỗi warning có `messageKey` để UI/Inspector giải thích; chỉ là gợi ý — **không** làm hỏng bài tập trừ khi Constraint cấu trúc yêu cầu (§7).

---

## 7. `grade.ts` — ràng buộc và cách chấm

```ts
export interface TimeWindow { fromSec: number; toSec: number }   // trong thời gian mô phỏng

export type Constraint =
  | { id: string; kind: 'slo-latency'; metric: 'p50' | 'p95' | 'p99'; maxMs: number;
      window: TimeWindow; allowViolationPct?: number }          // mặc định 2 (% tick được phép vi phạm)
  | { id: string; kind: 'slo-error'; maxRate: number; window: TimeWindow }
  | { id: string; kind: 'throughput'; minGoodputRps: number; window: TimeWindow }
  | { id: string; kind: 'cost'; maxPerHour: number; at?: 'end' | 'max' }       // mặc định 'end'
  | { id: string; kind: 'node-state'; node: NodeId; notIn: NodeState[]; window: TimeWindow; allowViolationPct?: number }
  | { id: string; kind: 'structural'; rule: StructuralRule; node?: NodeId; link?: LinkId };

export type StructuralRule =
  | 'no-spof' | 'stateful-has-replica' | 'has-timeout' | 'has-retry-backoff'
  | 'has-breaker' | 'has-dlq' | 'cache-has-jitter' | 'no-sync-cross-region-hot-path' | 'has-rate-limit';

export interface ConstraintResult {
  id: string; pass: boolean;
  actual: number | string | null;    // số đo hoặc mã
  target: number | string;
  worstAtSec?: number;               // thời điểm tệ nhất (nút "xem trên mô phỏng")
  messageKey: string;
}

export function evaluate(
  constraints: Constraint[],
  run: RunSeries,                    // ring/series đã chạy xong
  model: SystemModel,                // model ĐÃ áp thay đổi của người học
): ConstraintResult[];
```
**Cách đánh giá (thuần hàm, không phụ thuộc UI):**
- `slo-latency`: lấy chuỗi `p_metric(tick)` trong `window`; `violating = #tick có giá trị > maxMs`; `pass ⇔ violating/total ≤ allowViolationPct/100`. `actual` = `percentile95` của chuỗi (để thông báo), `worstAtSec` = tick lớn nhất. (Không trung bình phân vị; trung bình phân vị sai về thống kê.)
- `slo-error`: **trọng số theo lưu lượng**: `Σ errorRate·offered / Σ offered` trong cửa sổ.
- `throughput`: trung bình `goodput` trong cửa sổ.
- `cost`: `metrics.costPerHour` tại cuối (hoặc max) so với `maxPerHour`.
- `node-state`: tỉ lệ tick node nằm trong `notIn` ≤ ngưỡng.
- `structural`: gọi `analyze` (SPOF, warnings) trên `model`; `pass ⇔` không có warning mức `≥ warn` cho rule đó (hoặc node/link chỉ định).
Cửa sổ nằm ngoài thời gian đã chạy ⇒ `pass=false`, `messageKey:'window-not-run'`.

**Chạy headless** (cho fix-challenge, doctor): `simulate(scenario, changes: InputRecord[]): RunSeries` chạy `durationSec/DT` tick không sinh packet (`options.maxPackets=0`), tốc độ ≈ 1 ms/tick.

---

## 8. Hashing và phân phối khoá (`hashing.ts`)
Phục vụ bài Partitioning/Consistent Hashing và hot key; **thuần, deterministic**.
```ts
export function fnv1a32(s: string): number;                         // + avalanche cuối
export function modNAssign(keys: string[], n: number): number[];    // fnv1a32(k) % n
export function ringAssign(keys: string[], nodes: string[], vnodes = 150): string[]; // sắp xếp điểm, nhị phân
export function movedFraction(a: (string|number)[], b: (string|number)[]): number;
export function zipfKeys(count: number, s: number, seed: number): string[];          // hot key heatmap
```
Tham chiếu: 10→11 node, 100 000 khoá: mod-N dời ≈ 90,96% (lý thuyết N/(N+1) = 90,9%); ring (150 vnode) dời ≈ 9,1% (lý thuyết 1/(N+1)).

---

## 9. Cấu trúc file, API public, hiệu năng, test

### 9.1 Cây file
```
src/features/sysdesign-course/sim/
├── index.ts            # re-export API công khai
├── types.ts            # toàn bộ kiểu ở §1 (state/frame/inputs)
├── model.ts            # SystemModel, NodeSpec, LinkSpec, DEFAULT_NET_MS, validate + compile
├── primitives.ts       # makeNode(kind, overrides): knob catalogue, failureModes, inspector gốc
├── rng.ts              # mulberry32, tickRng, gauss
├── profiles.ts         # rpsAt(LoadProfile, t)
├── events.ts           # áp TimedEvent/InputChange vào state
├── latency.ts          # nodeLatency, fitShiftExp, addSerial, mixQuantile, maxQuantile
├── cache.ts            # hit ratio, warm, cohort, singleflight
├── engine.ts           # compile → stepState (bước 0..7), createSim
├── packets.ts          # lấy mẫu chấm (§4)
├── recorder.ts         # ring, checkpoint, inputLog, scrub
├── analyze.ts          # bottleneck, SPOF, warnings
├── grade.ts            # Constraint, evaluate, simulate headless
├── hashing.ts          # modN, ring, zipf
├── trace.ts            # traceRequest: waterfall cho RequestTracer (lấy mẫu có seed)
└── __tests__/sim.test.ts
```
`sim/` không import gì ngoài `sim/` (03 §3); doctor kiểm không có import React/DOM/`@/components`. Adapter `SimFrame` → `LiveSimFrame` của workbench (đổi `BadgeCode` thành `BilingualText`, cài `LiveSimAdapter`/`LiveSimSession` của 05 §2.1) nằm ở lớp feature: `src/features/sysdesign-course/live/liveSimAdapter.ts` (T3.6).

### 9.2 API công khai
```ts
export interface Sim {
  readonly scenario: SimScenario;
  readonly tick: number;                     // đầu timeline hiện tại
  readonly t: number;
  readonly recorder: Recorder;
  step(): SimFrame;                          // +1 tick (100 ms)
  runUntil(tSec: number, onFrame?: (f: SimFrame) => void): SimFrame;
  setInput(change: InputChange): void;       // áp tại tick hiện tại; nếu đang ở quá khứ → ghi đè tương lai (§5.2)
  scrub(tSec: number): SimFrame;             // đặt con trỏ tại t, trả frame (có packets)
  frame(): SimFrame;                         // frame hiện tại
  reset(seed?: number): void;                // về t=0, xoá inputLog/checkpoint
  dispose(): void;
}
export function createSim(scenario: SimScenario): Sim;                         // validate + compile + t=0
export function simulate(scenario: SimScenario, changes?: InputRecord[]): RunSeries; // headless
/** Waterfall một request đại diện tại frame hiện tại (05 §5.7). Lấy mẫu độ trễ từng chặng từ
 *  LatencySummary của node/link, RNG tickRng(seed, tick, ch=4) trộn packetId ⇒ deterministic.
 *  kind 'retry' ⇒ có chặng timeout + chờ backoff; 'timeout' ⇒ cắt ở timeoutMs. */
export function traceRequest(c: CompiledModel, frame: SimFrame,
  hint: { packetId?: number; linkId?: LinkId; kind?: SimPacketKind }): RequestTrace | null;
export { findBottleneck, maxSustainableRps, findSpofs, structuralWarnings } from './analyze';
export { evaluate } from './grade';
export { compile, SimModelError } from './model';
```
`step` ở trạng thái "đang xem quá khứ" (sau `scrub`): tiến tiếp từ điểm đó theo `inputLog` hiện hành (đã bị cắt nếu có thay đổi).

### 9.3 Hiệu năng
- Mục tiêu: **≤ 1 ms/tick** (trung vị) với 30 node, 40 link, bật packets, trên máy dev thông thường. Bản bench trong test in thời gian trung vị; test `assert` ≤ **5 ms** (dự phòng CI) và in cảnh báo nếu > 1 ms.
- Quy tắc: không cấp phát trong vòng nóng ngoài frame đầu ra; scratch `Float64Array` theo chỉ số node/link; bisection 24 bước chỉ gọi cho LB split / cache / hot shard / fan-out; tránh `Object.keys` trong tick (dùng mảng đã compile).
- Chạy mô phỏng trên main thread. *Chưa quyết:* chuyển sang Web Worker nếu bench thực tế > 1 ms (đánh giá ở T3.7 với ≥ 20 node).

### 9.4 Cách viết test (`__tests__/sim.test.ts`)
Theo đúng style `src/features/devops-course/engine/__tests__/engine.test.ts`: `node:assert/strict`, hàm `test(name, fn)` tự viết, đếm `passed`, in `✔`/`✘`, ném lỗi khi fail, dòng tổng kết cuối. Runner `scripts/run-sysdesign-tests.mjs` sao chép `scripts/run-engine-tests.mjs`, đổi entry thành `src/features/sysdesign-course/sim/__tests__/sim.test.ts`, tmp `node_modules/.cache/sd-sim-test.mjs`; npm script `sd:test`. (Sau này có thể thêm entry `activities.test.ts` cho 06.)

Khung:
```ts
import assert from 'node:assert/strict';
import { createSim, simulate, evaluate, findBottleneck, findSpofs } from '../index';
import { fnv1a32, modNAssign, ringAssign, movedFraction } from '../hashing';
import { s103 } from './fixtures';        // scenario S1-03 + vài scenario nhỏ

let passed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✔ ${name}`); }
  catch (err) { console.error(`  ✘ ${name}`); throw err; }
}
const NOISELESS = { noise: false, maxPackets: 0 };   // bất biến dùng nhiễu tắt, không sinh chấm
console.log('=== Chạy bộ test Sim Engine (System Design) ===');
// … test() …
console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST SIM ĐỀU XANH!`);
```
Fixtures nhỏ (`fixtures.ts`): `singleNode(μ,S)`, `chain3`, `lbApps(n)`, `cacheDb(hit)`, `queueWorker`, `retryNode(retryPolicy)`.

### 9.5 Bất biến phải test (có số)
Mỗi test dùng `noise:false` trừ I7. Dung sai ghi sẵn; nếu implementer phải nới dung sai > gấp đôi, cần ghi `DECISIONS.md`.

| # | Bất biến | Cách đo | Ngưỡng |
|---|---|---|---|
| I1 | **Little (hệ thống)**: ở trạng thái dừng, không lỗi/retry, `Σ_n λ_n·W_n + Σ_e A_e·net_e/1000 = λ0·E[T_e2e]/1000` | steady 1000 rps qua `client→lb→app×3→cache→db`, đo tick 100–200 | sai lệch ≤ 1% |
| I2 | **Bảo toàn dòng**: `enqueue = drain + Δbacklog/dt + dropped`; mọi node: `λ_in = served + Δqueue/dt + dropped + limited` | queue+worker quá tải 30 s | tuyệt đối ≤ 1e-6·λ |
| I3 | **ρ→1 latency vọt** (node `μ=1000, S=10 ms`, `c=10`): `p99(ρ=0,95)/p99(ρ=0,5) ≥ 3`; `p99(ρ=0,97)/p99(ρ=0,5) ≥ 5`; `p99(ρ=0,9)/p99(ρ=0,5) ≥ 2` | steady tại λ=500/900/950/970 | theo bảng §2.11a ±10% |
| I4 | **Thêm server ở tầng không nghẽn không giảm p99**: S1-03 steady 3200 rps (DB `ρ≈1,06`): mỗi `app` replicas 1→2 (tổng 3→6 instance) giảm p99 e2e **< 5%**; nhân đôi DB `opsPerSec` giảm p99 **> 50%** | so p99 trung vị t∈[40,60] | như nêu |
| I5 | **Hit 90% → λ_db ≈ 10%**: client 1000 rps toàn đọc, `hitRatioMax=0,9, coverage=1, ttlFactor→1, cacheWarm=1` ⇒ `λ_db ∈ [98,102]`; trộn `readRatio=0,9` ⇒ `λ_db ∈ [188,192]` | steady 60 s | như nêu |
| I6a | **Retry storm** — node `μ=1000`, tải 600 rps, retry `max=3, backoff:'none'`, timeout 500 ms; `slowdown(+S)` làm `μ→500` tại t=10 | `λ_in(node)` trung bình t∈[25,30] **≥ 1,8×600** (kỳ vọng ≈ 2,3×) | |
| I6b | Cùng kịch bản nhưng `retry{max:3, backoff:'exponential', baseMs:200, jitter:'full', budgetRatio:0.1}` | `λ_in(node)` t∈[25,30] **≤ 1,15×600** | |
| I6c | Không retry (`max=0`) | `λ_in(node) = 600` (±1%) | |
| I7 | Nhiễu `noise:true`: seed khác ⇒ chuỗi `offeredRps` khác (≥ 1 tick lệch > 0,1%), cùng seed ⇒ trùng từng bit | 600 tick | |
| I8 | **Jitter giảm đỉnh**: (a) retry `full` jitter so với `none` (cùng backoff 1000 ms): đỉnh `retryRps` của `none` **≥ 2,5×** của `full`; (b) cache stampede: sau `cache-expire-all`, `max λ_db` với `ttlJitterPct=0` so với `0.2`+`singleflight`: giảm **≥ 30%** | | |
| I9 | **Consistent hashing**: 100 000 khoá, 10→11 node: `modN` dời ∈ [88%, 94%]; `ring(150 vnode)` dời ∈ [7%, 12%] | | |
| I10 | **Decoupling**: `app→queue→worker→db`, worker bị `slowdown`: `p99` của `app` (producer) tăng **< 5%**, còn `backlog` tăng đơn điệu | 60 s | |
| I11 | **Determinism**: cùng scenario + seed + inputLog ⇒ `JSON.stringify(frames)` bằng nhau cho 600 tick | | |
| I12 | **scrub(t) == chạy thẳng tới t**: với `t ∈ {0, 4.9, 5.0, 12.3, 59.9}`, có `setInput` tại t=20: `deepEqual(sim.scrub(t), straight.frameAt(t))`, gồm `packets` | | |
| I13 | **Ghi đè tương lai**: sau `scrub(30)` + `setInput(knob)`: `recorder.length == 301`, `inputLog` không còn bản ghi `tick>300`; frame ở t≤30 không đổi | | |
| I14 | **Fan-out tail**: 100 callee đồng nhất (`p50=30,p99=100`), `all-parallel`: `p50_fanout > p99_đơn`; `p99_fanout ∈ [170,195]` | | |
| I15 | **Token bucket**: `ratePerSec=100, burst=20`, tải 500 rps 10 s: Σ admitted ≤ 100·10 + 20; `limited ≥ 3900` | | |
| I16 | **Breaker**: node phụ thuộc quá tải; breaker `errorThreshold 0.5, openSec 10`: breaker `open` trong ≤ 5 s kể từ lúc lỗi vượt ngưỡng; khi `open`, `λ_in(callee)` giảm xuống ≤ 5% mức trước; sau khi callee hồi phục và `openSec` hết ⇒ `half-open` ⇒ `closed` | | |
| I17 | **LB health detection**: 3 app, RR, `healthCheckSec=3`, `crash(app2)` tại t=10: lỗi `down` ≈ `(1/3)·λ·3 s` trong t∈[10,13] (±15%), sau t=13 chỉ còn ≈ 0; RR vs least-conn khi `slowdown(app2, +S)`: p99 e2e của RR cao hơn least-conn **≥ 20%** | | |
| I18 | **Hysteresis**: ρ dao động 0,89↔0,91 mỗi tick suốt 10 s ⇒ số lần đổi state hiển thị **≤ 2** | | |
| I19 | **Replication lag**: ghi 800 w/s, `applyRps=500` ⇒ `lagMs` tăng đơn điệu; ghi giảm về 300 ⇒ `lagMs` giảm về < 50 ms trong ≤ 30 s | | |
| I20 | **Analyze**: S1-03 gốc ⇒ `findBottleneck.nodeId==='db'` tại t∈[36,60]; `findSpofs` trả `lb`, `cache`, `db` mức `error`; bản sửa cấu trúc (LB `replicas:2`, cache `replicas:2`, DB có node replica nối `replicate`) ⇒ không còn `error` | | |
| I21 | **Grade**: starter không đạt, solution đạt cho từng `activities.json` mẫu (kiểm tra trong doctor) | | |
| I22 | **Hiệu năng**: trung vị ≤ 5 ms/tick (in cảnh báo > 1 ms) với S1-03 mở rộng lên 30 node | | |

Khi code đạt, ghi số đo thực tế vào bảng này (cột "đo được") để reviewer thấy sai lệch với lý thuyết.

---

## 10. Ví dụ scenario hoàn chỉnh: bài mẫu S1-03 "Data Flow & Bottlenecks"

Mô tả: `client → lb → app1..3 → cache → db`, tải ramp 200→5000 rps trong 60 s rồi giữ 5000 rps tới giây 90. DB vào `saturated` ở **t ≈ 31 s** (ρ = 0,9) và chạm ρ = 1 ở **t ≈ 35 s** (λ ≈ 3010 rps).

Kiểm tra số học (tay): `λ(t)=200+80t`. Cache: `coverage = (25000/50000)^0,5 = 0,707`, `ttlFactor = 1−e^(−120/30) = 0,982`, `h = 0,75·0,707·0,982 = 0,521`. Tỉ lệ vào DB `= readRatio·(1−h) + (1−readRatio) = 0,9·0,479 + 0,1 = 0,531`. `μ_db = 1600` ⇒ `ρ_db = 0,531·λ/1600`: t=20: 0,60; t=31,4: 0,90 (saturated); t=35,1: **1,00** (λ≈3010); t=40: 1,14. App (tổng μ = 3·1800 = 5400): `ρ_app` ở t=35 chỉ ≈ 0,56 ⇒ nghẽn ở **DB trước**; app chỉ chạm 0,9 ở λ=4860 (t≈58). `retry` ở link `cache→db` (không backoff) làm DB tệ nhanh hơn sau t≈36 vì mỗi lỗi sinh thêm tối đa 2 lần gọi.

Một `SimDoc` (phần tử của mảng `sims[]` trong `sim.json`, xem 07 §2.5) gồm `id` + `scenario` + `expect` + `slos` + `presets`:

```json
{
  "id": "S1-03/ramp",
  "scenario": {
    "id": "S1-03/ramp",
    "seed": 1103,
    "durationSec": 90,
    "mix": { "readRatio": 0.9 },
    "clientTimeoutMs": 2000,
    "load": { "kind": "ramp", "from": 200, "to": 5000, "overSec": 60 },
    "events": [],
    "model": {
      "nodes": [
        {
          "id": "client", "kind": "client", "label": { "vi": "Người dùng", "en": "Users" },
          "stateful": false, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 1000000 }, "latency": { "baseMs": 0 },
          "costPerHour": 0, "zone": "internet", "params": {}, "knobs": [], "failureModes": []
        },
        {
          "id": "lb", "kind": "lb", "label": { "vi": "Load Balancer", "en": "Load Balancer" },
          "stateful": false, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 20000 }, "latency": { "baseMs": 0.3, "cv": 0.2 },
          "costPerHour": 0.025, "zone": "az-a",
          "params": { "algorithm": "round-robin", "healthCheckSec": 3 },
          "knobs": [
            { "key": "algorithm", "type": "select", "label": { "vi": "Thuật toán chia tải", "en": "Algorithm" },
              "options": [
                { "value": "round-robin", "label": { "vi": "Round-robin", "en": "Round-robin" } },
                { "value": "least-conn", "label": { "vi": "Least connections", "en": "Least connections" } }
              ], "default": "round-robin" }
          ],
          "failureModes": [{ "kind": "crash", "note": { "vi": "LB chết: mọi request lỗi", "en": "LB down: all requests fail" } }]
        },
        {
          "id": "app1", "kind": "service", "label": { "vi": "App 1", "en": "App 1" },
          "stateful": false, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 1800 }, "latency": { "baseMs": 12, "cv": 0.3 },
          "costPerHour": 0.10, "zone": "az-a",
          "params": { "replicas": 1, "poolSize": 22 },
          "knobs": [
            { "key": "replicas", "type": "number", "label": { "vi": "Số instance", "en": "Instances" },
              "min": 1, "max": 6, "step": 1, "default": 1, "changeCost": 1 }
          ],
          "failureModes": [{ "kind": "crash", "note": { "vi": "Instance chết, LB loại sau health check", "en": "Instance down, LB removes after health check" } }]
        },
        {
          "id": "app2", "kind": "service", "label": { "vi": "App 2", "en": "App 2" },
          "stateful": false, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 1800 }, "latency": { "baseMs": 12, "cv": 0.3 },
          "costPerHour": 0.10, "zone": "az-a", "params": { "replicas": 1, "poolSize": 22 },
          "knobs": [], "failureModes": []
        },
        {
          "id": "app3", "kind": "service", "label": { "vi": "App 3", "en": "App 3" },
          "stateful": false, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 1800 }, "latency": { "baseMs": 12, "cv": 0.3 },
          "costPerHour": 0.10, "zone": "az-a", "params": { "replicas": 1, "poolSize": 22 },
          "knobs": [], "failureModes": []
        },
        {
          "id": "cache", "kind": "cache", "label": { "vi": "Cache", "en": "Cache" },
          "stateful": true, "scaling": "horizontal", "replicas": 1,
          "capacity": { "opsPerSec": 40000 }, "latency": { "baseMs": 0.5, "cv": 0.3 },
          "costPerHour": 0.15, "zone": "az-a",
          "params": { "ttlSec": 120, "ttlJitterPct": 0, "hitRatioMax": 0.75, "workingSetKeys": 50000,
                      "capacityKeys": 25000, "warmupSec": 20, "singleflight": false },
          "initial": { "warm": 1 },
          "knobs": [
            { "key": "ttlSec", "type": "number", "label": { "vi": "TTL", "en": "TTL" },
              "min": 5, "max": 3600, "step": 5, "default": 120, "unit": "s" },
            { "key": "capacityKeys", "type": "number", "label": { "vi": "Dung lượng cache (số key)", "en": "Cache capacity (keys)" },
              "min": 10000, "max": 100000, "step": 5000, "default": 25000, "changeCost": 1 }
          ],
          "failureModes": [{ "kind": "data-loss", "note": { "vi": "Mất cache: miss dồn về DB", "en": "Cache loss: misses hit the DB" } }]
        },
        {
          "id": "db", "kind": "sql", "label": { "vi": "Database", "en": "Database" },
          "stateful": true, "scaling": "vertical", "replicas": 1,
          "capacity": { "opsPerSec": 1600 }, "latency": { "baseMs": 4, "cv": 0.3 },
          "costPerHour": 0.80, "zone": "az-a",
          "params": { "poolSize": 7, "sizeFactor": 1, "maxConnections": 500, "queueLimit": 3000 },
          "knobs": [
            { "key": "poolSize", "type": "number", "label": { "vi": "Connection pool", "en": "Connection pool" },
              "min": 2, "max": 64, "step": 1, "default": 7 },
            { "key": "sizeFactor", "type": "number", "label": { "vi": "Cỡ máy (scale-up)", "en": "Instance size (scale-up)" },
              "min": 1, "max": 4, "step": 1, "default": 1, "changeCost": 1 }
          ],
          "failureModes": [{ "kind": "slow", "note": { "vi": "Query chậm làm thông lượng giảm", "en": "Slow queries cut throughput" } }]
        }
      ],
      "links": [
        { "id": "client-lb", "from": "client", "to": "lb", "mode": "sync", "netClass": "internet", "timeoutMs": 2000 },
        { "id": "lb-app1", "from": "lb", "to": "app1", "mode": "sync", "netClass": "same-az", "timeoutMs": 1500 },
        { "id": "lb-app2", "from": "lb", "to": "app2", "mode": "sync", "netClass": "same-az", "timeoutMs": 1500 },
        { "id": "lb-app3", "from": "lb", "to": "app3", "mode": "sync", "netClass": "same-az", "timeoutMs": 1500 },
        { "id": "app1-cache", "from": "app1", "to": "cache", "mode": "sync", "netClass": "same-az", "timeoutMs": 100 },
        { "id": "app2-cache", "from": "app2", "to": "cache", "mode": "sync", "netClass": "same-az", "timeoutMs": 100 },
        { "id": "app3-cache", "from": "app3", "to": "cache", "mode": "sync", "netClass": "same-az", "timeoutMs": 100 },
        { "id": "cache-db", "from": "cache", "to": "db", "mode": "sync", "netClass": "same-az", "timeoutMs": 800,
          "retry": { "max": 2, "backoff": "none", "baseMs": 0, "jitter": "none" } }
      ],
      "routes": { "client": "split", "lb": "split", "app1": "all-sequential", "app2": "all-sequential", "app3": "all-sequential", "cache": "split" }
    }
  },
  "slos": [
    { "id": "p99", "kind": "slo-latency", "metric": "p99", "maxMs": 300, "window": { "fromSec": 0, "toSec": 90 }, "allowViolationPct": 2 },
    { "id": "err", "kind": "slo-error", "maxRate": 0.01, "window": { "fromSec": 0, "toSec": 90 } }
  ],
  "expect": {
    "bottleneck": "db",
    "firstSaturatedAtSec": [30, 33],
    "firstOverloadedAtSec": [35, 41],
    "appFirstSaturatedAtSec": [55, 62],
    "maxSustainableRpsApprox": [2900, 3100]
  },
  "presets": [
    {
      "id": "fix-cache-and-db",
      "label": { "vi": "Tăng cache và scale-up DB", "en": "Bigger cache and scale-up DB" },
      "changes": [
        { "type": "knob", "node": "cache", "key": "capacityKeys", "value": 50000 },
        { "type": "knob", "node": "db", "key": "sizeFactor", "value": 2 }
      ],
      "expectPass": true
    },
    {
      "id": "trap-more-apps",
      "label": { "vi": "Thêm instance cho tầng app", "en": "Add app instances" },
      "changes": [
        { "type": "knob", "node": "app1", "key": "replicas", "value": 2 },
        { "type": "knob", "node": "app2", "key": "replicas", "value": 2 },
        { "type": "knob", "node": "app3", "key": "replicas", "value": 2 }
      ],
      "expectPass": false
    }
  ]
}
```
Ghi chú:
- `expect` là **neo hồi quy** cho test/doctor: nếu engine đổi mà `db` không còn là bottleneck, hoặc mốc lệch khỏi khoảng ⇒ test đỏ. `maxSustainableRps ≈ 1600/0,531 ≈ 3010` (khớp khoảng `[2900, 3100]`; activity `tune-to-limit` S1-03.A3 dùng 2950 vì retry ở `cache-db` làm DB tệ hơn ngay trước ρ = 1).
- Cache là read-through nằm trên đường bắt buộc tới DB nên `findSpofs` trả `lb`, `cache`, `db` đều là articulation point mức `error` (replicas=1); muốn cache thành phụ thuộc mềm phải dựng topology cache-aside (`app→cache` với `fallback:'bypass'` và `app→db` với `onMissOf:'cache'`).
- Lưu ý `cache` là **read-through** ở đây: lưu lượng miss từ `app*` đi qua `cache` tới `db` (link `cache-db`). Ba link `app*-cache` đều dẫn vào cùng 1 cache; `cache-db` gom miss + ghi.
- Stage của bài (`stage.json`, 07 §2.4) phải dùng đúng các `id` trên cho `StageNode.id`/`StageLink.id`.
- `presets` là các bộ thay đổi mẫu để doctor và activity dùng lại. `fix-cache-and-db`: cache đủ chỗ (`coverage=1 ⇒ h=0,736 ⇒` tỉ lệ vào DB 0,337) và DB ×2 (`μ=3200`) ⇒ `ρ_db ≈ 0,53` ở λ=5000, SLO đạt; chi phí ≈ 0,025 + 3·0,10 + 0,15 + 0,80·2^1,2 ≈ 2,31 USD/giờ. Ở λ=5000 tầng app có ρ ≈ 0,93 (trạng thái `saturated`) nhưng p99 vẫn dưới 100 ms. Lưu ý: chỉ scale-up DB ×2 (không tăng cache) cũng đạt (`ρ_db ≈ 0,83`); fix-challenge chấp nhận nhiều lời giải, `par` chỉ quyết định số sao. `trap-more-apps` (**bẫy**): tăng app không đổi `p99` quá 5% vì DB vẫn nghẽn (bất biến I4); doctor đòi `expectPass:false` thực sự không đạt. Có thể thêm preset retry (`exponential + full jitter + budgetRatio 0.1` cho link `cache-db`) làm giảm khuếch đại nhưng **không** cứu SLO nếu DB vẫn quá tải.

---

## 11. Điểm cần quyết/kiểm khi triển khai

| # | Vấn đề | Tình trạng |
|---|---|---|
| 1 | Công thức `c = round(μ_tot·S)` làm `c` thay đổi khi `replicas` đổi ⇒ p99 thay đổi nhẹ ngay cả khi ρ đã thấp | Đề xuất chấp nhận (hiệu ứng thật, thêm server giảm Wq); xác nhận ở T2.8 |
| 2 | Xử lý `cancelOnTimeout` (callee huỷ công việc đã bị bỏ) | Mặc định `false` để thấy lãng phí; thêm knob ở war-room (T7.2) |
| 3 | Chạy engine trong Web Worker | Chưa quyết — quyết sau bench ở T3.6/T3.7 (≥ 20 node) |
| 4 | Mô hình sticky read-after-write | Chưa quyết (routing trong scene hay knob) — chốt ở T6.5 (batch 5, S2-08) |
| 5 | Ghost timeline cho A/B compare | M8 (T8.2) |
| 6 | Raft trên engine tải, multi-region nâng cao | M8 (T8.3). Raft dạng kịch bản cho S3-03 thuộc §12 |
| 7 | Dung sai các test I1–I22 | Điều chỉnh trong lần implement đầu (T2.7), ghi vào bảng §9.5 cột "đo được" |
| 8 | Độ chính xác của `traceRequest` (waterfall lấy mẫu từ phân phối, không phải request thật) | Chấp nhận ở v1; UI ghi "request đại diện" (T3.5) |

---

## 12. Mô phỏng sự kiện (Time view, state machine) — phạm vi, **Chưa quyết**

19 bài có cột Sim = `sự kiện` trong `02-curriculum.md`. Chia hai loại:

| Loại | Bài | Cách chạy |
|---|---|---|
| A. Sự kiện trên engine tải | S1-06, S2-12, S3-09, S5-04, S6-05, S6-12 | Dùng chính engine ở trên với `TimedEvent` (crash, partition, slowdown, deploy) và `traceRequest`; tải thấp/ổn định. Không cần thêm engine |
| B. Lịch sử nhiều client, state machine | S2-06, S2-11, S3-01, S3-02, S3-03, S3-04, S3-05, S3-06, S3-07, S3-08, S4-06, S5-06, S7-06 | Cần mô hình rời rạc: các actor (client, replica, coordinator), message có độ trễ, đồng hồ từng node, lock/transaction, quorum; kết quả là `HistoryOp[]` (06 §3.7) cho Time view và `timeline-read` |

Phác thảo đề xuất cho loại B (để chốt ở T6.0a):
- Thư mục `sim/timeline/`, thuần TS như phần còn lại của `sim/` (cùng quy tắc §0: deterministic theo seed, không React).
- Mô hình: **mô phỏng sự kiện rời rạc theo kịch bản** (hàng đợi ưu tiên theo thời gian ảo, ms), không theo tick 100 ms. Mỗi bài khai báo actor, kịch bản thao tác (ghi/đọc/gửi/crash/partition/lệch đồng hồ) và vài tham số người học chỉnh được (W, R, N; CP/AP; độ lệch đồng hồ; idempotency key bật/tắt; isolation level).
- State machine dựng sẵn, nhỏ, đủ cho bài: replica có log và `appliedIndex`; quorum read/write; leader election rút gọn (term, vote, heartbeat timeout) cho S3-03; 2PC và saga có compensation; Lamport/vector clock; G-Counter/OR-Set/LWW cho S3-08; lock hàng và version cho S3-07.
- Đầu ra: `HistoryOp[]` + danh sách mốc; checker nhỏ (stale read, vi phạm read-your-writes, lost update, double charge) để doctor tự kiểm `expected` của `timeline-read` (thay phần viết tay ở 06 §10 mục 2).
- Hiển thị: Time view (2D SVG, các làn theo client/replica, mũi tên message) là component của feature, không phải chế độ mới của `ScaleStageSvg`; bước có Time view dùng `memory-2d` hoặc khung riêng trong `SdLearnShell` (chốt cùng T6.0a).

Cần quyết ở T6.0a (trước batch 4 của M6, vì S2-06 và S2-11 là hai bài loại B đầu tiên):
1. Làm engine `sim/timeline/` hay viết kịch bản cố định (dữ liệu tĩnh `HistoryOp[]`, chỉ có tham số chọn nhánh). Đề xuất: engine rời rạc nhỏ, vì S3-01..S3-08 cần núm W/R, CP/AP, độ lệch đồng hồ.
2. Time view đặt ở đâu trên giao diện (thay stage hay cạnh stage).
3. Phạm vi Raft trong S3-03 (chỉ bầu leader và quorum ghi; không log compaction, không membership change).
