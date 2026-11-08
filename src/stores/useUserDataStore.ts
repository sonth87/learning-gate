import { create } from 'zustand';
import {
  ExerciseSubmissionRecord,
  TargetEntityType,
  UserBookmark,
  UserNote,
} from '@/types/user.types';
import {
  ExamAttemptRecord,
  FlashcardSrsState,
  SrsRating,
} from '@/types/assessment.types';
import { SkillLevel } from '@/types/curriculum.types';
import { notesRepo } from '@/db/notesRepo';
import { progressRepo } from '@/db/progressRepo';
import { srsRepo } from '@/db/srsRepo';
import { examRepo } from '@/db/examRepo';

export const REQUIRED_LESSON_STUDY_SECONDS = 600; // 10 minutes
const LESSON_STUDY_SECONDS_STORAGE_KEY = 'pylearn_lesson_study_seconds_v1';

function loadLessonStudySeconds(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LESSON_STUDY_SECONDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, number>;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveLessonStudySeconds(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      LESSON_STUDY_SECONDS_STORAGE_KEY,
      JSON.stringify(map)
    );
  } catch {
    // ignore storage errors
  }
}

interface UserDataState {
  isHydrated: boolean;
  completedLessonIds: string[];
  lessonStudySeconds: Record<string, number>;
  notes: UserNote[];
  bookmarks: UserBookmark[];
  submissions: Record<string, ExerciseSubmissionRecord>;
  srsStates: Record<string, FlashcardSrsState>;
  examHistory: ExamAttemptRecord[];

  hydrateAll: () => Promise<void>;
  toggleLessonComplete: (lessonId: string) => Promise<void>;
  addLessonStudyTime: (lessonId: string, deltaSeconds?: number) => Promise<void>;
  toggleBookmark: (params: {
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
    level: SkillLevel;
  }) => Promise<void>;
  addOrUpdateNote: (params: {
    id?: string;
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
    content: string;
  }) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  saveExerciseSubmission: (
    exerciseId: string,
    code: string,
    passed: boolean
  ) => Promise<void>;
  rateFlashcard: (cardId: string, rating: SrsRating) => Promise<void>;
  recordExamAttempt: (
    attempt: Omit<ExamAttemptRecord, 'id' | 'completedAt'>
  ) => Promise<void>;
}

export const useUserDataStore = create<UserDataState>((set, get) => ({
  isHydrated: false,
  completedLessonIds: [],
  lessonStudySeconds: loadLessonStudySeconds(),
  notes: [],
  bookmarks: [],
  submissions: {},
  srsStates: {},
  examHistory: [],

  hydrateAll: async () => {
    const [
      completedLessonIds,
      notes,
      bookmarks,
      submissions,
      srsStates,
      examHistory,
    ] = await Promise.all([
      progressRepo.getCompletedLessonIds(),
      notesRepo.getAllNotes(),
      progressRepo.getAllBookmarks(),
      progressRepo.getAllSubmissions(),
      srsRepo.getAllSrsStates(),
      examRepo.getAllAttempts(),
    ]);

    const storedSeconds = loadLessonStudySeconds();
    const mergedSeconds: Record<string, number> = { ...storedSeconds };
    for (const id of completedLessonIds) {
      if ((mergedSeconds[id] || 0) < REQUIRED_LESSON_STUDY_SECONDS) {
        mergedSeconds[id] = REQUIRED_LESSON_STUDY_SECONDS;
      }
    }
    saveLessonStudySeconds(mergedSeconds);

    set({
      isHydrated: true,
      completedLessonIds,
      lessonStudySeconds: mergedSeconds,
      notes,
      bookmarks,
      submissions,
      srsStates,
      examHistory,
    });
  },

  toggleLessonComplete: async (lessonId) => {
    const isNowCompleted = await progressRepo.toggleLessonCompleted(lessonId);
    const completedLessonIds = await progressRepo.getCompletedLessonIds();
    const currentSeconds = { ...get().lessonStudySeconds };
    if (isNowCompleted) {
      currentSeconds[lessonId] = Math.max(
        currentSeconds[lessonId] || 0,
        REQUIRED_LESSON_STUDY_SECONDS
      );
    } else {
      currentSeconds[lessonId] = 0;
    }
    saveLessonStudySeconds(currentSeconds);
    set({ completedLessonIds, lessonStudySeconds: currentSeconds });
  },

  addLessonStudyTime: async (lessonId, deltaSeconds = 1) => {
    const prevSeconds = get().lessonStudySeconds[lessonId] || 0;
    const nextSeconds = prevSeconds + deltaSeconds;
    const updatedMap = {
      ...get().lessonStudySeconds,
      [lessonId]: nextSeconds,
    };
    saveLessonStudySeconds(updatedMap);

    const alreadyCompleted = get().completedLessonIds.includes(lessonId);
    if (nextSeconds >= REQUIRED_LESSON_STUDY_SECONDS && !alreadyCompleted) {
      await progressRepo.setLessonCompleted(lessonId, true);
      const completedLessonIds = await progressRepo.getCompletedLessonIds();
      set({
        lessonStudySeconds: updatedMap,
        completedLessonIds,
      });
    } else {
      set({ lessonStudySeconds: updatedMap });
    }
  },

  toggleBookmark: async (params) => {
    await progressRepo.toggleBookmark(params);
    const bookmarks = await progressRepo.getAllBookmarks();
    set({ bookmarks });
  },

  addOrUpdateNote: async (params) => {
    await notesRepo.saveNote(params);
    const notes = await notesRepo.getAllNotes();
    set({ notes });
  },

  removeNote: async (id) => {
    await notesRepo.deleteNote(id);
    const notes = await notesRepo.getAllNotes();
    set({ notes });
  },

  saveExerciseSubmission: async (exerciseId, code, passed) => {
    const record = await progressRepo.saveSubmission(exerciseId, code, passed);
    set({
      submissions: {
        ...get().submissions,
        [exerciseId]: record,
      },
    });
  },

  rateFlashcard: async (cardId, rating) => {
    const updated = await srsRepo.rateCard(cardId, rating);
    set({
      srsStates: {
        ...get().srsStates,
        [cardId]: updated,
      },
    });
  },

  recordExamAttempt: async (attempt) => {
    await examRepo.saveAttempt(attempt);
    const examHistory = await examRepo.getAllAttempts();
    set({ examHistory });
  },
}));
