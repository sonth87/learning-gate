/* Bài Lab cấp TRUNG CẤP (intermediate) — bổ sung cho LAB-02, LAB-04. */
import type { LabChallengeSpec } from '../labChallenges';
import {
  bi,
  blankWithFixed,
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

const LEVEL = { level: 'intermediate', difficulty: 2, xp: 40 } as const;

/* ───────────── CACHE STAMPEDE ───────────── */
const STAMPEDE_LOAD = { kind: 'steady', rps: 5000 } as const;
/** Cache được cấu hình working set 30.000 key (hot set của trang chủ) — xem giải thích singleflight. */
const stampedeCacheParams = (singleflight: boolean, jitter: number) => ({
  ttlSec: 300,
  ttlJitterPct: jitter,
  capacityKeys: 30000,
  workingSetKeys: 30000,
  singleflight,
});

const stampede: LabChallengeSpec = {
  id: 'lab-09-cache-stampede',
  code: 'LAB-09',
  ...LEVEL,
  concepts: [
    bi('Cache stampede', 'Cache stampede'),
    bi('Singleflight', 'Singleflight'),
    bi('TTL jitter', 'TTL jitter'),
  ],
  estMinutes: 15,
  sourceRef: [
    {
      path: 'phase-4/lessons/lesson-2-caching-strategy-trade-consistency-de-lay-speed.mdx',
      phase: 4,
      title: bi('Chiến lược caching', 'Caching strategy'),
    },
    { path: 'phase-2/lessons/lesson-2-caching.mdx', phase: 2, title: bi('Caching', 'Caching') },
  ],
  title: bi(
    'Cache bị xoá sạch: chặn cơn "giẫm đạp" xuống Database',
    'Cache Wiped Out: Stop the Stampede on the Database'
  ),
  summary: bi(
    'Giây 20, cụm Redis bị flush. 4.750 lượt đọc/giây đồng loạt trượt cache và đổ thẳng xuống SQL 1.600 RPS. Dùng singleflight (gộp request trùng khoá) và TTL jitter để SQL không quá tải, lỗi ≤ 1%.',
    'At second 20 the Redis cluster is flushed. 4,750 reads/s miss at once and pour into a 1,600 RPS SQL. Use singleflight (request coalescing) and TTL jitter so SQL never overloads and errors stay ≤ 1%.'
  ),
  prompt: bi(
    'Trang chủ thương mại điện tử nhận 5.000 RPS (95% đọc). Bình thường Cache trúng ~90% nên SQL chỉ nhận ~725 RPS (475 lượt trượt + 250 lượt ghi). Ở giây 20, một sự cố vận hành xoá sạch cache (flush). Ngay lập tức mọi lượt đọc đều trượt và cùng lúc đi xuống SQL, nhiều request trùng đúng một khoá: hiện tượng cache stampede (thundering herd). SQL bị đè bẹp và cache hồi phục rất chậm vì chính các truy vấn nạp lại cũng bị nghẽn.\n\nHãy giữ nguyên kiến trúc (node Redis Cache được khoá trên canvas) nhưng cấu hình Cache đúng cách: bật singleflight (mỗi khoá chỉ một request đi nạp, các request khác chờ kết quả đó) và đặt TTL jitter để các khoá không hết hạn cùng lúc. Mục tiêu: SQL không rơi vào overloaded, lỗi ≤ 1%, p99 ≤ 150 ms cả trong lúc cache hồi phục.',
    'An e-commerce home page serves 5,000 RPS (95% reads). Normally the Cache hits ~90%, so SQL only sees ~725 RPS (475 misses + 250 writes). At second 20 an operational mistake flushes the cache. Instantly every read misses and they all go to SQL at once, many of them for the very same keys: a cache stampede (thundering herd). SQL gets crushed and the cache refills very slowly because the refill queries are stuck too.\n\nKeep the architecture (the Redis Cache node is locked on the canvas) but configure the Cache properly: enable singleflight (only one request per key goes to load it, the others wait for that result) and set a TTL jitter so keys do not expire together. Goal: SQL never overloaded, errors ≤ 1%, p99 ≤ 150 ms even while the cache warms back up.'
  ),
  hints: [
    bi(
      'Đếm trước: sau khi flush, SQL nhận 4.750 lượt đọc + 250 lượt ghi = 5.000 RPS, gấp ~3 lần năng lực 1.600 RPS. Nâng cỡ SQL lên ×4 (6.400 RPS) đỡ được nhưng tốn ~$4.2/giờ chỉ để chịu vài chục giây sự cố, vượt trần ngân sách.',
      'Count first: after the flush SQL receives 4,750 reads + 250 writes = 5,000 RPS, about 3× its 1,600 RPS capacity. Scaling SQL up ×4 (6,400 RPS) would survive but costs ~$4.2/hr just for a few seconds of incident, over the budget cap.'
    ),
    bi(
      'Chọn node Cache, bật "Singleflight". Khi cache lạnh, số lượt nạp thực sự đi xuống DB bị chặn ở khoảng (số khoá trong working set) ÷ (thời gian làm ấm) = 30.000 ÷ 30 s ≈ 1.000 RPS, phần còn lại chờ chung kết quả.',
      'Select the Cache node and enable "Singleflight". While the cache is cold, the loads that really reach the DB are capped at about (keys in the working set) ÷ (warm-up time) = 30,000 ÷ 30 s ≈ 1,000 RPS; the rest wait for the shared result.'
    ),
    bi(
      'Đặt "Jitter TTL" ≥ 0,10 (ví dụ 0,15): mỗi khoá hết hạn lệch nhau ±15% TTL, tránh việc hàng loạt khoá cùng hết hạn đúng một thời điểm và tự tạo stampede định kỳ.',
      'Set "TTL jitter" ≥ 0.10 (e.g. 0.15): each key expires at ±15% of the TTL, so a big batch of keys never expires at the same instant and creates periodic stampedes on its own.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Home API', 'Home API'), 'az-a', { replicas: 4 }),
        node('cache', 'cache', bi('Redis Cache', 'Redis Cache'), 'az-a', {
          params: stampedeCacheParams(false, 0),
        }),
        node('sql', 'db', bi('Catalog SQL', 'Catalog SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-cache', 'api', 'cache', 1000),
        sync('cache-db', 'cache', 'db', 800),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', cache: 'split' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      cache: { col: 4, row: 2 },
      db: { col: 6, row: 2 },
    },
    STAMPEDE_LOAD,
    0.95,
    ['cache']
  ),
  blank: blankWithFixed(
    [
      node('cache', 'cache', bi('Redis Cache', 'Redis Cache'), 'az-a', {
        params: stampedeCacheParams(false, 0),
      }),
    ],
    [],
    { cache: { col: 4, row: 2 } },
    STAMPEDE_LOAD,
    0.95,
    { cache: 'split' }
  ),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Home API', 'Home API'), 'az-a', { replicas: 4 }),
        node('cache', 'cache', bi('Redis Cache', 'Redis Cache'), 'az-a', {
          params: stampedeCacheParams(true, 0.15),
        }),
        node('sql', 'db', bi('Catalog SQL', 'Catalog SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-cache', 'api', 'cache', 1000),
        sync('cache-db', 'cache', 'db', 800),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', cache: 'split' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      cache: { col: 4, row: 2 },
      db: { col: 6, row: 2 },
    },
    STAMPEDE_LOAD,
    0.95,
    ['cache']
  ),
  topology: [
    {
      id: 'topo-singleflight',
      label: bi(
        'Cache bật singleflight (gộp request trùng khoá)',
        'Cache enables singleflight (request coalescing)'
      ),
      check: (model) => {
        const reach = reachable(model);
        const caches = model.nodes.filter(
          (n) => reach.has(n.id) && (n.kind === 'cache' || n.kind === 'cdn')
        );
        const ok = caches.length > 0 && caches.every((n) => n.params.singleflight === true);
        return {
          pass: ok,
          got:
            caches.length === 0
              ? bi('Không có Cache', 'No Cache')
              : ok
                ? bi('Đã bật', 'Enabled')
                : bi('Chưa bật', 'Disabled'),
          want: bi('singleflight = true', 'singleflight = true'),
        };
      },
    },
    requireKinds(
      'topo-cache',
      bi('Có tầng Cache phía trước SQL', 'Has a Cache tier in front of SQL'),
      ['cache'],
      bi('≥ 1 Cache', '≥ 1 Cache')
    ),
  ],
  scenarios: [
    {
      id: 'flush-at-20',
      label: bi('5.000 RPS, cache bị flush ở giây 20', '5,000 RPS, cache flushed at 20s'),
      durationSec: 60,
      load: STAMPEDE_LOAD,
      readRatio: 0.95,
      clientTimeoutMs: 2000,
      events: [{ at: 20, type: 'cache-expire-all', node: 'cache' }],
      dynamicDbNoOverload: {
        window: { fromSec: 5, toSec: 60 },
        allowViolationPct: 2,
        label: bi(
          'SQL không rơi vào overloaded/down (kể cả khi cache lạnh)',
          'SQL never overloaded/down (even with a cold cache)'
        ),
      },
      constraints: [
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
          label: bi('Độ trễ p99 ≤ 150 ms', 'Latency p99 ≤ 150 ms'),
          constraint: {
            id: 'p99-150',
            kind: 'slo-latency',
            metric: 'p99',
            maxMs: 150,
            window: { fromSec: 5, toSec: 60 },
            allowViolationPct: 3,
          },
        },
      ],
    },
  ],
  structural: [
    {
      requiredForPass: false,
      label: bi('Cache có TTL jitter ≥ 0,10', 'Cache sets TTL jitter ≥ 0.10'),
      constraint: { id: 'struct-jitter', kind: 'structural', rule: 'cache-has-jitter' },
    },
    {
      requiredForPass: false,
      label: bi('Mọi kết nối sync đều cấu hình timeout', 'All sync links configure timeoutMs'),
      constraint: { id: 'struct-timeout', kind: 'structural', rule: 'has-timeout' },
    },
  ],
  maxCostPerHour: 2.5,
  parCostPerHour: 1.65,
  explain: bi(
    'Không có singleflight, lúc cache lạnh mọi lượt trượt đều đi xuống DB: 4.750 + 250 = 5.000 RPS so với 1.600 RPS của SQL, nên SQL quá tải và lỗi kéo dài tới khi cache ấm lại (hàng chục giây). Singleflight gộp các request trùng khoá thành một lần nạp: số lượt nạp tối đa ≈ 30.000 khoá ÷ 30 s ≈ 1.000 RPS lúc cache vừa trống, rồi giảm dần khi cache ấm lên, nên SQL chỉ nhận ~1.250 RPS ở đỉnh (ρ ≈ 0,78). TTL jitter 0,15 làm các khoá hết hạn rải rác thay vì đồng loạt, phòng stampede định kỳ. Chi phí không đổi ≈ $1.38/giờ (chuẩn 3★ ≤ $1.65/giờ); nâng SQL ×4 cũng sống sót nhưng tốn ≈ $4.2/giờ chỉ cho DB.',
    'Without singleflight, every miss goes to the DB while the cache is cold: 4,750 + 250 = 5,000 RPS against a 1,600 RPS SQL, so SQL overloads and errors last until the cache warms up again (tens of seconds). Singleflight collapses requests for the same key into one load: at most ≈ 30,000 keys ÷ 30 s ≈ 1,000 loads/s right after the flush, shrinking as the cache warms, so SQL peaks at only ~1,250 RPS (ρ ≈ 0.78). A TTL jitter of 0.15 spreads expirations instead of letting them land together, preventing periodic stampedes. Cost is unchanged at ≈ $1.38/hr (3★ par ≤ $1.65/hr); scaling SQL ×4 would also survive but costs ≈ $4.2/hr for the DB alone.'
  ),
};

