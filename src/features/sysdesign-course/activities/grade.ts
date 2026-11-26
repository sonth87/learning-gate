/**
 * Bộ chấm điểm thuần, deterministic cho 9 dạng bài tập (06-activities-and-grading.md §2–§3, §8).
 * Không IO, không Date, không Math.random.
 */
import {
  applyChangesToModel,
  createSim,
  DT,
  effReplicas,
  evaluate as defaultEvaluate,
  findBottleneck,
  findSpofs,
  mulberry32,
  NODE_STATE_CODE,
  simulate as defaultSimulate,
  type Constraint,
  type ConstraintResult,
  type InputRecord,
  type LoadProfile,
  type NodeState,
  type RunSeries,
  type SimFrame,
  type SimScenario,
  type SystemModel,
  type TimedEvent,
} from '../sim';
import type {
  Activity,
  ActivityAnswer,
  ActivityTrap,
  AllowedAction,
  Change,
  CheckItem,
  DesignActivity,
  DesignAnswer,
  EstimateActivity,
  EstimateAnswer,
  FixActivity,
  FixAnswer,
  GradeContext,
  GradeResult,
  HistoryOp,
  Loc,
  OrderActivity,
  OrderAnswer,
  OrderItem,
  PostmortemActivity,
  PostmortemAnswer,
  PredictActivity,
  PredictAnswer,
  ReplayRef,
  SpotActivity,
  SpotAnswer,
  TimelineReadActivity,
  TimelineReadAnswer,
  TuneActivity,
  TuneAnswer,
} from './types';

function starsFromScore(passed: boolean, score: number): 0 | 1 | 2 | 3 {
  if (!passed) return 0;
  if (score >= 95) return 3;
  if (score >= 80) return 2;
  return 1;
}

function verdictFrom(passed: boolean, score: number): 'correct' | 'partial' | 'wrong' {
  if (passed && score >= 90) return 'correct';
  if (passed || score >= 35) return 'partial';
  return 'wrong';
}

function changesToInputRecords(changes: readonly Change[], atTick = 0): InputRecord[] {
  return changes.map((c) => {
    if (c.type === 'knob') {
      return {
        tick: atTick,
        change: { type: 'knob', node: c.node, key: c.key, value: c.value },
      };
    }
    return {
      tick: atTick,
      change: { type: 'link', link: c.link, patch: c.patch as never },
    };
  });
}

/** Tính chi phí $/giờ của model tại trạng thái cấu hình tĩnh (04 §2.14). */
export function computeModelStaticCostPerHour(model: SystemModel): number {
  let total = 0;
  for (const n of model.nodes) {
    if (n.params.enabled === false) continue;
    const rep = effReplicas(n);
    const sizeF = typeof n.params.sizeFactor === 'number' ? n.params.sizeFactor : 1;
    total += rep * Math.pow(sizeF, 1.2) * n.costPerHour;
  }
  return total;
}

/** Lấy frame đơn tại thời điểm `atSec` (cache theo scenario). */
const scenarioSimCache = new WeakMap<object, Map<number, SimFrame>>();

export function getScenarioFrameAt(scenario: SimScenario, atSec: number): SimFrame {
  let byTick = scenarioSimCache.get(scenario);
  const targetTick = Math.max(0, Math.round(atSec / DT));
  if (byTick?.has(targetTick)) return byTick.get(targetTick)!;

  const sc: SimScenario = {
    ...scenario,
    options: { ...(scenario.options ?? {}), maxPackets: 0 },
  };
  const sim = createSim(sc);
  if (!byTick) {
    byTick = new Map<number, SimFrame>();
    scenarioSimCache.set(scenario, byTick);
  }
  const f0 = sim.frame() ?? sim.step();
  byTick.set(f0.tick, f0);
  const maxTick = Math.min(Math.round(sc.durationSec / DT), Math.max(targetTick, 600));
  for (let k = 1; k <= maxTick; k++) {
    const f = sim.step();
    byTick.set(f.tick, f);
  }
  return byTick.get(targetTick) ?? sim.frame()!;
}

const scenarioRunCache = new WeakMap<object, RunSeries>();

function getScenarioBaselineRun(
  scenario: SimScenario,
  simulateFn = defaultSimulate
): RunSeries {
  const hit = scenarioRunCache.get(scenario);
  if (hit) return hit;
  const run = simulateFn(scenario, []);
  scenarioRunCache.set(scenario, run);
  return run;
}

/* ───────────── Biến nội suy trong `explain` (06 §8.3) ───────────── */

function lookupRunValue(
  run: RunSeries,
  model: SystemModel,
  ent: string,
  field: string,
  tSec: number
): number | string | undefined {
  const k = Math.max(0, Math.min(run.ticks - 1, Math.round(tSec / run.dt)));
  if (ent === 'm' || ent === 'global' || ent === 'metrics') {
    if (field === 'offered' || field === 'offeredRps') return run.offered[k];
    if (field === 'goodput' || field === 'goodputRps') return run.goodput[k];
    if (field === 'errorRate') return run.errorRate[k];
    if (field === 'p50') return run.p50[k];
    if (field === 'p95') return run.p95[k];
    if (field === 'p99') return run.p99[k];
    if (field === 'cost' || field === 'costPerHour') return run.costPerHour[k];
    if (field === 'amplification') {
      let sumRps = 0;
      for (const lid of Object.keys(run.links)) sumRps += run.links[lid].rps[k];
      return run.offered[k] > 0 ? sumRps / run.offered[k] : 1;
    }
    return undefined;
  }

  const nodeSpec = model.nodes.find((n) => n.id === ent);
  if (nodeSpec && field === 'name') {
    return nodeSpec.label.vi;
  }
  if (nodeSpec && field === 'healthCheckSec') {
    return Number(nodeSpec.params.healthCheckSec ?? 3);
  }
  const ns = run.nodes[ent];
  if (ns) {
    if (field === 'rho') return ns.rho[k];
    if (field === 'lambda') return ns.lambda[k];
    if (field === 'queue') return ns.queue[k];
    if (field === 'loadPct') return Math.round(Math.min(1, ns.rho[k]) * 100);
    if (field === 'share') {
      return run.offered[k] > 0 ? ns.lambda[k] / run.offered[k] : 0;
    }
    if (field === 'queueWaitMs' && nodeSpec) {
      const mu = Math.max(1, effReplicas(nodeSpec) * nodeSpec.capacity.opsPerSec);
      return (1000 * ns.queue[k]) / mu;
    }
    if (field === 'hitRatio' && nodeSpec) {
      const capK = Number(nodeSpec.params.capacityKeys ?? 100000);
      const workK = Math.max(1, Number(nodeSpec.params.workingSetKeys ?? 100000));
      const ttl = Number(nodeSpec.params.ttlSec ?? 300);
      const hMax = Number(nodeSpec.params.hitRatioMax ?? 0.9);
      const cov = Math.pow(Math.min(1, capK / workK), 0.5);
      const ttlF = 1 - Math.exp(-ttl / 30);
      return hMax * cov * ttlF;
    }
  }
  const ls = run.links[ent];
  if (ls) {
    if (field === 'rps') return ls.rps[k];
    if (field === 'errorRate') return ls.errorRate[k];
  }
  return undefined;
}

