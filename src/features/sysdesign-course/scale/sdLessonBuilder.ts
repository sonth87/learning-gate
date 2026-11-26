/**
 * curriculum.json (module + lesson.md có khối ```step) + stage.json → ScaleModuleLesson[].
 * Theo docs/sysdesign/07-content-authoring.md §2.3–§2.4 và ADR-012. Không dùng courseLessonBuilder.splitMarkdownSections
 * (cắt 10 step); builder này cắt tối đa 12 step. Chỉ import hàm tiện ích export sẵn của courseLessonBuilder.
 */
import YAML from 'yaml';
import type {
  BilingualText,
  CalloutKind,
  ScaleLessonStep,
  ScaleModuleLesson,
  StageRenderMode,
  StageTelemetryItem,
  StepCategory,
  StepDiffItem,
} from '@/components/scale-workbench/types';
import { buildCodeTraceFromSection, extractFirstCodeBlock } from '@/features/devops-course/scale/courseLessonBuilder';
import type { SdBilingual, SdCurriculum, SdModule, SdStepBlock, SdText } from '../types';
import { buildSdMemoryScene, buildSdStageScene, toBilingual, type SdModelLike } from './sdSceneBuilder';

export const SD_MAX_STEPS = 12;

const CATEGORIES = new Set<string>(['SETUP', 'PROBLEM', 'TECHNIQUE', 'MECHANISM', 'PITFALL', 'REAL_CODE', 'RECAP']);
const CALLOUT_KINDS = new Set<string>(['key-idea', 'watch-out', 'good-to-know', 'compare', 'technique']);
const TONES = new Set<string>(['default', 'ok', 'warn', 'bad']);

/** Phần tối thiểu của một phần tử `sims[id]` trong sims.json (04 §10). */
export interface SdSimDocLike {
  id: string;
  scenario?: { model?: SdModelLike };
}
export type SdSimsMap = Record<string, SdSimDocLike>;

export interface SdRawStep {
  heading: string;
  block: SdStepBlock | null;
  body: string;
}

