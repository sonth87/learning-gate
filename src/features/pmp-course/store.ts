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
import type { WpState } from '@/features/workpath/types';
import type { PmpLearnView, PmpMindmapLink, PmpTab } from './types';
import type { PmpSkipTarget } from './logic';

/* ---------------- App-level Tab, Search & Quick-Preview Store ---------------- */

export interface PmpAppState {
  activeTab: PmpTab;
  isSearchOpen: boolean;
  previewLink: PmpMindmapLink | null;
  selectedDecisionBranchId: string | null;
  setActiveTab: (tab: PmpTab) => void;
  setSearchOpen: (open: boolean) => void;
  openQuickPreview: (link: PmpMindmapLink) => void;
  closeQuickPreview: () => void;
  openDecisionBranch: (branchId: string) => void;
}

export const usePmpAppStore = create<PmpAppState>((set) => ({
  activeTab: 'learn',
  isSearchOpen: false,
  previewLink: null,
  selectedDecisionBranchId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  openQuickPreview: (previewLink) => set({ previewLink }),
  closeQuickPreview: () => set({ previewLink: null }),
  openDecisionBranch: (branchId) =>
    set({ activeTab: 'decision', selectedDecisionBranchId: branchId }),
}));

/* ---------------- Learn Path Navigation Store ---------------- */

export interface PmpNavState {
  view: PmpLearnView;
  history: PmpLearnView[];
  go: (view: PmpLearnView) => void;
  back: () => void;
}

export const usePmpNav = create<PmpNavState>((set, get) => ({
  view: { name: 'home' },
  history: [],
  go: (view) => set({ view, history: [...get().history.slice(-30), get().view] }),
  back: () => {
    const h = get().history;
    if (!h.length) return set({ view: { name: 'home' } });
    set({ view: h[h.length - 1], history: h.slice(0, -1) });
  },
}));

/* ---------------- Durable Progress Store (courseId = 'pmp') ---------------- */

export interface PmpProgressState {
  state: WpState;
  hydrated: boolean;
  syncMeta: StorageSyncMeta;
  hydrate: (force?: boolean) => Promise<void>;
  replaceAll: (s: WpState) => Promise<void>;
  reset: () => Promise<void>;

  markLessonRead: (moduleId: string) => number;
  recordQuiz: (moduleId: string | null, total: number, results: QuestionResult[]) => { xp: number; record: boolean };
  rateCard: (cardId: string, ok: boolean) => void;
  markEvidenceVisited: (linkId: string) => number;
  recordCaseDrill: (caseId: string, passed: boolean) => number;

  toggleSkipModule: (moduleId: string, forceSkip?: boolean) => boolean;
  skipModulesBatch: (moduleIds: string[], skip: boolean) => void;
  toggleSkipLesson: (moduleId: string, forceSkip?: boolean) => boolean;
  toggleSkipQuiz: (moduleId: string, forceSkip?: boolean) => boolean;
  applySkipTarget: (target: PmpSkipTarget) => void;
}

function logXp(s: WpState, event: string, xp: number): void {
  s.xp += xp;
  s.log.push({ t: Date.now(), event, xp });
  if (s.log.length > 2000) s.log = s.log.slice(-2000);
}

function createPmpProgressStore() {
  const slot = 'pmp' as const;
  const initialMirror = readLocalProgressMirror(slot);

  const store = create<PmpProgressState>((set, get) => {
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
        const { state, meta } = await loadDurableProgress(slot, get().state);
        set({ state, hydrated: true, syncMeta: meta });
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

      markEvidenceVisited: (linkId) =>
        mutate((s) => {
          const prev = s.catalog[linkId]?.status ?? 'todo';
          s.catalog[linkId] = { status: 'done', t: Date.now() };
          if (prev !== 'done' && prev !== 'rewritten') {
            logXp(s, `evidence:${linkId}`, XP.catalogDone);
            return XP.catalogDone;
          }
          return 0;
        }),

      recordCaseDrill: (caseId, passed) =>
        mutate((s) => {
          const ex = (s.exercises[caseId] ??= { status: 'todo', attempts: 0, hints: 0 });
          ex.attempts += 1;
          if (passed) {
            const first = ex.status !== 'passed';
            ex.status = 'passed';
            ex.passedAt ??= Date.now();
            if (first) {
              logXp(s, `case:${caseId}`, 15);
              return 15;
            }
          } else if (ex.status === 'todo') {
            ex.status = 'started';
          }
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
        }
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

export const usePmpProgress = createPmpProgressStore();
