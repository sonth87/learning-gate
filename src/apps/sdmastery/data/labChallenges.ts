import { computeModelStaticCostPerHour } from '@/features/sysdesign-course/activities/grade';
import {
  effReplicas,
  evaluate,
  makeNode,
  SimModelError,
  simulate,
  validate,
  type Constraint,
  type ConstraintResult,
  type LoadProfile,
  type NodeId,
  type PrimitiveKind,
  type RunSeries,
  type SimScenario,
  type SystemModel,
  type TimedEvent,
  type TimeWindow,
} from '@/features/sysdesign-course/sim';
import {
  gridPositionsToCanvas,
  type CanvasPos,
  type GridPos,
} from '../components/lab/canvasGeometry';
import { LAB_EXTRA_CHALLENGES } from './labs';
import { checkDataFlowIntegrity, type IntegrityIssue } from './labIntegrity';

/** Kích thước vùng dùng bởi các preset (col 0..6, row 0..4). Canvas Phòng Lab là vô hạn — toạ độ có thể vượt / âm. */
export const LAB_GRID_COLS = 7;
export const LAB_GRID_ROWS = 5;

export type { GridPos, CanvasPos };

/** Preset được viết theo ô lưới cũ (dễ đọc) và chuyển sang toạ độ chấm khi nạp. */
const fromGrid = (positions: Record<NodeId, GridPos>): Record<NodeId, CanvasPos> =>
  gridPositionsToCanvas(positions);

export interface BiText {
  vi: string;
  en: string;
}

export interface LabCanvasPreset {
  model: SystemModel;
  /** Góc trên-trái thẻ theo đơn vị chấm (xem canvasGeometry). */
  positions: Record<NodeId, CanvasPos>;
  lockedNodeIds: NodeId[];
  load: LoadProfile;
  readRatio: number;
  durationSec: number;
}

export interface LabTopologyCheckSpec {
  id: string;
  label: BiText;
  check: (model: SystemModel) => {
    pass: boolean;
    got: BiText;
    want: BiText;
  };
}

export interface LabLabeledConstraint {
  constraint: Constraint;
  label: BiText;
}

export interface LabChallengeScenario {
  id: string;
  label: BiText;
  durationSec: number;
  load: LoadProfile;
  readRatio: number;
  clientTimeoutMs?: number;
  constraints: LabLabeledConstraint[];
  /** Kiểm tra mọi node SQL/NoSQL trong model không rơi vào overloaded/down. */
  dynamicDbNoOverload?: {
    window: TimeWindow;
    allowViolationPct?: number;
    label: BiText;
  };
  /**
   * Sự kiện cố định bơm vào mô phỏng (crash, slowdown…). Sự kiện nhắm tới node/link
   * không tồn tại trong thiết kế của người học sẽ bị bỏ qua (để không làm hỏng mô phỏng).
   */
  events?: TimedEvent[];
  /**
   * Tiêm sự cố vào node `kind` lớn nhất (nhiều instance nhất) đang nằm trên luồng xử lý,
   * bất kể người học đặt tên/id gì — dùng để kiểm thử failover (LAB-03). Nếu thiết kế chỉ
   * có MỘT node loại đó thì crash là mất toàn bộ tầng → kịch bản thất bại.
   */
  dynamicCrash?: {
    kind: PrimitiveKind;
    at: number;
    /** Giây tại đó node được khởi động lại; bỏ trống = chết tới hết mô phỏng. */
    recoverAtSec?: number;
  };
  /** Bơm sự kiện hot-key tự động vào các node NoSQL phân mảnh (dùng cho LAB-05). */
  dynamicHotKeyOnNosql?: {
    at: number;
    share: number;
    durationSec: number;
  };
}

/** Cấp độ bài Lab (nhóm trong bộ chọn bài). */
export type LabLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const LAB_LEVELS: readonly LabLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const LAB_LEVEL_META: Record<
  LabLevel,
  { label: BiText; difficulty: 1 | 2 | 3 | 4; xp: number }
> = {
  beginner: { label: { vi: 'Nhập môn', en: 'Beginner' }, difficulty: 1, xp: 30 },
  intermediate: { label: { vi: 'Trung cấp', en: 'Intermediate' }, difficulty: 2, xp: 40 },
  advanced: { label: { vi: 'Nâng cao', en: 'Advanced' }, difficulty: 3, xp: 50 },
  expert: { label: { vi: 'Chuyên gia', en: 'Expert' }, difficulty: 4, xp: 60 },
};

/** Bài học gốc (SystemDesignCore, `content/sysdesign/_source/sdc/…`) mà bài Lab chuyển thể / luyện tập. */
export interface LabSourceRef {
  /** Đường dẫn trong `_source/sdc/`, ví dụ `phase-2/lessons/lesson-2-caching.mdx`. */
  path: string;
  phase: number;
  title: BiText;
}

export interface LabChallengeSpec {
  id: string;
  code: string;
  level: LabLevel;
  /** Độ khó 1–4, luôn bằng `LAB_LEVEL_META[level].difficulty`. */
  difficulty: 1 | 2 | 3 | 4;
  /** XP cơ bản, luôn bằng `LAB_LEVEL_META[level].xp`. */
  xp: number;
  /** Thẻ khái niệm ngắn (song ngữ) hiển thị ở bộ chọn bài. */
  concepts: BiText[];
  /** Thời gian ước tính (phút). */
  estMinutes: number;
  sourceRef: LabSourceRef[];
  title: BiText;
  summary: BiText;
  prompt: BiText;
  hints: BiText[];
  starter: LabCanvasPreset;
  blank: LabCanvasPreset;
  referenceSolution: LabCanvasPreset;
  topology: LabTopologyCheckSpec[];
  scenarios: LabChallengeScenario[];
  structural: (LabLabeledConstraint & { requiredForPass: boolean })[];
  maxCostPerHour: number;
  parCostPerHour: number;
  explain: BiText;
}

export interface LabGradeRow {
  id: string;
  category: 'integrity' | 'topology' | 'slo' | 'structural' | 'cost';
  scenarioLabel?: BiText;
  label: BiText;
  required: boolean;
  pass: boolean;
  actual: BiText;
  target: BiText;
  worstAtSec?: number;
}

export interface LabGradeReport {
  challengeId: string;
  validModel: boolean;
  validationError?: BiText;
  passed: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  costPerHour: number;
  maxCostPerHour: number;
  parCostPerHour: number;
  rows: LabGradeRow[];
  summary: BiText;
}

const bi = (vi: string, en: string): BiText => ({ vi, en });

/** Tập hợp mọi node đi tới được từ `client` qua các kết nối xử lý (`sync | async | pull`). */
export function getReachableFromClient(model: SystemModel): Set<NodeId> {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [];
  for (const n of model.nodes) {
    if (n.kind === 'client' && n.params.enabled !== false) {
      visited.add(n.id);
      queue.push(n.id);
    }
  }
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const l of model.links) {
      if (l.from !== cur || l.mode === 'replicate') continue;
      const target = model.nodes.find((x) => x.id === l.to);
      if (!target || target.params.enabled === false) continue;
      if (!visited.has(l.to)) {
        visited.add(l.to);
        queue.push(l.to);
      }
    }
  }
  return visited;
}

function makeBlankPreset(
  load: LoadProfile,
  readRatio: number,
  durationSec = 60
): LabCanvasPreset {
  return {
    model: {
      nodes: [
        makeNode('client', {
          id: 'client',
          label: bi('Người dùng', 'Clients'),
          zone: 'internet',
        }),
      ],
      links: [],
      routes: { client: 'split' },
    },
    positions: fromGrid({
      client: { col: 0, row: 2 },
    }),
    lockedNodeIds: ['client'],
    load,
    readRatio,
    durationSec,
  };
}

/** Mẫu Sandbox tự do mở mặc định khi người học muốn thử nghiệm tự do. */
export const LAB_SANDBOX_PRESET: LabCanvasPreset = {
  model: {
    nodes: [
      makeNode('client', {
        id: 'client',
        label: bi('Người dùng', 'Clients'),
        zone: 'internet',
      }),
      makeNode('lb', {
        id: 'lb',
        label: bi('Load Balancer', 'Load Balancer'),
        zone: 'az-a',
      }),
      makeNode('service', {
        id: 'app-1',
        label: bi('API Service 1', 'API Service 1'),
        zone: 'az-a',
        replicas: 2,
        params: { replicas: 2 },
      }),
      makeNode('service', {
        id: 'app-2',
        label: bi('API Service 2', 'API Service 2'),
        zone: 'az-b',
        replicas: 2,
        params: { replicas: 2 },
      }),
      makeNode('cache', {
        id: 'cache',
        label: bi('Cache', 'Cache'),
        zone: 'az-a',
        params: {
          ttlSec: 300,
          ttlJitterPct: 0.15,
          capacityKeys: 100000,
          singleflight: true,
        },
      }),
      makeNode('sql', {
        id: 'db',
        label: bi('Primary SQL', 'Primary SQL'),
        zone: 'az-a',
        params: { sizeFactor: 1, poolSize: 16 },
      }),
    ],
    links: [
      {
        id: 'client-lb',
        from: 'client',
        to: 'lb',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 2000,
      },
      {
        id: 'lb-app1',
        from: 'lb',
        to: 'app-1',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 1200,
      },
      {
        id: 'lb-app2',
        from: 'lb',
        to: 'app-2',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 1200,
      },
      {
        id: 'app1-cache',
        from: 'app-1',
        to: 'cache',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 150,
      },
      {
        id: 'app2-cache',
        from: 'app-2',
        to: 'cache',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 150,
      },
      {
        id: 'cache-db',
        from: 'cache',
        to: 'db',
        mode: 'sync',
        carries: 'rw',
        timeoutMs: 800,
      },
    ],
    routes: {
      client: 'split',
      lb: 'split',
      'app-1': 'all-sequential',
      'app-2': 'all-sequential',
      cache: 'split',
    },
  },
  positions: fromGrid({
    client: { col: 0, row: 2 },
    lb: { col: 1, row: 2 },
    'app-1': { col: 3, row: 1 },
    'app-2': { col: 3, row: 3 },
    cache: { col: 4, row: 2 },
    db: { col: 6, row: 2 },
  }),
  lockedNodeIds: ['client'],
  load: { kind: 'steady', rps: 3200 },
  readRatio: 0.9,
  durationSec: 60,
};

export const LAB_BLANK_SANDBOX_PRESET: LabCanvasPreset = makeBlankPreset(
  { kind: 'steady', rps: 2000 },
  0.9,
  60
);

function requireReachableKinds(
  id: string,
  label: BiText,
  kinds: PrimitiveKind[],
  wantDesc: BiText
): LabTopologyCheckSpec {
  return {
    id,
    label,
    check: (model) => {
      const reach = getReachableFromClient(model);
      const matched = model.nodes.filter(
        (n) => reach.has(n.id) && kinds.includes(n.kind)
      );
      return {
        pass: matched.length > 0,
        got:
          matched.length > 0
            ? bi(
                `Đã nối (${matched.map((n) => n.label.vi).join(', ')})`,
                `Connected (${matched.map((n) => n.label.en).join(', ')})`
              )
            : bi('Chưa có trên luồng xử lý', 'Missing on active flow'),
        want: wantDesc,
      };
    },
  };
}

