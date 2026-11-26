#!/usr/bin/env node
// Nhập nguồn SDC (T1.5): tải content/phases/** của steve-bang/systemdesigncore tại commit cố định
// vào content/sysdesign/_source/sdc/ (giữ đường dẫn con phase-N/...) + manifest.json.
// Bản gốc chỉ đọc, KHÔNG vào bundle (build-sysdesign bỏ qua _source/). Xem docs/sysdesign/01 §1.3, 07 §4.
//
// Dùng: node scripts/import-sdc.mjs [--commit <sha>]
// Chạy lại cho kết quả giống hệt: file đã đúng blob sha thì không tải lại, fetchedAt giữ nguyên.
// Request chỉ gồm URL công khai + User-Agent chung chung; không gửi thông tin cá nhân.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'content', 'sysdesign', '_source', 'sdc');
const REPO = 'steve-bang/systemdesigncore';
const DEFAULT_COMMIT = 'fe4234da7d6fe719e8e18547856fc0a730155420';
const PREFIX = 'content/phases/';
const HEADERS = { 'User-Agent': 'sdc-source-importer', Accept: 'application/vnd.github+json' };

const argIdx = process.argv.indexOf('--commit');
const COMMIT = argIdx > -1 ? process.argv[argIdx + 1] : DEFAULT_COMMIT;
if (!/^[0-9a-f]{40}$/.test(COMMIT)) {
  console.error('[import-sdc] --commit phải là sha 40 ký tự');
  process.exit(1);
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const blobSha = (buf) =>
  crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function getBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const tree = await getJson(`https://api.github.com/repos/${REPO}/git/trees/${COMMIT}?recursive=1`);
  if (tree.truncated) throw new Error('Cây thư mục bị cắt bớt (truncated); không thể nhập đủ');
  const entries = tree.tree
    .filter((e) => e.type === 'blob' && e.path.startsWith(PREFIX))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
  if (entries.length === 0) throw new Error(`Không có file nào dưới ${PREFIX} tại ${COMMIT}`);

  const manifestPath = path.join(OUT, 'manifest.json');
  const previous = new Map();
  if (fs.existsSync(manifestPath)) {
    try {
      for (const f of JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files ?? []) previous.set(f.path, f);
    } catch {
      /* manifest hỏng: coi như chưa có */
    }
  }

  const files = [];
  let downloaded = 0;
  for (const e of entries) {
    const local = path.join(OUT, e.path.slice(PREFIX.length));
    const url = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/${e.path}`;
    let buf = fs.existsSync(local) ? fs.readFileSync(local) : null;
    if (!buf || blobSha(buf) !== e.sha) {
      buf = await getBuffer(url);
      if (blobSha(buf) !== e.sha) throw new Error(`Blob sha không khớp cho ${e.path} (tải về bị lỗi?)`);
      fs.mkdirSync(path.dirname(local), { recursive: true });
      fs.writeFileSync(local, buf);
      downloaded++;
    }
    const digest = sha256(buf);
    const prev = previous.get(e.path);
    files.push({
      path: e.path,
      sha: COMMIT,
      blobSha: e.sha,
      url,
      bytes: buf.length,
      sha256: digest,
      fetchedAt: prev && prev.sha256 === digest && prev.sha === COMMIT ? prev.fetchedAt : today(),
    });
  }

  // Xoá file thừa không còn trong cây ở commit này
  const keep = new Set(entries.map((e) => path.resolve(OUT, e.path.slice(PREFIX.length))));
  const stale = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name !== 'manifest.json' && !keep.has(path.resolve(p))) stale.push(p);
    }
  };
  walk(OUT);
  for (const p of stale) fs.rmSync(p);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify({ repo: REPO, commit: COMMIT, files }, null, 2) + '\n');
  console.log(
    `[import-sdc] ${files.length} file (${downloaded} tải mới, ${stale.length} xoá thừa) từ ${REPO}@${COMMIT.slice(0, 8)} → content/sysdesign/_source/sdc/`
  );
}

main().catch((err) => {
  console.error(`[import-sdc] ${err.message}`);
  process.exit(1);
});
