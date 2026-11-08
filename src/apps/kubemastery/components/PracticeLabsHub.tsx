import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Eye,
  Play,
  FileCode2,
} from 'lucide-react';
import { PRACTICE_EXERCISES } from '../data/practiceLabsData';
import { useKubeStore } from '../store/useKubeStore';
import { cn } from '@/utils/cn';

export const PracticeLabsHub: React.FC = () => {
  const {
    selectedPracticeId,
    openPracticeLab,
    solvedPracticeIds,
    markPracticeSolved,
  } = useKubeStore();

  const exercise =
    PRACTICE_EXERCISES.find((e) => e.id === selectedPracticeId) ||
    PRACTICE_EXERCISES[0];

  const [code, setCode] = useState(exercise.starterCode);
  const [showHints, setShowHints] = useState(false);
  const [ruleResults, setRuleResults] = useState<
    { id: string; desc: string; passed: boolean }[]
  >([]);

  useEffect(() => {
    setCode(exercise.starterCode);
    setShowHints(false);
    setRuleResults([]);
  }, [exercise.id, exercise.starterCode]);

  const handleVerify = () => {
    const results = exercise.validationRules.map((rule) => {
      const hasAllRequired = rule.mustContain.every((s) => code.includes(s));
      const hasNoForbidden = (rule.mustNotContain || []).every(
        (s) => !code.includes(s)
      );
      return {
        id: rule.id,
        desc: rule.description,
        passed: hasAllRequired && hasNoForbidden,
      };
    });

    setRuleResults(results);
    if (results.every((r) => r.passed)) {
      markPracticeSolved(exercise.id);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-slate-900 p-4 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Code2 className="h-4 w-4 shrink-0" />
            <span>Phòng Luyện Tập Viết Cấu Hình Chuẩn Doanh Nghiệp (Hands-On Config Labs)</span>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-bold text-emerald-300">
            Đã hoàn thành: {solvedPracticeIds.length}/{PRACTICE_EXERCISES.length} bài tập
          </span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Thực Hành Viết Dockerfile, Docker Compose & Kubernetes Production YAML
        </h1>
      </div>

      {/* Exercise Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRACTICE_EXERCISES.map((ex, idx) => {
          const active = ex.id === exercise.id;
          const solved = solvedPracticeIds.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => openPracticeLab(ex.id)}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between space-y-2',
                active
                  ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/50'
                  : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 border border-slate-700">
                  Lab #{idx + 1} • {ex.filename}
                </span>
                {solved && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <div className="text-xs font-bold text-white line-clamp-2">
                {ex.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Requirements & Hints */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5 border-b border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              {exercise.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {exercise.scenario}
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-xs font-bold uppercase text-sky-400">
              Yêu cầu Kỹ thuật Cần Đạt ({exercise.requirements.length}):
            </div>
            <ul className="space-y-2">
              {exercise.requirements.map((req, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-xs text-slate-200"
                >
                  <span className="font-mono font-bold text-emerald-400">
                    {i + 1}.
                  </span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setShowHints((h) => !h)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{showHints ? 'Ẩn gợi ý' : 'Xem Gợi ý Cú pháp'}</span>
          </button>

          {showHints && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-1.5 text-xs text-amber-200">
              {exercise.hints.map((h, i) => (
                <div key={i}>💡 {h}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right 7 Cols: Code Editor & Rule Validator */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-300">
              <FileCode2 className="h-4 w-4" />
              <span>Soạn thảo: {exercise.filename}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCode(exercise.starterCode);
                  setRuleResults([]);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Làm lại</span>
              </button>

              <button
                onClick={() => setCode(exercise.solutionCode)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Điền Đáp án Chuẩn</span>
              </button>
            </div>
          </div>

          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={19}
              spellCheck={false}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-none resize-y"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-md transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Chấm Điểm & Kiểm Tra Cấu Hình</span>
          </button>

          {ruleResults.length > 0 && (
            <div className="space-y-2 pt-2">
              {ruleResults.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium',
                    r.passed
                      ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                      : 'border-rose-500/45 bg-rose-500/15 text-rose-200'
                  )}
                >
                  {r.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span>{r.desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
