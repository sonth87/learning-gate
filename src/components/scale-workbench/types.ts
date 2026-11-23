import type { WorkbenchLang } from '@/stores/useWorkbenchStore';

export interface BilingualText {
  vi: string;
  en: string;
}

export function pickText(text: BilingualText | string, lang: WorkbenchLang): string {
  if (typeof text === 'string') return text;
  return lang === 'en' ? text.en : text.vi;
}

export type StepCategory =
  | 'SETUP'
  | 'PROBLEM'
  | 'TECHNIQUE'
  | 'MECHANISM'
  | 'PITFALL'
  | 'REAL_CODE'
  | 'RECAP';

export type CalloutKind =
  | 'key-idea'
  | 'watch-out'
  | 'good-to-know'
  | 'compare'
  | 'technique';

export type IsoNodeShape =
  | 'block'
  | 'db'
  | 'device'
  | 'crowd';

/** Legacy aliases mapped cleanly onto authentic 2.5D shapes */
export type LegacyNodeShape =
  | IsoNodeShape
  | 'hex'
  | 'box'
  | 'cylinder'
  | 'laptop'
  | 'tape'
  | 'stack'
  | 'gate';

export type IsoTone =
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'yellow'
  | 'rose'
  | 'neutral';

export type StageIconKind =
  | 'cpu'
  | 'code'
  | 'db'
  | 'zap'
  | 'hash'
  | 'layers'
  | 'shield'
  | 'git'
  | 'globe'
  | 'terminal'
  | 'sparkles'
  | 'filter'
  | 'clock'
  | 'alert'
  | 'box';

export type IsoPortDir = 'NE' | 'SE' | 'SW' | 'NW';

/**
 * Rich educational explanation shown on Hover (summary) & Click (full inspector drawer)
 * for any block, database, connector line, badge tag, or memory element on the stage.
 */
export interface StageInspectorInfo {
  title: BilingualText;
  kindLabel: BilingualText;
  /** Plain-language 1-2 sentence definition ("Là gì?") */
  what: BilingualText;
  /** Operational mechanics ("Hoạt động như thế nào?") */
  how: BilingualText;
  /** Architectural rationale ("Tại sao lại cần / tại sao lại thế?") */
  why: BilingualText;
  /** Practical tip, common pitfall, or real-world case study */
  tipOrCase?: BilingualText;
  codeExample?: string;
}

export interface StageNode {
  id: string;
  shape: LegacyNodeShape;
  tone: IsoTone;
  x: number;
  y: number;
  label: BilingualText;
  sublabel?: BilingualText;
  icon?: StageIconKind;
  loadPct?: number;
  badge?: {
    text: BilingualText;
    tone?: 'default' | 'ok' | 'warn' | 'bad';
  };
  /** Optional rich inspector documentation when user hovers/clicks this block or its tag */
  inspector?: StageInspectorInfo;
  tapeCells?: string[];
  activeIndices?: number[];
  showNegativeIndices?: boolean;
  stackFrames?: string[];
  dimmed?: boolean;
  highlighted?: boolean;
  /** Crashed / unreachable / failed state (renders stone-gray body + red X + DOWN badge) */
  dead?: boolean;
}

export interface StageLink {
  id: string;
  from: string;
  to: string;
  /** Optional explicit exit/entry isometric wall ports ('NE' | 'SE' | 'SW' | 'NW') */
  fromPort?: IsoPortDir;
  toPort?: IsoPortDir;
  style?: 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
  label?: BilingualText;
  curve?: number;
  /** Optional rich inspector documentation when user hovers/clicks this connector or its tag */
  inspector?: StageInspectorInfo;
}

export type PacketKind =
  | 'request'
  | 'response'
  | 'pointer'
  | 'mutation'
  | 'cache-hit'
  | 'error';

export interface StagePacket {
  id: string;
  linkId: string;
  kind: PacketKind;
  speed?: number;
  offset?: number;
  reverse?: boolean;
}

