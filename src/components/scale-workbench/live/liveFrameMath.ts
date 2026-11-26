/**
 * Hàm thuần: LiveSimFrame -> thuộc tính hiển thị (05 §3.3, §3.4).
 * Không DOM, không React ⇒ test được trong sd:test.
 */
import type {
  LiveLinkFrame,
  LiveNodeFrame,
  LiveNodeState,
  PacketKind,
} from '../types';

export const PILE_MAX = 12;
export const LUT_SEGMENTS = 48;
export const LOAD_WARN = 65;
export const LOAD_BAD = 90;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export function loadBarColor(pct: number): string {
  return pct >= LOAD_BAD ? '#e5534b' : pct >= LOAD_WARN ? '#efb041' : '#7fc278';
}

/** 1234 -> "1.2k", 1500000 -> "1.5M" */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n < 1000) return String(Math.round(n));
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export interface NodeVisual {
  tintFill: string;
  tintOpacity: number;
  barShow: boolean;
  barPct: number;
  barColor: string;
  barTextBad: boolean;
  pileCount: number;
  pileColor: string;
  showQueueText: boolean;
  queueLabel: string;
  down: boolean;
  showWarm: boolean;
  warm: number;
  shake: boolean;
  pulse: boolean;
}

const TINT: Record<LiveNodeState, { fill: string; op: number }> = {
  idle: { fill: '#9a948a', op: 0.12 },
  healthy: { fill: '#7fc278', op: 0 },
  busy: { fill: '#efb041', op: 0.18 },
  saturated: { fill: '#f08a3c', op: 0.28 },
  overloaded: { fill: '#e5534b', op: 0.38 },
  down: { fill: '#6f6a62', op: 0.6 },
  recovering: { fill: '#7d98a8', op: 0.2 },
};

/** Bảng state -> hình ảnh (05 §3.3). Frame thiếu ⇒ coi như không có overlay. */
export function nodeVisual(f: LiveNodeFrame | undefined): NodeVisual {
  const state: LiveNodeState = f?.state ?? 'healthy';
  const tint = TINT[state] ?? TINT.healthy;
  const down = state === 'down';
  const load = Math.round(Math.max(0, Math.min(100, f?.loadPct ?? 0)));
  let q = clamp01(f?.queuePct ?? 0);
  if (state === 'overloaded') q = Math.max(q, 0.85);
  const pileCount = down ? 0 : Math.ceil(q * PILE_MAX - 1e-9);
  const barShow = !down && f !== undefined && !(state === 'idle' && load < 5);
  const warm = clamp01(f?.warm ?? 0);
  return {
    tintFill: tint.fill,
    tintOpacity: f ? tint.op : 0,
    barShow,
    barPct: load,
    barColor: loadBarColor(load),
    barTextBad: load >= LOAD_BAD,
    pileCount,
    pileColor: q > 0.5 ? '#e5534b' : '#f2994a',
    showQueueText: pileCount > 0 && typeof f?.queue === 'number',
    queueLabel: typeof f?.queue === 'number' ? formatCount(f.queue) : '',
    down,
    showWarm: !down && (state === 'recovering' || warm > 0),
    warm,
    shake: state === 'saturated',
    pulse: state === 'overloaded',
  };
}

export interface LinkVisual {
  show: boolean;
  width: number;
  stroke: 'ink' | string;
  dash: string;
  opacity: number;
  errOpacity: number;
  errWidth: number;
  showCut: boolean;
  showGate: boolean;
  gateFill: string;
  gateGlyph: string;
  showLag: boolean;
  lagGap: number;
  lagWarn: boolean;
  lagText: string;
}

/** rpsMax: giá trị lớn nhất gần đây của rps (ống dày theo lưu lượng, 05 §3.4). */
export function linkVisual(f: LiveLinkFrame | undefined, rpsMax: number): LinkVisual {
  if (!f) {
    return {
      show: false, width: 1.6, stroke: 'ink', dash: '', opacity: 0, errOpacity: 0, errWidth: 1,
      showCut: false, showGate: false, gateFill: '#7fc278', gateGlyph: '', showLag: false,
      lagGap: 6, lagWarn: false, lagText: '',
    };
  }
  const max = Math.max(1, rpsMax);
  const width = 1.6 + 4.4 * clamp01(Math.log10(1 + Math.max(0, f.rps)) / Math.log10(1 + max));
  const st = f.style ?? 'solid';
  let stroke = 'ink';
  let dash = '';
  let opacity = 0.85;
  if (st === 'danger') stroke = '#e5534b';
  else if (st === 'dashed') { stroke = '#e8883a'; dash = '6 4'; }
  else if (st === 'heartbeat') { stroke = '#b79ce6'; dash = '2 5'; }
  else if (st === 'cut') { stroke = '#9a948a'; dash = '3 6'; opacity = 0.7; }
  else if (st === 'off') opacity = 0.25;
  const er = clamp01(f.errorRate);
  const br = f.breaker;
  const lag = typeof f.lagMs === 'number' && f.lagMs > 0 ? f.lagMs : 0;
  return {
    show: true,
    width,
    stroke,
    dash,
    opacity,
    errOpacity: er > 0.01 ? clamp01(0.3 + er * 1.4) : 0,
    errWidth: Math.max(1.2, width * 0.35),
    showCut: st === 'cut',
    showGate: br !== undefined,
    gateFill: br === 'open' ? '#e5534b' : br === 'half-open' ? '#efb041' : '#7fc278',
    gateGlyph: br === 'open' ? '⏸' : br === 'half-open' ? '½' : '',
    showLag: lag > 0,
    lagGap: 6 + 18 * clamp01(Math.log10(1 + lag) / 4),
    lagWarn: lag > 200,
    lagText: lag > 0 ? `lag ${Math.round(lag)} ms` : '',
  };
}

