/** RNG có seed (04 §5.1). Không có RNG trạng thái chạy dọc: RNG của tick k suy từ (seed, k, channel). */
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** channel: 1 = tải/noise, 2 = phân loại chấm, 3 = jitter retry (nếu cần), 4 = trace/dự phòng */
export function tickRng(seed: number, tick: number, channel: number): () => number {
  let h = (seed ^ Math.imul(tick + 1, 0x9E3779B1) ^ Math.imul(channel + 1, 0x85EBCA6B)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7FEB352D) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846CA68B) >>> 0;
  return mulberry32(h ^ (h >>> 16));
}

/** Chuẩn tắc N(0,1); luôn tiêu thụ đúng 2 giá trị. */
export function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
