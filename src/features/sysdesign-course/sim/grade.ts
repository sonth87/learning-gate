/**
 * Chấm bài (04 §7): `Constraint`, `evaluate` (thuần hàm) trên cửa sổ thời gian, và `simulate` headless.
 * Thuần TS; không phụ thuộc UI.
 */
import { findSpofs, structuralWarnings, type StructuralWarningCode } from './analyze';
import { createInitialState, stepInPlace } from './engine';
import { initialInputs } from './events';
import { compile, DT, type LinkId, type NodeId, type SimScenario, type SystemModel, type TimedEvent } from './model';
import { flushInputs, linkKey, nodeKey, type Recorder } from './recorder';
import type { InputRecord, NodeState, SimFrame } from './types';

export interface TimeWindow { fromSec: number; toSec: number }

export type StructuralRule =
  | 'no-spof' | 'stateful-has-replica' | 'has-timeout' | 'has-retry-backoff'
  | 'has-breaker' | 'has-dlq' | 'cache-has-jitter' | 'no-sync-cross-region-hot-path' | 'has-rate-limit';

export type Constraint =
  | { id: string; kind: 'slo-latency'; metric: 'p50' | 'p95' | 'p99'; maxMs: number;
      window: TimeWindow; allowViolationPct?: number }
  | { id: string; kind: 'slo-error'; maxRate: number; window: TimeWindow }
  | { id: string; kind: 'throughput'; minGoodputRps: number; window: TimeWindow }
  | { id: string; kind: 'cost'; maxPerHour: number; at?: 'end' | 'max' }
  | { id: string; kind: 'node-state'; node: NodeId; notIn: NodeState[]; window: TimeWindow; allowViolationPct?: number }
  | { id: string; kind: 'structural'; rule: StructuralRule; node?: NodeId; link?: LinkId };

export interface ConstraintResult {
  id: string;
  pass: boolean;
  actual: number | string | null;
  target: number | string;
  /** thời điểm tệ nhất (nút "xem trên mô phỏng") */
  worstAtSec?: number;
  messageKey: string;
}

/** Kết quả chạy dạng cột (Float64) để chấm; sinh bởi `simulate` hoặc `seriesFromRecorder`. */
export interface RunSeries {
  scenarioId: string;
  dt: number;
  /** số tick đã chạy: tick 0..ticks-1 */
  ticks: number;
  durationSec: number;
  t: Float64Array;
  offered: Float64Array;
  goodput: Float64Array;
  errorRate: Float64Array;
  p50: Float64Array;
  p95: Float64Array;
  p99: Float64Array;
  costPerHour: Float64Array;
  nodes: Record<NodeId, { rho: Float64Array; queue: Float64Array; lambda: Float64Array; state: Uint8Array }>;
  links: Record<LinkId, { rps: Float64Array; errorRate: Float64Array }>;
}

// ───────────── thu thập chuỗi ─────────────
function allocSeries(scenarioId: string, ticks: number, nodeIds: readonly string[], linkIds: readonly string[]): RunSeries {
  const f = () => new Float64Array(ticks);
  const nodes: RunSeries['nodes'] = {};
  for (const id of nodeIds) nodes[id] = { rho: f(), queue: f(), lambda: f(), state: new Uint8Array(ticks) };
  const links: RunSeries['links'] = {};
  for (const id of linkIds) links[id] = { rps: f(), errorRate: f() };
  return {
    scenarioId, dt: DT, ticks, durationSec: ticks * DT, t: f(), offered: f(), goodput: f(), errorRate: f(),
    p50: f(), p95: f(), p99: f(), costPerHour: f(), nodes, links,
  };
}

const STATE_CODE: Record<NodeState, number> = {
  idle: 0, healthy: 1, busy: 2, saturated: 3, overloaded: 4, down: 5, recovering: 6,
};

function put(run: RunSeries, k: number, fr: SimFrame): void {
  const m = fr.metrics;
  run.t[k] = fr.t;
  run.offered[k] = m.offeredRps;
  run.goodput[k] = m.goodputRps;
  run.errorRate[k] = m.errorRate;
  run.p50[k] = m.latency.p50;
  run.p95[k] = m.latency.p95;
  run.p99[k] = m.latency.p99;
  run.costPerHour[k] = m.costPerHour;
  for (const id in run.nodes) {
    const nf = fr.nodes[id];
    const s = run.nodes[id];
    s.rho[k] = nf.rho; s.queue[k] = nf.queue; s.lambda[k] = nf.lambda; s.state[k] = STATE_CODE[nf.state];
  }
  for (const id in run.links) {
    const lf = fr.links[id];
    const s = run.links[id];
    s.rps[k] = lf.rps; s.errorRate[k] = lf.errorRate;
  }
}

