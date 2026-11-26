// Thư viện dùng chung cho build-sysdesign.mjs và sysdesign-doctor.mjs:
// đọc content/sysdesign/ theo định dạng ở docs/sysdesign/07-content-authoring.md.
// Bỏ qua content/sysdesign/_source/ (bản gốc SDC chỉ đọc, không vào bundle).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');
export const CONTENT_DIR = path.join(ROOT, 'content', 'sysdesign');
export const SOURCE_DIR = path.join(CONTENT_DIR, '_source');
export const OUT_DIR = path.join(ROOT, 'src', 'data', 'courses', 'sysdesign');

export function rel(p) {
  return path.relative(ROOT, p);
}

/** Đọc JSON; lỗi parse ném Error có đường dẫn. */
export function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Lỗi JSON tại ${rel(filePath)}: ${err.message}`);
  }
}

function readJsonIfExists(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

/**
 * Nạp toàn bộ module từ content/sysdesign/modules/.
 * Mọi file tuỳ chọn thiếu thì trả giá trị rỗng (stage/sim = null, các mảng = []).
 */
export function loadCourse() {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error('Không tìm thấy thư mục nguồn: content/sysdesign');
  }
  const course = readJson(path.join(CONTENT_DIR, 'course.json'));
  const modulesDir = path.join(CONTENT_DIR, 'modules');
  const folders = fs.existsSync(modulesDir)
    ? fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  const modules = folders.map((folder) => {
    const dir = path.join(modulesDir, folder);
    const lessonPath = path.join(dir, 'lesson.md');
    return {
      folder,
      dir,
      meta: readJson(path.join(dir, 'module.json')),
      lesson: fs.existsSync(lessonPath)
        ? fs.readFileSync(lessonPath, 'utf8').replace(/\r\n/g, '\n').trim()
        : null,
      quiz: readJsonIfExists(path.join(dir, 'quiz.json'), []),
      cards: readJsonIfExists(path.join(dir, 'cards.json'), []),
      stage: readJsonIfExists(path.join(dir, 'stage.json'), null),
      sim: readJsonIfExists(path.join(dir, 'sim.json'), null),
      activities: readJsonIfExists(path.join(dir, 'activities.json'), []),
    };
  });
  return { course, modules };
}

/**
 * Tách lesson.md thành step theo `##` (bỏ qua `##` nằm trong code fence).
 * Mỗi step: { heading, line, stepBlock (object|null), stepBlockError, body }.
 */
export function parseSteps(lessonText) {
  const lines = lessonText.split('\n');
  const steps = [];
  let fence = null; // độ dài fence đang mở
  let cur = null;
  lines.forEach((text, idx) => {
    const fm = /^(`{3,})(.*)$/.exec(text);
    if (fm) {
      if (!fence) fence = fm[1].length;
      else if (fm[1].length >= fence && fm[2].trim() === '') fence = null;
    }
    const hm = !fence && !fm ? /^##\s+(.*)$/.exec(text) : null;
    if (hm) {
      cur = { heading: hm[1].trim(), line: idx + 1, bodyLines: [] };
      steps.push(cur);
    } else if (cur) {
      cur.bodyLines.push(text);
    }
  });

  return steps.map((s) => {
    const body = s.bodyLines.join('\n');
    let stepBlock = null;
    let stepBlockError = null;
    let rest = body;
    const m = /^\s*```step[ \t]*\n([\s\S]*?)\n```[ \t]*(?:\n|$)/.exec(body);
    if (m) {
      try {
        const parsed = YAML.parse(m[1]);
        if (parsed && typeof parsed === 'object') stepBlock = parsed;
        else stepBlockError = 'khối step rỗng hoặc không phải object';
      } catch (err) {
        stepBlockError = `YAML lỗi: ${err.message.split('\n')[0]}`;
      }
      rest = body.slice(m[0].length);
    }
    return { heading: s.heading, line: s.line, stepBlock, stepBlockError, hasStepBlock: !!m, body: rest.trim() };
  });
}
