/* Bài Lab cấp NÂNG CAO (advanced) — bổ sung cho LAB-03, LAB-05. */
import type { BreakerPolicy, RetryPolicy } from '@/features/sysdesign-course/sim';
import type { LabChallengeSpec } from '../labChallenges';
import {
  bi,
  blankWithFixed,
  clientNode,
  makeBlankPreset,
  node,
  preset,
  reachable,
  requireKinds,
  sync,
} from './shared';

const LEVEL = { level: 'advanced', difficulty: 3, xp: 50 } as const;

/** Khớp các preset trong bảng Link của Phòng Lab (retry "Immediate", breaker mặc định). */
const RETRY_IMMEDIATE: RetryPolicy = { max: 2, backoff: 'none', baseMs: 0, jitter: 'none' };
const DEFAULT_BREAKER: BreakerPolicy = {
  errorThreshold: 0.5,
  minRps: 20,
  windowSec: 5,
  openSec: 10,
  probeRps: 10,
  closeAfterOk: 0.8,
};

/* ───────────── RETRY STORM & CIRCUIT BREAKER ───────────── */
const STORM_LOAD = { kind: 'steady', rps: 2000 } as const;

const carrierNodes = () => [
  node('service', 'carrier', bi('Carrier Rates API', 'Carrier Rates API'), 'az-a', { replicas: 2 }),
  node('sql', 'rates-db', bi('Rates SQL', 'Rates SQL'), 'az-a', {
    params: { sizeFactor: 1, poolSize: 16 },
  }),
];
const CARRIER_LINK = sync('carrier-rates', 'carrier', 'rates-db', 300, { carries: 'r' });

function stormModel(apiCarrier: Parameters<typeof sync>[4], timeoutMs: number) {
  return {
    nodes: [
      clientNode('Người mua', 'Shoppers'),
      node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
      node('service', 'api', bi('Checkout API', 'Checkout API'), 'az-a', { replicas: 4 }),
      node('nosql', 'orders', bi('Orders NoSQL', 'Orders NoSQL'), 'az-a', {
        params: { shards: 3 },
      }),
      ...carrierNodes(),
    ],
    links: [
      sync('client-lb', 'client', 'lb', 2000),
      sync('lb-api', 'lb', 'api', 1500),
      sync('api-orders', 'api', 'orders', 300),
      sync('api-carrier', 'api', 'carrier', timeoutMs, { carries: 'r', ...apiCarrier }),
      CARRIER_LINK,
    ],
    routes: {
      client: 'split' as const,
      lb: 'split' as const,
      api: 'all-sequential' as const,
      carrier: 'all-sequential' as const,
    },
  };
}
const STORM_GRID = {
  client: { col: 0, row: 2 },
  lb: { col: 1, row: 2 },
  api: { col: 2, row: 2 },
  orders: { col: 4, row: 1 },
  carrier: { col: 4, row: 3 },
  'rates-db': { col: 6, row: 3 },
};

