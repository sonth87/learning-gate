/**
 * Mô hình độ trễ (04 §2.11): M/M/c Sakasegawa + shifted-exponential, ghép nối tiếp/hỗn hợp/max.
 *
 * Biểu diễn nội bộ `Dist`: hỗn hợp tối đa MAXC thành phần shifted-exponential {w, shift, scale, ok}. Mỗi thành
 * phần mang cờ `ok` (request thành công hay thất bại) nên xác suất thành công của một subtree = tổng trọng số
 * các thành phần `ok`, và `P(thành công ∧ L ≤ τ)` được tính đúng cả khi tải hỗn hợp (cache hit nhanh/miss chậm
 * hoặc lỗi): không cần giả định độc lập giữa "lỗi" và "chậm". `LatencySummary` chỉ là tóm tắt để hiển thị.
 * [cập nhật T2.3: biểu diễn hỗn hợp có cờ ok thay cho fit 1 shift-exp từ (p50,p99) + p_succ=(1−p_fail)(1−p_to);
 *  công thức độc lập của 04 §2.11c cho err=1,0 ở S1-03 t≥40 (đếm 2 lần) — xem 04 §2.11b]
 */
import type { LatencySummary } from './types';

export const Z50 = -Math.log(0.5);    // 0,693
export const Z95 = -Math.log(0.05);   // 2,996
export const Z99 = -Math.log(0.01);   // 4,605
const MAXC = 4;
const EPS = 1e-9;

export interface Comp { w: number; shift: number; scale: number; ok: boolean }
export type Dist = readonly Comp[];

export const D_ZERO: Dist = Object.freeze([Object.freeze({ w: 1, shift: 0, scale: 0, ok: true })]) as Dist;
export const D_FAIL0: Dist = Object.freeze([Object.freeze({ w: 1, shift: 0, scale: 0, ok: false })]) as Dist;
export function dPoint(x: number, ok = true): Dist { return [{ w: 1, shift: x, scale: 0, ok }]; }
export function dShiftExp(shift: number, scale: number, ok = true): Dist { return [{ w: 1, shift, scale, ok }]; }

export function lat(mean: number, p50: number, p95: number, p99: number): LatencySummary {
  return { mean, p50, p95, p99 };
}
export function zeroLat(): LatencySummary {
  return { mean: 0, p50: 0, p95: 0, p99: 0 };
}

// ───────────── truy vấn ─────────────
function compSurv(c: Comp, x: number): number {
  if (x < c.shift) return 1;
  if (c.scale <= EPS) return 0;
  return Math.exp(-(x - c.shift) / c.scale);
}
function compQuantile(c: Comp, q: number): number {
  return c.shift + c.scale * -Math.log(1 - Math.min(q, 1 - 1e-12));
}

