import type { WpCurriculum, WpModule } from '@/features/workpath/types';
import type {
  BilingualText,
  ScaleLessonStep,
  ScaleModuleLesson,
  StageRenderMode,
  StepCategory,
} from '@/components/scale-workbench/types';
import {
  PY_SPECS_PART1,
  type PyModuleVisualSpec,
  type StepVisualFrame,
} from './pythonSpecsPart1';
import { PY_SPECS_PART2 } from './pythonSpecsPart2';
import {
  PYTHON_PRIMARY_MODE,
  buildCodeTraceScene,
  buildCuratedIsometricScene,
  buildCuratedMemoryScene,
} from './pythonModeCurator';
import { choreographProgressiveScene } from '@/features/devops-course/scale/courseLessonBuilder';
import curatedReadingsRaw from '@/data/workpath/readings.json';

const CURATED_READINGS_CODE = curatedReadingsRaw as Record<string, string>;

export const ALL_PY_SPECS: Record<string, PyModuleVisualSpec> = {
  ...PY_SPECS_PART1,
  ...PY_SPECS_PART2,
};

export const PY_LEVEL_TITLES: Record<number, BilingualText> = {
  0: { vi: 'Khởi động & Tư duy Runtime', en: 'Foundations & Runtime Setup' },
  1: { vi: 'Nền tảng Cú pháp & Luồng điều khiển', en: 'Core Syntax & Control Flow' },
  2: { vi: 'Cấu trúc Dữ liệu & Thư viện gốc', en: 'Data Structures & Core Batteries' },
  3: { vi: 'Hàm, Đệ quy & Kiến trúc Package', en: 'Functions, Recursion & Packages' },
  4: { vi: 'Ngoại lệ, File Stream & Script CLI', en: 'Exceptions, File Streams & CLI' },
  5: { vi: 'Hướng đối tượng (OOP & Dataclass)', en: 'Object-Oriented Design & Dataclasses' },
  6: { vi: 'Pythonic: Generator, Decorator & Pytest', en: 'Pythonic: Generators, Decorators & Testing' },
  7: { vi: 'Thuật toán, Big-O, Cây & Quy hoạch động', en: 'Algorithms, Big-O, Graphs & DP' },
  8: { vi: 'Thực chiến: FastAPI, Async/GIL & Bảo mật', en: 'Production: FastAPI, Async/GIL & Security' },
};

interface RawSection {
  heading: string;
  body: string;
}

