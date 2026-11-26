# 05 — Chế độ `live-sim` trên stage dùng chung

> Nguồn sự thật cho M3. Đây là phần **sửa code dùng chung** của 5 app hiện có (`src/components/scale-workbench/*`), nên rủi ro hồi quy là mối quan tâm số 1: nguyên tắc xuyên suốt là **bước nào không có `liveSim` thì phải chạy y hệt hiện tại** (§3.8, §9).
>
> Số dòng ghi "tại 2026-11-26" là của commit `7bf4997` (branch `feat/sdmastery`, sau khi người dùng commit các thay đổi dở theo PLAN "Tiền điều kiện"). Số dòng sẽ trôi; khi bắt tay làm M3, implementer phải `grep` lại tên hàm/biến ghi kèm và ghi đè số dòng trong bảng §1.
>
> Liên quan: `04-simulation-engine.md` (nguồn `SimFrame`), `06-activities-and-grading.md` (hoạt động chạy trên stage), `docs/scale-workbench-guidelines.md` (§2 animation, §3 inspector, §4 bố cục).

---

## 0. Phạm vi và nguyên tắc

1. Stage vẫn là **một** `ScaleStageSvg` (guidelines §2.3: `<svg>` không remount giữa các step). `live-sim` không phải component mới mà là **một kênh dữ liệu thứ hai** chảy vào stage: `scene` (cấu trúc, **tĩnh theo step**) + `frameSource` (trạng thái theo tick, **động**).
2. Workbench **không phụ thuộc feature**: mọi kiểu `Live*` định nghĩa trong `scale-workbench/types.ts`; engine ở `sysdesign-course/sim` sinh `SimFrame` rồi adapter của feature `sysdesign-course/live/liveSimAdapter.ts` chuyển thành `LiveSimFrame` và cài `LiveSimAdapter` (§2.1; 04 §9.1). `sim/` không import workbench.
3. **Không `setState` mỗi tick.** Frame được đọc trong `requestAnimationFrame` và ghi thẳng vào thuộc tính SVG qua ref map (cùng kỹ thuật choreography hiện có). React chỉ re-render khi cấu trúc đổi (đổi step, chọn node, mở inspector).
4. UI điều khiển (timeline, telemetry, knob, chaos) là các component **tự subscribe** frame ở tần số thấp (5–10 Hz) để `ScaleWorkbenchLayout` không re-render mỗi tick.
5. Mọi chuỗi hiển thị song ngữ qua `WORKBENCH_I18N` (§7); engine không chứa chuỗi.

---

## 1. Hiện trạng và vấn đề (tại 2026-11-26)

Các hành vi dưới đây đã đọc trực tiếp từ code (`src/components/scale-workbench/`). Cột "Hệ quả cho live-sim" giải thích vì sao thiết kế ở §2–§3 chọn như vậy.

| # | Hành vi hiện tại | Vị trí (tại 2026-11-26) | Hệ quả cho live-sim |
|---|---|---|---|
| P1 | Effect `[scene]` reset camera và **đóng inspector** mỗi khi `scene` đổi identity: `setSelectedInfo(null); setHoverPreview(null); camRef.current = {zoom:1,panX:0,panY:0}; setZoom(1); setPan({x:0,y:0})` | `ScaleStageSvg.tsx:1099-1105` | Nếu mỗi tick tạo `scene` mới, người học không thể zoom/pan/mở inspector. ⇒ giữ `scene` cố định; reset theo **khoá cấu trúc** (§3.5) |
| P2 | Mọi thay đổi `scene` ⇒ `useMemo expandedNodes` chạy lại `composeIsometricLayout` (ghi đè x/y cho scene 1–4 node), `builtLinks`, `builtZones`… rồi effect choreography (1513–1935) **dựng lại snapshot** và hoạt cảnh diff (enter/move/exit, `TIMING` ở dòng 37: `exit 380, move 760, enter 680, stagger 125, draw 540, linkStagger 85` ms) | `ScaleStageSvg.tsx:1107-1112` (`expandedNodes`), `1513-1935` (effect), `37-44` (`TIMING`) | Scene đổi mỗi tick ⇒ layout dựng lại và morph ~380–760 ms, packet bị ẩn trong thời gian đó. ⇒ không bao giờ đổi `scene` theo tick |
| P3 | Packet là **vòng lặp tuần hoàn không mang dữ liệu**: `phase = ((sec·speed + offset) % 1 + 1) % 1`, vị trí lấy bằng `getPointAtLength`, `StagePacket {id, linkId, kind, speed?, offset?, reverse?}` | choreography F: `ScaleStageSvg.tsx:1880-1909`; kiểu `StagePacket` ở `types.ts` | Không có số lượng/tỉ lệ nào gắn với lưu lượng thật. ⇒ cần **packet pool** do frame điều khiển (§3.4) |
| P4 | Chỉ `shape: 'block'` vẽ thanh tải `loadPct` (ngưỡng 65/90: vàng ≥65, đỏ ≥90) tại `translate(0,-54)`; `db`, `device`, `crowd` bỏ qua `loadPct` và `badge` | `ScaleStageSvg.tsx:2221-2260` (trong `renderNodeBody` 2049-2510); `n.loadPct`/`n.dead` còn tính vào vật cản đặt pill ở 1220 và 1262 | DB là node quan trọng nhất của bài mẫu nhưng không vẽ được tải. ⇒ lớp overlay trạng thái **cho mọi shape** (§3.3) |
| P5 | `dead` vẽ thân đá xám + X đỏ (2133–2198), `badge` vẽ pill (2200–2219) hoàn toàn do **React render theo props** | `ScaleStageSvg.tsx:2133-2198, 2200-2219` | Không đổi được bằng ref ⇒ trạng thái `down` live phải vẽ bằng overlay (X + phủ xám) chứ không qua `node.dead` |
| P6 | **Hai vòng cộng `dt` vào cùng `packetElapsedRef`**: vòng trong choreography (`packetElapsedRef.current += dt` dòng 1881, vòng tự gọi lại ở dòng 1918: `if (elapsed <= maxChoreoTime \|\| (isPlayingRef.current && scene.packets.length > 0))`) và effect "Resume packet rAF loop" (`packetElapsedRef.current += dt` dòng 1945, chạy khi `isPlaying && scene.packets.length > 0`) | `ScaleStageSvg.tsx:1881, 1918, 1937-1970` | Khi `isPlaying && packets>0` cả hai vòng sống ⇒ `packetElapsedRef` tăng gấp đôi ⇒ packet chạy ×2 (PLAN ghi "sau khi đổi step"; thực tế điều kiện là cả hai effect cùng sống). **Phải xác nhận bằng đo** (§9.2) rồi sửa kèm ở M3 |
| P7 | `legendKinds` là `useMemo` đặt **sau** `if (!activeLesson \|\| !activeStep) return null;` ⇒ vi phạm Rules of Hooks (số hook đổi giữa các lần render nếu `activeLesson` từ `undefined` sang có giá trị) | `ScaleWorkbenchLayout.tsx:480` (return null), `496` (useMemo) | Sửa kèm: đưa hook lên trước return (§3.7). Live-sim thêm hook mới, không được làm tệ thêm |
| P8 | Điều khiển hiện chỉ gồm Replay (`setReplayNonce`) và Play/Pause (`setIsPlaying`) cho stage isometric/memory; phím `←/→` đổi step, `R` replay, `Space` đảo `isPlaying` (listener trên `window`, bỏ qua `input, textarea, select, [contenteditable], [role=dialog]`) | `ScaleWorkbenchLayout.tsx:224-225` (state), `438-467` (phím), `1053-1129` (nút) | Cần tái dùng Space/R, và **tránh xung đột `←/→`** khi thanh tua đang focus (§5.1) |
| P9 | Packet layer có `pointerEvents="none"`; Inspector chỉ có hover/click cho node, link, pill (`getNodeInspector`, `selectedInfo`, `StageInspectorPortal` ở `StageEntityInspector.tsx:532-642`) và **chưa có slot số liệu live** | `ScaleStageSvg.tsx:2968`; `StageEntityInspector.tsx:441-` (`StageEntityInspectorCard`), `532-642` | Cần `liveSlot` trong thẻ inspector và chế độ nhặt packet cho `RequestTracer` |
| P10 | Renderer là chuỗi ternary: sandbox → `isIsometricStage && scene` → `isMemoryStage` → `activeStep.codeTrace` → null; legend packet đặt ngay dưới `ScaleStageSvg`; Stepper ở 1187 | `ScaleWorkbenchLayout.tsx:1132-1184` (stage viewport), `1157-1164` (legend), `1187` (stepper) | Điểm chèn nhánh `live-sim` và SimTimeline (§5.2) |
| P11 | `PacketKind = 'request'\|'response'\|'pointer'\|'mutation'\|'cache-hit'\|'error'`; `LegendDot` là `switch` không có `default`; `WORKBENCH_I18N.*.packets: Record<PacketKind,string>` | `types.ts` (`PacketKind`), `ScaleWorkbenchLayout.tsx:124-142`, `i18n.ts:69,154` | Thêm `retry`, `timeout`, `dropped` ⇒ cập nhật cả ba nơi, nếu không `tsc -b` đỏ (đúng ý: trình biên dịch dẫn đường) |
| P12 | Không có thư viện chart; không có playback/sim state trong `useWorkbenchStore` | — | Sparkline tự vẽ SVG (§5.3); state clock đặt trong hook cục bộ, không vào store dùng chung |

