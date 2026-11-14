export type RedisMainTab = 'learn' | 'simulator' | 'flow-studio' | 'incidents' | 'glossary';

export type RedisSimMode = 'memory' | 'cluster' | 'repl';

export type RedisFlowId =
  | 'event-loop-pipeline'
  | 'cache-aside-singleflight'
  | 'dist-lock-lua'
  | 'streams-pel-xack'
  | 'bgsave-cow-aof'
  | 'sentinel-quorum-failover';

export type RedisEvictionPolicy =
  | 'noeviction'
  | 'allkeys-lru'
  | 'allkeys-lfu'
  | 'volatile-lru'
  | 'volatile-lfu'
  | 'volatile-ttl'
  | 'allkeys-random'
  | 'volatile-random';

export interface RedisFlowNode {
  id: string;
  label: string;
  sublabel: string;
  lane: 'client' | 'redis' | 'storage';
  tone: 'rose' | 'amber' | 'emerald' | 'sky' | 'violet';
}

export interface RedisFlowStep {
  title: string;
  activeNodes: string[];
  packetFrom?: string;
  packetTo?: string;
  packetLabel?: string;
  latencyBadge: string;
  commandSnippet: string;
  explanation: string;
}

export interface RedisFlowScenario {
  id: RedisFlowId;
  title: string;
  badge: string;
  moduleRef: string;
  summary: string;
  nodes: RedisFlowNode[];
  steps: RedisFlowStep[];
}

export interface RedisIncidentOption {
  id: string;
  label: string;
  command: string;
  isCorrect: boolean;
  feedback: string;
  p99AfterMs: number;
  dbLoadAfterPct: number;
}

export interface RedisIncidentScenario {
  id: string;
  code: string;
  title: string;
  moduleRef: string;
  severity: 'SEV-1' | 'SEV-2';
  statusBadge: string;
  alertMessage: string;
  p99BeforeMs: number;
  dbLoadBeforePct: number;
  telemetryLogs: string[];
  diagnosticHint: string;
  rootCause: string;
  options: RedisIncidentOption[];
}

export type RedisComplexityClass = 'O(1)' | 'O(log N)' | 'O(N) Cẩn trọng';

export type RedisGlossaryCategory =
  | 'String & Keyspace'
  | 'Hash · List · Set'
  | 'ZSet · Probabilistic · Geo'
  | 'Streams · PubSub · Lua'
  | 'Caching · Lock · Rate Limit'
  | 'Persistence · Cluster · Ops';

export interface RedisGlossaryEntry {
  id: string;
  term: string;
  category: RedisGlossaryCategory;
  complexity: RedisComplexityClass;
  complexityDetail: string;
  analogy: string;
  summary: string;
  productionDanger?: string;
  cliExample: string;
  nodeExample: string;
  pythonExample: string;
}
