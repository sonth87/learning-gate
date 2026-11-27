/**
 * Phân tích tĩnh/động (04 §6): bottleneck, maxSustainableRps, SPOF (Tarjan articulation point) và
 * cảnh báo cấu trúc. Thuần TS; chỉ đọc `SystemModel` và `SimFrame`.
 */
import { deriveNetClass, type LinkSpec, type NodeId, type NodeSpec, type PrimitiveKind, type SystemModel } from './model';
import type { NodeState, SimFrame } from './types';

// ───────────── helper đọc tham số hiệu lực ─────────────
function numParam(n: NodeSpec, key: string): number | undefined {
  const v = n.params[key];
  return typeof v === 'number' ? v : undefined;
}
function boolParam(n: NodeSpec, key: string): boolean | undefined {
  const v = n.params[key];
  return typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : undefined;
}
export function effReplicas(n: NodeSpec): number {
  return Math.max(1, Math.round(numParam(n, 'replicas') ?? n.replicas));
}
function isEnabled(n: NodeSpec): boolean { return boolParam(n, 'enabled') !== false; }
function conc0(n: NodeSpec): number {
  return n.capacity.concurrency ?? Math.max(1, Math.ceil((n.capacity.opsPerSec * n.latency.baseMs) / 1000));
}

const CRITICAL_KINDS: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['sql', 'nosql', 'queue', 'blob', 'search', 'coordinator']);
function isCritical(n: NodeSpec): boolean { return CRITICAL_KINDS.has(n.kind) || n.stateful; }

// ═════════════════════ bottleneck ═════════════════════
export type BottleneckReason = 'saturated' | 'queueing' | 'slow-dependency' | 'pool-limited' | 'hot-shard' | 'none';

export interface BottleneckReport {
  nodeId: NodeId;
  rho: number;
  /** μ_tot/λ: nhân với tải hiện tại thì tới ρ=1 (kẹp ở 1e9 khi nút gần như không có tải) */
  headroom: number;
  /** phần thời gian chờ trong độ trễ đầu-cuối của nút (0..1) */
  latencyShare: number;
  reason: BottleneckReason;
  /** các node trên đường nóng (λ ≥ 5%·offeredRps), theo thứ tự khai báo trong model */
  hotPath: NodeId[];
}

interface NodeAgg {
  rho: number; lambda: number; latMean: number; subMean: number; queueWaitMs: number;
  hotShare: number; slowMs: number; state: NodeState;
}

/** Trung bình theo cửa sổ (1 frame ⇒ chính nó). `state` lấy ở frame cuối. */
function aggregate(model: SystemModel, frames: readonly SimFrame[]): { offered: number; nodes: Record<NodeId, NodeAgg> } {
  const nodes: Record<NodeId, NodeAgg> = {};
  const nF = frames.length;
  let offered = 0;
  for (const f of frames) offered += f.metrics.offeredRps / nF;
  const lastF = frames[nF - 1];
  for (const n of model.nodes) {
    const a: NodeAgg = { rho: 0, lambda: 0, latMean: 0, subMean: 0, queueWaitMs: 0, hotShare: 0, slowMs: 0, state: 'idle' };
    for (const f of frames) {
      const nf = f.nodes[n.id];
      if (!nf) continue;
      a.rho += nf.rho / nF;
      a.lambda += nf.lambda / nF;
      a.latMean += nf.latency.mean / nF;
      a.subMean += nf.subtreeLatency.mean / nF;
      a.queueWaitMs += nf.queueWaitMs / nF;
      a.hotShare = Math.max(a.hotShare, nf.hotShare ?? 0);
      if (nf.badge?.code === 'SLOW') a.slowMs = Math.max(a.slowMs, nf.badge.value ?? 0);
    }
    a.state = lastF.nodes[n.id]?.state ?? 'idle';
    nodes[n.id] = a;
  }
  return { offered, nodes };
}

