import {
  makeNode,
  type LinkSpec,
  type NodeOverrides,
  type PrimitiveKind,
  type RouteMode,
  type SimScenario,
} from '@/features/sysdesign-course/sim';
import type {
  BilingualText,
  IsoNodeShape,
  IsoTone,
  PacketKind,
  StageIconKind,
  StageInspectorInfo,
  StageLink,
  StageNode,
  StageNoteCard,
  StagePacket,
  StageScene,
  StageZoneSlab,
  StepDiffItem,
} from '@/components/scale-workbench/types';

export type ClarifyingQuestionDimension =
  | 'scale'
  | 'ratio'
  | 'sla'
  | 'resilience'
  | 'premature';

export interface CaseClarifyingQuestion {
  id: string;
  kind: 'essential' | 'premature';
  dimension: ClarifyingQuestionDimension;
  question: BilingualText;
  answer: BilingualText;
  rationale: BilingualText;
}

export interface CaseCapacityCard {
  dau: BilingualText;
  readRps: BilingualText;
  writeRps: BilingualText;
  readWriteRatio: BilingualText;
  storagePerDay: BilingualText;
  memoryOrBandwidth: BilingualText;
  slos: BilingualText[];
  snakeSummary: {
    scope: BilingualText;
    numbers: BilingualText;
    api: BilingualText;
    keyComponents: BilingualText;
    elaborate: BilingualText;
  };
}

export interface CaseTradeOffItem {
  decision: BilingualText;
  gain: BilingualText;
  cost: BilingualText;
}

export interface CaseEvolutionStage {
  id: 'v1' | 'v2' | 'v3' | 'v4';
  versionLabel: string;
  title: BilingualText;
  eraTag: BilingualText;
  targetRps: number;
  stressMultiplier: number;
  summary: BilingualText;
  whyNextStage: BilingualText;
  whatChanged: StepDiffItem[];
  tradeOffs: CaseTradeOffItem[];
  scene: StageScene;
  scenario: SimScenario;
}

export interface SdDesignCase {
  id: string;
  order: number;
  linkedModuleId: string;
  domainTag: BilingualText;
  difficulty: 'Intermediate' | 'Advanced';
  title: BilingualText;
  subtitle: BilingualText;
  problemBrief: BilingualText;
  clarifyingQuestions: CaseClarifyingQuestion[];
  capacityCard: CaseCapacityCard;
  stages: [CaseEvolutionStage, CaseEvolutionStage, CaseEvolutionStage, CaseEvolutionStage];
}

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

const diff = (op: '+' | '~' | '-', vi: string, en: string): StepDiffItem => ({
  op,
  text: bi(vi, en),
});

const trade = (
  decVi: string,
  decEn: string,
  gainVi: string,
  gainEn: string,
  costVi: string,
  costEn: string
): CaseTradeOffItem => ({
  decision: bi(decVi, decEn),
  gain: bi(gainVi, gainEn),
  cost: bi(costVi, costEn),
});

function groundOffset(shape: IsoNodeShape): number {
  if (shape === 'block') return 22;
  if (shape === 'db') return 16;
  if (shape === 'device') return 12;
  return 10;
}

/**
 * Quy đổi toạ độ lưới (col, row) trên mặt sàn Isometric 2:1 thành pixel (x, y) cho ScaleStageSvg:
 * - +col tiến theo trục SW -> NE (+128, -64)
 * - +row dịch theo trục NW -> SE (+112, +56)
 */
export function isoGrid(
  col: number,
  row: number,
  shape: IsoNodeShape,
  originCol = 1.5,
  originRow = 0
): { x: number; y: number } {
  const dc = col - originCol;
  const dr = row - originRow;
  const gx = dc * 128 + dr * 112;
  const gy = -dc * 64 + dr * 56;
  return {
    x: Math.round(gx),
    y: Math.round(gy - groundOffset(shape)),
  };
}

interface PairedNodeDef {
  id: string;
  kind: PrimitiveKind;
  shape: IsoNodeShape;
  tone: IsoTone;
  icon?: StageIconKind;
  col: number;
  row: number;
  label: BilingualText;
  what: BilingualText;
  how: BilingualText;
  why: BilingualText;
  tip?: BilingualText;
  replicas?: number;
  opsPerSec?: number;
  baseMs?: number;
  costPerHour?: number;
  scaling?: 'horizontal' | 'vertical' | 'partitioned';
  zone?: string;
  params?: Record<string, number | string | boolean>;
}

interface PairedLinkDef {
  id: string;
  from: string;
  to: string;
  mode?: LinkSpec['mode'];
  carries?: LinkSpec['carries'];
  fraction?: number;
  calls?: number;
  weight?: number;
  netClass?: LinkSpec['netClass'];
  timeoutMs?: number;
  style?: StageLink['style'];
  label?: BilingualText;
  retry?: LinkSpec['retry'];
  breaker?: LinkSpec['breaker'];
  what?: BilingualText;
  how?: BilingualText;
  why?: BilingualText;
}

const KIND_LABEL_MAP: Record<IsoNodeShape, BilingualText> = {
  crowd: bi('Nhóm người dùng', 'User Traffic'),
  device: bi('Thiết bị đầu cuối', 'Client Device'),
  block: bi('Dịch vụ / Tầng xử lý', 'Service Tier'),
  db: bi('Lưu trữ bền vững', 'Data Store'),
};

interface BuildStageInput {
  caseId: string;
  id: 'v1' | 'v2' | 'v3' | 'v4';
  versionLabel: string;
  title: BilingualText;
  eraTag: BilingualText;
  targetRps: number;
  stressMultiplier?: number;
  readRatio: number;
  seed: number;
  clientTimeoutMs?: number;
  summary: BilingualText;
  whyNextStage: BilingualText;
  whatChanged: StepDiffItem[];
  tradeOffs: CaseTradeOffItem[];
  nodes: PairedNodeDef[];
  links: PairedLinkDef[];
  routes?: Record<string, RouteMode>;
  zones?: StageZoneSlab[];
  noteCard: StageNoteCard;
}

function buildPairedStage(cfg: BuildStageInput): CaseEvolutionStage {
  const cols = cfg.nodes.map((n) => n.col);
  const rows = cfg.nodes.map((n) => n.row);
  const originCol = (Math.min(...cols) + Math.max(...cols)) / 2;
  const originRow = (Math.min(...rows) + Math.max(...rows)) / 2;

  const stageNodes: StageNode[] = cfg.nodes.map((n) => {
    const pos = isoGrid(n.col, n.row, n.shape, originCol, originRow);
    const inspector: StageInspectorInfo = {
      title: n.label,
      kindLabel: KIND_LABEL_MAP[n.shape],
      what: n.what,
      how: n.how,
      why: n.why,
      ...(n.tip ? { tipOrCase: n.tip } : {}),
    };
    return {
      id: n.id,
      shape: n.shape,
      tone: n.tone,
      x: pos.x,
      y: pos.y,
      label: n.label,
      ...(n.icon ? { icon: n.icon } : {}),
      inspector,
    };
  });

  const modelNodes = cfg.nodes.map((n) => {
    const ov: NodeOverrides & { id: string } = {
      id: n.id,
      label: n.label,
      ...(n.replicas !== undefined ? { replicas: n.replicas } : {}),
      ...(n.opsPerSec !== undefined ? { opsPerSec: n.opsPerSec } : {}),
      ...(n.baseMs !== undefined ? { baseMs: n.baseMs } : {}),
      ...(n.costPerHour !== undefined ? { costPerHour: n.costPerHour } : {}),
      ...(n.scaling !== undefined ? { scaling: n.scaling } : {}),
      zone: n.zone ?? (n.kind === 'client' ? 'internet' : 'az-a'),
      params: {
        ...(n.replicas !== undefined ? { replicas: n.replicas } : {}),
        ...(n.params ?? {}),
      },
    };
    return makeNode(n.kind, ov);
  });

  const nodeLabelById = new Map(cfg.nodes.map((n) => [n.id, n.label]));

  const stageLinks: StageLink[] = cfg.links.map((l) => {
    const fromLbl = nodeLabelById.get(l.from);
    const toLbl = nodeLabelById.get(l.to);
    const mode = l.mode ?? 'sync';
    const derivedStyle: StageLink['style'] =
      l.style ??
      (mode === 'replicate'
        ? 'heartbeat'
        : mode === 'async' || mode === 'pull'
          ? 'dashed'
          : 'solid');

    const title =
      l.label ??
      bi(
        `${fromLbl?.vi ?? l.from} → ${toLbl?.vi ?? l.to}`,
        `${fromLbl?.en ?? l.from} → ${toLbl?.en ?? l.to}`
      );

    const inspector: StageInspectorInfo = {
      title,
      kindLabel: bi('Đường kết nối', 'Network Link'),
      what:
        l.what ??
        bi(
          `Kết nối ${mode === 'sync' ? 'đồng bộ' : mode === 'replicate' ? 'nhân bản dữ liệu' : 'bất đồng bộ'} từ ${fromLbl?.vi ?? l.from} sang ${toLbl?.vi ?? l.to}.`,
          `${mode === 'sync' ? 'Synchronous' : mode === 'replicate' ? 'Replication' : 'Asynchronous'} connection from ${fromLbl?.en ?? l.from} to ${toLbl?.en ?? l.to}.`
        ),
      how:
        l.how ??
        bi(
          mode === 'sync'
            ? 'Client hoặc dịch vụ phía trước chờ phản hồi trực tiếp trên kết nối mạng.'
            : mode === 'replicate'
              ? 'Đồng bộ dòng ghi từ Primary sang Replica theo luồng nền.'
              : 'Đẩy hoặc kéo tác vụ qua hàng đợi để tách rời tốc độ xử lý giữa hai tầng.',
          mode === 'sync'
            ? 'Upstream caller awaits an inline response within its timeout budget.'
            : mode === 'replicate'
              ? 'Streams committed writes asynchronously from Primary to Replica.'
              : 'Decouples producer and consumer throughput via queued message passing.'
        ),
      why:
        l.why ??
        bi(
          'Định hình đường đi dữ liệu, ngân sách độ trễ và ranh giới cô lập lỗi giữa hai thành phần.',
          'Defines data routing, latency budget, and fault-isolation boundaries between tiers.'
        ),
    };

    return {
      id: l.id,
      from: l.from,
      to: l.to,
      style: derivedStyle,
      ...(l.label ? { label: l.label } : {}),
      inspector,
    };
  });

  const modelLinks: LinkSpec[] = cfg.links.map((l) => {
    const mode = l.mode ?? 'sync';
    return {
      id: l.id,
      from: l.from,
      to: l.to,
      mode,
      ...(l.carries ? { carries: l.carries } : {}),
      ...(l.fraction !== undefined ? { fraction: l.fraction } : {}),
      ...(l.calls !== undefined ? { calls: l.calls } : {}),
      ...(l.weight !== undefined ? { weight: l.weight } : {}),
      netClass: l.netClass ?? (l.from === 'client' ? 'internet' : 'same-az'),
      timeoutMs: l.timeoutMs ?? (mode === 'sync' ? 1200 : undefined),
      ...(l.retry ? { retry: l.retry } : {}),
      ...(l.breaker ? { breaker: l.breaker } : {}),
    };
  });

  const nodeKindMap = new Map(cfg.nodes.map((n) => [n.id, n.kind]));
  const packets: StagePacket[] = [];
  stageLinks.forEach((sl, idx) => {
    if (sl.style === 'off' || sl.style === 'cut') return;
    const toKind = nodeKindMap.get(sl.to);
    const mainKind: PacketKind = sl.style === 'dashed' ? 'mutation' : 'request';
    packets.push({
      id: `pkt_${cfg.caseId}_${cfg.id}_${sl.id}_0`,
      linkId: sl.id,
      kind: mainKind,
      speed: 0.42,
      offset: Number(((idx * 0.21) % 1).toFixed(2)),
    });
    if (toKind === 'cache' || toKind === 'cdn') {
      packets.push({
        id: `pkt_${cfg.caseId}_${cfg.id}_${sl.id}_hit`,
        linkId: sl.id,
        kind: 'cache-hit',
        speed: 0.46,
        offset: Number(((idx * 0.21 + 0.5) % 1).toFixed(2)),
        reverse: true,
      });
    } else if (idx === 0) {
      packets.push({
        id: `pkt_${cfg.caseId}_${cfg.id}_${sl.id}_res`,
        linkId: sl.id,
        kind: 'response',
        speed: 0.42,
        offset: 0.52,
        reverse: true,
      });
    }
  });

  const scene: StageScene = {
    nodes: stageNodes,
    links: stageLinks,
    packets: packets.slice(0, 22),
    ...(cfg.zones ? { zones: cfg.zones } : {}),
    noteCard: cfg.noteCard,
  };

  const scenario: SimScenario = {
    id: `case-${cfg.caseId}/${cfg.id}`,
    seed: cfg.seed,
    durationSec: 120,
    mix: { readRatio: cfg.readRatio },
    clientTimeoutMs: cfg.clientTimeoutMs ?? 2000,
    options: { noise: true, maxPackets: 160 },
    load: { kind: 'steady', rps: cfg.targetRps },
    events: [],
    model: {
      nodes: modelNodes,
      links: modelLinks,
      ...(cfg.routes ? { routes: cfg.routes } : {}),
    },
  };

  return {
    id: cfg.id,
    versionLabel: cfg.versionLabel,
    title: cfg.title,
    eraTag: cfg.eraTag,
    targetRps: cfg.targetRps,
    stressMultiplier: cfg.stressMultiplier ?? 5,
    summary: cfg.summary,
    whyNextStage: cfg.whyNextStage,
    whatChanged: cfg.whatChanged,
    tradeOffs: cfg.tradeOffs,
    scene,
    scenario,
  };
}

const STEADY_CACHE_90 = {
  ttlSec: 300,
  ttlJitterPct: 0.25,
  hitRatioMax: 0.9,
  workingSetKeys: 100000,
  capacityKeys: 100000,
  warmupSec: 20,
  singleflight: true,
};

/* ============================================================================
 * 1. URL SHORTENER (Bitly) — Linked Module: S5-02
 * ============================================================================ */
const CASE_URL_SHORTENER: SdDesignCase = {
  id: 'url-shortener',
  order: 1,
  linkedModuleId: 'S5-02',
  domainTag: bi('Read-Heavy 99:1 · Caching · Base62', 'Read-Heavy 99:1 · Caching · Base62'),
  difficulty: 'Intermediate',
  title: bi('URL Shortener (Bitly)', 'URL Shortener (Bitly)'),
  subtitle: bi(
    'Hệ thống tạo mã ngắn Base62 không va chạm và chuyển hướng HTTP độ trễ thấp cho lưu lượng đọc gấp 100 lần ghi.',
    'Collision-free Base62 short-link generation and sub-25ms HTTP redirection at 100:1 read-to-write scale.'
  ),
  problemBrief: bi(
    'Thiết kế dịch vụ rút gọn liên kết tương tự Bitly: nhận một URL dài, trả về đường dẫn ngắn 7 ký tự và chuyển hướng người dùng về trang đích với độ sẵn sàng toàn cầu.',
    'Design a URL shortening service like Bitly: accept a long URL, return a compact 7-character link, and redirect visitors globally with high availability.'
  ),
  clarifyingQuestions: [
    {
      id: 'url-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Quy mô người dùng hàng ngày (DAU) và số lượng liên kết mới tạo ra mỗi ngày là bao nhiêu?',
        'What is the Daily Active User (DAU) scale and how many new short links are created per day?'
      ),
      answer: bi(
        '100 triệu DAU; tạo khoảng 3,5 triệu link mới/ngày (~40 ghi/giây trung bình, ~200 ghi/giây đỉnh) và ~350 triệu lượt click/ngày (~4.000 đọc/giây trung bình, >50.000 đọc/giây khi link viral).',
        '100M DAU; ~3.5M new links/day (~40 writes/s avg, ~200 writes/s peak) and ~350M redirects/day (~4,000 reads/s avg, >50,000 reads/s during viral spikes).'
      ),
      rationale: bi(
        'Xác định không gian mã 7 ký tự Base62 (62^7 ≈ 3,52 nghìn tỷ mã, dư dùng cho >100 năm) và trần RPS thực tế.',
        'Sizes the 7-char Base62 keyspace (62^7 ≈ 3.52T IDs) and establishes peak redirect RPS targets.'
      ),
    },
    {
      id: 'url-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Tỷ lệ giữa lượt truy cập chuyển hướng (Read) và lượt rút gọn link mới (Write) là bao nhiêu?',
        'What is the ratio between redirect lookups (Read) and link creations (Write)?'
      ),
      answer: bi(
        'Xấp xỉ 100:1 (99% lưu lượng là đọc GET /{code}, chỉ 1% là POST /shorten). Ngoài ra phân phối lượt đọc tuân theo quy luật Zipf (20% link mới chiếm 80%+ lượt bấm).',
        'Roughly 100:1 (99% GET /{code} reads, 1% POST /shorten writes) following a skewed Zipfian hot-link distribution.'
      ),
      rationale: bi(
        'Tỷ lệ 99:1 cho thấy đặt Read-through Cache và Edge CDN sẽ chặn >90% truy vấn khỏi tầng lưu trữ đĩa.',
        'A 99:1 ratio means multi-tier caching (Redis + Edge CDN) offloads >90% of database disk I/O.'
      ),
    },
    {
      id: 'url-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Ngân sách độ trễ p99 khi chuyển hướng, thời hạn lưu trữ mặc định và nên trả HTTP 301 hay 302?',
        'What is the redirect p99 latency SLA, retention window, and HTTP 301 vs 302 preference?'
      ),
      answer: bi(
        'Độ trễ chuyển hướng phía server p99 < 25 ms, độ sẵn sàng 99,99%, lưu mặc định 5 năm. Hỗ trợ 301 (cache trình duyệt/CDN tối đa) và 302 khi khách hàng bật thống kê lượt click.',
        'Server redirect p99 < 25 ms, 99.99% availability, 5-year default retention. Use 301 for pure caching or 302 when click analytics are enabled.'
      ),
      rationale: bi(
        'Chọn 301 giảm tải origin nhưng mất số đếm click ở origin; nếu dùng 302 cần ghi sự kiện click bất đồng bộ qua Queue để giữ p99 < 25 ms.',
        '301 maximizes browser/CDN offload while 302 preserves click telemetry—requiring async queue ingestion so analytics never block redirects.'
      ),
    },
    {
      id: 'url-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Làm sao sinh mã ngắn không va chạm khi nhiều App Server chạy song song và xử lý khi một link viral đột biến?',
        'How do we prevent short-code collisions across stateless servers and survive sudden viral hot-key spikes?'
      ),
      answer: bi(
        'Dùng dịch vụ cấp dải số nguyên (Range Coordinator / Snowflake) đổi sang Base62 thay vì băm MD5 kiểm tra trùng lặp; bật Singleflight và Jitter TTL trên Cache cho hot key.',
        'Allocate disjoint numeric ID ranges (or Snowflake IDs) encoded to Base62 instead of hash-and-retry; enable Singleflight and TTL jitter on Cache.'
      ),
      rationale: bi(
        'Loại bỏ hoàn toàn vòng lặp SELECT kiểm tra va chạm trong Database khi ghi và ngăn hiện tượng Cache Stampede khi TTL hết hạn.',
        'Eliminates extra DB collision-check round trips on writes and prevents cache stampedes on viral URLs.'
      ),
    },
    {
      id: 'url-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Nút "Sao chép liên kết" trên giao diện web nên dùng màu xanh lá hay xanh dương và bo góc bao nhiêu pixel?',
        'Should the "Copy Short Link" button on the web UI be green or blue, and what border-radius should it use?'
      ),
      answer: bi(
        'Thuộc phạm vi thiết kế giao diện người dùng, không ảnh hưởng tới kiến trúc hệ thống.',
        'Purely a frontend styling detail with zero impact on backend system architecture.'
      ),
      rationale: bi(
        'Trong 45 phút thiết kế hệ thống, thời gian đầu phải dành để chốt thông lượng, mô hình dữ liệu và điểm nghẽn I/O thay vì chi tiết CSS.',
        'In a 45-minute design session, clarify throughput, storage growth, and SLOs first rather than UI styling details.'
      ),
    },
    {
      id: 'url-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên viết hàm đổi số nguyên sang chuỗi Base62 bằng hợp ngữ SIMD ngay từ đầu để giảm vài chục nano-giây CPU không?',
        'Should we hand-write the Base62 integer encoder in SIMD assembly upfront to shave off tens of nanoseconds?'
      ),
      answer: bi(
        'Chưa cần thiết: phép chia lấy dư 7 vòng trong ngôn ngữ bậc cao chỉ mất dưới 1 micro-giây.',
        'Unnecessary: a 7-iteration modulo loop takes under 1 microsecond in standard runtimes.'
      ),
      rationale: bi(
        'Chi phí đọc mạng và đĩa lớn gấp 5.000–10.000 lần phép đổi Base62; tối ưu vi mô CPU trước khi thiết kế tầng Cache là lệch trọng tâm.',
        'Network and disk I/O are 5,000x slower than Base62 math; solve storage and caching bottlenecks before micro-optimizing CPU.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('100M DAU', '100M DAU'),
    readRps: bi('4.000 TB / 50.000 đỉnh req/s', '4,000 avg / 50,000 peak req/s'),
    writeRps: bi('40 TB / 200 đỉnh req/s', '40 avg / 200 peak req/s'),
    readWriteRatio: bi('100 : 1 (99% Đọc)', '100 : 1 (99% Reads)'),
    storagePerDay: bi('~1,8 GB/ngày (~3,3 TB / 5 năm)', '~1.8 GB/day (~3.3 TB / 5 yrs)'),
    memoryOrBandwidth: bi('~70 GB Redis RAM (20% hot set)', '~70 GB Redis RAM (20% hot set)'),
    slos: [
      bi('Redirect p99 < 25 ms', 'Redirect p99 < 25 ms'),
      bi('Availability 99,99%', 'Availability 99.99%'),
      bi('0% va chạm mã Base62', 'Zero Base62 collisions'),
    ],
    snakeSummary: {
      scope: bi('POST rút gọn URL, GET chuyển hướng 301/302, thống kê click bất đồng bộ.', 'POST shorten, GET 301/302 redirect, async click analytics.'),
      numbers: bi('4K → 50K đọc/s, 40 ghi/s, ~500B/bản ghi, 62^7 ≈ 3,52T mã.', '4K → 50K reads/s, 40 writes/s, ~500B/row, 62^7 ≈ 3.52T codes.'),
      api: bi('POST /v1/urls {longUrl, customAlias?} · GET /{code} → 301/302 Location.', 'POST /v1/urls {longUrl, customAlias?} · GET /{code} → 301/302 Location.'),
      keyComponents: bi('CDN Edge, Stateless App, Redis Cache, Range ID Coordinator, Sharded KV.', 'CDN Edge, Stateless App, Redis Cache, Range ID Coordinator, Sharded KV.'),
      elaborate: bi('Singleflight chống stampede, xáo trộn bit ID tránh đoán tuần tự, Queue ghi click.', 'Singleflight anti-stampede, bit-shuffled IDs against enumeration, async click queue.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'url',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('MVP 1 Server + SQL đơn lẻ', 'Single-Server MVP + Single SQL'),
      eraTag: bi('100 req/s · Khởi điểm', '100 req/s · Baseline MVP'),
      targetRps: 100,
      readRatio: 0.99,
      seed: 7301,
      summary: bi(
        'Một máy chủ ứng dụng nối thẳng vào một cơ sở dữ liệu SQL dùng khoá tự tăng AUTO_INCREMENT đổi ra Base62 và đọc trực tiếp từ B-tree Index cho mọi lượt click.',
        'A single application server backed by one relational SQL instance using AUTO_INCREMENT + Base62 and direct index lookups on every redirect.'
      ),
      whyNextStage: bi(
        'Khi lưu lượng tăng 5× lên 500 req/s, mọi lượt chuyển hướng đều chọc thẳng xuống đĩa SQL (μ = 320 req/s) làm Database chạm ρ = 1,00, hàng đợi dồn và độ trễ vượt ngưỡng.',
        'At 5x load (500 req/s), every redirect hits the single SQL node (μ = 320 req/s), driving DB utilization past 100% and spiking tail latency.'
      ),
      whatChanged: [
        diff('+', '1 App Server xử lý chung cả tạo link và chuyển hướng', 'Single App Server handling both shorten and redirect'),
        diff('+', '1 SQL Database lưu bảng urls(id, code, long_url)', 'Single SQL Database storing urls(id, code, long_url)'),
      ],
      tradeOffs: [
        trade(
          'Dùng chung 1 SQL cho cả sinh ID và tra cứu',
          'Single SQL for ID generation and lookups',
          'Triển khai nhanh trong vài giờ, đảm bảo tính duy nhất nhờ UNIQUE index',
          'Ships in hours with trivial ACID uniqueness guarantees',
          'Điểm lỗi đơn (SPOF) và 99% lượt đọc lặp lại vẫn tiêu tốn I/O của Database',
          'Single point of failure (SPOF) where 99% repetitive reads burn DB I/O'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('Trình duyệt và ứng dụng di động bấm vào liên kết ngắn.', 'Browsers and mobile apps clicking short links.'),
          how: bi('Gửi 99% GET /{code} và 1% POST /shorten qua Internet.', 'Sends 99% GET /{code} and 1% POST /shorten over HTTPS.'),
          why: bi('Nguồn phát sinh tải đọc lệch về nhóm link phổ biến.', 'Generates heavily read-skewed redirect traffic.'),
        },
        {
          id: 'app',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 650,
          baseMs: 8,
          label: bi('App Server', 'App Server'),
          what: bi('Máy chủ web đơn lẻ xử lý tạo mã Base62 và trả HTTP 302.', 'Single web server encoding Base62 and issuing HTTP 302.'),
          how: bi('Mỗi lượt click đều mở truy vấn đồng bộ tới SQL.', 'Queries SQL synchronously on every incoming click.'),
          why: bi('Đơn giản hoá luồng triển khai ban đầu khi tải còn dưới 200 req/s.', 'Keeps initial MVP deployment minimal below 200 req/s.'),
        },
        {
          id: 'db',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 320,
          baseMs: 6,
          label: bi('SQL Primary', 'SQL Primary'),
          what: bi('Cơ sở dữ liệu quan hệ duy nhất lưu ánh xạ code → long_url.', 'Single relational DB storing code → long_url rows.'),
          how: bi('Tra cứu B-tree Index cho mỗi lượt đọc và khoá dòng khi cấp ID mới.', 'Executes B-tree index lookups per click and AUTO_INCREMENT on writes.'),
          why: bi('Trở thành điểm nghẽn đầu tiên ngay khi lượt click vượt 320 req/s.', 'Becomes the immediate bottleneck once traffic exceeds 320 req/s.'),
        },
      ],
      links: [
        { id: 'c-app', from: 'client', to: 'app', label: bi('HTTPS', 'HTTPS') },
        { id: 'app-db', from: 'app', to: 'db', label: bi('SQL R/W', 'SQL R/W') },
      ],
      noteCard: {
        title: bi('v1 · MVP 100 req/s', 'v1 · MVP 100 req/s'),
        lines: [
          { text: bi('100% lượt đọc đi thẳng xuống SQL', '100% of reads hit SQL directly'), tone: 'amber' },
          { text: bi('Trần chịu tải ≈ 320 req/s (nghẽn DB)', 'Ceiling ≈ 320 req/s (DB bound)'), tone: 'plain' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'url',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Tách tầng Stateless + Redis Read Cache', 'Stateless App Tier + Redis Read Cache'),
      eraTag: bi('2.000 req/s · Tối ưu đường đọc', '2,000 req/s · Read-Through Cache'),
      targetRps: 2000,
      readRatio: 0.99,
      seed: 7302,
      summary: bi(
        'Đặt Load Balancer trước cụm App không trạng thái và chèn Redis Read-through Cache (Hit Ratio ~88%) để hấp thụ phần lớn lượt đọc link nóng.',
        'Places a Load Balancer in front of stateless App instances and adds a Redis Read-through Cache (~88% hit ratio) to shield SQL.'
      ),
      whyNextStage: bi(
        'Ở mốc 5× (10.000 req/s), 12% Cache Miss (~1.200 đọc/s) cộng với ghi đồng bộ lượt click và giới hạn 2 instance App khiến cả cụm App lẫn SQL Primary quá tải.',
        'At 5x load (10,000 req/s), 12% cache misses (~1,200 reads/s) plus synchronous DB work saturate both the 2-node App tier and single SQL Primary.'
      ),
      whatChanged: [
        diff('+', 'Thêm Load Balancer và nhân bản ngang tầng App (×2)', 'Add Load Balancer and scale stateless App tier (×2)'),
        diff('+', 'Chèn Redis Cache chặn ~88% lượt đọc trước SQL', 'Insert Redis Cache absorbing ~88% of reads ahead of SQL'),
        diff('~', 'SQL Primary chỉ còn nhận ~12% Cache Miss và 1% lệnh ghi', 'SQL Primary now handles only ~12% misses and 1% writes'),
      ],
      tradeOffs: [
        trade(
          'Read-through Cache với TTL cho bản ghi URL bất biến',
          'Read-through Cache with TTL for immutable URLs',
          'Giảm ~8× tải đọc xuống SQL và hạ độ trễ đọc xuống dưới 1 ms khi Hit',
          'Cuts SQL read load ~8x with sub-millisecond cache hits',
          'Tốn thêm RAM và cần xử lý Cache Miss dồn dập khi khóa nóng hết hạn',
          'Adds memory cost and potential cache-miss spikes on cold/expired keys'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('Lưu lượng người dùng tăng lên 2.000 req/s.', 'User redirect traffic scaled to 2,000 req/s.'),
          how: bi('Phân phối đều vào Load Balancer qua HTTPS.', 'Connects through Load Balancer over HTTPS.'),
          why: bi('Kiểm chứng hiệu quả của bộ nhớ đệm trên tập link nóng.', 'Tests read-cache offload on Zipf-distributed short links.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Bộ cân bằng tải Layer 7 chia đều request sang các máy App.', 'Layer-7 Load Balancer distributing traffic across App servers.'),
          how: bi('Kiểm tra sức khoẻ định kỳ và định tuyến Round-robin.', 'Performs health checks and Round-robin routing.'),
          why: bi('Cho phép thêm/bớt App Server mà không đổi địa chỉ IP công khai.', 'Enables horizontal App scaling behind a stable endpoint.'),
        },
        {
          id: 'app',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 2,
          opsPerSec: 1900,
          baseMs: 7,
          label: bi('App Tier ×2', 'App Tier ×2'),
          what: bi('Cụm 2 máy chủ ứng dụng không giữ trạng thái cục bộ.', 'Two stateless application instances.'),
          how: bi('Kiểm tra Redis trước; nếu Miss mới đọc SQL và nạp ngược vào Redis.', 'Reads Redis first; populates Redis on SQL miss.'),
          why: bi('Nâng thông lượng tính toán lên ~3.800 req/s.', 'Raises stateless compute capacity to ~3,800 req/s.'),
        },
        {
          id: 'cache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.55,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.88, singleflight: false },
          label: bi('Redis Cache', 'Redis Cache'),
          what: bi('Bộ nhớ đệm lưu cặp code → long_url đang được truy cập nhiều.', 'In-memory key-value cache storing hot code → long_url entries.'),
          how: bi('Trả về ngay ~88% lượt đọc trong 0,5 ms mà không chạm đĩa.', 'Serves ~88% of reads in 0.5 ms from RAM.'),
          why: bi('Bảo vệ SQL khỏi hàng nghìn truy vấn lặp lại mỗi giây.', 'Shields SQL from repetitive hot-link lookups.'),
        },
        {
          id: 'db',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: 0.25,
          replicas: 1,
          opsPerSec: 750,
          baseMs: 5,
          label: bi('SQL Primary', 'SQL Primary'),
          what: bi('Cơ sở dữ liệu chính lưu trữ lâu dài toàn bộ liên kết.', 'Primary relational store holding durable link mappings.'),
          how: bi('Xử lý ~12% lượt đọc bị Miss ở Cache và 1% lệnh tạo link.', 'Handles ~12% cache misses plus 1% write transactions.'),
          why: bi('Giữ dữ liệu bền vững khi Redis khởi động lại.', 'Provides durable source of truth across cache restarts.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-app', from: 'lb', to: 'app' },
        { id: 'app-cache', from: 'app', to: 'cache', label: bi('Hit 88%', 'Hit 88%') },
        { id: 'cache-db', from: 'cache', to: 'db', label: bi('Miss + Write', 'Miss + Write') },
      ],
      zones: [
        { id: 'z-data', nodeIds: ['cache', 'db'], label: bi('TẦNG DỮ LIỆU', 'DATA TIER'), tone: 'yellow' },
      ],
      noteCard: {
        title: bi('v2 · Redis Cache 88%', 'v2 · Redis Cache 88%'),
        lines: [
          { text: bi('Chỉ ~13% lưu lượng chạm SQL', 'Only ~13% of traffic hits SQL'), tone: 'good' },
          { text: bi('Trần chịu tải ≈ 3.800 req/s (App ×2)', 'Ceiling ≈ 3,800 req/s (App ×2)'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'url',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Sharded KV + Singleflight + Async Analytics', 'Sharded KV + Singleflight + Async Analytics'),
      eraTag: bi('15.000 req/s · Tách ghi bất đồng bộ', '15,000 req/s · Sharding & Async Queue'),
      targetRps: 15000,
      readRatio: 0.99,
      seed: 7303,
      summary: bi(
        'Thay SQL đơn lẻ bằng kho Key-Value phân mảnh theo hash(code), bật Singleflight trên Redis (Hit ~92%) và tách thống kê lượt click sang hàng đợi bất đồng bộ.',
        'Replaces single SQL with hash-sharded Key-Value storage, enables Singleflight on Redis (~92% hit), and offloads click counting to an async queue.'
      ),
      whyNextStage: bi(
        'Khi lưu lượng vọt 5× lên 75.000 req/s trên toàn cầu, toàn bộ request vẫn phải đi xuyên Internet về một cụm Origin duy nhất làm nghẽn Load Balancer và cụm App.',
        'At 5x global load (75,000 req/s), routing every redirect back to a single regional origin saturates the Origin LB and App cluster.'
      ),
      whatChanged: [
        diff('+', 'Phân mảnh kho lưu trữ thành Sharded KV (3 phân vùng) kèm Range ID', 'Partition storage into 3-shard KV cluster with Range IDs'),
        diff('+', 'Tách sự kiện đếm lượt click sang Click Queue + Analytics Worker', 'Decouple click telemetry into async Click Queue + Workers'),
        diff('~', 'Bật Singleflight + TTL Jitter trên Redis Cluster (Hit ~92%)', 'Enable Singleflight + TTL Jitter on Redis Cluster (~92% hit)'),
      ],
      tradeOffs: [
        trade(
          'Đếm click bất đồng bộ qua Message Queue thay vì UPDATE trực tiếp',
          'Async click analytics via Queue instead of inline UPDATE',
          'Giữ đường chuyển hướng thuần đọc trong vài mili-giây không khoá dòng',
          'Keeps redirect path lock-free and sub-10ms',
          'Số liệu thống kê click hiển thị trễ vài giây (Eventual Consistency)',
          'Click analytics dashboard lags by a few seconds (eventual consistency)'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('15.000 lượt truy cập liên kết ngắn mỗi giây.', '15,000 short-link requests per second.'),
          how: bi('Gửi yêu cầu HTTP 302 cần cả chuyển hướng nhanh lẫn ghi nhận thống kê.', 'Requests HTTP 302 redirects with click tracking.'),
          why: bi('Đặt áp lực đồng thời lên đường đọc và luồng ghi sự kiện.', 'Stresses both lookup throughput and analytics ingestion.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp Load Balancer Active-Active loại bỏ điểm lỗi đơn ở cửa vào.', 'Active-active Load Balancer pair removing entry SPOF.'),
          how: bi('Tổng năng lực định tuyến 90.000 req/s vào tầng App.', 'Routes up to 90,000 req/s across stateless App servers.'),
          why: bi('Đảm bảo một LB bảo trì không làm gián đoạn dịch vụ.', 'Sustains traffic during single-node LB maintenance.'),
        },
        {
          id: 'app',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 12,
          opsPerSec: 2100,
          baseMs: 5,
          params: { replicas: 12 },
          label: bi('App Tier ×12', 'App Tier ×12'),
          what: bi('12 instance ứng dụng tích hợp sẵn bộ cấp dải ID Base62 trong RAM.', '12 stateless instances holding pre-allocated Base62 ID ranges in memory.'),
          how: bi('Đọc Redis đồng bộ và đẩy sự kiện click không chặn sang Queue.', 'Reads Redis synchronously and fires non-blocking click events to Queue.'),
          why: bi('Sinh mã mới không cần gọi mạng mỗi lần tạo link.', 'Generates collision-free IDs locally without per-write coordination.'),
        },
        {
          id: 'cache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.65,
          replicas: 2,
          opsPerSec: 30000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.92 },
          label: bi('Redis Cluster', 'Redis Cluster'),
          what: bi('Cụm Redis nhân bản có bật Singleflight và Jitter TTL.', 'Replicated Redis cluster with Singleflight and TTL jitter.'),
          how: bi('Gộp các truy vấn đồng thời cùng một mã đang Miss thành 1 lệnh đọc KV duy nhất.', 'Coalesces concurrent misses on viral keys into a single KV read.'),
          why: bi('Chặn hiện tượng dồn tải xuống KV khi link nổi tiếng vừa hết TTL.', 'Prevents cache stampedes when popular links expire.'),
        },
        {
          id: 'kv',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: -0.65,
          replicas: 3,
          opsPerSec: 4500,
          baseMs: 3,
          params: { shards: 3 },
          label: bi('Sharded KV', 'Sharded KV'),
          what: bi('Kho Key-Value phân mảnh theo Consistent Hashing trên mã ngắn.', 'Hash-partitioned NoSQL Key-Value store keyed by short code.'),
          how: bi('Chia đều bảng tỷ dòng sang 3 phân vùng độc lập, tra cứu O(1) theo khóa chính.', 'Distributes billions of mappings evenly across 3 shards.'),
          why: bi('Mở rộng tuyến tính cả dung lượng lưu trữ lẫn băng thông đọc/ghi.', 'Scales storage and IOPS linearly without cross-shard joins.'),
        },
        {
          id: 'queue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3,
          row: 0.65,
          replicas: 1,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 200000 },
          label: bi('Click Queue', 'Click Queue'),
          what: bi('Hàng đợi sự kiện tiếp nhận luồng lượt bấm để thống kê nền.', 'Event queue buffering redirect click logs asynchronously.'),
          how: bi('Nhận bản tin nhẹ từ App trong ~1 ms để Worker gom lô ghi sau.', 'Buffers lightweight click events for downstream batch aggregation.'),
          why: bi('Cách ly hoàn toàn độ trễ ghi thống kê khỏi phản hồi HTTP của người dùng.', 'Decouples analytics write spikes from user-facing redirect latency.'),
        },
        {
          id: 'worker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4,
          row: 0.65,
          replicas: 6,
          opsPerSec: 900,
          baseMs: 15,
          label: bi('Click Worker ×6', 'Click Worker ×6'),
          what: bi('Nhóm tiến trình nền gộp số đếm lượt click theo cửa sổ thời gian.', 'Background consumers aggregating click counts in micro-batches.'),
          how: bi('Kéo sự kiện từ Click Queue và ghi gộp thay vì ghi lẻ từng dòng.', 'Pulls from Click Queue and flushes aggregated counters.'),
          why: bi('Giảm hàng chục lần số thao tác ghi xuống kho phân tích.', 'Reduces analytics storage write amplification by orders of magnitude.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-app', from: 'lb', to: 'app' },
        { id: 'app-cache', from: 'app', to: 'cache', label: bi('Hit 92%', 'Hit 92%') },
        { id: 'cache-kv', from: 'cache', to: 'kv', label: bi('Miss 8%', 'Miss 8%') },
        { id: 'app-queue', from: 'app', to: 'queue', mode: 'async', fraction: 0.2, label: bi('Async Click', 'Async Click') },
        { id: 'queue-worker', from: 'queue', to: 'worker', mode: 'pull' },
      ],
      routes: {
        app: 'all-parallel',
      },
      zones: [
        { id: 'z-async', nodeIds: ['queue', 'worker'], label: bi('THỐNG KÊ BẤT ĐỒNG BỘ', 'ASYNC ANALYTICS'), tone: 'rose' },
      ],
      noteCard: {
        title: bi('v3 · Sharded KV + Async', 'v3 · Sharded KV + Async'),
        lines: [
          { text: bi('Singleflight bảo vệ KV khi viral', 'Singleflight shields KV on spikes'), tone: 'good' },
          { text: bi('Trần chịu tải ≈ 25.000 req/s tại Origin', 'Origin ceiling ≈ 25,000 req/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'url',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Global Edge CDN + Multi-AZ + Rate Protection', 'Global Edge CDN + Multi-AZ + Rate Protection'),
      eraTag: bi('50.000+ req/s · Sẵn sàng Production', '50,000+ req/s · Production Multi-AZ'),
      targetRps: 50000,
      readRatio: 0.99,
      seed: 7304,
      summary: bi(
        'Đưa chuyển hướng ra sát người dùng qua mạng lưới Edge CDN toàn cầu (~82% Edge Hit), đặt Rate Limiter bảo vệ API tạo link và triển khai Multi-AZ toàn bộ tầng dữ liệu.',
        'Pushes redirects to Global Edge CDN POPs (~82% edge hit), adds edge Rate Limiting against abuse, and runs Multi-AZ replicated Cache and KV shards.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 chịu tốt trên 100.000 req/s. Bước mở rộng xa hơn (nếu vượt hàng trăm nghìn req/s đa châu lục) là nhân bản kho KV Active-Active xuyên nhiều Region địa lý.',
        'Sustains >100,000 req/s cleanly. Further growth beyond hundreds of thousands of RPS across continents moves to multi-region active-active KV replication.'
      ),
      whatChanged: [
        diff('+', 'Đặt Global Edge CDN trả HTTP 301/302 ngay tại POP gần người dùng (~82% Hit)', 'Add Global Edge CDN serving cached redirects at nearby POPs (~82% hit)'),
        diff('+', 'Bổ sung Edge Rate Limiter chống script lạm dụng tạo link hàng loạt', 'Add Edge Rate Limiter to block automated link-spam floods'),
        diff('~', 'Mở rộng Multi-AZ cho LB (×4), App (×12), Redis (×4) và KV (6 phân vùng)', 'Scale LB (×4), App (×12), Redis (×4), and KV (6 shards) across AZs'),
      ],
      tradeOffs: [
        trade(
          'Phục vụ chuyển hướng ngay tại Edge CDN kèm bất đồng bộ Edge Log',
          'Serve redirects at Edge CDN with async edge log shipping',
          'Cắt >80% lưu lượng về Origin và rút ngắn RTT xuyên lục địa xuống vài ms',
          'Offloads >80% of origin traffic and cuts cross-continent RTT to single-digit ms',
          'Khi vô hiệu hoá một link độc hại cần gọi lệnh Purge CDN mất vài giây để lan truyền',
          'Revoking malicious links requires CDN cache purge propagation (~seconds)'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Toàn cầu', 'Global Users'),
          what: bi('50.000+ lượt truy cập mỗi giây từ nhiều châu lục.', '50,000+ requests/s arriving from global regions.'),
          how: bi('Kết nối vào trạm POP Anycast CDN gần nhất.', 'Terminates TLS at the nearest Anycast CDN POP.'),
          why: bi('Tránh vòng khứ hồi xuyên đại dương cho các liên kết phổ biến.', 'Eliminates transoceanic round-trips on cached short links.'),
        },
        {
          id: 'cdn',
          kind: 'cdn',
          shape: 'block',
          tone: 'blue',
          icon: 'globe',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 120000,
          baseMs: 1,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.82 },
          label: bi('Edge CDN', 'Edge CDN'),
          what: bi('Mạng phân phối biên lưu đệm ánh xạ chuyển hướng và đẩy Edge Log.', 'Global Edge POPs caching hot redirects close to users.'),
          how: bi('Trả lời ~82% lượt đọc ngay tại biên trong ~1 ms; chỉ ~18% đi tiếp về Origin.', 'Serves ~82% of reads at the edge in ~1 ms; forwards ~18% to Origin.'),
          why: bi('Tăng gấp 5 lần trần chịu tải toàn hệ thống với chi phí thấp.', 'Multiplies system throughput 5x while slashing origin egress.'),
        },
        {
          id: 'limiter',
          kind: 'rate-limiter',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 2,
          opsPerSec: 80000,
          baseMs: 0.3,
          params: { ratePerSec: 40000, burst: 8000 },
          label: bi('Rate Limiter', 'Rate Limiter'),
          what: bi('Bộ kiểm soát hạn ngạch ở cửa ngõ Origin chống lạm dụng.', 'Origin entry Token Bucket limiter protecting backend capacity.'),
          how: bi('Giới hạn lưu lượng vượt ngưỡng về Origin ở mức an toàn.', 'Caps origin ingress bursts cleanly with HTTP 429.'),
          why: bi('Ngăn bot quét mã ngắn hàng loạt đánh sập cụm lưu trữ.', 'Blocks enumeration bots and spam floods from reaching KV.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 3,
          row: 0,
          replicas: 3,
          opsPerSec: 20000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB', 'Multi-AZ LB'),
          what: bi('Cụm cân bằng tải trải đều qua 3 Availability Zone.', 'Cross-AZ load balancer cluster.'),
          how: bi('Phân phối ~9.500 req/s đi qua CDN vào 12 máy App.', 'Distributes ~9,500 origin req/s across 12 App servers.'),
          why: bi('Chịu được sự cố mất trọn 1 AZ mà không rơi kết nối.', 'Survives a full Availability Zone outage seamlessly.'),
        },
        {
          id: 'app',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 4,
          row: 0,
          replicas: 12,
          opsPerSec: 2400,
          baseMs: 5,
          params: { replicas: 12 },
          label: bi('App Tier ×12', 'App Tier ×12'),
          what: bi('Cụm ứng dụng Multi-AZ xử lý tạo link mới và Cache Miss từ CDN.', 'Multi-AZ stateless service handling link creation and CDN misses.'),
          how: bi('Kết hợp Range ID xáo bit (Feistel) để không lộ số thứ tự tăng dần.', 'Uses bit-shuffled range IDs so codes cannot be sequentially guessed.'),
          why: bi('Đảm bảo cả bảo mật lẫn hiệu năng cao ở quy mô lớn.', 'Prevents URL enumeration while sustaining high write speed.'),
        },
        {
          id: 'cache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 5,
          row: -0.65,
          replicas: 3,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.94 },
          label: bi('Origin Redis', 'Origin Redis'),
          what: bi('Tầng đệm Origin Shield giữa các vùng CDN và kho KV.', 'Multi-AZ Redis cluster acting as origin shield for KV shards.'),
          how: bi('Chặn tiếp 94% lượng đọc đi qua CDN để chỉ ~1% chạm đĩa KV.', 'Absorbs 94% of CDN read misses so <2% reach KV storage.'),
          why: bi('Giữ tải trên kho KV cực thấp ngay cả khi nhiều POP CDN cùng Miss.', 'Prevents regional CDN cold-starts from overwhelming KV shards.'),
        },
        {
          id: 'kv',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 6,
          row: -0.65,
          replicas: 6,
          opsPerSec: 5000,
          baseMs: 3,
          params: { shards: 6 },
          label: bi('KV 6 Shards', 'KV 6 Shards'),
          what: bi('Cụm 6 phân vùng NoSQL nhân bản chéo giữa các AZ.', '6-shard Multi-AZ NoSQL cluster storing durable short links.'),
          how: bi('Mỗi phân vùng có bản sao dự phòng tự động chuyển đổi khi lỗi.', 'Replicates data across AZs with automatic shard failover.'),
          why: bi('Đạt độ bền dữ liệu 5 năm và độ sẵn sàng 99,99%.', 'Delivers 5-year durability and 99.99% availability.'),
        },
        {
          id: 'queue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 5,
          row: 0.65,
          replicas: 2,
          opsPerSec: 60000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 500000 },
          label: bi('Event Stream', 'Event Stream'),
          what: bi('Luồng sự kiện phân vùng tiếp nhận log click từ CDN và Origin.', 'Partitioned event stream ingesting click telemetry.'),
          how: bi('Có Dead-Letter Queue cô lập bản tin sai định dạng.', 'Includes Dead-Letter Queue isolation for malformed events.'),
          why: bi('Không mất dữ liệu thống kê ngay cả trong giờ cao điểm.', 'Buffers massive viral click surges cleanly.'),
        },
        {
          id: 'worker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 6,
          row: 0.65,
          replicas: 12,
          opsPerSec: 1200,
          baseMs: 12,
          label: bi('Stream Worker', 'Stream Worker'),
          what: bi('Cụm 12 Worker tổng hợp bộ đếm theo cửa sổ phút/giờ.', '12 stream workers aggregating time-windowed click metrics.'),
          how: bi('Xử lý song theo phân vùng khóa liên kết.', 'Consumes partitioned click streams in parallel.'),
          why: bi('Cập nhật bảng điều khiển phân tích gần thời gian thực.', 'Powers near-real-time link analytics dashboards.'),
        },
      ],
      links: [
        { id: 'c-cdn', from: 'client', to: 'cdn', label: bi('Anycast', 'Anycast') },
        { id: 'cdn-lim', from: 'cdn', to: 'limiter', label: bi('Miss 18%', 'Miss 18%') },
        { id: 'lim-lb', from: 'limiter', to: 'lb' },
        { id: 'lb-app', from: 'lb', to: 'app' },
        { id: 'app-cache', from: 'app', to: 'cache' },
        { id: 'cache-kv', from: 'cache', to: 'kv' },
        { id: 'app-queue', from: 'app', to: 'queue', mode: 'async', fraction: 0.35 },
        { id: 'queue-worker', from: 'queue', to: 'worker', mode: 'pull' },
      ],
      routes: {
        app: 'all-parallel',
      },
      zones: [
        { id: 'z-origin', nodeIds: ['app', 'cache', 'kv'], label: bi('MULTI-AZ ORIGIN', 'MULTI-AZ ORIGIN'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v4 · Global Edge + Multi-AZ', 'v4 · Global Edge + Multi-AZ'),
        lines: [
          { text: bi('CDN hấp thụ ~82% ngay tại biên', 'CDN serves ~82% at the edge'), tone: 'good' },
          { text: bi('Chịu tải > 110.000 req/s · p99 < 15 ms', 'Sustains > 110K req/s · p99 < 15 ms'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 2. SOCIAL NEWS FEED — Linked Module: S5-03
 * ============================================================================ */
const CASE_NEWS_FEED: SdDesignCase = {
  id: 'news-feed',
  order: 2,
  linkedModuleId: 'S5-03',
  domainTag: bi('Hybrid Fan-out · Timeline Cache · Zipf', 'Hybrid Fan-out · Timeline Cache · Zipf'),
  difficulty: 'Advanced',
  title: bi('News Feed mạng xã hội', 'Social Network News Feed'),
  subtitle: bi(
    'Tổng hợp bảng tin cá nhân hoá từ hàng trăm tài khoản theo dõi với sự kết hợp Fan-out on Write và Fan-out on Read cho Celebrity.',
    'Personalized timeline generation combining Fan-out on Write for regular graphs and Fan-out on Read for high-follower celebrities.'
  ),
  problemBrief: bi(
    'Thiết kế hệ thống News Feed cho mạng xã hội lớn: người dùng đăng bài viết mới và cuộn xem dòng thời gian sắp xếp theo mức độ mới/phù hợp từ những người họ theo dõi.',
    'Design a large-scale social News Feed where users publish posts and scroll a ranked home timeline aggregated from accounts they follow.'
  ),
  clarifyingQuestions: [
    {
      id: 'feed-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Quy mô DAU, tần suất tải bảng tin và số lượng bài đăng mới mỗi giây là bao nhiêu?',
        'What is the DAU count, daily feed-refresh frequency, and new post creation rate?'
      ),
      answer: bi(
        '50 triệu DAU mở ứng dụng trung bình 10 lần/ngày (~6.000 đọc/giây trung bình, ~50.000 đọc/giây đỉnh buổi tối) và đăng khoảng 300–2.500 bài viết mới/giây.',
        '50M DAU refreshing ~10 times/day (~6,000 reads/s avg, ~50,000 reads/s evening peak) with 300–2,500 new posts/s.'
      ),
      rationale: bi(
        'Cho thấy đọc nhiều gấp ~20 lần ghi; nếu tính toán lại bảng tin từ đầu ở mỗi lần mở app sẽ nhân truy vấn lên hàng trăm lần.',
        'Reveals a 20:1 read-heavy profile where recomputing feeds from scratch on every read multiplies backend lookups 200x.'
      ),
    },
    {
      id: 'feed-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Trung bình một người theo dõi bao nhiêu tài khoản, và có tài khoản Celebrity sở hữu hàng chục triệu người theo dõi không?',
        'How many accounts does an average user follow, and do Celebrity accounts have tens of millions of followers?'
      ),
      answer: bi(
        'Trung bình mỗi người theo dõi ~200 tài khoản, nhưng phân phối rất lệch: có những tài khoản nổi tiếng sở hữu 10–50 triệu follower.',
        'Average follow count is ~200, but follower graphs are heavily skewed with celebrities having 10M–50M followers.'
      ),
      rationale: bi(
        'Đây là ràng buộc quyết định kiến trúc: thuần Push sẽ nghẽn khi Celebrity đăng bài, còn thuần Pull sẽ nghẽn khi 50.000 người cùng đọc.',
        'Directly dictates a Hybrid Fan-out design: pure Push stalls on celebrity posts, while pure Pull melts DBs at 50K reads/s.'
      ),
    },
    {
      id: 'feed-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Độ trễ mở trang đầu News Feed (p99) và thời gian chấp nhận được để bài đăng mới hiện trên máy follower?',
        'What is the p99 latency SLA for loading page-1 of the feed and acceptable propagation delay for new posts?'
      ),
      answer: bi(
        'Tải trang đầu News Feed cần đạt p99 < 150 ms; bài đăng mới xuất hiện cho người theo dõi trong vòng 2–5 giây là hoàn toàn chấp nhận được (Eventual Consistency).',
        'Home feed page-1 read p99 < 150 ms; 2–5 seconds eventual consistency for new post fan-out is acceptable.'
      ),
      rationale: bi(
        'Cho phép tách luồng phân phát bài đăng (Fan-out) ra khỏi phản hồi HTTP của người đăng thông qua hàng đợi bất đồng bộ.',
        'Allows asynchronous background fan-out while serving precomputed home timelines directly from RAM.'
      ),
    },
    {
      id: 'feed-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Trong bộ nhớ đệm Timeline Cache nên lưu nguyên nội dung bài viết hay chỉ lưu danh sách ID, và phân trang thế nào khi có bài mới chèn vào?',
        'Should Timeline Cache store full post payloads or compact IDs, and how should pagination avoid duplicate rows?'
      ),
      answer: bi(
        'Chỉ lưu danh sách giới hạn ~500 cặp (post_id, author_id) gần nhất cho người dùng hoạt động trong 7 ngày qua (~8 KB/người) và dùng Cursor Pagination thay vì OFFSET.',
        'Store only the latest ~500 (post_id, author_id) references for active users (~8 KB/user) and paginate via cursor IDs instead of OFFSET.'
      ),
      rationale: bi(
        'Giữ tổng RAM Timeline Cache trong tầm kiểm soát (~400 GB thay vì hàng chục TB) và không bị lặp bài khi cuộn trang.',
        'Reduces Timeline Cache RAM by >20x and prevents shifted/duplicate items when new posts arrive mid-scroll.'
      ),
    },
    {
      id: 'feed-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Khung soạn thảo trạng thái nên dùng bộ chọn biểu tượng cảm xúc gồm 3 cột hay 5 cột?',
        'Should the post composer emoji picker display 3 columns or 5 columns?'
      ),
      answer: bi(
        'Chuỗi ký tự Unicode được gửi như văn bản UTF-8 thông thường.',
        'Emojis serialize as standard UTF-8 code points in the post text.'
      ),
      rationale: bi(
        'Chi tiết bố cục khung nhập liệu trên trình duyệt không tác động tới luồng Fan-out hay thiết kế phân vùng dữ liệu.',
        'Client UI layout choices do not affect backend fan-out amplification or timeline caching.'
      ),
    },
    {
      id: 'feed-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Mô hình học máy xếp hạng bài viết nên dùng hàm kích hoạt GELU hay Swish ở lớp ẩn thứ tư?',
        'Should the feed ranking neural network use GELU or Swish activation in its fourth hidden layer?'
      ),
      answer: bi(
        'Chi tiết kiến trúc nội bộ của mô hình ML nằm ngoài phạm vi thiết kế hạ tầng phân tán 45 phút.',
        'Internal neural layer choices belong to ML modeling, outside a 45-minute distributed systems design.'
      ),
      rationale: bi(
        'Ở góc độ kiến trúc hệ thống, ta chỉ cần đóng khung Ranking Service như một bước chấm điểm ≤ 35 ms trên 500 ID ứng viên.',
        'System design bounds the Ranking Service by its latency budget (≤ 35 ms over ~500 candidate IDs) and fallback behavior.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('50M DAU', '50M DAU'),
    readRps: bi('6.000 TB / 50.000 đỉnh req/s', '6,000 avg / 50,000 peak req/s'),
    writeRps: bi('300 TB / 2.500 đỉnh bài/s', '300 avg / 2,500 peak posts/s'),
    readWriteRatio: bi('20 : 1 (95% Đọc)', '20 : 1 (95% Reads)'),
    storagePerDay: bi('~1,5 TB bài viết & đồ thị mới/ngày', '~1.5 TB new posts & edges/day'),
    memoryOrBandwidth: bi('~400 GB Timeline Cache (500 IDs/user)', '~400 GB Timeline Cache (500 IDs/user)'),
    slos: [
      bi('Feed Read p99 < 150 ms', 'Feed Read p99 < 150 ms'),
      bi('Post Fan-out lag < 5 s', 'Post Fan-out lag < 5 s'),
      bi('Cursor Pagination không lặp bài', 'Duplicate-free Cursor Pagination'),
    ],
    snakeSummary: {
      scope: bi('Đăng bài, theo dõi tài khoản, đọc bảng tin cá nhân hoá theo con trỏ.', 'Publish post, follow graph, cursor-paginated personalized home feed.'),
      numbers: bi('50M DAU, 50K đọc/s đỉnh, 200 follower TB, Celebrity > 1M follower.', '50M DAU, 50K peak reads/s, 200 avg followers, Celebrities > 1M.'),
      api: bi('POST /v1/posts · GET /v1/feed?cursor={id}&limit=20.', 'POST /v1/posts · GET /v1/feed?cursor={id}&limit=20.'),
      keyComponents: bi('Feed Service, Timeline Redis, Post/User Cache, Fan-out Queue + Workers, Graph Store.', 'Feed Service, Timeline Redis, Post/User Cache, Fan-out Queue + Workers, Graph Store.'),
      elaborate: bi('Hybrid Fan-out (Push < 50K follower, Pull khi đọc với Celebrity), hidrat hoá Post ID từ Cache.', 'Hybrid Fan-out (Push < 50K followers, Pull-on-read for Celebrities), batch ID hydration.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'feed',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Fan-out on Read trực tiếp trên SQL', 'SQL Pull-on-Read (JOIN + ORDER BY)'),
      eraTag: bi('100 req/s · MVP đơn giản', '100 req/s · Pull-on-Read MVP'),
      targetRps: 100,
      readRatio: 0.95,
      seed: 7311,
      summary: bi(
        'Khi đăng bài chỉ INSERT 1 dòng vào SQL; mỗi khi người dùng mở bảng tin, hệ thống chạy câu truy vấn JOIN bảng follows với bảng posts và sắp xếp theo thời gian.',
        'Publishing inserts 1 row; every home-feed open executes a heavy SQL JOIN across follows and posts sorted by timestamp.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (500 req/s), mỗi lượt mở feed phải quét hàng trăm người đang theo dõi rồi sắp xếp trên đĩa khiến SQL (μ = 220 req/s) quá tải tức khắc.',
        'At 5x load (500 req/s), joining 200 followees and sorting posts on every read saturates SQL (μ = 220 req/s) immediately.'
      ),
      whatChanged: [
        diff('+', '1 Feed Monolith xử lý cả đăng bài lẫn truy vấn dòng thời gian', 'Single Feed Monolith serving post writes and timeline reads'),
        diff('+', '1 SQL Database chạy SELECT ... JOIN follows ORDER BY created_at DESC', 'Single SQL running JOIN follows + ORDER BY created_at DESC'),
      ],
      tradeOffs: [
        trade(
          'Tính toán bảng tin lúc đọc (Pull on Read) trên SQL',
          'Compute timeline at read time via SQL JOIN',
          'Ghi bài mới cực nhẹ (O(1)), kể cả tài khoản triệu người theo dõi',
          'O(1) post writes with zero write amplification even for celebrities',
          'Chi phí đọc O(N_followees) rất nặng, độ trễ tăng nhanh theo số người theo dõi',
          'Expensive O(N_followees) read queries that collapse under concurrent traffic'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('Người dùng cuộn bảng tin và đăng bài mới.', 'Users scrolling home feeds and posting updates.'),
          how: bi('95% request là tải trang bảng tin, 5% là tạo bài viết.', '95% timeline reads, 5% new post writes.'),
          why: bi('Mỗi lần tải trang yêu cầu hợp nhất bài viết từ ~200 tài khoản.', 'Each read aggregates recent posts across ~200 followed authors.'),
        },
        {
          id: 'feedSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 600,
          baseMs: 10,
          label: bi('Feed App', 'Feed App'),
          what: bi('Ứng dụng web dựng JSON bảng tin cho người dùng.', 'Monolithic application assembling feed responses.'),
          how: bi('Ủy quyền toàn bộ việc lọc và sắp xếp bài viết xuống SQL.', 'Delegates filtering and chronological sorting to SQL.'),
          why: bi('Phù hợp cho giai đoạn thử nghiệm vài nghìn người dùng đầu tiên.', 'Quick to build for early-stage social prototypes.'),
        },
        {
          id: 'postDb',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 220,
          baseMs: 24,
          label: bi('Posts SQL', 'Posts SQL'),
          what: bi('Cơ sở dữ liệu lưu cả bảng follows lẫn bảng posts.', 'Relational DB storing both social graph edges and posts.'),
          how: bi('Thực thi phép kết nối 200 tác giả và sắp xếp Top-20 mỗi lần đọc.', 'Joins ~200 followees and sorts recent rows on every read.'),
          why: bi('Tốn nhiều CPU/I/O mỗi truy vấn (24 ms nền, tối đa ~220 req/s).', 'High per-query cost (~24 ms base, ~220 req/s ceiling).'),
        },
      ],
      links: [
        { id: 'c-app', from: 'client', to: 'feedSvc' },
        { id: 'app-db', from: 'feedSvc', to: 'postDb', label: bi('JOIN 200 users', 'JOIN 200 users') },
      ],
      noteCard: {
        title: bi('v1 · Pull on Read SQL', 'v1 · Pull on Read SQL'),
        lines: [
          { text: bi('Đăng bài O(1) nhưng đọc rất nặng', 'O(1) write, heavy JOIN on read'), tone: 'amber' },
          { text: bi('Trần chịu tải ≈ 220 req/s (nghẽn SQL)', 'Ceiling ≈ 220 req/s (SQL bound)'), tone: 'plain' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'feed',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Post Cache + Read Replicas (vẫn Pull lúc đọc)', 'Post Cache + Read Replicas (Pull Model)'),
      eraTag: bi('2.000 req/s · Đệm đối tượng & Replica', '2,000 req/s · Object Cache & Replicas'),
      targetRps: 2000,
      readRatio: 0.95,
      seed: 7312,
      summary: bi(
        'Tách đọc sang cụm Read Replicas và đệm danh sách bài gần nhất của từng tác giả trong Redis, giúp ghép bảng tin nhanh hơn mà chưa cần tính sẵn hộp thư.',
        'Offloads reads to SQL Read Replicas and caches per-author recent post lists in Redis, still merging feeds at read time.'
      ),
      whyNextStage: bi(
        'Khi đẩy tải 5× lên 10.000 req/s, việc hợp nhất 200 danh sách tác giả ngay trên đường đọc làm cụm Feed Service và Read Replicas cạn kiệt CPU.',
        'At 5x load (10,000 req/s), merging 200 author lists synchronously on every read saturates Feed Service CPU and Read Replicas.'
      ),
      whatChanged: [
        diff('+', 'Thêm Load Balancer và mở rộng Feed Service (×3)', 'Add Load Balancer and scale Feed Service (×3)'),
        diff('+', 'Thêm Author/Post Cache (Hit ~78%) và cặp SQL Read Replicas', 'Add Author/Post Cache (~78% hit) and SQL Read Replicas'),
        diff('~', 'Tách riêng luồng ghi vào Primary và luồng đọc sang Replicas', 'Split writes to Primary and reads to Replicas'),
      ],
      tradeOffs: [
        trade(
          'Đệm bài viết theo tác giả + Read Replicas nhưng vẫn gộp lúc đọc',
          'Cache author post lists + Read Replicas with read-time merge',
          'Nâng sức chịu tải gấp ~16 lần so với v1 mà chưa cần hạ tầng Queue phức tạp',
          'Boosts throughput ~16x over v1 without background fan-out pipelines',
          'Mỗi lượt đọc vẫn phải lấy và trộn hàng trăm danh sách con, khó vượt ngưỡng chục nghìn RPS',
          'Every read still merges ~200 lists, creating heavy internal fan-out at high QPS'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('Lưu lượng 2.000 req/s cuộn xem bảng tin.', '2,000 req/s social feed traffic.'),
          how: bi('Gửi GET /v1/feed và POST /v1/posts.', 'Sends GET /v1/feed and POST /v1/posts.'),
          why: bi('Đòi hỏi tách tải đọc ra khỏi cơ sở dữ liệu ghi chính.', 'Requires separating read load from the primary write DB.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải điều phối request vào cụm Feed Service.', 'Load Balancer routing requests across Feed Service nodes.'),
          how: bi('Chia đều tải đọc/ghi cho 3 máy ứng dụng.', 'Distributes traffic evenly across 3 instances.'),
          why: bi('Tránh nghẽn CPU trên một máy ứng dụng đơn lẻ.', 'Removes single-server compute limits.'),
        },
        {
          id: 'feedSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 3,
          opsPerSec: 1250,
          baseMs: 14,
          label: bi('Feed Svc ×3', 'Feed Svc ×3'),
          what: bi('Cụm dịch vụ gom bài từ danh sách người đang theo dõi và sắp xếp.', 'Stateless tier fetching followee posts and merging top-K.'),
          how: bi('Gọi hàng loạt vào Post Cache; những tác giả Miss được đọc từ Read Replica.', 'Batch-fetches from Post Cache; falls back to Read Replicas on misses.'),
          why: bi('Xử lý gộp danh sách trong RAM ứng dụng thay vì SQL JOIN.', 'Moves list-merge work out of SQL into horizontally scalable services.'),
        },
        {
          id: 'postCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.8,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.78 },
          label: bi('Post Cache', 'Post Cache'),
          what: bi('Redis lưu nội dung bài viết và danh sách bài mới theo tác giả.', 'Redis caching recent post objects and follow lists.'),
          how: bi('Phục vụ ~78% lượt tra cứu mà không chạm xuống Replica.', 'Serves ~78% of read lookups from memory.'),
          why: bi('Giảm số truy vấn đĩa cho các tài khoản hoạt động thường xuyên.', 'Cuts disk reads for active social accounts.'),
        },
        {
          id: 'readRep',
          kind: 'sql',
          shape: 'db',
          tone: 'blue',
          col: 4,
          row: -0.6,
          replicas: 2,
          opsPerSec: 650,
          baseMs: 8,
          label: bi('Read Replicas', 'Read Replicas'),
          what: bi('Cặp bản sao SQL chuyên phục vụ các truy vấn đọc bị Miss Cache.', 'Two SQL read replicas serving cache-miss queries.'),
          how: bi('Nhận luồng đồng bộ bất đồng bộ từ Posts Primary.', 'Receives asynchronous replication stream from Primary.'),
          why: bi('Mở rộng băng thông đọc mà không làm chậm giao dịch ghi bài.', 'Scales read IOPS without contending with write locks.'),
        },
        {
          id: 'postDb',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 3.5,
          row: 0.65,
          replicas: 1,
          opsPerSec: 900,
          baseMs: 5,
          label: bi('Posts Primary', 'Posts Primary'),
          what: bi('Cơ sở dữ liệu chính nhận các bài đăng mới và quan hệ theo dõi.', 'Primary database accepting post writes and follow mutations.'),
          how: bi('Ghi bền vững và phát luồng binlog sang Read Replicas.', 'Commits writes and streams binlog updates to Read Replicas.'),
          why: bi('Giữ luồng ghi gọn nhẹ ở mức ~100 bài/giây.', 'Handles ~100 writes/s cleanly.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-svc', from: 'lb', to: 'feedSvc' },
        { id: 'svc-cache', from: 'feedSvc', to: 'postCache', carries: 'r', label: bi('Read 95%', 'Read 95%') },
        { id: 'cache-rep', from: 'postCache', to: 'readRep', carries: 'r', label: bi('Miss 22%', 'Miss 22%') },
        { id: 'svc-primary', from: 'feedSvc', to: 'postDb', carries: 'w', label: bi('Write 5%', 'Write 5%') },
        { id: 'db-repl', from: 'postDb', to: 'readRep', mode: 'replicate' },
      ],
      noteCard: {
        title: bi('v2 · Post Cache + Replicas', 'v2 · Post Cache + Replicas'),
        lines: [
          { text: bi('Tách luồng Đọc (Replica) và Ghi (Primary)', 'Separated Read Replicas & Write Primary'), tone: 'good' },
          { text: bi('Gộp 200 tác giả lúc đọc nghẽn ở ~3.750 req/s', 'Read-time merge caps out near ~3,750 req/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'feed',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Fan-out on Write + Precomputed Timeline Cache', 'Fan-out on Write + Precomputed Timeline Cache'),
      eraTag: bi('15.000 req/s · Tính sẵn lúc ghi', '15,000 req/s · Precomputed Timelines'),
      targetRps: 15000,
      readRatio: 0.95,
      seed: 7313,
      summary: bi(
        'Chuyển phần việc nặng sang lúc đăng bài: Fan-out Worker đẩy ID bài viết mới vào sẵn danh sách Timeline Cache của từng follower để lúc mở app chỉ đọc O(1) từ RAM.',
        'Shifts heavy work to write time: Fan-out Workers push new post IDs into each follower’s precomputed Redis timeline list so reads become O(1).'
      ),
      whyNextStage: bi(
        'Ở mức tải 5× (75.000 req/s, tương đương ~3.750 bài mới/giây có lẫn tài khoản Celebrity triệu follower), cụm Fan-out Worker thuần Push bị quá tải và dồn hàng đợi (Hotkey Fan-out Lag).',
        'At 5x load (75,000 req/s with ~3,750 writes/s including mega-celebrities), pure Push fan-out overwhelms Fan-out Workers and builds massive queue lag.'
      ),
      whatChanged: [
        diff('+', 'Thêm Timeline Cache lưu sẵn 500 Post ID mới nhất cho mỗi người dùng (Hit ~94%)', 'Add precomputed Timeline Cache storing 500 post IDs per active user (~94% hit)'),
        diff('+', 'Thêm Fan-out Queue + Fan-out Workers đẩy ID bài mới tới hộp thư follower', 'Add Fan-out Queue + Workers pushing post IDs to follower timelines asynchronously'),
        diff('~', 'Chuyển kho bài viết sang Sharded Post Store (NoSQL) phục vụ hidrat hoá nội dung', 'Migrate posts to Sharded NoSQL Post Store for fast batch ID hydration'),
      ],
      tradeOffs: [
        trade(
          'Thuần Fan-out on Write (Push cho mọi tài khoản)',
          'Pure Fan-out on Write (Push to all followers)',
          'Đọc bảng tin cực nhanh O(1) từ một danh sách Redis duy nhất (~10–25 ms)',
          'Blazing-fast O(1) timeline reads from a single Redis list (~10–25 ms)',
          'Khuếch đại ghi nghiêm trọng khi Celebrity 20 triệu follower đăng bài cùng lúc',
          'Massive write amplification when a 20M-follower celebrity posts'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('15.000 req/s mở bảng tin và đăng bài.', '15,000 req/s timeline reads and post publishes.'),
          how: bi('Đọc theo con trỏ (cursor) từ danh sách đã tính sẵn.', 'Fetches cursor-paginated feeds with low latency.'),
          why: bi('Cần tốc độ phản hồi dưới 50 ms cho trải nghiệm cuộn mượt.', 'Expects instant home-screen rendering.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải phân phối lưu lượng vào tầng Feed API.', 'High-availability Load Balancer pair.'),
          how: bi('Chịu tải tới 90.000 req/s.', 'Routes up to 90,000 req/s.'),
          why: bi('Đảm bảo không nghẽn ở tầng định tuyến.', 'Eliminates single-LB bottlenecks.'),
        },
        {
          id: 'feedSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 16,
          opsPerSec: 3400,
          baseMs: 6,
          label: bi('Feed API ×16', 'Feed API ×16'),
          what: bi('Tầng API đọc danh sách ID từ Timeline Cache và nạp chi tiết bài viết.', 'Stateless API reading precomputed timeline IDs and hydrating post metadata.'),
          how: bi('Khi ghi: lưu bài viết rồi phát sự kiện sang Fan-out Queue ngay.', 'On write: persists post and enqueues async fan-out job.'),
          why: bi('Không còn phải trộn 200 danh sách tác giả lúc người dùng đọc.', 'Freed from expensive 200-way read-time merges.'),
        },
        {
          id: 'timelineCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.65,
          replicas: 3,
          opsPerSec: 30000,
          baseMs: 0.6,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.94 },
          label: bi('Timeline Cache', 'Timeline Cache'),
          what: bi('Cụm Redis lưu danh sách 500 ID bài viết mới nhất của từng người dùng hoạt động.', 'Redis cluster holding each active user’s latest 500 post IDs.'),
          how: bi('Đạt ~94% Hit cho người dùng mở app thường xuyên.', 'Delivers ~94% hit rate on timeline reads.'),
          why: bi('Biến thao tác đọc bảng tin phức tạp thành một lần đọc mảng trong RAM.', 'Turns complex social feed assembly into a single RAM slice read.'),
        },
        {
          id: 'postStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: -0.65,
          replicas: 3,
          opsPerSec: 4500,
          baseMs: 3.5,
          params: { shards: 3 },
          label: bi('Post Store', 'Post Store'),
          what: bi('Kho NoSQL phân mảnh lưu nội dung bài viết và đồ thị theo dõi.', 'Sharded NoSQL store persisting post payloads and follow edges.'),
          how: bi('Phục vụ các lượt Miss của Timeline Cache và lưu bài viết gốc.', 'Serves cold-user cache misses and durable post writes.'),
          why: bi('Chịu tải ghi cao và mở rộng ngang theo post_id / user_id.', 'Scales horizontally across post and user partitions.'),
        },
        {
          id: 'fanoutQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3,
          row: 0.65,
          replicas: 1,
          opsPerSec: 40000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 150000 },
          label: bi('Fan-out Queue', 'Fan-out Queue'),
          what: bi('Hàng đợi phát tán bài viết mới tới danh sách người theo dõi.', 'Queue buffering post-publish events for follower distribution.'),
          how: bi('Nhận 750 sự kiện đăng bài/giây ở mức 15.000 req/s.', 'Buffers ~750 post writes/s at 15K total RPS.'),
          why: bi('Giúp người đăng bài nhận phản hồi thành công ngay lập tức.', 'Lets authors get instant publish confirmations.'),
        },
        {
          id: 'fanoutWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'git',
          col: 4,
          row: 0.65,
          replicas: 3,
          opsPerSec: 420,
          baseMs: 22,
          label: bi('Fan-out Worker', 'Fan-out Worker'),
          what: bi('Worker đọc danh sách toàn bộ follower rồi đẩy ID bài vào từng hộp thư Redis.', 'Workers expanding every post across all follower Redis lists.'),
          how: bi('Tổng năng lực ~1.260 bài/giây — dễ nghẽn khi gặp nhiều bài từ Celebrity.', 'Capacity ~1,260 posts/s—saturates rapidly under celebrity fan-out spikes.'),
          why: bi('Lộ rõ giới hạn của thuần Fan-out on Write khi đồ thị lệch Zipf.', 'Highlights why pure Push struggles with millions-of-followers accounts.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-svc', from: 'lb', to: 'feedSvc' },
        { id: 'svc-tl', from: 'feedSvc', to: 'timelineCache', carries: 'r', label: bi('O(1) Read', 'O(1) Read') },
        { id: 'tl-store', from: 'timelineCache', to: 'postStore', carries: 'r', label: bi('Cold 6%', 'Cold 6%') },
        { id: 'svc-store-w', from: 'feedSvc', to: 'postStore', carries: 'w' },
        { id: 'svc-fq', from: 'feedSvc', to: 'fanoutQueue', mode: 'async', carries: 'w', label: bi('Push All', 'Push All') },
        { id: 'fq-worker', from: 'fanoutQueue', to: 'fanoutWorker', mode: 'pull' },
      ],
      routes: {
        feedSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-fanout', nodeIds: ['fanoutQueue', 'fanoutWorker'], label: bi('PURE PUSH FAN-OUT', 'PURE PUSH FAN-OUT'), tone: 'rose' },
      ],
      noteCard: {
        title: bi('v3 · Fan-out on Write', 'v3 · Fan-out on Write'),
        lines: [
          { text: bi('Đọc O(1) từ Timeline Cache (Hit 94%)', 'O(1) reads from Timeline Cache (94%)'), tone: 'good' },
          { text: bi('Celebrity làm nghẽn Fan-out Worker khi ×5', 'Celebrity posts saturate Workers at ×5'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'feed',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Hybrid Fan-out (Push thường + Pull Celebrity) + Edge Media', 'Hybrid Fan-out + Celebrity Cache + Edge CDN'),
      eraTag: bi('50.000+ req/s · Kiến trúc Hybrid chuẩn', '50,000+ req/s · Production Hybrid'),
      targetRps: 50000,
      readRatio: 0.95,
      seed: 7314,
      summary: bi(
        'Áp dụng Hybrid Fan-out: chỉ Push vào Timeline Cache cho tài khoản thường (< 50K follower); với tài khoản Celebrity, lưu vào Celebrity Cache riêng và trộn nhanh lúc đọc, kèm CDN cho ảnh/video.',
        'Adopts Hybrid Fan-out: pushes to follower caches only for normal accounts (<50K followers), while merging cached Celebrity posts on read alongside Edge CDN media.'
      ),
      whyNextStage: bi(
        'Kiến trúc Hybrid v4 vận hành ổn định trên 95.000 req/s với độ trễ p99 thấp và loại bỏ hoàn toàn nghẽn phát tán của tài khoản triệu follower.',
        'Hybrid v4 sustains >95,000 req/s smoothly while eliminating celebrity write-amplification stalls.'
      ),
      whatChanged: [
        diff('~', 'Chuyển từ thuần Push sang Hybrid: bỏ qua Push cho tài khoản > 50K follower', 'Switch to Hybrid Fan-out: skip write fan-out for >50K-follower celebrities'),
        diff('+', 'Trộn Timeline Cache + Celebrity Cache ngay trong RAM tại Ranking/Feed Tier', 'Merge user Timeline Cache with tiny in-RAM Celebrity Cache at read time'),
        diff('+', 'Thêm Edge CDN phân tải tài nguyên tĩnh/ảnh và mở rộng Multi-AZ 8 phân vùng', 'Add Edge CDN offload and scale Multi-AZ Post Store to 8 shards'),
      ],
      tradeOffs: [
        trade(
          'Hybrid Fan-out tách ngưỡng follower (ví dụ 50.000 follower)',
          'Hybrid Fan-out split at a 50,000-follower threshold',
          'Giữ tốc độ đọc nhanh đồng thời cắt bỏ >90% chi phí ghi thừa của Celebrity',
          'Preserves fast reads while eliminating >90% of celebrity write amplification',
          'Đường đọc phức tạp hơn một chút vì phải gộp thêm danh sách Celebrity đang theo dõi',
          'Slightly more complex read path merging precomputed inbox + followed celebrities'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Người dùng', 'Users'),
          what: bi('50.000 req/s giờ cao điểm trên mạng xã hội.', '50,000 req/s peak social timeline traffic.'),
          how: bi('Tải ảnh/avatar từ CDN và gọi API lấy danh sách bài đã xếp hạng.', 'Loads media via CDN and fetches ranked JSON feeds.'),
          why: bi('Kiểm chứng sự cân bằng giữa đọc nhanh và ghi ổn định.', 'Validates balanced read latency and write stability.'),
        },
        {
          id: 'cdn',
          kind: 'cdn',
          shape: 'block',
          tone: 'blue',
          icon: 'globe',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 120000,
          baseMs: 1,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.45 },
          label: bi('Edge & Cache', 'Edge & Cache'),
          what: bi('Tầng biên phục vụ media, bảng tin khách vãng lai và tài nguyên chung.', 'Edge POPs offloading public feeds, avatars, and static payloads.'),
          how: bi('Giảm ~43% tổng request đi sâu vào cụm API động.', 'Absorbs ~43% of edge requests before hitting dynamic APIs.'),
          why: bi('Giảm RTT mạng di động và tiết kiệm băng thông Origin.', 'Lowers mobile RTT and protects dynamic Feed APIs.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 4,
          opsPerSec: 20000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB', 'Multi-AZ LB'),
          what: bi('Cụm 4 Load Balancer phân phối tải xuyên nhiều AZ.', '4-node Multi-AZ Load Balancer tier.'),
          how: bi('Tổng thông lượng 80.000 req/s tới cụm Feed & Rank.', 'Provides 80,000 req/s routing capacity.'),
          why: bi('Loại bỏ điểm nghẽn mạng ở lối vào.', 'Ensures zero ingress bottlenecks.'),
        },
        {
          id: 'feedSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'sparkles',
          col: 3,
          row: 0,
          replicas: 24,
          opsPerSec: 2300,
          baseMs: 8,
          label: bi('Feed & Rank ×24', 'Feed & Rank ×24'),
          what: bi('Dịch vụ hợp nhất Timeline Cache với danh sách vài Celebrity mà user theo dõi rồi chấm điểm.', 'Service merging pushed Timeline Cache with pulled Celebrity posts and ranking.'),
          how: bi('Chỉ trộn thêm trung bình 3–5 tài khoản Celebrity từ RAM nên vẫn dưới 10 ms.', 'Merges only 3–5 followed celebrities from RAM in single-digit ms.'),
          why: bi('Đạt đồng thời độ trễ đọc thấp và không gây bão ghi khi người nổi tiếng đăng bài.', 'Combines fast reads with bounded write fan-out.'),
        },
        {
          id: 'timelineCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4,
          row: -0.65,
          replicas: 4,
          opsPerSec: 35000,
          baseMs: 0.6,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.96 },
          label: bi('Timeline + Celeb', 'Timeline + Celeb'),
          what: bi('Cụm Redis lưu cả hộp thư cá nhân lẫn bộ đệm bài đăng của nhóm Celebrity.', 'Clustered Redis holding both user timelines and hot Celebrity post lists.'),
          how: bi('Phục vụ 96% lượt đọc trực tiếp từ bộ nhớ phân vùng.', 'Serves 96% of feed lookups and hydrations from RAM.'),
          why: bi('Tránh gần như hoàn toàn việc quét đĩa trên đường đọc.', 'Keeps disk I/O off the critical home-feed path.'),
        },
        {
          id: 'postStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5,
          row: -0.65,
          replicas: 8,
          opsPerSec: 5000,
          baseMs: 3,
          params: { shards: 8 },
          label: bi('Post Store ×8', 'Post Store ×8'),
          what: bi('Cụm 8 phân vùng NoSQL lưu trữ bền vững bài viết và quan hệ xã hội.', '8-shard Multi-AZ NoSQL cluster storing posts and social graph.'),
          how: bi('Phân vùng theo tác giả/thời gian kèm bản sao dự phòng tự động.', 'Partitioned with cross-AZ replicas for high durability.'),
          why: bi('Dư sức tiếp nhận hàng nghìn bài viết mới mỗi giây.', 'Easily absorbs thousands of concurrent writes/s.'),
        },
        {
          id: 'fanoutQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4,
          row: 0.65,
          replicas: 2,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 300000 },
          label: bi('Hybrid Queue', 'Hybrid Queue'),
          what: bi('Hàng đợi chỉ nhận tác vụ Push của tài khoản thường (< 50K follower).', 'Queue receiving fan-out jobs only for non-celebrity authors.'),
          how: bi('Bài của Celebrity cập nhật thẳng Celebrity Cache, không nở thành triệu tác vụ.', 'Celebrity posts update Celebrity Cache in O(1), bypassing million-way fan-out.'),
          why: bi('Triệt tiêu hoàn toàn hiện tượng dồn ứ hàng đợi.', 'Eliminates celebrity head-of-line backlog completely.'),
        },
        {
          id: 'fanoutWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'git',
          col: 5,
          row: 0.65,
          replicas: 14,
          opsPerSec: 700,
          baseMs: 12,
          label: bi('Push Worker ×14', 'Push Worker ×14'),
          what: bi('14 Worker chuyên đẩy bài cho đồ thị bạn bè cỡ vừa và nhỏ.', '14 workers fanning out bounded social graphs via Redis pipelines.'),
          how: bi('Mỗi tác vụ giới hạn tối đa < 50.000 mục nên thời gian xử lý ổn định.', 'Bounded fan-out degree guarantees predictable 1–2s propagation.'),
          why: bi('Đảm bảo bài đăng mới hiện trên bảng tin bạn bè dưới 2 giây.', 'Keeps follower feed freshness consistently under 2 seconds.'),
        },
      ],
      links: [
        { id: 'c-cdn', from: 'client', to: 'cdn' },
        { id: 'cdn-lb', from: 'cdn', to: 'lb' },
        { id: 'lb-svc', from: 'lb', to: 'feedSvc' },
        { id: 'svc-tl', from: 'feedSvc', to: 'timelineCache', carries: 'r', label: bi('Hybrid Merge', 'Hybrid Merge') },
        { id: 'tl-store', from: 'timelineCache', to: 'postStore', carries: 'r' },
        { id: 'svc-store-w', from: 'feedSvc', to: 'postStore', carries: 'w' },
        { id: 'svc-fq', from: 'feedSvc', to: 'fanoutQueue', mode: 'async', carries: 'w', fraction: 0.8, label: bi('<50K Followers', '<50K Followers') },
        { id: 'fq-worker', from: 'fanoutQueue', to: 'fanoutWorker', mode: 'pull' },
      ],
      routes: {
        feedSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-hybrid', nodeIds: ['feedSvc', 'timelineCache', 'fanoutQueue'], label: bi('HYBRID FAN-OUT CORE', 'HYBRID FAN-OUT CORE'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v4 · Hybrid Push + Pull', 'v4 · Hybrid Push + Pull'),
        lines: [
          { text: bi('Push thường + Pull Celebrity trong RAM', 'Push regular + Pull celebrity in RAM'), tone: 'good' },
          { text: bi('Chịu tải > 95.000 req/s không nghẽn Queue', 'Sustains > 95K req/s with zero backlog'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 3. REAL-TIME CHAT (WhatsApp / Slack) — Linked Module: S7-01
 * ============================================================================ */
const CASE_REALTIME_CHAT: SdDesignCase = {
  id: 'realtime-chat',
  order: 3,
  linkedModuleId: 'S7-01',
  domainTag: bi('Stateful WebSocket · Session Registry · Sequence ID', 'Stateful WebSocket · Session Registry · Sequence ID'),
  difficulty: 'Advanced',
  title: bi('Hệ thống Chat thời gian thực (WhatsApp/Slack)', 'Real-Time Chat System (WhatsApp/Slack)'),
  subtitle: bi(
    'Duy trì hàng chục triệu kết nối WebSocket lâu dài, định tuyến tin nhắn xuyên Gateway và đồng bộ hộp thư theo thứ tự cho thiết bị ngoại tuyến.',
    'Persistent multi-million WebSocket gateways, cross-node session routing, ordered conversation logs, and offline device synchronization.'
  ),
  problemBrief: bi(
    'Thiết kế nền tảng nhắn tin thời gian thực hỗ trợ trò chuyện 1-1 và nhóm nhỏ, hiển thị trạng thái trực tuyến, biên nhận đã gửi/đã xem và đồng bộ đầy đủ khi người dùng mở lại mạng.',
    'Design a real-time messaging platform supporting 1:1 and small-group chat, online presence, delivery/read receipts, and reliable offline message sync.'
  ),
  clarifyingQuestions: [
    {
      id: 'chat-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Số lượng kết nối mở đồng thời trên toàn hệ thống và tốc độ gửi tin nhắn mỗi giây là bao nhiêu?',
        'How many concurrent open connections and messages per second must the platform handle?'
      ),
      answer: bi(
        '20 triệu kết nối WebSocket đồng thời; trung bình ~18.000 sự kiện/giây và giờ cao điểm vượt 50.000 sự kiện/giây (gồm tin nhắn mới, đồng bộ hộp thư và biên nhận ACK).',
        '20M concurrent WebSocket connections; ~18,000 events/s average and >50,000 events/s peak across messages, syncs, and receipts.'
      ),
      rationale: bi(
        '20 triệu socket dài hạn (~10 KB RAM/socket ≈ 200 GB RAM) bắt buộc tách tầng Stateful Chat Gateway khỏi tầng xử lý nghiệp vụ.',
        '20M long-lived sockets (~200 GB RAM) mandate a dedicated stateful WebSocket Gateway fleet decoupled from stateless logic.'
      ),
    },
    {
      id: 'chat-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Quy mô tối đa của một nhóm chat là bao nhiêu và một tài khoản có thể đăng nhập trên nhiều thiết bị cùng lúc không?',
        'What is the maximum group chat size and do users connect from multiple devices simultaneously?'
      ),
      answer: bi(
        'Nhóm tối đa 250 thành viên; mỗi người dùng có thể mở đồng thời trên tối đa 4 thiết bị (điện thoại, máy tính bảng, trình duyệt).',
        'Max 250 members per group; up to 4 concurrent devices per user account (phone, tablet, desktop web).'
      ),
      rationale: bi(
        'Nhóm ≤ 250 cho phép phát tán trực tiếp qua Session Registry sang từng thiết bị của thành viên thay vì phải dùng kiến trúc kênh phát sóng triệu người.',
        'Bounded 250-member groups allow per-recipient device fan-out via Session Registry rather than broadcast streaming.'
      ),
    },
    {
      id: 'chat-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Độ trễ chuyển tin khi người nhận đang trực tuyến và quy tắc đảm bảo thứ tự tin nhắn trong một cuộc hội thoại?',
        'What is the online delivery latency SLA and how must message ordering be guaranteed?'
      ),
      answer: bi(
        'Chuyển tin trực tuyến p99 < 100 ms; tin nhắn trong cùng một conversation_id phải có sequence_id tăng đơn điệu để mọi thiết bị hiển thị cùng một thứ tự.',
        'Online delivery p99 < 100 ms; messages within each conversation_id require monotonically increasing sequence IDs.'
      ),
      rationale: bi(
        'Định hướng dùng khóa phân vùng theo conversation_id trong Wide-Column Store và sinh sequence_id theo từng cuộc hội thoại thay vì dựa vào đồng hồ máy khách.',
        'Drives partitioning by conversation_id in a Wide-Column Store with per-conversation sequence generators instead of client clocks.'
      ),
    },
    {
      id: 'chat-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Xử lý ra sao khi người nhận mất sóng di động hoặc khi một máy chủ Gateway giữ 100.000 kết nối bị khởi động lại?',
        'What happens when a recipient is offline or when a Gateway server holding 100,000 sockets crashes?'
      ),
      answer: bi(
        'Ghi bền vững tin nhắn trước khi trả ACK cho người gửi; người nhận ngoại tuyến được gửi Push qua hàng đợi và kéo tin còn thiếu từ last_ack_seq khi online lại; kết nối lại có Jitter Backoff.',
        'Persist messages before sender ACK; route offline users to APNs/FCM push queues and delta-sync from last_ack_seq; enforce jittered reconnect backoff.'
      ),
      rationale: bi(
        'Ngăn mất tin nhắn và tránh 100.000 điện thoại đồng loạt mở kết nối lại trong cùng một giây gây nghẽn tầng đăng nhập (Reconnect Storm).',
        'Guarantees zero message loss after ACK and prevents 100K simultaneous TLS handshakes from causing a reconnect storm.'
      ),
    },
    {
      id: 'chat-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Nền khung trò chuyện nên hỗ trợ hình nền chuyển sắc CSS hay chỉ dùng ảnh tĩnh PNG?',
        'Should the chat background support CSS gradients or only static PNG wallpapers?'
      ),
      answer: bi(
        'Tùy chỉnh giao diện cục bộ trên thiết bị người dùng.',
        'Purely a client-side rendering preference.'
      ),
      rationale: bi(
        'Không liên quan đến bài toán giữ kết nối TCP, định tuyến bản tin hay đồng bộ ngoại tuyến.',
        'Irrelevant to stateful socket management, message routing, or persistence.'
      ),
    },
    {
      id: 'chat-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên tự viết lại trình điều khiển card mạng tầm thấp trước khi dùng epoll/WebSocket tiêu chuẩn không?',
        'Should we write a custom kernel bypass NIC driver before trying standard Linux epoll WebSockets?'
      ),
      answer: bi(
        'Không cần: một máy chủ Linux chuẩn với epoll xử lý tốt 100.000+ kết nối WebSocket.',
        'No: standard Linux epoll easily sustains 100,000+ concurrent sockets per gateway host.'
      ),
      rationale: bi(
        'Điểm nghẽn thực tế của hệ thống chat nằm ở định tuyến giữa nhiều Gateway, cập nhật trạng thái Presence và phân mảnh lưu trữ tin nhắn.',
        'Real chat bottlenecks are inter-gateway pub/sub routing, presence heartbeat churn, and storage partitioning—not NIC drivers.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('20M kết nối đồng thời', '20M concurrent sockets'),
    readRps: bi('18.000 TB / 35.000 đỉnh sync & ack/s', '18,000 avg / 35,000 peak sync & ack/s'),
    writeRps: bi('7.500 TB / 15.000 đỉnh tin mới/s', '7,500 avg / 15,000 peak sends/s'),
    readWriteRatio: bi('70 : 30 (Sync/Delivery : Send)', '70 : 30 (Sync/Delivery : Send)'),
    storagePerDay: bi('~2 TB tin nhắn mới/ngày (~100B/tin)', '~2 TB new messages/day (~100B/msg)'),
    memoryOrBandwidth: bi('~200 GB Socket RAM trên ~200 Gateway', '~200 GB Socket RAM across ~200 Gateways'),
    slos: [
      bi('Online Delivery p99 < 100 ms', 'Online Delivery p99 < 100 ms'),
      bi('Thứ tự nghiêm ngặt theo conversation_id', 'Strict per-conversation ordering'),
      bi('0 mất tin sau khi trả Sender ACK', 'Zero loss after Sender ACK'),
    ],
    snakeSummary: {
      scope: bi('Chat 1-1 & nhóm ≤ 250, multi-device sync, presence, offline push.', '1:1 & ≤250 group chat, multi-device sync, presence, offline push.'),
      numbers: bi('20M socket, 50K sự kiện/s đỉnh, ~2 TB/ngày lưu theo conversation_id.', '20M sockets, 50K peak events/s, ~2 TB/day partitioned by conversation_id.'),
      api: bi('WSS /v1/stream (send_msg, msg_ack, sync_since_seq, heartbeat).', 'WSS /v1/stream (send_msg, msg_ack, sync_since_seq, heartbeat).'),
      keyComponents: bi('WS Gateways, Session Registry (Redis), Chat Service, Wide-Column Store, Push Queue.', 'WS Gateways, Session Registry (Redis), Chat Service, Wide-Column Store, Push Queue.'),
      elaborate: bi('Heartbeat thưa 30s giảm tải Presence, Idempotent client_msg_id chống gửi lặp.', 'Coarse 30s presence heartbeats, idempotent client_msg_id deduplication.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'chat',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('HTTP Short-Polling + SQL đơn lẻ', 'HTTP Short-Polling + Single SQL'),
      eraTag: bi('100 req/s · MVP Polling', '100 req/s · Polling MVP'),
      targetRps: 100,
      readRatio: 0.7,
      seed: 7321,
      summary: bi(
        'Ứng dụng khách gọi HTTP GET mỗi 2 giây để hỏi "có tin nhắn mới không?"; hơn 90% truy vấn trả về rỗng nhưng vẫn mở giao dịch đọc trên SQL.',
        'Clients poll HTTP GET every 2 seconds asking for new messages; >90% of polls return empty yet still hit SQL.'
      ),
      whyNextStage: bi(
        'Khi chỉ vài nghìn người trực tuyến (500 req/s), luồng hỏi lặp liên tục làm nghẽn cứng SQL (μ = 280 req/s) và độ trễ nhận tin luôn trễ tới 2 giây.',
        'At 500 req/s (just 1,000 polling users), empty polling queries saturate SQL (μ = 280 req/s) while delivery lags up to 2 seconds.'
      ),
      whatChanged: [
        diff('+', '1 Chat HTTP API nhận gửi tin và trả danh sách tin mới', 'Single HTTP API handling message sends and poll queries'),
        diff('+', '1 SQL Database quét WHERE conversation_id AND id > last_id', 'Single SQL executing polling range queries every 2s'),
      ],
      tradeOffs: [
        trade(
          'Dùng HTTP Short-Polling không trạng thái',
          'Stateless HTTP Short-Polling',
          'Không cần quản lý kết nối dài hạn hay bảng định tuyến phiên',
          'Zero long-lived socket state on servers',
          'Lãng phí >90% băng thông và truy vấn DB cho các lần hỏi rỗng, độ trễ cao',
          'Wastes >90% of CPU and DB IOPS on empty responses with sluggish latency'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Chat Client', 'Chat Client'),
          what: bi('Ứng dụng nhắn tin gọi lặp HTTP mỗi 2 giây.', 'Chat apps polling over HTTP every 2 seconds.'),
          how: bi('Tạo lưu lượng nền liên tục ngay cả khi không ai gõ tin.', 'Generates constant baseline QPS even when idle.'),
          why: bi('Minh hoạ chi phí của Polling so với kết nối hai chiều.', 'Demonstrates polling overhead versus persistent sockets.'),
        },
        {
          id: 'chatSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 650,
          baseMs: 9,
          label: bi('HTTP Chat API', 'HTTP Chat API'),
          what: bi('Máy chủ HTTP nhận tin nhắn mới và phục vụ yêu cầu hỏi thăm.', 'Stateless HTTP server handling sends and polls.'),
          how: bi('Mỗi request mở lại chu trình xử lý và truy vấn SQL.', 'Queries SQL directly on every poll and send.'),
          why: bi('Dễ viết ban đầu nhưng không phù hợp thời gian thực.', 'Trivial to prototype but unsuitable for real-time scale.'),
        },
        {
          id: 'msgStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 280,
          baseMs: 8,
          label: bi('Messages SQL', 'Messages SQL'),
          what: bi('Bảng SQL đơn lẻ lưu toàn bộ tin nhắn hội thoại.', 'Single SQL table storing all chat messages.'),
          how: bi('Thực thi cả INSERT tin mới lẫn SELECT kiểm tra tin chưa đọc.', 'Handles both message INSERTs and repetitive poll SELECTs.'),
          why: bi('Nghẽn ngay khi số người mở app vượt quá vài trăm.', 'Saturates quickly once active users exceed a few hundred.'),
        },
      ],
      links: [
        { id: 'c-svc', from: 'client', to: 'chatSvc', label: bi('Poll 2s', 'Poll 2s') },
        { id: 'svc-db', from: 'chatSvc', to: 'msgStore' },
      ],
      noteCard: {
        title: bi('v1 · HTTP Short-Polling', 'v1 · HTTP Short-Polling'),
        lines: [
          { text: bi('90% truy vấn hỏi rỗng tốn I/O DB', '90% empty polls waste DB I/O'), tone: 'amber' },
          { text: bi('Trần chịu tải ≈ 280 req/s (nghẽn SQL)', 'Ceiling ≈ 280 req/s (SQL bound)'), tone: 'plain' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'chat',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Stateful WebSocket Gateway + Session Redis + SQL', 'WebSocket Gateways + Session Redis + SQL'),
      eraTag: bi('2.000 req/s · Đẩy hai chiều tức thời', '2,000 req/s · Persistent WebSockets'),
      targetRps: 2000,
      readRatio: 0.7,
      seed: 7322,
      summary: bi(
        'Thay Polling bằng kết nối WebSocket hai chiều trên cụm WS Gateway, dùng Redis lưu bảng ánh xạ user_id → gateway_node để đẩy tin tức thời.',
        'Replaces polling with persistent full-duplex WebSockets on WS Gateways, backed by Redis Session Registry mapping user_id → gateway.'
      ),
      whyNextStage: bi(
        'Khi tăng 5× lên 10.000 sự kiện/giây (~3.000 tin mới/giây), cơ sở dữ liệu SQL đơn lẻ lưu lịch sử tin nhắn bị bão hoà I/O ghi và đồng bộ.',
        'At 5x load (10,000 events/s with ~3,000 message writes/s), the single SQL database saturates on durable message writes and history syncs.'
      ),
      whatChanged: [
        diff('+', 'Đưa vào cụm Stateful WebSocket Gateway (×2) giữ kết nối TCP mở sẵn', 'Introduce Stateful WebSocket Gateways (×2) maintaining open sockets'),
        diff('+', 'Thêm Session & Presence Redis lưu vị trí Gateway của từng thiết bị', 'Add Session & Presence Redis tracking which Gateway holds each device'),
        diff('-', 'Loại bỏ hoàn toàn vòng lặp HTTP Short-Polling rỗng từ phía Client', 'Eliminate wasteful client HTTP short-polling loops'),
      ],
      tradeOffs: [
        trade(
          'Giữ kết nối Stateful WebSocket thay vì HTTP không trạng thái',
          'Stateful WebSocket connections instead of stateless HTTP',
          'Độ trễ chuyển tin giảm từ ~2.000 ms xuống dưới 40 ms và cắt bỏ truy vấn rỗng',
          'Drops delivery latency from ~2,000 ms to <40 ms and eliminates empty polls',
          'Cần L4/L7 Load Balancer hỗ trợ kết nối dài hạn và quản lý bảng định tuyến phiên',
          'Requires connection-aware load balancing and distributed session routing'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('WS Clients', 'WS Clients'),
          what: bi('Thiết bị duy trì đường hầm WebSocket hai chiều.', 'Devices maintaining persistent WebSocket streams.'),
          how: bi('Chỉ truyền khung tin thật sự khi có sự kiện gửi, nhận hoặc đồng bộ.', 'Sends frames only on actual messages, ACKs, and 30s heartbeats.'),
          why: bi('Tiết kiệm pin di động và giảm 10× lưu lượng thừa.', 'Saves mobile battery and cuts idle network chatter.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          params: { algorithm: 'least-conn' },
          label: bi('L4/L7 LB', 'L4/L7 LB'),
          what: bi('Bộ cân bằng tải chia kết nối theo Least-Connections.', 'Least-connections Load Balancer distributing WebSocket handshakes.'),
          how: bi('Tránh dồn quá nhiều socket mở vào một máy Gateway.', 'Balances active open sockets evenly across Gateways.'),
          why: bi('Giữ mức tiêu thụ RAM đồng đều giữa các node.', 'Prevents socket imbalance after rolling restarts.'),
        },
        {
          id: 'wsGw',
          kind: 'gateway',
          shape: 'block',
          tone: 'green',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 3,
          opsPerSec: 3800,
          baseMs: 3,
          label: bi('WS Gateway ×3', 'WS Gateway ×3'),
          what: bi('Máy chủ giữ kết nối socket trực tiếp với thiết bị người dùng.', 'Stateful edge gateways holding open client sockets.'),
          how: bi('Chuyển khung dữ liệu vào tầng lưu trữ/định tuyến phía sau.', 'Multiplexes client frames to Session Redis and SQL.'),
          why: bi('Tách biệt việc giữ kết nối mạng khỏi logic lưu trữ.', 'Isolates socket memory state from application storage.'),
        },
        {
          id: 'sessionReg',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.6,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.85 },
          label: bi('Session Redis', 'Session Redis'),
          what: bi('Kho tra cứu nhanh thiết bị người nhận đang gắn ở Gateway nào + Presence.', 'Redis registry mapping active user devices to their Gateway host.'),
          how: bi('Phục vụ tra cứu định tuyến và chuyển tiếp PubSub trong < 1 ms.', 'Resolves online routing and presence lookups in <1 ms.'),
          why: bi('Cho phép người gửi ở Gateway 1 đẩy tin sang người nhận ở Gateway 2.', 'Enables cross-gateway message delivery.'),
        },
        {
          id: 'msgStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 3.5,
          row: 0.6,
          replicas: 1,
          opsPerSec: 1350,
          baseMs: 6,
          label: bi('Messages SQL', 'Messages SQL'),
          what: bi('Cơ sở dữ liệu đơn lẻ lưu tin nhắn bền vững trước khi trả ACK.', 'Single SQL database persisting every chat message.'),
          how: bi('Xử lý toàn bộ 30% lệnh ghi tin mới và các lượt đồng bộ lịch sử.', 'Handles all 30% message writes plus history sync misses.'),
          why: bi('Trở thành cổ chai ở ~3.300 req/s khi lượng tin nhắn tăng.', 'Caps system throughput around ~3,300 req/s due to single-node disk writes.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb', label: bi('WSS', 'WSS') },
        { id: 'lb-gw', from: 'lb', to: 'wsGw' },
        { id: 'gw-reg', from: 'wsGw', to: 'sessionReg', carries: 'r', label: bi('Route + Presence', 'Route + Presence') },
        { id: 'reg-db', from: 'sessionReg', to: 'msgStore', carries: 'r', label: bi('Sync Miss', 'Sync Miss') },
        { id: 'gw-db-w', from: 'wsGw', to: 'msgStore', carries: 'w', label: bi('Persist Msg', 'Persist Msg') },
      ],
      routes: {
        wsGw: 'all-parallel',
      },
      noteCard: {
        title: bi('v2 · WebSocket + Session Redis', 'v2 · WebSocket + Session Redis'),
        lines: [
          { text: bi('Đẩy tin tức thời qua kết nối hai chiều', 'Instant push over full-duplex sockets'), tone: 'good' },
          { text: bi('SQL đơn lẻ nghẽn ghi khi vọt lên 10K req/s', 'Single SQL saturates on writes at 10K req/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'chat',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Tách Chat Service + Wide-Column phân mảnh theo Hội thoại', 'Stateless Chat Service + Sharded Wide-Column Store'),
      eraTag: bi('15.000 req/s · Phân mảnh theo conversation_id', '15,000 req/s · Partitioned Message Log'),
      targetRps: 15000,
      readRatio: 0.7,
      seed: 7323,
      summary: bi(
        'Tách tầng xử lý nghiệp vụ Chat Service ra khỏi WS Gateway và chuyển lưu trữ tin nhắn sang kho Wide-Column (kiểu Cassandra/Scylla) phân mảnh theo conversation_id xếp liền kề theo sequence_id.',
        'Separates stateless Chat Service from WS Gateways and moves messages into a LSM Wide-Column store partitioned by (conversation_id, sequence_id).'
      ),
      whyNextStage: bi(
        'Ở mức 5× (75.000 req/s), việc gửi thông báo đẩy cho người nhận ngoại tuyến ngay trên luồng chính cùng với giới hạn 3 phân vùng làm nghẽn Chat Service và Message Store.',
        'At 5x load (75,000 req/s), synchronous offline push handling and 3-shard storage limits saturate Chat Service and Message Store.'
      ),
      whatChanged: [
        diff('+', 'Tách riêng cụm Stateless Chat Service (×10) điều phối thứ tự sequence_id', 'Extract stateless Chat Service (×10) managing sequence ordering and dedup'),
        diff('~', 'Chuyển từ SQL đơn sang Sharded Wide-Column LSM Store (3 phân vùng ghi tuần tự)', 'Replace single SQL with 3-shard LSM Wide-Column Store keyed by conversation_id'),
        diff('~', 'Mở rộng cụm WS Gateway lên 8 node giữ hàng triệu kết nối', 'Scale WS Gateway fleet to 8 nodes'),
      ],
      tradeOffs: [
        trade(
          'Phân mảnh Wide-Column theo (conversation_id, sequence_id)',
          'Partition Wide-Column store by (conversation_id, sequence_id)',
          'Ghi tuần tự LSM cực nhanh và đọc 50 tin gần nhất của 1 hội thoại chỉ chạm đúng 1 phân vùng',
          'Fast sequential LSM writes and single-partition range scans for recent chat history',
          'Không hỗ trợ tìm kiếm toàn văn xuyên hội thoại trực tiếp trên bảng chính (cần chỉ mục riêng)',
          'Cannot run full-text search across conversations directly on the primary table'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Multi-Device', 'Multi-Device'),
          what: bi('15.000 sự kiện chat mỗi giây từ điện thoại và máy tính.', '15,000 chat events/s across mobile and desktop clients.'),
          how: bi('Gửi kèm client_msg_id để chống tạo tin trùng khi mạng chập chờn.', 'Attaches client_msg_id for idempotent retries.'),
          why: bi('Đảm bảo đồng bộ nhất quán giữa 4 thiết bị của cùng một người.', 'Keeps up to 4 devices per user strictly synchronized.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          params: { algorithm: 'least-conn' },
          label: bi('LB Least-Conn', 'LB Least-Conn'),
          what: bi('Cặp cân bằng tải L4 phân bổ kết nối WebSocket.', 'Active-active L4 Load Balancer pair.'),
          how: bi('Định tuyến tới Gateway còn nhiều chỗ trống kết nối nhất.', 'Routes new connections to the least-loaded Gateway.'),
          why: bi('Chịu tải tới 90.000 sự kiện/giây.', 'Sustains 90,000 events/s.'),
        },
        {
          id: 'wsGw',
          kind: 'gateway',
          shape: 'block',
          tone: 'green',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 8,
          opsPerSec: 9800,
          baseMs: 2.5,
          label: bi('WS Gateway ×8', 'WS Gateway ×8'),
          what: bi('Cụm 8 Gateway thuần giữ socket và chuyển đổi khung nhị phân.', '8 lightweight socket gateways handling framing and TLS.'),
          how: bi('Chuyển toàn bộ nghiệp vụ lưu/định tuyến sang Chat Service qua RPC.', 'Forwards business logic to stateless Chat Service via internal RPC.'),
          why: bi('Cho phép triển khai bản mới ở Chat Service mà không làm rớt socket người dùng.', 'Lets engineers deploy Chat Service updates without dropping user sockets!'),
        },
        {
          id: 'chatSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 12,
          opsPerSec: 2000,
          baseMs: 6,
          label: bi('Chat Svc ×12', 'Chat Svc ×12'),
          what: bi('Tầng nghiệp vụ cấp sequence_id, lưu tin và tìm Gateway đích.', 'Stateless chat engine assigning sequence IDs and orchestrating delivery.'),
          how: bi('Tra cứu Session Registry và ghi xuống phân vùng hội thoại tương ứng.', 'Queries Session Registry and writes to the conversation shard.'),
          why: bi('Dễ dàng nhân bản ngang trong vài giây khi tải tăng.', 'Scales horizontally without stateful socket draining.'),
        },
        {
          id: 'sessionReg',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4,
          row: -0.65,
          replicas: 2,
          opsPerSec: 32000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.9 },
          label: bi('Session + PubSub', 'Session + PubSub'),
          what: bi('Cụm Redis lưu bảng phiên thiết bị, hộp thư nóng và kênh PubSub liên Gateway.', 'Redis cluster holding device routing tables, recent inbox cache, and PubSub.'),
          how: bi('Giải quyết ~90% lượt đọc trạng thái và đồng bộ ngắn ngay trong RAM.', 'Serves ~90% of routing and recent delta-sync lookups in RAM.'),
          why: bi('Giữ độ trễ chuyển tin trực tuyến ổn định dưới 40 ms.', 'Keeps online message delivery latency well below 40 ms.'),
        },
        {
          id: 'msgStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 4.5,
          row: 0.65,
          replicas: 3,
          opsPerSec: 3400,
          baseMs: 3,
          params: { shards: 3 },
          label: bi('Wide-Column ×3', 'Wide-Column ×3'),
          what: bi('Kho LSM-tree 3 phân vùng lưu chuỗi tin nhắn sắp sẵn theo sequence_id.', '3-shard LSM Wide-Column store clustering messages by sequence_id.'),
          how: bi('Hấp thụ 4.500 tin mới/giây + các lượt đồng bộ lịch sử sâu.', 'Handles 4,500 message writes/s plus deep history reads.'),
          why: bi('Tối ưu hóa cho ghi nhỏ tần suất cao của ứng dụng chat.', 'Purpose-built for write-intensive append-only chat workloads.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'wsGw' },
        { id: 'gw-svc', from: 'wsGw', to: 'chatSvc', label: bi('gRPC', 'gRPC') },
        { id: 'svc-reg', from: 'chatSvc', to: 'sessionReg', carries: 'r' },
        { id: 'reg-store', from: 'sessionReg', to: 'msgStore', carries: 'r' },
        { id: 'svc-store-w', from: 'chatSvc', to: 'msgStore', carries: 'w', label: bi('Append Seq', 'Append Seq') },
      ],
      routes: {
        chatSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-chat', nodeIds: ['wsGw', 'chatSvc'], label: bi('TÁCH GATEWAY & LOGIC', 'DECOUPLED GW & LOGIC'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v3 · Tách WS Gateway + LSM', 'v3 · Split Gateway + LSM'),
        lines: [
          { text: bi('Deploy Chat Svc không rớt kết nối WS', 'Zero-drop Chat Svc deployments'), tone: 'good' },
          { text: bi('Trần chịu tải ≈ 24.000 req/s', 'Ceiling ≈ 24,000 req/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'chat',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Multi-AZ WS Fleet + Offline Push Queue + Presence Throttling', 'Multi-AZ WS Fleet + Offline Push Queue + 10-Shard Store'),
      eraTag: bi('50.000+ req/s · 20M Socket Production', '50,000+ req/s · 20M-Socket Production'),
      targetRps: 50000,
      readRatio: 0.7,
      seed: 7324,
      summary: bi(
        'Mở rộng cụm Multi-AZ cho 20 triệu kết nối, tách hẳn luồng gửi thông báo APNs/FCM cho thiết bị ngoại tuyến sang Offline Push Queue và nâng kho lưu trữ lên 10 phân vùng kèm Rate Limiter.',
        'Scales across AZs for 20M sockets, isolates APNs/FCM delivery into an async Offline Push Queue, adds per-user Rate Limiting, and expands message storage to 10 shards.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 chịu vững >90.000 sự kiện/giây. Bước kế tiếp cho người dùng xuyên lục địa là đặt Edge WS Proxy theo khu vực nối đường trục riêng về cụm hội thoại.',
        'Sustains >90,000 events/s reliably. Global expansion adds regional Edge WS Proxies terminating TLS locally over private backbone links.'
      ),
      whatChanged: [
        diff('+', 'Thêm Offline Push Queue + Push Workers xử lý riêng APNs/FCM cho người nhận ngoại tuyến', 'Add Offline Push Queue + Workers decoupling external APNs/FCM latency'),
        diff('+', 'Bổ sung Edge Rate Limiter chống spam tin nhắn và giới hạn tốc độ kết nối lại', 'Add Rate Limiter guarding against spam and reconnect storms'),
        diff('~', 'Mở rộng lên 22 WS Gateways, 32 Chat Services và 10 phân vùng Wide-Column Multi-AZ', 'Scale to 22 WS Gateways, 32 Chat Services, and 10 Multi-AZ Wide-Column shards'),
      ],
      tradeOffs: [
        trade(
          'Cập nhật Presence lười (chỉ phát cho nhóm nhỏ đang mở màn hình hội thoại)',
          'Lazy Presence subscriptions (push status only to active viewport peers)',
          'Cắt >85% bão bản tin nhịp tim khi người dùng có danh bạ hàng nghìn liên hệ',
          'Eliminates >85% of presence fan-out traffic across large contact lists',
          'Trạng thái "Online / Vừa truy cập" có thể cập nhật chậm vài giây khi mới mở màn hình',
          'Online indicator may take 1–2s to subscribe when opening a conversation'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('20M Sockets', '20M Sockets'),
          what: bi('20 triệu thiết bị kết nối đồng thời tạo 50.000 sự kiện/giây.', '20M connected devices generating 50,000 events/s.'),
          how: bi('Tự động dùng Exponential Backoff + Jitter nếu mạng chuyển vùng.', 'Uses jittered exponential backoff on network handoffs.'),
          why: bi('Ngăn đồng loạt hàng trăm nghìn máy kết nối dồn vào cùng 1 mili-giây.', 'Prevents synchronized reconnect storms after cell-tower blips.'),
        },
        {
          id: 'limiter',
          kind: 'rate-limiter',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 90000,
          baseMs: 0.3,
          params: { ratePerSec: 95000, burst: 20000 },
          label: bi('Conn & Msg Guard', 'Conn & Msg Guard'),
          what: bi('Kiểm soát tốc độ mở kết nối mới và hạn ngạch tin gửi mỗi tài khoản.', 'Token-bucket admission control for handshakes and message spam.'),
          how: bi('Cho phép tới 95.000 sự kiện/giây hợp lệ, cắt gọn đột biến vượt ngưỡng.', 'Admits up to 95K events/s while shedding abusive floods.'),
          why: bi('Bảo vệ cụm Stateful Gateway khi một AZ vừa khôi phục.', 'Protects Stateful Gateways during post-outage reconnect waves.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 5,
          opsPerSec: 20000,
          baseMs: 0.3,
          params: { algorithm: 'least-conn' },
          label: bi('Multi-AZ LB ×5', 'Multi-AZ LB ×5'),
          what: bi('5 bộ cân bằng tải L4 phân vùng theo AZ.', '5-node Multi-AZ L4 Load Balancer cluster.'),
          how: bi('Duy trì bảng kết nối TCP tới 22 cụm Gateway.', 'Routes up to 100,000 events/s across 22 Gateway pools.'),
          why: bi('Đảm bảo không điểm lỗi đơn ở tầng biên.', 'Eliminates ingress SPOFs.'),
        },
        {
          id: 'wsGw',
          kind: 'gateway',
          shape: 'block',
          tone: 'green',
          icon: 'globe',
          col: 3,
          row: 0,
          replicas: 22,
          opsPerSec: 4500,
          baseMs: 2.5,
          label: bi('WS Gateway ×22', 'WS Gateway ×22'),
          what: bi('Đội máy chủ giữ socket phân tán trên 3 Availability Zone.', 'Multi-AZ stateful WebSocket gateway fleet.'),
          how: bi('Nhận lệnh đẩy từ PubSub để chuyển tin ngay tới thiết bị đang online.', 'Pushes frames down open sockets within milliseconds.'),
          why: bi('Nếu 1 AZ gặp sự cố, chỉ 1/3 kết nối chuyển vùng nhẹ nhàng.', 'Limits blast radius of an AZ failure to one-third of sockets.'),
        },
        {
          id: 'chatSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 4,
          row: 0,
          replicas: 32,
          opsPerSec: 2800,
          baseMs: 5,
          label: bi('Chat Svc ×32', 'Chat Svc ×32'),
          what: bi('Cụm xử lý định tuyến hội thoại, nhóm ≤ 250 và chống trùng lặp.', '32 stateless chat orchestrators handling ordering and multi-device fan-out.'),
          how: bi('Ghi tin nhắn bền vững rồi đẩy song song qua PubSub (online) hoặc Push Queue (offline).', 'Persists first, then routes via PubSub for online peers or Push Queue for offline devices.'),
          why: bi('Đạt ~90.000 sự kiện/giây với p99 thấp.', 'Delivers ~90,000 events/s capacity with predictable tail latency.'),
        },
        {
          id: 'sessionReg',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 5,
          row: -0.7,
          replicas: 4,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.93 },
          label: bi('Session Cluster', 'Session Cluster'),
          what: bi('Cụm Redis phân mảnh lưu định tuyến thiết bị và các tin nhắn vừa gửi.', 'Sharded Redis cluster for session routing, presence, and hot sync cache.'),
          how: bi('Đáp ứng 93% truy vấn đọc/định tuyến trong 0,5 ms.', 'Handles 93% of routing and short-sync reads in 0.5 ms.'),
          why: bi('Giữ tải đọc khỏi chạm xuống đĩa cho người dùng chuyển mạng ngắn.', 'Absorbs brief mobile reconnect syncs completely in RAM.'),
        },
        {
          id: 'msgStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 6,
          row: -0.2,
          replicas: 10,
          opsPerSec: 4500,
          baseMs: 3,
          params: { shards: 10 },
          label: bi('Wide-Column ×10', 'Wide-Column ×10'),
          what: bi('Cụm 10 phân vùng lưu trữ bền vững tin nhắn với hệ số nhân bản RF=3.', '10-shard Wide-Column cluster with Quorum durability across AZs.'),
          how: bi('Xử lý thoải mái 15.000 tin mới/giây ở mức tải 50.000 req/s.', 'Sustains 15,000+ durable writes/s with ample headroom.'),
          why: bi('Đảm bảo không bao giờ mất tin nhắn sau khi đã báo gửi thành công.', 'Guarantees zero data loss after sender ACK.'),
        },
        {
          id: 'pushQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 5,
          row: 0.7,
          replicas: 2,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 300000 },
          label: bi('Offline Push Q', 'Offline Push Q'),
          what: bi('Hàng đợi thông báo đẩy dành cho người nhận hiện không mở socket.', 'Async queue dispatching wake-up notifications to offline devices.'),
          how: bi('Tách biệt độ trễ gọi sang cổng Apple APNs và Google FCM.', 'Isolates external APNs/FCM network latency from Chat Service.'),
          why: bi('Cổng thông báo bên ngoài chậm không làm ảnh hưởng người đang chat online.', 'External push slowdowns never stall live conversations.'),
        },
        {
          id: 'pushWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 6,
          row: 0.7,
          replicas: 16,
          opsPerSec: 900,
          baseMs: 18,
          label: bi('APNs/FCM ×16', 'APNs/FCM ×16'),
          what: bi('Cụm Worker duy trì kết nối HTTP/2 dài hạn tới APNs và FCM.', '16 workers streaming push notifications over pooled HTTP/2.'),
          how: bi('Xử lý gộp thông báo khi một nhóm chat hoạt động sôi nổi.', 'Coalesces rapid group-chat bursts for offline members.'),
          why: bi('Tránh làm tràn thông báo trên màn hình khoá người dùng.', 'Prevents notification floods and respects vendor quotas.'),
        },
      ],
      links: [
        { id: 'c-lim', from: 'client', to: 'limiter' },
        { id: 'lim-lb', from: 'limiter', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'wsGw' },
        { id: 'gw-svc', from: 'wsGw', to: 'chatSvc' },
        { id: 'svc-reg', from: 'chatSvc', to: 'sessionReg', carries: 'r' },
        { id: 'reg-store', from: 'sessionReg', to: 'msgStore', carries: 'r' },
        { id: 'svc-store-w', from: 'chatSvc', to: 'msgStore', carries: 'w' },
        { id: 'svc-pushq', from: 'chatSvc', to: 'pushQueue', mode: 'async', carries: 'w', fraction: 0.45, label: bi('Offline Peers', 'Offline Peers') },
        { id: 'pushq-w', from: 'pushQueue', to: 'pushWorker', mode: 'pull' },
      ],
      routes: {
        chatSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-push', nodeIds: ['pushQueue', 'pushWorker'], label: bi('OFFLINE PUSH PIPELINE', 'OFFLINE PUSH PIPELINE'), tone: 'rose' },
      ],
      noteCard: {
        title: bi('v4 · 20M Sockets Multi-AZ', 'v4 · 20M Sockets Multi-AZ'),
        lines: [
          { text: bi('Online p99 < 35 ms · Offline qua Queue', 'Online p99 < 35 ms · Async Offline Push'), tone: 'good' },
          { text: bi('Chịu tải > 90.000 sự kiện/s bền vững', 'Sustains > 90K events/s cleanly'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 4. DISTRIBUTED EDGE RATE LIMITER — Linked Module: S7-02
 * ============================================================================ */
const CASE_RATE_LIMITER: SdDesignCase = {
  id: 'rate-limiter',
  order: 4,
  linkedModuleId: 'S7-02',
  domainTag: bi('Token Bucket · Atomic Lua · Local Batch Sync', 'Token Bucket · Atomic Lua · Local Batch Sync'),
  difficulty: 'Intermediate',
  title: bi('Distributed Rate Limiter ở tầng biên', 'Distributed Edge Rate Limiter'),
  subtitle: bi(
    'Kiểm soát hạn ngạch chính xác theo Tenant/IP trên hàng chục API Gateway với chi phí độ trễ dưới vài mili-giây và cơ chế Fail-open an toàn.',
    'Multi-gateway tenant and IP quota enforcement adding sub-3ms overhead with atomic token buckets and resilient local fallback.'
  ),
  problemBrief: bi(
    'Thiết kế bộ giới hạn lưu lượng phân tán tích hợp tại tầng API Gateway để chặn các luồng gọi vượt hạn ngạch (HTTP 429), bảo vệ cụm dịch vụ phía sau mà không biến chính bộ đếm thành điểm nghẽn.',
    'Design a distributed rate limiter embedded at the API Gateway tier to enforce per-tenant/IP quotas (HTTP 429) and shield backend services without becoming a bottleneck itself.'
  ),
  clarifyingQuestions: [
    {
      id: 'rl-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Tổng lưu lượng đi qua cụm API Gateway mỗi giây và số lượng khoá định danh (userId / API key / IP) hoạt động đồng thời?',
        'What is the total request rate across all API Gateways and the number of active rate-limit keys per window?'
      ),
      answer: bi(
        '15.000 req/s trung bình, >50.000 req/s giờ cao điểm trải trên 16–20 máy Gateway; khoảng 5 triệu khoá hoạt động mỗi phút (~32 byte/khoá ≈ 160 MB RAM).',
        '15,000 req/s avg and >50,000 req/s peak across 16–20 Gateways; ~5M active keys per minute (~32B/bucket ≈ 160 MB RAM).'
      ),
      rationale: bi(
        'Dung lượng 160 MB nằm gọn trong bộ nhớ RAM, cho thấy giới hạn thật nằm ở thông lượng gói tin mạng (PPS/RPS) tới kho đếm chứ không phải dung lượng lưu trữ.',
        '160 MB fits trivially in RAM—proving the real challenge is network packet rate (QPS) and hot-key contention, not storage volume.'
      ),
    },
    {
      id: 'rl-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Hệ thống cần cho phép lưu lượng dồn ngắn hạn (Burst) hay ép tốc độ đều đặn, và quy tắc hạn ngạch thay đổi thường xuyên không?',
        'Should the limiter allow short legitimate bursts, and how frequently do quota rules change?'
      ),
      answer: bi(
        'Cho phép Burst ngắn hợp lệ (thuật toán Token Bucket + Sliding Window Counter); quy tắc hạn ngạch đọc trên 100% request nhưng chỉ cập nhật cấu hình vài lần mỗi ngày.',
        'Allow controlled bursts via Token Bucket / Sliding Window; quota rules are evaluated on 100% of requests but modified rarely.'
      ),
      rationale: bi(
        'Cho phép đệm bộ quy tắc cấu hình ngay trong bộ nhớ cục bộ của từng Gateway (TTL 30–60s) để không bao giờ phải đọc DB cấu hình trên đường nóng.',
        'Lets every Gateway cache rule configurations in local RAM so hot-path checks never query the rule database.'
      ),
    },
    {
      id: 'rl-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Ngân sách độ trễ tối đa cho phép cộng thêm vào mỗi API request và có chấp nhận sai số đếm nhỏ (±3%) giữa các Gateway không?',
        'What is the maximum latency overhead allowed per request, and is a small ±3% distributed count tolerance acceptable?'
      ),
      answer: bi(
        'Độ trễ kiểm tra p99 ≤ 3 ms; với API thông thường chấp nhận lệch mềm ±3–5% để đổi lấy hiệu năng cực cao thông qua gom lô đồng bộ ngắn (100 ms).',
        'Overhead p99 ≤ 3 ms; ±3–5% eventual quota tolerance is acceptable, unlocking ultra-fast local token batching.'
      ),
      rationale: bi(
        'Mở đường cho tối ưu quan trọng ở v4: cấp phát lô token cục bộ trên Gateway và đồng bộ nền với Redis mỗi 100 ms, giảm >90% lệnh gọi mạng.',
        'Enables v4 local token-lease batching synced every 100 ms to Redis, slashing cross-network Redis calls by >90%.'
      ),
    },
    {
      id: 'rl-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Làm sao tránh điều kiện tranh chấp (Race Condition) khi 2 Gateway cùng đọc-cộng-ghi bộ đếm, và hành xử ra sao nếu cụm Redis gặp sự cố?',
        'How do we prevent read-modify-write race conditions across Gateways, and should we fail-open or fail-closed if Redis goes down?'
      ),
      answer: bi(
        'Chạy Lua Script nguyên tử (Atomic EVALSHA) trên Redis thay vì GET rồi INCR rời rạc; nếu cụm Redis mất kết nối thì tự động chuyển sang bộ đếm Token Bucket dự phòng trong RAM của từng Gateway (Fail-open có kiểm soát).',
        'Use atomic Redis Lua scripts instead of separate GET+SET calls; on Redis outage, degrade gracefully to per-Gateway in-memory Token Buckets.'
      ),
      rationale: bi(
        'Đảm bảo vừa đếm đúng dưới tải đồng thời cao vừa không tự gây ngắt toàn bộ dịch vụ khi cụm lưu trữ bộ đếm bảo trì.',
        'Prevents lost updates under concurrency while ensuring a limiter outage never takes down the entire API platform.'
      ),
    },
    {
      id: 'rl-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Trang quản trị cấu hình hạn ngạch nên dùng bảng màu sáng hay tối làm mặc định cho nhân viên vận hành?',
        'Should the internal admin portal for editing rate-limit rules default to light mode or dark mode?'
      ),
      answer: bi(
        'Không tác động tới đường kiểm tra lưu lượng thời gian thực.',
        'Has zero effect on edge request admission.'
      ),
      rationale: bi(
        'Bảng điều khiển nội bộ chỉ ghi cấu hình hiếm hoi, không nằm trên đường đi 50.000 req/s.',
        'Admin UI styling is off the 50,000 req/s hot path.'
      ),
    },
    {
      id: 'rl-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Nội dung JSON trả kèm mã lỗi HTTP 429 nên dùng dấu gạch dưới snake_case hay camelCase?',
        'Should the HTTP 429 JSON error body use snake_case or camelCase field names?'
      ),
      answer: bi(
        'Theo quy ước chung của API; điều quan trọng là trả chuẩn các HTTP Header X-RateLimit-Remaining và Retry-After.',
        'Follow existing API conventions; standard Retry-After and X-RateLimit-* headers are what clients rely on.'
      ),
      rationale: bi(
        'Cần ưu tiên giải quyết bài toán tranh chấp bộ đếm nguyên tử và độ trễ dưới 3 ms trước.',
        'Focus on atomic distributed state and sub-3ms latency budgets first.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('5M khoá định danh hoạt động/phút', '5M active bucket keys/min'),
    readRps: bi('15.000 TB / 55.000 đỉnh kiểm tra/s', '15,000 avg / 55,000 peak checks/s'),
    writeRps: bi('Cập nhật token nguyên tử mỗi request / lô 100ms', 'Atomic token update per req or 100ms batch'),
    readWriteRatio: bi('90 : 10 (Rule Hit & Local Lease : Sync)', '90 : 10 (Local Lease Hit : Redis Sync)'),
    storagePerDay: bi('~160 MB RAM cho bộ đếm · ~20 GB log 429/ngày', '~160 MB counter RAM · ~20 GB 429 logs/day'),
    memoryOrBandwidth: bi('Overhead p99 ≤ 3 ms tại tầng Gateway', 'Gateway check overhead p99 ≤ 3 ms'),
    slos: [
      bi('Check Overhead p99 ≤ 3 ms', 'Check Overhead p99 ≤ 3 ms'),
      bi('Atomic Lua (không Race Condition)', 'Atomic Lua (zero race conditions)'),
      bi('Local Fallback khi Redis lỗi', 'Local in-RAM fallback on Redis fault'),
    ],
    snakeSummary: {
      scope: bi('Giới hạn theo tenant/IP/endpoint bằng Token Bucket, trả HTTP 429 + Retry-After.', 'Per-tenant/IP/endpoint Token Bucket limiting with HTTP 429 + Retry-After.'),
      numbers: bi('55K req/s đỉnh, 5M bucket × 32B ≈ 160 MB RAM, p99 cộng thêm ≤ 3 ms.', '55K peak req/s, 5M buckets × 32B ≈ 160 MB RAM, ≤3 ms added p99.'),
      api: bi('Middleware checkLimit(key, cost) → {allowed, remaining, resetAfterMs}.', 'Middleware checkLimit(key, cost) → {allowed, remaining, resetAfterMs}.'),
      keyComponents: bi('Edge Gateways, Local Rule/Lease Cache, Sharded Redis Lua Cluster, Async 429 Telemetry.', 'Edge Gateways, Local Rule/Lease Cache, Sharded Redis Lua Cluster, Async 429 Telemetry.'),
      elaborate: bi('Consistent Hashing chia tải Redis, Local Batch Lease cho hot key, Fail-open về Local Bucket.', 'Consistent-hashed Redis shards, local token leases for hot keys, local fallback on outage.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'rl',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Gateway đơn + Đếm trong bảng SQL', 'Single Gateway + SQL Row Counter'),
      eraTag: bi('100 req/s · Khoá dòng SQL', '100 req/s · SQL Row Locking'),
      targetRps: 100,
      readRatio: 0.9,
      seed: 7331,
      summary: bi(
        'Mỗi API request đi vào đều chạy giao dịch UPDATE rate_limits SET count = count + 1 trên cơ sở dữ liệu SQL trước khi chuyển vào dịch vụ nghiệp vụ.',
        'Every incoming API call executes a synchronous SQL row UPDATE on a rate_limits table before forwarding to the backend API.'
      ),
      whyNextStage: bi(
        'Khi tăng 5× lên 500 req/s, thao tác khoá dòng và ghi đĩa trên bảng đếm SQL (μ = 300 req/s) làm nghẽn toàn bộ API dù dịch vụ nghiệp vụ phía sau vẫn rảnh.',
        'At 5x load (500 req/s), row-level locking on the SQL counter table (μ = 300 req/s) chokes every API request while backend services sit idle.'
      ),
      whatChanged: [
        diff('+', '1 API Gateway kiểm tra hạn ngạch đồng bộ trước khi gọi Backend', 'Single API Gateway checking quotas synchronously'),
        diff('+', '1 SQL Database lưu cả quy tắc lẫn số đếm cửa sổ hiện tại', 'Single SQL storing both quota rules and live window counters'),
      ],
      tradeOffs: [
        trade(
          'Lưu bộ đếm trực tiếp trong cơ sở dữ liệu SQL sẵn có',
          'Store live request counters in existing SQL database',
          'Không cần vận hành thêm thành phần hạ tầng mới ở giai đoạn nhỏ',
          'Zero extra infrastructure components to operate initially',
          'Độ trễ kiểm tra 6–15 ms mỗi request và tranh chấp khoá dòng gay gắt khi cùng 1 khách hàng gọi nhanh',
          'Adds 6–15 ms per request and suffers severe row-lock contention under bursty clients'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('API Clients', 'API Clients'),
          what: bi('Khách hàng và đối tác gọi API kèm khóa định danh.', 'External clients and SDKs calling public APIs.'),
          how: bi('Mỗi request đều cần kiểm tra hạn ngạch trước khi xử lý.', 'Every request requires quota validation at the edge.'),
          why: bi('Cần ngăn một khách hàng lỗi vòng lặp chiếm hết tài nguyên chung.', 'Prevents a single runaway script from starving other tenants.'),
        },
        {
          id: 'gw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 1200,
          baseMs: 3,
          label: bi('API Gateway', 'API Gateway'),
          what: bi('Cổng vào xác thực và kiểm tra giới hạn tốc độ.', 'Entry gateway performing auth and rate checks.'),
          how: bi('Chờ SQL cập nhật bộ đếm xong mới gọi sang Core API.', 'Waits on SQL counter transaction before calling Core API.'),
          why: bi('Cộng dồn trực tiếp độ trễ của SQL vào mọi API.', 'Couples every API call to SQL write latency.'),
        },
        {
          id: 'counterStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: -0.55,
          replicas: 1,
          opsPerSec: 300,
          baseMs: 7,
          label: bi('Counter SQL', 'Counter SQL'),
          what: bi('Bảng SQL lưu bộ đếm theo từng phút cho mỗi API key.', 'Relational table tracking per-minute counters.'),
          how: bi('Chạy SELECT FOR UPDATE / UPDATE trên đĩa mỗi lượt gọi.', 'Acquires row locks and writes WAL on every check.'),
          why: bi('Nghẽn cứng ngay ở ~300 req/s.', 'Bottlenecks the entire platform at ~300 req/s.'),
        },
        {
          id: 'api',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0.55,
          replicas: 1,
          opsPerSec: 900,
          baseMs: 10,
          label: bi('Core API', 'Core API'),
          what: bi('Dịch vụ nghiệp vụ phía sau cần được bảo vệ.', 'Protected downstream business API.'),
          how: bi('Chỉ xử lý các request đã vượt qua bước kiểm tra hạn ngạch.', 'Executes business logic for admitted requests.'),
          why: bi('Còn dư năng lực nhưng vẫn bị kéo chậm bởi Counter SQL.', 'Has spare capacity yet gets starved by slow SQL rate checks.'),
        },
      ],
      links: [
        { id: 'c-gw', from: 'client', to: 'gw' },
        { id: 'gw-sql', from: 'gw', to: 'counterStore', label: bi('SQL Lock', 'SQL Lock') },
        { id: 'gw-api', from: 'gw', to: 'api' },
      ],
      routes: {
        gw: 'all-sequential',
      },
      noteCard: {
        title: bi('v1 · Bộ đếm trong SQL', 'v1 · SQL Row Counters'),
        lines: [
          { text: bi('Mỗi request khoá dòng trên đĩa SQL', 'Every request locks a SQL row'), tone: 'amber' },
          { text: bi('Bộ đếm tự biến thành điểm nghẽn ở 300 req/s', 'Limiter itself bottlenecks at 300 req/s'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'rl',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Nhiều Gateway + 1 Redis Atomic Lua Script', 'Multi-Gateway + Single Redis Lua Token Bucket'),
      eraTag: bi('2.000 req/s · Đếm nguyên tử trong RAM', '2,000 req/s · In-Memory Atomic Lua'),
      targetRps: 2000,
      readRatio: 0.9,
      seed: 7332,
      summary: bi(
        'Đưa bộ đếm Token Bucket lên một máy Redis trong RAM chạy Lua Script nguyên tử (tính nạp token + trừ 1 trong một bước duy nhất), chia sẻ chung cho nhiều API Gateway.',
        'Moves Token Bucket state into a single in-memory Redis node executing an atomic Lua script shared across multiple API Gateways.'
      ),
      whyNextStage: bi(
        'Ở mức 5× (10.000 req/s), một node Redis duy nhất vừa là điểm lỗi đơn (SPOF) vừa bị nghẽn đơn luồng cùng với cụm 2 Gateway.',
        'At 5x load (10,000 req/s), a single centralized Redis instance is a SPOF and hits throughput limits alongside the 2-node Gateway tier.'
      ),
      whatChanged: [
        diff('~', 'Thay bảng đếm SQL bằng Redis lưu cặp (tokens, last_refill_ms) có TTL tự xoá', 'Replace SQL counters with in-memory Redis (tokens, last_refill_ms) + auto-TTL'),
        diff('+', 'Dùng Lua Script nguyên tử ngăn Race Condition giữa 2 Gateway', 'Run atomic EVALSHA Lua script preventing read-modify-write races'),
        diff('+', 'Thêm Load Balancer và mở rộng Core API (×3)', 'Add Load Balancer and scale Core API (×3)'),
      ],
      tradeOffs: [
        trade(
          'Bộ đếm tập trung trên 1 máy Redis dùng chung cho mọi Gateway',
          'Centralized single-node Redis counter across all Gateways',
          'Chính xác tuyệt đối 100% giữa các Gateway và độ trễ giảm xuống ~0,8 ms',
          '100% exact cross-gateway accuracy with sub-millisecond Redis latency',
          'Mỗi request vẫn tốn 1 vòng mạng tới Redis đơn lẻ và có nguy cơ SPOF nếu Redis dừng',
          'Adds 1 synchronous network hop per request to a single-node Redis SPOF'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('API Clients', 'API Clients'),
          what: bi('2.000 req/s đi vào từ các ứng dụng đối tác.', '2,000 req/s arriving from external integrations.'),
          how: bi('Đi ngẫu nhiên vào bất kỳ Gateway nào qua Load Balancer.', 'Hits any Gateway instance via Round-robin LB.'),
          why: bi('Đòi hỏi bộ đếm dùng chung để khách hàng không vượt gấp đôi hạn ngạch.', 'Requires shared state so N gateways do not allow N× quota.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Edge LB', 'Edge LB'),
          what: bi('Cân bằng tải chia đều lưu lượng vào cụm Gateway.', 'Load Balancer distributing traffic across Gateways.'),
          how: bi('Định tuyến Round-robin không giữ phiên cố định.', 'Stateless Round-robin distribution.'),
          why: bi('Cho phép mở rộng ngang tầng Gateway dễ dàng.', 'Allows horizontal Gateway scaling.'),
        },
        {
          id: 'gw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 3,
          opsPerSec: 4000,
          baseMs: 2.5,
          label: bi('Gateway ×3', 'Gateway ×3'),
          what: bi('Ba cổng API đệm quy tắc trong RAM và gọi EVALSHA lên Redis.', 'Three API Gateways caching rules locally and executing Redis Lua checks.'),
          how: bi('Trả kèm X-RateLimit-Remaining trong HTTP Header phản hồi.', 'Injects X-RateLimit-Remaining headers on every response.'),
          why: bi('Giữ logic giới hạn tách biệt khỏi mã nguồn dịch vụ nghiệp vụ.', 'Centralizes quota enforcement outside business microservices.'),
        },
        {
          id: 'counterStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'yellow',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 3800,
          baseMs: 0.8,
          params: { shards: 1 },
          label: bi('Redis Lua ×1', 'Redis Lua ×1'),
          what: bi('Một máy chủ Redis đơn luồng thực thi kịch bản Token Bucket nguyên tử.', 'Single-threaded Redis executing atomic Token Bucket Lua scripts.'),
          how: bi('Tính lượng token nạp thêm theo thời gian trôi qua và trừ 1 token.', 'Refills elapsed tokens and decrements 1 atomically.'),
          why: bi('Nhanh nhưng chạm trần ở ~3.800 kịch bản/giây trên 1 phân vùng.', 'Fast, but single-shard Lua execution caps around ~3,800 ops/s.'),
        },
        {
          id: 'api',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0.6,
          replicas: 3,
          opsPerSec: 1600,
          baseMs: 8,
          label: bi('Core API ×3', 'Core API ×3'),
          what: bi('Cụm 3 máy chủ nghiệp vụ xử lý yêu cầu hợp lệ.', '3-instance backend API service.'),
          how: bi('Tổng năng lực 4.800 req/s.', 'Provides 4,800 req/s backend capacity.'),
          why: bi('Được bảo vệ khỏi các khách hàng vượt ngưỡng hạn ngạch.', 'Shielded from abusive client bursts.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'gw' },
        { id: 'gw-redis', from: 'gw', to: 'counterStore', label: bi('EVALSHA', 'EVALSHA') },
        { id: 'gw-api', from: 'gw', to: 'api' },
      ],
      routes: {
        gw: 'all-sequential',
      },
      noteCard: {
        title: bi('v2 · Single Redis Lua', 'v2 · Single Redis Lua'),
        lines: [
          { text: bi('Đếm nguyên tử ~0,8 ms, không lệch ngưỡng', 'Atomic ~0.8 ms check, exact counts'), tone: 'good' },
          { text: bi('1 node Redis là SPOF & nghẽn ở ~3.800 req/s', 'Single Redis SPOF caps near ~3,800 req/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'rl',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Sharded Redis Cluster (Consistent Hashing) + Rule Cache', 'Consistent-Hashed Redis Shards + Edge Token Filter'),
      eraTag: bi('15.000 req/s · Phân mảnh khóa đếm', '15,000 req/s · Sharded Counter Ring'),
      targetRps: 15000,
      readRatio: 0.9,
      seed: 7333,
      summary: bi(
        'Phân mảnh không gian 5 triệu khóa định danh trên vòng băm nhất quán (Consistent Hashing) gồm 4 phân vùng Redis có Replica, kết hợp bộ lọc chặn sớm IP tấn công ngay tại biên.',
        'Partitions the 5M bucket keyspace via Consistent Hashing across a 4-shard Redis cluster with local rule caching and edge burst filtering.'
      ),
      whyNextStage: bi(
        'Khi tăng 5× lên 75.000 req/s (đặc biệt khi một đối tác lớn dồn 30.000 req/s vào cùng 1 API key nóng), việc gọi mạng đồng bộ tới 1 phân vùng Redis cho từng request gây nghẽn Hot Shard.',
        'At 5x load (75,000 req/s, especially with hot enterprise API keys), making a synchronous Redis network hop on every single request saturates hot shards and Gateways.'
      ),
      whatChanged: [
        diff('+', 'Phân mảnh bộ đếm sang cụm 4 phân vùng Redis theo hash(tenant_id)', 'Shard counters across a 4-partition Consistent-Hashed Redis cluster'),
        diff('+', 'Thêm tầng Edge Limiter chặn sớm các đợt quét IP cường độ lớn', 'Add L4/Edge burst limiter shedding volumetric IP floods early'),
        diff('~', 'Mở rộng cụm Gateway (×7) và Core API (×14)', 'Scale API Gateway (×7) and Core API (×14)'),
      ],
      tradeOffs: [
        trade(
          'Phân mảnh Redis theo khóa khách hàng nhưng vẫn gọi đồng bộ mỗi request',
          'Shard Redis by tenant key with per-request synchronous RPC',
          'Tăng tuyến tính thông lượng đếm cho hàng triệu khách hàng thông thường',
          'Scales counter throughput linearly across millions of normal keys',
          'Một API key của đối tác cực lớn vẫn rơi vào đúng 1 phân vùng duy nhất (Hot Key) và tốn 1 hop mạng',
          'A single high-volume enterprise key still hammers 1 Redis shard and pays 1 network RTT per call'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('API Clients', 'API Clients'),
          what: bi('15.000 req/s từ hàng triệu khóa API và người dùng.', '15,000 req/s across millions of tenant keys.'),
          how: bi('Bao gồm cả khách hàng nhỏ lẻ lẫn đối tác gọi tần suất cao.', 'Mix of long-tail users and high-throughput enterprise tenants.'),
          why: bi('Kiểm tra khả năng mở rộng ngang của vòng băm bộ đếm.', 'Tests horizontal counter sharding.'),
        },
        {
          id: 'limiter',
          kind: 'rate-limiter',
          shape: 'block',
          tone: 'purple',
          icon: 'filter',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.3,
          params: { ratePerSec: 82000, burst: 8000 },
          label: bi('L4 Burst Filter', 'L4 Burst Filter'),
          what: bi('Bộ lọc tốc độ cao chặn các đợt flood thô theo địa chỉ IP.', 'Coarse L4 per-IP flood filter.'),
          how: bi('Loại bỏ lưu lượng bất thường vượt trần bảo vệ chung.', 'Drops extreme volumetric bursts before L7 parsing.'),
          why: bi('Giữ tài nguyên TLS/HTTP cho lưu lượng khách hàng thực.', 'Preserves Gateway CPU for authenticated tenants.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.3,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải phân phối vào 7 máy Gateway.', 'Redundant Load Balancer pair.'),
          how: bi('Tổng thông lượng 90.000 req/s.', 'Routes up to 90,000 req/s.'),
          why: bi('Không còn điểm lỗi đơn ở cửa vào.', 'Removes entry SPOF.'),
        },
        {
          id: 'gw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 3,
          row: 0,
          replicas: 7,
          opsPerSec: 4600,
          baseMs: 2.5,
          label: bi('Gateway ×7', 'Gateway ×7'),
          what: bi('Cụm 7 Gateway định tuyến khóa băm tới đúng phân vùng Redis.', '7 Gateways hashing tenant keys onto the 4-shard Redis ring.'),
          how: bi('Đặt Timeout ngắn 15 ms tới Redis kèm cơ chế Fail-open.', 'Uses strict 15 ms Redis timeouts with fail-open circuit protection.'),
          why: bi('Tổng năng lực ~32.200 req/s.', 'Provides ~32,200 req/s gateway throughput.'),
        },
        {
          id: 'counterStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'yellow',
          col: 4,
          row: -0.65,
          replicas: 4,
          opsPerSec: 6200,
          baseMs: 0.8,
          params: { shards: 4 },
          label: bi('Redis 4 Shards', 'Redis 4 Shards'),
          what: bi('Cụm 4 phân vùng Redis chạy Lua Token Bucket có bản sao dự phòng.', '4-shard Consistent-Hashed Redis cluster running atomic Lua buckets.'),
          how: bi('Chia 15.000 lệnh kiểm tra/giây thành ~3.750 lệnh mỗi phân vùng.', 'Splits 15,000 checks/s into ~3,750 ops/s per shard.'),
          why: bi('Loại bỏ giới hạn CPU đơn luồng của 1 máy Redis duy nhất.', 'Overcomes single-core Redis throughput limits.'),
        },
        {
          id: 'api',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 4,
          row: 0.65,
          replicas: 14,
          opsPerSec: 1800,
          baseMs: 7,
          label: bi('Core API ×14', 'Core API ×14'),
          what: bi('14 instance dịch vụ nghiệp vụ nhận lưu lượng sạch.', '14 backend service instances.'),
          how: bi('Năng lực phục vụ 25.200 req/s.', 'Serves up to 25,200 req/s cleanly.'),
          why: bi('Hoạt động ổn định trong hạn ngạch đã cam kết.', 'Operates predictably within enforced tenant SLAs.'),
        },
      ],
      links: [
        { id: 'c-lim', from: 'client', to: 'limiter' },
        { id: 'lim-lb', from: 'limiter', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'gw' },
        { id: 'gw-redis', from: 'gw', to: 'counterStore', label: bi('Hash Ring', 'Hash Ring') },
        { id: 'gw-api', from: 'gw', to: 'api' },
      ],
      routes: {
        gw: 'all-sequential',
      },
      zones: [
        { id: 'z-edge', nodeIds: ['limiter', 'lb', 'gw'], label: bi('EDGE CONTROL PLANE', 'EDGE CONTROL PLANE'), tone: 'purple' },
      ],
      noteCard: {
        title: bi('v3 · Sharded Redis Ring', 'v3 · Sharded Redis Ring'),
        lines: [
          { text: bi('Consistent Hashing chia đều 4 phân vùng', 'Consistent Hashing across 4 shards'), tone: 'good' },
          { text: bi('Vẫn tốn 1 vòng mạng Redis mỗi request', 'Still pays 1 Redis network hop per call'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'rl',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Local Token Lease Batching + Multi-AZ Redis + Async 429 Audit', 'Local Token Leases + Multi-AZ Sharded Redis + Async Audit'),
      eraTag: bi('55.000+ req/s · Độ trễ < 1 ms tại RAM cục bộ', '55,000+ req/s · Sub-1ms Local Token Lease'),
      targetRps: 55000,
      readRatio: 0.95,
      seed: 7334,
      summary: bi(
        'Mỗi Gateway mượn trước lô nhỏ token (Local Lease / Batch Sync mỗi 100 ms) ngay trong RAM cục bộ để giải quyết ~95% lượt kiểm tra trong 0,1 ms mà không cần gọi mạng, đồng thời đẩy nhật ký 429 qua hàng đợi nền.',
        'Each Gateway leases small token batches locally in RAM (syncing to Redis every ~100 ms), resolving ~95% of checks in <0.1 ms with zero network hop and streaming 429 audit logs asynchronously.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 đạt >95.000 req/s với chi phí độ trễ kiểm tra gần bằng 0 và tự động chạy độc lập bằng bộ đếm cục bộ ngay cả khi toàn bộ cụm Redis bảo trì.',
        'Sustains >95,000 req/s with sub-millisecond check overhead and survives full Redis maintenance via autonomous local buckets.'
      ),
      whatChanged: [
        diff('+', 'Thêm Local Token Lease Cache ngay trên từng Gateway (95% kiểm tra tại chỗ trong RAM)', 'Add Local Token Lease batching on Gateways (95% zero-hop in-RAM checks)'),
        diff('+', 'Thêm Async Audit Queue + Workers ghi nhận sự kiện vượt ngưỡng 429 phục vụ cảnh báo', 'Add Async Audit Queue + Workers recording 429 throttling telemetry'),
        diff('~', 'Mở rộng Multi-AZ lên 18 Gateways, 6 phân vùng Redis và 38 Core APIs', 'Scale Multi-AZ fleet to 18 Gateways, 6 Redis shards, and 38 Core APIs'),
      ],
      tradeOffs: [
        trade(
          'Cấp phát lô token cục bộ + đồng bộ nền mỗi 100 ms thay vì gọi Redis từng request',
          'Local token batch leases synced every 100 ms instead of per-request RPC',
          'Giảm ~20× lưu lượng vào cụm Redis, giải quyết triệt để Hot Key và hạ độ trễ xuống < 0,5 ms',
          'Cuts Redis QPS ~20x, eliminates hot-key shard bottlenecks, and drops check overhead <0.5 ms',
          'Có thể cho lọt vượt ngưỡng tối đa một lượng nhỏ bằng kích thước lô mượn (±2–4%) ở biên cửa sổ',
          'Allows bounded ±2–4% momentary overshoot at window boundaries across gateways'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('55K RPS Edge', '55K RPS Edge'),
          what: bi('55.000 req/s lưu lượng sản xuất cường độ cao.', '55,000 req/s high-throughput production API traffic.'),
          how: bi('Chứa cả các khoá doanh nghiệp gọi hàng chục nghìn lần/giây.', 'Includes ultra-hot enterprise tenant keys.'),
          why: bi('Chứng minh hiệu quả của cơ chế mượn lô token cục bộ.', 'Validates zero-hop local token batching under hot-key skew.'),
        },
        {
          id: 'limiter',
          kind: 'rate-limiter',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 1,
          row: 0,
          replicas: 3,
          opsPerSec: 80000,
          baseMs: 0.2,
          params: { ratePerSec: 105000, burst: 20000 },
          label: bi('Anycast Guard', 'Anycast Guard'),
          what: bi('Lớp bảo vệ DDoS/L4 tại rìa mạng.', 'Edge volumetric protection tier.'),
          how: bi('Cắt lưu lượng vượt 105.000 req/s.', 'Caps extreme volumetric spikes above 105K req/s.'),
          why: bi('Giữ ổn định cho toàn bộ hạ tầng phía sau.', 'Protects L7 load balancers and gateways.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 5,
          opsPerSec: 22000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB ×5', 'Multi-AZ LB ×5'),
          what: bi('Cụm 5 bộ cân bằng tải phân phối đều sang 18 Gateway.', '5-node Multi-AZ Load Balancer tier.'),
          how: bi('Tổng năng lực 110.000 req/s.', 'Provides 110,000 req/s capacity.'),
          why: bi('Đảm bảo dự phòng N+2 giữa các vùng sẵn sàng.', 'Provides N+2 cross-AZ redundancy.'),
        },
        {
          id: 'gw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'zap',
          col: 3,
          row: 0,
          replicas: 22,
          opsPerSec: 4600,
          baseMs: 1.8,
          label: bi('Gateway ×22', 'Gateway ×22'),
          what: bi('Cổng API tích hợp bộ đếm cục bộ đồng bộ theo lô.', '22 API Gateways with in-process token lease buckets.'),
          how: bi('Trừ token ngay trong RAM và đẩy bản tin kiểm toán bất đồng bộ.', 'Decrements leased tokens in RAM and emits async audit events.'),
          why: bi('Độ trễ kiểm tra gần như bằng 0 trên đường đi chính.', 'Achieves sub-millisecond quota enforcement.'),
        },
        {
          id: 'localLease',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4,
          row: -0.7,
          replicas: 3,
          opsPerSec: 45000,
          baseMs: 0.2,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.95 },
          label: bi('Local Lease RAM', 'Local Lease RAM'),
          what: bi('Bộ đệm quy tắc và lô token mượn sẵn ngay trong bộ nhớ Gateway.', 'In-memory rule cache and leased token batches.'),
          how: bi('95% lượt kiểm tra kết thúc tại đây; chỉ 5% đồng bộ lô xuống Redis.', 'absorbs 95% of checks locally; only 5% flush/lease to Redis.'),
          why: bi('Giải quyết hoàn toàn bài toán Hot Key trên mạng.', 'Completely shields Redis from hot-key network storms.'),
        },
        {
          id: 'counterStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5,
          row: -0.7,
          replicas: 6,
          opsPerSec: 7000,
          baseMs: 0.8,
          params: { shards: 6 },
          label: bi('Redis 6 Shards', 'Redis 6 Shards'),
          what: bi('Cụm 6 phân vùng Redis Multi-AZ điều phối hạn ngạch toàn cục.', '6-shard Multi-AZ Redis cluster coordinating global token leases.'),
          how: bi('Chỉ phải xử lý ~3.000–5.000 lượt đồng bộ lô/giây cực nhẹ nhàng.', 'Processes only ~3K–5K lightweight batch syncs/s.'),
          why: bi('Còn dư hơn 85% năng lực dự phòng cho các đợt cao điểm.', 'Maintains >85% headroom even at 55K+ edge RPS.'),
        },
        {
          id: 'api',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 4.5,
          row: 0.05,
          replicas: 38,
          opsPerSec: 2500,
          baseMs: 6,
          label: bi('Core API ×38', 'Core API ×38'),
          what: bi('Cụm 38 máy chủ dịch vụ nghiệp vụ Multi-AZ.', '38-instance Multi-AZ backend service fleet.'),
          how: bi('Năng lực phục vụ 95.000 req/s.', 'Delivers 95,000 req/s sustained backend throughput.'),
          why: bi('Luôn nhận lưu lượng nằm gọn trong ngưỡng cam kết.', 'Protected end-to-end by multi-layer rate limiting.'),
        },
        {
          id: 'auditQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4,
          row: 0.75,
          replicas: 1,
          opsPerSec: 60000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 250000 },
          label: bi('429 Audit Q', '429 Audit Q'),
          what: bi('Hàng đợi ghi nhận thống kê sử dụng hạn ngạch và cảnh báo lạm dụng.', 'Async queue streaming quota usage and 429 rejection metrics.'),
          how: bi('Nhận mẫu sự kiện không chặn từ Gateway.', 'Buffers sampled rate-limit telemetry off the hot path.'),
          why: bi('Cung cấp biểu đồ sử dụng thời gian thực cho khách hàng.', 'Feeds customer usage dashboards and billing alerts.'),
        },
        {
          id: 'auditWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 5,
          row: 0.75,
          replicas: 10,
          opsPerSec: 1200,
          baseMs: 12,
          label: bi('Audit Worker', 'Audit Worker'),
          what: bi('Nhóm Worker tổng hợp số liệu vượt ngưỡng theo từng khách hàng.', 'Workers aggregating tenant quota analytics.'),
          how: bi('Ghi theo lô xuống kho quan sát.', 'Flushes aggregated usage series.'),
          why: bi('Tách hoàn toàn việc ghi log khỏi độ trễ API.', 'Zero logging impact on gateway p99.'),
        },
      ],
      links: [
        { id: 'c-lim', from: 'client', to: 'limiter' },
        { id: 'lim-lb', from: 'limiter', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'gw' },
        { id: 'gw-lease', from: 'gw', to: 'localLease', carries: 'r', label: bi('95% RAM', '95% RAM') },
        { id: 'lease-redis', from: 'localLease', to: 'counterStore', carries: 'r', label: bi('Batch 100ms', 'Batch 100ms') },
        { id: 'gw-api', from: 'gw', to: 'api' },
        { id: 'gw-audit', from: 'gw', to: 'auditQueue', mode: 'async', fraction: 0.12 },
        { id: 'audit-w', from: 'auditQueue', to: 'auditWorker', mode: 'pull' },
      ],
      routes: {
        gw: 'all-parallel',
      },
      zones: [
        { id: 'z-lease', nodeIds: ['gw', 'localLease', 'counterStore'], label: bi('HYBRID LOCAL-GLOBAL BUCKETS', 'HYBRID LOCAL-GLOBAL BUCKETS'), tone: 'yellow' },
      ],
      noteCard: {
        title: bi('v4 · Local Batch Lease', 'v4 · Local Batch Lease'),
        lines: [
          { text: bi('95% kiểm tra tại RAM · Giảm 20× tải Redis', '95% in-RAM check · 20× less Redis load'), tone: 'good' },
          { text: bi('Chịu tải > 95.000 req/s · Fail-open an toàn', 'Sustains > 95K req/s · Resilient fallback'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 5. MULTI-CHANNEL NOTIFICATION SYSTEM — Linked Module: S7-03
 * ============================================================================ */
const CASE_NOTIFICATION_SYSTEM: SdDesignCase = {
  id: 'notification-system',
  order: 5,
  linkedModuleId: 'S7-03',
  domainTag: bi('Priority Queues · Dedup · Provider Breaker', 'Priority Queues · Dedup · Provider Breaker'),
  difficulty: 'Intermediate',
  title: bi('Hệ thống Thông báo đa kênh (Push/SMS/Email)', 'Multi-Channel Notification System'),
  subtitle: bi(
    'Điều phối hàng chục triệu thông báo qua Push, SMS và Email với cô lập hàng đợi ưu tiên cho mã OTP, chống gửi trùng và chuyển đổi nhà mạng dự phòng.',
    'High-throughput Push, SMS, and Email delivery with strict OTP priority isolation, idempotency deduplication, and multi-vendor circuit breakers.'
  ),
  problemBrief: bi(
    'Thiết kế nền tảng gửi thông báo tập trung phục vụ toàn bộ các dịch vụ nội bộ (xác thực OTP, biên lai đơn hàng, nhắc lịch và chiến dịch tiếp thị) qua ba kênh Push, SMS và Email.',
    'Design a centralized notification platform serving internal services (OTP auth, order receipts, reminders, and marketing campaigns) across Push, SMS, and Email.'
  ),
  clarifyingQuestions: [
    {
      id: 'ntf-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Tổng số thông báo gửi ra mỗi ngày trên từng kênh và mức lưu lượng đỉnh khi phát chiến dịch tiếp thị là bao nhiêu?',
        'What is the daily volume across Push/Email/SMS and the peak ingestion rate during marketing blasts?'
      ),
      answer: bi(
        'Khoảng 50 triệu Push, 10 triệu Email và 2 triệu SMS/ngày; trung bình ~1.500 sự kiện/giây nhưng khi kích hoạt chiến dịch khuyến mãi có thể đổ về >50.000 thông báo/giây.',
        '~50M Push, 10M Email, and 2M SMS per day; ~1,500 events/s baseline spiking above 50,000 notifications/s during flash campaigns.'
      ),
      rationale: bi(
        'Chênh lệch >30× giữa mức trung bình và lúc bắn chiến dịch đòi hỏi tầng hấp thụ sự kiện bất đồng bộ có khả năng đệm hàng triệu bản tin.',
        '30x campaign spikes require durable asynchronous ingestion queues decoupling callers from vendor rate limits.'
      ),
    },
    {
      id: 'ntf-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Mức ưu tiên giữa tin giao dịch khẩn (mã OTP đăng nhập, cảnh báo thanh toán) và tin khuyến mãi hàng loạt khác nhau thế nào?',
        'How do priority requirements differ between urgent transactional alerts (OTPs) and bulk marketing messages?'
      ),
      answer: bi(
        'Tin OTP/giao dịch chiếm ~12% lưu lượng nhưng có độ ưu tiên tuyệt đối: một chiến dịch 10 triệu tin quảng cáo không bao giờ được làm chậm mã OTP của người đang đăng nhập.',
        'Critical OTPs/alerts (~12% of volume) must never queue behind a 10M-message marketing blast (strict priority isolation).'
      ),
      rationale: bi(
        'Bắt buộc tách riêng hàng đợi và nhóm Worker theo mức ưu tiên (Critical Queue vs Bulk Queue) để triệt tiêu hiện tượng chặn đầu hàng (Head-of-Line Blocking).',
        'Mandates physically separate Critical and Bulk queues + worker pools to prevent head-of-line blocking.'
      ),
    },
    {
      id: 'ntf-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Độ trễ yêu cầu đối với tin OTP so với tin tiếp thị, và có cần kiểm tra tuỳ chọn từ chối nhận tin (Opt-out) của người dùng không?',
        'What is the delivery SLA for OTPs vs marketing, and must user opt-out preferences be enforced?'
      ),
      answer: bi(
        'API tiếp nhận trả lời p99 < 40 ms; OTP chuyển tới nhà mạng trong p99 < 3 giây; bắt buộc kiểm tra bảng Opt-out/Quiet Hours của người dùng trước khi phát tin tiếp thị.',
        'Ingest API p99 < 40 ms; OTP dispatch p99 < 3 s; strictly enforce user channel opt-outs before dispatching marketing.'
      ),
      rationale: bi(
        'Cần đệm hồ sơ thiết bị và cấu hình Opt-out của người dùng trong Redis Cache để kiểm tra nhanh ngay tại tầng tiếp nhận/xử lý.',
        'Requires caching user device tokens and opt-out preferences in Redis to avoid per-message SQL lookups.'
      ),
    },
    {
      id: 'ntf-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Làm sao tránh gửi trùng nhiều SMS tốn phí khi Worker thử lại, và xử lý ra sao khi cổng SMS bên thứ ba chậm hoặc giới hạn tốc độ?',
        'How do we prevent duplicate paid SMS deliveries on retries, and handle slow or rate-limited third-party vendors?'
      ),
      answer: bi(
        'Bắt buộc gắn idempotency_key (notification_id) kiểm tra trên kho chống trùng lặp, điều tiết tốc độ kéo theo hạn ngạch nhà cung cấp, bật Retry có Backoff + Jitter, Circuit Breaker sang nhà mạng phụ và DLQ.',
        'Deduplicate by notification_id in Redis, throttle workers to vendor quotas, use jittered backoff + failover Circuit Breakers across secondary SMS/Email providers, and route poison jobs to DLQ.'
      ),
      rationale: bi(
        'Đảm bảo ngữ nghĩa At-least-once kết hợp Idempotency: không mất tin quan trọng mà cũng không làm phiền người dùng hay tốn gấp đôi chi phí SMS.',
        'Achieves effectively-once user experience over at-least-once queues while surviving third-party vendor brownouts.'
      ),
    },
    {
      id: 'ntf-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Tiêu đề Email khuyến mãi mùa hè nên viết in hoa toàn bộ hay chỉ viết hoa chữ cái đầu?',
        'Should summer promotional email subject lines use ALL CAPS or Title Case?'
      ),
      answer: bi(
        'Nội dung văn bản do đội tiếp thị nhập vào hệ thống mẫu (Template).',
        'Copywriting is managed dynamically via message templates.'
      ),
      rationale: bi(
        'Không ảnh hưởng tới kiến trúc phân luồng hàng đợi ưu tiên hay tích hợp nhà cung cấp.',
        'Does not impact queue topology, deduplication, or vendor resilience.'
      ),
    },
    {
      id: 'ntf-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên tự viết trình phân tích cú pháp SMTP từ mức socket thô thay vì gọi API/SDK chuẩn của nhà cung cấp gửi thư không?',
        'Should we build a raw socket SMTP parser from scratch instead of integrating standard ESP/SMS gateways?'
      ),
      answer: bi(
        'Không: gửi trực tiếp không qua hạ tầng uy tín IP (SES/SendGrid/Twilio) sẽ bị đánh dấu thư rác ngay.',
        'No: IP reputation, DKIM/SPF deliverability, and carrier routing rely on specialized providers.'
      ),
      rationale: bi(
        'Bài toán cốt lõi của kiến trúc sư là điều phối đa nhà cung cấp, chống gửi trùng và chịu tải cao.',
        'Focus on multi-vendor orchestration, rate control, and priority isolation rather than reinventing carrier protocols.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('62M thông báo/ngày (3 kênh)', '62M notifications/day (3 channels)'),
    readRps: bi('Kiểm tra User Prefs & Template trong RAM', 'In-RAM User Prefs & Template lookups'),
    writeRps: bi('1.500 TB / 50.000 đỉnh ingest/s', '1,500 avg / 50,000 peak ingest/s'),
    readWriteRatio: bi('12% Critical OTP : 88% Transactional/Bulk', '12% Critical OTP : 88% Bulk/Standard'),
    storagePerDay: bi('~60 GB nhật ký trạng thái gửi & webhook/ngày', '~60 GB delivery status & webhook logs/day'),
    memoryOrBandwidth: bi('~25 GB Redis (Dedup keys 24h + Device Tokens)', '~25 GB Redis (24h Dedup keys + Device Tokens)'),
    slos: [
      bi('Ingest API p99 < 40 ms', 'Ingest API p99 < 40 ms'),
      bi('Critical OTP dispatch < 3 s', 'Critical OTP dispatch < 3 s'),
      bi('0% Head-of-Line Blocking bởi Bulk', 'Zero OTP blocking during Bulk blasts'),
    ],
    snakeSummary: {
      scope: bi('Tiếp nhận sự kiện, lọc Opt-out, kết xuất mẫu, phát qua Push/SMS/Email và lưu trạng thái.', 'Ingest events, check opt-out, render templates, dispatch Push/SMS/Email, track status.'),
      numbers: bi('62M/ngày, đỉnh chiến dịch 50K/s, OTP < 3s, giữ khoá chống trùng 24h.', '62M/day, 50K/s campaign peak, OTP < 3s, 24h dedup window.'),
      api: bi('POST /v1/notifications {idempotencyKey, priority, userId, channels, templateId, vars}.', 'POST /v1/notifications {idempotencyKey, priority, userId, channels, templateId, vars}.'),
      keyComponents: bi('Ingest API, Dedup & Pref Cache, Critical/Bulk Queues, Channel Workers, Multi-Vendor Breaker.', 'Ingest API, Dedup & Pref Cache, Critical/Bulk Queues, Channel Workers, Multi-Vendor Breaker.'),
      elaborate: bi('Tách Queue theo mức ưu tiên + kênh, điều tiết tốc độ theo quota nhà mạng, DLQ + đối soát webhook.', 'Priority + per-channel queues, vendor rate shaping, DLQ + delivery webhook tracking.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'ntf',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Gọi đồng bộ Nhà cung cấp SMS/Email trong API', 'Synchronous Inline Vendor Calls'),
      eraTag: bi('100 req/s · Khoá luồng chờ bên thứ ba', '100 req/s · Blocking Third-Party HTTP'),
      targetRps: 100,
      readRatio: 0.2,
      seed: 7341,
      summary: bi(
        'Dịch vụ thanh toán/đăng nhập gọi thẳng sang Notification API, và Notification API chờ phản hồi HTTP đồng bộ (75 ms) từ nhà cung cấp SMS/Email ngoài Internet rồi mới trả lời.',
        'Callers invoke Notification API, which synchronously awaits external SMS/Email vendor HTTP responses (~75 ms) before returning.'
      ),
      whyNextStage: bi(
        'Khi tăng 5× lên 500 req/s (hoặc khi nhà mạng chậm), kết nối đồng bộ ra bên ngoài (μ = 210 req/s) làm cạn sạch luồng xử lý và kéo lỗi ngược về dịch vụ đăng nhập/đặt hàng.',
        'At 5x load (500 req/s), slow external vendor HTTP calls (μ = 210 req/s) exhaust threads and cascade timeouts back into checkout/login.'
      ),
      whatChanged: [
        diff('+', '1 Notification API kiểm tra người dùng và gọi trực tiếp cổng SMS/Email', 'Single Notification API calling external SMS/Email endpoints inline'),
        diff('+', '1 cổng Nhà cung cấp bên ngoài độ trễ cao (~75 ms)', 'External third-party provider gateway (~75 ms RTT)'),
      ],
      tradeOffs: [
        trade(
          'Gọi đồng bộ trực tiếp sang cổng nhà mạng/email trong lúc xử lý HTTP',
          'Call external SMS/Email providers synchronously inside the HTTP request',
          'Biết ngay kết quả gửi thành công hay lỗi ngay trong cùng một lời gọi',
          'Immediate inline pass/fail response without queue infrastructure',
          'Độ trễ cao, dễ mất thông báo nếu nhà mạng bảo trì và làm treo cả dịch vụ gọi nó',
          'Couples core checkout/login uptime directly to third-party vendor latency'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Caller Services', 'Caller Services'),
          what: bi('Các dịch vụ Auth, Order và Marketing gửi yêu cầu thông báo.', 'Internal Auth, Order, and Marketing services triggering notifications.'),
          how: bi('Gọi HTTP đồng bộ và chờ kết quả.', 'Invokes Notification API synchronously.'),
          why: bi('Bị ảnh hưởng trực tiếp nếu Notification API phản hồi chậm.', 'Suffers thread starvation if Notification API stalls.'),
        },
        {
          id: 'notifApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 450,
          baseMs: 12,
          label: bi('Notif API', 'Notif API'),
          what: bi('Máy chủ ghép nội dung mẫu và gọi HTTP ra Internet.', 'Single server rendering templates and calling vendor APIs.'),
          how: bi('Giữ luồng mở suốt thời gian chờ nhà mạng trả lời.', 'Holds worker threads open across external WAN round-trips.'),
          why: bi('Không có lớp đệm hấp thụ đột biến lưu lượng.', 'Lacks buffering for bursts or vendor slowdowns.'),
        },
        {
          id: 'vendorGw',
          kind: 'service',
          shape: 'block',
          tone: 'orange',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 210,
          baseMs: 75,
          zone: 'internet',
          label: bi('Vendor API', 'Vendor API'),
          what: bi('Cổng SMS / Email / Push của nhà cung cấp bên thứ ba.', 'External third-party SMS/Email/Push gateway.'),
          how: bi('Độ trễ mạng ngoài trung bình ~75 ms và giới hạn ~210 req/s.', 'Averages ~75 ms external latency with strict rate caps (~210 req/s).'),
          why: bi('Trở thành điểm nghẽn làm đổ dây chuyền ở 500 req/s.', 'Bottlenecks and triggers cascading timeouts at 500 req/s.'),
        },
      ],
      links: [
        { id: 'c-api', from: 'client', to: 'notifApi' },
        { id: 'api-vendor', from: 'notifApi', to: 'vendorGw', netClass: 'internet', label: bi('Sync 75ms', 'Sync 75ms') },
      ],
      noteCard: {
        title: bi('v1 · Gọi Vendor đồng bộ', 'v1 · Sync Vendor Call'),
        lines: [
          { text: bi('Độ trễ API bị neo vào mạng ngoài (~150 ms)', 'API latency tied to external WAN (~150 ms)'), tone: 'amber' },
          { text: bi('Vendor chậm làm treo luôn Auth/Checkout', 'Slow vendor stalls Auth & Checkout'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ntf',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Hàng đợi chung (Single Shared Queue) + Pref Cache', 'Single Shared Queue + Worker Pool + Pref Cache'),
      eraTag: bi('2.000 req/s · Tách gửi bất đồng bộ', '2,000 req/s · Async Decoupling'),
      targetRps: 2000,
      readRatio: 0.2,
      seed: 7342,
      summary: bi(
        'Tách rời việc tiếp nhận khỏi việc phát tin bằng một Message Queue dùng chung và đệm thông tin thiết bị/Opt-out trong Redis; API trả 202 Accepted ngay sau vài mili-giây.',
        'Decouples ingestion from external delivery via a shared Message Queue and Redis Preference Cache, returning HTTP 202 Accepted in milliseconds.'
      ),
      whyNextStage: bi(
        'Khi chiến dịch tiếp thị đẩy tải 5× lên 10.000 req/s, toàn bộ tin khuyến mãi lấp đầy hàng đợi dùng chung và làm bão hoà cụm Dispatch Worker (3.400 tin/s), khiến mã OTP khẩn bị kẹt hàng phút phía sau!',
        'During a 5x marketing campaign (10,000 req/s), bulk messages saturate the shared Dispatch Workers (3,400/s) and delay urgent login OTPs behind a massive queue (Head-of-Line Blocking)!'
      ),
      whatChanged: [
        diff('+', 'Chèn Shared Queue + Dispatch Workers tách hẳn nhà cung cấp ngoài khỏi đường HTTP', 'Insert Shared Queue + Dispatch Workers decoupling external vendors'),
        diff('+', 'Thêm User Pref & Token Cache (Redis) kiểm tra nhanh trạng thái Opt-out', 'Add Redis Preference & Device Token Cache'),
        diff('~', 'Đổi phản hồi API sang 202 Accepted bất đồng bộ kèm lưu trạng thái vào SQL', 'Return fast HTTP 202 Accepted while workers process in background'),
      ],
      tradeOffs: [
        trade(
          'Dùng một hàng đợi chung cho mọi loại thông báo',
          'Single shared queue for all notification types',
          'Kiến trúc gọn, hấp thụ tốt các đợt tăng tải ngắn mà không làm lỗi dịch vụ gọi',
          'Simple topology that absorbs short spikes without failing callers',
          'Bị lỗi Chặn đầu hàng (Head-of-Line Blocking): chiến dịch lớn làm trễ thông báo OTP khẩn cấp',
          'Suffers Head-of-Line Blocking: bulk marketing blasts stall urgent OTPs'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Caller Services', 'Caller Services'),
          what: bi('2.000 yêu cầu gửi thông báo mỗi giây (lẫn cả OTP và tin thường).', '2,000 mixed OTP and bulk notification requests/s.'),
          how: bi('Nhận mã xác nhận tiếp nhận sớm từ Ingest API.', 'Receives fast 202 Accepted acknowledgments.'),
          why: bi('Dịch vụ thanh toán không còn bị khóa chờ nhà mạng.', 'Core business services are decoupled from carrier latency.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải trước cụm Ingest API.', 'Load Balancer fronting Ingest APIs.'),
          how: bi('Chia đều tải tiếp nhận sang 3 máy chủ.', 'Distributes requests across 3 servers.'),
          why: bi('Loại bỏ giới hạn 1 máy tiếp nhận.', 'Enables horizontal ingest scaling.'),
        },
        {
          id: 'notifApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 4,
          opsPerSec: 2900,
          baseMs: 6,
          label: bi('Ingest API ×4', 'Ingest API ×4'),
          what: bi('Tầng xác thực định dạng, đọc cấu hình Opt-out và đẩy vào Queue.', 'Stateless API validating payloads, checking opt-outs, and enqueueing.'),
          how: bi('Không còn gọi mạng ra nhà cung cấp ngoài.', 'Never calls external carriers directly.'),
          why: bi('Giữ độ trễ tiếp nhận p99 luôn thấp (~15–20 ms).', 'Keeps ingest p99 consistently low (~15–20 ms).'),
        },
        {
          id: 'prefCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.9 },
          label: bi('Pref & Token', 'Pref & Token'),
          what: bi('Bộ đệm lưu token thiết bị và tuỳ chọn nhận tin của người dùng.', 'Redis cache storing device tokens and user opt-out settings.'),
          how: bi('Trả lời 90% truy vấn kiểm tra trong 0,5 ms.', 'Serves 90% of preference lookups in 0.5 ms.'),
          why: bi('Tránh đọc SQL lặp lại cho mỗi thông báo trong chiến dịch.', 'Prevents repetitive SQL reads during campaigns.'),
        },
        {
          id: 'logStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: -0.6,
          replicas: 1,
          opsPerSec: 1200,
          baseMs: 5,
          label: bi('Notif SQL', 'Notif SQL'),
          what: bi('Cơ sở dữ liệu lưu mẫu thông báo và lịch sử gửi.', 'SQL database storing templates and delivery records.'),
          how: bi('Nhận các lượt Miss từ Pref Cache.', 'Handles cache misses and template metadata.'),
          why: bi('Lưu nguồn dữ liệu chuẩn cho người dùng.', 'Provides durable preference storage.'),
        },
        {
          id: 'sharedQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3,
          row: 0.6,
          replicas: 1,
          opsPerSec: 40000,
          baseMs: 1,
          params: { dlq: false, maxDepth: 150000 },
          label: bi('Shared Queue', 'Shared Queue'),
          what: bi('Một hàng đợi FIFO duy nhất chứa chung cả OTP lẫn tin tiếp thị.', 'Single FIFO queue mixing critical OTPs and marketing messages.'),
          how: bi(' Xếp hàng tuần tự không phân biệt mức độ khẩn cấp.', 'Processes strictly in arrival order regardless of urgency.'),
          why: bi('Điểm yếu kiến trúc: chiến dịch lớn sẽ chặn đứng tin OTP phía sau.', 'Architectural flaw: a bulk blast blocks urgent OTPs behind it.'),
        },
        {
          id: 'dispatchWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4,
          row: 0.6,
          replicas: 6,
          opsPerSec: 460,
          baseMs: 25,
          label: bi('Workers ×6', 'Workers ×6'),
          what: bi('6 Worker kéo thông báo từ hàng đợi chung và gọi ra cổng nhà mạng.', '6 workers pulling from Shared Queue and calling external vendors.'),
          how: bi('Tổng năng lực xử lý ~2.760 thông báo/giây.', 'Combined dispatch capacity ~2,760 notifications/s.'),
          why: bi('Quá tải hoàn toàn khi chiến dịch đổ về 8.000+ tin/giây (mốc ×5).', 'Saturates completely during a 5x campaign spike.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'notifApi' },
        { id: 'api-pref', from: 'notifApi', to: 'prefCache', carries: 'r' },
        { id: 'pref-sql', from: 'prefCache', to: 'logStore', carries: 'r' },
        { id: 'api-q', from: 'notifApi', to: 'sharedQueue', mode: 'async', carries: 'w', label: bi('Mixed FIFO', 'Mixed FIFO') },
        { id: 'q-worker', from: 'sharedQueue', to: 'dispatchWorker', mode: 'pull' },
      ],
      routes: {
        notifApi: 'all-parallel',
      },
      noteCard: {
        title: bi('v2 · Hàng đợi dùng chung', 'v2 · Single Shared Queue'),
        lines: [
          { text: bi('Ingest API trả sớm 202 trong ~18 ms', 'Ingest API returns 202 in ~18 ms'), tone: 'good' },
          { text: bi('Bulk làm kẹt OTP khi tải chiến dịch ×5', 'Bulk blocks OTPs under ×5 campaign load'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ntf',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Cô lập Hàng đợi theo Ưu tiên (Critical OTP vs Bulk) + Dedup', 'Priority-Isolated Queues (OTP vs Bulk) + Dedup Store'),
      eraTag: bi('15.000 req/s · Chống kẹt OTP & Chống gửi trùng', '15,000 req/s · Priority Isolation & Dedup'),
      targetRps: 15000,
      readRatio: 0.2,
      seed: 7343,
      summary: bi(
        'Tách vật lý hàng đợi và cụm Worker thành làn Critical (OTP/giao dịch) và làn Bulk (chiến dịch), đồng thời kiểm tra khóa chống gửi trùng (Dedup Key) trên Redis trước khi phát tin.',
        'Physically isolates Critical OTP queues/workers from Bulk campaign pipelines and enforces idempotent notification_id deduplication in Redis.'
      ),
      whyNextStage: bi(
        'Ở mức 5× (75.000 req/s), làn OTP vẫn an toàn nhưng tầng Ingest API chưa có bộ điều tiết biên và cụm Bulk Worker cần tự động mở rộng đa vùng kèm DLQ chuyên sâu.',
        'At 5x load (75,000 req/s), unthrottled campaign publishers saturate the Ingest API and Bulk Worker pool.'
      ),
      whatChanged: [
        diff('+', 'Tách riêng Critical OTP Queue + Dedicated Workers khỏi Bulk Campaign Queue', 'Split Critical OTP Queue + Workers away from Bulk Campaign Queue'),
        diff('+', 'Thêm kiểm tra Idempotency / Dedup Key (24h) trong Redis chống gửi lặp SMS', 'Add 24h Redis Deduplication Key check preventing duplicate SMS charges'),
        diff('~', 'Chuyển kho nhật ký trạng thái sang Sharded NoSQL (3 phân vùng) có bật DLQ', 'Move delivery logs to 3-shard NoSQL and enable Dead-Letter Queues'),
      ],
      tradeOffs: [
        trade(
          'Tách cụm Queue và Worker riêng biệt theo mức độ ưu tiên (Bulkhead)',
          'Dedicated queues and worker pools per priority class (Bulkhead)',
          'Đảm bảo 100% mã OTP đi qua đường thông thoáng ngay cả khi Bulk đang dồn hàng triệu tin',
          'Guarantees sub-second OTP dispatch even while Bulk queue holds millions of items',
          'Tốn thêm chi phí duy trì năng lực dự phòng riêng cho cụm Critical Worker lúc ít giao dịch',
          'Maintains dedicated idle headroom on Critical workers during quiet periods'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Caller Services', 'Caller Services'),
          what: bi('15.000 yêu cầu thông báo/giây kèm nhãn ưu tiên và idempotency_key.', '15,000 notification events/s carrying priority and idempotency_key.'),
          how: bi('12% là OTP/biên lai khẩn, 88% là thông báo thường và chiến dịch.', '12% urgent OTPs/alerts, 88% standard and campaign messages.'),
          why: bi('Cần cam kết SLA khác nhau cho hai nhóm lưu lượng.', 'Requires differentiated SLAs per traffic class.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải điều phối vào cụm Ingest API.', 'Redundant Load Balancer pair.'),
          how: bi('Chịu tải tới 90.000 req/s.', 'Routes up to 90,000 req/s.'),
          why: bi('Đảm bảo độ sẵn sàng tầng tiếp nhận.', 'Eliminates single-LB SPOF.'),
        },
        {
          id: 'notifApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 16,
          opsPerSec: 3400,
          baseMs: 5,
          label: bi('Ingest API ×16', 'Ingest API ×16'),
          what: bi('Kiểm tra trùng khóa (SET NX), lọc Opt-out và phân luồng theo priority.', 'Validates dedup keys, enforces opt-outs, and routes by priority.'),
          how: bi('Đẩy tin khẩn vào OTP Queue (12%) và tin thường vào Bulk Queue (88%).', 'Splits traffic: 12% to Critical OTP Queue, 88% to Bulk Queue.'),
          why: bi('Ngăn luồng chiến dịch chạm vào tài nguyên của luồng xác thực.', 'Enforces strict bulkhead isolation at ingestion.'),
        },
        {
          id: 'prefCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.75,
          replicas: 2,
          opsPerSec: 32000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.94 },
          label: bi('Dedup & Pref', 'Dedup & Pref'),
          what: bi('Cụm Redis lưu khóa notification_id đã xử lý và hồ sơ thiết bị.', 'Redis cluster storing 24h dedup keys, templates, and device tokens.'),
          how: bi('Loại bỏ ngay các bản tin gửi lặp do dịch vụ gọi retry.', 'Short-circuits duplicate retry requests in 0.5 ms.'),
          why: bi('Không bao giờ tính phí 2 tin SMS cho cùng một giao dịch.', 'Prevents double-sending paid SMS messages.'),
        },
        {
          id: 'logStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: -0.75,
          replicas: 3,
          opsPerSec: 4500,
          baseMs: 3,
          params: { shards: 3 },
          label: bi('Status Store ×3', 'Status Store ×3'),
          what: bi('Kho NoSQL 3 phân vùng lưu lịch sử phát tin và trạng thái webhook.', '3-shard NoSQL store tracking notification lifecycle states.'),
          how: bi('Ghi nhận trạng thái PENDING → SENT → DELIVERED.', 'Records delivery receipts for support and auditing.'),
          why: bi('Mở rộng ngang cho hàng chục triệu bản ghi mỗi ngày.', 'Scales horizontally for 60M+ daily logs.'),
        },
        {
          id: 'otpQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'green',
          icon: 'zap',
          col: 3,
          row: 0,
          replicas: 1,
          opsPerSec: 40000,
          baseMs: 0.8,
          params: { dlq: true, maxDepth: 100000 },
          label: bi('Critical OTP Q', 'Critical OTP Q'),
          what: bi('Hàng đợi ưu tiên cao dành riêng cho OTP và cảnh báo bảo mật.', 'High-priority queue dedicated exclusively to OTPs and security alerts.'),
          how: bi('Luôn trống hàng đợi nhờ nhóm Worker riêng dư công suất.', 'Remains near-zero depth backed by over-provisioned fast workers.'),
          why: bi('Cam kết độ trễ chuyển phát dưới 1–3 giây mọi thời điểm.', 'Guarantees <3s OTP delivery even during massive sales.'),
        },
        {
          id: 'otpWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'green',
          icon: 'shield',
          col: 4,
          row: 0,
          replicas: 8,
          opsPerSec: 600,
          baseMs: 16,
          label: bi('OTP Worker ×8', 'OTP Worker ×8'),
          what: bi('Nhóm Worker tốc độ cao nối tới cổng SMS/Push hạng nhất.', '8 dedicated workers connected to primary low-latency carriers.'),
          how: bi('Năng lực 4.800 OTP/giây cho tải thực ~1.440 OTP/giây.', '4,800 OTP/s capacity serving ~1,440 OTP/s load.'),
          why: bi('Dư >3× năng lực để không bao giờ xếp hàng.', 'Maintains >3x headroom so OTPs never wait.'),
        },
        {
          id: 'bulkQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3,
          row: 0.75,
          replicas: 1,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 500000 },
          label: bi('Bulk Queue', 'Bulk Queue'),
          what: bi('Hàng đợi dung lượng lớn hấp thụ các chiến dịch hàng chục triệu bản tin.', 'High-capacity queue absorbing multi-million campaign bursts.'),
          how: bi('Xả đều theo tốc độ cho phép của các nhà cung cấp Email/Push.', 'Drains smoothly according to downstream vendor rate quotas.'),
          why: bi('Bảo vệ nhà cung cấp ngoài khỏi bị ngập kết nối.', 'Shapes bursty campaign traffic into steady vendor streams.'),
        },
        {
          id: 'bulkWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4,
          row: 0.75,
          replicas: 18,
          opsPerSec: 900,
          baseMs: 20,
          label: bi('Bulk Worker ×18', 'Bulk Worker ×18'),
          what: bi('18 Worker xử lý lô gửi Push/Email tiếp thị có Retry + DLQ.', '18 bulk workers dispatching batched Push/Email with DLQ.'),
          how: bi('Tổng năng lực ~16.200 tin/giây (cho ~10.560 tin Bulk/giây ở mốc 15K).', 'Processes ~16,200 bulk messages/s.'),
          why: bi('Chạm trần trước tiên khi chiến dịch vọt 5× lên 75.000 req/s.', 'Reaches saturation first under a 5x unthrottled blast.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'notifApi' },
        { id: 'api-pref', from: 'notifApi', to: 'prefCache', carries: 'r' },
        { id: 'pref-store', from: 'prefCache', to: 'logStore', carries: 'r' },
        { id: 'api-otpq', from: 'notifApi', to: 'otpQueue', mode: 'async', carries: 'w', fraction: 0.12, label: bi('OTP 12%', 'OTP 12%') },
        { id: 'otpq-w', from: 'otpQueue', to: 'otpWorker', mode: 'pull' },
        { id: 'api-bulkq', from: 'notifApi', to: 'bulkQueue', mode: 'async', carries: 'w', fraction: 0.88, label: bi('Bulk 88%', 'Bulk 88%') },
        { id: 'bulkq-w', from: 'bulkQueue', to: 'bulkWorker', mode: 'pull' },
      ],
      routes: {
        notifApi: 'all-parallel',
      },
      zones: [
        { id: 'z-prio', nodeIds: ['otpQueue', 'otpWorker'], label: bi('CRITICAL OTP LANE', 'CRITICAL OTP LANE'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v3 · Tách làn OTP & Bulk', 'v3 · Priority Lane Isolation'),
        lines: [
          { text: bi('OTP tách riêng: không bao giờ bị Bulk chặn', 'Isolated OTP lane: zero Bulk blocking'), tone: 'good' },
          { text: bi('Dedup 24h chặn gửi trùng SMS', '24h Dedup prevents duplicate SMS'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ntf',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Tenant Rate Guard + Multi-AZ Channel Pools + Multi-Vendor Failover', 'Tenant Rate Guard + Multi-AZ Channel Pools + Vendor Failover'),
      eraTag: bi('50.000+ req/s · Điều phối đa nhà mạng', '50,000+ req/s · Multi-Vendor Production'),
      targetRps: 50000,
      readRatio: 0.2,
      seed: 7344,
      summary: bi(
        'Bổ sung bộ kiểm soát tốc độ theo từng dịch vụ nội bộ (tránh 1 script bắn nhầm làm tràn hệ thống), mở rộng Multi-AZ và tích hợp bộ định tuyến đa nhà cung cấp có Circuit Breaker tự chuyển sang nhà mạng dự phòng.',
        'Adds per-caller tenant rate limiting at ingestion, scales Multi-AZ channel pools, and routes outbound dispatches through multi-vendor Circuit Breakers with automatic carrier failover.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 vận hành bền vững trên 85.000 thông báo/giây, tự cô lập nhà mạng lỗi trong vài giây mà vẫn giữ làn OTP thông suốt.',
        'Sustains >85,000 notifications/s while failing over degraded carriers automatically within seconds.'
      ),
      whatChanged: [
        diff('+', 'Đặt Ingest Rate Limiter kiểm soát hạn ngạch theo dịch vụ gọi (chống bão nhầm chiến dịch)', 'Add per-caller Ingest Rate Limiter preventing runaway campaign scripts'),
        diff('+', 'Tích hợp Multi-Vendor Router + Circuit Breaker tự động chuyển đổi Twilio ↔ Vonage / SES ↔ SendGrid', 'Add Multi-Vendor Circuit Breaker failing over across primary/secondary carriers'),
        diff('~', 'Mở rộng Multi-AZ lên 28 Ingest APIs, 18 OTP Workers, 52 Bulk Workers và 6 phân vùng Status Store', 'Scale to 28 Ingest APIs, 18 OTP Workers, 52 Bulk Workers, and 6 Status Shards'),
      ],
      tradeOffs: [
        trade(
          'Duy trì hợp đồng tích hợp song song ≥ 2 nhà cung cấp cho mỗi kênh SMS/Email',
          'Integrate ≥2 active providers per SMS/Email channel behind Circuit Breakers',
          'Độ sẵn sàng gửi OTP tiến sát 99,99% ngay cả khi một nhà mạng khu vực gặp sự cố',
          'Pushes OTP delivery availability toward 99.99% during regional carrier outages',
          'Cần chuẩn hoá định dạng webhook báo nhận khác nhau giữa các nhà cung cấp',
          'Requires normalizing heterogeneous delivery-receipt webhooks across vendors'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'crowd',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('50K Events/s', '50K Events/s'),
          what: bi('50.000 sự kiện thông báo mỗi giây trong dịp khuyến mãi lớn.', '50,000 notifications/s during peak mega-sale events.'),
          how: bi('Phát đồng thời từ hàng chục dịch vụ vi mô nội bộ.', 'Emitted concurrently across dozens of internal services.'),
          why: bi('Đòi hỏi cả bảo vệ đầu vào lẫn phân luồng đầu ra.', 'Demands both ingress quota governance and priority egress.'),
        },
        {
          id: 'limiter',
          kind: 'rate-limiter',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 85000,
          baseMs: 0.3,
          params: { ratePerSec: 90000, burst: 18000 },
          label: bi('Caller Quota', 'Caller Quota'),
          what: bi('Kiểm soát hạn ngạch phát tin của từng dịch vụ tiếp thị nội bộ.', 'Per-service quota guard preventing runaway marketing loops.'),
          how: bi('Ưu tiên bảo toàn băng thông cho nhóm dịch vụ giao dịch cốt lõi.', 'Caps non-critical campaign floods while admitting transactional calls.'),
          why: bi('Ngăn lỗi cấu hình ở 1 team làm ngập toàn bộ hàng đợi.', 'Stops internal misconfigurations from exhausting shared queues.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 5,
          opsPerSec: 20000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB ×5', 'Multi-AZ LB ×5'),
          what: bi('5 bộ cân bằng tải phân phối trên 3 AZ.', '5-node Multi-AZ Load Balancer cluster.'),
          how: bi('Thông lượng định tuyến 100.000 req/s.', 'Routes up to 100,000 req/s.'),
          why: bi('Không điểm lỗi đơn ở cửa tiếp nhận.', 'Zero single points of failure.'),
        },
        {
          id: 'notifApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 30,
          opsPerSec: 2900,
          baseMs: 4.5,
          label: bi('Ingest API ×30', 'Ingest API ×30'),
          what: bi('Cụm 30 máy chủ kiểm tra chống trùng, lọc Quiet Hours và phân làn.', '30 stateless ingest servers enforcing dedup, quiet hours, and priority routing.'),
          how: bi('Năng lực tiếp nhận ~87.000 sự kiện/giây.', 'Provides ~87,000 events/s ingestion capacity.'),
          why: bi('Trả 202 Accepted ổn định dưới 15 ms.', 'Maintains sub-15ms ingestion latency.'),
        },
        {
          id: 'prefCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4,
          row: -0.75,
          replicas: 4,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.96 },
          label: bi('Dedup Cluster', 'Dedup Cluster'),
          what: bi('Cụm Redis Multi-AZ lưu khóa Idempotency, mẫu tin và token thiết bị.', 'Multi-AZ Redis cluster storing dedup keys, templates, and tokens.'),
          how: bi('Đạt 96% Hit Ratio với thời gian đáp ứng nửa mili-giây.', '96% hit ratio at 0.5 ms latency.'),
          why: bi('Chịu tải hàng trăm nghìn thao tác kiểm tra mỗi giây.', 'Handles hundreds of thousands of atomic checks/s.'),
        },
        {
          id: 'logStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5,
          row: -0.75,
          replicas: 6,
          opsPerSec: 5500,
          baseMs: 3,
          params: { shards: 6 },
          label: bi('Audit Store ×6', 'Audit Store ×6'),
          what: bi('6 phân vùng NoSQL lưu trạng thái phân phát và đối soát webhook.', '6-shard NoSQL delivery log and webhook reconciliation store.'),
          how: bi('Tự động hết hạn bản ghi cũ theo chính sách vòng đời (TTL 90 ngày).', 'Applies 90-day TTL lifecycle policies to bound storage cost.'),
          why: bi('Phục vụ tra cứu khiếu nại khách hàng tức thời.', 'Supports instant customer-support delivery lookups.'),
        },
        {
          id: 'otpQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'green',
          icon: 'zap',
          col: 4,
          row: 0,
          replicas: 2,
          opsPerSec: 50000,
          baseMs: 0.8,
          params: { dlq: true, maxDepth: 200000 },
          label: bi('Critical OTP Q', 'Critical OTP Q'),
          what: bi('Làn hàng đợi ưu tiên tuyệt đối nhân bản đa vùng.', 'Replicated critical-priority queue for OTPs and payment alerts.'),
          how: bi('Tiếp nhận ~4.800 tin khẩn/giây ở đỉnh 50K.', 'Carries ~4,800 urgent notifications/s at 50K peak.'),
          why: bi('Cách ly hoàn toàn khỏi áp lực chiến dịch.', 'Zero interference from marketing traffic.'),
        },
        {
          id: 'otpWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'green',
          icon: 'shield',
          col: 5,
          row: 0,
          replicas: 18,
          opsPerSec: 750,
          baseMs: 14,
          label: bi('Failover OTP ×18', 'Failover OTP ×18'),
          what: bi('18 Worker tích hợp Circuit Breaker chuyển đổi tức thời giữa nhà mạng chính và phụ.', '18 OTP workers with multi-carrier Circuit Breakers (Twilio ↔ Vonage).'),
          how: bi('Nếu nhà mạng A tăng lỗi quá ngưỡng, tự động lái lưu lượng sang nhà mạng B.', 'Automatically trips to backup SMS carrier when primary error rate rises.'),
          why: bi('Đảm bảo người dùng luôn nhận được mã đăng nhập dưới 2 giây.', 'Keeps login OTP delivery reliable even during carrier brownouts.'),
        },
        {
          id: 'bulkQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4,
          row: 0.75,
          replicas: 2,
          opsPerSec: 60000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 1000000 },
          label: bi('Sharded Bulk Q', 'Sharded Bulk Q'),
          what: bi('Cụm hàng đợi phân vùng kèm Dead-Letter Queue cho thông báo số lượng lớn.', 'Partitioned bulk campaign queue with DLQ.'),
          how: bi('Đệm tới hàng triệu bản tin để xả mượt theo quota từng kênh.', 'Buffers millions of campaign items for rate-paced draining.'),
          why: bi('Không đánh rớt bản tin khi chiến dịch bùng nổ.', 'Absorbs massive campaign spikes without drops.'),
        },
        {
          id: 'bulkWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 5,
          row: 0.75,
          replicas: 54,
          opsPerSec: 1200,
          baseMs: 16,
          label: bi('Bulk Fleet ×54', 'Bulk Fleet ×54'),
          what: bi('Đội 54 Worker tự động co giãn theo chiều sâu hàng đợi (Queue Depth Autoscaling).', '54 autoscaled channel workers batching FCM/APNs/SES dispatches.'),
          how: bi('Tổng thông lượng xả >64.000 thông báo/giây.', 'Sustains >64,000 bulk dispatches/s.'),
          why: bi('Xử lý gọn các chiến dịch lớn mà vẫn tuân thủ giới hạn nhà cung cấp.', 'Clears mega-campaigns rapidly within vendor rate envelopes.'),
        },
      ],
      links: [
        { id: 'c-lim', from: 'client', to: 'limiter' },
        { id: 'lim-lb', from: 'limiter', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'notifApi' },
        { id: 'api-pref', from: 'notifApi', to: 'prefCache', carries: 'r' },
        { id: 'pref-store', from: 'prefCache', to: 'logStore', carries: 'r' },
        { id: 'api-otpq', from: 'notifApi', to: 'otpQueue', mode: 'async', carries: 'w', fraction: 0.12 },
        { id: 'otpq-w', from: 'otpQueue', to: 'otpWorker', mode: 'pull' },
        { id: 'api-bulkq', from: 'notifApi', to: 'bulkQueue', mode: 'async', carries: 'w', fraction: 0.88 },
        { id: 'bulkq-w', from: 'bulkQueue', to: 'bulkWorker', mode: 'pull' },
      ],
      routes: {
        notifApi: 'all-parallel',
      },
      zones: [
        { id: 'z-otp4', nodeIds: ['otpQueue', 'otpWorker'], label: bi('MULTI-CARRIER OTP FAILOVER', 'MULTI-CARRIER OTP FAILOVER'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v4 · Multi-Vendor + Quota Guard', 'v4 · Multi-Vendor + Quota Guard'),
        lines: [
          { text: bi('Circuit Breaker tự chuyển nhà mạng lỗi', 'Auto carrier failover via Breaker'), tone: 'good' },
          { text: bi('Chịu tải > 85.000 sự kiện/s · OTP < 2s', 'Sustains > 85K/s · OTP p99 < 2s'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 6. RIDE-HAILING & GEO-SPATIAL INDEX (Uber/Grab) — Linked Module: S7-04
 * ============================================================================ */
const CASE_RIDE_HAILING: SdDesignCase = {
  id: 'ride-hailing',
  order: 6,
  linkedModuleId: 'S7-04',
  domainTag: bi('Geohash / H3 · High-Write Location · Dispatch Lock', 'Geohash / H3 · High-Write Location · Dispatch Lock'),
  difficulty: 'Advanced',
  title: bi('Gọi xe & Định vị không gian (Uber/Grab Geo Index)', 'Ride-Hailing & Geo-Spatial Index (Uber/Grab)'),
  subtitle: bi(
    'Xử lý hàng chục nghìn lượt cập nhật toạ độ GPS mỗi giây trong chỉ mục lưới không gian RAM (Geohash/H3) và khoá độc quyền tài xế khi ghép chuyến.',
    'Ingesting tens of thousands of real-time driver GPS pings per second into sharded H3/Geohash in-memory indexes with exclusive dispatch locking.'
  ),
  problemBrief: bi(
    'Thiết kế hệ thống định vị và ghép xe thời gian thực: tài xế liên tục gửi vị trí GPS mới nhất, còn hành khách tìm các xe trống trong bán kính lân cận và đặt chuyến không bị trùng tài xế.',
    'Design a real-time location indexing and ride-dispatch backend where active drivers stream GPS pings and riders query nearby available cars and match atomically.'
  ),
  clarifyingQuestions: [
    {
      id: 'geo-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Có bao nhiêu tài xế trực tuyến đồng thời và mỗi thiết bị tài xế gửi cập nhật vị trí mấy giây một lần?',
        'How many drivers are online concurrently and how often does each driver app send a GPS location ping?'
      ),
      answer: bi(
        'Khoảng 200.000–1 triệu tài xế hoạt động đồng thời gửi GPS mỗi 4 giây ⇒ tạo ra 35.000–250.000 lượt ghi vị trí/giây, cùng 15.000+ lượt tìm xe quanh điểm đón.',
        '200K–1M concurrent active drivers pinging every 4 seconds ⇒ 35,000+ location writes/s alongside 15,000+ nearby search & match requests/s.'
      ),
      rationale: bi(
        'Lưu lượng ghi liên tục cực cao trên dữ liệu toạ độ biến thiên mỗi 4 giây cho thấy vị trí hiện tại phải nằm trong RAM thay vì cập nhật B-tree trên đĩa cứng.',
        'Continuous high-frequency overwrites mean live driver coordinates belong in ephemeral sharded RAM rather than disk B-trees.'
      ),
    },
    {
      id: 'geo-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Tỷ lệ giữa lượt cập nhật vị trí tài xế (Write) và lượt tìm kiếm xe lân cận / đặt chuyến (Read & Match) là bao nhiêu?',
        'What is the ratio between driver location updates (Write) and rider nearby queries / dispatch matches (Read)?'
      ),
      answer: bi(
        'Hệ thống thiên nặng về ghi (~70% là bản tin cập nhật vị trí 64 byte của tài xế, ~30% là truy vấn bán kính lân cận và yêu cầu ghép cuốc).',
        'Write-heavy (~70% lightweight 64-byte GPS location pings, ~30% radius queries and trip dispatch operations).'
      ),
      rationale: bi(
        'Ngược hẳn với URL Shortener hay News Feed: ở đây không thể dựa vào Read Cache dài hạn mà phải phân mảnh đường ghi theo ô địa lý.',
        'Unlike read-heavy apps, long-TTL read caching cannot save us—we must partition write ingestion across spatial cells.'
      ),
    },
    {
      id: 'geo-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Độ trễ truy vấn danh sách xe gần nhất (p99) và mức độ nhất quán cần thiết ở bước gán một tài xế cho hành khách?',
        'What is the p99 SLA for nearby-driver search, and what consistency level is required when assigning a driver?'
      ),
      answer: bi(
        'Tìm xe lân cận p99 < 80 ms (chấp nhận toạ độ trễ 2–4 giây); riêng bước mời/khoá tài xế nhận cuốc bắt buộc nhất quán mạnh (khoá độc quyền có TTL 15 giây) để 2 khách không nhận chung 1 xe.',
        'Nearby search p99 < 80 ms (2–4s location staleness is fine), whereas driver offer/assignment requires strong exclusive locking (15s TTL lease) so two riders never claim the same car.'
      ),
      rationale: bi(
        'Tách bạch hai mô hình nhất quán: AP tốc độ cao cho bảng vị trí GPS, và CP có khoá phân tán cho bước Dispatch Coordinator.',
        'Cleanly separates AP high-speed spatial indexing from strongly consistent distributed locking during trip dispatch.'
      ),
    },
    {
      id: 'geo-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Xử lý thế nào khi hàng nghìn xe và hành khách dồn vào một điểm nóng hẹp như sân bay hoặc sân vận động vừa tan trận (Hot Cell)?',
        'How do we handle spatial hotspots like airports or stadium exits where thousands of drivers cluster in one cell?'
      ),
      answer: bi(
        'Phân mảnh theo ô lục giác H3 / Geohash kết hợp chia nhỏ ô động (Sub-cell Sharding / tiền tố ngẫu nhiên cho ô nóng) và gom lô lịch sử di chuyển qua luồng sự kiện thay vì ghi lẻ xuống DB chuyến đi.',
        'Shard by Geohash/H3 regions with adaptive sub-cell splitting for hot zones (airports), and batch-stream historical breadcrumbs asynchronously.'
      ),
      rationale: bi(
        'Ngăn một ô sân bay làm quá tải đơn độc 1 phân vùng RAM trong khi các ô ngoại ô đang rảnh.',
        'Prevents dense urban/airport cells from overloading a single spatial shard.'
      ),
    },
    {
      id: 'geo-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Hình chiếc xe trên bản đồ ứng dụng khách nên dùng màu trắng bạc hay màu đen bóng?',
        'Should the 2D car sprite on the rider map UI be silver or glossy black?'
      ),
      answer: bi(
        'Tài nguyên đồ hoạ tĩnh trên ứng dụng di động.',
        'Client-side graphic asset choice.'
      ),
      rationale: bi(
        'Không liên quan đến cấu trúc dữ liệu không gian (Quadtree / Geohash / H3) hay cơ chế khoá ghép chuyến.',
        'Unrelated to spatial indexing structures or atomic dispatch locking.'
      ),
    },
    {
      id: 'geo-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên tính khoảng cách đường chim bay bằng công thức elip địa cầu độ chính xác cấp milimét cho bước lọc sơ bộ không?',
        'Should candidate pre-filtering compute millimeter-precision ellipsoidal geodesics across all active drivers?'
      ),
      answer: bi(
        'Không: bước lọc đầu chỉ cần lấy các tài xế trong ô H3 hiện tại và 6 ô kề bên (k-ring=1) bằng phép tra bảng O(1).',
        'No: pre-filtering simply fetches drivers in the target H3 cell plus its 6 immediate neighbor cells in O(1).'
      ),
      rationale: bi(
        'Chỉ sau khi rút gọn còn 10–20 ứng viên gần nhất mới gọi dịch vụ tính thời gian di chuyển thực tế theo mạng lưới đường giao thông (ETA).',
        'Exact road-network ETA is computed only for the top 10–20 spatial candidates, never across all drivers.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('500K+ tài xế trực tuyến · 10M chuyến/ngày', '500K+ active drivers · 10M trips/day'),
    readRps: bi('16.500 đỉnh tìm xe & ghép cuốc/s', '16,500 peak nearby search & match/s'),
    writeRps: bi('38.500 đỉnh cập nhật vị trí GPS/s', '38,500 peak driver GPS pings/s'),
    readWriteRatio: bi('30 : 70 (Write-Heavy GPS Pings)', '30 : 70 (Write-Heavy GPS Pings)'),
    storagePerDay: bi('~2 GB RAM vị trí sống · ~400 GB log quỹ đạo/ngày', '~2 GB live Geo RAM · ~400 GB trajectory archive/day'),
    memoryOrBandwidth: bi('Truy vấn k-ring H3 (1 ô + 6 ô lân cận) trong RAM', 'In-RAM H3 k-ring lookup (center + 6 neighbors)'),
    slos: [
      bi('Nearby Query p99 < 80 ms', 'Nearby Query p99 < 80 ms'),
      bi('Exclusive Driver Lock (0 gán trùng)', 'Exclusive Driver Lock (zero double-match)'),
      bi('Tự hết hạn xe mất sóng sau 15s TTL', 'Auto-evict stale drivers after 15s TTL'),
    ],
    snakeSummary: {
      scope: bi('Nhận ping GPS 4s/lần, truy vấn xe trống theo bán kính, khoá tài xế khi ghép cuốc.', 'Ingest 4s GPS pings, query nearby available cars, lock driver during dispatch.'),
      numbers: bi('55K tổng sự kiện/s (70% ghi toạ độ), ~64B/ping, toàn bộ chỉ mục sống ~2 GB RAM.', '55K total ops/s (70% location writes), ~64B/ping, ~2 GB live spatial RAM.'),
      api: bi('PUT /v1/locations {lat,lng,status} · POST /v1/rides/match {pickup,dropoff,idempotencyKey}.', 'PUT /v1/locations {lat,lng,status} · POST /v1/rides/match {pickup,dropoff,idempotencyKey}.'),
      keyComponents: bi('Location Gateway, Sharded H3 Geo Store, Dispatch Coordinator, Trip SQL, Trajectory Stream.', 'Location Gateway, Sharded H3 Geo Store, Dispatch Coordinator, Trip SQL, Trajectory Stream.'),
      elaborate: bi('Chia nhỏ ô nóng (sân bay), truy vấn song song các ô chạm biên bán kính, ghi lô quỹ đạo chuyến đi.', 'Sub-split hot airport cells, query boundary neighbor cells in parallel, batch-flush trip breadcrumbs.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'geo',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Cập nhật lat/lng trực tiếp vào SQL + Quét khung chữ nhật', 'SQL UPDATE lat/lng + Bounding-Box Scan'),
      eraTag: bi('100 req/s · Khuếch đại ghi B-tree', '100 req/s · SQL Write Amplification'),
      targetRps: 100,
      readRatio: 0.3,
      seed: 7351,
      summary: bi(
        'Mỗi lần xe nhích bánh lại chạy UPDATE drivers SET lat = ..., lng = ... trên bảng SQL và tìm xe gần bằng WHERE lat BETWEEN ... AND lng BETWEEN ...',
        'Every 4-second GPS ping runs an inline SQL UPDATE on drivers(lat, lng), while riders scan a lat/lng bounding box.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (500 req/s với 350 lệnh UPDATE toạ độ/giây), việc cập nhật liên tục chỉ mục B-tree 2 cột trên đĩa làm SQL (μ = 260 req/s) nghẽn I/O và khoá trang liên tục.',
        'At 5x load (500 req/s with 350 coordinate UPDATEs/s), constant B-tree index page splits and WAL flushes saturate SQL (μ = 260 req/s).'
      ),
      whatChanged: [
        diff('+', '1 Geo Monolith nhận cả gói tin GPS lẫn yêu cầu đặt xe', 'Single Geo Monolith handling GPS pings and ride requests'),
        diff('+', '1 SQL Database lưu chung vị trí tức thời và đơn chuyến đi', 'Single SQL storing both ephemeral coordinates and durable trips'),
      ],
      tradeOffs: [
        trade(
          'Ghi đè vị trí di chuyển mỗi 4 giây vào bảng SQL có chỉ mục (lat, lng)',
          'Overwrite moving coordinates every 4s in an indexed SQL table',
          'Truy vấn bằng ngôn ngữ SQL quen thuộc, không cần tách hai kho dữ liệu',
          'Uses familiar SQL range queries with no separate spatial cache',
          'B-tree chỉ lọc hiệu quả cột đầu tiên (lat), cột thứ hai (lng) vẫn phải quét rộng kèm chi phí ghi đĩa nặng',
          'Compound (lat, lng) B-tree scans wide strips and suffers heavy disk write amplification'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Tài xế & Khách', 'Drivers & Riders'),
          what: bi('70% gói tin cập nhật vị trí tài xế và 30% tìm/đặt xe.', '70% driver GPS pings and 30% rider search/match requests.'),
          how: bi('Gửi liên tục qua mạng di động 4G/5G.', 'Streams updates continuously over mobile networks.'),
          why: bi('Tạo tải ghi cao liên tục suốt ngày.', 'Produces sustained write-heavy traffic.'),
        },
        {
          id: 'locSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 650,
          baseMs: 8,
          label: bi('Geo App', 'Geo App'),
          what: bi('Máy chủ đơn xử lý cả cập nhật GPS và ghép chuyến.', 'Single server handling location updates and trip matching.'),
          how: bi('Chuyển toàn bộ đọc/ghi xuống SQL.', 'Pushes every GPS ping and bounding-box query into SQL.'),
          why: bi('Dễ dựng bản thử nghiệm cho một khu vực nhỏ.', 'Simple prototype for a few dozen test vehicles.'),
        },
        {
          id: 'tripSql',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 260,
          baseMs: 10,
          label: bi('Drivers SQL', 'Drivers SQL'),
          what: bi('Bảng SQL chịu cập nhật toạ độ liên tục và quét bán kính.', 'Relational DB enduring constant coordinate UPDATEs and range scans.'),
          how: bi('Mỗi lần xe đổi vị trí phải xoá/chèn lại khoá trong B-tree.', 'Re-indexes B-tree entries on every 4-second movement.'),
          why: bi('Quá tải nhanh chóng khi số xe vượt vài trăm chiếc.', 'Saturates rapidly once active vehicles exceed a few hundred.'),
        },
      ],
      links: [
        { id: 'c-app', from: 'client', to: 'locSvc' },
        { id: 'app-sql', from: 'locSvc', to: 'tripSql', label: bi('70% UPDATE', '70% UPDATE') },
      ],
      noteCard: {
        title: bi('v1 · SQL lat/lng UPDATE', 'v1 · SQL lat/lng UPDATE'),
        lines: [
          { text: bi('Ghi đè B-tree liên tục mỗi 4 giây', 'Constant 4s B-tree index churn'), tone: 'amber' },
          { text: bi('Nghẽn cứng đĩa SQL ở ~260 req/s', 'SQL disk saturates at ~260 req/s'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'geo',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Tách chỉ mục Geohash vào 1 Redis (GEOADD) + Trip SQL', 'Separated Single Redis GEOADD + Durable Trip SQL'),
      eraTag: bi('2.000 req/s · Đưa vị trí sống lên RAM', '2,000 req/s · Ephemeral In-RAM Geo'),
      targetRps: 2000,
      readRatio: 0.3,
      seed: 7352,
      summary: bi(
        'Tách hoàn toàn dữ liệu vị trí tạm thời ra khỏi SQL: mọi gói GPS ghi thẳng vào bộ nhớ RAM bằng Redis GEOADD (Sorted Set theo Geohash 52-bit), còn SQL chỉ lưu đơn chuyến đi bền vững.',
        'Decouples ephemeral GPS coordinates from SQL: driver pings write solely to in-memory Redis GEOADD (52-bit Geohash ZSET), leaving SQL strictly for durable trip state.'
      ),
      whyNextStage: bi(
        'Khi mở rộng lên nhiều thành phố (5× = 10.000 req/s), một node Redis duy nhất chứa toàn bộ bản đồ bị nghẽn CPU đơn luồng (~3.800 ops/s) cùng với tầng Location Service.',
        'At 5x multi-city load (10,000 req/s), a single global Redis ZSET hits single-core saturation (~3,800 ops/s) alongside the 3-node Location Service.'
      ),
      whatChanged: [
        diff('+', 'Thêm Geo Redis lưu toạ độ tức thời bằng cấu trúc Geohash Sorted Set trong RAM', 'Add in-memory Geo Redis indexing live positions via Geohash ZSET'),
        diff('~', 'SQL chỉ còn lưu giao dịch tạo/hoàn thành chuyến đi, cắt bỏ 100% lệnh UPDATE GPS khỏi đĩa', 'Restrict SQL strictly to durable trip bookings—zero GPS disk writes'),
        diff('+', 'Thêm Load Balancer và mở rộng Location Service (×3)', 'Add Load Balancer and scale Location Service (×3)'),
      ],
      tradeOffs: [
        trade(
          'Lưu vị trí hiện tại thuần trong RAM (không ghi WAL từng ping xuống đĩa)',
          'Keep live driver coordinates purely in RAM without per-ping disk fsync',
          'Tăng tốc độ cập nhật vị trí gấp ~15× và hạ độ trễ tìm bán kính xuống ~1–2 ms',
          '15x higher location write speed and ~1–2 ms radius lookups',
          'Nếu máy Redis khởi động lại, bản đồ tự động nạp đầy lại sau đúng 4 giây từ đợt ping kế tiếp của tài xế!',
          'On Redis restart, the map self-heals within 4 seconds from the next driver ping wave'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Tài xế & Khách', 'Drivers & Riders'),
          what: bi('2.000 sự kiện định vị và tìm xe mỗi giây.', '2,000 location pings and nearby searches/s.'),
          how: bi('Tài xế gửi toạ độ nhẹ; hành khách truy vấn bán kính 3 km.', 'Drivers send 64B pings; riders query 3 km radius.'),
          why: bi('Kiểm chứng lợi ích khi tách dữ liệu tạm thời khỏi dữ liệu giao dịch.', 'Demonstrates separating ephemeral telemetry from transactional state.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải điều phối vào cụm Location Service.', 'Load Balancer routing to Location Service.'),
          how: bi('Chia đều tải đọc/ghi cho 3 máy ứng dụng.', 'Balances requests across 3 stateless nodes.'),
          why: bi('Cho phép mở rộng tầng tiếp nhận.', 'Removes single-server bottleneck.'),
        },
        {
          id: 'locSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 4,
          opsPerSec: 2900,
          baseMs: 5,
          label: bi('Location Svc ×4', 'Location Svc ×4'),
          what: bi('Dịch vụ xử lý cập nhật vị trí và truy vấn lân cận.', 'Service handling GPS ingestion and radius queries.'),
          how: bi('Cập nhật và tra cứu toạ độ trên Geo Redis; khi khách chốt xe mới ghi Trip SQL.', 'Routes spatial ops to Geo Redis and bookings to Trip SQL.'),
          why: bi('Giữ SQL hoàn toàn nhẹ nhàng.', 'Protects Trip SQL from GPS churn.'),
        },
        {
          id: 'geoStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'yellow',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 3800,
          baseMs: 1.2,
          params: { shards: 1 },
          label: bi('Geo Redis ×1', 'Geo Redis ×1'),
          what: bi('Một node Redis giữ toàn bộ ZSET vị trí tài xế theo Geohash.', 'Single Redis node holding global Geohash ZSET.'),
          how: bi('Xử lý O(log N) cho mỗi lần GEOADD và GEORADIUS.', 'Executes O(log N) ZSET updates and range scans in RAM.'),
          why: bi('Nhanh nhưng bị giới hạn bởi 1 nhân CPU khi vượt ~3.800 ops/s.', 'Fast, but single-node ZSET saturates around ~3,800 ops/s.'),
        },
        {
          id: 'tripSql',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 3.5,
          row: 0.6,
          replicas: 1,
          opsPerSec: 1200,
          baseMs: 6,
          label: bi('Trips SQL', 'Trips SQL'),
          what: bi('Cơ sở dữ liệu ACID lưu trạng thái chuyến đi, giá cước và hoá đơn.', 'ACID relational database storing trip state and fares.'),
          how: bi('Chỉ nhận các thao tác tạo/cập nhật trạng thái cuốc xe thực tế.', 'Receives only actual trip lifecycle transactions.'),
          why: bi('Đảm bảo tính toàn vẹn cho dữ liệu thanh toán chuyến xe.', 'Preserves transactional integrity for ride billing.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-svc', from: 'lb', to: 'locSvc' },
        { id: 'svc-geo', from: 'locSvc', to: 'geoStore', label: bi('GEOADD /Search', 'GEOADD /Search') },
        { id: 'svc-sql', from: 'locSvc', to: 'tripSql', carries: 'r', fraction: 0.35, label: bi('Trip Booking', 'Trip Booking') },
      ],
      routes: {
        locSvc: 'all-parallel',
      },
      noteCard: {
        title: bi('v2 · Tách GPS lên RAM', 'v2 · In-RAM Geohash ZSET'),
        lines: [
          { text: bi('0% lệnh ping GPS chạm đĩa SQL', '0% of GPS pings hit SQL disk'), tone: 'good' },
          { text: bi('1 node Geo Redis nghẽn ở ~3.800 ops/s', 'Single Geo Redis caps at ~3,800 ops/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'geo',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Phân mảnh theo Ô lưới H3/Geohash + Dispatch Lock + Async Archive', 'Sharded H3 Spatial Grid + Dispatch Coordinator + Archive'),
      eraTag: bi('15.000 req/s · Chia bản đồ theo vùng ô', '15,000 req/s · Spatial Cell Sharding'),
      targetRps: 15000,
      readRatio: 0.3,
      seed: 7353,
      summary: bi(
        'Chia nhỏ bản đồ thành các ô lục giác H3 phân tán trên 4 phân vùng RAM, bổ sung Dispatch Coordinator giữ khoá độc quyền 15 giây khi mời tài xế và đẩy quỹ đạo xe qua hàng đợi lưu trữ nền.',
        'Partitions spatial state across 4 H3 grid shards, adds a Dispatch Coordinator enforcing 15s exclusive driver offer locks, and streams trajectory logs asynchronously.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (75.000 req/s giờ cao điểm mưa lớn hoặc tại sân bay), mật độ xe dồn lệch vào 1 ô nóng (Hot Cell) cùng với bộ điều phối ghép chuyến đơn vùng gây nghẽn.',
        'At 5x rush-hour/airport surge (75,000 req/s), dense spatial hotspots skew single H3 shards while Location Service and Dispatch Coordinator saturate.'
      ),
      whatChanged: [
        diff('+', 'Phân mảnh chỉ mục không gian sang 4 phân vùng theo tiền tố vùng H3/Geohash', 'Partition in-memory spatial index into 4 shards by H3 region prefix'),
        diff('+', 'Thêm Dispatch Coordinator cấp khoá phân tán độc quyền (TTL 15s) chống gán 1 xe cho 2 khách', 'Add Dispatch Coordinator acquiring 15s exclusive driver locks during matching'),
        diff('+', 'Thêm Location Queue + Archiver gom lô đường đi phục vụ giải quyết khiếu nại và tính cước', 'Add async Location Queue + Archiver batching trip breadcrumbs'),
      ],
      tradeOffs: [
        trade(
          'Phân mảnh theo ô địa lý tĩnh (Static Region/Prefix Sharding)',
          'Shard spatial index by geographic cell prefix',
          'Các ô lân cận cùng thành phố thường nằm chung 1 phân vùng, đọc k-ring rất nhanh',
          'Adjacent neighborhood cells co-locate on the same shard for fast k-ring queries',
          'Mật độ giao thông trung tâm/sân bay cao gấp hàng chục lần vùng ven gây lệch tải giữa các shard',
          'Dense downtown/airport cells receive 20x more pings than suburban shards (Hot Cell skew)'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Đa đô thị', 'Multi-City Apps'),
          what: bi('15.000 sự kiện GPS và tìm/ghép chuyến mỗi giây.', '15,000 GPS updates and dispatch queries/s across cities.'),
          how: bi('Gửi toạ độ kèm mã ô lục giác H3 tính sẵn trên điện thoại.', 'Sends coordinates pre-tagged with H3 cell IDs.'),
          why: bi('Giúp máy chủ định tuyến ngay vào đúng phân vùng không gian.', 'Enables instant shard routing without server-side projection.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải tiếp nhận kết nối gRPC/HTTP2 từ ứng dụng.', 'High-availability Load Balancer pair for mobile gRPC streams.'),
          how: bi('Thông lượng định tuyến 90.000 req/s.', 'Routes up to 90,000 req/s.'),
          why: bi('Giữ kết nối ổn định khi xe di chuyển giữa các trạm thu phát.', 'Sustains mobile stream handoffs.'),
        },
        {
          id: 'locSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 16,
          opsPerSec: 3400,
          baseMs: 4.5,
          label: bi('Geo Svc ×16', 'Geo Svc ×16'),
          what: bi('Tầng dịch vụ định tuyến ô H3 và truy vấn song song các ô chạm biên.', '16 stateless nodes routing H3 updates and querying neighbor k-rings.'),
          how: bi('Năng lực ~54.400 sự kiện/giây.', 'Handles ~54,400 spatial ops/s.'),
          why: bi('Hợp nhất kết quả khi vòng tròn bán kính cắt qua ranh giới 2 phân vùng.', 'Merges boundary k-ring results across adjacent shards.'),
        },
        {
          id: 'geoStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'yellow',
          col: 3.2,
          row: -0.7,
          replicas: 4,
          opsPerSec: 5600,
          baseMs: 1.2,
          params: { shards: 4 },
          label: bi('H3 Shards ×4', 'H3 Shards ×4'),
          what: bi('4 phân vùng bộ nhớ lưu bảng băm h3_cell → danh sách tài xế đang rảnh.', '4 in-memory spatial shards mapping h3_cell → active drivers.'),
          how: bi('Tự động loại xe không ping quá 15 giây.', 'Evicts offline drivers automatically after 15s TTL.'),
          why: bi('Nâng thông lượng chỉ mục không gian lên 22.400 ops/s.', 'Scales spatial indexing to 22,400 ops/s.'),
        },
        {
          id: 'dispatchCoord',
          kind: 'coordinator',
          shape: 'block',
          tone: 'orange',
          icon: 'shield',
          col: 3.5,
          row: 0,
          replicas: 3,
          opsPerSec: 2600,
          baseMs: 6,
          label: bi('Dispatch Lock', 'Dispatch Lock'),
          what: bi('Bộ điều phối ghép cuốc giữ khoá độc quyền driver_id trong 15 giây chờ tài xế bấm nhận.', 'Dispatch service acquiring atomic 15s driver locks during ride offers.'),
          how: bi('Đảm bảo tại một thời điểm mỗi tài xế chỉ nhận duy nhất 1 lời mời chuyến.', 'Prevents two riders from claiming the same driver concurrently.'),
          why: bi('Bảo toàn tính nhất quán mạnh ở bước chuyển trạng thái chuyến xe.', 'Provides strong consistency exactly where business rules require it.'),
        },
        {
          id: 'locQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3.2,
          row: 0.7,
          replicas: 1,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 300000 },
          label: bi('Breadcrumb Q', 'Breadcrumb Q'),
          what: bi('Luồng tiếp nhận lịch sử toạ độ của các xe đang chở khách.', 'Event stream buffering active-trip GPS breadcrumbs.'),
          how: bi('Nhận bản sao không chặn từ tầng Geo Service.', 'Ingests sampled trajectory points asynchronously.'),
          why: bi('Phục vụ vẽ lại lộ trình chuyến đi và tính quãng đường thực tế.', 'Supports route replay, fare auditing, and ETA training.'),
        },
        {
          id: 'archiver',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4.3,
          row: 0.7,
          replicas: 8,
          opsPerSec: 900,
          baseMs: 15,
          label: bi('Archiver ×8', 'Archiver ×8'),
          what: bi('Worker gom chuỗi điểm GPS của từng chuyến thành một bản ghi nén.', 'Workers compressing per-trip GPS polylines into batch writes.'),
          how: bi('Giảm 50× số lần ghi xuống kho lưu trữ lịch sử.', 'Cuts durable storage write IOPS by 50x.'),
          why: bi('Tiết kiệm lớn chi phí đĩa cho hàng triệu chuyến mỗi ngày.', 'Keeps historical storage economical at scale.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-svc', from: 'lb', to: 'locSvc' },
        { id: 'svc-geo', from: 'locSvc', to: 'geoStore', label: bi('H3 Cell R/W', 'H3 Cell R/W') },
        { id: 'svc-coord', from: 'locSvc', to: 'dispatchCoord', carries: 'r', fraction: 0.5, label: bi('Lock 15s', 'Lock 15s') },
        { id: 'svc-q', from: 'locSvc', to: 'locQueue', mode: 'async', carries: 'w', fraction: 0.4 },
        { id: 'q-arch', from: 'locQueue', to: 'archiver', mode: 'pull' },
      ],
      routes: {
        locSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-geo3', nodeIds: ['geoStore', 'dispatchCoord'], label: bi('AP GEO + CP DISPATCH LOCK', 'AP GEO + CP DISPATCH LOCK'), tone: 'yellow' },
      ],
      noteCard: {
        title: bi('v3 · H3 Shards + Dispatch Lock', 'v3 · H3 Shards + Dispatch Lock'),
        lines: [
          { text: bi('AP cho vị trí · CP khoá tài xế 15s', 'AP location + CP 15s driver lock'), tone: 'good' },
          { text: bi('Ô nóng sân bay gây lệch tải khi ×5', 'Airport hot-cells skew shards at ×5'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'geo',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Adaptive Hot-Cell Splitting + Edge gRPC Gateway + Zone Dispatch', 'Adaptive Hot-Cell Sharding + Edge gRPC + Zone Dispatch'),
      eraTag: bi('55.000+ req/s · Chống nghẽn điểm nóng sân bay', '55,000+ req/s · Hot-Cell Resilient Production'),
      targetRps: 55000,
      readRatio: 0.3,
      seed: 7354,
      summary: bi(
        'Tự động chia nhỏ ô H3 có mật độ cao (sân bay, trung tâm giờ cao điểm) thành các ô con cấp độ sâu hơn rải đều trên 12 phân vùng RAM, kết hợp tầng Edge gRPC Gateway nén nhị phân và phân vùng Dispatch theo khu vực.',
        'Dynamically splits dense H3 hotspots (airports/stadiums) into finer resolution sub-cells spread across 12 spatial shards, fronted by binary gRPC Edge Gateways and zone-partitioned Dispatch.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 hấp thụ trên 100.000 sự kiện vị trí và ghép xe mỗi giây với độ trễ p99 dưới 25 ms ngay cả trong giờ cao điểm mưa bão.',
        'Sustains >100,000 spatial writes and dispatch matches/s under sub-25ms p99 even during rush-hour surges.'
      ),
      whatChanged: [
        diff('+', 'Bật Adaptive Sub-cell Splitting (H3 res 8 → res 10 + virtual buckets) xoá điểm nóng sân bay', 'Enable Adaptive H3 Sub-cell Splitting to spread airport hotspots evenly'),
        diff('+', 'Đặt Edge gRPC Gateway gom luồng kết nối di động và nén Protobuf tiết kiệm 60% băng thông', 'Add Edge gRPC Gateway terminating mobile streams with compact Protobuf'),
        diff('~', 'Mở rộng lên 12 phân vùng H3 Multi-AZ và 16 vùng Dispatch Coordinator độc lập', 'Scale to 12 Multi-AZ H3 shards and 16 zone-partitioned Dispatch Coordinators'),
      ],
      tradeOffs: [
        trade(
          'Chia nhỏ độ phân giải ô không gian động (Adaptive H3 Resolution / Sub-bucketing)',
          'Adaptive spatial cell splitting for high-density zones',
          'Phân tán đều tải ghi của hàng nghìn xe tại sân bay ra nhiều máy chủ khác nhau',
          'Spreads thousands of airport GPS writes evenly across multiple shards',
          'Khi đọc tại điểm nóng cần gộp kết quả từ các ô con (scatter-gather song song ~2 ms)',
          'Hot-zone reads scatter-gather across sub-cells in parallel (~2 ms overhead)'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('55K Geo Ops/s', '55K Geo Ops/s'),
          what: bi('Hàng trăm nghìn tài xế và hành khách tương tác thời gian thực.', 'Hundreds of thousands of active drivers and riders.'),
          how: bi('Truyền khung nhị phân gRPC/Protobuf siêu gọn.', 'Streams compact binary Protobuf frames.'),
          why: bi('Hoạt động mượt ngay cả nơi sóng di động yếu.', 'Minimizes packet loss on congested cellular towers.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 5,
          opsPerSec: 22000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB ×5', 'Multi-AZ LB ×5'),
          what: bi('Cụm 5 bộ cân bằng tải vùng đô thị.', '5-node regional Load Balancer tier.'),
          how: bi('Định tuyến 110.000 req/s tới cụm Edge gRPC.', 'Routes up to 110,000 req/s.'),
          why: bi('Chịu lỗi toàn diện cấp vùng sẵn sàng.', 'Full AZ-level fault tolerance.'),
        },
        {
          id: 'edgeGw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'globe',
          col: 2,
          row: 0,
          replicas: 22,
          opsPerSec: 5000,
          baseMs: 2,
          label: bi('gRPC Edge ×22', 'gRPC Edge ×22'),
          what: bi('Cổng biên xác thực phiên tài xế và lọc nhiễu GPS (bỏ qua điểm nhảy sai số).', '22 gRPC gateways authenticating streams and filtering noisy GPS jumps.'),
          how: bi('Loại bỏ các gói tin trùng toạ độ khi xe đang dừng đèn đỏ.', 'Suppresses redundant pings from stationary parked cars.'),
          why: bi('Tiết kiệm ~30% tải ghi vô ích cho tầng chỉ mục phía sau.', 'Saves ~30% unnecessary downstream spatial writes.'),
        },
        {
          id: 'locSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 36,
          opsPerSec: 2800,
          baseMs: 4,
          label: bi('Geo & ETA ×36', 'Geo & ETA ×36'),
          what: bi('Cụm 36 máy chủ quản lý bản đồ phân giải động và xếp hạng tài xế theo ETA đường bộ.', '36 stateless nodes executing adaptive H3 routing and road-graph ETA ranking.'),
          how: bi('Truy vấn song song các ô con trong 2 ms rồi chọn ứng viên tối ưu.', 'Queries adaptive sub-cells in parallel and ranks top candidates by ETA.'),
          why: bi('Đạt thông lượng >100.000 ops/s.', 'Delivers >100,000 ops/s spatial processing capacity.'),
        },
        {
          id: 'geoStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'yellow',
          col: 4.2,
          row: -0.7,
          replicas: 12,
          opsPerSec: 9000,
          baseMs: 1,
          params: { shards: 12 },
          label: bi('Adaptive H3 ×12', 'Adaptive H3 ×12'),
          what: bi('12 phân vùng bộ nhớ Multi-AZ tự động chia nhỏ ô nóng thành các bucket con.', '12 Multi-AZ spatial RAM shards with dynamic hot-cell sub-bucketing.'),
          how: bi('Không còn phân vùng nào bị vượt tải khi sân bay đông khách.', 'Eliminates single-shard hot-cell skew at airports and stadiums.'),
          why: bi('Giữ độ trễ đọc/ghi chỉ ~1 ms ở mọi khu vực.', 'Sustains ~1 ms spatial read/write latency city-wide.'),
        },
        {
          id: 'dispatchCoord',
          kind: 'coordinator',
          shape: 'block',
          tone: 'orange',
          icon: 'shield',
          col: 4.5,
          row: 0,
          replicas: 16,
          opsPerSec: 3000,
          baseMs: 5,
          label: bi('Zone Dispatch ×16', 'Zone Dispatch ×16'),
          what: bi('16 cụm điều phối ghép chuyến độc lập theo từng quận/khu vực kèm Trip Ledger.', '16 zone-partitioned dispatch coordinators with fenced driver leases.'),
          how: bi('Khoá tài xế có gắn Fencing Token tránh xung đột khi mạng trễ.', 'Uses fencing tokens on driver offer locks to prevent split-brain claims.'),
          why: bi('Sự cố ở một khu vực không bao giờ lan sang thành phố khác.', 'Cell-based fault isolation across urban zones.'),
        },
        {
          id: 'locQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4.2,
          row: 0.7,
          replicas: 2,
          opsPerSec: 70000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 600000 },
          label: bi('Trajectory Log', 'Trajectory Log'),
          what: bi('Luồng sự kiện phân vùng lưu dòng toạ độ phục vụ tính cước và bản đồ giao thông.', 'Partitioned stream ingesting live traffic speed and trip polylines.'),
          how: bi('Phân vùng theo trip_id để giữ đúng thứ tự thời gian.', 'Partitioned by trip_id for ordered polyline reconstruction.'),
          why: bi('Nuôi dữ liệu thời gian thực cho bộ dự báo kẹt xe.', 'Feeds real-time road congestion and surge pricing models.'),
        },
        {
          id: 'archiver',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 5.3,
          row: 0.7,
          replicas: 24,
          opsPerSec: 1200,
          baseMs: 12,
          label: bi('Stream Sinks ×24', 'Stream Sinks ×24'),
          what: bi('24 Worker nén chuỗi hành trình xuống Object Storage và kho phân tích.', '24 stream workers flushing compressed trip trajectories to cold storage.'),
          how: bi('Xử lý gần 30.000 điểm lưu trữ/giây.', 'Sustains ~28,800 archived events/s.'),
          why: bi('Hoàn toàn tách rời khỏi đường ghép xe trực tuyến.', 'Zero impact on live rider-driver matching.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'edgeGw' },
        { id: 'gw-svc', from: 'edgeGw', to: 'locSvc' },
        { id: 'svc-geo', from: 'locSvc', to: 'geoStore', label: bi('Sub-Cell R/W', 'Sub-Cell R/W') },
        { id: 'svc-coord', from: 'locSvc', to: 'dispatchCoord', carries: 'r', fraction: 0.55 },
        { id: 'svc-q', from: 'locSvc', to: 'locQueue', mode: 'async', carries: 'w', fraction: 0.45 },
        { id: 'q-arch', from: 'locQueue', to: 'archiver', mode: 'pull' },
      ],
      routes: {
        locSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-geo4', nodeIds: ['locSvc', 'geoStore', 'dispatchCoord'], label: bi('ADAPTIVE H3 + FENCED DISPATCH', 'ADAPTIVE H3 + FENCED DISPATCH'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v4 · Adaptive H3 + gRPC Edge', 'v4 · Adaptive H3 + gRPC Edge'),
        lines: [
          { text: bi('Chia nhỏ ô nóng: xoá nghẽn sân bay', 'Adaptive sub-cells eliminate hot shards'), tone: 'good' },
          { text: bi('Chịu tải > 100.000 ops/s · p99 < 25 ms', 'Sustains > 100K ops/s · p99 < 25 ms'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 7. VIDEO STREAMING PLATFORM (YouTube) — Linked Module: S7-05
 * ============================================================================ */
const CASE_VIDEO_STREAMING: SdDesignCase = {
  id: 'video-streaming',
  order: 7,
  linkedModuleId: 'S7-05',
  domainTag: bi('Presigned Blob · DAG Transcoding · ABR Edge CDN', 'Presigned Blob · DAG Transcoding · ABR Edge CDN'),
  difficulty: 'Advanced',
  title: bi('Nền tảng Video Streaming (YouTube)', 'Video Streaming Platform (YouTube)'),
  subtitle: bi(
    'Tải lên trực tiếp tệp dung lượng lớn vào Object Storage, chuyển mã song song theo phân đoạn GOP thành đa chất lượng HLS/DASH và phân phối qua CDN có Origin Shield.',
    'Direct resumable multipart uploads to Object Storage, parallel GOP-chunk DAG transcoding into ABR profiles, and Origin-Shielded Edge CDN delivery.'
  ),
  problemBrief: bi(
    'Thiết kế nền tảng chia sẻ và phát video quy mô lớn: nhà sáng tạo tải video gốc lên tới hàng GB, còn hàng chục triệu người xem phát mượt mà trên mọi tốc độ mạng di động và Wi-Fi.',
    'Design a global video sharing and streaming platform where creators upload multi-GB raw videos and millions of viewers stream smoothly across varying network speeds.'
  ),
  clarifyingQuestions: [
    {
      id: 'vid-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Số lượng người xem hàng ngày (DAU), lưu lượng yêu cầu phân đoạn phát (Segment RPS) và lượng video mới tải lên mỗi phút?',
        'What is the DAU scale, peak video-segment playback RPS, and raw video upload rate?'
      ),
      answer: bi(
        '50 triệu DAU; giờ cao điểm >55.000 yêu cầu phân đoạn video & metadata/giây, cùng khoảng 300–500 giờ video gốc tải lên mỗi phút (~35 TB lưu trữ mới/ngày sau chuyển mã).',
        '50M DAU; >55,000 segment & metadata requests/s at peak, plus 300–500 hours of raw video uploaded per minute (~35 TB/day stored).'
      ),
      rationale: bi(
        'Băng thông phát video tính bằng hàng chục Terabit/giây: bắt buộc phải tách đường dữ liệu nhị phân (Data Plane: CDN + Blob) khỏi đường điều khiển metadata (Control Plane).',
        'Multi-Tbps egress dictates strictly separating the binary media Data Plane (CDN + Object Storage) from the API Control Plane.'
      ),
    },
    {
      id: 'vid-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Tỷ lệ giữa lượt xem video (Read) và lượt tải video lên (Write), và kích thước tệp gốc lớn tới mức nào?',
        'What is the Watch-to-Upload ratio, and how large are raw uploaded video files?'
      ),
      answer: bi(
        'Khoảng 98:2 theo số yêu cầu; tệp gốc từ 200 MB đến 4 GB. Nếu đẩy luồng byte upload đi xuyên qua máy chủ API thông thường sẽ giữ kẹt kết nối và băng thông NIC ngay lập tức.',
        '~98:2 playback-to-upload ratio; raw files span 200 MB–4 GB, which would saturate stateless API servers if proxied inline.'
      ),
      rationale: bi(
        'Bắt buộc dùng Presigned Multipart Upload URL để trình duyệt đẩy các khối 8–16 MB thẳng vào Object Storage hỗ trợ tải tiếp khi rớt mạng.',
        'Mandates Presigned Multipart Upload URLs so clients upload 8–16 MB chunks directly to Object Storage with resume support.'
      ),
    },
    {
      id: 'vid-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Làm sao trình phát không bị đứng hình khi người xem đi vào vùng sóng 4G yếu, và mục tiêu thời gian khởi phát (Time-to-First-Frame) là bao nhiêu?',
        'How does playback adapt smoothly when cellular bandwidth drops, and what is the Time-to-First-Frame SLA?'
      ),
      answer: bi(
        'Băm video thành các phân đoạn ngắn 2–4 giây ở nhiều mức chất lượng (360p, 720p, 1080p, 4K) theo giao thức HLS/DASH (Adaptive Bitrate); tải phân đoạn đầu p99 < 150 ms từ CDN gần nhất.',
        'Encode videos into 2–4s HLS/DASH chunks across multiple bitrates (360p–4K Adaptive Bitrate) served from nearby CDN POPs in <150 ms.'
      ),
      rationale: bi(
        'Trình phát tự đo băng thông thực tế mỗi 4 giây để chọn mức độ phân giải kế tiếp mà không cần máy chủ giữ trạng thái luồng.',
        'Lets client players switch quality seamlessly chunk-by-chunk over stateless HTTP cacheable URLs.'
      ),
    },
    {
      id: 'vid-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Làm sao rút ngắn thời gian chuyển mã một video dài 2 giờ, và tránh quá tải Object Storage khi một video mới đăng bất ngờ viral toàn cầu?',
        'How do we speed up transcoding a 2-hour video, and protect Object Storage when a brand-new upload goes viral?'
      ),
      answer: bi(
        'Tách tệp gốc theo ranh giới khung hình chính (GOP Split) để hàng chục Transcode Worker mã hoá song song (DAG Pipeline) rồi ghép manifest; đặt tầng Origin Shield Cache trước Object Storage để gộp Miss từ hàng trăm POP CDN.',
        'Split raw video at GOP keyframes for parallel DAG chunk transcoding, and place an Origin Shield cache tier in front of Object Storage to coalesce CDN POP misses.'
      ),
      rationale: bi(
        'Giảm thời gian chờ xuất bản video từ hàng giờ xuống vài phút và bảo vệ băng thông Origin khi hàng trăm trạm CDN cùng hỏi phân đoạn mới.',
        'Cuts publish latency from hours to minutes and prevents 200 CDN POPs from stampeding Origin Blob storage simultaneously.'
      ),
    },
    {
      id: 'vid-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Thanh tiến trình tua video trên giao diện nên dùng màu đỏ tươi hay màu cam san hô?',
        'Should the video player scrubber bar be crimson red or coral orange?'
      ),
      answer: bi(
        'Thuộc thiết kế giao diện trình phát phía người dùng.',
        'Purely a UI theme decision on the client player.'
      ),
      rationale: bi(
        'Không ảnh hưởng tới đường ống chuyển mã, lưu trữ phân đoạn hay tỉ lệ trúng bộ nhớ đệm CDN.',
        'Irrelevant to transcoding pipelines, chunk storage, or CDN offload.'
      ),
    },
    {
      id: 'vid-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên tự phát minh một chuẩn nén video toán học mới thay thế H.264 / VP9 / AV1 ngay trong buổi thiết kế này không?',
        'Should we invent a brand-new mathematical video compression codec from scratch instead of using H.264/VP9/AV1?'
      ),
      answer: bi(
        'Tuyệt đối không: chip xử lý video phần cứng trên điện thoại và trình duyệt chỉ hỗ trợ các codec chuẩn quốc tế (H.264, HEVC, VP9, AV1).',
        'No: hardware decoders in phones and browsers strictly require standard codecs (H.264, VP9, AV1).'
      ),
      rationale: bi(
        'Trọng tâm hệ thống là điều phối song song cụm máy mã hoá chuẩn (FFmpeg/ASIC) theo hiệu quả chi phí và độ phổ biến của video.',
        'System design focuses on orchestrating distributed encoding fleets and tiered storage—not inventing codecs.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('50M DAU · 500M giờ xem/ngày', '50M DAU · 500M watch hours/day'),
    readRps: bi('15.000 TB / 55.000 đỉnh segment & API/s', '15,000 avg / 55,000 peak segment & API/s'),
    writeRps: bi('300 TB / 1.100 đỉnh chunk upload/s', '300 avg / 1,100 peak chunk uploads/s'),
    readWriteRatio: bi('98 : 2 (Phát phân đoạn HLS/DASH)', '98 : 2 (HLS/DASH Segment Playback)'),
    storagePerDay: bi('~35 TB phân đoạn ABR mới/ngày', '~35 TB new ABR segments/day'),
    memoryOrBandwidth: bi('≥ 92% băng thông phát từ Edge CDN + Origin Shield', '≥ 92% egress served by Edge CDN + Shield'),
    slos: [
      bi('Segment Fetch p99 < 80 ms', 'Segment Fetch p99 < 80 ms'),
      bi('Resumable Multipart Upload', 'Resumable Multipart Upload'),
      bi('ABR 360p→4K không đứng hình', 'Stall-free ABR 360p→4K switching'),
    ],
    snakeSummary: {
      scope: bi('Upload nhiều phần, chuyển mã DAG đa độ phân giải, phát HLS/DASH qua CDN, metadata.', 'Multipart upload, parallel DAG transcoding, HLS/DASH CDN streaming, metadata.'),
      numbers: bi('55K segment/s đỉnh, ~35 TB/ngày, chỉ mã hoá AV1 đắt tiền cho video nhiều lượt xem.', '55K peak segments/s, ~35 TB/day, selective AV1 encoding for popular videos.'),
      api: bi('POST /v1/uploads/init → presignedUrls · GET /v1/videos/{id}/master.m3u8.', 'POST /v1/uploads/init → presignedUrls · GET /v1/videos/{id}/master.m3u8.'),
      keyComponents: bi('Edge CDN, Origin Shield, Control API, Metadata Cache/DB, Object Storage, DAG Transcoders.', 'Edge CDN, Origin Shield, Control API, Metadata Cache/DB, Object Storage, DAG Transcoders.'),
      elaborate: bi('Tách Control Plane & Data Plane, chia GOP song song hoá chuyển mã, lưu trữ lạnh cho video cũ.', 'Separate Control & Data planes, GOP-split parallel transcoding, cold storage tiering.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'vid',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Upload & Phát xuyên qua 1 App Server + Lưu trữ gốc', 'Single App Server Proxying Video Bytes + SQL/Blob'),
      eraTag: bi('100 req/s · Nghẽn băng thông máy chủ', '100 req/s · Inline Byte Proxying'),
      targetRps: 100,
      readRatio: 0.98,
      seed: 7361,
      summary: bi(
        'Một máy chủ ứng dụng vừa nhận luồng tải lên vừa tự đọc các tệp MP4 nguyên khối từ kho lưu trữ để truyền về trình duyệt người xem, đồng thời chuyển mã tuần tự trên cùng máy.',
        'A single application server proxies raw MP4 uploads/downloads inline and runs single-bitrate encoding on the same host.'
      ),
      whyNextStage: bi(
        'Chỉ cần tăng 5× lên 500 req/s, việc đẩy luồng byte nhị phân lớn qua App Server (μ = 220 req/s) làm nghẽn cứng băng thông mạng và CPU máy chủ.',
        'At 5x load (500 req/s), proxying heavy video bytes through App Server (μ = 220 req/s) saturates NIC bandwidth and worker threads immediately.'
      ),
      whatChanged: [
        diff('+', '1 Video App vừa giữ kết nối upload/stream vừa đọc metadata', 'Single Video App proxying media streams and metadata'),
        diff('+', '1 Metadata SQL + 1 kho Blob lưu tệp MP4 nguyên chiếc', 'Single Metadata SQL + Blob store holding monolithic MP4 files'),
      ],
      tradeOffs: [
        trade(
          'Truyền tệp MP4 nguyên khối đi xuyên qua tầng App Server',
          'Proxy monolithic MP4 files directly through the App Server',
          'Dễ kiểm tra quyền truy cập trong cùng một ứng dụng duy nhất',
          'Simple inline auth check inside one monolithic codebase',
          'Băng thông máy chủ cạn kiệt cực nhanh, rớt mạng lúc upload phải tải lại từ 0% và không tự hạ độ phân giải',
          'Exhausts server I/O, breaks uploads on network blips, and lacks adaptive bitrate'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Viewers & Upload', 'Viewers & Upload'),
          what: bi('Người xem phát video và người sáng tạo tải tệp MP4 lên.', 'Viewers watching videos and creators uploading MP4 files.'),
          how: bi('98% yêu cầu tải dữ liệu phát, 2% tải tệp mới.', '98% playback requests, 2% upload requests.'),
          why: bi('Mỗi yêu cầu mang theo khối lượng dữ liệu lớn gấp hàng nghìn lần JSON thường.', 'Each media request carries megabytes rather than kilobytes.'),
        },
        {
          id: 'apiSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 220,
          baseMs: 25,
          label: bi('Video Monolith', 'Video Monolith'),
          what: bi('Máy chủ đơn kiêm nhiệm cả API thông tin lẫn truyền tải luồng video.', 'Monolithic server mixing JSON metadata and raw media streaming.'),
          how: bi('Đọc byte từ Blob rồi ghi ra socket HTTP của người xem.', 'Streams raw bytes from Blob through application memory.'),
          why: bi('Nghẽn ngay lập tức ở ~220 req/s.', 'Becomes an immediate I/O bottleneck at ~220 req/s.'),
        },
        {
          id: 'metaStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: -0.55,
          replicas: 1,
          opsPerSec: 600,
          baseMs: 5,
          label: bi('Metadata SQL', 'Metadata SQL'),
          what: bi('Bảng lưu tiêu đề, người đăng và đường dẫn tệp video.', 'Relational table storing video titles, authors, and paths.'),
          how: bi('Truy vấn mỗi khi mở trang xem.', 'Queried on video page loads.'),
          why: bi('Dữ liệu nhỏ nên chưa nghẽn bằng tầng truyền byte.', 'Lightweight compared to binary media transfer.'),
        },
        {
          id: 'blobOrigin',
          kind: 'blob',
          shape: 'db',
          tone: 'purple',
          col: 2,
          row: 0.55,
          replicas: 1,
          opsPerSec: 450,
          baseMs: 22,
          label: bi('Raw MP4 Blob', 'Raw MP4 Blob'),
          what: bi('Kho lưu tệp MP4 gốc chỉ có 1 độ phân giải duy nhất.', 'Object store holding single-resolution raw MP4 files.'),
          how: bi('Phục vụ trực tiếp cho Video Monolith.', 'Read directly by the Video Monolith on every view.'),
          why: bi('Chưa có phân đoạn ABR hay bộ nhớ đệm biên.', 'Lacks ABR chunking and edge caching.'),
        },
      ],
      links: [
        { id: 'c-api', from: 'client', to: 'apiSvc', label: bi('MP4 Stream', 'MP4 Stream') },
        { id: 'api-meta', from: 'apiSvc', to: 'metaStore', carries: 'r', fraction: 0.3 },
        { id: 'api-blob', from: 'apiSvc', to: 'blobOrigin' },
      ],
      routes: {
        apiSvc: 'all-parallel',
      },
      noteCard: {
        title: bi('v1 · Proxy byte qua App', 'v1 · Inline App Proxying'),
        lines: [
          { text: bi('Luồng video đi xuyên qua RAM máy App', 'Video bytes proxy through App RAM'), tone: 'amber' },
          { text: bi('Nghẽn cứng ở ~220 req/s, không có ABR', 'Bottlenecks at ~220 req/s, no ABR'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'vid',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Tách Control/Data Plane: Presigned Upload + Hàng đợi Chuyển mã ABR', 'Presigned Upload + Async ABR Transcode Queue'),
      eraTag: bi('2.000 req/s · Chia phân đoạn HLS/DASH', '2,000 req/s · HLS/DASH Chunking'),
      targetRps: 2000,
      readRatio: 0.98,
      seed: 7362,
      summary: bi(
        'Tách đường điều khiển khỏi đường nhị phân: API chỉ cấp Presigned URL và trả tệp chỉ dẫn .m3u8 (có Redis đệm), còn việc chuyển mã sang các đoạn 4 giây (360p/720p/1080p) chạy nền qua Transcode Queue.',
        'Separates Control and Data planes: API issues Presigned URLs and cached .m3u8 manifests, while background Workers transcode uploads into 4s ABR segments.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (10.000 req/s), mọi trình phát trên thế giới vẫn kéo các phân đoạn video trực tiếp từ cụm Object Storage gốc (μ = 3.600 req/s) gây quá tải Origin và độ trễ xuyên lục địa cao.',
        'At 5x load (10,000 req/s), serving every video segment directly from Origin Blob Storage (μ = 3,600 req/s) saturates Origin egress and transcode workers.'
      ),
      whatChanged: [
        diff('+', 'Dùng Presigned Multipart URL để tải lên và đọc phân đoạn trực tiếp từ Object Storage', 'Use Presigned URLs for direct client-to-Blob multipart uploads and segment reads'),
        diff('+', 'Thêm Transcode Queue + Workers sinh các phân đoạn HLS/DASH đa độ phân giải', 'Add async Transcode Queue + Workers producing multi-bitrate HLS/DASH segments'),
        diff('+', 'Đệm Metadata & Manifest trong Redis Cache (~88% Hit)', 'Cache video metadata and .m3u8 manifests in Redis (~88% hit)'),
      ],
      tradeOffs: [
        trade(
          'Chuyển mã bất đồng bộ nguyên tệp trên 1 Worker mỗi video',
          'Async whole-file transcoding per worker',
          'Không còn làm nghẽn API Server khi người dùng tải lên tệp nặng hàng GB',
          'Keeps Control API lightweight and responsive regardless of upload size',
          'Video dài 2 giờ phải chờ 1 Worker xử lý tuần tự khá lâu và chưa có CDN giảm tải phát',
          '2-hour uploads still take long on a single worker, and Origin Blob serves all playback'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('ABR Players', 'ABR Players'),
          what: bi('Trình phát thông minh tự chuyển đổi 360p/720p/1080p theo từng đoạn 4 giây.', 'Adaptive Bitrate players fetching 4-second HLS/DASH chunks.'),
          how: bi('2.000 yêu cầu phân đoạn và thông tin video mỗi giây.', '2,000 segment and manifest requests/s.'),
          why: bi('Không bị đứng hình khi mạng di động giảm tốc độ.', 'Adapts quality smoothly without rebuffering.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải điều phối vào cụm Control API.', 'Load Balancer fronting Control API.'),
          how: bi('Chia đều cho 3 máy chủ điều khiển.', 'Routes across 3 stateless API servers.'),
          why: bi('Đảm bảo độ sẵn sàng cho API quản lý video.', 'Removes single-API bottleneck.'),
        },
        {
          id: 'apiSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 4,
          opsPerSec: 2900,
          baseMs: 6,
          label: bi('Control API ×4', 'Control API ×4'),
          what: bi('Tầng điều khiển nhẹ: cấp Presigned URL, xác thực quyền xem và trả manifest.', 'Lightweight Control Plane issuing signed URLs and manifests.'),
          how: bi('Không còn cho luồng byte video chạy xuyên qua bộ nhớ của mình.', 'Zero raw video bytes pass through Control API.'),
          why: bi('Tăng gấp ~25× hiệu quả CPU so với v1.', '25x more CPU-efficient than v1 inline proxying.'),
        },
        {
          id: 'metaCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.65,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.88 },
          label: bi('Manifest Cache', 'Manifest Cache'),
          what: bi('Redis lưu đệm thông tin video và danh sách phân đoạn .m3u8.', 'Redis caching video metadata and .m3u8 playlists.'),
          how: bi('Phục vụ 88% truy vấn thông tin trong 0,5 ms.', 'Serves 88% of metadata lookups in 0.5 ms.'),
          why: bi('Bảo vệ Metadata SQL khi nhiều người mở cùng một video.', 'Shields Metadata SQL on popular videos.'),
        },
        {
          id: 'metaStore',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 4,
          row: -0.65,
          replicas: 1,
          opsPerSec: 1000,
          baseMs: 5,
          label: bi('Metadata SQL', 'Metadata SQL'),
          what: bi('Cơ sở dữ liệu lưu trạng thái xử lý video, kênh và quyền riêng tư.', 'SQL database storing video state, channels, and permissions.'),
          how: bi('Chỉ xử lý 12% lượt Miss thông tin và cập nhật trạng thái chuyển mã.', 'Handles 12% metadata misses and transcode status updates.'),
          why: bi('Giữ nhất quán trạng thái video nháp / công khai.', 'Maintains consistent publish visibility.'),
        },
        {
          id: 'blobOrigin',
          kind: 'blob',
          shape: 'db',
          tone: 'purple',
          col: 3.5,
          row: 0,
          replicas: 2,
          opsPerSec: 1800,
          baseMs: 18,
          label: bi('ABR Blob ×2', 'ABR Blob ×2'),
          what: bi('Kho Object Storage lưu tệp tải lên và các đoạn .m4s đã chuyển mã.', 'Object Storage holding raw uploads and encoded ABR chunks.'),
          how: bi('Đang phải tự phục vụ trực tiếp 100% lượt tải phân đoạn (~3.600 ops/s tối đa).', 'Directly serves 100% of segment fetches (~3,600 ops/s ceiling).'),
          why: bi('Nghẽn băng thông và tốn phí truyền tải lớn khi chưa có CDN.', 'Saturates egress and incurs high origin cost without a CDN.'),
        },
        {
          id: 'transcodeQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3,
          row: 0.7,
          replicas: 1,
          opsPerSec: 30000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 50000 },
          label: bi('Transcode Q', 'Transcode Q'),
          what: bi('Hàng đợi tác vụ mã hoá khi một tệp gốc hoàn tất tải lên.', 'Job queue triggered upon multipart upload completion.'),
          how: bi('Nhận ~40 tác vụ/giây ở mức 2.000 req/s.', 'Receives ~40 upload jobs/s at 2K total RPS.'),
          why: bi('Đệm tác vụ nặng tốn nhiều CPU/GPU.', 'Buffers compute-intensive encoding jobs.'),
        },
        {
          id: 'transcoder',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4,
          row: 0.7,
          replicas: 2,
          opsPerSec: 45,
          baseMs: 45,
          label: bi('Encoder ×2', 'Encoder ×2'),
          what: bi('Hai máy Worker chạy FFmpeg nén sang 360p, 720p, 1080p.', 'Two FFmpeg worker hosts encoding 360p/720p/1080p renditions.'),
          how: bi('Tổng công suất ~90 tác vụ/giây; sẽ dồn ứ ở mốc ×5 (~200 upload/s).', 'Capacity ~90 jobs/s; backlogs under a 5x creator upload surge.'),
          why: bi('Cho thấy nhu cầu tách nhỏ đoạn GOP và mở rộng đàn máy mã hoá.', 'Illustrates why chunked DAG parallel encoding is needed next.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'apiSvc' },
        { id: 'api-cache', from: 'apiSvc', to: 'metaCache', carries: 'r', fraction: 0.25 },
        { id: 'cache-sql', from: 'metaCache', to: 'metaStore', carries: 'r' },
        { id: 'api-blob', from: 'apiSvc', to: 'blobOrigin', carries: 'r', label: bi('Signed Segment', 'Signed Segment') },
        { id: 'api-tq', from: 'apiSvc', to: 'transcodeQueue', mode: 'async', carries: 'w', label: bi('Upload 2%', 'Upload 2%') },
        { id: 'tq-enc', from: 'transcodeQueue', to: 'transcoder', mode: 'pull' },
      ],
      routes: {
        apiSvc: 'all-parallel',
      },
      noteCard: {
        title: bi('v2 · Tách Control & ABR', 'v2 · Split Plane & ABR'),
        lines: [
          { text: bi('Presigned URL giải phóng Control API', 'Presigned URLs free up Control API'), tone: 'good' },
          { text: bi('Chưa có CDN: Origin Blob nghẽn ở ~3.600/s', 'No CDN yet: Origin Blob caps ~3,600/s'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'vid',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Edge CDN phân phối Segment + DAG Song song hoá theo GOP', 'Edge CDN Segment Delivery + Parallel GOP-Chunk DAG'),
      eraTag: bi('15.000 req/s · CDN gánh 86% băng thông', '15,000 req/s · 86% Edge CDN Offload'),
      targetRps: 15000,
      readRatio: 0.98,
      seed: 7363,
      summary: bi(
        'Đưa các phân đoạn HLS/DASH bất biến ra mạng lưới Edge CDN (~86% Hit) gần người xem, đồng thời cắt tệp tải lên theo khung hình GOP để cụm DAG Worker mã hoá song song từng đoạn ngắn.',
        'Caches immutable HLS/DASH segments on Edge CDN POPs (~86% hit) and splits uploads at GOP boundaries so parallel DAG Workers encode chunks concurrently.'
      ),
      whyNextStage: bi(
        'Khi video viral vọt 5× lên 75.000 req/s toàn cầu, 14% lượt Miss từ hàng trăm trạm POP CDN (~10.500 req/s) đồng loạt chọc thẳng về Origin Blob chưa có lớp Origin Shield gây quá tải.',
        'During a 5x global premiere (75,000 req/s), 14% uncoalesced misses across hundreds of CDN POPs (~10,500 req/s) stampede Origin Blob storage.'
      ),
      whatChanged: [
        diff('+', 'Đặt Edge CDN phân phát trực tiếp ~86% phân đoạn video ngay tại trạm POP địa phương', 'Place Edge CDN serving ~86% of immutable video segments from local POPs'),
        diff('~', 'Nâng cấp bộ chuyển mã thành DAG Pipeline cắt nhỏ GOP chạy song song trên 10 Worker', 'Upgrade encoding to GOP-split parallel DAG Workers (×10)'),
        diff('~', 'Phân mảnh kho Metadata sang Sharded NoSQL (3 phân vùng)', 'Migrate video/comment metadata to 3-shard NoSQL'),
      ],
      tradeOffs: [
        trade(
          'Cắt nhỏ video theo GOP để mã hoá song song (Chunked DAG) + Đặt URL phân đoạn bất biến trên CDN',
          'Parallel GOP-chunk DAG encoding + Immutable segment URLs on CDN',
          'Video dài 1 giờ được 10 máy mã hoá xong trong vài phút; CDN cắt giảm 86% chi phí băng thông Origin',
          'Encodes 1-hour videos in minutes across parallel workers while CDN cuts 86% of origin egress',
          'Cần bước ghép nối (Mux/Manifest Stitcher) và nhiều POP CDN vẫn có thể cùng hỏi 1 đoạn mới về Origin',
          'Requires DAG coordination, and regional CDN POPs can still duplicate cold misses to Origin'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Global Viewers', 'Global Viewers'),
          what: bi('15.000 yêu cầu phát phân đoạn ABR và tải lên mỗi giây.', '15,000 ABR segment fetches and chunk uploads/s.'),
          how: bi('Kéo các tệp .m4s bất biến từ trạm Edge CDN gần nhà mạng nhất.', 'Pulls immutable .m4s chunks from ISP-adjacent CDN POPs.'),
          why: bi('Khởi phát video nhanh không bị trễ đường truyền quốc tế.', 'Delivers sub-100ms Time-to-First-Frame.'),
        },
        {
          id: 'cdn',
          kind: 'cdn',
          shape: 'block',
          tone: 'blue',
          icon: 'globe',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 80000,
          baseMs: 1.2,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.86, singleflight: false },
          label: bi('Edge CDN', 'Edge CDN'),
          what: bi('Các trạm biên lưu đệm các phân đoạn của nhóm 20% video phổ biến.', 'Edge POPs caching segments for popular videos.'),
          how: bi('Phục vụ ~86% yêu cầu đọc ngay tại biên; 14% Miss đi tiếp về Origin.', 'Serves ~86% of segment reads at the edge; forwards 14% misses.'),
          why: bi('Giảm 7× tải cho toàn bộ cụm máy chủ trung tâm.', 'Reduces origin cluster load 7x.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 2,
          opsPerSec: 18000,
          baseMs: 0.4,
          label: bi('Origin LB', 'Origin LB'),
          what: bi('Cặp cân bằng tải ở trung tâm dữ liệu gốc.', 'Origin Load Balancer pair.'),
          how: bi('Chỉ nhận ~2.400 req/s đi lọt qua CDN ở mức tải 15K.', 'Receives only ~2,400 origin req/s out of 15K total.'),
          why: bi('Rất thoáng ở tải chuẩn, chỉ căng khi Miss tăng vọt.', 'Lightly loaded until massive unshielded CDN miss waves.'),
        },
        {
          id: 'apiSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 6,
          opsPerSec: 1800,
          baseMs: 6,
          label: bi('Control API ×6', 'Control API ×6'),
          what: bi('Điều phối metadata, ký URL và khởi chạy đồ thị DAG khi tải lên xong.', '6 stateless servers handling manifests, uploads, and DAG triggers.'),
          how: bi('Tổng năng lực 10.800 req/s tại Origin.', '10,800 origin req/s capacity.'),
          why: bi('Đủ phục vụ tới ~45.000 RPS biên nhờ CDN che chắn.', 'Supports ~45K edge RPS thanks to CDN offload.'),
        },
        {
          id: 'metaCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4,
          row: -0.7,
          replicas: 2,
          opsPerSec: 32000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.92 },
          label: bi('Metadata Redis', 'Metadata Redis'),
          what: bi('Cụm đệm thông tin video, kênh và danh sách phát.', 'Replicated Redis cluster for video and channel metadata.'),
          how: bi('Đạt 92% Hit Ratio.', '92% hit ratio.'),
          why: bi('Giữ truy vấn thông tin luôn dưới 1 ms.', 'Sub-millisecond metadata reads.'),
        },
        {
          id: 'metaStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5,
          row: -0.7,
          replicas: 3,
          opsPerSec: 4500,
          baseMs: 3,
          params: { shards: 3 },
          label: bi('Meta Store ×3', 'Meta Store ×3'),
          what: bi('Kho NoSQL 3 phân vùng lưu hàng tỷ bản ghi video.', '3-shard NoSQL metadata store.'),
          how: bi('Mở rộng ngang theo video_id.', 'Partitioned by video_id.'),
          why: bi('Không bao giờ thành cổ chai đọc thông tin.', 'Ample metadata IOPS.'),
        },
        {
          id: 'blobOrigin',
          kind: 'blob',
          shape: 'db',
          tone: 'purple',
          col: 4.5,
          row: 0,
          replicas: 2,
          opsPerSec: 1700,
          baseMs: 16,
          label: bi('Origin Blob ×2', 'Origin Blob ×2'),
          what: bi('Kho đối tượng gốc cung cấp phân đoạn khi trạm CDN chưa có bản lưu.', 'Origin Object Storage feeding uncached segments to CDN POPs.'),
          how: bi('Năng lực 3.400 Miss/giây (ở 15K RPS nhận ~2.050 Miss/giây ⇒ ρ ≈ 0,60).', '3,400 origin fetches/s capacity (~2,050 misses/s at 15K edge RPS).'),
          why: bi('Khi vọt 5× (75K RPS ⇒ ~10.200 Miss/s), Origin Blob quá tải đỏ rực nếu thiếu Origin Shield!', 'At 5x load (~10,200 misses/s), Origin Blob overloads without an Origin Shield!'),
        },
        {
          id: 'transcodeQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4,
          row: 0.7,
          replicas: 1,
          opsPerSec: 45000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 200000 },
          label: bi('DAG Chunk Q', 'DAG Chunk Q'),
          what: bi('Hàng đợi các đoạn GOP ngắn (10 giây/đoạn) tách ra từ tệp tải lên.', 'Queue dispatching 10-second GOP video chunks to parallel encoders.'),
          how: bi('Cho phép 1 video dài được xử lý đồng thời trên nhiều máy.', 'Enables intra-video parallelism across the worker pool.'),
          why: bi('Rút ngắn mạnh thời gian chờ xuất bản của nhà sáng tạo.', 'Slashes creator time-to-publish.'),
        },
        {
          id: 'transcoder',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'git',
          col: 5,
          row: 0.7,
          replicas: 10,
          opsPerSec: 85,
          baseMs: 35,
          label: bi('DAG Workers ×10', 'DAG Workers ×10'),
          what: bi('10 máy mã hoá song song âm thanh, hình thu nhỏ và các mức ABR.', '10 parallel DAG workers encoding audio, thumbnails, and ABR ladders.'),
          how: bi('Xử lý ~850 đoạn tải lên/giây.', 'Processes ~850 chunk jobs/s.'),
          why: bi('Đáp ứng tốt ~300 lượt tải lên/giây ở mức 15K.', 'Comfortably handles ~300 chunk uploads/s at 15K scale.'),
        },
      ],
      links: [
        { id: 'c-cdn', from: 'client', to: 'cdn', label: bi('HLS/DASH', 'HLS/DASH') },
        { id: 'cdn-lb', from: 'cdn', to: 'lb', label: bi('Miss 14%', 'Miss 14%') },
        { id: 'lb-api', from: 'lb', to: 'apiSvc' },
        { id: 'api-mc', from: 'apiSvc', to: 'metaCache', carries: 'r', fraction: 0.3 },
        { id: 'mc-ms', from: 'metaCache', to: 'metaStore', carries: 'r' },
        { id: 'api-blob', from: 'apiSvc', to: 'blobOrigin', carries: 'r' },
        { id: 'api-tq', from: 'apiSvc', to: 'transcodeQueue', mode: 'async', carries: 'w' },
        { id: 'tq-enc', from: 'transcodeQueue', to: 'transcoder', mode: 'pull' },
      ],
      routes: {
        apiSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-dag', nodeIds: ['transcodeQueue', 'transcoder'], label: bi('PARALLEL GOP DAG', 'PARALLEL GOP DAG'), tone: 'purple' },
      ],
      noteCard: {
        title: bi('v3 · Edge CDN + GOP DAG', 'v3 · Edge CDN + GOP DAG'),
        lines: [
          { text: bi('CDN gánh 86% · Mã hoá GOP song song', '86% CDN offload · Parallel GOP DAG'), tone: 'good' },
          { text: bi('200 POP cùng Miss làm nghẽn Origin ở ×5', 'Uncoalesced POP misses hit Origin at ×5'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'vid',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('ISP Edge Cache + Origin Shield (Singleflight) + Tiered AV1/Storage', 'Multi-Tier CDN + Origin Shield + Autoscaled ASIC Fleet'),
      eraTag: bi('55.000+ req/s · Tối ưu Egress & Viral Premiere', '55,000+ req/s · Origin-Shielded Global Scale'),
      targetRps: 55000,
      readRatio: 0.98,
      seed: 7364,
      summary: bi(
        'Đặt thêm tầng Origin Shield (có Singleflight gộp yêu cầu trùng) giữa các trạm Edge CDN và kho Object Storage để chỉ ~1–2% lưu lượng thực sự chạm Blob gốc, kết hợp mã hoá chọn lọc AV1 cho video phổ biến và lưu trữ phân tầng nóng/lạnh.',
        'Inserts an Origin Shield cache with Singleflight request coalescing between Edge CDN POPs and Object Storage so <2% of traffic reaches Origin Blob, paired with selective hardware AV1 encoding.'
      ),
      whyNextStage: bi(
        'Kiến trúc hai tầng CDN + Origin Shield chịu vững >130.000 yêu cầu phân đoạn/giây ngay cả trong các buổi công chiếu trực tiếp triệu người xem đồng thời.',
        'Two-tier Edge CDN + Origin Shield sustains >130,000 segment requests/s cleanly during multi-million-viewer live premieres.'
      ),
      whatChanged: [
        diff('+', 'Chèn tầng Origin Shield Cache (Singleflight) gộp các lượt Miss từ hàng trăm POP CDN (~80% Shield Hit)', 'Insert Origin Shield Cache with Singleflight coalescing regional POP misses (~80% shield hit)'),
        diff('+', 'Mã hoá hai bậc: xuất bản nhanh H.264 trước, chỉ chạy nén sâu VP9/AV1 bằng chip chuyên dụng cho video phổ biến', 'Two-tier encoding: fast H.264 publish first, selective ASIC VP9/AV1 for high-view videos'),
        diff('~', 'Tự động chuyển các phân đoạn video ít người xem sau 30 ngày sang tầng lưu trữ lạnh giảm 70% chi phí', 'Lifecycle-tier cold segments >30 days old to archival storage cutting storage cost 70%'),
      ],
      tradeOffs: [
        trade(
          'Chỉ mã hoá chuẩn nén cao cấp AV1 cho nhóm video có lượt xem cao thay vì 100% video tải lên',
          'Encode expensive AV1 profiles selectively for popular videos only',
          'Tiết kiệm ~10× chi phí điện năng mã hoá mà vẫn giảm 30% băng thông cho 80% tổng giờ xem',
          'Saves ~10x compute cost while still cutting 30% egress bandwidth across 80% of watch hours',
          'Cần bộ theo dõi độ phổ biến video để kích hoạt tác vụ mã hoá bổ sung ở chế độ nền',
          'Requires view-velocity tracking to trigger background re-encoding jobs'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('55K Segments/s', '55K Segments/s'),
          what: bi('55.000 yêu cầu phát phân đoạn ABR và tải lên mỗi giây trên toàn cầu.', '55,000 global ABR segment fetches and creator uploads/s.'),
          how: bi('Hỗ trợ đầy đủ AV1/VP9/H.264 tuỳ thiết bị.', 'Negotiates AV1, VP9, or H.264 per client capability.'),
          why: bi('Tối ưu chất lượng hình ảnh trên từng kilobit băng thông.', 'Maximizes visual quality per bit of bandwidth.'),
        },
        {
          id: 'cdn',
          kind: 'cdn',
          shape: 'block',
          tone: 'blue',
          icon: 'globe',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 110000,
          baseMs: 1,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.9 },
          label: bi('ISP Edge CDN', 'ISP Edge CDN'),
          what: bi('Các máy chủ đệm đặt sát mạng viễn thông địa phương (Edge POP).', 'ISP-embedded Edge CDN caches serving 90% of segment traffic.'),
          how: bi('Trả về 90% phân đoạn trong ~1 ms; chỉ 10% chuyển về Origin Shield.', 'Delivers 90% of reads in ~1 ms; forwards 10% to Origin Shield.'),
          why: bi('Giữ lưu lượng video nặng ngay tại biên mạng.', 'Keeps multi-Tbps video traffic local to ISP edges.'),
        },
        {
          id: 'originShield',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 3,
          opsPerSec: 45000,
          baseMs: 1.2,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.8 },
          label: bi('Origin Shield', 'Origin Shield'),
          what: bi('Tầng đệm khu vực có bật Singleflight đứng chắn trước trung tâm dữ liệu gốc.', 'Regional Origin Shield cache coalescing concurrent misses across Edge POPs.'),
          how: bi('Hấp thụ tiếp 80% lượng Miss từ CDN ⇒ chỉ ~2% tổng đọc đi vào Origin!', 'Absorbs 80% of Edge misses so <2% of total reads reach Origin!'),
          why: bi('Chặn đứng hiện tượng 200 trạm CDN cùng kéo 1 phân đoạn video vừa công chiếu.', 'Eliminates multi-POP thundering herds during viral premieres.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 3,
          row: 0,
          replicas: 3,
          opsPerSec: 20000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB', 'Multi-AZ LB'),
          what: bi('Cụm cân bằng tải bảo vệ tầng điều khiển và lưu trữ gốc.', 'Multi-AZ Origin Load Balancer.'),
          how: bi('Chỉ phải điều phối ~2.200 req/s nhờ 2 lớp CDN + Shield.', 'Routes just ~2,200 origin req/s thanks to dual-tier caching.'),
          why: bi('Dư sức chịu đựng cả khi tải biên tăng gấp nhiều lần.', 'Massive headroom for viral events.'),
        },
        {
          id: 'apiSvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 4,
          row: 0,
          replicas: 10,
          opsPerSec: 2400,
          baseMs: 5,
          label: bi('Control API ×10', 'Control API ×10'),
          what: bi('Cụm 10 máy chủ điều phối tải lên nhiều phần, bản quyền và manifest.', '10 stateless origin servers managing uploads, DRM, and manifests.'),
          how: bi('Năng lực 24.000 origin req/s.', '24,000 origin req/s capacity.'),
          why: bi('Vận hành nhẹ nhàng, tách biệt hoàn toàn khỏi băng thông phát.', 'Cleanly isolated from media egress load.'),
        },
        {
          id: 'metaStore',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5,
          row: -0.7,
          replicas: 6,
          opsPerSec: 5500,
          baseMs: 3,
          params: { shards: 6 },
          label: bi('Meta Shards ×6', 'Meta Shards ×6'),
          what: bi('6 phân vùng NoSQL Multi-AZ lưu metadata video và danh sách phát.', '6-shard Multi-AZ NoSQL metadata store.'),
          how: bi('Phục vụ các lượt tra cứu thông tin gốc.', 'Serves origin metadata reads and publish writes.'),
          why: bi('Độ sẵn sàng 99,99% xuyên vùng.', '99.99% cross-AZ availability.'),
        },
        {
          id: 'blobOrigin',
          kind: 'blob',
          shape: 'db',
          tone: 'purple',
          col: 5.2,
          row: 0,
          replicas: 8,
          opsPerSec: 2500,
          baseMs: 14,
          label: bi('Tiered Blob ×8', 'Tiered Blob ×8'),
          what: bi('Kho Object Storage đa vùng có chính sách tự chuyển tầng Nóng → Ấm → Lạnh.', 'Multi-AZ tiered Object Storage (Hot NVMe → Warm → Cold Archive).'),
          how: bi('Tổng năng lực 20.000 origin fetches/s cho lượng Miss chỉ ~1.100/s.', '20,000 fetches/s capacity handling just ~1,100 shielded misses/s.'),
          why: bi('Tối ưu chi phí lưu trữ petabyte dài hạn.', 'Keeps multi-petabyte storage cost sustainable.'),
        },
        {
          id: 'transcodeQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4.2,
          row: 0.7,
          replicas: 2,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 400000 },
          label: bi('Priority DAG Q', 'Priority DAG Q'),
          what: bi('Hàng đợi ưu tiên xuất bản nhanh 360p/720p trước, nén sâu 4K/AV1 sau.', 'Two-priority DAG queue prioritizing fast 720p publish ahead of 4K/AV1.'),
          how: bi('Đảm bảo người đăng có link xem ngay trong vài chục giây.', 'Lets creators share playable videos within seconds of upload.'),
          why: bi('Không để tác vụ nén AV1 nặng làm chậm các video mới đăng.', 'Prevents heavy AV1 jobs from delaying initial publication.'),
        },
        {
          id: 'transcoder',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'sparkles',
          col: 5.3,
          row: 0.7,
          replicas: 28,
          opsPerSec: 130,
          baseMs: 25,
          label: bi('ASIC Fleet ×28', 'ASIC Fleet ×28'),
          what: bi('Đàn 28 máy tăng tốc phần cứng (GPU/ASIC) tự động mở rộng theo Spot Instance.', '28 hardware-accelerated ASIC/GPU encoding workers.'),
          how: bi('Xử lý >3.600 phân đoạn tải lên/giây.', 'Processes >3,600 chunk jobs/s.'),
          why: bi('Hiệu suất trên mỗi USD cao gấp nhiều lần mã hoá thuần CPU.', 'Delivers high throughput per dollar via hardware acceleration.'),
        },
      ],
      links: [
        { id: 'c-cdn', from: 'client', to: 'cdn' },
        { id: 'cdn-shield', from: 'cdn', to: 'originShield', carries: 'r', label: bi('Miss 10%', 'Miss 10%') },
        { id: 'cdn-lb-w', from: 'cdn', to: 'lb', carries: 'w' },
        { id: 'shield-lb', from: 'originShield', to: 'lb', carries: 'r', label: bi('Miss 2%', 'Miss 2%') },
        { id: 'lb-api', from: 'lb', to: 'apiSvc' },
        { id: 'api-ms', from: 'apiSvc', to: 'metaStore', carries: 'r', fraction: 0.35 },
        { id: 'api-blob', from: 'apiSvc', to: 'blobOrigin', carries: 'r' },
        { id: 'api-tq', from: 'apiSvc', to: 'transcodeQueue', mode: 'async', carries: 'w' },
        { id: 'tq-enc', from: 'transcodeQueue', to: 'transcoder', mode: 'pull' },
      ],
      routes: {
        cdn: 'split',
        apiSvc: 'all-parallel',
      },
      zones: [
        { id: 'z-cdn4', nodeIds: ['cdn', 'originShield'], label: bi('98% EDGE + SHIELD OFFLOAD', '98% EDGE + SHIELD OFFLOAD'), tone: 'blue' },
      ],
      noteCard: {
        title: bi('v4 · Edge + Origin Shield', 'v4 · Edge + Origin Shield'),
        lines: [
          { text: bi('98% lượt xem dừng ở CDN + Shield', '98% of views served by CDN + Shield'), tone: 'good' },
          { text: bi('Chịu tải > 130.000 segment/s · p99 < 15 ms', 'Sustains > 130K seg/s · p99 < 15 ms'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 8. PAYMENT & DOUBLE-ENTRY LEDGER — Linked Module: S7-06
 * ============================================================================ */
const CASE_PAYMENT_LEDGER: SdDesignCase = {
  id: 'payment-ledger',
  order: 8,
  linkedModuleId: 'S7-06',
  domainTag: bi('ACID Ledger · Idempotency-Key · Outbox & Saga', 'ACID Ledger · Idempotency-Key · Outbox & Saga'),
  difficulty: 'Advanced',
  title: bi('Hệ thống Thanh toán & Sổ cái kép (Payment & Ledger)', 'Payment & Double-Entry Ledger System'),
  subtitle: bi(
    'Đảm bảo đúng từng đồng với khóa chống trùng xuyên suốt (Idempotency-Key), sổ cái kế toán kép bất biến (Append-Only Nợ/Có) và đối soát tự động khi cổng ngân hàng Timeout.',
    'Zero-discrepancy money movement using end-to-end Idempotency-Keys, append-only Double-Entry Ledgers, Transactional Outbox, and automated PSP reconciliation.'
  ),
  problemBrief: bi(
    'Thiết kế hệ thống xử lý thanh toán đơn hàng và sổ cái nội bộ kết nối với các cổng thanh toán thẻ/ví bên ngoài (PSP), đảm bảo không bao giờ trừ tiền hai lần hoặc thất thoát số dư khi mạng lỗi.',
    'Design a payment execution and internal double-entry ledger platform integrating external card/wallet PSPs with strict guarantees against double-charging or lost funds.'
  ),
  clarifyingQuestions: [
    {
      id: 'pay-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Lưu lượng giao dịch trung bình hàng ngày và đỉnh điểm trong các sự kiện mở bán chớp nhoáng (Flash Sale) là bao nhiêu?',
        'What is the baseline transaction rate and the peak RPS during major e-commerce Flash Sales?'
      ),
      answer: bi(
        'Trung bình ~2.500 req/s (1.000 lệnh thanh toán + 1.500 truy vấn trạng thái/số dư); trong các khung giờ Flash Sale đỉnh điểm đạt 50.000 req/s (~20.000 lệnh thanh toán/giây).',
        '~2,500 req/s average (1,000 charges + 1,500 status/balance checks), surging to 50,000 req/s (~20,000 charges/s) during major Flash Sales.'
      ),
      rationale: bi(
        'Ở 20.000 giao dịch tiền tệ/giây, một bảng tài khoản tập trung hoặc khóa chờ mạng ngoài sẽ nghẽn cứng, đặc biệt trên tài khoản ví của nhà bán hàng lớn (Hot Merchant Account).',
        '20,000 money movements/s expose severe lock contention on hot merchant accounts and external PSP calls.'
      ),
    },
    {
      id: 'pay-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Dữ liệu số dư nên lưu bằng một cột balance cập nhật đè hay theo nguyên tắc Sổ cái kế toán kép (Double-Entry Ledger)?',
        'Should account balances be stored only as mutable balance columns or via an immutable Double-Entry Ledger?'
      ),
      answer: bi(
        'Bắt buộc dùng Sổ cái kế toán kép chỉ thêm mới (Append-only): mỗi giao dịch ghi ít nhất 2 dòng (1 dòng Nợ -X, 1 dòng Có +X, tổng đại số luôn bằng 0) bằng số nguyên đơn vị nhỏ nhất (BIGINT xu/đồng).',
        'Strictly append-only Double-Entry Ledger using integer minor units (BIGINT cents): every transfer records matching Debit (-X) and Credit (+X) entries summing to zero.'
      ),
      rationale: bi(
        'Mọi thay đổi tiền tệ đều có dấu vết kiểm toán bất biến, không bị sai số dấu phẩy động và dễ dàng phát hiện sai lệch khi cộng tổng toàn hệ thống.',
        'Provides a tamper-evident audit trail, zero floating-point rounding bugs, and mathematical self-verification.'
      ),
    },
    {
      id: 'pay-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Giữa tính nhất quán tiền tệ (Consistency) và độ trễ cực thấp, hệ thống ưu tiên điều gì và xử lý giữ kết nối DB ra sao?',
        'How do we prioritize strong financial consistency while avoiding database connection-pool exhaustion?'
      ),
      answer: bi(
        'Tính đúng đắn và ACID là bất khả xâm phạm; tuyệt đối KHÔNG bao giờ mở Transaction giữ khoá dòng Database trong lúc gọi HTTP chờ cổng ngân hàng bên ngoài (PSP).',
        'Financial correctness is non-negotiable; NEVER hold an open DB transaction lock across an external PSP network call.'
      ),
      rationale: bi(
        'Tách giao dịch thành máy trạng thái nhiều bước ngắn: (1) Ghi CREATED cục bộ rồi đóng TX → (2) Gọi PSP ngoài DB lock → (3) Ghi CAPTURED + cặp bút toán Ledger trong TX ngắn thứ hai.',
        'Splits execution into short local DB transactions flanking external PSP calls via state machines and Transactional Outbox.'
      ),
    },
    {
      id: 'pay-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Khi gọi cổng thẻ (PSP) bị Timeout — tức không rõ ngân hàng đã trừ tiền khách hay chưa — và người dùng bấm "Thanh toán" lần nữa thì sao?',
        'What happens when an external PSP call times out (unknown outcome) and the client retries the payment?'
      ),
      answer: bi(
        'Client gửi kèm Idempotency-Key gắn với đơn hàng; Payment Service lưu trạng thái khóa này và truyền chính khóa đó sang PSP khi thử lại; ban đêm chạy đối soát (Reconciliation) so tệp sao kê PSP với Ledger.',
        'Enforce end-to-end Idempotency-Keys from Client → Payment Service → PSP; treat timeouts as IN_FLIGHT (query/retry with same key, never create a new charge), backed by daily Settlement Reconciliation.'
      ),
      rationale: bi(
        'Đây là nguyên tắc cốt lõi nhất của hệ thống thanh toán: Timeout nghĩa là "chưa biết kết quả", phải hỏi lại/thử lại trên cùng Idempotency-Key chứ không tạo giao dịch mới.',
        'Core payment invariant: timeout means "unknown", requiring idempotent status recovery and nightly settlement reconciliation.'
      ),
    },
    {
      id: 'pay-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Biểu tượng ổ khoá bảo mật bên cạnh nút Thanh toán nên hiển thị màu vàng kim hay xanh ngọc?',
        'Should the padlock icon beside the Pay Now button be gold or emerald green?'
      ),
      answer: bi(
        'Chi tiết giao diện trên màn hình thanh toán của ứng dụng khách.',
        'Frontend UI styling detail.'
      ),
      rationale: bi(
        'Không bảo vệ được sổ cái khỏi lỗi trừ tiền hai lần hay sai lệch đối soát.',
        'Does not prevent double-charging, lock starvation, or ledger drift.'
      ),
    },
    {
      id: 'pay-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên lưu số tiền bằng kiểu FLOAT 32-bit để tiết kiệm 4 byte dung lượng đĩa cho mỗi bút toán không?',
        'Should we store monetary amounts as 32-bit IEEE FLOATs to save 4 bytes per ledger row?'
      ),
      answer: bi(
        'Cấm tuyệt đối trong tài chính vì biểu diễn nhị phân gây sai số làm tròn (0.1 + 0.2 = 0.300000004).',
        'Strictly forbidden in financial systems due to binary floating-point rounding errors.'
      ),
      rationale: bi(
        'Luôn dùng số nguyên BIGINT lưu theo đơn vị tiền nhỏ nhất (ví dụ cents/đồng) kèm mã tiền tệ ISO-4217.',
        'Always represent money as exact BIGINT minor units plus an explicit currency code.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('2,5K TB / 50K đỉnh req/s (Flash Sale)', '2.5K avg / 50K peak req/s (Flash Sale)'),
    readRps: bi('30.000 đỉnh tra cứu trạng thái & số dư/s', '30,000 peak status & balance reads/s'),
    writeRps: bi('20.000 đỉnh giao dịch & bút toán kép/s', '20,000 peak charges & ledger pairs/s'),
    readWriteRatio: bi('60 : 40 (Status/Balance : Charge)', '60 : 40 (Status/Balance : Charge)'),
    storagePerDay: bi('~1,2 GB/ngày thường · lưu kiểm toán ≥ 7 năm', '~1.2 GB/normal day · ≥7-year audit retention'),
    memoryOrBandwidth: bi('BIGINT xu/đồng · Tổng Nợ + Có ≡ 0', 'BIGINT minor units · Σ(Debit + Credit) ≡ 0'),
    slos: [
      bi('0% trừ tiền trùng (Idempotent)', 'Zero double-charges (Idempotent)'),
      bi('ACID Ledger bất biến (Append-only)', 'Immutable ACID Double-Entry Ledger'),
      bi('Đối soát tự động T+1 (Reconciliation)', 'Automated T+1 PSP Reconciliation'),
    ],
    snakeSummary: {
      scope: bi('Khởi tạo PaymentIntent, gọi PSP thu tiền, ghi sổ cái kép Nợ/Có, phát sự kiện & đối soát.', 'Create PaymentIntent, execute PSP charge, record Debit/Credit ledger, emit Outbox & reconcile.'),
      numbers: bi('50K đỉnh req/s (20K ghi/s), BIGINT tiền tệ, giữ khóa Idempotency tối thiểu 24–72h.', '50K peak req/s (20K writes/s), BIGINT amounts, 24–72h Idempotency-Key retention.'),
      api: bi('POST /v1/payments (Header: Idempotency-Key) · GET /v1/payments/{id}.', 'POST /v1/payments (Header: Idempotency-Key) · GET /v1/payments/{id}.'),
      keyComponents: bi('Payment Gateway, Idempotency Store, Payment Svc, Partitioned ACID Ledger, Outbox + Saga Workers.', 'Payment Gateway, Idempotency Store, Payment Svc, Partitioned ACID Ledger, Outbox + Saga Workers.'),
      elaborate: bi('Không giữ DB lock khi gọi PSP, tách Sub-accounts cho ví nhà bán lớn, đối soát sao kê hàng ngày.', 'Never hold DB locks across PSP calls, shard hot merchant wallets into sub-accounts, daily reconciliation.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'pay',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('Giữ Transaction SQL trong lúc gọi đồng bộ cổng PSP', 'Inline PSP Call Inside Open SQL Transaction'),
      eraTag: bi('100 req/s · Cạn kiệt Connection Pool & Dễ trừ trùng', '100 req/s · Pool Starvation & Double-Charge Risk'),
      targetRps: 100,
      readRatio: 0.6,
      seed: 7371,
      summary: bi(
        'Ứng dụng mở giao dịch SQL, gọi đồng bộ sang cổng thẻ ngân hàng (PSP ~70 ms) rồi mới ghi sổ cái và COMMIT; chưa có khóa Idempotency nên khách bấm lại sau Timeout dễ tạo 2 lệnh trừ tiền.',
        'Monolith opens a SQL transaction, calls the external card PSP synchronously (~70 ms), and commits afterward without idempotency keys.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (500 req/s ⇒ 200 lệnh thu tiền/giây), cổng PSP ngoài chậm làm cạn sạch kết nối của Pay Monolith và khoá cứng bảng SQL.',
        'At 5x load (500 req/s ⇒ 200 charges/s), slow external PSP calls saturate Pay Monolith and lock up SQL connections.'
      ),
      whatChanged: [
        diff('+', '1 Payment Monolith xử lý thu tiền đồng bộ trên một luồng duy nhất', 'Single Payment Monolith executing inline synchronous charges'),
        diff('+', '1 SQL Database vừa giữ khoá giao dịch vừa chờ mạng ngoài PSP', 'Single SQL holding open locks while waiting on external PSP HTTP'),
      ],
      tradeOffs: [
        trade(
          'Gói chung lời gọi cổng ngân hàng bên ngoài vào trong một hàm HTTP đồng bộ đơn giản',
          'Wrap external PSP call inline inside a single synchronous handler',
          'Luồng mã nguồn tuyến tính dễ đọc ở quy mô vài giao dịch mỗi phút',
          'Linear control flow easy to read at tiny volume',
          'Giữ khoá DB lâu làm nghẽn toàn hệ thống và gây rủi ro trừ tiền 2 lần khi mạng Timeout',
          'Exhausts DB connection pools when PSP slows down and risks duplicate charges on retry'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Checkout App', 'Checkout App'),
          what: bi('Người mua bấm thanh toán và kiểm tra trạng thái đơn.', 'Shoppers submitting payments and polling order status.'),
          how: bi('60% đọc trạng thái/số dư, 40% thực thi giao dịch.', '60% status/balance reads, 40% payment executions.'),
          why: bi('Dễ bấm lại nút Thanh toán nếu thấy vòng xoay chờ quá lâu.', 'Likely to retry if checkout spinner hangs.'),
        },
        {
          id: 'paySvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 550,
          baseMs: 16,
          label: bi('Pay Monolith', 'Pay Monolith'),
          what: bi('Máy chủ đơn chưa tách khóa chống trùng lặp.', 'Single payment server without idempotency deduplication.'),
          how: bi('Chờ đồng bộ cả SQL lẫn cổng ngân hàng ngoài.', 'Blocks synchronously on both SQL and external PSP.'),
          why: bi('Cạn kiệt luồng rất nhanh khi PSP phản hồi chậm.', 'Starves worker threads whenever PSP latency rises.'),
        },
        {
          id: 'ledgerDb',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: -0.55,
          replicas: 1,
          opsPerSec: 320,
          baseMs: 8,
          label: bi('Ledger SQL', 'Ledger SQL'),
          what: bi('Cơ sở dữ liệu lưu đơn thanh toán và số dư.', 'Single SQL database storing payment rows and balances.'),
          how: bi('Bị chiếm giữ kết nối lâu bởi các giao dịch đang chờ PSP.', 'Suffers long-held locks across external network calls.'),
          why: bi('Không thể mở rộng cho các đợt mở bán lớn.', 'Cannot scale to flash-sale concurrency.'),
        },
        {
          id: 'pspGw',
          kind: 'service',
          shape: 'block',
          tone: 'purple',
          icon: 'globe',
          col: 2,
          row: 0.55,
          replicas: 1,
          opsPerSec: 170,
          baseMs: 70,
          zone: 'internet',
          label: bi('External PSP', 'External PSP'),
          what: bi('Cổng thanh toán thẻ quốc tế / ngân hàng bên ngoài.', 'External card network / banking PSP gateway.'),
          how: bi('Độ trễ ~70 ms qua mạng liên ngân hàng.', 'Averages ~70 ms inter-bank authorization latency.'),
          why: bi('Điểm nghẽn trực tiếp ở mức >170 giao dịch/giây.', 'Saturates inline callers above ~170 charges/s.'),
        },
      ],
      links: [
        { id: 'c-pay', from: 'client', to: 'paySvc' },
        { id: 'pay-sql', from: 'paySvc', to: 'ledgerDb', label: bi('Hold Lock', 'Hold Lock') },
        { id: 'pay-psp', from: 'paySvc', to: 'pspGw', carries: 'w', netClass: 'internet', label: bi('Sync 70ms', 'Sync 70ms') },
      ],
      routes: {
        paySvc: 'all-sequential',
      },
      noteCard: {
        title: bi('v1 · Giữ Lock chờ PSP', 'v1 · Lock Held Across PSP'),
        lines: [
          { text: bi('Chưa có Idempotency: dễ trừ tiền 2 lần', 'No Idempotency: double-charge risk'), tone: 'bad' },
          { text: bi('PSP 70 ms làm cạn Pool ở 500 req/s', '70 ms PSP exhausts pool at 500 req/s'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'pay',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('Idempotency Store + Tách DB Lock khỏi PSP + Sổ cái kép ACID', 'Idempotency Store + Uncoupled Lock + Double-Entry SQL'),
      eraTag: bi('2.000 req/s · Chống trừ tiền trùng', '2,000 req/s · Idempotent State Machine'),
      targetRps: 2000,
      readRatio: 0.6,
      seed: 7372,
      summary: bi(
        'Bắt buộc kiểm tra Idempotency-Key nguyên tử, tách giao dịch thành hai bước ngắn không giữ khoá DB khi gọi PSP, và ghi sổ cái kế toán kép (Nợ/Có tổng bằng 0) vào SQL có Read Replica.',
        'Enforces atomic Idempotency-Keys, releases DB locks before calling external PSPs, and records immutable Debit/Credit pairs in Primary SQL with Read Replicas.'
      ),
      whyNextStage: bi(
        'Ở 5× tải (10.000 req/s ⇒ 4.000 lệnh ghi thanh toán/giây), cơ sở dữ liệu Ledger SQL đơn vùng và việc chờ PSP trực tiếp trên kết nối của người mua làm nghẽn cả SQL Primary lẫn luồng thực thi.',
        'At 5x Flash-Sale load (10,000 req/s ⇒ 4,000 writes/s), single-primary Ledger SQL and synchronous PSP waits saturate write capacity.'
      ),
      whatChanged: [
        diff('+', 'Thêm Idempotency & Status Cache trả ngay kết quả cũ nếu Client gửi lặp cùng khóa', 'Add atomic Idempotency & Status Cache deduplicating client retries'),
        diff('~', 'Chuyển sang máy trạng thái CREATED → PSP Call (ngoài DB TX) → CAPTURED + Double-Entry', 'Split into short local transactions flanking lock-free external PSP calls'),
        diff('+', 'Tách truy vấn trạng thái/lịch sử sang Read Replicas để nhường IOPS ghi cho Primary', 'Offload status and statement reads to SQL Read Replicas'),
      ],
      tradeOffs: [
        trade(
          'Tách làm 2 giao dịch ngắn (lưu CREATED trước, gọi PSP ngoài khoá, cập nhật CAPTURED sau)',
          'Two short local DB transactions instead of holding 1 transaction across PSP',
          'Giải phóng Connection Pool gấp ~10×, không bao giờ treo khoá DB khi ngân hàng chậm',
          '10x higher DB connection efficiency; slow banks never stall database locks',
          'Xuất hiện trạng thái trung gian EXECUTING cần tiến trình quét phục hồi nếu máy App tắt đột ngột',
          'Introduces intermediate EXECUTING state requiring background recovery sweeps on crash'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Checkout App', 'Checkout App'),
          what: bi('2.000 req/s gửi kèm Header Idempotency-Key (UUID đơn hàng).', '2,000 req/s carrying mandatory Idempotency-Key headers.'),
          how: bi('An tâm thử lại khi mạng di động rớt mà không sợ bị trừ tiền lặp.', 'Safely retries on flaky networks without duplicate charges.'),
          why: bi('Bảo vệ quyền lợi khách hàng ngay từ giao thức API.', 'Guarantees at-most-once financial side effects.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải điều phối vào 4 máy Payment Service.', 'Load Balancer routing to 4 Payment Service instances.'),
          how: bi('Định tuyến Round-robin.', 'Even traffic distribution.'),
          why: bi('Loại bỏ giới hạn 1 máy ứng dụng.', 'Scales payment orchestration.'),
        },
        {
          id: 'paySvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 6,
          opsPerSec: 2000,
          baseMs: 10,
          label: bi('Payment Svc ×6', 'Payment Svc ×6'),
          what: bi('Thực thi máy trạng thái thanh toán và ghi cặp bút toán Nợ/Có.', '6 stateless instances running payment state machines and ledger entries.'),
          how: bi('Truyền chính Idempotency-Key đó xuống PSP.', 'Forwards the exact Idempotency-Key downstream to PSP.'),
          why: bi('Chống trùng lặp xuyên suốt từ đầu đến cuối.', 'End-to-end idempotency across internal and external hops.'),
        },
        {
          id: 'idemCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.65,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.86 },
          label: bi('Idem & Status', 'Idem & Status'),
          what: bi('Kho kiểm tra nhanh khóa trùng lặp và đệm trạng thái PaymentIntent.', 'Fast idempotency lock and PaymentIntent status cache.'),
          how: bi('Phục vụ 86% lượt hỏi trạng thái đơn mà không chạm đĩa.', 'Serves 86% of status polls in 0.5 ms.'),
          why: bi('Giảm tải đọc khi người mua liên tục làm mới trang.', 'Absorbs checkout status polling.'),
        },
        {
          id: 'readRep',
          kind: 'sql',
          shape: 'db',
          tone: 'blue',
          col: 4,
          row: -0.65,
          replicas: 2,
          opsPerSec: 900,
          baseMs: 6,
          label: bi('Ledger Replica', 'Ledger Replica'),
          what: bi('Bản sao đọc phục vụ sao kê lịch sử và đối chiếu.', 'SQL Read Replicas serving account statements and history.'),
          how: bi('Nhận luồng nhân bản từ Ledger Primary.', 'Replicates append-only ledger rows from Primary.'),
          why: bi('Giữ nguyên băng thông của Primary cho giao dịch ghi.', 'Isolates statement queries from live charges.'),
        },
        {
          id: 'ledgerDb',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 3.3,
          row: 0.1,
          replicas: 1,
          opsPerSec: 1500,
          baseMs: 6,
          label: bi('Ledger Primary', 'Ledger Primary'),
          what: bi('Cơ sở dữ liệu ACID lưu bảng bút toán kép bất biến (BIGINT).', 'Primary ACID SQL storing immutable Debit/Credit BIGINT rows.'),
          how: bi('Nhận 800 giao dịch ghi/giây ở mức tải 2.000 req/s.', 'Commits 800 write transactions/s at 2K RPS.'),
          why: bi('Chạm trần IOPS ghi đơn máy khi vọt lên 4.000 ghi/giây (mốc ×5).', 'Hits single-primary write ceiling under a 5x Flash Sale.'),
        },
        {
          id: 'pspGw',
          kind: 'service',
          shape: 'block',
          tone: 'purple',
          icon: 'globe',
          col: 3.8,
          row: 0.75,
          replicas: 2,
          opsPerSec: 750,
          baseMs: 45,
          zone: 'internet',
          label: bi('PSP Connectors', 'PSP Connectors'),
          what: bi('Kết nối đồng bộ tới cổng thẻ/ví bên ngoài.', 'Synchronous outbound connectors to card/wallet PSPs.'),
          how: bi('Tổng năng lực ~1.500 lệnh thu tiền/giây.', 'Handles ~1,500 inline authorizations/s.'),
          why: bi('Nghẽn ở 4.000 lệnh thu/giây nếu không chuyển sang thực thi nền Outbox.', 'Saturates under 4,000 charges/s without async Outbox execution.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-pay', from: 'lb', to: 'paySvc' },
        { id: 'pay-idem', from: 'paySvc', to: 'idemCache', carries: 'r' },
        { id: 'idem-rep', from: 'idemCache', to: 'readRep', carries: 'r' },
        { id: 'pay-ledger', from: 'paySvc', to: 'ledgerDb', carries: 'w', label: bi('Debit/Credit', 'Debit/Credit') },
        { id: 'ledger-rep', from: 'ledgerDb', to: 'readRep', mode: 'replicate' },
        { id: 'pay-psp', from: 'paySvc', to: 'pspGw', carries: 'w', netClass: 'internet' },
      ],
      routes: {
        paySvc: 'all-sequential',
      },
      noteCard: {
        title: bi('v2 · Idempotency + Sổ cái kép', 'v2 · Idempotent Double-Entry'),
        lines: [
          { text: bi('Không giữ DB Lock khi gọi PSP', 'Zero DB locks held during PSP call'), tone: 'good' },
          { text: bi('1 Ledger Primary nghẽn ở Flash Sale ×5', 'Single Ledger saturates on ×5 Flash Sale'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'pay',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Transactional Outbox + Async Saga Workers + Partitioned ACID Ledger', 'Transactional Outbox + Saga Workers + Partitioned Ledger'),
      eraTag: bi('15.000 req/s · Chịu Flash Sale lớn', '15,000 req/s · Outbox & Partitioned ACID'),
      targetRps: 15000,
      readRatio: 0.6,
      seed: 7373,
      summary: bi(
        'Áp dụng mẫu Transactional Outbox: ghi PaymentIntent kèm bản ghi Outbox trong cùng 1 giao dịch cục bộ rồi trả lời ngay (~20 ms), để đội PSP Saga Worker xử lý thu tiền, thử lại có Backoff và cập nhật phân vùng Ledger.',
        'Uses Transactional Outbox to atomically persist PaymentIntent + Outbox event (~20 ms ACK), while async Saga Workers execute PSP calls with jittered retries against a 4-shard ACID Ledger.'
      ),
      whyNextStage: bi(
        'Ở 5× tải siêu sự kiện (75.000 req/s ⇒ 30.000 giao dịch/giây), ví của một số nhà bán hàng lớn nhận hàng nghìn khoản cộng tiền/giây làm nghẽn khóa dòng (Hot Account) cùng với giới hạn 4 phân vùng.',
        'At 5x mega-sale load (75,000 req/s ⇒ 30,000 charges/s), hot merchant settlement wallets suffer row-lock contention and saturate the 4-shard Ledger and Saga pool.'
      ),
      whatChanged: [
        diff('+', 'Dùng Transactional Outbox Queue đảm bảo không bao giờ ghi DB xong mà mất sự kiện gọi PSP', 'Add Transactional Outbox Queue guaranteeing atomic DB write + event emission'),
        diff('+', 'Chuyển thực thi PSP sang cụm Saga Worker bất đồng bộ có Retry Backoff + DLQ', 'Move external PSP execution to async Saga Workers with backoff and DLQ'),
        diff('~', 'Phân mảnh sổ cái sang cụm NewSQL/ACID 4 phân vùng theo account_id / payment_id', 'Partition ACID Ledger across 4 shards keyed by account/payment ID'),
      ],
      tradeOffs: [
        trade(
          'Thực thi thanh toán bất đồng bộ qua Outbox + Saga (trả trạng thái PROCESSING rồi báo kết quả qua Webhook/SSE)',
          'Async payment execution via Outbox + Saga with webhook/SSE completion',
          'Hấp thụ mượt đợt dồn đơn Flash Sale mà không làm rớt giao dịch khi ngân hàng phản hồi chậm',
          'Absorbs Flash-Sale spikes cleanly and survives temporary bank slowdowns via durable retries',
          'Giao diện thanh toán cần lắng nghe trạng thái hoàn tất bất đồng bộ (1–3 giây) thay vì 1 vòng HTTP duy nhất',
          'Checkout UI polls or subscribes via SSE/Webhook for final confirmation (~1–3s)'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Flash Sale 15K', 'Flash Sale 15K'),
          what: bi('15.000 yêu cầu khởi tạo và theo dõi thanh toán mỗi giây.', '15,000 checkout and status requests/s.'),
          how: bi('Nhận PaymentIntent nhanh và nhận xác nhận cuối qua SSE/Webhook.', 'Receives fast PaymentIntent ACK followed by async confirmation.'),
          why: bi('Không còn bị lỗi Timeout trắng trang lúc cao điểm.', 'Eliminates ambiguous browser timeouts during sales.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải phân phối vào cụm Payment API.', 'Active-active Load Balancer pair.'),
          how: bi('Thông lượng 90.000 req/s.', 'Routes up to 90,000 req/s.'),
          why: bi('Đảm bảo độ sẵn sàng tầng tiếp nhận.', 'Zero entry SPOF.'),
        },
        {
          id: 'paySvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 16,
          opsPerSec: 3400,
          baseMs: 5.5,
          label: bi('Payment API ×16', 'Payment API ×16'),
          what: bi('Kiểm tra Idempotency, ghi PaymentIntent + Outbox và trả kết quả sớm.', '16 stateless servers recording PaymentIntents + Outbox atomically.'),
          how: bi('Không còn bị giữ chân bởi mạng liên ngân hàng 70 ms.', 'Completely decoupled from 70 ms external bank RTT.'),
          why: bi('Độ trễ API giảm sâu xuống ~20 ms.', 'Drops API p99 latency to ~20 ms.'),
        },
        {
          id: 'idemCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3.2,
          row: -0.65,
          replicas: 2,
          opsPerSec: 32000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.91 },
          label: bi('Idem Cluster', 'Idem Cluster'),
          what: bi('Cụm Redis nhân bản lưu khóa chống trùng và trạng thái giao dịch nóng.', 'Replicated Redis cluster serving idempotency locks and live status.'),
          how: bi('Đạt 91% Hit trên các lượt kiểm tra trạng thái đơn.', 'Serves 91% of status polls in RAM.'),
          why: bi('Giữ cho cụm Ledger tập trung vào giao dịch ghi ACID.', 'Shields ACID Ledger shards from status read floods.'),
        },
        {
          id: 'ledgerDb',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 4.3,
          row: -0.25,
          replicas: 4,
          opsPerSec: 2600,
          baseMs: 4.5,
          params: { shards: 4 },
          label: bi('ACID Ledger ×4', 'ACID Ledger ×4'),
          what: bi('Cụm cơ sở dữ liệu phân tán ACID (kiểu CockroachDB/Spanner/Vitess) 4 phân vùng.', '4-shard distributed ACID SQL/NewSQL ledger store.'),
          how: bi('Ghi bền vững 6.000 giao dịch/giây (ở mốc 15K) kèm bản ghi Outbox.', 'Commits 6,000 ACID writes/s alongside Outbox records.'),
          why: bi('Mở rộng ngang thông lượng ghi mà vẫn giữ toàn vẹn giao dịch.', 'Scales ACID write throughput horizontally.'),
        },
        {
          id: 'outboxQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3.2,
          row: 0.65,
          replicas: 1,
          opsPerSec: 45000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 250000 },
          label: bi('Outbox Stream', 'Outbox Stream'),
          what: bi('Luồng sự kiện đáng tin cậy đọc từ bảng Outbox / CDC.', 'Durable event stream relayed from transactional Outbox.'),
          how: bi('Đảm bảo mọi PaymentIntent đã lưu đều chắc chắn được đưa tới Saga Worker.', 'Guarantees zero lost events between DB commit and queue publish.'),
          why: bi('Khắc phục triệt để lỗi ghi DB xong nhưng sập trước khi bắn Queue.', 'Eliminates dual-write inconsistency.'),
        },
        {
          id: 'sagaWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'git',
          col: 4.3,
          row: 0.65,
          replicas: 18,
          opsPerSec: 520,
          baseMs: 32,
          label: bi('PSP Saga ×18', 'PSP Saga ×18'),
          what: bi('18 Worker điều phối gọi PSP, xử lý hoàn tiền bù trừ (Compensation) và ghi bút toán kết sổ.', '18 Saga workers executing PSP charges, compensations, and ledger settlements.'),
          how: bi('Tổng năng lực ~9.360 giao dịch thu tiền/giây.', 'Processes ~9,360 payment executions/s.'),
          why: bi('Chịu tốt 6.000 ghi/giây ở 15K, chạm trần khi vọt 5× lên 30.000 ghi/giây.', 'Handles 6K writes/s cleanly; saturates under 30K writes/s at ×5.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-pay', from: 'lb', to: 'paySvc' },
        { id: 'pay-idem', from: 'paySvc', to: 'idemCache', carries: 'r' },
        { id: 'idem-ledger', from: 'idemCache', to: 'ledgerDb', carries: 'r' },
        { id: 'pay-ledger', from: 'paySvc', to: 'ledgerDb', carries: 'w', label: bi('TX + Outbox', 'TX + Outbox') },
        { id: 'pay-outbox', from: 'paySvc', to: 'outboxQueue', mode: 'async', carries: 'w' },
        { id: 'outbox-saga', from: 'outboxQueue', to: 'sagaWorker', mode: 'pull' },
      ],
      routes: {
        paySvc: 'all-parallel',
      },
      zones: [
        { id: 'z-outbox', nodeIds: ['ledgerDb', 'outboxQueue', 'sagaWorker'], label: bi('OUTBOX + SAGA EXECUTION', 'OUTBOX + SAGA EXECUTION'), tone: 'orange' },
      ],
      noteCard: {
        title: bi('v3 · Outbox + Saga + 4 Shards', 'v3 · Outbox + Saga + 4 Shards'),
        lines: [
          { text: bi('Outbox đảm bảo 0% mất lệnh thanh toán', 'Outbox guarantees zero lost charges'), tone: 'good' },
          { text: bi('Ví nhà bán lớn gây tranh chấp khoá ở ×5', 'Hot merchant wallet contention at ×5'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'pay',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Sub-Account Sharding cho Ví nóng + Multi-PSP Router + T+1 Reconciliation', 'Sub-Account Hot-Wallet Sharding + Multi-PSP + Reconciliation'),
      eraTag: bi('50.000+ req/s · Chuẩn Tài chính Cấp cao', '50,000+ req/s · Financial-Grade Multi-AZ'),
      targetRps: 50000,
      readRatio: 0.6,
      seed: 7374,
      summary: bi(
        'Tách ví của nhà bán hàng siêu lớn thành N tài khoản phụ (Sub-accounts / Sharded Wallet Buckets) trên cụm 12 phân vùng ACID Multi-AZ để xóa nghẽn khóa dòng, định tuyến thông minh qua nhiều PSP kèm đối soát tự động.',
        'Splits hot merchant settlement accounts into N sharded sub-accounts across a 12-shard Multi-AZ ACID Ledger, pairs multi-PSP smart routing with Circuit Breakers, and runs continuous settlement reconciliation.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 đạt >90.000 req/s (~36.000 giao dịch tiền tệ ACID/giây) với độ chính xác tuyệt đối đến từng đồng và tự động phát hiện mọi sai lệch sao kê liên ngân hàng.',
        'Sustains >90,000 req/s (~36,000 ACID charges/s) with mathematical ledger invariants and automated external settlement verification.'
      ),
      whatChanged: [
        diff('+', 'Áp dụng Sub-Account Sharding (chia ví Merchant nóng thành 16 ngăn con) xoá tranh chấp khoá dòng', 'Shard hot merchant accounts into 16 sub-ledger buckets eliminating row-lock contention'),
        diff('+', 'Thêm cổng bảo mật PCI/Fraud Gateway + Định tuyến đa cổng PSP tự chuyển khi lỗi', 'Add PCI/Risk Edge Gateway + Multi-PSP smart routing with Circuit Breakers'),
        diff('+', 'Vận hành luồng Đối soát tự động (Reconciliation) kiểm chứng Σ(Ledger) == Sao kê ngân hàng', 'Run continuous Settlement Reconciliation verifying Ledger parity against bank files'),
      ],
      tradeOffs: [
        trade(
          'Chia ví của nhà bán hàng lớn thành N tài khoản con (Sub-accounts) cộng gộp định kỳ',
          'Split hot merchant wallets into N sub-accounts aggregated on settlement',
          'Cho phép 20.000 người mua trả tiền cho cùng 1 siêu thị cùng lúc mà không xếp hàng chờ 1 dòng DB',
          'Allows 20,000 concurrent buyers to pay the same mega-merchant with zero row-lock queueing',
          'Truy vấn tổng số dư tức thời của nhà bán lớn cần cộng tổng N tài khoản con (O(N) với N=16 rất nhỏ)',
          'Real-time merchant balance reads sum across N=16 sub-accounts'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('50K Peak Pay', '50K Peak Pay'),
          what: bi('50.000 yêu cầu thanh toán và tra cứu mỗi giây ngày siêu hội mua sắm.', '50,000 payment and status requests/s during mega-sale peaks.'),
          how: bi('Mã hoá thông tin thẻ bằng Tokenization chuẩn PCI-DSS ngay từ đầu.', 'Uses tokenized payment instruments (PCI-DSS scope isolation).'),
          why: bi('Không để dữ liệu thẻ thô đi vào các dịch vụ thông thường.', 'Keeps raw PAN card data out of general microservices.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 5,
          opsPerSec: 22000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB ×5', 'Multi-AZ LB ×5'),
          what: bi('5 bộ cân bằng tải phân tán trên 3 Availability Zone.', '5-node Multi-AZ Load Balancer tier.'),
          how: bi('Thông lượng định tuyến 110.000 req/s.', 'Routes up to 110,000 req/s.'),
          why: bi('Dự phòng đa vùng cấp ngân hàng.', 'Financial-grade ingress redundancy.'),
        },
        {
          id: 'payGw',
          kind: 'gateway',
          shape: 'block',
          tone: 'purple',
          icon: 'shield',
          col: 2,
          row: 0,
          replicas: 22,
          opsPerSec: 4600,
          baseMs: 2.5,
          label: bi('PCI & Risk ×22', 'PCI & Risk ×22'),
          what: bi('Cổng xác thực chữ ký HMAC, chấm điểm gian lận nhanh và kiểm soát tốc độ.', '22 PCI gateways enforcing HMAC auth, fast fraud scoring, and rate limits.'),
          how: bi('Chặn sớm giao dịch bất thường dưới 3 ms.', 'Screens fraudulent card-testing attacks in <3 ms.'),
          why: bi('Bảo vệ tỷ lệ chấp nhận thẻ với các ngân hàng phát hành.', 'Protects merchant authorization rates with issuing banks.'),
        },
        {
          id: 'paySvc',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 36,
          opsPerSec: 2600,
          baseMs: 5,
          label: bi('Payment Svc ×36', 'Payment Svc ×36'),
          what: bi('36 máy chủ điều phối khóa chống trùng, chọn Sub-account ngẫu nhiên cho ví nóng và ghi Outbox.', '36 orchestrators enforcing idempotency, sub-account routing, and Outbox commits.'),
          how: bi('Năng lực xử lý ~93.600 req/s.', 'Delivers ~93,600 req/s capacity.'),
          why: bi('Đảm bảo API thanh toán luôn phản hồi nhanh dưới áp lực cao.', 'Maintains crisp sub-25ms checkout responses.'),
        },
        {
          id: 'idemCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4.2,
          row: -0.7,
          replicas: 4,
          opsPerSec: 35000,
          baseMs: 0.5,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.94 },
          label: bi('Idem Cluster ×4', 'Idem Cluster ×4'),
          what: bi('Cụm Redis Multi-AZ giữ khóa Idempotency và bộ đệm trạng thái giao dịch.', '4-node Multi-AZ Redis cluster for idempotency locks and status reads.'),
          how: bi('Giải quyết 94% lượt đọc trạng thái trong 0,5 ms.', 'Serves 94% of status queries in 0.5 ms.'),
          why: bi('Giảm tối đa truy vấn đọc xuống cụm sổ cái ACID.', 'Keeps read pressure off ACID ledger shards.'),
        },
        {
          id: 'ledgerDb',
          kind: 'nosql',
          shape: 'db',
          tone: 'orange',
          col: 5.3,
          row: -0.25,
          replicas: 12,
          opsPerSec: 3400,
          baseMs: 4,
          params: { shards: 12 },
          label: bi('ACID Ledger ×12', 'ACID Ledger ×12'),
          what: bi('12 phân vùng cơ sở dữ liệu ACID đồng thuận Quorum 3 AZ lưu sổ cái kép bất biến.', '12-shard Raft/Quorum Multi-AZ ACID database storing append-only Debit/Credit entries.'),
          how: bi('Nhờ tách 16 Sub-accounts cho ví nóng, 20.000 lệnh ghi/giây phân bổ phẳng trên cả 12 phân vùng.', 'Sub-account bucketing spreads 20,000 writes/s evenly across all 12 shards.'),
          why: bi('Đạt RPO = 0 (không mất 1 giao dịch nào ngay cả khi mất trọn 1 trung tâm dữ liệu).', 'Guarantees RPO = 0 across Availability Zone failures.'),
        },
        {
          id: 'outboxQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4.2,
          row: 0.7,
          replicas: 2,
          opsPerSec: 60000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 600000 },
          label: bi('Outbox & Recon', 'Outbox & Recon'),
          what: bi('Luồng sự kiện phân vùng nuôi cả thực thi PSP trực tuyến lẫn đối soát liên tục.', 'Partitioned durable stream driving Multi-PSP execution and reconciliation.'),
          how: bi('Giữ thứ tự sự kiện theo từng payment_id.', 'Preserves strict per-payment event ordering.'),
          why: bi('Đảm bảo không bỏ sót bất kỳ bước chuyển trạng thái nào.', 'Zero dropped financial state transitions.'),
        },
        {
          id: 'sagaWorker',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'git',
          col: 5.3,
          row: 0.7,
          replicas: 56,
          opsPerSec: 680,
          baseMs: 26,
          label: bi('Multi-PSP ×56', 'Multi-PSP ×56'),
          what: bi('56 Worker định tuyến đa cổng PSP (tự chuyển cổng dự phòng khi lỗi) kèm đối soát sao kê.', '56 workers routing across primary/backup PSPs and running continuous reconciliation.'),
          how: bi('Thông lượng thực thi >38.000 giao dịch thu tiền/giây.', 'Sustains >38,000 external payment executions/s.'),
          why: bi('Đảm bảo cả tỷ lệ thanh toán thành công cao lẫn sổ sách khớp 100%.', 'Maximizes payment conversion and guarantees 100% ledger reconciliation.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-gw', from: 'lb', to: 'payGw' },
        { id: 'gw-pay', from: 'payGw', to: 'paySvc' },
        { id: 'pay-idem', from: 'paySvc', to: 'idemCache', carries: 'r' },
        { id: 'idem-ledger', from: 'idemCache', to: 'ledgerDb', carries: 'r' },
        { id: 'pay-ledger', from: 'paySvc', to: 'ledgerDb', carries: 'w', label: bi('Sub-Account TX', 'Sub-Account TX') },
        { id: 'pay-outbox', from: 'paySvc', to: 'outboxQueue', mode: 'async', carries: 'w' },
        { id: 'outbox-saga', from: 'outboxQueue', to: 'sagaWorker', mode: 'pull' },
      ],
      routes: {
        paySvc: 'all-parallel',
      },
      zones: [
        { id: 'z-pay4', nodeIds: ['paySvc', 'ledgerDb', 'sagaWorker'], label: bi('RPO=0 LEDGER + MULTI-PSP SAGA', 'RPO=0 LEDGER + MULTI-PSP SAGA'), tone: 'green' },
      ],
      noteCard: {
        title: bi('v4 · Sub-Account + Multi-PSP', 'v4 · Sub-Account + Multi-PSP'),
        lines: [
          { text: bi('Sub-Account xoá nghẽn ví nhà bán lớn', 'Sub-accounts eliminate hot-wallet locks'), tone: 'good' },
          { text: bi('Chịu tải > 90.000 req/s · RPO = 0', 'Sustains > 90K req/s · RPO = 0 ACID'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

/* ============================================================================
 * 9. SEARCH TYPEAHEAD AUTOCOMPLETE — Linked Module: S7-07
 * ============================================================================ */
const CASE_SEARCH_AUTOCOMPLETE: SdDesignCase = {
  id: 'search-autocomplete',
  order: 9,
  linkedModuleId: 'S7-07',
  domainTag: bi('Precomputed Top-K Trie · Sub-30ms · Sampled Log', 'Precomputed Top-K Trie · Sub-30ms · Sampled Log'),
  difficulty: 'Intermediate',
  title: bi('Gợi ý tìm kiếm tức thời (Typeahead Autocomplete)', 'Search Typeahead Autocomplete'),
  subtitle: bi(
    'Trả về Top-10 cụm từ gợi ý dưới 30 ms trên mỗi nhịp gõ phím nhờ cấu trúc Prefix Trie lưu sẵn Top-K trong RAM, Edge Cache cho tiền tố ngắn và luồng tổng hợp tần suất lấy mẫu nền.',
    'Sub-30ms keystroke suggestions powered by in-memory Top-K Prefix Tries, Edge short-prefix caching, and sampled asynchronous log aggregation.'
  ),
  problemBrief: bi(
    'Thiết kế dịch vụ gợi ý từ khoá tức thời trên ô tìm kiếm: ngay khi người dùng gõ từng ký tự ("s", "sy", "sys"...), hệ thống hiển thị 10 cụm từ tìm kiếm phổ biến nhất bắt đầu bằng tiền tố đó.',
    'Design a real-time search autocomplete service that returns the top-10 ranked query completions after every keystroke as users type prefixes.'
  ),
  clarifyingQuestions: [
    {
      id: 'ac-q1',
      kind: 'essential',
      dimension: 'scale',
      question: bi(
        'Có bao nhiêu người tìm kiếm hàng ngày và tổng lưu lượng truy vấn tiền tố mỗi giây (Keystroke QPS) ở mức đỉnh là bao nhiêu?',
        'What is the daily search user base and the peak prefix-lookup QPS generated across keystrokes?'
      ),
      answer: bi(
        '20 triệu DAU thực hiện ~100 triệu lượt tìm/ngày, mỗi lượt gõ 5–6 ký tự (đã bật Debounce 100 ms ở trình duyệt) ⇒ trung bình ~15.000 QPS và đỉnh >60.000 QPS.',
        '20M DAU running ~100M searches/day at ~5–6 debounced keystrokes per search ⇒ ~15,000 QPS avg and >60,000 QPS peak.'
      ),
      rationale: bi(
        'Mỗi một câu tìm kiếm nhân thành 5–6 request tiền tố, đòi hỏi cơ chế đọc cực nhẹ hoàn toàn từ bộ nhớ RAM.',
        'Keystroke amplification multiplies search QPS 6x, requiring pure in-memory O(L) prefix lookups.'
      ),
    },
    {
      id: 'ac-q2',
      kind: 'essential',
      dimension: 'ratio',
      question: bi(
        'Chúng ta có cần sửa đổi trọng số trên cây Trie trực tiếp ngay ở mỗi lượt người dùng bấm tìm kiếm không?',
        'Must the live Prefix Trie mutate synchronously on every submitted search query, or can rankings update periodically?'
      ),
      answer: bi(
        'Không cập nhật trực tiếp trên mỗi lần tìm (~97% là đọc tiền tố, 3% là câu tìm hoàn chỉnh): cây Trie được xây lại bất biến ở nền mỗi 10–15 phút từ luồng log lấy mẫu (kèm lớp phủ nhỏ cho tin nóng).',
        'No inline trie mutations (~97% prefix reads, 3% submitted queries): rebuild immutable Trie snapshots asynchronously every 10–15 minutes from sampled logs.'
      ),
      rationale: bi(
        'Tách hẳn đường đọc bất biến không khoá (Lock-free Immutable Trie) khỏi đường tổng hợp tần suất giúp mỗi máy Trie phục vụ hàng chục nghìn QPS.',
        'Immutable lock-free Trie snapshots allow read servers to run at maximum memory speed with zero read-write lock contention.'
      ),
    },
    {
      id: 'ac-q3',
      kind: 'essential',
      dimension: 'sla',
      question: bi(
        'Độ trễ tối đa phía máy chủ là bao nhiêu để người dùng cảm thấy gợi ý xuất hiện tức thì theo tay gõ, và giới hạn độ dài tiền tố là mấy ký tự?',
        'What is the server p99 latency budget for a seamless typing feel, and what is the maximum indexed prefix length?'
      ),
      answer: bi(
        'Độ trễ máy chủ p99 < 30 ms; giới hạn độ sâu tiền tố tối đa L = 50 ký tự và lưu sẵn mảng Top-10 kết quả ngay tại mỗi nút của cây Trie.',
        'Server p99 < 30 ms; cap indexed prefix depth at L = 50 characters and precompute the Top-10 completions directly inside every Trie node.'
      ),
      rationale: bi(
        'Lưu sẵn Top-10 ngay trên mỗi nút biến độ phức tạp từ duyệt toàn bộ cây con O(N_subtree) thành O(1) sau khi đi hết L ký tự!',
        'Caching Top-10 lists inside each Trie node turns expensive subtree traversals into bounded O(L) pointer hops (~microseconds).'
      ),
    },
    {
      id: 'ac-q4',
      kind: 'essential',
      dimension: 'resilience',
      question: bi(
        'Làm sao xử lý các tiền tố ngắn 1–2 ký tự (như "a", "th", "ho") chiếm phần lớn lưu lượng, và lọc nội dung nhạy cảm thế nào?',
        'How do we prevent ultra-hot 1–2 character prefixes ("a", "th") from overloading shards, and filter offensive terms?'
      ),
      answer: bi(
        'Chỉ có vài nghìn tổ hợp 1–3 ký tự nên đệm thẳng ở trình duyệt + Edge CDN + Redis; lấy mẫu 10% nhật ký tìm kiếm (Sampling) để tính xu hướng và áp bộ lọc từ cấm ngay trong pipeline dựng Trie.',
        'There are only a few thousand 1–3 char combinations—cache them at Browser + Edge CDN + Redis; sample 10% of query logs and strip blocked terms during Trie compilation.'
      ),
      rationale: bi(
        'Đệm tiền tố 1–2 ký tự tại CDN cắt ngay >75% tổng QPS trước khi chạm tới cụm máy chủ Trie!',
        'Caching short 1–2 char prefixes at Edge CDN absorbs >75% of global keystroke traffic effortlessly.'
      ),
    },
    {
      id: 'ac-q5',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Danh sách thả xuống nên đổ bóng mờ 8 pixel hay 16 pixel bên dưới thanh tìm kiếm?',
        'Should the autocomplete dropdown menu cast an 8px or 16px CSS drop-shadow?'
      ),
      answer: bi(
        'Thuộc thiết kế giao diện trên trình duyệt.',
        'Purely a frontend CSS presentation detail.'
      ),
      rationale: bi(
        'Không liên quan đến cấu trúc Prefix Trie, phân mảnh từ điển hay đường ống tổng hợp tần suất.',
        'Unrelated to Prefix Trie data structures or sub-30ms serving.'
      ),
    },
    {
      id: 'ac-q6',
      kind: 'premature',
      dimension: 'premature',
      question: bi(
        'Có nên dùng câu lệnh SQL WHERE query LIKE "%abc%" (khớp chuỗi con bất kỳ ở giữa) trên mọi phím gõ không?',
        'Should we run SQL WHERE query LIKE "%abc%" (leading-wildcard substring match) on every keystroke?'
      ),
      answer: bi(
        'Không: ký tự đại diện % ở đầu vô hiệu hoá hoàn toàn B-tree Index và buộc quét tuần tự hàng chục triệu dòng.',
        'No: a leading % wildcard defeats B-tree indexes and forces a full-table scan on every keystroke.'
      ),
      rationale: bi(
        'Typeahead tiêu chuẩn khớp theo tiền tố từ đầu chuỗi bằng cấu trúc Trie lưu sẵn Top-K.',
        'Autocomplete matches prefixes using in-memory Top-K Tries, never unindexed full scans.'
      ),
    },
  ],
  capacityCard: {
    dau: bi('20M DAU · 100M lượt tìm/ngày', '20M DAU · 100M searches/day'),
    readRps: bi('15.000 TB / 60.000 đỉnh prefix QPS', '15,000 avg / 60,000 peak prefix QPS'),
    writeRps: bi('500 TB / 1.800 đỉnh câu tìm hoàn chỉnh/s', '500 avg / 1,800 peak submitted queries/s'),
    readWriteRatio: bi('97 : 3 (Prefix Lookup : Query Log)', '97 : 3 (Prefix Lookup : Query Log)'),
    storagePerDay: bi('~15 GB ảnh chụp Trie · ~8 GB log sau lấy mẫu 10%', '~15 GB Trie snapshot · ~8 GB sampled logs/day'),
    memoryOrBandwidth: bi('O(L) tra cứu với L ≤ 50 + Top-10 gắn sẵn tại nút', 'O(L) lookup (L ≤ 50) + precomputed node Top-10'),
    slos: [
      bi('Prefix Lookup p99 < 30 ms', 'Prefix Lookup p99 < 30 ms'),
      bi('Debounce 100 ms ở Client', '100 ms client keystroke debounce'),
      bi('Cập nhật xu hướng mới ≤ 15 phút', 'Trend index refresh ≤ 15 min'),
    ],
    snakeSummary: {
      scope: bi('Trả Top-10 gợi ý theo tiền tố ≤ 50 ký tự, ghi nhận từ khoá đã tìm và cập nhật thứ hạng nền.', 'Return Top-10 completions for ≤50-char prefixes, log submitted queries, refresh rankings.'),
      numbers: bi('60K QPS đỉnh, ~15 GB Trie trong RAM, lấy mẫu 10% log giảm 90% chi phí ghi.', '60K peak QPS, ~15 GB in-RAM Trie, 10% log sampling cuts ingestion 10x.'),
      api: bi('GET /v1/suggest?q={prefix}&lang=vi → {suggestions: string[]}.', 'GET /v1/suggest?q={prefix}&lang=vi → {suggestions: string[]}.'),
      keyComponents: bi('Edge CDN (1–2 char), Suggest API, Prefix Redis, In-Memory Trie Shards, Log Stream + Builder.', 'Edge CDN (1–2 char), Suggest API, Prefix Redis, In-Memory Trie Shards, Log Stream + Builder.'),
      elaborate: bi('Lưu sẵn Top-10 ở mỗi nút Trie, Blue-Green nạp bản chụp Trie mới không gián đoạn đọc.', 'Precompute Top-10 per Trie node, Blue-Green swap immutable Trie snapshots with zero downtime.'),
    },
  },
  stages: [
    buildPairedStage({
      caseId: 'ac',
      id: 'v1',
      versionLabel: 'v1',
      title: bi('SQL Prefix Query (LIKE "abc%") + Cập nhật đếm trực tiếp', 'SQL Prefix Scan (LIKE "abc%") + Inline Counter Update'),
      eraTag: bi('100 req/s · Quét & Sắp xếp trên đĩa', '100 req/s · Disk Prefix Scan + Sort'),
      targetRps: 100,
      readRatio: 0.97,
      seed: 7381,
      summary: bi(
        'Mỗi phím gõ chạy SELECT term FROM queries WHERE term LIKE "x%" ORDER BY freq DESC LIMIT 10 trên SQL, và mỗi lần bấm tìm lại UPDATE freq = freq + 1 trực tiếp vào cùng bảng.',
        'Every keystroke runs SELECT ... WHERE term LIKE "x%" ORDER BY freq DESC LIMIT 10 on SQL, while submitted searches run inline UPDATEs.'
      ),
      whyNextStage: bi(
        'Khi tăng 5× lên 500 QPS, các tiền tố ngắn như "a%" khớp hàng triệu dòng phải sắp xếp lại theo freq kết hợp khoá ghi UPDATE làm SQL (μ = 260 req/s) quá tải hoàn toàn.',
        'At 5x load (500 QPS), short prefixes like "a%" match millions of rows requiring heavy sorting alongside write locks, saturating SQL (μ = 260 req/s).'
      ),
      whatChanged: [
        diff('+', '1 Suggest API nối thẳng vào bảng từ khoá trong SQL', 'Single Suggest API querying a relational queries table'),
        diff('+', 'Đọc tiền tố và cộng dồn tần suất trực tiếp trên cùng một bảng B-tree', 'Prefix SELECT + ORDER BY and inline frequency UPDATEs on one table'),
      ],
      tradeOffs: [
        trade(
          'Truy vấn LIKE "prefix%" kết hợp ORDER BY freq DESC trực tiếp trên SQL',
          'Query LIKE "prefix%" + ORDER BY freq DESC directly in SQL',
          'Không cần xây dựng cấu trúc cây Trie riêng, dữ liệu vừa tìm xong tăng hạng ngay',
          'Zero custom data structures with instant frequency updates',
          'Tiền tố 1 ký tự khớp hàng trăm nghìn dòng làm truy vấn vọt lên hàng trăm mili-giây',
          '1-char prefixes scan hundreds of thousands of rows, blowing past the 30 ms budget'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Search Box', 'Search Box'),
          what: bi('Người dùng gõ từng ký tự trên thanh tìm kiếm.', 'Users typing character-by-character into the search bar.'),
          how: bi('Gửi 97% truy vấn tiền tố và 3% lượt chốt từ khoá.', '97% prefix keystrokes, 3% final query submissions.'),
          why: bi('Cần kết quả hiện ra dưới 30–50 ms trước khi ngón tay gõ phím tiếp.', 'Needs sub-50ms responses before the next keystroke.'),
        },
        {
          id: 'suggestApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 700,
          baseMs: 6,
          label: bi('Suggest API', 'Suggest API'),
          what: bi('Máy chủ đơn chuyển chuỗi tiền tố thành câu truy vấn SQL.', 'Single server translating prefix strings into SQL queries.'),
          how: bi('Gọi đồng bộ xuống Queries SQL trên mọi phím gõ.', 'Hits SQL synchronously on every keystroke.'),
          why: bi('Phụ thuộc hoàn toàn vào tốc độ quét chỉ mục của SQL.', 'Entirely bound by SQL range-scan performance.'),
        },
        {
          id: 'querySql',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 2,
          row: 0,
          replicas: 1,
          opsPerSec: 260,
          baseMs: 12,
          label: bi('Queries SQL', 'Queries SQL'),
          what: bi('Bảng SQL lưu (term, freq) có chỉ mục B-tree.', 'SQL table storing (term, freq) with a B-tree index.'),
          how: bi('Phải lọc hàng loạt từ bắt đầu bằng "a%" rồi sắp xếp giảm dần theo freq.', 'Scans wide prefix ranges and sorts matches by frequency.'),
          why: bi('Quá tải ngay ở ~260 QPS.', 'Saturates around ~260 QPS.'),
        },
      ],
      links: [
        { id: 'c-api', from: 'client', to: 'suggestApi' },
        { id: 'api-sql', from: 'suggestApi', to: 'querySql', label: bi('LIKE "a%"', 'LIKE "a%"') },
      ],
      noteCard: {
        title: bi('v1 · SQL LIKE "prefix%"', 'v1 · SQL LIKE "prefix%"'),
        lines: [
          { text: bi('Tiền tố 1 ký tự phải quét & sắp xếp lớn', '1-char prefixes trigger massive sorts'), tone: 'amber' },
          { text: bi('Nghẽn ở ~260 QPS, vượt ngưỡng 30 ms', 'Caps at ~260 QPS, breaches 30 ms SLA'), tone: 'bad' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ac',
      id: 'v2',
      versionLabel: 'v2',
      title: bi('In-Memory Top-K Prefix Trie + Redis Cache (vẫn ghi Log vào SQL)', 'In-Memory Top-K Trie + Prefix Cache + SQL Log'),
      eraTag: bi('2.000 req/s · Tra cứu O(L) trong RAM', '2,000 req/s · O(L) Precomputed Trie'),
      targetRps: 2000,
      readRatio: 0.97,
      seed: 7382,
      summary: bi(
        'Đưa từ điển lên cấu trúc cây Prefix Trie trong RAM với mảng Top-10 gắn sẵn tại mỗi nút (tra cứu O(L) vài micro-giây), đặt Redis đệm tiền tố phổ biến, còn lượt tìm hoàn chỉnh ghi vào SQL.',
        'Serves completions from an in-memory Prefix Trie storing precomputed Top-10 arrays at every node, fronted by a Redis Prefix Cache while logging queries to SQL.'
      ),
      whyNextStage: bi(
        'Khi đẩy tải 5× lên 10.000 QPS, một máy Trie đơn lẻ cùng với việc ghi đồng bộ log tìm kiếm xuống SQL (300 ghi/giây) và tầng API 2 máy bị bão hoà.',
        'At 5x load (10,000 QPS), the 2-node Suggest API, single Trie server, and synchronous SQL query logging saturate.'
      ),
      whatChanged: [
        diff('+', 'Dựng máy chủ In-Memory Prefix Trie gắn sẵn Top-10 tại mỗi nút tiền tố', 'Deploy In-Memory Prefix Trie with precomputed Top-10 lists per node'),
        diff('+', 'Thêm Prefix Redis Cache hấp thụ ~82% truy vấn tiền tố ngắn lặp lại', 'Add Prefix Redis Cache absorbing ~82% of hot prefix lookups'),
        diff('~', 'Tách bảng SQL chỉ còn nhận 3% lượt chốt câu tìm kiếm', 'Isolate SQL strictly to 3% submitted search logs'),
      ],
      tradeOffs: [
        trade(
          'Lưu sẵn Top-10 kết quả ngay bên trong từng nút của cây Trie trong RAM',
          'Embed precomputed Top-10 strings inside every Trie node in RAM',
          'Độ trễ tra cứu không còn phụ thuộc số lượng từ con bên dưới (luôn O(L) ≈ 2 ms)',
          'Lookup latency becomes strictly O(L) (~2 ms) regardless of subtree size',
          'Tốn gấp ~3–4× dung lượng RAM trên mỗi nút nhưng vẫn gọn trong ~15 GB cho 50 triệu cụm từ',
          'Uses ~3–4x more RAM per node, yet still fits comfortably in ~15 GB'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('Search Box', 'Search Box'),
          what: bi('2.000 QPS gõ phím đã có Debounce 100 ms ở trình duyệt.', '2,000 QPS debounced keystroke traffic.'),
          how: bi('Không gửi request mới nếu người dùng gõ liến thoắng nhanh hơn 100 ms.', 'Client-side 100 ms debounce coalesces rapid typing.'),
          why: bi('Giảm một nửa số request thừa ngay từ phía trình duyệt.', 'Cuts redundant server requests in half at the source.'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 1,
          opsPerSec: 20000,
          baseMs: 0.4,
          label: bi('Load Balancer', 'Load Balancer'),
          what: bi('Cân bằng tải điều phối vào tầng Suggest API.', 'Load Balancer fronting Suggest APIs.'),
          how: bi('Chia đều cho 2 máy chủ API.', 'Routes across 2 stateless servers.'),
          why: bi('Cho phép thêm máy dễ dàng.', 'Enables horizontal scaling.'),
        },
        {
          id: 'suggestApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 2,
          opsPerSec: 1900,
          baseMs: 4,
          label: bi('Suggest API ×2', 'Suggest API ×2'),
          what: bi('Chuẩn hoá chữ thường, bỏ khoảng trắng thừa và gọi Cache/Trie.', 'Normalizes lowercase/diacritics and queries Cache/Trie.'),
          how: bi('Tổng năng lực 3.800 QPS.', 'Provides 3,800 QPS capacity.'),
          why: bi('Chạm trần ở ~3.800 QPS khi tải tăng 5×.', 'Hits compute ceiling near ~3,800 QPS.'),
        },
        {
          id: 'prefixCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3,
          row: -0.6,
          replicas: 1,
          opsPerSec: 35000,
          baseMs: 0.4,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.82 },
          label: bi('Prefix Redis', 'Prefix Redis'),
          what: bi('Bộ đệm KV ánh xạ thẳng prefix → JSON Top-10 cho các tiền tố hay gõ.', 'Key-value cache mapping hot prefixes directly to serialized Top-10 JSON.'),
          how: bi('Trả lời 82% lượt gõ trong 0,4 ms.', 'Serves 82% of keystrokes in 0.4 ms.'),
          why: bi('Giảm tải cho máy chủ cây Trie phía sau.', 'Offloads repetitive short-prefix reads.'),
        },
        {
          id: 'trieCluster',
          kind: 'search',
          shape: 'block',
          tone: 'purple',
          icon: 'sparkles',
          col: 4,
          row: -0.6,
          replicas: 1,
          opsPerSec: 1400,
          baseMs: 2.5,
          label: bi('Trie Node ×1', 'Trie Node ×1'),
          what: bi('Một máy chủ giữ cây Prefix Trie bất biến trong RAM.', 'Single in-memory Top-K Prefix Trie server.'),
          how: bi('Duyệt tối đa 50 bước con trỏ để đọc mảng Top-10 gắn sẵn.', 'Walks ≤50 character pointers to read precomputed Top-10.'),
          why: bi('Đơn lẻ (SPOF) và nghẽn khi lượng Miss vượt 1.400 QPS.', 'Single point of failure that saturates above 1,400 miss QPS.'),
        },
        {
          id: 'querySql',
          kind: 'sql',
          shape: 'db',
          tone: 'orange',
          col: 3.5,
          row: 0.6,
          replicas: 1,
          opsPerSec: 220,
          baseMs: 7,
          label: bi('Query Log SQL', 'Query Log SQL'),
          what: bi('Bảng SQL ghi nhận các câu tìm kiếm hoàn chỉnh để tính lại Trie hàng giờ.', 'SQL table recording submitted searches for hourly Trie rebuilds.'),
          how: bi('Nhận ~60 ghi/giây ở 2K QPS, nhưng nghẽn ở 300 ghi/giây khi ×5.', 'Handles ~60 writes/s at 2K, but saturates under 300 writes/s at ×5.'),
          why: bi('Cần thay bằng luồng sự kiện bất đồng bộ có lấy mẫu.', 'Needs async sampled log streaming next.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'suggestApi' },
        { id: 'api-cache', from: 'suggestApi', to: 'prefixCache', carries: 'r', label: bi('Hit 82%', 'Hit 82%') },
        { id: 'cache-trie', from: 'prefixCache', to: 'trieCluster', carries: 'r', label: bi('Trie O(L)', 'Trie O(L)') },
        { id: 'api-sql', from: 'suggestApi', to: 'querySql', carries: 'w', label: bi('Submit 3%', 'Submit 3%') },
      ],
      routes: {
        suggestApi: 'all-parallel',
      },
      noteCard: {
        title: bi('v2 · In-Memory Top-K Trie', 'v2 · In-Memory Top-K Trie'),
        lines: [
          { text: bi('Gắn sẵn Top-10 tại nút: tra cứu ~2,5 ms', 'Precomputed node Top-10: ~2.5 ms'), tone: 'good' },
          { text: bi('1 Trie Node & SQL Log nghẽn khi ×5', 'Single Trie & SQL Log saturate at ×5'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ac',
      id: 'v3',
      versionLabel: 'v3',
      title: bi('Sharded + Replicated Trie Cluster + Async Log Aggregator', 'Sharded & Replicated Trie Cluster + Async Log Builder'),
      eraTag: bi('15.000 req/s · Tách hẳn luồng dựng chỉ mục', '15,000 req/s · Lock-Free Snapshot Swap'),
      targetRps: 15000,
      readRatio: 0.97,
      seed: 7383,
      summary: bi(
        'Phân mảnh từ điển theo dải tiền tố kết hợp nhân bản nhiều bản sao đọc cho các phân vùng chữ cái phổ biến, và chuyển việc thu thập từ khoá sang hàng đợi bất đồng bộ để Trie Builder dựng ảnh chụp mới mỗi 15 phút.',
        'Shards and replicates immutable Trie servers weighted by prefix popularity, while streaming submitted queries asynchronously to offline Trie Snapshot Builders.'
      ),
      whyNextStage: bi(
        'Ở 5× tải toàn cầu (75.000 QPS), các phím gõ đầu tiên (1–2 ký tự như "a", "s", "t") từ hàng triệu trình duyệt vẫn phải đi hết chặng mạng về Origin làm nghẽn Load Balancer và cụm Suggest API.',
        'At 5x global load (75,000 QPS), millions of 1–2 character keystrokes ("a", "s", "t") traverse the WAN to Origin, saturating Origin LB and Suggest APIs.'
      ),
      whatChanged: [
        diff('+', 'Mở rộng thành cụm Trie phân mảnh & nhân bản (×4) hoán đổi ảnh chụp Blue-Green không khoá', 'Scale to a 4-node sharded/replicated Trie cluster using lock-free snapshot swaps'),
        diff('+', 'Thay SQL Log bằng Query Log Queue + Offline Trie Builder tổng hợp theo cửa sổ thời gian', 'Replace inline SQL writes with async Query Log Queue + Trie Snapshot Builder'),
        diff('~', 'Nâng Hit Ratio của Prefix Redis lên 88% cho toàn bộ tiền tố 1–3 ký tự', 'Raise Prefix Redis hit ratio to 88% across 1–3 char prefixes'),
      ],
      tradeOffs: [
        trade(
          'Dựng lại ảnh chụp (Immutable Snapshot) định kỳ mỗi 15 phút thay vì sửa cây trực tiếp',
          'Periodic 15-minute immutable Trie snapshot rebuilds instead of live mutation',
          'Đường đọc hoàn toàn không cần Mutex/Lock, hiệu năng CPU ổn định tuyệt đối và lọc sạch từ nhạy cảm',
          '100% lock-free reads, predictable p99, and clean offline profanity filtering',
          'Một từ khoá tin tức vừa bùng nổ cần 10–15 phút (hoặc nhánh Fast-Trend nhỏ riêng) để lên Top',
          'New trending terms take 10–15 minutes to appear unless merged with a small fast-trend overlay'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('15K Keystrokes', '15K Keystrokes'),
          what: bi('15.000 truy vấn tiền tố mỗi giây.', '15,000 prefix keystroke queries/s.'),
          how: bi('Đệm cục bộ trên trình duyệt các tiền tố vừa gõ trong phiên.', 'Caches recently typed prefixes in browser session memory.'),
          why: bi('Khi người dùng bấm phím xoá lùi (Backspace) không cần hỏi lại server.', 'Backspace keystrokes resolve locally in 0 ms!'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 45000,
          baseMs: 0.4,
          label: bi('LB Cặp HA', 'HA LB Pair'),
          what: bi('Cặp cân bằng tải phân phối tới 11 máy Suggest API.', 'Redundant Load Balancer pair.'),
          how: bi('Tổng năng lực 90.000 QPS.', 'Routes up to 90,000 QPS.'),
          why: bi('Đưa toàn bộ lưu lượng vào tầng Suggest API gốc chưa có CDN.', 'Forwards full traffic to Origin Suggest API without Edge CDN.'),
        },
        {
          id: 'suggestApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 2,
          row: 0,
          replicas: 11,
          opsPerSec: 2200,
          baseMs: 4,
          label: bi('Suggest API ×11', 'Suggest API ×11'),
          what: bi('Tầng định tuyến tiền tố theo bảng phân vùng trọng số (Weighted Shard Map).', '11 stateless servers routing prefixes via weighted shard maps.'),
          how: bi('Đẩy không chặn 3% câu tìm hoàn tất sang Log Queue.', 'Emits 3% completed search queries asynchronously to Log Queue.'),
          why: bi('Thông lượng ~24.200 QPS.', 'Provides ~24,200 QPS origin capacity.'),
        },
        {
          id: 'prefixCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 3.2,
          row: -0.65,
          replicas: 2,
          opsPerSec: 35000,
          baseMs: 0.4,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.88 },
          label: bi('Prefix Redis ×2', 'Prefix Redis ×2'),
          what: bi('Cụm Redis lưu sẵn kết quả của mọi tiền tố ngắn 1–3 ký tự.', 'Replicated Redis cluster caching 1–3 char prefix completions.'),
          how: bi('Hấp thụ 88% tổng truy vấn đọc.', 'Absorbs 88% of prefix reads in 0.4 ms.'),
          why: bi('Chỉ để 12% tiền tố dài/hiếm đi xuống cụm Trie.', 'Forwards only 12% long-tail prefixes to Trie servers.'),
        },
        {
          id: 'trieCluster',
          kind: 'search',
          shape: 'block',
          tone: 'purple',
          icon: 'sparkles',
          col: 4.3,
          row: -0.65,
          replicas: 4,
          opsPerSec: 1800,
          baseMs: 2.5,
          label: bi('Trie Cluster ×4', 'Trie Cluster ×4'),
          what: bi('4 máy chủ giữ phân vùng Trie bất biến, nạp ảnh chụp mới từ Object Storage.', '4 sharded/replicated in-memory Trie servers hot-swapping snapshots.'),
          how: bi('Tổng năng lực 7.200 Miss QPS (dư cho ~1.750 Miss/s ở mốc 15K).', '7,200 miss QPS capacity serving ~1,750 misses/s.'),
          why: bi('Loại bỏ hoàn toàn điểm lỗi đơn của v2.', 'Eliminates v2 single-Trie SPOF.'),
        },
        {
          id: 'logQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 3.2,
          row: 0.65,
          replicas: 1,
          opsPerSec: 40000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 200000 },
          label: bi('Query Log Q', 'Query Log Q'),
          what: bi('Luồng nhật ký các câu tìm kiếm thực tế người dùng đã nhấn Enter.', 'Async stream collecting submitted search queries.'),
          how: bi('Nhận ~450 sự kiện/giây ở mức 15K QPS.', 'Buffers ~450 query logs/s.'),
          why: bi('Không bao giờ làm chậm thao tác gõ phím trực tuyến.', 'Zero impact on live keystroke latency.'),
        },
        {
          id: 'trieBuilder',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 4.3,
          row: 0.65,
          replicas: 4,
          opsPerSec: 600,
          baseMs: 18,
          label: bi('Trie Builder ×4', 'Trie Builder ×4'),
          what: bi('Cụm tổng hợp tần suất có suy giảm theo thời gian (Time-Decay) và xuất ảnh chụp Trie mới.', 'Offline workers computing time-decayed frequencies and compiling Trie snapshots.'),
          how: bi('Lọc bỏ từ cấm, lỗi chính tả hiếm gặp rồi phát hành bản chụp lên cụm Trie.', 'Filters spam/typos and publishes immutable Trie files every 15m.'),
          why: bi('Giữ chất lượng gợi ý sạch và cập nhật xu hướng mới.', 'Keeps suggestions fresh and policy-compliant.'),
        },
      ],
      links: [
        { id: 'c-lb', from: 'client', to: 'lb' },
        { id: 'lb-api', from: 'lb', to: 'suggestApi' },
        { id: 'api-cache', from: 'suggestApi', to: 'prefixCache', carries: 'r', label: bi('Hit 88%', 'Hit 88%') },
        { id: 'cache-trie', from: 'prefixCache', to: 'trieCluster', carries: 'r', label: bi('Long Prefix', 'Long Prefix') },
        { id: 'api-logq', from: 'suggestApi', to: 'logQueue', mode: 'async', carries: 'w', label: bi('Async Log', 'Async Log') },
        { id: 'logq-bld', from: 'logQueue', to: 'trieBuilder', mode: 'pull' },
      ],
      routes: {
        suggestApi: 'all-parallel',
      },
      zones: [
        { id: 'z-trie3', nodeIds: ['prefixCache', 'trieCluster'], label: bi('IMMUTABLE TOP-K TRIE SERVING', 'IMMUTABLE TOP-K TRIE SERVING'), tone: 'purple' },
      ],
      noteCard: {
        title: bi('v3 · Sharded Trie + Async Build', 'v3 · Sharded Trie + Async Build'),
        lines: [
          { text: bi('Đọc không khoá · Đổi Snapshot 15 phút', 'Lock-free reads · 15m Snapshot swap'), tone: 'good' },
          { text: bi('Tiền tố 1–2 ký tự xuyên WAN nghẽn ở ×5', '1–2 char WAN traffic saturates Origin ×5'), tone: 'amber' },
        ],
        position: 'bottom-right',
      },
    }),
    buildPairedStage({
      caseId: 'ac',
      id: 'v4',
      versionLabel: 'v4',
      title: bi('Edge CDN Short-Prefix Offload + Multi-AZ Weighted Trie + 10% Log Sampling', 'Edge CDN Short-Prefix Cache + Multi-AZ Trie + 10% Log Sampling'),
      eraTag: bi('60.000+ req/s · Phản hồi < 15 ms toàn cầu', '60,000+ req/s · Sub-15ms Global Edge'),
      targetRps: 60000,
      readRatio: 0.97,
      seed: 7384,
      summary: bi(
        'Đưa toàn bộ bảng gợi ý của các tiền tố ngắn 1–2 ký tự ra Edge CDN gần người dùng (~78% Edge Hit với TTL ngắn 5 phút), lấy mẫu 10% luồng nhật ký tìm kiếm và nhân bản cụm Trie đa vùng kèm lớp phủ xu hướng nhanh.',
        'Pushes 1–2 character prefix completions to Global Edge CDN POPs (~78% edge hit, 5m TTL), applies 10% query-log sampling, and runs Multi-AZ replicated Trie shards with a fast-trend overlay.'
      ),
      whyNextStage: bi(
        'Kiến trúc v4 phục vụ mượt trên 140.000 QPS gõ phím toàn cầu với độ trễ p99 dưới 15 ms và chi phí xử lý log cực kỳ tiết kiệm.',
        'Sustains >140,000 global keystroke QPS with sub-15ms p99 latency and 10x lower log-processing cost.'
      ),
      whatChanged: [
        diff('+', 'Đệm các tiền tố 1–2 ký tự ngay trên Global Edge CDN (chặn ~78% tổng phím gõ tại biên)', 'Cache 1–2 char prefixes on Global Edge CDN POPs (~78% edge offload)'),
        diff('+', 'Áp dụng 10% Sampling trên luồng Query Log: giữ nguyên độ chính xác Top-10 mà giảm 90% chi phí ghi', 'Sample 10% of submitted query logs—preserving Top-10 accuracy at 1/10th cost'),
        diff('~', 'Mở rộng Multi-AZ cho cụm Trie (×8) kèm nhánh Fast-Trend cập nhật sự kiện nóng trong 1 phút', 'Scale Multi-AZ Trie cluster (×8) with a 1-minute breaking-news trend overlay'),
      ],
      tradeOffs: [
        trade(
          'Lấy mẫu 10% (1/10) nhật ký tìm kiếm thay vì xử lý 100% mọi lượt tìm',
          'Sample 10% of search logs instead of aggregating 100% of queries',
          'Giảm 10× băng thông Kafka, lưu trữ và chi phí tính toán MapReduce/Stream',
          'Slashes Kafka bandwidth, storage, and stream aggregation cost by 10x',
          'Các cụm từ cực hiếm (< 10 lượt tìm/ngày) có sai số thống kê nhỏ, nhưng Top-10 phổ biến hoàn toàn không đổi',
          'Negligible variance on ultra-rare queries while Top-10 popular rankings stay statistically identical'
        ),
      ],
      nodes: [
        {
          id: 'client',
          kind: 'client',
          shape: 'device',
          tone: 'blue',
          col: 0,
          row: 0,
          label: bi('60K Keystrokes', '60K Keystrokes'),
          what: bi('60.000 QPS gõ phím từ khắp các khu vực địa lý.', '60,000 global keystroke QPS.'),
          how: bi('Kết hợp Debounce 100 ms + Browser Cache + kết nối HTTP/3 tới CDN.', 'Combines 100 ms debounce, local browser cache, and HTTP/3 to Edge CDN.'),
          why: bi('Gợi ý hiện ra tức thì theo từng nhịp gõ.', 'Feels instantaneous to human perception.'),
        },
        {
          id: 'cdn',
          kind: 'cdn',
          shape: 'block',
          tone: 'blue',
          icon: 'globe',
          col: 1,
          row: 0,
          replicas: 2,
          opsPerSec: 130000,
          baseMs: 1,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.78 },
          label: bi('Edge Prefix CDN', 'Edge Prefix CDN'),
          what: bi('Trạm biên lưu đệm vài nghìn tiền tố 1–2 ký tự theo từng ngôn ngữ/quốc gia.', 'Edge POPs caching locale-specific 1–2 char prefixes (TTL 5 min).'),
          how: bi('Phục vụ ngay ~78% tổng phím gõ trong ~1 ms tại biên.', 'Serves ~78% of all keystrokes at the edge in ~1 ms.'),
          why: bi('Chỉ để ~14.000 QPS tiền tố dài hơn đi về Origin!', 'Reduces 60,000 global QPS down to ~14,000 origin QPS!'),
        },
        {
          id: 'lb',
          kind: 'lb',
          shape: 'block',
          tone: 'purple',
          icon: 'layers',
          col: 2,
          row: 0,
          replicas: 3,
          opsPerSec: 20000,
          baseMs: 0.3,
          label: bi('Multi-AZ LB ×3', 'Multi-AZ LB ×3'),
          what: bi('Cụm cân bằng tải đa vùng sẵn sàng.', '3-node Multi-AZ Load Balancer.'),
          how: bi('Tổng năng lực 60.000 origin QPS.', '60,000 origin QPS capacity.'),
          why: bi('Chịu được hơn 250.000 QPS biên sau khi nhân hệ số CDN.', 'Supports >250K edge QPS behind CDN.'),
        },
        {
          id: 'suggestApi',
          kind: 'service',
          shape: 'block',
          tone: 'green',
          icon: 'cpu',
          col: 3,
          row: 0,
          replicas: 14,
          opsPerSec: 2500,
          baseMs: 3.5,
          label: bi('Suggest API ×14', 'Suggest API ×14'),
          what: bi('14 máy chủ hợp nhất kết quả Trie chuẩn với lớp phủ tin nóng (Fast-Trend) và lấy mẫu 10% log.', '14 servers merging base Trie completions with breaking-news overlays and 10% log sampling.'),
          how: bi('Chỉ đẩy 1/10 số câu tìm hoàn tất vào hàng đợi log.', 'Forwards only a 10% deterministic sample of submitted queries to Log Stream.'),
          why: bi('Vừa nhanh vừa tiết kiệm tài nguyên phía sau.', 'Fast serving with minimal logging overhead.'),
        },
        {
          id: 'prefixCache',
          kind: 'cache',
          shape: 'block',
          tone: 'yellow',
          icon: 'zap',
          col: 4.2,
          row: -0.7,
          replicas: 3,
          opsPerSec: 40000,
          baseMs: 0.4,
          params: { ...STEADY_CACHE_90, hitRatioMax: 0.92 },
          label: bi('Origin Redis ×3', 'Origin Redis ×3'),
          what: bi('Tầng đệm tiền tố 3–5 ký tự kèm lớp phủ xu hướng sự kiện vừa diễn ra.', 'Multi-AZ Redis caching 3–5 char prefixes and breaking-trend overlays.'),
          how: bi('Chặn tiếp 92% lượng đọc đi qua CDN.', 'Absorbs 92% of CDN read misses.'),
          why: bi('Giữ tải trên cụm Trie cực nhẹ (~1.100 QPS).', 'Leaves only ~1,100 long-tail QPS for Trie servers.'),
        },
        {
          id: 'trieCluster',
          kind: 'search',
          shape: 'block',
          tone: 'purple',
          icon: 'sparkles',
          col: 5.3,
          row: -0.7,
          replicas: 8,
          opsPerSec: 2200,
          baseMs: 2,
          label: bi('Multi-AZ Trie ×8', 'Multi-AZ Trie ×8'),
          what: bi('8 máy chủ Trie phân vùng theo phạm vi ký tự đầu và nhân bản xuyên AZ.', '8 range-partitioned, cross-AZ replicated Top-K Prefix Trie servers.'),
          how: bi('Năng lực 17.600 QPS tiền tố dài với thời gian duyệt ~2 ms.', '17,600 long-tail QPS capacity at ~2 ms traversal latency.'),
          why: bi('Chịu được cả khi 1 AZ bảo trì hoặc toàn bộ Redis làm ấm lại.', 'Survives AZ maintenance or cold cache warmups without breaching 30 ms.'),
        },
        {
          id: 'logQueue',
          kind: 'queue',
          shape: 'block',
          tone: 'rose',
          icon: 'layers',
          col: 4.2,
          row: 0.65,
          replicas: 2,
          opsPerSec: 50000,
          baseMs: 1,
          params: { dlq: true, maxDepth: 300000 },
          label: bi('Sampled Log Q', 'Sampled Log Q'),
          what: bi('Luồng sự kiện chỉ nhận 10% mẫu câu tìm kiếm đã lọc bot.', 'Sampled query stream receiving 10% bot-filtered search submissions.'),
          how: bi('Ở 60K QPS (~1.800 lượt chốt/s), chỉ ~180 bản tin/s đi vào luồng!', 'At 60K QPS (~1,800 submits/s), ingests just ~180 sampled events/s!'),
          why: bi('Cực kỳ gọn nhẹ và không bao giờ dồn ứ.', 'Ultra-lean ingestion with zero backlog risk.'),
        },
        {
          id: 'trieBuilder',
          kind: 'worker',
          shape: 'block',
          tone: 'purple',
          icon: 'box',
          col: 5.3,
          row: 0.65,
          replicas: 8,
          opsPerSec: 800,
          baseMs: 15,
          label: bi('Stream + Snap ×8', 'Stream + Snap ×8'),
          what: bi('Cụm xử lý kép: vừa đẩy xu hướng 1 phút lên Redis vừa kết xuất ảnh chụp Trie 15 phút.', 'Dual-path workers emitting 1m fast trends to Redis and 15m full Trie snapshots.'),
          how: bi('Hoán đổi con trỏ bộ nhớ không làm rơi bất kỳ truy vấn nào.', 'Publishes Blue-Green snapshots for zero-downtime swaps.'),
          why: bi('Kết hợp được cả độ tươi tin nóng lẫn độ ổn định bất biến.', 'Combines breaking-news freshness with immutable serving stability.'),
        },
      ],
      links: [
        { id: 'c-cdn', from: 'client', to: 'cdn', label: bi('1–2 Char Edge', '1–2 Char Edge') },
        { id: 'cdn-lb', from: 'cdn', to: 'lb', label: bi('Miss 22%', 'Miss 22%') },
        { id: 'lb-api', from: 'lb', to: 'suggestApi' },
        { id: 'api-cache', from: 'suggestApi', to: 'prefixCache', carries: 'r' },
        { id: 'cache-trie', from: 'prefixCache', to: 'trieCluster', carries: 'r' },
        { id: 'api-logq', from: 'suggestApi', to: 'logQueue', mode: 'async', carries: 'w', fraction: 0.1, label: bi('10% Sample', '10% Sample') },
        { id: 'logq-bld', from: 'logQueue', to: 'trieBuilder', mode: 'pull' },
      ],
      routes: {
        suggestApi: 'all-parallel',
      },
      zones: [
        { id: 'z-ac4', nodeIds: ['cdn', 'prefixCache', 'trieCluster'], label: bi('MULTI-TIER PREFIX SERVING', 'MULTI-TIER PREFIX SERVING'), tone: 'blue' },
      ],
      noteCard: {
        title: bi('v4 · Edge CDN + 10% Sample', 'v4 · Edge CDN + 10% Sample'),
        lines: [
          { text: bi('CDN gánh 78% tiền tố ngắn · p99 < 14 ms', 'CDN serves 78% short prefixes · p99 < 14 ms'), tone: 'good' },
          { text: bi('Lấy mẫu 10% log giảm 10× chi phí nền', '10% log sampling cuts build cost 10×'), tone: 'good' },
        ],
        position: 'bottom-right',
      },
    }),
  ],
};

export const DESIGN_CASES: readonly SdDesignCase[] = [
  CASE_URL_SHORTENER,
  CASE_NEWS_FEED,
  CASE_REALTIME_CHAT,
  CASE_RATE_LIMITER,
  CASE_NOTIFICATION_SYSTEM,
  CASE_RIDE_HAILING,
  CASE_VIDEO_STREAMING,
  CASE_PAYMENT_LEDGER,
  CASE_SEARCH_AUTOCOMPLETE,
];

export function getDesignCaseById(id: string): SdDesignCase | undefined {
  return DESIGN_CASES.find((c) => c.id === id);
}
