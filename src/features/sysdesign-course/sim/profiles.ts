import type { LoadProfile } from './model';

/**
 * Tốc độ tải (rps) tại thời điểm t (giây) theo profile (04 §2.3).
 * `durationSec` chỉ dùng làm chu kỳ mặc định của `diurnal`.
 */
export function rpsAt(p: LoadProfile, t: number, durationSec = 60): number {
  switch (p.kind) {
    case 'steady':
      return p.rps;
    case 'ramp': {
      if (p.overSec <= 0) return p.to;
      const f = Math.min(1, Math.max(0, t / p.overSec));
      return p.from + (p.to - p.from) * f;
    }
    case 'spike': {
      const rise = p.riseSec ?? 2;
      const fall = p.fallSec ?? 2;
      const t0 = p.atSec;
      const t1 = t0 + rise;
      const t2 = t1 + p.holdSec;
      const t3 = t2 + fall;
      if (t <= t0) return p.base;
      if (t < t1) return p.base + (p.peak - p.base) * ((t - t0) / rise);
      if (t <= t2) return p.peak;
      if (t < t3) return p.peak + (p.base - p.peak) * ((t - t2) / fall);
      return p.base;
    }
    case 'diurnal': {
      const period = p.periodSec ?? durationSec;
      if (period <= 0) return p.min;
      return p.min + (p.max - p.min) * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period));
    }
    case 'custom': {
      const pts = p.points;
      if (pts.length === 0) return 0;
      if (t <= pts[0][0]) return pts[0][1];
      const last = pts[pts.length - 1];
      if (t >= last[0]) return last[1];
      let lo = 0;
      let hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (pts[mid][0] <= t) lo = mid; else hi = mid;
      }
      const [x0, y0] = pts[lo];
      const [x1, y1] = pts[hi];
      return x1 === x0 ? y1 : y0 + (y1 - y0) * ((t - x0) / (x1 - x0));
    }
  }
}
