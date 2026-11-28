import type {
  BilingualText,
  CalloutKind,
  CodeTraceScene,
  MemoryScene,
  ScaleLessonStep,
  ScaleModuleLesson,
  StageLink,
  StageNode,
  StageNoteCard,
  StagePacket,
  StageRenderMode,
  StageScene,
  StageTelemetryItem,
  StageZoneSlab,
  StepCategory,
  StepDiffItem,
} from '@/components/scale-workbench/types';
import type { DevOpsCourseId, DevOpsCurriculum, DevOpsModule, RunResult } from '../types';
import type { PmpCurriculum, PmpModule } from '@/features/pmp-course/types';
import type { CourseEnOverlay } from '@/data/i18n/types';
import { dryRunCli } from '../engine/cliSimEngine';
import { dryRunDockerfile } from '../engine/dockerfileGrader';
import { dryRunRedisCli } from '../engine/redisCliEngine';
import { dryRunRedisConf } from '../engine/redisConfGrader';
import { dryRunYaml } from '../engine/yamlGrader';

export interface CuratedStepPayload {
  telemetry: StageTelemetryItem[];
  whatChanged: StepDiffItem[];
  callout?: {
    kind: CalloutKind;
    title?: BilingualText;
    text: BilingualText;
  };
  scene?: StageScene | null;
  memoryScene?: MemoryScene | null;
  defaultCode?: string;
}

export interface ModuleCuratedBlueprint {
  id: string;
  titleEn: string;
  subtitleEn: string;
  durationMin: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryMode: StageRenderMode;
  objectives: BilingualText[];
  buildStep: (stepIdx: number, totalSteps: number) => CuratedStepPayload;
}

interface RawSection {
  heading: string;
  body: string;
}

export function stripVisualFences(markdown: string): string {
  return markdown
    .replace(/```visual[^\n]*\n[\s\S]*?```\s*/g, '')
    .replace(/^#\s+[^\n]+\n+/m, '')
    .trim();
}

export function splitMarkdownSections(lessonMd: string): RawSection[] {
  const cleaned = lessonMd.replace(/^#\s+[^\n]+\n+/m, '').trim();
  const lines = cleaned.split('\n');
  const sections: RawSection[] = [];

  let currentHeading = '';
  let buf: string[] = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      if (currentHeading || buf.join('\n').trim()) {
        sections.push({
          heading: currentHeading || '1. Tổng quan & Bối cảnh',
          body: buf.join('\n').trim(),
        });
      }
      currentHeading = h2[1].trim();
      buf = [];
    } else {
      buf.push(line);
    }
  }

  if (currentHeading || buf.join('\n').trim()) {
    sections.push({
      heading: currentHeading || 'Tóm tắt',
      body: buf.join('\n').trim(),
    });
  }

  if (
    sections.length > 1 &&
    sections[0].heading === '1. Tổng quan & Bối cảnh' &&
    sections[0].body.length < 220 &&
    !sections[0].body.includes('```')
  ) {
    sections[1] = {
      heading: sections[1].heading,
      body: `${sections[0].body}\n\n${sections[1].body}`.trim(),
    };
    sections.shift();
  }

  return sections.slice(0, 10);
}

