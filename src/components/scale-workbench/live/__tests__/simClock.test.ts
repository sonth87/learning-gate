import assert from 'node:assert/strict';
import { crossedPauseMark, SIM_DT, stepAccumulator } from '../simClockMath';

function run(speed: number, fps: number, seconds: number, maxCatchup = 8) {
  let acc = 0;
  let ticks = 0;
  const frames = Math.round(fps * seconds);
  for (let i = 0; i < frames; i++) {
    const r = stepAccumulator(acc, 1 / fps, speed, SIM_DT, maxCatchup);
    acc = r.acc;
    ticks += r.ticks;
  }
  return ticks;
}

// 1) tốc độ đúng, không trôi: 10 s thực => 100/200/500 tick
for (const [speed, expect] of [[1, 100], [2, 200], [5, 500]] as const) {
  const n = run(speed, 60, 10);
  assert.ok(Math.abs(n - expect) <= 1, `speed ${speed}: ${n} tick, mong ${expect}`);
}
assert.ok(Math.abs(run(1, 30, 10) - 100) <= 1);

// 2) tab ẩn/hiện: dt thực 30 s bị chặn ở 0,1 s => tối đa 1 tick ở 1x (không bù)
{
  const r = stepAccumulator(0, 30, 1, SIM_DT, 8);
  assert.equal(r.ticks, 1);
  assert.ok(r.acc < SIM_DT);
}

// 3) trần bù
{
  assert.equal(stepAccumulator(0, 0.1, 5, SIM_DT, 8).ticks, 5);
  const r = stepAccumulator(0, 0.1, 5, SIM_DT, 3);
  assert.equal(r.ticks, 3);
  assert.equal(r.acc, 0);
  assert.equal(r.dropped, true);
}

// 4) dt xấu an toàn
assert.equal(stepAccumulator(0, -1, 1).ticks, 0);
assert.equal(stepAccumulator(0, Number.NaN, 1).ticks, 0);

// 5) dt = 0 (pause) giữ nguyên acc
{
  const r = stepAccumulator(0.04, 0, 1);
  assert.equal(r.ticks, 0);
  assert.equal(r.acc, 0.04);
}

// 6) pauseAtSec
{
  assert.equal(crossedPauseMark([30, 10], 9.9, 10.0, new Set()), 10);
  assert.equal(crossedPauseMark([30, 10], 9.9, 10.0, new Set([10])), null);
  assert.equal(crossedPauseMark(undefined, 0, 100, new Set()), null);
  assert.equal(crossedPauseMark([30, 10], 0, 40, new Set()), 10);
}

console.log('simClock: ok');