function formatVarValue(val: number | string, fmt?: string): string {
  if (typeof val === 'string') return val;
  const fStr = (fmt ?? '0').trim();
  if (fStr.endsWith('%')) {
    const dp = Math.max(0, parseInt(fStr.slice(0, -1), 10) || 0);
    return `${(val * 100).toFixed(dp)}%`;
  }
  const dp = Math.max(0, parseInt(fStr, 10) || 0);
  return val.toFixed(dp);
}

/**
 * Nội suy mọi biến `{...}` trong `explain` (06 §8.3).
 * Trả `{ text, unresolved }`, trong đó `unresolved` liệt kê các biến không phân giải được (doctor kiểm).
 */
export function resolveExplainText(
  raw: string,
  vars: Record<string, number | string>,
  opts: {
    baseRun?: RunSeries;
    baseModel?: SystemModel;
    afterRun?: RunSeries;
    afterModel?: SystemModel;
    defaultSec?: number;
  }
): { text: string; unresolved: string[] } {
  if (!raw || !/\{[^}]+\}/.test(raw)) return { text: raw, unresolved: [] };
  const unresolved: string[] = [];
  const defaultSec = opts.defaultSec ?? 0;

  const text = raw.replace(/\{([^}]+)\}/g, (full, expr: string) => {
    const colonIdx = expr.lastIndexOf(':');
    let head = expr;
    let fmt: string | undefined;
    if (colonIdx > 0 && /^[0-9]+%?$/.test(expr.slice(colonIdx + 1).trim())) {
      head = expr.slice(0, colonIdx).trim();
      fmt = expr.slice(colonIdx + 1).trim();
    }

    if (head in vars) {
      const v = vars[head];
      if (typeof v === 'number' && !Number.isFinite(v)) {
        unresolved.push(full);
        return full;
      }
      return formatVarValue(v, fmt);
    }

    // Dạng <entity>[.']<field>[@<t>]
    const m = /^([a-zA-Z0-9_-]+?)('?)\.([a-zA-Z0-9_]+?)('?)(?:@([0-9.]+))?$/.exec(head);
    if (!m) {
      unresolved.push(full);
      return full;
    }
    const ent = m[1];
    const isAfter = m[2] === "'" || m[4] === "'";
    const field = m[3];
    const tSec = m[5] !== undefined ? Number(m[5]) : defaultSec;

    const run = isAfter ? (opts.afterRun ?? opts.baseRun) : opts.baseRun;
    const model = isAfter ? (opts.afterModel ?? opts.baseModel) : opts.baseModel;
    if (!run || !model) {
      unresolved.push(full);
      return full;
    }
    const val = lookupRunValue(run, model, ent, field, tSec);
    if (val === undefined || (typeof val === 'number' && !Number.isFinite(val))) {
      unresolved.push(full);
      return full;
    }
    return formatVarValue(val, fmt);
  });

  return { text, unresolved };
}

/* ───────────── 3.1 predict ───────────── */

export function computePredictExpectedNodes(
  run: RunSeries,
  rule: { first: NodeState; after: number }
): { winners: string[]; firstTimes: Record<string, number> } {
  const targetCode = NODE_STATE_CODE[rule.first];
  const startTick = Math.max(0, Math.ceil(rule.after / run.dt - 1e-9));
  const firstTimes: Record<string, number> = {};
  let minT = Infinity;

  for (const [nodeId, ns] of Object.entries(run.nodes)) {
    for (let k = startTick; k < run.ticks; k++) {
      if (ns.state[k] === targetCode) {
        const t = run.t[k];
        firstTimes[nodeId] = t;
        if (t < minT) minT = t;
        break;
      }
    }
  }

  const winners: string[] = [];
  if (Number.isFinite(minT)) {
    for (const [nodeId, t] of Object.entries(firstTimes)) {
      if (t - minT <= 0.5 + 1e-9) winners.push(nodeId);
    }
  }
  return { winners: winners.sort(), firstTimes };
}

function gradePredict(a: PredictActivity, answer: PredictAnswer, ctx: GradeContext): GradeResult {
  const simFn = ctx.simulate ?? defaultSimulate;
  const simId = a.sim?.simId ?? a.replay?.simId ?? Object.keys(ctx.sims)[0];
  const doc = simId ? ctx.sims[simId] : undefined;
  const baseRun = doc ? getScenarioBaselineRun(doc.scenario, simFn) : undefined;
  const passScore = a.passScore ?? 70;
  const vars: Record<string, number | string> = {};

  let score = 0;
  const checks: CheckItem[] = [];
  const q = a.question;

  if (q.type === 'node') {
    const computed = baseRun
      ? computePredictExpectedNodes(baseRun, q.rule)
      : { winners: q.expected, firstTimes: {} };
    for (const [nid, t] of Object.entries(computed.firstTimes)) {
      vars[`t.first.${nid}`] = t;
    }
    const winners = computed.winners.length > 0 ? computed.winners : q.expected;
    const picked = answer && 'node' in answer ? answer.node : '';
    if (picked && winners.includes(picked)) {
      score = 100;
    } else if (picked && q.partial?.includes(picked)) {
      score = 40;
    } else {
      score = 0;
    }
    checks.push({
      id: 'predict-node',
      label: { vi: `Node đầu tiên chuyển sang ${q.rule.first}`, en: `First node to reach ${q.rule.first}` },
      pass: score >= passScore,
      weight: 100,
      got: picked || '—',
      want: winners.join(', '),
    });
  } else if (q.type === 'choice') {
    const picked = answer && 'choice' in answer ? answer.choice : -1;
    score = picked === q.correct ? 100 : 0;
    checks.push({
      id: 'predict-choice',
      label: { vi: 'Lựa chọn dự đoán', en: 'Predicted choice' },
      pass: score >= passScore,
      weight: 100,
      got: picked >= 0 && q.options[picked] ? q.options[picked].vi : '—',
      want: q.options[q.correct]?.vi ?? String(q.correct),
    });
  } else {
    const val = answer && 'value' in answer ? answer.value : NaN;
    const truth = q.expected;
    vars.truth = truth;
    if (Number.isFinite(val) && val > 0 && truth > 0) {
      const errPct = (Math.abs(val - truth) / truth) * 100;
      if (errPct <= q.tolerancePct) score = 100;
      else if (errPct <= q.tolerancePct * 2) score = 50;
      else score = 0;
    }
    checks.push({
      id: 'predict-number',
      label: { vi: `Dự đoán ${q.metric} tại ${q.atSec}s`, en: `Predict ${q.metric} at ${q.atSec}s` },
      pass: score >= passScore,
      weight: 100,
      got: Number.isFinite(val) ? val : '—',
      want: truth,
    });
  }

  const passed = score >= passScore;
  const resolvedVi = resolveExplainText(a.explain.vi, vars, {
    baseRun,
    baseModel: doc?.scenario.model,
    defaultSec: a.at,
  }).text;
  const resolvedEn = a.explain.en
    ? resolveExplainText(a.explain.en, vars, {
        baseRun,
        baseModel: doc?.scenario.model,
        defaultSec: a.at,
      }).text
    : undefined;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks,
    verdict: verdictFrom(passed, score),
    vars,
    resolvedExplain: { vi: resolvedVi, en: resolvedEn },
    replay: a.replay ?? a.sim,
  };
}

/* ───────────── 3.2 spot-bottleneck ───────────── */

