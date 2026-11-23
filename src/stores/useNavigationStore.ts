import { create } from 'zustand';
import { SkillLevel, StageId } from '@/types/curriculum.types';
import { TargetEntityType } from '@/types/user.types';
import { SampleProject } from '@/types/sample.types';

export type MainTab =
  | 'learn'
  | 'curriculum'
  | 'playground'
  | 'practice'
  | 'samples'
  | 'flashcards'
  | 'exams'
  | 'glossary'
  | 'reference';

export interface ActiveTermPopover {
  termId: string;
  anchorRect: { top: number; left: number; bottom: number; width: number };
  pinned: boolean;
}

export interface PinnedTermPopover {
  id: string;
  termId: string;
  anchorRect: { top: number; left: number; bottom: number; width: number };
  position?: { left: number; top: number };
  zIndex: number;
}

interface NavigationState {
  activeTab: MainTab;
  selectedLessonId: string;
  selectedExerciseId: string;
  selectedExamId: string;
  filterLevel: SkillLevel | 'all';
  filterStage: StageId | 'all';
  isSearchOpen: boolean;
  isSettingsOpen: boolean;
  isSetupGuideOpen: boolean;
  setupGuideProject?: SampleProject;
  isMobileSidebarOpen: boolean;
  isMobileTocOpen: boolean;
  notesDrawerTarget: {
    isOpen: boolean;
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
  };
  activePopover: ActiveTermPopover | null;
  pinnedPopovers: PinnedTermPopover[];

  setActiveTab: (tab: MainTab) => void;
  selectLesson: (lessonId: string) => void;
  selectExercise: (exerciseId: string) => void;
  selectExam: (examId: string) => void;
  setFilterLevel: (level: SkillLevel | 'all') => void;
  setFilterStage: (stage: StageId | 'all') => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSetupGuideOpen: (open: boolean, project?: SampleProject) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setMobileTocOpen: (open: boolean) => void;
  openNotesDrawer: (
    targetType: TargetEntityType,
    targetId: string,
    targetTitle: string
  ) => void;
  closeNotesDrawer: () => void;
  showTermPopover: (
    termId: string,
    anchorRect: { top: number; left: number; bottom: number; width: number },
    pinned?: boolean
  ) => void;
  hideTermPopover: (force?: boolean) => void;
  keepTermPopoverOpen: () => void;
  pinActivePopover: () => void;
  closePinnedPopover: (id: string) => void;
  closeAllPinnedPopovers: () => void;
  bringPinnedPopoverToFront: (id: string) => void;
  updatePinnedPopoverPosition: (
    id: string,
    position: { left: number; top: number }
  ) => void;
}

