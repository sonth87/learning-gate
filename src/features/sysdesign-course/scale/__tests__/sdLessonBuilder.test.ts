/**
 * Test builder bài học (T1.1c): S1-03 thật + các bài tổng hợp kiểm quy tắc chọn sân khấu
 * (07 §2.3: không còn fallback code-trace; scene kế thừa; memory-2d; `mode: code`).
 */
import curriculumJson from '@/data/courses/sysdesign/curriculum.json';
import simsJson from '@/data/courses/sysdesign/sims.json';
import type { SdCurriculum, SdModule } from '../../types';
import { buildSdScaleLessons, parseSdLesson, SD_MAX_STEPS } from '../sdLessonBuilder';

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error(`[sdLessonBuilder] FAIL: ${msg}`);
    process.exit(1);
  }
}

const cur = curriculumJson as unknown as SdCurriculum;

// 1) Bài S1-03 thật từ sd:build
const lessons = buildSdScaleLessons(cur, simsJson.sims as never);
assert(lessons.length === cur.modules.length, 'mỗi module có một lesson');
const s103 = lessons.find((l) => l.moduleId === 'S1-03');
assert(s103, 'có lesson S1-03');
assert(s103!.steps.length >= 8 && s103!.steps.length <= SD_MAX_STEPS, 'S1-03 có 8–12 step');
assert(s103!.steps[0].category === 'SETUP', 'step đầu là SETUP');
assert(s103!.steps[s103!.steps.length - 1].category === 'RECAP', 'step cuối là RECAP');
assert(s103!.steps.every((st, i) => st.index === i + 1), 'chỉ số step liên tục');
assert(
  s103!.steps.every((st) => st.stageMode === 'isometric' || st.stageMode === 'live-sim'),
  'S1-03 giữ xuyên suốt sân khấu isometric / live-sim ở cả 11 bước (không giật sang code-trace hay memory-2d)'
);
const liveSteps = s103!.steps.filter((st) => st.stageMode === 'live-sim');
assert(
  liveSteps.length === 2 &&
    liveSteps[0].index === 6 &&
    liveSteps[0].liveSim?.simId === 'S1-03/ramp' &&
    liveSteps[1].index === 9 &&
    liveSteps[1].liveSim?.startAtSec === 30,
  'S1-03 bước 6 (ramp) và bước 9 (trap) là live-sim với LiveSimSpec đầy đủ'
);
assert(
  liveSteps.every((st) => st.scene?.packets.length === 0 && st.scene?.nodes.every((n) => n.loadPct === 0)),
  'scene của step live-sim có packets rỗng và loadPct = 0'
);
assert(
  s103!.attribution?.href === 'https://www.systemdesigncore.site/phase/phase-1/lesson/lesson-3-data-flow-and-bottlenecks' &&
    Boolean(s103!.story?.vi),
  'S1-03 có link nguồn trực tiếp tới trang đích systemdesigncore.site và nội dung tab Câu chuyện & Tư duy'
);
assert(
  s103!.steps.filter((st) => st.stageMode === 'isometric').every((st) => (st.scene?.nodes.length ?? 0) >= 3 && !st.codeTrace),
  'step isometric có scene ≥ 3 node và không kèm codeTrace'
);
assert(s103!.primaryMode === 'isometric', 'S1-03 primaryMode isometric');
assert(s103!.steps[0].callout?.kind === 'key-idea', 'callout được đọc từ khối step');
assert(s103!.steps[0].whatChanged[0]?.op === '+', 'whatChanged op +');
const dbNode = s103!.steps[4].scene?.nodes.find((n) => n.id === 'db');
assert(dbNode?.loadPct === 100 && dbNode.inspector?.what.vi && dbNode.inspector?.tipOrCase, 'node db có state và inspector what/how/why/tip');
assert(
  s103!.steps[4].scene?.links.some((l) => l.id === 'cache-db' && l.inspector?.why.vi),
  'link cache-db có inspector'
);
assert(s103!.steps[2].scene?.links.find((l) => l.id === 'cache-db')?.label?.vi === '300 ms', 'linkState.label ghi đè nhãn đường nối theo scene');

