import React from 'react';
import { SkipForward, Undo2 } from 'lucide-react';
import { useCurriculum } from '../data';
import { exStatus } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import type { ExerciseStatus } from '../types';
import { PageHeader, Pill, Spinner, Stars } from '../components/ui';
import { cn } from '@/utils/cn';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useCourseEnOverlay } from '@/data/i18n/loader';

const FILTERS: { id: ExerciseStatus | undefined; vi: string; en: string }[] = [
  { id: undefined, vi: 'Tất cả', en: 'All' },
  { id: 'started', vi: 'Đang làm', en: 'In progress' },
  { id: 'todo', vi: 'Chưa làm', en: 'Todo' },
  { id: 'passed', vi: 'Đã đạt', en: 'Passed' },
  { id: 'skipped', vi: 'Đã bỏ qua', en: 'Skipped' },
];

export const ExerciseListView: React.FC<{ moduleId?: string; status?: ExerciseStatus }> = ({ moduleId, status }) => {
  const { data: cur } = useCurriculum();
  const s = useWpProgress((x) => x.state);
  const toggleSkipEx = useWpProgress((x) => x.toggleSkipExercise);
  const go = useWpNav((x) => x.go);
  const lang = useWorkbenchStore((x) => x.language);
  const enOverlay = useCourseEnOverlay('python');
  const isEn = lang === 'en';
  if (!cur) return <Spinner />;
  const all = cur.modules.filter((m) => !moduleId || m.id === moduleId).flatMap((m) => m.exercises.map((e) => ({ e, m })));
  const rows = status ? all.filter(({ e }) => exStatus(s, e.id) === status) : all;
  const passed = all.filter(({ e }) => exStatus(s, e.id) === 'passed').length;
  const skippedCount = all.filter(({ e }) => exStatus(s, e.id) === 'skipped').length;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title={isEn ? 'Exercises' : 'Bài tập'}
        sub={
          isEn
            ? `${passed}/${all.length} passed${skippedCount ? ` · ${skippedCount} skipped` : ''}${moduleId ? ` · module ${moduleId}` : ''}. Every exercise has automated tests right in the browser.`
            : `${passed}/${all.length} bài đã đạt${skippedCount ? ` · ${skippedCount} bài bỏ qua` : ''}${moduleId ? ` · module ${moduleId}` : ''}. Mỗi bài có test tự chấm ngay trong trình duyệt.`
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.vi}
            onClick={() => go({ name: 'exercises', moduleId, status: f.id })}
            className={cn('rounded-lg border px-3 py-1 text-sm', status === f.id ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800')}
          >
            {isEn ? f.en : f.vi}
          </button>
        ))}
        {moduleId && (
          <button onClick={() => go({ name: 'exercises', status })} className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800">
            {isEn ? 'Clear module filter' : 'Bỏ lọc module'}
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">{isEn ? 'Code' : 'Mã'}</th>
              <th className="px-3 py-2">{isEn ? 'Exercise' : 'Bài'}</th>
              <th className="hidden px-3 py-2 sm:table-cell">{isEn ? 'Difficulty' : 'Độ khó'}</th>
              <th className="hidden px-3 py-2 md:table-cell">{isEn ? 'Topics' : 'Chủ đề'}</th>
              <th className="px-3 py-2">{isEn ? 'Status' : 'Trạng thái'}</th>
              <th className="hidden px-3 py-2 sm:table-cell">{isEn ? 'Grader' : 'Chấm'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, m }) => {
              const st = exStatus(s, e.id);
              const exTitle = isEn ? (enOverlay?.modules?.[m.id]?.exercises?.[e.id]?.titleEn ?? e.title) : e.title;
              return (
                <tr key={e.id} onClick={() => go({ name: 'exercise', code: e.code })} className="cursor-pointer border-t border-slate-800/70 hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono font-bold text-emerald-400">{e.code}</td>
                  <td className="px-3 py-2 text-slate-100">{exTitle}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <Stars n={e.difficulty} />
                  </td>
                  <td className="hidden px-3 py-2 text-xs text-slate-500 md:table-cell">{e.tags.slice(0, 3).join(', ')}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <Pill tone={st === 'passed' ? 'ok' : st === 'skipped' ? 'info' : st === 'started' ? 'warn' : 'neutral'}>
                        {st === 'passed'
                          ? isEn
                            ? 'passed'
                            : 'đạt'
                          : st === 'skipped'
                            ? isEn
                              ? 'skipped'
                              : 'đã bỏ qua'
                            : st === 'started'
                              ? isEn
                                ? 'in progress'
                                : 'đang làm'
                              : isEn
                                ? 'todo'
                                : 'chưa làm'}
                      </Pill>
                      {st !== 'passed' && (
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            toggleSkipEx(e.id);
                          }}
                          title={st === 'skipped' ? (isEn ? 'Undo skip' : 'Hoàn tác bỏ qua') : isEn ? 'Skip this exercise' : 'Bỏ qua bài này'}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
                        >
                          {st === 'skipped' ? (
                            <>
                              <Undo2 className="h-3 w-3" />
                              <span className="hidden lg:inline">{isEn ? 'Undo' : 'Hoàn tác'}</span>
                            </>
                          ) : (
                            <>
                              <SkipForward className="h-3 w-3" />
                              <span className="hidden lg:inline">{isEn ? 'Skip' : 'Bỏ qua'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-xs text-slate-500 sm:table-cell">{e.webGrade ? (isEn ? 'browser' : 'trình duyệt') : 'WorkPath'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-slate-500">{isEn ? 'No exercises match the filter.' : 'Không có bài nào khớp bộ lọc.'}</p>}
      </div>
    </div>
  );
};
