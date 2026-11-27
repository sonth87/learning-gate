/**
 * Mô hình hệ thống + kịch bản (04 §1) và `validate`/`compile` (04 §2.0).
 * Thuần TypeScript: không React/DOM/Math.random/Date.
 */

export type NodeId = string;
export type LinkId = string;

export type PrimitiveKind =
  | 'client' | 'dns' | 'cdn' | 'lb' | 'gateway' | 'service'
  | 'cache' | 'sql' | 'nosql' | 'queue' | 'log' | 'worker'
  | 'blob' | 'search' | 'rate-limiter' | 'coordinator';

export type KnobValue = number | string | boolean;

export interface Knob {
  key: string;
  type: 'number' | 'select' | 'bool';
  label: { vi: string; en: string };
  min?: number; max?: number; step?: number;
  options?: { value: string; label: { vi: string; en: string } }[];
  default: KnobValue;
  unit?: string;
  /** true: người học được chỉnh khi đang chạy (mặc định true). */
  live?: boolean;
  /** Chi phí đổi núm (ngân sách fix-challenge, 06). Mặc định 1. */
  changeCost?: number;
}

export type FailureModeKind = 'crash' | 'slow' | 'partition' | 'data-loss' | 'split-brain';
export interface FailureMode {
  kind: FailureModeKind;
  note: { vi: string; en: string };
}

export interface NodeSpec {
  id: NodeId;
  kind: PrimitiveKind;
  label: { vi: string; en: string };
  stateful: boolean;
  scaling: 'horizontal' | 'vertical' | 'partitioned';
  replicas: number;
  capacity: {
    opsPerSec: number;
    concurrency?: number;
  };
  latency: {
    baseMs: number;
    cv?: number;
  };
  costPerHour: number;
  costPerMillionReq?: number;
  zone?: string;
  params: Record<string, KnobValue>;
  knobs: Knob[];
  failureModes: FailureMode[];
  initial?: { warm?: number; lagMs?: number; queue?: number; down?: boolean };
  view?: { stageIds?: string[] };
}

export type NetClass = 'loopback' | 'same-az' | 'cross-az' | 'cross-region' | 'internet';
/** RTT cộng thêm mặc định (ms) nếu LinkSpec.netMs không khai. */
export const DEFAULT_NET_MS: Record<NetClass, number> = {
  loopback: 0.05, 'same-az': 0.5, 'cross-az': 1.5, 'cross-region': 70, internet: 30,
};

export interface RetryPolicy {
  max: number;
  backoff: 'none' | 'fixed' | 'exponential';
  baseMs: number;
  factor?: number;
  capMs?: number;
  jitter: 'none' | 'full' | 'equal';
  budgetRatio?: number;
  retryOnLimited?: boolean;
}

export interface BreakerPolicy {
  errorThreshold: number;
  minRps: number;
  windowSec: number;
  openSec: number;
  probeRps: number;
  closeAfterOk: number;
}

export interface LinkSpec {
  id: LinkId;
  from: NodeId;
  to: NodeId;
  mode: 'sync' | 'async' | 'pull' | 'replicate';
  carries?: 'r' | 'w' | 'rw';
  weight?: number;
  fraction?: number;
  calls?: number;
  onMissOf?: NodeId;
  netClass?: NetClass;
  netMs?: number;
  timeoutMs?: number;
  /** Huỷ công việc phía callee khi hết timeoutMs (04 §11 #2, mặc định false). */
  cancelOnTimeout?: boolean;
  retry?: RetryPolicy;
  breaker?: BreakerPolicy;
  fallback?: 'error' | 'bypass' | 'degrade';
  maxRps?: number;
}

export type RouteMode = 'split' | 'all-parallel' | 'all-sequential';

export interface SystemModel {
  nodes: NodeSpec[];
  links: LinkSpec[];
  routes?: Record<NodeId, RouteMode>;
}

export type LoadProfile =
  | { kind: 'steady'; rps: number }
  | { kind: 'ramp'; from: number; to: number; overSec: number }
  | { kind: 'spike'; base: number; peak: number; atSec: number; holdSec: number; riseSec?: number; fallSec?: number }
  | { kind: 'diurnal'; min: number; max: number; periodSec?: number }
  | { kind: 'custom'; points: [number, number][] };

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
  dtMs: 100;
  noise: boolean;
  packetTravelSec: number;
  maxPackets: number;
  checkpointEverySec: number;
  ringCapacityTicks: number;
}

