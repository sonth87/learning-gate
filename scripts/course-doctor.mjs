#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function loadGradeEngine() {
  const entry = path.join(ROOT, 'src/features/devops-course/engine/gradeEngine.ts');
  const tmpFile = path.join(ROOT, 'node_modules/.cache/agy-grade-engine.mjs');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: tmpFile,
    tsconfig: path.join(ROOT, 'tsconfig.json'),
  });
  try {
    return await import(pathToFileURL(tmpFile).href);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

// Quét bí mật thực tế (token, webhook, private key) để tránh lộ thông tin và tránh bị GitHub Push Protection chặn
const SECRET_PATTERNS = [
  { name: 'Slack Webhook', re: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Discord Webhook', re: /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/ },
  { name: 'GitHub PAT (ghp_/gho_/ghs_)', re: /\bgh[posru]_[A-Za-z0-9]{30,}\b/ },
  { name: 'GitHub Fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { name: 'GitLab PAT', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'AWS Access Key (non-EXAMPLE)', re: /\bAKIA(?!IOSFODNN7EXAMPLE)[A-Z0-9]{16}\b/ },
  { name: 'Private Key PEM', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
];

const OUTDATED_SOLUTION_PATTERNS = [
  { name: 'docker-compose v1 (dùng "docker compose" v2)', re: /\bdocker-compose\s+/ },
  { name: 'GitHub Actions ::set-output (dùng $GITHUB_OUTPUT)', re: /::set-output\s+name=/ },
  { name: 'actions/checkout@v1..v3 (dùng @v4)', re: /actions\/checkout@v[123]\b/ },
  { name: 'actions/setup-node@v1..v3 (dùng @v4)', re: /actions\/setup-node@v[123]\b/ },
  { name: 'K8s extensions/v1beta1 (dùng apps/v1 hoặc networking.k8s.io/v1)', re: /apiVersion:\s*extensions\/v1beta1\b/ },
  { name: 'npm prune --production (dùng npm prune --omit=dev)', re: /npm\s+prune\s+--production\b/ },
];

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.git') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|tsx|js|mjs|json|md|yaml|yml|Dockerfile|sh)$/i.test(ent.name) || ent.name.startsWith('Dockerfile')) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const errors = [];
  const warnings = [];
  const { gradeDevOpsExercise, executeDiagnosticCommand } = await loadGradeEngine();

  // 1. Quét bí mật trên content/, scripts/, src/features/devops-course/, src/apps/
  const scanTargets = [
    path.join(ROOT, 'content'),
    path.join(ROOT, 'scripts'),
    path.join(ROOT, 'src/features/devops-course'),
    path.join(ROOT, 'src/data/courses'),
  ];
  let scannedFiles = 0;
  for (const target of scanTargets) {
    for (const file of walkFiles(target)) {
      scannedFiles++;
      const text = fs.readFileSync(file, 'utf8');
      for (const pat of SECRET_PATTERNS) {
        if (pat.re.test(text)) {
          errors.push(`[SECRET] Phát hiện mẫu "${pat.name}" trong ${path.relative(ROOT, file)}`);
        }
      }
    }
  }

  // 2. Kiểm tra từng khoá học đã biên dịch
  for (const courseId of ['kube', 'cicd']) {
    const dataDir = path.join(ROOT, 'src', 'data', 'courses', courseId);
    const curPath = path.join(dataDir, 'curriculum.json');
    const catPath = path.join(dataDir, 'catalog.json');
    const readPath = path.join(dataDir, 'readings.json');

    if (!fs.existsSync(curPath) || !fs.existsSync(catPath) || !fs.existsSync(readPath)) {
      errors.push(`[${courseId}] Chưa có JSON biên dịch tại src/data/courses/${courseId}/. Hãy chạy "npm run course:build" trước.`);
      continue;
    }

    const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));
    const cat = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    const readings = JSON.parse(fs.readFileSync(readPath, 'utf8'));

    if (!cur.modules.length) {
      errors.push(`[${courseId}] Không có module nào trong curriculum.json.`);
      continue;
    }

    const modIds = new Set();
    const orderPairs = new Set();
    const exIds = new Set();
    const exCodes = new Set();
    const quizIds = new Set();
    const cardIds = new Set();
    const catalogPaths = new Set(cat.items.map((i) => i.path));

    // Kiểm tra mọi item trong catalog đều có nội dung trong readings.json
    for (const item of cat.items) {
      if (!(item.path in readings) || !readings[item.path].trim()) {
        errors.push(`[${courseId}] Catalog item "${item.path}" không có nội dung trong readings.json.`);
      }
      if (!item.sourceUrl || !/^https?:\/\//.test(item.sourceUrl)) {
        errors.push(`[${courseId}] Catalog item "${item.path}" thiếu sourceUrl hợp lệ.`);
      }
    }

    let passedExCount = 0;
    for (const mod of cur.modules) {
      if (modIds.has(mod.id)) errors.push(`[${courseId}] Trùng mã module: ${mod.id}`);
      modIds.add(mod.id);

      const pairKey = `${mod.level}:${mod.order}`;
      if (orderPairs.has(pairKey)) {
        errors.push(`[${courseId}] Trùng cặp (level, order) = (${mod.level}, ${mod.order}) ở module ${mod.id}`);
      }
      orderPairs.add(pairKey);

      if (!(String(mod.level) in cur.levels)) {
        errors.push(`[${courseId}:${mod.id}] level=${mod.level} chưa được khai báo tên trong course.json levels.`);
      }
      if (!mod.lesson || mod.lesson.length < 200) {
        errors.push(`[${courseId}:${mod.id}] Lesson quá ngắn hoặc rỗng (${mod.lesson?.length ?? 0} ký tự).`);
      }
      if (!Array.isArray(mod.sources) || mod.sources.length === 0) {
        errors.push(`[${courseId}:${mod.id}] Thiếu mục "sources" (URL tài liệu chính thức).`);
      } else {
        for (const s of mod.sources) {
          if (!s.title || !/^https?:\/\//.test(s.url ?? '')) {
            errors.push(`[${courseId}:${mod.id}] Nguồn tham khảo không hợp lệ: ${JSON.stringify(s)}`);
          }
        }
      }
      if (!Array.isArray(mod.quiz) || mod.quiz.length === 0) {
        errors.push(`[${courseId}:${mod.id}] Module chưa có câu hỏi quiz nào.`);
      }
      if (!Array.isArray(mod.cards) || mod.cards.length === 0) {
        errors.push(`[${courseId}:${mod.id}] Module chưa có flashcard nào.`);
      }
      if (!Array.isArray(mod.exercises) || mod.exercises.length === 0) {
        errors.push(`[${courseId}:${mod.id}] Module chưa có bài thực hành nào.`);
      }

      // Kiểm tra readings gắn vào module
      for (const r of mod.readings ?? []) {
        if (!catalogPaths.has(r.path)) {
          errors.push(`[${courseId}:${mod.id}] Reading "${r.path}" không tồn tại trong catalog.json.`);
        }
      }

      // Kiểm tra quiz
      for (const q of mod.quiz ?? []) {
        if (quizIds.has(q.id)) errors.push(`[${courseId}] Trùng ID câu hỏi quiz: ${q.id}`);
        quizIds.add(q.id);
        if (!q.q?.trim()) errors.push(`[${courseId}:${q.id}] Câu hỏi quiz bị trống nội dung.`);
        if (q.type === 'mc') {
          if (!Array.isArray(q.choices) || q.choices.length < 2) {
            errors.push(`[${courseId}:${q.id}] Câu hỏi trắc nghiệm phải có >= 2 lựa chọn.`);
          } else if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) {
            errors.push(`[${courseId}:${q.id}] Đáp án trắc nghiệm ngoài phạm vi: ${q.answer}`);
          }
        } else if (q.type === 'tf') {
          if (typeof q.answer !== 'boolean') {
            errors.push(`[${courseId}:${q.id}] Đáp án đúng/sai phải là boolean.`);
          }
        } else if (q.type === 'output') {
          if (typeof q.answer !== 'string' || !q.answer.trim()) {
            errors.push(`[${courseId}:${q.id}] Đáp án dự đoán kết quả phải là chuỗi khác rỗng.`);
          }
        } else {
          errors.push(`[${courseId}:${q.id}] Loại quiz không hợp lệ: ${q.type}`);
        }
      }

      // Kiểm tra flashcards
      for (const c of mod.cards ?? []) {
        if (cardIds.has(c.id)) errors.push(`[${courseId}] Trùng ID flashcard: ${c.id}`);
        cardIds.add(c.id);
        if (!c.front?.trim() || !c.back?.trim()) {
          errors.push(`[${courseId}:${c.id}] Flashcard bị trống mặt trước hoặc mặt sau.`);
        }
      }

      // Kiểm tra bài thực hành: starter PHẢI CHƯA ĐẠT, solution PHẢI ĐẠT 100%!
      for (const ex of mod.exercises ?? []) {
        if (exIds.has(ex.id)) errors.push(`[${courseId}] Trùng ID bài thực hành: ${ex.id}`);
        exIds.add(ex.id);
        if (exCodes.has(ex.code)) errors.push(`[${courseId}] Trùng mã bài thực hành: ${ex.code}`);
        exCodes.add(ex.code);

        if (ex.ref && !catalogPaths.has(ex.ref)) {
          errors.push(`[${courseId}:${ex.code}] Tham chiếu ref="${ex.ref}" không tồn tại trong catalog.json.`);
        }

        for (const pat of OUTDATED_SOLUTION_PATTERNS) {
          if (pat.re.test(ex.solution)) {
            errors.push(`[${courseId}:${ex.code}] Lời giải mẫu dùng cú pháp cũ (${pat.name}).`);
          }
        }

        if (!ex.webGrade) {
          warnings.push(`[${courseId}:${ex.code}] webGrade=false (bỏ qua kiểm tra trình duyệt).`);
          continue;
        }

        // Nếu bài troubleshoot có diagnosticSampleCommands, mô phỏng chạy chẩn đoán cho solution
        let diagOut = '';
        if (ex.spec.kind === 'troubleshoot' && Array.isArray(ex.spec.diagnosticSampleCommands)) {
          let w = structuredClone(ex.spec.initialState);
          for (const dcmd of ex.spec.diagnosticSampleCommands) {
            const dr = executeDiagnosticCommand(dcmd, w);
            w = dr.nextState;
            diagOut += `$ ${dcmd}\n${dr.stdout}\n${dr.stderr}\n`;
          }
        }

        // 1) Kiểm tra starter PHẢI CHƯA ĐẠT
        const starterRes = gradeDevOpsExercise(ex.starter, ex.spec, '');
        const starterPassedAll =
          !starterRes.import_error &&
          starterRes.tests.length > 0 &&
          starterRes.tests.every((t) => t.status === 'pass');
        if (starterPassedAll) {
          errors.push(`[${courseId}:${ex.code}] Code khởi đầu (starter) đã tự ĐẠT 100% mà chưa cần sửa!`);
        }

        // 2) Kiểm tra solution PHẢI ĐẠT 100%
        const solRes = gradeDevOpsExercise(ex.solution, ex.spec, diagOut);
        if (solRes.import_error) {
          errors.push(`[${courseId}:${ex.code}] Lời giải mẫu (solution) gặp lỗi cú pháp/thực thi: ${solRes.import_error}`);
        } else if (!solRes.tests.length) {
          errors.push(`[${courseId}:${ex.code}] Bài thực hành không sinh ra test kiểm tra nào.`);
        } else {
          const failed = solRes.tests.filter((t) => t.status !== 'pass');
          if (failed.length > 0) {
            errors.push(
              `[${courseId}:${ex.code}] Lời giải mẫu (solution) KHÔNG QUA bộ kiểm tra (${failed.length}/${solRes.tests.length} fail): ` +
                failed.map((f) => `${f.name} [got=${f.got}, expected=${f.expected}]`).join(' | ')
            );
          } else {
            passedExCount++;
          }
        }
      }
    }

    console.log(
      `✔ [doctor:${courseId}] ${cur.modules.length} modules · ${passedExCount} bài thực hành đã verify (starter FAIL & solution PASS 100%) · ${quizIds.size} quizzes · ${cardIds.size} flashcards · ${cat.items.length} real configs`
    );
  }

  console.log(`✔ [doctor:secrets] Đã quét sạch bí mật trên ${scannedFiles} file nguồn.`);

  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (errors.length > 0) {
    console.error(`\n✘ PHÁT HIỆN ${errors.length} LỖI NỘI DUNG:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('\n🎉 course:doctor XANH — Toàn bộ nội dung, lời giải mẫu và kiểm tra đều hợp lệ!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
