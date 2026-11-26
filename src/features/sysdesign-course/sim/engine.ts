/**
 * Lõi mô phỏng dòng chảy (fluid model), tick 100 ms (04 §2). Hàm thuần theo nghĩa: kết quả chỉ phụ
 * thuộc (CompiledModel, SimState, SimInputs, learnerEvents); không dùng Math.random/Date.
 *
 * Hai cổng vào:
 *  - `stepInPlace`: thay đổi `state` tại chỗ (nhanh, dùng bởi Sim/recorder).
 *  - `stepState`: bản thuần, clone state trước khi chạy.
 */
import { effectiveHit, hitTarget, singleflightCap, stepCacheState, type CacheParams } from './cache';
import { applyEvent, initialInputs } from './events';
import {
  D_FAIL0, D_ZERO, dMark, dMassBeyond, dMax, dMean, dMix, dOkMass, dPoint, dQuantile, dRetry, dScaleCalls, dSerial,
  dShift, dSummary, dTruncate, nodeDist, type Dist,
} from './latency';
import {
  compile, DT, DT_MS, type CLink, type CNode, type CompiledModel, type KnobValue, type LinkSpec,
  type SimScenario, type TimedEvent,
} from './model';
import { stepPackets, visiblePackets, type PacketLinkInput } from './packets';
import { createRecorder, flushInputs, type Recorder } from './recorder';
import { gauss, tickRng } from './rng';
import { rpsAt } from './profiles';
import type {
  BadgeCode, BreakerState, ErrorBreakdown, InputChange, InputRecord, LatencySummary, LinkFrame,
  LinkRuntime, NodeFrame, NodeRuntime, NodeState, SimFrame, SimInputs, SimState,
} from './types';

// chỉ số loại lỗi trong các mảng 6 phần tử
const K_TIMEOUT = 0;
const K_DROPPED = 1;
const K_LIMITED = 2;
const K_DOWN = 3;
const K_FAULT = 4;
const K_BREAKER = 5;
const NK = 6;

const NODE_WARM_SEC = 20;
const STATE_HOLD_TICKS = 10;
/** ρ ≥ 1 liên tục chừng này tick thì coi là overloaded dù hàng đợi/lỗi chưa kịp lộ (3 s). */
const OVERLOAD_HOLD_TICKS = 30;
const LEVEL: Record<NodeState, number> = {
  idle: 0, healthy: 1, busy: 2, saturated: 3, overloaded: 4, down: 5, recovering: 5,
};
const LEVEL_NAME: NodeState[] = ['idle', 'healthy', 'busy', 'saturated', 'overloaded'];
const ENTRY_RHO = [0, 0.1, 0.7, 0.9, 1.0];

// ───────────── scratch ─────────────
interface Work {
  nrt: NodeRuntime[];
  lrt: LinkRuntime[];
  // node
  enabled: Uint8Array; repUp: Float64Array; sSec: Float64Array; muI: Float64Array; muTot: Float64Array;
  cEff: Float64Array; hEff: Float64Array; replicas: Float64Array;
  inR: Float64Array; inW: Float64Array; lam: Float64Array; rho: Float64Array;
  lim: Float64Array; drop: Float64Array; downRej: Float64Array; lost: Float64Array;
  served: Float64Array; servedR: Float64Array; servedW: Float64Array; qWait: Float64Array; qCap: Float64Array;
  qPrev: Float64Array; succ: Float64Array; fail: Float64Array; rfIn: Float64Array;
  own: Dist[]; sub: Dist[];
  // link
  tau: Float64Array; // NaN = không timeout
  a0r: Float64Array; a0w: Float64Array; rr: Float64Array; A: Float64Array; gate: Float64Array;
  mr: Float64Array; mw: Float64Array; mult: Float64Array;
  psucc: Float64Array; psuccCond: Float64Array; att: Float64Array; fin: Float64Array;
  succL: Float64Array; retryFrac: Float64Array; pTo: Float64Array; pDrop: Float64Array; pHit: Float64Array;
  latL: Dist[]; detect: Float64Array; replApplied: Float64Array; pullFlow: Float64Array;
  rfLink: Float64Array;
  tmpKinds: Float64Array;
}

const WORK = new WeakMap<CompiledModel, Work>();

function getWork(c: CompiledModel): Work {
  let w = WORK.get(c);
  if (w) return w;
  const N = c.nodes.length;
  const L = c.links.length;
  const f = (n: number) => new Float64Array(n);
  w = {
    nrt: new Array<NodeRuntime>(N), lrt: new Array<LinkRuntime>(L),
    enabled: new Uint8Array(N), repUp: f(N), sSec: f(N), muI: f(N), muTot: f(N), cEff: f(N), hEff: f(N), replicas: f(N),
    inR: f(N), inW: f(N), lam: f(N), rho: f(N), lim: f(N), drop: f(N), downRej: f(N), lost: f(N),
    served: f(N), servedR: f(N), servedW: f(N), qWait: f(N), qCap: f(N), qPrev: f(N), succ: f(N), fail: f(N * NK), rfIn: f(N),
    own: new Array<Dist>(N), sub: new Array<Dist>(N),
    tau: f(L), a0r: f(L), a0w: f(L), rr: f(L), A: f(L), gate: f(L), mr: f(L), mw: f(L), mult: f(L),
    psucc: f(L), psuccCond: f(L), att: f(L * NK), fin: f(L * NK), succL: f(L), retryFrac: f(L),
    pTo: f(L), pDrop: f(L), pHit: f(L),
    latL: new Array<Dist>(L), detect: f(L), replApplied: f(L), pullFlow: f(L), rfLink: f(L),
    tmpKinds: f(NK),
  };
  WORK.set(c, w);
  return w;
}

