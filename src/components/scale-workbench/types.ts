import type { WorkbenchLang } from '@/stores/useWorkbenchStore';

export interface BilingualText {
  vi: string;
  en: string;
}

export function pickText(text: BilingualText | string, lang: WorkbenchLang): string {
  if (typeof text === 'string') return text;
  return lang === 'en' ? text.en : text.vi;
}

export type StepCategory =
  | 'SETUP'
  | 'PROBLEM'
  | 'TECHNIQUE'
  | 'MECHANISM'
  | 'PITFALL'
  | 'REAL_CODE'
  | 'RECAP';

export type CalloutKind =
  | 'key-idea'
  | 'watch-out'
  | 'good-to-know'
  | 'compare'
  | 'technique';

export type IsoNodeShape =
  | 'block'
  | 'db'
  | 'device'
  | 'crowd';

/** Legacy aliases mapped cleanly onto authentic 2.5D shapes */
export type LegacyNodeShape =
  | IsoNodeShape
  | 'hex'
  | 'box'
  | 'cylinder'
  | 'laptop'
  | 'tape'
  | 'stack'
  | 'gate';

export type IsoTone =
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'yellow'
  | 'rose'
  | 'neutral';

export type StageIconKind =
  | 'cpu'
  | 'code'
  | 'db'
  | 'zap'
  | 'hash'
  | 'layers'
  | 'shield'
  | 'git'
  | 'globe'
  | 'terminal'
  | 'sparkles'
  | 'filter'
  | 'clock'
  | 'alert'
  | 'box';

export type IsoPortDir = 'NE' | 'SE' | 'SW' | 'NW';

/**
 * Rich educational explanation shown on Hover (summary) & Click (full inspector drawer)
 * for any block, database, connector line, badge tag, or memory element on the stage.
 */
export interface StageInspectorInfo {
  title: BilingualText;
  kindLabel: BilingualText;
  /** Plain-language 1-2 sentence definition ("Là gì?") */
  what: BilingualText;
  /** Operational mechanics ("Hoạt động như thế nào?") */
  how: BilingualText;
  /** Architectural rationale ("Tại sao lại cần / tại sao lại thế?") */
  why: BilingualText;
  /** Practical tip, common pitfall, or real-world case study */
  tipOrCase?: BilingualText;
  codeExample?: string;
}

export interface StageNode {
  id: string;
  shape: LegacyNodeShape;
  tone: IsoTone;
  x: number;
  y: number;
  label: BilingualText;
  sublabel?: BilingualText;
  icon?: StageIconKind;
  loadPct?: number;
  badge?: {
    text: BilingualText;
    tone?: 'default' | 'ok' | 'warn' | 'bad';
  };
  /** Optional rich inspector documentation when user hovers/clicks this block or its tag */
  inspector?: StageInspectorInfo;
  tapeCells?: string[];
  activeIndices?: number[];
  showNegativeIndices?: boolean;
  stackFrames?: string[];
  dimmed?: boolean;
  highlighted?: boolean;
  /** Crashed / unreachable / failed state (renders stone-gray body + red X + DOWN badge) */
  dead?: boolean;
}

export interface StageLink {
  id: string;
  from: string;
  to: string;
  /** Optional explicit exit/entry isometric wall ports ('NE' | 'SE' | 'SW' | 'NW') */
  fromPort?: IsoPortDir;
  toPort?: IsoPortDir;
  style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
  label?: BilingualText;
  curve?: number;
  /** Optional rich inspector documentation when user hovers/clicks this connector or its tag */
  inspector?: StageInspectorInfo;
}

export type PacketKind =
  | 'request'
  | 'response'
  | 'pointer'
  | 'mutation'
  | 'cache-hit'
  | 'error'
  | 'retry'
  | 'timeout'
  | 'dropped';

