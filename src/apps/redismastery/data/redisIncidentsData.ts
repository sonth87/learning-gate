import type { RedisIncidentScenario } from '../types/redis.types';

export const REDIS_INCIDENT_SCENARIOS: RedisIncidentScenario[] = [
  {
    id: 'inc-cache-stampede',
    code: 'INC-R01',
    title: 'Bão Cache Stampede đánh sập PostgreSQL lúc 00:00 Flash Sale',
    moduleRef: 'R10',
    severity: 'SEV-1',
    statusBadge: 'DB_POOL_EXHAUSTED',
    alertMessage:
      'Đúng 00:05:00 (tròn 5 phút sau khi mở bán), key `cache:flashsale:banner` hết hạn. PostgreSQL CPU vọt 100%, 200/200 kết nối treo cứng!',
    p99BeforeMs: 4820,
    dbLoadBeforePct: 99,
    telemetryLogs: [
      '00:05:00.002 [redis] KEY EXPIRED cache:flashsale:banner (TTL=300s exact)',
      '00:05:00.019 [api-gw] 4,200 concurrent GET /api/flashsale -> Cache MISS simultaneously',
      '00:05:00.085 [pg-primary] FATAL: sorry, too many clients already (active=200/200)',
      '00:05:01.410 [ingress] Upstream timed out (504 Gateway Timeout) p99=4820ms',
    ],
    diagnosticHint:
      'Tăng TTL đơn thuần chỉ dời thời điểm nổ bom sang phút khác. Làm sao để chỉ 1 request xuống DB nạp lại và tránh hàng nghìn key cùng hết hạn đúng 1 giây?',
    rootCause:
      'Thiếu cơ chế khóa tái tạo (Singleflight / Mutex `SET NX PX` hoặc Logical Expiration) khi Cache Miss đối với hot key, cộng với đặt TTL cố định tròn chẵn không có Jitter.',
    options: [
      {
        id: 'opt-ttl-longer',
        label: 'Tăng cứng TTL từ 300s lên 3600s và tăng max_connections của PostgreSQL lên 1000',
        command: 'SET cache:flashsale:banner <json> EX 3600',
        isCorrect: false,
        feedback:
          'Sai! Đúng 01:00:00 quả bom vẫn phát nổ y hệt, và đẩy 1,000 kết nối đồng thời vào PostgreSQL chỉ làm context-switch nghiền nát đĩa và RAM của DB nhanh hơn.',
        p99AfterMs: 3900,
        dbLoadAfterPct: 95,
      },
      {
        id: 'opt-singleflight-jitter',
        label: 'Áp dụng Singleflight / Mutex Lock (SET NX PX) khi rebuild + cộng TTL Jitter ngẫu nhiên & Early Refresh',
        command: 'SET lock:rebuild:banner <uuid> NX PX 3000  &&  SET cache:flashsale:banner <json> EX (300 + rand(0..60))',
        isCorrect: true,
        feedback:
          'Chính xác! Chỉ đúng 1 worker giành được khoá xuống PostgreSQL lấy dữ liệu mới, 4,199 request còn lại dùng bản cache tạm/chờ ngắn 20ms, và TTL Jitter ngăn chặn hiện tượng hết hạn đồng loạt.',
        p99AfterMs: 2.4,
        dbLoadAfterPct: 6,
      },
      {
        id: 'opt-flushall',
        label: 'Tắt hẳn Redis tạm thời để mọi request đi trực tiếp qua Read Replica của DB',
        command: 'CONFIG SET maxmemory 1mb',
        isCorrect: false,
        feedback:
          'Thảm họa! 4,200 req/s đọc trực tiếp sẽ đánh gục toàn bộ dàn Read Replica ngay lập tức.',
        p99AfterMs: 5000,
        dbLoadAfterPct: 100,
      },
    ],
  },
  {
    id: 'inc-keys-star-freeze',
    code: 'INC-R02',
    title: 'Đóng băng toàn bộ Redis mỗi phút do Cronjob gọi KEYS session:*',
    moduleRef: 'R01',
    severity: 'SEV-1',
    statusBadge: 'MAIN_THREAD_BLOCKED',
    alertMessage:
      'Cứ đúng giây thứ 00 mỗi phút, toàn bộ dịch vụ đăng nhập & giỏ hàng bị khựng 1.4 giây (P99 vọt từ 0.8ms lên 1,420ms) dù CPU trung bình của máy chủ chỉ 18%!',
    p99BeforeMs: 1420,
    dbLoadBeforePct: 34,
    telemetryLogs: [
      '10:12:00.004 [redis-slowlog] id=8841 duration=1389420us cmd="KEYS" args="session:*" client=analytics-cron:51204',
      '10:12:00.950 [checkout-svc] Redis command timeout (>1000ms) on HGET cart:88210',
      '10:12:01.395 [redis] DB0 keyspace keys=18,450,210 expires=17,900,112',
    ],
    diagnosticHint:
      'Kiểm tra `SLOWLOG GET`: Redis thực thi lệnh trên 1 Main Thread duy nhất. Quét trọn 18.4 triệu key bằng một lệnh đồng bộ gây hậu quả gì?',
    rootCause:
      'Cronjob thống kê chạy lệnh `KEYS session:*` độ phức tạp `O(N)` trên 18.4 triệu key, khóa cứng Event Loop đơn luồng của Redis suốt ~1.4 giây khiến mọi lệnh `O(1)` khác phải xếp hàng chờ.',
    options: [
      {
        id: 'opt-scan-acl',
        label: 'Thay KEYS bằng vòng lặp con trỏ SCAN ... COUNT 500 (trên Replica nếu có) + chặn lệnh KEYS trong ACL / rename-command',
        command: 'SCAN 0 MATCH session:* COUNT 500  |  ACL SETUSER app -keys',
        isCorrect: true,
        feedback:
          'Xuất sắc! `SCAN` chia nhỏ việc duyệt bảng băm thành từng bước ~0.2ms xen kẽ các lệnh khác mà không khoá Event Loop, đồng thời cấm `KEYS` bằng ACL để không dev nào tái phạm.',
        p99AfterMs: 0.9,
        dbLoadAfterPct: 8,
      },
      {
        id: 'opt-scale-ram',
        label: 'Nâng cấp gấp đôi dung lượng RAM từ 32 GB lên 64 GB',
        command: '# Upgrade cloud instance RAM 32GB -> 64GB',
        isCorrect: false,
        feedback:
          'Không giải quyết được gốc rễ! Vấn đề không phải thiếu RAM mà là 1 luồng CPU duy nhất bị chiếm độc quyền 1.4 giây để duyệt 18.4 triệu phần tử.',
        p99AfterMs: 1390,
        dbLoadAfterPct: 34,
      },
      {
        id: 'opt-multi-keys',
        label: 'Bọc lệnh KEYS session:* bên trong khối MULTI / EXEC để chạy nhanh hơn',
        command: 'MULTI\nKEYS session:*\nEXEC',
        isCorrect: false,
        feedback:
          'Sai! `MULTI/EXEC` vẫn thực thi tuần tự trên cùng Main Thread nên vẫn treo cứng 1.4 giây như cũ.',
        p99AfterMs: 1440,
        dbLoadAfterPct: 34,
      },
    ],
  },
  {
    id: 'inc-bigkey-del-spike',
    code: 'INC-R03',
    title: 'Xóa Bigkey 4 triệu phần tử bằng DEL gây nghẽn mạch 900ms',
    moduleRef: 'R17',
    severity: 'SEV-2',
    statusBadge: 'SYNC_FREE_SPIKE',
    alertMessage:
      'Mỗi đêm khi dọn bảng xếp hạng sự kiện cũ (`Set` chứa 4.2 triệu userId), Redis bị treo cứng gần 1 giây làm rớt heartbeat kết nối từ các microservice.',
    p99BeforeMs: 920,
    dbLoadBeforePct: 28,
    telemetryLogs: [
      '00:00:01.002 [redis-slowlog] duration=894110us cmd="DEL" args="promo:participants:2026-11-13"',
      '00:00:01.003 [latency-doctor] fast-command spike: synchronous memory reclamation of 4,200,000 hashtable nodes',
    ],
    diagnosticHint:
      'Với String nhỏ, `DEL` là `O(1)`. Nhưng với Hash/Set/ZSet/List triệu phần tử, `DEL` gọi `free()` từng node ngay trên Main Thread! Lệnh nào tách con trỏ `O(1)` rồi giao luồng nền `bio_lazy_free` dọn?',
    rootCause:
      'Dùng `DEL` đồng bộ trên Bigkey (`O(M)` với `M = 4.2 triệu` phần tử) khiến Main Thread phải giải phóng hàng triệu vùng cấp phát bộ nhớ trước khi xử lý lệnh tiếp theo.',
    options: [
      {
        id: 'opt-unlink-lazyfree',
        label: 'Dùng UNLINK thay cho DEL + bật lazyfree-lazy-expire / lazyfree-lazy-eviction / lazyfree-lazy-server-del yes',
        command: 'UNLINK promo:participants:2026-11-13  &&  CONFIG SET lazyfree-lazy-expire yes',
        isCorrect: true,
        feedback:
          'Chuẩn xác! `UNLINK` chỉ tháo key khỏi không gian tên chính trong `O(1)` (~vài micro-giây), còn việc thu hồi 4.2 triệu node RAM được đẩy sang background thread `bio_lazy_free` hoàn toàn êm ái. Đồng thời về lâu dài nên chia nhỏ Bigkey theo bucket/shard.',
        p99AfterMs: 0.7,
        dbLoadAfterPct: 7,
      },
      {
        id: 'opt-expire-1s',
        label: 'Đặt EXPIRE key 1 giây mà vẫn để mặc định lazyfree-lazy-expire no',
        command: 'EXPIRE promo:participants:2026-11-13 1',
        isCorrect: false,
        feedback:
          'Bẫy ẩn! Nếu `lazyfree-lazy-expire` đang là `no`, đúng 1 giây sau khi key hết hạn, Redis vẫn xóa đồng bộ ngay trên Main Thread và gây spike 900ms y hệt!',
        p99AfterMs: 905,
        dbLoadAfterPct: 28,
      },
      {
        id: 'opt-smembers-loop',
        label: 'Gọi SMEMBERS kéo hết 4.2 triệu phần tử về App rồi gọi SREM từng cái',
        command: 'SMEMBERS promo:participants:2026-11-13',
        isCorrect: false,
        feedback:
          'Cực kỳ nguy hiểm! `SMEMBERS` 4.2 triệu phần tử vừa khoá cứng Main Thread vừa làm nổ output buffer và nghẽn băng thông mạng.',
        p99AfterMs: 3600,
        dbLoadAfterPct: 40,
      },
    ],
  },
  {
    id: 'inc-cache-penetration',
    code: 'INC-R04',
    title: 'Tấn công Cache Penetration: Bot quét triệu ID âm không tồn tại',
    moduleRef: 'R10',
    severity: 'SEV-1',
    statusBadge: 'CACHE_BYPASS_FLOOD',
    alertMessage:
      'Redis Hit Ratio tụt thê thảm từ 98% xuống 4%! Kẻ tấn công bắn 8,000 req/s vào `/users?id=-991823...` (các ID không hề có trong DB) xuyên thủng Redis đập thẳng vào DB.',
    p99BeforeMs: 2650,
    dbLoadBeforePct: 97,
    telemetryLogs: [
      '14:22:10 [redis] keyspace_hits=412/s  keyspace_misses=8,190/s (Hit Ratio = 4.7%)',
      '14:22:11 [app] GET user:-837162 -> Redis nil -> SELECT * FROM users WHERE id=-837162 -> 0 rows (not cached!)',
      '14:22:12 [pg-primary] CPU=97% IOPS saturated scanning primary index for non-existent IDs',
    ],
    diagnosticHint:
      'Vì DB trả về `null`, code không lưu gì vào Redis nên mọi request với ID giả đều đi xuyên qua lớp đệm. Làm sao chặn cả ID lặp lại lẫn hàng triệu ID ngẫu nhiên mới tinh?',
    rootCause:
      'Cache Penetration (xuyên thủng cache): dữ liệu không tồn tại cả trong Redis lẫn DB nên không bao giờ được cache lại, biến Redis thành vô hình trước luồng truy vấn ID rác.',
    options: [
      {
        id: 'opt-bloom-null-ttl',
        label: 'Validate đầu vào chặt + đặt bộ lọc Bloom Filter (`BF.EXISTS users:bf <id>`) chặn sớm + Cache giá trị rỗng (`__NULL__`) với TTL ngắn 30–60s',
        command: 'BF.EXISTS bf:valid_users <id>  # nếu 0 -> trả 404 ngay không chạm DB!',
        isCorrect: true,
        feedback:
          'Chính xác tuyệt đối! Validate chặn ngay ID âm; Bloom Filter tốn vài MB RAM nhưng loại bỏ 99%+ các ID ngẫu nhiên không tồn tại chỉ trong `O(k)` mà không tốn key riêng cho từng ID rác; kết hợp Null-Sentinel TTL ngắn cho phần dương tính giả nhỏ còn lại.',
        p99AfterMs: 1.1,
        dbLoadAfterPct: 5,
      },
      {
        id: 'opt-null-ttl-forever',
        label: 'Cache cứng mọi ID không tồn tại với TTL = 7 ngày để lần sau trúng cache',
        command: 'SET user:<random_id> "NULL" EX 604800',
        isCorrect: false,
        feedback:
          'Bẫy tràn RAM! Kẻ tấn công sinh ID ngẫu nhiên không trùng lặp (`uuid`), lưu mỗi ID rác 7 ngày sẽ nhanh chóng lấp đầy `maxmemory` và đẩy văng (evict) toàn bộ dữ liệu thật của khách hàng!',
        p99AfterMs: 680,
        dbLoadAfterPct: 45,
      },
      {
        id: 'opt-eviction-random',
        label: 'Đổi maxmemory-policy sang allkeys-random',
        command: 'CONFIG SET maxmemory-policy allkeys-random',
        isCorrect: false,
        feedback:
          'Không liên quan! Request vẫn bị Cache Miss và vẫn lao thẳng xuống PostgreSQL 8,000 lần/giây.',
        p99AfterMs: 2640,
        dbLoadAfterPct: 97,
      },
    ],
  },
  {
    id: 'inc-noeviction-oom',
    code: 'INC-R05',
    title: 'Lỗi OOM command not allowed trên cụm Cache dùng sai maxmemory-policy',
    moduleRef: 'R12',
    severity: 'SEV-1',
    statusBadge: 'OOM_WRITE_REJECTED',
    alertMessage:
      'Toàn bộ API thanh toán báo lỗi 500: `OOM command not allowed when used memory > maxmemory`. Kiểm tra thấy Redis dùng chung cho cả Cache sản phẩm không đặt TTL và Session!',
    p99BeforeMs: 1850,
    dbLoadBeforePct: 72,
    telemetryLogs: [
      '16:40:02 [redis] used_memory_human:4.00G  maxmemory_human:4.00G  maxmemory_policy:noeviction',
      '16:40:03 [auth-svc] ReplyError: OOM command not allowed when used memory > \'maxmemory\' on SET session:9912',
      '16:40:04 [redis-info] db0: keys=3,120,000, expires=410,000 (2.71M keys have NO TTL!)',
    ],
    diagnosticHint:
      'Chú ý 2 chi tiết sống còn: (1) `maxmemory-policy` đang để mặc định `noeviction`, và (2) có tới 2.71 triệu key cache sản phẩm từng quên đặt TTL!',
    rootCause:
      'Instance đóng vai trò Cache nhưng để mặc định `noeviction` và có lượng lớn key quên gắn TTL; khi đầy 4 GB RAM, mọi lệnh ghi mới bị từ chối cứng bằng lỗi OOM.',
    options: [
      {
        id: 'opt-volatile-lru-only',
        label: 'Đổi sang volatile-lru để chỉ xóa các key có TTL',
        command: 'CONFIG SET maxmemory-policy volatile-lru',
        isCorrect: false,
        feedback:
          'Nguy hiểm! `volatile-lru` chỉ được phép thu hồi nhóm 410k key có TTL (chính là Session đăng nhập của user!), trong khi 2.71 triệu key cache quên đặt TTL phình to dần sẽ đá văng sạch Session và cuối cùng vẫn gây OOM!',
        p99AfterMs: 620,
        dbLoadAfterPct: 55,
      },
      {
        id: 'opt-allkeys-lfu-split',
        label: 'Tách riêng Redis Session (bền vững) với Redis Cache; trên cụm Cache đặt `allkeys-lfu` (hoặc `allkeys-lru`) và bắt buộc gắn TTL chuẩn cho mọi key mới',
        command: 'CONFIG SET maxmemory-policy allkeys-lfu',
        isCorrect: true,
        feedback:
          'Chuẩn kiến trúc Production! Tách cụm Stateful (Session/Lock/Stream dùng `noeviction`) khỏi cụm Pure Cache (`allkeys-lfu` giữ lại các hot key được truy cập nhiều nhất kể cả khi có code cũ lỡ quên đặt TTL).',
        p99AfterMs: 1.2,
        dbLoadAfterPct: 12,
      },
      {
        id: 'opt-maxmemory-zero',
        label: 'Đặt maxmemory 0 (không giới hạn) trên container 4GB RAM để Redis không bao giờ từ chối lệnh',
        command: 'CONFIG SET maxmemory 0',
        isCorrect: false,
        feedback:
          'Tự sát! Không giới hạn `maxmemory` trong container K8s 4GB sẽ khiến cgroup Linux OOM Killer giết chết toàn bộ tiến trình `redis-server` (`Exit Code 137`) và mất trắng dữ liệu trên RAM!',
        p99AfterMs: 4999,
        dbLoadAfterPct: 99,
      },
    ],
  },
  {
    id: 'inc-unsafe-lock-del',
    code: 'INC-R06',
    title: 'Trừ tiền ví 2 lần do Distributed Lock gọi DEL không kiểm tra chủ sở hữu',
    moduleRef: 'R11',
    severity: 'SEV-1',
    statusBadge: 'DOUBLE_DEBIT_RACE',
    alertMessage:
      'Đối soát tài chính phát hiện 14 giao dịch rút tiền bị chạy song song trên 2 worker dù cả hai đều bọc trong `lock:wallet:<uid>`!',
    p99BeforeMs: 310,
    dbLoadBeforePct: 42,
    telemetryLogs: [
      '21:08:00.000 [worker-1] SET lock:wallet:77 "1" NX PX 2000 -> OK',
      '21:08:02.150 [worker-1] Webhook bank delay 2.15s (Lock expired at 2.00s!)',
      '21:08:02.020 [worker-2] SET lock:wallet:77 "1" NX PX 2000 -> OK (Entered critical section)',
      '21:08:02.160 [worker-1] finally { await redis.del("lock:wallet:77") } -> DELETED WORKER-2 LOCK!',
      '21:08:02.180 [worker-3] SET lock:wallet:77 "1" NX PX 2000 -> OK (Worker-2 & Worker-3 run together!)',
    ],
    diagnosticHint:
      'Đọc kỹ timeline ở mili-giây `2.160`: khối `finally` của Worker-1 vừa xóa nhầm khoá của ai?',
    rootCause:
      'Gán giá trị khoá tĩnh `"1"` và gọi `DEL` mù quáng trong `finally`: khi Worker-1 bị trễ quá thời gian lease, nó xóa mất khoá đang thuộc về Worker-2, mở toang cửa cho Worker-3 đi vào cùng lúc.',
    options: [
      {
        id: 'opt-lua-owner-idempotent',
        label: 'Gán token ngẫu nhiên duy nhất (`UUID`) mỗi lần lock + chỉ xóa khoá bằng Lua script kiểm tra `GET == token` + thêm Idempotency Key / Unique Constraint ở tầng DB',
        command: 'SET lock:wallet:77 <uuid> NX PX 10000  +  EVAL "if redis.call(\'GET\',KEYS[1])==ARGV[1] then return redis.call(\'DEL\',KEYS[1]) else return 0 end" 1 ...',
        isCorrect: true,
        feedback:
          'Hoàn hảo! Lua đảm bảo bước kiểm tra chủ sở hữu và bước `DEL` là một nguyên tử không thể xen ngang, ngăn tuyệt đối lỗi xóa nhầm khoá người khác; kết hợp Idempotency ở DB bảo vệ an toàn lớp cuối.',
        p99AfterMs: 4.5,
        dbLoadAfterPct: 14,
      },
      {
        id: 'opt-get-then-del-app',
        label: 'Trong code Node.js gọi `if (await redis.get(key) === myUuid) await redis.del(key)` bằng 2 lệnh tách rời',
        command: 'GET lock:wallet:77  ->  DEL lock:wallet:77',
        isCorrect: false,
        feedback:
          'Vẫn dính Race Condition (TOCTOU)! Nếu khoá vừa kịp hết hạn đúng vào khoảng 1ms giữa lệnh `GET` và lệnh `DEL`, Worker-1 vẫn xóa nhầm khoá vừa cấp cho Worker-2!',
        p99AfterMs: 180,
        dbLoadAfterPct: 35,
      },
      {
        id: 'opt-no-ttl-lock',
        label: 'Bỏ hẳn tham số PX (không đặt TTL cho lock) để khoá không bao giờ tự hết hạn',
        command: 'SET lock:wallet:77 "1" NX',
        isCorrect: false,
        feedback:
          'Thảm họa Deadlock! Chỉ cần 1 pod bị OOM hoặc mất điện khi đang giữ khoá, ví của khách hàng đó sẽ bị khoá chết vĩnh viễn cho tới khi có người xóa tay.',
        p99AfterMs: 5000,
        dbLoadAfterPct: 20,
      },
    ],
  },
  {
    id: 'inc-streams-pel-leak',
    code: 'INC-R07',
    title: 'Rò rỉ RAM trên Redis Streams do quên XACK & không giới hạn MAXLEN',
    moduleRef: 'R08',
    severity: 'SEV-2',
    statusBadge: 'STREAM_MEMORY_LEAK',
    alertMessage:
      'Dung lượng RAM của cụm Redis Event Bus tăng đều đặn 1.2 GB mỗi ngày dù tốc độ đơn hàng không tăng. Kiểm tra thấy `PEL` của nhóm `email-workers` có 9.4 triệu bản ghi!',
    p99BeforeMs: 410,
    dbLoadBeforePct: 22,
    telemetryLogs: [
      '09:15:00 [redis] XINFO STREAM events:order -> length=14,800,220 (no trimming configured)',
      '09:15:01 [redis] XINFO GROUPS events:order -> name="email-workers" pending=9,412,880 lag=0',
      '09:15:02 [email-worker] Consuming via XREADGROUP ... ">" -> sending email -> (missing XACK!)',
    ],
    diagnosticHint:
      'Có 2 chỗ phình bộ nhớ cùng lúc: `length=14.8M` của bản thân Stream và `pending=9.4M` trong danh sách chờ xác nhận (`PEL`) của Consumer Group!',
    rootCause:
      'Worker đọc bằng `XREADGROUP` nhưng không bao giờ gọi `XACK` sau khi gửi email thành công (làm `PEL` phình vô hạn), đồng thời Producer gọi `XADD` không kèm ngưỡng cắt `MAXLEN ~`.',
    options: [
      {
        id: 'opt-xack-xautoclaim-maxlen',
        label: 'Gọi `XACK` ngay sau khi xử lý xong + chạy vòng `XAUTOCLAIM` thu hồi tin lỗi + cấu hình Producer `XADD ... MAXLEN ~ 200000`',
        command: 'XACK events:order email-workers <id>  &&  XADD events:order MAXLEN ~ 200000 * ...',
        isCorrect: true,
        feedback:
          'Chuẩn bài! `XACK` giải phóng bộ nhớ `PEL`, `XAUTOCLAIM` xử lý các tin tồn đọng khi pod crash, và `MAXLEN ~` cắt tỉa Radix Tree hiệu năng cao giữ dung lượng RAM luôn phẳng và ổn định.',
        p99AfterMs: 1.3,
        dbLoadAfterPct: 10,
      },
      {
        id: 'opt-switch-pubsub',
        label: 'Đổi sang lệnh PUBLISH / SUBSCRIBE truyền thống để không lưu gì trong RAM',
        command: 'PUBLISH events:order <payload>',
        isCorrect: false,
        feedback:
          'Sai kiến trúc! Pub/Sub là fire-and-forget: chỉ cần pod `email-worker` rolling-restart 3 giây lúc deploy là toàn bộ email xác nhận đơn hàng trong 3 giây đó mất vĩnh viễn và không chia tải theo nhóm được.',
        p99AfterMs: 85,
        dbLoadAfterPct: 22,
      },
      {
        id: 'opt-del-stream-cron',
        label: 'Đặt cronjob gọi DEL events:order mỗi 1 giờ',
        command: 'DEL events:order',
        isCorrect: false,
        feedback:
          'Nguy hiểm! Xóa cả key Stream sẽ xóa sạch toàn bộ Consumer Group metadata và mọi đơn hàng chưa kịp xử lý trong giây cuối cùng!',
        p99AfterMs: 740,
        dbLoadAfterPct: 30,
      },
    ],
  },
  {
    id: 'inc-cluster-crossslot',
    code: 'INC-R08',
    title: 'Nổ lỗi CROSSSLOT đồng loạt sau khi nâng cấp từ Redis đơn lẻ lên Redis Cluster',
    moduleRef: 'R15',
    severity: 'SEV-1',
    statusBadge: 'CROSSSLOT_EXCEPTION',
    alertMessage:
      'Vừa cutover từ 1 Master sang cụm Redis Cluster 3 Master shards, chức năng chuyển điểm thưởng (`EVAL` trên 2 key `wallet:u100:balance` và `wallet:u100:history`) lỗi 100%!',
    p99BeforeMs: 950,
    dbLoadBeforePct: 61,
    telemetryLogs: [
      '23:02:11 [loyalty-svc] ReplyError: CROSSSLOT Keys in request don\'t hash to the same slot',
      '23:02:11 [debug] CLUSTER KEYSLOT "wallet:u100:balance" -> 11842 (Shard #3)',
      '23:02:11 [debug] CLUSTER KEYSLOT "wallet:u100:history" -> 4219  (Shard #1)',
    ],
    diagnosticHint:
      'Trong Redis Cluster, lệnh đa key (`MGET`, `SUNION`, `MULTI`, `EVAL`) đòi hỏi mọi key tham gia phải nằm trên cùng 1 Hash Slot. Ký pháp nào buộc `CRC16` chỉ băm phần định danh `u100`?',
    rootCause:
      '`CRC16("wallet:u100:balance") mod 16384` và `CRC16("wallet:u100:history") mod 16384` rơi vào 2 slot trên 2 Master node khác nhau, mà Redis Cluster không hỗ trợ giao dịch phân tán xuyên shard.',
    options: [
      {
        id: 'opt-hashtag-user',
        label: 'Thiết kế Hash Tag theo thực thể người dùng: `wallet:{u100}:balance` và `wallet:{u100}:history` để cả hai cùng băm theo chuỗi `u100` vào đúng 1 slot',
        command: 'EVAL <script> 2 wallet:{u100}:balance wallet:{u100}:history ...',
        isCorrect: true,
        feedback:
          'Chính xác! Cặp ngoặc nhọn `{u100}` báo cho Redis chỉ tính `CRC16("u100") mod 16384` (cùng về 1 slot cho mỗi user), đồng thời vì mỗi `u100, u101, ...` có mã khác nhau nên dữ liệu vẫn phân tán đều khắp 3 Master shards (không bị lệch tải Hot Shard)!',
        p99AfterMs: 1.4,
        dbLoadAfterPct: 9,
      },
      {
        id: 'opt-global-hashtag',
        label: 'Đặt chung một Hash Tag cố định `{wallet}` cho toàn bộ hệ thống: `{wallet}:u100:balance`, `{wallet}:u101:balance`...',
        command: 'SET {wallet}:u100:balance 500',
        isCorrect: false,
        feedback:
          'Bẫy kinh điển gây sập Cluster (Slot Skew / Hot Shard)! Nếu mọi key đều có chung `{wallet}`, 100% dữ liệu của triệu người dùng sẽ dồn hết vào duy nhất 1 slot trên 1 Master node trong khi 2 Master còn lại ngồi chơi rỗng không!',
        p99AfterMs: 1620,
        dbLoadAfterPct: 58,
      },
      {
        id: 'opt-keys-in-lua-hardcode',
        label: 'Giữ nguyên tên key cũ nhưng giấu tên key bên trong thân chuỗi Lua thay vì truyền qua mảng KEYS[]',
        command: 'EVAL "return redis.call(\'GET\', \'wallet:u100:history\')" 0',
        isCorrect: false,
        feedback:
          'Vi phạm nghiêm trọng quy tắc Redis Cluster! Khi script chạm tới key thuộc slot không do node hiện tại nắm giữ, Redis Cluster vẫn ném lỗi ngay lập tức.',
        p99AfterMs: 980,
        dbLoadAfterPct: 61,
      },
    ],
  },
];
