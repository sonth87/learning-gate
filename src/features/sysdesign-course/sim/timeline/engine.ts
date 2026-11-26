/**
 * Hàng đợi sự kiện rời rạc tất định theo thời gian ảo (ms) + mạng giả lập (04 §12).
 * Thuần TypeScript: dùng `mulberry32` từ `../rng`.
 */
import { mulberry32 } from '../rng';
import type {
  ActorId,
  TimelineHistoryOp,
  TimelineMessage,
  TimelineMilestone,
  TimelineRun,
  TimelineSideEffect,
} from './types';

interface ScheduledItem {
  atMs: number;
  seq: number;
  fn: () => void;
}

export interface DiscreteNetOptions {
  seed?: number;
  defaultDelayMs?: number;
  jitterMs?: number;
  actors: ActorId[];
}

export class DiscreteEventWorld {
  private heap: ScheduledItem[] = [];
  private seq = 0;
  private msgSeq = 0;
  private effectSeq = 0;
  private _nowMs = 0;
  private readonly rand: () => number;
  private readonly defaultDelayMs: number;
  private readonly jitterMs: number;
  private readonly actors: ActorId[];
  private readonly downSet = new Set<ActorId>();
  private readonly partitions = new Set<string>();
  private readonly linkDelay = new Map<string, number>();
  private readonly skewMs = new Map<ActorId, number>();

  readonly history: TimelineHistoryOp[] = [];
  readonly messages: TimelineMessage[] = [];
  readonly milestones: TimelineMilestone[] = [];
  readonly effects: TimelineSideEffect[] = [];

  constructor(opts: DiscreteNetOptions) {
    this.rand = mulberry32((opts.seed ?? 42) >>> 0);
    this.defaultDelayMs = opts.defaultDelayMs ?? 15;
    this.jitterMs = opts.jitterMs ?? 4;
    this.actors = [...opts.actors];
  }

  get nowMs(): number {
    return this._nowMs;
  }

  physicalClock(actor: ActorId): number {
    return this._nowMs + (this.skewMs.get(actor) ?? 0);
  }

  setClockSkew(actor: ActorId, offsetMs: number): void {
    this.skewMs.set(actor, offsetMs);
  }

  setLinkDelay(from: ActorId, to: ActorId, delayMs: number): void {
    this.linkDelay.set(`${from}->${to}`, Math.max(1, delayMs));
  }

  isUp(actor: ActorId): boolean {
    return !this.downSet.has(actor);
  }

  crash(actor: ActorId, reason = 'crash'): void {
    this.downSet.add(actor);
    this.milestone(actor, 'CRASH', reason);
  }

  recover(actor: ActorId, reason = 'recover'): void {
    this.downSet.delete(actor);
    this.milestone(actor, 'RECOVER', reason);
  }

  private pairKey(a: ActorId, b: ActorId): string {
    return `${a}->${b}`;
  }

  partition(a: ActorId, b: ActorId, bidirectional = true): void {
    this.partitions.add(this.pairKey(a, b));
    if (bidirectional) this.partitions.add(this.pairKey(b, a));
    this.milestone(a, 'PARTITION', `${a} <-> ${b}`);
  }

  heal(a: ActorId, b: ActorId, bidirectional = true): void {
    this.partitions.delete(this.pairKey(a, b));
    if (bidirectional) this.partitions.delete(this.pairKey(b, a));
    this.milestone(a, 'HEAL', `${a} <-> ${b}`);
  }

  isPartitioned(from: ActorId, to: ActorId): boolean {
    return this.partitions.has(this.pairKey(from, to));
  }

  scheduleAt(atMs: number, fn: () => void): void {
    const target = Math.max(this._nowMs, atMs);
    const item: ScheduledItem = { atMs: target, seq: ++this.seq, fn };
    this.pushHeap(item);
  }

  scheduleAfter(delayMs: number, fn: () => void): void {
    this.scheduleAt(this._nowMs + Math.max(0, delayMs), fn);
  }

  sendMessage(
    from: ActorId,
    to: ActorId,
    kind: string,
    label: string,
    onDeliver: () => void,
    overrideDelayMs?: number
  ): TimelineMessage {
    const base =
      overrideDelayMs ??
      this.linkDelay.get(`${from}->${to}`) ??
      (from === to ? 1 : this.defaultDelayMs);
    const jit = from === to || this.jitterMs <= 0 ? 0 : Math.round((this.rand() * 2 - 1) * this.jitterMs);
    const delay = Math.max(1, base + jit);
    const sendMs = this._nowMs;
    const recvMs = sendMs + delay;
    const dropped = !this.isUp(from) || this.isPartitioned(from, to);

    const msg: TimelineMessage = {
      id: `m${++this.msgSeq}`,
      from,
      to,
      kind,
      label,
      sendMs,
      recvMs,
      dropped,
    };
    this.messages.push(msg);

    if (!dropped) {
      this.scheduleAt(recvMs, () => {
        if (!this.isUp(to) || this.isPartitioned(from, to)) {
          msg.dropped = true;
          return;
        }
        onDeliver();
      });
    }
    return msg;
  }

  milestone(actor: ActorId, code: string, detail: string): void {
    this.milestones.push({ atMs: this._nowMs, actor, code, detail });
  }

  recordOp(op: TimelineHistoryOp): void {
    this.history.push(op);
  }

  recordEffect(actor: ActorId, action: string, idempotencyKey?: string, amount?: number): TimelineSideEffect {
    const eff: TimelineSideEffect = {
      id: `ef${++this.effectSeq}`,
      atMs: this._nowMs,
      actor,
      action,
      ...(idempotencyKey !== undefined ? { idempotencyKey } : {}),
      ...(amount !== undefined ? { amount } : {}),
    };
    this.effects.push(eff);
    return eff;
  }

  run(maxMs = 60_000): TimelineRun {
    while (this.heap.length > 0) {
      const top = this.heap[0];
      if (top.atMs > maxMs) break;
      const item = this.popHeap()!;
      this._nowMs = item.atMs;
      item.fn();
    }
    return {
      durationMs: this._nowMs,
      actors: [...this.actors],
      history: [...this.history].sort((a, b) => a.start - b.start || a.end - b.end),
      messages: [...this.messages],
      milestones: [...this.milestones],
      effects: [...this.effects],
    };
  }

  private less(a: ScheduledItem, b: ScheduledItem): boolean {
    return a.atMs !== b.atMs ? a.atMs < b.atMs : a.seq < b.seq;
  }

  private pushHeap(item: ScheduledItem): void {
    const h = this.heap;
    h.push(item);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(h[i], h[p])) break;
      const tmp = h[i];
      h[i] = h[p];
      h[p] = tmp;
      i = p;
    }
  }

  private popHeap(): ScheduledItem | undefined {
    const h = this.heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop()!;
    if (h.length > 0) {
      h[0] = last;
      let i = 0;
      const n = h.length;
      while (true) {
        let best = i;
        const l = i * 2 + 1;
        const r = l + 1;
        if (l < n && this.less(h[l], h[best])) best = l;
        if (r < n && this.less(h[r], h[best])) best = r;
        if (best === i) break;
        const tmp = h[i];
        h[i] = h[best];
        h[best] = tmp;
        i = best;
      }
    }
    return top;
  }
}
