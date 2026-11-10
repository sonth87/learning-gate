import { create } from 'zustand';
import { SkillLevel } from '@/types/curriculum.types';
import { CicdMainTab, CicdStageId } from '../types/cicd.types';

interface CicdNavigationState {
  activeTab: CicdMainTab;
  selectedLessonId: string;
  selectedExerciseId: string;
  selectedBlueprintId: string;
  selectedWarRoomId: string;
  selectedSimulatorMode: 'pipeline' | 'traffic';
  selectedExamId: string;
  filterLevel: SkillLevel | 'all';
  filterStage: CicdStageId | 'all';
  isSearchOpen: boolean;
  isMobileSidebarOpen: boolean;

  setActiveTab: (tab: CicdMainTab) => void;
  selectLesson: (lessonId: string) => void;
  selectExercise: (exerciseId: string) => void;
  selectBlueprint: (blueprintId: string) => void;
  selectWarRoom: (warRoomId: string) => void;
  setSimulatorMode: (mode: 'pipeline' | 'traffic') => void;
  selectExam: (examId: string) => void;
  setFilterLevel: (level: SkillLevel | 'all') => void;
  setFilterStage: (stage: CicdStageId | 'all') => void;
  setSearchOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useCicdNavigationStore = create<CicdNavigationState>((set) => ({
  activeTab: 'learn',
  selectedLessonId: 'cicd-L0-six-pillars-overview',
  selectedExerciseId: 'cicd-ex-1-lean-github-actions',
  selectedBlueprintId: 'full-flow-1-lean-github-actions',
  selectedWarRoomId: 'warroom-b1-42min-pipeline',
  selectedSimulatorMode: 'pipeline',
  selectedExamId: 'cicd-exam-1-fundamental',
  filterLevel: 'all',
  filterStage: 'all',
  isSearchOpen: false,
  isMobileSidebarOpen: false,

  setActiveTab: (activeTab) =>
    set({ activeTab, isMobileSidebarOpen: false }),
  selectLesson: (selectedLessonId) =>
    set({
      activeTab: 'curriculum',
      selectedLessonId,
      isMobileSidebarOpen: false,
    }),
  selectExercise: (selectedExerciseId) =>
    set({
      activeTab: 'practice',
      selectedExerciseId,
      isMobileSidebarOpen: false,
    }),
  selectBlueprint: (selectedBlueprintId) =>
    set({
      activeTab: 'blueprints',
      selectedBlueprintId,
      isMobileSidebarOpen: false,
    }),
  selectWarRoom: (selectedWarRoomId) =>
    set({
      activeTab: 'warroom',
      selectedWarRoomId,
      isMobileSidebarOpen: false,
    }),
  setSimulatorMode: (selectedSimulatorMode) =>
    set({
      activeTab: 'simulator',
      selectedSimulatorMode,
      isMobileSidebarOpen: false,
    }),
  selectExam: (selectedExamId) =>
    set({
      activeTab: 'exams',
      selectedExamId,
      isMobileSidebarOpen: false,
    }),
  setFilterLevel: (filterLevel) => set({ filterLevel }),
  setFilterStage: (filterStage) => set({ filterStage }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
}));