export interface PacketStyle {
  shape: 'circle' | 'square';
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  ring: boolean;
}

/** Bảng kind -> hình (05 §3.4). stroke 'ink' sẽ được thay bằng màu mực theo theme. */
export const PACKET_STYLE: Record<PacketKind, PacketStyle> = {
  request: { shape: 'circle', r: 4.4, fill: '#f3b47f', stroke: 'ink', strokeWidth: 1.5, ring: false },
  response: { shape: 'circle', r: 4.4, fill: '#9fd28f', stroke: 'ink', strokeWidth: 1.5, ring: false },
  pointer: { shape: 'circle', r: 4.4, fill: '#f4fbef', stroke: '#2f8a43', strokeWidth: 2, ring: false },
  mutation: { shape: 'square', r: 4.2, fill: '#b79ce6', stroke: 'ink', strokeWidth: 1.5, ring: false },
  'cache-hit': { shape: 'circle', r: 4.5, fill: '#efb041', stroke: 'ink', strokeWidth: 1.5, ring: false },
  retry: { shape: 'circle', r: 4.4, fill: '#e8883a', stroke: '#7a3a0c', strokeWidth: 2.2, ring: true },
  timeout: { shape: 'circle', r: 4.4, fill: '#bdb4a8', stroke: '#8a8176', strokeWidth: 1.5, ring: false },
  dropped: { shape: 'circle', r: 4.4, fill: '#e5534b', stroke: '#5e1b16', strokeWidth: 1.5, ring: false },
  error: { shape: 'square', r: 4.8, fill: '#e5534b', stroke: '#5e1b16', strokeWidth: 1.6, ring: false },
};

export interface PacketVisual {
  /** vị trí trên link, 0..1 */
  t: number;
  opacity: number;
  /** độ rơi thêm theo trục y (packet dropped) */
  dy: number;
}

/**
 * Tính vị trí/độ mờ của 1 chấm tại `progress` (đã tween). reverse => đi từ cuối link.
 * fate: timeout mờ dần tới fate, dropped rơi sau fate, cache-hit quay đầu tại fate.
 */
export function packetVisual(
  kind: PacketKind,
  progress: number,
  fate: number | undefined,
  reverse: boolean,
): PacketVisual {
  let p = clamp01(progress);
  let opacity = p < 0.04 ? p / 0.04 : p > 0.96 ? (1 - p) / 0.04 : 1;
  let dy = 0;
  if (fate !== undefined) {
    const f = clamp01(fate);
    if (kind === 'timeout') {
      opacity *= f <= 0 ? 0 : clamp01(1 - p / f);
    } else if (kind === 'dropped') {
      if (p > f) {
        dy = (p - f) * 36;
        opacity *= clamp01(1 - (p - f) / 0.25);
      }
      p = Math.min(p, f);
    } else if (kind === 'cache-hit' && p > f) {
      p = Math.max(0, 2 * f - p);
    }
  }
  return { t: reverse ? 1 - p : p, opacity: clamp01(opacity), dy };
}

/** LUT vị trí: lấy mẫu `n+1` điểm (Float32Array [x0,y0,x1,y1,…]). */
export function buildLut(
  sample: (frac: number) => { x: number; y: number },
  n: number = LUT_SEGMENTS,
): Float32Array {
  const out = new Float32Array((n + 1) * 2);
  for (let i = 0; i <= n; i++) {
    const p = sample(i / n);
    out[i * 2] = p.x;
    out[i * 2 + 1] = p.y;
  }
  return out;
}

/** Nội suy tuyến tính trong LUT; ghi vào out (không cấp phát). */
export function lutAt(lut: Float32Array, t: number, out: { x: number; y: number }): void {
  const n = lut.length / 2 - 1;
  const f = clamp01(t) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  const a = i * 2;
  out.x = lut[a] + (lut[a + 2] - lut[a]) * k;
  out.y = lut[a + 1] + (lut[a + 3] - lut[a + 1]) * k;
}

/** Làm tròn để dirty-check: đổi < step thì coi như không đổi. */
export const roundTo = (v: number, step: number): number => Math.round(v / step) * step;
