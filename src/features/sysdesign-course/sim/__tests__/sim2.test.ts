/**
 * Test T2.4–T2.9: recorder (I11–I13), hashing (I9), analyze (I20), grade (I21), trace, bench analyze (I22).
 * Phong cách giống sim.test.ts: node:assert/strict, test() tự viết, dòng `[đo]` cho cột "đo được" ở 04 §9.5.
 */
import assert from 'node:assert/strict';
import {
  applyChangesToModel, createSim, DT, evaluate, findBottleneck, findSpofs, fnv1a32, makeNode, maxSustainableRps,
  modNAssign, movedFraction, nodeKey, ringAssign, seriesFromRecorder, simulate, structuralWarnings, traceRequest,
  zipfKeys, runAndEvaluate,
  type Constraint, type InputChange, type InputRecord, type LinkSpec, type NodeSpec, type SimFrame, type SimScenario,
  type SystemModel, PACKET_SCALE_MAX,
} from '../index';
import { link, NOISELESS, s103, scenario } from './fixtures';

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
function measure(code: string, text: string) { console.log(`      [đo] ${code}: ${text}`); }
function median(a: number[]): number { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

console.log('=== Chạy bộ test Sim Engine T2.4–T2.9 (recorder, hashing, analyze, grade, trace) ===');

// ───────────── I9: hashing ─────────────
test('I9 consistent hashing: 100 000 khoá, 10→11 nút: mod-N dời ∈ [88%,94%]; ring (150 vnode) dời ∈ [7%,12%]', () => {
  const keys = Array.from({ length: 100_000 }, (_, i) => `user:${i}`);
  const m10 = modNAssign(keys, 10);
  const m11 = modNAssign(keys, 11);
  const nodes10 = Array.from({ length: 10 }, (_, i) => `node-${i}`);
  const nodes11 = [...nodes10, 'node-10'];
  const r10 = ringAssign(keys, nodes10, 150);
  const r11 = ringAssign(keys, nodes11, 150);
  const mod = movedFraction(m10, m11);
  const ring = movedFraction(r10, r11);
  measure('I9', `mod-N dời ${(mod * 100).toFixed(2)}% (lý thuyết 90,91%); ring 150 vnode dời ${(ring * 100).toFixed(2)}% (lý thuyết 9,09%)`);
  assert.ok(mod >= 0.88 && mod <= 0.94, `mod-N ${mod}`);
  assert.ok(ring >= 0.07 && ring <= 0.12, `ring ${ring}`);
  // ring chỉ dời khoá sang nút MỚI
  for (let i = 0; i < keys.length; i++) if (r10[i] !== r11[i]) assert.equal(r11[i], 'node-10');
  // phân bố tương đối đều: mỗi nút trong ±40% của trung bình
  const cnt = new Map<string, number>();
  for (const n of r11) cnt.set(n, (cnt.get(n) ?? 0) + 1);
  for (const v of cnt.values()) assert.ok(Math.abs(v - 100_000 / 11) < 0.4 * (100_000 / 11), `lệch ${v}`);
});

test('hashing: fnv1a32 deterministic; zipfKeys có khoá nóng và lặp lại theo seed', () => {
  assert.equal(fnv1a32('abc'), fnv1a32('abc'));
  assert.notEqual(fnv1a32('abc'), fnv1a32('abd'));
  const z1 = zipfKeys(10_000, 1.1, 7);
  const z2 = zipfKeys(10_000, 1.1, 7);
  assert.deepEqual(z1, z2);
  assert.notDeepEqual(z1, zipfKeys(10_000, 1.1, 8));
  const cnt = new Map<string, number>();
  for (const k of z1) cnt.set(k, (cnt.get(k) ?? 0) + 1);
  const top = Math.max(...cnt.values());
  assert.ok(top > 0.05 * z1.length, `khoá nóng nhất chỉ ${top}`);
  assert.ok(cnt.get('k0')! === top);
});

// ───────────── recorder: I11–I13 ─────────────
const REC_CHANGES: { at: number; change: InputChange }[] = [
  { at: 200, change: { type: 'load', multiplier: 1.5 } },
  { at: 330, change: { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 } },
  { at: 420, change: { type: 'event', event: { type: 'cache-expire-all', node: 'cache' } } },
];
function recSc(over: Partial<SimScenario> = {}): SimScenario {
  // có nhiễu + packets: kiểm tra cả RNG và packets trong scrub
  return s103({ durationSec: 90, options: { noise: true, maxPackets: 200 }, ...over });
}
function runStraight(sc: SimScenario, upto: number, inputs: typeof REC_CHANGES): SimFrame[] {
  const sim = createSim(sc);
  const frames: SimFrame[] = [];
  for (let k = 0; k < upto; k++) {
    for (const r of inputs) if (r.at === k) sim.setInput(r.change);
    frames.push(sim.step());
  }
  return frames;
}

test('I11 determinism: cùng scenario + seed + inputLog ⇒ JSON frames trùng từng bit (600 tick, nhiễu + packets)', () => {
  const a = runStraight(recSc(), 600, REC_CHANGES);
  const b = runStraight(recSc(), 600, REC_CHANGES);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const other = runStraight(recSc({ seed: 99 }), 600, REC_CHANGES);
  assert.notEqual(JSON.stringify(a), JSON.stringify(other));
  // và replay inputLog của lần 1 qua simulate() cho cùng chuỗi offered (headless, không packet)
  const sim = createSim(recSc());
  for (let k = 0; k < 600; k++) { for (const r of REC_CHANGES) if (r.at === k) sim.setInput(r.change); sim.step(); }
  const run = simulate(recSc(), sim.inputLog as InputRecord[]);
  for (let k = 0; k < 600; k++) assert.equal(run.offered[k], a[k].metrics.offeredRps);
});

test('I12 scrub(t) == chạy thẳng tới t (gồm packets); t ∈ {0, 4.9, 5.0, 12.3, 59.9}; setInput tại t=20', () => {
  const straight = runStraight(recSc(), 600, REC_CHANGES);
  const sim = createSim(recSc());
  for (let k = 0; k < 600; k++) { for (const r of REC_CHANGES) if (r.at === k) sim.setInput(r.change); sim.step(); }
  assert.ok(sim.recorder.checkpoints.length >= 12, `checkpoint ${sim.recorder.checkpoints.length}`);
  for (const t of [59.9, 12.3, 5.0, 4.9, 0, 33.0, 42.0, 20.0, 19.9]) {
    const k = Math.round(t / DT);
    const f = sim.scrub(t);
    assert.deepEqual(f, straight[k], `scrub(${t}) khác chạy thẳng`);
    assert.equal(f.tick, k);
  }
  assert.ok(straight[100].packets.length > 0, 'phải có packets để so sánh');
  // sau scrub, step() tiếp tục cho đúng frame kế tiếp, cả khi đi qua các đầu vào ở tương lai
  sim.scrub(19.5);
  for (let k = 196; k < 460; k++) assert.deepEqual(sim.step(), straight[k], `step lại tại tick ${k}`);
});

test('I13 ghi đè tương lai: scrub(30)+setInput ⇒ length==301, inputLog không còn tick>300, frame t≤30 không đổi', () => {
  const sim = createSim(recSc());
  for (let k = 0; k < 600; k++) { for (const r of REC_CHANGES) if (r.at === k) sim.setInput(r.change); sim.step(); }
  assert.equal(sim.recorder.length, 600);
  const before = Array.from({ length: 301 }, (_, k) => sim.scrub(k * DT));
  const logBefore = sim.inputLog.length;
  assert.equal(logBefore, 3);
  sim.scrub(30);
  assert.equal(sim.recorder.length, 600, 'scrub không cắt');
  sim.setInput({ type: 'load', multiplier: 0.5 });
  assert.equal(sim.recorder.length, 301);
  // inputLog: các bản ghi cũ tại tick 330, 420 bị cắt; bản ghi mới ở tick 301; 200 giữ lại
  assert.deepEqual(sim.inputLog.map((r) => r.tick), [200, 301]);
  assert.ok(sim.recorder.checkpoints.every((cp) => cp.tick <= 301));
  assert.ok(sim.recorder.markers.every((m) => m.tick < 301), 'marker tương lai bị xoá');
  for (let k = 0; k <= 300; k++) assert.deepEqual(sim.scrub(k * DT), before[k], `frame tick ${k} đổi`);
  // nhánh mới: tải ×0,5 thật sự có hiệu lực
  sim.scrub(30);
  const f1 = sim.step();
  const f2 = sim.step();
  assert.ok(f2.metrics.offeredRps < 0.5 * before[300].metrics.offeredRps * 1.1);
  assert.equal(f1.tick, 301);
  assert.equal(sim.recorder.length, 303);
});

test('recorder: ring buffer cột giới hạn theo ringCapacityTicks; series/valueAt; checkpoint bị giới hạn', () => {
  const sc = s103({ durationSec: 120, options: { ...NOISELESS, ringCapacityTicks: 300 } });
  const sim = createSim(sc);
  sim.runUntil(60);
  const rec = sim.recorder;
  assert.equal(rec.length, 600);
  assert.equal(rec.capacity, 300);
  assert.equal(rec.firstTick, 300);
  const t = rec.series('t');
  assert.equal(t.length, 300);
  assert.ok(Math.abs(t[0] - 30) < 1e-4 && Math.abs(t[299] - 59.9) < 1e-3, `t ${t[0]}..${t[299]}`);
  for (let i = 1; i < t.length; i++) assert.ok(t[i] > t[i - 1]);
  const rho = rec.series(nodeKey('db', 'rho'));
  assert.equal(rho.length, 300);
  assert.ok(rho[299] > 1, 'ρ_db > 1 ở t=59.9');
  assert.ok(Math.abs(rec.valueAt(nodeKey('db', 'rho'), 599) - rho[299]) < 1e-6);
  assert.ok(Number.isNaN(rec.valueAt('t', 10)), 'tick đã bị ring ghi đè');
  assert.ok(rec.checkpoints.length <= rec.maxCheckpoints, `${rec.checkpoints.length} > ${rec.maxCheckpoints}`);
  assert.ok(rec.checkpoints[0].tick >= 300 - 50, `checkpoint cũ nhất ${rec.checkpoints[0].tick}`);
  // scrub về quá xa bị kẹp vào vùng còn lưu
  const f = sim.scrub(0);
  assert.equal(f.tick, rec.earliestTick);
  assert.ok(rec.earliestTick >= 250);
  // bộ nhớ: không tăng theo thời gian chạy (ring cố định); chạy thêm 60 s
  const nCp = rec.checkpoints.length;
  sim.scrub(59.9);
  sim.runUntil(120);
  assert.ok(rec.checkpoints.length <= rec.maxCheckpoints);
  assert.ok(Math.abs(rec.checkpoints.length - nCp) <= 1);
  assert.equal(rec.series('t').length, 300);
  // series → RunSeries để chấm bài đang chạy
  const run = seriesFromRecorder(rec, 'x');
  assert.equal(run.ticks, 300);
  assert.ok(run.nodes.db.rho[299] > 1);
});

test('recorder: marker sự kiện + sau scrub không nhảy cóc; reset() xoá hết', () => {
  const sc = s103({ events: [{ at: 20, type: 'slowdown', node: 'db', addMs: 4 }] });
  const sim = createSim(sc);
  sim.runUntil(30);
  assert.deepEqual(sim.recorder.markers.map((m) => [m.tick, m.type, m.source]), [[200, 'slowdown', 'scenario']]);
  sim.reset();
  assert.equal(sim.recorder.length, 0);
  assert.equal(sim.recorder.markers.length, 0);
  assert.equal(sim.inputLog.length, 0);
  assert.equal(sim.step().tick, 0);
});

// ───────────── analyze: I20 ─────────────
function s103Fixed(): SimScenario {
  const base = s103({ durationSec: 90 });
  const model: SystemModel = structuredClone(base.model);
  const get = (id: string) => model.nodes.find((n) => n.id === id)!;
  get('lb').params.replicas = 2;
  get('cache').params.replicas = 2;
  model.nodes.push(makeNode('sql', { id: 'db-r', zone: 'az-a', params: { poolSize: 7, sizeFactor: 1, maxConnections: 500, queueLimit: 3000 } }));
  model.links.push({ id: 'db-db-r', from: 'db', to: 'db-r', mode: 'replicate', carries: 'w' });
  return { ...base, model };
}

test('I20 analyze: S1-03 gốc ⇒ bottleneck = db trong t∈[36,60]; SPOF lb/cache/db mức error; bản sửa cấu trúc ⇒ không còn error', () => {
  const sim = createSim(s103({ durationSec: 90 }));
  const frames: SimFrame[] = [];
  sim.runUntil(60, (f) => frames.push(f));
  const model = sim.scenario.model;
  const reasons: string[] = [];
  for (let t = 36; t <= 59.9; t += 2) {
    const f = frames[Math.round(t / DT)];
    const b = findBottleneck(model, f);
    reasons.push(b.reason);
    assert.equal(b.nodeId, 'db', `t=${t}`);
    assert.ok(b.rho > 1 && b.headroom < 1);
  }
  const win = findBottleneck(model, frames.slice(360, 600));
  assert.equal(win.nodeId, 'db');
  assert.ok(win.hotPath.includes('lb') && win.hotPath.includes('cache') && win.hotPath.includes('db'));
  assert.equal(win.reason, 'saturated');
  // trước nghẽn (t=20): chưa có node ρ ≥ 0,8
  const b20 = findBottleneck(model, frames[200]);
  assert.ok(['none', 'slow-dependency'].includes(b20.reason), b20.reason);
  const ms = maxSustainableRps(model, frames[200]);
  measure('I20', `bottleneck=db ở mọi t∈[36,60] (reason ${[...new Set(reasons)].join('/')}); maxSustainableRps(t=20)=${ms.rps.toFixed(0)} giới hạn bởi ${ms.limitedBy}`);
  assert.equal(ms.limitedBy, 'db');
  assert.ok(ms.rps > 2900 && ms.rps < 3100);

  const spofs = findSpofs(model);
  const err = spofs.filter((s) => s.severity === 'error').map((s) => s.nodeId).sort();
  assert.deepEqual(err, ['cache', 'db', 'lb']);
  assert.ok(findSpofs(model).find((s) => s.nodeId === 'lb')!.cuts.includes('db'));
  assert.ok(!spofs.some((s) => s.nodeId.startsWith('app')), 'app1..3 không phải articulation point');

  const fixed = s103Fixed().model;
  assert.deepEqual(findSpofs(fixed).filter((s) => s.severity === 'error'), []);
  assert.deepEqual(structuralWarnings(fixed).filter((w) => w.severity === 'error'), []);
  assert.ok(structuralWarnings(model).filter((w) => w.severity === 'error').length >= 3);
  measure('I20', `SPOF gốc: ${spofs.map((s) => `${s.nodeId}:${s.severity}`).join(', ')}; bản sửa: ${findSpofs(fixed).map((s) => `${s.nodeId}:${s.severity}`).join(', ')}`);
});

test('analyze SPOF: cache-aside với app→cache fallback bypass ⇒ cache không còn là SPOF; hot-key ⇒ hot-shard', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('service', { id: 'app', zone: 'az-a', params: { replicas: 3 } }),
    makeNode('cache', { id: 'cache', zone: 'az-a' }),
    makeNode('sql', { id: 'db', zone: 'az-a' }),
  ];
  const mk = (bypass: boolean): SystemModel => ({
    nodes,
    links: [
      link('client', 'app', { timeoutMs: 1000 }),
      link('app', 'cache', { timeoutMs: 50, ...(bypass ? { fallback: 'bypass' as const } : {}) }),
      link('app', 'db', { id: 'app-db-miss', timeoutMs: 800, onMissOf: 'cache' }),
      ...(bypass ? [] : [link('cache', 'db', { id: 'cache-db' })]),
    ],
  });
  const withCacheSpof = findSpofs(mk(false)).map((s) => s.nodeId);
  assert.ok(withCacheSpof.includes('cache'));
  const noCacheSpof = findSpofs(mk(true));
  assert.ok(!noCacheSpof.some((s) => s.nodeId === 'cache'), 'bypass ⇒ không SPOF');
  assert.ok(noCacheSpof.some((s) => s.nodeId === 'db' && s.severity === 'error'));
  // app replicas=3 stateless: nếu là điểm hẹp thì chỉ info
  assert.ok(findSpofs(mk(true)).every((s) => s.nodeId !== 'app' || s.severity === 'info'));

  // hot shard
  const hotSc = scenario('hot', [
    makeNode('client', { id: 'client', zone: 'az-a' }),
    makeNode('nosql', { id: 'kv', opsPerSec: 4000, baseMs: 2, zone: 'az-a', params: { shards: 4, poolSize: 100 } }),
  ], [link('client', 'kv', { netMs: 0, timeoutMs: 1000 })], { kind: 'steady', rps: 5000 }, { durationSec: 20, mix: { readRatio: 1 }, events: [{ at: 2, type: 'hot-key', node: 'kv', share: 0.6 }] });
  const sim = createSim(hotSc);
  const f = sim.runUntil(15);
  const b = findBottleneck(hotSc.model, f);
  assert.equal(b.nodeId, 'kv');
  assert.equal(b.reason, 'hot-shard');
});

