/**
 * curriculum.json (module + lesson.md có khối ```step) + stage.json → ScaleModuleLesson[].
 * Theo docs/sysdesign/07-content-authoring.md §2.3–§2.4 và ADR-012. Không dùng courseLessonBuilder.splitMarkdownSections
 * (cắt 10 step); builder này cắt tối đa 12 step. Chỉ import hàm tiện ích export sẵn của courseLessonBuilder.
 */
import YAML from 'yaml';
import type {
  BilingualText,
  CalloutKind,
  LiveChaosKind,
  LiveMetricSpec,
  LiveSimSpec,
  ScaleLessonStep,
  ScaleModuleLesson,
  StageRenderMode,
  StageTelemetryItem,
  StepCategory,
  StepDiffItem,
} from '@/components/scale-workbench/types';
import { buildCodeTraceFromSection, extractFirstCodeBlock } from '@/features/devops-course/scale/courseLessonBuilder';
import { sdAttributionLine } from '../credits';
import { createSim, type SimFrame, type SimScenario } from '../sim';
import type { SdBilingual, SdCurriculum, SdLiveDef, SdModule, SdStepBlock, SdText } from '../types';
import type { CourseEnOverlay } from '@/data/i18n/types';
import { buildSdMemoryScene, buildSdStageScene, toBilingual, type SdModelLike } from './sdSceneBuilder';
import { buildSdModuleStory } from './sdStoryCatalog';

export const SD_MAX_STEPS = 12;

const CATEGORIES = new Set<string>(['SETUP', 'PROBLEM', 'TECHNIQUE', 'MECHANISM', 'PITFALL', 'REAL_CODE', 'RECAP']);
const CALLOUT_KINDS = new Set<string>(['key-idea', 'watch-out', 'good-to-know', 'compare', 'technique']);
const TONES = new Set<string>(['default', 'ok', 'warn', 'bad']);
const CHAOS_KINDS = new Set<string>(['kill', 'slow', 'partition', 'expire-cache', 'hot-key', 'bad-deploy']);
const METRIC_FORMATS = new Set<string>(['rps', 'ms', 'pct', 'usd-hour', 'count']);

/** Phần tối thiểu của một phần tử `sims[id]` trong sims.json (04 §10). */
export interface SdSimDocLike {
  id: string;
  scenario?: {
    model?: SdModelLike;
    durationSec?: number;
    load?: unknown;
  };
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

/** Cache kết quả chạy headless theo simId để phân giải biến `{node.field@t:dp}` (06 §8.3, 07 §2.3). */
const headlessFrameCache = new WeakMap<object, Map<number, SimFrame>>();

function getFrameAtSec(doc: SdSimDocLike | undefined, tSec: number): SimFrame | null {
  const sc = doc?.scenario;
  if (!sc || typeof sc.durationSec !== 'number' || !sc.load || !sc.model) return null;
  let byTick = headlessFrameCache.get(sc);
  const targetTick = Math.max(0, Math.round(tSec * 10));
  if (byTick?.has(targetTick)) return byTick.get(targetTick) ?? null;

  try {
    const sim = createSim(sc as unknown as SimScenario);
    if (!byTick) {
      byTick = new Map<number, SimFrame>();
      headlessFrameCache.set(sc, byTick);
    }
    const f0 = sim.frame() ?? sim.step();
    byTick.set(f0.tick, f0);
    const maxTick = Math.min(Math.round(sc.durationSec * 10), Math.max(targetTick, 600));
    for (let k = 1; k <= maxTick; k++) {
      const f = sim.step();
      byTick.set(f.tick, f);
    }
    return byTick.get(targetTick) ?? null;
  } catch {
    return null;
  }
}

/**
 * Phân giải chuỗi chứa biến `{entity.field@t:fmt}` (vd `{cache.hitRatio@10:0%}`, `{db.rho@30:2}`).
 * Nếu không có scenario đầy đủ hoặc không tìm thấy trường ⇒ trả null để hiển thị `'—'`.
 */
export function resolveTelemetryTemplate(
  raw: string,
  doc: SdSimDocLike | undefined
): string | null {
  if (!/\{[^}]+\}/.test(raw)) return raw;
  let failed = false;
  const replaced = raw.replace(
    /\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)@([0-9.]+)(?::([^}]+))?\}/g,
    (_m, ent: string, field: string, tStr: string, fmt?: string) => {
      const tSec = Number(tStr);
      const frame = getFrameAtSec(doc, tSec);
      if (!frame) {
        failed = true;
        return '—';
      }
      let val: number | undefined;
      if (ent === 'global' || ent === 'metrics') {
        const gm = frame.metrics as unknown as Record<string, unknown>;
        if (field === 'p50' || field === 'p95' || field === 'p99' || field === 'mean') {
          val = frame.metrics.latency[field];
        } else if (typeof gm[field] === 'number') {
          val = gm[field] as number;
        }
      } else if (frame.nodes[ent]) {
        const nf = frame.nodes[ent] as unknown as Record<string, unknown>;
        if (field === 'p50' || field === 'p95' || field === 'p99' || field === 'mean') {
          val = frame.nodes[ent].latency[field];
        } else if (typeof nf[field] === 'number') {
          val = nf[field] as number;
        }
      } else if (frame.links[ent]) {
        const lf = frame.links[ent] as unknown as Record<string, unknown>;
        if (typeof lf[field] === 'number') val = lf[field] as number;
      }
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        failed = true;
        return '—';
      }
      const fStr = (fmt ?? '0').trim();
      if (fStr.endsWith('%')) {
        const dp = Math.max(0, parseInt(fStr.slice(0, -1), 10) || 0);
        return `${(val * 100).toFixed(dp)}%`;
      }
      const dp = Math.max(0, parseInt(fStr, 10) || 0);
      return val.toFixed(dp);
    }
  );
  return failed ? null : replaced;
}