export interface StageZoneSlab {
  id: string;
  /** Optional member node IDs to automatically wrap in a rounded dashed 2:1 isometric floor boundary */
  nodeIds?: string[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  label: BilingualText;
  tone?: IsoTone;
}

export interface StageNoteLine {
  text: BilingualText;
  tone?: 'plain' | 'muted' | 'good' | 'bad' | 'amber';
}

export interface StageNoteCard {
  id?: string;
  title: BilingualText;
  lines: StageNoteLine[];
  position?: 'top-left' | 'bottom-left' | 'bottom-right';
}

export interface StageScene {
  zones?: StageZoneSlab[];
  noteCard?: StageNoteCard;
  nodes: StageNode[];
  links: StageLink[];
  packets: StagePacket[];
}

/* ============================================================================
 * MODE 2: CLEAN 2D MEMORY, SLICE, HASH & CALL-TREE VISUALIZER ('memory-2d')
 * ============================================================================ */

export interface MemoryTapeVisual {
  kind: 'tape';
  title: BilingualText;
  subtitle?: BilingualText;
  cells: string[];
  activeIndices?: number[];
  showNegativeIndices?: boolean;
  pointers?: Array<{
    index: number;
    label: string;
    tone?: IsoTone;
  }>;
  outputPill?: {
    label: BilingualText;
    value: BilingualText;
    tone?: IsoTone;
  };
}

export interface MemoryRefsVisual {
  kind: 'refs';
  leftTitle: BilingualText;
  rightTitle: BilingualText;
  names: Array<{
    id: string;
    name: string;
    note?: BilingualText;
    targetId: string;
    style?: 'solid' | 'danger' | 'dashed';
  }>;
  objects: Array<{
    id: string;
    typeTag: string;
    value: string;
    fields?: string[];
    tone: IsoTone;
    badge?: BilingualText;
  }>;
}

export interface MemoryTreeVisual {
  kind: 'tree';
  title: BilingualText;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    label: string;
    sub?: BilingualText;
    tone: IsoTone;
    pruned?: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    style?: 'solid' | 'dashed' | 'danger';
  }>;
}

export type MemoryScene =
  | MemoryTapeVisual
  | MemoryRefsVisual
  | MemoryTreeVisual;

/* ============================================================================
 * MODE 3: NO-DIAGRAM INTERACTIVE CODE & EXECUTION TRACE STAGE ('code-trace')
 * ============================================================================ */

export interface TraceRowItem {
  step: string;
  expr: BilingualText | string;
  result: BilingualText | string;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}

export interface CodeTraceScene {
  badge: BilingualText;
  code: string;
  traceTitle: BilingualText;
  rows: TraceRowItem[];
}

export type StageRenderMode = 'isometric' | 'memory-2d' | 'code-trace';

export interface StageTelemetryItem {
  label: BilingualText;
  value: BilingualText;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}

export interface StepDiffItem {
  op: '+' | '-' | '~';
  text: BilingualText;
}

export interface ScaleLessonStep {
  index: number;
  shortLabel: BilingualText;
  category: StepCategory;
  title: BilingualText;
  summaryVi: string;
  summaryEn: string;
  rawMarkdownVi?: string;
  codeSnippet?: string;
  callout?: {
    kind: CalloutKind;
    title?: BilingualText;
    text: BilingualText;
  };
  whatChanged: StepDiffItem[];
  telemetry: StageTelemetryItem[];
  /** Pedagogical visual mode chosen for this lesson/step */
  stageMode: StageRenderMode;
  scene?: StageScene;
  memoryScene?: MemoryScene;
  codeTrace?: CodeTraceScene;
}

export interface ScaleModuleLesson {
  moduleId: string;
  level: number;
  levelTitle: BilingualText;
  orderInLevel: number;
  totalInLevel: number;
  title: BilingualText;
  subtitle: BilingualText;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Primary pedagogical presentation mode of this lesson */
  primaryMode: StageRenderMode;
  objectives: BilingualText[];
  steps: ScaleLessonStep[];
  quizCount: number;
  exerciseCount: number;
  cardCount: number;
  readingCount: number;
}