export interface StagePacket {
  id: string;
  linkId: string;
  kind: PacketKind;
  speed?: number;
  offset?: number;
  reverse?: boolean;
  /** Nếu true: hạt đi hết chiều xuôi sẽ tự đảo chiều quay về với màu response (#9fd28f) và tỏa vòng sóng fx--ok */
  bounce?: boolean;
  /** Thời gian (giây) hạt dừng chờ và nhấp nháy viền (.pkt--held) tại cổng đích trước khi quay về hoặc kết thúc */
  holdSec?: number;
  /** Hiệu ứng chạm đích ở cuối chặng: 'ok' = vòng sóng xanh lá mở rộng; 'fail' = nổ vòng tròn đỏ có dấu X trắng */
  arrivalFx?: 'ok' | 'fail' | 'none';
  /** Biến thể hình dáng & vận tốc theo chuẩn Designed-to-Scale */
  variant?: 'default' | 'slow' | 'heavy' | 'msg' | 'poison' | 'ping' | 'kill';
  /** Thời điểm (giây tính từ lúc vẽ xong dây) hạt bắt đầu xuất phát lần đầu tiên để tạo hành trình nối tiếp qua từng chặng */
  startDelaySec?: number;
  /** Tổng chu kỳ lặp lại (giây) của một hành trình đa chặng; trong khoảng sau khi hoàn tất chặng này tới hết periodSec hạt sẽ ẩn để nhường cho các chặng kế tiếp */
  periodSec?: number;
}

export interface StageZoneSlab {
  id: string;
  /** Optional member node IDs to automatically wrap in a rounded dashed 2:1 isometric floor boundary */
  nodeIds?: string[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  label: BilingualText;
  tone?: IsoTone;
}

export interface StageNoteLine {
  text: BilingualText;
  tone?: 'plain' | 'muted' | 'good' | 'bad' | 'amber';
}

export interface StageNoteChart {
  /** Mức sử dụng 0..100 hiển thị trên đường cong độ trễ theo mức bận (hockey-stick) */
  utilPct: number;
  xLabel?: BilingualText;
  yLabel?: BilingualText;
}

export interface StageNoteCard {
  id?: string;
  title: BilingualText;
  lines: StageNoteLine[];
  chart?: StageNoteChart;
  position?: 'top-left' | 'bottom-left' | 'bottom-right';
}

export interface StageScene {
  zones?: StageZoneSlab[];
  noteCard?: StageNoteCard;
  nodes: StageNode[];
  links: StageLink[];
  packets: StagePacket[];
}

/* ============================================================================
 * MODE 2: CLEAN 2D MEMORY, SLICE, HASH & CALL-TREE VISUALIZER ('memory-2d')
 * ============================================================================ */

export interface MemoryTapeVisual {
  kind: 'tape';
  title: BilingualText;
  subtitle?: BilingualText;
  cells: string[];
  activeIndices?: number[];
  showNegativeIndices?: boolean;
  pointers?: Array<{
    index: number;
    label: string;
    tone?: IsoTone;
  }>;
  outputPill?: {
    label: BilingualText;
    value: BilingualText;
    tone?: IsoTone;
  };
}

export interface MemoryRefsVisual {
  kind: 'refs';
  leftTitle: BilingualText;
  rightTitle: BilingualText;
  names: Array<{
    id: string;
    name: string;
    note?: BilingualText;
    targetId: string;
    style?: 'solid' | 'danger' | 'dashed';
  }>;
  objects: Array<{
    id: string;
    typeTag: string;
    value: string;
    fields?: string[];
    tone: IsoTone;
    badge?: BilingualText;
  }>;
}

export interface MemoryTreeVisual {
  kind: 'tree';
  title: BilingualText;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
    sub?: BilingualText;
    tone: IsoTone;
    pruned?: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed' | 'danger';
  }>;
}

export type MemoryScene =
  | MemoryTapeVisual
  | MemoryRefsVisual
  | MemoryTreeVisual;

/* ============================================================================
 * MODE 3: NO-DIAGRAM INTERACTIVE CODE & EXECUTION TRACE STAGE ('code-trace')
 * ============================================================================ */

export interface TraceRowItem {
  step: string;
  expr: BilingualText | string;
  result: BilingualText | string;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}

export interface CodeTraceScene {
  badge: BilingualText;
  code: string;
  traceTitle: BilingualText;
  rows: TraceRowItem[];
}

