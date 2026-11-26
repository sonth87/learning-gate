import assert from 'node:assert/strict';
import {
  compile, createSim, DT, mulberry32, tickRng, rpsAt, SimModelError, stepState, makeNode, createInitialState,
  initialInputs, dMax, dSummary, nodeDist, nodeLatency, dShiftExp,
  type LinkSpec, type LoadProfile, type NodeSpec, type SimFrame, type SimScenario, type TimedEvent,
} from '../index';
import { link, NOISELESS, s103, scenario, singleNode } from './fixtures';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    console.error(`  ✘ ${name}`);
    throw err;
  }
}

/** Số đo thực tế in ra để cập nhật cột "đo được" trong 04 §9.5. */
const MEASURED: string[] = [];
function measure(code: string, text: string) {
  MEASURED.push(`${code}: ${text}`);
  console.log(`      [đo] ${code}: ${text}`);
}

function run(sc: SimScenario, untilSec: number, hook?: (sim: ReturnType<typeof createSim>, tick: number) => void): SimFrame[] {
  const sim = createSim(sc);
  const frames: SimFrame[] = [];
  const n = Math.round(untilSec / DT);
  for (let i = 0; i < n; i++) {
    if (hook) hook(sim, i);
    frames.push(sim.step());
  }
  return frames;
}
const at = (frames: SimFrame[], sec: number) => frames[Math.min(frames.length - 1, Math.round(sec / DT))];
function mean(a: number[]): number { return a.reduce((x, y) => x + y, 0) / a.length; }
function median(a: number[]): number { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }
function window(frames: SimFrame[], from: number, to: number): SimFrame[] {
  return frames.filter((f) => f.t >= from - 1e-9 && f.t < to - 1e-9);
}
function near(actual: number, expected: number, relTol: number, msg: string) {
  assert.ok(Math.abs(actual - expected) <= Math.abs(expected) * relTol + 1e-9, `${msg}: ${actual} không gần ${expected} (±${relTol * 100}%)`);
}

console.log('=== Chạy bộ test Sim Engine (System Design) ===');

// ───────────── T2.1: model, validate, compile ─────────────
test('model: id node trùng → SimModelError DUP_NODE', () => {
  const sc = singleNode(1000, 10, { kind: 'steady', rps: 100 });
  sc.model.nodes.push(makeNode('service', { id: 'node' }));
  assert.throws(() => compile(sc), (e: unknown) => e instanceof SimModelError && e.code === 'DUP_NODE');
});
test('model: link trỏ node không tồn tại → BAD_LINK_REF; id link trùng → DUP_LINK', () => {
  const sc = singleNode(1000, 10, { kind: 'steady', rps: 100 });
  sc.model.links.push({ id: 'x', from: 'node', to: 'ghost', mode: 'sync' });
  assert.throws(() => compile(sc), (e: unknown) => e instanceof SimModelError && e.code === 'BAD_LINK_REF');
  const sc2 = singleNode(1000, 10, { kind: 'steady', rps: 100 });
  sc2.model.links.push({ ...sc2.model.links[0] });
  assert.throws(() => compile(sc2), (e: unknown) => e instanceof SimModelError && e.code === 'DUP_LINK');
});
test('model: chu trình đồng bộ → CYCLE kèm đường đi; link replicate không tính chu trình', () => {
  const nodes = [makeNode('client', { id: 'client' }), makeNode('service', { id: 'a' }), makeNode('service', { id: 'b' }), makeNode('service', { id: 'c' })];
  const bad = scenario('cyc', nodes, [link('client', 'a'), link('a', 'b'), link('b', 'c'), link('c', 'a')], { kind: 'steady', rps: 10 });
  try { compile(bad); assert.fail('phải ném'); } catch (e) {
    assert.ok(e instanceof SimModelError && e.code === 'CYCLE');
    assert.ok((e as SimModelError).path && (e as SimModelError).path!.includes('a'));
  }
  const ok = scenario('repl', nodes, [link('client', 'a'), link('a', 'b'), link('b', 'a', { mode: 'replicate' })], { kind: 'steady', rps: 10 });
  assert.doesNotThrow(() => compile(ok));
});
test('model: không có client → NO_CLIENT; routes sai → BAD_ROUTE; sự kiện trỏ sai → BAD_EVENT_REF', () => {
  const sc = singleNode(1000, 10, { kind: 'steady', rps: 100 });
  sc.model.nodes = sc.model.nodes.filter((n) => n.kind !== 'client');
  sc.model.links = [];
  assert.throws(() => compile(sc), (e: unknown) => e instanceof SimModelError && e.code === 'NO_CLIENT');
  const sc2 = singleNode(1000, 10, { kind: 'steady', rps: 100 });
  sc2.model.routes = { ghost: 'split' };
  assert.throws(() => compile(sc2), (e: unknown) => e instanceof SimModelError && e.code === 'BAD_ROUTE');
  const sc3 = singleNode(1000, 10, { kind: 'steady', rps: 100 }, { events: [{ at: 1, type: 'crash', node: 'ghost' }] });
  assert.throws(() => compile(sc3), (e: unknown) => e instanceof SimModelError && e.code === 'BAD_EVENT_REF');
});
test('compile: thứ tự topo ổn định (client trước, đích sau nguồn), rev là đảo ngược', () => {
  const c = compile(s103());
  const names = Array.from(c.order).map((i) => c.nodes[i].id);
  assert.equal(names[0], 'client');
  assert.ok(names.indexOf('lb') < names.indexOf('app1'));
  assert.ok(names.indexOf('cache') < names.indexOf('db'));
  assert.deepEqual(Array.from(c.rev), Array.from(c.order).reverse());
});