---

## 2. Kiểu dữ liệu mới (`scale-workbench/types.ts`)

Thêm (không đổi hay xoá kiểu cũ):

```ts
// 1) Chế độ stage
export type StageRenderMode = 'isometric' | 'memory-2d' | 'code-trace' | 'live-sim';

// 2) Packet kind mở rộng (giá trị mới; scene cũ không dùng)
export type PacketKind =
  | 'request' | 'response' | 'pointer' | 'mutation' | 'cache-hit' | 'error'
  | 'retry' | 'timeout' | 'dropped';

// 3) Frame tối thiểu mà workbench hiểu (feature phải cung cấp đúng hình dạng này)
export type LiveNodeState =
  | 'idle' | 'healthy' | 'busy' | 'saturated' | 'overloaded' | 'down' | 'recovering';

export interface LiveNodeFrame {
  state: LiveNodeState;
  loadPct: number;                 // 0..100, thanh tải
  queuePct: number;                // 0..1, chiều cao "queue pile"
  queue?: number;                  // số lượng thật (để tooltip)
  badge?: { text: BilingualText; tone: 'default' | 'ok' | 'warn' | 'bad' };
  warm?: number;                   // 0..1 vòng warming (state 'recovering' hoặc cache nguội)
  lagMs?: number;                  // replica
  hitPct?: number;                 // cache
  metrics?: Record<string, number>;// số liệu cho liveSlot: rho, lambda, p99, errorRate…
}

export interface LiveLinkFrame {
  rps: number;                     // dày/mỏng theo lưu lượng
  throughput: number;
  errorRate: number;               // 0..1
  style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
  breaker?: 'closed' | 'open' | 'half-open';
  lagMs?: number;                  // link 'replicate' (khoảng cách 2 vạch)
}

export interface LivePacket {
  id: number;
  linkId: string;
  kind: PacketKind;
  reverse: boolean;
  progress: number;                // 0..1 tại thời điểm frame
  fate?: number;                   // 0..1: mờ/rơi tại tiến độ này
}

export interface LiveSimFrame {
  tick: number;
  t: number;                       // giây mô phỏng
  nodes: Record<string, LiveNodeFrame>;
  links: Record<string, LiveLinkFrame>;
  packets: LivePacket[];
  packetScale: number;             // "1 chấm = N req/s"
  metrics: Record<string, number>; // offeredRps, goodputRps, errorRate, p50, p95, p99, costPerHour…
}

// 4) Nguồn frame mà ScaleStageSvg / UI đọc (pull + subscribe)
export interface LiveSimSource {
  /** Frame mới nhất (tham chiếu ổn định tới tick đó, không clone). null trước khi sẵn sàng. */
  getFrame(): LiveSimFrame | null;
  /** Subscribe tần số thấp cho UI React. Trả hàm huỷ. hz mặc định 10. */
  subscribe(cb: (f: LiveSimFrame) => void, opts?: { hz?: number }): () => void;
}

// 5) Khai báo trong step (do builder của feature điền)
export interface LiveSimSpec {
  /** Khoá tới phiên mô phỏng trong sim.json (feature giải mã). */
  simId: string;
  startAtSec?: number;             // mặc định 0
  autoplay?: boolean;              // mặc định true
  speed?: 1 | 2 | 5;               // mặc định 1
  /** Bộ điều khiển hiển thị cho bước này (ẩn bớt để bước giới thiệu không rối). */
  controls: {
    timeline?: boolean;            // mặc định true
    load?: boolean;                // LoadKnob
    chaos?: LiveChaosKind[];       // ChaosToolbox; [] = ẩn
    knobs?: { node: string; key: string }[]; // panel tham số
    tracer?: boolean;              // RequestTracer
  };
  /** Chỉ số hiển thị ở LiveTelemetryStrip, tối đa 4, theo thứ tự. */
  telemetry?: LiveMetricSpec[];
  /** Đường SLO vẽ trên sparkline. */
  slo?: { metric: 'p99' | 'errorRate'; value: number; unit?: string }[];
  /** Mốc tạm dừng tự động để người học dự đoán (liên kết activity, 06). */
  pauseAtSec?: number[];
  /** Node/link cần nổi bật khi bước này giải thích. */
  focus?: { nodes?: string[]; links?: string[] };
}

export type LiveChaosKind =
  | 'kill' | 'slow' | 'partition' | 'expire-cache' | 'hot-key' | 'bad-deploy';

export interface LiveMetricSpec {
  metric: string;                  // khoá trong LiveSimFrame.metrics
  label: BilingualText;
  format: 'rps' | 'ms' | 'pct' | 'usd-hour' | 'count';
  /** Màu theo ngưỡng. */
  tone?: { warnAbove?: number; badAbove?: number; warnBelow?: number; badBelow?: number };
}

// 6a) Dòng nguồn/ghi công cho bài (07 §2.2 `source`, 01 §3.2), hiển thị cuối cột phải.
//     Thêm field ở T3.1; Layout render ở T3.6; sdLessonBuilder điền từ module.json.source (T3.6).
//     Lesson không có attribution ⇒ không render gì (5 app cũ không đổi).
export interface ScaleModuleLesson {
  /* …các field hiện có… */
  attribution?: { text: BilingualText; href?: string };
}

// 6) Mở rộng ScaleLessonStep
//   stageMode: 'live-sim' bắt buộc có scene (cấu trúc) + liveSim
export interface ScaleLessonStep {
  /* …các field hiện có… */
  liveSim?: LiveSimSpec;
  /** id hoạt động gắn vào step (06). Workbench chỉ hiển thị cổng, không hiểu nội dung. */
  activityId?: string;
  activityGate?: 'required' | 'optional';
}
```

### 2.1 Phiên điều khiển do feature cấp (`LiveSimAdapter`)

Workbench cần điều khiển engine mà không import feature. Layout nhận **một prop tuỳ chọn**:

```ts
export interface LiveKnobDescriptor {
  node: string; key: string;
  label: BilingualText; type: 'number' | 'select' | 'bool';
  min?: number; max?: number; step?: number; unit?: string;
  options?: { value: string; label: BilingualText }[];
  value: number | string | boolean;
}

export interface LiveMarker { t: number; kind: 'event' | 'learner' | 'milestone' | 'alert'; label: BilingualText; nodeId?: string }

export interface LiveSeries { /** các cột cùng độ dài */ t: Float32Array; v: Float32Array; length: number }

export interface LiveTraceSpan {
  id: string; nodeId?: string; linkId?: string;
  kind: 'net' | 'queue' | 'service' | 'retry-wait' | 'timeout';
  label: BilingualText; startMs: number; durMs: number; ok: boolean;
}
export interface LiveTrace {
  totalMs: number; outcome: 'ok' | 'timeout' | 'error' | 'dropped';
  spans: LiveTraceSpan[]; note?: BilingualText;
}

export interface LiveSimSession {
  readonly source: LiveSimSource;
  readonly durationSec: number;
  /** Tiến mô phỏng tới t giây (bước cố định 100 ms, gọi nhiều lần nếu cần). Trả số tick đã chạy. */
  advanceTo(tSec: number): number;
  getT(): number;                                   // vị trí hiện tại
  getHeadT(): number;                               // mép phải đã mô phỏng
  seek(tSec: number): void;                         // scrub
  reset(): void;
  setLoadMultiplier(x: number): void;
  setKnob(node: string, key: string, value: number | string | boolean): void;
  inject(kind: LiveChaosKind, target: { node?: string; link?: string }, opts?: { addMs?: number; share?: number }): void;
  knobs(): LiveKnobDescriptor[];
  series(metric: string): LiveSeries;               // cho sparkline
  markers(): LiveMarker[];
  trace(hint?: { packetId?: number; linkId?: string; kind?: PacketKind }): LiveTrace | null;
  dispose(): void;
}

export interface LiveSimAdapter {
  open(spec: LiveSimSpec, ctx: { lang: WorkbenchLang; moduleId: string; stepIndex: number }): LiveSimSession;
}
// ScaleWorkbenchLayoutProps += liveSimAdapter?: LiveSimAdapter;
```
**Cổng activity (06 §4).** Workbench không import `activities/`. Layout nhận thêm hai prop tuỳ chọn (thêm ở T4.1, cùng lúc chèn `ActivityGate`):
```ts
// ScaleWorkbenchLayoutProps +=
renderStepActivity?: (ctx: { moduleId: string; stepIndex: number; activityId: string;
                              gate: 'required' | 'optional' }) => React.ReactNode;   // render ở cột phải, trước objectives (~1423)
isStepLocked?: (moduleId: string, stepIndex: number) => boolean;                     // true ⇒ vô hiệu "Bước tiếp" và "Hoàn thành bài"
```
Không truyền ⇒ không render gì và không khoá (5 app cũ không đổi).

