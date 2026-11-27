import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  HelpCircle,
  Play,
  RotateCcw,
  SkipForward,
  Star,
  XCircle,
} from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import { useSdProgress } from '../store';
import {
  computeModelStaticCostPerHour,
  emptyAnswerForActivity,
  gradeActivity,
  normalizeAndValidateChanges,
  shuffleOrderItems,
  solutionAnswerForActivity,
} from './grade';
import type {
  Activity,
  ActivityAnswer,
  ActivityKind,
  AllowedAction,
  Change,
  Gate,
  GradeContext,
  GradeResult,
  Loc,
  ReplayRef,
  SimDocForGrade,
} from './types';

function locText(t: Loc | string | undefined, lang: WorkbenchLang): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return lang === 'en' ? (t.en ?? t.vi) : t.vi;
}

const KIND_LABELS: Record<ActivityKind, { vi: string; en: string }> = {
  predict: { vi: 'Dự đoán trước', en: 'Predict First' },
  'spot-bottleneck': { vi: 'Chỉ ra điểm nghẽn', en: 'Spot the Bottleneck' },
  'tune-to-limit': { vi: 'Tinh chỉnh tới giới hạn', en: 'Tune to Limit' },
  estimate: { vi: 'Ước lượng nhanh', en: 'Quick Estimate' },
  'fix-challenge': { vi: 'Thử thách sửa', en: 'Fix Challenge' },
  order: { vi: 'Sắp xếp thứ tự', en: 'Ordering' },
  'timeline-read': { vi: 'Đọc lịch sử thao tác', en: 'Timeline Read' },
  postmortem: { vi: 'Hậu kiểm sự cố', en: 'Incident Postmortem' },
  'design-constraint': { vi: 'Thiết kế có ràng buộc', en: 'Design with Constraints' },
};

export interface ActivityGateProps {
  activity: Activity;
  gate: Gate;
  sims: Record<string, SimDocForGrade>;
  lang: WorkbenchLang;
  onReplay?: (replay: ReplayRef) => void;
  onOpenFlashcards?: () => void;
}

/**
 * ActivityGate / ActivityCard (06 §4, §5): hiển thị ở cột phải của bàn học cho bước có `activityId`.
 * Hỗ trợ đủ 9 dạng bài tập, gợi ý từng bước, tự lưu nháp vào `WpState.exercises[id].code`,
 * xem lời giải sau ≥ 2 lần nộp chưa đạt, và khoá bước tiếp khi `gate === 'required'`.
 */
