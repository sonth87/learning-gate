import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Eye,
  Gauge,
  Globe,
  HardDrive,
  HelpCircle,
  Layers,
  Link2,
  Lock,
  Pause,
  Redo2,
  Play,
  Plus,
  RotateCcw,
  Router,
  Search,
  Server,
  Shield,
  Sliders,
  Sparkles,
  Split,
  Star,
  StickyNote,
  Trash2,
  Undo2,
  Users,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { computeModelStaticCostPerHour } from '@/features/sysdesign-course/activities/grade';
import {
  createSim,
  defaultRoute,
  DT,
  effReplicas,
  findBottleneck,
  findSpofs,
  KIND_DEFAULTS,
  makeNode,
  maxSustainableRps,
  SimModelError,
  structuralWarnings,
  validate,
  type BottleneckReason,
  type BreakerPolicy,
  type KnobValue,
  type LinkId,
  type LinkSpec,
  type LoadProfile,
  type NodeId,
  type NodeSpec,
  type NodeState,
  type PrimitiveKind,
  type RetryPolicy,
  type RouteMode,
  type Sim,
  type SimFrame,
  type SimScenario,
  type StructuralWarning,
  type StructuralWarningCode,
  type SystemModel,
  type TimedEvent,
} from '@/features/sysdesign-course/sim';
import { useSdProgress } from '@/features/sysdesign-course/store';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  gradeLabChallenge,
  LAB_BLANK_SANDBOX_PRESET,
  LAB_CHALLENGES,
  LAB_SANDBOX_PRESET,
  type BiText,
  type LabCanvasPreset,
  type LabChallengeSpec,
  type LabGradeReport,
  checkLabIntegrity,
} from '../data/labChallenges';
import { LabConfirmDialog } from '../components/lab/LabConfirmDialog';
import { LabDifficultyPips, LabLevelBadge, LabPicker } from '../components/lab/LabPicker';
import { checkDataFlowIntegrity } from '../data/labIntegrity';
import {
  CARD_H,
  CARD_H_DOTS,
  CARD_W,
  CARD_W_DOTS,
  collidesAny,
  DOT,
  findFreeSpot,
  findPlacementForNew,
  nodeAtPoint,
  nudgePosition,
  routeOrthogonalWires,
  snapToDot,
  type CanvasPos,
  type PxPos,
} from '../components/lab/canvasGeometry';
import {
  readValidDraft,
  stableStringify,
  useLabDrafts,
  type LabCanvasMode,
} from '../store/useLabDrafts';

/* ─────────────────────────── CONSTANTS & METADATA ─────────────────────────── */

/**
 * Canvas tự do: node đặt theo lưới chấm DOT = 26 px (xem canvasGeometry). Khung board luôn chừa
 * CANVAS_PAD chấm (~3 ô lưới cũ) trống quanh sơ đồ và tự nới khi node ra mép.
 */
const CANVAS_PAD = 16;
const MIN_BOARD_DOTS_W = 60;
const MIN_BOARD_DOTS_H = 31;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(z.toFixed(3))));

type PaletteKind =
  | 'client'
  | 'dns'
  | 'cdn'
  | 'lb'
  | 'gateway'
  | 'service'
  | 'cache'
  | 'sql'
  | 'nosql'
  | 'queue'
  | 'worker'
  | 'rate-limiter'
  | 'search'
  | 'blob';

interface PaletteItemMeta {
  kind: PaletteKind;
  label: BiText;
  shortRole: BiText;
  toneClass: string;
  icon: React.FC<{ className?: string }>;
}

const PALETTE_ITEMS: PaletteItemMeta[] = [
  {
    kind: 'client',
    label: { vi: 'Client', en: 'Client' },
    shortRole: { vi: 'Nguồn phát lưu lượng', en: 'Traffic generator' },
    toneClass: 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink)]',
    icon: Users,
  },
  {
    kind: 'dns',
    label: { vi: 'DNS', en: 'DNS' },
    shortRole: { vi: 'Phân giải tên miền', en: 'Domain resolution' },
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Globe,
  },
  {
    kind: 'cdn',
    label: { vi: 'CDN', en: 'CDN' },
    shortRole: { vi: 'Cache nội dung tại biên', en: 'Edge content cache' },
    toneClass: 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]',
    icon: Zap,
  },
  {
    kind: 'rate-limiter',
    label: { vi: 'Rate Limiter', en: 'Rate Limiter' },
    shortRole: { vi: 'Kiểm soát tốc độ (Token Bucket)', en: 'Token bucket admission' },
    toneClass: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]',
    icon: Shield,
  },
  {
    kind: 'lb',
    label: { vi: 'Load Balancer', en: 'Load Balancer' },
    shortRole: { vi: 'Chia tải giữa các backend', en: 'Distributes backend traffic' },
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Split,
  },
  {
    kind: 'gateway',
    label: { vi: 'API Gateway', en: 'API Gateway' },
    shortRole: { vi: 'Xác thực & định tuyến API', en: 'API auth & routing' },
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Router,
  },
  {
    kind: 'service',
    label: { vi: 'App Service', en: 'App Service' },
    shortRole: { vi: 'Xử lý nghiệp vụ stateless', en: 'Stateless app compute' },
    toneClass: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]',
    icon: Server,
  },
  {
    kind: 'cache',
    label: { vi: 'Cache', en: 'Cache' },
    shortRole: { vi: 'Bộ nhớ đệm đọc tốc độ cao', en: 'In-memory key-value cache' },
    toneClass: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]',
    icon: Cpu,
  },
  {
    kind: 'queue',
    label: { vi: 'Message Queue', en: 'Message Queue' },
    shortRole: { vi: 'Đệm tải ghi bất đồng bộ', en: 'Async message buffer' },
    toneClass: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]',
    icon: Workflow,
  },
  {
    kind: 'worker',
    label: { vi: 'Async Worker', en: 'Async Worker' },
    shortRole: { vi: 'Tiêu thụ message từ Queue', en: 'Pull consumer from Queue' },
    toneClass: 'bg-[var(--dts-purple-soft)] text-[var(--dts-purple-ink)]',
    icon: Layers,
  },
  {
    kind: 'sql',
    label: { vi: 'SQL Database', en: 'SQL Database' },
    shortRole: { vi: 'CSDL quan hệ ACID', en: 'Relational ACID database' },
    toneClass: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]',
    icon: Database,
  },
  {
    kind: 'nosql',
    label: { vi: 'NoSQL Store', en: 'NoSQL Store' },
    shortRole: { vi: 'Lưu trữ phân mảnh ngang', en: 'Sharded key/doc store' },
    toneClass: 'bg-[var(--dts-orange-bg)] text-[var(--dts-orange-ink)]',
    icon: HardDrive,
  },
  {
    kind: 'search',
    label: { vi: 'Search Index', en: 'Search Index' },
    shortRole: { vi: 'Chỉ mục tìm kiếm toàn văn', en: 'Full-text search cluster' },
    toneClass: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]',
    icon: Search,
  },
  {
    kind: 'blob',
    label: { vi: 'Blob Storage', en: 'Blob Storage' },
    shortRole: { vi: 'Lưu trữ đối tượng / media', en: 'Object & media storage' },
    toneClass: 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink)]',
    icon: Box,
  },
];

const KIND_META_MAP: Record<string, PaletteItemMeta> = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.kind, item])
);

const DEFAULT_BREAKER_POLICY: BreakerPolicy = {
  errorThreshold: 0.5,
  minRps: 20,
  windowSec: 5,
  openSec: 10,
  probeRps: 10,
  closeAfterOk: 0.8,
};

type RetryPresetId = 'off' | 'immediate' | 'exp-jitter-budget';

function detectRetryPreset(retry?: RetryPolicy): RetryPresetId {
  if (!retry || retry.max <= 0) return 'off';
  if (retry.backoff === 'none') return 'immediate';
  return 'exp-jitter-budget';
}

function buildRetryPolicy(preset: RetryPresetId): RetryPolicy | undefined {
  if (preset === 'off') return undefined;
  if (preset === 'immediate') {
    return { max: 2, backoff: 'none', baseMs: 0, jitter: 'none' };
  }
  return {
    max: 2,
    backoff: 'exponential',
    baseMs: 80,
    factor: 2,
    capMs: 800,
    jitter: 'full',
    budgetRatio: 0.1,
  };
}

const STATE_BADGE_META: Record<
  NodeState,
  { vi: string; en: string; cls: string; barCls: string }
> = {
  idle: {
    vi: 'idle',
    en: 'idle',
    cls: 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink-muted)] border-[var(--dts-line-strong)]',
    barCls: 'bg-[#8d8579]',
  },
  healthy: {
    vi: 'healthy',
    en: 'healthy',
    cls: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border)]',
    barCls: 'bg-[#4d9e45]',
  },
  busy: {
    vi: 'busy',
    en: 'busy',
    cls: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] border-[var(--dts-border)]',
    barCls: 'bg-[#3b82c4]',
  },
  saturated: {
    vi: 'saturated',
    en: 'saturated',
    cls: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] border-[var(--dts-border)]',
    barCls: 'bg-[#d9822b]',
  },
  overloaded: {
    vi: 'overloaded',
    en: 'overloaded',
    cls: 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] border-[var(--dts-border)]',
    barCls: 'bg-[#dc3d43]',
  },
  down: {
    vi: 'down',
    en: 'down',
    cls: 'bg-[#2b1518] text-[#ffd4d8] border-[#dc3d43]',
    barCls: 'bg-[#dc3d43]',
  },
  recovering: {
    vi: 'recovering',
    en: 'recovering',
    cls: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)] border-[var(--dts-border)]',
    barCls: 'bg-[#8b5cf6]',
  },
};

function pick(text: BiText, lang: WorkbenchLang): string {
  return lang === 'en' ? text.en : text.vi;
}

/* ─────────────────────────── TRANSLATION HELPERS ─────────────────────────── */

function explainBottleneckReason(
  reason: BottleneckReason,
  nodeLabel: string,
  rho: number,
  lang: WorkbenchLang
): string {
  const rhoStr = rho.toFixed(2);
  if (lang === 'en') {
    switch (reason) {
      case 'saturated':
        return `${nodeLabel} has utilization ρ = ${rhoStr} near/above capacity. Scale out replicas, add caching, or offload writes.`;
      case 'queueing':
        return `${nodeLabel} (ρ = ${rhoStr}) accumulates queueing wait time that dominates tail latency.`;
      case 'pool-limited':
        return `${nodeLabel} (ρ = ${rhoStr}) is capped by its connection poolSize before CPU throughput is reached.`;
      case 'hot-shard':
        return `${nodeLabel} (ρ = ${rhoStr}) suffers hot-key skew on one shard. More shards won't help the hot key itself — split it (hotKeySalt), put a Cache in front for hot reads, or batch hot writes.`;
      case 'slow-dependency':
        return `${nodeLabel} accounts for the largest share of end-to-end latency despite low utilization (ρ = ${rhoStr}).`;
      case 'none':
        return `No active bottleneck detected (highest utilization is ${nodeLabel} at ρ = ${rhoStr}).`;
    }
  }
  switch (reason) {
    case 'saturated':
      return `${nodeLabel} đang chạm hoặc vượt ngưỡng phục vụ (ρ = ${rhoStr}). Hãy tăng số instance, đặt Cache giảm tải đọc hoặc đệm ghi qua Queue.`;
    case 'queueing':
      return `${nodeLabel} (ρ = ${rhoStr}) đang tích lũy hàng đợi khiến thời gian chờ đẩy độ trễ đuôi p99 tăng nhanh.`;
    case 'pool-limited':
      return `${nodeLabel} (ρ = ${rhoStr}) bị giới hạn bởi Connection Pool (poolSize) thấp hơn thông lượng xử lý tối đa.`;
    case 'hot-shard':
      return `${nodeLabel} (ρ = ${rhoStr}) bị lệch tải trên một phân mảnh nóng (hot shard). Thêm shard không giảm tải cho chính khoá nóng — hãy chia nhỏ khoá (hotKeySalt), đặt Cache phía trước hút đọc nóng, hoặc gom/batch ghi.`;
    case 'slow-dependency':
      return `${nodeLabel} chiếm tỷ trọng thời gian xử lý lớn nhất trên đường nóng dù tải ρ = ${rhoStr} chưa cao.`;
    case 'none':
      return `Hệ thống đang thông thoáng, chưa xuất hiện điểm nghẽn (thành phần bận nhất là ${nodeLabel} với ρ = ${rhoStr}).`;
  }
}

function formatStructuralWarning(
  w: StructuralWarning,
  model: SystemModel,
  lang: WorkbenchLang
): { title: string; detail: string } {
  const nodeName = w.nodeId
    ? pick(model.nodes.find((n) => n.id === w.nodeId)?.label ?? { vi: w.nodeId, en: w.nodeId }, lang)
    : '';
  const linkObj = w.linkId ? model.links.find((l) => l.id === w.linkId) : undefined;
  const linkName = linkObj ? `${linkObj.from} → ${linkObj.to}` : w.linkId ?? '';

  const table: Record<StructuralWarningCode, { vi: [string, string]; en: [string, string] }> = {
    SPOF: {
      vi: [
        `Điểm lỗi đơn (SPOF): ${nodeName}`,
        `Nếu ${nodeName} dừng hoạt động, lưu lượng tới tầng lưu trữ phía sau sẽ bị gián đoạn. Hãy tăng replicas ≥ 2 hoặc nối bản sao dự phòng.`,
      ],
      en: [
        `Single Point of Failure (SPOF): ${nodeName}`,
        `If ${nodeName} fails, downstream critical components are cut off. Set replicas ≥ 2 or configure replication.`,
      ],
    },
    STATEFUL_NO_REPLICA: {
      vi: [
        `Thành phần lưu trữ chưa có bản sao: ${nodeName}`,
        `Thêm replica (replicas ≥ 2) hoặc nối đường mode = "replicate" sang một node dự phòng để tránh mất khả năng sẵn sàng.`,
      ],
      en: [
        `Unreplicated stateful store: ${nodeName}`,
        `Set replicas ≥ 2 or add a mode = "replicate" link to a standby node for high availability.`,
      ],
    },
    CACHE_NO_TTL: {
      vi: [
        `Cache thiếu TTL hợp lý: ${nodeName}`,
        `Đặt ttlSec < 86.400s để tránh giữ dữ liệu cũ quá lâu trong bộ nhớ đệm.`,
      ],
      en: [
        `Cache missing bounded TTL: ${nodeName}`,
        `Configure ttlSec < 86,400s to prevent unbounded stale entries.`,
      ],
    },
    CACHE_SYNC_TTL: {
      vi: [
        `TTL chưa có Jitter chống hết hạn đồng loạt: ${nodeName}`,
        `Tăng ttlJitterPct ≥ 0.10 (10%) trên ${nodeName} để các khóa không hết hạn cùng một thời điểm (cache stampede).`,
      ],
      en: [
        `Synchronized cache TTL without jitter: ${nodeName}`,
        `Set ttlJitterPct ≥ 0.10 on ${nodeName} to spread key expirations and prevent cache stampedes.`,
      ],
    },
    SYNC_CROSS_REGION_HOT_PATH: {
      vi: [
        `Gọi đồng bộ xuyên vùng trên đường nóng: ${linkName}`,
        `Kết nối cross-region cộng thêm ~70 ms RTT mỗi lượt. Hãy chuyển sang async/replicate hoặc đặt dữ liệu cùng vùng.`,
      ],
      en: [
        `Synchronous cross-region call on hot path: ${linkName}`,
        `Cross-region RTT (~70 ms) inflates tail latency. Switch to async/replicate or co-locate within the region.`,
      ],
    },
    QUEUE_NO_DLQ: {
      vi: [
        `Hàng đợi chưa bật Dead-Letter Queue: ${nodeName}`,
        `Bật dlq = true trên ${nodeName} để cô lập bản tin lỗi, tránh vòng lặp xử lý lại làm đầy hàng đợi.`,
      ],
      en: [
        `Queue without Dead-Letter Queue: ${nodeName}`,
        `Enable dlq = true on ${nodeName} so poison messages do not loop indefinitely.`,
      ],
    },
    UNBOUNDED_QUEUE: {
      vi: [
        `Hàng đợi chưa giới hạn chiều sâu: ${nodeName}`,
        `Đặt maxDepth hữu hạn để áp dụng back-pressure thay vì làm cạn bộ nhớ.`,
      ],
      en: [
        `Unbounded queue depth: ${nodeName}`,
        `Configure a finite maxDepth to enforce back-pressure before memory exhaustion.`,
      ],
    },
    NO_TIMEOUT: {
      vi: [
        `Kết nối đồng bộ chưa đặt timeoutMs: ${linkName}`,
        `Cấu hình timeoutMs trên ${linkName} để tránh giữ kết nối chờ vô hạn khi dịch vụ đích phản hồi chậm.`,
      ],
      en: [
        `Sync link without timeoutMs: ${linkName}`,
        `Configure timeoutMs on ${linkName} to prevent indefinite thread/connection blocking.`,
      ],
    },
    RETRY_NO_BACKOFF: {
      vi: [
        `Retry tức thì không có giãn cách (backoff): ${linkName}`,
        `Chọn preset "Exponential + Jitter + Budget" để không khuếch đại tải vào thành phần đang quá tải.`,
      ],
      en: [
        `Immediate retry without backoff: ${linkName}`,
        `Switch to "Exponential + Jitter + Budget" to avoid amplifying load on a struggling dependency.`,
      ],
    },
    RETRY_NO_JITTER: {
      vi: [
        `Retry thiếu Jitter ngẫu nhiên: ${linkName}`,
        `Thêm jitter để các lượt thử lại không dồn thành từng đợt đồng bộ.`,
      ],
      en: [
        `Retry policy without jitter: ${linkName}`,
        `Enable full/equal jitter so retries do not synchronize into waves.`,
      ],
    },
    RETRY_AMPLIFICATION: {
      vi: [
        `Khuếch đại Retry nhiều tầng: ${linkName}`,
        `Tích số lần retry dọc chuỗi gọi quá lớn (×${w.params?.product ?? ''}). Chỉ nên retry ở một tầng kèm ngân sách giới hạn.`,
      ],
      en: [
        `Multi-hop retry amplification: ${linkName}`,
        `Cumulative retry multiplier reaches ×${w.params?.product ?? ''}. Retry at a single layer with a retry budget.`,
      ],
    },
    NO_BREAKER_ON_DEP: {
      vi: [
        `Retry vào tầng dữ liệu thiếu Circuit Breaker: ${linkName}`,
        `Bật Circuit Breaker trên ${linkName} để ngắt nhanh khi tầng lưu trữ gặp sự cố kéo dài.`,
      ],
      en: [
        `Retrying storage dependency without Circuit Breaker: ${linkName}`,
        `Enable Circuit Breaker on ${linkName} to fail fast when the downstream store degrades.`,
      ],
    },
    NO_RATE_LIMIT_AT_EDGE: {
      vi: [
        'Chưa có Rate Limiter hoặc API Gateway ở cửa ngõ',
        'Đặt Rate Limiter hoặc Gateway trong 2 chặng đầu từ Client để bảo vệ hệ thống trước lưu lượng đột biến.',
      ],
      en: [
        'No Rate Limiter or API Gateway at ingress edge',
        'Place a Rate Limiter or Gateway within 2 hops of Client to protect backend tiers from traffic spikes.',
      ],
    },
    LB_NO_HEALTHCHECK: {
      vi: [
        `Load Balancer thiếu Health Check nhanh: ${nodeName}`,
        `Giảm healthCheckSec (< 30s) để LB sớm ngừng gửi lưu lượng tới backend gặp lỗi.`,
      ],
      en: [
        `Load Balancer slow/missing health check: ${nodeName}`,
        `Set healthCheckSec < 30s so unhealthy instances are removed promptly.`,
      ],
    },
    SINGLE_AZ: {
      vi: [
        'Toàn bộ hạ tầng đang đặt trong cùng một Availability Zone',
        'Phân bổ bớt instance/replica sang az-b để duy trì hoạt động khi một AZ gặp sự cố.',
      ],
      en: [
        'All infrastructure nodes reside in a single Availability Zone',
        'Place replicas across az-a and az-b for zone-level fault tolerance.',
      ],
    },
    DB_FANIN_EXCEEDS_CONNS: {
      vi: [
        `Tổng kết nối vượt giới hạn maxConnections của ${nodeName}`,
        `Tổng pool từ các tầng gọi vào (${w.params?.fanin ?? ''}) vượt ngưỡng ${w.params?.max ?? ''}. Hãy giảm poolSize mỗi instance hoặc đặt bộ gộp kết nối.`,
      ],
      en: [
        `Connection fan-in exceeds maxConnections on ${nodeName}`,
        `Total caller pools (${w.params?.fanin ?? ''}) exceed max ${w.params?.max ?? ''}. Lower per-instance poolSize.`,
      ],
    },
  };

  const entry = table[w.code];
  const pair = lang === 'en' ? entry.en : entry.vi;
  return { title: pair[0], detail: pair[1] };
}

/* ─────────────────────────── ORTHOGONAL WIRE ROUTER ─────────────────────────── */

interface ComputedWire {
  link: LinkSpec;
  d: string;
  labelX: number;
  labelY: number;
}

