/**
 * Recorder (04 §5.2): ring buffer dạng cột cho đồ thị, checkpoint mỗi K giây, inputLog, và khôi phục
 * trạng thái tại tick bất kỳ (scrub) bằng "checkpoint gần nhất + chạy lại".
 *
 * Quy ước thời gian: frame k = kết quả chạy tick k (t = k·DT); trạng thái `state.tick = k + 1` sau khi chạy.
 * Một đầu vào ghi ở tick j có hiệu lực từ lần chạy tick j (đã áp trước khi chạy tick j).
 * Thuần TS: không React/DOM/Math.random/Date.
 */
import { applyInput, initialInputs } from './events';
import { DT, type CompiledModel, type TimedEvent } from './model';
import type { InputRecord, NodeState, SimFrame, SimInputs, SimState } from './types';

/** Mã số của NodeState trong ring (khớp thứ tự khai báo 0..6). */
export const NODE_STATE_CODE: Record<NodeState, number> = {
  idle: 0, healthy: 1, busy: 2, saturated: 3, overloaded: 4, down: 5, recovering: 6,
};
export const NODE_STATE_BY_CODE: NodeState[] = ['idle', 'healthy', 'busy', 'saturated', 'overloaded', 'down', 'recovering'];

export const GLOBAL_KEYS = ['t', 'offered', 'goodput', 'errorRate', 'p50', 'p95', 'p99', 'cost', 'retryRps'] as const;
export const NODE_FIELDS = ['rho', 'queue', 'state', 'lambda'] as const;
export const LINK_FIELDS = ['rps', 'errorRate'] as const;
export type GlobalKey = typeof GLOBAL_KEYS[number];
export type NodeField = typeof NODE_FIELDS[number];
export type LinkField = typeof LINK_FIELDS[number];

export const nodeKey = (id: string, f: NodeField): string => `node:${id}:${f}`;
export const linkKey = (id: string, f: LinkField): string => `link:${id}:${f}`;

export interface Checkpoint {
  /** trạng thái TRƯỚC khi chạy tick này (= state.tick) */
  tick: number;
  state: SimState;
  inputs: SimInputs;
  /** số bản ghi inputLog đã áp (các bản ghi có tick < `tick`) */
  logPtr: number;
}

export interface RecorderMarker {
  tick: number;
  t: number;
  type: SimFrame['firedEvents'][number]['type'];
  node?: string;
  link?: string;
  source: 'scenario' | 'learner';
}

export interface RestoreResult {
  state: SimState;
  inputs: SimInputs;
  logPtr: number;
  frame: SimFrame;
}

export interface Recorder {
  readonly capacity: number;
  /** số frame đã ghi: các tick [0, length) (có thể > capacity; ring chỉ giữ `capacity` frame cuối) */
  readonly length: number;
  /** tick cũ nhất còn trong ring */
  readonly firstTick: number;
  /** tick cũ nhất có thể scrub tới (checkpoint cũ nhất còn giữ) */
  readonly earliestTick: number;
  readonly checkpointEveryTicks: number;
  readonly maxCheckpoints: number;
  readonly keys: readonly string[];
  readonly checkpoints: readonly Checkpoint[];
  readonly markers: readonly RecorderMarker[];
  /** nhật ký đầu vào, sắp xếp tăng dần theo tick */
  readonly log: readonly InputRecord[];
  /** ghi frame vừa chạy: tick == length ⇒ nối thêm; tick < length ⇒ ghi đè (chạy lại ở quá khứ) */
  push(frame: SimFrame): void;
  /** chuỗi theo thứ tự thời gian; không cuộn vòng ⇒ view của cột, đã cuộn ⇒ bản sao tuyến tính */
  series(key: string): Float32Array;
  valueAt(key: string, tick: number): number;
  /** lưu checkpoint nếu `state.tick` chia hết chu kỳ và chưa có (gọi sau mỗi tick) */
  checkpointIfDue(state: SimState, inputs: SimInputs, logPtr: number, force?: boolean): void;
  /** thêm bản ghi đầu vào (tick = tick hiện tại của người gọi) */
  append(rec: InputRecord): void;
  /**
   * Ghi đè tương lai (04 §5.2): giữ các frame tick < `headTick`; cắt inputLog (tick ≥ headTick),
   * checkpoint (tick > headTick), marker và độ dài ring.
   */
  truncate(headTick: number): void;
  /** Khôi phục trạng thái ngay sau khi chạy tick k (checkpoint gần nhất ≤ k rồi chạy lại). */
  restoreAt(k: number): RestoreResult;
  clear(): void;
}

export type StepFn = (c: CompiledModel, s: SimState, inputs: SimInputs, ev: readonly TimedEvent[]) => SimFrame;

/** Áp các bản ghi có tick ≤ `tick` kể từ chỉ số `ptr`; gom sự kiện chaos vào `events`. Trả chỉ số mới. */
export function flushInputs(
  log: readonly InputRecord[], ptr: number, tick: number, inputs: SimInputs, events: TimedEvent[],
): number {
  while (ptr < log.length && log[ptr].tick <= tick) {
    const ev = applyInput(inputs, log[ptr]);
    if (ev) events.push(ev);
    ptr++;
  }
  return ptr;
}