// ───────────── tham số ─────────────
function numParam(inputs: SimInputs, n: CNode, key: string, dflt: number): number {
  const o = inputs.params[n.id];
  let v: KnobValue | undefined = o ? o[key] : undefined;
  if (v === undefined) v = n.spec.params[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return dflt;
}
function boolParam(inputs: SimInputs, n: CNode, key: string, dflt: boolean): boolean {
  const o = inputs.params[n.id];
  let v: KnobValue | undefined = o ? o[key] : undefined;
  if (v === undefined) v = n.spec.params[key];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return dflt;
}
function strParam(inputs: SimInputs, n: CNode, key: string, dflt: string): string {
  const o = inputs.params[n.id];
  let v: KnobValue | undefined = o ? o[key] : undefined;
  if (v === undefined) v = n.spec.params[key];
  return typeof v === 'string' ? v : dflt;
}

function effLink<K extends keyof LinkSpec>(inputs: SimInputs, l: CLink, key: K): LinkSpec[K] {
  const p = inputs.links[l.id];
  if (p && key in p) return p[key] as LinkSpec[K];
  return l.spec[key];
}

/** Số shard của node `partitioned` (mỗi shard có năng lực μ_i); node khác luôn 1. */
function shardsOf(inputs: SimInputs, n: CNode): number {
  return n.spec.scaling === 'partitioned' ? Math.max(1, Math.round(numParam(inputs, n, 'shards', 1))) : 1;
}

function cacheParams(inputs: SimInputs, n: CNode): CacheParams {
  return {
    ttlSec: numParam(inputs, n, 'ttlSec', 300),
    ttlJitterPct: numParam(inputs, n, 'ttlJitterPct', 0),
    hitRatioMax: numParam(inputs, n, 'hitRatioMax', 0.9),
    workingSetKeys: numParam(inputs, n, 'workingSetKeys', 100000),
    capacityKeys: numParam(inputs, n, 'capacityKeys', 100000),
    warmupSec: numParam(inputs, n, 'warmupSec', 30),
    singleflight: boolParam(inputs, n, 'singleflight', false),
  };
}

// ───────────── khởi tạo ─────────────
export function createInitialState(c: CompiledModel): SimState {
  const nodes: SimState['nodes'] = {};
  for (const n of c.nodes) {
    const ini = n.spec.initial;
    const isCache = n.kind === 'cache' || n.kind === 'cdn';
    const warm = ini?.warm ?? (isCache ? 1 : 1);
    const p = n.spec.params;
    const ttl = typeof p.ttlSec === 'number' ? p.ttlSec : 300;
    const jit = typeof p.ttlJitterPct === 'number' ? p.ttlJitterPct : 0;
    const apply = typeof p.applyRps === 'number' ? p.applyRps : 1000;
    nodes[n.id] = {
      up: !(ini?.down),
      downSinceTick: ini?.down ? 0 : undefined,
      warmProgress: 1,
      queue: ini?.queue ?? 0,
      rhoPrev: 0,
      stateHoldTicks: 0,
      overTicks: 0,
      stateShown: ini?.down ? 'down' : 'idle',
      slowAddMs: 0,
      hotShare: 0,
      faultErrorRate: 0,
      cacheWarm: isCache ? warm : 1,
      cacheCohort: 0,
      cacheNextExpiryTick: isCache && warm >= 0.9 ? Math.round(ttl / DT) : undefined,
      lagBacklogWrites: ini?.lagMs !== undefined ? (ini.lagMs / 1000) * apply : 0,
      tokens: typeof p.burst === 'number' ? p.burst : 0,
      lbWeights: {},
      lbKnownDown: {},
    };
    if (isCache && warm >= 0.9) nodes[n.id].cacheCohort = Math.max(0, 1 - jit / 0.2);
    for (const e of n.outFlow) nodes[n.id].lbKnownDown[c.links[e].id] = -1;
  }
  const links: SimState['links'] = {};
  for (const l of c.links) {
    links[l.id] = {
      partitioned: false,
      retryRing: l.flow ? Array.from({ length: l.ringLen }, () => new Array<number>(l.ringAttempts).fill(0)) : [],
      retryBudgetTokens: 0,
      retryBeta: 1,
      breaker: 'closed',
      breakerErrEwma: 0,
      breakerProbeOk: 0, breakerProbeN: 0,
      lastPSucc: 1,
    };
  }
  const packetAcc: Record<string, number> = {};
  for (const l of c.links) packetAcc[l.id] = 0;
  return {
    tick: 0, nodes, links, costCumUsd: 0, packetSeq: 0, packetAcc,
    inflightPackets: [], packetScale: 0, firedEventIdx: 0,
  };
}

export function cloneState(s: SimState): SimState {
  return structuredClone(s);
}

// ───────────── API công khai của lõi ─────────────
/** Bản thuần: clone state, chạy 1 tick, trả state mới + frame. */
export function stepState(
  c: CompiledModel, s: SimState, inputs: SimInputs, learnerEvents: readonly TimedEvent[] = [],
): { state: SimState; frame: SimFrame } {
  const state = cloneState(s);
  const frame = stepInPlace(c, state, inputs, learnerEvents);
  return { state, frame };
}

function backoffMs(rp: NonNullable<LinkSpec['retry']>, retryNo: number): number {
  if (rp.backoff === 'none') return 0;
  if (rp.backoff === 'fixed') return rp.baseMs;
  return Math.min(rp.capMs ?? 30000, rp.baseMs * Math.pow(rp.factor ?? 2, retryNo - 1));
}

/**
 * Chạy tick `s.tick`, thay đổi `s` tại chỗ (tick tăng 1) và trả SimFrame của tick vừa chạy.
 */
export function stepInPlace(
  c: CompiledModel, s: SimState, inputs: SimInputs, learnerEvents: readonly TimedEvent[] = [],
): SimFrame {
  const w = getWork(c);
  const k = s.tick;
  const N = c.nodes.length;
  const L = c.links.length;
  const nodes = c.nodes;
  const links = c.links;
  const readRatio = c.readRatio;
  const clientTimeout = c.clientTimeoutMs;

  for (let i = 0; i < N; i++) w.nrt[i] = s.nodes[nodes[i].id];
  for (let e = 0; e < L; e++) w.lrt[e] = s.links[links[e].id];
  const nrt = w.nrt;
  const lrt = w.lrt;

  // ───── bước 0: sự kiện, đầu vào, bộ đếm thời gian ─────
  const fired: SimFrame['firedEvents'] = [];
  const evs = c.events;
  while (s.firedEventIdx < evs.length && Math.round(evs[s.firedEventIdx].at / DT) <= k) {
    const ev = evs[s.firedEventIdx++];
    applyEvent(c, s, ev, k);
    fired.push({ type: ev.type, node: 'node' in ev ? ev.node : undefined, link: 'link' in ev ? ev.link : undefined, source: 'scenario' });
  }
  for (const ev of learnerEvents) {
    applyEvent(c, s, ev, k);
    fired.push({ type: ev.type, node: 'node' in ev ? ev.node : undefined, link: 'link' in ev ? ev.link : undefined, source: 'learner' });
  }
  for (let i = 0; i < N; i++) {
    const rt = nrt[i];
    if (rt.slowUntilTick !== undefined && k >= rt.slowUntilTick) { rt.slowAddMs = 0; rt.slowUntilTick = undefined; }
    if (rt.hotUntilTick !== undefined && k >= rt.hotUntilTick) { rt.hotShare = 0; rt.hotUntilTick = undefined; }
    if (rt.deploy && k === rt.deploy.endTick) rt.warmProgress = Math.min(rt.warmProgress, 0.5);
  }
  for (let e = 0; e < L; e++) {
    const t = effLink(inputs, links[e], 'timeoutMs');
    w.tau[e] = t === undefined ? NaN : t;
  }

  // ───── bước 1: tải vào ─────
  const ov = inputs.loadProfileOverride;
  let lam0 = ov
    ? rpsAt(ov.profile, (k - ov.fromTick) * DT, c.durationSec)
    : rpsAt(c.load, k * DT, c.durationSec);
  lam0 *= inputs.loadMultiplier;
  if (c.options.noise && lam0 > 0) {
    const z = gauss(tickRng(c.seed, k, 1));
    const sigma = Math.min(0.05, 1 / Math.sqrt(Math.max(1, lam0 * DT)));
    lam0 *= Math.max(0, 1 + sigma * z);
  }
  const lamR0 = lam0 * readRatio;
  const lamW0 = lam0 - lamR0;

  // ───── bước 2: năng lực node ─────
  for (let i = 0; i < N; i++) {
    const nd = nodes[i];
    const rt = nrt[i];
    const enabled = boolParam(inputs, nd, 'enabled', true);
    w.enabled[i] = enabled ? 1 : 0;
    const replicas = Math.max(1, Math.round(numParam(inputs, nd, 'replicas', nd.spec.replicas)));
    w.replicas[i] = replicas;
    const restarting = rt.recoveringUntilTick !== undefined && k < rt.recoveringUntilTick;
    const rolling = rt.deploy !== undefined && k < rt.deploy.endTick;
    let repUp = replicas;
    if (!enabled || !rt.up || restarting) repUp = 0;
    else if (rolling) repUp = Math.max(0, replicas - 1);
    w.repUp[i] = repUp;
    const extraMs = rt.slowAddMs + (rt.deploy && rt.deploy.bad ? 150 : 0);
    const S = (nd.spec.latency.baseMs + extraMs) / 1000;
    w.sSec[i] = S;
    const pool = numParam(inputs, nd, 'poolSize', nd.conc0);
    const sizeF = numParam(inputs, nd, 'sizeFactor', 1);
    const muI = sizeF * Math.min(nd.spec.capacity.opsPerSec, S > 0 ? pool / S : Infinity);
    w.muI[i] = muI;
    const ramp = !rolling && rt.warmProgress < 1 ? 0.3 + 0.7 * rt.warmProgress : 1;
    const shards = shardsOf(inputs, nd);
    let mu = repUp * muI * ramp * shards;
    if (rt.hotShare > 0 && shards > 1) {
      const fHot = rt.hotShare + (1 - rt.hotShare) / shards;
      mu /= shards * fHot;
    }
    w.muTot[i] = mu;
    w.cEff[i] = Math.max(1, Math.round(mu * S));
    if (nd.kind === 'cache' || nd.kind === 'cdn') {
      w.hEff[i] = effectiveHit(hitTarget(cacheParams(inputs, nd)), rt.cacheWarm);
    } else w.hEff[i] = 0;
  }

  // reset link scratch
  w.a0r.fill(0); w.a0w.fill(0); w.rr.fill(0); w.A.fill(0); w.gate.fill(1); w.pullFlow.fill(0);
  w.mr.fill(0); w.mw.fill(0); w.mult.fill(0); w.replApplied.fill(0);
  w.att.fill(0); w.fin.fill(0); w.psucc.fill(1); w.psuccCond.fill(1); w.succL.fill(1);
  w.retryFrac.fill(1); w.pTo.fill(0); w.pDrop.fill(0); w.pHit.fill(0); w.rfLink.fill(0);
  // retry đến hạn tick này
  for (let e = 0; e < L; e++) {
    const l = links[e];
    if (!l.flow) continue;
    const bucket = lrt[e].retryRing[k % l.ringLen];
    let sum = 0;
    for (let j = 0; j < bucket.length; j++) sum += bucket[j];
    w.rr[e] = sum;
  }
  // phát hiện chết cho LB/DNS
  for (let i = 0; i < N; i++) {
    const nd = nodes[i];
    if (nd.kind !== 'lb' && nd.kind !== 'dns') continue;
    const rt = nrt[i];
    for (const e of nd.outFlow) {
      const t = links[e].to;
      const dead = w.enabled[t] === 1 && w.repUp[t] === 0;
      const id = links[e].id;
      if (dead) { if ((rt.lbKnownDown[id] ?? -1) < 0) rt.lbKnownDown[id] = k; } else rt.lbKnownDown[id] = -1;
    }
  }

  // ───── bước 3: FORWARD ─────
  let sumRetry = 0;
  const order = c.order;
  for (let oi = 0; oi < order.length; oi++) {
    const n = order[oi];
    const nd = nodes[n];
    const rt = nrt[n];
    let inR = 0;
    let inW = 0;
    if (nd.kind === 'client') {
      const share = numParam(inputs, nd, 'loadShare', 1 / c.clients.length);
      inR = lamR0 * share;
      inW = lamW0 * share;
    }
    // link vào (sync/async + pull)
    for (let pass = 0; pass < 2; pass++) {
      const list = pass === 0 ? nd.inFlow : nd.inPull;
      for (const e of list) {
        const l = links[e];
        const a0 = w.a0r[e] + w.a0w[e];
        const rr = w.rr[e];
        const A = a0 + rr;
        w.A[e] = A;
        sumRetry += rr;
        const lr = lrt[e];
        let g = 1;
        if (lr.partitioned || lr.breaker === 'open') g = 0;
        else {
          const bp = effLink(inputs, l, 'breaker');
          if (lr.breaker === 'half-open' && bp && A > 1e-9) g = Math.min(1, bp.probeRps / A);
          const mx = effLink(inputs, l, 'maxRps');
          if (mx !== undefined && A > 1e-9) g = Math.min(g, mx / A);
        }
        w.gate[e] = g;
        const rf = a0 > 1e-9 ? w.a0r[e] / a0
          : (l.spec.carries === 'r' ? 1 : l.spec.carries === 'w' ? 0 : readRatio);
        w.rfLink[e] = rf;
        inR += (w.a0r[e] + rr * rf) * g;
        inW += (w.a0w[e] + rr * (1 - rf)) * g;
      }
    }
    w.inR[n] = inR;
    w.inW[n] = inW;
    const lam = inR + inW;
    w.lam[n] = lam;
    const rfIn = lam > 1e-9 ? inR / lam : readRatio;
    w.rfIn[n] = rfIn;
    const mu = w.muTot[n];
    w.qPrev[n] = rt.queue;
    w.qCap[n] = mu > 0 ? mu * 5 : 1;

    let lim = 0;
    let drop = 0;
    let downRej = 0;
    let served = 0;
    let Qn = rt.queue;
    let outR = 0;
    let outW = 0;
    let drainFlow = -1;       // dùng cho node queue

    if (mu <= 0) {
      downRej = lam;
      Qn = 0;
      rt.queue = 0;
    } else if (nd.kind === 'rate-limiter') {
      const rate = numParam(inputs, nd, 'ratePerSec', 1000);
      const burst = numParam(inputs, nd, 'burst', 100);
      rt.tokens = Math.min(burst, rt.tokens + rate * DT);
      const admit = Math.min(lam, rt.tokens / DT, mu);
      rt.tokens -= admit * DT;
      if (rt.tokens < 0) rt.tokens = 0;
      lim = lam - admit;
      served = admit;
      Qn = 0;
    } else if (nd.kind === 'queue') {
      const maxDepth = numParam(inputs, nd, 'maxDepth', 100000);
      const backlog = rt.queue;
      let capSum = 0;
      let faultW = 0;
      for (const e of nd.outPull) {
        const t = links[e].to;
        const lr = lrt[e];
        const cap = lr.partitioned || w.enabled[t] === 0 ? 0 : w.muTot[t];
        w.pullFlow[e] = cap; // tạm: năng lực consumer, sau đó thay bằng lưu lượng thật
        capSum += cap;
        faultW += cap * nrt[t].faultErrorRate;
      }
      const enqPre = Math.min(lam, mu);
      const drain = Math.min(capSum, backlog / DT + enqPre);
      const enq = Math.min(enqPre, Math.max(0, (maxDepth - backlog) / DT) + drain);
      drop = lam - enq;
      const faultC = capSum > 0 ? faultW / capSum : 0;
      const dlq = boolParam(inputs, nd, 'dlq', false);
      const poison = dlq ? 0 : drain * faultC;
      Qn = Math.max(0, backlog + (enq - drain + poison) * DT);
      rt.queue = Qn;
      served = drain;
      drainFlow = drain;
      for (const e of nd.outPull) {
        const share = capSum > 0 ? w.pullFlow[e] / capSum : 0;
        const f = drain * share;
        w.pullFlow[e] = f;
        w.a0r[e] = f * rfIn;
        w.a0w[e] = f * (1 - rfIn);
      }
    } else {
      const qLimit = numParam(inputs, nd, 'queueLimit', mu * 5);
      const Qcap = Math.max(0, qLimit);
      w.qCap[n] = Qcap;
      served = Math.min(mu, lam + Qn / DT);
      let q2 = Qn + (lam - served) * DT;
      if (q2 < 0) q2 = 0;
      if (q2 > Qcap) { drop = (q2 - Qcap) / DT; q2 = Qcap; }
      Qn = q2;
      rt.queue = Qn;
    }
    w.lim[n] = lim;
    w.drop[n] = drop;
    w.downRej[n] = downRej;
    w.served[n] = served;
    w.servedR[n] = served * rfIn;
    w.servedW[n] = served - w.servedR[n];
    w.rho[n] = mu > 0 ? lam / mu : 0;
    w.qWait[n] = mu > 0 && nd.kind !== 'queue' ? (1000 * Qn) / mu : 0;

    // phân phối ra link đi ra
    const isCache = nd.kind === 'cache' || nd.kind === 'cdn';
    let lost = 0;
    if (drainFlow < 0 && served > 0) {
      let sf = 1;
      let missF = 1;
      if (isCache) {
        missF = 1 - w.hEff[n];
        if (boolParam(inputs, nd, 'singleflight', false)) {
          const cp = cacheParams(inputs, nd);
          const miss = w.servedR[n] * missF;
          const cap = singleflightCap(cp.workingSetKeys, rt.cacheWarm, cp.warmupSec);
          if (miss > cap && miss > 0) sf = cap / miss;
        }
      }
      outR = w.servedR[n] * missF * sf;
      outW = w.servedW[n];
    }
    if (nd.outFlow.length > 0) {
      lost = distribute(c, w, inputs, s, k, n, outR, outW);
    }
    w.lost[n] = lost;
  }

  // ───── bước 4: BACKWARD ─────
  const rev = c.rev;
  const kinds = new Float64Array(NK);
  for (let ri = 0; ri < rev.length; ri++) {
    const n = rev[ri];
    const nd = nodes[n];
    const rt = nrt[n];
    const mu = w.muTot[n];
    const lam = w.lam[n];
    const alive = mu > 0 || (nd.kind === 'client');
    let own: Dist;
    if (!alive) own = D_ZERO;
    else if (nd.kind === 'client' && nd.spec.latency.baseMs === 0) own = D_ZERO;
    else {
      const Smsv = w.sSec[n] * 1000;
      const cEff = w.cEff[n];
      const cv = nd.cv;
      const shards = shardsOf(inputs, nd);
      if (rt.hotShare > 0 && shards > 1) {
        const fHot = rt.hotShare + (1 - rt.hotShare) / shards;
        const rhoHot = w.rho[n];
        const rhoCold = rhoHot * ((1 - rt.hotShare) / (shards * fHot));
        own = dMix([
          { w: fHot, d: nodeDist(Smsv, rhoHot, cEff, cv, w.qWait[n]) },
          { w: 1 - fHot, d: nodeDist(Smsv, rhoCold, cEff, cv, 0) },
        ]);
      } else {
        own = nodeDist(Smsv, w.rho[n], cEff, cv, w.qWait[n]);
      }
    }
    w.own[n] = own;

    // lỗi cục bộ
    kinds.fill(0);
    let qLocal: number;
    if (!alive) {
      qLocal = 1;
      kinds[K_DOWN] = 1;
    } else if (lam > 1e-9) {
      const kd = w.drop[n] / lam;
      const kl = w.lim[n] / lam;
      const kdn = (w.downRej[n] + w.lost[n]) / lam;
      const fault = rt.faultErrorRate * Math.max(0, 1 - kd - kl - kdn);
      kinds[K_DROPPED] = kd; kinds[K_LIMITED] = kl; kinds[K_DOWN] = kdn; kinds[K_FAULT] = fault;
      qLocal = Math.min(1, kd + kl + kdn + fault);
    } else {
      kinds[K_FAULT] = rt.faultErrorRate;
      qLocal = rt.faultErrorRate;
    }

    // downstream
    let dsLat: Dist = D_ZERO;
    let dsSucc = 1;
    const dsKinds = w.tmpKinds;
    dsKinds.fill(0);
    const outs = nd.outFlow;
    if (outs.length > 0) {
      for (const e of outs) evalLink(c, w, inputs, e);
      dsSucc = combine(c, w, nd, outs, dsKinds, (v) => { dsLat = v; });
    }
    let nodeD: Dist = own;
    if (!alive) nodeD = D_FAIL0;
    else if (qLocal > 1e-12) {
      const failFast = Math.max(0, qLocal - kinds[K_FAULT]);
      nodeD = dMix([
        { w: 1 - qLocal, d: own },
        { w: failFast, d: D_FAIL0 },
        { w: kinds[K_FAULT], d: dMark(own, false) },
      ]);
    }
    w.sub[n] = outs.length > 0 ? dSerial(nodeD, dsLat) : nodeD;
    void dsSucc;
    w.succ[n] = dOkMass(w.sub[n]);
    for (let q = 0; q < NK; q++) w.fail[n * NK + q] = kinds[q] + (1 - qLocal) * dsKinds[q];
  }

  // ───── bước 5: retry, breaker ─────
  for (let e = 0; e < L; e++) {
    const l = links[e];
    if (!l.flow) continue;
    const lr = lrt[e];
    lr.lastPSucc = w.psucc[e];
    const rp = effLink(inputs, l, 'retry');
    const bucket = lr.retryRing[k % l.ringLen];
    if (rp && rp.max > 0) {
      const a0 = w.a0r[e] + w.a0w[e];
      const rRetry = w.att[e * NK + K_TIMEOUT] + w.att[e * NK + K_DROPPED] + w.att[e * NK + K_DOWN] + w.att[e * NK + K_FAULT]
        + (rp.retryOnLimited ? w.att[e * NK + K_LIMITED] : 0);
      // chỉ retry lỗi retryable
      const fails: number[] = [];
      let wanted = 0;
      const maxAtt = Math.min(rp.max, bucket.length);
      for (let j = 0; j < maxAtt; j++) {
        const Aj = j === 0 ? a0 : bucket[j - 1];
        const f = Aj * rRetry;
        fails.push(f);
        wanted += f;
      }
      let beta = 1;
      if (rp.budgetRatio !== undefined) {
        const cap = 10 * rp.budgetRatio * Math.max(a0, 1);
        lr.retryBudgetTokens = Math.min(cap, lr.retryBudgetTokens + rp.budgetRatio * a0 * DT);
        const allowed = Math.min(wanted, lr.retryBudgetTokens / DT);
        lr.retryBudgetTokens -= allowed * DT;
        beta = wanted > 1e-12 ? allowed / wanted : 1;
      }
      lr.retryBeta = beta;
      if (wanted > 1e-12 && lr.breaker !== 'open') {
        const shareTo = w.att[e * NK + K_TIMEOUT] / Math.max(1e-12, rRetry);
        const tauEff = Number.isNaN(w.tau[e]) ? clientTimeout : w.tau[e];
        const detect = shareTo * tauEff + (1 - shareTo) * l.netMs;
        for (let j = 0; j < maxAtt; j++) {
          const f = fails[j] * beta;
          if (f <= 0) continue;
          const bo = backoffMs(rp, j + 1);
          let lo: number;
          let hi: number;
          if (rp.jitter === 'none') { lo = hi = detect + bo; }
          else if (rp.jitter === 'full') { lo = detect; hi = detect + bo; }
          else { lo = detect + bo / 2; hi = detect + bo; }
          let b0 = Math.max(1, Math.ceil(lo / DT_MS - 1e-9));
          let b1 = Math.max(b0, Math.ceil(hi / DT_MS - 1e-9));
          if (b1 >= l.ringLen) b1 = l.ringLen - 1;
          if (b0 > b1) b0 = b1;
          const nb = b1 - b0 + 1;
          const per = f / nb;
          for (let b = b0; b <= b1; b++) lr.retryRing[(k + b) % l.ringLen][j] += per;
        }
      }
    } else {
      lr.retryBeta = 1;
    }
    for (let j = 0; j < bucket.length; j++) bucket[j] = 0;

    // breaker
    const bp = effLink(inputs, l, 'breaker');
    if (bp) {
      const A = w.A[e];
      if (lr.breaker === 'closed') {
        if (A >= bp.minRps) {
          const r = 1 - w.psucc[e];
          lr.breakerErrEwma += (r - lr.breakerErrEwma) * (DT / Math.max(DT, bp.windowSec));
          if (lr.breakerErrEwma >= bp.errorThreshold) {
            lr.breaker = 'open';
            lr.breakerOpenUntilTick = k + Math.round(bp.openSec / DT);
          }
        }
      } else if (lr.breaker === 'open') {
        if (lr.breakerOpenUntilTick !== undefined && k >= lr.breakerOpenUntilTick) {
          lr.breaker = 'half-open';
          lr.breakerProbeN = 0;
          lr.breakerProbeOk = 0;
        }
      } else {
        lr.breakerProbeN += 1;
        lr.breakerProbeOk += w.psuccCond[e];
        if (lr.breakerProbeN >= 20) {
          const ratio = lr.breakerProbeOk / lr.breakerProbeN;
          if (ratio >= bp.closeAfterOk) {
            lr.breaker = 'closed';
            lr.breakerErrEwma = 0;
          } else {
            lr.breaker = 'open';
            lr.breakerOpenUntilTick = k + Math.round(bp.openSec / DT);
          }
        }
      }
    }
  }

  // ───── bước 6: state ─────
  // replication lag
  const lagMsArr = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    const nd = nodes[n];
    const rt = nrt[n];
    if (nd.inRepl.length > 0) {
      const e = nd.inRepl[0];
      const P = links[e].from;
      const wP = w.servedW[P];
      const applyRps = numParam(inputs, nd, 'applyRps', 1000);
      const applyCap = applyRps * (1 - 0.5 * Math.min(1, w.rho[n]));
      const part = lrt[e].partitioned;
      const applied = part ? 0 : Math.min(rt.lagBacklogWrites / DT + wP, applyCap);
      rt.lagBacklogWrites = Math.max(0, rt.lagBacklogWrites + (wP - applied) * DT);
      w.replApplied[e] = applied;
      lagMsArr[n] = (1000 * rt.lagBacklogWrites) / Math.max(applyCap, 1) + links[e].netMs;
    }
  }
  // warm-up, cache, hysteresis, lb
  const warmStep = DT / NODE_WARM_SEC;
  for (let n = 0; n < N; n++) {
    const nd = nodes[n];
    const rt = nrt[n];
    const restarting = rt.recoveringUntilTick !== undefined && k < rt.recoveringUntilTick;
    const rolling = rt.deploy !== undefined && k < rt.deploy.endTick;
    if (rt.up && !restarting && !rolling && rt.warmProgress < 1) rt.warmProgress = Math.min(1, rt.warmProgress + warmStep);
    if (rt.recoveringUntilTick !== undefined && !restarting) rt.recoveringUntilTick = undefined;
    if (nd.kind === 'cache' || nd.kind === 'cdn') {
      stepCacheState(rt, cacheParams(inputs, nd), k + 1, rt.up && !restarting && w.enabled[n] === 1);
    }
    // state thô
    rt.rhoPrev = w.rho[n];
  }

  const stateOf = new Array<NodeState>(N);
  for (let n = 0; n < N; n++) {
    const rt = nrt[n];
    const restarting = rt.recoveringUntilTick !== undefined && k < rt.recoveringUntilTick;
    const rolling = rt.deploy !== undefined && k < rt.deploy.endTick;
    const lam = w.lam[n];
    let st: NodeState;
    if (w.enabled[n] === 0) { rt.stateShown = 'idle'; rt.stateHoldTicks = 0; stateOf[n] = 'idle'; continue; }
    if (!rt.up) st = 'down';
    else if (restarting || rolling || rt.warmProgress < 1) st = 'recovering';
    else {
      const rho = w.rho[n];
      const qCap = w.qCap[n] > 0 ? w.qCap[n] : 1;
      const errRate = lam > 1e-9 ? (w.drop[n] + w.lim[n] + w.downRej[n] + w.lost[n]) / lam : 0;
      let inTo = 0;
      for (const e of nodes[n].inFlow) inTo = Math.max(inTo, w.pTo[e]);
      let raw = 0;
      const qGrow = rt.queue > w.qPrev[n] + 1e-9;
      rt.overTicks = rho >= 1 ? rt.overTicks + 1 : 0;
      if (rho >= 1 && (rt.queue / qCap >= 0.5 || errRate >= 0.01 || inTo >= 0.01 || rt.overTicks >= OVERLOAD_HOLD_TICKS)) raw = 4;
      else if (rho >= 0.9 || (rho >= 0.8 && qGrow)) raw = 3;
      else if (rho >= 0.7) raw = 2;
      else if (rho >= 0.1) raw = 1;
      else raw = 0;
      const shown = LEVEL[rt.stateShown];
      if (rt.stateShown === 'down' || rt.stateShown === 'recovering' || raw >= shown) {
        st = LEVEL_NAME[raw];
        rt.stateHoldTicks = 0;
      } else {
        rt.stateHoldTicks++;
        if (rt.stateHoldTicks >= STATE_HOLD_TICKS && rho < ENTRY_RHO[shown] - 0.03) {
          st = LEVEL_NAME[shown - 1];
          rt.stateHoldTicks = 0;
        } else st = rt.stateShown;
      }
    }
    if (st === 'down' || st === 'recovering') rt.stateHoldTicks = 0;
    rt.stateShown = st;
    stateOf[n] = st;
  }

  // ───── bước 7: metrics, cost, packets, frame ─────
  let costPerHour = 0;
  for (let n = 0; n < N; n++) {
    const nd = nodes[n];
    if (w.enabled[n] === 0) continue;
    const sizeF = numParam(inputs, nd, 'sizeFactor', 1);
    costPerHour += w.replicas[n] * Math.pow(sizeF, 1.2) * nd.spec.costPerHour;
    if (nd.spec.costPerMillionReq) costPerHour += (nd.spec.costPerMillionReq * w.served[n] * 3600) / 1e6;
  }
  s.costCumUsd += (costPerHour * DT) / 3600;

  // root: gộp client
  let succRoot = 0;
  let wsum = 0;
  const rootKinds = new Float64Array(NK);
  const rootComps: { w: number; d: Dist }[] = [];
  for (const ci of c.clients) {
    const share = w.lam[ci] > 1e-9 ? w.lam[ci] : 1;
    wsum += share;
  }
  for (const ci of c.clients) {
    const share = (w.lam[ci] > 1e-9 ? w.lam[ci] : 1) / wsum;
    succRoot += share * w.succ[ci];
    for (let q = 0; q < NK; q++) rootKinds[q] += share * w.fail[ci * NK + q];
    rootComps.push({ w: share, d: w.sub[ci] });
  }
  const rootLat = rootComps.length === 1 ? rootComps[0].d : dMix(rootComps);
  const rootTrunc = dTruncate(rootLat, clientTimeout);
  const errE2E = Math.min(1, Math.max(0, 1 - dOkMass(rootTrunc)));
  const tailRoot = dMassBeyond(rootLat, clientTimeout);
  const failBefore = Math.max(0, 1 - succRoot);
  const keepRatio = failBefore > 1e-12 ? Math.max(0, failBefore - tailRoot.fail) / failBefore : 0;
  const errors: ErrorBreakdown = {
    timeout: rootKinds[K_TIMEOUT] * keepRatio + tailRoot.ok + tailRoot.fail,
    dropped: rootKinds[K_DROPPED] * keepRatio, limited: rootKinds[K_LIMITED] * keepRatio,
    down: rootKinds[K_DOWN] * keepRatio, fault: rootKinds[K_FAULT] * keepRatio, breaker: rootKinds[K_BREAKER] * keepRatio,
  };
  const observed = dSummary(rootTrunc);
  let sumA = 0;
  for (let e = 0; e < L; e++) if (links[e].flow) sumA += w.A[e];
  let queueTotal = 0;
  let inflight = 0;
  const nodeFrames: Record<string, NodeFrame> = {};
  const offered = lam0;
  for (let n = 0; n < N; n++) {
    const nd = nodes[n];
    const rt = nrt[n];
    const lam = w.lam[n];
    const st = stateOf[n];
    const qCap = w.qCap[n] > 0 ? w.qCap[n] : 1;
    const isQueue = nd.kind === 'queue';
    const queueVal = isQueue ? 0 : rt.queue;
    const infl = (w.served[n] * dMean(w.own[n])) / 1000;
    queueTotal += queueVal;
    inflight += infl;
    const errRate = lam > 1e-9
      ? Math.min(1, (w.drop[n] + w.lim[n] + w.downRej[n] + w.lost[n]) / lam + rt.faultErrorRate)
      : 0;
    const f: NodeFrame = {
      state: st,
      loadPct: Math.round(Math.min(1, w.rho[n]) * 100),
      rho: w.rho[n],
      lambda: lam,
      served: w.served[n],
      queue: queueVal,
      queuePct: isQueue ? 0 : Math.min(1, queueVal / qCap),
      queueWaitMs: w.qWait[n],
      inflight: infl,
      latency: dSummary(w.own[n]),
      subtreeLatency: dSummary(w.sub[n]),
      errorRate: errRate,
      dropped: w.drop[n],
      limited: w.lim[n],
      rejectedDown: w.downRej[n] + w.lost[n],
      replicasUp: w.repUp[n],
    };
    // trường theo kind
    if (nd.kind === 'cache' || nd.kind === 'cdn') { f.warm = rt.cacheWarm; f.hitRatio = w.hEff[n]; }
    else if (st === 'recovering') f.warm = rt.warmProgress;
    if (nd.inRepl.length > 0) {
      f.lagMs = lagMsArr[n];
      const hot = numParam(inputs, nd, 'rewriteHotness', 0.02);
      const shareRead = Math.min(1, w.servedR[n] / Math.max(1e-9, offered * readRatio));
      f.staleReadPct = Math.min(1, (lagMsArr[n] / 1000) * hot) * shareRead;
    }
    if (nd.kind === 'rate-limiter') f.tokens = rt.tokens;
    if (isQueue) {
      f.backlog = rt.queue;
      f.backlogAgeSec = rt.queue / Math.max(w.served[n], 1e-6);
      f.queuePct = Math.min(1, rt.queue / Math.max(1, numParam(inputs, nd, 'maxDepth', 100000)));
    }
    if (rt.hotShare > 0) f.hotShare = rt.hotShare;
    f.badge = badgeOf(nd, rt, st, f, w, n, nodes, links, lrt, k);
    nodeFrames[nd.id] = f;
  }

  // link frames + dữ liệu chấm
  const linkFrames: Record<string, LinkFrame> = {};
  const pk: PacketLinkInput = { A: w.A, rr: w.rr, pSucc: w.psucc, pTo: w.pTo, pDrop: w.pDrop, pHit: w.pHit };
  for (let e = 0; e < L; e++) {
    const l = links[e];
    const lr = lrt[e];
    let rps: number;
    let thr: number;
    let errR = 0;
    let toR = 0;
    let latMs: number;
    if (l.spec.mode === 'replicate') {
      rps = w.replApplied[e];
      thr = rps;
      latMs = lagMsArr[l.to];
      w.A[e] = rps;
    } else if (l.spec.mode === 'pull') {
      rps = w.pullFlow[e];
      thr = rps;
      latMs = dQuantile(w.sub[l.to], 0.5) + l.netMs;
      w.A[e] = rps;
    } else {
      rps = w.A[e];
      thr = rps * w.psucc[e];
      errR = rps > 1e-9 ? 1 - w.psucc[e] : 0;
      toR = w.att[e * NK + K_TIMEOUT];
      latMs = dQuantile(w.sub[l.to], 0.5) + l.netMs;
    }
    let style: LinkFrame['style'];
    if (lr.partitioned) style = 'cut';
    else if (l.spec.mode === 'replicate') style = 'heartbeat';
    else if (rps < 0.01) style = 'off';
    else if (errR > 0.2) style = 'danger';
    else if (l.spec.mode === 'async' || l.spec.mode === 'pull') style = 'dashed';
    else style = 'solid';
    const lf: LinkFrame = {
      rps, retryRps: w.rr[e], throughput: thr, errorRate: errR, timeoutRate: toR, latencyMs: latMs, style,
    };
    if (effLink(inputs, l, 'breaker')) lf.breaker = lr.breaker as BreakerState;
    linkFrames[l.id] = lf;
    if (l.flow && l.spec.mode === 'sync') {
      // chấm quay đầu sớm tại cache (link vào cache/cdn)
      const t = l.to;
      if (nodes[t].kind === 'cache' || nodes[t].kind === 'cdn') w.pHit[e] = w.hEff[t] * w.rfLink[e];
    }
  }
  stepPackets(c, s, k, pk);

  const frame: SimFrame = {
    tick: k,
    t: k * DT,
    nodes: nodeFrames,
    links: linkFrames,
    packets: visiblePackets(s),
    packetScale: s.packetScale,
    metrics: {
      offeredRps: offered,
      goodputRps: offered * (1 - errE2E),
      errorRate: errE2E,
      errors,
      latency: observed,
      retryRps: sumRetry,
      amplification: offered > 1e-9 ? sumA / offered : 0,
      queueTotal,
      inflight,
      costPerHour,
      costCumUsd: s.costCumUsd,
    },
    firedEvents: fired,
  };
  s.tick = k + 1;
  return frame;
}

