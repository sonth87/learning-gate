/**
 * Kiểu dữ liệu của feature `sysdesign-course` (System Design Mastery, courseId = 'sysdesign').
 * Tái sử dụng WpState, WpQuestion, WpCard từ workpath để đồng nhất lưu trữ kép (LocalStorage + IndexedDB),
 * XP và SRS Leitner 5 hộp. Định dạng nguồn: docs/sysdesign/07-content-authoring.md.
 */
import type { WpCard, WpQuestion, WpState } from '@/features/workpath/types';

export type { WpState, WpQuestion, WpCard };

/** Màn hình trong tab Learn (nav stack). `workbench` = bàn học ScaleWorkbenchLayout. */
export type SdLearnView =
  | { name: 'workbench' }
  | { name: 'home' }
  | { name: 'roadmap' }
  | { name: 'module'; id: string }
  | { name: 'quiz'; mode: 'module' | 'review' | 'mix'; moduleId?: string }
  | { name: 'flash'; moduleId?: string };

/** Nguồn chuyển thể của một bài (01-sources-and-credits.md §3.1). */
export interface SdSource {
  kind: 'sdc' | 'original';
  path?: string;
  sha?: string;
  url?: string;
  adaptedBy?: string;
  adaptedAt?: string;
  changes?: string;
  adaptation?: 'edited' | 'rewritten';
}

export interface SdBilingual {
  vi: string;
  en?: string;
}

/* ---------------- stage.json (07 §2.4) ---------------- */

export type SdStageTone = 'green' | 'blue' | 'orange' | 'purple' | 'yellow' | 'rose' | 'neutral';
export type SdLinkStyle = 'solid' | 'dashed' | 'off' | 'danger' | 'heartbeat' | 'cut';
export type SdPort = 'NE' | 'SE' | 'SW' | 'NW';

export interface SdStageNodeDef {
  shape?: 'block' | 'db' | 'device' | 'crowd';
  tone?: SdStageTone;
  icon?: string;
  label?: SdBilingual;
  sublabel?: SdBilingual;
  x?: number;
  y?: number;
  inspector?: Record<string, unknown>;
}

export interface SdStageLinkDef {
  label?: SdBilingual;
  style?: SdLinkStyle;
  fromPort?: SdPort;
  toPort?: SdPort;
  curve?: number;
  inspector?: Record<string, unknown>;
}

export interface SdSceneDef {
  mode?: 'isometric' | 'memory-2d' | 'code-trace';
  show: { nodes: string[] | '*'; links?: string[] | '*' };
  state?: Record<
    string,
    {
      loadPct?: number;
      dead?: boolean;
      dimmed?: boolean;
      highlighted?: boolean;
      badge?: { text: SdBilingual; tone?: 'default' | 'ok' | 'warn' | 'bad' };
    }
  >;
  linkState?: Record<string, { style?: SdLinkStyle }>;
  packets?: 'auto' | { id: string; linkId: string; kind: string; speed?: number; offset?: number; reverse?: boolean }[];
  zones?: string[];
  noteCard?: {
    title: SdBilingual;
    lines: { text: SdBilingual; tone?: string }[];
    position?: string;
  };
  /** StageScene đầy đủ, thay hết các trường trên. */
  raw?: unknown;
}

export interface SdLiveDef {
  sim: string;
  startAtSec?: number;
  autoplay?: boolean;
  speed?: 1 | 2 | 5;
  controls?: Record<string, unknown>;
  telemetry?: unknown[];
  slo?: unknown[];
  pauseAtSec?: number[];
  focus?: { nodes?: string[]; links?: string[] };
}

export interface SdStageFile {
  version: 1;
  nodes: Record<string, SdStageNodeDef>;
  links?: Record<string, SdStageLinkDef>;
  zones?: Record<string, { nodeIds: string[]; label: SdBilingual; tone?: string }>;
  scenes: Record<string, SdSceneDef>;
  live?: Record<string, SdLiveDef>;
}

/* ---------------- Khối `step` trong lesson.md (07 §2.3) ---------------- */

export type SdStepCategoryKey =
  | 'SETUP'
  | 'PROBLEM'
  | 'TECHNIQUE'
  | 'MECHANISM'
  | 'PITFALL'
  | 'REAL_CODE'
  | 'RECAP';

/** Chuỗi hoặc `{ vi, en? }`. */
export type SdText = string | SdBilingual;

export interface SdStepBlock {
  category?: SdStepCategoryKey;
  short?: string;
  shortEn?: string;
  scene?: string;
  live?: string;
  sim?: string;
  activity?: string;
  gate?: 'required' | 'optional';
  callout?: {
    kind: 'key-idea' | 'watch-out' | 'good-to-know' | 'compare' | 'technique';
    title?: SdText;
    vi?: string;
    en?: string;
  };
  whatChanged?: string[];
  telemetry?: { label: SdText; value: SdText; tone?: 'default' | 'ok' | 'warn' | 'bad' }[];
}

/* ---------------- curriculum.json (đầu ra của scripts/build-sysdesign.mjs) ---------------- */

export interface SdModule {
  id: string;
  slug: string;
  level: number;
  order: number;
  title: string;
  summary: string;
  titleEn?: string;
  summaryEn?: string;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  objectives: SdBilingual[];
  tags: string[];
  prerequisites?: string[];
  related?: string[];
  uses?: string[];
  concepts?: string[];
  dtsRef?: string;
  source?: SdSource | SdSource[];
  status?: 'draft' | 'review' | 'done';
  /** Markdown thô; builder runtime tách step theo `##` và khối ```step. */
  lesson: string;
  quiz: WpQuestion[];
  cards: WpCard[];
  stage: SdStageFile | null;
  activities: unknown[];
  simIds: string[];
}

export interface SdCurriculum {
  courseId: 'sysdesign';
  passQuiz: number;
  levels: Record<string, string>;
  modules: SdModule[];
}