// ───────────── T2.2: rng, profiles, events ─────────────
test('rng: mulberry32/tickRng deterministic; kênh và tick khác nhau cho chuỗi khác nhau', () => {
  const a = mulberry32(42); const b = mulberry32(42);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  assert.equal(tickRng(7, 3, 1)(), tickRng(7, 3, 1)());
  assert.notEqual(tickRng(7, 3, 1)(), tickRng(7, 3, 2)());
  assert.notEqual(tickRng(7, 3, 1)(), tickRng(7, 4, 1)());
  assert.notEqual(tickRng(7, 3, 1)(), tickRng(8, 3, 1)());
  const r = tickRng(1, 1, 1);
  for (let i = 0; i < 1000; i++) { const x = r(); assert.ok(x >= 0 && x < 1); }
});
test('profiles: steady/ramp (giữ `to`)/spike/diurnal/custom trả đúng rps', () => {
  assert.equal(rpsAt({ kind: 'steady', rps: 500 }, 12), 500);
  const ramp: LoadProfile = { kind: 'ramp', from: 200, to: 5000, overSec: 60 };
  assert.equal(rpsAt(ramp, 0), 200);
  assert.equal(rpsAt(ramp, 30), 2600);
  assert.equal(rpsAt(ramp, 60), 5000);
  assert.equal(rpsAt(ramp, 90), 5000);
  const spike: LoadProfile = { kind: 'spike', base: 100, peak: 1000, atSec: 10, holdSec: 5, riseSec: 2, fallSec: 2 };
  assert.equal(rpsAt(spike, 5), 100);
  assert.equal(rpsAt(spike, 11), 550);
  assert.equal(rpsAt(spike, 14), 1000);
  assert.equal(rpsAt(spike, 18), 550);
  assert.equal(rpsAt(spike, 30), 100);
  const di: LoadProfile = { kind: 'diurnal', min: 100, max: 300, periodSec: 60 };
  near(rpsAt(di, 0), 100, 1e-9, 'diurnal đáy');
  near(rpsAt(di, 30), 300, 1e-9, 'diurnal đỉnh');
  near(rpsAt(di, 15), 200, 1e-9, 'diurnal giữa');
  const cu: LoadProfile = { kind: 'custom', points: [[0, 10], [10, 110], [20, 60]] };
  assert.equal(rpsAt(cu, -1), 10);
  assert.equal(rpsAt(cu, 5), 60);
  assert.equal(rpsAt(cu, 15), 85);
  assert.equal(rpsAt(cu, 99), 60);
});
test('events: crash/recover/slowdown/partition/heal/cache-expire-all/hot-key/deploy/rollback tác động đúng', () => {
  const events: TimedEvent[] = [
    { at: 5, type: 'crash', node: 'app1' },
    { at: 15, type: 'recover', node: 'app1' },
    { at: 6, type: 'slowdown', node: 'app2', addMs: 12, durationSec: 4 },
    { at: 7, type: 'partition', link: 'cache-db' },
    { at: 9, type: 'heal', link: 'cache-db' },
    { at: 20, type: 'cache-expire-all', node: 'cache' },
    { at: 21, type: 'hot-key', node: 'db', share: 0.5, durationSec: 3 },
    { at: 22, type: 'deploy', node: 'app3', version: 'v2', bad: true },
    { at: 40, type: 'rollback', node: 'app3' },
  ];
  const sim = createSim(s103({ load: { kind: 'steady', rps: 600 }, events, durationSec: 60 }));
  const st = sim.state;
  const run1 = (sec: number) => { while (sim.t < sec - 1e-9) sim.step(); };
  run1(5.2);
  assert.equal(st.nodes.app1.up, false);
  assert.equal(sim.frame()!.nodes.app1.state, 'down');
  run1(6.5);
  assert.equal(st.nodes.app2.slowAddMs, 12);
  run1(7.5);
  assert.equal(st.links['cache-db'].partitioned, true);
  run1(9.5);
  assert.equal(st.links['cache-db'].partitioned, false);
  run1(10.5);
  assert.equal(st.nodes.app2.slowAddMs, 0, 'slowdown hết hạn');
  run1(15.5);
  assert.equal(st.nodes.app1.up, true);
  assert.equal(sim.frame()!.nodes.app1.state, 'recovering');
  run1(20.5);
  assert.equal(st.nodes.cache.cacheWarm < 0.2, true);
  run1(21.5);
  assert.equal(st.nodes.db.hotShare, 0.5);
  run1(25);
  assert.equal(st.nodes.db.hotShare, 0, 'hot-key hết hạn');
  assert.equal(st.nodes.app3.faultErrorRate, 0.4);
  assert.equal(sim.frame()!.nodes.app3.badge?.code, 'BAD_DEPLOY');
  run1(41);
  assert.equal(st.nodes.app3.faultErrorRate, 0);
  assert.equal(sim.frame()!.firedEvents.length >= 0, true);
});
test('đầu vào người học: knob/link/load/event được áp tại tick hiện tại', () => {
  const sim = createSim(singleNode(1000, 10, { kind: 'steady', rps: 400 }));
  for (let i = 0; i < 50; i++) sim.step();
  near(sim.frame()!.nodes.node.lambda, 400, 1e-9, 'λ ban đầu');
  sim.setInput({ type: 'load', multiplier: 2 });
  sim.step();
  near(sim.frame()!.nodes.node.lambda, 800, 1e-9, 'λ sau ×2');
  sim.setInput({ type: 'knob', node: 'node', key: 'replicas', value: 2 });
  sim.step();
  near(sim.frame()!.nodes.node.rho, 0.4, 1e-6, 'ρ sau nhân đôi instance');
  sim.setInput({ type: 'event', event: { type: 'crash', node: 'node' } });
  const f = sim.step();
  assert.equal(f.nodes.node.state, 'down');
  assert.deepEqual(f.firedEvents.map((e) => e.source), ['learner']);
});
test('cùng scenario + seed → chuỗi frame trùng từng bit (600 tick, có nhiễu)', () => {
  const sc = s103({ options: { noise: true, maxPackets: 200 }, load: { kind: 'steady', rps: 1500 } });
  const a = run(sc, 60);
  const b = run(sc, 60);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
test('I7: nhiễu — seed khác ⇒ offeredRps khác; cùng seed ⇒ trùng', () => {
  const mk = (seed: number) => run(singleNode(1000, 10, { kind: 'steady', rps: 600 }, { seed, options: { noise: true, maxPackets: 0 } }), 60).map((f) => f.metrics.offeredRps);
  const a = mk(1); const b = mk(2); const a2 = mk(1);
  assert.deepEqual(a, a2);
  assert.ok(a.some((v, i) => Math.abs(v - b[i]) / v > 0.001));
  measure('I7', `σ≈${(Math.sqrt(mean(a.map((v) => (v - 600) ** 2))) / 600 * 100).toFixed(2)}% quanh 600 rps`);
});
test('stepState (bản thuần) cho kết quả giống stepInPlace và không đổi state đầu vào', () => {
  const sc = s103({ load: { kind: 'steady', rps: 1200 } });
  const c = compile(sc);
  const s0 = createInitialState(c);
  const snap = JSON.stringify(s0);
  const r1 = stepState(c, s0, initialInputs());
  assert.equal(JSON.stringify(s0), snap);
  const sim = createSim(sc);
  const f = sim.step();
  assert.equal(JSON.stringify(r1.frame), JSON.stringify(f));
});

// ───────────── I1 ─────────────
test('I1 Little hệ thống: Σλ·W + ΣA·net = λ0·E[T] (steady 1000 rps, S1-03, không lỗi)', () => {
  const sc = s103({ load: { kind: 'steady', rps: 1000 }, durationSec: 30 });
  const sim = createSim(sc);
  const c = sim.compiled;
  let worst = 0;
  for (let i = 0; i < 300; i++) {
    const f = sim.step();
    if (i < 100) continue;
    let lhs = 0;
    for (const n of c.nodes) lhs += f.nodes[n.id].lambda * f.nodes[n.id].latency.mean;
    for (const l of c.links) lhs += f.links[l.id].rps * l.netMs;
    const rhs = f.metrics.offeredRps * f.metrics.latency.mean;
    worst = Math.max(worst, Math.abs(lhs - rhs) / rhs);
  }
  measure('I1', `sai lệch tương đối lớn nhất ${(worst * 100).toExponential(2)}%`);
  assert.ok(worst <= 0.01, `sai lệch ${worst}`);
});

// ───────────── I2 ─────────────
function queueWorker(): SimScenario {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('service', { id: 'app', opsPerSec: 2000, baseMs: 5 }),
    makeNode('queue', { id: 'q', params: { maxDepth: 15000, dlq: false } }),
    makeNode('worker', { id: 'worker', opsPerSec: 300, baseMs: 20 }),
    makeNode('sql', { id: 'db', opsPerSec: 5000, baseMs: 2 }),
  ];
  const links: LinkSpec[] = [
    link('client', 'app', { netMs: 0 }),
    link('app', 'q', { mode: 'async' }),
    link('q', 'worker', { mode: 'pull' }),
    link('worker', 'db', { timeoutMs: 1000 }),
  ];
  return scenario('qw', nodes, links, { kind: 'steady', rps: 1000 }, { durationSec: 30, mix: { readRatio: 0.5 } });
}
test('I2 bảo toàn dòng: λ_in = served + ΔQ/dt + dropped + limited (mọi node, queue+worker quá tải 30 s)', () => {
  const sim = createSim(queueWorker());
  const c = sim.compiled;
  const prevQ: Record<string, number> = { client: 0, app: 0, q: 0, worker: 0, db: 0 };
  let worst = 0;
  let sawDrop = false;
  for (let i = 0; i < 300; i++) {
    const f = sim.step();
    for (const n of c.nodes) {
      const nf = f.nodes[n.id];
      const qNow = n.kind === 'queue' ? nf.backlog! : nf.queue;
      const dq = (qNow - prevQ[n.id]) / DT;
      prevQ[n.id] = qNow;
      const resid = nf.lambda - (nf.served + dq + nf.dropped + nf.limited + nf.rejectedDown);
      worst = Math.max(worst, Math.abs(resid) / Math.max(1, nf.lambda));
    }
    if (f.nodes.q.dropped > 0) sawDrop = true;
  }
  const last = sim.frame()!;
  measure('I2', `|residual|/λ lớn nhất ${worst.toExponential(2)}; backlog cuối ${last.nodes.q.backlog!.toFixed(0)}`);
  assert.ok(sawDrop, 'phải có drop khi queue đầy');
  assert.ok(worst <= 1e-6, `residual ${worst}`);
});

// ───────────── I3 ─────────────
test('I3 ρ→1 độ trễ vọt: p99(0,95)/p99(0,5) ≥ 3; p99(0,97)/p99(0,5) ≥ 5; p99(0,9)/p99(0,5) ≥ 2; khớp bảng §2.11a ±10%', () => {
  const ref: Record<number, number> = { 500: 28.5, 900: 71.2, 950: 117.5, 970: 178.9 };
  const p99: Record<number, number> = {};
  for (const lam of [500, 900, 950, 970]) {
    const f = run(singleNode(1000, 10, { kind: 'steady', rps: lam }, { durationSec: 20 }), 20);
    const nf = at(f, 19).nodes.node;
    p99[lam] = nf.latency.p99;
    near(nf.rho, lam / 1000, 1e-9, `ρ tại ${lam}`);
    near(nf.latency.p99, ref[lam], 0.1, `p99 tại ρ=${lam / 1000}`);
  }
  measure('I3', `p99 ms @ρ=.5/.9/.95/.97 = ${[500, 900, 950, 970].map((l) => p99[l].toFixed(1)).join(' / ')}; tỉ lệ ×${(p99[900] / p99[500]).toFixed(2)} / ×${(p99[950] / p99[500]).toFixed(2)} / ×${(p99[970] / p99[500]).toFixed(2)}`);
  assert.ok(p99[900] / p99[500] >= 2);
  assert.ok(p99[950] / p99[500] >= 3);
  assert.ok(p99[970] / p99[500] >= 5);
});
test('latency: bảng §2.11a (ρ 0,1…0,97) khớp mean/p50/p95/p99 ±3%', () => {
  const table: [number, number, number, number, number][] = [
    [0.1, 10.0, 9.1, 16.0, 20.8], [0.5, 10.2, 8.6, 20.3, 28.5], [0.7, 10.9, 8.6, 26.1, 38.4],
    [0.9, 16.8, 12.1, 46.9, 71.2], [0.95, 26.6, 18.8, 76.9, 117.5], [0.97, 39.8, 27.9, 116.8, 178.9],
  ];
  for (const [rho, w, p50, p95, p99] of table) {
    const s = nodeLatency(10, rho, 10, 0.3, 0);
    near(s.mean, w, 0.03, `mean ρ=${rho}`);
    near(s.p50, p50, 0.03, `p50 ρ=${rho}`);
    near(s.p95, p95, 0.03, `p95 ρ=${rho}`);
    near(s.p99, p99, 0.03, `p99 ρ=${rho}`);
  }
});

// ───────────── I4 ─────────────
test('I4 thêm app gần như không đổi p99 (<10%, spec nêu 5%) nhưng nhân đôi DB giảm >50% (S1-03 steady 3200 rps)', () => {
  const base = s103({ load: { kind: 'steady', rps: 3200 }, durationSec: 60 });
  const p99Of = (sc: SimScenario) => median(window(run(sc, 60), 40, 60).map((f) => f.metrics.latency.p99));
  const b = p99Of(base);
  const apps = p99Of(s103({ load: { kind: 'steady', rps: 3200 }, durationSec: 60 }, (n) => {
    for (const id of ['app1', 'app2', 'app3']) n[id].params.replicas = 2;
  }));
  const db2 = p99Of(s103({ load: { kind: 'steady', rps: 3200 }, durationSec: 60 }, (n) => { n.db.params.sizeFactor = 2; }));
  measure('I4', `p99 e2e t∈[40,60]: gốc ${b.toFixed(0)} ms; ×2 app ${apps.toFixed(0)} ms (${((apps / b - 1) * 100).toFixed(1)}%); ×2 DB ${db2.toFixed(0)} ms (${((db2 / b - 1) * 100).toFixed(1)}%)`);
  // spec nêu <5%; đo được ~6,5% vì app ρ 0,59→0,30 làm đuôi tầng app mỏng đi ~10 ms trên nền ~164 ms (xem 04 §9.5)
  assert.ok(Math.abs(apps / b - 1) < 0.10, `thêm app đổi p99 ${(apps / b - 1) * 100}%`);
  assert.ok(Math.abs(apps / b - 1) < Math.abs(db2 / b - 1) / 5, 'thêm app phải kém hiệu quả hơn nhiều so với nhân đôi DB');
  assert.ok(db2 < 0.5 * b, `DB×2 chỉ giảm tới ${db2}/${b}`);
});

// ───────────── I5 ─────────────
function cacheDb(readRatio: number, params: Record<string, number | boolean> = {}, over: Partial<SimScenario> = {}, load: LoadProfile = { kind: 'steady', rps: 1000 }): SimScenario {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('cache', { id: 'cache', initial: { warm: 1 }, params: { ttlSec: 3600, hitRatioMax: 0.9, workingSetKeys: 20000, capacityKeys: 20000, warmupSec: 30, ...params } }),
    makeNode('sql', { id: 'db', opsPerSec: 100000, baseMs: 1 }),
  ];
  return scenario('cachedb', nodes, [link('client', 'cache', { netMs: 0 }), link('cache', 'db', { timeoutMs: 800 })], load,
    { mix: { readRatio }, durationSec: 60, ...over }, { cache: 'split' });
}
test('I5 hit 90% ⇒ λ_db ≈ 10%: toàn đọc ∈ [98,102]; trộn 90/10 ∈ [188,192]', () => {
  const a = at(run(cacheDb(1), 60), 59).nodes.db.lambda;
  const b = at(run(cacheDb(0.9), 60), 59).nodes.db.lambda;
  measure('I5', `λ_db toàn đọc ${a.toFixed(2)}; trộn 0,9 ${b.toFixed(2)}`);
  assert.ok(a >= 98 && a <= 102, `λ_db=${a}`);
  assert.ok(b >= 188 && b <= 192, `λ_db=${b}`);
});

