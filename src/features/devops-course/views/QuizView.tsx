import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, SkipForward, Undo2, X } from 'lucide-react';
import { useCourseCurriculum } from '../data';
import { courseAllQuestions, gradeQuestion, isQuizSkipped, quizBest, type QuestionResult } from '../logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from '../store';
import { useCourseMeta } from '../context';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import type { DevOpsCurriculum, EditorLanguage, WpQuestion } from '../types';
import { ConfigCodeView, CourseInline } from '../components/CourseMarkdown';
import { CourseBar, CourseBtn } from '../components/CourseUi';
import { Callout, Spinner } from '@/features/workpath/components/ui';
import { cn } from '@/utils/cn';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function guessSnippetLang(code: string): EditorLanguage {
  const trimmed = code.trim();
  if (/^(FROM|WORKDIR|COPY|RUN|CMD|ENTRYPOINT|USER|EXPOSE)\b/m.test(trimmed)) return 'dockerfile';
  if (/^(\$ |docker |kubectl |git |npm |curl |set -e|redis-cli )/m.test(trimmed)) return 'shell';
  if (/^(SET|GET|MSET|HSET|HGET|HEXPIRE|LPUSH|RPUSH|SADD|ZADD|ZRANGE|XADD|XGROUP|XREADGROUP|XPENDING|XACK|MULTI|EXEC|EVAL|SCAN|KEYS|UNLINK|CONFIG|ACL|INFO|SLOWLOG|CLUSTER|PFADD|SETBIT|GEOADD|BF\.)\b/im.test(trimmed)) {
    return 'redis';
  }
  if (/^(maxmemory|maxmemory-policy|appendonly|appendfsync|save|bind|protected-mode|rename-command|user )\b/m.test(trimmed)) {
    return 'redis-conf';
  }
  return 'yaml';
}

type Props = { mode: 'module' | 'review' | 'mix'; moduleId?: string };

