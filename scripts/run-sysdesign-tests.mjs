#!/usr/bin/env node
// Chạy mọi test của System Design Mastery (T1.4):
// tự tìm src/features/sysdesign-course/**/__tests__/*.test.ts, bundle bằng esbuild
// (giống run-engine-tests.mjs) và chạy từng file trong tiến trình riêng.
// Mỗi file test tự throw / process.exit(1) khi lỗi. Exit 1 nếu có file lỗi.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEST_ROOTS = [
  path.join(ROOT, 'src/features/sysdesign-course'),
  path.join(ROOT, 'src/components/scale-workbench/live'),
];
const CACHE_DIR = path.join(ROOT, 'node_modules/.cache/sd-tests');

function findTests(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) findTests(full, out);
    else if (/\.test\.ts$/.test(ent.name) && path.basename(dir) === '__tests__') out.push(full);
  }
  return out.sort();
}

async function main() {
  const tests = TEST_ROOTS.flatMap((r) => findTests(r)).sort();
  if (tests.length === 0) {
    console.error('[sd:test] Không tìm thấy file test nào trong src/features/sysdesign-course/**/__tests__/');
    process.exit(1);
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const failed = [];
  for (const file of tests) {
    const name = path.relative(ROOT, file);
    const outfile = path.join(CACHE_DIR, `${name.replace(/[\\/]/g, '__')}.mjs`);
    try {
      await esbuild.build({
        entryPoints: [file],
        bundle: true,
        platform: 'node',
        format: 'esm',
        packages: 'external',
        alias: { '@': path.join(ROOT, 'src') },
        outfile,
        tsconfig: path.join(ROOT, 'tsconfig.json'),
        logLevel: 'silent',
      });
    } catch (err) {
      console.error(`[sd:test] FAIL (bundle) ${name}\n${err.message}`);
      failed.push(name);
      continue;
    }
    const res = spawnSync(process.execPath, [outfile], { stdio: 'inherit', cwd: ROOT });
    fs.rmSync(outfile, { force: true });
    if (res.status === 0) console.log(`[sd:test] PASS ${name}`);
    else {
      console.error(`[sd:test] FAIL ${name} (exit ${res.status ?? res.signal})`);
      failed.push(name);
    }
  }

  console.log(`[sd:test] ${tests.length - failed.length}/${tests.length} file test đạt`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
