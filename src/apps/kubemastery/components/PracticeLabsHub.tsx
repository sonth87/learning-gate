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
  ClipboardList,
  ArrowRight,
  Compass,
  ListChecks,
  Terminal,
  Copy,
  Check,
  ShieldAlert,
  Lightbulb,
  Layers,
} from 'lucide-react';
import { PRACTICE_EXERCISES } from '../data/practiceLabsData';
import { useKubeStore } from '../store/useKubeStore';
import { cn } from '@/utils/cn';

type GuidanceTier = 'overview' | 'step-by-step' | 'cli-verify' | 'full-source';

const CATEGORY_FILTERS: {
  id: 'all' | 'dockerfile' | 'compose' | 'k8s-core' | 'k8s-enterprise';
  label: string;
}[] = [
  { id: 'all', label: 'Tất cả (10 Lab)' },
  { id: 'dockerfile', label: 'Dockerfile (2)' },
  { id: 'compose', label: 'Docker Compose (1)' },
  { id: 'k8s-core', label: 'K8s Core Objects (3)' },
  { id: 'k8s-enterprise', label: 'K8s Enterprise & GitOps (4)' },
];

export const PracticeLabsHub: React.FC = () => {
  const {
    selectedPracticeId,
    openPracticeLab,
    solvedPracticeIds,
    markPracticeSolved,
  } = useKubeStore();

  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'dockerfile' | 'compose' | 'k8s-core' | 'k8s-enterprise'
  >('all');

  const filteredExercises = PRACTICE_EXERCISES.filter(
    (ex) => categoryFilter === 'all' || ex.category === categoryFilter
  );

  const exercise =
    PRACTICE_EXERCISES.find((e) => e.id === selectedPracticeId) ||
    filteredExercises[0] ||
    PRACTICE_EXERCISES[0];

  const [code, setCode] = useState(exercise.starterCode);
  const [guidanceTier, setGuidanceTier] = useState<GuidanceTier>('overview');
  const [mobileTab, setMobileTab] = useState<'guide' | 'editor'>('guide');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [ruleResults, setRuleResults] = useState<
    { id: string; desc: string; passed: boolean }[]
  >([]);

  useEffect(() => {
    setCode(exercise.starterCode);
    setGuidanceTier('overview');
    setRuleResults([]);
  }, [exercise.id, exercise.starterCode]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 1600);
  };

  const handleApplyFullSourceToEditor = () => {
    setCode(exercise.solutionCode);
    setMobileTab('editor');
  };

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

  const currentLabNumber =
    PRACTICE_EXERCISES.findIndex((e) => e.id === exercise.id) + 1;

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-slate-900 p-3.5 sm:p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Code2 className="h-4 w-4 shrink-0" />
            <span>
              10 Bài Lab Thực Hành Viết Cấu Hình Chuẩn Doanh Nghiệp (4 Cấp Độ
              Hướng Dẫn → Full Source Code)
            </span>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-0.5 font-mono text-xs font-bold text-emerald-300">
            Đã hoàn thành: {solvedPracticeIds.length}/
            {PRACTICE_EXERCISES.length} bài Lab
          </span>
        </div>
        <h1 className="font-mono text-base sm:text-2xl font-extrabold text-white">
          Thực Hành Từ Dockerfile, Docker Compose Đến Kubernetes Production,
          RBAC, NetworkPolicy & GitOps
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed hidden sm:block">
          Mỗi bài Lab đi kèm hệ thống <strong>Hướng dẫn 4 cấp độ</strong>: từ Tư
          duy kiến trúc → Cầm tay chỉ việc từng bước → Lệnh kiểm thử CLI →{' '}
          <strong className="text-amber-300">
            Cấp cao nhất: Full Source Code hoàn chỉnh & Giải thích từng dòng
          </strong>
          .
        </p>
      </div>

      {/* Category Filter Pills + Lab Selector Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold transition-all cursor-pointer',
                  categoryFilter === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="hidden lg:inline font-mono text-[11px] text-slate-400 shrink-0">
            Đang chọn: Lab #{currentLabNumber}/{PRACTICE_EXERCISES.length}
          </span>
        </div>

        {/* 10 Exercise Selector Cards (Swipeable horizontal strip on mobile, 5-col grid on xl) */}
        <div className="flex lg:grid lg:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {filteredExercises.map((ex) => {
            const globalIdx = PRACTICE_EXERCISES.findIndex(
              (item) => item.id === ex.id
            );
            const active = ex.id === exercise.id;
            const solved = solvedPracticeIds.includes(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => openPracticeLab(ex.id)}
                className={cn(
                  'w-64 sm:w-72 lg:w-auto shrink-0 rounded-xl border p-3 text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer',
                  active
                    ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400/50 shadow-md'
                    : solved
                      ? 'border-emerald-500/35 bg-emerald-500/[0.07] hover:bg-emerald-500/15'
                      : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 border border-slate-700 truncate">
                    Lab #{String(globalIdx + 1).padStart(2, '0')} •{' '}
                    {ex.filename}
                  </span>
                  {solved && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {ex.title.replace(/^Lab \d+:\s*/, '')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Workspace Switcher (< lg) */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1 lg:hidden sticky top-0 z-20 backdrop-blur-md">
        <button
          onClick={() => setMobileTab('guide')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition-all cursor-pointer',
            mobileTab === 'guide'
              ? 'bg-sky-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <ClipboardList className="h-3.5 w-3.5 shrink-0" />
          <span>1. Hướng dẫn 4 Cấp & Full Code</span>
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-bold transition-all cursor-pointer',
            mobileTab === 'editor'
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
          <span>2. Trình Sửa Code & Chấm Điểm</span>
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================
            LEFT 6 COLS: 4-TIER PROGRESSIVE GUIDANCE SYSTEM
           ================================================================= */}
        <div
          className={cn(
            'lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5 space-y-4',
            mobileTab !== 'guide' && 'hidden lg:block'
          )}
        >
          {/* Exercise Title & Scenario */}
          <div className="space-y-1.5 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-md bg-sky-500/15 border border-sky-500/35 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 uppercase">
                Giai đoạn {exercise.stageId.replace('stage-', '')} • Cấp độ:{' '}
                {exercise.level.toUpperCase()}
              </span>
              <span className="font-mono text-[11px] text-amber-300">
                File đích: {exercise.filename}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug">
              {exercise.title}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {exercise.scenario}
            </p>
          </div>

          {/* 4-Level Guidance Selector Bar */}
          <div className="space-y-1.5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chọn Cấp độ Hướng dẫn (Từ Tư duy → Từng bước → Full Source Code):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => setGuidanceTier('overview')}
                className={cn(
                  'rounded-xl border p-2 text-left transition-all cursor-pointer',
                  guidanceTier === 'overview'
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200 ring-1 ring-sky-400'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-sky-400">
                  <Compass className="h-3 w-3 shrink-0" />
                  <span>Cấp 1</span>
                </div>
                <div className="text-[11px] font-bold mt-0.5 line-clamp-1">
                  Tư duy & Yêu cầu
                </div>
              </button>

              <button
                onClick={() => setGuidanceTier('step-by-step')}
                className={cn(
                  'rounded-xl border p-2 text-left transition-all cursor-pointer',
                  guidanceTier === 'step-by-step'
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                  <ListChecks className="h-3 w-3 shrink-0" />
                  <span>Cấp 2</span>
                </div>
                <div className="text-[11px] font-bold mt-0.5 line-clamp-1">
                  Cầm tay chỉ việc
                </div>
              </button>

              <button
                onClick={() => setGuidanceTier('cli-verify')}
                className={cn(
                  'rounded-xl border p-2 text-left transition-all cursor-pointer',
                  guidanceTier === 'cli-verify'
                    ? 'border-violet-400 bg-violet-500/20 text-violet-200 ring-1 ring-violet-400'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-violet-400">
                  <Terminal className="h-3 w-3 shrink-0" />
                  <span>Cấp 3</span>
                </div>
                <div className="text-[11px] font-bold mt-0.5 line-clamp-1">
                  Lệnh Nghiệm thu
                </div>
              </button>

              <button
                onClick={() => setGuidanceTier('full-source')}
                className={cn(
                  'rounded-xl border p-2 text-left transition-all cursor-pointer',
                  guidanceTier === 'full-source'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-amber-400">
                  <Eye className="h-3 w-3 shrink-0" />
                  <span>Cấp 4 (Max)</span>
                </div>
                <div className="text-[11px] font-bold mt-0.5 line-clamp-1">
                  Full Source Code
                </div>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------
              TIER 1 CONTENT: ARCHITECTURE INSIGHT & REQUIREMENTS CHECKLIST
             --------------------------------------------------------------- */}
          {guidanceTier === 'overview' && (
            <div className="space-y-4">
              {/* Architecture Insight Cards */}
              <div className="rounded-xl border border-sky-500/35 bg-sky-500/[0.07] p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Bản chất Kiến trúc & Liên tưởng Thực tế:</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  <strong className="text-sky-300">Vì sao quan trọng: </strong>
                  {exercise.architectureGuide.whyItMatters}
                </p>
                <p className="text-emerald-200 leading-relaxed">
                  <strong className="text-emerald-300">
                    Liên tưởng thực tế:{' '}
                  </strong>
                  {exercise.architectureGuide.realWorldAnalogy}
                </p>
                <div className="rounded-lg border border-rose-500/35 bg-rose-950/30 p-2.5 text-rose-200">
                  <strong className="text-rose-300">
                    ⚠️ Bẫy kinh điển cần tránh:{' '}
                  </strong>
                  {exercise.architectureGuide.commonPitfall}
                </div>
              </div>

              {/* Technical Requirements Checklist */}
              <div className="space-y-2">
                <div className="font-mono text-xs font-bold uppercase text-emerald-400">
                  Danh sách Yêu cầu Kỹ thuật Cần Đạt (
                  {exercise.requirements.length}):
                </div>
                <ul className="space-y-2">
                  {exercise.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/75 p-2.5 text-xs text-slate-200 leading-relaxed"
                    >
                      <span className="font-mono font-bold text-emerald-400 shrink-0">
                        {i + 1}.
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setGuidanceTier('step-by-step')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/45 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Xem Hướng dẫn Từng bước (Cấp 2) →</span>
                </button>
                <button
                  onClick={() => setGuidanceTier('full-source')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/45 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem Full Source Code (Cấp 4)</span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              TIER 2 CONTENT: STEP-BY-STEP WALKTHROUGH WITH CODE SNIPPETS
             --------------------------------------------------------------- */}
          {guidanceTier === 'step-by-step' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-300">
                  Cầm Tay Chỉ Việc Từng Bước ({exercise.stepByStepGuide.length}{' '}
                  bước):
                </span>
                <button
                  onClick={() => setGuidanceTier('full-source')}
                  className="font-mono text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  Mở Full Source Code →
                </button>
              </div>

              {exercise.stepByStepGuide.map((step) => {
                const snippetId = `step-${exercise.id}-${step.stepNumber}`;
                return (
                  <div
                    key={step.stepNumber}
                    className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sky-300">
                        Bước {step.stepNumber}: {step.stepTitle}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyText(snippetId, step.codeSnippet)
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white cursor-pointer shrink-0"
                      >
                        {copiedSnippet === snippetId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">Đã copy</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy bước này</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                      {step.explanation}
                    </p>

                    <pre className="ide-dark-surface overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-300 leading-relaxed">
                      {step.codeSnippet}
                    </pre>
                  </div>
                );
              })}

              {/* Quick Hints Box */}
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 space-y-1 text-xs text-amber-200">
                <div className="font-bold text-amber-300">
                  💡 Tóm tắt nhanh các vị trí cần điền:
                </div>
                {exercise.hints.map((h, i) => (
                  <div key={i}>• {h}</div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------
              TIER 3 CONTENT: CLI VERIFICATION & ACCEPTANCE COMMANDS
             --------------------------------------------------------------- */}
          {guidanceTier === 'cli-verify' && (
            <div className="space-y-3.5">
              <div className="text-xs text-slate-300 leading-relaxed">
                Sau khi viết xong file{' '}
                <code className="font-mono font-bold text-amber-300">
                  {exercise.filename}
                </code>
                , ngoài đời thực kỹ sư DevOps/SRE sẽ gõ các lệnh dưới đây để
                triển khai và nghiệm thu kết quả:
              </div>

              {exercise.cliVerificationChecks.map((chk, idx) => {
                const cmdId = `cli-${exercise.id}-${idx}`;
                return (
                  <div
                    key={idx}
                    className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-violet-300">
                        {idx + 1}. {chk.purpose}
                      </span>
                      <button
                        onClick={() => handleCopyText(cmdId, chk.command)}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white cursor-pointer shrink-0"
                      >
                        {copiedSnippet === cmdId ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>Copy lệnh</span>
                      </button>
                    </div>

                    <div className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 font-mono text-[11px] text-amber-300 break-all">
                      <span className="text-emerald-400">$</span> {chk.command}
                    </div>

                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase text-slate-400">
                        Kết quả đầu ra chuẩn (Expected Output):
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap border-l-2 border-emerald-500 pl-2.5 font-mono text-[11px] text-slate-200 leading-relaxed">
                        {chk.expectedOutput}
                      </pre>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------------------------------------------------------
              TIER 4 CONTENT (HIGHEST LEVEL): FULL PRODUCTION SOURCE CODE
              & LINE-BY-LINE ANNOTATIONS
             --------------------------------------------------------------- */}
          {guidanceTier === 'full-source' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                <div className="text-xs text-amber-200">
                  <strong className="text-amber-300">
                    🏆 Cấp độ Hướng dẫn Cao nhất:{' '}
                  </strong>
                  Toàn bộ Full Source Code chuẩn Production của file{' '}
                  <code className="font-mono font-bold">
                    {exercise.filename}
                  </code>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleCopyText(
                        `full-${exercise.id}`,
                        exercise.solutionCode
                      )
                    }
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedSnippet === `full-${exercise.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Đã copy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Full Code</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleApplyFullSourceToEditor}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-400 px-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer"
                  >
                    <span>Đưa vào Trình Soạn Thảo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Full Source Code Viewer */}
              <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900 px-3.5 py-2 font-mono text-xs font-bold text-emerald-300">
                  FULL SOURCE CODE: {exercise.filename}
                </div>
                <pre className="overflow-x-auto p-3.5 font-mono text-[11px] sm:text-xs text-slate-100 leading-relaxed">
                  {exercise.solutionCode}
                </pre>
              </div>

              {/* Detailed Section-by-Section Explanations */}
              <div className="space-y-2">
                <div className="font-mono text-[11px] font-bold uppercase text-sky-400">
                  Giải thích Chi tiết Từng Khối Lệnh trong Full Source Code:
                </div>
                <div className="space-y-2">
                  {exercise.solutionAnnotations.map((ann, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/85 p-3 text-xs space-y-1"
                    >
                      <code className="font-mono font-bold text-amber-300">
                        {ann.section}
                      </code>
                      <p className="text-slate-300 leading-relaxed">
                        {ann.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================
            RIGHT 6 COLS: LIVE CODE EDITOR & AUTOMATED RULE VALIDATOR
           ================================================================= */}
        <div
          className={cn(
            'lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 sm:p-5 space-y-4',
            mobileTab !== 'editor' && 'hidden lg:block'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-300">
              <FileCode2 className="h-4 w-4 shrink-0" />
              <span>Soạn thảo: {exercise.filename}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCode(exercise.starterCode);
                  setRuleResults([]);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Làm lại</span>
              </button>

              <button
                onClick={() => setCode(exercise.solutionCode)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Điền Full Source Code Chuẩn</span>
              </button>
            </div>
          </div>

          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={20}
              spellCheck={false}
              className="w-full bg-slate-950 p-3.5 sm:p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-none resize-y"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-md transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Chấm Điểm & Kiểm Tra Cấu Hình (Lab #{currentLabNumber})</span>
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
