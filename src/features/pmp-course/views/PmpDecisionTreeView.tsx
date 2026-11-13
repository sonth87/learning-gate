import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  FileText,
  GitBranch,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react';
import { usePmpDecisionTree, usePmpLinks } from '../data';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '../store';
import { buildMindmapUrl } from '../links';
import type { DecisionBranchMeta, DecisionLeafNode, DecisionNode } from '../types';
import { Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter } from '../components/PmpShared';
import { cn } from '@/utils/cn';

const BRANCH_TONE: Record<DecisionBranchMeta['tone'], string> = {
  amber: 'border-amber-500/40 bg-amber-500/[0.07] hover:border-amber-400/75',
  emerald: 'border-emerald-500/40 bg-emerald-500/[0.07] hover:border-emerald-400/75',
  sky: 'border-sky-500/40 bg-sky-500/[0.07] hover:border-sky-400/75',
  violet: 'border-violet-500/40 bg-violet-500/[0.07] hover:border-violet-400/75',
  rose: 'border-rose-500/40 bg-rose-500/[0.07] hover:border-rose-400/75',
  cyan: 'border-cyan-500/40 bg-cyan-500/[0.07] hover:border-cyan-400/75',
};

export const PmpDecisionTreeView: React.FC = () => {
  const { data: tree } = usePmpDecisionTree();
  const { data: linksMap } = usePmpLinks();
  const selectedBranchFromStore = usePmpAppStore((x) => x.selectedDecisionBranchId);
  const setActiveTab = usePmpAppStore((x) => x.setActiveTab);
  const openQuickPreview = usePmpAppStore((x) => x.openQuickPreview);
  const go = usePmpNav((x) => x.go);
  const s = usePmpProgress((x) => x.state);
  const markVisited = usePmpProgress((x) => x.markEvidenceVisited);
  const recordCaseDrill = usePmpProgress((x) => x.recordCaseDrill);

  const [mode, setMode] = useState<'compass' | 'drill'>('compass');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [path, setPath] = useState<{ nodeId: string; chosenLabel?: string }[]>([]);

  // Case drill state
  const [caseIdx, setCaseIdx] = useState(0);
  const [caseBranchId, setCaseBranchId] = useState<string | null>(null);
  const [casePath, setCasePath] = useState<{ nodeId: string; chosenLabel?: string }[]>([]);
  const [caseFeedback, setCaseFeedback] = useState<{ ok: boolean; xp: number; leaf: DecisionLeafNode } | null>(null);

  useEffect(() => {
    if (!tree || !selectedBranchFromStore) return;
    const found = tree.branches.find((b) => b.id === selectedBranchFromStore);
    if (found) {
      setMode('compass');
      setBranchId(found.id);
      setPath([{ nodeId: found.entryNodeId }]);
    }
  }, [selectedBranchFromStore, tree]);

  if (!tree) return <Spinner />;

  const selectCompassBranch = (b: DecisionBranchMeta) => {
    setBranchId(b.id);
    setPath([{ nodeId: b.entryNodeId }]);
  };

  const resetCompass = () => {
    setBranchId(null);
    setPath([]);
  };

  const chooseCompassOption = (label: string, nextNodeId: string) => {
    setPath((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], chosenLabel: label };
      }
      updated.push({ nodeId: nextNodeId });
      return updated;
    });
  };

  const jumpBackToStep = (index: number) => {
    setPath((prev) => prev.slice(0, index + 1).map((item, idx, arr) => (idx === arr.length - 1 ? { nodeId: item.nodeId } : item)));
  };

  const currentNode: DecisionNode | null =
    path.length > 0 ? (tree.nodes[path[path.length - 1].nodeId] ?? null) : null;

  // Case drill helpers
  const activeCase = tree.challenges[caseIdx] ?? tree.challenges[0];
  const caseCurrentNode: DecisionNode | null =
    casePath.length > 0 ? (tree.nodes[casePath[casePath.length - 1].nodeId] ?? null) : null;

  const startCaseBranch = (b: DecisionBranchMeta) => {
    setCaseBranchId(b.id);
    setCasePath([{ nodeId: b.entryNodeId }]);
    setCaseFeedback(null);
  };

  const chooseCaseOption = (label: string, nextNodeId: string) => {
    const nextNode = tree.nodes[nextNodeId];
    setCasePath((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], chosenLabel: label };
      }
      updated.push({ nodeId: nextNodeId });
      return updated;
    });
    if (nextNode && nextNode.kind === 'outcome' && activeCase) {
      const ok = nextNode.id === activeCase.expectedLeafId;
      const xp = recordCaseDrill(activeCase.id, ok);
      setCaseFeedback({ ok, xp, leaf: nextNode });
    }
  };

  const switchCase = (idx: number) => {
    setCaseIdx(idx);
    setCaseBranchId(null);
    setCasePath([]);
    setCaseFeedback(null);
  };

  const passedCasesCount = tree.challenges.filter((c) => s.exercises[c.id]?.status === 'passed').length;

  const renderOutcomeCard = (leaf: DecisionLeafNode) => (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.08] via-slate-900/90 to-slate-950 p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
            PHẢN XẠ CHUẨN PMI · KẾT LUẬN HÀNH ĐỘNG
          </div>
          <h3 className="mt-1 text-lg sm:text-xl font-extrabold text-white">{leaf.title}</h3>
        </div>
        <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
          {leaf.provenanceLabel}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-slate-950/85 p-4">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Nên làm ĐẦU TIÊN (FIRST / NEXT)</span>
          </div>
          <ol className="space-y-2 text-xs sm:text-sm text-slate-100">
            {leaf.firstAction.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-300">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{act}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-rose-500/30 bg-slate-950/85 p-4">
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Tuyệt đối tránh (Bẫy đáp án nhiễu)</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-rose-100">
              {leaf.neverDo.map((bad, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-rose-400">✗</span>
                  <span className="leading-relaxed">{bad}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/85 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <FileText className="h-3.5 w-3.5" />
              <span>Tài liệu / Quy trình cần mở hoặc cập nhật</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {leaf.artifactsToCheck.map((art) => (
                <span
                  key={art}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-200"
                >
                  {art}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Links to Module & PMP Mindmap */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab('learn');
            go({ name: 'module', id: leaf.moduleId });
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Ôn lại Cẩm nang {leaf.moduleId}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {leaf.evidenceLinkIds.map((lid) => {
            const lnk = linksMap?.[lid];
            if (!lnk) return null;
            return (
              <div key={lid} className="inline-flex items-center gap-1">
                <a
                  href={buildMindmapUrl(lnk)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markVisited(lnk.linkId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{lnk.label}</span>
                </a>
                <button
                  type="button"
                  onClick={() => openQuickPreview(lnk)}
                  title="Xem nhanh trên Desktop"
                  className="hidden lg:inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-2 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-3.5 sm:p-6">
      {/* Header + Mode Switch */}
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-500/12 via-slate-900/95 to-slate-950 p-4 sm:p-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/45 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-cyan-300">
            <GitBranch className="h-3.5 w-3.5" />
            <span>CÔNG CỤ CHẨN ĐOÁN TÌNH HUỐNG XÁC ĐỊNH</span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-white">
            Cây Quyết Định Tình Huống PMP
          </h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-300 leading-relaxed">
            Không đoán mò theo cảm tính! Chọn đúng loại tín hiệu đề bài, rẽ nhánh 2–3 bước theo phương pháp và vai trò để tìm ra hành động <b>FIRST / NEXT / BEST</b> chuẩn PMI.
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setMode('compass')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              mode === 'compass' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>La bàn tra cứu ({tree.branches.length} nhánh)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('drill')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              mode === 'drill' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            )}
          >
            <Target className="h-3.5 w-3.5" />
            <span>
              Thử thách thực chiến ({passedCasesCount}/{tree.challenges.length})
            </span>
          </button>
        </div>
      </header>

      {mode === 'compass' ? (
        <>
          {/* Branch Picker */}
          {!branchId ? (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-white">{tree.rootPrompt}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tree.branches.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectCompassBranch(b)}
                    className={cn(
                      'flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer',
                      BRANCH_TONE[b.tone]
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-extrabold text-amber-300">NHÁNH 0{idx + 1}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="mt-1.5 text-sm sm:text-base font-extrabold text-white leading-snug">
                        {b.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">{b.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={resetCompass}
                    className="font-semibold text-amber-400 hover:underline cursor-pointer"
                  >
                    7 Nhánh gốc
                  </button>
                  {path.map((step, idx) => (
                    <React.Fragment key={`${step.nodeId}-${idx}`}>
                      <span className="text-slate-600">→</span>
                      <button
                        type="button"
                        onClick={() => jumpBackToStep(idx)}
                        className={cn(
                          'rounded px-1.5 py-0.5 transition-colors cursor-pointer',
                          idx === path.length - 1
                            ? 'bg-amber-500/20 font-bold text-amber-200'
                            : 'text-slate-300 hover:bg-slate-800'
                        )}
                      >
                        {step.chosenLabel ? `Bước ${idx + 1}: ${step.chosenLabel}` : `Bước ${idx + 1}`}
                      </button>
                    </React.Fragment>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetCompass}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Chọn nhánh khác</span>
                </button>
              </div>

              {currentNode?.kind === 'question' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-6 space-y-4">
                  <div>
                    <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                      CÂU HỎI ĐỊNH VỊ BƯỚC {path.length}
                    </div>
                    <h2 className="mt-1 text-base sm:text-lg font-extrabold text-white">
                      {currentNode.prompt}
                    </h2>
                    {currentNode.contextTip && (
                      <p className="mt-1 text-xs text-slate-400">{currentNode.contextTip}</p>
                    )}
                  </div>

                  <div className="grid gap-2.5">
                    {currentNode.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => chooseCompassOption(opt.label, opt.nextNodeId)}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/85 p-3.5 text-left transition-all hover:border-amber-500/70 hover:bg-slate-900 cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-amber-200">
                            <span className="mr-2 font-mono text-amber-400">({String.fromCharCode(65 + idx)})</span>
                            {opt.label}
                          </div>
                          {opt.hint && <p className="mt-1 text-xs text-slate-400">{opt.hint}</p>}
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentNode?.kind === 'outcome' && renderOutcomeCard(currentNode)}
            </section>
          )}
        </>
      ) : (
        /* CASE DRILL MODE */
        <section className="space-y-4">
          {/* Case selector pills */}
          <div className="flex flex-wrap gap-1.5">
            {tree.challenges.map((ch, idx) => {
              const passed = s.exercises[ch.id]?.status === 'passed';
              const active = idx === caseIdx;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => switchCase(idx)}
                  className={cn(
                    'inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                    active
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                      : passed
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  )}
                >
                  {passed && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  <span className="font-mono">{ch.code}</span>
                </button>
              );
            })}
          </div>

          {activeCase && (
            <div className="rounded-2xl border border-amber-500/35 bg-slate-900/75 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-extrabold text-amber-300">
                  {activeCase.code} · {activeCase.title}
                </span>
                {caseBranchId && (
                  <button
                    type="button"
                    onClick={() => switchCase(caseIdx)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Đi lại từ đầu ca này
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-2">
                <p className="text-sm sm:text-[15px] text-slate-100 leading-relaxed">{activeCase.scenario}</p>
                <p className="text-sm font-extrabold text-amber-300">{activeCase.question}</p>
              </div>

              {!caseBranchId ? (
                <div className="space-y-2.5">
                  <div className="font-mono text-xs font-bold text-cyan-300">
                    Bước 1: Tình huống này thuộc nhánh gốc nào trên Cây quyết định?
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tree.branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => startCaseBranch(b)}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left text-xs sm:text-sm font-semibold text-slate-200 hover:border-amber-500/60 hover:text-white transition-colors cursor-pointer"
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : caseCurrentNode?.kind === 'question' ? (
                <div className="space-y-2.5">
                  <div className="font-mono text-xs font-bold text-cyan-300">
                    Bước tiếp theo: {caseCurrentNode.prompt}
                  </div>
                  <div className="grid gap-2">
                    {caseCurrentNode.options.map((opt, iOpt) => (
                      <button
                        key={iOpt}
                        type="button"
                        onClick={() => chooseCaseOption(opt.label, opt.nextNodeId)}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left text-xs sm:text-sm font-semibold text-slate-200 hover:border-amber-500/60 hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="mr-2 font-mono text-amber-400">({String.fromCharCode(65 + iOpt)})</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {caseFeedback && (
                <div className="space-y-4">
                  <div
                    className={cn(
                      'rounded-xl border p-4 text-sm',
                      caseFeedback.ok
                        ? 'border-emerald-500/50 bg-emerald-500/12 text-emerald-100'
                        : 'border-rose-500/50 bg-rose-500/12 text-rose-100'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-extrabold">
                      <span className="flex items-center gap-1.5">
                        {caseFeedback.ok ? (
                          <>
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span>CHÍNH XÁC! Bạn đã định vị đúng nhánh quyết định chuẩn PMI</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                            <span>CHƯA TRÚNG NHÁNH CHUẨN — Hãy đối chiếu lại đường đi bên dưới!</span>
                          </>
                        )}
                      </span>
                      {caseFeedback.xp > 0 && (
                        <span className="rounded bg-amber-500 px-2 py-0.5 font-mono text-xs text-slate-950">
                          +{caseFeedback.xp} XP
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed">
                      <b>Bài học rút ra:</b> {activeCase.takeaway}
                    </p>
                    {!caseFeedback.ok && (
                      <p className="mt-1.5 text-xs text-amber-200">
                        <b>Đường rẽ chuẩn:</b> {activeCase.expectedPathLabels.join(' → ')}
                      </p>
                    )}
                  </div>

                  {renderOutcomeCard(
                    (tree.nodes[activeCase.expectedLeafId] as DecisionLeafNode) ?? caseFeedback.leaf
                  )}

                  {caseIdx < tree.challenges.length - 1 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchCase(caseIdx + 1)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-amber-400 cursor-pointer"
                      >
                        <span>Sang ca thử thách kế tiếp ({tree.challenges[caseIdx + 1].code})</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <PmpTrademarkFooter />
    </div>
  );
};