export const ActivityGate: React.FC<ActivityGateProps> = ({
  activity,
  gate,
  sims,
  lang,
  onReplay,
  onOpenFlashcards,
}) => {
  const rec = useSdProgress((s) => s.state.exercises[activity.id]);
  const recordActivity = useSdProgress((s) => s.recordActivity);
  const saveActivityDraft = useSdProgress((s) => s.saveActivityDraft);
  const markActivitySolutionViewed = useSdProgress((s) => s.markActivitySolutionViewed);
  const skipActivity = useSdProgress((s) => s.skipActivity);

  const simId =
    ('simId' in activity && activity.simId) ||
    activity.sim?.simId ||
    activity.replay?.simId ||
    Object.keys(sims)[0];
  const simDoc = simId ? sims[simId] : undefined;
  const modelNodes = simDoc?.scenario?.model?.nodes ?? [];

  const [answer, setAnswer] = useState<ActivityAnswer>(() => {
    if (rec?.code) {
      try {
        const parsed = JSON.parse(rec.code) as { v?: number; answer?: ActivityAnswer };
        if (parsed && parsed.v === 1 && parsed.answer !== undefined) {
          return parsed.answer;
        }
      } catch {
        // ignore invalid draft
      }
    }
    return emptyAnswerForActivity(activity);
  });

  const [hintsShown, setHintsShown] = useState<number>(() => rec?.hints ?? 0);
  const [showSolution, setShowSolution] = useState<boolean>(() => Boolean(rec?.solutionViewed));
  const [result, setResult] = useState<GradeResult | null>(null);
  const [lastXpAwarded, setLastXpAwarded] = useState<number>(0);

  useEffect(() => {
    if (rec?.code) {
      try {
        const parsed = JSON.parse(rec.code) as { v?: number; answer?: ActivityAnswer };
        if (parsed && parsed.v === 1 && parsed.answer !== undefined) {
          setAnswer(parsed.answer);
          setResult(null);
          return;
        }
      } catch {
        // ignore
      }
    }
    setAnswer(emptyAnswerForActivity(activity));
    setResult(null);
  }, [activity.id]);

  // Tự lưu nháp mỗi 1.5 giây
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const json = JSON.stringify({ v: 1, answer });
        if (rec?.code !== json) {
          saveActivityDraft(activity.id, json);
        }
      } catch {
        // ignore
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [activity.id, answer, rec?.code, saveActivityDraft]);

  const gradeCtx: GradeContext = useMemo(
    () => ({
      sims,
      hintsUsed: hintsShown,
    }),
    [sims, hintsShown]
  );

  const handleSubmit = () => {
    const res = gradeActivity(activity, answer, gradeCtx);
    setResult(res);
    const out = recordActivity({
      activityId: activity.id,
      kind: activity.kind,
      xpBase: activity.xp,
      score: res.score,
      stars: res.stars,
      passed: res.passed,
      hintsUsed: hintsShown,
      solutionViewed: showSolution || Boolean(rec?.solutionViewed),
    });
    setLastXpAwarded(out.xp);
  };

  const handleRevealSolution = () => {
    markActivitySolutionViewed(activity.id);
    setShowSolution(true);
    const sol = solutionAnswerForActivity(activity, gradeCtx);
    setAnswer(sol);
  };

  const bestStars = Math.max(rec?.stars ?? 0, result?.stars ?? 0) as 0 | 1 | 2 | 3;
  const attempts = rec?.attempts ?? 0;
  const canViewSolution =
    attempts >= 2 || rec?.status === 'passed' || Boolean(rec?.solutionViewed);
  const isLockedGate =
    gate === 'required' &&
    rec?.status !== 'passed' &&
    rec?.status !== 'skipped' &&
    !rec?.solutionViewed &&
    !result?.passed;

  const updateFixOrDesignChange = (nextChange: Change) => {
    const curChanges: Change[] =
      answer && typeof answer === 'object' && 'changes' in answer && Array.isArray(answer.changes)
        ? [...answer.changes]
        : [];
    const filtered = curChanges.filter((c) => {
      if (c.type === 'knob' && nextChange.type === 'knob') {
        return !(c.node === nextChange.node && c.key === nextChange.key);
      }
      if (c.type === 'link' && nextChange.type === 'link') {
        return c.link !== nextChange.link;
      }
      return true;
    });
    filtered.push(nextChange);
    if (activity.kind === 'tune-to-limit') {
      setAnswer({ objective: 'min-cost', changes: filtered });
    } else {
      setAnswer({ changes: filtered });
    }
  };

  const renderControls = () => {
    switch (activity.kind) {
      case 'predict': {
        const q = activity.question;
        if (q.type === 'node') {
          const picked = answer && 'node' in answer ? answer.node : '';
          const candidateNodes = modelNodes.filter((n) => n.kind !== 'client');
          return (
            <div className="flex flex-wrap gap-1.5">
              {candidateNodes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setAnswer({ node: n.id })}
                  className={cn(
                    'cursor-pointer rounded-xl border px-2.5 py-1.5 font-mono text-xs font-bold transition-colors',
                    picked === n.id
                      ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                  )}
                >
                  {locText(n.label, lang)} ({n.id})
                </button>
              ))}
            </div>
          );
        }
        if (q.type === 'choice') {
          const picked = answer && 'choice' in answer ? answer.choice : -1;
          return (
            <div className="space-y-1.5">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAnswer({ choice: idx })}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs font-medium transition-colors',
                    picked === idx
                      ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-bold'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                  )}
                >
                  <span className="font-mono font-extrabold">{idx + 1}.</span>
                  <span>{locText(opt, lang)}</span>
                </button>
              ))}
            </div>
          );
        }
        const numVal = answer && 'value' in answer ? answer.value : '';
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={numVal}
              onChange={(e) => setAnswer({ value: Number(e.target.value) })}
              className="w-36 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
            />
            {q.unit && <span className="font-mono text-xs text-[var(--dts-ink-muted)]">{q.unit}</span>}
          </div>
        );
      }

      case 'spot-bottleneck': {
        const picks = answer && 'picks' in answer ? answer.picks : [];
        const candidateNodes = modelNodes.filter((n) => n.kind !== 'client');
        const togglePick = (id: string) => {
          if (picks.includes(id)) {
            setAnswer({ picks: picks.filter((x) => x !== id) });
          } else if (activity.maxPicks === 1) {
            setAnswer({ picks: [id] });
          } else if (picks.length < activity.maxPicks) {
            setAnswer({ picks: [...picks, id] });
          }
        };
        return (
          <div className="flex flex-wrap gap-1.5">
            {candidateNodes.map((n) => {
              const selected = picks.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => togglePick(n.id)}
                  className={cn(
                    'cursor-pointer rounded-xl border px-2.5 py-1.5 font-mono text-xs font-bold transition-colors',
                    selected
                      ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                  )}
                >
                  {locText(n.label, lang)} ({n.id})
                </button>
              );
            })}
          </div>
        );
      }

      case 'tune-to-limit': {
        if (activity.objective === 'max-load') {
          const val =
            answer && 'objective' in answer && answer.objective === 'max-load'
              ? answer.value || ''
              : '';
          return (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={50}
                placeholder="vd 3000"
                value={val}
                onChange={(e) =>
                  setAnswer({ objective: 'max-load', value: Number(e.target.value) })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                className="w-36 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
              />
              <span className="font-mono text-xs text-[var(--dts-ink-muted)]">
                {activity.loadUnit ?? 'req/s'}
              </span>
            </div>
          );
        }
        return renderAllowedEditor(activity.allowed ?? [], undefined);
      }

      case 'estimate': {
        const val = answer && 'value' in answer ? answer.value || '' : '';
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              placeholder="Nhập ước lượng…"
              value={val}
              onChange={(e) => setAnswer({ value: Number(e.target.value) })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              className="w-40 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
            />
            <span className="font-mono text-xs text-[var(--dts-ink-muted)]">
              {activity.unit}
            </span>
          </div>
        );
      }

      case 'fix-challenge':
        return renderAllowedEditor(activity.allowed, activity.budget);

      case 'design-constraint':
        return renderAllowedEditor(
          modelNodes.flatMap((n) =>
            n.knobs.map(
              (k): AllowedAction => ({
                type: 'knob',
                node: n.id,
                key: k.key,
                min: k.min,
                max: k.max,
              })
            )
          ),
          {
            maxChanges: activity.budget.maxChanges ?? 10,
            maxCostPerHour: activity.budget.maxCostPerHour,
          }
        );

      case 'order': {
        const curIds =
          answer && 'order' in answer && Array.isArray(answer.order)
            ? answer.order
            : shuffleOrderItems(activity.items, activity.shuffleSeed).map((it) => it.id);
        const itemById = new Map(activity.items.map((it) => [it.id, it]));
        const moveItem = (idx: number, dir: -1 | 1) => {
          const target = idx + dir;
          if (target < 0 || target >= curIds.length) return;
          const next = [...curIds];
          const tmp = next[idx];
          next[idx] = next[target];
          next[target] = tmp;
          setAnswer({ order: next });
        };
        return (
          <div className="space-y-1.5">
            {curIds.map((id, idx) => {
              const it = itemById.get(id);
              if (!it) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--dts-panel-muted)] font-mono text-[10.5px] font-extrabold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[var(--dts-ink)]">
                      {locText(it.text, lang)}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, -1)}
                      aria-label="Move up"
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] disabled:opacity-35"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === curIds.length - 1}
                      onClick={() => moveItem(idx, 1)}
                      aria-label="Move down"
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] disabled:opacity-35"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'timeline-read': {
        const picks = answer && 'picks' in answer ? answer.picks : [];
        const toggleOp = (id: string) => {
          setAnswer({
            picks: picks.includes(id)
              ? picks.filter((x) => x !== id)
              : [...picks, id],
          });
        };
        return (
          <div className="space-y-1">
            {activity.history.map((op) => {
              const selected = picks.includes(op.id);
              const isRead = op.op === 'read';
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => toggleOp(op.id)}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors',
                    selected
                      ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink)]'
                  )}
                >
                  <span>
                    [{op.id}] Client {op.client} · {op.op.toUpperCase()}({op.key}
                    {op.value !== undefined ? ` = ${String(op.value)}` : ''})
                  </span>
                  <span className="text-[10px] text-[var(--dts-ink-muted)]">
                    {op.start}..{op.end}ms {op.node ? `@${op.node}` : ''}
                    {isRead ? ' (chọn)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'postmortem': {
        const curAns = answer && 'answers' in answer ? answer.answers : {};
        return (
          <div className="space-y-2.5">
            {activity.questions.map((q) => {
              const picked = curAns[q.id] ?? [];
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 space-y-1.5"
                >
                  <div className="font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                    {locText(q.prompt, lang)}
                  </div>
                  <div className="space-y-1">
                    {q.options.map((opt) => {
                      const active = picked.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            let nextPicked: string[];
                            if (q.type === 'single') {
                              nextPicked = [opt.id];
                            } else {
                              nextPicked = active
                                ? picked.filter((x) => x !== opt.id)
                                : [...picked, opt.id];
                            }
                            setAnswer({
                              answers: { ...curAns, [q.id]: nextPicked },
                            });
                          }}
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1 text-left text-xs transition-colors',
                            active
                              ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-bold'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                          )}
                        >
                          <span className="font-mono text-[10.5px] font-extrabold">
                            [{opt.id}]
                          </span>
                          <span>{locText(opt.text, lang)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
  };

  function renderAllowedEditor(
    allowed: AllowedAction[],
    budget?: { maxChanges: number; maxCostPerHour?: number }
  ) {
    const rawChanges: Change[] =
      answer && typeof answer === 'object' && 'changes' in answer && Array.isArray(answer.changes)
        ? answer.changes
        : [];
    const model = simDoc?.scenario?.model;
    const norm = model
      ? normalizeAndValidateChanges(rawChanges, model, allowed)
      : { valid: true, changes: rawChanges, changeCost: rawChanges.length };
    const cost = model ? computeModelStaticCostPerHour(model) : 0;

    return (
      <div className="space-y-2">
        {budget && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1 font-mono text-[10.5px] text-[var(--dts-ink-muted)]">
            <span>
              {lang === 'en' ? 'Changes' : 'Thay đổi'}:{' '}
              <strong
                className={cn(
                  norm.changeCost > budget.maxChanges
                    ? 'text-[#e5534b]'
                    : 'text-[var(--dts-ink)]'
                )}
              >
                {norm.changeCost}/{budget.maxChanges}
              </strong>
            </span>
            {budget.maxCostPerHour !== undefined && (
              <span>
                {lang === 'en' ? 'Max cost' : 'Ngân sách tối đa'}:{' '}
                <strong className="text-[var(--dts-ink)]">
                  ≤ ${budget.maxCostPerHour.toFixed(2)}/h
                </strong>
              </span>
            )}
            {rawChanges.length > 0 && (
              <button
                type="button"
                onClick={() => setAnswer({ changes: [] })}
                className="inline-flex cursor-pointer items-center gap-0.5 text-[10px] font-bold text-[var(--dts-blue-ink)] hover:underline"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>{lang === 'en' ? 'Reset' : 'Đặt lại'}</span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
          {allowed.map((al, idx) => {
            if (al.type === 'knob') {
              const nodeSpec = model?.nodes.find((n) => n.id === al.node);
              const knobSpec = nodeSpec?.knobs.find((k) => k.key === al.key);
              if (!nodeSpec || !knobSpec) return null;
              const defVal = nodeSpec.params[al.key] ?? knobSpec.default;
              const curChange = rawChanges.find(
                (c): c is Extract<Change, { type: 'knob' }> =>
                  c.type === 'knob' && c.node === al.node && c.key === al.key
              );
              const curVal = curChange ? curChange.value : defVal;
              return (
                <div
                  key={`k-${al.node}-${al.key}-${idx}`}
                  className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-bold">
                      <span className="mr-1 rounded bg-[var(--dts-panel-muted)] px-1 py-0.5 text-[9.5px] text-[var(--dts-blue-ink)]">
                        {al.node}
                      </span>
                      {locText(knobSpec.label, lang)}
                    </span>
                    <span className="font-extrabold tabular-nums">
                      {typeof curVal === 'number'
                        ? curVal.toLocaleString('en-US')
                        : String(curVal)}
                      {knobSpec.unit ? ` ${knobSpec.unit}` : ''}
                    </span>
                  </div>
                  {knobSpec.type === 'number' && (
                    <input
                      type="range"
                      min={al.min ?? knobSpec.min ?? 1}
                      max={al.max ?? knobSpec.max ?? 100}
                      step={knobSpec.step ?? 1}
                      value={Number(curVal)}
                      onChange={(e) =>
                        updateFixOrDesignChange({
                          type: 'knob',
                          node: al.node,
                          key: al.key,
                          value: Number(e.target.value),
                        })
                      }
                      className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
                    />
                  )}
                </div>
              );
            }

            if (al.type === 'link' && al.fields.includes('retry')) {
              const curLinkChange = rawChanges.find(
                (c): c is Extract<Change, { type: 'link' }> =>
                  c.type === 'link' && c.link === al.link
              );
              const hasSafeRetry = Boolean(
                curLinkChange &&
                  curLinkChange.patch.retry &&
                  (curLinkChange.patch.retry as { backoff?: string }).backoff ===
                    'exponential'
              );
              return (
                <div
                  key={`l-${al.link}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <span>
                    <span className="mr-1 rounded bg-[var(--dts-panel-muted)] px-1 py-0.5 text-[9.5px] text-[var(--dts-blue-ink)]">
                      {al.link}
                    </span>
                    Retry Backoff + Jitter + Budget
                  </span>
                  <input
                    type="checkbox"
                    checked={hasSafeRetry}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFixOrDesignChange({
                          type: 'link',
                          link: al.link,
                          patch: {
                            retry: {
                              max: 2,
                              backoff: 'exponential',
                              baseMs: 100,
                              jitter: 'full',
                              budgetRatio: 0.1,
                            },
                          },
                        });
                      } else {
                        const next = rawChanges.filter(
                          (c) => !(c.type === 'link' && c.link === al.link)
                        );
                        setAnswer({ changes: next });
                      }
                    }}
                    className="cursor-pointer accent-[var(--dts-blue-ink)]"
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
        {cost > 0 && null}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={locText(activity.title, lang)}
      className="dts-panel rounded-2xl p-3.5 space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-blue-ink)]">
          <span>
            {lang === 'en' ? 'Activity' : 'Bài tập'} ·{' '}
            {locText(KIND_LABELS[activity.kind], lang)}
          </span>
          {gate === 'required' && (
            <span className="rounded-full bg-[var(--dts-amber-bg)] px-2 py-0.5 text-[9.5px] text-[var(--dts-amber-ink)]">
              {lang === 'en' ? 'Required' : 'Bắt buộc'}
            </span>
          )}
        </div>

        {/* Stars */}
        <div className="inline-flex items-center gap-0.5" title={`${bestStars}/3 sao`}>
          {([1, 2, 3] as const).map((s) => (
            <Star
              key={s}
              className={cn(
                'h-3.5 w-3.5',
                s <= bestStars
                  ? 'fill-[#eab308] text-[#eab308]'
                  : 'text-[var(--dts-line-strong)]'
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-mono text-xs sm:text-[13px] font-extrabold text-[var(--dts-ink)]">
          {locText(activity.title, lang)}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--dts-ink-soft)]">
          {locText(activity.prompt, lang)}
        </p>
      </div>

      {/* Interactive body */}
      {renderControls()}

      {/* Hints */}
      {activity.hints && activity.hints.length > 0 && hintsShown > 0 && (
        <div className="space-y-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] p-2.5 text-xs text-[var(--dts-amber-ink)]">
          {activity.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{locText(h, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {activity.hints && activity.hints.length > 0 && (
            <button
              type="button"
              disabled={hintsShown >= activity.hints.length}
              onClick={() => setHintsShown((h) => Math.min(activity.hints!.length, h + 1))}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-[11px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)] disabled:opacity-40"
            >
              <HelpCircle className="h-3 w-3" />
              <span>
                {lang === 'en' ? 'Hint' : 'Gợi ý'} ({hintsShown}/{activity.hints.length})
              </span>
            </button>
          )}

          {canViewSolution && !showSolution && (
            <button
              type="button"
              onClick={handleRevealSolution}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-[11px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
            >
              <Eye className="h-3 w-3" />
              <span>{lang === 'en' ? 'View solution' : 'Xem lời giải'}</span>
            </button>
          )}

          {isLockedGate && (
            <button
              type="button"
              onClick={() => skipActivity(activity.id)}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 font-mono text-[10.5px] font-bold text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
            >
              <SkipForward className="h-3 w-3" />
              <span>{lang === 'en' ? 'Skip' : 'Bỏ qua bài này'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="dts-btn-tactile inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-3 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
        >
          <span>{lang === 'en' ? 'Check Answer' : 'Nộp bài'}</span>
        </button>
      </div>

      {isLockedGate && (
        <div className="font-mono text-[10.5px] font-bold text-[var(--dts-amber-ink)]">
          {lang === 'en'
            ? 'Complete this activity to continue to the next step.'
            : 'Hoàn thành bài tập này để sang bước tiếp theo.'}
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div
          aria-live="polite"
          className={cn(
            'rounded-xl border p-3 space-y-2 text-xs',
            result.passed
              ? 'border-[var(--dts-line-strong)] bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]'
              : 'border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)] text-[var(--dts-rose-ink)]'
          )}
        >
          <div className="flex items-center justify-between font-mono font-extrabold">
            <span className="inline-flex items-center gap-1.5">
              {result.passed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span>
                {result.passed
                  ? lang === 'en'
                    ? 'Passed'
                    : 'Đạt'
                  : lang === 'en'
                    ? 'Not passed yet'
                    : 'Chưa đạt'}{' '}
                · {result.score}/100
              </span>
            </span>
            {lastXpAwarded > 0 && (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10.5px]">
                +{lastXpAwarded} XP
              </span>
            )}
          </div>

          {/* Checks table */}
          {result.checks.length > 0 && (
            <ul className="space-y-1 font-mono text-[11px]">
              {result.checks.map((chk) => (
                <li key={chk.id} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span>{chk.pass ? '✔' : '✖'}</span>
                    <span>{locText(chk.label, lang)}</span>
                  </span>
                  <span className="tabular-nums opacity-90">
                    {chk.got !== undefined ? `${chk.got}` : ''}
                    {chk.want !== undefined ? ` (mục tiêu: ${chk.want})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Matched trap explanation */}
          {result.matchedTrap && (
            <div className="rounded-lg bg-black/5 p-2 text-[11.5px] leading-relaxed">
              <strong>{locText(result.matchedTrap.label, lang)}:</strong>{' '}
              {locText(result.matchedTrap.why, lang)}
            </div>
          )}

          {/* Explain + workings */}
          {(result.passed || showSolution || attempts >= 2) && (
            <div className="rounded-lg bg-black/5 p-2 text-[11.5px] leading-relaxed text-[var(--dts-ink)]">
              <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                {lang === 'en' ? 'Explanation' : 'Xem giải thích'}
              </div>
              <p className="mt-0.5">
                {locText(result.resolvedExplain ?? activity.explain, lang)}
              </p>
              {activity.kind === 'estimate' &&
                activity.workings &&
                activity.workings.length > 0 && (
                  <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-[11px]">
                    {activity.workings.map((w, idx) => (
                      <li key={idx}>{locText(w, lang)}</li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {result.replay && onReplay && (
              <button
                type="button"
                onClick={() => onReplay(result.replay!)}
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-current/30 bg-black/5 px-2.5 font-mono text-[10.5px] font-extrabold"
              >
                <Play className="h-3 w-3" />
                <span>{lang === 'en' ? 'View on simulation' : 'Xem trên mô phỏng'}</span>
              </button>
            )}

            {!result.passed &&
              activity.relatedCards &&
              activity.relatedCards.length > 0 &&
              onOpenFlashcards && (
                <button
                  type="button"
                  onClick={onOpenFlashcards}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-current/30 bg-black/5 px-2.5 font-mono text-[10.5px] font-extrabold"
                >
                  <span>
                    {lang === 'en' ? 'Review related cards' : 'Ôn các thẻ liên quan'}
                  </span>
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
