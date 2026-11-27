import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  FilePlus2,
  FlaskConical,
  HelpCircle,
  History,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Save,
  SkipForward,
  StickyNote,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSdNav } from '@/features/sysdesign-course/store';
import { cn } from '@/utils/cn';
import { useSdStore } from '../store/useSdStore';
import {
  ARCH_COMPONENT_PALETTE,
  INTERVIEW_PROMPTS,
  SNAKE_STAGES,
  SNAKE_STAGE_ORDER,
  TOTAL_INTERVIEW_BUDGET_SEC,
  computeCalibrationBand,
  computeNapkinMetrics,
  type BilingualText,
  type CalibrationBand,
  type InterviewLevel,
  type InterviewPrompt,
  type NapkinPreset,
  type SnakeStageId,
} from '../data/interviewPrompts';

export interface SdInterviewViewProps {
  onOpenModule?: (moduleId: string) => void;
  onOpenLab?: () => void;
}

type TimerStatus = 'idle' | 'running' | 'paused';
type InterviewMode = 'simulate' | 'rubric';

interface PromptSessionDraft {
  activeStage: SnakeStageId;
  mode: InterviewMode;
  timerStatus: TimerStatus;
  lastTickMs: number | null;
  totalElapsedSec: number;
  stageElapsedSec: Record<SnakeStageId, number>;
  notes: Record<SnakeStageId, string>;
  checkedChecklistIds: string[];
  revealedAssumptionIds: string[];
  napkinInputs: NapkinPreset;
  selectedComponents: string[];
  checkedRubricIds: string[];
  updatedAt: number;
}

interface WorkspaceStoragePayload {
  version: 1;
  selectedPromptId: string;
  sessions: Record<string, PromptSessionDraft>;
}

export interface InterviewAttemptRecord {
  id: string;
  promptId: string;
  promptTitleVi: string;
  promptTitleEn: string;
  relatedModuleId: string;
  level: InterviewLevel;
  score: number;
  calibration: CalibrationBand;
  totalElapsedSec: number;
  stageElapsedSec: Record<SnakeStageId, number>;
  selectedComponents: string[];
  checkedRubricCount: number;
  totalRubricCount: number;
  completedAt: number;
}

const WORKSPACE_STORAGE_KEY = 'sdmastery_interview_workspace_v1';
const HISTORY_STORAGE_KEY = 'sdmastery_interview_history_v1';

function createEmptyStageNumbers(): Record<SnakeStageId, number> {
  return { S: 0, N: 0, A: 0, K: 0, E: 0 };
}

function createEmptyStageNotes(): Record<SnakeStageId, string> {
  return { S: '', N: '', A: '', K: '', E: '' };
}

function createInitialSession(prompt: InterviewPrompt): PromptSessionDraft {
  return {
    activeStage: 'S',
    mode: 'simulate',
    timerStatus: 'idle',
    lastTickMs: null,
    totalElapsedSec: 0,
    stageElapsedSec: createEmptyStageNumbers(),
    notes: createEmptyStageNotes(),
    checkedChecklistIds: [],
    revealedAssumptionIds: [],
    napkinInputs: { ...prompt.napkinPreset },
    selectedComponents: [],
    checkedRubricIds: [],
    updatedAt: Date.now(),
  };
}

function hydrateSessionWithElapsedCatchup(raw: PromptSessionDraft): PromptSessionDraft {
  if (raw.timerStatus !== 'running' || !raw.lastTickMs) {
    return raw;
  }
  const now = Date.now();
  // Cap catch-up to 2 hours so an abandoned tab from days ago doesn't jump to 999:99
  const deltaSec = Math.min(7200, Math.max(0, Math.floor((now - raw.lastTickMs) / 1000)));
  if (deltaSec <= 0) return raw;
  const active = raw.activeStage;
  return {
    ...raw,
    lastTickMs: now,
    totalElapsedSec: raw.totalElapsedSec + deltaSec,
    stageElapsedSec: {
      ...raw.stageElapsedSec,
      [active]: (raw.stageElapsedSec[active] ?? 0) + deltaSec,
    },
  };
}

function loadWorkspaceStorage(): WorkspaceStoragePayload {
  const defaultPrompt = INTERVIEW_PROMPTS[0];
  const fallback: WorkspaceStoragePayload = {
    version: 1,
    selectedPromptId: defaultPrompt.id,
    sessions: {
      [defaultPrompt.id]: createInitialSession(defaultPrompt),
    },
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WorkspaceStoragePayload>;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const validPrompt =
      INTERVIEW_PROMPTS.find((p) => p.id === parsed.selectedPromptId) ?? defaultPrompt;
    const hydratedSessions: Record<string, PromptSessionDraft> = {};
    if (parsed.sessions && typeof parsed.sessions === 'object') {
      for (const p of INTERVIEW_PROMPTS) {
        const saved = parsed.sessions[p.id];
        if (saved && typeof saved === 'object') {
          hydratedSessions[p.id] = hydrateSessionWithElapsedCatchup({
            ...createInitialSession(p),
            ...saved,
            stageElapsedSec: {
              ...createEmptyStageNumbers(),
              ...(saved.stageElapsedSec ?? {}),
            },
            notes: {
              ...createEmptyStageNotes(),
              ...(saved.notes ?? {}),
            },
            napkinInputs: {
              ...p.napkinPreset,
              ...(saved.napkinInputs ?? {}),
            },
          });
        }
      }
    }
    if (!hydratedSessions[validPrompt.id]) {
      hydratedSessions[validPrompt.id] = createInitialSession(validPrompt);
    }
    return {
      version: 1,
      selectedPromptId: validPrompt.id,
      sessions: hydratedSessions,
    };
  } catch {
    return fallback;
  }
}

function saveWorkspaceStorage(payload: WorkspaceStoragePayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

function loadHistoryStorage(): InterviewAttemptRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InterviewAttemptRecord[]) : [];
  } catch {
    return [];
  }
}

function saveHistoryStorage(records: InterviewAttemptRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

function formatMmSs(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatMetricNumber(val: number, decimals = 1): string {
  if (!Number.isFinite(val) || val === 0) return '0';
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 10_000) return Math.round(val).toLocaleString('en-US');
  if (val >= 100) return val.toFixed(0);
  if (val >= 10) return val.toFixed(1);
  if (val >= 1) return val.toFixed(decimals);
  return val.toFixed(2);
}

const LEVEL_STYLES: Record<InterviewLevel, string> = {
  Beginner: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border)]',
  Mid: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] border-[var(--dts-border)]',
  Senior: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] border-[var(--dts-border)]',
  Staff: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)] border-[var(--dts-border)]',
};

const CALIBRATION_STYLES: Record<CalibrationBand, string> = {
  'Lean No-Hire': 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] border-[var(--dts-border)]',
  Hire: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] border-[var(--dts-border)]',
  'Strong Hire': 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border)]',
};

const API_SCHEMA_SNIPPETS: ReadonlyArray<{
  id: string;
  label: BilingualText;
  snippet: string;
}> = [
  {
    id: 'rest-cursor',
    label: { vi: '+ GET phân trang Cursor', en: '+ GET Cursor Pagination' },
    snippet:
      '\n### Read Endpoint\n`GET /v1/resources?cursor=<snowflake_id>&limit=20`\n- Response `200 OK`: `{ items: [...], next_cursor: "..." }`\n',
  },
  {
    id: 'post-idempotent',
    label: { vi: '+ POST kèm Idempotency-Key', en: '+ Idempotent POST' },
    snippet:
      '\n### Write Endpoint\n`POST /v1/resources`\n- Header: `Idempotency-Key: <uuid>`\n- Body: `{ ... }`\n- Status: `201 Created` | `202 Accepted` | `409 Conflict` | `429 Too Many Requests`\n',
  },
  {
    id: 'sql-table',
    label: { vi: '+ Bảng SQL + Index', en: '+ SQL Table + Index' },
    snippet:
      '\n### Relational Schema (PostgreSQL)\n- Table `...`: `id BIGINT PRIMARY KEY, user_id BIGINT NOT NULL, status SMALLINT, created_at TIMESTAMPTZ`\n- Index: `CREATE INDEX idx_user_created ON ...(user_id, created_at DESC);`\n- Shard Key: `...`\n',
  },
  {
    id: 'kv-partition',
    label: { vi: '+ Wide-Column / KV Partition', en: '+ Wide-Column / KV Schema' },
    snippet:
      '\n### Partitioned KV / Wide-Column Schema\n- Partition Key: `...` (phân phối đều lưu lượng)\n- Clustering Key: `... DESC` (quét dải liền kề trên đĩa)\n- TTL: `...`\n',
  },
];