export interface SimScenario {
  id: string;
  model: SystemModel;
  durationSec: number;
  load: LoadProfile;
  events: TimedEvent[];
  seed: number;
  mix?: { readRatio: number };
  clientTimeoutMs?: number;
  options?: Partial<SimOptions>;
}

export const DT = 0.1;
export const DT_MS = 100;

export const DEFAULT_OPTIONS: SimOptions = {
  dtMs: 100,
  noise: true,
  packetTravelSec: 1.2,
  maxPackets: 200,
  checkpointEverySec: 5,
  ringCapacityTicks: 6000,
};

// ───────────── lỗi ─────────────
export type SimModelErrorCode =
  | 'CYCLE' | 'DUP_NODE' | 'DUP_LINK' | 'BAD_LINK_REF' | 'NO_CLIENT'
  | 'BAD_ROUTE' | 'BAD_PARAM' | 'BAD_EVENT_REF' | 'BAD_ONMISS';

export class SimModelError extends Error {
  readonly code: SimModelErrorCode;
  readonly path?: string[];
  constructor(code: SimModelErrorCode, message: string, path?: string[]) {
    super(`${code}: ${message}`);
    this.name = 'SimModelError';
    this.code = code;
    this.path = path;
  }
}

// ───────────── compile ─────────────
export interface CNode {
  id: NodeId;
  idx: number;
  spec: NodeSpec;
  kind: PrimitiveKind;
  route: RouteMode;
  /** mọi link đi ra / đi vào (chỉ số trong CompiledModel.links) */
  out: number[];
  inn: number[];
  /** link mang lưu lượng yêu cầu (sync | async) đi ra / vào */
  outFlow: number[];
  inFlow: number[];
  /** link 'pull' đi ra (queue → worker) / đi vào (worker) */
  outPull: number[];
  inPull: number[];
  /** link 'replicate' đi vào (replica) / đi ra (primary) */
  inRepl: number[];
  outRepl: number[];
  conc0: number;
  cv: number;
}

export interface CLink {
  id: LinkId;
  idx: number;
  spec: LinkSpec;
  from: number;
  to: number;
  netMs: number;
  /** chỉ số node của `onMissOf`, -1 nếu không có */
  onMissOf: number;
  ringLen: number;
  ringAttempts: number;
  /** true nếu link mang lưu lượng yêu cầu (sync | async) */
  flow: boolean;
}

export interface CompiledModel {
  scenarioId: string;
  nodes: CNode[];
  links: CLink[];
  order: Int32Array;
  rev: Int32Array;
  nodeIdx: Record<NodeId, number>;
  linkIdx: Record<LinkId, number>;
  clients: number[];
  options: SimOptions;
  readRatio: number;
  clientTimeoutMs: number;
  durationSec: number;
  load: LoadProfile;
  seed: number;
  /** sự kiện scenario đã sắp xếp ổn định theo `at` */
  events: TimedEvent[];
}

const DEFAULT_SPLIT_KINDS: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['lb', 'cdn', 'dns', 'cache', 'queue']);

export function defaultRoute(kind: PrimitiveKind): RouteMode {
  return DEFAULT_SPLIT_KINDS.has(kind) ? 'split' : 'all-sequential';
}

export function deriveNetClass(a: NodeSpec | undefined, b: NodeSpec | undefined): NetClass {
  const za = a?.zone;
  const zb = b?.zone;
  if (!za || !zb) return 'same-az';
  if (za === zb) return 'same-az';
  if (za === 'internet' || zb === 'internet') return 'internet';
  if (za.startsWith('region') || zb.startsWith('region')) return 'cross-region';
  return 'cross-az';
}

