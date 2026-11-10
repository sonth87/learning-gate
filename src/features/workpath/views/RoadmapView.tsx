import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useCurriculum } from '../data';
import { currentLevel, exStatus, moduleDone, moduleProgress, quizBest } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Bar, Pill, PageHeader, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';

export const RoadmapView: React.FC = () => {
  const { data: cur } = useCurriculum();
  const s = useWpProgress((x) => x.state);
  const go = useWpNav((x) => x.go);
  if (!cur) return <Spinner />;
  const current = currentLevel(s, cur);
  const levels = [...new Set(cur.modules.map((m) => m.level))].sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Lộ trình học"
        sub={`${cur.modules.length} module · ${cur.modules.reduce((n, m) => n + m.exercises.length, 0)} bài tập có test thật. Mỗi module = lesson → quiz (≥ ${Math.round(cur.passQuiz * 100)}%) → bài tập. Bạn có thể nhảy cóc tới bất kỳ module nào.`}
      />
      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = cur.modules.filter((m) => m.level === lv);
          const ex = mods.reduce((n, m) => n + m.exercises.length, 0);
          return (
            <section key={lv} aria-labelledby={`lv-${lv}`}>
              <h2 id={`lv-${lv}`} className={cn('mb-2 flex flex-wrap items-center gap-2 rounded-lg border-l-4 bg-slate-900/70 px-3 py-2 text-base font-semibold text-white', lv === current ? 'border-emerald-500' : 'border-slate-700')}>
                Cấp {lv} · {cur.levels[String(lv)]}
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <span className="ml-auto text-xs font-normal text-slate-500">
                  {mods.length} module · {ex} bài tập
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = moduleProgress(s, m, cur.passQuiz);
                  const complete = moduleDone(s, m, cur.passQuiz);
                  const passed = m.exercises.filter((e) => exStatus(s, e.id) === 'passed').length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => go({ name: 'module', id: m.id })}
                      className={cn('group rounded-xl border bg-slate-900/70 p-3.5 text-left transition-colors hover:border-emerald-500/60 hover:bg-slate-800/80', lv === current && !complete ? 'border-emerald-500/40' : 'border-slate-800')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-400">{m.id}</span>
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Đã hoàn thành" />
                        ) : d > 0 ? (
                          <Pill tone="warn">đang học</Pill>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="mt-1 font-medium text-slate-100">{m.title}</div>
                      <Bar value={d / t} className="mt-2.5" />
                      <div className="mt-2 text-xs text-slate-500">
                        {passed}/{m.exercises.length} bài tập · quiz {quizBest(s, m.id) ? `${Math.round(quizBest(s, m.id) * 100)}%` : '—'}
                      </div>
                    </button>
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
