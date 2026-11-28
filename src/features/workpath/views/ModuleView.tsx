import React from 'react';
import { ArrowLeft, CheckCircle2, Keyboard, Layers, ListChecks, SkipForward, Undo2 } from 'lucide-react';
import { useCatalog, useCurriculum } from '../data';
import {
  CATALOG_STATUS_LABEL,
  KIND_LABEL,
  catalogStatus,
  exStatus,
  isLessonSkipped,
  isModuleSkipped,
  isQuizSkipped,
  lessonRead,
  moduleProgress,
  quizBest,
} from '../logic';
import { useWpNav, useWpProgress } from '../store';
import { Markdown, Inline } from '../components/Markdown';
import { Bar, Btn, Callout, Card, Pill, Spinner, Stars } from '../components/ui';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import type { CatalogStatus } from '../types';

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

export const ModuleView: React.FC<{ id: string }> = ({ id }) => {
  const { data: cur } = useCurriculum();
  const { data: cat } = useCatalog();
  const s = useWpProgress((x) => x.state);
  const markRead = useWpProgress((x) => x.markLessonRead);
  const toggleSkipModule = useWpProgress((x) => x.toggleSkipModule);
  const toggleSkipLesson = useWpProgress((x) => x.toggleSkipLesson);
  const toggleSkipQuiz = useWpProgress((x) => x.toggleSkipQuiz);
  const toggleSkipExercise = useWpProgress((x) => x.toggleSkipExercise);
  const { go, back } = useWpNav();
  const lang = useWorkbenchStore((x) => x.language);
  const enOverlay = useCourseEnOverlay('python');
  const isEn = lang === 'en';
  if (!cur) return <Spinner />;
  const m = cur.modules.find((x) => x.id === id);
  if (!m) return <div className="p-6 text-slate-400">{isEn ? `Module ${id} not found.` : `Không có module ${id}.`}</div>;
  const [d, t] = moduleProgress(s, m, cur.passQuiz);
  const read = lessonRead(s, m.id);
  const modSkipped = isModuleSkipped(s, m.id);
  const lesSkipped = isLessonSkipped(s, m.id);
  const qzSkipped = isQuizSkipped(s, m.id);
  const best = quizBest(s, m.id);
  const modOverlay = isEn ? enOverlay?.modules?.[m.id] : undefined;
  const levelName = isEn ? (enOverlay?.levels?.[String(m.level)] ?? cur.levels[String(m.level)]) : cur.levels[String(m.level)];
  const modTitle = modOverlay?.titleEn ?? m.title;

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Btn onClick={back} aria-label={isEn ? 'Back' : 'Quay lại'}>
          <ArrowLeft className="h-4 w-4" /> {isEn ? 'Back' : 'Quay lại'}
        </Btn>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">
            {isEn ? `Level ${m.level} · ${levelName}` : `Cấp ${m.level} · ${levelName}`}
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            <span className="font-mono text-emerald-400">{m.id}</span> · {modTitle}
          </h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <Btn onClick={() => toggleSkipModule(m.id)}>
            {modSkipped ? (
              <>
                <Undo2 className="h-3.5 w-3.5" /> {isEn ? 'Undo skip module' : 'Hoàn tác bỏ qua module'}
              </>
            ) : (
              <>
                <SkipForward className="h-3.5 w-3.5" /> {isEn ? 'Skip this module' : 'Bỏ qua module này'}
              </>
            )}
          </Btn>
          <div className="w-36">
            <Bar value={d / t} />
            <div className="mt-1 text-right text-xs text-slate-500">
              {modSkipped ? (isEn ? 'Skipped' : 'Đã bỏ qua') : isEn ? `${d}/${t} items` : `${d}/${t} mục`}
            </div>
          </div>
        </div>
      </div>

      {modSkipped && (
        <Callout tone="info" className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            {isEn ? (
              <>
                Module <b>{m.id}</b> is marked as <b>skipped</b> (already known). You can still read the lesson or solve exercises anytime.
              </>
            ) : (
              <>
                Module <b>{m.id}</b> đang được đánh dấu <b>bỏ qua</b> (đã biết). Bạn vẫn có thể đọc bài hoặc làm bài tập bất kỳ lúc nào.
              </>
            )}
          </span>
          <Btn onClick={() => toggleSkipModule(m.id, false)}>
            <Undo2 className="h-3.5 w-3.5" /> {isEn ? 'Undo' : 'Hoàn tác'}
          </Btn>
        </Callout>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="min-w-0 rounded-xl bg-slate-900/45 p-4 sm:p-6">
          <Markdown source={m.lesson} />
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800/70 pt-4">
            {read ? (
              <Pill tone="ok">{isEn ? '✔ You have read this lesson' : '✔ Bạn đã đọc lesson này'}</Pill>
            ) : lesSkipped ? (
              <>
                <Pill tone="info">{isEn ? 'Skipped this lesson' : 'Đã bỏ qua lesson này'}</Pill>
                <Btn onClick={() => markRead(m.id)}>
                  <CheckCircle2 className="h-4 w-4" /> {isEn ? 'Mark as read (+20 XP)' : 'Đánh dấu đã đọc (+20 XP)'}
                </Btn>
                <Btn onClick={() => toggleSkipLesson(m.id, false)}>
                  <Undo2 className="h-3.5 w-3.5" /> {isEn ? 'Undo' : 'Hoàn tác'}
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="primary" onClick={() => markRead(m.id)}>
                  <CheckCircle2 className="h-4 w-4" /> {isEn ? 'I have finished this lesson (+20 XP)' : 'Tôi đã đọc xong lesson này (+20 XP)'}
                </Btn>
                <Btn onClick={() => toggleSkipLesson(m.id, true)}>
                  <SkipForward className="h-4 w-4" /> {isEn ? 'Already know — Skip lesson' : 'Đã biết — Bỏ qua lesson'}
                </Btn>
              </>
            )}
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-white">{isEn ? 'Practice this module' : 'Luyện tập module này'}</h2>
            <div className="flex flex-wrap gap-2">
              <Btn variant="primary" onClick={() => go({ name: 'quiz', mode: 'module', moduleId: m.id })}>
                <ListChecks className="h-4 w-4" /> {isEn ? `Quiz (${m.quiz.length} Qs)` : `Quiz (${m.quiz.length} câu)`}
              </Btn>
              <Btn onClick={() => go({ name: 'flash', moduleId: m.id })}>
                <Layers className="h-4 w-4" /> {isEn ? `Flashcards (${m.cards.length})` : `Flashcard (${m.cards.length})`}
              </Btn>
              {m.drills.length > 0 && (
                <Btn onClick={() => go({ name: 'drill', moduleId: m.id })}>
                  <Keyboard className="h-4 w-4" /> {isEn ? 'Typing drill' : 'Luyện gõ'}
                </Btn>
              )}
              {m.quiz.length > 0 && best < cur.passQuiz && (
                <Btn onClick={() => toggleSkipQuiz(m.id)}>
                  {qzSkipped ? (
                    <>
                      <Undo2 className="h-3.5 w-3.5" /> {isEn ? 'Undo skip Quiz' : 'Hoàn tác bỏ qua Quiz'}
                    </>
                  ) : (
                    <>
                      <SkipForward className="h-3.5 w-3.5" /> {isEn ? 'Skip Quiz' : 'Bỏ qua Quiz'}
                    </>
                  )}
                </Btn>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {isEn
                ? `Best quiz: ${best ? `${Math.round(best * 100)}%` : qzSkipped ? 'skipped' : 'not taken'} · need ≥ ${Math.round(cur.passQuiz * 100)}% to pass`
                : `Quiz tốt nhất: ${best ? `${Math.round(best * 100)}%` : qzSkipped ? 'đã bỏ qua' : 'chưa làm'} · cần ≥ ${Math.round(cur.passQuiz * 100)}% để qua`}
            </p>
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-white">
              {isEn ? 'Exercises' : 'Bài tập'} ({m.exercises.length})
            </h2>
            <div className="space-y-2">
              {m.exercises.map((e) => {
                const st = exStatus(s, e.id);
                const exTitle = modOverlay?.exercises?.[e.id]?.titleEn ?? e.title;
                return (
                  <div key={e.id} className="flex items-stretch justify-between gap-2 rounded-xl bg-slate-900/65 p-3 transition-colors hover:bg-slate-900">
                    <button type="button" onClick={() => go({ name: 'exercise', code: e.code })} className="min-w-0 flex-1 text-left cursor-pointer">
                      <span className="text-sm font-medium text-slate-100">
                        <span className="mr-1.5 font-mono text-emerald-400">{e.code}</span>
                        {exTitle}
                      </span>
                      <div className="mt-1 text-xs">
                        <Stars n={e.difficulty} />
                        {!e.webGrade && <span className="ml-2 text-amber-400">{isEn ? 'graded via WorkPath' : 'chấm bằng WorkPath'}</span>}
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-1.5">
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
                          onClick={() => toggleSkipExercise(e.id)}
                          className="inline-flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:text-white cursor-pointer"
                        >
                          {st === 'skipped' ? <Undo2 className="h-2.5 w-2.5" /> : <SkipForward className="h-2.5 w-2.5" />}
                          <span>{st === 'skipped' ? (isEn ? 'Undo' : 'Hoàn tác') : isEn ? 'Skip' : 'Bỏ qua'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {m.readings.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">{isEn ? 'Read real code in Python-master' : 'Đọc code thật trong Python-master'}</h2>
              <div className="space-y-2">
                {m.readings.map((r, rIdx) => {
                  const item = cat?.items.find((i) => i.n === r.catalogN);
                  const k = KIND_LABEL[r.kind] ?? KIND_LABEL.good;
                  const kindLabel = isEn ? (KIND_EN[r.kind] ?? k.label) : k.label;
                  const st = item ? catalogStatus(s, item.id) : 'todo';
                  const rNote = modOverlay?.readings?.[rIdx]?.noteEn ?? r.note;
                  return (
                    <button
                      key={r.path}
                      disabled={!item}
                      onClick={() => item && go({ name: 'read', n: item.n })}
                      className="block w-full rounded-xl bg-slate-900/65 p-3 text-left transition-colors hover:bg-slate-900 disabled:cursor-default"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${k.cls}`}>{kindLabel}</span>
                        <span className="break-all text-sm font-medium text-sky-300">{r.path}</span>
                        {st !== 'todo' && <Pill>{isEn ? CATALOG_STATUS_EN[st] : CATALOG_STATUS_LABEL[st]}</Pill>}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        <Inline text={rNote} />
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