// ───────────── phân phối lưu lượng ra link đi ra ─────────────
/** Trả về tốc độ request bị mất vì không còn backend sống (route split, Σw=0). */
function distribute(
  c: CompiledModel, w: Work, inputs: SimInputs, s: SimState, k: number, n: number, outR: number, outW: number,
): number {
  const nd = c.nodes[n];
  const rt = w.nrt[n];
  const links = c.links;
  const isCache = nd.kind === 'cache' || nd.kind === 'cdn';
  const missNom = isCache ? 1 - w.hEff[n] : 1;
  const rfUse = w.rfIn[n];
  let lost = 0;
  if (nd.route === 'split') {
    // cập nhật lbWeights (least-conn) một lần
    const algo = nd.kind === 'lb' || nd.kind === 'dns' ? strParam(inputs, nd, 'algorithm', 'round-robin') : 'weighted';
    const hcSec = nd.kind === 'dns' ? numParam(inputs, nd, 'ttlSec', 60) : numParam(inputs, nd, 'healthCheckSec', 3);
    const hcTicks = Math.round(hcSec / DT);
    if (algo === 'least-conn' && (nd.kind === 'lb' || nd.kind === 'dns')) {
      for (const e of nd.outFlow) {
        const l = links[e];
        const t = l.to;
        const mu = w.muTot[t];
        if (mu <= 0) continue;
        const target = mu * (1 - Math.min(0.95, w.nrt[t].rhoPrev));
        const prev = rt.lbWeights[l.id];
        rt.lbWeights[l.id] = prev === undefined ? target : prev + 0.3 * (target - prev);
      }
    }
    for (let cls = 0; cls < 2; cls++) {
      let total = 0;
      let hasCarry = false;
      const outs = nd.outFlow;
      // tổng trọng số
      for (const e of outs) {
        const cr = links[e].spec.carries ?? 'rw';
        if (!(cls === 0 ? cr !== 'w' : cr !== 'r')) continue;
        hasCarry = true;
        total += splitWeight(c, w, inputs, rt, nd, e, algo, hcTicks, k);
      }
      if (!hasCarry) continue;
      const flow = cls === 0 ? outR : outW;
      if (total <= 0) { lost += flow; continue; }
      for (const e of outs) {
        const l = links[e];
        const cr = l.spec.carries ?? 'rw';
        if (!(cls === 0 ? cr !== 'w' : cr !== 'r')) continue;
        const share = splitWeight(c, w, inputs, rt, nd, e, algo, hcTicks, k) / total;
        const calls = effLink(inputs, l, 'calls') ?? 1;
        const m = share * calls;
        if (cls === 0) {
          w.mr[e] = m; w.a0r[e] = outR * m;
        } else {
          w.mw[e] = m; w.a0w[e] = outW * m;
        }
      }
    }
    for (const e of nd.outFlow) {
      w.mult[e] = rfUse * w.mr[e] * (isCache ? missNom : 1) + (1 - rfUse) * w.mw[e];
    }
  } else {
    for (const e of nd.outFlow) {
      const l = links[e];
      const cr = l.spec.carries ?? 'rw';
      const frac = (effLink(inputs, l, 'fraction') ?? 1) * (effLink(inputs, l, 'calls') ?? 1);
      const tgtOn = w.enabled[l.to] === 1 ? 1 : 0;
      let mr = cr !== 'w' ? frac * tgtOn : 0;
      const mw = cr !== 'r' ? frac * tgtOn : 0;
      if (l.onMissOf >= 0) mr *= 1 - w.hEff[l.onMissOf];
      w.mr[e] = mr; w.mw[e] = mw;
      w.a0r[e] = outR * mr;
      w.a0w[e] = outW * mw;
      w.mult[e] = rfUse * mr * (isCache ? missNom : 1) + (1 - rfUse) * mw;
    }
  }
  void s;
  return lost;
}

