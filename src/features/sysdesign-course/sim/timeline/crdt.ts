/**
 * CRDT chuẩn (Conflict-free Replicated Data Types) cho S3-08 (04 §12):
 * G-Counter, PN-Counter, LWW-Register và OR-Set (Observed-Remove Set).
 * Thuần TypeScript: thoả giao hoán, kết hợp, luỹ đẳng (ACI).
 */
import type { ActorId } from './types';

export class GCounter {
  private readonly counts: Record<ActorId, number>;

  constructor(initial: Record<ActorId, number> = {}) {
    this.counts = { ...initial };
  }

  increment(replica: ActorId, delta = 1): void {
    if (delta < 0) throw new Error('GCounter chỉ cho phép tăng không âm');
    this.counts[replica] = (this.counts[replica] ?? 0) + delta;
  }

  value(): number {
    let sum = 0;
    for (const v of Object.values(this.counts)) sum += v;
    return sum;
  }

  state(): Record<ActorId, number> {
    return { ...this.counts };
  }

  merge(other: GCounter): GCounter {
    const merged: Record<ActorId, number> = { ...this.counts };
    for (const [k, v] of Object.entries(other.counts)) {
      merged[k] = Math.max(merged[k] ?? 0, v);
    }
    return new GCounter(merged);
  }
}

export class PNCounter {
  private readonly pos: GCounter;
  private readonly neg: GCounter;

  constructor(pos = new GCounter(), neg = new GCounter()) {
    this.pos = pos;
    this.neg = neg;
  }

  increment(replica: ActorId, delta = 1): void {
    this.pos.increment(replica, delta);
  }

  decrement(replica: ActorId, delta = 1): void {
    this.neg.increment(replica, delta);
  }

  value(): number {
    return this.pos.value() - this.neg.value();
  }

  merge(other: PNCounter): PNCounter {
    return new PNCounter(this.pos.merge(other.pos), this.neg.merge(other.neg));
  }
}

export class LWWRegister<T> {
  readonly value: T;
  readonly timestamp: number;
  readonly replica: ActorId;

  constructor(value: T, timestamp: number, replica: ActorId) {
    this.value = value;
    this.timestamp = timestamp;
    this.replica = replica;
  }

  write(newValue: T, timestamp: number, replica: ActorId): LWWRegister<T> {
    return this.merge(new LWWRegister(newValue, timestamp, replica));
  }

  merge(other: LWWRegister<T>): LWWRegister<T> {
    if (other.timestamp !== this.timestamp) {
      return other.timestamp > this.timestamp ? other : this;
    }
    return other.replica >= this.replica ? other : this;
  }
}

/**
 * Observed-Remove Set (Add-Wins OR-Set):
 * Khi replica A `add(x)` đồng thời với replica B `remove(x)` (B chưa thấy tag mới của A),
 * sau khi `merge` phần tử `x` vẫn tồn tại (Add-Wins), không bị mất oan.
 */
export class ORSet<T extends string | number> {
  private readonly adds: Map<T, Set<string>>;
  private readonly tombstones: Set<string>;
  private localSeq = 0;

  constructor(adds?: Map<T, Set<string>>, tombstones?: Set<string>, seq = 0) {
    this.adds = new Map();
    if (adds) {
      for (const [k, s] of adds.entries()) this.adds.set(k, new Set(s));
    }
    this.tombstones = new Set(tombstones ?? []);
    this.localSeq = seq;
  }

  add(replica: ActorId, item: T): string {
    const tag = `${replica}:${++this.localSeq}`;
    let set = this.adds.get(item);
    if (!set) {
      set = new Set();
      this.adds.set(item, set);
    }
    set.add(tag);
    return tag;
  }

  remove(item: T): void {
    const set = this.adds.get(item);
    if (!set) return;
    for (const tag of set) {
      this.tombstones.add(tag);
    }
  }

  has(item: T): boolean {
    const set = this.adds.get(item);
    if (!set) return false;
    for (const tag of set) {
      if (!this.tombstones.has(tag)) return true;
    }
    return false;
  }

  values(): T[] {
    const out: T[] = [];
    for (const item of this.adds.keys()) {
      if (this.has(item)) out.push(item);
    }
    return out.sort();
  }

  merge(other: ORSet<T>): ORSet<T> {
    const mergedAdds = new Map<T, Set<string>>();
    for (const [k, s] of this.adds.entries()) mergedAdds.set(k, new Set(s));
    for (const [k, s] of other.adds.entries()) {
      const dst = mergedAdds.get(k) ?? new Set<string>();
      for (const tag of s) dst.add(tag);
      mergedAdds.set(k, dst);
    }
    const mergedTombs = new Set<string>([...this.tombstones, ...other.tombstones]);
    return new ORSet<T>(mergedAdds, mergedTombs, Math.max(this.localSeq, other.localSeq));
  }
}
