/**
 * Kiểu dữ liệu của đường học "Học" cho Docker & K8s ('kube') và CI/CD ('cicd').
 * Tái sử dụng WpState, WpView, GradeResult, RunResult, ReadingKind, QuizType từ workpath
 * để đồng nhất hoàn toàn luồng học, SRS, XP và backup.
 */

import type {
  GradeResult,
  GradeTest,
  QuizType,
  ReadingKind,
  RunResult,
  WpCard,
  WpDrill,
  WpQuestion,
  WpReading,
  WpState,
  WpView,
} from '@/features/workpath/types';

export type {
  GradeResult,
  GradeTest,
  QuizType,
  ReadingKind,
  RunResult,
  WpCard,
  WpDrill,
  WpQuestion,
  WpReading,
  WpState,
  WpView,
};

export type DevOpsCourseId = 'kube' | 'cicd';
export type DevOpsAccent = 'sky' | 'cyan' | 'amber';

export type ExerciseKind = 'yaml' | 'dockerfile' | 'dockerignore' | 'cli' | 'troubleshoot';
export type EditorLanguage = 'yaml' | 'dockerfile' | 'shell';

/** Liên kết nối từ một module sang công cụ có sẵn của app (Simulator, War Room, Flow Studio...) hoặc sang app kia */
export interface RelatedToolLink {
  label: string;
  description?: string;
  kind: 'tab' | 'flow' | 'incident' | 'warroom' | 'blueprint' | 'simulator-preset' | 'cross-app';
  targetId: string;
}

/** Tài liệu chính thức trích dẫn cuối mỗi lesson */
export interface OfficialSource {
  title: string;
  url: string;
  version?: string;
}

/* ---------------- Spec kiểm tra bài thực hành (JSON-serializable, chạy cả Web & Node) ---------------- */

export type ValueMatcher =
  | { eq: unknown }
  | { neq: unknown }
  | { oneOf: unknown[] }
  | { gte: number }
  | { lte: number }
  | { gt: number }
  | { regex: string; flags?: string }
  | { notRegex: string; flags?: string }
  | { contains: unknown }
  | { notContains: unknown }
  | { exists: boolean }
  | { type: 'string' | 'number' | 'boolean' | 'array' | 'object' }
  | { nonEmpty: true }
  | { k8sCpuMinMillicores: number }
  | { k8sCpuMaxMillicores: number }
  | { k8sMemMinMi: number }
  | { k8sMemMaxMi: number };

export type YamlCheckRule =
  | {
      id: string;
      doc: string;
      kind: 'path';
      /** Chỉ số document (mặc định 0) hoặc lọc theo kind/name của K8s resource */
      docSelect?: number | { kind: string; name?: string };
      /** Đường dẫn dấu chấm, hỗ trợ mảng [0] hoặc tìm phần tử [name=web], vd "spec.template.spec.containers[0].image" */
      path: string;
      match: ValueMatcher;
    }
  | {
      id: string;
      doc: string;
      kind: 'k8s-selector-match';
      /** Kiểm tra Deployment/StatefulSet selector.matchLabels khớp template.metadata.labels, hoặc Service.spec.selector khớp Pod/Deployment labels */
      sourceKind: 'Deployment' | 'StatefulSet' | 'Service';
      sourceName?: string;
      targetKind?: 'Deployment' | 'StatefulSet' | 'Pod';
      targetName?: string;
    }
  | {
      id: string;
      doc: string;
      kind: 'k8s-service-port-match';
      serviceName?: string;
      targetKind?: 'Deployment' | 'StatefulSet' | 'Pod';
      targetName?: string;
    }
  | {
      id: string;
      doc: string;
      kind: 'k8s-ingress-backend-match';
      ingressName?: string;
      host?: string;
      path?: string;
      expectedService?: string;
      expectedPort?: number | string;
    }
  | {
      id: string;
      doc: string;
      kind: 'image-tag-pinned';
      docSelect?: number | { kind: string; name?: string };
      path: string;
    }
  | {
      id: string;
      doc: string;
      kind: 'gha-no-script-injection';
      jobId?: string;
    }
  | {
      id: string;
      doc: string;
      kind: 'gha-uses-pinned';
      jobId?: string;
      actionPrefix: string;
      minMajor?: number;
    }
  | {
      id: string;
      doc: string;
      kind: 'network-policy-rule';
      policyName?: string;
      direction: 'Ingress' | 'Egress';
      expectedPort?: number;
      expectedPodLabel?: Record<string, string>;
    };