/** 5 bài toán thiết kế gốc (`design-constraint`) cho T7.1; catalog đầy đủ xem `LAB_CHALLENGES`. */
const LAB_CORE_CHALLENGES: LabChallengeSpec[] = [
  /* ───────────── 1. API ĐỌC NẶNG 5.000 RPS DƯỚI $3.00/GIỜ ───────────── */
  {
    id: 'lab-01-read-api',
    code: 'LAB-01',
    level: 'beginner',
    difficulty: 1,
    xp: 30,
    concepts: [bi('Cache read-through', 'Read-through cache'), bi('Load Balancer', 'Load Balancer'), bi('Scale ngang', 'Horizontal scaling')],
    estMinutes: 15,
    sourceRef: [
      { path: 'phase-2/lessons/lesson-2-caching.mdx', phase: 2, title: bi('Caching', 'Caching') },
      { path: 'phase-2/lessons/lesson-1-load-balancing.mdx', phase: 2, title: bi('Load Balancing', 'Load Balancing') },
    ],
    title: bi(
      'API đọc nặng 5.000 RPS dưới $3.00/giờ',
      '5,000 RPS Read-Heavy API Under $3.00/hr'
    ),
    summary: bi(
      'Kết hợp Load Balancer, nhân bản App Service và tầng Cache để phục vụ 5.000 RPS (90% đọc) với p99 ≤ 120 ms, lỗi ≤ 1% và chi phí ≤ $3.00/giờ.',
      'Combine Load Balancer, App Service replicas, and Cache to serve 5,000 RPS (90% read) at p99 ≤ 120 ms, error ≤ 1%, and cost ≤ $3.00/hr.'
    ),
    prompt: bi(
      'Hệ thống API danh mục sản phẩm nhận tải ổn định 5.000 RPS (90% đọc, 10% ghi). Bản khởi điểm chỉ nối thẳng Client → App → SQL nên cả tầng App lẫn SQL đều quá tải. Hãy bổ sung Load Balancer, tăng số instance tầng Service và đặt Cache giảm tải đọc cho SQL sao cho p99 ≤ 120 ms, tỉ lệ lỗi ≤ 1% và tổng chi phí không vượt $3.00/giờ.',
      'A product catalog API receives 5,000 RPS steady traffic (90% reads, 10% writes). The starter topology connects Client → App → SQL directly, overloading both tiers. Add a Load Balancer, scale Service replicas, and place a Cache ahead of SQL so p99 ≤ 120 ms, error rate ≤ 1%, and total cost stays ≤ $3.00/hr.'
    ),
    hints: [
      bi(
        'Một instance Service mặc định xử lý 1.800 RPS. 3 instance (5.400 RPS) về lý thuyết là đủ nhưng chạy sát ngưỡng; hãy dùng 4 instance (7.200 RPS) phía sau Load Balancer để có dư địa chống hàng đợi và chịu được khi mất 1 instance.',
        'One default Service instance handles 1,800 RPS. 3 instances (5,400 RPS) is the theoretical minimum but runs close to saturation; use 4 instances (7,200 RPS) behind a Load Balancer to keep headroom against queueing and to survive losing one instance.'
      ),
      bi(
        'Ở 90% đọc (4.500 RPS đọc + 500 RPS ghi), đặt Cache (ví dụ Redis, hit ~90%) theo mô hình read-through: App → Cache → SQL, đọc trúng cache thì trả ngay, trượt (miss) thì cache đi xuống SQL. Ghi cũng đi xuyên qua cache tới SQL (link mang "rw") nên SQL vẫn nhận đủ ~500 RPS ghi + ~450 RPS miss ≈ 950 RPS, thay vì 5.000 RPS. Không cần nâng cỡ máy SQL đắt đỏ. (Cache-aside, khi App tự gọi cả cache lẫn DB, là biến thể khác và không được mô hình hoá ở đây.)',
        'With 90% reads (4,500 read RPS + 500 write RPS), place a Cache (e.g. Redis, ~90% hit) as a read-through layer: App → Cache → SQL. Cache hits return immediately; misses are fetched from SQL by the cache. Writes also pass through the cache to SQL (the link carries "rw"), so SQL still sees all ~500 write RPS plus ~450 miss RPS ≈ 950 RPS instead of 5,000 RPS. No expensive vertical SQL scaling needed. (Cache-aside, where the app talks to both cache and DB itself, is a different variant not modeled here.)'
      ),
      bi(
        'Đặt TTL jitter ≥ 0.10 trên Cache và timeoutMs trên mọi đường nối sync để đạt thêm sao. Muốn 3 sao còn cần đi đúng mẫu khuyến nghị (Load Balancer + ≥ 4 instance + Cache) và giữ chi phí ≤ $1.65/giờ. Các thiết kế khác (ví dụ không dùng Load Balancer) vẫn có thể đạt bài nếu thỏa mọi SLO và ngân sách.',
        'Set TTL jitter ≥ 0.10 on the Cache and timeoutMs on all sync links to earn extra stars. 3 stars also need the recommended pattern (Load Balancer + ≥ 4 instances + Cache) and cost ≤ $1.65/hr. Other designs (e.g. no Load Balancer) can still pass if they meet every SLO and the budget.'
      ),
    ],
    starter: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người dùng', 'Clients'),
            zone: 'internet',
          }),
          makeNode('service', {
            id: 'app',
            label: bi('Catalog API', 'Catalog API'),
            zone: 'az-a',
            replicas: 2,
            params: { replicas: 2 },
          }),
          makeNode('sql', {
            id: 'db',
            label: bi('Catalog SQL', 'Catalog SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 12 },
          }),
        ],
        links: [
          {
            id: 'client-app',
            from: 'client',
            to: 'app',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'app-db',
            from: 'app',
            to: 'db',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          app: 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        app: { col: 3, row: 2 },
        db: { col: 5, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 5000 },
      readRatio: 0.9,
      durationSec: 60,
    },
    blank: makeBlankPreset({ kind: 'steady', rps: 5000 }, 0.9, 60),
    referenceSolution: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người dùng', 'Clients'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Load Balancer', 'Load Balancer'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'app',
            label: bi('Catalog API', 'Catalog API'),
            zone: 'az-a',
            replicas: 4,
            params: { replicas: 4 },
          }),
          makeNode('cache', {
            id: 'cache',
            label: bi('Cache', 'Cache'),
            zone: 'az-a',
            params: {
              ttlSec: 300,
              ttlJitterPct: 0.15,
              capacityKeys: 100000,
              singleflight: true,
            },
          }),
          makeNode('sql', {
            id: 'db',
            label: bi('Catalog SQL', 'Catalog SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'lb-app',
            from: 'lb',
            to: 'app',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'app-cache',
            from: 'app',
            to: 'cache',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 150,
          },
          {
            id: 'cache-db',
            from: 'cache',
            to: 'db',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          app: 'all-sequential',
          cache: 'split',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        app: { col: 3, row: 2 },
        cache: { col: 4, row: 2 },
        db: { col: 6, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 5000 },
      readRatio: 0.9,
      durationSec: 60,
    },
    topology: [
      requireReachableKinds(
        'topo-lb',
        bi('Có Load Balancer điều phối đầu vào', 'Has Load Balancer on ingress path'),
        ['lb'],
        bi('≥ 1 Load Balancer', '≥ 1 Load Balancer')
      ),
      {
        id: 'topo-service-replicas',
        label: bi('Tầng Service nhân bản (≥ 4 instances)', 'Scaled Service tier (≥ 4 instances)'),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const svcs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'service');
          const totalRep = svcs.reduce((acc, n) => acc + effReplicas(n), 0);
          return {
            pass: totalRep >= 4,
            got: bi(`${totalRep} instance`, `${totalRep} instances`),
            want: bi('≥ 4 instances', '≥ 4 instances'),
          };
        },
      },
      requireReachableKinds(
        'topo-cache',
        bi('Có tầng Cache giảm tải đọc', 'Has Cache tier offloading reads'),
        ['cache', 'cdn'],
        bi('≥ 1 Cache / CDN', '≥ 1 Cache / CDN')
      ),
      requireReachableKinds(
        'topo-sql',
        bi('Lưu trữ bền vững trên SQL Database', 'Persists data to SQL Database'),
        ['sql'],
        bi('≥ 1 SQL Database', '≥ 1 SQL Database')
      ),
    ],
    scenarios: [
      {
        id: 'steady-5k',
        label: bi('Tải đọc ổn định 5.000 RPS (90% đọc)', '5,000 RPS Steady Read Load (90% read)'),
        durationSec: 60,
        load: { kind: 'steady', rps: 5000 },
        readRatio: 0.9,
        clientTimeoutMs: 2000,
        constraints: [
          {
            label: bi('Độ trễ p99 ≤ 120 ms', 'Latency p99 ≤ 120 ms'),
            constraint: {
              id: 'p99-120',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 120,
              window: { fromSec: 5, toSec: 60 },
              allowViolationPct: 2,
            },
          },
          {
            label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
            constraint: {
              id: 'err-1pct',
              kind: 'slo-error',
              maxRate: 0.01,
              window: { fromSec: 5, toSec: 60 },
            },
          },
          {
            label: bi('Goodput ≥ 4.950 RPS', 'Goodput ≥ 4,950 RPS'),
            constraint: {
              id: 'goodput-4950',
              kind: 'throughput',
              minGoodputRps: 4950,
              window: { fromSec: 5, toSec: 60 },
            },
          },
        ],
      },
    ],
    structural: [
      {
        requiredForPass: false,
        label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
        constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
      },
      {
        requiredForPass: false,
        label: bi('Cache có TTL Jitter chống hết hạn đồng loạt', 'Cache sets TTL jitter against synchronized expiry'),
        constraint: { id: 'struct-jitter', kind: 'structural', rule: 'cache-has-jitter' },
      },
    ],
    maxCostPerHour: 3.0,
    parCostPerHour: 1.65,
    explain: bi(
      'Với 90% lưu lượng đọc ở 5.000 RPS, một Cache read-through (ví dụ Redis, hit ~90%) giảm tải đọc xuống SQL từ 4.500 RPS còn ~450 RPS (cộng 500 RPS ghi đi xuyên qua cache = ~950 RPS < 1.600 RPS của 1 máy SQL cơ bản). Kết hợp 4 instance Service sau Load Balancer, tổng chi phí chỉ ~$1.38/giờ (chuẩn 3★: ≤ $1.65/giờ, trần $3.00/giờ). Chỉ nâng cỡ SQL (scale-up) không đủ: SQL cỡ ×3 (4.800 RPS) vẫn thiếu so với 5.000 RPS mà đã tốn ~$3/giờ; read replica cũng đắt vì mỗi bản sao tính tiền như một máy SQL.',
      'With 90% reads at 5,000 RPS, a read-through Cache (e.g. Redis, ~90% hit) cuts SQL read traffic from 4,500 RPS to ~450 RPS (plus 500 write RPS passing through the cache = ~950 RPS < 1,600 RPS single SQL capacity). With 4 Service instances behind a Load Balancer the total cost is only ~$1.38/hr (3★ par ≤ $1.65/hr, hard cap $3.00/hr). Scaling SQL up alone is not enough: a ×3 SQL (4,800 RPS) still falls short of 5,000 RPS yet already costs ~$3/hr; read replicas are also expensive since each replica is billed like a SQL machine.'
    ),
  },

  /* ───────────── 2. FLASH SALE SPIKE 8.000 RPS KHÔNG LÀM SẬP DB ───────────── */
  {
    id: 'lab-02-flash-sale',
    code: 'LAB-02',
    level: 'intermediate',
    difficulty: 2,
    xp: 40,
    concepts: [bi('Queue + Worker', 'Queue + Worker'), bi('Load leveling', 'Load leveling'), bi('DLQ', 'DLQ')],
    estMinutes: 20,
    sourceRef: [
      { path: 'phase-2/lessons/lesson-4-message-queues-async-processing-decoupling-services.mdx', phase: 2, title: bi('Message Queue & xử lý bất đồng bộ', 'Message queues & async processing') },
      { path: 'phase-4/lessons/lesson-6-asynchronous-processin-queues.mdx', phase: 4, title: bi('Xử lý bất đồng bộ với Queue', 'Asynchronous processing with queues') },
    ],
    title: bi(
      'Flash Sale Spike 8.000 RPS không làm quá tải DB',
      '8,000 RPS Flash Sale Spike Without Overloading DB'
    ),
    summary: bi(
      'Hấp thụ đỉnh tải đột biến 8.000 RPS bằng hàng đợi bất đồng bộ (Queue + Worker + DLQ) kết hợp Cache để Database không rơi vào trạng thái overloaded và lỗi ≤ 2%.',
      'Absorb an 8,000 RPS flash-sale spike using async Queue + Worker + DLQ and caching so the Database never overloads and error rate stays ≤ 2%.'
    ),
    prompt: bi(
      'Chiến dịch Flash Sale đẩy lưu lượng từ 1.000 RPS vọt lên 8.000 RPS (65% đọc, 35% đặt đơn ghi). Ở bản khởi điểm, dù đã có Cache cho luồng đọc, 2.800 RPS ghi đồng bộ lúc đỉnh vẫn vượt ngưỡng 1.600 RPS của SQL và gây lỗi hàng loạt. Hãy tách luồng ghi qua Queue (bật DLQ) → Worker (chế độ pull) → SQL và đảm bảo tầng Service đủ năng lực tiếp nhận đỉnh tải với tỉ lệ lỗi ≤ 2%.\n\nĐánh đổi cần nhớ: ghi qua hàng đợi nghĩa là client chỉ nhận được xác nhận "đã tiếp nhận" (kiểu HTTP 202 Accepted, nhất quán cuối cùng), chứ chưa phải "đơn đã được ghi và xác nhận" ngay. Worker đọc hàng đợi theo cơ chế at-least-once nên có thể xử lý trùng một message; hãy thiết kế Worker idempotent (ví dụ khóa chống trùng theo mã đơn hàng).',
      'A Flash Sale spikes traffic from 1,000 RPS to 8,000 RPS (65% reads, 35% order writes). Even with a read Cache, 2,800 synchronous write RPS at peak overwhelms the 1,600 RPS SQL DB. Buffer writes via an async Queue (with DLQ enabled) → Worker (pull mode) → SQL and size the Service tier so error rate stays ≤ 2% and SQL never overloads.\n\nKey trade-off: writing through a queue means the client only gets an "accepted" acknowledgement (HTTP 202 Accepted style, eventual consistency), not an immediate "order stored and confirmed". Workers consume with at-least-once delivery, so the same message can be processed twice; make the Worker idempotent (e.g. a dedupe key per order id).'
    ),
    hints: [
      bi(
        'Để tách đọc và ghi tại tầng Service: cấu hình link Service → Cache mang "Chỉ đọc (r)", và thêm link Service → Queue (mode: async, mang "Chỉ ghi (w)" hoặc toàn bộ nếu không dùng Cache).',
        'To split reads and writes at the Service tier: set Service → Cache to carry reads ("r"), and add Service → Queue (mode: async, carries: "w").'
      ),
      bi(
        'Nối Queue → Worker bằng chế độ "pull" và nối Worker → SQL bằng "sync". Với 2 Worker instance (2 × 500 = 1.000 RPS ghi) cộng ~520 RPS cache miss đọc lúc đỉnh, SQL nhận ~1.520 RPS, vẫn dưới ngưỡng 1.600 RPS. Đỉnh ghi 2.800 RPS dồn lại trong Queue và được rút dần. Nâng SQL sizeFactor = 2 chỉ để dư tải thêm, nhưng tốn thêm khoảng $1.04/giờ.',
        'Connect Queue → Worker using mode "pull" and Worker → SQL using "sync". With 2 Worker instances (2 × 500 = 1,000 write RPS) plus ~520 read-miss RPS at peak, SQL receives ~1,520 RPS, still under the 1,600 RPS limit. The 2,800 RPS write peak piles up in the Queue and is drained steadily. Raising SQL sizeFactor to 2 only adds headroom, at roughly $1.04/hr extra.'
      ),
      bi(
        'Đừng quên tăng Service lên ≥ 5–6 instances (≥ 9.000 RPS) để không nghẽn ngay trước Queue, và bật Dead-Letter Queue (dlq = true) trên Queue. Vì ghi là bất đồng bộ, hãy đảm bảo Worker idempotent: một message có thể được giao lại (at-least-once).',
        'Scale Service to ≥ 5–6 instances (≥ 9,000 RPS) so requests do not drop before reaching the Queue, and enable Dead-Letter Queue (dlq = true) on the Queue. Because writes are asynchronous, make sure the Worker is idempotent: a message may be delivered more than once (at-least-once).'
      ),
    ],
    starter: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người mua Flash Sale', 'Flash Sale Buyers'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Load Balancer', 'Load Balancer'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'order-api',
            label: bi('Order API', 'Order API'),
            zone: 'az-a',
            replicas: 4,
            params: { replicas: 4 },
          }),
          makeNode('cache', {
            id: 'cache',
            label: bi('Stock Cache', 'Stock Cache'),
            zone: 'az-a',
            params: { ttlSec: 180, ttlJitterPct: 0.15, capacityKeys: 100000, singleflight: true },
          }),
          makeNode('sql', {
            id: 'db',
            label: bi('Order SQL', 'Order SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 2000,
          },
          {
            id: 'lb-api',
            from: 'lb',
            to: 'order-api',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'api-cache',
            from: 'order-api',
            to: 'cache',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 150,
          },
          {
            id: 'cache-db',
            from: 'cache',
            to: 'db',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'order-api': 'all-sequential',
          cache: 'split',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'order-api': { col: 2, row: 2 },
        cache: { col: 4, row: 1 },
        db: { col: 6, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'spike', base: 1000, peak: 8000, atSec: 12, holdSec: 10, riseSec: 3, fallSec: 5 },
      readRatio: 0.65,
      durationSec: 60,
    },
    blank: makeBlankPreset(
      { kind: 'spike', base: 1000, peak: 8000, atSec: 12, holdSec: 10, riseSec: 3, fallSec: 5 },
      0.65,
      60
    ),
    referenceSolution: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người mua Flash Sale', 'Flash Sale Buyers'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Load Balancer', 'Load Balancer'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'order-api',
            label: bi('Order API', 'Order API'),
            zone: 'az-a',
            replicas: 6,
            params: { replicas: 6 },
          }),
          makeNode('cache', {
            id: 'cache',
            label: bi('Stock Cache', 'Stock Cache'),
            zone: 'az-a',
            params: { ttlSec: 180, ttlJitterPct: 0.15, capacityKeys: 100000, singleflight: true },
          }),
          makeNode('queue', {
            id: 'order-queue',
            label: bi('Order Queue', 'Order Queue'),
            zone: 'az-a',
            params: { dlq: true, maxDepth: 100000 },
          }),
          makeNode('worker', {
            id: 'order-worker',
            label: bi('Order Worker', 'Order Worker'),
            zone: 'az-a',
            replicas: 2,
            params: { replicas: 2 },
          }),
          makeNode('sql', {
            id: 'db',
            label: bi('Order SQL', 'Order SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 2000,
          },
          {
            id: 'lb-api',
            from: 'lb',
            to: 'order-api',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'api-cache',
            from: 'order-api',
            to: 'cache',
            mode: 'sync',
            carries: 'r',
            timeoutMs: 150,
          },
          {
            id: 'cache-db',
            from: 'cache',
            to: 'db',
            mode: 'sync',
            carries: 'r',
            timeoutMs: 800,
          },
          {
            id: 'api-queue',
            from: 'order-api',
            to: 'order-queue',
            mode: 'async',
            carries: 'w',
          },
          {
            id: 'queue-worker',
            from: 'order-queue',
            to: 'order-worker',
            mode: 'pull',
            carries: 'w',
          },
          {
            id: 'worker-db',
            from: 'order-worker',
            to: 'db',
            mode: 'sync',
            carries: 'w',
            timeoutMs: 1000,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'order-api': 'all-sequential',
          cache: 'split',
          'order-worker': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'order-api': { col: 2, row: 2 },
        cache: { col: 4, row: 1 },
        'order-queue': { col: 3, row: 3 },
        'order-worker': { col: 5, row: 3 },
        db: { col: 6, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'spike', base: 1000, peak: 8000, atSec: 12, holdSec: 10, riseSec: 3, fallSec: 5 },
      readRatio: 0.65,
      durationSec: 60,
    },
    topology: [
      requireReachableKinds(
        'topo-db',
        bi('Có Database lưu trữ đơn hàng', 'Has persistent Database for orders'),
        ['sql', 'nosql'],
        bi('≥ 1 SQL / NoSQL Database', '≥ 1 SQL / NoSQL Database')
      ),
      {
        id: 'topo-async-pipeline',
        label: bi(
          'Có đường đệm bất đồng bộ Queue → Worker (pull) ghi xuống DB',
          'Has async Queue → Worker (pull) pipeline writing to DB'
        ),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const hasQueuePullWorker = model.links.some((l) => {
            if (l.mode !== 'pull' || !reach.has(l.from)) return false;
            const q = model.nodes.find((n) => n.id === l.from);
            const w = model.nodes.find((n) => n.id === l.to);
            if (!q || !w || q.kind !== 'queue' || w.kind !== 'worker') return false;
            return model.links.some((l2) => {
              if (l2.from !== w.id) return false;
              const target = model.nodes.find((n) => n.id === l2.to);
              return target?.kind === 'sql' || target?.kind === 'nosql';
            });
          });
          return {
            pass: hasQueuePullWorker,
            got: hasQueuePullWorker
              ? bi('Queue → Worker (pull) → DB', 'Queue → Worker (pull) → DB')
              : bi('Chưa nối Queue → Worker (pull) → DB', 'Missing Queue → Worker (pull) → DB'),
            want: bi('Queue → Worker (pull) → DB', 'Queue → Worker (pull) → DB'),
          };
        },
      },
    ],
    scenarios: [
      {
        id: 'flash-spike-8k',
        label: bi('Đỉnh Flash Sale 1.000 → 8.000 RPS (60s)', 'Flash Sale Spike 1,000 → 8,000 RPS (60s)'),
        durationSec: 60,
        load: { kind: 'spike', base: 1000, peak: 8000, atSec: 12, holdSec: 10, riseSec: 3, fallSec: 5 },
        readRatio: 0.65,
        clientTimeoutMs: 2000,
        dynamicDbNoOverload: {
          window: { fromSec: 0, toSec: 60 },
          allowViolationPct: 2,
          label: bi('Database không rơi vào trạng thái overloaded/down', 'Database never enters overloaded/down'),
        },
        constraints: [
          {
            label: bi('Tỉ lệ lỗi toàn cục ≤ 2,0%', 'Global error rate ≤ 2.0%'),
            constraint: {
              id: 'err-2pct',
              kind: 'slo-error',
              maxRate: 0.02,
              window: { fromSec: 0, toSec: 60 },
            },
          },
          {
            label: bi('Độ trễ phản hồi người dùng p99 ≤ 160 ms', 'Client response p99 ≤ 160 ms'),
            constraint: {
              id: 'p99-160',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 160,
              window: { fromSec: 0, toSec: 60 },
              allowViolationPct: 3,
            },
          },
          {
            label: bi('Goodput trung bình ≥ 2.150 RPS', 'Average goodput ≥ 2,150 RPS'),
            constraint: {
              id: 'goodput-spike',
              kind: 'throughput',
              minGoodputRps: 2150,
              window: { fromSec: 0, toSec: 60 },
            },
          },
        ],
      },
    ],
    structural: [
      {
        requiredForPass: true,
        label: bi('Queue bật Dead-Letter Queue (dlq = true)', 'Queue enables Dead-Letter Queue (dlq = true)'),
        constraint: { id: 'struct-dlq', kind: 'structural', rule: 'has-dlq' },
      },
      {
        requiredForPass: false,
        label: bi('Mọi kết nối sync có timeoutMs', 'All sync links configure timeoutMs'),
        constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
      },
    ],
    maxCostPerHour: 3.5,
    parCostPerHour: 2.3,
    explain: bi(
      'Khi lưu lượng ghi tăng vọt lên 2.800 RPS trong 10 giây, hàng đợi Queue hấp thụ phần chênh lệch và để cụm Worker (2 × 500 = 1.000 RPS) rút dần (load leveling) theo đúng nhịp chịu tải của SQL: ~1.520 RPS < 1.600 RPS. Tổng chi phí ~$1.90/giờ (chuẩn 3★ ≤ $2.30/giờ). Bật DLQ ngăn bản tin lỗi quay vòng làm nghẽn hàng đợi. Cái giá phải trả: client chỉ nhận xác nhận bất đồng bộ kiểu 202 Accepted (nhất quán cuối cùng) thay vì xác nhận đơn tức thì, và vì giao tin at-least-once nên Worker phải idempotent để không ghi trùng đơn.',
      'During the 10-second 2,800 write-RPS surge, the Queue absorbs the excess while Workers (2 × 500 = 1,000 RPS) drain at a steady rate that fits SQL capacity (load leveling): ~1,520 RPS < 1,600 RPS. Total cost is ~$1.90/hr (3★ par ≤ $2.30/hr). Enabling DLQ prevents poison messages from clogging the queue. The price: the client only gets an asynchronous 202-Accepted style acknowledgement (eventual consistency) instead of an immediate order confirmation, and because delivery is at-least-once the Worker must be idempotent so orders are not written twice.'
    ),
  },

  /* ───────────── 3. KIẾN TRÚC HIGH-AVAILABILITY KHÔNG CÓ SPOF ───────────── */
  {
    id: 'lab-03-zero-spof',
    code: 'LAB-03',
    level: 'advanced',
    difficulty: 3,
    xp: 50,
    concepts: [bi('Không SPOF', 'No SPOF'), bi('Multi-AZ', 'Multi-AZ'), bi('Diễn tập sự cố', 'Failure drill')],
    estMinutes: 25,
    sourceRef: [
      { path: 'phase-3/lessons/lesson-1-reality-of-distributed-systems.mdx', phase: 3, title: bi('Thực tế của hệ phân tán', 'Reality of distributed systems') },
      { path: 'phase-2/lessons/lesson-1-load-balancing.mdx', phase: 2, title: bi('Load Balancing', 'Load Balancing') },
    ],
    title: bi(
      'Kiến trúc High-Availability không có SPOF',
      'Zero-SPOF High-Availability Architecture'
    ),
    summary: bi(
      'Loại bỏ toàn bộ điểm lỗi đơn (no-spof), nhân bản Database (mode: replicate) và chứng minh bằng thử nghiệm sự cố: mất hẳn một cụm Service giữa chừng mà hệ thống vẫn phục vụ 3.000 RPS với p99 ≤ 150 ms.',
      'Eliminate all Single Points of Failure (no-spof), replicate the Database (mode: replicate), and prove it with a failure drill: lose an entire Service pool mid-run while still serving 3,000 RPS at p99 ≤ 150 ms.'
    ),
    prompt: bi(
      'Hệ thống thanh toán nội bộ chạy ở 3.000 RPS (85% đọc, 15% ghi) yêu cầu sẵn sàng cao: không tồn tại bất kỳ điểm lỗi đơn (SPOF) nào và mọi thành phần lưu trữ trạng thái đều phải có bản sao dự phòng. Hãy nâng cấp bản khởi điểm để đạt quy tắc cấu trúc no-spof + stateful-has-replica, giữ p99 ≤ 150 ms và tỉ lệ lỗi ≤ 1%.\n\nPhân tích tĩnh chưa đủ: bài còn có một kịch bản sự cố. Tại giây 20, một cụm Service (node Service lớn nhất trên luồng xử lý, tức một "miền lỗi" như một AZ) chết hoàn toàn và chỉ được khởi động lại ở giây 40. Trong thời gian đó lỗi phải ≤ 2% và goodput ≥ 2.850 RPS; sau khi phục hồi lỗi phải về ≤ 1%.',
      'An internal payment service running at 3,000 RPS (85% reads, 15% writes) requires High Availability: zero Single Points of Failure (SPOFs) and redundancy on every stateful component. Upgrade the starter architecture to pass no-spof + stateful-has-replica while keeping p99 ≤ 150 ms and error rate ≤ 1%.\n\nStatic analysis is not enough: there is also a failure drill. At second 20 one Service pool (the largest Service node on the active path, i.e. one "failure domain" such as an AZ) dies completely and is only restarted at second 40. During that time errors must stay ≤ 2% and goodput ≥ 2,850 RPS; after recovery errors must return to ≤ 1%.'
    ),
    hints: [
      bi(
        'SPOF (điểm lỗi đơn) là một thành phần mà nếu mất đi thì client bị cắt khỏi dữ liệu: mọi đường từ Client tới tầng lưu trữ đều phải đi qua nó và nó không có bản dự phòng. Vì vậy Load Balancer, Service và Cache (nếu dùng) đều cần replicas ≥ 2 hoặc có một nhánh song song thay thế.',
        'A SPOF (single point of failure) is a component whose loss disconnects clients from the data: every path from Client to storage goes through it and it has no redundant twin. So the Load Balancer, Service and Cache (if used) each need replicas ≥ 2 or a parallel alternative branch.'
      ),
      bi(
        'Trong mô phỏng, một node Service là MỘT miền lỗi: sự cố làm chết cả node, bất kể nó có bao nhiêu instance. Nên một node Service replicas = 3 vẫn sập hoàn toàn khi crash. Hãy chạy ≥ 2 cụm Service độc lập (ví dụ pay-svc-a ở az-a và pay-svc-b ở az-b), mỗi cụm đủ sức gánh một mình 3.000 RPS (≥ 2 instance = 3.600 RPS), cùng đứng sau Load Balancer.',
        'In the simulator a Service node is ONE failure domain: a crash takes down the whole node regardless of its instance count, so a single Service node with replicas = 3 still collapses completely. Run ≥ 2 independent Service pools (e.g. pay-svc-a in az-a and pay-svc-b in az-b), each able to carry the full 3,000 RPS alone (≥ 2 instances = 3,600 RPS), both behind the Load Balancer.'
      ),
      bi(
        'Với SQL Database: thêm một node SQL thứ hai (Replica SQL) và nối từ Primary SQL → Replica SQL bằng kết nối có mode = "replicate" để thỏa mãn stateful-has-replica và loại bỏ SPOF ở tầng dữ liệu.',
        'For SQL Database: add a second SQL node (Replica SQL) and connect Primary SQL → Replica SQL with mode = "replicate" to satisfy stateful-has-replica and eliminate the database SPOF.'
      ),
      bi(
        'Bạn có thể đặt Cache (replicas = 2) trước Primary SQL hoặc tách luồng đọc (carries = "r") sang Replica SQL để p99 luôn thấp dưới 150 ms mà chi phí vẫn gọn.',
        'Place a replicated Cache (replicas = 2) ahead of Primary SQL, or route read traffic (carries = "r") to Replica SQL to keep p99 well under 150 ms at low cost.'
      ),
    ],
    starter: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người dùng', 'Clients'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Load Balancer', 'Load Balancer'),
            zone: 'az-a',
            replicas: 1,
          }),
          makeNode('service', {
            id: 'pay-svc',
            label: bi('Payment Service', 'Payment Service'),
            zone: 'az-a',
            replicas: 1,
            params: { replicas: 1 },
          }),
          makeNode('sql', {
            id: 'db-primary',
            label: bi('Primary SQL', 'Primary SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 14 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'lb-svc',
            from: 'lb',
            to: 'pay-svc',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'svc-db',
            from: 'pay-svc',
            to: 'db-primary',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'pay-svc': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'pay-svc': { col: 3, row: 2 },
        'db-primary': { col: 5, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 3000 },
      readRatio: 0.85,
      durationSec: 60,
    },
    blank: makeBlankPreset({ kind: 'steady', rps: 3000 }, 0.85, 60),
    referenceSolution: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Người dùng', 'Clients'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('HA Load Balancer', 'HA Load Balancer'),
            zone: 'az-a',
            replicas: 2,
            params: { replicas: 2, algorithm: 'least-conn', healthCheckSec: 3 },
          }),
          makeNode('service', {
            id: 'pay-svc-a',
            label: bi('Payment Service (AZ-A)', 'Payment Service (AZ-A)'),
            zone: 'az-a',
            replicas: 2,
            params: { replicas: 2 },
          }),
          makeNode('service', {
            id: 'pay-svc-b',
            label: bi('Payment Service (AZ-B)', 'Payment Service (AZ-B)'),
            zone: 'az-b',
            replicas: 2,
            params: { replicas: 2 },
          }),
          makeNode('cache', {
            id: 'cache',
            label: bi('HA Cache', 'HA Cache'),
            zone: 'az-a',
            replicas: 2,
            params: {
              replicas: 2,
              ttlSec: 300,
              ttlJitterPct: 0.15,
              capacityKeys: 100000,
              singleflight: true,
            },
          }),
          makeNode('sql', {
            id: 'db-primary',
            label: bi('Primary SQL (AZ-A)', 'Primary SQL (AZ-A)'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
          makeNode('sql', {
            id: 'db-replica',
            label: bi('Standby SQL (AZ-B)', 'Standby SQL (AZ-B)'),
            zone: 'az-b',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'lb-svc-a',
            from: 'lb',
            to: 'pay-svc-a',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'lb-svc-b',
            from: 'lb',
            to: 'pay-svc-b',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'svc-a-cache',
            from: 'pay-svc-a',
            to: 'cache',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 150,
          },
          {
            id: 'svc-b-cache',
            from: 'pay-svc-b',
            to: 'cache',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 150,
          },
          {
            id: 'cache-db',
            from: 'cache',
            to: 'db-primary',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
          {
            id: 'db-repl',
            from: 'db-primary',
            to: 'db-replica',
            mode: 'replicate',
            carries: 'w',
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'pay-svc-a': 'all-sequential',
          'pay-svc-b': 'all-sequential',
          cache: 'split',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'pay-svc-a': { col: 3, row: 1 },
        'pay-svc-b': { col: 3, row: 3 },
        cache: { col: 4, row: 2 },
        'db-primary': { col: 5, row: 1 },
        'db-replica': { col: 5, row: 3 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 3000 },
      readRatio: 0.85,
      durationSec: 60,
    },
    topology: [
      {
        id: 'topo-service-pools',
        label: bi(
          'Tầng Service gồm ≥ 2 cụm độc lập ở các AZ khác nhau',
          'Service tier has ≥ 2 independent pools in different AZs'
        ),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const svcs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'service');
          const zones = new Set(svcs.map((n) => n.zone));
          return {
            pass: svcs.length >= 2 && zones.size >= 2,
            got: bi(
              `${svcs.length} cụm / ${zones.size} AZ`,
              `${svcs.length} pool(s) / ${zones.size} AZ(s)`
            ),
            want: bi('≥ 2 cụm ở ≥ 2 AZ', '≥ 2 pools in ≥ 2 AZs'),
          };
        },
      },
      requireReachableKinds(
        'topo-service',
        bi('Có tầng Service xử lý nghiệp vụ', 'Has Service tier on active path'),
        ['service'],
        bi('≥ 1 Service', '≥ 1 Service')
      ),
      requireReachableKinds(
        'topo-db',
        bi('Có Database bền vững trên luồng xử lý', 'Has persistent Database on active path'),
        ['sql', 'nosql'],
        bi('≥ 1 SQL / NoSQL Database', '≥ 1 SQL / NoSQL Database')
      ),
      {
        id: 'topo-db-replicate',
        label: bi(
          'Có kết nối nhân bản dữ liệu (mode: replicate) hoặc cụm DB ≥ 2 replicas',
          'Has DB replication link (mode: replicate) or DB replicas ≥ 2'
        ),
        check: (model) => {
          const hasReplLink = model.links.some((l) => l.mode === 'replicate');
          const dbMultiRep = model.nodes.some(
            (n) => (n.kind === 'sql' || n.kind === 'nosql') && effReplicas(n) >= 2
          );
          const ok = hasReplLink || dbMultiRep;
          return {
            pass: ok,
            got: hasReplLink
              ? bi('Đã cấu hình link replicate', 'Configured replicate link')
              : dbMultiRep
                ? bi('DB replicas ≥ 2', 'DB replicas ≥ 2')
                : bi('DB đơn lẻ (chưa nhân bản)', 'Single un-replicated DB'),
            want: bi('Link replicate hoặc replicas ≥ 2', 'Replicate link or replicas ≥ 2'),
          };
        },
      },
    ],
    scenarios: [
      {
        id: 'ha-steady-3k',
        label: bi('Tải sản xuất 3.000 RPS (85% đọc)', '3,000 RPS Production Traffic (85% read)'),
        durationSec: 60,
        load: { kind: 'steady', rps: 3000 },
        readRatio: 0.85,
        clientTimeoutMs: 2000,
        constraints: [
          {
            label: bi('Độ trễ p99 ≤ 150 ms', 'Latency p99 ≤ 150 ms'),
            constraint: {
              id: 'p99-150',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 150,
              window: { fromSec: 5, toSec: 60 },
              allowViolationPct: 2,
            },
          },
          {
            label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
            constraint: {
              id: 'err-1pct',
              kind: 'slo-error',
              maxRate: 0.01,
              window: { fromSec: 5, toSec: 60 },
            },
          },
          {
            label: bi('Goodput ≥ 2.970 RPS', 'Goodput ≥ 2,970 RPS'),
            constraint: {
              id: 'goodput-2970',
              kind: 'throughput',
              minGoodputRps: 2970,
              window: { fromSec: 5, toSec: 60 },
            },
          },
        ],
      },
      {
        id: 'ha-failover-drill',
        label: bi(
          'Sự cố: mất một cụm Service ở giây 20, khởi động lại ở giây 40',
          'Failure drill: lose one Service pool at 20s, restart at 40s'
        ),
        durationSec: 60,
        load: { kind: 'steady', rps: 3000 },
        readRatio: 0.85,
        clientTimeoutMs: 2000,
        dynamicCrash: { kind: 'service', at: 20, recoverAtSec: 40 },
        constraints: [
          {
            label: bi('Khi đang mất cụm (giây 24–40): lỗi ≤ 2%', 'While the pool is down (24–40s): error ≤ 2%'),
            constraint: {
              id: 'fo-err-during',
              kind: 'slo-error',
              maxRate: 0.02,
              window: { fromSec: 24, toSec: 40 },
            },
          },
          {
            label: bi('Khi đang mất cụm (giây 24–40): goodput ≥ 2.850 RPS', 'While the pool is down (24–40s): goodput ≥ 2,850 RPS'),
            constraint: {
              id: 'fo-goodput-during',
              kind: 'throughput',
              minGoodputRps: 2850,
              window: { fromSec: 24, toSec: 40 },
            },
          },
          {
            label: bi('Khi đang mất cụm (giây 24–40): p99 ≤ 250 ms', 'While the pool is down (24–40s): p99 ≤ 250 ms'),
            constraint: {
              id: 'fo-p99-during',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 250,
              window: { fromSec: 24, toSec: 40 },
              allowViolationPct: 5,
            },
          },
          {
            label: bi('Cả sự cố (giây 20–60): lỗi trung bình ≤ 5%', 'Whole incident (20–60s): average error ≤ 5%'),
            constraint: {
              id: 'fo-err-incident',
              kind: 'slo-error',
              maxRate: 0.05,
              window: { fromSec: 20, toSec: 60 },
            },
          },
          {
            label: bi('Sau phục hồi (giây 50–60): lỗi ≤ 1%', 'After recovery (50–60s): error ≤ 1%'),
            constraint: {
              id: 'fo-err-after',
              kind: 'slo-error',
              maxRate: 0.01,
              window: { fromSec: 50, toSec: 60 },
            },
          },
        ],
      },
    ],
    structural: [
      {
        requiredForPass: true,
        label: bi('Không còn điểm lỗi đơn (0 SPOF mức error)', 'Zero Single Points of Failure (no-spof)'),
        constraint: { id: 'struct-no-spof', kind: 'structural', rule: 'no-spof' },
      },
      {
        requiredForPass: true,
        label: bi('Mọi node stateful đều có replica dự phòng', 'Every stateful node has a replica'),
        constraint: { id: 'struct-stateful-rep', kind: 'structural', rule: 'stateful-has-replica' },
      },
      {
        requiredForPass: false,
        label: bi('Mọi kết nối sync đều đặt timeoutMs', 'All sync links set timeoutMs'),
        constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
      },
    ],
    maxCostPerHour: 3.6,
    parCostPerHour: 2.8,
    explain: bi(
      'Một kiến trúc High-Availability thực sự đòi hỏi loại bỏ điểm lỗi đơn ở MỌI tầng trên đường đi tới dữ liệu: cặp Load Balancer dự phòng (replicas ≥ 2), HAI cụm Service stateless độc lập ở hai AZ (mỗi cụm 2 instance = 3.600 RPS, đủ gánh một mình 3.000 RPS), Cache dự phòng và đường nhân bản Primary → Standby SQL (mode: replicate) sang AZ khác. Một node Service replicas = 3 vượt qua phân tích tĩnh nhưng sập hoàn toàn trong bài thử sự cố (lỗi ~100% khi cụm duy nhất chết), còn hai cụm thì cụm còn lại hấp thụ trọn tải: lỗi ~0% trong lúc mất cụm. Tổng chi phí ~$2.35/giờ (chuẩn 3★ ≤ $2.80/giờ). Lưu ý đây chưa kiểm thử mất Primary SQL (failover DB cần thêm cơ chế promote, ngoài phạm vi mô phỏng này).',
      'True High Availability requires removing single points of failure at EVERY hop on the path to the data: a redundant Load Balancer pair (replicas ≥ 2), TWO independent stateless Service pools in two AZs (2 instances each = 3,600 RPS, enough to carry 3,000 RPS alone), a redundant Cache, and Primary → Standby SQL replication (mode: replicate) across AZs. A single Service node with replicas = 3 passes static analysis but collapses completely in the failure drill (~100% errors when the only pool dies), whereas with two pools the survivor absorbs the full load: ~0% errors while a pool is down. Total cost is ~$2.35/hr (3★ par ≤ $2.80/hr). Note that losing the Primary SQL is not drilled here (DB failover needs a promotion mechanism outside this simulation).'
    ),
  },

  /* ───────────── 4. BẢO VỆ ORIGIN TOÀN CẦU VỚI CDN & RATE LIMITER ───────────── */
  {
    id: 'lab-04-edge-shield',
    code: 'LAB-04',
    level: 'intermediate',
    difficulty: 2,
    xp: 40,
    concepts: [bi('CDN', 'CDN'), bi('Rate limiting', 'Rate limiting'), bi('Bảo vệ origin', 'Origin shielding')],
    estMinutes: 20,
    sourceRef: [
      { path: 'phase-4/lessons/lesson-3-cdn-and-edge-computing-distributed-cache-gan-user.mdx', phase: 4, title: bi('CDN & Edge', 'CDN & edge computing') },
      { path: 'phase-4/lessons/lesson-5-rate-limiting-and-load-control.mdx', phase: 4, title: bi('Rate limiting & kiểm soát tải', 'Rate limiting & load control') },
    ],
    title: bi(
      'Bảo vệ Origin toàn cầu với CDN & Rate Limiter',
      'Global Origin Shielding with CDN & Rate Limiter'
    ),
    summary: bi(
      'Phục vụ 12.000 RPS toàn cầu (95% đọc) nhờ CDN Edge kết hợp Rate Limiter bảo vệ Origin trước đợt tăng đột biến 22.000 RPS.',
      'Serve 12,000 RPS global read-heavy traffic (95% reads) with an Edge CDN and protect the Origin with a Rate Limiter against 22,000 RPS traffic bursts.'
    ),
    prompt: bi(
      'Cổng tin tức sự kiện toàn cầu có tải thường trực 12.000 RPS (95% đọc nội dung, 5% bình luận ghi) và thỉnh thoảng hứng đợt truy cập dồn dập 22.000 RPS từ bot. Bản khởi điểm đẩy toàn bộ 12.000 RPS thẳng về Origin khiến cả App lẫn SQL quá tải nặng. Hãy đặt CDN hấp thụ luồng đọc ở biên và cấu hình Rate Limiter ngay cửa ngõ để đạt 12.000 RPS bình thường (p99 ≤ 95 ms, lỗi ≤ 1%) đồng thời giữ SQL Origin không bao giờ bị overloaded trong kịch bản đột biến 22.000 RPS.\n\nLưu ý về thực tế: một ngưỡng rate limit toàn cục ~1.500 RPS đặt sau CDN thực chất là "load shedding" (xả tải để tự vệ): khi bot dồn dập, nó cũng từ chối cả người dùng thật chia sẻ cùng ngưỡng đó. Hệ thống thật giới hạn theo từng client / IP / token, kết hợp nhận diện bot và WAF để chặn đúng đối tượng. Ngoài ra bot thường thêm tham số ngẫu nhiên để "phá cache" (cache-busting), nên tỉ lệ trúng CDN (95%) trong lúc bị tấn công là con số lạc quan. Bài này mô hình hoá bản giản lược để bạn luyện tư duy bảo vệ Origin.',
      'A global news portal serves 12,000 RPS baseline traffic (95% content reads, 5% comment writes) and faces 22,000 RPS bot bursts. The starter routes all 12,000 RPS directly to Origin, overloading App and SQL. Add a CDN to absorb edge reads and a Rate Limiter at the edge/origin boundary so normal 12,000 RPS hits p99 ≤ 95 ms & error ≤ 1%, while Origin SQL never overloads during the 22,000 RPS burst.\n\nReality check: a single global rate limit of ~1,500 RPS behind the CDN is really load shedding: during a bot burst it also rejects real users who share that same budget. Real systems rate-limit per client / IP / token and combine bot detection with a WAF to block the right actors. Bots also tend to cache-bust (random query strings), so a 95% CDN hit ratio during an attack is optimistic. This lab models a simplified version so you can practice protecting the Origin.'
    ),
    hints: [
      bi(
        'Ở 12.000 RPS (95% đọc = 11.400 RPS đọc + 600 RPS ghi), CDN mặc định (hitRatioMax = 95%) giữ lại ~10.830 RPS ngay tại biên và chỉ chuyển ~1.170 RPS (570 miss + 600 ghi) về phía Origin.',
        'At 12,000 RPS (95% reads = 11,400 read + 600 write RPS), a CDN (95% hit) serves ~10,830 RPS at the edge and forwards only ~1,170 RPS (570 misses + 600 writes) to Origin.'
      ),
      bi(
        'Đặt Rate Limiter ngay sau CDN (Client → CDN → Rate Limiter → LB → App → SQL) với ratePerSec ≈ 1.400–1.550 RPS (hoặc đặt trước CDN với ratePerSec ≈ 13.500 RPS): ở 12.000 RPS bình thường không có request nào bị chặn, còn khi vọt lên 22.000 RPS thì Rate Limiter kẹp lưu lượng trước khi chạm ngưỡng 1.600 RPS của SQL!',
        'Place a Rate Limiter right after CDN (ratePerSec ≈ 1,400–1,550 RPS) or right after Client (ratePerSec ≈ 13,500 RPS): normal 12,000 RPS passes with 0% throttling, while the 22,000 RPS burst is capped before SQL (1,600 RPS) can overload!'
      ),
      bi(
        'Để thỏa quy tắc cấu trúc has-rate-limit, Rate Limiter (hoặc Gateway) phải nằm trong 2 chặng đầu tiên tính từ Client.',
        'To satisfy structural rule has-rate-limit, place the Rate Limiter (or Gateway) within the first 2 hops from Client.'
      ),
      bi(
        'Thực tế hơn mô hình: ngưỡng ~1.500 RPS dùng chung chỉ là load shedding, khi bot bùng nổ nó cũng làm rớt người dùng thật. Hệ thống thật giới hạn theo client/IP/token, dùng bot detection + WAF, và coi tỉ lệ trúng CDN lúc bị tấn công (bot hay cache-bust) là thấp hơn 95%. Bài vẫn giải được theo mô hình đã cho.',
        'More realistic than the model: one shared ~1,500 RPS threshold is plain load shedding and also drops real users when bots surge. Real systems limit per client/IP/token, use bot detection + WAF, and assume a lower-than-95% CDN hit ratio under attack (bots cache-bust). The challenge remains solvable as modeled.'
      ),
    ],
    starter: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Độc giả toàn cầu', 'Global Readers'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Origin LB', 'Origin LB'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'cms-api',
            label: bi('CMS Origin API', 'CMS Origin API'),
            zone: 'az-a',
            replicas: 3,
            params: { replicas: 3 },
          }),
          makeNode('sql', {
            id: 'origin-db',
            label: bi('Origin SQL', 'Origin SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 2000,
          },
          {
            id: 'lb-cms',
            from: 'lb',
            to: 'cms-api',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'cms-db',
            from: 'cms-api',
            to: 'origin-db',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'cms-api': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 2, row: 2 },
        'cms-api': { col: 4, row: 2 },
        'origin-db': { col: 6, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 12000 },
      readRatio: 0.95,
      durationSec: 60,
    },
    blank: makeBlankPreset({ kind: 'steady', rps: 12000 }, 0.95, 60),
    referenceSolution: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Độc giả toàn cầu', 'Global Readers'),
            zone: 'internet',
          }),
          makeNode('cdn', {
            id: 'edge-cdn',
            label: bi('Edge CDN', 'Edge CDN'),
            zone: 'az-a',
            params: {
              ttlSec: 300,
              ttlJitterPct: 0.15,
              hitRatioMax: 0.95,
              capacityKeys: 100000,
              singleflight: true,
            },
          }),
          makeNode('rate-limiter', {
            id: 'origin-rl',
            label: bi('Origin Rate Limiter', 'Origin Rate Limiter'),
            zone: 'az-a',
            params: { ratePerSec: 1500, burst: 300 },
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Origin LB', 'Origin LB'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'cms-api',
            label: bi('CMS Origin API', 'CMS Origin API'),
            zone: 'az-a',
            replicas: 2,
            params: { replicas: 2 },
          }),
          makeNode('sql', {
            id: 'origin-db',
            label: bi('Origin SQL', 'Origin SQL'),
            zone: 'az-a',
            params: { sizeFactor: 1, poolSize: 16 },
          }),
        ],
        links: [
          {
            id: 'client-cdn',
            from: 'client',
            to: 'edge-cdn',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'cdn-rl',
            from: 'edge-cdn',
            to: 'origin-rl',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'rl-lb',
            from: 'origin-rl',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'lb-cms',
            from: 'lb',
            to: 'cms-api',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1000,
          },
          {
            id: 'cms-db',
            from: 'cms-api',
            to: 'origin-db',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          'edge-cdn': 'split',
          'origin-rl': 'all-sequential',
          lb: 'split',
          'cms-api': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        'edge-cdn': { col: 1, row: 2 },
        'origin-rl': { col: 2, row: 2 },
        lb: { col: 3, row: 2 },
        'cms-api': { col: 4, row: 2 },
        'origin-db': { col: 6, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 12000 },
      readRatio: 0.95,
      durationSec: 60,
    },
    topology: [
      requireReachableKinds(
        'topo-cdn',
        bi('Có CDN hấp thụ lưu lượng đọc ở biên', 'Has Edge CDN absorbing read traffic'),
        ['cdn'],
        bi('≥ 1 CDN', '≥ 1 CDN')
      ),
      requireReachableKinds(
        'topo-rl',
        bi('Có Rate Limiter kiểm soát tốc độ truy cập', 'Has Rate Limiter controlling admission rate'),
        ['rate-limiter'],
        bi('≥ 1 Rate Limiter', '≥ 1 Rate Limiter')
      ),
      requireReachableKinds(
        'topo-origin-svc',
        bi('Có tầng Origin Service xử lý miss & ghi', 'Has Origin Service handling misses & writes'),
        ['service'],
        bi('≥ 1 Service', '≥ 1 Service')
      ),
      requireReachableKinds(
        'topo-origin-db',
        bi('Có Origin Database lưu trữ dữ liệu gốc', 'Has Origin Database storing source of truth'),
        ['sql', 'nosql'],
        bi('≥ 1 SQL / NoSQL Database', '≥ 1 SQL / NoSQL Database')
      ),
    ],
    scenarios: [
      {
        id: 'normal-global-12k',
        label: bi('Tải toàn cầu chuẩn 12.000 RPS (95% đọc)', '12,000 RPS Normal Global Load (95% read)'),
        durationSec: 60,
        load: { kind: 'steady', rps: 12000 },
        readRatio: 0.95,
        clientTimeoutMs: 2000,
        constraints: [
          {
            label: bi('Độ trễ p99 ≤ 95 ms', 'Latency p99 ≤ 95 ms'),
            constraint: {
              id: 'p99-95',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 95,
              window: { fromSec: 5, toSec: 60 },
              allowViolationPct: 2,
            },
          },
          {
            label: bi('Tỉ lệ lỗi ở tải chuẩn ≤ 1,0%', 'Baseline error rate ≤ 1.0%'),
            constraint: {
              id: 'err-1pct',
              kind: 'slo-error',
              maxRate: 0.01,
              window: { fromSec: 5, toSec: 60 },
            },
          },
          {
            label: bi('Goodput ≥ 11.850 RPS', 'Goodput ≥ 11,850 RPS'),
            constraint: {
              id: 'goodput-11850',
              kind: 'throughput',
              minGoodputRps: 11850,
              window: { fromSec: 5, toSec: 60 },
            },
          },
        ],
      },
      {
        id: 'bot-burst-22k',
        label: bi('Đợt đột biến Bot 22.000 RPS (bảo vệ Origin DB)', '22,000 RPS Bot Burst (Origin DB protection)'),
        durationSec: 60,
        load: { kind: 'spike', base: 12000, peak: 22000, atSec: 15, holdSec: 15, riseSec: 2, fallSec: 4 },
        readRatio: 0.95,
        clientTimeoutMs: 2000,
        dynamicDbNoOverload: {
          window: { fromSec: 0, toSec: 60 },
          allowViolationPct: 2,
          label: bi('Origin Database không bị overloaded dưới đợt burst 22k RPS', 'Origin Database never overloads during 22k RPS burst'),
        },
        constraints: [
          {
            label: bi('Duy trì Goodput ≥ 11.500 RPS suốt đợt burst', 'Sustains Goodput ≥ 11,500 RPS across burst'),
            constraint: {
              id: 'burst-goodput',
              kind: 'throughput',
              minGoodputRps: 11500,
              window: { fromSec: 0, toSec: 60 },
            },
          },
        ],
      },
    ],
    structural: [
      {
        requiredForPass: true,
        label: bi('Có Rate Limiter/Gateway trong 2 chặng đầu từ Client', 'Has Rate Limiter/Gateway within 2 hops of Client'),
        constraint: { id: 'struct-rl', kind: 'structural', rule: 'has-rate-limit' },
      },
      {
        requiredForPass: false,
        label: bi('CDN/Cache bật TTL Jitter chống đồng bộ TTL', 'CDN/Cache configures TTL jitter'),
        constraint: { id: 'struct-jitter', kind: 'structural', rule: 'cache-has-jitter' },
      },
    ],
    maxCostPerHour: 2.4,
    parCostPerHour: 1.4,
    explain: bi(
      'CDN giúp xử lý 95% lượt đọc ngay tại Edge với chi phí rất thấp ($0.10/giờ) và độ trễ ~1 ms. Đặt thêm Token Bucket Rate Limiter với ngưỡng khớp năng lực Origin (~1.500 RPS sau CDN) đảm bảo lưu lượng hợp lệ 12.000 RPS đi qua trọn vẹn, còn lưu lượng dư thừa lúc burst bị từ chối sớm (HTTP 429) thay vì làm nghẽn SQL. Tổng chi phí ~$1.15/giờ (chuẩn 3★ ≤ $1.40/giờ). Lưu ý thực tế: đây là load shedding dùng chung một ngưỡng, nên lúc bot bùng nổ người dùng thật cũng bị từ chối theo; hệ thống thật giới hạn theo client/IP/token, bổ sung bot detection + WAF, và không nên tin vào hit ratio 95% khi bot cache-bust.',
      'An Edge CDN serves 95% of reads in ~1 ms at $0.10/hr. Pairing it with a Token Bucket Rate Limiter tuned to Origin capacity (~1,500 RPS post-CDN) passes 100% of normal 12,000 RPS traffic while shedding excess burst load via fast HTTP 429s before SQL saturates. Total cost is ~$1.15/hr (3★ par ≤ $1.40/hr). Real-world caveat: this is load shedding on one shared threshold, so during a bot surge real users are rejected too; production systems rate-limit per client/IP/token, add bot detection + WAF, and should not trust a 95% hit ratio when bots cache-bust.'
    ),
  },

  /* ───────────── 5. TẦNG LƯU TRỮ PHÂN MẢNH 10.000 RPS GHI/ĐỌC ───────────── */
  {
    id: 'lab-05-sharded-store',
    code: 'LAB-05',
    level: 'advanced',
    difficulty: 3,
    xp: 50,
    concepts: [bi('Sharding', 'Sharding'), bi('Khóa nóng', 'Hot key'), bi('Key salting', 'Key salting')],
    estMinutes: 25,
    sourceRef: [
      { path: 'phase-4/lessons/lesson-4-database-scaling-optimization.mdx', phase: 4, title: bi('Mở rộng & tối ưu Database', 'Database scaling & optimization') },
      { path: 'phase-2/lessons/lesson-3-database.mdx', phase: 2, title: bi('Database', 'Database') },
    ],
    title: bi(
      'Tầng lưu trữ phân mảnh 10.000 RPS ghi/đọc',
      '10,000 RPS Read/Write Sharded Storage Tier'
    ),
    summary: bi(
      'Thay SQL đơn lẻ bằng NoSQL phân mảnh để chịu 10.000 RPS (55% ghi, 45% đọc), rồi xử lý đúng khóa nóng: sharding chỉ chia đều phần tải nền, còn khóa nóng cần chia nhỏ (key salting), cache đọc nóng hoặc cô lập.',
      'Replace single-node SQL with a sharded NoSQL store to sustain 10,000 RPS (55% writes, 45% reads), then handle the hot key properly: sharding only spreads the uniform load, while a hot key needs splitting (key salting), a read cache, or isolation.'
    ),
    prompt: bi(
      'Hệ thống thu thập telemetry IoT và trạng thái thiết bị nhận tải liên tục 10.000 RPS với tỉ lệ ghi chiếm 55% (5.500 RPS ghi + 4.500 RPS đọc). Từ giây 10, một khóa nóng (ví dụ một tenant/thiết bị "ồn ào") chiếm tới 80% lưu lượng chạm vào tầng lưu trữ. Vì lưu lượng ghi quá lớn, chỉ thêm Cache hay nâng cỡ SQL đơn lẻ (tối đa 6.400 RPS) đều không đủ. Hãy thiết kế cụm Service stateless (≥ 7 instances phía sau LB) kết hợp tầng lưu trữ NoSQL phân mảnh để đạt p99 ≤ 110 ms và tỉ lệ lỗi ≤ 1%.\n\nĐiểm mấu chốt: sharding chỉ chia đều phần tải "nền". Một khóa nóng luôn được băm vào ĐÚNG MỘT shard, nên thêm shard không làm shard đó bớt nóng. Hệ thống thật xử lý khóa nóng bằng key salting / chia nhỏ khóa (ghi rải ra nhiều khóa con), cache phía trước cho đọc nóng, gom/batch ghi (write coalescing) hoặc cô lập tenant nóng sang phân vùng riêng.',
      'An IoT telemetry ingestion & state platform receives 10,000 RPS continuous traffic with 55% writes (5,500 write RPS + 4,500 read RPS). From second 10 a hot key (e.g. one noisy tenant/device) accounts for 80% of the traffic reaching the store. Because writes dominate, read caching or vertical SQL scaling (max 6,400 RPS) alone cannot keep up. Design a stateless Service pool (≥ 7 instances behind an LB) backed by a sharded NoSQL store achieving p99 ≤ 110 ms and error rate ≤ 1%.\n\nKey insight: sharding only spreads the uniform "background" load. A hot key always hashes to EXACTLY ONE shard, so adding shards does not cool that shard down. Real systems handle hot keys with key salting / key splitting (spread writes over many sub-keys), a cache in front for hot reads, write coalescing/batching, or isolating the hot tenant on its own partition.'
    ),
    hints: [
      bi(
        'Một Load Balancer mặc định chịu được 20.000 RPS. Phía sau LB, tầng Service cần ít nhất 7–8 instances (8 × 1.800 = 14.400 RPS) để phục vụ mượt 10.000 RPS mà không tạo hàng đợi.',
        'A default Load Balancer handles 20,000 RPS. Behind it, provision 7–8 stateless Service instances (8 × 1,800 = 14,400 RPS) to process 10,000 RPS with minimal queueing.'
      ),
      bi(
        'Thay SQL bằng node NoSQL phân mảnh (≥ 4 shard) để chịu 10.000 RPS. Nhưng hãy tính shard nóng: một shard xử lý tối đa ~8.000 RPS, và với khóa nóng 80% thì shard đó nhận ≥ 80% × 10.000 = 8.000 RPS dù bạn có 6 hay 12 shard (6 shard: ~8.333 RPS, ρ ≈ 1,04; 12 shard: ~8.167 RPS). Thêm shard chỉ rút phần tải nền 20% còn lại, không hạ được tải của shard nóng.',
        'Replace SQL with a sharded NoSQL node (≥ 4 shards) to carry 10,000 RPS. But do the hot-shard math: one shard handles at most ~8,000 RPS, and with an 80% hot key that shard receives ≥ 80% × 10,000 = 8,000 RPS whether you run 6 or 12 shards (6 shards: ~8,333 RPS, ρ ≈ 1.04; 12 shards: ~8,167 RPS). More shards only thin out the remaining 20% background load; they cannot cool the hot shard.'
      ),
      bi(
        'Cách thực sự giảm tải shard nóng: (1) key salting: đặt hotKeySalt = N trên node NoSQL để chia khóa nóng thành N khóa con rải trên N shard (6 shard + salt 4: shard nóng chỉ còn ~2.333 RPS, ρ ≈ 0,29), đổi lại đọc khóa đó phải gom từ N khóa con (scatter-gather, mô phỏng chỉ tính phần giảm tải); (2) đặt Cache phía trước hút đọc nóng; (3) gom/batch ghi (write coalescing); (4) cô lập tenant nóng sang phân vùng riêng.',
        'What actually cools the hot shard: (1) key salting: set hotKeySalt = N on the NoSQL node to split the hot key into N sub-keys spread across N shards (6 shards + salt 4: the hot shard drops to ~2,333 RPS, ρ ≈ 0.29), at the cost of reads of that key needing a scatter-gather over N sub-keys (the simulator only models the load relief); (2) a Cache in front absorbing hot reads; (3) write coalescing/batching; (4) isolating the hot tenant on its own partition.'
      ),
      bi(
        'Đảm bảo mọi kết nối đồng bộ đều có timeoutMs hợp lý để đạt thêm điểm cấu trúc và giữ ngân sách ≤ $1.60/giờ (chuẩn 3 sao). Thiết kế khác (ví dụ dùng Cache thay vì salting) vẫn đạt bài nếu qua mọi SLO.',
        'Ensure all sync links configure timeoutMs and keep cost ≤ $1.60/hr (3-star par). Other designs (e.g. a Cache instead of salting) still pass if they meet every SLO.'
      ),
    ],
    starter: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Thiết bị IoT', 'IoT Devices'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Ingestion LB', 'Ingestion LB'),
            zone: 'az-a',
          }),
          makeNode('service', {
            id: 'ingest-svc',
            label: bi('Telemetry API', 'Telemetry API'),
            zone: 'az-a',
            replicas: 3,
            params: { replicas: 3 },
          }),
          makeNode('sql', {
            id: 'legacy-sql',
            label: bi('Legacy SQL', 'Legacy SQL'),
            zone: 'az-a',
            params: { sizeFactor: 2, poolSize: 24 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'lb-svc',
            from: 'lb',
            to: 'ingest-svc',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1000,
          },
          {
            id: 'svc-sql',
            from: 'ingest-svc',
            to: 'legacy-sql',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 800,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'ingest-svc': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'ingest-svc': { col: 3, row: 2 },
        'legacy-sql': { col: 5, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 10000 },
      readRatio: 0.45,
      durationSec: 60,
    },
    blank: makeBlankPreset({ kind: 'steady', rps: 10000 }, 0.45, 60),
    referenceSolution: {
      model: {
        nodes: [
          makeNode('client', {
            id: 'client',
            label: bi('Thiết bị IoT', 'IoT Devices'),
            zone: 'internet',
          }),
          makeNode('lb', {
            id: 'lb',
            label: bi('Ingestion LB', 'Ingestion LB'),
            zone: 'az-a',
            params: { algorithm: 'least-conn', healthCheckSec: 3 },
          }),
          makeNode('service', {
            id: 'ingest-svc-1',
            label: bi('Telemetry Pool A', 'Telemetry Pool A'),
            zone: 'az-a',
            replicas: 4,
            params: { replicas: 4 },
          }),
          makeNode('service', {
            id: 'ingest-svc-2',
            label: bi('Telemetry Pool B', 'Telemetry Pool B'),
            zone: 'az-b',
            replicas: 4,
            params: { replicas: 4 },
          }),
          makeNode('nosql', {
            id: 'telemetry-nosql',
            label: bi('Sharded NoSQL', 'Sharded NoSQL'),
            zone: 'az-a',
            params: { shards: 6, hotKeySalt: 4 },
          }),
        ],
        links: [
          {
            id: 'client-lb',
            from: 'client',
            to: 'lb',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1500,
          },
          {
            id: 'lb-svc1',
            from: 'lb',
            to: 'ingest-svc-1',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1000,
          },
          {
            id: 'lb-svc2',
            from: 'lb',
            to: 'ingest-svc-2',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1000,
          },
          {
            id: 'svc1-nosql',
            from: 'ingest-svc-1',
            to: 'telemetry-nosql',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 600,
          },
          {
            id: 'svc2-nosql',
            from: 'ingest-svc-2',
            to: 'telemetry-nosql',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 600,
          },
        ],
        routes: {
          client: 'split',
          lb: 'split',
          'ingest-svc-1': 'all-sequential',
          'ingest-svc-2': 'all-sequential',
        },
      },
      positions: fromGrid({
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'ingest-svc-1': { col: 3, row: 1 },
        'ingest-svc-2': { col: 3, row: 3 },
        'telemetry-nosql': { col: 5, row: 2 },
      }),
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 10000 },
      readRatio: 0.45,
      durationSec: 60,
    },
    topology: [
      requireReachableKinds(
        'topo-lb',
        bi('Có Load Balancer chia tải vào cụm Service', 'Has Load Balancer distributing traffic'),
        ['lb'],
        bi('≥ 1 Load Balancer', '≥ 1 Load Balancer')
      ),
      {
        id: 'topo-stateless-pool',
        label: bi('Cụm Service stateless đủ năng lực (≥ 7 instances)', 'Stateless Service pool ≥ 7 total instances'),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const svcs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'service');
          const totalRep = svcs.reduce((acc, n) => acc + effReplicas(n), 0);
          return {
            pass: totalRep >= 7,
            got: bi(`${totalRep} instance`, `${totalRep} instances`),
            want: bi('≥ 7 instances', '≥ 7 instances'),
          };
        },
      },
      {
        id: 'topo-hot-key-mitigation',
        label: bi(
          'Có biện pháp xử lý khóa nóng (key salting ≥ 2 hoặc Cache hút đọc nóng)',
          'Mitigates the hot key (key salting ≥ 2 or a Cache absorbing hot reads)'
        ),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const nosqls = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'nosql');
          const salted = nosqls.some((n) => Number(n.params.hotKeySalt ?? 1) >= 2);
          const cached = model.nodes.some((n) => reach.has(n.id) && n.kind === 'cache');
          return {
            pass: salted || cached,
            got: salted
              ? bi('Đã bật key salting', 'Key salting enabled')
              : cached
                ? bi('Có Cache phía trước', 'Cache in front')
                : bi('Chỉ dựa vào số shard', 'Relying on shard count only'),
            want: bi('hotKeySalt ≥ 2 hoặc Cache', 'hotKeySalt ≥ 2 or Cache'),
          };
        },
      },
      {
        id: 'topo-nosql-shards',
        label: bi('Tầng lưu trữ NoSQL phân mảnh (≥ 4 shards)', 'Partitioned NoSQL store with ≥ 4 shards'),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const nosqls = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'nosql');
          const totalShards = nosqls.reduce(
            (acc, n) => acc + Math.max(1, Math.round(Number(n.params.shards ?? 1))),
            0
          );
          return {
            pass: nosqls.length > 0 && totalShards >= 4,
            got:
              nosqls.length > 0
                ? bi(`NoSQL (${totalShards} shards)`, `NoSQL (${totalShards} shards)`)
                : bi('Chưa dùng NoSQL trên luồng chính', 'No active NoSQL store'),
            want: bi('NoSQL với ≥ 4 shards', 'NoSQL with ≥ 4 shards'),
          };
        },
      },
    ],
    scenarios: [
      {
        id: 'rw-10k-hotkey',
        label: bi('10.000 RPS ghi/đọc (55% ghi) + khóa nóng 80% từ giây 10', '10,000 RPS R/W (55% write) + 80% Hot Key from 10s'),
        durationSec: 60,
        load: { kind: 'steady', rps: 10000 },
        readRatio: 0.45,
        clientTimeoutMs: 2000,
        dynamicHotKeyOnNosql: {
          at: 10,
          share: 0.8,
          durationSec: 45,
        },
        dynamicDbNoOverload: {
          window: { fromSec: 5, toSec: 60 },
          allowViolationPct: 2,
          label: bi('Tầng lưu trữ không bị overloaded ngay cả khi có hot shard', 'Storage tier stays below overload even during hot-shard skew'),
        },
        constraints: [
          {
            label: bi('Độ trễ p99 ≤ 110 ms', 'Latency p99 ≤ 110 ms'),
            constraint: {
              id: 'p99-110',
              kind: 'slo-latency',
              metric: 'p99',
              maxMs: 110,
              window: { fromSec: 5, toSec: 60 },
              allowViolationPct: 2,
            },
          },
          {
            label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
            constraint: {
              id: 'err-1pct',
              kind: 'slo-error',
              maxRate: 0.01,
              window: { fromSec: 5, toSec: 60 },
            },
          },
          {
            label: bi('Goodput ≥ 9.900 RPS', 'Goodput ≥ 9,900 RPS'),
            constraint: {
              id: 'goodput-9900',
              kind: 'throughput',
              minGoodputRps: 9900,
              window: { fromSec: 5, toSec: 60 },
            },
          },
        ],
      },
    ],
    structural: [
      {
        requiredForPass: false,
        label: bi('Mọi kết nối sync đều cấu hình timeoutMs', 'All sync links configure timeoutMs'),
        constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
      },
    ],
    maxCostPerHour: 3.0,
    parCostPerHour: 1.6,
    explain: bi(
      'Với 5.500 RPS ghi, sharding ngang trên NoSQL cho phép mở rộng gần tuyến tính cả đọc lẫn ghi, vượt xa giới hạn một máy SQL đơn lẻ, nhưng chỉ cho phần tải phân bố đều. Một khóa nóng 80% luôn rơi vào một shard: với 6 shard (không salting) shard nóng nhận 0,8 + 0,2/6 ≈ 83% tải = ~8.333 RPS, vượt ngưỡng ~8.000 RPS của một shard (ρ ≈ 1,04, bão hoà, p99 > 600 ms); lên 12 shard vẫn ~8.167 RPS và vẫn sập. Chia khóa nóng bằng salting (hotKeySalt = 4) hạ shard nóng xuống 0,8/4 + 0,2/6 ≈ 23% tải = ~2.333 RPS (ρ ≈ 0,29, p99 ~78 ms). Ngoài salting, hệ thống thật còn dùng cache phía trước cho đọc nóng, gom/batch ghi và cô lập tenant nóng; salting đổi lại việc đọc khóa đó phải gom từ nhiều khóa con. Tổng chi phí ~$1.33/giờ (chuẩn 3★ ≤ $1.60/giờ).',
      'With 5,500 write RPS, horizontal NoSQL sharding scales reads and writes almost linearly, far beyond a single SQL node, but only for the uniformly distributed part of the load. An 80% hot key always lands on one shard: with 6 shards (no salting) the hot shard receives 0.8 + 0.2/6 ≈ 83% of the load = ~8,333 RPS, above the ~8,000 RPS a shard can serve (ρ ≈ 1.04, saturated, p99 > 600 ms); even 12 shards still give ~8,167 RPS and still collapse. Splitting the hot key with salting (hotKeySalt = 4) drops the hot shard to 0.8/4 + 0.2/6 ≈ 23% of the load = ~2,333 RPS (ρ ≈ 0.29, p99 ~78 ms). Beyond salting, real systems also use a cache in front for hot reads, write coalescing/batching and isolation of the hot tenant; salting costs reads of that key a scatter-gather over several sub-keys. Total cost is ~$1.33/hr (3★ par ≤ $1.60/hr).'
    ),
  },
];

