#!/usr/bin/env node
// Doctor cho content/sysdesign (T1.4). Quy tắc theo docs/sysdesign/07-content-authoring.md §6.
// E = lỗi (exit 1), W = cảnh báo (--strict thì cũng exit 1), I = thông tin.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR, OUT_DIR, ROOT, SOURCE_DIR, loadCourse, parseSteps, rel } from './lib/sysdesign-content.mjs';

const STRICT = process.argv.includes('--strict');
const errors = [];
const warnings = [];
const infos = [];
const E = (msg) => errors.push(msg);
const W = (msg) => warnings.push(msg);

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
    const words = wordCount(st.body.replace(/```[\s\S]*?```/g, ''));
    if (words > 300) W(`${where}: ${words} từ (> 300)`);
  });

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
  m.activities.forEach((a, i) => {
    const where = `${id} activities[${i}] (${a?.id ?? '?'})`;
    if (!isObj(a)) return E(`${where}: không phải object`);
    ctx.claimId(a.id, /^S\d+-\d+\.A\d+$/, 'activity', where);
    if (!ACTIVITY_KINDS.includes(a.kind)) E(`${where}: kind "${a.kind}" không hợp lệ`);
    if (!isObj(a.prompt) || !a.prompt.vi) E(`${where}: thiếu prompt.vi`);
    if (![1, 2, 3].includes(a.difficulty)) E(`${where}: difficulty phải là 1|2|3`);
    if (!isObj(a.explain) || !a.explain.vi) E(`${where}: thiếu explain.vi`);
    for (const ref of [a.sim, a.replay]) {
      if (ref?.simId && !ctx.simIds.has(ref.simId)) E(`${where}: simId "${ref.simId}" không tồn tại`);
    }
  });
  // TODO(T4.6): chạy engine để kiểm activity (starter không đạt, solution đạt 3 sao,
  // traps không đạt, `expected` khớp engine, biến {…} phân giải được). Xem 06 §8.2.
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
    ctx.simModels.set(sim.id, { nodeIds, linkIds });
  }
  ctx.moduleSims.set(id, modSimIds);
  // TODO(T4.6/M2): chạy engine để kiểm `expect`, mọi preset đúng `expectPass`, không NaN/∞ (rule 11).
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

  // Tập node/link của mọi sim trong module (hợp), nếu có sim
  const sims = [...(ctx.moduleSims.get(id) ?? [])].map((sid) => ctx.simModels.get(sid)).filter(Boolean);
  const nodeSet = new Set(sims.flatMap((s) => [...s.nodeIds]));
  const linkSet = new Set(sims.flatMap((s) => [...s.linkIds]));
  const hasModel = sims.length > 0;
  const liveScenes = new Set();
  if (Object.keys(st.scenes).length === 0) E(`${id}: stage.json không có scene nào`);
  if (st.base !== undefined && !st.scenes[st.base]) E(`${id}: stage.base "${st.base}" không có trong scenes`);
  if (st.base === undefined && Object.keys(st.scenes).length > 0 && st.scenes[Object.keys(st.scenes)[0]]?.mode === 'memory-2d') {
    W(`${id}: scene đầu tiên là memory-2d và không có stage.base: bước không khai báo scene sẽ lấy scene này làm mặc định`);
  }
  for (const lv of Object.values(st.live ?? {})) {
    if (lv?.sim && !ctx.simClaimed.has(lv.sim)) E(`${id}: live.sim "${lv.sim}" không có trong sim.json`);
  }
  for (const [key, sc] of Object.entries(st.scenes)) {
    const where = `${id} scene "${key}"`;
    if (isObj(sc) && sc.mode === 'memory-2d') {
      const mm = sc.memory;
      const okShape =
        isObj(mm) &&
        MEMORY_KINDS.includes(mm.kind) &&
        (mm.kind === 'tape' ? Array.isArray(mm.cells) : mm.kind === 'refs' ? Array.isArray(mm.names) && Array.isArray(mm.objects) : Array.isArray(mm.nodes) && Array.isArray(mm.edges));
      if (!okShape) E(`${where}: mode memory-2d cần "memory" đúng dạng tape|refs|tree (xem scale-workbench/types.ts)`);
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
      const shown = sc.show.nodes === '*' ? [] : sc.show.nodes ?? [];
      for (const n of shown) if (!nodeSet.has(n)) E(`${where}: node "${n}" không có trong sim`);
      const sl = sc.show.links === '*' ? [] : sc.show.links ?? [];
      for (const l of sl) if (!linkSet.has(l)) E(`${where}: link "${l}" không có trong sim`);
      for (const n of Object.keys(sc.state ?? {})) if (!nodeSet.has(n)) E(`${where}: state trỏ tới node "${n}" không có trong sim`);
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

function main() {
  let loaded;
  try {
    loaded = loadCourse();
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
    stepCount: 0, quizCount: 0, cardCount: 0, actCount: 0, simCount: 0,
    simClaimed: new Set(), simModels: new Map(), moduleSims: new Map(),
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
    checkLesson(m, ctx);
    checkQuizCards(m, ctx);
    checkSim(m, ctx);
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

main();
