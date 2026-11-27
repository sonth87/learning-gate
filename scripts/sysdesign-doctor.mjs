#!/usr/bin/env node
// Doctor cho content/sysdesign (T1.4, T4.6). Quy tắc theo docs/sysdesign/07-content-authoring.md §6 & 06-activities-and-grading.md §8.
// E = lỗi (exit 1), W = cảnh báo (--strict thì cũng exit 1), I = thông tin.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { CONTENT_DIR, OUT_DIR, ROOT, SOURCE_DIR, loadCourse, parseSteps, rel } from './lib/sysdesign-content.mjs';

const STRICT = process.argv.includes('--strict');
const errors = [];
const warnings = [];
const infos = [];
const E = (msg) => errors.push(msg);
const W = (msg) => warnings.push(msg);

async function loadDoctorBridge() {
  const entry = path.join(ROOT, 'src/features/sysdesign-course/activities/doctorBridge.ts');
  const cacheDir = path.join(ROOT, 'node_modules/.cache/sd-doctor');
  fs.mkdirSync(cacheDir, { recursive: true });
  const outfile = path.join(cacheDir, 'doctorBridge.mjs');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    alias: { '@': path.join(ROOT, 'src') },
    outfile,
    tsconfig: path.join(ROOT, 'tsconfig.json'),
    logLevel: 'silent',
  });
  return import(pathToFileURL(outfile).href);
}

const STEP_CATEGORIES = ['SETUP', 'PROBLEM', 'TECHNIQUE', 'MECHANISM', 'PITFALL', 'REAL_CODE', 'RECAP'];
const CALLOUT_KINDS = ['key-idea', 'watch-out', 'good-to-know', 'compare', 'technique'];
const ACTIVITY_KINDS = [
  'predict', 'spot-bottleneck', 'tune-to-limit', 'estimate', 'fix-challenge',
  'order', 'timeline-read', 'postmortem', 'design-constraint',
];
const QUIZ_TYPES = ['mc', 'tf', 'output'];
const SDC_REPO = 'steve-bang/systemdesigncore';
// Cùng định nghĩa "code block thật" với extractFirstCodeBlock (courseLessonBuilder): fence có nội dung ≥ 12 ký tự, không phải visual.
const hasRealCodeBlock = (body) => {
  const re = /```(?!visual)(?:[a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  let mt;
  while ((mt = re.exec(body)) !== null) if (mt[1].trim().length >= 12) return true;
  return false;
};
const MEMORY_KINDS = ['tape', 'refs', 'tree'];

// Rule 6: từ cấm (guidelines §5.5)
const FORBIDDEN = [
  'giải phẫu', 'phẫu thuật', 'mổ xẻ', 'bắt bệnh', 'khám bệnh', 'cầm máu', 'cứu mạng', 'đọc vị', 'giải ngố',
  'phép thuật ngầm', 'vũ khí', 'tuyệt chiêu', 'bí kíp', 'bảo bối', 'thần chú', 'sinh tử', 'sống còn',
  'tử huyệt', 'chí mạng', 'thảm họa', 'thảm hoạ', 'cú lừa', 'cẩm nang tác chiến', 'so găng', 'sát thủ',
  'cứu hỏa', 'chữa cháy', 'sập bẫy',
];
// Rule 7
const ANECDOTES = ['tôi còn nhớ', 'tôi từng', 'mình còn nhớ', 'hồi đó tôi', 'câu chuyện của tôi', 'i remember'];
const COLLOQUIAL = [/\bgame changer\b/i, /\bproblem solved\b/i, /\bboom\b/i, /\bmagic\b/i, /siêu dễ/i, /cực kỳ đỉnh/i];

// Rule 17 (như pmp-doctor + webhook/AWS)
const SECRET_PATTERNS = [
  { name: 'Slack webhook', re: /hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Discord webhook', re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/ },
  { name: 'GitHub PAT', re: /\bgh[posru]_[A-Za-z0-9]{30,}\b/ },
  { name: 'GitHub Fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { name: 'AWS Access Key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private Key PEM', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const wordCount = (s) => (s.match(/\S+/g) ?? []).length;

function walk(dir, out = [], skipSource = true) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    if (skipSource && dir === CONTENT_DIR && ent.name === '_source') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out, skipSource);
    else if (/\.(ts|tsx|js|mjs|json|md|mdx)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

function shingles(text, n = 12) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

/** Bảng 02-curriculum.md: id nào có cột SDC dạng `p<n>/l<n>` (bài chuyển thể từ SDC) và id nào có dòng. */
function loadCurriculumTable() {
  const file = path.join(ROOT, 'docs', 'sysdesign', '02-curriculum.md');
  if (!fs.existsSync(file)) return null;
  const rows = new Map();
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^\|\s*(S\d+-\d+)\s*\|(.*)$/.exec(line);
    if (!m) continue;
    const cols = m[2].split('|').map((c) => c.trim());
    rows.set(m[1], { sdc: /^`p\d+\/l\d+`/.test(cols[1] ?? '') });
  }
  return rows;
}

function loadManifest() {
  const file = path.join(SOURCE_DIR, 'sdc', 'manifest.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    E(`${rel(file)}: JSON lỗi (${err.message})`);
    return null;
  }
}

// ───────────────────────── kiểm từng phần ─────────────────────────

function checkSource(m, manifest, tableRow) {
  const id = m.meta.id;
  const src = m.meta.source;
  const sources = src === undefined ? [] : Array.isArray(src) ? src : [src];
  const expectSdc = tableRow?.sdc === true;
  if (sources.length === 0) {
    if (expectSdc) E(`${id}: bài chuyển thể từ SDC (theo 02-curriculum.md) nhưng thiếu \`source\``);
    return [];
  }
  const sdcSources = [];
  for (const s of sources) {
    if (!isObj(s) || !['sdc', 'original'].includes(s.kind)) {
      E(`${id}: source.kind phải là 'sdc' hoặc 'original'`);
      continue;
    }
    if (s.adaptation !== undefined && !['edited', 'rewritten'].includes(s.adaptation)) {
      E(`${id}: source.adaptation phải là 'edited' hoặc 'rewritten'`);
    }
    if (s.kind === 'original') {
      if (!m.meta.dtsRef && !s.changes) W(`${id}: bài 'original' không có dtsRef hay giải thích nguồn khái niệm trong source.changes`);
      continue;
    }
    for (const f of ['path', 'sha', 'url', 'adaptedBy', 'adaptedAt', 'changes']) {
      if (typeof s[f] !== 'string' || !s[f].trim()) E(`${id}: source thiếu trường "${f}"`);
    }
    if (typeof s.sha === 'string' && !/^[0-9a-f]{40}$/.test(s.sha)) E(`${id}: source.sha phải là 40 ký tự hex`);
    if (typeof s.adaptedAt === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(s.adaptedAt)) E(`${id}: source.adaptedAt phải dạng YYYY-MM-DD`);
    if (s.path && s.sha && s.url) {
      const wantUrl = `https://github.com/${SDC_REPO}/blob/${s.sha}/${s.path}`;
      if (s.url !== wantUrl) E(`${id}: source.url không khớp sha/path (mong đợi ${wantUrl})`);
    }
    if (manifest && s.path) {
      const entry = (manifest.files ?? []).find((f) => f.path === s.path);
      if (!entry) E(`${id}: source.path "${s.path}" không có trong _source/sdc/manifest.json`);
      else if (manifest.commit && s.sha && manifest.commit !== s.sha) {
        E(`${id}: source.sha (${s.sha.slice(0, 8)}…) không khớp commit của manifest (${manifest.commit.slice(0, 8)}…)`);
      }
    }
    sdcSources.push(s);
  }
  return sdcSources;
}

