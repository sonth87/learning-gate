import assert from 'node:assert/strict';
import simsJson from '@/data/courses/sysdesign/sims.json';
import { mergeWpStates } from '@/db/durableProgressStorage';
import { emptyState } from '@/features/workpath/logic';
import {
  bisectMaxSustainableLoad,
  computeActivityXp,
  computeTimelineViolations,
  emptyAnswerForActivity,
  evalSafeFormula,
  gradeActivity,
  shuffleOrderItems,
  solutionAnswerForActivity,
  type Activity,
  type DesignActivity,
  type EstimateActivity,
  type FixActivity,
  type GradeContext,
  type OrderActivity,
  type PostmortemActivity,
  type PredictActivity,
  type SimDocForGrade,
  type SpotActivity,
  type TimelineReadActivity,
  type TuneActivity,
} from '../index';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    console.error(`  ✘ ${name}`);
    throw err;
  }
}

console.log('=== Chạy bộ test Activities & Grading Engine (M4: T4.1–T4.5) ===');

const sims = (simsJson as unknown as { sims: Record<string, SimDocForGrade> }).sims;
const ctx: GradeContext = { sims };

// 1) T4.1: mergeWpStates giữ best và stars; computeActivityXp đúng bảng 06 §7
test('T4.1 mergeWpStates: giữ max của best và stars trên ExerciseRecord', () => {
  const s1 = emptyState();
  s1.updatedAt = 1000;
  s1.exercises['S1-03.A5'] = {
    status: 'passed',
    attempts: 2,
    hints: 1,
    best: 85,
    stars: 2,
    passedAt: 1000,
  };

  const s2 = emptyState();
  s2.updatedAt = 2000;
  s2.exercises['S1-03.A5'] = {
    status: 'started',
    attempts: 1,
    hints: 0,
    best: 60,
    stars: 0,
  };

  const merged = mergeWpStates(s1, s2);
  const rec = merged.exercises['S1-03.A5'];
  assert.equal(rec.status, 'passed');
  assert.equal(rec.best, 85, 'giữ best cao nhất');
  assert.equal(rec.stars, 2, 'giữ stars cao nhất');
  assert.equal(rec.attempts, 2);
  assert.equal(rec.hints, 1);
});

test('T4.1 computeActivityXp: tính XP theo sao, gợi ý, xem lời giải và cải thiện sao (06 §7)', () => {
  // Lần đạt đầu 3 sao, 0 gợi ý: 30 * 1.0 * 1.0 = 30
  assert.equal(
    computeActivityXp({
      xpBase: 30,
      passed: true,
      stars: 3,
      prevPassed: false,
      prevStars: 0,
      hintsUsed: 0,
      solutionViewed: false,
    }),
    30
  );
  // Lần đạt đầu 2 sao, 2 gợi ý: round(30 * 0.85 * 0.7) = round(17.85) = 18
  assert.equal(
    computeActivityXp({
      xpBase: 30,
      passed: true,
      stars: 2,
      prevPassed: false,
      prevStars: 0,
      hintsUsed: 2,
      solutionViewed: false,
    }),
    18
  );
  // Đã xem lời giải trước khi đạt: floor(30 * 0.25) = 7
  assert.equal(
    computeActivityXp({
      xpBase: 30,
      passed: true,
      stars: 3,
      prevPassed: false,
      prevStars: 0,
      hintsUsed: 0,
      solutionViewed: true,
    }),
    7
  );
  // Cải thiện từ 1 sao (0.6) lên 3 sao (1.0): round(30 * 0.4) = 12
  assert.equal(
    computeActivityXp({
      xpBase: 30,
      passed: true,
      stars: 3,
      prevPassed: true,
      prevStars: 1,
      hintsUsed: 0,
      solutionViewed: false,
    }),
    12
  );
  // Chưa đạt: 0 XP
  assert.equal(
    computeActivityXp({
      xpBase: 30,
      passed: false,
      stars: 0,
      prevPassed: false,
      prevStars: 0,
      hintsUsed: 0,
      solutionViewed: false,
    }),
    0
  );
});

