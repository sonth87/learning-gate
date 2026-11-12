import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, SkipForward, Undo2, X } from 'lucide-react';
import { useCurriculum } from '../data';
import { allQuestions, gradeQuestion, isQuizSkipped, quizBest, type QuestionResult } from '../logic';
import { useWpNav, useWpProgress } from '../store';
import type { WpCurriculum, WpQuestion } from '../types';
import { CodeView, Inline } from '../components/Markdown';
import { Bar, Btn, Callout, Spinner } from '../components/ui';
import { cn } from '@/utils/cn';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = { mode: 'module' | 'review' | 'mix'; moduleId?: string };

export const QuizView: React.FC<Props> = (props) => {
  const { data: cur } = useCurriculum();
  const [round, setRound] = useState(0);
  if (!cur) return <Spinner />;
  return <QuizRound key={`${props.mode}-${props.moduleId}-${round}`} {...props} cur={cur} onRestart={() => setRound((r) => r + 1)} />;
};

const QuizRound: React.FC<Props & { cur: WpCurriculum; onRestart: () => void }> = ({ mode, moduleId, cur, onRestart }) => {
  const s = useWpProgress((x) => x.state);
  const record = useWpProgress((x) => x.recordQuiz);
  const toggleSkipQuiz = useWpProgress((x) => x.toggleSkipQuiz);
  const { go, back } = useWpNav();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{ items: Map<string, QuestionResult>; correct: number; total: number; xp: number; recordNew: boolean } | null>(null);

  const { title, questions } = useMemo(() => {
    const c = cur;
    if (mode === 'module') {
      const m = c.modules.find((x) => x.id === moduleId);
      return { title: m ? `Quiz ${m.id} · ${m.title}` : 'Quiz', questions: shuffle(m?.quiz ?? []) };
    }
    if (mode === 'review') {
      const map = allQuestions(c);
      return { title: 'Ôn lại câu từng sai', questions: s.quizWrong.map((id) => map.get(id)).filter((q): q is WpQuestion => !!q) };
    }
    const pool = c.modules.filter((m) => m.id in s.lessons).flatMap((m) => m.quiz);
    return { title: 'Quiz trộn từ các lesson đã đọc', questions: shuffle(pool).slice(0, 15) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!questions.length)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-xl font-bold text-white">{title}</h1>
        <Callout tone="ok">{mode === 'review' ? 'Không có câu nào cần ôn lại 🎉' : 'Chưa có câu hỏi: hãy đọc ít nhất một lesson trước.'}</Callout>
        <Btn className="mt-4" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Btn>
      </div>
    );

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

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Btn>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-slate-400">{questions.length} câu · trắc nghiệm, đúng/sai và đoán output</p>
          </div>
        </div>
        {mode === 'module' && moduleId && quizBest(s, moduleId) < cur.passQuiz && (
          <Btn
            onClick={() => {
              const skipped = toggleSkipQuiz(moduleId);
              if (skipped) go({ name: 'module', id: moduleId });
            }}
          >
            {isQuizSkipped(s, moduleId) ? (
              <>
                <Undo2 className="h-4 w-4" /> Hoàn tác bỏ qua Quiz
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4" /> Đã nắm vững — Bỏ qua Quiz
              </>
            )}
          </Btn>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, n) => {
          const r = result?.items.get(q.id);
          const state = !r ? 'idle' : r.ok ? 'ok' : r.skipped ? 'skip' : 'bad';
          const given = answers[q.id];
          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={cn('rounded-xl border p-4', state === 'idle' && 'border-slate-800 bg-slate-900/60', state === 'ok' && 'border-emerald-500/50 bg-emerald-500/5', (state === 'bad' || state === 'skip') && 'border-rose-500/50 bg-rose-500/5')}
            >
              <div className="mb-2 flex flex-wrap items-start gap-2 font-semibold text-slate-100">
                {state !== 'idle' && (
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide text-white', state === 'ok' ? 'bg-emerald-600' : state === 'skip' ? 'bg-amber-600' : 'bg-rose-600')}>
                    {state === 'ok' ? <><Check className="h-3 w-3" /> ĐÚNG</> : state === 'skip' ? '⚠ BỎ TRỐNG' : <><X className="h-3 w-3" /> SAI</>}
                  </span>
                )}
                <span>
                  {n + 1}. <Inline text={q.q} /> <span className="font-mono text-xs font-normal text-slate-600">[{q.id}]</span>
                </span>
              </div>
              {q.code && <CodeView code={q.code} className="!my-2" />}

              {(q.type === 'mc' || q.type === 'tf') && (
                <div className="space-y-1.5">
                  {(q.type === 'mc' ? q.choices : ['Đúng', 'Sai']).map((choice, k) => {
                    const value = q.type === 'mc' ? k : k === 0;
                    const chosen = given === value;
                    const isRight = !!r && (q.type === 'mc' ? k === r.rightIndex : value === r.rightBool);
                    const isWrongPick = !!r && chosen && !isRight;
                    return (
                      <label
                        key={k}
                        className={cn(
                          'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors',
                          !r && (chosen ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-500'),
                          isRight && 'border-emerald-500 bg-emerald-500/15',
                          isWrongPick && 'border-rose-500 bg-rose-500/15',
                          r && !isRight && !isWrongPick && 'border-slate-800 opacity-60'
                        )}
                      >
                        <input type="radio" name={`a-${q.id}`} disabled={!!r} checked={chosen} onChange={() => setAnswers({ ...answers, [q.id]: value })} className="mt-1 accent-emerald-500" />
                        <span className="flex-1 text-slate-200">
                          <Inline text={String(choice)} />
                        </span>
                        {isRight && <span className="whitespace-nowrap text-xs font-bold text-emerald-400">{chosen ? '✔ Bạn chọn đúng' : '✔ Đáp án đúng'}</span>}
                        {isWrongPick && <span className="whitespace-nowrap text-xs font-bold text-rose-400">✘ Bạn đã chọn</span>}
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
                    placeholder="Gõ output chính xác (nhiều dòng thì xuống dòng)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-[13px] text-slate-100 outline-none focus:border-emerald-500/70 disabled:opacity-70"
                  />
                  {r && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bạn trả lời</div>
                        <pre className={cn('overflow-auto whitespace-pre-wrap rounded-lg border-2 p-2 font-mono text-[13px]', r.ok ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-rose-500 bg-rose-500/10 text-rose-300')}>{String(given ?? '').trim() || '(để trống)'}</pre>
                      </div>
                      {!r.ok && (
                        <div>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Đáp án đúng</div>
                          <pre className="overflow-auto whitespace-pre-wrap rounded-lg border-2 border-emerald-500 bg-emerald-500/10 p-2 font-mono text-[13px] text-emerald-300">{r.right}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {r?.explain && (
                <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                  💡 <Inline text={r.explain} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <Btn variant="primary" className="mt-5" onClick={submit}>
          Nộp bài
        </Btn>
      ) : (
        <div id="quiz-result" className="mt-6 space-y-3">
          <Callout tone={passed === false ? 'bad' : 'ok'}>
            <b>
              Đúng {result.correct}/{result.total}
            </b>{' '}
            ({Math.round((result.correct / result.total) * 100)}%) · +{result.xp} XP
            {result.recordNew && ' · 🏆 kỷ lục mới'}
            {mode === 'module' && (passed ? ' · đạt yêu cầu quiz' : ` · cần ≥ ${Math.round(cur.passQuiz * 100)}% để qua, đọc lại lesson rồi thử lại nhé`)}
            <Bar value={result.correct / result.total} className="mt-2" />
            {wrongNums.length > 0 && (
              <div className="mt-2 text-xs">
                Câu sai / bỏ trống: <b>{wrongNums.join(', ')}</b>
              </div>
            )}
          </Callout>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={onRestart}>
              Làm lại
            </Btn>
            <Btn onClick={() => go({ name: 'quiz', mode: 'review' })}>Ôn câu sai</Btn>
            {moduleId && <Btn onClick={() => go({ name: 'module', id: moduleId })}>Về module</Btn>}
          </div>
        </div>
      )}
    </div>
  );
};