export function extractFirstCodeBlock(md: string): string | undefined {
  const regex = /```(?!visual)(?:[a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(md)) !== null) {
    const snippet = match[1].trim();
    if (snippet && snippet.length >= 12) {
      return snippet;
    }
  }
  return undefined;
}

export function inferStepCategory(
  heading: string,
  idx: number,
  _total: number
): StepCategory {
  const lower = heading.toLowerCase();
  if (
    lower.includes('tóm tắt') ||
    lower.includes('recap') ||
    lower.includes('checklist') ||
    lower.includes('đúc kết')
  ) {
    return 'RECAP';
  }
  if (
    lower.includes('production') ||
    lower.includes('thực chiến') ||
    lower.includes('thực tế') ||
    lower.includes('case study') ||
    lower.includes('tình huống')
  ) {
    return 'REAL_CODE';
  }
  if (
    lower.includes('bẫy') ||
    lower.includes('lỗi') ||
    lower.includes('thảm hoạ') ||
    lower.includes('thảm họa') ||
    lower.includes('⚠️') ||
    lower.includes('sự cố') ||
    lower.includes('tránh')
  ) {
    return 'PITFALL';
  }
  if (idx === 0) {
    return 'SETUP';
  }
  if (
    lower.includes('vì sao') ||
    lower.includes('so sánh') ||
    lower.includes('khác') ||
    lower.includes('vấn đề')
  ) {
    return 'PROBLEM';
  }
  if (idx % 2 === 1) {
    return 'MECHANISM';
  }
  return 'TECHNIQUE';
}

export function makeShortStepperLabel(
  heading: string,
  idx: number,
  _total: number
): BilingualText {
  const stripped = heading
    .replace(/\[!badge:[^\]]+\]/g, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[⚠️`"'[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/tóm tắt|recap|đúc kết|checklist/i.test(stripped)) {
    return { vi: 'Đúc kết', en: 'Recap' };
  }

  const lower = stripped.toLowerCase();
  let vi = '';
  if (lower.includes('thuật ngữ') || lower.includes('nhập môn') || lower.includes('đời thường')) vi = 'Thuật ngữ Nền tảng';
  else if (lower.includes('output') && lower.includes('outcome')) vi = 'Output vs Outcome';
  else if (lower.includes('mvp') && lower.includes('mmf')) vi = 'MVP vs MMF';
  else if (lower.includes('an toàn tâm lý') || lower.includes('psychological')) vi = 'An toàn Tâm lý';
  else if (lower.includes('dor') && lower.includes('dod')) vi = 'Cổng DoR/AC/DoD';
  else if (lower.includes('phản xạ phòng thi') || lower.includes('tình huống thực chiến')) vi = 'Phản xạ Phòng thi';
  else if (lower.includes('scope creep') && lower.includes('gold plating')) vi = 'Scope Creep vs Gold';
  else if (lower.includes('scope baseline') || lower.includes('wbs')) vi = 'Scope Baseline & WBS';
  else if (lower.includes('qa vs qc') || lower.includes('nghiệm thu')) vi = 'QA/QC & Nghiệm thu';
  else if (lower.includes('critical path') || lower.includes('đường găng')) vi = 'Critical Path';
  else if (lower.includes('contingency') || lower.includes('reserve')) vi = 'Quỹ Dự phòng';
  else if (lower.includes('evm')) vi = 'Chỉ số EVM';
  else if (lower.includes('risk') && lower.includes('issue')) vi = 'Risk vs Issue';
  else if (lower.includes('sourcing') || lower.includes('hợp đồng')) vi = 'Loại Hợp đồng';
  else if (lower.includes('first') && lower.includes('next')) vi = 'Từ khóa FIRST/NEXT';
  else if (lower.includes('distractor') || lower.includes('đáp án nhiễu')) vi = '12 Đáp án Nhiễu';
  else if (lower.includes('50/50') || lower.includes('2 phương án')) vi = 'Chốt 2 Phương án';
  else if (lower.includes('240 phút')) vi = 'Chiến thuật 240p';
  else if (lower.includes('business environment')) vi = 'Business Env 26%';
  else if (lower.includes('charter')) vi = 'Project Charter';
  else if (lower.includes('ccb') || lower.includes('picc')) vi = 'Kiểm soát Thay đổi';
  else if (lower.includes('seam') || lower.includes('stakeholder')) vi = 'Stakeholders & SEAM';
  else if (lower.includes('tuckman')) vi = 'Mô hình Tuckman';
  else if (lower.includes('xung đột')) vi = 'Giải quyết Xung đột';
  else if (lower.includes('kanban') || lower.includes('wip')) vi = 'Kanban & WIP';
  else if (lower.includes('scrum')) vi = 'Vai trò & Scrum';
  else if (lower.includes('stacey') || lower.includes('phổ phát triển')) vi = 'Chọn Phương pháp';

  if (!vi) {
    const firstPart = stripped.split(/[:(—–]/)[0].trim();
    const tokens = firstPart.split(/\s+/);
    const dangling = new Set(['từ', 'với', 'bằng', 'của', 'cho', 'trong', 'trên', 'qua', 'cốt', 'rạch', 'sống', 'tự', 'và', 'hoặc']);
    let count = Math.min(tokens.length, 4);
    if (count < tokens.length && dangling.has(tokens[count - 1].toLowerCase())) {
      count = Math.min(tokens.length, 5);
    }
    vi = (
      tokens.length <= count || firstPart.length <= 24
        ? firstPart
        : tokens.slice(0, count).join(' ')
    ).replace(/[,.;:]+$/, '');
  }
  let en = `Step ${idx + 1}`;
  if (lower.includes('event loop') || lower.includes('resp')) en = 'Event Loop';
  else if (lower.includes('ttl') || lower.includes('expire')) en = 'TTL & Keys';
  else if (lower.includes('hash') && lower.includes('slot')) en = 'Hash Slots';
  else if (lower.includes('hash')) en = 'Hashes';
  else if (lower.includes('zset') || lower.includes('skip')) en = 'ZSet SkipList';
  else if (lower.includes('bloom') || lower.includes('hyperloglog')) en = 'Probabilistic';
  else if (lower.includes('pipeline') || lower.includes('multi')) en = 'Pipelining';
  else if (lower.includes('lua')) en = 'Lua Atomic';
  else if (lower.includes('stream') || lower.includes('pel')) en = 'Streams & PEL';
  else if (lower.includes('cache')) en = 'Caching';
  else if (lower.includes('stampede') || lower.includes('avalanche')) en = 'Stampede Guard';
  else if (lower.includes('lock') || lower.includes('rate')) en = 'Locks & Rate';
  else if (lower.includes('eviction') || lower.includes('jemalloc')) en = 'Eviction';
  else if (lower.includes('rdb') || lower.includes('aof')) en = 'RDB & AOF';
  else if (lower.includes('sentinel') || lower.includes('replica')) en = 'Sentinel HA';
  else if (lower.includes('acl') || lower.includes('tls') || lower.includes('rbac')) en = 'Zero-Trust';
  else if (lower.includes('dockerfile') || lower.includes('multi-stage')) en = 'Dockerfile';
  else if (lower.includes('layer')) en = 'Layer Cache';
  else if (lower.includes('compose')) en = 'Compose v2';
  else if (lower.includes('pod')) en = 'Pods';
  else if (lower.includes('deployment') || lower.includes('rollout')) en = 'Rollout';
  else if (lower.includes('service') || lower.includes('dns')) en = 'Service DNS';
  else if (lower.includes('ingress') || lower.includes('gateway')) en = 'Ingress TLS';
  else if (lower.includes('configmap') || lower.includes('secret')) en = 'Config & Secret';
  else if (lower.includes('pvc') || lower.includes('stateful')) en = 'Stateful PVC';
  else if (lower.includes('probe') || lower.includes('shutdown')) en = 'Probes';
  else if (lower.includes('hpa') || lower.includes('qos')) en = 'QoS & HPA';
  else if (lower.includes('helm') || lower.includes('networkpolicy')) en = 'NetPol & Helm';
  else if (lower.includes('triage') || lower.includes('oom') || lower.includes('502')) en = 'Triage';
  else if (lower.includes('exit code')) en = 'Exit Codes';
  else if (lower.includes('runner') || lower.includes('workflow')) en = 'Workflow';
  else if (lower.includes('dag') || lower.includes('matrix')) en = 'DAG & Matrix';
  else if (lower.includes('artifact')) en = 'Artifacts';
  else if (lower.includes('oidc')) en = 'Keyless OIDC';
  else if (lower.includes('canary') || lower.includes('blue-green')) en = 'Canary / BG';
  else if (lower.includes('argocd') || lower.includes('gitops')) en = 'ArgoCD GitOps';
  else if (lower.includes('migration') || lower.includes('dora')) en = 'Migrations';
  else if (lower.includes('thuật ngữ') || lower.includes('nhập môn') || lower.includes('đời thường')) en = 'Plain Glossary';
  else if (lower.includes('output') && lower.includes('outcome')) en = 'Value & MVP';
  else if (lower.includes('dor') && lower.includes('dod')) en = 'DoR · AC · DoD';
  else if (lower.includes('an toàn tâm lý') || lower.includes('psychological')) en = 'Safety & Quality';
  else if (lower.includes('phản xạ phòng thi') || lower.includes('tình huống thực chiến')) en = 'Exam Reflex';
  else if (lower.includes('240 phút')) en = '240m Pacing';
  else if (lower.includes('50/50') || lower.includes('2 phương án')) en = '50/50 Tie-Break';
  else if (lower.includes('distractor') || lower.includes('đáp án nhiễu')) en = '12 Distractors';
  else if (lower.includes('pmbok') || lower.includes('eco')) en = 'PMBOK 8 Map';
  else if (lower.includes('stacey') || lower.includes('phổ phát triển')) en = 'Lifecycle Pick';
  else if (lower.includes('agile') || lower.includes('scrum')) en = 'Agile & Scrum';
  else if (lower.includes('wip') || lower.includes('kanban')) en = 'Kanban WIP';
  else if (lower.includes('charter') || lower.includes('ccb') || lower.includes('picc')) en = 'PICC & CCB';
  else if (lower.includes('stakeholder') || lower.includes('seam')) en = 'Stakeholders';
  else if (lower.includes('tuckman') || lower.includes('xung đột')) en = 'Team & Conflict';
  else if (lower.includes('wbs') || lower.includes('validate') || lower.includes('scope')) en = 'Scope & QC';
  else if (lower.includes('evm') || lower.includes('cpi') || lower.includes('đường găng')) en = 'CPM & EVM';
  else if (lower.includes('risk') || lower.includes('issue') || lower.includes('hợp đồng')) en = 'Risk & Sourcing';
  else if (lower.includes('first') || lower.includes('next') || lower.includes('best')) en = 'Verb Surgery';
  else if (lower.includes('compliance') || lower.includes('adkar')) en = 'OCM & AI';
  else if (idx === 0) en = 'Context';

  return {
    vi: vi || `Bước ${idx + 1}`,
    en,
  };
}

