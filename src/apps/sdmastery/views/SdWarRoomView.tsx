import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Star,
  XCircle,
} from 'lucide-react';
import { ScaleStageSvg } from '@/components/scale-workbench/ScaleStageSvg';
import { SimTimeline } from '@/components/scale-workbench/live/SimTimeline';
import {
  RequestTracerButton,
  RequestTracerDrawer,
} from '@/components/scale-workbench/live/RequestTracer';
import { useSimClock } from '@/components/scale-workbench/live/useSimClock';
import {
  pickText,
  type BilingualText,
  type LiveSimFrame,
  type LiveTrace,
} from '@/components/scale-workbench/types';
import { createLiveSimSession } from '@/features/sysdesign-course/live/liveSimAdapter';
import { NodeLivePanel } from '@/features/sysdesign-course/live/NodeLivePanel';
import {
  applyChangesToModel,
  runAndEvaluate,
  type Constraint,
  type ConstraintResult,
  type SimScenario,
} from '@/features/sysdesign-course/sim';
import { gradeActivity } from '@/features/sysdesign-course/activities/grade';
import type {
  GradeContext,
  GradeResult,
  Loc,
  SimDocForGrade,
} from '@/features/sysdesign-course/activities/types';
import { useSdNav, useSdProgress } from '@/features/sysdesign-course/store';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import { useSdStore } from '../store/useSdStore';
import {
  WAR_ROOM_INCIDENTS,
  warRoomChangesToInputRecords,
  type WarRoomIncident,
  type WarRoomMitigation,
} from '../data/warRoomIncidents';

export interface SdWarRoomViewProps {
  initialIncidentId?: string;
  onOpenModule?: (moduleId: string) => void;
}

type RightPanelTab = 'mitigate' | 'postmortem';

interface PersistedIncidentState {
  mitigated: boolean;
  appliedMitigationIds: string[];
  postmortemPassed: boolean;
  postmortemStars: 0 | 1 | 2 | 3;
  postmortemScore: number;
  postmortemAnswers: Record<string, string[]>;
  reflectionText: string;
}

type WarRoomProgressMap = Record<string, PersistedIncidentState>;

const STORAGE_KEY = 'sd_warroom_progress_v1';

function loadWarRoomProgress(): WarRoomProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as WarRoomProgressMap;
    }
  } catch {
    // ignore localStorage errors
  }
  return {};
}

function saveWarRoomProgress(map: WarRoomProgressMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore localStorage errors
  }
}

function locStr(t: Loc | BilingualText | string | undefined, lang: WorkbenchLang): string {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return lang === 'en' ? (t.en ?? t.vi) : t.vi;
}

function formatConstraintValue(c: Constraint, val: number | string | null): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string') return val;
  switch (c.kind) {
    case 'slo-latency':
      return `${Math.round(val)} ms`;
    case 'slo-error':
      return `${(val * 100).toFixed(1)}%`;
    case 'throughput':
      return `${Math.round(val).toLocaleString('en-US')} req/s`;
    case 'cost':
      return `$${val.toFixed(2)}/h`;
    case 'node-state':
      return `${(val * 100).toFixed(1)}%`;
    case 'structural':
      return val === 0 ? 'OK' : `${val} issue`;
  }
}

function formatConstraintTarget(c: Constraint): string {
  switch (c.kind) {
    case 'slo-latency':
      return `≤ ${c.maxMs} ms`;
    case 'slo-error':
      return `≤ ${(c.maxRate * 100).toFixed(1)}%`;
    case 'throughput':
      return `≥ ${c.minGoodputRps.toLocaleString('en-US')} req/s`;
    case 'cost':
      return `≤ $${c.maxPerHour.toFixed(2)}/h`;
    case 'node-state':
      return `≤ ${c.allowViolationPct ?? 2}%`;
    case 'structural':
      return '0 issue';
  }
}

interface EvaluationSnapshot {
  pass: boolean;
  withinBudget: boolean;
  overallPass: boolean;
  usedCost: number;
  results: ConstraintResult[];
  triggeredTraps: WarRoomMitigation[];
  appliedIds: string[];
}