/** P(L > x) trên mọi request (thành công lẫn thất bại). */
export function dSurvival(d: Dist, x: number): number {
  if (!Number.isFinite(x)) return 0;
  let s = 0;
  for (let i = 0; i < d.length; i++) s += d[i].w * compSurv(d[i], x);
  return s;
}
export function dMean(d: Dist): number {
  let m = 0;
  for (let i = 0; i < d.length; i++) m += d[i].w * (d[i].shift + d[i].scale);
  return m;
}
/** Tổng trọng số các thành phần thành công. */
export function dOkMass(d: Dist): number {
  let m = 0;
  for (let i = 0; i < d.length; i++) if (d[i].ok) m += d[i].w;
  return m;
}
/** Khối lượng vượt `cap`, tách theo thành công/thất bại. */
export function dMassBeyond(d: Dist, cap: number): { ok: number; fail: number } {
  let ok = 0;
  let fail = 0;
  if (!Number.isFinite(cap)) return { ok, fail };
  for (const c of d) {
    const m = c.w * compSurv(c, cap);
    if (c.ok) ok += m; else fail += m;
  }
  return { ok, fail };
}
/** Phân vị q (0<q<1) của hỗn hợp: đóng khi 1 thành phần, ngược lại bisection 24 bước. */
export function dQuantile(d: Dist, q: number): number {
  if (d.length === 1) return compQuantile(d[0], q);
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < d.length; i++) {
    const x = compQuantile(d[i], q);
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  if (hi - lo < EPS) return lo;
  const target = 1 - q;
  for (let it = 0; it < 24; it++) {
    const mid = 0.5 * (lo + hi);
    if (dSurvival(d, mid) > target) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}
export function dSummary(d: Dist): LatencySummary {
  const p50 = dQuantile(d, 0.5);
  const p95 = Math.max(p50, dQuantile(d, 0.95));
  const p99 = Math.max(p95, dQuantile(d, 0.99));
  return { mean: dMean(d), p50, p95, p99 };
}

// ───────────── phép toán ─────────────
function compMean(c: Comp): number { return c.shift + c.scale; }

function mergePair(a: Comp, b: Comp): Comp {
  const w = a.w + b.w;
  const ma = compMean(a);
  const mb = compMean(b);
  const m = (a.w * ma + b.w * mb) / w;
  const e2 = (a.w * (a.scale * a.scale + ma * ma) + b.w * (b.scale * b.scale + mb * mb)) / w;
  const scale = Math.sqrt(Math.max(0, e2 - m * m));
  return { w, shift: Math.max(0, m - scale), scale, ok: a.ok };
}

function reduce(cs: Comp[]): Dist {
  for (let i = 0; i < cs.length; i++) {
    for (let j = cs.length - 1; j > i; j--) {
      if (cs[i].ok === cs[j].ok && Math.abs(cs[i].shift - cs[j].shift) < 1e-7 && Math.abs(cs[i].scale - cs[j].scale) < 1e-7) {
        cs[i] = { w: cs[i].w + cs[j].w, shift: cs[i].shift, scale: cs[i].scale, ok: cs[i].ok };
        cs.splice(j, 1);
      }
    }
  }
  while (cs.length > MAXC) {
    let bi = -1;
    let bj = -1;
    let best = Infinity;
    for (let i = 0; i < cs.length; i++) {
      const mi = compMean(cs[i]);
      for (let j = i + 1; j < cs.length; j++) {
        if (cs[i].ok !== cs[j].ok) continue;
        const dm = mi - compMean(cs[j]);
        const ds = cs[i].scale - cs[j].scale;
        const cost = ((cs[i].w * cs[j].w) / (cs[i].w + cs[j].w)) * (dm * dm + ds * ds);
        if (cost < best) { best = cost; bi = i; bj = j; }
      }
    }
    if (bi < 0) {
      // chỉ còn cặp khác cờ: gộp cặp nhẹ nhất mà vẫn giữ cờ của thành phần nặng hơn
      let k1 = 0;
      for (let i = 1; i < cs.length; i++) if (cs[i].w < cs[k1].w) k1 = i;
      let k2 = k1 === 0 ? 1 : 0;
      for (let i = 0; i < cs.length; i++) if (i !== k1 && cs[i].w < cs[k2].w) k2 = i;
      bi = Math.min(k1, k2); bj = Math.max(k1, k2);
      const heavier = cs[bi].w >= cs[bj].w ? cs[bi] : cs[bj];
      cs[bi] = { ...mergePair(cs[bi], cs[bj]), ok: heavier.ok };
    } else cs[bi] = mergePair(cs[bi], cs[bj]);
    cs.splice(bj, 1);
  }
  return cs;
}

export function dShift(d: Dist, ms: number): Dist {
  if (ms === 0) return d;
  return d.map((c) => ({ w: c.w, shift: c.shift + ms, scale: c.scale, ok: c.ok }));
}

/** Đánh dấu mọi thành phần là thất bại / thành công. */
export function dMark(d: Dist, ok: boolean): Dist {
  return d.map((c) => ({ w: c.w, shift: c.shift, scale: c.scale, ok }));
}

/** Hỗn hợp có trọng số (không cần chuẩn hoá trước). */
export function dMix(parts: readonly { w: number; d: Dist }[]): Dist {
  let wsum = 0;
  for (const p of parts) if (p.w > 0) wsum += p.w;
  if (wsum <= 0) return D_ZERO;
  const cs: Comp[] = [];
  for (const p of parts) {
    if (p.w <= 0) continue;
    const f = p.w / wsum;
    for (const c of p.d) cs.push({ w: c.w * f, shift: c.shift, scale: c.scale, ok: c.ok });
  }
  return cs.length === 1 ? cs : reduce(cs);
}

/**
 * Nối tiếp A rồi B (độc lập). Thành phần thất bại của A kết thúc luôn; chỉ phần thành công của A đi tiếp
 * sang B (B có thể thành công hoặc thất bại).
 */
export function dSerial(a: Dist, b: Dist): Dist {
  if (a === D_ZERO) return b;
  if (b === D_ZERO) return a;
  const cs: Comp[] = [];
  for (const ca of a) {
    if (!ca.ok) { cs.push(ca); continue; }
    for (const cb of b) {
      const w = ca.w * cb.w;
      if (ca.scale <= EPS) cs.push({ w, shift: ca.shift + cb.shift, scale: cb.scale, ok: cb.ok });
      else if (cb.scale <= EPS) cs.push({ w, shift: ca.shift + cb.shift, scale: ca.scale, ok: cb.ok });
      else {
        const scale = Math.hypot(ca.scale, cb.scale);
        cs.push({ w, shift: ca.shift + cb.shift + ca.scale + cb.scale - scale, scale, ok: cb.ok });
      }
    }
  }
  return cs.length === 1 ? cs : reduce(cs);
}

/**
 * min(L, cap): khối lượng vượt `cap` thành điểm thất bại tại `cap` (timeout); phần còn lại giữ cờ và
 * trung bình có điều kiện.
 */
export function dTruncate(d: Dist, cap: number): Dist {
  if (!Number.isFinite(cap)) return d;
  const cs: Comp[] = [];
  let tail = 0;
  for (const c of d) {
    if (c.shift >= cap) { tail += c.w; continue; }
    if (c.scale <= EPS) { cs.push(c); continue; }
    const a = (cap - c.shift) / c.scale;
    const ps = Math.exp(-a);
    tail += c.w * ps;
    if (ps < 1e-12) { cs.push(c); continue; }
    const off = a < 1e-6 ? (cap - c.shift) / 2 : c.scale * (1 - (a * ps) / (1 - ps));
    cs.push({ w: c.w * (1 - ps), shift: c.shift, scale: Math.max(0, off), ok: c.ok });
  }
  if (tail > 1e-12) cs.push({ w: tail, shift: cap, scale: 0, ok: false });
  return cs.length === 0 ? dPoint(cap, false) : reduce(cs);
}

/**
 * Max các biến độc lập (fan-out song song): thành công ⇔ mọi nhánh thành công; độ trễ là phân phối của
 * max trên mọi request (giải Π F_i(x) = q), gói thành 1 thành phần thành công + 1 thành phần thất bại.
 */
export function dMax(parts: readonly Dist[]): Dist {
  if (parts.length === 0) return D_ZERO;
  if (parts.length === 1) return parts[0];
  const p50 = maxQ(parts, 0.5);
  const p99 = Math.max(p50, maxQ(parts, 0.99));
  const scale = Math.max(0, (p99 - p50) / (Math.log(100) - Math.log(2)));
  const shift = Math.max(0, p50 - scale * Math.LN2);
  let ok = 1;
  for (const d of parts) ok *= dOkMass(d);
  const out: Comp[] = [];
  if (ok > 0) out.push({ w: ok, shift, scale, ok: true });
  if (ok < 1) out.push({ w: 1 - ok, shift, scale, ok: false });
  return out;
}
function maxQ(parts: readonly Dist[], p: number): number {
  const n = parts.length;
  const pn = Math.pow(p, 1 / n);
  let lo = 0;
  let hi = 0;
  for (const d of parts) {
    lo = Math.max(lo, dQuantile(d, p));
    hi = Math.max(hi, dQuantile(d, pn));
  }
  if (hi - lo < EPS) return lo;
  for (let it = 0; it < 24; it++) {
    const mid = 0.5 * (lo + hi);
    let f = 1;
    for (const d of parts) f *= 1 - dSurvival(d, mid);
    if (f < p) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** Độ trễ của M lần gọi liên tiếp, M kỳ vọng thực (m<1: có thể không gọi lần nào). */
export function dScaleCalls(d: Dist, m: number): Dist {
  if (m <= 1e-9) return D_ZERO;
  const j = Math.floor(m + 1e-9);
  const f = m - j;
  let base: Dist = D_ZERO;
  for (let i = 0; i < j; i++) base = dSerial(base, d);
  if (f < 1e-6) return base;
  const more = dSerial(base, d);
  return dMix([{ w: 1 - f, d: base }, { w: f, d: more }]);
}

/**
 * Thử lại: thất bại "retryable" (tỉ lệ `rho` trong khối lượng thất bại) được thay bằng một attempt mới,
 * thực hiện với xác suất `beta` (ngân sách), trễ thêm `delays[j]` (phát hiện + backoff) mỗi lần.
 * `delays.length` = số lần thử lại tối đa.
 */
export function dRetry(d0: Dist, delays: readonly number[], rho: number, beta: number): Dist {
  let cur = d0;
  const q = rho * beta;
  for (let j = delays.length - 1; j >= 0; j--) {
    let fail = 0;
    for (const c of d0) if (!c.ok) fail += c.w;
    if (fail <= 1e-12 || q <= 0) return d0;
    // phần giữ nguyên: thành công + thất bại không được thử lại
    const keep: Comp[] = [];
    for (const c of d0) keep.push(c.ok ? c : { w: c.w * (1 - q), shift: c.shift, scale: c.scale, ok: false });
    const keepMass = 1 - fail * q;
    const parts: { w: number; d: Dist }[] = [{ w: keepMass, d: keep.map((c) => ({ ...c, w: c.w / keepMass })) }];
    parts.push({ w: fail * q, d: dShift(cur, delays[j]) });
    cur = dMix(parts);
  }
  return cur;
}

// ───────────── node ─────────────
/** Phân phối độ trễ tại 1 node (04 §2.11a): shift = qWait + W(1−θ), scale = Wθ. */
export function nodeDist(sMs: number, rho: number, c: number, cv: number, qWaitMs: number): Dist {
  const rhoEff = Math.min(Math.max(rho, 0), 0.97);
  let wq = 0;
  if (rhoEff > 0 && sMs > 0) wq = (sMs * Math.pow(rhoEff, Math.sqrt(2 * (c + 1)) - 1)) / (c * (1 - rhoEff));
  const wRest = sMs + wq;
  const theta = Math.min(1, Math.max(0, Math.max(cv, rhoEff)));
  return [{ w: 1, shift: qWaitMs + wRest * (1 - theta), scale: wRest * theta, ok: true }];
}

/** Bản tóm tắt của nodeDist: mean = qWait + W; p(q) = shift + scale·(−ln(1−q)). */
export function nodeLatency(sMs: number, rho: number, c: number, cv: number, qWaitMs: number): LatencySummary {
  return dSummary(nodeDist(sMs, rho, c, cv, qWaitMs));
}

/** Wq (ms) của công thức Sakasegawa, tách riêng cho analyze/inspector. */
export function queueingDelayMs(sMs: number, rho: number, c: number): number {
  const rhoEff = Math.min(Math.max(rho, 0), 0.97);
  if (rhoEff <= 0 || sMs <= 0) return 0;
  return (sMs * Math.pow(rhoEff, Math.sqrt(2 * (c + 1)) - 1)) / (c * (1 - rhoEff));
}

// ───────────── API theo tóm tắt (04 §2.11b) ─────────────
/** Fit shifted-exponential từ p50, p99. */
export function fitShiftExp(s: LatencySummary): { shift: number; scale: number } {
  const scale = Math.max(0, (s.p99 - s.p50) / (Math.log(100) - Math.log(2)));
  return { shift: s.p50 - scale * Math.LN2, scale };
}
function summaryDist(s: LatencySummary): Dist {
  const { shift, scale } = fitShiftExp(s);
  return [{ w: 1, shift: Math.max(0, shift), scale, ok: true }];
}
export function addNet(s: LatencySummary, ms: number): LatencySummary {
  return { mean: s.mean + ms, p50: s.p50 + ms, p95: s.p95 + ms, p99: s.p99 + ms };
}
/** Ghép nối tiếp độc lập theo tóm tắt: mean/p50 cộng, đuôi cộng bình phương. */
export function addSerial(a: LatencySummary, b: LatencySummary): LatencySummary {
  const mean = a.mean + b.mean;
  const p50 = a.p50 + b.p50;
  const p95 = Math.max(p50, mean + Math.hypot(a.p95 - a.mean, b.p95 - b.mean));
  const p99 = Math.max(p95, mean + Math.hypot(a.p99 - a.mean, b.p99 - b.mean));
  return { mean, p50, p95, p99 };
}
export function capLatency(s: LatencySummary, capMs: number): LatencySummary {
  return { mean: Math.min(s.mean, capMs), p50: Math.min(s.p50, capMs), p95: Math.min(s.p95, capMs), p99: Math.min(s.p99, capMs) };
}
export interface LatComponent { w: number; s: LatencySummary }
export function mixQuantile(comps: readonly LatComponent[], q: number): number {
  return dQuantile(dMix(comps.map((c) => ({ w: c.w, d: summaryDist(c.s) }))), q);
}
export function maxQuantile(comps: readonly LatencySummary[], q: number): number {
  const ds = comps.map(summaryDist);
  return ds.length === 0 ? 0 : maxQ(ds, q);
}