export function computeSpotExpectedNodes(
  a: SpotActivity,
  scenario: SimScenario
): string[] {
  const atSec = a.atSec ?? a.sim?.seekSec ?? 35;
  if (a.mode === 'spof') {
    return findSpofs(scenario.model)
      .filter((s) => s.severity === 'error')
      .map((s) => s.nodeId)
      .sort();
  }
  const frame = getScenarioFrameAt(scenario, atSec);
  if (a.mode === 'bottleneck' || a.mode === 'slow-dependency') {
    const b = findBottleneck(scenario.model, frame);
    return b.nodeId ? [b.nodeId] : a.expected;
  }
  if (a.mode === 'retry-amplifier') {
    let bestNode = '';
    let bestRetry = -1;
    for (const l of scenario.model.links) {
      const lf = frame.links[l.id];
      if (lf && lf.retryRps > bestRetry) {
        bestRetry = lf.retryRps;
        bestNode = l.to;
      }
    }
    return bestNode ? [bestNode] : a.expected;
  }
  return a.expected;
}

function gradeSpot(a: SpotActivity, answer: SpotAnswer | null, ctx: GradeContext): GradeResult {
  const simFn = ctx.simulate ?? defaultSimulate;
  const simId = a.sim?.simId ?? a.replay?.simId ?? Object.keys(ctx.sims)[0];
  const doc = simId ? ctx.sims[simId] : undefined;
  const baseRun = doc ? getScenarioBaselineRun(doc.scenario, simFn) : undefined;
  const expected = doc ? computeSpotExpectedNodes(a, doc.scenario) : a.expected;
  const picks = (answer && 'picks' in answer ? answer.picks : []).slice(0, a.maxPicks);
  const passScore = a.passScore ?? (a.maxPicks === 1 ? 99 : 70);

  const pickSet = new Set(picks);
  const expSet = new Set(expected);
  let inter = 0;
  for (const p of pickSet) if (expSet.has(p)) inter++;
  const union = new Set([...pickSet, ...expSet]).size;

  let score = 0;
  if (a.scoring === 'exact') {
    score = inter === expSet.size && pickSet.size === expSet.size ? 100 : 0;
  } else {
    score = union > 0 ? Math.round((inter / union) * 100) : 0;
  }

  const passed = score >= passScore;
  const vars: Record<string, number | string> = {};
  const atSec = a.atSec ?? a.sim?.seekSec ?? 35;

  const resolvedVi = resolveExplainText(a.explain.vi, vars, {
    baseRun,
    baseModel: doc?.scenario.model,
    defaultSec: atSec,
  }).text;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks: [
      {
        id: 'spot-picks',
        label: { vi: 'Thành phần đã chọn', en: 'Selected components' },
        pass: passed,
        weight: 100,
        got: picks.length ? picks.join(', ') : '—',
        want: expected.join(', '),
      },
    ],
    verdict: verdictFrom(passed, score),
    vars,
    resolvedExplain: { vi: resolvedVi, en: a.explain.en },
    replay: a.replay ?? a.sim,
  };
}

/* ───────────── 3.3 tune-to-limit ───────────── */

function runAtSteadyLoad(
  baseScenario: SimScenario,
  rps: number,
  runSec: number,
  constraints: readonly Constraint[],
  simFn = defaultSimulate,
  evalFn = defaultEvaluate
): { pass: boolean; results: ConstraintResult[] } {
  const sc: SimScenario = {
    ...baseScenario,
    durationSec: runSec,
    load: { kind: 'steady', rps },
    options: { ...(baseScenario.options ?? {}), noise: false, maxPackets: 0 },
  };
  const run = simFn(sc, []);
  const results = evalFn(constraints, run, sc.model);
  return { pass: results.every((r) => r.pass), results };
}

/** Tìm tải bền vững tối đa theo `constraints` bằng bisection 14 bước (cho doctor kiểm `reference.value`). */
export function bisectMaxSustainableLoad(
  baseScenario: SimScenario,
  runSec: number,
  constraints: readonly Constraint[],
  lo = 100,
  hi = 20000
): number {
  let l = lo;
  let r = hi;
  for (let i = 0; i < 14; i++) {
    const mid = 0.5 * (l + r);
    const { pass } = runAtSteadyLoad(baseScenario, mid, runSec, constraints);
    if (pass) l = mid;
    else r = mid;
  }
  return Math.round(l);
}

function gradeTune(a: TuneActivity, answer: TuneAnswer, ctx: GradeContext): GradeResult {
  const simFn = ctx.simulate ?? defaultSimulate;
  const evalFn = ctx.evaluate ?? defaultEvaluate;
  const simId = a.sim?.simId ?? a.replay?.simId ?? Object.keys(ctx.sims)[0];
  const doc = simId ? ctx.sims[simId] : undefined;
  const passScore = a.passScore ?? 70;
  const vars: Record<string, number | string> = {};
  if (a.reference) vars['ref.value'] = a.reference.value;

  if (!doc) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [],
      verdict: 'wrong',
      vars,
    };
  }

  const baseRun = getScenarioBaselineRun(doc.scenario, simFn);

  if (a.objective === 'max-load') {
    const val = answer && answer.objective === 'max-load' ? Number(answer.value) : NaN;
    if (!Number.isFinite(val) || val <= 0) {
      return {
        activityId: a.id,
        kind: a.kind,
        passed: false,
        score: 0,
        stars: 0,
        checks: [
          {
            id: 'max-load-input',
            label: { vi: 'Lưu lượng nhập vào', en: 'Entered load' },
            pass: false,
            weight: 100,
            got: '—',
            want: a.reference ? `${a.reference.value} req/s` : '> 0',
          },
        ],
        verdict: 'wrong',
        vars,
      };
    }

    const rHold = runAtSteadyLoad(doc.scenario, val, a.runSec, a.constraints, simFn, evalFn);
    const rTight = runAtSteadyLoad(doc.scenario, val * 1.15, a.runSec, a.constraints, simFn, evalFn);
    const claimHolds = rHold.pass;
    const claimTight = !rTight.pass;

    const refVal = a.reference?.value ?? val;
    const tolFull = (a.reference?.tolFullPct ?? 5) / 100;
    const tolPass = (a.reference?.tolPassPct ?? 10) / 100;
    const err = Math.abs(val - refVal) / Math.max(1, refVal);

    let score = 0;
    if (claimHolds && claimTight && err <= tolFull) score = 100;
    else if (claimHolds && err <= tolPass) score = 70;
    else if (claimHolds) score = 40;
    else score = 0;

    const passed = score >= passScore;
    const resolvedVi = resolveExplainText(a.explain.vi, vars, {
      baseRun,
      baseModel: doc.scenario.model,
      defaultSec: 0,
    }).text;

    return {
      activityId: a.id,
      kind: a.kind,
      passed,
      score,
      stars: starsFromScore(passed, score),
      checks: [
        {
          id: 'claim-holds',
          label: { vi: `Giữ được SLO ở ${Math.round(val)} req/s`, en: `Holds SLO at ${Math.round(val)} req/s` },
          pass: claimHolds,
          weight: 60,
          got: claimHolds ? 'Đạt' : 'Vi phạm SLO',
          want: 'Đạt',
        },
        {
          id: 'claim-tight',
          label: { vi: `Sát giới hạn (${Math.round(val * 1.15)} req/s vượt ngưỡng)`, en: `Tight bound (${Math.round(val * 1.15)} req/s breaches SLO)` },
          pass: claimHolds && claimTight,
          weight: 40,
          got: `${Math.round(val)} req/s`,
          want: `≈ ${refVal} req/s`,
        },
      ],
      verdict: verdictFrom(passed, score),
      vars,
      resolvedExplain: { vi: resolvedVi, en: a.explain.en },
      replay: a.replay ?? a.sim,
    };
  }

  // min-cost
  const rawChanges = answer && answer.objective === 'min-cost' ? answer.changes : [];
  const norm = normalizeAndValidateChanges(rawChanges, doc.scenario.model, a.allowed ?? []);
  if (!norm.valid || norm.changes.length === 0) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [
        {
          id: 'min-cost-valid',
          label: { vi: 'Thay đổi cấu hình hợp lệ', en: 'Valid configuration changes' },
          pass: false,
          weight: 100,
          got: norm.valid ? '0 thay đổi' : 'invalid-change',
          want: '≥ 1 thay đổi hợp lệ',
        },
      ],
      verdict: 'wrong',
      vars,
    };
  }

  const sc: SimScenario = {
    ...doc.scenario,
    durationSec: a.runSec,
    load: a.fixedLoadRps ? { kind: 'steady', rps: a.fixedLoadRps } : doc.scenario.load,
    options: { ...(doc.scenario.options ?? {}), noise: false, maxPackets: 0 },
  };
  const inputRecs = changesToInputRecords(norm.changes, 0);
  const run = simFn(sc, inputRecs);
  const patchedModel = applyChangesToModel(sc.model, inputRecs);
  const results = evalFn(a.constraints, run, patchedModel);
  const allHold = results.every((r) => r.pass);
  const cost = computeModelStaticCostPerHour(patchedModel);
  const parCost = a.par?.costPerHour ?? cost;

  const score = allHold
    ? Math.round(100 * Math.max(0, Math.min(1, parCost / Math.max(1e-6, cost))))
    : 0;
  const passed = allHold && cost <= parCost * 1.25 + 1e-6;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks: [
      ...results.map((r) => ({
        id: r.id,
        label: r.id,
        pass: r.pass,
        weight: 50,
        got: typeof r.actual === 'number' ? Number(r.actual.toFixed(2)) : (r.actual ?? '—'),
        want: r.target,
        worstAtSec: r.worstAtSec,
      })),
      {
        id: 'cost',
        label: { vi: 'Chi phí mỗi giờ', en: 'Hourly cost' },
        pass: cost <= parCost * 1.25 + 1e-6,
        weight: 50,
        got: `$${cost.toFixed(2)}/h`,
        want: `≤ $${(parCost * 1.25).toFixed(2)}/h`,
      },
    ],
    verdict: verdictFrom(passed, score),
    vars,
    usage: { changes: norm.changeCost, costPerHour: cost },
    replay: { ...(a.replay ?? a.sim ?? { simId }), changes: norm.changes },
  };
}

