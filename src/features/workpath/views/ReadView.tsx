import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCatalog, useCurriculum, useReadings } from '../data';
import { CATALOG_STATUS_LABEL, KIND_LABEL, catalogStatus, currentLevel } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import type { CatalogStatus } from '../types';
import { CodeView, Inline } from '../components/Markdown';
import { Btn, Callout, Card, Pill, Spinner, Stars } from '../components/ui';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useCourseEnOverlay } from '@/data/i18n/loader';

const CATALOG_STATUS_EN: Record<CatalogStatus, string> = {
  todo: 'unread',
  reading: 'reading',
  done: 'understood',
  rewritten: 'rewritten',
  skip: 'skipped',
};

const KIND_EN: Record<string, string> = {
  good: 'READ SAMPLE',
  bug: 'FIND BUG',
  compare: 'COMPARE',
  outdated: 'LEGACY CODE',
  project: 'PROJECT',
  security: 'IDENTIFY',
};

export const ReadView: React.FC<{ n: number }> = ({ n }) => {
  const { data: cat } = useCatalog();
  const { data: cur } = useCurriculum();
  const { data: code } = useReadings();
  const s = useWpProgress((x) => x.state);
  const setStatus = useWpProgress((x) => x.setCatalogStatus);
  const back = useWpNav((x) => x.back);
  const lang = useWorkbenchStore((x) => x.language);
  const enOverlay = useCourseEnOverlay('python');
  const isEn = lang === 'en';
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState(0);

  if (!cat || !cur) return <Spinner />;
  const it = cat.items.find((i) => i.n === n);
  if (!it) return <div className="p-6 text-slate-400">{isEn ? `Item #${n} not found.` : `Không tìm thấy bài #${n}.`}</div>;

  const st = catalogStatus(s, it.id);
  const myLevel = currentLevel(s, cur);
  const readings = cur.modules.flatMap((m) =>
    m.readings
      .map((r, rIdx) => ({ ...r, rIdx, module: m }))
      .filter((r) => r.catalogN === it.n || r.path === it.path || r.path.startsWith(it.path + '/'))
  );
  const candidates = [...new Set([it.path, ...readings.map((r) => r.path)])].filter((p) => code && p in code);
  const current = candidates[Math.min(tab, candidates.length - 1)];
  const mark = (status: CatalogStatus) => setStatus(it.id, status);
  const levelName = isEn ? (enOverlay?.levels?.[String(it.level)] ?? cur.levels[String(it.level)]) : cur.levels[String(it.level)];

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Btn onClick={back}>
          <ArrowLeft className="h-4 w-4" /> {isEn ? 'Back' : 'Quay lại'}
        </Btn>
        <div className="min-w-0">
          <h1 className="break-all text-lg font-bold text-white sm:text-xl">
            <span className="text-slate-500">#{it.n}</span> {it.path}
          </h1>
          <p className="text-sm text-slate-400">
            {cat.categories[it.category]} · {isEn ? `min level ${it.level}` : `cấp tối thiểu ${it.level}`} ({levelName}) · <Stars n={it.quality} /> · {it.loc}{' '}
            {isEn ? 'lines' : 'dòng'}
            {it.kind === 'project' ? (isEn ? ` · project (${it.files} files)` : ` · project ${it.files} file`) : ''}
          </p>
        </div>
      </div>

      {it.flags.includes('unsafe') && (
        <Callout tone="bad">
          {isEn ? (
            <>
              <b>DO NOT run this script.</b> It is offensive / violates terms of service. Read only to understand and recognize it — see module M24 to learn how to defend.
            </>
          ) : (
            <>
              <b>KHÔNG chạy script này.</b> Nó mang tính tấn công / vi phạm điều khoản dịch vụ. Chỉ đọc để hiểu và nhận diện — xem module M24 để học cách phòng thủ.
            </>
          )}
        </Callout>
      )}
      {it.duplicateOf && (
        <Callout tone="warn">
          {isEn ? 'Duplicate content with:' : 'Trùng nội dung với:'} {it.duplicateOf}
        </Callout>
      )}
      {it.level > myLevel && (
        <Callout tone="warn">
          {isEn
            ? `This item requires level ${it.level}, and you are at level ${myLevel}. You can read it, though you may encounter unfamiliar syntax.`
            : `Bài này cần cấp ${it.level}, bạn đang ở cấp ${myLevel}. Đọc được nhưng có thể gặp cú pháp chưa học.`}
        </Callout>
      )}

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
          {isEn ? 'Requires external packages:' : 'Cần thư viện ngoài:'} <b>{it.pypi.join(', ')}</b>
          {it.kind === 'file' && (
            <div className="mt-1 text-xs">
              {isEn ? 'Run locally (inside Python-master folder):' : 'Chạy thử trên máy (trong thư mục Python-master):'}{' '}
              <code className="rounded bg-slate-900 px-1.5 py-0.5">{`uv run ${it.pypi.map((p) => `--with ${p}`).join(' ')} python "${it.path}"`}</code>
            </div>
          )}
        </Callout>
      )}

      <Card className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">
          {isEn ? 'Status:' : 'Trạng thái:'} <b className="text-slate-100">{isEn ? CATALOG_STATUS_EN[st] : CATALOG_STATUS_LABEL[st]}</b>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Btn onClick={() => mark('reading')}>{isEn ? 'Reading' : 'Đang đọc'}</Btn>
          <Btn variant="primary" onClick={() => mark('done')}>
            {isEn ? 'Understood (+10 XP)' : 'Đã đọc hiểu (+10 XP)'}
          </Btn>
          <Btn onClick={() => mark('rewritten')}>{isEn ? 'Rewritten (+25 XP)' : 'Đã viết lại (+25 XP)'}</Btn>
          <Btn onClick={() => mark('skip')}>{isEn ? 'Skip' : 'Bỏ qua'}</Btn>
        </div>
      </Card>

      {readings.map((r, k) => {
        const kind = KIND_LABEL[r.kind] ?? KIND_LABEL.good;
        const kindLabel = isEn ? (KIND_EN[r.kind] ?? kind.label) : kind.label;
        const modTitle = isEn ? (enOverlay?.modules?.[r.module.id]?.titleEn ?? r.module.title) : r.module.title;
        const rOverlay = isEn ? enOverlay?.modules?.[r.module.id]?.readings?.[r.rIdx] : undefined;
        const rNote = rOverlay?.noteEn ?? r.note;
        const rTask = rOverlay?.taskEn ?? r.task;
        const rAnswer = rOverlay?.answerEn ?? r.answer;
        return (
          <Card key={k}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${kind.cls}`}>{kindLabel}</span>
              {isEn ? 'from' : 'từ'} {r.module.id} · {modTitle} — <span className="break-all">{r.path}</span>
            </div>
            <p className="mt-2 text-slate-200">
              <Inline text={rNote} />
            </p>
            {rTask && (
              <p className="mt-2 text-slate-200">
                <b>{isEn ? 'Task:' : 'Nhiệm vụ:'}</b> <Inline text={rTask} />
              </p>
            )}
            {rAnswer &&
              (shown[`${k}`] ? (
                <Callout tone="ok" className="mt-2">
                  <b>{isEn ? 'Answer:' : 'Đáp án:'}</b> <Inline text={rAnswer} />
                </Callout>
              ) : (
                <Btn className="mt-2" onClick={() => setShown({ ...shown, [`${k}`]: true })}>
                  {isEn ? 'Show answer' : 'Xem đáp án'}
                </Btn>
              ))}
          </Card>
        );
      })}

      <section>
        <h2 className="mb-1 text-base font-semibold text-white">{isEn ? 'Source code' : 'Mã nguồn'}</h2>
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
            {isEn ? (
              <>
                This file is large or a multi-file project, so it is not embedded in the app. Open it in the repo: <code className="break-all">Python-master/{it.path}</code> — or run <code>./learn read {it.n} --show</code> in WorkPath.
              </>
            ) : (
              <>
                File này lớn hoặc là project nhiều file nên không nhúng vào app. Mở trong repo: <code className="break-all">Python-master/{it.path}</code> — hoặc dùng <code>./learn read {it.n} --show</code> bên WorkPath.
              </>
            )}
          </Callout>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {isEn ? (
            <>
              Rewrite a cleaner version in VS Code: <code className="rounded bg-slate-800 px-1">./learn rewrite {it.n}</code> then come back and mark &ldquo;Rewritten&rdquo;.
            </>
          ) : (
            <>
              Viết lại bản tốt hơn trong VS Code: <code className="rounded bg-slate-800 px-1">./learn rewrite {it.n}</code> rồi quay lại đánh dấu &ldquo;Đã viết lại&rdquo;.
            </>
          )}
        </p>
      </section>
    </div>
  );
};
