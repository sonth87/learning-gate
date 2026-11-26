import React from 'react';
import { CheckCircle2, ChevronRight, SkipForward, Undo2 } from 'lucide-react';
import { useSdCurriculum } from '../data';
import { isModuleSkipped, quizBest, sdCurrentLevel, sdModuleDone, sdModuleProgress, sortedSdModules } from '../logic';
import { useSdNav, useSdProgress } from '../store';
import { CourseBar } from '@/features/devops-course/components/CourseUi';
import { PageHeader, Pill, Spinner } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

export const SdRoadmapView: React.FC = () => {
  const { data: cur } = useSdCurriculum();
  const s = useSdProgress((x) => x.state);
  const toggleSkipModule = useSdProgress((x) => x.toggleSkipModule);
  const skipModulesBatch = useSdProgress((x) => x.skipModulesBatch);
  const go = useSdNav((x) => x.go);

  if (!cur) return <Spinner />;
  const ordered = sortedSdModules(cur);
  const current = sdCurrentLevel(s, cur);
  const levels = [...new Set(ordered.map((m) => m.level))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Lộ trình System Design"
        sub={`${ordered.length} bài, sắp xếp theo (cấp, thứ tự). Mỗi bài có phần đọc, quiz và flashcard.`}
      />

      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = ordered.filter((m) => m.level === lv);
          const quizCount = mods.reduce((n, m) => n + m.quiz.length, 0);
          const uncompleted = mods.filter((m) => !sdModuleDone(s, m, cur.passQuiz));
          const skippedInLevel = mods.filter((m) => isModuleSkipped(s, m.id));

          return (
            <section key={lv} aria-labelledby={`sd-lv-${lv}`}>
              <div
                className={cn(
                  'mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border-l-4 bg-slate-900/80 px-3.5 py-2.5',
                  lv === current ? 'border-cyan-500' : 'border-slate-700'
                )}
              >
                <h2 id={`sd-lv-${lv}`} className="text-base font-bold text-white">
                  Cấp {lv} · {cur.levels[String(lv)]}
                </h2>
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <div className="ml-auto flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs text-slate-400">
                    {mods.length} bài · {quizCount} câu quiz
                  </span>
                  {uncompleted.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          uncompleted.map((m) => m.id),
                          true
                        )
                      }
                      title={`Bỏ qua ${uncompleted.length} bài chưa hoàn thành ở cấp ${lv}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>Bỏ qua cấp {lv}</span>
                    </button>
                  ) : skippedInLevel.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          skippedInLevel.map((m) => m.id),
                          false
                        )
                      }
                      title={`Khôi phục ${skippedInLevel.length} bài đã bỏ qua ở cấp ${lv}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Khôi phục cấp {lv}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = sdModuleProgress(s, m, cur.passQuiz);
                  const complete = sdModuleDone(s, m, cur.passQuiz);
                  const skipped = isModuleSkipped(s, m.id);
                  const best = quizBest(s, m.id);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'group flex min-h-[142px] flex-col justify-between rounded-xl border bg-slate-900/75 p-3.5 transition-colors hover:bg-slate-800/80',
                        lv === current && !complete
                          ? 'border-cyan-500/40 hover:border-cyan-500/70'
                          : 'border-slate-800 hover:border-cyan-500/60'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => go({ name: 'module', id: m.id })}
                        className="w-full cursor-pointer text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-extrabold text-cyan-400">{m.id}</span>
                          {skipped ? (
                            <Pill tone="info">đã bỏ qua</Pill>
                          ) : complete ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Đã hoàn thành" />
                          ) : d > 0 ? (
                            <Pill tone="warn">đang học</Pill>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300" aria-hidden="true" />
                          )}
                        </div>
                        <div className="mt-1.5 font-semibold leading-snug text-slate-100">{m.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{m.summary}</p>
                      </button>

                      <div className="mt-3">
                        <CourseBar value={t ? d / t : 0} accent="cyan" />
                        <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-500">
                          <span>quiz {best ? `${Math.round(best * 100)}%` : '—'}</span>
                          {(!complete || skipped) && (
                            <button
                              type="button"
                              onClick={() => toggleSkipModule(m.id)}
                              title={skipped ? 'Hoàn tác bỏ qua bài này' : 'Đã biết, bỏ qua bài này'}
                              className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-700/80 bg-slate-950/70 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 hover:border-slate-500 hover:text-white"
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