function roundOrthogonalPoints(pts: [number, number][], radius = 8): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const dx1 = x1 - x0;
    const dy1 = y1 - y0;
    const len1 = Math.hypot(dx1, dy1);
    const dx2 = x2 - x1;
    const dy2 = y2 - y1;
    const len2 = Math.hypot(dx2, dy2);
    if (len1 < 1 || len2 < 1 || (dx1 === 0 && dx2 === 0) || (dy1 === 0 && dy2 === 0)) {
      d += ` L ${x1} ${y1}`;
      continue;
    }
    const r = Math.min(radius, len1 * 0.45, len2 * 0.45);
    const pStartX = x1 - (dx1 / len1) * r;
    const pStartY = y1 - (dy1 / len1) * r;
    const pEndX = x1 + (dx2 / len2) * r;
    const pEndY = y1 + (dy2 / len2) * r;
    d += ` L ${pStartX.toFixed(1)} ${pStartY.toFixed(1)} Q ${x1.toFixed(1)} ${y1.toFixed(1)} ${pEndX.toFixed(1)} ${pEndY.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

/** Dây vuông góc cho canvas tự do (định tuyến ở canvasGeometry, ở đây chỉ bo góc thành path SVG). */
function computeOrthogonalWires(
  links: LinkSpec[],
  positions: Record<NodeId, PxPos>
): ComputedWire[] {
  return routeOrthogonalWires(links, positions).map((w) => ({
    link: w.link,
    d: roundOrthogonalPoints(w.points, 8),
    labelX: w.labelX,
    labelY: w.labelY,
  }));
}

/* ─────────────────────────── LINK HELP COPY ─────────────────────────── */

const LINK_MODE_HELP: Record<LinkSpec['mode'], BiText> = {
  sync: {
    vi: 'Bên gọi chờ phản hồi rồi mới đi tiếp (áp dụng timeout/retry).',
    en: 'Caller waits for the response before continuing (timeout/retry apply).',
  },
  async: {
    vi: 'Gửi rồi bỏ đó (fire-and-forget) vào Queue; bên gọi không chờ kết quả.',
    en: 'Fire-and-forget into a queue; the caller does not wait for a result.',
  },
  pull: {
    vi: 'Worker tự kéo message từ Queue theo tốc độ xử lý của nó.',
    en: 'The worker consumes from the queue at its own pace.',
  },
  replicate: {
    vi: 'Sao chép dữ liệu giữa hai store; không mang request của người dùng.',
    en: 'Data copy between two stores; carries no user requests.',
  },
};

const LINK_CARRIES_HELP: Record<'rw' | 'r' | 'w', BiText> = {
  rw: {
    vi: 'rw: cả request đọc và ghi đều đi qua dây này.',
    en: 'rw: both read and write requests flow on this wire.',
  },
  r: {
    vi: 'r: chỉ request đọc đi qua dây này.',
    en: 'r: only read requests flow on this wire.',
  },
  w: {
    vi: 'w: chỉ request ghi đi qua dây này.',
    en: 'w: only write requests flow on this wire.',
  },
};

/* ─────────────────────────── CANVAS HELPERS ─────────────────────────── */

const HISTORY_CAP = 50;
const HISTORY_COALESCE_MS = 700;
const DRAFT_DEBOUNCE_MS = 450;

interface CanvasSnap {
  model: SystemModel;
  positions: Record<NodeId, CanvasPos>;
  load: LoadProfile;
  readRatio: number;
  durationSec: number;
}

interface ResolvedCanvas extends CanvasSnap {
  canvasMode: LabCanvasMode;
  lockedIds: string[];
}

function presetFor(templateId: string, mode: LabCanvasMode): LabCanvasPreset {
  const ch = LAB_CHALLENGES.find((c) => c.id === templateId);
  if (!ch) return mode === 'blank' ? LAB_BLANK_SANDBOX_PRESET : LAB_SANDBOX_PRESET;
  if (mode === 'blank') return ch.blank;
  if (mode === 'reference') return ch.referenceSolution;
  return ch.starter;
}

function canvasFromPreset(preset: LabCanvasPreset, mode: LabCanvasMode): ResolvedCanvas {
  return {
    model: structuredClone(preset.model),
    positions: structuredClone(preset.positions),
    load: structuredClone(preset.load),
    readRatio: preset.readRatio,
    durationSec: preset.durationSec,
    canvasMode: mode,
    lockedIds: [...preset.lockedNodeIds],
  };
}

/** Canvas để hiển thị khi chọn template: bản nháp hợp lệ nếu có, nếu không thì starter. */
function resolveCanvas(templateId: string): ResolvedCanvas {
  const draft = readValidDraft(templateId);
  if (draft) {
    const ids = new Set(draft.model.nodes.map((n) => n.id));
    return {
      model: structuredClone(draft.model),
      positions: structuredClone(draft.positions),
      load: structuredClone(draft.load),
      readRatio: draft.readRatio,
      durationSec: draft.durationSec,
      canvasMode: draft.canvasMode,
      lockedIds: presetFor(templateId, draft.canvasMode).lockedNodeIds.filter((id) =>
        ids.has(id)
      ),
    };
  }
  return canvasFromPreset(presetFor(templateId, 'starter'), 'starter');
}

function snapSignature(c: CanvasSnap): string {
  return stableStringify({
    model: c.model,
    positions: c.positions,
    load: c.load,
    readRatio: c.readRatio,
    durationSec: c.durationSec,
  });
}

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || t.isContentEditable;
}

let savedBodyUserSelect: string | null = null;
/** Khoá bôi đen văn bản toàn trang trong lúc kéo-thả. */
function lockBodySelect() {
  if (savedBodyUserSelect === null) savedBodyUserSelect = document.body.style.userSelect;
  document.body.style.userSelect = 'none';
  document.body.style.setProperty('-webkit-user-select', 'none');
}
function unlockBodySelect() {
  if (savedBodyUserSelect === null) return;
  document.body.style.userSelect = savedBodyUserSelect;
  document.body.style.removeProperty('-webkit-user-select');
  savedBodyUserSelect = null;
}

interface WireDragState {
  fromId: NodeId;
  /** Toạ độ con trỏ trong hệ toạ độ board (đã chia boardZoom, tính cả scroll). */
  x: number;
  y: number;
  hoverId: NodeId | null;
  moved: boolean;
}

/** Node dưới điểm (x, y) của board hiển thị (px) — theo hình chữ nhật thật của thẻ, nới 6 px. */
function nodeAtBoardPoint(
  x: number,
  y: number,
  positions: Record<NodeId, PxPos>
): NodeId | null {
  return nodeAtPoint(x, y, positions, 6);
}

/** Trạng thái kéo một node bằng Pointer Events. Toạ độ theo chấm (toạ độ thật). */
interface NodeDragState {
  id: NodeId;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  /** Độ lệch con trỏ so với góc trên-trái thẻ lúc nhấn (px board). */
  grabX: number;
  grabY: number;
  origin: CanvasPos;
  /** Vị trí đã hút vào chấm, đi theo con trỏ. */
  pos: CanvasPos;
  /** Vị trí sẽ đặt khi thả (= pos nếu trống, nếu không là chỗ trống gần nhất). */
  landing: CanvasPos;
  collides: boolean;
  moved: boolean;
}

/** Xem trước vị trí thả khi kéo một thành phần từ palette. */
interface PaletteDropPreview {
  pos: CanvasPos;
  landing: CanvasPos;
  collides: boolean;
}

const samePos = (a: CanvasPos, b: CanvasPos) => a.x === b.x && a.y === b.y;

type ConnectionPlan =
  | { ok: false; tone: 'info' | 'warn'; text: string; existingLinkId?: LinkId }
  | { ok: true; candidate: SystemModel; linkId: LinkId; hint: string };

/* ─────────────────────────── LINK LEGEND ─────────────────────────── */

const LinkLegend: React.FC<{ lang: WorkbenchLang }> = ({ lang }) => {
  const [open, setOpen] = useState(false);
  const rows: { mode: LinkSpec['mode']; color: string; dash?: string }[] = [
    { mode: 'sync', color: 'var(--dts-ink)' },
    { mode: 'async', color: '#7c3aed', dash: '7 5' },
    { mode: 'pull', color: '#7c3aed', dash: '7 5' },
    { mode: 'replicate', color: '#0d9488', dash: '3 4' },
  ];
  return (
    <div className="pointer-events-auto max-w-[19rem] select-none rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] font-mono text-[10.5px] shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1 font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
      >
        <span className="inline-flex items-center gap-1">
          <HelpCircle className="h-3 w-3 shrink-0" />
          {lang === 'en' ? 'Wire legend' : 'Chú giải đường nối'}
        </span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-[var(--dts-line-strong)] px-2.5 py-2">
          {rows.map((r) => (
            <div key={r.mode} className="flex items-start gap-2">
              <svg width="30" height="10" className="mt-0.5 shrink-0" aria-hidden>
                <line
                  x1="1"
                  y1="5"
                  x2="29"
                  y2="5"
                  stroke={r.color}
                  strokeWidth="2"
                  strokeDasharray={r.dash}
                />
              </svg>
              <div className="font-sans leading-snug text-[var(--dts-ink-soft)]">
                <span className="font-mono font-extrabold text-[var(--dts-ink)]">{r.mode}</span>
                {' — '}
                {pick(LINK_MODE_HELP[r.mode], lang)}
              </div>
            </div>
          ))}
          <div className="border-t border-dashed border-[var(--dts-line-strong)] pt-1.5 font-sans leading-snug text-[var(--dts-ink-soft)]">
            <span className="font-mono font-extrabold text-[var(--dts-ink)]">r / w / rw</span>
            {' — '}
            {lang === 'en'
              ? 'which request types flow on the wire (read, write, both).'
              : 'loại request đi qua dây (đọc, ghi, cả hai).'}
          </div>
          <div className="font-sans leading-snug text-[var(--dts-ink-soft)]">
            <span className="font-mono font-extrabold text-[var(--dts-ink)]">miss</span>
            {' — '}
            {lang === 'en'
              ? 'only called when the linked cache misses (cache-aside).'
              : 'chỉ được gọi khi cache liên kết bị miss (cache-aside).'}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

type SelectionState =
  | { kind: 'node'; id: NodeId }
  | { kind: 'link'; id: LinkId }
  | null;

type RightTab = 'inspector' | 'analyzer' | 'grade';

export const SdLabView: React.FC = () => {
  const lang = useWorkbenchStore((s) => s.language);
  const sdExercises = useSdProgress((s) => s.state.exercises);
  const labStarsById = useMemo(() => {
    const out: Record<string, number> = {};
    for (const ch of LAB_CHALLENGES) out[ch.id] = sdExercises[ch.id]?.stars ?? 0;
    return out;
  }, [sdExercises]);
  const recordActivity = useSdProgress((s) => s.recordActivity);
  const markSolutionViewed = useSdProgress((s) => s.markActivitySolutionViewed);

  // Active template ('sandbox' or challenge id)
  const [activeTemplateId, setActiveTemplateId] = useState<string>('lab-01-read-api');
  // Khôi phục bản nháp (nếu có) ngay từ lần mount đầu tiên
  const [initialCanvas] = useState<ResolvedCanvas>(() => resolveCanvas('lab-01-read-api'));
  const [canvasMode, setCanvasMode] = useState<LabCanvasMode>(initialCanvas.canvasMode);

  const activeChallenge: LabChallengeSpec | null = useMemo(
    () => LAB_CHALLENGES.find((c) => c.id === activeTemplateId) ?? null,
    [activeTemplateId]
  );

  // Architecture canvas state
  const [model, setModel] = useState<SystemModel>(initialCanvas.model);
  const [positions, setPositions] = useState<Record<NodeId, CanvasPos>>(initialCanvas.positions);
  const [lockedIds, setLockedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialCanvas.lockedIds)
  );

  // Load & scenario settings (giá trị "canvas" — chỉ dùng trực tiếp ở Sandbox)
  const [loadProfileState, setLoadProfile] = useState<LoadProfile>(initialCanvas.load);
  const [readRatioState, setReadRatio] = useState<number>(initialCanvas.readRatio);
  const [durationSecState, setDurationSec] = useState<number>(initialCanvas.durationSec);

  // Challenge mode: tải do kịch bản của bài quyết định (chỉ đọc), người dùng chọn kịch bản để xem trước
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const activeScenario = useMemo(
    () =>
      activeChallenge
        ? (activeChallenge.scenarios.find((s) => s.id === scenarioId) ??
          activeChallenge.scenarios[0] ??
          null)
        : null,
    [activeChallenge, scenarioId]
  );
  const loadProfile: LoadProfile = activeScenario?.load ?? loadProfileState;
  const readRatio: number = activeScenario?.readRatio ?? readRatioState;
  const durationSec: number = activeScenario?.durationSec ?? durationSecState;
  const scenarioTimeoutMs = activeScenario?.clientTimeoutMs ?? 2000;
  const scenarioEvents = useMemo<TimedEvent[]>(
    () => (activeScenario as { events?: TimedEvent[] } | null)?.events ?? [],
    [activeScenario]
  );

  // UI interaction states
  const [selection, setSelection] = useState<SelectionState>({ kind: 'node', id: 'app' });
  const [rightTab, setRightTab] = useState<RightTab>('inspector');
  const [connectMode, setConnectMode] = useState<boolean>(false);
  const [connectFromId, setConnectFromId] = useState<NodeId | null>(null);
  const [wireDrag, setWireDrag] = useState<WireDragState | null>(null);
  const wireDragRef = useRef<WireDragState | null>(null);
  const wireStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  // Kéo node (Pointer Events) + xem trước vị trí thả khi kéo từ palette (HTML5 DnD)
  const [nodeDrag, setNodeDrag] = useState<NodeDragState | null>(null);
  const nodeDragRef = useRef<NodeDragState | null>(null);
  const [paletteDrop, setPaletteDrop] = useState<PaletteDropPreview | null>(null);
  const paletteKindRef = useRef<PaletteKind | null>(null);
  const [boardZoom, setBoardZoom] = useState<number>(1);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize((cur) =>
        Math.abs(cur.w - width) < 1 && Math.abs(cur.h - height) < 1 ? cur : { w: width, h: height }
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Vị trí đang hiển thị: node đang kéo đi theo con trỏ (chưa ghi vào state/history). */
  const shownPositions = useMemo(() => {
    if (!nodeDrag?.moved || !positions[nodeDrag.id]) return positions;
    return { ...positions, [nodeDrag.id]: nodeDrag.pos };
  }, [nodeDrag, positions]);

  /*
   * Canvas vô hạn: khung board = bao của sơ đồ (theo chấm) + CANVAS_PAD chấm mỗi phía, tự nới khi
   * node ra mép (kể cả sang trái / lên trên — toạ độ thật có thể âm). Bao "dính": chỉ nới ra, không
   * co lại trong lúc chỉnh sửa (tránh giật khung), chỉ co khi đổi bài / nạp preset.
   * Gốc khung `org` luôn là số chấm nguyên → nền chấm khớp đúng bội số DOT của toạ độ thật.
   */
  const stickyBoundsRef = useRef<{ key: string; minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const viewport = useMemo(() => {
    const key = `${activeTemplateId}|${canvasMode}`;
    const pts = Object.values(shownPositions);
    let minX = pts.length ? Math.min(...pts.map((q) => q.x)) : 0;
    let minY = pts.length ? Math.min(...pts.map((q) => q.y)) : 0;
    let maxX = pts.length ? Math.max(...pts.map((q) => q.x + CARD_W_DOTS)) : CARD_W_DOTS;
    let maxY = pts.length ? Math.max(...pts.map((q) => q.y + CARD_H_DOTS)) : CARD_H_DOTS;
    const prev = stickyBoundsRef.current;
    if (prev && prev.key === key) {
      minX = Math.min(minX, prev.minX);
      minY = Math.min(minY, prev.minY);
      maxX = Math.max(maxX, prev.maxX);
      maxY = Math.max(maxY, prev.maxY);
    }
    stickyBoundsRef.current = { key, minX, minY, maxX, maxY };
    const org = { x: minX - CANVAS_PAD, y: minY - CANVAS_PAD };
    // Lấp đầy vùng nhìn (nới sang phải / xuống dưới) để không bao giờ thấy mép board
    const fillW = stageSize.w > 0 ? Math.ceil(stageSize.w / (DOT * boardZoom)) + 1 : 0;
    const fillH = stageSize.h > 0 ? Math.ceil(stageSize.h / (DOT * boardZoom)) + 1 : 0;
    const wDots = Math.max(maxX - minX + CANVAS_PAD * 2, MIN_BOARD_DOTS_W, fillW);
    const hDots = Math.max(maxY - minY + CANVAS_PAD * 2, MIN_BOARD_DOTS_H, fillH);
    return { org, w: wDots * DOT, h: hDots * DOT };
  }, [activeTemplateId, boardZoom, canvasMode, shownPositions, stageSize.h, stageSize.w]);
  const BOARD_W = viewport.w;
  const BOARD_H = viewport.h;
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  /** Góc trên-trái thẻ trên board hiển thị (px, luôn ≥ 0) = (toạ độ thật − gốc khung) × DOT. */
  const viewPositions = useMemo(() => {
    const out: Record<NodeId, PxPos> = {};
    for (const [id, q] of Object.entries(shownPositions)) {
      out[id] = { x: (q.x - viewport.org.x) * DOT, y: (q.y - viewport.org.y) * DOT };
    }
    return out;
  }, [shownPositions, viewport.org.x, viewport.org.y]);

  // Khung nới sang trái / lên trên → bù scroll để nội dung đứng yên trên màn hình
  const prevOrgRef = useRef(viewport.org);
  useLayoutEffect(() => {
    const prevOrg = prevOrgRef.current;
    prevOrgRef.current = viewport.org;
    const el = stageRef.current;
    if (!el) return;
    const dx = prevOrg.x - viewport.org.x;
    const dy = prevOrg.y - viewport.org.y;
    if (dx) el.scrollLeft += dx * DOT * boardZoom;
    if (dy) el.scrollTop += dy * DOT * boardZoom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.org.x, viewport.org.y]);
  const [briefExpanded, setBriefExpanded] = useState<boolean>(true);
  const [hintsShown, setHintsShown] = useState<number>(
    () => useLabDrafts.getState().hints['lab-01-read-api'] ?? 0
  );
  const [pendingPreset, setPendingPreset] = useState<LabCanvasMode | null>(null);
  const [toast, setToast] = useState<{ tone: 'info' | 'warn' | 'ok'; text: string } | null>(
    null
  );

  // Simulation runtime state
  const simRef = useRef<Sim | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [frame, setFrame] = useState<SimFrame | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Challenge grading report
  const [gradeReport, setGradeReport] = useState<LabGradeReport | null>(null);

  // Hydrate user notes store once if needed
  useEffect(() => {
    if (!useUserDataStore.getState().isHydrated) {
      void useUserDataStore.getState().hydrateAll();
    }
  }, []);

  const showToast = useCallback((tone: 'info' | 'warn' | 'ok', text: string) => {
    setToast({ tone, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  /* ───────────── Live canvas ref + Undo / Redo history ───────────── */
  const liveRef = useRef({
    templateId: activeTemplateId,
    canvasMode,
    snap: {
      model,
      positions,
      load: loadProfileState,
      readRatio: readRatioState,
      durationSec: durationSecState,
    } as CanvasSnap,
  });
  useLayoutEffect(() => {
    liveRef.current = {
      templateId: activeTemplateId,
      canvasMode,
      snap: {
        model,
        positions,
        load: loadProfileState,
        readRatio: readRatioState,
        durationSec: durationSecState,
      },
    };
  });

  const pastRef = useRef<CanvasSnap[]>([]);
  const futureRef = useRef<CanvasSnap[]>([]);
  const lastPushRef = useRef<{ key: string; at: number } | null>(null);
  const [histLen, setHistLen] = useState({ past: 0, future: 0 });
  const syncHist = useCallback(
    () => setHistLen({ past: pastRef.current.length, future: futureRef.current.length }),
    []
  );

  /** Ghi lại trạng thái hiện tại TRƯỚC khi đổi. `coalesceKey`: các chỉnh sửa liên tiếp cùng key gộp thành 1 bước. */
  const pushHistory = useCallback(
    (coalesceKey?: string) => {
      const now = Date.now();
      const last = lastPushRef.current;
      if (coalesceKey && last && last.key === coalesceKey && now - last.at < HISTORY_COALESCE_MS) {
        lastPushRef.current = { key: coalesceKey, at: now };
        return;
      }
      pastRef.current.push(liveRef.current.snap);
      if (pastRef.current.length > HISTORY_CAP) pastRef.current.shift();
      futureRef.current = [];
      lastPushRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
      syncHist();
    },
    [syncHist]
  );

  const editLoad = useCallback(
    (next: LoadProfile) => {
      pushHistory('load');
      setLoadProfile(next);
    },
    [pushHistory]
  );
  const editReadRatio = useCallback(
    (next: number) => {
      pushHistory('readRatio');
      setReadRatio(next);
    },
    [pushHistory]
  );

  const resetHistory = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    lastPushRef.current = null;
    syncHist();
  }, [syncHist]);

  const applySnap = useCallback((snap: CanvasSnap) => {
    setModel(snap.model);
    setPositions(snap.positions);
    setLoadProfile(snap.load);
    setReadRatio(snap.readRatio);
    setDurationSec(snap.durationSec);
    setGradeReport(null);
    setConnectFromId(null);
    lastPushRef.current = null;
  }, []);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(liveRef.current.snap);
    applySnap(prev);
    syncHist();
  }, [applySnap, syncHist]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(liveRef.current.snap);
    applySnap(next);
    syncHist();
  }, [applySnap, syncHist]);

  // Phím tắt Undo/Redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (nodeDragRef.current) return; // đang kéo node — thả/huỷ trước đã
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redo, undo]);

  /* ───────────── Draft persistence (per template, debounced) ───────────── */
  const writeDraft = useCallback(() => {
    const { templateId, canvasMode: mode, snap } = liveRef.current;
    const store = useLabDrafts.getState();
    if (mode === 'starter' && snapSignature(snap) === snapSignature(presetFor(templateId, 'starter'))) {
      store.clearDraft(templateId);
      return;
    }
    store.saveDraft(templateId, {
      model: snap.model,
      positions: snap.positions,
      load: snap.load,
      readRatio: snap.readRatio,
      durationSec: snap.durationSec,
      canvasMode: mode,
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(writeDraft, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [
    writeDraft,
    activeTemplateId,
    canvasMode,
    model,
    positions,
    loadProfileState,
    readRatioState,
    durationSecState,
  ]);

  useEffect(() => {
    window.addEventListener('pagehide', writeDraft);
    return () => {
      window.removeEventListener('pagehide', writeDraft);
      writeDraft();
      unlockBodySelect();
    };
  }, [writeDraft]);

  // An toàn: luôn trả lại user-select khi kết thúc/huỷ kéo-thả
  useEffect(() => {
    const restore = () => unlockBodySelect();
    window.addEventListener('dragend', restore);
    window.addEventListener('drop', restore);
    window.addEventListener('blur', restore);
    return () => {
      window.removeEventListener('dragend', restore);
      window.removeEventListener('drop', restore);
      window.removeEventListener('blur', restore);
    };
  }, []);

  // Gợi ý đã mở: chỉ tăng, lưu theo challenge (không reset được để lách phạt XP)
  useEffect(() => {
    if (activeChallenge && hintsShown > 0) {
      useLabDrafts.getState().raiseHints(activeChallenge.id, hintsShown);
    }
  }, [activeChallenge, hintsShown]);

  /* ───────────── Load preset / template helpers ───────────── */
  const applyCanvas = useCallback((c: ResolvedCanvas) => {
    if (nodeDragRef.current) unlockBodySelect();
    nodeDragRef.current = null;
    setNodeDrag(null);
    setPaletteDrop(null);
    setIsPlaying(false);
    setModel(c.model);
    setPositions(c.positions);
    setLockedIds(new Set(c.lockedIds));
    setLoadProfile(c.load);
    setReadRatio(c.readRatio);
    setDurationSec(c.durationSec);
    setCanvasMode(c.canvasMode);
    setConnectMode(false);
    setConnectFromId(null);
    setGradeReport(null);
    const firstEditable = c.model.nodes.find((n) => n.kind !== 'client') ?? c.model.nodes[0];
    setSelection(firstEditable ? { kind: 'node', id: firstEditable.id } : null);
  }, []);

  const applyPreset = useCallback(
    (preset: LabCanvasPreset, modeTag: LabCanvasMode) => {
      pushHistory();
      applyCanvas(canvasFromPreset(preset, modeTag));
    },
    [applyCanvas, pushHistory]
  );

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      writeDraft(); // lưu ngay bản nháp của template đang mở
      setActiveTemplateId(templateId);
      setScenarioId(null);
      setHintsShown(useLabDrafts.getState().hints[templateId] ?? 0);
      resetHistory();
      applyCanvas(resolveCanvas(templateId));
    },
    [applyCanvas, resetHistory, writeDraft]
  );

  /** Yêu cầu nạp preset: hỏi xác nhận nếu canvas hiện tại khác preset (hoặc là mẫu 3★). */
  const requestPreset = useCallback(
    (mode: LabCanvasMode) => {
      const preset = presetFor(activeTemplateId, mode);
      const dirty = snapSignature(liveRef.current.snap) !== snapSignature(preset);
      const needsSolutionWarning =
        mode === 'reference' && !sdExercises[activeTemplateId]?.solutionViewed;
      if (dirty || needsSolutionWarning) {
        setPendingPreset(mode);
        return;
      }
      applyPreset(preset, mode);
    },
    [activeTemplateId, applyPreset, sdExercises]
  );

  const confirmPendingPreset = useCallback(() => {
    const mode = pendingPreset;
    setPendingPreset(null);
    if (!mode) return;
    if (mode === 'reference') markSolutionViewed(activeTemplateId);
    applyPreset(presetFor(activeTemplateId, mode), mode);
  }, [activeTemplateId, applyPreset, markSolutionViewed, pendingPreset]);

  /* ───────────── Rebuild Sim whenever model / load / mix changes ───────────── */
  useEffect(() => {
    simRef.current?.dispose();
    simRef.current = null;

    try {
      validate(model);
      setModelError(null);
    } catch (err) {
      const msg =
        err instanceof SimModelError
          ? `${err.code}: ${err.message}`
          : lang === 'en'
            ? 'Invalid system topology'
            : 'Cấu trúc mô hình chưa hợp lệ';
      setModelError(msg);
      setFrame(null);
      return;
    }

    const scenario: SimScenario = {
      id: `lab/${activeTemplateId}`,
      model,
      durationSec,
      load: loadProfile,
      events: scenarioEvents,
      seed: 2026,
      mix: { readRatio },
      clientTimeoutMs: scenarioTimeoutMs,
      options: { noise: true, maxPackets: 120 },
    };

    const sim = createSim(scenario);
    simRef.current = sim;
    // Run 1s warmup snapshot so static & live metrics populate immediately even when paused
    const targetInitialSec = currentSec > 0.2 ? Math.min(currentSec, durationSec) : 0.5;
    const f = sim.runUntil(targetInitialSec);
    setFrame(f);
    setCurrentSec(f.t);
    // Intentionally rebuild only when structural/scenario inputs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model,
    loadProfile,
    readRatio,
    durationSec,
    scenarioEvents,
    scenarioTimeoutMs,
    activeTemplateId,
    lang,
  ]);

  /* ───────────── Live Playback Interval ───────────── */
  useEffect(() => {
    if (!isPlaying) return;
    const intervalId = window.setInterval(() => {
      const sim = simRef.current;
      if (!sim) return;
      let latest: SimFrame | null = null;
      for (let i = 0; i < speed; i++) {
        if (sim.t >= durationSec - 1e-6) {
          setIsPlaying(false);
          break;
        }
        latest = sim.step();
      }
      if (latest) {
        setFrame(latest);
        setCurrentSec(latest.t);
      }
    }, 100);
    return () => window.clearInterval(intervalId);
  }, [isPlaying, speed, durationSec]);

  const handleScrub = useCallback(
    (nextSec: number) => {
      const sim = simRef.current;
      if (!sim) return;
      const clamped = Math.max(0, Math.min(durationSec, nextSec));
      const maxRecordedSec = Math.max(0, (sim.recorder.length - 1) * DT);
      const f =
        clamped > maxRecordedSec ? sim.runUntil(clamped) : sim.scrub(clamped);
      setFrame(f);
      setCurrentSec(f.t);
    },
    [durationSec]
  );

  const handleResetSim = useCallback(() => {
    setIsPlaying(false);
    const sim = simRef.current;
    if (!sim) return;
    sim.reset();
    const f = sim.runUntil(0.5);
    setFrame(f);
    setCurrentSec(f.t);
  }, []);

  /* ───────────── Grid Placement & Node CRUD ───────────── */
  /** Toạ độ chấm của các node khác (để kiểm tra chồng lấn). */
  const otherPositions = useCallback(
    (exceptId: NodeId | null, from: Record<NodeId, CanvasPos> = liveRef.current.snap.positions) =>
      Object.entries(from)
        .filter(([id]) => id !== exceptId)
        .map(([, p]) => p),
    []
  );

  const addPrimitiveAt = useCallback(
    (kind: PaletteKind, desired?: CanvasPos) => {
      const others = Object.values(positions);
      // Thả vào board: chỗ trống gần điểm thả nhất; nhấn palette: bên phải sơ đồ, quanh tâm dọc
      const finalPos = desired ? findFreeSpot(desired, others) : findPlacementForNew(others);

      const existingIds = new Set(model.nodes.map((n) => n.id));
      let idx = model.nodes.filter((n) => n.kind === kind).length + 1;
      const baseSlug = kind === 'rate-limiter' ? 'rl' : kind;
      let newId = idx === 1 && !existingIds.has(baseSlug) ? baseSlug : `${baseSlug}-${idx}`;
      while (existingIds.has(newId)) {
        idx += 1;
        newId = `${baseSlug}-${idx}`;
      }

      const meta = KIND_META_MAP[kind];
      const countSameKind = model.nodes.filter((n) => n.kind === kind).length;
      const suffix = countSameKind > 0 ? ` ${countSameKind + 1}` : '';
      const newNode = makeNode(kind, {
        id: newId,
        label: {
          vi: `${meta.label.vi}${suffix}`,
          en: `${meta.label.en}${suffix}`,
        },
        zone: kind === 'client' ? 'internet' : 'az-a',
      });

      pushHistory();
      setModel((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
        routes: {
          ...(prev.routes ?? {}),
          [newId]: kind === 'client' ? 'split' : defaultRoute(kind),
        },
      }));
      setPositions((prev) => ({
        ...prev,
        [newId]: finalPos,
      }));
      setSelection({ kind: 'node', id: newId });
      setRightTab('inspector');
      setGradeReport(null);
    },
    [model.nodes, positions, pushHistory]
  );

  /** Đặt node tới vị trí chấm `dest` (đã đảm bảo không chồng lấn). Một bước history; bỏ qua nếu không đổi. */
  const moveNodeTo = useCallback(
    (nodeId: NodeId, dest: CanvasPos, coalesceKey?: string) => {
      const cur = liveRef.current.snap.positions[nodeId];
      if (!cur || samePos(cur, dest)) return;
      pushHistory(coalesceKey);
      setPositions((prev) => (prev[nodeId] ? { ...prev, [nodeId]: dest } : prev));
    },
    [pushHistory]
  );

  const deleteNode = useCallback(
    (nodeId: NodeId): boolean => {
      if (lockedIds.has(nodeId)) {
        showToast(
          'warn',
          lang === 'en'
            ? 'This entry node is locked and cannot be deleted.'
            : 'Thành phần gốc này được khoá cố định để giữ nguồn phát tải.'
        );
        return false;
      }
      // Prevent deleting the very last client node
      const targetNode = model.nodes.find((n) => n.id === nodeId);
      if (
        targetNode?.kind === 'client' &&
        model.nodes.filter((n) => n.kind === 'client').length <= 1
      ) {
        showToast(
          'warn',
          lang === 'en'
            ? 'At least one Client node is required in the model.'
            : 'Mô hình cần ít nhất một node Client để phát lưu lượng.'
        );
        return false;
      }

      pushHistory();
      setModel((prev) => {
        const nextRoutes = { ...(prev.routes ?? {}) };
        delete nextRoutes[nodeId];
        return {
          nodes: prev.nodes.filter((n) => n.id !== nodeId),
          links: prev.links
            .filter((l) => l.from !== nodeId && l.to !== nodeId)
            .map((l) => (l.onMissOf === nodeId ? { ...l, onMissOf: undefined } : l)),
          routes: nextRoutes,
        };
      });
      setPositions((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      if (selection?.kind === 'node' && selection.id === nodeId) {
        setSelection(null);
      }
      if (connectFromId === nodeId) {
        setConnectFromId(null);
      }
      setGradeReport(null);
      return true;
    },
    [connectFromId, lang, lockedIds, model.nodes, pushHistory, selection, showToast]
  );

  /* ───────────── Connect Mode & Link CRUD ───────────── */
  /**
   * Tính toán (thuần, không side-effect) kết quả khi nối `fromId → toId`:
   * hợp lệ (kèm model ứng viên + cấu hình mặc định thông minh) hoặc lý do bị từ chối.
   * Dùng chung cho tô sáng đích khi kéo dây và cho việc tạo kết nối thật.
   */
  const planConnection = useCallback(
    (fromId: NodeId, toId: NodeId): ConnectionPlan | null => {
      const fromNode = model.nodes.find((n) => n.id === fromId);
      const toNode = model.nodes.find((n) => n.id === toId);
      if (!fromNode || !toNode) return null;

      if (fromId === toId) {
        return {
          ok: false,
          tone: 'warn',
          text:
            lang === 'en'
              ? 'Cannot connect a component to itself.'
              : 'Không thể nối một thành phần vào chính nó.',
        };
      }

      const existing = model.links.find((l) => l.from === fromId && l.to === toId);
      if (existing) {
        return {
          ok: false,
          tone: 'info',
          existingLinkId: existing.id,
          text:
            lang === 'en'
              ? `Link ${fromId} → ${toId} already exists.`
              : `Kết nối ${fromNode.label.vi} → ${toNode.label.vi} đã tồn tại.`,
        };
      }

      if (toNode.kind === 'client') {
        return {
          ok: false,
          tone: 'warn',
          text:
            lang === 'en'
              ? 'A Client is a traffic source — it cannot be a link target.'
              : 'Client là nguồn phát tải nên không thể làm đích của kết nối.',
        };
      }

      // Smart defaults based on source & target primitive kinds
      let mode: LinkSpec['mode'] = 'sync';
      let carries: LinkSpec['carries'] = 'rw';
      let timeoutMs: number | undefined = 1000;
      let onMissOf: NodeId | undefined;
      let smartHintVi = '';
      let smartHintEn = '';

      if (fromNode.kind === 'queue' && toNode.kind === 'worker') {
        mode = 'pull';
        timeoutMs = undefined;
        smartHintVi = 'Đã tự động đặt chế độ "pull" (Worker kéo bản tin từ Queue).';
        smartHintEn = 'Auto-configured "pull" mode (Worker pulls messages from Queue).';
      } else if (toNode.kind === 'queue') {
        mode = 'async';
        timeoutMs = undefined;
        const hasOtherReadLink = model.links.some(
          (l) => l.from === fromId && l.mode === 'sync' && l.carries !== 'w'
        );
        if (hasOtherReadLink) {
          carries = 'w';
          smartHintVi = 'Đã đặt kết nối "async · chỉ ghi (w)" vào Queue.';
          smartHintEn = 'Auto-configured "async · writes only (w)" into Queue.';
        } else {
          smartHintVi = 'Đã đặt kết nối bất đồng bộ "async" vào Queue.';
          smartHintEn = 'Auto-configured "async" enqueue link.';
        }
      } else if (
        (fromNode.kind === 'sql' && toNode.kind === 'sql') ||
        (fromNode.kind === 'nosql' && toNode.kind === 'nosql')
      ) {
        mode = 'replicate';
        carries = 'w';
        timeoutMs = undefined;
        smartHintVi = 'Đã tạo đường nhân bản dữ liệu (mode: replicate).';
        smartHintEn = 'Created database replication link (mode: replicate).';
      } else if (toNode.kind === 'cache' || toNode.kind === 'cdn') {
        timeoutMs = 200;
      }

      // Detect Cache-Aside pattern: if `from` already connects directly to a cache (which itself has no DB child),
      // auto-set `onMissOf` when wiring `from -> sql/nosql`!
      let updatedPrevLinks = [...model.links];
      if (toNode.kind === 'sql' || toNode.kind === 'nosql') {
        const siblingCacheLink = model.links.find((l) => {
          if (l.from !== fromId) return false;
          const target = model.nodes.find((n) => n.id === l.to);
          if (!target || target.kind !== 'cache') return false;
          const cacheHasOut = model.links.some((cl) => cl.from === target.id);
          return !cacheHasOut;
        });
        if (siblingCacheLink) {
          onMissOf = siblingCacheLink.to;
          updatedPrevLinks = updatedPrevLinks.map((l) =>
            l.id === siblingCacheLink.id ? { ...l, carries: 'r' } : l
          );
          smartHintVi = `Đã tự động cấu hình Cache-Aside: chỉ đọc DB khi ${siblingCacheLink.to} miss (+ ghi).`;
          smartHintEn = `Auto-configured Cache-Aside: queries DB only on ${siblingCacheLink.to} miss (+ writes).`;
        }
      } else if (toNode.kind === 'cache') {
        const siblingDbLink = model.links.find((l) => {
          if (l.from !== fromId) return false;
          const target = model.nodes.find((n) => n.id === l.to);
          return target?.kind === 'sql' || target?.kind === 'nosql';
        });
        if (siblingDbLink) {
          carries = 'r';
          updatedPrevLinks = updatedPrevLinks.map((l) =>
            l.id === siblingDbLink.id ? { ...l, onMissOf: toId } : l
          );
          smartHintVi = `Đã tự động cấu hình Cache-Aside giữa ${toId} và ${siblingDbLink.to}.`;
          smartHintEn = `Auto-configured Cache-Aside between ${toId} and ${siblingDbLink.to}.`;
        }
      }

      // If user wires `cache -> db` (Read-Through), clear any stale `onMissOf === cache.id`
      if (fromNode.kind === 'cache' && (toNode.kind === 'sql' || toNode.kind === 'nosql')) {
        updatedPrevLinks = updatedPrevLinks.map((l) =>
          l.onMissOf === fromId ? { ...l, onMissOf: undefined } : l
        );
      }

      const existingLinkIds = new Set(model.links.map((l) => l.id));
      let linkId = `${fromId}-${toId}`;
      let suffix = 2;
      while (existingLinkIds.has(linkId)) {
        linkId = `${fromId}-${toId}-${suffix++}`;
      }

      const newLink: LinkSpec = {
        id: linkId,
        from: fromId,
        to: toId,
        mode,
        carries,
        ...(timeoutMs !== undefined ? { timeoutMs } : {}),
        ...(onMissOf !== undefined ? { onMissOf } : {}),
      };

      const candidate: SystemModel = {
        ...model,
        links: [...updatedPrevLinks, newLink],
      };

      try {
        validate(candidate);
      } catch (err) {
        if (err instanceof SimModelError && err.code === 'CYCLE') {
          const cyclePath = err.path ? ` (${err.path.join(' → ')})` : '';
          return {
            ok: false,
            tone: 'warn',
            text:
              lang === 'en'
                ? `Cannot add link: synchronous cycle detected${cyclePath}. Use replicate mode or reverse direction.`
                : `Không thể nối kết nối: phát hiện chu trình đồng bộ${cyclePath}. Hãy chọn hướng khác hoặc dùng kết nối nhân bản (replicate).`,
          };
        }
        return {
          ok: false,
          tone: 'warn',
          text:
            err instanceof Error
              ? err.message
              : lang === 'en'
                ? 'Invalid connection.'
                : 'Kết nối không hợp lệ.',
        };
      }

      return {
        ok: true,
        candidate,
        linkId,
        hint: lang === 'en' ? smartHintEn : smartHintVi,
      };
    },
    [lang, model]
  );

  const createConnection = useCallback(
    (fromId: NodeId, toId: NodeId) => {
      const plan = planConnection(fromId, toId);
      if (!plan) return;
      if (!plan.ok) {
        showToast(plan.tone, plan.text);
        if (plan.existingLinkId) {
          setSelection({ kind: 'link', id: plan.existingLinkId });
          setRightTab('inspector');
        }
        return;
      }
      pushHistory();
      setModel(plan.candidate);
      setSelection({ kind: 'link', id: plan.linkId });
      setRightTab('inspector');
      setGradeReport(null);
      if (plan.hint) showToast('ok', plan.hint);
    },
    [planConnection, pushHistory, showToast]
  );

  /* ───────────── Wire dragging (Pointer Events: mouse + touch + pen) ───────────── */
  const pointerToBoard = useCallback(
    (clientX: number, clientY: number) => {
      const board = boardRef.current;
      const rect = board?.getBoundingClientRect();
      if (!board || !rect) return { x: 0, y: 0 };
      // rect (viền ngoài) đã phản ánh scroll + transform scale → chia cho zoom, rồi trừ độ dày viền
      // (clientLeft/Top là px chưa scale) để ra toạ độ của các phần tử absolute bên trong board.
      const z = zoomRef.current;
      return {
        x: (clientX - rect.left) / z - board.clientLeft,
        y: (clientY - rect.top) / z - board.clientTop,
      };
    },
    []
  );

  /** Con trỏ → toạ độ px THẬT (không phụ thuộc gốc khung, ổn định khi board nới). */
  const pointerToReal = useCallback(
    (clientX: number, clientY: number) => {
      const b = pointerToBoard(clientX, clientY);
      const { org } = viewportRef.current;
      return { x: b.x + org.x * DOT, y: b.y + org.y * DOT };
    },
    [pointerToBoard]
  );

  /* ───────────── Node dragging (Pointer Events: mouse + touch + pen, hút vào chấm) ───────────── */
  const cancelNodeDrag = useCallback((): boolean => {
    const cur = nodeDragRef.current;
    if (!cur) return false;
    nodeDragRef.current = null;
    setNodeDrag(null);
    if (cur.moved) unlockBodySelect();
    return cur.moved;
  }, []);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, nodeId: NodeId) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (connectMode || wireDragRef.current || nodeDragRef.current) return;
      const t = e.target as HTMLElement;
      if (t.closest('button,input,select,textarea,a,[data-no-drag]')) return;
      const cur = liveRef.current.snap.positions[nodeId];
      if (!cur) return;
      const r = pointerToReal(e.clientX, e.clientY);
      nodeDragRef.current = {
        id: nodeId,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        grabX: r.x - cur.x * DOT,
        grabY: r.y - cur.y * DOT,
        origin: cur,
        pos: cur,
        landing: cur,
        collides: false,
        moved: false,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture không khả dụng */
      }
    },
    [connectMode, pointerToReal]
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const cur = nodeDragRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      if (!cur.moved) {
        // Ngưỡng 4 px trước khi bắt đầu kéo → nhấn nhẹ vẫn là "chọn"
        if (Math.hypot(e.clientX - cur.startClientX, e.clientY - cur.startClientY) < 4) return;
        lockBodySelect();
        setSelection({ kind: 'node', id: cur.id });
      }
      const r = pointerToReal(e.clientX, e.clientY);
      const pos = { x: snapToDot(r.x - cur.grabX), y: snapToDot(r.y - cur.grabY) };
      if (cur.moved && samePos(pos, cur.pos)) return;
      const others = otherPositions(cur.id);
      const collides = collidesAny(pos, others);
      const landing = collides ? findFreeSpot(pos, others) : pos;
      const next: NodeDragState = { ...cur, pos, landing, collides, moved: true };
      nodeDragRef.current = next;
      setNodeDrag(next);
    },
    [otherPositions, pointerToReal]
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const cur = nodeDragRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      nodeDragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!cur.moved) return; // chỉ là nhấn → onClick xử lý chọn
      setNodeDrag(null);
      unlockBodySelect();
      // Thả vào chỗ chồng lấn → hút vào chỗ trống gần nhất (tính lại theo trạng thái mới nhất)
      const others = otherPositions(cur.id);
      const landing = collidesAny(cur.pos, others) ? findFreeSpot(cur.pos, others) : cur.pos;
      moveNodeTo(cur.id, landing);
    },
    [moveNodeTo, otherPositions]
  );

  const handleNodeLostCapture = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const cur = nodeDragRef.current;
      if (cur && cur.pointerId === e.pointerId) cancelNodeDrag();
    },
    [cancelNodeDrag]
  );

  /* ───────────── Palette → board (HTML5 DnD): vị trí thả theo chấm ───────────── */
  const paletteDropAt = useCallback(
    (clientX: number, clientY: number): PaletteDropPreview => {
      const r = pointerToReal(clientX, clientY);
      // Tâm thẻ nằm dưới con trỏ
      const pos = { x: snapToDot(r.x - CARD_W / 2), y: snapToDot(r.y - CARD_H / 2) };
      const others = otherPositions(null);
      const collides = collidesAny(pos, others);
      return { pos, landing: collides ? findFreeSpot(pos, others) : pos, collides };
    },
    [otherPositions, pointerToReal]
  );

  const handleBoardDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!Array.from(e.dataTransfer.types).includes('application/x-sd-palette')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      const next = paletteDropAt(e.clientX, e.clientY);
      setPaletteDrop((cur) =>
        cur && samePos(cur.pos, next.pos) && samePos(cur.landing, next.landing) ? cur : next
      );
    },
    [paletteDropAt]
  );

  const handleBoardDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const to = e.relatedTarget;
    if (to instanceof Node && boardRef.current?.contains(to)) return;
    setPaletteDrop(null);
  }, []);

  const handleBoardDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const kind = (e.dataTransfer.getData('application/x-sd-palette') ||
        paletteKindRef.current) as PaletteKind | null;
      setPaletteDrop(null);
      if (!kind || !(kind in KIND_META_MAP)) return;
      e.preventDefault();
      paletteKindRef.current = null;
      addPrimitiveAt(kind, paletteDropAt(e.clientX, e.clientY).pos);
    },
    [addPrimitiveAt, paletteDropAt]
  );

  const cancelWireDrag = useCallback(() => {
    if (!wireDragRef.current) return;
    wireDragRef.current = null;
    setWireDrag(null);
    unlockBodySelect();
  }, []);

  const handleWirePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>, fromId: NodeId) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture không khả dụng — vẫn hoạt động nhờ window listeners */
      }
      const { x, y } = pointerToBoard(e.clientX, e.clientY);
      const next: WireDragState = { fromId, x, y, hoverId: null, moved: false };
      wireDragRef.current = next;
      wireStartRef.current = { x: e.clientX, y: e.clientY };
      setWireDrag(next);
      lockBodySelect();
    },
    [pointerToBoard]
  );

  const handleWirePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const cur = wireDragRef.current;
      if (!cur) return;
      const { x, y } = pointerToBoard(e.clientX, e.clientY);
      const start = wireStartRef.current;
      const moved =
        cur.moved ||
        (start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5 : true);
      const inside = x >= 0 && y >= 0 && x <= BOARD_W && y <= BOARD_H;
      const next: WireDragState = {
        ...cur,
        x,
        y,
        moved,
        hoverId: moved && inside ? nodeAtBoardPoint(x, y, viewPositions) : null,
      };
      wireDragRef.current = next;
      setWireDrag(next);
    },
    [BOARD_H, BOARD_W, pointerToBoard, viewPositions]
  );

  const handleWirePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const cur = wireDragRef.current;
      if (!cur) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const { x, y } = pointerToBoard(e.clientX, e.clientY);
      cancelWireDrag();
      if (!cur.moved) {
        // Nhấn nhẹ vào tay nối → chuyển sang luồng "nhấn chọn đích"
        setConnectMode(true);
        setConnectFromId(cur.fromId);
        setSelection({ kind: 'node', id: cur.fromId });
        return;
      }
      const inside = x >= 0 && y >= 0 && x <= BOARD_W && y <= BOARD_H;
      const targetId = inside ? nodeAtBoardPoint(x, y, viewPositions) : null;
      if (!targetId) return; // thả ra ngoài vùng trống = huỷ
      createConnection(cur.fromId, targetId);
    },
    [BOARD_H, BOARD_W, cancelWireDrag, createConnection, pointerToBoard, viewPositions]
  );

  // Node đang được rê chuột tới trong luồng "nhấn nguồn → nhấn đích" (connect mode)
  const [connectHoverId, setConnectHoverId] = useState<NodeId | null>(null);
  useEffect(() => {
    if (!connectMode || !connectFromId) setConnectHoverId(null);
  }, [connectMode, connectFromId]);

  // Nguồn/đích đang nối — gộp kéo dây (drag) và nhấn chọn (click-to-connect)
  const linkingFromId: NodeId | null =
    wireDrag?.fromId ?? (connectMode ? connectFromId : null);
  const linkingHoverId: NodeId | null = wireDrag
    ? wireDrag.hoverId
    : connectMode && connectFromId
      ? connectHoverId
      : null;

  // Trạng thái hợp lệ của node đang được rê tới khi nối dây
  const wireHoverPlan = useMemo(() => {
    if (!linkingFromId || !linkingHoverId) return null;
    return planConnection(linkingFromId, linkingHoverId);
  }, [planConnection, linkingFromId, linkingHoverId]);

  // Tính trước node nào nối được để tô sáng đích hợp lệ / làm mờ đích không hợp lệ
  const linkTargetOk = useMemo(() => {
    if (!linkingFromId) return null;
    const map: Record<NodeId, boolean> = {};
    for (const n of model.nodes) {
      if (n.id === linkingFromId) continue;
      map[n.id] = planConnection(linkingFromId, n.id)?.ok === true;
    }
    return map;
  }, [linkingFromId, model.nodes, planConnection]);

  // Kiểu kết nối sẽ được tạo (hiển thị trên nhãn "Thả để nối")
  const wireHoverMode = useMemo(() => {
    if (!wireHoverPlan?.ok) return null;
    return wireHoverPlan.candidate.links.find((l) => l.id === wireHoverPlan.linkId)?.mode ?? null;
  }, [wireHoverPlan]);

  const updateNode = useCallback(
    (nodeId: NodeId, mutator: (n: NodeSpec) => NodeSpec) => {
      pushHistory(`node:${nodeId}`);
      setModel((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? mutator(structuredClone(n)) : n)),
      }));
      setGradeReport(null);
    },
    [pushHistory]
  );

  const updateNodeRoute = useCallback((nodeId: NodeId, route: RouteMode) => {
    pushHistory(`route:${nodeId}`);
    setModel((prev) => ({
      ...prev,
      routes: {
        ...(prev.routes ?? {}),
        [nodeId]: route,
      },
    }));
    setGradeReport(null);
  }, [pushHistory]);

  const updateLink = useCallback(
    (linkId: LinkId, mutator: (l: LinkSpec) => LinkSpec) => {
      const nextLinks = model.links.map((l) =>
        l.id === linkId ? mutator(structuredClone(l)) : l
      );
      const candidate: SystemModel = { ...model, links: nextLinks };
      try {
        validate(candidate);
      } catch (err) {
        if (err instanceof SimModelError && err.code === 'CYCLE') {
          showToast(
            'warn',
            lang === 'en'
              ? 'Cannot switch link mode: this would create a synchronous cycle.'
              : 'Không thể đổi chế độ kết nối vì sẽ tạo ra chu trình đồng bộ.'
          );
          return;
        }
      }
      pushHistory(`link:${linkId}`);
      setModel(candidate);
      setGradeReport(null);
    },
    [lang, model, pushHistory, showToast]
  );

  const deleteLink = useCallback(
    (linkId: LinkId) => {
      pushHistory();
      setModel((prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== linkId),
      }));
      if (selection?.kind === 'link' && selection.id === linkId) {
        setSelection(null);
      }
      setGradeReport(null);
    },
    [pushHistory, selection]
  );

  // Phím Delete / Backspace xoá node hoặc kết nối đang chọn (có history → Ctrl/Cmd+Z để hoàn tác)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (isEditableTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"],[role="alertdialog"]')) {
        return;
      }
      if (pendingPreset !== null || wireDragRef.current || !selection) return;
      e.preventDefault();
      const undoHint =
        lang === 'en'
          ? ` Press ${navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+Z to undo.`
          : ` Nhấn ${navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+Z để hoàn tác.`;
      if (selection.kind === 'node') {
        const node = model.nodes.find((n) => n.id === selection.id);
        if (!node) return;
        if (deleteNode(node.id)) {
          showToast(
            'info',
            (lang === 'en' ? `Deleted “${node.label.en}”.` : `Đã xoá “${node.label.vi}”.`) + undoHint
          );
        }
      } else if (selection.kind === 'link') {
        if (!model.links.some((l) => l.id === selection.id)) return;
        deleteLink(selection.id);
        showToast('info', (lang === 'en' ? 'Deleted link.' : 'Đã xoá kết nối.') + undoHint);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteLink, deleteNode, lang, model.links, model.nodes, pendingPreset, selection, showToast]);

  /*
   * Escape: huỷ kéo dây → thoát chế độ nối → bỏ chọn. Bắt ở pha capture trên `window` và chặn
   * lan truyền khi Lab thực sự "tiêu thụ" phím, để Window (device-layout) không thoát Fullscreen.
   * Chỉ áp dụng khi tương tác gần nhất nằm trong Phòng Lab; nếu không còn gì để huỷ thì để Esc đi tiếp.
   */
  const labRootRef = useRef<HTMLDivElement | null>(null);
  const labActiveRef = useRef(false);
  const escStateRef = useRef({ selection, connectMode, connectFromId });
  escStateRef.current = { selection, connectMode, connectFromId };
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      labActiveRef.current = Boolean(
        labRootRef.current && e.target instanceof Node && labRootRef.current.contains(e.target)
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !labActiveRef.current) return;
      if (isEditableTarget(e.target)) return; // App shell đã chặn Esc trong ô nhập
      // Esc trong hộp thoại / bộ chọn bài Lab do chính hộp thoại đó xử lý (đóng nó), không bỏ chọn canvas
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"],[role="alertdialog"]')) {
        return;
      }
      const st = escStateRef.current;
      let consumed = false;
      if (nodeDragRef.current?.moved) {
        // Huỷ kéo node → trả về vị trí cũ (chưa ghi vào state nên chỉ cần bỏ trạng thái kéo)
        nodeDragRef.current = null;
        setNodeDrag(null);
        unlockBodySelect();
        consumed = true;
      } else if (wireDragRef.current) {
        wireDragRef.current = null;
        setWireDrag(null);
        unlockBodySelect();
        consumed = true;
      } else if (st.connectMode || st.connectFromId) {
        setConnectFromId(null);
        setConnectMode(false);
        consumed = true;
      } else if (st.selection) {
        setSelection(null);
        consumed = true;
      }
      if (consumed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  // Phím mũi tên: dịch node đang chọn 1 chấm (Shift = 5 chấm), không chồng lên node khác
  const nudgeStateRef = useRef({ selection, pendingPreset });
  nudgeStateRef.current = { selection, pendingPreset };
  useEffect(() => {
    const DIRS: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      if (!dir || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!labActiveRef.current || isEditableTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"],[role="alertdialog"],[role="slider"]')) {
        return;
      }
      const { selection: sel, pendingPreset: pending } = nudgeStateRef.current;
      if (pending !== null || wireDragRef.current || nodeDragRef.current) return;
      if (sel?.kind !== 'node') return;
      const cur = liveRef.current.snap.positions[sel.id];
      if (!cur) return;
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const next = nudgePosition(cur, dir[0] * step, dir[1] * step, otherPositions(sel.id));
      if (next) moveNodeTo(sel.id, next, `nudge:${sel.id}`);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveNodeTo, otherPositions]);

  /* ───────────── Viewport: Ctrl/Cmd + wheel zoom, drag-to-pan, fit ───────────── */
  const zoomRef = useRef(boardZoom);
  zoomRef.current = boardZoom;
  /** Điểm neo khi zoom: giữ điểm board (bx, by) nằm dưới toạ độ màn hình (cx, cy). */
  const zoomAnchorRef = useRef<{ bx: number; by: number; cx: number; cy: number } | null>(null);

  const zoomAt = useCallback((nextZoom: number, clientX?: number, clientY?: number) => {
    const z = zoomRef.current;
    const z2 = clampZoom(nextZoom);
    if (z2 === z) return;
    const board = boardRef.current;
    const stage = stageRef.current;
    if (board && stage) {
      const r = board.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const cx = clientX ?? sr.left + sr.width / 2;
      const cy = clientY ?? sr.top + sr.height / 2;
      zoomAnchorRef.current = { bx: (cx - r.left) / z, by: (cy - r.top) / z, cx, cy };
    }
    setBoardZoom(z2);
  }, []);

  // Sau khi zoom đã render: cuộn để điểm neo đứng yên dưới con trỏ
  useLayoutEffect(() => {
    const a = zoomAnchorRef.current;
    const board = boardRef.current;
    const stage = stageRef.current;
    if (!a || !board || !stage) return;
    zoomAnchorRef.current = null;
    const r = board.getBoundingClientRect();
    stage.scrollLeft += r.left + a.bx * boardZoom - a.cx;
    stage.scrollTop += r.top + a.by * boardZoom - a.cy;
  }, [boardZoom]);

  // Ctrl/Cmd + cuộn chuột (và pinch trên trackpad — trình duyệt gửi wheel kèm ctrlKey)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dy = Math.max(-120, Math.min(120, e.deltaY * unit));
      zoomAt(zoomRef.current * Math.exp(-dy * 0.0025), e.clientX, e.clientY);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Vừa khung: zoom + cuộn để toàn bộ sơ đồ nằm gọn giữa vùng nhìn
  const fitToContent = useCallback(() => {
    const stage = stageRef.current;
    const pts = Object.values(positions);
    if (!stage) return;
    const minX = pts.length ? Math.min(...pts.map((p) => p.x)) : 0;
    const maxX = pts.length ? Math.max(...pts.map((p) => p.x + CARD_W_DOTS)) : CARD_W_DOTS;
    const minY = pts.length ? Math.min(...pts.map((p) => p.y)) : 0;
    const maxY = pts.length ? Math.max(...pts.map((p) => p.y + CARD_H_DOTS)) : CARD_H_DOTS;
    const pad = 3; // ~nửa ô lưới cũ lề mỗi phía (chấm)
    const wPx = (maxX - minX + pad * 2) * DOT;
    const hPx = (maxY - minY + pad * 2) * DOT;
    const availW = stage.clientWidth - 32;
    const availH = stage.clientHeight - 32;
    const z = clampZoom(Math.min(1, availW / wPx, availH / hPx));
    zoomAnchorRef.current = null;
    setBoardZoom(z);
    requestAnimationFrame(() => {
      const board = boardRef.current;
      if (!board || !stageRef.current) return;
      const s = stageRef.current;
      const br = board.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      const { org } = viewportRef.current;
      const centerX = (board.clientLeft + ((minX + maxX) / 2 - org.x) * DOT) * z;
      const centerY = (board.clientTop + ((minY + maxY) / 2 - org.y) * DOT) * z;
      s.scrollLeft += br.left + centerX - (sr.left + sr.width / 2);
      s.scrollTop += br.top + centerY - (sr.top + sr.height / 2);
    });
  }, [positions]);

  // Tự căn khung khi đổi bài / tải preset
  const fitRef = useRef(fitToContent);
  fitRef.current = fitToContent;
  useEffect(() => {
    const id = requestAnimationFrame(() => fitRef.current());
    return () => cancelAnimationFrame(id);
  }, [activeTemplateId, canvasMode]);

  // Kéo trên vùng trống của board để di chuyển (pan) khung nhìn
  const panRef = useRef<{ x: number; y: number; sl: number; st: number; moved: boolean; id: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const handleStagePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddle = e.button === 1;
    if (e.button !== 0 && !isMiddle) return;
    if (e.pointerType === 'touch') return; // cảm ứng: dùng cuộn gốc của trình duyệt
    const t = e.target as HTMLElement;
    if (!isMiddle && t.closest('[data-lab-node],button,input,select,textarea,a,[data-no-pan]')) return;
    if (connectMode && !isMiddle) return;
    const s = stageRef.current;
    if (!s) return;
    panRef.current = { x: e.clientX, y: e.clientY, sl: s.scrollLeft, st: s.scrollTop, moved: false, id: e.pointerId };
    if (isMiddle) e.preventDefault();
  }, [connectMode]);
  const handleStagePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    const s = stageRef.current;
    if (!p || !s || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      p.moved = true;
      setIsPanning(true);
      lockBodySelect();
      try {
        s.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    s.scrollLeft = p.sl - dx;
    s.scrollTop = p.st - dy;
  }, []);
  const endPan = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const p = panRef.current;
    if (!p || p.id !== e.pointerId) return;
    panRef.current = null;
    if (p.moved) {
      setIsPanning(false);
      unlockBodySelect();
      try {
        stageRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  }, []);

  /* ───────────── Live Diagnostics & Wires ───────────── */
  const wires = useMemo(
    () => computeOrthogonalWires(model.links, viewPositions),
    [model.links, viewPositions]
  );

  const staticCostPerHour = useMemo(
    () => computeModelStaticCostPerHour(model),
    [model]
  );

  const spofs = useMemo(() => {
    if (modelError) return [];
    return findSpofs(model);
  }, [model, modelError]);

  const errorSpofs = useMemo(
    () => spofs.filter((s) => s.severity === 'error'),
    [spofs]
  );

  const warnings = useMemo(() => {
    if (modelError) return [];
    return structuralWarnings(model, frame ?? undefined);
  }, [model, frame, modelError]);

  /** Ngõ cụt / dữ liệu không tới nơi lưu trữ — cùng luật với dòng "integrity" khi chấm. */
  const integrityIssues = useMemo(() => {
    if (modelError) return [];
    return activeChallenge
      ? checkLabIntegrity(activeChallenge, model)
      : checkDataFlowIntegrity(model, { readRatio });
  }, [model, modelError, activeChallenge, readRatio]);

  const bottleneck = useMemo(() => {
    if (modelError || !frame || model.nodes.length <= 1) return null;
    try {
      return findBottleneck(model, frame);
    } catch {
      return null;
    }
  }, [model, frame, modelError]);

  const sustainable = useMemo(() => {
    if (modelError || !frame) return { rps: Number.POSITIVE_INFINITY, limitedBy: '' };
    return maxSustainableRps(model, frame);
  }, [model, frame, modelError]);

  /* ───────────── Challenge Grading & Notes Persistence ───────────── */
  const handleGradeDesign = useCallback(() => {
    if (!activeChallenge) return;
    const report = gradeLabChallenge(activeChallenge, model);
    setGradeReport(report);
    setRightTab('grade');

    const res = recordActivity({
      activityId: activeChallenge.id,
      kind: 'design-constraint',
      xpBase: activeChallenge.xp,
      score: report.score,
      stars: report.stars,
      passed: report.passed,
      hintsUsed: hintsShown,
      solutionViewed: canvasMode === 'reference',
    });

    if (report.passed) {
      showToast(
        'ok',
        lang === 'en'
          ? `Design passed (${report.stars}★ · ${report.score}/100)${res.xp > 0 ? ` · +${res.xp} XP` : ''}!`
          : `Thiết kế đạt yêu cầu (${report.stars}★ · ${report.score}/100)${res.xp > 0 ? ` · +${res.xp} XP` : ''}!`
      );
    } else {
      showToast(
        'info',
        lang === 'en'
          ? 'Evaluated against all constraints. Review the pass/fail table on the right.'
          : 'Đã chấm thiết kế theo các ràng buộc. Xem chi tiết bảng đạt/chưa đạt ở cột phải.'
      );
    }
  }, [activeChallenge, canvasMode, hintsShown, lang, model, recordActivity, showToast]);

  const handleSaveToNotes = useCallback(async () => {
    const titleBase = activeChallenge
      ? `${activeChallenge.code}: ${pick(activeChallenge.title, lang)}`
      : lang === 'en'
        ? 'Free Architecture Sandbox'
        : 'Sandbox Kiến trúc Tự do';
    const targetId = `sd-lab-${activeTemplateId}`;
    const targetTitle = `[SD Lab] ${titleBase}`;

    const kpiOffered = frame ? Math.round(frame.metrics.offeredRps) : 0;
    const kpiGoodput = frame ? Math.round(frame.metrics.goodputRps) : 0;
    const kpiP99 = frame ? Math.round(frame.metrics.latency.p99) : 0;
    const kpiErr = frame ? (frame.metrics.errorRate * 100).toFixed(2) : '0.00';
    const costVal = (frame ? frame.metrics.costPerHour : staticCostPerHour).toFixed(2);
    const maxRpsText = Number.isFinite(sustainable.rps)
      ? `${Math.round(sustainable.rps).toLocaleString('en-US')} RPS (${sustainable.limitedBy})`
      : '∞';

    const nodeSummaryLines = model.nodes.map((n) => {
      const pos = positions[n.id];
      const rep = effReplicas(n);
      const extra =
        n.kind === 'nosql'
          ? `, shards=${n.params.shards ?? 1}`
          : n.kind === 'sql'
            ? `, sizeFactor=${n.params.sizeFactor ?? 1}`
            : n.kind === 'cache' || n.kind === 'cdn'
              ? `, ttl=${n.params.ttlSec ?? 300}s`
              : n.kind === 'rate-limiter'
                ? `, rate=${n.params.ratePerSec ?? 1000}/s`
                : '';
      return `- ${n.label.vi} [${n.kind}, id=${n.id}] @ (${pos?.x ?? 0},${pos?.y ?? 0}): replicas=${rep}, ops=${n.capacity.opsPerSec}/s, base=${n.latency.baseMs}ms${extra}`;
    });

    const linkSummaryLines = model.links.map(
      (l) =>
        `- ${l.from} → ${l.to} (${l.mode}, carries=${l.carries ?? 'rw'}${l.timeoutMs ? `, timeout=${l.timeoutMs}ms` : ''}${l.onMissOf ? `, onMissOf=${l.onMissOf}` : ''})`
    );

    const gradeLine = gradeReport
      ? `Kết quả chấm: ${gradeReport.passed ? 'ĐẠT' : 'CHƯA ĐẠT'} · ${'★'.repeat(gradeReport.stars)}${'☆'.repeat(3 - gradeReport.stars)} (${gradeReport.score}/100)`
      : 'Kết quả chấm: Chưa chạy chấm điểm';

    const snippet = JSON.stringify(
      {
        template: activeTemplateId,
        nodes: model.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          replicas: effReplicas(n),
          pos: positions[n.id],
          params: n.params,
        })),
        links: model.links,
      },
      null,
      2
    );

    const content = [
      `### ${titleBase}`,
      gradeLine,
      '',
      `**Chỉ số mô phỏng (t = ${currentSec.toFixed(1)}s):**`,
      `- Tải vào: ${kpiOffered.toLocaleString('en-US')} RPS | Goodput: ${kpiGoodput.toLocaleString('en-US')} RPS`,
      `- Độ trễ p99: ${kpiP99} ms | Tỉ lệ lỗi: ${kpiErr}%`,
      `- Chi phí: $${costVal}/giờ | Max Sustainable RPS: ${maxRpsText}`,
      '',
      `**Thành phần (${model.nodes.length}):**`,
      ...nodeSummaryLines,
      '',
      `**Kết nối (${model.links.length}):**`,
      ...(linkSummaryLines.length > 0 ? linkSummaryLines : ['- (Chưa có kết nối)']),
      '',
      '**Cấu hình JSON rút gọn:**',
      '```json',
      snippet,
      '```',
    ].join('\n');

    await useUserDataStore.getState().addOrUpdateNote({
      targetType: 'lesson',
      targetId,
      targetTitle,
      content,
    });
    useNavigationStore.getState().openNotesDrawer('lesson', targetId, targetTitle);
  }, [
    activeChallenge,
    activeTemplateId,
    currentSec,
    frame,
    gradeReport,
    lang,
    model.links,
    model.nodes,
    positions,
    staticCostPerHour,
    sustainable.limitedBy,
    sustainable.rps,
  ]);

  /* ───────────── Selected Entities ───────────── */
  const selectedNode = useMemo(
    () =>
      selection?.kind === 'node'
        ? model.nodes.find((n) => n.id === selection.id) ?? null
        : null,
    [model.nodes, selection]
  );

  const selectedLink = useMemo(
    () =>
      selection?.kind === 'link'
        ? model.links.find((l) => l.id === selection.id) ?? null
        : null,
    [model.links, selection]
  );

  const cacheNodesInModel = useMemo(
    () => model.nodes.filter((n) => n.kind === 'cache' || n.kind === 'cdn'),
    [model.nodes]
  );

  const clientConnected = useMemo(
    () =>
      model.links.some((l) => {
        if (l.mode === 'replicate') return false;
        const src = model.nodes.find((n) => n.id === l.from);
        return src?.kind === 'client';
      }),
    [model.links, model.nodes]
  );

  const analyzerIssueCount =
    errorSpofs.length +
    integrityIssues.length +
    warnings.filter((w) => w.severity !== 'info' && w.code !== 'SPOF').length;

  /* ─────────────────────────── RENDER ─────────────────────────── */

  return (
    <div
      ref={labRootRef}
      className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--dts-canvas)] text-[var(--dts-ink)]"
    >
      {/* ═══════════════ TOP CONTROL & SIMULATION TOOLBAR ═══════════════ */}
      <div className="shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Challenge / Sandbox selector + Starter / Blank Canvas switch */}
          <div className="flex flex-wrap items-center gap-1.5">
            <LabPicker
              lang={lang}
              labs={LAB_CHALLENGES}
              activeId={activeTemplateId}
              starsById={labStarsById}
              onSelect={handleSelectTemplate}
            />

            {/* Starter / Blank canvas (ghi đè canvas → hỏi xác nhận nếu đã chỉnh sửa) */}
            <div className="inline-flex rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => requestPreset('starter')}
                title={
                  lang === 'en'
                    ? 'Reset the canvas to the starter design (your draft is replaced)'
                    : 'Đặt lại canvas về bản khởi điểm (bản nháp hiện tại sẽ bị thay)'
                }
                className={cn(
                  'rounded-lg px-2.5 py-1 transition-colors',
                  canvasMode === 'starter'
                    ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                    : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                )}
              >
                {lang === 'en' ? 'Starter Canvas' : 'Bản khởi điểm'}
              </button>
              <button
                type="button"
                onClick={() => requestPreset('blank')}
                title={lang === 'en' ? 'Start from an empty canvas' : 'Bắt đầu từ canvas trống'}
                className={cn(
                  'rounded-lg px-2.5 py-1 transition-colors',
                  canvasMode === 'blank'
                    ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                    : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                )}
              >
                {lang === 'en' ? 'Blank Canvas' : 'Canvas trống'}
              </button>
            </div>

            {/* Mẫu 3★ — tách riêng, cần xác nhận vì ảnh hưởng điểm thưởng */}
            {activeChallenge && (
              <button
                type="button"
                onClick={() => requestPreset('reference')}
                title={
                  lang === 'en'
                    ? 'View the 3-star reference design (reduces XP/stars for this lab)'
                    : 'Xem kiến trúc mẫu 3 sao (làm giảm XP/sao của bài này)'
                }
                className={cn(
                  'dts-btn-tactile ml-1 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-extrabold',
                  'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]',
                  canvasMode === 'reference' && 'ring-2 ring-[var(--dts-amber-ink)]'
                )}
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>{lang === 'en' ? '3★ Sample' : 'Mẫu 3★'}</span>
              </button>
            )}

            {/* Connect Mode toggle (dự phòng cho cảm ứng; trên desktop kéo từ chấm tròn bên phải thẻ) */}
            <button
              type="button"
              title={
                lang === 'en'
                  ? "Click-to-connect mode. Tip: you can also drag from the dot on a card's right edge."
                  : 'Chế độ nhấn-để-nối. Mẹo: có thể kéo trực tiếp từ chấm tròn bên phải thẻ.'
              }
              onClick={() => {
                setConnectMode((v) => !v);
                setConnectFromId(null);
              }}
              className={cn(
                'dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-extrabold',
                connectMode
                  ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
              )}
            >
              <Link2 className="h-3.5 w-3.5 shrink-0" />
              <span>{lang === 'en' ? 'Connect Nodes' : 'Nối kết nối'}</span>
            </button>
          </div>

          {/* Load Profile + Play/Pause/Scrubber + Grade + Save Notes */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Load Profile Control (Sandbox) — trong challenge: badge kịch bản chỉ đọc */}
            {activeChallenge && activeScenario ? (
              <div
                className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 text-[11px]"
                title={
                  lang === 'en'
                    ? 'In a challenge, load comes from the grader scenarios and cannot be edited. Switch to the Sandbox to tune load freely.'
                    : 'Trong bài thử thách, tải do các kịch bản chấm điểm quyết định nên không chỉnh được. Dùng Sandbox để chỉnh tải tự do.'
                }
              >
                <Lock className="h-3 w-3 shrink-0 text-[var(--dts-ink-muted)]" />
                <Gauge className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
                {activeChallenge.scenarios.length > 1 ? (
                  <select
                    aria-label={lang === 'en' ? 'Preview scenario' : 'Kịch bản xem trước'}
                    value={activeScenario.id}
                    onChange={(e) => {
                      setScenarioId(e.target.value);
                      setIsPlaying(false);
                    }}
                    className="max-w-[16rem] truncate bg-transparent font-mono font-extrabold text-[var(--dts-ink)] focus:outline-none"
                  >
                    {activeChallenge.scenarios.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {pick(sc.label, lang)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="max-w-[16rem] truncate font-mono font-extrabold text-[var(--dts-ink)]">
                    {pick(activeScenario.label, lang)}
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                  {lang === 'en'
                    ? `${Math.round(readRatio * 100)}% read · ${durationSec}s · fixed`
                    : `${Math.round(readRatio * 100)}% đọc · ${durationSec}s · cố định`}
                </span>
              </div>
            ) : (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 text-[11px]">
              <Gauge className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
              <select
                aria-label={lang === 'en' ? 'Load Profile' : 'Dạng tải'}
                value={loadProfile.kind}
                onChange={(e) => {
                  const k = e.target.value as 'steady' | 'ramp' | 'spike';
                  if (k === 'steady') editLoad({ kind: 'steady', rps: 3000 });
                  else if (k === 'ramp')
                    editLoad({ kind: 'ramp', from: 500, to: 6000, overSec: 45 });
                  else
                    editLoad({
                      kind: 'spike',
                      base: 1000,
                      peak: 8000,
                      atSec: 12,
                      holdSec: 12,
                      riseSec: 3,
                      fallSec: 5,
                    });
                }}
                className="bg-transparent font-mono font-extrabold text-[var(--dts-ink)] focus:outline-none"
              >
                <option value="steady">Steady</option>
                <option value="ramp">Ramp</option>
                <option value="spike">Spike</option>
              </select>

              {loadProfile.kind === 'steady' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={100}
                    max={20000}
                    step={100}
                    value={loadProfile.rps}
                    onChange={(e) =>
                      editLoad({ kind: 'steady', rps: Number(e.target.value) })
                    }
                    className="w-20 accent-[var(--dts-blue-ink)]"
                  />
                  <span className="font-mono font-extrabold tabular-nums">
                    {loadProfile.rps.toLocaleString('en-US')} RPS
                  </span>
                </div>
              )}

              {loadProfile.kind === 'ramp' && (
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min={100}
                    max={20000}
                    step={100}
                    value={loadProfile.from}
                    onChange={(e) =>
                      editLoad({
                        ...loadProfile,
                        from: Math.max(100, Number(e.target.value) || 100),
                      })
                    }
                    className="w-14 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold"
                  />
                  <span>→</span>
                  <input
                    type="number"
                    min={200}
                    max={25000}
                    step={100}
                    value={loadProfile.to}
                    onChange={(e) =>
                      editLoad({
                        ...loadProfile,
                        to: Math.max(200, Number(e.target.value) || 200),
                      })
                    }
                    className="w-16 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold"
                  />
                  <span className="text-[10px] text-[var(--dts-ink-muted)]">RPS</span>
                </div>
              )}

              {loadProfile.kind === 'spike' && (
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min={100}
                    max={20000}
                    step={100}
                    value={loadProfile.base}
                    onChange={(e) =>
                      editLoad({
                        ...loadProfile,
                        base: Math.max(100, Number(e.target.value) || 100),
                      })
                    }
                    className="w-14 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold"
                  />
                  <span>↗</span>
                  <input
                    type="number"
                    min={500}
                    max={30000}
                    step={250}
                    value={loadProfile.peak}
                    onChange={(e) =>
                      editLoad({
                        ...loadProfile,
                        peak: Math.max(500, Number(e.target.value) || 500),
                      })
                    }
                    className="w-16 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold"
                  />
                  <span className="text-[10px] text-[var(--dts-ink-muted)]">RPS</span>
                </div>
              )}

              <span className="mx-0.5 text-[var(--dts-line-strong)]">|</span>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[var(--dts-ink-soft)]">
                <span>{lang === 'en' ? 'Read' : 'Đọc'}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(readRatio * 100)}
                  onChange={(e) => {
                    const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    editReadRatio(pct / 100);
                  }}
                  className="w-11 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold text-[var(--dts-ink)]"
                />
                <span>%</span>
              </label>
            </div>
            )}

            {/* Playback + Scrubber */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
              <button
                type="button"
                disabled={Boolean(modelError)}
                onClick={() => {
                  if (!isPlaying && currentSec >= durationSec - 0.15) {
                    handleResetSim();
                  }
                  setIsPlaying((p) => !p);
                }}
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--dts-border)] transition-colors',
                  isPlaying
                    ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    : 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                )}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Play className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={handleResetSim}
                className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
                title={lang === 'en' ? 'Reset simulation' : 'Đặt lại thời gian'}
              >
                <RotateCcw className="h-3 w-3 shrink-0" />
              </button>

              <div className="flex items-center rounded-lg bg-[var(--dts-panel-muted)] p-0.5 font-mono text-[10px] font-bold">
                {([1, 2, 5] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeed(sp)}
                    className={cn(
                      'rounded px-1.5 py-0.5',
                      speed === sp
                        ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-2xs'
                        : 'text-[var(--dts-ink-muted)]'
                    )}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={0}
                max={durationSec}
                step={0.5}
                value={currentSec}
                onChange={(e) => handleScrub(Number(e.target.value))}
                aria-label={lang === 'en' ? 'Simulation timeline' : 'Thanh tua mô phỏng'}
                className="w-20 cursor-pointer accent-[var(--dts-blue-ink)] sm:w-24"
              />
              <span className="w-14 text-right font-mono text-[10px] font-bold tabular-nums text-[var(--dts-ink-soft)]">
                {currentSec.toFixed(1)}s/{durationSec}s
              </span>
            </div>

            {/* Grade Design Button */}
            {activeChallenge && (
              <button
                type="button"
                onClick={handleGradeDesign}
                className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3 py-1 text-xs font-extrabold text-[var(--dts-blue-ink)]"
              >
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span>{lang === 'en' ? 'Grade Design' : 'Chấm thiết kế'}</span>
              </button>
            )}

            {/* Save to Notes (IndexedDB) */}
            <button
              type="button"
              onClick={() => void handleSaveToNotes()}
              className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-amber-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--dts-amber-ink)]"
            >
              <StickyNote className="h-3.5 w-3.5 shrink-0" />
              <span>{lang === 'en' ? 'Save to Notes' : 'Lưu vào Ghi chú'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ LIVE KPI TELEMETRY STRIP ═══════════════ */}
      <div className="shrink-0 grid grid-cols-2 gap-1.5 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-3 py-1.5 sm:grid-cols-3 lg:grid-cols-6">
        <KpiPill
          label={lang === 'en' ? 'Offered Load (RPS)' : 'Tải vào (RPS)'}
          value={
            frame ? Math.round(frame.metrics.offeredRps).toLocaleString('en-US') : '—'
          }
          sub={
            loadProfile.kind === 'steady'
              ? 'Steady'
              : loadProfile.kind === 'ramp'
                ? `Ramp → ${loadProfile.to}`
                : loadProfile.kind === 'spike'
                  ? `Spike → ${loadProfile.peak}`
                  : loadProfile.kind
          }
        />
        <KpiPill
          label="Goodput (RPS)"
          value={
            !clientConnected
              ? '0'
              : frame
                ? Math.round(frame.metrics.goodputRps).toLocaleString('en-US')
                : '—'
          }
          tone={
            !clientConnected
              ? 'warn'
              : frame &&
                  frame.metrics.offeredRps > 1 &&
                  frame.metrics.goodputRps < frame.metrics.offeredRps * 0.95
                ? 'warn'
                : 'ok'
          }
          sub={
            !clientConnected
              ? lang === 'en'
                ? 'Client unconnected'
                : 'Chưa nối từ Client'
              : frame && frame.metrics.offeredRps > 0
                ? `${Math.round((frame.metrics.goodputRps / frame.metrics.offeredRps) * 100)}% served`
                : '—'
          }
        />
        <KpiPill
          label={lang === 'en' ? 'p99 Latency (ms)' : 'Độ trễ p99 (ms)'}
          value={
            !clientConnected || !frame
              ? '—'
              : `${Math.round(frame.metrics.latency.p99)} ms`
          }
          tone={
            !clientConnected || !frame
              ? 'default'
              : frame.metrics.latency.p99 > 250
                ? 'bad'
                : frame.metrics.latency.p99 > 120
                  ? 'warn'
                  : 'ok'
          }
          sub={
            !clientConnected || !frame
              ? '—'
              : `p50: ${Math.round(frame.metrics.latency.p50)} ms`
          }
        />
        <KpiPill
          label={lang === 'en' ? 'Error Rate (%)' : 'Tỉ lệ lỗi (%)'}
          value={
            !clientConnected || !frame
              ? '—'
              : `${(frame.metrics.errorRate * 100).toFixed(2)}%`
          }
          tone={
            !clientConnected || !frame
              ? 'default'
              : frame.metrics.errorRate > 0.02
                ? 'bad'
                : frame.metrics.errorRate > 0.005
                  ? 'warn'
                  : 'ok'
          }
          sub={
            !clientConnected || !frame
              ? '—'
              : frame.metrics.errors.limited > 0.001
                ? `429 limited: ${(frame.metrics.errors.limited * 100).toFixed(1)}%`
                : `timeout: ${(frame.metrics.errors.timeout * 100).toFixed(1)}%`
          }
        />
        <KpiPill
          label={lang === 'en' ? 'Cost ($/hr)' : 'Chi phí ($/giờ)'}
          value={`$${(frame ? frame.metrics.costPerHour : staticCostPerHour).toFixed(2)}/h`}
          tone={
            activeChallenge &&
            (frame ? frame.metrics.costPerHour : staticCostPerHour) >
              activeChallenge.maxCostPerHour + 1e-6
              ? 'bad'
              : 'default'
          }
          sub={
            activeChallenge
              ? `${lang === 'en' ? 'Budget' : 'Ngân sách'} ≤ $${activeChallenge.maxCostPerHour.toFixed(2)}/h`
              : `${model.nodes.length} nodes`
          }
        />
        <KpiPill
          label="Max Sustainable RPS"
          value={
            !clientConnected
              ? '—'
              : Number.isFinite(sustainable.rps)
                ? `${Math.round(sustainable.rps).toLocaleString('en-US')}`
                : '∞'
          }
          tone={
            clientConnected &&
            frame &&
            Number.isFinite(sustainable.rps) &&
            sustainable.rps < frame.metrics.offeredRps
              ? 'bad'
              : 'default'
          }
          sub={
            !clientConnected
              ? lang === 'en'
                ? 'Connect Client first'
                : 'Hãy nối Client trước'
              : sustainable.limitedBy
                ? `${lang === 'en' ? 'Limit:' : 'Giới hạn:'} ${sustainable.limitedBy}`
                : lang === 'en'
                  ? 'Unbounded headroom'
                  : 'Dư tải lớn'
          }
        />
      </div>

      {/* ═══════════════ MAIN 3-COLUMN WORKSPACE ═══════════════ */}
      <div className="flex flex-1 min-h-0 min-w-0 flex-col lg:flex-row overflow-hidden">
        {/* ─────── LEFT: COMPONENT PALETTE ─────── */}
        <aside className="shrink-0 select-none flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:w-52 border-b lg:border-b-0 lg:border-r border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2">
          <div className="hidden lg:flex items-center justify-between px-1 pb-1">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
              {lang === 'en' ? 'Primitives (14)' : 'Thành phần (14)'}
            </span>
            <span className="text-[10px] text-[var(--dts-ink-muted)]">
              {lang === 'en' ? 'Click / Drag' : 'Nhấn / Kéo'}
            </span>
          </div>

          {PALETTE_ITEMS.map((item) => {
            const Icon = item.icon;
            const def = KIND_DEFAULTS[item.kind];
            return (
              <button
                key={item.kind}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-sd-palette', item.kind);
                  e.dataTransfer.effectAllowed = 'copy';
                  paletteKindRef.current = item.kind;
                  lockBodySelect();
                }}
                onDragEnd={() => {
                  setPaletteDrop(null);
                  paletteKindRef.current = null;
                  unlockBodySelect();
                }}
                onClick={() => addPrimitiveAt(item.kind)}
                className="group shrink-0 flex items-center gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1.5 text-left transition-all hover:border-[var(--dts-border)] hover:shadow-[1.5px_2px_0_var(--dts-shadow-color)]"
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--dts-border)]',
                    item.toneClass
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                </div>
                <div className="min-w-0 grow">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                      {pick(item.label, lang)}
                    </span>
                    <Plus className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-100" />
                  </div>
                  <div className="hidden lg:flex items-center justify-between font-mono text-[9.5px] text-[var(--dts-ink-muted)]">
                    <span>
                      {def.opsPerSec >= 1000
                        ? `${def.opsPerSec / 1000}k/s`
                        : `${def.opsPerSec}/s`}
                    </span>
                    <span>${def.costPerHour}/h</span>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ─────── CENTER: 2D ORTHOGONAL GRID ARCHITECTURE CANVAS ─────── */}
        <section className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--dts-stage-bg)]">
          {/* Challenge Brief Bar (if a challenge is active) */}
          {activeChallenge && (
            <div className="shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-3.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[var(--dts-border)] bg-[var(--dts-blue-bg)] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[var(--dts-blue-ink)]">
                      {activeChallenge.code}
                    </span>
                    <h2 className="font-mono text-xs font-extrabold text-[var(--dts-ink)] sm:text-sm">
                      {pick(activeChallenge.title, lang)}
                    </h2>
                    <LabLevelBadge level={activeChallenge.level} lang={lang} />
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--dts-ink-muted)]">
                      <LabDifficultyPips
                        value={activeChallenge.difficulty}
                        lang={lang}
                        level={activeChallenge.level}
                      />
                      <span>
                        {activeChallenge.xp} XP · ~{activeChallenge.estMinutes}{' '}
                        {lang === 'en' ? 'min' : 'phút'}
                      </span>
                    </span>
                  </div>
                  {briefExpanded && (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--dts-ink-soft)]">
                      {pick(activeChallenge.prompt, lang)}
                    </p>
                  )}
                  {briefExpanded && hintsShown > 0 && (
                    <div className="mt-2 space-y-1">
                      {activeChallenge.hints.slice(0, hintsShown).map((h, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] px-2.5 py-1 text-[11px] text-[var(--dts-amber-ink)]"
                        >
                          <span className="font-mono font-extrabold">
                            {lang === 'en' ? `Hint ${idx + 1}: ` : `Gợi ý ${idx + 1}: `}
                          </span>
                          {pick(h, lang)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {hintsShown < activeChallenge.hints.length && (
                    <button
                      type="button"
                      onClick={() => {
                        setBriefExpanded(true);
                        setHintsShown((c) => Math.min(activeChallenge.hints.length, c + 1));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 text-[11px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
                    >
                      <HelpCircle className="h-3 w-3 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? `Hint (${hintsShown}/${activeChallenge.hints.length})`
                          : `Gợi ý (${hintsShown}/${activeChallenge.hints.length})`}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setBriefExpanded((v) => !v)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
                    title={briefExpanded ? 'Collapse brief' : 'Expand brief'}
                  >
                    {briefExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Connect mode / Toast / Validation floating banner */}
          {(connectMode || toast || modelError) && (
            <div className="pointer-events-none absolute top-2 left-3 right-3 z-30 flex flex-col items-center gap-1.5">
              {connectMode && (
                <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-green-bg)] px-3 py-1 text-xs font-extrabold text-[var(--dts-green-ink)] shadow-md">
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {connectFromId
                      ? lang === 'en'
                        ? `Source: "${connectFromId}" → Click target node to create link`
                        : `Nguồn: "${connectFromId}" → Nhấn vào thành phần đích để nối dây`
                      : lang === 'en'
                        ? 'Connect mode: click a source node, then a target node (or drag from the dot on a card\'s right edge)'
                        : 'Chế độ Nối: nhấn thành phần nguồn trước, rồi nhấn thành phần đích (hoặc kéo từ chấm tròn bên phải thẻ)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setConnectFromId(null);
                      setConnectMode(false);
                    }}
                    className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] hover:bg-black/20"
                  >
                    {lang === 'en' ? 'Done (Esc)' : 'Xong (Esc)'}
                  </button>
                </div>
              )}

              {toast && (
                <div
                  className={cn(
                    'pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-[var(--dts-border)] px-3 py-1 text-xs font-bold shadow-md',
                    toast.tone === 'warn'
                      ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                      : toast.tone === 'ok'
                        ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                        : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                  )}
                >
                  <span>{toast.text}</span>
                </div>
              )}

              {modelError && (
                <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-rose-bg)] px-3 py-1 text-xs font-bold text-[var(--dts-rose-ink)] shadow-md">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{modelError}</span>
                </div>
              )}
            </div>
          )}

          {/* Scrollable 2D Blueprint Grid Board */}
          <div
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onAuxClick={(e) => {
              if (e.button === 1) e.preventDefault();
            }}
            className={cn(
              'dts-stage-noselect relative flex-1 select-none overflow-auto p-3 sm:p-4',
              isPanning ? 'cursor-grabbing' : connectMode ? '' : 'cursor-grab'
            )}
          >
            <div
              className="mx-auto origin-top-left"
              style={{
                width: BOARD_W * boardZoom,
                height: BOARD_H * boardZoom,
              }}
            >
              <div
                ref={boardRef}
                className="relative select-none rounded-2xl border-2 border-[var(--dts-line-strong)] bg-[var(--dts-stage-bg)] shadow-inner"
                style={{
                  width: BOARD_W,
                  height: BOARD_H,
                  transform: `scale(${boardZoom})`,
                  transformOrigin: 'top left',
                  backgroundImage:
                    'radial-gradient(circle, var(--dts-line-strong) 1px, transparent 1px)',
                  backgroundSize: `${DOT}px ${DOT}px`,
                  // Chấm của gradient nằm giữa ô nền → lùi nửa ô để chấm rơi đúng (0,0), (26,26)…
                  // Gốc khung là số chấm nguyên nên chấm khớp bội số DOT của toạ độ thật.
                  backgroundPosition: `${-DOT / 2}px ${-DOT / 2}px`,
                }}
                onDragOver={handleBoardDragOver}
                onDragLeave={handleBoardDragLeave}
                onDrop={handleBoardDrop}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setConnectFromId(null);
                  }
                }}
              >
                {/* 1. Xem trước chỗ thả (palette) / chỗ hạ cánh khi kéo node vào chỗ đã có node */}
                {(() => {
                  const ghosts: { key: string; p: CanvasPos; bad: boolean }[] = [];
                  if (paletteDrop) {
                    if (paletteDrop.collides) {
                      ghosts.push({ key: 'pal-bad', p: paletteDrop.pos, bad: true });
                    }
                    ghosts.push({ key: 'pal-land', p: paletteDrop.landing, bad: false });
                  }
                  if (nodeDrag?.moved && nodeDrag.collides) {
                    ghosts.push({ key: 'node-land', p: nodeDrag.landing, bad: false });
                  }
                  return ghosts.map((g) => (
                    <div
                      key={g.key}
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute rounded-xl',
                        g.bad ? 'z-[15]' : 'z-[5]'
                      )}
                      style={{
                        left: (g.p.x - viewport.org.x) * DOT,
                        top: (g.p.y - viewport.org.y) * DOT,
                        width: CARD_W,
                        height: CARD_H,
                        outline: g.bad ? '2px dashed #dc3d43' : '2px dashed #2563eb',
                        outlineOffset: -1,
                        backgroundColor: g.bad ? 'rgba(220,61,67,0.10)' : 'rgba(37,99,235,0.08)',
                      }}
                    />
                  ));
                })()}

                {/* 2. Orthogonal SVG Wires + Animated Flow Dots Layer */}
                <svg
                  viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
                  className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                >
                  <defs>
                    <marker
                      id="lab-arrow-ink"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--dts-ink)" />
                    </marker>
                    <marker
                      id="lab-arrow-selected"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6.5"
                      markerHeight="6.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#2563eb" />
                    </marker>
                    <marker
                      id="lab-arrow-danger"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6.5"
                      markerHeight="6.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#dc3d43" />
                    </marker>
                    <marker
                      id="lab-arrow-async"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#7c3aed" />
                    </marker>
                    <marker
                      id="lab-arrow-repl"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0d9488" />
                    </marker>
                  </defs>

                  {wires.map(({ link, d, labelX, labelY }) => {
                    const lf = frame?.links[link.id];
                    const isSelected =
                      selection?.kind === 'link' && selection.id === link.id;
                    const rps = lf?.rps ?? 0;
                    const errRate = lf?.errorRate ?? 0;
                    const isDanger = errRate > 0.08;
                    const isAsync = link.mode === 'async' || link.mode === 'pull';
                    const isRepl = link.mode === 'replicate';

                    const strokeColor = isSelected
                      ? '#2563eb'
                      : isDanger
                        ? '#dc3d43'
                        : isRepl
                          ? '#0d9488'
                          : isAsync
                            ? '#7c3aed'
                            : 'var(--dts-ink)';

                    const markerId = isSelected
                      ? 'url(#lab-arrow-selected)'
                      : isDanger
                        ? 'url(#lab-arrow-danger)'
                        : isRepl
                          ? 'url(#lab-arrow-repl)'
                          : isAsync
                            ? 'url(#lab-arrow-async)'
                            : 'url(#lab-arrow-ink)';

                    const dashArray = isRepl
                      ? '3 4'
                      : isAsync
                        ? '7 5'
                        : undefined;

                    const showDots = rps >= 0.5;
                    const dotDurSec = Math.max(
                      0.55,
                      Math.min(2.4, 2.2 - Math.log10(Math.max(1, rps)) * 0.38)
                    );
                    const dotColor = isDanger
                      ? '#ef4444'
                      : isRepl
                        ? '#14b8a6'
                        : isAsync
                          ? '#8b5cf6'
                          : '#22c55e';

                    const modeTag =
                      link.mode === 'replicate'
                        ? 'repl'
                        : link.mode === 'pull'
                          ? 'pull'
                          : link.mode === 'async'
                            ? 'async'
                            : link.onMissOf
                              ? 'miss'
                              : link.carries && link.carries !== 'rw'
                                ? link.carries.toUpperCase()
                                : 'sync';

                    const rpsShort =
                      rps >= 1000
                        ? `${(rps / 1000).toFixed(1)}k`
                        : rps >= 1
                          ? `${Math.round(rps)}`
                          : '';

                    const pillText = rpsShort ? `${modeTag} · ${rpsShort}` : modeTag;
                    const pillW = Math.max(38, pillText.length * 5.8 + 10);

                    return (
                      <g key={link.id}>
                        {/* Wide clickable hit target */}
                        <path
                          d={d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={16}
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelection({ kind: 'link', id: link.id });
                            setRightTab('inspector');
                          }}
                        />

                        {/* Visible wire */}
                        <path
                          d={d}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 2.8 : 2}
                          strokeDasharray={dashArray}
                          markerEnd={markerId}
                          opacity={rps < 0.1 && !isSelected && !isRepl ? 0.55 : 0.95}
                        />

                        {/* Animated flow dots along active orthogonal wire */}
                        {showDots && (
                          <>
                            <circle r={3.4} fill={dotColor}>
                              <animateMotion
                                dur={`${dotDurSec}s`}
                                repeatCount="indefinite"
                                path={d}
                              />
                            </circle>
                            {rps >= 250 && (
                              <circle r={3.1} fill={dotColor} opacity={0.85}>
                                <animateMotion
                                  dur={`${dotDurSec}s`}
                                  begin={`${(dotDurSec / 2).toFixed(2)}s`}
                                  repeatCount="indefinite"
                                  path={d}
                                />
                              </circle>
                            )}
                          </>
                        )}

                        {/* Midpoint clickable badge */}
                        <g
                          transform={`translate(${labelX}, ${labelY})`}
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelection({ kind: 'link', id: link.id });
                            setRightTab('inspector');
                          }}
                        >
                          <rect
                            x={-pillW / 2}
                            y={-8.5}
                            width={pillW}
                            height={17}
                            rx={5}
                            fill={
                              isSelected
                                ? '#dbeafe'
                                : 'var(--dts-panel-elevated)'
                            }
                            stroke={isSelected ? '#2563eb' : 'var(--dts-line-strong)'}
                            strokeWidth={isSelected ? 1.5 : 1}
                          />
                          <text
                            x={0}
                            y={3}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="var(--dts-font-mono)"
                            fontWeight="700"
                            fill={isSelected ? '#1e3a8a' : 'var(--dts-ink-soft)'}
                          >
                            {pillText}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* 2b. Rubber-band wire preview while dragging from a connection handle */}
                {wireDrag?.moved &&
                  viewPositions[wireDrag.fromId] &&
                  (() => {
                    const fp = viewPositions[wireDrag.fromId];
                    const sx = fp.x + CARD_W;
                    const sy = fp.y + CARD_H / 2;
                    // Hút đầu dây vào cạnh trái node đích khi rê tới node hợp lệ
                    const tp =
                      wireHoverPlan?.ok && wireDrag.hoverId
                        ? viewPositions[wireDrag.hoverId]
                        : undefined;
                    const ex = tp ? tp.x : wireDrag.x;
                    const ey = tp ? tp.y + CARD_H / 2 : wireDrag.y;
                    const mx = (sx + ex) / 2;
                    const d = `M ${sx} ${sy} H ${mx} V ${ey} H ${ex}`;
                    const color = wireHoverPlan
                      ? wireHoverPlan.ok
                        ? '#16a34a'
                        : '#dc3d43'
                      : '#2563eb';
                    return (
                      <>
                        <svg
                          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
                          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
                        >
                          <path
                            d={d}
                            fill="none"
                            stroke={color}
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            strokeLinejoin="round"
                          />
                          <circle cx={sx} cy={sy} r={4} fill={color} />
                          <circle cx={ex} cy={ey} r={5} fill={color} opacity={0.85} />
                        </svg>
                        {wireHoverPlan && !wireHoverPlan.ok && (
                          <div
                            className="pointer-events-none absolute z-30 max-w-[15rem] rounded-lg border border-[var(--dts-border)] bg-[var(--dts-rose-bg)] px-2 py-1 text-[10.5px] font-bold leading-snug text-[var(--dts-rose-ink)] shadow-md"
                            style={{ left: wireDrag.x + 14, top: wireDrag.y + 14 }}
                          >
                            {wireHoverPlan.text}
                          </div>
                        )}
                      </>
                    );
                  })()}

                {/* 3. Node Cards Layer */}
                {model.nodes.map((node) => {
                  const pos = viewPositions[node.id] ?? { x: 0, y: 0 };
                  const isDragging = nodeDrag?.moved === true && nodeDrag.id === node.id;
                  const dragBlocked = isDragging && nodeDrag.collides;
                  const nf = frame?.nodes[node.id];
                  const state: NodeState = nf?.state ?? 'idle';
                  const stMeta = STATE_BADGE_META[state];
                  const meta = KIND_META_MAP[node.kind] ?? PALETTE_ITEMS[6];
                  const Icon = meta.icon;
                  const isSelected =
                    selection?.kind === 'node' && selection.id === node.id;
                  const isConnectSource = connectFromId === node.id;
                  const isSpofErr = errorSpofs.some((s) => s.nodeId === node.id);
                  const isBottleneck =
                    bottleneck?.reason !== 'none' && bottleneck?.nodeId === node.id;
                  const isLocked = lockedIds.has(node.id);
                  const isLinking = Boolean(linkingFromId);
                  const isWireSource = linkingFromId === node.id;
                  const isWireHover = linkingHoverId === node.id && Boolean(wireHoverPlan);
                  const isValidTarget = linkTargetOk?.[node.id] === true;
                  // Khi đang nối dây: đích hợp lệ có viền xanh nét đứt, đích không hợp lệ bị làm mờ,
                  // node đang rê tới được phóng to + phát sáng xanh (thả được) hoặc đỏ (không thả được).
                  // Lưu ý: `.dts-card-tactile` (index.css, ngoài @layer) đè box-shadow/background/border
                  // của Tailwind, nên viền tô sáng dùng `outline` + inline style để luôn hiển thị.
                  const wireTargetRing = !isLinking
                    ? ''
                    : isWireSource
                      ? ''
                      : isWireHover
                        ? wireHoverPlan?.ok
                          ? 'z-20 scale-[1.06] -translate-y-0.5'
                          : 'z-20 cursor-not-allowed'
                        : isValidTarget
                          ? ''
                          : 'opacity-40 grayscale';
                  const highlightStyle: React.CSSProperties | undefined = !isLinking
                    ? isConnectSource
                      ? { outline: '2.5px solid #10b981', outlineOffset: 2 }
                      : isSelected
                        ? { outline: '2.5px solid #2563eb', outlineOffset: 2 }
                        : undefined
                    : isWireSource
                      ? { outline: '2.5px solid rgba(16,185,129,0.7)', outlineOffset: 3 }
                      : isWireHover
                        ? wireHoverPlan?.ok
                          ? {
                              outline: '3px solid #10b981',
                              outlineOffset: 2,
                              backgroundColor: 'var(--dts-green-soft)',
                              boxShadow:
                                '0 0 0 7px rgba(16,185,129,0.22), 0 10px 22px rgba(16,185,129,0.35)',
                            }
                          : {
                              outline: '3px solid #dc3d43',
                              outlineOffset: 2,
                              backgroundColor: 'var(--dts-rose-soft)',
                              boxShadow: '0 0 0 7px rgba(220,61,67,0.18)',
                            }
                        : isValidTarget
                          ? { outline: '2px dashed rgba(16,185,129,0.75)', outlineOffset: 3 }
                          : undefined;
                  const showHandle =
                    isSelected || connectMode || Boolean(wireDrag) || isConnectSource;

                  const loadPct = nf
                    ? Math.min(100, Math.round(nf.rho * 100))
                    : 0;
                  const rep = effReplicas(node);
                  const shards =
                    node.kind === 'nosql'
                      ? Math.max(1, Math.round(Number(node.params.shards ?? 1)))
                      : 1;
                  const sizeF = Number(node.params.sizeFactor ?? 1);

                  return (
                    <div
                      key={node.id}
                      data-lab-node={node.id}
                      onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                      onPointerMove={handleNodePointerMove}
                      onPointerUp={handleNodePointerUp}
                      onPointerCancel={cancelNodeDrag}
                      onLostPointerCapture={handleNodeLostCapture}
                      onDragStart={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (connectMode) {
                          if (!connectFromId) {
                            setConnectFromId(node.id);
                          } else {
                            createConnection(connectFromId, node.id);
                            setConnectFromId(null);
                          }
                          return;
                        }
                        setSelection({ kind: 'node', id: node.id });
                        setRightTab('inspector');
                      }}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: CARD_W,
                        height: CARD_H,
                        ...(state === 'overloaded'
                          ? { borderColor: '#dc3d43', backgroundColor: 'var(--dts-rose-soft)' }
                          : null),
                        ...highlightStyle,
                        // Đang kéo: chỗ hiện tại chồng lên node khác → viền đỏ (thả ra sẽ hút vào ô xanh)
                        ...(dragBlocked
                          ? {
                              outline: '2.5px solid #dc3d43',
                              outlineOffset: 2,
                              backgroundColor: 'var(--dts-rose-soft)',
                            }
                          : null),
                        ...(isDragging
                          ? { boxShadow: '0 12px 24px rgba(15,23,42,0.22)', opacity: 0.94 }
                          : null),
                      }}
                      className={cn(
                        'group absolute z-10 flex touch-none select-none flex-col justify-between rounded-xl p-2',
                        // Khi kéo: tắt transition để thẻ bám con trỏ (dây vẽ lại tức thì, không lệch)
                        isDragging
                          ? 'z-30 cursor-grabbing transition-none'
                          : connectMode
                            ? 'cursor-pointer transition-all'
                            : 'cursor-grab transition-all',
                        'dts-card-tactile',
                        !isLinking && !isDragging && (isConnectSource || isSelected) && '-translate-y-0.5',
                        // Đặt cuối để tô sáng khi nối dây luôn thắng viền "đang chọn"
                        wireTargetRing
                      )}
                      onPointerEnter={() => {
                        if (connectMode && connectFromId && !wireDragRef.current) {
                          setConnectHoverId(node.id);
                        }
                      }}
                      onPointerLeave={() => {
                        setConnectHoverId((cur) => (cur === node.id ? null : cur));
                      }}
                    >
                      {/* Nhãn thả dây: "Thả để nối" / "Không nối được" */}
                      {isWireHover && wireHoverPlan && (
                        <div
                          className={cn(
                            'pointer-events-none absolute -top-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-extrabold shadow-sm',
                            wireHoverPlan.ok
                              ? 'border-emerald-600 bg-emerald-500 text-white'
                              : 'border-[#dc3d43] bg-[#dc3d43] text-white'
                          )}
                        >
                          {wireHoverPlan.ok
                            ? `${lang === 'en' ? '✓ Drop to connect' : '✓ Thả để nối'}${wireHoverMode ? ` · ${wireHoverMode}` : ''}`
                            : lang === 'en'
                              ? '✕ Cannot connect'
                              : '✕ Không nối được'}
                        </div>
                      )}
                      {/* Top row: Icon + Title + Quick actions */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--dts-border)]',
                              meta.toneClass
                            )}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-mono text-[10.5px] font-extrabold leading-tight text-[var(--dts-ink)]">
                              {pick(node.label, lang)}
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[8.5px] text-[var(--dts-ink-muted)]">
                              <span>{node.kind}</span>
                              {rep > 1 && <span className="font-bold">×{rep}</span>}
                              {shards > 1 && (
                                <span className="font-bold">{shards}sh</span>
                              )}
                              {sizeF > 1 && (
                                <span className="font-bold">S×{sizeF}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          {isSpofErr && (
                            <span
                              title="SPOF"
                              className="rounded bg-[var(--dts-rose-bg)] px-1 py-0.5 font-mono text-[8px] font-extrabold text-[var(--dts-rose-ink)]"
                            >
                              SPOF
                            </span>
                          )}
                          {isBottleneck && !isSpofErr && (
                            <span
                              title="Bottleneck"
                              className="rounded bg-[var(--dts-amber-bg)] px-1 py-0.5 font-mono text-[8px] font-extrabold text-[var(--dts-amber-ink)]"
                            >
                              BOT
                            </span>
                          )}
                          {isLocked ? (
                            <Lock className="h-2.5 w-2.5 text-[var(--dts-ink-muted)]" />
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              title={lang === 'en' ? 'Delete node (Del)' : 'Xoá thành phần (Del)'}
                              className="hidden group-hover:inline-flex h-4 w-4 items-center justify-center rounded text-[var(--dts-ink-muted)] hover:bg-[var(--dts-rose-bg)] hover:text-[var(--dts-rose-ink)]"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle row: State badge + Kind telemetry */}
                      <div className="flex items-center justify-between gap-1 font-mono text-[9px]">
                        <span
                          className={cn(
                            'rounded border px-1 py-0.2 font-extrabold leading-tight',
                            stMeta.cls
                          )}
                        >
                          {lang === 'en' ? stMeta.en : stMeta.vi}
                        </span>

                        {node.kind === 'cache' || node.kind === 'cdn' ? (
                          <span className="font-bold text-[var(--dts-green-ink)]">
                            Hit {Math.round((nf?.hitRatio ?? 0) * 100)}%
                          </span>
                        ) : node.kind === 'queue' ? (
                          <span className="font-bold text-[var(--dts-purple-ink)]">
                            Q:{Math.round(nf?.backlog ?? 0)}
                          </span>
                        ) : nf && nf.queue >= 1 ? (
                          <span className="font-bold text-[#dc3d43]">
                            Q:{Math.round(nf.queue)}
                          </span>
                        ) : nf?.lagMs !== undefined ? (
                          <span className="font-bold text-[var(--dts-blue-ink)]">
                            Lag {Math.round(nf.lagMs)}ms
                          </span>
                        ) : (
                          <span className="tabular-nums text-[var(--dts-ink-muted)]">
                            {nf && nf.lambda >= 1
                              ? `${ nf.lambda >= 1000 ? `${(nf.lambda / 1000).toFixed(1)}k` : Math.round(nf.lambda) }/s`
                              : ''}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Utilization bar (`loadPct%`) */}
                      {node.kind !== 'client' ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between font-mono text-[8.5px] text-[var(--dts-ink-muted)]">
                            <span>ρ {(nf?.rho ?? 0).toFixed(2)}</span>
                            <span className="font-bold text-[var(--dts-ink)]">
                              {loadPct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dts-panel-muted)]">
                            <div
                              className={cn('h-full transition-all duration-150', stMeta.barCls)}
                              style={{ width: `${loadPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between font-mono text-[9px] text-[var(--dts-ink-soft)]">
                          <span>{lang === 'en' ? 'Out:' : 'Phát:'}</span>
                          <span className="font-extrabold tabular-nums">
                            {frame
                              ? `${Math.round(frame.metrics.offeredRps).toLocaleString('en-US')} RPS`
                              : '—'}
                          </span>
                        </div>
                      )}

                      {/* Tay nối: kéo để vẽ dây, nhấn một lần để chọn đích */}
                      <button
                        type="button"
                        draggable={false}
                        aria-label={
                          lang === 'en'
                            ? `Connect from ${node.id}: drag to a target, or click then pick a target`
                            : `Nối từ ${node.id}: kéo tới thành phần đích, hoặc nhấn rồi chọn đích`
                        }
                        title={
                          lang === 'en'
                            ? 'Drag to another component to connect (click = pick target)'
                            : 'Kéo tới thành phần khác để nối (nhấn = chọn đích)'
                        }
                        onPointerDown={(e) => handleWirePointerDown(e, node.id)}
                        onPointerMove={handleWirePointerMove}
                        onPointerUp={handleWirePointerUp}
                        onPointerCancel={cancelWireDrag}
                        onClick={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className={cn(
                          'absolute -right-3.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 cursor-crosshair touch-none select-none items-center justify-center rounded-full transition-opacity focus-visible:opacity-100',
                          showHandle ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <span
                          className={cn(
                            'h-3.5 w-3.5 rounded-full border-2 border-[var(--dts-border)] shadow-[1px_1px_0_var(--dts-shadow-color)]',
                            isWireSource || isConnectSource
                              ? 'bg-emerald-400'
                              : 'bg-[var(--dts-green-bg)] hover:bg-emerald-300'
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom-right collapsible wire legend */}
          <div className="pointer-events-none absolute bottom-3 right-3 z-20">
            <LinkLegend lang={lang} />
          </div>

          {/* Bottom-left view toolbar: Undo · Redo │ − · 100% · + │ Reset view */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <div
              data-no-pan
              className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 font-mono text-[11px] font-bold shadow-sm"
            >
              <button
                type="button"
                onClick={undo}
                disabled={histLen.past === 0}
                title={lang === 'en' ? 'Undo (Ctrl/Cmd+Z)' : 'Hoàn tác (Ctrl/Cmd+Z)'}
                aria-label={lang === 'en' ? 'Undo' : 'Hoàn tác'}
                className="px-1 hover:text-[var(--dts-blue-ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={histLen.future === 0}
                title={
                  lang === 'en'
                    ? 'Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y)'
                    : 'Làm lại (Ctrl/Cmd+Shift+Z hoặc Ctrl+Y)'
                }
                aria-label={lang === 'en' ? 'Redo' : 'Làm lại'}
                className="px-1 hover:text-[var(--dts-blue-ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
              <span className="mx-0.5 h-3.5 w-px bg-[var(--dts-line-strong)]" />
              <button
                type="button"
                onClick={() => zoomAt(boardZoom / 1.15)}
                disabled={boardZoom <= ZOOM_MIN}
                title={lang === 'en' ? 'Zoom out (Ctrl/⌘ + scroll)' : 'Thu nhỏ (Ctrl/⌘ + cuộn chuột)'}
                className="px-1.5 hover:text-[var(--dts-blue-ink)] disabled:opacity-40"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => zoomAt(1)}
                title={lang === 'en' ? 'Reset to 100%' : 'Về 100%'}
                className="min-w-[3ch] px-1 tabular-nums hover:text-[var(--dts-blue-ink)]"
              >
                {Math.round(boardZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => zoomAt(boardZoom * 1.15)}
                disabled={boardZoom >= ZOOM_MAX}
                title={lang === 'en' ? 'Zoom in (Ctrl/⌘ + scroll)' : 'Phóng to (Ctrl/⌘ + cuộn chuột)'}
                className="px-1.5 hover:text-[var(--dts-blue-ink)] disabled:opacity-40"
              >
                +
              </button>
              <span className="mx-0.5 h-3.5 w-px bg-[var(--dts-line-strong)]" />
              <button
                type="button"
                onClick={fitToContent}
                title={lang === 'en' ? 'Reset view (fit diagram)' : 'Đặt lại khung nhìn (vừa sơ đồ)'}
                aria-label={lang === 'en' ? 'Reset view' : 'Đặt lại khung nhìn'}
                className="px-1 hover:text-[var(--dts-blue-ink)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="hidden rounded-lg bg-[var(--dts-panel-elevated)]/85 px-2 py-0.5 text-[10px] text-[var(--dts-ink-muted)] shadow-xs xl:inline">
              {lang === 'en'
                ? 'Ctrl/⌘ + scroll to zoom · drag empty space to pan · arrow keys nudge the selected node'
                : 'Ctrl/⌘ + cuộn để zoom · kéo vùng trống để di chuyển · phím mũi tên để xê dịch thành phần đang chọn'}
            </span>
          </div>
        </section>

        {/* ─────── RIGHT: INSPECTOR + ANALYZER + GRADER PANEL ─────── */}
        <aside className="shrink-0 flex h-80 lg:h-full w-full lg:w-88 xl:w-96 flex-col border-t lg:border-t-0 lg:border-l border-[var(--dts-line-strong)] bg-[var(--dts-panel)] overflow-hidden">
          {/* Right Panel Tabs */}
          <div className="shrink-0 grid grid-cols-3 gap-1 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] p-1.5 font-mono text-[11px] font-extrabold">
            <button
              type="button"
              onClick={() => setRightTab('inspector')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg py-1.5 transition-colors',
                rightTab === 'inspector'
                  ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                  : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Sliders className="h-3.5 w-3.5 shrink-0" />
              <span>{lang === 'en' ? 'Inspector' : 'Chi tiết'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRightTab('analyzer')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg py-1.5 transition-colors',
                rightTab === 'analyzer'
                  ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                  : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span>{lang === 'en' ? 'Analyzer' : 'Phân tích'}</span>
              {analyzerIssueCount > 0 && (
                <span className="rounded-full bg-[var(--dts-rose-bg)] px-1.5 text-[9.5px] text-[var(--dts-rose-ink)]">
                  {analyzerIssueCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRightTab('grade')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg py-1.5 transition-colors',
                rightTab === 'grade'
                  ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                  : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Award className="h-3.5 w-3.5 shrink-0" />
              <span>{lang === 'en' ? 'Grade' : 'Chấm điểm'}</span>
              {gradeReport && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[9.5px]',
                    gradeReport.passed
                      ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                      : 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                  )}
                >
                  {gradeReport.stars}★
                </span>
              )}
            </button>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* ══════ TAB 1: NODE / LINK INSPECTOR ══════ */}
            {rightTab === 'inspector' && (
              <>
                {selectedNode && (
                  <NodeInspectorForm
                    node={selectedNode}
                    route={
                      model.routes?.[selectedNode.id] ?? defaultRoute(selectedNode.kind)
                    }
                    nf={frame?.nodes[selectedNode.id]}
                    locked={lockedIds.has(selectedNode.id)}
                    lang={lang}
                    onUpdate={(mutator) => updateNode(selectedNode.id, mutator)}
                    onUpdateRoute={(r) => updateNodeRoute(selectedNode.id, r)}
                    onStartConnect={() => {
                      setConnectMode(true);
                      setConnectFromId(selectedNode.id);
                    }}
                    onDelete={() => deleteNode(selectedNode.id)}
                  />
                )}

                {selectedLink && (
                  <LinkInspectorForm
                    link={selectedLink}
                    lf={frame?.links[selectedLink.id]}
                    cacheNodes={cacheNodesInModel}
                    lang={lang}
                    onUpdate={(mutator) => updateLink(selectedLink.id, mutator)}
                    onDelete={() => deleteLink(selectedLink.id)}
                  />
                )}

                {!selectedNode && !selectedLink && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3">
                      <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                        {lang === 'en'
                          ? 'Select a Node or Wire'
                          : 'Chọn một Thành phần hoặc Đường nối'}
                      </div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                        {lang === 'en'
                          ? 'Click any node card on the 2D grid to tune replicas, capacity, latency, and specialized knobs, or click any wire to configure sync/async/pull/replicate, timeouts, retries, and circuit breakers.'
                          : 'Nhấn vào bất kỳ thẻ thành phần nào trên lưới 2D để chỉnh số instance, năng lực xử lý, độ trễ và tham số chuyên biệt; hoặc nhấn vào đường nối để chỉnh sync/async/pull/replicate, timeout, retry và circuit breaker.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-1.5">
                      <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                        {lang === 'en'
                          ? `Active Links (${model.links.length})`
                          : `Danh sách Kết nối (${model.links.length})`}
                      </div>
                      {model.links.length === 0 ? (
                        <p className="text-[11px] text-[var(--dts-ink-muted)]">
                          {lang === 'en'
                            ? 'No links yet. Click "Connect Nodes" above.'
                            : 'Chưa có kết nối nào. Hãy bật "Nối kết nối" ở thanh trên.'}
                        </p>
                      ) : (
                        model.links.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setSelection({ kind: 'link', id: l.id })}
                            className="flex w-full items-center justify-between rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] hover:border-[var(--dts-border)]"
                          >
                            <span className="font-bold">
                              {l.from} → {l.to}
                            </span>
                            <span className="text-[10px] text-[var(--dts-ink-muted)]">
                              {l.mode} · {l.carries ?? 'rw'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════ TAB 2: ARCHITECTURE ANALYZER ══════ */}
            {rightTab === 'analyzer' && (
              <div className="space-y-3">
                {/* Bottleneck Card */}
                <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                      {lang === 'en' ? 'Bottleneck Detector' : 'Điểm nghẽn hiện tại (Bottleneck)'}
                    </span>
                    {bottleneck && bottleneck.reason !== 'none' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelection({ kind: 'node', id: bottleneck.nodeId });
                          setRightTab('inspector');
                        }}
                        className="font-mono text-[10px] font-bold text-[var(--dts-blue-ink)] underline"
                      >
                        {bottleneck.nodeId}
                      </button>
                    )}
                  </div>

                  {bottleneck ? (
                    <>
                      <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
                          <div className="text-[9px] text-[var(--dts-ink-muted)]">Node</div>
                          <div className="truncate font-extrabold">{bottleneck.nodeId}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
                          <div className="text-[9px] text-[var(--dts-ink-muted)]">ρ / Headroom</div>
                          <div className="font-extrabold tabular-nums">
                            {bottleneck.rho.toFixed(2)} /{' '}
                            {bottleneck.headroom > 99
                              ? '∞'
                              : `${bottleneck.headroom.toFixed(1)}×`}
                          </div>
                        </div>
                        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
                          <div className="text-[9px] text-[var(--dts-ink-muted)]">Wait Share</div>
                          <div className="font-extrabold tabular-nums">
                            {Math.round(bottleneck.latencyShare * 100)}%
                          </div>
                        </div>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                        {explainBottleneckReason(
                          bottleneck.reason,
                          pick(
                            model.nodes.find((n) => n.id === bottleneck.nodeId)?.label ?? {
                              vi: bottleneck.nodeId,
                              en: bottleneck.nodeId,
                            },
                            lang
                          ),
                          bottleneck.rho,
                          lang
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-[var(--dts-ink-muted)]">
                      {lang === 'en'
                        ? 'Connect Client to downstream services to analyze bottlenecks.'
                        : 'Hãy nối Client tới các tầng xử lý để phân tích điểm nghẽn.'}
                    </p>
                  )}
                </div>

                {/* SPOF Report */}
                <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                      {lang === 'en' ? 'Single Points of Failure (SPOF)' : 'Điểm lỗi đơn (SPOF)'}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-extrabold',
                        errorSpofs.length === 0
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                      )}
                    >
                      {errorSpofs.length === 0
                        ? '0 SPOF'
                        : `${errorSpofs.length} SPOF`}
                    </span>
                  </div>

                  {errorSpofs.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--dts-green-soft)] px-2.5 py-2 text-[11px] font-medium text-[var(--dts-green-ink)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? 'No critical single points of failure detected on active paths.'
                          : 'Không phát hiện điểm lỗi đơn nghiêm trọng nào trên đường xử lý chính.'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {errorSpofs.map((s) => {
                        const nd = model.nodes.find((x) => x.id === s.nodeId);
                        return (
                          <button
                            key={s.nodeId}
                            type="button"
                            onClick={() => {
                              setSelection({ kind: 'node', id: s.nodeId });
                              setRightTab('inspector');
                            }}
                            className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)] p-2 text-left hover:border-[var(--dts-border)]"
                          >
                            <div className="font-mono text-[11px] font-extrabold text-[var(--dts-rose-ink)]">
                              {nd ? pick(nd.label, lang) : s.nodeId} ({s.nodeId})
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--dts-ink-soft)]">
                              {s.cuts.length > 0
                                ? lang === 'en'
                                  ? `Isolates downstream: ${s.cuts.join(', ')}`
                                  : `Làm cô lập các thành phần phía sau: ${s.cuts.join(', ')}`
                                : lang === 'en'
                                  ? 'Single un-replicated stateful node.'
                                  : 'Thành phần lưu trữ trạng thái chưa có bản sao dự phòng.'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Structural Warnings */}
                <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-2">
                  <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {lang === 'en'
                      ? `Structural Guidance (${integrityIssues.length + warnings.filter((w) => w.code !== 'SPOF').length})`
                      : `Khuyến nghị cấu trúc (${integrityIssues.length + warnings.filter((w) => w.code !== 'SPOF').length})`}
                  </div>

                  {integrityIssues.length > 0 && (
                    <div className="space-y-1.5">
                      {integrityIssues.map((issue, idx) => (
                        <button
                          key={`integrity-${issue.code}-${issue.nodeId ?? idx}`}
                          type="button"
                          onClick={() => {
                            if (issue.nodeId) {
                              setSelection({ kind: 'node', id: issue.nodeId });
                              setRightTab('inspector');
                            }
                          }}
                          className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)] p-2 text-left transition-colors hover:border-[var(--dts-border)]"
                        >
                          <div className="font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                            {lang === 'en' ? 'Data never reaches storage' : 'Dữ liệu không tới nơi lưu trữ'}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-[var(--dts-ink-soft)]">
                            {pick(issue.message, lang)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {warnings.filter((w) => w.code !== 'SPOF').length === 0 ? (
                    integrityIssues.length > 0 ? null : (
                    <p className="text-[11px] text-[var(--dts-ink-muted)]">
                      {lang === 'en'
                        ? 'No structural warnings! Timeouts, jitter, and resilience settings look solid.'
                        : 'Không có cảnh báo cấu trúc nào. Các thiết lập timeout, jitter và bảo vệ đều hợp lý.'}
                    </p>
                    )
                  ) : (
                    <div className="space-y-1.5">
                      {warnings
                        .filter((w) => w.code !== 'SPOF')
                        .map((w, idx) => {
                          const fmt = formatStructuralWarning(w, model, lang);
                          return (
                            <button
                              key={`${w.code}-${w.nodeId ?? w.linkId ?? idx}`}
                              type="button"
                              onClick={() => {
                                if (w.nodeId) {
                                  setSelection({ kind: 'node', id: w.nodeId });
                                  setRightTab('inspector');
                                } else if (w.linkId) {
                                  setSelection({ kind: 'link', id: w.linkId });
                                  setRightTab('inspector');
                                }
                              }}
                              className={cn(
                                'w-full rounded-lg border border-[var(--dts-line-strong)] p-2 text-left transition-colors hover:border-[var(--dts-border)]',
                                w.severity === 'error'
                                  ? 'bg-[var(--dts-rose-soft)]'
                                  : w.severity === 'warn'
                                    ? 'bg-[var(--dts-amber-soft)]'
                                    : 'bg-[var(--dts-panel)]'
                              )}
                            >
                              <div className="font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                                {fmt.title}
                              </div>
                              <p className="mt-0.5 text-[11px] leading-snug text-[var(--dts-ink-soft)]">
                                {fmt.detail}
                              </p>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════ TAB 3: CHALLENGE GRADING PANEL ══════ */}
            {rightTab === 'grade' && (
              <div className="space-y-3">
                {!activeChallenge ? (
                  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-2.5">
                    <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                      {lang === 'en'
                        ? 'Choose a Graded Design Challenge'
                        : 'Chọn một Thử thách Thiết kế có chấm điểm'}
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                      {lang === 'en'
                        ? `You are currently in Free Sandbox mode. Pick one of the ${LAB_CHALLENGES.length} graded challenges below to test your architecture against latency, error, SPOF, and cost constraints:`
                        : `Bạn đang ở chế độ Sandbox Tự do. Hãy chọn 1 trong ${LAB_CHALLENGES.length} bài toán dưới đây để thiết kế và chấm điểm tự động theo SLO, cấu trúc và ngân sách:`}
                    </p>
                    <div className="space-y-1.5">
                      {LAB_CHALLENGES.map((ch) => {
                        const prevStars = sdExercises[ch.id]?.stars ?? 0;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelectTemplate(ch.id)}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 text-left hover:border-[var(--dts-border)]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <LabLevelBadge level={ch.level} lang={lang} />
                                <span className="min-w-0 truncate font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                                  {ch.code}: {pick(ch.title, lang)}
                                </span>
                              </div>
                              <div className="mt-0.5 line-clamp-2 text-[11px] text-[var(--dts-ink-muted)]">
                                {pick(ch.summary, lang)}
                              </div>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-bold text-amber-500">
                              {'★'.repeat(prevStars)}
                              {'☆'.repeat(3 - prevStars)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] p-3 space-y-2.5 shadow-[1.5px_2px_0_var(--dts-shadow-color)]">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-mono text-[10px] font-extrabold uppercase text-[var(--dts-blue-ink)]">
                            {activeChallenge.code} · DESIGN-CONSTRAINT
                          </div>
                          <div className="font-mono text-xs font-extrabold text-[var(--dts-ink)]">
                            {pick(activeChallenge.title, lang)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleGradeDesign}
                          className="dts-btn-tactile shrink-0 inline-flex items-center gap-1 rounded-xl bg-[var(--dts-blue-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--dts-blue-ink)]"
                        >
                          <Sparkles className="h-3.5 w-3.5 shrink-0" />
                          <span>{lang === 'en' ? 'Run Grader' : 'Chấm thiết kế'}</span>
                        </button>
                      </div>

                      {gradeReport ? (
                        <div
                          className={cn(
                            'rounded-xl border p-2.5',
                            gradeReport.passed
                              ? 'border-[var(--dts-border)] bg-[var(--dts-green-soft)]'
                              : 'border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    'h-4 w-4',
                                    s <= gradeReport.stars
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-[var(--dts-ink-muted)]/40'
                                  )}
                                />
                              ))}
                              <span className="ml-1 font-mono text-xs font-extrabold">
                                {gradeReport.score}/100
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-extrabold">
                              ${gradeReport.costPerHour.toFixed(2)}/h
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11.5px] leading-snug text-[var(--dts-ink)]">
                            {pick(gradeReport.summary, lang)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--dts-ink-muted)]">
                          {lang === 'en'
                            ? 'Click "Run Grader" to simulate all scenarios and verify every constraint.'
                            : 'Nhấn "Chấm thiết kế" để chạy mô phỏng toàn bộ kịch bản và kiểm tra bảng ràng buộc.'}
                        </p>
                      )}
                    </div>

                    {gradeReport && gradeReport.rows.length > 0 && (
                      <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] overflow-hidden">
                        <div className="border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                          {lang === 'en'
                            ? 'Constraint Evaluation Table'
                            : 'Bảng đối chiếu Ràng buộc'}
                        </div>
                        <div className="divide-y divide-[var(--dts-line-strong)]">
                          {gradeReport.rows.map((row) => (
                            <div key={row.id} className="p-2.5 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  {row.pass ? (
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f855a]" />
                                  ) : (
                                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#dc3d43]" />
                                  )}
                                  <div className="min-w-0">
                                    {row.scenarioLabel && (
                                      <div className="font-mono text-[9.5px] text-[var(--dts-ink-muted)]">
                                        {pick(row.scenarioLabel, lang)}
                                      </div>
                                    )}
                                    <div className="text-[11.5px] font-bold text-[var(--dts-ink)] leading-snug">
                                      {pick(row.label, lang)}
                                      {!row.required && (
                                        <span className="ml-1 rounded bg-[var(--dts-amber-soft)] px-1 py-0.2 font-mono text-[9px] text-[var(--dts-amber-ink)]">
                                          +★
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {row.category === 'integrity' && !row.pass ? (
                                <p className="pl-5 text-[11px] leading-snug text-[#dc3d43]">
                                  {pick(row.actual, lang)}
                                </p>
                              ) : (
                              <div className="flex items-center justify-between gap-2 pl-5 font-mono text-[10.5px]">
                                <span
                                  className={cn(
                                    'font-bold',
                                    row.pass
                                      ? 'text-[var(--dts-ink-soft)]'
                                      : 'text-[#dc3d43]'
                                  )}
                                >
                                  {lang === 'en' ? 'Actual: ' : 'Thực tế: '}
                                  {pick(row.actual, lang)}
                                </span>
                                <span className="text-[var(--dts-ink-muted)]">
                                  {lang === 'en' ? 'Target: ' : 'Mục tiêu: '}
                                  {pick(row.target, lang)}
                                </span>
                              </div>
                              )}

                              {row.worstAtSec !== undefined && !row.pass && (
                                <div className="pl-5">
                                  <button
                                    type="button"
                                    onClick={() => handleScrub(row.worstAtSec!)}
                                    className="font-mono text-[10px] font-bold text-[var(--dts-blue-ink)] underline"
                                  >
                                    {lang === 'en'
                                      ? `Jump to worst moment (t = ${row.worstAtSec.toFixed(1)}s)`
                                      : `Tua tới thời điểm lệch mạnh nhất (t = ${row.worstAtSec.toFixed(1)}s)`}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {gradeReport && (
                      <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 space-y-1">
                        <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                          {lang === 'en' ? 'Design Principle' : 'Nguyên lý thiết kế cốt lõi'}
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                          {pick(activeChallenge.explain, lang)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ═══════════════ CONFIRM: ghi đè canvas / xem mẫu 3★ ═══════════════ */}
      <LabConfirmDialog
        open={pendingPreset !== null}
        tone={pendingPreset === 'reference' ? 'amber' : 'default'}
        title={
          pendingPreset === 'reference'
            ? lang === 'en'
              ? 'View the 3-star reference?'
              : 'Xem kiến trúc mẫu 3★?'
            : pendingPreset === 'blank'
              ? lang === 'en'
                ? 'Replace canvas with a blank one?'
                : 'Thay canvas bằng canvas trống?'
              : lang === 'en'
                ? 'Reset to the starter design?'
                : 'Đặt lại về bản khởi điểm?'
        }
        body={
          <>
            {pendingPreset === 'reference' && (
              <p>
                {lang === 'en'
                  ? 'Opening the reference solution permanently marks this lab as "solution viewed". It reduces the XP and stars you can earn here, and this cannot be undone.'
                  : 'Mở lời giải mẫu sẽ đánh dấu vĩnh viễn bài này là "đã xem đáp án": XP và số sao nhận được ở bài này bị giảm, và không thể hoàn tác.'}
              </p>
            )}
            <p>
              {lang === 'en'
                ? 'Your current canvas will be replaced. You can still bring it back with Undo (Ctrl/Cmd+Z) until you switch lab.'
                : 'Canvas hiện tại sẽ bị thay thế. Bạn vẫn có thể khôi phục bằng Hoàn tác (Ctrl/Cmd+Z) cho tới khi đổi bài.'}
            </p>
          </>
        }
        confirmLabel={
          pendingPreset === 'reference'
            ? lang === 'en'
              ? 'View reference'
              : 'Vẫn xem mẫu'
            : lang === 'en'
              ? 'Replace canvas'
              : 'Thay canvas'
        }
        cancelLabel={lang === 'en' ? 'Cancel' : 'Huỷ'}
        onConfirm={confirmPendingPreset}
        onCancel={() => setPendingPreset(null)}
      />
    </div>
  );
};

/* ─────────────────────────── SUB-COMPONENTS ─────────────────────────── */

const KpiPill: React.FC<{
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'ok' | 'warn' | 'bad';
}> = ({ label, value, sub, tone = 'default' }) => (
  <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1.5">
    <div className="truncate font-mono text-[9.5px] font-bold text-[var(--dts-ink-muted)]">
      {label}
    </div>
    <div
      className={cn(
        'font-mono text-sm font-extrabold tabular-nums leading-tight',
        tone === 'bad'
          ? 'text-[#dc3d43]'
          : tone === 'warn'
            ? 'text-[#d9822b]'
            : tone === 'ok'
              ? 'text-[var(--dts-green-ink)]'
              : 'text-[var(--dts-ink)]'
      )}
    >
      {value}
    </div>
    {sub && (
      <div className="truncate font-mono text-[9.5px] text-[var(--dts-ink-muted)]">
        {sub}
      </div>
    )}
  </div>
);

interface NodeInspectorFormProps {
  node: NodeSpec;
  route: RouteMode;
  nf?: SimFrame['nodes'][string];
  locked: boolean;
  lang: WorkbenchLang;
  onUpdate: (mutator: (n: NodeSpec) => NodeSpec) => void;
  onUpdateRoute: (route: RouteMode) => void;
  onStartConnect: () => void;
  onDelete: () => void;
}

const NodeInspectorForm: React.FC<NodeInspectorFormProps> = ({
  node,
  route,
  nf,
  locked,
  lang,
  onUpdate,
  onUpdateRoute,
  onStartConnect,
  onDelete,
}) => {
  const setParam = (key: string, val: KnobValue | undefined) => {
    onUpdate((n) => {
      if (val === undefined) {
        delete n.params[key];
      } else {
        n.params[key] = val;
      }
      if (key === 'replicas' && typeof val === 'number') {
        n.replicas = val;
      }
      return n;
    });
  };

  const replicas = effReplicas(node);
  const sizeFactor = typeof node.params.sizeFactor === 'number' ? node.params.sizeFactor : 1;
  const shards =
    node.kind === 'nosql'
      ? Math.max(1, Math.round(Number(node.params.shards ?? 1)))
      : 1;
  const concDefault = Math.max(
    1,
    Math.ceil((node.capacity.opsPerSec * node.latency.baseMs) / 1000)
  );
  const poolVal =
    typeof node.params.poolSize === 'number' ? node.params.poolSize : concDefault;
  const sSec = node.latency.baseMs / 1000;
  const muPerInstance =
    sizeFactor *
    Math.min(node.capacity.opsPerSec, sSec > 0 ? poolVal / sSec : Number.POSITIVE_INFINITY);
  const effectiveMu = Math.round(replicas * muPerInstance * shards);
  const nodeHourlyCost =
    replicas * Math.pow(sizeFactor, 1.2) * node.costPerHour;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase text-[var(--dts-ink-muted)]">
            NODE · {node.kind} · id: {node.id}
          </div>
          <div className="truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            {pick(node.label, lang)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onStartConnect}
            title={lang === 'en' ? 'Connect from this node' : 'Nối dây từ thành phần này'}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--dts-border)] bg-[var(--dts-green-soft)] px-2 py-1 font-mono text-[10px] font-extrabold text-[var(--dts-green-ink)]"
          >
            <Link2 className="h-3 w-3" />
            <span>+→</span>
          </button>
          {!locked && (
            <button
              type="button"
              onClick={onDelete}
              title={lang === 'en' ? 'Delete node (Del)' : 'Xoá thành phần (Del)'}
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)] text-[var(--dts-rose-ink)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Live node metrics snapshot */}
      {nf && node.kind !== 'client' && (
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10.5px]">
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">ρ / State</div>
            <div className="font-extrabold">
              {nf.rho.toFixed(2)} · {nf.state}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">λ / μ_tot</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(nf.lambda)} / {effectiveMu}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">p99 / Cost</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(nf.latency.p99)}ms · ${nodeHourlyCost.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Core fields: Label, Replicas, Ops/s, Base Latency, Zone, Route */}
      <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5 space-y-2.5">
        <div>
          <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
            {lang === 'en' ? 'Display Label' : 'Tên hiển thị'}
          </label>
          <input
            type="text"
            value={lang === 'en' ? node.label.en : node.label.vi}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate((n) => {
                n.label = { vi: val, en: val };
                return n;
              });
            }}
            className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--dts-ink)]"
          />
        </div>

        {node.kind !== 'client' && (
          <>
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                <span className="text-[var(--dts-ink-muted)]">
                  {lang === 'en' ? 'Replicas (1..12)' : 'Số bản sao / instance (replicas)'}
                </span>
                <span className="font-extrabold text-[var(--dts-ink)]">{replicas}</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={replicas}
                onChange={(e) => setParam('replicas', Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  opsPerSec / inst
                </label>
                <input
                  type="number"
                  min={50}
                  max={1000000}
                  step={100}
                  value={node.capacity.opsPerSec}
                  onChange={(e) => {
                    const nextOps = Math.max(10, Number(e.target.value) || 100);
                    onUpdate((n) => {
                      n.capacity.opsPerSec = nextOps;
                      // Keep poolSize uncapped unless explicitly tuned on SQL
                      if (n.kind !== 'sql' && typeof n.params.poolSize === 'number') {
                        const minPool = Math.ceil((nextOps * n.latency.baseMs) / 1000);
                        if (n.params.poolSize < minPool) n.params.poolSize = minPool;
                      }
                      return n;
                    });
                  }}
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  baseMs (ms)
                </label>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  step={0.5}
                  value={node.latency.baseMs}
                  onChange={(e) => {
                    const nextMs = Math.max(0, Number(e.target.value) || 0);
                    onUpdate((n) => {
                      n.latency.baseMs = nextMs;
                      return n;
                    });
                  }}
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  Zone / Region
                </label>
                <select
                  value={node.zone ?? 'az-a'}
                  onChange={(e) =>
                    onUpdate((n) => {
                      n.zone = e.target.value;
                      return n;
                    })
                  }
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
                >
                  <option value="az-a">az-a (Same AZ)</option>
                  <option value="az-b">az-b (Multi-AZ)</option>
                  <option value="region-eu">region-eu (+70ms)</option>
                  <option value="internet">internet (+30ms)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  {lang === 'en' ? 'Outbound Route' : 'Định tuyến ra'}
                </label>
                <select
                  value={route}
                  onChange={(e) => onUpdateRoute(e.target.value as RouteMode)}
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
                >
                  <option value="split">split (chia tải)</option>
                  <option value="all-sequential">all-sequential</option>
                  <option value="all-parallel">all-parallel</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Kind-Specific Specialized Knobs */}
      {node.kind !== 'client' && (
        <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5 space-y-2.5">
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
            {lang === 'en' ? 'Specialized Parameters' : 'Tham số chuyên biệt'}
          </div>

          {/* sizeFactor (SQL, NoSQL, Service, Search, Gateway) */}
          {(node.kind === 'sql' ||
            node.kind === 'nosql' ||
            node.kind === 'service' ||
            node.kind === 'search' ||
            node.kind === 'gateway') && (
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                <span className="text-[var(--dts-ink-muted)]">
                  sizeFactor (Scale-up 1..4×)
                </span>
                <span className="font-extrabold">×{sizeFactor}</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={sizeFactor}
                onChange={(e) => setParam('sizeFactor', Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
              />
            </div>
          )}

          {/* poolSize (SQL, Service) */}
          {(node.kind === 'sql' || node.kind === 'service') && (
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                <span className="text-[var(--dts-ink-muted)]">
                  poolSize (Connection Pool)
                </span>
                <span className="font-extrabold">{poolVal}</span>
              </div>
              <input
                type="range"
                min={2}
                max={128}
                step={1}
                value={poolVal}
                onChange={(e) => setParam('poolSize', Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
              />
            </div>
          )}

          {/* Cache & CDN knobs: capacityKeys, ttlSec, ttlJitterPct, singleflight */}
          {(node.kind === 'cache' || node.kind === 'cdn') && (
            <>
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                  <span className="text-[var(--dts-ink-muted)]">capacityKeys</span>
                  <span className="font-extrabold">
                    {Number(node.params.capacityKeys ?? 100000).toLocaleString('en-US')}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={500000}
                  step={10000}
                  value={Number(node.params.capacityKeys ?? 100000)}
                  onChange={(e) => setParam('capacityKeys', Number(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                    ttlSec (s)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={86400}
                    step={15}
                    value={Number(node.params.ttlSec ?? 300)}
                    onChange={(e) =>
                      setParam('ttlSec', Math.max(5, Number(e.target.value) || 60))
                    }
                    className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                    ttlJitterPct (0..0.5)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={Number(node.params.ttlJitterPct ?? 0)}
                    onChange={(e) =>
                      setParam(
                        'ttlJitterPct',
                        Math.max(0, Math.min(0.5, Number(e.target.value) || 0))
                      )
                    }
                    className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] font-bold">
                <span>singleflight (Request Coalescing)</span>
                <input
                  type="checkbox"
                  checked={Boolean(node.params.singleflight)}
                  onChange={(e) => setParam('singleflight', e.target.checked)}
                  className="h-4 w-4 accent-[var(--dts-blue-ink)]"
                />
              </label>
            </>
          )}

          {/* DNS ttlSec */}
          {node.kind === 'dns' && (
            <div>
              <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                ttlSec (DNS Record TTL)
              </label>
              <input
                type="number"
                min={1}
                max={86400}
                step={5}
                value={Number(node.params.ttlSec ?? 60)}
                onChange={(e) =>
                  setParam('ttlSec', Math.max(1, Number(e.target.value) || 60))
                }
                className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
              />
            </div>
          )}

          {/* NoSQL shards */}
          {node.kind === 'nosql' && (
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                <span className="text-[var(--dts-ink-muted)]">shards (1..32)</span>
                <span className="font-extrabold">{shards} shards</span>
              </div>
              <input
                type="range"
                min={1}
                max={32}
                step={1}
                value={shards}
                onChange={(e) => setParam('shards', Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
              />
            </div>
          )}

          {/* NoSQL hot-key salting */}
          {node.kind === 'nosql' && (
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                <span className="text-[var(--dts-ink-muted)]">
                  {lang === 'en' ? 'hotKeySalt (key splitting 1..16)' : 'hotKeySalt (chia nhỏ khoá nóng 1..16)'}
                </span>
                <span className="font-extrabold">
                  ×{Math.max(1, Math.round(Number(node.params.hotKeySalt ?? 1)))}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                step={1}
                value={Math.max(1, Math.round(Number(node.params.hotKeySalt ?? 1)))}
                onChange={(e) => setParam('hotKeySalt', Number(e.target.value))}
                className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
              />
              <div className="mt-0.5 text-[10px] text-[var(--dts-ink-muted)]">
                {lang === 'en'
                  ? 'Splits one hot key into N sub-keys across shards (reads then scatter-gather N sub-keys).'
                  : 'Chia một khoá nóng thành N khoá con rải trên nhiều shard (đổi lại đọc phải gom từ N khoá con).'}
              </div>
            </div>
          )}

          {/* Queue dlq */}
          {node.kind === 'queue' && (
            <label className="flex items-center justify-between rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] font-bold">
              <span>dlq (Dead-Letter Queue)</span>
              <input
                type="checkbox"
                checked={Boolean(node.params.dlq)}
                onChange={(e) => setParam('dlq', e.target.checked)}
                className="h-4 w-4 accent-[var(--dts-blue-ink)]"
              />
            </label>
          )}

          {/* Rate Limiter: ratePerSec, burst */}
          {node.kind === 'rate-limiter' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  ratePerSec (RPS)
                </label>
                <input
                  type="number"
                  min={50}
                  max={200000}
                  step={100}
                  value={Number(node.params.ratePerSec ?? 1000)}
                  onChange={(e) =>
                    setParam('ratePerSec', Math.max(10, Number(e.target.value) || 100))
                  }
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  burst (tokens)
                </label>
                <input
                  type="number"
                  min={10}
                  max={100000}
                  step={50}
                  value={Number(node.params.burst ?? 100)}
                  onChange={(e) =>
                    setParam('burst', Math.max(1, Number(e.target.value) || 50))
                  }
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Load Balancer: algorithm, healthCheckSec */}
          {node.kind === 'lb' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  algorithm
                </label>
                <select
                  value={String(node.params.algorithm ?? 'round-robin')}
                  onChange={(e) => setParam('algorithm', e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
                >
                  <option value="round-robin">round-robin</option>
                  <option value="least-conn">least-conn</option>
                  <option value="weighted">weighted</option>
                  <option value="random">random</option>
                  <option value="ip-hash">ip-hash</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
                  healthCheckSec (s)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={Number(node.params.healthCheckSec ?? 3)}
                  onChange={(e) =>
                    setParam('healthCheckSec', Math.max(1, Number(e.target.value) || 3))
                  }
                  className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-xs font-bold"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface LinkInspectorFormProps {
  link: LinkSpec;
  lf?: SimFrame['links'][string];
  cacheNodes: NodeSpec[];
  lang: WorkbenchLang;
  onUpdate: (mutator: (l: LinkSpec) => LinkSpec) => void;
  onDelete: () => void;
}

const LinkInspectorForm: React.FC<LinkInspectorFormProps> = ({
  link,
  lf,
  cacheNodes,
  lang,
  onUpdate,
  onDelete,
}) => {
  const retryPreset = detectRetryPreset(link.retry);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase text-[var(--dts-ink-muted)]">
            LINK · {link.id}
          </div>
          <div className="truncate font-mono text-xs font-extrabold text-[var(--dts-ink)]">
            {link.from} → {link.to}
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          title={lang === 'en' ? 'Delete link (Del)' : 'Xoá kết nối (Del)'}
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-rose-soft)] text-[var(--dts-rose-ink)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Live link telemetry */}
      {lf && (
        <div className="grid grid-cols-3 gap-1.5 font-mono text-[10.5px]">
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Flow RPS</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(lf.rps).toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Goodput</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(lf.throughput).toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Error %</div>
            <div className="font-extrabold tabular-nums">
              {(lf.errorRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Link Configuration */}
      <div className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-2.5 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              mode
            </label>
            <select
              title={pick(LINK_MODE_HELP[link.mode], lang)}
              value={link.mode}
              onChange={(e) => {
                const nextMode = e.target.value as LinkSpec['mode'];
                onUpdate((l) => {
                  l.mode = nextMode;
                  if (nextMode !== 'sync') {
                    delete l.timeoutMs;
                  } else if (l.timeoutMs === undefined) {
                    l.timeoutMs = 1000;
                  }
                  return l;
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
            >
              <option value="sync" title={pick(LINK_MODE_HELP.sync, lang)}>
                {lang === 'en' ? 'sync (caller waits)' : 'sync (đồng bộ)'}
              </option>
              <option value="async" title={pick(LINK_MODE_HELP.async, lang)}>
                {lang === 'en' ? 'async (fire-and-forget)' : 'async (bất đồng bộ)'}
              </option>
              <option value="pull" title={pick(LINK_MODE_HELP.pull, lang)}>
                pull (Queue → Worker)
              </option>
              <option value="replicate" title={pick(LINK_MODE_HELP.replicate, lang)}>
                {lang === 'en' ? 'replicate (data copy)' : 'replicate (nhân bản dữ liệu)'}
              </option>
            </select>
            <p className="mt-1 text-[10.5px] leading-snug text-[var(--dts-ink-muted)]">
              {pick(LINK_MODE_HELP[link.mode], lang)}
            </p>
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              carries
            </label>
            <select
              title={pick(LINK_CARRIES_HELP[link.carries ?? 'rw'], lang)}
              value={link.carries ?? 'rw'}
              onChange={(e) => {
                const nextCarries = e.target.value as 'rw' | 'r' | 'w';
                onUpdate((l) => {
                  l.carries = nextCarries;
                  return l;
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
            >
              <option value="rw" title={pick(LINK_CARRIES_HELP.rw, lang)}>
                {lang === 'en' ? 'rw (read + write)' : 'rw (Đọc + Ghi)'}
              </option>
              <option value="r" title={pick(LINK_CARRIES_HELP.r, lang)}>
                {lang === 'en' ? 'r (read only)' : 'r (Chỉ đọc)'}
              </option>
              <option value="w" title={pick(LINK_CARRIES_HELP.w, lang)}>
                {lang === 'en' ? 'w (write only)' : 'w (Chỉ ghi)'}
              </option>
            </select>
            <p className="mt-1 text-[10.5px] leading-snug text-[var(--dts-ink-muted)]">
              {pick(LINK_CARRIES_HELP[link.carries ?? 'rw'], lang)}
            </p>
          </div>
        </div>

        {/* Timeout + Cancel on Timeout */}
        <div className="space-y-1.5 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold">
            <span>timeoutMs</span>
            <input
              type="checkbox"
              checked={link.timeoutMs !== undefined}
              onChange={(e) =>
                onUpdate((l) => {
                  l.timeoutMs = e.target.checked ? 1000 : undefined;
                  return l;
                })
              }
              className="h-4 w-4 accent-[var(--dts-blue-ink)]"
            />
          </div>
          {link.timeoutMs !== undefined && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={link.timeoutMs}
                onChange={(e) =>
                  onUpdate((l) => {
                    l.timeoutMs = Number(e.target.value);
                    return l;
                  })
                }
                className="grow cursor-pointer accent-[var(--dts-blue-ink)]"
              />
              <span className="w-14 text-right font-mono text-[11px] font-extrabold tabular-nums">
                {link.timeoutMs} ms
              </span>
            </div>
          )}

          <label className="flex items-center justify-between pt-1 font-mono text-[10.5px] font-bold text-[var(--dts-ink-soft)]">
            <span>cancelOnTimeout</span>
            <input
              type="checkbox"
              checked={Boolean(link.cancelOnTimeout)}
              onChange={(e) =>
                onUpdate((l) => {
                  l.cancelOnTimeout = e.target.checked;
                  return l;
                })
              }
              className="h-3.5 w-3.5 accent-[var(--dts-blue-ink)]"
            />
          </label>
        </div>

        {/* Retry Preset & Fallback */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              retry
            </label>
            <select
              value={retryPreset}
              onChange={(e) => {
                const p = e.target.value as RetryPresetId;
                onUpdate((l) => {
                  l.retry = buildRetryPolicy(p);
                  return l;
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
            >
              <option value="off">Off</option>
              <option value="immediate">Immediate (×2, no backoff)</option>
              <option value="exp-jitter-budget">Exp + Jitter + Budget</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              fallback
            </label>
            <select
              value={link.fallback ?? 'error'}
              onChange={(e) => {
                const fb = e.target.value as 'error' | 'bypass' | 'degrade';
                onUpdate((l) => {
                  l.fallback = fb;
                  return l;
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
            >
              <option value="error">error</option>
              <option value="bypass">bypass</option>
              <option value="degrade">degrade</option>
            </select>
          </div>
        </div>

        {/* Circuit Breaker toggle */}
        <label className="flex items-center justify-between rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 py-1.5 font-mono text-[11px] font-bold">
          <span>
            Circuit Breaker {lf?.breaker ? `(${lf.breaker})` : ''}
          </span>
          <input
            type="checkbox"
            checked={Boolean(link.breaker)}
            onChange={(e) =>
              onUpdate((l) => {
                l.breaker = e.target.checked
                  ? structuredClone(DEFAULT_BREAKER_POLICY)
                  : undefined;
                return l;
              })
            }
            className="h-4 w-4 accent-[var(--dts-blue-ink)]"
          />
        </label>

        {/* Cache-Aside `onMissOf` selector */}
        {cacheNodes.length > 0 && (
          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              {lang === 'en' ? 'onMissOf (Cache-Aside)' : 'Chỉ gọi khi Cache Miss (onMissOf)'}
            </label>
            <select
              value={link.onMissOf ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onUpdate((l) => {
                  l.onMissOf = v ? v : undefined;
                  return l;
                });
              }}
              className="mt-0.5 w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1 font-mono text-[11px] font-bold"
            >
              <option value="">
                {lang === 'en' ? 'None (always forward)' : 'Không (gửi mọi lượt)'}
              </option>
              {cacheNodes.map((cnNode) => (
                <option key={cnNode.id} value={cnNode.id}>
                  {cnNode.id} ({pick(cnNode.label, lang)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default SdLabView;
