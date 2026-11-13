#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MINDMAP_DIR = path.resolve(ROOT, '..', 'PMP-Mindmap');
const MINDMAP_DIR = process.env.PMP_MINDMAP_DIR
  ? path.resolve(process.env.PMP_MINDMAP_DIR)
  : DEFAULT_MINDMAP_DIR;

const BOOK_ONLY_TOPICS = new Set(['intro', 'business', 'value', 'procurement', 'governance']);

const SECRET_PATTERNS = [
  { name: 'PRACTICE_TOKEN_SECRET leak', re: /PRACTICE_TOKEN_SECRET\s*=\s*['"][^'"]+['"]/ },
  { name: 'Direct /api/practice call', re: /pmp-mindmap\.vercel\.app\/api\/practice/ },
  { name: 'GitHub PAT', re: /\bgh[posru]_[A-Za-z0-9]{30,}\b/ },
  { name: 'GitHub Fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { name: 'Private Key PEM', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
];

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|tsx|js|mjs|json|md)$/i.test(ent.name)) out.push(full);
  }
  return out;
}

function collectTreeNodeIds(node, set) {
  if (!node || typeof node !== 'object') return;
  if (node.id) set.add(node.id);
  if (Array.isArray(node.children)) {
    for (const ch of node.children) collectTreeNodeIds(ch, set);
  }
}