function splitWeight(
  c: CompiledModel, w: Work, inputs: SimInputs, rt: NodeRuntime, nd: CNode, e: number, algo: string, hcTicks: number, k: number,
): number {
  const l = c.links[e];
  const t = l.to;
  if (w.enabled[t] === 0) return 0;
  const id = l.id;
  if (nd.kind === 'lb' || nd.kind === 'dns') {
    const kd = rt.lbKnownDown[id];
    if (kd !== undefined && kd >= 0 && k - kd >= hcTicks) return 0;
  }
  const lw = effLink(inputs, l, 'weight') ?? 1;
  if (nd.kind !== 'lb' && nd.kind !== 'dns') return lw;
  switch (algo) {
    case 'weighted':
    case 'ip-hash':
      return lw;
    case 'least-conn': {
      const cur = rt.lbWeights[id];
      return cur !== undefined ? cur : w.muTot[t] > 0 ? w.muTot[t] : 1;
    }
    default:
      return 1;
  }
}

// ───────────── BACKWARD: đánh giá 1 attempt trên link và ghép ─────────────
function evalLink(c: CompiledModel, w: Work, inputs: SimInputs, e: number): void {
  const l = c.links[e];
  const lr = w.lrt[e];
  const m = l.to;
  const net = l.netMs;
  const tauRaw = w.tau[e];
  const hasTau = !Number.isNaN(tauRaw);
  const g = w.gate[e];
  const base = e * NK;
  for (let q = 0; q < NK; q++) w.att[base + q] = 0;
  const sM = w.succ[m];
  const callee = w.sub[m];
  let latAtt: Dist;
  let gateKind = K_DROPPED;
  if (lr.breaker === 'half-open') gateKind = K_BREAKER;
  if (lr.partitioned) {
    w.att[base + K_TIMEOUT] = 1;
    latAtt = dPoint(hasTau ? tauRaw : c.clientTimeoutMs, false);
    w.pTo[e] = 1;
  } else if (lr.breaker === 'open') {
    w.att[base + K_BREAKER] = 1;
    latAtt = dPoint(net, false);
    w.pTo[e] = 0;
  } else {
    const lm0 = dShift(callee, net);
    const tail = hasTau ? dMassBeyond(lm0, tauRaw) : { ok: 0, fail: 0 };
    const failBefore = Math.max(0, 1 - sM);
    const survFail = Math.max(0, failBefore - tail.fail);
    const ratio = failBefore > 1e-12 ? survFail / failBefore : 0;
    w.att[base + K_TIMEOUT] += g * (tail.ok + tail.fail);
    for (let q = 0; q < NK; q++) w.att[base + q] += g * ratio * w.fail[m * NK + q];
    w.att[base + gateKind] += 1 - g;
    const trunc = hasTau ? dTruncate(lm0, tauRaw) : lm0;
    latAtt = g >= 1 - 1e-12 ? trunc : dMix([{ w: g, d: trunc }, { w: 1 - g, d: dPoint(net, false) }]);
    w.pTo[e] = w.att[base + K_TIMEOUT];
  }
  const psucc = dOkMass(latAtt);
  w.psucc[e] = psucc;
  w.psuccCond[e] = g > 1e-9 ? Math.min(1, psucc / g) : 0;
  w.pDrop[e] = w.att[base + K_DROPPED] + w.att[base + K_LIMITED];
  const r = Math.max(0, 1 - psucc);

  const rp = effLink(inputs, l, 'retry');
  const fb = effLink(inputs, l, 'fallback');
  let linkLat: Dist = latAtt;
  const fin = e * NK;
  if (rp && rp.max > 0 && r > 1e-12 && lr.breaker !== 'open') {
    const nonRetry = (rp.retryOnLimited ? 0 : w.att[base + K_LIMITED]) + w.att[base + K_BREAKER];
    const rRetry = Math.max(0, r - nonRetry);
    const rho = r > 1e-12 ? rRetry / r : 1;
    w.retryFrac[e] = rho;
    const det = hasTau ? tauRaw : dQuantile(latAtt, 0.99);
    const delays: number[] = [];
    let cum = 0;
    for (let j = 1; j <= rp.max; j++) {
      cum = det + backoffMs(rp, j) * (rp.jitter === 'none' ? 1 : rp.jitter === 'full' ? 0.5 : 0.75);
      delays.push(cum);
    }
    linkLat = dRetry(latAtt, delays, rho, lr.retryBeta);
    const F = Math.max(0, 1 - dOkMass(linkLat));
    const scale = F / r;
    for (let q = 0; q < NK; q++) w.fin[fin + q] = w.att[base + q] * scale;
  } else {
    w.retryFrac[e] = 1;
    for (let q = 0; q < NK; q++) w.fin[fin + q] = w.att[base + q];
  }
  let succL = dOkMass(linkLat);
  if (fb === 'bypass' || fb === 'degrade') {
    // người gọi vẫn thành công (ghi nhận degraded); độ trễ giữ nguyên
    linkLat = dMark(linkLat, true);
    succL = 1;
    for (let q = 0; q < NK; q++) w.fin[fin + q] = 0;
  }
  w.succL[e] = succL;
  w.latL[e] = linkLat;
}