function checkLesson(m, ctx) {
  const id = m.meta.id;
  if (m.lesson === null) {
    E(`${id}: thiếu lesson.md`);
    return;
  }
  if (/^```\s*mermaid/im.test(m.lesson)) E(`${id}: lesson.md còn fence mermaid (phải chuyển sang visual/scene)`);
  if (/_source\/|designed-to-scale/i.test(m.lesson)) E(`${id}: lesson.md chứa đường dẫn tới _source/ hoặc domain DTS`);

  const steps = parseSteps(m.lesson);
  ctx.stepCount += steps.length;
  if (steps.length > 12) E(`${id}: lesson.md có ${steps.length} step (> 12)`);
  else if (steps.length < 6) W(`${id}: lesson.md chỉ có ${steps.length} step (< 6)`);

  const scenes = new Set(Object.keys(m.stage?.scenes ?? {}));
  const lives = new Set(Object.keys(m.stage?.live ?? {}));
  const activityIds = new Set((Array.isArray(m.activities) ? m.activities : []).map((a) => a?.id));
  const attached = new Map();

  steps.forEach((st, i) => {
    const where = `${id} step ${i + 1} (dòng ${st.line})`;
    if (!st.hasStepBlock) return E(`${where}: thiếu khối \`\`\`step`);
    if (st.stepBlockError) return E(`${where}: ${st.stepBlockError}`);
    const b = st.stepBlock;
    if (!STEP_CATEGORIES.includes(b.category)) E(`${where}: category "${b.category}" không hợp lệ`);
    if (typeof b.short !== 'string' || !b.short) E(`${where}: thiếu short`);
    else if (b.short.length > 16) W(`${where}: short dài ${b.short.length} ký tự (> 16)`);
    if (i === 0 && b.category !== 'SETUP') E(`${where}: step đầu phải có category SETUP`);
    if (i === steps.length - 1 && b.category !== 'RECAP') E(`${where}: step cuối phải có category RECAP`);
    if (b.callout && !CALLOUT_KINDS.includes(b.callout.kind)) E(`${where}: callout.kind "${b.callout.kind}" không hợp lệ`);
    if (Array.isArray(b.whatChanged)) {
      if (b.whatChanged.length > 4) E(`${where}: whatChanged > 4 dòng`);
      for (const l of b.whatChanged) if (String(l).length > 90) W(`${where}: whatChanged dòng > 90 ký tự`);
    }
    if (Array.isArray(b.telemetry)) {
      if (b.telemetry.length > 3) E(`${where}: telemetry > 3 phần tử`);
      if (b.sim) {
        for (const t of b.telemetry) {
          if (typeof t?.value === 'string' && !/\{[^}]+\}/.test(t.value)) W(`${where}: telemetry tĩnh "${t.value}" trong step có sim`);
        }
      }
    }
    // Quy tắc 20: code-trace chỉ khi step khai báo `mode: code` và thân có code block thật.
    if (b.mode !== undefined && b.mode !== 'code') E(`${where}: mode "${b.mode}" không hợp lệ (chỉ có \`mode: code\`)`);
    if (b.mode === 'code' && !hasRealCodeBlock(st.body)) E(`${where}: \`mode: code\` nhưng thân bước không có code block thật (fence ≥ 12 ký tự)`);
    if (b.mode === 'code' && b.live !== undefined) E(`${where}: \`mode: code\` không dùng chung với live`);
    if (b.live !== undefined && !lives.has(b.live)) E(`${where}: live "${b.live}" không có trong stage.json`);
    if (b.live !== undefined && b.scene === undefined) E(`${where}: step live phải có scene`);
    if (b.scene !== undefined && !['@prev', 'none'].includes(b.scene) && !scenes.has(b.scene)) {
      E(`${where}: scene "${b.scene}" không có trong stage.json`);
    }
    if (b.scene === undefined && b.live === undefined && b.category !== 'RECAP' && b.mode !== 'code') W(`${where}: không có scene/live`);
    if (b.activity !== undefined) {
      if (!activityIds.has(b.activity)) E(`${where}: activity "${b.activity}" không có trong activities.json`);
      attached.set(b.activity, (attached.get(b.activity) ?? 0) + 1);
      if (b.gate !== undefined && !['required', 'optional'].includes(b.gate)) E(`${where}: gate phải là required|optional`);
    }
    // Quy tắc 13: kiểm biến {...} trong telemetry / callout
    const simIdForStep =
      (typeof b.sim === 'string' && b.sim) ||
      (typeof b.live === 'string' && m.stage?.live?.[b.live]?.sim) ||
      [...(ctx.moduleSims.get(id) ?? [])][0];
    const runInfo = simIdForStep ? ctx.simRuns.get(simIdForStep) : null;
    const checkTemplateVars = (rawText, fieldName) => {
      if (typeof rawText !== 'string' || !/\{[^}]+\}/.test(rawText)) return;
      if (!runInfo || !ctx.bridge) {
        E(`${where}: ${fieldName} có biến {...} nhưng step không gắn sim`);
        return;
      }
      const res = ctx.bridge.resolveExplainText(rawText, {}, {
        baseRun: runInfo.run,
        baseModel: runInfo.doc.scenario.model,
        defaultSec: 35,
      });
      if (res.unresolved.length > 0) {
        E(`${where}: ${fieldName} có biến không phân giải được: ${res.unresolved.join(', ')}`);
      }
    };
    if (b.callout) {
      checkTemplateVars(b.callout.vi, 'callout.vi');
      checkTemplateVars(b.callout.en, 'callout.en');
    }
    if (Array.isArray(b.telemetry)) {
      for (const t of b.telemetry) {
        if (typeof t?.value === 'string') checkTemplateVars(t.value, 'telemetry.value');
        else if (isObj(t?.value)) {
          checkTemplateVars(t.value.vi, 'telemetry.value.vi');
          checkTemplateVars(t.value.en, 'telemetry.value.en');
        }
      }
    }
    const words = wordCount(st.body.replace(/```[\s\S]*?```/g, ''));
    if (words > 300) W(`${where}: ${words} từ (> 300)`);
  });

  const reqCount = steps.filter((s) => s.stepBlock?.activity && s.stepBlock?.gate === 'required').length;
  if (reqCount > 2) E(`${id}: có ${reqCount} activity gate: required (> 2)`);
  else if (reqCount > 1) W(`${id}: có ${reqCount} activity gate: required (khuyến nghị ≤ 1)`);

  for (const [aid, n] of attached) if (n > 1) E(`${id}: activity "${aid}" được gắn ${n} lần`);
  for (const a of Array.isArray(m.activities) ? m.activities : []) {
    if (a?.id && !attached.has(a.id) && !a.standalone) E(`${id}: activity "${a.id}" không được gắn vào step nào (và không standalone)`);
  }
}

