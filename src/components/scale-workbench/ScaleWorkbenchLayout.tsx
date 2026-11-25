import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  FileText,
  Layers,
  Lightbulb,
  ListChecks,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  DEFAULT_RIGHT_SIDEBAR_WIDTH,
  useWorkbenchStore,
} from '@/stores/useWorkbenchStore';
import type { RunResult } from '@/features/workpath/types';
import { ScaleStageSvg } from './ScaleStageSvg';
import { MemoryStageSvg } from './MemoryStageSvg';
import { CodeTraceStage } from './CodeTraceStage';
import { WorkbenchCodeSurface } from './WorkbenchCodeSurface';
import { BlueprintMarkdown } from './BlueprintMarkdown';
import { WORKBENCH_I18N } from './i18n';
import {
  pickText,
  type CalloutKind,
  type PacketKind,
  type ScaleModuleLesson,
  type StepCategory,
} from './types';
import { cn } from '@/utils/cn';

const FOLDER_COLORS = [
  '#f6cd82', // 00 warm yellow
  '#f3b47f', // 01 soft orange
  '#cbbae6', // 02 pastel purple
  '#a9c5e8', // 03 pastel blue
  '#f3b5bc', // 04 pastel rose
  '#b3d79f', // 05 sage green
  '#9bd3d9', // 06 soft teal
  '#b8c0f0', // 07 periwinkle
  '#c5dfa4', // 08 lime sage
];

const FolderBadge: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 20 16" className="h-3.5 w-4 shrink-0" aria-hidden="true">
    <path
      d="M1.5 3A1.5 1.5 0 0 1 3 1.5h4.2l1.8 2H17A1.5 1.5 0 0 1 18.5 5v8A1.5 1.5 0 0 1 17 14.5H3A1.5 1.5 0 0 1 1.5 13V3Z"
      fill={color}
      stroke="var(--dts-border)"
      strokeWidth={1.35}
      strokeLinejoin="round"
    />
  </svg>
);

function getCategoryStyle(cat: StepCategory): string {
  switch (cat) {
    case 'PROBLEM':
    case 'PITFALL':
      return 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]';
    case 'TECHNIQUE':
      return 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]';
    case 'MECHANISM':
      return 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]';
    case 'SETUP':
      return 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]';
    case 'REAL_CODE':
    case 'RECAP':
    default:
      return 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]';
  }
}

function getCalloutMeta(kind: CalloutKind): {
  boxCls: string;
  Icon: React.FC<{ className?: string }>;
} {
  switch (kind) {
    case 'watch-out':
      return {
        boxCls: 'bg-[var(--dts-rose-soft)] text-[var(--dts-rose-ink)] border-[var(--dts-line-strong)]',
        Icon: AlertTriangle,
      };
    case 'compare':
      return {
        boxCls: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)] border-[var(--dts-line-strong)]',
        Icon: Code2,
      };
    case 'good-to-know':
      return {
        boxCls: 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)] border-[var(--dts-line-strong)]',
        Icon: Sparkles,
      };
    case 'technique':
      return {
        boxCls: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)] border-[var(--dts-line-strong)]',
        Icon: Layers,
      };
    case 'key-idea':
    default:
      return {
        boxCls: 'bg-[var(--dts-purple-soft)] text-[var(--dts-purple-ink)] border-[var(--dts-line-strong)]',
        Icon: Lightbulb,
      };
  }
}

const LegendDot: React.FC<{ kind: PacketKind }> = ({ kind }) => {
  switch (kind) {
    case 'request':
      return <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--dts-border)] bg-[#f3b47f]" />;
    case 'response':
      return <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--dts-border)] bg-[#9fd28f]" />;
    case 'pointer':
      return <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#2f8a43] bg-[#f4fbef]" />;
    case 'mutation':
      return <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-[var(--dts-border)] bg-[#b79ce6]" />;
    case 'cache-hit':
      return <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--dts-border)] bg-[#efb041]" />;
    case 'error':
      return <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-[#5e1b16] bg-[#e5534b]" />;
  }
};

export interface ModuleStatusSnapshot {
  completed: boolean;
  lessonRead: boolean;
  passedExercises: number;
  totalExercises: number;
  quizPassed: boolean;
}

export interface ScaleWorkbenchLayoutProps {
  courseId: string;
  lessons: ScaleModuleLesson[];
  getModuleStatus: (moduleId: string) => ModuleStatusSnapshot;
  onMarkLessonComplete: (moduleId: string) => void;
  onOpenQuiz?: (moduleId: string) => void;
  onOpenExercises?: (moduleId: string) => void;
  onOpenFlashcards?: (moduleId: string) => void;
  onOpenReadings?: (moduleId: string) => void;
  onRunCodeSnippet?: (code: string) => Promise<RunResult>;
  sandboxTitle?: string;
  runCodeLabel?: string;
}

