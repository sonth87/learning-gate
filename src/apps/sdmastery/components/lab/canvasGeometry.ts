/*
 * Hình học thuần (không React) cho canvas tự do của Phòng Lab.
 *
 * Hệ toạ độ: node được đặt theo "đơn vị chấm" (DOT = 26 px — đúng bước của nền chấm),
 * `CanvasPos {x, y}` là góc trên-trái của thẻ, số nguyên, có thể âm (canvas vô hạn).
 * Thẻ có kích thước nguyên số chấm (5 × 4) nên góc thẻ, cổng vào/ra và dây đều thẳng hàng với chấm.
 */

/** Bước lưới chấm (px). */
export const DOT = 26;
export const CARD_W_DOTS = 5;
export const CARD_H_DOTS = 4;
/** Kích thước thẻ node (px) — bội số của DOT. */
export const CARD_W = CARD_W_DOTS * DOT; // 130
export const CARD_H = CARD_H_DOTS * DOT; // 104
/** Khoảng cách tối thiểu giữa hai thẻ (đơn vị chấm). */
export const NODE_GAP_DOTS = 1;
/** Giới hạn chống dữ liệu hỏng (đơn vị chấm). */
export const MAX_CANVAS_COORD = 5000;

/** Toạ độ ô của lưới cũ (156 × 114 px/ô) — chỉ dùng để chuyển dữ liệu cũ. */
export interface GridPos {
  col: number;
  row: number;
}

/** Toạ độ góc trên-trái của thẻ theo đơn vị chấm. */
export interface CanvasPos {
  x: number;
  y: number;
}

/** Bước giữa hai ô lưới cũ, tính theo chấm khi chuyển đổi (ngang 6 = 156 px chính xác; dọc 5 — xem gridToCanvas). */
export const LEGACY_PITCH_X = 6;
export const LEGACY_PITCH_Y = 5;

/**
 * Chuyển ô lưới cũ → toạ độ chấm.
 * - Ngang: ô rộng 156 px = đúng 6 chấm; thẻ 5 chấm căn giữa ô → lệch 0,5 chấm, làm tròn → +1.
 *   Kết quả giữ nguyên vị trí cũ (±13 px) và khe giữa hai cột là 1 chấm.
 * - Dọc: ô cao 114 px (4,38 chấm) không chứa nổi thẻ 4 chấm + khe 1 chấm, nên dùng bước 5 chấm
 *   (130 px). Bố cục giữ nguyên thứ tự/khoảng cách tương đối, chỉ giãn nhẹ theo chiều dọc.
 */
export function gridToCanvas(p: GridPos): CanvasPos {
  return { x: p.col * LEGACY_PITCH_X + 1, y: p.row * LEGACY_PITCH_Y };
}

export function gridPositionsToCanvas<K extends string>(
  positions: Record<K, GridPos>
): Record<K, CanvasPos> {
  const out = {} as Record<K, CanvasPos>;
  for (const k of Object.keys(positions) as K[]) out[k] = gridToCanvas(positions[k]);
  return out;
}

export const isGridPos = (v: unknown): v is GridPos =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as GridPos).col === 'number' &&
  typeof (v as GridPos).row === 'number';

export const isCanvasPos = (v: unknown): v is CanvasPos =>
  typeof v === 'object' &&
  v !== null &&
  Number.isInteger((v as CanvasPos).x) &&
  Number.isInteger((v as CanvasPos).y) &&
  Math.abs((v as CanvasPos).x) <= MAX_CANVAS_COORD &&
  Math.abs((v as CanvasPos).y) <= MAX_CANVAS_COORD;

/** Làm tròn toạ độ px → chấm gần nhất. */
export const snapToDot = (px: number): number => Math.round(px / DOT);

/* ─────────────────────────── VA CHẠM / TÌM CHỖ TRỐNG ─────────────────────────── */

/** Hai thẻ (toạ độ chấm) có chồng nhau / gần hơn `gap` chấm hay không. */
export function cardsCollide(a: CanvasPos, b: CanvasPos, gap = NODE_GAP_DOTS): boolean {
  return (
    a.x < b.x + CARD_W_DOTS + gap &&
    b.x < a.x + CARD_W_DOTS + gap &&
    a.y < b.y + CARD_H_DOTS + gap &&
    b.y < a.y + CARD_H_DOTS + gap
  );
}