`ScaleWorkbenchLayout` giữ session theo `(moduleId, stepIndex)` bằng `useRef` + effect `open`/`dispose`; session tồn tại suốt thời gian ở step đó (đổi step ⇒ `dispose` + `open` mới). *Chưa quyết:* giữ session khi quay lại step trước (cache theo step, tối đa 3) hay luôn mở lại từ `startAtSec` (mặc định: mở lại, đơn giản và dễ hiểu).

---

## 3. `ScaleStageSvg` — thay đổi

### 3.1 Props mới (tất cả tuỳ chọn)

```ts
export interface ScaleStageSvgProps {
  scene: StageScene;
  lang: WorkbenchLang;
  theme: WorkbenchTheme;
  isPlaying: boolean;
  replayNonce: number;
  className?: string;
  // ── live-sim ──
  frameSource?: LiveSimSource;
  liveOptions?: {
    maxPackets?: number;           // mặc định 200, 80 trên màn hẹp
    reducedMotion?: boolean;       // ghi đè prefers-reduced-motion (test)
    tracerEnabled?: boolean;       // packet nhận pointer events
    focus?: { nodes?: string[]; links?: string[] };
  };
  onPacketPick?: (p: { id: number; linkId: string; kind: PacketKind }) => void;
  /** Chế độ nhặt đích (chaos/đoán): click chọn entity thay vì mở inspector. */
  pickMode?: { accept: ('node' | 'link')[]; onPick: (e: { kind: 'node' | 'link'; id: string }) => void } | null;
  /** Nội dung số liệu live chèn vào thẻ inspector. */
  renderLiveSlot?: (e: { kind: 'node' | 'link'; id: string }) => React.ReactNode;
}
```
Không truyền `frameSource` ⇒ toàn bộ nhánh live-sim bị bỏ qua (§3.8).

### 3.2 Áp frame trong rAF qua ref map

Thêm một effect riêng `useLiveFrameLoop` (không đụng effect choreography):

```ts
// Ref map mới (cạnh nodeOuterRefs 1040, packetRefs 1049…)
const liveNodeRefs = useRef<Map<string, LiveNodeEls>>(new Map());   // {root, tint, bar, barFill, barText, pile, badge, x, warmRing}
const liveLinkRefs = useRef<Map<string, LiveLinkEls>>(new Map());   // {overlayPath, gate, lagMark}
const livePacketPool = useRef<SVGGElement[]>([]);                  // N phần tử dựng sẵn
const lastApplied = useRef<{ tick: number; shown: Map<string, ShownNode> }>({ tick: -1, shown: new Map() });
const choreoSettledAt = useRef(0);   // đặt trong tick() khi elapsed > maxChoreoTime
```
Vòng lặp:
```
effect [frameSource, builtLinks, expandedNodes]:
  if (!frameSource) return
  raf loop(now):
    f = frameSource.getFrame(); if (!f) → continue
    ready = choreoSettledAt.current > 0 && now - choreoSettledAt.current > 120   // overlay hiện sau khi stage "tiếp đất" xong
    layerOpacity = ready ? 1 : 0
    if (f.tick !== lastApplied.tick || smoothing còn dở) applyNodes(f, dt)   // lerp loadPct/queue tới đích (τ ≈ 120 ms)
    applyLinks(f)
    advancePackets(f, now, dt)           // vị trí chấm theo tween cục bộ giữa các frame
```
Quy tắc ghi DOM:
- **Dirty-check**: giữ giá trị đã ghi (`shown`) và chỉ gọi `setAttribute` khi đổi (làm tròn: `loadPct` nguyên, `opacity` 2 chữ số, toạ độ 0,1 px).
- Không đọc layout (`getBBox`, `getBoundingClientRect`) trong vòng; `getTotalLength` đã cache bằng `measureLinkLen` (dòng 1665) hoặc LUT (§3.4).
- Khi `isPlaying=false`: vòng vẫn chạy nhưng **không** tiến `progress` chấm (đóng băng), vẫn áp state frame (khi tua/seek frame đổi vẫn phải vẽ).
- Unmount/đổi `frameSource`: huỷ rAF, ẩn overlay.

### 3.3 Overlay trạng thái cho mọi shape

Lớp mới `layer-live-ents` đặt **ngay sau `layer-ents`** (`ScaleStageSvg.tsx:3035`) và trước `layer-link-labels` (3072), `pointerEvents="none"`. Với mỗi node trong `expandedNodes` (vị trí cuối sau `composeIsometricLayout`) tạo 1 `<g transform="translate(x,y)">` gồm:

| Phần tử | Mục đích | Điều khiển bởi |
|---|---|---|
| `tint`: đa giác `getSilhouettePolygon(shape)` (hàm đã có, dòng 186) với `fill` trạng thái, `mix-blend-mode: multiply` (light) / `screen` mờ (dark), `opacity` 0→0,38 | tô màu theo state **cho mọi shape** | `state` |
| `bar`: pill tải 74×19 (cùng kích thước thanh `block` ở 2221-2260) đặt `translate(0,-54)` cho `block`; với `db`/`device`/`crowd` đặt theo `topReach` của shape; màu nền thanh: xanh <65, vàng 65–89, đỏ ≥90 (cùng ngưỡng cũ) | thanh tải cho mọi shape | `loadPct` |
| `pile`: chồng "request chờ" **trước node** (phía SW-ngoài, nơi link đi vào): tối đa 12 hộp nhỏ 6×4 xếp cột, số hộp = `ceil(queuePct·12)`, màu cam→đỏ khi `queuePct>0.5`; kèm số `queue` rút gọn (`1.2k`) | hiển thị hàng đợi | `queuePct`, `queue` |
| `x`: dấu ✕ đỏ + phủ xám đá (tint `down`) + tag `DOWN` | node chết (thay `node.dead` vốn bằng React) | `state==='down'` |
| `warmRing`: vòng cung stroke-dasharray quanh đế node, đầy theo `warm` | recovering/cache nguội | `warm` |
| `badge`: `TactilePill` thu nhỏ ở `y=64` (cùng vị trí badge tĩnh 2200–2219) | LAG, QUEUE, COLD… | `badge` |
| `shake`: transform `translate(±0.6,0)` theo `sin` 18 Hz khi `saturated`; biên độ 0 nếu reduced-motion | "rung nhẹ" | `state` |

Bảng state → hình ảnh (khớp BRIEF §2.5 và 04 §2.13):

| state | tint | thanh tải | queue pile | khác |
|---|---|---|---|---|
| idle | xám nhạt 0.12 | ẩn nếu `loadPct<5` | — | packet thưa |
| healthy | không | xanh | — | |
| busy | vàng 0.18 | vàng | — | |
| saturated | cam 0.28 | cam | hiện | rung nhẹ |
| overloaded | đỏ 0.38 | đỏ + nhấp nháy viền (tắt khi reduced-motion) | đầy | packet đỏ rơi |
| down | xám đá 0.6 | ẩn | ẩn | ✕ + `DOWN` |
| recovering | xám xanh 0.2 | xanh | — | `warmRing` |

Bắt buộc: **ẩn thanh tải tĩnh của `block`** khi step là `live-sim` (builder không điền `node.loadPct`/`node.dead`/`node.badge` trong scene của step live-sim — chỉ overlay vẽ). Lý do: tránh vẽ hai thanh và để ô vật cản đặt pill (1220, 1262) tính theo `typeof n.loadPct === 'number'`: với live-sim ta cần chừa chỗ, nên builder đặt `loadPct: 0` (giữ vật cản) và `renderNodeBody` bỏ qua vẽ thanh khi `frameSource` có (`!frameSource && typeof node.loadPct==='number'`).

### 3.4 Packet pool, link và breaker