/**
 * Catalog đầy đủ: 5 bài gốc + các bài bổ sung trong `labs/` — sắp theo cấp độ rồi theo mã bài.
 */
export const LAB_CHALLENGES: LabChallengeSpec[] = [...LAB_CORE_CHALLENGES, ...LAB_EXTRA_CHALLENGES].sort(
  (a, b) =>
    LAB_LEVELS.indexOf(a.level) - LAB_LEVELS.indexOf(b.level) || a.code.localeCompare(b.code)
);

function formatConstraintActual(c: Constraint, r: ConstraintResult): { actual: BiText; target: BiText } {
  switch (c.kind) {
    case 'slo-latency': {
      const val = typeof r.actual === 'number' ? `${Math.round(r.actual)} ms` : '—';
      const tgt = `≤ ${c.maxMs} ms`;
      return { actual: bi(val, val), target: bi(tgt, tgt) };
    }
    case 'slo-error': {
      const val = typeof r.actual === 'number' ? `${(r.actual * 100).toFixed(2)}%` : '—';
      const tgt = `≤ ${(c.maxRate * 100).toFixed(1)}%`;
      return { actual: bi(val, val), target: bi(tgt, tgt) };
    }
    case 'throughput': {
      const val =
        typeof r.actual === 'number'
          ? `${Math.round(r.actual).toLocaleString('en-US')} RPS`
          : '—';
      const tgt = `≥ ${c.minGoodputRps.toLocaleString('en-US')} RPS`;
      return { actual: bi(val, val), target: bi(tgt, tgt) };
    }
    case 'cost': {
      const val = typeof r.actual === 'number' ? `$${r.actual.toFixed(2)}/h` : '—';
      const tgt = `≤ $${c.maxPerHour.toFixed(2)}/h`;
      return { actual: bi(val, val), target: bi(tgt, tgt) };
    }
    case 'node-state': {
      const pct = typeof r.actual === 'number' ? `${(r.actual * 100).toFixed(1)}%` : '—';
      const allow = `${c.allowViolationPct ?? 2}%`;
      return {
        actual: r.pass
          ? bi(`Ổn định (vi phạm ${pct})`, `Stable (${pct} violation)`)
          : bi(`Vi phạm ${pct} thời gian`, `Violated ${pct} of window`),
        target: bi(`Vi phạm ≤ ${allow}`, `Violation ≤ ${allow}`),
      };
    }
    case 'structural': {
      const count = typeof r.actual === 'number' ? r.actual : 0;
      return {
        actual: r.pass
          ? bi('Đạt (0 cảnh báo)', 'Pass (0 violations)')
          : bi(`${count} điểm chưa đạt`, `${count} violation(s)`),
        target: bi('0 vi phạm', '0 violations'),
      };
    }
  }
}