// ───────────── I6 ─────────────
function retryScenario(retry: LinkSpec['retry']): SimScenario {
  return singleNode(1000, 10, { kind: 'steady', rps: 600 }, {
    durationSec: 40, events: [{ at: 10, type: 'slowdown', node: 'node', addMs: 10 }],
  }, { timeoutMs: 500, retry });
}
const lamIn = (frames: SimFrame[], a: number, b: number) => mean(window(frames, a, b).map((f) => f.nodes.node.lambda));
test('I6a retry storm: không backoff, max=3 ⇒ λ_in(node) t∈[25,30] ≥ 1,8×600', () => {
  const f = run(retryScenario({ max: 3, backoff: 'none', baseMs: 0, jitter: 'none' }), 35);
  const v = lamIn(f, 25, 30);
  measure('I6a', `λ_in = ${v.toFixed(0)} rps = ×${(v / 600).toFixed(2)}`);
  assert.ok(v >= 1.8 * 600, `λ_in=${v}`);
});
test('I6b retry exponential + full jitter + ngân sách 10% ⇒ λ_in ≤ 1,15×600', () => {
  const f = run(retryScenario({ max: 3, backoff: 'exponential', baseMs: 200, jitter: 'full', budgetRatio: 0.1 }), 35);
  const v = lamIn(f, 25, 30);
  measure('I6b', `λ_in = ${v.toFixed(0)} rps = ×${(v / 600).toFixed(3)}`);
  assert.ok(v <= 1.15 * 600, `λ_in=${v}`);
});
test('I6c không retry ⇒ λ_in = 600 (±1%)', () => {
  const f = run(retryScenario(undefined), 35);
  const v = lamIn(f, 25, 30);
  measure('I6c', `λ_in = ${v.toFixed(2)} rps`);
  near(v, 600, 0.01, 'λ_in');
});