**Pool.** Tạo `maxPackets` (200) `<g>` một lần trong `<g class="layer-live-packets">` (đặt **thay chỗ logic** `layer-packets` 2968 chỉ khi `frameSource`; `scene.packets` của step live-sim phải rỗng). Mỗi `<g>` có `circle r=4.4` + `rect` (cho `error`/`mutation`), ẩn bằng `display:none`. Mỗi frame:
1. Với `f.packets` (đã sắp theo id): lấy phần tử pool theo `slot = id % maxPackets` (hoặc bảng id→slot, giải phóng khi chấm biến mất).
2. Nếu `kind` đổi so với lần trước ⇒ đổi thuộc tính fill/stroke theo bảng:

| kind | fill / hình | ghi chú |
|---|---|---|
| request | `#f3b47f` tròn | màu hiện có |
| response | `#9fd28f` tròn | |
| cache-hit | `#efb041` tròn, quay đầu ở `fate` | |
| retry | `#e8883a` tròn viền đậm + vòng ngoài mảnh | cam |
| timeout | `#bdb4a8`, opacity giảm dần đến `fate` | mờ |
| dropped | `#e5534b`, rơi (`translate y += (progress−fate)·36`) | rơi khỏi đường |
| error | `#e5534b` vuông bo | màu hiện có |
3. **Vị trí:** `progress` từ frame + tween cục bộ `(now − frameTime)/travelSec` giữa 2 frame (frame 10 Hz, rAF 60 Hz) để chuyển động mượt; `reverse ⇒ 1 − progress`. Lấy điểm bằng **LUT**: khi `builtLinks` đổi, lấy mẫu mỗi link 48 điểm (`getPointAtLength` 48 lần, **ngoài vòng tick**) vào `Float32Array` rồi nội suy tuyến tính (nhanh hơn ~20× `getPointAtLength` mỗi frame).
4. Ẩn phần tử thừa; chấm `fate` đạt ⇒ opacity 0 / rơi.
5. `liveOptions.tracerEnabled` ⇒ mỗi `<g>` có `circle r=10 fill=transparent pointer-events=all` và `onPointerDown` gọi `onPacketPick` (và tự **pause** clock qua callback, §4).

**Link.** Mỗi link có overlay path `live-link-overlay` (copy thuộc tính `d` của path gốc sau khi layout xong — không đụng path gốc đang chạy hoạt cảnh `stroke-dashoffset`):
- Độ dày `strokeWidth = 1.6 + 4.4·clamp01(log10(1+rps)/log10(1+rpsMax))`, với `rpsMax` = max `rps` của link trong 5 s gần nhất (có hysteresis co giãn), để ống "dày" khi lưu lượng lớn.
- `style`: `danger` đỏ, `dashed` cam, `cut` xám có `✕` ở giữa, `off` mờ 0.25.
- `errorRate > 1%`: viền đỏ mảnh chồng lên, độ đậm ∝ `errorRate`.
- **Cổng breaker** tại điểm giữa link: thanh dọc 10×14; `closed` = xanh mở; `open` = đỏ đóng kèm ký hiệu `⏸`; `half-open` = vàng nửa mở. Tooltip: trạng thái và thời gian còn lại.
- **Replication lag marker** (link `replicate`): 2 vạch ngắn song song, khoảng cách `d = 6 + 18·clamp01(log10(1+lagMs)/4)` px, nhãn `lag 800 ms`; vạch thứ 2 (chưa áp dụng) màu cam khi `lagMs>200`.
- Nhãn pill của link (đã có) có thể hiển thị số `rps` rút gọn khi `liveOptions.showLinkRps` (mặc định bật ở bước có `telemetry`).

**Packet scale:** góc dưới trái stage hiển thị `1 chấm = N req/s` (từ `packetScale`) trong pill nhỏ cùng dòng với zoom control; ẩn khi reduced-motion + không có chấm.

### 3.5 Khoá cấu trúc cho camera reset

Thay effect `[scene]` (1099–1105):
```ts
const structureKey = useMemo(
  () => scene.nodes.map(n => `${n.id}:${n.shape}`).join(',') + '|' +
        scene.links.map(l => `${l.id}:${l.from}>${l.to}`).join(','),
  [scene]
);
const resetDep = frameSource ? structureKey : scene;   // identity cho scene thường (hành vi cũ), khoá chuỗi cho live
useEffect(() => { /* reset camera + đóng inspector như cũ */ }, [resetDep]);
```
Quy tắc cho tác giả/builder: `scene` của step live-sim phải được **tạo một lần** (memo ở builder) — không dựng lại trong render. Trong `import.meta.env.DEV`, nếu `frameSource` có mà `scene` identity đổi > 2 lần/giây ⇒ `console.warn('[live-sim] scene thay đổi quá thường xuyên…')`.

Effect choreography (1513) có deps `expandedNodes, builtLinks…`; vì `scene` không đổi nên không chạy lại giữa tick. Khi người học bấm *Chạy lại* (`replayNonce`) chạy lại như cũ; đồng thời Layout gọi `session.reset()` (§5.1).

### 3.6 Inspector `liveSlot` và chế độ nhặt

- `StageEntityInspectorCard` thêm prop `liveSlot?: React.ReactNode` (render giữa header và khối What/How/Why, có tiêu đề "Số liệu trực tiếp" i18n `live.inspector.title`, một `<section aria-live="off">`). `StageInspectorPortal` thêm prop cùng tên chuyển xuống. `ScaleStageSvg` truyền `renderLiveSlot?.({kind, id})` khi mở inspector: `selectedInfo.key` có dạng `node:<id>`/`link:<id>`/`pill:<id>` (đã có) nên parse trực tiếp.
- `liveSlot` do feature cung cấp, nội dung (`NodeLivePanel`): bảng ρ/λ/served/p50-p95-p99/lỗi/queue (cập nhật 5 Hz, tự subscribe), sparkline 60 s của ρ và p99, **"Vì sao trạng thái này?"** (1–2 câu sinh từ số liệu: "ρ = 1,06 > 1: λ vào 1694 rps lớn hơn năng lực 1600 rps nên hàng đợi tăng"), và các **knob** của node (`LoadKnob` kiểu slider nhỏ) nếu `spec.controls.knobs` cho phép.
- `pickMode`: khi khác `null`, click node/link gọi `onPick` thay vì mở inspector; hover vẫn hiện tooltip; node hợp lệ có viền chấm chấm nhấp nháy (reduced-motion: viền tĩnh). `Esc` thoát pick mode (Layout xử lý).

### 3.7 Sửa kèm (bắt buộc làm trong M3, vì chạm đúng vùng code)

| Fix | Nội dung | Chấp nhận khi |
|---|---|---|
| F1 — packet x2 (P6) | Gộp **một** vòng packet duy nhất: bỏ khối F trong `tick` (1880–1909) và để effect "Resume" (1936–1970) làm chủ `packetElapsedRef`; chuyển vào đó cổng `lPlan.readyAt` + `fadeInAfterLink` mà vòng cũ có (vòng thứ 2 hiện thiếu). Vòng choreography vẫn có thể sống để chạy hoạt cảnh nhưng **không** cộng `dt` cho packet. Nếu muốn giữ cấu trúc cũ: dùng ref `packetLoopOwner` để chỉ một vòng được cộng `dt` | đo tốc độ pha packet trước/sau (§9.2): sau sửa, hằng số thời gian 1 chu kỳ khớp `1/speed` (±5%) |
| F2 — camera theo khoá (P1) | §3.5. Với scene thường giữ hành vi cũ (identity) | đổi step reset camera như cũ; live-sim không reset khi tick |
| F3 — hook order (P7) | Đưa `useMemo(legendKinds)` lên **trước** `if (!activeLesson \|\| !activeStep) return null` (480): `const steps = activeLesson?.steps[safeStepIdx]; useMemo(() => steps?.scene ? … : [], [steps])`. Với live-sim thêm kind từ `frame`: legend của live-sim lấy cố định `['request','response','cache-hit','retry','timeout','dropped','error']` lọc theo `spec`/những kind xuất hiện trong frame 5 s gần nhất | không còn cảnh báo "Rendered more hooks"; `npm run lint` không có `react-hooks/rules-of-hooks` ở file này |
| F4 — kiểu `PacketKind` | cập nhật `LegendDot`, `i18n.ts packets` (VI/EN) | `tsc -b` xanh |

### 3.8 Tương thích ngược tuyệt đối

