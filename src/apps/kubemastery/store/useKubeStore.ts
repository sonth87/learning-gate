import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnimatedFlowType, KubeTab } from '../types/kube.types';

interface KubeStoreState {
  activeTab: KubeTab;
  selectedLessonId: string;
  selectedFlowId: AnimatedFlowType;
  selectedIncidentId: string;
  selectedPracticeId: string;
  completedLessonIds: string[];
  solvedIncidentIds: string[];
  solvedPracticeIds: string[];
  bookmarkedLessonIds: string[];
  bestQuizScore: number;
  isSearchOpen: boolean;

  setActiveTab: (tab: KubeTab) => void;
  selectLesson: (lessonId: string) => void;
  openFlowInStudio: (flowId: AnimatedFlowType) => void;
  openIncidentInWarRoom: (incidentId: string) => void;
  openPracticeLab: (practiceId: string) => void;
  toggleLessonComplete: (lessonId: string) => void;
  markIncidentSolved: (incidentId: string) => void;
  markPracticeSolved: (practiceId: string) => void;
  toggleBookmarkLesson: (lessonId: string) => void;
  setBestQuizScore: (score: number) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useKubeStore = create<KubeStoreState>()(
  persist(
    (set) => ({
      activeTab: 'curriculum',
      selectedLessonId: 'lesson-1-1-essence-oci-cri',
      selectedFlowId: 'code-to-k8s-pipeline',
      selectedIncidentId: 'incident-1-local-docker',
      selectedPracticeId: 'prac-1-dockerfile',
      completedLessonIds: [],
      solvedIncidentIds: [],
      solvedPracticeIds: [],
      bookmarkedLessonIds: [],
      bestQuizScore: 0,
      isSearchOpen: false,

      setActiveTab: (tab) => set({ activeTab: tab }),
      selectLesson: (lessonId) =>
        set({ selectedLessonId: lessonId, activeTab: 'curriculum' }),
      openFlowInStudio: (flowId) =>
        set({ selectedFlowId: flowId, activeTab: 'flow-studio' }),
      openIncidentInWarRoom: (incidentId) =>
        set({ selectedIncidentId: incidentId, activeTab: 'incidents' }),
      openPracticeLab: (practiceId) =>
        set({ selectedPracticeId: practiceId, activeTab: 'practice' }),
      toggleLessonComplete: (lessonId) =>
        set((state) => ({
          completedLessonIds: state.completedLessonIds.includes(lessonId)
            ? state.completedLessonIds.filter((id) => id !== lessonId)
            : [...state.completedLessonIds, lessonId],
        })),
      markIncidentSolved: (incidentId) =>
        set((state) => ({
          solvedIncidentIds: state.solvedIncidentIds.includes(incidentId)
            ? state.solvedIncidentIds
            : [...state.solvedIncidentIds, incidentId],
        })),
      markPracticeSolved: (practiceId) =>
        set((state) => ({
          solvedPracticeIds: state.solvedPracticeIds.includes(practiceId)
            ? state.solvedPracticeIds
            : [...state.solvedPracticeIds, practiceId],
        })),
      toggleBookmarkLesson: (lessonId) =>
        set((state) => ({
          bookmarkedLessonIds: state.bookmarkedLessonIds.includes(lessonId)
            ? state.bookmarkedLessonIds.filter((id) => id !== lessonId)
            : [...state.bookmarkedLessonIds, lessonId],
        })),
      setBestQuizScore: (score) =>
        set((state) => ({
          bestQuizScore: Math.max(state.bestQuizScore, score),
        })),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
    }),
    {
      name: 'kubemastery-learning-store-v1',
    }
  )
);
