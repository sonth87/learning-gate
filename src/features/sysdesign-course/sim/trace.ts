/**
 * `traceRequest` (04 §9.2, 05 §5.7): waterfall của MỘT request đại diện tại frame hiện tại.
 * Đường đi và độ trễ từng chặng được lấy mẫu từ `LatencySummary` của node/link trong frame bằng RNG có seed
 * `tickRng(seed ^ hash(packetId), tick, ch=4)` ⇒ cùng (model, frame, packetId, hint) cho cùng trace.
 * Không phải request thật: UI ghi rõ "request đại diện". Thuần TS.
 */
import { fitShiftExp } from './latency';
import type { CLink, CompiledModel, LinkId, NodeId, RetryPolicy } from './model';
import { tickRng } from './rng';
import type { LatencySummary, SimFrame, SimPacketKind } from './types';

export type TraceSpanKind = 'net' | 'queue' | 'service' | 'retry-wait' | 'timeout';

export interface TraceSpan {
  kind: TraceSpanKind;
  /** node (queue/service/cache) hoặc callee (timeout) liên quan; net/retry-wait: link */
  nodeId?: NodeId;
  linkId?: LinkId;
  /** thời điểm bắt đầu tính từ lúc client gửi (ms) */
  startMs: number;
  durMs: number;
  /** false: chặng này lỗi (timeout/drop/down/error) */
  ok: boolean;
  /** lần thử (1-based) trên link có retry */
  attempt?: number;
  note?: 'cache-hit' | 'cache-miss';
  /** span `timeout`: node chậm nhất bên trong lần thử bị cắt (nguyên nhân gốc), nếu khác callee */
  culpritNodeId?: NodeId;
}

export type TraceOutcome = 'ok' | 'timeout' | 'error' | 'dropped';

export interface RequestTrace {
  packetId: number | null;
  kind: SimPacketKind;
  tick: number;
  outcome: TraceOutcome;
  totalMs: number;
  /** số lần thử lớn nhất trên một link (1 = không retry) */
  attempts: number;
  /** true: timeout của link tổ tiên bị bỏ qua để chặng retry/timeout được bấm hiện đầy đủ */
  ancestorTimeoutsIgnored: boolean;
  /** các link đã đi qua (theo thứ tự lần đầu) */
  path: LinkId[];
  spans: TraceSpan[];
  /** chỉ số span dài nhất và phần trăm tổng thời gian (0..1) */
  slowest: { index: number; nodeId?: NodeId; linkId?: LinkId; share: number };
}

export interface TraceHint { packetId?: number; linkId?: LinkId; kind?: SimPacketKind }

const MAX_SPANS = 200;

function backoffMs(rp: RetryPolicy, retryNo: number): number {
  if (rp.backoff === 'none') return 0;
  if (rp.backoff === 'fixed') return rp.baseMs;
  return Math.min(rp.capMs ?? 30000, rp.baseMs * Math.pow(rp.factor ?? 2, retryNo - 1));
}

function sampleLat(s: LatencySummary, u: number): number {
  const { shift, scale } = fitShiftExp(s);
  return Math.max(0, shift + scale * -Math.log(Math.max(1e-12, 1 - u)));
}