export type StageRenderMode = 'isometric' | 'memory-2d' | 'code-trace' | 'live-sim';

export interface StageTelemetryItem {
  label: BilingualText;
  value: BilingualText;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}

export interface StepDiffItem {
  op: '+' | '-' | '~';
  text: BilingualText;
}

export interface ScaleLessonStep {
  index: number;
  shortLabel: BilingualText;
  category: StepCategory;
  title: BilingualText;
  summaryVi: string;
  summaryEn: string;
  rawMarkdownVi?: string;
  codeSnippet?: string;
  callout?: {
    kind: CalloutKind;
    title?: BilingualText;
    text: BilingualText;
  };
  whatChanged: StepDiffItem[];
  telemetry: StageTelemetryItem[];
  /** Pedagogical visual mode chosen for this lesson/step */
  stageMode: StageRenderMode;
  scene?: StageScene;
  memoryScene?: MemoryScene;
  codeTrace?: CodeTraceScene;
  /** live-sim: cấu hình mô phỏng trực tiếp (stageMode 'live-sim' cần scene + liveSim). */
  liveSim?: LiveSimSpec;
  /** id hoạt động gắn vào step; workbench chỉ hiển thị cổng, không hiểu nội dung. */
  activityId?: string;
  activityGate?: 'required' | 'optional';
}

export interface ScaleModuleLesson {
  moduleId: string;
  level: number;
  levelTitle: BilingualText;
  orderInLevel: number;
  totalInLevel: number;
  title: BilingualText;
  subtitle: BilingualText;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Primary pedagogical presentation mode of this lesson */
  primaryMode: StageRenderMode;
  objectives: BilingualText[];
  steps: ScaleLessonStep[];
  quizCount: number;
  exerciseCount: number;
  cardCount: number;
  readingCount: number;
  /** Dòng nguồn/ghi công cuối cột phải; không có thì không render gì. */
  attribution?: { text: BilingualText; href?: string; sourceTitle?: BilingualText };
  /** Tab "Câu chuyện & Tư duy giải quyết vấn đề" (Story & Problem-Solving Mindset) ở cột phải. */
  story?: BilingualText;
}

/* ============================================================================
 * LIVE-SIM: kiểu dữ liệu tối thiểu mà workbench hiểu (không import feature).
 * Feature (sysdesign-course) chuyển SimFrame của engine thành LiveSimFrame.
 * ============================================================================ */

export type LiveNodeState =
  | 'idle'
  | 'healthy'
  | 'busy'
  | 'saturated'
  | 'overloaded'
  | 'down'
  | 'recovering';

export interface LiveNodeFrame {
  state: LiveNodeState;
  /** 0..100, thanh tải */
  loadPct: number;
  /** 0..1, chiều cao "queue pile" */
  queuePct: number;
  /** số lượng thật (tooltip) */
  queue?: number;
  badge?: { text: BilingualText; tone: 'default' | 'ok' | 'warn' | 'bad' };
  /** 0..1 vòng warming */
  warm?: number;
  lagMs?: number;
  hitPct?: number;
  metrics?: Record<string, number>;
}

export interface LiveLinkFrame {
  rps: number;
  throughput: number;
  /** 0..1 */
  errorRate: number;
  style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
  breaker?: 'closed' | 'open' | 'half-open';
  lagMs?: number;
}

export interface LivePacket {
  id: number;
  linkId: string;
  kind: PacketKind;
  reverse: boolean;
  /** 0..1 tại thời điểm frame */
  progress: number;
  /** 0..1: mờ/rơi tại tiến độ này */
  fate?: number;
}

export interface LiveSimFrame {
  tick: number;
  /** giây mô phỏng */
  t: number;
  nodes: Record<string, LiveNodeFrame>;
  links: Record<string, LiveLinkFrame>;
  packets: LivePacket[];
  /** "1 chấm = N req/s" */
  packetScale: number;
  metrics: Record<string, number>;
}

