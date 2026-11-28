/* Bài Lab cấp CHUYÊN GIA (expert) — kết hợp nhiều kỹ thuật, mỗi bài ≥ 3 kịch bản. */
import type { LabChallengeSpec } from '../labChallenges';
import {
  bi,
  clientNode,
  kindOf,
  makeBlankPreset,
  node,
  preset,
  reachable,
  requireKinds,
  requireLink,
  sync,
} from './shared';

const LEVEL = { level: 'expert', difficulty: 4, xp: 60 } as const;

const servicePoolsCheck = (min: number) => ({
  id: 'topo-service-pools',
  label: bi(
    `Tầng API gồm ≥ ${min} cụm độc lập ở các AZ khác nhau`,
    `API tier has ≥ ${min} independent pools in different AZs`
  ),
  check: (model: Parameters<LabChallengeSpec['topology'][number]['check']>[0]) => {
    const reach = reachable(model);
    const svcs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'service');
    const zones = new Set(svcs.map((n) => n.zone));
    return {
      pass: svcs.length >= min && zones.size >= 2,
      got: bi(
        `${svcs.length} cụm / ${zones.size} AZ`,
        `${svcs.length} pool(s) / ${zones.size} AZ(s)`
      ),
      want: bi(`≥ ${min} cụm ở ≥ 2 AZ`, `≥ ${min} pools in ≥ 2 AZs`),
    };
  },
});

/* ───────────── BLACK FRIDAY DRILL: ĐỌC TOÀN CẦU + ĐỈNH GHI + SỰ CỐ ───────────── */
const BF_STEADY = { kind: 'steady', rps: 10000 } as const;
const BF_SPIKE = {
  kind: 'spike',
  base: 3000,
  peak: 9000,
  atSec: 15,
  holdSec: 10,
  riseSec: 3,
  fallSec: 5,
} as const;

