import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Minus, MousePointerClick, Plus } from 'lucide-react';
import type { WorkbenchLang, WorkbenchTheme } from '@/stores/useWorkbenchStore';
import {
  pickText,
  type IsoNodeShape,
  type IsoTone,
  type LegacyNodeShape,
  type PacketKind,
  type StageIconKind,
  type StageInspectorInfo,
  type StageLink,
  type StageNode,
  type StageScene,
} from './types';
import {
  StageEntityInspectorCard,
  resolveFallbackInspector,
} from './StageEntityInspector';

interface Pt {
  x: number;
  y: number;
}

/** Rounds every corner of a closed polygon using smooth quadratic Bezier Q curves */
function roundedPolygonPath(pts: Pt[], radius = 9.5): string {
  const n = pts.length;
  if (n < 3) return '';
  const cmds: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const dx1 = prev.x - curr.x;
    const dy1 = prev.y - curr.y;
    const len1 = Math.hypot(dx1, dy1) || 1;
    const r1 = Math.min(radius, len1 * 0.44);

    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.hypot(dx2, dy2) || 1;
    const r2 = Math.min(radius, len2 * 0.44);

    const sx = curr.x + (dx1 / len1) * r1;
    const sy = curr.y + (dy1 / len1) * r1;
    const ex = curr.x + (dx2 / len2) * r2;
    const ey = curr.y + (dy2 / len2) * r2;

    if (i === 0) {
      cmds.push(`M ${sx.toFixed(2)},${sy.toFixed(2)}`);
    } else {
      cmds.push(`L ${sx.toFixed(2)},${sy.toFixed(2)}`);
    }
    cmds.push(`Q ${curr.x.toFixed(2)},${curr.y.toFixed(2)} ${ex.toFixed(2)},${ey.toFixed(2)}`);
  }

  cmds.push('Z');
  return cmds.join(' ');
}

/** Rounds interior corners of an open polyline using smooth quadratic Bezier Q bends */
function roundedPolylinePath(pts: Pt[], radius = 14): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
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
  if (clean.length <= 14) return [clean];
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

/**
 * Ground-floor plane anchor & exact outer silhouette polygon ray intersection:
 * All isometric entities and connectors share the ground-floor 2:1 plane (just like designed-to-scale),
 * so SW/SE links hit the exact 50% wall midpoint (±28px) and NE/NW links emerge cleanly from the side wall
 * with zero corner drift and zero "M" roof humps!
 */
function getGroundOffset(shape: LegacyNodeShape): number {
  const kind = normalizeShape(shape);
  if (kind === 'block') return 22;
  if (kind === 'db') return 21;
  if (kind === 'device') return 16;
  return 14; // crowd
}

