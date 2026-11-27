/**
 * Hàm thuần cho đồng hồ mô phỏng bước cố định (fixed-step accumulator).
 * Tách khỏi React để test được (05 §4, §9.3).
 */

export const SIM_DT = 0.1; // giây mô phỏng / tick
export const MAX_FRAME_DT = 0.1; // chặn dt thực khi tab bị treo (giây)

export interface StepAccumulatorResult {
  /** accumulator mới (giây mô phỏng chưa tiêu thụ) */
  acc: number;
  /** số tick cần chạy trong khung này (0..maxCatchup) */
  ticks: number;
  /** true nếu chạm trần bù và đã bỏ phần dồn */
  dropped: boolean;
}

/**
 * Cộng `dtReal * speed` vào accumulator rồi rút ra tối đa `maxCatchup` tick.
 * Chạm trần ⇒ bỏ phần dồn (acc = 0) để không đuổi theo mãi (spiral of death).
 */
export function stepAccumulator(
  acc: number,
  dtReal: number,
  speed: number,
  dt: number = SIM_DT,
  maxCatchup = 8,
): StepAccumulatorResult {
  const safeDt = Number.isFinite(dtReal) && dtReal > 0 ? Math.min(dtReal, MAX_FRAME_DT) : 0;
  let a = acc + safeDt * speed;
  let ticks = 0;
  while (a >= dt - 1e-9 && ticks < maxCatchup) {
    a -= dt;
    ticks++;
  }
  if (ticks === maxCatchup && a >= dt - 1e-9) return { acc: 0, ticks, dropped: true };
  return { acc: Math.max(0, a), ticks, dropped: false };
}

/** Mốc pauseAtSec nhỏ nhất bị vượt khi t đi từ prevT tới nextT (hoặc null). */
export function crossedPauseMark(
  marks: readonly number[] | undefined,
  prevT: number,
  nextT: number,
  fired: ReadonlySet<number>,
): number | null {
  if (!marks) return null;
  let best: number | null = null;
  for (const m of marks) {
    if (fired.has(m)) continue;
    if (prevT < m && nextT >= m && (best === null || m < best)) best = m;
  }
  return best;
}
