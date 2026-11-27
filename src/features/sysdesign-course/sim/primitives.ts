/** Catalogue primitive (04 §1.1): `makeNode(kind, overrides)` dựng NodeSpec với knob/mặc định chuẩn. */
import type { FailureMode, Knob, NodeSpec, PrimitiveKind } from './model';

const bi = (vi: string, en: string) => ({ vi, en });

function numKnob(key: string, vi: string, en: string, def: number, min: number, max: number, step: number, extra: Partial<Knob> = {}): Knob {
  return { key, type: 'number', label: bi(vi, en), min, max, step, default: def, ...extra };
}

interface KindDefaults {
  stateful: boolean;
  scaling: NodeSpec['scaling'];
  opsPerSec: number;
  baseMs: number;
  cv: number;
  costPerHour: number;
  params: Record<string, number | string | boolean>;
  knobs: Knob[];
  failureModes: FailureMode[];
}

const crash = (vi: string, en: string): FailureMode => ({ kind: 'crash', note: bi(vi, en) });

const REPLICAS_KNOB = numKnob('replicas', 'Số instance', 'Instances', 1, 1, 12, 1, { changeCost: 1 });
const SIZE_KNOB = numKnob('sizeFactor', 'Cỡ máy (scale-up)', 'Instance size (scale-up)', 1, 1, 4, 1, { changeCost: 1 });

export const KIND_DEFAULTS: Record<PrimitiveKind, KindDefaults> = {
  client: {
    stateful: false, scaling: 'horizontal', opsPerSec: 1_000_000, baseMs: 0, cv: 0.3, costPerHour: 0,
    params: {}, knobs: [], failureModes: [],
  },
  dns: {
    stateful: false, scaling: 'horizontal', opsPerSec: 100_000, baseMs: 0.2, cv: 0.2, costPerHour: 0.02,
    params: { ttlSec: 60 }, knobs: [numKnob('ttlSec', 'TTL bản ghi DNS', 'DNS record TTL', 60, 1, 86400, 1, { unit: 's' })],
    failureModes: [crash('DNS chết: client giữ bản ghi cũ tới hết TTL', 'DNS down: clients keep stale records until TTL')],
  },
  cdn: {
    stateful: true, scaling: 'horizontal', opsPerSec: 200_000, baseMs: 1, cv: 0.3, costPerHour: 0.1,
    params: { ttlSec: 300, ttlJitterPct: 0, hitRatioMax: 0.95, workingSetKeys: 100000, capacityKeys: 100000, warmupSec: 30, singleflight: false },
    knobs: [], failureModes: [{ kind: 'data-loss', note: bi('Mất cache edge: miss dồn về origin', 'Edge cache loss: misses hit origin') }],
  },
  lb: {
    stateful: false, scaling: 'horizontal', opsPerSec: 20_000, baseMs: 0.3, cv: 0.2, costPerHour: 0.025,
    params: { algorithm: 'round-robin', healthCheckSec: 3 },
    knobs: [{
      key: 'algorithm', type: 'select', label: bi('Thuật toán chia tải', 'Algorithm'), default: 'round-robin',
      options: ['round-robin', 'least-conn', 'weighted', 'random', 'ip-hash'].map((v) => ({ value: v, label: bi(v, v) })),
    }],
    failureModes: [crash('LB chết: mọi request lỗi', 'LB down: all requests fail')],
  },
  gateway: {
    stateful: false, scaling: 'horizontal', opsPerSec: 5_000, baseMs: 3, cv: 0.3, costPerHour: 0.08,
    params: {}, knobs: [REPLICAS_KNOB], failureModes: [crash('Gateway chết', 'Gateway down')],
  },
  service: {
    stateful: false, scaling: 'horizontal', opsPerSec: 1_800, baseMs: 12, cv: 0.3, costPerHour: 0.1,
    params: {}, knobs: [REPLICAS_KNOB], failureModes: [crash('Instance chết', 'Instance down')],
  },
  cache: {
    stateful: true, scaling: 'horizontal', opsPerSec: 40_000, baseMs: 0.5, cv: 0.3, costPerHour: 0.15,
    params: { ttlSec: 300, ttlJitterPct: 0, hitRatioMax: 0.9, workingSetKeys: 100000, capacityKeys: 100000, warmupSec: 30, singleflight: false },
    knobs: [
      numKnob('ttlSec', 'TTL', 'TTL', 300, 5, 3600, 5, { unit: 's' }),
      numKnob('capacityKeys', 'Dung lượng cache (số key)', 'Cache capacity (keys)', 100000, 10000, 1000000, 5000, { changeCost: 1 }),
      numKnob('ttlJitterPct', 'Jitter TTL', 'TTL jitter', 0, 0, 0.5, 0.05),
      { key: 'singleflight', type: 'bool', label: bi('Singleflight', 'Singleflight'), default: false },
    ],
    failureModes: [{ kind: 'data-loss', note: bi('Mất cache: miss dồn về DB', 'Cache loss: misses hit the DB') }],
  },
  sql: {
    stateful: true, scaling: 'vertical', opsPerSec: 1_600, baseMs: 4, cv: 0.3, costPerHour: 0.8,
    params: { shards: 1, applyRps: 1000, rewriteHotness: 0.02, maxConnections: 500 },
    knobs: [SIZE_KNOB, numKnob('poolSize', 'Connection pool', 'Connection pool', 7, 2, 64, 1)],
    failureModes: [{ kind: 'slow', note: bi('Query chậm làm thông lượng giảm', 'Slow queries cut throughput') }],
  },
  nosql: {
    stateful: true, scaling: 'partitioned', opsPerSec: 8_000, baseMs: 3, cv: 0.3, costPerHour: 0.5,
    params: { shards: 3, applyRps: 4000, rewriteHotness: 0.02, maxConnections: 2000 },
    knobs: [numKnob('shards', 'Số shard', 'Shards', 3, 1, 32, 1, { changeCost: 1 })],
    failureModes: [{ kind: 'slow', note: bi('Shard nóng làm cả node chậm', 'Hot shard slows the node') }],
  },
  queue: {
    stateful: true, scaling: 'horizontal', opsPerSec: 50_000, baseMs: 1, cv: 0.3, costPerHour: 0.12,
    params: { maxDepth: 100000, dlq: false, visibilitySec: 30 },
    knobs: [{ key: 'dlq', type: 'bool', label: bi('Dead-letter queue', 'Dead-letter queue'), default: false }],
    failureModes: [{ kind: 'data-loss', note: bi('Mất message', 'Message loss') }],
  },
  log: {
    stateful: true, scaling: 'partitioned', opsPerSec: 100_000, baseMs: 1, cv: 0.3, costPerHour: 0.3,
    params: {}, knobs: [], failureModes: [crash('Broker chết', 'Broker down')],
  },
  worker: {
    stateful: false, scaling: 'horizontal', opsPerSec: 500, baseMs: 20, cv: 0.3, costPerHour: 0.1,
    params: {}, knobs: [REPLICAS_KNOB], failureModes: [crash('Worker chết', 'Worker down')],
  },
  blob: {
    stateful: true, scaling: 'horizontal', opsPerSec: 5_000, baseMs: 20, cv: 0.4, costPerHour: 0.05,
    params: {}, knobs: [], failureModes: [],
  },
  search: {
    stateful: true, scaling: 'partitioned', opsPerSec: 2_000, baseMs: 15, cv: 0.4, costPerHour: 0.4,
    params: {}, knobs: [REPLICAS_KNOB], failureModes: [],
  },
  'rate-limiter': {
    stateful: false, scaling: 'horizontal', opsPerSec: 100_000, baseMs: 0.2, cv: 0.2, costPerHour: 0.02,
    params: { ratePerSec: 1000, burst: 100 },
    knobs: [
      numKnob('ratePerSec', 'Tốc độ nạp token', 'Token rate', 1000, 1, 1_000_000, 1, { unit: 'rps' }),
      numKnob('burst', 'Burst', 'Burst', 100, 1, 1_000_000, 1),
    ],
    failureModes: [],
  },
  coordinator: {
    stateful: true, scaling: 'horizontal', opsPerSec: 2_000, baseMs: 5, cv: 0.3, costPerHour: 0.2,
    params: {}, knobs: [], failureModes: [crash('Coordinator chết', 'Coordinator down')],
  },
};