// 2) T4.2: predict & spot-bottleneck
test('T4.2 predict (node / choice / number): đúng, một phần, sai và rỗng', () => {
  const a1: PredictActivity = {
    id: 'S1-03.A1',
    kind: 'predict',
    title: { vi: 'Node nào quá tải trước?' },
    prompt: { vi: 'Chọn node đầu tiên chuyển sang trạng thái Quá tải sau giây 20.' },
    difficulty: 1,
    at: 20,
    question: {
      type: 'node',
      rule: { first: 'overloaded', after: 20 },
      expected: ['db'],
      partial: ['cache'],
    },
    reveal: { playFromSec: 20, playToSec: 42, speed: 2 },
    explain: {
      vi: 'DB quá tải ở giây {t.first.db:0}, ρ = {db.rho@36:2}, app ρ = {app1.rho@36:2}.',
    },
    sim: { simId: 'S1-03/ramp', seekSec: 20 },
  };

  const rEmpty = gradeActivity(a1, emptyAnswerForActivity(a1), ctx);
  assert.equal(rEmpty.passed, false);
  assert.equal(rEmpty.score, 0);

  const rPartial = gradeActivity(a1, { node: 'cache' }, ctx);
  assert.equal(rPartial.passed, false);
  assert.equal(rPartial.score, 40);
  assert.equal(rPartial.verdict, 'partial');

  const rOk = gradeActivity(a1, { node: 'db' }, ctx);
  assert.equal(rOk.passed, true);
  assert.equal(rOk.score, 100);
  assert.equal(rOk.stars, 3);
  assert.ok(!/\{[^}]+\}/.test(rOk.resolvedExplain?.vi ?? ''), 'explain đã phân giải hết biến');
});

test('T4.2 spot-bottleneck: mode bottleneck và spof (Jaccard)', () => {
  const spotB: SpotActivity = {
    id: 'S1-03.A2',
    kind: 'spot-bottleneck',
    title: { vi: 'Chỉ ra điểm nghẽn' },
    prompt: { vi: 'Nhấn vào node là điểm nghẽn tại giây 38.' },
    difficulty: 1,
    mode: 'bottleneck',
    atSec: 38,
    maxPicks: 1,
    expected: ['db'],
    explain: {
      vi: '{db.name} đang ρ = {db.rho@38:2}, hàng đợi {db.queue@38:0} request ({db.queueWaitMs@38:0} ms).',
    },
    sim: { simId: 'S1-03/ramp', seekSec: 38 },
  };

  assert.equal(gradeActivity(spotB, { picks: [] }, ctx).passed, false);
  assert.equal(gradeActivity(spotB, { picks: ['app1'] }, ctx).score, 0);
  const okB = gradeActivity(spotB, { picks: ['db'] }, ctx);
  assert.equal(okB.passed, true);
  assert.equal(okB.score, 100);
  assert.ok(okB.resolvedExplain?.vi.includes('Database'), 'phân giải {db.name}');

  const spotSpof: SpotActivity = {
    ...spotB,
    id: 'S1-03.A9',
    mode: 'spof',
    maxPicks: 3,
    expected: ['cache', 'db', 'lb'],
  };
  // Chọn 2/3 SPOF: Jaccard = 2/3 = 67 < 70 (chưa đạt, một phần)
  const rPart = gradeActivity(spotSpof, { picks: ['db', 'lb'] }, ctx);
  assert.equal(rPart.score, 67);
  assert.equal(rPart.passed, false);
  // Chọn đủ 3 SPOF: 100
  const rFull = gradeActivity(spotSpof, { picks: ['lb', 'cache', 'db'] }, ctx);
  assert.equal(rFull.score, 100);
  assert.equal(rFull.passed, true);
});