export function findBottleneck(model: SystemModel, frames: SimFrame[] | SimFrame): BottleneckReport {
  const list = Array.isArray(frames) ? frames : [frames];
  if (list.length === 0) throw new Error('findBottleneck: cần ít nhất 1 frame');
  const { offered, nodes } = aggregate(model, list);
  const specs = model.nodes;
  const hot = specs.filter((n) => n.kind !== 'client' && nodes[n.id].lambda >= 0.05 * offered && nodes[n.id].lambda > 1e-9);
  const hotPath = hot.map((n) => n.id);
  const rootSub = Math.max(1e-9, Math.max(...specs.filter((n) => n.kind === 'client').map((n) => nodes[n.id].subMean), 0)
    || Math.max(...specs.map((n) => nodes[n.id].subMean)));

  const wait = (n: NodeSpec): number => {
    const a = nodes[n.id];
    return Math.max(0, a.latMean - (n.latency.baseMs + a.slowMs));
  };
  const share = (n: NodeSpec): number => {
    const a = nodes[n.id];
    return Math.min(1, Math.max(0, wait(n) / Math.max(1e-9, a.subMean || rootSub)));
  };
  const headroomOf = (rho: number): number => (rho > 1e-9 ? Math.min(1e9, 1 / rho) : 1e9);

  const cands = hot.filter((n) => {
    const a = nodes[n.id];
    return a.state === 'saturated' || a.state === 'overloaded' || a.rho >= 0.8;
  });

  if (cands.length > 0) {
    let best = cands[0];
    for (const n of cands.slice(1)) {
      const d = nodes[n.id].rho - nodes[best.id].rho;
      if (d > 0.02 || (Math.abs(d) <= 0.02 && share(n) > share(best))) best = n;
    }
    const a = nodes[best.id];
    let reason: BottleneckReason;
    const poolLimited = best.kind === 'service' && (numParam(best, 'poolSize') ?? conc0(best)) / ((best.latency.baseMs + a.slowMs) / 1000) < best.capacity.opsPerSec * (numParam(best, 'sizeFactor') ?? 1);
    if (a.hotShare > 0) reason = 'hot-shard';
    else if (a.rho >= 1) reason = poolLimited ? 'pool-limited' : 'saturated';
    else if (poolLimited) reason = 'pool-limited';
    else if (wait(best) > 0.4 * Math.max(1e-9, a.latMean)) reason = 'queueing';
    else reason = 'saturated';
    return { nodeId: best.id, rho: a.rho, headroom: headroomOf(a.rho), latencyShare: share(best), reason, hotPath };
  }

  // không có nút ρ cao: tìm phụ thuộc chậm (thời gian tại nút chiếm phần lớn độ trễ đầu-cuối)
  const pool = hot.length > 0 ? hot : specs.filter((n) => n.kind !== 'client');
  let slow = pool[0];
  for (const n of pool) if (nodes[n.id].latMean > nodes[slow.id].latMean) slow = n;
  const sa = nodes[slow.id];
  if (sa.latMean >= 0.4 * rootSub) {
    return { nodeId: slow.id, rho: sa.rho, headroom: headroomOf(sa.rho), latencyShare: share(slow), reason: 'slow-dependency', hotPath };
  }
  let top = pool[0];
  for (const n of pool) if (nodes[n.id].rho > nodes[top.id].rho) top = n;
  return { nodeId: top.id, rho: nodes[top.id].rho, headroom: headroomOf(nodes[top.id].rho), latencyShare: share(top), reason: 'none', hotPath };
}

/**
 * Tải gốc tối đa trước khi nút đầu tiên chạm ρ=1, giả định tỉ lệ định tuyến cố định:
 * λ0·min_n(μ_tot/λ_n) = λ0/ρ_max. Dùng ρ của frame (đã gồm retry nếu có, nên thận trọng khi đang có retry storm).
 */
export function maxSustainableRps(model: SystemModel, frame: SimFrame): { rps: number; limitedBy: NodeId } {
  let rhoMax = 0;
  let limitedBy: NodeId = '';
  for (const n of model.nodes) {
    if (n.kind === 'client') continue;
    const nf = frame.nodes[n.id];
    if (!nf || nf.lambda <= 1e-9) continue;
    if (nf.rho > rhoMax) { rhoMax = nf.rho; limitedBy = n.id; }
  }
  if (rhoMax <= 1e-12) return { rps: Number.POSITIVE_INFINITY, limitedBy };
  return { rps: frame.metrics.offeredRps / rhoMax, limitedBy };
}

// ═════════════════════ SPOF (Tarjan) ═════════════════════
export interface SpofReport {
  nodeId: NodeId;
  severity: 'error' | 'info';
  /** các node bị tách khỏi lối vào nếu `nodeId` chết (không gồm chính nó) */
  cuts: NodeId[];
}

function hasReplicateLink(model: SystemModel, id: NodeId): boolean {
  return model.links.some((l) => l.mode === 'replicate' && (l.to === id || l.from === id));
}
function isHardLink(l: LinkSpec): boolean {
  return l.mode !== 'async' && l.mode !== 'replicate' && l.fallback !== 'bypass' && l.fallback !== 'degrade';
}

