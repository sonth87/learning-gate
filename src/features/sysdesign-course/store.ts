/**
 * Store của System Design Mastery (courseId = 'sysdesign'): nav stack tab Learn và tiến độ
 * (hydrate, replaceAll, reset, markLessonRead, recordQuiz, rateCard, skip).
 * TODO(T4.1): activity (recordActivity) thêm ở T4.1.
 */
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
import { BOX_DAYS, XP, addDays, emptyState, todayStr, type QuestionResult } from '@/features/workpath/logic';
import {
  ACTIVITY_DEFAULT_XP,
  computeActivityXp,
  type ActivityKind,
} from './activities/types';
import type { SdLearnView, WpState } from './types';
import type { SdSkipTarget } from './logic';

/* ---------------- Learn Path Navigation Store ---------------- */

export interface SdNavState {
  view: SdLearnView;
  history: SdLearnView[];
  go: (view: SdLearnView) => void;
  back: () => void;
}

export const useSdNav = create<SdNavState>((set, get) => ({
  view: { name: 'workbench' },
  history: [],
  go: (view) => set({ view, history: [...get().history.slice(-30), get().view] }),
  back: () => {
    const h = get().history;
    if (!h.length) return set({ view: { name: 'workbench' } });
    set({ view: h[h.length - 1], history: h.slice(0, -1) });
  },
}));

/* ---------------- Durable Progress Store (courseId = 'sysdesign') ---------------- */

export interface SdProgressState {
  state: WpState;
  hydrated: boolean;
  syncMeta: StorageSyncMeta;
  hydrate: (force?: boolean) => Promise<void>;
  replaceAll: (s: WpState) => Promise<void>;
  reset: () => Promise<void>;

  markLessonRead: (moduleId: string) => number;
  recordQuiz: (moduleId: string | null, total: number, results: QuestionResult[]) => { xp: number; record: boolean };
  rateCard: (cardId: string, ok: boolean) => void;

  recordActivity: (r: {
    activityId: string;
    kind: ActivityKind;
    xpBase?: number;
    score: number;
    stars: 0 | 1 | 2 | 3;
    passed: boolean;
    hintsUsed: number;
    solutionViewed: boolean;
  }) => { xp: number; first: boolean; improved: boolean };
  saveActivityDraft: (activityId: string, draftJson: string) => void;
  markActivitySolutionViewed: (activityId: string) => void;
  skipActivity: (activityId: string) => void;

  toggleSkipModule: (moduleId: string, forceSkip?: boolean) => boolean;
  skipModulesBatch: (moduleIds: string[], skip: boolean) => void;
  toggleSkipLesson: (moduleId: string, forceSkip?: boolean) => boolean;
  toggleSkipQuiz: (moduleId: string, forceSkip?: boolean) => boolean;
  applySkipTarget: (target: SdSkipTarget) => void;
}

function logXp(s: WpState, event: string, xp: number): void {
  s.xp += xp;
  s.log.push({ t: Date.now(), event, xp });
  if (s.log.length > 2000) s.log = s.log.slice(-2000);
}