export const SdWarRoomView: React.FC<SdWarRoomViewProps> = ({
  initialIncidentId,
  onOpenModule,
}) => {
  const lang = useWorkbenchStore((s) => s.language);
  const theme = useWorkbenchStore((s) => s.workbenchTheme);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setActiveAppTab = useSdStore((s) => s.setActiveTab);
  const goSd = useSdNav((s) => s.go);
  const recordActivity = useSdProgress((s) => s.recordActivity);
  const addOrUpdateNote = useUserDataStore((s) => s.addOrUpdateNote);
  const openNotesDrawer = useNavigationStore((s) => s.openNotesDrawer);

  const [progressMap, setProgressMap] = useState<WarRoomProgressMap>(() =>
    loadWarRoomProgress()
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (
      initialIncidentId &&
      WAR_ROOM_INCIDENTS.some((x) => x.id === initialIncidentId)
    ) {
      return initialIncidentId;
    }
    return WAR_ROOM_INCIDENTS[0].id;
  });

  const activeIncident: WarRoomIncident = useMemo(
    () =>
      WAR_ROOM_INCIDENTS.find((x) => x.id === selectedId) ??
      WAR_ROOM_INCIDENTS[0],
    [selectedId]
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightPanelTab>('mitigate');

  // Mitigation selection & live preview model
  const [selectedMitigationIds, setSelectedMitigationIds] = useState<string[]>(
    () => progressMap[activeIncident.id]?.appliedMitigationIds ?? []
  );
  const [livePreviewIds, setLivePreviewIds] = useState<string[]>([]);
  const [evalSnapshot, setEvalSnapshot] = useState<EvaluationSnapshot | null>(null);

  // Playback & live trace state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [replayNonce, setReplayNonce] = useState<number>(0);
  const [activeTrace, setActiveTrace] = useState<LiveTrace | null>(null);
  const [liveFrame, setLiveFrame] = useState<LiveSimFrame | null>(null);

  // Postmortem form state
  const [pmAnswers, setPmAnswers] = useState<Record<string, string[]>>(
    () => progressMap[activeIncident.id]?.postmortemAnswers ?? {}
  );
  const [reflectionText, setReflectionText] = useState<string>(
    () => progressMap[activeIncident.id]?.reflectionText ?? ''
  );
  const [pmResult, setPmResult] = useState<GradeResult | null>(null);
  const [noteSavedToast, setNoteSavedToast] = useState<boolean>(false);

  // Sync state when switching incidents
  useEffect(() => {
    const saved = progressMap[activeIncident.id];
    setSelectedMitigationIds(saved?.appliedMitigationIds ?? []);
    setLivePreviewIds([]);
    setEvalSnapshot(null);
    setPmAnswers(saved?.postmortemAnswers ?? {});
    setReflectionText(saved?.reflectionText ?? '');
    setPmResult(null);
    setNoteSavedToast(false);
    setActiveTrace(null);
    setRightTab('mitigate');
    setSpeed(1);
    setIsPlaying(true);
    setReplayNonce((n) => n + 1);
  }, [activeIncident.id]);

  // Build GradeContext once for all 9 incidents
  const gradeCtx: GradeContext = useMemo(() => {
    const sims: Record<string, SimDocForGrade> = {};
    for (const inc of WAR_ROOM_INCIDENTS) {
      sims[inc.scenario.id] = {
        id: inc.scenario.id,
        scenario: inc.scenario,
        slos: inc.slos,
      };
    }
    return { sims };
  }, []);

  // Build active SimScenario (baseline or live-patched when user clicks Apply & Verify)
  const activeScenario: SimScenario = useMemo(() => {
    if (livePreviewIds.length === 0) return activeIncident.scenario;
    const chosen = activeIncident.mitigations.filter((m) =>
      livePreviewIds.includes(m.id)
    );
    const recs = warRoomChangesToInputRecords(
      chosen.flatMap((m) => m.changes),
      0
    );
    return {
      ...activeIncident.scenario,
      model: applyChangesToModel(activeIncident.scenario.model, recs),
    };
  }, [activeIncident, livePreviewIds]);

  const session = useMemo(() => {
    const startSec =
      livePreviewIds.length > 0
        ? Math.max(0, activeIncident.alertAtSec - 2)
        : 0;
    return createLiveSimSession(activeScenario, {
      ...activeIncident.liveSpec,
      startAtSec: startSec,
    });
  }, [activeScenario, activeIncident.liveSpec, activeIncident.alertAtSec, livePreviewIds]);

  useEffect(() => {
    setLiveFrame(session.source.getFrame());
    const unsub = session.source.subscribe((f) => setLiveFrame(f), { hz: 5 });
    return () => {
      unsub();
      session.dispose();
    };
  }, [session]);

  // Close trace drawer on Escape
  useEffect(() => {
    if (!activeTrace) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTrace(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTrace]);

  const clock = useSimClock({
    session,
    isPlaying,
    speed,
    onEnd: () => setIsPlaying(false),
  });

  const handleResetPlayback = useCallback(() => {
    session.reset();
    setActiveTrace(null);
    setLiveFrame(session.source.getFrame());
    setIsPlaying(true);
    setReplayNonce((n) => n + 1);
  }, [session]);

  const handleJumpToPeak = useCallback(() => {
    const target = activeIncident.peakAtSec;
    if (session.getHeadT() < target) {
      session.advanceTo(target);
    }
    clock.seek(target);
    setIsPlaying(false);
    setLiveFrame(session.source.getFrame());
  }, [activeIncident.peakAtSec, clock, session]);

  const handleTraceSample = useCallback(() => {
    if (session.getT() < activeIncident.alertAtSec && livePreviewIds.length === 0) {
      session.advanceTo(activeIncident.peakAtSec);
      clock.seek(activeIncident.peakAtSec);
    }
    setIsPlaying(false);
    const tr = session.trace({});
    setActiveTrace(tr);
    setLiveFrame(session.source.getFrame());
  }, [activeIncident.alertAtSec, activeIncident.peakAtSec, clock, livePreviewIds.length, session]);

  const handleOpenModule = useCallback(
    (moduleId: string) => {
      if (onOpenModule) {
        onOpenModule(moduleId);
        return;
      }
      const levelGuess = Number(moduleId.slice(1, 2));
      if (!Number.isNaN(levelGuess)) {
        useWorkbenchStore.getState().setExpandedLevel('sdmastery', levelGuess);
      }
      setCourseCursor('sdmastery', moduleId, 0);
      setActiveAppTab('learn');
      goSd({ name: 'workbench' });
    },
    [goSd, onOpenModule, setActiveAppTab, setCourseCursor]
  );

  const toggleMitigation = (id: string) => {
    setSelectedMitigationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedMitigations = useMemo(
    () =>
      activeIncident.mitigations.filter((m) =>
        selectedMitigationIds.includes(m.id)
      ),
    [activeIncident.mitigations, selectedMitigationIds]
  );

  const usedBudget = useMemo(
    () => selectedMitigations.reduce((sum, m) => sum + m.cost, 0),
    [selectedMitigations]
  );

  const persistIncidentPatch = useCallback(
    (incidentId: string, patch: Partial<PersistedIncidentState>) => {
      setProgressMap((prev) => {
        const cur: PersistedIncidentState = prev[incidentId] ?? {
          mitigated: false,
          appliedMitigationIds: [],
          postmortemPassed: false,
          postmortemStars: 0,
          postmortemScore: 0,
          postmortemAnswers: {},
          reflectionText: '',
        };
        const next: WarRoomProgressMap = {
          ...prev,
          [incidentId]: { ...cur, ...patch },
        };
        saveWarRoomProgress(next);
        return next;
      });
    },
    []
  );

  const handleApplyAndVerify = () => {
    const recs = warRoomChangesToInputRecords(
      selectedMitigations.flatMap((m) => m.changes),
      0
    );
    const evalOut = runAndEvaluate(
      activeIncident.scenario,
      activeIncident.slos,
      recs
    );
    const withinBudget =
      selectedMitigations.length > 0 &&
      usedBudget <= activeIncident.changeBudget;
    const overallPass = evalOut.pass && withinBudget;
    const triggeredTraps = selectedMitigations.filter((m) => m.isTrap);

    setEvalSnapshot({
      pass: evalOut.pass,
      withinBudget,
      overallPass,
      usedCost: usedBudget,
      results: evalOut.results,
      triggeredTraps,
      appliedIds: [...selectedMitigationIds],
    });

    // Reload live stage with these mitigations applied so learner sees live impact
    setLivePreviewIds([...selectedMitigationIds]);
    setActiveTrace(null);
    setIsPlaying(true);

    if (overallPass) {
      persistIncidentPatch(activeIncident.id, {
        mitigated: true,
        appliedMitigationIds: [...selectedMitigationIds],
      });
    } else {
      persistIncidentPatch(activeIncident.id, {
        appliedMitigationIds: [...selectedMitigationIds],
      });
    }
  };

  const handleResetToBaseline = () => {
    setSelectedMitigationIds([]);
    setLivePreviewIds([]);
    setEvalSnapshot(null);
    setActiveTrace(null);
    setIsPlaying(true);
    setReplayNonce((n) => n + 1);
  };

  const handleGradePostmortem = () => {
    const res = gradeActivity(
      activeIncident.postmortem,
      {
        answers: pmAnswers,
        reflection: reflectionText,
      },
      gradeCtx
    );
    setPmResult(res);
    recordActivity({
      activityId: activeIncident.postmortem.id,
      kind: 'postmortem',
      xpBase: activeIncident.postmortem.xp,
      score: res.score,
      stars: res.stars,
      passed: res.passed,
      hintsUsed: 0,
      solutionViewed: false,
    });
    const prevBest = progressMap[activeIncident.id]?.postmortemStars ?? 0;
    persistIncidentPatch(activeIncident.id, {
      postmortemPassed:
        Boolean(progressMap[activeIncident.id]?.postmortemPassed) || res.passed,
      postmortemStars: Math.max(prevBest, res.stars) as 0 | 1 | 2 | 3,
      postmortemScore: Math.max(
        progressMap[activeIncident.id]?.postmortemScore ?? 0,
        res.score
      ),
      postmortemAnswers: pmAnswers,
      reflectionText,
    });
  };

  const handleSavePostmortemToNotes = async () => {
    const noteTargetId = `sd-warroom-${activeIncident.id}`;
    const noteTitle = `[War-Room ${activeIncident.id}] ${pickText(
      activeIncident.title,
      lang
    )}`;

    const appliedFixesText =
      selectedMitigations.length > 0
        ? selectedMitigations
            .map((m) => `- ${pickText(m.label, lang)} (${m.targetBadge})`)
            .join('\n')
        : lang === 'en'
          ? '- (Not mitigated yet)'
          : '- (Chưa áp dụng cấu hình khắc phục)';

    const qaLines = activeIncident.postmortem.questions
      .map((q) => {
        const pickedIds = pmAnswers[q.id] ?? [];
        const pickedTexts = q.options
          .filter((o) => pickedIds.includes(o.id))
          .map((o) => locStr(o.text, lang));
        return `${locStr(q.prompt, lang)}\n→ ${
          pickedTexts.length > 0 ? pickedTexts.join('; ') : '—'
        }`;
      })
      .join('\n\n');

    const lines = [
      `# ${noteTitle} (${activeIncident.severity})`,
      `${pickText(activeIncident.summary, lang)}`,
      '',
      lang === 'en' ? '## Applied Mitigations' : '## Biện pháp khắc phục đã chọn',
      appliedFixesText,
      '',
      lang === 'en' ? '## Postmortem Analysis' : '## Phân tích Postmortem',
      qaLines,
    ];

    if (reflectionText.trim()) {
      lines.push(
        '',
        lang === 'en' ? '## Operational Takeaways' : '## Ghi chú vận hành cá nhân',
        reflectionText.trim()
      );
    }

    await addOrUpdateNote({
      targetType: 'lesson',
      targetId: noteTargetId,
      targetTitle: noteTitle,
      content: lines.join('\n'),
    });

    setNoteSavedToast(true);
    openNotesDrawer('lesson', noteTargetId, noteTitle);
  };

  // Compute live KPI display values
  const metrics = liveFrame?.metrics;
  const offeredRps = metrics?.offeredRps ?? 0;
  const goodputRps = metrics?.goodputRps ?? 0;
  const p99Ms = metrics?.p99 ?? 0;
  const errPct = (metrics?.errorRate ?? 0) * 100;
  const amp = metrics?.amplification ?? 1;

  const p99SloVal =
    activeIncident.liveSpec.slo?.find((s) => s.metric === 'p99')?.value ?? 200;
  const errSloVal =
    (activeIncident.liveSpec.slo?.find((s) => s.metric === 'errorRate')?.value ??
      0.01) * 100;
  const isFrameBreaching = p99Ms > p99SloVal || errPct > errSloVal + 0.05;

  const solvedCount = useMemo(
    () =>
      WAR_ROOM_INCIDENTS.filter((inc) => progressMap[inc.id]?.mitigated).length,
    [progressMap]
  );

  const curSaved = progressMap[activeIncident.id];
  const bestStars = Math.max(
    curSaved?.postmortemStars ?? 0,
    pmResult?.stars ?? 0
  ) as 0 | 1 | 2 | 3;

  return (
    <div className="@container/warroom flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--dts-canvas)] text-[var(--dts-ink)] @[980px]/warroom:flex-row">
      {/* ─────────────── LEFT SIDEBAR: 9 INCIDENTS ─────────────── */}
      {sidebarOpen ? (
        <aside className="flex max-h-[220px] w-full shrink-0 flex-col border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] @[980px]/warroom:h-full @[980px]/warroom:max-h-none @[980px]/warroom:w-[272px] @[980px]/warroom:border-r @[980px]/warroom:border-b-0">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--dts-border-soft)] px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#e5534b]" />
              <div className="min-w-0">
                <div className="truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                  {lang === 'en' ? 'War-Room Incidents' : 'Sự cố Production'}
                </div>
                <div className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                  {lang === 'en'
                    ? `${solvedCount}/9 mitigated`
                    : `Đã xử lý ${solvedCount}/9 ca`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title={lang === 'en' ? 'Collapse incident list' : 'Thu gọn danh sách'}
              aria-label={lang === 'en' ? 'Collapse incident list' : 'Thu gọn danh sách'}
              className="hidden @[980px]/warroom:inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {WAR_ROOM_INCIDENTS.map((inc) => {
              const isSelected = inc.id === activeIncident.id;
              const st = progressMap[inc.id];
              const isSolved = Boolean(st?.mitigated);
              const stars = st?.postmortemStars ?? 0;

              return (
                <div
                  key={inc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(inc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(inc.id);
                    }
                  }}
                  className={cn(
                    'group cursor-pointer rounded-xl border p-2.5 transition-colors',
                    isSelected
                      ? 'border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] shadow-xs'
                      : 'border-[var(--dts-border-soft)] bg-[var(--dts-panel)] hover:border-[var(--dts-line-strong)] hover:bg-[var(--dts-panel-muted)]/60'
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10.5px] font-extrabold text-[var(--dts-ink-muted)]">
                        {inc.id}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-extrabold',
                          inc.severity === 'SEV-1'
                            ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                            : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                        )}
                      >
                        {!isSolved && inc.severity === 'SEV-1' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#e5534b]" />
                        )}
                        {inc.severity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {stars > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#ca8a04]"
                          title={`Postmortem: ${stars}/3`}
                        >
                          <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" />
                          {stars}
                        </span>
                      )}
                      {isSolved && (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-[#2e7d32] dark:text-[#86efac]"
                          aria-label={lang === 'en' ? 'Solved' : 'Đã khắc phục'}
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'mt-1 text-xs leading-snug',
                      isSelected
                        ? 'font-extrabold text-[var(--dts-ink)]'
                        : 'font-semibold text-[var(--dts-ink-soft)] group-hover:text-[var(--dts-ink)]'
                    )}
                  >
                    {pickText(inc.title, lang)}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {inc.relatedModules.map((modId) => (
                      <button
                        key={modId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModule(modId);
                        }}
                        title={
                          lang === 'en'
                            ? `Open foundational lesson ${modId}`
                            : `Mở bài học nền tảng ${modId}`
                        }
                        className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[var(--dts-blue-ink)] hover:bg-[var(--dts-blue-bg)]"
                      >
                        <BookOpen className="h-2.5 w-2.5" />
                        <span>{modId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      ) : (
        <div className="hidden @[980px]/warroom:flex h-full w-11 shrink-0 flex-col items-center border-r border-[var(--dts-line-strong)] bg-[var(--dts-panel)] py-2.5 gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title={lang === 'en' ? 'Expand incident list' : 'Mở danh sách sự cố'}
            aria-label={lang === 'en' ? 'Expand incident list' : 'Mở danh sách sự cố'}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
          <div className="flex flex-col gap-1 overflow-y-auto">
            {WAR_ROOM_INCIDENTS.map((inc) => {
              const isSelected = inc.id === activeIncident.id;
              const isSolved = Boolean(progressMap[inc.id]?.mitigated);
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => setSelectedId(inc.id)}
                  title={`${inc.id} — ${pickText(inc.title, lang)}`}
                  className={cn(
                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg font-mono text-[10px] font-extrabold',
                    isSelected
                      ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] border border-[var(--dts-border)]'
                      : isSolved
                        ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                        : 'text-[var(--dts-ink-muted)] hover:bg-[var(--dts-panel-muted)]'
                  )}
                >
                  {inc.order}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────── CENTER STAGE: PAGER + KPIS + 2.5D STAGE + TIMELINE ─────────────── */}
      <section className="flex min-h-[420px] min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5 @[980px]/warroom:min-h-0 @[980px]/warroom:overflow-hidden">
        {/* Pager Banner */}
        <div
          className={cn(
            'shrink-0 rounded-2xl border px-3 py-2',
            livePreviewIds.length > 0 && evalSnapshot?.overallPass
              ? 'border-[#4caf50]/50 bg-[var(--dts-green-bg)]/45'
              : 'border-[#e5534b]/45 bg-[var(--dts-rose-bg)]/40'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle
                className={cn(
                  'h-4 w-4 shrink-0',
                  livePreviewIds.length > 0 && evalSnapshot?.overallPass
                    ? 'text-[var(--dts-green-ink)]'
                    : 'text-[var(--dts-rose-ink)]'
                )}
              />
              <span className="font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                {pickText(activeIncident.symptom.pagerAlert, lang)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'rounded-lg px-2 py-0.5 font-mono text-[10px] font-extrabold',
                  livePreviewIds.length > 0
                    ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                    : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] border border-[var(--dts-line-strong)]'
                )}
              >
                {livePreviewIds.length > 0
                  ? lang === 'en'
                    ? `Live Preview: ${livePreviewIds.length} change(s)`
                    : `Đang chạy bản vá (${livePreviewIds.length} thay đổi)`
                  : lang === 'en'
                    ? 'Baseline Outage'
                    : 'Hiện trường gốc (chưa vá)'}
              </span>

              <button
                type="button"
                onClick={handleJumpToPeak}
                className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 font-mono text-[10px] font-bold text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]"
              >
                <Crosshair className="h-3 w-3 text-[var(--dts-amber-ink)]" />
                <span>
                  {lang === 'en'
                    ? `Inspect Peak (${activeIncident.peakAtSec}s)`
                    : `Tua tới đỉnh (${activeIncident.peakAtSec}s)`}
                </span>
              </button>
            </div>
          </div>

          <p className="mt-1 text-xs text-[var(--dts-ink-soft)]">
            <strong className="font-semibold text-[var(--dts-ink)]">
              {lang === 'en' ? 'Impact: ' : 'Ảnh hưởng: '}
            </strong>
            {pickText(activeIncident.symptom.customerImpact, lang)}
          </p>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeIncident.symptom.telemetryClues.map((clue, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel)]/85 px-2 py-0.5 text-[11px] text-[var(--dts-ink-soft)]"
              >
                • {pickText(clue, lang)}
              </span>
            ))}
          </div>
        </div>

        {/* Live 6-KPI Strip + Tracer trigger */}
        <div className="flex shrink-0 flex-wrap items-stretch justify-between gap-1.5">
          <div className="grid flex-1 grid-cols-3 gap-1.5 @[640px]/warroom:grid-cols-6">
            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Offered
              </div>
              <div className="font-mono text-[12px] font-extrabold tabular-nums text-[var(--dts-ink)]">
                {Math.round(offeredRps).toLocaleString('en-US')}{' '}
                <span className="text-[9.5px] font-normal text-[var(--dts-ink-muted)]">rps</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Goodput
              </div>
              <div className="font-mono text-[12px] font-extrabold tabular-nums text-[#2e6b19] dark:text-[#a8e686]">
                {Math.round(goodputRps).toLocaleString('en-US')}{' '}
                <span className="text-[9.5px] font-normal text-[var(--dts-ink-muted)]">rps</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                p99
              </div>
              <div
                className={cn(
                  'font-mono text-[12px] font-extrabold tabular-nums',
                  p99Ms > p99SloVal
                    ? 'text-[#b82c24] dark:text-[#fca5a5]'
                    : 'text-[var(--dts-ink)]'
                )}
              >
                {Math.round(p99Ms)} ms
              </div>
            </div>

            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Error %
              </div>
              <div
                className={cn(
                  'font-mono text-[12px] font-extrabold tabular-nums',
                  errPct > errSloVal + 0.05
                    ? 'text-[#b82c24] dark:text-[#fca5a5]'
                    : 'text-[var(--dts-ink)]'
                )}
              >
                {errPct.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Amplification
              </div>
              <div
                className={cn(
                  'font-mono text-[12px] font-extrabold tabular-nums',
                  amp > 2.6
                    ? 'text-[#8a5708] dark:text-[#fde68a]'
                    : 'text-[var(--dts-ink)]'
                )}
              >
                {amp.toFixed(2)}×
              </div>
            </div>

            <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1">
              <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                SLO Status
              </div>
              <div
                className={cn(
                  'font-mono text-[11px] font-extrabold',
                  evalSnapshot
                    ? evalSnapshot.overallPass
                      ? 'text-[#2e6b19] dark:text-[#a8e686]'
                      : 'text-[#b82c24] dark:text-[#fca5a5]'
                    : isFrameBreaching
                      ? 'text-[#b82c24] dark:text-[#fca5a5]'
                      : 'text-[#2e6b19] dark:text-[#a8e686]'
                )}
              >
                {evalSnapshot
                  ? evalSnapshot.overallPass
                    ? lang === 'en'
                      ? 'PASS ALL'
                      : 'ĐẠT SLO'
                    : lang === 'en'
                      ? 'FAILING'
                      : 'VI PHẠM'
                  : isFrameBreaching
                    ? lang === 'en'
                      ? 'BREACHING'
                      : 'ĐANG VI PHẠM'
                    : lang === 'en'
                      ? 'NOMINAL'
                      : 'ỔN ĐỊNH'}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <RequestTracerButton
              onTraceSample={handleTraceSample}
              lang={lang}
              active={activeTrace !== null}
            />
          </div>
        </div>

        {/* Live 2.5D Isometric Stage */}
        <div className="dts-panel relative min-h-[250px] flex-1 overflow-hidden rounded-2xl">
          <ScaleStageSvg
            scene={activeIncident.scene}
            lang={lang}
            theme={theme}
            isPlaying={isPlaying}
            replayNonce={replayNonce}
            frameSource={session.source}
            liveOptions={{ tracerEnabled: true }}
            onPacketPick={(p) => {
              setIsPlaying(false);
              setActiveTrace(
                session.trace({
                  packetId: p.id,
                  linkId: p.linkId,
                  kind: p.kind,
                })
              );
            }}
            renderLiveSlot={(ent) => (
              <NodeLivePanel
                session={session}
                spec={activeIncident.liveSpec}
                entity={ent}
                lang={lang}
              />
            )}
          />
          <RequestTracerDrawer
            trace={activeTrace}
            lang={lang}
            onClose={() => setActiveTrace(null)}
          />
        </div>

        {/* Timeline Scrubber & Sparklines */}
        <SimTimeline
          session={session}
          spec={activeIncident.liveSpec}
          lang={lang}
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onChangeSpeed={setSpeed}
          onSeek={(tSec) => {
            clock.seek(tSec);
            setLiveFrame(session.source.getFrame());
          }}
          onReset={handleResetPlayback}
        />
      </section>

      {/* ─────────────── RIGHT PANEL: MITIGATE & POSTMORTEM TABS ─────────────── */}
      <aside className="flex w-full shrink-0 flex-col border-t border-[var(--dts-line-strong)] bg-[var(--dts-panel)] @[980px]/warroom:h-full @[980px]/warroom:w-[390px] @[1280px]/warroom:w-[420px] @[980px]/warroom:border-l @[980px]/warroom:border-t-0">
        {/* Segmented Tab Switcher */}
        <div className="shrink-0 border-b border-[var(--dts-border-soft)] p-2.5">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] p-1">
            <button
              type="button"
              onClick={() => setRightTab('mitigate')}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 font-mono text-[11px] font-extrabold transition-colors',
                rightTab === 'mitigate'
                  ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                  : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>
                {lang === 'en' ? '1. Mitigate' : '1. Khắc phục sự cố'}
              </span>
              {curSaved?.mitigated && (
                <Check className="h-3.5 w-3.5 text-[#2e7d32] dark:text-[#86efac]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setRightTab('postmortem')}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 font-mono text-[11px] font-extrabold transition-colors',
                rightTab === 'postmortem'
                  ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                  : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>
                {lang === 'en' ? '2. Postmortem' : '2. Báo cáo Postmortem'}
              </span>
              {bestStars > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#ca8a04]">
                  ★{bestStars}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {rightTab === 'mitigate' ? (
            <>
              {/* Budget & Reset Bar */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2 font-mono text-[11px]">
                <div>
                  <span className="text-[var(--dts-ink-muted)]">
                    {lang === 'en' ? 'Change Budget: ' : 'Ngân sách thay đổi: '}
                  </span>
                  <strong
                    className={cn(
                      'font-extrabold',
                      usedBudget > activeIncident.changeBudget
                        ? 'text-[#e5534b]'
                        : 'text-[var(--dts-ink)]'
                    )}
                  >
                    {usedBudget} / {activeIncident.changeBudget}
                  </strong>
                </div>

                {(selectedMitigationIds.length > 0 || livePreviewIds.length > 0) && (
                  <button
                    type="button"
                    onClick={handleResetToBaseline}
                    className="inline-flex cursor-pointer items-center gap-1 text-[10.5px] font-bold text-[var(--dts-blue-ink)] hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{lang === 'en' ? 'Reset baseline' : 'Khôi phục gốc'}</span>
                  </button>
                )}
              </div>

              {/* Actionable Mitigation Controls */}
              <div className="space-y-2">
                <div className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                  {lang === 'en'
                    ? 'Select Remediation Actions'
                    : 'Chọn thao tác cấu hình khắc phục'}
                </div>

                {activeIncident.mitigations.map((m) => {
                  const checked = selectedMitigationIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors',
                        checked
                          ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)]/55'
                          : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] hover:bg-[var(--dts-panel-muted)]/50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMitigation(m.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--dts-blue-ink)]"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs font-bold leading-snug text-[var(--dts-ink)]">
                          {pickText(m.label, lang)}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <code className="rounded bg-[var(--dts-panel-muted)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-blue-ink)]">
                            {m.targetBadge}
                          </code>
                          <span className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                            ({lang === 'en' ? `Cost: ${m.cost}` : `Chi phí: ${m.cost}`})
                          </span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                          {pickText(m.description, lang)}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Apply & Verify Button */}
              <button
                type="button"
                disabled={selectedMitigationIds.length === 0}
                onClick={handleApplyAndVerify}
                className="dts-btn-tactile flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--dts-blue-bg)] py-2.5 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Play className="h-3.5 w-3.5" />
                <span>
                  {lang === 'en'
                    ? 'Apply & Verify SLOs'
                    : 'Áp dụng & Kiểm tra SLO'}
                </span>
              </button>

              {/* Target SLO Checklist / Evaluation Results */}
              <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {lang === 'en'
                      ? 'Incident SLO Verification'
                      : 'Kết quả kiểm tra ràng buộc SLO'}
                  </span>
                  {evalSnapshot && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-mono text-[10px] font-extrabold',
                        evalSnapshot.overallPass
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                      )}
                    >
                      {evalSnapshot.overallPass
                        ? lang === 'en'
                          ? 'ALL SLOs MET'
                          : 'ĐẠT TOÀN BỘ SLO'
                        : lang === 'en'
                          ? 'SLO VIOLATED'
                          : 'CHƯA ĐẠT SLO'}
                    </span>
                  )}
                </div>

                {/* Budget warning */}
                {evalSnapshot && !evalSnapshot.withinBudget && (
                  <div className="rounded-xl border border-[#e5534b]/40 bg-[var(--dts-rose-bg)] px-2.5 py-2 text-xs text-[var(--dts-rose-ink)]">
                    {lang === 'en'
                      ? `Change budget exceeded (${evalSnapshot.usedCost}/${activeIncident.changeBudget}). Remove unnecessary changes.`
                      : `Vượt quá ngân sách thay đổi cho phép (${evalSnapshot.usedCost}/${activeIncident.changeBudget}). Hãy bỏ bớt các thay đổi không cần thiết.`}
                  </div>
                )}

                {/* Red-herring trap warnings */}
                {evalSnapshot &&
                  evalSnapshot.triggeredTraps.map((trap) =>
                    trap.trapWarning ? (
                      <div
                        key={trap.id}
                        className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] p-2.5 text-xs leading-relaxed text-[var(--dts-amber-ink)]"
                      >
                        <div className="font-mono text-[10.5px] font-extrabold uppercase">
                          {lang === 'en'
                            ? `Diagnostic Warning — ${trap.targetBadge}`
                            : `Cảnh báo chẩn đoán — ${trap.targetBadge}`}
                        </div>
                        <p className="mt-0.5">{pickText(trap.trapWarning, lang)}</p>
                      </div>
                    ) : null
                  )}

                {/* Individual SLO rows */}
                <div className="space-y-1.5">
                  {activeIncident.slos.map((slo) => {
                    const res = evalSnapshot?.results.find((r) => r.id === slo.id);
                    const desc =
                      activeIncident.sloDescriptions[slo.id] ?? {
                        vi: slo.id,
                        en: slo.id,
                      };
                    return (
                      <div
                        key={slo.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-start gap-1.5 min-w-0">
                          {res ? (
                            res.pass ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2e7d32] dark:text-[#86efac]" />
                            ) : (
                              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e5534b]" />
                            )
                          ) : (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--dts-ink-muted)]" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--dts-ink)] leading-snug">
                              {pickText(desc, lang)}
                            </div>
                            {res && !res.pass && res.worstAtSec !== undefined && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (session.getHeadT() < res.worstAtSec!) {
                                    session.advanceTo(res.worstAtSec!);
                                  }
                                  clock.seek(res.worstAtSec!);
                                  setIsPlaying(false);
                                  setLiveFrame(session.source.getFrame());
                                }}
                                className="mt-0.5 cursor-pointer font-mono text-[10px] font-bold text-[var(--dts-blue-ink)] hover:underline"
                              >
                                {lang === 'en'
                                  ? `Jump to worst at ${res.worstAtSec.toFixed(1)}s`
                                  : `Xem thời điểm tệ nhất (${res.worstAtSec.toFixed(1)}s)`}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-mono text-[10.5px] tabular-nums">
                          {res ? (
                            <span
                              className={cn(
                                'font-extrabold',
                                res.pass
                                  ? 'text-[#2e6b19] dark:text-[#a8e686]'
                                  : 'text-[#b82c24] dark:text-[#fca5a5]'
                              )}
                            >
                              {formatConstraintValue(slo, res.actual)}
                            </span>
                          ) : (
                            <span className="text-[var(--dts-ink-muted)]">
                              {formatConstraintTarget(slo)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Proceed to Postmortem CTA when solved */}
                {evalSnapshot?.overallPass && (
                  <button
                    type="button"
                    onClick={() => setRightTab('postmortem')}
                    className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
                  >
                    <span>
                      {lang === 'en'
                        ? 'Proceed to Postmortem Report'
                        : 'Chuyển sang viết Báo cáo Postmortem'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ─────────────── TAB 2: POSTMORTEM REPORT ─────────────── */
            <>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3 py-2">
                <div>
                  <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                    {locStr(activeIncident.postmortem.title, lang)}
                  </div>
                  <div className="text-[11px] text-[var(--dts-ink-muted)]">
                    {locStr(activeIncident.postmortem.prompt, lang)}
                  </div>
                </div>
                <div
                  className="inline-flex shrink-0 items-center gap-0.5"
                  title={`${bestStars}/3`}
                >
                  {([1, 2, 3] as const).map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'h-4 w-4',
                        s <= bestStars
                          ? 'fill-[#eab308] text-[#eab308]'
                          : 'text-[var(--dts-line-strong)]'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Postmortem Questions */}
              <div className="space-y-2.5">
                {activeIncident.postmortem.questions.map((q) => {
                  const picked = pmAnswers[q.id] ?? [];
                  const checkItem = pmResult?.checks.find((c) => c.id === q.id);

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-extrabold text-[var(--dts-ink)] leading-snug">
                          {locStr(q.prompt, lang)}
                        </div>
                        <span className="shrink-0 rounded bg-[var(--dts-panel-muted)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[var(--dts-ink-muted)]">
                          {q.weight}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        {q.options.map((opt) => {
                          const active = picked.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                const nextPicked =
                                  q.type === 'single'
                                    ? [opt.id]
                                    : active
                                      ? picked.filter((x) => x !== opt.id)
                                      : [...picked, opt.id];
                                setPmAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: nextPicked,
                                }));
                              }}
                              className={cn(
                                'flex w-full cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors',
                                active
                                  ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-bold'
                                  : 'border-[var(--dts-border-soft)] bg-[var(--dts-panel)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]/60'
                              )}
                            >
                              <span className="font-mono text-[10.5px] font-extrabold uppercase">
                                [{opt.id}]
                              </span>
                              <span className="leading-snug">
                                {locStr(opt.text, lang)}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {checkItem && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 font-mono text-[10.5px] font-bold',
                            checkItem.pass
                              ? 'text-[#2e6b19] dark:text-[#a8e686]'
                              : 'text-[#b82c24] dark:text-[#fca5a5]'
                          )}
                        >
                          {checkItem.pass ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {checkItem.pass
                              ? lang === 'en'
                                ? 'Accurate analysis'
                                : 'Chính xác'
                              : lang === 'en'
                                ? 'Review telemetry & reconsider'
                                : 'Chưa đúng — hãy đối chiếu lại telemetry'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Personal Reflection */}
              {activeIncident.postmortem.reflection && (
                <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5 space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-[var(--dts-ink)]">
                    {locStr(activeIncident.postmortem.reflection.prompt, lang)}
                  </label>
                  <textarea
                    rows={3}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'e.g., Enforce singleflight + 20% TTL jitter in our Redis wrapper...'
                        : 'Ví dụ: Luôn bật singleflight + TTL jitter 20% trong thư viện cache chung...'
                    }
                    className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2 text-xs text-[var(--dts-ink)] placeholder-[var(--dts-ink-muted)] focus:outline-2 focus:outline-[var(--dts-blue-ink)]"
                  />
                </div>
              )}

              {/* Grade & Save Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGradePostmortem}
                  className="dts-btn-tactile flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--dts-blue-bg)] py-2.5 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)]"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>
                    {lang === 'en'
                      ? 'Grade Postmortem'
                      : 'Chấm bài & Xem giải thích'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePostmortemToNotes}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] py-2 font-mono text-xs font-bold text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]"
                >
                  <BookmarkPlus className="h-4 w-4 text-[var(--dts-amber-ink)]" />
                  <span>
                    {lang === 'en'
                      ? 'Save Postmortem to Notes'
                      : 'Lưu Postmortem vào Ghi chú'}
                  </span>
                </button>

                {noteSavedToast && (
                  <div className="text-center font-mono text-[10.5px] font-bold text-[#2e6b19] dark:text-[#a8e686]">
                    {lang === 'en'
                      ? '✓ Saved to Notes (IndexedDB)'
                      : '✓ Đã lưu báo cáo Postmortem vào Ghi chú'}
                  </div>
                )}
              </div>

              {/* Postmortem Grade Result Explanation */}
              {pmResult && (
                <div
                  className={cn(
                    'rounded-2xl border p-3 space-y-1.5 text-xs leading-relaxed',
                    pmResult.passed
                      ? 'border-[#4caf50]/50 bg-[var(--dts-green-bg)]/45 text-[var(--dts-ink)]'
                      : 'border-[#e5534b]/45 bg-[var(--dts-rose-bg)]/35 text-[var(--dts-ink)]'
                  )}
                >
                  <div className="flex items-center justify-between font-mono text-xs font-extrabold">
                    <span>
                      {pmResult.passed
                        ? lang === 'en'
                          ? `Passed (${pmResult.score}/100)`
                          : `Đạt yêu cầu (${pmResult.score}/100)`
                        : lang === 'en'
                          ? `Not passed yet (${pmResult.score}/100)`
                          : `Chưa đạt (${pmResult.score}/100)`}
                    </span>
                    <span>{'★'.repeat(pmResult.stars)}{'☆'.repeat(3 - pmResult.stars)}</span>
                  </div>
                  <p className="text-[var(--dts-ink-soft)]">
                    {locStr(
                      pmResult.resolvedExplain ?? activeIncident.postmortem.explain,
                      lang
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default SdWarRoomView;