Checklist code review cho M3 (reviewer Opus kiểm từng dòng):
1. Mọi code live nằm sau `if (frameSource)`/`stageMode==='live-sim'`; không thay đổi thứ tự, điều kiện hay giá trị mặc định của code cũ, **trừ** F1–F4 (có chứng minh bằng đo).
2. `ScaleStageSvgProps` mới đều tuỳ chọn; `ScaleWorkbenchLayoutProps.liveSimAdapter` tuỳ chọn.
3. Bước không có `liveSim`: không tạo pool, không rAF mới, không DOM thêm (kiểm bằng `document.querySelectorAll('.layer-live-ents, .layer-live-packets').length === 0`).
4. Không thêm phụ thuộc npm.
5. `memory-2d` và `code-trace` không bị ảnh hưởng (không import chung state).

---

## 4. `useSimClock` (`scale-workbench/live/useSimClock.ts`)

Đồng hồ **bước cố định (fixed-step accumulator)**: mô phỏng chạy theo thời gian *mô phỏng*, tách khỏi tốc độ khung hình.

```ts
export interface SimClockOptions {
  session: LiveSimSession | null;
  isPlaying: boolean;            // từ Layout (Space)
  speed: 1 | 2 | 5;
  maxCatchupTicks?: number;      // mặc định 8 tick/khung để tránh vòng đuổi theo không dứt (spiral of death) khi khung hình chậm
  onEnd?: () => void;            // t >= durationSec
}
export interface SimClock {
  t: number; // chỉ để đọc trong rAF (ref), không phải state
  setSpeed(s: 1|2|5): void; seek(t: number): void; step(): void; /* +1 tick khi tạm dừng */
}

export function useSimClock({ session, isPlaying, speed, maxCatchupTicks = 8, onEnd }: SimClockOptions) {
  const accRef = useRef(0);        // giây thực tích luỹ
  const lastRef = useRef(0);
  useEffect(() => {
    if (!session) return;
    let raf = 0;
    const DT = 0.1;
    const loop = (now: number) => {
      const dtReal = Math.min(0.1, (now - lastRef.current) / 1000);   // chặn khi tab bị treo
      lastRef.current = now;
      if (isPlaying) {
        accRef.current += dtReal * speed;
        let n = 0;
        while (accRef.current >= DT && n < maxCatchupTicks) {
          const t = session.getT();
          if (t >= session.durationSec) { onEnd?.(); accRef.current = 0; break; }
          session.advanceTo(t + DT);   // đúng 1 tick
          accRef.current -= DT; n++;
        }
        if (n === maxCatchupTicks) accRef.current = 0;   // bỏ phần dồn, không đuổi theo mãi
      }
      raf = requestAnimationFrame(loop);
    };
    lastRef.current = performance.now();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [session, isPlaying, speed, maxCatchupTicks, onEnd]);
}
```
- Tốc độ 5× = 50 tick/s: ≤ 1 ms/tick ⇒ ≤ 5% ngân sách khung 16,7 ms.
- Tab ẩn: `requestAnimationFrame` dừng ⇒ đồng hồ dừng (không "bù"). Đây là hành vi mong muốn.
- **Phím:** Space = `setIsPlaying(p=>!p)` (đã có, 462); R = `setReplayNonce+1` + `setIsPlaying(true)`; thêm effect trong Layout: khi `replayNonce` đổi và step là live-sim ⇒ `session.seek(startAtSec)`/`reset()`. `.` (dấu chấm) = +1 tick khi đang pause (chỉ khi stage live-sim) — *Chưa quyết:* có thêm phím này hay không (chỉ nếu không xung đột; mặc định không).
- **Seek:** `session.seek(t)` đặt `getT()` = t; ở quá khứ `isPlaying` vẫn chạy tiếp từ t (xem 04 §5.2: ghi đè tương lai chỉ xảy ra khi có `setInput`).
- **pauseAtSec:** nếu `spec.pauseAtSec` chứa mốc `p` và `getT()` vượt `p` lần đầu ⇒ clock gọi `onPause(p)` ⇒ Layout `setIsPlaying(false)` và hiện nhắc "Dự đoán: node nào sẽ đỏ trước?" (hoạt động `predict`, 06).

---

## 5. UI

### 5.1 Vị trí chèn trong `ScaleWorkbenchLayout.tsx` (số dòng tại 2026-11-26)

```
(≈1009-1051) Telemetry strip tĩnh ── live-sim: thay bằng <LiveTelemetryStrip/> (tự subscribe 5 Hz)
(≈1053-1129) Controls cạnh phải ─── thêm: <LoadKnob/> (trước nút Replay), nhóm <ChaosToolbox/> (popover)
(1133-1184)  Stage viewport:
               ternary hiện có: sandbox → isIsometricStage → isMemoryStage → codeTrace → null
               ► thêm nhánh `isLiveStage` TRƯỚC `isIsometricStage` (vì live-sim cũng có scene)
                 <LiveStage> = ScaleStageSvg(frameSource, pickMode…) + legend packet (1157-1164 clone)
                 + <RequestTracerDrawer/> (neo đáy stage) + <ChaosToolbox/> (neo góc trên phải stage, ẩn trên mobile → sheet)
(giữa 1184 và 1187)  ► <SimTimeline/>  (panel `dts-panel` riêng, giữa stage và stepper)
(1187)       Bottom stepper (không đổi)
Cột phải: narrative/callout/whatChanged/nav không đổi; ► <ActivityGate/> (06) chèn trước mục objectives/practice (~1423) khi step có activityId
```
`const isLiveStage = activeStep.stageMode === 'live-sim' && Boolean(activeStep.scene) && Boolean(activeStep.liveSim) && Boolean(liveSimAdapter);` — thiếu `liveSimAdapter` thì **rơi về hành vi isometric** (render `scene` tĩnh, không điều khiển), an toàn khi app cũ vô tình gặp step live-sim.

Sửa điều kiện nút: `(isIsometricStage || isMemoryStage)` → `(isIsometricStage || isMemoryStage || isLiveStage)` cho nút Replay; nút Play/Pause `isIsometricStage` → `|| isLiveStage`.

**Xung đột phím `←/→`:** listener ở 438 gọi `handleNextStep/PrevStep` cho mọi `←/→`. Thanh tua dùng `role="slider"`; sửa selector bỏ qua: `'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="slider"]'`, đồng thời slider tự xử lý `←/→` (±1 s), `Shift+←/→` (±10 s), `Home/End`.

Hook mới trong Layout (đặt **trước** return null để tuân thủ F3): `const [liveSession, setLiveSession] = useState<LiveSimSession|null>(null)` + effect mở/đóng session theo `activeStep` (sẽ guard bằng `activeStep?.stageMode==='live-sim'`).

### 5.2 `SimTimeline`

Mục tiêu: "video editor" — kéo để tua, thấy tải/độ trễ/lỗi theo thời gian, mốc sự kiện, đường SLO.

```
┌─ Timeline ────────────────────────────────────────────────────────────────┐
│ ⏮  ⏯  ⏭   [1×][2×][5×]   t = 34.2 s / 90 s                    ↺ về đầu    │
│ RPS  ▁▂▂▃▃▄▄▅▅▆▆▇▇██████████████████████▏                    3 000 rps    │
│ p99  ▁▁▁▁▁▁▁▁▁▁▂▂▂▃▃▃▄▄▇█████████▇▇▇▇▇ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ SLO 300 ms  2 140 ms │
│ ERR  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▂▃▅▆▇██                      34 %         │
│      0s        15s        ◆ 30s     │ 34s ▲      45s        60s        90s │
│      ◆ DB saturated   ✕ bạn: kill app2          ░░░░ chưa mô phỏng ░░░░░ │
└──────────────────────────────────────────────────────────────────────────┘
```
Thành phần:
- **Hàng điều khiển:** `⏮` (về `startAtSec`), `⏯` (đồng bộ `isPlaying`), `⏭` (nhảy tới mốc kế: `markers()` hoặc +10 s), nhóm tốc độ `1×/2×/5×` (Segmented pill, guidelines §4.3), đồng hồ `t / duration`, nút `↺`.
- **Sparkline** (3 hàng; thêm `Cost`, `Queue` ở bản rộng): mỗi hàng là 1 `<svg width=100% height=28 preserveAspectRatio=none>` + 1 `<path>`; dữ liệu từ `session.series(metric)`; **decimate min/max** về ≤ 300 điểm để giữ đỉnh nhọn; cập nhật `d` ở ~10 Hz trong rAF (đọc `series.length` thay đổi) — không dùng React state để tránh re-render; chấm tròn con trỏ `t` hiện tại và giá trị hiện tại bên phải. Đường SLO: `<line stroke-dasharray>` ở y tương ứng `spec.slo`; vùng vượt SLO tô đỏ nhạt (`<path>` thứ hai clip).
- **Trục & mốc:** đường dọc con trỏ; mốc sự kiện (`markers()`): `◆` sự kiện kịch bản, `✕/⚡` do người học tiêm, `▲` milestone; hover hiện tooltip, click `seek`. Vùng **chưa mô phỏng** (bên phải `getHeadT()`) hiển thị gạch chéo; kéo vào đó ⇒ `seek` bị chặn ở `headT` (hoặc tự chạy nhanh tới đó: *Chưa quyết*, mặc định chặn).
- **Kéo để tua:** `onPointerDown` + `setPointerCapture`; `t = clamp(x/width·durationSec, 0, headT)`; gộp thành 1 lệnh `seek` mỗi `requestAnimationFrame`. Trong lúc kéo: `isPlaying` tạm dừng, thả ra thì tiếp tục (nếu trước đó đang chạy). Hiển thị banner "Đang xem quá khứ — đổi tham số sẽ ghi đè phần sau t = …" khi `getT() < getHeadT()` và người học chạm vào núm (chỉ hiện khi có thay đổi sắp áp dụng, xác nhận 1 lần/phiên).
- **A11y:** vùng tua `role="slider" aria-valuemin=0 aria-valuemax={headT} aria-valuenow={t} aria-valuetext="34,2 giây"`, `tabIndex=0`.
- **Container queries:** bọc `@container/timeline`; `@[480px]`: ẩn nhãn tốc độ chữ, giữ icon; `@[620px]`: hiện hàng `Queue`; `@[960px]`: hiện `Cost` và nhãn mốc. Dưới 480 px chỉ giữ hàng `p99` + `ERR` và nút tua.

