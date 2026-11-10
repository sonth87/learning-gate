import { create } from 'zustand';
import { getDb } from '@/db/indexedDbClient';
import { BOX_DAYS, XP, addDays, emptyState, todayStr, type QuestionResult } from '@/features/workpath/logic';
import type { CatalogStatus, ExerciseRecord, WpState, WpView } from '@/features/workpath/types';
import type { DevOpsCourseId } from './types';

export interface CourseNavState {
  view: WpView;
  history: WpView[];
  go: (view: WpView) => void;
  back: () => void;
}

export interface CourseProgressState {
  state: WpState;
  hydrated: boolean;
  hydrate: (force?: boolean) => Promise<void>;
  replaceAll: (s: WpState) => Promise<void>;
  reset: () => Promise<void>;

  markLessonRead: (moduleId: string) => number;
  recordQuiz: (moduleId: string | null, total: number, results: QuestionResult[]) => { xp: number; record: boolean };
  saveCode: (exId: string, code: string) => void;
  recordCheck: (exId: string, passed: number, total: number, ok: boolean, code: string) => { xp: number; first: boolean; attempts: number };
  revealHint: (exId: string, max: number) => number;
  viewSolution: (exId: string) => void;
  resetExercise: (exId: string) => void;
  rateCard: (cardId: string, ok: boolean) => void;
  recordDrill: (drillId: string, accuracy: number, wpm: number) => number;
  setCatalogStatus: (itemId: string, status: CatalogStatus) => number;
}

function createCourseNavStore() {
  return create<CourseNavState>((set, get) => ({
    view: { name: 'home' },
    history: [],
    go: (view) => set({ view, history: [...get().history.slice(-30), get().view] }),
    back: () => {
      const h = get().history;
      if (!h.length) return set({ view: { name: 'home' } });
      set({ view: h[h.length - 1], history: h.slice(0, -1) });
    },
  }));
}

function logXp(s: WpState, event: string, xp: number): void {
  s.xp += xp;
  s.log.push({ t: Date.now(), event, xp });
  if (s.log.length > 2000) s.log = s.log.slice(-2000);
}

const exRec = (s: WpState, id: string): ExerciseRecord =>
  (s.exercises[id] ??= { status: 'todo', attempts: 0, hints: 0 });