export function buildCodeTraceFromSection(
  badgeVi: string,
  badgeEn: string,
  stepTitleVi: string,
  stepTitleEn: string,
  snippet: string,
  markdownBody: string
): CodeTraceScene {
  const lines = stripVisualFences(markdownBody).split('\n');
  const rows: CodeTraceScene['rows'] = [];

  // 1) Extract markdown comparison tables first
  let inTable = false;
  for (let i = 0; i < lines.length && rows.length < 5; i++) {
    const l = lines[i].trim();
    if (l.startsWith('|') && /^\|\s*[-:]+/.test(lines[i + 1]?.trim() ?? '')) {
      inTable = true;
      i += 1;
      continue;
    }
    if (inTable && l.startsWith('|')) {
      const cells = l
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.replace(/\*\*|`/g, '').trim());
      if (cells.length >= 2 && cells[0] && cells[1]) {
        rows.push({
          step: cells[0].slice(0, 26),
          expr: cells.slice(1).join(' · ').slice(0, 110),
          result: { vi: 'Đối chiếu', en: 'Compare' },
          tone: 'ok',
        });
      }
    } else if (inTable) {
      inTable = false;
    }
  }

  // 2) Extract bullet takeaways from prose
  if (rows.length === 0) {
    for (const l of lines) {
      if (rows.length >= 5) break;
      const m = l.match(/^\s*[-*]\s+(.*)$/);
      if (m) {
        const clean = m[1].replace(/\*\*|`|==/g, '').trim();
        if (clean.length > 6) {
          rows.push({
            step: `#${rows.length + 1}`,
            expr: clean.slice(0, 115),
            result: { vi: 'Điểm chính', en: 'Key Rule' },
            tone: rows.length === 0 ? 'ok' : 'default',
          });
        }
      }
    }
  }

  if (rows.length === 0) {
    rows.push(
      {
        step: '#1',
        expr: {
          vi: 'Phân tích cấu hình / câu lệnh bên trái và đối chiếu chỉ số KPI phía trên',
          en: 'Inspect the manifest / CLI snippet on the left alongside the live KPIs above',
        },
        result: { vi: 'Kiểm tra', en: 'Verify' },
        tone: 'ok',
      },
      {
        step: '#2',
        expr: {
          vi: 'Chuyển sang tab Thực hành & Quiz để giải bài tập chấm tự động của bài này',
          en: 'Open Practice & Quiz to solve auto-graded labs for this module',
        },
        result: { vi: 'Thực hành', en: 'Practice' },
        tone: 'warn',
      }
    );
  }

  return {
    badge: { vi: badgeVi, en: badgeEn },
    code: snippet,
    traceTitle: {
      vi: `Phân tích trọng tâm · ${stepTitleVi}`,
      en: `Step Walkthrough · ${stepTitleEn}`,
    },
    rows,
  };
}