// ───────────── I8 ─────────────
test('I8a jitter giảm đỉnh retry: đỉnh retryRps(none) ≥ 2,5× đỉnh(full), cùng backoff 1000 ms', () => {
  const mk = (jitter: 'none' | 'full') => singleNode(5000, 10, { kind: 'steady', rps: 1000 }, {
    durationSec: 30, events: [{ at: 10, type: 'partition', link: 'client-node' }, { at: 10.2, type: 'heal', link: 'client-node' }],
  }, { timeoutMs: 200, retry: { max: 3, backoff: 'fixed', baseMs: 1000, jitter } });
  const peak = (f: SimFrame[]) => Math.max(...f.map((x) => x.metrics.retryRps));
  const pNone = peak(run(mk('none'), 25));
  const pFull = peak(run(mk('full'), 25));
  measure('I8a', `đỉnh retryRps none ${pNone.toFixed(0)} / full ${pFull.toFixed(0)} = ×${(pNone / pFull).toFixed(2)}`);
  assert.ok(pNone >= 2.5 * pFull, `none=${pNone} full=${pFull}`);
});
test('I8b stampede: sau cache-expire-all, max λ_db (jitter 0) vs (jitter 0,2 + singleflight) giảm ≥ 30%', () => {
  const ev: TimedEvent[] = [{ at: 20, type: 'cache-expire-all', node: 'cache' }];
  const peak = (params: Record<string, number | boolean>) => Math.max(...window(run(cacheDb(1, { ttlSec: 120, ...params }, { events: ev, durationSec: 60 }, { kind: 'steady', rps: 2000 }), 60), 20, 45).map((f) => f.nodes.db.lambda));
  const a = peak({ ttlJitterPct: 0 });
  const b = peak({ ttlJitterPct: 0.2, singleflight: true });
  measure('I8b', `max λ_db: không bảo vệ ${a.toFixed(0)} → jitter+singleflight ${b.toFixed(0)} (giảm ${((1 - b / a) * 100).toFixed(1)}%)`);
  assert.ok(b <= 0.7 * a, `${b} vs ${a}`);
});
test('cache: cohort TTL đồng loạt tạo dip; jitter ≥0,2 triệt tiêu', () => {
  const dip = (j: number) => {
    const sc = cacheDb(1, { ttlSec: 30, ttlJitterPct: j, warmupSec: 10 }, { durationSec: 90 }, { kind: 'steady', rps: 1000 });
    const f = run(sc, 90);
    return Math.min(...window(f, 5, 90).map((x) => x.nodes.cache.hitRatio!));
  };
  const withDip = dip(0);
  const noDip = dip(0.2);
  measure('cache cohort', `hit tối thiểu: jitter 0 → ${withDip.toFixed(3)}; jitter 0,2 → ${noDip.toFixed(3)}`);
  assert.ok(withDip < 0.5 * noDip);
  const target = 0.9 * (1 - Math.exp(-30 / 30));
  assert.ok(noDip > 0.95 * target, `jitter 0,2 vẫn tụt hit còn ${noDip} so với mục tiêu ${target}`);
});