export interface LiveSimSource {
  /** Frame mới nhất (tham chiếu ổn định, không clone). null trước khi sẵn sàng. */
  getFrame(): LiveSimFrame | null;
  /** Subscribe tần số thấp cho UI React. Trả hàm huỷ. hz mặc định 10. */
  subscribe(cb: (f: LiveSimFrame) => void, opts?: { hz?: number }): () => void;
}

export type LiveChaosKind =
  | 'kill'
  | 'slow'
  | 'partition'
  | 'expire-cache'
  | 'hot-key'
  | 'bad-deploy';

export interface LiveMetricSpec {
  metric: string;
  label: BilingualText;
  format: 'rps' | 'ms' | 'pct' | 'usd-hour' | 'count';
  tone?: { warnAbove?: number; badAbove?: number; warnBelow?: number; badBelow?: number };
}

export interface LiveSimSpec {
  simId: string;
  startAtSec?: number;
  autoplay?: boolean;
  speed?: 1 | 2 | 5;
  controls: {
    timeline?: boolean;
    load?: boolean;
    chaos?: LiveChaosKind[];
    knobs?: { node: string; key: string }[];
    tracer?: boolean;
  };
  telemetry?: LiveMetricSpec[];
  slo?: { metric: 'p99' | 'errorRate'; value: number; unit?: string }[];
  pauseAtSec?: number[];
  focus?: { nodes?: string[]; links?: string[] };
}

export interface LiveKnobDescriptor {
  node: string;
  key: string;
  label: BilingualText;
  type: 'number' | 'select' | 'bool';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: BilingualText }[];
  value: number | string | boolean;
  defaultValue?: number | string | boolean;
  changeCost?: number;
}

export interface LiveMarker {
  t: number;
  kind: 'event' | 'learner' | 'milestone' | 'alert';
  label: BilingualText;
  nodeId?: string;
}

export interface LiveSeries {
  /** các cột cùng độ dài */
  t: Float32Array;
  v: Float32Array;
  length: number;
}

export interface LiveTraceSpan {
  id: string;
  nodeId?: string;
  linkId?: string;
  kind: 'net' | 'queue' | 'service' | 'retry-wait' | 'timeout';
  label: BilingualText;
  startMs: number;
  durMs: number;
  ok: boolean;
  isSlowest?: boolean;
  slowestSharePct?: number;
}

export interface LiveTrace {
  packetId?: number;
  packetKind?: PacketKind;
  totalMs: number;
  attempts?: number;
  outcome: 'ok' | 'timeout' | 'error' | 'dropped';
  spans: LiveTraceSpan[];
  note?: BilingualText;
}

export interface LiveSimSession {
  readonly source: LiveSimSource;
  readonly durationSec: number;
  /** Tiến mô phỏng tới t giây (bước cố định 100 ms). Trả số tick đã chạy. */
  advanceTo(tSec: number): number;
  /** Vị trí hiện tại (giây) */
  getT(): number;
  /** Mép phải đã mô phỏng (giây) */
  getHeadT(): number;
  /** Scrub về tSec */
  seek(tSec: number): void;
  reset(): void;
  getLoadMultiplier?(): number;
  setLoadMultiplier(x: number): void;
  setKnob(node: string, key: string, value: number | string | boolean): void;
  resetKnob?(node: string, key: string): void;
  inject(
    kind: LiveChaosKind,
    target: { node?: string; link?: string },
    opts?: { addMs?: number; share?: number }
  ): void;
  knobs(): LiveKnobDescriptor[];
  series(metric: string): LiveSeries;
  nodeSeries?(nodeId: string, field: 'rho' | 'p99' | 'queue' | 'lambda'): LiveSeries;
  markers(): LiveMarker[];
  trace(hint?: { packetId?: number; linkId?: string; kind?: PacketKind }): LiveTrace | null;
  dispose(): void;
}

export interface LiveSimAdapter {
  open(
    spec: LiveSimSpec,
    ctx: { lang: WorkbenchLang; moduleId: string; stepIndex: number }
  ): LiveSimSession | null;
  renderNodeLiveSlot?: (
    session: LiveSimSession,
    spec: LiveSimSpec,
    entity: { kind: 'node' | 'link'; id: string },
    lang: WorkbenchLang
  ) => React.ReactNode;
}

