/**
 * Dữ liệu 9 kịch bản sự cố Production trực tiếp (War-Room — T7.2)
 * cho System Design Mastery (`sdmastery`).
 *
 * Mỗi kịch bản gồm:
 *  - `SimScenario` chạy thật trên engine dòng chảy (`durationSec: 65..80`)
 *  - `ScaleStageScene` (`StageScene`) bố cục lưới Isometric 2:1 theo `(col, row)`, không dùng `sublabel` dưới sàn
 *  - `slos: Constraint[]` vi phạm ở cấu hình gốc (`starter`) và đạt toàn bộ khi áp dụng đúng phương án khắc phục
 *  - `mitigations`: danh sách thao tác cấu hình (`knob` / `link`), gồm cả phương án đúng và phương án gây nhiễu (red herring)
 *  - `postmortem`: `PostmortemActivity` chuẩn (tổng `weight = 100`) chấm điểm deterministic qua `gradeActivity()`
 */
import type {
  BilingualText,
  IsoTone,
  LegacyNodeShape,
  LiveSimSpec,
  StageIconKind,
  StageInspectorInfo,
  StageLink,
  StageNode,
  StageScene,
} from '@/components/scale-workbench/types';
import {
  makeNode,
  type Constraint,
  type InputChange,
  type InputRecord,
  type Knob,
  type LinkSpec,
  type NodeSpec,
  type SimScenario,
} from '@/features/sysdesign-course/sim';
import type {
  Change,
  PostmortemActivity,
  PostmortemQuestion,
} from '@/features/sysdesign-course/activities/types';

export type ScaleStageScene = StageScene;
export type WarRoomSeverity = 'SEV-1' | 'SEV-2';

export interface WarRoomSymptom {
  pagerAlert: BilingualText;
  customerImpact: BilingualText;
  telemetryClues: BilingualText[];
}

export interface WarRoomMitigation {
  id: string;
  label: BilingualText;
  description: BilingualText;
  targetBadge: string;
  cost: number;
  changes: Change[];
  isTrap?: boolean;
  trapWarning?: BilingualText;
}

export interface WarRoomIncident {
  id: string;
  order: number;
  severity: WarRoomSeverity;
  title: BilingualText;
  summary: BilingualText;
  relatedModules: string[];
  alertAtSec: number;
  peakAtSec: number;
  scenario: SimScenario;
  scene: ScaleStageScene;
  liveSpec: LiveSimSpec;
  symptom: WarRoomSymptom;
  slos: Constraint[];
  sloDescriptions: Record<string, BilingualText>;
  changeBudget: number;
  mitigations: WarRoomMitigation[];
  solutionMitigationIds: string[];
  postmortem: PostmortemActivity;
}

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

function numKnob(
  key: string,
  vi: string,
  en: string,
  def: number,
  min: number,
  max: number,
  step: number,
  unit?: string
): Knob {
  return {
    key,
    type: 'number',
    label: bi(vi, en),
    default: def,
    min,
    max,
    step,
    ...(unit ? { unit } : {}),
    changeCost: 1,
  };
}

/** Chuyển mảng `Change` của bài tập/mitigation sang `InputRecord[]` tại tick chỉ định cho engine. */
export function warRoomChangesToInputRecords(
  changes: readonly Change[],
  atTick = 0
): InputRecord[] {
  return changes.map((c) => {
    if (c.type === 'knob') {
      return {
        tick: atTick,
        change: {
          type: 'knob',
          node: c.node,
          key: c.key,
          value: c.value,
        },
      };
    }
    return {
      tick: atTick,
      change: {
        type: 'link',
        link: c.link,
        patch: c.patch as Extract<InputChange, { type: 'link' }>['patch'],
      },
    };
  });
}

function groundOffset(shape: LegacyNodeShape): number {
  if (shape === 'db' || shape === 'cylinder') return 16;
  if (shape === 'device' || shape === 'laptop') return 12;
  if (shape === 'crowd') return 10;
  return 22;
}

interface GridNodeInput {
  id: string;
  col: number;
  row: number;
  shape: LegacyNodeShape;
  tone: IsoTone;
  icon?: StageIconKind;
  label: BilingualText;
  what: BilingualText;
  how: BilingualText;
  why: BilingualText;
  tip?: BilingualText;
}

interface GridLinkInput {
  id: string;
  from: string;
  to: string;
  style?: StageLink['style'];
  label?: BilingualText;
  what: BilingualText;
  how: BilingualText;
  why: BilingualText;
}

const KIND_LABELS: Record<string, BilingualText> = {
  crowd: bi('Nhóm người dùng', 'End Users'),
  db: bi('Lưu trữ bền vững', 'Stateful Storage'),
  device: bi('Thiết bị', 'Client Device'),
  block: bi('Thành phần hệ thống', 'System Component'),
};

/**
 * Quy đổi tọa độ lưới `(col, row)` sang mặt phẳng Isometric 2:1 chuẩn của `ScaleStageSvg`:
 *  - `col` tiến dọc trục chính SW → NE `(+118, -59)`
 *  - `row` tách nhánh trực giao NW → SE `(+104, +52)`
 *  - Không gắn `sublabel` dưới sàn để tránh đè chữ.
 */
function buildIsoScene(
  gridNodes: readonly GridNodeInput[],
  gridLinks: readonly GridLinkInput[],
  zones?: StageScene['zones']
): ScaleStageScene {
  const maxCol = Math.max(...gridNodes.map((n) => n.col), 1);
  const originGx = -Math.round((maxCol * 118) / 2);
  const originGy = -Math.round((maxCol * -59) / 2);

  // Nếu toàn bộ 5 node xếp thẳng hàng (row === 0), gập nhẹ node cuối sang SE 90° để giữ chiều sâu 2.5D gọn gàng
  const isLinearFive =
    gridNodes.length === 5 && gridNodes.every((n, idx) => n.col === idx && n.row === 0);

  const linearFiveCoords: Array<[number, number]> = [
    [-228, 84],
    [-112, 26],
    [4, -32],
    [120, -90],
    [248, -26],
  ];

  const nodes: StageNode[] = gridNodes.map((gn, idx) => {
    let gx: number;
    let gy: number;
    if (isLinearFive) {
      gx = linearFiveCoords[idx][0];
      gy = linearFiveCoords[idx][1];
    } else {
      gx = originGx + gn.col * 118 + gn.row * 104;
      gy = originGy + gn.col * -59 + gn.row * 52;
    }
    const inspector: StageInspectorInfo = {
      title: gn.label,
      kindLabel: KIND_LABELS[gn.shape] ?? KIND_LABELS.block,
      what: gn.what,
      how: gn.how,
      why: gn.why,
      ...(gn.tip ? { tipOrCase: gn.tip } : {}),
    };
    return {
      id: gn.id,
      shape: gn.shape,
      tone: gn.tone,
      x: Math.round(gx),
      y: Math.round(gy - groundOffset(gn.shape)),
      label: gn.label,
      ...(gn.icon ? { icon: gn.icon } : {}),
      inspector,
    };
  });

  const links: StageLink[] = gridLinks.map((gl) => ({
    id: gl.id,
    from: gl.from,
    to: gl.to,
    ...(gl.style ? { style: gl.style } : {}),
    ...(gl.label ? { label: gl.label } : {}),
    inspector: {
      title: gl.label ?? bi(`${gl.from} → ${gl.to}`, `${gl.from} → ${gl.to}`),
      kindLabel: bi('Đường nối mạng', 'Network Link'),
      what: gl.what,
      how: gl.how,
      why: gl.why,
    },
  }));

  return {
    nodes,
    links,
    packets: [],
    ...(zones ? { zones } : {}),
  };
}

function makeLiveSpec(
  simId: string,
  p99SloMs: number,
  errSloRate: number,
  knobs: { node: string; key: string }[] = []
): LiveSimSpec {
  return {
    simId,
    startAtSec: 0,
    autoplay: true,
    speed: 1,
    controls: {
      timeline: true,
      tracer: true,
      knobs,
    },
    slo: [
      { metric: 'p99', value: p99SloMs, unit: 'ms' },
      { metric: 'errorRate', value: errSloRate },
    ],
  };
}

function buildPostmortem(opts: {
  id: string;
  simId: string;
  seekSec: number;
  title: BilingualText;
  prompt: BilingualText;
  explain: BilingualText;
  questions: PostmortemQuestion[];
  relatedCards?: string[];
}): PostmortemActivity {
  return {
    id: opts.id,
    kind: 'postmortem',
    title: opts.title,
    prompt: opts.prompt,
    difficulty: 2,
    passScore: 75,
    xp: 20,
    explain: opts.explain,
    incident: {
      simId: opts.simId,
      seekSec: opts.seekSec,
    },
    questions: opts.questions,
    reflection: {
      prompt: bi(
        'Ghi chú bài học vận hành rút ra cho hệ thống của bạn (Root Cause, Tín hiệu nhận biết sớm, Guardrail tự động):',
        'Write down operational takeaways for your own systems (Root Cause, Early Telemetry Signal, Automated Guardrail):'
      ),
      saveToNotes: true,
    },
    relatedCards: opts.relatedCards,
  };
}

/* ============================================================================
 * WR-01: Cache Stampede sau khi hết hạn đồng loạt
 * ============================================================================ */
const wr01Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('lb', { id: 'lb', label: bi('Load Balancer', 'Load Balancer'), opsPerSec: 20_000, zone: 'az-a' }),
  makeNode('service', {
    id: 'app',
    label: bi('Catalog API', 'Catalog API'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 8,
    zone: 'az-a',
    params: { replicas: 4 },
  }),
  makeNode('cache', {
    id: 'cache',
    label: bi('Redis Cache', 'Redis Cache'),
    opsPerSec: 45_000,
    baseMs: 0.8,
    zone: 'az-a',
    params: {
      ttlSec: 300,
      ttlJitterPct: 0,
      hitRatioMax: 0.92,
      workingSetKeys: 14_000,
      capacityKeys: 14_000,
      warmupSec: 20,
      singleflight: false,
    },
  }),
  makeNode('sql', {
    id: 'db',
    label: bi('Catalog DB', 'Catalog DB'),
    opsPerSec: 1_250,
    baseMs: 6,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 40, maxConnections: 400 },
  }),
];

const wr01Links: LinkSpec[] = [
  { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 1200 },
  { id: 'lb-app', from: 'lb', to: 'app', mode: 'sync', timeoutMs: 1000 },
  { id: 'app-cache', from: 'app', to: 'cache', mode: 'sync', timeoutMs: 900 },
  { id: 'cache-db', from: 'cache', to: 'db', mode: 'sync', timeoutMs: 800 },
];

const wr01Scenario: SimScenario = {
  id: 'WR-01/stampede',
  model: { nodes: wr01Nodes, links: wr01Links },
  durationSec: 70,
  load: { kind: 'steady', rps: 4200 },
  events: [{ at: 12, type: 'cache-expire-all', node: 'cache' }],
  seed: 7101,
  mix: { readRatio: 0.95 },
  clientTimeoutMs: 1200,
};

const wr01Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('Lưu lượng người dùng đọc trang danh mục ở mức 4.200 req/s (95% đọc).', 'Steady 4,200 req/s catalog traffic (95% reads).'),
      how: bi('Gửi yêu cầu HTTP đồng bộ qua Load Balancer.', 'Sends synchronous HTTP requests through the Load Balancer.'),
      why: bi('Khi tầng cache mất hiệu lực, toàn bộ 4.200 req/s này biến thành áp lực trực tiếp lên tầng lưu trữ.', 'When cache misses spike, all 4,200 req/s cascade directly onto storage.'),
    },
    {
      id: 'lb',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Load Balancer', 'Load Balancer'),
      what: bi('Bộ cân bằng tải phân phối lưu lượng vào 4 instance Catalog API.', 'Distributes incoming requests across 4 Catalog API instances.'),
      how: bi('Chia đều Round-robin với độ trễ dưới 1 ms.', 'Round-robin routing with sub-millisecond overhead.'),
      why: bi('Đảm bảo không instance ứng dụng nào bị lệch tải.', 'Keeps request distribution balanced across stateless instances.'),
    },
    {
      id: 'app',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Catalog API', 'Catalog API'),
      what: bi('Cụm 4 instance stateless (tổng μ = 7.200 req/s).', '4 stateless API instances (7,200 req/s combined capacity).'),
      how: bi('Đọc dữ liệu qua Redis Cache theo mô hình Read-through.', 'Queries Redis Cache via read-through lookup.'),
      why: bi('Dư địa CPU còn rộng (ρ ≈ 0,58), không phải điểm nghẽn gốc.', 'Has ample CPU headroom (ρ ≈ 0.58) and is not the bottleneck.'),
    },
    {
      id: 'cache',
      col: 3,
      row: 0,
      shape: 'block',
      tone: 'yellow',
      icon: 'zap',
      label: bi('Redis Cache', 'Redis Cache'),
      what: bi('Bộ nhớ đệm RAM giữ 14.000 key danh mục với Hit Ratio ~92% khi ấm.', 'In-memory cache holding 14,000 catalog keys (~92% warm hit ratio).'),
      how: bi('Lúc t = 12s, toàn bộ lô key nạp từ cron job hết hạn cùng một thời điểm (ttlJitterPct = 0, singleflight = false).', 'At t = 12s, batch-populated keys expire simultaneously (ttlJitterPct = 0, singleflight = false).'),
      why: bi('Thiếu Singleflight và TTL Jitter khiến hàng nghìn request cùng miss và đồng loạt truy vấn DB để tính lại cùng một key.', 'Without singleflight and TTL jitter, thousands of concurrent misses query the DB for identical keys.'),
    },
    {
      id: 'db',
      col: 4,
      row: 0,
      shape: 'db',
      tone: 'orange',
      label: bi('Catalog DB', 'Catalog DB'),
      what: bi('Cơ sở dữ liệu SQL chính (μ = 1.250 req/s).', 'Primary SQL Database (μ = 1,250 req/s).'),
      how: bi('Bình thường chỉ nhận ~530 req/s nhờ Cache; khi stampede xảy ra, tải vọt lên ~4.200 req/s (ρ > 3,3).', 'Normally receives ~530 req/s behind cache; during stampede, load jumps to ~4,200 req/s (ρ > 3.3).'),
      why: bi('Khi ρ vượt xa 1, hàng đợi DB đầy nhanh và trả lỗi hàng loạt.', 'Once ρ far exceeds 1, the DB queue saturates and drops requests.'),
    },
  ],
  [
    {
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      what: bi('Kết nối Internet từ người dùng tới Load Balancer.', 'Public Internet link from users to Load Balancer.'),
      how: bi('RTT ~30 ms, timeout client 1.200 ms.', '~30 ms RTT, 1,200 ms client timeout.'),
      why: bi('Đo độ trễ đầu-cuối mà khách hàng thực tế cảm nhận.', 'Measures end-to-end user-perceived latency.'),
    },
    {
      id: 'lb-app',
      from: 'lb',
      to: 'app',
      what: bi('Đường nối nội bộ sang cụm Catalog API.', 'Internal hop to Catalog API tier.'),
      how: bi('Chia tải đồng đều trong cùng Availability Zone.', 'Balanced intra-AZ forwarding.'),
      why: bi('Tách điểm vào cố định với số lượng instance động.', 'Decouples public VIP from dynamic app instances.'),
    },
    {
      id: 'app-cache',
      from: 'app',
      to: 'cache',
      what: bi('Truy vấn Read-through sang Redis Cache.', 'Read-through lookup to Redis Cache.'),
      how: bi('Hit trả ngay ~0,8 ms; Miss chuyển tiếp xuống Catalog DB.', 'Returns hits in ~0.8 ms; forwards misses to Catalog DB.'),
      why: bi('Giảm 92% lượt đọc khỏi tầng SQL khi cache ấm.', 'Shields SQL tier from 92% of reads when warm.'),
    },
    {
      id: 'cache-db',
      from: 'cache',
      to: 'db',
      what: bi('Đường nạp lại dữ liệu từ Catalog DB khi Cache Miss.', 'Cache-miss origin fill link to Catalog DB.'),
      how: bi('Khi singleflight bật, chỉ 1 request cho mỗi key đi qua đường này trong lúc làm ấm.', 'With singleflight enabled, coalesces concurrent misses per key.'),
      why: bi('Ngăn hàng nghìn truy vấn trùng lặp đổ dồn vào DB lúc cache lạnh.', 'Prevents duplicate origin queries during cold or expired cache windows.'),
    },
  ]
);

/* ============================================================================
 * WR-02: Bão Retry (Retry Storm) làm sập tầng dưới
 * ============================================================================ */
const wr02Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('gateway', {
    id: 'gw',
    label: bi('API Gateway', 'API Gateway'),
    replicas: 3,
    opsPerSec: 3_000,
    baseMs: 3,
    zone: 'az-a',
  }),
  makeNode('service', {
    id: 'order-svc',
    label: bi('Order Service', 'Order Service'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 10,
    zone: 'az-a',
    params: { replicas: 4, poolSize: 80 },
  }),
  makeNode('cache', {
    id: 'session-cache',
    label: bi('Session Cache', 'Session Cache'),
    opsPerSec: 30_000,
    baseMs: 1,
    zone: 'az-a',
    params: { ttlSec: 600, ttlJitterPct: 0.2, hitRatioMax: 0.98, workingSetKeys: 50_000, capacityKeys: 50_000, singleflight: true },
  }),
  makeNode('sql', {
    id: 'db',
    label: bi('Order DB', 'Order DB'),
    opsPerSec: 1_800,
    baseMs: 12,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 250, maxConnections: 500 },
  }),
];

const wr02Links: LinkSpec[] = [
  { id: 'client-gw', from: 'client', to: 'gw', mode: 'sync', netClass: 'internet', timeoutMs: 1500 },
  { id: 'gw-order', from: 'gw', to: 'order-svc', mode: 'sync', timeoutMs: 1200 },
  { id: 'order-session', from: 'order-svc', to: 'session-cache', mode: 'sync', carries: 'r', timeoutMs: 80 },
  {
    id: 'order-db',
    from: 'order-svc',
    to: 'db',
    mode: 'sync',
    carries: 'rw',
    timeoutMs: 95,
    retry: {
      max: 3,
      backoff: 'none',
      baseMs: 0,
      jitter: 'none',
    },
  },
];

const wr02Scenario: SimScenario = {
  id: 'WR-02/retry-storm',
  model: {
    nodes: wr02Nodes,
    links: wr02Links,
    routes: { 'order-svc': 'all-parallel' },
  },
  durationSec: 75,
  load: { kind: 'steady', rps: 1350 },
  events: [{ at: 10, type: 'slowdown', node: 'db', addMs: 90, durationSec: 18 }],
  seed: 7102,
  mix: { readRatio: 0.6 },
  clientTimeoutMs: 1500,
};

const wr02Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('Lưu lượng đặt hàng ổn định 1.350 req/s.', 'Steady 1,350 req/s order traffic.'),
      how: bi('Gửi yêu cầu tạo/xem đơn hàng qua API Gateway.', 'Sends order requests via API Gateway.'),
      why: bi('Lưu lượng gốc không hề tăng đột biến; sự cố phát sinh từ cơ chế tự khuếch đại bên trong.', 'External traffic is flat; the outage comes from internal retry amplification.'),
    },
    {
      id: 'gw',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'shield',
      label: bi('API Gateway', 'API Gateway'),
      what: bi('Cổng xác thực và định tuyến vào Order Service.', 'Edge gateway routing into Order Service.'),
      how: bi('3 instance xử lý tối đa 9.000 req/s.', '3 instances handling up to 9,000 req/s.'),
      why: bi('Không thực hiện retry chồng lên Order Service.', 'Forwards requests cleanly without nested edge retries.'),
    },
    {
      id: 'order-svc',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Order Service', 'Order Service'),
      what: bi('Dịch vụ xử lý đơn hàng (4 instance, μ = 7.200 req/s).', 'Order microservice (4 instances, μ = 7,200 req/s).'),
      how: bi('Kiểm tra Session Cache song song với truy vấn Order DB; link order-db đang cấu hình timeout 95 ms và retry ngay lập tức 3 lần không backoff.', 'Queries Session Cache and Order DB; order-db link uses 95 ms timeout with 3 immediate zero-backoff retries.'),
      why: bi('Khi DB chậm nhẹ lên ~102 ms, timeout 95 ms kích hoạt 3 lượt retry tức thì, nhân tải vào DB lên gần 4 lần.', 'When DB slows to ~102 ms, the 95 ms timeout triggers 3 instant retries, multiplying DB arrival rate nearly 4×.'),
    },
    {
      id: 'session-cache',
      col: 3,
      row: -0.65,
      shape: 'block',
      tone: 'yellow',
      icon: 'zap',
      label: bi('Session Cache', 'Session Cache'),
      what: bi('Cache xác thực phiên người dùng cực nhanh (~1 ms).', 'Fast user session cache (~1 ms).'),
      how: bi('Hoạt động ổn định suốt sự cố (ρ < 0,05).', 'Remains completely healthy throughout the incident (ρ < 0.05).'),
      why: bi('Giúp loại trừ giả thuyết lỗi xác thực phiên.', 'Rules out session lookup as a suspect.'),
    },
    {
      id: 'db',
      col: 3,
      row: 0.65,
      shape: 'db',
      tone: 'orange',
      label: bi('Order DB', 'Order DB'),
      what: bi('Cơ sở dữ liệu đơn hàng (μ = 1.800 req/s).', 'Order SQL database (μ = 1,800 req/s).'),
      how: bi('Từ t = 10s..28s, tác vụ vacuum nền cộng thêm +90 ms độ trễ nhưng thông lượng tối đa vẫn đủ 1.800 req/s.', 'From t = 10s..28s, background maintenance adds +90 ms latency while capacity stays 1,800 req/s.'),
      why: bi('Chính bão retry (> 4.500 req/s) đẩy ρ vượt 2,5 và giữ hàng đợi DB nghẽn kéo dài.', 'Retry amplification (> 4,500 req/s) pushes ρ past 2.5 and collapses DB queueing.'),
    },
  ],
  [
    {
      id: 'client-gw',
      from: 'client',
      to: 'gw',
      what: bi('Đường truyền từ khách hàng tới API Gateway.', 'Client to API Gateway link.'),
      how: bi('HTTP/2 qua Internet.', 'HTTP/2 over Internet.'),
      why: bi('Điểm đo tỉ lệ lỗi và p99 đầu-cuối.', 'Entry point for end-to-end error rate and p99.'),
    },
    {
      id: 'gw-order',
      from: 'gw',
      to: 'order-svc',
      what: bi('Kết nối nội bộ từ Gateway sang Order Service.', 'Internal hop from Gateway to Order Service.'),
      how: bi('Không cấu hình retry trùng lặp ở tầng trên.', 'Single retry layer policy — no duplicate retries here.'),
      why: bi('Tránh nhân cấp số nhân số lần gọi giữa các tầng.', 'Avoids multiplicative retries across tiers.'),
    },
    {
      id: 'order-session',
      from: 'order-svc',
      to: 'session-cache',
      what: bi('Kiểm tra phiên đăng nhập trên Redis.', 'Session verification lookup.'),
      how: bi('Timeout 80 ms, độ trễ ~1,5 ms.', '80 ms timeout, ~1.5 ms latency.'),
      why: bi('Nhánh song song nhẹ, không gây nghẽn.', 'Fast parallel dependency.'),
    },
    {
      id: 'order-db',
      from: 'order-svc',
      to: 'db',
      what: bi('Kết nối Order Service → Order DB đang cấu hình retry sai.', 'Order Service → Order DB link with aggressive retry policy.'),
      how: bi('max = 3, backoff = none, jitter = none, không có retry budget hay circuit breaker.', 'max = 3, backoff = none, jitter = none, no retry budget or circuit breaker.'),
      why: bi('Cần đổi sang Exponential Backoff + Full Jitter + Retry Budget 10% + Circuit Breaker và nới timeout hợp lý.', 'Requires Exponential Backoff + Full Jitter + 10% Retry Budget + Circuit Breaker.'),
    },
  ]
);

/* ============================================================================
 * WR-03: Hot Key / Tài khoản nổi tiếng làm nghẽn một Shard
 * ============================================================================ */
const wr03Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('lb', { id: 'lb', label: bi('Load Balancer', 'Load Balancer'), opsPerSec: 25_000, zone: 'az-a' }),
  makeNode('service', {
    id: 'feed-svc',
    label: bi('Feed Service', 'Feed Service'),
    replicas: 5,
    opsPerSec: 1_800,
    baseMs: 7,
    zone: 'az-a',
    params: { replicas: 5 },
  }),
  makeNode('cache', {
    id: 'hot-cache',
    label: bi('Read Cache', 'Read Cache'),
    opsPerSec: 60_000,
    baseMs: 0.6,
    zone: 'az-a',
    params: {
      ttlSec: 180,
      ttlJitterPct: 0.2,
      hitRatioMax: 0.94,
      workingSetKeys: 200_000,
      capacityKeys: 2_000,
      warmupSec: 15,
      singleflight: false,
    },
    knobs: [
      numKnob('capacityKeys', 'Dung lượng Read Cache (số key)', 'Read Cache capacity (keys)', 2_000, 2_000, 250_000, 10_000),
      { key: 'singleflight', type: 'bool', label: bi('Singleflight gộp miss', 'Singleflight coalescing'), default: false, changeCost: 1 },
    ],
  }),
  makeNode('nosql', {
    id: 'feed-store',
    label: bi('Sharded NoSQL', 'Sharded NoSQL'),
    opsPerSec: 2_200,
    baseMs: 4,
    zone: 'az-a',
    params: { shards: 4, maxConnections: 2000 },
  }),
];