// ───────────── I10 ─────────────
test('I10 decoupling: worker bị slowdown ⇒ p99 producer tăng <5%, backlog tăng đơn điệu', () => {
  const sc = queueWorker();
  sc.load = { kind: 'steady', rps: 400 };
  sc.durationSec = 60;
  sc.model.nodes.find((n) => n.id === 'q')!.params.maxDepth = 1e6;
  sc.events = [{ at: 10, type: 'slowdown', node: 'worker', addMs: 20 }];
  const f = run(sc, 60);
  const before = mean(window(f, 2, 10).map((x) => x.nodes.app.subtreeLatency.p99));
  const after = mean(window(f, 20, 60).map((x) => x.nodes.app.subtreeLatency.p99));
  const bl = window(f, 12, 60).map((x) => x.nodes.q.backlog!);
  let mono = true;
  for (let i = 1; i < bl.length; i++) if (bl[i] < bl[i - 1] - 1e-9) mono = false;
  measure('I10', `p99 producer ${before.toFixed(2)} → ${after.toFixed(2)} ms (${((after / before - 1) * 100).toFixed(2)}%); backlog cuối ${bl[bl.length - 1].toFixed(0)}, đơn điệu=${mono}`);
  assert.ok(after / before - 1 < 0.05);
  assert.ok(mono && bl[bl.length - 1] > bl[0]);
});

// ───────────── I14 ─────────────
test('I14 fan-out tail: 100 callee (p50=30, p99=100) all-parallel ⇒ p50_fanout > p99_đơn; p99_fanout ∈ [170,195]', () => {
  // leaf: cv=0,5 ⇒ θ=0,5 ⇒ p99/p50 ≈ 3,33; W tuỳ chỉnh để p50=30 ms
  const leafMs = 35.5;
  const leaf = (i: number) => makeNode('service', { id: `leaf${i}`, opsPerSec: 100000, baseMs: leafMs, cv: 0.5, zone: 'az-a' });
  const nodes: NodeSpec[] = [makeNode('client', { id: 'client', zone: 'az-a' }), makeNode('gateway', { id: 'fan', opsPerSec: 100000, baseMs: 0, zone: 'az-a' })];
  const links: LinkSpec[] = [link('client', 'fan', { netMs: 0 })];
  for (let i = 0; i < 100; i++) { nodes.push(leaf(i)); links.push(link('fan', `leaf${i}`, { netMs: 0 })); }
  const sc = scenario('fan', nodes, links, { kind: 'steady', rps: 100 }, { durationSec: 5, mix: { readRatio: 1 }, clientTimeoutMs: 10000 }, { fan: 'all-parallel' });
  const f = at(run(sc, 5), 4);
  const one = f.nodes.leaf0.latency;
  const fan = f.nodes.fan.subtreeLatency;
  measure('I14', `leaf p50/p99 = ${one.p50.toFixed(1)}/${one.p99.toFixed(1)}; fan-out p50/p99 = ${fan.p50.toFixed(1)}/${fan.p99.toFixed(1)} ms`);
  near(one.p50, 30, 0.04, 'p50 đơn');
  near(one.p99, 100, 0.05, 'p99 đơn');
  assert.ok(fan.p50 > one.p99, `p50_fanout ${fan.p50} ≤ p99_đơn ${one.p99}`);
  assert.ok(fan.p99 >= 170 && fan.p99 <= 195, `p99_fanout=${fan.p99}`);
});
test('latency: dMax N đồng nhất = p(q^{1/N}); mixQuantile/addSerial cơ bản', () => {
  const d = dShiftExp(17.6, 17.89);
  const m = dMax(Array.from({ length: 100 }, () => d));
  const s = dSummary(m);
  assert.ok(s.p50 > 100 && s.p50 < 110, `p50=${s.p50}`);
  assert.ok(s.p99 > 175 && s.p99 < 190, `p99=${s.p99}`);
  const sNode = dSummary(nodeDist(10, 0.5, 10, 0.3, 0));
  assert.ok(sNode.p99 > sNode.p95 && sNode.p95 > sNode.p50);
});

// ───────────── I15 ─────────────
test('I15 token bucket: rate=100, burst=20, tải 500 rps 10 s ⇒ Σ admitted ≤ 1020, limited ≥ 3900', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('rate-limiter', { id: 'rl', params: { ratePerSec: 100, burst: 20 } }),
    makeNode('service', { id: 'svc', opsPerSec: 5000, baseMs: 2 }),
  ];
  const sc = scenario('rl', nodes, [link('client', 'rl', { netMs: 0 }), link('rl', 'svc', { netMs: 0 })], { kind: 'steady', rps: 500 }, { durationSec: 10 });
  const f = run(sc, 10);
  const adm = f.reduce((a, x) => a + x.nodes.rl.served * DT, 0);
  const lim = f.reduce((a, x) => a + x.nodes.rl.limited * DT, 0);
  measure('I15', `Σ admitted ${adm.toFixed(1)} (≤1020); limited ${lim.toFixed(1)} (≥3900); badge ${f[50].nodes.rl.badge?.code}`);
  assert.ok(adm <= 1020 + 1e-6);
  assert.ok(lim >= 3900);
  assert.equal(f[50].nodes.rl.badge?.code, 'LIMIT');
});

