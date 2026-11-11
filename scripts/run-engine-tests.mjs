#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const entry = path.join(ROOT, 'src/features/devops-course/engine/__tests__/engine.test.ts');
  const tmpFile = path.join(ROOT, 'node_modules/.cache/agy-engine-test.mjs');
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
    await import(pathToFileURL(tmpFile).href);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