/** Kiểm tra cấu trúc model; ném SimModelError. Trả về thứ tự topo (chỉ số node). */
export function validate(model: SystemModel): void {
  const nodeIds = new Set<string>();
  for (const n of model.nodes) {
    if (nodeIds.has(n.id)) throw new SimModelError('DUP_NODE', `trùng id node '${n.id}'`);
    nodeIds.add(n.id);
    if (!(n.replicas >= 1)) throw new SimModelError('BAD_PARAM', `node '${n.id}': replicas phải >= 1`);
    if (!(n.capacity.opsPerSec > 0)) throw new SimModelError('BAD_PARAM', `node '${n.id}': opsPerSec phải > 0`);
    if (!(n.latency.baseMs >= 0)) throw new SimModelError('BAD_PARAM', `node '${n.id}': baseMs phải >= 0`);
  }
  const linkIds = new Set<string>();
  for (const l of model.links) {
    if (linkIds.has(l.id)) throw new SimModelError('DUP_LINK', `trùng id link '${l.id}'`);
    linkIds.add(l.id);
    if (!nodeIds.has(l.from)) throw new SimModelError('BAD_LINK_REF', `link '${l.id}': from '${l.from}' không tồn tại`);
    if (!nodeIds.has(l.to)) throw new SimModelError('BAD_LINK_REF', `link '${l.id}': to '${l.to}' không tồn tại`);
    if (l.from === l.to) throw new SimModelError('CYCLE', `link '${l.id}' tự trỏ về chính nó`, [l.from, l.to]);
    if (l.onMissOf !== undefined && !nodeIds.has(l.onMissOf)) {
      throw new SimModelError('BAD_ONMISS', `link '${l.id}': onMissOf '${l.onMissOf}' không tồn tại`);
    }
  }
  if (!model.nodes.some((n) => n.kind === 'client')) {
    throw new SimModelError('NO_CLIENT', 'cần ít nhất một node kind=client');
  }
  if (model.routes) {
    for (const [id, r] of Object.entries(model.routes)) {
      if (!nodeIds.has(id)) throw new SimModelError('BAD_ROUTE', `routes: node '${id}' không tồn tại`);
      if (r !== 'split' && r !== 'all-parallel' && r !== 'all-sequential') {
        throw new SimModelError('BAD_ROUTE', `routes['${id}']: giá trị '${String(r)}' không hợp lệ`);
      }
    }
  }
  topoOrder(model); // ném CYCLE nếu có chu trình
}

/** Kahn ổn định theo thứ tự khai báo; bỏ link replicate. */
function topoOrder(model: SystemModel): number[] {
  const idx = new Map<string, number>();
  model.nodes.forEach((n, i) => idx.set(n.id, i));
  const n = model.nodes.length;
  const indeg = new Array<number>(n).fill(0);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const l of model.links) {
    if (l.mode === 'replicate') continue;
    const a = idx.get(l.from)!;
    const b = idx.get(l.to)!;
    adj[a].push(b);
    indeg[b]++;
  }
  const order: number[] = [];
  const ready: number[] = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) ready.push(i);
  while (ready.length > 0) {
    // lấy phần tử nhỏ nhất (thứ tự khai báo) để ổn định
    let mi = 0;
    for (let i = 1; i < ready.length; i++) if (ready[i] < ready[mi]) mi = i;
    const u = ready.splice(mi, 1)[0];
    order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) ready.push(v);
  }
  if (order.length < n) {
    // tìm một chu trình để báo đường đi
    const rest = new Set<number>();
    for (let i = 0; i < n; i++) if (indeg[i] > 0) rest.add(i);
    const start = rest.values().next().value as number;
    const path: number[] = [start];
    const seen = new Map<number, number>([[start, 0]]);
    let cur = start;
    for (let guard = 0; guard <= n; guard++) {
      const nxt = adj[cur].find((v) => rest.has(v));
      if (nxt === undefined) break;
      if (seen.has(nxt)) {
        const cyc = path.slice(seen.get(nxt)!).concat(nxt);
        throw new SimModelError('CYCLE', 'đồ thị đồng bộ có chu trình', cyc.map((i) => model.nodes[i].id));
      }
      seen.set(nxt, path.length);
      path.push(nxt);
      cur = nxt;
    }
    throw new SimModelError('CYCLE', 'đồ thị đồng bộ có chu trình', path.map((i) => model.nodes[i].id));
  }
  return order;
}

