import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  KUBE_FLASHCARDS,
  KUBE_QUIZ_QUESTIONS,
} from '../data/examsAndFlashcardsData';
import { useKubeStore } from '../store/useKubeStore';
import { cn } from '@/utils/cn';

export const KubeExamCenter: React.FC = () => {
  const { bestQuizScore, setBestQuizScore } = useKubeStore();

  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const activeCard = KUBE_FLASHCARDS[cardIdx] || KUBE_FLASHCARDS[0];

  const handleSubmitQuiz = () => {
    setSubmitted(true);
    const correctCount = KUBE_QUIZ_QUESTIONS.filter(
      (q) => selectedAnswers[q.id] === q.correctIndex
    ).length;
    const pct = Math.round((correctCount / KUBE_QUIZ_QUESTIONS.length) * 100);
    setBestQuizScore(pct);
  };

  const correctCount = KUBE_QUIZ_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-sky-500/35 bg-gradient-to-r from-sky-500/15 via-violet-500/10 to-slate-900 p-4 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Trung Tâm Ôn Luyện Flashcards & Sát Hạch Kỹ Sư Docker/K8s</span>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-bold text-emerald-300">
            Điểm sát hạch cao nhất: {bestQuizScore}%
          </span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Flashcards Ghi Nhớ Nhanh & Bài Thi Sát Hạch Tình Huống Thực Chiến
        </h1>
      </div>

      {/* Section 1: Interactive Flashcard Flip Deck */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Flashcards Ghi Nhớ Nhanh ({cardIdx + 1}/{KUBE_FLASHCARDS.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCardIdx(
                  (i) => (i - 1 + KUBE_FLASHCARDS.length) % KUBE_FLASHCARDS.length
                );
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Thẻ trước</span>
            </button>
            <button
              onClick={() => {
                setIsFlipped(false);
                setCardIdx((i) => (i + 1) % KUBE_FLASHCARDS.length);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 hover:bg-slate-800"
            >
              <span>Thẻ tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsFlipped((f) => !f)}
          className={cn(
            'w-full rounded-2xl border p-6 sm:p-8 text-left transition-all cursor-pointer space-y-4',
            isFlipped
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-sky-500/40 bg-slate-950/90 hover:border-sky-400'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-300">
              {activeCard.category}
            </span>
            <span className="font-mono text-xs text-amber-300">
              {isFlipped ? 'Đang xem Mặt sau (Đáp án)' : 'Chạm vào thẻ để lật xem Đáp án'}
            </span>
          </div>

          {!isFlipped ? (
            <div className="space-y-3">
              <h3 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                {activeCard.frontQuestion}
              </h3>
              <p className="text-xs sm:text-sm text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{activeCard.analogyHint}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase text-emerald-400">
                Giải đáp chuẩn xác:
              </div>
              <p className="whitespace-pre-line text-sm sm:text-base text-slate-100 leading-relaxed">
                {activeCard.backAnswer}
              </p>
              {activeCard.keyCommand && (
                <div className="ide-dark-surface rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 font-mono text-xs text-amber-300">
                  {activeCard.keyCommand}
                </div>
              )}
            </div>
          )}
        </button>
      </section>

      {/* Section 2: Practical SRE Quiz */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Đề Thi Sát Hạch Kỹ Sư Vận Hành Docker & Kubernetes ({KUBE_QUIZ_QUESTIONS.length} Câu)
            </h2>
            <p className="text-xs text-slate-400">
              Chọn đáp án cho từng tình huống rồi bấm "Nộp bài & Chấm điểm"
            </p>
          </div>

          {submitted && (
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 font-mono text-xs font-extrabold text-emerald-300">
                Kết quả: {correctCount}/{KUBE_QUIZ_QUESTIONS.length} câu đúng (
                {Math.round((correctCount / KUBE_QUIZ_QUESTIONS.length) * 100)}%)
              </span>
              <button
                onClick={() => {
                  setSelectedAnswers({});
                  setSubmitted(false);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Thi lại</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {KUBE_QUIZ_QUESTIONS.map((q, idx) => {
            const chosen = selectedAnswers[q.id];
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-3"
              >
                {q.scenarioContext && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <strong>Tình huống: </strong>
                    {q.scenarioContext}
                  </div>
                )}

                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Câu {idx + 1}: {q.question}
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    const isCorrect = q.correctIndex === optIdx;
                    return (
                      <button
                        key={optIdx}
                        disabled={submitted}
                        onClick={() =>
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [q.id]: optIdx,
                          }))
                        }
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs transition-all',
                          !submitted &&
                            isSelected &&
                            'border-sky-400 bg-sky-500/15 text-sky-200 font-semibold',
                          !submitted &&
                            !isSelected &&
                            'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800',
                          submitted &&
                            isCorrect &&
                            'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-bold',
                          submitted &&
                            isSelected &&
                            !isCorrect &&
                            'border-rose-500/60 bg-rose-500/15 text-rose-200'
                        )}
                      >
                        <span>
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                        {submitted && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        {submitted && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 p-3 text-xs text-slate-200">
                    <strong className="text-sky-300">Giải thích: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!submitted && (
          <button
            onClick={handleSubmitQuiz}
            className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Nộp Bài & Chấm Điểm Sát Hạch</span>
          </button>
        )}
      </section>
    </div>
  );
};
