import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCatalog, useCurriculum, useReadings } from '../data';
import { CATALOG_STATUS_LABEL, KIND_LABEL, catalogStatus, currentLevel } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import type { CatalogStatus } from '../types';
import { CodeView, Inline } from '../components/Markdown';
import { Btn, Callout, Card, Pill, Spinner, Stars } from '../components/ui';

export const ReadView: React.FC<{ n: number }> = ({ n }) => {
  const { data: cat } = useCatalog();
  const { data: cur } = useCurriculum();
  const { data: code } = useReadings();
  const s = useWpProgress((x) => x.state);
  const setStatus = useWpProgress((x) => x.setCatalogStatus);
  const back = useWpNav((x) => x.back);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState(0);

  if (!cat || !cur) return <Spinner />;
  const it = cat.items.find((i) => i.n === n);
  if (!it) return <div className="p-6 text-slate-400">Không tìm thấy bài #{n}.</div>;

  const st = catalogStatus(s, it.id);
  const myLevel = currentLevel(s, cur);
  const readings = cur.modules.flatMap((m) =>
    m.readings.filter((r) => r.catalogN === it.n || r.path === it.path || r.path.startsWith(it.path + '/')).map((r) => ({ ...r, module: m }))
  );
  const candidates = [...new Set([it.path, ...readings.map((r) => r.path)])].filter((p) => code && p in code);
  const current = candidates[Math.min(tab, candidates.length - 1)];
  const mark = (status: CatalogStatus) => setStatus(it.id, status);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Btn onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Btn>
        <div className="min-w-0">
          <h1 className="break-all text-lg font-bold text-white sm:text-xl">
            <span className="text-slate-500">#{it.n}</span> {it.path}
          </h1>
          <p className="text-sm text-slate-400">
            {cat.categories[it.category]} · cấp tối thiểu {it.level} ({cur.levels[String(it.level)]}) · <Stars n={it.quality} /> · {it.loc} dòng{it.kind === 'project' ? ` · project ${it.files} file` : ''}
          </p>
        </div>
      </div>

      {it.flags.includes('unsafe') && <Callout tone="bad"><b>KHÔNG chạy script này.</b> Nó mang tính tấn công / vi phạm điều khoản dịch vụ. Chỉ đọc để hiểu và nhận diện — xem module M24 để học cách phòng thủ.</Callout>}
      {it.duplicateOf && <Callout tone="warn">Trùng nội dung với: {it.duplicateOf}</Callout>}
      {it.level > myLevel && <Callout tone="warn">Bài này cần cấp {it.level}, bạn đang ở cấp {myLevel}. Đọc được nhưng có thể gặp cú pháp chưa học.</Callout>}

      <div className="flex flex-wrap gap-1.5 text-xs">
        {it.flags.map((f) => (
          <Pill key={f} tone={f === 'unsafe' || f === 'syntax-error' ? 'bad' : 'warn'}>
            {cat.flagLabels[f] ?? f}
          </Pill>
        ))}
        {it.tags.filter((t) => !t.startsWith('mod:')).map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>

      {it.deps.length > 0 && (
        <Callout tone="info">
          Cần thư viện ngoài: <b>{it.pypi.join(', ')}</b>
          {it.kind === 'file' && (
            <div className="mt-1 text-xs">
              Chạy thử trên máy (trong thư mục Python-master): <code className="rounded bg-slate-900 px-1.5 py-0.5">{`uv run ${it.pypi.map((p) => `--with ${p}`).join(' ')} python "${it.path}"`}</code>
            </div>
          )}
        </Callout>
      )}

      <Card className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">
          Trạng thái: <b className="text-slate-100">{CATALOG_STATUS_LABEL[st]}</b>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn onClick={() => mark('reading')}>Đang đọc</Btn>
          <Btn variant="primary" onClick={() => mark('done')}>
            Đã đọc hiểu (+10 XP)
          </Btn>
          <Btn onClick={() => mark('rewritten')}>Đã viết lại (+25 XP)</Btn>
          <Btn onClick={() => mark('skip')}>Bỏ qua</Btn>
        </div>
      </Card>

      {readings.map((r, k) => {
        const kind = KIND_LABEL[r.kind] ?? KIND_LABEL.good;
        return (
          <Card key={k}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${kind.cls}`}>{kind.label}</span>
              từ {r.module.id} · {r.module.title} — <span className="break-all">{r.path}</span>
            </div>
            <p className="mt-2 text-slate-200">
              <Inline text={r.note} />
            </p>
            {r.task && (
              <p className="mt-2 text-slate-200">
                <b>Nhiệm vụ:</b> <Inline text={r.task} />
              </p>
            )}
            {r.answer &&
              (shown[`${k}`] ? (
                <Callout tone="ok" className="mt-2">
                  <b>Đáp án:</b> <Inline text={r.answer} />
                </Callout>
              ) : (
                <Btn className="mt-2" onClick={() => setShown({ ...shown, [`${k}`]: true })}>
                  Xem đáp án
                </Btn>
              ))}
          </Card>
        );
      })}

      <section>
        <h2 className="mb-1 text-base font-semibold text-white">Mã nguồn</h2>
        {!code ? (
          <Spinner />
        ) : current ? (
          <>
            {candidates.length > 1 && (
              <div className="mb-1 flex flex-wrap gap-1.5">
                {candidates.map((p, i) => (
                  <button key={p} onClick={() => setTab(i)} className={`rounded-md border px-2.5 py-1 text-xs ${p === current ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                    {p.replace(it.path + '/', '')}
                  </button>
                ))}
              </div>
            )}
            <CodeView code={code[current]} numbered maxHeight="70vh" />
          </>
        ) : (
          <Callout tone="info">
            File này lớn hoặc là project nhiều file nên không nhúng vào app. Mở trong repo: <code className="break-all">Python-master/{it.path}</code> — hoặc dùng <code>./learn read {it.n} --show</code> bên WorkPath.
          </Callout>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Viết lại bản tốt hơn trong VS Code: <code className="rounded bg-slate-800 px-1">./learn rewrite {it.n}</code> rồi quay lại đánh dấu "Đã viết lại".
        </p>
      </section>
    </div>
  );
};