function checkQuizCards(m, ctx) {
  const id = m.meta.id;
  if (!Array.isArray(m.quiz)) E(`${id}: quiz.json phải là mảng`);
  if (!Array.isArray(m.cards)) E(`${id}: cards.json phải là mảng`);
  const quiz = Array.isArray(m.quiz) ? m.quiz : [];
  const cards = Array.isArray(m.cards) ? m.cards : [];
  ctx.quizCount += quiz.length;
  ctx.cardCount += cards.length;

  quiz.forEach((q, i) => {
    const where = `${id} quiz[${i}] (${q?.id ?? '?'})`;
    if (!isObj(q)) return E(`${where}: không phải object`);
    ctx.claimId(q.id, /^S\d+-\d+\.q\d+$/, 'quiz', where);
    if (!QUIZ_TYPES.includes(q.type)) return E(`${where}: type "${q.type}" không hợp lệ`);
    if (typeof q.q !== 'string' || !q.q.trim()) E(`${where}: thiếu q`);
    if (q.type === 'mc') {
      if (!Array.isArray(q.choices) || q.choices.length < 2) E(`${where}: mc cần ≥ 2 choices`);
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) E(`${where}: answer ngoài phạm vi choices`);
    } else if (q.type === 'tf') {
      if (typeof q.answer !== 'boolean') E(`${where}: tf cần answer boolean`);
    } else if (typeof q.answer !== 'string' || !q.answer.trim()) E(`${where}: output cần answer là chuỗi`);
    if (typeof q.explain !== 'string' || !q.explain.trim()) E(`${where}: thiếu explain`);
    else if (q.explain.length < 40) W(`${where}: explain < 40 ký tự`);
  });
  if (quiz.length < 4) W(`${id}: chỉ có ${quiz.length} quiz (< 4)`);
  else if (new Set(quiz.map((q) => q?.type)).size < 2) W(`${id}: quiz chỉ có 1 loại câu hỏi`);

  cards.forEach((c, i) => {
    const where = `${id} cards[${i}] (${c?.id ?? '?'})`;
    if (!isObj(c)) return E(`${where}: không phải object`);
    ctx.claimId(c.id, /^S\d+-\d+\.c\d+$/, 'card', where);
    if (typeof c.front !== 'string' || !c.front.trim()) E(`${where}: thiếu front`);
    if (typeof c.back !== 'string' || !c.back.trim()) E(`${where}: thiếu back`);
  });
  if (cards.length < 5) W(`${id}: chỉ có ${cards.length} card (< 5)`);
}