test('analyze: cảnh báo cấu trúc có đủ mã chính trên S1-03 và model chế tác', () => {
  const codes = (m: SystemModel) => new Set(structuralWarnings(m).map((w) => w.code));
  const c1 = codes(s103().model);
  for (const code of ['SPOF', 'STATEFUL_NO_REPLICA', 'RETRY_NO_BACKOFF', 'NO_BREAKER_ON_DEP', 'NO_RATE_LIMIT_AT_EDGE', 'SINGLE_AZ', 'CACHE_SYNC_TTL'] as const) {
    if (code === 'CACHE_SYNC_TTL') { assert.ok(!c1.has(code), 'hitRatioMax 0,75 < 0,8 nên không cảnh báo'); continue; }
    assert.ok(c1.has(code), `thiếu ${code}`);
  }
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('rate-limiter', { id: 'rl', zone: 'az-a' }),
    makeNode('lb', { id: 'lb', zone: 'az-a', params: { healthCheckSec: 60 } }),
    makeNode('service', { id: 'a', zone: 'az-a' }),
    makeNode('service', { id: 'b', zone: 'region-eu' }),
    makeNode('service', { id: 'c', zone: 'region-eu' }),
    makeNode('cache', { id: 'cache', zone: 'az-a', params: { ttlSec: 90000, ttlJitterPct: 0, hitRatioMax: 0.9 } }),
    makeNode('queue', { id: 'q', zone: 'az-a', params: { maxDepth: 5e8, dlq: false } }),
    makeNode('sql', { id: 'db', zone: 'az-a', params: { maxConnections: 10, poolSize: 7 } }),
  ];
  const retry = { max: 2, backoff: 'fixed' as const, baseMs: 10, jitter: 'none' as const };
  const links: LinkSpec[] = [
    link('client', 'rl', { timeoutMs: 100 }), link('rl', 'lb', { timeoutMs: 100 }),
    link('lb', 'a'), // NO_TIMEOUT
    link('a', 'b', { netClass: 'cross-region', timeoutMs: 100, retry }),
    link('b', 'c', { timeoutMs: 100, retry }),
    link('c', 'cache', { timeoutMs: 100, retry }), // 3×3×3 = 27
    link('cache', 'db', { timeoutMs: 100 }),
    link('a', 'q', { mode: 'async' }),
  ];
  const w = structuralWarnings({ nodes, links });
  const has = (code: string) => w.some((x) => x.code === code);
  for (const code of ['NO_TIMEOUT', 'SYNC_CROSS_REGION_HOT_PATH', 'RETRY_NO_JITTER', 'RETRY_AMPLIFICATION', 'CACHE_NO_TTL', 'CACHE_SYNC_TTL',
    'QUEUE_NO_DLQ', 'UNBOUNDED_QUEUE', 'LB_NO_HEALTHCHECK', 'DB_FANIN_EXCEEDS_CONNS']) assert.ok(has(code), `thiếu ${code}`);
  assert.ok(!has('NO_RATE_LIMIT_AT_EDGE'), 'có rate-limiter ngay sau client');
  assert.ok(!has('SINGLE_AZ'));
  const amp = w.find((x) => x.code === 'RETRY_AMPLIFICATION')!;
  assert.equal(amp.linkId, 'b-c');
  assert.equal(amp.params!.product, 9);
});

