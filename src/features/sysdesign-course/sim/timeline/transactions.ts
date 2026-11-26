/**
 * Mô phỏng 2PC, Saga (compensation + idempotency key) và Concurrency Control (Lock / Optimistic CAS)
 * cho các bài S3-04, S3-07, S4-06, S7-06 (04 §12). Thuần TypeScript.
 */
import type { ActorId, TimelineRun } from './types';
import { DiscreteEventWorld } from './engine';

/* ───────────── 1. Two-Phase Commit (2PC) ───────────── */

export interface TwoPcConfig {
  participants?: ActorId[];
  /** Một participant bỏ phiếu NO ở pha Prepare */
  abortByParticipant?: ActorId;
  /** Coordinator sập ngay sau khi nhận đủ YES (trước khi gửi Commit) ⇒ khoá bị treo */
  crashCoordinatorBeforeCommit?: boolean;
  seed?: number;
}

export interface TwoPcRun extends TimelineRun {
  outcome: 'committed' | 'aborted' | 'blocked-in-doubt';
  lockedParticipants: ActorId[];
}

export function simulate2pcScenario(cfg: TwoPcConfig = {}): TwoPcRun {
  const parts = cfg.participants ?? ['OrderDB', 'PayDB'];
  const coord = 'Coord2PC';
  const client = 'Client';
  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 11,
    actors: [client, coord, ...parts],
    defaultDelayMs: 10,
    jitterMs: 0,
  });

  const locked = new Set<ActorId>();
  let outcome: TwoPcRun['outcome'] = 'aborted';

  world.scheduleAt(10, () => {
    const start = world.nowMs;
    world.sendMessage(client, coord, 'tx-begin', 'BEGIN 2PC', () => {
      let replies = 0;
      let allYes = true;

      for (const p of parts) {
        world.sendMessage(coord, p, 'prepare', 'PREPARE', () => {
          const voteYes = p !== cfg.abortByParticipant;
          if (voteYes) locked.add(p);
          world.sendMessage(p, coord, 'vote', voteYes ? 'VOTE_YES (holding lock)' : 'VOTE_NO', () => {
            replies += 1;
            if (!voteYes) allYes = false;
            if (replies < parts.length) return;

            if (allYes && cfg.crashCoordinatorBeforeCommit) {
              world.crash(coord, 'Coordinator sập sau PREPARE — participant kẹt trạng thái in-doubt!');
              outcome = 'blocked-in-doubt';
              world.recordOp({
                id: 'tx_2pc',
                client,
                op: 'write',
                key: 'order_pay',
                value: null,
                start,
                end: world.nowMs + 80,
                ok: false,
                meta: { blocked: true },
              });
              return;
            }

            const decision = allYes ? 'COMMIT' : 'ABORT';
            outcome = allYes ? 'committed' : 'aborted';
            let acks = 0;
            for (const p2 of parts) {
              world.sendMessage(coord, p2, decision.toLowerCase(), decision, () => {
                locked.delete(p2);
                world.sendMessage(p2, coord, 'ack', 'ACK', () => {
                  acks += 1;
                  if (acks === parts.length) {
                    world.sendMessage(coord, client, 'tx-done', decision, () => {
                      world.recordOp({
                        id: 'tx_2pc',
                        client,
                        op: 'write',
                        key: 'order_pay',
                        value: allYes ? 'committed' : null,
                        start,
                        end: world.nowMs,
                        ok: allYes,
                      });
                    });
                  }
                });
              });
            }
          });
        });
      }
    });
  });

  const run = world.run(300);
  return { ...run, outcome, lockedParticipants: [...locked] };
}

/* ───────────── 2. Saga + Compensation + Idempotency ───────────── */

export interface SagaConfig {
  /** Bước thứ mấy thất bại (ví dụ 'Inventory' thất bại sau khi 'Payment' đã trừ tiền) */
  failAtStep?: 'Payment' | 'Inventory' | 'Shipping';
  /** Gói ACK của Payment bị rớt làm Orchestrator retry bước trừ tiền */
  dropPaymentAckOnce?: boolean;
  /** Bật Idempotency Key tại Payment để chống trừ tiền hai lần khi retry */
  useIdempotencyKey?: boolean;
  seed?: number;
}

