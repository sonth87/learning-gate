import assert from 'node:assert/strict';
import {
  buildLut,
  formatCount,
  linkVisual,
  lutAt,
  nodeVisual,
  packetVisual,
} from '../liveFrameMath';
import {
  createLiveFrameApplier,
  type LiveEl,
  type LiveLinkEls,
  type LiveNodeEls,
  type LivePacketEls,
} from '../liveStageApplier';
import type { LiveSimFrame, LiveSimSource } from '../../types';

// ---------- hàm thuần ----------
assert.equal(formatCount(999), '999');
assert.equal(formatCount(1234), '1.2k');
assert.equal(formatCount(15000), '15k');
assert.equal(formatCount(2_500_000), '2.5M');

// state -> hình ảnh (05 §3.3)
{
  const v = nodeVisual({ state: 'overloaded', loadPct: 99, queuePct: 0.2, queue: 3400 });
  assert.equal(v.tintFill, '#e5534b');
  assert.equal(v.tintOpacity, 0.38);
  assert.equal(v.barColor, '#e5534b');
  assert.ok(v.pileCount >= 10, 'overloaded => pile đầy');
  assert.equal(v.pulse, true);
  assert.equal(v.queueLabel, '3.4k');
  const d = nodeVisual({ state: 'down', loadPct: 50, queuePct: 1 });
  assert.equal(d.down, true);
  assert.equal(d.barShow, false);
  assert.equal(d.pileCount, 0);
  const idle = nodeVisual({ state: 'idle', loadPct: 2, queuePct: 0 });
  assert.equal(idle.barShow, false);
  const warm = nodeVisual({ state: 'recovering', loadPct: 10, queuePct: 0, warm: 0.4 });
  assert.equal(warm.showWarm, true);
  assert.equal(nodeVisual({ state: 'busy', loadPct: 65, queuePct: 0 }).barColor, '#efb041');
  assert.equal(nodeVisual({ state: 'healthy', loadPct: 64, queuePct: 0 }).barColor, '#7fc278');
  assert.equal(nodeVisual(undefined).tintOpacity, 0);
}

// link: độ dày theo lưu lượng, breaker, lag
{
  const thin = linkVisual({ rps: 1, throughput: 1, errorRate: 0 }, 1000);
  const thick = linkVisual({ rps: 1000, throughput: 1000, errorRate: 0 }, 1000);
  assert.ok(thick.width > thin.width && Math.abs(thick.width - 6) < 1e-9);
  const b = linkVisual({ rps: 0, throughput: 0, errorRate: 0.3, breaker: 'open', lagMs: 800, style: 'cut' }, 1);
  assert.equal(b.showGate, true);
  assert.equal(b.gateFill, '#e5534b');
  assert.equal(b.showLag, true);
  assert.equal(b.lagWarn, true);
  assert.ok(b.lagGap > 6 && b.lagGap <= 24);
  assert.equal(b.showCut, true);
  assert.ok(b.errOpacity > 0);
  assert.equal(linkVisual(undefined, 1).show, false);
}

// packet: fate
{
  const timeout = packetVisual('timeout', 0.5, 0.5, false);
  assert.equal(timeout.opacity, 0);
  const drop = packetVisual('dropped', 0.75, 0.5, false);
  assert.ok(drop.dy > 0 && drop.opacity < 1);
  assert.equal(drop.t, 0.5, 'dropped dừng tại fate theo trục link');
  const rev = packetVisual('request', 0.25, undefined, true);
  assert.equal(rev.t, 0.75);
  const turn = packetVisual('cache-hit', 0.8, 0.6, false);
  assert.ok(Math.abs(turn.t - 0.4) < 1e-9, 'cache-hit quay đầu');
}

// LUT nội suy
{
  const lut = buildLut((f) => ({ x: f * 100, y: f * 50 }), 48);
  const out = { x: 0, y: 0 };
  lutAt(lut, 0.5, out);
  assert.ok(Math.abs(out.x - 50) < 1e-3 && Math.abs(out.y - 25) < 1e-3);
  lutAt(lut, 1, out);
  assert.ok(Math.abs(out.x - 100) < 1e-3);
  lutAt(lut, -3, out);
  assert.equal(out.x, 0);
}