/** Ghép các link đi ra theo route; trả succ downstream, điền dsKinds và độ trễ downstream. */
function combine(
  c: CompiledModel, w: Work, nd: CNode, outs: number[], dsKinds: Float64Array, setLat: (l: Dist) => void,
): number {
  const route = nd.route;
  if (route === 'split') {
    let tot = 0;
    for (const e of outs) tot += w.mult[e];
    const norm = tot > 1 ? tot : 1;
    const comps: { w: number; d: Dist }[] = [];
    let succ = 0;
    if (tot < 1) { comps.push({ w: 1 - tot, d: D_ZERO }); succ += 1 - tot; }
    for (const e of outs) {
      const m = w.mult[e];
      if (m <= 1e-9) continue;
      const wt = m / norm;
      comps.push({ w: wt, d: w.latL[e] });
      succ += wt * w.succL[e];
      for (let q = 0; q < NK; q++) dsKinds[q] += wt * w.fin[e * NK + q];
    }
    setLat(comps.length === 0 ? D_ZERO : comps.length === 1 ? comps[0].d : dMix(comps));
    return succ;
  }
  // all-sequential / all-parallel
  let prod = 1;
  let sumContrib = 0;
  const contrib: number[] = [];
  const used: number[] = [];
  const parts: Dist[] = [];
  for (const e of outs) {
    const m = route === 'all-parallel' ? (w.mult[e] > 1e-3 ? 1 : 0) : w.mult[e];
    if (m <= 1e-9) continue;
    const se = Math.pow(Math.max(0, w.succL[e]), m);
    prod *= se;
    const cb = 1 - se;
    contrib.push(cb);
    used.push(e);
    sumContrib += cb;
    parts.push(route === 'all-parallel' ? w.latL[e] : dScaleCalls(w.latL[e], m));
  }
  if (parts.length === 0) { setLat(D_ZERO); return 1; }
  if (route === 'all-parallel') setLat(dMax(parts));
  else {
    let acc = parts[0];
    for (let i = 1; i < parts.length; i++) acc = dSerial(acc, parts[i]);
    setLat(acc);
  }
  const totalFail = 1 - prod;
  if (totalFail > 1e-12 && sumContrib > 1e-12) {
    for (let i = 0; i < used.length; i++) {
      const e = used[i];
      const sf = 1 - w.succL[e];
      if (sf <= 1e-12) continue;
      const wgt = (totalFail * contrib[i]) / sumContrib;
      for (let q = 0; q < NK; q++) dsKinds[q] += wgt * (w.fin[e * NK + q] / sf);
    }
  }
  void c;
  return prod;
}