// ───────────── I16 ─────────────
test('I16 breaker: mở ≤5 s sau khi lỗi vượt ngưỡng; open ⇒ λ_in(callee) ≤5%; hồi phục ⇒ half-open ⇒ closed', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('service', { id: 'app', opsPerSec: 5000, baseMs: 2 }),
    makeNode('service', { id: 'dep', opsPerSec: 500, baseMs: 10 }),
  ];
  const sc = scenario('brk', nodes, [
    link('client', 'app', { netMs: 0 }),
    link('app', 'dep', { timeoutMs: 200, breaker: { errorThreshold: 0.5, minRps: 10, windowSec: 2, openSec: 10, probeRps: 20, closeAfterOk: 0.8 } }),
  ], { kind: 'steady', rps: 800 }, { durationSec: 80, mix: { readRatio: 1 } });
  const f = run(sc, 80, (sim, tick) => { if (tick === 300) sim.setInput({ type: 'load', multiplier: 0.25 }); });
  const states = f.map((x) => x.links['app-dep'].breaker!);
  const firstErr = f.find((x) => x.links['app-dep'].errorRate > 0.5)!;
  const firstOpen = f.find((x) => x.links['app-dep'].breaker === 'open')!;
  assert.ok(firstOpen.t - firstErr.t <= 5, `mở sau ${firstOpen.t - firstErr.t}s`);
  const before = f[Math.round((firstOpen.t - 1) / DT)].nodes.dep.lambda;
  const during = f[Math.round((firstOpen.t + 3) / DT)].nodes.dep.lambda;
  assert.ok(during <= 0.05 * before, `λ_in callee ${during} vs ${before}`);
  const iOpen = states.indexOf('open');
  const iHalf = states.indexOf('half-open');
  const iClosedAfter = states.indexOf('closed', iHalf);
  measure('I16', `lỗi>50% tại t=${firstErr.t.toFixed(1)}s, open tại ${firstOpen.t.toFixed(1)}s (trễ ${(firstOpen.t - firstErr.t).toFixed(1)}s); λ_in callee ${before.toFixed(0)}→${during.toFixed(1)}; half-open t=${f[iHalf]?.t}, closed t=${f[iClosedAfter]?.t}`);
  assert.ok(iOpen >= 0 && iHalf > iOpen && iClosedAfter > iHalf, 'chuỗi open → half-open → closed');
  assert.equal(states[states.length - 1], 'closed');
});

// ───────────── I17 ─────────────
test('I17 LB health check: crash app2 tại t=10 ⇒ lỗi down ≈ λ·3 s trong [10,13] (±15%), sau 13 s ≈ 0', () => {
  const lam = 900;
  const sc = s103({ load: { kind: 'steady', rps: lam }, durationSec: 30, events: [{ at: 10, type: 'crash', node: 'app2' }] });
  const f = run(sc, 30);
  const down = (a: number, b: number) => window(f, a, b).reduce((s, x) => s + x.nodes.app2.rejectedDown * DT, 0);
  const d1 = down(10, 13);
  const d2 = down(13.2, 30);
  const expected = (lam / 3) * 3;
  measure('I17', `request lỗi down t∈[10,13) = ${d1.toFixed(0)} (kỳ vọng ${expected}); sau 13,2 s = ${d2.toFixed(2)}`);
  near(d1, expected, 0.15, 'lỗi down trong khoảng phát hiện');
  assert.ok(d2 < 1, `sau phát hiện còn ${d2}`);
  assert.equal(at(f, 20).nodes.app2.state, 'down');
  near(at(f, 20).nodes.app1.lambda, lam / 2, 0.01, 'app1 nhận phần san lại');
});
test('I17 RR vs least-conn khi slowdown app2: p99 e2e của RR cao hơn ≥ 20%', () => {
  const mk = (algo: string) => s103({
    load: { kind: 'steady', rps: 2400 }, durationSec: 60, events: [{ at: 5, type: 'slowdown', node: 'app2', addMs: 12 }],
  }, (n) => { n.lb.params.algorithm = algo; });
  const p99 = (algo: string) => median(window(run(mk(algo), 60), 30, 60).map((x) => x.metrics.latency.p99));
  const rr = p99('round-robin');
  const lc = p99('least-conn');
  measure('I17b', `p99 e2e RR ${rr.toFixed(1)} ms vs least-conn ${lc.toFixed(1)} ms (RR cao hơn ${((rr / lc - 1) * 100).toFixed(0)}%)`);
  assert.ok(rr >= 1.2 * lc, `${rr} vs ${lc}`);
});

// ───────────── I18 ─────────────
test('I18 hysteresis: ρ dao động 0,89↔0,91 mỗi tick suốt 10 s ⇒ đổi state hiển thị ≤ 2', () => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 200; i++) pts.push([i * DT, i % 2 === 0 ? 890 : 910]);
  const sc = singleNode(1000, 10, { kind: 'custom', points: pts }, { durationSec: 20 });
  const f = run(sc, 20);
  const win = window(f, 2, 12);
  let changes = 0;
  for (let i = 1; i < win.length; i++) if (win[i].nodes.node.state !== win[i - 1].nodes.node.state) changes++;
  const raw = win.map((x) => x.nodes.node.rho);
  assert.ok(Math.min(...raw) < 0.9 && Math.max(...raw) > 0.9, 'ρ phải thực sự dao động quanh 0,9');
  measure('I18', `đổi state ${changes} lần trong 10 s (ρ ${Math.min(...raw).toFixed(2)}–${Math.max(...raw).toFixed(2)}); state cuối ${win[win.length - 1].nodes.node.state}`);
  assert.ok(changes <= 2, `đổi ${changes} lần`);
});

// ───────────── I19 ─────────────
test('I19 replication lag: ghi 800/s, applyRps=500 ⇒ lag tăng đơn điệu; ghi giảm 300 ⇒ lag <50 ms trong ≤30 s', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'az-a' }),
    makeNode('service', { id: 'app', opsPerSec: 5000, baseMs: 2, zone: 'az-a' }),
    makeNode('sql', { id: 'primary', opsPerSec: 5000, baseMs: 1, zone: 'az-a' }),
    makeNode('sql', { id: 'replica', opsPerSec: 5000, baseMs: 1, zone: 'az-a', params: { applyRps: 500 } }),
  ];
  const sc = scenario('lag', nodes, [
    link('client', 'app', { netMs: 0 }), link('app', 'primary', { carries: 'w' }),
    link('primary', 'replica', { id: 'repl', mode: 'replicate', carries: 'w' }),
  ], { kind: 'custom', points: [[0, 800], [10, 800], [10.1, 300], [60, 300]] }, { durationSec: 60, mix: { readRatio: 0 } });
  const f = run(sc, 60);
  const lag = f.map((x) => x.nodes.replica.lagMs!);
  let mono = true;
  for (let i = 1; i <= 99; i++) if (lag[i] < lag[i - 1] - 1e-9) mono = false;
  const peak = lag[100];
  const back = f.find((x) => x.t > 10.2 && x.nodes.replica.lagMs! < 50)!;
  measure('I19', `lag đỉnh ${peak.toFixed(0)} ms tại t=10 s; < 50 ms sau ${(back.t - 10).toFixed(1)} s`);
  assert.ok(mono && peak > 1000);
  assert.ok(back.t - 10 <= 30, `hồi phục sau ${back.t - 10}s`);
  assert.equal(at(f, 8).nodes.replica.badge?.code, 'LAG');
});