/* ───────────── ASYNC NOTIFICATION PIPELINE ───────────── */
const NOTIFY_LOAD = { kind: 'steady', rps: 1200 } as const;

const asyncNotify: LabChallengeSpec = {
  id: 'lab-10-async-notifications',
  code: 'LAB-10',
  ...LEVEL,
  concepts: [
    bi('Bất đồng bộ', 'Asynchronous work'),
    bi('Queue + Worker', 'Queue + Worker'),
    bi('DLQ', 'DLQ'),
  ],
  estMinutes: 20,
  sourceRef: [
    {
      path: 'phase-2/lessons/lesson-4-message-queues-async-processing-decoupling-services.mdx',
      phase: 2,
      title: bi('Message Queue & tách rời dịch vụ', 'Message queues & decoupling services'),
    },
    {
      path: 'phase-1/lessons/lesson-2-communication-patterns.mdx',
      phase: 1,
      title: bi('Các mẫu giao tiếp (sync / async)', 'Communication patterns (sync / async)'),
    },
  ],
  title: bi(
    'Gửi email chào mừng mà không bắt người dùng chờ',
    'Send Welcome Emails Without Making Users Wait'
  ),
  summary: bi(
    'API đăng ký gọi đồng bộ dịch vụ gửi email mất ~250 ms, nên mọi lượt đăng ký đều chậm. Đưa việc gửi email ra sau hàng đợi (Queue + DLQ → Worker) để p99 ≤ 100 ms mà email vẫn được gửi.',
    'The signup API synchronously calls a ~250 ms email sender, so every signup is slow. Move email sending behind a queue (Queue + DLQ → Worker) so p99 ≤ 100 ms while emails still go out.'
  ),
  prompt: bi(
    'Dịch vụ tài khoản nhận 1.200 RPS (70% đọc hồ sơ, 30% đăng ký/cập nhật). Mỗi lượt ghi, Account API lưu vào Users SQL rồi gọi ĐỒNG BỘ Mailer để gửi email chào mừng/xác nhận qua nhà cung cấp SMTP, việc này mất ~250 ms. Người dùng phải chờ email được gửi xong mới thấy "Đăng ký thành công", trong khi họ đâu cần điều đó ngay.\n\nHãy tách việc gửi email khỏi đường phản hồi: Account API chỉ cần ghi user và đẩy một message "gửi email" vào Queue (bật DLQ), một Worker kéo (pull) message và gửi email, rồi lưu nhật ký vào kho Mail Log. Mục tiêu: p99 ≤ 100 ms, lỗi ≤ 1%, Users SQL không quá tải.',
    'The account service receives 1,200 RPS (70% profile reads, 30% signups/updates). For each write the Account API stores the user in Users SQL and then SYNCHRONOUSLY calls the Mailer to send a welcome/confirmation email through an SMTP provider, which takes ~250 ms. Users wait for the email to be sent before seeing "Signed up", even though they do not need it instantly.\n\nTake email sending off the response path: the Account API only needs to store the user and push a "send email" message to a Queue (DLQ enabled); a Worker pulls messages, sends the emails and writes a log to the Mail Log store. Goal: p99 ≤ 100 ms, errors ≤ 1%, Users SQL never overloaded.'
  ),
  hints: [
    bi(
      'Hỏi: việc nào người dùng THỰC SỰ cần trước khi nhận phản hồi? Lưu tài khoản thì cần (để đăng nhập được). Gửi email thì không, vài giây sau cũng được. Việc "không cần ngay" là ứng viên cho xử lý bất đồng bộ.',
      'Ask: what does the user REALLY need before getting a response? Storing the account, yes (so they can log in). Sending the email, no: a few seconds later is fine. "Not needed right now" work is a candidate for async processing.'
    ),
    bi(
      'Thêm Queue, nối Account API → Queue với mode "async" và carries "w" (chỉ lượt ghi sinh email). Bật Dead-letter queue để message lỗi lặp lại (email sai định dạng…) không kẹt hàng đợi.',
      'Add a Queue and wire Account API → Queue with mode "async" and carries "w" (only writes produce emails). Enable the Dead-letter queue so repeatedly failing messages (malformed addresses…) do not clog the queue.'
    ),
    bi(
      'Thêm Worker, nối Queue → Worker với mode "pull", rồi Worker → Mail Log (sync). Mỗi Worker gửi ~500 email/giây; 360 lượt ghi/giây cần 1 Worker, nên dùng 2 để có dư địa và rút backlog nhanh. Xoá Mailer đồng bộ khỏi đường gọi của API.',
      'Add a Worker, wire Queue → Worker with mode "pull", then Worker → Mail Log (sync). Each Worker sends ~500 emails/s; 360 writes/s need 1 Worker, use 2 for headroom and fast backlog draining. Remove the synchronous Mailer from the API call path.'
    ),
    bi(
      'Đánh đổi: email trở thành "nhất quán cuối cùng" (đến sau vài trăm ms tới vài giây) và có thể bị giao lặp (at-least-once), nên Worker phải idempotent (ví dụ khoá chống trùng theo mã user + loại email).',
      'Trade-off: emails become eventually consistent (arriving hundreds of ms to seconds later) and may be delivered more than once (at-least-once), so the Worker must be idempotent (e.g. a dedupe key per user id + email type).'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Account API', 'Account API'), 'az-a', { replicas: 2 }),
        node('sql', 'users-db', bi('Users SQL', 'Users SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
        node('service', 'mailer', bi('Mailer (SMTP, đồng bộ)', 'Mailer (SMTP, sync)'), 'az-a', {
          replicas: 2,
          baseMs: 250,
        }),
        node('blob', 'mail-log', bi('Mail Log', 'Mail Log'), 'az-a'),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-users', 'api', 'users-db', 800),
        sync('api-mailer', 'api', 'mailer', 1200, { carries: 'w' }),
        sync('mailer-log', 'mailer', 'mail-log', 800, { carries: 'w' }),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', mailer: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      'users-db': { col: 5, row: 1 },
      mailer: { col: 4, row: 3 },
      'mail-log': { col: 6, row: 3 },
    },
    NOTIFY_LOAD,
    0.7,
    ['mail-log']
  ),
  // Mail Log = nơi nhận email (bên thứ ba): khoá cố định để không thể "lách" bằng cách bỏ gửi email.
  blank: blankWithFixed(
    [node('blob', 'mail-log', bi('Mail Log', 'Mail Log'), 'az-a')],
    [],
    { 'mail-log': { col: 6, row: 3 } },
    NOTIFY_LOAD,
    0.7
  ),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Account API', 'Account API'), 'az-a', { replicas: 2 }),
        node('sql', 'users-db', bi('Users SQL', 'Users SQL'), 'az-a', {
          params: { sizeFactor: 1, poolSize: 16 },
        }),
        node('queue', 'email-queue', bi('Email Queue', 'Email Queue'), 'az-a', {
          params: { dlq: true, maxDepth: 100000 },
        }),
        node('worker', 'email-worker', bi('Email Worker', 'Email Worker'), 'az-a', {
          replicas: 2,
          baseMs: 250,
        }),
        node('blob', 'mail-log', bi('Mail Log', 'Mail Log'), 'az-a'),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-users', 'api', 'users-db', 800),
        { id: 'api-queue', from: 'api', to: 'email-queue', mode: 'async', carries: 'w' },
        { id: 'queue-worker', from: 'email-queue', to: 'email-worker', mode: 'pull', carries: 'w' },
        sync('worker-log', 'email-worker', 'mail-log', 1000, { carries: 'w' }),
      ],
      routes: {
        client: 'split',
        lb: 'split',
        api: 'all-sequential',
        'email-worker': 'all-sequential',
      },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      'users-db': { col: 5, row: 1 },
      'email-queue': { col: 3, row: 3 },
      'email-worker': { col: 5, row: 3 },
      'mail-log': { col: 6, row: 4 },
    },
    NOTIFY_LOAD,
    0.7,
    ['mail-log']
  ),
  topology: [
    requireLink(
      'topo-queue-async',
      bi('API đẩy việc gửi email vào Queue (async)', 'API hands email work to a Queue (async)'),
      (l, m) => l.mode === 'async' && kindOf(m, l.to) === 'queue',
      bi('API → Queue (async)', 'API → Queue (async)'),
      bi('Chưa có link async vào Queue', 'No async link into a Queue')
    ),
    requireLink(
      'topo-worker-pull',
      bi('Worker kéo (pull) message từ Queue', 'Worker pulls messages from the Queue'),
      (l, m) => l.mode === 'pull' && kindOf(m, l.from) === 'queue' && kindOf(m, l.to) === 'worker',
      bi('Queue → Worker (pull)', 'Queue → Worker (pull)'),
      bi('Chưa có Worker kéo từ Queue', 'No Worker pulling from the Queue')
    ),
    {
      id: 'topo-no-sync-mailer',
      label: bi(
        'Không còn gọi dịch vụ chậm (≥ 100 ms) đồng bộ trên đường phản hồi',
        'No slow (≥ 100 ms) service called synchronously on the response path'
      ),
      check: (model) => {
        const reach = reachable(model);
        const slow = model.nodes.filter(
          (n) =>
            reach.has(n.id) &&
            n.kind === 'service' &&
            n.latency.baseMs >= 100 &&
            model.links.some((l) => l.to === n.id && l.mode === 'sync')
        );
        return {
          pass: slow.length === 0,
          got:
            slow.length === 0
              ? bi('Không có', 'None')
              : bi(
                  `Còn ${slow.map((n) => n.label.vi).join(', ')}`,
                  `Still ${slow.map((n) => n.label.en).join(', ')}`
                ),
          want: bi('0 dịch vụ chậm đồng bộ', '0 slow sync services'),
        };
      },
    },
  ],
  scenarios: [
    {
      id: 'steady-1200',
      label: bi(
        '1.200 RPS ổn định (30% ghi sinh email)',
        'Steady 1,200 RPS (30% writes trigger emails)'
      ),
      durationSec: 60,
      load: NOTIFY_LOAD,
      readRatio: 0.7,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 5, toSec: 60 },
        allowViolationPct: 2,
        label: bi('Database không rơi vào overloaded/down', 'Databases never overloaded/down'),
      },
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
  maxCostPerHour: 2.5,
  parCostPerHour: 1.65,
  explain: bi(
    'Khi gọi Mailer đồng bộ, 30% request (lượt ghi) phải chờ thêm ~250 ms nên p99 của cả hệ thống lên tới ~500 ms dù mọi máy đều nhàn. Chuyển sang Queue: Account API chỉ ghi Users SQL (~5 ms) và đẩy message (~1 ms) rồi trả lời ngay, p99 về ~70 ms (phần lớn là ~30 ms mạng internet tới client). Hai Email Worker (2 × 500 = 1.000 email/giây) dư sức rút 360 message/giây, nên backlog gần như bằng 0 và email vẫn đến sau chưa tới một giây. DLQ tách các message hỏng (địa chỉ sai, lỗi lặp) ra khỏi hàng đợi chính để chúng không bị thử lại mãi. Chi phí ≈ $1.40/giờ (chuẩn 3★ ≤ $1.65/giờ). Cái giá: email là nhất quán cuối cùng và có thể giao lặp, nên Worker phải idempotent.',
    'With a synchronous Mailer, 30% of requests (the writes) wait an extra ~250 ms, so system p99 reaches ~500 ms even though every box is idle. With a Queue the Account API only writes Users SQL (~5 ms) and enqueues (~1 ms) before replying, bringing p99 down to ~70 ms (mostly the ~30 ms internet hop to the client). Two Email Workers (2 × 500 = 1,000 emails/s) easily drain 360 messages/s, so the backlog stays near zero and emails still arrive in under a second. The DLQ moves broken messages (bad addresses, repeated failures) out of the main queue so they are not retried forever. Cost ≈ $1.40/hr (3★ par ≤ $1.65/hr). The price: emails are eventually consistent and may be delivered twice, so the Worker must be idempotent.'
  ),
};

