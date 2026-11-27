export interface BilingualText {
  vi: string;
  en: string;
}

export type InterviewLevel = 'Beginner' | 'Mid' | 'Senior' | 'Staff';

export type SnakeStageId = 'S' | 'N' | 'A' | 'K' | 'E';

export const SNAKE_STAGE_ORDER: readonly SnakeStageId[] = ['S', 'N', 'A', 'K', 'E'] as const;

export const TOTAL_INTERVIEW_BUDGET_SEC = 45 * 60; // 2700s = 45:00

export interface SnakeStageSpec {
  id: SnakeStageId;
  shortTitle: BilingualText;
  fullTitle: BilingualText;
  budgetSec: number;
  budgetDisplay: string;
  goal: BilingualText;
  placeholder: BilingualText;
}

export const SNAKE_STAGES: Record<SnakeStageId, SnakeStageSpec> = {
  S: {
    id: 'S',
    shortTitle: { vi: 'Scope', en: 'Scope' },
    fullTitle: {
      vi: 'S — Scope (Làm rõ phạm vi)',
      en: 'S — Scope (Clarify Requirements)',
    },
    budgetSec: 5 * 60,
    budgetDisplay: '05:00',
    goal: {
      vi: 'Thu hẹp đề bài mở thành danh sách tính năng cốt lõi, ngoài phạm vi (out-of-scope), quy mô tải, độ trễ mục tiêu và mô hình nhất quán.',
      en: 'Turn an intentionally open brief into explicit functional scope, out-of-scope boundaries, traffic scale, latency SLOs, and consistency rules.',
    },
    placeholder: {
      vi: '1. Yêu cầu chức năng cốt lõi (In-scope):\n- ...\n\n2. Ngoài phạm vi (Out-of-scope):\n- ...\n\n3. Yêu cầu phi chức năng (Scale, Latency SLO, Availability, Consistency):\n- ...',
      en: '1. Core Functional Requirements (In-scope):\n- ...\n\n2. Out-of-scope:\n- ...\n\n3. Non-Functional Requirements (Scale, Latency SLO, Availability, Consistency):\n- ...',
    },
  },
  N: {
    id: 'N',
    shortTitle: { vi: 'Numbers', en: 'Numbers' },
    fullTitle: {
      vi: 'N — Numbers (Ước lượng Napkin Math)',
      en: 'N — Numbers (Napkin Math Estimation)',
    },
    budgetSec: 5 * 60,
    budgetDisplay: '05:00',
    goal: {
      vi: 'Tính nhẩm RPS đọc/ghi trung bình và đỉnh (×3), dung lượng lưu trữ theo ngày và 5 năm, băng thông mạng và RAM cho dữ liệu nóng (20%).',
      en: 'Estimate average and peak (×3) read/write RPS, daily and 5-year storage, network bandwidth, and 20% hot-set cache RAM.',
    },
    placeholder: {
      vi: 'Giả định đầu vào (DAU, tỷ lệ đọc:ghi, kích thước bản ghi):\n- ...\n\nLưu lượng (Avg / Peak RPS):\n- ...\n\nLưu trữ & Cache RAM:\n- ...\n\nKết luận định hướng kiến trúc từ con số:\n- ...',
      en: 'Input assumptions (DAU, read:write ratio, record size):\n- ...\n\nTraffic (Avg / Peak RPS):\n- ...\n\nStorage & Cache RAM:\n- ...\n\nArchitectural implications from these numbers:\n- ...',
    },
  },
  A: {
    id: 'A',
    shortTitle: { vi: 'API & Schema', en: 'API & Schema' },
    fullTitle: {
      vi: 'A — API & Data Schema (Hợp đồng giao tiếp & Dữ liệu)',
      en: 'A — API & Data Schema (Contracts & Data Model)',
    },
    budgetSec: 7 * 60,
    budgetDisplay: '07:00',
    goal: {
      vi: 'Định nghĩa các endpoint chính (tham số, phân trang cursor, idempotency, mã lỗi) cùng lược đồ bảng/khoá phân mảnh và chỉ mục cốt lõi.',
      en: 'Define primary API endpoints (parameters, cursor pagination, idempotency, status codes) alongside core tables, partition keys, and indexes.',
    },
    placeholder: {
      vi: '1. API Endpoints (REST / RPC / WebSocket):\n- POST /v1/...\n- GET /v1/...\n\n2. Data Schema & Loại Database:\n- Bảng / Collection chính, Primary Key, Partition/Shard Key, Index:\n- ...',
      en: '1. API Endpoints (REST / RPC / WebSocket):\n- POST /v1/...\n- GET /v1/...\n\n2. Data Schema & Storage Engine Choice:\n- Core tables/collections, Primary Key, Partition/Shard Key, Indexes:\n- ...',
    },
  },
  K: {
    id: 'K',
    shortTitle: { vi: 'Key Components', en: 'Key Components' },
    fullTitle: {
      vi: 'K — Key Components (Kiến trúc tổng thể)',
      en: 'K — Key Components (High-Level Architecture)',
    },
    budgetSec: 15 * 60,
    budgetDisplay: '15:00',
    goal: {
      vi: 'Phác thảo luồng đọc (Read Path) và luồng ghi (Write Path) đầu-cuối qua các thành phần chính: cân bằng tải, stateless app, cache, hàng đợi và tầng lưu trữ.',
      en: 'Lay out end-to-end Read Path and Write Path across load balancers, stateless services, caches, message queues, and persistent stores.',
    },
    placeholder: {
      vi: '1. Các thành phần chính trong kiến trúc:\n- Client -> ...\n\n2. Luồng Ghi (Write Path) từng bước:\n- ...\n\n3. Luồng Đọc (Read Path) từng bước:\n- ...',
      en: '1. Core Architectural Components:\n- Client -> ...\n\n2. Step-by-step Write Path:\n- ...\n\n3. Step-by-step Read Path:\n- ...',
    },
  },
  E: {
    id: 'E',
    shortTitle: { vi: 'Elaborate', en: 'Elaborate' },
    fullTitle: {
      vi: 'E — Elaborate (Điểm nghẽn, Lỗi & Đánh đổi)',
      en: 'E — Elaborate (Bottlenecks, Failures & Trade-offs)',
    },
    budgetSec: 13 * 60,
    budgetDisplay: '13:00',
    goal: {
      vi: 'Phân tích sâu điểm nghẽn dưới tải đỉnh, kịch bản lỗi thành phần (SPOF, hot key, mạng trễ, retry storm), bảo vệ quyết định đánh đổi và giám sát vận hành.',
      en: 'Examine peak-load bottlenecks, component failures (SPOFs, hot keys, network timeouts, retry storms), explicit trade-offs, and observability metrics.',
    },
    placeholder: {
      vi: '1. Điểm nghẽn lớn nhất khi tải tăng ×10 & cách mở rộng:\n- ...\n\n2. Xử lý sự cố (node hỏng, hot key, timeout, chống xử lý trùng):\n- ...\n\n3. Đánh đổi kiến trúc (Trade-offs) & Chỉ số giám sát (SLO/Alerts):\n- ...',
      en: '1. Primary bottleneck under 10× load spike & scaling plan:\n- ...\n\n2. Failure handling (node crash, hot keys, timeouts, deduplication):\n- ...\n\n3. Key Trade-offs & Production Observability (SLOs/Alerts):\n- ...',
    },
  },
};

export interface ArchComponentChip {
  id: string;
  label: string;
  category: 'edge' | 'compute' | 'cache' | 'messaging' | 'storage' | 'coordination';
  hint: BilingualText;
}

export const ARCH_COMPONENT_PALETTE: readonly ArchComponentChip[] = [
  {
    id: 'cdn-edge',
    label: 'CDN Edge',
    category: 'edge',
    hint: {
      vi: 'Phân phối nội dung tĩnh, đoạn video hoặc phản hồi cache công khai gần người dùng.',
      en: 'Serves static assets, video segments, or cacheable public responses near users.',
    },
  },
  {
    id: 'l7-lb',
    label: 'L7 Load Balancer',
    category: 'edge',
    hint: {
      vi: 'Chấm dứt TLS, kiểm tra health check và điều phối HTTP/gRPC tới cụm stateless.',
      en: 'Terminates TLS, runs health checks, and routes HTTP/gRPC traffic across stateless instances.',
    },
  },
  {
    id: 'api-gateway',
    label: 'API Gateway + Rate Limiter',
    category: 'edge',
    hint: {
      vi: 'Xác thực, kiểm tra hạn mức yêu cầu theo tenant/IP và định tuyến dịch vụ.',
      en: 'Handles authentication, per-tenant/IP rate limiting, and request routing.',
    },
  },
  {
    id: 'ws-gateway',
    label: 'WebSocket Gateway',
    category: 'compute',
    hint: {
      vi: 'Duy trì kết nối hai chiều thời gian thực cho chat, thông báo đẩy trực tiếp hoặc vị trí.',
      en: 'Maintains persistent bidirectional connections for real-time chat or live updates.',
    },
  },
  {
    id: 'redis-cache-aside',
    label: 'Redis Cache-Aside',
    category: 'cache',
    hint: {
      vi: 'Giảm tải đọc cho DB bằng bộ nhớ đệm kèm TTL jitter và singleflight chống stampede.',
      en: 'Offloads read traffic from primary storage using TTL jitter and singleflight protection.',
    },
  },
  {
    id: 'idempotency-store',
    label: 'Idempotency Store',
    category: 'coordination',
    hint: {
      vi: 'Lưu khóa luỹ đẳng và kết quả giao dịch để chặn thực thi lặp khi client retry.',
      en: 'Stores idempotency keys and outcomes so client retries never duplicate side effects.',
    },
  },
  {
    id: 'kafka-queue',
    label: 'Kafka Queue',
    category: 'messaging',
    hint: {
      vi: ' Tách rời producer và consumer, hấp thụ đỉnh tải ghi và phân vùng sự kiện theo key.',
      en: 'Decouples producers from consumers, buffers write spikes, and partitions events by key.',
    },
  },
  {
    id: 'priority-dlq',
    label: 'Priority Queue + DLQ',
    category: 'messaging',
    hint: {
      vi: 'Tách luồng ưu tiên cao (OTP/giao dịch) khỏi luồng hàng loạt và cô lập bản tin lỗi vào DLQ.',
      en: 'Separates critical traffic from bulk jobs and isolates poison messages in a dead-letter queue.',
    },
  },
  {
    id: 'worker-pool',
    label: 'Async Worker Pool',
    category: 'compute',
    hint: {
      vi: 'Xử lý nền các tác vụ tốn thời gian như fan-out feed, gửi thông báo hoặc transcode video.',
      en: 'Executes background workloads such as feed fan-out, provider delivery, or transcoding.',
    },
  },
  {
    id: 'pg-primary-replica',
    label: 'PostgreSQL Primary+Replica',
    category: 'storage',
    hint: {
      vi: 'Đảm bảo giao dịch ACID tại Primary và mở rộng tải đọc qua các Read Replicas.',
      en: 'Provides ACID transactions on Primary while scaling read queries via Read Replicas.',
    },
  },
  {
    id: 'consistent-hash-shards',
    label: 'Consistent Hash Shards',
    category: 'storage',
    hint: {
      vi: 'Phân tán khoá đều qua nhiều phân mảnh với virtual nodes, hạn chế xáo trộn khi thêm node.',
      en: 'Distributes keys across shards via virtual nodes with minimal remapping on resize.',
    },
  },
  {
    id: 'kv-wide-column',
    label: 'KV / Wide-Column Store',
    category: 'storage',
    hint: {
      vi: 'Tối ưu ghi tuần tự thông lượng cao và truy vấn theo partition + clustering key (như lịch sử chat).',
      en: 'Optimized for high write throughput and partition + clustering range scans (e.g. chat logs).',
    },
  },
  {
    id: 'object-storage',
    label: 'Object Storage (S3)',
    category: 'storage',
    hint: {
      vi: 'Lưu trữ đối tượng nhị phân lớn (ảnh, video gốc, bản mã hoá HLS) qua Presigned URL.',
      en: 'Stores large binary blobs (media, raw uploads, HLS segments) via presigned URLs.',
    },
  },
  {
    id: 'geo-index',
    label: 'Geohash / Quadtree Index',
    category: 'coordination',
    hint: {
      vi: 'Lập chỉ mục không gian trong bộ nhớ để truy vấn các thực thể lân cận theo bán kính.',
      en: 'Indexes 2D coordinates in memory for fast nearby-entity radius queries.',
    },
  },
  {
    id: 'prefix-trie',
    label: 'Prefix Trie Cache',
    category: 'cache',
    hint: {
      vi: 'Lưu sẵn danh sách top-K gợi ý tại mỗi nút tiền tố để trả lời trong vài mili-giây.',
      en: 'Precomputes top-K suggestions per prefix node for single-digit millisecond lookups.',
    },
  },
  {
    id: 'outbox-saga',
    label: 'Transactional Outbox',
    category: 'coordination',
    hint: {
      vi: 'Ghi dữ liệu nghiệp vụ và sự kiện trong cùng giao dịch DB để tránh mất thông điệp.',
      en: 'Persists state changes and outgoing events atomically in one local DB transaction.',
    },
  },
];

export interface HiddenAssumptionItem {
  id: string;
  topic: BilingualText;
  question: BilingualText;
  interviewerAnswer: BilingualText;
  designImpact: BilingualText;
}

export interface NapkinPreset {
  dau: number;
  readsPerUserPerDay: number;
  writesPerUserPerDay: number;
  payloadKb: number;
  retentionYears: number;
}

export interface ReferenceNumberItem {
  metric: BilingualText;
  value: string;
  formula: BilingualText;
}

export interface SnakeChecklistItem {
  id: string;
  text: BilingualText;
}

export interface InterviewRubricItem {
  id: string;
  stage: SnakeStageId;
  points: number;
  criterion: BilingualText;
  expectedDetail: BilingualText;
}

export interface ReferenceArchitecture {
  summary: BilingualText;
  writePath: BilingualText;
  readPath: BilingualText;
  tradeoffs: BilingualText[];
}

export interface InterviewPrompt {
  id: string;
  order: number;
  level: InterviewLevel;
  relatedModuleId: string;
  secondaryModuleIds: string[];
  title: BilingualText;
  scaleTag: BilingualText;
  openingBrief: BilingualText;
  hiddenAssumptions: HiddenAssumptionItem[];
  napkinPreset: NapkinPreset;
  referenceNumbers: ReferenceNumberItem[];
  snakeChecklist: Record<SnakeStageId, SnakeChecklistItem[]>;
  rubric: InterviewRubricItem[];
  recommendedComponents: string[];
  referenceArchitecture: ReferenceArchitecture;
}