// 3) T4.3: tune-to-limit & estimate
test('T4.3 tune-to-limit max-load trên S1-03: 2950 ⇒ 100, 2000 ⇒ 40, 4000 ⇒ 0 (06 §9)', () => {
  const a3: TuneActivity = {
    id: 'S1-03.A3',
    kind: 'tune-to-limit',
    title: { vi: 'Tìm tải tối đa hệ thống chịu được' },
    prompt: { vi: 'Tìm lưu lượng cao nhất giữ p99 ≤ 300 ms và lỗi ≤ 1%.' },
    difficulty: 2,
    objective: 'max-load',
    constraints: [
      {
        id: 'p99',
        kind: 'slo-latency',
        metric: 'p99',
        maxMs: 300,
        window: { fromSec: 20, toSec: 40 },
        allowViolationPct: 2,
      },
      {
        id: 'err',
        kind: 'slo-error',
        maxRate: 0.01,
        window: { fromSec: 20, toSec: 40 },
      },
    ],
    runSec: 40,
    reference: { value: 2950, tolPassPct: 10, tolFullPct: 5 },
    explain: {
      vi: 'Tỉ lệ vào DB {db.share@10:2} ⇒ giới hạn ≈ {ref.value:0} req/s.',
    },
    sim: { simId: 'S1-03/ramp', seekSec: 0 },
  };

  const r2950 = gradeActivity(a3, { objective: 'max-load', value: 2950 }, ctx);
  assert.equal(r2950.score, 100, `2950 phải đạt 100 (đo: ${r2950.score})`);
  assert.equal(r2950.passed, true);

  const r2000 = gradeActivity(a3, { objective: 'max-load', value: 2000 }, ctx);
  assert.equal(r2000.score, 40, `2000 quá bảo thủ phải đạt 40 (đo: ${r2000.score})`);
  assert.equal(r2000.passed, false);

  const r4000 = gradeActivity(a3, { objective: 'max-load', value: 4000 }, ctx);
  assert.equal(r4000.score, 0, `4000 vượt ngưỡng phải đạt 0 (đo: ${r4000.score})`);
  assert.equal(r4000.passed, false);

  const bisected = bisectMaxSustainableLoad(
    sims['S1-03/ramp'].scenario,
    40,
    a3.constraints
  );
  assert.ok(
    Math.abs(bisected - 2950) / 2950 <= 0.03,
    `bisection (${bisected}) khớp reference 2950 trong ±3%`
  );
});

test('T4.3 estimate: bảng err → score (0,05 → 100; 0,20 → 70; 0,40 → 40; >0,50 → 0) với tol {0.1, 0.25}', () => {
  assert.equal(evalSafeFormula('3000*(0.9*(1-0.52)+0.1)'), 1596);
  const a4: EstimateActivity = {
    id: 'S1-03.A4',
    kind: 'estimate',
    title: { vi: 'Database nhận bao nhiêu request?' },
    prompt: { vi: 'Ước lượng req/s vào DB.' },
    difficulty: 2,
    quantity: 'Lưu lượng vào database',
    unit: 'req/s',
    truth: { type: 'fixed', value: 1000 },
    scale: 'linear',
    tol: { full: 0.1, pass: 0.25 },
    explain: { vi: 'Giá trị đúng ≈ {truth:0} req/s.' },
  };

  assert.equal(gradeActivity(a4, { value: 1050 }, ctx).score, 100); // err 0.05 <= 0.10
  assert.equal(gradeActivity(a4, { value: 1200 }, ctx).score, 70);  // err 0.20 <= 0.25
  assert.equal(gradeActivity(a4, { value: 1400 }, ctx).score, 40);  // err 0.40 <= 0.50
  assert.equal(gradeActivity(a4, { value: 1600 }, ctx).score, 0);   // err 0.60 > 0.50
  assert.equal(gradeActivity(a4, null, ctx).score, 0);
});

