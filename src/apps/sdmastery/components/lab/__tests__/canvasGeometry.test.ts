// @ts-ignore -- vitest is not listed in package.json devDependencies (tests run via npx vitest)
import { describe, expect, it } from 'vitest';
import {
  CARD_H,
  CARD_W,
  DOT,
  cardsCollide,
  collidesAny,
  findFreeSpot,
  findPlacementForNew,
  gridToCanvas,
  nodeAtPoint,
  nudgePosition,
  routeOrthogonalWires,
  type CanvasPos,
  type PxPos,
} from '../canvasGeometry';
import {
  LAB_BLANK_SANDBOX_PRESET,
  LAB_CHALLENGES,
  LAB_SANDBOX_PRESET,
  type LabCanvasPreset,
} from '../../../data/labChallenges';

const px = (positions: Record<string, CanvasPos>): Record<string, PxPos> =>
  Object.fromEntries(Object.entries(positions).map(([k, p]) => [k, { x: p.x * DOT, y: p.y * DOT }]));

/** Số lần một polyline đi xuyên qua phần trong của một thẻ. */
function hitsCards(points: [number, number][], rects: Record<string, PxPos>): number {
  let n = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    for (const r of Object.values(rects)) {
      const x1 = r.x + 1;
      const x2 = r.x + CARD_W - 1;
      const y1 = r.y + 1;
      const y2 = r.y + CARD_H - 1;
      if (ay === by) {
        if (ay > y1 && ay < y2 && Math.max(ax, bx) > x1 && Math.min(ax, bx) < x2) n++;
      } else if (ax > x1 && ax < x2 && Math.max(ay, by) > y1 && Math.min(ay, by) < y2) n++;
    }
  }
  return n;
}

function isOrthogonal(points: [number, number][]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i][0] !== points[i + 1][0] && points[i][1] !== points[i + 1][1]) return false;
  }
  return true;
}

describe('gridToCanvas', () => {
  it('maps legacy cells to dot coordinates (card centred horizontally, 1-dot gaps)', () => {
    expect(gridToCanvas({ col: 0, row: 0 })).toEqual({ x: 1, y: 0 });
    expect(gridToCanvas({ col: 3, row: 2 })).toEqual({ x: 19, y: 10 });
    expect(gridToCanvas({ col: -2, row: -1 })).toEqual({ x: -11, y: -5 });
    // Tâm thẻ ngang lệch tối đa nửa chấm so với tâm ô cũ (156 px/ô)
    for (const col of [-3, 0, 1, 6]) {
      const centerOld = col * 156 + 78;
      const centerNew = gridToCanvas({ col, row: 0 }).x * DOT + CARD_W / 2;
      expect(Math.abs(centerNew - centerOld)).toBeLessThanOrEqual(DOT / 2);
    }
  });

  it('adjacent legacy cells never collide after conversion', () => {
    const a = gridToCanvas({ col: 2, row: 2 });
    for (const [dc, dr] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 0],
      [0, -1],
    ]) {
      expect(cardsCollide(a, gridToCanvas({ col: 2 + dc, row: 2 + dr }))).toBe(false);
    }
  });
});