/** Điểm tối đa của thiết kế không giữ được toàn vẹn luồng dữ liệu (không lưu dữ liệu ⇒ không thể điểm cao). */
export const LAB_INTEGRITY_FAIL_SCORE_CAP = 20;

/** Trọng số các dòng bắt buộc khi tính điểm: SLO nặng nhất, chi phí nhẹ nhất. */
const REQUIRED_ROW_WEIGHT: Record<LabGradeRow['category'], number> = {
  integrity: 3,
  slo: 3,
  structural: 2,
  cost: 1,
  topology: 1,
};

/**
 * Điểm 0..100.
 * - Phần bắt buộc (80đ): tỉ lệ có trọng số của các dòng bắt buộc đạt (integrity/SLO ×3, cấu trúc ×2,
 *   chi phí ×1). Dòng chi phí chỉ được tính điểm khi MỌI dòng SLO đều đạt — thiết kế rẻ vì chẳng làm gì
 *   không được thưởng.
 * - Phần tuỳ chọn (15đ): tỉ lệ dòng tuỳ chọn đạt; khi chưa đạt bài, phần này nhân thêm tỉ lệ bắt buộc
 *   (không thể kiếm điểm chỉ nhờ vẽ đúng "mẫu").
 * - +5đ khi đạt bài và chi phí trong mức chuẩn.
 * - Đạt bài: kẹp vào [70, 100]. Chưa đạt: ≤ 69. Hỏng toàn vẹn dữ liệu: ≤ LAB_INTEGRITY_FAIL_SCORE_CAP.
 */