/** Tách lesson.md thành step theo `##` (bỏ qua `##` trong code fence) và đọc khối ```step đầu mỗi step. */
export function parseSdLesson(lessonMd: string): SdRawStep[] {
  const lines = lessonMd.replace(/\r\n/g, '\n').split('\n');
  const raw: { heading: string; lines: string[] }[] = [];
  let fence = 0;
  let cur: { heading: string; lines: string[] } | null = null;
  for (const text of lines) {
    const fm = /^(`{3,})(.*)$/.exec(text);
    if (fm) {
      if (!fence) fence = fm[1].length;
      else if (fm[1].length >= fence && fm[2].trim() === '') fence = 0;
    }
    const hm = !fence && !fm ? /^##\s+(.*)$/.exec(text) : null;
    if (hm) {
      cur = { heading: hm[1].trim(), lines: [] };
      raw.push(cur);
    } else if (cur) {
      cur.lines.push(text);
    }
  }
  return raw.slice(0, SD_MAX_STEPS).map((s) => {
    const body = s.lines.join('\n');
    const m = /^\s*```step[ \t]*\n([\s\S]*?)\n```[ \t]*(?:\n|$)/.exec(body);
    let block: SdStepBlock | null = null;
    let rest = body;
    if (m) {
      try {
        const parsed = YAML.parse(m[1]);
        if (parsed && typeof parsed === 'object') block = parsed as SdStepBlock;
      } catch {
        block = null;
      }
      rest = body.slice(m[0].length);
    }
    return { heading: s.heading, block, body: rest.trim() };
  });
}

function textOf(t: SdText | undefined): BilingualText {
  return toBilingual(t as SdBilingual | string | undefined);
}

function cleanHeading(h: string): string {
  return h
    .replace(/\[!badge:[^\]]+\]/g, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortFromHeading(h: string): string {
  const c = cleanHeading(h);
  return c.length <= 16 ? c : `${c.slice(0, 15).trimEnd()}…`;
}

function fallbackCategory(idx: number, total: number): StepCategory {
  if (idx === 0) return 'SETUP';
  if (idx === total - 1 && total > 1) return 'RECAP';
  return idx % 2 === 1 ? 'MECHANISM' : 'TECHNIQUE';
}

function whatChangedOf(items: string[] | undefined): StepDiffItem[] {
  return (items ?? []).slice(0, 4).map((raw) => {
    const t = raw.trim();
    const c = t[0];
    const op: StepDiffItem['op'] = c === '+' ? '+' : c === '~' ? '~' : c === '-' || c === '−' ? '-' : '~';
    const text = c && '+~-−'.includes(c) ? t.slice(1).trim() : t;
    return { op, text: { vi: text, en: text } };
  });
}

function telemetryOf(items: SdStepBlock['telemetry']): StageTelemetryItem[] {
  return (items ?? []).slice(0, 3).map((it) => {
    const value = textOf(it.value);
    // TODO(T3.6/T4.x): biến `{node.field@t:dp}` cần engine lúc build; tạm hiển thị "—".
    const unresolved = /\{[^}]+\}/.test(value.vi);
    return {
      label: textOf(it.label),
      value: unresolved ? { vi: '—', en: '—' } : value,
      tone: it.tone && TONES.has(it.tone) ? it.tone : 'default',
    };
  });
}

function modelFor(mod: SdModule, simId: string | undefined, sims: SdSimsMap | null): SdModelLike | null {
  if (!sims) return null;
  const id = simId ?? mod.simIds[0];
  const model = id ? sims[id]?.scenario?.model : undefined;
  return model ?? null;
}

export function buildSdModuleLesson(
  curriculum: SdCurriculum,
  mod: SdModule,
  orderInLevel: number,
  totalInLevel: number,
  sims: SdSimsMap | null
): ScaleModuleLesson {
  const raw = parseSdLesson(mod.lesson ?? '');
  const sections: SdRawStep[] = raw.length
    ? raw
    : [{ heading: mod.title, block: null, body: (mod.lesson ?? '').trim() || mod.summary }];
  const total = sections.length;

  const brief = [
    `# ${mod.id} · ${mod.title}`,
    '',
    mod.summary,
    '',
    ...mod.objectives.map((o) => `- ${o.vi}`),
  ].join('\n');

  // Quy tắc chọn sân khấu (07 §2.3, guidelines §1): KHÔNG còn fallback ngầm về code-trace.
  //  - step khai báo `mode: code` và thân có code block thật ⇒ code-trace;
  //  - có scene (isometric | memory-2d) ⇒ dựng scene đó; `@prev` giữ scene trước;
  //  - không khai báo scene (hoặc `none`) ⇒ kế thừa scene isometric gần nhất trước đó, hoặc `stage.base` (mặc định: scene đầu tiên);
  //  - chỉ khi module không có stage (khai báo `stage: "none"`, hoặc dữ liệu hỏng mà doctor đã chặn) mới dùng code-trace phòng thủ.
  const scenes = mod.stage?.scenes ?? {};
  const baseKey = mod.stage
    ? mod.stage.base && scenes[mod.stage.base]
      ? mod.stage.base
      : Object.keys(scenes)[0]
    : undefined;
  let prevScene: string | undefined;
  let lastIso: string | undefined;

  const tryBuild = (key: string | undefined, simId: string | undefined) => {
    const def = key ? scenes[key] : undefined;
    if (!key || !def || !mod.stage) return null;
    const mode = def.mode ?? 'isometric';
    if (mode === 'isometric') {
      const built = buildSdStageScene(mod.stage, def, modelFor(mod, simId, sims));
      return built ? { key, stageMode: 'isometric' as const, scene: built } : null;
    }
    if (mode === 'memory-2d') {
      const mem = buildSdMemoryScene(def);
      return mem ? { key, stageMode: 'memory-2d' as const, memoryScene: mem } : null;
    }
    return null;
  };

  const steps: ScaleLessonStep[] = sections.map((sec, idx) => {
    const b = sec.block ?? {};
    const category: StepCategory =
      b.category && CATEGORIES.has(b.category) ? (b.category as StepCategory) : fallbackCategory(idx, total);

    const wantsCode = b.mode === 'code' && extractFirstCodeBlock(sec.body) !== undefined;

    let scene: ScaleLessonStep['scene'];
    let memoryScene: ScaleLessonStep['memoryScene'];
    let stageMode: StageRenderMode = 'code-trace';
    if (!wantsCode) {
      // TODO(T3.6): b.live (live-sim) tạm dựng như cảnh tĩnh theo `scene`; engine/stage live chưa có.
      const explicit = b.scene && b.scene !== 'none' ? (b.scene === '@prev' ? prevScene : b.scene) : undefined;
      let built = tryBuild(explicit, b.sim);
      if (!built) built = tryBuild(lastIso, b.sim);
      if (!built) built = tryBuild(baseKey, b.sim);
      if (built) {
        stageMode = built.stageMode;
        scene = 'scene' in built ? built.scene : undefined;
        memoryScene = 'memoryScene' in built ? built.memoryScene : undefined;
        prevScene = built.key;
        if (built.stageMode === 'isometric') lastIso = built.key;
      }
    }
    const isCodeTrace = stageMode === 'code-trace';

    const titleVi = cleanHeading(sec.heading);
    const shortLabel: BilingualText = {
      vi: b.short ?? shortFromHeading(sec.heading),
      en: b.shortEn ?? b.short ?? shortFromHeading(sec.heading),
    };
    const snippet = isCodeTrace ? (extractFirstCodeBlock(sec.body) ?? brief) : undefined;
    const codeTrace =
      isCodeTrace && snippet !== undefined
        ? buildCodeTraceFromSection(
            `${mod.id} · ${mod.title}`,
            `${mod.id} · ${mod.titleEn ?? mod.title}`,
            titleVi,
            titleVi,
            snippet,
            sec.body
          )
        : undefined;

    const callout = b.callout
      ? {
          kind: (CALLOUT_KINDS.has(b.callout.kind) ? b.callout.kind : 'key-idea') as CalloutKind,
          title: b.callout.title ? textOf(b.callout.title) : undefined,
          text: { vi: b.callout.vi ?? '', en: b.callout.en ?? b.callout.vi ?? '' },
        }
      : undefined;

    return {
      index: idx + 1,
      shortLabel,
      category,
      title: { vi: titleVi, en: titleVi },
      summaryVi: sec.body,
      summaryEn: sec.body,
      rawMarkdownVi: sec.body,
      codeSnippet: snippet,
      callout,
      whatChanged: whatChangedOf(b.whatChanged),
      telemetry: telemetryOf(b.telemetry),
      stageMode,
      scene,
      memoryScene,
      codeTrace,
    };
  });

  return {
    moduleId: mod.id,
    level: mod.level,
    levelTitle: {
      vi: curriculum.levels[String(mod.level)] ?? `Cấp ${mod.level}`,
      en: curriculum.levels[String(mod.level)] ?? `Level ${mod.level}`,
    },
    orderInLevel,
    totalInLevel,
    title: { vi: mod.title, en: mod.titleEn ?? mod.title },
    subtitle: { vi: mod.summary, en: mod.summaryEn ?? mod.summary },
    durationMin: mod.durationMin,
    difficulty: mod.difficulty,
    primaryMode: steps.some((s) => s.stageMode === 'isometric')
      ? 'isometric'
      : steps.some((s) => s.stageMode === 'memory-2d')
        ? 'memory-2d'
        : 'code-trace',
    objectives: mod.objectives.map((o) => ({ vi: o.vi, en: o.en ?? o.vi })),
    steps,
    quizCount: mod.quiz.length,
    // TODO(T4.1): đếm activity khi có onOpenExercises.
    exerciseCount: 0,
    cardCount: mod.cards.length,
    readingCount: 0,
  };
}

export function buildSdScaleLessons(curriculum: SdCurriculum, sims: SdSimsMap | null = null): ScaleModuleLesson[] {
  const sorted = [...curriculum.modules].sort((a, b) => a.level - b.level || a.order - b.order);
  const countByLevel = new Map<number, number>();
  for (const m of sorted) countByLevel.set(m.level, (countByLevel.get(m.level) ?? 0) + 1);
  const idx = new Map<number, number>();
  return sorted.map((m) => {
    const order = (idx.get(m.level) ?? 0) + 1;
    idx.set(m.level, order);
    return buildSdModuleLesson(curriculum, m, order, countByLevel.get(m.level) ?? 1, sims);
  });
}