export const INTERVIEW_PROMPTS: readonly InterviewPrompt[] = [
  // =========================================================================
  // 1. URL Shortener — S5-02 (Beginner)
  // =========================================================================
  {
    id: 'iv-url-shortener',
    order: 1,
    level: 'Beginner',
    relatedModuleId: 'S5-02',
    secondaryModuleIds: ['S0-05', 'S2-02', 'S3-05'],
    title: {
      vi: 'Thiết kế URL Shortener (100M URL mới/tháng)',
      en: 'Design a URL Shortener (100M New URLs/Month)',
    },
    scaleTag: {
      vi: '100M URL mới/tháng · Đọc:Ghi 100:1',
      en: '100M new URLs/mo · Read:Write 100:1',
    },
    openingBrief: {
      vi: 'Hãy thiết kế dịch vụ rút gọn liên kết tương tự bit.ly: người dùng gửi một URL dài và nhận về một URL ngắn để chia sẻ; khi ai đó mở URL ngắn, hệ thống chuyển hướng họ về địa chỉ gốc.',
      en: 'Design a link shortening service like bit.ly where users submit a long URL to get a short link, and visiting the short link redirects to the original destination.',
    },
    hiddenAssumptions: [
      {
        id: 'url-a1',
        topic: { vi: 'Tỷ lệ Đọc / Ghi & Đỉnh tải', en: 'Read/Write Ratio & Peak Traffic' },
        question: {
          vi: 'Tỷ lệ chuyển hướng (đọc) so với tạo link mới (ghi) là bao nhiêu và độ trễ mục tiêu là gì?',
          en: 'What is the redirect-to-creation ratio and target redirect latency?',
        },
        interviewerAnswer: {
          vi: 'Hệ thống thiên về đọc với tỷ lệ khoảng 100:1 (10 tỷ lượt chuyển hướng/tháng so với 100 triệu URL mới/tháng). Độ trễ chuyển hướng tại server cần đạt p99 < 20 ms.',
          en: 'Workload is heavily read-skewed at roughly 100:1 (10B redirects/month vs 100M new URLs/month). Server-side redirect latency should stay at p99 < 20 ms.',
        },
        designImpact: {
          vi: 'Bắt buộc đặt tầng Redis Cache-Aside trước cơ sở dữ liệu để hấp thụ 85–95% lượt đọc.',
          en: 'Requires a Redis Cache-Aside tier in front of storage to serve 85–95% of redirects.',
        },
      },
      {
        id: 'url-a2',
        topic: { vi: 'Độ dài mã & Custom Alias', en: 'Short Code Length & Custom Alias' },
        question: {
          vi: 'Mã rút gọn gồm những ký tự nào, có hỗ trợ người dùng tự đặt tên ngắn (custom alias) không?',
          en: 'Which character set is allowed in short codes, and do we support custom aliases?',
        },
        interviewerAnswer: {
          vi: 'Dùng bảng chữ cái Base62 [0-9a-zA-Z]. Hỗ trợ custom alias tối đa 16 ký tự nếu chưa tồn tại; link tự sinh càng ngắn càng tốt nhưng không va chạm trong tối thiểu 5–10 năm.',
          en: 'Use Base62 [0-9a-zA-Z]. Support optional custom aliases up to 16 chars if available; auto-generated codes should stay compact without collisions over 5–10 years.',
        },
        designImpact: {
          vi: '7 ký tự Base62 cho 62^7 ≈ 3,52 nghìn tỷ mã (đủ dùng hàng chục năm với 100M/tháng), sinh từ Snowflake/Range Counter thay vì cắt MD5 ngẫu nhiên dễ va chạm.',
          en: '7 Base62 chars yield 62^7 ≈ 3.52T combinations; generate via distributed range counter/Snowflake + Base62 rather than truncated hashes that collide.',
        },
      },
      {
        id: 'url-a3',
        topic: { vi: 'Mã chuyển hướng 301 hay 302', en: 'HTTP 301 vs 302 Redirect' },
        question: {
          vi: 'Sản phẩm có cần thống kê số lượt nhấp chuột và nguồn truy cập theo thời gian thực không?',
          en: 'Does the product require click analytics and referrer tracking?',
        },
        interviewerAnswer: {
          vi: 'Có, người tạo link cần xem biểu đồ lượt click theo giờ và quốc gia.',
          en: 'Yes, link creators need hourly click counts and geographic breakdown.',
        },
        designImpact: {
          vi: 'Dùng HTTP 302 (Temporary Redirect) để trình duyệt không lưu cứng vĩnh viễn như 301, đồng thời đẩy sự kiện click bất đồng bộ qua Kafka sang luồng thống kê.',
          en: 'Prefer HTTP 302 so browsers still hit our edge/service for click telemetry, emitting click events asynchronously to Kafka.',
        },
      },
      {
        id: 'url-a4',
        topic: { vi: 'Vòng đời lưu trữ & Tính sẵn sàng', en: 'Retention & Availability' },
        question: {
          vi: 'Link được giữ bao lâu và mức độ sẵn sàng yêu cầu là bao nhiêu?',
          en: 'How long are links retained and what availability target applies?',
        },
        interviewerAnswer: {
          vi: 'Mặc định giữ 5 năm (hoặc theo ngày hết hạn tuỳ chọn). Tính sẵn sàng mục tiêu 99,99% cho luồng chuyển hướng vì link hỏng ảnh hưởng mọi chiến dịch bên ngoài.',
          en: 'Default retention is 5 years (with optional custom expiration). Redirect path targets 99.99% availability.',
        },
        designImpact: {
          vi: 'Tổng dung lượng 5 năm chỉ khoảng ~3 TB nên dễ nhân bản đa vùng (Read Replicas); kiểm tra hết hạn ngay tại tầng đọc/cache.',
          en: '5-year dataset is ~3 TB, easily replicated across zones; enforce `expires_at` lazily on read plus background cleanup.',
        },
      },
    ],
    napkinPreset: {
      dau: 33_000_000,
      readsPerUserPerDay: 10,
      writesPerUserPerDay: 0.1,
      payloadKb: 0.5,
      retentionYears: 5,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Tốc độ tạo link (Write RPS)', en: 'Write RPS (New URLs)' },
        value: '≈ 39 RPS avg · ≈ 116 RPS peak',
        formula: {
          vi: '100M / (30 × 86.400) ≈ 38,6 ghi/giây; đỉnh ×3 ≈ 116 ghi/giây',
          en: '100M / (30 × 86,400) ≈ 38.6 writes/s; ×3 peak ≈ 116 writes/s',
        },
      },
      {
        metric: { vi: 'Tốc độ chuyển hướng (Read RPS)', en: 'Read RPS (Redirects)' },
        value: '≈ 3.860 RPS avg · ≈ 11.600 RPS peak',
        formula: {
          vi: 'Tỷ lệ 100:1 → 3.860 đọc/giây trung bình; đỉnh ×3 ≈ 11.580 đọc/giây',
          en: '100:1 read:write → ~3,860 reads/s avg; ×3 peak ≈ 11,580 reads/s',
        },
      },
      {
        metric: { vi: 'Lưu trữ 5 năm (6 tỷ bản ghi)', en: '5-Year Storage (6B records)' },
        value: '≈ 3,0 TB',
        formula: {
          vi: '100M × 12 tháng × 5 năm = 6 tỷ dòng × 500 B ≈ 3 TB',
          en: '100M × 12 mo × 5 yr = 6B rows × 500 B ≈ 3 TB',
        },
      },
      {
        metric: { vi: 'RAM Redis cho 20% link nóng', en: '20% Hot Cache RAM' },
        value: '≈ 33 GB',
        formula: {
          vi: '20% × 330M lượt đọc/ngày × 500 B ≈ 33 GB (nằm gọn trong 1–2 cụm Redis)',
          en: '20% × 330M daily reads × 500 B ≈ 33 GB (fits comfortably in Redis)',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'url-s1',
          text: {
            vi: 'Xác nhận hai luồng chính: rút gọn link (POST) và chuyển hướng (GET) cùng custom alias/TTL.',
            en: 'Confirm core flows: shorten URL (POST), redirect (GET), optional custom alias & TTL.',
          },
        },
        {
          id: 'url-s2',
          text: {
            vi: 'Làm rõ tỷ lệ đọc:ghi (100:1), mục tiêu p99 < 20 ms và ưu tiên tính sẵn sàng cao (AP) cho đọc.',
            en: 'Clarify 100:1 read:write skew, p99 < 20 ms redirect SLO, and high read availability.',
          },
        },
      ],
      N: [
        {
          id: 'url-n1',
          text: {
            vi: 'Tính RPS ghi (~40 avg / ~120 peak) và RPS đọc (~3.900 avg / ~12.000 peak).',
            en: 'Compute write RPS (~40 avg / ~120 peak) and read RPS (~3,900 avg / ~12,000 peak).',
          },
        },
        {
          id: 'url-n2',
          text: {
            vi: 'Chứng minh độ dài mã 7 ký tự Base62 (62^7 ≈ 3,52T > 6B URL trong 5 năm) và tính RAM cache (~33 GB).',
            en: 'Prove 7-char Base62 capacity (62^7 ≈ 3.52T > 6B URLs in 5 yrs) and size cache RAM (~33 GB).',
          },
        },
      ],
      A: [
        {
          id: 'url-a-c1',
          text: {
            vi: 'Định nghĩa POST /v1/urls (long_url, custom_alias?, expires_at?) và GET /{code} trả 301/302 + Location.',
            en: 'Define POST /v1/urls (long_url, custom_alias?, expires_at?) and GET /{code} returning 301/302 + Location.',
          },
        },
        {
          id: 'url-a-c2',
          text: {
            vi: 'Thiết kế bảng urls với short_code là khóa chính/khóa phân mảnh, kèm mã lỗi 404/410/409/429.',
            en: 'Specify `urls` schema keyed by `short_code` plus HTTP 404/410/409/429 error semantics.',
          },
        },
      ],
      K: [
        {
          id: 'url-k1',
          text: {
            vi: 'Tách luồng đọc (L7 LB -> Redirect Service -> Redis Cache-Aside -> DB Replica) và luồng ghi (Shorten Service -> ID Generator -> Primary DB).',
            en: 'Separate Read Path (L7 LB -> Redirect Service -> Redis -> DB) from Write Path (Shorten Service -> ID Generator -> Primary DB).',
          },
        },
        {
          id: 'url-k2',
          text: {
            vi: 'Giải thích cơ chế sinh mã không va chạm (Range Counter / Snowflake đổi sang Base62, có thể xáo bit tránh đoán tuần tự).',
            en: 'Detail collision-free short-code generation (Range Counter / Snowflake to Base62, optional bit shuffling).',
          },
        },
      ],
      E: [
        {
          id: 'url-e1',
          text: {
            vi: 'Phân tích đánh đổi HTTP 301 (giảm tải server, mất thống kê) so với 302 (giữ thống kê click qua Kafka).',
            en: 'Contrast HTTP 301 (browser caching, lost analytics) vs 302 (accurate click tracking via Kafka).',
          },
        },
        {
          id: 'url-e2',
          text: {
            vi: 'Xử lý hot link viral (cache cục bộ in-process / CDN ngắn hạn + singleflight) và quét mã không tồn tại (negative cache / Bloom filter).',
            en: 'Mitigate viral hot links (local in-memory cache + singleflight) and invalid-code scans (negative caching / Bloom filter).',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'url-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Xác định đúng phạm vi chức năng (tạo link, chuyển hướng, custom alias, hết hạn) và tách riêng phần analytics.',
          en: 'Scoped core features (shorten, redirect, custom alias, expiration) and separated analytics requirements.',
        },
        expectedDetail: {
          vi: 'Nêu rõ cái gì nằm trong và ngoài phạm vi thay vì tự nhảy vào thiết kế bảng ngay.',
          en: 'Explicitly separated core redirect path from secondary dashboard analytics.',
        },
      },
      {
        id: 'url-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Chốt yêu cầu phi chức năng: tỷ lệ đọc:ghi 100:1, p99 < 20 ms và ưu tiên tính sẵn sàng đọc.',
          en: 'Established non-functional targets: 100:1 read skew, p99 < 20 ms, and high read availability.',
        },
        expectedDetail: {
          vi: 'Nhận diện luồng đọc cần ưu tiên độ trễ thấp và sẵn sàng cao hơn luồng tạo link.',
          en: 'Identified that redirect path is latency- and availability-critical.',
        },
      },
      {
        id: 'url-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng bậc độ lớn RPS đọc/ghi trung bình và đỉnh (~40/120 ghi/s, ~3.900/12.000 đọc/s).',
          en: 'Computed order-of-magnitude avg/peak RPS (~40/120 writes/s, ~3.9K/12K reads/s).',
        },
        expectedDetail: {
          vi: 'Từ ~40 ghi/s rút ra 1 Primary DB dư sức chịu ghi, điểm cần tối ưu là 12.000 đọc/s ở đỉnh.',
          en: 'Concluded that write load fits a single primary easily while peak read load drives caching.',
        },
      },
      {
        id: 'url-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Chứng minh không gian mã 62^7 ≈ 3,52T và ước lượng lưu trữ 5 năm (~3 TB), RAM cache (~33 GB).',
          en: 'Justified 7-char Base62 keyspace (3.52T) and estimated 5-year storage (~3 TB) & cache RAM (~33 GB).',
        },
        expectedDetail: {
          vi: 'Không chọn mã quá ngắn (5 ký tự chỉ ~916M sẽ cạn) hoặc quá dài không cần thiết.',
          en: 'Showed why 6 chars is tight at multi-billion scale while 7 chars provides ample headroom.',
        },
      },
      {
        id: 'url-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Thiết kế API rõ ràng cho POST tạo link và GET chuyển hướng kèm mã trạng thái chuẩn (301/302, 404, 409, 410, 429).',
          en: 'Defined clean POST creation and GET redirect contracts with proper HTTP status codes (301/302, 404, 409, 410, 429).',
        },
        expectedDetail: {
          vi: '409 Conflict khi trùng custom alias, 410 Gone hoặc 404 khi link hết hạn, Rate Limit chống spam tạo link.',
          en: 'Handled custom alias collision (409), expired URLs (404/410), and abuse rate limiting (429).',
        },
      },
      {
        id: 'url-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Lược đồ dữ liệu tối giản với `short_code` làm khóa tra cứu O(1) không cần JOIN.',
          en: 'Designed minimal schema indexed/partitioned on `short_code` for O(1) point lookups without JOINs.',
        },
        expectedDetail: {
          vi: 'Các cột chính: short_code (PK), long_url, created_at, expires_at, creator_id.',
          en: 'Included short_code PK, long_url, created_at, expires_at, and optional user_id.',
        },
      },
      {
        id: 'url-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Cơ chế sinh mã duy nhất không va chạm (Snowflake hoặc Range Ticket Server đổi Base62, có Ràng buộc UNIQUE cho custom alias).',
          en: 'Specified collision-free ID generation (Snowflake or Range Counter + Base62) and unique constraint for custom aliases.',
        },
        expectedDetail: {
          vi: 'Giải thích vì sao băm MD5/SHA256 cắt 7 ký tự cần vòng lặp kiểm tra va chạm vào DB.',
          en: 'Explained why pre-allocated ranges/Snowflake avoid extra DB round-trips compared to truncated hashes.',
        },
      },
      {
        id: 'url-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Luồng đọc dùng Redis Cache-Aside đạt hit ratio cao và đẩy sự kiện click bất đồng bộ qua hàng đợi.',
          en: 'Designed Redis Cache-Aside read path and decoupled click analytics via an async message queue.',
        },
        expectedDetail: {
          vi: 'Tuyệt đối không ghi đồng bộ lượt click vào bảng SQL trên mỗi lần chuyển hướng.',
          en: 'Avoided synchronous DB counter updates on the critical redirect path.',
        },
      },
      {
        id: 'url-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Phân vùng dữ liệu hợp lý (Consistent Hashing theo `short_code` hoặc Primary + Read Replicas) không có SPOF.',
          en: 'Eliminated SPOFs across LB, stateless services, cache cluster, and replicated/sharded storage.',
        },
        expectedDetail: {
          vi: 'Shard theo `short_code` phân phối đều vì chỉ truy vấn điểm theo đúng mã rút gọn.',
          en: 'Sharding by `short_code` distributes evenly since queries are pure key lookups.',
        },
      },
      {
        id: 'url-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Nêu rõ đánh đổi giữa HTTP 301 và HTTP 302 đối với tải hệ thống và độ chính xác analytics.',
          en: 'Articulated the HTTP 301 vs 302 trade-off between server load and click analytics fidelity.',
        },
        expectedDetail: {
          vi: '301 cho phép trình duyệt cache cục bộ nhưng làm thiếu số liệu lượt click lặp lại; 302 đi qua server để ghi nhận sự kiện.',
          en: '301 offloads repeat hits to browser cache at the cost of visibility; 302 preserves click telemetry.',
        },
      },
      {
        id: 'url-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý vấn đề đoán tuần tự ID (xáo hoán vị bit / Feistel cipher trước khi mã hoá Base62) và kiểm tra URL độc hại.',
          en: 'Addressed sequential ID enumeration (bit permutation/Feistel before Base62) and malicious URL filtering.',
        },
        expectedDetail: {
          vi: 'Counter tăng dần nếu đổi thẳng sang Base62 sẽ lộ số lượng link và cho phép cào tuần tự.',
          en: 'Raw monotonic counters leak volume and allow scraping unless obfuscated.',
        },
      },
      {
        id: 'url-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Chống cache stampede cho link người nổi tiếng (singleflight + local L1 cache ngắn) và chống quét mã rác (negative cache).',
          en: 'Protected DB against hot-key stampedes (singleflight + short L1 cache) and random-code scanning (negative cache).',
        },
        expectedDetail: {
          vi: 'Cache ngắn kết quả "không tồn tại" (TTL 30–60s) để chặn truy vấn ngẫu nhiên xuyên thẳng xuống DB.',
          en: 'Short-TTL negative cache entries prevent missing-key floods from saturating storage.',
        },
      },
    ],
    recommendedComponents: [
      'l7-lb',
      'api-gateway',
      'redis-cache-aside',
      'kafka-queue',
      'pg-primary-replica',
      'consistent-hash-shards',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Kiến trúc tách biệt dịch vụ Tạo link và Chuyển hướng phía sau L7 Load Balancer & API Gateway. Dịch vụ Tạo link cấp phát ID 64-bit theo lô (Range Counter hoặc Snowflake), hoán vị bit rồi đổi sang 7 ký tự Base62 và lưu vào KV/PostgreSQL phân mảnh theo `short_code`. Dịch vụ Chuyển hướng tra cứu L1 in-memory cache (TTL 5s cho hot key) -> Redis Cache-Aside -> DB Replica, trả mã 302 và gửi sự kiện click bất đồng bộ vào Kafka.',
        en: 'Splits Shorten and Redirect services behind an L7 Load Balancer & API Gateway. Shorten Service allocates 64-bit IDs in batches (Range Counter or Snowflake), obfuscates bits into 7-char Base62, and writes to `short_code`-sharded PostgreSQL/KV storage. Redirect Service checks short L1 local cache -> Redis Cache-Aside -> DB Replica, returns HTTP 302, and emits click telemetry asynchronously to Kafka.',
      },
      writePath: {
        vi: 'Client -> API Gateway (Rate Limit) -> Shorten Service -> Lấy ID từ lô bộ đếm trong RAM -> Hoán vị bit & mã hoá Base62 -> Ghi Primary DB (`UNIQUE(short_code)`) -> Ấm hoá Redis (tuỳ chọn) -> Trả 201 Created.',
        en: 'Client -> API Gateway (Rate Limit) -> Shorten Service -> Pop ID from in-memory range batch -> Permute & Base62 encode -> Insert into Primary DB (`UNIQUE(short_code)`) -> Return 201 Created.',
      },
      readPath: {
        vi: 'Client GET /{code} -> L7 LB -> Redirect Service -> Kiểm tra L1/Redis Cache (nếu miss dùng singleflight đọc DB Replica & nạp lại cache, kiểm tra `expires_at`) -> Đẩy sự kiện click không chặn vào Kafka -> Trả 302 Location.',
        en: 'Client GET /{code} -> L7 LB -> Redirect Service -> Lookup L1/Redis Cache (on miss, singleflight query to DB Replica, populate cache, verify `expires_at`) -> Non-blocking Kafka click event -> Return 302 Location.',
      },
      tradeoffs: [
        {
          vi: 'Counter theo lô + Base62 so với cắt Hash MD5: không lo va chạm khi dữ liệu lớn, không cần đọc DB kiểm tra trước, chỉ cần hoán vị bit để tránh đoán tuần tự.',
          en: 'Range Counter + Base62 vs truncated MD5: zero collision retries as dataset grows, needing only lightweight bit permutation to prevent enumeration.',
        },
        {
          vi: 'HTTP 302 so với 301: tốn thêm lưu lượng đọc tại tầng edge/cache nhưng giữ trọn vẹn dữ liệu phân tích lượt nhấp cho người tạo link.',
          en: 'HTTP 302 vs 301: higher request volume at cache tier in exchange for accurate click analytics and ability to deactivate malicious links.',
        },
      ],
    },
  },

  // =========================================================================
  // 2. Social News Feed — S5-03 (Mid)
  // =========================================================================
  {
    id: 'iv-news-feed',
    order: 2,
    level: 'Mid',
    relatedModuleId: 'S5-03',
    secondaryModuleIds: ['S2-02', 'S2-04', 'S2-09'],
    title: {
      vi: 'Thiết kế News Feed mạng xã hội (50M DAU)',
      en: 'Design a Social Network News Feed (50M DAU)',
    },
    scaleTag: {
      vi: '50M DAU · Hybrid Fan-out · Celebrity Key',
      en: '50M DAU · Hybrid Fan-out · Celebrity Key',
    },
    openingBrief: {
      vi: 'Thiết kế hệ thống bảng tin (News Feed) cho một mạng xã hội: người dùng đăng bài viết (văn bản kèm ảnh) và mở ứng dụng để xem dòng thời gian tổng hợp từ những tài khoản họ đang theo dõi.',
      en: 'Design the home timeline (News Feed) for a social network where users publish posts (text and images) and open the app to view updates from accounts they follow.',
    },
    hiddenAssumptions: [
      {
        id: 'feed-a1',
        topic: { vi: 'Đồ thị theo dõi & Tài khoản nổi tiếng', en: 'Social Graph & Celebrity Accounts' },
        question: {
          vi: 'Trung bình một người theo dõi bao nhiêu tài khoản và phân phối số người theo dõi lệch đến mức nào?',
          en: 'How many accounts does an average user follow, and how skewed is the follower distribution?',
        },
        interviewerAnswer: {
          vi: 'Người dùng thông thường theo dõi trung bình 200 tài khoản, nhưng có hàng nghìn tài khoản nổi tiếng (celebrity) sở hữu từ 1 triệu đến 50 triệu người theo dõi.',
          en: 'Typical users follow ~200 accounts on average, while celebrity accounts can have 1M to 50M followers.',
        },
        designImpact: {
          vi: 'Fan-out on write thuần tuý sẽ tạo 50M tác vụ ghi cho 1 bài đăng của celebrity (chậm hàng chục phút); bắt buộc dùng mô hình Hybrid Fan-out.',
          en: 'Pure fan-out-on-write amplifies a single celebrity post into 50M cache writes; requires a Hybrid Fan-out architecture.',
        },
      },
      {
        id: 'feed-a2',
        topic: { vi: 'Độ trễ mở trang & Tính nhất quán', en: 'Feed Read Latency & Consistency' },
        question: {
          vi: 'Độ trễ mục tiêu khi tải bảng tin và thời gian tối đa để người theo dõi thấy bài mới là bao lâu?',
          en: 'What is the target timeline load latency and acceptable propagation delay for new posts?',
        },
        interviewerAnswer: {
          vi: 'Tải 20 bài đầu tiên của bảng tin cần đạt p99 < 200 ms. Cho phép nhất quán cuối cùng (eventual consistency): bài mới hiển thị cho người theo dõi trong vòng dưới 5 giây.',
          en: 'Loading the top 20 feed items requires p99 < 200 ms. Eventual consistency within ~5 seconds for followers is acceptable (with read-your-own-writes for the author).',
        },
        designImpact: {
          vi: 'Chuẩn bị sẵn danh sách ID bài viết trong Redis cho phần lớn người dùng và đảm bảo tác giả thấy ngay bài của chính mình.',
          en: 'Precompute post ID lists in Redis for standard followings and merge author/celebrity posts at read time.',
        },
      },
      {
        id: 'feed-a3',
        topic: { vi: 'Thứ tự hiển thị & Media đính kèm', en: 'Feed Ordering & Media Attachments' },
        question: {
          vi: 'Bảng tin sắp xếp theo thời gian ngược hay có bước chấm điểm xếp hạng? Ảnh được tải lên thế nào?',
          en: 'Is the feed reverse-chronological or ranked, and how are media files handled?',
        },
        interviewerAnswer: {
          vi: 'Bắt đầu với thứ tự thời gian ngược (nhưng kiến trúc mở để cắm tầng chấm điểm nhẹ trên tập ứng viên ~200 bài). Ảnh tải trực tiếp lên Object Storage và phân phối qua CDN.',
          en: 'Start with reverse-chronological ordering while keeping room for a lightweight ranker over ~200 candidate IDs. Images upload via Object Storage + CDN.',
        },
        designImpact: {
          vi: 'Feed Cache chỉ lưu mảng mỏng `(post_id, author_id, score/ts)` giới hạn 500–800 mục mỗi người dùng, tuyệt đối không sao chép toàn bộ nội dung bài viết.',
          en: 'Timeline cache stores compact `(post_id, author_id)` tuples capped at ~500–800 items per active user, hydrating post/user bodies from separate caches.',
        },
      },
    ],
    napkinPreset: {
      dau: 50_000_000,
      readsPerUserPerDay: 15,
      writesPerUserPerDay: 1,
      payloadKb: 1.5,
      retentionYears: 5,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Lưu lượng mở Feed (Read RPS)', en: 'Timeline Read RPS' },
        value: '≈ 8.680 RPS avg · ≈ 26.000 RPS peak',
        formula: {
          vi: '50M DAU × 15 lần mở/ngày / 86.400 ≈ 8.680 đọc/giây (đỉnh ×3 ≈ 26.000 RPS)',
          en: '50M DAU × 15 opens/day / 86,400 ≈ 8,680 reads/s (×3 peak ≈ 26,000 RPS)',
        },
      },
      {
        metric: { vi: 'Lưu lượng đăng bài & Hệ số Fan-out', en: 'Post Write RPS & Fan-out Ops' },
        value: '≈ 580 bài/s · ≈ 116.000 ghi hộp thư/s',
        formula: {
          vi: '50M bài/ngày ≈ 580 bài/giây; nhân trung bình 200 follower ≈ 116.000 phép chèn Redis/giây',
          en: '50M posts/day ≈ 580 posts/s; ×200 avg followers ≈ 116,000 inbox cache inserts/s',
        },
      },
      {
        metric: { vi: 'RAM cho Feed Inbox Cache (50M người dùng hoạt động)', en: 'Feed Inbox Cache RAM' },
        value: '≈ 400 GB',
        formula: {
          vi: '50M DAU × 500 ID gần nhất × 16 B ≈ 400 GB (chia trên cụm Redis Shards)',
          en: '50M active users × 500 recent IDs × 16 B ≈ 400 GB across sharded Redis',
        },
      },
      {
        metric: { vi: 'Lưu trữ Metadata bài viết 5 năm', en: '5-Year Post Metadata Storage' },
        value: '≈ 137 TB (chưa tính ảnh trên S3)',
        formula: {
          vi: '50M bài/ngày × 1,5 KB ≈ 75 GB/ngày × 365 × 5 ≈ 137 TB',
          en: '50M posts/day × 1.5 KB ≈ 75 GB/day × 365 × 5 ≈ 137 TB',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'feed-s1',
          text: {
            vi: 'Làm rõ quy mô 50M DAU, số người theo dõi trung bình (200) và sự tồn tại của tài khoản celebrity (> 50.000–1M follower).',
            en: 'Clarify 50M DAU, 200 average followings, and celebrity accounts (> 50K–1M followers).',
          },
        },
        {
          id: 'feed-s2',
          text: {
            vi: 'Chốt p99 tải feed < 200 ms, độ trễ lan truyền bài mới < 5 s và tách riêng luồng upload media sang S3/CDN.',
            en: 'Agree on p99 < 200 ms feed read SLO, < 5 s propagation delay, and direct S3/CDN media handling.',
          },
        },
      ],
      N: [
        {
          id: 'feed-n1',
          text: {
            vi: 'So bằng số vì sao Fan-out on Read thuần tuý gây quá tải (26.000 RPS × 200 truy vấn = 5,2 triệu lookup/giây).',
            en: 'Quantify why pure fan-out-on-read struggles at peak (26K RPS × 200 followees = 5.2M lookups/s).',
          },
        },
        {
          id: 'feed-n2',
          text: {
            vi: 'Tính thông lượng Fan-out on Write (~116K ghi/s cho tài khoản thường) và kích thước Feed Inbox Cache (~400 GB).',
            en: 'Estimate fan-out-on-write rate (~116K cache ops/s) and size the Feed Inbox Redis tier (~400 GB).',
          },
        },
      ],
      A: [
        {
          id: 'feed-a-c1',
          text: {
            vi: 'Thiết kế GET /v1/feed?cursor=...&limit=20 dùng Cursor Pagination (Snowflake ID) thay cho OFFSET.',
            en: 'Specify GET /v1/feed?cursor=...&limit=20 using Snowflake cursor pagination rather than OFFSET.',
          },
        },
        {
          id: 'feed-a-c2',
          text: {
            vi: 'Định nghĩa bảng Posts (shard theo post_id/author_id) và đồ thị Follows hai chiều (follower->followee & followee->follower).',
            en: 'Define `posts` schema and bidirectional `follows` indexes (who I follow + my followers).',
          },
        },
      ],
      K: [
        {
          id: 'feed-k1',
          text: {
            vi: 'Trình bày mô hình Hybrid Fan-out: đẩy qua Kafka + Fan-out Workers cho tài khoản thường, kéo lúc đọc cho tài khoản celebrity.',
            en: 'Detail Hybrid Fan-out: push via Kafka + Fan-out Workers for normal users, pull-on-read merge for celebrities.',
          },
        },
        {
          id: 'feed-k2',
          text: {
            vi: 'Tách Timeline Inbox Cache (chỉ chứa post_id) khỏi Post Cache và User Profile Cache (hydration bước cuối).',
            en: 'Store only lightweight post IDs in Timeline Inbox Cache and hydrate full objects from Post/User caches.',
          },
        },
      ],
      E: [
        {
          id: 'feed-e1',
          text: {
            vi: 'Tối ưu chi phí bộ nhớ: chỉ đẩy fan-out vào hộp thư của người dùng hoạt động gần đây (active trong 7–14 ngày).',
            en: 'Optimize RAM by skipping fan-out writes to inactive users (rebuild lazily when dormant users return).',
          },
        },
        {
          id: 'feed-e2',
          text: {
            vi: 'Xử lý bài đăng viral bị đọc dồn (hot key trên Post Cache), xoá bài/unfollow và đảm bảo read-your-own-writes cho người đăng.',
            en: 'Handle hot post keys (L1 cache/replicas), post deletion/unfollow filtering, and author read-your-writes.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'feed-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Phát hiện sớm sự chênh lệch phân phối người theo dõi (tài khoản thường so với celebrity hàng chục triệu follower).',
          en: 'Uncovered follower skew (regular accounts vs multi-million-follower celebrities) during Scoping.',
        },
        expectedDetail: {
          vi: 'Đây là ràng buộc quyết định toàn bộ kiến trúc Hybrid Fan-out.',
          en: 'Follower skew is the single constraint that invalidates naive push-only or pull-only designs.',
        },
      },
      {
        id: 'feed-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Chốt SLO đọc p99 < 200 ms, chấp nhận eventual consistency cho người theo dõi nhưng đảm bảo người đăng thấy bài ngay.',
          en: 'Defined p99 < 200 ms read SLO, eventual consistency for followers, and immediate visibility for the author.',
        },
        expectedDetail: {
          vi: 'Phân biệt rõ yêu cầu nhất quán của tác giả và của người xem khác.',
          en: 'Distinguished author read-your-writes from follower timeline eventual consistency.',
        },
      },
      {
        id: 'feed-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Định lượng cả lưu lượng đọc Feed (~26K peak RPS) lẫn hệ số nhân ghi Fan-out (~116K phép chèn/giây).',
          en: 'Quantified both peak timeline read RPS (~26K) and fan-out write amplification (~116K ops/s).',
        },
        expectedDetail: {
          vi: 'Dùng con số để bác bỏ giải pháp JOIN bảng bài viết trực tiếp mỗi khi người dùng mở trang.',
          en: 'Used math to rule out multi-shard SQL JOINs on every timeline load.',
        },
      },
      {
        id: 'feed-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Tính dung lượng Feed Cache bằng cách chỉ lưu danh sách ID giới hạn chiều dài (~500 ID × 16 B) thay vì lưu nguyên bài.',
          en: 'Sized timeline cache realistically by storing bounded ID lists (~500 IDs × 16 B) rather than full payloads.',
        },
        expectedDetail: {
          vi: 'Giúp giảm dung lượng RAM từ hàng chục TB xuống vài trăm GB.',
          en: 'Storing IDs instead of full JSON reduces RAM footprint by ~50–100×.',
        },
      },
      {
        id: 'feed-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Sử dụng Cursor Pagination dựa trên Snowflake `post_id` (sắp xếp theo thời gian) thay cho `OFFSET/LIMIT`.',
          en: 'Used Snowflake `post_id` cursor pagination instead of `OFFSET/LIMIT`.',
        },
        expectedDetail: {
          vi: 'Tránh bị lặp hoặc sót bài khi có bài viết mới chèn vào đầu danh sách trong lúc người dùng cuộn trang.',
          en: 'Prevents duplicate/skipped items when new posts arrive while scrolling.',
        },
      },
      {
        id: 'feed-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Thiết kế mô hình dữ liệu tách biệt `Posts`, `Users`, và `Follows` (tra cứu nhanh cả hai chiều).',
          en: 'Modeled `Posts`, `Users`, and bidirectional `Follows` lookup tables cleanly.',
        },
        expectedDetail: {
          vi: 'Fan-out Worker cần danh sách follower của A; luồng Pull celebrity cần danh sách celebrity mà U đang theo dõi.',
          en: 'Push workers query followers-of-author; pull merge queries celebrities-followed-by-viewer.',
        },
      },
      {
        id: 'feed-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Thiết kế chuẩn xác kiến trúc Hybrid Fan-out (Push cho tài khoản dưới ngưỡng ~50K follower, Pull-and-merge cho celebrity).',
          en: 'Designed a complete Hybrid Fan-out pipeline (push below follower threshold, pull-and-merge for celebrities).',
        },
        expectedDetail: {
          vi: 'Hợp nhất K danh sách đã sắp xếp (k-way merge theo Snowflake ID) tại Feed Service rất nhẹ trên CPU.',
          en: 'Feed Service performs a fast in-memory k-way merge of pre-pushed inbox IDs and celebrity author caches.',
        },
      },
      {
        id: 'feed-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tách luồng ghi bài và phát tán hộp thư qua Kafka + Async Fan-out Workers để API đăng bài phản hồi nhanh.',
          en: 'Decoupled post creation from inbox fan-out via Kafka and horizontally scalable Fan-out Workers.',
        },
        expectedDetail: {
          vi: 'API POST /posts trả về ngay sau khi lưu Post DB & Post Cache, không bắt người đăng chờ fan-out.',
          en: 'POST /posts returns immediately after durable write; workers batch Redis ZADD/LPUSH calls.',
        },
      },
      {
        id: 'feed-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Bước Hydration đọc lô (multi-get `MGET`) từ Post Cache và User Cache kèm tải media trực tiếp từ CDN.',
          en: 'Hydrated feed items via batched `MGET` against Post/User caches with media served via CDN + Object Storage.',
        },
        expectedDetail: {
          vi: 'Tránh lỗi N+1 query khi dựng 20 thẻ bài viết trên một trang.',
          en: 'Batched cache hydration avoids N+1 round-trips per page of 20 posts.',
        },
      },
      {
        id: 'feed-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Không lãng phí RAM/ghi vô ích cho người dùng không hoạt động (chỉ push vào inbox của active users).',
          en: 'Skipped fan-out writes for inactive users, rebuilding timelines on demand upon login.',
        },
        expectedDetail: {
          vi: 'Nếu hệ thống có 500M tổng tài khoản nhưng 50M DAU, lọc active giảm 90% chi phí ghi và RAM.',
          en: 'Filtering out dormant accounts cuts fan-out work and memory consumption dramatically.',
        },
      },
      {
        id: 'feed-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Giải quyết hot key trên Post Cache khi một bài của celebrity được hàng triệu người mở cùng lúc.',
          en: 'Mitigated hot-key contention on Post/Author caches during viral spikes.',
        },
        expectedDetail: {
          vi: 'Dùng L1 in-process cache ngắn hạn (2–5 giây) tại các instance Feed Service hoặc nhân bản key có hậu tố.',
          en: 'Short-TTL in-process L1 cache or replicated cache keys absorb millions of reads per second.',
        },
      },
      {
        id: 'feed-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý đúng bài bị xoá, tài khoản bị chặn/huỷ theo dõi lúc Hydration thay vì quét sửa hàng triệu hộp thư.',
          en: 'Filtered deleted posts, blocks, and unfollows lazily during read hydration.',
        },
        expectedDetail: {
          vi: 'Kiểm tra cờ `deleted` trên Post Cache và tập `blocked/following` lúc đọc tiết kiệm hàng triệu phép xoá.',
          en: 'Lazy read-time filtering avoids expensive synchronous fan-out deletes across millions of inboxes.',
        },
      },
    ],
    recommendedComponents: [
      'cdn-edge',
      'l7-lb',
      'api-gateway',
      'redis-cache-aside',
      'kafka-queue',
      'worker-pool',
      'consistent-hash-shards',
      'object-storage',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Áp dụng mô hình Hybrid Fan-out. Khi đăng bài, Post Service lưu bài vào DB phân mảnh + Post Cache rồi phát sự kiện lên Kafka. Nếu tác giả có dưới 50.000 follower, Fan-out Workers đẩy `post_id` vào danh sách giới hạn 500 mục trên Redis Inbox của các follower hoạt động gần đây; nếu là celebrity, chỉ ghi vào danh sách bài của riêng tác giả đó. Khi mở bảng tin, Feed Service đọc Inbox của người xem, hợp nhất (k-way merge) với bài mới của các celebrity mà họ theo dõi, sau đó gọi `MGET` tới Post/User Cache để dựng nội dung hoàn chỉnh.',
        en: 'Uses a Hybrid Fan-out architecture. Post Service persists posts to sharded storage + Post Cache and publishes to Kafka. For authors under ~50K followers, Fan-out Workers push `post_id` into bounded (500-item) Redis Inbox lists of recently active followers; celebrity posts are written only to the celebrity’s own outbox list. On read, Feed Service merges the viewer’s Inbox with followed celebrity outboxes via k-way merge on Snowflake IDs, then hydrates full objects via batched `MGET` from Post and User caches.',
      },
      writePath: {
        vi: 'Media tải thẳng lên Object Storage qua Presigned URL -> POST /v1/posts -> Lưu DB + Post Cache -> Phát sự kiện Kafka -> Fan-out Workers kiểm tra ngưỡng follower: nếu thường thì pipelining ZADD vào Inbox của active followers; nếu celebrity thì bỏ qua fan-out rộng.',
        en: 'Media uploads directly to Object Storage via Presigned URL -> POST /v1/posts -> Write Post DB + Post Cache -> Emit Kafka event -> Fan-out Workers check follower count: push `post_id` to active follower Redis Inboxes for normal accounts; skip mass push for celebrities.',
      },
      readPath: {
        vi: 'GET /v1/feed?cursor=... -> Feed Service lấy Inbox IDs từ Redis + lấy danh sách celebrity đang theo dõi và đọc Outbox IDs của họ -> K-way merge + cắt trang 20 ID -> `MGET` Post Cache & User Cache (lọc bài xoá/chặn) -> Trả JSON kèm ảnh CDN.',
        en: 'GET /v1/feed?cursor=... -> Read viewer Redis Inbox + fetch followed celebrity Outbox lists -> K-way merge & slice 20 IDs -> Batched `MGET` from Post/User caches (filtering deleted/blocked) -> Return JSON with CDN media URLs.',
      },
      tradeoffs: [
        {
          vi: 'Hybrid Fan-out cân bằng độ trễ đọc và độ trễ ghi: giữ 99% công việc chuẩn bị sẵn cho tài khoản thường nhưng triệt tiêu đỉnh khuếch đại ghi của celebrity.',
          en: 'Hybrid Fan-out balances read latency against write amplification: precomputing normal feeds while avoiding multi-million-write stalls on celebrity posts.',
        },
        {
          vi: 'Lưu ID mỏng trong Inbox thay vì toàn bộ bài viết: giảm ~50 lần RAM và giúp cập nhật lượt thích/sửa bài phản ánh ngay ở bước Hydration.',
          en: 'Storing IDs only in Inbox caches cuts RAM ~50× and ensures edits/like counts stay fresh during hydration.',
        },
      ],
    },
  },

  // =========================================================================
  // 3. Real-time Chat 1-1 & Group — S7-01 (Mid)
  // =========================================================================
  {
    id: 'iv-realtime-chat',
    order: 3,
    level: 'Mid',
    relatedModuleId: 'S7-01',
    secondaryModuleIds: ['S4-09', 'S3-05', 'S4-11'],
    title: {
      vi: 'Thiết kế Hệ thống Chat thời gian thực 1-1 & Group',
      en: 'Design a Real-Time 1-1 & Group Chat System',
    },
    scaleTag: {
      vi: '20M kết nối WebSocket · 23K tin/giây',
      en: '20M concurrent sockets · 23K msgs/s',
    },
    openingBrief: {
      vi: 'Thiết kế hệ thống nhắn tin thời gian thực hỗ trợ trò chuyện cá nhân 1-1 và trò chuyện nhóm trên cả điện thoại lẫn máy tính.',
      en: 'Design a real-time messaging application supporting both 1-on-1 conversations and group chats across mobile and web clients.',
    },
    hiddenAssumptions: [
      {
        id: 'chat-a1',
        topic: { vi: 'Số kết nối đồng thời & Kích thước nhóm', en: 'Concurrent Connections & Max Group Size' },
        question: {
          vi: 'Quy mô người dùng kết nối cùng lúc và số thành viên tối đa của một nhóm chat là bao nhiêu?',
          en: 'How many concurrent online users do we support, and what is the maximum group size?',
        },
        interviewerAnswer: {
          vi: '50M DAU với khoảng 20 triệu kết nối đồng thời lúc cao điểm. Nhóm chat giới hạn tối đa 200 thành viên (không phải phòng livestream công cộng hàng trăm nghìn người).',
          en: '50M DAU with ~20M peak concurrent connections. Group chats cap at 200 members (distinct from public livestream chatrooms).',
        },
        designImpact: {
          vi: 'Với nhóm ≤ 200 người, có thể fan-out theo từng thành viên qua hộp thư/session registry; 20M socket đòi hỏi hàng trăm máy WebSocket Gateway giữ trạng thái kết nối.',
          en: 'Groups ≤ 200 members allow per-recipient routing via Session Registry; 20M open sockets require hundreds of stateful WebSocket Gateways.',
        },
      },
      {
        id: 'chat-a2',
        topic: { vi: 'Lưu trữ lịch sử, Đa thiết bị & Offline', en: 'Message Persistence, Multi-Device & Offline' },
        question: {
          vi: 'Hệ thống lưu lịch sử tin nhắn trên máy chủ hay chỉ chuyển tiếp rồi xoá? Một tài khoản đăng nhập mấy thiết bị?',
          en: 'Do we store chat history server-side for multi-device sync, or only relay transiently?',
        },
        interviewerAnswer: {
          vi: 'Lưu trữ lâu dài trên máy chủ (tối thiểu 5 năm), hỗ trợ tối đa 5 thiết bị đồng bộ trên một tài khoản, có trạng thái Đã gửi / Đã nhận / Đã xem và gửi Push Notification khi ngoại tuyến.',
          en: 'Persist chat history server-side (5+ years), sync up to 5 devices per user, track Sent/Delivered/Read receipts, and trigger Push Notifications when offline.',
        },
        designImpact: {
          vi: 'Mỗi thiết bị giữ con trỏ `last_synced_seq` để kéo bù các tin nhắn bị lỡ sau khi kết nối lại.',
          en: 'Each device tracks `last_synced_seq` per conversation to catch up deterministically on reconnect.',
        },
      },
      {
        id: 'chat-a3',
        topic: { vi: 'Độ trễ chuyển tin & Trạng thái Online', en: 'Delivery Latency & Presence' },
        question: {
          vi: 'Độ trễ mục tiêu từ lúc bấm gửi tới lúc máy người nhận hiển thị và yêu cầu hiển thị chấm xanh Online ra sao?',
          en: 'What is the end-to-end delivery latency target and online presence accuracy?',
        },
        interviewerAnswer: {
          vi: 'Khi người nhận trực tuyến, tin nhắn cần tới trong p99 < 150 ms. Chấm trạng thái Online cho phép trễ 10–30 giây dựa trên heartbeat để không gây bão cập nhật.',
          en: 'Online delivery targets p99 < 150 ms. Presence indicators tolerate 10–30 s heartbeat granularity to avoid fan-out storms.',
        },
        designImpact: {
          vi: 'Không phát quảng bá sự kiện Online/Offline liên tục cho toàn bộ danh bạ; chỉ cập nhật TTL heartbeat và cho bạn bè đăng ký theo phiên đang mở.',
          en: 'Use heartbeat TTLs and active-viewport presence subscriptions rather than broadcasting every status flip to all contacts.',
        },
      },
    ],
    napkinPreset: {
      dau: 50_000_000,
      readsPerUserPerDay: 80,
      writesPerUserPerDay: 40,
      payloadKb: 0.4,
      retentionYears: 5,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Tốc độ gửi tin nhắn (Write RPS)', en: 'Message Write Rate' },
        value: '≈ 23.150 tin/giây avg · ≈ 70.000 peak',
        formula: {
          vi: '50M DAU × 40 tin/ngày / 86.400 ≈ 23.150 tin/giây (đỉnh ×3 ≈ 70K tin/giây)',
          en: '50M DAU × 40 msgs/day / 86,400 ≈ 23,150 msgs/s (×3 peak ≈ 70K msgs/s)',
        },
      },
      {
        metric: { vi: 'Cụm WebSocket Gateway (20M kết nối)', en: 'WebSocket Gateway Fleet (20M sockets)' },
        value: '≈ 400–500 máy chủ (~50K socket/máy)',
        formula: {
          vi: '20M kết nối × ~10 KB bộ nhớ kernel/socket ≈ 200 GB RAM kết nối + dự phòng failover',
          en: '20M sockets at ~50K sockets/instance ≈ 400–500 stateful gateway nodes',
        },
      },
      {
        metric: { vi: 'Lưu trữ tin nhắn văn bản 5 năm', en: '5-Year Message Storage' },
        value: '≈ 1,46 PB (chưa nhân hệ số bản sao)',
        formula: {
          vi: '2 tỷ tin/ngày × 400 B = 800 GB/ngày × 365 × 5 ≈ 1,46 PB',
          en: '2B msgs/day × 400 B = 800 GB/day × 365 × 5 ≈ 1.46 PB',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'chat-s1',
          text: {
            vi: 'Làm rõ giới hạn nhóm (≤ 200 người), lưu trữ lịch sử lâu dài, đồng bộ đa thiết bị và trạng thái đã nhận/đã xem.',
            en: 'Clarify max group size (≤ 200), durable history, multi-device sync, and delivery/read receipts.',
          },
        },
        {
          id: 'chat-s2',
          text: {
            vi: 'Chốt quy mô 20M kết nối mở đồng thời, p99 < 150 ms khi online và gửi Push Notification khi offline.',
            en: 'Confirm 20M concurrent sockets, p99 < 150 ms online delivery, and offline push notifications.',
          },
        },
      ],
      N: [
        {
          id: 'chat-n1',
          text: {
            vi: 'Tính thông lượng tin nhắn (~23K avg / ~70K peak tin/s) và số máy WebSocket Gateway (~400–500 node).',
            en: 'Estimate message rate (~23K avg / ~70K peak msgs/s) and WebSocket Gateway fleet (~400–500 nodes).',
          },
        },
        {
          id: 'chat-n2',
          text: {
            vi: 'Ước lượng khối lượng ghi nhỏ liên tục (~800 GB/ngày, ~1,5 PB trong 5 năm) để chọn đúng storage engine LSM-tree.',
            en: 'Size sustained small-write volume (~800 GB/day, ~1.5 PB/5 yr) to justify LSM-tree wide-column storage.',
          },
        },
      ],
      A: [
        {
          id: 'chat-a-c1',
          text: {
            vi: 'Định nghĩa khung gói tin WebSocket (`send_msg` kèm `client_msg_id` luỹ đẳng, `ack`, `deliver_msg`, `sync_since`).',
            en: 'Define WebSocket frames (`send_msg` with idempotent `client_msg_id`, `ack`, `deliver_msg`, `sync_since`).',
          },
        },
        {
          id: 'chat-a-c2',
          text: {
            vi: 'Thiết kế bảng `messages` phân vùng theo `channel_id` và sắp xếp theo `(sequence_id / message_id)` tăng dần.',
            en: 'Design `messages` partitioned by `channel_id` with clustering key `message_id` (Snowflake/sequence).',
          },
        },
      ],
      K: [
        {
          id: 'chat-k1',
          text: {
            vi: 'Tách WebSocket Gateway (giữ socket nhẹ) khỏi Chat Service, Presence Service và Session Registry trên Redis.',
            en: 'Separate stateful WebSocket Gateways from stateless Chat/Presence services and Redis Session Registry.',
          },
        },
        {
          id: 'chat-k2',
          text: {
            vi: 'Mô tả trọn vẹn hai nhánh chuyển tin: đẩy thẳng qua Gateway giữ socket người nhận (online) hoặc lưu hộp thư + APNs/FCM (offline).',
            en: 'Trace both online delivery (lookup recipient gateway -> push socket) and offline fallback (inbox + APNs/FCM).',
          },
        },
      ],
      E: [
        {
          id: 'chat-e1',
          text: {
            vi: 'Đảm bảo thứ tự tin nhắn nhất quán trong cùng cuộc trò chuyện và chống gửi trùng khi mạng chập chờn.',
            en: 'Guarantee per-channel message ordering and deduplicate retries via `(sender_id, client_msg_id)`.',
          },
        },
        {
          id: 'chat-e2',
          text: {
            vi: 'Xử lý sự cố 1 WebSocket Gateway sập làm rớt 50.000–200.000 kết nối cùng lúc (Exponential Backoff + Jitter tránh reconnect storm).',
            en: 'Prevent reconnect storms when a gateway crashes dropping 50K+ sockets (randomized backoff + jitter).',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'chat-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Làm rõ giới hạn thành viên nhóm, yêu cầu lưu lịch sử đa thiết bị và xử lý ngoại tuyến.',
          en: 'Clarified group cap, server-side persistence, multi-device sync, and offline push behavior.',
        },
        expectedDetail: {
          vi: 'Nhóm 200 người có mô hình định tuyến khác hoàn toàn kênh chat 100.000 người xem.',
          en: 'Bounded group size determines whether inbox fan-out or pub/sub room sharding is appropriate.',
        },
      },
      {
        id: 'chat-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Giải thích vì sao chọn WebSocket hai chiều thay cho HTTP Polling / Long Polling ở quy mô 20M kết nối.',
          en: 'Justified persistent WebSockets over HTTP polling for bidirectional low-latency messaging.',
        },
        expectedDetail: {
          vi: 'Polling bởi 20M thiết bị sinh hàng triệu request rỗng mỗi giây và tốn chi phí header.',
          en: 'Polling wastes bandwidth and server CPU on empty checks while adding latency.',
        },
      },
      {
        id: 'chat-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng tốc độ ghi tin nhắn (~23K avg / ~70K peak RPS) và số lượng máy WebSocket Gateway cần thiết.',
          en: 'Estimated message write throughput (~23K/70K RPS) and sized the stateful WebSocket Gateway fleet.',
        },
        expectedDetail: {
          vi: 'Tính tới giới hạn file descriptor và bộ nhớ trên mỗi cổng kết nối.',
          en: 'Accounted for per-host open socket and memory limits (~40K–60K connections/node).',
        },
      },
      {
        id: 'chat-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Ước lượng dung lượng lưu trữ hàng trăm GB mỗi ngày và chọn kho dữ liệu Wide-Column tối ưu ghi nhỏ (Cassandra/ScyllaDB/HBase).',
          en: 'Estimated ~800 GB/day growth and matched workload to an LSM-based Wide-Column store.',
        },
        expectedDetail: {
          vi: 'Truy vấn chat chủ yếu là ghi liên tục và đọc 20–50 tin gần nhất của một `channel_id`, không cần JOIN phức tạp.',
          en: 'Chat access pattern is append-heavy plus contiguous range reads within a single conversation.',
        },
      },
      {
        id: 'chat-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Giao thức gửi tin có `client_msg_id` luỹ đẳng, cơ chế ACK hai chặng (Server đã lưu vs Người nhận đã nhận) và API đồng bộ bù.',
          en: 'Included idempotent `client_msg_id`, explicit server/delivery ACKs, and `sync_since(last_seq)` catch-up contract.',
        },
        expectedDetail: {
          vi: 'Giúp client retry an toàn khi rớt mạng giữa chừng mà không nhân đôi tin nhắn.',
          en: 'Prevents duplicate messages on flaky mobile networks and heals missed gaps on reconnect.',
        },
      },
      {
        id: 'chat-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Lược đồ `messages` dùng `channel_id` làm Partition Key và `message_id` (Snowflake/Sequence cục bộ) làm Clustering Key.',
          en: 'Partitioned `messages` by `channel_id` with monotonic `message_id` clustering.',
        },
        expectedDetail: {
          vi: 'Đảm bảo toàn bộ trang tin nhắn gần nhất của 1 cuộc hội thoại nằm liền kề trên đĩa.',
          en: 'Keeps recent messages of a conversation physically co-located for single-partition reads.',
        },
      },
      {
        id: 'chat-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tách mỏng tầng WebSocket Gateway và dùng Session Registry (Redis) ánh xạ `(user_id, device_id) -> gateway_id`.',
          en: 'Kept WebSocket Gateways thin and routed deliveries via a `(user_id, device_id) -> gateway_id` Session Registry.',
        },
        expectedDetail: {
          vi: 'Cho phép triển khai và mở rộng logic nghiệp vụ ở Chat Service mà không làm ngắt kết nối socket.',
          en: 'Allows deploying stateless Chat Services independently without dropping client sockets.',
        },
      },
      {
        id: 'chat-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Luồng lưu trước khi chuyển tiếp (Store-then-Forward) kết hợp Push Notification cho thiết bị ngoại tuyến.',
          en: 'Used Store-then-Forward persistence before fan-out, falling back to APNs/FCM push when offline.',
        },
        expectedDetail: {
          vi: 'Server chỉ trả ACK "Đã gửi" sau khi bản ghi tin nhắn đã được lưu bền vững.',
          en: 'Server ACKs sender only after durable write so accepted messages are never lost.',
        },
      },
      {
        id: 'chat-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Đồng bộ đa thiết bị qua bảng hộp thư/con trỏ tiến độ đọc trên từng `device_id`.',
          en: 'Supported multi-device synchronization using per-device sync cursors or user inbox logs.',
        },
        expectedDetail: {
          vi: 'Khi mở laptop sau 2 ngày, thiết bị kéo các cuộc hội thoại có `latest_seq > device_cursor`.',
          en: 'Returning devices fetch only delta conversations newer than their local cursor.',
        },
      },
      {
        id: 'chat-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Xử lý thứ tự tin nhắn (dùng sequence theo `channel_id` hoặc Snowflake định tuyến theo kênh, không tin đồng hồ điện thoại).',
          en: 'Guaranteed causal/total ordering within a conversation without trusting client wall clocks.',
        },
        expectedDetail: {
          vi: 'Đồng hồ thiết bị người dùng thường xuyên lệch vài giây đến vài phút.',
          en: 'Client timestamps drift; server-assigned per-channel sequence or routed Snowflake preserves order.',
        },
      },
      {
        id: 'chat-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Chống Reconnect Storm khi 1 Gateway sập bằng Exponential Backoff + Jitter và Connection Admission Rate Limit.',
          en: 'Mitigated gateway crash reconnect storms via client backoff + jitter and connection admission throttling.',
        },
        expectedDetail: {
          vi: 'Bắt tay TLS + đồng bộ lịch sử đồng loạt từ 100.000 client có thể làm quá tải Auth và DB nếu không rải đều.',
          en: 'Simultaneous TLS handshakes and sync queries overwhelm auth/storage without jittered admission.',
        },
      },
      {
        id: 'chat-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Kiểm soát chi phí Presence (chỉ gửi heartbeat thưa 15–30s và đăng ký theo cuộc trò chuyện đang mở trên màn hình).',
          en: 'Bounded Presence overhead via coarse heartbeats (15–30s) and scoped active-view subscriptions.',
        },
        expectedDetail: {
          vi: 'Tránh bài toán O(N²) khi người dùng có 1.000 liên hệ chuyển mạng liên tục trên tàu điện.',
          en: 'Prevents O(N²) fan-out storms when mobile clients flap connectivity.',
        },
      },
    ],
    recommendedComponents: [
      'l7-lb',
      'ws-gateway',
      'redis-cache-aside',
      'idempotency-store',
      'kafka-queue',
      'kv-wide-column',
      'object-storage',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Thiết bị duy trì kết nối bền vững tới cụm WebSocket Gateway qua L4/L7 Load Balancer. Gateway đăng ký ánh xạ `(user_id, device_id) -> gateway_node` trong Redis Session Registry. Khi gửi tin, Gateway chuyển gói tin vào Chat Service (stateless): kiểm tra luỹ đẳng `client_msg_id`, gán `message_id` tăng dần theo kênh, ghi bền vững vào Wide-Column Store (`partition = channel_id`), trả ACK cho người gửi, rồi tra Session Registry của các thành viên trong cuộc hội thoại để đẩy trực tiếp qua gRPC nội bộ tới đúng Gateway đang giữ socket (hoặc đẩy sang hàng đợi Push Notification nếu thiết bị offline).',
        en: 'Clients hold persistent sockets to stateful WebSocket Gateways, which register `(user_id, device_id) -> gateway_node` in Redis Session Registry. Outgoing messages route to stateless Chat Service: deduplicate on `client_msg_id`, assign monotonic `message_id`, persist to Wide-Column storage (`partition = channel_id`), ACK sender, then resolve recipient gateways in Redis for direct internal gRPC push (falling back to Kafka -> Push Notification Workers for offline devices).',
      },
      writePath: {
        vi: 'Sender WS Frame -> Gateway A -> Chat Service -> Kiểm tra Idempotency `(sender_id, client_msg_id)` -> Ghi Wide-Column Store + cập nhật `last_msg` hội thoại -> Trả ACK cho Sender -> Fan-out tới Gateway giữ socket các thiết bị người nhận / Offline Push Queue.',
        en: 'Sender WS Frame -> Gateway A -> Chat Service -> Check `(sender_id, client_msg_id)` -> Append to Wide-Column Store & conversation index -> ACK Sender -> Push via recipient Gateways or enqueue APNs/FCM notification.',
      },
      readPath: {
        vi: 'Khi mở app hoặc kết nối lại: Client gửi `sync_since(cursors)` -> Sync Service đọc các cuộc hội thoại có thay đổi và quét dải `message_id > last_seq` trên đúng phân vùng `channel_id` -> Tải ảnh/tệp đính kèm qua CDN.',
        en: 'On app launch or reconnect: Client sends `sync_since(cursors)` -> Sync Service queries updated conversations and range-scans `message_id > last_seq` within single `channel_id` partitions -> Media loads via CDN.',
      },
      tradeoffs: [
        {
          vi: 'Tách WebSocket Gateway mỏng và Chat Service stateless: thêm 1 bước nhảy RPC nội bộ (~1–2 ms) nhưng cho phép cập nhật logic nghiệp vụ liên tục không làm đứt 20 triệu kết nối.',
          en: 'Thin Stateful Gateway + Stateless Chat Service adds ~1–2 ms internal hop in exchange for zero-disconnect deployments.',
        },
        {
          vi: 'Presence đăng ký theo màn hình đang mở thay vì đẩy toàn danh bạ: trễ vài giây khi mới mở hội thoại nhưng triệt tiêu bão cập nhật trạng thái.',
          en: 'Viewport-scoped presence subscriptions trade minor initial lookup latency for eliminating O(N²) status broadcasts.',
        },
      ],
    },
  },

  // =========================================================================
  // 4. Distributed API Rate Limiter — S7-02 (Mid)
  // =========================================================================
  {
    id: 'iv-rate-limiter',
    order: 4,
    level: 'Mid',
    relatedModuleId: 'S7-02',
    secondaryModuleIds: ['S4-05', 'S4-10', 'S2-02'],
    title: {
      vi: 'Thiết kế Distributed API Rate Limiter',
      en: 'Design a Distributed API Rate Limiter',
    },
    scaleTag: {
      vi: 'Đa Gateway · p99 < 2 ms · Token Bucket / Sliding Window',
      en: 'Multi-Gateway · p99 < 2 ms · Token Bucket / Sliding Window',
    },
    openingBrief: {
      vi: 'Nền tảng API công khai của công ty đang chạy trên hàng chục máy chủ cổng (gateway) và thỉnh thoảng bị một số khách hàng hoặc script gửi yêu cầu vượt ngưỡng làm chậm toàn hệ thống. Hãy thiết kế bộ giới hạn tốc độ yêu cầu phân tán.',
      en: 'Our public API runs behind dozens of gateway instances and occasionally suffers noisy-neighbor traffic spikes from scripts or misconfigured clients. Design a distributed API rate limiter.',
    },
    hiddenAssumptions: [
      {
        id: 'rl-a1',
        topic: { vi: 'Vị trí triển khai & Chiều định danh', en: 'Placement & Throttling Dimensions' },
        question: {
          vi: 'Bộ giới hạn đặt tại tầng API Gateway hay thư viện trong từng microservice, và giới hạn theo những khoá nào?',
          en: 'Does the limiter sit at the edge API Gateway or inside services, and which dimensions are throttled?',
        },
        interviewerAnswer: {
          vi: 'Đặt tập trung tại lớp API Gateway / Edge Proxy để chặn sớm trước khi chạm dịch vụ nội bộ. Quy tắc linh hoạt theo `api_key` (theo gói cước), `user_id`, `IP` và đường dẫn endpoint (ví dụ `/login` khắt khe hơn `/items`).',
          en: 'Enforce at the API Gateway tier before requests hit backend services. Rules must support `api_key` tiers, `user_id`, client `IP`, and endpoint path.',
        },
        designImpact: {
          vi: 'Cần dịch vụ nạp cấu hình quy tắc vào bộ nhớ đệm cục bộ của từng Gateway, còn bộ đếm chia sẻ giữa các Gateway.',
          en: 'Cache rule configurations locally in each Gateway memory while sharing dynamic counters across instances.',
        },
      },
      {
        id: 'rl-a2',
        topic: { vi: 'Ngân sách độ trễ & Độ chính xác', en: 'Latency Budget & Accuracy Tolerance' },
        question: {
          vi: 'Mỗi request đi qua bộ kiểm tra được phép tốn tối đa bao nhiêu thời gian và có chấp nhận sai số nhỏ không?',
          en: 'What is the maximum latency overhead allowed per request, and is slight eventual slack acceptable?',
        },
        interviewerAnswer: {
          vi: 'Độ trễ cộng thêm ở p99 phải dưới 2–3 ms ở quy mô đỉnh 200.000 RPS toàn cụm. Cho phép sai số nhỏ (±2–5%) ở ranh giới cửa sổ cho API thường, nhưng không được nhân ngưỡng lên N lần theo số máy Gateway.',
          en: 'Added latency must stay under 2–3 ms at p99 across 200,000 global RPS. Small boundary slack (±2–5%) is fine, provided limits do not multiply by gateway count.',
        },
        designImpact: {
          vi: 'Không thể dùng cơ sở dữ liệu đĩa; dùng cụm Redis In-Memory với Lua script nguyên tử (1 round-trip) và batching cục bộ cho khoá cực nóng.',
          en: 'Disk DBs are far too slow; use sharded in-memory Redis with single-round-trip Lua scripts plus local token batching for ultra-hot keys.',
        },
      },
      {
        id: 'rl-a3',
        topic: { vi: 'Hành vi khi kho bộ đếm gặp sự cố', en: 'Failure Policy (Fail-Open vs Fail-Closed)' },
        question: {
          vi: 'Nếu cụm Redis lưu bộ đếm bị mất kết nối tạm thời, hệ thống nên chặn toàn bộ hay cho phép lưu lượng đi qua?',
          en: 'If the shared counter store becomes unreachable, should gateways fail-open or fail-closed?',
        },
        interviewerAnswer: {
          vi: 'Mặc định `fail-open` kèm rơi về bộ giới hạn cục bộ trong RAM của từng Gateway để không làm ngừng dịch vụ của khách hàng hợp lệ; riêng các endpoint nhạy cảm bảo mật (như xác thực OTP) cấu hình `fail-closed`.',
          en: 'Default to `fail-open` with local in-memory gateway fallback so legitimate traffic stays live; allow per-rule `fail-closed` override on security-sensitive endpoints.',
        },
        designImpact: {
          vi: 'Cần Circuit Breaker ngắn quanh lệnh gọi Redis (~5 ms timeout) và bộ Token Bucket dự phòng ngay trong tiến trình Gateway.',
          en: 'Wrap Redis checks in a tight timeout (~5 ms) + circuit breaker with an in-process fallback bucket.',
        },
      },
    ],
    napkinPreset: {
      dau: 20_000_000,
      readsPerUserPerDay: 250,
      writesPerUserPerDay: 250,
      payloadKb: 0.1,
      retentionYears: 1,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Thông lượng kiểm tra toàn cục', en: 'Global Check Throughput' },
        value: '≈ 58.000 RPS avg · ≈ 200.000 RPS peak',
        formula: {
          vi: '5 tỷ API calls/ngày / 86.400 ≈ 57.870 RPS; đỉnh giờ hành chính ≈ 200K phép kiểm tra/giây',
          en: '5B daily API calls / 86,400 ≈ 57,870 RPS; peak bursts ≈ 200K checks/s',
        },
      },
      {
        metric: { vi: 'Bộ nhớ RAM cho 20 triệu bucket đang hoạt động', en: 'RAM for 20M Active Buckets' },
        value: '≈ 2,0–2,5 GB',
        formula: {
          vi: '20M khoá đang có TTL × ~100 B (key + tokens + timestamp + overhead Redis) ≈ 2 GB RAM',
          en: '20M active keys with TTL × ~100 B (key + tokens + ts + Redis overhead) ≈ 2 GB',
        },
      },
      {
        metric: { vi: 'Số phân mảnh Redis để đạt 200K ops/s', en: 'Redis Shards for 200K Lua Ops/s' },
        value: '4–6 Primary Shards (+ Replicas)',
        formula: {
          vi: 'Mỗi Redis node đơn luồng xử lý an toàn ~50K–70K Lua script/giây với p99 < 1 ms',
          en: 'Each single-threaded Redis primary comfortably serves ~50K–70K Lua ops/s at sub-ms latency',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'rl-s1',
          text: {
            vi: 'Làm rõ vị trí đặt tại API Gateway, chiều giới hạn (API key, user, IP, endpoint) và yêu cầu cho phép burst ngắn.',
            en: 'Clarify API Gateway placement, dimensions (API key, user, IP, route), and burst behavior.',
          },
        },
        {
          id: 'rl-s2',
          text: {
            vi: 'Chốt ngân sách độ trễ p99 < 2 ms và chính sách dự phòng khi cụm lưu bộ đếm gặp sự cố (fail-open + fallback cục bộ).',
            en: 'Agree on p99 < 2 ms latency budget and degraded-mode policy (fail-open with local fallback vs fail-closed).',
          },
        },
      ],
      N: [
        {
          id: 'rl-n1',
          text: {
            vi: 'Tính tổng QPS kiểm tra (~200K peak ops/s) để chỉ ra 1 node Redis đơn lẻ sẽ chạm trần CPU.',
            en: 'Compute 200K peak checks/s to show why a single Redis node saturates CPU and needs sharding.',
        },
        },
        {
          id: 'rl-n2',
          text: {
            vi: 'Ước lượng dung lượng bộ nhớ cho các khóa đang hoạt động có tự động hết hạn TTL (~2–3 GB RAM, không phình vô hạn).',
            en: 'Estimate memory footprint (~2–3 GB with automatic TTL expiry) and rule out exact Sliding Window Logs.',
          },
        },
      ],
      A: [
        {
          id: 'rl-a-c1',
          text: {
            vi: 'Định nghĩa cấu trúc Rule cấu hình (`id`, `scope`, `capacity`, `refill_rate`, `failure_mode`) và hàm nội bộ `AllowRequest(key)`.',
            en: 'Define declarative Rule schema (`scope`, `capacity`, `refill_rate`, `failure_mode`) and `AllowRequest` interface.',
          },
        },
        {
          id: 'rl-a-c2',
          text: {
            vi: 'Chuẩn hoá phản hồi HTTP `429 Too Many Requests` kèm các header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.',
            en: 'Standardize HTTP `429` responses with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.',
          },
        },
      ],
      K: [
        {
          id: 'rl-k1',
          text: {
            vi: 'So sánh các thuật toán (Fixed Window, Sliding Window Log, Sliding Window Counter, Token Bucket) và chọn Token Bucket / Sliding Window Counter.',
            en: 'Compare Fixed Window, Sliding Window Log, Sliding Window Counter, and Token Bucket; justify Token Bucket / Sliding Window Counter.',
          },
        },
        {
          id: 'rl-k2',
          text: {
            vi: 'Giải quyết race condition giữa nhiều Gateway bằng Redis Lua Script nguyên tử (đọc-tính-ghi trong 1 lệnh) và phân mảnh theo Consistent Hashing.',
            en: 'Eliminate read-modify-write race conditions across gateways using atomic Redis Lua scripts over Consistent Hash shards.',
          },
        },
      ],
      E: [
        {
          id: 'rl-e1',
          text: {
            vi: 'Xử lý đồng hồ lệch giữa các Gateway (dùng `REDIS TIME` thay vì đồng hồ cục bộ của từng máy app).',
            en: 'Avoid clock-skew bugs across gateways by reading server time inside Redis (`TIME`) rather than client clocks.',
          },
        },
        {
          id: 'rl-e2',
          text: {
            vi: 'Giải quyết hot key (1 tenant lớn gửi 100K RPS dồn vào 1 shard Redis) bằng cơ chế cấp phát lô token cục bộ (Local Quota Lease / Batching).',
            en: 'Mitigate single-tenant hot keys via local token lease batching on gateways and tight timeout fallback.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'rl-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Làm rõ vị trí triển khai tại API Gateway, các chiều khoá giới hạn và nhu cầu hỗ trợ burst hợp lệ.',
          en: 'Clarified edge gateway placement, multi-dimensional throttling keys, and burst tolerance.',
        },
        expectedDetail: {
          vi: 'Xác định rõ hệ thống chạy trên nhiều Gateway không chia sẻ RAM trực tiếp.',
          en: 'Established distributed multi-gateway deployment and flexible rule matching.',
        },
      },
      {
        id: 'rl-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Chủ động hỏi chính sách khi lỗi (Fail-open kèm giới hạn cục bộ so với Fail-closed) và ngân sách độ trễ (< 2 ms).',
          en: 'Proactively clarified degraded-mode behavior (fail-open vs fail-closed) and sub-2ms latency budget.',
        },
        expectedDetail: {
          vi: 'Bộ giới hạn tải không được trở thành điểm dừng toàn cục làm gián đoạn dịch vụ.',
          en: 'Rate limiter must never become a brittle global outage point.',
        },
      },
      {
        id: 'rl-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng tổng QPS kiểm tra (đỉnh ~200K ops/s) và suy ra số phân mảnh Redis cần thiết (~4–6 shards).',
          en: 'Computed peak check QPS (~200K ops/s) and derived Redis shard count (~4–6 shards).',
        },
        expectedDetail: {
          vi: 'Hiểu giới hạn thực tế ~50K–80K lệnh/giây của một tiến trình Redis đơn luồng.',
          en: 'Demonstrated practical knowledge of single-node Redis throughput ceilings.',
        },
      },
      {
        id: 'rl-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Tính bộ nhớ O(1) mỗi khoá của Token Bucket (~2 GB) và chứng minh Sliding Window Log tốn RAM quá lớn cho khách hàng gói cao.',
          en: 'Showed O(1) memory per key (~2 GB total) vs excessive memory of Sliding Window Log for high-quota tenants.',
        },
        expectedDetail: {
          vi: 'Lưu mọi timestamp của tenant 10.000 req/phút làm phình Sorted Set và chậm lệnh ZREMRANGEBYSCORE.',
          en: 'Storing individual timestamps per request scales poorly for enterprise quotas.',
        },
      },
      {
        id: 'rl-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Đầy đủ mã phản hồi HTTP 429 và bộ header chuẩn (`X-RateLimit-Limit`, `Remaining`, `Reset`, `Retry-After`).',
          en: 'Specified HTTP 429 contract with standard `X-RateLimit-*` and `Retry-After` headers.',
        },
        expectedDetail: {
          vi: 'Giúp SDK khách hàng chủ động lùi thời gian gọi thay vì retry mù quáng.',
          en: 'Enables well-behaved clients to back off deterministically instead of hammering the gateway.',
        },
      },
      {
        id: 'rl-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Cấu trúc Rule tách khỏi code (lưu DB, đẩy/kéo về RAM cục bộ của Gateway) và thiết kế khóa Redis có TTL tự dọn.',
          en: 'Separated dynamic Rule config (cached in-memory on gateways) from ephemeral Redis counter state with TTL.',
        },
        expectedDetail: {
          vi: 'Gateway không được đọc bảng cấu hình từ SQL trên mỗi request.',
          en: 'Rules are hot-reloaded in gateway memory; only token state hits Redis.',
        },
      },
      {
        id: 'rl-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Phân tích đúng ưu nhược điểm của Fixed Window (gấp đôi tải ở mép cửa sổ) và chọn Token Bucket / Sliding Window Counter.',
          en: 'Explained Fixed Window boundary bursts (2× spike) and selected Token Bucket or Sliding Window Counter.',
        },
        expectedDetail: {
          vi: 'Token Bucket dùng đúng 2 số (`tokens`, `last_refill_ms`) nhưng vừa kiểm soát tốc độ trung bình vừa cho phép burst có trần.',
          en: 'Token Bucket requires just two numbers per key while cleanly modeling sustained rate + burst cap.',
        },
      },
      {
        id: 'rl-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Sử dụng Redis Lua Script để gộp bước đọc, nạp lại token, trừ token và đặt `PEXPIRE` thành một thao tác nguyên tử.',
          en: 'Used an atomic Redis Lua script to refill, decrement, and set `PEXPIRE` in a single network round-trip.',
        },
        expectedDetail: {
          vi: 'Nếu tách `GET` rồi `SET` từ 20 Gateway đồng thời sẽ bị lost update cho lọt vượt hạn mức.',
          en: 'Separate `GET` + `SET` across concurrent gateways causes race conditions and quota leaks.',
        },
      },
      {
        id: 'rl-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Phân vùng cụm Redis bằng Consistent Hashing (hoặc Redis Cluster hash slots) theo khoá giới hạn.',
          en: 'Partitioned counter keys across Redis shards via Consistent Hashing / hash slots.',
        },
        expectedDetail: {
          vi: 'Mỗi Lua script chỉ chạm đúng 1 khoá nên mở rộng ngang tuyến tính theo số shard.',
          en: 'Single-key Lua scripts route cleanly to individual hash slots for linear horizontal scale.',
        },
      },
      {
        id: 'rl-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Sử dụng thời gian thống nhất từ chính Redis server thay vì truyền `Date.now()` bị lệch giữa các máy Gateway.',
          en: 'Avoided clock-drift errors by sourcing monotonic/server time on the Redis shard rather than gateway clocks.',
        },
        expectedDetail: {
          vi: 'Nếu Gateway B có đồng hồ nhanh hơn Gateway A 500 ms, phép tính nạp token theo `now - last_refill` sẽ sai lệch.',
          en: 'Skewed gateway clocks corrupt `now - last_refill` math unless time is read centrally on the shard.',
        },
      },
      {
        id: 'rl-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý hot key của khách hàng lớn hoặc tấn công DDoS vào 1 khóa bằng Local Token Batching / đồng bộ định kỳ.',
          en: 'Handled single-key hot spots via local gateway token leases/batching or edge-local IP blocking.',
        },
        expectedDetail: {
          vi: 'Mỗi Gateway xin trước một lô nhỏ (ví dụ 50 token) và trừ trong RAM cục bộ, giảm 50 lần tải lên shard Redis đó.',
          en: 'Gateways lease small token batches locally, cutting Redis hits by an order of magnitude for hot tenants.',
        },
      },
      {
        id: 'rl-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Thiết kế timeout ngắn (~5 ms), Circuit Breaker và fallback bộ đếm cục bộ kèm theo dõi tỷ lệ 429 / độ trễ limiter.',
          en: 'Configured tight Redis timeouts, circuit breaker, local in-memory fallback, and observability metrics.',
        },
        expectedDetail: {
          vi: 'Theo dõi metric: tỷ lệ request bị chặn 429 theo tenant, p99 latency của Redis Lua và số lần kích hoạt fallback.',
          en: 'Tracked 429 rate per rule, Redis Lua p99 latency, and fallback activation counters.',
        },
      },
    ],
    recommendedComponents: [
      'l7-lb',
      'api-gateway',
      'redis-cache-aside',
      'consistent-hash-shards',
      'pg-primary-replica',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Middleware Rate Limiter nằm ngay trong tầng API Gateway. Cấu hình quy tắc được quản lý ở Control Plane (PostgreSQL) và đồng bộ về bộ nhớ RAM của mọi Gateway qua cơ chế watch/cache cục bộ. Trên đường dữ liệu nóng, mỗi request tạo khóa định danh (ví dụ `rl:{tenant_id}:{route}`) và gọi 1 lệnh `EVALSHA` (Lua Token Bucket dùng thời gian của Redis) tới phân mảnh Redis tương ứng qua Consistent Hashing. Với khóa có lưu lượng cực lớn, Gateway chuyển sang xin lô token cục bộ; nếu Redis chậm > 5 ms, Circuit Breaker chuyển tạm về Token Bucket trong RAM của Gateway (`fail-open` có kiểm soát).',
        en: 'Runs as an inline middleware inside stateless API Gateways. Control-plane rules live in PostgreSQL and sync into each Gateway’s in-process memory. On the hot data path, gateways build a composite key (`rl:{subject}:{route}`) and execute a single-round-trip `EVALSHA` Token Bucket Lua script (using Redis server time) on Consistent-Hashed Redis shards. Hot tenants use local token batch leases; if Redis exceeds a 5 ms timeout, a circuit breaker falls back to per-gateway in-memory buckets.',
      },
      writePath: {
        vi: 'Cập nhật quy tắc: Admin API -> PostgreSQL -> Phát thông báo cập nhật cấu hình -> Các API Gateway nạp lại bảng quy tắc vào RAM không cần khởi động lại.',
        en: 'Rule update: Admin API -> PostgreSQL -> Config change notification -> Gateways hot-reload rule definitions in memory.',
      },
      readPath: {
        vi: 'Client Request -> API Gateway khớp Rule trong RAM -> Kiểm tra lô cục bộ (nếu bật) hoặc gọi `EVALSHA` tới Redis Shard -> Nhận `(allowed, remaining, reset_ms)` -> Nếu vượt ngưỡng trả ngay `429 + Retry-After`, nếu đạt chuyển tiếp xuống dịch vụ đích.',
        en: 'Client Request -> Gateway matches in-memory Rule -> Execute `EVALSHA` on target Redis shard -> Receive `(allowed, remaining, reset_ms)` -> Return `429 + Retry-After` if exhausted, else forward upstream.',
      },
      tradeoffs: [
        {
          vi: 'Redis tập trung so với bộ đếm chỉ nằm ở từng Gateway: tốn thêm ~0,5–1 ms mạng nội bộ nhưng giữ hạn mức chính xác bất kể Load Balancer điều phối request sang máy nào.',
          en: 'Shared Redis vs purely local counters: adds ~0.5–1 ms LAN hop to enforce accurate global quotas across non-sticky load balancing.',
        },
        {
          vi: 'Local Token Lease cho hot key: giảm tải shard Redis hàng chục lần với đánh đổi có thể cấp dư một lượng nhỏ token chưa dùng hết nếu một Gateway vừa khởi động lại.',
          en: 'Local token batching relieves hot shards dramatically at the cost of slight quota slack at window edges.',
        },
      ],
    },
  },

  // =========================================================================
  // 5. Multi-Channel Notification System — S7-03 (Senior)
  // =========================================================================
  {
    id: 'iv-notification',
    order: 5,
    level: 'Senior',
    relatedModuleId: 'S7-03',
    secondaryModuleIds: ['S2-04', 'S4-06', 'S4-10', 'S4-11'],
    title: {
      vi: 'Thiết kế Hệ thống Notification đa kênh (100M thông báo/ngày)',
      en: 'Design a Multi-Channel Notification System (100M/Day)',
    },
    scaleTag: {
      vi: '100M tin/ngày · Push / Email / SMS · Priority Queue',
      en: '100M/day · Push / Email / SMS · Priority Isolation',
    },
    openingBrief: {
      vi: 'Thiết kế nền tảng thông báo dùng chung cho toàn bộ các đội sản phẩm trong công ty, cho phép gửi Mobile Push (iOS/Android), Email và SMS tới người dùng cuối.',
      en: 'Design a centralized notification platform used by internal product teams to deliver iOS/Android Push notifications, Emails, and SMS messages to end users.',
    },
    hiddenAssumptions: [
      {
        id: 'ntf-a1',
        topic: { vi: 'Phân tầng mức độ ưu tiên & Chiến dịch lớn', en: 'Priority Tiers & Bulk Campaigns' },
        question: {
          vi: 'Có những loại thông báo nào và yêu cầu thời gian chuyển phát của từng loại khác nhau ra sao?',
          en: 'What classes of notifications exist, and how do their delivery latency requirements differ?',
        },
        interviewerAnswer: {
          vi: 'Có 3 mức rõ rệt: (1) Khẩn cấp như mã OTP / cảnh báo giao dịch phải tới dưới 5 giây; (2) Sự kiện đơn hàng / tin nhắn dưới 30 giây; (3) Chiến dịch tiếp thị có thể bắn 20 triệu thông báo cùng lúc vào 9:00 sáng và chấp nhận hoàn tất trong 15–30 phút.',
          en: 'Three distinct tiers: (1) Critical OTP/security alerts (< 5 s); (2) Transactional order updates (< 30 s); (3) Marketing blasts up to 20M recipients at 9:00 AM (15–30 min acceptable).',
        },
        designImpact: {
          vi: 'Bắt buộc cô lập hàng đợi và cụm Worker theo mức ưu tiên (Bulkhead) để chiến dịch 20M tin không bao giờ làm trễ mã OTP.',
          en: 'Strictly isolate queues and worker pools by priority (Bulkhead) so marketing spikes never delay OTP delivery.',
        },
      },
      {
        id: 'ntf-a2',
        topic: { vi: 'Đảm bảo chuyển phát, Chống trùng & Cài đặt người dùng', en: 'Delivery Guarantee, Deduplication & Preferences' },
        question: {
          vi: 'Chấp nhận mất thông báo không, làm sao tránh gửi 2 SMS trùng lặp và người dùng có quyền tắt thông báo không?',
          en: 'Can notifications be dropped, how strict is duplicate prevention, and what user controls apply?',
        },
        interviewerAnswer: {
          vi: 'Đảm bảo at-least-once cho thông báo giao dịch (không được lặng lẽ làm mất), kết hợp khử trùng theo `idempotency_key` để không tốn tiền SMS gấp đôi hoặc làm phiền khách. Phải kiểm tra cài đặt opt-out, giờ nghỉ đêm và giới hạn tần suất thông báo tiếp thị trên từng người dùng.',
          en: 'Guarantee at-least-once delivery with idempotency deduplication (especially costly SMS). Respect per-user opt-outs, quiet hours, and marketing frequency caps.',
        },
        designImpact: {
          vi: 'Cần bảng trạng thái gửi kèm Idempotency Store, bộ lọc User Preference & Per-User Rate Limit trước khi đưa xuống kênh gửi.',
          en: 'Validate preferences and per-user frequency caps before enqueueing, and deduplicate via Idempotency Store before provider calls.',
        },
      },
      {
        id: 'ntf-a3',
        topic: { vi: 'Giới hạn và sự cố từ nhà cung cấp bên thứ ba', en: 'Third-Party Provider Quotas & Outages' },
        question: {
          vi: 'Các nhà cung cấp như APNs, FCM, Twilio, SendGrid/SES có giới hạn tốc độ hay ngừng phản hồi tạm thời không?',
          en: 'Do external providers enforce rate limits or experience regional slowdowns/outages?',
        },
        interviewerAnswer: {
          vi: 'Có. Nhà cung cấp SMS và Email áp trần RPS nghiêm ngặt theo tài khoản và đôi lúc gặp lỗi 5xx kéo dài vài phút; riêng SMS cho phép chuyển dự phòng sang nhà cung cấp thứ hai.',
          en: 'Yes. SMS/Email vendors enforce strict account RPS quotas and suffer intermittent 5xx outages; SMS supports failover to a secondary vendor.',
        },
        designImpact: {
          vi: 'Mỗi kênh cần Rate Limiter phía gửi đi (outbound), Circuit Breaker, Retry có Exponential Backoff + Jitter, DLQ và bộ chuyển đổi nhà cung cấp SMS dự phòng.',
          en: 'Outbound workers need per-provider rate shaping, circuit breakers, jittered exponential retries, DLQs, and multi-vendor SMS routing.',
        },
      },
    ],
    napkinPreset: {
      dau: 25_000_000,
      readsPerUserPerDay: 2,
      writesPerUserPerDay: 4,
      payloadKb: 1.5,
      retentionYears: 2,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Thông lượng gửi trung bình & Đỉnh chiến dịch', en: 'Avg Throughput & Campaign Spike' },
        value: '≈ 1.160 tin/s avg · ≈ 25.000+ tin/s lúc bắn chiến dịch',
        formula: {
          vi: '100M / 86.400 ≈ 1.157 tin/s; chiến dịch 20M tin xả trong 15 phút ≈ 22.200 tin/giây',
          en: '100M / 86,400 ≈ 1,157 msgs/s avg; 20M campaign drained in 15 min ≈ 22,200 msgs/s',
        },
      },
      {
        metric: { vi: 'Phân bổ theo kênh (Push 75% · Email 20% · SMS 5%)', en: 'Channel Split (Push 75% · Email 20% · SMS 5%)' },
        value: 'Push ~870/s · Email ~230/s · SMS ~58/s avg',
        formula: {
          vi: 'Mỗi kênh có độ trễ mạng bên ngoài khác nhau (50–500 ms) nên cần cụm Worker I/O bất đồng bộ riêng',
          en: 'External provider RTTs range from 50–500 ms, requiring separate async worker pools per channel',
        },
      },
      {
        metric: { vi: 'Lưu trữ Nhật ký chuyển phát & Trạng thái 2 năm', en: '2-Year Delivery Log Storage' },
        value: '≈ 110 TB (kèm chuyển tầng lạnh sau 90 ngày)',
        formula: {
          vi: '100M tin/ngày × 1,5 KB = 150 GB/ngày × 730 ngày ≈ 109,5 TB',
          en: '100M/day × 1.5 KB = 150 GB/day × 730 days ≈ 109.5 TB',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'ntf-s1',
          text: {
            vi: 'Phân biệt rõ thông báo giao dịch thời gian thực (OTP < 5 s) và thông báo chiến dịch hàng loạt (hàng chục triệu người nhận).',
            en: 'Distinguish real-time transactional/OTP (< 5 s) from bulk marketing campaigns (millions of recipients).',
          },
        },
        {
          id: 'ntf-s2',
          text: {
            vi: 'Làm rõ yêu cầu at-least-once kèm khử trùng, cài đặt opt-out/quiet hours và phụ thuộc vào nhà cung cấp ngoài.',
            en: 'Clarify at-least-once + deduplication, user opt-out/quiet-hour rules, and external provider constraints.',
          },
        },
      ],
      N: [
        {
          id: 'ntf-n1',
          text: {
            vi: 'Tính chênh lệch giữa tốc độ nền (~1.160/s) và đỉnh chiến dịch (~25.000/s) để thấy lý do cần hàng đợi hấp thụ tải.',
            en: 'Contrast baseline (~1,160/s) against campaign spikes (~25,000/s) to justify buffered priority queues.',
          },
        },
        {
          id: 'ntf-n2',
          text: {
            vi: 'Tính độ đồng thời (Little’s Law: 20.000 RPS × 0,2 s RTT provider = 4.000 yêu cầu đang bay đồng thời) cho tầng Worker.',
            en: 'Apply Little’s Law (L = λW: 20K/s × 0.2 s RTT = 4,000 in-flight requests) to size async worker concurrency.',
          },
        },
      ],
      A: [
        {
          id: 'ntf-a-c1',
          text: {
            vi: 'Thiết kế API gửi đơn lẻ `POST /v1/notifications/send` (có `idempotency_key`, `priority`, `template_id`, `variables`) và API chiến dịch lô.',
            en: 'Specify `POST /v1/notifications/send` (`idempotency_key`, `priority`, `template_id`, `variables`) plus bulk campaign API.',
          },
        },
        {
          id: 'ntf-a-c2',
          text: {
            vi: 'Thiết kế bảng `user_devices` (APNs/FCM token), `user_preferences`, `templates` và `notification_logs` (trạng thái chuyển phát).',
            en: 'Model `user_devices`, `user_preferences`, `templates`, and `notification_logs` status tracking.',
          },
        },
      ],
      K: [
        {
          id: 'ntf-k1',
          text: {
            vi: 'Cô lập hàng đợi theo cả Mức ưu tiên (`P0-OTP`, `P1-Transactional`, `P2-Marketing`) lẫn Kênh (`Push`, `Email`, `SMS`).',
            en: 'Partition queues by BOTH Priority (`P0`, `P1`, `P2`) and Channel (`Push`, `Email`, `SMS`) with independent worker pools.',
          },
        },
        {
          id: 'ntf-k2',
          text: {
            vi: 'Đặt bước kiểm tra Preference, Frequency Cap, dựng nội dung từ Template Cache và nhận Webhook callback trạng thái từ nhà cung cấp.',
            en: 'Include Preference/Frequency-Cap check, cached template rendering, and inbound provider webhook status tracking.',
          },
        },
      ],
      E: [
        {
          id: 'ntf-e1',
          text: {
            vi: 'Xử lý nhà cung cấp ngoài chậm hoặc lỗi: Outbound Rate Limiter theo quota hợp đồng, Retry Backoff + Jitter, DLQ và chuyển dự phòng nhà cung cấp SMS.',
            en: 'Handle slow/failing vendors: outbound quota rate limiter, exponential backoff + jitter, DLQ, and secondary SMS vendor failover.',
          },
        },
        {
          id: 'ntf-e2',
          text: {
            vi: 'Thu hồi device token hết hạn khi APNs/FCM báo `Unregistered` và giám sát độ trễ hàng đợi P0 (Queue Lag Alert).',
            en: 'Prune invalid push tokens on APNs/FCM `Unregistered` responses and alert on P0 queue lag / delivery drop.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'ntf-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Phân loại rõ các mức ưu tiên (OTP < 5s so với Marketing hàng loạt) và yêu cầu kiểm soát opt-out / tần suất.',
          en: 'Separated priority classes (critical OTP vs bulk marketing) and captured user preference/frequency-cap rules.',
        },
        expectedDetail: {
          vi: 'Nhận ra head-of-line blocking nếu dùng chung một hàng đợi duy nhất.',
          en: 'Identified head-of-line blocking risk if bulk campaigns share queues with OTPs.',
        },
      },
      {
        id: 'ntf-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Xác định cam kết chuyển phát at-least-once kết hợp chống gửi trùng và giới hạn từ nhà cung cấp thứ ba.',
          en: 'Established at-least-once delivery with deduplication and third-party vendor rate constraints.',
        },
        expectedDetail: {
          vi: 'Đặc biệt quan trọng với SMS vì chi phí trên từng tin nhắn và trải nghiệm người dùng.',
          en: 'Duplicate SMS incurs direct financial cost and degrades user trust.',
        },
      },
      {
        id: 'ntf-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính cả tốc độ trung bình (~1.160/s) lẫn đỉnh dồn chiến dịch (> 20.000/s) và số kết nối đồng thời tới nhà cung cấp.',
          en: 'Calculated both baseline (~1,160/s) and campaign burst (> 20K/s) plus concurrent outbound connections via Little’s Law.',
        },
        expectedDetail: {
          vi: 'Dùng Little’s Law để chứng minh Worker phải dùng non-blocking I/O / connection pool thay vì luồng đồng bộ ít ỏi.',
          en: 'Used Little’s Law to show why high-RTT vendor calls require async I/O worker pools.',
        },
      },
      {
        id: 'ntf-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Ước lượng lưu trữ nhật ký thông báo (~150 GB/ngày) và đề xuất chính sách lưu trữ lạnh / TTL.',
          en: 'Sized notification status logs (~150 GB/day) with hot-to-cold archival lifecycle.',
        },
        expectedDetail: {
          vi: 'Chỉ giữ dữ liệu 30–90 ngày gần nhất ở bảng nóng để tra cứu khiếu nại và đối soát.',
          en: 'Keep 30–90 days in hot storage for debugging/dedup and archive older records.',
        },
      },
      {
        id: 'ntf-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'API nhận lệnh bắt buộc có `idempotency_key`, `priority`, tham chiếu `template_id` thay vì truyền nội dung thô lộn xộn.',
          en: 'Ingestion API included `idempotency_key`, `priority`, and `template_id` + variables.',
        },
        expectedDetail: {
          vi: 'Trả `202 Accepted` ngay sau khi kiểm tra hợp lệ và ghi bền vững vào hàng đợi/outbox.',
          en: 'Returns `202 Accepted` once durably persisted rather than blocking on external vendor HTTP calls.',
        },
      },
      {
        id: 'ntf-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Mô hình hoá đầy đủ bảng thiết bị (`user_id -> nhiều push token`), cài đặt kênh và máy trạng thái thông báo.',
          en: 'Modeled one-to-many `user_devices` tokens, channel preferences, and notification lifecycle states.',
        },
        expectedDetail: {
          vi: 'Trạng thái rõ ràng: `ACCEPTED -> QUEUED -> SENT -> DELIVERED / BOUNCED / DLQ`.',
          en: 'Tracked explicit states from `ACCEPTED` through provider webhook `DELIVERED` or `DLQ`.',
        },
      },
      {
        id: 'ntf-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Cô lập hoàn toàn hàng đợi và Worker theo Mức ưu tiên (`P0/P1/P2`) và theo từng Kênh (`iOS`, `Android`, `Email`, `SMS`).',
          en: 'Isolated topics/queues and worker fleets by both Priority tier and Delivery Channel.',
        },
        expectedDetail: {
          vi: 'Sự cố chậm ở nhà cung cấp Email không bao giờ chiếm hết tài nguyên của luồng gửi SMS OTP.',
          en: 'Email vendor degradation cannot starve iOS Push or SMS OTP workers (Bulkhead isolation).',
        },
      },
      {
        id: 'ntf-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tích hợp Redis Cache cho User Preferences / Device Tokens / Templates và kiểm tra Frequency Cap trước khi gửi.',
          en: 'Cached user preferences, device tokens, and templates in Redis, enforcing per-user frequency caps.',
        },
        expectedDetail: {
          vi: 'Khi chiến dịch 20M tin chạy, cache chặn việc đọc lặp đi lặp lại cùng một template và tránh bắn làm phiền người dùng đang trong giờ nghỉ.',
          en: 'Prevents DB overload during bulk fan-out and enforces quiet hours cleanly.',
        },
      },
      {
        id: 'ntf-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Cơ chế khử trùng bằng Idempotency Store (`event_id + user_id + channel`) ngay trước khi gọi nhà cung cấp.',
          en: 'Deduplicated via `(idempotency_key, user_id, channel)` check-and-mark before invoking external vendors.',
        },
        expectedDetail: {
          vi: 'Chặn gửi lặp cả khi producer gọi API hai lần lẫn khi consumer đọc lại message sau khi khởi động lại.',
          en: 'Protects against both upstream producer retries and Kafka consumer rebalance replays.',
        },
      },
      {
        id: 'ntf-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Điều tiết tốc độ gửi ra (Outbound Token Bucket) khớp hạn mức nhà cung cấp, kèm Retry Backoff + Jitter và DLQ.',
          en: 'Implemented outbound vendor rate shaping, jittered exponential backoff retries, and Dead-Letter Queues.',
        },
        expectedDetail: {
          vi: 'Phân biệt lỗi tạm thời (429/503 -> retry) với lỗi vĩnh viễn (số điện thoại sai định dạng -> dừng ngay, ghi log).',
          en: 'Distinguished transient 429/5xx errors (retry) from permanent 4xx errors (do not retry).',
        },
      },
      {
        id: 'ntf-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Thiết kế Circuit Breaker và định tuyến chuyển dự phòng giữa nhiều nhà cung cấp SMS/Email (Multi-provider Failover).',
          en: 'Added Circuit Breakers with automatic failover to a secondary SMS/Email provider when primary fails.',
        },
        expectedDetail: {
          vi: 'Giữ tỷ lệ thành công của mã OTP ở mức > 99,9% ngay cả khi một cổng viễn thông gặp sự cố.',
          en: 'Maintains high OTP delivery reliability during single-vendor incidents.',
        },
      },
      {
        id: 'ntf-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý phản hồi Webhook bất đồng bộ (bounced email, invalid push token) và thiết lập cảnh báo độ trễ hàng đợi P0.',
          en: 'Processed provider feedback webhooks (hard bounces, stale push tokens) and monitored P0 queue lag SLOs.',
        },
        expectedDetail: {
          vi: 'Không tự dọn email bounce sẽ làm giảm điểm uy tín tên miền gửi thư.',
          en: 'Cleaning hard bounces and dead tokens preserves sender reputation and cuts wasted calls.',
        },
      },
    ],
    recommendedComponents: [
      'api-gateway',
      'redis-cache-aside',
      'idempotency-store',
      'kafka-queue',
      'priority-dlq',
      'worker-pool',
      'pg-primary-replica',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Các dịch vụ nội bộ gọi Ingestion API kèm `idempotency_key` và `priority`. Dịch vụ kiểm tra xác thực, tra cứu cài đặt người dùng & giới hạn tần suất qua Redis Cache, rồi phân luồng vào các topic Kafka tách biệt theo cả mức ưu tiên (`P0-Critical`, `P1-Transactional`, `P2-Bulk`) lẫn kênh (`APNs`, `FCM`, `Email`, `SMS`). Mỗi kênh sở hữu cụm Async Workers riêng có Outbound Rate Limiter tuân thủ quota nhà cung cấp, dựng nội dung từ Template Cache, kiểm tra khoá chống gửi trùng lần cuối và gọi đối tác qua Circuit Breaker (có chuyển dự phòng sang đối tác thứ hai cho SMS). Bản tin lỗi quá số lần thử được đưa vào DLQ; Webhook Receiver ghi nhận trạng thái `DELIVERED/BOUNCED` và thu hồi token hỏng.',
        en: 'Internal services call the Ingestion API with an `idempotency_key` and `priority`. Ingestion validates payloads, checks Redis-cached user preferences and frequency caps, and routes events into isolated Kafka topics partitioned by Priority (`P0`, `P1`, `P2`) × Channel (`APNs`, `FCM`, `Email`, `SMS`). Dedicated channel Worker Pools apply outbound vendor rate limiting, render cached templates, verify deduplication state, and call providers behind Circuit Breakers (with secondary vendor failover for SMS/Email). Exhausted retries land in a DLQ while a Webhook Receiver updates delivery logs and prunes invalid tokens.',
      },
      writePath: {
        vi: 'Internal Producer -> POST /v1/notifications/send -> Kiểm tra Idempotency & User Preferences (Redis/DB) -> Ghi topic ưu tiên tương ứng (`p0.sms`, `p2.push`...) -> Trả 202 Accepted -> Channel Worker tiêu thụ theo tốc độ cho phép của Provider -> Gọi Provider (hoặc Failover Provider) -> Cập nhật trạng thái.',
        en: 'Internal Producer -> POST /v1/notifications/send -> Check Idempotency & Preferences -> Enqueue into isolated priority+channel topic -> Return 202 Accepted -> Channel Worker shapes outbound rate -> Render template & call Provider (with failover) -> Persist status.',
      },
      readPath: {
        vi: 'Chiến dịch hàng loạt: Campaign Service đọc danh sách phân khúc theo lô (streaming cursor) và đẩy dần vào hàng đợi `P2-Bulk` với tốc độ kiểm soát để không gây nghẽn bộ nhớ; Dashboard đọc số liệu tổng hợp gửi/mở từ kho phân tích.',
        en: 'Bulk campaigns stream recipient segments in paced batches into `P2-Bulk` topics; internal teams query delivery state and open/bounce metrics via status APIs.',
      },
      tradeoffs: [
        {
          vi: 'Tách nhiều hàng đợi và cụm Worker riêng (Priority × Channel): tăng chi phí cấu hình vận hành nhưng loại bỏ hoàn toàn nguy cơ chiến dịch tiếp thị làm trễ OTP hoặc một kênh lỗi kéo theo kênh khác.',
          en: 'Separate Priority × Channel queues add operational topics/deployments in exchange for strict bulkhead isolation of critical OTP traffic.',
        },
        {
          vi: 'At-least-once kèm Idempotency Store thay vì giao dịch phân tán: thực tế với API bên ngoài không hỗ trợ 2PC, giảm thiểu tối đa gửi lặp xuống ngưỡng rất nhỏ khi mạng đứt ngay sau lúc đối tác đã gửi.',
          en: 'At-least-once queuing plus idempotency store handles non-transactional third-party HTTP APIs cleanly without distributed locks.',
        },
      ],
    },
  },

  // =========================================================================
  // 6. Ride-Hailing Geo Dispatch — S7-04 (Senior)
  // =========================================================================
  {
    id: 'iv-ride-hailing',
    order: 6,
    level: 'Senior',
    relatedModuleId: 'S7-04',
    secondaryModuleIds: ['S2-09', 'S4-09', 'S3-07'],
    title: {
      vi: 'Thiết kế Ride-Hailing Geo Dispatch (cập nhật vị trí mỗi 4 giây)',
      en: 'Design Ride-Hailing Geo Dispatch (4s Location Updates)',
    },
    scaleTag: {
      vi: '1M tài xế trực tuyến · 250K ghi vị trí/giây · Geohash/H3',
      en: '1M active drivers · 250K GPS writes/s · Geohash/H3',
    },
    openingBrief: {
      vi: 'Thiết kế hệ thống cập nhật vị trí tài xế theo thời gian thực, tìm kiếm xe trống gần hành khách và điều phối ghép chuyến cho ứng dụng đặt xe.',
      en: 'Design the real-time driver location tracking, nearby-vehicle search, and trip dispatch matching engine for a ride-hailing platform.',
    },
    hiddenAssumptions: [
      {
        id: 'geo-a1',
        topic: { vi: 'Quy mô tài xế trực tuyến & Tần suất ping GPS', en: 'Online Drivers & GPS Ping Frequency' },
        question: {
          vi: 'Có bao nhiêu tài xế trực tuyến đồng thời, gửi toạ độ bao lâu một lần và có bao nhiêu yêu cầu đặt chuyến/ngày?',
          en: 'How many drivers are online simultaneously, how often do they report GPS, and what is daily ride volume?',
        },
        interviewerAnswer: {
          vi: '1 triệu tài xế trực tuyến đồng thời toàn cầu, ứng dụng tài xế gửi toạ độ mỗi 4 giây. Có 20 triệu chuyến xe hoàn thành mỗi ngày (đỉnh khoảng 1.000 yêu cầu ghép chuyến/giây).',
          en: '1M concurrent online drivers reporting GPS every 4 seconds, serving 20M completed rides per day (~1,000 match requests/s at peak).',
        },
        designImpact: {
          vi: '1M / 4s = 250.000 lượt ghi vị trí/giây! Không thể cập nhật B-tree/R-tree trên đĩa truyền thống cho mỗi ping; phải dùng chỉ mục không gian trong bộ nhớ (RAM).',
          en: '250,000 location writes/s rules out disk-backed relational spatial indexes on the hot path; requires sharded in-memory spatial state.',
        },
      },
      {
        id: 'geo-a2',
        topic: { vi: 'Quy trình mời chuyến & Chống ghép trùng tài xế', en: 'Driver Offer Lock & Double-Dispatch Prevention' },
        question: {
          vi: 'Hệ thống gửi lời mời cho nhiều tài xế đua nhau bấm hay gửi tuần tự có khóa giữ chỗ?',
          en: 'Do we broadcast a ride to multiple drivers simultaneously or offer sequentially with an exclusive hold?',
        },
        interviewerAnswer: {
          vi: 'Mời tuần tự theo xếp hạng khoảng cách/ETA tốt nhất: mỗi lời mời khóa tạm thời tài xế đó trong 12 giây. Một tài xế tuyệt đối không nhận 2 chuyến cùng lúc và 1 chuyến không gán cho 2 tài xế.',
          en: 'Offer sequentially by best ETA: lock the candidate driver exclusively for 12 seconds awaiting acceptance. Never double-assign a driver or a trip.',
        },
        designImpact: {
          vi: 'Cần khoá phân tán nguyên tử có TTL (`SET driver_lock:{id} {trip_id} NX EX 12`) và máy trạng thái chuyến đi chặt chẽ trong DB.',
          en: 'Requires atomic TTL reservation locks (`SET NX EX 12`) per candidate driver plus transactional trip state transitions.',
        },
      },
      {
        id: 'geo-a3',
        topic: { vi: 'Ô nóng sân bay / giờ tan tầm (Hot Cell)', en: 'Airport & Rush-Hour Hot Cells' },
        question: {
          vi: 'Mật độ tài xế và hành khách có tập trung dồn vào một vài khu vực nhỏ như sân bay hay trung tâm thành phố không?',
          en: 'Does traffic concentrate heavily inside dense zones like airports or downtown districts?',
        },
        interviewerAnswer: {
          vi: 'Rất lệch: một vài km² ở sân bay hoặc sân vận động lúc tan sự kiện có thể tập trung hàng nghìn tài xế và hàng chục nghìn lượt làm mới bản đồ mỗi giây.',
          en: 'Extremely skewed: a single airport or stadium zone can hold thousands of drivers and tens of thousands of map queries per second.',
        },
        designImpact: {
          vi: 'Phân mảnh cứng theo thành phố dễ tạo hot shard ở thành phố lớn; cần phân mảnh theo ô Geohash/H3 mịn kết hợp bản sao đọc hoặc chia nhỏ ô nóng.',
          en: 'City-level sharding creates severe hot spots; shard by fine-grained Geohash/H3 regions with read replicas / short cache for rider map views.',
        },
      },
    ],
    napkinPreset: {
      dau: 10_000_000,
      readsPerUserPerDay: 8,
      writesPerUserPerDay: 21.6,
      payloadKb: 0.2,
      retentionYears: 1,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Thông lượng ghi vị trí tài xế', en: 'Driver GPS Write Throughput' },
        value: '250.000 ghi/giây (liên tục)',
        formula: {
          vi: '1.000.000 tài xế trực tuyến / 4 giây = 250.000 bản cập nhật vị trí/giây',
          en: '1,000,000 online drivers / 4 seconds = 250,000 location updates/s',
        },
      },
      {
        metric: { vi: 'Bộ nhớ RAM cho vị trí hiện tại của toàn bộ tài xế', en: 'RAM for Current Driver Locations' },
        value: '≈ 200–300 MB (cực nhỏ!)',
        formula: {
          vi: '1M tài xế × ~200 B (`driver_id`, `lat`, `lng`, `cell_id`, `status`, `updated_at`) ≈ 200 MB',
          en: '1M active drivers × ~200 B (`driver_id`, `lat`, `lng`, `cell_id`, `status`, `ts`) ≈ 200 MB',
        },
      },
      {
        metric: { vi: 'Lưu lượng tìm xe & Đặt chuyến', en: 'Nearby Reads & Dispatch RPS' },
        value: '≈ 3.000–10.000 đọc/s · ≈ 1.000 ghép chuyến/s peak',
        formula: {
          vi: '20M chuyến/ngày ≈ 230 chuyến/s avg (đỉnh ~1.000/s); hành khách mở màn hình xem xe xung quanh gấp ~5–10 lần',
          en: '20M rides/day ≈ 230/s avg (~1,000/s peak); rider map viewport queries are ~5–10× higher',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'geo-s1',
          text: {
            vi: 'Làm rõ tần suất gửi GPS (1M tài xế mỗi 4 giây), bán kính tìm xe (2–5 km) và luồng khóa mời chuyến 12 giây.',
            en: 'Clarify GPS ping rate (1M drivers every 4s), search radius (2–5 km), and 12s exclusive driver offer hold.',
          },
        },
        {
          id: 'geo-s2',
          text: {
            vi: 'Phân biệt nhất quán cuối cùng cho vị trí hiển thị trên bản đồ (chấp nhận trễ 4s) và nhất quán mạnh cho việc gán chuyến.',
            en: 'Contrast eventual consistency for map pins (~4s) against strong consistency for trip/driver assignment.',
          },
        },
      ],
      N: [
        {
          id: 'geo-n1',
          text: {
            vi: 'Tính ra con số 250.000 ghi/giây nhưng trạng thái hiện tại của 1M tài xế chỉ tốn ~200 MB RAM!',
            en: 'Derive BOTH 250,000 writes/s AND the key insight that current state of 1M drivers fits in ~200 MB RAM.',
          },
        },
        {
          id: 'geo-n2',
          text: {
            vi: 'Tách dung lượng trạng thái hiện tại (ghi đè trong RAM) khỏi luồng lưu vết hành trình lịch sử (~4,3 TB/ngày nếu giữ thô, cần nén/lấy mẫu).',
            en: 'Separate mutable current-location RAM state from historical breadcrumb telemetry pushed asynchronously via Kafka.',
          },
        },
      ],
      A: [
        {
          id: 'geo-a-c1',
          text: {
            vi: 'Định nghĩa gói tin cập nhật vị trí (`driver_id`, `lat`, `lng`, `bearing`, `status`), API `GET /v1/drivers/nearby` và `POST /v1/trips`.',
            en: 'Define location update payload (`driver_id`, `lat`, `lng`, `bearing`, `status`), `GET /v1/drivers/nearby`, and `POST /v1/trips`.',
          },
        },
        {
          id: 'geo-a-c2',
          text: {
            vi: 'Thiết kế cấu trúc chỉ mục không gian (`cell_id -> Hash/Set các driver`) + bảng `driver_cell_map` để chuyển ô khi tài xế di chuyển.',
            en: 'Design spatial index (`cell_id -> active drivers`) + `driver_last_cell` lookup to move drivers cleanly across cell boundaries.',
          },
        },
      ],
      K: [
        {
          id: 'geo-k1',
          text: {
            vi: 'So sánh truy vấn `WHERE lat BETWEEN...` trên SQL với Geohash / H3 Hexagonal Grid / Quadtree và giải quyết lỗi biên bằng truy vấn 1 ô tâm + các ô kề (k-ring).',
            en: 'Compare SQL lat/lng scans vs Geohash / Uber H3 / Quadtree, querying center cell + neighbor ring to solve boundary edge cases.',
          },
        },
        {
          id: 'geo-k2',
          text: {
            vi: 'Thiết kế luồng Dispatch: tìm ứng viên theo ô H3/Geohash -> tính ETA đường đi -> khoá nguyên tử `SET NX EX 12` tài xế #1 -> đẩy lời mời qua WebSocket -> chuyển tài xế #2 nếu từ chối/hết giờ.',
            en: 'Trace Dispatch flow: query nearby cells -> rank by road ETA -> acquire `SET NX EX 12` driver lock -> push WS offer -> fallback to next candidate on timeout/reject.',
          },
        },
      ],
      E: [
        {
          id: 'geo-e1',
          text: {
            vi: 'Xử lý tài xế mất kết nối (ma trên bản đồ) bằng TTL hết hạn tự động (15–20 giây không ping thì coi như không sẵn sàng).',
            en: 'Eliminate ghost drivers when mobile apps lose signal by expiring stale location entries after 15–20 seconds.',
          },
        },
        {
          id: 'geo-e2',
          text: {
            vi: 'Giải quyết Hot Cell ở sân bay / sự kiện lớn: cache ngắn hạn (1–2s) kết quả xem bản đồ theo ô, hàng đợi ghép theo lô (batch matching) và tách phân mảnh theo ô mịn.',
            en: 'Mitigate airport/event hot cells via 1–2s cell-level read caching for rider maps, fine-grained cell sharding, and micro-batch matching.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'geo-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Làm rõ 2 bài toán có bản chất khác nhau: luồng cập nhật vị trí thông lượng cực cao và luồng ghép chuyến nhất quán mạnh.',
          en: 'Separated high-throughput ephemeral location tracking from strongly consistent trip assignment.',
        },
        expectedDetail: {
          vi: 'Vị trí trễ 4 giây là bình thường, nhưng gán 1 tài xế cho 2 khách là lỗi nghiêm trọng.',
          en: 'Stale map pins by 4s are benign, whereas double-booking a driver breaks core business invariants.',
        },
      },
      {
        id: 'geo-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Hỏi rõ cơ chế mời chuyến (tuần tự có thời gian chờ 10–15s) và sự chênh lệch mật độ theo khu vực.',
          en: 'Clarified sequential offer-with-timeout mechanics and geographic density skew.',
        },
        expectedDetail: {
          vi: 'Định hình trực tiếp cách thiết kế khoá đặt chỗ tài xế và cách chia shard.',
          en: 'Directly informs driver reservation locks and spatial sharding strategy.',
        },
      },
      {
        id: 'geo-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng 250.000 lượt ghi vị trí/giây VÀ nhận ra toàn bộ vị trí mới nhất của 1M tài xế chỉ chiếm ~200–300 MB RAM.',
          en: 'Computed 250,000 GPS writes/s AND recognized that latest state for 1M drivers fits in ~200–300 MB RAM.',
        },
        expectedDetail: {
          vi: 'Nhận xét định lượng then chốt giải thích vì sao lưu trạng thái hiện tại trong RAM vừa nhanh vừa rẻ.',
          en: 'Crucial quantitative insight justifying an in-memory mutable location index.',
        },
      },
      {
        id: 'geo-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Phân biệt ghi đè trạng thái hiện tại với lưu chuỗi toạ độ lịch sử phục vụ tính cước/đối soát qua luồng bất đồng bộ.',
          en: 'Separated in-place latest-location overwrites from append-only trip breadcrumb archival.',
        },
        expectedDetail: {
          vi: 'Chỉ đẩy chuỗi điểm sang Kafka để gom lô ghi xuống kho lưu trữ thay vì ghi từng ping vào SQL.',
          en: 'Batches historical GPS traces asynchronously via Kafka rather than hitting OLTP DBs at 250K RPS.',
        },
      },
      {
        id: 'geo-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Định nghĩa rõ giao diện cập nhật vị trí (qua WebSocket/gRPC giữ kết nối), tạo chuyến (có `idempotency_key`) và phản hồi nhận chuyến.',
          en: 'Defined persistent WebSocket/gRPC location stream, idempotent `POST /trips`, and driver accept/decline endpoints.',
        },
        expectedDetail: {
          vi: 'Giữ kết nối liên tục cho tài xế vừa dùng gửi GPS nhẹ vừa nhận ngay thông báo mời chuyến chiều ngược lại.',
          en: 'Persistent driver connection serves both frequent upstream pings and instant downstream dispatch offers.',
        },
      },
      {
        id: 'geo-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Thiết kế cấu trúc lưu trữ hai bảng ánh xạ trong bộ nhớ: `cell -> tập tài xế` và `driver_id -> cell_cũ` để xoá khỏi ô cũ O(1) khi sang ô mới.',
          en: 'Modeled both `cell -> drivers` and `driver_id -> prev_cell` so cell transitions clean up in O(1).',
        },
        expectedDetail: {
          vi: '90% các lần ping 4 giây tài xế vẫn nằm trong cùng 1 ô ~500m–1km nên chỉ cần cập nhật toạ độ mà không đổi tập hợp ô.',
          en: 'Most 4-second pings stay within the same cell, avoiding index structure mutations.',
        },
      },
      {
        id: 'geo-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Sử dụng Geohash (cấp 6 ~1,2 km × 0,6 km) hoặc lưới lục giác H3 và truy vấn ô trung tâm + các ô kề cạnh để không bỏ sót xe bên kia ranh giới ô.',
          en: 'Used Geohash (precision 6) or H3 hexagons and queried center + neighbor ring (8 Geohash neighbors / H3 1-ring) to avoid boundary misses.',
        },
        expectedDetail: {
          vi: 'Hai điểm cách nhau 50 mét có thể khác tiền tố Geohash nếu nằm sát đường biên chia ô.',
          en: 'Adjacent streets across a Geohash seam share different prefixes unless neighbor cells are included.',
        },
      },
      {
        id: 'geo-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Xếp hạng ứng viên theo thời gian di chuyển thực tế trên mạng lưới đường (Road ETA) thay vì chỉ tính khoảng cách chim bay.',
          en: 'Filtered candidates spatially first, then ranked top-K by road-network ETA rather than pure Euclidean distance.',
        },
        expectedDetail: {
          vi: 'Xe cách 300 m bên kia sông hoặc chiều ngược đường cao tốc có ETA lâu hơn xe cách 800 m cùng chiều.',
          en: 'Rivers and one-way highways make straight-line distance misleading without road-graph ETA scoring.',
        },
      },
      {
        id: 'geo-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Sử dụng khoá giữ chỗ có TTL cho tài xế kết hợp giao dịch trạng thái chuyến đi (`REQUESTED -> MATCHED`) chống ghép trùng.',
          en: 'Prevented double-dispatch using atomic TTL driver reservation locks plus CAS/transactional trip state updates.',
        },
        expectedDetail: {
          vi: 'Nếu tài xế bấm chấp nhận ở giây 13 sau khi khoá 12s đã hết hạn và hệ thống đã mời người khác, CAS trên bảng `trips` từ chối an toàn.',
          en: 'Fencing/conditional update on `trips.status` handles late driver acceptances racing with timeout expiration.',
        },
      },
      {
        id: 'geo-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Loại bỏ tài xế mất tín hiệu (stale/ghost drivers) bằng kiểm tra `now - last_ping_ts <= 15s` hoặc TTL tự dọn.',
          en: 'Handled disconnected/ghost drivers via `last_ping_ts` freshness filtering and TTL eviction.',
        },
        expectedDetail: {
          vi: 'Tránh gửi lời mời vô ích cho xe vừa đi vào hầm mất sóng khiến hành khách phải chờ hết 12 giây.',
          en: 'Prevents wasting 12-second offer windows on drivers who entered a tunnel or killed the app.',
        },
      },
      {
        id: 'geo-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý Hot Cell (sân bay, sân vận động) bằng phân mảnh theo hash của `cell_id`, bản sao đọc cho màn hình bản đồ hoặc chia ô mịn hơn.',
          en: 'Mitigated airport/event hot cells via hashed cell sharding, short-TTL viewport read caching, or adaptive cell subdivision.',
        },
        expectedDetail: {
          vi: 'Tách truy vấn "hiển thị icon xe trên màn hình" (cache 2s theo ô) khỏi truy vấn "ghép chuyến thật".',
          en: 'Caching cosmetic nearby-car map views for 1–2s per cell shields the live dispatch index.',
        },
      },
      {
        id: 'geo-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Nêu ưu điểm ghép theo lô ngắn (Windowed Batch Matching 1–2 giây bằng tối ưu toàn cục) so với ghép tham lam ai đến trước ở khu đông đúc.',
          en: 'Discussed micro-batch bipartite matching (1–2s window) vs greedy first-come matching in dense areas.',
        },
        expectedDetail: {
          vi: 'Giảm tổng thời gian đón trung bình cho cả nhóm khách và tài xế trong cùng một khu vực.',
          en: 'Global matching over a short window reduces aggregate pickup ETA compared to greedy matching.',
        },
      },
    ],
    recommendedComponents: [
      'l7-lb',
      'ws-gateway',
      'geo-index',
      'redis-cache-aside',
      'idempotency-store',
      'kafka-queue',
      'pg-primary-replica',
      'consistent-hash-shards',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Ứng dụng tài xế giữ kết nối WebSocket/gRPC tới Gateway, gửi toạ độ mỗi 4 giây vào Location Service. Location Service tính mã ô không gian (Geohash cấp 6 hoặc H3 res-8), cập nhật trạng thái hiện tại trong cụm Redis/In-Memory Geo Index phân mảnh theo hash của `cell_id` (chỉ cập nhật tập hợp ô khi tài xế thực sự bước sang ô mới) và đẩy bản sao sự kiện vào Kafka để lưu lịch sử hành trình. Khi khách đặt chuyến, Dispatch Service truy vấn ô hiện tại + vòng ô lân cận để lấy các tài xế rảnh có `last_ping < 15s`, gọi ETA Service chấm điểm đường đi, rồi lặp qua danh sách ứng viên: chiếm khoá `SET driver_lock:{id} NX EX 12`, đẩy lời mời qua WebSocket, và chốt giao dịch trong Trip DB khi tài xế xác nhận.',
        en: 'Driver apps stream 4-second GPS pings over persistent WebSocket/gRPC gateways to Location Service, which computes Geohash-6 / H3 cell IDs, updates sharded in-memory Geo Index state (mutating cell sets only on cell boundary crossings), and emits raw traces asynchronously to Kafka. On ride request, Dispatch Service queries the pickup cell plus neighbor ring for fresh `AVAILABLE` drivers (`last_ping < 15s`), ranks candidates via Road ETA Service, acquires an atomic `SET NX EX 12` reservation lock on the top driver, pushes the offer over WebSocket, and commits the match transactionally in Trip DB.',
      },
      writePath: {
        vi: 'Driver GPS Ping (4s) -> WS Gateway -> Location Service -> Tra `prev_cell` của tài xế: cập nhật `(lat, lng, ts)` trong RAM; nếu `new_cell != prev_cell` thì chuyển thành viên giữa 2 ô -> Đẩy bất đồng bộ vào Kafka cho Billing/Analytics.',
        en: 'Driver GPS Ping (4s) -> WS Gateway -> Location Service -> Update `(lat, lng, ts)` in sharded Geo Store (moving across cell sets only if `new_cell != prev_cell`) -> Async Kafka stream for trip trace archival.',
      },
      readPath: {
        vi: 'POST /v1/trips -> Lưu trạng thái `REQUESTED` -> Dispatch đọc ô tâm + 8 ô kề (mở rộng vòng nếu thiếu xe) -> Lọc `last_ping < 15s` -> Tính Road ETA -> Lock `driver_id` 12s -> Gửi lời mời qua WS -> Tài xế Accept -> CAS cập nhật `trips.status = MATCHED`.',
        en: 'POST /v1/trips -> Persist `REQUESTED` -> Query pickup cell + neighbor ring -> Filter fresh pings -> Rank by Road ETA -> Lock candidate 12s -> Push WS offer -> Driver accepts -> Conditional update `trips.status = MATCHED`.',
      },
      tradeoffs: [
        {
          vi: 'Geohash/H3 cố định trong Redis so với cây Quadtree động trong bộ nhớ: Quadtree tự chia nhỏ ô đông người nhưng khó đồng bộ và phân mảnh ngang hơn lưới H3/Geohash không trạng thái cấu trúc.',
          en: 'Fixed H3/Geohash cells vs dynamic Quadtrees: fixed grids hash-shard statelessly across nodes, whereas Quadtrees adapt to density automatically but complicate rebalancing.',
        },
        {
          vi: 'Ghép lô 1–2 giây so với ghép tức thì: tăng độ trễ chờ ghép thêm ~1 giây nhưng tối ưu tổng quãng đường đón cho cả cụm khách lúc cao điểm.',
          en: '1–2s micro-batch matching adds ~1s dispatch wait in exchange for lower city-wide pickup times.',
        },
      ],
    },
  },

  // =========================================================================
  // 7. Video Streaming & Transcoding Pipeline — S7-05 (Senior)
  // =========================================================================
  {
    id: 'iv-video-streaming',
    order: 7,
    level: 'Senior',
    relatedModuleId: 'S7-05',
    secondaryModuleIds: ['S2-12', 'S4-03', 'S2-04'],
    title: {
      vi: 'Thiết kế Video Streaming & Transcoding Pipeline',
      en: 'Design a Video Streaming & Transcoding Pipeline',
    },
    scaleTag: {
      vi: '50M DAU · 500K upload/ngày · HLS/DASH + CDN',
      en: '50M DAU · 500K uploads/day · HLS/DASH + CDN',
    },
    openingBrief: {
      vi: 'Thiết kế nền tảng chia sẻ và phát video theo yêu cầu (VOD) quy mô lớn: nhà sáng tạo tải video gốc lên, người xem trên điện thoại 4G đến TV 4K đều xem mượt không giật.',
      en: 'Design a large-scale video-on-demand (VOD) sharing platform where creators upload raw videos and viewers stream smoothly across 4G mobile connections and 4K TVs.',
    },
    hiddenAssumptions: [
      {
        id: 'vid-a1',
        topic: { vi: 'Quy mô tải lên, Lượt xem & Livestream', en: 'Upload Volume, View Scale & Scope' },
        question: {
          vi: 'Hệ thống tập trung vào video tải lên sẵn (VOD) hay cả phát trực tiếp (Livestream)? Quy mô video mới và lượt xem mỗi ngày là bao nhiêu?',
          en: 'Are we scoping Video-on-Demand (VOD) only or live streaming too, and what are daily upload/view numbers?',
        },
        interviewerAnswer: {
          vi: 'Tập trung vào VOD (Livestream để ngoài phạm vi). Hệ thống có 50M DAU, mỗi ngày nhận 500.000 video tải lên (dài trung bình 5 phút, tệp gốc ~300 MB) và phục vụ 500 triệu lượt xem video/ngày.',
          en: 'Focus on VOD (live streaming is out of scope). 50M DAU uploading 500,000 new videos/day (avg 5 min, ~300 MB raw) and watching 500M video views/day.',
        },
        designImpact: {
          vi: 'Tệp nhị phân 300 MB–vài GB tuyệt đối không đẩy qua App Server; dùng Presigned Multipart Upload thẳng lên Object Storage.',
          en: '300 MB+ raw files must bypass application servers via Resumable Presigned Multipart Uploads directly to Object Storage.',
        },
      },
      {
        id: 'vid-a2',
        topic: { vi: 'Đa độ phân giải & Adaptive Bitrate', en: 'Multi-Resolution & Adaptive Bitrate' },
        question: {
          vi: 'Làm thế nào để người xem trên mạng di động chập chờn không bị đứng hình và sau bao lâu kể từ lúc upload thì video xem được?',
          en: 'How should playback adapt to fluctuating mobile bandwidth, and how fast must uploaded videos become playable?',
        },
        interviewerAnswer: {
          vi: 'Hỗ trợ Adaptive Bitrate (HLS/DASH) ở các mức 360p, 720p, 1080p và 4K (cắt đoạn 2–4 giây). Bản 360p/720p nên sẵn sàng xem được trong vòng 1–2 phút kể từ khi tải xong tệp gốc.',
          en: 'Support HLS/DASH adaptive bitrate across 360p, 720p, 1080p, and 4K (2–4s segments). 360p/720p renditions should become playable within 1–2 minutes of upload completion.',
        },
        designImpact: {
          vi: 'Không để 1 worker mã hoá tuần tự cả video dài; tách theo GOP/chunk để mã hoá song song và xuất bản độ phân giải thấp trước.',
          en: 'Split videos on GOP boundaries for parallel chunk transcoding and publish lower resolutions progressively before 4K finishes.',
        },
      },
      {
        id: 'vid-a3',
        topic: { vi: 'Phân phối nội dung & Chi phí băng thông / lưu trữ', en: 'CDN Delivery & Storage/Egress Cost' },
        question: {
          vi: 'Phân bố lượt xem giữa các video có đều không và chi phí hạ tầng nào lớn nhất cần tối ưu?',
          en: 'How skewed are video views, and which infrastructure cost dominates?',
        },
        interviewerAnswer: {
          vi: 'Tuân theo phân phối Pareto mạnh: 5–10% video phổ biến chiếm > 85% băng thông xem, còn phần lớn video cũ hầu như không có người xem sau vài tháng. Băng thông ra (CDN egress) và lưu trữ đa bản mã hoá là hai khoản chi lớn nhất.',
          en: 'Strong power-law skew: top 5–10% of videos drive > 85% of egress, while long-tail uploads rarely get watched. CDN egress and multi-rendition storage dominate costs.',
        },
        designImpact: {
          vi: 'Đặt CDN Edge + Origin Shield cho video nóng, dùng codec hiệu quả và chỉ mã hoá sẵn các cấu hình đắt đỏ (AV1/4K) hoặc chuyển tầng lạnh cho video ít lượt xem.',
          en: 'Serve hot segments from CDN Edge + Origin Shield; reserve expensive codecs (AV1) for popular videos and tier cold long-tail objects.',
        },
      },
    ],
    napkinPreset: {
      dau: 50_000_000,
      readsPerUserPerDay: 10,
      writesPerUserPerDay: 0.01,
      payloadKb: 300,
      retentionYears: 5,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Tốc độ tải lên & Dung lượng thô mỗi ngày', en: 'Upload Rate & Raw Daily Ingest' },
        value: '≈ 5,8 video/s avg · ≈ 150 TB thô/ngày',
        formula: {
          vi: '500.000 video/ngày × 300 MB = 150 TB thô/ngày; sau transcode đa mức (360p..1080p) giữ ~200 TB/ngày',
          en: '500K uploads/day × 300 MB = 150 TB raw/day; encoded renditions add ~200 TB/day',
        },
      },
      {
        metric: { vi: 'Tăng trưởng lưu trữ Video 5 năm', en: '5-Year Encoded Video Storage' },
        value: '≈ 365 PB (cần phân tầng nóng / lạnh)',
        formula: {
          vi: '200 TB/ngày × 365 × 5 ≈ 365 PB (chuyển bản gốc & video cũ sang Cold/Archive giảm 60–70% chi phí)',
          en: '200 TB/day × 365 × 5 ≈ 365 PB (cold-tiering raw/unwatched videos cuts storage spend 60–70%)',
        },
      },
      {
        metric: { vi: 'Băng thông phát video đỉnh ở tầng CDN', en: 'Peak Streaming Egress Bandwidth' },
        value: '≈ 15–30 Tbps tại CDN Edge',
        formula: {
          vi: 'Giả sử đỉnh 5M người đang xem cùng lúc × ~4 Mbps trung bình ≈ 20 Tbps (CDN hấp thụ > 92%)',
          en: '~5M concurrent peak viewers × ~4 Mbps avg bitrate ≈ 20 Tbps served from ISP/CDN edge caches',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'vid-s1',
          text: {
            vi: 'Giới hạn phạm vi ở VOD (tải lên + phát lại mượt), làm rõ quy mô 500K upload/ngày và 500M lượt xem/ngày.',
            en: 'Scope to VOD (upload + adaptive playback), clarifying 500K daily uploads and 500M daily views.',
          },
        },
        {
          id: 'vid-s2',
          text: {
            vi: 'Xác định yêu cầu hỗ trợ tiếp tục tải lên khi đứt mạng (resumable upload), Adaptive Bitrate và tối ưu chi phí CDN/lưu trữ.',
            en: 'Capture resumable uploads, Adaptive Bitrate (HLS/DASH), fast time-to-publish, and cost constraints.',
          },
        },
      ],
      N: [
        {
          id: 'vid-n1',
          text: {
            vi: 'Tính dung lượng lưu trữ mới hàng trăm TB/ngày (~365 PB trong 5 năm) để chứng minh bắt buộc dùng Object Storage phân tầng.',
            en: 'Calculate ~200 TB/day storage growth (~365 PB in 5 yrs) to justify tiered Object Storage.',
          },
        },
        {
          id: 'vid-n2',
          text: {
            vi: 'Ước lượng băng thông phát hàng chục Tbps ở đỉnh và năng lực tính toán cần cho cụm Transcoding Workers.',
            en: 'Estimate multi-Tbps peak streaming egress and compute capacity required for transcoding workers.',
          },
        },
      ],
      A: [
        {
          id: 'vid-a-c1',
          text: {
            vi: 'Thiết kế API khởi tạo Multipart Upload (`POST /v1/videos/upload-init` trả danh sách Presigned URLs), `complete` và `GET /v1/videos/{id}/playback` trả đường dẫn HLS Master Manifest `.m3u8`.',
            en: 'Define Multipart Upload init/complete APIs (Presigned URLs) and `GET /v1/videos/{id}/playback` returning signed `.m3u8`/`.mpd` manifest URL.',
          },
        },
        {
          id: 'vid-a-c2',
          text: {
            vi: 'Thiết kế bảng `videos` (trạng thái `UPLOADING -> PROCESSING -> READY_SD -> READY_HD`) và `video_renditions`.',
            en: 'Model `videos` metadata lifecycle (`UPLOADING -> PROCESSING -> READY_SD -> READY_HD`) and `video_renditions`.',
          },
        },
      ],
      K: [
        {
          id: 'vid-k1',
          text: {
            vi: 'Tách 3 mặt phẳng: Upload trực tiếp lên Object Storage, DAG Pipeline mã hoá song song theo GOP qua Kafka + Workers, và Playback qua CDN Edge.',
            en: 'Separate three planes: Direct Multipart Upload to S3, DAG GOP-parallel Transcoding via Kafka + Workers, and CDN Edge Playback.',
          },
        },
        {
          id: 'vid-k2',
          text: {
            vi: 'Giải thích cách HLS/DASH hoạt động ở phía trình phát: đọc Master Manifest và tự đổi chất lượng `.m4s/.ts` mỗi 2–4 giây theo băng thông thực tế.',
            en: 'Explain client-side ABR: player fetches master manifest and switches 2–4s `.m4s/.ts` segments dynamically per network throughput.',
          },
        },
      ],
      E: [
        {
          id: 'vid-e1',
          text: {
            vi: 'Xử lý spike upload và worker chết giữa chừng: mỗi tác vụ mã hoá 1 chunk là luỹ đẳng, thử lại từng chunk thay vì làm lại cả video 1 giờ.',
            en: 'Handle worker failures and upload spikes via idempotent chunk-level tasks and autoscaled spot/GPU workers.',
          },
        },
        {
          id: 'vid-e2',
          text: {
            vi: 'Bảo vệ Origin khi video viral (CDN Origin Shield + Cache-Control `immutable` cho các đoạn video bất biến) và tối ưu chi phí lưu trữ lạnh / mã hoá theo độ phổ biến.',
            en: 'Protect Origin on viral releases (Origin Shield + long `immutable` segment caching) and optimize long-tail encoding/storage cost.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'vid-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Tách biệt rõ VOD với Livestream và làm rõ yêu cầu tải lên tệp lớn không ổn định mạng + phát đa chất lượng.',
          en: 'Scoped VOD vs live streaming and identified large resumable uploads plus multi-quality playback.',
        },
        expectedDetail: {
          vi: 'VOD cho phép tiền xử lý phân đoạn tĩnh và cache hiệu quả cao trên CDN.',
          en: 'VOD enables asynchronous pre-segmented HLS/DASH files with near-100% CDN cacheability.',
        },
      },
      {
        id: 'vid-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Nhận diện ràng buộc kinh tế thực tế: chi phí CDN egress và chi phí lưu trữ/CPU mã hoá cho video ít người xem.',
          en: 'Captured infrastructure cost constraints across CDN egress, storage tiers, and transcoding compute.',
        },
        expectedDetail: {
          vi: 'Với hệ thống video, thiết kế không tính chi phí sẽ không khả thi khi vận hành thực tế.',
          en: 'At petabyte scale, cost-aware tiering and selective encoding are primary architectural drivers.',
        },
      },
      {
        id: 'vid-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng quy mô lưu trữ hàng trăm TB/ngày và băng thông phát hàng chục Tbps ở đỉnh.',
          en: 'Estimated ~150–200 TB/day storage ingest and multi-Tbps peak playback egress.',
        },
        expectedDetail: {
          vi: 'Chứng minh không một cụm máy chủ gốc (Origin) nào chịu nổi nếu thiếu CDN phân tán sát ISP.',
          en: 'Proved why Origin servers cannot serve video bytes directly without edge CDNs.',
        },
      },
      {
        id: 'vid-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Tính toán khối lượng CPU/GPU cho transcoding (500K × 5 phút = 2,5 triệu phút video mới mỗi ngày).',
          en: 'Quantified daily transcoding workload (2.5M minutes of new video/day across multiple renditions).',
        },
        expectedDetail: {
          vi: 'Giải thích vì sao cần hàng đợi đàn hồi và chia nhỏ video để xử lý song song.',
          en: 'Justified elastic worker fleets and chunk-level parallelism.',
        },
      },
      {
        id: 'vid-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Thiết kế luồng Presigned Multipart Upload (init -> upload từng phần kèm ETag -> complete) cho phép resume từng phần bị lỗi.',
          en: 'Designed Resumable Multipart Upload APIs using Presigned Object Storage URLs and part ETags.',
        },
        expectedDetail: {
          vi: 'Rớt mạng ở 90% tệp 1 GB chỉ cần tải lại đúng phần 8 MB cuối thay vì tải lại từ đầu.',
          en: 'Network drops retry only the failed 8 MB part rather than restarting a 1 GB upload.',
        },
      },
      {
        id: 'vid-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Tách biệt Metadata DB (thông tin video, trạng thái xuất bản) với Manifest HLS/DASH (`.m3u8` / `.mpd`) trỏ tới các phân đoạn bất biến.',
          en: 'Separated relational/KV video metadata from HLS/DASH master & media manifests referencing immutable segments.',
        },
        expectedDetail: {
          vi: 'Hỗ trợ trạng thái sẵn sàng từng phần (`READY_360P` cho xem ngay trong lúc chờ `1080P/4K`).',
          en: 'Progressive state transitions let creators share playable SD video while HD/4K finishes.',
        },
      },
      {
        id: 'vid-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Không bao giờ đẩy luồng byte video qua API Server; cả tải lên (Presigned S3) lẫn phát lại (CDN) đều đi đường dữ liệu riêng.',
          en: 'Kept control-plane API servers completely out of binary upload and playback byte paths.',
        },
        expectedDetail: {
          vi: 'API Server chỉ cấp quyền (Presigned URL / Signed CDN Cookie) và phục vụ metadata JSON nhẹ.',
          en: 'Control plane issues short-lived signed URLs/cookies and serves lightweight JSON metadata only.',
        },
      },
      {
        id: 'vid-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Thiết kế Transcoding DAG Pipeline: kiểm tra hợp lệ -> cắt theo ranh giới khung hình chính (GOP) -> mã hoá song song đa độ phân giải + trích ảnh thu nhỏ -> ghép manifest.',
          en: 'Designed a DAG Transcoding Pipeline: probe/validate -> split on GOP keyframes -> parallel multi-bitrate encode + thumbnails -> package HLS/DASH manifests.',
        },
        expectedDetail: {
          vi: 'Giúp video dài 1 giờ vẫn có thể xuất bản trong vài phút nhờ chạy song song nhiều worker.',
          en: 'GOP splitting turns a slow sequential encode into fast embarrassingly parallel chunk jobs.',
        },
      },
      {
        id: 'vid-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Giải thích chính xác cơ chế Adaptive Bitrate (ABR) trên trình phát với các đoạn nhỏ 2–4 giây qua CDN.',
          en: 'Accurately explained client-driven Adaptive Bitrate segment switching over standard HTTP/CDN.',
        },
        expectedDetail: {
          vi: 'Dùng HTTP chuẩn nên tận dụng trọn vẹn hạ tầng bộ nhớ đệm CDN toàn cầu mà không cần giao thức streaming trạng thái riêng.',
          en: 'Chunked HTTP segments leverage standard stateless CDN edge caches worldwide.',
        },
      },
      {
        id: 'vid-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Bảo vệ Object Storage gốc bằng tầng CDN Origin Shield và đặt `Cache-Control: public, max-age=31536000, immutable` cho phân đoạn video.',
          en: 'Shielded Origin storage using CDN Origin Shield and long-TTL `immutable` headers on video segments.',
        },
        expectedDetail: {
          vi: 'Khi video mới vừa lên sóng có 1 triệu người bấm xem ở 100 PoP CDN, Origin Shield gom lại chỉ 1 lần đọc từ S3.',
          en: 'Origin Shield collapses misses from hundreds of edge PoPs into a single origin fetch.',
        },
      },
      {
        id: 'vid-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Tối ưu chi phí: chỉ mã hoá H.264 cơ bản cho mọi video mới, còn cấu hình tốn CPU (VP9/AV1) chỉ chạy cho video vượt ngưỡng lượt xem; chuyển lạnh tệp gốc.',
          en: 'Optimized compute/storage spend via popularity-triggered AV1/VP9 encoding and cold archival of raw source files.',
        },
        expectedDetail: {
          vi: 'Tiết kiệm lớn tài nguyên tính toán vì phần lớn video tải lên có rất ít lượt xem.',
          en: 'Avoids burning heavy AV1 compute on long-tail videos with < 10 views.',
        },
      },
      {
        id: 'vid-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Chịu lỗi ở tầng Worker (checkpoint từng đoạn GOP, dùng Spot Instances có hàng đợi ưu tiên cho bản 360p trước bản 4K) và bảo vệ nội dung riêng tư bằng Signed CDN Token.',
          en: 'Handled spot-worker preemption via idempotent GOP checkpoints, prioritized SD queues ahead of 4K, and secured access via short-lived signed CDN tokens.',
        },
        expectedDetail: {
          vi: 'Nếu hàng đợi transcode tăng cao giờ tối, bản 360p/720p ở hàng đợi ưu tiên cao vẫn xong nhanh.',
          en: 'Priority queues ensure basic playability stays fast even when 4K backlogs grow.',
        },
      },
    ],
    recommendedComponents: [
      'cdn-edge',
      'l7-lb',
      'api-gateway',
      'redis-cache-aside',
      'kafka-queue',
      'priority-dlq',
      'worker-pool',
      'pg-primary-replica',
      'object-storage',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Hệ thống tách hoàn toàn Mặt phẳng Điều khiển (Metadata, Upload Init, Playback Auth) khỏi Mặt phẳng Dữ liệu nặng (S3 Multipart Upload, DAG Transcoding, CDN Playback). Người đăng tải các phần 8 MB thẳng lên Raw Object Storage qua Presigned URL. Khi hoàn tất, sự kiện S3 kích hoạt DAG Orchestrator trên Kafka: kiểm tra tệp, tách theo ranh giới GOP thành các đoạn ngắn, đẩy song song vào hàng đợi ưu tiên cao (360p/720p + thumbnail) và ưu tiên thường (1080p/4K), ghi các phân đoạn `.m4s` và tệp `.m3u8` sang Encoded Object Storage. Trình phát của người xem nhận Signed Manifest URL, tự động điều chỉnh chất lượng từng đoạn 4 giây từ CDN Edge có lớp Origin Shield đứng chắn.',
        en: 'Strictly separates Control Plane (Metadata, Upload Init, Playback Auth) from Data Plane (S3 Multipart Upload, DAG Transcoding, CDN Delivery). Creators upload 8 MB parts directly to Raw Object Storage via Presigned URLs. Upload completion triggers a Kafka-backed DAG Orchestrator: probe media, split along GOP boundaries, dispatch parallel chunk tasks into High-Priority (360p/720p + thumbnails) and Standard-Priority (1080p/4K) worker pools, and write immutable `.m4s` segments + `.m3u8` manifests to Encoded Object Storage. Viewers receive signed manifest URLs and stream adaptive 4s segments from CDN Edge backed by an Origin Shield.',
      },
      writePath: {
        vi: 'Client -> POST /upload-init -> Upload các phần trực tiếp lên Raw S3 -> POST /upload-complete -> S3 Event / Kafka -> Splitter cắt GOP -> Workers mã hoá song song 360p/720p trước -> Xuất bản `.m3u8` & đổi trạng thái `READY_SD` -> Hoàn tất 1080p/4K nền.',
        en: 'Client -> POST /upload-init -> Direct Multipart Upload to Raw S3 -> POST /upload-complete -> Kafka DAG -> GOP Splitter -> Parallel SD/HD Transcode Workers -> Write segments + `.m3u8` to Encoded S3 -> Mark `READY`.',
      },
      readPath: {
        vi: 'Viewer mở trang -> Đọc Metadata từ Redis/DB Replica + Nhận Signed CDN Token -> Trình phát tải Master `.m3u8` từ CDN -> Dựa trên băng thông đo được để kéo các đoạn `.m4s` (Cache-Control immutable) từ CDN Edge -> Origin Shield -> Encoded S3.',
        en: 'Viewer opens page -> Fetch Metadata from Redis/DB + Signed CDN Token -> Player fetches `.m3u8` via CDN -> Adaptive bitrate loop downloads immutable 4s `.m4s` segments from CDN Edge -> Origin Shield -> Encoded S3.',
      },
      tradeoffs: [
        {
          vi: 'Tách GOP mã hoá song song so với mã hoá nguyên tệp: cần bước cắt/ghép điều phối DAG phức tạp hơn nhưng giảm thời gian chờ xuất bản video dài từ hàng chục phút xuống ~1–2 phút.',
          en: 'GOP-split parallel encoding vs whole-file encoding: adds DAG coordination overhead to cut time-to-publish from tens of minutes to ~1–2 minutes.',
        },
        {
          vi: 'Mã hoá chọn lọc theo lượt xem (Selective AV1): chấp nhận tốn băng thông H.264 nhỉnh hơn một chút ở video ít người xem để tiết kiệm 80%+ chi phí CPU mã hoá.',
          en: 'Popularity-gated AV1 transcoding trades slightly larger files on rarely watched videos for massive compute savings.',
        },
      ],
    },
  },

  // =========================================================================
  // 8. Payment Gateway & Double-Entry Ledger — S7-06 (Staff)
  // =========================================================================
  {
    id: 'iv-payment-ledger',
    order: 8,
    level: 'Staff',
    relatedModuleId: 'S7-06',
    secondaryModuleIds: ['S3-04', 'S3-07', 'S4-11'],
    title: {
      vi: 'Thiết kế Payment Gateway & Double-Entry Ledger chống trừ tiền kép',
      en: 'Design a Payment Gateway & Double-Entry Ledger (Zero Double-Charge)',
    },
    scaleTag: {
      vi: '20M giao dịch/ngày · Idempotency · Double-Entry + Reconciliation',
      en: '20M txns/day · Idempotency · Double-Entry + Reconciliation',
    },
    openingBrief: {
      vi: 'Thiết kế cổng thanh toán và sổ cái hạch toán cho một sàn thương mại điện tử xử lý thanh toán thẻ/ví và thanh toán cho người bán, đảm bảo không bao giờ trừ tiền khách hai lần hoặc lệch số dư.',
      en: 'Design the payment execution gateway and accounting ledger for a marketplace handling buyer checkouts and merchant settlements, guaranteeing zero double-charges and auditable financial accuracy.',
    },
    hiddenAssumptions: [
      {
        id: 'pay-a1',
        topic: { vi: 'Tính nhất quán tài chính & Khối lượng giao dịch', en: 'Financial Consistency & Transaction Volume' },
        question: {
          vi: 'Quy mô giao dịch mỗi ngày là bao nhiêu và yêu cầu ưu tiên giữa tính chính xác số liệu với độ trễ như thế nào?',
          en: 'What is daily transaction volume, and how do we prioritize correctness versus raw latency?',
        },
        interviewerAnswer: {
          vi: '20 triệu giao dịch thanh toán/ngày (trung bình ~230 TPS, đỉnh sự kiện ~1.500 TPS). Tính chính xác, kiểm toán được và không trừ tiền kép quan trọng tuyệt đối hơn việc bớt vài chục mili-giây.',
          en: '20M payment transactions/day (~230 TPS avg, ~1,500 TPS peak). Financial correctness, auditability, and zero double-charging strictly take precedence over shaving milliseconds.',
        },
        designImpact: {
          vi: '1.500 TPS nằm gọn trong khả năng của cơ sở dữ liệu quan hệ ACID phân vùng hợp lý; chọn ACID SQL + Sổ cái kép bất biến thay vì NoSQL nhất quán cuối cùng.',
          en: '1,500 peak TPS fits well within partitioned ACID relational databases; choose strict ACID SQL + immutable Double-Entry Ledger over eventually consistent stores.',
        },
      },
      {
        id: 'pay-a2',
        topic: { vi: 'Độ trễ và lỗi Timeout không rõ kết quả từ PSP ngoài', en: 'External PSP Latency & Ambiguous Timeouts' },
        question: {
          vi: 'Cổng ngân hàng / tổ chức thẻ bên ngoài (PSP như Stripe/Adyen/Ngân hàng) phản hồi mất bao lâu và điều gì xảy ra khi gặp timeout?',
          en: 'How fast are external PSP calls, and what happens when a PSP call times out?',
        },
        interviewerAnswer: {
          vi: 'Gọi PSP ngoài mất trung bình 500 ms đến 3 giây và đôi khi ngắt kết nối hoặc timeout sau khi phía ngân hàng ĐÃ trừ tiền khách.',
          en: 'External PSP calls take 500 ms–3 s and occasionally time out AFTER the bank has already captured funds.',
        },
        designImpact: {
          vi: 'Không giữ khoá giao dịch DB khi gọi mạng ra PSP; truyền `idempotency_key` sang PSP; khi timeout phải đặt trạng thái `UNKNOWN/EXECUTING` và truy vấn trạng thái PSP trước khi quyết định thử lại.',
          en: 'Never hold DB locks across PSP HTTP calls; forward PSP idempotency keys; treat timeouts as `UNKNOWN` and query PSP status before retrying.',
        },
      },
      {
        id: 'pay-a3',
        topic: { vi: 'Kiểm toán bất biến, Hoàn tiền & Đối soát cuối ngày', en: 'Immutable Audit Trail, Refunds & Reconciliation' },
        question: {
          vi: 'Sổ cái kế toán có cho phép câu lệnh UPDATE sửa số tiền không, và làm sao phát hiện lệch số liệu với sao kê ngân hàng?',
          en: 'Are in-place balance edits allowed, and how do we detect drift against bank settlement files?',
        },
        interviewerAnswer: {
          vi: 'Tuyệt đối cấm sửa/xoá lịch sử bút toán: mọi hoàn tiền hay điều chỉnh phải tạo bút toán đảo ngược mới, tổng Nợ và Có của mỗi giao dịch luôn cân bằng bằng 0, và có đối soát tự động hàng ngày với tệp quyết toán PSP.',
          en: 'Ledger entries are strictly append-only: refunds/adjustments write offsetting entries, debits and credits per journal transaction must sum to zero, and daily T+1 reconciliation compares internal records against PSP settlement files.',
        },
        designImpact: {
          vi: 'Thiết kế bảng `journal_entries` append-only kèm ràng buộc tổng bằng 0 và luồng Batch Reconciliation phát hiện giao dịch lệch.',
          en: 'Model append-only `ledger_entries` with zero-sum invariants plus an automated T+1 Reconciliation pipeline.',
        },
      },
    ],
    napkinPreset: {
      dau: 10_000_000,
      readsPerUserPerDay: 6,
      writesPerUserPerDay: 2,
      payloadKb: 2,
      retentionYears: 7,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Thông lượng giao dịch thanh toán (TPS)', en: 'Payment TPS' },
        value: '≈ 232 TPS avg · ≈ 1.500 TPS peak',
        formula: {
          vi: '20M giao dịch/ngày / 86.400 ≈ 231,5 TPS; đỉnh mở bán khuyến mãi ≈ 1.500 TPS',
          en: '20M txns/day / 86,400 ≈ 231.5 TPS; promotional peak ≈ 1,500 TPS',
        },
      },
      {
        metric: { vi: 'Số yêu cầu chờ PSP đồng thời (Little’s Law)', en: 'Concurrent In-Flight PSP Calls' },
        value: '≈ 2.250 kết nối ở đỉnh (1.500 TPS × 1,5 s)',
        formula: {
          vi: 'Nếu giữ DB connection trong 1,5 s gọi PSP sẽ cần > 2.250 kết nối DB đang khóa — làm cạn pool ngay lập tức!',
          en: 'Holding DB transactions open for 1.5 s PSP calls would lock 2,250+ DB connections and exhaust pools!',
        },
      },
      {
        metric: { vi: 'Lưu trữ Sổ cái kiểm toán 7 năm (tuân thủ tài chính)', en: '7-Year Financial Ledger Storage' },
        value: '≈ 102 TB',
        formula: {
          vi: '20M giao dịch/ngày × ~4 dòng bút toán/sự kiện (~2 KB) = 40 GB/ngày × 365 × 7 ≈ 102 TB',
          en: '20M txns/day × ~2 KB journal/audit records = 40 GB/day × 365 × 7 ≈ 102 TB',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'pay-s1',
          text: {
            vi: 'Xác nhận yêu cầu bất biến cốt lõi: không bao giờ trừ tiền hai lần, không làm mất giao dịch, lưu vết kiểm toán 7 năm.',
            en: 'Confirm core invariants: zero double-charging, zero lost transactions, and 7-year immutable auditability.',
          },
        },
        {
          id: 'pay-s2',
          text: {
            vi: 'Làm rõ quy mô (~1.500 peak TPS), phụ thuộc PSP ngoài chậm/timeout và yêu cầu đối soát quyết toán T+1.',
            en: 'Clarify ~1,500 peak TPS, slow/ambiguous external PSP calls, and T+1 settlement reconciliation.',
          },
        },
      ],
      N: [
        {
          id: 'pay-n1',
          text: {
            vi: 'Chứng minh 1.500 TPS hoàn toàn xử lý được trên ACID PostgreSQL, không cần đánh đổi tính nhất quán sang NoSQL lỏng lẻo.',
            en: 'Show that 1,500 TPS fits ACID PostgreSQL comfortably—no reason to sacrifice transactional guarantees.',
          },
        },
        {
          id: 'pay-n2',
          text: {
            vi: 'Dùng Little’s Law (1.500 TPS × 1,5 s = 2.250 in-flight) chứng minh cấm giữ giao dịch DB mở trong lúc chờ PSP.',
            en: 'Use Little’s Law (1,500 TPS × 1.5 s = 2,250 in-flight) to prove DB locks must NEVER span external PSP calls.',
          },
        },
      ],
      A: [
        {
          id: 'pay-a-c1',
          text: {
            vi: 'Thiết kế `POST /v1/payments` bắt buộc header `Idempotency-Key` (UUID do Checkout sinh gắn với đơn hàng) kèm kiểm tra hash nội dung yêu cầu.',
            en: 'Specify `POST /v1/payments` requiring `Idempotency-Key` header (bound to checkout attempt) plus payload fingerprint check.',
          },
        },
        {
          id: 'pay-a-c2',
          text: {
            vi: 'Thiết kế bảng `payment_orders` (máy trạng thái rõ ràng) và Sổ cái kép chỉ thêm mới (`ledger_transactions` + `ledger_entries` có tổng bằng 0).',
            en: 'Design `payment_orders` state machine and append-only Double-Entry Ledger (`ledger_entries` summing to 0 in integer minor units).',
          },
        },
      ],
      K: [
        {
          id: 'pay-k1',
          text: {
            vi: 'Tách 3 bước giao dịch ngắn thay vì 1 giao dịch dài: (1) Ghi nhận `EXECUTING` + khoá luỹ đẳng; (2) Gọi PSP ngoài có truyền `psp_idempotency_key`; (3) Ghi Sổ cái kép + Outbox trong 1 giao dịch ACID.',
            en: 'Split execution into short local transactions around the PSP call: (1) Persist `EXECUTING` + idempotency key; (2) Call PSP with `psp_idempotency_key`; (3) Commit status + Double-Entry Ledger + Outbox atomically.',
          },
        },
        {
          id: 'pay-k2',
          text: {
            vi: 'Sử dụng Transactional Outbox để phát sự kiện `PaymentSucceeded` tin cậy sang Order Service và xử lý Webhook từ PSP luỹ đẳng.',
            en: 'Use Transactional Outbox to publish `PaymentSucceeded` events reliably and process PSP webhooks idempotently.',
          },
        },
      ],
      E: [
        {
          id: 'pay-e1',
          text: {
            vi: 'Xử lý đúng ca khó nhất — Timeout không rõ kết quả (`UNKNOWN`): không retry trừ mới mù quáng, mà chạy tiến trình hỏi trạng thái PSP (`GET status`) hoặc nhận Webhook, dùng cùng `psp_idempotency_key`.',
            en: 'Handle ambiguous PSP timeouts (`UNKNOWN`): query PSP status / await webhook and reuse the exact same `psp_idempotency_key`—never mint a fresh charge key.',
          },
        },
        {
          id: 'pay-e2',
          text: {
            vi: 'Biểu diễn tiền bằng số nguyên đơn vị nhỏ nhất (`amount_minor: bigint` + `currency`, tuyệt đối không dùng `float`), khoá lạc quan/xếp hàng cho tài khoản người bán đông giao dịch, và đối soát T+1.',
            en: 'Store money as integer minor units (`bigint` + `currency`, never `float`), avoid hot merchant account row contention, and run automated T+1 reconciliation.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'pay-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Ưu tiên tính chính xác tài chính, luỹ đẳng đầu-cuối và khả năng kiểm toán bất biến lên trên hết.',
          en: 'Prioritized strict financial correctness, end-to-end idempotency, and immutable auditability.',
        },
        expectedDetail: {
          vi: 'Xác định rõ không bao giờ dùng số thực dấu phẩy động (`float/double`) cho tiền tệ.',
          en: 'Explicitly required integer minor units (cents/dong) and currency codes.',
        },
      },
      {
        id: 'pay-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Nhận diện bản chất "timeout = không biết đã trừ hay chưa" khi giao tiếp với ngân hàng/PSP bên ngoài.',
          en: 'Highlighted that network timeouts from external PSPs mean "outcome unknown", not "failed".',
        },
        expectedDetail: {
          vi: 'Đây là nguyên nhân số 1 gây lỗi trừ tiền hai lần trong các hệ thống thanh toán thực tế.',
          en: 'Treating timeouts as failures and generating a new PSP request is the classic cause of double charges.',
        },
      },
      {
        id: 'pay-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng đỉnh ~1.500 TPS để chọn cơ sở dữ liệu quan hệ ACID thay vì phức tạp hoá sang hệ NoSQL không giao dịch.',
          en: 'Used ~1,500 peak TPS math to justify ACID relational storage over non-transactional stores.',
        },
        expectedDetail: {
          vi: 'Chứng minh quyết định chọn SQL bằng con số cụ thể.',
          en: 'Backed database engine choice directly with throughput numbers.',
        },
      },
      {
        id: 'pay-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Tính số lượng yêu cầu đang chờ PSP (~2.250 in-flight) để chứng minh không thể giữ kết nối/khoá DB qua bước gọi mạng.',
          en: 'Calculated ~2,250 concurrent in-flight PSP calls to prove DB transactions must not span external HTTP calls.',
        },
        expectedDetail: {
          vi: 'Tách giao dịch cục bộ trước và sau lời gọi PSP mỗi bước chỉ tốn 2–5 ms trên DB.',
          en: 'Short 2–5 ms local transactions keep DB connection utilization tiny even when PSPs slow down.',
        },
      },
      {
        id: 'pay-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'Hợp đồng `Idempotency-Key` chặt chẽ: trả kết quả cũ nếu đã xong, trả trạng thái đang xử lý (`202` / `409`) nếu yêu cầu đầu đang chạy, trả `422` nếu trùng key nhưng khác số tiền.',
          en: 'Specified complete `Idempotency-Key` semantics: replay completed result, guard concurrent in-flight duplicates, and reject mismatched payloads (`422`).',
        },
        expectedDetail: {
          vi: 'Client sinh key ngay từ lúc tạo phiên thanh toán đơn hàng và giữ nguyên khi người dùng bấm lại.',
          en: 'Key is tied to the checkout payment intent on the client before the first network attempt.',
        },
      },
      {
        id: 'pay-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Thiết kế chuẩn Sổ cái kép chỉ thêm mới (`ledger_entries` gồm `account_id`, `direction` hoặc `signed_amount_minor` sao cho tổng mỗi bút toán = 0).',
          en: 'Designed an append-only Double-Entry Ledger schema where every journal transaction sums to zero.',
        },
        expectedDetail: {
          vi: 'Ví dụ thu 100.000đ: Ghi Nợ TK Tiền phải thu PSP +100.000đ, Ghi Có TK Tạm giữ người bán -97.000đ, Ghi Có TK Phí sàn -3.000đ.',
          en: 'Every movement records balanced debit/credit legs across PSP clearing, merchant payable, and platform fee accounts.',
        },
      },
      {
        id: 'pay-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Chuỗi luỹ đẳng hai tầng: `client_idempotency_key` (Client -> Payment Service) VÀ `psp_idempotency_key` lưu cứng trong DB trước khi gọi PSP.',
          en: 'Implemented two-hop idempotency: client-to-gateway key AND persisted gateway-to-PSP idempotency key.',
        },
        expectedDetail: {
          vi: 'Đảm bảo nếu worker khởi động lại và gọi PSP lần hai, PSP nhận diện cùng 1 giao dịch và không trừ thẻ lần nữa.',
          en: 'Persisting the outbound PSP key before the HTTP call guarantees safe retries across worker crashes.',
        },
      },
      {
        id: 'pay-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Máy trạng thái giao dịch đơn điệu có kiểm tra điều kiện (`CREATED -> EXECUTING -> SUCCEEDED | FAILED`) xử lý an toàn cuộc đua giữa phản hồi đồng bộ và Webhook.',
          en: 'Enforced monotonic conditional state transitions (`WHERE status = EXECUTING`) so sync responses and async PSP webhooks never double-post ledger entries.',
        },
        expectedDetail: {
          vi: 'Chỉ đúng luồng chuyển trạng thái thành công đầu tiên mới được ghi bút toán Sổ cái + Outbox trong cùng giao dịch DB.',
          en: 'Exactly one transition wins the `UPDATE ... WHERE status = EXECUTING`, atomically writing ledger + outbox rows.',
        },
      },
      {
        id: 'pay-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Áp dụng Transactional Outbox để đồng bộ trạng thái sang dịch vụ Đơn hàng / Ví mà không dùng 2PC xuyên microservice.',
          en: 'Used the Transactional Outbox pattern to emit `PaymentSucceeded` events without brittle cross-service 2PC.',
        },
        expectedDetail: {
          vi: 'Tránh lỗi "đã ghi sổ cái thành công nhưng sập trước khi bắn Kafka khiến đơn hàng mãi ở trạng thái chưa thanh toán".',
          en: 'Eliminates dual-write inconsistency between Ledger DB commits and Kafka event publication.',
        },
      },
      {
        id: 'pay-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Quy trình khôi phục giao dịch kẹt ở trạng thái `EXECUTING / UNKNOWN` (tiến trình nền truy vấn `GET` trạng thái từ PSP theo lịch backoff).',
          en: 'Detailed recovery worker for stuck `EXECUTING / UNKNOWN` payments via PSP status polling + webhook reconciliation.',
        },
        expectedDetail: {
          vi: 'Giải quyết dứt điểm trường hợp mạng đứt hoặc pod Payment Service bị dừng ngay lúc PSP đang trả lời.',
          en: 'Resolves orphaned in-flight payments deterministically when pods crash mid-PSP-call.',
        },
      },
      {
        id: 'pay-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý tranh chấp khoá nóng (Hot Account Contention) trên tài khoản tổng của sàn / người bán lớn (tách tài khoản con sub-accounts hoặc tính số dư bất đồng bộ cho tài khoản nội bộ không thể âm).',
          en: 'Addressed hot-row lock contention on platform/mega-merchant ledger accounts via sharded sub-accounts.',
        },
        expectedDetail: {
          vi: 'Nếu mọi giao dịch toàn sàn đều khoá chung 1 dòng `platform_fee_account` để cộng số dư sẽ gây nghẽn hàng đợi khoá.',
          en: 'Updating one global fee/clearing balance row synchronously on every checkout serializes all throughput unless sharded into N sub-accounts.',
        },
      },
      {
        id: 'pay-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Thiết kế hệ thống Đối soát tự động T+1 (Reconciliation) so khớp 1-1 sao kê quyết toán của PSP với Sổ cái nội bộ và cảnh báo mọi chênh lệch.',
          en: 'Designed automated T+1 Reconciliation comparing PSP settlement files against internal ledger entries with discrepancy workflows.',
        },
        expectedDetail: {
          vi: 'Phân loại rõ 4 nhóm lệch: thiếu ở nội bộ, thiếu ở PSP, lệch số tiền/phí, hoặc giao dịch vắt qua nửa đêm (timing cutoff).',
          en: 'Classifies missing-internal, missing-external, amount mismatches, and midnight settlement-window rollovers.',
        },
      },
    ],
    recommendedComponents: [
      'l7-lb',
      'api-gateway',
      'idempotency-store',
      'outbox-saga',
      'kafka-queue',
      'worker-pool',
      'pg-primary-replica',
      'object-storage',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Payment Service kiểm tra và khóa `Idempotency-Key` trong cơ sở dữ liệu ACID PostgreSQL. Thực thi thanh toán chia thành 3 pha ngắn không giữ khoá qua mạng: (1) Ghi bản ghi `payment_order` ở trạng thái `EXECUTING` kèm `psp_idempotency_key` duy nhất; (2) Gọi PSP bên ngoài thông qua PSP Adapter có timeout và Circuit Breaker; (3) Khi có kết quả xác định (từ phản hồi trực tiếp, Webhook có chữ ký HMAC, hoặc Worker truy vấn bù cho giao dịch `UNKNOWN`), mở 1 giao dịch ACID duy nhất chuyển trạng thái `WHERE status = EXECUTING`, ghi các dòng cân bằng vào Sổ cái kép chỉ thêm mới (`ledger_entries`, dùng sub-accounts cho tài khoản sàn để tránh hot row) và ghi `outbox_events` để Relay đẩy sang Kafka. Cuối ngày, Reconciliation Engine tải tệp quyết toán PSP trên S3 đối chiếu toàn bộ bút toán.',
        en: 'Payment Service enforces strict `Idempotency-Key` deduplication backed by ACID PostgreSQL. Execution splits into three non-blocking phases: (1) Commit `payment_order` in `EXECUTING` state alongside a generated `psp_idempotency_key`; (2) Invoke external PSP via an isolated adapter with timeouts; (3) Upon definitive outcome (via sync response, HMAC-verified PSP webhook, or status-inquiry worker for `UNKNOWN` timeouts), run one atomic DB transaction updating `WHERE status = EXECUTING`, appending balanced zero-sum rows to `ledger_entries` (using sharded sub-accounts for platform/hot merchants), and inserting an `outbox_event` relayed to Kafka. Daily T+1 Reconciliation verifies PSP settlement files in S3 against the ledger.',
      },
      writePath: {
        vi: 'Checkout -> POST /v1/payments (`Idempotency-Key`) -> Tx1: Lưu `EXECUTING` + `psp_key` -> Gọi PSP ngoài (không giữ DB connection) -> Tx2: `UPDATE status` + Ghi 2–4 dòng cân bằng vào `ledger_entries` + Ghi `outbox_events` -> Outbox Relay phát `PaymentSucceeded` lên Kafka.',
        en: 'Checkout -> POST /v1/payments (`Idempotency-Key`) -> Tx1: Insert `EXECUTING` + `psp_key` -> External PSP HTTP call (zero DB locks held) -> Tx2: Conditional `UPDATE` + Append balanced `ledger_entries` + Insert `outbox_event` -> Relay to Kafka.',
      },
      readPath: {
        vi: 'Tra cứu trạng thái thanh toán đọc từ bảng `payment_orders` / Idempotency cache; báo cáo tài chính và sao kê người bán đọc từ Read Replicas tổng hợp các sub-accounts của Sổ cái; Reconciliation đối chiếu lô mỗi ngày.',
        en: 'Payment status reads hit `payment_orders`; merchant statements query Read Replicas aggregating sub-account balances; T+1 Reconciliation batch-joins PSP CSV/Parquet files against ledger journals.',
      },
      tradeoffs: [
        {
          vi: 'Tách giao dịch cục bộ + Máy trạng thái + Outbox so với giữ 1 giao dịch DB bọc ngoài PSP: viết thêm logic xử lý trạng thái trung gian `EXECUTING` nhưng bảo vệ toàn bộ connection pool khi PSP chậm.',
          en: 'Explicit `EXECUTING` state machine + Outbox vs wrapping PSP calls inside one DB transaction: requires state-recovery logic in exchange for complete immunity against connection-pool exhaustion.',
        },
        {
          vi: 'Sharded Sub-accounts cho tài khoản phí/tạm giữ của sàn: đọc tổng số dư sàn cần cộng gộp N=32 dòng con nhưng loại bỏ hoàn toàn điểm nghẽn khoá dòng ở 1.500 TPS.',
          en: 'Sharding platform clearing/fee accounts into N=32 sub-accounts requires summing N rows on read while eliminating row-lock serialization on writes.',
        },
      ],
    },
  },

  // =========================================================================
  // 9. Search Autocomplete < 50ms — S7-07 (Senior)
  // =========================================================================
  {
    id: 'iv-autocomplete',
    order: 9,
    level: 'Senior',
    relatedModuleId: 'S7-07',
    secondaryModuleIds: ['S2-02', 'S4-03', 'S5-05'],
    title: {
      vi: 'Thiết kế Search Autocomplete độ trễ dưới 50 ms',
      en: 'Design Search Autocomplete Under 50 ms Latency',
    },
    scaleTag: {
      vi: '50K+ QPS tiền tố · p99 < 50 ms · Prefix Trie / KV Cache',
      en: '50K+ prefix QPS · p99 < 50 ms · Precomputed Top-K Trie',
    },
    openingBrief: {
      vi: 'Thiết kế hệ thống gợi ý cụm từ tìm kiếm tự động (Search Autocomplete / Typeahead): mỗi khi người dùng gõ thêm ký tự vào thanh tìm kiếm, hệ thống hiển thị các gợi ý phù hợp nhất gần như tức thì.',
      en: 'Design a search autocomplete (typeahead) system that suggests the most relevant completions immediately as users type each character into the search bar.',
    },
    hiddenAssumptions: [
      {
        id: 'ac-a1',
        topic: { vi: 'Số lượng gợi ý, Độ trễ mục tiêu & Quy mô gõ phím', en: 'Top-K Count, Latency Target & Keystroke QPS' },
        question: {
          vi: 'Cần trả về bao nhiêu gợi ý, độ trễ mục tiêu phía máy chủ là bao nhiêu và quy mô tìm kiếm hàng ngày thế nào?',
          en: 'How many suggestions do we return, what is the server latency target, and what is daily search scale?',
        },
        interviewerAnswer: {
          vi: 'Trả về top 8 cụm từ phổ biến nhất không phân biệt hoa thường (chuẩn hoá chữ thường/Unicode), độ trễ xử lý phía máy chủ p99 < 25 ms (tổng cảm nhận cả mạng dưới 50–80 ms). Hệ thống có 20M DAU, mỗi người thực hiện 10 lượt tìm kiếm/ngày, mỗi lượt gõ trung bình 6–8 ký tự.',
          en: 'Return top 8 normalized suggestions with server-side p99 < 25 ms (sub-50 ms perceived). 20M DAU running 10 searches/day, typing 6–8 characters per query.',
        },
        designImpact: {
          vi: 'Mỗi lượt tìm sinh 6–8 truy vấn tiền tố -> đỉnh trên 50.000 QPS! Mọi danh sách top-8 của từng tiền tố phải được tính sẵn và nằm hoàn toàn trong RAM.',
          en: 'Keystroke amplification yields 50,000+ peak QPS; top-8 lists must be precomputed per prefix and served strictly from memory.',
        },
      },
      {
        id: 'ac-a2',
        topic: { vi: 'Độ tươi mới của xu hướng & Cá nhân hoá', en: 'Index Freshness & Personalization' },
        question: {
          vi: 'Khi có một cụm từ vừa được tìm kiếm, nó cần xuất hiện ngay lập tức trong 1 giây hay cập nhật định kỳ là đủ?',
          en: 'Must suggestions reflect every single search query within 1 second, or is periodic aggregation acceptable?',
        },
        interviewerAnswer: {
          vi: 'Xếp hạng toàn cục chung cho khu vực/ngôn ngữ là chính (lịch sử gần đây của riêng người dùng lưu ở local cache thiết bị). Độ trễ cập nhật chỉ mục tiêu chuẩn 15–30 phút là chấp nhận được, kèm khả năng lọc bỏ nhanh các cụm từ vi phạm chính sách.',
          en: 'Suggestions are primarily language/region global rankings (user’s own recent history merges client-side). A 15–30 minute index refresh SLA is fine, plus a fast blocklist to suppress unsafe terms immediately.',
        },
        designImpact: {
          vi: 'Tuyệt đối KHÔNG sửa đổi cây Trie trực tiếp trên từng lượt tìm kiếm (tránh khoá ghi trên đường đọc 50K QPS); tách hẳn thành đường đọc bất biến và đường dựng snapshot nền.',
          en: 'Never mutate the serving Trie inline on every search! Separate read-only immutable serving replicas from an async offline/micro-batch builder.',
        },
      },
      {
        id: 'ac-a3',
        topic: { vi: 'Giới hạn độ dài tiền tố & Đa ngôn ngữ', en: 'Prefix Length Cap & Skewed Short Prefixes' },
        question: {
          vi: 'Độ dài tối đa của tiền tố cần lập chỉ mục là bao nhiêu và phân bố truy cập ở 1–3 ký tự đầu ra sao?',
          en: 'What is the maximum indexed prefix length, and how skewed are 1–3 character prefixes?',
        },
        interviewerAnswer: {
          vi: '99% truy vấn tiền tố ngắn dưới 35 ký tự (giới hạn cắt ở 40 ký tự). Các tiền tố 1–3 ký tự đầu (như `"s"`, `"sy"`, `"sys"`) chiếm phần lớn lưu lượng lặp lại.',
          en: '99% of prefixes are under 35 characters (cap at 40 chars). Short 1–3 character prefixes account for a massive share of repeated traffic.',
        },
        designImpact: {
          vi: 'Các tiền tố ngắn 1–3 ký tự có thể cache ngay tại trình duyệt và CDN Edge (TTL 5–10 phút), giảm một nửa tải cho cụm máy chủ gốc.',
          en: 'Browser local cache + CDN Edge caching on short 1–3 char prefixes (TTL 5–10 min) offloads huge QPS before touching origin.',
        },
      },
    ],
    napkinPreset: {
      dau: 20_000_000,
      readsPerUserPerDay: 50,
      writesPerUserPerDay: 10,
      payloadKb: 0.5,
      retentionYears: 1,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Thông lượng truy vấn tiền tố (Prefix Read QPS)', en: 'Prefix Query QPS' },
        value: '≈ 16.000 QPS avg · ≈ 50.000+ QPS peak',
        formula: {
          vi: '200M lượt tìm/ngày × ~7 ký tự / 86.400 ≈ 16.200 QPS (sau debounce 120 ms vẫn đạt đỉnh ~50K QPS)',
          en: '200M searches/day × ~7 keystrokes / 86,400 ≈ 16.2K QPS avg (~50K+ QPS peak)',
        },
      },
      {
        metric: { vi: 'Dung lượng bộ nhớ của Chỉ mục Tiền tố đã tính sẵn Top-8', en: 'Precomputed Prefix Index RAM' },
        value: '≈ 15–25 GB cho 50 triệu cụm từ phổ biến',
        formula: {
          vi: 'Lọc các cụm từ đạt ngưỡng tần suất tối thiểu -> bảng KV phẳng `prefix -> top8_json` nằm gọn trong RAM 1 máy 64 GB!',
          en: 'Pruning single-occurrence typos/PII keeps the entire `prefix -> top8` map under ~15–25 GB RAM (fits on a single host, replicated for QPS)!',
        },
      },
      {
        metric: { vi: 'Lưu lượng log tìm kiếm đầu vào (có lấy mẫu)', en: 'Sampled Search Log Ingest' },
        value: '≈ 230 RPS nếu lấy mẫu 1/10 (từ 2.300 lượt bấm Enter/s)',
        formula: {
          vi: 'Chỉ ghi nhận khi người dùng bấm tìm thật (không log từng phím gõ dở) và lấy mẫu 1/10 vẫn giữ nguyên thứ hạng top-K phổ biến',
          en: 'Logging only submitted searches with 1/10 sampling cuts analytics volume 10× without changing popular top-K rankings',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'ac-s1',
          text: {
            vi: 'Làm rõ top-8 gợi ý, độ trễ server p99 < 25 ms (tổng < 50 ms) và tách riêng cá nhân hoá lịch sử gần đây ở phía client.',
            en: 'Clarify top-8 results, server p99 < 25 ms (< 50 ms end-to-end), and client-local recent-search merging.',
          },
        },
        {
          id: 'ac-s2',
          text: {
            vi: 'Xác nhận chỉ mục cập nhật theo chu kỳ 15–30 phút (không cập nhật đồng bộ từng phím) kèm bộ lọc từ khoá cấm tức thì.',
            en: 'Confirm 15–30 min periodic index refresh SLA plus an immediate blocklist filter for unsafe queries.',
          },
        },
      ],
      N: [
        {
          id: 'ac-n1',
          text: {
            vi: 'Tính hiệu ứng khuếch đại theo số phím gõ (~50K QPS đỉnh) và lượng giảm tải nhờ Debounce 100–150 ms + Browser/CDN cache.',
            en: 'Calculate keystroke QPS amplification (~50K peak) and the reduction from 100–150 ms client debouncing + CDN cache.',
          },
        },
        {
          id: 'ac-n2',
          text: {
            vi: 'Ước lượng dung lượng RAM của cây Trie / bảng Prefix KV (~15–25 GB sau khi lọc từ khoá rác xuất hiện 1–2 lần) để thấy có thể nhân bản trọn bộ trên nhiều máy đọc.',
            en: 'Show that pruning rare tail/typo queries shrinks the precomputed index to ~15–25 GB, fitting entirely in memory per replica.',
          },
        },
      ],
      A: [
        {
          id: 'ac-a-c1',
          text: {
            vi: 'Thiết kế `GET /v1/suggest?q=sys&lang=vi` (chuẩn hoá query để tối đa cache hit trên CDN) và sự kiện ghi nhận từ khoá đã bấm tìm.',
            en: 'Specify cache-friendly `GET /v1/suggest?q=sys&lang=vi` (normalized query string) plus submitted-search telemetry API.',
          },
        },
        {
          id: 'ac-a-c2',
          text: {
            vi: 'Biểu diễn cấu trúc Trie tối ưu: mỗi nút tiền tố lưu sẵn mảng `top_8: [(term, score)]` hoặc trải phẳng thành bảng băm O(1) `prefix -> serialized_top8`.',
            en: 'Model precomputed node state: store `top_8` directly on each prefix node (or flatten into an O(1) `prefix -> top8` hash table).',
          },
        },
      ],
      K: [
        {
          id: 'ac-k1',
          text: {
            vi: 'Tách hoàn toàn Mặt phẳng Truy vấn (Browser Cache -> CDN Edge -> In-Memory Suggest Replicas không khoá) và Mặt phẳng Tổng hợp (Kafka -> Aggregator có hệ số giảm dần theo thời gian -> Builder -> S3 Snapshot).',
            en: 'Completely decouple the lock-free Query Path (Browser -> CDN -> In-Memory Suggest Replicas) from the Async Build Pipeline (Kafka -> Time-Decayed Aggregator -> Snapshot Builder -> S3).',
          },
        },
        {
          id: 'ac-k2',
          text: {
            vi: 'Mô tả cơ chế hoán đổi chỉ mục không gián đoạn ( nạp snapshot mới vào vùng nhớ phụ rồi đảo con trỏ hoặc rolling reload từng replica).',
            en: 'Detail zero-downtime snapshot rollout (double-buffered pointer swap or rolling replica reload from Object Storage).',
          },
        },
      ],
      E: [
        {
          id: 'ac-e1',
          text: {
            vi: 'Áp dụng trọng số giảm dần theo thời gian (Exponential Time Decay) để xu hướng mới vượt qua các từ khoá cũ tích luỹ từ năm ngoái, cộng thêm luồng nhanh (Trending Overlay) cho tin nóng.',
            en: 'Use exponential time-decay weighting so fresh queries outrank stale historical totals, plus an optional small Trending Overlay for breaking news.',
          },
        },
        {
          id: 'ac-e2',
          text: {
            vi: 'Loại bỏ truy vấn chứa thông tin cá nhân (SĐT, email, mã thẻ), lọc từ khoá cấm ở cả lúc dựng lẫn lớp kiểm tra RAM tại Query Service, và huỷ request cũ ở client (`AbortController`).',
            en: 'Scrub PII/typos before indexing, enforce an instant in-memory blocklist at Query Service, and cancel out-of-order client requests (`AbortController`).',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'ac-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Chốt rõ ngân sách độ trễ server (< 25 ms), số lượng gợi ý (top 5–10) và độ trễ cập nhật chỉ mục chấp nhận được (15–30 phút).',
          en: 'Clarified tight server latency (< 25 ms), top-K count, and relaxed index freshness SLA (15–30 min).',
        },
        expectedDetail: {
          vi: 'Việc làm rõ không cần cập nhật từng mili-giây cho phép kiến trúc đọc bất biến không khóa.',
          en: 'Relaxing write freshness unlocks a lock-free immutable read architecture.',
        },
      },
      {
        id: 'ac-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Làm rõ giới hạn độ dài tiền tố (≤ 40 ký tự), chuẩn hoá ngôn ngữ/chữ thường và yêu cầu gỡ bỏ nhanh từ khoá vi phạm.',
          en: 'Bounded max prefix length (≤ 40 chars), query normalization, and fast blocklist removal requirements.',
        },
        expectedDetail: {
          vi: 'Chuẩn hoá khoảng trắng và chữ thường ngay từ đầu tránh nhân bản vô ích không gian tiền tố.',
          en: 'Canonicalizing case/whitespace prevents fragmenting cache keys and prefix nodes.',
        },
      },
      {
        id: 'ac-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Tính đúng QPS đỉnh (~50K+ QPS) từ số phím gõ mỗi lượt tìm và chỉ ra vai trò của client debounce + lấy mẫu log ghi (sampling).',
          en: 'Quantified keystroke-amplified peak QPS (~50K+) alongside client debouncing and write-log sampling.',
        },
        expectedDetail: {
          vi: 'Lấy mẫu 1/10 hoặc 1/20 các lượt tìm kiếm vẫn giữ chính xác thứ tự của những cụm từ phổ biến hàng nghìn lượt.',
          en: 'Log sampling slashes ingestion/aggregation cost without distorting high-frequency top-K rankings.',
        },
      },
      {
        id: 'ac-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Tính dung lượng chỉ mục sau khi cắt tỉa từ khoá hiếm (~15–25 GB) để đi đến quyết định nhân bản toàn bộ chỉ mục trên RAM thay vì chỉ phân mảnh phức tạp.',
          en: 'Estimated pruned index size (~15–25 GB) and realized each serving node can hold a full in-memory replica (or simple prefix shards).',
        },
        expectedDetail: {
          vi: 'Nếu chỉ mục vừa khít RAM 1 máy 64 GB, nhân bản toàn phần loại bỏ hoàn toàn vấn đề hot shard cho chữ cái `"a"`, `"s"`, `"t"`!',
          en: 'Full in-memory replicas completely eliminate hot-shard skew on popular starting letters like `"s"` or `"a"`.',
        },
      },
      {
        id: 'ac-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'API `GET /v1/suggest` thiết kế thân thiện với HTTP Cache (query params chuẩn hoá, `Cache-Control: public, max-age=300` cho tiền tố công khai).',
          en: 'Designed `GET /v1/suggest` with canonical query params and `Cache-Control` headers so CDN and browsers cache responses.',
        },
        expectedDetail: {
          vi: 'Không dùng `POST` cho truy vấn đọc gợi ý công khai vì sẽ làm mất khả năng cache ở CDN.',
          en: 'Using `GET` rather than `POST` enables transparent browser and CDN edge caching.',
        },
      },
      {
        id: 'ac-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Lưu sẵn `top-K` ngay tại mỗi nút tiền tố của Trie (hoặc trải phẳng sang bảng băm `prefix -> pre-serialized JSON`) để tra cứu O(1) theo độ dài tiền tố.',
          en: 'Precomputed and cached `top-K` directly on every prefix node (or flattened into an O(1) `prefix -> topK` map).',
        },
        expectedDetail: {
          vi: 'Duyệt toàn bộ hàng triệu lá con của tiền tố `"s"` lúc truy vấn sẽ vi phạm ngay ngưỡng 50 ms.',
          en: 'Traversing subtrees at query time takes O(subtree) and blows the latency budget on short prefixes.',
        },
      },
      {
        id: 'ac-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tách biệt triệt để đường đọc thời gian thực (Query Service chỉ đọc RAM) và đường tổng hợp dựng chỉ mục (Kafka -> Aggregator -> Snapshot Builder).',
          en: 'Cleanly separated the lock-free in-memory Query Path from the asynchronous Aggregation & Trie Builder pipeline.',
        },
        expectedDetail: {
          vi: 'Sự cố chậm ở pipeline phân tích chỉ làm gợi ý cũ thêm vài phút chứ không bao giờ ảnh hưởng độ trễ gõ phím.',
          en: 'Analytics pipeline stalls only delay freshness slightly while serving latency stays flat.',
        },
      },
      {
        id: 'ac-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tối ưu phía trình duyệt/ứng dụng: Debounce 100–150 ms, lưu bộ nhớ đệm các tiền tố vừa gõ khi bấm Backspace, và huỷ phản hồi đến muộn (`request_seq` / `AbortController`).',
          en: 'Included client optimizations: 100–150 ms debounce, local prefix cache for Backspace, and stale-response cancellation.',
        },
        expectedDetail: {
          vi: 'Nếu không kiểm tra thứ tự phản hồi, kết quả của `"sy"` về trễ có thể ghi đè lên kết quả của `"system"` đang hiển thị.',
          en: 'Out-of-order network responses overwrite newer keystrokes unless guarded by sequence/abort tokens.',
        },
      },
      {
        id: 'ac-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Cơ chế phát hành bản chụp chỉ mục bất biến qua Object Storage (Double-buffering hoặc Rolling Update) không gây dừng hay giật p99.',
          en: 'Published immutable index snapshots via Object Storage with atomic pointer swap / rolling reload.',
        },
        expectedDetail: {
          vi: 'Tải tệp nén mmap/SSTable vào bộ nhớ chuẩn bị xong xuôi rồi mới chuyển lưu lượng đọc.',
          en: 'Memory-mapped or pre-warmed snapshots prevent GC pauses and cold-cache spikes during swaps.',
        },
      },
      {
        id: 'ac-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Xếp hạng có hệ số suy giảm theo thời gian (Time Decay, ví dụ `score = prev * 0.9 + current_window`) kết hợp lớp phủ xu hướng nóng (Trending Cache nhỏ).',
          en: 'Applied exponential time decay to frequency counts plus a lightweight real-time Trending Overlay.',
        },
        expectedDetail: {
          vi: 'Đảm bảo sự kiện vừa diễn ra trong 5 phút vẫn lên gợi ý nhanh dù toàn bộ Trie lớn chỉ dựng lại mỗi 30 phút.',
          en: 'Small streaming overlay surfaces breaking-news queries within minutes without rebuilding the full base index.',
        },
      },
      {
        id: 'ac-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Cơ chế lọc an toàn hai lớp: lọc PII (email/SĐT/ngưỡng k-anonymity tối thiểu N người khác nhau tìm) lúc dựng + bộ lọc Blocklist tức thì tại Query Service.',
          en: 'Enforced k-anonymity PII scrubbing during index build plus an instant dynamic blocklist filter at Query Service.',
        },
        expectedDetail: {
          vi: 'Chỉ lập chỉ mục cụm từ được ít nhất ví dụ 20 người dùng độc lập tìm kiếm để không bao giờ lộ mật khẩu/SĐT gõ nhầm vào ô tìm kiếm.',
          en: 'Requiring ≥ K distinct users before indexing prevents leaking accidental passwords or phone numbers typed into search.',
        },
      },
      {
        id: 'ac-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Chiến lược mở rộng khi tập từ vựng đa ngôn ngữ vượt quá RAM 1 máy (phân vùng theo `language/region`, sau đó Consistent Hashing theo tiền tố có nhân bản cho tiền tố ngắn).',
          en: 'Outlined horizontal scaling if global vocabulary outgrows single-node RAM (partition by locale first, then hash/range shard with replicated short prefixes).',
        },
        expectedDetail: {
          vi: 'Chia theo ngôn ngữ (`vi`, `en`, `ja`) không cần scatter-gather vì mỗi request chỉ thuộc 1 ngôn ngữ.',
          en: 'Sharding by locale avoids cross-shard fan-out since each query targets one locale.',
        },
      },
    ],
    recommendedComponents: [
      'cdn-edge',
      'l7-lb',
      'prefix-trie',
      'redis-cache-aside',
      'kafka-queue',
      'worker-pool',
      'object-storage',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Hệ thống tách hoàn toàn Đường Đọc bất biến dưới 25 ms và Đường Dựng chỉ mục bất đồng bộ. Ở phía người dùng, ô tìm kiếm áp dụng Debounce 120 ms, lưu cache cục bộ phiên gõ, huỷ request cũ bằng `AbortController` và đi qua CDN Edge (cache 5 phút cho tiền tố ngắn 1–3 ký tự). Cụm Suggest Service nạp trọn bộ chỉ mục tiền tố của từng ngôn ngữ (~20 GB bản đồ nén `prefix -> top-8` dựng từ Trie) vào RAM để tra cứu O(1) không khóa, kết hợp lọc Blocklist động và trộn nhẹ với Redis Trending Overlay (cập nhật mỗi phút cho xu hướng nóng). Ở đường nền, các truy vấn đã bấm tìm được lấy mẫu 1/10 đẩy qua Kafka -> Stream/Batch Aggregator tính tần suất có suy giảm thời gian + lọc k-anonymity -> Index Builder xuất snapshot bất biến lên Object Storage để các Suggest Replicas tải nền và đảo con trỏ nguyên tử mỗi 20 phút.',
        en: 'Cleanly splits an immutable sub-25ms Read Path from an asynchronous Index Build Pipeline. Clients debounce keystrokes (120 ms), cache session prefixes locally, abort superseded requests, and hit CDN Edge (caching 1–3 char prefixes for 5 min). Stateless Suggest Service replicas hold the locale’s full precomputed `prefix -> top-8` Trie/FST snapshot (~20 GB) in RAM for lock-free O(1) lookups, applying an instant in-memory Blocklist and merging a small 1-minute Redis Trending Overlay. In the background, 1/10 sampled submitted searches flow through Kafka -> Time-Decayed & k-Anonymity Aggregator -> Index Builder -> Object Storage snapshots, which Suggest Replicas preload and swap atomically every 20 minutes.',
      },
      writePath: {
        vi: 'User bấm Tìm kiếm -> Lấy mẫu 1/10 gửi Kafka -> Aggregator lọc PII (≥ 20 user độc lập) & nhân hệ số Time Decay -> Trie/FST Builder tính sẵn `top-8` tại mọi tiền tố (≤ 40 ký tự) -> Đẩy Snapshot lên S3 -> Suggest Nodes tải vào bộ đệm phụ & hoán đổi con trỏ.',
        en: 'Submitted Search -> 1/10 Sampled Kafka Event -> Aggregator enforces ≥ 20 distinct-user k-anonymity & exponential time decay -> Builder precomputes `top-8` per prefix -> Upload snapshot to S3 -> Suggest Replicas preload & atomically swap pointer.',
      },
      readPath: {
        vi: 'User gõ phím -> Debounce 120ms + Local Cache -> CDN Edge (hit cao ở 1–3 ký tự) -> L7 LB -> Suggest Replica tra O(1) trên Snapshot RAM + trộn Trending Overlay + lọc Blocklist -> Trả JSON < 5 ms nội bộ.',
        en: 'Keystroke -> 120ms Debounce + Local Cache -> CDN Edge (high hit ratio on 1–3 chars) -> L7 LB -> Suggest Replica O(1) RAM lookup + Trending Overlay merge + Blocklist filter -> Return JSON in < 5 ms server time.',
      },
      tradeoffs: [
        {
          vi: 'Snapshot bất biến làm mới mỗi 20 phút + Trending Overlay nhỏ so với sửa cây Trie trực tiếp: hy sinh tính tức thì cho từ khoá bình thường để đạt tốc độ đọc không khoá < 5 ms và loại bỏ hoàn toàn tranh chấp luồng.',
          en: '20-min immutable snapshots + small Trending Overlay vs inline Trie mutation: trades minor staleness on ordinary queries for lock-free sub-5ms reads.',
        },
        {
          vi: 'Lưu sẵn `top-8` tại mọi nút tiền tố: tốn thêm bộ nhớ lưu trữ dư thừa (~2–3×) nhưng biến phép duyệt cây con đắt đỏ thành 1 phép đọc bảng băm O(1).',
          en: 'Materializing `top-8` on every prefix node trades 2–3× memory overhead for deterministic O(1) query time.',
        },
      ],
    },
  },

  // =========================================================================
  // 10. Flash Sale Ticket Booking — S3-07 (Staff)
  // =========================================================================
  {
    id: 'iv-flash-sale',
    order: 10,
    level: 'Staff',
    relatedModuleId: 'S3-07',
    secondaryModuleIds: ['S4-05', 'S4-10', 'S2-04'],
    title: {
      vi: 'Thiết kế Đặt vé Flash Sale (500.000 người tranh 10.000 vé cùng giây)',
      en: 'Design Flash Sale Ticketing (500K Users Competing for 10K Tickets)',
    },
    scaleTag: {
      vi: '500K RPS tại T=0 · Không bán vượt kho · Giữ vé 5 phút',
      en: '500K RPS spike at T=0 · Zero Oversell · 5-Min Hold TTL',
    },
    openingBrief: {
      vi: 'Một buổi hoà nhạc mở bán 10.000 vé đúng 20:00:00 và có khoảng 500.000 người hâm mộ bấm nút đặt mua trong cùng một giây đầu tiên. Hãy thiết kế hệ thống để không bị ngừng hoạt động và không bao giờ bán vượt quá 10.000 vé.',
      en: 'A major concert opens 10,000 tickets at exactly 20:00:00, with 500,000 fans clicking "Buy Now" within the first second. Design the system so it stays responsive and never oversells a single ticket.',
    },
    hiddenAssumptions: [
      {
        id: 'fs-a1',
        topic: { vi: 'Loại vé (Chọn ghế cụ thể hay Hạng vé chung) & Giới hạn mỗi người', en: 'Ticket Type (General Tier vs Assigned Seat) & Per-User Cap' },
        question: {
          vi: 'Người mua chọn từng số ghế trên sơ đồ hay chọn theo hạng vé (ví dụ khu VIP / khu Thường), và mỗi tài khoản được mua tối đa mấy vé?',
          en: 'Do buyers pick exact numbered seats or ticket tiers/zones, and what is the per-user purchase limit?',
        },
        interviewerAnswer: {
          vi: 'Bán theo 4 hạng khu vực (hoặc gán ghế tự động trong hạng), mỗi tài khoản đã xác thực được mua tối đa 2 vé cho toàn sự kiện để chống đầu cơ.',
          en: 'Sold across 4 zone tiers (with auto-assigned seat numbers inside the tier), strictly capped at max 2 tickets per authenticated user.',
        },
        designImpact: {
          vi: 'Có thể kiểm tra hạn mức người dùng (`≤ 2 vé`) và trừ bộ đếm tồn kho nguyên tử theo từng bucket hạng vé ngay trong bộ nhớ trước khi chạm DB.',
          en: 'Allows atomic per-user cap check (`≤ 2`) + inventory decrement in memory across sharded tier buckets before touching SQL.',
        },
      },
      {
        id: 'fs-a2',
        topic: { vi: 'Thời gian giữ chỗ chờ thanh toán & Hoàn kho', en: 'Reservation Hold Window & Inventory Restock' },
        question: {
          vi: 'Sau khi giành được quyền mua, người dùng có bao lâu để hoàn tất thanh toán và vé chưa thanh toán xử lý ra sao?',
          en: 'Once a user secures a reservation, how long do they have to pay, and what happens on timeout?',
        },
        interviewerAnswer: {
          vi: 'Giữ chỗ trong đúng 5 phút để chuyển sang cổng thanh toán. Nếu quá 5 phút chưa thanh toán thành công, đơn giữ chỗ tự động hết hạn và vé được cộng trả lại kho cho người đang chờ.',
          en: 'Hold reserved inventory for 5 minutes during payment. Unpaid holds expire automatically after 5 minutes, returning tickets cleanly to available stock.',
        },
        designImpact: {
          vi: 'Tách biệt hai bước: `Reserve Hold (5 phút)` cực nhanh tại T=0 và `Confirm Payment` sau đó, kèm bộ lập lịch thu hồi đơn quá hạn luỹ đẳng.',
          en: 'Decouples fast T=0 `Reserve` from slow external `Pay`, paired with an idempotent 5-minute expiration restock worker.',
        },
      },
      {
        id: 'fs-a3',
        topic: { vi: 'Trải nghiệm công bằng, Chống Bot & Bảo vệ phần còn lại của nền tảng', en: 'Bot Mitigation, Fairness & Platform Isolation' },
        question: {
          vi: 'Làm sao hạn chế tool tự động bắn hàng vạn request/giây và đảm bảo các sự kiện bình thường khác trên trang không bị ảnh hưởng?',
          en: 'How should we handle automated scalper bots and protect unrelated events hosted on the same platform?',
        },
        interviewerAnswer: {
          vi: 'Cần chặn script bắn lặp tần suất cao theo tài khoản/thiết bị, hiển thị trạng thái hàng chờ rõ ràng cho người dùng, và cô lập hoàn toàn hạ tầng Flash Sale khỏi các sự kiện thường ngày.',
          en: 'Throttle high-frequency automated retries per user/device, give users clear queue/sold-out status, and isolate Flash Sale resources from standard events.',
        },
        designImpact: {
          vi: 'Áp dụng phòng tuyến nhiều lớp (CDN tĩnh -> Rate Limit theo `user_id` -> Phòng chờ ảo / Token -> Cổng trừ kho Redis -> Hàng đợi tạo đơn DB) và cô lập Bulkhead riêng.',
          en: 'Build a multi-stage funnel (Static CDN -> Per-user Rate Limit -> Redis Atomic Gatekeeper -> Kafka Order Creation) inside an isolated Bulkhead.',
        },
      },
    ],
    napkinPreset: {
      dau: 2_000_000,
      readsPerUserPerDay: 30,
      writesPerUserPerDay: 1,
      payloadKb: 0.8,
      retentionYears: 2,
    },
    referenceNumbers: [
      {
        metric: { vi: 'Đỉnh yêu cầu đặt mua tại đúng 20:00:00', en: 'T=0 Spike Request Rate' },
        value: '≈ 300.000–500.000 RPS (trong 1–3 giây đầu)',
        formula: {
          vi: '500K người dùng đồng loạt bấm mua + làm mới trang ngay giây đồng hồ đếm ngược về 0',
          en: '500K concurrent fans clicking at countdown zero plus immediate retries',
        },
      },
      {
        metric: { vi: 'Tốc độ khoá dòng tối đa trên 1 dòng PostgreSQL đơn lẻ', en: 'Single-Row SQL Lock Ceiling' },
        value: 'Chỉ ≈ 1.000–3.000 TPS (nghẽn nếu đẩy 500K RPS vào!)',
        formula: {
          vi: '`UPDATE tiers SET stock = stock - 1 WHERE id = 1 AND stock > 0` tuần tự hoá trên 1 row lock (~0,3–1 ms/khoá)',
          en: '500K concurrent `UPDATE ... WHERE id = 1` statements serialize on one row lock and exhaust DB connection pools',
        },
      },
      {
        metric: { vi: 'Số đơn hợp lệ thực sự cần ghi xuống PostgreSQL', en: 'Actual Winning Reservations Written to SQL' },
        value: 'Tối đa 10.000 đơn (giảm 98% tải ghi cho DB!)',
        formula: {
          vi: 'Cổng Redis Lua lọc bỏ 490.000 lượt hết vé ngay trong RAM, chỉ đẩy ≤ 10.000 lượt thắng vào Kafka -> DB',
          en: 'Redis Lua gatekeeper rejects 490K excess requests in memory; only ≤ 10K winning holds reach Kafka -> PostgreSQL',
        },
      },
    ],
    snakeChecklist: {
      S: [
        {
          id: 'fs-s1',
          text: {
            vi: 'Làm rõ bất biến số 1: `oversell = 0` (không bán quá 10.000 vé), giới hạn ≤ 2 vé/người và cơ chế giữ chỗ 5 phút.',
            en: 'Establish core invariants: strictly zero overselling (`≤ 10,000`), max 2 tickets/user, and 5-minute payment hold.',
          },
        },
        {
          id: 'fs-s2',
          text: {
            vi: 'Xác định yêu cầu chống bot gửi lặp, phản hồi nhanh khi đã hết vé và cô lập không làm ảnh hưởng sự kiện khác.',
            en: 'Clarify per-user bot throttling, fast sold-out short-circuiting, and bulkhead isolation from normal traffic.',
          },
        },
      ],
      N: [
        {
          id: 'fs-n1',
          text: {
            vi: 'Chỉ ra sự chênh lệch 100× giữa đỉnh 500.000 RPS tại T=0 và trần ~2.000 TPS của khoá dòng SQL trên cùng một hạng vé.',
            en: 'Contrast the 500,000 RPS T=0 spike against the ~2,000 TPS row-lock ceiling of a single SQL inventory row.',
          },
        },
        {
          id: 'fs-n2',
          text: {
            vi: 'Nhận ra chỉ có tối đa 10.000 yêu cầu thành công thực sự cần tạo bản ghi đơn hàng trong PostgreSQL (phễu lọc 50:1).',
            en: 'Recognize the 50:1 funnel: only ≤ 10,000 winning holds ever need durable relational order creation.',
          },
        },
      ],
      A: [
        {
          id: 'fs-a-c1',
          text: {
            vi: 'Thiết kế `POST /v1/flash-sale/{eventId}/reserve` (có `Idempotency-Key`, trả `202 Accepted` kèm `reservation_id` để poll/SSE trạng thái giữ chỗ) và `POST /pay`.',
            en: 'Define `POST /v1/flash-sale/{eventId}/reserve` (`Idempotency-Key`, returning `202` + `reservation_id`) and payment confirmation API.',
          },
        },
        {
          id: 'fs-a-c2',
          text: {
            vi: 'Thiết kế bảng `reservations` (`UNIQUE(event_id, reservation_id)`, trạng thái `HELD -> PAID | EXPIRED`) và bảng `ticket_inventory` có kiểm tra `stock >= qty`.',
            en: 'Model `reservations` (`HELD -> PAID | EXPIRED`, `expires_at`) and SQL `CHECK (available_stock >= 0)` safety net.',
          },
        },
      ],
      K: [
        {
          id: 'fs-k1',
          text: {
            vi: 'Xây dựng phễu giảm tải 4 tầng: (1) CDN phục vụ trang tĩnh & cờ `sold_out`; (2) API Gateway chặn vượt tốc độ theo `user_id`; (3) Redis Lua nguyên tử kiểm tra hạn mức user + trừ kho (chia thành N sub-buckets để gánh 500K RPS); (4) Kafka -> Order Workers ghi PostgreSQL.',
            en: 'Design the 4-stage funnel: (1) Static CDN + edge sold-out flag; (2) Per-user Gateway Rate Limit; (3) Sharded Redis Lua atomic quota + stock decrement; (4) Kafka -> Order Workers -> PostgreSQL.',
          },
        },
        {
          id: 'fs-k2',
          text: {
            vi: 'Mô tả luồng hết hạn giữ chỗ sau 5 phút: Delay Queue / ZSET Timer quét các đơn `HELD` quá hạn, chuyển `WHERE status = HELD` sang `EXPIRED` rồi cộng trả vé về Redis Lua một cách luỹ đẳng.',
            en: 'Trace the 5-minute hold expiry loop: timer worker atomically marks `HELD -> EXPIRED` in DB first, then credits inventory back to Redis idempotently.',
          },
        },
      ],
      E: [
        {
          id: 'fs-e1',
          text: {
            vi: 'Giải quyết Hot Key trên Redis ở 500.000 RPS: chia 10.000 vé của sự kiện thành ví dụ 20 bucket con (`stock:{event}:b0..b19`, mỗi bucket 500 vé) rải trên nhiều shard Redis + cờ cục bộ `is_sold_out` trên App Server.',
            en: 'Scale past single-Redis-shard limits at 500K RPS by splitting 10,000 tickets into 20 inventory sub-buckets across shards + in-process sold-out flags.',
          },
        },
        {
          id: 'fs-e2',
          text: {
            vi: 'Xử lý sự cố lệch giữa Redis và DB (nếu Redis sập hoặc message thất lạc): đối chiếu lại từ bảng `reservations` làm nguồn sự thật cuối cùng, kèm ràng buộc `CHECK (stock >= 0)` ở PostgreSQL làm chốt chặn bảo vệ thứ hai.',
            en: 'Reconcile Redis vs PostgreSQL on node crash (rebuild stock from durable `reservations` + Outbox) while keeping SQL `CHECK (stock >= 0)` as the ultimate safety net.',
          },
        },
      ],
    },
    rubric: [
      {
        id: 'fs-r1',
        stage: 'S',
        points: 8,
        criterion: {
          vi: 'Làm rõ bất biến không bán vượt kho (`oversell = 0`), giới hạn số vé mỗi người dùng và thời gian giữ chỗ 5 phút.',
          en: 'Established zero-oversell invariant, per-user ticket limit, and 5-minute payment reservation window.',
        },
        expectedDetail: {
          vi: 'Tách biệt rõ bước "giữ vé nhanh" tại thời điểm mở bán với bước "thanh toán ngân hàng chậm" sau đó.',
          en: 'Recognized immediately that external payment calls cannot sit inside the T=0 inventory lock.',
        },
      },
      {
        id: 'fs-r2',
        stage: 'S',
        points: 7,
        criterion: {
          vi: 'Xác định yêu cầu chống bot theo tài khoản và cô lập tài nguyên (Bulkhead) để không làm ngừng các sự kiện khác.',
          en: 'Captured per-user bot throttling and bulkhead isolation from regular platform traffic.',
        },
        expectedDetail: {
          vi: 'Một sự kiện hot không được làm cạn tài nguyên dùng chung của toàn website.',
          en: 'Dedicated flash-sale gateway/worker pools protect standard ticketing flows.',
        },
      },
      {
        id: 'fs-r3',
        stage: 'N',
        points: 8,
        criterion: {
          vi: 'Giải thích bằng con số vì sao 500.000 RPS đập thẳng vào `SELECT ... FOR UPDATE` / `UPDATE` trên 1 dòng SQL sẽ gây nghẽn khoá và cạn kết nối.',
          en: 'Proved quantitatively why 500K RPS hitting a single SQL row lock serializes throughput and exhausts connection pools.',
        },
        expectedDetail: {
          vi: '1 khoá dòng giữ 0,5 ms chỉ cho tối đa 2.000 giao dịch/giây trên dòng đó dù máy DB có 64 nhân CPU.',
          en: 'Row-level lock contention caps single-row throughput regardless of DB CPU cores.',
        },
      },
      {
        id: 'fs-r4',
        stage: 'N',
        points: 7,
        criterion: {
          vi: 'Nhận diện tỷ lệ lọc phễu: 500.000 yêu cầu cạnh tranh nhưng tối đa chỉ ~10.000 lượt thắng mới cần ghi xuống cơ sở dữ liệu.',
          en: 'Highlighted that at most 10,000 winning reservations need SQL writes—98% of traffic can be rejected at the edge/memory tier.',
        },
        expectedDetail: {
          vi: 'Biến bài toán ghi DB 500K TPS bất khả thi thành bài toán ghi 10K dòng qua hàng đợi cực kỳ nhẹ nhàng.',
          en: 'Turns an impossible 500K SQL write spike into a trivial 10K queued insert workload.',
        },
      },
      {
        id: 'fs-r5',
        stage: 'A',
        points: 8,
        criterion: {
          vi: 'API `POST /reserve` bắt buộc `Idempotency-Key`, xác thực JWT người dùng ở cổng và trả `202 Accepted` kèm mã giữ chỗ.',
          en: 'Designed `POST /reserve` with `Idempotency-Key`, authenticated `user_id`, and `202 Accepted` async reservation token.',
        },
        expectedDetail: {
          vi: 'Ngăn một người dùng bấm liên tiếp 10 lần nhận 10 vé hoặc trừ kho nhầm khi mạng retry.',
          en: 'Prevents rapid double-clicks from reserving multiple holds.',
        },
      },
      {
        id: 'fs-r6',
        stage: 'A',
        points: 7,
        criterion: {
          vi: 'Lược đồ PostgreSQL vẫn giữ ràng buộc toàn vẹn (`CHECK (available >= 0)`, `UNIQUE(event_id, reservation_id)`, tổng vé của user ≤ 2) làm chốt an toàn cuối cùng.',
          en: 'Retained SQL constraints (`CHECK (available >= 0)`, `UNIQUE` reservation keys) as the authoritative ground-truth safety net.',
        },
        expectedDetail: {
          vi: 'Không bao giờ phó mặc hoàn toàn tính đúng đắn tài chính chỉ cho một lớp cache đơn lẻ.',
          en: 'Defense-in-depth ensures SQL still blocks overselling even if cache state ever drifts.',
        },
      },
      {
        id: 'fs-r7',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Tách trang chi tiết sự kiện tĩnh / đếm ngược ra CDN Edge và đặt Rate Limiter chặt theo `user_id` (ví dụ 1 req/giây/user) tại API Gateway.',
          en: 'Offloaded static event pages/countdowns to CDN Edge and enforced strict per-user rate limits at API Gateway.',
        },
        expectedDetail: {
          vi: 'Cắt bỏ ngay hàng triệu lượt tải lại HTML/ảnh và hàng trăm nghìn lượt spam từ script của cùng 1 tài khoản.',
          en: 'Strips static asset load and bot retry floods before reaching application logic.',
        },
      },
      {
        id: 'fs-r8',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Sử dụng Redis Lua Script nguyên tử vừa kiểm tra `user_bought + qty <= 2` vừa kiểm tra `stock >= qty` và trừ kho trong 1 thao tác.',
          en: 'Used an atomic Redis Lua script checking user quota AND decrementing available stock in one indivisible step.',
        },
        expectedDetail: {
          vi: 'Không tách bước đọc `GET stock` ở app rồi mới gọi `DECR` vì sẽ gây bán âm dưới tải đồng thời.',
          en: 'Atomic Lua execution prevents Time-of-Check to Time-of-Use (TOCTOU) overselling.',
        },
      },
      {
        id: 'fs-r9',
        stage: 'K',
        points: 10,
        criterion: {
          vi: 'Đẩy 10.000 lượt giữ chỗ thành công qua Kafka xuống Order Workers ghi vào PostgreSQL theo tốc độ ổn định, kèm cơ chế thu hồi đơn quá hạn 5 phút.',
          en: 'Buffered winning reservations through Kafka to Order Workers and implemented deterministic 5-minute hold expiration + restock.',
        },
        expectedDetail: {
          vi: 'Database nhận lưu lượng phẳng vài nghìn dòng/giây với ρ thấp, không bao giờ nghẽn.',
          en: 'Smooths the downstream database write rate completely.',
        },
      },
      {
        id: 'fs-r10',
        stage: 'E',
        points: 9,
        criterion: {
          vi: 'Chia nhỏ tồn kho thành nhiều bucket (`Inventory Bucketing`, ví dụ 20 bucket × 500 vé) trên nhiều shard Redis + cờ ngắt nhanh trong RAM của App khi hết vé.',
          en: 'Sharded inventory into multiple Redis sub-buckets (e.g. 20 × 500) plus short-lived in-process `sold_out` circuit flags.',
        },
        expectedDetail: {
          vi: '1 node Redis đơn lẻ chỉ chịu ~70K–100K Lua/giây; chia 20 bucket giúp vượt ngưỡng 500.000 RPS dễ dàng (khi 1 bucket về 0, thử sang bucket kế hoặc hợp nhất phần lẻ cuối).',
          en: 'Sub-bucketing scales past the ~80K ops/s single-shard Redis ceiling to handle 500K+ RPS.',
        },
      },
      {
        id: 'fs-r11',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Xử lý cuộc đua (Race Condition) ở đúng giây phút thứ 5:00 giữa "Khách vừa thanh toán xong" và "Worker thu hồi đơn hết hạn".',
          en: 'Prevented the 5:00 boundary race condition between late payment confirmation and hold-expiration restock.',
        },
        expectedDetail: {
          vi: 'Cả hai luồng đều phải cạnh tranh trên câu lệnh điều kiện `UPDATE reservations SET status = ... WHERE id = ? AND status = \'HELD\'`; chỉ luồng thắng mới được cộng kho hoặc phát vé!',
          en: 'Both flows execute conditional `UPDATE ... WHERE status = \'HELD\'`; if Payment wins, Expiry sees 0 rows updated and does NOT restock.',
        },
      },
      {
        id: 'fs-r12',
        stage: 'E',
        points: 8,
        criterion: {
          vi: 'Phục hồi an toàn khi Redis mất node hoặc mất gói tin giữa Redis và Kafka (ghi log giữ chỗ trên Redis AOF/Replica + đối chiếu ngược với bảng `reservations`).',
          en: 'Handled partial failures between Redis decrement and Kafka publish (restoring leaked holds via reconciliation without ever overselling).',
        },
        expectedDetail: {
          vi: 'Trừ trước ở Redis nếu lỗi ghi Kafka chỉ làm tạm thiếu 1 vé (undersell tạm thời, sẽ được đối soát cộng lại sau 1–2 phút), không bao giờ gây oversell.',
          en: 'Decrement-before-enqueue errs safely on temporary undersell (recoverable via reconciliation) rather than irreversible oversell.',
        },
      },
    ],
    recommendedComponents: [
      'cdn-edge',
      'l7-lb',
      'api-gateway',
      'redis-cache-aside',
      'idempotency-store',
      'consistent-hash-shards',
      'kafka-queue',
      'worker-pool',
      'pg-primary-replica',
      'outbox-saga',
    ],
    referenceArchitecture: {
      summary: {
        vi: 'Kiến trúc phễu giảm tải đa tầng tách riêng trên cụm Bulkhead Flash Sale. Trang thông tin sự kiện phục vụ 100% từ CDN Edge. Tại 20:00:00, yêu cầu `POST /reserve` đi qua API Gateway (xác thực JWT + Rate Limit 1 req/s theo `user_id`) vào Reservation Service. Nếu cờ cục bộ báo chưa hết vé, dịch vụ băm `user_id` chọn 1 trong 20 bucket tồn kho rải trên cụm Redis Shards và chạy Lua Script nguyên tử (kiểm tra `Idempotency-Key`, kiểm tra hạn mức `≤ 2 vé/user`, trừ tồn kho và ghi dấu giữ chỗ). 490.000 lượt dư bị từ chối ngay trong < 2 ms; chỉ 10.000 lượt thắng được đẩy vào Kafka để Order Workers tạo đơn `HELD` (TTL 5 phút) trong PostgreSQL kèm `CHECK (stock >= 0)`. Bộ lập lịch hết hạn đối chiếu điều kiện `WHERE status = HELD` để hoàn trả vé chưa thanh toán về lại bucket Redis một cách luỹ đẳng.',
        en: 'Uses a multi-stage load-shedding funnel inside a dedicated Flash Sale Bulkhead. Static event assets load 100% from CDN Edge. At 20:00:00, `POST /reserve` passes API Gateway (JWT auth + 1 req/s per-user rate limit) into Reservation Service, which hashes `user_id` to one of 20 sharded Redis inventory buckets (falling back across remaining non-empty buckets for final tail tickets) and runs an atomic Lua script checking `Idempotency-Key`, `≤ 2` user cap, and decrementing stock. 490K excess requests fast-fail in memory within < 2 ms; only ≤ 10K winning holds flow into Kafka -> Order Workers -> PostgreSQL (`HELD` with 5-min expiry and `CHECK (stock >= 0)`). An expiration worker executes `UPDATE ... WHERE status = HELD` before idempotently crediting unpaid tickets back to Redis.',
      },
      writePath: {
        vi: 'Client POST /reserve (`Idempotency-Key`) -> Gateway Rate Limit -> Reservation Service -> Atomic Redis Lua trên Sharded Bucket (trừ vé + ghi dấu hold) -> Kafka `winning_holds` -> Order Worker tạo dòng `HELD` trong PostgreSQL -> Trả mã giữ chỗ cho Client chuyển sang thanh toán.',
        en: 'Client POST /reserve (`Idempotency-Key`) -> Gateway Rate Limit -> Sharded Redis Lua (check cap + decrement bucket) -> Kafka `winning_holds` -> Order Worker inserts `HELD` row in PostgreSQL -> Client proceeds to 5-min payment.',
      },
      readPath: {
        vi: 'Trang sự kiện & cờ `sold_out` toàn cục đọc từ CDN Edge + L1 Cache trong tiến trình App (TTL 500 ms); trạng thái giữ chỗ của từng người mua kiểm tra nhanh trên Redis theo `reservation_id`.',
        en: 'Event details load from CDN Edge; global/tier availability reads from 500ms in-process L1 caches; buyer reservation status polls Redis by `reservation_id`.',
      },
      tradeoffs: [
        {
          vi: 'Chia tồn kho thành 20 Bucket trên Redis: đạt thông lượng > 500.000 RPS mà không nghẽn 1 shard, đổi lại ở vài chục vé cuối cùng cần bước gom phần dư hoặc thử sang bucket còn vé.',
          en: 'Splitting stock across 20 Redis buckets unlocks 500K+ RPS throughput at the minor cost of tail-ticket fallback across non-empty buckets.',
        },
        {
          vi: 'Trừ kho trên Redis trước khi ghi bất đồng bộ vào Kafka/DB: ưu tiên tuyệt đối `oversell = 0` và bảo vệ DB; nếu pod chết ngay giữa 2 bước chỉ gây giữ hụt tạm thời vài vé và được job đối soát trả lại kho sau ~60 giây.',
          en: 'Decrementing Redis before async Kafka persistence guarantees zero overselling while letting background reconciliation recover any orphaned decrements.',
        },
      ],
    },
  },
];

