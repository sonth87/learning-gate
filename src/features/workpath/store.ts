import { create } from 'zustand';
import {
  clearDurableProgress,
  getLocalMirrorKey,
  loadDurableProgress,
  mergeWpStates,
  normalizeWpState,
  readLocalProgressMirror,
  saveDurableProgress,
  type StorageSyncMeta,
} from '@/db/durableProgressStorage';
import {
  BOX_DAYS,
  XP,
  addDays,
  emptyState,
  gradeQuestion,
  todayStr,
  type NextStepSkipTarget,
  type QuestionResult,
} from './logic';
import type { CatalogStatus, ExerciseRecord, WpState, WpView } from './types';

/* ------------------------------------------------------------ điều hướng */

interface NavState {
  view: WpView;
  history: WpView[];
  go: (view: WpView) => void;
  back: () => void;
}

export const useWpNav = create<NavState>((set, get) => ({
  view: { name: 'home' },
  history: [],
  go: (view) => set({ view, history: [...get().history.slice(-30), get().view] }),
  back: () => {
    const h = get().history;
    if (!h.length) return set({ view: { name: 'home' } });
    set({ view: h[h.length - 1], history: h.slice(0, -1) });
  },
}));

/* ------------------------------------------------------------ tiến độ học */

interface ProgressStore {
  state: WpState;
  hydrated: boolean;
  syncMeta: StorageSyncMeta;
  hydrate: (force?: boolean) => Promise<void>;
  /** Thay toàn bộ (dùng khi nhập bản sao lưu) */
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

  /** Bỏ qua / khôi phục cho phần người học đã làm rồi hoặc đã nắm vững */
  toggleSkipModule: (moduleId: string, forceSkip?: boolean) => boolean;
  skipModulesBatch: (moduleIds: string[], skip: boolean) => void;
  toggleSkipLesson: (moduleId: string, forceSkip?: boolean) => boolean;
  toggleSkipQuiz: (moduleId: string, forceSkip?: boolean) => boolean;
  toggleSkipExercise: (exId: string, forceSkip?: boolean) => boolean;
  applySkipTarget: (target: NextStepSkipTarget) => void;
}

function logXp(s: WpState, event: string, xp: number): void {
  s.xp += xp;
  s.log.push({ t: Date.now(), event, xp });
  if (s.log.length > 2000) s.log = s.log.slice(-2000);
}

const exRec = (s: WpState, id: string): ExerciseRecord =>
  (s.exercises[id] ??= { status: 'todo', attempts: 0, hints: 0 });

const initialWpMirror = readLocalProgressMirror('wp');

