import React from 'react';
import { ArrowLeft, CheckCircle2, Keyboard, Layers, ListChecks } from 'lucide-react';
import { useCatalog, useCurriculum } from '../data';
import { CATALOG_STATUS_LABEL, KIND_LABEL, catalogStatus, exStatus, lessonRead, moduleProgress, quizBest } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Markdown, Inline } from '../components/Markdown';
import { Bar, Btn, Card, Pill, Spinner, Stars } from '../components/ui';

export const ModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { data: cur } = useCurriculum();
  const { data: cat } = useCatalog();
  const s = useWpProgress((x) => x.state);
  const markRead = useWpProgress((x) => x.markLessonRead);
  const { go, back } = useWpNav();
  if (!cur) return <Spinner />;
  const m = cur.modules.find((x) => x.id === id);
  if (!m) return <div className="p-6 text-slate-400">Không có module {id}.</div>;
  const [d, t] = moduleProgress(s, m, cur.passQuiz);
  const read = lessonRead(s, m.id);
  const best = quizBest(s, m.id);

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Btn onClick={back} aria-label="Quay lại">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Btn>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">
            Cấp {m.level} · {cur.levels[String(m.level)]}
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            <span className="font-mono text-emerald-400">{m.id}</span> · {m.title}
          </h1>
        </div>
        <div className="ml-auto w-40">
          <Bar value={d / t} />
          <div className="mt-1 text-right text-xs text-slate-500">
            {d}/{t} mục
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <Markdown source={m.lesson} />
          <div className="mt-6 border-t border-slate-800 pt-4">
            {read ? (
              <Pill tone="ok">✔ Bạn đã đọc lesson này</Pill>
            ) : (
              <Btn variant="primary" onClick={() => markRead(m.id)}>
                <CheckCircle2 className="h-4 w-4" /> Tôi đã đọc xong lesson này (+20 XP)
              </Btn>
            )}
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">Luyện tập module này</h2>
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}>
                <ListChecks className="h-4 w-4" /> Quiz ({m.quiz.length} câu)
              </Btn>
              <Btn onClick={() => go({ name: 'flash', moduleId: m.id })}>
                <Layers className="h-4 w-4" /> Flashcard ({m.cards.length})
              </Btn>
              {m.drills.length > 0 && (
                <Btn onClick={() => go({ name: 'drill', moduleId: m.id })}>
                  <Keyboard className="h-4 w-4" /> Luyện gõ
                </Btn>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Quiz tốt nhất: {best ? `${Math.round(best * 100)}%` : 'chưa làm'} · cần ≥ {Math.round(cur.passQuiz * 100)}% để qua
            </p>
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-white">Bài tập ({m.exercises.length})</h2>
            <div className="space-y-2">
              {m.exercises.map((e) => {
                const st = exStatus(s, e.id);
                return (
                  <button key={e.id} onClick={() => go({ name: 'exercise', code: e.code })} className="block w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition-colors hover:border-emerald-500/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100">
                        <span className="mr-1.5 font-mono text-emerald-400">{e.code}</span>
                        {e.title}
                      </span>
                      <Pill tone={st === 'passed' ? 'ok' : st === 'started' ? 'warn' : 'neutral'}>{st === 'passed' ? 'đạt' : st === 'started' ? 'đang làm' : 'chưa làm'}</Pill>
                    </div>
                    <div className="mt-1 text-xs">
                      <Stars n={e.difficulty} />
                      {!e.webGrade && <span className="ml-2 text-amber-400">chấm bằng WorkPath</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {m.readings.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">Đọc code thật trong Python-master</h2>
              <div className="space-y-2">
                {m.readings.map((r) => {
                  const item = cat?.items.find((i) => i.n === r.catalogN);
                  const k = KIND_LABEL[r.kind] ?? KIND_LABEL.good;
                  const st = item ? catalogStatus(s, item.id) : 'todo';
                  return (
                    <button
                      key={r.path}
                      disabled={!item}
                      onClick={() => item && go({ name: 'read', n: item.n })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition-colors hover:border-sky-500/60 disabled:cursor-default"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${k.cls}`}>{k.label}</span>
                        <span className="break-all text-sm font-medium text-sky-300">{r.path}</span>
                        {st !== 'todo' && <Pill>{CATALOG_STATUS_LABEL[st]}</Pill>}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        <Inline text={r.note} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
