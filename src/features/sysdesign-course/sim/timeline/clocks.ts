/**
 * Đồng hồ vật lý lệch (clock skew), Lamport timestamp và Vector Clock (S3-06, 04 §12).
 * Thuần TypeScript.
 */
import type { ActorId, TimelineRun } from './types';
import { DiscreteEventWorld } from './engine';

export class LamportClock {
  private counter = 0;

  get value(): number {
    return this.counter;
  }

  tick(): number {
    this.counter += 1;
    return this.counter;
  }

  send(): number {
    return this.tick();
  }

  receive(remoteTs: number): number {
    this.counter = Math.max(this.counter, remoteTs) + 1;
    return this.counter;
  }
}

export type VectorTimestamp = Record<ActorId, number>;

export class VectorClock {
  private readonly vec: VectorTimestamp = {};

  constructor(actors: readonly ActorId[]) {
    for (const a of actors) this.vec[a] = 0;
  }

  snapshot(): VectorTimestamp {
    return { ...this.vec };
  }

  tick(actor: ActorId): VectorTimestamp {
    this.vec[actor] = (this.vec[actor] ?? 0) + 1;
    return this.snapshot();
  }

  send(actor: ActorId): VectorTimestamp {
    return this.tick(actor);
  }

  receive(actor: ActorId, remote: VectorTimestamp): VectorTimestamp {
    const keys = new Set([...Object.keys(this.vec), ...Object.keys(remote)]);
    for (const k of keys) {
      this.vec[k] = Math.max(this.vec[k] ?? 0, remote[k] ?? 0);
    }
    this.vec[actor] = (this.vec[actor] ?? 0) + 1;
    return this.snapshot();
  }
}

export type CausalOrder = 'before' | 'after' | 'concurrent' | 'equal';

export function compareVectorClocks(a: VectorTimestamp, b: VectorTimestamp): CausalOrder {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLess = false;
  let bLess = false;
  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    if (va < vb) aLess = true;
    else if (vb < va) bLess = true;
  }
  if (!aLess && !bLess) return 'equal';
  if (aLess && !bLess) return 'before';
  if (bLess && !aLess) return 'after';
  return 'concurrent';
}

export interface ClockSkewLwwConfig {
  /** Độ lệch đồng hồ của replica 1 (ms), ví dụ +120 ms chạy nhanh hơn giờ chuẩn */
  node1SkewMs: number;
  /** Độ lệch đồng hồ của replica 2 (ms), ví dụ -80 ms chạy chậm hơn giờ chuẩn */
  node2SkewMs: number;
  /** Bật đồng hồ logic / HLC để bảo toàn quan hệ nhân quả thay vì LWW vật lý thuần */
  useLogicalTieBreak?: boolean;
  seed?: number;
}

/**
 * Mô phỏng lỗi mất cập nhật mới do Last-Write-Wins dựa trên wall-clock bị lệch (NTP skew):
 * - Tại t=20ms: Client C1 ghi `x = "v1"` qua node1 (đồng hồ nhanh +120ms ⇒ ts = 140).
 * - Tại t=80ms: Client C2 đọc thấy `"v1"`, sau đó ghi `x = "v2"` qua node2 (đồng hồ chậm -80ms ⇒ ts = 0).
 * - Khi đồng bộ LWW vật lý thuần: `"v1"` (ts=140) đè ngược `"v2"` (ts=0) ⇒ C2 đọc lại thấy `"v1"` (stale/lost write)!
 */
export function simulateClockSkewLww(cfg: ClockSkewLwwConfig): TimelineRun & { finalValue: string } {
  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 7,
    actors: ['C1', 'C2', 'N1', 'N2'],
    defaultDelayMs: 10,
    jitterMs: 0,
  });
  world.setClockSkew('N1', cfg.node1SkewMs);
  world.setClockSkew('N2', cfg.node2SkewMs);

  const lamport1 = new LamportClock();
  const lamport2 = new LamportClock();

  interface Entry {
    value: string;
    wallTs: number;
    logicalTs: number;
  }
  const store: Record<'N1' | 'N2', Entry | null> = { N1: null, N2: null };

  const mergeEntry = (cur: Entry | null, inc: Entry): Entry => {
    if (!cur) return inc;
    if (cfg.useLogicalTieBreak) {
      if (inc.logicalTs !== cur.logicalTs) return inc.logicalTs > cur.logicalTs ? inc : cur;
    }
    return inc.wallTs >= cur.wallTs ? inc : cur;
  };

  // t=20: C1 writes v1 to N1
  world.scheduleAt(20, () => {
    const start = world.nowMs;
    world.sendMessage('C1', 'N1', 'write', 'PUT x="v1"', () => {
      const lts = lamport1.tick();
      const entry: Entry = { value: 'v1', wallTs: world.physicalClock('N1'), logicalTs: lts };
      store.N1 = mergeEntry(store.N1, entry);
      world.sendMessage('N1', 'N2', 'repl', `REPL v1 (ts=${entry.wallTs})`, () => {
        lamport2.receive(lts);
        store.N2 = mergeEntry(store.N2, entry);
      });
      world.sendMessage('N1', 'C1', 'ack', 'OK v1', () => {
        world.recordOp({ id: 'w1', client: 'C1', op: 'write', key: 'x', value: 'v1', start, end: world.nowMs, ok: true });
      });
    });
  });

  // t=80: C2 writes v2 to N2 (causally after w1 finished at t=40)
  world.scheduleAt(80, () => {
    const start = world.nowMs;
    world.sendMessage('C2', 'N2', 'write', 'PUT x="v2"', () => {
      const lts = lamport2.tick();
      const entry: Entry = { value: 'v2', wallTs: world.physicalClock('N2'), logicalTs: lts };
      store.N2 = mergeEntry(store.N2, entry);
      world.sendMessage('N2', 'N1', 'repl', `REPL v2 (ts=${entry.wallTs})`, () => {
        lamport1.receive(lts);
        store.N1 = mergeEntry(store.N1, entry);
      });
      world.sendMessage('N2', 'C2', 'ack', 'OK v2', () => {
        world.recordOp({ id: 'w2', client: 'C2', op: 'write', key: 'x', value: 'v2', start, end: world.nowMs, ok: true });
      });
    });
  });

  // t=150: C2 reads x from N1
  world.scheduleAt(150, () => {
    const start = world.nowMs;
    world.sendMessage('C2', 'N1', 'read', 'GET x', () => {
      const val = store.N1?.value ?? null;
      world.sendMessage('N1', 'C2', 'resp', `x=${String(val)}`, () => {
        world.recordOp({ id: 'r1', client: 'C2', op: 'read', key: 'x', value: val, start, end: world.nowMs, ok: true });
      });
    });
  });

  const run = world.run(300);
  return { ...run, finalValue: store.N1?.value ?? '' };
}
