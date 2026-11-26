import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Minus, MousePointerClick, Plus } from 'lucide-react';
import type { WorkbenchLang, WorkbenchTheme } from '@/stores/useWorkbenchStore';
import {
  pickText,
  type IsoNodeShape,
  type IsoTone,
  type LegacyNodeShape,
  type LiveSimSource,
  type PacketKind,
  type StageIconKind,
  type StageInspectorInfo,
  type StageLink,
  type StageNode,
  type StageScene,
  type StageZoneSlab,
} from './types';
import {
  StageInspectorPortal,
  resolveFallbackInspector,
} from './StageEntityInspector';
import { WORKBENCH_I18N } from './i18n';
import {
  createLiveFrameApplier,
  type LiveEl,
  type LiveFrameApplier,
  type LiveLinkEls,
  type LiveNodeEls,
  type LivePacketEls,
} from './live/liveStageApplier';
import { PILE_MAX } from './live/liveFrameMath';

interface Pt {
  x: number;
  y: number;
}

interface BoundsBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/* ============================================================================
 * DESIGNED-TO-SCALE EASING & MASTER CHOREOGRAPHY CONSTANTS
 * ============================================================================ */

const TIMING = {
  exit: 380,
  move: 760,
  enter: 680,
  stagger: 125,
  draw: 540,
  linkStagger: 85,
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeInOutCubic(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

/** Authentic Designed-to-Scale back-overshoot landing curve (s = 1.35) */
function easeOutBack(t: number): number {
  const c = clamp01(t);
  const u = c - 1;
  return 1 + 2.35 * u * u * u + 1.35 * u * u;
}

/* ============================================================================
 * ROUNDED ISOMETRIC GEOMETRY & OBSTACLE-AVOIDING 2:1 GRID ROUTER
 * ============================================================================ */

function roundedPolygonPath(pts: Pt[], radius: number): string {
  const n = pts.length;
  if (n < 3) return '';
  const segs: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y) || 1;

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y) || 1;

    const r = Math.min(radius, len1 * 0.42, len2 * 0.42);
    const p1x = curr.x + (v1x / len1) * r;
    const p1y = curr.y + (v1y / len1) * r;
    const p2x = curr.x + (v2x / len2) * r;
    const p2y = curr.y + (v2y / len2) * r;

    if (i === 0) {
      segs.push(`M ${p1x.toFixed(2)},${p1y.toFixed(2)}`);
    } else {
      segs.push(`L ${p1x.toFixed(2)},${p1y.toFixed(2)}`);
    }
    segs.push(`Q ${curr.x.toFixed(2)},${curr.y.toFixed(2)} ${p2x.toFixed(2)},${p2y.toFixed(2)}`);
  }

  segs.push('Z');
  return segs.join(' ');
}

function roundedPolylinePath(pts: Pt[], radius: number): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)},${pts[1].y.toFixed(2)}`;
  }

  const cmds: string[] = [`M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const dx1 = prev.x - curr.x;
    const dy1 = prev.y - curr.y;
    const len1 = Math.hypot(dx1, dy1) || 1;

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.hypot(dx2, dy2) || 1;

    const r = Math.min(radius, len1 * 0.42, len2 * 0.42);
    const sx = curr.x + (dx1 / len1) * r;
    const sy = curr.y + (dy1 / len1) * r;
    const ex = curr.x + (dx2 / len2) * r;
    const ey = curr.y + (dy2 / len2) * r;

    cmds.push(`L ${sx.toFixed(2)},${sy.toFixed(2)}`);
    cmds.push(`Q ${curr.x.toFixed(2)},${curr.y.toFixed(2)} ${ex.toFixed(2)},${ey.toFixed(2)}`);
  }

  const last = pts[pts.length - 1];
  cmds.push(`L ${last.x.toFixed(2)},${last.y.toFixed(2)}`);
  return cmds.join(' ');
}

function normalizeShape(shape: LegacyNodeShape): IsoNodeShape {
  if (shape === 'cylinder' || shape === 'db') return 'db';
  if (shape === 'laptop' || shape === 'device') return 'device';
  if (shape === 'crowd') return 'crowd';
  return 'block';
}

function splitShortLines(raw: string): string[] {
  const clean = raw.trim();
  if (clean.length <= 13) return [clean];
  const words = clean.split(/\s+/);
  if (words.length === 1) {
    return [clean.slice(0, 14)];
  }
  let line1 = words[0];
  let idx = 1;
  while (idx < words.length && (line1 + ' ' + words[idx]).length <= 12) {
    line1 += ' ' + words[idx];
    idx++;
  }
  const rest = words.slice(idx).join(' ');
  if (!rest) return [line1];
  return [line1, rest.length > 14 ? `${rest.slice(0, 13)}…` : rest];
}

function getGroundOffset(shape: LegacyNodeShape): number {
  const kind = normalizeShape(shape);
  if (kind === 'block') return 22;
  if (kind === 'db') return 16;
  if (kind === 'device') return 12;
  return 10;
}

function getGroundCenter(node: { x: number; y: number; shape: LegacyNodeShape }): Pt {
  return { x: node.x, y: node.y + getGroundOffset(node.shape) };
}

function getInitialLift(shape: LegacyNodeShape): number {
  const kind = normalizeShape(shape);
  if (kind === 'device') return 44;
  if (kind === 'crowd') return 30;
  return 108;
}

function getSilhouettePolygon(shape: LegacyNodeShape): Pt[] {
  const kind = normalizeShape(shape);
  if (kind === 'block') {
    return [
      { x: 0, y: -42 },
      { x: 56, y: -14 },
      { x: 56, y: 22 },
      { x: 0, y: 50 },
      { x: -56, y: 22 },
      { x: -56, y: -14 },
    ];
  }
  if (kind === 'device') {
    return [
      { x: 0, y: -21 },
      { x: 58, y: 8 },
      { x: 58, y: 16 },
      { x: 0, y: 45 },
      { x: -58, y: 16 },
      { x: -58, y: 8 },
    ];
  }
  if (kind === 'crowd') {
    return [
      { x: 0, y: -23 },
      { x: 58, y: 6 },
      { x: 58, y: 14 },
      { x: 0, y: 43 },
      { x: -58, y: 14 },
      { x: -58, y: 6 },
    ];
  }
  return [
    { x: 0, y: -30 },
    { x: 23, y: -25 },
    { x: 32, y: -14 },
    { x: 32, y: 23 },
    { x: 23, y: 34 },
    { x: 0, y: 39 },
    { x: -23, y: 34 },
    { x: -32, y: 23 },
    { x: -32, y: -14 },
    { x: -23, y: -25 },
  ];
}

function getBoundaryDistAlongDir(
  shape: LegacyNodeShape,
  ux: number,
  uy: number,
  extraGap = 2
): number {
  const gOff = getGroundOffset(shape);
  const poly = getSilhouettePolygon(shape);
  let bestT = Infinity;

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const rx = a.x;
    const ry = a.y - gOff;
    const denom = ux * ey - uy * ex;
    if (Math.abs(denom) < 1e-7) continue;
    const t = (rx * ey - ry * ex) / denom;
    const s = (rx * uy - ry * ux) / denom;
    if (t > 0 && s >= -1e-4 && s <= 1.0001 && t < bestT) {
      bestT = t;
    }
  }

  return (Number.isFinite(bestT) ? bestT : 36) + extraGap;
}

