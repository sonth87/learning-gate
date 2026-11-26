import assert from 'node:assert/strict';
import simsJson from '@/data/courses/sysdesign/sims.json';
import type { LiveSimSpec } from '@/components/scale-workbench/types';
import type { SimScenario } from '../../sim';
import { createLiveSimSession, createSdLiveSimAdapter } from '../liveSimAdapter';

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

console.log('=== Chạy bộ test LiveSimAdapter (T3.6) ===');

const s103Scenario = (simsJson as unknown as { sims: Record<string, { scenario: SimScenario }> })
  .sims['S1-03/ramp'].scenario;

const rampSpec: LiveSimSpec = {
  simId: 'S1-03/ramp',
  startAtSec: 0,
  autoplay: false,
  speed: 1,
  controls: { timeline: true, load: true, tracer: true },
};

test('createLiveSimSession: mở S1-03/ramp, tiến tới t=35s thấy DB chạm ρ≈1 và seek về t=20s khớp frame', () => {
  const session = createLiveSimSession(s103Scenario, rampSpec);
  const f0 = session.source.getFrame();
  assert.ok(f0, 'có frame ban đầu');
  assert.equal(f0.t, 0);

  session.advanceTo(20);
  const f20 = structuredClone(session.source.getFrame());
  assert.ok(f20);
  assert.ok(Math.abs(f20.t - 20) < 1e-6);
  assert.ok(
    Math.abs((f20.nodes.db.metrics?.rho ?? 0) - 0.598) < 0.03,
    `ρ_db tại t=20 phải ≈ 0.60 (đo: ${f20.nodes.db.metrics?.rho})`
  );

  session.advanceTo(41);
  const f41 = session.source.getFrame();
  assert.ok(f41);
  assert.equal(f41.nodes.db.state, 'overloaded', 't=41s DB phải ở trạng thái overloaded (expect [35,41])');

  // Seek lùi về t=20s phải khớp frame khi chạy thẳng tới t=20s
  session.seek(20);
  const f20Scrub = session.source.getFrame();
  assert.ok(f20Scrub);
  assert.equal(f20Scrub.tick, f20.tick);
  assert.equal(f20Scrub.nodes.db.loadPct, f20.nodes.db.loadPct);
  assert.ok(session.getHeadT() >= 40.9, 'headT vẫn giữ mốc 41s khi chỉ seek mà chưa đổi tham số');

  // Trace tại t=41s
  session.seek(41);
  const tr = session.trace({ linkId: 'cache-db', kind: 'retry' });
  assert.ok(tr, 'trace trả kết quả');
  assert.ok(tr.spans.length >= 4, 'trace có nhiều span');
  assert.ok(tr.spans.some((s) => s.isSlowest), 'trace đánh dấu span chậm nhất');

  session.dispose();
});

test('createLiveSimSession: startAtSec=30 và đổi knob ở quá khứ ghi đè tương lai', () => {
  const adapter = createSdLiveSimAdapter(simsJson.sims as never);
  const trapSession = adapter.open(
    {
      ...rampSpec,
      startAtSec: 30,
      controls: {
        timeline: true,
        knobs: [{ node: 'db', key: 'sizeFactor' }],
      },
    },
    { lang: 'vi', moduleId: 'S1-03', stepIndex: 8 }
  );
  assert.ok(trapSession, 'adapter mở được session');
  assert.ok(Math.abs(trapSession.getT() - 30) < 0.15, 'mở tại startAtSec = 30s');

  trapSession.advanceTo(40);
  const rhoBefore = trapSession.source.getFrame()?.nodes.db.metrics?.rho ?? 0;
  assert.ok(rhoBefore > 1, 'trước khi tăng sizeFactor, ρ_db tại t=40 > 1');

  // Tua về t=30 và nâng db.sizeFactor = 2
  trapSession.seek(30);
  trapSession.setKnob('db', 'sizeFactor', 2);
  trapSession.advanceTo(40);
  const rhoAfter = trapSession.source.getFrame()?.nodes.db.metrics?.rho ?? 0;
  assert.ok(rhoAfter < 0.7, `sau khi nâng db.sizeFactor=2, ρ_db tại t=40 giảm còn ${rhoAfter}`);

  trapSession.dispose();
});

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST LIVE SIM ADAPTER ĐỀU XANH!`);
