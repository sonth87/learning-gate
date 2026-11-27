/**
 * Mô phỏng Replication, Quorum (N, W, R), CAP (CP vs AP) và Read-Your-Writes (S2-08, S3-01, S3-02, S3-05).
 * Thuần TypeScript.
 */
import type { ActorId, TimelineRun } from './types';
import { DiscreteEventWorld } from './engine';

export interface QuorumOpSpec {
  id: string;
  atMs: number;
  client: ActorId;
  op: 'write' | 'read';
  key: string;
  value?: string | number;
  /** Nếu chỉ định thì coordinator gửi ưu tiên tới danh sách replica này trước */
  preferReplicas?: ActorId[];
}

export interface QuorumPartitionSpec {
  atMs: number;
  healAtMs?: number;
  isolatedReplicas: ActorId[];
}

export interface QuorumConfig {
  replicas: number;
  w: number;
  r: number;
  mode?: 'CP' | 'AP';
  /** Độ trễ mạng bổ sung tới từng replica (ví dụ replica 3 ở xa / lag cao) */
  replicaDelaysMs?: Record<ActorId, number>;
  /** Sticky read-after-write: client đọc phiên bản >= phiên bản mình vừa ghi (hoặc đọc từ primary/node vừa ghi) */
  stickyReadAfterWrite?: boolean;
  readRepair?: boolean;
  partitions?: QuorumPartitionSpec[];
  ops: QuorumOpSpec[];
  seed?: number;
}

interface VersionedValue {
  version: number;
  value: string | number | null;
}

export function simulateQuorumScenario(cfg: QuorumConfig): TimelineRun {
  const N = Math.max(1, cfg.replicas);
  const W = Math.max(1, Math.min(N, cfg.w));
  const R = Math.max(1, Math.min(N, cfg.r));
  const mode = cfg.mode ?? 'CP';

  const replicaIds = Array.from({ length: N }, (_, i) => `R${i + 1}`);
  const clientIds = Array.from(new Set(cfg.ops.map((o) => o.client)));
  const coord = 'Coord';

  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 101,
    actors: [...clientIds, coord, ...replicaIds],
    defaultDelayMs: 8,
    jitterMs: 0,
  });

  const replicaStore = new Map<ActorId, Map<string, VersionedValue>>();
  for (const rid of replicaIds) replicaStore.set(rid, new Map());

  const clientLastWriteVer = new Map<string, { version: number; value: string | number; replica: ActorId }>();
  let globalVer = 0;

  for (const p of cfg.partitions ?? []) {
    world.scheduleAt(p.atMs, () => {
      for (const iso of p.isolatedReplicas) {
        world.partition(coord, iso, true);
      }
    });
    if (p.healAtMs !== undefined) {
      world.scheduleAt(p.healAtMs, () => {
        for (const iso of p.isolatedReplicas) {
          world.heal(coord, iso, true);
        }
      });
    }
  }

  for (const spec of cfg.ops) {
    world.scheduleAt(spec.atMs, () => {
      const start = world.nowMs;
      if (spec.op === 'write') {
        const val = spec.value ?? '';
        world.sendMessage(spec.client, coord, 'write', `WRITE ${spec.key}=${String(val)}`, () => {
          const ver = ++globalVer;
          let acks = 0;
          let done = false;
          const targets = spec.preferReplicas
            ? [...spec.preferReplicas, ...replicaIds.filter((x) => !spec.preferReplicas!.includes(x))]
            : replicaIds;

          const finishWrite = (ok: boolean, ackedReplica: ActorId) => {
            if (done) return;
            done = true;
            if (ok) {
              clientLastWriteVer.set(`${spec.client}:${spec.key}`, {
                version: ver,
                value: val,
                replica: ackedReplica,
              });
            }
            world.sendMessage(coord, spec.client, 'write-ack', ok ? `OK (v${ver})` : 'ERR_QUORUM', () => {
              world.recordOp({
                id: spec.id,
                client: spec.client,
                op: 'write',
                key: spec.key,
                value: ok ? val : null,
                start,
                end: world.nowMs,
                ok,
                meta: { version: ver, w: W, mode },
              });
            });
          };

          for (const rid of targets) {
            const replDelay = cfg.replicaDelaysMs?.[rid];
            world.sendMessage(
              coord,
              rid,
              'repl-write',
              `PUT ${spec.key}=v${ver}`,
              () => {
                const st = replicaStore.get(rid)!;
                const cur = st.get(spec.key);
                if (!cur || ver >= cur.version) {
                  st.set(spec.key, { version: ver, value: val });
                }
                world.sendMessage(rid, coord, 'repl-ack', `ACK v${ver}`, () => {
                  acks += 1;
                  const need = mode === 'AP' ? 1 : W;
                  if (acks >= need) finishWrite(true, rid);
                });
              },
              replDelay
            );
          }

          // Timeout kiểm quorum sau 120ms
          world.scheduleAfter(120, () => {
            if (!done) finishWrite(false, targets[0] ?? 'R1');
          });
        });
      } else {
        world.sendMessage(spec.client, coord, 'read', `READ ${spec.key}`, () => {
          const sticky = cfg.stickyReadAfterWrite
            ? clientLastWriteVer.get(`${spec.client}:${spec.key}`)
            : undefined;
          const baseTargets = spec.preferReplicas
            ? [...spec.preferReplicas, ...replicaIds.filter((x) => !spec.preferReplicas!.includes(x))]
            : replicaIds;
          const ordered = sticky
            ? [sticky.replica, ...baseTargets.filter((x) => x !== sticky.replica)]
            : baseTargets;
          const contacted = mode === 'AP' ? ordered : ordered.slice(0, R);

          let replies = 0;
          let done = false;
          const seen: { rid: ActorId; entry: VersionedValue }[] = [];

          const finishRead = (ok: boolean) => {
            if (done) return;
            done = true;
            let best: VersionedValue = { version: 0, value: null };
            for (const s of seen) {
              if (s.entry.version > best.version) best = s.entry;
            }
            if (sticky && best.version < sticky.version && ok) {
              best = { version: sticky.version, value: sticky.value };
            }
            if (ok && cfg.readRepair && best.version > 0) {
              for (const s of seen) {
                if (s.entry.version < best.version) {
                  world.sendMessage(coord, s.rid, 'read-repair', `REPAIR v${best.version}`, () => {
                    replicaStore.get(s.rid)!.set(spec.key, { ...best });
                  });
                }
              }
            }
            world.sendMessage(coord, spec.client, 'read-resp', ok ? `VAL=${String(best.value)}` : 'ERR_QUORUM', () => {
              world.recordOp({
                id: spec.id,
                client: spec.client,
                op: 'read',
                key: spec.key,
                value: ok ? best.value : null,
                start,
                end: world.nowMs,
                ok,
                meta: { version: best.version, r: R, mode },
              });
            });
          };

          for (const rid of contacted) {
            world.sendMessage(coord, rid, 'replica-read', `GET ${spec.key}`, () => {
              const entry = replicaStore.get(rid)!.get(spec.key) ?? { version: 0, value: null };
              world.sendMessage(rid, coord, 'replica-resp', `v${entry.version}:${String(entry.value)}`, () => {
                seen.push({ rid, entry });
                replies += 1;
                const need = mode === 'AP' ? 1 : R;
                if (replies >= need) finishRead(true);
              });
            });
          }

          world.scheduleAfter(120, () => {
            if (!done) finishRead(mode === 'AP' && seen.length > 0);
          });
        });
      }
    });
  }

  return world.run(5_000);
}