function stripVisualFences(markdown: string): string {
  return markdown
    .replace(/```visual[^\n]*\n[\s\S]*?```\s*/g, '')
    .replace(/^#\s+[^\n]+\n+/m, '')
    .trim();
}

function splitMarkdownSections(lessonMd: string): RawSection[] {
  const cleaned = stripVisualFences(lessonMd);
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

  // Merge tiny intro paragraph into first real section if intro has < 140 chars and no code block
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

  return sections.slice(0, 11);
}

function extractFirstPythonCode(md: string): string | undefined {
  const regex = /```(?:python|py|)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(md)) !== null) {
    const snippet = match[1].trim();
    if (
      snippet &&
      !snippet.startsWith('uv ') &&
      !snippet.startsWith('pwd') &&
      !snippet.startsWith('npm ') &&
      !snippet.startsWith('const ') &&
      !snippet.startsWith('function ')
    ) {
      return snippet;
    }
  }
  return undefined;
}

function inferStepCategory(
  heading: string,
  idx: number,
  total: number
): StepCategory {
  const lower = heading.toLowerCase();
  if (idx === total - 1 || lower.includes('tóm tắt') || lower.includes('recap')) {
    return 'RECAP';
  }
  if (lower.includes('python-master') || lower.includes('thực tế') || lower.includes('project')) {
    return 'REAL_CODE';
  }
  if (
    lower.includes('bẫy') ||
    lower.includes('lỗi') ||
    lower.includes('⚠️') ||
    lower.includes('tránh') ||
    lower.includes('không dùng')
  ) {
    return 'PITFALL';
  }
  if (idx === 0) {
    return 'SETUP';
  }
  if (lower.includes('so sánh') || lower.includes('khác') || lower.includes('bản đồ')) {
    return 'PROBLEM';
  }
  if (idx % 2 === 1) {
    return 'MECHANISM';
  }
  return 'TECHNIQUE';
}

function makeShortStepperLabel(heading: string, idx: number, total: number): BilingualText {
  const stripped = heading
    .replace(/^\d+[.)]\s*/, '')
    .replace(/[⚠️`"'[\]]/g, '')
    .trim();

  if (idx === total - 1 || /tóm tắt/i.test(stripped)) {
    return { vi: 'Đúc kết', en: 'Recap' };
  }
  if (/python-master|ví dụ áp dụng/i.test(stripped)) {
    return { vi: 'Ví dụ áp dụng', en: 'Case Study' };
  }
  if (/bẫy|cạm bẫy|lỗi hay gặp/i.test(stripped)) {
    return { vi: 'Cạm bẫy', en: 'Pitfall' };
  }

  const firstPart = stripped.split(/[:(—–]/)[0].trim();
  const tokens = firstPart.split(/\s+/);
  const wordsVi = (
    tokens.length <= 4 || firstPart.length <= 20
      ? firstPart
      : tokens.slice(0, 4).join(' ')
  ).replace(/[,.;:]+$/, '');

  // Map common Vietnamese technical phrases to crisp 1-2 word English stepper milestones
  const lower = stripped.toLowerCase();
  let en = `Phase ${idx + 1}`;
  if (lower.includes('hệ sinh thái')) en = 'Ecosystem';
  else if (lower.includes('i/o-bound') || lower.includes('đồng bộ 1 luồng')) en = 'Sync vs I/O';
  else if (lower.includes('event loop')) en = 'Event Loop';
  else if (lower.includes('processpool') || lower.includes('đa tiến trình')) en = 'Multi-Core';
  else if (lower.includes('gil') || lower.includes('đa luồng') || lower.includes('thread')) en = 'Threads & GIL';
  else if (lower.includes('blocking')) en = 'Loop Pitfalls';
  else if (lower.includes('3 lớp') || lower.includes('clean architecture')) en = 'Clean Arch';
  else if (lower.includes('rate limit') || lower.includes('compare_digest')) en = 'Rate Limit';
  else if (lower.includes('scrypt') || lower.includes('pbkdf2') || lower.includes('argon2')) en = 'Password KDF';
  else if (lower.includes('radar') || lower.includes('cờ đỏ') || lower.includes('mã độc')) en = 'Red Flags';
  else if (lower.includes('giới hạn') || lower.includes('độ sâu')) en = 'Stack Limit';
  else if (lower.includes('lồng nhau') || lower.includes('dữ liệu lồng')) en = 'Nested Data';
  else if (lower.includes('chia để trị')) en = 'Divide & Conquer';
  else if (lower.includes('debug')) en = 'Debugging';
  else if (lower.includes('javascript') || lower.includes('typescript') || lower.includes('node') || lower.includes('so với js') || lower.includes('ánh xạ')) en = 'Comparison';
  else if (lower.includes('cú pháp') || lower.includes('cấu trúc')) en = 'Syntax';
  else if (lower.includes('chạy thử')) en = 'Quick Run';
  else if (lower.includes('thứ tự') || lower.includes('ưu tiên')) en = 'Precedence';
  else if (lower.includes('sai số')) en = 'Float Drift';
  else if (lower.includes('ép kiểu') || lower.includes('chuyển đổi')) en = 'Type Cast';
  else if (lower.includes('truthy')) en = 'Truthy/Falsy';
  else if (lower.includes('none')) en = 'None Check';
  else if (lower.includes('print')) en = 'print()';
  else if (lower.includes('comment')) en = 'Comments';
  else if (lower.includes('biến')) en = 'Variables';
  else if (lower.includes('input') || lower.includes('nhập')) en = 'Input';
  else if (lower.includes('hàm') || lower.includes('def')) en = 'Functions';
  else if (lower.includes('f-string')) en = 'f-string';
  else if (lower.includes('slicing')) en = 'Slicing';
  else if (lower.includes('bất biến') || lower.includes('immutable')) en = 'Immutable';
  else if (lower.includes('3 ngôi')) en = 'Ternary';
  else if (lower.includes('biên')) en = 'Edge Cases';
  else if (lower.includes('if') || lower.includes('elif')) en = 'Branching';
  else if (lower.includes('match')) en = 'match/case';
  else if (lower.includes('for') && lower.includes('else')) en = 'for-else';
  else if (lower.includes('tích luỹ')) en = 'Accumulator';
  else if (lower.includes('break')) en = 'break/continue';
  else if (lower.includes('while')) en = 'while Loop';
  else if (lower.includes('for') || lower.includes('lặp') || lower.includes('duyệt')) en = 'Iteration';
  else if (lower.includes('sao chép')) en = 'Copy Trap';
  else if (lower.includes('sort')) en = 'Sorting';
  else if (lower.includes('unpack')) en = 'Unpacking';
  else if (lower.includes('tuple')) en = 'Tuples';
  else if (lower.includes('hash')) en = 'Hashable';
  else if (lower.includes('counter')) en = 'Counter';
  else if (lower.includes('gộp') || lower.includes('cập nhật')) en = 'Merging';
  else if (lower.includes('dict')) en = 'Dict O(1)';
  else if (lower.includes('set')) en = 'Set Ops';
  else if (lower.includes('json')) en = 'JSON';
  else if (lower.includes('csv')) en = 'CSV';
  else if (lower.includes('comprehension')) en = 'Comprehension';
  else if (lower.includes('yield') || lower.includes('generator')) en = 'Generator';
  else if (lower.includes('dựng sẵn')) en = 'Built-ins';
  else if (lower.includes('try') || lower.includes('except') || lower.includes('baseexception')) en = 'try/except';
  else if (lower.includes('raise')) en = 'raise';
  else if (lower.includes('eafp')) en = 'EAFP';
  else if (lower.includes('khám phá')) en = 'Inspect';
  else if (lower.includes('import')) en = 'Imports';
  else if (lower.includes('legb') || lower.includes('phạm vi')) en = 'LEGB Scope';
  else if (lower.includes('tham số')) en = 'Parameters';
  else if (lower.includes('fibonacci') || lower.includes('cache')) en = '@cache';
  else if (lower.includes('đệ quy')) en = 'Recursion';
  else if (lower.includes('uv')) en = 'uv Tooling';
  else if (lower.includes('traceback') || lower.includes('ngoại lệ')) en = 'Traceback';
  else if (lower.includes('pathlib') || lower.includes('đường dẫn')) en = 'Paths';
  else if (lower.includes('with open')) en = 'with open';
  else if (lower.includes('argparse')) en = 'argparse';
  else if (lower.includes('stdout') || lower.includes('exit')) en = 'Stdio & Exit';
  else if (lower.includes('stdin')) en = 'Stdin Pipe';
  else if (lower.includes('self')) en = 'self Binding';
  else if (lower.includes('repr') || lower.includes('dunder')) en = 'Dunders';
  else if (lower.includes('kế thừa') || lower.includes('super')) en = 'super()';
  else if (lower.includes('property')) en = '@property';
  else if (lower.includes('classmethod')) en = '@classmethod';
  else if (lower.includes('dataclass')) en = '@dataclass';
  else if (lower.includes('trừu tượng') || lower.includes('duck')) en = 'Duck Typing';
  else if (lower.includes('pipeline')) en = 'Lazy Pipeline';
  else if (lower.includes('itertools')) en = 'itertools';
  else if (lower.includes('decorator') || lower.includes('wraps')) en = '@decorator';
  else if (lower.includes('context')) en = 'with Block';
  else if (lower.includes('type hint')) en = 'Type Hints';
  else if (lower.includes('pytest') || lower.includes('testing') || lower.includes('doctest') || lower.includes('test')) en = 'Pytest';
  else if (lower.includes('big-o')) en = 'Big-O';
  else if (lower.includes('binary') || lower.includes('bisect')) en = 'Bisect';
  else if (lower.includes('timsort') || lower.includes('sorted')) en = 'Timsort';
  else if (lower.includes('heapq')) en = 'heapq';
  else if (lower.includes('stack')) en = 'Stack';
  else if (lower.includes('queue') || lower.includes('deque')) en = 'Deque O(1)';
  else if (lower.includes('linked')) en = 'Linked List';
  else if (lower.includes('bst') || lower.includes('cây')) en = 'Trees';
  else if (lower.includes('đồ thị') || lower.includes('bfs')) en = 'Graph BFS';
  else if (lower.includes('quy hoạch động') || lower.includes('dp') || lower.includes('levenshtein')) en = 'DP Table';
  else if (lower.includes('quay lui') || lower.includes('pruning')) en = 'Backtrack';
  else if (lower.includes('fastapi')) en = 'FastAPI';
  else if (lower.includes('api') || lower.includes('http')) en = 'HTTP Client';
  else if (lower.includes('async')) en = 'asyncio';
  else if (lower.includes('sqlite')) en = 'SQLite';
  else if (lower.includes('tkinter') || lower.includes('gui') || lower.includes('giao diện')) en = 'UI Shell';
  else if (lower.includes('review') || lower.includes('checklist')) en = 'Checklist';
  else if (lower.includes('mật khẩu') || lower.includes('phòng thủ')) en = 'Defense';
  else if (lower.includes('log')) en = 'Log Triage';
  else if (idx === 0) en = 'Setup';

  return {
    vi: wordsVi || `Bước ${idx + 1}`,
    en,
  };
}

function extractInlineSymbols(line: string, limit = 6): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const re = /`([^`\n]{1,52})`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null && found.length < limit) {
    const token = m[1].trim();
    if (token && !seen.has(token)) {
      seen.add(token);
      found.push(token);
    }
  }
  return found;
}

function extractSectionStructureForEnglish(sectionBody: string): {
  subheadings: string[];
  bulletSymbols: string[];
  tableMarkdown: string;
} {
  // Strip fenced code blocks so we inspect prose, headings, bullets, and tables only
  const withoutCode = sectionBody.replace(/```[\s\S]*?```/g, '');
  const lines = withoutCode.split('\n');

  const subheadings: string[] = [];
  const bulletSymbols: string[] = [];
  const tableBlocks: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i].trim();

    // Capture ### subheadings with their inline code/library anchors
    const h3 = raw.match(/^###\s+(.*)$/);
    if (h3 && subheadings.length < 4) {
      const syms = extractInlineSymbols(h3[1], 3);
      if (syms.length > 0) {
        subheadings.push(syms.map((s) => `\`${s}\``).join(' · '));
      }
      i++;
      continue;
    }

    // Capture Markdown tables (preserving code/API/complexity columns cleanly)
    if (
      raw.startsWith('|') &&
      /^\|\s*[-:]+/.test((lines[i + 1] ?? '').trim()) &&
      tableBlocks.length < 2
    ) {
      const splitRow = (r: string) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split(/(?<!\\)\|/)
          .map((c) => c.trim());

      const headers = splitRow(raw);
      const firstHeader = headers[0] ?? '';
      const isJsTsTable = /^(JavaScript|TypeScript|JS\b|Node)/i.test(firstHeader);
      i += 2;
      const dataRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        dataRows.push(splitRow(lines[i]));
        i++;
      }

      if (dataRows.length > 0 && headers.length >= 2) {
        if (isJsTsTable) {
          const leftHead = firstHeader.includes('TypeScript')
            ? 'TypeScript'
            : 'JavaScript / Node.js';
          const outRows = [
            `| ${leftHead} | Python 3.12+ |`,
            '|---|---|',
          ];
          for (const r of dataRows.slice(0, 6)) {
            const c0 = extractInlineSymbols(r[0] ?? '', 2)
              .map((s) => `\`${s}\``)
              .join(' / ') || (r[0] ?? '').slice(0, 48);
            const c1 = extractInlineSymbols(r[1] ?? '', 2)
              .map((s) => `\`${s}\``)
              .join(' / ') || (r[1] ?? '').slice(0, 56);
            if (c0 && c1) {
              outRows.push(`| ${c0} | ${c1} |`);
            }
          }
          if (outRows.length > 2) {
            tableBlocks.push(outRows.join('\n'));
          }
        } else {
          const outRows = [
            '| Construct / Metric | Key API & Pattern |',
            '|---|---|',
          ];
          for (const r of dataRows.slice(0, 6)) {
            const col0Syms = extractInlineSymbols(r[0] ?? '', 2).map((s) => `\`${s}\``);
            const colRestSyms = r
              .slice(1)
              .flatMap((cell) => extractInlineSymbols(cell, 2))
              .slice(0, 3)
              .map((s) => `\`${s}\``);
            const boldMatch = (r[0] ?? '').match(/\*\*([^*]+)\*\*/);
            const left =
              col0Syms.join(', ') ||
              (boldMatch ? `**${boldMatch[1]}**` : (r[0] ?? '').slice(0, 36));
            const right =
              colRestSyms.join(' · ') ||
              ((r[1] ?? '').match(/O\([^)]+\)|\d[\d.,\s]*%?/g)?.join(' · ') ?? '');
            if (left && right) {
              outRows.push(`| ${left} | ${right} |`);
            }
          }
          if (outRows.length > 2) {
            tableBlocks.push(outRows.join('\n'));
          }
        }
      }
      continue;
    }

    // Capture bullet / numbered items' key code & library identifiers
    const bullet = raw.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (bullet && bulletSymbols.length < 5) {
      const content = bullet[1];
      const syms = extractInlineSymbols(content, 3);
      const boldLib = content.match(/\*\*`?([A-Za-z0-9_./+\s-]+)`?\*\*/);
      if (syms.length > 0) {
        bulletSymbols.push(syms.map((s) => `\`${s}\``).join(' → '));
      } else if (boldLib && /^[A-Za-z0-9_./+\s-]+$/.test(boldLib[1].trim())) {
        bulletSymbols.push(`**${boldLib[1].trim()}**`);
      }
    }

    i++;
  }

  return {
    subheadings,
    bulletSymbols,
    tableMarkdown: tableBlocks.join('\n\n'),
  };
}

