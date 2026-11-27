/**
 * Kiểm thử đơn vị cho `sim/timeline/` (T6.0b) và cờ `cancelOnTimeout` trên `LinkSpec` (T7.2).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GCounter,
  LamportClock,
  LWWRegister,
  ORSet,
  PNCounter,
  VectorClock,
  compareVectorClocks,
  createSim,
  findDoubleCharges,
  findLostUpdates,
  findNonMonotonicReads,
  findRywViolations,
  findStaleReads,
  makeNode,
  simulate2pcScenario,
  simulateClockSkewLww,
  simulateConcurrencyControl,
  simulateQuorumScenario,
  simulateRaftScenario,
  simulateSagaScenario,
  type SimScenario,
} from '../index';

test('Quorum W+R <= N sinh stale read và RYW violation; W+R > N hoặc sticky RYW triệt tiêu lỗi', () => {
  // N=3, W=1, R=1, R2 và R3 có lag mạng 150ms => đọc vào R2 tại t=50ms trả null/v1 cũ
  const weak = simulateQuorumScenario({
    replicas: 3,
    w: 1,
    r: 1,
    replicaDelaysMs: { R2: 150, R3: 150 },
    ops: [
      { id: 'w1', atMs: 10, client: 'C1', op: 'write', key: 'profile', value: 'v1', preferReplicas: ['R1'] },
      { id: 'r1', atMs: 50, client: 'C1', op: 'read', key: 'profile', preferReplicas: ['R2'] },
    ],
  });
  assert.deepEqual(findStaleReads(weak.history), ['r1']);
  assert.deepEqual(findRywViolations(weak.history), ['r1']);

  // N=3, W=2, R=2 (W + R = 4 > 3): đảm bảo giao nhau ít nhất 1 replica giữ bản mới nhất
  const strong = simulateQuorumScenario({
    replicas: 3,
    w: 2,
    r: 2,
    replicaDelaysMs: { R3: 180 },
    ops: [
      { id: 'w1', atMs: 10, client: 'C1', op: 'write', key: 'profile', value: 'v1' },
      { id: 'r1', atMs: 70, client: 'C2', op: 'read', key: 'profile', preferReplicas: ['R2', 'R3'] },
    ],
  });
  assert.deepEqual(findStaleReads(strong.history), []);

  // Sticky read-after-write bảo vệ chính C1 ngay cả khi W=1, R=1
  const sticky = simulateQuorumScenario({
    replicas: 3,
    w: 1,
    r: 1,
    stickyReadAfterWrite: true,
    replicaDelaysMs: { R2: 150, R3: 150 },
    ops: [
      { id: 'w1', atMs: 10, client: 'C1', op: 'write', key: 'profile', value: 'v1', preferReplicas: ['R1'] },
      { id: 'r1', atMs: 50, client: 'C1', op: 'read', key: 'profile', preferReplicas: ['R2'] },
    ],
  });
  assert.deepEqual(findRywViolations(sticky.history), []);
});

test('Monotonic reads checker bắt đúng trường hợp đọc lùi phiên bản', () => {
  const nonMono = findNonMonotonicReads([
    { id: 'w1', client: 'C1', op: 'write', key: 'k', value: 'v1', start: 0, end: 10, ok: true },
    { id: 'w2', client: 'C1', op: 'write', key: 'k', value: 'v2', start: 12, end: 20, ok: true },
    { id: 'r_new', client: 'C2', op: 'read', key: 'k', value: 'v2', start: 25, end: 30, ok: true },
    { id: 'r_back', client: 'C2', op: 'read', key: 'k', value: 'v1', start: 35, end: 40, ok: true },
  ]);
  assert.deepEqual(nonMono, ['r_back']);
});

test('Raft bầu leader, xử lý partition đa số, từ chối ghi phía thiểu số và chặn zombie bằng fencing token', () => {
  const raftWithFence = simulateRaftScenario({
    nodeCount: 3,
    partitionLeaderAtMs: 160,
    testFencingTokenAtMs: 420,
    useFencingToken: true,
  });

  const w1 = raftWithFence.history.find((h) => h.id === 'w1');
  const w2 = raftWithFence.history.find((h) => h.id === 'w2');
  const wIso = raftWithFence.history.find((h) => h.id === 'w_isolated');
  assert.equal(w1?.ok, true);
  assert.equal(w2?.ok, true);
  assert.equal(wIso?.ok, false, 'Leader cũ bị cô lập không thể đạt quorum');
  assert.equal(raftWithFence.zombieWriteRejected, true);
  assert.equal(raftWithFence.storageValue, 'v2');

  const raftNoFence = simulateRaftScenario({
    nodeCount: 3,
    partitionLeaderAtMs: 160,
    testFencingTokenAtMs: 420,
    useFencingToken: false,
  });
  assert.equal(raftNoFence.storageValue, 'corrupted_by_zombie');
});

test('2PC treo khoá khi coordinator sập; Saga bù trừ ngược và chống trừ tiền kép bằng idempotency key', () => {
  const blocked = simulate2pcScenario({ crashCoordinatorBeforeCommit: true });
  assert.equal(blocked.outcome, 'blocked-in-doubt');
  assert.equal(blocked.lockedParticipants.length, 2);

  const ok2pc = simulate2pcScenario({ crashCoordinatorBeforeCommit: false });
  assert.equal(ok2pc.outcome, 'committed');
  assert.equal(ok2pc.lockedParticipants.length, 0);

  // Saga thất bại ở Inventory => hoàn tiền Payment (netChargedAmount = 0)
  const compSaga = simulateSagaScenario({ failAtStep: 'Inventory', useIdempotencyKey: true });
  assert.equal(compSaga.finalState, 'compensated');
  assert.equal(compSaga.netChargedAmount, 0);

  // Mất ACK mà không có Idempotency Key => trừ tiền 2 lần (Double Charge)
  const doubleCharge = simulateSagaScenario({ dropPaymentAckOnce: true, useIdempotencyKey: false });
  assert.equal(doubleCharge.chargeCount, 2);
  assert.equal(doubleCharge.netChargedAmount, 200);
  assert.equal(findDoubleCharges(doubleCharge.effects).length, 1);

  // Bật Idempotency Key => chỉ trừ đúng 1 lần dù retry
  const safeRetry = simulateSagaScenario({ dropPaymentAckOnce: true, useIdempotencyKey: true });
  assert.equal(safeRetry.chargeCount, 1);
  assert.equal(safeRetry.netChargedAmount, 100);
  assert.equal(findDoubleCharges(safeRetry.effects).length, 0);
});

test('Concurrency control: none gây Lost Update; Optimistic CAS và Pessimistic Lock giữ tồn kho chính xác', () => {
  const unsafeRun = simulateConcurrencyControl({ mechanism: 'none', initialStock: 10 });
  assert.equal(unsafeRun.finalStock, 9);
  assert.equal(findLostUpdates(unsafeRun.history).length, 1);

  const casRun = simulateConcurrencyControl({ mechanism: 'optimistic', initialStock: 10 });
  assert.equal(casRun.finalStock, 8);
  assert.ok(casRun.conflictsDetected >= 1);
  assert.equal(findLostUpdates(casRun.history).length, 0);

  const lockRun = simulateConcurrencyControl({ mechanism: 'pessimistic', initialStock: 10 });
  assert.equal(lockRun.finalStock, 8);
  assert.equal(findLostUpdates(lockRun.history).length, 0);
});

test('Clocks & CRDT: Lamport, Vector Clock phát hiện concurrent, Clock Skew LWW và GCounter/ORSet hội tụ', () => {
  const vcA = new VectorClock(['A', 'B']);
  const vcB = new VectorClock(['A', 'B']);
  const a1 = vcA.tick('A');
  const b1 = vcB.tick('B');
  assert.equal(compareVectorClocks(a1, b1), 'concurrent');
  const a2 = vcA.receive('A', b1);
  assert.equal(compareVectorClocks(b1, a2), 'before');

  const lc = new LamportClock();
  assert.equal(lc.tick(), 1);
  assert.equal(lc.receive(10), 11);

  // Đồng hồ lệch làm LWW vật lý thuần mất bản ghi mới v2; bật logical tie-break giữ đúng v2
  const skewed = simulateClockSkewLww({ node1SkewMs: 120, node2SkewMs: -90, useLogicalTieBreak: false });
  assert.equal(skewed.finalValue, 'v1');
  assert.deepEqual(findRywViolations(skewed.history), ['r1']);

  const fixedLogical = simulateClockSkewLww({ node1SkewMs: 120, node2SkewMs: -90, useLogicalTieBreak: true });
  assert.equal(fixedLogical.finalValue, 'v2');
  assert.deepEqual(findRywViolations(fixedLogical.history), []);

  // CRDT ACI: giao hoán, kết hợp, luỹ đẳng
  const g1 = new GCounter();
  const g2 = new GCounter();
  g1.increment('R1', 3);
  g2.increment('R2', 5);
  assert.equal(g1.merge(g2).value(), 8);
  assert.equal(g2.merge(g1).merge(g1).value(), 8);

  const pn1 = new PNCounter();
  const pn2 = new PNCounter();
  pn1.increment('R1', 10);
  pn2.decrement('R2', 4);
  assert.equal(pn1.merge(pn2).value(), 6);

  const lww1 = new LWWRegister('old', 100, 'R1');
  const lww2 = new LWWRegister('new', 105, 'R2');
  assert.equal(lww1.merge(lww2).value, 'new');

  // OR-Set Add-Wins khi add và remove diễn ra đồng thời trên 2 nhánh mạng
  const baseSet = new ORSet<string>();
  baseSet.add('R1', 'item-a');
  const replicaA = baseSet.merge(new ORSet());
  const replicaB = baseSet.merge(new ORSet());
  replicaA.remove('item-a');
  replicaB.add('R2', 'item-a'); // đồng thời thêm tag mới mà A chưa thấy
  const merged = replicaA.merge(replicaB);
  assert.equal(merged.has('item-a'), true);
});

test('cancelOnTimeout trên LinkSpec chặn công việc zombie lan xuống DB khi service bị treo quá timeout', () => {
  const makeScenario = (cancelOnTimeout: boolean): SimScenario => ({
    id: 'test/cancel-timeout',
    durationSec: 15,
    seed: 1,
    load: { kind: 'steady', rps: 600 },
    events: [{ at: 2, type: 'slowdown', node: 'app', addMs: 500 }],
    options: { noise: false, maxPackets: 0 },
    model: {
      nodes: [
        makeNode('client', { id: 'client' }),
        makeNode('service', { id: 'app', opsPerSec: 1000, baseMs: 20, params: { poolSize: 500 } }),
        makeNode('sql', { id: 'db', opsPerSec: 800, baseMs: 5, params: { poolSize: 64 } }),
      ],
      links: [
        {
          id: 'c-app',
          from: 'client',
          to: 'app',
          mode: 'sync',
          timeoutMs: 150,
          cancelOnTimeout,
        },
        { id: 'app-db', from: 'app', to: 'db', mode: 'sync', timeoutMs: 500 },
      ],
    },
  });

  const simNoCancel = createSim(makeScenario(false));
  const fNoCancel = simNoCancel.runUntil(10);

  const simWithCancel = createSim(makeScenario(true));
  const fWithCancel = simWithCancel.runUntil(10);

  assert.ok(fNoCancel.nodes.db.lambda > 400, 'Không huỷ timeout: công việc zombie vẫn tràn xuống DB');
  assert.equal(fWithCancel.nodes.db.lambda, 0, 'Có cancelOnTimeout: request quá hạn bị huỷ trước khi gọi xuống DB');
});