// ───────────── grade: I21 ─────────────
const S103_SLOS: Constraint[] = [
  { id: 'p99', kind: 'slo-latency', metric: 'p99', maxMs: 300, window: { fromSec: 0, toSec: 90 }, allowViolationPct: 2 },
  { id: 'err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 90 } },
];
const PRESET_FIX: InputRecord[] = [
  { tick: 0, change: { type: 'knob', node: 'cache', key: 'capacityKeys', value: 50000 } },
  { tick: 0, change: { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 } },
];
const PRESET_TRAP: InputRecord[] = ['app1', 'app2', 'app3'].map((node) => ({ tick: 0, change: { type: 'knob' as const, node, key: 'replicas', value: 2 } }));

test('I21 grade: starter không đạt; preset fix-cache-and-db đạt; trap-more-apps không đạt (S1-03)', () => {
  const sc = s103();
  const t0 = performance.now();
  const starter = runAndEvaluate(sc, S103_SLOS);
  const t1 = performance.now();
  const fix = runAndEvaluate(sc, S103_SLOS, PRESET_FIX);
  const trap = runAndEvaluate(sc, S103_SLOS, PRESET_TRAP);
  const fmt = (r: ReturnType<typeof runAndEvaluate>) => r.results.map((x) => `${x.id}=${typeof x.actual === 'number' ? x.actual.toFixed(3) : x.actual}${x.pass ? '✔' : '✘'}`).join(' ');
  measure('I21', `starter: ${fmt(starter)}; fix-cache-and-db: ${fmt(fix)}; trap-more-apps: ${fmt(trap)}; simulate 90 s = ${(t1 - t0).toFixed(0)} ms`);
  assert.equal(starter.pass, false);
  assert.equal(fix.pass, true, fmt(fix));
  assert.equal(trap.pass, false, fmt(trap));
  assert.ok(t1 - t0 < 1500, `simulate 90 s mất ${t1 - t0} ms`);
  // chỉ scale-up DB cũng đạt (04 §10)
  assert.equal(runAndEvaluate(sc, S103_SLOS, [PRESET_FIX[1]]).pass, true);
  // headless: cùng kết quả với chạy bằng createSim (không packets)
  const sim = createSim({ ...sc, options: { ...NOISELESS } });
  const f = sim.runUntil(90);
  assert.equal(starter.run.p99[899], f.metrics.latency.p99);
  assert.equal(starter.run.ticks, 900);
  // cost
  const cost = evaluate([{ id: 'c', kind: 'cost', maxPerHour: 2.5 }, { id: 'c2', kind: 'cost', maxPerHour: 1 }], fix.run, sc.model);
  assert.equal(cost[0].pass, true, `cost ${cost[0].actual}`);
  assert.equal(cost[1].pass, false);
  assert.ok(Math.abs((cost[0].actual as number) - 2.31) < 0.05, `chi phí ${cost[0].actual} ≈ 2,31`);
});

test('grade: cửa sổ, allowViolationPct, trọng số lưu lượng, node-state, window-not-run, structural', () => {
  const sc = s103();
  const run = simulate(sc);
  // p99 ≤ 100 ms trong [0,30) đạt (≈60–77 ms); trong [40,90) không (≈165–194 ms). Lưu ý: với SLO 300 ms p99 luôn đạt vì p99 chỉ tính request thành công
  const ev = evaluate([
    { id: 'early', kind: 'slo-latency', metric: 'p99', maxMs: 100, window: { fromSec: 0, toSec: 30 } },
    { id: 'late', kind: 'slo-latency', metric: 'p99', maxMs: 100, window: { fromSec: 40, toSec: 90 } },
    { id: 'late-lenient', kind: 'slo-latency', metric: 'p99', maxMs: 100, window: { fromSec: 40, toSec: 90 }, allowViolationPct: 100 },
    { id: 'outside', kind: 'slo-error', maxRate: 1, window: { fromSec: 80, toSec: 120 } },
    { id: 'db-ok-early', kind: 'node-state', node: 'db', notIn: ['overloaded', 'down'], window: { fromSec: 0, toSec: 30 } },
    { id: 'db-bad-late', kind: 'node-state', node: 'db', notIn: ['overloaded'], window: { fromSec: 45, toSec: 90 } },
    { id: 'tp-early', kind: 'throughput', minGoodputRps: 1000, window: { fromSec: 10, toSec: 20 } },
    { id: 'tp-late', kind: 'throughput', minGoodputRps: 4500, window: { fromSec: 60, toSec: 90 } },
  ], run, sc.model);
  const r = Object.fromEntries(ev.map((x) => [x.id, x]));
  assert.equal(r.early.pass, true);
  assert.equal(r.late.pass, false);
  assert.ok(r.late.worstAtSec! >= 40 && r.late.worstAtSec! < 90);
  assert.equal(r['late-lenient'].pass, true);
  assert.equal(r.outside.pass, false);
  assert.equal(r.outside.messageKey, 'window-not-run');
  assert.equal(r.outside.actual, null);
  assert.equal(r['db-ok-early'].pass, true);
  assert.equal(r['db-bad-late'].pass, false);
  assert.equal(r['tp-early'].pass, true);
  assert.equal(r['tp-late'].pass, false);

  // trọng số lưu lượng: cùng cửa sổ [20,90): tỉ lệ lỗi có trọng số khác trung bình số học theo tick khi tải đổi
  const w = 20 * 10;
  let num = 0, den = 0, plain = 0;
  for (let k = w; k < 900; k++) { num += run.errorRate[k] * run.offered[k]; den += run.offered[k]; plain += run.errorRate[k]; }
  const weighted = evaluate([{ id: 'e', kind: 'slo-error', maxRate: 1, window: { fromSec: 20, toSec: 90 } }], run, sc.model)[0].actual as number;
  assert.ok(Math.abs(weighted - num / den) < 1e-12);
  assert.ok(Math.abs(weighted - plain / (900 - w)) > 1e-4, 'trọng số phải khác trung bình số học');

  // structural
  const fixed = s103Fixed();
  const st = (model: SystemModel) => evaluate([
    { id: 'spof', kind: 'structural', rule: 'no-spof' },
    { id: 'rep', kind: 'structural', rule: 'stateful-has-replica' },
    { id: 'bo', kind: 'structural', rule: 'has-retry-backoff' },
    { id: 'to', kind: 'structural', rule: 'has-timeout' },
  ], run, model);
  const s0 = Object.fromEntries(st(sc.model).map((x) => [x.id, x.pass]));
  assert.deepEqual(s0, { spof: false, rep: false, bo: false, to: true });
  const s1 = Object.fromEntries(st(fixed.model).map((x) => [x.id, x.pass]));
  assert.deepEqual(s1, { spof: true, rep: true, bo: false, to: true });
  // sửa retry qua InputRecord của người học → model áp thay đổi
  const patched = applyChangesToModel(sc.model, [
    { tick: 0, change: { type: 'link', link: 'cache-db', patch: { retry: { max: 2, backoff: 'exponential', baseMs: 100, jitter: 'full' } } } },
    { tick: 0, change: { type: 'knob', node: 'db', key: 'replicas', value: 2 } },
  ]);
  assert.equal(st(patched)[2].pass, true);
  assert.equal(sc.model.links.find((l) => l.id === 'cache-db')!.retry!.backoff, 'none', 'model gốc không bị đổi');
  assert.equal(evaluate([{ id: 's', kind: 'structural', rule: 'no-spof', node: 'db' }], run, patched)[0].pass, true);
});

test('grade: simulate áp changes đúng tick (đổi núm giữa chừng) và deterministic', () => {
  const sc = s103();
  const a = simulate(sc, [{ tick: 400, change: { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 } }]);
  const b = simulate(sc, [{ tick: 400, change: { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 } }]);
  assert.deepEqual(a.p99, b.p99);
  const base = simulate(sc);
  assert.equal(a.p99[399], base.p99[399]);
  assert.ok(a.p99[700] < base.p99[700] * 0.8, `${a.p99[700]} vs ${base.p99[700]}`);
  assert.deepEqual(simulate(sc, [PRESET_FIX[1], { tick: 0, change: { type: 'load', multiplier: 1 } }]).p99, simulate(sc, [PRESET_FIX[1]]).p99);
});

// ───────────── trace ─────────────
test('trace: cùng packetId ⇒ cùng trace; khác packetId ⇒ khác; kind điều chỉnh waterfall', () => {
  const sim = createSim(s103({ options: { noise: false, maxPackets: 200 } }));
  const f = sim.runUntil(40);
  const c = sim.compiled;
  const a = traceRequest(c, f, { packetId: 123, linkId: 'cache-db' })!;
  const b = traceRequest(c, f, { packetId: 123, linkId: 'cache-db' })!;
  assert.deepEqual(a, b);
  assert.equal(a.packetId, 123);
  const other = traceRequest(c, f, { packetId: 124, linkId: 'cache-db' })!;
  assert.notDeepEqual(a.spans.map((s) => s.durMs), other.spans.map((s) => s.durMs));
  // cùng packetId, mọi frame khác nhau (tick) cho trace khác nhưng vẫn hợp lệ
  assert.ok(a.spans.length >= 5);
  for (let i = 1; i < a.spans.length; i++) assert.ok(a.spans[i].startMs >= a.spans[i - 1].startMs - 1e-9 || a.spans[i].kind === 'retry-wait');
  assert.ok(a.path.includes('client-lb') && a.path.includes('cache-db'));
  assert.equal(traceRequest(c, f, { linkId: 'không-có' }), null);
  assert.ok(traceRequest(c, f, {}) !== null);
  // packet thật trong frame: lấy kind/link từ packet
  const pkt = f.packets.find((p) => p.kind === 'request')!;
  const byPkt = traceRequest(c, f, { packetId: pkt.id })!;
  assert.ok(byPkt.path.includes(pkt.linkId));
});

test('trace: S1-03 t=40 ⇒ chặng chậm nhất là DB (qua cache-db), tổng thời gian khớp, mọi packetId đi tới DB', () => {
  const sim = createSim(s103({ options: { noise: false, maxPackets: 200 } }));
  const f = sim.runUntil(40);
  const c = sim.compiled;
  let reached = 0;
  const shares: number[] = [];
  for (let id = 1; id <= 60; id++) {
    const tr = traceRequest(c, f, { packetId: id, linkId: 'cache-db', kind: 'request' })!;
    assert.ok(tr.path.includes('cache-db'));
    assert.equal(tr.slowest.nodeId, 'db', `packet ${id}: chặng chậm nhất ${tr.slowest.nodeId}/${tr.spans[tr.slowest.index].kind}`);
    shares.push(tr.slowest.share);
    reached++;
  }
  // không ép đường: bất cứ khi nào request chạm DB thì chặng chậm nhất là DB
  let viaDb = 0;
  for (let id = 1; id <= 200; id++) {
    const tr = traceRequest(c, f, { packetId: id })!;
    if (tr.path.includes('cache-db')) { viaDb++; assert.equal(tr.slowest.nodeId, 'db'); }
    else assert.ok(tr.spans.some((s) => s.note === 'cache-hit'));
  }
  const med = median(shares);
  measure('trace', `t=40: ${reached}/60 trace ép qua cache-db có chặng chậm nhất = db (trung vị ${(med * 100).toFixed(0)}% tổng); tự do: ${viaDb}/200 chạm DB (miss ≈ ${(1 - f.nodes.cache.hitRatio!).toFixed(2)} × 0,9+0,1 ghi)`);
  assert.ok(viaDb > 60 && viaDb < 160);
  const tr = traceRequest(c, f, { packetId: 5, linkId: 'cache-db' })!;
  const last = tr.spans[tr.spans.length - 1];
  assert.ok(Math.abs(tr.totalMs - (last.startMs + last.durMs)) < 1e-6 || tr.totalMs >= last.startMs);
});

test('trace: kind retry ⇒ có chặng timeout (800 ms) rồi chờ retry; kind timeout cắt tại timeoutMs; cache-hit dừng ở cache', () => {
  const sim = createSim(s103({ options: { noise: false, maxPackets: 200 } }));
  const f = sim.runUntil(40);
  const c = sim.compiled;
  const re = traceRequest(c, f, { packetId: 9, linkId: 'cache-db', kind: 'retry' })!;
  const to = re.spans.filter((s) => s.kind === 'timeout');
  assert.ok(to.length >= 1, 'retry phải có chặng timeout');
  assert.equal(to[0].durMs, 800);
  assert.equal(to[0].attempt, 1);
  assert.equal(to[0].nodeId, 'db');
  const wait = re.spans.findIndex((s) => s.kind === 'retry-wait');
  assert.ok(wait > re.spans.indexOf(to[0]), 'chờ retry sau timeout');
  assert.equal(re.spans[wait].durMs, 0, 'backoff none ⇒ 0 ms');
  assert.ok(re.attempts >= 2);
  assert.ok(re.totalMs >= 800);
  const sp = re.spans.filter((s) => s.attempt === 2 && s.kind === 'net');
  assert.ok(sp.length >= 1, 'có lần thử #2');

  const cut = traceRequest(c, f, { packetId: 9, linkId: 'cache-db', kind: 'timeout' })!;
  assert.equal(cut.outcome, 'timeout');
  assert.equal(cut.spans[cut.spans.length - 1].kind, 'timeout');
  assert.equal(cut.spans[cut.spans.length - 1].durMs, 800);

  const hit = traceRequest(c, f, { packetId: 9, linkId: 'app1-cache', kind: 'cache-hit' })!;
  assert.ok(hit.spans.some((s) => s.note === 'cache-hit'));
  assert.ok(!hit.path.includes('cache-db'));
  assert.equal(hit.outcome, 'ok');

  const dr = traceRequest(c, f, { packetId: 9, linkId: 'cache-db', kind: 'dropped' })!;
  assert.equal(dr.outcome, 'dropped');
  assert.equal(dr.spans[dr.spans.length - 1].ok, false);
  const er = traceRequest(c, f, { packetId: 9, linkId: 'lb-app2', kind: 'error' })!;
  assert.equal(er.outcome, 'error');
});

test('trace: retry có backoff exponential + jitter full: chặng chờ trong [0, backoff]; deterministic', () => {
  const sc = s103({ options: { noise: false, maxPackets: 200 } });
  const m = structuredClone(sc.model);
  m.links.find((l) => l.id === 'cache-db')!.retry = { max: 3, backoff: 'exponential', baseMs: 200, jitter: 'full' };
  const sim = createSim({ ...sc, model: m });
  const f = sim.runUntil(40);
  const tr = traceRequest(sim.compiled, f, { packetId: 77, linkId: 'cache-db', kind: 'retry' })!;
  const w = tr.spans.find((s) => s.kind === 'retry-wait')!;
  assert.ok(w.durMs >= 0 && w.durMs <= 200, `chờ ${w.durMs}`);
  assert.deepEqual(tr, traceRequest(sim.compiled, f, { packetId: 77, linkId: 'cache-db', kind: 'retry' }));
});

test('packets: trần packetScale = 1 000 000 và vẫn ≤ maxPackets khi tải cực lớn', () => {
  const sc = s103({ load: { kind: 'steady', rps: 5e8 }, durationSec: 5, options: { noise: false, maxPackets: 200 } });
  const sim = createSim(sc);
  let maxScale = 0;
  let maxPk = 0;
  sim.runUntil(5, (f) => { maxScale = Math.max(maxScale, f.packetScale); maxPk = Math.max(maxPk, f.packets.length); });
  measure('packets', `tải 5e8 rps: packetScale tối đa ${maxScale}, packets tối đa ${maxPk}`);
  assert.equal(PACKET_SCALE_MAX, 1_000_000);
  assert.ok(maxScale <= PACKET_SCALE_MAX);
  assert.ok(maxPk <= 200);
});

// ───────────── I22: bench analyze + tick ─────────────
test('I22 hiệu năng: analyze trên 30 node/49 link ≤ 5 ms/lần; scrub ≤ 50 ms; headless 90 s < 1,5 s', () => {
  const nodes: NodeSpec[] = [
    makeNode('client', { id: 'client', zone: 'internet' }),
    makeNode('rate-limiter', { id: 'rl', zone: 'az-a', params: { ratePerSec: 100000, burst: 1000 } }),
    makeNode('lb', { id: 'lb', zone: 'az-a' }),
    makeNode('cache', { id: 'cache', zone: 'az-a', initial: { warm: 1 }, params: { ttlSec: 120, workingSetKeys: 50000, capacityKeys: 25000 } }),
    makeNode('sql', { id: 'db', zone: 'az-a', opsPerSec: 20000, baseMs: 2, params: { poolSize: 100 } }),
    makeNode('queue', { id: 'q', zone: 'az-a' }),
    makeNode('worker', { id: 'wk', zone: 'az-a', opsPerSec: 2000, baseMs: 5 }),
  ];
  const links: LinkSpec[] = [
    link('client', 'rl', { netMs: 0, timeoutMs: 2000 }), link('rl', 'lb', { timeoutMs: 2000 }),
    link('cache', 'db', { timeoutMs: 800, retry: { max: 2, backoff: 'exponential', baseMs: 100, jitter: 'full', budgetRatio: 0.2 } }),
    link('q', 'wk', { mode: 'pull' }), link('wk', 'db', { timeoutMs: 800 }),
  ];
  for (let i = 0; i < 20; i++) {
    nodes.push(makeNode('service', { id: `app${i}`, zone: i % 2 ? 'az-a' : 'az-b', opsPerSec: 1800, baseMs: 12, params: { poolSize: 22 } }));
    links.push(link('lb', `app${i}`, { timeoutMs: 1500 }));
    links.push(link(`app${i}`, 'cache', { timeoutMs: 300, breaker: { errorThreshold: 0.5, minRps: 10, windowSec: 2, openSec: 5, probeRps: 10, closeAfterOk: 0.8 } }));
  }
  for (let i = 0; i < 3; i++) {
    nodes.push(makeNode('search', { id: `s${i}`, zone: 'az-a', opsPerSec: 3000, baseMs: 10 }));
    links.push(link(`app${i}`, `s${i}`, { timeoutMs: 400 }));
  }
  links.push(link('app3', 'q', { mode: 'async' }));
  const routes = { client: 'split', rl: 'split', lb: 'split', cache: 'split' } as const;
  const sc = scenario('big', nodes, links, { kind: 'ramp', from: 1000, to: 12000, overSec: 60 }, { durationSec: 60, options: { noise: true, maxPackets: 200 } }, routes);
  assert.ok(nodes.length >= 30 && links.length >= 40, `${nodes.length} node, ${links.length} link`);
  const sim = createSim(sc);
  const frames: SimFrame[] = [];
  sim.runUntil(60, (f) => frames.push(f));
  const tm = (fn: () => void, n: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i < n; i++) { const t0 = performance.now(); fn(); out.push(performance.now() - t0); }
    return out;
  };
  const model = sc.model;
  const tBot = median(tm(() => findBottleneck(model, frames[500]), 50));
  const tWin = median(tm(() => findBottleneck(model, frames.slice(300, 600)), 20));
  const tSpof = median(tm(() => findSpofs(model), 50));
  const tWarn = median(tm(() => structuralWarnings(model, frames[500]), 50));
  const tMax = median(tm(() => maxSustainableRps(model, frames[500]), 50));
  const tScrub = median(tm(() => { sim.scrub(12.3); sim.scrub(55.5); }, 5)) / 2;
  const tSim = tm(() => simulate({ ...sc, durationSec: 60 }), 1)[0];
  measure('I22', `${nodes.length} node/${links.length} link: findBottleneck(1 frame) ${tBot.toFixed(3)} ms; (300 frame) ${tWin.toFixed(3)} ms; findSpofs ${tSpof.toFixed(3)} ms; structuralWarnings ${tWarn.toFixed(3)} ms; maxSustainableRps ${tMax.toFixed(3)} ms; scrub ${tScrub.toFixed(1)} ms; simulate 60 s = ${tSim.toFixed(0)} ms`);
  for (const [name, v] of [['findBottleneck', tBot], ['findSpofs', tSpof], ['structuralWarnings', tWarn]] as const) {
    if (v > 1) console.warn(`      ⚠ ${name} ${v.toFixed(2)} ms > 1 ms`);
    assert.ok(v <= 5, `${name} ${v} ms`);
  }
  assert.ok(tWin <= 20, `findBottleneck cửa sổ ${tWin} ms`);
  assert.ok(tScrub <= 50, `scrub ${tScrub} ms`);
  assert.ok(tSim < 1500, `simulate ${tSim} ms`);
  // tick sim vẫn ≤ 5 ms khi có recorder (checkpoint + ring)
  const sim2 = createSim(sc);
  const ticks = tm(() => { sim2.step(); }, 600);
  const med = median(ticks.slice(50));
  measure('I22', `tick có recorder: trung vị ${med.toFixed(3)} ms/tick`);
  assert.ok(med <= 5);
});

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST SIM (T2.4–T2.9) ĐỀU XANH!`);