export function computeLabScore(
  rows: LabGradeRow[],
  ctx: { allRequiredPass: boolean; integrityPass: boolean; withinParCost: boolean }
): number {
  const sloRows = rows.filter((r) => r.category === 'slo');
  const allSloPass = sloRows.length > 0 && sloRows.every((r) => r.pass);
  let wTotal = 0;
  let wPassed = 0;
  for (const r of rows) {
    if (!r.required) continue;
    const w = REQUIRED_ROW_WEIGHT[r.category];
    wTotal += w;
    const earned = r.category === 'cost' ? r.pass && allSloPass : r.pass;
    if (earned) wPassed += w;
  }
  const optionalRows = rows.filter((r) => !r.required);
  const reqRatio = wTotal > 0 ? wPassed / wTotal : 1;
  const optRatio =
    optionalRows.length > 0 ? optionalRows.filter((r) => r.pass).length / optionalRows.length : 1;
  const raw =
    reqRatio * 80 +
    optRatio * 15 * (ctx.allRequiredPass ? 1 : reqRatio) +
    (ctx.withinParCost && ctx.allRequiredPass ? 5 : 0);
  let score = Math.round(raw);
  if (ctx.allRequiredPass) return Math.max(70, Math.min(100, score));
  score = Math.min(69, score);
  if (!ctx.integrityPass) score = Math.min(LAB_INTEGRITY_FAIL_SCORE_CAP, Math.round(score * 0.3));
  return Math.max(0, score);
}

