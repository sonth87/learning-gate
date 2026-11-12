import React from 'react';
import { CheckCircle2, ChevronRight, SkipForward, Undo2 } from 'lucide-react';
import { useCurriculum } from '../data';
import { currentLevel, exStatus, isModuleSkipped, moduleDone, moduleProgress, quizBest } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Bar, Pill, PageHeader, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';

export const RoadmapView: React.FC = () => {
  const { data: cur } = useCurriculum();
  const s = useWpProgress((x) => x.state);
  const toggleSkipModule = useWpProgress((x) => x.toggleSkipModule);
  const skipModulesBatch = useWpProgress((x) => x.skipModulesBatch);
  const go = useWpNav((x) => x.go);
  if (!cur) return <Spinner />;
  const current = currentLevel(s, cur);
  const levels = [...new Set(cur.modules.map((m) => m.level))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Lộ trình học"
        sub={`${cur.modules.length} module · ${cur.modules.reduce((n, m) => n + m.exercises.length, 0)} bài tập có test thật. Mỗi module = lesson → quiz (≥ ${Math.round(cur.passQuiz * 100)}%) → bài tập. Bạn có thể nhảy cóc hoặc đánh dấu bỏ qua phần đã nắm vững.`}
      />
      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = cur.modules.filter((m) => m.level === lv);
          const ex = mods.reduce((n, m) => n + m.exercises.length, 0);
          const uncompletedMods = mods.filter((m) => !moduleDone(s, m, cur.passQuiz));
          const skippedModsInLevel = mods.filter((m) => isModuleSkipped(s, m.id));
          return (
            <section key={lv} aria-labelledby={`lv-${lv}`}>
              <div className={cn('mb-2 flex flex-wrap items-center gap-2 rounded-lg border-l-4 bg-slate-900/70 px-3 py-2', lv === current ? 'border-emerald-500' : 'border-slate-700')}>
                <h2 id={`lv-${lv}`} className="text-base font-semibold text-white">
                  Cấp {lv} · {cur.levels[String(lv)]}
                </h2>
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <div className="ml-auto flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-normal text-slate-500">
                    {mods.length} module · {ex} bài tập
                  </span>
                  {uncompletedMods.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => skipModulesBatch(uncompletedMods.map((m) => m.id), true)}
                      title={`Đánh dấu bỏ qua toàn bộ ${uncompletedMods.length} module chưa học ở Cấp ${lv}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>Bỏ qua cấp {lv}</span>
                    </button>
                  ) : skippedModsInLevel.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => skipModulesBatch(skippedModsInLevel.map((m) => m.id), false)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 cursor-pointer"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Khôi phục cấp {lv}</span>
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = moduleProgress(s, m, cur.passQuiz);
                  const complete = moduleDone(s, m, cur.passQuiz);
                  const skipped = isModuleSkipped(s, m.id);
                  const passed = m.exercises.filter((e) => exStatus(s, e.id) === 'passed').length;
                  return (
                    <div
                      key={m.id}
                      className={cn('group flex flex-col justify-between rounded-xl border bg-slate-900/70 p-3.5 transition-colors hover:border-emerald-500/60 hover:bg-slate-800/80', lv === current && !complete ? 'border-emerald-500/40' : 'border-slate-800')}
                    >
                      <button
                        type="button"
                        onClick={() => go({ name: 'module', id: m.id })}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-emerald-400">{m.id}</span>
                          {skipped ? (
                            <Pill tone="info">đã bỏ qua</Pill>
                          ) : complete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Đã hoàn thành" />
                          ) : d > 0 ? (
                            <Pill tone="warn">đang học</Pill>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400" aria-hidden="true" />
                          )}
                        </div>
                        <div className="mt-1 font-medium text-slate-100">{m.title}</div>
                      </button>
                      <div>
                        <Bar value={d / t} className="mt-2.5" />
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>
                            {passed}/{m.exercises.length} bài tập · quiz {quizBest(s, m.id) ? `${Math.round(quizBest(s, m.id) * 100)}%` : '—'}
                          </span>
                          {(!complete || skipped) && (
                            <button
                              type="button"
                              onClick={() => toggleSkipModule(m.id)}
                              className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:border-slate-500 hover:text-white cursor-pointer"
                            >
                              {skipped ? <Undo2 className="h-2.5 w-2.5" /> : <SkipForward className="h-2.5 w-2.5" />}
                              <span>{skipped ? 'Hoàn tác' : 'Bỏ qua'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
