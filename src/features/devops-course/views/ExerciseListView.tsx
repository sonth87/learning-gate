import React from 'react';
import { SkipForward, Undo2 } from 'lucide-react';
import { useCourseCurriculum } from '../data';
import { exStatus, sortedModules } from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import type { ExerciseStatus } from '@/features/workpath/types';
import { PageHeader, Pill, Spinner, Stars } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

const FILTERS: { id: ExerciseStatus | undefined; label: string }[] = [
  { id: undefined, label: 'Tất cả' },
  { id: 'started', label: 'Đang làm' },
  { id: 'todo', label: 'Chưa làm' },
  { id: 'passed', label: 'Đã đạt' },
  { id: 'skipped', label: 'Đã bỏ qua' },
];

const KIND_SHORT: Record<string, string> = {
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  dockerignore: '.dockerignore',
  cli: 'CLI',
  troubleshoot: 'Debug',
};

export const ExerciseListView: React.FC<{ moduleId?: string; status?: ExerciseStatus }> = ({ moduleId, status }) => {
  const { courseId, accent } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const toggleSkipEx = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipExercise);
  const go = COURSE_NAV_STORES[courseId]((x) => x.go);

  if (!cur) return <Spinner />;
  const ordered = sortedModules(cur);
  const all = ordered
    .filter((m) => !moduleId || m.id === moduleId)
    .flatMap((m) => m.exercises.map((e) => ({ e, m })));
  const rows = status ? all.filter(({ e }) => exStatus(s, e.id) === status) : all;
  const passed = all.filter(({ e }) => exStatus(s, e.id) === 'passed').length;
  const skippedCount = all.filter(({ e }) => exStatus(s, e.id) === 'skipped').length;

  const activeCls =
    accent === 'cyan'
      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
      : 'border-sky-500 bg-sky-500/15 text-sky-300';
  const codeTone = accent === 'cyan' ? 'text-cyan-400' : 'text-sky-400';

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Bài thực hành"
        sub={`${passed}/${all.length} bài đã đạt${skippedCount ? ` · ${skippedCount} bài bỏ qua` : ''}${moduleId ? ` · module ${moduleId}` : ''}. Mọi bài đều chấm xác định (AST / trạng thái mô phỏng) ngay trong trình duyệt.`}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => go({ name: 'exercises', moduleId, status: f.id })}
            className={cn(
              'min-h-[44px] sm:min-h-[34px] rounded-lg border px-3 py-1.5 text-sm cursor-pointer',
              status === f.id ? activeCls : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            )}
          >
            {f.label}
          </button>
        ))}
        {moduleId && (
          <button
            type="button"
            onClick={() => go({ name: 'exercises', status })}
            className="min-h-[44px] sm:min-h-[34px] rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Bỏ lọc module
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Mã</th>
              <th className="px-3 py-2.5">Bài thực hành</th>
              <th className="hidden px-3 py-2.5 sm:table-cell">Loại</th>
              <th className="px-3 py-2.5">Độ khó</th>
              <th className="hidden px-3 py-2.5 md:table-cell">Chủ đề</th>
              <th className="px-3 py-2.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e }) => {
              const st = exStatus(s, e.id);
              return (
                <tr
                  key={e.id}
                  onClick={() => go({ name: 'exercise', code: e.code })}
                  className="cursor-pointer border-t border-slate-800/70 hover:bg-slate-800/50"
                >
                  <td className={cn('px-3 py-2.5 font-mono font-bold', codeTone)}>{e.code}</td>
                  <td className="px-3 py-2.5 text-slate-100">{e.title}</td>
                  <td className="hidden px-3 py-2.5 font-mono text-xs text-slate-400 sm:table-cell">
                    {KIND_SHORT[e.kind] ?? e.kind}
                  </td>
                  <td className="px-3 py-2.5">
                    <Stars n={e.difficulty} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-slate-500 md:table-cell">{e.tags.slice(0, 3).join(', ')}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Pill
                        tone={
                          st === 'passed'
                            ? 'ok'
                            : st === 'skipped'
                              ? 'info'
                              : st === 'started'
                                ? 'warn'
                                : 'neutral'
                        }
                      >
                        {st === 'passed'
                          ? 'đạt'
                          : st === 'skipped'
                            ? 'đã bỏ qua'
                            : st === 'started'
                              ? 'đang làm'
                              : 'chưa làm'}
                      </Pill>
                      {st !== 'passed' && (
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            toggleSkipEx(e.id);
                          }}
                          title={st === 'skipped' ? 'Hoàn tác bỏ qua' : 'Đã làm — Bỏ qua bài này'}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
                        >
                          {st === 'skipped' ? (
                            <>
                              <Undo2 className="h-3 w-3" />
                              <span className="hidden lg:inline">Hoàn tác</span>
                            </>
                          ) : (
                            <>
                              <SkipForward className="h-3 w-3" />
                              <span className="hidden lg:inline">Bỏ qua</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-slate-500">Không có bài nào khớp bộ lọc.</p>}
      </div>
    </div>
  );
};
