/**
 * Test builder bài học (T1.1c): fixture S1-03 + một bài tổng hợp có stage.json và sim model.
 */
import curriculumJson from '@/data/courses/sysdesign/curriculum.json';
import type { SdCurriculum, SdModule } from '../../types';
import { buildSdScaleLessons, parseSdLesson, SD_MAX_STEPS } from '../sdLessonBuilder';

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error(`[sdLessonBuilder] FAIL: ${msg}`);
    process.exit(1);
  }
}

const cur = curriculumJson as unknown as SdCurriculum;

// 1) Fixture thật từ sd:build
const lessons = buildSdScaleLessons(cur);
assert(lessons.length === cur.modules.length, 'mỗi module có một lesson');
const s103 = lessons.find((l) => l.moduleId === 'S1-03');
assert(s103, 'có lesson S1-03');
assert(s103!.steps.length >= 4 && s103!.steps.length <= SD_MAX_STEPS, 'số step trong 1..12');
assert(s103!.steps[0].category === 'SETUP', 'step đầu là SETUP');
assert(s103!.steps[s103!.steps.length - 1].category === 'RECAP', 'step cuối là RECAP');
assert(s103!.steps.every((st, i) => st.index === i + 1 && st.stageMode === 'code-trace' && st.codeTrace), 'fixture không scene ⇒ code-trace hợp lệ');
assert(s103!.steps[0].callout?.kind === 'key-idea', 'callout được đọc từ khối step');
assert(s103!.steps[1].whatChanged[0]?.op === '+', 'whatChanged op +');

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
assert(st[0].scene?.links.length === 2 && (st[0].scene?.packets.length ?? 0) === 2, 'link và packet auto');
assert(st[0].telemetry[0].value.vi === '—', 'biến telemetry chưa phân giải hiển thị —');
assert(st[0].telemetry[1].value.vi === '3 req/s', 'telemetry tĩnh giữ nguyên');
assert(st[1].stageMode === 'isometric', '@prev giữ cảnh bước trước');
assert(out[0].primaryMode === 'isometric', 'primaryMode isometric');

// 3) Cắt tối đa 12 step; `##` trong code fence không tách step
const many = Array.from({ length: 15 }, (_, i) => `## ${i + 1}. Bước ${i + 1}\nNội dung.`).join('\n\n');
assert(parseSdLesson(many).length === SD_MAX_STEPS, 'cắt tối đa 12 step');
const fenced = '## 1. A\n```bash\n## not a heading\n```\n\n## 2. B\nx';
assert(parseSdLesson(fenced).length === 2, '`##` trong code fence không tách step');

// 4) Không có stage ⇒ không crash khi scene khai báo
const noStage = buildSdScaleLessons({ ...cur, modules: [{ ...synthetic, stage: null }] }, null);
assert(noStage[0].steps[0].stageMode === 'code-trace', 'thiếu stage ⇒ code-trace');

console.log('[sdLessonBuilder] OK');