function telemetryOf(
  items: SdStepBlock['telemetry'],
  simDoc: SdSimDocLike | undefined
): StageTelemetryItem[] {
  return (items ?? []).slice(0, 3).map((it) => {
    const value = textOf(it.value);
    const resolvedVi = resolveTelemetryTemplate(value.vi, simDoc);
    const resolvedEn = resolveTelemetryTemplate(value.en, simDoc);
    return {
      label: textOf(it.label),
      value:
        resolvedVi !== null && resolvedEn !== null
          ? { vi: resolvedVi, en: resolvedEn }
          : { vi: '—', en: '—' },
      tone: it.tone && TONES.has(it.tone) ? it.tone : 'default',
    };
  });
}

function toLiveSimSpec(def: SdLiveDef): LiveSimSpec {
  const rawCtrl = (def.controls ?? {}) as Record<string, unknown>;
  const chaos = Array.isArray(rawCtrl.chaos)
    ? (rawCtrl.chaos.filter((c) => typeof c === 'string' && CHAOS_KINDS.has(c)) as LiveChaosKind[])
    : undefined;
  const knobs = Array.isArray(rawCtrl.knobs)
    ? rawCtrl.knobs
        .filter(
          (k): k is { node: string; key: string } =>
            Boolean(k && typeof k === 'object' && typeof (k as { node?: unknown }).node === 'string' && typeof (k as { key?: unknown }).key === 'string')
        )
        .map((k) => ({ node: k.node, key: k.key }))
    : undefined;

  const telemetry: LiveMetricSpec[] | undefined = Array.isArray(def.telemetry)
    ? def.telemetry
        .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object' && typeof (t as { metric?: unknown }).metric === 'string'))
        .map((t) => {
          const fmt = typeof t.format === 'string' && METRIC_FORMATS.has(t.format)
            ? (t.format as LiveMetricSpec['format'])
            : 'count';
          const rawTone = t.tone && typeof t.tone === 'object' ? (t.tone as Record<string, unknown>) : undefined;
          return {
            metric: String(t.metric),
            label: toBilingual(t.label as SdBilingual | string | undefined, String(t.metric)),
            format: fmt,
            tone: rawTone
              ? {
                  warnAbove: typeof rawTone.warnAbove === 'number' ? rawTone.warnAbove : undefined,
                  badAbove: typeof rawTone.badAbove === 'number' ? rawTone.badAbove : undefined,
                  warnBelow: typeof rawTone.warnBelow === 'number' ? rawTone.warnBelow : undefined,
                  badBelow: typeof rawTone.badBelow === 'number' ? rawTone.badBelow : undefined,
                }
              : undefined,
          };
        })
    : undefined;

  const slo = Array.isArray(def.slo)
    ? def.slo
        .filter(
          (s): s is { metric: 'p99' | 'errorRate'; value: number; unit?: string } =>
            Boolean(
              s &&
                typeof s === 'object' &&
                ((s as { metric?: unknown }).metric === 'p99' || (s as { metric?: unknown }).metric === 'errorRate') &&
                typeof (s as { value?: unknown }).value === 'number'
            )
        )
        .map((s) => ({ metric: s.metric, value: s.value, unit: s.unit }))
    : undefined;

  return {
    simId: def.sim,
    startAtSec: def.startAtSec,
    autoplay: def.autoplay,
    speed: def.speed,
    controls: {
      timeline: rawCtrl.timeline !== false,
      load: Boolean(rawCtrl.load),
      chaos,
      knobs,
      tracer: Boolean(rawCtrl.tracer),
    },
    telemetry,
    slo,
    pauseAtSec: Array.isArray(def.pauseAtSec) ? def.pauseAtSec : undefined,
    focus: def.focus,
  };
}