const ELABORATE_LENSES: ReadonlyArray<{
  id: string;
  label: BilingualText;
  snippet: BilingualText;
}> = [
  {
    id: 'spof',
    label: { vi: '+ Loại bỏ SPOF & Failover', en: '+ SPOF & Failover' },
    snippet: {
      vi: '\n### Khả năng chịu lỗi & Loại bỏ SPOF\n- Cân bằng tải & Stateless App: ...\n- Database / Cache khi mất 1 node Primary: ...\n',
      en: '\n### Fault Tolerance & SPOF Elimination\n- Load Balancer & Stateless tier: ...\n- Primary DB / Cache node failover: ...\n',
    },
  },
  {
    id: 'hotkey',
    label: { vi: '+ Hot Key / Đỉnh tải ×10', en: '+ Hot Key / 10× Spike' },
    snippet: {
      vi: '\n### Xử lý Hot Key & Đỉnh tải đột biến\n- Nguyên nhân gây lệch tải (celebrity / sự kiện nóng): ...\n- Giải pháp (L1 local cache, sub-bucketing, singleflight, queue buffering): ...\n',
      en: '\n### Hot Keys & 10× Traffic Spikes\n- Source of skew (celebrity / flash event): ...\n- Mitigation (L1 local cache, sub-bucketing, singleflight, queue buffering): ...\n',
    },
  },
  {
    id: 'retry',
    label: { vi: '+ Timeout, Retry & Chống trùng', en: '+ Timeouts, Retries & Dedup' },
    snippet: {
      vi: '\n### Timeout, Retry Backoff + Jitter & Idempotency\n- Ngân sách timeout giữa các dịch vụ: ...\n- Chống bão retry (Exponential Backoff + Jitter + Circuit Breaker): ...\n',
      en: '\n### Timeouts, Jittered Retries & Idempotency\n- Per-hop timeout budget: ...\n- Avoiding retry storms (Exponential Backoff + Jitter + Circuit Breaker): ...\n',
    },
  },
  {
    id: 'observability',
    label: { vi: '+ Chỉ số SLO & Cảnh báo', en: '+ SLOs & Observability' },
    snippet: {
      vi: '\n### Giám sát vận hành & Cảnh báo SLO\n- Golden Signals (RPS, Error rate, p50/p99 latency, Queue lag, Cache hit ratio): ...\n',
      en: '\n### Production Observability & SLO Alerts\n- Key telemetry (RPS, Error rate, p50/p99 latency, Queue lag, Cache hit ratio): ...\n',
    },
  },
];

