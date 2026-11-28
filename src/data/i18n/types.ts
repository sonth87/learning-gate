export type CourseI18nId = 'python' | 'kube' | 'cicd' | 'redis' | 'pmp' | 'sysdesign';

export interface CourseEnStepOverlay {
  headingEn?: string;
  shortEn?: string;
  bodyEn?: string;
}

export interface CourseEnReadingOverlay {
  noteEn?: string;
  taskEn?: string;
  answerEn?: string;
}

export interface CourseEnQuizOverlay {
  qEn?: string;
  choicesEn?: string[];
  explainEn?: string;
}

export interface CourseEnCardOverlay {
  frontEn?: string;
  backEn?: string;
}

export interface CourseEnExerciseOverlay {
  titleEn?: string;
  promptEn?: string;
  hintsEn?: string[];
}

export interface CourseEnModuleOverlay {
  titleEn?: string;
  summaryEn?: string;
  mottoEn?: string;
  realWorldTrapEn?: string;
  pmiMindsetShiftEn?: string;
  objectivesEn?: string[];
  steps?: CourseEnStepOverlay[];
  readings?: CourseEnReadingOverlay[];
  quizzes?: Record<string, CourseEnQuizOverlay>;
  cards?: Record<string, CourseEnCardOverlay>;
  exercises?: Record<string, CourseEnExerciseOverlay>;
}

export interface CourseEnOverlay {
  levels?: Record<string, string>;
  modules: Record<string, CourseEnModuleOverlay>;
}