export interface NodeOverrides extends Partial<Omit<NodeSpec, 'capacity' | 'latency' | 'params'>> {
  capacity?: Partial<NodeSpec['capacity']>;
  latency?: Partial<NodeSpec['latency']>;
  params?: NodeSpec['params'];
  /** viết tắt */
  opsPerSec?: number;
  baseMs?: number;
  cv?: number;
}

/** Dựng NodeSpec với mặc định theo kind. `id` bắt buộc (qua overrides.id). */
export function makeNode(kind: PrimitiveKind, overrides: NodeOverrides & { id: string }): NodeSpec {
  const d = KIND_DEFAULTS[kind];
  const { capacity, latency, params, opsPerSec, baseMs, cv, ...rest } = overrides;
  const ops = opsPerSec ?? capacity?.opsPerSec ?? d.opsPerSec;
  const base = baseMs ?? latency?.baseMs ?? d.baseMs;
  return {
    kind,
    label: { vi: overrides.id, en: overrides.id },
    stateful: d.stateful,
    scaling: d.scaling,
    replicas: 1,
    costPerHour: d.costPerHour,
    knobs: d.knobs,
    failureModes: d.failureModes,
    ...rest,
    capacity: { opsPerSec: ops, ...(capacity?.concurrency !== undefined ? { concurrency: capacity.concurrency } : {}) },
    latency: { baseMs: base, cv: cv ?? latency?.cv ?? d.cv },
    params: { ...d.params, ...(params ?? {}) },
  };
}
