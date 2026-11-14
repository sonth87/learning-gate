import { SkillLevel } from './curriculum.types';
import { ExamAttemptRecord, FlashcardSrsState } from './assessment.types';
import type { WpState } from '@/features/workpath/types';

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

export type IdeThemeId =
  | 'vscode-dark'
  | 'github-light'
  | 'solarized-light'
  | 'nord'
  | 'dracula'
  | 'monokai';

export interface UserSettings {
  theme: ThemeMode;
  ideTheme?: IdeThemeId;
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
  /** Tiến độ đường học WorkPath (tuỳ chọn để tương thích bản sao lưu cũ) */
  workpath?: WpState;
  /** Tiến độ các khoá học bổ sung theo courseId ('kube' | 'cicd' | 'pmp' | 'redis', tuỳ chọn) */
  courses?: Record<string, WpState>;
}
