#!/usr/bin/env node
// content/sysdesign → src/data/courses/sysdesign/{curriculum,sims}.json (T1.4).
// Định dạng nguồn: docs/sysdesign/07-content-authoring.md. Bỏ qua _source/.
// Đầu ra là file sinh ra, KHÔNG sửa tay (được theo dõi trong git như các khoá khác, ADR-016).
import fs from 'node:fs';
import path from 'node:path';
import { OUT_DIR, loadCourse, rel } from './lib/sysdesign-content.mjs';

function buildSysdesign() {
  const { course, modules: raw } = loadCourse();

  const seenIds = new Set();
  const seenSims = new Set();
  const sims = {};
  const modules = [];

  for (const m of raw) {
    const meta = m.meta;
    if (!meta.id) throw new Error(`${m.folder}/module.json thiếu id`);
    if (seenIds.has(meta.id)) throw new Error(`Trùng id module "${meta.id}" (${m.folder})`);
    seenIds.add(meta.id);
    if (m.lesson === null) throw new Error(`${m.folder} thiếu lesson.md`);

    const simIds = [];
    for (const sim of m.sim?.sims ?? []) {
      if (!sim.id) throw new Error(`${m.folder}/sim.json có sim thiếu id`);
      if (seenSims.has(sim.id)) throw new Error(`Trùng id sim "${sim.id}" (${m.folder})`);
      seenSims.add(sim.id);
      sims[sim.id] = sim;
      simIds.push(sim.id);
    }

    modules.push({
      ...meta,
      slug: meta.slug ?? m.folder,
      lesson: m.lesson,
      quiz: m.quiz,
      cards: m.cards,
      stage: m.stage,
      activities: m.activities,
      simIds,
    });
  }

  modules.sort((a, b) => a.level - b.level || a.order - b.order);

  const curriculum = {
    courseId: course.courseId ?? 'sysdesign',
    passQuiz: course.passQuiz ?? 0.7,
    levels: course.levels ?? {},
    modules,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'sims.json'), JSON.stringify({ sims }, null, 2) + '\n');

  const quizTotal = modules.reduce((n, m) => n + m.quiz.length, 0);
  const cardTotal = modules.reduce((n, m) => n + m.cards.length, 0);
  const actTotal = modules.reduce((n, m) => n + m.activities.length, 0);
  console.log(
    `[sd:build] sysdesign → ${modules.length} modules, ${quizTotal} quizzes, ${cardTotal} flashcards, ${actTotal} activities, ${Object.keys(sims).length} sims (${rel(OUT_DIR)})`
  );
}

try {
  buildSysdesign();
} catch (err) {
  console.error(`[sd:build] ${err.message}`);
  process.exit(1);
}