### 5.3 `LiveTelemetryStrip`

Thay `activeStep.telemetry.slice(0, 3)` (1009–1051) bằng thành phần **cùng kiểu thẻ** (`rounded-[9px] border … px-2.5 py-1`, thanh màu trái theo tone — tái dùng class của khối cũ) nhưng giá trị lấy từ `frameSource.subscribe(cb,{hz:5})`. Tối đa 4 KPI từ `spec.telemetry` (mặc định: `offeredRps` RPS, `p99` ms, `errorRate` %, `costPerHour` $/h). Tone theo `LiveMetricSpec.tone` và SLO. Chuỗi tĩnh `activeStep.telemetry` vẫn render khi chưa có frame đầu tiên (không nhảy layout). Cập nhật bằng `ref.textContent` (không setState) hoặc `useSyncExternalStore` với throttle 5 Hz; chọn `textContent` để chắc chắn không re-render cha.

### 5.4 `LoadKnob`

- Slider **logarit** multiplier `×0.1 … ×10` (mặc định ×1) + 4 nút nhanh `×0.5 ×1 ×2 ×5`; hiển thị "RPS hiện tại ≈ X" lấy từ `offeredRps`.
- Chọn **kiểu tải** (steady/ramp/spike/diurnal) — chỉ khi `spec.controls.load` có kèm profile cho phép (`LoadKnob` nhận `profiles?`): *Chưa quyết* hiển thị ở v1 hay chỉ multiplier; mặc định chỉ multiplier.
- Gọi `session.setLoadMultiplier(x)` (debounce 80 ms); ghi `InputRecord` ⇒ xuất hiện mốc `learner` trên timeline.
- `@container`: dưới 520 px thu thành popover (icon `Gauge`).

### 5.5 `ChaosToolbox`

Nút theo `spec.controls.chaos` (icon `lucide-react`, đề xuất: `Power` kill, `Hourglass` slow, `Unplug` partition, `Eraser` expire-cache, `Flame` hot-key, `Rocket` bad-deploy). Luồng: bấm công cụ ⇒ vào `pickMode` (stage hiện hướng dẫn "Chọn node/link mục tiêu — Esc để hủy") ⇒ click mục tiêu ⇒ `session.inject(kind, target, opts)`. Công cụ cần tham số (`slow`: `addMs` 50/200/1000; `hot-key`: share 30/60/90%) hiện popover nhỏ trước khi vào pick mode. Mỗi lần tiêm: mốc `✕` trên timeline + toast ngắn (`aria-live`). Trên màn hẹp thành bottom sheet.

Mục tiêu hợp lệ theo công cụ: `kill`/`slow`/`bad-deploy` → node có `replicas`; `partition` → link; `expire-cache` → node `cache`/`cdn`; `hot-key` → node `partitioned`/`cache`. Engine từ chối đích không hợp lệ (trả lỗi mềm) — UI chỉ làm nổi bật đích hợp lệ.

### 5.6 Panel tham số

`spec.controls.knobs` liệt kê `{node,key}`; panel (popover từ nút "Tham số", hoặc tab trong `liveSlot`) hiển thị từng `LiveKnobDescriptor` bằng slider/select/switch; thay đổi gọi `session.setKnob` (debounce 120 ms) và hiện **chi phí thay đổi** nếu step thuộc fix-challenge (06: `maxChanges`). Mọi knob đã đổi có nút "đặt lại giá trị gốc".

### 5.7 `RequestTracer` (waterfall)

Kích hoạt: bật `liveOptions.tracerEnabled` (có `spec.controls.tracer`), bấm một chấm (tự pause) hoặc nút "Theo dõi 1 request". `session.trace({packetId,linkId,kind})` trả `LiveTrace`, adapter gọi `traceRequest` của engine (04 §9.2): lấy mẫu có seed theo `packetId` từ phân phối độ trễ từng chặng, tôn trọng kind (bấm chấm `retry` ⇒ trace có chặng chờ retry; `timeout` ⇒ chặng bị cắt ở `timeoutMs`). Waterfall ghi rõ "request đại diện".
```
┌─ Request #4812 (retry) ─ tổng 1 320 ms ── ✔ thành công sau 2 lần thử ───────┐
│ client→lb      ▏▌                                    30 ms   mạng            │
│ lb             ▏ ▏                                    0.3    xử lý           │
│ lb→app2        ▏ ▏                                    0.5    mạng            │
│ app2           ▏  ▌▌▌                                 12     xử lý           │
│ cache          ▏     ▏                                 0.5    cache MISS      │
│ cache→db #1    ▏      ████████████████ 800 ms ✕ timeout                      │
│ chờ retry      ▏                        ░░ 0 ms (không backoff)               │
│ cache→db #2    ▏                         ████████ 480 ms  ✔                  │
└─────────────────────────────────────────────────────────────────────────────┘
```
Thanh dùng `<div>` rộng theo `%` (không cần thư viện); màu theo `kind` (mạng xám xanh, xử lý xanh lá, hàng đợi cam, timeout đỏ, chờ retry xám gạch). Hàng "chặng chiếm nhiều nhất" được tô nhẹ và có chú thích `← chặng chậm nhất (xx%)`. Đóng bằng `Esc` hoặc nút ×; không chặn click stage.

### 5.8 Legend packet

Legend hiện có (1157–1164, `legendKinds` + `LegendDot`) mở rộng thêm 3 chấm mới và nhãn `packetScale`: `● request  ● response  ● cache hit  ● retry  ◔ timeout  ↓ dropped  ■ error  — 1 chấm = N req/s`. Chỉ liệt kê kind xuất hiện trong 5 s gần nhất (tránh legend dài).

### 5.9 Container queries và layout (guidelines §4)

- Cột giữa dùng container `@container/stage`; các thanh ngang trong cột này dùng `@[520px]`, `@[620px]`, `@[960px]` thay vì `lg:`. `isCenterCompact` (243) đã có: tái dùng cho kích thước nút (h-7 vs h-8).
- Segmented pill nhóm điều khiển phát: `[⏮ ⏯ ⏭] [1× 2× 5×]` luôn nằm cùng hàng; các nút phụ (`Tham số`, `Chaos`, `Tracer`) ở góc phải, thu thành icon khi hẹp.
- Stage `min-h-[260px]`, timeline cao cố định 96–140 px (tuỳ số hàng) — không làm stage thấp hơn 260 px: nếu viewport thấp, ẩn hàng sparkline phụ trước, giữ hàng `p99`.
- Mobile (<768 px): thứ tự `Telemetry → Stage → Timeline (1 hàng p99 + thanh tua) → Stepper`; `LoadKnob`, `Chaos`, `Tham số`, `Tracer` vào **bottom sheet** mở từ thanh nút `⚙` (dùng cùng kiểu sheet của `StageInspectorPortal` mobile ở 532–642: `fixed`, `bottom: calc(env(safe-area-inset-bottom)+114px)`).

---

## 6. `liveSlot` & ràng buộc dữ liệu cho Inspector

