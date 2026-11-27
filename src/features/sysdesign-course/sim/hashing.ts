/**
 * Hashing và phân phối khoá (04 §8): mod-N, consistent hashing ring, Zipf. Thuần, deterministic.
 */
import { mulberry32 } from './rng';

/** FNV-1a 32-bit + avalanche cuối (fmix32 của MurmurHash3) để bit thấp phân bố đều. */
export function fnv1a32(s: string): number {
  let h = 0x811C9DC5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85EBCA6B);
  h ^= h >>> 13;
  h = Math.imul(h, 0xC2B2AE35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Gán khoá vào nút theo `fnv1a32(k) % n`. */
export function modNAssign(keys: readonly string[], n: number): number[] {
  if (!(n >= 1)) throw new Error('modNAssign: n phải >= 1');
  return keys.map((k) => fnv1a32(k) % n);
}

/**
 * Consistent hashing: mỗi nút chiếm `vnodes` điểm trên vòng 2^32 (băm `${node}#${i}`), khoá thuộc điểm
 * đầu tiên có hash ≥ hash(khoá) (quay vòng). Tìm nhị phân trên mảng điểm đã sắp xếp.
 */
export function ringAssign(keys: readonly string[], nodes: readonly string[], vnodes = 150): string[] {
  if (nodes.length === 0) throw new Error('ringAssign: cần ít nhất 1 nút');
  const pts: { h: number; node: string }[] = [];
  for (const node of nodes) {
    for (let i = 0; i < vnodes; i++) pts.push({ h: fnv1a32(`${node}#${i}`), node });
  }
  // hoà hash: sắp theo tên nút để deterministic
  pts.sort((a, b) => a.h - b.h || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0));
  const hs = pts.map((p) => p.h);
  return keys.map((k) => {
    const h = fnv1a32(k);
    let lo = 0;
    let hi = hs.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (hs[mid] < h) lo = mid + 1; else hi = mid;
    }
    return pts[lo === hs.length ? 0 : lo].node;
  });
}

/** Tỉ lệ khoá đổi nút giữa hai phép gán (cùng độ dài). */
export function movedFraction(a: readonly (string | number)[], b: readonly (string | number)[]): number {
  if (a.length !== b.length) throw new Error('movedFraction: hai phép gán phải cùng độ dài');
  if (a.length === 0) return 0;
  let moved = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) moved++;
  return moved / a.length;
}

/**
 * `count` mẫu khoá từ phân phối Zipf(s) trên vũ trụ `count` khoá `k0..k{count-1}` (xác suất ∝ 1/(rank+1)^s),
 * lấy bằng nghịch đảo CDF với mulberry32(seed). Dùng cho heatmap hot key.
 */
export function zipfKeys(count: number, s: number, seed: number): string[] {
  if (count <= 0) return [];
  const cdf = new Float64Array(count);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    acc += 1 / Math.pow(i + 1, s);
    cdf[i] = acc;
  }
  const rand = mulberry32(seed >>> 0);
  const out: string[] = new Array<string>(count);
  for (let j = 0; j < count; j++) {
    const u = rand() * acc;
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cdf[mid] < u) lo = mid + 1; else hi = mid;
    }
    out[j] = `k${lo}`;
  }
  return out;
}