/* ───────────── 3.4 estimate ───────────── */

/** Bộ tính công thức số học an toàn (chỉ hỗ trợ số, biến, `+ - * / ^ ( ) ceil floor`). */
export function evalSafeFormula(expr: string, vars: Record<string, number> = {}): number {
  let s = expr.trim();
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${Number(v)})`);
  }
  // Kiểm tra chỉ chứa token cho phép
  const stripped = s.replace(/\b(ceil|floor)\b/g, '');
  if (!/^[0-9eE.+*/^()\-\s]+$/.test(stripped)) {
    throw new Error(`Công thức không hợp lệ: ${expr}`);
  }

  let pos = 0;
  const peek = () => {
    while (pos < s.length && /\s/.test(s[pos])) pos++;
    return s[pos] ?? '';
  };

  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = s[pos++];
      const rhs = parseTerm();
      v = op === '+' ? v + rhs : v - rhs;
    }
    return v;
  }

  function parseTerm(): number {
    let v = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = s[pos++];
      const rhs = parsePower();
      v = op === '*' ? v * rhs : v / rhs;
    }
    return v;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '^') {
      pos++;
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '+') {
      pos++;
      return parseUnary();
    }
    if (peek() === '-') {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    peek();
    if (s.startsWith('ceil(', pos)) {
      pos += 5;
      const inner = parseExpr();
      if (peek() === ')') pos++;
      return Math.ceil(inner);
    }
    if (s.startsWith('floor(', pos)) {
      pos += 6;
      const inner = parseExpr();
      if (peek() === ')') pos++;
      return Math.floor(inner);
    }
    if (peek() === '(') {
      pos++;
      const inner = parseExpr();
      if (peek() === ')') pos++;
      return inner;
    }
    const start = pos;
    while (pos < s.length && /[0-9eE.+-]/.test(s[pos])) {
      if ((s[pos] === '+' || s[pos] === '-') && pos > start && s[pos - 1].toLowerCase() !== 'e') {
        break;
      }
      pos++;
    }
    const num = Number(s.slice(start, pos));
    if (!Number.isFinite(num)) throw new Error(`Không đọc được số tại "${s.slice(start)}"`);
    return num;
  }

  return parseExpr();
}

export function computeEstimateTruth(a: EstimateActivity, ctx: GradeContext): number {
  const tr = a.truth;
  if (tr.type === 'fixed') return tr.value;
  if (tr.type === 'formula') return evalSafeFormula(tr.expr, tr.vars);
  const simId = a.sim?.simId ?? a.replay?.simId ?? Object.keys(ctx.sims)[0];
  const doc = simId ? ctx.sims[simId] : undefined;
  if (!doc) return 0;
  const f = getScenarioFrameAt(doc.scenario, tr.atSec);
  if (tr.node && f.nodes[tr.node]) {
    const nf = f.nodes[tr.node] as unknown as Record<string, unknown>;
    if (tr.metric === 'p50' || tr.metric === 'p95' || tr.metric === 'p99') {
      return f.nodes[tr.node].latency[tr.metric];
    }
    return typeof nf[tr.metric] === 'number' ? (nf[tr.metric] as number) : 0;
  }
  const gm = f.metrics as unknown as Record<string, unknown>;
  if (tr.metric === 'p50' || tr.metric === 'p95' || tr.metric === 'p99') {
    return f.metrics.latency[tr.metric];
  }
  return typeof gm[tr.metric] === 'number' ? (gm[tr.metric] as number) : 0;
}

function gradeEstimate(a: EstimateActivity, answer: EstimateAnswer, ctx: GradeContext): GradeResult {
  const truth = computeEstimateTruth(a, ctx);
  const vars: Record<string, number | string> = { truth };
  const passScore = a.passScore ?? 70;
  const x = answer && typeof answer.value === 'number' ? answer.value : NaN;

  let score = 0;
  if (Number.isFinite(x) && x > 0 && truth > 0) {
    const err =
      a.scale === 'linear'
        ? Math.abs(x - truth) / truth
        : Math.abs(Math.log10(x / truth));
    if (err <= a.tol.full + 1e-9) score = 100;
    else if (err <= a.tol.pass + 1e-9) score = 70;
    else if (err <= 2 * a.tol.pass + 1e-9) score = 40;
    else score = 0;
  }

  const passed = score >= passScore;
  const simId = a.sim?.simId ?? a.replay?.simId ?? Object.keys(ctx.sims)[0];
  const doc = simId ? ctx.sims[simId] : undefined;
  const baseRun = doc ? getScenarioBaselineRun(doc.scenario, ctx.simulate ?? defaultSimulate) : undefined;
  const resolvedVi = resolveExplainText(a.explain.vi, vars, {
    baseRun,
    baseModel: doc?.scenario.model,
  }).text;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks: [
      {
        id: 'estimate-val',
        label: { vi: a.quantity, en: a.quantity },
        pass: passed,
        weight: 100,
        got: Number.isFinite(x) ? `${Math.round(x * 100) / 100} ${a.unit}` : '—',
        want: `≈ ${Math.round(truth * 100) / 100} ${a.unit}`,
      },
    ],
    verdict: verdictFrom(passed, score),
    vars,
    resolvedExplain: { vi: resolvedVi, en: a.explain.en },
    replay: a.replay ?? a.sim,
  };
}

/* ───────────── 3.5 fix-challenge ───────────── */

export function normalizeAndValidateChanges(
  raw: readonly Change[],
  model: SystemModel,
  allowed: readonly AllowedAction[]
): {
  valid: boolean;
  invalidReason?: string;
  changes: Change[];
  changeCost: number;
} {
  const knobMap = new Map<string, Extract<Change, { type: 'knob' }>>();
  const linkMap = new Map<string, Record<string, unknown>>();

  for (const ch of raw) {
    if (!ch || typeof ch !== 'object') {
      return { valid: false, invalidReason: 'invalid-change', changes: [], changeCost: 0 };
    }
    if (ch.type === 'knob') {
      const rule = allowed.find(
        (al): al is Extract<AllowedAction, { type: 'knob' }> =>
          al.type === 'knob' && al.node === ch.node && al.key === ch.key
      );
      if (!rule) {
        return {
          valid: false,
          invalidReason: `invalid-change:${ch.node}.${ch.key}`,
          changes: [],
          changeCost: 0,
        };
      }
      if (typeof ch.value === 'number') {
        if (rule.min !== undefined && ch.value < rule.min - 1e-9) {
          return { valid: false, invalidReason: 'invalid-change:min', changes: [], changeCost: 0 };
        }
        if (rule.max !== undefined && ch.value > rule.max + 1e-9) {
          return { valid: false, invalidReason: 'invalid-change:max', changes: [], changeCost: 0 };
        }
      }
      if (rule.values && !rule.values.includes(ch.value)) {
        return { valid: false, invalidReason: 'invalid-change:values', changes: [], changeCost: 0 };
      }
      knobMap.set(`${ch.node}:${ch.key}`, ch);
    } else if (ch.type === 'link') {
      const rule = allowed.find(
        (al): al is Extract<AllowedAction, { type: 'link' }> =>
          al.type === 'link' && al.link === ch.link
      );
      if (!rule || !ch.patch || typeof ch.patch !== 'object') {
        return {
          valid: false,
          invalidReason: `invalid-change:link:${ch.link}`,
          changes: [],
          changeCost: 0,
        };
      }
      for (const field of Object.keys(ch.patch)) {
        if (!rule.fields.includes(field as never)) {
          return {
            valid: false,
            invalidReason: `invalid-change:link:${ch.link}.${field}`,
            changes: [],
            changeCost: 0,
          };
        }
      }
      const prev = linkMap.get(ch.link) ?? {};
      linkMap.set(ch.link, { ...prev, ...ch.patch });
    } else {
      return { valid: false, invalidReason: 'invalid-change', changes: [], changeCost: 0 };
    }
  }

  const changes: Change[] = [];
  let changeCost = 0;

  for (const ch of knobMap.values()) {
    const nodeSpec = model.nodes.find((n) => n.id === ch.node);
    const knobSpec = nodeSpec?.knobs.find((k) => k.key === ch.key);
    const origVal = nodeSpec?.params[ch.key] ?? knobSpec?.default;
    if (origVal !== undefined && origVal === ch.value) continue;
    changes.push(ch);
    changeCost += knobSpec?.changeCost ?? 1;
  }

  for (const [linkId, patch] of linkMap.entries()) {
    const linkSpec = model.links.find((l) => l.id === linkId);
    const effectivePatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      const orig = linkSpec ? (linkSpec as unknown as Record<string, unknown>)[k] : undefined;
      if (JSON.stringify(orig) !== JSON.stringify(v)) {
        effectivePatch[k] = v;
        changeCost += 1;
      }
    }
    if (Object.keys(effectivePatch).length > 0) {
      changes.push({ type: 'link', link: linkId, patch: effectivePatch });
    }
  }

  return { valid: true, changes, changeCost };
}

function matchTrap(
  changes: readonly Change[],
  traps: readonly ActivityTrap[] | undefined,
  model: SystemModel,
  allowed: readonly AllowedAction[]
): ActivityTrap | undefined {
  if (!traps || traps.length === 0) return undefined;
  const sigOf = (cs: readonly Change[]) =>
    cs
      .map((c) =>
        c.type === 'knob'
          ? `k:${c.node}.${c.key}=${String(c.value)}`
          : `l:${c.link}=${JSON.stringify(c.patch)}`
      )
      .sort()
      .join('|');
  const targetSig = sigOf(changes);
  for (const tr of traps) {
    const norm = normalizeAndValidateChanges(tr.changes, model, allowed);
    if (norm.valid && sigOf(norm.changes) === targetSig) return tr;
  }
  return undefined;
}

function gradeFix(a: FixActivity, answer: FixAnswer | null, ctx: GradeContext): GradeResult {
  const simFn = ctx.simulate ?? defaultSimulate;
  const evalFn = ctx.evaluate ?? defaultEvaluate;
  const doc = ctx.sims[a.simId];
  const vars: Record<string, number | string> = {};

  if (!doc) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [],
      verdict: 'wrong',
      vars,
    };
  }

  const rawChanges = answer && Array.isArray(answer.changes) ? answer.changes : [];
  const norm = normalizeAndValidateChanges(rawChanges, doc.scenario.model, a.allowed);
  if (!norm.valid) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [
        {
          id: 'invalid-change',
          label: { vi: 'Thay đổi nằm trong phạm vi cho phép', en: 'Changes within allowed actions' },
          pass: false,
          weight: 100,
          got: norm.invalidReason ?? 'invalid-change',
          want: 'allowed',
        },
      ],
      verdict: 'wrong',
      vars,
    };
  }

  const sc: SimScenario = {
    ...doc.scenario,
    durationSec: a.observe.runSec,
    options: { ...(doc.scenario.options ?? {}), maxPackets: 0 },
  };
  const baseRun = getScenarioBaselineRun(sc, simFn);
  const inputRecs = changesToInputRecords(norm.changes, 0);
  const afterRun = norm.changes.length > 0 ? simFn(sc, inputRecs) : baseRun;
  const afterModel = applyChangesToModel(sc.model, inputRecs);

  const goalRes = evalFn(a.goal, afterRun, afterModel);
  const softRes = a.soft ? evalFn(a.soft, afterRun, afterModel) : [];

  const costPerHour = computeModelStaticCostPerHour(afterModel);
  const budgetChangesOk = norm.changeCost <= a.budget.maxChanges;
  const budgetCostOk =
    a.budget.maxCostPerHour === undefined ||
    costPerHour <= a.budget.maxCostPerHour + 1e-6;
  const allGoalsOk = goalRes.every((r) => r.pass);
  const allSoftOk = softRes.every((r) => r.pass);

  const passed = allGoalsOk && budgetChangesOk && budgetCostOk;

  let stars: 0 | 1 | 2 | 3 = 0;
  if (passed) {
    stars = 1;
    if (allSoftOk) {
      stars = 2;
      if (
        norm.changeCost <= a.par.changes &&
        costPerHour <= a.par.costPerHour * 1.1 + 1e-6
      ) {
        stars = 3;
      }
    }
  }

  let wSum = 0;
  let wPass = 0;
  const checks: CheckItem[] = [];

  for (const r of goalRes) {
    wSum += 3;
    if (r.pass) wPass += 3;
    checks.push({
      id: r.id,
      label: { vi: `Mục tiêu: ${r.id}`, en: `Goal: ${r.id}` },
      pass: r.pass,
      weight: 3,
      got: typeof r.actual === 'number' ? Number(r.actual.toFixed(3)) : (r.actual ?? '—'),
      want: r.target,
      worstAtSec: r.worstAtSec,
    });
  }
  for (const r of softRes) {
    wSum += 1;
    if (r.pass) wPass += 1;
    checks.push({
      id: r.id,
      label: { vi: `Điểm cộng: ${r.id}`, en: `Bonus: ${r.id}` },
      pass: r.pass,
      weight: 1,
      got: typeof r.actual === 'number' ? Number(r.actual.toFixed(3)) : (r.actual ?? '—'),
      want: r.target,
      worstAtSec: r.worstAtSec,
    });
  }

  checks.push({
    id: 'budget-changes',
    label: { vi: 'Ngân sách số thay đổi', en: 'Change budget' },
    pass: budgetChangesOk,
    weight: 2,
    got: `${norm.changeCost}`,
    want: `≤ ${a.budget.maxChanges}`,
  });
  if (a.budget.maxCostPerHour !== undefined) {
    checks.push({
      id: 'budget-cost',
      label: { vi: 'Ngân sách chi phí', en: 'Cost budget' },
      pass: budgetCostOk,
      weight: 2,
      got: `$${costPerHour.toFixed(2)}/h`,
      want: `≤ $${a.budget.maxCostPerHour.toFixed(2)}/h`,
    });
  }

  let rawScore = wSum > 0 ? Math.round((wPass / wSum) * 90) : 0;
  if (passed) {
    const bonus = stars === 3 ? 10 : stars === 2 ? 5 : 0;
    rawScore = Math.min(100, Math.max(70, rawScore + bonus));
  } else {
    rawScore = Math.min(69, rawScore);
  }

  const matchedTrap = matchTrap(norm.changes, a.traps, sc.model, a.allowed);
  const resolvedVi = resolveExplainText(a.explain.vi, vars, {
    baseRun,
    baseModel: sc.model,
    afterRun,
    afterModel,
    defaultSec: 60,
  }).text;

  const baseReplay: ReplayRef = a.replay ?? a.sim ?? { simId: a.simId, seekSec: 30 };

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score: rawScore,
    stars,
    checks,
    verdict: verdictFrom(passed, rawScore),
    vars,
    resolvedExplain: { vi: resolvedVi, en: a.explain.en },
    matchedTrap,
    usage: { changes: norm.changeCost, costPerHour },
    replay: { ...baseReplay, changes: norm.changes },
  };
}

/* ───────────── 3.6 order ───────────── */

/** Hoán vị tất định danh sách mục theo `shuffleSeed` (không tự đảo khi trùng thứ tự gốc để doctor bắt `shuffleSeed` xấu). */
export function rawShuffleOrderItems(
  items: readonly OrderItem[],
  shuffleSeed: number
): OrderItem[] {
  const n = items.length;
  if (n <= 1) return [...items];
  const rand = mulberry32(shuffleSeed >>> 0);
  const out = [...items];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Hoán vị tất định danh sách mục theo `shuffleSeed`; đảm bảo khác thứ tự gốc khi n >= 2. */
export function shuffleOrderItems(
  items: readonly OrderItem[],
  shuffleSeed: number
): OrderItem[] {
  const n = items.length;
  if (n <= 1) return [...items];
  const out = rawShuffleOrderItems(items, shuffleSeed);
  const sameAsOrig = out.every((it, idx) => it.id === items[idx].id);
  if (sameAsOrig) {
    const tmp = out[0];
    out[0] = out[1];
    out[1] = tmp;
  }
  return out;
}

function gradeOrder(a: OrderActivity, answer: OrderAnswer | null): GradeResult {
  const n = a.items.length;
  const passScore = a.passScore ?? (n <= 4 ? 100 : 80);
  const order = answer && Array.isArray(answer.order) ? answer.order : [];

  if (order.length !== n || n <= 1) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [
        {
          id: 'order-len',
          label: { vi: 'Thứ tự các bước', en: 'Step ordering' },
          pass: false,
          weight: 100,
          got: `${order.length}/${n}`,
          want: `${n} bước`,
        },
      ],
      verdict: 'wrong',
      vars: {},
      resolvedExplain: a.explain,
    };
  }

  // Nhóm tương đương
  const groupOf = new Map<string, number>();
  a.groups?.forEach((g, gi) => {
    for (const id of g) groupOf.set(id, gi);
  });
  const canonical = (id: string) =>
    groupOf.has(id) ? `g:${groupOf.get(id)}` : `i:${id}`;

  const expectedCanon = a.items.map((it) => canonical(it.id));
  const gotCanon = order.map((id) => canonical(id));

  let correctPairs = 0;
  const validAdjacent = new Set<string>();
  for (let i = 0; i < n - 1; i++) {
    validAdjacent.add(`${expectedCanon[i]}->${expectedCanon[i + 1]}`);
  }
  for (let i = 0; i < n - 1; i++) {
    if (validAdjacent.has(`${gotCanon[i]}->${gotCanon[i + 1]}`)) {
      correctPairs++;
    }
  }

  let score = 0;
  if ((a.partialCredit ?? 'adjacent-pairs') === 'none') {
    score = correctPairs === n - 1 ? 100 : 0;
  } else {
    score = Math.round((correctPairs / (n - 1)) * 100);
  }

  const passed = score >= passScore;
  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks: [
      {
        id: 'order-pairs',
        label: { vi: 'Số cặp liền kề đúng thứ tự', en: 'Correct adjacent pairs' },
        pass: passed,
        weight: 100,
        got: `${correctPairs}/${n - 1}`,
        want: `${n - 1}/${n - 1}`,
      },
    ],
    verdict: verdictFrom(passed, score),
    vars: {},
    resolvedExplain: a.explain,
    replay: a.replay ?? a.sim,
  };
}

/* ───────────── 3.7 timeline-read ───────────── */

/** Bộ kiểm tự động cho 4 câu hỏi của `timeline-read` trên `HistoryOp[]`. */
export function computeTimelineViolations(
  history: readonly HistoryOp[],
  question: TimelineReadActivity['question']
): string[] {
  const writes = history
    .filter((op) => op.op === 'write')
    .sort((a, b) => a.end - b.end);
  const reads = history
    .filter((op) => op.op === 'read')
    .sort((a, b) => a.start - b.start);

  const badIds: string[] = [];

  if (question === 'find-violations-of-ryw') {
    for (const r of reads) {
      const priorClientWrites = writes.filter(
        (w) => w.client === r.client && w.key === r.key && w.end <= r.start
      );
      if (priorClientWrites.length > 0) {
        const latest = priorClientWrites[priorClientWrites.length - 1];
        if (r.value !== latest.value) badIds.push(r.id);
      }
    }
    return badIds;
  }

  if (question === 'find-stale-reads' || question === 'find-linearizability-violations') {
    for (const r of reads) {
      const completedWrites = writes.filter(
        (w) => w.key === r.key && w.end <= r.start
      );
      if (completedWrites.length > 0) {
        const latest = completedWrites[completedWrites.length - 1];
        // Nếu không có write nào đồng thời với r đang ghi giá trị r.value mà r.value != latest.value ⇒ stale
        const concurrentMatch = writes.some(
          (w) =>
            w.key === r.key &&
            w.start <= r.end &&
            w.end >= r.start &&
            w.value === r.value
        );
        if (r.value !== latest.value && !concurrentMatch) {
          badIds.push(r.id);
        }
      }
    }
    return badIds;
  }

  if (question === 'find-non-monotonic') {
    // Monotonic reads: một client đã thấy write w_k (kết thúc ở t_k) thì lượt đọc sau của cùng client không được thấy write cũ hơn w_k
    const writeOrder = new Map<string, number>();
    writes.forEach((w, idx) => writeOrder.set(`${w.key}:${String(w.value)}`, idx));
    const maxSeenByClientKey = new Map<string, number>();
    for (const r of reads) {
      const ck = `${r.client}:${r.key}`;
      const ord = writeOrder.get(`${r.key}:${String(r.value)}`) ?? -1;
      const prevMax = maxSeenByClientKey.get(ck) ?? -1;
      if (ord < prevMax) badIds.push(r.id);
      else maxSeenByClientKey.set(ck, Math.max(prevMax, ord));
    }
    return badIds;
  }

  return badIds;
}

function gradeTimelineRead(
  a: TimelineReadActivity,
  answer: TimelineReadAnswer | null
): GradeResult {
  const picks = new Set(answer && Array.isArray(answer.picks) ? answer.picks : []);
  const expected = new Set(a.expected);
  const passScore = a.passScore ?? 80;

  let tp = 0;
  for (const p of picks) if (expected.has(p)) tp++;

  let score = 0;
  if (a.scoring === 'exact') {
    score = tp === expected.size && picks.size === expected.size ? 100 : 0;
  } else {
    if (expected.size === 0) {
      score = picks.size === 0 ? 100 : 0;
    } else if (picks.size === 0 || tp === 0) {
      score = 0;
    } else {
      const precision = tp / picks.size;
      const recall = tp / expected.size;
      const f1 = (2 * precision * recall) / (precision + recall);
      score = Math.round(f1 * 100);
    }
  }

  const passed = score >= passScore;
  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks: [
      {
        id: 'timeline-picks',
        label: { vi: 'Các thao tác phát hiện đúng', en: 'Correctly identified operations' },
        pass: passed,
        weight: 100,
        got: [...picks].join(', ') || '—',
        want: a.expected.join(', '),
      },
    ],
    verdict: verdictFrom(passed, score),
    vars: {},
    resolvedExplain: a.explain,
    replay: a.replay ?? a.sim,
  };
}

/* ───────────── 3.8 postmortem ───────────── */

function gradePostmortem(
  a: PostmortemActivity,
  answer: PostmortemAnswer | null,
  ctx: GradeContext
): GradeResult {
  const ansMap = answer?.answers ?? {};
  const passScore = a.passScore ?? 70;
  let totalScore = 0;
  let totalWeight = 0;
  const checks: CheckItem[] = [];

  for (const q of a.questions) {
    const picked = ansMap[q.id] ?? [];
    const w = q.weight;
    totalWeight += w;
    let qRatio = 0;

    if (q.type === 'single') {
      qRatio = picked.length === 1 && picked[0] === q.correct[0] ? 1 : 0;
    } else if (q.type === 'multi') {
      const corrSet = new Set(q.correct);
      let okCount = 0;
      let badCount = 0;
      for (const p of new Set(picked)) {
        if (corrSet.has(p)) okCount++;
        else badCount++;
      }
      qRatio =
        corrSet.size > 0
          ? Math.max(0, (okCount - badCount) / corrSet.size)
          : 0;
    } else {
      // rank: tỉ lệ cặp thứ tự đúng
      const m = q.correct.length;
      if (picked.length === m && m > 1) {
        const pos = new Map<string, number>();
        picked.forEach((id, idx) => pos.set(id, idx));
        let okPairs = 0;
        let totPairs = 0;
        for (let i = 0; i < m; i++) {
          for (let j = i + 1; j < m; j++) {
            totPairs++;
            const pi = pos.get(q.correct[i]);
            const pj = pos.get(q.correct[j]);
            if (pi !== undefined && pj !== undefined && pi < pj) okPairs++;
          }
        }
        qRatio = totPairs > 0 ? okPairs / totPairs : 0;
      }
    }

    totalScore += w * qRatio;
    checks.push({
      id: q.id,
      label: q.prompt,
      pass: qRatio >= 0.7,
      weight: w,
      got: picked.join(', ') || '—',
      want: q.correct.join(', '),
    });
  }

  const score = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  const passed = score >= passScore;

  const simId = a.incident.simId;
  const doc = ctx.sims[simId];
  const baseRun = doc
    ? getScenarioBaselineRun(doc.scenario, ctx.simulate ?? defaultSimulate)
    : undefined;
  const resolvedVi = resolveExplainText(a.explain.vi, {}, {
    baseRun,
    baseModel: doc?.scenario.model,
    defaultSec: 30,
  }).text;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars: starsFromScore(passed, score),
    checks,
    verdict: verdictFrom(passed, score),
    vars: {},
    resolvedExplain: { vi: resolvedVi, en: a.explain.en },
    replay: a.replay ?? a.incident,
  };
}

/* ───────────── 3.9 design-constraint ───────────── */

function gradeDesign(
  a: DesignActivity,
  answer: DesignAnswer | null,
  ctx: GradeContext
): GradeResult {
  const simFn = ctx.simulate ?? defaultSimulate;
  const evalFn = ctx.evaluate ?? defaultEvaluate;
  const baseDoc = ctx.sims[a.simId];
  if (!baseDoc) {
    return {
      activityId: a.id,
      kind: a.kind,
      passed: false,
      score: 0,
      stars: 0,
      checks: [],
      verdict: 'wrong',
      vars: {},
    };
  }

  const rawChanges = answer && Array.isArray(answer.changes) ? answer.changes : [];
  const inputRecs = changesToInputRecords(rawChanges, 0);
  const patchedModel = applyChangesToModel(baseDoc.scenario.model, inputRecs);
  const costPerHour = computeModelStaticCostPerHour(patchedModel);
  const budgetCostOk = costPerHour <= a.budget.maxCostPerHour + 1e-6;
  const budgetChangesOk =
    a.budget.maxChanges === undefined || rawChanges.length <= a.budget.maxChanges;

  const checks: CheckItem[] = [];
  let weightedScenarioSum = 0;
  let weightTotal = 0;
  let allHeavyScenariosPass = true;
  let firstAfterRun: RunSeries | undefined;

  for (const scSpec of a.scenarios) {
    const sDoc = ctx.sims[scSpec.simId] ?? baseDoc;
    const sc: SimScenario = {
      ...sDoc.scenario,
      model: baseDoc.scenario.model,
      load: (scSpec.loadOverride as LoadProfile | undefined) ?? sDoc.scenario.load,
      events: (scSpec.events as TimedEvent[] | undefined) ?? sDoc.scenario.events,
      options: { ...(sDoc.scenario.options ?? {}), maxPackets: 0 },
    };
    const run = simFn(sc, inputRecs);
    if (!firstAfterRun) firstAfterRun = run;
    const res = evalFn(scSpec.constraints, run, patchedModel);
    const passCount = res.filter((r) => r.pass).length;
    const passRate = res.length > 0 ? passCount / res.length : 1;
    const scPass = passCount === res.length;
    if (scSpec.weight >= 1 && !scPass) allHeavyScenariosPass = false;
    weightedScenarioSum += scSpec.weight * passRate;
    weightTotal += scSpec.weight;

    checks.push({
      id: `scenario:${scSpec.id}`,
      label: scSpec.label,
      pass: scPass,
      weight: scSpec.weight,
      got: `${passCount}/${res.length} SLO`,
      want: `${res.length}/${res.length} SLO`,
    });
  }

  const structRes =
    a.structural.length > 0 && firstAfterRun
      ? evalFn(a.structural, firstAfterRun, patchedModel)
      : [];
  const structPassCount = structRes.filter((r) => r.pass).length;
  const allStructPass = structPassCount === structRes.length;

  for (const sr of structRes) {
    checks.push({
      id: sr.id,
      label: { vi: `Cấu trúc: ${sr.id}`, en: `Structural: ${sr.id}` },
      pass: sr.pass,
      weight: 1,
      got: sr.pass ? 'Đạt' : 'Chưa đạt',
      want: 'Đạt',
    });
  }

  checks.push({
    id: 'budget-cost',
    label: { vi: 'Ngân sách chi phí', en: 'Cost budget' },
    pass: budgetCostOk && budgetChangesOk,
    weight: 1,
    got: `$${costPerHour.toFixed(2)}/h`,
    want: `≤ $${a.budget.maxCostPerHour.toFixed(2)}/h`,
  });

  const scenarioPart = weightTotal > 0 ? (weightedScenarioSum / weightTotal) * 80 : 80;
  const structPart =
    structRes.length > 0 ? (structPassCount / structRes.length) * 20 : 20;
  const passed =
    allHeavyScenariosPass && budgetCostOk && budgetChangesOk && rawChanges.length > 0;
  const score = passed
    ? Math.max(70, Math.round(scenarioPart + structPart))
    : Math.min(69, Math.round(scenarioPart + structPart));

  let stars: 0 | 1 | 2 | 3 = 0;
  if (passed) {
    stars = 1;
    if (allStructPass) {
      stars = 2;
      const parCost = a.par?.costPerHour ?? a.budget.maxCostPerHour;
      if (costPerHour <= parCost * 1.1 + 1e-6) stars = 3;
    }
  }

  const baseRun = getScenarioBaselineRun(baseDoc.scenario, simFn);
  const resolvedVi = resolveExplainText(a.explain.vi, {}, {
    baseRun,
    baseModel: baseDoc.scenario.model,
    afterRun: firstAfterRun,
    afterModel: patchedModel,
    defaultSec: 60,
  }).text;

  return {
    activityId: a.id,
    kind: a.kind,
    passed,
    score,
    stars,
    checks,
    verdict: verdictFrom(passed, score),
    vars: {},
    resolvedExplain: { vi: resolvedVi, en: a.explain.en },
    usage: { changes: rawChanges.length, costPerHour },
    replay: { ...(a.replay ?? a.sim ?? { simId: a.simId }), changes: rawChanges },
  };
}

/* ───────────── Điểm vào công khai ───────────── */

export function gradeActivity(
  a: Activity,
  answer: ActivityAnswer,
  ctx: GradeContext
): GradeResult {
  switch (a.kind) {
    case 'predict':
      return gradePredict(a, answer as PredictAnswer, ctx);
    case 'spot-bottleneck':
      return gradeSpot(a, answer as SpotAnswer, ctx);
    case 'tune-to-limit':
      return gradeTune(a, answer as TuneAnswer, ctx);
    case 'estimate':
      return gradeEstimate(a, answer as EstimateAnswer, ctx);
    case 'fix-challenge':
      return gradeFix(a, answer as FixAnswer, ctx);
    case 'order':
      return gradeOrder(a, answer as OrderAnswer);
    case 'timeline-read':
      return gradeTimelineRead(a, answer as TimelineReadAnswer);
    case 'postmortem':
      return gradePostmortem(a, answer as PostmortemAnswer, ctx);
    case 'design-constraint':
      return gradeDesign(a, answer as DesignAnswer, ctx);
  }
}

export async function gradeActivityAsync(
  a: Activity,
  answer: ActivityAnswer,
  ctx: GradeContext,
  signal?: AbortSignal
): Promise<GradeResult> {
  if (signal?.aborted) throw new Error('Aborted');
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (signal?.aborted) throw new Error('Aborted');
  return gradeActivity(a, answer, ctx);
}

/** Đáp án rỗng / khởi điểm của từng dạng bài (dùng cho doctor kiểm "không làm gì thì không đạt"). */
export function emptyAnswerForActivity(a: Activity): ActivityAnswer {
  switch (a.kind) {
    case 'predict':
      return null;
    case 'spot-bottleneck':
      return { picks: [] };
    case 'tune-to-limit':
      return a.objective === 'max-load'
        ? { objective: 'max-load', value: 0 }
        : { objective: 'min-cost', changes: [] };
    case 'estimate':
      return null;
    case 'fix-challenge':
      return { changes: [] };
    case 'order':
      return {
        order: shuffleOrderItems(a.items, a.shuffleSeed).map((it) => it.id),
      };
    case 'timeline-read':
      return { picks: [] };
    case 'postmortem':
      return { answers: {} };
    case 'design-constraint':
      return { changes: [] };
  }
}

/** Đáp án mẫu đúng 3 sao của từng dạng bài (dùng cho doctor kiểm "solution đạt 3 sao"). */
export function solutionAnswerForActivity(
  a: Activity,
  ctx: GradeContext
): ActivityAnswer {
  switch (a.kind) {
    case 'predict':
      if (a.question.type === 'node') return { node: a.question.expected[0] };
      if (a.question.type === 'choice') return { choice: a.question.correct };
      return { value: a.question.expected };
    case 'spot-bottleneck':
      return { picks: [...a.expected] };
    case 'tune-to-limit':
      return a.objective === 'max-load'
        ? { objective: 'max-load', value: a.reference?.value ?? 3000 }
        : { objective: 'min-cost', changes: a.solution ?? [] };
    case 'estimate':
      return { value: computeEstimateTruth(a, ctx) };
    case 'fix-challenge':
      return { changes: [...a.solution] };
    case 'order':
      return { order: a.items.map((it) => it.id) };
    case 'timeline-read':
      return { picks: [...a.expected] };
    case 'postmortem': {
      const answers: Record<string, string[]> = {};
      for (const q of a.questions) answers[q.id] = [...q.correct];
      return { answers };
    }
    case 'design-constraint':
      return { changes: [...a.solution.changes] };
  }
}
