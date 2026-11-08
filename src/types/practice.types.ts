import { SkillLevel, StageId } from './curriculum.types';

export type PracticeCategory =
  | 'code-gym'
  | 'debug-rescue'
  | 'brain-teaser'
  | 'js-to-py'
  | 'architecture';

export interface ExerciseTestCase {
  id: string;
  description: string;
  inputDescription: string;
  expectedOutput: string;
  requiredPatterns: string[];
  forbiddenPatterns?: {
    pattern: string;
    reason: string;
  }[];
}

export interface PracticeExercise {
  id: string;
  title: string;
  category?: PracticeCategory;
  stageId: StageId;
  level: SkillLevel;
  relatedLessonId: string;
  problemStatement: string;
  realWorldContext: string;
  requirements: string[];
  starterCode: string;
  solutionCode: string;
  hints: string[];
  solutionWalkthrough: {
    stepTitle: string;
    codeSnippet: string;
    explanation: string;
  }[];
  commonMistakes: string[];
  testCases: ExerciseTestCase[];
}

export interface TestCaseResult {
  testCaseId: string;
  description: string;
  passed: boolean;
  message: string;
  expectedOutput: string;
}

export interface VerificationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  simulatedStdout: string;
  results: TestCaseResult[];
}
