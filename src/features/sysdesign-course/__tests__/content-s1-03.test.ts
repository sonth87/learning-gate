/**
 * Kiểm nội dung bài S1-03 với engine (07 §3 bước 8): scenario trong sim.json compile được, chạy tới t=40 thấy
 * Database là điểm nghẽn (ρ > 0,9), và các số được ghi trong lesson.md/stage.json (ρ, p99, chi phí, preset) khớp engine.
 * Doctor chưa chạy engine (TODO T4.6) nên test này giữ vai trò neo hồi quy cho số liệu của bài.
 */
import assert from 'node:assert/strict';
import simJson from '../../../../content/sysdesign/modules/S1-03-data-flow-and-bottlenecks/sim.json';
import stageJson from '../../../../content/sysdesign/modules/S1-03-data-flow-and-bottlenecks/stage.json';
import { compile, createSim, DT, type SimFrame, type SimScenario } from '../sim';

const doc = (simJson as unknown as { sims: { id: string; scenario: SimScenario; presets: { id: string; changes: { node: string; key: string; value: number }[] }[] }[] }).sims[0];
assert.equal(doc.id, 'S1-03/ramp');

function scenarioOf(mutate?: (n: Record<string, { params: Record<string, number> }>) => void): SimScenario {
  const sc = JSON.parse(JSON.stringify(doc.scenario)) as SimScenario;
  sc.options = { noise: false, maxPackets: 0 };
  if (mutate) {
    const byId: Record<string, { params: Record<string, number> }> = {};
    for (const n of sc.model.nodes) byId[n.id] = n as never;
    mutate(byId);
  }
  return sc;
}

function frameAt(sc: SimScenario, sec: number): SimFrame {
  const sim = createSim(sc);
  let f: SimFrame | undefined;
  for (let i = 0; i < Math.round(sec / DT); i++) f = sim.step();
  return f as SimFrame;
}

// 1) compile được; id node/link của stage.json nằm trong model
const compiled = compile(scenarioOf());
assert.ok(compiled.nodes.length === 7, 'model có 7 node');
const nodeIds = new Set(doc.scenario.model.nodes.map((n) => n.id));
const linkIds = new Set(doc.scenario.model.links.map((l) => l.id));
for (const id of Object.keys(stageJson.nodes)) assert.ok(nodeIds.has(id), `stage.nodes.${id} có trong model`);
for (const id of Object.keys(stageJson.links)) assert.ok(linkIds.has(id), `stage.links.${id} có trong model`);

// 2) chạy tới t = 40 s: Database ρ > 0,9 và là thành phần có ρ cao nhất; App còn thấp
const f40 = frameAt(scenarioOf(), 40);
const rho = (f: SimFrame, id: string) => f.nodes[id].rho;
assert.ok(rho(f40, 'db') > 0.9, `ρ DB tại t=40 phải > 0,9 (đo ${rho(f40, 'db').toFixed(2)})`);
for (const id of ['lb', 'app1', 'app2', 'app3', 'cache']) assert.ok(rho(f40, id) < rho(f40, 'db'), `${id} ρ thấp hơn DB`);

// 3) các mốc được nêu trong lời giảng
const f20 = frameAt(scenarioOf(), 20);
assert.ok(Math.abs(rho(f20, 'db') - 0.6) < 0.02, `t=20: ρ DB ≈ 0,60 (đo ${rho(f20, 'db').toFixed(2)})`);
const f35 = frameAt(scenarioOf(), 35);
assert.ok(Math.abs(rho(f35, 'db') - 1.0) < 0.03, `t=35: ρ DB ≈ 1,00 (đo ${rho(f35, 'db').toFixed(2)})`);
assert.ok(Math.abs(rho(f35, 'app1') - 0.56) < 0.02, `t=35: ρ App ≈ 0,56 (đo ${rho(f35, 'app1').toFixed(2)})`);
assert.ok(Math.abs((f35.nodes.cache.hitRatio ?? 0) - 0.52) < 0.01, 'Cache Hit Ratio ≈ 52%');
assert.ok(f35.metrics.latency.p99 > 130 && f35.metrics.latency.p99 < 160, `t=35: p99 ≈ 143 ms (đo ${f35.metrics.latency.p99.toFixed(0)})`);
assert.ok(f20.metrics.latency.p99 > 55 && f20.metrics.latency.p99 < 75, `t=20: p99 ≈ 64 ms (đo ${f20.metrics.latency.p99.toFixed(0)})`);
assert.ok(f40.metrics.errorRate > 0.4, 'sau t=40 hơn 40% request lỗi');

// 4) preset bẫy: thêm instance App không đổi p99 (dưới 5%) dù ρ App giảm một nửa
const trap = frameAt(scenarioOf((n) => { for (const id of ['app1', 'app2', 'app3']) n[id].params.replicas = 2; }), 35);
assert.ok(Math.abs(trap.metrics.latency.p99 - f35.metrics.latency.p99) / f35.metrics.latency.p99 < 0.05, 'thêm App không đổi p99 quá 5%');
assert.ok(Math.abs(rho(trap, 'app1') - 0.28) < 0.02, `ρ App ≈ 0,28 sau khi nhân đôi (đo ${rho(trap, 'app1').toFixed(2)})`);
assert.ok(rho(trap, 'db') > 0.97, 'ρ DB vẫn ≈ 1');

// 5) preset sửa đúng: cache 50.000 key + DB ×2 ⇒ ρ DB ≈ 0,53, p99 ≈ 106 ms, chi phí ≈ 2,31 USD/giờ ở tải đỉnh
const fix = frameAt(scenarioOf((n) => { n.cache.params.capacityKeys = 50000; n.db.params.sizeFactor = 2; }), 60);
assert.ok(Math.abs(rho(fix, 'db') - 0.53) < 0.02, `ρ DB sau khi sửa ≈ 0,53 (đo ${rho(fix, 'db').toFixed(2)})`);
assert.ok(fix.metrics.latency.p99 > 95 && fix.metrics.latency.p99 < 120, `p99 sau khi sửa ≈ 106 ms (đo ${fix.metrics.latency.p99.toFixed(0)})`);
assert.ok(Math.abs(fix.metrics.costPerHour - 2.31) < 0.02, `chi phí ≈ 2,31 USD/giờ (đo ${fix.metrics.costPerHour.toFixed(2)})`);
assert.ok(fix.metrics.errorRate < 0.01, 'sau khi sửa lỗi dưới 1%');
assert.ok(Math.abs(frameAt(scenarioOf(), 5).metrics.costPerHour - 1.27) < 0.02, 'chi phí gốc ≈ 1,27 USD/giờ');

// 6) tải bền vững tối đa ≈ 3.010 req/s = μ_db / tỉ lệ request xuống DB
const toDb = 0.9 * (1 - (f35.nodes.cache.hitRatio ?? 0)) + 0.1;
const maxRps = 1600 / toDb;
assert.ok(maxRps > 2950 && maxRps < 3070, `tải bền vững tối đa ≈ 3.010 req/s (tính ${maxRps.toFixed(0)})`);

console.log('[content-s1-03] OK');