export function traceRequest(c: CompiledModel, frame: SimFrame, hint: TraceHint = {}): RequestTrace | null {
  if (c.clients.length === 0) return null;
  const pk = hint.packetId !== undefined ? frame.packets.find((p) => p.id === hint.packetId) : undefined;
  const kind: SimPacketKind = hint.kind ?? pk?.kind ?? 'request';
  const hintLink = hint.linkId ?? pk?.linkId;
  const hintLinkIdx = hintLink !== undefined ? c.linkIdx[hintLink] : undefined;
  if (hintLink !== undefined && hintLinkIdx === undefined) return null;

  const seed = (c.seed ^ Math.imul((hint.packetId ?? 0) + 1, 0x9E3779B1)) >>> 0;
  const rand = tickRng(seed, frame.tick, 4);
  const isRead = rand() < c.readRatio;

  const spans: TraceSpan[] = [];
  const path: LinkId[] = [];
  let attemptsMax = 1;
  const missed = new Set<number>(); // cache bị miss trong request này (chỉ số node)
  let forcedPending = hintLinkIdx !== undefined && (kind === 'retry' || kind === 'timeout' || kind === 'dropped' || kind === 'error' || kind === 'cache-hit');
  const st: { terminal: TraceOutcome | null; ancestorTimeoutsIgnored: boolean } = { terminal: null, ancestorTimeoutsIgnored: false };

  // đường tới link được chỉ định: lùi theo link vào đầu tiên tới client
  const mustVia = new Set<number>();
  if (hintLinkIdx !== undefined) {
    let e = hintLinkIdx;
    for (let guard = 0; guard < c.links.length + 1; guard++) {
      mustVia.add(e);
      const from = c.links[e].from;
      if (c.nodes[from].kind === 'client') break;
      const prev = c.nodes[from].inFlow.find((x) => c.links[x].spec.mode === 'sync' || c.links[x].spec.mode === 'async');
      if (prev === undefined) break;
      e = prev;
    }
  }

  const carries = (l: CLink): boolean => {
    const cr = l.spec.carries ?? 'rw';
    return cr === 'rw' || (isRead ? cr === 'r' : cr === 'w');
  };
  const weightOf = (l: CLink): number => {
    const w = frame.links[l.id]?.rps ?? 0;
    return w > 1e-9 ? w : (l.spec.weight ?? 1) * 1e-6;
  };

  function push(sp: TraceSpan): void { if (spans.length < MAX_SPANS) spans.push(sp); }

  /** Chạy node n từ thời điểm t0 (đã tính net vào). Trả { end, ok }. */
  function runNode(n: number, t0: number): { end: number; ok: boolean } {
    const nd = c.nodes[n];
    const nf = frame.nodes[nd.id];
    let t = t0;
    if (nd.kind !== 'client' && nf) {
      if (nf.state === 'down') {
        push({ kind: 'service', nodeId: nd.id, startMs: t, durMs: 0.1, ok: false });
        return { end: t + 0.1, ok: false };
      }
      const total = sampleLat(nf.latency, rand());
      const q = Math.min(total, nf.queueWaitMs);
      if (q > 0.05) { push({ kind: 'queue', nodeId: nd.id, startMs: t, durMs: q, ok: true }); t += q; }
      const svc = Math.max(0.001, total - q);
      let note: TraceSpan['note'];
      let hit = false;
      if ((nd.kind === 'cache' || nd.kind === 'cdn') && isRead) {
        const forceHit = forcedPending && kind === 'cache-hit' && hintLinkIdx !== undefined && c.links[hintLinkIdx].to === n;
        const forceMiss = hintLinkIdx !== undefined && !forceHit && mustVia.size > 0
          && c.links.some((l) => l.from === n && mustVia.has(l.idx));
        hit = forceHit || (!forceMiss && rand() < (nf.hitRatio ?? 0));
        note = hit ? 'cache-hit' : 'cache-miss';
        if (!hit) missed.add(n);
      }
      push({ kind: 'service', nodeId: nd.id, startMs: t, durMs: svc, ok: true, note });
      t += svc;
      if (hit) return { end: t, ok: true };
      if (forcedPending && (kind === 'dropped' || kind === 'error') && hintLinkIdx !== undefined && c.links[hintLinkIdx].to === n) {
        st.terminal = kind === 'dropped' ? 'dropped' : 'error';
        forcedPending = false;
        spans[spans.length - 1].ok = false;
        return { end: t, ok: false };
      }
    }
    // link đi ra
    const outs = nd.outFlow.map((e) => c.links[e]).filter((l) => {
      if (!carries(l)) return false;
      if (l.onMissOf >= 0 && !missed.has(l.onMissOf)) return false;
      if (c.nodes[l.to].spec.params.enabled === false) return false;
      return true;
    });
    if (outs.length === 0) return { end: t, ok: true };
    const via = outs.filter((l) => mustVia.has(l.idx));
    let chosen: CLink[];
    if (nd.route === 'split') {
      if (via.length > 0) chosen = [via[0]];
      else {
        let sum = 0;
        for (const l of outs) sum += weightOf(l);
        let u = rand() * sum;
        chosen = [outs[outs.length - 1]];
        for (const l of outs) { u -= weightOf(l); if (u <= 0) { chosen = [l]; break; } }
      }
    } else {
      chosen = outs.filter((l) => (l.spec.fraction ?? 1) >= 1 || mustVia.has(l.idx) || rand() < (l.spec.fraction ?? 1));
    }
    let ok = true;
    if (nd.route === 'all-parallel') {
      let endMax = t;
      for (const l of chosen) {
        const r = runLink(l, t);
        endMax = Math.max(endMax, r.end);
        ok = ok && r.ok;
      }
      return { end: endMax, ok };
    }
    for (const l of chosen) {
      const calls = Math.max(1, Math.round(l.spec.calls ?? 1));
      for (let i = 0; i < calls && ok; i++) {
        const r = runLink(l, t);
        t = r.end;
        ok = r.ok;
      }
      if (!ok) break;
    }
    return { end: t, ok };
  }

  /** Gọi qua link l từ t0 gồm timeout/retry. */
  function runLink(l: CLink, t0: number): { end: number; ok: boolean } {
    if (!path.includes(l.id)) path.push(l.id);
    const lf = frame.links[l.id];
    // chấm retry/timeout được bấm là điểm quan sát: không để timeout của link tổ tiên che mất nó
    const ignoreTau = (kind === 'retry' || kind === 'timeout') && hintLinkIdx !== undefined && mustVia.has(l.idx) && l.idx !== hintLinkIdx;
    if (ignoreTau && l.spec.timeoutMs !== undefined) st.ancestorTimeoutsIgnored = true;
    const tau = ignoreTau ? undefined : l.spec.timeoutMs;
    const rp = l.spec.retry;
    const maxRetry = rp ? Math.max(0, rp.max) : 0;
    const net = l.netMs;
    let t = t0;
    let attempt = 0;
    for (;;) {
      attempt++;
      attemptsMax = Math.max(attemptsMax, attempt);
      const mark = spans.length;
      const start = t;
      const isForced = forcedPending && hintLinkIdx === l.idx && attempt === 1;
      let ok: boolean;
      let end: number;
      if (lf && lf.style === 'cut') {
        ok = false; end = start + (tau ?? c.clientTimeoutMs);
      } else {
        push({ kind: 'net', linkId: l.id, nodeId: undefined, startMs: start, durMs: net, ok: true, attempt: rp ? attempt : undefined });
        const r = runNode(l.to, start + net);
        ok = r.ok; end = r.end;
      }
      const dur = end - start;
      const timedOut = (tau !== undefined && dur > tau) || (lf?.style === 'cut') || (isForced && kind === 'timeout')
        || (isForced && kind === 'retry');
      if (st.terminal !== null) return { end, ok: false };
      if (timedOut) {
        let culprit: NodeId | undefined;
        let culpritDur = 0;
        for (let i = mark; i < spans.length; i++) {
          const sp = spans[i];
          if (sp.nodeId !== undefined && sp.durMs > culpritDur) { culprit = sp.nodeId; culpritDur = sp.durMs; }
        }
        spans.length = Math.min(spans.length, mark);
        const cut = tau ?? Math.min(dur, c.clientTimeoutMs);
        const callee = c.nodes[l.to].id;
        push({
          kind: 'timeout', linkId: l.id, nodeId: callee, startMs: start, durMs: cut, ok: false, attempt: rp ? attempt : undefined,
          ...(culprit !== undefined && culprit !== callee ? { culpritNodeId: culprit } : {}),
        });
        t = start + cut;
        if (isForced) forcedPending = false;
        if (isForced && kind === 'timeout') { st.terminal = 'timeout'; return { end: t, ok: false }; }
        if (attempt <= maxRetry) {
          const d = backoffMs(rp!, attempt);
          const w = rp!.jitter === 'full' ? d * rand() : rp!.jitter === 'equal' ? d / 2 + (d / 2) * rand() : d;
          push({ kind: 'retry-wait', linkId: l.id, startMs: t, durMs: w, ok: true, attempt: attempt + 1 });
          t += w;
          continue;
        }
        return fail(l, t);
      }
      if (!ok) {
        if (attempt <= maxRetry) {
          const d = backoffMs(rp!, attempt);
          const w = rp!.jitter === 'full' ? d * rand() : rp!.jitter === 'equal' ? d / 2 + (d / 2) * rand() : d;
          push({ kind: 'retry-wait', linkId: l.id, startMs: end, durMs: w, ok: true, attempt: attempt + 1 });
          t = end + w;
          continue;
        }
        return fail(l, end);
      }
      if (isForced) forcedPending = false;
      return { end, ok: true };
    }
  }

  /** Link thất bại hẳn: fallback bypass/degrade coi như người gọi vẫn thành công. */
  function fail(l: CLink, t: number): { end: number; ok: boolean } {
    const fb = l.spec.fallback;
    return { end: t, ok: fb === 'bypass' || fb === 'degrade' };
  }

  const entry = c.clients[0];
  const rootOut = runNode(entry, 0);

  let totalMs = 0;
  for (const s of spans) totalMs = Math.max(totalMs, s.startMs + s.durMs);
  let outcome: TraceOutcome = st.terminal ?? (rootOut.ok ? 'ok' : 'error');
  if (outcome === 'error' && st.terminal === null) {
    const lastBad = [...spans].reverse().find((s) => !s.ok);
    if (lastBad?.kind === 'timeout') outcome = 'timeout';
  }
  if (outcome === 'ok' && totalMs > c.clientTimeoutMs) outcome = 'timeout';

  let si = 0;
  for (let i = 1; i < spans.length; i++) if (spans[i].durMs > spans[si].durMs) si = i;
  const sp = spans[si];
  return {
    packetId: hint.packetId ?? null,
    kind,
    tick: frame.tick,
    outcome,
    totalMs,
    attempts: attemptsMax,
    ancestorTimeoutsIgnored: st.ancestorTimeoutsIgnored,
    path,
    spans,
    slowest: {
      index: spans.length > 0 ? si : -1,
      nodeId: sp?.culpritNodeId ?? sp?.nodeId, linkId: sp?.linkId,
      share: sp && totalMs > 0 ? sp.durMs / totalMs : 0,
    },
  };
}
