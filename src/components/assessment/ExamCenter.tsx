import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  History,
  Lightbulb,
  Shuffle,
  Zap,
  ClipboardCheck,
} from 'lucide-react';
import { ALL_EXAMS } from '@/data/exams/examsData';
import { ExamSet } from '@/types/assessment.types';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

export const ExamCenter: React.FC = () => {
  const { selectedExamId, selectExam } = useNavigationStore();
  const { examHistory, recordExamAttempt } = useUserDataStore();

  const [customExam, setCustomExam] = useState<ExamSet | null>(null);
  const [instantFeedbackMode, setInstantFeedbackMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  const totalQuestionBankCount = useMemo(
    () => ALL_EXAMS.reduce((sum, e) => sum + e.questions.length, 0),
    []
  );

  const currentExam =
    customExam ||
    ALL_EXAMS.find((e) => e.id === selectedExamId) ||
    ALL_EXAMS[0];

  const handleSelectExam = (id: string) => {
    setCustomExam(null);
    selectExam(id);
    setSelectedAnswers({});
    setSubmitted(false);
    setStartedAt(Date.now());
  };

  const handleGenerateRandomQuiz = (count: number) => {
    const allQuestions = ALL_EXAMS.flatMap((e) => e.questions);
    const copy = [...allQuestions];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const pickedQuestions = copy.slice(0, Math.min(count, copy.length));
    setCustomExam({
      id: `random-sprint-${count}`,
      title: `Đề Ngẫu Nhiên Tốc Chiến (${pickedQuestions.length} Câu từ Ngân hàng ${allQuestions.length} Câu)`,
      description:
        'Tổ hợp ngẫu nhiên các câu hỏi Trắc nghiệm, Săn Bug và Giải đố Output từ Giai đoạn 1 đến Giai đoạn 7.',
      targetLevel: 'all',
      durationMinutes: count,
      passingScorePercent: 75,
      questions: pickedQuestions,
    });
    setSelectedAnswers({});
    setSubmitted(false);
    setStartedAt(Date.now());
  };

  const handleSubmit = async () => {
    const total = currentExam.questions.length;
    let correct = 0;
    for (const q of currentExam.questions) {
      if (selectedAnswers[q.id] === q.correctOptionId) {
        correct += 1;
      }
    }
    const scorePercent = Math.round((correct / total) * 100);
    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000)
    );

    setSubmitted(true);
    await recordExamAttempt({
      examId: currentExam.id,
      examTitle: currentExam.title,
      scorePercent,
      correctCount: correct,
      totalQuestions: total,
      timeSpentSeconds,
      selectedAnswers,
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setStartedAt(Date.now());
  };

  const correctCount = currentExam.questions.filter(
    (q) => selectedAnswers[q.id] === q.correctOptionId
  ).length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const scorePercent = Math.round(
    (correctCount / currentExam.questions.length) * 100
  );

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      {/* Header & Exam Selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold text-white">
                  Trung tâm Thi Sát hạch, Giải đố Output & Trắc nghiệm Chuyên sâu
                </h1>
                <span className="rounded-md bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-300">
                  {ALL_EXAMS.length} Bộ đề • {totalQuestionBankCount} Câu hỏi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mỗi phương án đều có giải thích chi tiết tại sao Đúng / tại sao Sai và lưu lịch sử làm bài trong IndexedDB.
              </p>
            </div>
          </div>

          {/* Mode Toggle & Random Sprint Generator */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setInstantFeedbackMode((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                instantFeedbackMode
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              )}
              title="Bật để xem ngay giải thích Đúng/Sai ngay khi bấm chọn từng câu"
            >
              {instantFeedbackMode ? (
                <>
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Chế độ: Biết đáp án ngay</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5 text-violet-400" />
                  <span>Chế độ: Nộp bài cuối giờ</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleGenerateRandomQuiz(10)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Đề Ngẫu nhiên (10 câu)</span>
            </button>

            <button
              onClick={() => handleGenerateRandomQuiz(20)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition-colors cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Marathon (20 câu)</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {ALL_EXAMS.map((exam) => {
            const active = !customExam && exam.id === currentExam.id;
            return (
              <button
                key={exam.id}
                onClick={() => handleSelectExam(exam.id)}
                className={cn(
                  'w-[260px] sm:w-auto shrink-0 snap-start rounded-xl border p-3.5 text-left transition-all space-y-1.5 cursor-pointer flex flex-col justify-between',
                  active
                    ? 'border-violet-500/60 bg-violet-500/15 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    {exam.targetLevel !== 'all' && (
                      <LevelBadge level={exam.targetLevel} />
                    )}
                    <span className="font-mono text-[11px] text-slate-400">
                      {exam.questions.length} câu • Đạt {exam.passingScorePercent}%
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">
                    {exam.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 pt-1">
                  {exam.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Exam Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-xs">
        <div className="font-bold text-white">{currentExam.title}</div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>
            Đã chọn:{' '}
            <strong className="text-sky-300">
              {answeredCount}/{currentExam.questions.length}
            </strong>{' '}
            câu
          </span>
          {instantFeedbackMode && answeredCount > 0 && (
            <span>
              Đúng hiện tại:{' '}
              <strong className="text-emerald-400">
                {correctCount}/{answeredCount}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Score Banner when submitted */}
      {submitted && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5',
            scorePercent >= currentExam.passingScorePercent
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : 'border-amber-500/40 bg-amber-950/20'
          )}
        >
          <div className="flex items-center gap-3">
            <Award
              className={cn(
                'h-8 w-8',
                scorePercent >= currentExam.passingScorePercent
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              )}
            />
            <div>
              <h3 className="text-base font-extrabold text-white">
                Kết quả: {scorePercent}% ({correctCount}/
                {currentExam.questions.length} câu đúng)
              </h3>
              <p className="text-xs text-slate-300">
                {scorePercent >= currentExam.passingScorePercent
                  ? 'Chúc mừng! Bạn đã vượt qua ngưỡng sát hạch của bộ đề này.'
                  : 'Hãy xem kỹ phần giải thích chi tiết từng đáp án bên dưới và thử lại!'}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" /> Làm lại đề này
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {currentExam.questions.map((q, qIdx) => {
          const picked = selectedAnswers[q.id];
          const showFeedback =
            submitted || (instantFeedbackMode && Boolean(picked));

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-violet-300">
                  Câu hỏi #{qIdx + 1} / {currentExam.questions.length}
                </span>
                <LevelBadge level={q.level} showVi />
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                <RichTextWithTerms text={q.question} />
              </h3>

              {q.codeSnippet && (
                <pre className="ide-dark-surface overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16] p-3.5 font-mono text-xs leading-5">
                  <code>{renderHighlightedPython(q.codeSnippet)}</code>
                </pre>
              )}

              {/* Options */}
              <div className="grid gap-2.5">
                {q.options.map((opt) => {
                  const isSelected = picked === opt.id;
                  const isCorrect = opt.id === q.correctOptionId;

                  let borderStyle =
                    'border-slate-800 bg-slate-950/70 hover:border-slate-700';
                  if (!showFeedback && isSelected) {
                    borderStyle = 'border-amber-500/60 bg-amber-500/15';
                  } else if (showFeedback) {
                    if (isCorrect) {
                      borderStyle = 'border-emerald-500/60 bg-emerald-950/25';
                    } else if (isSelected && !isCorrect) {
                      borderStyle = 'border-rose-500/60 bg-rose-950/25';
                    }
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        if (!submitted) {
                          setSelectedAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt.id,
                          }));
                        }
                      }}
                      className={cn(
                        'cursor-pointer rounded-xl border p-3.5 transition-all space-y-1.5',
                        borderStyle
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-100">
                          <RichTextWithTerms text={opt.text} />
                        </span>
                        {showFeedback && (
                          <span className="shrink-0">
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4 text-rose-400" />
                            ) : null}
                          </span>
                        )}
                      </div>

                      {showFeedback && (
                        <p
                          className={cn(
                            'text-[11px] pt-1 border-t border-slate-800/80',
                            isCorrect ? 'text-emerald-300' : 'text-slate-400'
                          )}
                        >
                          <RichTextWithTerms text={opt.whyRightOrWrong} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall Explanation after submit or instant feedback */}
              {showFeedback && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-indigo-300">
                    Giải thích tổng kết:
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    <RichTextWithTerms text={q.overallExplanation} />
                  </p>
                  {q.analogyReminder && (
                    <div className="flex items-center gap-1.5 text-amber-300 pt-1">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                      <span>{q.analogyReminder}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 px-6 py-3 text-sm font-extrabold text-slate-950 hover:opacity-95 shadow-lg cursor-pointer"
          >
            Nộp bài & Lưu Kết quả Sát hạch ({answeredCount}/
            {currentExam.questions.length} câu)
          </button>
        </div>
      )}

      {/* Attempt History from IndexedDB */}
      {examHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <History className="h-4 w-4 text-amber-400" />
            <span>Lịch sử Làm bài Thi (Lưu trong IndexedDB)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {examHistory.slice(0, 6).map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    {att.examTitle}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(att.completedAt).toLocaleString('vi-VN')} •{' '}
                    {att.timeSpentSeconds}s
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 font-mono font-bold',
                    att.scorePercent >= 75
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  )}
                >
                  {att.scorePercent}% ({att.correctCount}/{att.totalQuestions})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
