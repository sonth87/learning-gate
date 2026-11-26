/**
 * Kiểu dữ liệu cho 9 dạng bài tập (activities) và bộ chấm điểm (06-activities-and-grading.md §2–§3, §7).
 * Thuần TypeScript: không import React/DOM.
 */
import type {
  Constraint,
   evaluate as EvaluateFn,
  LinkId,
  NodeId,
  NodeState,
  SimScenario,
  simulate as SimulateFn,
} from '../sim';

export interface Loc {
  vi: string;
  en?: string;
}

export type ActivityKind =
  | 'predict'
  | 'spot-bottleneck'
  | 'tune-to-limit'
  | 'estimate'
  | 'fix-challenge'
  | 'order'
  | 'timeline-read'
  | 'postmortem'
  | 'design-constraint';

export type Gate = 'required' | 'optional';

/** Trỏ về một khoảnh khắc trên mô phỏng để nút "Xem trên mô phỏng" mở ra. */
export interface ReplayRef {
  simId: string;
  seekSec?: number;
  changes?: Change[];
  focus?: { nodes?: NodeId[]; links?: LinkId[] };
  speed?: 1 | 2 | 5;
  autoplay?: boolean;
}

/** Thay đổi người học được phép làm (đồng nhất với InputChange tĩnh của engine). */
export type Change =
  | { type: 'knob'; node: NodeId; key: string; value: number | string | boolean }
  | { type: 'link'; link: LinkId; patch: Record<string, unknown> };

export type AllowedAction =
  | {
      type: 'knob';
      node: NodeId;
      key: string;
      min?: number;
      max?: number;
      values?: (number | string | boolean)[];
    }
  | {
      type: 'link';
      link: LinkId;
      fields: ('timeoutMs' | 'retry' | 'breaker' | 'fallback' | 'weight')[];
    };

export interface ActivityBase {
  id: string;
  kind: ActivityKind;
  title: Loc;
  prompt: Loc;
  difficulty: 1 | 2 | 3;
  hints?: Loc[];
  explain: Loc;
  sim?: ReplayRef;
  replay?: ReplayRef;
  passScore?: number;
  xp?: number;
  relatedCards?: string[];
  tags?: string[];
  standalone?: boolean;
}

/* ───────────── 3.1 predict ───────────── */
export type PredictQuestion =
  | {
      type: 'node';
      rule: { first: NodeState; after: number };
      expected: NodeId[];
      partial?: NodeId[];
    }
  | { type: 'choice'; options: Loc[]; correct: number }
  | {
      type: 'number';
      metric: string;
      atSec: number;
      expected: number;
      tolerancePct: number;
      unit?: string;
    };

export interface PredictActivity extends ActivityBase {
  kind: 'predict';
  at: number;
  question: PredictQuestion;
  reveal: { playFromSec: number; playToSec: number; speed?: 1 | 2 | 5 };
}

export type PredictAnswer =
  | { node: NodeId }
  | { choice: number }
  | { value: number }
  | null;

/* ───────────── 3.2 spot-bottleneck ───────────── */
export interface SpotActivity extends ActivityBase {
  kind: 'spot-bottleneck';
  mode: 'bottleneck' | 'spof' | 'slow-dependency' | 'retry-amplifier';
  atSec?: number;
  maxPicks: number;
  expected: NodeId[];
  scoring?: 'jaccard' | 'exact';
}

export interface SpotAnswer {
  picks: NodeId[];
}

/* ───────────── 3.3 tune-to-limit ───────────── */
export interface TuneActivity extends ActivityBase {
  kind: 'tune-to-limit';
  objective: 'max-load' | 'min-cost';
  constraints: Constraint[];
  runSec: number;
  loadUnit?: 'rps';
  reference?: { value: number; tolPassPct: number; tolFullPct: number };
  allowed?: AllowedAction[];
  fixedLoadRps?: number;
  par?: { costPerHour: number; changes: number };
  solution?: Change[];
}

export type TuneAnswer =
  | { objective: 'max-load'; value: number }
  | { objective: 'min-cost'; changes: Change[] }
  | null;

/* ───────────── 3.4 estimate ───────────── */
export interface EstimateActivity extends ActivityBase {
  kind: 'estimate';
  quantity: string;
  unit: string;
  truth:
    | { type: 'fixed'; value: number }
    | { type: 'engine'; metric: string; atSec: number; node?: NodeId }
    | { type: 'formula'; expr: string; vars: Record<string, number> };
  scale: 'linear' | 'log10';
  tol: { full: number; pass: number };
  workings?: Loc[];
  apply?: { node: NodeId; key: string };
}

export type EstimateAnswer = { value: number } | null;

/* ───────────── 3.5 fix-challenge ───────────── */
export interface ActivityTrap {
  id: string;
  label: Loc;
  changes: Change[];
  why: Loc;
}

export interface FixActivity extends ActivityBase {
  kind: 'fix-challenge';
  simId: string;
  presetStart?: string;
  budget: { maxChanges: number; maxCostPerHour?: number };
  allowed: AllowedAction[];
  goal: Constraint[];
  soft?: Constraint[];
  observe: { runSec: number };
  par: { changes: number; costPerHour: number };
  solution: Change[];
  traps?: ActivityTrap[];
}

export interface FixAnswer {
  changes: Change[];
}

/* ───────────── 3.6 order ───────────── */
export interface OrderItem {
  id: string;
  text: Loc;
  why?: Loc;
}

export interface OrderActivity extends ActivityBase {
  kind: 'order';
  items: OrderItem[];
  shuffleSeed: number;
  partialCredit?: 'adjacent-pairs' | 'none';
  groups?: string[][];
}

export interface OrderAnswer {
  order: string[];
}

