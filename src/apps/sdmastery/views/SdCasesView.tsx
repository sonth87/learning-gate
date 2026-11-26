import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react';
import { ScaleStageSvg } from '@/components/scale-workbench/ScaleStageSvg';
import {
  pickText,
  type BilingualText,
  type LiveSimFrame,
  type LiveSimSource,
} from '@/components/scale-workbench/types';
import {
  createSim,
  DT,
  findBottleneck,
  maxSustainableRps,
  type BottleneckReason,
  type Sim,
  type SimFrame,
  type SimScenario,
} from '@/features/sysdesign-course/sim';
import { computeModelStaticCostPerHour } from '@/features/sysdesign-course/activities/grade';
import { simFrameToLiveFrame } from '@/features/sysdesign-course/live/liveSimAdapter';
import { useSdNav } from '@/features/sysdesign-course/store';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  DESIGN_CASES,
  type ClarifyingQuestionDimension,
  type CaseEvolutionStage,
  type SdDesignCase,
} from '../data/designCases';
import { useSdStore } from '../store/useSdStore';

export interface SdCasesViewProps {
  onOpenModule?: (moduleId: string) => void;
  initialCaseId?: string;
}

type SimRunMode = 'static' | 'live' | 'stress';

interface PersistedCaseGateState {
  askedIds: string[];
  unlocked: boolean;
}

type PersistedGateMap = Record<string, PersistedCaseGateState>;

const CASE_GATE_STORAGE_KEY = 'sdmastery_design_cases_gate_v1';

