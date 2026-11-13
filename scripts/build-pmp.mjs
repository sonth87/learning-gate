#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Lỗi JSON tại ${path.relative(ROOT, filePath)}: ${err.message}`);
  }
}

function buildPmp() {
  const srcRoot = path.join(ROOT, 'content', 'pmp');
  const outRoot = path.join(ROOT, 'src', 'data', 'courses', 'pmp');
  if (!fs.existsSync(srcRoot)) {
    throw new Error('Không tìm thấy thư mục nguồn: content/pmp');
  }

  const courseMeta = readJson(path.join(srcRoot, 'course.json'));
  const linksList = readJson(path.join(srcRoot, 'links.json'));
  const canvasData = readJson(path.join(srcRoot, 'canvas.json'));
  const decisionTree = readJson(path.join(srcRoot, 'decision-tree.json'));
  const comparisons = readJson(path.join(srcRoot, 'comparisons.json'));

  const linksMap = {};
  for (const item of linksList) {
    if (!item.linkId) {
      throw new Error('Mục trong content/pmp/links.json thiếu linkId');
    }
    if (linksMap[item.linkId]) {
      throw new Error(`Trùng linkId "${item.linkId}" trong content/pmp/links.json`);
    }
    linksMap[item.linkId] = item;
  }

  const modulesDir = path.join(srcRoot, 'modules');
  const moduleFolders = fs.existsSync(modulesDir)
    ? fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  const modules = [];
  for (const folder of moduleFolders) {
    const mDir = path.join(modulesDir, folder);
    const meta = readJson(path.join(mDir, 'module.json'));
    const lesson = fs.readFileSync(path.join(mDir, 'lesson.md'), 'utf8').replace(/\r\n/g, '\n').trim();
    const quiz = fs.existsSync(path.join(mDir, 'quiz.json')) ? readJson(path.join(mDir, 'quiz.json')) : [];
    const cards = fs.existsSync(path.join(mDir, 'cards.json')) ? readJson(path.join(mDir, 'cards.json')) : [];

    modules.push({
      id: meta.id,
      slug: meta.slug ?? folder,
      level: meta.level,
      order: meta.order,
      title: meta.title,
      summary: meta.summary,
      motto: meta.motto ?? 'Think First · Assess Impact · Follow Governance · Deliver Value',
      provenance: meta.provenance ?? [],
      realWorldTrap: meta.realWorldTrap ?? '',
      pmiMindsetShift: meta.pmiMindsetShift ?? '',
      tags: meta.tags ?? [],
      lesson,
      evidenceLinkIds: meta.evidenceLinkIds ?? [],
      practice: meta.practice,
      quiz,
      cards,
      decisionBranchId: meta.decisionBranchId,
    });
  }

  // Sắp xếp module nghiêm ngặt theo (level, order)
  modules.sort((a, b) => a.level - b.level || a.order - b.order);

  const curriculum = {
    courseId: 'pmp',
    generatedAt: '2026-11-13T00:00:00.000Z',
    mindmapBaseUrl: courseMeta.mindmapBaseUrl ?? 'https://pmp-mindmap.vercel.app',
    passQuiz: courseMeta.passQuiz ?? 0.7,
    levels: courseMeta.levels ?? {},
    modules,
  };

  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'links.json'), JSON.stringify(linksMap, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'canvas.json'), JSON.stringify(canvasData, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'decision-tree.json'), JSON.stringify(decisionTree, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'comparisons.json'), JSON.stringify(comparisons, null, 2) + '\n');

  const quizTotal = modules.reduce((n, m) => n + m.quiz.length, 0);
  const cardTotal = modules.reduce((n, m) => n + m.cards.length, 0);
  console.log(
    `[pmp:build] pmp → ${modules.length} modules, ${quizTotal} quizzes, ${cardTotal} flashcards, ${Object.keys(linksMap).length} deep links, ${comparisons.length} comparison tables`
  );
}

buildPmp();
