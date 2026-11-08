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

interface UserDataState {
  isHydrated: boolean;
  completedLessonIds: string[];
  notes: UserNote[];
  bookmarks: UserBookmark[];
  submissions: Record<string, ExerciseSubmissionRecord>;
  srsStates: Record<string, FlashcardSrsState>;
  examHistory: ExamAttemptRecord[];

  hydrateAll: () => Promise<void>;
  toggleLessonComplete: (lessonId: string) => Promise<void>;
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

    set({
      isHydrated: true,
      completedLessonIds,
      notes,
      bookmarks,
      submissions,
      srsStates,
      examHistory,
    });
  },

  toggleLessonComplete: async (lessonId) => {
    await progressRepo.toggleLessonCompleted(lessonId);
    const completedLessonIds = await progressRepo.getCompletedLessonIds();
    set({ completedLessonIds });
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
