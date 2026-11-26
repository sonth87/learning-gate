/**
 * Kiểu đầu vào thay đổi, trạng thái và frame (04 §1). Kiểu model/scenario nằm ở `model.ts`
 * và được re-export ở đây để người dùng chỉ cần import từ `types`.
 */
import type {
  KnobValue, LinkId, LinkSpec, LoadProfile, NodeId, TimedEvent,
} from './model';

export type {
  BreakerPolicy, FailureMode, FailureModeKind, Knob, KnobValue, LinkId, LinkSpec, LoadProfile,
  NetClass, NodeId, NodeSpec, PrimitiveKind, RetryPolicy, RouteMode, SimOptions, SimScenario,
  SystemModel, TimedEvent,
} from './model';

// ───────────── inputs: những gì người học chỉnh khi đang chạy ─────────────
export type InputChange =
  | { type: 'load'; multiplier: number }
  | { type: 'load-profile'; profile: LoadProfile }
  | { type: 'knob'; node: NodeId; key: string; value: KnobValue }
  | { type: 'link'; link: LinkId; patch: Partial<Pick<LinkSpec,
      'timeoutMs' | 'retry' | 'breaker' | 'weight' | 'fallback'>> }
  | { type: 'event'; event: DistributiveOmit<TimedEvent, 'at'> };

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export interface InputRecord { tick: number; change: InputChange }

export interface SimInputs {
  loadMultiplier: number;
  loadProfileOverride?: { profile: LoadProfile; fromTick: number };
  params: Record<NodeId, Record<string, KnobValue>>;
  links: Record<LinkId, Partial<LinkSpec>>;
}

// ───────────── state & frame ─────────────
export type NodeState =
  | 'idle' | 'healthy' | 'busy' | 'saturated' | 'overloaded' | 'down' | 'recovering';

export type BreakerState = 'closed' | 'open' | 'half-open';

export type BadgeCode =
  | 'DOWN' | 'WARMING' | 'COLD' | 'LAG' | 'QUEUE' | 'LIMIT' | 'DEPLOY' | 'BAD_DEPLOY' | 'HOT' | 'SLOW' | 'PARTITION';

export interface LatencySummary { mean: number; p50: number; p95: number; p99: number }

export interface ErrorBreakdown {
  timeout: number; dropped: number; limited: number; down: number; fault: number; breaker: number;
}

export interface NodeFrame {
  state: NodeState;
  loadPct: number;
  rho: number;
  lambda: number;
  served: number;
  queue: number;
  queuePct: number;
  queueWaitMs: number;
  inflight: number;
  latency: LatencySummary;
  subtreeLatency: LatencySummary;
  errorRate: number;
  /** rps bị loại cục bộ (mở rộng so với 04 §1: phục vụ test bảo toàn dòng I2) */
  dropped: number;
  limited: number;
  /** rps bị từ chối vì node chết/không còn backend */
  rejectedDown: number;
  badge?: { code: BadgeCode; value?: number; tone: 'default' | 'ok' | 'warn' | 'bad' };
  warm?: number;
  hitRatio?: number;
  lagMs?: number;
  staleReadPct?: number;
  tokens?: number;
  backlog?: number;
  backlogAgeSec?: number;
  hotShare?: number;
  replicasUp?: number;
}

export interface LinkFrame {
  rps: number;
  retryRps: number;
  throughput: number;
  errorRate: number;
  timeoutRate: number;
  latencyMs: number;
  breaker?: BreakerState;
  style: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
}

export type SimPacketKind =
  | 'request' | 'response' | 'cache-hit' | 'retry' | 'timeout' | 'dropped' | 'error';

export interface SimPacket {
  id: number;
  linkId: LinkId;
  kind: SimPacketKind;
  reverse: boolean;
  progress: number;
  fate?: number;
}

export interface GlobalMetrics {
  offeredRps: number;
  goodputRps: number;
  errorRate: number;
  errors: ErrorBreakdown;
  latency: LatencySummary;
  retryRps: number;
  amplification: number;
  queueTotal: number;
  inflight: number;
  costPerHour: number;
  costCumUsd: number;
}

export interface SimFrame {
  tick: number;
  t: number;
  nodes: Record<NodeId, NodeFrame>;
  links: Record<LinkId, LinkFrame>;
  packets: SimPacket[];
  packetScale: number;
  metrics: GlobalMetrics;
  firedEvents: { type: TimedEvent['type']; node?: NodeId; link?: LinkId; source: 'scenario' | 'learner' }[];
}

// ───────────── SimState: chỉ số/mảng/object thuần ─────────────
export interface NodeRuntime {
  up: boolean;
  downSinceTick?: number;
  recoveringUntilTick?: number;
  warmProgress: number;
  queue: number;
  rhoPrev: number;
  stateHoldTicks: number;
  stateShown: NodeState;
  slowAddMs: number; slowUntilTick?: number;
  hotShare: number; hotUntilTick?: number;
  deploy?: { startTick: number; endTick: number; bad: boolean; version: string };
  faultErrorRate: number;
  cacheWarm: number; cacheCohort: number; cacheNextExpiryTick?: number;
  lagBacklogWrites: number;
  tokens: number;
  lbWeights: Record<LinkId, number>;
  lbKnownDown: Record<LinkId, number>;
}

export interface LinkRuntime {
  partitioned: boolean;
  retryRing: number[][];
  retryBudgetTokens: number;
  /** hệ số β∈[0,1]: phần retry được ngân sách cho phép ở tick trước */
  retryBeta: number;
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
  packetAcc: Record<LinkId, number>;
  inflightPackets: SimPacket[];
  packetScale: number;
  firedEventIdx: number;
}