export type CalibrationBand = 'Lean No-Hire' | 'Hire' | 'Strong Hire';

export function computeCalibrationBand(score: number): CalibrationBand {
  if (score >= 80) return 'Strong Hire';
  if (score >= 55) return 'Hire';
  return 'Lean No-Hire';
}

export interface NapkinComputedMetrics {
  avgReadRps: number;
  peakReadRps: number;
  avgWriteRps: number;
  peakWriteRps: number;
  dailyStorageGb: number;
  fiveYearStorageTb: number;
  retentionStorageTb: number;
  avgBandwidthMBps: number;
  peakBandwidthMBps: number;
  hotCacheRamGb: number;
}

export function computeNapkinMetrics(input: NapkinPreset): NapkinComputedMetrics {
  const safeDau = Math.max(0, Number.isFinite(input.dau) ? input.dau : 0);
  const safeReads = Math.max(
    0,
    Number.isFinite(input.readsPerUserPerDay) ? input.readsPerUserPerDay : 0
  );
  const safeWrites = Math.max(
    0,
    Number.isFinite(input.writesPerUserPerDay) ? input.writesPerUserPerDay : 0
  );
  const safePayloadKb = Math.max(0, Number.isFinite(input.payloadKb) ? input.payloadKb : 0);
  const safeYears = Math.max(0, Number.isFinite(input.retentionYears) ? input.retentionYears : 0);

  const SECONDS_PER_DAY = 86_400;
  const dailyReads = safeDau * safeReads;
  const dailyWrites = safeDau * safeWrites;

  const avgReadRps = dailyReads / SECONDS_PER_DAY;
  const peakReadRps = avgReadRps * 3;
  const avgWriteRps = dailyWrites / SECONDS_PER_DAY;
  const peakWriteRps = avgWriteRps * 3;

  // Decimal engineering units: 1 GB = 10^6 KB, 1 TB = 10^3 GB, 1 MB = 10^3 KB
  const dailyStorageGb = (dailyWrites * safePayloadKb) / 1_000_000;
  const fiveYearStorageTb = (dailyStorageGb * 365 * 5) / 1_000;
  const retentionStorageTb = (dailyStorageGb * 365 * safeYears) / 1_000;

  const avgBandwidthMBps = ((avgReadRps + avgWriteRps) * safePayloadKb) / 1_000;
  const peakBandwidthMBps = avgBandwidthMBps * 3;

  // 20% Pareto hot working set of daily read volume
  const hotCacheRamGb = (0.2 * dailyReads * safePayloadKb) / 1_000_000;

  return {
    avgReadRps,
    peakReadRps,
    avgWriteRps,
    peakWriteRps,
    dailyStorageGb,
    fiveYearStorageTb,
    retentionStorageTb,
    avgBandwidthMBps,
    peakBandwidthMBps,
    hotCacheRamGb,
  };
}