function checkActivities(m, ctx) {
  const id = m.meta.id;
  if (!Array.isArray(m.activities)) return E(`${id}: activities.json phải là mảng`);
  ctx.actCount += m.activities.length;
  const br = ctx.bridge;
  const gradeCtx = br
    ? {
        sims: ctx.simsRecord,
        simulate: br.simulate,
        analyze: br,
        evaluate: br.evaluate,
        hintsUsed: 0,
      }
    : null;

  m.activities.forEach((a, i) => {
    const where = `${id} activities[${i}] (${a?.id ?? '?'})`;
    if (!isObj(a)) return E(`${where}: không phải object`);
    ctx.claimId(a.id, /^S\d+-\d+\.A\d+$/, 'activity', where);
    if (typeof a.id === 'string' && !a.id.startsWith(`${id}.`)) {
      E(`${where}: id "${a.id}" phải có tiền tố module "${id}."`);
    }
    if (!ACTIVITY_KINDS.includes(a.kind)) return E(`${where}: kind "${a.kind}" không hợp lệ`);
    if (a.title !== undefined && (!isObj(a.title) || !a.title.vi)) E(`${where}: title.vi không hợp lệ`);
    if (!isObj(a.prompt) || !a.prompt.vi) E(`${where}: thiếu prompt.vi`);
    if (![1, 2, 3].includes(a.difficulty)) E(`${where}: difficulty phải là 1|2|3`);
    if (!isObj(a.explain) || !a.explain.vi) E(`${where}: thiếu explain.vi`);
    if (Array.isArray(a.hints) && a.hints.length > 3) E(`${where}: hints.length (${a.hints.length}) > 3`);

    for (const ref of [a.sim, a.replay, a.incident]) {
      if (ref?.simId && !ctx.simIds.has(ref.simId)) E(`${where}: simId "${ref.simId}" không tồn tại`);
    }
    if (a.simId && !ctx.simIds.has(a.simId)) E(`${where}: simId "${a.simId}" không tồn tại`);

    const primarySimId =
      a.simId ?? a.sim?.simId ?? a.replay?.simId ?? a.incident?.simId ?? [...(ctx.moduleSims.get(id) ?? [])][0];
    const simInfo = primarySimId ? ctx.simModels.get(primarySimId) : null;
    const simDoc = primarySimId ? ctx.simsRecord[primarySimId] : null;
    const durationSec = simDoc?.scenario?.durationSec ?? Infinity;

    const checkNodeRef = (nid, field) => {
      if (simInfo && !simInfo.nodeIds.has(nid)) E(`${where}: ${field} trỏ tới node "${nid}" không có trong sim "${primarySimId}"`);
    };
    const checkLinkRef = (lid, field) => {
      if (simInfo && !simInfo.linkIds.has(lid)) E(`${where}: ${field} trỏ tới link "${lid}" không có trong sim "${primarySimId}"`);
    };
    const checkConstraint = (c, field) => {
      if (!isObj(c)) return;
      if (c.window) {
        if (c.window.fromSec < 0 || c.window.toSec > durationSec || c.window.fromSec > c.window.toSec) {
          E(`${where}: ${field} (${c.id}) có window [${c.window.fromSec}, ${c.window.toSec}] nằm ngoài [0, ${durationSec}]`);
        }
      }
      if (c.node) checkNodeRef(c.node, `${field}.node`);
      if (c.link) checkLinkRef(c.link, `${field}.link`);
    };
    const checkAllowed = (allowedList) => {
      for (const al of allowedList ?? []) {
        if (al?.type === 'knob') {
          checkNodeRef(al.node, 'allowed.node');
          const nodeSpec = simDoc?.scenario?.model?.nodes?.find((n) => n.id === al.node);
          const knobSpec = nodeSpec?.knobs?.find((k) => k.key === al.key);
          if (nodeSpec && !knobSpec && !(al.key in (nodeSpec.params ?? {}))) {
            E(`${where}: allowed knob "${al.node}.${al.key}" không tồn tại trong node`);
          }
        } else if (al?.type === 'link') {
          checkLinkRef(al.link, 'allowed.link');
        }
      }
    };

    for (const ref of [a.sim, a.replay, a.incident]) {
      for (const nid of ref?.focus?.nodes ?? []) checkNodeRef(nid, 'focus.nodes');
      for (const lid of ref?.focus?.links ?? []) checkLinkRef(lid, 'focus.links');
    }

    // Kiểm cấu trúc theo từng kind (06 §8.1)
    if (a.kind === 'predict') {
      if (a.question?.type === 'node') {
        for (const nid of a.question.expected ?? []) checkNodeRef(nid, 'question.expected');
        for (const nid of a.question.partial ?? []) checkNodeRef(nid, 'question.partial');
      }
    } else if (a.kind === 'spot-bottleneck') {
      for (const nid of a.expected ?? []) checkNodeRef(nid, 'expected');
    } else if (a.kind === 'tune-to-limit') {
      for (const c of a.constraints ?? []) checkConstraint(c, 'constraints');
      checkAllowed(a.allowed);
    } else if (a.kind === 'fix-challenge') {
      checkAllowed(a.allowed);
      for (const c of a.goal ?? []) checkConstraint(c, 'goal');
      for (const c of a.soft ?? []) checkConstraint(c, 'soft');
      if (a.par && a.budget && a.par.changes > a.budget.maxChanges) {
        E(`${where}: par.changes (${a.par.changes}) > budget.maxChanges (${a.budget.maxChanges})`);
      }
      if (a.par && a.budget?.maxCostPerHour !== undefined && a.par.costPerHour > a.budget.maxCostPerHour) {
        E(`${where}: par.costPerHour (${a.par.costPerHour}) > budget.maxCostPerHour (${a.budget.maxCostPerHour})`);
      }
    } else if (a.kind === 'order') {
      if (!Array.isArray(a.items) || a.items.length < 2) E(`${where}: order cần ≥ 2 items`);
      else {
        const ids = new Set();
        for (const it of a.items) {
          if (!it?.id || !it?.text?.vi) E(`${where}: item thiếu id hoặc text.vi`);
          else if (ids.has(it.id)) E(`${where}: trùng item id "${it.id}"`);
          else ids.add(it.id);
        }
        if (br) {
          const rawShuffled = br.rawShuffleOrderItems(a.items, a.shuffleSeed ?? 1);
          if (rawShuffled.every((it, idx) => it.id === a.items[idx].id)) {
            E(`${where}: shuffleSeed=${a.shuffleSeed} tạo hoán vị trùng thứ tự đúng`);
          }
        }
      }
    } else if (a.kind === 'timeline-read') {
      const histIds = new Set();
      for (const op of a.history ?? []) {
        if (!op?.id) E(`${where}: history op thiếu id`);
        else histIds.add(op.id);
        if (!(op.start <= op.end)) E(`${where}: history op "${op?.id}" có start (${op?.start}) > end (${op?.end})`);
      }
      for (const eid of a.expected ?? []) {
        if (!histIds.has(eid)) E(`${where}: expected "${eid}" không có trong history`);
      }
    } else if (a.kind === 'postmortem') {
      let wSum = 0;
      for (const q of a.questions ?? []) {
        wSum += Number(q?.weight ?? 0);
        const optIds = new Set((q?.options ?? []).map((o) => o.id));
        if (!Array.isArray(q?.correct) || q.correct.length === 0) {
          E(`${where}: câu hỏi "${q?.id}" không có đáp án đúng`);
        } else {
          for (const cid of q.correct) {
            if (!optIds.has(cid)) E(`${where}: câu hỏi "${q?.id}" có correct "${cid}" không thuộc options`);
          }
        }
      }
      if (wSum !== 100) E(`${where}: tổng weight của postmortem = ${wSum} (phải bằng 100)`);
    } else if (a.kind === 'design-constraint') {
      for (const sc of a.scenarios ?? []) {
        for (const c of sc.constraints ?? []) checkConstraint(c, `scenarios[${sc.id}].constraints`);
      }
      for (const c of a.structural ?? []) checkConstraint(c, 'structural');
    }

    // 06 §8.2 & §8.3: chạy engine kiểm tra activity
    if (!br || !gradeCtx) return;
    const t0 = performance.now();
    const passScore = a.passScore ?? (a.kind === 'spot-bottleneck' && a.maxPicks === 1 ? 99 : a.kind === 'order' ? (a.items.length <= 4 ? 100 : 80) : a.kind === 'timeline-read' ? 80 : 70);

    // 1. Starter / không làm gì ⇒ phải không đạt
    const emptyAns = br.emptyAnswerForActivity(a);
    const r0 = br.gradeActivity(a, emptyAns, gradeCtx);
    if (r0.passed || r0.score >= passScore) {
      E(`${where}: đáp án rỗng/khởi điểm phải không đạt nhưng đạt score=${r0.score}, passed=${r0.passed}`);
    }

    // 2. Solution ⇒ phải đạt đủ 3 sao
    const solAns = br.solutionAnswerForActivity(a, gradeCtx);
    const r1 = br.gradeActivity(a, solAns, gradeCtx);
    if (!r1.passed || r1.stars !== 3) {
      E(`${where}: đáp án chuẩn (solution) phải đạt 3 sao nhưng được passed=${r1.passed}, score=${r1.score}, stars=${r1.stars}`);
    }

    // 3. Biến nội suy trong explain phải phân giải hết
    if (r1.resolvedExplain?.vi && /\{[^}]+\}/.test(r1.resolvedExplain.vi)) {
      E(`${where}: explain.vi còn biến chưa phân giải sau khi chấm: "${r1.resolvedExplain.vi}"`);
    }
    if (r1.resolvedExplain?.en && /\{[^}]+\}/.test(r1.resolvedExplain.en)) {
      E(`${where}: explain.en còn biến chưa phân giải sau khi chấm: "${r1.resolvedExplain.en}"`);
    }

    // 4. Đối chiếu expected với kết quả tính từ engine
    if (a.kind === 'predict' && a.question?.type === 'node' && simDoc) {
      const runInfo = ctx.simRuns.get(primarySimId);
      if (runInfo) {
        const comp = br.computePredictExpectedNodes(runInfo.run, a.question.rule);
        const want = [...(a.question.expected ?? [])].sort().join(',');
        const got = comp.winners.join(',');
        if (want !== got) {
          E(`${where}: predict.expected [${want}] lệch với engine [${got}]`);
        }
      }
    } else if (a.kind === 'spot-bottleneck' && simDoc) {
      const comp = br.computeSpotExpectedNodes(a, simDoc.scenario);
      const want = [...(a.expected ?? [])].sort().join(',');
      const got = [...comp].sort().join(',');
      if (want !== got) {
        E(`${where}: spot-bottleneck.expected [${want}] lệch với engine [${got}]`);
      }
    } else if (a.kind === 'tune-to-limit' && a.objective === 'max-load' && a.reference && simDoc) {
      const bisected = br.bisectMaxSustainableLoad(simDoc.scenario, a.runSec, a.constraints);
      const relErr = Math.abs(bisected - a.reference.value) / Math.max(1, a.reference.value);
      if (relErr > 0.03) {
        E(`${where}: tune-to-limit reference.value=${a.reference.value} lệch > 3% so với bisection=${bisected} (${(relErr * 100).toFixed(1)}%)`);
      }
    } else if (a.kind === 'timeline-read') {
      const comp = br.computeTimelineViolations(a.history ?? [], a.question);
      const want = [...(a.expected ?? [])].sort().join(',');
      const got = [...comp].sort().join(',');
      if (want !== got) {
        E(`${where}: timeline-read.expected [${want}] lệch với checker [${got}]`);
      }
    }

    // 5. Mọi trap phải không đạt và khớp matchedTrap
    for (const trap of a.traps ?? []) {
      if (!trap?.why?.vi) E(`${where}: trap "${trap?.id}" thiếu why.vi`);
      const rt = br.gradeActivity(a, { changes: trap.changes ?? [] }, gradeCtx);
      if (rt.passed) {
        E(`${where}: trap "${trap.id}" phải không đạt nhưng lại passed=true (score=${rt.score})`);
      }
      if (a.kind === 'fix-challenge' && rt.matchedTrap?.id !== trap.id) {
        E(`${where}: trap "${trap.id}" không khớp matchedTrap khi chấm`);
      }
    }

    // 6. Determinism: chấm 2 lần cho JSON giống hệt
    const r1Again = br.gradeActivity(a, solAns, gradeCtx);
    if (JSON.stringify(r1) !== JSON.stringify(r1Again)) {
      E(`${where}: gradeActivity không tất định (chạy 2 lần ra kết quả khác nhau)`);
    }

    const elapsedMs = performance.now() - t0;
    if (elapsedMs > 2000) E(`${where}: thời gian chấm quá chậm (${elapsedMs.toFixed(0)} ms > 2000 ms)`);
    else if (elapsedMs > 1000) W(`${where}: thời gian chấm ${elapsedMs.toFixed(0)} ms (> 1000 ms)`);
  });
}