function loadPersistedGates(): PersistedGateMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CASE_GATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as PersistedGateMap;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function savePersistedGates(map: PersistedGateMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CASE_GATE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

const DIMENSION_LABELS: Record<ClarifyingQuestionDimension, BilingualText> = {
  scale: { vi: 'Quy mô & DAU', en: 'Scale & DAU' },
  ratio: { vi: 'Tỷ lệ Đọc : Ghi', en: 'Read : Write Ratio' },
  sla: { vi: 'Độ trễ & Nhất quán', en: 'Latency & Consistency' },
  resilience: { vi: 'Chịu lỗi & Bất biến', en: 'Failure & Idempotency' },
  premature: { vi: 'Ưu tiên thấp (45 phút)', en: 'Low Priority (45-min)' },
};

const BOTTLENECK_REASON_LABELS: Record<BottleneckReason, BilingualText> = {
  saturated: { vi: 'Bão hoà thông lượng (ρ ≥ 1)', en: 'Throughput saturated (ρ ≥ 1)' },
  queueing: { vi: 'Hàng đợi dồn cao làm vọt độ trễ', en: 'Heavy queueing delay' },
  'slow-dependency': { vi: 'Phụ thuộc phía sau phản hồi chậm', en: 'Slow downstream dependency' },
  'pool-limited': { vi: 'Cạn kiệt luồng / Connection Pool', en: 'Connection pool exhausted' },
  'hot-shard': { vi: 'Lệch tải phân vùng nóng (Hot Shard)', en: 'Skewed hot-shard contention' },
  none: { vi: 'Đang hoạt động trong ngưỡng an toàn', en: 'Operating within safe headroom' },
};

interface StageEngineSnapshot {
  offeredRps: number;
  maxRps: number;
  limitedByNodeId: string;
  p99Ms: number;
  errorPct: number;
  costPerHour: number;
  bottleneckNodeId: string;
  bottleneckRho: number;
  bottleneckReason: BottleneckReason;
}

const steadySnapshotCache = new WeakMap<CaseEvolutionStage, { base: StageEngineSnapshot; stress: StageEngineSnapshot }>();

function evaluateSteadySnapshot(
  stage: CaseEvolutionStage,
  multiplier: number
): StageEngineSnapshot {
  const sc: SimScenario = {
    ...stage.scenario,
    durationSec: 12,
    options: { noise: false, maxPackets: 0 },
  };
  const sim = createSim(sc);
  if (multiplier !== 1) {
    sim.setInput({ type: 'load', multiplier });
  }
  const frame: SimFrame = sim.runUntil(8);
  // Luôn đo ngưỡng chịu tải tối đa trên cấu hình cơ sở 1x
  const maxReport = maxSustainableRps(sc.model, frame);
  const bn = findBottleneck(sc.model, frame);
  const staticCost = computeModelStaticCostPerHour(sc.model);
  sim.dispose();

  return {
    offeredRps: Math.round(frame.metrics.offeredRps),
    maxRps: Number.isFinite(maxReport.rps) ? Math.round(maxReport.rps) : stage.targetRps * 10,
    limitedByNodeId: maxReport.limitedBy,
    p99Ms: frame.metrics.latency.p99,
    errorPct: frame.metrics.errorRate * 100,
    costPerHour: Math.max(staticCost, frame.metrics.costPerHour),
    bottleneckNodeId: bn.nodeId,
    bottleneckRho: bn.rho,
    bottleneckReason: bn.reason,
  };
}

function getStageCachedSnapshots(stage: CaseEvolutionStage): {
  base: StageEngineSnapshot;
  stress: StageEngineSnapshot;
} {
  const hit = steadySnapshotCache.get(stage);
  if (hit) return hit;
  const base = evaluateSteadySnapshot(stage, 1);
  const stress = evaluateSteadySnapshot(stage, stage.stressMultiplier);
  const pair = {
    base,
    stress: { ...stress, maxRps: base.maxRps, limitedByNodeId: base.limitedByNodeId },
  };
  steadySnapshotCache.set(stage, pair);
  return pair;
}

function formatRps(rps: number): string {
  if (!Number.isFinite(rps)) return '∞';
  return Math.round(rps).toLocaleString('en-US');
}

export const SdCasesView: React.FC<SdCasesViewProps> = ({
  onOpenModule,
  initialCaseId,
}) => {
  const lang = useWorkbenchStore((s) => s.language);
  const theme = useWorkbenchStore((s) => s.workbenchTheme);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const setActiveTab = useSdStore((s) => s.setActiveTab);
  const goSd = useSdNav((s) => s.go);

  const openNotesDrawer = useNavigationStore((s) => s.openNotesDrawer);
  const notes = useUserDataStore((s) => s.notes);
  const addOrUpdateNote = useUserDataStore((s) => s.addOrUpdateNote);

  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (initialCaseId && DESIGN_CASES.some((c) => c.id === initialCaseId)) {
      return initialCaseId;
    }
    return DESIGN_CASES[0].id;
  });

  const [gateMap, setGateMap] = useState<PersistedGateMap>(() => loadPersistedGates());
  const [isStep1Collapsed, setIsStep1Collapsed] = useState<boolean>(false);
  const [stageIdx, setStageIdx] = useState<number>(0);
  const [simMode, setSimMode] = useState<SimRunMode>('static');
  const [replayNonce, setReplayNonce] = useState<number>(0);
  const [liveSnapshot, setLiveSnapshot] = useState<StageEngineSnapshot | null>(null);
  const [liveNodeFrames, setLiveNodeFrames] = useState<SimFrame['nodes'] | null>(null);

  const activeCase: SdDesignCase = useMemo(
    () => DESIGN_CASES.find((c) => c.id === selectedCaseId) ?? DESIGN_CASES[0],
    [selectedCaseId]
  );

  const activeStage: CaseEvolutionStage = activeCase.stages[stageIdx] ?? activeCase.stages[0];
  const nextStage: CaseEvolutionStage | undefined = activeCase.stages[stageIdx + 1];

  const caseGate = gateMap[activeCase.id] ?? { askedIds: [], unlocked: false };
  const askedSet = useMemo(() => new Set(caseGate.askedIds), [caseGate.askedIds]);

  const essentialQuestions = useMemo(
    () => activeCase.clarifyingQuestions.filter((q) => q.kind === 'essential'),
    [activeCase]
  );
  const essentialAskedCount = useMemo(
    () => essentialQuestions.filter((q) => askedSet.has(q.id)).length,
    [essentialQuestions, askedSet]
  );
  const isCaseUnlocked = caseGate.unlocked || essentialAskedCount >= essentialQuestions.length;

  const unlockedTotalCount = useMemo(
    () =>
      DESIGN_CASES.filter((c) => {
        const g = gateMap[c.id];
        if (!g) return false;
        if (g.unlocked) return true;
        const req = c.clarifyingQuestions.filter((q) => q.kind === 'essential');
        return req.every((q) => g.askedIds.includes(q.id));
      }).length,
    [gateMap]
  );

  // Khi chuyển sang Case khác: đưa về v1, tắt stress, tự thu gọn Bước 1 nếu Case đó đã mở khoá từ trước
  const handleSelectCase = useCallback(
    (caseId: string) => {
      setSelectedCaseId(caseId);
      setStageIdx(0);
      setSimMode('static');
      setLiveSnapshot(null);
      setLiveNodeFrames(null);
      const prevGate = gateMap[caseId];
      setIsStep1Collapsed(Boolean(prevGate?.unlocked));
    },
    [gateMap]
  );

  const handleAskQuestion = useCallback(
    (qId: string) => {
      setGateMap((prev) => {
        const cur = prev[activeCase.id] ?? { askedIds: [], unlocked: false };
        if (cur.askedIds.includes(qId)) return prev;
        const nextAsked = [...cur.askedIds, qId];
        const allEssentialDone = activeCase.clarifyingQuestions
          .filter((q) => q.kind === 'essential')
          .every((q) => nextAsked.includes(q.id));
        const nextMap: PersistedGateMap = {
          ...prev,
          [activeCase.id]: {
            askedIds: nextAsked,
            unlocked: cur.unlocked || allEssentialDone,
          },
        };
        savePersistedGates(nextMap);
        return nextMap;
      });
    },
    [activeCase]
  );

  const handleResetStep1 = useCallback(() => {
    setSimMode('static');
    setIsStep1Collapsed(false);
    setGateMap((prev) => {
      const nextMap = { ...prev };
      delete nextMap[activeCase.id];
      savePersistedGates(nextMap);
      return nextMap;
    });
  }, [activeCase.id]);

  const handleSelectStage = useCallback((idx: number) => {
    setStageIdx(idx);
    setSimMode((prev) => (prev === 'stress' ? 'live' : prev));
    setLiveSnapshot(null);
    setLiveNodeFrames(null);
  }, []);

  const cachedPair = useMemo(() => getStageCachedSnapshots(activeStage), [activeStage]);

  // ── Live rAF Simulation Engine Driver (`createSim` -> `LiveSimSource`) ──
  const simRef = useRef<Sim | null>(null);
  const liveFrameRef = useRef<LiveSimFrame | null>(null);
  const subscribersRef = useRef<Set<(f: LiveSimFrame) => void>>(new Set());

  const activeFrameSource: LiveSimSource | undefined = useMemo(() => {
    if (simMode === 'static') return undefined;

    const liveScenario: SimScenario = {
      ...activeStage.scenario,
      durationSec: 3600,
      options: { noise: true, maxPackets: 170 },
    };
    const sim = createSim(liveScenario);
    const mult = simMode === 'stress' ? activeStage.stressMultiplier : 1;
    if (mult !== 1) {
      sim.setInput({ type: 'load', multiplier: mult });
    }
    const f0 = sim.step();
    liveFrameRef.current = simFrameToLiveFrame(f0);
    simRef.current = sim;

    return {
      getFrame: () => liveFrameRef.current,
      subscribe: (cb) => {
        subscribersRef.current.add(cb);
        if (liveFrameRef.current) cb(liveFrameRef.current);
        return () => {
          subscribersRef.current.delete(cb);
        };
      },
    };
    // replayNonce được đưa vào để khởi tạo lại bộ mô phỏng khi nhấn Chạy lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simMode, activeStage, replayNonce]);

  useEffect(() => {
    if (simMode === 'static' || !activeFrameSource) {
      setLiveSnapshot(null);
      setLiveNodeFrames(null);
      return;
    }

    const sim = simRef.current;
    if (!sim) return;

    let rafId = 0;
    let lastTs = performance.now();
    let accSec = 0;
    let uiSyncAccSec = 0;
    const baseMaxRps = cachedPair.base.maxRps;
    const baseLimitedBy = cachedPair.base.limitedByNodeId;
    const staticCost = computeModelStaticCostPerHour(activeStage.scenario.model);

    const publishUiMetrics = (sf: SimFrame) => {
      const bn = findBottleneck(activeStage.scenario.model, sf);
      setLiveSnapshot({
        offeredRps: Math.round(sf.metrics.offeredRps),
        maxRps: baseMaxRps,
        limitedByNodeId: baseLimitedBy,
        p99Ms: sf.metrics.latency.p99,
        errorPct: sf.metrics.errorRate * 100,
        costPerHour: Math.max(staticCost, sf.metrics.costPerHour),
        bottleneckNodeId: bn.nodeId,
        bottleneckRho: bn.rho,
        bottleneckReason: bn.reason,
      });
      setLiveNodeFrames(sf.nodes);
    };

    const initialSf = sim.frame();
    if (initialSf) publishUiMetrics(initialSf);

    const loop = (now: number) => {
      const dtSec = Math.min(0.1, Math.max(0, (now - lastTs) / 1000));
      lastTs = now;
      accSec += dtSec;
      uiSyncAccSec += dtSec;

      let latestSf: SimFrame | null = null;
      let steps = 0;
      while (accSec >= DT && steps < 4) {
        accSec -= DT;
        steps++;
        if (sim.t >= 3590) {
          sim.reset();
          if (simMode === 'stress') {
            sim.setInput({ type: 'load', multiplier: activeStage.stressMultiplier });
          }
        }
        latestSf = sim.step();
      }

      if (latestSf) {
        const lf = simFrameToLiveFrame(latestSf);
        liveFrameRef.current = lf;
        for (const cb of subscribersRef.current) {
          cb(lf);
        }
        if (uiSyncAccSec >= 0.25) {
          uiSyncAccSec = 0;
          publishUiMetrics(latestSf);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      sim.dispose();
    };
  }, [simMode, activeFrameSource, activeStage, cachedPair.base.maxRps, cachedPair.base.limitedByNodeId]);

  const displayedMetrics: StageEngineSnapshot = useMemo(() => {
    if (simMode !== 'static' && liveSnapshot) return liveSnapshot;
    return simMode === 'stress' ? cachedPair.stress : cachedPair.base;
  }, [simMode, liveSnapshot, cachedPair]);

  const nodeNameOf = useCallback(
    (nodeId: string): string => {
      const found = activeStage.scene.nodes.find((n) => n.id === nodeId);
      return found ? pickText(found.label, lang) : nodeId;
    },
    [activeStage.scene.nodes, lang]
  );

  const renderLiveSlot = useCallback(
    (entity: { kind: 'node' | 'link'; id: string }): React.ReactNode => {
      if (entity.kind !== 'node' || !liveNodeFrames) return null;
      const nf = liveNodeFrames[entity.id];
      if (!nf) return null;
      return (
        <div className="mt-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 font-mono text-[11px]">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
            <span>{lang === 'en' ? 'Live Engine Telemetry' : 'Số liệu Engine trực tiếp'}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5',
                nf.rho >= 1
                  ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                  : nf.rho >= 0.75
                    ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    : 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
              )}
            >
              ρ = {nf.rho.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[var(--dts-ink)]">
            <div>λ: {formatRps(nf.lambda)} req/s</div>
            <div>p99: {nf.latency.p99.toFixed(1)} ms</div>
            {typeof nf.hitRatio === 'number' && (
              <div>Hit: {(nf.hitRatio * 100).toFixed(0)}%</div>
            )}
            {nf.queue > 0.5 && <div>Queue: {Math.round(nf.queue)}</div>}
            {typeof nf.lagMs === 'number' && <div>Lag: {nf.lagMs.toFixed(0)} ms</div>}
          </div>
        </div>
      );
    },
    [liveNodeFrames, lang]
  );

  const handleOpenDeepDive = useCallback(() => {
    const modId = activeCase.linkedModuleId;
    if (onOpenModule) {
      onOpenModule(modId);
      return;
    }
    const levelMatch = /^S(\d+)-/.exec(modId);
    if (levelMatch) {
      setExpandedLevel('sdmastery', Number(levelMatch[1]));
    }
    setCourseCursor('sdmastery', modId, 0);
    setActiveTab('learn');
    goSd({ name: 'workbench' });
  }, [activeCase.linkedModuleId, onOpenModule, setExpandedLevel, setCourseCursor, setActiveTab, goSd]);

  const noteTargetId = `sd-case:${activeCase.id}`;
  const caseNotesCount = useMemo(
    () => notes.filter((n) => n.targetId === noteTargetId).length,
    [notes, noteTargetId]
  );

  const handleSaveCaseToNotes = useCallback(async () => {
    const targetTitle = `${pickText(activeCase.title, lang)} (${activeCase.linkedModuleId})`;
    const headerMarker = `## ${pickText(activeCase.title, 'vi')}`;
    const existingAuto = notes.find(
      (n) => n.targetId === noteTargetId && n.content.startsWith('## ')
    );

    const stageLines = activeCase.stages
      .map(
        (s) =>
          `- **${s.versionLabel} (${formatRps(s.targetRps)} req/s) — ${pickText(s.title, lang)}:** ${pickText(s.summary, lang)}`
      )
      .join('\n');

    const sloLine = activeCase.capacityCard.slos.map((s) => pickText(s, lang)).join(' · ');
    const content = [
      headerMarker,
      `- **Module:** ${activeCase.linkedModuleId} | **Scale:** ${pickText(activeCase.capacityCard.dau, lang)}`,
      `- **Read / Write:** ${pickText(activeCase.capacityCard.readRps, lang)} / ${pickText(activeCase.capacityCard.writeRps, lang)} (${pickText(activeCase.capacityCard.readWriteRatio, lang)})`,
      `- **Storage:** ${pickText(activeCase.capacityCard.storagePerDay, lang)} | **SLOs:** ${sloLine}`,
      '',
      `### Evolution Timeline (v1 → v4)`,
      stageLines,
      '',
      `### Active Stage Snapshot (${activeStage.versionLabel})`,
      `- Target: ${formatRps(activeStage.targetRps)} req/s | Max Sustainable: ~${formatRps(cachedPair.base.maxRps)} req/s | p99: ${cachedPair.base.p99Ms.toFixed(1)} ms | Cost: $${cachedPair.base.costPerHour.toFixed(2)}/h`,
    ].join('\n');

    await addOrUpdateNote({
      id: existingAuto?.id,
      targetType: 'deepdive',
      targetId: noteTargetId,
      targetTitle,
      content,
    });
    openNotesDrawer('deepdive', noteTargetId, targetTitle);
  }, [activeCase, activeStage, cachedPair.base, lang, noteTargetId, notes, addOrUpdateNote, openNotesDrawer]);

  const t = useCallback((vi: string, en: string) => (lang === 'en' ? en : vi), [lang]);

  return (
    <div className="@container flex h-full min-h-0 w-full flex-col @[980px]:flex-row bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      {/* ── Cột trái: Danh sách 9 Case Thiết kế (Desktop Rail + Mobile Horizontal Selector) ── */}
      <aside className="shrink-0 border-b @[980px]:border-b-0 @[980px]:border-r border-[var(--dts-line-strong)] bg-[var(--dts-panel)] @[980px]:w-[286px] @[980px]:flex @[980px]:flex-col @[980px]:h-full">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--dts-border-soft)] px-3.5 py-2.5">
          <div>
            <div className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
              {t('9 CASE THIẾT KẾ THỰC TẾ', '9 END-TO-END DESIGN CASES')}
            </div>
            <div className="text-xs font-semibold text-[var(--dts-ink-soft)]">
              {t('Problem-First + Tiến hóa v1 → v4', 'Problem-First + v1 → v4 Evolution')}
            </div>
          </div>
          <span className="rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[var(--dts-green-ink)]">
            {unlockedTotalCount}/{DESIGN_CASES.length}
          </span>
        </div>

        <div className="no-scrollbar flex @[980px]:flex-col gap-1.5 overflow-x-auto @[980px]:overflow-y-auto p-2.5 @[980px]:flex-1">
          {DESIGN_CASES.map((c) => {
            const active = c.id === activeCase.id;
            const g = gateMap[c.id];
            const unlocked =
              Boolean(g?.unlocked) ||
              c.clarifyingQuestions
                .filter((q) => q.kind === 'essential')
                .every((q) => g?.askedIds.includes(q.id));

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCase(c.id)}
                className={cn(
                  'group flex shrink-0 @[980px]:w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-all cursor-pointer',
                  active
                    ? 'dts-card-tactile bg-[var(--dts-panel-elevated)]'
                    : 'border border-transparent hover:border-[var(--dts-line-strong)] hover:bg-[var(--dts-panel-elevated)]/70'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-extrabold',
                    active
                      ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                      : unlocked
                        ? 'border-[var(--dts-line-strong)] bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]'
                        : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] text-[var(--dts-ink-muted)]'
                  )}
                >
                  {unlocked ? '✓' : String(c.order).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate font-mono text-xs font-extrabold text-[var(--dts-ink)] max-w-[180px] @[980px]:max-w-none">
                      {pickText(c.title, lang)}
                    </span>
                    <span className="shrink-0 rounded bg-[var(--dts-panel-muted)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                      {c.linkedModuleId}
                    </span>
                  </div>
                  <div className="mt-0.5 hidden @[980px]:block truncate text-[11px] text-[var(--dts-ink-muted)]">
                    {pickText(c.domainTag, lang)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Khu vực chính: Brief + Bước 1 Clarifying Gate + Bước 2 Evolution Timeline ── */}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
        <div className="mx-auto max-w-[1320px] space-y-4">
          {/* 1. Case Header & Deep-Link Bar */}
          <section className="dts-card-tactile rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-[var(--dts-border)] bg-[var(--dts-blue-bg)] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[var(--dts-blue-ink)]">
                    CASE #{String(activeCase.order).padStart(2, '0')} · {activeCase.linkedModuleId}
                  </span>
                  <span className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                    {pickText(activeCase.domainTag, lang)}
                  </span>
                  <span
                    className={cn(
                      'rounded-lg px-2 py-0.5 font-mono text-[10.5px] font-extrabold',
                      activeCase.difficulty === 'Advanced'
                        ? 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]'
                        : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    )}
                  >
                    {activeCase.difficulty}
                  </span>
                </div>

                <h1 className="font-mono text-lg sm:text-xl font-extrabold text-[var(--dts-ink)]">
                  {pickText(activeCase.title, lang)}
                </h1>
                <p className="text-sm text-[var(--dts-ink-soft)] leading-relaxed">
                  {pickText(activeCase.subtitle, lang)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenDeepDive}
                  className="dts-btn-tactile inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-3 font-mono text-xs font-extrabold text-[var(--dts-green-ink)] cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? `Open Deep-Dive (${activeCase.linkedModuleId})`
                      : `Mở bài học chuyên sâu (${activeCase.linkedModuleId})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCaseToNotes}
                  className="dts-btn-tactile inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)] cursor-pointer"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {lang === 'en' ? 'Save Case to Notes' : 'Lưu Case vào Ghi chú'}
                    {caseNotesCount > 0 ? ` (${caseNotesCount})` : ''}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-3.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3.5 py-2.5">
              <div className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                {t('ĐỀ BÀI BAN ĐẦU (CHƯA LÀM RÕ RÀNG BUỘC)', 'INITIAL DESIGN PROMPT (AMBIGUOUS BRIEF)')}
              </div>
              <p className="mt-0.5 text-sm font-medium text-[var(--dts-ink)]">
                “{pickText(activeCase.problemBrief, lang)}”
              </p>
            </div>
          </section>

          {/* 2. Mandatory Step-1 Clarifying Questions Gate (Problem-First Framework) */}
          <section className="dts-card-tactile rounded-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--dts-border)] font-mono text-xs font-extrabold',
                    isCaseUnlocked
                      ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                      : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                  )}
                >
                  {isCaseUnlocked ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </span>
                <div className="min-w-0">
                  <h2 className="font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                    {t(
                      'Bước 1: Đặt câu hỏi làm rõ yêu cầu (Problem-First)',
                      'Step 1: Ask Clarifying Questions (Problem-First Gate)'
                    )}
                  </h2>
                  <p className="text-xs text-[var(--dts-ink-muted)]">
                    {isCaseUnlocked
                      ? t(
                          'Đã mở khoá đủ 4/4 ràng buộc cốt lõi! Bạn có thể thu gọn Bước 1 để tập trung vào mô hình bên dưới.',
                          'All 4/4 essential constraints clarified! You can collapse Step 1 to focus on the timeline below.'
                        )
                      : t(
                          'Hãy bấm chọn các câu hỏi cần đặt trong 5 phút đầu để lộ rõ quy mô, tỷ lệ Đọc:Ghi, SLO và ràng buộc lỗi trước khi vẽ kiến trúc.',
                          'Select which questions to ask in the first 5 minutes to uncover scale, Read:Write ratio, SLOs, and failure constraints.'
                        )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 font-mono text-xs font-extrabold',
                    isCaseUnlocked
                      ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                  )}
                >
                  {essentialAskedCount}/{essentialQuestions.length}{' '}
                  {t('câu cốt lõi', 'essential')}
                </span>

                {askedSet.size > 0 && (
                  <button
                    type="button"
                    onClick={handleResetStep1}
                    title={t('Làm lại Bước 1', 'Reset Step 1')}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 font-mono text-[11px] font-bold text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)] cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('Làm lại', 'Reset')}</span>
                  </button>
                )}

                {isCaseUnlocked && (
                  <button
                    type="button"
                    onClick={() => setIsStep1Collapsed((v) => !v)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-[11px] font-extrabold text-[var(--dts-ink)] cursor-pointer"
                  >
                    {isStep1Collapsed ? (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>{t('Xem lại câu hỏi', 'Show Questions')}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        <span>{t('Thu gọn', 'Collapse')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {!isStep1Collapsed && (
              <div className="grid grid-cols-1 @[820px]:grid-cols-2 gap-3 p-4">
                {activeCase.clarifyingQuestions.map((q, idx) => {
                  const asked = askedSet.has(q.id);
                  const isEssential = q.kind === 'essential';
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        if (!asked) handleAskQuestion(q.id);
                      }}
                      role={asked ? undefined : 'button'}
                      tabIndex={asked ? undefined : 0}
                      onKeyDown={(e) => {
                        if (!asked && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleAskQuestion(q.id);
                        }
                      }}
                      className={cn(
                        'rounded-xl border p-3.5 transition-all',
                        !asked
                          ? 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:border-[var(--dts-border)] hover:bg-[var(--dts-panel-elevated)] cursor-pointer'
                          : isEssential
                            ? 'border-[var(--dts-border)] bg-[var(--dts-green-soft)]'
                            : 'border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] font-mono text-[10.5px] font-extrabold text-[var(--dts-ink-muted)]">
                            Q{idx + 1}
                          </span>
                          <p className="text-xs sm:text-[13px] font-bold leading-snug text-[var(--dts-ink)]">
                            {pickText(q.question, lang)}
                          </p>
                        </div>

                        {!asked ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-[var(--dts-blue-ink)]">
                            <HelpCircle className="h-3 w-3" />
                            <span>{t('Hỏi', 'Ask')}</span>
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'shrink-0 rounded-lg px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase',
                              isEssential
                                ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                                : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                            )}
                          >
                            {pickText(DIMENSION_LABELS[q.dimension], lang)}
                          </span>
                        )}
                      </div>

                      {asked && (
                        <div className="mt-2.5 space-y-1.5 border-t border-[var(--dts-line-strong)]/60 pt-2 text-xs leading-relaxed">
                          <div className="text-[var(--dts-ink)]">
                            <span className="font-mono font-extrabold">
                              {isEssential
                                ? t('Trả lời từ bài toán: ', 'Stakeholder Answer: ')
                                : t('Ghi nhận nhanh: ', 'Quick Note: ')}
                            </span>
                            {pickText(q.answer, lang)}
                          </div>
                          <div className="text-[var(--dts-ink-soft)]">
                            <span className="font-mono font-extrabold">
                              {isEssential
                                ? t('Tác động kiến trúc: ', 'Design Impact: ')
                                : t('Vì sao ưu tiên thấp trong 45 phút: ', 'Why low-priority in 45m: ')}
                            </span>
                            {pickText(q.rationale, lang)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. Cổng mở khoá: Chưa đủ 4 câu cốt lõi -> thông báo rõ ràng; Đủ 4 câu -> mở Capacity Card + Timeline v1..v4 */}
          {!isCaseUnlocked ? (
            <section className="rounded-2xl border-2 border-dashed border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-6 text-center space-y-2">
              <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                {t(
                  'Hoàn thành Bước 1 để mở khoá Ước lượng Năng lực & Dòng thời gian Tiến hóa (v1 → v4)',
                  'Complete Step 1 to unlock the Capacity Card & Architecture Evolution Timeline (v1 → v4)'
                )}
              </h3>
              <p className="mx-auto max-w-xl text-xs text-[var(--dts-ink-soft)]">
                {t(
                  `Theo nguyên tắc Problem-First, chưa vẽ sơ đồ khi chưa biết quy mô và SLO. Bạn cần làm rõ thêm ${essentialQuestions.length - essentialAskedCount} câu hỏi kỹ thuật cốt lõi ở trên.`,
                  `Following Problem-First engineering, clarify the remaining ${essentialQuestions.length - essentialAskedCount} essential constraint question(s) above before designing.`
                )}
              </p>
            </section>
          ) : (
            <>
              {/* 3A. Synthesized Requirements, Napkin Math & SNAKE Card */}
              <section className="dts-card-tactile rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--dts-amber-ink)] shrink-0" />
                    <h2 className="font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                      {t(
                        'Thẻ Tổng hợp Yêu cầu, Ước lượng Năng lực & Khung SNAKE',
                        'Synthesized Requirements, Capacity Math & SNAKE Summary'
                      )}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeCase.capacityCard.slos.map((slo, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-[var(--dts-border)] bg-[var(--dts-green-bg)] px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-[var(--dts-green-ink)]"
                      >
                        SLO · {pickText(slo, lang)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 @[720px]:grid-cols-3 @[1100px]:grid-cols-6 gap-2.5">
                  {[
                    { k: t('Quy mô / Kết nối', 'Scale / Active'), v: activeCase.capacityCard.dau },
                    { k: t('Tải Đọc (Read)', 'Read RPS'), v: activeCase.capacityCard.readRps },
                    { k: t('Tải Ghi (Write)', 'Write RPS'), v: activeCase.capacityCard.writeRps },
                    { k: t('Tỷ lệ Đọc : Ghi', 'Read : Write'), v: activeCase.capacityCard.readWriteRatio },
                    { k: t('Lưu trữ / ngày', 'Storage / Day'), v: activeCase.capacityCard.storagePerDay },
                    { k: t('RAM / Băng thông', 'RAM / Offload'), v: activeCase.capacityCard.memoryOrBandwidth },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5"
                    >
                      <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                        {item.k}
                      </div>
                      <div className="mt-1 font-mono text-xs font-extrabold text-[var(--dts-ink)] leading-snug">
                        {pickText(item.v, lang)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* SNAKE 5-stage compact strip */}
                <div className="grid grid-cols-1 @[880px]:grid-cols-5 gap-2 pt-1">
                  {[
                    { tag: 'S · Scope', body: activeCase.capacityCard.snakeSummary.scope },
                    { tag: 'N · Numbers', body: activeCase.capacityCard.snakeSummary.numbers },
                    { tag: 'A · API', body: activeCase.capacityCard.snakeSummary.api },
                    { tag: 'K · Key Blocks', body: activeCase.capacityCard.snakeSummary.keyComponents },
                    { tag: 'E · Elaborate', body: activeCase.capacityCard.snakeSummary.elaborate },
                  ].map((sn) => (
                    <div
                      key={sn.tag}
                      className="rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)]/65 px-3 py-2"
                    >
                      <div className="font-mono text-[10px] font-extrabold text-[var(--dts-purple-ink)]">
                        {sn.tag}
                      </div>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--dts-ink-soft)]">
                        {pickText(sn.body, lang)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3B. Runnable Evolution Timeline (v1 -> v2 -> v3 -> v4) on ScaleStageSvg */}
              <section className="dts-card-tactile rounded-2xl overflow-hidden">
                {/* Timeline Stepper Header */}
                <div className="border-b border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                        {t(
                          'BƯỚC 2 · DÒNG THỜI GIAN TIẾN HÓA KIẾN TRÚC CHẠY ĐƯỢC',
                          'STEP 2 · RUNNABLE ARCHITECTURE EVOLUTION TIMELINE'
                        )}
                      </div>
                      <h2 className="font-mono text-base font-extrabold text-[var(--dts-ink)]">
                        {activeStage.versionLabel}: {pickText(activeStage.title, lang)}
                      </h2>
                    </div>

                    {/* Simulation Controls */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSimMode((m) => (m === 'live' ? 'static' : 'live'))
                        }
                        className={cn(
                          'dts-btn-tactile inline-flex h-8 items-center gap-1.5 rounded-xl px-3 font-mono text-xs font-extrabold cursor-pointer',
                          simMode === 'live'
                            ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                            : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                        )}
                      >
                        {simMode === 'live' ? (
                          <Square className="h-3 w-3 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                        <span>
                          {t('Chạy mô phỏng trực tiếp', 'Run Live Simulation')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSimMode((m) => (m === 'stress' ? 'static' : 'stress'))
                        }
                        className={cn(
                          'dts-btn-tactile inline-flex h-8 items-center gap-1.5 rounded-xl px-3 font-mono text-xs font-extrabold cursor-pointer',
                          simMode === 'stress'
                            ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                            : 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]'
                        )}
                      >
                        <Flame className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t(
                            `Stress-Test tại mốc tải kế tiếp (×${activeStage.stressMultiplier})`,
                            `Stress-Test Next Scale (×${activeStage.stressMultiplier})`
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplayNonce((n) => n + 1)}
                        title={t('Chạy lại hoạt cảnh', 'Replay stage animation')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)] cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* v1 -> v2 -> v3 -> v4 Milestone Pills */}
                  <div className="grid grid-cols-2 @[760px]:grid-cols-4 gap-2">
                    {activeCase.stages.map((st, idx) => {
                      const active = idx === stageIdx;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleSelectStage(idx)}
                          className={cn(
                            'flex flex-col justify-between rounded-xl p-2.5 text-left transition-all cursor-pointer',
                            active
                              ? 'dts-card-tactile bg-[var(--dts-blue-soft)]'
                              : 'border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] hover:border-[var(--dts-border)]'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={cn(
                                'rounded-md px-1.5 py-0.5 font-mono text-xs font-extrabold',
                                active
                                  ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                                  : 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink-soft)]'
                              )}
                            >
                              {st.versionLabel}
                            </span>
                            <span className="font-mono text-[11px] font-extrabold tabular-nums text-[var(--dts-ink-muted)]">
                              {formatRps(st.targetRps)} req/s
                            </span>
                          </div>
                          <div className="mt-1.5 line-clamp-1 font-mono text-xs font-bold text-[var(--dts-ink)]">
                            {pickText(st.title, lang)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Persistent 2.5D Isometric Stage (Never attach key so v1 -> v4 morphs smoothly!) */}
                <div className="relative h-[340px] sm:h-[420px] w-full border-b border-[var(--dts-border-soft)] bg-[var(--dts-stage-bg)]">
                  <ScaleStageSvg
                    scene={activeStage.scene}
                    lang={lang as WorkbenchLang}
                    theme={theme}
                    isPlaying={true}
                    replayNonce={replayNonce}
                    frameSource={activeFrameSource}
                    renderLiveSlot={activeFrameSource ? renderLiveSlot : undefined}
                    className="h-full w-full"
                  />

                  {simMode !== 'static' && (
                    <div className="pointer-events-none absolute right-3 bottom-2.5 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)]/95 px-2.5 py-1 font-mono text-[10.5px] font-extrabold shadow-[1px_1.5px_0_var(--dts-shadow-color)]">
                      <Activity
                        className={cn(
                          'h-3 w-3',
                          simMode === 'stress'
                            ? 'text-[var(--dts-rose-ink)]'
                            : 'text-[var(--dts-green-ink)]'
                        )}
                      />
                      <span>
                        {simMode === 'stress'
                          ? t(
                              `STRESS ×${activeStage.stressMultiplier} ĐANG CHẠY (${formatRps(displayedMetrics.offeredRps)} req/s)`,
                              `STRESS ×${activeStage.stressMultiplier} LIVE (${formatRps(displayedMetrics.offeredRps)} req/s)`
                            )
                          : t(
                              `LIVE 1× ĐANG CHẠY (${formatRps(displayedMetrics.offeredRps)} req/s)`,
                              `LIVE 1× RUNNING (${formatRps(displayedMetrics.offeredRps)} req/s)`
                            )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Engine-Computed Telemetry Strip */}
                <div className="grid grid-cols-2 @[780px]:grid-cols-5 gap-2.5 border-b border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-3.5">
                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-ink-muted)]">
                      {simMode === 'stress'
                        ? t(`Tải Stress (×${activeStage.stressMultiplier})`, `Stress Load (×${activeStage.stressMultiplier})`)
                        : t('Target RPS (1×)', 'Target RPS (1×)')}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-extrabold tabular-nums text-[var(--dts-ink)]">
                      {formatRps(displayedMetrics.offeredRps)} req/s
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-ink-muted)]">
                      {t('Max Sustainable RPS', 'Max Sustainable RPS')}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-extrabold tabular-nums text-[var(--dts-blue-ink)]">
                      ~{formatRps(displayedMetrics.maxRps)} req/s
                    </div>
                    <div className="truncate font-mono text-[10px] text-[var(--dts-ink-muted)]">
                      {t('Giới hạn bởi: ', 'Limited by: ')}
                      {nodeNameOf(displayedMetrics.limitedByNodeId)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-ink-muted)]">
                      {t('Độ trễ p99', 'Latency p99')}
                    </div>
                    <div
                      className={cn(
                        'mt-0.5 font-mono text-sm font-extrabold tabular-nums',
                        displayedMetrics.p99Ms > 250
                          ? 'text-[var(--dts-rose-ink)]'
                          : displayedMetrics.p99Ms > 120
                            ? 'text-[var(--dts-amber-ink)]'
                            : 'text-[var(--dts-green-ink)]'
                      )}
                    >
                      {displayedMetrics.p99Ms.toFixed(1)} ms
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-ink-muted)]">
                      {t('Tỷ lệ lỗi (Error %)', 'Error Rate (%)')}
                    </div>
                    <div
                      className={cn(
                        'mt-0.5 font-mono text-sm font-extrabold tabular-nums',
                        displayedMetrics.errorPct >= 1
                          ? 'text-[var(--dts-rose-ink)]'
                          : 'text-[var(--dts-green-ink)]'
                      )}
                    >
                      {displayedMetrics.errorPct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="col-span-2 @[780px]:col-span-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-ink-muted)]">
                      {t('Chi phí hạ tầng', 'Infra Cost')}
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-extrabold tabular-nums text-[var(--dts-ink)]">
                      ${displayedMetrics.costPerHour.toFixed(2)}/h
                    </div>
                  </div>
                </div>

                {/* Stress-Test Diagnostic & Why Next Stage Banner */}
                <div
                  className={cn(
                    'border-b border-[var(--dts-border-soft)] px-4 py-3.5 transition-colors',
                    simMode === 'stress'
                      ? 'bg-[var(--dts-rose-soft)]'
                      : 'bg-[var(--dts-amber-soft)]/60'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-extrabold">
                        <AlertTriangle
                          className={cn(
                            'h-4 w-4 shrink-0',
                            simMode === 'stress'
                              ? 'text-[var(--dts-rose-ink)]'
                              : 'text-[var(--dts-amber-ink)]'
                          )}
                        />
                        <span
                          className={
                            simMode === 'stress'
                              ? 'text-[var(--dts-rose-ink)]'
                              : 'text-[var(--dts-amber-ink)]'
                          }
                        >
                          {simMode === 'stress'
                            ? t(
                                `Điểm nghẽn lộ diện ở ×${activeStage.stressMultiplier}: ${nodeNameOf(displayedMetrics.bottleneckNodeId)} (ρ = ${displayedMetrics.bottleneckRho.toFixed(2)} · ${pickText(BOTTLENECK_REASON_LABELS[displayedMetrics.bottleneckReason], lang)})`,
                                `Bottleneck exposed at ×${activeStage.stressMultiplier}: ${nodeNameOf(displayedMetrics.bottleneckNodeId)} (ρ = ${displayedMetrics.bottleneckRho.toFixed(2)} · ${pickText(BOTTLENECK_REASON_LABELS[displayedMetrics.bottleneckReason], lang)})`
                              )
                            : nextStage
                              ? t(
                                  `Vì sao cần tiến hóa lên ${nextStage.versionLabel} (${formatRps(nextStage.targetRps)} req/s)?`,
                                  `Why evolve to ${nextStage.versionLabel} (${formatRps(nextStage.targetRps)} req/s)?`
                                )
                              : t(
                                  'Giới hạn vật lý tiếp theo ở quy mô đa châu lục',
                                  'Next physical horizon at multi-region scale'
                                )}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--dts-ink)]">
                        {pickText(activeStage.whyNextStage, lang)}
                      </p>
                    </div>

                    {nextStage && (
                      <button
                        type="button"
                        onClick={() => handleSelectStage(stageIdx + 1)}
                        className="dts-btn-tactile inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)] cursor-pointer"
                      >
                        <span>
                          {t(
                            `Nâng cấp lên ${nextStage.versionLabel}`,
                            `Evolve to ${nextStage.versionLabel}`
                          )}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stage Summary + WhatChanged Diff + Trade-offs */}
                <div className="grid grid-cols-1 @[900px]:grid-cols-2 gap-4 p-4 sm:p-5">
                  {/* Left: Summary + Diff */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                        {pickText(activeStage.eraTag, lang)}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--dts-ink)]">
                        {pickText(activeStage.summary, lang)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3.5 space-y-2">
                      <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                        {t(
                          `Thay đổi kiến trúc tại ${activeStage.versionLabel} (Diff)`,
                          `Architectural Changes in ${activeStage.versionLabel} (Diff)`
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {activeStage.whatChanged.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                            <span
                              className={cn(
                                'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[11px] font-extrabold',
                                d.op === '+'
                                  ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                                  : d.op === '~'
                                    ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                                    : 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                              )}
                            >
                              {d.op}
                            </span>
                            <span className="text-[var(--dts-ink)]">
                              {pickText(d.text, lang)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right: Architectural Trade-offs */}
                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3.5 space-y-2.5">
                    <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                      {t('Đánh đổi Kỹ thuật (Key Trade-offs)', 'Key Architectural Trade-offs')}
                    </div>
                    <div className="space-y-2.5">
                      {activeStage.tradeOffs.map((tr, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] p-3 space-y-1.5 text-xs"
                        >
                          <div className="font-mono font-extrabold text-[var(--dts-ink)]">
                            {pickText(tr.decision, lang)}
                          </div>
                          <div className="text-[var(--dts-ink-soft)]">
                            <span className="font-mono font-extrabold text-[var(--dts-green-ink)]">
                              {t('+ Đạt được: ', '+ Gain: ')}
                            </span>
                            {pickText(tr.gain, lang)}
                          </div>
                          <div className="text-[var(--dts-ink-soft)]">
                            <span className="font-mono font-extrabold text-[var(--dts-amber-ink)]">
                              {t('~ Đánh đổi: ', '~ Cost: ')}
                            </span>
                            {pickText(tr.cost, lang)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SdCasesView;
