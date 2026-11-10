export type KubeTab =
  | 'learn'
  | 'curriculum'
  | 'flow-studio'
  | 'cluster-sim'
  | 'incidents'
  | 'practice'
  | 'glossary'
  | 'exams';

export type KubeStageId = 'stage-1' | 'stage-2' | 'stage-3' | 'stage-4';

export type KubeSkillLevel = 'fundamental' | 'basic' | 'advanced' | 'master';

export interface KubeStageMeta {
  id: KubeStageId;
  number: number;
  title: string;
  subtitle: string;
  coreKnowledge: string[];
  practicalGoals: string[];
  milestone: string;
  color: 'sky' | 'emerald' | 'amber' | 'violet';
}

export type AnimatedFlowType =
  | 'code-to-k8s-pipeline'
  | 'linux-kernel-isolation'
  | 'dockerfile-layer-cache'
  | 'docker-volume-vs-bind'
  | 'k8s-control-loop'
  | 'k8s-network-traffic'
  | 'rolling-update-hpa'
  | 'pvc-storage-dynamic'
  | 'troubleshooting-flowchart';

export interface FlowStepAnimation {
  stepNumber: number;
  title: string;
  actor: string;
  commandOrEvent: string;
  description: string;
  activeNodeIds: string[];
  packetPath?: { from: string; to: string; label: string; color: string };
  highlightBadge?: string;
}

export interface FlowArchitectureNode {
  id: string;
  label: string;
  sublabel: string;
  analogyLabel: string;
  category: 'source' | 'docker' | 'control-plane' | 'worker-node' | 'network' | 'storage' | 'pod';
  color: 'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan';
  details: string;
}

export interface AnimatedFlowDiagram {
  id: AnimatedFlowType;
  title: string;
  subtitle: string;
  pdfFigureRef: string;
  analogySummary: string;
  nodes: FlowArchitectureNode[];
  steps: FlowStepAnimation[];
  interactiveTakeaway: string;
}

export interface AnalogyMappingRow {
  technicalTerm: string;
  analogyName: string;
  explanation: string;
}

export interface KubeCodeExample {
  id: string;
  filename: string;
  language: 'dockerfile' | 'yaml' | 'bash';
  purpose: string;
  code: string;
  annotations: {
    line: number;
    keyword: string;
    explanation: string;
  }[];
}

export interface KubeGotcha {
  title: string;
  severity: 'critical' | 'warning' | 'tip';
  symptom: string;
  rootCause: string;
  wrongApproach: string;
  rightApproach: string;
}

export interface KubeLesson {
  id: string;
  stageId: KubeStageId;
  level: KubeSkillLevel;
  order: number;
  title: string;
  shortDescription: string;
  estimatedMinutes: number;
  theorySections: {
    heading: string;
    paragraphs: string[];
    bulletPoints?: { boldPrefix: string; text: string }[];
  }[];
  analogyCards: {
    title: string;
    scenario: string;
    mappings: AnalogyMappingRow[];
    summaryCallout: string;
  };
  animatedFlowId: AnimatedFlowType;
  codeExamples: KubeCodeExample[];
  gotchas: KubeGotcha[];
  relatedIncidentId?: string;
  relatedPracticeId?: string;
}

export interface IncidentDiagnosticStep {
  stepOrder: 1 | 2 | 3 | 4;
  stepTitle: string;
  command: string;
  terminalOutput: string;
  clueExplanation: string;
}

export interface IncidentScenario {
  id: string;
  number: number;
  title: string;
  statusBadge: string;
  severity: 'P0 - Critical' | 'P1 - High' | 'P2 - Medium';
  alertMessage: string;
  essenceOfProblem: string;
  symptoms: string[];
  diagnosticSteps: IncidentDiagnosticStep[];
  rootCausesAndSolutions: {
    causeTitle: string;
    detail: string;
    fixCommandOrCode: string;
  }[];
  configFileName: string;
  brokenConfig: string;
  fixedConfig: string;
  requiredSnippets: string[];
  forbiddenSnippets?: string[];
  verificationSuccessLog: string;
}

export interface PracticeStepGuide {
  stepNumber: number;
  stepTitle: string;
  explanation: string;
  codeSnippet: string;
}

export interface PracticeCliCheck {
  command: string;
  purpose: string;
  expectedOutput: string;
}

export interface PracticeExercise {
  id: string;
  stageId: KubeStageId;
  level: KubeSkillLevel;
  category: 'dockerfile' | 'compose' | 'k8s-core' | 'k8s-enterprise';
  title: string;
  scenario: string;
  requirements: string[];
  filename: string;
  starterCode: string;
  solutionCode: string;
  hints: string[];
  architectureGuide: {
    whyItMatters: string;
    realWorldAnalogy: string;
    commonPitfall: string;
  };
  stepByStepGuide: PracticeStepGuide[];
  cliVerificationChecks: PracticeCliCheck[];
  solutionAnnotations: {
    section: string;
    explanation: string;
  }[];
  validationRules: {
    id: string;
    description: string;
    mustContain: string[];
    mustNotContain?: string[];
  }[];
}

export interface CicdPipelineScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gitBranch: string;
  commitMessage: string;
  author: string;
  defaultOptions: {
    optimizeLayerCache: boolean;
    useMultiStageBuild: boolean;
    runAsNonRootUser: boolean;
    enableReadinessProbe: boolean;
    argocdAutoSync: boolean;
  };
  dockerfilePreview: string;
  workflowYamlPreview: string;
  argocdManifestPreview: string;
}

export interface GlossaryAnalogyItem {
  id: string;
  term: string;
  category: 'Core & OCI' | 'Docker' | 'K8s Architecture' | 'K8s Objects' | 'Cloud Native & SRE';
  analogyTag: string;
  technicalDefinition: string;
  vividAnalogy: string;
  exampleCommandOrYaml: string;
}

export interface CheatsheetGroup {
  id: string;
  groupNumber: number;
  groupTitle: string;
  commands: {
    cmd: string;
    explanation: string;
    whenToUse: string;
  }[];
}

export interface KubeQuizQuestion {
  id: string;
  stageId: KubeStageId;
  question: string;
  scenarioContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface KubeFlashcard {
  id: string;
  category: string;
  frontQuestion: string;
  analogyHint: string;
  backAnswer: string;
  keyCommand?: string;
}