function createSdProgressStore() {
  const slot = 'sysdesign' as const;
  const initialMirror = readLocalProgressMirror(slot);

  const store = create<SdProgressState>((set, get) => {
    const updateMeta = (patch: Partial<StorageSyncMeta>) =>
      set((cur) => ({ syncMeta: { ...cur.syncMeta, ...patch } }));

    const mutate = <T,>(fn: (s: WpState) => T): T => {
      const latestMirror = readLocalProgressMirror(slot);
      const baseState =
        latestMirror && (latestMirror.updatedAt ?? 0) > (get().state.updatedAt ?? 0)
          ? mergeWpStates(get().state, latestMirror)
          : get().state;

      const next = structuredClone(baseState);
      const out = fn(next);
      next.updatedAt = Date.now();
      delete next.resetAt;
      set({ state: next });
      void saveDurableProgress(slot, next, updateMeta);
      return out;
    };

    return {
      state: initialMirror ?? emptyState(),
      hydrated: false,
      syncMeta: {
        status: initialMirror ? 'local-only' : 'idle',
        localOk: initialMirror !== null,
        idbOk: false,
        persistedGranted: null,
        lastSavedAt: initialMirror?.updatedAt && initialMirror.updatedAt > 0 ? initialMirror.updatedAt : null,
      },

      hydrate: async (force = false) => {
        if (get().hydrated && !force) return;
        try {
          const { state, meta } = await loadDurableProgress(slot, get().state);
          set({ state, hydrated: true, syncMeta: meta });
        } catch (err) {
          console.warn('[useSdProgress] Không thể tải IndexedDB, dùng bản LocalStorage/RAM:', err);
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
        await saveDurableProgress(slot, next, updateMeta);
      },

      reset: async () => {
        const fresh = await clearDurableProgress(slot);
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

      rateCard: (cardId, ok) =>
        mutate((s) => {
          const rec = (s.cards[cardId] ??= { box: 0, due: todayStr() });
          rec.box = ok ? Math.min(5, rec.box + 1) : 1;
          rec.due = addDays(todayStr(), BOX_DAYS[Math.max(1, rec.box)]);
          logXp(s, `card:${cardId}`, XP.card);
        }),

      recordActivity: (r) =>
        mutate((s) => {
          const rec = (s.exercises[r.activityId] ??= {
            status: 'todo',
            attempts: 0,
            hints: 0,
          });
          const prevPassed = rec.status === 'passed';
          const prevStars = (rec.stars ?? 0) as 0 | 1 | 2 | 3;
          const prevBest = rec.best ?? 0;
          const solViewed = Boolean(rec.solutionViewed || r.solutionViewed);

          rec.attempts += 1;
          rec.hints = Math.max(rec.hints, r.hintsUsed);
          if (solViewed) rec.solutionViewed = true;
          rec.lastScore = String(Math.round(r.score));
          rec.best = Math.max(prevBest, Math.round(r.score));
          rec.stars = Math.max(prevStars, r.stars) as 0 | 1 | 2 | 3;

          if (r.passed) {
            rec.status = 'passed';
            rec.passedAt ??= Date.now();
            delete rec.skippedAt;
          } else if (rec.status === 'todo') {
            rec.status = 'started';
          }

          const xpBase = r.xpBase ?? ACTIVITY_DEFAULT_XP[r.kind] ?? 10;
          const xp = computeActivityXp({
            xpBase,
            passed: r.passed,
            stars: r.stars,
            prevPassed,
            prevStars,
            hintsUsed: rec.hints,
            solutionViewed: solViewed,
          });
          if (xp > 0) {
            logXp(s, `activity:${r.activityId}:${Math.round(r.score)}`, xp);
          }

          return {
            xp,
            first: r.passed && !prevPassed,
            improved:
              r.stars > prevStars || Math.round(r.score) - prevBest >= 5,
          };
        }),

      saveActivityDraft: (activityId, draftJson) =>
        mutate((s) => {
          const rec = (s.exercises[activityId] ??= {
            status: 'todo',
            attempts: 0,
            hints: 0,
          });
          if (rec.status === 'todo') rec.status = 'started';
          rec.code = draftJson.slice(0, 4096);
        }),

      markActivitySolutionViewed: (activityId) =>
        mutate((s) => {
          const rec = (s.exercises[activityId] ??= {
            status: 'todo',
            attempts: 0,
            hints: 0,
          });
          if (rec.status === 'todo') rec.status = 'started';
          rec.solutionViewed = true;
        }),

      skipActivity: (activityId) =>
        mutate((s) => {
          const rec = (s.exercises[activityId] ??= {
            status: 'todo',
            attempts: 0,
            hints: 0,
          });
          if (rec.status !== 'passed') {
            rec.status = 'skipped';
            rec.skippedAt = Date.now();
          }
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

      applySkipTarget: (target) => {
        if (target.kind === 'module') get().toggleSkipModule(target.id, true);
        else if (target.kind === 'lesson') get().toggleSkipLesson(target.id, true);
        else get().toggleSkipQuiz(target.id, true);
      },
    };
  });

  if (typeof window !== 'undefined') {
    const mirrorKey = getLocalMirrorKey(slot);
    window.addEventListener('storage', (ev) => {
      if (ev.key === mirrorKey && ev.newValue) {
        const incoming = readLocalProgressMirror(slot);
        if (incoming) {
          const merged = mergeWpStates(store.getState().state, incoming);
          store.setState({ state: merged });
        }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const incoming = readLocalProgressMirror(slot);
        if (incoming && (incoming.updatedAt ?? 0) > (store.getState().state.updatedAt ?? 0)) {
          const merged = mergeWpStates(store.getState().state, incoming);
          store.setState({ state: merged });
        }
      }
    });
  }

  return store;
}

export const useSdProgress = createSdProgressStore();