function loadMindmapIndex(mindmapDir) {
  const dataDir = path.join(mindmapDir, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    return null;
  }

  const coreTopics = new Map();
  const coreDir = path.join(dataDir, 'core');
  for (const file of fs.readdirSync(coreDir).filter((f) => f.endsWith('.json') && f !== 'index.json')) {
    const doc = JSON.parse(fs.readFileSync(path.join(coreDir, file), 'utf8'));
    const nodeIds = new Set();
    collectTreeNodeIds(doc, nodeIds);
    coreTopics.set(doc.id, nodeIds);
  }

  const bookTopics = new Map();
  const topicsDir = path.join(dataDir, 'topics');
  for (const file of fs.readdirSync(topicsDir).filter((f) => f.endsWith('.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(topicsDir, file), 'utf8'));
    const nodeIds = new Set();
    collectTreeNodeIds(doc, nodeIds);
    bookTopics.set(doc.id, nodeIds);
  }

  const flowIds = new Set();
  const flowsDir = path.join(dataDir, 'flows');
  for (const file of fs.readdirSync(flowsDir).filter((f) => f.endsWith('.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(flowsDir, file), 'utf8'));
    if (doc.id) flowIds.add(doc.id);
  }

  return { coreTopics, bookTopics, flowIds };
}

function buildUrlForCheck(link, baseUrl) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  const lang = link.lang ?? 'vi';
  if (link.kind === 'panorama') {
    params.set('v', 'panorama');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }
  if (link.kind === 'practice') {
    params.set('v', 'practice');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }
  if (link.kind === 'flow') {
    params.set('v', 'flow');
    if (link.flowId) params.set('f', link.flowId);
    params.set('fm', link.flowMode ?? 'guided');
    params.set('lang', lang);
    return `${cleanBase}/?${params.toString()}`;
  }
  if (link.topicId) params.set('t', link.topicId);
  if (link.nodeId) params.set('n', link.nodeId);
  if (link.panel && link.panel !== 'none') params.set('p', link.panel);
  params.set('ed', link.edition ?? (link.topicId?.startsWith('core.') ? 'core' : 'book'));
  params.set('lang', lang);
  return `${cleanBase}/?${params.toString()}`;
}

async function main() {
  const errors = [];
  const warnings = [];

  // 1. Quét bí mật & gọi API trái phép
  const scanTargets = [
    path.join(ROOT, 'content/pmp'),
    path.join(ROOT, 'src/features/pmp-course'),
    path.join(ROOT, 'src/apps/pmpmastery'),
    path.join(ROOT, 'src/data/courses/pmp'),
  ];
  let scannedFiles = 0;
  for (const t of scanTargets) {
    for (const file of walkFiles(t)) {
      scannedFiles++;
      const text = fs.readFileSync(file, 'utf8');
      for (const pat of SECRET_PATTERNS) {
        if (pat.re.test(text)) {
          errors.push(`[SECURITY] Phát hiện mẫu cấm "${pat.name}" tại ${path.relative(ROOT, file)}`);
        }
      }
      if (/pmbok[78]\.json|pma-handout\.json/i.test(path.basename(file))) {
        errors.push(`[COPYRIGHT] Không được nhúng tệp sách bản quyền vào Learning Gate: ${path.relative(ROOT, file)}`);
      }
    }
  }

  // 2. Nạp dữ liệu PMP đã build
  const outDir = path.join(ROOT, 'src', 'data', 'courses', 'pmp');
  for (const reqFile of ['curriculum.json', 'links.json', 'canvas.json', 'decision-tree.json', 'comparisons.json']) {
    if (!fs.existsSync(path.join(outDir, reqFile))) {
      errors.push(`Thiếu tệp biên dịch src/data/courses/pmp/${reqFile}. Hãy chạy "npm run pmp:build" trước.`);
    }
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const cur = JSON.parse(fs.readFileSync(path.join(outDir, 'curriculum.json'), 'utf8'));
  const linksMap = JSON.parse(fs.readFileSync(path.join(outDir, 'links.json'), 'utf8'));
  const canvas = JSON.parse(fs.readFileSync(path.join(outDir, 'canvas.json'), 'utf8'));
  const tree = JSON.parse(fs.readFileSync(path.join(outDir, 'decision-tree.json'), 'utf8'));
  const comparisons = JSON.parse(fs.readFileSync(path.join(outDir, 'comparisons.json'), 'utf8'));

  // 3. Đối chiếu ID thật với repo PMP-Mindmap (nếu có mặt trên đĩa)
  let mmIndex = null;
  try {
    mmIndex = loadMindmapIndex(MINDMAP_DIR);
  } catch (err) {
    warnings.push(
      `Không đọc được thư mục PMP-Mindmap tại "${MINDMAP_DIR}" (${err.message}) — bỏ qua đối chiếu trực tiếp cây JSON của Mindmap (hãy chạy ngoài sandbox hoặc đặt PMP_MINDMAP_DIR để kiểm tra đầy đủ).`
    );
  }

  if (!mmIndex) {
    warnings.push(`Không tìm thấy dữ liệu PMP-Mindmap tại "${MINDMAP_DIR}" — chỉ kiểm tra cấu trúc URL cục bộ.`);
  }

  const allLinks = Object.values(linksMap);
  for (const lnk of allLinks) {
    const url = buildUrlForCheck(lnk, cur.mindmapBaseUrl);
    if (/[?&](sc|rq)=/.test(url)) {
      errors.push(`[LINK:${lnk.linkId}] URL chứa tham số đã bị gỡ (sc= hoặc rq=): ${url}`);
    }
    if (!lnk.label?.trim() || !lnk.whyRead?.trim()) {
      errors.push(`[LINK:${lnk.linkId}] Thiếu label hoặc whyRead.`);
    }

    if (lnk.kind === 'node') {
      if (!lnk.topicId) {
        errors.push(`[LINK:${lnk.linkId}] kind="node" bắt buộc phải có topicId.`);
        continue;
      }
      if (lnk.topicId.startsWith('core.') && lnk.edition !== 'core') {
        errors.push(`[LINK:${lnk.linkId}] topicId="${lnk.topicId}" thuộc Core nhưng edition="${lnk.edition}" (phải là "core").`);
      }
      if (!lnk.topicId.startsWith('core.') && lnk.edition !== 'book') {
        errors.push(`[LINK:${lnk.linkId}] topicId="${lnk.topicId}" thuộc Book nhưng edition="${lnk.edition}" (phải là "book").`);
      }
      if (BOOK_ONLY_TOPICS.has(lnk.topicId) && lnk.edition !== 'book') {
        errors.push(`[LINK:${lnk.linkId}] Chủ đề "${lnk.topicId}" chỉ có ở Book, bắt buộc edition="book".`);
      }

      if (mmIndex) {
        if (lnk.edition === 'core') {
          const nodes = mmIndex.coreTopics.get(lnk.topicId);
          if (!nodes) {
            errors.push(`[LINK:${lnk.linkId}] Core topicId "${lnk.topicId}" KHÔNG tồn tại trong PMP-Mindmap.`);
          } else if (lnk.nodeId && !nodes.has(lnk.nodeId)) {
            errors.push(`[LINK:${lnk.linkId}] Core nodeId "${lnk.nodeId}" KHÔNG tồn tại trong chủ đề "${lnk.topicId}".`);
          }
        } else {
          const nodes = mmIndex.bookTopics.get(lnk.topicId);
          if (!nodes) {
            errors.push(`[LINK:${lnk.linkId}] Book topicId "${lnk.topicId}" KHÔNG tồn tại trong PMP-Mindmap.`);
          } else if (lnk.nodeId && !nodes.has(lnk.nodeId)) {
            errors.push(`[LINK:${lnk.linkId}] Book nodeId "${lnk.nodeId}" KHÔNG tồn tại trong chủ đề "${lnk.topicId}".`);
          }
        }
      }
    } else if (lnk.kind === 'flow') {
      if (!lnk.flowId) {
        errors.push(`[LINK:${lnk.linkId}] kind="flow" bắt buộc phải có flowId.`);
      } else if (mmIndex && !mmIndex.flowIds.has(lnk.flowId)) {
        errors.push(`[LINK:${lnk.linkId}] flowId "${lnk.flowId}" KHÔNG tồn tại trong PMP-Mindmap.`);
      }
    }
  }

  // 4. Kiểm tra chất lượng từng Module
  const modIds = new Set();
  const orderPairs = new Set();
  const quizIds = new Set();
  const cardIds = new Set();

  for (const mod of cur.modules) {
    if (modIds.has(mod.id)) errors.push(`[MODULE] Trùng mã module: ${mod.id}`);
    modIds.add(mod.id);

    const pair = `${mod.level}:${mod.order}`;
    if (orderPairs.has(pair)) {
      errors.push(`[MODULE:${mod.id}] Trùng cặp (level, order) = (${mod.level}, ${mod.order})`);
    }
    orderPairs.add(pair);

    if (!(String(mod.level) in cur.levels)) {
      errors.push(`[MODULE:${mod.id}] level=${mod.level} chưa khai báo trong course.json.`);
    }

    if (!mod.lesson || mod.lesson.length < 300) {
      errors.push(`[MODULE:${mod.id}] Lesson quá ngắn (${mod.lesson?.length ?? 0} ký tự).`);
    } else {
      const visualRe = /^```visual(?::[a-z0-9_-]+)?\s*\n([\s\S]*?)^```/gm;
      const validKinds = new Set(['flow', 'layers', 'groups', 'anatomy', 'compare', 'troubleshoot']);
      const validTones = new Set(['sky', 'cyan', 'emerald', 'amber', 'rose', 'violet', 'slate']);
      let vMatch;
      let vCount = 0;
      while ((vMatch = visualRe.exec(mod.lesson)) !== null) {
        vCount++;
        try {
          const vDoc = YAML.parse(vMatch[1]);
          const tag = `[MODULE:${mod.id}:visual#${vCount}(${vDoc?.kind})]`;
          if (!vDoc || typeof vDoc !== 'object' || !validKinds.has(vDoc.kind)) {
            errors.push(`${tag} Sai kind (${vDoc?.kind}).`);
            continue;
          }
          if (vDoc.kind === 'flow') {
            if (!Array.isArray(vDoc.steps) || vDoc.steps.length === 0) {
              errors.push(`${tag} Thiếu mảng steps.`);
            } else {
              vDoc.steps.forEach((s, i) => {
                if (!s?.title?.trim()) errors.push(`${tag} steps[${i}] thiếu "title" (keys hiện có: ${Object.keys(s || {}).join(',')}).`);
                if (s?.tone && !validTones.has(s.tone)) errors.push(`${tag} steps[${i}] sai tone "${s.tone}".`);
              });
            }
          } else if (vDoc.kind === 'layers') {
            if (!Array.isArray(vDoc.columns) || vDoc.columns.length === 0) {
              errors.push(`${tag} Thiếu mảng columns (keys hiện có: ${Object.keys(vDoc).join(',')}).`);
            } else {
              vDoc.columns.forEach((col, ci) => {
                if (!col?.title?.trim()) errors.push(`${tag} columns[${ci}] thiếu "title".`);
                if (col?.tone && !validTones.has(col.tone)) errors.push(`${tag} columns[${ci}] sai tone "${col.tone}".`);
                if (!Array.isArray(col?.layers) || col.layers.length === 0) {
                  errors.push(`${tag} columns[${ci}] thiếu mảng "layers".`);
                } else {
                  col.layers.forEach((ly, li) => {
                    if (!ly?.label?.trim()) {
                      errors.push(`${tag} columns[${ci}].layers[${li}] thiếu "label" (keys: ${Object.keys(ly || {}).join(',')}).`);
                    }
                    if (ly?.tone && !validTones.has(ly.tone)) errors.push(`${tag} columns[${ci}].layers[${li}] sai tone "${ly.tone}".`);
                  });
                }
              });
            }
          } else if (vDoc.kind === 'groups') {
            if (!Array.isArray(vDoc.items) || vDoc.items.length === 0) {
              errors.push(`${tag} Thiếu mảng items (keys: ${Object.keys(vDoc).join(',')}).`);
            } else {
              vDoc.items.forEach((it, i) => {
                if (!it?.title?.trim()) errors.push(`${tag} items[${i}] thiếu "title" (keys: ${Object.keys(it || {}).join(',')}).`);
                if (it?.tone && !validTones.has(it.tone)) errors.push(`${tag} items[${i}] sai tone "${it.tone}".`);
                if (!it?.desc?.trim() && (!Array.isArray(it?.bullets) || it.bullets.length === 0) && !it?.code?.trim()) {
                  errors.push(`${tag} items[${i}] không có desc, bullets hay code (keys: ${Object.keys(it || {}).join(',')}).`);
                }
              });
            }
          } else if (vDoc.kind === 'anatomy') {
            if (!Array.isArray(vDoc.items) || vDoc.items.length === 0) {
              errors.push(`${tag} Thiếu mảng items (keys: ${Object.keys(vDoc).join(',')}).`);
            } else {
              vDoc.items.forEach((it, i) => {
                if (!it?.keyword?.trim() || !it?.summary?.trim()) {
                  errors.push(`${tag} items[${i}] phải có "keyword" và "summary" (keys: ${Object.keys(it || {}).join(',')}).`);
                }
                if (it?.tone && !validTones.has(it.tone)) errors.push(`${tag} items[${i}] sai tone "${it.tone}".`);
              });
            }
          } else if (vDoc.kind === 'compare') {
            for (const sideName of ['left', 'right']) {
              const side = vDoc[sideName];
              if (!side || typeof side !== 'object') {
                errors.push(`${tag} Thiếu nhánh "${sideName}".`);
                continue;
              }
              if (!side.title?.trim()) errors.push(`${tag} ${sideName} thiếu "title" (keys: ${Object.keys(side).join(',')}).`);
              if (side.tone && !validTones.has(side.tone)) errors.push(`${tag} ${sideName} sai tone "${side.tone}".`);
              if ((!Array.isArray(side.bullets) || side.bullets.length === 0) && !side.code?.trim()) {
                errors.push(`${tag} ${sideName} phải có "bullets" hoặc "code" (keys: ${Object.keys(side).join(',')}).`);
              }
            }
          } else if (vDoc.kind === 'troubleshoot') {
            if (!Array.isArray(vDoc.items) || vDoc.items.length === 0) {
              errors.push(`${tag} Thiếu mảng items (keys: ${Object.keys(vDoc).join(',')}).`);
            } else {
              vDoc.items.forEach((it, i) => {
                if (!it?.symptom?.trim() || !it?.cause?.trim() || !it?.fix?.trim()) {
                  errors.push(`${tag} items[${i}] phải có "symptom", "cause", "fix" (keys: ${Object.keys(it || {}).join(',')}).`);
                }
                if (it?.tone && !validTones.has(it.tone)) errors.push(`${tag} items[${i}] sai tone "${it.tone}".`);
              });
            }
          }
        } catch (err) {
          errors.push(`[MODULE:${mod.id}] Lỗi YAML ở khối visual #${vCount}: ${err.message}`);
        }
      }
      if (vCount === 0) {
        errors.push(`[MODULE:${mod.id}] Lesson chưa có khối sơ đồ trực quan (visual YAML block) nào.`);
      }
    }

    if (!Array.isArray(mod.evidenceLinkIds) || mod.evidenceLinkIds.length < 2) {
      errors.push(`[MODULE:${mod.id}] Phải có ít nhất 2 dẫn chứng Mindmap (hiện có ${mod.evidenceLinkIds?.length ?? 0}).`);
    } else {
      for (const lid of mod.evidenceLinkIds) {
        if (!linksMap[lid]) {
          errors.push(`[MODULE:${mod.id}] evidenceLinkId "${lid}" không tồn tại trong links.json.`);
        }
      }
    }

    if (!mod.practice || !mod.practice.primaryLinkId || !linksMap[mod.practice.primaryLinkId]) {
      errors.push(`[MODULE:${mod.id}] Thiếu hoặc sai practice.primaryLinkId.`);
    }
    for (const secId of mod.practice?.secondaryLinkIds ?? []) {
      if (!linksMap[secId]) {
        errors.push(`[MODULE:${mod.id}] practice.secondaryLinkId "${secId}" không tồn tại trong links.json.`);
      }
    }

    if (!Array.isArray(mod.quiz) || mod.quiz.length < 5) {
      errors.push(`[MODULE:${mod.id}] Phải có >= 5 câu hỏi quiz tự kiểm tra (hiện có ${mod.quiz?.length ?? 0}).`);
    }
    for (const q of mod.quiz ?? []) {
      if (quizIds.has(q.id)) errors.push(`[QUIZ] Trùng ID câu hỏi: ${q.id}`);
      quizIds.add(q.id);
      if (!q.q?.trim() || !q.explain?.trim()) {
        errors.push(`[QUIZ:${q.id}] Thiếu câu hỏi hoặc giải thích tư duy.`);
      }
      if (q.type === 'mc') {
        if (!Array.isArray(q.choices) || q.choices.length < 2 || q.answer < 0 || q.answer >= q.choices.length) {
          errors.push(`[QUIZ:${q.id}] Lựa chọn hoặc đáp án trắc nghiệm không hợp lệ.`);
        }
      } else if (q.type === 'tf') {
        if (typeof q.answer !== 'boolean') errors.push(`[QUIZ:${q.id}] Đáp án tf phải là boolean.`);
      }
    }

    if (!Array.isArray(mod.cards) || mod.cards.length < 5) {
      errors.push(`[MODULE:${mod.id}] Phải có >= 5 thẻ flashcard SRS (hiện có ${mod.cards?.length ?? 0}).`);
    }
    for (const c of mod.cards ?? []) {
      if (cardIds.has(c.id)) errors.push(`[CARD] Trùng ID flashcard: ${c.id}`);
      cardIds.add(c.id);
      if (!c.front?.trim() || !c.back?.trim()) {
        errors.push(`[CARD:${c.id}] Flashcard bị trống mặt trước hoặc mặt sau.`);
      }
    }
  }

  // 5. Kiểm tra Canvas, Decision Tree & Comparisons
  for (const card of [...(canvas.principles ?? []), ...(canvas.roles ?? []), ...(canvas.approaches ?? [])]) {
    if (!modIds.has(card.moduleId)) {
      errors.push(`[CANVAS:${card.id}] moduleId "${card.moduleId}" không tồn tại.`);
    }
    for (const lid of card.evidenceLinkIds ?? []) {
      if (!linksMap[lid]) errors.push(`[CANVAS:${card.id}] linkId "${lid}" không tồn tại.`);
    }
  }
  for (const row of canvas.domainBridge ?? []) {
    if (!modIds.has(row.moduleId)) errors.push(`[CANVAS:bridge:${row.pmbok8Domain}] moduleId "${row.moduleId}" không tồn tại.`);
    if (!linksMap[row.linkId]) errors.push(`[CANVAS:bridge:${row.pmbok8Domain}] linkId "${row.linkId}" không tồn tại.`);
  }

  // Kiểm tra Decision Tree không có chu trình và mọi đường đều tới outcome hợp lệ
  const branchIds = new Set(tree.branches.map((b) => b.id));
  function walkDecisionNode(nodeId, visitedPath) {
    const node = tree.nodes[nodeId];
    if (!node) {
      errors.push(`[DECISION] Node "${nodeId}" không tồn tại (từ ${visitedPath.join(' -> ')}).`);
      return;
    }
    if (visitedPath.includes(nodeId)) {
      errors.push(`[DECISION] Phát hiện chu trình tại "${nodeId}": ${visitedPath.join(' -> ')}`);
      return;
    }
    if (node.kind === 'outcome') {
      if (!modIds.has(node.moduleId)) {
        errors.push(`[DECISION:${nodeId}] moduleId "${node.moduleId}" không tồn tại.`);
      }
      for (const lid of node.evidenceLinkIds ?? []) {
        if (!linksMap[lid]) errors.push(`[DECISION:${nodeId}] linkId "${lid}" không tồn tại.`);
      }
      return;
    }
    if (!Array.isArray(node.options) || node.options.length < 2) {
      errors.push(`[DECISION:${nodeId}] Node câu hỏi phải có >= 2 lựa chọn.`);
      return;
    }
    for (const opt of node.options) {
      walkDecisionNode(opt.nextNodeId, [...visitedPath, nodeId]);
    }
  }
  for (const b of tree.branches) {
    walkDecisionNode(b.entryNodeId, [`branch:${b.id}`]);
  }
  for (const ch of tree.challenges ?? []) {
    if (!branchIds.has(ch.branchId)) {
      errors.push(`[DECISION:case:${ch.id}] branchId "${ch.branchId}" không tồn tại.`);
    }
    const leaf = tree.nodes[ch.expectedLeafId];
    if (!leaf || leaf.kind !== 'outcome') {
      errors.push(`[DECISION:case:${ch.id}] expectedLeafId "${ch.expectedLeafId}" không phải là outcome hợp lệ.`);
    }
  }

  for (const cmp of comparisons) {
    if (!modIds.has(cmp.moduleId)) errors.push(`[COMPARISON:${cmp.id}] moduleId "${cmp.moduleId}" không tồn tại.`);
    for (const lid of cmp.evidenceLinkIds ?? []) {
      if (!linksMap[lid]) errors.push(`[COMPARISON:${cmp.id}] linkId "${lid}" không tồn tại.`);
    }
  }

  console.log(
    `✔ [pmp:doctor] ${cur.modules.length} modules · ${quizIds.size} quizzes · ${cardIds.size} SRS cards · ${allLinks.length} deep links (${mmIndex ? 'ĐÃ ĐỐI CHIẾU TRỰC TIẾP VỚI PMP-MINDMAP' : 'kiểm tra cục bộ'}) · ${tree.branches.length} nhánh & ${tree.challenges.length} ca cây quyết định · ${comparisons.length} bảng đối chiếu`
  );
  console.log(`✔ [pmp:security] Đã quét sạch bí mật & bản quyền trên ${scannedFiles} tệp.`);

  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (errors.length > 0) {
    console.error(`\n✘ PHÁT HIỆN ${errors.length} LỖI TRONG PMP MASTERY:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('\n🎉 pmp:doctor XANH 100% — Toàn bộ nội dung, cây quyết định và deep link đều chính xác!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