export function collidesAny(
  p: CanvasPos,
  others: Iterable<CanvasPos>,
  gap = NODE_GAP_DOTS
): boolean {
  for (const o of others) if (cardsCollide(p, o, gap)) return true;
  return false;
}

/**
 * Chỗ trống gần `desired` nhất (tìm theo vòng vuông lan dần ra ngoài, mỗi vòng sắp theo
 * khoảng cách Euclid). `others` không được chứa chính node đang đặt.
 */
export function findFreeSpot(
  desired: CanvasPos,
  others: CanvasPos[],
  gap = NODE_GAP_DOTS,
  maxRadius = 80
): CanvasPos {
  if (!collidesAny(desired, others, gap)) return desired;
  let best: CanvasPos | null = null;
  let bestD = Infinity;
  const consider = (x: number, y: number) => {
    const d = (x - desired.x) ** 2 + (y - desired.y) ** 2;
    if (d > bestD) return;
    // Hoà khoảng cách: ưu tiên bên phải, rồi bên dưới (ổn định, dễ đoán)
    if (d === bestD && best && (x < best.x || (x === best.x && y <= best.y))) return;
    if (collidesAny({ x, y }, others, gap)) return;
    best = { x, y };
    bestD = d;
  };
  for (let r = 1; r <= maxRadius; r++) {
    // Mọi điểm trên vòng vuông bán kính r cách tâm ≥ r → dừng khi không thể tốt hơn
    if (best && r * r > bestD) break;
    for (let dx = -r; dx <= r; dx++) {
      consider(desired.x + dx, desired.y - r);
      consider(desired.x + dx, desired.y + r);
    }
    for (let dy = -r + 1; dy <= r - 1; dy++) {
      consider(desired.x - r, desired.y + dy);
      consider(desired.x + r, desired.y + dy);
    }
  }
  if (best) return best;
  // Bất khả thi trên thực tế — mở sang phải mọi node
  const maxX = others.length ? Math.max(...others.map((o) => o.x)) : desired.x;
  return { x: maxX + CARD_W_DOTS + gap, y: desired.y };
}

/**
 * Vị trí cho node mới thêm bằng cách nhấn palette: bên phải sơ đồ hiện có, quanh tâm dọc;
 * nếu đã có node ở đó thì lấy chỗ trống gần nhất (thường xếp thành cột bên phải).
 */
export function findPlacementForNew(existing: CanvasPos[]): CanvasPos {
  if (existing.length === 0) return { x: 0, y: 0 };
  const minY = Math.min(...existing.map((p) => p.y));
  const maxY = Math.max(...existing.map((p) => p.y + CARD_H_DOTS));
  const maxRight = Math.max(...existing.map((p) => p.x + CARD_W_DOTS));
  const desired: CanvasPos = {
    x: maxRight + NODE_GAP_DOTS,
    y: Math.round((minY + maxY) / 2 - CARD_H_DOTS / 2),
  };
  return findFreeSpot(desired, existing);
}

