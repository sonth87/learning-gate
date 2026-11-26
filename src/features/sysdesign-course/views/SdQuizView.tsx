import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Layers, SkipForward, Undo2, X } from 'lucide-react';
import { useSdCurriculum } from '../data';
import { gradeQuestion, isQuizSkipped, quizBest, sdAllQuestions, type QuestionResult } from '../logic';
import { useSdNav, useSdProgress } from '../store';
import type { SdCurriculum, WpQuestion } from '../types';
import { CourseInline } from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
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

type Props = { mode: 'module' | 'review' | 'mix'; moduleId?: string };

export const SdQuizView: React.FC<Props> = (props) => {
  const { data: cur } = useSdCurriculum();
  const [round, setRound] = useState(0);
  if (!cur) return <Spinner />;
  return (
    <SdQuizRound
      key={`sd-${props.mode}-${props.moduleId ?? 'all'}-${round}`}
      {...props}
      cur={cur}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
};

const SdQuizRound: React.FC<Props & { cur: SdCurriculum; onRestart: () => void }> = ({
  mode,
  moduleId,
  cur,
  onRestart,
}) => {
  const s = useSdProgress((x) => x.state);
  const record = useSdProgress((x) => x.recordQuiz);
  const toggleSkipQuiz = useSdProgress((x) => x.toggleSkipQuiz);
  const { go, back } = useSdNav();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<{
    items: Map<string, QuestionResult>;
    correct: number;
    total: number;
    xp: number;
    recordNew: boolean;
  } | null>(null);

  const { title, questions } = useMemo(() => {
    if (mode === 'module') {
      const m = cur.modules.find((x) => x.id === moduleId);
      return {
        title: m ? `Quiz ${m.id} · ${m.title}` : 'Quiz System Design',
        questions: shuffle(m?.quiz ?? []),
      };
    }
    if (mode === 'review') {
      const map = sdAllQuestions(cur);
      return {
        title: 'Ôn lại các câu từng trả lời sai',
        questions: s.quizWrong.map((id) => map.get(id)).filter((q): q is WpQuestion => Boolean(q)),
      };
    }
    const readPool = cur.modules.filter((m) => m.id in s.lessons).flatMap((m) => m.quiz);
    const pool = readPool.length ? readPool : cur.modules.slice(0, 3).flatMap((m) => m.quiz);
    return { title: 'Quiz trộn tổng hợp', questions: shuffle(pool).slice(0, 15) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-xl font-bold text-white">{title}</h1>
        <Callout tone="ok">
          {mode === 'review' ? 'Bạn không còn câu nào trong danh sách trả lời sai.' : 'Chưa có câu hỏi nào khả dụng.'}
        </Callout>
        <CourseBtn accent="cyan" className="mt-4" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
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
    setTimeout(
      () => document.getElementById('sd-quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      50
    );
  };

  const passed = result ? result.correct / result.total >= cur.passQuiz : null;
  const wrongNums = result ? questions.map((q, i) => (result.items.get(q.id)?.ok ? 0 : i + 1)).filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 text-[var(--dts-ink)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CourseBtn accent="cyan" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
          <div>
            <h1 className="font-mono text-xl font-extrabold text-[var(--dts-ink)] sm:text-2xl">{title}</h1>
            <p className="text-sm text-[var(--dts-ink-muted)]">
              {questions.length} câu · cần đạt ≥ {Math.round(cur.passQuiz * 100)}% để qua bài
            </p>
          </div>
        </div>
        {mode === 'module' && moduleId && quizBest(s, moduleId) < cur.passQuiz && (
          <CourseBtn
            accent="cyan"
            onClick={() => {
              const skipped = toggleSkipQuiz(moduleId);
              if (skipped) go({ name: 'module', id: moduleId });
            }}
          >
            {isQuizSkipped(s, moduleId) ? (
              <>
                <Undo2 className="h-4 w-4" /> Hoàn tác bỏ qua quiz
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4" /> Đã nắm vững, bỏ qua quiz
              </>
            )}
          </CourseBtn>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3.5 py-2.5">
        <p className="min-w-0 flex-1 text-xs text-[var(--dts-ink-soft)]">
          Sau khi chấm, mỗi câu có giải thích. Câu trả lời sai được lưu để ôn lại ở chế độ &quot;Ôn câu sai&quot;.
        </p>
        <button
          type="button"
          onClick={() => go({ name: 'flash', moduleId })}
          className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-panel)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Flashcard</span>
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, n) => {
          const r = result?.items.get(q.id);
          const state = !r ? 'idle' : r.ok ? 'ok' : r.skipped ? 'skip' : 'bad';
          const given = answers[q.id];
          return (
            <div
              key={q.id}
              id={`sd-q-${q.id}`}
              className={cn(
                'rounded-xl border p-4',
                state === 'idle' && 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]',
                state === 'ok' && 'border-emerald-500/60 bg-[var(--dts-green-soft)]/60',
                (state === 'bad' || state === 'skip') && 'border-rose-500/60 bg-[var(--dts-rose-soft)]/60'
              )}
            >
              <div className="mb-2.5 flex flex-wrap items-start gap-2 font-semibold leading-relaxed text-[var(--dts-ink)]">
                {state !== 'idle' && (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide text-white',
                      state === 'ok' ? 'bg-emerald-600' : state === 'skip' ? 'bg-amber-600' : 'bg-rose-600'
                    )}
                  >
                    {state === 'ok' ? (
                      <>
                        <Check className="h-3 w-3" /> CHÍNH XÁC
                      </>
                    ) : state === 'skip' ? (
                      'BỎ TRỐNG'
                    ) : (
                      <>
                        <X className="h-3 w-3" /> CHƯA ĐÚNG
                      </>
                    )}
                  </span>
                )}
                <span>
                  {n + 1}. <CourseInline text={q.q} accent="cyan" />{' '}
                  <span className="font-mono text-xs font-normal text-[var(--dts-ink-muted)]">[{q.id}]</span>
                </span>
              </div>

              {q.code && (
                <pre className="mb-2.5 overflow-x-auto rounded-lg bg-[var(--dts-panel)] p-3 font-mono text-xs text-[var(--dts-ink)]">
                  {q.code}
                </pre>
              )}

              {(q.type === 'mc' || q.type === 'tf') && (
                <div className="space-y-1.5">
                  {(q.type === 'mc' ? q.choices : ['Đúng', 'Sai']).map((choice, k) => {
                    const value = q.type === 'mc' ? k : k === 0;
                    const chosen = given === value;
                    const isRight = Boolean(r) && (q.type === 'mc' ? k === r?.rightIndex : value === r?.rightBool);
                    const isWrongPick = Boolean(r) && chosen && !isRight;
                    return (
                      <label
                        key={k}
                        className={cn(
                          'flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                          !r &&
                            (chosen
                              ? 'border-cyan-500 bg-[var(--dts-blue-soft)]'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:border-[var(--dts-border)]'),
                          isRight && 'border-emerald-500 bg-[var(--dts-green-soft)]',
                          isWrongPick && 'border-rose-500 bg-[var(--dts-rose-soft)]',
                          r && !isRight && !isWrongPick && 'border-[var(--dts-border-soft)] opacity-60'
                        )}
                      >
                        <input
                          type="radio"
                          name={`sd-a-${q.id}`}
                          disabled={Boolean(r)}
                          checked={chosen}
                          onChange={() => setAnswers({ ...answers, [q.id]: value })}
                          className="mt-1 accent-cyan-500"
                        />
                        <span className="flex-1 leading-relaxed text-[var(--dts-ink)]">
                          <CourseInline text={String(choice)} accent="cyan" />
                        </span>
                        {isRight && (
                          <span className="whitespace-nowrap text-xs font-bold text-emerald-500">
                            {chosen ? 'Bạn chọn đúng' : 'Đáp án đúng'}
                          </span>
                        )}
                        {isWrongPick && <span className="whitespace-nowrap text-xs font-bold text-rose-500">Bạn đã chọn</span>}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === 'output' && (
                <div>
                  <input
                    type="text"
                    disabled={Boolean(r)}
                    value={typeof given === 'string' ? given : ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Nhập đáp án"
                    aria-label={`Đáp án câu ${n + 1}`}
                    className="min-h-[44px] w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3 py-2 font-mono text-sm text-[var(--dts-ink)] outline-none focus:border-cyan-500 disabled:opacity-70"
                  />
                  {r && !r.ok && (
                    <p className="mt-1.5 text-xs font-bold text-emerald-500">Đáp án đúng: {r.right}</p>
                  )}
                </div>
              )}

              {r?.explain && (
                <div className="mt-3 rounded-lg border border-cyan-500/30 bg-[var(--dts-blue-soft)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--dts-ink)]">
                  <b>Giải thích:</b> <CourseInline text={r.explain} accent="cyan" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <CourseBtn variant="primary" accent="cyan" className="mt-5" onClick={submit}>
          Chấm bài &amp; xem giải thích
        </CourseBtn>
      ) : (
        <div id="sd-quiz-result" className="mt-6 space-y-3">
          <Callout tone={passed === false ? 'bad' : 'ok'}>
            <b>
              Đúng {result.correct}/{result.total}
            </b>{' '}
            ({Math.round((result.correct / result.total) * 100)}%) · +{result.xp} XP
            {result.recordNew && ' · kỷ lục mới'}
            {mode === 'module' &&
              (passed
                ? ' · Đạt chuẩn của bài này.'
                : ` · Cần đạt ≥ ${Math.round(cur.passQuiz * 100)}% để qua. Đọc kỹ phần giải thích rồi thử lại.`)}
            <CourseBar value={result.correct / result.total} accent="cyan" className="mt-2" />
            {wrongNums.length > 0 && (
              <div className="mt-2 text-xs">
                Câu cần xem lại: <b>{wrongNums.join(', ')}</b>
              </div>
            )}
          </Callout>
          <div className="flex flex-wrap gap-2">
            <CourseBtn variant="primary" accent="cyan" onClick={onRestart}>
              Làm lại lượt mới
            </CourseBtn>
            <CourseBtn accent="cyan" onClick={() => go({ name: 'quiz', mode: 'review' })}>
              Ôn câu từng sai
            </CourseBtn>
            {moduleId && (
              <CourseBtn accent="cyan" onClick={() => go({ name: 'module', id: moduleId })}>
                Về bài học
              </CourseBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