- Nội dung inspector tĩnh (What/How/Why/Tips) vẫn tuân thủ guidelines §3: `NodeSpec` của sim có `inspector` gốc theo primitive (04 §1) và scene gắn `StageNode.inspector`.
- `liveSlot` **không** thay thế phần giải thích; chỉ thêm số liệu (nhãn "Số liệu trực tiếp").
- Cập nhật `liveSlot` ở 5 Hz; khi thẻ đóng thì huỷ subscribe.

---

## 7. Khoá i18n cần thêm (`src/components/scale-workbench/i18n.ts`)

Thêm nhóm `live` vào kiểu của `WORKBENCH_I18N[lang]` và cả hai ngôn ngữ (VI trước, EN song song vì UI song ngữ theo ràng buộc). Văn phong theo guidelines §5 (không ẩn dụ, không từ quân sự hoá).

```ts
live: {
  timeline: string; speed: string; playbackSpeed: (x: number) => string;
  time: (t: number, d: number) => string;
  backToStart: string; nextMarker: string; prevMarker: string;
  notSimulated: string;
  pastWarning: (t: number) => string;
  seekLabel: string;
  series: { rps: string; p99: string; errors: string; cost: string; queue: string };
  slo: (name: string, v: string) => string;
  markers: { scenario: string; learner: string; milestone: string; alert: string };
  telemetry: { rps: string; p99: string; error: string; cost: string; goodput: string };
  load: { title: string; multiplier: string; current: (rps: number) => string; quick: string };
  chaos: {
    title: string;
    kill: string; slow: string; partition: string; expireCache: string; hotKey: string; badDeploy: string;
    pickHint: string; pickCancel: string; injected: (what: string, target: string) => string;
    invalidTarget: string;
  };
  knobs: { title: string; reset: string; changes: (used: number, max: number) => string };
  tracer: {
    title: string; trace: string; total: (ms: number) => string;
    outcome: { ok: string; timeout: string; error: string; dropped: string };
    spans: { net: string; queue: string; service: string; retryWait: string; timeout: string };
    slowest: (pct: number) => string; retries: (n: number) => string; close: string;
  };
  inspector: { title: string; whyState: string; sparkline60s: string };
  states: { idle: string; healthy: string; busy: string; saturated: string; overloaded: string; down: string; recovering: string };
  badges: { DOWN: string; WARMING: string; COLD: string; LAG: (ms: number) => string; QUEUE: (n: string) => string;
            LIMIT: string; DEPLOY: string; BAD_DEPLOY: string; HOT: string; SLOW: string; PARTITION: string };
  packetScale: (n: number) => string;
  disclaimer: string;       // "Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối."
  announce: { stateChanged: (node: string, state: string) => string; sloBreached: string; sloRecovered: string };
  packets: { retry: string; timeout: string; dropped: string };   // legend, bổ sung Record<PacketKind,…>
};
```
Giá trị mẫu (VI / EN) cho các khoá quan trọng:

| Khoá | VI | EN |
|---|---|---|
| `states.saturated` | Gần quá tải | Saturated |
| `states.overloaded` | Quá tải | Overloaded |
| `states.recovering` | Đang khởi động lại | Recovering |
| `chaos.kill` | Dừng node | Stop node |
| `chaos.partition` | Cắt kết nối | Cut link |
| `chaos.expireCache` | Xoá toàn bộ cache | Expire all cache |
| `chaos.badDeploy` | Triển khai bản lỗi | Bad deploy |
| `chaos.pickHint` | Chọn node hoặc đường nối mục tiêu. Nhấn Esc để hủy. | Pick a target node or link. Press Esc to cancel. |
| `pastWarning(t)` | Đang xem quá khứ. Đổi tham số sẽ thay thế phần mô phỏng sau {t} giây. | Viewing the past. Changing a setting replaces the simulation after {t}s. |
| `notSimulated` | Chưa mô phỏng | Not simulated yet |
| `packets.retry` | gọi lại (retry) | retry |
| `packets.timeout` | quá thời gian chờ (timeout) | timed out |
| `packets.dropped` | bị loại bỏ (dropped) | dropped |
| `disclaimer` | Mô phỏng đúng xu hướng và độ lớn, không đúng số tuyệt đối. | The simulation shows the right trend and magnitude, not exact absolute numbers. |
| `tracer.outcome.timeout` | Quá thời gian chờ | Timed out |
| `announce.stateChanged` | {node} chuyển sang trạng thái {state} | {node} is now {state} |
| `inspector.whyState` | Vì sao có trạng thái này? | Why this state? |

Tên nhãn tránh mọi cách nói cường điệu ("sập", "chết thảm", "thảm họa"): dùng "Dừng node", "Quá tải", "Quá thời gian chờ". Doctor (07 §6) quét chuỗi cấm cho cả file i18n mới.

---

## 8. Hiệu năng, a11y, mobile

### 8.1 Hiệu năng (mục tiêu 60 fps)
- **Ngân sách mỗi khung 16,7 ms:** áp frame ≤ 2 ms (30 node × ~8 thuộc tính + 40 link + 200 chấm với LUT + dirty-check); sparkline ≤ 1 ms (cập nhật 10 Hz, không mỗi khung); engine ≤ 1 ms × số tick/khung (≤ 5 ở 5×).
- Không re-render `ScaleWorkbenchLayout` mỗi tick: kiểm bằng React Profiler (commit ≤ 1/s khi chạy không tương tác). Mọi component live tự subscribe và cập nhật DOM bằng ref/`textContent`/`setAttribute`.
- Chấm: tối đa 200 (`liveOptions.maxPackets`); màn hẹp (<640 px) 80, engine chọn lại `packetScale`. Dùng `display` thay vì tạo/xoá phần tử.
- Overlay chỉ dựng cho node có trong `scene`; `mix-blend-mode` chỉ ở `tint`, và tắt khi `liveOptions.lowFx` (tự bật nếu 30 khung liên tiếp > 24 ms).
- Không `getBBox`/`getBoundingClientRect` trong rAF; LUT link dựng ngoài vòng.
- Khi `document.hidden` hoặc stage không hiển thị (IntersectionObserver ngoài khung nhìn): tạm dừng rAF của stage và clock.

### 8.2 Accessibility
- **`prefers-reduced-motion: reduce`** (hoặc `liveOptions.reducedMotion`): tắt rung node, tắt nhấp nháy viền, **không vẽ chấm bay**; thay bằng độ dày link + nhãn `rps` + thanh tải + queue pile (tĩnh, đổi tức thì không tween). Clock vẫn chạy; sparkline cập nhật chậm hơn (2 Hz).
- Không dựa vào màu đơn thuần: mỗi state có **biểu tượng/chữ** trong badge (✕, ⚠, ⏳, `DOWN`, `QUEUE 1.2k`); thanh tải luôn có số `%`.
- `aria-live="polite"` vùng ẩn thông báo chuyển trạng thái quan trọng (`overloaded`, `down`, SLO vi phạm/hồi phục), **throttle ≥ 3 s** giữa hai thông báo, tối đa 1 thông báo/node/10 s.
- Bàn phím: node live có `tabIndex=0 role="button" aria-label="{tên}, {trạng thái}, tải {x}%"` (chỉ khi `frameSource`), Enter mở inspector; chaos toolbox truy cập được bằng Tab, chọn đích bằng Tab + Enter khi ở pick mode; thanh tua role slider (§5.2).
- Tương phản: màu tint có biên (`stroke`) giữ độ tương phản ≥ 3:1 với nền light/dark (kiểm bằng cả hai theme).

### 8.3 Mobile
- Pointer events đã dùng ở stage (pan/pinch có sẵn); `data-no-pan="true"` cho timeline và các popover để không kéo stage.
- Chạm 44×44 px cho nút tốc độ, chaos; thanh tua cao ≥ 32 px vùng chạm.
- `SimTimeline` 1 hàng; sheet cho điều khiển phụ (§5.9). Chaos cần "pick mode" trên màn cảm ứng: chạm node, hiện thanh xác nhận "Dừng node DB? [Xác nhận] [Hủy]".

---

## 9. Kế hoạch kiểm thử hồi quy cho 5 app cũ

### 9.1 Bài cụ thể cần mở kiểm tra (sau mỗi task chạm `scale-workbench/*`)