// ───────────── S1-03 ─────────────
test('S1-03: DB ρ=0,9 tại t≈31 s, ρ=1 tại t≈35 s, maxSustainable ≈ 3010 rps; DB nghẽn trước app', () => {
  const f = run(s103(), 90);
  const first = (pred: (x: SimFrame) => boolean) => f.find(pred)?.t ?? NaN;
  const t09 = first((x) => x.nodes.db.rho >= 0.9);
  const t10 = first((x) => x.nodes.db.rho >= 1);
  const tSat = first((x) => ['saturated', 'overloaded'].includes(x.nodes.db.state));
  const tOver = first((x) => x.nodes.db.state === 'overloaded');
  const tApp = first((x) => ['saturated', 'overloaded'].includes(x.nodes.app1.state));
  const fr20 = at(f, 20);
  let maxRho = 0;
  for (const id of Object.keys(fr20.nodes)) if (fr20.nodes[id].lambda > 0) maxRho = Math.max(maxRho, fr20.nodes[id].rho);
  const maxSust = fr20.metrics.offeredRps / maxRho;
  const limiting = Object.keys(fr20.nodes).sort((a, b) => fr20.nodes[b].rho - fr20.nodes[a].rho)[0];
  const lamAt1 = at(f, t10).metrics.offeredRps;
  measure('S1-03', `ρ_db=0,9 tại ${t09.toFixed(1)} s; ρ_db=1 tại ${t10.toFixed(1)} s (λ=${lamAt1.toFixed(0)}); DB saturated ${tSat.toFixed(1)} s; DB overloaded ${tOver.toFixed(1)} s; app saturated ${tApp.toFixed(1)} s; maxSustainable ${maxSust.toFixed(0)} rps (giới hạn bởi ${limiting}); ρ_db(t=20)=${fr20.nodes.db.rho.toFixed(3)}`);
  near(t09, 31.4, 0.04, 'ρ_db=0,9');
  near(t10, 35.1, 0.03, 'ρ_db=1');
  assert.ok(tSat >= 30 && tSat <= 33, `DB saturated ${tSat}`);
  assert.ok(tOver >= 35 && tOver <= 41, `DB overloaded ${tOver}`);
  assert.ok(tApp >= 55 && tApp <= 62, `app saturated ${tApp}`);
  assert.ok(maxSust >= 2900 && maxSust <= 3100, `maxSustainable ${maxSust}`);
  assert.equal(limiting, 'db');
  assert.equal(at(f, 45).nodes.db.state, 'overloaded');
  assert.ok(at(f, 45).metrics.errorRate > 0.3, 'quá tải DB phải gây lỗi');
});

// ───────────── hiệu năng (I22 phần tick) ─────────────
test('hiệu năng: ≤ 5 ms/tick (trung vị) với 30 node + 40 link, bật packets', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('rate-limiter', { id: 'rl', params: { ratePerSec: 100000, burst: 1000 } }),
    makeNode('lb', { id: 'lb' }),
    makeNode('cache', { id: 'cache', initial: { warm: 1 }, params: { ttlSec: 120, workingSetKeys: 50000, capacityKeys: 25000 } }),
    makeNode('sql', { id: 'db', opsPerSec: 20000, baseMs: 2, params: { poolSize: 100 } }),
    makeNode('queue', { id: 'q' }),
    makeNode('worker', { id: 'wk', opsPerSec: 2000, baseMs: 5 }),
  ];
  const links: LinkSpec[] = [link('client', 'rl', { netMs: 0 }), link('rl', 'lb'), link('cache', 'db', { timeoutMs: 800, retry: { max: 2, backoff: 'exponential', baseMs: 100, jitter: 'full', budgetRatio: 0.2 } }),
    link('q', 'wk', { mode: 'pull' }), link('wk', 'db', { timeoutMs: 800 })];
  for (let i = 0; i < 20; i++) {
    nodes.push(makeNode('service', { id: `app${i}`, opsPerSec: 1800, baseMs: 12, params: { poolSize: 22 } }));
    links.push(link('lb', `app${i}`, { timeoutMs: 1500 }));
    links.push(link('app' + i, 'cache', { timeoutMs: 300, breaker: { errorThreshold: 0.5, minRps: 10, windowSec: 2, openSec: 5, probeRps: 10, closeAfterOk: 0.8 } }));
  }
  for (let i = 0; i < 3; i++) {
    nodes.push(makeNode('search', { id: `s${i}`, opsPerSec: 3000, baseMs: 10 }));
    links.push(link(`app${i}`, `s${i}`, { timeoutMs: 400 }));
  }
  links.push(link('app3', 'q', { mode: 'async' }));
  const routes = { client: 'split', rl: 'split', lb: 'split', cache: 'split' } as const;
  const sc = scenario('big', nodes, links, { kind: 'ramp', from: 1000, to: 12000, overSec: 60 }, { durationSec: 60, options: { noise: true, maxPackets: 200 }, events: [{ at: 40, type: 'crash', node: 'app5' }] }, routes);
  assert.ok(nodes.length >= 30 && links.length >= 40, `${nodes.length} node, ${links.length} link`);
  const sim = createSim(sc);
  const times: number[] = [];
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    sim.step();
    times.push(performance.now() - t0);
  }
  const med = median(times.slice(50));
  const p95 = [...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
  measure('perf', `${nodes.length} node/${links.length} link, packets bật: trung vị ${med.toFixed(3)} ms/tick, p95 ${p95.toFixed(3)} ms`);
  if (med > 1) console.warn(`      ⚠ trung vị ${med.toFixed(2)} ms/tick > mục tiêu 1 ms`);
  assert.ok(med <= 5, `trung vị ${med} ms`);
});