const wr03Links: LinkSpec[] = [
  { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 1000 },
  { id: 'lb-feed', from: 'lb', to: 'feed-svc', mode: 'sync', timeoutMs: 900 },
  { id: 'feed-cache', from: 'feed-svc', to: 'hot-cache', mode: 'sync', timeoutMs: 800 },
  { id: 'cache-store', from: 'hot-cache', to: 'feed-store', mode: 'sync', timeoutMs: 700 },
];

const wr03Scenario: SimScenario = {
  id: 'WR-03/hot-key',
  model: { nodes: wr03Nodes, links: wr03Links },
  durationSec: 70,
  load: { kind: 'steady', rps: 5000 },
  events: [{ at: 8, type: 'hot-key', node: 'feed-store', share: 0.55 }],
  seed: 7103,
  mix: { readRatio: 0.94 },
  clientTimeoutMs: 1000,
};

const wr03Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('5.000 req/s đọc bảng tin sự kiện trực tiếp (94% đọc).', '5,000 req/s reading live event feeds (94% reads).'),
      how: bi('Phần lớn người dùng cùng mở trang của một tài khoản nổi tiếng vừa đăng bài lúc t = 8s.', 'At t = 8s, 55% of reads concentrate on a single celebrity account key.'),
      why: bi('Phân phối lệch Zipf làm hàm băm chuẩn không còn chia đều tải.', 'Extreme Zipfian skew defeats uniform hash partitioning.'),
    },
    {
      id: 'lb',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Load Balancer', 'Load Balancer'),
      what: bi('Chia đều 5.000 req/s sang 5 máy Feed Service.', 'Spreads 5,000 req/s evenly across 5 Feed Service nodes.'),
      how: bi('Tầng stateless không bị ảnh hưởng bởi độ lệch key.', 'Stateless routing is unaffected by key skew.'),
      why: bi('Cho thấy cân bằng tải ở tầng L7 không tự giải quyết được Hot Partition ở tầng dữ liệu.', 'Shows L7 load balancing cannot solve storage-layer hot partitions.'),
    },
    {
      id: 'feed-svc',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Feed Service', 'Feed Service'),
      what: bi('5 instance phục vụ API bảng tin (tổng μ = 9.000 req/s).', '5 Feed API instances (9,000 req/s aggregate capacity).'),
      how: bi('Tra cứu Read Cache trước khi xuống Sharded NoSQL.', 'Checks Read Cache before querying Sharded NoSQL.'),
      why: bi('Giữ vai trò tầng tính toán trung gian.', 'Stateless compute layer.'),
    },
    {
      id: 'hot-cache',
      col: 3,
      row: 0,
      shape: 'block',
      tone: 'yellow',
      icon: 'zap',
      label: bi('Read Cache', 'Read Cache'),
      what: bi('Tầng cache đọc hiện chỉ cấp 2.000 key trên tập 200.000 key (Hit Ratio < 10%).', 'Read cache currently under-provisioned at 2,000 / 200,000 keys (< 10% hit ratio).'),
      how: bi('Do dung lượng quá nhỏ, key nóng liên tục bị đẩy ra hoặc miss xuống NoSQL.', 'Tiny key budget causes ~90% of reads to miss to NoSQL.'),
      why: bi('Mở rộng dung lượng Read Cache + Singleflight giúp hấp thụ > 90% lượt đọc key nóng ngay tại RAM.', 'Expanding cache capacity + singleflight absorbs > 90% of hot-key reads in memory.'),
    },
    {
      id: 'feed-store',
      col: 4,
      row: 0,
      shape: 'db',
      tone: 'orange',
      label: bi('Sharded NoSQL', 'Sharded NoSQL'),
      what: bi('Cụm NoSQL 4 shard, mỗi shard chịu tối đa 2.200 req/s (tổng danh nghĩa 8.800 req/s).', '4-shard NoSQL store, 2,200 req/s per shard (8,800 req/s nominal).'),
      how: bi('Khi 1 key chiếm 55% lưu lượng (~2.580 req/s vào riêng 1 shard), shard đó vượt trần 2.200 req/s dù 3 shard còn lại rảnh.', 'When 1 key attracts 55% of traffic (~2,580 req/s onto one shard), that shard exceeds 2,200 req/s while the other 3 sit idle.'),
      why: bi('Chỉ tăng số shard từ 4 lên 12 vẫn để nguyên 55% tải dồn vào 1 shard duy nhất!', 'Adding more shards still maps the single hot key onto one shard!'),
    },
  ],
  [
    {
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      what: bi('Lưu lượng người dùng vào hệ thống.', 'User traffic entering the edge.'),
      how: bi('5.000 req/s ổn định.', '5,000 req/s steady load.'),
      why: bi('Đo SLO độ trễ p99 ≤ 100 ms.', 'Tracks p99 ≤ 100 ms SLO.'),
    },
    {
      id: 'lb-feed',
      from: 'lb',
      to: 'feed-svc',
      what: bi('Phân phối đều sang Feed Service.', 'Even distribution to Feed Service.'),
      how: bi('Round-robin nội bộ.', 'Internal Round-robin.'),
      why: bi('Giữ tải CPU đồng đều.', 'Balances stateless compute.'),
    },
    {
      id: 'feed-cache',
      from: 'feed-svc',
      to: 'hot-cache',
      what: bi('Đọc dữ liệu bài đăng từ Read Cache.', 'Feed lookup against Read Cache.'),
      how: bi('Độ trễ 0,6 ms khi Cache Hit.', '0.6 ms latency on cache hit.'),
      why: bi('Lá chắn hiệu quả nhất cho truy vấn đọc lệch key.', 'Primary shield against read hot-spots.'),
    },
    {
      id: 'cache-store',
      from: 'hot-cache',
      to: 'feed-store',
      what: bi('Truy vấn xuống Sharded NoSQL khi Cache Miss.', 'Origin query to Sharded NoSQL on cache miss.'),
      how: bi('Băm theo account_id đưa toàn bộ truy vấn của 1 tài khoản về đúng 1 shard.', 'Hashing by account_id routes all reads of one celebrity to a single shard.'),
      why: bi('Phải giảm lưu lượng miss đi qua đường này dưới trần của 1 shard đơn lẻ.', 'Miss traffic must stay below a single shard’s throughput ceiling.'),
    },
  ]
);

/* ============================================================================
 * WR-04: Cạn kiệt Connection Pool dây chuyền
 * ============================================================================ */
const wr04Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('lb', { id: 'lb', label: bi('Load Balancer', 'Load Balancer'), opsPerSec: 20_000, zone: 'az-a' }),
  makeNode('service', {
    id: 'checkout-svc',
    label: bi('Checkout API', 'Checkout API'),
    replicas: 4,
    opsPerSec: 1_200,
    baseMs: 10,
    zone: 'az-a',
    params: { replicas: 4, poolSize: 6 },
    knobs: [
      numKnob('replicas', 'Số instance Checkout API', 'Checkout API instances', 4, 1, 10, 1),
      numKnob('poolSize', 'DB Connection Pool mỗi instance', 'DB Connection Pool per instance', 6, 4, 60, 2),
    ],
  }),
  makeNode('cache', {
    id: 'price-cache',
    label: bi('Price Cache', 'Price Cache'),
    opsPerSec: 35_000,
    baseMs: 0.8,
    zone: 'az-a',
    params: { ttlSec: 300, ttlJitterPct: 0.2, hitRatioMax: 0.95, workingSetKeys: 40_000, capacityKeys: 40_000, singleflight: true },
  }),
  makeNode('sql', {
    id: 'sql-db',
    label: bi('Orders SQL', 'Orders SQL'),
    opsPerSec: 2_200,
    baseMs: 6,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 14, maxConnections: 140 },
    knobs: [
      numKnob('sizeFactor', 'Cỡ máy Orders SQL', 'Orders SQL sizeFactor', 1, 1, 4, 1),
      numKnob('poolSize', 'Worker/Pool xử lý đồng thời tại DB', 'DB concurrent execution pool', 14, 8, 80, 4),
    ],
  }),
];

const wr04Links: LinkSpec[] = [
  { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 1200 },
  { id: 'lb-checkout', from: 'lb', to: 'checkout-svc', mode: 'sync', timeoutMs: 1000 },
  { id: 'checkout-cache', from: 'checkout-svc', to: 'price-cache', mode: 'sync', carries: 'r', timeoutMs: 80 },
  { id: 'checkout-db', from: 'checkout-svc', to: 'sql-db', mode: 'sync', carries: 'rw', timeoutMs: 900 },
];

const wr04Scenario: SimScenario = {
  id: 'WR-04/pool-exhaustion',
  model: {
    nodes: wr04Nodes,
    links: wr04Links,
    routes: { 'checkout-svc': 'all-parallel' },
  },
  durationSec: 70,
  load: { kind: 'steady', rps: 1500 },
  events: [
    { at: 10, type: 'slowdown', node: 'sql-db', addMs: 22 },
    { at: 10, type: 'slowdown', node: 'checkout-svc', addMs: 18 },
  ],
  seed: 7104,
  mix: { readRatio: 0.7 },
  clientTimeoutMs: 1200,
};

const wr04Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('1.500 req/s thanh toán đơn hàng.', '1,500 req/s checkout traffic.'),
      how: bi('Gửi yêu cầu đồng bộ qua Load Balancer.', 'Synchronous checkout requests via Load Balancer.'),
      why: bi('Yêu cầu độ trễ p99 ≤ 180 ms và tỉ lệ lỗi < 1%.', 'Requires p99 ≤ 180 ms and < 1% error rate.'),
    },
    {
      id: 'lb',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Load Balancer', 'Load Balancer'),
      what: bi('Chia tải vào 4 máy Checkout API.', 'Routes traffic to 4 Checkout API instances.'),
      how: bi('Round-robin nội bộ.', 'Round-robin balancing.'),
      why: bi('Không giữ kết nối DB.', 'Stateless L7 proxy.'),
    },
    {
      id: 'checkout-svc',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Checkout API', 'Checkout API'),
      what: bi('4 instance ứng dụng, mỗi máy cấu hình poolSize = 6 kết nối (tổng CPU dư sức đạt 4.800 req/s).', '4 API instances configured with tiny poolSize = 6 (CPU capable of 4,800 req/s).'),
      how: bi('Theo định luật Little (μ ≤ poolSize / S): khi thời gian giữ kết nối tăng từ 10 ms lên 28 ms lúc t = 10s, thông lượng mỗi máy tụt xuống 6 / 0,028 ≈ 214 req/s (tổng 857 req/s < 1.500 req/s).', 'By Little’s Law (μ ≤ pool / S): when hold time rises from 10 ms to 28 ms at t = 10s, per-instance throughput drops to 6 / 0.028 ≈ 214 req/s (857 req/s total < 1,500 req/s).'),
      why: bi('Cần chỉnh poolSize vừa đủ theo Little’s Law nhưng tổng `replicas × poolSize` không được vượt `maxConnections = 140` của SQL.', 'Must right-size poolSize via Little’s Law while keeping `replicas × poolSize ≤ maxConnections (140)`.'),
    },
    {
      id: 'price-cache',
      col: 3,
      row: -0.65,
      shape: 'block',
      tone: 'yellow',
      icon: 'zap',
      label: bi('Price Cache', 'Price Cache'),
      what: bi('Cache bảng giá khuyến mãi (~0,8 ms).', 'Promotional price cache (~0.8 ms).'),
      how: bi('Phản hồi tức thì, không chiếm giữ kết nối lâu.', 'Responds in sub-millisecond time.'),
      why: bi('Cho thấy nghẽn nằm ở nhánh kết nối SQL.', 'Confirms bottleneck is isolated to the SQL connection path.'),
    },
    {
      id: 'sql-db',
      col: 3,
      row: 0.65,
      shape: 'db',
      tone: 'orange',
      label: bi('Orders SQL', 'Orders SQL'),
      what: bi('Cơ sở dữ liệu SQL giới hạn `maxConnections = 140` và worker pool = 14.', 'SQL DB with `maxConnections = 140` and execution pool = 14.'),
      how: bi('Lúc t = 10s, truy vấn báo cáo thiếu index làm thời gian thực thi tăng từ 6 ms lên 28 ms, khiến thông lượng pool giảm còn 14 / 0,028 = 500 req/s dù CPU còn trống.', 'At t = 10s, an unindexed query raises service time from 6 ms to 28 ms, capping pool throughput at 14 / 0.028 = 500 req/s despite spare CPU.'),
      why: bi('Cần mở rộng pool thực thi hợp lý kết hợp tối ưu/nâng cỡ DB và đặt timeout rõ ràng.', 'Needs balanced pool sizing + DB capacity/query fix without exceeding maxConnections.'),
    },
  ],
  [
    {
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      what: bi('Lưu lượng thanh toán từ người dùng.', 'User checkout requests.'),
      how: bi('1.500 req/s.', '1,500 req/s.'),
      why: bi('Đường chính đo SLO.', 'Primary user path.'),
    },
    {
      id: 'lb-checkout',
      from: 'lb',
      to: 'checkout-svc',
      what: bi('Chuyển tiếp sang Checkout API.', 'Forwards to Checkout API.'),
      how: bi('Timeout 1.000 ms.', '1,000 ms timeout.'),
      why: bi('Khi Checkout API hết kết nối trong pool, hàng đợi bắt đầu dồn tại đây.', 'Requests queue here when Checkout API connection pools saturate.'),
    },
    {
      id: 'checkout-cache',
      from: 'checkout-svc',
      to: 'price-cache',
      what: bi('Đọc giá sản phẩm từ Redis.', 'Price lookup on Redis.'),
      how: bi('Song song với truy vấn SQL.', 'Runs in parallel with SQL query.'),
      why: bi('Không bị nghẽn.', 'Healthy fast path.'),
    },
    {
      id: 'checkout-db',
      from: 'checkout-svc',
      to: 'sql-db',
      what: bi('Hồ kết nối JDBC/PgBouncer từ Checkout API tới Orders SQL.', 'Connection pool link from Checkout API to Orders SQL.'),
      how: bi('Tổng kết nối tối đa = `replicas × poolSize` so với `maxConnections = 140`.', 'Total fan-in connections = `replicas × poolSize` vs `maxConnections = 140`.'),
      why: bi('Đặt pool quá nhỏ gây nghẽn cổ chai; đặt quá lớn làm vượt trần kết nối của DB.', 'Too small starves threads; too large exceeds DB maxConnections.'),
    },
  ]
);

/* ============================================================================
 * WR-05: Tồn đọng Queue & Poison Message lặp vô hạn
 * ============================================================================ */
const wr05Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Merchant Webhook', 'Merchant Webhook'), zone: 'internet' }),
  makeNode('gateway', {
    id: 'ingest-api',
    label: bi('Ingest API', 'Ingest API'),
    replicas: 3,
    opsPerSec: 3_500,
    baseMs: 4,
    zone: 'az-a',
  }),
  makeNode('queue', {
    id: 'job-queue',
    label: bi('Invoice Queue', 'Invoice Queue'),
    opsPerSec: 50_000,
    baseMs: 1.5,
    zone: 'az-a',
    params: { maxDepth: 2_400, dlq: false, visibilitySec: 30 },
    knobs: [
      { key: 'dlq', type: 'bool', label: bi('Dead-Letter Queue (DLQ)', 'Dead-Letter Queue (DLQ)'), default: false, changeCost: 1 },
      numKnob('maxDepth', 'Sức chứa hàng đợi tối đa', 'Max queue depth', 2_400, 1_000, 50_000, 1_000),
    ],
  }),
  makeNode('worker', {
    id: 'worker',
    label: bi('Invoice Worker', 'Invoice Worker'),
    replicas: 2,
    opsPerSec: 340,
    baseMs: 25,
    capacity: { opsPerSec: 340, concurrency: 80 },
    zone: 'az-a',
    params: { replicas: 2 },
  }),
  makeNode('sql', {
    id: 'ledger-db',
    label: bi('Ledger DB', 'Ledger DB'),
    opsPerSec: 2_500,
    baseMs: 5,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 60 },
  }),
];

const wr05Links: LinkSpec[] = [
  { id: 'client-ingest', from: 'client', to: 'ingest-api', mode: 'sync', netClass: 'internet', timeoutMs: 800 },
  { id: 'ingest-queue', from: 'ingest-api', to: 'job-queue', mode: 'async', timeoutMs: 400 },
  { id: 'queue-worker', from: 'job-queue', to: 'worker', mode: 'pull' },
  { id: 'worker-db', from: 'worker', to: 'ledger-db', mode: 'sync', carries: 'w', timeoutMs: 600 },
];

const wr05Scenario: SimScenario = {
  id: 'WR-05/poison-queue',
  model: { nodes: wr05Nodes, links: wr05Links },
  durationSec: 75,
  load: { kind: 'steady', rps: 780 },
  events: [{ at: 6, type: 'deploy', node: 'worker', version: 'v2.4-strict-parser', bad: true }],
  seed: 7105,
  mix: { readRatio: 0.1 },
  clientTimeoutMs: 800,
};

const wr05Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Merchant Webhook', 'Merchant Webhook'),
      what: bi('Đối tác gửi 780 sự kiện hóa đơn/giây vào hệ thống.', 'Merchants sending 780 invoice events/sec.'),
      how: bi('Gọi HTTP POST vào Ingest API.', 'Sends HTTP POST webhooks to Ingest API.'),
      why: bi('Cần Ingest API nhận bền vững không đánh rơi sự kiện.', 'Expects reliable webhook ingestion without drops.'),
    },
    {
      id: 'ingest-api',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'shield',
      label: bi('Ingest API', 'Ingest API'),
      what: bi('Cổng tiếp nhận sự kiện và đẩy bất đồng bộ vào Invoice Queue.', 'Ingestion gateway enqueuing events asynchronously.'),
      how: bi('Trả lời 202 Accepted ngay khi Invoice Queue còn chỗ trống.', 'Returns 202 Accepted as long as Invoice Queue has capacity.'),
      why: bi('Nếu hàng đợi đầy (`maxDepth = 2.400`), Ingest API buộc phải từ chối sự kiện mới!', 'Once queue hits `maxDepth = 2,400`, Ingest API drops incoming webhooks!'),
    },
    {
      id: 'job-queue',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'rose',
      icon: 'layers',
      label: bi('Invoice Queue', 'Invoice Queue'),
      what: bi('Hàng đợi thông điệp (`maxDepth = 2.400`, hiện `dlq = false`).', 'Message queue (`maxDepth = 2,400`, currently `dlq = false`).'),
      how: bi('Khi Worker xử lý lỗi và chưa bật DLQ, thông điệp lỗi (Poison Message) bị trả ngược lại hàng đợi vô hạn, chiếm mất 40% năng lực tiêu thụ.', 'With `dlq = false`, failing poison messages requeue endlessly, consuming 40% of worker throughput.'),
      why: bi('Bật DLQ giúp cô lập bản tin lỗi sang hàng đợi riêng sau số lần thử quy định.', 'Enabling DLQ isolates malformed messages so valid traffic drains cleanly.'),
    },
    {
      id: 'worker',
      col: 3,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Invoice Worker', 'Invoice Worker'),
      what: bi('Cụm 2 Worker tiêu thụ hàng đợi (mỗi máy 340 msg/s → tổng 680 msg/s).', '2 consumer workers (340 msg/s each → 680 msg/s total).'),
      how: bi('Lúc t = 6s, bản deploy `v2.4` gặp định dạng bản tin lỗi (~40% lỗi parse), làm tốc độ tiêu thụ thực giảm còn ~408 msg/s < 780 msg/s.', 'At t = 6s, deploy `v2.4` hits malformed payloads (~40% fault rate), cutting net drain rate to ~408 msg/s < 780 msg/s.'),
      why: bi('Ngoài bật DLQ, cần tăng thêm Worker (≥ 3–4 instance) để tổng năng lực vượt 780 msg/s và xả hết backlog.', 'Alongside enabling DLQ, worker replicas must scale above 780 msg/s to drain backlog.'),
    },
    {
      id: 'ledger-db',
      col: 4,
      row: 0,
      shape: 'db',
      tone: 'orange',
      label: bi('Ledger DB', 'Ledger DB'),
      what: bi('Cơ sở dữ liệu sổ cái lưu hóa đơn hợp lệ (μ = 2.500 req/s).', 'Ledger SQL database storing parsed invoices (μ = 2,500 req/s).'),
      how: bi('Hoạt động nhẹ nhàng (ρ ≈ 0,30), không phải nút nghẽn.', 'Healthy utilization (ρ ≈ 0.30), not the bottleneck.'),
      why: bi('Xác nhận nghẽn nằm ở tầng tiêu thụ hàng đợi.', 'Confirms bottleneck is in queue consumption, not DB writes.'),
    },
  ],
  [
    {
      id: 'client-ingest',
      from: 'client',
      to: 'ingest-api',
      what: bi('Đối tác gửi webhook hóa đơn.', 'Webhook delivery from merchants.'),
      how: bi('780 req/s.', '780 req/s.'),
      why: bi('Đo tỉ lệ rơi gói tại cửa ngõ.', 'Tracks ingestion drop rate.'),
    },
    {
      id: 'ingest-queue',
      from: 'ingest-api',
      to: 'job-queue',
      style: 'dashed',
      what: bi('Đẩy thông điệp bất đồng bộ vào hàng đợi.', 'Async enqueue link.'),
      how: bi('Chặn lỗi khi backlog chạm trần maxDepth.', 'Drops when backlog hits maxDepth.'),
      why: bi('Tách nhịp độ nhận và nhịp độ xử lý.', 'Decouples ingestion from worker processing.'),
    },
    {
      id: 'queue-worker',
      from: 'job-queue',
      to: 'worker',
      style: 'dashed',
      what: bi('Luồng kéo (pull) từ Invoice Queue sang Worker.', 'Worker pull subscription from Invoice Queue.'),
      how: bi('Không có DLQ thì các bản tin lỗi quay vòng liên tục trên đường này.', 'Without DLQ, poison messages loop repeatedly over this link.'),
      why: bi('Cần kết hợp DLQ + đủ số lượng Worker.', 'Needs DLQ + sufficient worker replicas.'),
    },
    {
      id: 'worker-db',
      from: 'worker',
      to: 'ledger-db',
      what: bi('Ghi hóa đơn đã xử lý vào Ledger DB.', 'Persists validated invoices into Ledger DB.'),
      how: bi('Độ trễ ~5 ms.', '~5 ms write latency.'),
      why: bi('Đích lưu trữ cuối cùng.', 'Final durable persistence.'),
    },
  ]
);

/* ============================================================================
 * WR-06: Replication Lag cao gây đọc dữ liệu cũ (Stale Read)
 * ============================================================================ */
const wr06Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('lb', { id: 'lb', label: bi('Load Balancer', 'Load Balancer'), opsPerSec: 25_000, zone: 'az-a' }),
  makeNode('service', {
    id: 'profile-api',
    label: bi('Wallet / Order API', 'Wallet / Order API'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 7,
    zone: 'az-a',
    params: { replicas: 4 },
  }),
  makeNode('sql', {
    id: 'db-primary',
    label: bi('Primary SQL', 'Primary SQL'),
    opsPerSec: 2_600,
    baseMs: 5,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 120, maxConnections: 400 },
  }),
  makeNode('sql', {
    id: 'db-replica',
    label: bi('Read Replica', 'Read Replica'),
    opsPerSec: 1_900,
    baseMs: 5,
    zone: 'az-b',
    params: { sizeFactor: 1, applyRps: 950, rewriteHotness: 0.08, poolSize: 120, maxConnections: 400 },
    knobs: [
      numKnob('sizeFactor', 'Cỡ máy Read Replica', 'Read Replica sizeFactor', 1, 1, 4, 1),
      numKnob('applyRps', 'Tốc độ áp WAL trên Replica', 'Replica WAL applyRps', 950, 500, 3_000, 250, 'rps'),
    ],
  }),
];

const wr06Links: LinkSpec[] = [
  { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 1000 },
  { id: 'lb-api', from: 'lb', to: 'profile-api', mode: 'sync', timeoutMs: 900 },
  { id: 'api-primary', from: 'profile-api', to: 'db-primary', mode: 'sync', carries: 'rw', weight: 1, timeoutMs: 600 },
  { id: 'api-replica', from: 'profile-api', to: 'db-replica', mode: 'sync', carries: 'r', weight: 9, timeoutMs: 600 },
  { id: 'primary-repl', from: 'db-primary', to: 'db-replica', mode: 'replicate', carries: 'w', netMs: 2 },
];

const wr06Scenario: SimScenario = {
  id: 'WR-06/replication-lag',
  model: {
    nodes: wr06Nodes,
    links: wr06Links,
    routes: { 'profile-api': 'split' },
  },
  durationSec: 75,
  load: { kind: 'spike', base: 1400, peak: 3200, atSec: 10, holdSec: 45, riseSec: 4, fallSec: 6 },
  events: [],
  seed: 7106,
  mix: { readRatio: 0.75 },
  clientTimeoutMs: 1000,
};

