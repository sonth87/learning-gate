/**
 * Kiểu dữ liệu của đường học "WorkPath".
 * Nội dung (curriculum/catalog/readings) được sinh bởi `./learn export-web` từ project WorkPath
 * — WorkPath là nơi DUY NHẤT sửa nội dung, đừng sửa tay các file JSON trong src/data/workpath.
 */

export type ReadingKind = 'good' | 'bug' | 'compare' | 'outdated' | 'project' | 'security';
export type QuizType = 'mc' | 'tf' | 'output';

export interface WpExercise {
  id: string;
  /** Mã ngắn, ví dụ "M30.7" */
  code: string;
  module: string;
  title: string;
  difficulty: number;
  tags: string[];
  prompt: string;
  starter: string;
  tests: string;
  solution: string;
  hints: string[];
  ref: string;
  /** false = bài cần thread/asyncio/socket, chỉ chấm được bằng WorkPath chạy trên máy */
  webGrade: boolean;
}

export interface WpQuestion {
  id: string;
  type: QuizType;
  q: string;
  code: string;
  choices: string[];
  answer: number | boolean | string;
  explain: string;
}

export interface WpCard {
  id: string;
  front: string;
  back: string;
}

export interface WpDrill {
  id: string;
  title: string;
  code: string;
}

export interface WpReading {
  path: string;
  kind: ReadingKind;
  note: string;
  task: string;
  answer: string;
  catalogN: number | null;
}

export interface WpModule {
  id: string;
  slug: string;
  level: number;
  order: number;
  title: string;
  summary: string;
  tags: string[];
  lesson: string;
  exercises: WpExercise[];
  quiz: WpQuestion[];
  cards: WpCard[];
  drills: WpDrill[];
  readings: WpReading[];
}

export interface WpCurriculum {
  generatedAt: string;
  passQuiz: number;
  levels: Record<string, string>;
  modules: WpModule[];
}

export interface WpCatalogItem {
  n: number;
  id: string;
  path: string;
  kind: 'file' | 'project';
  files: number;
  loc: number;
  category: string;
  topic: string;
  level: number;
  difficulty: number;
  quality: number;
  tags: string[];
  deps: string[];
  pypi: string[];
  flags: string[];
  duplicateOf: string | null;
  curated: { module: string; kind: ReadingKind }[];
}

export interface WpCatalog {
  categories: Record<string, string>;
  flagLabels: Record<string, string>;
  items: WpCatalogItem[];
}

export type CatalogStatus = 'todo' | 'reading' | 'done' | 'rewritten' | 'skip';
export type ExerciseStatus = 'todo' | 'started' | 'passed' | 'skipped';

export interface ExerciseRecord {
  status: ExerciseStatus;
  attempts: number;
  hints: number;
  solutionViewed?: boolean;
  lastScore?: string;
  passedAt?: number;
  skippedAt?: number;
  /** Code người học đang viết (tự lưu) */
  code?: string;
}

export interface QuizRecord {
  best: number;
  bestCorrect: number;
  attempts: number;
}

export interface CardRecord {
  box: number;
  /** YYYY-MM-DD */
  due: string;
}

export interface DrillRecord {
  bestAcc: number;
  bestWpm: number;
  runs: number;
}

export interface LogEntry {
  t: number;
  event: string;
  xp: number;
}

/** Toàn bộ tiến độ học — lưu song song trong LocalStorage + IndexedDB (`wp_state` / `course_state`). */
export interface WpState {
  v: 1;
  started: string;
  /** Mốc cập nhật cuối (ms) để hợp nhất an toàn giữa các tab / LocalStorage / IndexedDB */
  updatedAt?: number;
  /** Mốc đặt lại toàn bộ tiến độ (ms) nếu người học chủ động reset */
  resetAt?: number;
  xp: number;
  lessons: Record<string, number>;
  /** Các module được đánh dấu bỏ qua toàn bộ (vì đã nắm vững) */
  skippedModules?: Record<string, number>;
  /** Các bài lý thuyết được đánh dấu bỏ qua */
  skippedLessons?: Record<string, number>;
  /** Các bài quiz module được đánh dấu bỏ qua */
  skippedQuizzes?: Record<string, number>;
  quiz: Record<string, QuizRecord>;
  quizWrong: string[];
  exercises: Record<string, ExerciseRecord>;
  catalog: Record<string, { status: CatalogStatus; t: number }>;
  cards: Record<string, CardRecord>;
  drills: Record<string, DrillRecord>;
  log: LogEntry[];
}

/** Kết quả chạy/chấm từ Pyodide */
export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  ms: number;
  timedOut?: boolean;
}

export interface GradeTest {
  name: string;
  doc: string;
  status: 'pass' | 'fail' | 'error';
  message?: string;
  line?: number;
  code?: string;
  got?: string;
  expected?: string;
  stdout?: string;
  ms?: number;
}

export interface GradeResult {
  import_error: string | null;
  tests: GradeTest[];
  stdout?: string;
  timedOut?: boolean;
}

export type WpView =
  | { name: 'home' }
  | { name: 'roadmap' }
  | { name: 'module'; id: string }
  | { name: 'exercises'; moduleId?: string; status?: ExerciseStatus }
  | { name: 'exercise'; code: string }
  | { name: 'quiz'; mode: 'module' | 'review' | 'mix'; moduleId?: string }
  | { name: 'flash'; moduleId?: string }
  | { name: 'drill'; moduleId: string }
  | { name: 'browse'; preset?: 'forme' | 'all' | 'curated' | 'security' }
  | { name: 'read'; n: number };