export interface SagaRun extends TimelineRun {
  finalState: 'completed' | 'compensated';
  netChargedAmount: number;
  chargeCount: number;
}

export function simulateSagaScenario(cfg: SagaConfig = {}): SagaRun {
  const steps: ActorId[] = ['Order', 'Payment', 'Inventory', 'Shipping'];
  const orch = 'SagaOrch';
  const client = 'Client';
  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 21,
    actors: [client, orch, ...steps],
    defaultDelayMs: 10,
    jitterMs: 0,
  });

  const seenIdemKeys = new Set<string>();
  let netCharged = 0;
  let chargeCount = 0;
  let finalState: SagaRun['finalState'] = 'completed';
  let droppedAck = false;
  const idemKey = 'idem_ord_9001';

  const compensate = (completedSteps: ActorId[], startMs: number) => {
    finalState = 'compensated';
    const rev = [...completedSteps].reverse();
    let idx = 0;
    const nextComp = () => {
      if (idx >= rev.length) {
        world.sendMessage(orch, client, 'saga-compensated', 'COMPENSATED', () => {
          world.recordOp({
            id: 'saga_tx',
            client,
            op: 'write',
            key: 'order:9001',
            value: 'cancelled_refunded',
            start: startMs,
            end: world.nowMs,
            ok: false,
            meta: { compensated: true, netCharged },
          });
        });
        return;
      }
      const st = rev[idx++];
      world.sendMessage(orch, st, 'compensate', `COMPENSATE ${st}`, () => {
        if (st === 'Payment') {
          netCharged -= 100;
          world.recordEffect('Payment', 'refund', `${idemKey}:refund`, -100);
        }
        world.milestone(st, 'COMPENSATED', `Hoàn tác ${st}`);
        world.sendMessage(st, orch, 'comp-ack', `OK_COMP_${st}`, nextComp);
      });
    };
    nextComp();
  };

  world.scheduleAt(10, () => {
    const start = world.nowMs;
    const completed: ActorId[] = [];
    let idx = 0;

    const runStep = () => {
      if (idx >= steps.length) {
        finalState = 'completed';
        world.sendMessage(orch, client, 'saga-ok', 'COMPLETED', () => {
          world.recordOp({
            id: 'saga_tx',
            client,
            op: 'write',
            key: 'order:9001',
            value: 'completed',
            start,
            end: world.nowMs,
            ok: true,
            meta: { netCharged },
          });
        });
        return;
      }
      const st = steps[idx];
      const execAttempt = (attempt: number) => {
        world.sendMessage(
          orch,
          st,
          'saga-step',
          `DO ${st}${attempt > 1 ? ` (retry #${attempt - 1})` : ''}`,
          () => {
            if (cfg.failAtStep === st) {
              world.milestone(st, 'STEP_FAIL', `${st} thất bại — kích hoạt bù trừ ngược`);
              world.sendMessage(st, orch, 'step-err', `ERR_${st}`, () => compensate(completed, start));
              return;
            }
            if (st === 'Payment') {
              if (cfg.useIdempotencyKey && seenIdemKeys.has(idemKey)) {
                world.milestone('Payment', 'IDEMPOTENT_HIT', `Bỏ qua trừ lặp nhờ key ${idemKey}`);
              } else {
                seenIdemKeys.add(idemKey);
                netCharged += 100;
                chargeCount += 1;
                world.recordEffect('Payment', 'charge', cfg.useIdempotencyKey ? idemKey : undefined, 100);
              }
              if (cfg.dropPaymentAckOnce && !droppedAck) {
                droppedAck = true;
                world.milestone('Payment', 'ACK_LOST', 'Mất gói ACK trả về Orchestrator');
                world.scheduleAfter(35, () => execAttempt(attempt + 1));
                return;
              }
            }
            world.sendMessage(st, orch, 'step-ok', `OK_${st}`, () => {
              completed.push(st);
              idx += 1;
              runStep();
            });
          }
        );
      };
      execAttempt(1);
    };

    world.sendMessage(client, orch, 'saga-start', 'START SAGA', runStep);
  });

  const run = world.run(500);
  return { ...run, finalState, netChargedAmount: netCharged, chargeCount };
}

