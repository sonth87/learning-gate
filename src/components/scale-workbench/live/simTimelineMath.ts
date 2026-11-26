/**
 * Hàm thuần cho SimTimeline và LiveTelemetryStrip (05 §5.2, §5.3, §9.3).
 * Không phụ thuộc React/DOM để test được trong sd:test.
 */
import type { LiveMetricSpec } from '../types';

export interface DecimatedSeries {
  t: number[];
  v: number[];
  minV: number;
  maxV: number;
}

/**
 * Decimate chuỗi (t, v) độ dài `length` về tối đa `maxPoints` điểm theo min/max mỗi bucket
 * để giữ nguyên các đỉnh nhọn (p99 spike, retry burst).
 */
export function decimateMinMax(
  t: ArrayLike<number>,
  v: ArrayLike<number>,
  length: number,
  maxPoints = 300
): DecimatedSeries {
  const n = Math.max(0, Math.min(length, t.length, v.length));
  if (n === 0) return { t: [], v: [], minV: 0, maxV: 0 };

  const outT: number[] = [];
  const outV: number[] = [];
  let minV = Infinity;
  let maxV = -Infinity;

  const pushPt = (idx: number) => {
    const ti = Number(t[idx]) || 0;
    const vi = Number.isFinite(Number(v[idx])) ? Number(v[idx]) : 0;
    outT.push(ti);
    outV.push(vi);
    if (vi < minV) minV = vi;
    if (vi > maxV) maxV = vi;
  };

  if (n <= maxPoints || maxPoints < 4) {
    for (let i = 0; i < n; i++) pushPt(i);
    return { t: outT, v: outV, minV: minV === Infinity ? 0 : minV, maxV: maxV === -Infinity ? 0 : maxV };
  }

  // Luôn giữ điểm đầu và điểm cuối, phần giữa chia bucket mỗi bucket lấy tối đa 2 điểm (min, max)
  pushPt(0);
  const innerCount = n - 2;
  const maxInner = maxPoints - 2;
  const numBuckets = Math.max(1, Math.floor(maxInner / 2));

  for (let b = 0; b < numBuckets; b++) {
    const start = 1 + Math.floor((b * innerCount) / numBuckets);
    const end = 1 + Math.floor(((b + 1) * innerCount) / numBuckets);
    if (start >= end) continue;
    let bMinIdx = start;
    let bMaxIdx = start;
    let bMinVal = Number(v[start]) || 0;
    let bMaxVal = bMinVal;
    for (let i = start + 1; i < end; i++) {
      const val = Number(v[i]) || 0;
      if (val < bMinVal) {
        bMinVal = val;
        bMinIdx = i;
      }
      if (val > bMaxVal) {
        bMaxVal = val;
        bMaxIdx = i;
      }
    }
    if (bMinIdx === bMaxIdx) {
      pushPt(bMinIdx);
    } else if (bMinIdx < bMaxIdx) {
      pushPt(bMinIdx);
      pushPt(bMaxIdx);
    } else {
      pushPt(bMaxIdx);
      pushPt(bMinIdx);
    }
  }
  pushPt(n - 1);

  return {
    t: outT,
    v: outV,
    minV: minV === Infinity ? 0 : minV,
    maxV: maxV === -Infinity ? 0 : maxV,
  };
}

/**
 * Dựng chuỗi lệnh SVG `<path d="...">` cho sparkline trên khung `[0..width] × [0..height]`.
 */
export function buildSparklinePath(
  ptsT: readonly number[],
  ptsV: readonly number[],
  durationSec: number,
  yMax: number,
  width: number,
  height: number,
  padY = 2
): string {
  const n = Math.min(ptsT.length, ptsV.length);
  if (n === 0 || durationSec <= 0 || width <= 0 || height <= 0) return '';
  const safeMax = Math.max(1e-6, yMax);
  const innerH = Math.max(1, height - padY * 2);
  const parts: string[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const xRatio = Math.max(0, Math.min(1, ptsT[i] / durationSec));
    const yRatio = Math.max(0, Math.min(1, ptsV[i] / safeMax));
    const x = (xRatio * width).toFixed(1);
    const y = (padY + innerH * (1 - yRatio)).toFixed(1);
    parts[i] = `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }
  return parts.join(' ');
}

/** Kẹp vị trí tua vào `[0, min(headT, durationSec)]` (05 §5.2, §11 mục 2). */
export function clampSeekT(rawT: number, headT: number, durationSec: number): number {
  if (!Number.isFinite(rawT)) return 0;
  const maxT = Math.max(0, Math.min(Number.isFinite(headT) ? headT : 0, durationSec));
  return Math.max(0, Math.min(maxT, Math.round(rawT * 10) / 10));
}

/** Định dạng giá trị KPI theo `LiveMetricSpec['format']`. */
export function formatLiveMetric(
  value: number | undefined,
  format: LiveMetricSpec['format']
): string {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  switch (format) {
    case 'rps':
      return `${Math.round(v).toLocaleString('en-US')} req/s`;
    case 'ms':
      if (v > 0 && v < 10) return `${v.toFixed(1)} ms`;
      return `${Math.round(v).toLocaleString('en-US')} ms`;
    case 'pct': {
      // Engine trả tỉ lệ 0..1 (errorRate, hitRatio); nếu đã là 0..100 (> 1.0001) thì giữ nguyên
      const pct = v <= 1.0001 && v >= 0 ? v * 100 : v;
      if (pct === 0) return '0%';
      if (pct < 1) return `${pct.toFixed(2)}%`;
      if (pct < 10) return `${pct.toFixed(1)}%`;
      return `${Math.round(pct)}%`;
    }
    case 'usd-hour':
      return `$${v.toFixed(2)}/h`;
    case 'count':
    default:
      return Math.round(v).toLocaleString('en-US');
  }
}

/** Đánh giá tone màu theo ngưỡng `LiveMetricSpec.tone`. */
export function evalLiveMetricTone(
  value: number | undefined,
  tone?: LiveMetricSpec['tone']
): 'default' | 'ok' | 'warn' | 'bad' {
  if (typeof value !== 'number' || !Number.isFinite(value) || !tone) return 'default';
  if (typeof tone.badAbove === 'number' && value >= tone.badAbove) return 'bad';
  if (typeof tone.badBelow === 'number' && value <= tone.badBelow) return 'bad';
  if (typeof tone.warnAbove === 'number' && value >= tone.warnAbove) return 'warn';
  if (typeof tone.warnBelow === 'number' && value <= tone.warnBelow) return 'warn';
  return 'ok';
}
