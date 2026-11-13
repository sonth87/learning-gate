import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, SkipForward, Undo2, X } from 'lucide-react';
import { usePmpCurriculum } from '../data';
import { gradeQuestion, isQuizSkipped, pmpAllQuestions, quizBest, type QuestionResult } from '../logic';
import { usePmpNav, usePmpProgress } from '../store';
import type { PmpCurriculum, WpQuestion } from '../types';
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

export const PmpQuizView: React.FC<Props> = (props) => {
  const { data: cur } = usePmpCurriculum();
  const [round, setRound] = useState(0);
  if (!cur) return <Spinner />;
  return (
    <PmpQuizRound
      key={`pmp-${props.mode}-${props.moduleId ?? 'all'}-${round}`}
      {...props}
      cur={cur}
      onRestart={() => setRound((r) => r + 1)}
    />
  );
};

const PmpQuizRound: React.FC<Props & { cur: PmpCurriculum; onRestart: () => void }> = ({
  mode,
  moduleId,
  cur,
  onRestart,
}) => {
  const s = usePmpProgress((x) => x.state);
  const record = usePmpProgress((x) => x.recordQuiz);
  const toggleSkipQuiz = usePmpProgress((x) => x.toggleSkipQuiz);
  const { go, back } = usePmpNav();
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
        title: m ? `Tự kiểm tra ${m.id} · ${m.title}` : 'Tự kiểm tra tư duy PMP',
        questions: shuffle(m?.quiz ?? []),
      };
    }
    if (mode === 'review') {
      const map = pmpAllQuestions(cur);
      return {
        title: 'Phẫu thuật lại các câu tình huống từng chọn nhầm',
        questions: s.quizWrong.map((id) => map.get(id)).filter((q): q is WpQuestion => Boolean(q)),
      };
    }
    const readPool = cur.modules.filter((m) => m.id in s.lessons).flatMap((m) => m.quiz);
    const pool = readPool.length ? readPool : cur.modules.slice(0, 3).flatMap((m) => m.quiz);
    return { title: 'Quiz trộn tổng hợp tư duy PMP', questions: shuffle(pool).slice(0, 15) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!questions.length) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-xl font-bold text-white">{title}</h1>
        <Callout tone="ok">
          {mode === 'review'
            ? 'Tuyệt vời! Bạn không còn câu tình huống nào trong danh sách chọn nhầm 🎉'
            : 'Chưa có câu hỏi nào khả dụng.'}
        </Callout>
        <CourseBtn accent="amber" className="mt-4" onClick={back}>
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
    setTimeout(() => document.getElementById('pmp-quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const passed = result ? result.correct / result.total >= cur.passQuiz : null;
  const wrongNums = result ? questions.map((q, i) => (result.items.get(q.id)?.ok ? 0 : i + 1)).filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CourseBtn accent="amber" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </CourseBtn>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-slate-400">
              {questions.length} câu tình huống ngắn · cần đạt ≥ {Math.round(cur.passQuiz * 100)}% để xác nhận nắm vững tư duy
            </p>
          </div>
        </div>
        {mode === 'module' && moduleId && quizBest(s, moduleId) < cur.passQuiz && (
          <CourseBtn
            accent="amber"
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
          </CourseBtn>
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
              id={`pmp-q-${q.id}`}
              className={cn(
                'rounded-xl border p-4',
                state === 'idle' && 'border-slate-800 bg-slate-900/60',
                state === 'ok' && 'border-emerald-500/50 bg-emerald-500/5',
                (state === 'bad' || state === 'skip') && 'border-rose-500/50 bg-rose-500/5'
              )}
            >
              <div className="mb-2.5 flex flex-wrap items-start gap-2 font-semibold text-slate-100 leading-relaxed">
                {state !== 'idle' && (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold tracking-wide text-white',
                      state === 'ok' ? 'bg-emerald-600' : state === 'skip' ? 'bg-amber-600' : 'bg-rose-600'
                    )}
                  >
                    {state === 'ok' ? (
                      <>
                        <Check className="h-3 w-3" /> CHUẨN PMI
                      </>
                    ) : state === 'skip' ? (
                      '⚠ BỎ TRỐNG'
                    ) : (
                      <>
                        <X className="h-3 w-3" /> SẬP BẪY
                      </>
                    )}
                  </span>
                )}
                <span>
                  {n + 1}. <CourseInline text={q.q} accent="amber" />{' '}
                  <span className="font-mono text-xs font-normal text-slate-600">[{q.id}]</span>
                </span>
              </div>

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
                          !r && (chosen ? 'border-amber-500 bg-amber-500/12' : 'border-slate-700 bg-slate-900 hover:border-slate-500'),
                          isRight && 'border-emerald-500 bg-emerald-500/15',
                          isWrongPick && 'border-rose-500 bg-rose-500/15',
                          r && !isRight && !isWrongPick && 'border-slate-800 opacity-60'
                        )}
                      >
                        <input
                          type="radio"
                          name={`pmp-a-${q.id}`}
                          disabled={Boolean(r)}
                          checked={chosen}
                          onChange={() => setAnswers({ ...answers, [q.id]: value })}
                          className="mt-1 accent-amber-500"
                        />
                        <span className="flex-1 text-slate-200 leading-relaxed">
                          <CourseInline text={String(choice)} accent="amber" />
                        </span>
                        {isRight && (
                          <span className="whitespace-nowrap text-xs font-bold text-emerald-400">
                            {chosen ? '✔ Bạn chọn đúng' : '✔ Đáp án PMI'}
                          </span>
                        )}
                        {isWrongPick && <span className="whitespace-nowrap text-xs font-bold text-rose-400">✘ Bạn đã chọn</span>}
                      </label>
                    );
                  })}
                </div>
              )}

              {r?.explain && (
                <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200 leading-relaxed">
                  💡 <b>Giải phẫu tư duy PMI:</b> <CourseInline text={r.explain} accent="amber" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result ? (
        <CourseBtn variant="primary" accent="amber" className="mt-5" onClick={submit}>
          Chấm bài &amp; Giải phẫu đáp án
        </CourseBtn>
      ) : (
        <div id="pmp-quiz-result" className="mt-6 space-y-3">
          <Callout tone={passed === false ? 'bad' : 'ok'}>
            <b>
              Đúng {result.correct}/{result.total}
            </b>{' '}
            ({Math.round((result.correct / result.total) * 100)}%) · +{result.xp} XP
            {result.recordNew && ' · 🏆 kỷ lục mới'}
            {mode === 'module' &&
              (passed
                ? ' · Đạt chuẩn tư duy module này! Giờ hãy sang PMP Mindmap xem dẫn chứng & luyện tình huống sâu.'
                : ` · Cần đạt ≥ ${Math.round(cur.passQuiz * 100)}% để qua — hãy đọc kỹ giải phẫu đáp án bên trên rồi thử lại nhé.`)}
            <CourseBar value={result.correct / result.total} accent="amber" className="mt-2" />
            {wrongNums.length > 0 && (
              <div className="mt-2 text-xs">
                Câu cần lưu ý: <b>{wrongNums.join(', ')}</b>
              </div>
            )}
          </Callout>
          <div className="flex flex-wrap gap-2">
            <CourseBtn variant="primary" accent="amber" onClick={onRestart}>
              Làm lại lượt mới
            </CourseBtn>
            <CourseBtn accent="amber" onClick={() => go({ name: 'quiz', mode: 'review' })}>
              Ôn câu từng sai
            </CourseBtn>
            {moduleId && (
              <CourseBtn accent="amber" onClick={() => go({ name: 'module', id: moduleId })}>
                Về module &amp; mở dẫn chứng Mindmap
              </CourseBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