function checkSim(m, ctx) {
  const id = m.meta.id;
  if (m.sim === null) return;
  if (!isObj(m.sim) || !Array.isArray(m.sim.sims)) return E(`${id}: sim.json phải có dạng { "sims": [...] }`);
  const modSimIds = new Set();
  for (const sim of m.sim.sims) {
    const where = `${id} sim "${sim?.id ?? '?'}"`;
    if (!isObj(sim) || typeof sim.id !== 'string') {
      E(`${where}: thiếu id`);
      continue;
    }
    if (!sim.id.startsWith(`${id}/`) || !/^S\d+-\d+\/[A-Za-z0-9_-]+$/.test(sim.id)) E(`${where}: id phải dạng <moduleId>/<tên>`);
    if (ctx.simClaimed.has(sim.id)) E(`${where}: trùng id sim`);
    ctx.simClaimed.add(sim.id);
    modSimIds.add(sim.id);
    ctx.simCount++;
    const sc = sim.scenario;
    if (!isObj(sc) || !isObj(sc.model)) {
      E(`${where}: thiếu scenario.model`);
      continue;
    }
    if (!(Number.isFinite(sc.durationSec) && sc.durationSec > 0)) E(`${where}: scenario.durationSec phải là số > 0`);
    if (!isObj(sc.load)) E(`${where}: thiếu scenario.load`);
    const nodes = Array.isArray(sc.model.nodes) ? sc.model.nodes : [];
    const links = Array.isArray(sc.model.links) ? sc.model.links : [];
    if (nodes.length === 0) E(`${where}: model không có node`);
    const nodeIds = new Set();
    for (const n of nodes) {
      if (!n?.id) E(`${where}: node thiếu id`);
      else if (nodeIds.has(n.id)) E(`${where}: trùng node id "${n.id}"`);
      else nodeIds.add(n.id);
    }
    const linkIds = new Set();
    for (const l of links) {
      if (!l?.id) E(`${where}: link thiếu id`);
      else if (linkIds.has(l.id)) E(`${where}: trùng link id "${l.id}"`);
      else linkIds.add(l.id);
      if (!nodeIds.has(l?.from) || !nodeIds.has(l?.to)) E(`${where}: link "${l?.id}" trỏ tới node không tồn tại`);
    }
    // DAG (rule 11, phần tĩnh)
    const adj = new Map([...nodeIds].map((n) => [n, []]));
    for (const l of links) if (adj.has(l?.from) && l.mode !== 'replicate') adj.get(l.from).push(l.to);
    const color = new Map();
    const cyclic = (n) => {
      if (color.get(n) === 1) return true;
      if (color.get(n) === 2) return false;
      color.set(n, 1);
      for (const nx of adj.get(n) ?? []) if (cyclic(nx)) return true;
      color.set(n, 2);
      return false;
    };
    if ([...nodeIds].some((n) => cyclic(n))) E(`${where}: model có chu trình (phải là DAG)`);
    const knobSet = new Set();
    for (const n of nodes) {
      for (const k of n.knobs ?? []) {
        knobSet.add(`${n.id}:${k.key}`);
        const defVal = n.params?.[k.key] ?? k.default;
        if (k.type === 'number' && typeof defVal === 'number') {
          if ((k.min !== undefined && defVal < k.min) || (k.max !== undefined && defVal > k.max)) {
            E(`${where}: knob "${n.id}.${k.key}" có giá trị mặc định ${defVal} ngoài [${k.min}, ${k.max}]`);
          }
        }
      }
    }
    ctx.simModels.set(sim.id, { nodeIds, linkIds, knobSet });
    ctx.simsRecord[sim.id] = sim;

    // Quy tắc 11 (T4.6): chạy engine kiểm tra không NaN/∞, kiểm `expect` và `presets`
    if (ctx.bridge) {
      const br = ctx.bridge;
      try {
        br.compile(sc);
        const run = br.simulate(sc, []);
        ctx.simRuns.set(sim.id, { doc: sim, run });

        const checkArr = (arr, name) => {
          for (let i = 0; i < run.ticks; i++) {
            if (!Number.isFinite(arr[i])) {
              E(`${where}: ${name} có NaN/Infinity tại tick ${i}`);
              return;
            }
          }
        };
        checkArr(run.offered, 'offered');
        checkArr(run.goodput, 'goodput');
        checkArr(run.errorRate, 'errorRate');
        checkArr(run.p99, 'p99');
        for (const [nid, ns] of Object.entries(run.nodes)) {
          checkArr(ns.rho, `node.${nid}.rho`);
          checkArr(ns.queue, `node.${nid}.queue`);
        }

        const exp = sim.expect;
        if (isObj(exp)) {
          if (exp.bottleneck) {
            const f38 = br.getScenarioFrameAt(sc, Math.min(38, sc.durationSec * 0.5));
            const bn = br.findBottleneck(sc.model, f38);
            if (bn.nodeId !== exp.bottleneck) {
              E(`${where}: expect.bottleneck="${exp.bottleneck}" nhưng engine tìm ra "${bn.nodeId}"`);
            }
            const bns = run.nodes[exp.bottleneck];
            const firstTickAt = (code) => {
              if (!bns) return -1;
              for (let k = 0; k < run.ticks; k++) if (bns.state[k] >= code) return run.t[k];
              return -1;
            };
            if (Array.isArray(exp.firstSaturatedAtSec)) {
              const tSat = firstTickAt(br.NODE_STATE_CODE.saturated);
              if (tSat < exp.firstSaturatedAtSec[0] || tSat > exp.firstSaturatedAtSec[1]) {
                E(`${where}: firstSaturatedAtSec=${tSat.toFixed(1)}s ngoài [${exp.firstSaturatedAtSec.join(', ')}]`);
              }
            }
            if (Array.isArray(exp.firstOverloadedAtSec)) {
              const tOver = firstTickAt(br.NODE_STATE_CODE.overloaded);
              if (tOver < exp.firstOverloadedAtSec[0] || tOver > exp.firstOverloadedAtSec[1]) {
                E(`${where}: firstOverloadedAtSec=${tOver.toFixed(1)}s ngoài [${exp.firstOverloadedAtSec.join(', ')}]`);
              }
            }
          }
          if (Array.isArray(exp.appFirstSaturatedAtSec)) {
            const appNodes = nodes.filter((n) => n.kind === 'service').map((n) => n.id);
            let tAppSat = Infinity;
            for (const aid of appNodes) {
              const ans = run.nodes[aid];
              if (!ans) continue;
              for (let k = 0; k < run.ticks; k++) {
                if (ans.state[k] >= br.NODE_STATE_CODE.saturated) {
                  if (run.t[k] < tAppSat) tAppSat = run.t[k];
                  break;
                }
              }
            }
            if (tAppSat < exp.appFirstSaturatedAtSec[0] || tAppSat > exp.appFirstSaturatedAtSec[1]) {
              E(`${where}: appFirstSaturatedAtSec=${tAppSat.toFixed(1)}s ngoài [${exp.appFirstSaturatedAtSec.join(', ')}]`);
            }
          }
          if (Array.isArray(exp.maxSustainableRpsApprox)) {
            const f20 = br.getScenarioFrameAt(sc, Math.min(20, sc.durationSec * 0.25));
            const ms = br.maxSustainableRps(sc.model, f20);
            if (ms.rps < exp.maxSustainableRpsApprox[0] || ms.rps > exp.maxSustainableRpsApprox[1]) {
              E(`${where}: maxSustainableRps=${ms.rps} ngoài [${exp.maxSustainableRpsApprox.join(', ')}]`);
            }
          }
        }

        if (Array.isArray(sim.presets) && Array.isArray(sim.slos) && sim.slos.length > 0) {
          for (const pr of sim.presets) {
            const inputRecs = (pr.changes ?? []).map((c) => ({
              tick: 0,
              change: c.type === 'knob' ? { type: 'knob', node: c.node, key: c.key, value: c.value } : { type: 'link', link: c.link, patch: c.patch },
            }));
            const { results } = br.runAndEvaluate(sc, sim.slos, inputRecs);
            const passed = results.every((r) => r.pass);
            if (typeof pr.expectPass === 'boolean' && passed !== pr.expectPass) {
              E(`${where}: preset "${pr.id}" có expectPass=${pr.expectPass} nhưng chạy ra passed=${passed}`);
            }
          }
        }
      } catch (err) {
        E(`${where}: lỗi chạy engine (${err.message})`);
      }
    }
  }
  ctx.moduleSims.set(id, modSimIds);
}