function modelFor(
  mod: SdModule,
  simId: string | undefined,
  sims: SdSimsMap | null,
  showNodes?: string[] | '*'
): SdModelLike | null {
  if (!sims) return null;
  const orderedIds = [
    ...(simId ? [simId] : []),
    ...mod.simIds.filter((id) => id !== simId),
  ];
  const nodeMap = new Map<string, SdModelLike['nodes'][number]>();
  for (const id of orderedIds) {
    const m = sims[id]?.scenario?.model;
    if (!m) continue;
    for (const n of m.nodes ?? []) {
      if (n?.id && !nodeMap.has(n.id)) nodeMap.set(n.id, n);
    }
  }

  // Nếu module có nhiều sim (ví dụ Before/Sync và After/Async), chọn đúng sim khớp với tập node của scene
  // để không rò rỉ đường nối của kiến trúc cũ đè lên kiến trúc mới (S1-02, S2-11, S3-09).
  let chosenSimIds = orderedIds;
  if (orderedIds.length > 1) {
    if (Array.isArray(showNodes) && showNodes.length > 0) {
      let bestId = orderedIds[0];
      let bestScore = -Infinity;
      for (const id of orderedIds) {
        const m = sims[id]?.scenario?.model;
        if (!m) continue;
        const sNodes = new Set((m.nodes ?? []).map((n) => n.id));
        const covered = showNodes.filter((n) => sNodes.has(n)).length;
        const extra = Math.abs(sNodes.size - showNodes.length);
        const score = covered * 100 - extra * 10 + (id === simId ? 5 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestId = id;
        }
      }
      chosenSimIds = [bestId];
    } else {
      // Khi show.nodes === '*': nếu step chỉ định rõ sim/live thì dùng sim đó; nếu không, chọn sim có đầy đủ thành phần nhất
      let bestId = simId && sims[simId] ? simId : orderedIds[0];
      if (!simId) {
        let maxNodes = -1;
        for (const id of orderedIds) {
          const cnt = sims[id]?.scenario?.model?.nodes?.length ?? 0;
          if (cnt > maxNodes) {
            maxNodes = cnt;
            bestId = id;
          }
        }
      } else {
        // Nếu show.nodes === '*' trên một scene tĩnh mà module có sim đầy đủ hơn chứa tất cả node của stage.nodes, ưu tiên sim khớp toàn bộ stage.nodes
        const stageNodeCount = Object.keys(mod.stage?.nodes ?? {}).length;
        const curCount = sims[bestId]?.scenario?.model?.nodes?.length ?? 0;
        if (stageNodeCount > curCount) {
          for (const id of orderedIds) {
            const cnt = sims[id]?.scenario?.model?.nodes?.length ?? 0;
            if (cnt > curCount) bestId = id;
          }
        }
      }
      chosenSimIds = [bestId];
    }
  }

  const linkMap = new Map<string, SdModelLike['links'][number]>();
  for (const id of chosenSimIds) {
    const m = sims[id]?.scenario?.model;
    if (!m) continue;
    for (const l of m.links ?? []) {
      if (l?.id && !linkMap.has(l.id)) linkMap.set(l.id, l);
    }
  }
  if (nodeMap.size === 0 && linkMap.size === 0) return null;
  return {
    nodes: [...nodeMap.values()],
    links: [...linkMap.values()],
  };
}