export const SdInterviewView: React.FC<SdInterviewViewProps> = ({
  onOpenModule,
  onOpenLab,
}) => {
  const lang = useWorkbenchStore((s) => s.language);
  const isVi = lang === 'vi';
  const pick = useCallback((text: BilingualText) => text[lang], [lang]);

  const [workspace, setWorkspace] = useState<WorkspaceStoragePayload>(() =>
    loadWorkspaceStorage()
  );
  const [history, setHistory] = useState<InterviewAttemptRecord[]>(() => loadHistoryStorage());
  const [levelFilter, setLevelFilter] = useState<InterviewLevel | 'All'>('All');
  const [isPromptDrawerOpen, setIsPromptDrawerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [confirmClearDraft, setConfirmClearDraft] = useState(false);
  const [historySavedToast, setHistorySavedToast] = useState(false);
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const currentPrompt = useMemo(
    () =>
      INTERVIEW_PROMPTS.find((p) => p.id === workspace.selectedPromptId) ??
      INTERVIEW_PROMPTS[0],
    [workspace.selectedPromptId]
  );

  const session: PromptSessionDraft = useMemo(
    () => workspace.sessions[currentPrompt.id] ?? createInitialSession(currentPrompt),
    [workspace.sessions, currentPrompt]
  );

  // Auto-persist workspace on every state update
  useEffect(() => {
    saveWorkspaceStorage(workspace);
  }, [workspace]);

  const updateCurrentSession = useCallback(
    (updater: (prev: PromptSessionDraft) => PromptSessionDraft) => {
      setWorkspace((prev) => {
        const promptObj =
          INTERVIEW_PROMPTS.find((p) => p.id === prev.selectedPromptId) ?? INTERVIEW_PROMPTS[0];
        const base = prev.sessions[promptObj.id] ?? createInitialSession(promptObj);
        const next = updater(base);
        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [promptObj.id]: {
              ...next,
              updatedAt: Date.now(),
            },
          },
        };
      });
    },
    []
  );

  // 1-second wall-clock delta timer
  useEffect(() => {
    if (session.timerStatus !== 'running') return;
    const interval = window.setInterval(() => {
      setWorkspace((prev) => {
        const promptObj =
          INTERVIEW_PROMPTS.find((p) => p.id === prev.selectedPromptId) ?? INTERVIEW_PROMPTS[0];
        const cur = prev.sessions[promptObj.id];
        if (!cur || cur.timerStatus !== 'running') return prev;
        const now = Date.now();
        const prevTick = cur.lastTickMs ?? now - 1000;
        const deltaSec = Math.max(0, Math.floor((now - prevTick) / 1000));
        if (deltaSec < 1) return prev;
        const active = cur.activeStage;
        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [promptObj.id]: {
              ...cur,
              lastTickMs: prevTick + deltaSec * 1000,
              totalElapsedSec: cur.totalElapsedSec + deltaSec,
              stageElapsedSec: {
                ...cur.stageElapsedSec,
                [active]: (cur.stageElapsedSec[active] ?? 0) + deltaSec,
              },
              updatedAt: now,
            },
          },
        };
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, [session.timerStatus, currentPrompt.id]);

  // Select prompt (pauses running timer on previous prompt cleanly)
  const handleSelectPrompt = useCallback((promptId: string) => {
    setWorkspace((prev) => {
      const prevPromptObj =
        INTERVIEW_PROMPTS.find((p) => p.id === prev.selectedPromptId) ?? INTERVIEW_PROMPTS[0];
      const nextPromptObj =
        INTERVIEW_PROMPTS.find((p) => p.id === promptId) ?? INTERVIEW_PROMPTS[0];
      const prevSession = prev.sessions[prevPromptObj.id];
      const updatedSessions = { ...prev.sessions };
      if (prevSession && prevSession.timerStatus === 'running') {
        updatedSessions[prevPromptObj.id] = {
          ...prevSession,
          timerStatus: 'paused',
          lastTickMs: null,
        };
      }
      if (!updatedSessions[nextPromptObj.id]) {
        updatedSessions[nextPromptObj.id] = createInitialSession(nextPromptObj);
      }
      return {
        ...prev,
        selectedPromptId: nextPromptObj.id,
        sessions: updatedSessions,
      };
    });
    setIsPromptDrawerOpen(false);
    setConfirmClearDraft(false);
  }, []);

  // Timer actions
  const handleStartOrResume = useCallback(() => {
    updateCurrentSession((s) => ({
      ...s,
      mode: 'simulate',
      timerStatus: 'running',
      lastTickMs: Date.now(),
    }));
  }, [updateCurrentSession]);

  const handlePause = useCallback(() => {
    updateCurrentSession((s) => ({
      ...s,
      timerStatus: 'paused',
      lastTickMs: null,
    }));
  }, [updateCurrentSession]);

  const handleResetTimer = useCallback(() => {
    updateCurrentSession((s) => ({
      ...s,
      timerStatus: 'idle',
      lastTickMs: null,
      totalElapsedSec: 0,
      stageElapsedSec: createEmptyStageNumbers(),
    }));
  }, [updateCurrentSession]);

  const handleNextStage = useCallback(() => {
    updateCurrentSession((s) => {
      const idx = SNAKE_STAGE_ORDER.indexOf(s.activeStage);
      if (idx < SNAKE_STAGE_ORDER.length - 1) {
        return {
          ...s,
          mode: 'simulate',
          activeStage: SNAKE_STAGE_ORDER[idx + 1],
        };
      }
      // On final stage E -> transition to Self-Grading Rubric & pause timer
      return {
        ...s,
        mode: 'rubric',
        timerStatus: s.timerStatus === 'running' ? 'paused' : s.timerStatus,
        lastTickMs: null,
      };
    });
  }, [updateCurrentSession]);

  const handleOpenRubric = useCallback(() => {
    updateCurrentSession((s) => ({
      ...s,
      mode: 'rubric',
      timerStatus: s.timerStatus === 'running' ? 'paused' : s.timerStatus,
      lastTickMs: null,
    }));
  }, [updateCurrentSession]);

  const handleBackToSimulate = useCallback(() => {
    updateCurrentSession((s) => ({
      ...s,
      mode: 'simulate',
    }));
  }, [updateCurrentSession]);

  const handleClearDraft = useCallback(() => {
    if (!confirmClearDraft) {
      setConfirmClearDraft(true);
      return;
    }
    setConfirmClearDraft(false);
    updateCurrentSession(() => createInitialSession(currentPrompt));
  }, [confirmClearDraft, currentPrompt, updateCurrentSession]);

  // Navigation callbacks with safe fallbacks
  const handleOpenRelatedModule = useCallback(
    (moduleId: string) => {
      if (onOpenModule) {
        onOpenModule(moduleId);
        return;
      }
      useWorkbenchStore.getState().setCourseCursor('sdmastery', moduleId, 0);
      useSdStore.getState().setActiveTab('learn');
      useSdNav.getState().go({ name: 'workbench' });
    },
    [onOpenModule]
  );

  const handleOpenCanvasLab = useCallback(() => {
    if (onOpenLab) {
      onOpenLab();
      return;
    }
    useSdStore.getState().setActiveTab('lab');
  }, [onOpenLab]);

  // Computed timer stats
  const activeStageSpec = SNAKE_STAGES[session.activeStage];
  const currentStageSec = session.stageElapsedSec[session.activeStage] ?? 0;
  const isStageOverBudget = currentStageSec > activeStageSpec.budgetSec;
  const stageProgressPct = Math.min(
    100,
    Math.round((currentStageSec / activeStageSpec.budgetSec) * 100)
  );
  const totalRemainingSec = Math.max(0, TOTAL_INTERVIEW_BUDGET_SEC - session.totalElapsedSec);
  const totalOvertimeSec = Math.max(0, session.totalElapsedSec - TOTAL_INTERVIEW_BUDGET_SEC);

  // Napkin Math auto-computation
  const napkinMetrics = useMemo(
    () => computeNapkinMetrics(session.napkinInputs),
    [session.napkinInputs]
  );

  const handleInsertNapkinTable = useCallback(() => {
    const inp = session.napkinInputs;
    const m = napkinMetrics;
    const retentionColLabel =
      inp.retentionYears === 5
        ? isVi
          ? 'Lưu trữ 5 năm (TB)'
          : '5-Year Storage (TB)'
        : isVi
          ? `Lưu trữ ${inp.retentionYears} năm / 5 năm (TB)`
          : `${inp.retentionYears}-Yr / 5-Yr Storage (TB)`;
    const retentionVal =
      inp.retentionYears === 5
        ? `${formatMetricNumber(m.fiveYearStorageTb, 2)} TB`
        : `${formatMetricNumber(m.retentionStorageTb, 2)} TB (5Y: ${formatMetricNumber(m.fiveYearStorageTb, 2)} TB)`;

    const tableMd = isVi
      ? [
          '',
          '### Bảng ước lượng Napkin Math',
          `- Đầu vào: DAU = \`${inp.dau.toLocaleString('en-US')}\`, Đọc/user/ngày = \`${inp.readsPerUserPerDay}\`, Ghi/user/ngày = \`${inp.writesPerUserPerDay}\`, Payload = \`${inp.payloadKb} KB\`, Lưu giữ = \`${inp.retentionYears} năm\``,
          '',
          '| Chỉ số | Giá trị ước lượng |',
          '|---|---|',
          `| Avg Read RPS | ${formatMetricNumber(m.avgReadRps)} RPS |`,
          `| Peak Read RPS (×3) | ${formatMetricNumber(m.peakReadRps)} RPS |`,
          `| Avg / Peak Write RPS | ${formatMetricNumber(m.avgWriteRps)} / ${formatMetricNumber(m.peakWriteRps)} RPS |`,
          `| Lưu trữ mỗi ngày (GB) | ${formatMetricNumber(m.dailyStorageGb, 2)} GB/ngày |`,
          `| ${retentionColLabel} | ${retentionVal} |`,
          `| Băng thông TB / Đỉnh | ${formatMetricNumber(m.avgBandwidthMBps, 2)} / ${formatMetricNumber(m.peakBandwidthMBps, 2)} MB/s |`,
          `| 20% Hot Cache RAM | ${formatMetricNumber(m.hotCacheRamGb, 2)} GB |`,
          '',
        ].join('\n')
      : [
          '',
          '### Napkin Math Summary Table',
          `- Inputs: DAU = \`${inp.dau.toLocaleString('en-US')}\`, Reads/user/day = \`${inp.readsPerUserPerDay}\`, Writes/user/day = \`${inp.writesPerUserPerDay}\`, Payload = \`${inp.payloadKb} KB\`, Retention = \`${inp.retentionYears} yrs\``,
          '',
          '| Metric | Estimate |',
          '|---|---|',
          `| Avg Read RPS | ${formatMetricNumber(m.avgReadRps)} RPS |`,
          `| Peak Read RPS (×3) | ${formatMetricNumber(m.peakReadRps)} RPS |`,
          `| Avg / Peak Write RPS | ${formatMetricNumber(m.avgWriteRps)} / ${formatMetricNumber(m.peakWriteRps)} RPS |`,
          `| Daily Storage (GB) | ${formatMetricNumber(m.dailyStorageGb, 2)} GB/day |`,
          `| ${retentionColLabel} | ${retentionVal} |`,
          `| Bandwidth Avg / Peak | ${formatMetricNumber(m.avgBandwidthMBps, 2)} / ${formatMetricNumber(m.peakBandwidthMBps, 2)} MB/s |`,
          `| 20% Hot Cache RAM | ${formatMetricNumber(m.hotCacheRamGb, 2)} GB |`,
          '',
        ].join('\n');

    updateCurrentSession((s) => ({
      ...s,
      activeStage: 'N',
      notes: {
        ...s.notes,
        N: `${s.notes.N.trimEnd()}${s.notes.N.trim() ? '\n' : ''}${tableMd}`,
      },
    }));
  }, [isVi, napkinMetrics, session.napkinInputs, updateCurrentSession]);

  // Rubric score computation
  const rubricSummary = useMemo(() => {
    const checkedSet = new Set(session.checkedRubricIds);
    const byStage: Record<SnakeStageId, { earned: number; max: number }> = {
      S: { earned: 0, max: 0 },
      N: { earned: 0, max: 0 },
      A: { earned: 0, max: 0 },
      K: { earned: 0, max: 0 },
      E: { earned: 0, max: 0 },
    };
    let totalScore = 0;
    for (const item of currentPrompt.rubric) {
      byStage[item.stage].max += item.points;
      if (checkedSet.has(item.id)) {
        byStage[item.stage].earned += item.points;
        totalScore += item.points;
      }
    }
    return {
      totalScore,
      calibration: computeCalibrationBand(totalScore),
      byStage,
      checkedCount: checkedSet.size,
      totalCount: currentPrompt.rubric.length,
    };
  }, [currentPrompt.rubric, session.checkedRubricIds]);

  const bestScoreByPrompt = useMemo(() => {
    const map: Record<string, number> = {};
    for (const rec of history) {
      if (map[rec.promptId] === undefined || rec.score > map[rec.promptId]) {
        map[rec.promptId] = rec.score;
      }
    }
    return map;
  }, [history]);

  const filteredPrompts = useMemo(
    () =>
      levelFilter === 'All'
        ? INTERVIEW_PROMPTS
        : INTERVIEW_PROMPTS.filter((p) => p.level === levelFilter),
    [levelFilter]
  );

  // Save attempt to localStorage history
  const handleSaveAttemptHistory = useCallback(() => {
    const record: InterviewAttemptRecord = {
      id: `iv-attempt-${Date.now()}`,
      promptId: currentPrompt.id,
      promptTitleVi: currentPrompt.title.vi,
      promptTitleEn: currentPrompt.title.en,
      relatedModuleId: currentPrompt.relatedModuleId,
      level: currentPrompt.level,
      score: rubricSummary.totalScore,
      calibration: rubricSummary.calibration,
      totalElapsedSec: session.totalElapsedSec,
      stageElapsedSec: { ...session.stageElapsedSec },
      selectedComponents: [...session.selectedComponents],
      checkedRubricCount: rubricSummary.checkedCount,
      totalRubricCount: rubricSummary.totalCount,
      completedAt: Date.now(),
    };
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 50);
      saveHistoryStorage(next);
      return next;
    });
    setHistorySavedToast(true);
    window.setTimeout(() => setHistorySavedToast(false), 2600);
  }, [currentPrompt, rubricSummary, session]);

  const handleDeleteHistoryRecord = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveHistoryStorage(next);
      return next;
    });
  }, []);

  // Save formatted interview transcript to IndexedDB Notes & open NotesDrawer
  const handleSaveTranscriptToNotes = useCallback(async () => {
    const chipLabels = session.selectedComponents
      .map((id) => ARCH_COMPONENT_PALETTE.find((c) => c.id === id)?.label ?? id)
      .join(', ');
    const missedCriteria = currentPrompt.rubric
      .filter((r) => !session.checkedRubricIds.includes(r.id))
      .map((r) => `- [${r.stage} · ${r.points}đ] ${pick(r.criterion)}`)
      .join('\n');

    const lines = [
      `# Biên bản Phỏng vấn SNAKE: ${pick(currentPrompt.title)}`,
      `- Cấp độ: ${currentPrompt.level} · Bài học liên quan: ${currentPrompt.relatedModuleId}`,
      `- Điểm tự chấm Rubric: ${rubricSummary.totalScore}/100 (${rubricSummary.calibration})`,
      `- Thời gian thực hiện: ${formatMmSs(session.totalElapsedSec)} / 45:00`,
      `- Thành phần kiến trúc đã chọn: ${chipLabels || '(Chưa gắn thẻ)'}`,
      '',
      ...SNAKE_STAGE_ORDER.map((st) => {
        const spec = SNAKE_STAGES[st];
        const body = session.notes[st]?.trim() || '(Chưa ghi chú)';
        return `## ${pick(spec.fullTitle)} [${formatMmSs(session.stageElapsedSec[st])}/${spec.budgetDisplay}]\n${body}\n`;
      }),
      missedCriteria
        ? `## Các tiêu chí Rubric cần bổ sung lần sau\n${missedCriteria}`
        : '## Đã bao phủ toàn bộ 100/100 điểm Rubric!',
    ];

    const targetId = `sd-interview:${currentPrompt.id}`;
    const targetTitle = `${isVi ? 'Phỏng vấn' : 'Interview'}: ${pick(currentPrompt.title)} (${currentPrompt.relatedModuleId})`;

    await useUserDataStore.getState().addOrUpdateNote({
      targetType: 'exercise',
      targetId,
      targetTitle,
      content: lines.join('\n'),
    });
    setNoteSavedToast(true);
    window.setTimeout(() => setNoteSavedToast(false), 2600);
    useNavigationStore.getState().openNotesDrawer('exercise', targetId, targetTitle);
  }, [currentPrompt, isVi, pick, rubricSummary, session]);

  const activeStageIndex = SNAKE_STAGE_ORDER.indexOf(session.activeStage);

  return (
    <div className="@container h-full min-h-0 w-full overflow-y-auto bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <div className="mx-auto max-w-6xl space-y-3.5 p-3 sm:p-5">
        {/* ===============================================================
            1. TOP BAR: PROMPT SELECTOR + HISTORY TOGGLE + RELATED LINKS
           =============================================================== */}
        <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[var(--dts-amber-ink)]">
                  SNAKE · 45:00
                </span>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 font-mono text-[11px] font-extrabold',
                    LEVEL_STYLES[currentPrompt.level]
                  )}
                >
                  {currentPrompt.level}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenRelatedModule(currentPrompt.relatedModuleId)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--dts-blue-ink)] hover:bg-[var(--dts-blue-soft)]"
                  title={isVi ? 'Mở bài học nền tảng' : 'Open related lesson'}
                >
                  <BookOpen className="h-3 w-3 shrink-0" />
                  <span>{currentPrompt.relatedModuleId}</span>
                </button>
                <span className="font-mono text-xs text-[var(--dts-ink-muted)]">
                  {pick(currentPrompt.scaleTag)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-base font-extrabold tracking-tight text-[var(--dts-ink)] sm:text-lg">
                  #{currentPrompt.order}. {pick(currentPrompt.title)}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPromptDrawerOpen((v) => !v)}
                className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-panel)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-ink)]"
              >
                <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--dts-blue-ink)]" />
                <span>{isVi ? 'Đổi đề (10 đề)' : 'Switch Prompt (10)'}</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform',
                    isPromptDrawerOpen && 'rotate-180'
                  )}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsHistoryOpen((v) => !v)}
                className={cn(
                  'dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-extrabold',
                  isHistoryOpen
                    ? 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]'
                    : 'bg-[var(--dts-panel)] text-[var(--dts-ink)]'
                )}
              >
                <History className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isVi ? `Lịch sử (${history.length})` : `History (${history.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible 10-Prompt Picker */}
          {isPromptDrawerOpen && (
            <div className="mt-3.5 border-t border-[var(--dts-line-strong)] pt-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--dts-ink-soft)]">
                  {isVi
                    ? 'Chọn đề phỏng vấn (bản nháp từng đề được lưu độc lập):'
                    : 'Choose an interview prompt (drafts auto-save independently per prompt):'}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {(['All', 'Beginner', 'Mid', 'Senior', 'Staff'] as const).map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setLevelFilter(lv)}
                      className={cn(
                        'cursor-pointer rounded-lg border px-2 py-0.5 font-mono text-[11px] font-bold transition-colors',
                        levelFilter === lv
                          ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] font-extrabold'
                          : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                      )}
                    >
                      {lv === 'All' ? (isVi ? 'Tất cả (10)' : 'All (10)') : lv}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 @[720px]:grid-cols-2">
                {filteredPrompts.map((p) => {
                  const isSelected = p.id === currentPrompt.id;
                  const best = bestScoreByPrompt[p.id];
                  const draft = workspace.sessions[p.id];
                  const hasNotes =
                    draft && SNAKE_STAGE_ORDER.some((k) => Boolean(draft.notes[k]?.trim()));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPrompt(p.id)}
                      className={cn(
                        'flex cursor-pointer flex-col justify-between gap-1.5 rounded-xl border p-2.5 text-left transition-colors',
                        isSelected
                          ? 'border-[var(--dts-border)] bg-[var(--dts-amber-soft)] shadow-[1.5px_2px_0_var(--dts-shadow-color)]'
                          : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] hover:bg-[var(--dts-panel-muted)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-[var(--dts-ink-muted)]">
                            #{p.order}
                          </span>
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-extrabold',
                              LEVEL_STYLES[p.level]
                            )}
                          >
                            {p.level}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[var(--dts-blue-ink)]">
                            {p.relatedModuleId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasNotes && (
                            <span className="rounded bg-[var(--dts-blue-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-blue-ink)]">
                              {isVi ? 'Đang nháp' : 'Draft'}
                            </span>
                          )}
                          {best !== undefined && (
                            <span className="rounded bg-[var(--dts-green-bg)] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[var(--dts-green-ink)]">
                              {best}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-xs sm:text-sm text-[var(--dts-ink)]">
                        {pick(p.title)}
                      </div>
                      <div className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                        {pick(p.scaleTag)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Past Attempts History */}
          {isHistoryOpen && (
            <div className="mt-3.5 border-t border-[var(--dts-line-strong)] pt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink-soft)]">
                  {isVi
                    ? 'Lịch sử các lần tự chấm Rubric (lưu trên trình duyệt)'
                    : 'Saved Self-Graded Interview Attempts'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(false)}
                  className="cursor-pointer font-mono text-xs font-bold text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
                >
                  {isVi ? 'Đóng' : 'Close'}
                </button>
              </div>
              {history.length === 0 ? (
                <p className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3 text-xs text-[var(--dts-ink-muted)]">
                  {isVi
                    ? 'Chưa có lần chấm nào được lưu. Bấm "Hoàn thành & Tự chấm Rubric" sau khi làm bài để lưu kết quả theo dõi tiến bộ.'
                    : 'No attempts saved yet. Click "Finish & Self-Grade Rubric" after practicing to record your score.'}
                </p>
              ) : (
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {history.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectPrompt(rec.promptId);
                              setIsHistoryOpen(false);
                            }}
                            className="cursor-pointer font-semibold text-[var(--dts-ink)] hover:underline text-left"
                          >
                            {isVi ? rec.promptTitleVi : rec.promptTitleEn}
                          </button>
                          <span className="font-mono text-[11px] text-[var(--dts-blue-ink)]">
                            ({rec.relatedModuleId})
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                          {new Date(rec.completedAt).toLocaleString(isVi ? 'vi-VN' : 'en-US')} ·{' '}
                          {isVi ? 'Thời lượng' : 'Duration'}: {formatMmSs(rec.totalElapsedSec)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                          {rec.score}/100
                        </span>
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-extrabold',
                            CALIBRATION_STYLES[rec.calibration]
                          )}
                        >
                          {rec.calibration}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryRecord(rec.id)}
                          className="cursor-pointer rounded p-1 text-[var(--dts-ink-muted)] hover:bg-[var(--dts-rose-soft)] hover:text-[var(--dts-rose-ink)]"
                          title={isVi ? 'Xoá bản ghi này' : 'Delete attempt'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===============================================================
            2. 45-MINUTE TIMER ENGINE & 5-STAGE SNAKE STEPPER
           =============================================================== */}
        <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Total Countdown + Current Stage Budget Bar */}
            <div className="flex flex-wrap items-center gap-3.5 min-w-0 flex-1">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-1.5',
                  totalOvertimeSec > 0
                    ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink)]'
                )}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {isVi ? 'Còn lại tổng (45:00)' : 'Total Remaining (45:00)'}
                  </div>
                  <div className="flex items-baseline gap-1.5 font-mono text-lg font-extrabold tabular-nums sm:text-xl">
                    <span>{formatMmSs(totalRemainingSec)}</span>
                    {totalOvertimeSec > 0 && (
                      <span className="text-xs font-extrabold text-[var(--dts-amber-ink)]">
                        (+{formatMmSs(totalOvertimeSec)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Stage Progress Bar */}
              <div className="min-w-[210px] flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-xs">
                  <span className="font-extrabold text-[var(--dts-ink)]">
                    {pick(activeStageSpec.fullTitle)}
                  </span>
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      isStageOverBudget
                        ? 'text-[var(--dts-amber-ink)] font-extrabold'
                        : 'text-[var(--dts-ink-soft)]'
                    )}
                  >
                    {formatMmSs(currentStageSec)} / {activeStageSpec.budgetDisplay}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)]">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      isStageOverBudget
                        ? 'bg-amber-500'
                        : session.timerStatus === 'running'
                          ? 'bg-emerald-600'
                          : 'bg-sky-600'
                    )}
                    style={{ width: `${stageProgressPct}%` }}
                  />
                </div>
                {isStageOverBudget && (
                  <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--dts-amber-ink)]">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>
                      {isVi
                        ? 'Đã vượt ngân sách thời gian khuyến nghị của chặng này — bạn vẫn có thể viết tiếp hoặc chuyển chặng.'
                        : 'Stage time budget exceeded — workspace stays unlocked, consider advancing to the next stage.'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {session.timerStatus !== 'running' ? (
                <button
                  type="button"
                  onClick={handleStartOrResume}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
                >
                  <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
                  <span>
                    {session.timerStatus === 'paused'
                      ? isVi
                        ? 'Tiếp tục'
                        : 'Resume'
                      : isVi
                        ? 'Bắt đầu'
                        : 'Start'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]"
                >
                  <Pause className="h-3.5 w-3.5 shrink-0" />
                  <span>{isVi ? 'Tạm dừng' : 'Pause'}</span>
                </button>
              )}

              {session.mode === 'simulate' && (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)]"
                >
                  <SkipForward className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {activeStageIndex < SNAKE_STAGE_ORDER.length - 1
                      ? isVi
                        ? 'Chuyển chặng kế'
                        : 'Next Stage'
                      : isVi
                        ? 'Tới Tự chấm Rubric'
                        : 'Go to Rubric'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
                title={isVi ? 'Đặt lại đồng hồ về 45:00' : 'Reset timer to 45:00'}
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
              </button>

              {session.mode === 'simulate' ? (
                <button
                  type="button"
                  onClick={handleOpenRubric}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-purple-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-purple-ink)]"
                >
                  <Award className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isVi ? 'Hoàn thành & Tự chấm Rubric' : 'Finish & Self-Grade Rubric'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBackToSimulate}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]"
                >
                  <span>{isVi ? '← Quay lại bàn làm bài' : '← Back to Workspace'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 5 SNAKE Stage Pills */}
          <div className="grid grid-cols-2 gap-1.5 @[680px]:grid-cols-5">
            {SNAKE_STAGE_ORDER.map((stageId) => {
              const st = SNAKE_STAGES[stageId];
              const elapsed = session.stageElapsedSec[stageId] ?? 0;
              const over = elapsed > st.budgetSec;
              const isActive = session.mode === 'simulate' && session.activeStage === stageId;
              const hasContent = Boolean(session.notes[stageId]?.trim());
              return (
                <button
                  key={stageId}
                  type="button"
                  onClick={() =>
                    updateCurrentSession((s) => ({
                      ...s,
                      mode: 'simulate',
                      activeStage: stageId,
                    }))
                  }
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-all',
                    isActive
                      ? over
                        ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1.5px_2px_0_var(--dts-shadow-color)]'
                        : 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] shadow-[1.5px_2px_0_var(--dts-shadow-color)]'
                      : over
                        ? 'border-amber-500/60 bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]'
                        : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-current font-mono text-xs font-extrabold">
                        {stageId}
                      </span>
                      <span className="truncate font-mono text-xs font-extrabold">
                        {pick(st.shortTitle)}
                      </span>
                      {hasContent && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                          title={isVi ? 'Đã có ghi chú' : 'Has notes'}
                        />
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] font-bold tabular-nums">
                    {formatMmSs(elapsed)}/{st.budgetDisplay}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===============================================================
            3A. SIMULATOR WORKSPACE MODE
           =============================================================== */}
        {session.mode === 'simulate' && (
          <>
            {/* Interviewer Opening Brief */}
            <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[240px]">
                  <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {isVi
                      ? 'Đề mở đầu của Interviewer (cố tình chưa đủ chi tiết — hãy làm rõ ở chặng S)'
                      : 'Interviewer Opening Brief (intentionally open-ended — clarify in Stage S)'}
                  </div>
                  <p className="text-sm sm:text-[15px] font-medium leading-relaxed text-[var(--dts-ink)]">
                    “{pick(currentPrompt.openingBrief)}”
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenRelatedModule(currentPrompt.relatedModuleId)}
                    className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-[var(--dts-blue-ink)]" />
                    <span>
                      {isVi
                        ? `Mở bài ${currentPrompt.relatedModuleId}`
                        : `Lesson ${currentPrompt.relatedModuleId}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCanvasLab}
                    className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
                  >
                    <FlaskConical className="h-3.5 w-3.5 shrink-0 text-[var(--dts-green-ink)]" />
                    <span>{isVi ? 'Phòng Lab' : 'Canvas Lab'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Main 2-Column Stage Workspace */}
            <div className="grid grid-cols-1 gap-3.5 @[860px]:grid-cols-12">
              {/* LEFT COLUMN: Stage Checklist + Interactive Tool for S / N / A / K / E */}
              <div className="space-y-3.5 @[860px]:col-span-5">
                {/* Stage Goal & Tailored Checklist */}
                <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-3">
                  <div>
                    <h2 className="font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                      {pick(activeStageSpec.fullTitle)}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--dts-ink-soft)]">
                      {pick(activeStageSpec.goal)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                      {isVi ? 'Checklist trọng tâm chặng này' : 'Stage Focus Checklist'}
                    </div>
                    {currentPrompt.snakeChecklist[session.activeStage].map((item) => {
                      const checked = session.checkedChecklistIds.includes(item.id);
                      return (
                        <label
                          key={item.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs leading-relaxed transition-colors',
                            checked
                              ? 'border-[var(--dts-border)] bg-[var(--dts-green-soft)] text-[var(--dts-ink)]'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              updateCurrentSession((s) => ({
                                ...s,
                                checkedChecklistIds: checked
                                  ? s.checkedChecklistIds.filter((id) => id !== item.id)
                                  : [...s.checkedChecklistIds, item.id],
                              }))
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
                          />
                          <span>{pick(item.text)}</span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* STAGE S TOOL: Uncover Hidden Assumptions from Interviewer */}
                {session.activeStage === 'S' && (
                  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4 shrink-0 text-[var(--dts-blue-ink)]" />
                        <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                          {isVi
                            ? 'Hỏi Interviewer — Khai mở giả định ẩn'
                            : 'Ask Interviewer — Uncover Hidden Constraints'}
                        </h3>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                        {
                          currentPrompt.hiddenAssumptions.filter((a) =>
                            session.revealedAssumptionIds.includes(a.id)
                          ).length
                        }
                        /{currentPrompt.hiddenAssumptions.length}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--dts-ink-soft)]">
                      {isVi
                        ? 'Tự phác thảo câu hỏi vào ô ghi chú trước, sau đó bấm từng chủ đề để xem câu trả lời của Interviewer.'
                        : 'Draft your own clarifying questions first, then click each topic to reveal the interviewer’s answer.'}
                    </p>

                    <div className="space-y-2">
                      {currentPrompt.hiddenAssumptions.map((assump) => {
                        const isRevealed = session.revealedAssumptionIds.includes(assump.id);
                        return (
                          <div
                            key={assump.id}
                            className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                                {pick(assump.topic)}
                              </span>
                              {!isRevealed ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCurrentSession((s) => ({
                                      ...s,
                                      revealedAssumptionIds: [
                                        ...s.revealedAssumptionIds,
                                        assump.id,
                                      ],
                                    }))
                                  }
                                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[var(--dts-blue-bg)] px-2 py-1 font-mono text-[11px] font-extrabold text-[var(--dts-blue-ink)]"
                                >
                                  <Eye className="h-3 w-3 shrink-0" />
                                  <span>{isVi ? 'Hỏi câu này' : 'Ask Interviewer'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const line = `\n- **${pick(assump.topic)}**: ${pick(assump.interviewerAnswer)}\n  → *${isVi ? 'Hệ quả thiết kế' : 'Impact'}*: ${pick(assump.designImpact)}`;
                                    updateCurrentSession((s) => ({
                                      ...s,
                                      notes: {
                                        ...s.notes,
                                        S: `${s.notes.S.trimEnd()}${line}\n`,
                                      },
                                    }));
                                  }}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-blue-ink)] hover:bg-[var(--dts-blue-soft)]"
                                >
                                  <FilePlus2 className="h-3 w-3 shrink-0" />
                                  <span>{isVi ? 'Chèn vào ghi chú S' : 'Insert to S notes'}</span>
                                </button>
                              )}
                            </div>
                            <p className="text-xs italic text-[var(--dts-ink-soft)]">
                              Q: “{pick(assump.question)}”
                            </p>
                            {isRevealed && (
                              <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2 text-xs space-y-1">
                                <p className="text-[var(--dts-ink)]">
                                  <strong className="font-mono text-[var(--dts-green-ink)]">
                                    Interviewer:
                                  </strong>{' '}
                                  {pick(assump.interviewerAnswer)}
                                </p>
                                <p className="text-[11.5px] text-[var(--dts-ink-muted)]">
                                  <strong>{isVi ? 'Tác động kiến trúc:' : 'Design impact:'}</strong>{' '}
                                  {pick(assump.designImpact)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* STAGE N TOOL: Interactive Napkin Math Scratchpad */}
                {session.activeStage === 'N' && (
                  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="h-4 w-4 shrink-0 text-[var(--dts-amber-ink)]" />
                        <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                          {isVi ? 'Bảng tính nhẩm Napkin Math' : 'Napkin Math Scratchpad'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentSession((s) => ({
                            ...s,
                            napkinInputs: { ...currentPrompt.napkinPreset },
                          }))
                        }
                        className="cursor-pointer rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-0.5 font-mono text-[10.5px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
                      >
                        {isVi ? 'Khôi phục số đề bài' : 'Load Prompt Preset'}
                      </button>
                    </div>

                    {/* 5 Inputs */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="col-span-2 space-y-1">
                        <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                          <span>DAU ({isVi ? 'Người dùng/ngày' : 'Daily Active Users'})</span>
                          <div className="flex gap-1">
                            {[
                              { label: '2M', val: 2_000_000 },
                              { label: '10M', val: 10_000_000 },
                              { label: '25M', val: 25_000_000 },
                              { label: '50M', val: 50_000_000 },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  updateCurrentSession((s) => ({
                                    ...s,
                                    napkinInputs: { ...s.napkinInputs, dau: preset.val },
                                  }))
                                }
                                className="cursor-pointer rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1.5 py-0.2 font-mono text-[10px] hover:bg-[var(--dts-amber-soft)]"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          min={0}
                          step={100000}
                          value={session.napkinInputs.dau}
                          onChange={(e) =>
                            updateCurrentSession((s) => ({
                              ...s,
                              napkinInputs: {
                                ...s.napkinInputs,
                                dau: Math.max(0, Number(e.target.value) || 0),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] focus:border-[var(--dts-border)] focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="block font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                          {isVi ? 'Đọc / user / ngày' : 'Reads / user / day'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={session.napkinInputs.readsPerUserPerDay}
                          onChange={(e) =>
                            updateCurrentSession((s) => ({
                              ...s,
                              napkinInputs: {
                                ...s.napkinInputs,
                                readsPerUserPerDay: Math.max(0, Number(e.target.value) || 0),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] focus:border-[var(--dts-border)] focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="block font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                          {isVi ? 'Ghi / user / ngày' : 'Writes / user / day'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={session.napkinInputs.writesPerUserPerDay}
                          onChange={(e) =>
                            updateCurrentSession((s) => ({
                              ...s,
                              napkinInputs: {
                                ...s.napkinInputs,
                                writesPerUserPerDay: Math.max(0, Number(e.target.value) || 0),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] focus:border-[var(--dts-border)] focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="block font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                          Payload (KB)
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={session.napkinInputs.payloadKb}
                          onChange={(e) =>
                            updateCurrentSession((s) => ({
                              ...s,
                              napkinInputs: {
                                ...s.napkinInputs,
                                payloadKb: Math.max(0, Number(e.target.value) || 0),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] focus:border-[var(--dts-border)] focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="block font-mono text-[11px] font-bold text-[var(--dts-ink-soft)]">
                          {isVi ? 'Lưu giữ (năm)' : 'Retention (years)'}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          step={1}
                          value={session.napkinInputs.retentionYears}
                          onChange={(e) =>
                            updateCurrentSession((s) => ({
                              ...s,
                              napkinInputs: {
                                ...s.napkinInputs,
                                retentionYears: Math.max(1, Number(e.target.value) || 1),
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] focus:border-[var(--dts-border)] focus:outline-none"
                        />
                      </label>
                    </div>

                    {/* Auto-Computed Readout Grid */}
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">Avg Read RPS</div>
                        <div className="font-extrabold text-[var(--dts-blue-ink)]">
                          {formatMetricNumber(napkinMetrics.avgReadRps)} RPS
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">
                          Peak Read RPS (×3)
                        </div>
                        <div className="font-extrabold text-[var(--dts-blue-ink)]">
                          {formatMetricNumber(napkinMetrics.peakReadRps)} RPS
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">
                          Avg / Peak Write RPS
                        </div>
                        <div className="font-extrabold text-[var(--dts-amber-ink)]">
                          {formatMetricNumber(napkinMetrics.avgWriteRps)} /{' '}
                          {formatMetricNumber(napkinMetrics.peakWriteRps)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">
                          Daily Storage (GB)
                        </div>
                        <div className="font-extrabold text-[var(--dts-ink)]">
                          {formatMetricNumber(napkinMetrics.dailyStorageGb, 2)} GB
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">
                          5-Year Storage (TB)
                          {session.napkinInputs.retentionYears !== 5 &&
                            ` · ${session.napkinInputs.retentionYears}Y`}
                        </div>
                        <div className="font-extrabold text-[var(--dts-ink)]">
                          {formatMetricNumber(napkinMetrics.fiveYearStorageTb, 2)} TB
                          {session.napkinInputs.retentionYears !== 5 &&
                            ` (${formatMetricNumber(napkinMetrics.retentionStorageTb, 2)} TB)`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--dts-ink-muted)]">
                          Bandwidth (Avg / Peak)
                        </div>
                        <div className="font-extrabold text-[var(--dts-ink)]">
                          {formatMetricNumber(napkinMetrics.avgBandwidthMBps, 2)} /{' '}
                          {formatMetricNumber(napkinMetrics.peakBandwidthMBps, 2)} MB/s
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-[var(--dts-border-soft)] pt-1.5 flex items-center justify-between">
                        <span className="text-[10.5px] text-[var(--dts-ink-muted)]">
                          20% Hot Cache RAM (GB)
                        </span>
                        <span className="font-extrabold text-[var(--dts-green-ink)]">
                          {formatMetricNumber(napkinMetrics.hotCacheRamGb, 2)} GB
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertNapkinTable}
                      className="dts-btn-tactile flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3 py-2 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]"
                    >
                      <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {isVi
                          ? 'Chèn bảng tính vào ghi chú chặng N'
                          : 'Insert Table into Stage N Notes'}
                      </span>
                    </button>
                  </section>
                )}

                {/* STAGE A TOOL: API & Schema Quick Templates */}
                {session.activeStage === 'A' && (
                  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-2.5">
                    <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                      {isVi
                        ? 'Mẫu nhanh Hợp đồng API & Lược đồ'
                        : 'Quick API & Schema Snippets'}
                    </h3>
                    <p className="text-xs text-[var(--dts-ink-soft)]">
                      {isVi
                        ? 'Bấm để chèn khung cú pháp vào ghi chú chặng A rồi điền tên thực thể cụ thể của bài toán:'
                        : 'Insert standard contract/schema skeletons directly into Stage A notes:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {API_SCHEMA_SNIPPETS.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() =>
                            updateCurrentSession((s) => ({
                              ...s,
                              notes: {
                                ...s.notes,
                                A: `${s.notes.A.trimEnd()}${tpl.snippet}`,
                              },
                            }))
                          }
                          className="dts-btn-tactile cursor-pointer rounded-lg bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-[var(--dts-ink)]"
                        >
                          {pick(tpl.label)}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* STAGE K TOOL: Quick Architecture Component Tagger */}
                {session.activeStage === 'K' && (
                  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                        {isVi
                          ? 'Gắn thẻ Thành phần Kiến trúc (Stage K)'
                          : 'Quick Architecture Component Tagger'}
                      </h3>
                      <span className="font-mono text-xs font-bold text-[var(--dts-blue-ink)]">
                        {session.selectedComponents.length} {isVi ? 'đã chọn' : 'tagged'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--dts-ink-soft)]">
                      {isVi
                        ? 'Chọn các thành phần có trong thiết kế của bạn (sẽ đối chiếu với kiến trúc tham chiếu ở cuối buổi):'
                        : 'Toggle the building blocks used in your architecture (compared against the reference design during review):'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ARCH_COMPONENT_PALETTE.map((chip) => {
                        const selected = session.selectedComponents.includes(chip.id);
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            title={pick(chip.hint)}
                            onClick={() =>
                              updateCurrentSession((s) => ({
                                ...s,
                                selectedComponents: selected
                                  ? s.selectedComponents.filter((id) => id !== chip.id)
                                  : [...s.selectedComponents, chip.id],
                              }))
                            }
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[11px] font-bold transition-all',
                              selected
                                ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)] font-extrabold'
                                : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                            )}
                          >
                            {selected && <Check className="h-3 w-3 shrink-0" />}
                            <span>{chip.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {session.selectedComponents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const listMd = session.selectedComponents
                            .map((id) => {
                              const found = ARCH_COMPONENT_PALETTE.find((c) => c.id === id);
                              return found ? `- **${found.label}**: ${pick(found.hint)}` : `- ${id}`;
                            })
                            .join('\n');
                          updateCurrentSession((s) => ({
                            ...s,
                            notes: {
                              ...s.notes,
                              K: `${s.notes.K.trimEnd()}\n\n### ${isVi ? 'Các thành phần đã chọn' : 'Selected Building Blocks'}\n${listMd}\n`,
                            },
                          }));
                        }}
                        className="dts-btn-tactile flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)]"
                      >
                        <FilePlus2 className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {isVi
                            ? 'Chèn danh sách thành phần vào ghi chú chặng K'
                            : 'Insert Selected Components into Stage K Notes'}
                        </span>
                      </button>
                    )}
                  </section>
                )}

                {/* STAGE E TOOL: Bottleneck, Failure & Trade-off Lenses */}
                {session.activeStage === 'E' && (
                  <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 space-y-2.5">
                    <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                      {isVi
                        ? 'Khung phân tích Điểm nghẽn, Sự cố & Đánh đổi'
                        : 'Bottleneck, Failure & Trade-off Lenses'}
                    </h3>
                    <p className="text-xs text-[var(--dts-ink-soft)]">
                      {isVi
                        ? 'Chèn các mục kiểm tra vận hành thực tế vào ghi chú chặng E để trình bày mạch lạc như kỹ sư giàu kinh nghiệm:'
                        : 'Insert structured production-readiness prompts into your Stage E notes:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ELABORATE_LENSES.map((lens) => (
                        <button
                          key={lens.id}
                          type="button"
                          onClick={() =>
                            updateCurrentSession((s) => ({
                              ...s,
                              notes: {
                                ...s.notes,
                                E: `${s.notes.E.trimEnd()}${pick(lens.snippet)}`,
                              },
                            }))
                          }
                          className="dts-btn-tactile cursor-pointer rounded-lg bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-[var(--dts-ink)]"
                        >
                          {pick(lens.label)}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN: Per-Stage Structured Notes Editor */}
              <section className="dts-card-tactile flex flex-col rounded-2xl bg-[var(--dts-panel-elevated)] p-4 @[860px]:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dts-line-strong)] pb-2.5">
                  <div>
                    <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                      {isVi ? 'Bản nháp trình bày — ' : 'Candidate Notes — '}
                      {pick(activeStageSpec.fullTitle)}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                      {isVi
                        ? 'Tự động lưu vào localStorage khi gõ · Không mất bài khi chuyển tab'
                        : 'Auto-saved to localStorage as you type · Preserved across tab switches'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      onBlur={() => setConfirmClearDraft(false)}
                      className={cn(
                        'cursor-pointer rounded-lg border px-2 py-1 font-mono text-[11px] font-bold transition-colors',
                        confirmClearDraft
                          ? 'border-[var(--dts-border)] bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] font-extrabold'
                          : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                      )}
                    >
                      {confirmClearDraft
                        ? isVi
                          ? 'Bấm lần nữa để xoá nháp đề này'
                          : 'Click again to clear draft'
                        : isVi
                          ? 'Xoá nháp'
                          : 'Clear draft'}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={16}
                  value={session.notes[session.activeStage]}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCurrentSession((s) => ({
                      ...s,
                      notes: {
                        ...s.notes,
                        [s.activeStage]: val,
                      },
                    }));
                  }}
                  placeholder={pick(activeStageSpec.placeholder)}
                  className="mt-3 min-h-[320px] w-full grow resize-y rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3.5 font-mono text-xs sm:text-[13px] leading-relaxed text-[var(--dts-ink)] placeholder:text-[var(--dts-ink-muted)] focus:border-[var(--dts-border)] focus:outline-none"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                    {session.notes[session.activeStage].trim()
                      ? `${session.notes[session.activeStage].trim().split(/\s+/).length} ${isVi ? 'từ trong chặng' : 'words in stage'} ${session.activeStage}`
                      : isVi
                        ? 'Chưa có nội dung ở chặng này'
                        : 'No notes in this stage yet'}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeStageIndex > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCurrentSession((s) => ({
                            ...s,
                            activeStage: SNAKE_STAGE_ORDER[activeStageIndex - 1],
                          }))
                        }
                        className="dts-btn-tactile cursor-pointer rounded-xl bg-[var(--dts-panel)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)]"
                      >
                        ← {SNAKE_STAGE_ORDER[activeStageIndex - 1]}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNextStage}
                      className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[var(--dts-green-bg)] px-3.5 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
                    >
                      <span>
                        {activeStageIndex < SNAKE_STAGE_ORDER.length - 1
                          ? isVi
                            ? `Sang chặng ${SNAKE_STAGE_ORDER[activeStageIndex + 1]}`
                            : `Next: Stage ${SNAKE_STAGE_ORDER[activeStageIndex + 1]}`
                          : isVi
                            ? 'Hoàn thành & Tự chấm Rubric'
                            : 'Finish & Self-Grade Rubric'}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {/* ===============================================================
            3B. END-OF-INTERVIEW RUBRIC & SIDE-BY-SIDE COMPARISON MODE
           =============================================================== */}
        {session.mode === 'rubric' && (
          <div className="space-y-4">
            {/* Score Summary, Calibration Band & Action Bar */}
            <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {isVi
                      ? 'Kết quả tự đánh giá theo Rubric SNAKE'
                      : 'SNAKE Self-Grading Calibration'}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-3xl font-extrabold tabular-nums text-[var(--dts-ink)]">
                      {rubricSummary.totalScore}
                      <span className="text-lg text-[var(--dts-ink-muted)]">/100</span>
                    </span>
                    <span
                      className={cn(
                        'rounded-xl border px-3 py-1 font-mono text-sm font-extrabold',
                        CALIBRATION_STYLES[rubricSummary.calibration]
                      )}
                    >
                      {rubricSummary.calibration}
                    </span>
                    <span className="font-mono text-xs text-[var(--dts-ink-soft)]">
                      {rubricSummary.calibration === 'Strong Hire'
                        ? isVi
                          ? '≥ 80đ: Bao phủ vững cả định lượng, luồng chính lẫn kịch bản lỗi & đánh đổi.'
                          : '≥ 80 pts: Covered math, core architecture, failure modes, and trade-offs thoroughly.'
                        : rubricSummary.calibration === 'Hire'
                          ? isVi
                            ? '55–79đ: Nắm vững luồng thiết kế chính; nên đào sâu thêm các ca biên ở chặng E.'
                            : '55–79 pts: Solid high-level design; sharpen edge-case & bottleneck depth in Stage E.'
                          : isVi
                            ? '< 55đ: Hãy tích chọn các tiêu chí bạn đã nêu bên dưới hoặc ôn lại bài học nền tảng.'
                            : '< 55 pts: Check off covered rubric criteria below or review the related module.'}
                    </span>
                  </div>
                </div>

                {/* Stage Breakdown Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {SNAKE_STAGE_ORDER.map((st) => {
                    const sc = rubricSummary.byStage[st];
                    return (
                      <div
                        key={st}
                        className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1 font-mono text-xs"
                      >
                        <span className="font-extrabold text-[var(--dts-ink)]">{st}:</span>{' '}
                        <span className="tabular-nums font-bold text-[var(--dts-blue-ink)]">
                          {sc.earned}/{sc.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary Persistence & Cross-Feature Actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--dts-line-strong)] pt-3.5">
                <button
                  type="button"
                  onClick={handleSaveAttemptHistory}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
                >
                  {historySavedToast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <Save className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span>
                    {historySavedToast
                      ? isVi
                        ? 'Đã lưu vào Lịch sử!'
                        : 'Saved to History!'
                      : isVi
                        ? 'Lưu kết quả lần luyện này'
                        : 'Save Attempt to History'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTranscriptToNotes}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-amber-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]"
                >
                  <StickyNote className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {noteSavedToast
                      ? isVi
                        ? 'Đã lưu vào Ghi chú!'
                        : 'Saved to Notes!'
                      : isVi
                        ? 'Lưu biên bản phỏng vấn vào Ghi chú'
                        : 'Save Transcript to Notes'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRelatedModule(currentPrompt.relatedModuleId)}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)]"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isVi
                      ? `Mở bài học liên quan (${currentPrompt.relatedModuleId})`
                      : `Open Related Lesson (${currentPrompt.relatedModuleId})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCanvasLab}
                  className="dts-btn-tactile inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-purple-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-purple-ink)]"
                >
                  <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                  <span>{isVi ? 'Thử dựng trên Phòng Lab' : 'Try in Canvas Lab'}</span>
                </button>
              </div>
            </section>

            {/* Interactive 100-Point Weighted Rubric */}
            <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono text-sm sm:text-base font-extrabold text-[var(--dts-ink)]">
                  {isVi
                    ? 'Bảng kiểm tự chấm Rubric (100 điểm qua 5 chặng S-N-A-K-E)'
                    : 'Weighted Self-Grading Rubric (100 Points Across S-N-A-K-E)'}
                </h2>
                <span className="font-mono text-xs text-[var(--dts-ink-muted)]">
                  {rubricSummary.checkedCount}/{rubricSummary.totalCount}{' '}
                  {isVi ? 'tiêu chí đạt' : 'criteria met'}
                </span>
              </div>

              <div className="space-y-3">
                {SNAKE_STAGE_ORDER.map((st) => {
                  const stageItems = currentPrompt.rubric.filter((r) => r.stage === st);
                  const stageScore = rubricSummary.byStage[st];
                  return (
                    <div
                      key={st}
                      className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="font-extrabold text-[var(--dts-ink)]">
                          {pick(SNAKE_STAGES[st].fullTitle)}
                        </span>
                        <span className="font-bold text-[var(--dts-blue-ink)]">
                          {stageScore.earned} / {stageScore.max} {isVi ? 'điểm' : 'pts'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {stageItems.map((item) => {
                          const checked = session.checkedRubricIds.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={cn(
                                'flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors',
                                checked
                                  ? 'border-[var(--dts-border)] bg-[var(--dts-green-soft)]'
                                  : 'border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] hover:bg-[var(--dts-panel-muted)]'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  updateCurrentSession((s) => ({
                                    ...s,
                                    checkedRubricIds: checked
                                      ? s.checkedRubricIds.filter((id) => id !== item.id)
                                      : [...s.checkedRubricIds, item.id],
                                  }))
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="font-semibold text-[var(--dts-ink)]">
                                  <span className="mr-1.5 rounded bg-[var(--dts-amber-bg)] px-1.5 py-0.5 font-mono text-[10.5px] font-extrabold text-[var(--dts-amber-ink)]">
                                    +{item.points}
                                  </span>
                                  {pick(item.criterion)}
                                </div>
                                <div className="text-[11.5px] text-[var(--dts-ink-muted)]">
                                  {pick(item.expectedDetail)}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Side-by-Side Comparison: Candidate Notes vs Interviewer Reference Solution */}
            <div className="grid grid-cols-1 gap-4 @[860px]:grid-cols-2">
              {/* LEFT: Candidate Submission */}
              <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5 space-y-3.5">
                <div className="border-b border-[var(--dts-line-strong)] pb-2">
                  <h2 className="font-mono text-sm sm:text-base font-extrabold text-[var(--dts-ink)]">
                    {isVi
                      ? 'Bài trình bày của bạn (5 chặng SNAKE)'
                      : 'Your SNAKE Submission'}
                  </h2>
                  <p className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                    {isVi ? 'Tổng thời gian:' : 'Total time:'}{' '}
                    {formatMmSs(session.totalElapsedSec)} / 45:00
                  </p>
                </div>

                {/* Candidate Tagged Components */}
                <div className="space-y-1.5">
                  <div className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {isVi ? 'Thành phần đã gắn thẻ ở chặng K' : 'Tagged Components in Stage K'}
                  </div>
                  {session.selectedComponents.length === 0 ? (
                    <p className="text-xs italic text-[var(--dts-ink-muted)]">
                      {isVi ? 'Chưa chọn thẻ thành phần nào.' : 'No component chips selected.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {session.selectedComponents.map((id) => {
                        const chip = ARCH_COMPONENT_PALETTE.find((c) => c.id === id);
                        const isRecommended = currentPrompt.recommendedComponents.includes(id);
                        return (
                          <span
                            key={id}
                            className={cn(
                              'rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold',
                              isRecommended
                                ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                                : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)]'
                            )}
                          >
                            {chip?.label ?? id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Candidate Notes per Stage */}
                <div className="space-y-2.5">
                  {SNAKE_STAGE_ORDER.map((st) => {
                    const spec = SNAKE_STAGES[st];
                    const text = session.notes[st]?.trim();
                    return (
                      <div
                        key={st}
                        className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-extrabold text-[var(--dts-ink)]">
                            {pick(spec.fullTitle)}
                          </span>
                          <span className="text-[11px] text-[var(--dts-ink-muted)] tabular-nums">
                            {formatMmSs(session.stageElapsedSec[st])}/{spec.budgetDisplay}
                          </span>
                        </div>
                        {text ? (
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--dts-ink-soft)]">
                            {text}
                          </pre>
                        ) : (
                          <p className="text-xs italic text-[var(--dts-ink-muted)]">
                            {isVi ? '(Bỏ trống)' : '(Empty)'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* RIGHT: Interviewer Reference Solution */}
              <section className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5 space-y-4">
                <div className="border-b border-[var(--dts-line-strong)] pb-2">
                  <h2 className="font-mono text-sm sm:text-base font-extrabold text-[var(--dts-blue-ink)]">
                    {isVi
                      ? 'Đáp án mẫu của Interviewer'
                      : 'Interviewer Reference Solution'}
                  </h2>
                  <p className="font-mono text-[11px] text-[var(--dts-ink-muted)]">
                    {isVi
                      ? 'Đối chiếu trực tiếp giả định, số liệu nhẩm và kiến trúc chuẩn'
                      : 'Compare hidden constraints, reference math, and target architecture'}
                  </p>
                </div>

                {/* Reference Napkin Numbers */}
                <div className="space-y-1.5">
                  <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                    {isVi ? '1. Số liệu Napkin Math tham chiếu' : '1. Reference Napkin Math'}
                  </h3>
                  <div className="space-y-1.5">
                    {currentPrompt.referenceNumbers.map((rn, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                          <span className="font-semibold text-[var(--dts-ink)]">
                            {pick(rn.metric)}
                          </span>
                          <span className="font-mono font-extrabold text-[var(--dts-blue-ink)]">
                            {rn.value}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-[var(--dts-ink-muted)]">
                          {pick(rn.formula)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Components with Candidate Diff */}
                <div className="space-y-1.5">
                  <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                    {isVi
                      ? '2. Thành phần cốt lõi mong đợi (Xanh = bạn đã chọn)'
                      : '2. Expected Core Components (Green = you tagged)'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {currentPrompt.recommendedComponents.map((id) => {
                      const chip = ARCH_COMPONENT_PALETTE.find((c) => c.id === id);
                      const matched = session.selectedComponents.includes(id);
                      return (
                        <span
                          key={id}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold',
                            matched
                              ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] font-extrabold'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]'
                          )}
                        >
                          {matched && <Check className="h-3 w-3 shrink-0" />}
                          <span>{chip?.label ?? id}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Reference Architecture Summary & Paths */}
                <div className="space-y-2 text-xs leading-relaxed">
                  <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                    {isVi ? '3. Tổng quan Kiến trúc & Luồng dữ liệu' : '3. Reference Architecture'}
                  </h3>
                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3 space-y-2 text-[var(--dts-ink-soft)]">
                    <p className="text-[var(--dts-ink)]">
                      {pick(currentPrompt.referenceArchitecture.summary)}
                    </p>
                    <div>
                      <strong className="font-mono text-[var(--dts-amber-ink)]">
                        Write Path:
                      </strong>{' '}
                      {pick(currentPrompt.referenceArchitecture.writePath)}
                    </div>
                    <div>
                      <strong className="font-mono text-[var(--dts-blue-ink)]">Read Path:</strong>{' '}
                      {pick(currentPrompt.referenceArchitecture.readPath)}
                    </div>
                  </div>
                </div>

                {/* Key Trade-offs */}
                <div className="space-y-1.5 text-xs leading-relaxed">
                  <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                    {isVi ? '4. Đánh đổi cốt lõi cần bảo vệ' : '4. Key Architectural Trade-offs'}
                  </h3>
                  <ul className="space-y-1.5">
                    {currentPrompt.referenceArchitecture.tradeoffs.map((t, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 text-[var(--dts-ink-soft)]"
                      >
                        {pick(t)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* All Hidden Assumptions Reference */}
                <div className="space-y-1.5 text-xs leading-relaxed">
                  <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                    {isVi ? '5. Các giả định ẩn ở chặng Scope' : '5. Scope Hidden Constraints'}
                  </h3>
                  <div className="space-y-1.5">
                    {currentPrompt.hiddenAssumptions.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5"
                      >
                        <div className="font-mono font-bold text-[var(--dts-ink)]">
                          {pick(a.topic)}
                        </div>
                        <p className="mt-0.5 text-[var(--dts-ink-soft)]">
                          {pick(a.interviewerAnswer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secondary Modules for Further Study */}
                {currentPrompt.secondaryModuleIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--dts-line-strong)] pt-3">
                    <span className="font-mono text-[11px] font-bold text-[var(--dts-ink-muted)]">
                      {isVi ? 'Bài học bổ trợ:' : 'Supporting lessons:'}
                    </span>
                    {[currentPrompt.relatedModuleId, ...currentPrompt.secondaryModuleIds].map(
                      (mid) => (
                        <button
                          key={mid}
                          type="button"
                          onClick={() => handleOpenRelatedModule(mid)}
                          className="cursor-pointer rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--dts-blue-ink)] hover:bg-[var(--dts-blue-soft)]"
                        >
                          {mid}
                        </button>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SdInterviewView;
