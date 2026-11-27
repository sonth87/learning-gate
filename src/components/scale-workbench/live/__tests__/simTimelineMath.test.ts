import assert from 'node:assert/strict';
import {
  buildSparklinePath,
  clampSeekT,
  decimateMinMax,
  evalLiveMetricTone,
  formatLiveMetric,
} from '../simTimelineMath';

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

console.log('=== Chạy bộ test SimTimeline & LiveTelemetryStrip Math (T3.4) ===');

test('decimateMinMax: giữ nguyên chuỗi ngắn và bảo toàn đỉnh nhọn khi chuỗi dài', () => {
  const shortT = new Float32Array([0, 1, 2, 3]);
  const shortV = new Float32Array([10, 20, 15, 30]);
  const d1 = decimateMinMax(shortT, shortV, 4, 10);
  assert.deepEqual(d1.t, [0, 1, 2, 3]);
  assert.deepEqual(d1.v, [10, 20, 15, 30]);
  assert.equal(d1.minV, 10);
  assert.equal(d1.maxV, 30);

  // Chuỗi 900 điểm với 1 đỉnh nhọn ở chỉ số 357
  const n = 900;
  const longT = new Float32Array(n);
  const longV = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    longT[i] = i * 0.1;
    longV[i] = 50;
  }
  longV[357] = 1940;
  longV[612] = 5;
  const d2 = decimateMinMax(longT, longV, n, 120);
  assert.ok(d2.t.length <= 120, `số điểm ${d2.t.length} phải <= 120`);
  assert.ok(d2.v.includes(1940), 'phải giữ được đỉnh nhọn 1940');
  assert.ok(d2.v.includes(5), 'phải giữ được đáy 5');
  assert.equal(d2.t[0], 0);
  assert.ok(Math.abs(d2.t[d2.t.length - 1] - 89.9) < 1e-3);
});

test('buildSparklinePath: sinh path SVG hợp lệ', () => {
  const path = buildSparklinePath([0, 45, 90], [0, 150, 300], 90, 300, 600, 26, 2);
  assert.ok(path.startsWith('M0.0,24.0'));
  assert.ok(path.includes('L300.0,13.0'));
  assert.ok(path.endsWith('L600.0,2.0'));
});

test('clampSeekT: chặn ở headT và durationSec', () => {
  assert.equal(clampSeekT(-5, 40, 90), 0);
  assert.equal(clampSeekT(25.04, 40, 90), 25);
  assert.equal(clampSeekT(60, 34.2, 90), 34.2);
  assert.equal(clampSeekT(120, 100, 90), 90);
});

test('formatLiveMetric & evalLiveMetricTone: định dạng đúng rps/ms/pct/usd-hour và tone', () => {
  assert.equal(formatLiveMetric(3010.4, 'rps'), '3,010 req/s');
  assert.equal(formatLiveMetric(4.25, 'ms'), '4.3 ms');
  assert.equal(formatLiveMetric(143.2, 'ms'), '143 ms');
  assert.equal(formatLiveMetric(0.531, 'pct'), '53%');
  assert.equal(formatLiveMetric(0.0085, 'pct'), '0.85%');
  assert.equal(formatLiveMetric(2.31, 'usd-hour'), '$2.31/h');

  const toneSpec = { warnAbove: 100, badAbove: 300 };
  assert.equal(evalLiveMetricTone(64, toneSpec), 'ok');
  assert.equal(evalLiveMetricTone(143, toneSpec), 'warn');
  assert.equal(evalLiveMetricTone(320, toneSpec), 'bad');
});

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST TIMELINE MATH ĐỀU XANH!`);