export type DockerfileCheckRule =
  | {
      id: string;
      doc: string;
      kind: 'stage-count';
      min?: number;
      eq?: number;
    }
  | {
      id: string;
      doc: string;
      kind: 'base-image';
      /** 'first' | 'last' | stage index | stage alias */
      stage: 'first' | 'last' | number | string;
      imagePrefix?: string;
      notLatest?: boolean;
      variantContains?: string;
      alias?: string;
    }
  | {
      id: string;
      doc: string;
      kind: 'instruction';
      stage?: 'first' | 'last' | number | string;
      instruction: string;
      argsRegex?: string;
      notArgsRegex?: string;
      hasFlag?: string;
      execForm?: boolean;
      jsonEquals?: string[];
      exists?: boolean;
    }
  | {
      id: string;
      doc: string;
      kind: 'order';
      stage?: 'first' | 'last' | number | string;
      /** Chỉ thị A phải xuất hiện TRƯỚC chỉ thị B trong cùng stage */
      before: { instruction: string; argsRegex: string };
      after: { instruction: string; argsRegex: string };
    }
  | {
      id: string;
      doc: string;
      kind: 'non-root-user';
      stage?: 'last' | number | string;
      expectedUser?: string;
    };

export interface DockerignoreCheckRule {
  id: string;
  doc: string;
  /** Đường dẫn mẫu để kiểm tra xem .dockerignore có chặn (shouldIgnore=true) hay giữ lại (shouldIgnore=false) */
  samplePath: string;
  shouldIgnore: boolean;
}

/* ---------------- Mô hình Trạng thái cho bài CLI & Troubleshooting ---------------- */

export interface SimContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'exited';
  exitCode: number;
  ports: { host: number; container: number; proto?: string }[];
  env: Record<string, string>;
  volumes: { source: string; target: string; type: 'volume' | 'bind' }[];
  network: string;
  memoryLimit?: string;
  user?: string;
  logs: string[];
  cmd?: string;
}

export interface SimK8sPod {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  image: string;
  status:
    | 'Running'
    | 'Pending'
    | 'ImagePullBackOff'
    | 'ErrImagePull'
    | 'CrashLoopBackOff'
    | 'CreateContainerConfigError'
    | 'OOMKilled'
    | 'Terminating';
  ready: boolean;
  restarts: number;
  node?: string;
  ports: number[];
  envFromConfigMaps?: string[];
  envFromSecrets?: string[];
  imagePullSecrets?: string[];
  pvcClaims?: string[];
  memoryLimitMi?: number;
  logs: string[];
  previousLogs?: string[];
  events: string[];
}

export interface SimK8sDeployment {
  name: string;
  namespace: string;
  replicas: number;
  selector: Record<string, string>;
  podLabels: Record<string, string>;
  image: string;
  revision: number;
  history: { revision: number; image: string }[];
  containerPort?: number;
  readinessPath?: string;
  memoryLimitMi?: number;
  envConfigMaps?: string[];
  envSecrets?: string[];
  imagePullSecrets?: string[];
}

export interface SimK8sService {
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  selector: Record<string, string>;
  port: number;
  targetPort: number;
  nodePort?: number;
}

export interface SimWorldState {
  docker?: {
    images: { repo: string; tag: string; sizeMB: number }[];
    containers: SimContainer[];
    volumes: string[];
    networks: string[];
    buildFiles?: Record<string, string>;
  };
  k8s?: {
    namespaces: string[];
    pods: SimK8sPod[];
    deployments: SimK8sDeployment[];
    services: SimK8sService[];
    configMaps: { name: string; namespace: string; data: Record<string, string> }[];
    secrets: { name: string; namespace: string; type?: string; data: Record<string, string> }[];
    pvcs: { name: string; namespace: string; storage: string; storageClass?: string; bound: boolean }[];
    availableStorageClasses?: string[];
    registryImages?: string[];
  };
  git?: {
    currentBranch: string;
    branches: string[];
    commits: { sha: string; branch: string; message: string }[];
    tags: Record<string, string>;
    files: Record<string, string>;
    staged: string[];
  };
}