function createCourseProgressStore(courseId: DevOpsCourseId) {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = (state: WpState) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      getDb()
        .then((db) => db.put('course_state', { courseId, state }))
        .catch((e) => console.error(`Không lưu được tiến độ khoá ${courseId}:`, e));
    }, 250);
  };

  return create<CourseProgressState>((set, get) => {
    const mutate = <T,>(fn: (s: WpState) => T): T => {
      const next = structuredClone(get().state);
      const out = fn(next);
      set({ state: next });
      persist(next);
      return out;
    };

    return {
      state: emptyState(),
      hydrated: false,

      hydrate: async (force = false) => {
        if (get().hydrated && !force) return;
        try {
          const db = await getDb();
          const rec = await db.get('course_state', courseId);
          if (rec?.state) set({ state: { ...emptyState(), ...rec.state }, hydrated: true });
          else set({ state: emptyState(), hydrated: true });
        } catch (e) {
          console.error(`Không đọc được tiến độ khoá ${courseId}:`, e);
          set({ hydrated: true });
        }
      },

      replaceAll: async (s) => {
        set({ state: { ...emptyState(), ...s }, hydrated: true });
        persist(get().state);
      },

      reset: async () => {
        const fresh = emptyState();
        set({ state: fresh });
        const db = await getDb();
        await db.delete('course_state', courseId);
      },

      markLessonRead: (moduleId) =>
        mutate((s) => {
          if (moduleId in s.lessons) return 0;
          s.lessons[moduleId] = Date.now();
          logXp(s, `lesson:${moduleId}`, XP.lesson);
          return XP.lesson;
        }),

      recordQuiz: (moduleId, total, results) =>
        mutate((s) => {
          const correct = results.filter((r) => r.ok).length;
          const wrong = new Set(s.quizWrong);
          for (const r of results) (r.ok ? wrong.delete(r.id) : wrong.add(r.id));
          s.quizWrong = [...wrong].sort();
          let xp = XP.quizPerCorrect * correct;
          let record = false;
          if (moduleId) {
            const rec = (s.quiz[moduleId] ??= { best: 0, bestCorrect: 0, attempts: 0 });
            rec.attempts += 1;
            if (results.length === total && correct > rec.bestCorrect) {
              xp += XP.quizRecordPerCorrect * (correct - rec.bestCorrect);
              rec.bestCorrect = correct;
              rec.best = Math.round((correct / total) * 1000) / 1000;
              record = true;
            }
          }
          logXp(s, `quiz:${moduleId ?? 'mix'}:${correct}/${results.length}`, xp);
          return { xp, record };
        }),

      saveCode: (exId, code) =>
        mutate((s) => {
          const r = exRec(s, exId);
          r.code = code;
          if (r.status === 'todo') r.status = 'started';
        }),

      recordCheck: (exId, passed, total, ok, code) =>
        mutate((s) => {
          const r = exRec(s, exId);
          r.code = code;
          r.attempts += 1;
          r.lastScore = `${passed}/${total}`;
          let xp = 0;
          let first = false;
          if (ok) {
            first = r.status !== 'passed';
            r.status = 'passed';
            r.passedAt ??= Date.now();
            if (first) {
              xp = r.solutionViewed ? XP.exerciseAfterSolution : XP.exercise;
              logXp(s, `pass:${exId}`, xp);
            }
          } else {
            if (r.status === 'todo') r.status = 'started';
            logXp(s, `fail:${exId}`, 0);
          }
          return { xp, first, attempts: r.attempts };
        }),

      revealHint: (exId, max) =>
        mutate((s) => {
          const r = exRec(s, exId);
          r.hints = Math.min(r.hints + 1, max);
          return r.hints;
        }),

      viewSolution: (exId) =>
        mutate((s) => {
          const r = exRec(s, exId);
          if (r.status !== 'passed') r.solutionViewed = true;
        }),

      resetExercise: (exId) =>
        mutate((s) => {
          const r = exRec(s, exId);
          delete r.code;
          r.status = r.status === 'passed' ? 'passed' : 'todo';
        }),

      rateCard: (cardId, ok) =>
        mutate((s) => {
          const rec = (s.cards[cardId] ??= { box: 0, due: todayStr() });
          rec.box = ok ? Math.min(5, rec.box + 1) : 1;
          rec.due = addDays(todayStr(), BOX_DAYS[Math.max(1, rec.box)]);
          logXp(s, `card:${cardId}`, XP.card);
        }),

      recordDrill: (drillId, accuracy, wpm) =>
        mutate((s) => {
          const rec = (s.drills[drillId] ??= { bestAcc: 0, bestWpm: 0, runs: 0 });
          rec.runs += 1;
          rec.bestAcc = Math.max(rec.bestAcc, Math.round(accuracy * 1000) / 1000);
          if (accuracy >= 0.9) {
            rec.bestWpm = Math.max(rec.bestWpm, Math.round(wpm));
            logXp(s, `drill:${drillId}`, XP.drill);
            return XP.drill;
          }
          logXp(s, `drill:${drillId}`, 0);
          return 0;
        }),

      setCatalogStatus: (itemId, status) =>
        mutate((s) => {
          const old = s.catalog[itemId]?.status ?? 'todo';
          s.catalog[itemId] = { status, t: Date.now() };
          const already = status === 'done' ? ['done', 'rewritten'] : status === 'rewritten' ? ['rewritten'] : [];
          let xp = status === 'done' ? XP.catalogDone : status === 'rewritten' ? XP.catalogRewritten : 0;
          if (xp && !already.includes(old)) {
            if (status === 'rewritten' && old === 'done') xp -= XP.catalogDone;
            logXp(s, `catalog:${status}:${itemId}`, xp);
            return xp;
          }
          logXp(s, `catalog:${status}:${itemId}`, 0);
          return 0;
        }),
    };
  });
}

export const COURSE_NAV_STORES = {
  kube: createCourseNavStore(),
  cicd: createCourseNavStore(),
} as const;

export const COURSE_PROGRESS_STORES = {
  kube: createCourseProgressStore('kube'),
  cicd: createCourseProgressStore('cicd'),
} as const;

export const useKubeNav = COURSE_NAV_STORES.kube;
export const useCicdNav = COURSE_NAV_STORES.cicd;
export const useKubeProgress = COURSE_PROGRESS_STORES.kube;
export const useCicdProgress = COURSE_PROGRESS_STORES.cicd;
