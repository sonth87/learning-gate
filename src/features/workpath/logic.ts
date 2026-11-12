import type {
  CatalogStatus,
  ExerciseStatus,
  WpCatalog,
  WpCatalogItem,
  WpCurriculum,
  WpModule,
  WpQuestion,
  WpState,
  WpView,
} from './types';

export const XP = {
  lesson: 20,
  exercise: 30,
  exerciseAfterSolution: 10,
  quizPerCorrect: 2,
  quizRecordPerCorrect: 5,
  catalogDone: 10,
  catalogRewritten: 25,
  card: 1,
  drill: 5,
} as const;

export const RANKS: [number, string][] = [
  [0, 'Tập sự'],
  [150, 'Người mới'],
  [500, 'Học viên'],
  [1200, 'Coder'],
  [2500, 'Pythonista'],
  [4500, 'Senior Pythonista'],
];

/** Lặp lại ngắt quãng (Leitner): hộp càng cao càng lâu mới hỏi lại */
export const BOX_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

export const KIND_LABEL: Record<string, { label: string; cls: string }> = {
  good: { label: 'ĐỌC MẪU', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  bug: { label: 'TÌM BUG', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  compare: { label: 'SO SÁNH', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  outdated: { label: 'CODE CŨ', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  project: { label: 'PROJECT', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  security: { label: 'NHẬN DIỆN', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const CATALOG_STATUS_LABEL: Record<CatalogStatus, string> = {
  todo: 'chưa đọc',
  reading: 'đang đọc',
  done: 'đã đọc hiểu',
  rewritten: 'đã viết lại',
  skip: 'bỏ qua',
};

export function emptyState(): WpState {
  return {
    v: 1,
    started: todayStr(),
    updatedAt: 0,
    xp: 0,
    lessons: {},
    skippedModules: {},
    skippedLessons: {},
    skippedQuizzes: {},
    quiz: {},
    quizWrong: [],
    exercises: {},
    catalog: {},
    cards: {},
    drills: {},
    log: [],
  };
}

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + days));
}

/* ------------------------------------------------------------------ tiến độ */

export const exStatus = (s: WpState, id: string): ExerciseStatus => s.exercises[id]?.status ?? 'todo';
export const lessonRead = (s: WpState, moduleId: string): boolean => moduleId in s.lessons;
export const quizBest = (s: WpState, moduleId: string): number => s.quiz[moduleId]?.best ?? 0;
export const catalogStatus = (s: WpState, id: string): CatalogStatus => s.catalog[id]?.status ?? 'todo';

export const isModuleSkipped = (s: WpState, moduleId: string): boolean => Boolean(s.skippedModules?.[moduleId]);
export const isLessonSkipped = (s: WpState, moduleId: string): boolean => Boolean(s.skippedLessons?.[moduleId]);
export const isQuizSkipped = (s: WpState, moduleId: string): boolean => Boolean(s.skippedQuizzes?.[moduleId]);

export const lessonSatisfied = (s: WpState, moduleId: string): boolean =>
  lessonRead(s, moduleId) || isLessonSkipped(s, moduleId) || isModuleSkipped(s, moduleId);

export const quizSatisfied = (s: WpState, moduleId: string, passQuiz: number): boolean =>
  quizBest(s, moduleId) >= passQuiz || isQuizSkipped(s, moduleId) || isModuleSkipped(s, moduleId);

export const exSatisfied = (s: WpState, id: string, moduleId?: string): boolean => {
  const st = exStatus(s, id);
  return st === 'passed' || st === 'skipped' || (moduleId ? isModuleSkipped(s, moduleId) : false);
};

/** (số mục đã xong/bỏ qua, tổng số mục) của một module: lesson + quiz đạt + mọi bài tập */
export function moduleProgress(s: WpState, m: WpModule, passQuiz: number): [number, number] {
  const total = 1 + (m.quiz.length ? 1 : 0) + m.exercises.length;
  if (isModuleSkipped(s, m.id)) return [total, total];
  let done = Number(lessonSatisfied(s, m.id));
  if (m.quiz.length) {
    done += Number(quizSatisfied(s, m.id, passQuiz));
  }
  done += m.exercises.filter((e) => exSatisfied(s, e.id)).length;
  return [done, total];
}

export function moduleDone(s: WpState, m: WpModule, passQuiz: number): boolean {
  const [d, t] = moduleProgress(s, m, passQuiz);
  return d === t;
}

/** Cấp độ hiện tại = cấp thấp nhất còn module chưa hoàn thành */
export function currentLevel(s: WpState, c: WpCurriculum): number {
  for (const m of c.modules) if (!moduleDone(s, m, c.passQuiz)) return m.level;
  return Math.max(...c.modules.map((m) => m.level)) + 1;
}

export function rankOf(xp: number): { name: string; toNext: number | null } {
  let name = RANKS[0][1];
  let toNext: number | null = null;
  for (const [threshold, label] of RANKS) {
    if (xp >= threshold) name = label;
    else if (toNext === null) toNext = threshold - xp;
  }
  return { name, toNext };
}

export function activeDays(s: WpState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of s.log) {
    const k = todayStr(new Date(e.t));
    out[k] = (out[k] ?? 0) + Math.max(1, e.xp);
  }
  return out;
}

export function streak(s: WpState): number {
  const days = new Set(Object.keys(activeDays(s)));
  let d = todayStr();
  if (!days.has(d)) d = addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export function dueCards(s: WpState, c: WpCurriculum, moduleId?: string, includeAll = false) {
  const t = todayStr();
  const out: { id: string; front: string; back: string; moduleId: string }[] = [];
  for (const m of c.modules) {
    if (moduleId && m.id !== moduleId) continue;
    if (!(includeAll || moduleId || lessonRead(s, m.id))) continue;
    for (const card of m.cards) {
      const rec = s.cards[card.id];
      if (!rec || rec.due <= t) out.push({ ...card, moduleId: m.id });
    }
  }
  return out;
}

export function allQuestions(c: WpCurriculum): Map<string, WpQuestion> {
  const map = new Map<string, WpQuestion>();
  for (const m of c.modules) for (const q of m.quiz) map.set(q.id, q);
  return map;
}

export type NextStepSkipTarget =
  | { kind: 'lesson'; id: string }
  | { kind: 'quiz'; id: string }
  | { kind: 'exercise'; id: string }
  | { kind: 'module'; id: string }
  | { kind: 'reading'; id: string };

export interface NextStep {
  text: string;
  view: WpView;
  skipTarget?: NextStepSkipTarget;
}

/** Gợi ý "việc nên làm tiếp" — giống `./learn next` */
export function nextSteps(s: WpState, c: WpCurriculum, catalog: WpCatalog | null): NextStep[] {
  const steps: NextStep[] = [];
  let current: WpModule | null = null;
  for (const m of c.modules) {
    if (moduleDone(s, m, c.passQuiz)) continue;
    current = m;
    if (!lessonSatisfied(s, m.id)) {
      steps.push({
        text: `Đọc lý thuyết ${m.id} · ${m.title}`,
        view: { name: 'module', id: m.id },
        skipTarget: { kind: 'lesson', id: m.id },
      });
    } else if (m.quiz.length && !quizSatisfied(s, m.id, c.passQuiz)) {
      steps.push({
        text: `Làm quiz ${m.id} (cần ≥ ${Math.round(c.passQuiz * 100)}%)`,
        view: { name: 'quiz', mode: 'module', moduleId: m.id },
        skipTarget: { kind: 'quiz', id: m.id },
      });
    }
    for (const ex of m.exercises) {
      const st = exStatus(s, ex.id);
      if (st === 'passed' || st === 'skipped') continue;
      if (st === 'started') {
        steps.push({
          text: `Hoàn thành bài ${ex.code} · ${ex.title}`,
          view: { name: 'exercise', code: ex.code },
          skipTarget: { kind: 'exercise', id: ex.id },
        });
      } else if (lessonSatisfied(s, m.id)) {
        steps.push({
          text: `Nhận bài ${ex.code} · ${ex.title}`,
          view: { name: 'exercise', code: ex.code },
          skipTarget: { kind: 'exercise', id: ex.id },
        });
      }
      break;
    }
    break;
  }
  const due = dueCards(s, c).length;
  if (due) steps.push({ text: `Ôn ${due} flashcard đến hạn`, view: { name: 'flash' } });
  if (s.quizWrong.length) steps.push({ text: `Ôn lại ${s.quizWrong.length} câu quiz từng sai`, view: { name: 'quiz', mode: 'review' } });
  if (current && catalog && lessonSatisfied(s, current.id)) {
    for (const r of current.readings) {
      const item = r.catalogN ? catalog.items.find((i) => i.n === r.catalogN) : undefined;
      if (item && ['todo', 'reading'].includes(catalogStatus(s, item.id))) {
        steps.push({
          text: `Đọc code thực tế: ${r.path}`,
          view: { name: 'read', n: item.n },
          skipTarget: { kind: 'reading', id: item.id },
        });
        break;
      }
    }
  }
  if (!steps.length) steps.push({ text: 'Bạn đã xong lộ trình! Chọn một bài ngẫu nhiên trong Python-master', view: { name: 'browse', preset: 'forme' } });
  return steps;
}

/* -------------------------------------------------------------------- quiz */

export const normalizeOutput = (s: string): string =>
  s.trim().split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');

export interface QuestionResult {
  id: string;
  ok: boolean;
  skipped: boolean;
  right: string;
  rightIndex?: number;
  rightBool?: boolean;
  given: unknown;
  explain: string;
  type: WpQuestion['type'];
}

export function gradeQuestion(q: WpQuestion, given: unknown): QuestionResult {
  const skipped = given === null || given === undefined || (q.type === 'output' && String(given).trim() === '');
  const base = { id: q.id, skipped, given, explain: q.explain, type: q.type };
  if (q.type === 'mc') {
    const idx = Number(q.answer);
    return { ...base, ok: !skipped && Number(given) === idx, right: q.choices[idx], rightIndex: idx };
  }
  if (q.type === 'tf') {
    const val = Boolean(q.answer);
    return { ...base, ok: !skipped && given === val, right: val ? 'Đúng' : 'Sai', rightBool: val };
  }
  return { ...base, ok: !skipped && normalizeOutput(String(given)) === normalizeOutput(String(q.answer)), right: String(q.answer) };
}

/* ------------------------------------------------------------ gõ code / điểm */

/** Độ giống nhau 0..1 (2·LCS / (|a|+|b|)) — dùng chấm bài luyện gõ */
export function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const n = a.length;
  const m = b.length;
  let prev = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const cur = new Array<number>(m + 1).fill(0);
    for (let j = 1; j <= m; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return (2 * prev[m]) / (n + m);
}

/* ------------------------------------------------------------ catalog lọc */

export interface BrowseFilter {
  q: string;
  category: string;
  maxLevel: number | null;
  status: CatalogStatus | '';
  minStars: number;
  forMe: boolean;
  curated: boolean;
}

export function filterCatalog(s: WpState, items: WpCatalogItem[], f: BrowseFilter, myLevel: number): WpCatalogItem[] {
  const lvl = Math.max(1, myLevel);
  const q = f.q.trim().toLowerCase();
  const res = items.filter((it) => {
    if (it.flags.includes('duplicate')) return false;
    if (f.category && it.category !== f.category) return false;
    if (f.maxLevel !== null && it.level > f.maxLevel) return false;
    if (f.status && catalogStatus(s, it.id) !== f.status) return false;
    if (q && !it.path.toLowerCase().includes(q)) return false;
    if (f.curated && !it.curated.length) return false;
    if (f.minStars && it.quality < f.minStars) return false;
    if (f.forMe && (it.level > lvl || catalogStatus(s, it.id) !== 'todo' || it.flags.includes('needs-install'))) return false;
    return true;
  });
  return f.forMe
    ? res.sort((a, b) => Number(!b.curated.length) - Number(!a.curated.length) || b.quality - a.quality || a.loc - b.loc)
    : res.sort((a, b) => a.level - b.level || b.quality - a.quality || a.loc - b.loc);
}