function checkStage(m, ctx) {
  const id = m.meta.id;
  const st = m.stage;
  // Quy tắc 21: module phải có stage.json, trừ khi module.json khai báo "stage": "none" kèm "stageReason".
  if (st === null) {
    if (m.meta.stage === 'none') {
      if (typeof m.meta.stageReason !== 'string' || !m.meta.stageReason.trim()) E(`${id}: "stage": "none" cần "stageReason" (lý do bài không có sân khấu)`);
    } else {
      E(`${id}: thiếu stage.json (bài không có sân khấu phải khai báo "stage": "none" + "stageReason" trong module.json; không còn rơi về code-trace)`);
    }
    return;
  }
  if (m.meta.stage === 'none') E(`${id}: module.json khai báo "stage": "none" nhưng vẫn có stage.json`);
  if (!isObj(st) || st.version !== 1) return E(`${id}: stage.json phải có version: 1`);
  if (!isObj(st.scenes)) return E(`${id}: stage.json thiếu scenes`);
  if (/_source\/|designed-to-scale/i.test(JSON.stringify(st))) E(`${id}: stage.json chứa đường dẫn tới _source/ hoặc domain DTS`);

  // Tập node/link của mọi sim trong module (hợp), nếu có sim; cho phép stage.nodes / stage.links khai báo thêm
  // thành phần phụ trợ (auxiliary nodes/links) cho các cảnh giảng bài tĩnh (non-live).
  const sims = [...(ctx.moduleSims.get(id) ?? [])].map((sid) => ctx.simModels.get(sid)).filter(Boolean);
  const simNodeSet = new Set(sims.flatMap((s) => [...s.nodeIds]));
  const simLinkSet = new Set(sims.flatMap((s) => [...s.linkIds]));
  const nodeSet = new Set([...simNodeSet, ...Object.keys(st.nodes ?? {})]);
  const linkSet = new Set([...simLinkSet, ...Object.keys(st.links ?? {})]);
  const hasModel = sims.length > 0;
  const liveScenes = new Set();
  if (Object.keys(st.scenes).length === 0) E(`${id}: stage.json không có scene nào`);
  if (st.base !== undefined && !st.scenes[st.base]) E(`${id}: stage.base "${st.base}" không có trong scenes`);
  if (st.base === undefined && Object.keys(st.scenes).length > 0 && st.scenes[Object.keys(st.scenes)[0]]?.mode === 'memory-2d') {
    W(`${id}: scene đầu tiên là memory-2d và không có stage.base: bước không khai báo scene sẽ lấy scene này làm mặc định`);
  }
  for (const [lvKey, lv] of Object.entries(st.live ?? {})) {
    if (lv?.autoplay === false) {
      E(`${id} live "${lvKey}": không được đặt autoplay: false (sẽ làm đứng luồng chạy khi mở bước)`);
    }
    if (lv?.sim && !ctx.simClaimed.has(lv.sim)) E(`${id}: live.sim "${lv.sim}" không có trong sim.json`);
    const simModel = lv?.sim ? ctx.simModels.get(lv.sim) : null;
    if (simModel) {
      for (const kb of lv?.controls?.knobs ?? []) {
        if (!simModel.knobSet?.has(`${kb?.node}:${kb?.key}`)) {
          E(`${id} live "${lvKey}": controls.knobs "${kb?.node}.${kb?.key}" không có trong knob của sim "${lv.sim}"`);
        }
      }
      for (const nid of lv?.focus?.nodes ?? []) {
        if (!simModel.nodeIds.has(nid)) E(`${id} live "${lvKey}": focus.nodes "${nid}" không có trong sim`);
      }
      for (const lid of lv?.focus?.links ?? []) {
        if (!simModel.linkIds.has(lid)) E(`${id} live "${lvKey}": focus.links "${lid}" không có trong sim`);
      }
    }
  }
  for (const [key, sc] of Object.entries(st.scenes)) {
    const where = `${id} scene "${key}"`;
    if (isObj(sc) && sc.mode === 'memory-2d') {
      const mm = sc.memory;
      const okShape =
        isObj(mm) &&
        MEMORY_KINDS.includes(mm.kind) &&
        (mm.kind === 'tape' ? Array.isArray(mm.cells) : mm.kind === 'refs' ? Array.isArray(mm.names) && Array.isArray(mm.objects) : Array.isArray(mm.nodes) && Array.isArray(mm.edges));
      if (!okShape) {
        E(`${where}: mode memory-2d cần "memory" đúng dạng tape|refs|tree (xem scale-workbench/types.ts)`);
        continue;
      }
      if (mm.kind === 'tape') {
        if (mm.cells.length === 0) E(`${where}: tape.cells không được rỗng`);
        mm.cells.forEach((cell, idx) => {
          if (typeof cell !== 'string' || !cell.trim() || cell.includes('[object Object]')) {
            E(`${where}: tape.cells[${idx}] phải là chuỗi hợp lệ`);
          }
        });
      } else if (mm.kind === 'refs') {
        if (!mm.leftTitle || !mm.rightTitle) E(`${where}: refs thiếu leftTitle hoặc rightTitle`);
        const objIds = new Set();
        mm.objects.forEach((o, idx) => {
          if (!o?.id) E(`${where}: refs.objects[${idx}] thiếu id`);
          else objIds.add(o.id);
          if (typeof o?.typeTag !== 'string' || !o.typeTag.trim()) {
            E(`${where}: refs.objects[${idx}] (${o?.id ?? '?'}) thiếu typeTag`);
          }
        });
        mm.names.forEach((n, idx) => {
          if (!n?.id || !(n?.name || n?.label)) E(`${where}: refs.names[${idx}] thiếu id hoặc name`);
          if (!n?.targetId || !objIds.has(n.targetId)) {
            E(`${where}: refs.names[${idx}] (${n?.id ?? '?'}) có targetId "${n?.targetId ?? ''}" không khớp objects`);
          }
        });
      } else if (mm.kind === 'tree') {
        const treeIds = new Set();
        mm.nodes.forEach((n, idx) => {
          if (!n?.id || !n?.label) E(`${where}: tree.nodes[${idx}] thiếu id hoặc label`);
          else treeIds.add(n.id);
          if (!Number.isFinite(n?.x) || !Number.isFinite(n?.y)) {
            E(`${where}: tree.nodes[${idx}] (${n?.id ?? '?'}) thiếu toạ độ số x, y`);
          }
        });
        for (let i = 0; i < mm.nodes.length; i++) {
          for (let j = i + 1; j < mm.nodes.length; j++) {
            const a = mm.nodes[i];
            const b = mm.nodes[j];
            if (Number.isFinite(a?.x) && Number.isFinite(a?.y) && Number.isFinite(b?.x) && Number.isFinite(b?.y)) {
              if (Math.abs(a.x - b.x) < 40 && Math.abs(a.y - b.y) < 35) {
                E(`${where}: tree.nodes "${a.id}" và "${b.id}" bị đè toạ độ (${a.x},${a.y}) vs (${b.x},${b.y})`);
              }
            }
          }
        }
        mm.edges.forEach((e, idx) => {
          if (!treeIds.has(e?.from) || !treeIds.has(e?.to)) {
            E(`${where}: tree.edges[${idx}] (${e?.from}->${e?.to}) trỏ tới node không tồn tại`);
          }
        });
      }
      continue;
    }
    if (!isObj(sc) || !isObj(sc.show)) {
      E(`${where}: thiếu show`);
      continue;
    }
    if (sc.mode !== undefined && !['isometric', 'memory-2d'].includes(sc.mode)) {
      E(`${where}: mode "${sc.mode}" không hợp lệ trong stage.json (code-trace khai báo bằng \`mode: code\` ở khối step)`);
    }
    if (hasModel) {
      const shown = sc.show.nodes === '*' ? [...nodeSet] : sc.show.nodes ?? [];
      if (shown.length === 0) W(`${where}: scene không phủ node nào của model`);
      for (const n of shown) if (!nodeSet.has(n)) E(`${where}: node "${n}" không có trong sim`);
      const sl = sc.show.links === '*' ? [] : sc.show.links ?? [];
      for (const l of sl) if (!linkSet.has(l)) E(`${where}: link "${l}" không có trong sim`);
      for (const n of Object.keys(sc.state ?? {})) if (!nodeSet.has(n)) E(`${where}: state trỏ tới node "${n}" không có trong sim`);
    } else {
      const stageNodes = new Set(Object.keys(st.nodes ?? {}));
      const shown = sc.show.nodes === '*' ? [...stageNodes] : sc.show.nodes ?? [];
      for (const n of shown) if (!stageNodes.has(n)) E(`${where}: node "${n}" không có trong stage.nodes`);
      const stageLinkKeys = [
        ...Object.keys(st.links ?? {}),
        ...(Array.isArray(sc.show.links) ? sc.show.links : []),
        ...Object.keys(sc.linkState ?? {}),
        ...(Array.isArray(sc.raw?.links) ? sc.raw.links : []),
      ];
      if (shown.length >= 2 && stageLinkKeys.length === 0) {
        E(`${where}: module không có sim.json nhưng scene có ≥ 2 node mà không khai báo stage.links / show.links`);
      }
    }
  }
  if (hasModel) {
    for (const n of Object.keys(st.nodes ?? {})) if (!nodeSet.has(n)) E(`${id}: stage.nodes "${n}" không có trong sim`);
    for (const l of Object.keys(st.links ?? {})) if (!linkSet.has(l)) E(`${id}: stage.links "${l}" không có trong sim`);
  }
  // Scene dùng với `live` (qua khối step) không có state động
  if (m.lesson) {
    for (const s of parseSteps(m.lesson)) {
      const sk = s.stepBlock?.scene;
      if (s.stepBlock?.live && sk) liveScenes.add(sk);
    }
    for (const sk of liveScenes) {
      const sc = st.scenes[sk];
      for (const v of Object.values(sc?.state ?? {})) {
        if (v && ('loadPct' in v || 'dead' in v || 'badge' in v)) E(`${id} scene "${sk}": scene dùng cho live không được có state.loadPct/dead/badge`);
      }
    }
  }
  // TODO(T4.6/M3): quy tắc 12 đầy đủ (scene phủ node, knob live ⊆ knob sim) khi engine/stage đã có.
}

