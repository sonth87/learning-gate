import {
  BOX_DAYS,
  CATALOG_STATUS_LABEL,
  XP,
  activeDays,
  addDays,
  catalogStatus,
  exStatus,
  gradeQuestion,
  lessonRead,
  normalizeOutput,
  quizBest,
  similarity,
  streak,
  todayStr,
  type BrowseFilter,
  type NextStep,
  type QuestionResult,
} from '@/features/workpath/logic';
import type { WpState } from '@/features/workpath/types';
import type {
  DevOpsCatalog,
  DevOpsCatalogItem,
  DevOpsCourseId,
  DevOpsCurriculum,
  DevOpsModule,
} from './types';

export {
  BOX_DAYS,
  CATALOG_STATUS_LABEL,
  XP,
  activeDays,
  addDays,
  catalogStatus,
  exStatus,
  gradeQuestion,
  lessonRead,
  normalizeOutput,
  quizBest,
  similarity,
  streak,
  todayStr,
};
export type { BrowseFilter, NextStep, QuestionResult };

export const DEVOPS_KIND_LABEL: Record<string, { label: string; cls: string }> = {
  good: { label: 'ĐỌC MẪU', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  bug: { label: 'TÌM BUG', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  compare: { label: 'SO SÁNH', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  outdated: { label: 'CẤU HÌNH CŨ', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  project: { label: 'FULL FLOW', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  security: { label: 'BẢO MẬT', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const COURSE_RANKS: Record<DevOpsCourseId, [number, string][]> = {
  kube: [
    [0, 'Tập sự Container'],
    [150, 'Người mới Docker'],
    [500, 'Container Builder'],
    [1200, 'K8s Operator'],
    [2200, 'Cloud Native Engineer'],
    [3600, 'Senior K8s Architect'],
  ],
  cicd: [
    [0, 'Tập sự Đường ống'],
    [150, 'Người mới Workflow'],
    [500, 'Pipeline Builder'],
    [1200, 'Release Engineer'],
    [2200, 'DevSecOps Specialist'],
    [3500, 'Principal CI/CD Architect'],
  ],
};

export function rankOfCourse(courseId: DevOpsCourseId, xp: number): { name: string; toNext: number | null } {
  const ranks = COURSE_RANKS[courseId];
  let name = ranks[0][1];
  let toNext: number | null = null;
  for (const [threshold, label] of ranks) {
    if (xp >= threshold) name = label;
    else if (toNext === null) toNext = threshold - xp;
  }
  return { name, toNext };
}

/** Module được sắp theo (level, order) thay vì mã module */
export function sortedModules(c: DevOpsCurriculum): DevOpsModule[] {
  return [...c.modules].sort((a, b) => a.level - b.level || a.order - b.order);
}

export function courseModuleProgress(s: WpState, m: DevOpsModule, passQuiz: number): [number, number] {
  let done = Number(lessonRead(s, m.id));
  let total = 1;
  if (m.quiz.length) {
    total += 1;
    done += Number(quizBest(s, m.id) >= passQuiz);
  }
  total += m.exercises.length;
  done += m.exercises.filter((e) => exStatus(s, e.id) === 'passed').length;
  return [done, total];
}

export function courseModuleDone(s: WpState, m: DevOpsModule, passQuiz: number): boolean {
  const [d, t] = courseModuleProgress(s, m, passQuiz);
  return d === t;
}

export function courseCurrentLevel(s: WpState, c: DevOpsCurriculum): number {
  const mods = sortedModules(c);
  for (const m of mods) if (!courseModuleDone(s, m, c.passQuiz)) return m.level;
  return mods.length ? Math.max(...mods.map((m) => m.level)) + 1 : 0;
}

export function courseDueCards(s: WpState, c: DevOpsCurriculum, moduleId?: string, includeAll = false) {
  const t = todayStr();
  const out: { id: string; front: string; back: string; moduleId: string }[] = [];
  for (const m of sortedModules(c)) {
    if (moduleId && m.id !== moduleId) continue;
    if (!(includeAll || moduleId || lessonRead(s, m.id))) continue;
    for (const card of m.cards) {
      const rec = s.cards[card.id];
      if (!rec || rec.due <= t) out.push({ ...card, moduleId: m.id });
    }
  }
  return out;
}

export function courseAllQuestions(c: DevOpsCurriculum) {
  const map = new Map<string, DevOpsModule['quiz'][number]>();
  for (const m of c.modules) for (const q of m.quiz) map.set(q.id, q);
  return map;
}

export function courseNextSteps(
  s: WpState,
  c: DevOpsCurriculum,
  catalog: DevOpsCatalog | null,
  courseName: string
): NextStep[] {
  const steps: NextStep[] = [];
  let current: DevOpsModule | null = null;
  for (const m of sortedModules(c)) {
    if (courseModuleDone(s, m, c.passQuiz)) continue;
    current = m;
    if (!lessonRead(s, m.id)) {
      steps.push({ text: `Đọc lý thuyết ${m.id} · ${m.title}`, view: { name: 'module', id: m.id } });
    } else if (m.quiz.length && quizBest(s, m.id) < c.passQuiz) {
      steps.push({
        text: `Làm quiz ${m.id} (cần ≥ ${Math.round(c.passQuiz * 100)}%)`,
        view: { name: 'quiz', mode: 'module', moduleId: m.id },
      });
    }
    for (const ex of m.exercises) {
      const st = exStatus(s, ex.id);
      if (st === 'passed') continue;
      if (st === 'started') {
        steps.push({ text: `Hoàn thành bài ${ex.code} · ${ex.title}`, view: { name: 'exercise', code: ex.code } });
      } else if (lessonRead(s, m.id)) {
        steps.push({ text: `Nhận bài ${ex.code} · ${ex.title}`, view: { name: 'exercise', code: ex.code } });
      }
      break;
    }
    break;
  }
  const due = courseDueCards(s, c).length;
  if (due) steps.push({ text: `Ôn ${due} flashcard đến hạn`, view: { name: 'flash' } });
  if (s.quizWrong.length) steps.push({ text: `Ôn lại ${s.quizWrong.length} câu quiz từng sai`, view: { name: 'quiz', mode: 'review' } });
  if (current && catalog && lessonRead(s, current.id)) {
    for (const r of current.readings) {
      const item = r.catalogN ? catalog.items.find((i) => i.n === r.catalogN) : undefined;
      if (item && ['todo', 'reading'].includes(catalogStatus(s, item.id))) {
        steps.push({ text: `Đọc cấu hình thật: ${r.path}`, view: { name: 'read', n: item.n } });
        break;
      }
    }
  }
  if (!steps.length) {
    steps.push({
      text: `Bạn đã hoàn thành toàn bộ lộ trình ${courseName}! Khám phá thêm kho cấu hình thực tế`,
      view: { name: 'browse', preset: 'all' },
    });
  }
  return steps;
}

export function filterCourseCatalog(
  s: WpState,
  items: DevOpsCatalogItem[],
  f: BrowseFilter,
  myLevel: number
): DevOpsCatalogItem[] {
  const lvl = Math.max(1, myLevel);
  const q = f.q.trim().toLowerCase();
  const res = items.filter((it) => {
    if (f.category && it.category !== f.category) return false;
    if (f.maxLevel !== null && it.level > f.maxLevel) return false;
    if (f.status && catalogStatus(s, it.id) !== f.status) return false;
    if (q && !it.path.toLowerCase().includes(q) && !it.topic.toLowerCase().includes(q)) return false;
    if (f.curated && !it.curated.length) return false;
    if (f.minStars && it.quality < f.minStars) return false;
    if (f.forMe && (it.level > lvl || catalogStatus(s, it.id) !== 'todo')) return false;
    return true;
  });
  return f.forMe
    ? res.sort((a, b) => Number(!b.curated.length) - Number(!a.curated.length) || b.quality - a.quality || a.loc - b.loc)
    : res.sort((a, b) => a.level - b.level || b.quality - a.quality || a.loc - b.loc);
}