export function findSpofs(model: SystemModel): SpofReport[] {
  const ENTRY = '\u0000ENTRY';
  const live = model.nodes.filter(isEnabled);
  const ids: string[] = [ENTRY];
  const idx = new Map<string, number>();
  idx.set(ENTRY, 0);
  for (const n of live) {
    if (n.kind === 'client') { idx.set(n.id, 0); continue; }
    idx.set(n.id, ids.length);
    ids.push(n.id);
  }
  const V = ids.length;
  const adj: number[][] = Array.from({ length: V }, () => []);
  for (const l of model.links) {
    if (!isHardLink(l)) continue;
    const a = idx.get(l.from);
    const b = idx.get(l.to);
    if (a === undefined || b === undefined || a === b) continue;
    adj[a].push(b);
    adj[b].push(a);
  }

  const disc = new Int32Array(V).fill(-1);
  const low = new Int32Array(V);
  const end = new Int32Array(V);
  const order: number[] = [];
  const cutKids: number[][] = Array.from({ length: V }, () => []);
  let rootKids = 0;
  const dfs = (v: number, parent: number): void => {
    disc[v] = low[v] = order.length;
    order.push(v);
    for (const u of adj[v]) {
      if (u === parent) continue;
      if (disc[u] === -1) {
        if (parent === -1) rootKids++;
        dfs(u, v);
        low[v] = Math.min(low[v], low[u]);
        if (parent !== -1 && low[u] >= disc[v]) cutKids[v].push(u);
      } else {
        low[v] = Math.min(low[v], disc[u]);
      }
    }
    end[v] = order.length;
  };
  dfs(0, -1);

  const byId = new Map(live.map((n) => [n.id, n] as const));
  const out: SpofReport[] = [];
  for (let v = 1; v < V; v++) {
    if (disc[v] === -1) continue; // không với tới từ lối vào
    const spec = byId.get(ids[v])!;
    const cuts: string[] = [];
    let cutCritical = false;
    for (const u of cutKids[v]) {
      for (let i = disc[u]; i < end[u]; i++) {
        const nid = ids[order[i]];
        cuts.push(nid);
        if (isCritical(byId.get(nid)!)) cutCritical = true;
      }
    }
    const report = cutCritical || isCritical(spec);
    if (!report) continue;
    const replicated = effReplicas(spec) >= 2 || (spec.stateful && hasReplicateLink(model, spec.id));
    out.push({ nodeId: spec.id, severity: replicated ? 'info' : 'error', cuts });
  }
  void rootKids;
  return out;
}

// ═════════════════════ cảnh báo cấu trúc ═════════════════════
export type StructuralWarningCode =
  | 'SPOF' | 'STATEFUL_NO_REPLICA' | 'CACHE_NO_TTL' | 'CACHE_SYNC_TTL' | 'SYNC_CROSS_REGION_HOT_PATH'
  | 'QUEUE_NO_DLQ' | 'UNBOUNDED_QUEUE' | 'NO_TIMEOUT' | 'RETRY_NO_BACKOFF' | 'RETRY_NO_JITTER'
  | 'RETRY_AMPLIFICATION' | 'NO_BREAKER_ON_DEP' | 'NO_RATE_LIMIT_AT_EDGE' | 'LB_NO_HEALTHCHECK'
  | 'SINGLE_AZ' | 'DB_FANIN_EXCEEDS_CONNS';

export interface StructuralWarning {
  code: StructuralWarningCode;
  severity: 'info' | 'warn' | 'error';
  nodeId?: NodeId;
  linkId?: string;
  params?: Record<string, number | string>;
  /** khoá để UI/Inspector giải thích: `sim.warn.<CODE>` */
  messageKey: string;
}

const DEP_KINDS: ReadonlySet<PrimitiveKind> = new Set<PrimitiveKind>(['sql', 'nosql', 'search', 'blob', 'coordinator']);

/**
 * `frame` (tuỳ chọn) xác định "đường nóng" cho `SYNC_CROSS_REGION_HOT_PATH`; không có thì mọi link sync
 * nối giữa các node còn bật đều coi là trên đường nóng.
 */