export function createRecorder(
  c: CompiledModel, step: StepFn, createInitialState: (c: CompiledModel) => SimState,
): Recorder {
  const capacity = Math.max(1, Math.floor(c.options.ringCapacityTicks));
  const every = Math.max(1, Math.round(c.options.checkpointEverySec / DT));
  const maxCp = Math.ceil(capacity / every) + 1;

  const keys: string[] = [...GLOBAL_KEYS];
  for (const n of c.nodes) for (const f of NODE_FIELDS) keys.push(nodeKey(n.id, f));
  for (const l of c.links) for (const f of LINK_FIELDS) keys.push(linkKey(l.id, f));
  const cols: Record<string, Float32Array> = {};
  for (const k of keys) cols[k] = new Float32Array(capacity);

  let length = 0;
  let checkpoints: Checkpoint[] = [];
  let markers: RecorderMarker[] = [];
  let log: InputRecord[] = [];

  function firstTick(): number { return Math.max(0, length - capacity); }

  function trimCheckpoints(): void {
    const ft = firstTick();
    let drop = 0;
    while (drop < checkpoints.length - 1 && checkpoints[drop].tick < ft) drop++;
    while (checkpoints.length - drop > maxCp) drop++;
    if (drop > 0) checkpoints = checkpoints.slice(drop);
  }

  function initialCheckpoint(): void {
    checkpoints = [{ tick: 0, state: structuredClone(createInitialState(c)), inputs: initialInputs(), logPtr: 0 }];
  }
  initialCheckpoint();

  const rec: Recorder = {
    capacity,
    get length() { return length; },
    get firstTick() { return firstTick(); },
    get earliestTick() { return checkpoints.length > 0 ? checkpoints[0].tick : 0; },
    checkpointEveryTicks: every,
    maxCheckpoints: maxCp,
    keys,
    get checkpoints() { return checkpoints; },
    get markers() { return markers; },
    get log() { return log; },

    push(frame) {
      const k = frame.tick;
      if (k > length) throw new Error(`recorder.push: tick ${k} nhảy cóc (length=${length})`);
      const slot = k % capacity;
      const m = frame.metrics;
      cols.t[slot] = frame.t;
      cols.offered[slot] = m.offeredRps;
      cols.goodput[slot] = m.goodputRps;
      cols.errorRate[slot] = m.errorRate;
      cols.p50[slot] = m.latency.p50;
      cols.p95[slot] = m.latency.p95;
      cols.p99[slot] = m.latency.p99;
      cols.cost[slot] = m.costPerHour;
      cols.retryRps[slot] = m.retryRps;
      for (const n of c.nodes) {
        const nf = frame.nodes[n.id];
        cols[nodeKey(n.id, 'rho')][slot] = nf.rho;
        cols[nodeKey(n.id, 'queue')][slot] = nf.queue;
        cols[nodeKey(n.id, 'state')][slot] = NODE_STATE_CODE[nf.state];
        cols[nodeKey(n.id, 'lambda')][slot] = nf.lambda;
      }
      for (const l of c.links) {
        const lf = frame.links[l.id];
        cols[linkKey(l.id, 'rps')][slot] = lf.rps;
        cols[linkKey(l.id, 'errorRate')][slot] = lf.errorRate;
      }
      if (k === length) {
        for (const ev of frame.firedEvents) {
          markers.push({ tick: k, t: frame.t, type: ev.type, node: ev.node, link: ev.link, source: ev.source });
        }
        length = k + 1;
        trimCheckpoints();
      }
    },

    series(key) {
      const col = cols[key];
      if (!col) throw new Error(`recorder.series: khoá lạ '${key}'`);
      if (length <= capacity) return col.subarray(0, length);
      const out = new Float32Array(capacity);
      const start = length % capacity;
      out.set(col.subarray(start), 0);
      out.set(col.subarray(0, start), capacity - start);
      return out;
    },

    valueAt(key, tick) {
      const col = cols[key];
      if (!col) throw new Error(`recorder.valueAt: khoá lạ '${key}'`);
      if (tick < firstTick() || tick >= length) return NaN;
      return col[tick % capacity];
    },

    checkpointIfDue(state, inputs, logPtr, force = false) {
      const t = state.tick;
      const last = checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].tick : -1;
      if (t <= last) return;
      if (!force && t % every !== 0) return;
      checkpoints.push({ tick: t, state: structuredClone(state), inputs: structuredClone(inputs), logPtr });
      trimCheckpoints();
    },

    append(r) {
      if (log.length > 0 && log[log.length - 1].tick > r.tick) {
        throw new Error('recorder.append: inputLog phải tăng dần theo tick');
      }
      log.push(r);
    },

    truncate(headTick) {
      if (headTick < length) length = headTick;
      let n = log.length;
      while (n > 0 && log[n - 1].tick >= headTick) n--;
      if (n < log.length) log = log.slice(0, n);
      checkpoints = checkpoints.filter((cp) => cp.tick <= headTick);
      markers = markers.filter((m) => m.tick < headTick);
    },

    restoreAt(k) {
      let cp = checkpoints[0];
      for (let i = checkpoints.length - 1; i >= 0; i--) {
        if (checkpoints[i].tick <= k) { cp = checkpoints[i]; break; }
      }
      const state = structuredClone(cp.state);
      const inputs = structuredClone(cp.inputs);
      let ptr = cp.logPtr;
      let frame: SimFrame | null = null;
      while (state.tick <= k) {
        const ev: TimedEvent[] = [];
        ptr = flushInputs(log, ptr, state.tick, inputs, ev);
        frame = step(c, state, inputs, ev);
      }
      if (!frame) throw new Error(`recorder.restoreAt: k=${k} nhỏ hơn checkpoint cũ nhất ${cp.tick}`);
      return { state, inputs, logPtr: ptr, frame };
    },

    clear() {
      length = 0;
      markers = [];
      log = [];
      for (const k of keys) cols[k].fill(0);
      initialCheckpoint();
    },
  };

  return rec;
}
