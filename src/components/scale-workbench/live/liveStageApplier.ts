/**
 * Áp LiveSimFrame lên DOM SVG của stage (05 §3.2): ghi thẳng thuộc tính qua tham chiếu phần tử,
 * có dirty-check, không setState, không đọc layout trong vòng lặp.
 *
 * Tách khỏi React: nhận các phần tử qua kiểu cấu trúc tối thiểu `LiveEl` nên test được bằng DOM giả.
 */
import type { BilingualText, LiveSimFrame, LiveSimSource, PacketKind } from '../types';
import {
  buildLut,
  linkVisual,
  lutAt,
  nodeVisual,
  PACKET_STYLE,
  packetVisual,
  PILE_MAX,
  roundTo,
} from './liveFrameMath';

export interface LiveEl {
  setAttribute(name: string, value: string): void;
  textContent: string | null;
}

export interface LiveNodeEls {
  id: string;
  label: string;
  baseX: number;
  baseY: number;
  overlay: LiveEl;
  tint: LiveEl;
  warm: LiveEl;
  bar: LiveEl;
  barFill: LiveEl;
  barText: LiveEl;
  pile: LiveEl;
  pileRects: LiveEl[];
  queueText: LiveEl;
  x: LiveEl;
  badge: LiveEl;
  badgeRect: LiveEl;
  badgeText: LiveEl;
  /** nhóm node gốc do choreography quản lý (để rung / aria-label); có thể null */
  outer: LiveEl | null;
}

export interface LiveLinkEls {
  id: string;
  toNodeId?: string;
  path: LiveEl;
  err: LiveEl;
  cut: LiveEl;
  gate: LiveEl;
  gateRect: LiveEl;
  gateText: LiveEl;
  lag: LiveEl;
  lag2: LiveEl;
  lagText: LiveEl;
  /** Các chấm vàng xếp hàng dọc dây nối ngay trước node đích đang bận/nghẽn (chuẩn DTS) */
  qdots?: LiveEl | null;
  qdotCircles?: LiveEl[];
  qdrop?: LiveEl | null;
}

export interface LivePacketEls {
  g: LiveEl;
  circle: LiveEl;
  rect: LiveEl;
  ring: LiveEl;
}

export interface LiveApplierConfig {
  source: LiveSimSource;
  nodes: LiveNodeEls[];
  links: LiveLinkEls[];
  pool: LivePacketEls[];
  layers: { links: LiveEl | null; ents: LiveEl | null; packets: LiveEl | null };
  scalePill: LiveEl | null;
  /** lấy điểm trên link theo tỉ lệ 0..1 (gọi 49 lần/link khi dựng LUT, ngoài vòng tick) */
  sampleLink: (linkId: string, frac: number) => { x: number; y: number } | null;
  inkColor: string;
  pillBg: string;
  pillInk: string;
  reducedMotion: boolean;
  stateLabel: (state: string) => string;
  ariaLabel: (label: string, stateText: string, loadPct: number) => string;
  scaleText: (n: number) => string;
  pickText: (t: BilingualText) => string;
  /** tau làm mượt loadPct/queue (giây); mặc định 0,12 */
  smoothTau?: number;
}

interface NodeRuntime {
  load: number;
  queue: number;
  shaking: boolean;
}

interface PacketRec {
  id: number;
  linkId: string;
  kind: PacketKind;
  reverse: boolean;
  fate: number | undefined;
  p0: number;
  v: number; // tiến độ / giây thực
  arrival: number;
  styleKind: PacketKind | '';
}

export interface LiveFrameApplier {
  /** gọi mỗi rAF. `ready` = stage đã "tiếp đất" xong. */
  step(now: number, ready: boolean, isPlaying: boolean): void;
  /** metadata chấm đang ở slot i (cho tracer) */
  packetAtSlot(slot: number): { id: number; linkId: string; kind: PacketKind } | null;
  /** ẩn mọi thứ (khi huỷ) */
  dispose(): void;
}