/* ───────────── SEARCH INDEX OFFLOAD ───────────── */
const SEARCH_LOAD = { kind: 'steady', rps: 3000 } as const;
/** Truy vấn tìm kiếm kiểu LIKE '%từ khoá%' trên SQL: mỗi lần quét ~25 ms. */
const SCAN_SQL = { baseMs: 25, params: { sizeFactor: 1, poolSize: 16 } };

const searchOffload: LabChallengeSpec = {
  id: 'lab-11-search-offload',
  code: 'LAB-11',
  ...LEVEL,
  concepts: [
    bi('Search index', 'Search index'),
    bi('Tách luồng đọc / ghi', 'Read / write split'),
    bi('Chọn đúng kho', 'Right store for the query'),
  ],
  estMinutes: 15,
  sourceRef: [
    {
      path: 'phase-2/lessons/lesson-3-database.mdx',
      phase: 2,
      title: bi('Database (SQL, NoSQL, Search)', 'Databases (SQL, NoSQL, Search)'),
    },
    {
      path: 'phase-4/lessons/lesson-4-database-scaling-optimization.mdx',
      phase: 4,
      title: bi('Mở rộng & tối ưu Database', 'Database scaling & optimization'),
    },
  ],
  title: bi(
    'Tìm kiếm sản phẩm: chuyển truy vấn khỏi SQL sang Search Index',
    'Product Search: Move Queries Off SQL Onto a Search Index'
  ),
  summary: bi(
    '2.700 lượt tìm kiếm/giây chạy LIKE "%từ khoá%" trên SQL, mỗi lần quét ~25 ms. Kể cả nâng SQL tối đa cũng không theo kịp. Chuyển luồng đọc tìm kiếm sang Search Index, SQL chỉ giữ luồng ghi.',
    "2,700 searches/s run LIKE '%term%' on SQL, each scan taking ~25 ms. Even a maxed-out SQL cannot keep up. Move the search read path to a Search Index and keep SQL for writes."
  ),
  prompt: bi(
    'Trang tìm kiếm của một sàn thương mại nhận 3.000 RPS (90% truy vấn tìm kiếm, 10% cập nhật sản phẩm). Hiện mọi truy vấn chạy trên Catalog SQL bằng LIKE "%từ khoá%": không dùng được index B-tree nên mỗi lần phải quét ~25 ms. Với pool 16 kết nối, SQL chỉ phục vụ 16 ÷ 0,025 = 640 truy vấn/giây. Đội đã thử đặt Query Cache phía trước nhưng truy vấn tìm kiếm có "đuôi dài" (phần lớn chuỗi tìm kiếm gần như không lặp lại), nên cache chỉ trúng tối đa ~30%.\n\nHãy dùng đúng loại kho cho đúng kiểu truy vấn: thêm Search Index (inverted index, kiểu Elasticsearch/OpenSearch) để phục vụ luồng ĐỌC tìm kiếm, còn SQL chỉ nhận luồng GHI (nguồn sự thật). Mục tiêu: p99 ≤ 150 ms, lỗi ≤ 1%, Catalog SQL không quá tải, chi phí ≤ $2.25/giờ cho 3★.',
    "A marketplace search page receives 3,000 RPS (90% search queries, 10% product updates). Every query currently runs on the Catalog SQL as LIKE '%term%': B-tree indexes cannot help, so each one scans for ~25 ms. With a 16-connection pool SQL serves only 16 ÷ 0.025 = 640 queries/s. The team already put a Query Cache in front, but search queries are long-tail (most search strings barely repeat), so it hits ~30% at best.\n\nUse the right store for the query shape: add a Search Index (an inverted index, Elasticsearch/OpenSearch style) to serve the search READ path, and keep SQL for WRITES only (the source of truth). Goal: p99 ≤ 150 ms, errors ≤ 1%, Catalog SQL never overloaded, cost ≤ $2.25/hr for 3★."
  ),
  hints: [
    bi(
      'Thử phép tính scale-up: dù tăng pool lên 64 và cỡ máy ×4, SQL cũng chỉ đạt 6.400 truy vấn/giây với chi phí ~$4.2/giờ. Vấn đề là KIỂU truy vấn (quét toàn bảng) chứ không phải cỡ máy.',
      'Try the scale-up math: even with a 64-connection pool and a ×4 machine, SQL reaches 6,400 queries/s at ~$4.2/hr. The problem is the query SHAPE (full scans), not the machine size.'
    ),
    bi(
      'Thêm node Search. Nối Search API → Search với carries "r" (chỉ đọc) và nối Search API → Catalog SQL với carries "w" (chỉ ghi). Query Cache trúng quá ít nên có thể bỏ hẳn. Định tuyến ra của Search API để "all-sequential": mỗi request đi theo các link khớp loại của nó.',
      'Add a Search node. Wire Search API → Search with carries "r" (reads only) and Search API → Catalog SQL with carries "w" (writes only). The Query Cache hits too rarely, so you can drop it. Keep the Search API route "all-sequential": each request follows the links matching its type.'
    ),
    bi(
      'Một node Search xử lý ~2.000 truy vấn/giây/instance. 2.700 truy vấn/giây cần 2 instance (4.000, ρ ≈ 0,68).',
      'One Search node handles ~2,000 queries/s per instance. 2,700 queries/s need 2 instances (4,000, ρ ≈ 0.68).'
    ),
    bi(
      'Trong thực tế, index được cập nhật từ SQL qua CDC/outbox nên kết quả tìm kiếm trễ vài giây so với dữ liệu gốc (nhất quán cuối cùng). Mô phỏng không tính luồng đồng bộ index này.',
      'In practice the index is fed from SQL via CDC/outbox, so search results lag the source data by a few seconds (eventual consistency). The simulation does not model this indexing pipeline.'
    ),
  ],
  starter: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Search API', 'Search API'), 'az-a', { replicas: 3 }),
        node(
          'cache',
          'query-cache',
          bi('Query Cache (đuôi dài, hit ≤ 30%)', 'Query Cache (long tail, hit ≤ 30%)'),
          'az-a',
          {
            params: { ttlSec: 300, ttlJitterPct: 0.15, hitRatioMax: 0.3 },
          }
        ),
        node('sql', 'catalog-db', bi('Catalog SQL', 'Catalog SQL'), 'az-a', SCAN_SQL),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-cache', 'api', 'query-cache', 300),
        sync('cache-sql', 'query-cache', 'catalog-db', 1000),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential', 'query-cache': 'split' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 2, row: 2 },
      'query-cache': { col: 4, row: 2 },
      'catalog-db': { col: 6, row: 2 },
    },
    SEARCH_LOAD,
    0.9
  ),
  blank: makeBlankPreset(SEARCH_LOAD, 0.9),
  referenceSolution: preset(
    {
      nodes: [
        clientNode(),
        node('lb', 'lb', bi('Load Balancer', 'Load Balancer'), 'az-a'),
        node('service', 'api', bi('Search API', 'Search API'), 'az-a', { replicas: 3 }),
        node('search', 'search', bi('Search Index', 'Search Index'), 'az-a', { replicas: 2 }),
        node('sql', 'catalog-db', bi('Catalog SQL', 'Catalog SQL'), 'az-a', SCAN_SQL),
      ],
      links: [
        sync('client-lb', 'client', 'lb', 2000),
        sync('lb-api', 'lb', 'api', 1500),
        sync('api-search', 'api', 'search', 600, { carries: 'r' }),
        sync('api-sql', 'api', 'catalog-db', 1000, { carries: 'w' }),
      ],
      routes: { client: 'split', lb: 'split', api: 'all-sequential' },
    },
    {
      client: { col: 0, row: 2 },
      lb: { col: 1, row: 2 },
      api: { col: 3, row: 2 },
      search: { col: 5, row: 1 },
      'catalog-db': { col: 5, row: 3 },
    },
    SEARCH_LOAD,
    0.9
  ),
  topology: [
    requireKinds(
      'topo-search',
      bi('Có Search Index phục vụ truy vấn tìm kiếm', 'Has a Search Index serving queries'),
      ['search'],
      bi('≥ 1 Search', '≥ 1 Search')
    ),
    requireLink(
      'topo-sql-writes',
      bi('SQL chỉ nhận luồng ghi (carries "w")', 'SQL receives writes only (carries "w")'),
      (l, m) => kindOf(m, l.to) === 'sql' && l.carries === 'w',
      bi('→ SQL (w)', '→ SQL (w)'),
      bi('SQL vẫn nhận truy vấn đọc', 'SQL still receives reads')
    ),
  ],
  scenarios: [
    {
      id: 'steady-3k',
      label: bi('3.000 RPS ổn định (90% tìm kiếm)', 'Steady 3,000 RPS (90% search)'),
      durationSec: 60,
      load: SEARCH_LOAD,
      readRatio: 0.9,
      clientTimeoutMs: 2000,
      dynamicDbNoOverload: {
        window: { fromSec: 5, toSec: 60 },
        allowViolationPct: 2,
        label: bi('Catalog SQL không rơi vào overloaded/down', 'Catalog SQL never overloaded/down'),
      },
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
  maxCostPerHour: 3.0,
  parCostPerHour: 2.25,
  explain: bi(
    'LIKE "%từ khoá%" buộc SQL quét: ~25 ms mỗi truy vấn, nên pool 16 chỉ ra 640 truy vấn/giây. Query Cache trúng 30% vẫn để ~1.890 lượt đọc + 300 lượt ghi đổ xuống SQL. Scale-up không cứu được kiểu truy vấn sai: pool 64 + cỡ ×3 mới đủ sức nhưng tốn ~$3.3/giờ, vượt trần ngân sách. Search Index dùng inverted index nên mỗi truy vấn chỉ ~15 ms và mở rộng theo instance: 2 instance = 4.000 truy vấn/giây (ρ ≈ 0,68). SQL giờ chỉ nhận 300 lượt ghi/giây (ρ ≈ 0,47) và vẫn là nguồn sự thật. Chi phí ≈ $1.93/giờ (chuẩn 3★ ≤ $2.25/giờ). Đánh đổi: thêm một hệ thống phải vận hành và index trễ vài giây so với SQL (nhất quán cuối cùng).',
    "LIKE '%term%' forces SQL to scan: ~25 ms per query, so a 16-connection pool yields only 640 queries/s. A 30%-hit Query Cache still lets ~1,890 reads + 300 writes through to SQL. Scaling up cannot fix the wrong query shape: a 64 pool + ×3 machine finally copes but costs ~$3.3/hr, over the budget cap. A Search Index uses an inverted index, so each query takes ~15 ms and it scales by instance: 2 instances = 4,000 queries/s (ρ ≈ 0.68). SQL now only takes 300 writes/s (ρ ≈ 0.47) and stays the source of truth. Cost ≈ $1.93/hr (3★ par ≤ $2.25/hr). Trade-off: one more system to operate, and the index lags SQL by a few seconds (eventual consistency)."
  ),
};

export const INTERMEDIATE_LABS: LabChallengeSpec[] = [stampede, asyncNotify, searchOffload];
