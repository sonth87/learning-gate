/* Bài Lab cấp NHẬP MÔN (beginner) — bổ sung cho LAB-01. */
import type { SystemModel } from '@/features/sysdesign-course/sim';
import type { LabChallengeSpec } from '../labChallenges';
import {
  bi,
  blankWithFixed,
  clientNode,
  makeBlankPreset,
  node,
  preset,
  requireKinds,
  requireMinReplicas,
  sync,
  reachable,
} from './shared';

const LEVEL = { level: 'beginner', difficulty: 1, xp: 30 } as const;

/* ───────────── LAB-06. SCALE-OUT ĐẦU TIÊN SAU LOAD BALANCER ───────────── */
const SCALE_OUT_LOAD = { kind: 'ramp', from: 1500, to: 6000, overSec: 40 } as const;

const scaleOut: LabChallengeSpec = {
  id: 'lab-06-first-scale-out',
  code: 'LAB-06',
  ...LEVEL,
  concepts: [
    bi('Scale ngang', 'Horizontal scaling'),
    bi('Load Balancer', 'Load Balancer'),
    bi('Stateless', 'Stateless'),
  ],
  estMinutes: 10,
  sourceRef: [
    {
      path: 'phase-2/lessons/lesson-1-load-balancing.mdx',
      phase: 2,
      title: bi('Load Balancing', 'Load Balancing'),
    },
    {
      path: 'phase-0/lessons/lesson-5-scale-intuition.mdx',
      phase: 0,
      title: bi('Trực giác về quy mô', 'Scale intuition'),
    },
  ],
  title: bi(
    'Scale-out đầu tiên: từ 1 máy lên cụm sau Load Balancer',
    'Your First Scale-Out: From One Box to a Pool Behind a Load Balancer'
  ),
  summary: bi(
    'Lưu lượng tăng dần từ 1.500 lên 6.000 RPS. Một instance API chỉ chịu 1.800 RPS — hãy đặt Load Balancer và tính đúng số instance để p99 ≤ 100 ms, lỗi ≤ 1%.',
    'Traffic ramps from 1,500 to 6,000 RPS. One API instance handles only 1,800 RPS: add a Load Balancer and size the pool so p99 ≤ 100 ms and errors ≤ 1%.'
  ),
  prompt: bi(
    'Ứng dụng hồ sơ người dùng vừa lên báo, lưu lượng tăng đều từ 1.500 RPS lên 6.000 RPS trong 40 giây rồi giữ nguyên (80% đọc, 20% ghi). Bản khởi điểm chỉ có MỘT instance Profile API nối thẳng xuống kho NoSQL (3 shard, dư sức chịu tải). Khi tải vượt 1.800 RPS, instance duy nhất bão hoà: hàng đợi phình to, request bị rớt.\n\nHãy mở rộng theo chiều ngang (scale-out): đặt Load Balancer phía trước và chạy nhiều instance API giống hệt nhau. Vì API không giữ trạng thái (stateless, dữ liệu nằm ở NoSQL), bất kỳ instance nào cũng phục vụ được bất kỳ request nào. Mục tiêu: p99 ≤ 100 ms, lỗi ≤ 1% suốt quá trình tăng tải.',
    'A profile app just got press coverage: traffic ramps evenly from 1,500 RPS to 6,000 RPS over 40 seconds and then holds (80% reads, 20% writes). The starter runs ONE Profile API instance wired straight to a NoSQL store (3 shards, plenty of headroom). Once load passes 1,800 RPS the single instance saturates: its queue grows and requests get dropped.\n\nScale out horizontally: put a Load Balancer in front and run several identical API instances. Because the API is stateless (data lives in NoSQL), any instance can serve any request. Goal: p99 ≤ 100 ms and errors ≤ 1% throughout the ramp.'
  ),
  hints: [
    bi(
      'Tính trước khi kéo thả: đỉnh tải 6.000 RPS ÷ 1.800 RPS/instance ≈ 3,3. Vậy 3 instance (5.400 RPS) là KHÔNG đủ ở đỉnh, cần ít nhất 4.',
      'Do the math before dragging boxes: peak 6,000 RPS ÷ 1,800 RPS per instance ≈ 3.3. So 3 instances (5,400 RPS) are NOT enough at peak; you need at least 4.'
    ),
    bi(
      'Đừng chạy sát 100%: ở độ tải ρ = λ/μ gần 1, thời gian chờ trong hàng đợi tăng vọt. 4 instance (7.200 RPS) cho ρ ≈ 0,83 ở đỉnh, vẫn còn dư địa.',
      'Do not run at 100%: as utilization ρ = λ/μ approaches 1, queueing delay explodes. 4 instances (7,200 RPS) give ρ ≈ 0.83 at peak, leaving headroom.'
    ),
    bi(
      'Thêm node Load Balancer, nối Người dùng → LB → Profile API, rồi tăng "Số instance" của Profile API. LB mặc định chịu 20.000 RPS nên không thành nút cổ chai.',
      'Add a Load Balancer node, wire Clients → LB → Profile API, then raise the Profile API "Instances" knob. A default LB handles 20,000 RPS, so it will not become the bottleneck.'
    ),
    bi(
      'Muốn 3★: giữ chi phí ≤ $1.10/giờ. Thêm instance thứ 5, 6 vẫn đạt nhưng tốn tiền vô ích ở tải này.',
      'For 3★ keep cost ≤ $1.10/hr. A 5th or 6th instance still passes but wastes money at this load.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('service', 'api', bi('Profile API', 'Profile API'), 'az-a', { replicas: 1 }),
        node('nosql', 'store', bi('Profile NoSQL', 'Profile NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [sync('client-api', 'client', 'api', 2000), sync('api-store', 'api', 'store', 500)],
      routes: { client: 'split', api: 'all-sequential' },
    },
    { client: { col: 0, row: 2 }, api: { col: 3, row: 2 }, store: { col: 5, row: 2 } },
    SCALE_OUT_LOAD,
    0.8
  ),
  blank: makeBlankPreset(SCALE_OUT_LOAD, 0.8),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a', {
          params: { healthCheckSec: 3 },
        }),
        node('service', 'api', bi('Profile API', 'Profile API'), 'az-a', { replicas: 4 }),
        node('nosql', 'store', bi('Profile NoSQL', 'Profile NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-store', 'api', 'store', 500),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 3, row: 2 },
      store: { col: 5, row: 2 },
    },
    SCALE_OUT_LOAD,
    0.8
  ),
  topology: [
    requireKinds(
      'topo-lb',
      bi('Có Load Balancer chia tải', 'Has a Load Balancer spreading load'),
      ['lb'],
      bi('≥ 1 Load Balancer', '≥ 1 Load Balancer')
    ),
    requireMinReplicas(
      'topo-api-pool',
      bi('Cụm API ≥ 4 instance (ρ < 0,85 ở đỉnh)', 'API pool ≥ 4 instances (ρ < 0.85 at peak)'),
      'service',
      4
    ),
  ],
  scenarios: [
    {
      id: 'ramp-6k',
      label: bi('Tải tăng dần 1.500 → 6.000 RPS (80% đọc)', 'Ramp 1,500 → 6,000 RPS (80% read)'),
      durationSec: 60,
      load: SCALE_OUT_LOAD,
      readRatio: 0.8,
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
        {
          label: bi('Goodput trung bình ≥ 4.700 RPS', 'Average goodput ≥ 4,700 RPS'),
          constraint: {
            id: 'goodput-4700',
            kind: 'throughput',
            minGoodputRps: 4700,
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
  ],
  maxCostPerHour: 2.0,
  parCostPerHour: 1.1,
  explain: bi(
    'Một instance chịu 1.800 RPS nên bản khởi điểm vỡ ngay khi tải vượt ngưỡng đó (khoảng giây 6 của đợt tăng tải). Scale ngang giải quyết bằng phép chia đơn giản: 6.000 ÷ 1.800 ≈ 3,3 → làm tròn lên 4 instance (7.200 RPS, ρ ≈ 0,83 ở đỉnh). Load Balancer biến 4 máy thành một "cửa" duy nhất cho client, và vì API stateless nên chia tải kiểu round-robin là đủ. Chi phí ≈ $0.93/giờ (LB $0.025 + 4 × $0.10 + NoSQL $0.50; chuẩn 3★ ≤ $1.10/giờ). Ghi nhớ: scale ngang chỉ dễ khi tầng đó stateless; trạng thái phải nằm ở kho dữ liệu dùng chung.',
    'One instance handles 1,800 RPS, so the starter breaks as soon as load passes that point (around second 6 of the ramp). Horizontal scaling fixes it with simple division: 6,000 ÷ 1,800 ≈ 3.3 → round up to 4 instances (7,200 RPS, ρ ≈ 0.83 at peak). The Load Balancer turns 4 boxes into a single entry point, and since the API is stateless plain round-robin is enough. Cost ≈ $0.93/hr (LB $0.025 + 4 × $0.10 + NoSQL $0.50; 3★ par ≤ $1.10/hr). Remember: scaling out is only easy when the tier is stateless; state must live in the shared data store.'
  ),
};

/* ───────────── LAB-07. TÌM ĐÚNG NÚT CỔ CHAI ───────────── */
const BOTTLENECK_LOAD = { kind: 'steady', rps: 1200 } as const;

const bottleneck: LabChallengeSpec = {
  id: 'lab-07-real-bottleneck',
  code: 'LAB-07',
  ...LEVEL,
  concepts: [
    bi('Nút cổ chai', 'Bottleneck'),
    bi('Connection pool', 'Connection pool'),
    bi('Định luật Little', "Little's Law"),
  ],
  estMinutes: 12,
  sourceRef: [
    {
      path: 'phase-4/lessons/lesson-1-performance-bottleneck-thinking.mdx',
      phase: 4,
      title: bi('Tư duy nút cổ chai hiệu năng', 'Performance bottleneck thinking'),
    },
    {
      path: 'phase-1/lessons/lesson-3-data-flow-and-bottlenecks.mdx',
      phase: 1,
      title: bi('Luồng dữ liệu & nút cổ chai', 'Data flow & bottlenecks'),
    },
  ],
  title: bi(
    'Thêm máy mà vẫn chậm? Tìm đúng nút cổ chai',
    'More Servers, Still Slow? Find the Real Bottleneck'
  ),
  summary: bi(
    'Đội ngũ đã tăng lên 6 instance API mà hệ thống 1.200 RPS vẫn nghẽn. Nút cổ chai thật nằm ở connection pool của SQL. Sửa đúng chỗ và cắt phần thừa để đạt SLO với chi phí ≤ $1.20/giờ.',
    'The team scaled the API to 6 instances, yet the 1,200 RPS system still chokes. The real bottleneck is the SQL connection pool. Fix the right thing and trim the waste to meet the SLO at ≤ $1.20/hr.'
  ),
  prompt: bi(
    'Dịch vụ đặt lịch khám nhận ổn định 1.200 RPS (70% đọc, 30% ghi). Mỗi lần có cảnh báo chậm, đội vận hành lại thêm instance API, giờ đã là 6 instance (10.800 RPS năng lực) mà p99 vẫn vượt mức và request vẫn lỗi. Thêm máy ở sai tầng không giúp gì: request vẫn phải xếp hàng ở tầng chậm nhất.\n\nHãy quan sát ρ (độ tải) của từng thành phần, tìm tầng thực sự bão hoà và sửa đúng tầng đó. Mục tiêu: p99 ≤ 80 ms, lỗi ≤ 1%, SQL không quá tải, và vì ngân sách eo hẹp, chi phí ≤ $1.20/giờ cho 3★.',
    'An appointment-booking service receives a steady 1,200 RPS (70% reads, 30% writes). Every time latency alerts fired the team added API instances; there are now 6 (10,800 RPS of capacity) yet p99 is still over target and requests still fail. Adding servers to the wrong tier does nothing: requests still queue at the slowest tier.\n\nWatch ρ (utilization) of each component, find the tier that is actually saturated and fix that one. Goal: p99 ≤ 80 ms, errors ≤ 1%, SQL never overloaded, and because the budget is tight, cost ≤ $1.20/hr for 3★.'
  ),
  hints: [
    bi(
      'Chạy mô phỏng và so ρ: tầng API chỉ ở ρ ≈ 0,11 trong khi SQL ở ρ > 1. Nút cổ chai là tầng có ρ cao nhất, không phải tầng bạn thấy "đông máy" nhất.',
      'Run the simulation and compare ρ: the API tier sits at ρ ≈ 0.11 while SQL is above ρ = 1. The bottleneck is the tier with the highest ρ, not the tier that looks busiest to you.'
    ),
    bi(
      'Định luật Little: số kết nối cần ≈ λ × S. Mỗi truy vấn SQL mất ~4 ms, nên pool 4 kết nối chỉ phục vụ tối đa 4 ÷ 0,004 = 1.000 truy vấn/giây, thấp hơn 1.200 RPS. Đây là trần do pool, không phải do CPU của máy SQL (1.600 RPS).',
      "Little's Law: connections needed ≈ λ × S. Each SQL query takes ~4 ms, so a 4-connection pool serves at most 4 ÷ 0.004 = 1,000 queries/s, below 1,200 RPS. This ceiling comes from the pool, not from the SQL machine's CPU (1,600 RPS)."
    ),
    bi(
      'Nâng "Connection pool" của SQL lên khoảng 12 (12 ÷ 0,004 = 3.000 > 1.600, nên trần quay về 1.600 RPS của máy). Không cần nâng cỡ máy SQL.',
      'Raise the SQL "Connection pool" to about 12 (12 ÷ 0.004 = 3,000 > 1,600, so the ceiling returns to the machine limit of 1,600 RPS). No need to scale the SQL machine up.'
    ),
    bi(
      'Sau đó cắt bớt instance API: 1.200 RPS chỉ cần 1 instance (1.800 RPS); giữ 2 instance để có dư địa. Như vậy chi phí ≈ $1.03/giờ.',
      'Then trim the API tier: 1,200 RPS needs only 1 instance (1,800 RPS); keep 2 for headroom. That brings cost to ≈ $1.03/hr.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Booking API', 'Booking API'), 'az-a', { replicas: 6 }),
        node('sql', 'db', bi('Booking SQL', 'Booking SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 4 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-db', 'api', 'db', 800),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 3, row: 2 },
      db: { col: 5, row: 2 },
    },
    BOTTLENECK_LOAD,
    0.7
  ),
  blank: makeBlankPreset(BOTTLENECK_LOAD, 0.7),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Booking API', 'Booking API'), 'az-a', { replicas: 2 }),
        node('sql', 'db', bi('Booking SQL', 'Booking SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 12 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-db', 'api', 'db', 800),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 3, row: 2 },
      db: { col: 5, row: 2 },
    },
    BOTTLENECK_LOAD,
    0.7
  ),
  topology: [
    {
      id: 'topo-sql-pool',
      label: bi(
        'Connection pool SQL đủ cho λ × S (≥ 8)',
        'SQL connection pool sized for λ × S (≥ 8)'
      ),
      check: (model) => {
        const reach = reachable(model);
        const dbs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'sql');
        const pools = dbs.map((n) => Number(n.params.poolSize ?? 7));
        const ok = dbs.length > 0 && pools.every((p) => p >= 8);
        return {
          pass: ok,
          got:
            dbs.length > 0
              ? bi(`pool = ${pools.join(', ')}`, `pool = ${pools.join(', ')}`)
              : bi('Chưa có SQL', 'No SQL'),
          want: bi('pool ≥ 8', 'pool ≥ 8'),
        };
      },
    },
    {
      id: 'topo-api-rightsized',
      label: bi('Tầng API vừa đủ (≤ 3 instance)', 'Right-sized API tier (≤ 3 instances)'),
      check: (model) => {
        const reach = reachable(model);
        const total = model.nodes
          .filter((n) => reach.has(n.id) && n.kind === 'service')
          .reduce(
            (acc, n) => acc + Math.max(1, Math.round(Number(n.params.replicas ?? n.replicas))),
            0
          );
        return {
          pass: total >= 1 && total <= 3,
          got: bi(`${total} instance`, `${total} instances`),
          want: bi('1–3 instance', '1–3 instances'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'steady-1200',
      label: bi('Tải ổn định 1.200 RPS (70% đọc)', 'Steady 1,200 RPS (70% read)'),
      durationSec: 60,
      load: BOTTLENECK_LOAD,
      readRatio: 0.7,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 5, toSec: 60 },
        allowViolationPct: 2,
        label: bi('SQL không rơi vào overloaded/down', 'SQL never overloaded/down'),
      },
      constraints: [
        {
          label: bi('Độ trễ p99 ≤ 80 ms', 'Latency p99 ≤ 80 ms'),
          constraint: {
            id: 'p99-80',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 80,
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
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
  ],
  maxCostPerHour: 1.8,
  parCostPerHour: 1.2,
  explain: bi(
    'Năng lực của một tầng là min(CPU, pool ÷ thời gian phục vụ). Với pool = 4 và mỗi truy vấn 4 ms, SQL chỉ phục vụ 1.000 truy vấn/giây dù máy chịu được 1.600; ở 1.200 RPS hàng đợi tăng mãi và request bị rớt. 6 instance API (ρ ≈ 0,11) chỉ làm hoá đơn tăng: thêm máy ở tầng không nghẽn không đổi được thông lượng toàn hệ thống. Nâng pool lên 12 (định luật Little: cần ≥ λ × S ≈ 1.200 × 0,004 ≈ 5 kết nối đang bận, cộng dư địa) đưa trần SQL về 1.600 RPS (ρ ≈ 0,75), rồi cắt API xuống 2 instance: chi phí ≈ $1.03/giờ thay vì $1.43/giờ (chuẩn 3★ ≤ $1.20/giờ). Nâng cỡ SQL ×2 cũng thoát nghẽn nhưng tốn ~$1.84/giờ, vượt trần ngân sách.',
    "A tier's capacity is min(CPU, pool ÷ service time). With a pool of 4 and 4 ms per query, SQL serves only 1,000 queries/s even though the machine could do 1,600; at 1,200 RPS the queue grows forever and requests drop. Six API instances (ρ ≈ 0.11) only inflate the bill: adding servers to a tier that is not the bottleneck cannot raise system throughput. Raising the pool to 12 (Little's Law: you need ≥ λ × S ≈ 1,200 × 0.004 ≈ 5 busy connections, plus headroom) restores the SQL ceiling to 1,600 RPS (ρ ≈ 0.75); then trim the API to 2 instances: cost ≈ $1.03/hr instead of $1.43/hr (3★ par ≤ $1.20/hr). Scaling SQL up ×2 also clears the bottleneck but costs ~$1.84/hr, over the budget cap."
  ),
};

/* ───────────── LAB-08. TIMEOUT + FALLBACK CHO DEPENDENCY CHẬM ───────────── */
const TIMEOUT_LOAD = { kind: 'steady', rps: 2500 } as const;
const reviewsServices = (model: SystemModel) =>
  model.nodes.filter(
    (n) =>
      n.kind === 'service' &&
      (n.id === 'reviews' || /review|đánh giá/i.test(`${n.label.vi} ${n.label.en}`))
  );
const REVIEWS_SLOWDOWN = [
  { at: 20, type: 'slowdown', node: 'reviews', addMs: 400, durationSec: 25 },
] as const;

const timeoutFallback: LabChallengeSpec = {
  id: 'lab-08-timeout-fallback',
  code: 'LAB-08',
  ...LEVEL,
  concepts: [
    bi('Timeout', 'Timeout'),
    bi('Fallback / degrade', 'Fallback / degrade'),
    bi('Dependency chậm', 'Slow dependency'),
  ],
  estMinutes: 15,
  sourceRef: [
    {
      path: 'phase-3/lessons/lesson-1-reality-of-distributed-systems.mdx',
      phase: 3,
      title: bi('Thực tế của hệ phân tán', 'Reality of distributed systems'),
    },
    {
      path: 'phase-1/lessons/lesson-2-communication-patterns.mdx',
      phase: 1,
      title: bi('Các mẫu giao tiếp', 'Communication patterns'),
    },
  ],
  title: bi(
    'Đừng để widget phụ kéo sập trang chính: timeout + fallback',
    "Don't Let a Side Widget Take Down the Page: Timeout + Fallback"
  ),
  summary: bi(
    'Dịch vụ Đánh giá (reviews) bỗng chậm thêm 400 ms trong 25 giây. Không có timeout, mọi trang sản phẩm treo theo. Đặt timeout và fallback "degrade" để trang vẫn trả về nhanh, lỗi ≤ 1%.',
    'The Reviews service suddenly gets 400 ms slower for 25 seconds. Without a timeout every product page hangs with it. Add a timeout and a "degrade" fallback so pages still return fast with errors ≤ 1%.'
  ),
  prompt: bi(
    'Trang chi tiết sản phẩm nhận 2.500 RPS (90% đọc). Mỗi lượt đọc, Product API gọi tuần tự: kho Catalog (bắt buộc) và Reviews Service (do đội khác vận hành, được khoá trên canvas; chỉ để hiện khối đánh giá, có cũng được, thiếu cũng không sao). Từ giây 20, Reviews bị chậm thêm 400 ms mỗi request trong 25 giây (ví dụ do một truy vấn tệ). Vì đường gọi Product API → Reviews không đặt timeout, request chờ Reviews tới khi client bỏ cuộc: cả trang sản phẩm sập theo một tính năng phụ.\n\nHãy cô lập sự cố: đặt timeout ngắn trên đường gọi Reviews và chọn fallback "degrade" (trả trang không kèm khối đánh giá) để p99 ≤ 250 ms và lỗi ≤ 1% ngay cả trong sự cố; lúc bình thường p99 ≤ 120 ms.',
    'The product detail page receives 2,500 RPS (90% reads). For each read the Product API calls, in sequence, the Catalog store (required) and the Reviews Service (run by another team, locked on the canvas; it only renders the reviews block, nice to have). From second 20 Reviews gets 400 ms slower per request for 25 seconds (say, a bad query). Because Product API → Reviews has no timeout, requests wait for Reviews until the client gives up: the whole product page fails because of an optional feature.\n\nContain the incident: set a short timeout on the Reviews call and choose the "degrade" fallback (return the page without the reviews block) so p99 ≤ 250 ms and errors ≤ 1% even during the incident, and p99 ≤ 120 ms in normal operation.'
  ),
  hints: [
    bi(
      'Chậm còn nguy hiểm hơn chết: một dependency chết trả lỗi ngay, còn một dependency chậm giữ request (và luồng, kết nối) của bạn tới khi hết kiên nhẫn. Không có timeout nghĩa là bạn chờ theo đồng hồ của người khác.',
      "Slow is worse than dead: a dead dependency fails fast, while a slow one holds your requests (threads, connections) until someone gives up. No timeout means you wait on someone else's clock."
    ),
    bi(
      'Chọn link Product API → Reviews, đặt timeoutMs khoảng 100–150 ms. Reviews bình thường trả lời trong ~20 ms, nên timeout này không cắt nhầm request khoẻ.',
      'Select the Product API → Reviews link and set timeoutMs to roughly 100–150 ms. Reviews normally answers in ~20 ms, so this timeout does not cut healthy requests.'
    ),
    bi(
      'Chỉ timeout thôi thì request vẫn LỖI (timeout là lỗi). Đặt fallback = "degrade" trên cùng link: khi Reviews quá hạn, API trả trang không kèm đánh giá, người dùng vẫn thấy sản phẩm.',
      'A timeout alone still turns the request into an ERROR (a timeout is a failure). Set fallback = "degrade" on the same link: when Reviews times out the API returns the page without reviews and users still see the product.'
    ),
    bi(
      'Đừng bật retry "Immediate" vào Reviews lúc nó đang chậm: mỗi lần thử lại cộng thêm tải vào chính dịch vụ đang ngộp. Bật "cancelOnTimeout" giúp Reviews bỏ việc của request đã quá hạn.',
      'Do not enable "Immediate" retries to Reviews while it is slow: every retry adds load to the very service that is drowning. Enabling "cancelOnTimeout" lets Reviews drop work for requests that already timed out.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Product API', 'Product API'), 'az-a', { replicas: 3 }),
        node('nosql', 'catalog', bi('Catalog NoSQL', 'Catalog NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
        node('service', 'reviews', bi('Reviews Service', 'Reviews Service'), 'az-a', {
          replicas: 2,
        }),
        node('nosql', 'reviews-db', bi('Reviews NoSQL', 'Reviews NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1800),
        sync('api-catalog', 'api', 'catalog', 300),
        sync('api-reviews', 'api', 'reviews', undefined, { carries: 'r' }),
        sync('reviews-to-db', 'reviews', 'reviews-db', 300, { carries: 'r' }),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', reviews: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      catalog: { col: 4, row: 1 },
      reviews: { col: 4, row: 3 },
      'reviews-db': { col: 6, row: 3 },
    },
    TIMEOUT_LOAD,
    0.9,
    ['reviews', 'reviews-db']
  ),
  blank: blankWithFixed(
    [
      node('service', 'reviews', bi('Reviews Service', 'Reviews Service'), 'az-a', { replicas: 2 }),
      node('nosql', 'reviews-db', bi('Reviews NoSQL', 'Reviews NoSQL'), 'az-a', {
        params: { shards: 3 },
      }),
    ],
    [sync('reviews-to-db', 'reviews', 'reviews-db', 300, { carries: 'r' })],
    { reviews: { col: 4, row: 3 }, 'reviews-db': { col: 6, row: 3 } },
    TIMEOUT_LOAD,
    0.9,
    { reviews: 'all-sequential' }
  ),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Product API', 'Product API'), 'az-a', { replicas: 3 }),
        node('nosql', 'catalog', bi('Catalog NoSQL', 'Catalog NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
        node('service', 'reviews', bi('Reviews Service', 'Reviews Service'), 'az-a', {
          replicas: 2,
        }),
        node('nosql', 'reviews-db', bi('Reviews NoSQL', 'Reviews NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1800),
        sync('api-catalog', 'api', 'catalog', 300),
        sync('api-reviews', 'api', 'reviews', 120, { carries: 'r', fallback: 'degrade' }),
        sync('reviews-to-db', 'reviews', 'reviews-db', 300, { carries: 'r' }),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', reviews: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      catalog: { col: 4, row: 1 },
      reviews: { col: 4, row: 3 },
      'reviews-db': { col: 6, row: 3 },
    },
    TIMEOUT_LOAD,
    0.9,
    ['reviews', 'reviews-db']
  ),
  topology: [
    {
      id: 'topo-reviews-guarded',
      label: bi(
        'Đường gọi Reviews có timeout + fallback degrade/bypass',
        'Reviews call has a timeout + degrade/bypass fallback'
      ),
      check: (model) => {
        const reviews = new Set(reviewsServices(model).map((n) => n.id));
        const ls = model.links.filter((l) => reviews.has(l.to) && l.mode === 'sync');
        const ok =
          ls.length > 0 &&
          ls.every(
            (l) =>
              l.timeoutMs !== undefined && (l.fallback === 'degrade' || l.fallback === 'bypass')
          );
        return {
          pass: ok,
          got: ok
            ? bi('Có timeout + fallback', 'Timeout + fallback set')
            : bi('Thiếu timeout hoặc fallback', 'Missing timeout or fallback'),
          want: bi('timeoutMs + fallback degrade', 'timeoutMs + degrade fallback'),
        };
      },
    },
    {
      id: 'topo-reviews-kept',
      label: bi(
        'Vẫn giữ tính năng Reviews trên luồng đọc',
        'Reviews feature is still on the read path'
      ),
      check: (model) => {
        const reach = reachable(model);
        const ok = reviewsServices(model).some((n) => reach.has(n.id));
        return {
          pass: ok,
          got: ok
            ? bi('Reviews vẫn được gọi', 'Reviews still called')
            : bi('Đã bỏ Reviews', 'Reviews removed'),
          want: bi('Giữ Reviews Service', 'Keep the Reviews Service'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'reviews-slowdown',
      label: bi(
        '2.500 RPS, Reviews chậm thêm 400 ms (giây 20–45)',
        '2,500 RPS, Reviews +400 ms slower (20–45s)'
      ),
      durationSec: 60,
      load: TIMEOUT_LOAD,
      readRatio: 0.9,
      clientTimeoutMs: 2000,
      events: [...REVIEWS_SLOWDOWN],
      constraints: [
        {
          label: bi('Bình thường (giây 5–20): p99 ≤ 120 ms', 'Normal (5–20s): p99 ≤ 120 ms'),
          constraint: {
            id: 'p99-normal',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 120,
            window: { fromSec: 5, toSec: 20 },
            allowViolationPct: 2,
          },
        },
        {
          label: bi(
            'Trong sự cố (giây 20–45): p99 ≤ 250 ms',
            'During the incident (20–45s): p99 ≤ 250 ms'
          ),
          constraint: {
            id: 'p99-incident',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 250,
            window: { fromSec: 20, toSec: 45 },
            allowViolationPct: 4,
          },
        },
        {
          label: bi('Cả bài (giây 5–60): lỗi ≤ 1,0%', 'Whole run (5–60s): error ≤ 1.0%'),
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
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
    {
      requiredForPass: false,
      label: bi('Retry (nếu có) dùng backoff', 'Retries (if any) use backoff'),
      constraint: { id: 'struct-backoff', kind: 'structural', rule: 'has-retry-backoff' },
    },
  ],
  maxCostPerHour: 2.5,
  parCostPerHour: 1.8,
  explain: bi(
    'Khi Reviews chậm thêm 400 ms, mỗi instance của nó chỉ còn phục vụ ~22 ÷ 0,412 ≈ 53 request/giây (số luồng không đổi, mỗi request giữ luồng lâu hơn), nên hàng đợi phình ra và thời gian chờ lên tới hàng giây. Không có timeout, Product API chờ theo và client hết kiên nhẫn ở 2 giây: gần như mọi lượt đọc thất bại. Timeout 120 ms chặn trên độ trễ của nhánh Reviews; fallback "degrade" biến lần quá hạn thành phản hồi "thiếu khối đánh giá" thay vì lỗi. Kết quả: p99 trong sự cố ≈ 170 ms (≈ 120 ms chờ timeout + ~30 ms mạng internet + phần xử lý), lỗi ≈ 0%, chi phí giữ nguyên ≈ $1.53/giờ (chuẩn 3★ ≤ $1.80/giờ). Đây là "graceful degradation": hy sinh tính năng phụ để giữ tính năng chính.',
    'When Reviews gets 400 ms slower, each of its instances can only serve ~22 ÷ 0.412 ≈ 53 requests/s (same thread count, each request holds a thread longer), so its queue swells and waits reach seconds. Without a timeout the Product API waits along and clients give up at 2 seconds: almost every read fails. A 120 ms timeout caps the Reviews branch latency; the "degrade" fallback turns a timeout into a "page without reviews" response instead of an error. Result: p99 during the incident ≈ 170 ms (≈ 120 ms waiting for the timeout + ~30 ms internet RTT + processing), errors ≈ 0%, cost unchanged at ≈ $1.53/hr (3★ par ≤ $1.80/hr). This is graceful degradation: sacrifice the optional feature to protect the core one.'
  ),
};

export const BEGINNER_LABS: LabChallengeSpec[] = [scaleOut, bottleneck, timeoutFallback];