/** Chấm thiết kế kiến trúc hiện tại trên toàn bộ kịch bản, cấu trúc và ngân sách của thử thách. */
/**
 * Toàn vẹn luồng dữ liệu của một bài Lab = luật chung (labIntegrity.ts) + thành phần bắt buộc của đề
 * (node bị khoá trong bản khởi điểm: dịch vụ bên thứ ba, nơi nhận email…) phải còn trên luồng xử lý —
 * chặn kiểu "lách" bằng cách xoá / rút dây khỏi chính thứ mà bài muốn bạn xử lý.
 * Dùng chung cho bộ chấm và bảng phân tích trực tiếp.
 */
export function checkLabIntegrity(challenge: LabChallengeSpec, model: SystemModel): IntegrityIssue[] {
  const issues = checkDataFlowIntegrity(model, {
    readRatio: challenge.scenarios.map((s) => s.readRatio),
  });
  const reach = getReachableFromClient(model);
  for (const id of challenge.starter.lockedNodeIds) {
    if (id === 'client' || reach.has(id)) continue;
    const lb =
      model.nodes.find((n) => n.id === id)?.label ??
      challenge.starter.model.nodes.find((n) => n.id === id)?.label ??
      bi(id, id);
    issues.push({
      code: 'required-node-unreachable',
      nodeId: id,
      message: bi(
        `“${lb.vi}” là thành phần bắt buộc của đề nhưng không còn nằm trên luồng xử lý — không được xoá hay ngắt nó để né sự cố.`,
        `“${lb.en}” is a required part of the scenario but is no longer on the request path — removing or disconnecting it to dodge the incident is not allowed.`
      ),
    });
  }
  return issues;
}