function buildEnglishStepNarrative(
  spec: PyModuleVisualSpec,
  rawHeading: string,
  shortEn: string,
  category: StepCategory,
  stepMode: StageRenderMode,
  codeSnippet: string | undefined,
  rawSectionBody: string,
  frame: StepVisualFrame,
  stepIdx: number,
  totalSteps: number
): { titleEn: string; summaryEn: string } {
  const headingSyms = extractInlineSymbols(rawHeading, 3);
  const symSuffix =
    headingSyms.length > 0 ? `: ${headingSyms.map((s) => `\`${s}\``).join(', ')}` : '';

  const titleEn =
    category === 'RECAP'
      ? `Recap & Decision Checklist: ${spec.titleEn}`
      : category === 'REAL_CODE'
        ? `${stepIdx + 1}. Real-World Code Audit & Ecosystem — ${spec.titleEn.split(':')[0]}`
        : `${stepIdx + 1}. ${shortEn}${symSuffix} — ${spec.titleEn.split(':')[0]}`;

  const objectiveLine =
    spec.objectives[stepIdx % spec.objectives.length]?.en ?? spec.subtitleEn;

  const { subheadings, bulletSymbols, tableMarkdown } =
    extractSectionStructureForEnglish(rawSectionBody);

  const chunks: string[] = [];

  if (category === 'RECAP') {
    chunks.push(`### Module Mastery Checklist (${spec.id})`);
    chunks.push(
      spec.objectives.map((obj) => `- [x] ${obj.en}`).join('\n')
    );
  } else {
    chunks.push(`**Step ${stepIdx + 1}/${totalSteps} Goal:** ${objectiveLine}.`);

    // Surface step-specific changes from the curated frame (never generic boilerplate!)
    if (frame.whatChanged.length > 0) {
      chunks.push(
        frame.whatChanged
          .map((diff) => {
            const prefix =
              diff.op === '+' ? '**Added:**' : diff.op === '-' ? '**Eliminated:**' : '**Updated:**';
            return `- ${prefix} ${diff.text.en}`;
          })
          .join('\n')
      );
    }

    // Surface structured telemetry metrics for this exact step
    if (frame.telemetry.length > 0) {
      const metricsLine = frame.telemetry
        .slice(0, 4)
        .map((t) => `\`${t.label.en}\`: **${t.value.en}**`)
        .join(' · ');
      chunks.push(metricsLine);
    }
  }

  if (subheadings.length > 0) {
    chunks.push(`**Topics covered:** ${subheadings.join(' | ')}`);
  }

  if (bulletSymbols.length > 0 && category !== 'RECAP') {
    chunks.push(
      `**Key constructs & libraries in this step:** ${bulletSymbols.join(' · ')}`
    );
  }

  if (frame.callout) {
    const alertTag =
      frame.callout.kind === 'watch-out'
        ? '[!WARNING]'
        : frame.callout.kind === 'technique' || frame.callout.kind === 'good-to-know'
          ? '[!TIP]'
          : '[!NOTE]';
    chunks.push(`> ${alertTag}\n> ${frame.callout.text.en}`);
  }

  if (tableMarkdown) {
    chunks.push(tableMarkdown);
  }

  if (codeSnippet) {
    chunks.push('```python\n' + codeSnippet + '\n```');
  } else if (stepMode === 'isometric') {
    chunks.push(
      `_Tip: Click any 2.5D block or connector on the stage during **${shortEn}** to inspect its runtime mechanics._`
    );
  } else if (stepMode === 'memory-2d') {
    chunks.push(
      `_Tip: Click any pointer, array cell, or heap object on the 2D memory stage to inspect its invariants._`
    );
  }

  return { titleEn, summaryEn: chunks.join('\n\n') };
}

