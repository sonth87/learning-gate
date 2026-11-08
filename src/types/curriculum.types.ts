export type SkillLevel = 'fundamental' | 'basic' | 'advanced' | 'pro' | 'master';

export type StageId =
  | 'stage-1'
  | 'stage-2'
  | 'stage-3'
  | 'stage-4'
  | 'stage-5'
  | 'stage-6'
  | 'stage-7';

export interface LevelMeta {
  id: SkillLevel;
  label: string;
  viLabel: string;
  tagline: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  order: number;
}

export interface StageMeta {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  durationWeeks: string;
  goal: string;
  primaryLevels: SkillLevel[];
  milestoneProject: string;
}

export interface VisualAnalogy {
  title: string;
  realWorldScenario: string;
  mappingPoints: {
    realWorld: string;
    pythonEquivalent: string;
    explanation: string;
  }[];
  mentalModelTip: string;
}

export interface DiagramStepNode {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  detail: string;
  highlightColor?: 'amber' | 'sky' | 'emerald' | 'violet' | 'rose';
}

export interface LessonDiagram {
  id: string;
  title: string;
  subtitle: string;
  type: 'pipeline' | 'comparison-boxes' | 'version-timeline' | 'architecture-layers';
  nodes: DiagramStepNode[];
  caption: string;
}

export interface BenchmarkMetricItem {
  label: string;
  valueText: string;
  barPercent: number; // 1 to 100 for visual bar comparison
  isOptimal?: boolean;
  note: string;
}

export interface BenchmarkProof {
  id: string;
  title: string;
  claim: string;
  methodology: string;
  metrics: BenchmarkMetricItem[];
  takeaway: string;
}

export interface ExternalReference {
  title: string;
  url: string;
  sourceType: 'Official Docs' | 'PEP Standard' | 'Deep Dive' | 'Tooling Docs';
  description: string;
}

export interface CodeLineAnnotation {
  line: number;
  explanation: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  output?: string;
  annotations: CodeLineAnnotation[];
}

export interface CommonIssueGotcha {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'tip';
  symptom: string;
  whyItHappens: string;
  wrongCode: string;
  rightCode: string;
  fixExplanation: string;
}

export interface JsTsComparison {
  concept: string;
  jsTsWay: string;
  pythonWay: string;
  jsCode?: string;
  pythonCode?: string;
  keyDifference: string;
}

export interface LessonTopic {
  id: string;
  stageId: StageId;
  level: SkillLevel;
  order: number;
  title: string;
  shortDescription: string;
  estimatedMinutes: number;
  theoryParagraphs: string[];
  analogy: VisualAnalogy;
  diagrams?: LessonDiagram[];
  benchmarksAndProofs?: BenchmarkProof[];
  codeExamples: CodeExample[];
  useCases: {
    title: string;
    scenario: string;
    whyPythonFits: string;
  }[];
  tipsAndBestPractices: string[];
  commonIssues: CommonIssueGotcha[];
  jsComparison?: JsTsComparison[];
  externalReferences?: ExternalReference[];
  relatedTermIds: string[];
  relatedLessonIds: string[];
  relatedExerciseIds: string[];
}