/** Smart in-browser runner for Redis 8 CLI / redis.conf / Dockerfile / K8s & CI YAML / Shell CLI */
export async function runDevOpsSnippetLive(
  courseId: DevOpsCourseId,
  code: string
): Promise<RunResult> {
  const t0 = performance.now();
  const trimmed = code.trim();
  if (!trimmed) {
    return { stdout: '', stderr: 'Chưa có nội dung câu lệnh / cấu hình.', exitCode: 1, ms: 1 };
  }

  let res: Omit<RunResult, 'ms'>;
  if (courseId === 'redis') {
    // Distinguish redis.conf directives vs redis-cli commands
    const looksLikeConf =
      /^\s*(maxmemory|maxmemory-policy|appendonly|save\s+|user\s+\w+\s+on|bind\s+|protected-mode|tls-port)/im.test(
        trimmed
      ) && !/^\s*(CONFIG\s+SET|ACL\s+SETUSER|SET\s+|HSET\s+|ZADD\s+|XADD\s+)/im.test(trimmed);
    res = looksLikeConf ? dryRunRedisConf(trimmed) : dryRunRedisCli(trimmed);
  } else if (/^\s*FROM\s+\S+/im.test(trimmed)) {
    res = dryRunDockerfile(trimmed);
  } else if (
    /^\s*(apiVersion:|name:|on:|stages:|services:|version:)/im.test(trimmed) ||
    trimmed.includes('jobs:') ||
    trimmed.includes('kind:')
  ) {
    res = dryRunYaml(trimmed);
  } else {
    res = dryRunCli(trimmed, {});
  }

  return {
    ...res,
    ms: Math.max(1, Math.round(performance.now() - t0)),
  };
}

function cleanExtractedLine(raw: string): string {
  const cleaned = raw
    .replace(/\[!badge:[^\]]+\]/g, '')
    .replace(/^\[[xX!>+\s]\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= 220) {
    return cleaned;
  }
  const plain = cleaned.replace(/==/g, '').replace(/\*\*/g, '').replace(/`/g, '');
  return `${plain.slice(0, 200).replace(/\s+\S*$/, '')}…`;
}

function extractMarkdownStepHighlights(markdownBody: string): {
  headings: string[];
  bullets: string[];
} {
  if (!markdownBody.trim()) {
    return { headings: [], bullets: [] };
  }
  // Remove visual blocks and fenced code blocks so YAML/CLI lines are not treated as prose headings/bullets
  const proseOnly = stripVisualFences(markdownBody).replace(
    /```[\s\S]*?```\s*/g,
    ''
  );
  const lines = proseOnly.split('\n');
  const headings: string[] = [];
  const bullets: string[] = [];

  let inTable = false;
  const tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      inTable = false;
      continue;
    }

    const hMatch = trimmed.match(/^###\s+(.*)$/);
    if (hMatch && headings.length < 3) {
      const hClean = cleanExtractedLine(hMatch[1].replace(/^\d+[.)]\s*/, ''));
      if (hClean.length > 2) {
        headings.push(hClean);
      }
      continue;
    }

    if (
      trimmed.startsWith('|') &&
      /^\|\s*[-:]+/.test(lines[i + 1]?.trim() ?? '')
    ) {
      inTable = true;
      i += 1;
      continue;
    }
    if (inTable && trimmed.startsWith('|')) {
      const cells = trimmed
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((c) => cleanExtractedLine(c.replace(/\\\|/g, '|')));
      if (cells.length >= 2 && cells[0] && cells[1] && tableRows.length < 3) {
        tableRows.push(`**${cells[0].replace(/\*\*/g, '')}:** ${cells[1]}`);
      }
      continue;
    }

    const bMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (bMatch && bullets.length < 4) {
      const bClean = cleanExtractedLine(bMatch[1]);
      if (bClean.length > 8) {
        bullets.push(bClean);
      }
    }
  }

  const finalBullets =
    bullets.length > 0 ? bullets : tableRows.slice(0, 3);

  return { headings, bullets: finalBullets };
}

function buildEnglishNarrative(
  titleEn: string,
  subtitleEn: string,
  objectives: BilingualText[],
  shortEn: string,
  category: StepCategory,
  stepMode: StageRenderMode,
  snippet: string | undefined,
  stepIdx: number,
  totalSteps: number,
  markdownBody = '',
  telemetry: StageTelemetryItem[] = []
): { stepTitleEn: string; summaryEn: string } {
  const stepTitleEn =
    category === 'RECAP'
      ? `Recap & Production Checklist: ${titleEn}`
      : category === 'REAL_CODE'
        ? `Real-World Case & Playbook — ${titleEn}`
        : `${stepIdx + 1}. ${shortEn} — ${titleEn}`;

  const objLine = objectives[stepIdx % Math.max(1, objectives.length)]?.en ?? subtitleEn;
  let body = `**Step ${stepIdx + 1}/${totalSteps} Focus:** ${objLine}.\n\n`;

  if (stepMode === 'isometric') {
    body += `Trace the 2.5D system architecture during **${shortEn}** — hover or click any block, connector, or badge on the stage to inspect What / How / Why & real-world pitfalls.\n\n`;
  } else if (stepMode === 'memory-2d') {
    body += `Examine the 2D structural layout for **${shortEn}** — click any slot, pointer, or node to inspect its internal mechanism.\n\n`;
  } else {
    body += `Review the concrete configuration / situational walkthrough for **${shortEn}** alongside the key rules on the right.\n\n`;
  }

  if (telemetry.length > 0) {
    const kpiSummary = telemetry
      .slice(0, 3)
      .map((item) => `**${item.label.en}:** \`${item.value.en}\``)
      .join(' · ');
    body += `${kpiSummary}\n\n`;
  }

  const { headings, bullets } = extractMarkdownStepHighlights(markdownBody);
  if (headings.length > 0 || bullets.length > 0) {
    body += `### Key Section Takeaways\n`;
    for (const h of headings) {
      body += `- **Topic:** ${h}\n`;
    }
    for (const b of bullets) {
      body += `- ${b}\n`;
    }
    body += '\n';
  }

  if (snippet) {
    body += '```\n' + snippet + '\n```';
  } else {
    body += `- Check the live telemetry KPIs above the stage as invariants change across steps.\n- Jump into **Practice & Quiz** below to test your mastery on realistic scenarios.`;
  }

  return { stepTitleEn, summaryEn: body };
}

