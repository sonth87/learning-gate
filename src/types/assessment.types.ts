import { SkillLevel, StageId } from './curriculum.types';

export interface FlashcardItem {
  id: string;
  stageId: StageId;
  level: SkillLevel;
  category: string;
  frontQuestion: string;
  frontHint?: string;
  backAnswer: string;
  backAnalogy: string;
  codeSnippet?: string;
  relatedTermIds: string[];
}

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardSrsState {
  cardId: string;
  box: number; // 0 to 5
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: number; // timestamp ms
  lastReviewedAt: number;
  reviewCount: number;
}

export interface ExamOption {
  id: string;
  text: string;
  whyRightOrWrong: string;
}

export interface ExamQuestion {
  id: string;
  stageId: StageId;
  level: SkillLevel;
  question: string;
  codeSnippet?: string;
  options: ExamOption[];
  correctOptionId: string;
  overallExplanation: string;
  analogyReminder?: string;
  relatedTermIds: string[];
}

export interface ExamSet {
  id: string;
  title: string;
  description: string;
  targetLevel: SkillLevel | 'all';
  targetStage?: StageId;
  durationMinutes: number;
  passingScorePercent: number;
  questions: ExamQuestion[];
}

export interface ExamAttemptRecord {
  id: string;
  examId: string;
  examTitle: string;
  completedAt: number;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  selectedAnswers: Record<string, string>;
}
