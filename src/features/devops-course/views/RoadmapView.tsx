import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useCourseCurriculum } from '../data';
import {
  courseCurrentLevel,
  courseModuleDone,
  courseModuleProgress,
  exStatus,
  quizBest,
  sortedModules,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { PageHeader, Pill, Spinner } from '@/features/workpath/components/ui';
import { CourseBar } from '../components/CourseUi';
import { cn } from '@/utils/cn';

export const RoadmapView: React.FC = () => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const go = COURSE_NAV_STORES[courseId]((x) => x.go);

  if (!cur) return <Spinner />;
  const ordered = sortedModules(cur);
  const current = courseCurrentLevel(s, cur);
  const levels = [...new Set(ordered.map((m) => m.level))].sort((a, b) => a - b);

  const lvBorder = accent === 'cyan' ? 'border-cyan-500' : 'border-sky-500';
  const cardActive = accent === 'cyan' ? 'border-cyan-500/40 hover:border-cyan-500/70' : 'border-sky-500/40 hover:border-sky-500/70';
  const cardHover = accent === 'cyan' ? 'hover:border-cyan-500/60' : 'hover:border-sky-500/60';
  const codeTone = accent === 'cyan' ? 'text-cyan-400' : 'text-sky-400';

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Lộ trình học"
        sub={`${ordered.length} module · ${ordered.reduce((n, m) => n + m.exercises.length, 0)} bài thực hành kiểm tra thật trong trình duyệt. Mỗi module = lesson → quiz (≥ ${Math.round(cur.passQuiz * 100)}%) → bài thực hành → đọc cấu hình thật.`}
      />
      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = ordered.filter((m) => m.level === lv);
          const exCount = mods.reduce((n, m) => n + m.exercises.length, 0);
          return (
            <section key={lv} aria-labelledby={`lv-${lv}`}>
              <h2
                id={`lv-${lv}`}
                className={cn(
                  'mb-2 flex flex-wrap items-center gap-2 rounded-lg border-l-4 bg-slate-900/70 px-3 py-2 text-base font-semibold text-white',
                  lv === current ? lvBorder : 'border-slate-700'
                )}
              >
                Cấp {lv} · {cur.levels[String(lv)]}
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <span className="ml-auto text-xs font-normal text-slate-500">
                  {mods.length} module · {exCount} bài thực hành
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = courseModuleProgress(s, m, cur.passQuiz);
                  const complete = courseModuleDone(s, m, cur.passQuiz);
                  const passed = m.exercises.filter((e) => exStatus(s, e.id) === 'passed').length;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => go({ name: 'module', id: m.id })}
                      className={cn(
                        'group min-h-[96px] rounded-xl border bg-slate-900/70 p-3.5 text-left transition-colors hover:bg-slate-800/80 cursor-pointer',
                        lv === current && !complete ? cardActive : cn('border-slate-800', cardHover)
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('font-mono text-sm font-bold', codeTone)}>{m.id}</span>
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Đã hoàn thành" />
                        ) : d > 0 ? (
                          <Pill tone="warn">đang học</Pill>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300" aria-hidden="true" />
                        )}
                      </div>
                      <div className="mt-1 font-medium text-slate-100">{m.title}</div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{m.summary}</p>
                      <CourseBar value={t ? d / t : 0} accent={accent} className="mt-2.5" />
                      <div className="mt-2 text-xs text-slate-500">
                        {passed}/{m.exercises.length} bài thực hành · quiz{' '}
                        {quizBest(s, m.id) ? `${Math.round(quizBest(s, m.id) * 100)}%` : '—'}
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
