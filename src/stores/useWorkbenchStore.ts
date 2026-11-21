import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkbenchLang = 'vi' | 'en';
export type WorkbenchTheme = 'light' | 'dark';

export interface RecentStepEntry {
  courseId: string;
  moduleId: string;
  stepIndex: number;
  moduleTitleVi: string;
  moduleTitleEn: string;
  stepTitleVi: string;
  stepTitleEn: string;
  timestamp: number;
}

interface ActiveCourseCursor {
  moduleId: string;
  stepIndex: number;
}

interface WorkbenchState {
  language: WorkbenchLang;
  workbenchTheme: WorkbenchTheme;
  cursors: Record<string, ActiveCourseCursor>;
  expandedLevels: Record<string, number>;
  recentSteps: RecentStepEntry[];
  isProgressExpanded: boolean;
  isSearchPaletteOpen: boolean;
  searchPaletteCourseId: string | null;
  isLeftSidebarCollapsed: boolean;
  rightSidebarWidth: number;

  setLanguage: (language: WorkbenchLang) => void;
  toggleLanguage: () => void;
  setWorkbenchTheme: (theme: WorkbenchTheme) => void;
  toggleWorkbenchTheme: () => void;
  setCourseCursor: (
    courseId: string,
    moduleId: string,
    stepIndex: number,
    meta?: {
      moduleTitleVi: string;
      moduleTitleEn: string;
      stepTitleVi: string;
      stepTitleEn: string;
    }
  ) => void;
  setExpandedLevel: (courseId: string, level: number) => void;
  setProgressExpanded: (open: boolean) => void;
  toggleProgressExpanded: () => void;
  setSearchPaletteOpen: (open: boolean, courseId?: string) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  toggleLeftSidebarCollapsed: () => void;
  setRightSidebarWidth: (width: number) => void;
}

export const DEFAULT_RIGHT_SIDEBAR_WIDTH = 392;

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set) => ({
      language: 'vi',
      workbenchTheme: 'light',
      cursors: {
        pymastery: { moduleId: 'M00', stepIndex: 0 },
        redismastery: { moduleId: 'R00', stepIndex: 0 },
        kubemastery: { moduleId: 'K00', stepIndex: 0 },
        cicdmastery: { moduleId: 'C00', stepIndex: 0 },
        pmpmastery: { moduleId: 'P00', stepIndex: 0 },
      },
      expandedLevels: {
        pymastery: 0,
        redismastery: 0,
        kubemastery: 0,
        cicdmastery: 0,
        pmpmastery: 0,
      },
      recentSteps: [],
      isProgressExpanded: false,
      isSearchPaletteOpen: false,
      searchPaletteCourseId: null,
      isLeftSidebarCollapsed: false,
      rightSidebarWidth: DEFAULT_RIGHT_SIDEBAR_WIDTH,

      setLanguage: (language) => set({ language }),
      toggleLanguage: () =>
        set((s) => ({ language: s.language === 'vi' ? 'en' : 'vi' })),

      setWorkbenchTheme: (workbenchTheme) => set({ workbenchTheme }),
      toggleWorkbenchTheme: () =>
        set((s) => ({
          workbenchTheme: s.workbenchTheme === 'light' ? 'dark' : 'light',
        })),

      setCourseCursor: (courseId, moduleId, stepIndex, meta) =>
        set((s) => {
          const nextCursors = {
            ...s.cursors,
            [courseId]: { moduleId, stepIndex },
          };
          if (!meta) {
            return { cursors: nextCursors };
          }
          const filtered = s.recentSteps.filter(
            (r) => !(r.courseId === courseId && r.moduleId === moduleId)
          );
          const entry: RecentStepEntry = {
            courseId,
            moduleId,
            stepIndex,
            moduleTitleVi: meta.moduleTitleVi,
            moduleTitleEn: meta.moduleTitleEn,
            stepTitleVi: meta.stepTitleVi,
            stepTitleEn: meta.stepTitleEn,
            timestamp: Date.now(),
          };
          return {
            cursors: nextCursors,
            recentSteps: [entry, ...filtered].slice(0, 8),
          };
        }),

      setExpandedLevel: (courseId, level) =>
        set((s) => ({
          expandedLevels: { ...s.expandedLevels, [courseId]: level },
        })),

      setProgressExpanded: (isProgressExpanded) => set({ isProgressExpanded }),
      toggleProgressExpanded: () =>
        set((s) => ({ isProgressExpanded: !s.isProgressExpanded })),

      setSearchPaletteOpen: (isSearchPaletteOpen, courseId) =>
        set((s) => ({
          isSearchPaletteOpen,
          searchPaletteCourseId: isSearchPaletteOpen
            ? (courseId ?? s.searchPaletteCourseId ?? 'pymastery')
            : null,
        })),

      setLeftSidebarCollapsed: (isLeftSidebarCollapsed) =>
        set({ isLeftSidebarCollapsed }),
      toggleLeftSidebarCollapsed: () =>
        set((s) => ({ isLeftSidebarCollapsed: !s.isLeftSidebarCollapsed })),

      setRightSidebarWidth: (width) =>
        set({
          rightSidebarWidth: Math.max(320, Math.min(640, Math.round(width))),
        }),
    }),
    {
      name: 'lg_scale_workbench_v1',
      partialize: (s) => ({
        language: s.language,
        workbenchTheme: s.workbenchTheme,
        cursors: s.cursors,
        expandedLevels: s.expandedLevels,
        recentSteps: s.recentSteps,
        isProgressExpanded: s.isProgressExpanded,
        isLeftSidebarCollapsed: s.isLeftSidebarCollapsed,
        rightSidebarWidth: s.rightSidebarWidth,
      }),
    }
  )
);