// ───────────── badge ─────────────
function badgeOf(
  nd: CNode, rt: NodeRuntime, st: NodeState, f: NodeFrame, w: Work, n: number,
  nodes: CNode[], links: CLink[], lrt: LinkRuntime[], k: number,
): NodeFrame['badge'] {
  const mk = (code: BadgeCode, tone: 'default' | 'ok' | 'warn' | 'bad', value?: number) =>
    (value === undefined ? { code, tone } : { code, tone, value });
  if (st === 'down') return mk('DOWN', 'bad');
  if (rt.deploy && rt.deploy.bad) return mk('BAD_DEPLOY', 'bad');
  if (rt.deploy && k < rt.deploy.endTick) return mk('DEPLOY', 'warn');
  if (nd.kind === 'cache' || nd.kind === 'cdn') {
    if (rt.cacheWarm < 0.5) return mk('COLD', 'warn', rt.cacheWarm);
    if (rt.cacheWarm < 0.95 && rt.cacheNextExpiryTick !== undefined) return mk('WARMING', 'warn', rt.cacheWarm);
  } else if (st === 'recovering') return mk('WARMING', 'warn', rt.warmProgress);
  if (f.queuePct >= 0.25) return mk('QUEUE', 'warn', f.queuePct);
  if (f.lagMs !== undefined && f.lagMs >= 200) return mk('LAG', 'warn', f.lagMs);
  if (f.limited > 0.01) return mk('LIMIT', 'warn', f.limited);
  if (rt.hotShare > 0) return mk('HOT', 'warn', rt.hotShare);
  if (rt.slowAddMs > 0) return mk('SLOW', 'warn', rt.slowAddMs);
  for (const e of nodes[n].inn) if (lrt[e].partitioned) return mk('PARTITION', 'bad');
  for (const e of nodes[n].out) if (lrt[e].partitioned) return mk('PARTITION', 'bad');
  void w; void links;
  return undefined;
}