function checkStyle(m) {
  const id = m.meta.id;
  const files = ['lesson.md', 'module.json', 'stage.json', 'activities.json', 'quiz.json', 'cards.json'];
  for (const f of files) {
    const p = path.join(m.dir, f);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    const lower = text.toLowerCase();
    for (const w of FORBIDDEN) if (lower.includes(w)) E(`${id}/${f}: từ cấm "${w}" (guidelines §5.5)`);
    for (const w of ANECDOTES) if (lower.includes(w)) E(`${id}/${f}: giai thoại cá nhân "${w}"`);
    for (const re of COLLOQUIAL) if (re.test(text)) W(`${id}/${f}: khẩu ngữ ${re}`);
    if (f === 'lesson.md') {
      for (const s of parseSteps(text)) if (/["“”]/.test(s.heading)) W(`${id}/${f}: tiêu đề "${s.heading}" có ngoặc kép (ẩn dụ?)`);
    }
  }
  if (/["“”].*["“”]/.test(m.meta.title ?? '')) W(`${id}: title có ngoặc kép (ẩn dụ?)`);
}

function checkOverlap(m, sdcSources) {
  const id = m.meta.id;
  if (!m.lesson || sdcSources.length === 0) return;
  const lessonSh = shingles(m.lesson.replace(/```step[\s\S]*?```/g, ''));
  if (lessonSh.size === 0) return;
  const sourceSh = new Set();
  let found = false;
  for (const s of sdcSources) {
    if (!s.path) continue;
    const p = path.join(SOURCE_DIR, 'sdc', s.path.replace(/^content\/phases\//, ''));
    if (!fs.existsSync(p)) continue;
    found = true;
    for (const sh of shingles(fs.readFileSync(p, 'utf8'))) sourceSh.add(sh);
  }
  if (!found) return;
  let hit = 0;
  for (const sh of lessonSh) if (sourceSh.has(sh)) hit++;
  const ratio = hit / lessonSh.size;
  const pct = (ratio * 100).toFixed(0);
  if (ratio >= 0.7) E(`${id}: lesson.md trùng nguyên văn ${pct}% với bản gốc SDC (≥ 70%: chưa biên tập)`);
  else if (ratio >= 0.4) W(`${id}: lesson.md trùng nguyên văn ${pct}% với bản gốc SDC (≥ 40%)`);
}

function checkSourceIntegrity() {
  // T1.5: cảnh báo nếu file trong _source/ khác manifest
  const dir = path.join(SOURCE_DIR, 'sdc');
  const mf = path.join(dir, 'manifest.json');
  if (!fs.existsSync(mf)) {
    if (fs.existsSync(SOURCE_DIR)) W('_source/sdc/manifest.json không tồn tại (chạy `node scripts/import-sdc.mjs`)');
    return;
  }
  const manifest = loadManifest();
  if (!manifest) return;
  const listed = new Set();
  for (const f of manifest.files ?? []) {
    const local = path.join(dir, f.path.replace(/^content\/phases\//, ''));
    listed.add(path.resolve(local));
    if (!fs.existsSync(local)) {
      W(`_source: thiếu file ${f.path} (có trong manifest)`);
      continue;
    }
    const buf = fs.readFileSync(local);
    if (f.sha256 && crypto.createHash('sha256').update(buf).digest('hex') !== f.sha256) {
      W(`_source: ${f.path} khác manifest (sha256 không khớp: file bị sửa tay?)`);
    } else if (typeof f.bytes === 'number' && f.bytes !== buf.length) {
      W(`_source: ${f.path} khác manifest (bytes ${buf.length} ≠ ${f.bytes})`);
    }
  }
  const walkAll = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(d, e.name);
      return e.isDirectory() ? walkAll(p) : [p];
    });
  for (const p of walkAll(dir)) {
    if (path.basename(p) === 'manifest.json') continue;
    if (!listed.has(path.resolve(p))) W(`_source: file ${rel(p)} không có trong manifest`);
  }
}

// ───────────────────────── chạy ─────────────────────────

async function main() {
  let loaded;
  let bridge = null;
  try {
    loaded = loadCourse();
    bridge = await loadDoctorBridge();
  } catch (err) {
    console.error(`[sd:doctor] ${err.message}`);
    process.exit(1);
  }
  const { course, modules } = loaded;
  const table = loadCurriculumTable();
  const manifest = loadManifest();
  if (!manifest) W('Chưa có _source/sdc/manifest.json: bỏ qua đối chiếu source.path/sha với manifest và độ trùng nguyên văn (T1.5)');

  // course.json
  if (course.courseId !== 'sysdesign') E(`course.json: courseId phải là "sysdesign"`);
  if (!isObj(course.levels)) E('course.json: thiếu levels');
  if (typeof course.passQuiz !== 'number') E('course.json: thiếu passQuiz (số)');
  const levels = new Set(Object.keys(course.levels ?? {}));

  const ctx = {
    bridge,
    stepCount: 0, quizCount: 0, cardCount: 0, actCount: 0, simCount: 0,
    simClaimed: new Set(), simModels: new Map(), moduleSims: new Map(),
    simRuns: new Map(), simsRecord: {},
    simIds: new Set(),
    claimed: new Map(),
    claimId(idv, re, kind, where) {
      if (typeof idv !== 'string' || !re.test(idv)) return E(`${where}: id ${kind} không theo mẫu ${re}`);
      if (this.claimed.has(idv)) return E(`${where}: trùng id ${kind} "${idv}" (đã có ở ${this.claimed.get(idv)})`);
      this.claimed.set(idv, where);
    },
  };

  // Gom id sim trước để activity kiểm tham chiếu
  for (const m of modules) for (const s of m.sim?.sims ?? []) if (s?.id) ctx.simIds.add(s.id);

  const seenModule = new Map();
  const seenOrder = new Map();
  const drafts = [];
  const missingInTable = [];
  for (const m of modules) {
    const meta = m.meta;
    const id = meta.id;
    // rule 1, 2
    if (typeof id !== 'string' || !/^S\d+-\d+$/.test(id)) E(`${m.folder}: id module "${id}" không theo mẫu S<level>-<nn>`);
    else if (seenModule.has(id)) E(`Trùng id module "${id}" (${m.folder} và ${seenModule.get(id)})`);
    else seenModule.set(id, m.folder);
    if (meta.slug !== m.folder) E(`${id}: slug "${meta.slug}" phải bằng tên thư mục "${m.folder}"`);
    for (const f of ['title', 'summary', 'difficulty']) if (typeof meta[f] !== 'string' || !meta[f].trim()) E(`${id}: thiếu "${f}"`);
    for (const f of ['level', 'order', 'durationMin']) if (!Number.isInteger(meta[f])) E(`${id}: "${f}" phải là số nguyên`);
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(meta.difficulty)) E(`${id}: difficulty không hợp lệ`);
    if (Number.isInteger(meta.durationMin) && (meta.durationMin < 8 || meta.durationMin > 20)) W(`${id}: durationMin ngoài 8–20`);
    if (!Array.isArray(meta.objectives) || meta.objectives.length < 3 || meta.objectives.length > 5) W(`${id}: objectives nên có 3–5 mục`);
    else if (meta.objectives.some((o) => !o?.vi)) E(`${id}: objectives[].vi bắt buộc`);
    if (!Array.isArray(meta.tags)) E(`${id}: tags phải là mảng`);
    if (Number.isInteger(meta.level) && !levels.has(String(meta.level))) E(`${id}: level ${meta.level} không có trong course.json`);
    if (typeof id === 'string' && Number.isInteger(meta.level) && !id.startsWith(`S${meta.level}-`)) E(`${id}: id không khớp level ${meta.level}`);
    if (Number.isInteger(meta.level) && Number.isInteger(meta.order)) {
      const key = `${meta.level}:${meta.order}`;
      if (seenOrder.has(key)) E(`Trùng (level, order) = (${meta.level}, ${meta.order}) giữa ${id} và ${seenOrder.get(key)}`);
      else seenOrder.set(key, id);
    }
    if (meta.status === 'draft') drafts.push(id);
    if (table && !table.has(id)) missingInTable.push(id);

    const sdcSources = checkSource(m, manifest, table?.get(id));
    checkSim(m, ctx);
    checkLesson(m, ctx);
    checkQuizCards(m, ctx);
    checkActivities(m, ctx);
    checkStage(m, ctx);
    checkStyle(m);
    checkOverlap(m, sdcSources);
  }
  // prerequisites/related/uses trỏ tới module tồn tại
  for (const m of modules) {
    for (const f of ['prerequisites', 'related', 'uses']) {
      for (const ref of m.meta[f] ?? []) {
        if (!seenModule.has(ref) && !table?.has(ref)) E(`${m.meta.id}: ${f} trỏ tới "${ref}" không tồn tại`);
      }
    }
  }
  if (drafts.length > 0) W(`Module status 'draft': ${drafts.join(', ')}`);

  checkSourceIntegrity();

  // rule 17: secret scan; rule 16 (lesson/stage) đã ở trên
  let scanned = 0;
  const scanTargets = [CONTENT_DIR, path.join(ROOT, 'src/features/sysdesign-course'), OUT_DIR, path.join(ROOT, 'src/apps/sdmastery')];
  for (const t of scanTargets) {
    for (const file of walk(t)) {
      scanned++;
      const text = fs.readFileSync(file, 'utf8');
      for (const pat of SECRET_PATTERNS) if (pat.re.test(text)) E(`[SECURITY] mẫu cấm "${pat.name}" tại ${rel(file)}`);
    }
  }

  // Build output tồn tại
  for (const f of ['curriculum.json', 'sims.json']) {
    if (!fs.existsSync(path.join(OUT_DIR, f))) W(`Thiếu src/data/courses/sysdesign/${f}: chạy "npm run sd:build"`);
  }

  // rule 19: thông tin
  infos.push(
    `${modules.length} module, ${ctx.stepCount} step, ${ctx.quizCount} quiz, ${ctx.cardCount} card, ${ctx.actCount} activity, ${ctx.simCount} sim; đã quét ${scanned} file`
  );
  if (missingInTable.length) infos.push(`Module chưa có dòng trong 02-curriculum.md: ${missingInTable.join(', ')}`);

  for (const i of infos) console.log(`[sd:doctor] info: ${i}`);
  for (const w of warnings) console.warn(`[sd:doctor] warn: ${w}`);
  for (const e of errors) console.error(`[sd:doctor] ERROR: ${e}`);
  const fail = errors.length > 0 || (STRICT && warnings.length > 0);
  console.log(`[sd:doctor] ${fail ? 'FAIL' : 'OK'}: ${errors.length} lỗi, ${warnings.length} cảnh báo`);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error(`[sd:doctor] ${err.message}`);
  process.exit(1);
});
