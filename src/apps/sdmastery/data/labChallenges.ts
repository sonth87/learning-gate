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

export const LAB_GRID_COLS = 7;
export const LAB_GRID_ROWS = 5;

export interface GridPos {
  col: number;
  row: number;
}

export interface BiText {
  vi: string;
  en: string;
}

export interface LabCanvasPreset {
  model: SystemModel;
  positions: Record<NodeId, GridPos>;
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
  /** Bơm sự kiện hot-key tự động vào các node NoSQL phân mảnh (dùng cho LAB-05). */
  dynamicHotKeyOnNosql?: {
    at: number;
    share: number;
    durationSec: number;
  };
}

export interface LabChallengeSpec {
  id: string;
  code: string;
  difficulty: 1 | 2 | 3;
  xp: number;
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
  category: 'topology' | 'slo' | 'structural' | 'cost';
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
    positions: {
      client: { col: 0, row: 2 },
    },
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
        label: bi('Redis Cache', 'Redis Cache'),
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
  positions: {
    client: { col: 0, row: 2 },
    lb: { col: 1, row: 2 },
    'app-1': { col: 3, row: 1 },
    'app-2': { col: 3, row: 3 },
    cache: { col: 4, row: 2 },
    db: { col: 6, row: 2 },
  },
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

/** 5 bài toán thiết kế có chấm điểm (`design-constraint`) cho T7.1. */
export const LAB_CHALLENGES: LabChallengeSpec[] = [
  /* ───────────── 1. API ĐỌC NẶNG 5.000 RPS DƯỚI $3.00/GIỜ ───────────── */
  {
    id: 'lab-01-read-api',
    code: 'LAB-01',
    difficulty: 1,
    xp: 40,
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
        'Một instance Service mặc định xử lý 1.800 RPS. Để chịu 5.000 RPS với độ trễ hàng đợi thấp, tổng năng lực tầng Service nên đạt ít nhất 4 instance (7.200 RPS) phía sau Load Balancer.',
        'One default Service instance handles 1,800 RPS. To serve 5,000 RPS with low queueing delay, provision at least 4 Service instances (7,200 RPS) behind a Load Balancer.'
      ),
      bi(
        'Ở 90% đọc (4.500 RPS đọc + 500 RPS ghi), đặt Redis Cache (hit ~90%) theo mô hình Read-Through (App → Cache → SQL) hoặc Cache-Aside sẽ giảm tải vào SQL xuống ~950 RPS, không cần nâng cỡ máy SQL đắt đỏ.',
        'With 90% reads (4,500 read RPS + 500 write RPS), placing a Redis Cache (~90% hit) in Read-Through (App → Cache → SQL) or Cache-Aside drops SQL load to ~950 RPS without expensive SQL vertical scaling.'
      ),
      bi(
        'Đặt TTL jitter ≥ 0.10 trên Cache và timeoutMs trên mọi đường nối sync để đạt trọn 3 sao.',
        'Set TTL jitter ≥ 0.10 on the Cache and timeoutMs on all sync links to earn all 3 stars.'
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
      positions: {
        client: { col: 0, row: 2 },
        app: { col: 3, row: 2 },
        db: { col: 5, row: 2 },
      },
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
            label: bi('Redis Cache', 'Redis Cache'),
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        app: { col: 3, row: 2 },
        cache: { col: 4, row: 2 },
        db: { col: 6, row: 2 },
      },
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
        label: bi('Tầng Service nhân bản (≥ 3 instances)', 'Scaled Service tier (≥ 3 instances)'),
        check: (model) => {
          const reach = getReachableFromClient(model);
          const svcs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'service');
          const totalRep = svcs.reduce((acc, n) => acc + effReplicas(n), 0);
          return {
            pass: totalRep >= 3,
            got: bi(`${totalRep} instance`, `${totalRep} instances`),
            want: bi('≥ 3 instances', '≥ 3 instances'),
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
    parCostPerHour: 2.1,
    explain: bi(
      'Với 90% lưu lượng đọc ở 5.000 RPS, đặt Redis Cache (hit ~90%) giảm tải đọc xuống SQL từ 4.500 RPS còn ~450 RPS (cộng 500 RPS ghi = 950 RPS < 1.600 RPS của 1 máy SQL cơ bản). Kết hợp 4 instance Service sau Load Balancer giữ tổng chi phí chỉ ~$1.38/giờ thay vì phải nâng cỡ SQL tốn kém.',
      'With 90% reads at 5,000 RPS, a Redis Cache (~90% hit) cuts SQL read traffic from 4,500 RPS to ~450 RPS (plus 500 write RPS = 950 RPS < 1,600 RPS single SQL capacity). Pairing 4 Service instances behind a Load Balancer keeps cost around ~$1.38/hr.'
    ),
  },

  /* ───────────── 2. FLASH SALE SPIKE 8.000 RPS KHÔNG LÀM SẬP DB ───────────── */
  {
    id: 'lab-02-flash-sale',
    code: 'LAB-02',
    difficulty: 2,
    xp: 45,
    title: bi(
      'Flash Sale Spike 8.000 RPS không làm quá tải DB',
      '8,000 RPS Flash Sale Spike Without Overloading DB'
    ),
    summary: bi(
      'Hấp thụ đỉnh tải đột biến 8.000 RPS bằng hàng đợi bất đồng bộ (Queue + Worker + DLQ) kết hợp Cache để Database không rơi vào trạng thái overloaded và lỗi ≤ 2%.',
      'Absorb an 8,000 RPS flash-sale spike using async Queue + Worker + DLQ and caching so the Database never overloads and error rate stays ≤ 2%.'
    ),
    prompt: bi(
      'Chiến dịch Flash Sale đẩy lưu lượng từ 1.000 RPS vọt lên 8.000 RPS (65% đọc, 35% đặt đơn ghi). Ở bản khởi điểm, dù đã có Cache cho luồng đọc, 2.800 RPS ghi đồng bộ lúc đỉnh vẫn vượt ngưỡng 1.600 RPS của SQL và gây lỗi hàng loạt. Hãy tách luồng ghi qua Queue (bật DLQ) → Worker (chế độ pull) → SQL và đảm bảo tầng Service đủ năng lực tiếp nhận đỉnh tải với tỉ lệ lỗi ≤ 2%.',
      'A Flash Sale spikes traffic from 1,000 RPS to 8,000 RPS (65% reads, 35% order writes). Even with a read Cache, 2,800 synchronous write RPS at peak overwhelms the 1,600 RPS SQL DB. Buffer writes via an async Queue (with DLQ enabled) → Worker (pull mode) → SQL and size the Service tier so error rate stays ≤ 2% and SQL never overloads.'
    ),
    hints: [
      bi(
        'Để tách đọc và ghi tại tầng Service: cấu hình link Service → Cache mang "Chỉ đọc (r)", và thêm link Service → Queue (mode: async, mang "Chỉ ghi (w)" hoặc toàn bộ nếu không dùng Cache).',
        'To split reads and writes at the Service tier: set Service → Cache to carry reads ("r"), and add Service → Queue (mode: async, carries: "w").'
      ),
      bi(
        'Nối Queue → Worker bằng chế độ "pull" và nối Worker → SQL bằng "sync". Với 2 Worker instance (2 × 500 = 1.000 RPS) cộng ~520 RPS cache miss, SQL nhận ~1.520 RPS (hoặc nâng SQL sizeFactor = 2 để dư tải thoải mái).',
        'Connect Queue → Worker using mode "pull" and Worker → SQL using "sync". With 2–3 Worker instances draining steadily into SQL, peak write bursts stay buffered in Queue instead of overloading SQL.'
      ),
      bi(
        'Đừng quên tăng Service lên ≥ 5–6 instances (≥ 9.000 RPS) để không nghẽn ngay trước Queue, và bật Dead-Letter Queue (dlq = true) trên Queue.',
        'Scale Service to ≥ 5–6 instances (≥ 9,000 RPS) so requests do not drop before reaching the Queue, and enable Dead-Letter Queue (dlq = true) on the Queue.'
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'order-api': { col: 2, row: 2 },
        cache: { col: 4, row: 1 },
        db: { col: 6, row: 2 },
      },
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
            replicas: 3,
            params: { replicas: 3 },
          }),
          makeNode('sql', {
            id: 'db',
            label: bi('Order SQL', 'Order SQL'),
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'order-api': { col: 2, row: 2 },
        cache: { col: 4, row: 1 },
        'order-queue': { col: 3, row: 3 },
        'order-worker': { col: 5, row: 3 },
        db: { col: 6, row: 2 },
      },
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
    maxCostPerHour: 4.5,
    parCostPerHour: 3.1,
    explain: bi(
      'Khi lưu lượng ghi tăng vọt lên 2.800 RPS trong 10 giây, hàng đợi Queue hấp thụ phần chênh lệch và để cụm Worker rút dần (load leveling) theo đúng nhịp chịu tải của SQL. Bật DLQ ngăn bản tin lỗi quay vòng làm nghẽn hàng đợi.',
      'During the 10-second 2,800 write-RPS surge, the Queue absorbs excess arrivals while Workers drain at a steady rate matching SQL capacity (load leveling). Enabling DLQ prevents poison messages from clogging the queue.'
    ),
  },

  /* ───────────── 3. KIẾN TRÚC HIGH-AVAILABILITY KHÔNG CÓ SPOF ───────────── */
  {
    id: 'lab-03-zero-spof',
    code: 'LAB-03',
    difficulty: 2,
    xp: 45,
    title: bi(
      'Kiến trúc High-Availability không có SPOF',
      'Zero-SPOF High-Availability Architecture'
    ),
    summary: bi(
      'Loại bỏ toàn bộ điểm lỗi đơn (no-spof), nhân bản tầng stateless (replicas ≥ 2) và cấu hình nhân bản Database (mode: replicate) chịu tải 3.000 RPS với p99 ≤ 150 ms.',
      'Eliminate all Single Points of Failure (no-spof), replicate stateless tiers (replicas ≥ 2), and configure Database replication (mode: replicate) serving 3,000 RPS at p99 ≤ 150 ms.'
    ),
    prompt: bi(
      'Hệ thống thanh toán nội bộ chạy ở 3.000 RPS (85% đọc, 15% ghi) yêu cầu sẵn sàng cao: không tồn tại bất kỳ điểm lỗi đơn (SPOF) nào và mọi thành phần lưu trữ trạng thái đều phải có bản sao dự phòng. Hãy nâng cấp bản khởi điểm để đạt quy tắc cấu trúc no-spof + stateful-has-replica, giữ p99 ≤ 150 ms và tỉ lệ lỗi ≤ 1%.',
      'An internal payment service running at 3,000 RPS (85% reads, 15% writes) requires High Availability: zero Single Points of Failure (SPOFs) and redundancy on every stateful component. Upgrade the starter architecture to pass no-spof + stateful-has-replica while keeping p99 ≤ 150 ms and error rate ≤ 1%.'
    ),
    hints: [
      bi(
        'Bộ phân tích Tarjan (findSpofs) đánh dấu mọi nút nằm trên đường độc đạo tới tầng dữ liệu mà chỉ có replicas = 1 là SPOF. Vì vậy cả Load Balancer, Service và Cache (nếu dùng) đều cần replicas ≥ 2 (hoặc tách thành 2 cụm song song ở az-a / az-b).',
        'Tarjan SPOF analysis flags any articulation node on the critical path with replicas = 1. Ensure Load Balancer, Service, and Cache (if present) each have replicas ≥ 2 (or run redundant parallel nodes across AZs).'
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'pay-svc': { col: 3, row: 2 },
        'db-primary': { col: 5, row: 2 },
      },
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
            id: 'pay-svc',
            label: bi('Payment Service', 'Payment Service'),
            zone: 'az-a',
            replicas: 3,
            params: { replicas: 3 },
          }),
          makeNode('cache', {
            id: 'cache',
            label: bi('Redis Sentinel', 'Redis Sentinel'),
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
            id: 'lb-svc',
            from: 'lb',
            to: 'pay-svc',
            mode: 'sync',
            carries: 'rw',
            timeoutMs: 1200,
          },
          {
            id: 'svc-cache',
            from: 'pay-svc',
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
          'pay-svc': 'all-sequential',
          cache: 'split',
        },
      },
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'pay-svc': { col: 3, row: 2 },
        cache: { col: 4, row: 2 },
        'db-primary': { col: 5, row: 1 },
        'db-replica': { col: 5, row: 3 },
      },
      lockedNodeIds: ['client'],
      load: { kind: 'steady', rps: 3000 },
      readRatio: 0.85,
      durationSec: 60,
    },
    topology: [
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
    maxCostPerHour: 4.5,
    parCostPerHour: 2.6,
    explain: bi(
      'Một kiến trúc High-Availability thực sự đòi hỏi loại bỏ điểm nghẽn đơn ở MỌI tầng trên đường đi tới dữ liệu: cặp Load Balancer dự phòng (replicas ≥ 2), cụm Service stateless ≥ 3 instance, Cache dự phòng và đường nhân bản Primary → Standby SQL (mode: replicate) sang AZ khác.',
      'True High Availability requires redundancy across EVERY hop on the critical path: an active-passive/multi-AZ Load Balancer pair (replicas ≥ 2), ≥ 3 stateless Service instances, replicated Cache, and Primary → Standby SQL replication across AZs.'
    ),
  },

  /* ───────────── 4. BẢO VỆ ORIGIN TOÀN CẦU VỚI CDN & RATE LIMITER ───────────── */
  {
    id: 'lab-04-edge-shield',
    code: 'LAB-04',
    difficulty: 2,
    xp: 45,
    title: bi(
      'Bảo vệ Origin toàn cầu với CDN & Rate Limiter',
      'Global Origin Shielding with CDN & Rate Limiter'
    ),
    summary: bi(
      'Phục vụ 12.000 RPS toàn cầu (95% đọc) nhờ CDN Edge kết hợp Rate Limiter bảo vệ Origin trước đợt tăng đột biến 22.000 RPS.',
      'Serve 12,000 RPS global read-heavy traffic (95% reads) with an Edge CDN and protect the Origin with a Rate Limiter against 22,000 RPS traffic bursts.'
    ),
    prompt: bi(
      'Cổng tin tức sự kiện toàn cầu có tải thường trực 12.000 RPS (95% đọc nội dung, 5% bình luận ghi) và thỉnh thoảng hứng đợt truy cập dồn dập 22.000 RPS từ bot. Bản khởi điểm đẩy toàn bộ 12.000 RPS thẳng về Origin khiến cả App lẫn SQL quá tải nặng. Hãy đặt CDN hấp thụ luồng đọc ở biên và cấu hình Rate Limiter ngay cửa ngõ để đạt 12.000 RPS bình thường (p99 ≤ 95 ms, lỗi ≤ 1%) đồng thời giữ SQL Origin không bao giờ bị overloaded trong kịch bản đột biến 22.000 RPS.',
      'A global news portal serves 12,000 RPS baseline traffic (95% content reads, 5% comment writes) and faces 22,000 RPS bot bursts. The starter routes all 12,000 RPS directly to Origin, overloading App and SQL. Add a CDN to absorb edge reads and a Rate Limiter at the edge/origin boundary so normal 12,000 RPS hits p99 ≤ 95 ms & error ≤ 1%, while Origin SQL never overloads during the 22,000 RPS burst.'
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 2, row: 2 },
        'cms-api': { col: 4, row: 2 },
        'origin-db': { col: 6, row: 2 },
      },
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
      positions: {
        client: { col: 0, row: 2 },
        'edge-cdn': { col: 1, row: 2 },
        'origin-rl': { col: 2, row: 2 },
        lb: { col: 3, row: 2 },
        'cms-api': { col: 4, row: 2 },
        'origin-db': { col: 6, row: 2 },
      },
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
    maxCostPerHour: 3.2,
    parCostPerHour: 1.8,
    explain: bi(
      'CDN giúp xử lý 95% lượt đọc ngay tại Edge với chi phí rất thấp ($0.10/giờ) và độ trễ ~1 ms. Đặt thêm Token Bucket Rate Limiter với ngưỡng khớp năng lực Origin (~1.500 RPS sau CDN) đảm bảo lưu lượng hợp lệ 12.000 RPS đi qua trọn vẹn, còn lưu lượng dư thừa lúc burst bị từ chối sớm (HTTP 429) thay vì làm nghẽn SQL.',
      'An Edge CDN serves 95% of reads in ~1 ms at $0.10/hr. Pairing it with a Token Bucket Rate Limiter tuned to Origin capacity (~1,500 RPS post-CDN) passes 100% of normal 12,000 RPS traffic while shedding excess burst load via fast HTTP 429s before SQL saturates.'
    ),
  },

  /* ───────────── 5. TẦNG LƯU TRỮ PHÂN MẢNH 10.000 RPS GHI/ĐỌC ───────────── */
  {
    id: 'lab-05-sharded-store',
    code: 'LAB-05',
    difficulty: 3,
    xp: 50,
    title: bi(
      'Tầng lưu trữ phân mảnh 10.000 RPS ghi/đọc',
      '10,000 RPS Read/Write Sharded Storage Tier'
    ),
    summary: bi(
      'Thay thế SQL đơn lẻ bằng cụm NoSQL phân mảnh (shards ≥ 4) và mở rộng tầng Service stateless để chịu tải 10.000 RPS (55% ghi, 45% đọc) kể cả khi xuất hiện khóa nóng (hot shard).',
      'Replace single-node SQL with a partitioned NoSQL store (shards ≥ 4) and horizontal stateless Services to sustain 10,000 RPS (55% writes, 45% reads) even under hot-key skew.'
    ),
    prompt: bi(
      'Hệ thống thu thập telemetry IoT và trạng thái thiết bị nhận tải liên tục 10.000 RPS với tỉ lệ ghi chiếm 55% (5.500 RPS ghi + 4.500 RPS đọc) kèm hiện tượng lệch khóa nóng (hot key 30%). Vì lưu lượng ghi quá lớn, chỉ thêm Cache hay nâng cỡ SQL đơn lẻ (tối đa 6.400 RPS) đều không đủ. Hãy thiết kế cụm Service stateless (≥ 7 instances phía sau LB) kết hợp tầng lưu trữ NoSQL phân mảnh (shards ≥ 4) để đạt p99 ≤ 110 ms và tỉ lệ lỗi ≤ 1%.',
      'An IoT telemetry ingestion & state platform receives 10,000 RPS continuous traffic with 55% writes (5,500 write RPS + 4,500 read RPS) and 30% hot-key skew. Because writes dominate, read caching or vertical SQL scaling (max 6,400 RPS) cannot keep up. Design a stateless Service pool (≥ 7 instances behind an LB) backed by a sharded NoSQL cluster (shards ≥ 4) achieving p99 ≤ 110 ms and error rate ≤ 1%.'
    ),
    hints: [
      bi(
        'Một Load Balancer mặc định chịu được 20.000 RPS. Phía sau LB, tầng Service cần ít nhất 7–8 instances (8 × 1.800 = 14.400 RPS) để phục vụ mượt 10.000 RPS mà không tạo hàng đợi.',
        'A default Load Balancer handles 20,000 RPS. Behind it, provision 7–8 stateless Service instances (8 × 1,800 = 14,400 RPS) to process 10,000 RPS with minimal queueing.'
      ),
      bi(
        'Xoá hoặc thay SQL bằng node NoSQL. Khi có sự kiện hot-key 30%, năng lực hiệu dụng của cụm phân mảnh bị giới hạn bởi shard nóng: tăng số phân mảnh (shards) lên ≥ 5–6 giúp chia nhỏ phần lưu lượng 70% còn lại và giữ độ trễ p99 ổn định dưới 110 ms.',
        'Replace SQL with a NoSQL node. Under 30% hot-key skew, effective cluster throughput is bounded by the hottest shard: increasing shards to ≥ 5–6 spreads the remaining 70% load thinly and keeps p99 under 110 ms.'
      ),
      bi(
        'Đảm bảo mọi kết nối đồng bộ đều có timeoutMs hợp lý để đạt thêm điểm cấu trúc và giữ ngân sách dưới mức chuẩn ($2.20/giờ) cho 3 sao.',
        'Ensure all sync links configure timeoutMs and keep hourly cost within par ($2.20/hr) to earn 3 stars.'
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'ingest-svc': { col: 3, row: 2 },
        'legacy-sql': { col: 5, row: 2 },
      },
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
            params: { shards: 6 },
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
      positions: {
        client: { col: 0, row: 2 },
        lb: { col: 1, row: 2 },
        'ingest-svc-1': { col: 3, row: 1 },
        'ingest-svc-2': { col: 3, row: 3 },
        'telemetry-nosql': { col: 5, row: 2 },
      },
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
        label: bi('10.000 RPS ghi/đọc (55% ghi) + lệch khóa nóng 30%', '10,000 RPS R/W (55% write) + 30% Hot-Key Skew'),
        durationSec: 60,
        load: { kind: 'steady', rps: 10000 },
        readRatio: 0.45,
        clientTimeoutMs: 2000,
        dynamicHotKeyOnNosql: {
          at: 10,
          share: 0.3,
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
    maxCostPerHour: 4.0,
    parCostPerHour: 2.2,
    explain: bi(
      'Khi tải ghi đạt 5.500 RPS, việc phân mảnh ngang (sharding) trên NoSQL cho phép mở rộng tuyến tính cả đọc lẫn ghi vượt xa giới hạn của một máy SQL đơn lẻ. Tăng số lượng shard lên ≥ 6 giúp giảm mật độ tải nền trên shard đang gánh khóa nóng 30%, giữ ρ của shard nóng ở mức ~0,52 và p99 dưới 70 ms.',
      'With 5,500 write RPS, horizontal sharding on NoSQL scales both reads and writes far beyond single-node SQL limits. Provisioning ≥ 6 shards reduces background load on the shard holding the 30% hot key, keeping hot-shard utilization around ~0.52 and p99 under 70 ms.'
    ),
  },
];

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

/** Chấm thiết kế kiến trúc hiện tại trên toàn bộ kịch bản, cấu trúc và ngân sách của thử thách. */
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

  // 1. Topology checks (bắt buộc để ngăn canvas rỗng hoặc nối thiếu tầng lưu trữ)
  for (const t of challenge.topology) {
    const res = t.check(model);
    rows.push({
      id: `topo:${t.id}`,
      category: 'topology',
      label: t.label,
      required: true,
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

    const events: TimedEvent[] = [];
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
  const allOptionalPass = optionalRows.every((r) => r.pass);
  const withinParCost = costPerHour <= challenge.parCostPerHour * 1.05 + 1e-6;

  let stars: 0 | 1 | 2 | 3 = 0;
  if (allRequiredPass) {
    stars = 1;
    if (allOptionalPass) {
      stars = 2;
      if (withinParCost) {
        stars = 3;
      }
    }
  }

  const reqRatio = requiredRows.length > 0 ? reqPassedCount / requiredRows.length : 1;
  const optRatio = optionalRows.length > 0 ? optPassedCount / optionalRows.length : 1;
  let score = Math.round(reqRatio * 80 + optRatio * 15 + (withinParCost && allRequiredPass ? 5 : 0));
  if (allRequiredPass) {
    score = Math.max(70, Math.min(100, score));
  } else {
    score = Math.min(69, score);
  }

  const summary = allRequiredPass
    ? stars === 3
      ? bi(
          `Đạt xuất sắc 3/3 sao! Mọi ràng buộc SLO, quy tắc cấu trúc và chi phí tối ưu ($${costPerHour.toFixed(2)}/giờ) đều thỏa mãn.`,
          `3/3 Stars! All SLO constraints, structural best practices, and optimal cost ($${costPerHour.toFixed(2)}/hr) are satisfied.`
        )
      : stars === 2
        ? bi(
            `Đạt 2/3 sao! Kiến trúc vượt qua mọi SLO và quy tắc cấu trúc. Giảm chi phí về ≤ $${challenge.parCostPerHour.toFixed(2)}/giờ để đạt 3 sao.`,
            `2/3 Stars! Architecture passes all SLOs and structural rules. Trim cost to ≤ $${challenge.parCostPerHour.toFixed(2)}/hr for 3 stars.`
          )
        : bi(
            'Đạt 1/3 sao! Kiến trúc vượt qua các SLO bắt buộc. Hoàn thiện thêm các cảnh báo cấu trúc (timeout / jitter) để nâng sao.',
            '1/3 Star! Required SLOs pass. Address bonus structural rules (timeouts / TTL jitter) to earn more stars.'
          )
    : bi(
        `Chưa đạt (${reqPassedCount}/${requiredRows.length} điều kiện bắt buộc). Xem bảng đối chiếu bên dưới để điều chỉnh kiến trúc.`,
        `Not passed yet (${reqPassedCount}/${requiredRows.length} required checks). Inspect the constraint table below to refine your design.`
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