export type CliStateCheckRule =
  | {
      id: string;
      doc: string;
      target: 'docker-container';
      name?: string;
      image?: string;
      status?: 'running' | 'exited' | 'absent';
      hostPort?: number;
      containerPort?: number;
      envEquals?: Record<string, string>;
      volumeTarget?: string;
      volumeSource?: string;
      volumeType?: 'volume' | 'bind';
      network?: string;
      memoryLimit?: string;
    }
  | {
      id: string;
      doc: string;
      target: 'docker-image';
      repo: string;
      tag: string;
    }
  | {
      id: string;
      doc: string;
      target: 'docker-volume';
      name: string;
    }
  | {
      id: string;
      doc: string;
      target: 'docker-network';
      name: string;
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-namespace';
      name: string;
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-pod';
      name?: string;
      namespace?: string;
      labelMatch?: Record<string, string>;
      status?: SimK8sPod['status'] | 'absent';
      ready?: boolean;
      image?: string;
      minCount?: number;
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-deployment';
      name: string;
      namespace?: string;
      replicas?: number;
      image?: string;
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-service-endpoints';
      name: string;
      namespace?: string;
      minReadyEndpoints: number;
      port?: number;
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-configmap';
      name: string;
      namespace?: string;
      hasKeys?: string[];
    }
  | {
      id: string;
      doc: string;
      target: 'k8s-secret';
      name: string;
      namespace?: string;
      hasKeys?: string[];
    }
  | {
      id: string;
      doc: string;
      target: 'git-state';
      currentBranch?: string;
      hasBranch?: string;
      hasTag?: string;
      minCommitsOnBranch?: { branch: string; count: number };
    }
  | {
      id: string;
      doc: string;
      target: 'stdout-inspected';
      /** Dành cho bài khám bệnh / quan sát: người học đã chạy lệnh để xuất ra thông tin cần đọc */
      contains: string;
    };

export type ExerciseSpec =
  | {
      kind: 'yaml';
      /** Nếu là bài Helm values, truyền template vào đây để render YAML trước khi parse */
      helmTemplate?: string;
      rules: YamlCheckRule[];
    }
  | {
      kind: 'dockerfile';
      rules: DockerfileCheckRule[];
    }
  | {
      kind: 'dockerignore';
      rules: DockerignoreCheckRule[];
    }
  | {
      kind: 'cli';
      initialState: SimWorldState;
      rules: CliStateCheckRule[];
    }
  | {
      kind: 'troubleshoot';
      /** Trạng thái cụm/pipeline đang lỗi để người học gõ lệnh chẩn đoán trong khung Terminal phụ */
      initialState: SimWorldState;
      /** Bản vá cấu hình người học sửa trong editor là YAML, Dockerfile hay lệnh CLI */
      patchFormat: 'yaml' | 'dockerfile' | 'cli';
      yamlRules?: YamlCheckRule[];
      dockerfileRules?: DockerfileCheckRule[];
      cliRules?: CliStateCheckRule[];
      /** Bắt buộc người học đã chạy ít nhất 1 lệnh chẩn đoán khớp mẫu (không đoán mò) — nhưng khi chạy bằng course:doctor thì có diagnosticCommands mẫu */
      diagnosticSampleCommands?: string[];
    };

export interface DevOpsExercise {
  id: string;
  /** Mã ngắn, vd "K00.1" hoặc "C03.2" */
  code: string;
  module: string;
  title: string;
  difficulty: number;
  tags: string[];
  kind: ExerciseKind;
  language: EditorLanguage;
  filename: string;
  prompt: string;
  starter: string;
  solution: string;
  spec: ExerciseSpec;
  hints: string[];
  ref: string;
  webGrade: boolean;
}

export interface DevOpsModule {
  id: string;
  slug: string;
  level: number;
  order: number;
  title: string;
  summary: string;
  tags: string[];
  lesson: string;
  sources: OfficialSource[];
  relatedTools?: RelatedToolLink[];
  exercises: DevOpsExercise[];
  quiz: WpQuestion[];
  cards: WpCard[];
  drills: WpDrill[];
  readings: WpReading[];
}

export interface DevOpsCurriculum {
  courseId: DevOpsCourseId;
  generatedAt: string;
  passQuiz: number;
  levels: Record<string, string>;
  modules: DevOpsModule[];
}

export interface DevOpsCatalogItem {
  n: number;
  id: string;
  path: string;
  language: EditorLanguage;
  loc: number;
  category: string;
  topic: string;
  level: number;
  difficulty: number;
  quality: number;
  tags: string[];
  flags: string[];
  sourceUrl: string;
  curated: { module: string; kind: ReadingKind }[];
}

export interface DevOpsCatalog {
  categories: Record<string, string>;
  flagLabels: Record<string, string>;
  items: DevOpsCatalogItem[];
}