// 4) T4.4: fix-challenge
test('T4.4 fix-challenge trên S1-03: starter không đạt, solution đạt ★★★, bẫy không đạt, ngoài allowed ⇒ invalid-change', () => {
  const a5: FixActivity = {
    id: 'S1-03.A5',
    kind: 'fix-challenge',
    title: { vi: 'Đưa p99 về dưới 130 ms và lỗi dưới 1%' },
    prompt: { vi: 'Giữ p99 ≤ 130 ms và lỗi ≤ 1% trong 90 giây với tối đa 3 thay đổi và chi phí ≤ 2,50 USD/giờ.' },
    difficulty: 3,
    simId: 'S1-03/ramp',
    budget: { maxChanges: 3, maxCostPerHour: 2.5 },
    allowed: [
      { type: 'knob', node: 'cache', key: 'capacityKeys', min: 10000, max: 100000 },
      { type: 'knob', node: 'db', key: 'sizeFactor', min: 1, max: 4 },
      { type: 'knob', node: 'app1', key: 'replicas', min: 1, max: 6 },
      { type: 'knob', node: 'app2', key: 'replicas', min: 1, max: 6 },
      { type: 'knob', node: 'app3', key: 'replicas', min: 1, max: 6 },
      { type: 'link', link: 'cache-db', fields: ['retry', 'timeoutMs', 'breaker'] },
    ],
    goal: [
      {
        id: 'p99',
        kind: 'slo-latency',
        metric: 'p99',
        maxMs: 130,
        window: { fromSec: 0, toSec: 90 },
        allowViolationPct: 2,
      },
      {
        id: 'err',
        kind: 'slo-error',
        maxRate: 0.01,
        window: { fromSec: 0, toSec: 90 },
      },
    ],
    soft: [
      {
        id: 'db-calm',
        kind: 'node-state',
        node: 'db',
        notIn: ['saturated', 'overloaded', 'down'],
        window: { fromSec: 0, toSec: 90 },
        allowViolationPct: 5,
      },
      {
        id: 'retry-safe',
        kind: 'structural',
        rule: 'has-retry-backoff',
        link: 'cache-db',
      },
    ],
    observe: { runSec: 90 },
    par: { changes: 3, costPerHour: 2.31 },
    solution: [
      { type: 'knob', node: 'cache', key: 'capacityKeys', value: 50000 },
      { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 },
      {
        type: 'link',
        link: 'cache-db',
        patch: {
          retry: {
            max: 2,
            backoff: 'exponential',
            baseMs: 100,
            jitter: 'full',
            budgetRatio: 0.1,
          },
        },
      },
    ],
    traps: [
      {
        id: 'more-apps',
        label: { vi: 'Tăng gấp đôi số instance của cả 3 app' },
        changes: [
          { type: 'knob', node: 'app1', key: 'replicas', value: 2 },
          { type: 'knob', node: 'app2', key: 'replicas', value: 2 },
          { type: 'knob', node: 'app3', key: 'replicas', value: 2 },
        ],
        why: { vi: 'Tầng app không phải điểm nghẽn.' },
      },
    ],
    explain: {
      vi: "Hit Ratio tăng từ {cache.hitRatio@10:0%} lên {cache.hitRatio'@10:0%}, ρ DB còn {db.rho'@60:2}.",
    },
  };

  // Starter (không làm gì) ⇒ không đạt, cả p99 và err đều fail
  const rStarter = gradeActivity(a5, { changes: [] }, ctx);
  assert.equal(rStarter.passed, false);
  assert.ok(rStarter.score < 70);
  assert.equal(rStarter.checks.find((c) => c.id === 'p99')?.pass, false, 'starter vi phạm p99 ≤ 130 ms');
  assert.equal(rStarter.checks.find((c) => c.id === 'err')?.pass, false, 'starter vi phạm err ≤ 1%');

  // Solution ⇒ đạt 3 sao
  const rSol = gradeActivity(a5, solutionAnswerForActivity(a5, ctx), ctx);
  assert.equal(rSol.passed, true);
  assert.equal(rSol.stars, 3);
  assert.equal(rSol.score, 100);
  assert.ok(rSol.resolvedExplain?.vi.includes('74%'), `explain hậu thay đổi: ${rSol.resolvedExplain?.vi}`);

  // Bẫy ⇒ không đạt + khớp matchedTrap
  const rTrap = gradeActivity(a5, { changes: a5.traps![0].changes }, ctx);
  assert.equal(rTrap.passed, false);
  assert.equal(rTrap.matchedTrap?.id, 'more-apps');

  // Thay đổi ngoài allowed ⇒ invalid-change
  const rInvalid = gradeActivity(
    a5,
    { changes: [{ type: 'knob', node: 'db', key: 'poolSize', value: 32 }] },
    ctx
  );
  assert.equal(rInvalid.passed, false);
  assert.equal(rInvalid.score, 0);
  assert.equal(rInvalid.checks[0].id, 'invalid-change');
});