/**
 * Chạy headless `durationSec/DT` tick, không sinh packet (`maxPackets=0`), áp `changes` đúng tick của chúng.
 * Không dùng recorder (không cần scrub) nên rẻ hơn `createSim`.
 */
export function simulate(scenario: SimScenario, changes: readonly InputRecord[] = []): RunSeries {
  const sc: SimScenario = { ...scenario, options: { ...(scenario.options ?? {}), maxPackets: 0 } };
  const c = compile(sc);
  const state = createInitialState(c);
  const inputs = initialInputs();
  const log = changes.map((r, i) => ({ r, i })).sort((a, b) => a.r.tick - b.r.tick || a.i - b.i).map((x) => x.r);
  const ticks = Math.round(c.durationSec / DT);
  const run = allocSeries(scenario.id, ticks, c.nodes.map((n) => n.id), c.links.map((l) => l.id));
  let ptr = 0;
  for (let k = 0; k < ticks; k++) {
    const ev: TimedEvent[] = [];
    ptr = flushInputs(log, ptr, state.tick, inputs, ev);
    put(run, k, stepInPlace(c, state, inputs, ev));
  }
  return run;
}

/** Chuyển ring của recorder (Float32) thành RunSeries để chấm bài đang chạy trực tiếp. */
export function seriesFromRecorder(rec: Recorder, scenarioId = ''): RunSeries {
  const from = rec.firstTick;
  const n = rec.length - from;
  const conv = (key: string): Float64Array => Float64Array.from(rec.series(key));
  const nodeIds = new Set<string>();
  const linkIds = new Set<string>();
  for (const key of rec.keys) {
    const p = key.split(':');
    if (p[0] === 'node') nodeIds.add(p[1]);
    else if (p[0] === 'link') linkIds.add(p[1]);
  }
  const run = allocSeries(scenarioId, n, [...nodeIds], [...linkIds]);
  run.t = conv('t');
  run.offered = conv('offered'); run.goodput = conv('goodput'); run.errorRate = conv('errorRate');
  run.p50 = conv('p50'); run.p95 = conv('p95'); run.p99 = conv('p99'); run.costPerHour = conv('cost');
  for (const id of nodeIds) {
    run.nodes[id] = {
      rho: conv(nodeKey(id, 'rho')), queue: conv(nodeKey(id, 'queue')), lambda: conv(nodeKey(id, 'lambda')),
      state: Uint8Array.from(rec.series(nodeKey(id, 'state'))),
    };
  }
  for (const id of linkIds) run.links[id] = { rps: conv(linkKey(id, 'rps')), errorRate: conv(linkKey(id, 'errorRate')) };
  return run;
}

/** Model sau khi áp các thay đổi núm/link của người học (bỏ qua load/event). */
export function applyChangesToModel(model: SystemModel, changes: readonly InputRecord[]): SystemModel {
  const next: SystemModel = structuredClone(model);
  for (const r of changes) {
    const ch = r.change;
    if (ch.type === 'knob') {
      const n = next.nodes.find((x) => x.id === ch.node);
      if (n) {
        n.params[ch.key] = ch.value;
        if (ch.key === 'replicas' && typeof ch.value === 'number') n.replicas = ch.value;
      }
    } else if (ch.type === 'link') {
      const l = next.links.find((x) => x.id === ch.link);
      if (l) Object.assign(l, ch.patch);
    }
  }
  return next;
}