/* ───────────── 3.7 timeline-read ───────────── */
export interface HistoryOp {
  id: string;
  client: string;
  op: 'write' | 'read';
  key: string;
  value?: number | string;
  start: number;
  end: number;
  node?: string;
}

export interface TimelineReadActivity extends ActivityBase {
  kind: 'timeline-read';
  history: HistoryOp[];
  question:
    | 'find-stale-reads'
    | 'find-violations-of-ryw'
    | 'find-non-monotonic'
    | 'find-linearizability-violations';
  expected: string[];
  scoring?: 'f1' | 'exact';
}

export interface TimelineReadAnswer {
  picks: string[];
}

/* ───────────── 3.8 postmortem ───────────── */
export interface PostmortemQuestion {
  id: string;
  type: 'single' | 'multi' | 'rank';
  prompt: Loc;
  options: { id: string; text: Loc }[];
  correct: string[];
  weight: number;
  explain?: Loc;
}

export interface PostmortemActivity extends ActivityBase {
  kind: 'postmortem';
  incident: ReplayRef;
  questions: PostmortemQuestion[];
  reflection?: { prompt: Loc; saveToNotes?: boolean };
}

export interface PostmortemAnswer {
  answers: Record<string, string[]>;
  reflection?: string;
}

/* ───────────── 3.9 design-constraint ───────────── */
export interface DesignScenarioSpec {
  id: string;
  label: Loc;
  simId: string;
  events?: { at: number; type: string; [k: string]: unknown }[];
  loadOverride?: { kind: string; [k: string]: unknown };
  constraints: Constraint[];
  weight: number;
}

export interface DesignActivity extends ActivityBase {
  kind: 'design-constraint';
  simId: string;
  start: 'preset' | 'empty-canvas';
  presetStart?: string;
  palette?: { kind: string; max: number; unitCostPerHour?: number }[];
  scenarios: DesignScenarioSpec[];
  structural: Constraint[];
  budget: { maxCostPerHour: number; maxChanges?: number };
  par?: { costPerHour: number; changes?: number };
  solution: { changes: Change[] };
  traps?: ActivityTrap[];
}

export interface DesignAnswer {
  changes: Change[];
}

export type Activity =
  | PredictActivity
  | SpotActivity
  | TuneActivity
  | EstimateActivity
  | FixActivity
  | OrderActivity
  | TimelineReadActivity
  | PostmortemActivity
  | DesignActivity;

export type ActivityAnswer =
  | PredictAnswer
  | SpotAnswer
  | TuneAnswer
  | EstimateAnswer
  | FixAnswer
  | OrderAnswer
  | TimelineReadAnswer
  | PostmortemAnswer
  | DesignAnswer;

export interface CheckItem {
  id: string;
  label: Loc | string;
  pass: boolean;
  weight: number;
  got?: number | string;
  want?: number | string;
  worstAtSec?: number;
}

export interface GradeResult {
  activityId: string;
  kind: ActivityKind;
  passed: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  checks: CheckItem[];
  verdict: 'correct' | 'partial' | 'wrong';
  vars: Record<string, number | string>;
  /** giải thích đã nội suy biến {…} */
  resolvedExplain?: Loc;
  /** nếu người học rơi vào một bẫy đã biết */
  matchedTrap?: ActivityTrap;
  usage?: { changes?: number; costPerHour?: number };
  replay?: ReplayRef;
}

export interface SimDocForGrade {
  id: string;
  scenario: SimScenario;
  slos?: Constraint[];
  expect?: Record<string, unknown>;
  presets?: {
    id: string;
    label: Loc;
    changes: Change[];
    expectPass: boolean;
  }[];
}

export interface GradeContext {
  sims: Record<string, SimDocForGrade>;
  simulate?: typeof SimulateFn;
  evaluate?: typeof EvaluateFn;
  hintsUsed?: number;
}

/** XP gốc theo kind (06 §7). */
export const ACTIVITY_DEFAULT_XP: Record<ActivityKind, number> = {
  predict: 6,
  'spot-bottleneck': 8,
  estimate: 8,
  order: 6,
  'timeline-read': 10,
  'tune-to-limit': 15,
  postmortem: 12,
  'fix-challenge': 30,
  'design-constraint': 40,
};

const STAR_MULT: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: 0.6,
  2: 0.85,
  3: 1.0,
};

/**
 * Tính XP thưởng khi nộp activity (06 §7):
 * - Chưa đạt: 0 XP.
 * - Lần đạt đầu tiên: `round(xpBase * starMult[stars] * max(0.4, 1 - 0.15 * hintsUsed))`;
 *   nếu đã xem lời giải trước khi đạt: `floor(xpBase * 0.25)`.
 * - Cải thiện sao ở lần nộp sau: `round(xpBase * (starMult[newStars] - starMult[oldStars]))`.
 */
export function computeActivityXp(opts: {
  xpBase: number;
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  prevPassed: boolean;
  prevStars: 0 | 1 | 2 | 3;
  hintsUsed: number;
  solutionViewed: boolean;
}): number {
  if (!opts.passed || opts.stars === 0) return 0;
  const base = Math.max(0, opts.xpBase);
  if (!opts.prevPassed) {
    if (opts.solutionViewed) return Math.floor(base * 0.25);
    const hintMult = Math.max(0.4, 1 - 0.15 * Math.max(0, opts.hintsUsed));
    return Math.round(base * STAR_MULT[opts.stars] * hintMult);
  }
  if (opts.stars > opts.prevStars && !opts.solutionViewed) {
    return Math.max(
      0,
      Math.round(base * (STAR_MULT[opts.stars] - STAR_MULT[opts.prevStars]))
    );
  }
  return 0;
}
