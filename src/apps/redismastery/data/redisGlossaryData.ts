import type { RedisGlossaryEntry } from '../types/redis.types';

export const REDIS_GLOSSARY_ENTRIES: RedisGlossaryEntry[] = [
  {
    id: 'set-nx-ex',
    term: 'SET key val [NX|XX] [EX s | PX ms]',
    category: 'String & Keyspace',
    complexity: 'O(1)',
    complexityDetail: 'O(1) tra cứu và cập nhật bảng băm chính',
    analogy: 'Giống `Map.set()` trong JS nhưng kèm sẵn hẹn giờ tự hủy và điều kiện kiểm tra tồn tại trong đúng 1 nhịp nguyên tử.',
    summary:
      'Lệnh nền tảng đa năng nhất của Redis hiện đại: vừa lưu cache kèm TTL (`EX`/`PX`), vừa làm khoá phân tán và Idempotency Gate (`NX` — chỉ ghi khi chưa tồn tại), thay thế hoàn toàn cặp `SETNX + EXPIRE` rời rạc cũ.',
    cliExample: 'SET idem:pay:ord-901 "processing" NX EX 300\nGET idem:pay:ord-901\nPTTL idem:pay:ord-901',
    nodeExample: `import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL!);

// Trả về "OK" nếu giành được quyền xử lý, hoặc null nếu trùng request
const acquired = await redis.set('idem:pay:ord-901', 'processing', 'EX', 300, 'NX');`,
    pythonExample: `import redis
r = redis.Redis.from_url("redis://localhost:6379/0", decode_responses=True)

# nx=True + ex=300 gộp nguyên tử trong 1 lệnh duy nhất
acquired = r.set("idem:pay:ord-901", "processing", nx=True, ex=300)`,
  },
  {
    id: 'incr-incrby',
    term: 'INCR / INCRBY / DECRBY',
    category: 'String & Keyspace',
    complexity: 'O(1)',
    complexityDetail: 'O(1) cộng số nguyên 64-bit trực tiếp trong RAM',
    analogy: 'Giống `Atomics.add()` trên SharedArrayBuffer — 1,000 request cộng cùng lúc cũng không bao giờ bị mất lượt đếm.',
    summary:
      'Tăng/giảm nguyên tử số nguyên có dấu 64-bit (`-2^63 .. 2^63 - 1`). Dùng cho bộ đếm lượt xem, giới hạn tốc độ (Fixed Window Rate Limit), trừ tồn kho nóng và cấp số thứ tự tuần tự.',
    cliExample: 'SET stock:sku-88 100\nDECRBY stock:sku-88 2\nINCR ratelimit:ip:203.0.113.5:17000012',
    nodeExample: `const remaining = await redis.decrby('stock:sku-88', 2);
if (remaining < 0) {
  await redis.incrby('stock:sku-88', 2); // hoàn lại tồn kho nếu âm
  throw new Error('OUT_OF_STOCK');
}`,
    pythonExample: `remaining = r.decrby("stock:sku-88", 2)
if remaining < 0:
    r.incrby("stock:sku-88", 2)
    raise ValueError("OUT_OF_STOCK")`,
  },
  {
    id: 'scan-vs-keys',
    term: 'SCAN cursor [MATCH pat] [COUNT n]',
    category: 'String & Keyspace',
    complexity: 'O(1)',
    complexityDetail: 'O(1) mỗi bước gọi; O(N) tổng toàn bộ phiên duyệt mà không khóa cứng Event Loop',
    analogy: 'Giống phân trang cursor-based (`yield` từng lô nhỏ) thay vì `SELECT *` kéo 20 triệu dòng làm treo server như `KEYS *`.',
    summary:
      'Duyệt không gian key (hoặc `HSCAN`, `SSCAN`, `ZSCAN` cho cấu trúc con) theo từng lô nhỏ không chặn Main Thread. Khi con trỏ trả về `"0"` nghĩa là đã hoàn tất vòng quét.',
    productionDanger:
      'CẤM gọi `KEYS *` trên production! Lưu ý `COUNT` chỉ là gợi ý số bucket băm mỗi nhịp và `SCAN` có thể trả trùng lặp hiếm gặp khi bảng băm rehash — code xử lý phía client cần idempotent.',
    cliExample: 'SCAN 0 MATCH session:u10* COUNT 200',
    nodeExample: `const stream = redis.scanStream({ match: 'session:u10*', count: 200 });
for await (const keys of stream) {
  if (keys.length) await redis.unlink(...keys);
}`,
    pythonExample: `for batch_key in r.scan_iter(match="session:u10*", count=200):
    r.unlink(batch_key)`,
  },
  {
    id: 'unlink-lazyfree',
    term: 'UNLINK key [key ...]',
    category: 'String & Keyspace',
    complexity: 'O(1)',
    complexityDetail: 'O(1) trên Main Thread để tháo tham chiếu; O(M) thu hồi RAM chạy ngầm trên luồng bio_lazy_free',
    analogy: 'Giống đưa hồ sơ dày 50,000 trang sang bàn máy hủy giấy tự động thay vì bắt nhân viên quầy thu ngân đứng xé từng tờ trước mặt khách.',
    summary:
      'Xóa bất đồng bộ an toàn cho Bigkey (Hash/Set/ZSet/List lớn). Key biến mất ngay lập tức khỏi keyspace trong vài micro-giây, còn việc giải phóng bộ nhớ được đẩy sang background thread.',
    productionDanger:
      'Dùng `DEL` trực tiếp trên Set/ZSet hàng triệu phần tử có thể làm đóng băng toàn bộ Redis hàng trăm mili-giây đến vài giây.',
    cliExample: 'UNLINK leaderboard:season-11 temp:import:users',
    nodeExample: `await redis.unlink('leaderboard:season-11', 'temp:import:users');`,
    pythonExample: `r.unlink("leaderboard:season-11", "temp:import:users")`,
  },
  {
    id: 'hash-hexpire',
    term: 'HSET / HMGET / HINCRBY / HEXPIRE (Redis 7.4 & 8)',
    category: 'Hash · List · Set',
    complexity: 'O(1)',
    complexityDetail: 'O(1) cho mỗi field truy cập (`O(K)` với `K` là số field truyền vào lệnh)',
    analogy: 'Giống `dict` phẳng trong Python lưu ngay trong RAM, nay từ Redis 7.4/8 còn gắn được đồng hồ hết hạn riêng cho từng thuộc tính con!',
    summary:
      'Biểu diễn đối tượng có cấu trúc (hồ sơ user, giỏ hàng `sku -> qty`, feature flags) tiết kiệm RAM vượt trội nhờ mã hóa `listpack` khi nhỏ. Redis 7.4/8 bổ sung `HEXPIRE` / `HTTL` cho từng field riêng lẻ mà không cần tách thành hàng chục String key.',
    productionDanger:
      'Tránh gọi `HGETALL` trên Hash khổng lồ (>5,000 fields); hãy chỉ lấy đúng trường cần bằng `HMGET` hoặc duyệt bằng `HSCAN`.',
    cliExample: 'HSET cart:u42 sku:iphone16 1 sku:airpods 2\nHINCRBY cart:u42 sku:airpods 1\nHEXPIRE cart:u42 1800 FIELDS 1 sku:iphone16\nHTTL cart:u42 FIELDS 1 sku:iphone16',
    nodeExample: `await redis.hset('cart:u42', { 'sku:iphone16': 1, 'sku:airpods': 2 });
await redis.hincrby('cart:u42', 'sku:airpods', 1);
await redis.call('HEXPIRE', 'cart:u42', 1800, 'FIELDS', 1, 'sku:iphone16');`,
    pythonExample: `r.hset("cart:u42", mapping={"sku:iphone16": 1, "sku:airpods": 2})
r.hincrby("cart:u42", "sku:airpods", 1)
r.execute_command("HEXPIRE", "cart:u42", 1800, "FIELDS", 1, "sku:iphone16")`,
  },
  {
    id: 'quicklist-queue',
    term: 'LPUSH / RPOP / BLPOP / LMOVE (List · Quicklist)',
    category: 'Hash · List · Set',
    complexity: 'O(1)',
    complexityDetail: 'O(1) ở hai đầu danh sách; O(N) nếu truy cập phần tử ở giữa bằng LINDEX/LINSERT',
    analogy: 'Giống `collections.deque` của Python ghép từ chuỗi các mảng nén `listpack` nối đôi (`quicklist`).',
    summary:
      'Hàng đợi hai đầu cực nhanh cho danh sách hoạt động gần nhất (`LPUSH` + `LTRIM 0 99` giữ 100 sự kiện mới nhất) hoặc hàng đợi công việc đơn giản (`LMOVE` chuyển nguyên tử sang danh sách đang xử lý).',
    productionDanger:
      'Đừng dùng `LRANGE key 0 -1` trên List dài hàng trăm nghìn phần tử. Với hệ thống sự kiện cần Consumer Group & ACK đa worker, hãy ưu tiên **Redis Streams**.',
    cliExample: 'LPUSH feed:u42 "evt:login" "evt:checkout"\nLTRIM feed:u42 0 49\nLRANGE feed:u42 0 9',
    nodeExample: `await redis.pipeline()
  .lpush('feed:u42', JSON.stringify({ type: 'checkout', ts: Date.now() }))
  .ltrim('feed:u42', 0, 49)
  .exec();`,
    pythonExample: `pipe = r.pipeline()
pipe.lpush("feed:u42", '{"type":"checkout"}')
pipe.ltrim("feed:u42", 0, 49)
pipe.execute()`,
  },
  {
    id: 'set-ops',
    term: 'SADD / SISMEMBER / SINTER / SCARD (Set)',
    category: 'Hash · List · Set',
    complexity: 'O(1)',
    complexityDetail: 'O(1) cho SADD / SISMEMBER / SCARD; O(N*M) cho phép giao/hợp nhiều tập lớn',
    analogy: 'Giống `Set` trong JS/Python với mã hóa siêu gọn `intset` / `listpack` khi tập nhỏ.',
    summary:
      'Tập hợp không trùng lặp: kiểm tra thành viên tức thì (`SISMEMBER`), đếm số lượng (`SCARD`), rút thăm ngẫu nhiên (`SRANDMEMBER`/`SPOP`), và tìm bạn chung / nhãn chung (`SINTER`).',
    productionDanger:
      '`SMEMBERS`, `SINTER`, `SUNION` trên các tập hàng trăm nghìn phần tử tốn `O(N)` — nên chạy trên Read Replica hoặc dùng `SSCAN` / `SINTERCARD ... LIMIT`.',
    cliExample: 'SADD tags:post:101 "redis" "caching" "devops"\nSISMEMBER tags:post:101 "redis"\nSCARD tags:post:101',
    nodeExample: `await redis.sadd('tags:post:101', 'redis', 'caching', 'devops');
const hasRedis = await redis.sismember('tags:post:101', 'redis'); // 1`,
    pythonExample: `r.sadd("tags:post:101", "redis", "caching", "devops")
has_redis = r.sismember("tags:post:101", "redis")  # True`,
  },
  {
    id: 'zset-skiplist',
    term: 'ZADD / ZINCRBY / ZRANGE ... REV / ZRANK (Sorted Set)',
    category: 'ZSet · Probabilistic · Geo',
    complexity: 'O(log N)',
    complexityDetail: 'O(log N) chèn/cập nhật trên SkipList + O(1) tra điểm của 1 member nhờ Dict kép (`ZSCORE`)',
    analogy: 'Sự kết hợp thiên tài giữa `Dict` (tra điểm của An trong O(1)) và `SkipList` nhiều tầng làn cao tốc (lấy Top 10 từ triệu người trong O(log N)).',
    summary:
      'Vũ khí đặc sản của Redis cho Bảng xếp hạng thời gian thực (Real-time Leaderboard), Hàng đợi ưu tiên / Hẹn giờ Delay Queue (score = unix timestamp) và Sliding Window Rate Limiter.',
    cliExample: 'ZADD lb:weekly 1500 "alice" 2100 "bob" 1850 "linh"\nZINCRBY lb:weekly 400 "linh"\nZRANGE lb:weekly 0 2 REV WITHSCORES\nZREVRANK lb:weekly "linh"',
    nodeExample: `await redis.zincrby('lb:weekly', 400, 'linh');
// Redis >= 6.2+: ZRANGE hỗ trợ REV + BYSCORE hợp nhất
const top3 = await redis.zrange('lb:weekly', 0, 2, 'REV', 'WITHSCORES');`,
    pythonExample: `r.zincrby("lb:weekly", 400, "linh")
top3 = r.zrange("lb:weekly", 0, 2, desc=True, withscores=True)`,
  },
  {
    id: 'hyperloglog-pfadd',
    term: 'PFADD / PFCOUNT / PFMERGE (HyperLogLog)',
    category: 'ZSet · Probabilistic · Geo',
    complexity: 'O(1)',
    complexityDetail: 'O(1) thêm phần tử, bộ nhớ trần tối đa chỉ ~12 KB cho hàng trăm triệu phần tử!',
    analogy: 'Thay vì ghi sổ họ tên từng khách ghé siêu thị (tốn hàng GB), HyperLogLog quan sát xác suất chuỗi bit 0 đầu để ước lượng chính xác số người duy nhất với sai số chuẩn chỉ ~0.81%.',
    summary:
      'Đếm số lượng thực thể duy nhất (Unique Visitors / DAU / MAU / Unique Search Queries) ở quy mô khổng lồ: 100 triệu IP lưu bằng `Set` ngốn hàng GB RAM, còn `HyperLogLog` chỉ tốn đúng **12 KB**.',
    cliExample: 'PFADD uv:2026-11-14 "u1" "u2" "u3" "u1"\nPFCOUNT uv:2026-11-14',
    nodeExample: `await redis.pfadd('uv:2026-11-14', userId);
const approxUniqueUsers = await redis.pfcount('uv:2026-11-14');`,
    pythonExample: `r.pfadd("uv:2026-11-14", user_id)
approx_unique_users = r.pfcount("uv:2026-11-14")`,
  },
  {
    id: 'bloom-filter',
    term: 'BF.RESERVE / BF.ADD / BF.EXISTS (Bloom Filter · Redis 8)',
    category: 'ZSet · Probabilistic · Geo',
    complexity: 'O(1)',
    complexityDetail: 'O(k) với k là số hàm băm độc lập (hằng số nhỏ, thường 7–10)',
    analogy: 'Người gác cổng siêu tốc: nếu bảo "KHÔNG CÓ" thì chắc chắn 100% không có trong DB; nếu bảo "CÓ THỂ CÓ" thì mới cho đi tiếp (tỷ lệ dương tính giả cấu hình được, ví dụ 1%).',
    summary:
      'Lá chắn số 1 chống **Cache Penetration** (chặn hàng triệu truy vấn ID rác trước khi chạm PostgreSQL) và kiểm tra nhanh username/email/coupon đã từng xuất hiện hay chưa với chi phí vài bit mỗi phần tử. Trong Redis 8, cấu trúc xác suất được tích hợp sẵn.',
    cliExample: 'BF.RESERVE bf:users 0.01 1000000\nBF.ADD bf:users "user:1001"\nBF.EXISTS bf:users "user:999999"',
    nodeExample: `const mayExist = await redis.call('BF.EXISTS', 'bf:users', \`user:\${id}\`);
if (mayExist === 0) return null; // Chắc chắn 100% không tồn tại -> khỏi hỏi DB!`,
    pythonExample: `may_exist = r.execute_command("BF.EXISTS", "bf:users", f"user:{uid}")
if may_exist == 0:
    return None  # Chặn đứng Cache Penetration ngay tại biên`,
  },
  {
    id: 'streams-xreadgroup',
    term: 'XADD / XREADGROUP / XPENDING / XACK / XAUTOCLAIM',
    category: 'Streams · PubSub · Lua',
    complexity: 'O(1)',
    complexityDetail: 'O(1) khi thêm mới XADD và xác nhận XACK',
    analogy: 'Kafka thu nhỏ nằm gọn trong RAM của Redis: có log bền vững, chia tải Consumer Group và sổ theo dõi tin chưa xác nhận (PEL).',
    summary:
      'Hệ thống Event Streaming bền vững: `XADD` ghi sự kiện kèm `MAXLEN ~`, `XREADGROUP ... >` chia việc giữa các worker, `XACK` xác nhận hoàn tất và `XAUTOCLAIM` cứu hộ tin mồ côi khi worker bị sập.',
    productionDanger:
      'Quên gọi `XACK` làm `PEL` phình to gây rò rỉ bộ nhớ; quên `MAXLEN ~` làm bản thân Stream phình vô hạn.',
    cliExample: 'XADD orders MAXLEN ~ 50000 * orderId 881\nXGROUP CREATE orders cg-billing $ MKSTREAM\nXREADGROUP GROUP cg-billing w1 COUNT 5 STREAMS orders >\nXACK orders cg-billing <entry-id>',
    nodeExample: `const res = await redis.xreadgroup('GROUP', 'cg-billing', 'w1', 'COUNT', 5, 'BLOCK', 2000, 'STREAMS', 'orders', '>');
// Sau khi xử lý idempotent thành công:
await redis.xack('orders', 'cg-billing', entryId);`,
    pythonExample: `entries = r.xreadgroup("cg-billing", "w1", {"orders": ">"}, count=5, block=2000)
# Sau khi xử lý xong:
r.xack("orders", "cg-billing", entry_id)`,
  },
  {
    id: 'lua-eval-evalsha',
    term: 'EVAL / EVALSHA / FUNCTION (Atomic Lua Scripting)',
    category: 'Streams · PubSub · Lua',
    complexity: 'O(1)',
    complexityDetail: 'Phụ thuộc các lệnh bên trong script — bắt buộc giữ script ngắn gọn dưới vài trăm micro-giây',
    analogy: 'Giống Stored Procedure siêu nhẹ chạy ngay bên trong luồng chính của Redis — không lệnh nào khác chen ngang được giữa chừng.',
    summary:
      'Giải pháp chuẩn cho bài toán **Check-and-Set** (mở khoá Distributed Lock kiểm tra token, trừ tồn kho kiểm tra `>= qty`, Token Bucket / Sliding Window Rate Limiter) nơi mà `MULTI/EXEC` không thể rẽ nhánh `if/else` dựa trên kết quả vừa đọc.',
    productionDanger:
      'Mọi key script động vào BẮT BUỘC truyền qua mảng `KEYS[...]` (không cộng chuỗi tên key bên trong Lua) để tương thích với Redis Cluster; tuyệt đối không viết vòng lặp lớn làm treo Event Loop.',
    cliExample: 'EVAL "local cur = tonumber(redis.call(\'GET\', KEYS[1]) or \'0\'); if cur >= tonumber(ARGV[1]) then return redis.call(\'DECRBY\', KEYS[1], ARGV[1]) else return -1 end" 1 stock:sku-1 3',
    nodeExample: `redis.defineCommand('deductStock', {
  numberOfKeys: 1,
  lua: \`local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
        if cur >= tonumber(ARGV[1]) then return redis.call('DECRBY', KEYS[1], ARGV[1]) end
        return -1\`,
});
const left = await (redis as any).deductStock('stock:sku-1', 3);`,
    pythonExample: `deduct_stock = r.register_script("""
local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
if cur >= tonumber(ARGV[1]) then return redis.call('DECRBY', KEYS[1], ARGV[1]) end
return -1
""")
left = deduct_stock(keys=["stock:sku-1"], args=[3])`,
  },
  {
    id: 'sliding-window-ratelimit',
    term: 'Sliding Window Rate Limiter (ZSet + Lua)',
    category: 'Caching · Lock · Rate Limit',
    complexity: 'O(log N)',
    complexityDetail: 'O(log N + M) với N là số request trong cửa sổ trượt (thường vài chục đến vài trăm)',
    analogy: 'Khác với cửa sổ cố định (dễ bị lách 2× hạn mức ngay ranh giới giây 59 và giây 00), cửa sổ trượt luôn nhìn lùi chính xác 60,000ms tính từ mili-giây hiện tại.',
    summary:
      'Thuật toán giới hạn tốc độ API chuẩn xác cao: xóa các dấu thời gian cũ hơn `now - windowMs` bằng `ZREMRANGEBYSCORE`, đếm `ZCARD`, nếu chưa vượt ngưỡng thì `ZADD` request mới và đặt `PEXPIRE`.',
    cliExample: 'ZREMRANGEBYSCORE rl:u42 0 1700000040000\nZCARD rl:u42\nZADD rl:u42 1700000100000 "1700000100000-a91f"\nPEXPIRE rl:u42 60000',
    nodeExample: `// Thực thi nguyên tử trong 1 Lua script để tránh race condition khi burst traffic
const allowed = await redis.eval(SLIDING_WINDOW_LUA, 1, \`rl:\${userId}\`, Date.now(), 60_000, 100, reqId);`,
    pythonExample: `allowed = r.eval(SLIDING_WINDOW_LUA, 1, f"rl:{user_id}", now_ms, 60_000, 100, req_id)`,
  },
  {
    id: 'eviction-lfu-lru',
    term: 'maxmemory & 8 Chính sách Eviction (LRU vs TinyLFU)',
    category: 'Persistence · Cluster · Ops',
    complexity: 'O(1)',
    complexityDetail: 'Xấp xỉ lấy mẫu (`maxmemory-samples 5..10`) cực nhẹ O(1), không tốn danh sách liên kết toàn cục',
    analogy: 'LRU giữ món vừa mới chạm tay gần đây; LFU (Least Frequently Used) giữ món khách hỏi mua nhiều lần nhất trong ngày — chống bị một cú quét dữ liệu lịch sử đá văng các hot key thật.',
    summary:
      '`noeviction` dùng cho Store bền vững (Session/Queue/Lock); `allkeys-lfu` hoặc `allkeys-lru` là lựa chọn vàng cho cụm Cache thuần túy; nhóm `volatile-*` chỉ thu hồi những key có đặt `EXPIRE`.',
    productionDanger:
      'Luôn đặt `maxmemory` thấp hơn RAM vật lý/container khoảng **30–40%** để chừa không gian cho Copy-on-Write (`fork` BGSAVE/AOF), Client Output Buffers và phân mảnh bộ nhớ.',
    cliExample: 'CONFIG GET maxmemory*\nOBJECT FREQ cache:product:99\nOBJECT IDLETIME session:u42',
    nodeExample: `const memInfo = await redis.info('memory');
// Giám sát evicted_keys và mem_fragmentation_ratio trên Prometheus/Grafana`,
    pythonExample: `mem_info = r.info("memory")
print(mem_info["used_memory_human"], mem_info["evicted_keys"])`,
  },
  {
    id: 'cluster-hash-slots',
    term: '16384 Hash Slots · CRC16 · {HashTag} (Redis Cluster)',
    category: 'Persistence · Cluster · Ops',
    complexity: 'O(1)',
    complexityDetail: 'O(len(key)) tính CRC16 ngay tại client SDK, định tuyến thẳng 1-hop tới đúng Master node',
    analogy: '16,384 ngăn tủ bưu phẩm chia đều cho các bưu cục Master; nếu dán nhãn `{user42}` ngoài phong bì thì mọi thư của `user42` luôn về chung đúng 1 ngăn tủ.',
    summary:
      'Cơ chế phân mảnh ngang (Sharding) chính thức của Redis: `slot = CRC16(tag_or_key) % 16384`. Khi có cặp `{...}` hợp lệ (không rỗng), chỉ phần nằm giữa cặp `{...}` đầu tiên được băm để gom các key liên quan về cùng 1 shard cho `MGET` / `EVAL`.',
    productionDanger:
      'Cảnh giác **Hot Slot / Data Skew**: nếu lạm dụng chung 1 `{hashtag}` rộng (ví dụ `{orders}` cho mọi đơn hàng), 100% tải sẽ đổ dồn chết 1 node duy nhất!',
    cliExample: 'CLUSTER KEYSLOT "order:{u42}:items"\nCLUSTER KEYSLOT "order:{u42}:payment"\n# Cả hai đều trả về cùng 1 slot!',
    nodeExample: `const cluster = new Redis.Cluster([
  { host: '10.0.1.11', port: 6379 },
  { host: '10.0.1.12', port: 6379 },
  { host: '10.0.1.13', port: 6379 },
]);
await cluster.mget('profile:{u42}:basic', 'profile:{u42}:prefs');`,
    pythonExample: `from redis.cluster import RedisCluster
rc = RedisCluster(host="10.0.1.11", port=6379, decode_responses=True)
rc.mget(["profile:{u42}:basic", "profile:{u42}:prefs"])`,
  },
  {
    id: 'acl-least-privilege',
    term: 'ACL SETUSER (Phân quyền Tối thiểu Zero-Trust)',
    category: 'Persistence · Cluster · Ops',
    complexity: 'O(1)',
    complexityDetail: 'O(1) kiểm tra bitmap quyền lệnh & tiền tố key trên mỗi kết nối',
    analogy: 'Giống IAM Policy của AWS nhưng áp ngay từng lệnh và từng tiền tố key (`~checkout:*`) bên trong Redis.',
    summary:
      'Thay vì dùng chung tài khoản `default` toàn quyền, tạo tài khoản riêng cho từng microservice: giới hạn tiền tố key được phép chạm (`~app:*`), kênh Pub/Sub (`&app:*`), và cấm nhóm lệnh nguy hiểm (`-@admin -@dangerous -keys -flushall -flushdb`).',
    cliExample: 'ACL SETUSER checkout-svc on >S3cureP@ss2026 ~checkout:* ~ratelimit:* +@read +@write +@scripting -@dangerous -keys\nACL LIST',
    nodeExample: `const redis = new Redis({
  host: 'redis-internal.prod.local',
  port: 6379,
  username: 'checkout-svc',
  password: process.env.REDIS_ACL_PASSWORD,
  tls: {},
});`,
    pythonExample: `r = redis.Redis(
    host="redis-internal.prod.local",
    port=6379,
    username="checkout-svc",
    password=os.environ["REDIS_ACL_PASSWORD"],
    ssl=True,
)`,
  },
];
