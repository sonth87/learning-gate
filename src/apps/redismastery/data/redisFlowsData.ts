import type { RedisFlowScenario } from '../types/redis.types';

export const REDIS_FLOW_SCENARIOS: RedisFlowScenario[] = [
  {
    id: 'event-loop-pipeline',
    title: 'Single-Threaded Event Loop (epoll/kqueue) & Pipelining',
    badge: 'R00 · R06',
    moduleRef: 'R00',
    summary:
      'Vì sao 1 luồng thực thi lệnh trong RAM vẫn gánh >100.000 ops/sec mà không cần mutex lock, và cách Pipelining triệt tiêu chi phí khứ hồi mạng (RTT).',
    nodes: [
      { id: 'clients', label: '1,000 Kết nối TCP', sublabel: 'Node.js / Python Workers', lane: 'client', tone: 'sky' },
      { id: 'mux', label: 'I/O Multiplexer', sublabel: 'epoll / kqueue + I/O Threads', lane: 'redis', tone: 'amber' },
      { id: 'loop', label: 'Main Event Loop', sublabel: '1 Luồng Tuần tự · Không Lock', lane: 'redis', tone: 'rose' },
      { id: 'ram', label: 'Keyspace trên RAM', sublabel: 'Dict · SkipList · Listpack (~100ns)', lane: 'storage', tone: 'emerald' },
    ],
    steps: [
      {
        title: 'Bước 1 — Nút cổ chai thật sự nằm ở RTT mạng, không phải CPU',
        activeNodes: ['clients'],
        packetFrom: 'clients',
        packetTo: 'mux',
        packetLabel: '50 lệnh tuần tự = 50 × RTT (~25ms)',
        latencyBadge: 'Sequential: ~25.0 ms',
        commandSnippet: '# Gửi lẻ từng lệnh chờ phản hồi:\nINCR stats:pageviews  # chờ 0.5ms RTT\nINCR stats:pageviews  # chờ 0.5ms RTT ...',
        explanation:
          'Mỗi lệnh Redis thực thi trong RAM chỉ tốn ~0.1–1 µs, nhưng gói tin TCP đi từ App sang Redis và quay về mất ~0.5 ms (gấp ~500 lần). Nếu gửi tuần tự 50 lệnh, worker đứng chờ mạng 99% thời gian.',
      },
      {
        title: 'Bước 2 — Pipelining gom lô lệnh vào 1 chuyến TCP Buffer',
        activeNodes: ['clients', 'mux'],
        packetFrom: 'clients',
        packetTo: 'mux',
        packetLabel: 'Pipeline Batch (50 RESP frames / 1 syscall)',
        latencyBadge: '1× Network Flight',
        commandSnippet: 'const pipe = redis.pipeline();\nfor (const id of ids) pipe.hgetall(`item:${id}`);\nconst replies = await pipe.exec(); // 1 RTT duy nhất!',
        explanation:
          'Client ghi liên tiếp 50 khung RESP vào socket send-buffer mà chưa chờ reply ngay. Số lần chuyển ngữ cảnh kernel (`read`/`write` syscall) và RTT giảm từ 50 xuống chỉ còn 1.',
      },
      {
        title: 'Bước 3 — epoll/kqueue & I/O Threads giải mã song song, xếp hàng sẵn',
        activeNodes: ['mux', 'loop'],
        packetFrom: 'mux',
        packetTo: 'loop',
        packetLabel: 'Parsed Command Queue',
        latencyBadge: 'Zero Thread Contention',
        commandSnippet: '# redis.conf (Redis 8)\nio-threads 4\nio-threads-do-reads yes',
        explanation:
          'Kernel `epoll`/`kqueue` báo socket nào có dữ liệu sẵn. Các I/O threads phụ trách đọc socket và parse RESP song song, rồi chuyển lệnh đã giải mã cho Main Thread.',
      },
      {
        title: 'Bước 4 — Main Event Loop thực thi nguyên tử O(1) trên RAM và trả lô kết quả',
        activeNodes: ['loop', 'ram', 'clients'],
        packetFrom: 'loop',
        packetTo: 'clients',
        packetLabel: '50 Replies trong 1 gói phản hồi',
        latencyBadge: 'Pipelined: ~0.6 ms (Nhanh gấp ~40x)',
        commandSnippet: '# Cảnh báo: một lệnh O(N) như KEYS * (80ms)\n# sẽ chặn đứng toàn bộ hàng đợi phía sau trên Main Loop!',
        explanation:
          'Vì chỉ có duy nhất 1 luồng chạm vào cấu trúc dữ liệu RAM, Redis không tốn CPU cho Mutex Lock hay Context Switch. Hệ quả sống còn: tuyệt đối không chạy lệnh `O(N)` lớn trên production!',
      },
    ],
  },
  {
    id: 'cache-aside-singleflight',
    title: 'Cache-Aside + Singleflight Mutex chống Cache Stampede',
    badge: 'R09 · R10',
    moduleRef: 'R10',
    summary:
      'Khi hot key vừa hết hạn giữa lúc Flash Sale 5,000 req/s, làm sao chỉ cho đúng 1 worker xuống PostgreSQL nạp lại dữ liệu thay vì đánh sập DB?',
    nodes: [
      { id: 'traffic', label: '5,000 Req/s Flash Sale', sublabel: 'GET /products/hot-99', lane: 'client', tone: 'sky' },
      { id: 'cache', label: 'Redis Cache Key', sublabel: 'cache:product:99 + TTL Jitter', lane: 'redis', tone: 'rose' },
      { id: 'mutex', label: 'Mutex Rebuild Lock', sublabel: 'lock:rebuild:99 (SET NX PX)', lane: 'redis', tone: 'amber' },
      { id: 'postgres', label: 'PostgreSQL Primary', sublabel: 'Max 200 Connections', lane: 'storage', tone: 'violet' },
    ],
    steps: [
      {
        title: 'Bước 1 — Hot Key vừa chạm TTL = 0 (Cache Miss đồng loạt)',
        activeNodes: ['traffic', 'cache'],
        packetFrom: 'traffic',
        packetTo: 'cache',
        packetLabel: 'GET cache:product:99 → (nil)',
        latencyBadge: 'Cache Miss Burst!',
        commandSnippet: 'GET cache:product:99\n# -> (nil)  (500 worker cùng nhận nil trong cùng 10ms)',
        explanation:
          'Nếu viết Cache-Aside ngây thơ (`if (!cached) queryDB()`), cả 500 request đồng thời sẽ lao thẳng xuống PostgreSQL làm cạn sạch Connection Pool trong tích tắc (Thundering Herd / Cache Stampede).',
      },
      {
        title: 'Bước 2 — Đua giành khoá Singleflight / Mutex bằng SET NX PX',
        activeNodes: ['traffic', 'mutex'],
        packetFrom: 'traffic',
        packetTo: 'mutex',
        packetLabel: 'SET lock:rebuild:99 <token> NX PX 3000',
        latencyBadge: '1 Winner · 499 Waiters',
        commandSnippet: 'SET lock:rebuild:99 8f14e45f NX PX 3000\n# Worker #1 -> OK (Giành quyền truy vấn DB)\n# Worker #2..500 -> (nil) (Đợi ngắn 30–50ms rồi đọc lại cache)',
        explanation:
          'Redis thực thi `SET ... NX PX` nguyên tử: chỉ duy nhất Worker #1 nhận `OK`. 499 worker còn lại nhận `(nil)` sẽ backoff vài chục ms (hoặc dùng bản stale tạm thời) thay vì chạm vào DB.',
      },
      {
        title: 'Bước 3 — Worker #1 truy vấn PostgreSQL & nạp lại Cache kèm TTL Jitter',
        activeNodes: ['mutex', 'postgres', 'cache'],
        packetFrom: 'postgres',
        packetTo: 'cache',
        packetLabel: 'SET cache:product:99 <json> EX 300+jitter',
        latencyBadge: 'DB Load: Chỉ 1 Query!',
        commandSnippet: 'const ttl = 300 + Math.floor(Math.random() * 60);\nawait redis.set("cache:product:99", JSON.stringify(row), "EX", ttl);',
        explanation:
          'PostgreSQL chỉ xử lý đúng 1 câu SQL nhẹ nhàng. Khi lưu lại vào Redis, Worker #1 cộng thêm `jitter` ngẫu nhiên (0–60s) để hàng loạt sản phẩm không bao giờ hết hạn cùng một giây (chống Cache Avalanche).',
      },
      {
        title: 'Bước 4 — Mở khoá an toàn bằng Lua & phục vụ 499 request từ RAM',
        activeNodes: ['cache', 'mutex', 'traffic'],
        packetFrom: 'cache',
        packetTo: 'traffic',
        packetLabel: '499 Workers → Cache HIT (<0.4ms)',
        latencyBadge: 'Hit Ratio phục hồi 99.9%',
        commandSnippet: 'EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'DEL\',KEYS[1]) else return 0 end" 1 lock:rebuild:99 8f14e45f',
        explanation:
          'Worker #1 đối chiếu token sở hữu rồi xóa khoá bằng Lua script, trong khi 499 worker đang chờ đọc lại `cache:product:99` và nhận ngay dữ liệu nóng từ RAM.',
      },
    ],
  },
  {
    id: 'dist-lock-lua',
    title: 'Distributed Lock: SET NX PX & Giải phẫu Lỗi Xóa Nhầm Khoá',
    badge: 'R07 · R11',
    moduleRef: 'R11',
    summary:
      'Tại sao cặp `SETNX + EXPIRE` rời rạc gây deadlock vĩnh viễn, và tại sao lệnh `DEL lock` trần trụi có thể mở toang cửa cho 2 tiến trình trừ tiền trùng lặp?',
    nodes: [
      { id: 'workerA', label: 'Worker A (GC Pause)', sublabel: 'token = uuid-A', lane: 'client', tone: 'amber' },
      { id: 'workerB', label: 'Worker B (Chuẩn)', sublabel: 'token = uuid-B', lane: 'client', tone: 'sky' },
      { id: 'lockkey', label: 'Redis Lock Key', sublabel: 'lock:payout:order-42', lane: 'redis', tone: 'rose' },
      { id: 'ledger', label: 'Ví Thanh Toán', sublabel: 'Critical Section (Idempotent)', lane: 'storage', tone: 'emerald' },
    ],
    steps: [
      {
        title: 'Bước 1 — Bắt buộc gộp SET <key> <unique_token> NX PX trong 1 lệnh duy nhất',
        activeNodes: ['workerA', 'lockkey'],
        packetFrom: 'workerA',
        packetTo: 'lockkey',
        packetLabel: 'SET lock:payout:42 uuid-A NX PX 5000',
        latencyBadge: 'Atomic Acquire',
        commandSnippet: 'SET lock:payout:42 "uuid-A" NX PX 5000\n# Tuyệt đối KHÔNG tách SETNX rồi mới EXPIRE!',
        explanation:
          'Nếu tách `SETNX` rồi mới gọi `EXPIRE`, và tiến trình crash ngay giữa 2 lệnh, khoá sẽ tồn tại vĩnh viễn (`TTL = -1`) gây Deadlock toàn hệ thống. Giá trị của key bắt buộc là `uuid` riêng của từng worker.',
      },
      {
        title: 'Bước 2 — Bẫy GC Pause / Mạng chậm làm khoá của Worker A tự hết hạn',
        activeNodes: ['workerA', 'workerB', 'lockkey'],
        packetFrom: 'workerB',
        packetTo: 'lockkey',
        packetLabel: 'T+5001ms: Worker B SET NX → OK (uuid-B)',
        latencyBadge: 'Lease Expired',
        commandSnippet: '# T+5001ms: Worker A bị kẹt I/O chưa xong việc,\n# khoá tự hết hạn -> Worker B hợp lệ nhận khoá với giá trị "uuid-B"',
        explanation:
          'Sau 5,000ms, lease của Worker A hết hạn tự động để tránh treo hệ thống. Worker B bước vào hợp lệ và ghi đè giá trị khoá thành `"uuid-B"`.',
      },
      {
        title: 'Bước 3 — Nếu Worker A tỉnh dậy và gọi DEL trần: THẢM HOẠ XÓA KHOÁ CỦA B!',
        activeNodes: ['workerA', 'lockkey'],
        packetFrom: 'workerA',
        packetTo: 'lockkey',
        packetLabel: 'Chặn đứng lệnh DEL mù quáng!',
        latencyBadge: 'Lua Check-and-Del Guard',
        commandSnippet: '-- Lua chạy nguyên tử trên Redis:\nif redis.call("GET", KEYS[1]) == ARGV[1] then\n  return redis.call("DEL", KEYS[1])\nend\nreturn 0',
        explanation:
          'Khi Worker A gọi Lua script kèm `ARGV[1] = "uuid-A"`, Redis thấy giá trị hiện tại là `"uuid-B"` nên trả về `0` và giữ nguyên khoá của Worker B! Nếu gọi `DEL` thường, Worker C sẽ nhảy vào chạy song song với B.',
      },
      {
        title: 'Bước 4 — Worker B hoàn tất giao dịch kèm Fencing Token / Idempotency Key',
        activeNodes: ['workerB', 'ledger', 'lockkey'],
        packetFrom: 'workerB',
        packetTo: 'ledger',
        packetLabel: 'Commit + Lua Release (uuid-B == uuid-B → 1)',
        latencyBadge: 'Exactly-Once Safe',
        commandSnippet: '# DB kiểm tra thêm fencing_token / idempotency_key\n# Sau đó Worker B giải phóng khoá an toàn bằng Lua -> trả về 1',
        explanation:
          'Với tác vụ tài chính cực nhạy cảm, kết hợp Distributed Lock (giảm tranh chấp) + Idempotency Key / Fencing Token tại DB để bảo vệ tuyệt đối ngay cả khi lease hết hạn.',
      },
    ],
  },
  {
    id: 'streams-pel-xack',
    title: 'Redis Streams: Consumer Group, PEL, XACK & XAUTOCLAIM',
    badge: 'R08',
    moduleRef: 'R08',
    summary:
      'Khác với Pub/Sub (mất tin ngay khi consumer rớt mạng), Redis Streams lưu log bền vững, chia tải theo Consumer Group và cứu tin mồ côi qua PEL.',
    nodes: [
      { id: 'producer', label: 'Order API Producer', sublabel: 'XADD orders:stream *', lane: 'client', tone: 'sky' },
      { id: 'stream', label: 'Stream Radix-Tree Log', sublabel: 'MAXLEN ~ 100000', lane: 'redis', tone: 'rose' },
      { id: 'pel', label: 'PEL (Pending Entries List)', sublabel: 'Theo dõi tin chưa XACK', lane: 'redis', tone: 'amber' },
      { id: 'consumers', label: 'Group billing-cg (c1, c2)', sublabel: 'XREADGROUP / XAUTOCLAIM', lane: 'storage', tone: 'emerald' },
    ],
    steps: [
      {
        title: 'Bước 1 — Producer ghi sự kiện kèm giới hạn bộ nhớ MAXLEN ~',
        activeNodes: ['producer', 'stream'],
        packetFrom: 'producer',
        packetTo: 'stream',
        packetLabel: 'XADD orders:stream MAXLEN ~ 10000 * orderId 901',
        latencyBadge: 'ID: 1700000120000-0',
        commandSnippet: 'XADD orders:stream MAXLEN ~ 10000 * orderId 901 amount 450000\n# Toán tử "~" cắt theo từng macro-node của Radix Tree cực nhanh O(1)',
        explanation:
          'Mỗi bản ghi được gắn ID tăng dần `<ms>-<seq>` và lưu trên cấu trúc Radix Tree + Listpack. Luôn kèm `MAXLEN ~` (hoặc `MINID ~`) để Stream không phình vô hạn làm tràn RAM.',
      },
      {
        title: 'Bước 2 — XREADGROUP phân phối tin mới (">") và ghi ngay vào PEL',
        activeNodes: ['stream', 'pel', 'consumers'],
        packetFrom: 'stream',
        packetTo: 'consumers',
        packetLabel: 'Giao cho c1 + Lưu vết vào PEL (delivery=1)',
        latencyBadge: 'At-Least-Once',
        commandSnippet: 'XREADGROUP GROUP billing-cg c1 COUNT 10 BLOCK 2000 STREAMS orders:stream >',
        explanation:
          'Ký hiệu `>` nghĩa là "chỉ lấy các tin chưa từng giao cho consumer nào trong nhóm". Ngay khoảnh khắc giao tin cho `c1`, Redis ghi ID đó vào `PEL` (Pending Entries List) của `billing-cg`.',
      },
      {
        title: 'Bước 3 — Sự cố: Worker c1 crash giữa chừng trước khi kịp gọi XACK!',
        activeNodes: ['pel', 'consumers'],
        packetFrom: 'pel',
        packetTo: 'consumers',
        packetLabel: 'XPENDING phát hiện tin treo > 30,000ms trên c1',
        latencyBadge: 'Orphaned Message!',
        commandSnippet: 'XPENDING orders:stream billing-cg - + 10\n# -> 1700000120000-0  consumer="c1"  idle=45200ms  deliveries=1',
        explanation:
          'Tin nhắn KHÔNG hề bị mất như Pub/Sub hay `LPOP` đơn thuần! Nó vẫn nằm trong `PEL` với bộ đếm thời gian nhàn rỗi (`idle time`) tăng dần.',
      },
      {
        title: 'Bước 4 — Worker c2 dùng XAUTOCLAIM thu hồi tin mồ côi & gọi XACK dọn PEL',
        activeNodes: ['pel', 'consumers', 'stream'],
        packetFrom: 'consumers',
        packetTo: 'pel',
        packetLabel: 'XAUTOCLAIM (>30s) → Xử lý xong → XACK',
        latencyBadge: 'PEL = 0 (Sạch RAM)',
        commandSnippet: 'XAUTOCLAIM orders:stream billing-cg c2 30000 0-0 COUNT 10\n# Xử lý idempotent thành công -> xác nhận hoàn tất:\nXACK orders:stream billing-cg 1700000120000-0',
        explanation:
          'Worker `c2` tự động giành quyền sở hữu các tin bị treo quá `30000ms` từ `c1`, xử lý xong và gọi `XACK` để xóa mục đó khỏi `PEL`. Nếu delivery vượt ngưỡng (VD >5 lần), đẩy sang Dead-Letter Stream.',
      },
    ],
  },
  {
    id: 'bgsave-cow-aof',
    title: 'BGSAVE Copy-on-Write (fork) & AOF Hybrid Persistence',
    badge: 'R13',
    moduleRef: 'R13',
    summary:
      'Làm sao Redis chụp ảnh 20 GB RAM xuống đĩa mà không đóng băng Main Thread, và vì sao server 32 GB RAM đặt maxmemory 28 GB vẫn bị Linux OOM Killer bắn hạ lúc BGSAVE?',
    nodes: [
      { id: 'parent', label: 'Redis Parent Process', sublabel: 'Tiếp tục phục vụ Read/Write', lane: 'redis', tone: 'rose' },
      { id: 'pagetable', label: 'OS Kernel Page Tables', sublabel: 'Copy-on-Write (4KB Pages)', lane: 'redis', tone: 'amber' },
      { id: 'child', label: 'Forked Child Process', sublabel: 'BGSAVE / BGREWRITEAOF', lane: 'storage', tone: 'sky' },
      { id: 'disk', label: 'SSD Persistence', sublabel: 'dump.rdb + appendonly.aof', lane: 'storage', tone: 'emerald' },
    ],
    steps: [
      {
        title: 'Bước 1 — Tuyệt đối dùng BGSAVE (không bao giờ dùng SAVE trên production)',
        activeNodes: ['parent', 'pagetable', 'child'],
        packetFrom: 'parent',
        packetTo: 'child',
        packetLabel: 'fork() chỉ nhân bản Page Table (~vài ms)',
        latencyBadge: 'Zero Full-RAM Copy',
        commandSnippet: '# SAVE chặn cứng Main Thread hàng chục giây -> CẤM!\n# BGSAVE gọi fork(): Parent & Child dùng chung trang RAM vật lý ban đầu',
        explanation:
          'Nhờ cơ chế ảo hóa bộ nhớ của Linux/Unix, `fork()` không chép 20 GB dữ liệu ngay lập tức mà chỉ sao chép bảng trỏ trang (Page Table) và đánh dấu các trang bộ nhớ là Read-Only dùng chung.',
      },
      {
        title: 'Bước 2 — Copy-on-Write (CoW): Chỉ nhân bản những trang 4KB bị ghi đè',
        activeNodes: ['parent', 'pagetable'],
        packetFrom: 'parent',
        packetTo: 'pagetable',
        packetLabel: 'Write mới → Kernel tách riêng trang 4KB bị sửa',
        latencyBadge: 'Cần dự phòng 30–45% RAM trống!',
        commandSnippet: '# Cảnh báo OOM kinh điển:\n# Nếu write-heavy sửa 60% số trang trong lúc BGSAVE -> RAM tăng gần gấp đôi!\n# Quy tắc vàng: maxmemory <= 55% - 65% tổng RAM máy chủ.',
        explanation:
          'Child đọc bản chụp đóng băng tại thời điểm `fork()`. Khi Parent xử lý lệnh `SET`/`HSET` mới, Kernel mới chép riêng trang 4KB đó ra vùng mới cho Parent sửa — đây là lý do phải chừa headroom RAM cho CoW!',
      },
      {
        title: 'Bước 3 — AOF appendfsync everysec: Điểm cân bằng vàng (tối đa mất 1 giây)',
        activeNodes: ['parent', 'disk'],
        packetFrom: 'parent',
        packetTo: 'disk',
        packetLabel: 'Background fsync mỗi 1 giây',
        latencyBadge: 'RPO <= 1s · Tốc độ gần như RAM',
        commandSnippet: 'appendonly yes\nappendfsync everysec\naof-use-rdb-preamble yes',
        explanation:
          '`appendfsync always` ép đĩa mỗi lệnh làm sụt throughput hàng chục lần; `no` phó mặc OS có thể mất 30s dữ liệu. `everysec` giao việc `fsync` cho background thread mỗi giây — nhanh gần bằng in-memory thuần.',
      },
      {
        title: 'Bước 4 — Hybrid RDB-AOF Rewrite (Redis 7/8 Multi-Part AOF)',
        activeNodes: ['child', 'disk'],
        packetFrom: 'child',
        packetTo: 'disk',
        packetLabel: '[RDB Binary Preamble] + [Incremental AOF Tail]',
        latencyBadge: 'Khởi động nhanh + Bền dữ liệu',
        commandSnippet: '# Khi khởi động lại sau sự cố:\n# 1) Nạp phần đầu RDB nhị phân cực nhanh\n# 2) Replay phần đuôi lệnh AOF mới phát sinh để không mất dữ liệu!',
        explanation:
          'Với `aof-use-rdb-preamble yes` (mặc định trên Redis 7/8), file AOF sau khi nén gồm phần đầu là snapshot RDB gọn nhẹ cộng phần đuôi là các lệnh AOF tăng trưởng — kết hợp ưu điểm của cả hai thế giới.',
      },
    ],
  },
  {
    id: 'sentinel-quorum-failover',
    title: 'Redis Sentinel Quorum: SDOWN → ODOWN → Raft Election → Failover',
    badge: 'R14',
    moduleRef: 'R14',
    summary:
      'Quá trình 3 tiến trình Sentinel phát hiện Master chết, bỏ phiếu quá bán chống Split-Brain và thăng cấp Replica mới lên thay thế tự động.',
    nodes: [
      { id: 'sentinels', label: 'Cụm 3 Sentinel Nodes', sublabel: 'quorum = 2 · majority = 2/3', lane: 'client', tone: 'amber' },
      { id: 'master', label: 'Master Cũ (10.0.1.10)', sublabel: 'Sự cố mất kết nối mạng', lane: 'redis', tone: 'rose' },
      { id: 'replica1', label: 'Replica 1 (10.0.1.11)', sublabel: 'repl_offset cao nhất', lane: 'storage', tone: 'emerald' },
      { id: 'replica2', label: 'Replica 2 (10.0.1.12)', sublabel: 'Đồng bộ từ Master mới', lane: 'storage', tone: 'sky' },
    ],
    steps: [
      {
        title: 'Bước 1 — SDOWN (Subjective Down): 1 Sentinel thấy Master ngừng trả lời PING',
        activeNodes: ['sentinels', 'master'],
        packetFrom: 'sentinels',
        packetTo: 'master',
        packetLabel: 'PING timeout > down-after-milliseconds (5000ms)',
        latencyBadge: '+sdown master mymaster',
        commandSnippet: 'sentinel monitor mymaster 10.0.1.10 6379 2\nsentinel down-after-milliseconds mymaster 5000',
        explanation:
          'Một Sentinel đơn lẻ chưa được phép tự ý failover vì có thể chính đường mạng của Sentinel đó bị chập chờn. Nó đánh dấu `SDOWN` (chủ quan) và lập tức hỏi ý kiến các Sentinel còn lại.',
      },
      {
        title: 'Bước 2 — ODOWN (Objective Down) & Bầu Sentinel Leader theo Raft',
        activeNodes: ['sentinels'],
        packetFrom: 'sentinels',
        packetTo: 'sentinels',
        packetLabel: 'SENTINEL is-master-down-by-addr → 2/3 đồng thuận!',
        latencyBadge: '+odown · Leader Epoch +1',
        commandSnippet: '# Quorum (2) xác nhận Master chết -> chuyển sang ODOWN\n# Majority (2/3 Sentinel) bỏ phiếu bầu Sentinel #1 làm Leader thực thi failover',
        explanation:
          '`quorum` là số Sentinel cần để kết luận Master chết (`ODOWN`), còn để thực sự thi hành failover, Sentinel Leader phải thắng phiếu **quá bán** (`majority = floor(N/2) + 1`) của tổng số Sentinel (vì vậy luôn triển khai số lẻ: 3 hoặc 5).',
      },
      {
        title: 'Bước 3 — Chọn Replica tốt nhất & gửi lệnh REPLICAOF NO ONE',
        activeNodes: ['sentinels', 'replica1'],
        packetFrom: 'sentinels',
        packetTo: 'replica1',
        packetLabel: 'REPLICAOF NO ONE (Thăng cấp thành Master mới)',
        latencyBadge: '+promoted-slave 10.0.1.11',
        commandSnippet: '# Tiêu chí chọn: replica-priority thấp hơn > replication offset mới nhất > runid\nREPLICAOF NO ONE',
        explanation:
          'Sentinel Leader loại bỏ các replica mất kết nối quá lâu, chọn `Replica 1` có `repl_offset` sát với Master cũ nhất để giảm thiểu mất dữ liệu bất đồng bộ, và thăng cấp nó lên làm Master.',
      },
      {
        title: 'Bước 4 — Cấu hình lại Replica còn lại, thông báo Client & hạ cấp Master cũ khi sống lại',
        activeNodes: ['sentinels', 'replica1', 'replica2', 'master'],
        packetFrom: 'replica1',
        packetTo: 'replica2',
        packetLabel: 'PSYNC2 Partial Resync + Pub/Sub +switch-master',
        latencyBadge: 'Failover Hoàn tất (~6–10s)',
        commandSnippet: '# Client ioredis/redis-py lắng nghe kênh +switch-master tự trỏ sang 10.0.1.11\n# Khi 10.0.1.10 sống lại, Sentinel ép nó thành REPLICAOF 10.0.1.11 6379!',
        explanation:
          'Nhờ `Replication ID` thứ 2 và `repl-backlog-size`, `Replica 2` đồng bộ tiếp tục với `Replica 1` bằng `PSYNC2` (không cần chép lại toàn bộ RDB). Khi Master cũ tỉnh dậy, nó ngoan ngoãn trở thành Replica.',
      },
    ],
  },
];
