import { SkillLevel } from './curriculum.types';
import { ExamAttemptRecord, FlashcardSrsState } from './assessment.types';

export type TargetEntityType = 'lesson' | 'exercise' | 'glossary' | 'deepdive';

export interface UserNote {
  id: string;
  targetType: TargetEntityType;
  targetId: string;
  targetTitle: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserBookmark {
  id: string;
  targetType: TargetEntityType;
  targetId: string;
  targetTitle: string;
  level: SkillLevel;
  createdAt: number;
}

export interface ExerciseSubmissionRecord {
  exerciseId: string;
  code: string;
  passed: boolean;
  updatedAt: number;
}

export type CurriculumOrganizationMode = 'by-stage' | 'by-level';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  organizationMode: CurriculumOrganizationMode;
  showJsTsComparison: boolean;
  enableAutoHighlight: boolean;
  highlightKeywords: boolean;
  highlightBuiltins: boolean;
  highlightConcepts: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}

export interface FullBackupPayload {
  version: string;
  exportedAt: number;
  settings: UserSettings;
  completedLessonIds: string[];
  notes: UserNote[];
  bookmarks: UserBookmark[];
  submissions: ExerciseSubmissionRecord[];
  srsStates: FlashcardSrsState[];
  examHistory: ExamAttemptRecord[];
}