// 2) Bài tổng hợp có scene + model
const lessonMd = [
  '## 1. Hệ thống gồm ba thành phần',
  '```step',
  'category: SETUP',
  'short: Ba thành phần',
  'scene: s1',
  'telemetry:',
  '  - label: Hit Ratio',
  '    value: "{cache.hitRatio@10:0%}"',
  '  - label: Tải',
  '    value: 3 req/s',
  '```',
  'Nội dung một.',
  '',
  '## 2. Giữ cảnh trước',
  '```step',
  'category: RECAP',
  'short: Tóm tắt',
  'scene: "@prev"',
  '```',
  'Nội dung hai.',
].join('\n');
const synthetic: SdModule = {
  ...cur.modules[0],
  id: 'S9-99',
  level: 9,
  order: 1,
  lesson: lessonMd,
  simIds: ['S9-99/a'],
  stage: {
    version: 1,
    nodes: { client: { shape: 'crowd' }, lb: {}, db: { shape: 'db' } },
    scenes: { s1: { show: { nodes: '*' }, packets: 'auto' } },
  },
};
const sims = {
  'S9-99/a': {
    id: 'S9-99/a',
    scenario: {
      model: {
        nodes: [
          { id: 'client', kind: 'client', label: { vi: 'Người dùng' } },
          { id: 'lb', kind: 'lb', label: { vi: 'LB' } },
          { id: 'db', kind: 'db', label: { vi: 'DB' } },
        ],
        links: [
          { id: 'l1', from: 'client', to: 'lb' },
          { id: 'l2', from: 'lb', to: 'db' },
        ],
      },
    },
  },
};
const out = buildSdScaleLessons({ ...cur, modules: [synthetic] }, sims);
const st = out[0].steps;
assert(st.length === 2, 'bài tổng hợp có 2 step');
assert(st[0].stageMode === 'isometric' && st[0].scene?.nodes.length === 3, 'scene dựng 3 node');
assert(st[0].scene?.links.length === 2 && (st[0].scene?.packets.length ?? 0) >= 2, 'link và packet auto');
assert(st[0].telemetry[0].value.vi === '—', 'biến telemetry chưa phân giải hiển thị —');
assert(st[0].telemetry[1].value.vi === '3 req/s', 'telemetry tĩnh giữ nguyên');
assert(st[1].stageMode === 'isometric', '@prev giữ cảnh bước trước');
assert(out[0].primaryMode === 'isometric', 'primaryMode isometric');

// 3) Cắt tối đa 12 step; `##` trong code fence không tách step
const many = Array.from({ length: 15 }, (_, i) => `## ${i + 1}. Bước ${i + 1}\nNội dung.`).join('\n\n');
assert(parseSdLesson(many).length === SD_MAX_STEPS, 'cắt tối đa 12 step');
const fenced = '## 1. A\n```bash\n## not a heading\n```\n\n## 2. B\nx';
assert(parseSdLesson(fenced).length === 2, '`##` trong code fence không tách step');