function inferZoneLabel(courseKey: string, modId: string): BilingualText {
  if (courseKey === 'python') {
    if (modId === 'M21') {
      return { vi: 'FASTAPI · PYDANTIC BOUNDARY', en: 'FASTAPI · PYDANTIC BOUNDARY' };
    }
    if (modId === 'M22') {
      return { vi: 'CPYTHON · CONCURRENCY ENGINE', en: 'CPYTHON · CONCURRENCY ENGINE' };
    }
    if (modId === 'M24') {
      return { vi: 'DEFENSE-IN-DEPTH PERIMETER', en: 'DEFENSE-IN-DEPTH PERIMETER' };
    }
    if (modId === 'M09' || modId === 'M23') {
      return { vi: 'CLEAN ARCHITECTURE · SRC/', en: 'CLEAN ARCHITECTURE · SRC/' };
    }
    return { vi: 'CPYTHON 3.12 RUNTIME', en: 'CPYTHON 3.12 RUNTIME' };
  }
  if (courseKey === 'redis') {
    if (modId === 'R14' || modId === 'R15') {
      return { vi: 'CỤM SENTINEL HA', en: 'SENTINEL HA ZONE' };
    }
    if (modId === 'R16') {
      return { vi: 'REDIS CLUSTER · 16384 SLOTS', en: 'REDIS CLUSTER · 16384 SLOTS' };
    }
    if (modId === 'R17') {
      return { vi: 'VÙNG ZERO-TRUST · TLS & ACL', en: 'ZERO-TRUST · TLS & ACL' };
    }
    return { vi: 'REDIS IN-MEMORY ENGINE', en: 'REDIS IN-MEMORY ENGINE' };
  }
  if (courseKey === 'kube') {
    if (/^K0[0-5]$/.test(modId)) {
      return { vi: 'LINUX HOST KERNEL', en: 'LINUX HOST KERNEL' };
    }
    if (modId === 'K06') {
      return { vi: 'K8S CONTROL PLANE', en: 'K8S CONTROL PLANE' };
    }
    if (modId === 'K17') {
      return { vi: 'NAMESPACE · ZERO-TRUST', en: 'NAMESPACE · ZERO-TRUST' };
    }
    return { vi: 'KUBERNETES CLUSTER', en: 'KUBERNETES CLUSTER' };
  }
  if (courseKey === 'cicd') {
    if (modId === 'C10' || modId === 'C11') {
      return { vi: 'RANH GIỚI KEYLESS OIDC', en: 'KEYLESS OIDC TRUST' };
    }
    if (/^C1[2-5]$/.test(modId)) {
      return { vi: 'PRODUCTION · GITOPS CLUSTER', en: 'PRODUCTION · GITOPS CLUSTER' };
    }
    return { vi: 'EPHEMERAL CI RUNNER', en: 'EPHEMERAL CI RUNNER' };
  }
  return { vi: 'CỔNG QUẢN TRỊ PMBOK 8', en: 'PMBOK 8 GOVERNANCE' };
}

/**
 * Transforms static blueprint scenes into authentic Designed-to-Scale progressive stories:
 * - Step 0 (SETUP): starts with the essential 3-node baseline so Step 0 -> Step 1 morphs & drops in new components!
 * - Step >= 1: adds rounded dashed 2:1 isometric floor group zones, heartbeat/cut links, crash states, and compact formula note cards.
 */