export function buildPythonScaleModule(
  mod: WpModule,
  orderInLevel: number,
  totalInLevel: number
): ScaleModuleLesson {
  const spec: PyModuleVisualSpec = ALL_PY_SPECS[mod.id] ?? ALL_PY_SPECS.M00;
  const primaryMode: StageRenderMode = PYTHON_PRIMARY_MODE[mod.id] ?? 'code-trace';
  const rawSections = splitMarkdownSections(mod.lesson);

  // Nhúng các snippet chọn lọc (mod.readings) trực tiếp vào bài học tương ứng trước bước Tóm tắt
  const validReadings = (mod.readings ?? []).filter(
    (r) => typeof CURATED_READINGS_CODE[r.path] === 'string'
  );
  if (validReadings.length > 0) {
    const blocks = validReadings.slice(0, 3).map((r, i) => {
      const snippet = CURATED_READINGS_CODE[r.path].trim();
      const parts = [
        `### Ví dụ ${i + 1}: \`${r.path}\``,
        r.note,
        '```python\n' + snippet + '\n```',
      ];
      if (r.task) {
        parts.push(`**Câu hỏi phân tích:** ${r.task}`);
      }
      if (r.answer) {
        parts.push(`> **Gợi ý trả lời:** ${r.answer}`);
      }
      return parts.join('\n\n');
    });

    const readingSection = {
      heading: 'Ví dụ áp dụng thực tế trong bài học',
      body: blocks.join('\n\n---\n\n'),
    };
    const insertAt = Math.max(1, rawSections.length - 1);
    rawSections.splice(insertAt, 0, readingSection);
  }

  const totalSteps = rawSections.length;
  const levelTitle = PY_LEVEL_TITLES[mod.level] ?? {
    vi: `Cấp ${mod.level}`,
    en: `Level ${mod.level}`,
  };

  const steps: ScaleLessonStep[] = rawSections.map((sec, idx) => {
    const category = inferStepCategory(sec.heading, idx, totalSteps);
    const shortLabel = makeShortStepperLabel(sec.heading, idx, totalSteps);
    const codeSnippet = extractFirstPythonCode(sec.body);
    const frame = spec.buildFrame(idx, totalSteps);
    const cleanHeadingVi = sec.heading
      .replace(/^\d+[.)]\s*/, '')
      .replace(/`/g, '')
      .trim();

    // Choose the honest visual mode per step:
    // - Recap / Real-Code steps or Group-C syntax modules use 'code-trace' (no forced diagrams!)
    // - Group-A architectural steps use curated 8-layer 'isometric'
    // - Group-B data-structure steps use spacious 2D 'memory-2d'
    let stepMode: StageRenderMode = primaryMode;
    if (category === 'RECAP' || category === 'REAL_CODE') {
      stepMode = 'code-trace';
    }

    const rawIsoScene =
      stepMode === 'isometric'
        ? buildCuratedIsometricScene(mod.id, idx)
        : null;
    if (stepMode === 'isometric' && !rawIsoScene) {
      stepMode = 'code-trace';
    }
    const isoScene =
      stepMode === 'isometric' && rawIsoScene
        ? (choreographProgressiveScene('python', mod.id, idx, totalSteps, category, {
            telemetry: frame.telemetry,
            whatChanged: frame.whatChanged,
            callout: frame.callout,
            scene: rawIsoScene,
          }) ?? rawIsoScene)
        : null;

    const memScene =
      stepMode === 'memory-2d'
        ? buildCuratedMemoryScene(mod.id, idx)
        : null;
    if (stepMode === 'memory-2d' && !memScene) {
      stepMode = 'code-trace';
    }

    const { titleEn, summaryEn } = buildEnglishStepNarrative(
      spec,
      sec.heading,
      shortLabel.en,
      category,
      stepMode,
      codeSnippet,
      sec.body,
      frame,
      idx,
      totalSteps
    );

    const codeTrace = buildCodeTraceScene(
      mod.id,
      cleanHeadingVi,
      titleEn,
      codeSnippet,
      sec.body
    );

    return {
      index: idx + 1,
      shortLabel,
      category,
      title: {
        vi: cleanHeadingVi,
        en: titleEn,
      },
      summaryVi: sec.body,
      summaryEn,
      rawMarkdownVi: sec.body,
      codeSnippet,
      callout: frame.callout,
      whatChanged: frame.whatChanged,
      telemetry: frame.telemetry,
      stageMode: stepMode,
      scene: isoScene ?? undefined,
      memoryScene: memScene ?? undefined,
      codeTrace,
    };
  });

  return {
    moduleId: mod.id,
    level: mod.level,
    levelTitle,
    orderInLevel,
    totalInLevel,
    title: {
      vi: mod.title,
      en: spec.titleEn,
    },
    subtitle: {
      vi: mod.summary,
      en: spec.subtitleEn,
    },
    durationMin: spec.durationMin,
    difficulty: spec.difficulty,
    primaryMode,
    objectives: spec.objectives,
    steps,
    quizCount: mod.quiz.length,
    exerciseCount: mod.exercises.length,
    cardCount: mod.cards.length,
    readingCount: mod.readings.length,
  };
}

export function buildAllPythonScaleLessons(
  curriculum: WpCurriculum
): ScaleModuleLesson[] {
  const sorted = [...curriculum.modules].sort(
    (a, b) => a.level - b.level || a.order - b.order
  );

  const countByLevel = new Map<number, number>();
  for (const m of sorted) {
    countByLevel.set(m.level, (countByLevel.get(m.level) ?? 0) + 1);
  }

  const indexCounter = new Map<number, number>();
  return sorted.map((m) => {
    const nextIdx = (indexCounter.get(m.level) ?? 0) + 1;
    indexCounter.set(m.level, nextIdx);
    return buildPythonScaleModule(
      m,
      nextIdx,
      countByLevel.get(m.level) ?? 1
    );
  });
}