function hashIds(nodes: StageNode[]): number {
  const s = nodes.map((n) => n.id).join(':');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Composes clean, spacious 2:1 isometric grid layouts so blocks never overlap
 * and direct connectors align cleanly along authentic 2:1 floor axes.
 */
function composeIsometricLayout(nodes: StageNode[], links: StageLink[]): StageNode[] {
  const n = nodes.length;
  if (n === 0) return nodes;
  if (n === 1) {
    return [{ ...nodes[0], x: 0, y: -getGroundOffset(nodes[0].shape) }];
  }

  const xs = nodes.map((nd) => nd.x);
  const ys = nodes.map((nd) => nd.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);

  if (n >= 5 || (spanY >= 125 && spanX <= 440)) {
    const gxs = nodes.map((nd) => nd.x);
    const gys = nodes.map((nd) => nd.y + getGroundOffset(nd.shape));
    const cx = (Math.min(...gxs) + Math.max(...gxs)) / 2;
    const cy = (Math.min(...gys) + Math.max(...gys)) / 2;
    const spread = spanX >= 360 || spanY >= 150 ? 1.04 : 1.16;
    return nodes.map((nd) => {
      const gOff = getGroundOffset(nd.shape);
      const gx = cx + (nd.x - cx) * spread;
      const gy = cy + (nd.y + gOff - cy) * spread;
      return {
        ...nd,
        x: Math.round(gx),
        y: Math.round(gy - gOff),
      };
    });
  }

  const placeAtGround = (nd: StageNode, gx: number, gy: number): StageNode => ({
    ...nd,
    x: Math.round(gx),
    y: Math.round(gy - getGroundOffset(nd.shape)),
  });

  if (n === 2) {
    const ordered = [...nodes].sort((a, b) => a.x - b.x);
    const map = new Map<string, StageNode>();
    map.set(ordered[0].id, placeAtGround(ordered[0], -126, 63));
    map.set(ordered[1].id, placeAtGround(ordered[1], 126, -63));
    return nodes.map((nd) => map.get(nd.id) ?? nd);
  }

  const outDeg = new Map<string, number>();
  const inDeg = new Map<string, number>();
  for (const nd of nodes) {
    outDeg.set(nd.id, 0);
    inDeg.set(nd.id, 0);
  }
  for (const lk of links) {
    outDeg.set(lk.from, (outDeg.get(lk.from) ?? 0) + 1);
    inDeg.set(lk.to, (inDeg.get(lk.to) ?? 0) + 1);
  }

  if (n === 3) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const [n0, n1, n2] = sorted;
    const map = new Map<string, StageNode>();

    if ((outDeg.get(n0.id) ?? 0) >= 2 && !links.some((l) => l.from === n1.id && l.to === n2.id)) {
      map.set(n0.id, placeAtGround(n0, -168, 52));
      map.set(n1.id, placeAtGround(n1, 48, -56));
      map.set(n2.id, placeAtGround(n2, 160, 52));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    if ((inDeg.get(n2.id) ?? 0) >= 2 && !links.some((l) => l.from === n0.id && l.to === n1.id)) {
      map.set(n0.id, placeAtGround(n0, -96, -72));
      map.set(n1.id, placeAtGround(n1, -180, 68));
      map.set(n2.id, placeAtGround(n2, 136, 32));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // Chuẩn bố cục góc vuông isometric 2:1 (SW -> NE -> SE như DTS) gọn gàng, dành khoảng trống góc dưới cho bảng ghi chú
    const variant = hashIds(sorted) % 2;
    if (variant === 0) {
      map.set(n0.id, placeAtGround(n0, -176, 48));
      map.set(n1.id, placeAtGround(n1, -16, -32));
      map.set(n2.id, placeAtGround(n2, 144, 48));
    } else {
      map.set(n0.id, placeAtGround(n0, -176, -24));
      map.set(n1.id, placeAtGround(n1, -16, 56));
      map.set(n2.id, placeAtGround(n2, 144, -24));
    }
    return nodes.map((nd) => map.get(nd.id) ?? nd);
  }

  if (n === 4) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const [n0, n1, n2, n3] = sorted;
    const map = new Map<string, StageNode>();

    if ((outDeg.get(n0.id) ?? 0) >= 2 && (outDeg.get(n1.id) ?? 0) === 0 && (outDeg.get(n2.id) ?? 0) === 0) {
      map.set(n0.id, placeAtGround(n0, -180, 56));
      map.set(n1.id, placeAtGround(n1, 16, -96));
      map.set(n2.id, placeAtGround(n2, 108, -50));
      map.set(n3.id, placeAtGround(n3, 200, -4));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    if ((outDeg.get(n1.id) ?? 0) >= 2) {
      map.set(n0.id, placeAtGround(n0, -208, 56));
      map.set(n1.id, placeAtGround(n1, -32, -32));
      map.set(n2.id, placeAtGround(n2, 152, -84));
      map.set(n3.id, placeAtGround(n3, 152, 56));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    if ((inDeg.get(n2.id) ?? 0) >= 2) {
      map.set(n0.id, placeAtGround(n0, -164, -76));
      map.set(n1.id, placeAtGround(n1, -200, 72));
      map.set(n2.id, placeAtGround(n2, 28, 16));
      map.set(n3.id, placeAtGround(n3, 204, -72));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // Thay vì trải ngang zíc-zắc / \ / tốn 590px, đi dọc trục chính NE rồi rẽ vuông góc SE (gọn 408px, có chiều sâu 2.5D)
    const flip = hashIds(sorted) % 2 === 1;
    if (!flip) {
      map.set(n0.id, placeAtGround(n0, -188, 68));
      map.set(n1.id, placeAtGround(n1, -52, 0));
      map.set(n2.id, placeAtGround(n2, 84, -68));
      map.set(n3.id, placeAtGround(n3, 220, 0));
    } else {
      map.set(n0.id, placeAtGround(n0, -204, 48));
      map.set(n1.id, placeAtGround(n1, -68, -20));
      map.set(n2.id, placeAtGround(n2, 68, 48));
      map.set(n3.id, placeAtGround(n3, 204, -20));
    }
    return nodes.map((nd) => map.get(nd.id) ?? nd);
  }

  return nodes;
}

interface RectBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function rectOverlapArea(a: RectBox, b: RectBox): number {
  const ox = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const oy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  return ox * oy;
}

function distPointToSeg(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-4) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function sampleSegmentPoint(pts: Pt[], t: number): Pt {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  if (pts.length === 2) {
    return {
      x: pts[0].x + (pts[1].x - pts[0].x) * t,
      y: pts[0].y + (pts[1].y - pts[0].y) * t,
    };
  }
  const s1 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  const s2 = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
  const total = s1 + s2 || 1;
  const dist = t * total;
  if (dist <= s1 || s2 < 1e-3) {
    const u = s1 > 1e-3 ? dist / s1 : 0;
    return {
      x: pts[0].x + (pts[1].x - pts[0].x) * u,
      y: pts[0].y + (pts[1].y - pts[0].y) * u,
    };
  }
  const u = (dist - s1) / s2;
  return {
    x: pts[1].x + (pts[2].x - pts[1].x) * u,
    y: pts[1].y + (pts[2].y - pts[1].y) * u,
  };
}

function samplePolylineFromEnd(pts: Pt[], distFromEnd: number): Pt {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return pts[0];
  let rem = Math.max(0, distFromEnd);
  for (let i = pts.length - 1; i >= 1; i--) {
    const p1 = pts[i];
    const p0 = pts[i - 1];
    const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (rem <= segLen || i === 1) {
      const u = segLen > 1e-3 ? Math.min(1, rem / segLen) : 0;
      return {
        x: p1.x + (p0.x - p1.x) * u,
        y: p1.y + (p0.y - p1.y) * u,
      };
    }
    rem -= segLen;
  }
  return pts[0];
}

function getPolylineSegmentNormalAt(pts: Pt[], t: number): Pt {
  const pA = sampleSegmentPoint(pts, Math.max(0, t - 0.04));
  const pB = sampleSegmentPoint(pts, Math.min(1, t + 0.04));
  const dx = pB.x - pA.x;
  const dy = pB.y - pA.y;
  const len = Math.hypot(dx, dy) || 1;
  // Pháp tuyến hướng lên trên (ny <= 0) để nhãn nổi gọn bên cạnh dây nối như DTS
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: nx, y: ny };
}

/**
 * Pure 2:1 grid-aligned isometric elbow router:
 * Decomposes every connector onto exact SE (+2,+1) and NE (+2,-1) isometric floor axes,
 * distributes fan-out / fan-in across distinct walls (like DTS Fan-out), and trims flush!
 */
function buildIsoLink(
  link: StageLink,
  from: { id: string; x: number; y: number; shape: LegacyNodeShape },
  to: { id: string; x: number; y: number; shape: LegacyNodeShape },
  allNodes: ReadonlyArray<{ id: string; x: number; y: number; shape: LegacyNodeShape }> = [],
  degreeHint?: { outFrom: number; inTo: number; startSlotOffset?: Pt; endSlotOffset?: Pt }
): { d: string; pts: Pt[]; labelPos: Pt } {
  const rawC0 = getGroundCenter(from);
  const rawC1 = getGroundCenter(to);
  const c0: Pt = degreeHint?.startSlotOffset
    ? { x: rawC0.x + degreeHint.startSlotOffset.x, y: rawC0.y + degreeHint.startSlotOffset.y }
    : rawC0;
  const c1: Pt = degreeHint?.endSlotOffset
    ? { x: rawC1.x + degreeHint.endSlotOffset.x, y: rawC1.y + degreeHint.endSlotOffset.y }
    : rawC1;
  const dx = c1.x - c0.x;
  const dy = c1.y - c0.y;

  const a = (dx / 2 + dy) / 2; // SE (+2, +1) component
  const b = (dx / 2 - dy) / 2; // NE (+2, -1) component

  const lenA = Math.hypot(2 * a, a);
  const lenB = Math.hypot(2 * b, -b);

  let waypoints: Pt[];

  if (lenA < 10 || lenB < 10) {
    waypoints = [c0, c1];
  } else {
    const elbowSE: Pt = { x: c0.x + 2 * a, y: c0.y + a };
    const elbowNE: Pt = { x: c0.x + 2 * b, y: c0.y - b };

    const scoreElbow = (eb: Pt): number => {
      let penalty = 0;
      for (const other of allNodes) {
        if (other.id === from.id || other.id === to.id) continue;
        const oc = getGroundCenter(other);
        const d1 = distPointToSeg(oc, c0, eb);
        const d2 = distPointToSeg(oc, eb, c1);
        const minD = Math.min(d1, d2);
        if (minD < 82) {
          penalty += (82 - minD) * 10;
        }
      }
      return penalty;
    };

    const penSE = scoreElbow(elbowSE);
    const penNE = scoreElbow(elbowNE);

    let useNE: boolean;
    if (Math.abs(penNE - penSE) > 25) {
      useNE = penNE < penSE;
    } else if (link.curve !== undefined) {
      useNE = link.curve < 0;
    } else if (degreeHint && degreeHint.outFrom >= 2 && degreeHint.inTo <= 1) {
      // Fan-out (vd LB -> App 1..3): rẽ ngang NW/SE trước rồi tiến thẳng NE vào mặt trước mỗi server
      useNE = Math.abs(b) < Math.abs(a) * 0.45;
    } else if (degreeHint && degreeHint.inTo >= 2 && degreeHint.outFrom <= 1) {
      // Fan-in (vd App 1..3 -> Cache): tiến thẳng NE ra khỏi mặt sau mỗi server rồi hội tụ NW/SE
      useNE = Math.abs(b) >= Math.abs(a) * 0.45;
    } else {
      useNE = dy < -28;
    }

    waypoints = [c0, useNE ? elbowNE : elbowSE, c1];
  }

  const firstNext = waypoints[1];
  const fdx = firstNext.x - c0.x;
  const fdy = firstNext.y - c0.y;
  const fLen = Math.hypot(fdx, fdy) || 1;
  const fux = fdx / fLen;
  const fuy = fdy / fLen;
  // Tucked -1.2px behind outer border (since layer-links sits beneath layer-ents) so zero air gap ever appears
  const startTrim = Math.min(
    Math.max(8, getBoundaryDistAlongDir(from.shape, fux, fuy, -1.2)),
    fLen * 0.46
  );
  const pStart: Pt = {
    x: c0.x + fux * startTrim,
    y: c0.y + fuy * startTrim,
  };

  const lastPrev = waypoints[waypoints.length - 2];
  const ldx = c1.x - lastPrev.x;
  const ldy = c1.y - lastPrev.y;
  const lLen = Math.hypot(ldx, ldy) || 1;
  const lux = ldx / lLen;
  const luy = ldy / lLen;
  const endTrim = Math.min(
    getBoundaryDistAlongDir(to.shape, -lux, -luy, 2.8),
    lLen * 0.46
  );
  const pEnd: Pt = {
    x: c1.x - lux * endTrim,
    y: c1.y - luy * endTrim,
  };

  const finalPts =
    waypoints.length === 2 ? [pStart, pEnd] : [pStart, waypoints[1], pEnd];

  let midAnchor: Pt;
  let anchorT = 0.5;
  if (finalPts.length === 2) {
    midAnchor = {
      x: (finalPts[0].x + finalPts[1].x) / 2,
      y: (finalPts[0].y + finalPts[1].y) / 2,
    };
  } else {
    const seg1 = Math.hypot(
      finalPts[1].x - finalPts[0].x,
      finalPts[1].y - finalPts[0].y
    );
    const seg2 = Math.hypot(
      finalPts[2].x - finalPts[1].x,
      finalPts[2].y - finalPts[1].y
    );
    const total = seg1 + seg2 || 1;
    if (seg1 >= seg2) {
      midAnchor = {
        x: (finalPts[0].x + finalPts[1].x) / 2,
        y: (finalPts[0].y + finalPts[1].y) / 2,
      };
      anchorT = (seg1 * 0.5) / total;
    } else {
      midAnchor = {
        x: (finalPts[1].x + finalPts[2].x) / 2,
        y: (finalPts[1].y + finalPts[2].y) / 2,
      };
      anchorT = (seg1 + seg2 * 0.5) / total;
    }
  }

  const nrm = getPolylineSegmentNormalAt(finalPts, anchorT);
  const labelPos: Pt = {
    x: midAnchor.x + nrm.x * 24,
    y: midAnchor.y + nrm.y * 24,
  };

  return {
    d: roundedPolylinePath(finalPts, 14),
    pts: finalPts,
    labelPos,
  };
}

/** Computes a rounded 2:1 isometric floor boundary polygon around member nodes (or explicit coordinates) */
function computeZoneGeometry(
  zone: StageZoneSlab,
  nodeMap: Map<string, StageNode>
): { path: string; labelPt: Pt; corners: Pt[] } | null {
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  if (zone.nodeIds && zone.nodeIds.length > 0) {
    let found = 0;
    for (const id of zone.nodeIds) {
      const nd = nodeMap.get(id);
      if (!nd) continue;
      found++;
      const gc = getGroundCenter(nd);
      const u = gc.x / 2 + gc.y;
      const v = gc.x / 2 - gc.y;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    if (found === 0) return null;
    const padU = 44;
    const padV = 44;
    minU -= padU;
    maxU += padU;
    minV -= padV;
    maxV += padV;
  } else if (
    typeof zone.x === 'number' &&
    typeof zone.y === 'number' &&
    typeof zone.w === 'number' &&
    typeof zone.h === 'number'
  ) {
    const u0 = zone.x / 2 + zone.y;
    const v0 = zone.x / 2 - zone.y;
    minU = u0 - zone.h / 2;
    maxU = u0 + zone.h / 2;
    minV = v0 - zone.w / 2;
    maxV = v0 + zone.w / 2;
  } else {
    return null;
  }

  const toScreen = (u: number, v: number): Pt => ({
    x: u + v,
    y: (u - v) / 2,
  });

  const top = toScreen(minU, maxV);
  const right = toScreen(maxU, maxV);
  const bottom = toScreen(maxU, minV);
  const left = toScreen(minU, minV);
  const corners = [top, right, bottom, left];

  // Place skewed floor label along the unobstructed upper-back edge (top -> right)
  const labelPt = toScreen(minU + 14, maxV - 15);

  return {
    path: roundedPolygonPath(corners, 11),
    labelPt,
    corners,
  };
}

/* ============================================================================
 * PALETTE & VISUAL PRIMITIVES
 * ============================================================================ */

interface FaceGrad {
  top0: string;
  top1: string;
  side0: string;
  side1: string;
}

function getPalette(isDark: boolean): {
  ink: string;
  mutedLink: string;
  dangerLink: string;
  beatLink: string;
  grid: string;
  shadow: string;
  pillBg: string;
  pillShadow: string;
  pillInk: string;
  slab: FaceGrad;
  dead: FaceGrad;
  overload: FaceGrad;
  tones: Record<IsoTone, FaceGrad>;
} {
  if (isDark) {
    return {
      ink: '#e7ddd0',
      mutedLink: '#6a6054',
      dangerLink: '#f26d65',
      beatLink: '#6bd17e',
      grid: '#8f7d63',
      shadow: '#090806',
      pillBg: '#2e2923',
      pillShadow: '#110f0c',
      pillInk: '#f2e9dc',
      slab: { top0: '#38322b', top1: '#302b25', side0: '#29241f', side1: '#221e1a' },
      dead: { top0: '#49443e', top1: '#3e3a34', side0: '#33302b', side1: '#2a2723' },
      overload: { top0: '#663840', top1: '#552d34', side0: '#46242a', side1: '#381c21' },
      tones: {
        orange: { top0: '#6e4527', top1: '#5d391f', side0: '#4e301a', side1: '#402614' },
        green: { top0: '#3d5430', top1: '#334728', side0: '#2a3b20', side1: '#22301a' },
        blue: { top0: '#2f4966', top1: '#273e57', side0: '#203348', side1: '#19293a' },
        yellow: { top0: '#695326', top1: '#59461f', side0: '#4a3a19', side1: '#3c2f14' },
        purple: { top0: '#4c3a69', top1: '#403059', side0: '#35274a', side1: '#2b1f3c' },
        rose: { top0: '#692d35', top1: '#59252c', side0: '#4a1e24', side1: '#3b171d' },
        neutral: { top0: '#453e36', top1: '#3a342d', side0: '#302b25', side1: '#27231e' },
      },
    };
  }

  return {
    ink: '#211e1b',
    mutedLink: '#a59c90',
    dangerLink: '#c93b32',
    beatLink: '#3fa456',
    grid: '#a8916f',
    shadow: '#6b5236',
    pillBg: '#fbf6ef',
    pillShadow: '#1c1a17',
    pillInk: '#211e1b',
    slab: { top0: '#f7f0e7', top1: '#f0e7dc', side0: '#ece2d5', side1: '#e3d7c8' },
    dead: { top0: '#d0c9bf', top1: '#c2bab0', side0: '#b3aba0', side1: '#a49b90' },
    overload: { top0: '#ecd4d8', top1: '#dec0c6', side0: '#d1aeb5', side1: '#c299a2' },
    tones: {
      orange: { top0: '#fee6cc', top1: '#fcd4ad', side0: '#f9c697', side1: '#f3b47f' },
      green: { top0: '#e2f2d7', top1: '#d1e9c2', side0: '#c3e1b2', side1: '#b3d79f' },
      blue: { top0: '#dfebf9', top1: '#cde0f5', side0: '#bcd3ef', side1: '#a9c5e8' },
      yellow: { top0: '#fff3d6', top1: '#fee7b8', side0: '#fcdb9c', side1: '#f6cd82' },
      purple: { top0: '#f2eaf9', top1: '#e6dbf4', side0: '#d9cbef', side1: '#cbbae6' },
      rose: { top0: '#fde2e4', top1: '#f9cbd0', side0: '#f3b5bc', side1: '#eaa0a8' },
      neutral: { top0: '#f5eee4', top1: '#eae0d3', side0: '#dfd3c3', side1: '#d3c5b2' },
    },
  };
}

function MinimalIcon({
  kind,
  stroke,
  x = 0,
  y = 0,
  scale = 0.9,
}: {
  kind?: StageIconKind;
  stroke: string;
  x?: number;
  y?: number;
  scale?: number;
}) {
  const k = kind ?? 'cpu';
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      fill="none"
      stroke={stroke}
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {k === 'cpu' && (
        <>
          <rect x={-6.5} y={-6.5} width={13} height={13} rx={2.5} />
          <path d="M-2.5 -9.5v3M2.5 -9.5v3M-2.5 6.5v3M2.5 6.5v3M-9.5 -2.5h3M-9.5 2.5h3M6.5 -2.5h3M6.5 2.5h3" />
        </>
      )}
      {k === 'code' && <path d="M-3.5 -4.5L-8 0l4.5 4.5M3.5 -4.5L8 0 3.5 4.5" />}
      {k === 'db' && (
        <>
          <ellipse cx={0} cy={-4.5} rx={6.5} ry={2.6} />
          <path d="M-6.5 -4.5v9c0 1.5 2.9 2.6 6.5 2.6s6.5-1.1 6.5-2.6v-9" />
        </>
      )}
      {k === 'zap' && <path d="M1 -7.5L-5.5 0.5h4.5l-1 7L5.5 -0.5H1l0-7z" />}
      {k === 'hash' && <path d="M-6.5 -2.5h13M-6.5 2.5h13M-2 -7l-1.5 14M3.5 -7L2 7" />}
      {k === 'layers' && (
        <>
          <polygon points="0,-7 8,-2.5 0,2 -8,-2.5" />
          <path d="M-8 2.5L0 7l8-4.5" />
        </>
      )}
      {k === 'shield' && (
        <path d="M0 -7.5l6.5 2.8v4c0 3.9-2.8 7-6.5 8.2-3.7-1.2-6.5-4.3-6.5-8.2v-4L0 -7.5z" />
      )}
      {k === 'git' && (
        <>
          <circle cx={-4.5} cy={-4.5} r={2.2} />
          <circle cx={4.5} cy={-4.5} r={2.2} />
          <circle cx={0} cy={5} r={2.2} />
          <path d="M-4.5 -2.3C-4.5 1.5 0 0.8 0 2.8M4.5 -2.3C4.5 1.5 0 0.8 0 2.8" />
        </>
      )}
      {k === 'globe' && (
        <>
          <circle cx={0} cy={0} r={7} />
          <path d="M-7 0h14M0 -7c2.2 2 2.2 12 0 14M0 -7c-2.2 2-2.2 12 0 14" />
        </>
      )}
      {k === 'terminal' && (
        <>
          <rect x={-7.5} y={-5.5} width={15} height={11} rx={2} />
          <path d="M-4 -1.5L-1.5 1 -4 3.5M0.5 3.5h3.5" />
        </>
      )}
      {k === 'alert' && (
        <>
          <path d="M0 -7.2L7.5 6H-7.5L0 -7.2z" />
          <path d="M0 -2v3.2M0 3.8h0.01" />
        </>
      )}
      {k === 'sparkles' && (
        <path d="M0 -7.5L2 -2l5.5 2-5.5 2L0 7.5-2 2-7.5 0-2 -2 0 -7.5z" />
      )}
      {k === 'filter' && (
        <path d="M-7.5 -5.5H7.5L2 0.8v5.2l-4-2V0.8L-7.5 -5.5z" />
      )}
      {k === 'box' && (
        <>
          <polygon points="0,-7.5 7,-3.8 7,3.8 0,7.5 -7,3.8 -7,-3.8" />
          <path d="M-7 -3.8L0 0l7-3.8M0 0v7.5" />
        </>
      )}
      {k === 'clock' && (
        <>
          <circle cx={0} cy={0} r={6.8} />
          <path d="M0 -3.5V0l2.5 1.8" />
        </>
      )}
    </g>
  );
}

function TactilePill({
  x,
  y,
  text,
  bg,
  fg,
  stroke,
  shadow,
  isSelected,
  pillRef,
  initialOpacity = 1,
  onHover,
  onLeave,
  onClick,
}: {
  x: number;
  y: number;
  text: string;
  bg: string;
  fg: string;
  stroke: string;
  shadow: string;
  isSelected?: boolean;
  pillRef?: (el: SVGGElement | null) => void;
  initialOpacity?: number;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}) {
  const w = Math.max(52, text.length * 6.2 + 20);
  return (
    <g
      ref={pillRef}
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
      opacity={initialOpacity}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <rect x={-w / 2} y={-8.5} width={w} height={20} rx={10} fill={shadow} />
      <rect
        x={-w / 2}
        y={-10.5}
        width={w}
        height={20}
        rx={10}
        fill={bg}
        stroke={stroke}
        strokeWidth={isSelected ? 2.1 : 1.35}
      />
      <text
        x={0}
        y={2.4}
        textAnchor="middle"
        fontSize={9.5}
        fontWeight={750}
        fill={fg}
        fontFamily="var(--dts-font-mono)"
      >
        {text}
      </text>
    </g>
  );
}

const BLOCK_W = 56;
const BLOCK_H = 28;
const BLOCK_DROP = 36;
const TOP_OFFSET_Y = -14;

const BLOCK_OUTER_PATH = roundedPolygonPath(
  [
    { x: 0, y: TOP_OFFSET_Y - BLOCK_H },
    { x: BLOCK_W, y: TOP_OFFSET_Y },
    { x: BLOCK_W, y: TOP_OFFSET_Y + BLOCK_DROP },
    { x: 0, y: TOP_OFFSET_Y + BLOCK_DROP + BLOCK_H },
    { x: -BLOCK_W, y: TOP_OFFSET_Y + BLOCK_DROP },
    { x: -BLOCK_W, y: TOP_OFFSET_Y },
  ],
  9.5
);

const BLOCK_TOP_PATH = roundedPolygonPath(
  [
    { x: 0, y: TOP_OFFSET_Y - BLOCK_H },
    { x: BLOCK_W, y: TOP_OFFSET_Y },
    { x: 0, y: TOP_OFFSET_Y + BLOCK_H },
    { x: -BLOCK_W, y: TOP_OFFSET_Y },
  ],
  9.5
);

const BLOCK_SHEEN_PATH = roundedPolygonPath(
  [
    { x: 0, y: TOP_OFFSET_Y - BLOCK_H + 5 },
    { x: BLOCK_W - 8, y: TOP_OFFSET_Y },
    { x: 0, y: TOP_OFFSET_Y + BLOCK_H - 5 },
    { x: -BLOCK_W + 8, y: TOP_OFFSET_Y },
  ],
  8
);

const BLOCK_RIDGE_PATH = roundedPolylinePath(
  [
    { x: -BLOCK_W + 2, y: TOP_OFFSET_Y + 1 },
    { x: 0, y: TOP_OFFSET_Y + BLOCK_H },
    { x: BLOCK_W - 2, y: TOP_OFFSET_Y + 1 },
  ],
  10
);

const GROUND_SPOT_PATH = roundedPolygonPath(
  [
    { x: 0, y: -35 },
    { x: 70, y: 0 },
    { x: 0, y: 35 },
    { x: -70, y: 0 },
  ],
  9
);

const SLAB_W = 58;
const SLAB_H = 29;
const SLAB_DROP = 8;
const SLAB_OUTER = roundedPolygonPath(
  [
    { x: 0, y: -SLAB_H },
    { x: SLAB_W, y: 0 },
    { x: SLAB_W, y: SLAB_DROP },
    { x: 0, y: SLAB_H + SLAB_DROP },
    { x: -SLAB_W, y: SLAB_DROP },
    { x: -SLAB_W, y: 0 },
  ],
  8
);
const SLAB_TOP = roundedPolygonPath(
  [
    { x: 0, y: -SLAB_H },
    { x: SLAB_W, y: 0 },
    { x: 0, y: SLAB_H },
    { x: -SLAB_W, y: 0 },
  ],
  8
);

/* ============================================================================
 * PERSISTENT INTERACTIVE ISOMETRIC STAGE WITH STEP-TO-STEP MORPHING ENGINE
 * ============================================================================ */

interface NodeAnimPlan {
  kind: 'enter' | 'move' | 'exit';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromLift: number;
  toLift: number;
  fromOp: number;
  toOp: number;
  delay: number;
  dur: number;
  readyAt: number;
}

interface LinkAnimPlan {
  kind: 'draw' | 'morph';
  delay: number;
  dur: number;
  readyAt: number;
  isSolidSweep: boolean;
}

export interface ScaleStageSvgProps {
  scene: StageScene;
  lang: WorkbenchLang;
  theme: WorkbenchTheme;
  isPlaying: boolean;
  replayNonce: number;
  className?: string;
  // ── live-sim (05 §3.1) — tất cả tuỳ chọn; không truyền frameSource ⇒ hành vi cũ ──
  frameSource?: LiveSimSource;
  liveOptions?: {
    /** mặc định 200 (80 khi stage hẹp) */
    maxPackets?: number;
    /** ghi đè prefers-reduced-motion (test) */
    reducedMotion?: boolean;
    /** chấm nhận pointer events */
    tracerEnabled?: boolean;
    focus?: { nodes?: string[]; links?: string[] };
  };
  onPacketPick?: (p: { id: number; linkId: string; kind: PacketKind }) => void;
  /** Chế độ nhặt đích: click chọn entity thay vì mở inspector. */
  pickMode?: {
    accept: ('node' | 'link')[];
    onPick: (e: { kind: 'node' | 'link'; id: string }) => void;
  } | null;
  /** Nội dung số liệu live chèn vào thẻ inspector. */
  renderLiveSlot?: (e: { kind: 'node' | 'link'; id: string }) => React.ReactNode;
}

export const ScaleStageSvg: React.FC<ScaleStageSvgProps> = ({
  scene,
  lang,
  theme,
  isPlaying,
  replayNonce,
  className,
  frameSource,
  liveOptions,
  onPacketPick,
  pickMode,
  renderLiveSlot,
}) => {
  const uid = useId().replace(/:/g, '');
  const isDark = theme === 'dark';
  const pal = useMemo(() => getPalette(isDark), [isDark]);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<StageInspectorInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{
    key: string;
    info: StageInspectorInfo;
    preferLeft?: boolean;
  } | null>(null);

  const [exitingNodes, setExitingNodes] = useState<StageNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hintAutoOpen, setHintAutoOpen] = useState(true);
  const [hintHovered, setHintHovered] = useState(false);
  const [stageWidth, setStageWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gridCamRef = useRef<SVGGElement | null>(null);
  const sceneCamRef = useRef<SVGGElement | null>(null);

  // Direct DOM refs for 60-120fps choreography & morphing without per-frame React re-renders
  const nodeOuterRefs = useRef<Map<string, SVGGElement>>(new Map());
  const nodeLiftRefs = useRef<Map<string, SVGGElement>>(new Map());
  const nodeShadowRefs = useRef<Map<string, SVGElement>>(new Map());
  const spotRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const exitNodeRefs = useRef<Map<string, SVGGElement>>(new Map());
  const linkGroupRefs = useRef<Map<string, SVGGElement>>(new Map());
  const linkHitRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const linkPillRefs = useRef<Map<string, SVGGElement>>(new Map());
  const packetRefs = useRef<Map<string, SVGGElement>>(new Map());
  const staticQueueRefs = useRef<Map<string, SVGGElement>>(new Map());
  const zoneRefs = useRef<Map<string, SVGGElement>>(new Map());
  const noteCardRef = useRef<SVGGElement | null>(null);

  const prevSnapshotRef = useRef<{
    nodes: Map<string, StageNode>;
    links: Set<string>;
    bounds: BoundsBox | null;
    replayNonce: number;
  }>({
    nodes: new Map(),
    links: new Set(),
    bounds: null,
    replayNonce: -1,
  });

  const camRef = useRef<{ zoom: number; panX: number; panY: number }>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const lastDragEndRef = useRef(0);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    startPanX: number;
    startPanY: number;
    startMidX: number;
    startMidY: number;
    svgPerPx: number;
  } | null>(null);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    svgPerPx: number;
    moved: boolean;
    captured: boolean;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHintAutoOpen(false);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, []);

  // F2 (05 §3.5): scene thường ⇒ reset theo identity `scene` (hành vi cũ, không đổi);
  // live-sim ⇒ chỉ reset khi CẤU TRÚC đổi (id/shape node, id/from/to link), để zoom/pan/inspector
  // sống sót khi builder dựng lại object scene mà cấu trúc không đổi.
  const structureKey = useMemo(
    () =>
      scene.nodes.map((n) => `${n.id}:${n.shape}`).join(',') +
      '|' +
      scene.links.map((l) => `${l.id}:${l.from}>${l.to}`).join(','),
    [scene]
  );
  const resetDep: StageScene | string = frameSource ? structureKey : scene;
  useEffect(() => {
    setSelectedInfo(null);
    setHoverPreview(null);
    camRef.current = { zoom: 1, panX: 0, panY: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [resetDep]);

  // DEV: cảnh báo khi scene của step live-sim bị dựng lại quá thường xuyên (>2 lần/giây).
  const sceneChurnRef = useRef<{ scene: StageScene | null; times: number[] }>({
    scene: null,
    times: [],
  });
  if (import.meta.env.DEV && frameSource && sceneChurnRef.current.scene !== scene) {
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    const rec = sceneChurnRef.current;
    rec.scene = scene;
    rec.times = rec.times.filter((t) => now - t < 1000);
    rec.times.push(now);
    if (rec.times.length > 2) {
      console.warn(
        '[live-sim] scene thay đổi quá thường xuyên (>2 lần/giây): builder phải tạo scene một lần (memo).'
      );
      rec.times = [];
    }
  }

  const expandedNodes = useMemo(() => {
    const positioned = composeIsometricLayout(scene.nodes, scene.links);
    // Sort back-to-front by ground Y so front blocks naturally overlap behind blocks in 2.5D
    return [...positioned].sort(
      (a, b) => getGroundCenter(a).y - getGroundCenter(b).y || a.x - b.x
    );
  }, [scene.nodes, scene.links]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, StageNode>();
    for (const n of expandedNodes) m.set(n.id, n);
    return m;
  }, [expandedNodes]);

  const builtZones = useMemo(() => {
    if (!scene.zones || scene.zones.length === 0) return [];
    return scene.zones
      .map((z) => {
        const geo = computeZoneGeometry(z, nodeMap);
        return geo ? { zone: z, ...geo } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [scene.zones, nodeMap]);

  const resolveLinkLabelPlacement = useCallback(
    (
      rawPts: Pt[],
      defaultPos: Pt,
      txt: string,
      obstacles: RectBox[],
      placedPills: RectBox[]
    ): Pt => {
      const hw = Math.max(32, (txt.length * 6.2 + 20) / 2) + 4;
      const hh = 13;
      const candidates: { pt: Pt; distPenalty: number }[] = [];

      // Luôn đặt pill tách hẳn sang cạnh bên vuông góc với dây nối (24..34px), TUYỆT ĐỐI không đè lên [0,0] giữa dây!
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66]) {
        const base = sampleSegmentPoint(rawPts, t);
        const nrm = getPolylineSegmentNormalAt(rawPts, t);
        const tx = -nrm.y;
        const ty = nrm.x;
        for (const perpDist of [24, -24, 32, -32]) {
          for (const tangShift of [0, -14, 14]) {
            candidates.push({
              pt: {
                x: base.x + nrm.x * perpDist + tx * tangShift,
                y: base.y + nrm.y * perpDist + ty * tangShift,
              },
              distPenalty:
                Math.abs(t - 0.5) * 22 +
                (perpDist < 0 ? 3 : 0) +
                Math.abs(perpDist - 24) * 0.35 +
                Math.abs(tangShift) * 0.25,
            });
          }
        }
      }

      let best = defaultPos;
      let bestScore = Infinity;
      for (const cand of candidates) {
        const box: RectBox = {
          x0: cand.pt.x - hw,
          y0: cand.pt.y - hh,
          x1: cand.pt.x + hw,
          y1: cand.pt.y + hh,
        };
        let overlap = 0;
        for (const obs of obstacles) overlap += rectOverlapArea(box, obs);
        for (const prev of placedPills) overlap += rectOverlapArea(box, prev) * 1.8;
        const score = overlap * 120 + cand.distPenalty;
        if (score < bestScore) {
          bestScore = score;
          best = cand.pt;
          if (overlap === 0 && cand.distPenalty < 1) break;
        }
      }

      placedPills.push({
        x0: best.x - hw,
        y0: best.y - hh,
        x1: best.x + hw,
        y1: best.y + hh,
      });
      return best;
    },
    []
  );

  const builtLinks = useMemo(() => {
    const outDeg = new Map<string, number>();
    const inDeg = new Map<string, number>();
    for (const l of scene.links) {
      outDeg.set(l.from, (outDeg.get(l.from) ?? 0) + 1);
      inDeg.set(l.to, (inDeg.get(l.to) ?? 0) + 1);
    }

    const obstacles: RectBox[] = [];
    for (const n of expandedNodes) {
      const kind = normalizeShape(n.shape);
      const hasLoad = typeof n.loadPct === 'number' || Boolean(n.dead);
      const hasBadge = Boolean(n.badge);
      obstacles.push({
        x0: n.x - (kind === 'db' ? 40 : kind === 'block' ? 64 : 62),
        y0: n.y - (kind === 'block' ? 44 : kind === 'db' ? 34 : 26),
        x1: n.x + (kind === 'db' ? 40 : kind === 'block' ? 64 : 62),
        y1: n.y + (kind === 'block' ? 52 : kind === 'db' ? 34 : 44),
      });
      // Top pills (loadPct và badge xếp chồng phía trên cho block & db)
      if (kind === 'block' || kind === 'db') {
        const baseTopY = kind === 'block' ? n.y - 53 : n.y - 44;
        if (hasLoad) {
          obstacles.push({ x0: n.x - 45, y0: baseTopY - 12, x1: n.x + 45, y1: baseTopY + 12 });
        }
        if (hasBadge && n.badge) {
          const bTxt = pickText(n.badge.text, lang);
          const bHw = Math.max(40, (bTxt.length * 6.2 + 22) / 2);
          const bY = hasLoad ? baseTopY - 23 : baseTopY;
          obstacles.push({ x0: n.x - bHw, y0: bY - 12, x1: n.x + bHw, y1: bY + 12 });
        }
      }
      // Bottom name pill (chỉ db, crowd, device mới có 1 nhãn tên phía dưới)
      if (kind !== 'block') {
        const lbl = pickText(n.label, lang);
        const hw = Math.max(42, (lbl.length * 6.2 + 22) / 2);
        const py = kind === 'db' ? n.y + 42 : n.y + 56;
        obstacles.push({ x0: n.x - hw, y0: py - 12, x1: n.x + hw, y1: py + 12 });
      }
    }

    const rawBuilt = scene.links
      .map((l) => {
        const a = nodeMap.get(l.from);
        const b = nodeMap.get(l.to);
        if (!a || !b) return null;
        const degHint = {
          outFrom: outDeg.get(l.from) ?? 1,
          inTo: inDeg.get(l.to) ?? 1,
        };
        const raw = buildIsoLink(l, a, b, expandedNodes, degHint);
        const toLoad = !frameSource && typeof b.loadPct === 'number' && !b.dead ? b.loadPct : 0;
        const st = l.style ?? 'solid';
        const queueCount =
          st === 'off' || st === 'cut'
            ? 0
            : toLoad >= 95
              ? 5
              : toLoad >= 85
                ? 4
                : toLoad >= 75
                  ? 3
                  : toLoad >= 68
                    ? 2
                    : 0;
        const hasDrop = queueCount > 0 && toLoad >= 95;
        return { link: l, ...raw, degHint, queueCount, hasDrop };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Đưa cả các đoạn dây nối vào danh sách vật cản để nhãn đường nối không bao giờ đè lên bất kỳ dây nào
    for (const rb of rawBuilt) {
      for (const s of [0.16, 0.32, 0.5, 0.68, 0.84]) {
        const wp = sampleSegmentPoint(rb.pts, s);
        obstacles.push({ x0: wp.x - 8, y0: wp.y - 8, x1: wp.x + 8, y1: wp.y + 8 });
      }
    }

    const placedPills: RectBox[] = [];
    return rawBuilt.map((rb) => {
      if (!rb.link.label) return rb;
      const txt = pickText(rb.link.label, lang);
      if (!txt) return rb;
      const best = resolveLinkLabelPlacement(
        rb.pts,
        rb.labelPos,
        txt,
        obstacles,
        placedPills
      );
      return { ...rb, labelPos: best };
    });
  }, [scene.links, nodeMap, expandedNodes, lang, frameSource, resolveLinkLabelPlacement]);

  const { baseBounds, noteCardLayout } = useMemo(() => {
    if (expandedNodes.length === 0) {
      return {
        baseBounds: { cx: 0, cy: 0, w: 580, h: 280 } as BoundsBox,
        noteCardLayout: null,
      };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const obsList: RectBox[] = [];

    for (const n of expandedNodes) {
      const kind = normalizeShape(n.shape);
      const hasLoad = typeof n.loadPct === 'number' || Boolean(n.dead);
      const hasBadge = Boolean(n.badge);
      const topReach =
        hasLoad && hasBadge ? 90 : hasLoad || hasBadge ? 68 : 48;
      const botReach = kind === 'block' ? 54 : kind === 'db' ? 58 : 72;
      minX = Math.min(minX, n.x - 74);
      maxX = Math.max(maxX, n.x + 74);
      minY = Math.min(minY, n.y - topReach);
      maxY = Math.max(maxY, n.y + botReach);
      obsList.push({
        x0: n.x - 80,
        y0: n.y - topReach - 4,
        x1: n.x + 80,
        y1: n.y + botReach + 6,
      });
    }
    for (const bz of builtZones) {
      for (const c of bz.corners) {
        minX = Math.min(minX, c.x - 10);
        maxX = Math.max(maxX, c.x + 10);
        minY = Math.min(minY, c.y - 10);
        maxY = Math.max(maxY, c.y + 10);
      }
    }
    for (const bl of builtLinks) {
      for (const p of bl.pts) {
        minX = Math.min(minX, p.x - 18);
        maxX = Math.max(maxX, p.x + 18);
        minY = Math.min(minY, p.y - 16);
        maxY = Math.max(maxY, p.y + 16);
      }
      if (bl.link.label) {
        minX = Math.min(minX, bl.labelPos.x - 48);
        maxX = Math.max(maxX, bl.labelPos.x + 48);
        minY = Math.min(minY, bl.labelPos.y - 14);
        maxY = Math.max(maxY, bl.labelPos.y + 14);
        obsList.push({
          x0: bl.labelPos.x - 52,
          y0: bl.labelPos.y - 16,
          x1: bl.labelPos.x + 52,
          y1: bl.labelPos.y + 16,
        });
      }
    }

    let resolvedNote: {
      x: number;
      y: number;
      w: number;
      h: number;
      title: string;
      lines: Array<{ text: string; tone: 'plain' | 'muted' | 'good' | 'bad' | 'amber' }>;
      chart?: { utilPct: number; xLabel: string; yLabel: string };
    } | null = null;

    // Hide inline note card on mobile / narrow stages (< 560px) so 100% of space belongs to the model
    if (
      stageWidth >= 560 &&
      scene.noteCard &&
      (scene.noteCard.lines.length > 0 || scene.noteCard.chart)
    ) {
      const titleStr = pickText(scene.noteCard.title, lang);
      const lines = scene.noteCard.lines.map((ln) => ({
        text: pickText(ln.text, lang),
        tone: (ln.tone ?? 'plain') as 'plain' | 'muted' | 'good' | 'bad' | 'amber',
      }));
      const chart = scene.noteCard.chart
        ? {
            utilPct: Math.max(2, Math.min(100, scene.noteCard.chart.utilPct)),
            xLabel: scene.noteCard.chart.xLabel
              ? pickText(scene.noteCard.chart.xLabel, lang)
              : lang === 'en'
                ? 'utilization →'
                : 'mức sử dụng →',
            yLabel: scene.noteCard.chart.yLabel
              ? pickText(scene.noteCard.chart.yLabel, lang)
              : lang === 'en'
                ? 'latency'
                : 'độ trễ',
          }
        : undefined;
      const maxChars = Math.max(
        titleStr.length + 4,
        ...lines.map(
          (ln) =>
            ln.text.length +
            (ln.tone === 'good' || ln.tone === 'bad' || ln.tone === 'amber' ? 3 : 0)
        )
      );
      const cardW = Math.max(
        chart ? 208 : 182,
        Math.min(244, Math.round(maxChars * 5.75 + 26))
      );
      const chartBlockH = chart ? 70 : 0;
      const cardH = Math.round(30 + chartBlockH + lines.length * 18.5 + 8);

      const resolveCleanRect = (
        initX: number,
        initY: number,
        pushMode: 'right' | 'left' | 'down'
      ): { x: number; y: number } => {
        let x = initX;
        let y = initY;
        for (let pass = 0; pass < 3; pass++) {
          for (const ob of obsList) {
            const box: RectBox = {
              x0: x - 14,
              y0: y - 12,
              x1: x + cardW + 14,
              y1: y + cardH + 12,
            };
            const overlaps = !(
              box.x1 <= ob.x0 ||
              box.x0 >= ob.x1 ||
              box.y1 <= ob.y0 ||
              box.y0 >= ob.y1
            );
            if (overlaps) {
              if (pushMode === 'right') x = Math.max(x, ob.x1 + 16);
              else if (pushMode === 'left') x = Math.min(x, ob.x0 - cardW - 16);
              else y = Math.max(y, ob.y1 + 14);
            }
          }
        }
        return { x, y };
      };

      const candidates = [
        resolveCleanRect(maxX - cardW + 28, maxY - cardH + 14, 'right'),
        resolveCleanRect(minX - 28, maxY - cardH + 14, 'left'),
        resolveCleanRect(maxX - cardW + 16, maxY - cardH + 22, 'down'),
        resolveCleanRect(minX - 16, maxY - cardH + 22, 'down'),
      ];

      let best = candidates[0];
      let bestCost = Infinity;
      for (const cand of candidates) {
        const combW = Math.max(maxX, cand.x + cardW) - Math.min(minX, cand.x);
        const combH = Math.max(maxY, cand.y + cardH) - Math.min(minY, cand.y);
        // Optimize for maximum block size inside a ~2.15:1 landscape viewport
        const cost = Math.max(combH * 2.15, combW) + combH * 0.25;
        if (cost < bestCost) {
          bestCost = cost;
          best = cand;
        }
      }

      resolvedNote = {
        x: Math.round(best.x),
        y: Math.round(best.y),
        w: cardW,
        h: cardH,
        title: titleStr,
        lines,
        chart,
      };
      minX = Math.min(minX, resolvedNote.x - 8);
      maxX = Math.max(maxX, resolvedNote.x + cardW + 8);
      minY = Math.min(minY, resolvedNote.y - 8);
      maxY = Math.max(maxY, resolvedNote.y + cardH + 8);
    }

    const padX = 28;
    const padY = 22;
    const rawW = maxX - minX + padX * 2;
    const rawH = maxY - minY + padY * 2;
    const w = Math.max(540, rawW);
    const h = Math.max(255, rawH);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      baseBounds: { cx, cy, w, h } as BoundsBox,
      noteCardLayout: resolvedNote,
    };
  }, [expandedNodes, builtZones, builtLinks, scene.noteCard, lang, stageWidth]);

  const stageViewBox = useMemo(() => {
    const vx = baseBounds.cx - baseBounds.w / 2;
    const vy = baseBounds.cy - baseBounds.h / 2;
    return `${vx.toFixed(1)} ${vy.toFixed(1)} ${baseBounds.w.toFixed(1)} ${baseBounds.h.toFixed(1)}`;
  }, [baseBounds]);

  const buildCamTransform = useCallback(
    (z: number, px: number, py: number) => {
      const { cx, cy } = baseBounds;
      return `translate(${(cx + px).toFixed(2)} ${(cy + py).toFixed(2)}) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
    },
    [baseBounds]
  );

  const syncDomCamera = useCallback(
    (z: number, px: number, py: number) => {
      const tf = buildCamTransform(z, px, py);
      gridCamRef.current?.setAttribute('transform', tf);
      sceneCamRef.current?.setAttribute('transform', tf);
    },
    [buildCamTransform]
  );

  const applyCamera = useCallback(
    (nextZoom: number, nextPanX: number, nextPanY: number) => {
      const clampedZoom = Math.round(Math.max(0.55, Math.min(2.5, nextZoom)) * 100) / 100;
      const maxX = baseBounds.w * (0.12 + 0.32 * clampedZoom);
      const maxY = baseBounds.h * (0.12 + 0.32 * clampedZoom);
      const px = Math.max(-maxX, Math.min(maxX, nextPanX));
      const py = Math.max(-maxY, Math.min(maxY, nextPanY));
      camRef.current = { zoom: clampedZoom, panX: px, panY: py };
      syncDomCamera(clampedZoom, px, py);
      setZoom(clampedZoom);
      setPan({ x: px, y: py });
    },
    [baseBounds, syncDomCamera]
  );

  const handleZoomBy = useCallback(
    (delta: number) => {
      const cur = camRef.current;
      const nextZoom = Math.round(Math.max(0.55, Math.min(2.5, cur.zoom + delta)) * 100) / 100;
      const ratio = nextZoom / cur.zoom;
      applyCamera(nextZoom, cur.panX * ratio, cur.panY * ratio);
    },
    [applyCamera]
  );

  const handleResetView = useCallback(() => {
    camRef.current = { zoom: 1, panX: 0, panY: 0 };
    syncDomCamera(1, 0, 0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [syncDomCamera]);

  // Replay button also resets zoom & centers the diagram
  useEffect(() => {
    if (replayNonce > 0) {
      handleResetView();
    }
  }, [replayNonce, handleResetView]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    setStageWidth(el.getBoundingClientRect().width || window.innerWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number' && w > 0) {
        setStageWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) === 0 && Math.abs(e.deltaX) === 0) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const svgPerPx = Math.max(
        baseBounds.w / Math.max(1, rect.width),
        baseBounds.h / Math.max(1, rect.height)
      );
      const mx = (e.clientX - (rect.left + rect.width / 2)) * svgPerPx;
      const my = (e.clientY - (rect.top + rect.height / 2)) * svgPerPx;
      const cur = camRef.current;
      const step = e.deltaY < 0 ? 0.12 : -0.12;
      const nextZoom = Math.round(Math.max(0.55, Math.min(2.5, cur.zoom + step)) * 100) / 100;
      if (nextZoom === cur.zoom) return;
      const ratio = nextZoom / cur.zoom;
      applyCamera(nextZoom, mx - (mx - cur.panX) * ratio, my - (my - cur.panY) * ratio);
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [baseBounds, applyCamera]);

  /* ============================================================================
   * MASTER CHOREOGRAPHY & STEP-TO-STEP MORPHING ENGINE (rAF)
   * ============================================================================ */

  const packetElapsedRef = useRef(0);
  // F1: đúng MỘT vòng rAF được cộng dt vào packetElapsedRef. Vòng choreography là chủ
  // khi nó còn sống; vòng "Resume" chỉ chạy khi choreography đã dừng (xem bên dưới).
  const choreoAliveRef = useRef(false);
  // live-sim: thời điểm choreography "tiếp đất" xong (0 = chưa xong); overlay live chỉ hiện sau đó.
  const choreoSettledAtRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const prev = prevSnapshotRef.current;
    const isReplay = prev.replayNonce !== replayNonce || prev.nodes.size === 0;

    // 1. Diff previous vs next nodes
    const nextNodeIds = new Set(expandedNodes.map((n) => n.id));
    const removedNodes: StageNode[] = [];
    if (!isReplay) {
      for (const [id, oldNode] of prev.nodes.entries()) {
        if (!nextNodeIds.has(id)) {
          removedNodes.push(oldNode);
        }
      }
    }
    setExitingNodes(removedNodes);

    const hasExits = removedNodes.length > 0;
    let hasMoves = false;
    if (!isReplay) {
      for (const n of expandedNodes) {
        const old = prev.nodes.get(n.id);
        if (old && (Math.abs(old.x - n.x) > 2 || Math.abs(old.y - n.y) > 2)) {
          hasMoves = true;
          break;
        }
      }
    }

    // Order entering nodes back-to-front by isometric depth (gx - 2 * gy)
    const enteringSorted = expandedNodes
      .filter((n) => isReplay || !prev.nodes.has(n.id))
      .sort((a, b) => {
        const ga = getGroundCenter(a);
        const gb = getGroundCenter(b);
        return ga.y - gb.y || ga.x - gb.x;
      });
    const enterOrder = new Map<string, number>();
    enteringSorted.forEach((n, i) => enterOrder.set(n.id, i));

    const moveDelay = hasExits ? Math.round(TIMING.exit * 0.5) : 0;
    const baseEnterDelay = isReplay
      ? 0
      : hasMoves
        ? moveDelay + Math.round(TIMING.move * 0.45)
        : hasExits
          ? Math.round(TIMING.exit * 0.65)
          : 0;

    const nodePlans = new Map<string, NodeAnimPlan>();
    for (const n of expandedNodes) {
      const old = !isReplay ? prev.nodes.get(n.id) : undefined;
      if (old) {
        const moved = Math.abs(old.x - n.x) > 1 || Math.abs(old.y - n.y) > 1;
        nodePlans.set(n.id, {
          kind: 'move',
          fromX: old.x,
          fromY: old.y,
          toX: n.x,
          toY: n.y,
          fromLift: 0,
          toLift: 0,
          fromOp: old.dimmed ? 0.42 : 1,
          toOp: n.dimmed ? 0.42 : 1,
          delay: moveDelay,
          dur: moved ? TIMING.move : 280,
          readyAt: moved ? moveDelay + Math.round(TIMING.move * 0.85) : 0,
        });
      } else {
        const idx = enterOrder.get(n.id) ?? 0;
        const delay = baseEnterDelay + idx * TIMING.stagger;
        nodePlans.set(n.id, {
          kind: 'enter',
          fromX: n.x,
          fromY: n.y,
          toX: n.x,
          toY: n.y,
          fromLift: getInitialLift(n.shape),
          toLift: 0,
          fromOp: 0,
          toOp: n.dimmed ? 0.42 : 1,
          delay,
          dur: TIMING.enter,
          readyAt: delay + Math.round(TIMING.enter * 0.82),
        });
      }
    }

    // 2. Plan link choreography (links wait until BOTH endpoint blocks have landed!)
    const linkPlans = new Map<string, LinkAnimPlan>();
    let drawIdx = 0;
    for (const bl of builtLinks) {
      const l = bl.link;
      const sig = `${l.id}:${l.from}->${l.to}:${l.style ?? 'solid'}`;
      const pFrom = nodePlans.get(l.from);
      const pTo = nodePlans.get(l.to);
      const endpointsWereAlive =
        !isReplay &&
        prev.links.has(sig) &&
        pFrom?.kind === 'move' &&
        pTo?.kind === 'move';

      const st = l.style ?? 'solid';
      const isSolidSweep = st === 'solid';

      if (endpointsWereAlive) {
        linkPlans.set(l.id, {
          kind: 'morph',
          delay: moveDelay,
          dur: TIMING.move,
          readyAt: moveDelay + Math.round(TIMING.move * 0.5),
          isSolidSweep,
        });
      } else {
        const waitNodes = Math.max(pFrom?.readyAt ?? 0, pTo?.readyAt ?? 0);
        const delay = waitNodes + 65 + drawIdx * TIMING.linkStagger;
        drawIdx++;
        linkPlans.set(l.id, {
          kind: 'draw',
          delay,
          dur: TIMING.draw,
          readyAt: delay + TIMING.draw,
          isSolidSweep,
        });
      }
    }

    const fromBounds =
      !isReplay && prev.bounds ? prev.bounds : baseBounds;
    const toBounds = baseBounds;
    const boundsChanged =
      Math.abs(fromBounds.cx - toBounds.cx) > 1 ||
      Math.abs(fromBounds.cy - toBounds.cy) > 1 ||
      Math.abs(fromBounds.w - toBounds.w) > 1 ||
      Math.abs(fromBounds.h - toBounds.h) > 1;

    // Save snapshot for the NEXT step transition
    const nextMap = new Map<string, StageNode>();
    for (const n of expandedNodes) nextMap.set(n.id, n);
    const nextLinksSet = new Set<string>();
    for (const bl of builtLinks) {
      const l = bl.link;
      nextLinksSet.add(`${l.id}:${l.from}->${l.to}:${l.style ?? 'solid'}`);
    }
    prevSnapshotRef.current = {
      nodes: nextMap,
      links: nextLinksSet,
      bounds: toBounds,
      replayNonce,
    };

    // Measure SVG path lengths once mounted
    const measuredLengths = new Map<string, number>();
    const measureLinkLen = (id: string, pEl: SVGPathElement): number => {
      let cached = measuredLengths.get(id);
      if (!cached || cached < 2) {
        try {
          cached = pEl.getTotalLength();
          measuredLengths.set(id, cached);
        } catch {
          cached = 180;
        }
      }
      return cached;
    };

    const startAt = performance.now();
    let lastTick = startAt;
    let rafId = 0;
    let exitCleaned = !hasExits;
    choreoSettledAtRef.current = 0;

    const getMarkerUrl = (st?: StageLink['style']): string => {
      if (st === 'off' || st === 'heartbeat' || st === 'cut') return '';
      if (st === 'danger') return `url(#arr-danger-${uid})`;
      return `url(#arr-${uid})`;
    };

    const getDashPattern = (st?: StageLink['style']): string => {
      if (st === 'dashed') return '5.5 4.5';
      if (st === 'off') return '4 5';
      if (st === 'heartbeat') return '2 5.5';
      if (st === 'danger' || st === 'cut') return '7 5';
      return '';
    };

    const tick = (now: number) => {
      const elapsed = now - startAt;
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;

      // A. Smoothly re-frame camera viewBox across steps (when not manually zoomed)
      if (boundsChanged && svgRef.current && Math.abs(camRef.current.zoom - 1) < 0.01) {
        const bt = easeInOutCubic((elapsed - moveDelay) / TIMING.move);
        const cx = fromBounds.cx + (toBounds.cx - fromBounds.cx) * bt;
        const cy = fromBounds.cy + (toBounds.cy - fromBounds.cy) * bt;
        const w = fromBounds.w + (toBounds.w - fromBounds.w) * bt;
        const h = fromBounds.h + (toBounds.h - fromBounds.h) * bt;
        svgRef.current.setAttribute(
          'viewBox',
          `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
        );
      }

      // B. Animate exiting nodes
      if (!exitCleaned) {
        const et = clamp01(elapsed / TIMING.exit);
        const eEase = easeInOutCubic(et);
        for (const ex of removedNodes) {
          const g = exitNodeRefs.current.get(ex.id);
          if (g) {
            const lift = -22 * eEase;
            g.setAttribute('transform', `translate(${ex.x.toFixed(1)}, ${(ex.y + lift).toFixed(1)})`);
            g.setAttribute('opacity', (1 - eEase).toFixed(3));
          }
        }
        if (et >= 1) {
          exitCleaned = true;
          setExitingNodes([]);
        }
      }

      // C. Animate surviving (sliding) & entering (dropping + bouncing) nodes
      const livePositions = new Map<
        string,
        { id: string; x: number; y: number; shape: LegacyNodeShape }
      >();

      for (const n of expandedNodes) {
        const plan = nodePlans.get(n.id);
        if (!plan) continue;
        const rawT = (elapsed - plan.delay) / plan.dur;
        const outerEl = nodeOuterRefs.current.get(n.id);
        const liftEl = nodeLiftRefs.current.get(n.id);
        const shadowEl = nodeShadowRefs.current.get(n.id);
        const spotEl = spotRefs.current.get(n.id);

        let curX = plan.toX;
        let curY = plan.toY;
        let curLift = 0;
        let curOp = plan.toOp;

        if (plan.kind === 'enter') {
          if (rawT <= 0) {
            curLift = plan.fromLift;
            curOp = 0;
          } else if (rawT < 1) {
            curLift = plan.fromLift * (1 - easeOutBack(rawT));
            curOp = plan.toOp * easeOutCubic(Math.min(1, rawT * 1.35));
          }
        } else {
          const mt = easeInOutCubic(rawT);
          curX = plan.fromX + (plan.toX - plan.fromX) * mt;
          curY = plan.fromY + (plan.toY - plan.fromY) * mt;
          curOp = plan.fromOp + (plan.toOp - plan.fromOp) * mt;
        }

        livePositions.set(n.id, { id: n.id, x: curX, y: curY, shape: n.shape });

        if (outerEl) {
          outerEl.setAttribute('transform', `translate(${curX.toFixed(2)}, ${curY.toFixed(2)})`);
          outerEl.setAttribute('opacity', curOp.toFixed(3));
        }
        if (liftEl) {
          liftEl.setAttribute('transform', `translate(0, ${(-curLift).toFixed(2)})`);
        }
        if (shadowEl) {
          const baseShadowOp = isDark ? 0.42 : 0.24;
          const heightFactor = Math.max(0.14, 1 - Math.max(0, curLift) / 135);
          shadowEl.setAttribute('opacity', (baseShadowOp * heightFactor).toFixed(3));
        }
        if (spotEl) {
          const settleProgress = clamp01((elapsed - (plan.delay + plan.dur * 0.72)) / 360);
          spotEl.setAttribute('opacity', settleProgress.toFixed(3));
        }
      }

      // D. Fade in floor zones & SVG Note Card gently
      for (const bz of builtZones) {
        const zEl = zoneRefs.current.get(bz.zone.id);
        if (zEl) {
          const zt = easeOutCubic((elapsed - baseEnterDelay * 0.5) / 520);
          zEl.setAttribute('opacity', zt.toFixed(3));
        }
      }
      if (noteCardRef.current && noteCardLayout) {
        const noteDelay = baseEnterDelay + Math.min(260, enteringSorted.length * 75) + 180;
        const nt = easeOutCubic((elapsed - noteDelay) / 480);
        const ny = noteCardLayout.y + (1 - nt) * 10;
        noteCardRef.current.setAttribute(
          'transform',
          `translate(${noteCardLayout.x.toFixed(1)}, ${ny.toFixed(1)})`
        );
        noteCardRef.current.setAttribute('opacity', nt.toFixed(3));
      }

      // E. Animate links (draw AFTER both blocks land, or stretch live during morph!)
      const liveArr = Array.from(livePositions.values());
      for (const bl of builtLinks) {
        const l = bl.link;
        const plan = linkPlans.get(l.id);
        const pEl = pathRefs.current.get(l.id);
        const hitEl = linkHitRefs.current.get(l.id);
        const pillEl = linkPillRefs.current.get(l.id);
        if (!plan || !pEl) continue;

        if (plan.kind === 'morph' && hasMoves && elapsed <= plan.delay + plan.dur + 32) {
          const aPos = livePositions.get(l.from);
          const bPos = livePositions.get(l.to);
          if (aPos && bPos) {
            const liveGeo = buildIsoLink(l, aPos, bPos, liveArr, bl.degHint);
            pEl.setAttribute('d', liveGeo.d);
            hitEl?.setAttribute('d', liveGeo.d);
            measuredLengths.delete(l.id);
            if (pillEl) {
              pillEl.setAttribute(
                'transform',
                `translate(${liveGeo.labelPos.x.toFixed(1)}, ${liveGeo.labelPos.y.toFixed(1)})`
              );
              pillEl.setAttribute('opacity', '1');
            }
          }
          pEl.setAttribute('opacity', '1');
          pEl.style.strokeDashoffset = '';
          pEl.style.strokeDasharray = getDashPattern(l.style);
          const mk = getMarkerUrl(l.style);
          if (mk) pEl.setAttribute('marker-end', mk);
        } else if (plan.kind === 'draw') {
          const rawT = (elapsed - plan.delay) / plan.dur;
          if (rawT <= 0) {
            pEl.setAttribute('opacity', '0');
            pEl.removeAttribute('marker-end');
            if (pillEl) pillEl.setAttribute('opacity', '0');
          } else if (rawT < 1) {
            const draw = easeInOutCubic(rawT);
            if (plan.isSolidSweep) {
              const totalLen = measureLinkLen(l.id, pEl);
              pEl.setAttribute('opacity', '1');
              pEl.style.strokeDasharray = `${totalLen.toFixed(1)} ${totalLen.toFixed(1)}`;
              pEl.style.strokeDashoffset = `${(totalLen * (1 - draw)).toFixed(1)}`;
            } else {
              pEl.style.strokeDasharray = getDashPattern(l.style);
              pEl.style.strokeDashoffset = '';
              pEl.setAttribute('opacity', clamp01(draw * 1.35).toFixed(3));
            }
            const mk = getMarkerUrl(l.style);
            if (mk && draw > 0.95) pEl.setAttribute('marker-end', mk);
            else pEl.removeAttribute('marker-end');

            if (pillEl) {
              const pillOp = clamp01((draw - 0.56) / 0.44);
              pillEl.setAttribute('opacity', pillOp.toFixed(3));
            }
          } else {
            pEl.setAttribute('opacity', '1');
            pEl.style.strokeDashoffset = '';
            pEl.style.strokeDasharray = getDashPattern(l.style);
            const mk = getMarkerUrl(l.style);
            if (mk) pEl.setAttribute('marker-end', mk);
            else pEl.removeAttribute('marker-end');
            if (pillEl) pillEl.setAttribute('opacity', '1');
          }
        } else {
          pEl.setAttribute('opacity', '1');
          if (pillEl) pillEl.setAttribute('opacity', '1');
        }
      }

      // F. Flow traffic packets & in-line queue dots ONLY on links whose draw animation has completed!
      if (isPlayingRef.current && scene.packets.length > 0) {
        packetElapsedRef.current += dt;
      }
      const sec = packetElapsedRef.current;

      const linkQueueStopPx = new Map<string, number>();
      if (!frameSource) {
        for (const bl of builtLinks) {
          const qEl = staticQueueRefs.current.get(bl.link.id);
          const lPlan = linkPlans.get(bl.link.id);
          if (bl.queueCount > 0) {
            linkQueueStopPx.set(
              bl.link.id,
              (bl.hasDrop ? 23 : 12) + bl.queueCount * 10.5
            );
          }
          if (qEl && lPlan) {
            const fade = elapsed < lPlan.readyAt ? 0 : clamp01((elapsed - lPlan.readyAt) / 260);
            qEl.setAttribute('opacity', fade.toFixed(2));
          }
        }
      }

      for (const pkt of scene.packets) {
        const gEl = packetRefs.current.get(pkt.id);
        const pEl = pathRefs.current.get(pkt.linkId);
        const lPlan = linkPlans.get(pkt.linkId);
        if (!gEl || !pEl || !lPlan) continue;

        if (elapsed < lPlan.readyAt) {
          gEl.setAttribute('opacity', '0');
          continue;
        }

        const totalLen = measureLinkLen(pkt.linkId, pEl);
        if (totalLen <= 1) continue;

        const speed = pkt.speed ?? 0.44;
        const phase = ((sec * speed + (pkt.offset ?? 0)) % 1 + 1) % 1;
        const qStop = !pkt.reverse ? (linkQueueStopPx.get(pkt.linkId) ?? 0) : 0;
        const maxFrac = qStop > 0 ? Math.max(0.24, 1 - qStop / totalLen) : 1;
        const t = pkt.reverse ? 1 - phase : phase * maxFrac;
        const pt = pEl.getPointAtLength(t * totalLen);
        const fadeInAfterLink = clamp01((elapsed - lPlan.readyAt) / 260);
        const edgeFade =
          phase < 0.08 ? phase / 0.08 : phase > 0.9 ? (1 - phase) / 0.1 : 1;

        gEl.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        gEl.setAttribute('opacity', (edgeFade * fadeInAfterLink).toFixed(2));
      }

      const isTopologyUnchanged =
        !isReplay && !hasExits && !hasMoves && enteringSorted.length === 0;
      const maxChoreoTime = isTopologyUnchanged
        ? 180
        : Math.max(
            TIMING.exit + TIMING.move + 120,
            ...Array.from(nodePlans.values()).map((p) => p.delay + p.dur + 360),
            ...Array.from(linkPlans.values()).map((p) => p.readyAt + 280)
          ) || 1100;

      if (elapsed > maxChoreoTime && choreoSettledAtRef.current === 0) {
        choreoSettledAtRef.current = now;
      }

      if (elapsed <= maxChoreoTime || (isPlayingRef.current && scene.packets.length > 0)) {
        rafId = requestAnimationFrame(tick);
      } else {
        choreoAliveRef.current = false;
      }
    };

    choreoAliveRef.current = true;
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      choreoAliveRef.current = false;
    };
  }, [
    expandedNodes,
    builtLinks,
    builtZones,
    baseBounds,
    noteCardLayout,
    replayNonce,
    scene.packets,
    isDark,
    uid,
  ]);

  // Resume packet rAF loop cleanly if user toggles Play back ON after choreography settled
  useEffect(() => {
    if (!isPlaying || scene.packets.length === 0) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // F1: choreography còn sống ⇒ nó đã cộng dt và vẽ packet (có cổng readyAt); không cộng lần 2.
      if (choreoAliveRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }
      packetElapsedRef.current += dt;
      const sec = packetElapsedRef.current;
      const qStopByLink = new Map<string, number>();
      if (!frameSource) {
        for (const bl of builtLinks) {
          if (bl.queueCount > 0) {
            qStopByLink.set(bl.link.id, (bl.hasDrop ? 23 : 12) + bl.queueCount * 10.5);
          }
        }
      }
      for (const pkt of scene.packets) {
        const gEl = packetRefs.current.get(pkt.id);
        const pEl = pathRefs.current.get(pkt.linkId);
        if (!gEl || !pEl) continue;
        let len = 0;
        try {
          len = pEl.getTotalLength();
        } catch {
          len = 0;
        }
        if (len <= 1) continue;
        const speed = pkt.speed ?? 0.44;
        const phase = ((sec * speed + (pkt.offset ?? 0)) % 1 + 1) % 1;
        const qStop = !pkt.reverse ? (qStopByLink.get(pkt.linkId) ?? 0) : 0;
        const maxFrac = qStop > 0 ? Math.max(0.24, 1 - qStop / len) : 1;
        const t = pkt.reverse ? 1 - phase : phase * maxFrac;
        const pt = pEl.getPointAtLength(t * len);
        const fade = phase < 0.08 ? phase / 0.08 : phase > 0.9 ? (1 - phase) / 0.1 : 1;
        gEl.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        gEl.setAttribute('opacity', fade.toFixed(2));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, scene.packets, builtLinks, frameSource]);

  /* ============================================================================
   * LIVE-SIM (05 §3.2–3.4): ref map + rAF áp frame. Chỉ chạy khi có frameSource.
   * ============================================================================ */
  const liveNodeRoots = useRef<Map<string, SVGGElement>>(new Map());
  const liveLinkRoots = useRef<Map<string, SVGGElement>>(new Map());
  const livePoolRef = useRef<Array<SVGGElement | null>>([]);
  const liveLayerLinksRef = useRef<SVGGElement | null>(null);
  const liveLayerEntsRef = useRef<SVGGElement | null>(null);
  const liveLayerPacketsRef = useRef<SVGGElement | null>(null);
  const livePillRef = useRef<HTMLDivElement | null>(null);
  const liveApplierRef = useRef<LiveFrameApplier | null>(null);
  const liveMaxPackets = liveOptions?.maxPackets ?? (stageWidth < 640 ? 80 : 200);
  const liveReducedOpt = liveOptions?.reducedMotion;

  useEffect(() => {
    if (!frameSource) return;
    const reduced =
      liveReducedOpt ??
      (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const q = (root: Element, sel: string): LiveEl => root.querySelector(sel) as unknown as LiveEl;

    const nodes: LiveNodeEls[] = [];
    for (const n of expandedNodes) {
      const root = liveNodeRoots.current.get(n.id);
      if (!root) continue;
      nodes.push({
        id: n.id,
        label: pickText(n.label, lang),
        baseX: n.x,
        baseY: n.y,
        overlay: root as unknown as LiveEl,
        tint: q(root, '[data-r="tint"]'),
        warm: q(root, '[data-r="warm"]'),
        bar: q(root, '[data-r="bar"]'),
        barFill: q(root, '[data-r="barFill"]'),
        barText: q(root, '[data-r="barText"]'),
        pile: q(root, '[data-r="pile"]'),
        pileRects: Array.from(root.querySelectorAll('[data-r="pr"]')) as unknown as LiveEl[],
        queueText: q(root, '[data-r="queueText"]'),
        x: q(root, '[data-r="x"]'),
        badge: q(root, '[data-r="badge"]'),
        badgeRect: q(root, '[data-r="badgeRect"]'),
        badgeText: q(root, '[data-r="badgeText"]'),
        outer: (nodeOuterRefs.current.get(n.id) as unknown as LiveEl) ?? null,
      });
    }
    const links: LiveLinkEls[] = [];
    const pathEls = new Map<string, SVGPathElement>();
    const pathLens = new Map<string, number>();
    for (const { link } of builtLinks) {
      const root = liveLinkRoots.current.get(link.id);
      if (!root) continue;
      pathEls.set(link.id, root.querySelector('[data-r="path"]') as SVGPathElement);
      links.push({
        id: link.id,
        toNodeId: link.to,
        path: q(root, '[data-r="path"]'),
        err: q(root, '[data-r="err"]'),
        cut: q(root, '[data-r="cut"]'),
        gate: q(root, '[data-r="gate"]'),
        gateRect: q(root, '[data-r="gateRect"]'),
        gateText: q(root, '[data-r="gateText"]'),
        lag: q(root, '[data-r="lag"]'),
        lag2: q(root, '[data-r="lag2"]'),
        lagText: q(root, '[data-r="lagText"]'),
        qdots: q(root, '[data-r="qdots"]'),
        qdotCircles: Array.from(root.querySelectorAll('[data-r="qd"]')) as unknown as LiveEl[],
        qdrop: q(root, '[data-r="qdrop"]'),
      });
    }
    const pool: LivePacketEls[] = [];
    for (let i = 0; i < liveMaxPackets; i++) {
      const g = livePoolRef.current[i];
      if (!g) continue;
      pool.push({
        g: g as unknown as LiveEl,
        circle: q(g, '[data-r="c"]'),
        rect: q(g, '[data-r="r"]'),
        ring: q(g, '[data-r="ring"]'),
      });
    }
    const t = WORKBENCH_I18N[lang];
    const applier = createLiveFrameApplier({
      source: frameSource,
      nodes,
      links,
      pool,
      layers: {
        links: liveLayerLinksRef.current as unknown as LiveEl | null,
        ents: liveLayerEntsRef.current as unknown as LiveEl | null,
        packets: liveLayerPacketsRef.current as unknown as LiveEl | null,
      },
      scalePill: livePillRef.current as unknown as LiveEl | null,
      sampleLink: (id, frac) => {
        const pe = pathEls.get(id);
        if (!pe) return null;
        let len = pathLens.get(id);
        if (len === undefined) {
          try {
            len = pe.getTotalLength();
          } catch {
            len = 0;
          }
          pathLens.set(id, len);
        }
        if (len <= 1) return null;
        const pt = pe.getPointAtLength(frac * len);
        return { x: pt.x, y: pt.y };
      },
      inkColor: pal.ink,
      pillBg: pal.pillBg,
      pillInk: pal.pillInk,
      reducedMotion: Boolean(reduced),
      stateLabel: (st) => t.live.states[st as keyof typeof t.live.states] ?? st,
      ariaLabel: (label, stateText, pct) => `${label}, ${stateText}, ${t.live.loadWord} ${pct}%`,
      scaleText: (n) => t.live.packetScale(n),
      pickText: (b) => pickText(b, lang),
    });
    liveApplierRef.current = applier;
    let raf = 0;
    const loop = (now: number) => {
      const settled = choreoSettledAtRef.current;
      applier.step(now, settled > 0 && now - settled > 120, isPlayingRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      applier.dispose();
      liveApplierRef.current = null;
    };
  }, [frameSource, builtLinks, expandedNodes, pal, lang, liveMaxPackets, liveReducedOpt]);

  const renderLiveLinksAndPackets = () => (
    <>
      <g
        className="layer-live-links"
        ref={liveLayerLinksRef}
        pointerEvents="none"
        opacity={0}
        style={{ transition: 'opacity 240ms ease-out' }}
      >
        {builtLinks.map(({ link, d, pts }) => {
          const mid = sampleSegmentPoint(pts, 0.5);
          const m0 = sampleSegmentPoint(pts, 0.46);
          const m1 = sampleSegmentPoint(pts, 0.54);
          const ang = (Math.atan2(m1.y - m0.y, m1.x - m0.x) * 180) / Math.PI;
          const tf = `translate(${mid.x.toFixed(1)}, ${mid.y.toFixed(1)})`;
          return (
            <g
              key={link.id}
              data-live-link={link.id}
              ref={(el) => {
                if (el) liveLinkRoots.current.set(link.id, el);
                else liveLinkRoots.current.delete(link.id);
              }}
            >
              <path data-r="path" d={d} fill="none" stroke={pal.ink} strokeLinecap="round" strokeLinejoin="round" opacity={0} display="none" />
              <path data-r="err" d={d} fill="none" stroke="#e5534b" strokeLinecap="round" strokeLinejoin="round" opacity={0} display="none" />
              <g data-r="cut" transform={tf} display="none">
                <circle r={7.5} fill={pal.pillBg} stroke="#9a948a" strokeWidth={1.5} />
                <path d="M-3.2,-3.2 L3.2,3.2 M3.2,-3.2 L-3.2,3.2" stroke="#9a948a" strokeWidth={2} strokeLinecap="round" />
              </g>
              <g data-r="gate" transform={tf} display="none">
                <rect data-r="gateRect" x={-5} y={-7} width={10} height={14} rx={2.5} fill="#7fc278" stroke={pal.ink} strokeWidth={1.4} />
                <text data-r="gateText" x={0} y={3.2} textAnchor="middle" fontSize={8} fontWeight={800} fill={pal.pillInk} />
              </g>
              <g data-r="lag" transform={`${tf} rotate(${ang.toFixed(1)})`} display="none">
                <line x1={0} y1={-7} x2={0} y2={7} stroke={pal.ink} strokeWidth={1.6} strokeLinecap="round" />
                <line data-r="lag2" x1={0} y1={-7} x2={0} y2={7} stroke={pal.ink} strokeWidth={1.6} strokeLinecap="round" />
                <text data-r="lagText" x={0} y={-13} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={pal.pillInk} fontFamily="var(--dts-font-mono)" />
              </g>
              <g data-r="qdots" display="none">
                {[0, 1, 2, 3, 4].map((qi) => (
                  <circle
                    key={qi}
                    data-r="qd"
                    r={4.2}
                    fill="#efb041"
                    stroke={pal.ink}
                    strokeWidth={1.45}
                    display="none"
                  />
                ))}
              </g>
              <g data-r="qdrop" display="none">
                <circle r={5.4} fill="#e05249" stroke={pal.ink} strokeWidth={1.4} />
                <path
                  d="M-2.2,-2.2 L2.2,2.2 M2.2,-2.2 L-2.2,2.2"
                  stroke="#ffffff"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                />
              </g>
            </g>
          );
        })}
      </g>
      <g
        className="layer-live-packets"
        ref={liveLayerPacketsRef}
        pointerEvents="none"
        opacity={0}
        style={{ transition: 'opacity 240ms ease-out' }}
      >
        {Array.from({ length: liveMaxPackets }, (_, i) => (
          <g
            key={i}
            ref={(el) => {
              livePoolRef.current[i] = el;
            }}
            display="none"
          >
            <circle data-r="ring" r={7.4} fill="none" stroke="#7a3a0c" strokeWidth={0.9} display="none" />
            <circle data-r="c" r={4.4} />
            <rect data-r="r" rx={2.2} display="none" />
            {liveOptions?.tracerEnabled && (
              <circle
                r={10}
                fill="transparent"
                pointerEvents="all"
                data-no-pan="true"
                style={{ cursor: 'pointer' }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const meta = liveApplierRef.current?.packetAtSlot(i);
                  if (meta) onPacketPick?.(meta);
                }}
              />
            )}
          </g>
        ))}
      </g>
    </>
  );

  const renderLiveEnts = () => (
    <g
      className="layer-live-ents"
      ref={liveLayerEntsRef}
      pointerEvents="none"
      opacity={0}
      style={{ transition: 'opacity 240ms ease-out' }}
    >
      {expandedNodes.map((node) => {
        const poly = getSilhouettePolygon(node.shape);
        let minY = Infinity;
        let maxY = -Infinity;
        let maxX = 0;
        for (const p of poly) {
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
          maxX = Math.max(maxX, p.x);
        }
        const points = poly.map((p) => `${p.x},${p.y}`).join(' ');
        const cyMid = (minY + maxY) / 2;
        const warmRx = maxX * 0.85;
        return (
          <g
            key={node.id}
            data-live-node={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            ref={(el) => {
              if (el) liveNodeRoots.current.set(node.id, el);
              else liveNodeRoots.current.delete(node.id);
            }}
          >
            <polygon
              data-r="tint"
              points={points}
              fill="none"
              stroke="none"
              strokeWidth={1.4}
              strokeLinejoin="round"
              opacity={0}
              style={{ mixBlendMode: isDark ? 'screen' : 'multiply' }}
            />
            {pickMode?.accept.includes('node') && (
              <polygon
                points={points}
                fill="none"
                stroke="#2f8a43"
                strokeWidth={1.8}
                strokeDasharray="4 3"
                strokeLinejoin="round"
              />
            )}
            <ellipse
              data-r="warm"
              cx={0}
              cy={getGroundOffset(node.shape) + 4}
              rx={warmRx}
              ry={warmRx * 0.5}
              fill="none"
              stroke="#7d98a8"
              strokeWidth={3}
              strokeLinecap="round"
              pathLength={100}
              display="none"
            />
            <g data-r="bar" transform={`translate(0, ${minY - 13})`} display="none">
              <rect x={-41} y={-8.5} width={82} height={19} rx={9.5} fill={pal.pillShadow} />
              <rect x={-41} y={-10.5} width={82} height={19} rx={9.5} fill={pal.pillBg} stroke={pal.ink} strokeWidth={1.3} />
              <g transform="translate(-31.5, -1)" fill="none" stroke={pal.ink} strokeWidth={1.25} strokeLinecap="round">
                <circle r={2.8} />
                <path d="M0,-4.5V-3.4 M0,3.4V4.5 M-3.9,-2.2L-3,-1.7 M3,1.7L3.9,2.2 M-3.9,2.2L-3,1.7 M3,-1.7L3.9,-2.2" />
              </g>
              <rect x={-22} y={-4} width={30} height={6} rx={3} fill={isDark ? '#423b33' : '#e6ddd0'} />
              <rect data-r="barFill" x={-22} y={-4} width={3} height={6} rx={3} fill="#7fc278" />
              <text data-r="barText" x={34} y={2.4} textAnchor="end" fontSize={9.5} fontWeight={800} fill={pal.pillInk} fontFamily="var(--dts-font-mono)" />
            </g>
            {/* Giữ DOM pile ẩn (opacity=0) để tương thích test liveStageApplier, hiển thị hàng đợi thật trực tiếp trên dây nối (qdots) */}
            <g opacity={0} pointerEvents="none">
              <g data-r="pile" transform={`translate(${-maxX - 12}, ${maxY - 6})`} display="none">
                {Array.from({ length: PILE_MAX }, (_, i) => (
                  <rect
                    key={i}
                    data-r="pr"
                    x={-3}
                    y={-4 - i * 5.2}
                    width={6}
                    height={4}
                    rx={1}
                    fill="#f2994a"
                    stroke={pal.ink}
                    strokeWidth={0.6}
                    display="none"
                  />
                ))}
                <text data-r="queueText" x={0} y={8} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={pal.pillInk} fontFamily="var(--dts-font-mono)" display="none" />
              </g>
            </g>
            <g data-r="x" display="none">
              <path d="M-12,-12 L12,12 M12,-12 L-12,12" transform={`translate(0, ${cyMid})`} stroke="#e5534b" strokeWidth={4.5} strokeLinecap="round" />
              <text x={0} y={cyMid + 30} textAnchor="middle" fontSize={9.5} fontWeight={900} fill="#e5534b" fontFamily="var(--dts-font-mono)">
                {WORKBENCH_I18N[lang].live.down}
              </text>
            </g>
            <g data-r="badge" transform={`translate(0, ${minY - 36})`} display="none">
              <rect data-r="badgeRect" x={-30} y={-10.5} width={60} height={20} rx={10} fill={pal.pillBg} stroke={pal.ink} strokeWidth={1.35} />
              <text data-r="badgeText" x={0} y={2.4} textAnchor="middle" fontSize={9.5} fontWeight={750} fill={pal.pillInk} fontFamily="var(--dts-font-mono)" />
            </g>
          </g>
        );
      })}
    </g>
  );

  const liveSlotNode: React.ReactNode =
    selectedInfo && frameSource && renderLiveSlot
      ? (() => {
          const key = selectedInfo.key;
          const i = key.indexOf(':');
          const kind = key.slice(0, i);
          const id = key.slice(i + 1);
          if (kind === 'node') return renderLiveSlot({ kind: 'node', id });
          if (kind === 'link' || kind === 'pill') return renderLiveSlot({ kind: 'link', id });
          return null;
        })()
      : undefined;


  const getNodeInspector = (node: StageNode): StageInspectorInfo => {
    if (node.inspector) return node.inspector;
    const rawLabel = pickText(node.label, lang);
    const sub = node.badge
      ? pickText(node.badge.text, lang)
      : node.sublabel
        ? pickText(node.sublabel, lang)
        : undefined;
    return resolveFallbackInspector(rawLabel, sub, false);
  };

  const getLinkInspector = (link: StageLink): StageInspectorInfo => {
    if (link.inspector) return link.inspector;
    const lbl = link.label
      ? pickText(link.label, lang)
      : `${link.from} → ${link.to}`;
    return resolveFallbackInspector(lbl, undefined, true);
  };

  const isViewModified = Math.abs(zoom - 1) > 0.005 || Math.hypot(pan.x, pan.y) > 2;
  const stageBgColor = isDark ? '#24201c' : '#faf3e9';
  const initialCamTf = buildCamTransform(zoom, pan.x, pan.y);

  const finishPan = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (pinchRef.current && activePointersRef.current.size < 2) {
      pinchRef.current = null;
      lastDragEndRef.current = performance.now();
      setIsPanning(false);
      setZoom(camRef.current.zoom);
      setPan({ x: camRef.current.panX, y: camRef.current.panY });

      // Seamlessly hand off remaining 1 finger to panDragRef so lifting 1 finger never jumps
      if (activePointersRef.current.size === 1) {
        const [remId, remPt] = Array.from(activePointersRef.current.entries())[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPerPx = Math.max(
          baseBounds.w / Math.max(1, rect.width),
          baseBounds.h / Math.max(1, rect.height)
        );
        panDragRef.current = {
          pointerId: remId,
          startX: remPt.x,
          startY: remPt.y,
          origPanX: camRef.current.panX,
          origPanY: camRef.current.panY,
          svgPerPx,
          moved: true,
          captured: false,
        };
      }
      return;
    }

    const st = panDragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    panDragRef.current = null;
    if (st.moved) {
      lastDragEndRef.current = performance.now();
      setIsPanning(false);
      setPan({ x: camRef.current.panX, y: camRef.current.panY });
    } else {
      const target = e.target as Element;
      if (!target.closest('[data-iso-interactive="true"]')) {
        setSelectedInfo(null);
      }
    }
  };

  const maxSceneLoad = useMemo(() => {
    let m = 0;
    for (const n of scene.nodes) {
      if (typeof n.loadPct === 'number' && n.loadPct > m) m = n.loadPct;
    }
    return m;
  }, [scene.nodes]);

  const renderLoadBarPill = (pctRaw: number, yPos: number) => {
    const pct = Math.max(0, Math.min(100, Math.round(pctRaw)));
    const barColor = pct >= 90 ? '#e5534b' : pct >= 65 ? '#efb041' : '#7fc278';
    return (
      <g transform={`translate(0, ${yPos})`}>
        <rect x={-41} y={-8.5} width={82} height={19} rx={9.5} fill={pal.pillShadow} />
        <rect
          x={-41}
          y={-10.5}
          width={82}
          height={19}
          rx={9.5}
          fill={pal.pillBg}
          stroke={pct >= 90 ? pal.dangerLink : pal.ink}
          strokeWidth={1.35}
        />
        <g
          transform="translate(-31.5, -1)"
          fill="none"
          stroke={pal.ink}
          strokeWidth={1.25}
          strokeLinecap="round"
        >
          <circle r={2.8} />
          <path d="M0,-4.5V-3.4 M0,3.4V4.5 M-3.9,-2.2L-3,-1.7 M3,1.7L3.9,2.2 M-3.9,2.2L-3,1.7 M3,-1.7L3.9,-2.2" />
        </g>
        <rect
          x={-22}
          y={-4}
          width={30}
          height={6}
          rx={3}
          fill={isDark ? '#423b33' : '#e6ddd0'}
        />
        <rect
          x={-22}
          y={-4}
          width={Math.max(3, (30 * pct) / 100)}
          height={6}
          rx={3}
          fill={barColor}
        />
        <text
          x={34}
          y={2.4}
          textAnchor="end"
          fontSize={9.5}
          fontWeight={800}
          fill={pct >= 90 ? '#c93b32' : pal.pillInk}
          fontFamily="var(--dts-font-mono)"
        >
          {pct}%
        </text>
      </g>
    );
  };

  const renderNodeBody = (
    node: StageNode,
    isHovered: boolean,
    isSelected: boolean,
    isExiting = false
  ) => {
    const kind = normalizeShape(node.shape);
    const rawLabel = pickText(node.label, lang);
    const lines = splitShortLines(rawLabel);
    const strokeW = isHovered || isSelected ? 2.35 : 1.85;
    const isDead = Boolean(node.dead);
    const isOverloaded =
      !isDead && !frameSource && typeof node.loadPct === 'number' && node.loadPct >= 88;
    const topGrad = isDead
      ? `url(#g-dead-top-${uid})`
      : isOverloaded
        ? `url(#g-overload-top-${uid})`
        : `url(#g-${node.tone}-top-${uid})`;
    const sideGrad = isDead
      ? `url(#g-dead-side-${uid})`
      : isOverloaded
        ? `url(#g-overload-side-${uid})`
        : `url(#g-${node.tone}-side-${uid})`;
    const hasStaticLoad = !isDead && !frameSource && typeof node.loadPct === 'number';

    return (
      <>
        {/* A. ROUNDED 8-LAYER ISOMETRIC BLOCK (top-stacked pills only — zero bottom wire collisions!) */}
        {kind === 'block' && (
          <g>
            {isOverloaded && (
              <ellipse
                cx={0}
                cy={14}
                rx={64}
                ry={36}
                fill="#e5534b"
                opacity={isDark ? 0.24 : 0.16}
                filter={`url(#blur-lg-${uid})`}
              />
            )}
            <path
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeShadowRefs.current.set(node.id, el);
                      else nodeShadowRefs.current.delete(node.id);
                    }
                  : undefined
              }
              d={BLOCK_OUTER_PATH}
              transform="translate(0, 9)"
              fill={pal.shadow}
              opacity={isDark ? 0.42 : 0.24}
              filter={`url(#blur-lg-${uid})`}
            />
            <g
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeLiftRefs.current.set(node.id, el);
                      else nodeLiftRefs.current.delete(node.id);
                    }
                  : undefined
              }
            >
              <path d={BLOCK_OUTER_PATH} fill={sideGrad} />
              <path
                d={`M 0,${TOP_OFFSET_Y + BLOCK_H} L ${BLOCK_W - 2},${TOP_OFFSET_Y + 1} L ${BLOCK_W - 2},${TOP_OFFSET_Y + BLOCK_DROP} L 0,${TOP_OFFSET_Y + BLOCK_DROP + BLOCK_H} Z`}
                fill="#3a2a14"
                opacity={isDark ? 0.14 : 0.055}
              />
              <path d={BLOCK_TOP_PATH} fill={topGrad} />
              <path
                d={BLOCK_SHEEN_PATH}
                fill="#ffffff"
                opacity={isDark ? 0.08 : 0.22}
                filter={`url(#blur-sm-${uid})`}
              />
              <path
                d={BLOCK_RIDGE_PATH}
                transform="translate(0, 1.3)"
                fill="none"
                stroke="#ffffff"
                strokeOpacity={isDark ? 0.26 : 0.76}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <path
                d={BLOCK_RIDGE_PATH}
                transform="translate(0, 3.2)"
                fill="none"
                stroke="#5a4123"
                strokeOpacity={0.07}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <path
                d={BLOCK_OUTER_PATH}
                fill="none"
                stroke={pal.ink}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />

              {isDead ? (
                <g
                  transform="translate(0, -19)"
                  stroke={pal.dangerLink}
                  strokeWidth={3.1}
                  strokeLinecap="round"
                >
                  <path d="M-8.5,-8.5 L8.5,8.5 M8.5,-8.5 L-8.5,8.5" />
                </g>
              ) : (
                <MinimalIcon kind={node.icon} stroke={pal.ink} x={0} y={-20} />
              )}

              <g opacity={isDead ? 0.58 : 1}>
                {lines.length === 1 ? (
                  <text
                    x={0}
                    y={13.5}
                    textAnchor="middle"
                    fontSize={11.5}
                    fontWeight={800}
                    fill={pal.ink}
                    fontFamily="var(--dts-font-mono)"
                  >
                    {lines[0]}
                  </text>
                ) : (
                  <>
                    <text
                      x={0}
                      y={8.5}
                      textAnchor="middle"
                      fontSize={10.8}
                      fontWeight={800}
                      fill={pal.ink}
                      fontFamily="var(--dts-font-mono)"
                    >
                      {lines[0]}
                    </text>
                    <text
                      x={0}
                      y={20.5}
                      textAnchor="middle"
                      fontSize={10.2}
                      fontWeight={800}
                      fill={pal.ink}
                      fontFamily="var(--dts-font-mono)"
                    >
                      {lines[1]}
                    </text>
                  </>
                )}
              </g>

              {isDead && (
                <TactilePill
                  x={0}
                  y={-53}
                  text={lang === 'en' ? '⚠ DOWN' : '⚠ NGỪNG ĐÁP ỨNG'}
                  bg={pal.tones.rose.top0}
                  fg={isDark ? '#fde2e4' : '#7f1d1d'}
                  stroke={pal.dangerLink}
                  shadow={pal.pillShadow}
                />
              )}

              {hasStaticLoad && renderLoadBarPill(node.loadPct!, -53)}

              {!frameSource && node.badge && (
                <TactilePill
                  x={0}
                  y={hasStaticLoad || isDead ? -76 : -53}
                  text={pickText(node.badge.text, lang)}
                  bg={
                    node.badge.tone === 'bad'
                      ? pal.tones.rose.top0
                      : node.badge.tone === 'ok'
                        ? pal.tones.green.top0
                        : node.badge.tone === 'warn'
                          ? pal.tones.yellow.top0
                          : pal.pillBg
                  }
                  fg={pal.pillInk}
                  stroke={node.badge.tone === 'bad' ? pal.dangerLink : pal.ink}
                  shadow={pal.pillShadow}
                  isSelected={isSelected}
                />
              )}
            </g>
          </g>
        )}

        {/* B. CYLINDER DATABASE */}
        {kind === 'db' && (
          <g transform="translate(0, -10)">
            {isOverloaded && (
              <ellipse
                cx={0}
                cy={22}
                rx={46}
                ry={26}
                fill="#e5534b"
                opacity={isDark ? 0.25 : 0.17}
                filter={`url(#blur-lg-${uid})`}
              />
            )}
            <ellipse
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeShadowRefs.current.set(node.id, el);
                      else nodeShadowRefs.current.delete(node.id);
                    }
                  : undefined
              }
              cx={0}
              cy={39}
              rx={35}
              ry={16.5}
              fill={pal.shadow}
              opacity={isDark ? 0.42 : 0.22}
              filter={`url(#blur-lg-${uid})`}
            />
            <g
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeLiftRefs.current.set(node.id, el);
                      else nodeLiftRefs.current.delete(node.id);
                    }
                  : undefined
              }
            >
              <path
                d="M -32,-4 V 33 A 32,16 0 0 0 32,33 V -4 Z"
                fill={sideGrad}
              />
              <path
                d="M -32,-4 V 33 A 32,16 0 0 0 32,33 V -4 Z"
                fill={`url(#cyl-sheen-${uid})`}
              />
              <ellipse cx={0} cy={-4} rx={32} ry={16} fill={topGrad} />
              <path
                d="M -29,-1.5 A 29,14 0 0 0 29,-1.5"
                fill="none"
                stroke="#ffffff"
                strokeOpacity={isDark ? 0.25 : 0.72}
                strokeWidth={1.4}
              />
              <path
                d="M -32,-4 V 33 A 32,16 0 0 0 32,33 V -4"
                fill="none"
                stroke={pal.ink}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <ellipse
                cx={0}
                cy={-4}
                rx={32}
                ry={16}
                fill="none"
                stroke={pal.ink}
                strokeWidth={strokeW}
              />
              {isDead ? (
                <g
                  transform="translate(0, -4)"
                  stroke={pal.dangerLink}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                >
                  <path d="M-7,-6 L7,6 M7,-6 L-7,6" />
                </g>
              ) : (
                <MinimalIcon kind={node.icon ?? 'db'} stroke={pal.ink} x={0} y={17} scale={0.86} />
              )}
              <TactilePill
                x={0}
                y={53}
                text={rawLabel}
                bg={pal.pillBg}
                fg={pal.pillInk}
                stroke={pal.ink}
                shadow={pal.pillShadow}
                isSelected={isSelected}
              />
              {hasStaticLoad && renderLoadBarPill(node.loadPct!, -34)}
              {!frameSource && node.badge && (
                <TactilePill
                  x={0}
                  y={hasStaticLoad || isDead ? -57 : -34}
                  text={pickText(node.badge.text, lang)}
                  bg={
                    node.badge.tone === 'bad'
                      ? pal.tones.rose.top0
                      : node.badge.tone === 'ok'
                        ? pal.tones.green.top0
                        : node.badge.tone === 'warn'
                          ? pal.tones.yellow.top0
                          : pal.pillBg
                  }
                  fg={pal.pillInk}
                  stroke={node.badge.tone === 'bad' ? pal.dangerLink : pal.ink}
                  shadow={pal.pillShadow}
                  isSelected={isSelected}
                />
              )}
            </g>
          </g>
        )}

        {/* C. LAPTOP CLIENT */}
        {kind === 'device' && (
          <g transform="translate(0, 8)">
            <path
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeShadowRefs.current.set(node.id, el);
                      else nodeShadowRefs.current.delete(node.id);
                    }
                  : undefined
              }
              d={SLAB_OUTER}
              transform="translate(0, 7)"
              fill={pal.shadow}
              opacity={isDark ? 0.42 : 0.22}
              filter={`url(#blur-lg-${uid})`}
            />
            <g
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeLiftRefs.current.set(node.id, el);
                      else nodeLiftRefs.current.delete(node.id);
                    }
                  : undefined
              }
            >
              <path d={SLAB_OUTER} fill={`url(#slab-side-${uid})`} />
              <path d={SLAB_TOP} fill={`url(#slab-top-${uid})`} />
              <path
                d={SLAB_OUTER}
                fill="none"
                stroke={pal.ink}
                strokeWidth={isHovered || isSelected ? 2.2 : 1.65}
                strokeLinejoin="round"
              />
              <g
                transform="matrix(1 -0.5 1 0.5 -32 -4)"
                fill="#fbf8f4"
                stroke="#b9b1a7"
                strokeWidth={0.6}
              >
                <rect x={0} y={0} width={30} height={20} rx={2} fill="#e8dfd2" stroke={pal.ink} strokeWidth={1.1} />
                <rect x={4} y={3} width={22} height={9} rx={1} />
                <rect x={10} y={14} width={10} height={4} rx={1} />
              </g>
              <g transform="matrix(1 -0.5 0 1 -33 -42)">
                <rect
                  x={0}
                  y={0}
                  width={42}
                  height={31}
                  rx={2.5}
                  fill="#fbf8f4"
                  stroke={pal.ink}
                  strokeWidth={1.6}
                />
                <rect x={1.5} y={1.5} width={39} height={5.5} rx={1.2} fill="#e4d9cb" />
                <circle cx={4.8} cy={4.2} r={1} fill="#e5534b" />
                <circle cx={8} cy={4.2} r={1} fill="#efb041" />
                <circle cx={11.2} cy={4.2} r={1} fill="#7fc278" />
                <rect x={5} y={10.5} width={32} height={9.5} rx={1.5} fill="#d8c7ee" />
                <rect x={5} y={23} width={21} height={2.4} rx={1.2} fill="#d6ccbf" />
              </g>
              <TactilePill
                x={0}
                y={49}
                text={rawLabel}
                bg={pal.pillBg}
                fg={pal.pillInk}
                stroke={pal.ink}
                shadow={pal.pillShadow}
                isSelected={isSelected}
              />
            </g>
          </g>
        )}

        {/* D. CROWD / CONCURRENT TASKS SLAB */}
        {kind === 'crowd' && (
          <g transform="translate(0, 6)">
            <path
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeShadowRefs.current.set(node.id, el);
                      else nodeShadowRefs.current.delete(node.id);
                    }
                  : undefined
              }
              d={SLAB_OUTER}
              transform="translate(0, 7)"
              fill={pal.shadow}
              opacity={isDark ? 0.42 : 0.22}
              filter={`url(#blur-lg-${uid})`}
            />
            <g
              ref={
                !isExiting
                  ? (el) => {
                      if (el) nodeLiftRefs.current.set(node.id, el);
                      else nodeLiftRefs.current.delete(node.id);
                    }
                  : undefined
              }
            >
              <path d={SLAB_OUTER} fill={`url(#slab-side-${uid})`} />
              <path d={SLAB_TOP} fill={`url(#slab-top-${uid})`} />
              <path
                d={SLAB_OUTER}
                fill="none"
                stroke={pal.ink}
                strokeWidth={isHovered || isSelected ? 2.2 : 1.65}
                strokeLinejoin="round"
              />
              {(() => {
                const allAvatars = [
                  { x: 0, y: -16, c: '#a9c5e8' },
                  { x: -16, y: -8, c: '#cbbae6' },
                  { x: 16, y: -8, c: '#b3d79f' },
                  { x: -30, y: 0, c: '#f6cd82' },
                  { x: 0, y: 0, c: '#f3b47f' },
                  { x: 30, y: 0, c: '#a9c5e8' },
                  { x: -16, y: 8, c: '#b3d79f' },
                  { x: 16, y: 8, c: '#f9cbd0' },
                  { x: 0, y: 16, c: '#cbbae6' },
                  { x: -8, y: -12, c: '#f6cd82' },
                  { x: 8, y: -4, c: '#b3d79f' },
                  { x: -8, y: 4, c: '#f3b47f' },
                ];
                const count =
                  frameSource || maxSceneLoad >= 88 || scene.nodes.length >= 6
                    ? 11
                    : maxSceneLoad >= 50
                      ? 8
                      : 5;
                const chosen = allAvatars
                  .slice(0, count)
                  .sort((a, b) => a.y - b.y || a.x - b.x);
                return chosen.map((av, aIdx) => (
                  <g key={aIdx} transform={`translate(${av.x}, ${av.y})`}>
                    <ellipse cx={0} cy={0} rx={5} ry={2.4} fill="#6b5236" opacity={0.18} />
                    <path
                      d="M-4.6,0 V-8 A4.6,4.6 0 0 1 4.6,-8 V0 A4.6,2.1 0 0 1 -4.6,0 Z"
                      fill={av.c}
                      stroke={pal.ink}
                      strokeWidth={1.3}
                    />
                    <circle
                      cx={0}
                      cy={-15}
                      r={3.7}
                      fill="#fdf6ec"
                      stroke={pal.ink}
                      strokeWidth={1.3}
                    />
                  </g>
                ));
              })()}
              <TactilePill
                x={0}
                y={50}
                text={rawLabel}
                bg={pal.pillBg}
                fg={pal.pillInk}
                stroke={pal.ink}
                shadow={pal.pillShadow}
                isSelected={isSelected}
              />
            </g>
          </g>
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden select-none"
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onDragStart={(e) => e.preventDefault()}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as Element;
        if (!target.closest('[data-allow-select="true"]')) {
          e.preventDefault();
        }
      }}
      onClickCapture={(e) => {
        if (performance.now() - lastDragEndRef.current < 200) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const target = e.target as Element;
        if (target.closest('button, [data-no-pan="true"]')) return;

        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPerPx = Math.max(
          baseBounds.w / Math.max(1, rect.width),
          baseBounds.h / Math.max(1, rect.height)
        );

        if (activePointersRef.current.size === 2) {
          const pts = Array.from(activePointersRef.current.values());
          const dist = Math.max(12, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          panDragRef.current = null;
          pinchRef.current = {
            startDist: dist,
            startZoom: camRef.current.zoom,
            startPanX: camRef.current.panX,
            startPanY: camRef.current.panY,
            startMidX: midX,
            startMidY: midY,
            svgPerPx,
          };
          setHoveredKey(null);
          setHoverPreview(null);
          setIsPanning(true);
          return;
        }

        if (activePointersRef.current.size === 1) {
          panDragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origPanX: camRef.current.panX,
            origPanY: camRef.current.panY,
            svgPerPx,
            moved: false,
            captured: false,
          };
        }
      }}
      onPointerMove={(e) => {
        if (activePointersRef.current.has(e.pointerId)) {
          activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        const pinch = pinchRef.current;
        if (pinch && activePointersRef.current.size >= 2) {
          e.preventDefault();
          const pts = Array.from(activePointersRef.current.values());
          const curDist = Math.max(12, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
          const curMidX = (pts[0].x + pts[1].x) / 2;
          const curMidY = (pts[0].y + pts[1].y) / 2;

          const nextZoom =
            Math.round(
              Math.max(0.55, Math.min(2.5, pinch.startZoom * (curDist / pinch.startDist))) * 100
            ) / 100;
          const ratio = nextZoom / pinch.startZoom;

          const rect = e.currentTarget.getBoundingClientRect();
          const anchorSvgX = (pinch.startMidX - (rect.left + rect.width / 2)) * pinch.svgPerPx;
          const anchorSvgY = (pinch.startMidY - (rect.top + rect.height / 2)) * pinch.svgPerPx;

          const rawPanX =
            anchorSvgX -
            (anchorSvgX - pinch.startPanX) * ratio +
            (curMidX - pinch.startMidX) * pinch.svgPerPx;
          const rawPanY =
            anchorSvgY -
            (anchorSvgY - pinch.startPanY) * ratio +
            (curMidY - pinch.startMidY) * pinch.svgPerPx;

          const maxX = baseBounds.w * (0.12 + 0.32 * nextZoom);
          const maxY = baseBounds.h * (0.12 + 0.32 * nextZoom);
          const nextX = Math.max(-maxX, Math.min(maxX, rawPanX));
          const nextY = Math.max(-maxY, Math.min(maxY, rawPanY));

          camRef.current = { zoom: nextZoom, panX: nextX, panY: nextY };
          syncDomCamera(nextZoom, nextX, nextY);
          return;
        }

        const st = panDragRef.current;
        if (!st || e.pointerId !== st.pointerId) return;
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        if (!st.moved && Math.hypot(dx, dy) > 3) {
          st.moved = true;
          try {
            e.currentTarget.setPointerCapture(st.pointerId);
            st.captured = true;
          } catch {
            // ignore
          }
          setHoveredKey(null);
          setHoverPreview(null);
          setIsPanning(true);
        }
        if (st.moved) {
          e.preventDefault();
          const z = camRef.current.zoom;
          const maxX = baseBounds.w * (0.12 + 0.32 * z);
          const maxY = baseBounds.h * (0.12 + 0.32 * z);
          const nextX = Math.max(-maxX, Math.min(maxX, st.origPanX + dx * st.svgPerPx));
          const nextY = Math.max(-maxY, Math.min(maxY, st.origPanY + dy * st.svgPerPx));
          camRef.current.panX = nextX;
          camRef.current.panY = nextY;
          syncDomCamera(z, nextX, nextY);
        }
      }}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
    >
      {/* Persistent SVG Stage — NEVER unmounts across steps so nodes morph & glide smoothly! */}
      <svg
        ref={svgRef}
        viewBox={stageViewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{
          pointerEvents: isPanning ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        className={className ?? 'h-full w-full select-none'}
        role="img"
        aria-label="Interactive Isometric System Diagram"
      >
        <defs>
          <pattern
            id={`iso-${uid}`}
            patternUnits="userSpaceOnUse"
            x={0}
            y={-7}
            width={28}
            height={14}
          >
            <path
              d="M0 7 L14 0 L28 7 L14 14 Z"
              fill="none"
              stroke={pal.grid}
              strokeOpacity={isDark ? 0.22 : 0.28}
              strokeWidth={0.8}
            />
          </pattern>

          <radialGradient
            id={`vignette-${uid}`}
            gradientUnits="userSpaceOnUse"
            cx={baseBounds.cx}
            cy={baseBounds.cy}
            r={Math.max(baseBounds.w, baseBounds.h) * 0.78}
            gradientTransform={`translate(${baseBounds.cx} ${baseBounds.cy}) scale(1 0.64) translate(${-baseBounds.cx} ${-baseBounds.cy})`}
          >
            <stop offset="0%" stopColor={stageBgColor} stopOpacity={0} />
            <stop offset="60%" stopColor={stageBgColor} stopOpacity={0.08} />
            <stop offset="88%" stopColor={stageBgColor} stopOpacity={0.68} />
            <stop offset="100%" stopColor={stageBgColor} stopOpacity={1} />
          </radialGradient>

          <filter id={`blur-sm-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation={2.2} />
          </filter>
          <filter id={`blur-lg-${uid}`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation={6} />
          </filter>

          <linearGradient id={`slab-top-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={pal.slab.top0} />
            <stop offset="100%" stopColor={pal.slab.top1} />
          </linearGradient>
          <linearGradient id={`slab-side-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.slab.side0} />
            <stop offset="100%" stopColor={pal.slab.side1} />
          </linearGradient>

          <linearGradient id={`g-dead-top-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={pal.dead.top0} />
            <stop offset="100%" stopColor={pal.dead.top1} />
          </linearGradient>
          <linearGradient id={`g-dead-side-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.dead.side0} />
            <stop offset="100%" stopColor={pal.dead.side1} />
          </linearGradient>

          <linearGradient id={`g-overload-top-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={pal.overload.top0} />
            <stop offset="100%" stopColor={pal.overload.top1} />
          </linearGradient>
          <linearGradient id={`g-overload-side-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pal.overload.side0} />
            <stop offset="100%" stopColor={pal.overload.side1} />
          </linearGradient>

          <linearGradient id={`cyl-sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="30%" stopColor="#ffffff" stopOpacity={isDark ? 0.14 : 0.36} />
            <stop offset="58%" stopColor="#ffffff" stopOpacity={0.04} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.08} />
          </linearGradient>

          {(Object.keys(pal.tones) as IsoTone[]).map((tone) => (
            <React.Fragment key={tone}>
              <linearGradient id={`g-${tone}-top-${uid}`} x1="0" y1="0" x2="0.35" y2="1">
                <stop offset="0%" stopColor={pal.tones[tone].top0} />
                <stop offset="100%" stopColor={pal.tones[tone].top1} />
              </linearGradient>
              <linearGradient id={`g-${tone}-side-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pal.tones[tone].side0} />
                <stop offset="100%" stopColor={pal.tones[tone].side1} />
              </linearGradient>
            </React.Fragment>
          ))}

          <marker
            id={`arr-${uid}`}
            viewBox="0 0 10 10"
            refX={8.4}
            refY={5}
            markerWidth={5.2}
            markerHeight={5.2}
            orient="auto-start-reverse"
          >
            <path
              d="M1,1.3 L8.8,5 L1,8.7 Z"
              fill={pal.ink}
              stroke={pal.ink}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </marker>
          <marker
            id={`arr-danger-${uid}`}
            viewBox="0 0 10 10"
            refX={8.4}
            refY={5}
            markerWidth={5.2}
            markerHeight={5.2}
            orient="auto-start-reverse"
          >
            <path
              d="M1,1.3 L8.8,5 L1,8.7 Z"
              fill={pal.dangerLink}
              stroke={pal.dangerLink}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* 1. Infinite Isometric Grid Background + Static Viewport Vignette */}
        <g ref={gridCamRef} transform={initialCamTf}>
          <rect
            x={-3200}
            y={-2200}
            width={6400}
            height={4400}
            fill={`url(#iso-${uid})`}
          />
        </g>
        <rect
          x={baseBounds.cx - baseBounds.w}
          y={baseBounds.cy - baseBounds.h}
          width={baseBounds.w * 2}
          height={baseBounds.h * 2}
          fill={`url(#vignette-${uid})`}
          pointerEvents="none"
        />

        {/* 2–6. Interactive Scene Camera Group */}
        <g ref={sceneCamRef} transform={initialCamTf} data-iso-interactive="true">
          {/* 2. Floor Layer: Dashed Isometric Group Zones + Ground Footprint Pads (Spots) */}
          <g className="layer-floor" pointerEvents="none">
            {builtZones.map(({ zone, path, labelPt }) => {
              const tone = zone.tone ?? 'neutral';
              const zFill =
                tone === 'rose'
                  ? isDark
                    ? '#472328'
                    : '#fdf0f1'
                  : tone === 'green'
                    ? isDark
                      ? '#283822'
                      : '#f2f9ed'
                    : tone === 'blue'
                      ? isDark
                        ? '#223347'
                        : '#eef5fc'
                      : isDark
                        ? '#2e2923'
                        : '#fffaf2';
              const zStroke =
                tone === 'rose'
                  ? pal.dangerLink
                  : tone === 'green'
                    ? pal.beatLink
                    : pal.ink;

              return (
                <g
                  key={`zone-${zone.id}`}
                  ref={(el) => {
                    if (el) zoneRefs.current.set(zone.id, el);
                    else zoneRefs.current.delete(zone.id);
                  }}
                >
                  <path
                    d={path}
                    fill={zFill}
                    fillOpacity={0.62}
                    stroke={zStroke}
                    strokeOpacity={0.55}
                    strokeWidth={1.5}
                    strokeDasharray="6 5"
                  />
                  <text
                    transform={`translate(${labelPt.x.toFixed(1)}, ${labelPt.y.toFixed(1)}) matrix(0.894, 0.447, -0.894, 0.447, 0, 0)`}
                    fontSize={9.5}
                    fontWeight={800}
                    letterSpacing={1.4}
                    fill={tone === 'rose' ? pal.dangerLink : isDark ? '#b5aa9a' : '#6f6961'}
                    fontFamily="var(--dts-font-mono)"
                  >
                    {pickText(zone.label, lang).toUpperCase()}
                  </text>
                </g>
              );
            })}

            {expandedNodes.map((node) => {
              if (!node.dead) return null;
              const gc = getGroundCenter(node);
              return (
                <path
                  key={`spot-${node.id}`}
                  ref={(el) => {
                    if (el) spotRefs.current.set(node.id, el);
                    else spotRefs.current.delete(node.id);
                  }}
                  d={GROUND_SPOT_PATH}
                  transform={`translate(${gc.x.toFixed(1)}, ${gc.y.toFixed(1)})`}
                  fill={pal.dangerLink}
                  fillOpacity={isDark ? 0.14 : 0.1}
                  stroke={pal.dangerLink}
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
              );
            })}
          </g>

          {/* 3. Connector Links (Pure 2:1 Grid Elbows + Post-Landing Draw Sweep) */}
          <g className="layer-links">
            {builtLinks.map(({ link, d, pts }) => {
              const st = link.style ?? 'solid';
              const linkKey = `link:${link.id}`;
              const isHovered =
                hoveredKey === linkKey ||
                hoveredKey === `node:${link.from}` ||
                hoveredKey === `node:${link.to}`;
              const isSelected = selectedInfo?.key === linkKey;
              const stroke =
                st === 'danger' || st === 'cut'
                  ? pal.dangerLink
                  : st === 'heartbeat'
                    ? pal.beatLink
                    : st === 'off'
                      ? pal.mutedLink
                      : pal.ink;

              const info = getLinkInspector(link);
              const midPt = sampleSegmentPoint(pts, 0.5);

              return (
                <g
                  key={link.id}
                  ref={(el) => {
                    if (el) linkGroupRefs.current.set(link.id, el);
                    else linkGroupRefs.current.delete(link.id);
                  }}
                  onMouseEnter={() => {
                    setHoveredKey(linkKey);
                    setHoverPreview(info);
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setHoverPreview(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pickMode?.accept.includes('link')) {
                      pickMode.onPick({ kind: 'link', id: link.id });
                      return;
                    }
                    setSelectedInfo({
                      key: linkKey,
                      info,
                      preferLeft: midPt.x > baseBounds.cx,
                    });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    ref={(el) => {
                      if (el) linkHitRefs.current.set(link.id, el);
                      else linkHitRefs.current.delete(link.id);
                    }}
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={15}
                  />
                  <path
                    ref={(el) => {
                      if (el) pathRefs.current.set(link.id, el);
                      else pathRefs.current.delete(link.id);
                    }}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isHovered || isSelected ? 2.6 : st === 'off' ? 1.55 : 1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={hoveredKey && !isHovered ? 0.35 : 0}
                  />
                  {st === 'cut' && (
                    <g transform={`translate(${midPt.x.toFixed(1)}, ${midPt.y.toFixed(1)})`}>
                      <circle r={7.5} fill={pal.pillBg} stroke={pal.dangerLink} strokeWidth={1.5} />
                      <path
                        d="M-3.2,-3.2 L3.2,3.2 M3.2,-3.2 L-3.2,3.2"
                        stroke={pal.dangerLink}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 4. Animated Traffic Packets + In-Line Bottleneck Queue Dots & Drop Marker (chuẩn DTS) */}
          {!frameSource && (
          <g className="layer-packets" pointerEvents="none">
            {builtLinks.map(({ link, pts, queueCount, hasDrop }) => {
              if (queueCount <= 0) return null;
              const dropPt = hasDrop ? samplePolylineFromEnd(pts, 9.5) : null;
              return (
                <g
                  key={`sq-${link.id}`}
                  ref={(el) => {
                    if (el) staticQueueRefs.current.set(link.id, el);
                    else staticQueueRefs.current.delete(link.id);
                  }}
                  opacity={0}
                >
                  {Array.from({ length: queueCount }, (_, qi) => {
                    const dist = (hasDrop ? 21 : 11) + qi * 10.5;
                    const qp = samplePolylineFromEnd(pts, dist);
                    return (
                      <circle
                        key={qi}
                        cx={qp.x}
                        cy={qp.y}
                        r={4.2}
                        fill="#efb041"
                        stroke={pal.ink}
                        strokeWidth={1.45}
                      />
                    );
                  })}
                  {dropPt && (
                    <g transform={`translate(${dropPt.x.toFixed(1)}, ${dropPt.y.toFixed(1)})`}>
                      <circle r={5.4} fill="#e05249" stroke={pal.ink} strokeWidth={1.4} />
                      <path
                        d="M-2.2,-2.2 L2.2,2.2 M2.2,-2.2 L-2.2,2.2"
                        stroke="#ffffff"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>
              );
            })}
            {scene.packets.map((pkt) => (
              <g
                key={pkt.id}
                ref={(el) => {
                  if (el) packetRefs.current.set(pkt.id, el);
                  else packetRefs.current.delete(pkt.id);
                }}
                opacity={0}
              >
                {pkt.kind === 'request' && (
                  <circle r={4.4} fill="#f3b47f" stroke={pal.ink} strokeWidth={1.5} />
                )}
                {pkt.kind === 'response' && (
                  <circle r={4.4} fill="#9fd28f" stroke={pal.ink} strokeWidth={1.5} />
                )}
                {pkt.kind === 'pointer' && (
                  <circle r={4.4} fill="#f4fbef" stroke="#2f8a43" strokeWidth={2} />
                )}
                {pkt.kind === 'mutation' && (
                  <rect
                    x={-4.2}
                    y={-4.2}
                    width={8.4}
                    height={8.4}
                    rx={2}
                    fill="#b79ce6"
                    stroke={pal.ink}
                    strokeWidth={1.5}
                  />
                )}
                {pkt.kind === 'cache-hit' && (
                  <circle r={4.5} fill="#efb041" stroke={pal.ink} strokeWidth={1.5} />
                )}
                {pkt.kind === 'error' && (
                  <rect
                    x={-4.8}
                    y={-4.8}
                    width={9.6}
                    height={9.6}
                    rx={2.4}
                    fill="#e5534b"
                    stroke="#5e1b16"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            ))}
          </g>
          )}

          {frameSource && renderLiveLinksAndPackets()}

          {/* 5. Exiting Entities (smooth lift & fade out during step transition) */}
          <g className="layer-exiting" pointerEvents="none">
            {exitingNodes.map((exNode) => (
              <g
                key={`exit-${exNode.id}`}
                ref={(el) => {
                  if (el) exitNodeRefs.current.set(exNode.id, el);
                  else exitNodeRefs.current.delete(exNode.id);
                }}
                transform={`translate(${exNode.x}, ${exNode.y})`}
              >
                {renderNodeBody(exNode, false, false, true)}
              </g>
            ))}
          </g>

          {/* 6. Active & Entering 2.5D Isometric Entities (depth-sorted back-to-front) */}
          <g className="layer-ents">
            {expandedNodes.map((node) => {
              const nodeKey = `node:${node.id}`;
              const isHovered = hoveredKey === nodeKey;
              const isSelected = selectedInfo?.key === nodeKey;
              const info = getNodeInspector(node);

              return (
                <g
                  key={node.id}
                  ref={(el) => {
                    if (el) nodeOuterRefs.current.set(node.id, el);
                    else nodeOuterRefs.current.delete(node.id);
                  }}
                  transform={`translate(${node.x}, ${node.y})`}
                  opacity={0}
                  onMouseEnter={() => {
                    setHoveredKey(nodeKey);
                    setHoverPreview(info);
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setHoverPreview(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pickMode?.accept.includes('node')) {
                      pickMode.onPick({ kind: 'node', id: node.id });
                      return;
                    }
                    setSelectedInfo({
                      key: nodeKey,
                      info,
                      preferLeft: node.x > baseBounds.cx,
                    });
                  }}
                  style={{ cursor: 'pointer' }}
                  {...(frameSource
                    ? {
                        tabIndex: 0,
                        role: 'button',
                        'aria-label': pickText(node.label, lang),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          e.stopPropagation();
                          if (pickMode?.accept.includes('node')) {
                            pickMode.onPick({ kind: 'node', id: node.id });
                            return;
                          }
                          setSelectedInfo({ key: nodeKey, info });
                        },
                      }
                    : {})}
                >
                  {renderNodeBody(node, isHovered, isSelected, false)}
                </g>
              );
            })}
          </g>

          {frameSource && renderLiveEnts()}

          {/* 7. Interactive Floating Link Label Pills */}
          <g className="layer-link-labels">
            {builtLinks.map(({ link, labelPos }) => {
              if (!link.label) return null;
              const text = pickText(link.label, lang);
              if (!text) return null;
              const linkKey = `link:${link.id}`;
              const info = getLinkInspector(link);

              return (
                <TactilePill
                  key={`lbl-${link.id}`}
                  pillRef={(el) => {
                    if (el) linkPillRefs.current.set(link.id, el);
                    else linkPillRefs.current.delete(link.id);
                  }}
                  initialOpacity={0}
                  x={labelPos.x}
                  y={labelPos.y}
                  text={text}
                  bg={
                    link.style === 'danger' || link.style === 'cut'
                      ? pal.tones.rose.top0
                      : link.style === 'heartbeat'
                        ? pal.tones.green.top0
                        : pal.pillBg
                  }
                  fg={pal.pillInk}
                  stroke={
                    link.style === 'danger' || link.style === 'cut'
                      ? pal.dangerLink
                      : pal.ink
                  }
                  shadow={pal.pillShadow}
                  isSelected={selectedInfo?.key === linkKey}
                  onHover={() => {
                    setHoveredKey(linkKey);
                    setHoverPreview(info);
                  }}
                  onLeave={() => {
                    setHoveredKey(null);
                    setHoverPreview(null);
                  }}
                  onClick={() => {
                    if (pickMode?.accept.includes('link')) {
                      pickMode.onPick({ kind: 'link', id: link.id });
                      return;
                    }
                    setSelectedInfo({
                      key: linkKey,
                      info,
                      preferLeft: labelPos.x > baseBounds.cx,
                    });
                  }}
                />
              );
            })}
          </g>

          {/* 8. Non-Colliding Tactile SVG Stage Note Card ("bảng ghi chú nhỏ" like Designed-to-Scale) */}
          {noteCardLayout && (
            <g
              className="layer-note-card"
              ref={noteCardRef}
              transform={`translate(${noteCardLayout.x}, ${noteCardLayout.y})`}
              opacity={0}
              pointerEvents="none"
            >
              <rect
                x={0}
                y={2.4}
                width={noteCardLayout.w}
                height={noteCardLayout.h}
                rx={10}
                fill={pal.pillShadow}
              />
              <rect
                x={0}
                y={0}
                width={noteCardLayout.w}
                height={noteCardLayout.h}
                rx={10}
                fill={pal.pillBg}
                stroke={pal.ink}
                strokeWidth={1.4}
              />
              <line
                x1={11}
                y1={25.5}
                x2={noteCardLayout.w - 11}
                y2={25.5}
                stroke={isDark ? '#423b33' : '#e6ddd0'}
                strokeWidth={1}
              />
              <MinimalIcon
                kind="sparkles"
                stroke={isDark ? '#efb041' : '#b7791f'}
                x={17}
                y={13.2}
                scale={0.62}
              />
              <text
                x={27}
                y={16.5}
                fontSize={9}
                fontWeight={800}
                letterSpacing={0.9}
                fill={isDark ? '#b5aa9a' : '#6f6961'}
                fontFamily="var(--dts-font-mono)"
              >
                {noteCardLayout.title.toUpperCase()}
              </text>

              {noteCardLayout.chart && (() => {
                const ch = noteCardLayout.chart;
                const plotX0 = 15;
                const plotX1 = noteCardLayout.w - 13;
                const plotW = Math.max(80, plotX1 - plotX0);
                const plotY0 = 32;
                const plotY1 = 83;
                const plotH = plotY1 - plotY0;
                const curveYAt = (u: number) => {
                  const raw = 1 / (1 - 0.915 * Math.min(0.975, Math.max(0, u))) - 1;
                  return plotY1 - 2 - Math.min(1, raw / 7.9) * (plotH - 6);
                };
                const curvePts: string[] = [];
                for (let s = 0; s <= 22; s++) {
                  const u = (s / 22) * 0.97;
                  const cx = plotX0 + u * plotW;
                  const cy = curveYAt(u);
                  curvePts.push(`${s === 0 ? 'M' : 'L'} ${cx.toFixed(1)},${cy.toFixed(1)}`);
                }
                const uDot = Math.max(0.05, Math.min(0.97, ch.utilPct / 100));
                const dotX = plotX0 + uDot * plotW;
                const dotY = curveYAt(uDot);
                const dotCol =
                  ch.utilPct >= 90 ? '#e5534b' : ch.utilPct >= 65 ? '#efb041' : '#7fc278';
                return (
                  <g>
                    <rect
                      x={plotX0 + plotW * 0.78}
                      y={plotY0}
                      width={plotW * 0.22}
                      height={plotH}
                      rx={3}
                      fill={isDark ? '#4d2328' : '#f9dfe0'}
                      opacity={0.85}
                    />
                    <line
                      x1={plotX0}
                      y1={plotY0}
                      x2={plotX0}
                      y2={plotY1}
                      stroke={isDark ? '#706558' : '#b8ad9e'}
                      strokeWidth={1}
                    />
                    <line
                      x1={plotX0}
                      y1={plotY1}
                      x2={plotX1}
                      y2={plotY1}
                      stroke={isDark ? '#706558' : '#b8ad9e'}
                      strokeWidth={1}
                    />
                    <text
                      x={plotX0 + 4}
                      y={plotY0 + 8}
                      fontSize={8}
                      fontWeight={650}
                      fill={isDark ? '#a89d8e' : '#7d756b'}
                      fontFamily="var(--dts-font-mono)"
                    >
                      {ch.yLabel}
                    </text>
                    <text
                      x={plotX1}
                      y={plotY1 + 10}
                      textAnchor="end"
                      fontSize={8}
                      fontWeight={650}
                      fill={isDark ? '#a89d8e' : '#7d756b'}
                      fontFamily="var(--dts-font-mono)"
                    >
                      {ch.xLabel}
                    </text>
                    <path
                      d={curvePts.join(' ')}
                      fill="none"
                      stroke={pal.ink}
                      strokeWidth={1.65}
                      strokeLinecap="round"
                    />
                    <line
                      x1={dotX}
                      y1={dotY}
                      x2={dotX}
                      y2={plotY1}
                      stroke={dotCol}
                      strokeWidth={1.1}
                      strokeDasharray="2.5 2.5"
                    />
                    <circle
                      cx={dotX}
                      cy={dotY}
                      r={4}
                      fill={dotCol}
                      stroke={pal.ink}
                      strokeWidth={1.4}
                    />
                    <text
                      x={uDot > 0.8 ? dotX - 6 : dotX}
                      y={uDot > 0.8 ? dotY + 3 : dotY - 6}
                      textAnchor={uDot > 0.8 ? 'end' : 'middle'}
                      fontSize={8.8}
                      fontWeight={800}
                      fill={pal.pillInk}
                      fontFamily="var(--dts-font-mono)"
                    >
                      {Math.round(ch.utilPct)}%
                    </text>
                  </g>
                );
              })()}

              {noteCardLayout.lines.map((ln, idx) => {
                const rowY = (noteCardLayout.chart ? 100 : 30) + idx * 18.5;
                if (ln.tone === 'good' || ln.tone === 'bad' || ln.tone === 'amber') {
                  const pBg =
                    ln.tone === 'good'
                      ? isDark
                        ? '#2b3e24'
                        : '#dcefd2'
                      : ln.tone === 'bad'
                        ? isDark
                          ? '#4d2328'
                          : '#f8d5cf'
                        : isDark
                          ? '#4a3a1b'
                          : '#fbe5bd';
                  const pFg =
                    ln.tone === 'good'
                      ? isDark
                        ? '#b8e8a3'
                        : '#24521c'
                      : ln.tone === 'bad'
                        ? isDark
                          ? '#fca5a5'
                          : '#8f2a22'
                        : isDark
                          ? '#fde68a'
                          : '#6d4a0c';
                  return (
                    <g key={idx}>
                      <rect
                        x={9}
                        y={rowY}
                        width={noteCardLayout.w - 18}
                        height={16}
                        rx={5}
                        fill={pBg}
                      />
                      <text
                        x={15}
                        y={rowY + 11.2}
                        fontSize={9.4}
                        fontWeight={800}
                        fill={pFg}
                        fontFamily="var(--dts-font-mono)"
                      >
                        {ln.text}
                      </text>
                    </g>
                  );
                }
                return (
                  <text
                    key={idx}
                    x={11}
                    y={rowY + 11.2}
                    fontSize={ln.tone === 'muted' ? 9.2 : 9.6}
                    fontWeight={ln.tone === 'muted' ? 600 : 700}
                    fill={
                      ln.tone === 'muted'
                        ? isDark
                          ? '#a89d8e'
                          : '#7d756b'
                        : pal.pillInk
                    }
                    fontFamily="var(--dts-font-mono)"
                  >
                    {ln.text}
                  </text>
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {frameSource && (
        <div
          ref={livePillRef}
          data-no-pan="true"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-2.5 z-20 rounded-full border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]/95 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-ink-muted)] empty:hidden"
        />
      )}

      {/* Top-Right Interactive Zoom Toolbar (desktop with spacious stage only; Replay resets zoom & pan when narrow/mobile) */}
      {stageWidth >= 420 && (
        <div
          data-no-pan="true"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2.5 top-2 z-30 hidden lg:inline-flex items-center gap-0.5 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]/95 p-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-ink)] shadow-[1.5px_1.5px_0_var(--dts-shadow-color)] backdrop-blur-[2px]"
        >
          <button
            type="button"
            onClick={() => handleZoomBy(-0.15)}
            title={lang === 'en' ? 'Zoom out' : 'Thu nhỏ'}
            aria-label={lang === 'en' ? 'Zoom out' : 'Thu nhỏ'}
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[var(--dts-panel-muted)] cursor-pointer"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title={
              lang === 'en'
                ? 'Click to reset zoom & position (100%)'
                : 'Nhấn để đặt lại thu phóng & vị trí (100%)'
            }
            className={`inline-flex h-6 min-w-[44px] items-center justify-center rounded-lg px-1.5 tabular-nums transition-colors cursor-pointer ${
              isViewModified
                ? 'bg-[var(--dts-amber-bg)] font-extrabold text-[var(--dts-amber-ink)] hover:opacity-90'
                : 'hover:bg-[var(--dts-panel-muted)]'
            }`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => handleZoomBy(0.15)}
            title={lang === 'en' ? 'Zoom in' : 'Phóng to'}
            aria-label={lang === 'en' ? 'Zoom in' : 'Phóng to'}
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-[var(--dts-panel-muted)] cursor-pointer"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Subtle Auto-Collapsing Interactive Hint Chip (expands on hover) */}
      {!selectedInfo && !hoverPreview && (() => {
        const showHintText = hintAutoOpen || hintHovered;
        const hintLabel =
          lang === 'en'
            ? 'Click any block, line, or tag to inspect'
            : 'Nhấn vào khối, đường nối hoặc nhãn để xem giải thích sâu';
        return (
          <div
            data-no-pan="true"
            onMouseEnter={() => setHintHovered(true)}
            onMouseLeave={() => setHintHovered(false)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setHintHovered((v) => !v);
            }}
            aria-label={hintLabel}
            className={`pointer-events-auto absolute left-2.5 top-2 z-20 inline-flex h-[26px] max-w-[calc(100%-140px)] items-center overflow-hidden rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]/92 font-mono text-[10px] font-semibold text-[var(--dts-ink-muted)] shadow-[1px_1.5px_0_var(--dts-shadow-color)] backdrop-blur-[2px] transition-all duration-300 ease-out cursor-help ${
              showHintText ? 'px-2.5' : 'px-[6px]'
            }`}
          >
            <MousePointerClick className="h-3 w-3 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                showHintText ? 'ml-1.5 max-w-[430px] opacity-100' : 'ml-0 max-w-0 opacity-0'
              }`}
            >
              {hintLabel}
            </span>
          </div>
        );
      })()}

      {/* Quick Hover Preview Tooltip */}
      {!selectedInfo && hoverPreview && (
        <div className="pointer-events-none absolute left-2.5 top-2 z-20 max-w-[360px] rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3 py-2 shadow-[1.5px_2px_0_var(--dts-shadow-color)]">
          <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
            <span>{pickText(hoverPreview.kindLabel, lang)}</span>
            <span className="text-[var(--dts-green-ink)]">
              {lang === 'en' ? 'Click for details' : 'Nhấn để mở chi tiết'}
            </span>
          </div>
          <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            {pickText(hoverPreview.title, lang)}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--dts-ink-soft)]">
            {pickText(hoverPreview.what, lang)}
          </p>
        </div>
      )}

      {/* Compact Corner Inspector Popover (anchored away from clicked node so diagram stays unobstructed!) */}
      {selectedInfo && (
        <StageInspectorPortal
          info={selectedInfo.info}
          lang={lang}
          theme={theme}
          anchorRef={containerRef}
          preferLeft={selectedInfo.preferLeft}
          onClose={() => setSelectedInfo(null)}
          liveSlot={liveSlotNode}
        />
      )}
    </div>
  );
};
