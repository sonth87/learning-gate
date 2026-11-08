import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpenCheck,
  AlertOctagon,
  CheckSquare,
  BookOpen,
  FileText,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { PracticeExercise } from '@/types/practice.types';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { cn } from '@/utils/cn';

type GuideTab = 'problem' | 'hints' | 'mistakes' | 'solution';

export const ExerciseGuidePanel: React.FC<{ exercise: PracticeExercise }> = ({
  exercise,
}) => {
  const selectLesson = useNavigationStore((s) => s.selectLesson);
  const [activeTab, setActiveTab] = useState<GuideTab>('problem');
  const [revealedHints, setRevealedHints] = useState(1);

  useEffect(() => {
    setActiveTab('problem');
    setRevealedHints(1);
  }, [exercise.id]);

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 overflow-hidden flex flex-col">
      {/* Sub-navigation Tabs for Problem Guide */}
      <div
        role="tablist"
        aria-label="Thông tin bài tập thực hành"
        className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/70 p-1.5 overflow-x-auto"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'problem'}
          onClick={() => setActiveTab('problem')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
            activeTab === 'problem'
              ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <FileText className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span>Đề bài</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'hints'}
          onClick={() => setActiveTab('hints')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
            activeTab === 'hints'
              ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <HelpCircle className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          <span>Gợi ý ({exercise.hints.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'mistakes'}
          onClick={() => setActiveTab('mistakes')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
            activeTab === 'mistakes'
              ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <AlertOctagon className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
          <span>Bẫy thường gặp</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'solution'}
          onClick={() => setActiveTab('solution')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
            activeTab === 'solution'
              ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <BookOpenCheck className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
          <span>Phân tích Lời giải</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="p-5 space-y-4">
        {/* TAB 1: PROBLEM STATEMENT */}
        {activeTab === 'problem' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Đề bài & Yêu cầu Kỹ thuật
              </span>
              <button
                onClick={() => selectLesson(exercise.relatedLessonId)}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Xem lại Lý thuyết</span>
              </button>
            </div>

            <p className="text-sm text-slate-100 leading-relaxed">
              <RichTextWithTerms text={exercise.problemStatement} />
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold">
                Bối cảnh thực tế:{' '}
              </strong>
              <RichTextWithTerms text={exercise.realWorldContext} />
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <CheckSquare
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
                <span>Tiêu chí cần đạt:</span>
              </div>
              <ul className="space-y-2">
                {exercise.requirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-xs text-slate-300"
                  >
                    <span className="font-mono text-emerald-400 font-bold">
                      0{idx + 1}.
                    </span>
                    <span className="leading-relaxed">
                      <RichTextWithTerms text={req} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESSIVE HINTS */}
        {activeTab === 'hints' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>
                  Gợi ý từng bước ({revealedHints}/{exercise.hints.length})
                </span>
              </div>
              {revealedHints < exercise.hints.length && (
                <button
                  onClick={() => setRevealedHints((h) => h + 1)}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                  Mở gợi ý tiếp theo
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {exercise.hints.slice(0, revealedHints).map((hint, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-500/25 bg-slate-950/80 p-3.5 text-xs text-amber-100 leading-relaxed space-y-1"
                >
                  <div className="font-mono text-[10px] font-bold uppercase text-amber-400">
                    Gợi ý #{idx + 1}
                  </div>
                  <div>
                    <RichTextWithTerms text={hint} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COMMON MISTAKES */}
        {activeTab === 'mistakes' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
              <AlertOctagon className="h-4 w-4" aria-hidden="true" />
              <span>Các lỗi phổ biến thường mắc ở bài này</span>
            </div>
            <ul className="space-y-2.5">
              {exercise.commonMistakes.map((m, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-3.5 text-xs text-rose-100/90 flex items-start gap-2.5 leading-relaxed"
                >
                  <XCircle
                    className="h-4 w-4 text-rose-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <RichTextWithTerms text={m} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TAB 4: SOLUTION WALKTHROUGH */}
        {activeTab === 'solution' && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
              <span>Phân tích tư duy & Giải thích từng bước</span>
            </div>

            <div className="space-y-3">
              {exercise.solutionWalkthrough.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2"
                >
                  <div className="text-xs font-bold text-indigo-300">
                    {step.stepTitle}
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-900 p-2.5 font-mono text-xs text-sky-200">
                    <code>{step.codeSnippet}</code>
                  </pre>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <RichTextWithTerms text={step.explanation} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