// ───────────── Sim ─────────────
export interface Sim {
  readonly scenario: SimScenario;
  readonly compiled: CompiledModel;
  /** Tick sẽ chạy tiếp theo (= số tick đã chạy trên nhánh hiện tại). Sau `scrub(t)` = round(t/DT)+1. */
  readonly tick: number;
  readonly t: number;
  readonly inputLog: readonly InputRecord[];
  readonly state: SimState;
  readonly recorder: Recorder;
  /** +1 tick (100 ms). Đang ở quá khứ (sau scrub) thì chạy lại theo inputLog hiện hành. */
  step(): SimFrame;
  runUntil(tSec: number, onFrame?: (f: SimFrame) => void): SimFrame;
  /**
   * Áp tại tick hiện tại (có hiệu lực từ lần `step()` kế tiếp). Đang ở quá khứ ⇒ ghi đè tương lai:
   * cắt inputLog/checkpoint/ring/marker phía sau (04 §5.2).
   */
  setInput(change: InputChange): void;
  /** Đặt con trỏ tại t (tick k = round(t/DT), kẹp vào vùng còn lưu) và trả frame đầy đủ (có packets). */
  scrub(tSec: number): SimFrame;
  /** Frame của tick đã chạy gần nhất (hoặc null nếu chưa chạy). */
  frame(): SimFrame | null;
  reset(seed?: number): void;
  dispose(): void;
}

