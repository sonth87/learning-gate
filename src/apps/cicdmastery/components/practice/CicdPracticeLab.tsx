import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Eye,
  Lightbulb,
  Sparkles,
  FileCode2,
} from 'lucide-react';
import { CICD_PRACTICE_EXERCISES } from '../../data/cicdPracticeData';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const CicdPracticeLab: React.FC = () => {
  const { selectedExerciseId, selectExercise } = useCicdNavigationStore();
  const { submissions, saveExerciseSubmission } = useUserDataStore();

  const exercise =
    CICD_PRACTICE_EXERCISES.find((e) => e.id === selectedExerciseId) ||
    CICD_PRACTICE_EXERCISES[0];

  const [code, setCode] = useState(exercise.starterCode);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    allPassed: boolean;
    ruleResults: {
      id: string;
      description: string;
      passed: boolean;
      errorHint: string;
    }[];
  } | null>(null);

  useEffect(() => {
    const saved = submissions[exercise.id];
    setCode(saved?.code || exercise.starterCode);
    setShowHints(false);
    setShowSolution(false);
    setCheckResult(null);
  }, [exercise.id, exercise.starterCode, submissions]);

  const handleVerifyConfig = () => {
    const ruleResults = exercise.validationRules.map((rule) => {
      const hasRequired = rule.mustContainAny.some((sub) =>
        code.includes(sub)
      );
      const hasForbidden = rule.mustNotContain
        ? rule.mustNotContain.some((sub) => code.includes(sub))
        : false;
      return {
        id: rule.id,
        description: rule.description,
        passed: hasRequired && !hasForbidden,
        errorHint: rule.errorHint,
      };
    });

    const allPassed = ruleResults.every((r) => r.passed);
    setCheckResult({ checked: true, allPassed, ruleResults });
    saveExerciseSubmission(exercise.id, code, allPassed);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Exercise Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {CICD_PRACTICE_EXERCISES.map((ex, idx) => {
          const active = ex.id === exercise.id;
          const solved = submissions[ex.id]?.passed;
          return (
            <button
              key={ex.id}
              onClick={() => selectExercise(ex.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all',
                active
                  ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              )}
            >
              {solved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <FileCode2 className="h-4 w-4 text-cyan-400" />
              )}
              <span>Bài {idx + 1}: {ex.category.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Scenario & Checklist (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
              📄 {exercise.pdfRef}
            </span>
            <LevelBadge level={exercise.level} />
          </div>

          <h1 className="text-base sm:text-lg font-extrabold text-white">
            {exercise.title}
          </h1>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-slate-200 space-y-1">
            <div className="font-bold text-amber-300">📌 Bối cảnh Thực tế:</div>
            <p className="leading-relaxed">{exercise.scenario}</p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {exercise.taskDescription}
          </p>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Yêu cầu Kiểm định Tự động (Linter & Architecture Gate):
            </div>
            <ul className="space-y-2">
              {exercise.requirements.map((req, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setShowHints((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>{showHints ? 'Ẩn Gợi ý' : 'Xem Gợi ý'}</span>
            </button>
            <button
              onClick={() => {
                setShowSolution(true);
                setCode(exercise.solutionCode);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>Điền Cấu hình Mẫu Chuẩn</span>
            </button>
          </div>

          {showHints && (
            <div className="rounded-xl border border-amber-500/30 bg-slate-950 p-3.5 space-y-1.5 text-xs text-amber-200">
              {exercise.hints.map((h, i) => (
                <div key={i}>💡 {h}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Code Editor & Verification Result (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-cyan-300">
                <Code2 className="h-4 w-4" />
                <span>CI/CD Configuration Studio ({exercise.language.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCode(exercise.starterCode);
                    setCheckResult(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleVerifyConfig}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Kiểm tra & Chạy Thử Cấu hình</span>
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={22}
              className="w-full bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 focus:outline-none resize-y"
            />
          </div>

          {/* Verification Output */}
          {checkResult && (
            <div
              className={cn(
                'rounded-2xl border p-5 space-y-3',
                checkResult.allPassed
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-rose-500/50 bg-rose-500/10'
              )}
            >
              <div className="flex items-center gap-2 text-sm font-extrabold">
                {checkResult.allPassed ? (
                  <span className="text-emerald-300 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    CHÍNH XÁC 100%! Cấu hình đạt chuẩn kiến trúc thực chiến!
                  </span>
                ) : (
                  <span className="text-rose-300">
                    ⚠️ Còn một số chốt kiểm tra chưa đạt. Hãy xem chi tiết bên dưới:
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {checkResult.ruleResults.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-2 rounded-lg bg-slate-950/80 p-2.5 text-xs"
                  >
                    {r.passed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <div
                        className={cn(
                          'font-bold',
                          r.passed ? 'text-emerald-300' : 'text-rose-300'
                        )}
                      >
                        {r.description}
                      </div>
                      {!r.passed && (
                        <div className="text-slate-300 mt-0.5">
                          👉 {r.errorHint}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {checkResult.allPassed && (
                <p className="text-xs text-emerald-200 pt-1">
                  🎓 {exercise.explanationAfterPass}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