export function choreographProgressiveScene(
  courseKey: string,
  modId: string,
  stepIdx: number,
  totalSteps: number,
  category: StepCategory,
  curated: CuratedStepPayload
): StageScene | undefined {
  const base = curated.scene;
  if (!base || base.nodes.length === 0) return undefined;

  let nodes: StageNode[] = base.nodes.map((n) => ({ ...n }));
  let links: StageLink[] = base.links.map((l) => ({ ...l }));
  let packets: StagePacket[] = base.packets.map((p) => ({ ...p }));

  // 1. Progressive Step-0 Baseline Reduction (so clicking Next into Step 2 glides & drops in the new component!)
  if (stepIdx === 0 && totalSteps >= 3 && nodes.length === 4) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const [n0, n1, n2, n3] = sorted;
    const inDeg2 = links.filter((l) => l.to === n2.id).length;
    const outDeg0 = links.filter((l) => l.from === n0.id).length;
    const outDeg1 = links.filter((l) => l.from === n1.id).length;

    if (inDeg2 >= 2) {
      // Gate topology (e.g. K17 NetworkPolicy): Step 1 shows unguarded flat access straight into n3!
      nodes = nodes.filter((nd) => nd.id !== n2.id);
      const link0 = links.find((l) => l.from === n0.id);
      const link1 = links.find((l) => l.from === n1.id);
      links = [
        {
          id: `${n0.id}_direct_${n3.id}`,
          from: n0.id,
          to: n3.id,
          style: 'danger',
          label: { vi: 'mạng phẳng (chưa chặn!)', en: 'flat network (open!)' },
          inspector: link0?.inspector,
        },
        {
          id: `${n1.id}_direct_${n3.id}`,
          from: n1.id,
          to: n3.id,
          style: 'solid',
          label: link1?.label ?? { vi: 'TCP trực tiếp', en: 'direct TCP' },
          inspector: link1?.inspector,
        },
      ];
      packets = [
        { id: 'pk_flat_0', linkId: `${n0.id}_direct_${n3.id}`, kind: 'error', speed: 0.44 },
        { id: 'pk_flat_1', linkId: `${n1.id}_direct_${n3.id}`, kind: 'request', speed: 0.44, offset: 0.45 },
      ];
    } else if (outDeg0 >= 2 || outDeg1 >= 2) {
      // Fan-out / Replica topology: Step 1 starts with primary path (omit n3 replica/shard until Step 2!)
      nodes = nodes.filter((nd) => nd.id !== n3.id);
      const keepIds = new Set(nodes.map((nd) => nd.id));
      links = links.filter((l) => keepIds.has(l.from) && keepIds.has(l.to));
      const keepLinkIds = new Set(links.map((l) => l.id));
      packets = packets.filter((p) => keepLinkIds.has(p.linkId));
    } else {
      // 4-node sequential chain (n0 -> n1 -> n2 -> n3): Step 1 shows core 3-node baseline [n0, n2, n3], then n1 drops in at Step 2!
      const l01 = links.find((l) => l.from === n0.id && l.to === n1.id);
      const l12 = links.find((l) => l.from === n1.id && l.to === n2.id);
      if (l01 && l12) {
        nodes = nodes.filter((nd) => nd.id !== n1.id);
        const keepIds = new Set(nodes.map((nd) => nd.id));
        const bridgeId = `${n0.id}_bridge_${n2.id}`;
        const otherLinks = links.filter((l) => keepIds.has(l.from) && keepIds.has(l.to));
        links = [
          {
            id: bridgeId,
            from: n0.id,
            to: n2.id,
            style: l01.style ?? 'solid',
            label: l01.label,
            inspector: l01.inspector,
          },
          ...otherLinks,
        ];
        const validLinkIds = new Set(links.map((l) => l.id));
        packets = [
          { id: 'pk_bridge', linkId: bridgeId, kind: 'request', speed: 0.45 },
          ...packets.filter((p) => validLinkIds.has(p.linkId)),
        ];
      }
    }
  } else if (stepIdx === 0 && totalSteps >= 3 && nodes.length === 3) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const [n0, n1, n2] = sorted;
    const outDeg0 = links.filter((l) => l.from === n0.id).length;
    if (outDeg0 >= 2 && !links.some((l) => l.from === n1.id && l.to === n2.id)) {
      // 3-node Fan-Out: Step 1 shows primary path [n0 -> n1], then secondary branch n2 drops in at Step 2!
      nodes = nodes.filter((nd) => nd.id !== n2.id);
      const keepIds = new Set(nodes.map((nd) => nd.id));
      links = links.filter((l) => keepIds.has(l.from) && keepIds.has(l.to));
      const validLinkIds = new Set(links.map((l) => l.id));
      packets = packets.filter((p) => validLinkIds.has(p.linkId));
    } else {
      const l01 = links.find((l) => l.from === n0.id && l.to === n1.id);
      const l12 = links.find((l) => l.from === n1.id && l.to === n2.id);
      if (l01 && l12) {
        // 3-node Pipeline: Step 1 shows direct coupling [n0 -> n2], then mediator n1 drops into the middle at Step 2!
        nodes = [n0, n2];
        const directId = `${n0.id}_direct_${n2.id}`;
        links = [
          {
            id: directId,
            from: n0.id,
            to: n2.id,
            style: 'dashed',
            label: l01.label,
            inspector: l01.inspector,
          },
        ];
        packets = [{ id: 'pk_direct', linkId: directId, kind: 'request', speed: 0.44 }];
      }
    }
  }

  // 2. Semantic Link & Failure Enrichment (heartbeat green pulse, cut red X on blocked links, dead crash state)
  const isPitfallStep =
    category === 'PITFALL' || curated.callout?.kind === 'watch-out';
  const hasOffLink = links.some((l) => l.style === 'off');

  links = links.map((l) => {
    const lblText = l.label ? `${l.label.vi} ${l.label.en}`.toLowerCase() : '';
    if (
      l.style === 'dashed' &&
      /heartbeat|gossip|probe|sentinel|sync|health|quorum/i.test(lblText)
    ) {
      return { ...l, style: 'heartbeat' };
    }
    if (
      l.style === 'danger' &&
      (hasOffLink || /block|chặn|403|401|deny|reject|cut|drop/i.test(lblText))
    ) {
      return { ...l, style: 'cut' };
    }
    return l;
  });

  if (isPitfallStep) {
    nodes = nodes.map((nd) => {
      const badgeTxt = nd.badge ? `${nd.badge.text.vi} ${nd.badge.text.en}`.toLowerCase() : '';
      if (
        nd.dead ||
        (nd.tone === 'rose' &&
          /oom|crash|down|sập|chết|502|503|spof|dead|lost/i.test(badgeTxt))
      ) {
        return { ...nd, dead: true, highlighted: true };
      }
      return nd;
    });
  }

  // 3. Dashed 2:1 Isometric Floor Zone grouping internal engine/cluster nodes (Step >= 1)
  let zones: StageZoneSlab[] | undefined = base.zones;
  if ((!zones || zones.length === 0) && stepIdx >= 1 && nodes.length >= 3) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
    const firstIsClient =
      sorted[0].shape === 'device' || sorted[0].shape === 'crowd';
    const memberNodes = firstIsClient ? sorted.slice(1) : sorted.slice(1);
    if (memberNodes.length >= 2) {
      zones = [
        {
          id: `zone-${modId}`,
          nodeIds: memberNodes.map((m) => m.id),
          label: inferZoneLabel(courseKey, modId),
          tone: isPitfallStep ? 'rose' : stepIdx >= totalSteps - 2 ? 'green' : 'neutral',
        },
      ];
    }
  }

  // 4. Compact Stage Note Card ("bảng ghi chú nhỏ") on Mechanism / Problem / Pitfall steps
  // Uses curated.whatChanged (non-redundant with top KPI strip!) + sharpest status/metric rule.
  let noteCard: StageNoteCard | undefined = base.noteCard;
  if (
    !noteCard &&
    stepIdx >= 1 &&
    (isPitfallStep || category === 'MECHANISM' || category === 'PROBLEM')
  ) {
    const shortenNote = (raw: string, max = 40): string => {
      const clean = raw.replace(/\s+/g, ' ').trim();
      if (clean.length <= max) return clean;
      const cut = clean.slice(0, max - 1);
      const lastSpace = cut.lastIndexOf(' ');
      return `${lastSpace > 20 ? cut.slice(0, lastSpace) : cut}…`;
    };

    const lines: StageNoteCard['lines'] = [];
    for (const diff of curated.whatChanged.slice(0, 2)) {
      const prefix = diff.op === '+' ? '+ ' : diff.op === '-' ? '− ' : '~ ';
      const tone: StageNoteCard['lines'][number]['tone'] =
        diff.op === '-'
          ? 'bad'
          : lines.length === 1 && diff.op === '+'
            ? 'good'
            : lines.length === 1
              ? 'muted'
              : 'plain';
      lines.push({
        text: {
          vi: `${prefix}${shortenNote(diff.text.vi, 34)}`,
          en: `${prefix}${shortenNote(diff.text.en, 35)}`,
        },
        tone,
      });
    }

    if (lines.length === 0) {
      const activeBadgeNode =
        nodes.find((nd) => nd.dead && nd.badge) ??
        nodes.find((nd) => nd.highlighted && nd.badge) ??
        nodes.find((nd) => nd.badge?.tone === 'bad' || nd.badge?.tone === 'ok');
      if (activeBadgeNode?.badge) {
        lines.push({
          text: {
            vi: `→ ${shortenNote(activeBadgeNode.badge.text.vi, 33)}`,
            en: `→ ${shortenNote(activeBadgeNode.badge.text.en, 34)}`,
          },
          tone: isPitfallStep ? 'bad' : 'good',
        });
      }
    }

    if (lines.length > 0) {
      noteCard = {
        title: isPitfallStep
          ? { vi: 'Điểm nghẽn sự cố', en: 'Failure Mechanism' }
          : { vi: 'Biến đổi ở bước này', en: 'Step Delta' },
        lines,
      };
    }
  }

  return {
    zones,
    noteCard,
    nodes,
    links,
    packets,
  };
}