export function createSim(scenario: SimScenario): Sim {
  let c = compile(scenario);
  let state = createInitialState(c);
  let inputs: SimInputs = initialInputs();
  let logPtr = 0;
  let last: SimFrame | null = null;
  let rec = createRecorder(c, stepInPlace, createInitialState);

  const sim: Sim = {
    scenario,
    get compiled() { return c; },
    get tick() { return state.tick; },
    get t() { return state.tick * DT; },
    get inputLog() { return rec.log; },
    get state() { return state; },
    get recorder() { return rec; },
    step() {
      const ev: TimedEvent[] = [];
      logPtr = flushInputs(rec.log, logPtr, state.tick, inputs, ev);
      last = stepInPlace(c, state, inputs, ev);
      rec.push(last);
      rec.checkpointIfDue(state, inputs, logPtr);
      return last;
    },
    runUntil(tSec, onFrame) {
      const target = Math.round(tSec / DT);
      let f = last;
      while (state.tick < target) {
        f = sim.step();
        if (onFrame) onFrame(f);
      }
      return f ?? sim.step();
    },
    setInput(change) {
      if (state.tick < rec.length) {
        // đang ở quá khứ: cắt nhánh tương lai (log/ring/checkpoint/marker phía sau tick hiện tại)
        rec.truncate(state.tick);
        logPtr = Math.min(logPtr, rec.log.length);
      }
      rec.append({ tick: state.tick, change });
    },
    scrub(tSec) {
      if (rec.length === 0) return sim.step();
      const k = Math.min(rec.length - 1, Math.max(rec.earliestTick, Math.round(tSec / DT)));
      if (last && k === state.tick - 1) return last;
      const r = rec.restoreAt(k);
      state = r.state;
      inputs = r.inputs;
      logPtr = r.logPtr;
      last = r.frame;
      return r.frame;
    },
    frame() { return last; },
    reset(seed) {
      const sc = seed === undefined ? scenario : { ...scenario, seed };
      c = compile(sc);
      state = createInitialState(c);
      inputs = initialInputs();
      logPtr = 0;
      last = null;
      rec = createRecorder(c, stepInPlace, createInitialState);
    },
    dispose() { last = null; rec.clear(); },
  };
  return sim;
}
