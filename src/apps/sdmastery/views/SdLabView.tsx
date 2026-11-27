import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  FlaskConical,
  Gauge,
  Globe,
  HardDrive,
  HelpCircle,
  Layers,
  Link2,
  Lock,
  Pause,
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
  LAB_GRID_COLS,
  LAB_GRID_ROWS,
  LAB_SANDBOX_PRESET,
  type BiText,
  type GridPos,
  type LabCanvasPreset,
  type LabChallengeSpec,
  type LabGradeReport,
} from '../data/labChallenges';

/* ─────────────────────────── CONSTANTS & METADATA ─────────────────────────── */

const CELL_W = 156;
const CELL_H = 114;
const BOARD_W = LAB_GRID_COLS * CELL_W; // 1092
const BOARD_H = LAB_GRID_ROWS * CELL_H; // 570
const CARD_W = 138;
const CARD_H = 96;

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
  preferredCols: number[];
  toneClass: string;
  icon: React.FC<{ className?: string }>;
}

const PALETTE_ITEMS: PaletteItemMeta[] = [
  {
    kind: 'client',
    label: { vi: 'Client', en: 'Client' },
    shortRole: { vi: 'Nguồn phát lưu lượng', en: 'Traffic generator' },
    preferredCols: [0],
    toneClass: 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink)]',
    icon: Users,
  },
  {
    kind: 'dns',
    label: { vi: 'DNS', en: 'DNS' },
    shortRole: { vi: 'Phân giải tên miền', en: 'Domain resolution' },
    preferredCols: [1, 0],
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Globe,
  },
  {
    kind: 'cdn',
    label: { vi: 'CDN Edge', en: 'CDN Edge' },
    shortRole: { vi: 'Cache nội dung tại biên', en: 'Edge content cache' },
    preferredCols: [1, 2],
    toneClass: 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)]',
    icon: Zap,
  },
  {
    kind: 'rate-limiter',
    label: { vi: 'Rate Limiter', en: 'Rate Limiter' },
    shortRole: { vi: 'Kiểm soát tốc độ (Token Bucket)', en: 'Token bucket admission' },
    preferredCols: [1, 2],
    toneClass: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]',
    icon: Shield,
  },
  {
    kind: 'lb',
    label: { vi: 'Load Balancer', en: 'Load Balancer' },
    shortRole: { vi: 'Chia tải giữa các backend', en: 'Distributes backend traffic' },
    preferredCols: [1, 2, 3],
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Split,
  },
  {
    kind: 'gateway',
    label: { vi: 'API Gateway', en: 'API Gateway' },
    shortRole: { vi: 'Xác thực & định tuyến API', en: 'API auth & routing' },
    preferredCols: [2, 1, 3],
    toneClass: 'bg-[var(--dts-blue-soft)] text-[var(--dts-blue-ink)]',
    icon: Router,
  },
  {
    kind: 'service',
    label: { vi: 'App Service', en: 'App Service' },
    shortRole: { vi: 'Xử lý nghiệp vụ stateless', en: 'Stateless app compute' },
    preferredCols: [3, 2, 4],
    toneClass: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]',
    icon: Server,
  },
  {
    kind: 'cache',
    label: { vi: 'Redis Cache', en: 'Redis Cache' },
    shortRole: { vi: 'Bộ nhớ đệm đọc tốc độ cao', en: 'In-memory key-value cache' },
    preferredCols: [4, 3, 5],
    toneClass: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]',
    icon: Cpu,
  },
  {
    kind: 'queue',
    label: { vi: 'Message Queue', en: 'Message Queue' },
    shortRole: { vi: 'Đệm tải ghi bất đồng bộ', en: 'Async message buffer' },
    preferredCols: [4, 3, 5],
    toneClass: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)]',
    icon: Workflow,
  },
  {
    kind: 'worker',
    label: { vi: 'Async Worker', en: 'Async Worker' },
    shortRole: { vi: 'Tiêu thụ message từ Queue', en: 'Pull consumer from Queue' },
    preferredCols: [5, 4, 6],
    toneClass: 'bg-[var(--dts-purple-soft)] text-[var(--dts-purple-ink)]',
    icon: Layers,
  },
  {
    kind: 'sql',
    label: { vi: 'SQL Database', en: 'SQL Database' },
    shortRole: { vi: 'CSDL quan hệ ACID', en: 'Relational ACID database' },
    preferredCols: [5, 6, 4],
    toneClass: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]',
    icon: Database,
  },
  {
    kind: 'nosql',
    label: { vi: 'NoSQL Store', en: 'NoSQL Store' },
    shortRole: { vi: 'Lưu trữ phân mảnh ngang', en: 'Sharded key/doc store' },
    preferredCols: [5, 6, 4],
    toneClass: 'bg-[var(--dts-orange-bg)] text-[var(--dts-orange-ink)]',
    icon: HardDrive,
  },
  {
    kind: 'search',
    label: { vi: 'Search Index', en: 'Search Index' },
    shortRole: { vi: 'Chỉ mục tìm kiếm toàn văn', en: 'Full-text search cluster' },
    preferredCols: [5, 6, 4],
    toneClass: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)]',
    icon: Search,
  },
  {
    kind: 'blob',
    label: { vi: 'Blob Storage', en: 'Blob Storage' },
    shortRole: { vi: 'Lưu trữ đối tượng / media', en: 'Object & media storage' },
    preferredCols: [6, 5, 4],
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
        return `${nodeLabel} (ρ = ${rhoStr}) suffers hot-key skew on one shard. Increase shards or add an edge/in-memory cache.`;
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
      return `${nodeLabel} (ρ = ${rhoStr}) bị lệch tải trên một phân mảnh nóng (hot shard). Hãy tăng số shard hoặc đặt Cache hấp thụ khóa nóng.`;
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

function computeOrthogonalWires(
  links: LinkSpec[],
  positions: Record<NodeId, GridPos>
): ComputedWire[] {
  const occupied = new Set<string>();
  for (const pos of Object.values(positions)) {
    occupied.add(`${pos.col},${pos.row}`);
  }

  // Group outgoing / incoming links per node to apply subtle port offsets
  const outByNode = new Map<string, string[]>();
  const inByNode = new Map<string, string[]>();
  for (const l of links) {
    if (!positions[l.from] || !positions[l.to]) continue;
    const o = outByNode.get(l.from) ?? [];
    o.push(l.id);
    outByNode.set(l.from, o);
    const inn = inByNode.get(l.to) ?? [];
    inn.push(l.id);
    inByNode.set(l.to, inn);
  }

  // Sort ports by target/source row so wires don't cross unnecessarily
  for (const [, list] of outByNode) {
    list.sort((a, b) => {
      const la = links.find((x) => x.id === a)!;
      const lb = links.find((x) => x.id === b)!;
      return (positions[la.to]?.row ?? 0) - (positions[lb.to]?.row ?? 0);
    });
  }
  for (const [, list] of inByNode) {
    list.sort((a, b) => {
      const la = links.find((x) => x.id === a)!;
      const lb = links.find((x) => x.id === b)!;
      return (positions[la.from]?.row ?? 0) - (positions[lb.from]?.row ?? 0);
    });
  }

  return links.flatMap((link, linkIdx): ComputedWire[] => {
    const p1 = positions[link.from];
    const p2 = positions[link.to];
    if (!p1 || !p2) return [];

    const cx1 = p1.col * CELL_W + CELL_W / 2;
    const cy1 = p1.row * CELL_H + CELL_H / 2;
    const cx2 = p2.col * CELL_W + CELL_W / 2;
    const cy2 = p2.row * CELL_H + CELL_H / 2;

    const outs = outByNode.get(link.from) ?? [link.id];
    const ins = inByNode.get(link.to) ?? [link.id];
    const outOffset = (outs.indexOf(link.id) - (outs.length - 1) / 2) * 12;
    const inOffset = (ins.indexOf(link.id) - (ins.length - 1) / 2) * 12;

    let pts: [number, number][];
    let labelX: number;
    let labelY: number;

    if (p2.col > p1.col) {
      const xStart = cx1 + CARD_W / 2;
      const yStart = cy1 + outOffset;
      const xEnd = cx2 - CARD_W / 2;
      const yEnd = cy2 + inOffset;

      // Check if same row has an intermediate occupied card blocking straight horizontal line
      let blockedSameRow = false;
      if (p1.row === p2.row && p2.col - p1.col > 1) {
        for (let c = p1.col + 1; c < p2.col; c++) {
          if (occupied.has(`${c},${p1.row}`)) {
            blockedSameRow = true;
            break;
          }
        }
      }

      if (blockedSameRow) {
        const alleyY =
          p1.row > 0
            ? p1.row * CELL_H + 3
            : (p1.row + 1) * CELL_H - 3;
        const stub1 = xStart + 10;
        const stub2 = xEnd - 10;
        pts = [
          [xStart, yStart],
          [stub1, yStart],
          [stub1, alleyY],
          [stub2, alleyY],
          [stub2, yEnd],
          [xEnd, yEnd],
        ];
        labelX = (stub1 + stub2) / 2;
        labelY = alleyY;
      } else {
        const channelOffset = ((linkIdx % 3) - 1) * 4;
        const midX = (xStart + xEnd) / 2 + channelOffset;
        pts = [
          [xStart, yStart],
          [midX, yStart],
          [midX, yEnd],
          [xEnd, yEnd],
        ];
        labelX = midX;
        labelY = (yStart + yEnd) / 2;
      }
    } else if (p2.col === p1.col) {
      // Same column (e.g. Primary SQL -> Standby SQL)
      const goingDown = p2.row >= p1.row;
      const yStart = goingDown ? cy1 + CARD_H / 2 : cy1 - CARD_H / 2;
      const yEnd = goingDown ? cy2 - CARD_H / 2 : cy2 + CARD_H / 2;
      const xStart = cx1 + outOffset;
      const xEnd = cx2 + inOffset;

      let blockedSameCol = false;
      const rMin = Math.min(p1.row, p2.row);
      const rMax = Math.max(p1.row, p2.row);
      for (let r = rMin + 1; r < rMax; r++) {
        if (occupied.has(`${p1.col},${r}`)) {
          blockedSameCol = true;
          break;
        }
      }

      if (blockedSameCol) {
        const alleyX =
          p1.col < LAB_GRID_COLS - 1
            ? (p1.col + 1) * CELL_W - 4
            : p1.col * CELL_W + 4;
        const stub1 = yStart + (goingDown ? 8 : -8);
        const stub2 = yEnd + (goingDown ? -8 : 8);
        pts = [
          [xStart, yStart],
          [xStart, stub1],
          [alleyX, stub1],
          [alleyX, stub2],
          [xEnd, stub2],
          [xEnd, yEnd],
        ];
        labelX = alleyX;
        labelY = (stub1 + stub2) / 2;
      } else {
        const midY = (yStart + yEnd) / 2;
        pts = [
          [xStart, yStart],
          [xStart, midY],
          [xEnd, midY],
          [xEnd, yEnd],
        ];
        labelX = (xStart + xEnd) / 2;
        labelY = midY;
      }
    } else {
      // Right-to-left connection: route cleanly through horizontal inter-row alley
      const xStart = cx1 - CARD_W / 2;
      const yStart = cy1 + outOffset;
      const xEnd = cx2 + CARD_W / 2;
      const yEnd = cy2 + inOffset;
      const alleyRow = Math.max(p1.row, p2.row);
      const alleyY =
        alleyRow < LAB_GRID_ROWS - 1
          ? (alleyRow + 1) * CELL_H - 4
          : alleyRow * CELL_H + 4;
      if (p1.row !== p2.row) {
        const midX = (xStart + xEnd) / 2;
        pts = [
          [xStart, yStart],
          [midX, yStart],
          [midX, yEnd],
          [xEnd, yEnd],
        ];
        labelX = midX;
        labelY = (yStart + yEnd) / 2;
      } else {
        const stub1 = xStart - 10;
        const stub2 = xEnd + 10;
        pts = [
          [xStart, yStart],
          [stub1, yStart],
          [stub1, alleyY],
          [stub2, alleyY],
          [stub2, yEnd],
          [xEnd, yEnd],
        ];
        labelX = (stub1 + stub2) / 2;
        labelY = alleyY;
      }
    }

    return [
      {
        link,
        d: roundOrthogonalPoints(pts, 8),
        labelX,
        labelY,
      },
    ];
  });
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

type SelectionState =
  | { kind: 'node'; id: NodeId }
  | { kind: 'link'; id: LinkId }
  | null;

type RightTab = 'inspector' | 'analyzer' | 'grade';

export const SdLabView: React.FC = () => {
  const lang = useWorkbenchStore((s) => s.language);
  const sdExercises = useSdProgress((s) => s.state.exercises);
  const recordActivity = useSdProgress((s) => s.recordActivity);
  const markSolutionViewed = useSdProgress((s) => s.markActivitySolutionViewed);

  // Active template ('sandbox' or challenge id)
  const [activeTemplateId, setActiveTemplateId] = useState<string>('lab-01-read-api');
  const [canvasMode, setCanvasMode] = useState<'starter' | 'blank' | 'reference'>('starter');

  const activeChallenge: LabChallengeSpec | null = useMemo(
    () => LAB_CHALLENGES.find((c) => c.id === activeTemplateId) ?? null,
    [activeTemplateId]
  );

  // Architecture canvas state
  const [model, setModel] = useState<SystemModel>(() =>
    structuredClone(LAB_CHALLENGES[0].starter.model)
  );
  const [positions, setPositions] = useState<Record<NodeId, GridPos>>(() =>
    structuredClone(LAB_CHALLENGES[0].starter.positions)
  );
  const [lockedIds, setLockedIds] = useState<ReadonlySet<string>>(
    () => new Set(LAB_CHALLENGES[0].starter.lockedNodeIds)
  );

  // Load & scenario settings
  const [loadProfile, setLoadProfile] = useState<LoadProfile>(
    () => structuredClone(LAB_CHALLENGES[0].starter.load)
  );
  const [readRatio, setReadRatio] = useState<number>(LAB_CHALLENGES[0].starter.readRatio);
  const [durationSec, setDurationSec] = useState<number>(LAB_CHALLENGES[0].starter.durationSec);

  // UI interaction states
  const [selection, setSelection] = useState<SelectionState>({ kind: 'node', id: 'app' });
  const [rightTab, setRightTab] = useState<RightTab>('inspector');
  const [connectMode, setConnectMode] = useState<boolean>(false);
  const [connectFromId, setConnectFromId] = useState<NodeId | null>(null);
  const [dragHoverCell, setDragHoverCell] = useState<GridPos | null>(null);
  const [boardZoom, setBoardZoom] = useState<number>(1);
  const [briefExpanded, setBriefExpanded] = useState<boolean>(true);
  const [hintsShown, setHintsShown] = useState<number>(0);
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

  // Escape cancels connect mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectFromId(null);
        setConnectMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ───────────── Load preset helper ───────────── */
  const applyPreset = useCallback(
    (preset: LabCanvasPreset, modeTag: 'starter' | 'blank' | 'reference') => {
      setIsPlaying(false);
      const nextModel = structuredClone(preset.model);
      setModel(nextModel);
      setPositions(structuredClone(preset.positions));
      setLockedIds(new Set(preset.lockedNodeIds));
      setLoadProfile(structuredClone(preset.load));
      setReadRatio(preset.readRatio);
      setDurationSec(preset.durationSec);
      setCanvasMode(modeTag);
      setConnectMode(false);
      setConnectFromId(null);
      setGradeReport(null);
      const firstEditable =
        nextModel.nodes.find((n) => n.kind !== 'client') ?? nextModel.nodes[0];
      setSelection(firstEditable ? { kind: 'node', id: firstEditable.id } : null);
    },
    []
  );

  const handleSelectTemplate = useCallback(
    (templateId: string, startMode: 'starter' | 'blank' = 'starter') => {
      setActiveTemplateId(templateId);
      setHintsShown(0);
      if (templateId === 'sandbox') {
        applyPreset(
          startMode === 'blank' ? LAB_BLANK_SANDBOX_PRESET : LAB_SANDBOX_PRESET,
          startMode
        );
        return;
      }
      const found = LAB_CHALLENGES.find((c) => c.id === templateId);
      if (found) {
        applyPreset(startMode === 'blank' ? found.blank : found.starter, startMode);
      }
    },
    [applyPreset]
  );

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
      events: [],
      seed: 2026,
      mix: { readRatio },
      clientTimeoutMs: 2000,
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
  }, [model, loadProfile, readRatio, durationSec, activeTemplateId, lang]);

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
  const findBestEmptyCell = useCallback(
    (kind: PrimitiveKind): GridPos | null => {
      const occupied = new Set(
        Object.values(positions).map((p) => `${p.col},${p.row}`)
      );
      const meta = KIND_META_MAP[kind];
      const colsOrder = [
        ...(meta?.preferredCols ?? [3]),
        0,
        1,
        2,
        3,
        4,
        5,
        6,
      ];
      const rowsOrder = [2, 1, 3, 0, 4];
      for (const c of colsOrder) {
        for (const r of rowsOrder) {
          if (c >= 0 && c < LAB_GRID_COLS && !occupied.has(`${c},${r}`)) {
            return { col: c, row: r };
          }
        }
      }
      return null;
    },
    [positions]
  );

  const addPrimitiveAt = useCallback(
    (kind: PaletteKind, targetCell?: GridPos) => {
      const cell = targetCell ?? findBestEmptyCell(kind);
      if (!cell) {
        showToast(
          'warn',
          lang === 'en'
            ? 'All 35 grid cells are occupied. Delete or move a component first.'
            : 'Lưới 7×5 đã kín chỗ. Hãy xoá bớt một thành phần trước khi thêm mới.'
        );
        return;
      }

      const occupiedEntry = Object.entries(positions).find(
        ([, p]) => p.col === cell.col && p.row === cell.row
      );
      const finalCell = occupiedEntry ? findBestEmptyCell(kind) : cell;
      if (!finalCell) return;

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
        [newId]: finalCell,
      }));
      setSelection({ kind: 'node', id: newId });
      setRightTab('inspector');
      setGradeReport(null);
    },
    [findBestEmptyCell, lang, model.nodes, positions, showToast]
  );

  const moveNodeToCell = useCallback(
    (nodeId: NodeId, dest: GridPos) => {
      setPositions((prev) => {
        const src = prev[nodeId];
        if (!src || (src.col === dest.col && src.row === dest.row)) return prev;
        const occupant = Object.entries(prev).find(
          ([id, p]) => id !== nodeId && p.col === dest.col && p.row === dest.row
        );
        const next = { ...prev, [nodeId]: dest };
        if (occupant) {
          next[occupant[0]] = src;
        }
        return next;
      });
    },
    []
  );

  const deleteNode = useCallback(
    (nodeId: NodeId) => {
      if (lockedIds.has(nodeId)) {
        showToast(
          'warn',
          lang === 'en'
            ? 'This entry node is locked and cannot be deleted.'
            : 'Thành phần gốc này được khoá cố định để giữ nguồn phát tải.'
        );
        return;
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
        return;
      }

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
    },
    [connectFromId, lang, lockedIds, model.nodes, selection, showToast]
  );

  /* ───────────── Connect Mode & Link CRUD ───────────── */
  const createConnection = useCallback(
    (fromId: NodeId, toId: NodeId) => {
      if (fromId === toId) {
        showToast(
          'warn',
          lang === 'en'
            ? 'Cannot connect a component to itself.'
            : 'Không thể nối một thành phần vào chính nó.'
        );
        return;
      }
      const fromNode = model.nodes.find((n) => n.id === fromId);
      const toNode = model.nodes.find((n) => n.id === toId);
      if (!fromNode || !toNode) return;

      if (model.links.some((l) => l.from === fromId && l.to === toId)) {
        showToast(
          'info',
          lang === 'en'
            ? `Link ${fromId} → ${toId} already exists.`
            : `Kết nối ${fromNode.label.vi} → ${toNode.label.vi} đã tồn tại.`
        );
        const existing = model.links.find((l) => l.from === fromId && l.to === toId)!;
        setSelection({ kind: 'link', id: existing.id });
        setRightTab('inspector');
        return;
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

      const candidateModel: SystemModel = {
        ...model,
        links: [...updatedPrevLinks, newLink],
      };

      try {
        validate(candidateModel);
      } catch (err) {
        if (err instanceof SimModelError && err.code === 'CYCLE') {
          const cyclePath = err.path ? ` (${err.path.join(' → ')})` : '';
          showToast(
            'warn',
            lang === 'en'
              ? `Cannot add link: synchronous cycle detected${cyclePath}. Use replicate mode or reverse direction.`
              : `Không thể nối kết nối: phát hiện chu trình đồng bộ${cyclePath}. Hãy chọn hướng khác hoặc dùng kết nối nhân bản (replicate).`
          );
        } else {
          showToast(
            'warn',
            err instanceof Error
              ? err.message
              : lang === 'en'
                ? 'Invalid connection.'
                : 'Kết nối không hợp lệ.'
          );
        }
        return;
      }

      setModel(candidateModel);
      setSelection({ kind: 'link', id: linkId });
      setRightTab('inspector');
      setGradeReport(null);
      if (smartHintVi) {
        showToast('ok', lang === 'en' ? smartHintEn : smartHintVi);
      }
    },
    [lang, model, showToast]
  );

  const updateNode = useCallback(
    (nodeId: NodeId, mutator: (n: NodeSpec) => NodeSpec) => {
      setModel((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? mutator(structuredClone(n)) : n)),
      }));
      setGradeReport(null);
    },
    []
  );

  const updateNodeRoute = useCallback((nodeId: NodeId, route: RouteMode) => {
    setModel((prev) => ({
      ...prev,
      routes: {
        ...(prev.routes ?? {}),
        [nodeId]: route,
      },
    }));
    setGradeReport(null);
  }, []);

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
      setModel(candidate);
      setGradeReport(null);
    },
    [lang, model, showToast]
  );

  const deleteLink = useCallback(
    (linkId: LinkId) => {
      setModel((prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== linkId),
      }));
      if (selection?.kind === 'link' && selection.id === linkId) {
        setSelection(null);
      }
      setGradeReport(null);
    },
    [selection]
  );

  /* ───────────── Live Diagnostics & Wires ───────────── */
  const wires = useMemo(
    () => computeOrthogonalWires(model.links, positions),
    [model.links, positions]
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
      return `- ${n.label.vi} [${n.kind}, id=${n.id}] @ (${pos?.col ?? 0},${pos?.row ?? 0}): replicas=${rep}, ops=${n.capacity.opsPerSec}/s, base=${n.latency.baseMs}ms${extra}`;
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
    errorSpofs.length + warnings.filter((w) => w.severity !== 'info' && w.code !== 'SPOF').length;

  /* ─────────────────────────── RENDER ─────────────────────────── */

  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      {/* ═══════════════ TOP CONTROL & SIMULATION TOOLBAR ═══════════════ */}
      <div className="shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Challenge / Sandbox selector + Starter / Blank Canvas switch */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] px-2.5 py-1 shadow-[1px_1.5px_0_var(--dts-shadow-color)]">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 text-[var(--dts-blue-ink)]" />
              <select
                aria-label={lang === 'en' ? 'Select Lab Challenge' : 'Chọn bài toán Phòng Lab'}
                value={activeTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value, 'starter')}
                className="bg-transparent font-mono text-xs font-extrabold text-[var(--dts-ink)] focus:outline-none"
              >
                <option value="sandbox">
                  {lang === 'en'
                    ? '⚡ Free Architecture Sandbox'
                    : '⚡ Sandbox Tự do (Thử nghiệm)'}
                </option>
                {LAB_CHALLENGES.map((ch) => {
                  const st = sdExercises[ch.id]?.stars ?? 0;
                  const starTag = st > 0 ? ` (${'★'.repeat(st)})` : '';
                  return (
                    <option key={ch.id} value={ch.id}>
                      {ch.code}: {pick(ch.title, lang)}
                      {starTag}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Starter Canvas vs Blank Canvas (06 §10 / T7.1) */}
            <div className="inline-flex rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    activeChallenge ? activeChallenge.starter : LAB_SANDBOX_PRESET,
                    'starter'
                  )
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
                onClick={() =>
                  applyPreset(
                    activeChallenge ? activeChallenge.blank : LAB_BLANK_SANDBOX_PRESET,
                    'blank'
                  )
                }
                className={cn(
                  'rounded-lg px-2.5 py-1 transition-colors',
                  canvasMode === 'blank'
                    ? 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-xs'
                    : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                )}
              >
                {lang === 'en' ? 'Blank Canvas' : 'Canvas trống'}
              </button>
              {activeChallenge && (
                <button
                  type="button"
                  onClick={() => {
                    markSolutionViewed(activeChallenge.id);
                    applyPreset(activeChallenge.referenceSolution, 'reference');
                  }}
                  title={
                    lang === 'en'
                      ? 'Load 3-star reference design to inspect'
                      : 'Nạp kiến trúc mẫu 3 sao để tham khảo'
                  }
                  className={cn(
                    'rounded-lg px-2 py-1 transition-colors',
                    canvasMode === 'reference'
                      ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                      : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                  )}
                >
                  {lang === 'en' ? '3★ Sample' : 'Mẫu 3★'}
                </button>
              )}
            </div>

            {/* Connect Mode toggle */}
            <button
              type="button"
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
            {/* Load Profile Control */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 text-[11px]">
              <Gauge className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink-muted)]" />
              <select
                aria-label={lang === 'en' ? 'Load Profile' : 'Dạng tải'}
                value={loadProfile.kind}
                onChange={(e) => {
                  const k = e.target.value as 'steady' | 'ramp' | 'spike';
                  if (k === 'steady') setLoadProfile({ kind: 'steady', rps: 3000 });
                  else if (k === 'ramp')
                    setLoadProfile({ kind: 'ramp', from: 500, to: 6000, overSec: 45 });
                  else
                    setLoadProfile({
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
                      setLoadProfile({ kind: 'steady', rps: Number(e.target.value) })
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
                      setLoadProfile({
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
                      setLoadProfile({
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
                      setLoadProfile({
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
                      setLoadProfile({
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
                    setReadRatio(pct / 100);
                  }}
                  className="w-11 rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-1 py-0.5 text-right font-bold text-[var(--dts-ink)]"
                />
                <span>%</span>
              </label>
            </div>

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
        <aside className="shrink-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:w-52 border-b lg:border-b-0 lg:border-r border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2">
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
                    <span className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                      {'★'.repeat(activeChallenge.difficulty)}
                      {'☆'.repeat(3 - activeChallenge.difficulty)} · {activeChallenge.xp} XP
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
                        ? 'Connect Mode active: Click source node first, then click target node'
                        : 'Chế độ Nối kết nối: Nhấn chọn thành phần nguồn trước, sau đó nhấn thành phần đích'}
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
          <div className="dts-stage-noselect relative flex-1 overflow-auto p-3 sm:p-4">
            <div
              className="mx-auto origin-top-left transition-transform duration-150"
              style={{
                width: BOARD_W * boardZoom,
                height: BOARD_H * boardZoom,
              }}
            >
              <div
                className="relative rounded-2xl border-2 border-[var(--dts-line-strong)] bg-[var(--dts-stage-bg)] shadow-inner"
                style={{
                  width: BOARD_W,
                  height: BOARD_H,
                  transform: `scale(${boardZoom})`,
                  transformOrigin: 'top left',
                  backgroundImage:
                    'radial-gradient(circle, var(--dts-line-strong) 1px, transparent 1px)',
                  backgroundSize: '26px 26px',
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setConnectFromId(null);
                  }
                }}
              >
                {/* 1. Grid Slots Layer (`cols: 0..6, rows: 0..4`) */}
                {Array.from({ length: LAB_GRID_ROWS }).map((_, row) =>
                  Array.from({ length: LAB_GRID_COLS }).map((__, col) => {
                    const isHover =
                      dragHoverCell?.col === col && dragHoverCell?.row === row;
                    const hasNode = Object.values(positions).some(
                      (p) => p.col === col && p.row === row
                    );
                    return (
                      <div
                        key={`cell-${col}-${row}`}
                        style={{
                          left: col * CELL_W,
                          top: row * CELL_H,
                          width: CELL_W,
                          height: CELL_H,
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (
                            dragHoverCell?.col !== col ||
                            dragHoverCell?.row !== row
                          ) {
                            setDragHoverCell({ col, row });
                          }
                        }}
                        onDragLeave={() => {
                          setDragHoverCell((cur) =>
                            cur?.col === col && cur?.row === row ? null : cur
                          );
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragHoverCell(null);
                          const paletteKind = e.dataTransfer.getData(
                            'application/x-sd-palette'
                          ) as PaletteKind;
                          if (paletteKind) {
                            addPrimitiveAt(paletteKind, { col, row });
                            return;
                          }
                          const draggedNodeId = e.dataTransfer.getData(
                            'application/x-sd-node'
                          );
                          if (draggedNodeId) {
                            moveNodeToCell(draggedNodeId, { col, row });
                          }
                        }}
                        className="absolute p-2"
                      >
                        <div
                          className={cn(
                            'flex h-full w-full items-start justify-between rounded-xl border border-dashed px-2 py-1 font-mono text-[9px] transition-colors',
                            isHover
                              ? 'border-[var(--dts-border)] bg-[var(--dts-blue-soft)]/70'
                              : hasNode
                                ? 'border-transparent'
                                : 'border-[var(--dts-line-strong)]/60 text-[var(--dts-ink-muted)]/45 hover:border-[var(--dts-line-strong)]'
                          )}
                        >
                          {!hasNode && (
                            <span>
                              C{col}·R{row}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

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

                {/* 3. Node Cards Layer */}
                {model.nodes.map((node) => {
                  const pos = positions[node.id] ?? { col: 0, row: 0 };
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
                      draggable={!connectMode}
                      onDragStart={(e) => {
                        if (connectMode) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData('application/x-sd-node', node.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragHoverCell(null);
                        const draggedNodeId = e.dataTransfer.getData(
                          'application/x-sd-node'
                        );
                        if (draggedNodeId && draggedNodeId !== node.id) {
                          moveNodeToCell(draggedNodeId, pos);
                        }
                      }}
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
                        left: pos.col * CELL_W + (CELL_W - CARD_W) / 2,
                        top: pos.row * CELL_H + (CELL_H - CARD_H) / 2,
                        width: CARD_W,
                        height: CARD_H,
                      }}
                      className={cn(
                        'group absolute z-10 flex flex-col justify-between rounded-xl p-2 transition-all cursor-pointer',
                        'dts-card-tactile',
                        isConnectSource &&
                          'ring-2 ring-emerald-500 -translate-y-0.5',
                        isSelected &&
                          !isConnectSource &&
                          'ring-2 ring-[#2563eb] -translate-y-0.5',
                        state === 'overloaded' &&
                          'border-[#dc3d43] bg-[var(--dts-rose-soft)]'
                      )}
                    >
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
                              title={lang === 'en' ? 'Delete node' : 'Xoá thành phần'}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom-left Zoom Pill (`− · 100% · +`) */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <div className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 font-mono text-[11px] font-bold shadow-sm">
              <button
                type="button"
                onClick={() =>
                  setBoardZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))
                }
                className="px-1.5 hover:text-[var(--dts-blue-ink)]"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setBoardZoom(1)}
                className="px-1 tabular-nums hover:text-[var(--dts-blue-ink)]"
              >
                {Math.round(boardZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setBoardZoom((z) => Math.min(1.25, Number((z + 0.1).toFixed(2))))
                }
                className="px-1.5 hover:text-[var(--dts-blue-ink)]"
              >
                +
              </button>
            </div>
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
                      ? `Structural Guidance (${warnings.filter((w) => w.code !== 'SPOF').length})`
                      : `Khuyến nghị cấu trúc (${warnings.filter((w) => w.code !== 'SPOF').length})`}
                  </div>

                  {warnings.filter((w) => w.code !== 'SPOF').length === 0 ? (
                    <p className="text-[11px] text-[var(--dts-ink-muted)]">
                      {lang === 'en'
                        ? 'No structural warnings! Timeouts, jitter, and resilience settings look solid.'
                        : 'Không có cảnh báo cấu trúc nào. Các thiết lập timeout, jitter và bảo vệ đều hợp lý.'}
                    </p>
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
                        ? 'You are currently in Free Sandbox mode. Pick one of the 5 graded challenges below to test your architecture against latency, error, SPOF, and cost constraints:'
                        : 'Bạn đang ở chế độ Sandbox Tự do. Hãy chọn 1 trong 5 bài toán dưới đây để thiết kế và chấm điểm tự động theo SLO, cấu trúc và ngân sách:'}
                    </p>
                    <div className="space-y-1.5">
                      {LAB_CHALLENGES.map((ch) => {
                        const prevStars = sdExercises[ch.id]?.stars ?? 0;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleSelectTemplate(ch.id, 'starter')}
                            className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2.5 text-left hover:border-[var(--dts-border)]"
                          >
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-extrabold text-[var(--dts-ink)]">
                                {ch.code}: {pick(ch.title, lang)}
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
              title={lang === 'en' ? 'Delete node' : 'Xoá thành phần'}
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
          title={lang === 'en' ? 'Delete link' : 'Xoá kết nối'}
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
              <option value="sync">sync (đồng bộ)</option>
              <option value="async">async (bất đồng bộ)</option>
              <option value="pull">pull (Queue → Worker)</option>
              <option value="replicate">replicate (nhân bản DB)</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold text-[var(--dts-ink-muted)]">
              carries
            </label>
            <select
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
              <option value="rw">rw (Đọc + Ghi)</option>
              <option value="r">r (Chỉ đọc)</option>
              <option value="w">w (Chỉ ghi)</option>
            </select>
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