export function buildDevOpsScaleLessons(
  courseId: DevOpsCourseId,
  curriculum: DevOpsCurriculum,
  levelTitles: Record<number, BilingualText>,
  blueprints: Record<string, ModuleCuratedBlueprint>,
  enOverlay?: CourseEnOverlay | null
): ScaleModuleLesson[] {
  const sorted = [...curriculum.modules].sort(
    (a, b) => a.level - b.level || a.order - b.order
  );

  const countByLevel = new Map<number, number>();
  for (const m of sorted) {
    countByLevel.set(m.level, (countByLevel.get(m.level) ?? 0) + 1);
  }

  const badgePair =
    courseId === 'redis'
      ? { vi: 'Redis 8 · CLI & Cấu hình trực tiếp', en: 'Redis 8 · Live CLI & Config' }
      : courseId === 'kube'
        ? { vi: 'Docker & K8s · Manifest & CLI', en: 'Docker & K8s · Manifest & CLI' }
        : { vi: 'CI/CD & GitOps · Workflow YAML', en: 'CI/CD & GitOps · Workflow YAML' };

  const idxCounter = new Map<number, number>();
  return sorted.map((mod: DevOpsModule) => {
    const orderInLevel = (idxCounter.get(mod.level) ?? 0) + 1;
    idxCounter.set(mod.level, orderInLevel);
    const totalInLevel = countByLevel.get(mod.level) ?? 1;

    const modEn = enOverlay?.modules?.[mod.id];
    const bp = blueprints[mod.id];
    const primaryMode: StageRenderMode = bp?.primaryMode ?? 'isometric';
    const rawSections = splitMarkdownSections(mod.lesson);
    const totalSteps = rawSections.length;
    const levelTitle = levelTitles[mod.level] ?? {
      vi: curriculum.levels[String(mod.level)] ?? `Cấp ${mod.level}`,
      en: `Stage ${mod.level}`,
    };

    const steps: ScaleLessonStep[] = rawSections.map((sec, idx) => {
      const category = inferStepCategory(sec.heading, idx, totalSteps);
      const shortLabelBase = makeShortStepperLabel(sec.heading, idx, totalSteps);
      const stepEn = modEn?.steps?.[idx];
      const shortLabel: BilingualText = {
        vi: shortLabelBase.vi,
        en: stepEn?.shortEn ?? shortLabelBase.en,
      };
      const extracted = extractFirstCodeBlock(sec.body);
      const curated = bp?.buildStep(idx, totalSteps) ?? {
        telemetry: [],
        whatChanged: [],
      };
      const fallbackEx = mod.exercises[0]?.solution || mod.exercises[0]?.starter;
      const effectiveSnippet =
        extracted ??
        curated.defaultCode ??
        fallbackEx ??
        `# ${mod.id} — ${mod.title}`;

      // Giữ nguyên một loại sân khấu trực quan xuyên suốt toàn bộ các bước của bài học
      // (người học có thể mở Code Sandbox qua nút trên thanh công cụ bất cứ lúc nào mà không bị giật chuyển chế độ)
      let stepMode: StageRenderMode = primaryMode;
      if (stepMode === 'isometric' && !curated.scene) {
        stepMode = curated.memoryScene ? 'memory-2d' : 'code-trace';
      }
      if (stepMode === 'memory-2d' && !curated.memoryScene) {
        stepMode = curated.scene ? 'isometric' : 'code-trace';
      }

      const cleanHeadingVi = sec.heading
        .replace(/\[!badge:[^\]]+\]/g, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/`/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const stepTitleEn = stepEn?.headingEn ?? cleanHeadingVi;
      const summaryEn = stepEn?.bodyEn ?? sec.body;

      const codeTrace = buildCodeTraceFromSection(
        `${mod.id} · ${badgePair.vi}`,
        `${mod.id} · ${badgePair.en}`,
        cleanHeadingVi,
        stepTitleEn,
        effectiveSnippet,
        sec.body
      );

      return {
        index: idx + 1,
        shortLabel,
        category,
        title: { vi: cleanHeadingVi, en: stepTitleEn },
        summaryVi: sec.body,
        summaryEn,
        rawMarkdownVi: sec.body,
        codeSnippet: effectiveSnippet,
        callout: curated.callout,
        whatChanged: curated.whatChanged,
        telemetry: curated.telemetry,
        stageMode: stepMode,
        scene:
          stepMode === 'isometric'
            ? choreographProgressiveScene(
                courseId,
                mod.id,
                idx,
                totalSteps,
                category,
                curated
              )
            : undefined,
        memoryScene:
          stepMode === 'memory-2d' ? (curated.memoryScene ?? undefined) : undefined,
        codeTrace,
      };
    });

    return {
      moduleId: mod.id,
      level: mod.level,
      levelTitle,
      orderInLevel,
      totalInLevel,
      title: { vi: mod.title, en: modEn?.titleEn ?? bp?.titleEn ?? mod.title },
      subtitle: { vi: mod.summary, en: modEn?.summaryEn ?? bp?.subtitleEn ?? mod.summary },
      durationMin: bp?.durationMin ?? 14,
      difficulty: bp?.difficulty ?? (mod.level <= 1 ? 'Beginner' : mod.level <= 3 ? 'Intermediate' : 'Advanced'),
      primaryMode,
      objectives: bp?.objectives ?? [],
      steps,
      quizCount: mod.quiz.length,
      exerciseCount: mod.exercises.length,
      cardCount: mod.cards.length,
      readingCount: mod.readings.length,
    };
  });
}

export function buildPmpScaleLessons(
  curriculum: PmpCurriculum,
  levelTitles: Record<number, BilingualText>,
  blueprints: Record<string, ModuleCuratedBlueprint>,
  enOverlay?: CourseEnOverlay | null
): ScaleModuleLesson[] {
  const sorted = [...curriculum.modules].sort(
    (a, b) => a.level - b.level || a.order - b.order
  );

  const countByLevel = new Map<number, number>();
  for (const m of sorted) {
    countByLevel.set(m.level, (countByLevel.get(m.level) ?? 0) + 1);
  }

  const idxCounter = new Map<number, number>();
  return sorted.map((mod: PmpModule) => {
    const orderInLevel = (idxCounter.get(mod.level) ?? 0) + 1;
    idxCounter.set(mod.level, orderInLevel);
    const totalInLevel = countByLevel.get(mod.level) ?? 1;

    const modEn = enOverlay?.modules?.[mod.id];
    const bp = blueprints[mod.id];
    const primaryMode: StageRenderMode = bp?.primaryMode ?? 'isometric';
    const rawSections = splitMarkdownSections(mod.lesson);
    const totalSteps = rawSections.length;
    const levelTitle = levelTitles[mod.level] ?? {
      vi: curriculum.levels[String(mod.level)] ?? `Cấp ${mod.level}`,
      en: `Domain Stage ${mod.level}`,
    };

    const defaultPmpBrief = [
      `# ${mod.id} — ${mod.motto}`,
      ``,
      `[Cạm bẫy đời thực]:`,
      `${mod.realWorldTrap}`,
      ``,
      `[Chuyển dịch tư duy chuẩn PMI]:`,
      `${mod.pmiMindsetShift}`,
    ].join('\n');

    const steps: ScaleLessonStep[] = rawSections.map((sec, idx) => {
      const category = inferStepCategory(sec.heading, idx, totalSteps);
      const shortLabelBase = makeShortStepperLabel(sec.heading, idx, totalSteps);
      const stepEn = modEn?.steps?.[idx];
      const shortLabel: BilingualText = {
        vi: shortLabelBase.vi,
        en: stepEn?.shortEn ?? shortLabelBase.en,
      };
      const extracted = extractFirstCodeBlock(sec.body);
      const curated = bp?.buildStep(idx, totalSteps) ?? {
        telemetry: [],
        whatChanged: [],
      };
      const effectiveSnippet = extracted ?? curated.defaultCode ?? defaultPmpBrief;

      let stepMode: StageRenderMode = primaryMode;
      if (stepMode === 'isometric' && !curated.scene) {
        stepMode = curated.memoryScene ? 'memory-2d' : 'code-trace';
      }
      if (stepMode === 'memory-2d' && !curated.memoryScene) {
        stepMode = curated.scene ? 'isometric' : 'code-trace';
      }

      const cleanHeadingVi = sec.heading
        .replace(/\[!badge:[^\]]+\]/g, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/`/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const stepTitleEn = stepEn?.headingEn ?? cleanHeadingVi;
      const summaryEn = stepEn?.bodyEn ?? sec.body;

      const codeTrace = buildCodeTraceFromSection(
        `${mod.id} · Khung Tư Duy PMI (PMBOK 8 & ECO 2026)`,
        `${mod.id} · PMI Mindset Playbook`,
        cleanHeadingVi,
        stepTitleEn,
        effectiveSnippet,
        sec.body
      );

      return {
        index: idx + 1,
        shortLabel,
        category,
        title: { vi: cleanHeadingVi, en: stepTitleEn },
        summaryVi: sec.body,
        summaryEn,
        rawMarkdownVi: sec.body,
        codeSnippet: effectiveSnippet,
        callout: curated.callout,
        whatChanged: curated.whatChanged,
        telemetry: curated.telemetry,
        stageMode: stepMode,
        scene:
          stepMode === 'isometric'
            ? choreographProgressiveScene(
                'pmp',
                mod.id,
                idx,
                totalSteps,
                category,
                curated
              )
            : undefined,
        memoryScene:
          stepMode === 'memory-2d' ? (curated.memoryScene ?? undefined) : undefined,
        codeTrace,
      };
    });

    return {
      moduleId: mod.id,
      level: mod.level,
      levelTitle,
      orderInLevel,
      totalInLevel,
      title: { vi: mod.title, en: modEn?.titleEn ?? bp?.titleEn ?? mod.title },
      subtitle: { vi: mod.summary, en: modEn?.summaryEn ?? bp?.subtitleEn ?? mod.summary },
      durationMin: bp?.durationMin ?? 15,
      difficulty: bp?.difficulty ?? (mod.level <= 1 ? 'Beginner' : mod.level <= 3 ? 'Intermediate' : 'Advanced'),
      primaryMode,
      objectives: bp?.objectives ?? [],
      steps,
      quizCount: mod.quiz.length,
      exerciseCount: 0,
      cardCount: mod.cards.length,
      readingCount: mod.evidenceLinkIds.length,
    };
  });
}
