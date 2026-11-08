import { create } from 'zustand';
import { SkillLevel, StageId } from '@/types/curriculum.types';
import { TargetEntityType } from '@/types/user.types';

export type MainTab =
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
  isMobileSidebarOpen: boolean;
  isMobileTocOpen: boolean;
  notesDrawerTarget: {
    isOpen: boolean;
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
  };
  activePopover: ActiveTermPopover | null;

  setActiveTab: (tab: MainTab) => void;
  selectLesson: (lessonId: string) => void;
  selectExercise: (exerciseId: string) => void;
  selectExam: (examId: string) => void;
  setFilterLevel: (level: SkillLevel | 'all') => void;
  setFilterStage: (stage: StageId | 'all') => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSetupGuideOpen: (open: boolean) => void;
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
}

let popoverShowTimeout: ReturnType<typeof setTimeout> | null = null;
let popoverHideTimeout: ReturnType<typeof setTimeout> | null = null;

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'curriculum',
  selectedLessonId: 's0-install-setup-uv-pyenv-ide',
  selectedExerciseId: 'ex-s0-version-cli-check',
  selectedExamId: 'exam-fundamental-basic',
  filterLevel: 'all',
  filterStage: 'all',
  isSearchOpen: false,
  isSettingsOpen: false,
  isSetupGuideOpen: false,
  isMobileSidebarOpen: false,
  isMobileTocOpen: false,
  notesDrawerTarget: {
    isOpen: false,
    targetType: 'lesson',
    targetId: 's0-install-setup-uv-pyenv-ide',
    targetTitle: '',
  },
  activePopover: null,

  setActiveTab: (activeTab) =>
    set({
      activeTab,
      activePopover: null,
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectLesson: (lessonId) =>
    set({
      activeTab: 'curriculum',
      selectedLessonId: lessonId,
      activePopover: null,
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectExercise: (exerciseId) =>
    set({
      activeTab: 'practice',
      selectedExerciseId: exerciseId,
      activePopover: null,
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  selectExam: (examId) =>
    set({
      activeTab: 'exams',
      selectedExamId: examId,
      activePopover: null,
      isMobileSidebarOpen: false,
      isMobileTocOpen: false,
    }),
  setFilterLevel: (filterLevel) => set({ filterLevel }),
  setFilterStage: (filterStage) => set({ filterStage }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setSetupGuideOpen: (isSetupGuideOpen) => set({ isSetupGuideOpen }),
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
    // If pinned (user clicked), show immediately and cancel any pending timers
    if (pinned) {
      if (popoverShowTimeout) {
        clearTimeout(popoverShowTimeout);
        popoverShowTimeout = null;
      }
      if (popoverHideTimeout) {
        clearTimeout(popoverHideTimeout);
        popoverHideTimeout = null;
      }
      set({ activePopover: { termId, anchorRect, pinned: true } });
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
        if (s.activePopover?.pinned && s.activePopover.termId !== termId) {
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
      set({ activePopover: null });
      return;
    }

    // If mouse left, allow a 180ms grace period so user can cross into the popover card
    if (popoverHideTimeout) {
      clearTimeout(popoverHideTimeout);
    }
    popoverHideTimeout = setTimeout(() => {
      popoverHideTimeout = null;
      set((s) => {
        if (s.activePopover?.pinned) return s;
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
}));