export const ScaleWorkbenchLayout: React.FC<ScaleWorkbenchLayoutProps> = ({
  courseId,
  lessons,
  getModuleStatus,
  onMarkLessonComplete,
  onOpenQuiz,
  onOpenExercises,
  onOpenFlashcards,
  onOpenReadings,
  onRunCodeSnippet,
  sandboxTitle = 'Python 3.12 (Pyodide)',
  runCodeLabel,
}) => {
  const {
    lang,
    theme,
    cursors,
    expandedLevels,
    isProgressExpanded,
    isLeftSidebarCollapsed,
    rightSidebarWidth,
    setCourseCursor,
    setExpandedLevel,
    toggleProgressExpanded,
    toggleLeftSidebarCollapsed,
    setRightSidebarWidth,
  } = useWorkbenchStore(
    useShallow((s) => ({
      lang: s.language,
      theme: s.workbenchTheme,
      cursors: s.cursors,
      expandedLevels: s.expandedLevels,
      isProgressExpanded: s.isProgressExpanded,
      isLeftSidebarCollapsed: s.isLeftSidebarCollapsed,
      rightSidebarWidth: s.rightSidebarWidth,
      setCourseCursor: s.setCourseCursor,
      setExpandedLevel: s.setExpandedLevel,
      toggleProgressExpanded: s.toggleProgressExpanded,
      toggleLeftSidebarCollapsed: s.toggleLeftSidebarCollapsed,
      setRightSidebarWidth: s.setRightSidebarWidth,
    }))
  );

  const t = WORKBENCH_I18N[lang];
  const cursor = cursors[courseId] ?? {
    moduleId: lessons[0]?.moduleId ?? 'M00',
    stepIndex: 0,
  };

  const activeLessonIdx = useMemo(() => {
    const found = lessons.findIndex((l) => l.moduleId === cursor.moduleId);
    return found >= 0 ? found : 0;
  }, [lessons, cursor.moduleId]);

  const activeLesson = lessons[activeLessonIdx] ?? lessons[0];
  const safeStepIdx = Math.max(
    0,
    Math.min((activeLesson?.steps.length ?? 1) - 1, cursor.stepIndex)
  );
  const activeStep = activeLesson?.steps[safeStepIdx];

  const [isPlaying, setIsPlaying] = useState(true);
  const [replayNonce, setReplayNonce] = useState(0);
  const [manualSandboxOpen, setManualSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxOut, setSandboxOut] = useState<RunResult | null>(null);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [railFlyout, setRailFlyout] = useState<
    | { kind: 'expand' | 'progress'; top: number }
    | { kind: 'chapter'; level: number; top: number }
    | null
  >(null);

  const rootContainerRef = useRef<HTMLDivElement>(null);
  const leftAsideRef = useRef<HTMLElement>(null);
  const centerStageCardRef = useRef<HTMLDivElement>(null);
  const railHideTimerRef = useRef<number | null>(null);
  const narrativeScrollRef = useRef<HTMLDivElement>(null);
  const [isCenterCompact, setIsCenterCompact] = useState(false);
  const [isMobileHeaderStuck, setIsMobileHeaderStuck] = useState(false);

  useEffect(() => {
    const el = centerStageCardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    setIsCenterCompact(el.getBoundingClientRect().width < 585);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number' && w > 0) {
        setIsCenterCompact(w < 585);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const openRailFlyout = useCallback(
    (
      el: HTMLElement,
      payload:
        | { kind: 'expand' | 'progress' }
        | { kind: 'chapter'; level: number }
    ) => {
      if (railHideTimerRef.current !== null) {
        window.clearTimeout(railHideTimerRef.current);
        railHideTimerRef.current = null;
      }
      const asideRect = leftAsideRef.current?.getBoundingClientRect();
      const btnRect = el.getBoundingClientRect();
      const rawTop = asideRect ? btnRect.top - asideRect.top : 0;
      const maxTop = asideRect ? Math.max(0, asideRect.height - 230) : rawTop;
      const clampedTop =
        payload.kind === 'chapter'
          ? Math.max(0, Math.min(maxTop, rawTop - 6))
          : Math.max(0, rawTop);
      setRailFlyout({ ...payload, top: clampedTop });
    },
    []
  );

  const scheduleCloseRailFlyout = useCallback(() => {
    if (railHideTimerRef.current !== null) {
      window.clearTimeout(railHideTimerRef.current);
    }
    railHideTimerRef.current = window.setTimeout(() => {
      setRailFlyout(null);
      railHideTimerRef.current = null;
    }, 130);
  }, []);

  const cancelCloseRailFlyout = useCallback(() => {
    if (railHideTimerRef.current !== null) {
      window.clearTimeout(railHideTimerRef.current);
      railHideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (railHideTimerRef.current !== null) {
        window.clearTimeout(railHideTimerRef.current);
      }
    };
  }, []);

  const handleStartRightResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = rightSidebarWidth;
      const containerW =
        rootContainerRef.current?.getBoundingClientRect().width ?? 1440;
      const leftW =
        leftAsideRef.current?.getBoundingClientRect().width ??
        (isLeftSidebarCollapsed ? 62 : 254);
      const maxAllowed = Math.max(
        380,
        Math.min(1180, Math.floor(containerW - leftW - 260))
      );

      setIsResizingRight(true);
      const prevCursor = document.body.style.cursor;
      const prevSelect = document.body.style.userSelect;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (ev: PointerEvent) => {
        const delta = startX - ev.clientX;
        const nextW = Math.max(320, Math.min(maxAllowed, startWidth + delta));
        setRightSidebarWidth(nextW);
      };

      const onUp = () => {
        setIsResizingRight(false);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevSelect;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [rightSidebarWidth, setRightSidebarWidth, isLeftSidebarCollapsed]
  );

  const levelGroups = useMemo(() => {
    const map = new Map<
      number,
      { level: number; titleVi: string; titleEn: string; items: ScaleModuleLesson[] }
    >();
    for (const l of lessons) {
      let g = map.get(l.level);
      if (!g) {
        g = {
          level: l.level,
          titleVi: l.levelTitle.vi,
          titleEn: l.levelTitle.en,
          items: [],
        };
        map.set(l.level, g);
      }
      g.items.push(l);
    }
    return [...map.values()].sort((a, b) => a.level - b.level);
  }, [lessons]);

  const openLevel = expandedLevels[courseId] ?? activeLesson?.level ?? 0;

  useEffect(() => {
    if (!activeLesson || !activeStep) return;
    setSandboxCode(
      activeStep.codeSnippet ??
        activeStep.codeTrace?.code ??
        `# ${activeLesson.moduleId} - ${pickText(activeStep.title, lang)}\nprint("Hello from ${activeLesson.moduleId}!")\n`
    );
    setSandboxOut(null);
    setManualSandboxOpen(false);
    narrativeScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeLesson?.moduleId, safeStepIdx, activeLesson, activeStep, lang]);

  const selectLessonAndStep = useCallback(
    (moduleId: string, stepIdx: number) => {
      const target = lessons.find((l) => l.moduleId === moduleId);
      if (!target) return;
      const clamped = Math.max(0, Math.min(target.steps.length - 1, stepIdx));
      const stepObj = target.steps[clamped];
      setCourseCursor(courseId, moduleId, clamped, {
        moduleTitleVi: target.title.vi,
        moduleTitleEn: target.title.en,
        stepTitleVi: stepObj.title.vi,
        stepTitleEn: stepObj.title.en,
      });
      setExpandedLevel(courseId, target.level);
      setMobileDrawerOpen(false);
    },
    [lessons, courseId, setCourseCursor, setExpandedLevel]
  );

  const handlePrevStep = useCallback(() => {
    if (!activeLesson) return;
    if (safeStepIdx > 0) {
      selectLessonAndStep(activeLesson.moduleId, safeStepIdx - 1);
    } else if (activeLessonIdx > 0) {
      const prevLesson = lessons[activeLessonIdx - 1];
      selectLessonAndStep(prevLesson.moduleId, prevLesson.steps.length - 1);
    }
  }, [activeLesson, safeStepIdx, activeLessonIdx, lessons, selectLessonAndStep]);

  const handleNextStep = useCallback(() => {
    if (!activeLesson) return;
    if (safeStepIdx < activeLesson.steps.length - 1) {
      const nextIdx = safeStepIdx + 1;
      if (nextIdx === activeLesson.steps.length - 1) {
        onMarkLessonComplete(activeLesson.moduleId);
      }
      selectLessonAndStep(activeLesson.moduleId, nextIdx);
    } else {
      onMarkLessonComplete(activeLesson.moduleId);
      if (activeLessonIdx < lessons.length - 1) {
        selectLessonAndStep(lessons[activeLessonIdx + 1].moduleId, 0);
      }
    }
  }, [
    activeLesson,
    safeStepIdx,
    activeLessonIdx,
    lessons,
    onMarkLessonComplete,
    selectLessonAndStep,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"]'
        )
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsPlaying(true);
        setReplayNonce((n) => n + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNextStep, handlePrevStep]);

  const handleRunSandbox = async () => {
    if (!onRunCodeSnippet || sandboxRunning) return;
    setSandboxRunning(true);
    try {
      const res = await onRunCodeSnippet(sandboxCode);
      setSandboxOut(res);
    } finally {
      setSandboxRunning(false);
    }
  };

  if (!activeLesson || !activeStep) return null;

  const totalCompletedLessons = lessons.filter(
    (l) => getModuleStatus(l.moduleId).completed || getModuleStatus(l.moduleId).lessonRead
  ).length;
  const activeStatus = getModuleStatus(activeLesson.moduleId);
  const isLastStep = safeStepIdx === activeLesson.steps.length - 1;
  const nextStepObj = activeLesson.steps[safeStepIdx + 1];
  const nextLessonObj = lessons[activeLessonIdx + 1];

  const isIsometricStage =
    activeStep.stageMode === 'isometric' && Boolean(activeStep.scene);
  const isMemoryStage =
    activeStep.stageMode === 'memory-2d' && Boolean(activeStep.memoryScene);
  const isNativeCodeTrace = activeStep.stageMode === 'code-trace';

  const legendKinds = useMemo(() => {
    if (!activeStep.scene) return [];
    const set = new Set<PacketKind>(['request', 'response']);
    for (const p of activeStep.scene.packets) set.add(p.kind);
    return [...set];
  }, [activeStep.scene]);

  const renderSyllabusContent = (showCollapseBtn = false) => (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="dts-panel flex min-h-0 flex-1 flex-col rounded-2xl p-3">
        <div className="mb-2.5 flex items-center justify-between gap-1 px-1">
          <div className="flex items-center gap-2 font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            <FolderBadge color="#211e1b" />
            <span>{t.course}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
              {t.lessonsCount(lessons.length)}
            </span>
            {showCollapseBtn && (
              <button
                type="button"
                onClick={() => {
                  setRailFlyout(null);
                  toggleLeftSidebarCollapsed();
                }}
                title={t.collapseSidebar}
                aria-label={t.collapseSidebar}
                className="dts-btn-tactile inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 space-y-1">
          {levelGroups.map((grp) => {
            const isOpen = openLevel === grp.level;
            const doneInGrp = grp.items.filter((it) => {
              const st = getModuleStatus(it.moduleId);
              return st.completed || st.lessonRead;
            }).length;
            const folderColor = FOLDER_COLORS[grp.level % FOLDER_COLORS.length];
            const lvlPrefix = String(grp.level).padStart(2, '0');

            return (
              <div key={grp.level}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedLevel(courseId, isOpen ? -1 : grp.level)
                  }
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[var(--dts-panel-muted)]"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
                  )}
                  <FolderBadge color={folderColor} />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] font-bold text-[var(--dts-ink)]">
                    {lvlPrefix}. {lang === 'en' ? grp.titleEn : grp.titleVi}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-[var(--dts-ink-muted)]">
                    {doneInGrp}/{grp.items.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-[var(--dts-border-soft)] pl-2.5">
                    {grp.items.map((item) => {
                      const isCurrent = item.moduleId === activeLesson.moduleId;
                      const st = getModuleStatus(item.moduleId);
                      const isDone = st.completed || st.lessonRead;

                      return (
                        <button
                          key={item.moduleId}
                          type="button"
                          onClick={() => selectLessonAndStep(item.moduleId, 0)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-mono text-[11.5px] transition-all',
                            isCurrent
                              ? 'dts-card-tactile bg-[var(--dts-green-bg)] font-extrabold text-[var(--dts-green-ink)]'
                              : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                          )}
                        >
                          {isDone ? (
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          ) : item.primaryMode === 'code-trace' ? (
                            <Code2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {pickText(item.title, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Collapsible PROGRESS Panel */}
      <div className="dts-panel shrink-0 rounded-2xl p-3">
        <button
          type="button"
          onClick={toggleProgressExpanded}
          className="flex w-full items-center justify-between font-mono text-[11px] font-extrabold tracking-wider text-[var(--dts-ink)]"
        >
          <span>{t.progress}</span>
          <span className="flex items-center gap-1 text-[var(--dts-ink-soft)]">
            {totalCompletedLessons} / {lessons.length}
            {isProgressExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]">
          <div
            style={{
              width: `${Math.round(
                (totalCompletedLessons / Math.max(1, lessons.length)) * 100
              )}%`,
            }}
            className="h-full bg-[#7fc278] transition-all duration-300"
          />
        </div>

        {isProgressExpanded && (
          <div className="mt-2.5 max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {levelGroups.map((grp) => {
              const doneInGrp = grp.items.filter((it) => {
                const st = getModuleStatus(it.moduleId);
                return st.completed || st.lessonRead;
              }).length;
              const allDone = doneInGrp === grp.items.length;

              return (
                <div
                  key={grp.level}
                  className="flex items-center justify-between gap-2 font-mono text-[11px] text-[var(--dts-ink-soft)]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--dts-line-strong)]',
                        allDone
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : doneInGrp > 0
                            ? 'bg-[var(--dts-green-soft)]'
                            : 'bg-[var(--dts-panel-elevated)]'
                      )}
                    >
                      {allDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate">
                      {lang === 'en' ? grp.titleEn : grp.titleVi}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-[var(--dts-ink-muted)]">
                    {doneInGrp}/{grp.items.length}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderCollapsedRail = () => {
    const hoveredGrp =
      railFlyout?.kind === 'chapter'
        ? levelGroups.find((g) => g.level === railFlyout.level)
        : undefined;
    const progressPct = Math.round(
      (totalCompletedLessons / Math.max(1, lessons.length)) * 100
    );

    return (
      <div className="relative flex h-full min-h-0 flex-col gap-2.5">
        <div className="dts-panel flex min-h-0 flex-1 flex-col items-center rounded-2xl px-1.5 py-2.5">
          <button
            type="button"
            onClick={() => {
              setRailFlyout(null);
              toggleLeftSidebarCollapsed();
            }}
            onMouseEnter={(e) =>
              openRailFlyout(e.currentTarget, { kind: 'expand' })
            }
            onMouseLeave={scheduleCloseRailFlyout}
            aria-label={t.expandSidebar}
            className="dts-btn-tactile mb-2 flex h-9 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>

          <div className="min-h-0 w-full flex-1 overflow-y-auto no-scrollbar space-y-1.5 py-0.5">
            {levelGroups.map((grp) => {
              const lvlPrefix = String(grp.level).padStart(2, '0');
              const folderColor =
                FOLDER_COLORS[grp.level % FOLDER_COLORS.length];
              const isCurrentLevel = activeLesson.level === grp.level;
              const doneInGrp = grp.items.filter((it) => {
                const st = getModuleStatus(it.moduleId);
                return st.completed || st.lessonRead;
              }).length;
              const allDone =
                grp.items.length > 0 && doneInGrp === grp.items.length;

              return (
                <button
                  key={grp.level}
                  type="button"
                  onMouseEnter={(e) =>
                    openRailFlyout(e.currentTarget, {
                      kind: 'chapter',
                      level: grp.level,
                    })
                  }
                  onMouseLeave={scheduleCloseRailFlyout}
                  onClick={() => {
                    const firstTarget =
                      grp.items.find(
                        (it) => it.moduleId === activeLesson.moduleId
                      ) ?? grp.items[0];
                    if (firstTarget) {
                      selectLessonAndStep(firstTarget.moduleId, 0);
                    }
                  }}
                  className={cn(
                    'relative mx-auto flex w-11 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-mono transition-all',
                    isCurrentLevel
                      ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] font-extrabold'
                      : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)] font-bold'
                  )}
                >
                  <FolderBadge color={folderColor} />
                  <span className="text-[10.5px] leading-none">{lvlPrefix}</span>
                  {allDone && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#3e9b4f]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Progress Pill */}
        <button
          type="button"
          onClick={() => {
            setRailFlyout(null);
            toggleLeftSidebarCollapsed();
          }}
          onMouseEnter={(e) =>
            openRailFlyout(e.currentTarget, { kind: 'progress' })
          }
          onMouseLeave={scheduleCloseRailFlyout}
          className="dts-panel flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 py-2.5 font-mono"
        >
          <span className="text-[10px] font-extrabold text-[var(--dts-ink)]">
            {totalCompletedLessons}/{lessons.length}
          </span>
          <div className="h-1.5 w-9 overflow-hidden rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)]">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-[#7fc278]"
            />
          </div>
        </button>

        {/* Unclipped Floating Tooltip / Chapter Lesson Flyout */}
        {railFlyout && (
          <div
            style={{ top: `${railFlyout.top}px` }}
            onMouseEnter={cancelCloseRailFlyout}
            onMouseLeave={scheduleCloseRailFlyout}
            className="absolute left-[calc(100%+8px)] z-50"
          >
            {/* Invisible hover bridge so moving mouse from rail to flyout never flickers */}
            <div className="absolute -left-3 top-0 bottom-0 w-3" />

            {railFlyout.kind === 'expand' && (
              <div className="whitespace-nowrap rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] shadow-[2px_3px_0_var(--dts-shadow-color)]">
                {t.expandSidebar}
              </div>
            )}

            {railFlyout.kind === 'progress' && (
              <div className="whitespace-nowrap rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-3 py-2 font-mono text-xs shadow-[2px_3px_0_var(--dts-shadow-color)]">
                <div className="font-extrabold text-[var(--dts-ink)]">
                  {t.progress}: {totalCompletedLessons} / {lessons.length} (
                  {progressPct}%)
                </div>
              </div>
            )}

            {railFlyout.kind === 'chapter' && hoveredGrp && (
              <div className="w-[258px] rounded-2xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] p-2.5 shadow-[3px_4px_0_var(--dts-shadow-color)]">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-[var(--dts-border-soft)] pb-1.5 px-1">
                  <div className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                    <FolderBadge
                      color={
                        FOLDER_COLORS[hoveredGrp.level % FOLDER_COLORS.length]
                      }
                    />
                    <span className="truncate">
                      {String(hoveredGrp.level).padStart(2, '0')}.{' '}
                      {lang === 'en' ? hoveredGrp.titleEn : hoveredGrp.titleVi}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] font-bold text-[var(--dts-ink-muted)]">
                    {
                      hoveredGrp.items.filter((it) => {
                        const st = getModuleStatus(it.moduleId);
                        return st.completed || st.lessonRead;
                      }).length
                    }
                    /{hoveredGrp.items.length}
                  </span>
                </div>

                <div className="max-h-60 space-y-1 overflow-y-auto pr-0.5">
                  {hoveredGrp.items.map((item) => {
                    const isCurrent = item.moduleId === activeLesson.moduleId;
                    const st = getModuleStatus(item.moduleId);
                    const isDone = st.completed || st.lessonRead;
                    return (
                      <button
                        key={item.moduleId}
                        type="button"
                        onClick={() => {
                          selectLessonAndStep(item.moduleId, 0);
                          setRailFlyout(null);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-mono text-[11.5px] transition-all',
                          isCurrent
                            ? 'dts-card-tactile bg-[var(--dts-green-bg)] font-extrabold text-[var(--dts-green-ink)]'
                            : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                        )}
                      >
                        {isDone ? (
                          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        ) : item.primaryMode === 'code-trace' ? (
                          <Code2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {pickText(item.title, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      {/* Sticky Floating Mobile/Tablet Header on Scroll (icon-only Menu + Lesson Title, zero layout shift) */}
      <div
        aria-hidden={!isMobileHeaderStuck}
        className={cn(
          'absolute top-0 inset-x-0 z-30 flex items-center gap-2 border-b border-[var(--dts-line-strong)] bg-[var(--dts-stage-bg)]/95 px-3 py-1.5 backdrop-blur-md shadow-xs transition-all duration-150 xl:hidden',
          isMobileHeaderStuck
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-2 opacity-0 pointer-events-none'
        )}
      >
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label={t.openCourseMenu}
          title={t.openCourseMenu}
          className="dts-btn-tactile inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
          {pickText(activeLesson.title, lang)}
        </span>
        <span className="shrink-0 rounded-full border border-[var(--dts-border)] bg-[var(--dts-purple-bg)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-purple-ink)] tabular-nums">
          {safeStepIdx + 1}/{activeLesson.steps.length}
        </span>
      </div>

      <div
        ref={rootContainerRef}
        onScroll={(e) => {
          const stuck = e.currentTarget.scrollTop > 56;
          setIsMobileHeaderStuck((prev) => (prev === stuck ? prev : stuck));
        }}
        className="relative flex min-h-0 flex-1 w-full flex-col xl:flex-row gap-2.5 p-2.5 sm:p-3.5 overflow-y-auto xl:overflow-hidden"
      >
      {/* Mobile / Tablet Slide-over Syllabus Drawer */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="absolute inset-0 z-50 flex bg-black/45 backdrop-blur-[1px] xl:hidden overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-[290px] max-w-[85vw] flex-col bg-[var(--dts-canvas)] p-3 shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider">
                {t.openCourseMenu}
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">{renderSyllabusContent(false)}</div>
          </div>
        </div>
      )}

      {/* 1. LEFT COLUMN (Collapsible into Icon + Chapter Number Rail with Hover Tooltip/Flyout) */}
      <aside
        ref={leftAsideRef}
        className={cn(
          'relative z-30 hidden xl:flex shrink-0 min-h-0 flex-col overflow-visible transition-[width] duration-200 ease-out',
          isLeftSidebarCollapsed
            ? 'xl:w-[62px]'
            : 'xl:w-[254px] 2xl:w-[268px]'
        )}
      >
        {isLeftSidebarCollapsed
          ? renderCollapsedRail()
          : renderSyllabusContent(true)}
      </aside>

      {/* 2. CENTER COLUMN */}
      <section className="flex min-w-0 flex-1 flex-col gap-2.5 xl:min-h-0">
        <div
          ref={centerStageCardRef}
          className="dts-panel flex flex-1 flex-col rounded-2xl p-3.5 sm:p-4 xl:min-h-0 bg-[var(--dts-stage-bg)]"
        >
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[var(--dts-ink-muted)]">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label={t.openCourseMenu}
                className="dts-btn-tactile inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-[var(--dts-panel-elevated)] px-2 py-1 text-[11px] font-bold text-[var(--dts-ink)] xl:hidden"
              >
                <Menu className="h-3.5 w-3.5 shrink-0" />
                <span>Menu</span>
              </button>
              <span>
                {String(activeLesson.level).padStart(2, '0')}.{' '}
                {pickText(activeLesson.levelTitle, lang)} /{' '}
                {t.lessonOf(activeLesson.orderInLevel, activeLesson.totalInLevel)}
              </span>
            </div>
          </div>

          {/* Lesson Title + 3 Pills */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-mono text-lg sm:text-[22px] font-extrabold tracking-tight text-[var(--dts-ink)]">
              {pickText(activeLesson.title, lang)}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] px-2.5 py-0.5 text-[var(--dts-amber-ink)]">
                <Clock className="h-3 w-3" />
                {t.minutes(activeLesson.durationMin)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--dts-border)] bg-[var(--dts-green-bg)] px-2.5 py-0.5 text-[var(--dts-green-ink)]">
                <BarChart2 className="h-3 w-3" />
                {t.difficulty[activeLesson.difficulty]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--dts-border)] bg-[var(--dts-purple-bg)] px-2.5 py-0.5 text-[var(--dts-purple-ink)]">
                <Layers className="h-3 w-3" />
                {t.stepsCount(activeLesson.steps.length)}
              </span>
            </div>
          </div>

          <p className="mt-0.5 font-mono text-xs text-[var(--dts-ink-muted)] line-clamp-1">
            {pickText(activeLesson.subtitle, lang)}
          </p>

          {/* Designed-to-Scale Compact Telemetry Strip + Stage Controls (single-row friendly so stage stays tall!) */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-stretch gap-1.5">
              {activeStep.telemetry.slice(0, 3).map((kpi, idx) => {
                const barBg =
                  kpi.tone === 'ok'
                    ? 'bg-[#4caf50]'
                    : kpi.tone === 'bad'
                      ? 'bg-[#e5534b]'
                      : kpi.tone === 'warn'
                        ? 'bg-[#e8a33a]'
                        : 'bg-transparent';
                const valColor =
                  kpi.tone === 'ok'
                    ? 'text-[#2e6b19] dark:text-[#a8e686]'
                    : kpi.tone === 'bad'
                      ? 'text-[#b82c24] dark:text-[#fca5a5]'
                      : kpi.tone === 'warn'
                        ? 'text-[#8a5708] dark:text-[#fde68a]'
                        : 'text-[var(--dts-ink)]';

                return (
                  <div
                    key={idx}
                    className="relative flex min-w-0 flex-col rounded-[9px] border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  >
                    {kpi.tone && kpi.tone !== 'default' && (
                      <span
                        className={cn(
                          'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r',
                          barBg
                        )}
                      />
                    )}
                    <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)] leading-tight">
                      {pickText(kpi.label, lang)}
                    </div>
                    <div className={cn('font-mono text-[12px] font-extrabold tabular-nums leading-snug', valColor)}>
                      {pickText(kpi.value, lang)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Playback & Live Code Controls (icon-only on mobile/tablet OR when center column is resized narrow!) */}
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {!isNativeCodeTrace && onRunCodeSnippet && (
                <button
                  type="button"
                  onClick={() => setManualSandboxOpen((o) => !o)}
                  title={manualSandboxOpen ? t.visualStage : t.liveCode}
                  aria-label={manualSandboxOpen ? t.visualStage : t.liveCode}
                  className={cn(
                    'dts-btn-tactile inline-flex items-center justify-center gap-1 rounded-xl font-mono text-[11px] font-bold',
                    isCenterCompact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0 lg:h-auto lg:w-auto lg:px-2 lg:py-1',
                    manualSandboxOpen
                      ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                      : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                  )}
                >
                  <Code2 className="h-3.5 w-3.5 shrink-0" />
                  <span className={cn('hidden', !isCenterCompact && 'lg:inline')}>
                    {manualSandboxOpen ? t.visualStage : t.liveCode}
                  </span>
                </button>
              )}

              {(isIsometricStage || isMemoryStage) && !manualSandboxOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(true);
                    setReplayNonce((n) => n + 1);
                  }}
                  title={
                    lang === 'en'
                      ? `${t.replay} & Reset View`
                      : `${t.replay} & Căn giữa lại sơ đồ`
                  }
                  aria-label={t.replay}
                  className={cn(
                    'dts-btn-tactile inline-flex items-center justify-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] font-mono text-[11px] font-bold text-[var(--dts-ink)]',
                    isCenterCompact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0 lg:h-auto lg:w-auto lg:px-2 lg:py-1'
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span className={cn('hidden', !isCenterCompact && 'lg:inline')}>
                    {t.replay}
                  </span>
                </button>
              )}

              {isIsometricStage && !manualSandboxOpen && (
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  title={isPlaying ? t.pause : t.play}
                  aria-label={isPlaying ? t.pause : t.play}
                  className={cn(
                    'dts-btn-tactile inline-flex items-center justify-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] font-mono text-[11px] font-bold text-[var(--dts-ink)]',
                    isCenterCompact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0 lg:h-auto lg:w-auto lg:px-2 lg:py-1'
                  )}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 shrink-0" />
                      <span className={cn('hidden', !isCenterCompact && 'lg:inline')}>
                        {t.pause}
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 shrink-0" />
                      <span className={cn('hidden', !isCenterCompact && 'lg:inline')}>
                        {t.play}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stage Viewport: Isometric 2.5D OR 2D Memory/Slice OR Interactive Code Trace */}
          <div className="relative mt-2.5 flex min-h-[260px] sm:min-h-[300px] xl:min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
            {manualSandboxOpen ? (
              <WorkbenchCodeSurface
                code={sandboxCode}
                onChange={setSandboxCode}
                onRun={handleRunSandbox}
                running={sandboxRunning}
                output={sandboxOut}
                titleBadge={`${sandboxTitle} · ${activeLesson.moduleId} Step ${safeStepIdx + 1}`}
                lang={lang}
                runLabel={runCodeLabel ?? t.runCode}
                className="h-full min-h-[250px] flex-1"
              />
            ) : isIsometricStage && activeStep.scene ? (
              <>
                <div className="dts-stage-noselect min-h-0 flex-1 select-none">
                  <ScaleStageSvg
                    scene={activeStep.scene}
                    lang={lang}
                    theme={theme}
                    isPlaying={isPlaying}
                    replayNonce={replayNonce}
                  />
                </div>
                <div className="mt-1 flex select-none flex-wrap items-center gap-x-4 gap-y-1 px-1 pt-1 font-mono text-[11px] text-[var(--dts-ink-muted)]">
                  {legendKinds.map((kind) => (
                    <span key={kind} className="inline-flex items-center gap-1.5">
                      <LegendDot kind={kind} />
                      <span>{t.packets[kind]}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : isMemoryStage && activeStep.memoryScene ? (
              <div className="dts-stage-noselect min-h-0 flex-1 select-none">
                <MemoryStageSvg
                  scene={activeStep.memoryScene}
                  lang={lang}
                  theme={theme}
                  replayNonce={replayNonce}
                />
              </div>
            ) : activeStep.codeTrace ? (
              <div className="min-h-0 flex-1">
                <CodeTraceStage
                  trace={activeStep.codeTrace}
                  lang={lang}
                  onRunCode={onRunCodeSnippet}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Horizontal Timeline Stepper */}
        <div className="dts-panel shrink-0 rounded-2xl px-4 py-2.5">
          <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] font-extrabold tracking-wider text-[var(--dts-ink-muted)]">
            <span>{t.inThisLesson}</span>
            <span>{t.stepOf(safeStepIdx + 1, activeLesson.steps.length)}</span>
          </div>

          <div className="overflow-x-auto pt-1.5 pb-1.5 px-1 no-scrollbar">
            <div className="relative flex min-w-max items-start justify-between gap-2 px-1">
              {activeLesson.steps.map((st, idx) => {
                const isActive = idx === safeStepIdx;
                const isDone = idx < safeStepIdx;
                return (
                  <div
                    key={st.index}
                    className="relative flex flex-1 min-w-[68px] flex-col items-center"
                  >
                    {idx < activeLesson.steps.length - 1 && (
                      <div
                        className={cn(
                          'absolute top-[13px] left-1/2 h-[1.5px] w-full',
                          idx < safeStepIdx
                            ? 'bg-[var(--dts-ink)]'
                            : 'bg-[var(--dts-line-strong)]'
                        )}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        selectLessonAndStep(activeLesson.moduleId, idx)
                      }
                      className={cn(
                        'relative z-10 grid h-[26px] w-[26px] place-items-center rounded-full font-mono text-[11.5px] font-bold transition-transform',
                        isActive
                          ? 'scale-108 border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
                          : isDone
                            ? 'border border-[var(--dts-ink-soft)] bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]'
                            : 'border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                      )}
                    >
                      {st.index}
                    </button>
                    <span
                      className={cn(
                        'mt-1.5 max-w-[82px] text-center font-mono text-[10.5px] leading-tight',
                        isActive
                          ? 'font-extrabold text-[var(--dts-ink)]'
                          : 'font-medium text-[var(--dts-ink-muted)]'
                      )}
                    >
                      {pickText(st.shortLabel, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Resize Handle between Center Stage and Right Narrative Sidebar (net gap = 10px, equal to Left-Center!) */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t.resizeSidebarHint}
        title={t.resizeSidebarHint}
        onPointerDown={handleStartRightResize}
        onDoubleClick={() => setRightSidebarWidth(DEFAULT_RIGHT_SIDEBAR_WIDTH)}
        className="group relative -mx-2.5 hidden xl:flex w-2.5 shrink-0 cursor-col-resize items-center justify-center select-none z-20 after:content-[''] after:absolute after:-inset-x-1.5 after:inset-y-0"
      >
        <div
          className={cn(
            'h-14 w-1 rounded-full transition-all duration-150',
            isResizingRight
              ? 'h-24 w-1.5 bg-[var(--dts-ink)]'
              : 'bg-[var(--dts-line-strong)] group-hover:h-20 group-hover:w-1.5 group-hover:bg-[var(--dts-ink-soft)]'
          )}
        />
      </div>

      {/* 3. RIGHT COLUMN (Resizable on xl+ via --dts-right-w) */}
      <aside
        style={
          {
            '--dts-right-w': `${rightSidebarWidth}px`,
          } as React.CSSProperties
        }
        className="flex w-full xl:w-[var(--dts-right-w)] shrink-0 flex-col gap-2.5 xl:min-h-0"
      >
        <div className="dts-panel flex flex-1 flex-col rounded-2xl p-4 xl:min-h-0">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-extrabold tracking-wider text-[var(--dts-ink-muted)]">
              STEP {safeStepIdx + 1} / {activeLesson.steps.length}
            </span>
            <span
              className={cn(
                'rounded-full border border-[var(--dts-border)] px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider',
                getCategoryStyle(activeStep.category)
              )}
            >
              {t.categories[activeStep.category]}
            </span>
          </div>

          <div
            ref={narrativeScrollRef}
            className="min-h-0 flex-1 overflow-y-auto pr-1 space-y-3"
          >
            <h2 className="font-mono text-base sm:text-[17px] font-extrabold leading-snug text-[var(--dts-ink)]">
              {pickText(activeStep.title, lang)}
            </h2>

            <BlueprintMarkdown
              source={
                lang === 'en' ? activeStep.summaryEn : activeStep.summaryVi
              }
            />

            {activeStep.callout && (() => {
              const { boxCls, Icon } = getCalloutMeta(activeStep.callout.kind);
              const cTitle = activeStep.callout.title
                ? pickText(activeStep.callout.title, lang)
                : t.calloutTitles[activeStep.callout.kind];
              return (
                <div className={cn('rounded-xl border p-3', boxCls)}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current/30 bg-black/5">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider opacity-85">
                        {cTitle}
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed font-medium">
                        {pickText(activeStep.callout.text, lang)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeStep.whatChanged.length > 0 && (
              <div className="pt-1">
                <div className="mb-1.5 font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                  {t.whatChanged}
                </div>
                <ul className="space-y-1.5">
                  {activeStep.whatChanged.map((diff, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 font-mono text-[12px] leading-snug text-[var(--dts-ink)]"
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded font-extrabold text-[11px]',
                          diff.op === '+'
                            ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                            : diff.op === '-'
                              ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                              : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                        )}
                      >
                        {diff.op}
                      </span>
                      <span>{pickText(diff.text, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation Footer (Desktop lg+; Mobile/Tablet uses the sticky bottom bar snapped above the 5-tab nav!) */}
          <div className="mt-3 hidden lg:block shrink-0 border-t border-[var(--dts-border-soft)] pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={activeLessonIdx === 0 && safeStepIdx === 0}
                className="dts-btn-tactile inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--dts-panel-elevated)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-ink)] disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t.back}</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="dts-btn-tactile flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl bg-[var(--dts-green-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
              >
                <span className="truncate">
                  {!isLastStep
                    ? `${t.next}: ${pickText(nextStepObj.shortLabel, lang)}`
                    : nextLessonObj
                      ? `${t.nextModule}: ${nextLessonObj.moduleId}`
                      : t.finishLesson}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] text-[var(--dts-ink-muted)]">
              <span>
                <kbd className="rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-1">
                  ←
                </kbd>{' '}
                <kbd className="rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-1">
                  →
                </kbd>{' '}
                {t.keyboardHint.step}
              </span>
              {isIsometricStage && (
                <>
                  <span>·</span>
                  <span>
                    <kbd className="rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-1">
                      R
                    </kbd>{' '}
                    {t.keyboardHint.replay}
                  </span>
                  <span>·</span>
                  <span>
                    <kbd className="rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-1">
                      Space
                    </kbd>{' '}
                    {t.keyboardHint.pause}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Card: YOU'LL LEARN + Practice Links */}
        <div className="dts-panel shrink-0 rounded-2xl p-3.5">
          <div className="mb-2 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
            {t.youWillLearn}
          </div>
          <ul className="space-y-1.5">
            {activeLesson.objectives.map((obj, idx) => {
              const threshold = Math.floor(
                ((idx + 1) / activeLesson.objectives.length) *
                  (activeLesson.steps.length - 1)
              );
              const checked =
                activeStatus.lessonRead ||
                activeStatus.completed ||
                safeStepIdx >= Math.max(0, threshold);

              return (
                <li
                  key={idx}
                  className="flex items-start gap-2 font-mono text-[11.5px] leading-snug text-[var(--dts-ink-soft)]"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[var(--dts-border)] transition-colors',
                      checked
                        ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                        : 'bg-[var(--dts-panel-elevated)]'
                    )}
                  >
                    {checked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <span className={cn(checked && 'text-[var(--dts-ink)] font-medium')}>
                    {pickText(obj, lang)}
                  </span>
                </li>
              );
            })}
          </ul>

          {(onOpenQuiz || onOpenExercises || onOpenFlashcards || onOpenReadings) && (
            <div className="mt-3 border-t border-[var(--dts-border-soft)] pt-2.5">
              <div className="mb-1.5 font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                {t.practiceActions.title}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {onOpenQuiz && activeLesson.quizCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenQuiz(activeLesson.moduleId)}
                    className={cn(
                      'dts-btn-tactile inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10.5px] font-bold',
                      activeStatus.quizPassed
                        ? 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]'
                        : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                    )}
                  >
                    <ListChecks className="h-3 w-3" />
                    <span>{t.practiceActions.quiz(activeLesson.quizCount)}</span>
                  </button>
                )}
                {onOpenExercises && activeLesson.exerciseCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenExercises(activeLesson.moduleId)}
                    className={cn(
                      'dts-btn-tactile inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10.5px] font-bold',
                      activeStatus.passedExercises === activeLesson.exerciseCount
                        ? 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]'
                        : 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]'
                    )}
                  >
                    <Code2 className="h-3 w-3" />
                    <span>
                      {courseId === 'pmpmastery'
                        ? lang === 'vi'
                          ? `Tình huống (${activeStatus.passedExercises}/${activeLesson.exerciseCount})`
                          : `Scenarios (${activeStatus.passedExercises}/${activeLesson.exerciseCount})`
                        : t.practiceActions.exercises(
                            activeStatus.passedExercises,
                            activeLesson.exerciseCount
                          )}
                    </span>
                  </button>
                )}
                {onOpenFlashcards && activeLesson.cardCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenFlashcards(activeLesson.moduleId)}
                    className="dts-btn-tactile inline-flex items-center gap-1 rounded-lg bg-[var(--dts-panel-elevated)] px-2 py-1 font-mono text-[10.5px] font-bold text-[var(--dts-ink)]"
                  >
                    <Layers className="h-3 w-3" />
                    <span>{t.practiceActions.flashcards(activeLesson.cardCount)}</span>
                  </button>
                )}
                {onOpenReadings && activeLesson.readingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenReadings(activeLesson.moduleId)}
                    className="dts-btn-tactile inline-flex items-center gap-1 rounded-lg bg-[var(--dts-panel-elevated)] px-2 py-1 font-mono text-[10.5px] font-bold text-[var(--dts-ink)]"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>
                      {courseId === 'pmpmastery'
                        ? lang === 'vi'
                          ? `Dẫn chứng (${activeLesson.readingCount})`
                          : `Evidence (${activeLesson.readingCount})`
                        : courseId !== 'pymastery'
                          ? lang === 'vi'
                            ? `Cấu hình thật (${activeLesson.readingCount})`
                            : `Real Configs (${activeLesson.readingCount})`
                          : t.practiceActions.readings(activeLesson.readingCount)}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
      </div>

      {/* Sticky Mobile / Tablet Step Navigation Bar — snapped directly above the 5-item Bottom Nav! */}
      <div className="shrink-0 z-30 border-t border-[var(--dts-line-strong)] bg-[var(--dts-panel)]/98 px-2.5 py-2 backdrop-blur-xs lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={activeLessonIdx === 0 && safeStepIdx === 0}
            className="dts-btn-tactile inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--dts-panel-elevated)] px-3 py-2 font-mono text-xs font-extrabold text-[var(--dts-ink)] disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.back}</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="dts-btn-tactile flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl bg-[var(--dts-green-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
          >
            <span className="truncate">
              {!isLastStep
                ? `${t.next}: ${pickText(nextStepObj.shortLabel, lang)}`
                : nextLessonObj
                  ? `${t.nextModule}: ${nextLessonObj.moduleId}`
                  : t.finishLesson}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <span className="rounded bg-black/8 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
                {safeStepIdx + 1}/{activeLesson.steps.length}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
