import React from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  Container,
  ShieldCheck,
  SkipForward,
  Undo2,
  Workflow,
} from 'lucide-react';
import { useCourseCurriculum } from '../data';
import {
  courseCurrentLevel,
  courseModuleDone,
  courseModuleProgress,
  exStatus,
  isModuleSkipped,
  quizBest,
  sortedModules,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { PageHeader, Pill, Spinner } from '@/features/workpath/components/ui';
import { CourseBar } from '../components/CourseUi';
import { cn } from '@/utils/cn';

function getDomainChip(moduleId: string) {
  const num = parseInt(moduleId.slice(1), 10);
  if (moduleId.startsWith('K')) {
    if (num <= 6) {
      return {
        label: 'Docker',
        cls: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
        icon: <Container className="h-3 w-3" aria-hidden="true" />,
      };
    }
    return {
      label: 'Kubernetes',
      cls: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300',
      icon: <Boxes className="h-3 w-3" aria-hidden="true" />,
    };
  }
  if (num <= 9) {
    return {
      label: 'CI Pipeline',
      cls: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
      icon: <Workflow className="h-3 w-3" aria-hidden="true" />,
    };
  }
  return {
    label: 'DevSecOps & CD',
    cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    icon: <ShieldCheck className="h-3 w-3" aria-hidden="true" />,
  };
}

export const RoadmapView: React.FC = () => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const toggleSkipModule = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipModule);
  const skipModulesBatch = COURSE_PROGRESS_STORES[courseId]((x) => x.skipModulesBatch);
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
        title="Lộ trình cẩm nang trực quan"
        sub={`${ordered.length} module lý thuyết trực quan (sơ đồ luồng, phân tầng, bảng tra cứu, bẫy & mẹo thực chiến) · ${ordered.reduce((n, m) => n + m.exercises.length, 0)} bài thực hành chấm AST/mô phỏng thật.`}
      />
      <div className="space-y-6">
        {levels.map((lv) => {
          const mods = ordered.filter((m) => m.level === lv);
          const exCount = mods.reduce((n, m) => n + m.exercises.length, 0);
          const uncompletedMods = mods.filter((m) => !courseModuleDone(s, m, cur.passQuiz));
          const skippedModsInLevel = mods.filter((m) => isModuleSkipped(s, m.id));
          return (
            <section key={lv} aria-labelledby={`lv-${lv}`}>
              <div
                className={cn(
                  'mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border-l-4 bg-slate-900/80 px-3.5 py-2.5',
                  lv === current ? lvBorder : 'border-slate-700'
                )}
              >
                <h2 id={`lv-${lv}`} className="text-base font-bold text-white">
                  Cấp {lv} · {cur.levels[String(lv)]}
                </h2>
                {lv === current && <Pill tone="ok">bạn đang ở đây</Pill>}
                <div className="ml-auto flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-normal text-slate-400">
                    {mods.length} module · {exCount} bài thực hành
                  </span>
                  {uncompletedMods.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          uncompletedMods.map((m) => m.id),
                          true
                        )
                      }
                      title={`Đánh dấu bỏ qua toàn bộ ${uncompletedMods.length} module chưa học ở Cấp ${lv}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>Bỏ qua cấp {lv}</span>
                    </button>
                  ) : skippedModsInLevel.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        skipModulesBatch(
                          skippedModsInLevel.map((m) => m.id),
                          false
                        )
                      }
                      title={`Khôi phục ${skippedModsInLevel.length} module đã bỏ qua ở Cấp ${lv}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300 transition-colors hover:bg-sky-500/20 cursor-pointer"
                    >
                      <Undo2 className="h-3 w-3" />
                      <span>Khôi phục cấp {lv}</span>
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mods.map((m) => {
                  const [d, t] = courseModuleProgress(s, m, cur.passQuiz);
                  const complete = courseModuleDone(s, m, cur.passQuiz);
                  const skipped = isModuleSkipped(s, m.id);
                  const passed = m.exercises.filter((e) => exStatus(s, e.id) === 'passed').length;
                  const chip = getDomainChip(m.id);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'group flex min-h-[124px] flex-col justify-between rounded-xl border bg-slate-900/75 p-3.5 transition-colors hover:bg-slate-800/80',
                        lv === current && !complete ? cardActive : cn('border-slate-800', cardHover)
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => go({ name: 'module', id: m.id })}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('font-mono text-sm font-extrabold', codeTone)}>{m.id}</span>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[10px] font-bold',
                                chip.cls
                              )}
                            >
                              {chip.icon}
                              <span>{chip.label}</span>
                            </span>
                          </div>
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
                        <div className="mt-1.5 font-semibold text-slate-100 leading-snug">{m.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400 leading-relaxed">{m.summary}</p>
                      </button>

                      <div className="mt-3">
                        <CourseBar value={t ? d / t : 0} accent={accent} />
                        <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-500">
                          <span>
                            {passed}/{m.exercises.length} thực hành · quiz{' '}
                            {quizBest(s, m.id) ? `${Math.round(quizBest(s, m.id) * 100)}%` : '—'}
                          </span>
                          {(!complete || skipped) && (
                            <button
                              type="button"
                              onClick={() => toggleSkipModule(m.id)}
                              title={skipped ? 'Hoàn tác bỏ qua module này' : 'Đã biết — Bỏ qua module này'}
                              className="inline-flex items-center gap-1 rounded border border-slate-700/80 bg-slate-950/70 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 hover:border-slate-500 hover:text-white cursor-pointer"
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