const wr06Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('Đợt mở bán lúc t = 10s đẩy tải từ 1.400 lên 3.200 req/s (75% đọc, 25% ghi).', 'Flash sale at t = 10s spikes traffic from 1,400 to 3,200 req/s (75% reads, 25% writes).'),
      how: bi('Người dùng vừa nạp ví/đặt đơn xong lập tức tải lại trang để kiểm tra số dư.', 'Users update wallet/orders and immediately refresh to read their updated balance.'),
      why: bi('Khi Read Replica trễ hàng giây, người dùng đọc thấy số dư cũ (vi phạm Read-Your-Writes).', 'Multi-second replica lag causes users to see stale balances (Read-Your-Writes violation).'),
    },
    {
      id: 'lb',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Load Balancer', 'Load Balancer'),
      what: bi('Cân bằng tải vào cụm Wallet / Order API.', 'Balances traffic into Wallet / Order API.'),
      how: bi('Hoạt động ổn định ở 3.200 req/s.', 'Handles 3,200 req/s smoothly.'),
      why: bi('Điểm vào chung của ứng dụng.', 'Stateless entry proxy.'),
    },
    {
      id: 'profile-api',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Wallet / Order API', 'Wallet / Order API'),
      what: bi('4 instance định tuyến 100% ghi về Primary và 90% đọc sang Read Replica.', '4 instances routing 100% of writes to Primary and 90% of reads to Read Replica.'),
      how: bi('Ở đỉnh 3.200 req/s: 800 ghi/s vào Primary, còn 2.160 đọc/s dồn sang Read Replica.', 'At 3,200 req/s peak: 800 writes/s hit Primary while 2,160 reads/s hit Read Replica.'),
      why: bi('Có thể điều chỉnh lại tỷ lệ đọc cần Read-Your-Writes sang Primary đồng thời tăng năng lực Replica.', 'Can route Read-Your-Writes traffic to Primary while scaling Replica capacity.'),
    },
    {
      id: 'db-primary',
      col: 3,
      row: -0.65,
      shape: 'db',
      tone: 'orange',
      label: bi('Primary SQL', 'Primary SQL'),
      what: bi('Node SQL chính nhận toàn bộ lượt ghi (μ = 2.600 req/s).', 'Primary SQL leader handling all writes (μ = 2,600 req/s).'),
      how: bi('Xử lý 800 ghi/s + 240 đọc/s = 1.040 req/s (ρ ≈ 0,40), vẫn còn dư địa nhận thêm lượt đọc quan trọng.', 'Serves 800 writes/s + 240 reads/s = 1,040 req/s (ρ ≈ 0.40), leaving headroom for critical reads.'),
      why: bi('Không nên đẩy toàn bộ 100% đọc về Primary vì sẽ làm Primary quá tải (> 3.200 > 2.600 req/s).', 'Sending 100% of reads to Primary would overload it (3,200 > 2,600 req/s).'),
    },
    {
      id: 'db-replica',
      col: 3,
      row: 0.65,
      shape: 'db',
      tone: 'yellow',
      label: bi('Read Replica', 'Read Replica'),
      what: bi('Node bản sao đọc (μ = 1.900 req/s, `applyRps = 950`).', 'Follower Read Replica (μ = 1,900 req/s, `applyRps = 950`).'),
      how: bi('Khi nhận 2.160 đọc/s (ρ > 1,1), Replica quá tải đọc làm năng lực áp WAL thực tế giảm một nửa còn ~475 ghi/s < 800 ghi/s → Replication Lag tích lũy vượt 6.000 ms!', 'Under 2,160 reads/s (ρ > 1.1), read contention halves effective WAL apply capacity to ~475 writes/s < 800 writes/s → Replication Lag exceeds 6,000 ms!'),
      why: bi('Nâng cấp năng lực Replica + `applyRps` và cân bằng lại trọng số đọc giúp triệt tiêu lag.', 'Scaling Replica + `applyRps` and rebalancing read weight eliminates lag.'),
    },
  ],
  [
    {
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      what: bi('Lưu lượng đợt sale từ người dùng.', 'Flash-sale user requests.'),
      how: bi('Tăng vọt lên 3.200 req/s trong 45 giây.', 'Spikes to 3,200 req/s for 45 seconds.'),
      why: bi('Kiểm chứng khả năng chịu tải ghi + đọc đồng thời.', 'Tests concurrent read/write spike handling.'),
    },
    {
      id: 'lb-api',
      from: 'lb',
      to: 'profile-api',
      what: bi('Chuyển tiếp sang tầng API.', 'Forwards to API tier.'),
      how: bi('Chia đều 4 instance.', 'Balanced across 4 instances.'),
      why: bi('Tầng định tuyến đọc/ghi.', 'Read/write split router.'),
    },
    {
      id: 'api-primary',
      from: 'profile-api',
      to: 'db-primary',
      what: bi('Nhánh ghi + đọc nhất quán mạnh vào Primary SQL (`weight = 1`).', 'Writes + strong-consistency reads to Primary SQL (`weight = 1`).'),
      how: bi('Luôn đọc bản dữ liệu mới nhất (lag = 0 ms).', 'Always reads freshest committed state (0 ms lag).'),
      why: bi('Dùng cho truy vấn Read-Your-Writes ngay sau khi người dùng vừa cập nhật.', 'Used for Read-Your-Writes queries right after mutations.'),
    },
    {
      id: 'api-replica',
      from: 'profile-api',
      to: 'db-replica',
      what: bi('Nhánh đọc sang Read Replica (`weight = 9` → 90% lượt đọc).', 'Read traffic to Read Replica (`weight = 9` → 90% of reads).'),
      how: bi('Đang dồn quá nhiều lượt đọc vào 1 Replica cỡ nhỏ.', 'Currently funnels too many reads onto an undersized Replica.'),
      why: bi('Giảm `weight` hợp lý giúp chia bớt tải đọc và bảo vệ băng thông áp WAL.', 'Rebalancing `weight` shares read load and preserves WAL apply headroom.'),
    },
    {
      id: 'primary-repl',
      from: 'db-primary',
      to: 'db-replica',
      style: 'heartbeat',
      what: bi('Luồng sao chép bất đồng bộ (WAL stream) từ Primary sang Replica.', 'Asynchronous WAL replication stream from Primary to Replica.'),
      how: bi('Khi tốc độ ghi (800 w/s) vượt tốc độ áp dụng thực tế của Replica, độ trễ sao chép tăng tuyến tính theo thời gian.', 'Whenever write rate (800 w/s) exceeds Replica apply rate, replication lag grows linearly.'),
      why: bi('Theo dõi chỉ số `lagMs` trên Replica để phát hiện sớm nguy cơ Stale Read.', 'Monitor `lagMs` on Replica to catch Stale Read risks early.'),
    },
  ]
);

/* ============================================================================
 * WR-07: Lỗi lan truyền từ phụ thuộc phụ (Cascading Slow Dependency)
 * ============================================================================ */
const wr07Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('lb', { id: 'lb', label: bi('Load Balancer', 'Load Balancer'), opsPerSec: 25_000, zone: 'az-a' }),
  makeNode('service', {
    id: 'home-api',
    label: bi('Storefront API', 'Storefront API'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 8,
    zone: 'az-a',
    params: { replicas: 4, poolSize: 80 },
  }),
  makeNode('sql', {
    id: 'catalog-db',
    label: bi('Product DB', 'Product DB'),
    opsPerSec: 3_200,
    baseMs: 7,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 100 },
  }),
  makeNode('search', {
    id: 'reco-svc',
    label: bi('Reco Engine', 'Reco Engine'),
    replicas: 2,
    opsPerSec: 1_400,
    baseMs: 15,
    zone: 'az-a',
    params: { replicas: 2 },
  }),
];

const wr07Links: LinkSpec[] = [
  { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 1200 },
  { id: 'lb-home', from: 'lb', to: 'home-api', mode: 'sync', timeoutMs: 1100 },
  { id: 'home-catalog', from: 'home-api', to: 'catalog-db', mode: 'sync', timeoutMs: 400, fallback: 'error' },
  {
    id: 'home-reco',
    from: 'home-api',
    to: 'reco-svc',
    mode: 'sync',
    timeoutMs: 3000,
    fallback: 'error',
    retry: { max: 1, backoff: 'fixed', baseMs: 30, jitter: 'equal' },
  },
];

const wr07Scenario: SimScenario = {
  id: 'WR-07/cascading-slow-dep',
  model: {
    nodes: wr07Nodes,
    links: wr07Links,
    routes: { 'home-api': 'all-parallel' },
  },
  durationSec: 70,
  load: { kind: 'steady', rps: 2000 },
  events: [{ at: 10, type: 'slowdown', node: 'reco-svc', addMs: 900 }],
  seed: 7107,
  mix: { readRatio: 0.95 },
  clientTimeoutMs: 1200,
};

const wr07Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('2.000 req/s mở trang chủ cửa hàng (clientTimeoutMs = 1.200 ms).', '2,000 req/s loading storefront home page (clientTimeoutMs = 1,200 ms).'),
      how: bi('Mong đợi danh sách sản phẩm hiển thị nhanh dưới 160 ms.', 'Expects core product listing under 160 ms.'),
      why: bi('Khách hàng vẫn mua hàng bình thường nếu hộp gợi ý cá nhân hóa tạm ẩn hoặc trả danh sách phổ biến.', 'Users can still browse and buy if personalized recommendations fall back to popular items.'),
    },
    {
      id: 'lb',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Load Balancer', 'Load Balancer'),
      what: bi('Bộ cân bằng tải vào 4 instance Storefront API.', 'Load Balancer fronting 4 Storefront API instances.'),
      how: bi('Phân phối đều lưu lượng.', 'Even Round-robin distribution.'),
      why: bi('Tầng định tuyến không giữ trạng thái.', 'Stateless L7 proxy.'),
    },
    {
      id: 'home-api',
      col: 2,
      row: 0,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Storefront API', 'Storefront API'),
      what: bi('API tổng hợp gọi song song Product DB (cốt lõi) và Reco Engine (phụ trợ).', 'Aggregator API calling Product DB (core) and Reco Engine (secondary) in parallel.'),
      how: bi('Đang để `timeoutMs = 3000` và `fallback = error` trên link `home-reco`, nên phải chờ nhánh chậm nhất.', 'Configured with `timeoutMs = 3000` and `fallback = error` on `home-reco`, blocking on the slowest branch.'),
      why: bi('Mọi phụ thuộc không thiết yếu bắt buộc phải có Timeout ngắn, Circuit Breaker và Graceful Degradation.', 'Non-critical dependencies require tight Timeouts, Circuit Breakers, and Graceful Degradation.'),
    },
    {
      id: 'catalog-db',
      col: 3,
      row: -0.65,
      shape: 'db',
      tone: 'orange',
      label: bi('Product DB', 'Product DB'),
      what: bi('Cơ sở dữ liệu sản phẩm cốt lõi (μ = 3.200 req/s, ~7 ms).', 'Core Product SQL DB (μ = 3,200 req/s, ~7 ms).'),
      how: bi('Phản hồi nhanh và ổn định suốt sự cố (ρ ≈ 0,62).', 'Responds quickly and reliably throughout the incident (ρ ≈ 0.62).'),
      why: bi('Dữ liệu chính hoàn toàn sẵn sàng nhưng bị nhánh phụ kéo chậm.', 'Core data is completely healthy yet held hostage by the slow secondary call.'),
    },
    {
      id: 'reco-svc',
      col: 3,
      row: 0.65,
      shape: 'block',
      tone: 'rose',
      icon: 'sparkles',
      label: bi('Reco Engine', 'Reco Engine'),
      what: bi('Dịch vụ gợi ý sản phẩm phụ trợ bằng mô hình ML.', 'Secondary ML recommendation service.'),
      how: bi('Lúc t = 10s, nạp lại mô hình nặng làm độ trễ tăng thêm +900 ms (tổng > 915 ms, đuôi vượt 1.200 ms).', 'At t = 10s, heavy model reload adds +900 ms latency (tail exceeds 1,200 ms client timeout).'),
      why: bi('Không được phép để lỗi của tiện ích gợi ý làm hỏng toàn bộ trang chủ.', 'A recommendation widget slowdown must never take down the storefront.'),
    },
  ],
  [
    {
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      what: bi('Truy cập trang chủ từ người dùng.', 'User storefront requests.'),
      how: bi('Client cắt kết nối ở 1.200 ms.', 'Client times out at 1,200 ms.'),
      why: bi('Khi p99 chạm 1.200 ms, người dùng nhận trang lỗi.', 'Once latency exceeds 1,200 ms, users see hard errors.'),
    },
    {
      id: 'lb-home',
      from: 'lb',
      to: 'home-api',
      what: bi('Đường nối nội bộ sang Storefront API.', 'Internal hop to Storefront API.'),
      how: bi('2.000 req/s.', '2,000 req/s.'),
      why: bi('Cổng vào dịch vụ tổng hợp.', 'Aggregator entry link.'),
    },
    {
      id: 'home-catalog',
      from: 'home-api',
      to: 'catalog-db',
      what: bi('Truy vấn dữ liệu sản phẩm bắt buộc.', 'Mandatory core product query.'),
      how: bi('Hoàn tất trong ~8 ms.', 'Completes in ~8 ms.'),
      why: bi('Nhánh bắt buộc của trang.', 'Critical path dependency.'),
    },
    {
      id: 'home-reco',
      from: 'home-api',
      to: 'reco-svc',
      what: bi('Lời gọi đồng bộ sang Reco Engine (`timeoutMs = 3000`, `fallback = error`).', 'Synchronous call to Reco Engine (`timeoutMs = 3000`, `fallback = error`).'),
      how: bi('Chỉ giảm timeout mà quên bật `fallback: degrade` sẽ biến request chậm thành lỗi 500 ngay lập tức!', 'Lowering timeout without `fallback: degrade` turns slow requests into immediate 500 errors!'),
      why: bi('Cần kết hợp `timeoutMs: 120` + `fallback: degrade` + `breaker` để vừa ngắt nhanh vừa trả trang thành công.', 'Combine `timeoutMs: 120` + `fallback: degrade` + `breaker` to fail fast and degrade gracefully.'),
    },
  ]
);

/* ============================================================================
 * WR-08: Timeout không huỷ việc (cancelOnTimeout = false / Công việc Zombie)
 * ============================================================================ */
const wr08Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('gateway', {
    id: 'gw',
    label: bi('API Gateway', 'API Gateway'),
    replicas: 3,
    opsPerSec: 4_000,
    baseMs: 3,
    zone: 'az-a',
  }),
  makeNode('service', {
    id: 'core-api',
    label: bi('Core Checkout', 'Core Checkout'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 10,
    zone: 'az-a',
    params: { replicas: 4 },
  }),
  makeNode('service', {
    id: 'app',
    label: bi('Search Filter App', 'Search Filter App'),
    replicas: 2,
    opsPerSec: 1_200,
    baseMs: 30,
    capacity: { opsPerSec: 1_200, concurrency: 260 },
    zone: 'az-a',
    params: { replicas: 2 },
  }),
  makeNode('sql', {
    id: 'db',
    label: bi('Shared SQL DB', 'Shared SQL DB'),
    opsPerSec: 2_600,
    baseMs: 6,
    zone: 'az-a',
    params: { sizeFactor: 1, poolSize: 90, maxConnections: 400 },
  }),
];

const wr08Links: LinkSpec[] = [
  { id: 'client-gw', from: 'client', to: 'gw', mode: 'sync', netClass: 'internet', timeoutMs: 900 },
  { id: 'gw-core', from: 'gw', to: 'core-api', mode: 'sync', timeoutMs: 600 },
  {
    id: 'gw-app',
    from: 'gw',
    to: 'app',
    mode: 'sync',
    fraction: 0.35,
    timeoutMs: 150,
    cancelOnTimeout: false,
    fallback: 'degrade',
    retry: {
      max: 2,
      backoff: 'fixed',
      baseMs: 20,
      jitter: 'none',
    },
  },
  { id: 'core-db', from: 'core-api', to: 'db', mode: 'sync', calls: 1, timeoutMs: 500 },
  { id: 'app-db', from: 'app', to: 'db', mode: 'sync', calls: 3, timeoutMs: 700 },
];

const wr08Scenario: SimScenario = {
  id: 'WR-08/zombie-work',
  model: {
    nodes: wr08Nodes,
    links: wr08Links,
    routes: { gw: 'all-parallel' },
  },
  durationSec: 70,
  load: { kind: 'ramp', from: 1000, to: 1550, overSec: 24 },
  events: [{ at: 8, type: 'slowdown', node: 'app', addMs: 420 }],
  seed: 7108,
  mix: { readRatio: 0.85 },
  clientTimeoutMs: 900,
};

const wr08Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('1.100 req/s thực hiện tìm kiếm và thanh toán trên cùng nền tảng.', '1,100 req/s browsing and checking out.'),
      how: bi('Gọi vào API Gateway với kỳ vọng p99 ≤ 200 ms.', 'Calls API Gateway expecting p99 ≤ 200 ms.'),
      why: bi('Dù nhánh Search đã cấu hình `fallback: degrade`, người dùng vẫn gặp lỗi thanh toán dây chuyền.', 'Even though Search has `fallback: degrade`, users still experience checkout failures.'),
    },
    {
      id: 'gw',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'purple',
      icon: 'shield',
      label: bi('API Gateway', 'API Gateway'),
      what: bi('Gọi song song Core Checkout và Search Filter App.', 'Calls Core Checkout and Search Filter App in parallel.'),
      how: bi('Trên link `gw-app` đã đặt `timeoutMs = 150` và `fallback: degrade`, nhưng `cancelOnTimeout = false` và còn bật retry 2 lần.', 'Link `gw-app` sets `timeoutMs = 150` and `fallback: degrade`, yet leaves `cancelOnTimeout = false` with 2 retries.'),
      why: bi('Ngắt chờ ở phía người gọi (caller timeout) không tự động dừng tiến trình ở phía người được gọi (callee) nếu thiếu tín hiệu hủy ngữ cảnh!', 'Caller timeout alone does not stop callee execution without context/deadline propagation!'),
    },
    {
      id: 'core-api',
      col: 2,
      row: -0.65,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Core Checkout', 'Core Checkout'),
      what: bi('Dịch vụ thanh toán cốt lõi (4 instance, ~10 ms).', 'Core checkout service (4 instances, ~10 ms).'),
      how: bi('Gửi 1.100 truy vấn/giây hợp lệ xuống Shared SQL DB.', 'Sends 1,100 legitimate queries/sec to Shared SQL DB.'),
      why: bi('Bị vạ lây hoàn toàn khi Shared SQL DB bị ngập bởi truy vấn Zombie từ Search Filter App.', 'Suffers collateral damage when Shared SQL DB is flooded by zombie queries from Search Filter App.'),
    },
    {
      id: 'app',
      col: 2,
      row: 0.65,
      shape: 'block',
      tone: 'yellow',
      icon: 'filter',
      label: bi('Search Filter App', 'Search Filter App'),
      what: bi('Dịch vụ lọc nâng cao (2 instance, mỗi request gọi 2 câu SQL).', 'Search filter service (2 instances, 2 SQL queries per request).'),
      how: bi('Lúc t = 8s, biểu thức regex nặng làm thời gian xử lý tăng từ 30 ms lên 450 ms (> 150 ms timeout). Do `cancelOnTimeout = false` kèm retry, node vẫn chạy trọn 450 ms và đổ ~4.800 truy vấn/s đã bị bỏ rơi xuống DB!', 'At t = 8s, heavy regex processing slows latency from 30 ms to 450 ms (> 150 ms timeout). With `cancelOnTimeout = false` + retries, it finishes abandoned requests and dumps ~4,800 zombie queries/s onto the DB!'),
      why: bi('Khi bật `cancelOnTimeout = true` (truyền `AbortSignal` / gRPC deadline), request bị hủy ngay ở mốc 150 ms trước khi phát sinh truy vấn thừa xuống DB.', 'Enabling `cancelOnTimeout = true` (propagating `AbortSignal` / gRPC deadline) aborts execution at 150 ms before flooding the DB.'),
    },
    {
      id: 'db',
      col: 3,
      row: 0,
      shape: 'db',
      tone: 'orange',
      label: bi('Shared SQL DB', 'Shared SQL DB'),
      what: bi('Cơ sở dữ liệu dùng chung (μ = 2.500 req/s).', 'Shared primary SQL database (μ = 2,500 req/s).'),
      how: bi('Đủ sức phục vụ 1.100 req/s của Core Checkout (ρ = 0,44), nhưng bị đẩy lên ~5.900 req/s (ρ > 2,3) bởi công việc Zombie.', 'Easily handles Core Checkout’s 1,100 req/s (ρ = 0.44), but gets pushed to ~5,900 req/s (ρ > 2.3) by zombie queries.'),
      why: bi('Hủy công việc Zombie trả lại ngay lập tức hơn 75% năng lực DB mà không tốn thêm phần cứng DB.', 'Canceling zombie work immediately reclaims > 75% of DB capacity without buying larger DB hardware.'),
    },
  ],
  [
    {
      id: 'client-gw',
      from: 'client',
      to: 'gw',
      what: bi('Lưu lượng người dùng tới API Gateway.', 'User requests to API Gateway.'),
      how: bi('1.100 req/s.', '1,100 req/s.'),
      why: bi('Đo SLO chung của toàn hệ thống.', 'End-to-end SLO boundary.'),
    },
    {
      id: 'gw-core',
      from: 'gw',
      to: 'core-api',
      what: bi('Nhánh gọi Core Checkout bắt buộc.', 'Mandatory Core Checkout branch.'),
      how: bi('Timeout 600 ms.', '600 ms timeout.'),
      why: bi('Bị lỗi khi `core-db` nghẽn.', 'Fails whenever `core-db` stalls.'),
    },
    {
      id: 'gw-app',
      from: 'gw',
      to: 'app',
      what: bi('Nhánh gọi Search Filter App (`timeoutMs = 150`, `cancelOnTimeout = false`).', 'Search Filter branch (`timeoutMs = 150`, `cancelOnTimeout = false`).'),
      how: bi('Đang thiếu truyền tín hiệu hủy (context cancellation) và còn retry khi timeout.', 'Missing context cancellation propagation and retrying on timeouts.'),
      why: bi('Bật `cancelOnTimeout: true` và tắt retry mù trên nhánh này để dập tắt công việc Zombie.', 'Enable `cancelOnTimeout: true` and remove blind retries to eliminate zombie work.'),
    },
    {
      id: 'core-db',
      from: 'core-api',
      to: 'db',
      what: bi('Truy vấn thanh toán hợp lệ vào Shared SQL DB.', 'Legitimate checkout queries to Shared SQL DB.'),
      how: bi('1.100 req/s.', '1,100 req/s.'),
      why: bi('Cần được bảo vệ khỏi nhiễu từ dịch vụ phụ.', 'Must be protected from noisy-neighbor queries.'),
    },
    {
      id: 'app-db',
      from: 'app',
      to: 'db',
      what: bi('Luồng truy vấn Zombie từ Search Filter App xuống DB (`calls = 2`).', 'Zombie query stream from Search Filter App to DB (`calls = 2`).'),
      how: bi('Khi `cancelOnTimeout = true` cắt sớm request quá hạn, lưu lượng thừa trên link này giảm về 0.', 'Once `cancelOnTimeout = true` aborts expired requests, wasted load on this link drops to zero.'),
      why: bi('Minh họa rõ tác hại của công việc không còn người nhận kết quả.', 'Demonstrates how abandoned work saturates shared downstream storage.'),
    },
  ]
);

/* ============================================================================
 * WR-09: Bẫy DNS TTL dài chặn Failover vùng
 * ============================================================================ */
const wr09Nodes: NodeSpec[] = [
  makeNode('client', { id: 'client', label: bi('Người dùng', 'Users'), zone: 'internet' }),
  makeNode('dns', {
    id: 'dns',
    label: bi('Authoritative DNS', 'Authoritative DNS'),
    opsPerSec: 100_000,
    baseMs: 0.3,
    zone: 'internet',
    params: { ttlSec: 600, algorithm: 'weighted' },
    knobs: [
      numKnob('ttlSec', 'TTL bản ghi DNS', 'DNS record TTL', 600, 5, 600, 5, 's'),
    ],
  }),
  makeNode('gateway', {
    id: 'gw-primary',
    label: bi('Primary Region GW', 'Primary Region GW'),
    replicas: 3,
    opsPerSec: 2_200,
    baseMs: 4,
    zone: 'az-a',
  }),
  makeNode('lb', {
    id: 'lb-standby',
    label: bi('Standby Region LB', 'Standby Region LB'),
    opsPerSec: 20_000,
    baseMs: 0.5,
    zone: 'az-b',
    params: { algorithm: 'round-robin', healthCheckSec: 45 },
    knobs: [
      numKnob('healthCheckSec', 'Chu kỳ Health Check LB', 'LB Health Check interval', 45, 2, 60, 1, 's'),
    ],
  }),
  makeNode('service', {
    id: 'app-b-dead',
    label: bi('Standby App A', 'Standby App A'),
    replicas: 1,
    opsPerSec: 1_800,
    baseMs: 10,
    zone: 'az-b',
  }),
  makeNode('service', {
    id: 'app-b-live',
    label: bi('Standby App Pool', 'Standby App Pool'),
    replicas: 4,
    opsPerSec: 1_800,
    baseMs: 10,
    zone: 'az-b',
    params: { replicas: 4 },
  }),
];