// 5) T4.5: order, timeline-read, postmortem, design-constraint
test('T4.5 order: adjacent-pairs với n=5 cho 4/3/2/0 cặp đúng', () => {
  const a6: OrderActivity = {
    id: 'S1-03.A6',
    kind: 'order',
    title: { vi: 'Thứ tự request' },
    prompt: { vi: 'Sắp xếp 5 bước.' },
    difficulty: 1,
    items: [
      { id: '1', text: { vi: 'Bước 1' } },
      { id: '2', text: { vi: 'Bước 2' } },
      { id: '3', text: { vi: 'Bước 3' } },
      { id: '4', text: { vi: 'Bước 4' } },
      { id: '5', text: { vi: 'Bước 5' } },
    ],
    shuffleSeed: 7,
    explain: { vi: 'Giải thích.' },
  };

  const shuffled = shuffleOrderItems(a6.items, a6.shuffleSeed).map((i) => i.id);
  assert.notDeepEqual(shuffled, ['1', '2', '3', '4', '5'], 'hoán vị phải khác thứ tự đúng');

  assert.equal(gradeActivity(a6, { order: ['1', '2', '3', '4', '5'] }, ctx).score, 100); // 4/4 cặp
  assert.equal(gradeActivity(a6, { order: ['2', '3', '4', '5', '1'] }, ctx).score, 75);  // 3/4 cặp (2->3, 3->4, 4->5)
  assert.equal(gradeActivity(a6, { order: ['1', '2', '3', '5', '4'] }, ctx).score, 50);  // 2/4 cặp (1->2, 2->3)
  assert.equal(gradeActivity(a6, { order: ['5', '4', '3', '2', '1'] }, ctx).score, 0);   // 0/4 cặp
});

test('T4.5 timeline-read: F1 scoring và checker find-violations-of-ryw', () => {
  const tl: TimelineReadActivity = {
    id: 'S3-02.A2',
    kind: 'timeline-read',
    title: { vi: 'Tìm vi phạm Read-Your-Writes' },
    prompt: { vi: 'Chọn lượt đọc vi phạm RYW.' },
    difficulty: 2,
    question: 'find-violations-of-ryw',
    history: [
      { id: 'w1', client: 'A', op: 'write', key: 'x', value: 1, start: 0, end: 20, node: 'primary' },
      { id: 'w2', client: 'A', op: 'write', key: 'x', value: 2, start: 100, end: 120, node: 'primary' },
      { id: 'r1', client: 'A', op: 'read', key: 'x', value: 1, start: 130, end: 140, node: 'replica-1' },
      { id: 'r2', client: 'B', op: 'read', key: 'x', value: 1, start: 135, end: 145, node: 'replica-1' },
      { id: 'r3', client: 'A', op: 'read', key: 'x', value: 2, start: 400, end: 410, node: 'replica-1' },
    ],
    expected: ['r1'],
    explain: { vi: 'r1 vi phạm RYW.' },
  };

  assert.deepEqual(computeTimelineViolations(tl.history, tl.question), ['r1']);
  assert.equal(gradeActivity(tl, { picks: [] }, ctx).passed, false);
  assert.equal(gradeActivity(tl, { picks: ['r1'] }, ctx).score, 100);
  // Chọn cả r1 và r2: precision = 1/2, recall = 1/1 ⇒ F1 = 2/3 ≈ 67%
  assert.equal(gradeActivity(tl, { picks: ['r1', 'r2'] }, ctx).score, 67);
});