const blackFriday: LabChallengeSpec = {
  id: 'lab-14-black-friday',
  code: 'LAB-14',
  ...LEVEL,
  concepts: [
    bi('CDN', 'CDN'),
    bi('Queue + Worker', 'Queue + Worker'),
    bi('Multi-AZ', 'Multi-AZ'),
    bi('Nhiều kịch bản', 'Multi-scenario'),
  ],
  estMinutes: 40,
  sourceRef: [
    {
      path: 'phase-2/lessons/lesson-5-integration-trade-off-thinking.mdx',
      phase: 2,
      title: bi('Kết hợp các thành phần & đánh đổi', 'Integration & trade-off thinking'),
    },
    {
      path: 'phase-5/lessons/lesson-1-architecture-evolution-mindset.mdx',
      phase: 5,
      title: bi('Tư duy tiến hoá kiến trúc', 'Architecture evolution mindset'),
    },
    {
      path: 'phase-6/lessons/lesson-6-architect-mindset-production-thinking.mdx',
      phase: 6,
      title: bi(
        'Tư duy kiến trúc sư & vận hành thực tế',
        'Architect mindset & production thinking'
      ),
    },
  ],
  title: bi(
    'Diễn tập Black Friday: đọc toàn cầu, đỉnh ghi và sự cố cùng một kiến trúc',
    'Black Friday Drill: Global Reads, a Write Spike and an Outage on One Architecture'
  ),
  summary: bi(
    'Một kiến trúc phải qua cả ba bài thử: 10.000 RPS đọc toàn cầu, đỉnh đặt hàng 2.700 lượt ghi/giây, và mất một cụm API giữa giờ cao điểm. Kết hợp CDN, Cache, Queue + Worker và hai cụm API đa AZ trong ngân sách $2.10/giờ.',
    'One architecture must survive three tests: 10,000 RPS of global reads, an order spike of 2,700 writes/s, and losing an API pool at peak. Combine CDN, Cache, Queue + Worker and two multi-AZ API pools within a $2.10/hr budget.'
  ),
  prompt: bi(
    'Bản khởi điểm là kiến trúc "LAB-01 đã lớn": Load Balancer → một cụm Shop API 4 instance → Cache → SQL. Nó ổn với tải thường nhưng Black Friday sẽ kiểm tra cùng một thiết kế qua ba kịch bản:\n\n1. Đọc toàn cầu: 10.000 RPS ổn định, 95% đọc trang sản phẩm.\n2. Đỉnh đặt hàng: tải tăng từ 3.000 lên 9.000 RPS trong 10 giây với 30% là đơn hàng (đỉnh 2.700 lượt ghi/giây). SQL không được quá tải.\n3. Sự cố: ở 10.000 RPS, cụm API lớn nhất chết ở giây 20 và chỉ khởi động lại ở giây 40.\n\nKhông có thành phần nào giải được cả ba: CDN lo kịch bản 1, Queue + Worker lo kịch bản 2, hai cụm API độc lập lo kịch bản 3. Bài này kiểm tra việc bạn ghép chúng thành một kiến trúc gọn, không thừa, trong ngân sách.',
    'The starter is "LAB-01 grown up": Load Balancer → one 4-instance Shop API pool → Cache → SQL. It copes with normal traffic, but Black Friday tests the same design in three scenarios:\n\n1. Global reads: a steady 10,000 RPS, 95% product-page reads.\n2. Order spike: load jumps from 3,000 to 9,000 RPS for 10 seconds with 30% orders (peak 2,700 writes/s). SQL must not overload.\n3. Outage: at 10,000 RPS the largest API pool dies at second 20 and only restarts at second 40.\n\nNo single component solves all three: a CDN handles scenario 1, Queue + Worker handles scenario 2, two independent API pools handle scenario 3. This lab checks that you combine them into one lean architecture, within budget.'
  ),
  hints: [
    bi(
      'Kịch bản 1: CDN (trúng ~95%) giữ ~9.025 lượt đọc ở biên; origin chỉ còn ~475 lượt trượt + 500 lượt ghi ≈ 975 RPS. Không có CDN, 4 instance API (7.200 RPS) không đỡ nổi 10.000 RPS.',
      'Scenario 1: a CDN (~95% hits) keeps ~9,025 reads at the edge; the origin only sees ~475 misses + 500 writes ≈ 975 RPS. Without a CDN, 4 API instances (7,200 RPS) cannot absorb 10,000 RPS.'
    ),
    bi(
      'Kịch bản 2: tách luồng ghi. API → Cache mang "r", API → Queue (async, "w", bật DLQ) → Worker (pull) → SQL. 2 Worker rút 1.000 lượt ghi/giây, đỉnh 2.700 dồn vào Queue; SQL nhận ~1.000 RPS thay vì 2.700.',
      'Scenario 2: split the writes. API → Cache carries "r", API → Queue (async, "w", DLQ on) → Worker (pull) → SQL. 2 Workers drain 1,000 writes/s, the 2,700 peak piles up in the Queue; SQL sees ~1,000 RPS instead of 2,700.'
    ),
    bi(
      'Kịch bản 3: một node Service là một miền lỗi. Dùng hai cụm (az-a và az-b), mỗi cụm 2 instance, cùng đứng sau Load Balancer (health check 3 s). Nhờ CDN, mỗi cụm chỉ cần gánh ~975 RPS một mình.',
      'Scenario 3: a Service node is one failure domain. Use two pools (az-a and az-b) of 2 instances each behind the Load Balancer (3 s health check). Thanks to the CDN each pool only needs to carry ~975 RPS on its own.'
    ),
    bi(
      'Ngân sách: CDN $0.10 + LB $0.025 + 4 instance $0.40 + Cache $0.15 + Queue $0.12 + 2 Worker $0.20 + SQL $0.80 ≈ $1.80/giờ. Nâng cỡ SQL để chịu đỉnh ghi sẽ đẩy chi phí vượt chuẩn.',
      'Budget: CDN $0.10 + LB $0.025 + 4 instances $0.40 + Cache $0.15 + Queue $0.12 + 2 Workers $0.20 + SQL $0.80 ≈ $1.80/hr. Scaling SQL up to absorb the write peak pushes cost over par.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode('Người mua toàn cầu', 'Global shoppers'),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'shop-api', bi('Shop API', 'Shop API'), 'az-a', { replicas: 4 }),
        node('cache', 'cache', bi('Product Cache', 'Product Cache'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15 },
        }),
        node('sql', 'db', bi('Shop SQL', 'Shop SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'shop-api', 1500),
        sync('api-cache', 'shop-api', 'cache', 300),
        sync('cache-db', 'cache', 'db', 800),
      ],
      routes: { client: 'split', lb: 'split', 'shop-api': 'all-sequential', cache: 'split' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      'shop-api': { col: 3, row: 2 },
      cache: { col: 4, row: 2 },
      db: { col: 6, row: 2 },
    },
    BF_STEADY,
    0.95
  ),
  blank: makeBlankPreset(BF_STEADY, 0.95),
  referenceSolution: preset(
    {
      nodes: [
        clientNode('Người mua toàn cầu', 'Global shoppers'),
        node('cdn', 'cdn', bi('Edge CDN', 'Edge CDN'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15, hitRatioMax: 0.95 },
        }),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a', {
          params: { healthCheckSec: 3 },
        }),
        node('service', 'api-a', bi('Shop API (az-a)', 'Shop API (az-a)'), 'az-a', { replicas: 2 }),
        node('service', 'api-b', bi('Shop API (az-b)', 'Shop API (az-b)'), 'az-b', { replicas: 2 }),
        node('cache', 'cache', bi('Product Cache', 'Product Cache'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15 },
        }),
        node('queue', 'order-queue', bi('Order Queue', 'Order Queue'), 'az-a', {
          params: { dlq: true, maxDepth: 200000 },
        }),
        node('worker', 'order-worker', bi('Order Worker', 'Order Worker'), 'az-a', { replicas: 2 }),
        node('sql', 'db', bi('Shop SQL', 'Shop SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
      ],
      links: [
        sync('client-cdn', 'client', 'cdn', 2000),
        sync('cdn-lb', 'cdn', 'lb', 1800),
        sync('lb-api-a', 'lb', 'api-a', 1500),
        sync('lb-api-b', 'lb', 'api-b', 1500),
        sync('api-a-cache', 'api-a', 'cache', 300, { carries: 'r' }),
        sync('api-b-cache', 'api-b', 'cache', 300, { carries: 'r' }),
        { id: 'api-a-queue', from: 'api-a', to: 'order-queue', mode: 'async', carries: 'w' },
        { id: 'api-b-queue', from: 'api-b', to: 'order-queue', mode: 'async', carries: 'w' },
        { id: 'queue-worker', from: 'order-queue', to: 'order-worker', mode: 'pull', carries: 'w' },
        sync('cache-db', 'cache', 'db', 800, { carries: 'r' }),
        sync('worker-db', 'order-worker', 'db', 1000, { carries: 'w' }),
      ],
      routes: {
        client: 'split',
        cdn: 'split',
        lb: 'split',
        'api-a': 'all-sequential',
        'api-b': 'all-sequential',
        cache: 'split',
        'order-worker': 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      cdn: { col: 1, row: 2 },
      lb: { col: 2, row: 2 },
      'api-a': { col: 3, row: 1 },
      'api-b': { col: 3, row: 3 },
      cache: { col: 5, row: 0 },
      'order-queue': { col: 5, row: 4 },
      'order-worker': { col: 6, row: 3 },
      db: { col: 7, row: 1 },
    },
    BF_STEADY,
    0.95
  ),
  topology: [
    requireKinds(
      'topo-cdn',
      bi('Có CDN hấp thụ lượt đọc ở biên', 'Has a CDN absorbing reads at the edge'),
      ['cdn'],
      bi('≥ 1 CDN', '≥ 1 CDN')
    ),
    requireLink(
      'topo-async-writes',
      bi('Đơn hàng đi qua Queue → Worker (pull)', 'Orders flow through Queue → Worker (pull)'),
      (l, m) => l.mode === 'pull' && kindOf(m, l.from) === 'queue' && kindOf(m, l.to) === 'worker',
      bi('Queue → Worker (pull)', 'Queue → Worker (pull)'),
      bi('Chưa có Queue → Worker', 'No Queue → Worker')
    ),
    servicePoolsCheck(2),
  ],
  scenarios: [
    {
      id: 'global-reads',
      label: bi('1 · Đọc toàn cầu 10.000 RPS (95% đọc)', '1 · Global reads 10,000 RPS (95% read)'),
      durationSec: 60,
      load: BF_STEADY,
      readRatio: 0.95,
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
    {
      id: 'order-spike',
      label: bi(
        '2 · Đỉnh đặt hàng 3.000 → 9.000 RPS (30% ghi)',
        '2 · Order spike 3,000 → 9,000 RPS (30% writes)'
      ),
      durationSec: 60,
      load: BF_SPIKE,
      readRatio: 0.7,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 0, toSec: 60 },
        allowViolationPct: 2,
        label: bi(
          'SQL không rơi vào overloaded/down trong đỉnh ghi',
          'SQL never overloaded/down during the write spike'
        ),
      },
      constraints: [
        {
          label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
          constraint: {
            id: 'err-1pct',
            kind: 'slo-error',
            maxRate: 0.01,
            window: { fromSec: 0, toSec: 60 },
          },
        },
        {
          label: bi('Độ trễ p99 ≤ 150 ms', 'Latency p99 ≤ 150 ms'),
          constraint: {
            id: 'p99-150',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 150,
            window: { fromSec: 0, toSec: 60 },
            allowViolationPct: 3,
          },
        },
      ],
    },
    {
      id: 'pool-outage',
      label: bi(
        '3 · Sự cố: mất cụm API lớn nhất ở giây 20 (khởi động lại giây 40)',
        '3 · Outage: largest API pool lost at 20s (restart at 40s)'
      ),
      durationSec: 60,
      load: BF_STEADY,
      readRatio: 0.95,
      clientTimeoutMs: 2000,
      dynamicCrash: { kind: 'service', at: 20, recoverAtSec: 40 },
      constraints: [
        {
          label: bi(
            'Khi mất cụm (giây 24–40): lỗi ≤ 2%',
            'While the pool is down (24–40s): error ≤ 2%'
          ),
          constraint: {
            id: 'out-err-during',
            kind: 'slo-error',
            maxRate: 0.02,
            window: { fromSec: 24, toSec: 40 },
          },
        },
        {
          label: bi('Sau phục hồi (giây 50–60): lỗi ≤ 1%', 'After recovery (50–60s): error ≤ 1%'),
          constraint: {
            id: 'out-err-after',
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
      label: bi(
        'Queue bật Dead-Letter Queue (dlq = true)',
        'Queue enables Dead-Letter Queue (dlq = true)'
      ),
      constraint: { id: 'struct-dlq', kind: 'structural', rule: 'has-dlq' },
    },
    {
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
    {
      requiredForPass: false,
      label: bi('Cache / CDN có TTL jitter ≥ 0,10', 'Cache / CDN set TTL jitter ≥ 0.10'),
      constraint: { id: 'struct-jitter', kind: 'structural', rule: 'cache-has-jitter' },
    },
  ],
  maxCostPerHour: 3.0,
  parCostPerHour: 2.1,
  explain: bi(
    'Mỗi kịch bản bẻ gãy bản khởi điểm theo một cách khác: 10.000 RPS vượt 7.200 RPS của cụm API (cần CDN), 2.700 lượt ghi/giây đi đồng bộ vượt 1.600 RPS của SQL (cần Queue + Worker), và một cụm API duy nhất chết là mất 100% (cần hai cụm). Kiến trúc mẫu: CDN giữ ~95% lượt đọc ở biên nên origin chỉ nhận ~975 RPS; Cache chỉ đọc ("r") giảm tiếp lượt trượt xuống SQL; đơn hàng đi Queue → 2 Worker (1.000 lượt ghi/giây) nên đỉnh ghi xếp hàng thay vì đè SQL; hai cụm API 2 instance ở hai AZ để mỗi cụm một mình gánh trọn origin khi cụm kia chết. Chi phí ≈ $1.80/giờ (chuẩn 3★ ≤ $2.10/giờ). Đánh đổi: đơn hàng được xác nhận bất đồng bộ (202 Accepted) và backlog cần thời gian để rút sau đỉnh.',
    'Each scenario breaks the starter differently: 10,000 RPS exceeds the 7,200 RPS API pool (needs a CDN), 2,700 synchronous writes/s exceed the 1,600 RPS SQL (needs Queue + Worker), and a single API pool dying means 100% errors (needs two pools). Reference design: the CDN keeps ~95% of reads at the edge so the origin sees only ~975 RPS; a read-only ("r") Cache cuts misses to SQL further; orders go Queue → 2 Workers (1,000 writes/s) so the write peak queues up instead of crushing SQL; two 2-instance API pools in two AZs so either one can carry the whole origin load alone. Cost ≈ $1.80/hr (3★ par ≤ $2.10/hr). Trade-off: orders are acknowledged asynchronously (202 Accepted) and the backlog needs time to drain after the peak.'
  ),
};

/* ───────────── NGÂN SÁCH CHẶT: ĐẠT SLO VỚI ≤ $1.10/GIỜ ───────────── */
const BUDGET_STEADY = { kind: 'steady', rps: 8000 } as const;
const BUDGET_VIRAL = {
  kind: 'spike',
  base: 8000,
  peak: 20000,
  atSec: 15,
  holdSec: 15,
  riseSec: 3,
  fallSec: 5,
} as const;

const tightBudget: LabChallengeSpec = {
  id: 'lab-15-tight-budget',
  code: 'LAB-15',
  ...LEVEL,
  concepts: [
    bi('Tối ưu chi phí', 'Cost optimisation'),
    bi('CDN', 'CDN'),
    bi('Chọn đúng kho', 'Right-sized store'),
    bi('Nhiều kịch bản', 'Multi-scenario'),
  ],
  estMinutes: 35,
  sourceRef: [
    {
      path: 'phase-6/lessons/lesson-3-trade-offs-and-architecture-decision-making.mdx',
      phase: 6,
      title: bi('Đánh đổi & ra quyết định kiến trúc', 'Trade-offs & architecture decision making'),
    },
    {
      path: 'phase-0/lessons/lesson-4-thinking-in-constraints.mdx',
      phase: 0,
      title: bi('Tư duy theo ràng buộc', 'Thinking in constraints'),
    },
    {
      path: 'phase-4/lessons/lesson-3-cdn-and-edge-computing-distributed-cache-gan-user.mdx',
      phase: 4,
      title: bi('CDN & Edge', 'CDN & edge computing'),
    },
  ],
  title: bi(
    'Ngân sách $1.10/giờ: cắt 60% chi phí mà vẫn sống qua đỉnh viral và sự cố',
    'A $1.10/hr Budget: Cut 60% of the Cost and Still Survive a Viral Spike and an Outage'
  ),
  summary: bi(
    'Kiến trúc hiện tại tốn ~$2.8/giờ và vẫn gục khi tải viral 20.000 RPS. Thiết kế lại để qua 3 kịch bản (8.000 RPS ổn định, đỉnh 20.000 RPS, mất một cụm API) với chi phí ≤ $1.10/giờ.',
    'The current architecture costs ~$2.8/hr and still falls over at a viral 20,000 RPS. Redesign it to pass 3 scenarios (steady 8,000 RPS, a 20,000 RPS peak, losing an API pool) for ≤ $1.10/hr.'
  ),
  prompt: bi(
    'Trang tin tức sự kiện nhận 8.000 RPS ổn định (95% đọc bài, 5% bình luận/lượt thích). Đội trước "giải quyết" mọi thứ bằng phần cứng: hai cụm API 4 instance, Cache và một SQL cỡ ×2, tổng ~$2.8/giờ. CFO yêu cầu đưa chi phí về ≤ $1.10/giờ (chuẩn 3★ ≤ $0.97/giờ) và hệ thống phải qua cả ba kịch bản:\n\n1. Ổn định: 8.000 RPS, p99 ≤ 100 ms.\n2. Viral: tải vọt lên 20.000 RPS trong 15 giây. Kiến trúc hiện tại (14.400 RPS năng lực API) gục ở đây.\n3. Sự cố: ở 8.000 RPS, cụm API lớn nhất chết ở giây 20, khởi động lại ở giây 40.\n\nGợi ý tư duy: tiền nên đặt ở chỗ rẻ nhất cho mỗi request được phục vụ. Hãy hỏi: request nào có thể dừng ở biên? Phần còn lại cần kho dữ liệu nào là vừa đủ? Bao nhiêu instance là đủ cho cả đỉnh lẫn khi mất một cụm?',
    'An event news site serves a steady 8,000 RPS (95% article reads, 5% comments/likes). The previous team "solved" everything with hardware: two 4-instance API pools, a Cache and a ×2 SQL, ~$2.8/hr in total. The CFO wants cost at ≤ $1.10/hr (3★ par ≤ $0.97/hr), and the system must pass all three scenarios:\n\n1. Steady: 8,000 RPS, p99 ≤ 100 ms.\n2. Viral: load jumps to 20,000 RPS for 15 seconds. The current architecture (14,400 RPS of API capacity) collapses here.\n3. Outage: at 8,000 RPS the largest API pool dies at second 20 and restarts at second 40.\n\nThinking tip: spend money where serving a request is cheapest. Ask: which requests can stop at the edge? What is the smallest store that fits the rest? How many instances cover both the peak and the loss of a pool?'
  ),
  hints: [
    bi(
      'Một CDN ($0.10/giờ, trúng ~95%) chặn ~95% lượt đọc ở biên: ở đỉnh 20.000 RPS, origin chỉ nhận ~950 lượt trượt + 1.000 lượt ghi ≈ 1.950 RPS. Đây là khoản tiết kiệm lớn nhất.',
      'A CDN ($0.10/hr, ~95% hits) stops ~95% of reads at the edge: at the 20,000 RPS peak the origin only gets ~950 misses + 1,000 writes ≈ 1,950 RPS. This is the single biggest saving.'
    ),
    bi(
      '1.950 RPS vượt 1.600 RPS của một SQL cỡ ×1, còn SQL ×2 thì tốn ~$1.84/giờ. Một node NoSQL ($0.50/giờ, 3 shard ~24.000 RPS) gánh thoải mái dữ liệu bài viết/bình luận dạng key-value.',
      '1,950 RPS exceeds a ×1 SQL (1,600 RPS), and a ×2 SQL costs ~$1.84/hr. One NoSQL node ($0.50/hr, 3 shards ~24,000 RPS) easily carries key-value article/comment data.'
    ),
    bi(
      'Cho sự cố: hai cụm API mỗi cụm 1 instance (1.800 RPS) sau Load Balancer. Bình thường origin chỉ ~780 RPS nên một cụm còn lại vẫn đủ; ở đỉnh viral hai cụm cộng lại 3.600 RPS.',
      'For the outage: two API pools of 1 instance each (1,800 RPS) behind a Load Balancer. In steady state the origin is only ~780 RPS, so the surviving pool copes; at the viral peak the two pools give 3,600 RPS together.'
    ),
    bi(
      'Đừng nối CDN thẳng vào hai cụm API: CDN chia tải nhưng không có health check, khi một cụm chết nó vẫn gửi nửa lưu lượng vào cụm đó. Load Balancer ($0.025/giờ) mới loại backend chết ra.',
      'Do not wire the CDN straight to the two API pools: a CDN splits traffic but has no health checks, so when a pool dies it keeps sending half the traffic there. A Load Balancer ($0.025/hr) is what removes dead backends.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode('Độc giả', 'Readers'),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api-a', bi('News API (az-a)', 'News API (az-a)'), 'az-a', { replicas: 4 }),
        node('service', 'api-b', bi('News API (az-b)', 'News API (az-b)'), 'az-b', { replicas: 4 }),
        node('cache', 'cache', bi('Article Cache', 'Article Cache'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15 },
        }),
        node('sql', 'db', bi('News SQL (×2)', 'News SQL (×2)'), 'az-a', {
          params: { sizeFactor: 2, poolSize: 16 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api-a', 'lb', 'api-a', 1500),
        sync('lb-api-b', 'lb', 'api-b', 1500),
        sync('api-a-cache', 'api-a', 'cache', 300),
        sync('api-b-cache', 'api-b', 'cache', 300),
        sync('cache-db', 'cache', 'db', 800),
      ],
      routes: {
        client: 'split',
        lb: 'split',
        'api-a': 'all-sequential',
        'api-b': 'all-sequential',
        cache: 'split',
      },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      'api-a': { col: 3, row: 1 },
      'api-b': { col: 3, row: 3 },
      cache: { col: 5, row: 2 },
      db: { col: 7, row: 2 },
    },
    BUDGET_STEADY,
    0.95
  ),
  blank: makeBlankPreset(BUDGET_STEADY, 0.95),
  referenceSolution: preset(
    {
      nodes: [
        clientNode('Độc giả', 'Readers'),
        node('cdn', 'cdn', bi('Edge CDN', 'Edge CDN'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15, hitRatioMax: 0.95 },
        }),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a', {
          params: { healthCheckSec: 3 },
        }),
        node('service', 'api-a', bi('News API (az-a)', 'News API (az-a)'), 'az-a', { replicas: 1 }),
        node('service', 'api-b', bi('News API (az-b)', 'News API (az-b)'), 'az-b', { replicas: 1 }),
        node('nosql', 'store', bi('News NoSQL', 'News NoSQL'), 'az-a', { params: { shards: 3 } }),
      ],
      links: [
        sync('client-cdn', 'client', 'cdn', 2000),
        sync('cdn-lb', 'cdn', 'lb', 1800),
        sync('lb-api-a', 'lb', 'api-a', 1500),
        sync('lb-api-b', 'lb', 'api-b', 1500),
        sync('api-a-store', 'api-a', 'store', 500),
        sync('api-b-store', 'api-b', 'store', 500),
      ],
      routes: {
        client: 'split',
        cdn: 'split',
        lb: 'split',
        'api-a': 'all-sequential',
        'api-b': 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      cdn: { col: 1, row: 2 },
      lb: { col: 2, row: 2 },
      'api-a': { col: 4, row: 1 },
      'api-b': { col: 4, row: 3 },
      store: { col: 6, row: 2 },
    },
    BUDGET_STEADY,
    0.95
  ),
  topology: [
    requireKinds(
      'topo-cdn',
      bi('Có CDN phục vụ lượt đọc ở biên', 'Has a CDN serving reads at the edge'),
      ['cdn'],
      bi('≥ 1 CDN', '≥ 1 CDN')
    ),
    requireKinds(
      'topo-lb',
      bi('Có Load Balancer loại backend chết', 'Has a Load Balancer removing dead backends'),
      ['lb'],
      bi('≥ 1 Load Balancer', '≥ 1 Load Balancer')
    ),
    servicePoolsCheck(2),
  ],
  scenarios: [
    {
      id: 'steady-8k',
      label: bi('1 · Ổn định 8.000 RPS (95% đọc)', '1 · Steady 8,000 RPS (95% read)'),
      durationSec: 60,
      load: BUDGET_STEADY,
      readRatio: 0.95,
      clientTimeoutMs: 2000,
      constraints: [
        {
          label: bi('Độ trễ p99 ≤ 100 ms', 'Latency p99 ≤ 100 ms'),
          constraint: {
            id: 'p99-100',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 100,
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
      ],
    },
    {
      id: 'viral-20k',
      label: bi(
        '2 · Viral: 8.000 → 20.000 RPS trong 15 giây',
        '2 · Viral: 8,000 → 20,000 RPS for 15 seconds'
      ),
      durationSec: 60,
      load: BUDGET_VIRAL,
      readRatio: 0.95,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 0, toSec: 60 },
        allowViolationPct: 2,
        label: bi('Kho dữ liệu không rơi vào overloaded/down', 'Data store never overloaded/down'),
      },
      constraints: [
        {
          label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
          constraint: {
            id: 'err-1pct',
            kind: 'slo-error',
            maxRate: 0.01,
            window: { fromSec: 0, toSec: 60 },
          },
        },
        {
          label: bi('Độ trễ p99 ≤ 150 ms', 'Latency p99 ≤ 150 ms'),
          constraint: {
            id: 'p99-150',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 150,
            window: { fromSec: 0, toSec: 60 },
            allowViolationPct: 3,
          },
        },
      ],
    },
    {
      id: 'pool-outage',
      label: bi(
        '3 · Sự cố: mất cụm API lớn nhất ở giây 20 (khởi động lại giây 40)',
        '3 · Outage: largest API pool lost at 20s (restart at 40s)'
      ),
      durationSec: 60,
      load: BUDGET_STEADY,
      readRatio: 0.95,
      clientTimeoutMs: 2000,
      dynamicCrash: { kind: 'service', at: 20, recoverAtSec: 40 },
      constraints: [
        {
          label: bi(
            'Khi mất cụm (giây 24–40): lỗi ≤ 2%',
            'While the pool is down (24–40s): error ≤ 2%'
          ),
          constraint: {
            id: 'out-err-during',
            kind: 'slo-error',
            maxRate: 0.02,
            window: { fromSec: 24, toSec: 40 },
          },
        },
        {
          label: bi('Sau phục hồi (giây 50–60): lỗi ≤ 1%', 'After recovery (50–60s): error ≤ 1%'),
          constraint: {
            id: 'out-err-after',
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
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
    {
      requiredForPass: false,
      label: bi('Cache / CDN có TTL jitter ≥ 0,10', 'Cache / CDN set TTL jitter ≥ 0.10'),
      constraint: { id: 'struct-jitter', kind: 'structural', rule: 'cache-has-jitter' },
    },
  ],
  maxCostPerHour: 1.1,
  parCostPerHour: 0.97,
  explain: bi(
    'Bản khởi điểm trả tiền cho phần cứng ở sai chỗ: 8 instance API và SQL ×2 (~$2.8/giờ) vẫn gục ở đỉnh 20.000 RPS vì mọi lượt đọc đều phải đi về origin. Kiến trúc mẫu đặt $0.10 vào CDN để ~95% lượt đọc dừng ở biên; origin chỉ còn ~780 RPS lúc thường và ~1.950 RPS ở đỉnh. Với lượng đó, hai cụm API 1 instance (3.600 RPS tổng) là đủ, và mỗi cụm một mình vẫn gánh được ~780 RPS khi cụm kia chết. NoSQL ($0.50) thay SQL ×2 ($1.84) vì dữ liệu bài/bình luận truy cập theo khoá và đỉnh 1.950 RPS vượt một SQL ×1. Load Balancer ($0.025) là khoản rẻ nhưng bắt buộc: thiếu nó, CDN vẫn gửi nửa lưu lượng vào cụm đã chết. Tổng ≈ $0.83/giờ, giảm ~70% (chuẩn 3★ ≤ $0.97/giờ). Đánh đổi: dữ liệu cache ở biên có thể cũ tới hết TTL, và NoSQL mất khả năng truy vấn quan hệ/JOIN.',
    'The starter pays for hardware in the wrong places: 8 API instances and a ×2 SQL (~$2.8/hr) still collapse at the 20,000 RPS peak because every read travels to the origin. The reference puts $0.10 into a CDN so ~95% of reads stop at the edge; the origin sees only ~780 RPS normally and ~1,950 RPS at peak. For that, two 1-instance API pools (3,600 RPS total) are enough, and either pool alone still carries ~780 RPS when the other dies. NoSQL ($0.50) replaces the ×2 SQL ($1.84) because article/comment data is accessed by key and the 1,950 RPS peak exceeds a ×1 SQL. The Load Balancer ($0.025) is cheap but essential: without it the CDN keeps sending half the traffic to a dead pool. Total ≈ $0.83/hr, ~70% cheaper (3★ par ≤ $0.97/hr). Trade-offs: edge-cached content can be stale until its TTL expires, and NoSQL gives up relational queries/JOINs.'
  ),
};

/* ───────────── SOCIAL FEED: FAN-OUT, NGƯỜI NỔI TIẾNG & ĐỈNH ĐĂNG BÀI ───────────── */
const FEED_STEADY = { kind: 'steady', rps: 9000 } as const;
/** Mỗi thao tác timeline (đọc/ghi một trang feed lớn) nặng hơn key-value thường: ~1.500 ops/shard. */
const TIMELINE_OPS = 1500;
const TIMELINE_LABEL = bi('Timeline NoSQL (~1.500 ops/shard)', 'Timeline NoSQL (~1,500 ops/shard)');
const FEED_POST_STORM = {
  kind: 'spike',
  base: 6000,
  peak: 12000,
  atSec: 15,
  holdSec: 10,
  riseSec: 3,
  fallSec: 5,
} as const;

const socialFeed: LabChallengeSpec = {
  id: 'lab-16-social-feed',
  code: 'LAB-16',
  ...LEVEL,
  concepts: [
    bi('News feed', 'News feed'),
    bi('Fan-out on write', 'Fan-out on write'),
    bi('Khóa nóng', 'Hot key'),
    bi('Nhiều kịch bản', 'Multi-scenario'),
  ],
  estMinutes: 40,
  sourceRef: [
    {
      path: 'phase-5/lessons/lesson-3-social-feed-systems.mdx',
      phase: 5,
      title: bi('Hệ thống Social Feed', 'Social feed systems'),
    },
    {
      path: 'phase-5/lessons/lesson-2-head-heavy-systems.mdx',
      phase: 5,
      title: bi('Hệ thống đọc nặng', 'Read-heavy systems'),
    },
  ],
  title: bi(
    'Social feed: đọc timeline, cơn bão đăng bài và người nổi tiếng',
    'Social Feed: Timeline Reads, a Posting Storm and a Celebrity'
  ),
  summary: bi(
    'Timeline 9.000 RPS đọc, rồi một cơn bão đăng bài (đỉnh 4.800 lượt ghi/giây), rồi một người nổi tiếng làm 70% lưu lượng dồn vào một khoá. Kết hợp cache timeline, fan-out bất đồng bộ qua Queue và chia khoá nóng trên NoSQL.',
    'A 9,000 RPS timeline read load, then a posting storm (peak 4,800 writes/s), then a celebrity driving 70% of traffic to one key. Combine a timeline cache, asynchronous fan-out through a Queue, and hot-key splitting on NoSQL.'
  ),
  prompt: bi(
    'Mạng xã hội nhỏ phục vụ timeline: mỗi lượt đọc lấy feed đã dựng sẵn của người dùng, mỗi bài đăng mới phải được "fan-out" (ghi vào timeline của người theo dõi). Bản khởi điểm: Feed API (3 instance) đọc/ghi đồng bộ thẳng vào Timeline NoSQL 3 shard; mỗi thao tác timeline khá nặng nên mỗi shard chỉ chịu ~1.500 ops/giây. Thiết kế phải qua ba kịch bản:\n\n1. Đọc timeline: 9.000 RPS ổn định, 90% đọc. p99 ≤ 100 ms.\n2. Bão đăng bài (sự kiện thể thao): tải từ 6.000 lên 12.000 RPS, 40% là đăng bài (đỉnh 4.800 lượt ghi/giây). Fan-out không được làm kho timeline quá tải.\n3. Người nổi tiếng: 9.000 RPS với 30% là tương tác ghi (bình luận, thích); từ giây 10, 70% lưu lượng xuống kho dồn vào bài của một tài khoản. Một khoá luôn rơi vào ĐÚNG MỘT shard.\n\nGợi ý đọc lại LAB-02 (Queue) và LAB-05 (khóa nóng): bài này ghép chúng trong một hệ thống feed thật.',
    "A small social network serves timelines: each read fetches the user's precomputed feed, each new post must be \"fanned out\" (written into followers' timelines). Starter: a Feed API (3 instances) reading/writing synchronously straight into a 3-shard Timeline NoSQL; timeline operations are heavy, so each shard handles only ~1,500 ops/s. The design must pass three scenarios:\n\n1. Timeline reads: steady 9,000 RPS, 90% reads. p99 ≤ 100 ms.\n2. Posting storm (a sports event): load goes from 6,000 to 12,000 RPS with 40% posts (peak 4,800 writes/s). Fan-out must not overload the timeline store.\n3. Celebrity: 9,000 RPS with 30% write interactions (comments, likes); from second 10, 70% of the traffic reaching the store targets one account's post. A single key always lands on EXACTLY ONE shard.\n\nRevisit LAB-02 (Queue) and LAB-05 (hot key): this lab combines them in a real feed system."
  ),
  hints: [
    bi(
      'Kịch bản 1: 9.000 RPS cần tối thiểu 5 instance Feed API (9.000 RPS), quá sát ngưỡng. Dùng 7 (12.600) phía sau Load Balancer để gánh cả bão đăng bài 12.000 RPS. Cache nằm sau API nên không giảm tải cho API.',
      'Scenario 1: 9,000 RPS needs ≥ 5 Feed API instances (9,000 RPS); use 7 (12,600) behind a Load Balancer to also cover the 12,000 RPS storm. A Cache sits behind the API, so the API still receives every request.'
    ),
    bi(
      'Đặt Timeline Cache (carries "r") trước NoSQL: ~90% lượt đọc timeline trúng cache, kho chỉ nhận phần trượt + phần ghi.',
      'Put a Timeline Cache (carries "r") in front of NoSQL: ~90% of timeline reads hit the cache, and the store only sees misses + writes.'
    ),
    bi(
      'Kịch bản 2: đăng bài đi Feed API → Post Queue (async, "w", DLQ) → Fan-out Worker (pull) → NoSQL. 6 Worker rút 3.000 lượt ghi/giây; phần đỉnh xếp hàng trong Queue thay vì dồn thẳng vào kho.',
      'Scenario 2: posts go Feed API → Post Queue (async, "w", DLQ) → Fan-out Worker (pull) → NoSQL. 6 Workers drain 3,000 writes/s; the peak queues up instead of hitting the store directly.'
    ),
    bi(
      'Kịch bản 3: ~2.700 lượt ghi/giây tới kho; với khoá nóng 70%, shard nóng nhận ≥ 70% số đó (~1.900–2.000 ops/giây) dù có 6 hay 32 shard, vượt 1.500 ops của một shard. Bật "Salt khoá nóng" (hotKeySalt = 4) để chia khoá đó ra 4 khoá con trên 4 shard; dùng 6 shard để phần tải nền cũng mỏng hơn.',
      'Scenario 3: ~2,700 writes/s reach the store; with a 70% hot key the hot shard gets ≥ 70% of that (~1,900–2,000 ops/s) whether you run 6 or 32 shards, above the 1,500 ops a shard handles. Enable "Hot-key salt" (hotKeySalt = 4) to split that key into 4 sub-keys on 4 shards; use 6 shards so the background load thins out too.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'feed-api', bi('Feed API', 'Feed API'), 'az-a', { replicas: 3 }),
        node('nosql', 'timeline', TIMELINE_LABEL, 'az-a', {
          opsPerSec: TIMELINE_OPS,
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'feed-api', 1500),
        sync('api-timeline', 'feed-api', 'timeline', 500),
      ],
      routes: { client: 'split', lb: 'split', 'feed-api': 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      'feed-api': { col: 3, row: 2 },
      timeline: { col: 5, row: 2 },
    },
    FEED_STEADY,
    0.9
  ),
  blank: makeBlankPreset(FEED_STEADY, 0.9),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'feed-api', bi('Feed API', 'Feed API'), 'az-a', { replicas: 7 }),
        node('cache', 'timeline-cache', bi('Timeline Cache', 'Timeline Cache'), 'az-a', {
          params: { ttlSec: 300, ttlJitterPct: 0.15 },
        }),
        node('queue', 'post-queue', bi('Post Queue', 'Post Queue'), 'az-a', {
          params: { dlq: true, maxDepth: 200000 },
        }),
        node('worker', 'fanout', bi('Fan-out Worker', 'Fan-out Worker'), 'az-a', { replicas: 6 }),
        node('nosql', 'timeline', TIMELINE_LABEL, 'az-a', {
          opsPerSec: TIMELINE_OPS,
          params: { shards: 6, hotKeySalt: 4 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'feed-api', 1500),
        sync('api-cache', 'feed-api', 'timeline-cache', 300, { carries: 'r' }),
        sync('cache-timeline', 'timeline-cache', 'timeline', 500, { carries: 'r' }),
        { id: 'api-queue', from: 'feed-api', to: 'post-queue', mode: 'async', carries: 'w' },
        { id: 'queue-fanout', from: 'post-queue', to: 'fanout', mode: 'pull', carries: 'w' },
        sync('fanout-timeline', 'fanout', 'timeline', 1000, { carries: 'w' }),
      ],
      routes: {
        client: 'split',
        lb: 'split',
        'feed-api': 'all-sequential',
        'timeline-cache': 'split',
        fanout: 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      'feed-api': { col: 2, row: 2 },
      'timeline-cache': { col: 4, row: 1 },
      'post-queue': { col: 3, row: 4 },
      fanout: { col: 5, row: 4 },
      timeline: { col: 6, row: 2 },
    },
    FEED_STEADY,
    0.9
  ),
  topology: [
    requireKinds(
      'topo-cache',
      bi('Có Timeline Cache cho lượt đọc', 'Has a Timeline Cache for reads'),
      ['cache'],
      bi('≥ 1 Cache', '≥ 1 Cache')
    ),
    requireLink(
      'topo-fanout-async',
      bi(
        'Fan-out chạy bất đồng bộ qua Queue → Worker (pull)',
        'Fan-out runs asynchronously via Queue → Worker (pull)'
      ),
      (l, m) => l.mode === 'pull' && kindOf(m, l.from) === 'queue' && kindOf(m, l.to) === 'worker',
      bi('Queue → Worker (pull)', 'Queue → Worker (pull)'),
      bi('Chưa có Queue → Worker', 'No Queue → Worker')
    ),
    {
      id: 'topo-hot-key',
      label: bi(
        'NoSQL chia khoá nóng (hotKeySalt ≥ 2)',
        'NoSQL splits the hot key (hotKeySalt ≥ 2)'
      ),
      check: (model) => {
        const reach = reachable(model);
        const stores = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'nosql');
        const ok = stores.length > 0 && stores.every((n) => Number(n.params.hotKeySalt ?? 1) >= 2);
        return {
          pass: ok,
          got:
            stores.length === 0
              ? bi('Không có NoSQL', 'No NoSQL')
              : ok
                ? bi('Đã bật salting', 'Salting enabled')
                : bi('Chưa salting', 'No salting'),
          want: bi('hotKeySalt ≥ 2', 'hotKeySalt ≥ 2'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'timeline-reads',
      label: bi('1 · Đọc timeline 9.000 RPS (90% đọc)', '1 · Timeline reads 9,000 RPS (90% read)'),
      durationSec: 60,
      load: FEED_STEADY,
      readRatio: 0.9,
      clientTimeoutMs: 2000,
      constraints: [
        {
          label: bi('Độ trễ p99 ≤ 100 ms', 'Latency p99 ≤ 100 ms'),
          constraint: {
            id: 'p99-100',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 100,
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
      ],
    },
    {
      id: 'post-storm',
      label: bi(
        '2 · Bão đăng bài 6.000 → 12.000 RPS (40% ghi)',
        '2 · Posting storm 6,000 → 12,000 RPS (40% writes)'
      ),
      durationSec: 60,
      load: FEED_POST_STORM,
      readRatio: 0.6,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 0, toSec: 60 },
        allowViolationPct: 2,
        label: bi(
          'Kho timeline không rơi vào overloaded/down',
          'Timeline store never overloaded/down'
        ),
      },
      constraints: [
        {
          label: bi('Tỉ lệ lỗi ≤ 1,0%', 'Error rate ≤ 1.0%'),
          constraint: {
            id: 'err-1pct',
            kind: 'slo-error',
            maxRate: 0.01,
            window: { fromSec: 0, toSec: 60 },
          },
        },
        {
          label: bi('Độ trễ p99 ≤ 150 ms', 'Latency p99 ≤ 150 ms'),
          constraint: {
            id: 'p99-150',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 150,
            window: { fromSec: 0, toSec: 60 },
            allowViolationPct: 3,
          },
        },
      ],
    },
    {
      id: 'celebrity',
      label: bi(
        '3 · Người nổi tiếng: 30% tương tác ghi, khoá nóng 70% từ giây 10',
        '3 · Celebrity: 30% write interactions, 70% hot key from 10s'
      ),
      durationSec: 60,
      load: FEED_STEADY,
      readRatio: 0.7,
      clientTimeoutMs: 2000,
      dynamicHotKeyOnNosql: { at: 10, share: 0.7, durationSec: 45 },
      dynamicDbNoOverload: {
        window: { fromSec: 5, toSec: 60 },
        allowViolationPct: 2,
        label: bi(
          'Kho timeline không overloaded kể cả có shard nóng',
          'Timeline store stays below overload even with a hot shard'
        ),
      },
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
      ],
    },
  ],
  structural: [
    {
      requiredForPass: true,
      label: bi(
        'Queue bật Dead-Letter Queue (dlq = true)',
        'Queue enables Dead-Letter Queue (dlq = true)'
      ),
      constraint: { id: 'struct-dlq', kind: 'structural', rule: 'has-dlq' },
    },
    {
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
  ],
  maxCostPerHour: 3.2,
  parCostPerHour: 2.45,
  explain: bi(
    'Ba kịch bản, ba nút thắt. (1) 9.000 RPS đọc: 7 instance Feed API (12.600 RPS) sau LB, Timeline Cache chặn ~90% lượt đọc. (2) Bão đăng bài: 4.800 lượt ghi/giây đi đồng bộ sẽ chồng lên lượt đọc trượt ở cùng kho; Queue + 6 Fan-out Worker (3.000 lượt ghi/giây) san phẳng đỉnh, phần dư xếp hàng và rút dần. (3) Người nổi tiếng: 70% tải kho dồn vào một khoá, tức một shard: với 6 shard không salting, shard nóng nhận 0,7 + 0,3/6 = 75% của ~2.700 ops ≈ 2.025 ops/giây > 1.500 nên quá tải, và 32 shard cũng chỉ hạ xuống ~71%. hotKeySalt = 4 chia khoá ra 4 shard: 0,7/4 + 0,3/6 ≈ 23% ≈ 610 ops/giây (ρ ≈ 0,4). Chi phí ≈ $2.10/giờ (chuẩn 3★ ≤ $2.45/giờ). Đánh đổi: fan-out bất đồng bộ làm bài mới xuất hiện trên timeline trễ vài giây; salting buộc lượt đọc khoá nóng phải gom từ nhiều khoá con. Hệ thống thật còn dùng mô hình lai: fan-out-on-read cho tài khoản quá nhiều người theo dõi.',
    'Three scenarios, three bottlenecks. (1) 9,000 RPS of reads: 7 Feed API instances (12,600 RPS) behind the LB, with a Timeline Cache absorbing ~90% of reads. (2) Posting storm: 4,800 synchronous writes/s would stack on top of read misses at the same store; Queue + 6 Fan-out Workers (3,000 writes/s) flatten the peak, and the excess queues up and drains. (3) Celebrity: 70% of store traffic lands on one key, i.e. one shard: with 6 unsalted shards the hot shard takes 0.7 + 0.3/6 = 75% of ~2,700 ops ≈ 2,025 ops/s > 1,500, so it overloads, and 32 shards only bring that down to ~71%. hotKeySalt = 4 splits the key over 4 shards: 0.7/4 + 0.3/6 ≈ 23% ≈ 610 ops/s (ρ ≈ 0.4). Cost ≈ $2.10/hr (3★ par ≤ $2.45/hr). Trade-offs: async fan-out makes new posts show up in timelines a few seconds late; salting forces reads of the hot key to gather several sub-keys. Real systems also go hybrid: fan-out-on-read for accounts with huge follower counts.'
  ),
};

export const EXPERT_LABS: LabChallengeSpec[] = [blackFriday, tightBudget, socialFeed];