const wr09Links: LinkSpec[] = [
  { id: 'client-dns', from: 'client', to: 'dns', mode: 'sync', netClass: 'internet', timeoutMs: 1000 },
  { id: 'dns-primary', from: 'dns', to: 'gw-primary', mode: 'sync', weight: 9, timeoutMs: 900 },
  { id: 'dns-standby', from: 'dns', to: 'lb-standby', mode: 'sync', weight: 1, timeoutMs: 900 },
  { id: 'primary-live', from: 'gw-primary', to: 'app-b-live', mode: 'sync', netClass: 'cross-az', timeoutMs: 800 },
  { id: 'standby-dead', from: 'lb-standby', to: 'app-b-dead', mode: 'sync', timeoutMs: 800 },
  { id: 'standby-live', from: 'lb-standby', to: 'app-b-live', mode: 'sync', timeoutMs: 800 },
];

const wr09Scenario: SimScenario = {
  id: 'WR-09/dns-ttl-failover',
  model: { nodes: wr09Nodes, links: wr09Links },
  durationSec: 80,
  load: { kind: 'steady', rps: 3000 },
  events: [
    { at: 8, type: 'crash', node: 'gw-primary' },
    { at: 8, type: 'crash', node: 'app-b-dead' },
  ],
  seed: 7109,
  mix: { readRatio: 0.9 },
  clientTimeoutMs: 1000,
};

const wr09Scene = buildIsoScene(
  [
    {
      id: 'client',
      col: 0,
      row: 0,
      shape: 'crowd',
      tone: 'blue',
      label: bi('Người dùng', 'Users'),
      what: bi('3.000 req/s truy cập dịch vụ đa vùng với mục tiêu RTO khôi phục sau sự cố vùng ≤ 8 giây.', '3,000 req/s multi-region traffic with regional failover RTO target ≤ 8 seconds.'),
      how: bi('Resolver của ISP/trình duyệt lưu đệm địa chỉ IP theo `dns.ttlSec`.', 'ISP and OS resolvers cache regional gateway IPs for `dns.ttlSec`.'),
      why: bi('Dù cụm dự phòng đã sẵn sàng, client vẫn gửi 90% request vào IP vùng chết cho tới khi hết TTL.', 'Even when standby capacity is ready, clients keep sending 90% of requests to the dead VIP until DNS TTL expires.'),
    },
    {
      id: 'dns',
      col: 1,
      row: 0,
      shape: 'block',
      tone: 'blue',
      icon: 'globe',
      label: bi('Authoritative DNS', 'Authoritative DNS'),
      what: bi('DNS điều hướng lưu lượng giữa vùng Primary (`weight = 9`) và vùng Standby (`weight = 1`), đang đặt `ttlSec = 600`.', 'Geo/Weighted DNS routing between Primary (`weight = 9`) and Standby (`weight = 1`) with `ttlSec = 600`.'),
      how: bi('TTL 600 giây (10 phút) giữ chặt lưu lượng vào vùng Primary đã sập suốt cả cửa sổ 80 giây!', 'A 600-second (10-minute) TTL pins 90% of traffic onto the dead Primary region for the entire 80s window!'),
      why: bi('Các bản ghi DNS phục vụ failover tự động cần TTL ngắn (5–10 giây) kết hợp Health Check chủ động.', 'Automated DNS failover records require short TTLs (5–10s) backed by fast health checks.'),
    },
    {
      id: 'gw-primary',
      col: 2,
      row: -0.7,
      shape: 'block',
      tone: 'rose',
      icon: 'alert',
      label: bi('Primary Region GW', 'Primary Region GW'),
      what: bi('Cổng vào vùng chính (`az-a`), nhận 90% lưu lượng ban đầu.', 'Primary regional gateway (`az-a`), serving 90% of initial traffic.'),
      how: bi('Gặp sự cố mất kết nối toàn vùng lúc t = 8s (`crash`).', 'Suffers complete regional outage at t = 8s (`crash`).'),
      why: bi('Mọi request gửi tiếp vào đây đều thất bại ngay lập tức.', 'Every request still routed here fails immediately.'),
    },
    {
      id: 'lb-standby',
      col: 2,
      row: 0.7,
      shape: 'block',
      tone: 'purple',
      icon: 'layers',
      label: bi('Standby Region LB', 'Standby Region LB'),
      what: bi('Load Balancer vùng dự phòng (`az-b`), nhưng đang để `healthCheckSec = 45` giây.', 'Standby regional Load Balancer (`az-b`) configured with slow `healthCheckSec = 45`s.'),
      how: bi('Khi DNS chuyển toàn bộ 3.000 req/s sang vùng dự phòng, LB chậm phát hiện 1 node lỗi (`Standby App A`) nên vẫn chia 50% request vào node chết suốt 45 giây!', 'Once DNS shifts traffic to Standby, slow 45s LB health checks keep sending 50% of traffic to dead `Standby App A` for 45 seconds!'),
      why: bi('Failover đầu-cuối chỉ đạt RTO vài giây khi CẢ DNS TTL lẫn LB Health Check đều ngắn (3–5 giây).', 'Fast end-to-end RTO requires BOTH short DNS TTL (5s) AND fast LB health checks (3s).'),
    },
    {
      id: 'app-b-dead',
      col: 3,
      row: 0.95,
      shape: 'block',
      tone: 'neutral',
      icon: 'box',
      label: bi('Standby App A', 'Standby App A'),
      what: bi('1 instance lẻ ở vùng dự phòng bị treo cùng thời điểm t = 8s.', '1 stale standby instance that crashed at t = 8s.'),
      how: bi('Chỉ bị loại khỏi danh sách chia tải sau `healthCheckSec` của `lb-standby`.', 'Removed from rotation only after `lb-standby` completes `healthCheckSec`.'),
      why: bi('Kiểm chứng cấu hình Health Check thực tế trên vùng dự phòng.', 'Exposes unverified slow health-check intervals in standby regions.'),
    },
    {
      id: 'app-b-live',
      col: 3,
      row: -0.25,
      shape: 'block',
      tone: 'green',
      icon: 'cpu',
      label: bi('Standby App Pool', 'Standby App Pool'),
      what: bi('Cụm 4 instance khỏe mạnh tại vùng dự phòng (tổng μ = 7.200 req/s).', '4 healthy standby instances (7,200 req/s combined capacity).'),
      how: bi('Đủ năng lực gánh trọn 100% tải 3.000 req/s (ρ ≈ 0,42) ngay khi DNS và LB hội tụ.', 'Easily absorbs all 3,000 req/s (ρ ≈ 0.42) as soon as DNS and LB converge.'),
      why: bi('Chứng minh tài nguyên dự phòng không thiếu — điểm chặn nằm ở thời gian hội tụ định tuyến.', 'Proves standby compute is ample — the outage is caused purely by routing convergence timers.'),
    },
  ],
  [
    {
      id: 'client-dns',
      from: 'client',
      to: 'dns',
      what: bi('Phân giải tên miền và định tuyến vùng.', 'DNS resolution and regional steering.'),
      how: bi('3.000 req/s.', '3,000 req/s.'),
      why: bi('Tầng điều hướng đầu tiên trước khi vào hạ tầng vùng.', 'First routing layer before regional entrypoints.'),
    },
    {
      id: 'dns-primary',
      from: 'dns',
      to: 'gw-primary',
      what: bi('Lưu lượng hướng về vùng chính (`weight = 9`).', 'Traffic steered to Primary region (`weight = 9`).'),
      how: bi('Chỉ ngắt sau `dns.ttlSec` kể từ lúc `gw-primary` sập.', 'Drains only after `dns.ttlSec` elapses following `gw-primary` crash.'),
      why: bi('Giảm `dns.ttlSec` từ 600s xuống 5s để rút thời gian chuyển vùng xuống dưới 6 giây.', 'Lowering `dns.ttlSec` from 600s to 5s cuts regional cutover time under 6 seconds.'),
    },
    {
      id: 'dns-standby',
      from: 'dns',
      to: 'lb-standby',
      what: bi('Lưu lượng chuyển vùng sang Standby Region LB.', 'Failover traffic routed to Standby Region LB.'),
      how: bi('Nhận 100% tải sau khi bản ghi vùng chính hết hạn TTL.', 'Receives 100% of traffic once Primary DNS TTL expires.'),
      why: bi('Đường sống duy nhất khi `az-a` mất kết nối.', 'Active failover path during `az-a` outage.'),
    },
    {
      id: 'primary-live',
      from: 'gw-primary',
      to: 'app-b-live',
      what: bi('Đường trục từ cổng vùng chính vào cụm ứng dụng.', 'Backbone link from Primary GW to application pool.'),
      how: bi('Ngừng hoạt động khi `gw-primary` sập.', 'Inactive once `gw-primary` crashes.'),
      why: bi('Cho thấy lỗi nằm ở tầng cổng vùng chứ không phải tầng ứng dụng.', 'Shows failure is at regional ingress.'),
    },
    {
      id: 'standby-dead',
      from: 'lb-standby',
      to: 'app-b-dead',
      what: bi('Đường nối từ Standby LB vào instance lỗi `Standby App A`.', 'Standby LB link to crashed `Standby App A`.'),
      how: bi('Tiếp tục nhận 50% lưu lượng failover nếu `healthCheckSec = 45s` chưa kịp loại bỏ.', 'Keeps receiving 50% of failover traffic until `healthCheckSec` evicts the dead node.'),
      why: bi('Giảm `healthCheckSec` xuống 3s giúp loại bỏ node lỗi trước khi DNS chuyển vùng xong.', 'Setting `healthCheckSec = 3s` evicts the dead backend before DNS cutover completes.'),
    },
    {
      id: 'standby-live',
      from: 'lb-standby',
      to: 'app-b-live',
      what: bi('Đường nối vào cụm 4 instance khỏe mạnh tại vùng dự phòng.', 'Link to the 4 healthy standby instances.'),
      how: bi('Phục vụ 3.000 req/s êm ái với p99 < 40 ms khi nhận trọn lưu lượng.', 'Serves all 3,000 req/s at p99 < 40 ms once converged.'),
      why: bi('Đảm bảo tính sẵn sàng liên tục sau failover.', 'Sustains availability post-failover.'),
    },
  ],
  [
    { id: 'zone-a', nodeIds: ['gw-primary'], label: bi('VÙNG CHÍNH (AZ-A)', 'PRIMARY (AZ-A)'), tone: 'rose' },
    { id: 'zone-b', nodeIds: ['lb-standby', 'app-b-dead', 'app-b-live'], label: bi('VÙNG DỰ PHÒNG (AZ-B)', 'STANDBY (AZ-B)'), tone: 'green' },
  ]
);

/* ============================================================================
 * DANH SÁCH ĐẦY ĐỦ 9 SỰ CỐ WAR-ROOM
 * ============================================================================ */
