import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Keyboard,
  Layers,
  ListChecks,
  Wrench,
} from 'lucide-react';
import { useCourseCatalog, useCourseCurriculum } from '../data';
import {
  CATALOG_STATUS_LABEL,
  DEVOPS_KIND_LABEL,
  catalogStatus,
  courseModuleProgress,
  exStatus,
  lessonRead,
  quizBest,
} from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { CourseInline, CourseMarkdown } from '../components/CourseMarkdown';
import { CourseBar, CourseBtn } from '../components/CourseUi';
import { Card, Pill, Spinner, Stars } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

const KIND_BADGE: Record<string, string> = {
  yaml: 'YAML AST',
  dockerfile: 'Dockerfile AST',
  dockerignore: '.dockerignore',
  cli: 'Terminal CLI',
  troubleshoot: 'Khám bệnh & Vá lỗi',
};

export const ModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { courseId, accent, onOpenRelatedTool } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const { data: cat } = useCourseCatalog(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const markRead = COURSE_PROGRESS_STORES[courseId]((x) => x.markLessonRead);
  const { go, back } = COURSE_NAV_STORES[courseId]();

  if (!cur) return <Spinner />;
  const m = cur.modules.find((x) => x.id === id);
  if (!m) return <div className="p-6 text-slate-400">Không tìm thấy module {id}.</div>;

  const [d, t] = courseModuleProgress(s, m, cur.passQuiz);
  const read = lessonRead(s, m.id);
  const best = quizBest(s, m.id);
  const codeTone = accent === 'cyan' ? 'text-cyan-400' : 'text-sky-400';
  const hoverBorder = accent === 'cyan' ? 'hover:border-cyan-500/60' : 'hover:border-sky-500/60';

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CourseBtn accent={accent} onClick={back} aria-label="Quay lại">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </CourseBtn>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-500">
            Cấp {m.level} · {cur.levels[String(m.level)]}
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            <span className={cn('font-mono', codeTone)}>{m.id}</span> · {m.title}
          </h1>
        </div>
        <div className="w-36 sm:w-44">
          <CourseBar value={t ? d / t : 0} accent={accent} />
          <div className="mt-1 text-right text-xs text-slate-500">
            {d}/{t} mục
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <CourseMarkdown source={m.lesson} accent={accent} />

          {m.sources.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-400">
              <div className="mb-1.5 font-semibold uppercase tracking-wider text-slate-400">
                Nguồn tài liệu chính thức & phiên bản (2026)
              </div>
              <ul className="space-y-1">
                {m.sources.map((src) => (
                  <li key={src.url} className="flex flex-wrap items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 underline underline-offset-2 hover:text-sky-300 break-all"
                    >
                      {src.title}
                    </a>
                    {src.version && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                        {src.version}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4">
            {read ? (
              <Pill tone="ok">✔ Bạn đã đọc xong lesson này</Pill>
            ) : (
              <CourseBtn variant="primary" accent={accent} onClick={() => markRead(m.id)}>
                <CheckCircle2 className="h-4 w-4" /> Tôi đã đọc xong lesson này (+20 XP)
              </CourseBtn>
            )}
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">Luyện tập module này</h2>
            <div className="flex flex-wrap gap-2">
              <CourseBtn
                variant="primary"
                accent={accent}
                onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}
              >
                <ListChecks className="h-4 w-4" /> Quiz ({m.quiz.length} câu)
              </CourseBtn>
              <CourseBtn accent={accent} onClick={() => go({ name: 'flash', moduleId: m.id })}>
                <Layers className="h-4 w-4" /> Flashcard ({m.cards.length})
              </CourseBtn>
              {m.drills.length > 0 && (
                <CourseBtn accent={accent} onClick={() => go({ name: 'drill', moduleId: m.id })}>
                  <Keyboard className="h-4 w-4" /> Luyện gõ
                </CourseBtn>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Quiz tốt nhất: {best ? `${Math.round(best * 100)}%` : 'chưa làm'} · cần ≥ {Math.round(cur.passQuiz * 100)}% để qua
            </p>
          </Card>

          {m.relatedTools && m.relatedTools.length > 0 && onOpenRelatedTool && (
            <Card>
              <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                <Wrench className="h-4 w-4 text-amber-400" aria-hidden="true" /> Phòng thí nghiệm trực quan đi kèm
              </h2>
              <div className="space-y-2">
                {m.relatedTools.map((tool, i) => (
                  <button
                    key={`${tool.kind}-${tool.targetId}-${i}`}
                    type="button"
                    onClick={() => onOpenRelatedTool(tool)}
                    className={cn(
                      'block min-h-[44px] w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-left transition-colors cursor-pointer',
                      hoverBorder
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm font-medium text-slate-100">
                      <span>{tool.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    </div>
                    {tool.description && <div className="mt-0.5 text-xs text-slate-400">{tool.description}</div>}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-white">Bài thực hành ({m.exercises.length})</h2>
            <div className="space-y-2">
              {m.exercises.map((e) => {
                const st = exStatus(s, e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => go({ name: 'exercise', code: e.code })}
                    className={cn(
                      'block min-h-[56px] w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition-colors cursor-pointer',
                      hoverBorder
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100">
                        <span className={cn('mr-1.5 font-mono', codeTone)}>{e.code}</span>
                        {e.title}
                      </span>
                      <Pill tone={st === 'passed' ? 'ok' : st === 'started' ? 'warn' : 'neutral'}>
                        {st === 'passed' ? 'đạt' : st === 'started' ? 'đang làm' : 'chưa làm'}
                      </Pill>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Stars n={e.difficulty} />
                      <span>· {KIND_BADGE[e.kind] ?? e.kind}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {m.readings.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">Đọc cấu hình thật</h2>
              <div className="space-y-2">
                {m.readings.map((r) => {
                  const item = cat?.items.find((i) => i.n === r.catalogN || i.path === r.path);
                  const k = DEVOPS_KIND_LABEL[r.kind] ?? DEVOPS_KIND_LABEL.good;
                  const st = item ? catalogStatus(s, item.id) : 'todo';
                  return (
                    <button
                      key={r.path}
                      type="button"
                      disabled={!item}
                      onClick={() => item && go({ name: 'read', n: item.n })}
                      className="block min-h-[52px] w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition-colors hover:border-sky-500/60 disabled:cursor-default cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${k.cls}`}>{k.label}</span>
                        <span className="break-all text-sm font-medium text-sky-300">{r.path}</span>
                        {st !== 'todo' && <Pill>{CATALOG_STATUS_LABEL[st]}</Pill>}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        <CourseInline text={r.note} accent={accent} />
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