export const QuizView: React.FC<Props> = (props) => {
  const { courseId } = useCourseMeta();
  const { data: cur } = useCourseCurriculum(courseId);
  const [round, setRound] = useState(0);
  if (!cur) return <Spinner />;
  return (
    <QuizRound
      key={`${courseId}-${props.mode}-${props.moduleId}-${round}`}
      {...props}
      cur={cur}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
};

const QuizRound: React.FC<Props & { cur: DevOpsCurriculum; onRestart: () => void }> = ({
  mode,
  moduleId,
  cur,
  onRestart,
}) => {
  const { courseId, accent } = useCourseMeta();
  const lang = useWorkbenchStore((s) => s.language);
  const enOverlay = useCourseEnOverlay(courseId);
  const s = COURSE_PROGRESS_STORES[courseId]((x) => x.state);
  const record = COURSE_PROGRESS_STORES[courseId]((x) => x.recordQuiz);
  const toggleSkipQuiz = COURSE_PROGRESS_STORES[courseId]((x) => x.toggleSkipQuiz);
  const { go, back } = COURSE_NAV_STORES[courseId]();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{
    items: Map<string, QuestionResult>;
    correct: number;
    total: number;
    xp: number;
    recordNew: boolean;
  } | null>(null);

  const questions = useMemo(() => {
    if (mode === 'module') {
      const m = cur.modules.find((x) => x.id === moduleId);
      return shuffle(m?.quiz ?? []);
    }
    if (mode === 'review') {
      const map = courseAllQuestions(cur);
      return s.quizWrong.map((id) => map.get(id)).filter((q): q is WpQuestion => !!q);
    }
    const readPool = cur.modules.filter((m) => m.id in s.lessons).flatMap((m) => m.quiz);
    const pool = readPool.length ? readPool : cur.modules.slice(0, 2).flatMap((m) => m.quiz);
    return shuffle(pool).slice(0, 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qModMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of cur.modules) {
      for (const q of m.quiz) map.set(q.id, m.id);
    }
    return map;
  }, [cur]);

  const title = useMemo(() => {
    if (mode === 'module') {
      const m = cur.modules.find((x) => x.id === moduleId);
      if (!m) return 'Quiz';
      const modTitle = (lang === 'en' ? enOverlay?.modules?.[m.id]?.titleEn : undefined) ?? m.title;
      return `Quiz ${m.id} · ${modTitle}`;
    }
    if (mode === 'review') return lang === 'en' ? 'Review Missed Questions' : 'Ôn lại câu từng sai';
    return lang === 'en' ? 'Mixed Practice Quiz' : 'Quiz trộn tổng hợp';
  }, [mode, moduleId, cur, lang, enOverlay]);

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-xl font-bold text-white">{title}</h1>
        <Callout tone="ok">
          {mode === 'review'
            ? lang === 'en'
              ? 'No questions to review 🎉'
              : 'Không có câu nào cần ôn lại 🎉'
            : lang === 'en'
              ? 'No questions available yet.'
              : 'Chưa có câu hỏi nào khả dụng.'}
        </Callout>
        <CourseBtn accent={accent} className="mt-4" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> {lang === 'en' ? 'Back' : 'Quay lại'}
        </CourseBtn>
      </div>
    );
  }

  const submit = () => {
    const items = new Map<string, QuestionResult>();
    for (const q of questions) items.set(q.id, gradeQuestion(q, answers[q.id] ?? null));
    const list = [...items.values()];
    const correct = list.filter((r) => r.ok).length;
    const total = mode === 'module' ? questions.length : list.length;
    const { xp, record: recordNew } = record(mode === 'module' ? (moduleId ?? null) : null, total, list);
    setResult({ items, correct, total, xp, recordNew });
    setTimeout(() => document.getElementById('quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const passed = result ? result.correct / result.total >= cur.passQuiz : null;
  const wrongNums = result ? questions.map((q, i) => (result.items.get(q.id)?.ok ? 0 : i + 1)).filter(Boolean) : [];
  const chosenBorder =
    accent === 'cyan'
      ? 'border-cyan-500 bg-cyan-500/10'
      : accent === 'rose'
        ? 'border-rose-500 bg-rose-500/10'
        : 'border-sky-500 bg-sky-500/10';

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CourseBtn accent={accent} onClick={back}>
            <ArrowLeft className="h-4 w-4" /> {lang === 'en' ? 'Back' : 'Quay lại'}
          </CourseBtn>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-slate-400">
              {lang === 'en'
                ? `${questions.length} questions · multiple choice, true/false & output prediction`
                : `${questions.length} câu · trắc nghiệm, đúng/sai và dự đoán kết quả`}
            </p>
          </div>
        </div>
        {mode === 'module' && moduleId && quizBest(s, moduleId) < cur.passQuiz && (
          <CourseBtn
            accent={accent}
            onClick={() => {
              const skipped = toggleSkipQuiz(moduleId);
              if (skipped) go({ name: 'module', id: moduleId });
            }}
          >
            {isQuizSkipped(s, moduleId) ? (
              <>
                <Undo2 className="h-4 w-4" /> {lang === 'en' ? 'Undo Skip Quiz' : 'Hoàn tác bỏ qua Quiz'}
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4" /> {lang === 'en' ? 'Mastered — Skip Quiz' : 'Đã nắm vững — Bỏ qua Quiz'}
              </>
            )}
          </CourseBtn>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, n) => {
          const r = result?.items.get(q.id);
          const state = !r ? 'idle' : r.ok ? 'ok' : r.skipped ? 'skip' : 'bad';
          const given = answers[q.id];
          const qModId = moduleId ?? qModMap.get(q.id);
          const qOv = lang === 'en' && qModId ? enOverlay?.modules?.[qModId]?.quizzes?.[q.id] : undefined;
          const qText = qOv?.qEn ?? q.q;
          const qChoices =
            q.type === 'mc'
              ? qOv?.choicesEn ?? q.choices
              : lang === 'en'
                ? ['True', 'False']
                : ['Đúng', 'Sai'];
          const qExplain = (lang === 'en' ? qOv?.explainEn : undefined) ?? r?.explain;
          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={cn(
                'rounded-xl border p-4',
                state === 'idle' && 'border-slate-800 bg-slate-900/60',
                state === 'ok' && 'border-emerald-500/50 bg-emerald-500/5',
                (state === 'bad' || state === 'skip') && 'border-rose-500/50 bg-rose-500/5'
              )}
            >
              <div className="mb-2 flex flex-wrap items-start gap-2 font-semibold text-slate-100">
                {state !== 'idle' && (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide text-white',
                      state === 'ok' ? 'bg-emerald-600' : state === 'skip' ? 'bg-amber-600' : 'bg-rose-600'
                    )}
                  >
                    {state === 'ok' ? (
                      <>
                        <Check className="h-3 w-3" /> {lang === 'en' ? 'CORRECT' : 'ĐÚNG'}
                      </>
                    ) : state === 'skip' ? (
                      lang === 'en' ? (
                        '⚠ SKIPPED'
                      ) : (
                        '⚠ BỎ TRỐNG'
                      )
                    ) : (
                      <>
                        <X className="h-3 w-3" /> {lang === 'en' ? 'WRONG' : 'SAI'}
                      </>
                    )}
                  </span>
                )}
                <span>
                  {n + 1}. <CourseInline text={qText} accent={accent} />{' '}
                  <span className="font-mono text-xs font-normal text-slate-600">[{q.id}]</span>
                </span>
              </div>
              {q.code && <ConfigCodeView code={q.code} language={guessSnippetLang(q.code)} className="!my-2" />}

              {(q.type === 'mc' || q.type === 'tf') && (
                <div className="space-y-1.5">
                  {qChoices.map((choice, k) => {
                    const value = q.type === 'mc' ? k : k === 0;
                    const chosen = given === value;
                    const isRight = !!r && (q.type === 'mc' ? k === r.rightIndex : value === r.rightBool);
                    const isWrongPick = !!r && chosen && !isRight;
                    return (
                      <label
                        key={k}
                        className={cn(
                          'flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                          !r && (chosen ? chosenBorder : 'border-slate-700 bg-slate-900 hover:border-slate-500'),
                          isRight && 'border-emerald-500 bg-emerald-500/15',
                          isWrongPick && 'border-rose-500 bg-rose-500/15',
                          r && !isRight && !isWrongPick && 'border-slate-800 opacity-60'
                        )}
                      >
                        <input
                          type="radio"
                          name={`a-${q.id}`}
                          disabled={!!r}
                          checked={chosen}
                          onChange={() => setAnswers({ ...answers, [q.id]: value })}
                          className="mt-1 accent-sky-500"
                        />
                        <span className="flex-1 text-slate-200">
                          <CourseInline text={String(choice)} accent={accent} />
                        </span>
                        {isRight && (
                          <span className="whitespace-nowrap text-xs font-bold text-emerald-400">
                            {chosen
                              ? lang === 'en'
                                ? '✔ Your correct pick'
                                : '✔ Bạn chọn đúng'
                              : lang === 'en'
                                ? '✔ Correct answer'
                                : '✔ Đáp án đúng'}
                          </span>
                        )}
                        {isWrongPick && (
                          <span className="whitespace-nowrap text-xs font-bold text-rose-400">
                            {lang === 'en' ? '✘ Your pick' : '✘ Bạn đã chọn'}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === 'output' && (
                <>
                  <textarea
                    value={String(given ?? '')}
                    disabled={!!r}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={2}
                    placeholder={lang === 'en' ? 'Type the exact predicted output' : 'Gõ kết quả dự đoán chính xác'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 font-mono text-[13px] text-slate-100 outline-none focus:border-sky-500/70 disabled:opacity-70"
                  />
                  {r && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {lang === 'en' ? 'Your answer' : 'Bạn trả lời'}
                        </div>
                        <pre
                          className={cn(
                            'overflow-auto whitespace-pre-wrap rounded-lg border-2 p-2 font-mono text-[13px]',
                            r.ok
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                              : 'border-rose-500 bg-rose-500/10 text-rose-300'
                          )}
                        >
                          {String(given ?? '').trim() || (lang === 'en' ? '(empty)' : '(để trống)')}
                        </pre>
                      </div>
                      {!r.ok && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {lang === 'en' ? 'Correct answer' : 'Đáp án đúng'}
                          </div>
                          <pre className="overflow-auto whitespace-pre-wrap rounded-lg border-2 border-emerald-500 bg-emerald-500/10 p-2 font-mono text-[13px] text-emerald-300">
                            {r.right}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {r && qExplain && (
                <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                  💡 <CourseInline text={qExplain} accent={accent} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <CourseBtn variant="primary" accent={accent} className="mt-5" onClick={submit}>
          {lang === 'en' ? 'Submit' : 'Nộp bài'}
        </CourseBtn>
      ) : (
        <div id="quiz-result" className="mt-6 space-y-3">
          <Callout tone={passed === false ? 'bad' : 'ok'}>
            <b>
              {lang === 'en' ? `Correct ${result.correct}/${result.total}` : `Đúng ${result.correct}/${result.total}`}
            </b>{' '}
            ({Math.round((result.correct / result.total) * 100)}%) · +{result.xp} XP
            {result.recordNew && (lang === 'en' ? ' · 🏆 new record' : ' · 🏆 kỷ lục mới')}
            {mode === 'module' &&
              (passed
                ? lang === 'en'
                  ? ' · quiz passed'
                  : ' · đạt yêu cầu quiz'
                : lang === 'en'
                  ? ` · need ≥ ${Math.round(cur.passQuiz * 100)}% to pass, review the lesson and try again`
                  : ` · cần ≥ ${Math.round(cur.passQuiz * 100)}% để qua, đọc lại lesson rồi thử lại nhé`)}
            <CourseBar value={result.correct / result.total} accent={accent} className="mt-2" />
            {wrongNums.length > 0 && (
              <div className="mt-2 text-xs">
                {lang === 'en' ? 'Wrong / skipped:' : 'Câu sai / bỏ trống:'} <b>{wrongNums.join(', ')}</b>
              </div>
            )}
          </Callout>
          <div className="flex flex-wrap gap-2">
            <CourseBtn variant="primary" accent={accent} onClick={onRestart}>
              {lang === 'en' ? 'Retry' : 'Làm lại'}
            </CourseBtn>
            <CourseBtn accent={accent} onClick={() => go({ name: 'quiz', mode: 'review' })}>
              {lang === 'en' ? 'Review Missed' : 'Ôn câu sai'}
            </CourseBtn>
            {moduleId && (
              <CourseBtn accent={accent} onClick={() => go({ name: 'module', id: moduleId })}>
                {lang === 'en' ? 'Back to Module' : 'Về module'}
              </CourseBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
