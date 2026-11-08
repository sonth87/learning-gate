import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
} from 'lucide-react';
import { CICD_EXAM_SETS } from '../../data/cicdAssessmentsAndGlossaryData';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const CicdExamCenter: React.FC = () => {
  const { selectedExamId, selectExam } = useCicdNavigationStore();
  const { recordExamAttempt } = useUserDataStore();

  const exam =
    CICD_EXAM_SETS.find((e) => e.id === selectedExamId) || CICD_EXAM_SETS[0];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectExam = (id: string) => {
    selectExam(id);
    setAnswers({});
    setSubmitted(false);
  };

  const correctCount = exam.questions.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const scorePercent = Math.round((correctCount / exam.questions.length) * 100);
  const passed = scorePercent >= exam.passingScorePercent;

  const handleSubmit = () => {
    setSubmitted(true);
    const stringAnswers: Record<string, string> = {};
    Object.entries(answers).forEach(([k, v]) => {
      stringAnswers[k] = String(v);
    });
    recordExamAttempt({
      examId: exam.id,
      examTitle: exam.title,
      scorePercent,
      correctCount,
      totalQuestions: exam.questions.length,
      timeSpentSeconds: 300,
      selectedAnswers: stringAnswers,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6 space-y-6">
      {/* Exam Selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        {CICD_EXAM_SETS.map((ex) => {
          const active = ex.id === exam.id;
          return (
            <button
              key={ex.id}
              onClick={() => handleSelectExam(ex.id)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all space-y-2',
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-white ring-2 ring-cyan-400/50'
                  : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <LevelBadge level={ex.level} size="sm" />
              </div>
              <div className="text-xs font-bold leading-snug">{ex.title}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {ex.questions.length} câu • Điểm đạt: {ex.passingScorePercent}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Exam Header & Score Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2">
        <h1 className="text-lg sm:text-xl font-extrabold text-white">
          {exam.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">{exam.subtitle}</p>

        {submitted && (
          <div
            className={cn(
              'mt-4 rounded-xl border p-4 flex items-center justify-between gap-4',
              passed
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500 bg-rose-500/15 text-rose-200'
            )}
          >
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 shrink-0" />
              <div>
                <div className="text-sm font-extrabold">
                  Kết quả: {correctCount}/{exam.questions.length} câu đúng ({scorePercent}%)
                </div>
                <div className="text-xs">
                  {passed
                    ? 'Chúc mừng! Bạn đã nắm rất vững kiến trúc CI/CD ở cấp độ này.'
                    : 'Hãy xem kỹ phần giải thích và tham chiếu trang PDF bên dưới để củng cố kiến thức.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs font-bold text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm lại đề này</span>
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {exam.questions.map((q, qIdx) => {
          const selectedOpt = answers[q.id];
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-300">
                  Câu {qIdx + 1} / {exam.questions.length}
                </span>
                <span className="font-mono text-xs text-amber-300">
                  📄 {q.pdfRef}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {q.question}
              </h3>

              {q.codeContext && (
                <pre className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-cyan-200 overflow-x-auto">
                  {q.codeContext}
                </pre>
              )}

              <div className="grid gap-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isCorrect = q.correctIndex === optIdx;

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                      }
                      className={cn(
                        'w-full flex items-start gap-2.5 rounded-xl border p-3 text-left text-xs sm:text-sm transition-all',
                        !submitted &&
                          (isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 text-white font-semibold'
                            : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'),
                        submitted &&
                          isCorrect &&
                          'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold',
                        submitted &&
                          isSelected &&
                          !isCorrect &&
                          'border-rose-500 bg-rose-500/20 text-rose-200'
                      )}
                    >
                      <span className="font-mono font-bold text-cyan-400">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                      {submitted && isCorrect && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-3.5 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-cyan-300">Giải thích chuẩn PDF ({q.pdfRef}): </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-lg transition-all"
        >
          Nộp bài & Chấm điểm Sát hạch
        </button>
      )}
    </div>
  );
};