/** Bước dịch bằng phím mũi tên: đi xa nhất có thể (≤ `step`) theo hướng mà không chạm node khác. */
export function nudgePosition(
  cur: CanvasPos,
  dx: number,
  dy: number,
  others: CanvasPos[]
): CanvasPos | null {
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const ux = Math.sign(dx);
  const uy = Math.sign(dy);
  for (let s = steps; s >= 1; s--) {
    const p = { x: cur.x + ux * s, y: cur.y + uy * s };
    if (Math.abs(p.x) > MAX_CANVAS_COORD || Math.abs(p.y) > MAX_CANVAS_COORD) continue;
    // Các ô trung gian cũng phải trống (không "nhảy qua" node khác)
    let ok = true;
    for (let i = 1; i <= s; i++) {
      if (collidesAny({ x: cur.x + ux * i, y: cur.y + uy * i }, others)) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return null;
}

/* ─────────────────────────── HIT-TEST ─────────────────────────── */

/** Toạ độ px (hệ board hiển thị) của góc trên-trái thẻ. */
export interface PxPos {
  x: number;
  y: number;
}

/** Node có thẻ chứa điểm (x, y) (px), nới `tol` px mỗi phía. Thẻ vẽ sau (trên cùng) thắng. */
export function nodeAtPoint(
  x: number,
  y: number,
  rects: Record<string, PxPos>,
  tol = 6
): string | null {
  let hit: string | null = null;
  for (const [id, p] of Object.entries(rects)) {
    if (x >= p.x - tol && x <= p.x + CARD_W + tol && y >= p.y - tol && y <= p.y + CARD_H + tol) {
      hit = id;
    }
  }
  return hit;
}

/* ─────────────────────────── ORTHOGONAL WIRE ROUTER ─────────────────────────── */

export interface WireLinkLike {
  id: string;
  from: string;
  to: string;
}

export interface RoutedWire<L extends WireLinkLike = WireLinkLike> {
  link: L;
  points: [number, number][];
  labelX: number;
  labelY: number;
}

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const PORT_SPREAD = 12;
/** Đoạn thò ra trước khi bẻ góc (px) — nửa khe giữa hai thẻ. */
const STUB = DOT / 2;
/** Kích thước ước lượng của nhãn dây (pill) để tránh đè lên thẻ. */
const LABEL_W = 64;
const LABEL_H = 17;

function segmentHitsRect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: Rect,
  inset = 1
): boolean {
  const x1 = r.x1 + inset;
  const x2 = r.x2 - inset;
  const y1 = r.y1 + inset;
  const y2 = r.y2 - inset;
  if (ay === by) {
    const lo = Math.min(ax, bx);
    const hi = Math.max(ax, bx);
    return ay > y1 && ay < y2 && hi > x1 && lo < x2;
  }
  const lo = Math.min(ay, by);
  const hi = Math.max(ay, by);
  return ax > x1 && ax < x2 && hi > y1 && lo < y2;
}

function countHits(pts: [number, number][], rects: Rect[]): number {
  let n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    if (ax === bx && ay === by) continue;
    for (const r of rects) if (segmentHitsRect(ax, ay, bx, by, r)) n++;
  }
  return n;
}

function polyLength(pts: [number, number][]): number {
  let s = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    s += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
  }
  return s;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
}

/** Bỏ điểm trùng / thẳng hàng để đếm số góc chính xác. */
function simplify(pts: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && last[0] === p[0] && last[1] === p[1]) continue;
    if (out.length >= 2) {
      const a = out[out.length - 2];
      const b = out[out.length - 1];
      if ((a[0] === b[0] && b[0] === p[0]) || (a[1] === b[1] && b[1] === p[1])) {
        out[out.length - 1] = p;
        continue;
      }
    }
    out.push(p);
  }
  return out;
}

/** Vị trí nhãn: trung điểm đoạn dài nhất mà nhãn không đè lên thẻ nào. */
function placeLabel(pts: [number, number][], rects: Rect[]): [number, number] {
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const len = Math.abs(bx - ax) + Math.abs(by - ay);
    if (len < 1) continue;
    segs.push({ cx: (ax + bx) / 2, cy: (ay + by) / 2, len, horizontal: ay === by });
  }
  if (segs.length === 0) return [pts[0][0], pts[0][1]];
  const free = (cx: number, cy: number) => {
    const lr: Rect = {
      x1: cx - LABEL_W / 2,
      x2: cx + LABEL_W / 2,
      y1: cy - LABEL_H / 2,
      y2: cy + LABEL_H / 2,
    };
    return !rects.some((r) => rectsOverlap(lr, r));
  };
  // Ưu tiên: đoạn đủ dài chứa nhãn & không đè thẻ → đoạn dài nhất
  const sorted = [...segs].sort((a, b) => b.len - a.len);
  for (const s of sorted) {
    const fits = s.horizontal ? s.len >= LABEL_W * 0.8 : s.len >= LABEL_H * 1.5;
    if (fits && free(s.cx, s.cy)) return [s.cx, s.cy];
  }
  for (const s of sorted) if (free(s.cx, s.cy)) return [s.cx, s.cy];
  return [sorted[0].cx, sorted[0].cy];
}

/**
 * Định tuyến dây vuông góc trên canvas tự do. `positions` là góc trên-trái thẻ (px).
 * Dây luôn ra từ cạnh phải nguồn và vào cạnh trái đích. Sinh vài tuyến ứng viên
 * (H-V-H với nhiều vị trí đoạn dọc; vòng qua kênh ngang trên/dưới/giữa các thẻ) rồi chọn
 * tuyến cắt ít thẻ nhất, ngắn và ít góc nhất.
 */