function retryRingDims(l: LinkSpec, clientTimeoutMs: number): { len: number; att: number } {
  const r = l.retry;
  const detect = l.timeoutMs ?? clientTimeoutMs;
  let backoffMax = 0;
  if (r) {
    if (r.backoff === 'fixed') backoffMax = r.baseMs;
    else if (r.backoff === 'exponential') {
      backoffMax = Math.min(r.capMs ?? 30000, r.baseMs * Math.pow(r.factor ?? 2, Math.max(0, r.max - 1)));
    }
  }
  const wantMs = r ? detect + backoffMax : 5000;
  // có đệm tối thiểu 6,4 s để retry thêm lúc chạy vẫn có chỗ
  const len = Math.min(700, Math.max(64, Math.ceil(wantMs / DT_MS) + 3));
  return { len, att: Math.max(3, r?.max ?? 0) };
}

export function compile(scenario: SimScenario): CompiledModel {
  const model = scenario.model;
  validate(model);
  const nodeIdxMap: Record<NodeId, number> = {};
  model.nodes.forEach((n, i) => { nodeIdxMap[n.id] = i; });
  const linkIdxMap: Record<LinkId, number> = {};
  model.links.forEach((l, i) => { linkIdxMap[l.id] = i; });

  for (const ev of scenario.events) {
    if ('node' in ev && !(ev.node in nodeIdxMap)) {
      throw new SimModelError('BAD_EVENT_REF', `sự kiện '${ev.type}': node '${ev.node}' không tồn tại`);
    }
    if ('link' in ev && !(ev.link in linkIdxMap)) {
      throw new SimModelError('BAD_EVENT_REF', `sự kiện '${ev.type}': link '${ev.link}' không tồn tại`);
    }
  }

  const options: SimOptions = { ...DEFAULT_OPTIONS, ...(scenario.options ?? {}), dtMs: 100 };
  const clientTimeoutMs = scenario.clientTimeoutMs ?? 3000;

  const nodes: CNode[] = model.nodes.map((spec, i) => {
    const conc0 = spec.capacity.concurrency ?? Math.max(1, Math.ceil(spec.capacity.opsPerSec * spec.latency.baseMs / 1000));
    return {
      id: spec.id, idx: i, spec, kind: spec.kind,
      route: model.routes?.[spec.id] ?? defaultRoute(spec.kind),
      out: [], inn: [], outFlow: [], inFlow: [], outPull: [], inPull: [], inRepl: [], outRepl: [],
      conc0, cv: spec.latency.cv ?? 0.3,
    };
  });
  const links: CLink[] = model.links.map((spec, i) => {
    const from = nodeIdxMap[spec.from];
    const to = nodeIdxMap[spec.to];
    const nc = spec.netClass ?? deriveNetClass(model.nodes[from], model.nodes[to]);
    const dims = retryRingDims(spec, clientTimeoutMs);
    return {
      id: spec.id, idx: i, spec, from, to,
      netMs: spec.netMs ?? DEFAULT_NET_MS[nc],
      onMissOf: spec.onMissOf !== undefined ? nodeIdxMap[spec.onMissOf] : -1,
      ringLen: dims.len, ringAttempts: dims.att,
      flow: spec.mode === 'sync' || spec.mode === 'async',
    };
  });
  for (const l of links) {
    const a = nodes[l.from];
    const b = nodes[l.to];
    a.out.push(l.idx);
    b.inn.push(l.idx);
    switch (l.spec.mode) {
      case 'sync':
      case 'async':
        a.outFlow.push(l.idx); b.inFlow.push(l.idx); break;
      case 'pull':
        a.outPull.push(l.idx); b.inPull.push(l.idx); break;
      case 'replicate':
        a.outRepl.push(l.idx); b.inRepl.push(l.idx); break;
    }
  }
  const order = Int32Array.from(topoOrder(model));
  const rev = Int32Array.from(Array.from(order).reverse());
  const clients: number[] = [];
  nodes.forEach((n, i) => { if (n.kind === 'client') clients.push(i); });

  const events = scenario.events
    .map((e, i) => ({ e, i }))
    .sort((x, y) => x.e.at - y.e.at || x.i - y.i)
    .map((x) => x.e);

  return {
    scenarioId: scenario.id,
    nodes, links, order, rev,
    nodeIdx: nodeIdxMap, linkIdx: linkIdxMap, clients, options,
    readRatio: scenario.mix?.readRatio ?? 0.9,
    clientTimeoutMs,
    durationSec: scenario.durationSec,
    load: scenario.load,
    seed: scenario.seed >>> 0,
    events,
  };
}