export function buildSdModuleLesson(
  curriculum: SdCurriculum,
  mod: SdModule,
  orderInLevel: number,
  totalInLevel: number,
  sims: SdSimsMap | null,
  enOverlay?: CourseEnOverlay | null
): ScaleModuleLesson {
  const modEn = enOverlay?.modules?.[mod.id];
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
      const built = buildSdStageScene(mod.stage, def, modelFor(mod, simId, sims, def.show?.nodes));
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
    const liveDef = !wantsCode && b.live && mod.stage?.live ? mod.stage.live[b.live] : undefined;
    const stepSimId = b.sim ?? liveDef?.sim ?? mod.simIds[0];
    const stepSimDoc = stepSimId && sims ? sims[stepSimId] : undefined;

    let scene: ScaleLessonStep['scene'];
    let memoryScene: ScaleLessonStep['memoryScene'];
    let stageMode: StageRenderMode = 'code-trace';
    let liveSim: LiveSimSpec | undefined;

    if (!wantsCode) {
      const explicit = b.scene && b.scene !== 'none' ? (b.scene === '@prev' ? prevScene : b.scene) : undefined;
      let built = tryBuild(explicit, stepSimId);
      if (!built) built = tryBuild(lastIso, stepSimId);
      if (!built) built = tryBuild(baseKey, stepSimId);
      if (built) {
        stageMode = built.stageMode;
        scene = 'scene' in built ? built.scene : undefined;
        memoryScene = 'memoryScene' in built ? built.memoryScene : undefined;
        prevScene = built.key;
        if (built.stageMode === 'isometric') lastIso = built.key;

        if (liveDef && scene && built.stageMode === 'isometric') {
          stageMode = 'live-sim';
          liveSim = toLiveSimSpec(liveDef);
          // 05 §3.3 & §3.4: scene của step live-sim có packets rỗng, giữ loadPct=0 làm vật cản đặt pill
          scene = {
            ...scene,
            packets: [],
            nodes: scene.nodes.map((n) => ({
              ...n,
              loadPct: 0,
              dead: undefined,
              badge: undefined,
            })),
          };
        }
      }
    }
    const isCodeTrace = stageMode === 'code-trace';

    const stepEn = modEn?.steps?.[idx];
    const titleVi = cleanHeading(sec.heading);
    const titleEn = stepEn?.headingEn ?? titleVi;
    const shortLabel: BilingualText = {
      vi: b.short ?? shortFromHeading(sec.heading),
      en: stepEn?.shortEn ?? b.shortEn ?? b.short ?? shortFromHeading(sec.heading),
    };
    const snippet = isCodeTrace ? (extractFirstCodeBlock(sec.body) ?? brief) : undefined;
    const codeTrace =
      isCodeTrace && snippet !== undefined
        ? buildCodeTraceFromSection(
            `${mod.id} · ${mod.title}`,
            `${mod.id} · ${modEn?.titleEn ?? mod.titleEn ?? mod.title}`,
            titleVi,
            titleEn,
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
      title: { vi: titleVi, en: titleEn },
      summaryVi: sec.body,
      summaryEn: stepEn?.bodyEn ?? sec.body,
      rawMarkdownVi: sec.body,
      codeSnippet: snippet,
      callout,
      whatChanged: whatChangedOf(b.whatChanged),
      telemetry: telemetryOf(b.telemetry, stepSimDoc),
      stageMode,
      scene,
      memoryScene,
      codeTrace,
      liveSim,
      activityId: b.activity,
      activityGate: b.activity ? (b.gate ?? 'optional') : undefined,
    };
  });

  return {
    moduleId: mod.id,
    level: mod.level,
    levelTitle: {
      vi: curriculum.levels[String(mod.level)] ?? `Cấp ${mod.level}`,
      en: enOverlay?.levels?.[String(mod.level)] ?? curriculum.levels[String(mod.level)] ?? `Level ${mod.level}`,
    },
    orderInLevel,
    totalInLevel,
    title: { vi: mod.title, en: modEn?.titleEn ?? mod.titleEn ?? mod.title },
    subtitle: { vi: mod.summary, en: modEn?.summaryEn ?? mod.summaryEn ?? mod.summary },
    durationMin: mod.durationMin,
    difficulty: mod.difficulty,
    primaryMode: steps.some((s) => s.stageMode === 'isometric' || s.stageMode === 'live-sim')
      ? 'isometric'
      : steps.some((s) => s.stageMode === 'memory-2d')
        ? 'memory-2d'
        : 'code-trace',
    objectives: mod.objectives.map((o, oIdx) => ({ vi: o.vi, en: modEn?.objectivesEn?.[oIdx] ?? o.en ?? o.vi })),
    steps,
    quizCount: mod.quiz.length,
    exerciseCount: Array.isArray(mod.activities) ? mod.activities.length : 0,
    cardCount: mod.cards.length,
    readingCount: 0,
    attribution: sdAttributionLine(mod) ?? undefined,
    story: buildSdModuleStory(mod, sections),
  };
}

export function buildSdScaleLessons(
  curriculum: SdCurriculum,
  sims: SdSimsMap | null = null,
  enOverlay?: CourseEnOverlay | null
): ScaleModuleLesson[] {
  const sorted = [...curriculum.modules].sort((a, b) => a.level - b.level || a.order - b.order);
  const countByLevel = new Map<number, number>();
  for (const m of sorted) countByLevel.set(m.level, (countByLevel.get(m.level) ?? 0) + 1);
  const idx = new Map<number, number>();
  return sorted.map((m) => {
    const order = (idx.get(m.level) ?? 0) + 1;
    idx.set(m.level, order);
    return buildSdModuleLesson(curriculum, m, order, countByLevel.get(m.level) ?? 1, sims, enOverlay);
  });
}