/* ───────────── 3. Concurrency Control: Lost Update vs Optimistic CAS vs Row Lock ───────────── */

export interface ConcurrencyConfig {
  mechanism: 'none' | 'optimistic' | 'pessimistic';
  initialStock?: number;
  seed?: number;
}

export interface ConcurrencyRun extends TimelineRun {
  finalStock: number;
  conflictsDetected: number;
}

/**
 * Hai client C1 và C2 đồng thời mua 1 món cuối cùng từ `stock = initialStock` (mặc định 10, mỗi bên trừ 1):
 * - `none`: cả hai cùng đọc `10`, cùng ghi `9` ⇒ mất 1 lượt trừ (`finalStock = 9` thay vì `8`: Lost Update!).
 * - `optimistic` (CAS `WHERE version = v`): C2 bị từ chối ở v1, tự đọc lại `9` (v2) rồi ghi `8` ⇒ đúng `8`.
 * - `pessimistic` (`SELECT ... FOR UPDATE`): C2 xếp hàng đợi khoá hàng tới khi C1 commit `9`, rồi đọc `9` ghi `8` ⇒ đúng `8`.
 */
export function simulateConcurrencyControl(cfg: ConcurrencyConfig): ConcurrencyRun {
  const world = new DiscreteEventWorld({
    seed: cfg.seed ?? 33,
    actors: ['C1', 'C2', 'DB'],
    defaultDelayMs: 8,
    jitterMs: 0,
  });

  let stock = cfg.initialStock ?? 10;
  let version = 1;
  let conflicts = 0;
  let lockHolder: ActorId | null = null;
  const waitQueue: (() => void)[] = [];

  const runBuyer = (client: ActorId, idPrefix: string, startMs: number, computeDelayMs: number) => {
    const attemptTx = (tryNo: number) => {
      const acquireAndRun = () => {
        if (cfg.mechanism === 'pessimistic') {
          if (lockHolder && lockHolder !== client) {
            waitQueue.push(acquireAndRun);
            return;
          }
          lockHolder = client;
        }
        const rStart = world.nowMs;
        const readVal = stock;
        const readVer = version;
        world.recordOp({
          id: `${idPrefix}_r${tryNo}`,
          client,
          op: 'read',
          key: 'stock',
          value: readVal,
          start: rStart,
          end: rStart + 4,
          ok: true,
          meta: { version: readVer },
        });

        world.scheduleAfter(computeDelayMs, () => {
          const wStart = world.nowMs;
          const nextVal = readVal - 1;
          world.sendMessage(client, 'DB', 'update', `SET stock=${nextVal}`, () => {
            if (cfg.mechanism === 'optimistic' && version !== readVer) {
              conflicts += 1;
              world.milestone('DB', 'CAS_CONFLICT', `${client} lệch version (${readVer} != ${version}), thử lại`);
              world.recordOp({
                id: `${idPrefix}_w${tryNo}_conflict`,
                client,
                op: 'write',
                key: 'stock',
                value: null,
                start: wStart,
                end: world.nowMs,
                ok: false,
                meta: { expectedVersion: readVer, actualVersion: version },
              });
              world.scheduleAfter(6, () => attemptTx(tryNo + 1));
              return;
            }
            stock = nextVal;
            version += 1;
            if (cfg.mechanism === 'pessimistic') {
              lockHolder = null;
              const nxt = waitQueue.shift();
              if (nxt) world.scheduleAfter(2, nxt);
            }
            world.sendMessage('DB', client, 'commit-ok', `OK stock=${stock}`, () => {
              world.recordOp({
                id: `${idPrefix}_w${tryNo}`,
                client,
                op: 'write',
                key: 'stock',
                value: stock,
                start: wStart,
                end: world.nowMs,
                ok: true,
                meta: { version },
              });
            });
          });
        });
      };

      world.sendMessage(client, 'DB', 'select', cfg.mechanism === 'pessimistic' ? 'SELECT FOR UPDATE' : 'SELECT stock', acquireAndRun);
    };

    world.scheduleAt(startMs, () => attemptTx(1));
  };

  runBuyer('C1', 'c1', 10, 20);
  runBuyer('C2', 'c2', 12, 25);

  const run = world.run(300);
  return { ...run, finalStock: stock, conflictsDetected: conflicts };
}