export function gradeLabChallenge(
  challenge: LabChallengeSpec,
  model: SystemModel
): LabGradeReport {
  try {
    validate(model);
  } catch (err) {
    const msg =
      err instanceof SimModelError
        ? bi(
            `Mô hình chưa hợp lệ (${err.code}): ${err.message}`,
            `Invalid system model (${err.code}): ${err.message}`
          )
        : bi('Mô hình chưa hợp lệ.', 'Invalid system model.');
    return {
      challengeId: challenge.id,
      validModel: false,
      validationError: msg,
      passed: false,
      score: 0,
      stars: 0,
      costPerHour: computeModelStaticCostPerHour(model),
      maxCostPerHour: challenge.maxCostPerHour,
      parCostPerHour: challenge.parCostPerHour,
      rows: [],
      summary: msg,
    };
  }

  const rows: LabGradeRow[] = [];

  // 0. Toàn vẹn luồng dữ liệu: request đọc/ghi phải thực sự tới nơi lưu dữ liệu (xem labIntegrity.ts).
  //    Mô phỏng coi request dừng ở bất kỳ node nào là "đã phục vụ", nên thiếu dòng này thì một thiết kế
  //    không có database vẫn đạt SLO.
  const integrityIssues = checkLabIntegrity(challenge, model);
  const integrityPass = integrityIssues.length === 0;
  // Ưu tiên chỉ đúng node hỏng; chỉ dùng thông báo tổng quát khi không có node cụ thể nào.
  const nodeIssues = integrityIssues.filter((i) => i.nodeId);
  const integrityShown = nodeIssues.length > 0 ? nodeIssues : integrityIssues;
  rows.push({
    id: 'integrity:data-flow',
    category: 'integrity',
    label: bi(
      'Toàn vẹn luồng dữ liệu: mọi request đọc/ghi đều tới nơi lưu dữ liệu',
      'Data-flow integrity: every read/write reaches a data store'
    ),
    required: true,
    pass: integrityPass,
    actual: integrityPass
      ? bi('Đạt — không có ngõ cụt', 'Pass — no dead ends')
      : bi(
          integrityShown.map((i) => i.message.vi).join(' '),
          integrityShown.map((i) => i.message.en).join(' ')
        ),
    target: bi('Không ngõ cụt, đọc/ghi tới Database', 'No dead ends; reads/writes reach storage'),
  });

  // 1. Topology checks: "mẫu thiết kế khuyến nghị" — KHÔNG chặn đạt bài (nhiều thiết kế hợp lệ khác nhau),
  //    chỉ góp vào điểm thưởng / 3 sao. Điều kiện đạt thực sự nằm ở SLO + quy tắc cấu trúc bắt buộc + chi phí.
  for (const t of challenge.topology) {
    const res = t.check(model);
    rows.push({
      id: `topo:${t.id}`,
      category: 'topology',
      label: bi(`${t.label.vi} (mẫu khuyến nghị)`, `${t.label.en} (recommended pattern)`),
      required: false,
      pass: res.pass,
      actual: res.got,
      target: res.want,
    });
  }

  // 2. Chạy headless `simulate()` + `evaluate()` trên mọi kịch bản của thử thách
  let firstRun: RunSeries | null = null;
  let maxObservedCost = computeModelStaticCostPerHour(model);
  const reach = getReachableFromClient(model);
  const clientConnected = model.nodes.some(
    (n) => n.kind !== 'client' && reach.has(n.id)
  );

  for (const scSpec of challenge.scenarios) {
    if (!clientConnected) {
      for (const spec of scSpec.constraints) {
        const placeholder = formatConstraintActual(spec.constraint, {
          id: spec.constraint.id,
          pass: false,
          actual: null,
          target: '',
          messageKey: 'unconnected',
        });
        rows.push({
          id: `sc:${scSpec.id}:${spec.constraint.id}`,
          category: 'slo',
          scenarioLabel: scSpec.label,
          label: spec.label,
          required: true,
          pass: false,
          actual: bi('Chưa nối từ Client', 'Client unconnected'),
          target: placeholder.target,
        });
      }
      if (scSpec.dynamicDbNoOverload) {
        rows.push({
          id: `sc:${scSpec.id}:db-unconnected`,
          category: 'slo',
          scenarioLabel: scSpec.label,
          label: scSpec.dynamicDbNoOverload.label,
          required: true,
          pass: false,
          actual: bi('Chưa nối từ Client', 'Client unconnected'),
          target: bi('Không overloaded/down', 'Never overloaded/down'),
        });
      }
      continue;
    }

    const nodeIds = new Set(model.nodes.map((n) => n.id));
    const linkIds = new Set(model.links.map((l) => l.id));
    const events: TimedEvent[] = (scSpec.events ?? []).filter((ev) => {
      if ('node' in ev && !nodeIds.has(ev.node)) return false;
      if ('link' in ev && !linkIds.has(ev.link)) return false;
      return true;
    });
    if (scSpec.dynamicCrash) {
      const cands = model.nodes.filter((n) => reach.has(n.id) && n.kind === scSpec.dynamicCrash!.kind);
      let target = cands[0];
      for (const n of cands) if (effReplicas(n) > effReplicas(target)) target = n;
      if (target) {
        events.push({ at: scSpec.dynamicCrash.at, type: 'crash', node: target.id });
        if (scSpec.dynamicCrash.recoverAtSec !== undefined) {
          events.push({ at: scSpec.dynamicCrash.recoverAtSec, type: 'recover', node: target.id });
        }
      }
    }
    if (scSpec.dynamicHotKeyOnNosql) {
      for (const n of model.nodes) {
        if (n.kind === 'nosql' && reach.has(n.id)) {
          events.push({
            at: scSpec.dynamicHotKeyOnNosql.at,
            type: 'hot-key',
            node: n.id,
            share: scSpec.dynamicHotKeyOnNosql.share,
            durationSec: scSpec.dynamicHotKeyOnNosql.durationSec,
          });
        }
      }
    }

    const scenario: SimScenario = {
      id: `${challenge.id}/${scSpec.id}`,
      model,
      durationSec: scSpec.durationSec,
      load: scSpec.load,
      events,
      seed: 2026,
      mix: { readRatio: scSpec.readRatio },
      clientTimeoutMs: scSpec.clientTimeoutMs ?? 2000,
      options: { noise: false, maxPackets: 0 },
    };

    const run = simulate(scenario, []);
    if (!firstRun) firstRun = run;
    for (let k = 0; k < run.ticks; k++) {
      if (run.costPerHour[k] > maxObservedCost) maxObservedCost = run.costPerHour[k];
    }

    const dynamicConstraints: LabLabeledConstraint[] = [...scSpec.constraints];
    if (scSpec.dynamicDbNoOverload) {
      const dbNodes = model.nodes.filter(
        (n) => reach.has(n.id) && (n.kind === 'sql' || n.kind === 'nosql')
      );
      if (dbNodes.length === 0) {
        rows.push({
          id: `sc:${scSpec.id}:db-missing`,
          category: 'slo',
          scenarioLabel: scSpec.label,
          label: scSpec.dynamicDbNoOverload.label,
          required: true,
          pass: false,
          actual: bi('Chưa có Database trên luồng chính', 'No active Database'),
          target: bi('Không overloaded/down', 'Never overloaded/down'),
        });
      } else {
        for (const dbNode of dbNodes) {
          dynamicConstraints.push({
            label:
              dbNodes.length === 1
                ? scSpec.dynamicDbNoOverload.label
                : bi(
                    `${scSpec.dynamicDbNoOverload.label.vi} (${dbNode.label.vi})`,
                    `${scSpec.dynamicDbNoOverload.label.en} (${dbNode.label.en})`
                  ),
            constraint: {
              id: `db-safe-${dbNode.id}`,
              kind: 'node-state',
              node: dbNode.id,
              notIn: ['overloaded', 'down'],
              window: scSpec.dynamicDbNoOverload.window,
              allowViolationPct: scSpec.dynamicDbNoOverload.allowViolationPct ?? 2,
            },
          });
        }
      }
    }

    const evalResults = evaluate(
      dynamicConstraints.map((x) => x.constraint),
      run,
      model
    );

    evalResults.forEach((res, idx) => {
      const spec = dynamicConstraints[idx];
      const fmt = formatConstraintActual(spec.constraint, res);
      rows.push({
        id: `sc:${scSpec.id}:${res.id}`,
        category: 'slo',
        scenarioLabel: scSpec.label,
        label: spec.label,
        required: true,
        pass: res.pass,
        actual: fmt.actual,
        target: fmt.target,
        worstAtSec: res.worstAtSec,
      });
    });
  }

  // 3. Quy tắc cấu trúc (`evaluate` structural rules)
  if (firstRun && challenge.structural.length > 0) {
    const structResults = evaluate(
      challenge.structural.map((s) => s.constraint),
      firstRun,
      model
    );
    structResults.forEach((res, idx) => {
      const spec = challenge.structural[idx];
      const fmt = formatConstraintActual(spec.constraint, res);
      rows.push({
        id: `struct:${res.id}`,
        category: 'structural',
        label: spec.label,
        required: spec.requiredForPass,
        pass: res.pass,
        actual: fmt.actual,
        target: fmt.target,
      });
    });
  }

  // 4. Ngân sách chi phí ($/giờ)
  const costPerHour = Math.max(computeModelStaticCostPerHour(model), maxObservedCost);
  const costPass = costPerHour <= challenge.maxCostPerHour + 1e-6;
  rows.push({
    id: 'budget:cost',
    category: 'cost',
    label: bi(
      `Chi phí vận hành ≤ $${challenge.maxCostPerHour.toFixed(2)}/giờ (chuẩn 3★: ≤ $${challenge.parCostPerHour.toFixed(2)}/giờ)`,
      `Operating cost ≤ $${challenge.maxCostPerHour.toFixed(2)}/hr (3★ par: ≤ $${challenge.parCostPerHour.toFixed(2)}/hr)`
    ),
    required: true,
    pass: costPass,
    actual: bi(`$${costPerHour.toFixed(2)}/h`, `$${costPerHour.toFixed(2)}/h`),
    target: bi(`≤ $${challenge.maxCostPerHour.toFixed(2)}/h`, `≤ $${challenge.maxCostPerHour.toFixed(2)}/h`),
  });

  const requiredRows = rows.filter((r) => r.required);
  const optionalRows = rows.filter((r) => !r.required);
  const reqPassedCount = requiredRows.filter((r) => r.pass).length;
  const optPassedCount = optionalRows.filter((r) => r.pass).length;

  const allRequiredPass = requiredRows.every((r) => r.pass);
  const structuralBonusPass = rows
    .filter((r) => r.category === 'structural' && !r.required)
    .every((r) => r.pass);
  const patternPass = rows.filter((r) => r.category === 'topology').every((r) => r.pass);
  const withinParCost = costPerHour <= challenge.parCostPerHour * 1.05 + 1e-6;

  // Sao: 1★ = đạt mọi điều kiện bắt buộc (toàn vẹn dữ liệu + SLO + cấu trúc bắt buộc + ngân sách tối đa);
  // 2★ = thêm các quy tắc cấu trúc tuỳ chọn (timeout / jitter…);
  // 3★ = thêm mẫu thiết kế khuyến nghị (topology) và chi phí trong mức chuẩn (par).
  let stars: 0 | 1 | 2 | 3 = 0;
  if (allRequiredPass) {
    stars = 1;
    if (structuralBonusPass) {
      stars = 2;
      if (patternPass && withinParCost) stars = 3;
    }
  }

  const score = computeLabScore(rows, { allRequiredPass, integrityPass, withinParCost });

  const par = challenge.parCostPerHour.toFixed(2);
  const summary = allRequiredPass
    ? stars === 3
      ? bi(
          `Đạt xuất sắc 3/3 sao! Mọi SLO, quy tắc cấu trúc, mẫu thiết kế khuyến nghị và chi phí chuẩn ($${costPerHour.toFixed(2)}/giờ) đều thỏa mãn.`,
          `3/3 Stars! All SLOs, structural rules, the recommended design pattern and par cost ($${costPerHour.toFixed(2)}/hr) are satisfied.`
        )
      : stars === 2
        ? bi(
            `Đạt 2/3 sao! Thiết kế của bạn vượt qua mọi SLO và quy tắc cấu trúc (có thể là một lời giải khác hợp lệ). Để lên 3 sao: áp dụng đủ mẫu thiết kế khuyến nghị và giữ chi phí ≤ $${par}/giờ.`,
            `2/3 Stars! Your design passes every SLO and structural rule (it may be a valid alternative solution). For 3 stars: follow the full recommended pattern and keep cost ≤ $${par}/hr.`
          )
        : bi(
            'Đạt 1/3 sao! Thiết kế vượt qua các SLO và ràng buộc bắt buộc. Hoàn thiện thêm các quy tắc cấu trúc (timeout / jitter…) để nâng sao.',
            '1/3 Star! Your design meets the required SLOs and constraints. Address the optional structural rules (timeouts / TTL jitter…) to earn more stars.'
          )
    : !integrityPass
      ? bi(
          `Chưa đạt: dữ liệu không tới được nơi lưu trữ — ${integrityShown[0].message.vi} Mô phỏng có thể trông "nhanh và rẻ" nhưng thực ra request bị bỏ dở, nên điểm bị giới hạn ≤ ${LAB_INTEGRITY_FAIL_SCORE_CAP}.`,
          `Not passed: data never reaches storage — ${integrityShown[0].message.en} The simulation may look "fast and cheap" but requests are simply dropped, so the score is capped at ${LAB_INTEGRITY_FAIL_SCORE_CAP}.`
        )
      : bi(
        `Chưa đạt (${reqPassedCount}/${requiredRows.length} điều kiện bắt buộc: toàn vẹn dữ liệu, SLO, quy tắc cấu trúc bắt buộc và ngân sách). Các dòng "mẫu khuyến nghị" chỉ là gợi ý, không chặn đạt bài. Xem bảng đối chiếu bên dưới.`,
        `Not passed yet (${reqPassedCount}/${requiredRows.length} required checks: data-flow integrity, SLOs, required structural rules and budget). "Recommended pattern" rows are hints only and never block a pass. Inspect the table below.`
      );

  return {
    challengeId: challenge.id,
    validModel: true,
    passed: allRequiredPass,
    score,
    stars,
    costPerHour,
    maxCostPerHour: challenge.maxCostPerHour,
    parCostPerHour: challenge.parCostPerHour,
    rows,
    summary,
  };
}