const retryStorm: LabChallengeSpec = {
  id: 'lab-12-retry-storm',
  code: 'LAB-12',
  ...LEVEL,
  concepts: [
    bi('Retry storm', 'Retry storm'),
    bi('Circuit breaker', 'Circuit breaker'),
    bi('Lỗi siêu ổn định', 'Metastable failure'),
  ],
  estMinutes: 25,
  sourceRef: [
    {
      path: 'phase-3/lessons/lesson-1-reality-of-distributed-systems.mdx',
      phase: 3,
      title: bi('Thực tế của hệ phân tán', 'Reality of distributed systems'),
    },
    {
      path: 'phase-4/lessons/lesson-5-rate-limiting-and-load-control.mdx',
      phase: 4,
      title: bi('Rate limiting & kiểm soát tải', 'Rate limiting & load control'),
    },
  ],
  title: bi(
    'Retry storm: khi "thử lại" giết chết dịch vụ đang hồi phục',
    'Retry Storm: When "Try Again" Kills a Recovering Service'
  ),
  summary: bi(
    'Carrier Rates API chậm thêm 300 ms trong 20 giây. Retry tức thì ×2 nhân ba tải lên nó, và hệ thống vẫn sập SAU khi sự cố đã hết. Dùng circuit breaker + fallback để cắt vòng xoáy và cho dịch vụ thở.',
    'The Carrier Rates API gets 300 ms slower for 20 seconds. Immediate ×2 retries triple its load, and the system stays down AFTER the incident is over. Use a circuit breaker + fallback to break the spiral and let the service breathe.'
  ),
  prompt: bi(
    'Trang thanh toán nhận 2.000 RPS (50% đọc, 50% đặt đơn). Mỗi lượt đọc, Checkout API gọi Carrier Rates API (dịch vụ báo giá vận chuyển của đối tác: được khoá trên canvas, coi như bạn không thể mở rộng hay sửa nó) để hiển thị phí ship. Đường gọi đang đặt timeout 300 ms và retry "Immediate" ×2 với ý tốt "thử lại cho chắc".\n\nTừ giây 20 tới 40, Carrier chậm thêm 300 ms mỗi request. Mỗi request quá hạn bị gửi lại ngay, nên Carrier nhận gấp ~3 lần tải đúng lúc nó yếu nhất; các lần thử lại còn dội tiếp xuống Rates SQL. Tệ nhất: khi độ chậm đã hết ở giây 40, lượng retry vẫn giữ Carrier và SQL quá tải, lỗi kéo dài tới hết bài. Đây là lỗi siêu ổn định (metastable failure): nguyên nhân ban đầu biến mất nhưng hệ thống không tự hồi phục.\n\nHãy thiết kế lại đường gọi Carrier để: lỗi ≤ 1% suốt bài (trang vẫn hiện được, chỉ dùng phí ship ước tính khi Carrier gặp sự cố), Carrier được "thở" (không bị overloaded khi breaker đã kịp mở) và sau sự cố hệ thống trở lại bình thường.',
    'The checkout page receives 2,000 RPS (50% reads, 50% orders). For each read the Checkout API calls the Carrier Rates API (a partner shipping-quote service: locked on the canvas, treat it as something you cannot scale or change) to show the shipping fee. The call has a 300 ms timeout and "Immediate" ×2 retries, added with good intentions: "just try again".\n\nFrom second 20 to 40 the Carrier gets 300 ms slower per request. Every timed-out request is resent at once, so the Carrier receives ~3× the load exactly when it is weakest; the retries also hammer the Rates SQL behind it. Worst of all: when the slowness ends at second 40, the retry traffic keeps the Carrier and SQL overloaded and errors last until the end of the run. This is a metastable failure: the trigger is gone but the system does not recover on its own.\n\nRedesign the Carrier call so that: errors stay ≤ 1% for the whole run (the page still renders, using an estimated shipping fee when the Carrier is in trouble), the Carrier gets room to breathe (not overloaded once the breaker has had time to open), and the system returns to normal after the incident.'
  ),
  hints: [
    bi(
      'Đếm tải: 1.000 lượt đọc/giây × (1 lần gọi + 2 lần thử lại) ≈ 3.000 lượt/giây dội vào Carrier đang chỉ phục vụ được ~22 ÷ 0,312 ≈ 70 request/giây mỗi instance. Retry không thêm năng lực, chỉ thêm tải.',
      'Count the load: 1,000 reads/s × (1 call + 2 retries) ≈ 3,000 calls/s into a Carrier that can only serve ~22 ÷ 0.312 ≈ 70 requests/s per instance. Retries add no capacity, only load.'
    ),
    bi(
      'Trên link Checkout API → Carrier: tắt retry "Immediate" (hoặc dùng "Exp + Jitter + Budget" để giới hạn tỉ lệ thử lại), và bật Circuit Breaker. Khi tỉ lệ lỗi vượt 50%, breaker "mở" và trả lỗi ngay mà không gọi Carrier nữa.',
      'On the Checkout API → Carrier link: turn off "Immediate" retries (or use "Exp + Jitter + Budget" to cap the retry rate) and enable the Circuit Breaker. When the error rate passes 50%, the breaker "opens" and fails immediately without calling the Carrier.'
    ),
    bi(
      'Breaker mở nghĩa là request phụ thuộc Carrier thất bại nhanh, nhưng vẫn là LỖI. Đặt fallback = "degrade" trên cùng link để trả phí ship ước tính thay vì báo lỗi.',
      'An open breaker makes Carrier-dependent requests fail fast, but they are still ERRORS. Set fallback = "degrade" on the same link to return an estimated shipping fee instead of an error.'
    ),
    bi(
      'Breaker sẽ thử lại nhẹ nhàng (half-open, ~10 request/giây) sau 10 giây; chỉ khi đủ 80% probe thành công nó mới đóng lại. Đó là "retry có kiểm soát" ở tầng mạch, thay cho retry ồ ạt ở từng request.',
      'After 10 seconds the breaker probes gently (half-open, ~10 requests/s) and only closes again when 80% of probes succeed. That is controlled retry at the circuit level instead of a flood of per-request retries.'
    ),
  ],
  starter: preset(stormModel({ retry: RETRY_IMMEDIATE }, 300), STORM_GRID, STORM_LOAD, 0.5, [
    'carrier',
    'rates-db',
  ]),
  blank: blankWithFixed(
    carrierNodes(),
    [CARRIER_LINK],
    { carrier: STORM_GRID.carrier, 'rates-db': STORM_GRID['rates-db'] },
    STORM_LOAD,
    0.5,
    { carrier: 'all-sequential' }
  ),
  referenceSolution: preset(
    stormModel({ breaker: DEFAULT_BREAKER, fallback: 'degrade' }, 200),
    STORM_GRID,
    STORM_LOAD,
    0.5,
    ['carrier', 'rates-db']
  ),
  topology: [
    {
      id: 'topo-breaker',
      label: bi('Đường gọi Carrier có circuit breaker', 'Carrier call has a circuit breaker'),
      check: (model) => {
        const ls = model.links.filter((l) => l.to === 'carrier' && l.mode === 'sync');
        const ok = ls.length > 0 && ls.every((l) => !!l.breaker);
        return {
          pass: ok,
          got: ok ? bi('Đã bật breaker', 'Breaker enabled') : bi('Chưa có breaker', 'No breaker'),
          want: bi('Circuit breaker', 'Circuit breaker'),
        };
      },
    },
    {
      id: 'topo-no-immediate-retry',
      label: bi('Không retry tức thì vào dependency', 'No immediate retries into the dependency'),
      check: (model) => {
        const bad = model.links.filter(
          (l) => l.retry && l.retry.max > 0 && l.retry.backoff === 'none'
        );
        return {
          pass: bad.length === 0,
          got:
            bad.length === 0
              ? bi('Không có', 'None')
              : bi(`${bad.length} link retry tức thì`, `${bad.length} immediate-retry link(s)`),
          want: bi('0 link retry tức thì', '0 immediate-retry links'),
        };
      },
    },
    {
      id: 'topo-carrier-kept',
      label: bi('Vẫn gọi Carrier để lấy phí ship thật', 'Still calls the Carrier for real quotes'),
      check: (model) => {
        const ok = reachable(model).has('carrier');
        return {
          pass: ok,
          got: ok ? bi('Có', 'Yes') : bi('Đã bỏ Carrier', 'Carrier removed'),
          want: bi('Carrier trên luồng đọc', 'Carrier on the read path'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'carrier-slowdown',
      label: bi(
        '2.000 RPS, Carrier chậm thêm 300 ms (giây 20–40)',
        '2,000 RPS, Carrier +300 ms slower (20–40s)'
      ),
      durationSec: 60,
      load: STORM_LOAD,
      readRatio: 0.5,
      clientTimeoutMs: 2000,
      events: [{ at: 20, type: 'slowdown', node: 'carrier', addMs: 300, durationSec: 20 }],
      constraints: [
        {
          label: bi('Cả bài (giây 5–60): lỗi ≤ 1,0%', 'Whole run (5–60s): error ≤ 1.0%'),
          constraint: {
            id: 'err-run',
            kind: 'slo-error',
            maxRate: 0.01,
            window: { fromSec: 5, toSec: 60 },
          },
        },
        {
          label: bi('Bình thường (giây 5–20): p99 ≤ 120 ms', 'Normal (5–20s): p99 ≤ 120 ms'),
          constraint: {
            id: 'p99-before',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 120,
            window: { fromSec: 5, toSec: 20 },
            allowViolationPct: 2,
          },
        },
        {
          label: bi(
            'Sau sự cố (giây 48–60): p99 ≤ 120 ms',
            'After the incident (48–60s): p99 ≤ 120 ms'
          ),
          constraint: {
            id: 'p99-after',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 120,
            window: { fromSec: 48, toSec: 60 },
            allowViolationPct: 2,
          },
        },
        {
          label: bi(
            'Carrier được "thở": không overloaded ở giây 27–40',
            'Carrier gets room to breathe: not overloaded at 27–40s'
          ),
          constraint: {
            id: 'carrier-breathes',
            kind: 'node-state',
            node: 'carrier',
            notIn: ['overloaded', 'down'],
            window: { fromSec: 27, toSec: 40 },
            allowViolationPct: 5,
          },
        },
      ],
    },
  ],
  structural: [
    {
      requiredForPass: false,
      label: bi('Retry (nếu có) dùng backoff', 'Retries (if any) use backoff'),
      constraint: { id: 'struct-backoff', kind: 'structural', rule: 'has-retry-backoff' },
    },
    {
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
  ],
  maxCostPerHour: 3.0,
  parCostPerHour: 2.25,
  explain: bi(
    'Khi Carrier chậm thêm 300 ms, mỗi instance của nó chỉ còn ~70 request/giây (22 luồng ÷ 0,312 s). Retry "Immediate" ×2 biến 1.000 lượt đọc/giây thành ~3.000 lượt gọi, và các lần gọi đó còn dồn xuống Rates SQL (1.600 RPS) làm nó quá tải theo. Khi độ chậm hết ở giây 40, lượng retry vẫn cao hơn năng lực nên hệ thống kẹt ở trạng thái lỗi ~50%: lỗi siêu ổn định. Circuit breaker cắt vòng xoáy: sau ~4 giây lỗi liên tục nó mở, Carrier gần như không nhận tải (ρ ≈ 0), probe half-open thử lại có kiểm soát và đóng mạch khi Carrier khoẻ lại. Fallback "degrade" trả phí ship ước tính nên người dùng không thấy lỗi (0%). Timeout 200 ms giữ những giây đầu (trước khi breaker mở) không quá chậm. Chi phí không đổi ≈ $1.93/giờ (chuẩn 3★ ≤ $2.25/giờ): sửa đúng chính sách gọi rẻ hơn nhiều so với thêm máy.',
    'When the Carrier gets 300 ms slower, each of its instances handles only ~70 requests/s (22 threads ÷ 0.312 s). "Immediate" ×2 retries turn 1,000 reads/s into ~3,000 calls, which also pile onto the Rates SQL (1,600 RPS) and overload it too. When the slowness ends at second 40, retry traffic still exceeds capacity, so the system stays stuck at ~50% errors: a metastable failure. The circuit breaker breaks the spiral: after ~4 seconds of sustained errors it opens, the Carrier receives almost no load (ρ ≈ 0), half-open probes retry in a controlled way and close the circuit once the Carrier is healthy. The "degrade" fallback returns an estimated shipping fee, so users see no errors (0%). A 200 ms timeout keeps the first seconds (before the breaker opens) from getting too slow. Cost is unchanged at ≈ $1.93/hr (3★ par ≤ $2.25/hr): fixing the call policy is far cheaper than adding servers.'
  ),
};

/* ───────────── DNS FAILOVER GIỮA HAI AZ ───────────── */
const DNS_LOAD = { kind: 'steady', rps: 3000 } as const;

const dnsFailover: LabChallengeSpec = {
  id: 'lab-13-dns-failover',
  code: 'LAB-13',
  ...LEVEL,
  concepts: [
    bi('Failover theo AZ', 'Zonal failover'),
    bi('DNS TTL', 'DNS TTL'),
    bi('Miền lỗi', 'Failure domain'),
  ],
  estMinutes: 25,
  sourceRef: [
    {
      path: 'phase-2/lessons/lesson-1-load-balancing.mdx',
      phase: 2,
      title: bi('Load Balancing (DNS, L4/L7)', 'Load Balancing (DNS, L4/L7)'),
    },
    {
      path: 'phase-3/lessons/lesson-1-reality-of-distributed-systems.mdx',
      phase: 3,
      title: bi('Thực tế của hệ phân tán', 'Reality of distributed systems'),
    },
  ],
  title: bi(
    'Mất cả cửa ngõ một AZ: failover bằng DNS và cái giá của TTL',
    'Losing a Whole AZ Entry Point: DNS Failover and the Cost of TTL'
  ),
  summary: bi(
    'Ở giây 20, Load Balancer (dù có 2 replica) chết cùng AZ của nó. Dựng hai cửa ngõ ở hai AZ sau DNS, chọn TTL đủ ngắn để client chuyển hướng kịp: lỗi trong sự cố ≤ 5%, sau đó ≤ 1%.',
    'At second 20 the Load Balancer (despite 2 replicas) dies together with its AZ. Build two entry points in two AZs behind DNS and pick a TTL short enough for clients to move over in time: errors ≤ 5% during the incident, ≤ 1% afterwards.'
  ),
  prompt: bi(
    'Cổng thanh toán nhận 3.000 RPS (80% đọc). Bản khởi điểm đã có hai cụm API ở hai AZ, nhưng tất cả đi qua MỘT Load Balancer đặt ở az-a. Load Balancer đó có 2 replica nên phân tích SPOF tĩnh trông ổn, nhưng hai replica cùng nằm trong một miền lỗi: khi az-a mất điện ở giây 20, cả hai chết cùng lúc và toàn bộ lưu lượng mất theo (kịch bản sẽ đánh sập node Load Balancer lớn nhất trên luồng xử lý, không khởi động lại).\n\nHãy đặt hai Load Balancer độc lập (mỗi AZ một cái), đứng sau DNS để client được trỏ sang AZ còn sống. DNS chỉ ngừng trả về địa chỉ của AZ chết sau khi bản ghi cũ hết hạn (TTL), nên TTL quyết định thời gian failover. Mục tiêu: trước sự cố p99 ≤ 120 ms; giây 20–60 lỗi trung bình ≤ 5%; từ giây 30 lỗi ≤ 1% và goodput ≥ 2.970 RPS.',
    'A payment gateway serves 3,000 RPS (80% reads). The starter already runs two API pools in two AZs, but everything goes through ONE Load Balancer in az-a. That LB has 2 replicas, so static SPOF analysis looks fine, but both replicas share one failure domain: when az-a loses power at second 20 both die together and all traffic is lost (the scenario kills the largest Load Balancer node on the active path, with no restart).\n\nPut two independent Load Balancers (one per AZ) behind DNS so clients get pointed at the surviving AZ. DNS only stops handing out the dead AZ after cached records expire (TTL), so the TTL decides how long failover takes. Goal: p99 ≤ 120 ms before the incident; average errors ≤ 5% over 20–60s; from second 30 errors ≤ 1% and goodput ≥ 2,970 RPS.'
  ),
  hints: [
    bi(
      'Thêm node DNS ngay sau Người dùng, rồi hai Load Balancer: lb-a (az-a) → api-a và lb-b (az-b) → api-b. DNS chia đều client cho hai LB (định tuyến split).',
      'Add a DNS node right after Clients, then two Load Balancers: lb-a (az-a) → api-a and lb-b (az-b) → api-b. DNS spreads clients across both LBs (split routing).'
    ),
    bi(
      'Mỗi cụm API phải gánh được CẢ 3.000 RPS một mình sau failover: 2 instance = 3.600 RPS là đủ.',
      'Each API pool must carry the FULL 3,000 RPS alone after failover: 2 instances = 3,600 RPS is enough.'
    ),
    bi(
      'Tính lỗi theo TTL: sau khi az-a chết, một nửa client vẫn giữ bản ghi cũ trong TTL giây. TTL 60 s (mặc định) ⇒ ~50% lỗi suốt 40 giây còn lại. TTL 3 s ⇒ ~50% lỗi trong 3 giây ⇒ trung bình 20–60 s ≈ 50% × 3 ÷ 40 ≈ 3,75%. Muốn ≤ 5% thì TTL phải ≤ 4 s.',
      'Do the TTL math: after az-a dies, half the clients keep the stale record for TTL seconds. A 60 s TTL (default) ⇒ ~50% errors for the remaining 40 seconds. A 3 s TTL ⇒ ~50% errors for 3 seconds ⇒ 20–60s average ≈ 50% × 3 ÷ 40 ≈ 3.75%. To stay ≤ 5% the TTL must be ≤ 4 s.'
    ),
    bi(
      'TTL ngắn có giá: resolver phải hỏi lại DNS thường xuyên hơn (nhiều truy vấn DNS hơn) và một số resolver/ứng dụng không tôn trọng TTL quá ngắn. Trong thực tế người ta kết hợp health check của DNS với Anycast / Global Load Balancer.',
      'A short TTL has a price: resolvers re-query DNS more often (more DNS queries), and some resolvers/apps ignore very short TTLs. In practice, DNS health checks are combined with Anycast / a Global Load Balancer.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer (az-a)', 'Load Balancer (az-a)'), 'az-a', {
          replicas: 2,
        }),
        node('service', 'api-a', bi('Payment API (az-a)', 'Payment API (az-a)'), 'az-a', {
          replicas: 2,
        }),
        node('service', 'api-b', bi('Payment API (az-b)', 'Payment API (az-b)'), 'az-b', {
          replicas: 2,
        }),
        node('nosql', 'ledger', bi('Ledger NoSQL', 'Ledger NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api-a', 'lb', 'api-a', 1500),
        sync('lb-api-b', 'lb', 'api-b', 1500),
        sync('api-a-ledger', 'api-a', 'ledger', 500),
        sync('api-b-ledger', 'api-b', 'ledger', 500),
      ],
      routes: {
        client: 'split',
        lb: 'split',
        'api-a': 'all-sequential',
        'api-b': 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 2, row: 2 },
      'api-a': { col: 4, row: 1 },
      'api-b': { col: 4, row: 3 },
      ledger: { col: 6, row: 2 },
    },
    DNS_LOAD,
    0.8
  ),
  blank: makeBlankPreset(DNS_LOAD, 0.8),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('dns', 'dns', bi('DNS (health-checked)', 'DNS (health-checked)'), 'az-a', {
          params: { ttlSec: 3 },
        }),
        node('lb', 'lb-a', bi('Load Balancer (az-a)', 'Load Balancer (az-a)'), 'az-a'),
        node('lb', 'lb-b', bi('Load Balancer (az-b)', 'Load Balancer (az-b)'), 'az-b'),
        node('service', 'api-a', bi('Payment API (az-a)', 'Payment API (az-a)'), 'az-a', {
          replicas: 2,
        }),
        node('service', 'api-b', bi('Payment API (az-b)', 'Payment API (az-b)'), 'az-b', {
          replicas: 2,
        }),
        node('nosql', 'ledger', bi('Ledger NoSQL', 'Ledger NoSQL'), 'az-a', {
          params: { shards: 3 },
        }),
      ],
      links: [
        sync('client-dns', 'client', 'dns', 2000),
        sync('dns-lb-a', 'dns', 'lb-a', 1800),
        sync('dns-lb-b', 'dns', 'lb-b', 1800),
        sync('lb-a-api', 'lb-a', 'api-a', 1500),
        sync('lb-b-api', 'lb-b', 'api-b', 1500),
        sync('api-a-ledger', 'api-a', 'ledger', 500),
        sync('api-b-ledger', 'api-b', 'ledger', 500),
      ],
      routes: {
        client: 'split',
        dns: 'split',
        'lb-a': 'split',
        'lb-b': 'split',
        'api-a': 'all-sequential',
        'api-b': 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      dns: { col: 1, row: 2 },
      'lb-a': { col: 2, row: 1 },
      'lb-b': { col: 2, row: 3 },
      'api-a': { col: 4, row: 1 },
      'api-b': { col: 4, row: 3 },
      ledger: { col: 6, row: 2 },
    },
    DNS_LOAD,
    0.8
  ),
  topology: [
    requireKinds(
      'topo-dns',
      bi('Có DNS điều hướng giữa các AZ', 'Has DNS steering between AZs'),
      ['dns'],
      bi('≥ 1 DNS', '≥ 1 DNS')
    ),
    {
      id: 'topo-lb-per-az',
      label: bi('≥ 2 Load Balancer độc lập ở ≥ 2 AZ', '≥ 2 independent Load Balancers in ≥ 2 AZs'),
      check: (model) => {
        const reach = reachable(model);
        const lbs = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'lb');
        const zones = new Set(lbs.map((n) => n.zone));
        return {
          pass: lbs.length >= 2 && zones.size >= 2,
          got: bi(
            `${lbs.length} LB / ${zones.size} AZ`,
            `${lbs.length} LB(s) / ${zones.size} AZ(s)`
          ),
          want: bi('≥ 2 LB ở ≥ 2 AZ', '≥ 2 LBs in ≥ 2 AZs'),
        };
      },
    },
    {
      id: 'topo-dns-ttl',
      label: bi('TTL của DNS ≤ 4 giây', 'DNS TTL ≤ 4 seconds'),
      check: (model) => {
        const reach = reachable(model);
        const dns = model.nodes.filter((n) => reach.has(n.id) && n.kind === 'dns');
        const ttls = dns.map((n) => Number(n.params.ttlSec ?? 60));
        const ok = dns.length > 0 && ttls.every((t) => t <= 4);
        return {
          pass: ok,
          got:
            dns.length > 0
              ? bi(`TTL = ${ttls.join(', ')} s`, `TTL = ${ttls.join(', ')} s`)
              : bi('Chưa có DNS', 'No DNS'),
          want: bi('TTL ≤ 4 s', 'TTL ≤ 4 s'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'az-a-ingress-down',
      label: bi(
        '3.000 RPS, mất Load Balancer lớn nhất ở giây 20 (không phục hồi)',
        '3,000 RPS, largest Load Balancer lost at 20s (no recovery)'
      ),
      durationSec: 60,
      load: DNS_LOAD,
      readRatio: 0.8,
      clientTimeoutMs: 2000,
      dynamicCrash: { kind: 'lb', at: 20 },
      constraints: [
        {
          label: bi(
            'Trước sự cố (giây 5–20): p99 ≤ 120 ms',
            'Before the incident (5–20s): p99 ≤ 120 ms'
          ),
          constraint: {
            id: 'p99-before',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 120,
            window: { fromSec: 5, toSec: 20 },
            allowViolationPct: 2,
          },
        },
        {
          label: bi(
            'Trong sự cố (giây 20–60): lỗi trung bình ≤ 5%',
            'During the incident (20–60s): average error ≤ 5%'
          ),
          constraint: {
            id: 'err-incident',
            kind: 'slo-error',
            maxRate: 0.05,
            window: { fromSec: 20, toSec: 60 },
          },
        },
        {
          label: bi('Sau failover (giây 30–60): lỗi ≤ 1%', 'After failover (30–60s): error ≤ 1%'),
          constraint: {
            id: 'err-after',
            kind: 'slo-error',
            maxRate: 0.01,
            window: { fromSec: 30, toSec: 60 },
          },
        },
        {
          label: bi(
            'Sau failover (giây 30–60): goodput ≥ 2.970 RPS',
            'After failover (30–60s): goodput ≥ 2,970 RPS'
          ),
          constraint: {
            id: 'goodput-after',
            kind: 'throughput',
            minGoodputRps: 2970,
            window: { fromSec: 30, toSec: 60 },
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
  parCostPerHour: 1.15,
  explain: bi(
    'Hai replica trong cùng một AZ không phải dự phòng thật: chúng chết cùng nhau. Đặt mỗi AZ một Load Balancer và để DNS chia client cho cả hai. Khi az-a mất, DNS (có health check) ngừng trả địa chỉ lb-a, nhưng những client đã lưu bản ghi cũ vẫn gửi tới az-a cho tới khi TTL hết. Với TTL 3 s, ~50% request lỗi trong ~3 giây rồi về 0%: trung bình giây 20–60 ≈ 3,75% (mỗi giây TTL cộng thêm ~1,25%, nên TTL 5 s đã vượt ngưỡng 5%). TTL 60 s mặc định thì nửa lưu lượng chết suốt phần còn lại của bài. Mỗi cụm API 2 instance (3.600 RPS) đủ gánh trọn 3.000 RPS sau failover. Chi phí ≈ $0.97/giờ (chuẩn 3★ ≤ $1.15/giờ). Đánh đổi của TTL ngắn: nhiều truy vấn DNS hơn và phụ thuộc việc resolver có tôn trọng TTL hay không.',
    'Two replicas in the same AZ are not real redundancy: they die together. Give each AZ its own Load Balancer and let DNS split clients between them. When az-a goes away, the health-checked DNS stops returning lb-a, but clients that cached the old record keep sending to az-a until the TTL expires. With a 3 s TTL, ~50% of requests fail for ~3 seconds and then drop to 0%: the 20–60s average ≈ 3.75% (each second of TTL adds ~1.25%, so a 5 s TTL already breaks the 5% limit). With the default 60 s TTL half the traffic stays dead for the rest of the run. Each 2-instance API pool (3,600 RPS) can carry the whole 3,000 RPS after failover. Cost ≈ $0.97/hr (3★ par ≤ $1.15/hr). The price of a short TTL: more DNS queries and reliance on resolvers honoring the TTL.'
  ),
};

export const ADVANCED_LABS: LabChallengeSpec[] = [retryStorm, dnsFailover];