test('T4.5 postmortem & design-constraint: chấm đúng single/multi/rank và đa kịch bản', () => {
  const pm: PostmortemActivity = {
    id: 'S4-11.A3',
    kind: 'postmortem',
    title: { vi: 'Hậu kiểm sự cố' },
    prompt: { vi: 'Trả lời 3 câu hỏi.' },
    difficulty: 3,
    incident: { simId: 'S1-03/ramp', seekSec: 0 },
    questions: [
      {
        id: 'root',
        type: 'single',
        prompt: { vi: 'Nguyên nhân gốc?' },
        options: [
          { id: 'a', text: { vi: 'A' } },
          { id: 'b', text: { vi: 'B' } },
        ],
        correct: ['a'],
        weight: 40,
      },
      {
        id: 'amp',
        type: 'multi',
        prompt: { vi: 'Yếu tố khuếch đại?' },
        options: [
          { id: 'r', text: { vi: 'Retry' } },
          { id: 'j', text: { vi: 'No jitter' } },
          { id: 'x', text: { vi: 'Sai' } },
        ],
        correct: ['r', 'j'],
        weight: 30,
      },
      {
        id: 'prev',
        type: 'rank',
        prompt: { vi: 'Thứ tự ưu tiên?' },
        options: [
          { id: '1', text: { vi: '1' } },
          { id: '2', text: { vi: '2' } },
          { id: '3', text: { vi: '3' } },
        ],
        correct: ['1', '2', '3'],
        weight: 30,
      },
    ],
    explain: { vi: 'Giải thích hậu kiểm.' },
  };

  assert.equal(gradeActivity(pm, emptyAnswerForActivity(pm), ctx).passed, false);
  const pmOk = gradeActivity(pm, solutionAnswerForActivity(pm, ctx), ctx);
  assert.equal(pmOk.passed, true);
  assert.equal(pmOk.score, 100);

  const dc: DesignActivity = {
    id: 'S5-02.A1',
    kind: 'design-constraint',
    title: { vi: 'Thiết kế chịu mất 1 instance' },
    prompt: { vi: 'Chịu tải 4000 req/s kể cả khi mất app2.' },
    difficulty: 3,
    simId: 'S1-03/ramp',
    start: 'preset',
    scenarios: [
      {
        id: 'peak',
        label: { vi: 'Tải đỉnh' },
        simId: 'S1-03/ramp',
        loadOverride: { kind: 'steady', rps: 4000 },
        constraints: [
          { id: 'err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 20, toSec: 90 } },
        ],
        weight: 1,
      },
      {
        id: 'lose-app',
        label: { vi: 'Mất app2' },
        simId: 'S1-03/ramp',
        loadOverride: { kind: 'steady', rps: 4000 },
        events: [{ at: 30, type: 'crash', node: 'app2' }],
        constraints: [
          { id: 'err-fail', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 40, toSec: 90 } },
        ],
        weight: 1,
      },
    ],
    structural: [{ id: 'has-timeout', kind: 'structural', rule: 'has-timeout' }],
    budget: { maxCostPerHour: 3.0, maxChanges: 6 },
    solution: {
      changes: [
        { type: 'knob', node: 'cache', key: 'capacityKeys', value: 50000 },
        { type: 'knob', node: 'db', key: 'sizeFactor', value: 2 },
        { type: 'knob', node: 'app1', key: 'replicas', value: 2 },
        { type: 'knob', node: 'app2', key: 'replicas', value: 2 },
        { type: 'knob', node: 'app3', key: 'replicas', value: 2 },
      ],
    },
    explain: { vi: 'Giải thích thiết kế.' },
  };

  assert.equal(gradeActivity(dc, emptyAnswerForActivity(dc), ctx).passed, false);
  const dcOk = gradeActivity(dc, solutionAnswerForActivity(dc, ctx), ctx);
  assert.equal(dcOk.passed, true);
  assert.equal(dcOk.stars, 3);
});

console.log(`\n🎉 TẤT CẢ ${passed} BÀI TEST ACTIVITIES & GRADING ĐỀU XANH!`);