// ---------- applier trên DOM giả: chứng minh frameSource -> thuộc tính SVG ----------
class FakeEl implements LiveEl {
  attrs: Record<string, string> = {};
  writes = 0;
  textContent: string | null = '';
  setAttribute(n: string, v: string): void {
    this.attrs[n] = v;
    this.writes++;
  }
}
const el = () => new FakeEl();

function makeNode(id: string): LiveNodeEls & { raw: Record<string, FakeEl> } {
  const raw = {
    overlay: el(), tint: el(), warm: el(), bar: el(), barFill: el(), barText: el(), pile: el(),
    queueText: el(), x: el(), badge: el(), badgeRect: el(), badgeText: el(), outer: el(),
  };
  const pileRects = Array.from({ length: 12 }, el);
  return { id, label: id, baseX: 10, baseY: 20, ...raw, pileRects, raw };
}
function makeLink(id: string): LiveLinkEls {
  return {
    id, path: el(), err: el(), cut: el(), gate: el(), gateRect: el(), gateText: el(),
    lag: el(), lag2: el(), lagText: el(),
  };
}
const pool: LivePacketEls[] = Array.from({ length: 4 }, () => ({ g: el(), circle: el(), rect: el(), ring: el() }));

let frame: LiveSimFrame | null = null;
const source: LiveSimSource = { getFrame: () => frame, subscribe: () => () => {} };
const mk = (tick: number, db: LiveSimFrame['nodes'][string], pk: LiveSimFrame['packets'] = []): LiveSimFrame => ({
  tick, t: tick / 10,
  nodes: { db },
  links: { l1: { rps: 500, throughput: 500, errorRate: 0, breaker: 'half-open' } },
  packets: pk, packetScale: 50, metrics: {},
});

const dbNode = makeNode('db');
const link = makeLink('l1');
const layers = { links: el(), ents: el(), packets: el() };
const scaleEl = el();
const applier = createLiveFrameApplier({
  source, nodes: [dbNode], links: [link], pool, layers, scalePill: scaleEl,
  sampleLink: (_id, f) => ({ x: f * 100, y: 0 }),
  inkColor: '#111', pillBg: '#eee', pillInk: '#222', reducedMotion: false,
  stateLabel: (s) => s, ariaLabel: (l, s, p) => `${l}/${s}/${p}`, scaleText: (n) => `1=${n}`,
  pickText: (b) => b.vi,
});

// chưa sẵn sàng (choreography chưa tiếp đất) => lớp overlay ẩn, không áp frame
frame = mk(1, { state: 'healthy', loadPct: 30, queuePct: 0 });
applier.step(1000, false, true);
assert.equal(layers.ents.attrs.opacity, '0');
assert.equal(dbNode.raw.barText.textContent, '');

// sẵn sàng => áp frame
applier.step(1016, true, true);
assert.equal(layers.ents.attrs.opacity, '1');
assert.equal(scaleEl.textContent, '1=50');
for (let i = 0; i < 60; i++) applier.step(1032 + i * 16, true, true); // làm mượt hội tụ
assert.equal(dbNode.raw.barText.textContent, '30%');
assert.equal(dbNode.raw.bar.attrs.display, 'inline');
assert.equal(dbNode.raw.outer.attrs['aria-label'], 'db/healthy/30');
assert.equal((link.gateRect as FakeEl).attrs.fill, '#efb041', 'half-open = vàng');

// đổi state => DOM đổi, không cần React
frame = mk(2, { state: 'overloaded', loadPct: 97, queuePct: 0.9, queue: 5200 });
for (let i = 0; i < 80; i++) applier.step(2100 + i * 16, true, true);
assert.equal(dbNode.raw.tint.attrs.fill, '#e5534b');
assert.equal(dbNode.raw.tint.attrs.opacity, '0.38');
assert.equal(dbNode.raw.barText.textContent, '97%');
assert.equal(dbNode.raw.barText.attrs.fill, '#c93b32');
assert.equal(dbNode.pileRects.filter((r) => (r as FakeEl).attrs.display === 'inline').length, 11);
assert.equal(dbNode.raw.queueText.textContent, '5.2k');