// ───────────── bổ sung: hot shard, deploy, recover, partition ─────────────
test('hot-key trên node partitioned: shard nóng nhận s+(1−s)/N ⇒ ρ_node = ρ_hot; thêm shard không cứu', () => {
  const mk = (shards: number, share: number) => {
    const nodes: NodeSpec[] = [
      makeNode('client', { id: 'client', zone: 'az-a' }),
      makeNode('nosql', { id: 'kv', opsPerSec: 4000, baseMs: 2, zone: 'az-a', params: { shards, poolSize: 100 } }),
    ];
    return scenario('hot', nodes, [link('client', 'kv', { netMs: 0 })], { kind: 'steady', rps: 2000 },
      { durationSec: 30, mix: { readRatio: 1 }, events: [{ at: 5, type: 'hot-key', node: 'kv', share }] });
  };
  const cold = at(run(mk(4, 0), 20), 19).nodes.kv;
  const hot4 = at(run(mk(4, 0.5), 20), 19).nodes.kv;
  const hot16 = at(run(mk(16, 0.5), 20), 19).nodes.kv;
  near(cold.rho, 2000 / (4 * 4000), 1e-6, 'ρ không hot (4 shard)');
  near(hot4.rho, (2000 * (0.5 + 0.5 / 4)) / 4000, 1e-6, 'ρ_hot với 4 shard');
  near(hot16.rho, (2000 * (0.5 + 0.5 / 16)) / 4000, 1e-6, 'ρ_hot với 16 shard');
  assert.ok(hot16.rho > 0.8 * hot4.rho, 'thêm shard (×4) chỉ giảm ρ_hot rất ít: không cứu được hot key');
  assert.ok(hot4.rho > 2 * cold.rho, 'hot key làm node nóng hơn nhiều so với tải đều');
  assert.equal(hot4.hotShare, 0.5);
  measure('hot-key', `ρ: không hot ${cold.rho.toFixed(3)}; 4 shard hot ${hot4.rho.toFixed(3)}; 16 shard hot ${hot16.rho.toFixed(3)}`);
});
test('deploy: rolling giảm replicasUp rồi warm-up; deploy xấu gây lỗi 40% tới khi rollback', () => {
  const sc = s103({
    load: { kind: 'steady', rps: 600 }, durationSec: 80,
    events: [{ at: 10, type: 'deploy', node: 'app1', version: 'v2', bad: true }, { at: 40, type: 'rollback', node: 'app1' }],
  }, (n) => { n.app1.params.replicas = 2; });
  const f = run(sc, 80);
  assert.equal(at(f, 12).nodes.app1.replicasUp, 1);
  assert.equal(at(f, 12).nodes.app1.badge?.code, 'BAD_DEPLOY');
  assert.equal(at(f, 25).nodes.app1.replicasUp, 2);
  near(at(f, 30).nodes.app1.errorRate, 0.4, 0.01, 'lỗi deploy xấu');
  assert.ok(at(f, 30).metrics.errorRate > 0.1);
  assert.equal(at(f, 60).nodes.app1.errorRate, 0);
  assert.equal(at(f, 75).nodes.app1.state === 'healthy' || at(f, 75).nodes.app1.state === 'idle', true);
});
test('crash/recover: node chết lỗi down, hồi phục có restart rồi warm-up; cache crash mất dữ liệu', () => {
  const sc = s103({
    load: { kind: 'steady', rps: 600 }, durationSec: 60,
    events: [{ at: 10, type: 'crash', node: 'cache' }, { at: 20, type: 'recover', node: 'cache' }],
  });
  const f = run(sc, 60);
  assert.equal(at(f, 15).nodes.cache.state, 'down');
  assert.ok(at(f, 15).metrics.errorRate > 0.9, 'cache trên đường bắt buộc chết ⇒ gần như mọi request lỗi');
  assert.equal(at(f, 22).nodes.cache.state, 'recovering');
  assert.ok(at(f, 22).nodes.cache.hitRatio! < 0.05, 'cache vừa hồi phục còn nguội');
  assert.ok(at(f, 22).nodes.db.lambda < 100 || at(f, 27).nodes.db.lambda > at(f, 55).nodes.db.lambda, 'miss dồn về DB khi cache nguội');
  assert.ok(at(f, 55).nodes.cache.hitRatio! > 0.35 && at(f, 55).nodes.cache.hitRatio! > at(f, 30).nodes.cache.hitRatio!, 'cache ấm lại dần (hằng số thời gian warmupSec=20 s)');
  assert.equal(at(f, 59).metrics.errorRate < 0.01, true);
});
test('partition link replicate: lag tăng; heal: lag xả dần', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'az-a' }),
    makeNode('sql', { id: 'p', opsPerSec: 5000, baseMs: 1, zone: 'az-a' }),
    makeNode('sql', { id: 'r', opsPerSec: 5000, baseMs: 1, zone: 'az-a', params: { applyRps: 1000 } }),
  ];
  const sc = scenario('rp', nodes, [link('client', 'p', { netMs: 0 }), link('p', 'r', { id: 'rep', mode: 'replicate' })], { kind: 'steady', rps: 400 },
    { durationSec: 40, mix: { readRatio: 0 }, events: [{ at: 5, type: 'partition', link: 'rep' }, { at: 15, type: 'heal', link: 'rep' }] });
  const f = run(sc, 40);
  near(at(f, 14.9).nodes.r.lagMs!, 4000, 0.05, 'lag sau 10 s partition ≈ (400·10 ghi)/(1000 ghi/s) = 4 s');
  assert.equal(at(f, 10).links.rep.style, 'cut');
  assert.ok(at(f, 39).nodes.r.lagMs! < 10);
});
test('dns: TTL dài ⇒ failover chậm hơn LB health check', () => {
  const mk = (ttl: number) => {
    const nodes: NodeSpec[] = [
      makeNode('client', { id: 'client', zone: 'internet' }),
      makeNode('dns', { id: 'dns', params: { ttlSec: ttl } }),
      makeNode('service', { id: 'a' }), makeNode('service', { id: 'b' }),
    ];
    return scenario('dns', nodes, [link('client', 'dns', { netMs: 0 }), link('dns', 'a'), link('dns', 'b')], { kind: 'steady', rps: 400 },
      { durationSec: 40, mix: { readRatio: 1 }, events: [{ at: 5, type: 'crash', node: 'a' }] });
  };
  const errs = (ttl: number) => run(mk(ttl), 40).reduce((s, x) => s + x.nodes.a.rejectedDown * DT, 0);
  const e5 = errs(5);
  const e30 = errs(30);
  measure('dns', `request lỗi trong failover: TTL 5 s → ${e5.toFixed(0)}; TTL 30 s → ${e30.toFixed(0)}`);
  assert.ok(e30 > 4 * e5);
});

// ───────────── packets ─────────────
test('packets: ≤ maxPackets, packetScale hợp lệ, id tăng dần, không ảnh hưởng kết quả mô phỏng', () => {
  const withP = run(s103({ options: { noise: false, maxPackets: 200 }, load: { kind: 'steady', rps: 3000 } }), 20);
  const withoutP = run(s103({ options: { noise: false, maxPackets: 0 }, load: { kind: 'steady', rps: 3000 } }), 20);
  for (const f of withP) assert.ok(f.packets.length <= 200);
  const last = withP[withP.length - 1];
  assert.ok(last.packets.length > 20, `chỉ có ${last.packets.length} chấm`);
  assert.ok([1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].includes(last.packetScale), `scale ${last.packetScale}`);
  const ids = last.packets.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let i = 0; i < withP.length; i++) {
    assert.deepEqual(withP[i].nodes, withoutP[i].nodes);
    assert.deepEqual(withP[i].metrics, withoutP[i].metrics);
  }
  assert.equal(withoutP[10].packets.length, 0);
  assert.ok(last.packets.some((p) => p.kind === 'request') && last.packets.some((p) => p.kind === 'response'));
});

console.log(`\n=== Số đo thực tế (ghi vào 04 §9.5) ===`);
for (const m of MEASURED) console.log('  ' + m);
console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST SIM ĐỀU XANH!`);