function getGroundCenter(node: StageNode): Pt {
  return { x: node.x, y: node.y + getGroundOffset(node.shape) };
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
  node: StageNode,
  ux: number,
  uy: number,
  extraGap = 2
): number {
  const gOff = getGroundOffset(node.shape);
  const poly = getSilhouettePolygon(node.shape);
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
 * Transforms flat horizontal node rows into authentic 2D isometric grid compositions
 * (NE->SE Corner, SE->NE Valley, Stepped Terrace, Echelon Fan-Out, Fan-In, 4-Node 2:1 Diamond)
 * so blocks stay large and crisp while direct links align cleanly along pure 2:1 axes!
 */
function composeIsometricLayout(nodes: StageNode[], links: StageLink[]): StageNode[] {
  const n = nodes.length;
  if (n <= 1) return nodes;

  const xs = nodes.map((nd) => nd.x);
  const ys = nodes.map((nd) => nd.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);

  if (n >= 5 || (spanY >= 125 && spanX <= 440)) {
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const spread = 1.26;
    return nodes.map((nd) => ({
      ...nd,
      x: Math.round(cx + (nd.x - cx) * spread),
      y: Math.round(cy + (nd.y - cy) * spread),
    }));
  }

  const placeAtGround = (nd: StageNode, gx: number, gy: number): StageNode => ({
    ...nd,
    x: Math.round(gx),
    y: Math.round(gy - getGroundOffset(nd.shape)),
  });

  if (n === 2) {
    const ordered = [...nodes].sort((a, b) => a.x - b.x);
    const map = new Map<string, StageNode>();
    map.set(ordered[0].id, placeAtGround(ordered[0], -128, 64));
    map.set(ordered[1].id, placeAtGround(ordered[1], 128, -64));
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

    // Fan-Out from left hub (e.g. Load Balancer / Traffic Split)
    if ((outDeg.get(n0.id) ?? 0) >= 2 && !links.some((l) => l.from === n1.id && l.to === n2.id)) {
      map.set(n0.id, placeAtGround(n0, -172, 56));
      map.set(n1.id, placeAtGround(n1, 56, -58));   // +228, -114 (exact 2:1 NE)
      map.set(n2.id, placeAtGround(n2, 176, 52));   // spacious SE echelon below n1
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // Fan-In into right target (e.g. parallel DAG lint + test -> build)
    if ((inDeg.get(n2.id) ?? 0) >= 2 && !links.some((l) => l.from === n0.id && l.to === n1.id)) {
      map.set(n0.id, placeAtGround(n0, -96, -80));  // +240, +120 into n2 (exact 2:1 SE)
      map.set(n1.id, placeAtGround(n1, -186, 80));  // 160px vertical ground gap below n0!
      map.set(n2.id, placeAtGround(n2, 144, 40));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // 3-Node Sequential Pipeline — vary across 3 spacious pure 2:1 straight-line isometric compositions!
    const variant = hashIds(sorted) % 3;
    if (variant === 0) {
      // Back-Apex Isometric Corner (Front-Left -> Back-Center -> Front-Right: 2 pure 2:1 straight lines!)
      map.set(n0.id, placeAtGround(n0, -226, 62));
      map.set(n1.id, placeAtGround(n1, 0, -51));    // +226, -113 (exact 2:1 NE)
      map.set(n2.id, placeAtGround(n2, 226, 62));   // +226, +113 (exact 2:1 SE)
    } else if (variant === 1) {
      // Front-Apex Isometric Valley (Back-Left -> Front-Center -> Back-Right: 2 pure 2:1 straight lines!)
      map.set(n0.id, placeAtGround(n0, -224, -46));
      map.set(n1.id, placeAtGround(n1, 0, 66));     // +224, +112 (exact 2:1 SE)
      map.set(n2.id, placeAtGround(n2, 224, -46));  // +224, -112 (exact 2:1 NE)
    } else {
      // Ascending 2:1 Isometric Diagonal (Front-Left -> Center -> Back-Right: 2 pure 2:1 straight lines!)
      map.set(n0.id, placeAtGround(n0, -216, 88));
      map.set(n1.id, placeAtGround(n1, 0, -20));    // +216, -108 (exact 2:1 NE)
      map.set(n2.id, placeAtGround(n2, 216, -128)); // +216, -108 (exact 2:1 NE)
    }
    return nodes.map((nd) => map.get(nd.id) ?? nd);
  }

  if (n === 4) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const [n0, n1, n2, n3] = sorted;
    const map = new Map<string, StageNode>();

    // 4a: 1 Hub fanning out to 3 Shards/Servers (e.g. Redis Cluster)
    if ((outDeg.get(n0.id) ?? 0) >= 2 && (outDeg.get(n1.id) ?? 0) === 0 && (outDeg.get(n2.id) ?? 0) === 0) {
      map.set(n0.id, placeAtGround(n0, -192, 54));
      map.set(n1.id, placeAtGround(n1, 32, -96));
      map.set(n2.id, placeAtGround(n2, 138, -18));
      map.set(n3.id, placeAtGround(n3, 244, 60));
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // 4b: Producer -> Broker -> 2 Consumers
    if ((outDeg.get(n1.id) ?? 0) >= 2) {
      map.set(n0.id, placeAtGround(n0, -228, 62));
      map.set(n1.id, placeAtGround(n1, -16, -44));  // +212, -106 (exact 2:1 NE)
      map.set(n2.id, placeAtGround(n2, 196, -90));
      map.set(n3.id, placeAtGround(n3, 196, 62));   // +212, +106 (exact 2:1 SE), 152px vertical gap!
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // 4c: 2 Sources -> Gate -> Target (e.g. K17 NetworkPolicy)
    if ((inDeg.get(n2.id) ?? 0) >= 2) {
      map.set(n0.id, placeAtGround(n0, -172, -84));
      map.set(n1.id, placeAtGround(n1, -214, 84));  // 168px vertical separation so n1 roof never touches n0 pill!
      map.set(n2.id, placeAtGround(n2, 36, 20));    // +208, +104 from n0 (exact 2:1 SE)
      map.set(n3.id, placeAtGround(n3, 248, -86));  // +212, -106 from n2 (exact 2:1 NE)
      return nodes.map((nd) => map.get(nd.id) ?? nd);
    }

    // 4d: 4-Node Sequential Chain — spacious pure 2:1 zigzag diamond (all 3 arrows straight!)
    const flip = hashIds(sorted) % 2 === 1;
    if (!flip) {
      map.set(n0.id, placeAtGround(n0, -294, 58));
      map.set(n1.id, placeAtGround(n1, -98, -40));  // +196, -98 (exact 2:1 NE)
      map.set(n2.id, placeAtGround(n2, 98, 58));    // +196, +98 (exact 2:1 SE)
      map.set(n3.id, placeAtGround(n3, 294, -40));  // +196, -98 (exact 2:1 NE)
    } else {
      map.set(n0.id, placeAtGround(n0, -294, -32));
      map.set(n1.id, placeAtGround(n1, -98, 66));   // +196, +98 (exact 2:1 SE)
      map.set(n2.id, placeAtGround(n2, 98, -32));   // +196, -98 (exact 2:1 NE)
      map.set(n3.id, placeAtGround(n3, 294, 66));   // +196, +98 (exact 2:1 SE)
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

function buildIsoLink(
  link: StageLink,
  from: StageNode,
  to: StageNode
): { d: string; pts: Pt[]; labelPos: Pt } {
  const c0 = getGroundCenter(from);
  const c1 = getGroundCenter(to);
  const dx = c1.x - c0.x;
  const dy = c1.y - c0.y;

  const a = (dx / 2 + dy) / 2; // SE (+2, +1) component
  const b = (dx / 2 - dy) / 2; // NE (+2, -1) component

  const lenA = Math.hypot(2 * a, a);
  const lenB = Math.hypot(2 * b, -b);

  let waypoints: Pt[];

  if (lenA < 20 || lenB < 20) {
    waypoints = [c0, c1];
  } else {
    const preferNEFirst =
      link.curve !== undefined ? link.curve < 0 : dy < -28;

    const elbow: Pt = preferNEFirst
      ? { x: c0.x + 2 * b, y: c0.y - b }
      : { x: c0.x + 2 * a, y: c0.y + a };

    waypoints = [c0, elbow, c1];
  }

  const firstNext = waypoints[1];
  const fdx = firstNext.x - c0.x;
  const fdy = firstNext.y - c0.y;
  const fLen = Math.hypot(fdx, fdy) || 1;
  const fux = fdx / fLen;
  const fuy = fdy / fLen;
  const startTrim = Math.min(
    getBoundaryDistAlongDir(from, fux, fuy, 1.5),
    fLen * 0.45
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
    getBoundaryDistAlongDir(to, -lux, -luy, 4),
    lLen * 0.45
  );
  const pEnd: Pt = {
    x: c1.x - lux * endTrim,
    y: c1.y - luy * endTrim,
  };

  const finalPts =
    waypoints.length === 2 ? [pStart, pEnd] : [pStart, waypoints[1], pEnd];

  let labelPos: Pt;
  if (finalPts.length === 2) {
    labelPos = {
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
    labelPos =
      seg1 >= seg2
        ? {
            x: (finalPts[0].x + finalPts[1].x) / 2,
            y: (finalPts[0].y + finalPts[1].y) / 2,
          }
        : {
            x: (finalPts[1].x + finalPts[2].x) / 2,
            y: (finalPts[1].y + finalPts[2].y) / 2,
          };
  }

  return {
    d: roundedPolylinePath(finalPts, 14),
    pts: finalPts,
    labelPos,
  };
}

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
  grid: string;
  shadow: string;
  pillBg: string;
  pillShadow: string;
  pillInk: string;
  slab: FaceGrad;
  tones: Record<IsoTone, FaceGrad>;
} {
  if (isDark) {
    return {
      ink: '#e7ddd0',
      mutedLink: '#6a6054',
      dangerLink: '#f26d65',
      grid: '#8f7d63',
      shadow: '#090806',
      pillBg: '#2e2923',
      pillShadow: '#110f0c',
      pillInk: '#f2e9dc',
      slab: { top0: '#38322b', top1: '#302b25', side0: '#29241f', side1: '#221e1a' },
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
    grid: '#a8916f',
    shadow: '#6b5236',
    pillBg: '#fbf6ef',
    pillShadow: '#1c1a17',
    pillInk: '#211e1b',
    slab: { top0: '#f7f0e7', top1: '#f0e7dc', side0: '#ece2d5', side1: '#e3d7c8' },
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
  scale = 0.92,
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
      {(k === 'sparkles' || k === 'filter' || k === 'clock' || k === 'alert' || k === 'box') && (
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
  delayMs = 240,
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
  delayMs?: number;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}) {
  const w = Math.max(52, text.length * 6.2 + 20);
  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
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
      <g
        className="dts-anim-pill"
        style={{ animationDelay: `${delayMs}ms` }}
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
          y={2.8}
          textAnchor="middle"
          fontSize={9.5}
          fontWeight={700}
          fill={fg}
          fontFamily="var(--dts-font-mono)"
        >
          {text}
        </text>
      </g>
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

export interface ScaleStageSvgProps {
  scene: StageScene;
  lang: WorkbenchLang;
  theme: WorkbenchTheme;
  isPlaying: boolean;
  replayNonce: number;
  className?: string;
}

export const ScaleStageSvg: React.FC<ScaleStageSvgProps> = ({
  scene,
  lang,
  theme,
  isPlaying,
  replayNonce,
  className,
}) => {
  const uid = useId().replace(/:/g, '');
  const isDark = theme === 'dark';
  const pal = useMemo(() => getPalette(isDark), [isDark]);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<StageInspectorInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{
    key: string;
    info: StageInspectorInfo;
  } | null>(null);

  // Clear open inspector when switching steps/scenes
  const sceneSignature = useMemo(
    () =>
      `${replayNonce}:${scene.nodes.map((n) => `${n.id}-${pickText(n.label, 'en')}`).join('|')}`,
    [scene.nodes, replayNonce]
  );

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hintAutoOpen, setHintAutoOpen] = useState(true);
  const [hintHovered, setHintHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridCamRef = useRef<SVGGElement | null>(null);
  const sceneCamRef = useRef<SVGGElement | null>(null);
  const camRef = useRef<{ zoom: number; panX: number; panY: number }>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const lastDragEndRef = useRef(0);
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

  useEffect(() => {
    setSelectedInfo(null);
    setHoverPreview(null);
    camRef.current = { zoom: 1, panX: 0, panY: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [scene]);

  const expandedNodes = useMemo(
    () => composeIsometricLayout(scene.nodes, scene.links),
    [scene.nodes, scene.links]
  );

  const nodeMap = useMemo(() => {
    const m = new Map<string, StageNode>();
    for (const n of expandedNodes) m.set(n.id, n);
    return m;
  }, [expandedNodes]);

  const builtLinks = useMemo(() => {
    // Build obstacle rectangles for every node body, bottom pill, and top load meter
    const obstacles: RectBox[] = [];
    for (const n of expandedNodes) {
      const kind = normalizeShape(n.shape);
      obstacles.push({
        x0: n.x - (kind === 'db' ? 42 : kind === 'block' ? 68 : 62),
        y0: n.y - (kind === 'block' ? 44 : kind === 'db' ? 40 : 32),
        x1: n.x + (kind === 'db' ? 42 : kind === 'block' ? 68 : 62),
        y1: n.y + (kind === 'block' ? 48 : 40),
      });
      if (kind !== 'block') {
        const lbl = pickText(n.label, lang);
        const hw = Math.max(44, (lbl.length * 6.4 + 24) / 2);
        const py = kind === 'db' ? n.y + 50 : n.y + 56;
        obstacles.push({ x0: n.x - hw, y0: py - 13, x1: n.x + hw, y1: py + 13 });
      } else if (n.badge || n.sublabel) {
        const txt = n.badge ? pickText(n.badge.text, lang) : pickText(n.sublabel!, lang);
        const hw = Math.max(44, (txt.length * 6.4 + 26) / 2);
        obstacles.push({ x0: n.x - hw, y0: n.y + 51, x1: n.x + hw, y1: n.y + 77 });
      }
      if (typeof n.loadPct === 'number') {
        obstacles.push({ x0: n.x - 42, y0: n.y - 68, x1: n.x + 42, y1: n.y - 40 });
      }
    }

    const placedPills: RectBox[] = [];
    return scene.links
      .map((l) => {
        const a = nodeMap.get(l.from);
        const b = nodeMap.get(l.to);
        if (!a || !b) return null;
        const raw = buildIsoLink(l, a, b);
        if (!l.label) return { link: l, ...raw };
        const txt = pickText(l.label, lang);
        if (!txt) return { link: l, ...raw };

        const hw = Math.max(34, (txt.length * 6.4 + 22) / 2) + 3;
        const hh = 12.5;

        const candidates: { pt: Pt; distPenalty: number }[] = [
          { pt: raw.labelPos, distPenalty: 0 },
        ];
        const offsets: Array<[number, number]> = [
          [0, 0],
          [0, -18],
          [0, 18],
          [-18, -20],
          [18, -20],
          [-18, 20],
          [18, 20],
          [0, -30],
          [0, 30],
        ];
        for (const t of [0.5, 0.42, 0.58, 0.34, 0.66]) {
          const base = sampleSegmentPoint(raw.pts, t);
          for (const [dxOff, dyOff] of offsets) {
            candidates.push({
              pt: { x: base.x + dxOff, y: base.y + dyOff },
              distPenalty: Math.abs(t - 0.5) * 18 + Math.hypot(dxOff, dyOff) * 0.42,
            });
          }
        }

        let best = raw.labelPos;
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
          for (const prev of placedPills) overlap += rectOverlapArea(box, prev) * 1.5;
          const score = overlap * 100 + cand.distPenalty;
          if (score < bestScore) {
            bestScore = score;
            best = cand.pt;
            if (overlap === 0 && cand.distPenalty === 0) break;
          }
        }

        placedPills.push({
          x0: best.x - hw,
          y0: best.y - hh,
          x1: best.x + hw,
          y1: best.y + hh,
        });

        return { link: l, d: raw.d, pts: raw.pts, labelPos: best };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [scene.links, nodeMap, expandedNodes, lang]);

  const baseBounds = useMemo(() => {
    if (expandedNodes.length === 0) {
      return { cx: 0, cy: 0, w: 640, h: 350 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of expandedNodes) {
      minX = Math.min(minX, n.x - 86);
      maxX = Math.max(maxX, n.x + 86);
      minY = Math.min(minY, n.y - (typeof n.loadPct === 'number' ? 70 : 50));
      maxY = Math.max(maxY, n.y + 78);
    }
    for (const bl of builtLinks) {
      for (const p of bl.pts) {
        minX = Math.min(minX, p.x - 28);
        maxX = Math.max(maxX, p.x + 28);
        minY = Math.min(minY, p.y - 24);
        maxY = Math.max(maxY, p.y + 24);
      }
      minX = Math.min(minX, bl.labelPos.x - 54);
      maxX = Math.max(maxX, bl.labelPos.x + 54);
      minY = Math.min(minY, bl.labelPos.y - 18);
      maxY = Math.max(maxY, bl.labelPos.y + 18);
    }

    const padX = 34;
    const padY = 28;
    const rawW = maxX - minX + padX * 2;
    const rawH = maxY - minY + padY * 2;
    const w = Math.max(620, rawW);
    const h = Math.max(335, rawH);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { cx, cy, w, h };
  }, [expandedNodes, builtLinks]);

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
      const maxX = baseBounds.w * Math.max(0.75, clampedZoom * 0.85);
      const maxY = baseBounds.h * Math.max(0.75, clampedZoom * 0.85);
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
      const nextPanX = mx - (mx - cur.panX) * ratio;
      const nextPanY = my - (my - cur.panY) * ratio;
      applyCamera(nextZoom, nextPanX, nextPanY);
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [baseBounds, applyCamera]);

  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const packetRefs = useRef<Map<string, SVGGElement>>(new Map());
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = 0;
  }, [sceneSignature]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const lengths = new Map<string, number>();
    for (const bl of builtLinks) {
      const pEl = pathRefs.current.get(bl.link.id);
      if (pEl) {
        try {
          lengths.set(bl.link.id, pEl.getTotalLength());
        } catch {
          lengths.set(bl.link.id, 0);
        }
      }
    }

    const syncPackets = (sec: number) => {
      for (const pkt of scene.packets) {
        const gEl = packetRefs.current.get(pkt.id);
        const pEl = pathRefs.current.get(pkt.linkId);
        const totalLen = lengths.get(pkt.linkId) ?? 0;
        if (!gEl || !pEl || totalLen <= 1) continue;

        const speed = pkt.speed ?? 0.4;
        const phase = ((sec * speed + (pkt.offset ?? 0)) % 1 + 1) % 1;
        const t = pkt.reverse ? 1 - phase : phase;
        const pt = pEl.getPointAtLength(t * totalLen);

        const fade =
          phase < 0.08 ? phase / 0.08 : phase > 0.92 ? (1 - phase) / 0.08 : 1;
        gEl.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        gEl.setAttribute('opacity', fade.toFixed(2));
      }
    };

    syncPackets(elapsedRef.current);
    if (!isPlaying || scene.packets.length === 0) return;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsedRef.current += dt;
      syncPackets(elapsedRef.current);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, scene.packets, builtLinks, sceneSignature]);

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
    const st = panDragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    if (st.captured) {
      try {
        e.currentTarget.releasePointerCapture(st.pointerId);
      } catch {
        // ignore if already released
      }
    }
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
        if (e.button !== 0) return;
        const target = e.target as Element;
        if (target.closest('button, [data-no-pan="true"]')) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPerPx = Math.max(
          baseBounds.w / Math.max(1, rect.width),
          baseBounds.h / Math.max(1, rect.height)
        );
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
      }}
      onPointerMove={(e) => {
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
          const maxX = baseBounds.w * Math.max(0.75, z * 0.85);
          const maxY = baseBounds.h * Math.max(0.75, z * 0.85);
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
      <svg
        key={sceneSignature}
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

        {/* 2–5. Interactive Scene Camera Group (60-120fps direct DOM transform) */}
        <g ref={sceneCamRef} transform={initialCamTf} data-iso-interactive="true">
        {/* 2. Connector Links (Exact 2:1 Wall-Port Elbows + Draw-in Animation + Hover/Click Hit Target) */}
        <g className="layer-links">
          {builtLinks.map(({ link, d }, idx) => {
            const st = link.style ?? 'solid';
            const linkKey = `link:${link.id}`;
            const isHovered =
              hoveredKey === linkKey ||
              hoveredKey === `node:${link.from}` ||
              hoveredKey === `node:${link.to}`;
            const isSelected = selectedInfo?.key === linkKey;
            const stroke =
              st === 'danger'
                ? pal.dangerLink
                : st === 'off'
                  ? pal.mutedLink
                  : pal.ink;
            const marker =
              st === 'danger'
                ? `url(#arr-danger-${uid})`
                : st === 'off'
                  ? ''
                  : `url(#arr-${uid})`;

            const isDashed = st === 'dashed' || st === 'off' || st === 'danger';
            const info = getLinkInspector(link);

            return (
              <g
                key={link.id}
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
                  setSelectedInfo({ key: linkKey, info });
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Wide invisible hit target so clicking/hovering thin lines is effortless */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={15} />
                <path
                  ref={(el) => {
                    if (el) pathRefs.current.set(link.id, el);
                    else pathRefs.current.delete(link.id);
                  }}
                  d={d}
                  fill="none"
                  className={isDashed ? undefined : 'dts-anim-line'}
                  style={
                    isDashed
                      ? undefined
                      : ({
                          strokeDasharray: '760 760',
                          '--line-len': '760',
                          animationDelay: `${130 + idx * 60}ms`,
                        } as React.CSSProperties)
                  }
                  stroke={stroke}
                  strokeWidth={isHovered || isSelected ? 2.6 : st === 'off' ? 1.5 : 1.85}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={
                    st === 'dashed'
                      ? '5 4.5'
                      : st === 'off'
                        ? '4 5'
                        : st === 'danger'
                          ? '7 5'
                          : undefined
                  }
                  opacity={hoveredKey && !isHovered ? 0.35 : 1}
                  markerEnd={marker}
                />
              </g>
            );
          })}
        </g>

        {/* 3. Animated Traffic Packets */}
        <g className="layer-packets" pointerEvents="none">
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

        {/* 4. Staggered Drop-in 2.5D Isometric Entities */}
        <g className="layer-ents">
          {expandedNodes.map((node, idx) => {
            const kind = normalizeShape(node.shape);
            const rawLabel = pickText(node.label, lang);
            const subText = node.sublabel ? pickText(node.sublabel, lang) : '';
            const lines = splitShortLines(rawLabel);
            const nodeKey = `node:${node.id}`;
            const isHovered = hoveredKey === nodeKey;
            const isSelected = selectedInfo?.key === nodeKey;
            const info = getNodeInspector(node);
            const strokeW = isHovered || isSelected ? 2.4 : 1.85;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                opacity={node.dimmed ? 0.38 : 1}
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
                  setSelectedInfo({ key: nodeKey, info });
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Animated inner wrapper so SVG position translate(x,y) stays crisp while child drops in! */}
                <g
                  className="dts-anim-drop"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  {/* A. ROUNDED 8-LAYER ISOMETRIC BLOCK */}
                  {kind === 'block' && (
                    <g>
                      <path
                        d={BLOCK_OUTER_PATH}
                        transform="translate(0, 9)"
                        fill={pal.shadow}
                        opacity={isDark ? 0.45 : 0.24}
                        filter={`url(#blur-lg-${uid})`}
                      />
                      <path d={BLOCK_OUTER_PATH} fill={`url(#g-${node.tone}-side-${uid})`} />
                      <path
                        d={`M 0,${TOP_OFFSET_Y + BLOCK_H} L ${BLOCK_W - 2},${TOP_OFFSET_Y + 1} L ${BLOCK_W - 2},${TOP_OFFSET_Y + BLOCK_DROP} L 0,${TOP_OFFSET_Y + BLOCK_DROP + BLOCK_H} Z`}
                        fill="#3a2a14"
                        opacity={isDark ? 0.14 : 0.055}
                      />
                      <path d={BLOCK_TOP_PATH} fill={`url(#g-${node.tone}-top-${uid})`} />
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
                        strokeOpacity={isDark ? 0.28 : 0.76}
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

                      <MinimalIcon kind={node.icon} stroke={pal.ink} x={0} y={-16} />
                      {lines.length === 1 ? (
                        <text
                          x={0}
                          y={24}
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
                            y={18}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight={800}
                            fill={pal.ink}
                            fontFamily="var(--dts-font-mono)"
                          >
                            {lines[0]}
                          </text>
                          <text
                            x={0}
                            y={31.5}
                            textAnchor="middle"
                            fontSize={10.5}
                            fontWeight={800}
                            fill={pal.ink}
                            fontFamily="var(--dts-font-mono)"
                          >
                            {lines[1]}
                          </text>
                        </>
                      )}
                    </g>
                  )}

                  {/* B. CYLINDER DATABASE */}
                  {kind === 'db' && (
                    <g transform="translate(0, -10)">
                      <ellipse
                        cx={0}
                        cy={39}
                        rx={35}
                        ry={16.5}
                        fill={pal.shadow}
                        opacity={isDark ? 0.42 : 0.22}
                        filter={`url(#blur-lg-${uid})`}
                      />
                      <path
                        d="M -32,-4 V 33 A 32,16 0 0 0 32,33 V -4 Z"
                        fill={`url(#g-${node.tone}-side-${uid})`}
                      />
                      <path
                        d="M -32,-4 V 33 A 32,16 0 0 0 32,33 V -4 Z"
                        fill={`url(#cyl-sheen-${uid})`}
                      />
                      <ellipse
                        cx={0}
                        cy={-4}
                        rx={32}
                        ry={16}
                        fill={`url(#g-${node.tone}-top-${uid})`}
                      />
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
                      <MinimalIcon kind={node.icon ?? 'db'} stroke={pal.ink} x={0} y={19} scale={0.86} />
                      <TactilePill
                        x={0}
                        y={62}
                        text={rawLabel}
                        bg={pal.pillBg}
                        fg={pal.pillInk}
                        stroke={pal.ink}
                        shadow={pal.pillShadow}
                        isSelected={isSelected}
                        delayMs={180 + idx * 70}
                      />
                    </g>
                  )}

                  {/* C. LAPTOP CLIENT */}
                  {kind === 'device' && (
                    <g transform="translate(0, 8)">
                      <path
                        d={SLAB_OUTER}
                        transform="translate(0, 7)"
                        fill={pal.shadow}
                        opacity={isDark ? 0.42 : 0.22}
                        filter={`url(#blur-lg-${uid})`}
                      />
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
                        delayMs={180 + idx * 70}
                      />
                    </g>
                  )}

                  {/* D. CROWD / CONCURRENT TASKS SLAB */}
                  {kind === 'crowd' && (
                    <g transform="translate(0, 6)">
                      <path
                        d={SLAB_OUTER}
                        transform="translate(0, 7)"
                        fill={pal.shadow}
                        opacity={isDark ? 0.42 : 0.22}
                        filter={`url(#blur-lg-${uid})`}
                      />
                      <path d={SLAB_OUTER} fill={`url(#slab-side-${uid})`} />
                      <path d={SLAB_TOP} fill={`url(#slab-top-${uid})`} />
                      <path
                        d={SLAB_OUTER}
                        fill="none"
                        stroke={pal.ink}
                        strokeWidth={isHovered || isSelected ? 2.2 : 1.65}
                        strokeLinejoin="round"
                      />
                      {[
                        { x: -22, y: 2, c: '#f6cd82' },
                        { x: -6, y: -6, c: '#a9c5e8' },
                        { x: 10, y: -14, c: '#b3d79f' },
                        { x: -6, y: 10, c: '#cbbae6' },
                        { x: 10, y: 2, c: '#f3b47f' },
                        { x: 24, y: -5, c: '#f9cbd0' },
                      ].map((av, aIdx) => (
                        <g key={aIdx} transform={`translate(${av.x}, ${av.y})`}>
                          <ellipse cx={0} cy={0} rx={5.2} ry={2.5} fill="#6b5236" opacity={0.18} />
                          <path
                            d="M-4.8,0 V-8.2 A4.8,4.8 0 0 1 4.8,-8.2 V0 A4.8,2.2 0 0 1 -4.8,0 Z"
                            fill={av.c}
                            stroke={pal.ink}
                            strokeWidth={1.3}
                          />
                          <circle
                            cx={0}
                            cy={-15.5}
                            r={3.9}
                            fill="#fdf6ec"
                            stroke={pal.ink}
                            strokeWidth={1.3}
                          />
                        </g>
                      ))}
                      <TactilePill
                        x={0}
                        y={50}
                        text={rawLabel}
                        bg={pal.pillBg}
                        fg={pal.pillInk}
                        stroke={pal.ink}
                        shadow={pal.pillShadow}
                        isSelected={isSelected}
                        delayMs={180 + idx * 70}
                      />
                    </g>
                  )}

                  {/* Status / Role Pill below block */}
                  {kind === 'block' && (node.badge || subText) && (
                    <TactilePill
                      x={0}
                      y={64}
                      text={node.badge ? pickText(node.badge.text, lang) : subText}
                      bg={
                        node.badge?.tone === 'bad'
                          ? pal.tones.rose.top0
                          : node.badge?.tone === 'ok'
                            ? pal.tones.green.top0
                            : pal.pillBg
                      }
                      fg={pal.pillInk}
                      stroke={pal.ink}
                      shadow={pal.pillShadow}
                      isSelected={isSelected}
                      delayMs={200 + idx * 70}
                    />
                  )}

                  {/* Load Meter Pill above block */}
                  {typeof node.loadPct === 'number' && (() => {
                    const pct = Math.max(0, Math.min(100, node.loadPct));
                    const barColor =
                      pct >= 90 ? '#e5534b' : pct >= 65 ? '#efb041' : '#7fc278';
                    return (
                      <g transform="translate(0, -54)">
                        <rect x={-37} y={-8.5} width={74} height={19} rx={9.5} fill={pal.pillShadow} />
                        <rect
                          x={-37}
                          y={-10.5}
                          width={74}
                          height={19}
                          rx={9.5}
                          fill={pal.pillBg}
                          stroke={pal.ink}
                          strokeWidth={1.3}
                        />
                        <rect x={-29} y={-4} width={30} height={6} rx={3} fill="#e6ddd0" />
                        <rect
                          x={-29}
                          y={-4}
                          width={Math.max(3, (30 * pct) / 100)}
                          height={6}
                          rx={3}
                          fill={barColor}
                        />
                        <text
                          x={29}
                          y={2.5}
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
                  })()}
                </g>
              </g>
            );
          })}
        </g>

        {/* 5. Interactive Floating Link Label Pills */}
        <g className="layer-link-labels">
          {builtLinks.map(({ link, labelPos }, idx) => {
            if (!link.label) return null;
            const text = pickText(link.label, lang);
            if (!text) return null;
            const linkKey = `link:${link.id}`;
            const info = getLinkInspector(link);

            return (
              <TactilePill
                key={`lbl-${link.id}`}
                x={labelPos.x}
                y={labelPos.y}
                text={text}
                bg={link.style === 'danger' ? pal.tones.rose.top0 : pal.pillBg}
                fg={pal.pillInk}
                stroke={link.style === 'danger' ? pal.dangerLink : pal.ink}
                shadow={pal.pillShadow}
                isSelected={selectedInfo?.key === linkKey}
                delayMs={260 + idx * 60}
                onHover={() => {
                  setHoveredKey(linkKey);
                  setHoverPreview(info);
                }}
                onLeave={() => {
                  setHoveredKey(null);
                  setHoverPreview(null);
                }}
                onClick={() => setSelectedInfo({ key: linkKey, info })}
              />
            );
          })}
        </g>
        </g>
      </svg>

      {/* Top-Right Interactive Zoom Toolbar (click % directly to reset zoom & pan) */}
      <div
        data-no-pan="true"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-2 z-30 inline-flex items-center gap-0.5 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]/95 p-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-ink)] shadow-[1.5px_1.5px_0_var(--dts-shadow-color)] backdrop-blur-[2px]"
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

      {/* Quick Hover Preview Tooltip (when hovering before clicking) */}
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

      {/* Full Deep-Dive Inspector Card (when clicked) */}
      {selectedInfo && (
        <div
          data-no-pan="true"
          data-allow-select="true"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2.5 bottom-2.5 z-30 flex max-h-[92%] w-[calc(100%-20px)] sm:w-[375px] justify-end"
        >
          <StageEntityInspectorCard
            info={selectedInfo.info}
            lang={lang}
            onClose={() => setSelectedInfo(null)}
          />
        </div>
      )}
    </div>
  );
};