// 4) Quy tắc chọn sân khấu: kế thừa scene, base, memory-2d, mode: code
const ruleMd = [
  '## 1. Mở đầu không khai báo scene',
  '```step',
  'category: SETUP',
  'short: Mở đầu',
  '```',
  'Thân bước có code nhưng không khai báo mode.',
  '',
  '```python',
  'print("không phải code-trace vì chưa khai báo mode: code")',
  '```',
  '',
  '## 2. Scene riêng',
  '```step',
  'category: MECHANISM',
  'short: Scene A',
  'scene: a',
  '```',
  'Nội dung.',
  '',
  '## 3. Bảng bộ nhớ',
  '```step',
  'category: MECHANISM',
  'short: Memory',
  'scene: mem',
  '```',
  'Nội dung.',
  '',
  '## 4. Không khai báo scene sau memory',
  '```step',
  'category: TECHNIQUE',
  'short: Kế thừa',
  'scene: none',
  '```',
  'Kế thừa scene isometric gần nhất (a), không phải memory.',
  '',
  '## 5. Code thật',
  '```step',
  'category: REAL_CODE',
  'short: Code',
  'mode: code',
  '```',
  'Có code thật.',
  '',
  '```python',
  'def timed(fn):\n    return fn',
  '```',
  '',
  '## 6. Khai báo mode code nhưng không có code',
  '```step',
  'category: RECAP',
  'short: Hết',
  'mode: code',
  '```',
  'Không có code block.',
].join('\n');
const ruleMod: SdModule = {
  ...synthetic,
  id: 'S9-98',
  lesson: ruleMd,
  simIds: ['S9-99/a'],
  stage: {
    version: 1,
    base: 'a',
    nodes: {
      client: { shape: 'crowd' },
      lb: { inspector: { what: 'Là gì', how: { vi: 'Thế nào' }, why: 'Vì sao', tip: 'Mẹo' } },
      db: { shape: 'db' },
    },
    scenes: {
      a: { show: { nodes: '*' } },
      mem: {
        mode: 'memory-2d',
        show: { nodes: [] },
        memory: {
          kind: 'tree',
          title: 'Cây',
          nodes: [
            { id: 'r', x: 0, y: 0, label: 'Gốc', tone: 'neutral' },
            { id: 'c', x: 100, y: 90, label: 'Con', sub: 'ghi chú', tone: 'green' },
          ],
          edges: [{ from: 'r', to: 'c', label: 'x' }],
        },
      },
    },
  },
};
const ruleOut = buildSdScaleLessons({ ...cur, modules: [ruleMod] }, sims)[0];
const rs = ruleOut.steps;
assert(rs[0].stageMode === 'isometric' && rs[0].scene, 'không khai báo scene ở đầu bài ⇒ stage.base (isometric), kể cả khi thân có code block');
assert(!rs[0].codeTrace && rs[0].codeSnippet === undefined, 'bước isometric không kèm codeTrace/codeSnippet');
assert(rs[1].stageMode === 'isometric', 'scene a ⇒ isometric');
assert(rs[2].stageMode === 'memory-2d' && rs[2].memoryScene?.kind === 'tree' && !rs[2].scene, 'scene memory-2d ⇒ MemoryScene thật');
assert(rs[2].memoryScene?.kind === 'tree' && rs[2].memoryScene.nodes[1].sub?.vi === 'ghi chú', 'chuỗi MemoryScene được chuẩn hoá thành BilingualText');
assert(rs[3].stageMode === 'isometric' && rs[3].scene?.nodes.length === 3, 'scene none sau memory ⇒ kế thừa scene isometric gần nhất');
assert(rs[4].stageMode === 'code-trace' && rs[4].codeTrace, 'mode: code + có code block ⇒ code-trace');
assert(rs[5].stageMode !== 'code-trace', 'mode: code nhưng không có code block ⇒ KHÔNG code-trace');
const lbIns = rs[0].scene?.nodes.find((n) => n.id === 'lb')?.inspector;
assert(lbIns?.what.vi === 'Là gì' && lbIns.how.vi === 'Thế nào' && lbIns.tipOrCase?.vi === 'Mẹo' && lbIns.title.vi === 'LB', 'inspector rút gọn (string | {vi}) được mở rộng đủ trường');
assert(ruleOut.primaryMode === 'isometric', 'primaryMode isometric khi có step isometric');

// 5) Module khai báo không có stage (doctor đã kiểm lý do) ⇒ phòng thủ code-trace; module thiếu stage vô tình cũng không crash
const noStage = buildSdScaleLessons({ ...cur, modules: [{ ...synthetic, stage: null, noStage: true }] }, null);
assert(noStage[0].steps[0].stageMode === 'code-trace', 'module không có stage ⇒ code-trace phòng thủ (doctor chặn trừ khi stage: "none")');

console.log('[sdLessonBuilder] OK');