export const WAR_ROOM_INCIDENTS: readonly WarRoomIncident[] = [
  /* ─────────────── 1. WR-01 ─────────────── */
  {
    id: 'WR-01',
    order: 1,
    severity: 'SEV-1',
    title: bi(
      'Cache Stampede sau khi hết hạn đồng loạt',
      'Cache Stampede After Synchronized TTL Expiry'
    ),
    summary: bi(
      'Lô 14.000 key danh mục được nạp cùng lúc hết hạn đồng loạt ở t = 12s dưới tải 4.200 req/s làm Catalog DB quá tải.',
      '14,000 batch-warmed catalog keys expire simultaneously at t = 12s under 4,200 req/s, overloading Catalog DB.'
    ),
    relatedModules: ['S2-02', 'S4-02'],
    alertAtSec: 12,
    peakAtSec: 18,
    scenario: wr01Scenario,
    scene: wr01Scene,
    liveSpec: makeLiveSpec('WR-01/stampede', 120, 0.01, [
      { node: 'cache', key: 'singleflight' },
      { node: 'cache', key: 'ttlJitterPct' },
      { node: 'app', key: 'replicas' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Catalog API: Tỉ lệ lỗi 5xx vượt 45%, độ trễ p99 > 600 ms ngay sau mốc 00:12.',
        '[PAGER SEV-1] Catalog API: 5xx error rate > 45%, p99 > 600 ms starting abruptly at 00:12.'
      ),
      customerImpact: bi(
        'Người dùng mở trang danh mục sản phẩm bị trắng trang hoặc chờ quá hạn đồng loạt.',
        'Shoppers browsing product categories hit blank pages and request timeouts.'
      ),
      telemetryClues: [
        bi('Lưu lượng đầu vào giữ nguyên 4.200 req/s (không có đột biến từ phía người dùng).', 'External traffic is steady at 4,200 req/s (no user traffic spike).'),
        bi('Hit Ratio của Redis Cache rơi thẳng từ ~92% về 0% tại t = 12s (nhãn COLD).', 'Redis Cache hit ratio drops vertically from ~92% to 0% at t = 12s (COLD badge).'),
        bi('Lưu lượng vào Catalog DB tăng vọt gấp ~8 lần (từ ~530 lên ~4.200 req/s), ρ > 3,3.', 'Catalog DB arrival rate jumps ~8× (~530 → ~4,200 req/s), ρ > 3.3.'),
      ],
    },
    slos: [
      { id: 'wr01-p99', kind: 'slo-latency', metric: 'p99', maxMs: 120, window: { fromSec: 0, toSec: 70 }, allowViolationPct: 3 },
      { id: 'wr01-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 70 } },
      { id: 'wr01-db', kind: 'node-state', node: 'db', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
      { id: 'wr01-jitter', kind: 'structural', rule: 'cache-has-jitter', node: 'cache' },
    ],
    sloDescriptions: {
      'wr01-p99': bi('Độ trễ đầu-cuối p99 ≤ 120 ms suốt 70s', 'End-to-end p99 ≤ 120 ms across 70s'),
      'wr01-err': bi('Tỉ lệ lỗi tích lũy ≤ 1,0%', 'Aggregate error rate ≤ 1.0%'),
      'wr01-db': bi('Catalog DB không rơi vào trạng thái overloaded', 'Catalog DB never stays overloaded'),
      'wr01-jitter': bi('Redis Cache có cấu hình TTL Jitter (≥ 10%)', 'Redis Cache configured with TTL jitter (≥ 10%)'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr01-singleflight',
        label: bi('Bật Singleflight (Request Coalescing) trên Redis Cache', 'Enable Singleflight (Request Coalescing) on Redis Cache'),
        description: bi(
          'Gộp các request cùng đọc một key đang miss thành 1 truy vấn duy nhất xuống Catalog DB trong lúc làm ấm lại cache.',
          'Coalesces concurrent misses for the same key into a single origin DB query while repopulating cache.'
        ),
        targetBadge: 'cache.singleflight = true',
        cost: 1,
        changes: [{ type: 'knob', node: 'cache', key: 'singleflight', value: true }],
      },
      {
        id: 'wr01-jitter',
        label: bi('Thêm nhiễu ngẫu nhiên TTL Jitter 25% cho các key cache', 'Add 25% random TTL Jitter across cached keys'),
        description: bi(
          'Trải đều thời điểm hết hạn của 14.000 key trên một dải thời gian thay vì hết hạn cùng một giây ở các chu kỳ kế tiếp.',
          'Spreads key expiration timestamps across a window instead of expiring in lockstep on future cycles.'
        ),
        targetBadge: 'cache.ttlJitterPct = 0.25',
        cost: 1,
        changes: [{ type: 'knob', node: 'cache', key: 'ttlJitterPct', value: 0.25 }],
      },
      {
        id: 'wr01-trap-app',
        label: bi('Tăng gấp đôi Catalog API từ 4 lên 8 instance', 'Double Catalog API from 4 to 8 instances'),
        description: bi(
          'Mở rộng ngang tầng ứng dụng stateless phía trước Redis Cache.',
          'Scale out the stateless API tier in front of Redis Cache.'
        ),
        targetBadge: 'app.replicas = 8',
        cost: 1,
        changes: [{ type: 'knob', node: 'app', key: 'replicas', value: 8 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng trọng tâm: Catalog API chỉ mới bận ~58% CPU. Thêm máy ứng dụng không ngăn được 4.000 lượt Cache Miss tràn xuống Catalog DB.',
          'Ineffective mitigation: Catalog API is at ~58% CPU. Adding stateless API nodes still forwards all 4,000 cache misses to Catalog DB.'
        ),
      },
      {
        id: 'wr01-trap-ttl',
        label: bi('Tăng cứng TTL từ 300s lên 3.600s (giữ nguyên Jitter = 0%)', 'Raise static TTL from 300s to 3,600s (keep Jitter = 0%)'),
        description: bi(
          'Kéo dài thời gian sống cố định của mọi key mà không dùng Singleflight hay Jitter.',
          'Extend fixed key lifetime without singleflight or jitter.'
        ),
        targetBadge: 'cache.ttlSec = 3600',
        cost: 1,
        changes: [{ type: 'knob', node: 'cache', key: 'ttlSec', value: 3600 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa giải quyết gốc rễ: Tăng TTL cố định chỉ dời thời điểm hết hạn đồng loạt sang giờ sau và không cản được cơn sóng miss khi cache vừa mất hiệu lực.',
          'Does not fix the root cause: a longer static TTL merely postpones synchronized expiration and leaves origin unprotected on cold flushes.'
        ),
      },
    ],
    solutionMitigationIds: ['wr01-singleflight', 'wr01-jitter'],
    postmortem: buildPostmortem({
      id: 'WR-01.PM',
      simId: 'WR-01/stampede',
      seekSec: 18,
      title: bi('Báo cáo Postmortem — WR-01: Cache Stampede', 'Postmortem Report — WR-01: Cache Stampede'),
      prompt: bi(
        'Tổng hợp nguyên nhân gốc rễ, yếu tố góp phần và hạng mục phòng ngừa dài hạn cho sự cố hết hạn cache đồng loạt.',
        'Identify the root cause, contributing factor, effective fix, and long-term preventive action for the synchronized cache expiry outage.'
      ),
      explain: bi(
        'Khi cron job nạp 14.000 key với cùng một TTL tĩnh (`ttlJitterPct = 0`), tất cả hết hạn cùng lúc làm Hit Ratio sụt về 0%. Bật `singleflight` khóa gộp các miss trùng key để bảo vệ DB tức thời, còn `ttlJitterPct = 0.25` phân tán lịch hết hạn cho các chu kỳ tiếp theo.',
        'Batch-warming 14,000 keys with identical static TTLs (`ttlJitterPct = 0`) caused simultaneous expiry. `singleflight` coalesces duplicate misses per key to protect the DB immediately, while `ttlJitterPct = 0.25` desynchronizes future expirations.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Nguyên nhân gốc rễ (Root Cause) trực tiếp gây quá tải Catalog DB lúc t = 12s là gì?', '1. What was the direct root cause of Catalog DB overload at t = 12s?'),
          options: [
            { id: 'a', text: bi('Lưu lượng người dùng bên ngoài tăng gấp 8 lần vượt dự tính.', 'External user traffic spiked 8× beyond forecast.') },
            { id: 'b', text: bi('Toàn bộ lô key nạp cùng lúc hết hạn đồng thời khi thiếu Singleflight, khiến hàng nghìn lượt miss trùng lặp dồn thẳng xuống DB.', 'Batch-populated keys expired simultaneously without Singleflight, sending thousands of duplicate misses directly to the DB.') },
            { id: 'c', text: bi('Tầng Catalog API thiếu CPU làm nghẽn kết nối tới Redis.', 'Catalog API ran out of CPU and stalled Redis connections.') },
          ],
          correct: ['b'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Yếu tố thiết kế nào góp phần tạo nên sự kiện hết hạn đồng bộ?', '2. Which design factor caused the synchronized expiration wave?'),
          options: [
            { id: 'a', text: bi('Tác vụ nạp trước (pre-warm) gán cùng một hằng số TTL cho mọi key mà không cộng nhiễu ngẫu nhiên (TTL Jitter = 0%).', 'The cache pre-warm job assigned an identical fixed TTL to every key with zero random jitter.') },
            { id: 'b', text: bi('Load Balancer dùng thuật toán Round-robin thay vì Least Connections.', 'The Load Balancer used Round-robin instead of Least Connections.') },
            { id: 'c', text: bi('Dung lượng RAM của Redis Cache nhỏ hơn kích thước tập key đang hoạt động.', 'Redis Cache capacity was smaller than the active working set.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Vì sao bật Singleflight giúp giảm ngay lập tức lưu lượng xuống DB trong giai đoạn cache còn lạnh?', '3. Why does Singleflight immediately cap DB load while the cache is cold?'),
          options: [
            { id: 'a', text: bi('Vì Singleflight bỏ qua hoàn toàn DB và trả dữ liệu rỗng cho người dùng.', 'Because Singleflight skips the DB entirely and returns empty responses.') },
            { id: 'b', text: bi('Vì với mỗi key đang miss, chỉ duy nhất 1 request đại diện truy vấn DB; các request đồng thời cùng key chờ dùng chung kết quả đó.', 'Because only one in-flight request per missing key queries the DB while concurrent callers share its result.') },
            { id: 'c', text: bi('Vì Singleflight tự động nhân đôi thông lượng IOPS phần cứng của SQL.', 'Because Singleflight doubles hardware SQL IOPS.') },
          ],
          correct: ['b'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Hạng mục phòng ngừa dài hạn (Action Item) nào hiệu quả nhất cho chuẩn thư viện Cache nội bộ?', '4. Which long-term engineering guardrail best prevents recurrence across services?'),
          options: [
            { id: 'a', text: bi('Mặc định bật TTL Jitter (±15–25%) + Singleflight/Probabilistic Early Expiration trong SDK Cache dùng chung và thêm kiểm tra cấu hình tĩnh trong CI.', 'Default to ±15–25% TTL jitter + Singleflight/early refresh in the shared cache SDK and enforce static config checks in CI.') },
            { id: 'b', text: bi('Cấm hoàn toàn việc đặt TTL trên Redis (giữ key vĩnh viễn).', 'Forbid setting TTLs on Redis keys altogether.') },
            { id: 'c', text: bi('Luôn cấu hình số instance API gấp 4 lần mức tải đỉnh.', 'Always over-provision stateless API instances by 4×.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 2. WR-02 ─────────────── */
  {
    id: 'WR-02',
    order: 2,
    severity: 'SEV-1',
    title: bi(
      'Bão Retry (Retry Storm) làm sập tầng dưới',
      'Retry Storm Collapsing Downstream Storage'
    ),
    summary: bi(
      'Order DB chậm tạm thời +90 ms lúc t = 10s chạm ngưỡng timeout hẹp (95 ms) và kích hoạt retry tức thì 3 lần không backoff, nhân tải lên > 3×.',
      'Temporary +90 ms DB slowdown at t = 10s crosses a tight 95 ms timeout and triggers 3 immediate zero-backoff retries, amplifying DB load > 3×.'
    ),
    relatedModules: ['S4-11', 'S6-12'],
    alertAtSec: 10,
    peakAtSec: 22,
    scenario: wr02Scenario,
    scene: wr02Scene,
    liveSpec: makeLiveSpec('WR-02/retry-storm', 260, 0.015, [
      { node: 'order-svc', key: 'replicas' },
      { node: 'db', key: 'sizeFactor' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Order Service: Hệ số khuếch đại tải (Amplification) vọt lên > 3,5×; Order DB quá tải kéo dài.',
        '[PAGER SEV-1] Order Service: Request amplification > 3.5×; Order DB stuck in sustained overload.'
      ),
      customerImpact: bi(
        'Thanh toán đơn hàng bị treo và trả lỗi Timeout hàng loạt dù tác vụ bảo trì DB chỉ diễn ra 18 giây.',
        'Order creation times out en masse even after the 18-second DB maintenance window finishes.'
      ),
      telemetryClues: [
        bi('Lưu lượng khách hàng gửi vào giữ nguyên 1.350 req/s, nhưng link `order-db` ghi nhận > 4.500 req/s.', 'User traffic stays flat at 1,350 req/s, yet link `order-db` carries > 4,500 req/s.'),
        bi('Chỉ số Retry RPS tăng vọt ngay giây thứ 10 khi độ trễ nền Order DB vượt ngưỡng timeout 95 ms.', 'Retry RPS surges at t = 10s right as Order DB latency crosses the 95 ms link timeout.'),
        bi('Ngay cả sau t = 28s khi DB hết chậm nền, hàng đợi và luồng retry vẫn tự nuôi nhau (metastable failure).', 'Even after t = 28s when DB slowdown ends, queued retries keep the DB overloaded (metastable state).'),
      ],
    },
    slos: [
      { id: 'wr02-p99', kind: 'slo-latency', metric: 'p99', maxMs: 140, window: { fromSec: 30, toSec: 75 }, allowViolationPct: 2 },
      { id: 'wr02-err', kind: 'slo-error', maxRate: 0.015, window: { fromSec: 0, toSec: 75 } },
      { id: 'wr02-db', kind: 'node-state', node: 'db', notIn: ['overloaded'], window: { fromSec: 0, toSec: 75 }, allowViolationPct: 2 },
      { id: 'wr02-backoff', kind: 'structural', rule: 'has-retry-backoff', link: 'order-db' },
      { id: 'wr02-breaker', kind: 'structural', rule: 'has-breaker', link: 'order-db' },
    ],
    sloDescriptions: {
      'wr02-p99': bi('Hồi phục p99 ≤ 140 ms ngay sau bảo trì (30..75s, không kẹt bão retry)', 'Recovers to p99 ≤ 140 ms right after slowdown (30..75s, no metastable storm)'),
      'wr02-err': bi('Tỉ lệ lỗi tích lũy toàn sự cố ≤ 1,5%', 'Aggregate error rate ≤ 1.5% across 0..75s'),
      'wr02-db': bi('Order DB không rơi vào trạng thái overloaded', 'Order DB never enters overloaded state'),
      'wr02-backoff': bi('Link order-db dùng Retry có Backoff + Jitter', 'Link order-db uses Retry with Backoff + Jitter'),
      'wr02-breaker': bi('Link order-db có Circuit Breaker bảo vệ phụ thuộc', 'Link order-db protected by Circuit Breaker'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr02-backoff-budget',
        label: bi('Đổi Retry sang Exponential Backoff + Full Jitter + Retry Budget 10% (timeout 320 ms)', 'Switch to Exponential Backoff + Full Jitter + 10% Retry Budget (320 ms timeout)'),
        description: bi(
          'Nới timeout của link `order-db` lên 320 ms (cao hơn p99 khi bảo trì) và khóa trần tổng lượng retry tối đa 10% tải gốc kèm giãn cách mũ ngẫu nhiên.',
          'Aligns `order-db` timeout to 320 ms and bounds total retry volume to ≤ 10% of normal traffic with randomized exponential backoff.'
        ),
        targetBadge: 'order-db.retry(exp+jitter, budget=0.1)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'order-db',
            patch: {
              timeoutMs: 320,
              retry: {
                max: 2,
                backoff: 'exponential',
                baseMs: 120,
                factor: 2,
                capMs: 1200,
                jitter: 'full',
                budgetRatio: 0.1,
              },
            },
          },
        ],
      },
      {
        id: 'wr02-breaker',
        label: bi('Bật Circuit Breaker trên kết nối Order Service → Order DB', 'Enable Circuit Breaker on Order Service → Order DB link'),
        description: bi(
          'Tự động ngắt mạch tạm thời nếu tỉ lệ lỗi thực sự vượt 50%, cho phép Order DB xả hết hàng đợi thay vì bị bồi thêm tải.',
          'Trips open if error rate exceeds 50%, letting Order DB drain its queue instead of receiving cascading load.'
        ),
        targetBadge: 'order-db.breaker(err≥50%, open=5s)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'order-db',
            patch: {
              breaker: {
                errorThreshold: 0.5,
                minRps: 50,
                windowSec: 4,
                openSec: 5,
                probeRps: 80,
                closeAfterOk: 0.8,
              },
            },
          },
        ],
      },
      {
        id: 'wr02-trap-more-retries',
        label: bi('Tăng số lần Retry từ 3 lên 5 để cố vượt qua lỗi tạm thời', 'Increase max retries from 3 to 5 to mask transient errors'),
        description: bi(
          'Cho phép Order Service thử lại tối đa 5 lần liên tiếp ngay khi gặp timeout 95 ms.',
          'Retry up to 5 times immediately upon 95 ms timeout.'
        ),
        targetBadge: 'order-db.retry.max = 5',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'order-db',
            patch: {
              retry: { max: 5, backoff: 'none', baseMs: 0, jitter: 'none' },
            },
          },
        ],
        isTrap: true,
        trapWarning: bi(
          'Phương án làm sự cố nặng hơn: Tăng số lần retry tức thì đẩy hệ số khuếch đại vượt 5×, khiến hàng đợi Order DB tràn nhanh hơn.',
          'Worsens the outage: increasing immediate retries pushes amplification above 5×, saturating Order DB even faster.'
        ),
      },
      {
        id: 'wr02-trap-scale-app',
        label: bi('Tăng Order Service từ 4 lên 8 instance', 'Scale Order Service from 4 to 8 instances'),
        description: bi(
          'Thêm máy cho tầng dịch vụ gọi xuống Order DB.',
          'Add more stateless Order Service caller instances.'
        ),
        targetBadge: 'order-svc.replicas = 8',
        cost: 1,
        changes: [{ type: 'knob', node: 'order-svc', key: 'replicas', value: 8 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng trọng tâm: Nhiều instance Order Service hơn chỉ gửi các đợt retry song song xuống Order DB nhanh hơn.',
          'Ineffective mitigation: adding stateless caller instances still hammers Order DB with identical retry amplification.'
        ),
      },
    ],
    solutionMitigationIds: ['wr02-backoff-budget', 'wr02-breaker'],
    postmortem: buildPostmortem({
      id: 'WR-02.PM',
      simId: 'WR-02/retry-storm',
      seekSec: 22,
      title: bi('Báo cáo Postmortem — WR-02: Bão Retry (Retry Storm)', 'Postmortem Report — WR-02: Retry Storm'),
      prompt: bi(
        'Phân tích cơ chế vòng lặp phản hồi dương của bão retry và chuẩn cấu hình phòng vệ giữa các dịch vụ.',
        'Analyze the positive-feedback loop behind the retry storm and establish safe inter-service resilience defaults.'
      ),
      explain: bi(
        'Order DB vẫn đủ thông lượng (1.800 > 1.350 req/s) trong lúc chạy tác vụ nền (+90 ms), nhưng timeout 95 ms quá sát cộng với 3 lần retry tức thì không có Retry Budget đã biến sự kiện chậm nhẹ thành quá tải > 4.500 req/s kéo dài.',
        'Order DB still had enough throughput (1,800 > 1,350 req/s) during the +90 ms slowdown, but a hair-trigger 95 ms timeout combined with 3 instant retries multiplied load past 4,500 req/s into a metastable outage.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao sự cố vẫn tiếp diễn sau t = 28s dù tác vụ làm chậm Order DB đã kết thúc?', '1. Why did the outage persist past t = 28s even after the DB slowdown event ended?'),
          options: [
            { id: 'a', text: bi('Vì ổ cứng của Order DB đã bị hỏng vật lý vĩnh viễn.', 'Because Order DB disks suffered permanent hardware failure.') },
            { id: 'b', text: bi('Trạng thái suy giảm tự duy trì (Metastable Failure): hàng đợi tồn đọng làm thời gian chờ vẫn > 95 ms, tiếp tục kích hoạt luồng retry 3× nuôi sống tình trạng quá tải.', 'Metastable failure: the accumulated queue kept wait times above 95 ms, continuously triggering 3× retries that sustained overload.') },
            { id: 'c', text: bi('Session Cache bị đầy bộ nhớ làm nghẽn Order Service.', 'Session Cache ran out of memory and blocked Order Service.') },
          ],
          correct: ['b'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Sai lầm cấu hình nào trên link `order-db` đã châm ngòi cho vòng lặp khuếch đại tải?', '2. Which misconfiguration on `order-db` ignited the load amplification loop?'),
          options: [
            { id: 'a', text: bi('Đặt timeout quá sát độ trễ vận hành (95 ms) kèm `backoff: none`, `jitter: none` và không giới hạn Retry Budget.', 'Setting a hair-trigger 95 ms timeout paired with `backoff: none`, `jitter: none`, and no Retry Budget.') },
            { id: 'b', text: bi('Dùng giao thức kết nối trong cùng Availability Zone.', 'Using same-AZ network routing.') },
            { id: 'c', text: bi('Đặt kích thước connection pool của DB lớn hơn 100.', 'Setting DB connection pool size above 100.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Vai trò đặc hiệu của `budgetRatio: 0.1` (Retry Budget 10%) là gì?', '3. What specific guarantee does `budgetRatio: 0.1` (10% Retry Budget) provide?'),
          options: [
            { id: 'a', text: bi('Cho phép retry lỗi đơn lẻ lúc bình thường nhưng khóa trần tổng lưu lượng retry không bao giờ vượt quá ~10% tải gốc khi toàn cụm gặp sự cố.', 'Allows retries on isolated transient errors while guaranteeing aggregate retry volume never exceeds ~10% of base traffic during systemic slowdowns.') },
            { id: 'b', text: bi('Giảm 10% hóa đơn tiền máy chủ hàng giờ.', 'Reduces hourly cloud compute billing by 10%.') },
            { id: 'c', text: bi('Tự động nén kích thước bản tin mạng xuống còn 10%.', 'Compresses network payload sizes to 10%.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Quy chuẩn kiến trúc nào cần áp dụng cho mọi HTTP/RPC client nội bộ?', '4. Which architectural rule should be enforced across all internal HTTP/RPC clients?'),
          options: [
            { id: 'a', text: bi('Chỉ retry ở một tầng duy nhất kèm Exponential Backoff + Full Jitter + Retry Budget (≤ 10%) + Circuit Breaker.', 'Retry at a single layer only, always with Exponential Backoff + Full Jitter + Retry Budget (≤ 10%) + Circuit Breaker.') },
            { id: 'b', text: bi('Bật retry tối đa 3 lần ở cả Client, Gateway, Service và ORM Driver để tăng độ bền.', 'Enable 3 retries at Client, Gateway, Service, and ORM Driver simultaneously.') },
            { id: 'c', text: bi('Bỏ toàn bộ timeout trên các kết nối nội bộ để tránh cắt nhầm.', 'Remove all timeouts on internal links to avoid premature aborts.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 3. WR-03 ─────────────── */
  {
    id: 'WR-03',
    order: 3,
    severity: 'SEV-1',
    title: bi(
      'Hot Key / Tài khoản nổi tiếng làm nghẽn một Shard',
      'Celebrity Hot Key Saturating a Single Shard'
    ),
    summary: bi(
      'Một tài khoản nổi tiếng thu hút 55% tổng lưu lượng đọc (5.000 req/s) dồn vào duy nhất 1 shard NoSQL; mở rộng số shard đơn thuần không giải quyết được.',
      'A celebrity account attracts 55% of 5,000 req/s onto a single NoSQL shard; adding more shards alone fails to relieve the hot key.'
    ),
    relatedModules: ['S2-09', 'S2-02'],
    alertAtSec: 8,
    peakAtSec: 20,
    scenario: wr03Scenario,
    scene: wr03Scene,
    liveSpec: makeLiveSpec('WR-03/hot-key', 100, 0.01, [
      { node: 'hot-cache', key: 'capacityKeys' },
      { node: 'hot-cache', key: 'singleflight' },
      { node: 'feed-store', key: 'shards' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Feed Service: p99 vượt 450 ms, Shard #2 của cụm NoSQL báo HOT (100% CPU) trong khi 3 shard khác dưới 30%.',
        '[PAGER SEV-1] Feed Service: p99 > 450 ms; NoSQL Shard #2 at 100% CPU (HOT badge) while shards #0, #1, #3 sit under 30%.'
      ),
      customerImpact: bi(
        'Người dùng tải bảng tin bị chậm và lỗi gián đoạn trên toàn ứng dụng mỗi khi có bài đăng nổi bật.',
        'Timeline loads stall and fail across the app whenever a high-follower account posts.'
      ),
      telemetryClues: [
        bi('Tổng tải 5.000 req/s thấp hơn nhiều so với tổng năng lực danh nghĩa 8.800 req/s của 4 shard NoSQL.', 'Total 5,000 req/s is well below the 8,800 req/s nominal capacity of 4 NoSQL shards.'),
        bi('Nhãn `HOT` xuất hiện trên `feed-store` lúc t = 8s (`hotShare = 55%`): riêng 1 key nhận ~2.580 req/s > trần 2.200 req/s của 1 shard.', '`HOT` badge appears on `feed-store` at t = 8s (`hotShare = 55%`): one key receives ~2,580 req/s > 2,200 req/s single-shard limit.'),
        bi('Read Cache phía trước đang quá nhỏ (`2.000 / 200.000` key) nên Hit Ratio chỉ đạt ~9%.', 'Fronting Read Cache is tiny (`2,000 / 200,000` keys), yielding only ~9% hit ratio.'),
      ],
    },
    slos: [
      { id: 'wr03-p99', kind: 'slo-latency', metric: 'p99', maxMs: 100, window: { fromSec: 0, toSec: 70 }, allowViolationPct: 3 },
      { id: 'wr03-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 70 } },
      { id: 'wr03-store', kind: 'node-state', node: 'feed-store', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
    ],
    sloDescriptions: {
      'wr03-p99': bi('Độ trễ đầu-cuối p99 ≤ 100 ms', 'End-to-end p99 ≤ 100 ms'),
      'wr03-err': bi('Tỉ lệ lỗi tích lũy ≤ 1,0%', 'Aggregate error rate ≤ 1.0%'),
      'wr03-store': bi('Cụm Sharded NoSQL không bị quá tải bởi Hot Key', 'Sharded NoSQL never enters overloaded state'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr03-expand-cache',
        label: bi('Mở rộng Read Cache lên 200.000 key để giữ trọn tập key nóng trong RAM', 'Scale Read Cache capacity to 200,000 keys to hold hot feeds in memory'),
        description: bi(
          'Nâng độ phủ bộ nhớ đệm từ 1% lên 100% tập working set, đẩy Hit Ratio lên ~90% và cắt giảm 10 lần lưu lượng đọc rơi xuống Shard nóng.',
          'Raises working-set coverage to 100% (~90% hit ratio), cutting read traffic reaching the hot NoSQL shard by ~10×.'
        ),
        targetBadge: 'hot-cache.capacityKeys = 200000',
        cost: 1,
        changes: [{ type: 'knob', node: 'hot-cache', key: 'capacityKeys', value: 200_000 }],
      },
      {
        id: 'wr03-singleflight',
        label: bi('Bật Singleflight trên Read Cache cho các key có lưu lượng đọc đồng thời cao', 'Enable Singleflight on Read Cache for high-concurrency hot keys'),
        description: bi(
          'Đảm bảo khi bài đăng của tài khoản nổi tiếng vừa cập nhật hoặc hết TTL, chỉ 1 truy vấn xuống Shard đọc lại thay vì hàng nghìn truy vấn cùng lúc.',
          'Ensures that when the celebrity key refreshes, only 1 origin read hits the shard instead of thousands.'
        ),
        targetBadge: 'hot-cache.singleflight = true',
        cost: 1,
        changes: [{ type: 'knob', node: 'hot-cache', key: 'singleflight', value: true }],
      },
      {
        id: 'wr03-trap-shards',
        label: bi('Tăng gấp ba số lượng Shard NoSQL từ 4 lên 12 shard', 'Triple NoSQL partition count from 4 to 12 shards'),
        description: bi(
          'Chia lại cụm lưu trữ theo cùng khóa phân vùng `account_id` thành 12 mảnh.',
          'Repartition the NoSQL cluster across 12 shards using the same `account_id` shard key.'
        ),
        targetBadge: 'feed-store.shards = 12',
        cost: 1,
        changes: [{ type: 'knob', node: 'feed-store', key: 'shards', value: 12 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa giải quyết được Hot Key: Mọi truy vấn cùng 1 `account_id` vẫn băm về đúng 1 shard duy nhất (~2.580 req/s > trần 2.200 req/s của 1 shard), nên shard đó vẫn quá tải dù có thêm bao nhiêu shard mới.',
          'Cannot solve single-key skew: hashing the same `account_id` still maps all 55% (~2,580 req/s) onto one physical shard (> 2,200 req/s limit), leaving 11 shards idle while 1 overloads.'
        ),
      },
      {
        id: 'wr03-trap-feed-replicas',
        label: bi('Tăng Feed Service từ 5 lên 10 instance', 'Scale Feed Service from 5 to 10 instances'),
        description: bi(
          'Nhân đôi số lượng máy chủ tầng ứng dụng.',
          'Double stateless Feed Service instances.'
        ),
        targetBadge: 'feed-svc.replicas = 10',
        cost: 1,
        changes: [{ type: 'knob', node: 'feed-svc', key: 'replicas', value: 10 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng trọng tâm: Feed Service không nghẽn (ρ ≈ 0,55). Thêm máy ứng dụng không giảm được tải trên shard NoSQL đang nóng.',
          'Ineffective mitigation: Feed Service has plenty of headroom (ρ ≈ 0.55); storage hot-shard load remains unchanged.'
        ),
      },
    ],
    solutionMitigationIds: ['wr03-expand-cache', 'wr03-singleflight'],
    postmortem: buildPostmortem({
      id: 'WR-03.PM',
      simId: 'WR-03/hot-key',
      seekSec: 20,
      title: bi('Báo cáo Postmortem — WR-03: Hot Key trên Sharded NoSQL', 'Postmortem Report — WR-03: Hot Key on Sharded NoSQL'),
      prompt: bi(
        'Đánh giá giới hạn toán học của Hash Sharding trước một khóa đơn lẻ siêu nóng và cách xử lý ở tầng đọc/ghi.',
        'Evaluate why uniform hash sharding fails on single-key skew and select appropriate read/write mitigations.'
      ),
      explain: bi(
        'Hash Sharding chỉ phân tán đều nhiều key khác nhau qua các shard, nhưng không thể tách tải của một key đơn lẻ vượt trần 1 node. Với tải đọc (94%), mở rộng Read Cache / Local L1 Cache kèm Singleflight hấp thụ > 90% truy cập trước khi chạm tới shard.',
        'Hash sharding distributes distinct keys across shards, but cannot split traffic targeting a single key beyond one shard’s capacity. For read-heavy hot keys, an adequately sized cache + singleflight (or L1 in-process cache) absorbs > 90% of hits.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao cụm NoSQL 4 shard (tổng công suất 8.800 req/s) lại quá tải ở mức lưu lượng chỉ 5.000 req/s?', '1. Why did a 4-shard NoSQL cluster (8,800 req/s nominal) overload under just 5,000 req/s?'),
          options: [
            { id: 'a', text: bi('Vì 55% lượt đọc nhắm vào cùng 1 `account_id`, dồn ~2.580 req/s vào 1 shard duy nhất vượt quá trần 2.200 req/s của shard đó.', 'Because 55% of reads targeted one `account_id`, concentrating ~2,580 req/s onto a single shard whose limit is 2,200 req/s.') },
            { id: 'b', text: bi('Vì Load Balancer gửi toàn bộ request vào 1 máy Feed Service.', 'Because the Load Balancer sent all requests to a single Feed Service host.') },
            { id: 'c', text: bi('Vì mạng nội bộ giữa Cache và NoSQL bị đứt cáp.', 'Because the internal network link between Cache and NoSQL was severed.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Vì sao thao tác tăng từ 4 shard lên 12 shard không làm hết nghẽn?', '2. Why did scaling from 4 shards to 12 shards fail to resolve the incident?'),
          options: [
            { id: 'a', text: bi('Vì hàm `hash(account_id)` là tất định: dù chia cho 4 hay 12 shard, mọi truy vấn của cùng 1 tài khoản vẫn rơi vào đúng 1 shard.', 'Because `hash(account_id)` is deterministic: whether modulo/ring over 4 or 12 shards, one key still maps to exactly one shard.') },
            { id: 'b', text: bi('Vì NoSQL không hỗ trợ quá 4 shard.', 'Because NoSQL databases cannot exceed 4 shards.') },
            { id: 'c', text: bi('Vì số shard chẵn làm giảm tốc độ đọc.', 'Because an even number of shards reduces read speed.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Nếu Hot Key là tải GHI (ví dụ đếm lượt thích trực tiếp 20.000 write/s trên 1 bài đăng) thay vì tải đọc, kỹ thuật nào phù hợp?', '3. If the hot key were WRITE-heavy (e.g., 20,000 likes/s on one post) instead of read-heavy, what technique applies?'),
          options: [
            { id: 'a', text: bi('Key Salting / Write Sharding: gắn hậu tố ngẫu nhiên `post_id#0..N` khi ghi để rải sang nhiều shard (hoặc gom đệm trong bộ nhớ) rồi cộng tổng khi đọc.', 'Key salting / write sharding: append a bounded suffix `post_id#0..N` to spread writes across shards (or buffer/batch) and aggregate on read.') },
            { id: 'b', text: bi('Chỉ tăng TTL của CDN tĩnh.', 'Only increase static CDN TTL.') },
            { id: 'c', text: bi('Đổi thuật toán Load Balancer sang IP-Hash.', 'Switch Load Balancer algorithm to IP-Hash.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Biện pháp phòng ngừa dài hạn nào giúp bảo vệ cả Redis lẫn NoSQL trước các tài khoản nổi tiếng?', '4. Which long-term architectural defense protects both Redis and NoSQL from extreme hot keys?'),
          options: [
            { id: 'a', text: bi('Phát hiện Hot Key theo thời gian thực (top-K telemetry) kết hợp bộ nhớ đệm cục bộ ngắn hạn (L1 in-process cache TTL 1–3s + Singleflight) ngay trên các instance Feed Service.', 'Real-time top-K hot-key detection paired with a short-TTL L1 in-process cache (1–3s + Singleflight) on Feed Service instances.') },
            { id: 'b', text: bi('Tắt hoàn toàn bộ nhớ đệm để dữ liệu luôn đồng nhất.', 'Disable caching completely for strict consistency.') },
            { id: 'c', text: bi('Giới hạn mỗi tài khoản chỉ được có tối đa 100 người theo dõi.', 'Cap every user account at 100 followers.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 4. WR-04 ─────────────── */
  {
    id: 'WR-04',
    order: 4,
    severity: 'SEV-1',
    title: bi(
      'Cạn kiệt Connection Pool dây chuyền',
      'Cascading Connection Pool Exhaustion'
    ),
    summary: bi(
      'Truy vấn chậm +22 ms trên Orders SQL lúc t = 10s làm thời gian giữ kết nối tăng gấp ~3–4 lần; `poolSize` cấu hình quá hẹp khiến thông lượng sụt mạnh dù CPU còn rảnh.',
      'A +22 ms slow query on Orders SQL at t = 10s triples connection hold time; undersized `poolSize` starves throughput despite low CPU utilization.'
    ),
    relatedModules: ['S3-07', 'S1-03'],
    alertAtSec: 10,
    peakAtSec: 24,
    scenario: wr04Scenario,
    scene: wr04Scene,
    liveSpec: makeLiveSpec('WR-04/pool-exhaustion', 180, 0.01, [
      { node: 'checkout-svc', key: 'poolSize' },
      { node: 'sql-db', key: 'poolSize' },
      { node: 'sql-db', key: 'sizeFactor' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Checkout API: Lỗi `Timeout waiting for idle DB connection in pool`; p99 vọt lên > 700 ms.',
        '[PAGER SEV-1] Checkout API: `Timeout waiting for idle DB connection`; p99 spikes past 700 ms.'
      ),
      customerImpact: bi(
        'Khách hàng nhấn nút Thanh toán bị quay vòng chờ rồi báo lỗi hệ thống bận.',
        'Customers clicking Pay experience long spinners followed by checkout failure.'
      ),
      telemetryClues: [
        bi('CPU của cả Checkout API lẫn Orders SQL đều thấp hơn năng lực tính toán tối đa, nhưng hàng đợi chờ kết nối tăng vọt.', 'Host CPU on both Checkout API and Orders SQL is well below hardware ceiling, yet request queues skyrocket.'),
        bi('Thời gian thực thi trung bình trên Orders SQL tăng từ 6 ms lên 28 ms lúc t = 10s (nhãn `SLOW`).', 'Mean query service time on Orders SQL rises from 6 ms to 28 ms at t = 10s (`SLOW` badge).'),
        bi('Theo Little’s Law (`μ ≤ poolSize / S`), `poolSize = 6` trên mỗi máy Checkout API khóa cứng thông lượng ở ~214 req/s/máy, và `poolSize = 14` tại SQL khóa ở 500 req/s < 1.500 req/s!', 'By Little’s Law (`μ ≤ poolSize / S`), `poolSize = 6` per Checkout API caps each host at ~214 req/s, and SQL `poolSize = 14` caps DB at 500 req/s < 1,500 req/s!'),
      ],
    },
    slos: [
      { id: 'wr04-p99', kind: 'slo-latency', metric: 'p99', maxMs: 180, window: { fromSec: 0, toSec: 70 }, allowViolationPct: 3 },
      { id: 'wr04-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 70 } },
      { id: 'wr04-api', kind: 'node-state', node: 'checkout-svc', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
      { id: 'wr04-db', kind: 'node-state', node: 'sql-db', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
    ],
    sloDescriptions: {
      'wr04-p99': bi('Độ trễ đầu-cuối p99 ≤ 180 ms', 'End-to-end p99 ≤ 180 ms'),
      'wr04-err': bi('Tỉ lệ lỗi tích lũy ≤ 1,0%', 'Aggregate error rate ≤ 1.0%'),
      'wr04-api': bi('Checkout API không bị nghẽn hồ kết nối (overloaded)', 'Checkout API never enters pool-starved overload'),
      'wr04-db': bi('Orders SQL không bị nghẽn thực thi (overloaded)', 'Orders SQL never enters overloaded state'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr04-api-pool',
        label: bi('Cân chỉnh `checkout-svc.poolSize = 24` mỗi instance (tổng 96 ≤ 140 maxConnections)', 'Right-size `checkout-svc.poolSize = 24` per instance (96 total ≤ 140 maxConnections)'),
        description: bi(
          'Đảm bảo ở độ trễ 28 ms, 4 instance đạt trần kết nối `4 × (24 / 0,028) ≈ 3.428 req/s > 1.500 req/s` mà vẫn nằm gọn dưới giới hạn 140 kết nối của SQL.',
          'Gives 4 instances `4 × (24 / 0.028) ≈ 3,428 req/s` concurrency headroom while staying safely within SQL `maxConnections = 140`.'
        ),
        targetBadge: 'checkout-svc.poolSize = 24',
        cost: 1,
        changes: [{ type: 'knob', node: 'checkout-svc', key: 'poolSize', value: 24 }],
      },
      {
        id: 'wr04-db-tune',
        label: bi('Mở rộng pool thực thi `sql-db.poolSize = 56` + nâng `sizeFactor = 2` (tương đương tối ưu I/O & Index)', 'Set `sql-db.poolSize = 56` + `sizeFactor = 2` (restore DB execution concurrency & I/O)'),
        description: bi(
          'Gỡ nút thắt đồng thời ngay bên trong Orders SQL (`56 / 0,028 = 2.000`, nhân `sizeFactor = 2` đạt 4.000 req/s >> 1.500 req/s).',
          'Removes internal SQL execution starvation (`56 / 0.028 × 2 = 4,000 req/s >> 1,500 req/s`).'
        ),
        targetBadge: 'sql-db(poolSize=56, sizeFactor=2)',
        cost: 1,
        changes: [
          { type: 'knob', node: 'sql-db', key: 'poolSize', value: 56 },
          { type: 'knob', node: 'sql-db', key: 'sizeFactor', value: 2 },
        ],
      },
      {
        id: 'wr04-trap-api-only',
        label: bi('Tăng vọt `checkout-svc.poolSize = 60` (tổng 240 kết nối > 140 maxConnections) mà không chỉnh SQL', 'Max out `checkout-svc.poolSize = 60` (240 total > 140 maxConnections) without tuning SQL'),
        description: bi(
          'Mở toang connection pool phía ứng dụng vượt trần kết nối của cơ sở dữ liệu.',
          'Raise client connection pool above database maxConnections without addressing SQL throughput.'
        ),
        targetBadge: 'checkout-svc.poolSize = 60',
        cost: 1,
        changes: [{ type: 'knob', node: 'checkout-svc', key: 'poolSize', value: 60 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án gây tác dụng phụ nguy hiểm: Tổng kết nối `4 × 60 = 240` vượt `maxConnections = 140` của SQL (lỗi `too many clients`), trong khi Orders SQL vẫn bị kẹt ở mức 500 req/s!',
          'Dangerous side effect: `4 × 60 = 240` connections exceeds SQL `maxConnections = 140`, while Orders SQL remains capped at 500 req/s!'
        ),
      },
      {
        id: 'wr04-trap-scale-api',
        label: bi('Nhân đôi Checkout API lên 8 instance (giữ nguyên pool SQL)', 'Scale Checkout API to 8 instances (leave SQL pool unchanged)'),
        description: bi(
          'Thêm máy chủ ứng dụng khi thấy hàng đợi trên Checkout API tăng.',
          'Add more Checkout API instances in response to rising API queues.'
        ),
        targetBadge: 'checkout-svc.replicas = 8',
        cost: 1,
        changes: [{ type: 'knob', node: 'checkout-svc', key: 'replicas', value: 8 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng trọng tâm: Dù Checkout API có 8 máy, Orders SQL phía dưới vẫn chỉ phục vụ tối đa 500 req/s nên toàn hệ thống vẫn nghẽn ở 500 req/s.',
          'Ineffective mitigation: Orders SQL remains capped at 500 req/s, so adding API instances leaves system throughput stuck at 500 req/s.'
        ),
      },
    ],
    solutionMitigationIds: ['wr04-api-pool', 'wr04-db-tune'],
    postmortem: buildPostmortem({
      id: 'WR-04.PM',
      simId: 'WR-04/pool-exhaustion',
      seekSec: 24,
      title: bi('Báo cáo Postmortem — WR-04: Cạn kiệt Connection Pool', 'Postmortem Report — WR-04: Connection Pool Exhaustion'),
      prompt: bi(
        'Vận dụng Little’s Law (`L = λ · W`) để giải thích hiện tượng cạn kiệt kết nối khi độ trễ truy vấn tăng.',
        'Apply Little’s Law (`L = λ · W`) to explain connection starvation when query latency increases.'
      ),
      explain: bi(
        'Theo Little’s Law, thông lượng tối đa qua một hồ kết nối cỡ `P` là `μ_max = P / S`. Khi `S` tăng gấp ~4 lần (từ 6–10 ms lên 28 ms), `μ_max` giảm 4 lần ngay lập tức dù CPU chưa đầy. Phải tính cỡ pool đồng bộ từ ứng dụng tới PgBouncer/DB và không bao giờ giữ kết nối DB trong lúc làm việc khác.',
        'By Little’s Law, a pool of size `P` caps throughput at `μ_max = P / S`. When `S` quadrupled to 28 ms, `μ_max` dropped 4× even with spare CPU. Pool sizing must align with `maxConnections` via a connection proxy and short query timeouts.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Theo Little’s Law (`L = λ · W`), vì sao truy vấn chậm từ 6 ms lên 28 ms lại làm cạn kiệt Connection Pool dù tải λ = 1.500 req/s không đổi?', '1. By Little’s Law (`L = λ · W`), why did query time rising from 6 ms to 28 ms exhaust the pool at constant λ = 1,500 req/s?'),
          options: [
            { id: 'a', text: bi('Thời gian giữ kết nối tăng 4,6× làm số kết nối đồng thời cần thiết tăng từ `1.500 × 0,006 = 9` lên `1.500 × 0,028 = 42` kết nối, vượt xa giới hạn pool hiện tại.', 'Hold time rose 4.6×, raising required concurrent connections from `1,500 × 0.006 = 9` to `1,500 × 0.028 = 42`, exceeding configured pool limits.') },
            { id: 'b', text: bi('Vì giao thức TCP tự đóng kết nối mỗi khi truy vấn quá 20 ms.', 'Because TCP automatically closes sockets after 20 ms.') },
            { id: 'c', text: bi('Vì Price Cache chiếm hết băng thông RAM của SQL.', 'Because Price Cache consumed SQL memory bandwidth.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Rủi ro gì xảy ra nếu mỗi developer tự ý đặt `poolSize = 100` trên một dịch vụ có thể autoscale lên 10 instance trước DB `maxConnections = 200`?', '2. What happens if a service with `poolSize = 100` autoscales to 10 instances against a DB with `maxConnections = 200`?'),
          options: [
            { id: 'a', text: bi('Tổng fan-in kết nối đạt `10 × 100 = 1.000 > 200`, làm DB từ chối kết nối mới của cả các dịch vụ quan trọng khác và gây tốn RAM/context-switch trên DB.', 'Total fan-in hits `10 × 100 = 1,000 > 200`, exhausting DB connection slots across all services and thrashing DB memory/CPU.') },
            { id: 'b', text: bi('Cơ sở dữ liệu tự động nhân 5 lần tốc độ ổ cứng.', 'The database automatically 5× its disk speed.') },
            { id: 'c', text: bi('Không có ảnh hưởng gì vì kết nối rảnh không chiếm slot.', 'No effect because idle connections do not count toward max_connections.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Quy tắc viết code quan trọng nhất để rút ngắn thời gian giữ kết nối DB (`W`) là gì?', '3. What coding discipline minimizes DB connection/transaction hold time (`W`)?'),
          options: [
            { id: 'a', text: bi('Không bao giờ gọi HTTP/API bên thứ ba (cổng thanh toán, gửi email) bên trong khối `BEGIN ... COMMIT` hoặc khi đang mượn kết nối từ pool; luôn đặt `statement_timeout`.', 'Never make external HTTP/RPC calls (payment gateway, email) inside an open DB transaction/connection, and enforce `statement_timeout`.') },
            { id: 'b', text: bi('Gộp tất cả truy vấn đọc không liên quan vào chung một transaction dài.', 'Wrap all unrelated read queries in a single long-lived transaction.') },
            { id: 'c', text: bi('Mở kết nối TCP mới cho từng truy vấn thay vì dùng pool.', 'Open a fresh TCP + TLS connection on every SQL query.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Thành phần hạ tầng nào giúp quản lý hàng trăm instance ứng dụng chia sẻ an toàn một số lượng kết nối vật lý nhỏ trên PostgreSQL/MySQL?', '4. Which infrastructure pattern lets hundreds of app instances safely share a bounded number of physical DB connections?'),
          options: [
            { id: 'a', text: bi('Triển khai Connection Pooler ở chế độ Transaction Pooling (như PgBouncer / ProxySQL) kèm cảnh báo sớm mức bão hòa pool và kiểm tra query plan trong CI.', 'Deploy a transaction-mode connection pooler (e.g., PgBouncer / ProxySQL) with pool saturation alerts and slow-query index checks.') },
            { id: 'b', text: bi('Thêm CDN phía trước API thanh toán POST.', 'Put a static CDN in front of POST checkout endpoints.') },
            { id: 'c', text: bi('Tăng DNS TTL lên 24 giờ.', 'Increase DNS TTL to 24 hours.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 5. WR-05 ─────────────── */
  {
    id: 'WR-05',
    order: 5,
    severity: 'SEV-2',
    title: bi(
      'Tồn đọng Queue & Poison Message lặp vô hạn',
      'Queue Backlog & Infinite Poison-Message Requeue'
    ),
    summary: bi(
      'Bản deploy `v2.4` trên Invoice Worker gặp lỗi parse (~40% thông điệp lỗi) trong khi `dlq = false`, khiến thông điệp lỗi quay vòng vô hạn làm tràn hàng đợi.',
      'Deploy `v2.4` on Invoice Worker hits ~40% parse faults with `dlq = false`, infinitely requeuing poison messages until the queue overflows.'
    ),
    relatedModules: ['S2-04', 'S4-06'],
    alertAtSec: 6,
    peakAtSec: 28,
    scenario: wr05Scenario,
    scene: wr05Scene,
    liveSpec: makeLiveSpec('WR-05/poison-queue', 200, 0.02, [
      { node: 'job-queue', key: 'dlq' },
      { node: 'worker', key: 'replicas' },
      { node: 'job-queue', key: 'maxDepth' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-2] Invoice Pipeline: `backlogAgeSec` tăng liên tục, Invoice Queue chạm trần 2.400 msg và bắt đầu đánh rơi webhook mới.',
        '[PAGER SEV-2] Invoice Pipeline: `backlogAgeSec` climbing steadily; Invoice Queue hit 2,400 maxDepth and started dropping webhooks.'
      ),
      customerImpact: bi(
        'Hóa đơn của đối tác bị trễ hàng loạt và hơn 15% webhook mới bị từ chối ở cửa ngõ Ingest API.',
        'Merchant invoices are delayed and > 15% of incoming webhooks are rejected at Ingest API.'
      ),
      telemetryClues: [
        bi('Nhãn `BAD_DEPLOY` xuất hiện trên `worker` lúc t = 6s; 40% lượt xử lý ném ngoại lệ.', '`BAD_DEPLOY` badge appears on `worker` at t = 6s with a 40% processing fault rate.'),
        bi('Vì `job-queue.dlq = false`, mỗi thông điệp lỗi lập tức chui ngược lại hàng đợi, rút tốc độ xả ròng xuống còn ~408 msg/s < 780 msg/s đầu vào.', 'Because `job-queue.dlq = false`, every failed message re-enters the queue, cutting net drain to ~408 msg/s < 780 msg/s arrival.'),
        bi('Ngay cả khi cô lập thông điệp lỗi, 2 Worker hiện tại chỉ đạt tối đa `2 × 340 = 680 msg/s < 780 msg/s`!', 'Even without requeues, 2 workers only provide `2 × 340 = 680 msg/s < 780 msg/s` arrival rate!'),
      ],
    },
    slos: [
      { id: 'wr05-p99', kind: 'slo-latency', metric: 'p99', maxMs: 200, window: { fromSec: 18, toSec: 75 }, allowViolationPct: 3 },
      { id: 'wr05-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 18, toSec: 75 } },
      { id: 'wr05-worker', kind: 'node-state', node: 'worker', notIn: ['overloaded'], window: { fromSec: 18, toSec: 75 }, allowViolationPct: 3 },
      { id: 'wr05-dlq', kind: 'structural', rule: 'has-dlq', node: 'job-queue' },
    ],
    sloDescriptions: {
      'wr05-p99': bi('Độ trễ Ingest API p99 ≤ 200 ms (cửa sổ ổn định 18..75s)', 'Ingest API p99 ≤ 200 ms (18..75s steady window)'),
      'wr05-err': bi('Tỉ lệ đánh rơi webhook ≤ 1,0% (18..75s)', 'Webhook drop rate ≤ 1.0% (18..75s)'),
      'wr05-worker': bi('Invoice Worker đủ năng lực tiêu thụ không quá tải (18..75s)', 'Invoice Worker drains queue without overload (18..75s)'),
      'wr05-dlq': bi('Invoice Queue đã bật Dead-Letter Queue (`dlq = true`)', 'Invoice Queue has Dead-Letter Queue enabled (`dlq = true`)'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr05-enable-dlq',
        label: bi('Bật Dead-Letter Queue (`dlq = true`) trên Invoice Queue', 'Enable Dead-Letter Queue (`dlq = true`) on Invoice Queue'),
        description: bi(
          'Chuyển các Poison Message sang hàng đợi riêng sau số lần thử tối đa thay vì trả ngược vô hạn về hàng đợi chính, giữ lại bản tin để replay sau khi sửa parser.',
          'Routes poison messages to a side queue after max receive attempts instead of looping forever, preserving payloads for later replay.'
        ),
        targetBadge: 'job-queue.dlq = true',
        cost: 1,
        changes: [{ type: 'knob', node: 'job-queue', key: 'dlq', value: true }],
      },
      {
        id: 'wr05-scale-worker',
        label: bi('Tăng Invoice Worker từ 2 lên 4 instance (`4 × 340 = 1.360 msg/s > 780 msg/s`)', 'Scale Invoice Worker from 2 to 4 instances (`4 × 340 = 1,360 msg/s > 780 msg/s`)'),
        description: bi(
          'Đảm bảo tổng tốc độ tiêu thụ lớn hơn tốc độ đến 780 msg/s để xả nhanh lượng backlog đã tích tụ trong lúc rollout.',
          'Raises consumer throughput well above 780 msg/s arrival rate to drain accumulated backlog rapidly.'
        ),
        targetBadge: 'worker.replicas = 4',
        cost: 1,
        changes: [{ type: 'knob', node: 'worker', key: 'replicas', value: 4 }],
      },
      {
        id: 'wr05-trap-depth',
        label: bi('Chỉ tăng `maxDepth` của Invoice Queue từ 2.400 lên 50.000 (giữ `dlq = false`)', 'Only increase Invoice Queue `maxDepth` to 50,000 (keep `dlq = false`)'),
        description: bi(
          'Cấp thêm bộ nhớ đệm cho hàng đợi để tạm thời chưa đánh rơi webhook mới.',
          'Give the queue a larger buffer without changing consumer or DLQ settings.'
        ),
        targetBadge: 'job-queue.maxDepth = 50000',
        cost: 1,
        changes: [{ type: 'knob', node: 'job-queue', key: 'maxDepth', value: 50_000 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chỉ trì hoãn triệu chứng: Tốc độ xả ròng (408 msg/s) vẫn nhỏ hơn tốc độ vào (780 msg/s), nên backlog và tuổi thông điệp (`backlogAgeSec`) tăng mãi cho tới khi tràn cả mốc 50.000.',
          'Merely delays overflow: net drain (408 msg/s) remains below arrival (780 msg/s), so backlog age grows unboundedly until 50,000 also fills.'
        ),
      },
      {
        id: 'wr05-trap-worker3-nodlq',
        label: bi('Chỉ tăng nhẹ Worker lên 3 instance mà không bật DLQ', 'Only scale Worker to 3 instances without enabling DLQ'),
        description: bi(
          'Thêm 1 instance Worker nhưng vẫn để thông điệp lỗi quay vòng trong hàng đợi chính.',
          'Add 1 worker replica while leaving poison messages looping in the main queue.'
        ),
        targetBadge: 'worker.replicas = 3 (no DLQ)',
        cost: 1,
        changes: [{ type: 'knob', node: 'worker', key: 'replicas', value: 3 }],
        isTrap: true,
        trapWarning: bi(
          'Chưa đủ để xử lý sự cố: Khi không có DLQ, 40% năng lực của 3 Worker bị đốt cho thông điệp lặp lại (`3 × 340 × 0,6 = 612 msg/s < 780 msg/s`), nên hàng đợi vẫn tràn!',
          'Insufficient without DLQ: poison requeues waste 40% of 3 workers (`3 × 340 × 0.6 = 612 msg/s < 780 msg/s`), so the queue still overflows!'
        ),
      },
    ],
    solutionMitigationIds: ['wr05-enable-dlq', 'wr05-scale-worker'],
    postmortem: buildPostmortem({
      id: 'WR-05.PM',
      simId: 'WR-05/poison-queue',
      seekSec: 28,
      title: bi('Báo cáo Postmortem — WR-05: Tồn đọng Queue & Poison Message', 'Postmortem Report — WR-05: Queue Backlog & Poison Messages'),
      prompt: bi(
        'Làm rõ cơ chế xử lý thông điệp không thể parse (Poison Message), chỉ số giám sát hàng đợi và quy trình replay từ DLQ.',
        'Clarify poison-message isolation, queue age vs depth telemetry, and safe DLQ replay workflows.'
      ),
      explain: bi(
        'Trong hệ bất đồng bộ, hàng đợi không có DLQ sẽ để một tỷ lệ nhỏ Poison Message quay vòng vô hạn, ăn mòn băng thông Worker và chặn đứng thông điệp hợp lệ phía sau. Bật DLQ cô lập lỗi, còn mở rộng Worker đảm bảo `μ_drain > λ_enqueue` để kéo `backlogAgeSec` về 0.',
        'Without a DLQ, unparseable poison messages requeue endlessly, starving worker capacity and blocking valid jobs. Enabling DLQ isolates malformed payloads while scaling workers ensures `μ_drain > λ_enqueue`.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Cơ chế nào khiến bản deploy lỗi parser trên Worker làm tràn cả Invoice Queue và đánh rơi webhook ở Ingest API?', '1. How did a worker parser bug end up dropping webhooks at the upstream Ingest API?'),
          options: [
            { id: 'a', text: bi('Thông điệp lỗi bị trả lại hàng đợi vô hạn (`dlq = false`) làm tốc độ xả ròng thấp hơn tốc độ nhận (408 < 780 msg/s), đẩy backlog chạm trần `maxDepth` và kích hoạt back-pressure/drop tại Ingest API.', 'Failed messages requeued infinitely (`dlq = false`), dropping net drain below arrival (408 < 780 msg/s) until `maxDepth` filled and rejected new enqueues.') },
            { id: 'b', text: bi('Ledger DB bị khóa bảng làm treo Ingest API.', 'Ledger DB table locks blocked Ingest API directly.') },
            { id: 'c', text: bi('Băng thông mạng Internet của đối tác bị giới hạn.', 'Merchant Internet bandwidth was throttled.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Khi giám sát hàng đợi Production, vì sao cần cảnh báo theo `backlogAgeSec` (tuổi của bản tin cũ nhất) bên cạnh số lượng bản tin tồn (`queue depth`)?', '2. Why alert on `backlogAgeSec` (oldest message age) in addition to raw `queue depth`?'),
          options: [
            { id: 'a', text: bi('Vì 5.000 bản tin chỉ mất 1 giây xả nếu Worker chạy 5.000 msg/s, nhưng là sự cố nghiêm trọng nếu toàn bộ Worker đang dừng (0 msg/s) — `backlogAgeSec` phản ánh trực tiếp độ trễ SLA mà người dùng chịu.', 'Because 5,000 queued items take 1s at 5,000 msg/s but represent an outage if consumers stall at 0 msg/s — `backlogAgeSec` directly measures SLA delay.') },
            { id: 'b', text: bi('Vì `queue depth` không thể đo được trên các hệ thống hàng đợi.', 'Because message brokers cannot report queue depth.') },
            { id: 'c', text: bi('Vì `backlogAgeSec` cho biết dung lượng ổ cứng còn trống.', 'Because `backlogAgeSec` measures free disk space.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Sau khi bật DLQ và sửa xong lỗi code trên Worker (deploy `v2.4.1`), cần xử lý các hóa đơn đang nằm trong DLQ như thế nào để không ghi trùng vào Ledger DB?', '3. After fixing the worker parser (`v2.4.1`), how should messages in the DLQ be reprocessed safely?'),
          options: [
            { id: 'a', text: bi('Chạy công cụ redrive/replay có kiểm soát tốc độ từ DLQ về hàng đợi chính, kết hợp kiểm tra `idempotency_key` (ví dụ `invoice_id` UNIQUE) tại Worker/Ledger DB.', 'Run a rate-limited DLQ redrive back into the main queue, relying on `idempotency_key` (`invoice_id` UNIQUE constraint) at Ledger DB.') },
            { id: 'b', text: bi('Xóa trắng toàn bộ DLQ ngay sau khi hết cảnh báo.', 'Purge and delete all DLQ messages immediately.') },
            { id: 'c', text: bi('Tắt kiểm tra khóa chính trên Ledger DB khi chạy lại.', 'Disable primary/unique key checks on Ledger DB during replay.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Hạng mục phòng ngừa dài hạn nào ngăn bản release làm hỏng định dạng thông điệp giữa Producer và Consumer?', '4. Which long-term practice prevents schema-breaking deploys between producers and async consumers?'),
          options: [
            { id: 'a', text: bi('Áp dụng Schema Registry / Contract Test tương thích ngược-xuôi + Canary Worker 5% có tự động rollback khi tỉ lệ chuyển vào DLQ tăng bất thường.', 'Enforce backward/forward-compatible Schema Registry / Contract Tests + 5% Canary Workers with automated rollback on DLQ rate spikes.') },
            { id: 'b', text: bi('Chuyển mọi tác vụ xử lý hóa đơn sang đồng bộ 100% trên HTTP.', 'Convert all webhook processing to synchronous blocking HTTP.') },
            { id: 'c', text: bi('Đặt `visibilitySec = 0` cho mọi hàng đợi.', 'Set `visibilitySec = 0` on all queues.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 6. WR-06 ─────────────── */
  {
    id: 'WR-06',
    order: 6,
    severity: 'SEV-2',
    title: bi(
      'Replication Lag cao gây đọc dữ liệu cũ (Stale Read)',
      'High Replication Lag Causing Stale Reads'
    ),
    summary: bi(
      'Đợt tải đỉnh 3.200 req/s (800 ghi/s) làm Read Replica quá tải đọc và tụt tốc độ áp WAL còn ~475 ghi/s, đẩy `lagMs` vượt 6 giây và gây lỗi đọc số dư cũ.',
      'A 3,200 req/s spike (800 writes/s) saturates Read Replica reads and halves WAL apply throughput to ~475 writes/s, pushing `lagMs` > 6s and serving stale balances.'
    ),
    relatedModules: ['S2-08', 'S3-02'],
    alertAtSec: 10,
    peakAtSec: 40,
    scenario: wr06Scenario,
    scene: wr06Scene,
    liveSpec: makeLiveSpec('WR-06/replication-lag', 95, 0.01, [
      { node: 'db-replica', key: 'sizeFactor' },
      { node: 'db-replica', key: 'applyRps' },
      { node: 'profile-api', key: 'replicas' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-2] Wallet DB: `replication_lag_ms > 5.000 ms` trên Read Replica; khiếu nại khách hàng nạp ví xong vẫn thấy số dư 0 đ.',
        '[PAGER SEV-2] Wallet DB: Read Replica `replication_lag_ms > 5,000 ms`; users report 0 balance right after wallet top-up.'
      ),
      customerImpact: bi(
        'Người dùng vừa thanh toán/nạp ví thành công nhưng tải lại trang thấy trạng thái cũ, dẫn tới bấm nạp lặp lại nhiều lần.',
        'Users see stale wallet balances after successful top-ups, prompting duplicate payment attempts.'
      ),
      telemetryClues: [
        bi('Ở đỉnh 3.200 req/s: Primary SQL nhận 800 ghi/s + 240 đọc/s = 1.040 req/s (ρ ≈ 0,40, rất khỏe).', 'At 3,200 req/s peak: Primary SQL handles 800 writes/s + 240 reads/s = 1,040 req/s (ρ ≈ 0.40, plenty of headroom).'),
        bi('Read Replica nhận 90% lượt đọc (`2.160 req/s > μ = 1.900 req/s`, ρ = 1,14), làm tranh chấp I/O kéo tốc độ áp WAL thực tế xuống ~475 ghi/s < 800 ghi/s!', 'Read Replica receives 90% of reads (`2,160 > 1,900 req/s`, ρ = 1.14), starving I/O so effective WAL apply drops to ~475 writes/s < 800 writes/s!'),
        bi('Nhãn `LAG` trên Read Replica tăng vọt lên > 6.000 ms và p99 toàn cục vượt 250 ms.', '`LAG` badge on Read Replica climbs past 6,000 ms while global p99 exceeds 250 ms.'),
      ],
    },
    slos: [
      { id: 'wr06-p99', kind: 'slo-latency', metric: 'p99', maxMs: 95, window: { fromSec: 0, toSec: 75 }, allowViolationPct: 3 },
      { id: 'wr06-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 75 } },
      { id: 'wr06-replica', kind: 'node-state', node: 'db-replica', notIn: ['saturated', 'overloaded'], window: { fromSec: 0, toSec: 75 }, allowViolationPct: 2 },
      { id: 'wr06-primary', kind: 'node-state', node: 'db-primary', notIn: ['saturated', 'overloaded'], window: { fromSec: 0, toSec: 75 }, allowViolationPct: 2 },
    ],
    sloDescriptions: {
      'wr06-p99': bi('Độ trễ đầu-cuối p99 ≤ 95 ms suốt đợt flash sale', 'End-to-end p99 ≤ 95 ms across the flash-sale spike'),
      'wr06-err': bi('Tỉ lệ lỗi tích lũy ≤ 1,0%', 'Aggregate error rate ≤ 1.0%'),
      'wr06-replica': bi('Read Replica giữ ρ < 0,9 (đủ dư địa áp WAL không tích tụ lag)', 'Read Replica stays below saturation (zero WAL lag buildup)'),
      'wr06-primary': bi('Primary SQL không bị quá tải ngược khi nhận thêm lượt đọc', 'Primary SQL stays healthy without read-shift overload'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr06-scale-replica',
        label: bi('Nâng năng lực Read Replica (`sizeFactor = 2`, `applyRps = 1800`)', 'Scale up Read Replica capacity (`sizeFactor = 2`, `applyRps = 1800`)'),
        description: bi(
          'Tăng gấp đôi IOPS đọc cho Replica (μ = 3.800 req/s) và mở băng thông worker áp dụng WAL song song lên 1.800 ghi/s >> 800 ghi/s.',
          'Doubles Replica read IOPS (μ = 3,800 req/s) and raises parallel WAL apply throughput to 1,800 writes/s >> 800 writes/s.'
        ),
        targetBadge: 'db-replica(sizeFactor=2, applyRps=1800)',
        cost: 1,
        changes: [
          { type: 'knob', node: 'db-replica', key: 'sizeFactor', value: 2 },
          { type: 'knob', node: 'db-replica', key: 'applyRps', value: 1800 },
        ],
      },
      {
        id: 'wr06-ryw-routing',
        label: bi('Định tuyến Read-Your-Writes: giảm `api-replica.weight` xuống 3 (25% đọc mới về Primary)', 'Route Read-Your-Writes to Primary: lower `api-replica.weight` to 3 (25% reads on Primary)'),
        description: bi(
          'Đưa các lượt đọc ngay sau khi vừa ghi (~25% lượt đọc = 600 req/s) về Primary SQL (tổng Primary = 1.400 / 2.600 req/s, ρ ≈ 0,54) để khách luôn thấy số dư mới nhất.',
          'Pins post-mutation reads (~25% = 600 reads/s) to Primary SQL (1,400 / 2,600 req/s, ρ ≈ 0.54) while leaving 75% of general reads on Replica.'
        ),
        targetBadge: 'api-replica.weight = 3',
        cost: 1,
        changes: [{ type: 'link', link: 'api-replica', patch: { weight: 3 } }],
      },
      {
        id: 'wr06-trap-dump-all-primary',
        label: bi('Đẩy gần như toàn bộ lượt đọc (95%) ngược về Primary SQL (`api-replica.weight = 0.05`)', 'Shift 95% of all reads onto Primary SQL (`api-replica.weight = 0.05`)'),
        description: bi(
          'Ngắt gần hết đọc khỏi Read Replica và dồn thẳng cả đọc lẫn ghi vào Primary SQL.',
          'Bypass Read Replica almost entirely so Primary SQL serves nearly all reads and writes.'
        ),
        targetBadge: 'api-replica.weight = 0.05',
        cost: 1,
        changes: [{ type: 'link', link: 'api-replica', patch: { weight: 0.05 } }],
        isTrap: true,
        trapWarning: bi(
          'Phương án gây quá tải ngược lên Primary: Dồn 800 ghi/s + ~2.280 đọc/s = 3.080 req/s vượt trần 2.600 req/s của Primary SQL, làm nghẽn cả luồng ghi giao dịch!',
          'Overloads Primary SQL: sending 800 writes/s + ~2,280 reads/s = 3,080 req/s exceeds Primary capacity (2,600 req/s), stalling writes too!'
        ),
      },
      {
        id: 'wr06-trap-scale-api',
        label: bi('Tăng Wallet / Order API từ 4 lên 8 instance', 'Scale Wallet / Order API from 4 to 8 instances'),
        description: bi(
          'Thêm máy cho tầng dịch vụ API.',
          'Add stateless API instances.'
        ),
        targetBadge: 'profile-api.replicas = 8',
        cost: 1,
        changes: [{ type: 'knob', node: 'profile-api', key: 'replicas', value: 8 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng trọng tâm: Độ trễ sao chép nằm giữa Primary SQL và Read Replica; tăng số máy API không làm giảm Replication Lag.',
          'Ineffective mitigation: replication lag occurs between Primary SQL and Read Replica; stateless API scaling has zero effect.'
        ),
      },
    ],
    solutionMitigationIds: ['wr06-scale-replica', 'wr06-ryw-routing'],
    postmortem: buildPostmortem({
      id: 'WR-06.PM',
      simId: 'WR-06/replication-lag',
      seekSec: 40,
      title: bi('Báo cáo Postmortem — WR-06: Replication Lag & Stale Read', 'Postmortem Report — WR-06: Replication Lag & Stale Reads'),
      prompt: bi(
        'Phân tích tương tác giữa tải đọc nặng và tốc độ áp WAL trên Read Replica, cùng mẫu định tuyến Read-Your-Writes.',
        'Analyze how heavy read load degrades WAL apply throughput on replicas and design safe Read-Your-Writes routing.'
      ),
      explain: bi(
        'Sao chép bất đồng bộ luôn có độ trễ khác không, và khi Replica bị quá tải I/O đọc thì luồng áp WAL cũng chậm theo làm lag tăng vọt. Giải pháp chuẩn là giữ đủ dư địa IOPS/parallel-apply trên Replica kết hợp định tuyến có chọn lọc Read-Your-Writes (theo mốc LSN/timestamp phiên vừa ghi) về Primary.',
        'Async replication inherently lags under write bursts, and saturating a replica with reads starves WAL apply I/O. Maintain replica IOPS/parallel-apply headroom and route only recent writers (via LSN/timestamp tokens) to Primary.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao trong đợt tải đỉnh, Replication Lag trên Read Replica lại tăng vọt vượt 6.000 ms?', '1. Why did Replication Lag on the Read Replica climb past 6,000 ms during the spike?'),
          options: [
            { id: 'a', text: bi('Read Replica bị quá tải bởi 2.160 đọc/s (> 1.900 req/s) làm tranh chấp I/O kéo tốc độ áp WAL xuống ~475 ghi/s, thấp hơn tốc độ ghi 800 ghi/s từ Primary.', 'Read Replica saturated at 2,160 reads/s (> 1,900 req/s), starving I/O and cutting WAL apply rate to ~475 writes/s below Primary’s 800 writes/s.') },
            { id: 'b', text: bi('Cáp quang liên vùng bị đứt hoàn toàn trong 60 giây.', 'The cross-AZ fiber link was completely severed for 60 seconds.') },
            { id: 'c', text: bi('Load Balancer gửi nhầm lệnh INSERT vào Read Replica.', 'The Load Balancer sent INSERT queries directly to the Read Replica.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Vì sao không nên tắt hoàn toàn Read Replica để đẩy 100% lượt đọc về Primary SQL lúc đang cao điểm?', '2. Why is abruptly routing 100% of reads back to Primary SQL during peak load risky?'),
          options: [
            { id: 'a', text: bi('Vì tổng tải đọc + ghi (3.200 req/s) vượt năng lực Primary SQL (2.600 req/s), biến sự cố đọc dữ liệu cũ thành sự cố ngừng trệ cả luồng ghi.', 'Because combined read + write traffic (3,200 req/s) exceeds Primary capacity (2,600 req/s), turning stale reads into a total read/write outage.') },
            { id: 'b', text: bi('Vì Primary SQL không hỗ trợ câu lệnh SELECT.', 'Because Primary SQL nodes cannot execute SELECT queries.') },
            { id: 'c', text: bi('Vì Primary SQL chỉ lưu dữ liệu cũ hơn Replica.', 'Because Primary SQL holds older data than Replicas.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Mẫu thiết kế nào đảm bảo tính chất Read-Your-Writes cho người vừa nạp ví mà vẫn giữ phần lớn lượt đọc thông thường trên Replica?', '3. Which pattern guarantees Read-Your-Writes after a wallet update while keeping most reads on Replicas?'),
          options: [
            { id: 'a', text: bi('Gắn LSN / vị trí WAL (hoặc mốc `last_write_ts` trong 5 giây) vào phiên người dùng vừa ghi; chỉ định tuyến về Primary nếu Replica chưa áp tới LSN đó.', 'Attach commit LSN / `last_write_ts` window to the writer’s session and route to Primary only when the chosen Replica has not yet caught up to that LSN.') },
            { id: 'b', text: bi('Bắt trình duyệt chờ `sleep(10s)` sau mỗi lần bấm nút.', 'Force the browser to `sleep(10s)` after every click.') },
            { id: 'c', text: bi('Xóa toàn bộ chỉ mục (Index) trên Read Replica.', 'Drop all secondary indexes on Read Replicas.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Cải tiến vận hành nào giúp ngăn Replica trả dữ liệu quá cũ tự động?', '4. Which automated operational safeguard prevents severely lagging replicas from serving stale reads?'),
          options: [
            { id: 'a', text: bi('Bật Multi-threaded Replica Apply + tự động giảm trọng số đọc (có ngưỡng sàn an toàn cho Primary) khi `replication_lag_ms` vượt ngưỡng SLO (ví dụ > 500 ms).', 'Enable multi-threaded replica apply + lag-aware load balancing with a circuit-breaker floor protecting Primary capacity when `replication_lag_ms > 500 ms`.') },
            { id: 'b', text: bi('Chạy tác vụ backup toàn bộ đĩa trực tiếp trên Read Replica vào giờ cao điểm.', 'Schedule full-disk backups on Read Replicas during peak hours.') },
            { id: 'c', text: bi('Giảm cỡ máy của Read Replica xuống bằng 1/4 máy Primary.', 'Downsize Read Replicas to one-quarter of Primary hardware.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 7. WR-07 ─────────────── */
  {
    id: 'WR-07',
    order: 7,
    severity: 'SEV-1',
    title: bi(
      'Lỗi lan truyền từ phụ thuộc phụ (Cascading Slow Dependency)',
      'Cascading Outage From Slow Secondary Dependency'
    ),
    summary: bi(
      'Dịch vụ phụ trợ Reco Engine chậm +900 ms lúc t = 10s với `timeoutMs = 3000` và `fallback = error` kéo sập toàn bộ API trang chủ.',
      'Optional Reco Engine slows by +900 ms at t = 10s with `timeoutMs = 3000` and `fallback = error`, dragging down the entire Storefront API.'
    ),
    relatedModules: ['S4-11', 'S1-02'],
    alertAtSec: 10,
    peakAtSec: 22,
    scenario: wr07Scenario,
    scene: wr07Scene,
    liveSpec: makeLiveSpec('WR-07/cascading-slow-dep', 160, 0.01, [
      { node: 'home-api', key: 'replicas' },
      { node: 'reco-svc', key: 'replicas' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Storefront API: Độ trễ p99 chạm trần 1.200 ms, tỉ lệ lỗi trang chủ vọt lên > 25% dù Product DB hoàn toàn khỏe mạnh.',
        '[PAGER SEV-1] Storefront API: p99 hits 1,200 ms client timeout; storefront error rate > 25% despite healthy Product DB.'
      ),
      customerImpact: bi(
        'Khách hàng không tải được trang danh sách sản phẩm chỉ vì khung "Có thể bạn thích" ở cuối trang bị treo.',
        'Shoppers cannot load core product pages solely because the optional "Recommended for You" widget hangs.'
      ),
      telemetryClues: [
        bi('Waterfall Trace cho thấy nhánh `home-catalog` hoàn tất trong ~8 ms, còn nhánh `home-reco` chiếm > 98% tổng thời gian request (> 915 ms).', 'Request Trace waterfall shows `home-catalog` finishing in ~8 ms while `home-reco` consumes > 98% of total latency (> 915 ms).'),
        bi('Link `home-reco` đang cấu hình `timeoutMs = 3000` (dài hơn cả `clientTimeoutMs = 1200`) và `fallback = error`.', 'Link `home-reco` has `timeoutMs = 3000` (longer than `clientTimeoutMs = 1200`) and `fallback = error`.'),
        bi('Chỉ cắt ngắn timeout mà không đổi `fallback` sang `degrade` sẽ làm 100% request biến thành lỗi!', 'Shortening timeout alone without `fallback: degrade` converts slow calls into 100% hard errors!'),
      ],
    },
    slos: [
      { id: 'wr07-p99', kind: 'slo-latency', metric: 'p99', maxMs: 220, window: { fromSec: 0, toSec: 70 }, allowViolationPct: 5 },
      { id: 'wr07-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 70 } },
      { id: 'wr07-breaker', kind: 'structural', rule: 'has-breaker', link: 'home-reco' },
    ],
    sloDescriptions: {
      'wr07-p99': bi('Độ trễ đầu-cuối Storefront API p99 ≤ 220 ms', 'Storefront API end-to-end p99 ≤ 220 ms'),
      'wr07-err': bi('Tỉ lệ lỗi trang chủ ≤ 1,0% (nhờ Graceful Degradation)', 'Storefront error rate ≤ 1.0% (via Graceful Degradation)'),
      'wr07-breaker': bi('Link `home-reco` có Circuit Breaker ngắt nhanh khi phụ thuộc lỗi', 'Link `home-reco` protected by fail-fast Circuit Breaker'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr07-timeout-degrade',
        label: bi('Đặt `timeoutMs = 120` kết hợp `fallback = degrade` trên link `home-reco`', 'Set `timeoutMs = 120` with `fallback = degrade` on link `home-reco`'),
        description: bi(
          'Giới hạn thời gian chờ Reco Engine tối đa 120 ms; nếu quá hạn, trả về danh sách sản phẩm bán chạy mặc định thay vì báo lỗi trang chủ.',
          'Caps Reco Engine wait at 120 ms and falls back to static top-selling items instead of failing the page.'
        ),
        targetBadge: 'home-reco(timeout=120ms, degrade)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'home-reco',
            patch: { timeoutMs: 120, fallback: 'degrade' },
          },
        ],
      },
      {
        id: 'wr07-breaker',
        label: bi('Bật Circuit Breaker trên `home-reco` để fail-fast (< 1 ms) khi Reco Engine suy giảm', 'Enable Circuit Breaker on `home-reco` to fail fast (< 1 ms) when Reco degrades'),
        description: bi(
          'Khi tỉ lệ timeout trên `home-reco` vượt 35%, mở mạch trong 25 giây để Storefront API trả trang trong ~55 ms thay vì phải đợi hết 120 ms mỗi request.',
          'Trips open for 25s once `home-reco` timeouts exceed 35%, dropping storefront p99 back to ~55 ms instead of waiting 120 ms per call.'
        ),
        targetBadge: 'home-reco.breaker(err≥35%, open=25s)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'home-reco',
            patch: {
              breaker: {
                errorThreshold: 0.35,
                minRps: 50,
                windowSec: 2,
                openSec: 25,
                probeRps: 40,
                closeAfterOk: 0.8,
              },
            },
          },
        ],
      },
      {
        id: 'wr07-trap-timeout-only',
        label: bi('Chỉ hạ `home-reco.timeoutMs = 100` nhưng giữ nguyên `fallback = error`', 'Lower `home-reco.timeoutMs = 100` while keeping `fallback = error`'),
        description: bi(
          'Cắt kết nối sớm sau 100 ms và ném thẳng ngoại lệ lỗi ra ngoài Storefront API.',
          'Abort slow Reco calls at 100 ms and propagate the error directly to Storefront API.'
        ),
        targetBadge: 'home-reco(timeout=100ms, error)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'home-reco',
            patch: { timeoutMs: 100, fallback: 'error' },
          },
        ],
        isTrap: true,
        trapWarning: bi(
          'Phương án làm tỉ lệ lỗi vọt lên gần 100%: Độ trễ giảm nhưng mọi request quá 100 ms của Reco Engine đều bị tính là lỗi HTTP 500 trên trang chủ vì thiếu `fallback: degrade`!',
          'Causes ~100% HTTP 500 error rate: latency drops, but without `fallback: degrade` every 100 ms Reco timeout fails the entire storefront response!'
        ),
      },
      {
        id: 'wr07-trap-scale-reco',
        label: bi('Tăng Reco Engine từ 2 lên 4 instance', 'Scale Reco Engine from 2 to 4 instances'),
        description: bi(
          'Thêm máy cho Reco Engine khi thấy độ trễ phản hồi cao.',
          'Add more Reco Engine instances.'
        ),
        targetBadge: 'reco-svc.replicas = 4',
        cost: 1,
        changes: [{ type: 'knob', node: 'reco-svc', key: 'replicas', value: 4 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa giải quyết được độ trễ nền: Mỗi request Reco vẫn mất tối thiểu > 915 ms do nạp mô hình nặng, nên p99 trang chủ vẫn vượt xa ngưỡng 160 ms.',
          'Ineffective against intrinsic latency: each Reco call still takes > 915 ms base processing time, keeping storefront p99 > 950 ms.'
        ),
      },
    ],
    solutionMitigationIds: ['wr07-timeout-degrade', 'wr07-breaker'],
    postmortem: buildPostmortem({
      id: 'WR-07.PM',
      simId: 'WR-07/cascading-slow-dep',
      seekSec: 22,
      title: bi('Báo cáo Postmortem — WR-07: Lỗi lan truyền từ phụ thuộc phụ', 'Postmortem Report — WR-07: Cascading Slow Dependency'),
      prompt: bi(
        'Phân loại phụ thuộc thiết yếu (Critical) so với phụ thuộc phụ trợ (Non-critical) và thiết kế Bulkhead / Graceful Degradation.',
        'Classify critical vs non-critical dependencies and design timeout budgets, circuit breakers, and graceful fallbacks.'
      ),
      explain: bi(
        'Khi một API gọi song song nhiều backend, độ trễ đầu-cuối là `max(...)` và xác suất thành công là tích xác suất nếu mọi nhánh đều bắt buộc (`fallback: error`). Phụ thuộc phụ bắt buộc có ngân sách timeout nhỏ hơn SLO trang, `fallback: degrade` và `breaker` để ngắt mạch dưới 1 ms.',
        'In parallel fan-out aggregation, tail latency is `max(...)` and availability is the product of all hard dependencies. Optional widgets must combine tight timeouts (< page SLO), `fallback: degrade`, and a Circuit Breaker.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao sự cố trên Reco Engine (một tiện ích phụ) lại đánh sập luồng xem sản phẩm chính?', '1. Why did a slowdown in the optional Reco Engine break core product browsing?'),
          options: [
            { id: 'a', text: bi('Vì Storefront API gọi `home-reco` như một phụ thuộc cứng (`timeoutMs = 3000 > clientTimeoutMs = 1200`, `fallback = error`) mà không có cô lập hay giảm cấp.', 'Because Storefront API treated `home-reco` as a hard dependency (`timeoutMs = 3000 > clientTimeoutMs`, `fallback = error`) without isolation or fallback.') },
            { id: 'b', text: bi('Vì Reco Engine xóa bảng dữ liệu trong Product DB.', 'Because Reco Engine truncated tables inside Product DB.') },
            { id: 'c', text: bi('Vì Load Balancer ngừng nhận kết nối mới.', 'Because the Load Balancer stopped accepting TCP connections.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Điều gì xảy ra nếu kỹ sư trực ca chỉ giảm `home-reco.timeoutMs` xuống 100 ms mà quên cấu hình `fallback: degrade`?', '2. What happens if the on-call engineer lowers `home-reco.timeoutMs` to 100 ms without setting `fallback: degrade`?'),
          options: [
            { id: 'a', text: bi('Độ trễ phản hồi giảm nhanh xuống ~110 ms nhưng tỉ lệ lỗi trang chủ tăng vọt lên gần 100% vì lỗi timeout của Reco bị trả thẳng cho người dùng.', 'Response time drops to ~110 ms, but storefront error rate jumps near 100% because Reco timeouts propagate as page-level errors.') },
            { id: 'b', text: bi('Reco Engine tự động chạy nhanh gấp 10 lần.', 'Reco Engine automatically speeds up 10×.') },
            { id: 'c', text: bi('Trang chủ hoạt động hoàn toàn bình thường không có lỗi.', 'The storefront serves 100% successful responses.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Khi đã có `timeoutMs = 120` và `fallback = degrade`, vì sao bật thêm `Circuit Breaker` vẫn mang lại cải thiện lớn?', '3. Once `timeoutMs = 120` and `fallback = degrade` are set, what extra benefit does the Circuit Breaker bring?'),
          options: [
            { id: 'a', text: bi('Khi mạch mở (Open), Storefront API ngắt ngay trong < 1 ms thay vì tốn 120 ms chờ vô ích trên mỗi request, đồng thời giải phóng tải để Reco Engine tự hồi phục.', 'While Open, Storefront API short-circuits in < 1 ms instead of paying a 120 ms tax on every request, while shedding load from Reco Engine.') },
            { id: 'b', text: bi('Circuit Breaker tự huấn luyện lại mô hình Machine Learning.', 'The Circuit Breaker retrains the ML model.') },
            { id: 'c', text: bi('Circuit Breaker mã hóa dữ liệu trả về.', 'The Circuit Breaker encrypts response payloads.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Quy trình kiểm thử nào giúp xác nhận các phụ thuộc phụ trợ thực sự giảm cấp êm ái trên Production?', '4. Which engineering practice verifies that non-critical dependencies truly degrade gracefully?'),
          options: [
            { id: 'a', text: bi('Lập danh mục phân tầng Tier-0 / Tier-2 cho từng dependency, tách Bulkhead pool riêng và định kỳ chạy Chaos Injection (tiêm độ trễ/lỗi vào Tier-2) để kiểm chứng SLO của Tier-0.', 'Maintain Tier-0 vs Tier-2 dependency classification, isolate thread/connection bulkheads, and run regular fault-injection drills verifying Tier-0 SLOs hold.') },
            { id: 'b', text: bi('Đặt mọi timeout bằng 30 giây cho thống nhất.', 'Standardize all internal timeouts to 30 seconds.') },
            { id: 'c', text: bi('Gộp chung code của Reco Engine vào bên trong Product DB.', 'Embed Reco ML inference inside Product DB stored procedures.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 8. WR-08 ─────────────── */
  {
    id: 'WR-08',
    order: 8,
    severity: 'SEV-1',
    title: bi(
      'Timeout không huỷ việc (cancelOnTimeout = false / Công việc Zombie)',
      'Uncanceled Timeout & Zombie Work Flooding Database'
    ),
    summary: bi(
      'Gateway đã cắt chờ Search Filter App sau `timeoutMs = 150` kèm `fallback: degrade`, nhưng `cancelOnTimeout = false` khiến App vẫn chạy trọn 450 ms và xả ~4.800 truy vấn Zombie/s làm sập Shared SQL DB.',
      'Gateway times out Search Filter App at `150 ms` with `fallback: degrade`, yet `cancelOnTimeout = false` lets abandoned requests run 450 ms and flood Shared SQL DB with ~4,800 zombie queries/s.'
    ),
    relatedModules: ['S4-11', 'S4-10'],
    alertAtSec: 8,
    peakAtSec: 22,
    scenario: wr08Scenario,
    scene: wr08Scene,
    liveSpec: makeLiveSpec('WR-08/zombie-work', 200, 0.01, [
      { node: 'app', key: 'replicas' },
      { node: 'db', key: 'sizeFactor' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Core Checkout: Lỗi 5xx vượt 40% do Shared SQL DB quá tải (ρ > 2,3), dù không có tăng trưởng đơn hàng!',
        '[PAGER SEV-1] Core Checkout: 5xx > 40% as Shared SQL DB overloads (ρ > 2.3) with flat checkout volume!'
      ),
      customerImpact: bi(
        'Luồng thanh toán cốt lõi bị nghẽn và lỗi dù nhánh Search Filter đã được bọc `timeoutMs = 150` và `fallback = degrade` trên Gateway.',
        'Core checkout fails even though the Search Filter call was wrapped in `timeoutMs = 150` and `fallback = degrade` at the Gateway.'
      ),
      telemetryClues: [
        bi('Search Filter App chậm lên 450 ms lúc t = 8s (> 150 ms timeout trên `gw-app`).', 'Search Filter App slows to 450 ms at t = 8s (> 150 ms timeout on `gw-app`).'),
        bi('Mặc dù Gateway đã ngắt chờ sau 150 ms, link `app-db` vẫn bắn ~4.800 req/s xuống Shared SQL DB!', 'Even though Gateway gives up after 150 ms, link `app-db` still hammers Shared SQL DB with ~4,800 req/s!'),
        bi('Nguyên nhân: `gw-app.cancelOnTimeout = false` cộng thêm `retry.max = 2` khiến mỗi request bị bỏ rơi vẫn sinh 3 tiến trình Zombie chạy đến cùng và truy vấn DB vô ích.', 'Cause: `gw-app.cancelOnTimeout = false` plus `retry.max = 2` spawns 3 abandoned zombie executions per request that still query the DB.'),
      ],
    },
    slos: [
      { id: 'wr08-p99', kind: 'slo-latency', metric: 'p99', maxMs: 200, window: { fromSec: 0, toSec: 70 }, allowViolationPct: 3 },
      { id: 'wr08-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 0, toSec: 70 } },
      { id: 'wr08-db', kind: 'node-state', node: 'db', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
      { id: 'wr08-app', kind: 'node-state', node: 'app', notIn: ['overloaded'], window: { fromSec: 0, toSec: 70 }, allowViolationPct: 2 },
    ],
    sloDescriptions: {
      'wr08-p99': bi('Độ trễ đầu-cuối Gateway p99 ≤ 200 ms', 'Gateway end-to-end p99 ≤ 200 ms'),
      'wr08-err': bi('Tỉ lệ lỗi Core Checkout ≤ 1,0%', 'Core Checkout error rate ≤ 1.0%'),
      'wr08-db': bi('Shared SQL DB được giải phóng khỏi truy vấn Zombie (không overloaded)', 'Shared SQL DB freed from zombie queries (never overloaded)'),
      'wr08-app': bi('Search Filter App không bị treo hàng đợi Zombie (không overloaded)', 'Search Filter App freed from zombie queue buildup'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr08-cancel-on-timeout',
        label: bi('Bật `cancelOnTimeout = true` và tắt retry mù trên link `gw-app` (truyền Context Deadline)', 'Enable `cancelOnTimeout = true` and disable blind retries on `gw-app` (propagate deadline)'),
        description: bi(
          'Truyền tín hiệu hủy (`AbortSignal` / gRPC deadline) xuống Search Filter App ngay khi hết 150 ms, cắt đứt tức thời toàn bộ truy vấn SQL thừa phía sau.',
          'Propagates context cancellation (`AbortSignal` / gRPC deadline) to Search Filter App at 150 ms, aborting execution before issuing wasted SQL queries.'
        ),
        targetBadge: 'gw-app(cancelOnTimeout=true, retry=0)',
        cost: 1,
        changes: [
          {
            type: 'link',
            link: 'gw-app',
            patch: {
              cancelOnTimeout: true,
              retry: { max: 0, backoff: 'none', baseMs: 0, jitter: 'none' },
            },
          },
        ],
      },
      {
        id: 'wr08-tune-app',
        label: bi('Tăng `app.replicas` từ 2 lên 3 để giữ dư địa CPU an toàn khi hủy sớm ở 150 ms', 'Scale `app.replicas` from 2 to 3 for clean CPU headroom during 150 ms early cancellation'),
        description: bi(
          'Đảm bảo cụm Search Filter App giữ mức bận thấp (ρ ≈ 0,30) trong lúc đội phát triển hotfix biểu thức regex chậm.',
          'Keeps Search Filter App utilization low (ρ ≈ 0.30) while developers roll out a regex fix.'
        ),
        targetBadge: 'app.replicas = 3',
        cost: 1,
        changes: [{ type: 'knob', node: 'app', key: 'replicas', value: 3 }],
      },
      {
        id: 'wr08-trap-scale-app-only',
        label: bi('Tăng gấp ba `app.replicas` từ 2 lên 6 (nhưng giữ `cancelOnTimeout = false`)', 'Triple `app.replicas` from 2 to 6 (leave `cancelOnTimeout = false`)'),
        description: bi(
          'Thêm nhiều máy Search Filter App để xử lý hết lượng request đang tồn đọng.',
          'Add more Search Filter App instances without enabling cancellation.'
        ),
        targetBadge: 'app.replicas = 6 (no cancel)',
        cost: 1,
        changes: [{ type: 'knob', node: 'app', key: 'replicas', value: 6 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án làm Shared SQL DB quá tải nặng hơn: Nhiều máy Search Filter hơn càng đẩy toàn bộ `3.300 × 2 = 6.600` truy vấn Zombie/giây dồn thẳng xuống Shared SQL DB!',
          'Makes DB overload worse: more Search Filter hosts pump the full `3,300 × 2 = 6,600` abandoned zombie queries/sec straight into Shared SQL DB!'
        ),
      },
      {
        id: 'wr08-trap-lower-timeout',
        label: bi('Hạ `gw-app.timeoutMs` từ 150 ms xuống 50 ms (giữ `cancelOnTimeout = false`)', 'Lower `gw-app.timeoutMs` from 150 ms to 50 ms (keep `cancelOnTimeout = false`)'),
        description: bi(
          'Rút ngắn thêm thời gian chờ ở phía API Gateway.',
          'Shorten caller-side timeout at API Gateway without context propagation.'
        ),
        targetBadge: 'gw-app.timeoutMs = 50',
        cost: 1,
        changes: [{ type: 'link', link: 'gw-app', patch: { timeoutMs: 50 } }],
        isTrap: true,
        trapWarning: bi(
          'Phương án không chặn được công việc Zombie: Gateway buông tay sớm hơn ở 50 ms nhưng Search Filter App vẫn âm thầm chạy đủ 450 ms và nã truy vấn xuống Shared SQL DB!',
          'Does not stop zombie work: Gateway gives up at 50 ms, yet Search Filter App still runs the full 450 ms and hammers Shared SQL DB!'
        ),
      },
    ],
    solutionMitigationIds: ['wr08-cancel-on-timeout', 'wr08-tune-app'],
    postmortem: buildPostmortem({
      id: 'WR-08.PM',
      simId: 'WR-08/zombie-work',
      seekSec: 22,
      title: bi('Báo cáo Postmortem — WR-08: Công việc Zombie do thiếu Context Cancellation', 'Postmortem Report — WR-08: Zombie Work From Missing Context Cancellation'),
      prompt: bi(
        'Phân biệt Timeout phía người gọi (Caller Timeout) với Hủy việc xuyên tầng (Deadline / Context Cancellation Propagation).',
        'Distinguish caller-side timeout from end-to-end deadline and cancellation propagation.'
      ),
      explain: bi(
        'Đặt timeout ở Gateway chỉ giúp phía gọi thôi không chờ nữa; nếu không truyền deadline/tín hiệu hủy (`context.Context` trong Go, `AbortSignal` trong Node/Fetch, `grpc-timeout`), phía dưới vẫn tiêu tốn CPU, connection pool và IOPS DB cho một kết quả không còn ai đọc (Zombie Work).',
        'A caller timeout only stops the caller from waiting; without propagating deadlines (`context.Context`, `AbortSignal`, `grpc-timeout`, SQL `max_execution_time`), downstream tiers keep burning CPU and DB IOPS on abandoned zombie work.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao Core Checkout bị lỗi hàng loạt dù Gateway đã bọc Search Filter App bằng `timeoutMs = 150` và `fallback = degrade`?', '1. Why did Core Checkout fail even though Search Filter App had `timeoutMs = 150` and `fallback = degrade`?'),
          options: [
            { id: 'a', text: bi('Vì `cancelOnTimeout = false` kèm retry làm các request đã quá hạn vẫn tiếp tục chạy trên Search Filter App và đổ hàng nghìn truy vấn Zombie làm nghẽn Shared SQL DB dùng chung.', 'Because `cancelOnTimeout = false` plus retries let timed-out requests keep executing and flood the shared SQL DB with thousands of zombie queries.') },
            { id: 'b', text: bi('Vì `fallback = degrade` tự động tắt luôn Core Checkout.', 'Because `fallback = degrade` disables Core Checkout.') },
            { id: 'c', text: bi('Vì timeout 150 ms là quá dài so với ngưỡng 900 ms của client.', 'Because 150 ms is longer than the 900 ms client timeout.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Vì sao tăng gấp ba số instance của Search Filter App (khi chưa bật `cancelOnTimeout`) lại làm Shared SQL DB tệ đi?', '2. Why did tripling Search Filter App replicas (without `cancelOnTimeout`) worsen Shared SQL DB saturation?'),
          options: [
            { id: 'a', text: bi('Vì trước đó 2 instance App vô tình đóng vai trò "nút cổ chai hạn chế tốc độ"; mở lên 6 instance tháo bỏ nút thắt đó và xả toàn bộ luồng retry Zombie thẳng xuống DB.', 'Because 2 App instances previously acted as an accidental throttle; scaling to 6 uncorked the bottleneck and forwarded the entire retry-amplified zombie flood into the DB.') },
            { id: 'b', text: bi('Vì 6 instance chiếm hết địa chỉ IP của mạng LAN.', 'Because 6 instances exhausted subnet IP addresses.') },
            { id: 'c', text: bi('Vì Search Filter App ghi đè cấu hình của Load Balancer.', 'Because Search Filter App overwrote Load Balancer configs.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Trong thực tế triển khai HTTP/gRPC + SQL, làm thế nào để hiện thực hóa `cancelOnTimeout = true` xuyên suốt từ Gateway tới Database?', '3. In real HTTP/gRPC + SQL stacks, how is `cancelOnTimeout = true` implemented end-to-end?'),
          options: [
            { id: 'a', text: bi('Truyền header ngân sách thời gian còn lại (`grpc-timeout` / deadline header), nối sự kiện đóng kết nối vào `ctx` / `AbortSignal` của handler và truyền tiếp `ctx` vào driver SQL để hủy câu truy vấn.', 'Propagate remaining deadline headers (`grpc-timeout`), wire client disconnect/deadline into `ctx`/`AbortSignal`, and pass `ctx` into the SQL driver query call.') },
            { id: 'b', text: bi('Khởi động lại toàn bộ container ứng dụng mỗi 5 giây.', 'Restart all application containers every 5 seconds.') },
            { id: 'c', text: bi('Chuyển mọi truy vấn sang chạy trong goroutine/thread tách rời không gắn với request.', 'Spawn detached background threads ignoring request lifecycle.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Ngoài hủy việc theo deadline, cải tiến kiến trúc nào ngăn triệt để Search Filter App ảnh hưởng tới Core Checkout ở tầng lưu trữ?', '4. Beyond deadline cancellation, what storage-layer architecture isolates Core Checkout from Search Filter load?'),
          options: [
            { id: 'a', text: bi('Tách tải đọc tìm kiếm/lọc sang Read Replica hoặc công cụ tìm kiếm chuyên dụng (Elasticsearch/OpenSearch) với hạn ngạch kết nối riêng (Database Bulkhead), không dùng chung Primary DB của Checkout.', 'Isolate search/filter queries onto dedicated Read Replicas or a search index (OpenSearch) with separate connection quotas, off the Checkout Primary DB.') },
            { id: 'b', text: bi('Tăng `clientTimeoutMs` lên 60 giây.', 'Raise `clientTimeoutMs` to 60 seconds.') },
            { id: 'c', text: bi('Tắt toàn bộ log truy vấn chậm trên SQL.', 'Disable SQL slow-query logging.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },

  /* ─────────────── 9. WR-09 ─────────────── */
  {
    id: 'WR-09',
    order: 9,
    severity: 'SEV-1',
    title: bi(
      'Bẫy DNS TTL dài chặn Failover vùng',
      'Long DNS TTL Blocking Regional Failover'
    ),
    summary: bi(
      'Cổng vùng chính (`az-a`) sập lúc t = 8s, nhưng `dns.ttlSec = 600s` giữ 90% lưu lượng đập vào vùng chết suốt sự cố, kèm `lb-standby.healthCheckSec = 45s` chậm loại node hỏng.',
      'Primary regional gateway (`az-a`) crashes at t = 8s, but `dns.ttlSec = 600s` pins 90% of traffic to the dead region while slow 45s standby LB health checks delay recovery.'
    ),
    relatedModules: ['S3-09', 'S1-06'],
    alertAtSec: 8,
    peakAtSec: 20,
    scenario: wr09Scenario,
    scene: wr09Scene,
    liveSpec: makeLiveSpec('WR-09/dns-ttl-failover', 90, 0.01, [
      { node: 'dns', key: 'ttlSec' },
      { node: 'lb-standby', key: 'healthCheckSec' },
      { node: 'app-b-live', key: 'replicas' },
    ]),
    symptom: {
      pagerAlert: bi(
        '[PAGER SEV-1] Multi-Region Edge: Mất kết nối `gw-primary` (AZ-A) lúc 00:08; tỉ lệ lỗi toàn cầu kẹt cứng ở ~90% không tự giảm!',
        '[PAGER SEV-1] Multi-Region Edge: `gw-primary` (AZ-A) down at 00:08; global error rate stuck near ~90% with no failover convergence!'
      ),
      customerImpact: bi(
        '9 trên 10 người dùng không thể truy cập dịch vụ suốt nhiều phút dù vùng dự phòng AZ-B đã dựng sẵn cụm 4 máy khỏe mạnh.',
        '90% of users experience complete connection failures for minutes even though Standby AZ-B has 4 healthy servers ready.'
      ),
      telemetryClues: [
        bi('Nhãn `DOWN` xuất hiện trên `gw-primary` và `app-b-dead` lúc t = 8s.', '`DOWN` badge appears on `gw-primary` and `app-b-dead` at t = 8s.'),
        bi('Link `dns-primary` vẫn tiếp tục đẩy ~2.700 req/s vào `gw-primary` đã chết vì `dns.ttlSec = 600` giây.', 'Link `dns-primary` keeps routing ~2,700 req/s into dead `gw-primary` because `dns.ttlSec = 600` seconds.'),
        bi('Tại vùng dự phòng, `lb-standby` đang đặt `healthCheckSec = 45` giây nên vẫn chia nửa lưu lượng vào `Standby App A` đã sập.', 'In Standby AZ-B, `lb-standby` has `healthCheckSec = 45`s and keeps sending half its traffic to dead `Standby App A`.'),
      ],
    },
    slos: [
      { id: 'wr09-rto-err', kind: 'slo-error', maxRate: 0.01, window: { fromSec: 15, toSec: 80 } },
      { id: 'wr09-rto-p99', kind: 'slo-latency', metric: 'p99', maxMs: 90, window: { fromSec: 15, toSec: 80 }, allowViolationPct: 2 },
      { id: 'wr09-rto-goodput', kind: 'throughput', minGoodputRps: 2950, window: { fromSec: 15, toSec: 80 } },
    ],
    sloDescriptions: {
      'wr09-rto-err': bi('Khôi phục RTO ≤ 7s sau sự cố vùng (tỉ lệ lỗi ≤ 1,0% từ t = 15..80s)', 'Regional failover RTO ≤ 7s (error rate ≤ 1.0% over t = 15..80s)'),
      'wr09-rto-p99': bi('Độ trễ vùng dự phòng p99 ≤ 90 ms từ t = 15..80s', 'Standby p99 ≤ 90 ms over t = 15..80s'),
      'wr09-rto-goodput': bi('Thông lượng thành công ≥ 2.950 req/s từ t = 15..80s', 'Sustained goodput ≥ 2,950 req/s over t = 15..80s'),
    },
    changeBudget: 2,
    mitigations: [
      {
        id: 'wr09-short-dns-ttl',
        label: bi('Hạ `dns.ttlSec` từ 600s xuống 5s cho bản ghi điều hướng đa vùng', 'Lower `dns.ttlSec` from 600s to 5s on multi-region failover record'),
        description: bi(
          'Giúp các bộ phân giải làm mới bản ghi trong vòng 5 giây kể từ khi vùng chính sập (hoàn tất chuyển vùng trước mốc t = 13s).',
          'Expires cached primary VIP records within 5 seconds of regional failure (completing DNS cutover by t = 13s).'
        ),
        targetBadge: 'dns.ttlSec = 5',
        cost: 1,
        changes: [{ type: 'knob', node: 'dns', key: 'ttlSec', value: 5 }],
      },
      {
        id: 'wr09-fast-lb-hc',
        label: bi('Siết `lb-standby.healthCheckSec` từ 45s xuống 3s tại vùng dự phòng', 'Tighten `lb-standby.healthCheckSec` from 45s to 3s in Standby region'),
        description: bi(
          'Đảm bảo Load Balancer dự phòng loại bỏ ngay instance lỗi `Standby App A` ở t = 11s, đưa 100% lưu lượng vào cụm 4 máy sống.',
          'Evicts crashed `Standby App A` by t = 11s so 100% of failover traffic lands on the healthy 4-instance pool.'
        ),
        targetBadge: 'lb-standby.healthCheckSec = 3',
        cost: 1,
        changes: [{ type: 'knob', node: 'lb-standby', key: 'healthCheckSec', value: 3 }],
      },
      {
        id: 'wr09-trap-scale-standby',
        label: bi('Tăng gấp đôi `Standby App Pool` từ 4 lên 8 instance (giữ nguyên DNS TTL 600s)', 'Double `Standby App Pool` from 4 to 8 instances (keep DNS TTL 600s)'),
        description: bi(
          'Bổ sung thêm máy chủ cho vùng dự phòng AZ-B.',
          'Provision extra compute capacity in Standby AZ-B.'
        ),
        targetBadge: 'app-b-live.replicas = 8',
        cost: 1,
        changes: [{ type: 'knob', node: 'app-b-live', key: 'replicas', value: 8 }],
        isTrap: true,
        trapWarning: bi(
          'Phương án chưa đúng nguyên nhân: Vùng dự phòng vốn đã dư sức chứa (7.200 > 3.000 req/s), nhưng 90% khách hàng vẫn đang giữ IP vùng chết do `dns.ttlSec = 600s`!',
          'Ineffective mitigation: Standby already has 7,200 req/s capacity, while 90% of clients remain stuck on the dead Primary IP due to `dns.ttlSec = 600s`!'
        ),
      },
      {
        id: 'wr09-trap-dns-only-medium',
        label: bi('Chỉ giảm vừa `dns.ttlSec` xuống 120s (2 phút) và giữ nguyên LB Health Check 45s', 'Lower `dns.ttlSec` to 120s (2 minutes) and keep 45s LB Health Check'),
        description: bi(
          'Giảm TTL từ 10 phút xuống 2 phút để tiết kiệm truy vấn DNS.',
          'Reduce DNS TTL from 10 minutes to 2 minutes.'
        ),
        targetBadge: 'dns.ttlSec = 120',
        cost: 1,
        changes: [{ type: 'knob', node: 'dns', key: 'ttlSec', value: 120 }],
        isTrap: true,
        trapWarning: bi(
          'Chưa đạt mục tiêu RTO: Với TTL 120 giây, dịch vụ vẫn ngừng hoạt động hoàn toàn suốt 2 phút (> cửa sổ 80 giây), vi phạm nghiêm trọng SLO sẵn sàng!',
          'Misses RTO target: a 120-second TTL still causes a full 2-minute regional blackout across the entire incident window!'
        ),
      },
    ],
    solutionMitigationIds: ['wr09-short-dns-ttl', 'wr09-fast-lb-hc'],
    postmortem: buildPostmortem({
      id: 'WR-09.PM',
      simId: 'WR-09/dns-ttl-failover',
      seekSec: 20,
      title: bi('Báo cáo Postmortem — WR-09: DNS TTL dài & Độ trễ Failover đa vùng', 'Postmortem Report — WR-09: Long DNS TTL & Multi-Region Failover RTO'),
      prompt: bi(
        'Đánh giá công thức tính RTO thực tế trong kiến trúc failover dựa trên DNS và giải pháp Anycast / Global Accelerator.',
        'Evaluate real-world RTO bounds under DNS-based failover and compare against Anycast / Global L4 routing.'
      ),
      explain: bi(
        'Thời gian khôi phục thực tế (RTO) không chỉ phụ thuộc vào việc vùng dự phòng đang chạy, mà bị chặn dưới bởi `max(DNS TTL, LB HealthCheck Interval)` cùng hành vi giữ kết nối/cache của client. Để đạt RTO cỡ giây, phải đặt TTL ngắn trước khi có sự cố, kiểm tra đồng bộ Health Check ở cả hai vùng và cân nhắc Anycast IP ở biên.',
        'Effective failover RTO is lower-bounded by `max(DNS TTL, LB HealthCheck)` plus client resolver/socket caching. Sub-10s RTO requires pre-configured low DNS TTLs, audited standby health checks, or Anycast edge routing.'
      ),
      questions: [
        {
          id: 'q1-root',
          type: 'single',
          weight: 30,
          prompt: bi('1. Vì sao đổi cấu hình DNS trên máy chủ Authoritative ngay lúc xảy ra sự cố vẫn không cứu được khách hàng nếu trước đó `ttlSec = 600`?', '1. Why doesn’t updating the Authoritative DNS record *during* an outage immediately rescue clients if `ttlSec` was 600s beforehand?'),
          options: [
            { id: 'a', text: bi('Vì các Recursive Resolver của ISP và trình duyệt đã lưu bản ghi cũ kèm `TTL = 600s` từ trước sự cố và sẽ không hỏi lại Authoritative DNS cho tới khi đếm ngược về 0.', 'Because ISP recursive resolvers and OS caches already stored the old IP with `TTL = 600s` prior to the crash and will not re-query until it expires.') },
            { id: 'b', text: bi('Vì giao thức UDP cổng 53 chỉ truyền được mỗi 10 phút một lần.', 'Because UDP port 53 only transmits packets once every 10 minutes.') },
            { id: 'c', text: bi('Vì vùng dự phòng AZ-B chưa khởi động máy chủ.', 'Because Standby AZ-B servers were powered off.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q2-contrib',
          type: 'single',
          weight: 20,
          prompt: bi('2. Sau khi đã hạ `dns.ttlSec = 5s`, yếu tố thứ hai nào ở vùng dự phòng vẫn gây lỗi ~50% suốt gần 1 phút nếu bị bỏ sót?', '2. Even after setting `dns.ttlSec = 5s`, what second misconfiguration in Standby caused ~50% errors for 45 seconds?'),
          options: [
            { id: 'a', text: bi('`lb-standby.healthCheckSec = 45s` chưa được kiểm toán đồng bộ với vùng chính, khiến LB dự phòng chậm loại bỏ instance `Standby App A` bị lỗi.', 'Unaudited `lb-standby.healthCheckSec = 45s` delayed eviction of the dead `Standby App A` backend.') },
            { id: 'b', text: bi('Thiếu bộ nhớ đệm CDN cho ảnh tĩnh.', 'Missing static image CDN cache.') },
            { id: 'c', text: bi('Số lượng instance sống (4 máy = 7.200 req/s) nhỏ hơn tải 3.000 req/s.', 'Healthy standby capacity (7,200 req/s) was smaller than 3,000 req/s load.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q3-fix',
          type: 'single',
          weight: 25,
          prompt: bi('3. Đánh đổi (trade-off) chính khi giảm `dns.ttlSec` từ 600s xuống 5–10s là gì, và xử lý ra sao cho các đợt bảo trì chủ động?', '3. What is the main trade-off of `dns.ttlSec = 5–10s`, and how is it handled for planned maintenance?'),
          options: [
            { id: 'a', text: bi('Tăng số lượng truy vấn lên Authoritative DNS và độ trễ phân giải lặp lại nhẹ; với failover tự động cần giữ TTL ngắn thường trực (5–30s), còn với bảo trì có lịch thì hạ TTL trước tối thiểu `2 × TTL_cũ`.', 'Higher authoritative DNS query volume and occasional lookup latency; keep 5–30s permanently on automated failover endpoints, or lower TTL at least `2 × old_TTL` before planned cutovers.') },
            { id: 'b', text: bi('Làm giảm một nửa băng thông của cơ sở dữ liệu SQL.', 'Halves SQL database disk throughput.') },
            { id: 'c', text: bi('Không cho phép sử dụng chứng chỉ HTTPS/TLS.', 'Prevents TLS certificate validation.') },
          ],
          correct: ['a'],
        },
        {
          id: 'q4-action',
          type: 'single',
          weight: 25,
          prompt: bi('4. Giải pháp kiến trúc mạng nào loại bỏ hoàn toàn sự phụ thuộc vào việc client/ISP tôn trọng DNS TTL khi chuyển vùng?', '4. Which edge networking architecture removes reliance on client/ISP DNS TTL caching during regional failover?'),
          options: [
            { id: 'a', text: bi('Đặt Anycast IP / Global Edge Proxy ở biên BGP để giữ nguyên một địa chỉ IP phía client và định tuyến lại gói tin ở tầng mạng/proxy sang vùng khỏe mạnh trong vài giây, kèm diễn tập GameDay định kỳ.', 'Use Anycast IPs / Global L4-L7 Edge Proxies so client IPs never change while backbone routing shifts traffic to healthy regions in seconds, verified by regular GameDay drills.') },
            { id: 'b', text: bi('Gửi email yêu cầu mọi người dùng tự xóa DNS cache trên máy tính.', 'Email end users asking them to flush their OS DNS cache manually.') },
            { id: 'c', text: bi('Đặt mọi máy chủ của cả hai vùng vào chung một tủ rack.', 'Co-locate Primary and Standby servers inside the same physical rack.') },
          ],
          correct: ['a'],
        },
      ],
    }),
  },
];

export function getWarRoomIncidentById(id: string): WarRoomIncident | undefined {
  return WAR_ROOM_INCIDENTS.find((inc) => inc.id === id);
}