export function routeOrthogonalWires<L extends WireLinkLike>(
  links: L[],
  positions: Record<string, PxPos>
): RoutedWire<L>[] {
  const rectOf = (id: string): Rect => {
    const p = positions[id];
    return { x1: p.x, y1: p.y, x2: p.x + CARD_W, y2: p.y + CARD_H };
  };
  const allIds = Object.keys(positions);
  const allRects = allIds.map(rectOf);

  const outByNode = new Map<string, string[]>();
  const inByNode = new Map<string, string[]>();
  const byId = new Map(links.map((l) => [l.id, l]));
  for (const l of links) {
    if (!positions[l.from] || !positions[l.to]) continue;
    const o = outByNode.get(l.from) ?? [];
    o.push(l.id);
    outByNode.set(l.from, o);
    const inn = inByNode.get(l.to) ?? [];
    inn.push(l.id);
    inByNode.set(l.to, inn);
  }
  const yOf = (id: string) => positions[id]?.y ?? 0;
  for (const [, list] of outByNode) {
    list.sort((a, b) => yOf(byId.get(a)!.to) - yOf(byId.get(b)!.to));
  }
  for (const [, list] of inByNode) {
    list.sort((a, b) => yOf(byId.get(a)!.from) - yOf(byId.get(b)!.from));
  }

  return links.flatMap((link, linkIdx): RoutedWire<L>[] => {
    const p1 = positions[link.from];
    const p2 = positions[link.to];
    if (!p1 || !p2) return [];
    const outs = outByNode.get(link.from) ?? [link.id];
    const ins = inByNode.get(link.to) ?? [link.id];
    const outOffset = (outs.indexOf(link.id) - (outs.length - 1) / 2) * PORT_SPREAD;
    const inOffset = (ins.indexOf(link.id) - (ins.length - 1) / 2) * PORT_SPREAD;
    const xs = p1.x + CARD_W;
    const ys = p1.y + CARD_H / 2 + outOffset;
    const xe = p2.x;
    const ye = p2.y + CARD_H / 2 + inOffset;
    const lane = ((linkIdx % 3) - 1) * 4; // tách nhẹ các đoạn song song trùng nhau

    const candidates: [number, number][][] = [];

    // Họ 1: H-V-H (đích nằm bên phải nguồn)
    if (xe - xs >= 2 * 6) {
      const lo = xs + 6;
      const hi = xe - 6;
      const midXs = new Set<number>();
      const def = Math.min(hi, Math.max(lo, (xs + xe) / 2 + lane));
      midXs.add(def);
      for (const r of allRects) {
        for (const cx of [r.x1 - STUB, r.x2 + STUB]) {
          if (cx >= lo && cx <= hi) midXs.add(cx + lane);
        }
      }
      for (const mx of midXs) {
        candidates.push([
          [xs, ys],
          [mx, ys],
          [mx, ye],
          [xe, ye],
        ]);
      }
    }

    // Họ 2: ra phải → kênh ngang → vào trái (đích ở trái / chồng ngang / bị chắn)
    {
      const x1 = xs + STUB + lane;
      const x2 = xe - STUB + lane;
      const r1 = rectOf(link.from);
      const r2 = rectOf(link.to);
      const top = Math.min(r1.y1, r2.y1);
      const bottom = Math.max(r1.y2, r2.y2);
      const ys2 = new Set<number>([top - STUB + lane, bottom + STUB + lane]);
      // Khe giữa nguồn và đích khi tách nhau theo chiều dọc
      if (r1.y2 <= r2.y1) ys2.add((r1.y2 + r2.y1) / 2 + lane);
      if (r2.y2 <= r1.y1) ys2.add((r2.y2 + r1.y1) / 2 + lane);
      for (const r of allRects) {
        for (const cy of [r.y1 - STUB, r.y2 + STUB]) {
          if (cy >= top - 3 * DOT && cy <= bottom + 3 * DOT) ys2.add(cy + lane);
        }
      }
      for (const cy of ys2) {
        candidates.push([
          [xs, ys],
          [x1, ys],
          [x1, cy],
          [x2, cy],
          [x2, ye],
          [xe, ye],
        ]);
      }
    }

    let best: [number, number][] = candidates[0];
    let bestScore = Infinity;
    for (const c of candidates) {
      const pts = simplify(c);
      const score = countHits(pts, allRects) * 100000 + polyLength(pts) + (pts.length - 2) * 40;
      if (score < bestScore) {
        bestScore = score;
        best = pts;
      }
    }
    const [labelX, labelY] = placeLabel(best, allRects);
    return [{ link, points: best, labelX, labelY }];
  });
}