let popoverShowTimeout: ReturnType<typeof setTimeout> | null = null;
let popoverHideTimeout: ReturnType<typeof setTimeout> | null = null;
let pinnedZCounter = 95;

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'learn',
  selectedLessonId: 's0-install-setup-uv-pyenv-ide',
  selectedExerciseId: 'ex-s0-version-cli-check',
  selectedExamId: 'exam-fundamental-basic',
  filterLevel: 'all',
  filterStage: 'all',
  isSearchOpen: false,
  isSettingsOpen: false,
  isSetupGuideOpen: false,
  setupGuideProject: undefined,
  isMobileSidebarOpen: false,
  isMobileTocOpen: false,
  notesDrawerTarget: {
    isOpen: false,
    targetType: 'lesson',
    targetId: 's0-install-setup-uv-pyenv-ide',
    targetTitle: '',
  },
  activePopover: null,
  pinnedPopovers: [],

  setActiveTab: (activeTab) =>
    set({
      activeTab,
      activePopover: null,
      pinnedPopovers: [],
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectLesson: (lessonId) =>
    set({
      activeTab: 'curriculum',
      selectedLessonId: lessonId,
      activePopover: null,
      pinnedPopovers: [],
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectExercise: (exerciseId) =>
    set({
      activeTab: 'practice',
      selectedExerciseId: exerciseId,
      activePopover: null,
      pinnedPopovers: [],
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectExam: (examId) =>
    set({
      activeTab: 'exams',
      selectedExamId: examId,
      activePopover: null,
      pinnedPopovers: [],
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  setFilterLevel: (filterLevel) => set({ filterLevel }),
  setFilterStage: (filterStage) => set({ filterStage }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setSetupGuideOpen: (isSetupGuideOpen, setupGuideProject) =>
    set({
      isSetupGuideOpen,
      setupGuideProject: isSetupGuideOpen ? setupGuideProject : undefined,
    }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  setMobileTocOpen: (isMobileTocOpen) => set({ isMobileTocOpen }),
  openNotesDrawer: (targetType, targetId, targetTitle) =>
    set({
      notesDrawerTarget: { isOpen: true, targetType, targetId, targetTitle },
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  closeNotesDrawer: () =>
    set((s) => ({
      notesDrawerTarget: { ...s.notesDrawerTarget, isOpen: false },
    })),
  showTermPopover: (termId, anchorRect, pinned = false) => {
    // If pinned (user clicked), add/focus in pinnedPopovers so multiple pinned popups can stay open & be dragged
    if (pinned) {
      if (popoverShowTimeout) {
        clearTimeout(popoverShowTimeout);
        popoverShowTimeout = null;
      }
      if (popoverHideTimeout) {
        clearTimeout(popoverHideTimeout);
        popoverHideTimeout = null;
      }
      set((s) => {
        const nextZ = ++pinnedZCounter;
        const existingIdx = s.pinnedPopovers.findIndex((p) => p.termId === termId);
        const nextHover =
          s.activePopover?.termId === termId ? null : s.activePopover;

        if (existingIdx >= 0) {
          const updated = s.pinnedPopovers.map((p, idx) =>
            idx === existingIdx ? { ...p, zIndex: nextZ } : p
          );
          return { activePopover: nextHover, pinnedPopovers: updated };
        }

        const cascadeOffset = (s.pinnedPopovers.length % 5) * 26;
        const cascadedRect = {
          top: anchorRect.top + cascadeOffset,
          left: anchorRect.left + cascadeOffset,
          bottom: anchorRect.bottom + cascadeOffset,
          width: anchorRect.width,
        };

        return {
          activePopover: nextHover,
          pinnedPopovers: [
            ...s.pinnedPopovers,
            {
              id: termId,
              termId,
              anchorRect: cascadedRect,
              zIndex: nextZ,
            },
          ],
        };
      });
      return;
    }

    // Hover mode: cancel any pending hide timer
    if (popoverHideTimeout) {
      clearTimeout(popoverHideTimeout);
      popoverHideTimeout = null;
    }
    // Cancel any previous show timer
    if (popoverShowTimeout) {
      clearTimeout(popoverShowTimeout);
    }
    // Set 260ms intentional hover delay
    popoverShowTimeout = setTimeout(() => {
      popoverShowTimeout = null;
      set((s) => {
        // Don't show a duplicate hover popover if this term is already pinned
        if (s.pinnedPopovers.some((p) => p.termId === termId)) {
          return s;
        }
        return { activePopover: { termId, anchorRect, pinned: false } };
      });
    }, 260);
  },
  hideTermPopover: (force = false) => {
    // Cancel any pending show timer immediately
    if (popoverShowTimeout) {
      clearTimeout(popoverShowTimeout);
      popoverShowTimeout = null;
    }

    if (force) {
      if (popoverHideTimeout) {
        clearTimeout(popoverHideTimeout);
        popoverHideTimeout = null;
      }
      set((s) =>
        s.activePopover === null && s.pinnedPopovers.length === 0
          ? s
          : { activePopover: null, pinnedPopovers: [] }
      );
      return;
    }

    // If mouse left, allow a 180ms grace period so user can cross into the hover popover card
    if (popoverHideTimeout) {
      clearTimeout(popoverHideTimeout);
    }
    popoverHideTimeout = setTimeout(() => {
      popoverHideTimeout = null;
      set((s) => {
        if (!s.activePopover || s.activePopover.pinned) return s;
        return { activePopover: null };
      });
    }, 180);
  },
  keepTermPopoverOpen: () => {
    // When mouse is inside the popover card, cancel hide timer
    if (popoverHideTimeout) {
      clearTimeout(popoverHideTimeout);
      popoverHideTimeout = null;
    }
  },
  pinActivePopover: () =>
    set((s) => {
      if (!s.activePopover) return s;
      const { termId, anchorRect } = s.activePopover;
      const nextZ = ++pinnedZCounter;
      const existing = s.pinnedPopovers.find((p) => p.termId === termId);
      if (existing) {
        return {
          activePopover: null,
          pinnedPopovers: s.pinnedPopovers.map((p) =>
            p.termId === termId ? { ...p, zIndex: nextZ } : p
          ),
        };
      }
      return {
        activePopover: null,
        pinnedPopovers: [
          ...s.pinnedPopovers,
          { id: termId, termId, anchorRect, zIndex: nextZ },
        ],
      };
    }),
  closePinnedPopover: (id) =>
    set((s) => ({
      pinnedPopovers: s.pinnedPopovers.filter((p) => p.id !== id),
    })),
  closeAllPinnedPopovers: () => set({ pinnedPopovers: [] }),
  bringPinnedPopoverToFront: (id) =>
    set((s) => {
      const target = s.pinnedPopovers.find((p) => p.id === id);
      if (!target || target.zIndex === pinnedZCounter) return s;
      const nextZ = ++pinnedZCounter;
      return {
        pinnedPopovers: s.pinnedPopovers.map((p) =>
          p.id === id ? { ...p, zIndex: nextZ } : p
        ),
      };
    }),
  updatePinnedPopoverPosition: (id, position) =>
    set((s) => ({
      pinnedPopovers: s.pinnedPopovers.map((p) =>
        p.id === id ? { ...p, position } : p
      ),
    })),
}));