export function createLiveFrameApplier(cfg: LiveApplierConfig): LiveFrameApplier {
  const shown = new WeakMap<object, Record<string, string>>();
  const put = (el: LiveEl | null, name: string, value: string): void => {
    if (!el) return;
    let rec = shown.get(el);
    if (!rec) {
      rec = {};
      shown.set(el, rec);
    }
    if (rec[name] === value) return;
    rec[name] = value;
    el.setAttribute(name, value);
  };
  const putText = (el: LiveEl, value: string): void => {
    let rec = shown.get(el);
    if (!rec) {
      rec = {};
      shown.set(el, rec);
    }
    if (rec.__text === value) return;
    rec.__text = value;
    el.textContent = value;
  };
  const show = (el: LiveEl | null, on: boolean): void => put(el, 'display', on ? 'inline' : 'none');
  const n1 = (v: number): string => (Math.round(v * 10) / 10).toString();
  const n2 = (v: number): string => (Math.round(v * 100) / 100).toString();

  const tau = cfg.smoothTau ?? 0.12;
  const nodeRt = new Map<string, NodeRuntime>();
  for (const n of cfg.nodes) nodeRt.set(n.id, { load: 0, queue: 0, shaking: false });
  const rpsMax = new Map<string, number>();
  const luts = new Map<string, Float32Array>();
  for (const l of cfg.links) {
    const probe = cfg.sampleLink(l.id, 0);
    if (!probe) continue;
    luts.set(l.id, buildLut((fr) => cfg.sampleLink(l.id, fr) ?? probe));
  }

  const recs: Array<PacketRec | null> = cfg.pool.map(() => null);
  const slotOf = new Map<number, number>();
  const free: number[] = [];
  for (let i = cfg.pool.length - 1; i >= 0; i--) free.push(i);

  let lastTick = -1;
  let lastNow = 0;
  let lastReady = false;
  const tmp = { x: 0, y: 0 };

  const hidePool = (): void => {
    for (let i = 0; i < cfg.pool.length; i++) show(cfg.pool[i].g, false);
  };

  const setPacketStyle = (el: LivePacketEls, kind: PacketKind): void => {
    const st = PACKET_STYLE[kind] ?? PACKET_STYLE.request;
    const stroke = st.stroke === 'ink' ? cfg.inkColor : st.stroke;
    const circ = st.shape === 'circle';
    show(el.circle, circ);
    show(el.rect, !circ);
    const target = circ ? el.circle : el.rect;
    put(target, 'fill', st.fill);
    put(target, 'stroke', stroke);
    put(target, 'stroke-width', String(st.strokeWidth));
    if (circ) put(el.circle, 'r', String(st.r));
    else {
      put(el.rect, 'x', String(-st.r));
      put(el.rect, 'y', String(-st.r));
      put(el.rect, 'width', String(st.r * 2));
      put(el.rect, 'height', String(st.r * 2));
    }
    show(el.ring, st.ring);
    if (st.ring) put(el.ring, 'stroke', st.stroke === 'ink' ? cfg.inkColor : st.stroke);
  };

  const onNewFrame = (f: LiveSimFrame, now: number): void => {
    // rps max cho độ dày ống (suy giảm chậm ~ nửa chu kỳ vài giây)
    for (const l of cfg.links) {
      const rps = f.links[l.id]?.rps ?? 0;
      const prev = rpsMax.get(l.id) ?? 0;
      rpsMax.set(l.id, Math.max(rps, prev * 0.985, 1));
    }
    if (cfg.reducedMotion) return;
    const seen = new Set<number>();
    const list = f.packets;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      let slot = slotOf.get(p.id);
      let rec: PacketRec | null;
      if (slot === undefined) {
        if (free.length === 0 || !luts.has(p.linkId)) continue;
        slot = free.pop() as number;
        slotOf.set(p.id, slot);
        rec = {
          id: p.id, linkId: p.linkId, kind: p.kind, reverse: p.reverse, fate: p.fate,
          p0: p.progress, v: 0, arrival: now, styleKind: '',
        };
        recs[slot] = rec;
      } else {
        rec = recs[slot];
        if (!rec) continue;
        const dp = p.progress - rec.p0;
        const dtMs = now - rec.arrival;
        rec.v = dp > 0 && dtMs > 0 && p.reverse === rec.reverse ? (dp / dtMs) * 1000 : 0;
        rec.p0 = p.progress;
        rec.arrival = now;
        rec.kind = p.kind;
        rec.reverse = p.reverse;
        rec.fate = p.fate;
        rec.linkId = p.linkId;
      }
      seen.add(p.id);
    }
    for (const [id, slot] of slotOf) {
      if (seen.has(id)) continue;
      slotOf.delete(id);
      recs[slot] = null;
      free.push(slot);
      show(cfg.pool[slot].g, false);
    }
  };

  const applyNodes = (f: LiveSimFrame, dt: number, now: number): void => {
    const alpha = cfg.reducedMotion ? 1 : 1 - Math.exp(-dt / tau);
    for (const n of cfg.nodes) {
      const nf = f.nodes[n.id];
      const rt = nodeRt.get(n.id) as NodeRuntime;
      const v = nodeVisual(nf);
      rt.load += (v.barPct - rt.load) * alpha;
      const qTarget = v.pileCount / PILE_MAX;
      rt.queue += (qTarget - rt.queue) * alpha;
      if (v.down) {
        rt.load = 0;
        rt.queue = 0;
      }
      if (Math.abs(rt.load - v.barPct) < 0.3) rt.load = v.barPct;
      if (Math.abs(rt.queue - qTarget) < 0.01) rt.queue = qTarget;
      const loadShown = Math.round(rt.load);
      const pileShown = Math.ceil(rt.queue * PILE_MAX - 1e-6);

      // tint
      put(n.tint, 'fill', v.tintFill);
      put(n.tint, 'stroke', v.tintFill);
      put(n.tint, 'opacity', n2(roundTo(v.tintOpacity, 0.02)));
      put(
        n.tint,
        'stroke-opacity',
        v.pulse && !cfg.reducedMotion ? n2(roundTo(0.55 + 0.45 * Math.sin(now / 160), 0.05)) : '0.55',
      );
      // load bar
      show(n.bar, v.barShow);
      if (v.barShow) {
        put(n.barFill, 'width', n1(Math.max(3, (30 * loadShown) / 100)));
        put(n.barFill, 'fill', v.barColor);
        put(n.barText, 'fill', v.barTextBad ? '#c93b32' : cfg.pillInk);
        putText(n.barText, `${loadShown}%`);
      }
      // queue pile
      show(n.pile, pileShown > 0);
      if (pileShown > 0) {
        for (let i = 0; i < n.pileRects.length; i++) {
          show(n.pileRects[i], i < pileShown);
          put(n.pileRects[i], 'fill', v.pileColor);
        }
        show(n.queueText, v.showQueueText);
        if (v.showQueueText) putText(n.queueText, v.queueLabel);
      }
      // down mark
      show(n.x, v.down);
      // warm ring
      show(n.warm, v.showWarm);
      if (v.showWarm) put(n.warm, 'stroke-dasharray', `${n1(v.warm * 100)} 100`);
      // badge
      const b = nf?.badge;
      show(n.badge, Boolean(b));
      if (b) {
        const text = cfg.pickText(b.text);
        putText(n.badgeText, text);
        const w = Math.max(44, text.length * 6.2 + 20);
        put(n.badgeRect, 'x', n1(-w / 2));
        put(n.badgeRect, 'width', n1(w));
        put(
          n.badgeRect,
          'fill',
          b.tone === 'ok' ? '#9fd28f' : b.tone === 'warn' ? '#efb041' : b.tone === 'bad' ? '#e5534b' : cfg.pillBg,
        );
      }
      // shake (chỉ tính khi saturated, tắt khi reduced-motion)
      const dx = v.shake && !cfg.reducedMotion ? 0.6 * Math.sin((now / 1000) * 2 * Math.PI * 18) : 0;
      if (dx !== 0 || rt.shaking) {
        const x = n1(n.baseX + dx);
        put(n.overlay, 'transform', `translate(${x}, ${n1(n.baseY)})`);
        put(n.outer, 'transform', `translate(${x}, ${n1(n.baseY)})`);
        rt.shaking = dx !== 0;
      }
      // a11y
      const stateText = cfg.stateLabel(nf?.state ?? 'healthy');
      put(n.outer, 'aria-label', cfg.ariaLabel(n.label, stateText, loadShown));
    }
  };

  const applyLinks = (f: LiveSimFrame): void => {
    for (const l of cfg.links) {
      const lf = f.links[l.id];
      const v = linkVisual(lf, rpsMax.get(l.id) ?? 1);
      show(l.path, v.show);
      show(l.err, v.show && v.errOpacity > 0);
      show(l.cut, v.showCut);
      show(l.gate, v.showGate);
      show(l.lag, v.showLag);
      if (!v.show) {
        if (l.qdots) show(l.qdots, false);
        if (l.qdrop) show(l.qdrop, false);
        continue;
      }
      put(l.path, 'stroke-width', n1(Math.min(2.4, v.width)));
      put(l.path, 'stroke', v.stroke === 'ink' ? cfg.inkColor : v.stroke);
      put(l.path, 'stroke-dasharray', v.dash);
      put(l.path, 'opacity', n2(v.opacity));
      if (v.errOpacity > 0) {
        put(l.err, 'stroke-width', n1(Math.min(2.2, v.errWidth)));
        put(l.err, 'opacity', n2(roundTo(v.errOpacity, 0.05)));
      }
      if (v.showGate) {
        put(l.gateRect, 'fill', v.gateFill);
        putText(l.gateText, v.gateGlyph);
      }
      if (v.showLag) {
        put(l.lag2, 'transform', `translate(${n1(v.lagGap)}, 0)`);
        put(l.lag2, 'stroke', v.lagWarn ? '#e8883a' : cfg.inkColor);
        putText(l.lagText, v.lagText);
      }
      // Hàng đợi chấm vàng + dấu ✕ đỏ ngay cửa vào thành phần đang bận / nghẽn
      if (l.qdots && l.qdotCircles && l.toNodeId) {
        const toNf = f.nodes[l.toNodeId];
        const lut = luts.get(l.id);
        const load = toNf?.loadPct ?? 0;
        const qPct = toNf?.queuePct ?? 0;
        const st = toNf?.state ?? 'healthy';
        const hasDrop =
          st === 'overloaded' || (lf?.errorRate ?? 0) > 0.02 || load >= 99;
        const qCount =
          st === 'down' || (lf?.rps ?? 0) <= 0.1
            ? 0
            : st === 'overloaded' || qPct >= 0.65 || load >= 96
              ? 5
              : st === 'saturated' || qPct >= 0.3 || load >= 88
                ? 4
                : st === 'busy' || qPct >= 0.08 || load >= 68
                  ? 3
                  : 0;
        show(l.qdots, qCount > 0 && Boolean(lut));
        if (qCount > 0 && lut) {
          const baseEnd = hasDrop ? 0.87 : 0.93;
          for (let qi = 0; qi < l.qdotCircles.length; qi++) {
            const cEl = l.qdotCircles[qi];
            const vis = qi < qCount;
            show(cEl, vis);
            if (vis) {
              const frac = Math.max(0.28, baseEnd - qi * 0.068);
              lutAt(lut, frac, tmp);
              put(cEl, 'cx', n1(tmp.x));
              put(cEl, 'cy', n1(tmp.y));
            }
          }
        }
        if (l.qdrop) {
          show(l.qdrop, hasDrop && Boolean(lut));
          if (hasDrop && lut) {
            lutAt(lut, 0.94, tmp);
            put(l.qdrop, 'transform', `translate(${n1(tmp.x)}, ${n1(tmp.y)})`);
          }
        }
      }
    }
  };

  const applyPackets = (now: number, isPlaying: boolean): void => {
    for (let slot = 0; slot < recs.length; slot++) {
      const rec = recs[slot];
      if (!rec) continue;
      const el = cfg.pool[slot];
      const lut = luts.get(rec.linkId);
      if (!lut) {
        show(el.g, false);
        continue;
      }
      if (rec.styleKind !== rec.kind) {
        setPacketStyle(el, rec.kind);
        rec.styleKind = rec.kind;
      }
      const extra = isPlaying ? (Math.min(250, Math.max(0, now - rec.arrival)) * rec.v) / 1000 : 0;
      const pv = packetVisual(rec.kind, Math.min(1, rec.p0 + extra), rec.fate, rec.reverse);
      lutAt(lut, pv.t, tmp);
      put(el.g, 'transform', `translate(${n1(tmp.x)} ${n1(tmp.y + pv.dy)})`);
      put(el.g, 'opacity', n2(roundTo(pv.opacity, 0.05)));
      show(el.g, pv.opacity > 0.01);
    }
  };

  return {
    step(now, ready, isPlaying) {
      const op = ready ? '1' : '0';
      put(cfg.layers.links, 'opacity', op);
      put(cfg.layers.ents, 'opacity', op);
      put(cfg.layers.packets, 'opacity', op);
      const dt = lastNow === 0 ? 0 : Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      if (!ready) {
        lastReady = false;
        return;
      }
      const f = cfg.source.getFrame();
      if (!f) return;
      const changed = f.tick !== lastTick || !lastReady;
      if (changed) {
        onNewFrame(f, now);
        lastTick = f.tick;
      }
      lastReady = true;
      applyNodes(f, dt, now);
      if (changed) {
        applyLinks(f);
        if (cfg.scalePill) {
          if (f.packetScale > 0 && !cfg.reducedMotion) putText(cfg.scalePill, cfg.scaleText(f.packetScale));
          else putText(cfg.scalePill, '');
        }
      }
      if (cfg.reducedMotion) hidePool();
      else applyPackets(now, isPlaying);
    },
    packetAtSlot(slot) {
      const r = recs[slot];
      return r ? { id: r.id, linkId: r.linkId, kind: r.kind } : null;
    },
    dispose() {
      put(cfg.layers.links, 'opacity', '0');
      put(cfg.layers.ents, 'opacity', '0');
      put(cfg.layers.packets, 'opacity', '0');
      hidePool();
    },
  };
}