export const useWpProgress = create<ProgressStore>((set, get) => {
  const updateMeta = (patch: Partial<StorageSyncMeta>) =>
    set((cur) => ({ syncMeta: { ...cur.syncMeta, ...patch } }));

  /** Hợp nhất tab khác (nếu có), sao chép state, áp dụng thay đổi, lưu kép LocalStorage + IndexedDB */
  const mutate = <T,>(fn: (s: WpState) => T): T => {
    const latestMirror = readLocalProgressMirror('wp');
    const baseState =
      latestMirror && (latestMirror.updatedAt ?? 0) > (get().state.updatedAt ?? 0)
        ? mergeWpStates(get().state, latestMirror)
        : get().state;

    const next = structuredClone(baseState);
    const out = fn(next);
    next.updatedAt = Date.now();
    delete next.resetAt;
    set({ state: next });
    void saveDurableProgress('wp', next, updateMeta);
    return out;
  };

  return {
    state: initialWpMirror ?? emptyState(),
    hydrated: false,
    syncMeta: {
      status: initialWpMirror ? 'local-only' : 'idle',
      localOk: initialWpMirror !== null,
      idbOk: false,
      persistedGranted: null,
      lastSavedAt: initialWpMirror?.updatedAt && initialWpMirror.updatedAt > 0 ? initialWpMirror.updatedAt : null,
    },

    hydrate: async (force = false) => {
      if (get().hydrated && !force) return;
      try {
        const { state, meta } = await loadDurableProgress('wp', get().state);
        set({ state, hydrated: true, syncMeta: meta });
      } catch (err) {
        console.warn('[useWpProgress] Không thể tải IndexedDB, dùng bản LocalStorage/RAM:', err);
        set({
          hydrated: true,
          syncMeta: {
            ...get().syncMeta,
            status: get().syncMeta.localOk ? 'local-only' : 'error',
            idbOk: false,
          },
        });
      }
    },

    replaceAll: async (s) => {
      const next = normalizeWpState({ ...s, updatedAt: Date.now() });
      set({ state: next, hydrated: true });
      await saveDurableProgress('wp', next, updateMeta);
    },

    reset: async () => {
      const fresh = await clearDurableProgress('wp');
      set({
        state: fresh,
        hydrated: true,
        syncMeta: {
          ...get().syncMeta,
          status: 'synced',
          lastSavedAt: fresh.updatedAt ?? Date.now(),
        },
      });
    },

    markLessonRead: (moduleId) =>
      mutate((s) => {
        if (s.skippedLessons) delete s.skippedLessons[moduleId];
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
          if (rec.best >= 0.7 && s.skippedQuizzes) {
            delete s.skippedQuizzes[moduleId];
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
          delete r.skippedAt;
          r.passedAt ??= Date.now();
          if (first) {
            xp = r.solutionViewed ? XP.exerciseAfterSolution : XP.exercise;
            logXp(s, `pass:${exId}`, xp);
          }
        } else {
          if (r.status === 'todo' || r.status === 'skipped') {
            r.status = 'started';
            delete r.skippedAt;
          }
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
        delete r.skippedAt;
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

    toggleSkipModule: (moduleId, forceSkip) =>
      mutate((s) => {
        const map = (s.skippedModules ??= {});
        const shouldSkip = forceSkip ?? !(moduleId in map);
        if (shouldSkip) map[moduleId] = Date.now();
        else delete map[moduleId];
        return shouldSkip;
      }),

    skipModulesBatch: (moduleIds, skip) =>
      mutate((s) => {
        const map = (s.skippedModules ??= {});
        const now = Date.now();
        for (const id of moduleIds) {
          if (skip) map[id] = now;
          else delete map[id];
        }
      }),

    toggleSkipLesson: (moduleId, forceSkip) =>
      mutate((s) => {
        const map = (s.skippedLessons ??= {});
        const shouldSkip = forceSkip ?? !(moduleId in map);
        if (shouldSkip) map[moduleId] = Date.now();
        else delete map[moduleId];
        return shouldSkip;
      }),

    toggleSkipQuiz: (moduleId, forceSkip) =>
      mutate((s) => {
        const map = (s.skippedQuizzes ??= {});
        const shouldSkip = forceSkip ?? !(moduleId in map);
        if (shouldSkip) map[moduleId] = Date.now();
        else delete map[moduleId];
        return shouldSkip;
      }),

    toggleSkipExercise: (exId, forceSkip) =>
      mutate((s) => {
        const r = exRec(s, exId);
        if (r.status === 'passed') return false;
        const shouldSkip = forceSkip ?? r.status !== 'skipped';
        if (shouldSkip) {
          r.status = 'skipped';
          r.skippedAt = Date.now();
        } else {
          r.status = r.code ? 'started' : 'todo';
          delete r.skippedAt;
        }
        return shouldSkip;
      }),

    applySkipTarget: (target) => {
      switch (target.kind) {
        case 'module':
          get().toggleSkipModule(target.id, true);
          break;
        case 'lesson':
          get().toggleSkipLesson(target.id, true);
          break;
        case 'quiz':
          get().toggleSkipQuiz(target.id, true);
          break;
        case 'exercise':
          get().toggleSkipExercise(target.id, true);
          break;
        case 'reading':
          get().setCatalogStatus(target.id, 'skip');
          break;
      }
    },
  };
});

if (typeof window !== 'undefined') {
  const mirrorKey = getLocalMirrorKey('wp');
  window.addEventListener('storage', (ev) => {
    if (ev.key === mirrorKey && ev.newValue) {
      const incoming = readLocalProgressMirror('wp');
      if (incoming) {
        const merged = mergeWpStates(useWpProgress.getState().state, incoming);
        useWpProgress.setState({ state: merged });
      }
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const incoming = readLocalProgressMirror('wp');
      if (incoming && (incoming.updatedAt ?? 0) > (useWpProgress.getState().state.updatedAt ?? 0)) {
        const merged = mergeWpStates(useWpProgress.getState().state, incoming);
        useWpProgress.setState({ state: merged });
      }
    }
  });
}

/** Chấm một bộ câu hỏi quiz và trả về kết quả từng câu */
export function gradeQuiz(
  questions: Parameters<typeof gradeQuestion>[0][],
  answers: Record<string, unknown>
): QuestionResult[] {
  return questions.map((q) => gradeQuestion(q, answers[q.id] ?? null));
}