describe('collision & free-spot search', () => {
  it('requires a 1-dot gap', () => {
    expect(cardsCollide({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe(false); // 5 wide + 1 gap
    expect(cardsCollide({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe(true);
    expect(cardsCollide({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe(false); // 4 high + 1 gap
    expect(cardsCollide({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(true);
  });

  it('returns the desired spot when free', () => {
    expect(findFreeSpot({ x: 3, y: 3 }, [{ x: 20, y: 20 }])).toEqual({ x: 3, y: 3 });
  });

  it('finds the nearest free spot that does not collide', () => {
    const others = [{ x: 0, y: 0 }];
    const spot = findFreeSpot({ x: 1, y: 1 }, others);
    expect(collidesAny(spot, others)).toBe(false);
    // Gần nhất: lùi xuống 4 chấm (y = 5) — sang phải cần 5 chấm
    expect(spot).toEqual({ x: 1, y: 5 });
  });

  it('works in a crowded area', () => {
    const others: CanvasPos[] = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) others.push({ x: i * 6, y: j * 5 });
    const spot = findFreeSpot({ x: 6, y: 5 }, others);
    expect(collidesAny(spot, others)).toBe(false);
  });

  it('places new palette nodes to the right of the diagram, then stacks', () => {
    const existing = [
      { x: 1, y: 10 },
      { x: 7, y: 10 },
    ];
    const a = findPlacementForNew(existing);
    expect(a.x).toBe(13);
    expect(collidesAny(a, existing)).toBe(false);
    const b = findPlacementForNew([...existing, a]);
    expect(collidesAny(b, [...existing, a])).toBe(false);
    expect(findPlacementForNew([])).toEqual({ x: 0, y: 0 });
  });

  it('nudges up to the step without overlapping', () => {
    const others = [{ x: 10, y: 0 }];
    expect(nudgePosition({ x: 0, y: 0 }, 1, 0, others)).toEqual({ x: 1, y: 0 });
    // x = 4 is the last free spot (4 + 5 + 1 = 10)
    expect(nudgePosition({ x: 2, y: 0 }, 5, 0, others)).toEqual({ x: 4, y: 0 });
    expect(nudgePosition({ x: 4, y: 0 }, 1, 0, others)).toBeNull();
  });
});

describe('hit-testing', () => {
  it('uses real card rects with tolerance', () => {
    const rects = { a: { x: 100, y: 100 } };
    expect(nodeAtPoint(150, 150, rects)).toBe('a');
    expect(nodeAtPoint(97, 150, rects, 6)).toBe('a');
    expect(nodeAtPoint(100 + CARD_W + 10, 150, rects, 6)).toBeNull();
    expect(nodeAtPoint(50, 50, rects)).toBeNull();
  });
});

describe('orthogonal wire router', () => {
  const link = (from: string, to: string) => ({ id: `${from}-${to}`, from, to });

  it('routes left→right as a straight line when aligned', () => {
    const pos = px({ a: { x: 0, y: 0 }, b: { x: 12, y: 0 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(w.points[0]).toEqual([CARD_W, CARD_H / 2]);
    expect(w.points[w.points.length - 1]).toEqual([12 * DOT, CARD_H / 2]);
    expect(w.points.length).toBe(2);
  });

  it('routes H-V-H when target is right and lower', () => {
    const pos = px({ a: { x: 0, y: 0 }, b: { x: 12, y: 10 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(isOrthogonal(w.points)).toBe(true);
    expect(w.points.length).toBe(4);
    expect(hitsCards(w.points, pos)).toBe(0);
  });

  it('avoids a card blocking the straight path', () => {
    const pos = px({ a: { x: 0, y: 0 }, m: { x: 8, y: 0 }, b: { x: 16, y: 0 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(isOrthogonal(w.points)).toBe(true);
    expect(hitsCards(w.points, pos)).toBe(0);
  });

  it('shifts the vertical segment away from a card in between', () => {
    // m sits where the default mid-x vertical would pass
    const pos = px({ a: { x: 0, y: 0 }, m: { x: 9, y: 4 }, b: { x: 20, y: 10 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(hitsCards(w.points, pos)).toBe(0);
  });

  it('routes around when target is left of the source', () => {
    const pos = px({ a: { x: 12, y: 0 }, b: { x: 0, y: 0 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(isOrthogonal(w.points)).toBe(true);
    expect(hitsCards(w.points, pos)).toBe(0);
    // exits right of a, enters left of b
    expect(w.points[0][0]).toBe(12 * DOT + CARD_W);
    expect(w.points[w.points.length - 1][0]).toBe(0);
  });

  it('routes stacked nodes (same column) without crossing them', () => {
    const pos = px({ a: { x: 0, y: 0 }, b: { x: 0, y: 5 } });
    const [w] = routeOrthogonalWires([link('a', 'b')], pos);
    expect(hitsCards(w.points, pos)).toBe(0);
  });

  it('spreads multiple outgoing ports', () => {
    const pos = px({ a: { x: 0, y: 5 }, b: { x: 12, y: 0 }, c: { x: 12, y: 10 } });
    const ws = routeOrthogonalWires([link('a', 'b'), link('a', 'c')], pos);
    expect(ws[0].points[0][1]).toBeLessThan(ws[1].points[0][1]);
  });

  const presets: [string, LabCanvasPreset][] = [
    ['sandbox', LAB_SANDBOX_PRESET],
    ['blank sandbox', LAB_BLANK_SANDBOX_PRESET],
    ...LAB_CHALLENGES.flatMap((c): [string, LabCanvasPreset][] => [
      [`${c.code} starter`, c.starter],
      [`${c.code} reference`, c.referenceSolution],
      [`${c.code} blank`, c.blank],
    ]),
  ];
  for (const [name, preset] of presets) {
    it(`${name}: nodes do not overlap and wires avoid cards`, () => {
      const entries = Object.entries(preset.positions);
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          expect(cardsCollide(entries[i][1], entries[j][1])).toBe(false);
        }
      }
      for (const n of preset.model.nodes) expect(preset.positions[n.id]).toBeDefined();
      const pos = px(preset.positions);
      for (const w of routeOrthogonalWires(preset.model.links, pos)) {
        expect(isOrthogonal(w.points)).toBe(true);
        expect({ link: w.link.id, hits: hitsCards(w.points, pos) }).toEqual({
          link: w.link.id,
          hits: 0,
        });
      }
    });
  }
});