// down
frame = mk(3, { state: 'down', loadPct: 0, queuePct: 0 });
for (let i = 0; i < 10; i++) applier.step(4000 + i * 16, true, true);
assert.equal(dbNode.raw.x.attrs.display, 'inline');
assert.equal(dbNode.raw.bar.attrs.display, 'none');
assert.equal(dbNode.raw.pile.attrs.display, 'none');

// dirty-check: frame không đổi => không ghi thêm thuộc tính nào
const before = [dbNode.raw.tint.writes, dbNode.raw.barText.writes, dbNode.raw.bar.writes, (link.path as FakeEl).writes];
for (let i = 0; i < 30; i++) applier.step(5000 + i * 16, true, true);
const after = [dbNode.raw.tint.writes, dbNode.raw.barText.writes, dbNode.raw.bar.writes, (link.path as FakeEl).writes];
assert.deepEqual(after, before, 'dirty-check: không ghi lại khi không đổi');

// packet pool: cấp slot, tween, tái dùng slot khi chấm biến mất
frame = mk(10, { state: 'healthy', loadPct: 10, queuePct: 0 }, [
  { id: 7, linkId: 'l1', kind: 'retry', reverse: false, progress: 0.2 },
  { id: 8, linkId: 'l1', kind: 'request', reverse: true, progress: 0.3 },
]);
applier.step(6000, true, true);
assert.equal(pool.filter((p) => (p.g as FakeEl).attrs.display === 'inline').length, 2);
assert.equal(applier.packetAtSlot(0)?.kind, 'retry');
assert.equal((pool[0].g as FakeEl).attrs.transform, 'translate(20 0)');
assert.equal((pool[0].ring as FakeEl).attrs.display, 'inline', 'retry có vòng ngoài');
// frame kế tiếp: tiến độ tăng 0,1 sau 100 ms => tween giữa 2 frame
frame = mk(11, { state: 'healthy', loadPct: 10, queuePct: 0 }, [
  { id: 7, linkId: 'l1', kind: 'retry', reverse: false, progress: 0.3 },
]);
applier.step(6100, true, true);
applier.step(6150, true, true); // +50 ms => +0,05
assert.equal((pool[0].g as FakeEl).attrs.transform, 'translate(35 0)');
assert.equal((pool[1].g as FakeEl).attrs.display, 'none', 'chấm 8 biến mất => slot được thu hồi');
// tạm dừng: đóng băng tween
applier.step(6200, true, false);
assert.equal((pool[0].g as FakeEl).attrs.transform, 'translate(30 0)');

// reduced-motion: không vẽ chấm
{
  const pool2: LivePacketEls[] = Array.from({ length: 2 }, () => ({ g: el(), circle: el(), rect: el(), ring: el() }));
  const a2 = createLiveFrameApplier({
    source, nodes: [makeNode('db')], links: [makeLink('l1')], pool: pool2,
    layers: { links: el(), ents: el(), packets: el() }, scalePill: null,
    sampleLink: (_id, f) => ({ x: f * 100, y: 0 }),
    inkColor: '#111', pillBg: '#eee', pillInk: '#222', reducedMotion: true,
    stateLabel: (s) => s, ariaLabel: () => '', scaleText: () => '', pickText: (b) => b.vi,
  });
  frame = mk(20, { state: 'saturated', loadPct: 80, queuePct: 0.4 }, [
    { id: 1, linkId: 'l1', kind: 'request', reverse: false, progress: 0.5 },
  ]);
  a2.step(10, true, true);
  assert.equal(pool2.filter((p) => (p.g as FakeEl).attrs.display === 'inline').length, 0);
}

console.log('liveFrame: ok');
