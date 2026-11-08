import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Terminal,
} from 'lucide-react';
import { PracticeExercise, VerificationResult } from '@/types/practice.types';
import { verifyExerciseCode } from '@/utils/codeVerifier';
import { useUserDataStore } from '@/stores/useUserDataStore';

export const CodeWorkspace: React.FC<{ exercise: PracticeExercise }> = ({
  exercise,
}) => {
  const { submissions, saveExerciseSubmission } = useUserDataStore();
  const savedRecord = submissions[exercise.id];

  const [code, setCode] = useState(savedRecord?.code || exercise.starterCode);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    const existing = submissions[exercise.id];
    setCode(existing?.code || exercise.starterCode);
    setResult(null);
  }, [exercise.id, exercise.starterCode, submissions]);

  const handleRunTests = async () => {
    const res = verifyExerciseCode(exercise, code);
    setResult(res);
    await saveExerciseSubmission(exercise.id, code, res.allPassed);
  };

  const handleReset = () => {
    setCode(exercise.starterCode);
    setResult(null);
  };

  const handleFillSolution = () => {
    setCode(exercise.solutionCode);
    const res = verifyExerciseCode(exercise, exercise.solutionCode);
    setResult(res);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="space-y-4">
      {/* Editor Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs font-semibold text-slate-300">
              solution.py
            </span>
            {savedRecord?.passed && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                ✓ Đã vượt qua
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleFillSolution}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Điền Lời giải mẫu</span>
            </button>

            <button
              onClick={handleRunTests}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Chạy & Kiểm tra Test Cases</span>
            </button>
          </div>
        </div>

        {/* Code Textarea with Line Numbers */}
        <div className="relative flex font-mono text-xs leading-6">
          <div className="select-none border-r border-slate-800/80 bg-slate-900/50 py-4 px-3 text-right text-slate-600">
            {Array.from({ length: Math.max(lineCount, 12) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={Math.max(lineCount + 2, 12)}
            className="w-full resize-y bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Test Cases & Output Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Bộ Kiểm thử (Test Cases) & Kết quả Chấm bài
            </h4>
          </div>
          {result && (
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                result.allPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              Đạt {result.passedCount}/{result.totalCount} Test Cases
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {(result ? result.results : exercise.testCases).map((tc, idx) => {
            const isVerified = 'passed' in tc;
            const passed = isVerified ? tc.passed : false;

            return (
              <div
                key={idx}
                className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                  !isVerified
                    ? 'border-slate-800 bg-slate-950/60'
                    : passed
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {isVerified ? (
                      passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-600" />
                    )}
                    <span>
                      Test #{idx + 1}: {tc.description}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-slate-400">
                  Kỳ vọng Output: <span className="text-sky-300">{tc.expectedOutput}</span>
                </div>

                {isVerified && (
                  <div
                    className={`text-xs pt-1 ${
                      passed ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {tc.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {result && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">
              Console Output:
            </div>
            <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap">
              {result.simulatedStdout}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
