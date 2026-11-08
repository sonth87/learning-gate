import { SkillLevel } from '@/types/curriculum.types';

export type CicdMainTab =
  | 'curriculum'
  | 'simulator'
  | 'warroom'
  | 'practice'
  | 'blueprints'
  | 'flashcards'
  | 'exams'
  | 'glossary';

export type CicdStageId =
  | 'cicd-stage-0'
  | 'cicd-stage-1'
  | 'cicd-stage-2'
  | 'cicd-stage-3'
  | 'cicd-stage-4'
  | 'cicd-stage-5';

export type CicdSvgBlueprintType =
  | 'svg-six-pillars'
  | 'svg-ci-delivery-deployment'
  | 'svg-six-core-entities'
  | 'svg-git-branching'
  | 'svg-cache-vs-artifact-dag'
  | 'svg-devsecops-oidc'
  | 'svg-bluegreen-vs-canary'
  | 'svg-gitops-pull-vs-push'
  | 'svg-zero-downtime-sigterm'
  | 'svg-expand-contract-ai-gate';

export interface CicdStageMeta {
  id: CicdStageId;
  number: number;
  title: string;
  subtitle: string;
  pdfPartLabel: string;
  goal: string;
  primaryLevels: SkillLevel[];
  deliverable: string;
}

export interface CicdDiagramNode {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  detail: string;
  metricsOrCommand?: string;
  highlightColor: 'amber' | 'sky' | 'emerald' | 'violet' | 'rose';
}

export interface CicdInteractiveDiagram {
  id: string;
  title: string;
  subtitle: string;
  type: 'pipeline' | 'comparison-boxes' | 'architecture-layers' | 'version-timeline';
  svgBlueprint?: CicdSvgBlueprintType;
  nodes: CicdDiagramNode[];
  caption: string;
}

export interface CicdPlatformComparison {
  feature: string;
  githubActionsWay: string;
  gitlabCiWay: string;
  githubSnippet?: string;
  gitlabSnippet?: string;
  architecturalNote: string;
}

export interface CicdCodeExample {
  id: string;
  title: string;
  language: 'yaml' | 'dockerfile' | 'typescript' | 'bash' | 'sql';
  description: string;
  code: string;
  outputOrImpact?: string;
  annotations: {
    line: number;
    explanation: string;
  }[];
}

export interface CicdGotcha {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'tip';
  symptom: string;
  whyItHappens: string;
  wrongConfig: string;
  rightConfig: string;
  fixExplanation: string;
}

export interface CicdBenchmarkMetric {
  label: string;
  valueText: string;
  barPercent: number;
  isOptimal?: boolean;
  note: string;
}

export interface CicdBenchmarkProof {
  id: string;
  title: string;
  claim: string;
  methodology: string;
  metrics: CicdBenchmarkMetric[];
  takeaway: string;
}

export interface CicdLesson {
  id: string;
  stageId: CicdStageId;
  order: number;
  title: string;
  shortTitle: string;
  level: SkillLevel;
  estimatedMinutes: number;
  pdfRef: string;
  summary: string;
  keyObjectives: string[];
  svgBlueprint: CicdSvgBlueprintType;
  theorySections: {
    heading: string;
    body: string;
    bulletPoints?: string[];
  }[];
  visualAnalogy: {
    title: string;
    realWorldScenario: string;
    mappingPoints: {
      realWorld: string;
      cicdEquivalent: string;
      explanation: string;
    }[];
    mentalModelTip: string;
  };
  diagrams: CicdInteractiveDiagram[];
  codeExamples: CicdCodeExample[];
  platformComparisons: CicdPlatformComparison[];
  gotchas: CicdGotcha[];
  benchmarks: CicdBenchmarkProof[];
  bestPractices: string[];
  relatedSimulators?: {
    label: string;
    targetTab: 'simulator' | 'warroom' | 'practice' | 'blueprints';
    targetId?: string;
  }[];
}

export interface CicdPracticeExercise {
  id: string;
  title: string;
  category: 'github-actions' | 'gitlab-ci' | 'devsecops-oidc' | 'zero-downtime-k8s' | 'troubleshooting';
  level: SkillLevel;
  pdfRef: string;
  scenario: string;
  taskDescription: string;
  requirements: string[];
  starterCode: string;
  solutionCode: string;
  language: 'yaml' | 'dockerfile' | 'typescript';
  hints: string[];
  validationRules: {
    id: string;
    description: string;
    mustContainAny: string[];
    mustNotContain?: string[];
    errorHint: string;
  }[];
  explanationAfterPass: string;
}

export interface CicdFullFlowFile {
  path: string;
  language: 'yaml' | 'dockerfile' | 'typescript' | 'bash' | 'sql';
  roleBadge: string;
  summary: string;
  content: string;
  highlights: {
    title: string;
    detail: string;
  }[];
}

export interface CicdFullFlowBlueprint {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  level: SkillLevel;
  pdfRef: string;
  architectureOverview: string;
  asciiFlow: string;
  files: CicdFullFlowFile[];
  interactiveCommands: {
    command: string;
    label: string;
    simulatedOutput: string;
  }[];
}

export interface CicdFlashcard {
  id: string;
  category: string;
  level: SkillLevel;
  pdfRef: string;
  frontQuestion: string;
  backAnswer: string;
  codeSnippet?: string;
  keyTakeaway: string;
}

export interface CicdExamQuestion {
  id: string;
  question: string;
  codeContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pdfRef: string;
}

export interface CicdExamSet {
  id: string;
  title: string;
  subtitle: string;
  level: SkillLevel;
  durationMinutes: number;
  passingScorePercent: number;
  questions: CicdExamQuestion[];
}

export interface CicdGlossaryTerm {
  id: string;
  term: string;
  category:
    | 'Core Architecture'
    | 'DevSecOps & Cloud'
    | 'Deployment & GitOps'
    | 'Optimization & DORA'
    | 'Zero-Downtime & K8s';
  level: SkillLevel;
  shortDef: string;
  deepExplanation: string;
  codeExample?: string;
  relatedTerms: string[];
}