| App | Bài | Vì sao chọn | Cần để ý |
|---|---|---|---|
| Redis Mastery | `R10-stampede-penetration-avalanche` | isometric, nhiều packet, `cache-hit`, node `dead`/heat | packet tốc độ đúng; `dead` vẫn vẽ X; morph giữa bước |
| Redis Mastery | `R14-replication-and-sentinel-ha` | failover: node chết, link `cut`/`heartbeat` | hoạt cảnh link đổi kiểu, badge `DOWN` |
| Redis Mastery | `R15-redis-cluster-sharding` | nhiều node, `composeIsometricLayout` đa nhánh | không đổi layout |
| K8s (Kube) | `K09-deployments-rolling-updates` | nhiều step có node vào/ra | enter (680 ms, nảy `easeOutBack`), move (760 ms), exit (380 ms) |
| K8s (Kube) | `K10-services-and-dns` | link nhiều cổng NE/SE/SW/NW, zone slab | cổng cạnh isometric đúng |
| CI/CD | `C08-dag-sharding-fast-pipeline` | DAG, fan-out/fan-in | bố cục Echelon, không xếp ngang |
| CI/CD | `C14-zero-downtime-canary-rollback` | node `dead`, note card | thẻ ghi chú góc sân khấu |
| PMP | `P00-orientation` (bước RECAP dạng `code-trace`) và `P04-development-approaches` | PMP dùng nhiều `code-trace` và `memory-2d` | không ảnh hưởng chế độ không phải isometric |
| Python | `M22` (asyncio & Event Loop, isometric), `M08` (đệ quy, `memory-2d` tree), `M01` (code-trace) | 3 chế độ stage | Python có 3 mode; `MemoryStageSvg` không đổi |

(Id lấy từ `content/<app>/modules/*` và `src/data/workpath/curriculum.json` tại 2026-11-26; nếu id đổi, chọn bài cùng đặc điểm.)

### 9.2 Danh mục kiểm thủ công (mỗi bài trên)
1. **Enter:** tải bài lần đầu — khối rơi nảy từ sau ra trước, bóng đậm dần, link vẽ **sau khi 2 đầu chạm sàn**, rồi pill, rồi chấm.
2. **Morph:** chuyển `Step n → n+1` — khối giữ id trượt (760 ms), khối bỏ bay lên mờ dần (380 ms), khối mới rơi; link co giãn theo.
3. **Replay (R)** và nút *Chạy lại*: camera về mặc định, hoạt cảnh chạy lại.
4. **Packet:** đo tốc độ — dùng DEV hook tạm: `data-packet-elapsed={packetElapsedRef.current.toFixed(2)}` trên `<svg>` (chỉ `import.meta.env.DEV`); ghi `Δelapsed/Δt` trong 5 s khi `isPlaying` với step có packet. **Trước** sửa (checkout `7bf4997`): kỳ vọng ≈ 2,0 (P6); **sau** F1: ≈ 1,0 (±5%). Ghi 2 số vào PR.
5. **Pause/Play (Space):** packet đóng băng/tiếp tục từ vị trí cũ; không "nhảy".
6. **Hover/click** node, link, pill: tooltip và Inspector (4 mục) như cũ; `Esc` đóng; inspector **không** tự đóng khi không đổi step.
7. **Zoom/pan:** `−`/`+`, kéo, pinch, bấm số `%` để reset; đổi step vẫn reset camera như cũ (scene thường).
8. **Dark/light**, đổi ngôn ngữ VI/EN: màu và chữ đúng.
9. **Hẹp cửa sổ** (750–950 px, <620 px): container query, nút icon-only, không tràn.
10. **Console:** không cảnh báo React (`Rendered more hooks…` hết sau F3), không lỗi mới.
11. `legendKinds` mở bài từ trạng thái "đang tải" (lessons rỗng → có): không crash.
12. Bài **không** isometric (`memory-2d`, `code-trace`) hoạt động như cũ.

### 9.3 Kiểm tự động (khả thi ngay)
- `npm run build` (tsc -b + vite build) và `npm run lint` xanh.
- `npm run course:build && npm run course:doctor && npm run course:test` và `npm run pmp:doctor` xanh (không đụng nội dung nhưng chạm builder).
- *Chưa quyết:* thêm e2e (repo hiện **chưa có** Playwright/vitest trong `package.json`). Tối thiểu thêm test thuần cho các hàm không-DOM của live (decimate sparkline, `useSimClock` accumulator tách thành hàm thuần `stepAccumulator(acc, dtReal, speed, DT, maxCatchup)`, LUT nội suy, quy đổi `loadPct`→màu) vào `scripts/run-sysdesign-tests.mjs` (entry thứ hai).

### 9.4 Kiểm thử bài live-sim (S1-03, M5)
1. Mở bài, bước live-sim (`S1-03/ramp`, 04 §10): chạy 1×: DB vàng (`busy`) từ t≈24 s, cam (`saturated`) từ t≈31 s, đỏ (`overloaded`) trong khoảng t≈35–41 s; queue pile dày dần, chấm đỏ rơi; tầng app chuyển vàng từ t≈45 s, cam khoảng t≈58 s và không quá tải (`expect.appFirstSaturatedAtSec`).
2. Timeline: sparkline p99 vọt sau t≈35 s; kéo tua về t=10 → trạng thái trở lại xanh; đổi núm `cache.capacityKeys` ở t=10 → banner ghi đè; phần sau được tính lại và DB không còn đỏ ở cùng thời điểm.
3. Chaos: `Dừng node` app2 → LB chuyển tải sau ~3 s (RR vẫn gửi nhầm trong thời gian phát hiện), ✕ hiển thị.
4. Tracer: bấm chấm `retry` → waterfall có chặng timeout 800 ms.
5. 60 fps với ~200 chấm: DevTools Performance — khung ≤ 16,7 ms ở 5×.
6. Reduced motion: bật cài đặt OS → không chấm bay, trạng thái vẫn đọc được.
7. Đổi step đi/về: session đóng/mở sạch, không rò rAF (Memory/Performance: số rAF không tăng).

---

## 10. Phân rã task M3 (đồng bộ với PLAN, chi tiết hoá)

| Task | File chạm | Phụ thuộc |
|---|---|---|
| T3.1 types + F3 + F4 | `scale-workbench/types.ts` (`StageRenderMode`, `PacketKind`, `Live*`, `LiveSimSpec`, `ScaleLessonStep.liveSim/activityId/activityGate`, `ScaleModuleLesson.attribution`), `i18n.ts` (packets), `ScaleWorkbenchLayout.tsx` (`LegendDot`, đưa `legendKinds` lên trước `return null`) | M2 T2.1 (kiểu `SimFrame`) |
| T3.2 `useSimClock` + hàm thuần accumulator | `scale-workbench/live/useSimClock.ts` (mới) | T3.1 |
| T3.3 `ScaleStageSvg` | frame loop, overlay, pool, LUT, link overlay, structureKey, `renderLiveSlot`/`pickMode` props; **F1, F2** | T3.1 |
| T3.4 `SimTimeline`, `LiveTelemetryStrip` | `scale-workbench/live/*.tsx` (mới) | T3.2 |
| T3.5 `LoadKnob`, `ChaosToolbox`, `KnobPanel`, `RequestTracer`, `NodeLivePanel`; prop `liveSlot` ở `StageEntityInspectorCard`/`StageInspectorPortal` | `scale-workbench/live/*.tsx`, `StageEntityInspector.tsx`, `sysdesign-course/live/NodeLivePanel.tsx` | T3.3, T3.4 |
| T3.6 Layout + adapter | nhánh `live-sim`, selector phím, điều kiện nút, prop `liveSimAdapter`, render `attribution` cuối cột phải; `sysdesign-course/live/liveSimAdapter.ts`; `sdLessonBuilder` điền `liveSim`, `activityId`, `attribution` | T3.3–T3.5 |
| T3.7 hồi quy | §9 | tất cả |

Thứ tự commit: (1) T3.1 = F3 + F4 + types (không đổi hành vi); (2) F1/F2 trong T3.3 tách commit riêng để dễ revert nếu hồi quy; (3) phần tính năng live-sim.

---

## 11. Chưa quyết (tổng hợp)

| # | Vấn đề | Mặc định đề xuất | Chốt ở |
|---|---|---|---|
| 1 | Giữ session khi quay lại step trước | Không; mở lại từ `startAtSec` | T3.6 |
| 2 | Kéo timeline vào vùng chưa mô phỏng | Chặn ở `headT` | T3.4 |
| 3 | Phím `.` bước 1 tick khi pause | Không thêm ở v1 | T3.2 |
| 4 | Đổi kiểu `LoadProfile` trong `LoadKnob` | Chỉ multiplier ở v1 | T3.5 |
| 5 | e2e tự động cho stage | Chưa có hạ tầng; cân nhắc Playwright ở M8 | M8 |
| 6 | Chạy engine trong Web Worker | Quyết sau bench (04 §9.3) | T3.7 |
| 7 | Cách vẽ `tint` trên theme tối (screen vs overlay) | Thử cả hai ở T3.3, chọn theo ảnh chụp, ghi vào DECISIONS | T3.3 |