export function structuralWarnings(model: SystemModel, frame?: SimFrame): StructuralWarning[] {
  const out: StructuralWarning[] = [];
  const add = (code: StructuralWarningCode, severity: StructuralWarning['severity'], extra: Partial<StructuralWarning> = {}) => {
    out.push({ code, severity, messageKey: `sim.warn.${code}`, ...extra });
  };
  const live = model.nodes.filter(isEnabled);
  const liveIds = new Set(live.map((n) => n.id));
  const byId = new Map(model.nodes.map((n) => [n.id, n] as const));
  const links = model.links.filter((l) => liveIds.has(l.from) && liveIds.has(l.to));

  for (const s of findSpofs(model)) {
    add('SPOF', s.severity === 'error' ? 'error' : 'info', { nodeId: s.nodeId, params: { cuts: s.cuts.length } });
  }

  for (const n of live) {
    if (n.kind === 'client') continue;
    if (n.stateful && effReplicas(n) < 2 && !hasReplicateLink(model, n.id)) add('STATEFUL_NO_REPLICA', 'warn', { nodeId: n.id });
    if (n.kind === 'cache' || n.kind === 'cdn') {
      const ttl = numParam(n, 'ttlSec');
      if (ttl === undefined || ttl >= 86400) add('CACHE_NO_TTL', 'warn', { nodeId: n.id });
      if ((numParam(n, 'ttlJitterPct') ?? 0) < 0.1 && (numParam(n, 'hitRatioMax') ?? 0.9) >= 0.8) add('CACHE_SYNC_TTL', 'warn', { nodeId: n.id });
    }
    if (n.kind === 'queue') {
      if (boolParam(n, 'dlq') !== true) add('QUEUE_NO_DLQ', 'warn', { nodeId: n.id });
      const md = numParam(n, 'maxDepth');
      if (md === undefined || md > 1e7) add('UNBOUNDED_QUEUE', 'warn', { nodeId: n.id });
    }
    if (n.kind === 'lb') {
      const hc = numParam(n, 'healthCheckSec');
      if (hc === undefined || hc >= 30) add('LB_NO_HEALTHCHECK', 'warn', { nodeId: n.id });
    }
  }

  // link
  const hotLink = (l: LinkSpec): boolean => {
    if (!frame) return true;
    const lf = frame.links[l.id];
    return !!lf && lf.rps >= 0.05 * frame.metrics.offeredRps;
  };
  for (const l of links) {
    const from = byId.get(l.from)!;
    const to = byId.get(l.to)!;
    if (l.mode === 'sync' && l.timeoutMs === undefined) add('NO_TIMEOUT', 'warn', { linkId: l.id });
    const nc = l.netClass ?? deriveNetClass(from, to);
    if (l.mode === 'sync' && nc === 'cross-region' && hotLink(l)) add('SYNC_CROSS_REGION_HOT_PATH', 'warn', { linkId: l.id });
    const r = l.retry;
    if (r && r.max > 0) {
      if (r.backoff === 'none') add('RETRY_NO_BACKOFF', 'warn', { linkId: l.id });
      else if (r.jitter === 'none') add('RETRY_NO_JITTER', 'warn', { linkId: l.id });
      if (!l.breaker && DEP_KINDS.has(to.kind)) add('NO_BREAKER_ON_DEP', 'warn', { linkId: l.id });
    }
  }

  // khuếch đại retry dọc đường: tích (1+max) lớn nhất tới mỗi node (DAG, bỏ link replicate)
  {
    const idx = new Map(live.map((n, i) => [n.id, i] as const));
    const flow = links.filter((l) => l.mode !== 'replicate');
    const indeg = new Array<number>(live.length).fill(0);
    for (const l of flow) indeg[idx.get(l.to)!]++;
    const best = new Array<number>(live.length).fill(1);
    const queue: number[] = [];
    indeg.forEach((d, i) => { if (d === 0) queue.push(i); });
    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const l of flow) {
        if (idx.get(l.from) !== u) continue;
        const v = idx.get(l.to)!;
        const mult = 1 + (l.retry?.max ?? 0);
        const prod = best[u] * mult;
        if (mult > 1 && prod >= 9 && best[u] < 9) add('RETRY_AMPLIFICATION', 'warn', { linkId: l.id, params: { product: prod } });
        if (prod > best[v]) best[v] = prod;
        if (--indeg[v] === 0) queue.push(v);
      }
    }
  }

  // rate limit ở lối vào: có rate-limiter/gateway trong 2 bước đầu từ client
  {
    const clients = live.filter((n) => n.kind === 'client').map((n) => n.id);
    let frontier = new Set(clients);
    let found = false;
    for (let depth = 0; depth < 2 && !found; depth++) {
      const next = new Set<string>();
      for (const l of links) {
        if (!frontier.has(l.from) || l.mode === 'replicate') continue;
        const to = byId.get(l.to)!;
        if (to.kind === 'rate-limiter' || to.kind === 'gateway') found = true;
        next.add(l.to);
      }
      frontier = next;
    }
    if (!found && clients.length > 0) add('NO_RATE_LIMIT_AT_EDGE', 'warn');
  }

  // một AZ
  {
    const zones = new Set<string>();
    let withZone = 0;
    for (const n of live) {
      if (n.kind === 'client' || !n.zone) continue;
      zones.add(n.zone);
      withZone++;
    }
    if (withZone >= 2 && zones.size === 1) add('SINGLE_AZ', 'info');
  }

  // số kết nối tới DB
  for (const n of live) {
    if (n.kind !== 'sql' && n.kind !== 'nosql') continue;
    const max = numParam(n, 'maxConnections');
    if (max === undefined) continue;
    let sum = 0;
    for (const l of links) {
      if (l.to !== n.id || l.mode === 'replicate') continue;
      const c = byId.get(l.from)!;
      sum += effReplicas(c) * (numParam(c, 'poolSize') ?? conc0(c));
    }
    if (sum > max) add('DB_FANIN_EXCEEDS_CONNS', 'warn', { nodeId: n.id, params: { fanin: sum, max } });
  }
  return out;
}
