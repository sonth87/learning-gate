#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const COURSES = ['kube', 'cicd', 'redis'];

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Lỗi JSON tại ${path.relative(ROOT, filePath)}: ${err.message}`);
  }
}

function buildCourse(courseId) {
  const srcRoot = path.join(ROOT, 'content', courseId);
  const outRoot = path.join(ROOT, 'src', 'data', 'courses', courseId);
  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Không tìm thấy thư mục nguồn: content/${courseId}`);
  }

  const courseMeta = readJson(path.join(srcRoot, 'course.json'));
  const modulesDir = path.join(srcRoot, 'modules');
  const moduleFolders = fs.existsSync(modulesDir)
    ? fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  // Đọc kho cấu hình thật (readings)
  const readingsMetaPath = path.join(srcRoot, 'readings', 'catalog.json');
  const readingsMeta = fs.existsSync(readingsMetaPath)
    ? readJson(readingsMetaPath)
    : { categories: {}, flagLabels: {}, items: [] };

  const filesDir = path.join(srcRoot, 'readings', 'files');
  const readingsMap = {};
  const catalogItems = [];

  readingsMeta.items.forEach((entry, idx) => {
    const fileAbs = path.join(filesDir, entry.path);
    if (!fs.existsSync(fileAbs)) {
      throw new Error(`Thiếu file cấu hình thật "${entry.path}" tại ${path.relative(ROOT, fileAbs)}`);
    }
    const content = fs.readFileSync(fileAbs, 'utf8').replace(/\r\n/g, '\n');
    readingsMap[entry.path] = content;
    const loc = content.replace(/\n$/, '').split('\n').length;
    catalogItems.push({
      n: idx + 1,
      id: `${courseId}-cfg-${idx + 1}`,
      path: entry.path,
      language: entry.language ?? 'yaml',
      loc,
      category: entry.category ?? 'general',
      topic: entry.topic ?? '',
      level: entry.level ?? 0,
      difficulty: entry.difficulty ?? 1,
      quality: entry.quality ?? 5,
      tags: entry.tags ?? [],
      flags: entry.flags ?? [],
      sourceUrl: entry.sourceUrl ?? '',
      curated: [],
    });
  });

  const byPath = new Map(catalogItems.map((it) => [it.path, it]));

  const modules = [];
  for (const folder of moduleFolders) {
    const mDir = path.join(modulesDir, folder);
    const meta = readJson(path.join(mDir, 'module.json'));
    const lesson = fs.readFileSync(path.join(mDir, 'lesson.md'), 'utf8').replace(/\r\n/g, '\n').trim();
    const quiz = fs.existsSync(path.join(mDir, 'quiz.json')) ? readJson(path.join(mDir, 'quiz.json')) : [];
    const cards = fs.existsSync(path.join(mDir, 'cards.json')) ? readJson(path.join(mDir, 'cards.json')) : [];
    const drills = fs.existsSync(path.join(mDir, 'drills.json')) ? readJson(path.join(mDir, 'drills.json')) : [];
    const exercises = fs.existsSync(path.join(mDir, 'exercises.json'))
      ? readJson(path.join(mDir, 'exercises.json'))
      : [];

    const moduleReadings = (meta.readings ?? []).map((r) => {
      const catItem = byPath.get(r.path);
      if (catItem) {
        catItem.curated.push({ module: meta.id, kind: r.kind });
      }
      return {
        path: r.path,
        kind: r.kind,
        note: r.note,
        task: r.task,
        answer: r.answer,
        catalogN: catItem?.n,
      };
    });

    modules.push({
      id: meta.id,
      slug: meta.slug ?? folder,
      level: meta.level,
      order: meta.order,
      title: meta.title,
      summary: meta.summary,
      tags: meta.tags ?? [],
      lesson,
      sources: meta.sources ?? [],
      relatedTools: meta.relatedTools ?? [],
      exercises: exercises.map((ex) => ({
        ...ex,
        module: meta.id,
        webGrade: ex.webGrade ?? true,
        hints: ex.hints ?? [],
        tags: ex.tags ?? [],
        ref: ex.ref ?? '',
      })),
      quiz,
      cards,
      drills,
      readings: moduleReadings,
    });
  }

  // Sắp xếp module nghiêm ngặt theo (level, order)
  modules.sort((a, b) => a.level - b.level || a.order - b.order);

  const curriculum = {
    courseId,
    generatedAt: '2026-04-01T00:00:00.000Z',
    passQuiz: courseMeta.passQuiz ?? 0.7,
    levels: courseMeta.levels ?? {},
    modules,
  };

  const catalog = {
    categories: readingsMeta.categories ?? {},
    flagLabels: readingsMeta.flagLabels ?? {},
    items: catalogItems,
  };

  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(path.join(outRoot, 'readings.json'), JSON.stringify(readingsMap, null, 2) + '\n');

  const exTotal = modules.reduce((n, m) => n + m.exercises.length, 0);
  const quizTotal = modules.reduce((n, m) => n + m.quiz.length, 0);
  const cardTotal = modules.reduce((n, m) => n + m.cards.length, 0);
  console.log(
    `[course:build] ${courseId.padEnd(4)} → ${modules.length} modules, ${exTotal} exercises, ${quizTotal} quizzes, ${cardTotal} flashcards, ${catalogItems.length} real configs`
  );
}

for (const c of COURSES) {
  if (fs.existsSync(path.join(ROOT, 'content', c, 'course.json'))) {
    buildCourse(c);
  }
}