// ───────────── evaluate ─────────────
function percentile(sorted: Float64Array, q: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

/** Chỉ số tick [a, b) có t trong [fromSec, toSec); null nếu cửa sổ nằm ngoài phần đã chạy. */
function windowTicks(run: RunSeries, w: TimeWindow): { a: number; b: number } | null {
  const a = Math.max(0, Math.ceil(w.fromSec / run.dt - 1e-9));
  const b = Math.min(run.ticks, Math.ceil(w.toSec / run.dt - 1e-9));
  if (w.toSec > run.durationSec + 1e-9 || b <= a) return null;
  return { a, b };
}

const RULE_CODE: Record<Exclude<StructuralRule, 'no-spof'>, StructuralWarningCode> = {
  'stateful-has-replica': 'STATEFUL_NO_REPLICA',
  'has-timeout': 'NO_TIMEOUT',
  'has-retry-backoff': 'RETRY_NO_BACKOFF',
  'has-breaker': 'NO_BREAKER_ON_DEP',
  'has-dlq': 'QUEUE_NO_DLQ',
  'cache-has-jitter': 'CACHE_SYNC_TTL',
  'no-sync-cross-region-hot-path': 'SYNC_CROSS_REGION_HOT_PATH',
  'has-rate-limit': 'NO_RATE_LIMIT_AT_EDGE',
};

export function evaluate(constraints: readonly Constraint[], run: RunSeries, model: SystemModel): ConstraintResult[] {
  return constraints.map((c): ConstraintResult => {
    const notRun = (target: number | string): ConstraintResult =>
      ({ id: c.id, pass: false, actual: null, target, messageKey: 'window-not-run' });
    const key = (pass: boolean) => `grade.${c.kind}.${pass ? 'pass' : 'fail'}`;
    switch (c.kind) {
      case 'slo-latency': {
        const win = windowTicks(run, c.window);
        if (!win) return notRun(c.maxMs);
        const series = run[c.metric];
        let bad = 0;
        let worst = win.a;
        const vals = new Float64Array(win.b - win.a);
        for (let k = win.a; k < win.b; k++) {
          const v = series[k];
          vals[k - win.a] = v;
          if (v > c.maxMs) bad++;
          if (v > series[worst]) worst = k;
        }
        const pass = bad / (win.b - win.a) <= (c.allowViolationPct ?? 2) / 100 + 1e-12;
        vals.sort();
        return { id: c.id, pass, actual: percentile(vals, 0.95), target: c.maxMs, worstAtSec: run.t[worst], messageKey: key(pass) };
      }
      case 'slo-error': {
        const win = windowTicks(run, c.window);
        if (!win) return notRun(c.maxRate);
        let num = 0;
        let den = 0;
        let worst = win.a;
        for (let k = win.a; k < win.b; k++) {
          num += run.errorRate[k] * run.offered[k];
          den += run.offered[k];
          if (run.errorRate[k] > run.errorRate[worst]) worst = k;
        }
        const rate = den > 0 ? num / den : 0;
        const pass = rate <= c.maxRate;
        return { id: c.id, pass, actual: rate, target: c.maxRate, worstAtSec: run.t[worst], messageKey: key(pass) };
      }
      case 'throughput': {
        const win = windowTicks(run, c.window);
        if (!win) return notRun(c.minGoodputRps);
        let sum = 0;
        let worst = win.a;
        for (let k = win.a; k < win.b; k++) {
          sum += run.goodput[k];
          if (run.goodput[k] < run.goodput[worst]) worst = k;
        }
        const avg = sum / (win.b - win.a);
        const pass = avg >= c.minGoodputRps;
        return { id: c.id, pass, actual: avg, target: c.minGoodputRps, worstAtSec: run.t[worst], messageKey: key(pass) };
      }
      case 'cost': {
        if (run.ticks === 0) return notRun(c.maxPerHour);
        let at = run.ticks - 1;
        if (c.at === 'max') {
          at = 0;
          for (let k = 1; k < run.ticks; k++) if (run.costPerHour[k] > run.costPerHour[at]) at = k;
        }
        const v = run.costPerHour[at];
        const pass = v <= c.maxPerHour;
        return { id: c.id, pass, actual: v, target: c.maxPerHour, worstAtSec: run.t[at], messageKey: key(pass) };
      }
      case 'node-state': {
        const win = windowTicks(run, c.window);
        const s = run.nodes[c.node];
        if (!win || !s) return notRun(`${c.node}∉[${c.notIn.join(',')}]`);
        const banned = new Set(c.notIn.map((x) => STATE_CODE[x]));
        let bad = 0;
        let worst = -1;
        for (let k = win.a; k < win.b; k++) {
          if (banned.has(s.state[k])) {
            bad++;
            if (worst < 0 || s.rho[k] > s.rho[worst]) worst = k;
          }
        }
        const frac = bad / (win.b - win.a);
        const pass = frac <= (c.allowViolationPct ?? 2) / 100 + 1e-12;
        return {
          id: c.id, pass, actual: frac, target: (c.allowViolationPct ?? 2) / 100,
          worstAtSec: worst >= 0 ? run.t[worst] : undefined, messageKey: key(pass),
        };
      }
      case 'structural': {
        let offenders: number;
        if (c.rule === 'no-spof') {
          offenders = findSpofs(model).filter((s) => s.severity === 'error' && (!c.node || s.nodeId === c.node)).length;
        } else {
          const code = RULE_CODE[c.rule];
          offenders = structuralWarnings(model).filter((w) =>
            w.code === code && w.severity !== 'info'
            && (!c.node || w.nodeId === c.node) && (!c.link || w.linkId === c.link)).length;
        }
        const pass = offenders === 0;
        return { id: c.id, pass, actual: offenders, target: 0, messageKey: pass ? `grade.structural.${c.rule}.pass` : `grade.structural.${c.rule}.fail` };
      }
    }
  });
}

/** Tiện ích: chạy headless với `changes`, áp thay đổi vào model rồi chấm. */
export function runAndEvaluate(
  scenario: SimScenario, constraints: readonly Constraint[], changes: readonly InputRecord[] = [],
): { run: RunSeries; results: ConstraintResult[]; pass: boolean } {
  const run = simulate(scenario, changes);
  const results = evaluate(constraints, run, applyChangesToModel(scenario.model, changes));
  return { run, results, pass: results.every((r) => r.pass) };
}
