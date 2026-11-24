import type { BilingualText, CalloutKind } from '@/components/scale-workbench/types';
import type { ModuleCuratedBlueprint } from '@/features/devops-course/scale/courseLessonBuilder';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

export const REDIS_LEVEL_TITLES: Record<number, BilingualText> = {
  0: bi('Kiến trúc In-Memory, Event Loop & RESP3', 'In-Memory Architecture & RESP3'),
  1: bi('Cấu trúc Dữ liệu Cốt lõi & Xác suất', 'Core & Probabilistic Data Structures'),
  2: bi('Pipelining, Transaction, Lua & Streams', 'Pipelining, Atomic Lua & Streams'),
  3: bi('Chiến lược Caching, Lock & Rate Limit', 'Caching Patterns, Locks & Rate Limiting'),
  4: bi('Eviction, RDB/AOF & Sentinel HA', 'Memory Eviction, RDB/AOF & Sentinel HA'),
  5: bi('Redis Cluster 16384 Slots & Bảo mật ACL', 'Redis Cluster 16384 Slots & ACL Security'),
};

export const REDIS_BLUEPRINTS: Record<string, ModuleCuratedBlueprint> = {
  R00: {
    id: 'R00',
    titleEn: 'Single-Threaded Event Loop & >100k ops/sec',
    subtitleEn: 'How epoll/kqueue I/O multiplexing, RESP framing, and lock-free RAM execution achieve sub-millisecond throughput.',
    durationMin: 13,
    difficulty: 'Beginner',
    primaryMode: 'isometric',
    objectives: [
      bi('Hiểu cơ chế I/O Multiplexing (epoll/kqueue) phục vụ hàng chục nghìn kết nối trên 1 luồng thực thi chính', 'Understand epoll/kqueue I/O multiplexing feeding a single lock-free execution thread'),
      bi('Nắm cấu trúc khung truyền nhẹ của giao thức RESP2 / RESP3 trên Python, Node.js & Go', 'Inspect lightweight length-prefixed RESP2/RESP3 protocol frames across SDKs'),
      bi('Giải thích vì sao một lệnh O(N) chậm (KEYS *) làm nghẽn toàn bộ hàng đợi lệnh phía sau', 'Explain why a single O(N) command stalls every queued client request'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const blocked = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : blocked ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Cơ sở dữ liệu trên ổ cứng (PostgreSQL/MySQL) mất vài mili-giây cho I/O đĩa, trong khi Redis lưu dữ liệu trực tiếp trên RAM (~100 nano-giây) và thực thi tuần tự trên 1 luồng chính giúp triệt tiêu tranh chấp Mutex Lock.',
              'Disk databases spend milliseconds on storage I/O, while Redis keeps data in RAM (~100ns) and executes commands sequentially on one main thread with zero Mutex Lock contention.'
            )
          : s === 1
            ? bi(
                'Biến dict/Map cục bộ bị cô lập trong từng tiến trình riêng lẻ; Redis tách kho cấu trúc dữ liệu RAM thành dịch vụ dùng chung qua mạng cho các ứng dụng Python (redis-py), Node.js (ioredis) và Go.',
                'In-process dicts/Maps die with each pod; Redis provides a shared network RAM data-structure store across Python, Node.js, Go, and Java.'
              )
            : blocked
              ? bi(
                  'Lưu ý quan trọng: Vì luồng thực thi dữ liệu là đơn luồng, một lệnh O(N) như KEYS * quét hàng triệu khóa sẽ chặn toàn bộ các lệnh đứng sau trong hàng đợi. Luôn kiểm tra độ phức tạp Big-O trước khi dùng.',
                  'Critical rule: Data execution is single-threaded — one O(N) command like KEYS * stalls every concurrent client behind it! Always check Big-O.'
                )
              : bi(
                  'Quy tắc kiến trúc ngày 1: Luôn khóa bind nội bộ (127.0.0.1 / Private VPC), bật protected-mode yes, ghim image redis:8.0-alpine và bật slowlog-log-slower-than 10000.',
                  'Day-1 architect rule: Bind to loopback/Private VPC, keep protected-mode yes, pin redis:8.0-alpine, and log commands slower than 10ms in SLOWLOG.'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Đưa dữ liệu lên RAM (~100ns) và xử lý tuần tự trên 1 luồng chính giúp triệt tiêu 100% chi phí Mutex Lock', 'Placed data in RAM (~100ns) on a single execution thread eliminating mutex lock overhead') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Ghép kênh 10.000 kết nối TCP qua epoll/kqueue và truyền khung RESP3 ghi sẵn độ dài byte ở đầu', 'Multiplexed 10k TCP sockets via epoll/kqueue using length-prefixed RESP3 frames') }]
            : blocked
              ? [{ op: '~' as const, text: bi('Lệnh KEYS * O(N) chiếm độc quyền Event Loop suốt 800ms làm toàn bộ GET/SET phía sau đứng hình!', 'O(N) KEYS * monopolized the Event Loop for 800ms causing head-of-line blocking!') }]
              : [{ op: '+' as const, text: bi('Khóa cổng nội bộ bind 127.0.0.1, bật protected-mode yes và giám sát lệnh chậm qua SLOWLOG', 'Locked bind to private interface, enabled protected-mode, and armed SLOWLOG') }];

      return {
        telemetry: [
          {
            label: bi('THÔNG LƯỢNG', 'THROUGHPUT'),
            value: blocked ? bi('0 ops/s (bị chặn!)', '0 ops/s (stalled!)') : s === 0 ? bi('125,000 ops/sec', '125,000 ops/sec') : bi('180,000+ ops/sec', '180,000+ ops/sec'),
            tone: blocked ? 'bad' : 'ok',
          },
          {
            label: bi('ĐỘ TRỄ P99', 'P99 LATENCY'),
            value: blocked ? bi('850 ms (KEYS *!)', '850 ms (KEYS *!)') : bi('0.35 ms (RAM)', '0.35 ms (RAM)'),
            tone: blocked ? 'bad' : 'ok',
          },
          { label: bi('THỰC THI LỆNH', 'COMMAND THREAD'), value: bi('Single-threaded · 0 Lock', 'Single-threaded · 0 Lock'), tone: 'ok' },
          { label: bi('BẢO VỆ & I/O', 'GUARD & I/O'), value: isLast ? bi('protected-mode yes', 'protected-mode yes') : bi('io-threads 4 · RESP3', 'io-threads 4 · RESP3'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'cli', shape: 'crowd', tone: 'neutral', x: -250, y: 0, label: bi('10k App Clients', '10k App Clients'), sublabel: bi('redis-py · ioredis', 'redis-py · ioredis'), highlighted: s === 0 },
            {
              id: 'io',
              shape: 'block',
              tone: isLast ? 'green' : 'blue',
              x: -55,
              y: -38,
              label: bi('epoll · RESP3', 'epoll · RESP3'),
              icon: isLast ? 'shield' : 'globe',
              highlighted: s === 1 || isLast,
              badge: {
                text: isLast ? bi('bind 127.0.0.1', 'bind 127.0.0.1') : bi('I/O Multiplexing', 'I/O Multiplexing'),
                tone: 'ok',
              },
            },
            {
              id: 'loop',
              shape: 'block',
              tone: blocked ? 'rose' : 'green',
              x: 145,
              y: 22,
              label: bi('Event Loop', 'Event Loop'),
              icon: 'zap',
              loadPct: blocked ? 100 : 28,
              highlighted: s === 0 || blocked,
              badge: {
                text: blocked ? bi('Nghẽn bởi KEYS *!', 'Blocked by KEYS *!') : bi('1 Thread · 0 Mutex', '1 Thread · 0 Mutex'),
                tone: blocked ? 'bad' : 'ok',
              },
            },
            { id: 'ram', shape: 'db', tone: 'purple', x: 270, y: -42, label: bi('RAM Keyspace', 'RAM Keyspace'), highlighted: s === 1 },
          ],
          links: [
            { id: 'l1', from: 'cli', to: 'io', label: bi('RESP3 frames', 'RESP3 frames') },
            { id: 'l2', from: 'io', to: 'loop', style: blocked ? 'danger' : 'solid', label: blocked ? bi('KEYS * O(N)!', 'KEYS * O(N)!') : bi('FIFO queue', 'FIFO queue') },
            { id: 'l3', from: 'loop', to: 'ram', label: bi('O(1) ~100ns', 'O(1) ~100ns') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: blocked ? 'error' : 'pointer', speed: blocked ? 0.18 : 0.48, offset: 0.34 },
            { id: 'p3', linkId: 'l3', kind: 'cache-hit', speed: 0.52, offset: 0.66 },
          ],
        },
        defaultCode: `SET session:u42 "active" EX 3600\nINCR metrics:api:hits\nGET session:u42\nTTL session:u42`,
      };
    },
  },

  R01: {
    id: 'R01',
    titleEn: 'Strings (SDS), TTL Lifecycle & Non-Blocking Keyspace Hygiene',
    subtitleEn: 'Master Simple Dynamic Strings, atomic counters, EX/PX expiration, SCAN cursors, and async UNLINK.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Hiểu cấu trúc chuỗi động SDS (lưu sẵn độ dài len ở header giúp STRLEN đạt O(1))', 'Understand binary-safe SDS layout storing explicit O(1) length'),
      bi('Thiết lập TTL nguyên tử ngay khi ghi bằng SET key val NX EX sec', 'Combine value write, TTL, and condition atomically via SET key val NX EX s'),
      bi('Duyệt khóa an toàn bằng con trỏ SCAN và xóa khóa lớn bất đồng bộ bằng UNLINK', 'Iterate safely with SCAN and delete large keys asynchronously via UNLINK'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'technique' : s === 2 && !isLast ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Mỗi cặp Key -> String trong Redis gồm khóa định danh phân cấp (service:entity:id) và giá trị chuỗi an toàn nhị phân (tối đa 512MB), có thể gắn thời gian tự hết hạn (TTL).',
              'Each Redis Key -> String pair maps a hierarchical key (service:entity:id) to a binary-safe value (up to 512MB) with an optional automatic TTL expiration.'
            )
          : s === 1
            ? bi(
                'Cấu trúc SDS lưu sẵn trường độ dài len ở header, giúp STRLEN chạy trong O(1), lưu được dữ liệu nhị phân và tự động nén số nguyên 64-bit vào encoding int.',
                'Because SDS stores an explicit len header upfront, STRLEN is O(1), binary bytes are safe, and 64-bit integers pack directly into int encoding.'
              )
            : s === 2 && !isLast
              ? bi(
                  'Lỗi thường gặp: Không tách SETNX và EXPIRE thành 2 lệnh rời. Nếu ứng dụng sập ở giữa, khóa sẽ mang TTL = -1 (không tự hết hạn). Luôn gộp thành SET k v NX EX 60.',
                  'Classic bug: Never send SETNX followed by a separate EXPIRE — a crash in between leaks a persistent key (TTL = -1)! Always fuse SET k v NX EX 60.'
                )
              : bi(
                  'Quy tắc kiến trúc: Không bao giờ gõ KEYS * hay DEL trên khóa lớn ở Production — luôn lặp bằng con trỏ SCAN 0 MATCH ... COUNT 200 kết hợp UNLINK + TTL Jitter!',
                  'Architect rule: Ban KEYS * and synchronous DEL on big keys — always paginate with SCAN and reclaim memory in the background via UNLINK + TTL Jitter!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Tổ chức không gian khóa theo chuẩn phân cấp dấu hai chấm app:otp:u42 kèm hẹn giờ tự hủy', 'Structured colon-namespaced keys app:otp:u42 with automatic TTL expiration') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Đóng gói chuỗi ngắn ≤ 44B vào embstr trên đúng 1 dòng CPU Cache và lưu sẵn len=8 giúp STRLEN O(1)', 'Packed ≤44B strings into single-cache-line embstr with O(1) SDS len header') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Gộp kiểm tra NX + ghi giá trị + đặt hạn EX vào duy nhất 1 lệnh SET nguyên tử chống Zombie Key', 'Fused NX check + value + EX timer into a single atomic SET preventing Zombie Keys') }]
              : [{ op: '+' as const, text: bi('Kết hợp xóa lười + xóa chủ động (hz 10) và dùng SCAN + UNLINK giải phóng RAM không chặn luồng chính', 'Paired lazy/active TTL expiration with non-blocking SCAN + UNLINK cleanup') }];

      return {
        telemetry: [
          { label: bi('ĐỘ DÀI STRLEN', 'STRLEN COST'), value: s <= 1 ? bi('O(1) (nhờ header SDS)', 'O(1) (SDS len field)') : bi('embstr ≤ 44B · int 8B', 'embstr ≤ 44B · int 8B'), tone: 'ok' },
          { label: bi('GHI NGUYÊN TỬ', 'ATOMIC SET'), value: bi('SET k v NX EX 120', 'SET k v NX EX 120'), tone: 'ok' },
          { label: bi('VỆ SINH KHOÁ', 'KEY HYGIENE'), value: isLast ? bi('SCAN + UNLINK (Nền)', 'SCAN + UNLINK (Async)') : bi('TTL: -2 | -1 | ≥0s', 'TTL: -2 | -1 | ≥0s'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'tape',
          title: bi('Cấu trúc bộ nhớ SDS & Cơ chế hết hạn TTL', 'SDS Memory Layout & Atomic TTL Lifecycle'),
          subtitle:
            s <= 1
              ? bi('Header ghi sẵn len=7, alloc=16 ➔ hỏi STRLEN trả lời tức thì O(1), không sợ byte 0x00', 'Explicit len & alloc header ➔ O(1) STRLEN & binary safety')
              : bi('Gộp nguyên tử NX + EX ngay lúc tạo khóa · Thu hồi êm ái bằng con trỏ SCAN + UNLINK', 'Atomic NX + EX on write · Safe background reclamation via SCAN + UNLINK'),
          cells:
            s <= 1
              ? ['len=7', 'alloc=16', 'embstr', '"u"', '"s"', '"e"', '"r"', '"_"', '"42"']
              : ['SET', 'otp:u42', '"482910"', 'NX', 'EX 120', 'TTL=119s', 'SCAN 0', 'UNLINK'],
          activeIndices: s === 0 ? [0, 2, 8] : s === 1 ? [0, 1, 2] : s === 2 ? [0, 3, 4, 5] : [5, 6, 7],
          pointers:
            s <= 1
              ? [
                  { index: 0, label: 'O(1) STRLEN', tone: 'green' },
                  { index: 2, label: '≤ 44B embstr', tone: 'blue' },
                ]
              : [
                  { index: 4, label: 'Atomic NX+EX', tone: 'green' },
                  { index: 7, label: 'Async Free', tone: 'purple' },
                ],
          outputPill: {
            label: isLast ? bi('Chuẩn dọn dẹp Production', 'Production Hygiene') : bi('Mã trả về của lệnh TTL', 'TTL Return Codes'),
            value: isLast
              ? bi('SCAN cursor + UNLINK ở luồng BIO nền', 'Cursor SCAN + async BIO UNLINK')
              : bi('≥0: giây còn sống · -1: vĩnh viễn · -2: đã xoá', '≥0: seconds left · -1: immortal · -2: missing'),
            tone: 'green',
          },
        },
        defaultCode: `SET app:otp:8490123 "482910" EX 120 NX\nINCRBY app:wallet:u42 50000\nGET app:otp:8490123\nTTL app:otp:8490123`,
      };
    },
  },

  R02: {
    id: 'R02',
    titleEn: 'Hashes, listpack Compression & Per-Field HEXPIRE (Redis 8)',
    subtitleEn: 'Model structured entities in 70% less RAM with listpack encoding and expire individual hash fields in Redis 8.',
    durationMin: 13,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Biểu diễn đối tượng nhiều trường bằng Hash thay vì tải cả cục JSON lớn hoặc băm nhỏ hàng chục String key rời', 'Model multi-field entities cleanly in one Hash instead of full JSON blobs or scattered keys'),
      bi('Hiểu cơ chế nén liền khối listpack giúp tiết kiệm tới ~70% RAM cho Hash vừa và nhỏ', 'Leverage contiguous listpack encoding to cut memory footprint by up to 70%'),
      bi('Sử dụng lệnh HEXPIRE / HTTL của Redis 8 để đặt TTL độc lập cho từng trường trong Hash', 'Expire individual fields inside a Hash natively with Redis 8 HEXPIRE'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : s === 2 && !isLast ? 'technique' : 'watch-out';
      const calloutText =
        s === 0
          ? bi(
              'Lưu cả đối tượng vào String JSON buộc phải tải và ghi đè toàn bộ chuỗi mỗi lần sửa 1 thuộc tính; ngược lại Redis Hash cho phép đọc và cập nhật trực tiếp từng trường (HINCRBY, HSET) ngay trên RAM.',
              'Storing an object as a JSON String requires downloading and rewriting the entire payload for any small edit; Redis Hash updates individual fields in place via HINCRBY and HSET.'
            )
          : s === 1
            ? bi(
                'Quy tắc chọn nhanh: Dữ liệu lồng sâu luôn đọc nguyên khối -> dùng String JSON (hoặc Redis JSON trên Redis 8); đối tượng phẳng hay đọc/sửa từng trường -> chọn Redis Hash.',
                'Rule of thumb: Deeply nested read-all payloads -> String/RedisJSON; flat entities with frequent partial reads/counters -> Redis Hash!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Tối ưu bộ nhớ: Khi số trường và độ dài giá trị nằm dưới ngưỡng cấu hình, toàn bộ Hash được đóng gói liền khối trong listpack không tốn con trỏ phụ (~70% nhẹ hơn tách lẻ String).',
                  'RAM optimization: Small hashes live inside a flat contiguous listpack byte array with zero pointer overhead — saving ~70% RAM vs separate String keys!'
                )
              : bi(
                  'Quy tắc Redis 8: Dùng HEXPIRE key sec FIELDS n field... để tự hủy mã giảm giá/OTP tạm ngay trong Hash, và luôn dùng HMGET / HSCAN thay vì HGETALL trên Hash lớn.',
                  'Redis 8 rule: Use HEXPIRE key sec FIELDS n field... for per-field TTLs, and always prefer HMGET / HSCAN over blocking HGETALL on large hashes!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Gom các thuộc tính rời của user:42 vào cấu trúc Hash giúp cập nhật lẻ từng trường nguyên tử', 'Grouped user:42 attributes into one Hash enabling atomic per-field updates') }]
          : s === 1
            ? [{ op: '~' as const, text: bi('Loại bỏ lỗi ghi đè mất dữ liệu (Lost Update) khi 2 request cùng tải và ghi đè chuỗi JSON', 'Eliminated JSON read-modify-write Lost Update races via in-place HINCRBY') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Đóng gói liền mạch bằng listpack thân thiện CPU Cache (tự nâng lên hashtable nếu vượt ngưỡng)', 'Packed fields contiguously in CPU-cache-friendly listpack encoding') }]
              : [{ op: '+' as const, text: bi('Gắn đồng hồ tự hủy 900s riêng cho trường mã giảm giá promo:flash50 bằng HEXPIRE của Redis 8', 'Attached independent 900s TTL to promo:flash50 field via Redis 8 HEXPIRE') }];

      return {
        telemetry: [
          { label: bi('MÃ HÓA NỘI BỘ', 'ENCODING'), value: s === 2 ? bi('listpack ➔ hashtable', 'listpack ➔ hashtable') : bi('listpack (liền khối)', 'listpack (contiguous)'), tone: 'ok' },
          { label: bi('TIẾT KIỆM RAM', 'RAM SAVED'), value: bi('~65–70% so với lẻ key', '~65–70% vs split keys'), tone: 'ok' },
          { label: bi('REDIS 8 MỚI', 'REDIS 8 FEATURE'), value: bi('HEXPIRE ... FIELDS', 'HEXPIRE ... FIELDS'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'refs',
          leftTitle: bi('Khóa Hash trên Keyspace', 'Single Keyspace Entry'),
          rightTitle: bi('Các ngăn trường bên trong (listpack + HEXPIRE)', 'Packed Fields & Per-Field TTL'),
          names: [
            { id: 'hk', name: 'cart:u:777', note: bi('OBJECT ENCODING → listpack', 'listpack compact'), targetId: 'f1', style: 'solid' },
            {
              id: 'hk2',
              name: isLast ? 'HEXPIRE 900 FIELDS 1' : 'HMGET / HINCRBY',
              note: isLast ? bi('Tự huỷ riêng trường tạm!', 'Per-field TTL!') : bi('Đọc/sửa lẻ O(1)', 'O(1) field ops'),
              targetId: 'f2',
              style: isLast ? 'dashed' : 'solid',
            },
          ],
          objects: [
            {
              id: 'f1',
              typeTag: 'persistent fields',
              value: 'sku:airpods="1" · sku:case="2"',
              fields: ['HINCRBY sku:airpods 1 → O(1)', 'Sống trọn 7 ngày theo giỏ hàng'],
              tone: s <= 2 ? 'green' : 'blue',
              badge: s === 2 ? bi('Nén listpack', 'listpack packed') : undefined,
            },
            {
              id: 'f2',
              typeTag: 'ephemeral field',
              value: 'promo:flash50="GIAM50K"',
              fields: ['HTTL → 900s (15 phút)', 'Tự bốc hơi, giữ nguyên giỏ hàng!'],
              tone: isLast ? 'orange' : 'purple',
              badge: bi('HEXPIRE (Redis 8)', 'HEXPIRE (Redis 8)'),
            },
          ],
        },
        defaultCode: `HSET user:42 name "An" tier "pro" points 100 otp "918204"\nHINCRBY user:42 points 25\nHEXPIRE user:42 60 FIELDS 1 otp\nHMGET user:42 name points otp`,
      };
    },
  },

  R03: {
    id: 'R03',
    titleEn: 'Lists (quicklist) & Sets (intset): Queues & Set Algebra',
    subtitleEn: 'Build O(1) double-ended queues with LPUSH/BLMOVE, cap history via LTRIM, and run O(1) unique membership checks.',
    durationMin: 12,
    difficulty: 'Beginner',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Dùng LPUSH + LTRIM giữ N thông báo mới nhất và LMOVE/BLMOVE bàn giao việc không rớt tin', 'Build capped feeds via LPUSH + LTRIM and reliable handoffs with LMOVE/BLMOVE'),
      bi('Tận dụng Set (SADD / SISMEMBER O(1)) để tự động khử trùng và nén mảng số nguyên bằng intset', 'Deduplicate in O(1) with SADD/SISMEMBER and pack integer sets via intset'),
      bi('Biết khi nào dùng thư viện Task Queue dựng sẵn (Celery, ARQ, RQ, BullMQ) trên nền Redis', 'Know when to adopt battle-tested Redis task queues like Celery, ARQ, RQ, and BullMQ'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind = s === 0 ? 'key-idea' : s === 1 ? 'technique' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Redis List dùng cấu trúc quicklist (danh sách liên kết gồm các khối listpack nén) cho phép thêm/lấy hai đầu đạt O(1); Redis Set lưu tập hợp không trùng lặp với thao tác kiểm tra thành viên SISMEMBER đạt O(1).',
              'Redis List uses quicklist (a doubly-linked list of packed listpack nodes) for O(1) head/tail ops, while Redis Set stores unique items with O(1) SISMEMBER lookups.'
            )
          : s === 1
            ? bi(
                'Mẹo bảo vệ tác vụ nền: Luôn kẹp LPUSH + LTRIM để danh sách không phình vô hạn, và dùng LMOVE (hoặc Celery / ARQ / BullMQ) thay vì RPOP trần để không mất việc khi worker sập!',
                'Queue safety: Always pair LPUSH with LTRIM to cap list growth, and use atomic LMOVE (or Celery / ARQ / BullMQ) so crashed workers never drop jobs!'
              )
            : bi(
                'Quy tắc Set chuẩn: Dùng SISMEMBER / SMISMEMBER (O(1)) thay vì tải cả tập SMEMBERS về app; giữ ID thuần số nguyên để hưởng nén intset siêu nhẹ và dùng SINTERCARD khi chỉ cần đếm!',
                'Set architect rule: Check membership via SISMEMBER/SMISMEMBER instead of SMEMBERS, keep numeric IDs pure for intset compression, and count overlaps with SINTERCARD!'
              );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Ghép danh sách liên kết hai đầu với các khối nén listpack tạo thành cấu trúc quicklist O(1)', 'Combined doubly-linked list with packed listpack nodes into O(1) quicklist') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Giới hạn bảng tin cố định 50 mục bằng LPUSH + LTRIM 0 49 và chuyển việc an toàn bằng LMOVE', 'Capped activity feed via LPUSH + LTRIM 0 49 and added atomic LMOVE handoff') }]
            : [{ op: '+' as const, text: bi('Nén tập ID số nguyên bằng intset giảm 80% RAM và đếm giao tập hợp nhanh bằng SINTERCARD', 'Compressed integer Sets with intset (-80% RAM) and bounded intersections via SINTERCARD') }];

      return {
        telemetry: [
          { label: bi('ĐẦU & CUỐI LIST', 'HEAD / TAIL OPS'), value: bi('LPUSH / LMOVE · O(1)', 'LPUSH / LMOVE · O(1)'), tone: 'ok' },
          { label: bi('TRUY CẬP GIỮA', 'LINDEX MIDDLE'), value: bi('O(N) (tránh dùng!)', 'O(N) (avoid!)'), tone: 'warn' },
          { label: bi('KIỂM TRA SET', 'SET LOOKUP'), value: isLast ? bi('SISMEMBER O(1) · intset', 'SISMEMBER O(1) · intset') : bi('LPUSH + LTRIM 0 49', 'LPUSH + LTRIM 0 49'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'tape',
          title: isLast
            ? bi('Redis Set: Khử trùng O(1) & Nén mảng số nguyên intset', 'Redis Set: O(1) Membership & Compact intset')
            : bi('Redis quicklist: Hàng đợi hai đầu O(1) giới hạn độ dài với LTRIM', 'Redis quicklist: Bounded Double-Ended Queue'),
          subtitle: isLast
            ? bi('Lưu thuần số nguyên ≤ 512 mục ➔ tự bật intset liền khối · Kiểm tra SISMEMBER O(1)', 'Pure 64-bit integers ≤ 512 items ➔ contiguous intset · O(1) SISMEMBER')
            : bi('LPUSH chèn đầu trái O(1) · LTRIM 0 4 giữ đúng 5 sự kiện mới nhất · LMOVE bốc cuối phải an toàn', 'LPUSH head O(1) · LTRIM 0 4 caps size · LMOVE pops tail atomically'),
          cells: isLast ? ['1001', '1042', '2048', '4096', '8192'] : ['evt_9', 'evt_8', 'evt_7', 'evt_6', 'evt_5'],
          activeIndices: isLast ? [1, 3] : s === 0 ? [0, 4] : [0, 1, 2],
          pointers: isLast
            ? [
                { index: 1, label: 'SISMEMBER → 1', tone: 'green' },
                { index: 3, label: 'intset 8-byte', tone: 'purple' },
              ]
            : [
                { index: 0, label: 'LPUSH O(1)', tone: 'green' },
                { index: 4, label: 'LMOVE / LTRIM', tone: 'blue' },
              ],
          outputPill: {
            label: isLast ? bi('Cấm gọi trên tập lớn', 'Never run on huge sets') : bi('Thư viện Queue thực tế', 'Production Task Queues'),
            value: isLast ? bi('Thay SMEMBERS bằng SISMEMBER / SSCAN', 'Use SISMEMBER / SSCAN instead of SMEMBERS') : bi('Python: Celery, ARQ, RQ · Node: BullMQ', 'Python: Celery, ARQ, RQ · Node: BullMQ'),
            tone: 'green',
          },
        },
        defaultCode: `LPUSH feed:u42 "login" "view_item" "add_cart" "checkout"\nLTRIM feed:u42 0 2\nLRANGE feed:u42 0 -1\nSADD online:users "u42" "u99" "u42"\nSCARD online:users`,
      };
    },
  },

  R04: {
    id: 'R04',
    titleEn: 'Sorted Sets (ZSet) & Multi-Level Skip List O(log N)',
    subtitleEn: 'Power real-time leaderboards, delayed job schedulers, and sliding-window rate limiters with ZADD and ZRANGE.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Hiểu cấu trúc kép của ZSet: Hash Table (tra điểm O(1)) và Skip List nhiều tầng (tìm kiếm và xếp hạng O(log N))', 'Understand ZSet dual internals: Hash Table O(1) + multi-level Skip List O(log N)'),
      bi('Sử dụng cú pháp ZRANGE hợp nhất trên Redis 8 (kèm cờ REV, BYSCORE, LIMIT) và ZADD GT/LT', 'Use unified Redis 8 ZRANGE (REV, BYSCORE, LIMIT) and conditional ZADD GT/LT'),
      bi('Ứng dụng ZSet cho 3 bài toán lớn: Bảng xếp hạng thời gian thực, Cửa sổ trượt Rate Limit & Hẹn giờ Job', 'Apply ZSet to real-time leaderboards, sliding-window rate limiters, and delayed queues'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : s === 2 && !isLast ? 'technique' : 'watch-out';
      const calloutText =
        s === 0
          ? bi(
              'Skip List duy trì thứ tự các phần tử bằng nhiều tầng con trỏ nhảy bước (tầng cao nhảy bước lớn, tầng đáy nối tuần tự), giúp tìm kiếm và xếp hạng trong 10 triệu phần tử chỉ mất ~23 bước so sánh O(log N).',
              'Skip List maintains sorted elements using multi-level forward pointers (upper levels jump large spans, base level links sequentially), ranking 10M items in ~23 O(log N) hops.'
            )
          : s === 1
            ? bi(
                'Trên SQL, ORDER BY score DESC kèm cập nhật điểm dồn dập làm nghẽn cứng chỉ mục; ZSet ghép Hash Table (ZSCORE O(1)) với Skip List kèm bộ đếm khoảng cách span (ZRANK O(log N)) trong < 0.2ms!',
                'In SQL, heavy concurrent updates + ORDER BY score DESC thrash B-trees; ZSet pairs an O(1) Dict with span-counted Skip List pointers in < 0.2ms!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Trên Redis 8, không cần học thuộc cả chục lệnh ZREVRANGEBYSCORE cũ: chỉ cần 1 lệnh ZRANGE kết hợp cờ REV, BYSCORE, WITHSCORES và bảo vệ kỷ lục bằng ZADD GT!',
                  'In Redis 8, forget legacy ZREVRANGEBYSCORE variants: one unified ZRANGE command with REV, BYSCORE, WITHSCORES handles every range query!'
                )
              : bi(
                  'Lưu ý kiến trúc sư: Trong CLI, điểm score đứng TRƯỚC member (ZADD k score member), và score là số thực IEEE 754 64-bit chỉ chính xác nguyên tuyệt đối tới 2^53 (đừng nhét Snowflake ID 19 chữ số vào score)!',
                  'Architect watch-out: Score comes BEFORE member in CLI, and IEEE-754 float64 scores are exact for integers only up to 2^53 — never store 64-bit Snowflake IDs as scores!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Ghép song song bảng băm Dict (tra điểm O(1)) và danh sách nhảy nhiều tầng Skip List (O(log N))', 'Paired O(1) Hash Table score lookup with O(log N) multi-level Skip List') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Gắn độ dài bước nhảy span lên từng mũi tên tầng cao để tính thứ hạng ZRANK trong O(log N)', 'Added span counters on express pointers enabling O(log N) ZRANK calculation') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Chuẩn hóa truy vấn Top-K và lọc khoảng thời gian bằng ZRANGE ... REV / BYSCORE hợp nhất', 'Unified Top-K and timestamp window queries under Redis 8 ZRANGE ... REV / BYSCORE') }]
              : [{ op: '+' as const, text: bi('Ứng dụng Unix Timestamp làm score cho Sliding Window Rate Limiter và Delayed Job Queue', 'Used Unix timestamps as scores for Sliding Window Rate Limiting & Delayed Jobs') }];

      return {
        telemetry: [
          { label: bi('CẬP NHẬT & HẠNG', 'ZADD / ZRANK'), value: bi('O(log N) (~20 bước/1M)', 'O(log N) (~20 hops/1M)'), tone: 'ok' },
          { label: bi('TRA ĐIỂM LẺ', 'ZSCORE(member)'), value: bi('O(1) (qua Hash Table)', 'O(1) (via Hash Table)'), tone: 'ok' },
          { label: bi('GIỚI HẠN SỐ NGUYÊN', 'EXACT INT CAP'), value: isLast ? bi('≤ 2^53 (IEEE 754)', '≤ 2^53 (IEEE 754)') : bi('ZRANGE ... REV O(logN+K)', 'ZRANGE ... REV O(logN+K)'), tone: isLast ? 'warn' : 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'tree',
          title: bi('Cấu trúc kép của ZSet: Skip List nhiều tầng + Bảng băm O(1)', 'ZSet Dual Engine: Multi-Level Skip List + O(1) Dict'),
          nodes: [
            { id: 'l3a', x: -225, y: -105, label: 'Level 3 Head', sub: bi('tầng cao (span=2)', 'top layer (span=2)'), tone: s === 1 ? 'green' : 'purple' },
            { id: 'l3b', x: 225, y: -105, label: 'Level 3 → 980', sub: bi('nhảy vọt O(log N)', 'O(log N) jump'), tone: s === 1 ? 'green' : 'purple' },
            { id: 'n1', x: -225, y: 12, label: 'An: 120', tone: 'blue' },
            { id: 'n2', x: 0, y: 12, label: 'Bình: 600', sub: bi('bỏ qua ở tầng 3', 'skipped at L3'), tone: 'neutral', pruned: s === 1 },
            { id: 'n3', x: 225, y: 12, label: 'Chi: 980', sub: bi('ZREVRANK → #0 (Top 1)', 'ZREVRANK → #0 (Top 1)'), tone: 'green' },
            { id: 'dict', x: 0, y: 102, label: 'Dict: ZSCORE("Chi") → 980', sub: bi('Tra điểm tức thì O(1)', 'Direct O(1) score lookup'), tone: s === 0 || isLast ? 'orange' : 'blue' },
          ],
          edges: [
            { from: 'l3a', to: 'l3b', label: 'span = 2 (express)' },
            { from: 'l3a', to: 'n1', style: 'dashed' },
            { from: 'l3b', to: 'n3', style: 'dashed' },
            { from: 'n1', to: 'n2' },
            { from: 'n2', to: 'n3' },
          ],
        },
        defaultCode: `ZADD lb:weekly 120 "An" 450 "Binh" 980 "Chi"\nZINCRBY lb:weekly 150 "Binh"\nZRANGE lb:weekly 0 2 REV WITHSCORES\nZREVRANK lb:weekly "Chi"`,
      };
    },
  },

  R05: {
    id: 'R05',
    titleEn: 'Probabilistic & Spatial Structures: Bitmap, HyperLogLog, Bloom & Geo',
    subtitleEn: 'Count 100M unique visitors in 12 KB RAM with HyperLogLog and block cache-penetration misses via Bloom Filters.',
    durationMin: 13,
    difficulty: 'Intermediate',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Đếm hàng trăm triệu khách truy cập duy nhất (UV) chỉ tốn cố định 12 KB RAM bằng HyperLogLog', 'Count 100M+ unique visitors in a fixed 12 KB using HyperLogLog'),
      bi('Dùng Bitmap (1 bit/user) tính chuỗi đăng nhập liên tục và Bloom Filter chặn các truy vấn ID không tồn tại', 'Track 1-bit flags with Bitmaps and block nonexistent IDs via native Redis 8 Bloom Filters'),
      bi('Tìm tài xế quanh bán kính thực tế bằng GEOSEARCH (nhớ quy tắc Kinh độ đứng trước Vĩ độ!)', 'Query nearby locations with GEOSEARCH remembering Longitude comes before Latitude'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : s === 2 && !isLast ? 'technique' : 'watch-out';
      const calloutText =
        s === 0
          ? bi(
              'Ở quy mô 100 triệu phần tử, lưu toàn bộ ID vào Set tốn hàng GB RAM; HyperLogLog đánh đổi sai số chuẩn 0.81% để giữ dung lượng cố định đúng 12 KB bằng 16,384 thanh ghi xác suất.',
              'At 100M items, storing exact IDs in a Set burns GBs of RAM; HyperLogLog trades 0.81% standard error to maintain a fixed 12 KB footprint using probabilistic registers.'
            )
          : s === 1
            ? bi(
                'Chọn công cụ chuẩn: Điểm danh 0/1 theo ID số nguyên -> Bitmap; đếm lượt người xem duy nhất -> HyperLogLog (12 KB); lọc trước các ID không tồn tại -> Bloom Filter (có sẵn trong Redis 8).',
                'Pick the right tool: 0/1 daily flags -> Bitmap; unique visitor count -> HyperLogLog (12 KB); front-door guard against nonexistent IDs -> native Redis 8 Bloom Filter!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Tính chất cốt lõi của Bloom Filter: Khi BF.EXISTS trả về 0 nghĩa là CHẮC CHẮN 100% mục đó chưa từng tồn tại trong Database — chặn ngay lập tức không tốn truy vấn SQL.',
                  'Bloom Filter invariant: BF.EXISTS == 0 means 100% GUARANTEED absent in the database — reject immediately with zero SQL load!'
                )
              : bi(
                  'Hai cái bẫy phải thuộc lòng: (1) GEOADD luôn truyền KINH ĐỘ (Lon) trước VĨ ĐỘ (Lat) và xóa bằng ZREM; (2) Không truyền offset tỷ vào SETBIT thưa thớt kẻo cấp phát nhầm 512 MB số 0!',
                  'Two classic traps: (1) GEOADD always takes Longitude BEFORE Latitude (and deletes via ZREM); (2) Never pass sparse billion-offsets to SETBIT or you allocate 512 MB of zeros!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Đổi bộ đếm Unique Visitors từ Set (~3.5 GB) sang HyperLogLog đóng trần cố định 12 KB RAM', 'Switched Unique Visitor counter from multi-GB Set to fixed 12 KB HyperLogLog') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Dùng phép toán bit BITOP AND trên Bitmap lọc triệu user online liên tiếp 3 ngày trong vài ms', 'Computed 3-day active user streaks in milliseconds via Bitmap BITOP AND') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Kích hoạt Bloom Filter tích hợp sẵn trên Redis 8 (BF.RESERVE / BF.EXISTS) chặn truy vấn rác', 'Armed built-in Redis 8 Bloom Filter (BF.EXISTS) blocking nonexistent SKU lookups') }]
              : [{ op: '+' as const, text: bi('Mã hóa tọa độ (Lon, Lat) thành Geohash 52-bit trên ZSet để quét bán kính 3km bằng GEOSEARCH', 'Encoded (Lon, Lat) as 52-bit Geohash scores on ZSet for fast GEOSEARCH radius queries') }];

      return {
        telemetry: [
          { label: bi('100M USER SET RAM', '100M SET RAM'), value: bi('~3.5 GB RAM!', '~3.5 GB RAM!'), tone: 'bad' },
          { label: bi('100M HYPERLOGLOG', '100M HLL RAM'), value: bi('12 KB cố định! (±0.81%)', '12 KB fixed! (±0.81%)'), tone: 'ok' },
          { label: isLast ? bi('THỨ TỰ TỌA ĐỘ GEO', 'GEO COORD ORDER') : bi('BLOOM FILTER', 'BLOOM GUARANTEE'), value: isLast ? bi('Longitude trước, Latitude sau', 'Longitude first, Latitude second') : bi('0% Âm tính giả (BF=0 chặn!)', '0% False Negative'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'tape',
          title: isLast
            ? bi('Chỉ mục Không gian Geospatial: Đan bit Kinh độ & Vĩ độ thành Geohash 52-bit', 'Geospatial Index: Interleaved 52-bit Geohash on ZSet')
            : bi('Mảng Bit Xác Suất: Bitmap (1 bit/user) & Bloom Filter trên Redis 8', 'Bit-Level Array: Bitmap & Native Redis 8 Bloom Filter'),
          subtitle: isLast
            ? bi('GEOADD key Lon Lat member ➔ lưu vào ZSet · Tìm quanh bán kính bằng GEOSEARCH · Xóa bằng ZREM', 'GEOADD key Lon Lat member ➔ stored in ZSet · Query via GEOSEARCH · Delete via ZREM')
            : bi('Bloom trả về 0 ➔ Chắc chắn 100% không có trong DB (chặn ngay tại cửa, bảo vệ PostgreSQL!)', 'If Bloom bit == 0 ➔ 100% guaranteed absent in DB (instant front-door reject)'),
          cells: isLast
            ? ['Lon:106.70', 'Lat:10.77', 'Geohash52', 'GEOSEARCH', 'BYRADIUS', '3 km', 'ASC', 'ZREM']
            : ['1', '0', '1', '1', '0', '0', '1', '0'],
          activeIndices: isLast ? [0, 1, 3, 5] : s === 2 ? [0, 2, 5, 6] : [0, 2, 3, 6],
          pointers: isLast
            ? [
                { index: 0, label: 'Lon TRƯỚC!', tone: 'orange' },
                { index: 3, label: 'Quét 9 ô lưới', tone: 'green' },
              ]
            : [
                { index: 2, label: 'h1(key)=1', tone: 'green' },
                { index: 5, label: 'bit=0 → Chặn!', tone: 'orange' },
              ],
          outputPill: {
            label: bi('HyperLogLog PFCOUNT', 'HyperLogLog PFCOUNT'),
            value: bi('12 KB cố định cho 100+ triệu lượt xem duy nhất', 'Fixed 12 KB even at 100M+ unique items'),
            tone: 'green',
          },
        },
        defaultCode: `PFADD uv:2026-11-21 "u1" "u2" "u3" "u2" "u4"\nPFCOUNT uv:2026-11-21\nSETBIT checkin:u42 1 1\nSETBIT checkin:u42 5 1\nBITCOUNT checkin:u42`,
      };
    },
  },

  R06: {
    id: 'R06',
    titleEn: 'Pipelining, MULTI/EXEC/WATCH & Why Redis Does NOT Rollback',
    subtitleEn: 'Eliminate network Round-Trip Time (RTT) bottlenecks via Pipelining and understand optimistic locking with WATCH.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi('Gom lô 100–1.000 lệnh trong 1 chuyến mạng (Pipeline) tăng thông lượng gấp 10–50 lần', 'Batch 100–1,000 commands in a single network RTT via Pipelining for 10–50× throughput'),
      bi('Hiểu rõ MULTI/EXEC chỉ cô lập tuần tự chứ KHÔNG tự động Rollback khi lệnh lẻ sai kiểu dữ liệu lúc chạy!', 'Understand MULTI/EXEC guarantees isolation, NOT SQL-style rollback on runtime errors'),
      bi('Dùng khóa lạc quan WATCH cho bài toán ít va chạm và xóa khóa lớn bằng UNLINK + lazyfree', 'Use optimistic WATCH for low-contention CAS and async UNLINK + lazyfree for cleanup'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const noPipe = s === 0;
      const rollbackTrap = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : rollbackTrap ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Gửi tuần tự 500 lệnh rời rạc khiến ứng dụng mất 500 lần chờ khứ hồi mạng RTT (~250ms); TCP Pipelining gửi dồn toàn bộ lô lệnh qua socket trong 1 lượt và nhận phản hồi một lần (~1.2ms).',
              'Sending 500 serial commands incurs 500 network RTT waits (~250ms); TCP Pipelining batches all 500 commands into a single socket flush and response read (~1.2ms).'
            )
          : s === 1
            ? bi(
                'Mẹo SDK đa ngôn ngữ: Trong Node.js ioredis, redis.pipeline() là Pure Pipeline; còn trong Python redis-py, nhớ truyền r.pipeline(transaction=False) nếu không cần bọc MULTI/EXEC.',
                'SDK tip: In Node ioredis, redis.pipeline() is pure batching; in Python redis-py, pass r.pipeline(transaction=False) when you do not need MULTI/EXEC!'
              )
            : rollbackTrap
              ? bi(
                  'Khác biệt quan trọng so với SQL: Trong MULTI ... EXEC, nếu lệnh #2 bị lỗi kiểu dữ liệu (WRONGTYPE), lệnh #1 và #3 VẪN CHẠY THÀNH CÔNG, Redis không tự động Rollback.',
                  'Key difference from SQL: Inside MULTI ... EXEC, if command #2 fails at runtime (WRONGTYPE), commands #1 and #3 STILL COMMIT — zero rollback!'
                )
              : bi(
                  'Quy tắc kiến trúc: Dùng WATCH trước MULTI cho khóa ít đụng độ (nếu đụng độ cao như Flash Sale, hãy chuyển sang Lua ở R07) và luôn dọn khóa lớn bằng UNLINK + lazyfree.',
                  'Architect rule: Use WATCH + MULTI for low-contention optimistic updates (switch to Lua in R07 under heavy contention!) and delete big keys via UNLINK.'
                );

      const whatChanged =
        s === 0
          ? [{ op: '~' as const, text: bi('Gửi tuần tự từng lệnh kiểu ping-pong khiến 98% thời gian bị đốt vào chờ khứ hồi mạng (RTT)', 'Sequential ping-pong calls waste 98% of wall-clock time waiting on network RTT') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Đóng gói 200 lệnh vào 1 chuyến TCP Pipeline giúp vọt thông lượng gấp hàng chục lần', 'Flushed 200 commands in one TCP Pipeline round-trip boosting throughput >20×') }]
            : rollbackTrap
              ? [{ op: '~' as const, text: bi('Lệnh lỗi kiểu WRONGTYPE lúc chạy EXEC không hoàn tác các lệnh hợp lệ đứng trước và sau nó!', 'Runtime WRONGTYPE error inside EXEC left sibling commands committed without rollback!') }]
              : [{ op: '+' as const, text: bi('Áp dụng khóa lạc quan WATCH trước MULTI và bật thu hồi nền UNLINK + lazyfree-lazy-*', 'Armed WATCH optimistic CAS guard and enabled non-blocking UNLINK + lazyfree') }];

      return {
        telemetry: [
          { label: bi('100 LỆNH LẺ RTT', '100 SERIAL CMDS'), value: bi('100 × 0.5ms = 50 ms', '100 × 0.5ms = 50 ms'), tone: noPipe ? 'bad' : 'warn' },
          { label: bi('1 PIPELINE LÔ', '1 PIPELINE BATCH'), value: bi('1 RTT ≈ 1.1 ms', '1 RTT ≈ 1.1 ms'), tone: 'ok' },
          { label: bi('MULTI ROLLBACK?', 'RUNTIME ROLLBACK?'), value: rollbackTrap ? bi('KHÔNG Rollback lỗi kiểu!', 'NO runtime rollback!') : bi('WATCH CAS + UNLINK', 'WATCH CAS + UNLINK'), tone: rollbackTrap ? 'bad' : 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'app', shape: 'device', tone: 'neutral', x: -240, y: 8, label: bi('App Client', 'App Client'), sublabel: bi('Python / Node / Go', 'Python / Node / Go'), highlighted: noPipe },
            {
              id: 'pipe',
              shape: 'block',
              tone: noPipe ? 'orange' : rollbackTrap ? 'rose' : 'green',
              x: 0,
              y: -25,
              label: noPipe ? bi('100 RTTs lẻ', '100 Serial RTTs') : rollbackTrap ? bi('MULTI / EXEC', 'MULTI / EXEC') : bi('Pipeline + WATCH', 'Pipeline + WATCH'),
              icon: rollbackTrap ? 'alert' : 'layers',
              highlighted: s === 1 || rollbackTrap,
              badge: {
                text: noPipe ? bi('Chờ mạng từng lệnh', 'Wait RTT per cmd') : rollbackTrap ? bi('Không Rollback!', 'No Rollback!') : bi('Gộp 1 chuyến mạng', '1 TCP round-trip'),
                tone: noPipe ? 'warn' : rollbackTrap ? 'bad' : 'ok',
              },
            },
            { id: 'redis', shape: 'db', tone: 'purple', x: 235, y: 12, label: bi('Redis Engine', 'Redis Engine'), highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'app', to: 'pipe', label: noPipe ? bi('1 cmd / trip', '1 cmd / trip') : bi('batch 1 RTT', 'batch 1 RTT') },
            { id: 'l2', from: 'pipe', to: 'redis', style: rollbackTrap ? 'danger' : 'solid', label: isLast ? bi('WATCH + EXEC', 'WATCH + EXEC') : bi('QUEUED ➔ EXEC', 'QUEUED ➔ EXEC') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: noPipe ? 0.25 : 0.62 },
            { id: 'p2', linkId: 'l2', kind: rollbackTrap ? 'error' : 'response', speed: noPipe ? 0.25 : 0.62, offset: 0.45 },
          ],
        },
        defaultCode: `SET stock:iphone 5\nMULTI\nDECR stock:iphone\nINCR orders:count\nEXEC\nGET stock:iphone`,
      };
    },
  },

  R07: {
    id: 'R07',
    titleEn: 'Lua Scripting & Redis Functions: Zero Race Conditions',
    subtitleEn: 'Execute complex check-and-decrement business invariants atomically inside the Redis engine with EVALSHA.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi('Hiểu vì sao đọc GET về ứng dụng rồi mới gửi DECR luôn dính lỗi bán âm kho (TOCTOU Race Condition)', 'See why app-side GET followed by DECR causes inventory overselling under concurrency'),
      bi('Gói trọn kiểm tra + trừ kho vào kịch bản Lua chạy nguyên tử 100% qua EVALSHA / register_script', 'Fuse check-and-decrement into an atomic server-side Lua script via EVALSHA'),
      bi('Tuân thủ 3 quy tắc bắt buộc của Lua: chỉ số đếm từ 1, ép kiểu tonumber(), và truyền mọi tên khóa qua KEYS[]', 'Follow the 3 Lua rules: 1-based indexing, tonumber() casts, and explicit KEYS[]'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const racy = s === 0;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : s === 2 && !isLast ? 'technique' : 'watch-out';
      const calloutText =
        s === 0
          ? bi(
              'Tách thành 2 lệnh GET rồi DECR từ phía ứng dụng tạo khoảng trễ mạng để request khác xen vào giữa (TOCTOU Race Condition); gửi kịch bản Lua giúp kiểm tra điều kiện và cập nhật nguyên tử ngay trên luồng chính Redis trong 1 RTT.',
              'Splitting GET then DECR on the client leaves a network gap for concurrent writes (TOCTOU Race Condition); a Lua script executes check-and-update atomically on Redis in 1 RTT.'
            )
          : s === 1
            ? bi(
                'Đối chiếu thực tế: Dưới tải 1.000 req/s đêm Flash Sale, GET + DECR rời làm âm kho -35 đơn; nhúng if cur >= qty then DECRBY vào Lua đảm bảo tồn kho dừng chuẩn xác ở con số 0!',
                'Under 1,000 req/s flash-sale load, split GET + DECR oversells to -35; atomic server-side Lua stops cleanly at exactly 0!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Mẹo băng thông: Đừng gửi lại đoạn code Lua dài ở mỗi request — dùng r.register_script() trong Python hoặc defineCommand() trong ioredis để tự động gọi bằng mã băm 40 ký tự EVALSHA!',
                  'Bandwidth pro-tip: Use Python r.register_script() or ioredis defineCommand() to cache the script once and execute via lightweight 40-char SHA1 EVALSHA!'
                )
              : bi(
                  'Ba quy tắc bắt buộc khi viết Lua: (1) Mảng đếm từ KEYS[1], ARGV[1]; (2) Luôn bọc tonumber() vì chuỗi "9" > "10" là true; (3) Không tự ghép tên khóa ngoài KEYS[] để tương thích Redis Cluster.',
                  'Three mandatory Lua rules: (1) 1-based KEYS[1], ARGV[1]; (2) Always wrap tonumber() ("9" > "10" lexicographically!); (3) Never build key names outside KEYS[]!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '~' as const, text: bi('Hai máy chủ cùng đọc thấy stock = 1 cách nhau 0.2ms rồi cùng gửi DECR làm âm kho -1!', 'Two app servers both read stock == 1 within 0.2ms and decremented stock to -1!') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Nhúng kiểm tra điều kiện và trừ kho vào hộp cát Lua chạy nguyên tử 100% trong 1 RTT', 'Embedded conditional check + decrement inside atomic single-RTT Lua sandbox') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Nạp sẵn mã băm SHA1 để chạy EVALSHA cho cả trừ kho, nhả khóa an toàn và Rate Limiter', 'Cached script SHA1 for zero-overhead EVALSHA across locks, quotas, and rate limits') }]
              : [{ op: '+' as const, text: bi('Tách bạch tuyệt đối mọi tên khóa vào KEYS[1..N] và tham số vào ARGV[1..N] chuẩn Cluster', 'Enforced strict KEYS[1..N] vs ARGV[1..N] separation for Redis Cluster safety') }];

      return {
        telemetry: [
          { label: bi('TỒN KHO CUỐI', 'FINAL STOCK'), value: racy ? bi('-3 (Bán lố âm kho!)', '-3 (Oversold bug!)') : bi('0 (Chính xác 100%)', '0 (Zero oversell)'), tone: racy ? 'bad' : 'ok' },
          { label: bi('TÍNH NGUYÊN TỬ', 'ATOMICITY'), value: racy ? bi('2 nhịp rời (TOCTOU!)', '2-step TOCTOU race!') : bi('1 nhịp EVALSHA', '1 atomic EVALSHA'), tone: racy ? 'bad' : 'ok' },
          { label: bi('QUY TẮC LUA', 'LUA INVARIANT'), value: isLast ? bi('KEYS[1] + tonumber()', 'KEYS[1] + tonumber()') : bi('1 RTT · 0 chen ngang', '1 RTT · 0 interleaving'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'w', shape: 'crowd', tone: 'neutral', x: -245, y: 5, label: bi('50 Flash-Sale Req', '50 Flash-Sale Req'), highlighted: racy },
            {
              id: 'lua',
              shape: 'block',
              tone: racy ? 'rose' : 'green',
              x: 5,
              y: -25,
              label: racy ? bi('GET rồi DECR', 'GET then DECR') : bi('Lua Sandbox', 'Lua Sandbox'),
              icon: racy ? 'alert' : 'shield',
              highlighted: !racy,
              badge: {
                text: racy ? bi('Dính Race Condition!', 'TOCTOU Race Bug!') : isLast ? bi('KEYS[1] · tonumber()', 'KEYS[1] · tonumber()') : bi('EVALSHA Nguyên tử', 'Atomic EVALSHA'),
                tone: racy ? 'bad' : 'ok',
              },
            },
            { id: 'kv', shape: 'db', tone: 'blue', x: 240, y: 12, label: bi('KEYS[1] Stock', 'KEYS[1] Stock'), highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'w', to: 'lua', style: racy ? 'danger' : 'solid', label: racy ? bi('2 RTTs chen ngang!', 'interleaved 2 RTTs!') : bi('1 RTT EVALSHA', '1 RTT EVALSHA') },
            { id: 'l2', from: 'lua', to: 'kv', label: bi('check + decr', 'check + decr') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: racy ? 'error' : 'request', speed: 0.48 },
            { id: 'p2', linkId: 'l2', kind: 'mutation', speed: 0.48, offset: 0.45 },
          ],
        },
        defaultCode: `SET inv:sku1 2\nEVAL "local v = tonumber(redis.call('GET', KEYS[1]) or '0'); if v >= tonumber(ARGV[1]) then return redis.call('DECRBY', KEYS[1], ARGV[1]) else return -1 end" 1 inv:sku1 2\nGET inv:sku1`,
      };
    },
  },

  R08: {
    id: 'R08',
    titleEn: 'Pub/Sub vs Redis Streams: Durable Logs, PEL & XAUTOCLAIM',
    subtitleEn: 'Upgrade fire-and-forget Pub/Sub to persistent Consumer Groups with XACK confirmation and crash recovery.',
    durationMin: 15,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi('Phân biệt rõ Pub/Sub (truyền tin tức thời không lưu trữ) với Redis Streams (Event Log bền vững)', 'Contrast ephemeral fire-and-forget Pub/Sub with durable append-only Redis Streams'),
      bi('Hiểu vòng đời danh sách chờ PEL (Pending Entries List), xác nhận XACK và thu hồi tin treo bằng XAUTOCLAIM', 'Master Consumer Group PEL tracking, XACK confirmation, and XAUTOCLAIM crash recovery'),
      bi('Biết khi nào chọn Celery/ARQ/BullMQ, khi nào chọn Redis Streams và khi nào mới cần tới Apache Kafka', 'Choose wisely among Celery/ARQ/BullMQ, Redis Streams, and Apache Kafka'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const pubsubStep = s === 0;
      const pelStep = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : pelStep ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Pub/Sub gửi tin tức thời nhưng không lưu trữ (client mất kết nối trong lúc deploy sẽ mất tin); Redis Streams lưu Event Log bền vững kết hợp Consumer Group và danh sách chờ xác nhận PEL.',
              'Pub/Sub delivers messages immediately without persistence (offline clients miss messages); Redis Streams stores a durable Event Log with Consumer Groups and Pending Entries List (PEL).'
            )
          : s === 1
            ? bi(
                'Bản đồ hệ sinh thái: Cần chạy job nền Python/Node -> dùng Celery, ARQ, BullMQ; cần luồng sự kiện bền vững < 1ms cho Microservices -> dùng Redis Streams; cần lưu hàng TB lịch sử nhiều tháng -> dùng Kafka!',
                'Ecosystem map: Background jobs -> Celery / ARQ / BullMQ; sub-ms durable microservice events -> Redis Streams; multi-TB long-term disk retention -> Apache Kafka!'
              )
            : pelStep
              ? bi(
                  'Hai nguyên nhân dễ gây tràn RAM cần tránh: (1) XACK chỉ xóa khỏi PEL chứ không xóa tin gốc — luôn gắn XADD MAXLEN ~ 10000; (2) Worker sập để lại tin mồ côi trong PEL — phải quét XAUTOCLAIM.',
                  'Two common RAM leak pitfalls: (1) XACK clears PEL, NOT the stream — always cap via XADD MAXLEN ~ 10000; (2) Crashed workers leave orphaned PEL entries — reclaim via XAUTOCLAIM.'
                )
              : bi(
                  'Quy tắc kiến trúc sư: Vì Streams giao tin At-Least-Once (có thể giao lại qua XAUTOCLAIM khi pod cũ sập), hàm xử lý đơn hàng của Worker bắt buộc phải thiết kế chống chạy trùng (Idempotent)!',
                  'Architect rule: Because Streams + XAUTOCLAIM guarantee At-Least-Once delivery, every consumer handler MUST be idempotent!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Nâng cấp từ Pub/Sub không lưu trữ sang nhật ký bền vững Redis Streams có lưu vết', 'Upgraded from ephemeral Pub/Sub to durable append-only Redis Streams') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Tạo Consumer Group chia việc song song cho nhiều Worker kèm cắt ngọn xấp xỉ MAXLEN ~ O(1)', 'Created Consumer Group scaling workers horizontally with O(1) MAXLEN ~ trimming') }]
            : pelStep
              ? [{ op: '~' as const, text: bi('Worker #1 sập nguồn giữa chừng: bản tin được giữ an toàn trong sổ PEL và Worker #2 gọi XAUTOCLAIM giải cứu!', 'Worker #1 crashed mid-flight: PEL preserved the entry for Worker #2 XAUTOCLAIM takeover!') }]
              : [{ op: '+' as const, text: bi('Khép kín chu trình Worker chuẩn Production: XAUTOCLAIM tin treo ➔ XREADGROUP > ➔ Idempotent ➔ XACK', 'Completed production worker loop: XAUTOCLAIM idle PEL ➔ XREADGROUP > ➔ Idempotent ➔ XACK') }];

      return {
        telemetry: [
          { label: bi('PUB/SUB KHI DEPLOY', 'PUB/SUB ON DEPLOY'), value: bi('Rớt mạng = Mất tin!', 'Offline = Lost msg!'), tone: pubsubStep ? 'bad' : 'warn' },
          { label: bi('REDIS STREAMS', 'REDIS STREAMS'), value: bi('MAXLEN ~ + Sổ PEL', 'MAXLEN ~ + PEL Log'), tone: 'ok' },
          { label: bi('GIẢI CỨU WORKER SẬP', 'CRASH RECOVERY'), value: pelStep ? bi('XAUTOCLAIM > 60s!', 'XAUTOCLAIM > 60s!') : bi('XACK sạch sổ PEL', 'Clean XACK on PEL'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'prod', shape: 'device', tone: 'neutral', x: -260, y: 12, label: bi('Order Service', 'Order Service'), highlighted: s === 0 },
            { id: 'str', shape: 'db', tone: 'yellow', x: -55, y: -25, label: bi('Stream + PEL', 'Stream + PEL'), highlighted: s === 1 || pelStep },
            {
              id: 'w1',
              shape: 'block',
              tone: pelStep ? 'rose' : 'green',
              x: 215,
              y: -62,
              label: bi('Worker #1', 'Worker #1'),
              icon: pelStep ? 'alert' : 'zap',
              highlighted: s === 1,
              badge: {
                text: pelStep ? bi('Sập nguồn (Kẹt PEL!)', 'Crashed (Stuck PEL!)') : bi('XACK hoàn tất ✔', 'XACK clean ✔'),
                tone: pelStep ? 'bad' : 'ok',
              },
            },
            {
              id: 'w2',
              shape: 'block',
              tone: pelStep || isLast ? 'green' : 'purple',
              x: 215,
              y: 66,
              label: bi('Worker #2', 'Worker #2'),
              icon: 'shield',
              highlighted: pelStep || isLast,
              badge: { text: bi('XAUTOCLAIM thu hồi', 'XAUTOCLAIM reclaim'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'prod', to: 'str', label: bi('XADD MAXLEN ~', 'XADD MAXLEN ~') },
            { id: 'l2', from: 'str', to: 'w1', style: pelStep ? 'danger' : 'solid', label: bi('XREADGROUP >', 'XREADGROUP >') },
            { id: 'l3', from: 'str', to: 'w2', style: pelStep ? 'solid' : 'dashed', label: bi('XAUTOCLAIM 60s', 'XAUTOCLAIM 60s') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: pelStep ? 'error' : 'response', speed: 0.46, offset: 0.4 },
            { id: 'p3', linkId: 'l3', kind: 'mutation', speed: pelStep ? 0.56 : 0.4, offset: 0.7 },
          ],
        },
        defaultCode: `XADD orders:stream * orderId "ORD-101" amount "250000"\nXGROUP CREATE orders:stream billing_grp 0 MKSTREAM\nXREADGROUP GROUP billing_grp worker-1 COUNT 1 STREAMS orders:stream >`,
      };
    },
  },

  R09: {
    id: 'R09',
    titleEn: 'Production Caching: Cache-Aside, Write-Through & Consistency Traps',
    subtitleEn: 'Choose the right read/write caching topology and avoid stale-cache race conditions by invalidating after DB commit.',
    durationMin: 14,
    difficulty: 'Intermediate',
    primaryMode: 'isometric',
    objectives: [
      bi('Nắm vững luồng chuẩn Cache-Aside: Đọc Cache trước ➔ Trượt mới hỏi DB ➔ Nạp lại Cache kèm TTL', 'Implement Cache-Aside cleanly: Read Cache -> DB on Miss -> Populate atomically with TTL'),
      bi('Hiểu vì sao lúc sửa dữ liệu phải Ghi DB thành công trước rồi mới UNLINK xóa Cache (thay vì xóa trước hay ghi đè)', 'Understand why Commit DB -> UNLINK Cache beats pre-delete and dual-write race conditions'),
      bi('Áp dụng Versioned Keys (v1/v2), Negative Caching và thư viện đa tầng (cashews, bentocache, CLIENT TRACKING)', 'Apply Versioned Keys, Negative Caching, and L1+L2 libraries (cashews, bentocache)'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const dualWriteBug = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : dualWriteBug ? 'watch-out' : s === 3 && !isLast ? 'technique' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Đặt Redis làm bộ nhớ đệm trước PostgreSQL giúp giảm độ trễ đọc từ ~25ms xuống ~0.4ms; điểm khó nhất là làm mất hiệu lực bản đệm cũ (Cache Invalidation) kịp thời khi dữ liệu gốc thay đổi.',
              'Placing Redis in front of PostgreSQL cuts read latency from ~25ms to ~0.4ms; the hardest challenge is timely Cache Invalidation when underlying database rows change.'
            )
          : s === 1
            ? bi(
                '90% hệ thống chọn Cache-Aside vì tiết kiệm RAM (chỉ nạp thứ có người đọc) và an toàn khi Redis gặp sự cố. Chỉ dùng Write-Behind (gom mẻ ghi trễ) cho lượt xem/tim livestream, cẩn trọng với tiền tệ!',
                '90% of APIs choose Cache-Aside for lazy RAM efficiency. Reserve async Write-Behind batching for view counters/telemetry rather than financial balances!'
              )
            : dualWriteBug
              ? bi(
                  'Bẫy phỏng vấn kinh điển: Nếu XÓA Cache TRƯỚC khi commit DB, một luồng đọc chen ngang ngay mili-giây đó sẽ bốc giá CŨ từ DB nạp ngược lên Redis suốt hàng giờ! Luôn Commit DB trước ➔ UNLINK sau!',
                  'Classic System Design trap: Deleting cache BEFORE DB commit lets a concurrent reader repopulate stale DB data for hours! Always Commit DB first ➔ UNLINK cache second!'
                )
              : s === 3 && !isLast
                ? bi(
                    'Ba kỹ thuật tối ưu vận hành: Nhúng hậu tố phiên bản (cache:product:v2:108) khi đổi cấu trúc JSON, lưu "__NULL__" ngắn hạn 45s cho ID rỗng, và tận dụng cashews (Python) / bentocache (Node.js).',
                    'Zero-downtime caching trio: Versioned keys (v2) during schema rollouts, 45s "__NULL__" negative cache sentinels, and L1+L2 libraries like cashews / bentocache!'
                  )
                : bi(
                    'Đúc kết chuẩn Production: Đọc trượt thì SET key json EX 600 nguyên tử; cập nhật thì UPDATE DB thành công rồi gọi UNLINK key bất đồng bộ.',
                    'Production golden rule: On read miss, run atomic SET key json EX 600; on write, commit SQL first then asynchronously UNLINK key.'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Đặt tầng đệm Redis đứng trước PostgreSQL hạ độ trễ đọc từ 25ms xuống 0.4ms (-92% tải DB)', 'Placed Redis cache in front of PostgreSQL cutting read latency from 25ms to 0.4ms') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('So sánh 4 mô hình Cache-Aside, Write-Through, Write-Behind và Stale-While-Revalidate', 'Mapped trade-offs across Cache-Aside, Write-Through, Write-Behind, and SWR') }]
            : dualWriteBug
              ? [{ op: '~' as const, text: bi('Phát hiện lỗi dữ liệu cũ nằm lì khi xóa Cache trước lúc giao dịch SQL kịp commit xong!', 'Exposed stale-cache race condition caused by deleting cache prior to SQL commit!') }]
              : [{ op: '+' as const, text: bi('Chuẩn hóa luồng Commit DB ➔ UNLINK kèm Versioned Key (v2) và Negative Cache 45s', 'Standardized post-commit UNLINK with Versioned Keys (v2) and 45s Negative Caching') }];

      return {
        telemetry: [
          { label: bi('CACHE HIT RATIO', 'CACHE HIT RATIO'), value: bi('96.4% (0.4ms)', '96.4% (0.4ms)'), tone: 'ok' },
          { label: bi('THỨ TỰ CẬP NHẬT', 'WRITE ORDER'), value: dualWriteBug ? bi('DEL trước DB (Lệch giá!)', 'DEL before DB (Stale!)') : bi('1. Commit DB ➔ 2. UNLINK', '1. Commit DB ➔ 2. UNLINK'), tone: dualWriteBug ? 'bad' : 'ok' },
          { label: bi('TẢI POSTGRESQL', 'DB READ LOAD'), value: bi('-92% truy vấn SQL', '-92% SQL QPS'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'api', shape: 'device', tone: 'neutral', x: -245, y: 10, label: bi('API Server', 'API Server'), sublabel: bi('FastAPI / Node / Go', 'FastAPI / Node / Go'), highlighted: s === 0 },
            {
              id: 'cache',
              shape: 'block',
              tone: dualWriteBug ? 'rose' : 'green',
              x: 10,
              y: -48,
              label: bi('Redis Cache', 'Redis Cache'),
              icon: dualWriteBug ? 'alert' : 'zap',
              loadPct: 24,
              highlighted: s === 1 || dualWriteBug || s === 3,
              badge: {
                text: dualWriteBug ? bi('Bị nạp đè giá cũ!', 'Stale repopulation!') : isLast ? bi('v2 + UNLINK ✔', 'v2 + UNLINK ✔') : bi('96% Cache Hit', '96% Cache Hit'),
                tone: dualWriteBug ? 'bad' : 'ok',
              },
            },
            { id: 'db', shape: 'db', tone: 'blue', x: 235, y: 38, label: bi('PostgreSQL Primary', 'PostgreSQL Primary'), highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'api', to: 'cache', style: dualWriteBug ? 'danger' : 'solid', label: bi('GET / UNLINK', 'GET / UNLINK') },
            { id: 'l2', from: 'api', to: 'db', style: 'dashed', label: bi('Miss / Commit SQL', 'Miss / Commit SQL') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: dualWriteBug ? 'error' : 'cache-hit', speed: 0.52 },
            { id: 'p2', linkId: 'l2', kind: 'request', speed: 0.38, offset: 0.5 },
          ],
        },
        defaultCode: `GET product:detail:99\nSET product:detail:99 "{\\"id\\":99,\\"price\\":199000}" EX 600\nUNLINK product:detail:99`,
      };
    },
  },

  R10: {
    id: 'R10',
    titleEn: 'Surviving Cache Disasters: Stampede, Penetration & Avalanche',
    subtitleEn: 'Shield your primary database with Singleflight mutexes, Bloom Filters, negative caching, and TTL jitter.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Chặn Cache Stampede (nhiều luồng cùng truy vấn DB khi 1 khóa nóng hết hạn) bằng Singleflight + Mutex Lock', 'Stop Cache Stampede on hot-key expiry using Singleflight coalescing + Redis Mutex'),
      bi('Chặn Cache Penetration (truy vấn hàng loạt ID không tồn tại) bằng Bloom Filter + Negative Cache ngắn hạn', 'Defeat Cache Penetration scans with front-door Bloom Filters + short-TTL null sentinels'),
      bi('Chống Cache Avalanche (nhiều khóa hết hạn cùng một thời điểm) bằng cộng độ lệch ngẫu nhiên TTL Jitter', 'Prevent synchronized Cache Avalanche by adding ±15% random TTL Jitter'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const unguarded = s === 0;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'technique' : s === 2 ? 'watch-out' : s === 3 && !isLast ? 'compare' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Phân biệt 3 sự cố Caching: Stampede xảy ra khi 1 khóa nóng hết hạn khiến hàng nghìn request cùng xuống DB; Penetration là truy vấn các ID không tồn tại xuyên qua Cache; Avalanche là hàng loạt khóa hết hạn cùng thời điểm.',
              'Distinguish the 3 cache failures: Stampede occurs when one hot key expires under burst load; Penetration hits nonexistent IDs; Avalanche happens when massive keys expire simultaneously.'
            )
          : s === 1
            ? bi(
                'Chống Stampede 2 tầng: Dùng Singleflight gom 500 request trong cùng 1 Pod lại, cộng thêm khóa SET lock:rebuild:... NX PX 3000 giữa 20 Pod để chỉ DUY NHẤT 1 câu SQL chạy xuống Database!',
                'Two-tier Stampede shield: Coalesce intra-pod bursts via Singleflight, plus an inter-pod Redis SET NX PX mutex so ONLY 1 SQL query hits PostgreSQL!'
              )
            : s === 2
              ? bi(
                  'Cảnh báo Penetration: Lưu "__NULL__" đơn thuần vẫn bị hacker sinh 10 triệu UUID ngẫu nhiên bơm tràn RAM! Hãy đặt Bloom Filter (BF.EXISTS) chặn đứng 100% ID không tồn tại ngay từ cửa ngõ.',
                  'Penetration trap: Naive "__NULL__" caching still lets attackers flood RAM with 10M random UUIDs! Place a Bloom Filter (BF.EXISTS) in front to drop 100% of fake IDs!'
                )
              : s === 3 && !isLast
                ? bi(
                    'Chống Avalanche đơn giản mà hiệu quả: Không đặt cứng EX 3600 cho lô 50.000 sản phẩm — luôn cộng thêm TTL Jitter ngẫu nhiên 10%–20% để rải đều thời điểm hết hạn.',
                    'Avalanche cure: Never assign an identical EX 3600 to 50,000 batch-loaded keys — always add 10%–20% random TTL Jitter to flatten expiration spikes!'
                  )
                : bi(
                    'Kiến trúc phòng vệ kết hợp 3 lớp: Validate + Bloom Filter ở vòng ngoài ➔ Singleflight + Mutex cho khóa nóng ➔ Negative Cache + TTL Jitter khi ghi lại lên Redis.',
                    'Complete 3-layer defense: Input check + Bloom Filter at the edge ➔ Singleflight + Mutex for hot keys ➔ Negative Cache + TTL Jitter on populate.'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '~' as const, text: bi('Khóa trang chủ vừa chạm TTL=0 làm 10.000 request đồng loạt xuyên thủng xuống đánh gục SQL DB!', 'Hot homepage key hit TTL=0 unleashing 10,000 simultaneous SQL queries onto primary DB!') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Bật Singleflight + Mutex SET NX PX gom 10.000 lượt trượt thành đúng 1 câu truy vấn nạp lại DB', 'Enabled Singleflight + Redis Mutex coalescing 10,000 misses into 1 DB rebuild query') }]
            : s === 2
              ? [{ op: '+' as const, text: bi('Dựng cổng lọc Bloom Filter (BF.EXISTS == 0 chặn ngay) chống bot quét ID âm/UUID ngẫu nhiên', 'Added front-door Bloom Filter dropping nonexistent ID scans before touching Cache/DB') }]
              : [{ op: '+' as const, text: bi('Cộng độ lệch ngẫu nhiên TTL Jitter (300s + random 0..60s) triệt tiêu hiện tượng hết hạn đồng loạt', 'Added random TTL Jitter (300s + 0..60s) eliminating synchronized expiration cliffs') }];

      return {
        telemetry: [
          { label: bi('TRUY VẤN KHÓA NÓNG', 'HOT-KEY MISS'), value: unguarded ? bi('10,000 QPS tràn vào DB!', '10,000 QPS hit DB!') : bi('Đúng 1 câu SQL (Singleflight)', '1 SQL query (Singleflight)'), tone: unguarded ? 'bad' : 'ok' },
          { label: bi('CHỐNG PENETRATION', 'PENETRATION'), value: s >= 2 ? bi('Bloom BF.EXISTS + Null 45s', 'Bloom BF.EXISTS + Null 45s') : bi('Đang bật bảo vệ...', 'Arming guard...'), tone: s >= 2 ? 'ok' : 'warn' },
          { label: bi('CHỐNG AVALANCHE', 'AVALANCHE'), value: s >= 3 ? bi('TTL + Jitter ngẫu nhiên', 'TTL + random jitter') : bi('Cần thêm Jitter!', 'Add TTL Jitter!'), tone: s >= 3 ? 'ok' : 'warn' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'req', shape: 'crowd', tone: unguarded ? 'rose' : 'neutral', x: -250, y: 8, label: bi('10k Burst RPS', '10k Burst RPS'), highlighted: unguarded },
            {
              id: 'guard',
              shape: 'block',
              tone: unguarded ? 'rose' : 'green',
              x: -20,
              y: -32,
              label: unguarded ? bi('Expired Hot Key!', 'Expired Hot Key!') : s === 2 ? bi('Bloom Filter Gate', 'Bloom Filter Gate') : bi('Singleflight + Jitter', 'Singleflight + Jitter'),
              icon: unguarded ? 'alert' : 'shield',
              highlighted: !unguarded,
              badge: {
                text: unguarded ? bi('Stampede xuyên DB!', 'Stampede hits DB!') : bi('Bloom + Mutex + Jitter', 'Bloom + Mutex + Jitter'),
                tone: unguarded ? 'bad' : 'ok',
              },
            },
            { id: 'db', shape: 'db', tone: unguarded ? 'rose' : 'blue', x: 235, y: 20, label: bi('Primary SQL DB', 'Primary SQL DB'), loadPct: unguarded ? 100 : 12, highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'req', to: 'guard', style: unguarded ? 'danger' : 'solid', label: bi('10k GET hot:home', '10k GET hot:home') },
            { id: 'l2', from: 'guard', to: 'db', style: unguarded ? 'danger' : 'dashed', label: unguarded ? bi('10,000 SQL queries!', '10,000 SQL queries!') : bi('1 rebuild query', '1 rebuild query') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: unguarded ? 'error' : 'cache-hit', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: unguarded ? 'error' : 'request', speed: 0.42, offset: 0.45 },
          ],
        },
        defaultCode: `SET lock:rebuild:home "worker-a" NX PX 5000\nSET cache:home "{\\"hero\\":\\"ok\\"}" EX 347`,
      };
    },
  },

  R11: {
    id: 'R11',
    titleEn: 'Distributed Locks (Fencing Tokens) & Rate Limiters',
    subtitleEn: 'Acquire locks safely with SET NX PX, release only your own token via Lua, and enforce Token-Bucket / Sliding-Window limits.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Chiếm khóa phân tán bằng SET lock uuid NX PX ms và chỉ mở khóa khi khớp đúng uuid qua Lua (hoặc r.lock())', 'Acquire locks via SET lock uuid NX PX and release safely by matching uuid in Lua'),
      bi('Hiểu rủi ro tiến trình khựng GC Pause làm hết hạn khóa sớm và cách cấp Fencing Token bảo vệ Database', 'Understand GC-pause lock expiry and guard storage writes with monotonic Fencing Tokens'),
      bi('Chọn đúng giữa Fixed Window, Sliding Window ZSet và Lua Token Bucket (cùng thư viện slowapi / rate-limiter-flexible)', 'Select between Fixed Window, Sliding Window, and Token Bucket rate limiters'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const naiveUnlock = s === 0;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'watch-out' : s === 2 && !isLast ? 'compare' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Khóa phân tán trên Redis dùng lệnh nguyên tử SET key uuid NX PX ms để đặt thời gian tự hết hạn (tránh Deadlock khi worker sập) và gắn mã UUID duy nhất để khi mở khóa bằng Lua không xóa nhầm khóa của worker khác.',
              'Redis distributed locks use atomic SET key uuid NX PX ms for crash-safe expiration and a unique owner UUID so Lua Compare-And-Delete never removes another worker’s lock.'
            )
          : s === 1
            ? bi(
                'Bảo vệ kép chuẩn SRE: Dùng r.lock() (redis-py) / Redisson để tự động nhả khóa bằng Lua; nếu bảo vệ số dư tài chính trước GC Pause, hãy cấp thêm số thứ tự tăng dần Fencing Token kiểm tra ở SQL!',
                'SRE dual guard: Use Lua owner-verified unlock (built into redis-py r.lock() & Redisson), plus monotonic Fencing Tokens verified at PostgreSQL for financial writes!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Chọn Rate Limiter trong 10 giây: Chặn dò mật khẩu rẻ nhất -> Fixed Window; chống vọt gấp đôi ở mép phút -> Sliding Window ZSet; cho phép dồn tải ngắn hạn chuẩn Gateway -> Lua Token Bucket!',
                  '10-second Rate Limiter guide: Cheap login guard -> Fixed Window; zero boundary burst -> Sliding Window ZSet; smooth API Gateway burst -> Lua Token Bucket!'
                )
              : bi(
                  'Lời khuyên thực chiến: Đừng tự viết lại vòng lặp khóa phức tạp nếu đã có sẵn r.lock() (Python redis-py), slowapi/limits (FastAPI), rate-limiter-flexible (Node.js) và redis_rate (Go)!',
                  'Production tip: Leverage battle-tested libraries — Python redis-py r.lock() & slowapi, Node rate-limiter-flexible, Java Redisson, and Go redis_rate!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '-' as const, text: bi('Loại bỏ thói quen gọi DEL lock mù quáng dễ xóa nhầm khóa đang hợp lệ của máy chủ khác', 'Eliminated blind DEL on locks which can delete another worker’s active lease') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Áp dụng SET uuid NX PX kèm Lua Compare-And-Delete và số thứ tự đơn điệu Fencing Token', 'Enforced SET uuid NX PX + Lua owner check + monotonic DB Fencing Tokens') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Đối chiếu 4 kiến trúc Rate Limiter: Fixed Window, Sliding Window, Token Bucket & Quota Guard', 'Compared Fixed Window, Sliding Window ZSet, Token Bucket, and Atomic Quota Guard') }]
              : [{ op: '+' as const, text: bi('Đóng gói xô thẻ bài Token Bucket vào kịch bản EVALSHA chạy dưới 1ms trên Redis', 'Packaged Token Bucket refill-and-consume logic into a sub-millisecond Lua script') }];

      return {
        telemetry: [
          { label: bi('CHIẾM KHÓA', 'ACQUIRE LOCK'), value: bi('SET k uuid NX PX 5000', 'SET k uuid NX PX 5000'), tone: 'ok' },
          { label: bi('NHẢ KHÓA AN TOÀN', 'SAFE UNLOCK'), value: naiveUnlock ? bi('Cấm gọi DEL trần!', 'Never blind DEL!') : bi('Lua GET==uuid ➔ DEL', 'Lua GET==uuid ➔ DEL'), tone: naiveUnlock ? 'warn' : 'ok' },
          { label: bi('CHỐNG GC PAUSE', 'FENCING & RATE'), value: s >= 2 ? bi('Token Bucket (Lua)', 'Token Bucket (Lua)') : bi('Fencing Token #42 > #41', 'Fencing Token #42 > #41'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'w', shape: 'crowd', tone: 'neutral', x: -245, y: 10, label: bi('12 API Containers', '12 API Containers'), highlighted: s === 0 },
            {
              id: 'lck',
              shape: 'block',
              tone: s >= 2 ? 'blue' : 'purple',
              x: -10,
              y: -28,
              label: s >= 2 ? bi('Lua Rate Limiter', 'Lua Rate Limiter') : bi('Redis Lock Arbiter', 'Redis Lock Arbiter'),
              icon: 'shield',
              highlighted: s === 1 || s === 2,
              badge: {
                text: s >= 2 ? bi('Token Bucket · 1 RTT', 'Token Bucket · 1 RTT') : bi('NX PX + Lua UUID', 'NX PX + Lua UUID'),
                tone: 'ok',
              },
            },
            { id: 'db', shape: 'db', tone: 'green', x: 235, y: 15, label: bi('DB (Fencing #42)', 'DB (Fencing #42)'), highlighted: s === 1 || isLast },
          ],
          links: [
            { id: 'l1', from: 'w', to: 'lck', label: s >= 2 ? bi('EVALSHA bucket', 'EVALSHA bucket') : bi('SET uuid NX PX', 'SET uuid NX PX') },
            { id: 'l2', from: 'lck', to: 'db', label: bi('token #42 > #41', 'token #42 > #41') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
        defaultCode: `SET lock:payout:u42 "req-9f8a" NX PX 10000\nEVAL "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:payout:u42 "req-9f8a"`,
      };
    },
  },

  R12: {
    id: 'R12',
    titleEn: 'jemalloc, 8 Eviction Policies (LFU vs LRU) & 65% K8s Headroom',
    subtitleEn: 'Configure maxmemory-policy allkeys-lfu and reserve 35% container memory headroom for Copy-on-Write & client buffers.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'memory-2d',
    objectives: [
      bi('Phân biệt rõ cơ chế đào thải LRU (lâu chưa truy cập) và LFU (tần suất truy cập thấp nhất)', 'Contrast LRU recency eviction with LFU frequency protection against cache pollution'),
      bi('Kiểm tra chỉ số phân mảnh mem_fragmentation_ratio trên trình cấp phát jemalloc và bật activedefrag', 'Diagnose jemalloc mem_fragmentation_ratio (<1.0 swap danger vs >1.5 fragmentation)'),
      bi('Áp dụng giới hạn an toàn trên Docker/K8s: đặt maxmemory ~65%–70% giới hạn RAM của Pod để tránh OOMKilled (Exit Code 137)', 'Set Redis maxmemory to ~65%–70% of Kubernetes Pod memory limits to prevent OOMKills'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'watch-out' : s === 2 && !isLast ? 'compare' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Khi bộ nhớ chạm maxmemory: noeviction từ chối lệnh ghi mới (phù hợp cho Queue/Lock); allkeys-lru xóa khóa lâu chưa truy cập; allkeys-lfu xóa khóa có tần suất đọc thấp nhất để bảo vệ các khóa nóng.',
              'When memory hits maxmemory: noeviction rejects writes (for Queues/Locks); allkeys-lru evicts least-recently-used keys; allkeys-lfu protects frequently accessed hot keys.'
            )
          : s === 1
            ? bi(
                'Kiểm tra INFO memory: mem_fragmentation_ratio từ 1.0–1.4 là ổn định; > 1.5 cho thấy phân mảnh cao (bật activedefrag yes); < 1.0 cảnh báo Redis đang bị đẩy xuống Swap ổ đĩa!',
                'INFO memory check: Fragmentation 1.0–1.4 is healthy; >1.5 needs activedefrag yes; <1.0 means RED ALERT — Linux is swapping Redis pages to disk!'
              )
            : s === 2 && !isLast
              ? bi(
                  'Tách vai dứt khoát: Máy chủ Pure Cache luôn chọn allkeys-lfu + lazyfree-lazy-eviction yes; máy chủ Streams / Celery / BullMQ bắt buộc giữ noeviction để không bao giờ mất job!',
                  'Separate roles cleanly: Pure Cache instances use allkeys-lfu + lazyfree-lazy-eviction yes; Streams / task queues MUST keep noeviction!'
                )
              : bi(
                  'Cấu hình an toàn trên Kubernetes: Pod giới hạn 4 GiB thì maxmemory chỉ đặt ~2.6 GiB (65%)! 35% còn lại là khoảng dự phòng bắt buộc cho BGSAVE Copy-on-Write và bộ đệm kết nối tránh OOMKilled 137.',
                  'Kubernetes safety rule: On a 4 GiB Pod, cap maxmemory at ~2.6 GiB (65%) — reserve 35% headroom for fork Copy-on-Write and output buffers against OOMKill 137!'
                );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Chuyển chính sách bộ nhớ đệm từ LRU sang allkeys-lfu chống ô nhiễm cache khi có tác vụ quét lô', 'Switched cache eviction from LRU to allkeys-lfu preventing scan-induced cache pollution') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Giám sát mem_fragmentation_ratio trên jemalloc và bật dọn phân mảnh trực tuyến activedefrag yes', 'Monitored jemalloc fragmentation ratio and enabled online activedefrag') }]
            : s === 2 && !isLast
              ? [{ op: '+' as const, text: bi('Bật trọn bộ 3 cờ lazyfree-lazy-* đẩy khâu thu hồi khóa lớn sang luồng nền không chặn', 'Enabled all 3 lazyfree-lazy-* flags offloading eviction/expiry frees to background threads') }]
              : [{ op: '+' as const, text: bi('Cấu hình maxmemory = 65% giới hạn RAM Container kèm requests == limits (Guaranteed QoS)', 'Sized maxmemory at 65% of Pod limit with Guaranteed QoS (requests == limits)') }];

      return {
        telemetry: [
          { label: bi('GIỚI HẠN POD K8S', 'K8S POD LIMIT'), value: bi('4.0 GiB (cgroup)', '4.0 GiB (cgroup)') },
          { label: bi('REDIS MAXMEMORY', 'REDIS MAXMEMORY'), value: bi('2.6 GiB (65% an toàn)', '2.6 GiB (65% safe)'), tone: 'ok' },
          { label: bi('CHÍNH SÁCH & RAM', 'POLICY & FRAG'), value: s === 1 ? bi('frag 1.15 · swap 0B', 'frag 1.15 · swap 0B') : bi('allkeys-lfu + lazyfree', 'allkeys-lfu + lazyfree'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        memoryScene: {
          kind: 'tape',
          title: bi('Phân bổ Ngân sách RAM 4 GiB Chuẩn Production trên Docker / Kubernetes', 'Production 4 GiB Container Memory Budget'),
          subtitle:
            s === 1
              ? bi('used_memory_rss / used_memory: 1.0..1.4 ổn định · >1.5 phân mảnh cao · <1.0 nguy hiểm tràn Swap!', 'rss / used_memory: 1.0..1.4 ideal · >1.5 fragmented · <1.0 swapping to disk!')
              : bi('Không đặt maxmemory == 100% giới hạn Pod — luôn chừa 35% bộ nhớ dự phòng tránh OOMKilled 137.', 'Never set maxmemory == 100% of Pod limit — keep 35% headroom against OOMKill 137!'),
          cells: ['Dataset 65%', 'CoW Fork 20%', 'Buffers 10%', 'jemalloc 5%'],
          activeIndices: s === 0 ? [0] : s === 1 ? [0, 3] : s === 2 ? [0, 2] : [0, 1, 2, 3],
          pointers: [
            { index: 0, label: 'allkeys-lfu (2.6GiB)', tone: 'green' },
            { index: s === 1 ? 3 : 1, label: s === 1 ? 'activedefrag yes' : 'BGSAVE Headroom', tone: 'orange' },
          ],
          outputPill: {
            label: bi('Phân tách vai trò', 'Role Separation'),
            value: bi('Cache ➔ allkeys-lfu · Queue/Stream/Lock ➔ noeviction', 'Cache ➔ allkeys-lfu · Queue/Stream/Lock ➔ noeviction'),
            tone: 'green',
          },
        },
        defaultCode: `maxmemory 2684mb\nmaxmemory-policy allkeys-lfu\nlazyfree-lazy-eviction yes\nactivedefrag yes`,
      };
    },
  },

  R13: {
    id: 'R13',
    titleEn: 'Persistence: RDB Snapshot, Copy-on-Write & Hybrid AOF',
    subtitleEn: 'Balance fast disaster-recovery startups and ≤1-second durability using appendfsync everysec and RDB+AOF hybrid preambles.',
    durationMin: 14,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Phân biệt ảnh chụp nhị phân định kỳ RDB (dump.rdb) với nhật ký ghi nối đuôi AOF và bản lai Hybrid RDB+AOF', 'Contrast compact RDB snapshots, append-only AOF logs, and Redis 7/8 Hybrid RDB+AOF'),
      bi('Hiểu cơ chế OS fork() Copy-on-Write giúp BGSAVE ghi 20GB ra đĩa mà không chặn luồng chính', 'Understand how OS fork() Copy-on-Write lets BGSAVE snapshot RAM without blocking traffic'),
      bi('Chọn chuẩn appendfsync everysec, tắt SAVE đồng bộ và bật vm.overcommit_memory=1 + tắt THP trên Linux', 'Use appendfsync everysec, ban synchronous SAVE, and tune Linux overcommit_memory & THP'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const fsyncAlwaysTrap = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'technique' : fsyncAlwaysTrap ? 'compare' : s === 3 && !isLast ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'RDB lưu ảnh chụp dữ liệu nhị phân định kỳ (gọn, khởi động lại nhanh); AOF ghi nối từng lệnh thay đổi xuống đĩa mỗi giây; Hybrid AOF kết hợp phần đầu RDB nén và phần đuôi AOF để vừa an toàn dữ liệu vừa phục hồi nhanh.',
              'RDB saves compact point-in-time binary snapshots (fast boot); AOF logs every write command each second; Hybrid AOF combines an RDB base preamble with an AOF tail for fast, durable recovery.'
            )
          : s === 1
            ? bi(
                'Cơ chế Copy-on-Write: Khi chạy BGSAVE, tiến trình con dùng chung bảng trang RAM với tiến trình cha — Linux chỉ sao chép trang 4KB nào có ghi mới, giúp luồng chính tiếp tục phục vụ bình thường. Không dùng lệnh SAVE đồng bộ.',
                'Copy-on-Write mechanism: During BGSAVE, the forked child shares memory pages with the parent — Linux copies only mutated 4KB pages so traffic stays unblocked. Never run synchronous SAVE!'
              )
            : fsyncAlwaysTrap
              ? bi(
                  'Lựa chọn cân bằng hiệu năng và an toàn: appendfsync always ép ổ đĩa ở từng lệnh làm tụt thông lượng 50 lần; appendfsync everysec giữ tốc độ như RAM thuần mà mất điện đột ngột chỉ mất tối đa ≤ 1 giây.',
                  'Durability sweet spot: appendfsync always tanks throughput 50× waiting on disk IOPS; appendfsync everysec runs at RAM speed with ≤ 1 second worst-case data loss!'
                )
              : s === 3 && !isLast
                ? bi(
                    'Hai tham số nhân Linux quan trọng khi chạy Persistence: Bật sysctl vm.overcommit_memory=1 (tránh lỗi fork thiếu RAM giả) và tắt Transparent Huge Pages = never (tránh nhân bản tảng 2MB gây giật).',
                    'Two essential Linux kernel tunings: Set vm.overcommit_memory=1 (so fork() never fails above 50% RAM) and disable Transparent Huge Pages (keep 4KB CoW pages)!'
                  )
                : bi(
                    'Quy tắc triển khai Container: Cụm Pure Cache tắt sạch ghi đĩa (save "" + appendonly no); cụm Durable bật Hybrid AOF everysec và bắt buộc gắn Volume bền vững vào thư mục /data!',
                    'Container rule: Pure Cache disables disk persistence (save "" + appendonly no); Durable Redis enables Hybrid AOF everysec with a persistent volume mounted at /data!'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Kết hợp ảnh nén RDB ở phần đầu và đuôi nhật ký AOF (aof-use-rdb-preamble yes)', 'Combined compact RDB base preamble with incremental AOF tail') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Chạy BGSAVE qua tiến trình con fork() Copy-on-Write không chặn luồng phục vụ khách', 'Spawned non-blocking BGSAVE child using OS fork() Copy-on-Write pages') }]
            : fsyncAlwaysTrap
              ? [{ op: '~' as const, text: bi('Đổi từ appendfsync always (nghẽn IOPS đĩa) sang appendfsync everysec ở luồng nền bio_aof_fsync', 'Switched from IOPS-Bound appendfsync always to background appendfsync everysec') }]
              : [{ op: '+' as const, text: bi('Tinh chỉnh Linux vm.overcommit_memory=1, tắt THP và gắn Volume bền vững vào /data', 'Tuned Linux overcommit_memory=1, disabled THP, and mounted persistent /data volume') }];

      return {
        telemetry: [
          { label: bi('CHẾ ĐỘ AOF', 'APPENDFSYNC'), value: fsyncAlwaysTrap ? bi('everysec (vs always chậm!)', 'everysec (vs slow always!)') : bi('everysec (mất ≤ 1s)', 'everysec (≤ 1s RPO)'), tone: 'ok' },
          { label: bi('CHỤP ẢNH NỀN', 'SNAPSHOT FORK'), value: bi('BGSAVE Copy-on-Write', 'BGSAVE Copy-on-Write'), tone: 'ok' },
          { label: bi('ĐỊNH DẠNG PHỤC HỒI', 'RECOVERY FORMAT'), value: bi('Hybrid RDB + AOF tail', 'Hybrid RDB + AOF tail'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            {
              id: 'main',
              shape: 'block',
              tone: 'green',
              x: -215,
              y: -10,
              label: bi('Main Process', 'Main Process'),
              icon: 'zap',
              highlighted: s === 0 || fsyncAlwaysTrap,
              badge: { text: bi('Vẫn nhận 100k ops/s', 'Serves live traffic'), tone: 'ok' },
            },
            {
              id: 'fork',
              shape: 'block',
              tone: s === 3 ? 'orange' : 'blue',
              x: 10,
              y: -52,
              label: bi('fork() Child', 'fork() Child'),
              icon: 'layers',
              highlighted: s === 1 || s === 3,
              badge: { text: s === 3 ? bi('4KB CoW · THP=never', '4KB CoW · THP=never') : bi('Copy-on-Write RAM', 'Copy-on-Write RAM'), tone: 'ok' },
            },
            { id: 'disk', shape: 'db', tone: 'purple', x: 235, y: 22, label: bi('/data Hybrid AOF', '/data Hybrid AOF'), highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'main', to: 'fork', style: 'dashed', label: bi('BGSAVE fork()', 'BGSAVE fork()') },
            { id: 'l2', from: 'fork', to: 'disk', label: bi('RDB base', 'RDB base') },
            { id: 'l3', from: 'main', to: 'disk', label: bi('fsync everysec', 'fsync everysec') },
          ],
          packets: [
            { id: 'p1', linkId: 'l2', kind: 'mutation', speed: 0.42 },
            { id: 'p2', linkId: 'l3', kind: 'response', speed: 0.5, offset: 0.45 },
          ],
        },
        defaultCode: `appendonly yes\nappendfsync everysec\naof-use-rdb-preamble yes\nsave 900 1\nsave 300 100`,
      };
    },
  },

  R14: {
    id: 'R14',
    titleEn: 'Async Replication (PSYNC2), Split-Brain & Sentinel Failover',
    subtitleEn: 'Deploy 3-Sentinel Quorum high availability, partial resynchronization backlogs, and min-replicas-to-write guards.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Cấu hình vùng đệm vòng repl-backlog-size giúp PSYNC2 đồng bộ bù nhanh thay vì Full Resync nặng nề', 'Size repl-backlog-size properly so brief disconnects use fast PSYNC2 partial resync'),
      bi('Nắm quy trình 4 bước tự động chuyển đổi dự phòng của cụm 3 Sentinel (SDOWN ➔ ODOWN Quorum ➔ Failover)', 'Trace 3-Sentinel failover: SDOWN -> ODOWN Quorum -> Leader vote -> REPLICAOF NO ONE'),
      bi('Phòng chống mất dữ liệu do Split-Brain bằng min-replicas-to-write 1 và kết nối qua Sentinel SDK', 'Bound Split-Brain loss via min-replicas-to-write and connect apps via Sentinel SDKs'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const failoverStep = s === 2 && !isLast;
      const splitBrainStep = s === 3 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'technique' : failoverStep ? 'compare' : splitBrainStep ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Master nhận lệnh ghi và sao chép bất đồng bộ sang các Replica; khi Master mất kết nối và đủ Quorum Sentinel (ví dụ 2/3) xác nhận ODOWN, Sentinel bầu Leader và thăng cấp Replica cập nhật nhất lên làm Master mới.',
              'Master handles writes and replicates asynchronously to Replicas; when a Sentinel quorum (e.g., 2/3) confirms ODOWN, Sentinel elects a leader and promotes the freshest Replica automatically.'
            )
          : s === 1
            ? bi(
                'Bẫy cấu hình mặc định: repl-backlog-size mặc định chỉ có 1 MB — mạng chập chờn 0.2 giây đã tràn, bắt chạy lại Full Resync tốn kém! Luôn nâng lên 64mb–256mb để hưởng PSYNC2 êm ái.',
                'Default config trap: repl-backlog-size defaults to tiny 1 MB — a 0.2s network blip overflows it and triggers expensive Full Resyncs! Always raise it to 64mb–256mb for PSYNC2.'
              )
            : failoverStep
              ? bi(
                  'Vì sao luôn cần SỐ LẺ ≥ 3 Sentinel trên 3 máy khác nhau? Để khi 1 phòng máy rớt mạng, 2 nút còn lại vẫn đủ đa số quá bán (2/3) bầu chọn Master mới mà không bao giờ bị hòa phiếu!',
                  'Why always an ODD number ≥ 3 Sentinels across failure zones? So if 1 zone goes dark, the remaining 2/3 still form a strict majority to elect and promote a new Master!'
                )
              : splitBrainStep
                ? bi(
                    'Phòng chống Split-Brain khi phân mảnh mạng: Đặt min-replicas-to-write 1 và min-replicas-max-lag 10 để nếu Master cũ bị đứt cáp cô lập khỏi mọi Replica quá 10s, nó tự từ chối lệnh ghi ngay.',
                    'Split-Brain shield: Set min-replicas-to-write 1 and min-replicas-max-lag 10 so an isolated old Master stops accepting doomed writes after 10 seconds!'
                  )
                : bi(
                    'Thực chiến ứng dụng & K8s: Trên Kubernetes luôn dùng StatefulSet + Headless Service; trong code Python (Sentinel) / Node.js (ioredis) luôn kết nối qua danh sách cổng 26379 thay vì trỏ cứng IP Master!',
                    'Production rule: Deploy Redis HA on Kubernetes with StatefulSet + Headless Service, and point Python/Node/Go SDKs at Sentinel port 26379 rather than a hardcoded Master IP!'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Dựng mô hình 1 Master + 2 Replicas kèm cụm 3 nút Sentinel giám sát 24/7', 'Deployed 1 Master + 2 Replicas watched by an odd 3-Sentinel quorum') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Mở rộng bộ đệm vòng repl-backlog-size lên 64mb kích hoạt đồng bộ bù PSYNC2 siêu nhanh', 'Expanded repl-backlog-size to 64mb enabling instant PSYNC2 partial resynchronization') }]
            : failoverStep
              ? [{ op: '~' as const, text: bi('Master gặp sự cố: 2/3 Sentinel chốt ODOWN và tự động thăng cấp Replica mới nhất bằng REPLICAOF NO ONE!', 'Master unreachable: 2/3 Sentinels confirmed ODOWN and promoted freshest Replica!') }]
              : [{ op: '+' as const, text: bi('Cấu hình chống Split-Brain bằng min-replicas-to-write 1 và triển khai trên StatefulSet', 'Added min-replicas-to-write 1 Split-Brain guard and StatefulSet stable DNS identities') }];

      return {
        telemetry: [
          { label: bi('QUORUM SENTINEL', 'SENTINEL QUORUM'), value: failoverStep ? bi('ODOWN 2/3 ➔ Failover!', 'ODOWN 2/3 ➔ Failover!') : bi('2 / 3 Sentinels (lẻ!)', '2 / 3 Sentinels (odd!)'), tone: 'ok' },
          { label: bi('ĐỒNG BỘ LẠI', 'RECONNECT SYNC'), value: bi('PSYNC2 Backlog 64MB', 'PSYNC2 Backlog 64MB'), tone: 'ok' },
          { label: bi('CHỐNG SPLIT-BRAIN', 'SPLIT-BRAIN GUARD'), value: bi('min-replicas-to-write 1', 'min-replicas-to-write 1'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'sen', shape: 'crowd', tone: 'yellow', x: -245, y: -15, label: bi('3 Sentinels (:26379)', '3 Sentinels (:26379)'), highlighted: s === 0 || failoverStep },
            {
              id: 'm',
              shape: 'block',
              tone: failoverStep ? 'rose' : 'green',
              x: 0,
              y: -45,
              label: failoverStep ? bi('Old Master (Down!)', 'Old Master (Down!)') : bi('Master Node', 'Master Node'),
              icon: failoverStep ? 'alert' : 'cpu',
              highlighted: splitBrainStep,
              badge: {
                text: failoverStep ? bi('+odown 2/3!', '+odown 2/3!') : splitBrainStep ? bi('min-replicas ≥ 1', 'min-replicas ≥ 1') : bi('Read / Write', 'Read / Write'),
                tone: failoverStep ? 'bad' : 'ok',
              },
            },
            {
              id: 'r',
              shape: 'db',
              tone: failoverStep ? 'green' : 'blue',
              x: 235,
              y: 28,
              label: failoverStep ? bi('Replica ➔ New Master!', 'Replica ➔ New Master!') : bi('Replicas (PSYNC2)', 'Replicas (PSYNC2)'),
              highlighted: s === 1 || failoverStep || isLast,
            },
          ],
          links: [
            { id: 'l1', from: 'sen', to: 'm', style: failoverStep ? 'danger' : 'dashed', label: failoverStep ? bi('PING timeout!', 'PING timeout!') : bi('PING / Quorum', 'PING / Quorum') },
            { id: 'l2', from: 'm', to: 'r', style: failoverStep ? 'dashed' : 'solid', label: failoverStep ? bi('REPLICAOF NO ONE', 'REPLICAOF NO ONE') : bi('PSYNC2 stream', 'PSYNC2 stream') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: failoverStep ? 'error' : 'pointer', speed: 0.44 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.48, offset: 0.45 },
          ],
        },
        defaultCode: `min-replicas-to-write 1\nmin-replicas-max-lag 10\nrepl-backlog-size 64mb`,
      };
    },
  },

  R15: {
    id: 'R15',
    titleEn: 'Redis Cluster & 16,384 Hash Slots Sharding',
    subtitleEn: 'Scale writes horizontally across shards using CRC16(key) % 16384 and co-locate multi-key transactions via {HashTags}.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Hiểu cơ chế chia 16,384 Hash Slots (CRC16(key) % 16384) trên tối thiểu 6 nút (3 Master + 3 Replica)', 'Route keys deterministically across 16,384 CRC16 slots on ≥3 Master–Replica shards'),
      bi('Phân biệt 2 cổng TCP (6379 + 16379 Gossip Bus) và tín hiệu chuyển ngăn trực tuyến -MOVED vs -ASK', 'Distinguish data port vs Gossip Bus (+10000) and live resharding -MOVED vs -ASK redirects'),
      bi('Hóa giải lỗi CROSSSLOT bằng {HashTag} cấp thực thể ({u42}), tránh bẫy Hot-Slot {all} và bật full-coverage no', 'Fix CROSSSLOT via entity {HashTags}, avoid {all} Hot-Slots, and set cluster-require-full-coverage no'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const crossSlotStep = s === 2 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'compare' : crossSlotStep ? 'watch-out' : s === 3 && !isLast ? 'technique' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Redis Cluster phân chia toàn bộ không gian khóa thành cố định 16,384 Hash Slots trải đều trên nhiều nút Master; Smart Client tính CRC16(key) % 16384 để định tuyến trực tiếp tới đúng nút chỉ trong 1 bước mạng.',
              'Redis Cluster partitions the keyspace into 16,384 fixed Hash Slots across Masters; Smart Clients compute CRC16(key) % 16384 for direct 1-hop routing.'
            )
          : s === 1
            ? bi(
                'Đừng quên mở cổng +10000 (16379 Cluster Bus) trên Firewall! Khi thêm máy mới và dọn ngăn trực tuyến, Smart Client tự động xử lý -MOVED (đã chuyển xong) và -ASK (đang chuyển dở) không rớt request.',
                'Always open port +10000 (16379 Gossip Bus) on firewalls! During live resharding, Smart Clients transparently follow -MOVED (permanent) and -ASK (migrating) redirects.'
              )
            : crossSlotStep
              ? bi(
                  'Hóa giải lỗi CROSSSLOT: Kẹp nhãn {u42} vào user:{u42}:profile và user:{u42}:cart để ép vào chung 1 ngăn! Nhưng CẤM dùng nhãn chung {all} kẻo dồn 100% tải vào chết dí 1 máy (Hot-Slot)!',
                  'Fixing CROSSSLOT: Co-locate user:{u42}:profile & user:{u42}:cart via entity {u42} HashTags — NEVER use a global {all} tag or you melt a single shard (Hot-Slot)!'
                )
              : s === 3 && !isLast
                ? bi(
                    'Tham số quan trọng trong redis.conf: Đổi cluster-require-full-coverage sang no để lỡ 1 phân mảnh hỏng cả Master lẫn Replica thì 90% khách hàng ở các phân mảnh khác vẫn chạy bình thường.',
                    'Critical config: Set cluster-require-full-coverage no so a dual-failure on one shard never takes down healthy shards with CLUSTERDOWN!'
                  )
                : bi(
                    'Tư duy chọn kiến trúc: Dưới 16GB RAM và <80k ops/s, cụm Sentinel HA (hoặc Valkey Multi-AZ / DragonflyDB) gọn nhẹ hơn nhiều; chỉ bật Cluster 6+ nút khi cần phá trần RAM hoặc trần tốc độ Ghi!',
                    'Sizing wisdom: Under 16GB RAM & <80k ops/s, Sentinel HA (or Valkey Multi-AZ / DragonflyDB) is far simpler; adopt 6+ node Cluster when scaling beyond single-Master RAM or write limits!'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Chia đều 16.384 Hash Slots trên 3 phân mảnh Master–Replica mở rộng tuyến tính cả RAM lẫn tốc độ Ghi', 'Partitioned 16,384 Hash Slots across 3 Master–Replica shards scaling writes linearly') }]
          : s === 1
            ? [{ op: '+' as const, text: bi('Mở cổng Gossip 16379 và tự động cập nhật bản đồ ngăn tủ qua phản hồi -MOVED / -ASK', 'Opened Gossip Bus :16379 with self-healing Smart Client -MOVED / -ASK slot routing') }]
            : crossSlotStep
              ? [{ op: '+' as const, text: bi('Gắn nhãn thực thể {u42} gom giỏ hàng và hồ sơ vào chung Slot 12182 để chạy MSET / Lua nguyên tử', 'Applied entity {u42} HashTag co-locating cart and profile keys into identical Slot') }]
              : [{ op: '+' as const, text: bi('Đặt cluster-require-full-coverage no cô lập bán kính sự cố và chia tải đọc sang Replica', 'Enabled cluster-require-full-coverage no and scaled reads across shard Replicas') }];

      return {
        telemetry: [
          { label: bi('TỔNG HASH SLOTS', 'TOTAL SLOTS'), value: bi('16,384 (CRC16)', '16,384 (CRC16)'), tone: 'ok' },
          { label: bi('GOM ĐA KHÓA', 'MULTI-KEY TAG'), value: crossSlotStep ? bi('{u42} (Cấm {all}!)', '{u42} (Never {all}!)') : bi('user:{u42}:* ➔ 1 Slot', 'user:{u42}:* ➔ 1 Slot'), tone: 'ok' },
          { label: bi('CÔ LẬP SỰ CỐ', 'BLAST RADIUS'), value: s >= 3 ? bi('full-coverage: no', 'full-coverage: no') : bi('2 cổng: 6379 + 16379', 'Ports: 6379 + 16379'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'cli', shape: 'device', tone: 'neutral', x: -255, y: 10, label: bi('Smart Client', 'Smart Client'), sublabel: bi('RedisCluster / ioredis', 'RedisCluster / ioredis'), highlighted: s === 0 || isLast },
            {
              id: 's1',
              shape: 'block',
              tone: 'green',
              x: 15,
              y: -58,
              label: bi('Shard 1', 'Shard 1'),
              icon: 'db',
              highlighted: crossSlotStep,
              badge: { text: crossSlotStep ? bi('Slot({u42}) ✔', 'Slot({u42}) ✔') : bi('Slots 0..5460', 'Slots 0..5460'), tone: 'ok' },
            },
            { id: 's2', shape: 'block', tone: 'blue', x: 195, y: 0, label: bi('Shard 2', 'Shard 2'), icon: 'db', highlighted: s === 3, badge: { text: bi('5461..10922', '5461..10922') } },
            { id: 's3', shape: 'block', tone: 'purple', x: 55, y: 65, label: bi('Shard 3', 'Shard 3'), icon: 'db', highlighted: s === 1, badge: { text: s === 1 ? bi('-MOVED / :16379', '-MOVED / :16379') : bi('10923..16383', '10923..16383') } },
          ],
          links: [
            { id: 'l1', from: 'cli', to: 's1', label: bi('CRC16({u42})', 'CRC16({u42})') },
            { id: 'l2', from: 'cli', to: 's3', style: 'dashed', label: bi('-MOVED / slot map', '-MOVED / slot map') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'cache-hit', speed: 0.5 },
            { id: 'p2', linkId: 'l2', kind: 'pointer', speed: 0.42, offset: 0.5 },
          ],
        },
        defaultCode: `MSET {user:42}:profile "An" {user:42}:cart "3_items"\nCLUSTER KEYSLOT {user:42}:profile\nCLUSTER KEYSLOT {user:42}:cart`,
      };
    },
  },

  R16: {
    id: 'R16',
    titleEn: 'Zero-Trust Redis Security: Private VPC, TLS & Granular ACLs',
    subtitleEn: 'Lock down Redis 8 with default-user disablement, scoped key-prefix ACLs (~app:*), and blocked @dangerous commands.',
    durationMin: 13,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Hiểu vì sao mở cổng 6379 không mật khẩu ra Internet bị chiếm máy chủ trong 90 giây; khóa bind nội bộ + K8s NetworkPolicy', 'Never expose port 6379 publicly; enforce private VPC binding and K8s NetworkPolicy'),
      bi('Bật mã hóa đường truyền TLS 1.3 (port 0 + tls-port 6379, URI rediss://) kết hợp io-threads giảm tải CPU', 'Enable TLS 1.3 encryption (port 0 + tls-port 6379, rediss://) offloaded to io-threads'),
      bi('Tắt user default và cấp tài khoản ACL riêng cho từng dịch vụ (~checkout:* +@all -@dangerous đặt ở cuối dòng!)', 'Disable default user and scope per-service ACLs (~prefix:* with trailing -@dangerous)'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const aclOrderStep = s === 3 && !isLast;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : s === 1 ? 'watch-out' : s === 2 ? 'technique' : aclOrderStep ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Mô hình bảo mật Redis Zero-Trust gồm 4 lớp: (1) Cô lập trong mạng riêng VPC & NetworkPolicy, (2) Mã hóa đường truyền TLS/mTLS, (3) Phân quyền ACL riêng cho từng dịch vụ (~checkout:*), (4) Chặn nhóm lệnh nguy hiểm (-@dangerous).',
              '4-Layer Zero-Trust Redis security: (1) Private VPC + NetworkPolicy, (2) Encrypted TLS/mTLS tunnel, (3) Per-service ACL scoping (~checkout:*), (4) Blocked dangerous commands (-@dangerous).'
            )
          : s === 1
            ? bi(
                'Cảnh báo thực tế: Phơi cổng 6379 bind 0.0.0.0 không mật khẩu ra Internet sẽ bị botnet dò ra trong < 90 giây và lợi dụng CONFIG SET dir + BGSAVE chèn khóa SSH chiếm máy chủ!',
                'Real-world danger: Exposing unauthenticated 0.0.0.0:6379 to the internet gets compromised in < 90s via CONFIG SET dir + BGSAVE SSH/cron injection!'
              )
            : s === 2
              ? bi(
                  'Bật TLS không lo chậm: Đặt port 0 (tắt cổng thường) + tls-port 6379, kết nối qua rediss:// và bật io-threads 4 để các luồng phụ gánh trọn khâu giải mã OpenSSL cho luồng chính!',
                  'Zero-bottleneck TLS: Set port 0 + tls-port 6379, connect via rediss://, and enable io-threads 4 so worker threads offload TLS encryption from the main Event Loop!'
                )
              : aclOrderStep
                ? bi(
                    'Lưu ý quan trọng về thứ tự quy tắc ACL: Redis đọc quy tắc TỪ TRÁI SANG PHẢI. Phải viết +@all -@dangerous (nếu viết ngược -@dangerous +@all thì +@all đứng sau sẽ mở lại lệnh FLUSHALL).',
                    'Critical ACL rule-ordering rule: Redis evaluates rules LEFT TO RIGHT! Always place -@dangerous -@admin AT THE END (+@all -@dangerous), never before +@all!'
                  )
                : bi(
                    'Chuẩn kiểm toán Zero-Trust trên K8s: Tắt user default off, cấp user riêng cho từng microservice + exporter giám sát, và khóa L4 bằng Kubernetes NetworkPolicy chỉ nhận từ api-backend!',
                    'Zero-Trust K8s standard: Set user default off, issue least-privilege ACL users per service + exporter, and lock L4 ingress via Kubernetes NetworkPolicy!'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Thiết lập mô hình phòng thủ chiều sâu 4 lớp bảo vệ kho dữ liệu RAM của doanh nghiệp', 'Established 4-layer Defense-in-Depth Zero-Trust security architecture') }]
          : s === 1
            ? [{ op: '-' as const, text: bi('Chặn đứng cấu hình bind 0.0.0.0 hớ hênh dễ bị lợi dụng chiếm quyền điều khiển máy chủ', 'Eliminated public 0.0.0.0 exposure vulnerable to RCE/cryptojacking') }]
            : s === 2
              ? [{ op: '+' as const, text: bi('Tắt cổng văn bản thuần (port 0), bật tls-port 6379 (TLSv1.3) kèm io-threads 4', 'Disabled plaintext port 0 and enforced TLSv1.3 on port 6379 with 4 I/O threads') }]
              : [{ op: '+' as const, text: bi('Tắt user default, cô lập tiền tố ~checkout:* kèm -@dangerous ở cuối dòng và K8s NetworkPolicy', 'Disabled default user, scoped ~checkout:* ACLs with trailing -@dangerous & NetworkPolicy') }];

      return {
        telemetry: [
          { label: bi('ĐƯỜNG TRUYỀN', 'NETWORK & TLS'), value: bi('VPC + rediss:// (TLS 1.3)', 'VPC + rediss:// (TLS 1.3)'), tone: 'ok' },
          { label: bi('PHẠM VI KEY ACL', 'ACL KEY SCOPE'), value: bi('default off · ~app:*', 'default off · ~app:*'), tone: 'ok' },
          { label: bi('THỨ TỰ CẤM LỆNH', 'ACL RULE ORDER'), value: aclOrderStep ? bi('+@all rồi mới -@dangerous!', '+@all then -@dangerous!') : bi('-@dangerous -@admin', '-@dangerous -@admin'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'svc', shape: 'device', tone: 'neutral', x: -245, y: 10, label: bi('Checkout Service', 'Checkout Service'), sublabel: bi('rediss://checkout-svc', 'rediss://checkout-svc'), highlighted: s === 0 || s === 2 },
            {
              id: 'acl',
              shape: 'block',
              tone: aclOrderStep ? 'rose' : 'orange',
              x: -10,
              y: -25,
              label: bi('mTLS + ACL Gate', 'mTLS + ACL Gate'),
              icon: 'shield',
              highlighted: s === 1 || aclOrderStep || isLast,
              badge: {
                text: isLast ? bi('NetPol + ACL ✔', 'NetPol + ACL ✔') : bi('~checkout:* · -@dangerous', '~checkout:* · -@dangerous'),
                tone: 'ok',
              },
            },
            { id: 'kv', shape: 'db', tone: 'green', x: 235, y: 15, label: bi('Protected Keyspace', 'Protected Keyspace'), highlighted: isLast },
          ],
          links: [
            { id: 'l1', from: 'svc', to: 'acl', label: bi('TLS 1.3 + AUTH ACL', 'TLS 1.3 + AUTH ACL') },
            { id: 'l2', from: 'acl', to: 'kv', label: bi('~checkout:* only', '~checkout:* only') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'request', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
        defaultCode: `bind 127.0.0.1\nprotected-mode yes\nuser default off\nuser app_svc on >StrongPass_Example2026 ~app:* +@read +@write -@dangerous -@admin`,
      };
    },
  },

  R17: {
    id: 'R17',
    titleEn: 'Observability, Metrics & Production Incident Troubleshooting',
    subtitleEn: 'Triage latency spikes in under 2 minutes using SLOWLOG, Latency Doctor, Bigkeys scan, and INFO stats.',
    durationMin: 15,
    difficulty: 'Advanced',
    primaryMode: 'isometric',
    objectives: [
      bi('Hiểu đúng 3 chỉ số giám sát dễ nhầm lẫn: phạm vi của SLOWLOG, đo Hit Ratio bằng rate(...[5m]) và CPU đơn luồng trên máy đa nhân', 'Avoid 3 metric misreadings: SLOWLOG CPU-only scope, rate([5m]) hit ratio, and single-thread CPU'),
      bi('Xử lý nhanh 5 ca sự cố điển hình (KEYS *, DEL Bigkey, nhầm noeviction, rò rỉ PEL, lỗi CROSSSLOT)', 'Triage the 5 classic Redis outages (KEYS *, sync DEL, noeviction cache, PEL leak, CROSSSLOT)'),
      bi('Chạy phác đồ chẩn đoán chỉ đọc 30 giây an toàn (cấm chạy MONITOR lúc cao điểm!) và lưu cấu hình bằng CONFIG REWRITE', 'Run safe 30s read-only triage (never MONITOR under load!) and persist fixes via CONFIG REWRITE'),
    ],
    buildStep: (s, total) => {
      const isLast = s >= total - 1;
      const metricTrapStep = s === 1;
      const calloutKind: CalloutKind =
        s === 0 ? 'key-idea' : metricTrapStep ? 'watch-out' : s === 2 ? 'technique' : s === 3 ? 'watch-out' : 'good-to-know';
      const calloutText =
        s === 0
          ? bi(
              'Bộ công cụ chẩn đoán sự cố Redis: INFO stats/memory cung cấp thông số lưu lượng và bộ nhớ tổng quan; SLOWLOG GET ghi nhận các lệnh O(N) chạy chậm trên CPU; LATENCY DOCTOR phân tích nguyên nhân trễ ở tầng hệ điều hành.',
              'Redis diagnostic toolkit: INFO stats/memory shows throughput and memory health; SLOWLOG GET catches slow O(N) commands; LATENCY DOCTOR diagnoses OS and fork stalls.'
            )
          : metricTrapStep
            ? bi(
                'Ba điểm dễ hiểu nhầm khi đọc số liệu: (1) SLOWLOG chỉ đo CPU thực thi lệnh, không đo chờ mạng/hàng đợi; (2) Tính Hit Ratio phải dùng rate(...[5m]) thay vì tổng cộng dồn; (3) Máy 32 nhân báo CPU 3.1% có nghĩa luồng chính Redis đã bão hòa 100%.',
                'Three common metric pitfalls: (1) SLOWLOG measures command CPU only, not queue wait; (2) Compute Hit Ratio with rate([5m]); (3) 3.1% host CPU on a 32-core box means the Redis main thread is 100% maxed!'
              )
            : s === 2
              ? bi(
                  'Cách xử lý nhanh 5 sự cố: Nghẽn KEYS ➔ đổi SCAN; giật DEL khóa lớn ➔ đổi UNLINK; Cache báo OOM ➔ chuyển allkeys-lfu; kẹt Stream PEL ➔ chạy XAUTOCLAIM; lỗi CROSSSLOT ➔ gắn {HashTag}!',
                  '5 instant incident fixes: KEYS stall ➔ SCAN; Bigkey DEL spike ➔ UNLINK; Cache OOM ➔ allkeys-lfu; stuck Stream PEL ➔ XAUTOCLAIM; CROSSSLOT ➔ entity {HashTag}!'
                )
              : s === 3
                ? bi(
                    'Lưu ý an toàn khi chẩn đoán trên Production: Tuyệt đối KHÔNG gõ lệnh MONITOR trên server chịu tải cao (làm tụt 50% hiệu năng ngay lập tức), và chỉ chạy --bigkeys -i 0.05 trên nút Replica.',
                    'Production safety rule: NEVER run MONITOR on a heavily loaded production node (it slashes throughput by ~50%)! Run --bigkeys -i 0.05 on a Replica instead!'
                  )
                : bi(
                    'Kỷ luật khép lại ca trực & toàn khóa học: Sau khi vá nóng bằng CONFIG SET trên RAM, luôn chạy CONFIG REWRITE (hoặc cập nhật Git/Helm) để lỗi cũ không sống dậy ở lần khởi động sau!',
                    'Post-incident golden rule: After hot-patching via CONFIG SET in RAM, always run CONFIG REWRITE (and update GitOps manifests) so the bug never returns on restart!'
                  );

      const whatChanged =
        s === 0
          ? [{ op: '+' as const, text: bi('Kết nối 4 tín hiệu vàng từ redis_exporter sang bảng điều khiển giám sát SRE', 'Wired the 4 Golden Redis Signals from redis_exporter into SRE observability') }]
          : metricTrapStep
            ? [{ op: '~' as const, text: bi('Chuyển công thức đo Cache Hit Ratio sang cửa sổ trượt rate(...[5m]) và giám sát CPU đơn luồng', 'Switched Cache Hit Ratio alert to 5m sliding rate() and per-process CPU saturation') }]
            : s === 2
              ? [{ op: '+' as const, text: bi('Áp dụng ma trận khắc phục trực tuyến Zero-Downtime cho 5 ca sự cố Redis phổ biến nhất', 'Applied zero-downtime remediation matrix across the 5 classic production incidents') }]
              : [{ op: '+' as const, text: bi('Chuẩn hóa phác đồ chẩn đoán 30s an toàn và chốt lưu cấu hình bền vững bằng CONFIG REWRITE', 'Standardized safe 30s read-only triage and persisted runtime fixes via CONFIG REWRITE') }];

      return {
        telemetry: [
          { label: bi('SLOWLOG NGƯỠNG', 'SLOWLOG THRESHOLD'), value: bi('> 10,000 µs (10 ms)', '> 10,000 µs (10 ms)'), tone: metricTrapStep ? 'warn' : 'ok' },
          { label: bi('CACHE HIT (5 PHÚT)', '5M HIT RATE'), value: bi('rate()[5m] > 85%', 'rate()[5m] > 85%'), tone: 'ok' },
          { label: bi('PHÁC ĐỒ SRE', 'SRE PLAYBOOK'), value: isLast ? bi('CONFIG SET ➔ REWRITE', 'CONFIG SET ➔ REWRITE') : bi('INFO ➔ SLOWLOG ➔ Fix', 'INFO ➔ SLOWLOG ➔ Fix'), tone: 'ok' },
        ],
        whatChanged,
        callout: { kind: calloutKind, text: calloutText },
        scene: {
          nodes: [
            { id: 'redis', shape: 'db', tone: 'purple', x: -235, y: 10, label: bi('Prod Redis Cluster', 'Prod Redis Cluster'), highlighted: s === 0 },
            {
              id: 'mon',
              shape: 'block',
              tone: metricTrapStep ? 'orange' : 'blue',
              x: -5,
              y: -28,
              label: bi('INFO · SLOWLOG · DOCTOR', 'INFO · SLOWLOG · DOCTOR'),
              icon: 'terminal',
              highlighted: metricTrapStep || s === 3,
              badge: {
                text: metricTrapStep ? bi('Chỉ đo CPU luồng chính!', 'Measures main-thread CPU!') : bi('Chẩn đoán < 30 giây', '30s Read-Only Triage'),
                tone: metricTrapStep ? 'warn' : 'ok',
              },
            },
            {
              id: 'sre',
              shape: 'block',
              tone: 'green',
              x: 235,
              y: 15,
              label: bi('Zero-Downtime Fix', 'Zero-Downtime Fix'),
              icon: 'shield',
              highlighted: s === 2 || isLast,
              badge: { text: isLast ? bi('CONFIG REWRITE ✔', 'CONFIG REWRITE ✔') : bi('SCAN · UNLINK · LFU', 'SCAN · UNLINK · LFU'), tone: 'ok' },
            },
          ],
          links: [
            { id: 'l1', from: 'redis', to: 'mon', label: bi('rate()[5m] & slowlog', 'rate()[5m] & slowlog') },
            { id: 'l2', from: 'mon', to: 'sre', label: bi('root cause ➔ patch', 'root cause ➔ patch') },
          ],
          packets: [
            { id: 'p1', linkId: 'l1', kind: 'pointer', speed: 0.46 },
            { id: 'p2', linkId: 'l2', kind: 'response', speed: 0.46, offset: 0.48 },
          ],
        },
        defaultCode: `SLOWLOG GET 5\nINFO memory\nINFO stats\nLATENCY DOCTOR`,
      };
    },
  },
};
