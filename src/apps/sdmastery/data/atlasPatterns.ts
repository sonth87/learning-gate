import type { SkillLevel } from '@/types/curriculum.types';
import type { GlossaryCategory, GlossaryTerm } from '@/types/glossary.types';

export type SdAtlasCategoryId =
  | 'foundation'
  | 'scaling-lb'
  | 'caching-cdn'
  | 'data-sharding'
  | 'messaging-async'
  | 'consensus-tx'
  | 'reliability-obs'
  | 'security-shipping';

export type SdAtlasDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SdAtlasCategoryMeta {
  id: SdAtlasCategoryId;
  labelVi: string;
  labelEn: string;
  shortVi: string;
  shortEn: string;
  tone: 'blue' | 'green' | 'amber' | 'purple' | 'orange' | 'rose';
}

export interface SdAtlasPattern {
  id: string;
  term: string;
  aliases: string[];
  category: SdAtlasCategoryId;
  glossaryKind?: Extract<GlossaryCategory, 'concept' | 'ecosystem'>;
  difficulty: SdAtlasDifficulty;
  relatedModules: string[];
  relatedPatternIds?: string[];
  shortVi: string;
  shortEn: string;
  mechanismVi: string;
  whenToUseVi: string[];
  tradeoffsVi: string[];
  failureModeVi: string;
  configSnippet: string;
}

export const SD_ATLAS_CATEGORIES: SdAtlasCategoryMeta[] = [
  {
    id: 'foundation',
    labelVi: 'Nền tảng định lượng',
    labelEn: 'Quantitative Foundations',
    shortVi: 'Độ trễ, thông lượng, hàng đợi, ước lượng tải và SLO',
    shortEn: 'Latency, throughput, queueing math, estimation and SLOs',
    tone: 'blue',
  },
  {
    id: 'scaling-lb',
    labelVi: 'Mở rộng & Cân bằng tải',
    labelEn: 'Scaling & Load Balancing',
    shortVi: 'Scale ngang/dọc, tầng stateless, L4/L7 LB, proxy và gateway',
    shortEn: 'Horizontal/vertical scaling, stateless tier, L4/L7 LB and gateway',
    tone: 'green',
  },
  {
    id: 'caching-cdn',
    labelVi: 'Bộ nhớ đệm & CDN',
    labelEn: 'Caching & Edge Delivery',
    shortVi: 'Chiến lược đọc/ghi cache, chống stampede, TTL jitter và CDN',
    shortEn: 'Cache read/write strategies, stampede control, TTL jitter and CDN',
    tone: 'amber',
  },
  {
    id: 'data-sharding',
    labelVi: 'Lưu trữ, Nhân bản & Phân mảnh',
    labelEn: 'Storage, Replication & Sharding',
    shortVi: 'Replication, sharding, consistent hashing, B-Tree/LSM và chỉ mục',
    shortEn: 'Replication, sharding, consistent hashing, storage engines and indexes',
    tone: 'purple',
  },
  {
    id: 'messaging-async',
    labelVi: 'Hàng đợi & Bất đồng bộ',
    labelEn: 'Messaging & Event-Driven',
    shortVi: 'Message queue, back-pressure, DLQ, Pub/Sub, fan-out, CQRS',
    shortEn: 'Queues, back-pressure, DLQ, Pub/Sub, fan-out, CQRS and Event Sourcing',
    tone: 'orange',
  },
  {
    id: 'consensus-tx',
    labelVi: 'Đồng thuận & Giao dịch phân tán',
    labelEn: 'Consensus & Distributed Tx',
    shortVi: 'CAP/PACELC, Quorum, Raft, Fencing Token, 2PC, Saga, CRDT, Outbox',
    shortEn: 'CAP/PACELC, Quorum, Raft, Fencing Token, 2PC, Saga, CRDT and Outbox',
    tone: 'purple',
  },
  {
    id: 'reliability-obs',
    labelVi: 'Độ tin cậy & Quan sát',
    labelEn: 'Reliability & Observability',
    shortVi: 'SPOF, timeout, backoff jitter, circuit breaker, bulkhead, tracing',
    shortEn: 'SPOF, timeouts, backoff, circuit breaker, bulkhead, rate limit and tracing',
    tone: 'rose',
  },
  {
    id: 'security-shipping',
    labelVi: 'Bảo mật, Triển khai & Đa vùng',
    labelEn: 'Security, Delivery & Multi-Region',
    shortVi: 'mTLS/JWT, Canary, migration không gián đoạn, multi-region và Chaos',
    shortEn: 'Zero-trust mTLS/JWT, Canary, safe schema migration, multi-region and Chaos',
    tone: 'green',
  },
];

export const SD_PATTERN_LEVEL_TO_SKILL: Record<SdAtlasDifficulty, SkillLevel> = {
  Beginner: 'fundamental',
  Intermediate: 'basic',
  Advanced: 'advanced',
};

export const SD_ATLAS_PATTERNS: SdAtlasPattern[] = [
  // ============================================================================
  // 1. FOUNDATION (7 patterns)
  // ============================================================================
  {
    id: 'sd_latency_throughput',
    term: 'Latency vs Throughput',
    aliases: ['Latency', 'Throughput', 'RPS', 'QPS', 'Response Time'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S1-04', 'S1-06', 'S0-09'],
    relatedPatternIds: ['sd_percentiles_tail_latency', 'sd_littles_law', 'sd_utilization_queueing'],
    shortVi:
      'Latency là thời gian hoàn tất một yêu cầu (ms), còn Throughput là số lượng yêu cầu hệ thống xử lý xong trên một đơn vị thời gian (RPS/QPS).',
    shortEn:
      'Latency measures single-request duration (ms), while throughput measures requests completed per unit time (RPS/QPS).',
    mechanismVi:
      'Tổng Latency của một request bằng thời gian truyền mạng (RTT) cộng thời gian xử lý thực tế (Service Time S) cộng thời gian xếp hàng chờ tài nguyên (Queueing Time Wq). Khi tải thấp, thêm worker song song giúp tăng Throughput gần tuyến tính mà Latency ít đổi; nhưng khi chạm ngưỡng bão hòa tài nguyên, thời gian chờ Wq tăng vọt làm Latency xấu đi nhanh dù Throughput không tăng thêm.',
    whenToUseVi: [
      'Phân tích đường cong tải (load curve) để xác định điểm uốn trước khi hệ thống quá tải.',
      'Tách biệt bài toán giảm độ trễ đơn lẻ (tối ưu truy vấn, đặt CDN gần user) với bài toán tăng thông lượng tổng (scale ngang hoặc gom batch).',
    ],
    tradeoffsVi: [
      'Gom lô (micro-batching) giúp tăng mạnh Throughput ghi đĩa/mạng nhưng cộng thêm vài chục mili-giây Latency cho từng phần tử đợi đủ lô.',
      'Xử lý tuần tự trên in-memory thread giảm chi phí chuyển ngữ cảnh (Latency thấp) nhưng giới hạn trần Throughput trên một nhân CPU.',
    ],
    failureModeVi:
      'Nhầm lẫn "giảm Latency đồng nghĩa tăng Throughput" hoặc ngược lại: thêm máy chủ ứng dụng khi Database đã đạt 100% công suất không làm tăng Throughput mà chỉ chất thêm hàng đợi và làm vọt Latency.',
    configSnippet: `Total Latency (W) = Network RTT + Queueing Delay (Wq) + Service Time (S)
Max Single-Node Throughput (μ) = Concurrency / Service_Time_Seconds
# Ví dụ: 1 worker xử lý S = 5 ms -> tối đa μ = 200 RPS/worker`,
  },
  {
    id: 'sd_percentiles_tail_latency',
    term: 'Percentile Latency (p50 / p95 / p99) & Tail Latency',
    aliases: ['Percentile', 'p50', 'p95', 'p99', 'Tail Latency', 'Tail Amplification'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S0-09', 'S1-04', 'S1-07', 'S4-07'],
    relatedPatternIds: ['sd_latency_throughput', 'sd_sla_slo_sli', 'sd_timeout_deadline'],
    shortVi:
      'Đo phân vị độ trễ thay vì số trung bình: p99 = 280 ms nghĩa là 99% request hoàn thành dưới 280 ms và 1% chậm nhất vượt mức này.',
    shortEn:
      'Measures latency distribution quantiles instead of averages: p99 = 280 ms means 1% of requests are slower than 280 ms.',
    mechanismVi:
      'Số trung bình cộng (mean) dễ che khuất các điểm nghẽn cục bộ như GC pause, lock contention hoặc cache miss. Phân vị cao (p95, p99, p99.9) phản ánh trải nghiệm thực của nhóm request nặng nhất. Trong kiến trúc microservices gọi song song N dịch vụ con (fan-out), một trang chỉ trả về khi dịch vụ chậm nhất hoàn tất, dẫn tới hiệu ứng khuếch đại đuôi độ trễ (Tail Latency Amplification).',
    whenToUseVi: [
      'Đặt ngưỡng SLO và cảnh báo vận hành cho API thanh toán, tìm kiếm hoặc trang chủ nhiều lời gọi nội bộ.',
      'Đánh giá tác động của fan-out song song qua nhiều shard hoặc nhiều microservice.',
    ],
    tradeoffsVi: [
      'Giữ p99 thấp đòi hỏi chừa khoảng trống công suất (headroom 30–40%) hoặc dùng hedged requests, làm tăng chi phí hạ tầng.',
      'Histogram phân vị chuẩn (HDRHistogram / DDSketch) tốn thêm bộ nhớ giám sát so với biến đếm trung bình đơn giản.',
    ],
    failureModeVi:
      'Tính trung bình của các giá trị p99 từ nhiều máy chủ (averaging percentiles) cho kết quả sai lệch hoàn toàn về mặt thống kê; phải gộp histogram bucket rồi mới tính phân vị.',
    configSnippet: `# Xác suất ít nhất 1 backend rơi vào đuôi p99 khi fan-out N = 50 dịch vụ:
P(page_slow) = 1 - (1 - 0.01)^50 = 1 - 0.99^50 ≈ 39.5%
# Với N = 100 backend: 1 - 0.99^100 ≈ 63.4% (p99 đơn lẻ biến thành gần p50 toàn trang!)`,
  },
  {
    id: 'sd_littles_law',
    term: "Little's Law (L = λW)",
    aliases: ["Little's Law", 'Concurrency Limit', 'In-Flight Requests'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S1-07', 'S0-04'],
    relatedPatternIds: ['sd_utilization_queueing', 'sd_latency_throughput', 'sd_bulkhead_isolation'],
    shortVi:
      'Định luật bảo toàn hàng đợi ở trạng thái ổn định: số yêu cầu đang xử lý đồng thời trung bình (L) bằng tốc độ đến (λ) nhân thời gian lưu lại hệ thống (W).',
    shortEn:
      'Steady-state queueing law: average in-flight concurrency (L) equals arrival rate (λ) multiplied by average residence time (W).',
    mechanismVi:
      'Định luật Little áp dụng độc lập với phân phối xác suất của tải đến hay thứ tự lập lịch, miễn hệ thống ổn định (λ < μ, hàng đợi không phình vô hạn). Công thức cho phép quy đổi trực tiếp giữa RPS mong muốn, thời gian phản hồi trung bình và kích thước thread pool hoặc connection pool cần cấp phát.',
    whenToUseVi: [
      'Tính toán kích thước connection pool tới Database hoặc giới hạn max concurrent requests trên mỗi pod.',
      'Ước lượng dung lượng bộ nhớ giữ kết nối đồng thời khi dịch vụ phụ tăng độ trễ.',
    ],
    tradeoffsVi: [
      'Đặt giới hạn L (concurrency limit) thấp bảo vệ máy chủ khỏi cạn RAM nhưng từ chối sớm request (HTTP 429/503) khi có gai tải ngắn.',
      'Đặt L quá lớn khiến hàng đợi phình dài, request chờ quá timeout của client dù máy chủ vẫn tốn CPU xử lý.',
    ],
    failureModeVi:
      'Khi downstream chậm từ W = 20 ms lên W = 2 s ở cùng mức tải λ = 500 RPS, số request đồng thời L vọt từ 10 lên 1.000 làm cạn sạch thread pool chỉ trong vài giây.',
    configSnippet: `L = λ × W
# Ví dụ định cỡ DB Connection Pool:
# λ = 1,200 queries/s, thời gian query trung bình W = 15 ms (0.015 s)
# Số kết nối bận trung bình L = 1200 * 0.015 = 18 connections (cấp pool ~30–40 kèm headroom)`,
  },
  {
    id: 'sd_utilization_queueing',
    term: 'Utilization (ρ) & Queueing Delay',
    aliases: ['Utilization', 'Queueing Delay', 'Kingman Formula', 'Headroom'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S0-09', 'S1-03', 'S1-07'],
    relatedPatternIds: ['sd_littles_law', 'sd_bottleneck_amdahl', 'sd_message_queue_backpressure'],
    shortVi:
      'Hệ số sử dụng ρ = λ / μ đo tỷ lệ bận của tài nguyên; khi ρ vượt ~0.75–0.80, độ trễ xếp hàng tăng phi tuyến theo 1 / (1 − ρ).',
    shortEn:
      'Resource utilization ρ = λ / μ causes non-linear queueing delay proportional to 1 / (1 − ρ) once ρ exceeds 75–80%.',
    mechanismVi:
      'Trong mô hình hàng đợi M/M/1 (hoặc xấp xỉ Kingman cho tải biến thiên), tổng thời gian phản hồi W = S / (1 − ρ). Ở ρ = 0.5, request tốn gấp 2 lần thời gian phục vụ S; ở ρ = 0.9 tốn gấp 10 lần S; và khi ρ tiến sát 1.0, độ dài hàng đợi tăng vọt không giới hạn do các đợt request đến ngẫu nhiên không còn khoảng nghỉ để xả.',
    whenToUseVi: [
      'Xác định ngưỡng autoscaling hợp lý (thường đặt mục tiêu CPU/DB utilization khoảng 60%–70% thay vì 95%).',
      'Giải thích vì sao hệ thống đang chạy ổn ở 2.500 RPS lại tăng vọt p99 gấp 8 lần khi lên 2.950 RPS.',
    ],
    tradeoffsVi: [
      'Duy trì ρ thấp (≤ 0.65) giữ p99 ổn định và hấp thụ được gai tải ngắn nhưng chi phí máy chủ trên mỗi request cao hơn.',
      'Chạy ρ cao (> 0.85) tiết kiệm máy cho tác vụ batch nền nhưng không phù hợp cho API tương tác trực tuyến.',
    ],
    failureModeVi:
      'Chờ CPU chạm 90–95% mới kích hoạt scale out: lúc instance mới khởi động xong (mất 60–180 giây), hàng đợi đã tràn và gây lỗi dây chuyền.',
    configSnippet: `ρ = λ / (c × μ)    # λ: arrival rate, c: số worker, μ: năng lực 1 worker
W = S / (1 - ρ)   # Mô hình M/M/1 cơ bản
# S = 10 ms: ρ=0.5 -> W=20 ms | ρ=0.8 -> W=50 ms | ρ=0.95 -> W=200 ms`,
  },
  {
    id: 'sd_bottleneck_amdahl',
    term: "Bottleneck & Amdahl's Law",
    aliases: ['Bottleneck', "Amdahl's Law", 'Serial Fraction'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S1-03', 'S4-01', 'S0-06'],
    relatedPatternIds: ['sd_utilization_queueing', 'sd_vertical_horizontal_scaling'],
    shortVi:
      'Thông lượng toàn hệ thống bị khóa trần bởi thành phần chạm ngưỡng bão hòa đầu tiên (ρ = 1), và mức tăng tốc tối đa bị giới hạn bởi phần tuần tự không thể song song hóa.',
    shortEn:
      'System throughput is capped by the first saturated resource, and maximum speedup is bounded by the non-parallelizable serial fraction.',
    mechanismVi:
      'Trong chuỗi xử lý nối tiếp (LB -> App -> Cache -> DB), thành phần nào có công suất hiệu dụng thấp nhất so với tỷ lệ tải đi qua nó sẽ đạt ρ = 1 trước tiên và trở thành điểm nghẽn (Bottleneck). Định luật Amdahl chỉ rõ nếu tỷ lệ s của tác vụ buộc phải chạy tuần tự (ví dụ giữ khóa dòng DB hoặc ghi leader duy nhất), việc tăng số worker N tới vô cùng cũng không thể vượt quá mức tăng tốc 1 / s.',
    whenToUseVi: [
      'Áp dụng quy trình 3 bước: đo telemetry (ρ, p99 theo chặng) -> xác định đúng thành phần nghẽn -> tối ưu hoặc mở rộng đúng tầng đó.',
      'Đánh giá lợi ích thực tế trước khi tăng số replica hoặc thêm nhân CPU cho tác vụ có khóa đồng bộ.',
    ],
    tradeoffsVi: [
      'Gỡ bỏ một điểm nghẽn hiện tại (ví dụ tăng cache hit để giảm tải DB) sẽ làm lộ ra điểm nghẽn kế tiếp ở băng thông mạng hoặc CPU serialize JSON.',
      'Giảm phần tuần tự s thường đòi hỏi nới lỏng tính nhất quán (từ khóa đồng bộ sang phân mảnh hoặc xử lý bất đồng bộ).',
    ],
    failureModeVi:
      'Tăng gấp ba số instance tầng App khi điểm nghẽn thật sự nằm ở Database: không những không tăng RPS tối đa mà còn làm tăng số kết nối tranh chấp khóa trên DB.',
    configSnippet: `Speedup(N) = 1 / (s + (1 - s) / N)
# Nếu 20% thời gian bị khóa tuần tự (s = 0.20):
# N = 4 -> 2.5x | N = 16 -> 4.0x | N -> ∞ tối đa chỉ đạt 1 / 0.20 = 5.0x`,
  },
  {
    id: 'sd_napkin_math',
    term: 'Back-of-the-Envelope Estimation (Napkin Math)',
    aliases: ['Napkin Math', 'Capacity Estimation', 'Back-of-the-Envelope', 'Scale Intuition'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S0-05', 'S0-04', 'S6-02'],
    relatedPatternIds: ['sd_latency_throughput', 'sd_sla_slo_sli'],
    shortVi:
      'Phương pháp ước lượng bậc độ lớn nhanh từ DAU sang RPS trung bình/đỉnh, băng thông mạng, dung lượng lưu trữ và bộ nhớ đệm với sai số chấp nhận ±30%.',
    shortEn:
      'Order-of-magnitude estimation converting DAU into average/peak RPS, network bandwidth, storage growth and cache RAM.',
    mechanismVi:
      'Sử dụng các mốc quy đổi tròn số (1 ngày ≈ 86.400 s ≈ 10^5 s, 1 năm ≈ 3,15 × 10^7 s) cùng tỷ lệ Read:Write và hệ số Peak-to-Average (thường 2x–5x, sự kiện đột biến 10x) để kiểm tra nhanh xem một máy đơn lẻ đủ sức gánh hay bắt buộc phải dùng cache, read replica và sharding.',
    whenToUseVi: [
      'Bước Numbers trong khung phỏng vấn SNAKE hoặc bước lập kế hoạch dung lượng ban đầu cho tính năng mới.',
      'Loại bỏ sớm các phương án thiết kế vượt giới hạn vật lý (ví dụ băng thông NIC hoặc IOPS một ổ NVMe).',
    ],
    tradeoffsVi: [
      'Tính nhẩm quá chi tiết từng byte làm mất thời gian thiết kế kiến trúc mà không đổi quyết định kỹ thuật.',
      'Bỏ qua hệ số Peak/Hotspot khiến hệ thống đủ tải trung bình ngày nhưng quá tải vào khung giờ cao điểm.',
    ],
    failureModeVi:
      'Lấy tổng request ngày chia 86.400 rồi định cỡ sát con số trung bình mà quên nhân hệ số Peak (3x–5x) và hệ số nhân bản lưu trữ (Replication Factor ×3).',
    configSnippet: `1 day = 86,400 s ≈ 10^5 s  |  1M req/day ≈ 12 RPS avg (Peak ×3 ≈ 36 RPS)
Storage/year = Writes_per_sec × Record_Bytes × 3.15e7 × Replication_Factor(3)
Cache RAM (quy tắc 20% hot) = 0.20 × Daily_Unique_Reads × Object_Bytes`,
  },
  {
    id: 'sd_sla_slo_sli',
    term: 'SLI, SLO, SLA & Error Budget',
    aliases: ['SLI', 'SLO', 'SLA', 'Error Budget', 'Availability Nines'],
    category: 'foundation',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S1-04', 'S4-07', 'S6-07'],
    relatedPatternIds: ['sd_percentiles_tail_latency', 'sd_spof_redundancy', 'sd_distributed_tracing_red_use'],
    shortVi:
      'SLI là chỉ số đo thực tế, SLO là mục tiêu nội bộ cần đạt, SLA là cam kết pháp lý với khách hàng, và Error Budget là phần lỗi cho phép (1 − SLO) để cân bằng tốc độ phát hành.',
    shortEn:
      'SLI is the measured metric, SLO is the target objective, SLA is the contractual commitment, and Error Budget is 1 − SLO.',
    mechanismVi:
      'Đội kỹ thuật chọn các SLI phản ánh trực tiếp trải nghiệm người dùng (tỷ lệ HTTP thành công, độ trễ p99), đặt ngưỡng SLO chặt hơn SLA bên ngoài một khoảng đệm an toàn. Phần bù 100% − SLO tạo thành ngân sách lỗi (Error Budget) trong cửa sổ 28 hoặc 30 ngày: còn ngân sách thì ưu tiên ra mắt tính năng, cạn ngân sách thì ưu tiên ổn định hạ tầng.',
    whenToUseVi: [
      'Thống nhất mục tiêu độ tin cậy định lượng giữa đội phát triển sản phẩm và đội vận hành SRE.',
      'Cấu hình cảnh báo theo tốc độ tiêu hao ngân sách lỗi (Burn-Rate Alerting) thay vì cảnh báo ngưỡng tĩnh gây nhiễu.',
    ],
    tradeoffsVi: [
      'Mỗi "số 9" tăng thêm (99.9% lên 99.99%) làm chi phí kiến trúc đa vùng và tự động failover tăng gấp nhiều lần.',
      'Đặt SLO quá cao không cần thiết làm chậm tốc độ triển khai tính năng và thử nghiệm sản phẩm.',
    ],
    failureModeVi:
      'Cam kết SLA dịch vụ của mình ở mức 99.99% trong khi phụ thuộc đồng bộ vào một dịch vụ bên thứ ba chỉ có 99.9% availability (tích chuỗi nối tiếp luôn thấp hơn thành phần yếu nhất).',
    configSnippet: `99.9%   ("3 nines") -> Error Budget = 43.2 min / 30 days (8.76 h / year)
99.99%  ("4 nines") -> Error Budget =  4.3 min / 30 days (52.6 min / year)
Serial Availability:   A_total = A_lb × A_app × A_db
Parallel Redundancy:   A_pair  = 1 - (1 - A_node)^2`,
  },

  // ============================================================================
  // 2. SCALING & LOAD BALANCING (7 patterns)
  // ============================================================================
  {
    id: 'sd_vertical_horizontal_scaling',
    term: 'Vertical Scaling vs Horizontal Scaling',
    aliases: ['Vertical Scaling', 'Horizontal Scaling', 'Scale Up', 'Scale Out', 'Autoscaling'],
    category: 'scaling-lb',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S4-01', 'S2-03', 'S6-07'],
    relatedPatternIds: ['sd_stateless_tier', 'sd_bottleneck_amdahl', 'sd_spof_redundancy'],
    shortVi:
      'Vertical Scaling nâng cấp cấu hình một máy lớn hơn (CPU/RAM/NVMe), còn Horizontal Scaling bổ sung nhiều máy chạy song song phía sau bộ cân bằng tải.',
    shortEn:
      'Vertical scaling upgrades a single machine size, whereas horizontal scaling distributes load across multiple machines.',
    mechanismVi:
      'Scale dọc giữ nguyên kiến trúc đơn giản, không phát sinh chi phí gọi mạng liên nút hay bài toán đồng bộ dữ liệu, nhưng bị khóa bởi trần phần cứng vật lý và tạo điểm hỏng đơn (SPOF). Scale ngang cho phép co giãn đàn hồi theo tải ngày/đêm (Autoscaling) và chịu lỗi từng máy, đổi lại ứng dụng phải phi trạng thái hoặc phân mảnh dữ liệu.',
    whenToUseVi: [
      'Ưu tiên Vertical Scaling ở giai đoạn đầu hoặc cho Database chính khi tải chưa vượt ngưỡng một máy chủ lớn.',
      'Áp dụng Horizontal Scaling cho tầng Web/API/Worker và khi cần độ sẵn sàng cao không gián đoạn.',
    ],
    tradeoffsVi: [
      'Scale dọc thường cần cửa sổ bảo trì hoặc failover khi đổi cỡ máy và chi phí phần cứng phân khúc cao tăng phi tuyến.',
      'Scale ngang có độ trễ khởi động instance mới (cold start 30–180 giây) và tăng độ phức tạp triển khai, giám sát.',
    ],
    failureModeVi:
      'Phụ thuộc hoàn toàn vào Autoscaling theo CPU cho sự kiện Flash Sale tăng tải gấp 10 lần trong 5 giây: cụm chưa kịp bật xong container mới thì dàn máy hiện tại đã quá tải.',
    configSnippet: `# Quy tắc định cỡ số pod tối thiểu theo tải mục tiêu kèm 35% headroom:
desired_replicas = ceil(peak_rps / (single_pod_max_rps * 0.65))
# Kết hợp Pre-warming trước giờ cao điểm thay vì chỉ đợi metric CPU trễ`,
  },
  {
    id: 'sd_stateless_tier',
    term: 'Stateless Application Tier & Externalized Session',
    aliases: ['Stateless Tier', 'Stateless Service', 'Sticky Session', 'Session Store'],
    category: 'scaling-lb',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-06', 'S2-01', 'S6-08'],
    relatedPatternIds: ['sd_vertical_horizontal_scaling', 'sd_l4_l7_load_balancer', 'sd_zero_trust_mtls_jwt'],
    shortVi:
      'Tầng ứng dụng không lưu trạng thái phiên hay tệp cục bộ trên RAM/đĩa của từng máy chủ, giúp bất kỳ instance nào cũng xử lý được request kế tiếp.',
    shortEn:
      'Application servers hold no client session state locally, allowing any instance to serve any subsequent request.',
    mechanismVi:
      'Thay vì gắn chặt người dùng vào một máy cố định qua Sticky Session (dễ mất giỏ hàng khi máy đó khởi động lại và gây lệch tải), dữ liệu phiên được tách ra kho lưu trữ dùng chung tốc độ cao (Redis/Valkey) hoặc đóng gói có chữ ký số trong token ngắn hạn, còn tệp tải lên đẩy thẳng sang Object Storage.',
    whenToUseVi: [
      'Thiết kế tầng API/Web cần tự động thêm bớt pod linh hoạt hoặc triển khai Rolling/Canary không làm rớt phiên đăng nhập.',
      'Chạy ứng dụng đa vùng dự phòng (Multi-AZ) nơi instance có thể bị thay thế bất kỳ lúc nào.',
    ],
    tradeoffsVi: [
      'Tách session sang Redis thêm một bước gọi mạng nội bộ (~0.5–1.5 ms) và biến cụm session store thành thành phần cần HA.',
      'Dùng JWT hoàn toàn không cần tra cứu mỗi request nhưng khó thu hồi tức thì trước hạn nếu không kèm danh sách thu hồi ngắn.',
    ],
    failureModeVi:
      'Lưu tạm tệp upload hoặc bộ đệm trạng thái bước 1 vào `/tmp` trên container: tới bước 2 Load Balancer điều hướng sang pod khác làm phát sinh lỗi `404 File Not Found` ngẫu nhiên.',
    configSnippet: `Client -> Load Balancer (Round Robin / Least Conn) -> Any App Pod [1..N]
App Pod -> Shared Session Store (Redis TTL 3600s) + Object Storage (S3)`,
  },
  {
    id: 'sd_l4_l7_load_balancer',
    term: 'Layer 4 vs Layer 7 Load Balancer',
    aliases: ['Load Balancer', 'L4 Load Balancer', 'L7 Load Balancer', 'Anycast'],
    category: 'scaling-lb',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S2-01', 'S1-01'],
    relatedPatternIds: ['sd_least_connections', 'sd_health_check_draining', 'sd_reverse_proxy'],
    shortVi:
      'L4 cân bằng tải ở tầng TCP/UDP dựa trên IP và Port với thông lượng rất cao; L7 đọc hiểu HTTP/gRPC để định tuyến theo host, path, header và quản lý TLS.',
    shortEn:
      'L4 routes TCP/UDP packets/flows by IP:port at high speed, while L7 inspects HTTP/gRPC headers, paths and TLS.',
    mechanismVi:
      'Bộ cân bằng tải L4 (như AWS NLB, IPVS/Maglev) chuyển tiếp gói tin trong cùng luồng kết nối mà không cần giải mã nội dung HTTP, đạt độ trễ cực thấp và hàng triệu kết nối đồng thời. Bộ cân bằng tải L7 (như Envoy, NGINX, AWS ALB) kết thúc kết nối TLS của client, đọc URL/header/cookie và gộp kết nối (connection multiplexing) về các nhóm microservice đích.',
    whenToUseVi: [
      'Chọn L4 cho giao thức TCP/UDP tùy chỉnh, cơ sở dữ liệu, MQTT/WebSocket quy mô lớn hoặc lớp biên Anycast đầu tiên.',
      'Chọn L7 khi cần định tuyến `/api/v1/orders` và `/api/v1/users` về khác service, gắn rate limit, WAF hoặc chia phần trăm Canary.',
    ],
    tradeoffsVi: [
      'L7 tiêu tốn nhiều CPU/RAM hơn do giải mã TLS và phân tích cú pháp HTTP, đồng thời tăng nhẹ độ trễ một hop proxy.',
      'L4 chỉ cân bằng tại thời điểm mở kết nối TCP: với HTTP/2 hoặc gRPC giữ kết nối dài hạn, L4 không chia đều từng RPC bên trong.',
    ],
    failureModeVi:
      'Dùng L4 Load Balancer cho gRPC nội bộ: vài kết nối HTTP/2 dài hạn neo cố định vào 1–2 pod cũ trong khi các pod mới vừa scale ra đứng rỗi hoàn toàn.',
    configSnippet: `# Kiến trúc hai tầng phổ biến ở quy mô lớn:
Internet -> Anycast / L4 LB (IPVS/NLB) -> Pool of L7 Proxies (Envoy/NGINX) -> App Pods`,
  },
  {
    id: 'sd_least_connections',
    term: 'Load Balancing Algorithms (Round Robin, Least Connections, P2C)',
    aliases: ['Least Connections', 'Round Robin', 'Weighted Round Robin', 'Power of Two Choices'],
    category: 'scaling-lb',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-01', 'S5-04'],
    relatedPatternIds: ['sd_l4_l7_load_balancer', 'sd_health_check_draining'],
    shortVi:
      'Chiến lược chọn backend nhận request kế tiếp: xoay vòng đều (Round Robin), ưu tiên máy ít request đang xử lý nhất (Least Connections), hoặc chọn ngẫu nhiên 2 máy rồi lấy máy nhẹ hơn (P2C).',
    shortEn:
      'Backend selection policies balancing simplicity (Round Robin) against heterogeneous request durations (Least Connections, P2C).',
    mechanismVi:
      'Round Robin phát tuần tự cho từng máy, hiệu quả khi mọi máy đồng cấu hình và mọi request tốn thời gian tương đương. Khi xen lẫn các truy vấn nặng tốn hàng trăm ms hoặc một máy bị GC chậm, Least Connections chủ động né máy đang tồn đọng nhiều in-flight requests. Khi có nhiều bộ cân bằng tải chạy song song không chia sẻ trạng thái tức thời, thuật toán Power of Two Random Choices (P2C) tránh hiện tượng tất cả LB cùng dồn tải về một máy vừa rỗi.',
    whenToUseVi: [
      'Dùng Least Connections hoặc P2C cho API có phương sai thời gian xử lý lớn (tìm kiếm, xuất báo cáo, inference).',
      'Dùng Weighted Round Robin khi cụm pha trộn thế hệ phần cứng khác nhau hoặc khi đang tăng dần tỷ lệ Canary.',
    ],
    tradeoffsVi: [
      'Round Robin không tốn chi phí theo dõi trạng thái nhưng phân phối kém khi độ dài tác vụ lệch lớn.',
      'Least Connections thuần túy có thể đẩy lượng lớn request vào một máy vừa khởi động xong (trạng thái 0 kết nối) nếu thiếu Slow Start.',
    ],
    failureModeVi:
      'Một instance bị lỗi trả về HTTP 500 chỉ trong 1 ms: vì kết nối giải phóng quá nhanh, Least Connections tưởng máy đó rất rỗi và hút gần hết lưu lượng về máy đang lỗi (hiệu ứng blackhole).',
    configSnippet: `upstream checkout_pool {
  least_conn;
  server 10.0.1.11:8080 max_fails=3 fail_timeout=10s slow_start=30s;
  server 10.0.1.12:8080 max_fails=3 fail_timeout=10s slow_start=30s;
}`,
  },
  {
    id: 'sd_health_check_draining',
    term: 'Active/Passive Health Check & Connection Draining',
    aliases: ['Health Check', 'Connection Draining', 'Slow Start', 'Graceful Shutdown'],
    category: 'scaling-lb',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-01', 'S5-04', 'S3-09'],
    relatedPatternIds: ['sd_l4_l7_load_balancer', 'sd_least_connections', 'sd_canary_feature_flags'],
    shortVi:
      'Kiểm tra định kỳ và quan sát tỷ lệ lỗi thật để rút máy hỏng khỏi danh sách nhận tải, kết hợp xả hết kết nối đang chạy trước khi tắt máy.',
    shortEn:
      'Probes and outlier detection remove unhealthy nodes, while connection draining finishes in-flight requests on shutdown.',
    mechanismVi:
      'Active Health Check gửi request thăm dò định kỳ tới endpoint `/readyz`; Passive Health Check (Outlier Detection) theo dõi lỗi 5xx/timeout trên lưu lượng thật để cách ly tức thì node gặp sự cố. Khi thu hồi hoặc cập nhật phiên bản, Connection Draining chuyển trạng thái readiness sang false để ngừng nhận kết nối mới nhưng giữ tiến trình sống thêm một khoảng thời gian (ví dụ 30s) cho các request dở dang hoàn tất.',
    whenToUseVi: [
      'Mọi dịch vụ đứng sau Load Balancer, Service Mesh hoặc triển khai tự động Rolling Update.',
      'Kết hợp chế độ Slow Start (tăng tải tuyến tính trong 30–60 giây đầu) cho dịch vụ cần làm ấm JIT hoặc local cache.',
    ],
    tradeoffsVi: [
      'Đặt chu kỳ thăm dò quá ngắn (ví dụ 500 ms từ 20 LB) tạo lưu lượng kiểm tra thừa; đặt quá thưa (30 s) làm tăng thời gian rớt request khi máy chết đột ngột.',
      'Thời gian Draining dài giúp bảo toàn giao dịch chậm nhưng kéo dài tổng thời gian rollout toàn cụm.',
    ],
    failureModeVi:
      'Nhúng truy vấn kiểm tra Database hoặc dịch vụ phụ vào endpoint liveness/deep health check: chỉ một chập chờn 2 giây ở DB khiến toàn bộ dàn app bị LB rút sạch đồng loạt (0 healthy hosts).',
    configSnippet: `# Trình tự tắt máy không rớt request (Zero-Downtime Shutdown):
1. Nhận SIGTERM -> /readyz trả HTTP 503 (ngừng nhận request mới)
2. Đợi LB cập nhật endpoint (5s) + chờ in-flight requests hoàn tất (tối đa 25s)
3. Đóng kết nối DB sạch và thoát tiến trình (exit 0)`,
  },
  {
    id: 'sd_reverse_proxy',
    term: 'Reverse Proxy & TLS Termination',
    aliases: ['Reverse Proxy', 'TLS Termination', 'Connection Multiplexing'],
    category: 'scaling-lb',
    glossaryKind: 'ecosystem',
    difficulty: 'Beginner',
    relatedModules: ['S2-01', 'S1-06', 'S6-10'],
    relatedPatternIds: ['sd_l4_l7_load_balancer', 'sd_api_gateway_discovery', 'sd_cdn_edge_caching'],
    shortVi:
      'Máy chủ trung gian đứng trước cụm backend để tiếp nhận kết nối Internet, giải mã TLS, nén phản hồi, lọc bảo mật và tái sử dụng kết nối nội bộ.',
    shortEn:
      'Fronting server that terminates client TLS, compresses payloads, shields backend IPs and pools upstream connections.',
    mechanismVi:
      'Client bên ngoài chỉ giao tiếp với địa chỉ công khai của Reverse Proxy (Envoy, NGINX, HAProxy, Cloudflare). Proxy đảm nhận bắt tay TLS 1.3 tốn CPU, đọc chậm từ mạng di động chập chờn (buffering tránh Slowloris), nén Brotli/Gzip, rồi chuyển yêu cầu qua pool kết nối keep-alive tốc độ cao vào mạng nội bộ.',
    whenToUseVi: [
      'Che giấu cấu trúc mạng nội bộ và tập trung quản lý chứng chỉ TLS/HTTPS tại một lớp biên thống nhất.',
      'Giảm tải quản lý hàng chục nghìn socket chậm từ thiết bị di động cho ứng dụng Node.js/Python/Go phía sau.',
    ],
    tradeoffsVi: [
      'Thêm một chặng mạng nội bộ (~0.3–1 ms) và bản thân cụm Reverse Proxy phải được triển khai cặp HA để không thành SPOF.',
      'Nếu giải mã TLS ở biên rồi truyền HTTP thuần trong nội bộ sẽ thiếu mã hóa trên đường truyền nội khu (cần cân nhắc re-encrypt hoặc mTLS cho dữ liệu nhạy cảm).',
    ],
    failureModeVi:
      'Quên cấu hình giới hạn `trusted_proxies` khi đọc header `X-Forwarded-For`, cho phép client bên ngoài giả mạo IP nguồn để vượt qua bộ giới hạn tốc độ (Rate Limiter).',
    configSnippet: `Client --(HTTPS TLS 1.3 / HTTP3)--> Reverse Proxy --(Keep-Alive Pool)--> App Service
# Chỉ tin cậy X-Forwarded-For từ dải CIDR của chính Load Balancer nội bộ!`,
  },
  {
    id: 'sd_api_gateway_discovery',
    term: 'API Gateway & Service Discovery',
    aliases: ['API Gateway', 'Service Discovery', 'Service Registry', 'BFF'],
    category: 'scaling-lb',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S5-04', 'S1-08', 'S5-01'],
    relatedPatternIds: ['sd_reverse_proxy', 'sd_token_bucket_rate_limit', 'sd_zero_trust_mtls_jwt'],
    shortVi:
      'API Gateway gom các chức năng cắt ngang ở biên (xác thực, rate limit, định tuyến phiên bản), kết hợp Service Discovery theo dõi danh sách IP:Port động của các instance.',
    shortEn:
      'API Gateway centralizes cross-cutting edge concerns while Service Discovery tracks dynamic service instance addresses.',
    mechanismVi:
      'Trong môi trường container nơi địa chỉ IP thay đổi liên tục khi scale hoặc deploy, mỗi instance đăng ký địa chỉ và gửi heartbeat vào Service Registry (Consul, etcd, Kubernetes Endpoints). API Gateway đứng ở rìa ngoài xác thực JWT/API Key, áp quota theo từng khách hàng, chuyển đổi giao thức (REST ngoài biên sang gRPC nội bộ) và tra cứu Registry để chuyển lưu lượng tới đúng instance đang sẵn sàng.',
    whenToUseVi: [
      'Cung cấp điểm truy cập hợp nhất cho ứng dụng Web/Mobile/Partner gọi vào hệ thống gồm nhiều microservice.',
      'Áp dụng mẫu Backend-for-Frontend (BFF) hoặc chuyển đổi dần từ Monolith sang Microservices (Strangler Fig).',
    ],
    tradeoffsVi: [
      'Đặt logic nghiệp vụ tổng hợp nặng vào API Gateway biến nó thành nút cổ chai phát triển và điểm nghẽn chung cho mọi đội.',
      'Service Registry cần chạy cụm đồng thuận tối thiểu 3–5 node và client phải giữ bản sao danh sách địa chỉ tạm phòng khi Registry gián đoạn.',
    ],
    failureModeVi:
      'Xóa ngay bản ghi Registry trước khi TTL DNS/client cache hết hạn, hoặc ngược lại: khi Registry gặp lỗi tạm thời, client xóa trắng danh sách endpoint thay vì giữ chế độ fail-open với danh sách gần nhất còn sống.',
    configSnippet: `# Quy tắc "Fail-Open Cache" cho Service Discovery Client:
if registry.reachable():
    endpoints = registry.watch_healthy("payment-svc")
else:
    endpoints = last_known_good_endpoints  # Không xóa trắng bảng địa chỉ!`,
  },

  // ============================================================================
  // 3. CACHING & CDN (8 patterns)
  // ============================================================================
  {
    id: 'sd_cache_aside',
    term: 'Cache-Aside (Lazy Loading)',
    aliases: ['Cache-Aside', 'Lazy Loading', 'Cache Hit Ratio'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-02', 'S1-03', 'S5-02'],
    relatedPatternIds: ['sd_cache_stampede_singleflight', 'sd_cache_invalidation', 'sd_ttl_jitter'],
    shortVi:
      'Ứng dụng tự kiểm tra Cache trước; nếu không có (Cache Miss) mới truy vấn Database rồi ghi kết quả vào Cache kèm thời gian sống TTL.',
    shortEn:
      'Application checks cache first, fetches from DB on miss, populates cache with TTL, and invalidates on write.',
    mechanismVi:
      'Cache đóng vai trò kho phụ trợ độc lập bên cạnh Database. Chỉ những dữ liệu thực sự được người dùng đọc mới chiếm bộ nhớ RAM. Khi có thao tác cập nhật dữ liệu, ứng dụng ghi thành công vào Database trước rồi thực hiện xóa key tương ứng trên Cache (`DEL`/`UNLINK`) để lần đọc tiếp theo nạp bản mới.',
    whenToUseVi: [
      'Hệ thống thiên về đọc (Read-heavy như trang chi tiết sản phẩm, hồ sơ người dùng, URL shortener với tỷ lệ đọc > 80%).',
      'Khi muốn hệ thống vẫn tiếp tục hoạt động (chuyển về đọc DB, chấp nhận chậm hơn) ngay cả khi cụm Cache gặp sự cố.',
    ],
    tradeoffsVi: [
      'Lần truy cập đầu tiên vào mỗi key (cold cache) luôn chịu độ trễ cao hơn bình thường vì tốn 3 bước (đọc cache miss + đọc DB + ghi cache).',
      'Tồn tại cửa sổ lệch dữ liệu ngắn nếu tiến trình đọc cũ ghi đè lên sau khi tiến trình ghi vừa xóa key.',
    ],
    failureModeVi:
      'Cập nhật đè giá trị vào Cache thay vì xóa key khi có hai luồng ghi đồng thời: luồng A ghi DB trước nhưng mạng chậm nên ghi Cache sau luồng B, khiến Cache giữ vĩnh viễn giá trị cũ cho tới hết TTL.',
    configSnippet: `val = cache.get(key)
if val is None:                  # Cache Miss
    val = db.query(id)
    cache.set(key, val, ttl=300 + rand(0, 60))
# Khi cập nhật: db.update(id, new_val) -> cache.unlink(key)`,
  },
  {
    id: 'sd_read_write_through',
    term: 'Read-Through & Write-Through Caching',
    aliases: ['Read-Through', 'Write-Through', 'Inline Cache'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-02', 'S2-02'],
    relatedPatternIds: ['sd_cache_aside', 'sd_write_behind'],
    shortVi:
      'Ứng dụng chỉ đọc/ghi trực tiếp qua lớp đại diện Cache; lớp này tự nạp từ DB khi miss (Read-Through) và ghi đồng bộ cả Cache lẫn DB trong cùng thao tác ghi (Write-Through).',
    shortEn:
      'Cache sits inline in front of the DB, transparently loading misses and synchronously writing to both cache and DB.',
    mechanismVi:
      'Khác với Cache-Aside nơi mã ứng dụng tự điều phối hai kho lưu trữ, Read-Through/Write-Through gom logic đồng bộ vào một thư viện data-access thống nhất hoặc dịch vụ cache chuyên dụng (như DynamoDB Accelerator DAX). Với Write-Through, thao tác ghi chỉ báo thành công khi dữ liệu đã nằm ở cả Cache và Database bền vững, giữ cho dữ liệu trên Cache luôn khớp bản mới.',
    whenToUseVi: [
      'Dữ liệu vừa được ghi xong có xác suất rất cao được đọc lại ngay lập tức (ví dụ trạng thái đơn hàng mới tạo, cài đặt tài khoản, bài đăng mới).',
      'Muốn đơn giản hóa mã nghiệp vụ, tránh lặp lại khung kiểm tra miss/invalidation ở hàng chục dịch vụ khác nhau.',
    ],
    tradeoffsVi: [
      'Mọi thao tác ghi đều chịu độ trễ tổng của cả Cache lẫn Database, và những bản ghi ít khi đọc lại vẫn tốn RAM trên Cache (cần kèm TTL/LRU).',
      'Nếu không có giao dịch nguyên tử hoặc cơ chế thử lại an toàn, lỗi nửa chừng giữa bước ghi DB và bước ghi Cache vẫn gây lệch trạng thái.',
    ],
    failureModeVi:
      'Ghi toàn bộ luồng log hoặc dữ liệu ít truy xuất lại qua Write-Through làm đẩy bật (evict) các key nóng thực sự ra khỏi bộ nhớ RAM hữu hạn (Cache Pollution).',
    configSnippet: `def write_through(key, record):
    db.upsert(key, record)            # 1. Lưu bền vững vào DB trước
    cache.set(key, record, ttl=1800)  # 2. Cập nhật đồng bộ vào Cache`,
  },
  {
    id: 'sd_write_behind',
    term: 'Write-Behind (Write-Back) Caching',
    aliases: ['Write-Behind', 'Write-Back', 'Async Cache Flush'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S4-02', 'S5-05'],
    relatedPatternIds: ['sd_read_write_through', 'sd_message_queue_backpressure'],
    shortVi:
      'Ứng dụng ghi cực nhanh vào bộ nhớ đệm và trả lời ngay; tiến trình nền sẽ gộp (coalesce) và xả theo lô xuống Database bất đồng bộ.',
    shortEn:
      'Writes acknowledge immediately from cache while background workers coalesce and batch-flush dirty entries to the database.',
    mechanismVi:
      'Thay vì gõ trực tiếp xuống đĩa Database cho từng sự kiện nhỏ (như cộng lượt xem video, điểm tim livestream, tọa độ tạm thời), ứng dụng cập nhật trên RAM và đánh dấu bản ghi bẩn (dirty). Định kỳ mỗi vài giây hoặc đủ ngưỡng số lượng, worker gom 1.000 lần tăng của cùng một key thành duy nhất một câu lệnh `UPDATE ... SET views = views + 1000` xuống Database.',
    whenToUseVi: [
      'Tải ghi tần suất cực cao tập trung trên cùng tập key (bộ đếm lượt xem/like, bảng xếp hạng game, trạng thái hoạt động gần nhất).',
      'Khi nghiệp vụ chấp nhận rủi ro mất vài giây dữ liệu đếm nếu cụm bộ nhớ đệm mất điện đồng thời trước lúc kịp xả.',
    ],
    tradeoffsVi: [
      'Giảm tải ghi Database hàng chục lần và hạ độ trễ phản hồi ghi về mức sub-millisecond.',
      'Rủi ro mất dữ liệu chưa kịp flush xuống DB và phức tạp hóa việc xử lý khi câu lệnh batch xuống DB bị lỗi ràng buộc.',
    ],
    failureModeVi:
      'Áp dụng Write-Behind cho giao dịch tài chính hoặc trừ tồn kho đơn hàng: khi node cache sập trước khi xả xuống DB, giao dịch đã báo thành công cho khách hàng bị mất dấu hoàn toàn.',
    configSnippet: `# Gộp 5,000 lượt tăng trên RAM thành 1 lần flush xuống DB mỗi 2 giây:
INCRBY counter:video:9821 1
SADD dirty:video_counters 9821
# Flush worker (mỗi 2s): SPOP dirty:video_counters 200 -> Batch SQL UPSERT`,
  },
  {
    id: 'sd_cache_stampede_singleflight',
    term: 'Cache Stampede & Request Coalescing (Singleflight)',
    aliases: ['Cache Stampede', 'Singleflight', 'Request Coalescing', 'Thundering Herd'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-02', 'S4-02', 'S5-02'],
    relatedPatternIds: ['sd_cache_aside', 'sd_ttl_jitter', 'sd_cdn_edge_caching'],
    shortVi:
      'Khi một key nóng vừa hết hạn, hàng nghìn request đồng thời cùng thấy miss và dồn xuống DB; Singleflight gộp tất cả các request cùng key thành duy nhất một lượt truy vấn DB.',
    shortEn:
      'Prevents concurrent misses on an expired hot key from overloading the DB by coalescing in-flight fetches into a single query.',
    mechanismVi:
      'Ở cấp tiến trình ứng dụng, cấu trúc `Singleflight` giữ bản đồ các key đang trong trạng thái nạp: luồng đầu tiên thực thi truy vấn DB, còn 999 luồng đến cùng lúc cho cùng key sẽ chờ trên cùng một Promise/Future và nhận chung kết quả khi luồng đầu hoàn tất. Ở cấp liên máy chủ, có thể kết hợp khóa phân tán ngắn (Lease Token) hoặc làm mới nền trước khi hết hạn thật (Logical/Soft TTL).',
    whenToUseVi: [
      'Bảo vệ Database cho trang chủ, bài viết nổi bật, cấu hình toàn cục hoặc sản phẩm đang khuyến mãi lớn.',
      'Kết hợp tại lớp Edge/Origin Shield (Collapsed Forwarding) cho tài nguyên media lớn.',
    ],
    tradeoffsVi: [
      'Nếu lượt truy vấn duy nhất đó bị chậm hoặc lỗi timeout, toàn bộ nhóm request đang chờ chung key cũng chịu chung độ trễ của lượt đó.',
      'Singleflight nội bộ tiến trình chỉ gộp trong phạm vi 1 pod (nếu có 50 pod sẽ còn tối đa 50 truy vấn tới DB thay vì 50.000 — thường đã rất an toàn).',
    ],
    failureModeVi:
      'Đặt khóa tái tạo cache liên máy chủ nhưng không gắn TTL tự hết hạn cho khóa, hoặc chờ khóa vô thời hạn khi tiến trình giữ khóa bị treo.',
    configSnippet: `// Go singleflight / Promise coalescing theo key trong mỗi App Pod:
const inflight = new Map<string, Promise<Data>>();
async function getCoalesced(key: string): Promise<Data> {
  if (!inflight.has(key)) {
    inflight.set(key, loadFromCacheOrDb(key).finally(() => inflight.delete(key)));
  }
  return inflight.get(key)!;
}`,
  },
  {
    id: 'sd_ttl_jitter',
    term: 'TTL Expiration, TTL Jitter & Eviction (LRU / LFU)',
    aliases: ['TTL Jitter', 'Cache Eviction', 'LRU Eviction', 'LFU Eviction', 'Cache Avalanche'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-02', 'S4-02'],
    relatedPatternIds: ['sd_cache_aside', 'sd_cache_stampede_singleflight'],
    shortVi:
      'Cộng thêm độ lệch ngẫu nhiên (Jitter) vào thời gian sống TTL để tránh hàng vạn key hết hạn cùng một giây, kết hợp chính sách trục xuất LRU/LFU khi bộ nhớ đầy.',
    shortEn:
      'Adds random jitter to cache TTLs to avoid synchronized mass expiration, paired with LRU/LFU eviction under memory pressure.',
    mechanismVi:
      'Khi hệ thống khởi động hoặc chạy cron nạp hàng loạt 100.000 sản phẩm với cùng `TTL = 3600s`, đúng 1 giờ sau toàn bộ tập key sẽ hết hạn đồng loạt (Cache Avalanche), đẩy toàn bộ lưu lượng đọc đập thẳng vào Database. Cộng thêm một khoảng ngẫu nhiên đều (ví dụ ±10% đến +20% của TTL gốc) giúp dàn trải thời điểm làm mới đều theo thời gian. Khi RAM chạm giới hạn `maxmemory`, bộ nhớ đệm dùng xấp xỉ LRU (ít dùng gần đây nhất) hoặc W-TinyLFU (tần suất truy cập thấp) để thu hồi chỗ.',
    whenToUseVi: [
      'Mọi lệnh ghi vào Cache hàng loạt từ batch job, pre-warming script hoặc danh sách trang danh mục.',
      'Chọn LFU (`allkeys-lfu`) thay cho LRU khi có các tác vụ quét tuần tự dễ làm trôi tập key nóng thật sự.',
    ],
    tradeoffsVi: [
      'TTL dài tăng Hit Ratio nhưng kéo dài thời gian người dùng có thể nhìn thấy dữ liệu cũ nếu sự kiện xóa cache bị sót.',
      'TTL quá ngắn làm giảm mạnh hiệu quả giảm tải cho Database.',
    ],
    failureModeVi:
      'Cấu hình Redis ở chế độ mặc định `noeviction` cho cụm thuần cache: ngay khi đầy RAM, mọi lệnh ghi cache mới đều ném lỗi OOM làm gián đoạn luồng đọc Cache-Aside nếu ứng dụng không bắt ngoại lệ.',
    configSnippet: `# Tránh đồng bộ thời điểm hết hạn (Cache Avalanche):
base_ttl = 3600
jitter   = random.randint(0, 600)   # Lệch ngẫu nhiên 0..10 phút
cache.set(key, payload, ex=base_ttl + jitter)
# Cấu hình chính sách thu hồi RAM: maxmemory-policy allkeys-lfu`,
  },
  {
    id: 'sd_cdn_edge_caching',
    term: 'CDN Edge Caching & Origin Shield',
    aliases: ['CDN', 'Edge Caching', 'Origin Shield', 'Cache-Control'],
    category: 'caching-cdn',
    glossaryKind: 'ecosystem',
    difficulty: 'Beginner',
    relatedModules: ['S4-03', 'S2-12', 'S7-05'],
    relatedPatternIds: ['sd_cache_invalidation', 'sd_blob_object_storage', 'sd_reverse_proxy'],
    shortVi:
      'Mạng lưới máy chủ biên (PoP) đặt gần người dùng cuối để phục vụ nội dung tĩnh/bán động ngay tại địa phương, dùng Origin Shield gom các lượt miss trước khi về máy chủ gốc.',
    shortEn:
      'Geographically distributed edge PoPs serving cached content near users, backed by an Origin Shield tier to protect origin servers.',
    mechanismVi:
      'Thay vì mọi người dùng ở cách nửa vòng trái đất đều phải chịu RTT 180–250 ms về một datacenter gốc (Origin), DNS/Anycast điều hướng họ tới trạm Edge PoP gần nhất (~10–25 ms). Edge lưu bản sao theo chỉ thị HTTP `Cache-Control` (`s-maxage`, `stale-while-revalidate`). Nếu có 200 trạm Edge cùng miss một video vừa đăng, tất cả đi qua một trạm trung gian duy nhất (Origin Shield) để Origin chỉ phải phục vụ 1 lần đọc.',
    whenToUseVi: [
      'Phân phối ảnh, video HLS/DASH, bundle JS/CSS, phông chữ và các API đọc công khai có thể trễ vài giây.',
      'Giảm băng thông đi ra (egress cost) và hấp thụ lưu lượng đột biến ở lớp rìa mạng.',
    ],
    tradeoffsVi: [
      'Lần truy cập đầu tiên tại mỗi vùng địa lý (cold PoP) vẫn phải đi xuyên về Shield/Origin.',
      'Phí băng thông CDN và phí gọi xóa cache hàng loạt (purge) cần được tính vào chi phí vận hành khi dữ liệu đổi liên tục.',
    ],
    failureModeVi:
      'Vô tình cache phản hồi chứa thông tin cá nhân trên Edge do thiếu `Cache-Control: private, no-store` hoặc quên khai báo header `Vary: Authorization, Accept-Encoding`.',
    configSnippet: `# Tài nguyên tĩnh có mã băm phiên bản trên tên file (app.8f3a1c.js):
Cache-Control: public, max-age=31536000, immutable
# API công khai bán động (cập nhật nền không chặn người đọc):
Cache-Control: public, max-age=10, s-maxage=60, stale-while-revalidate=120`,
  },
  {
    id: 'sd_cache_invalidation',
    term: 'Cache Invalidation & Versioned URLs',
    aliases: ['Cache Invalidation', 'Cache Busting', 'Delete-on-Write'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-02', 'S4-02', 'S4-03'],
    relatedPatternIds: ['sd_cache_aside', 'sd_cdn_edge_caching', 'sd_transactional_outbox'],
    shortVi:
      'Cơ chế loại bỏ hoặc thay thế bản sao cũ trên Cache/CDN ngay khi dữ liệu gốc thay đổi, kết hợp gắn mã phiên bản bất biến vào đường dẫn cho tài nguyên tĩnh.',
    shortEn:
      'Strategies for evicting or superseding stale cached entries via delete-on-write, CDC events, or immutable versioned keys/URLs.',
    mechanismVi:
      'Với tài nguyên tĩnh và ảnh đại diện, cách an toàn nhất là bất biến hóa tên đối tượng kèm mã băm nội dung hoặc số phiên bản (`avatar_v4.webp`), giúp cache vô thời hạn mà không cần gửi lệnh xóa. Với bản ghi động trong Redis, ứng dụng xóa key sau khi commit DB hoặc đọc luồng thay đổi Change Data Capture (CDC / binlog) để xóa key một cách đáng tin cậy ngay cả khi tiến trình ứng dụng khởi động lại giữa chừng.',
    whenToUseVi: [
      'Khi nghiệp vụ yêu cầu giá cả, tồn kho hoặc quyền truy cập mới phải phản ánh nhanh thay vì đợi hết hạn TTL dài.',
      'Triển khai giao diện web mới trên CDN toàn cầu mà không muốn người dùng tải trộn lẫn JS cũ và HTML mới.',
    ],
    tradeoffsVi: [
      'Xóa cache theo sự kiện CDC đảm bảo tính nhất quán cuối cùng rất tốt nhưng cần vận hành thêm pipeline đọc WAL/binlog.',
      'Xóa diện rộng theo tiền tố/tag (Surrogate-Key purge) tiện lợi nhưng tạo gai tải đọc tạm thời về Origin ngay sau lệnh xóa.',
    ],
    failureModeVi:
      'Xóa Cache TRƯỚC khi commit giao dịch Database: một request đọc xen vào đúng mili-giây đó thấy Cache Miss, đọc giá trị cũ từ DB rồi nạp ngược giá trị cũ vào lại Cache.',
    configSnippet: `# Trình tự chuẩn: Commit DB trước -> Invalidate Cache sau (+ CDC dự phòng)
1. COMMIT transaction trên Primary DB
2. UNLINK product:detail:42
# Với file tĩnh trên CDN: đổi URL mới /static/main.a91c4e.js thay vì ghi đè /static/main.js`,
  },
  {
    id: 'sd_negative_caching_bloom',
    term: 'Negative Caching & Bloom Filter',
    aliases: ['Negative Caching', 'Bloom Filter', 'Cache Penetration'],
    category: 'caching-cdn',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-02', 'S4-08', 'S5-02'],
    relatedPatternIds: ['sd_cache_aside', 'sd_btree_vs_lsm'],
    shortVi:
      'Chặn các truy vấn lặp lại vào ID không tồn tại xuyên thẳng qua Cache xuống DB bằng cách lưu tạm giá trị rỗng ngắn hạn hoặc lọc trước bằng cấu trúc xác suất Bloom Filter.',
    shortEn:
      'Prevents repeated lookups for non-existent keys from hitting the database using short-TTL null sentinels or a Bloom filter.',
    mechanismVi:
      'Khi bot hoặc lỗi phía client liên tục gọi hàng vạn ID không có thật (Cache Penetration), Cache-Aside thông thường luôn gặp Miss và đẩy 100% tải đọc xuống Database. Negative Caching lưu một giá trị đánh dấu `NOT_FOUND` với TTL ngắn (30–120 giây) cho cùng ID được hỏi lặp lại. Nếu kẻ tấn công rải ngẫu nhiên hàng tỷ ID khác nhau, một mảng bit Bloom Filter tốn chỉ vài chục MB RAM có thể khẳng định chắc chắn 100% một khóa "chắc chắn không tồn tại" bằng k hàm băm độc lập.',
    whenToUseVi: [
      'API tra cứu công khai theo mã đơn, slug URL rút gọn, tên người dùng hoặc bên trong LSM-Tree đọc SSTable.',
      'Hệ thống xuất hiện tỷ lệ Cache Miss cao bất thường do truy vấn khóa rác hoặc quét tuần tự.',
    ],
    tradeoffsVi: [
      'Bloom Filter chuẩn không có Dương tính giả = 0 (tỷ lệ False Positive ~0.1%–1% vẫn lọt xuống DB) và không hỗ trợ xóa phần tử nếu không dùng biến thể Counting/Cuckoo Filter.',
      'Negative Caching với TTL dài có thể làm trễ việc hiển thị bản ghi vừa mới được tạo trùng đúng khóa đó.',
    ],
    failureModeVi:
      'Lưu giá trị `NOT_FOUND` với TTL hàng giờ đồng hồ cho mọi ID ngẫu nhiên do bot sinh ra, làm tràn đầy RAM của cụm Cache bởi các khóa rác dùng một lần.',
    configSnippet: `# Bloom Filter: m ≈ -n * ln(p) / (ln 2)^2  (~9.6 bits/key cho p = 1% false positive)
if not bloom.might_contain(short_code):
    return HTTP_404  # Chắn ngay trên RAM, 0 query xuống DB!
# Nếu có thể tồn tại -> kiểm tra Cache (gồm cả sentinel "__NULL__" TTL 60s) -> DB`,
  },

  // ============================================================================
  // 4. DATA, REPLICATION & SHARDING (10 patterns)
  // ============================================================================
  {
    id: 'sd_leader_follower_replication',
    term: 'Leader-Follower (Primary-Replica) Replication',
    aliases: ['Leader-Follower', 'Primary-Replica', 'Read Replica', 'Async Replication'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-03', 'S2-08', 'S3-09'],
    relatedPatternIds: ['sd_replication_lag_ryw', 'sd_database_sharding', 'sd_raft_leader_election'],
    shortVi:
      'Mọi thao tác ghi đi vào nút chính (Leader/Primary), sau đó nhật ký thay đổi được sao chép sang các nút phụ (Followers/Replicas) để mở rộng tải đọc và dự phòng lỗi.',
    shortEn:
      'All writes go to a single primary node and stream via replication log to read replicas for read scaling and failover.',
    mechanismVi:
      'Leader ghi giao dịch vào Write-Ahead Log / binlog rồi gửi dòng sự kiện sang các Follower. Ở chế độ đồng bộ (Synchronous), Leader chờ ít nhất một Follower xác nhận đã ghi đĩa mới trả lời client (RPO = 0 nhưng độ trễ ghi phụ thuộc mạng). Ở chế độ bất đồng bộ (Asynchronous) phổ biến hơn, Leader trả lời ngay khi tự ghi xong, giúp giữ độ trễ ghi thấp nhưng các Follower có thể chậm hơn vài chục mili-giây tới vài giây.',
    whenToUseVi: [
      'Hệ thống có tỷ lệ đọc cao hơn nhiều lần so với ghi (ví dụ 90% SELECT, 10% INSERT/UPDATE) cần giảm tải cho DB chính.',
      'Cần nút dự phòng nóng ở Availability Zone khác để thực hiện failover khi máy chủ chính hỏng phần cứng.',
    ],
    tradeoffsVi: [
      'Read Replica chỉ mở rộng được năng lực ĐỌC; mọi Follower vẫn phải phát lại đủ 100% tập lệnh GHI nên không mở rộng được trần ghi.',
      'Sao chép đồng bộ giảm thông lượng ghi và dễ treo khi Follower chậm; sao chép bất đồng bộ có nguy cơ mất vài giao dịch vừa ghi nếu Leader hỏng đột ngột.',
    ],
    failureModeVi:
      'Chạy lệnh DDL khóa bảng nặng hoặc xóa cột không tương thích ngược trên Leader: thay đổi lan sang toàn bộ Read Replica gần như tức thì, không giúp tránh lỗi logic phần mềm.',
    configSnippet: `Write Path: App -> Primary DB (WAL commit) --(async/semi-sync stream)--> Replica [1..K]
Read Path:  App -> Read Pool (Replica 1..K)   |   Critical Reads -> Primary DB`,
  },
  {
    id: 'sd_replication_lag_ryw',
    term: 'Replication Lag & Read-Your-Writes Consistency',
    aliases: ['Replication Lag', 'Read-Your-Writes', 'Monotonic Reads', 'Stale Read'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-08', 'S3-02'],
    relatedPatternIds: ['sd_leader_follower_replication', 'sd_quorum_nwr'],
    shortVi:
      'Độ trễ sao chép khiến người dùng vừa cập nhật dữ liệu xong đọc ngay từ Replica lại thấy trạng thái cũ; khắc phục bằng định tuyến Read-Your-Writes theo phiên hoặc vị trí LSN.',
    shortEn:
      'Addresses stale replica reads immediately after a user write by routing recent writers to the leader or tracking WAL LSNs.',
    mechanismVi:
      'Khi tải ghi tăng cao hoặc mạng liên vùng nghẽn, khoảng trễ giữa thời điểm commit trên Leader và thời điểm Follower áp dụng xong (Replication Lag) có thể vọt từ 10 ms lên vài giây. Nếu người dùng vừa sửa hồ sơ rồi tải lại trang và bị đẩy sang một Follower trễ, họ tưởng dữ liệu cập nhật bị mất. Mẫu Read-Your-Writes gắn mốc thời gian ghi gần nhất hoặc số thứ tự log (`LSN` / `GTID`) vào phiên của người dùng: nếu vừa ghi trong 5 giây qua hoặc Replica chưa bắt kịp `LSN`, router chuyển lượt đọc đó về Leader.',
    whenToUseVi: [
      'Tách đường đọc sang Read Replica nhưng vẫn cần trải nghiệm nhất quán cho chính tác giả vừa thao tác (bình luận mới đăng, đổi địa chỉ giao hàng, cập nhật hồ sơ).',
      'Kết hợp Monotonic Reads (ghim người dùng vào cùng một Replica hoặc kiểm tra LSN không lùi) để tránh dữ liệu lúc hiện lúc mất khi F5.',
    ],
    tradeoffsVi: [
      'Định tuyến đọc về Leader trong cửa sổ vài giây sau khi ghi làm tăng nhẹ tải đọc trên Leader đối với nhóm người dùng đang thao tác tích cực.',
      'Theo dõi LSN/GTID chính xác đòi hỏi tầng middleware hoặc driver DB hỗ trợ truy xuất vị trí WAL của từng Replica.',
    ],
    failureModeVi:
      'Kiểm tra số dư hoặc trạng thái đã thanh toán trên Read Replica trước khi thực hiện bước nghiệp vụ kế tiếp, dẫn đến xử lý lặp hoặc từ chối nhầm giao dịch hợp lệ.',
    configSnippet: `# Định tuyến đọc dựa trên vị trí Log Sequence Number (LSN) hoặc cửa sổ thời gian:
if replica.applied_lsn >= session.last_write_lsn:
    return replica.read(query)
return leader.read(query)  # Đảm bảo Read-Your-Writes 100%`,
  },
  {
    id: 'sd_database_sharding',
    term: 'Database Sharding (Range vs Hash Partitioning)',
    aliases: ['Database Sharding', 'Sharding', 'Shard Key', 'Horizontal Partitioning', 'Cross-Shard Query'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-03', 'S2-09', 'S7-04'],
    relatedPatternIds: ['sd_hot_key_celebrity', 'sd_consistent_hashing', 'sd_leader_follower_replication'],
    shortVi:
      'Chia ngang một tập dữ liệu lớn thành nhiều phân mảnh độc lập (Shards) đặt trên các cụm máy chủ khác nhau theo khóa phân mảnh (Shard Key) để mở rộng cả năng lực ghi lẫn dung lượng.',
    shortEn:
      'Horizontally partitions data across independent database nodes by a shard key to scale write throughput and total storage.',
    mechanismVi:
      'Mỗi Shard lưu một tập con các dòng dữ liệu có cùng cấu trúc bảng nhưng rời nhau hoàn toàn. Phân mảnh theo khoảng (Range Sharding, ví dụ theo tháng hoặc dải mã vùng) hỗ trợ quét dải hiệu quả nhưng dễ dồn toàn bộ lượt ghi mới vào phân mảnh cuối cùng. Phân mảnh theo hàm băm (Hash Sharding, ví dụ `hash(tenant_id)`) phân tán đều tải ghi ra mọi Shard, đổi lại các truy vấn không mang theo `Shard Key` phải phát tán hỏi tất cả các Shard (Scatter-Gather).',
    whenToUseVi: [
      'Khi thông lượng GHI vượt trần của một máy chủ Primary lớn nhất, hoặc bảng dữ liệu chạm quy mô hàng tỷ dòng / nhiều TB làm backup và index quá chậm.',
      'Hệ thống đa khách hàng (Multi-tenant SaaS), tin nhắn chat (`conversation_id`), mạng xã hội (`user_id`).',
    ],
    tradeoffsVi: [
      'Mất khả năng `JOIN` trực tiếp và ràng buộc khóa ngoại xuyên Shard; giao dịch chạm nhiều Shard trở nên đắt đỏ và phức tạp.',
      'Chọn sai `Shard Key` ban đầu đòi hỏi quá trình di dời dữ liệu trực tuyến (resharding) rất tốn công vận hành.',
    ],
    failureModeVi:
      'Dùng phép chia dư cố định `hash(key) % N` mà không có lớp ánh xạ phân mảnh logic (logical shards / consistent hashing): khi tăng từ N = 4 lên N = 5 máy, gần 80% dữ liệu đổi chỗ cùng lúc.',
    configSnippet: `# Quy tắc chọn Shard Key: độ phân tán cao (high cardinality) + đi kèm trong 95% câu query
Logical_Bucket = crc32(user_id) % 1024          # 1024 logical shards cố định
Physical_Shard = shard_directory[Logical_Bucket] # Chỉ dời từng bucket khi thêm máy`,
  },
  {
    id: 'sd_hot_key_celebrity',
    term: 'Hot Key / Hot Partition (Celebrity Problem)',
    aliases: ['Hot Key', 'Hot Partition', 'Celebrity Problem', 'Key Salting'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-09', 'S5-03', 'S7-04'],
    relatedPatternIds: ['sd_database_sharding', 'sd_fanout_write_vs_read', 'sd_cache_stampede_singleflight'],
    shortVi:
      'Ngay cả khi băm đều khóa, một thực thể đặc biệt (tài khoản nổi tiếng, sản phẩm Flash Sale, ô bản đồ sân bay) vẫn hút phần lớn lưu lượng về duy nhất một Shard gây nghẽn cục bộ.',
    shortEn:
      'Skewed Zipfian traffic concentrates massive read/write load onto a single key or partition despite uniform hash sharding.',
    mechanismVi:
      'Lưu lượng thực tế tuân theo phân phối lệch (Zipf / Power-law): 0.1% khóa nóng có thể chiếm 60%–80% truy vấn. Hàm băm luôn ánh xạ cùng một `key` về đúng một phân mảnh vật lý, khiến phân mảnh đó đạt ρ = 1 trong khi các phân mảnh khác nhàn rỗi. Cách xử lý cho đường ĐỌC là đặt Local In-Process Cache (TTL 1–3 giây ngay trên RAM của App Pod) hoặc nhân bản key nóng ra K bản phụ. Với đường GHI (bộ đếm, hàng đợi sự kiện), áp dụng kỹ thuật thêm hậu tố ngẫu nhiên (`Key Salting / Write Sharding`: `key#0..key#15`) rồi cộng gộp khi đọc.',
    whenToUseVi: [
      'Thiết kế bảng đếm lượt bình chọn trực tiếp, giỏ hàng Flash Sale, news feed có tài khoản hàng chục triệu người theo dõi, hoặc chỉ mục vị trí giờ cao điểm.',
      'Khi biểu đồ CPU/IOPS giữa các node Redis/Cassandra/Kafka/Postgres lệch nhau gấp 5–10 lần.',
    ],
    tradeoffsVi: [
      'Key Salting chia nhỏ tải ghi ra K phân mảnh nhưng khiến mỗi lượt đọc phải đọc gộp K khóa con (Fan-in amplification).',
      'Local In-Memory Cache trên từng App Pod dập hoàn toàn tải đọc key nóng nhưng dữ liệu có thể lệch nhau vài giây giữa các pod.',
    ],
    failureModeVi:
      'Chỉ mở rộng thêm nhiều node mới vào cụm Sharded Database/Redis Cluster để xử lý một Hot Key đơn lẻ: key đó vẫn chỉ nằm trên đúng 1 node duy nhất nên nghẽn không hề giảm.',
    configSnippet: `# Write Sharding (Key Salting) chia tải ghi 1 Hot Key ra K = 16 phân mảnh:
sub_key = f"likes:{post_id}:{random.randint(0, 15)}"
db.increment(sub_key, 1)
# Khi đọc tổng: sum(db.mget([f"likes:{post_id}:{i}" for i in range(16)]))`,
  },
  {
    id: 'sd_consistent_hashing',
    term: 'Consistent Hashing & Virtual Nodes',
    aliases: ['Consistent Hashing', 'Hash Ring', 'Virtual Nodes', 'VNodes'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-10', 'S2-09'],
    relatedPatternIds: ['sd_database_sharding', 'sd_hot_key_celebrity'],
    shortVi:
      ' Sắp xếp cả máy chủ và khóa dữ liệu lên vòng tròn băm để khi thêm/bớt 1 trong N máy chủ chỉ cần di dời trung bình K/N lượng khóa, kết hợp Virtual Nodes để chia tải đồng đều.',
    shortEn:
      'Maps nodes and keys onto a hash ring so adding/removing a node relocates only ~1/N of keys, using virtual nodes for balance.',
    mechanismVi:
      'Không gian đầu ra của hàm băm (ví dụ `0 .. 2^32 - 1`) được nối đầu cuối thành một vòng tròn. Mỗi khóa tìm máy chủ sở hữu bằng cách đi thuận chiều kim đồng hồ tới điểm mốc đầu tiên gặp trên vòng (tra cứu `O(log M)` bằng mảng sắp xếp + tìm kiếm nhị phân). Để khắc phục việc ít máy chủ vật lý tạo các cung dài ngắn lệch nhau và hỗ trợ máy mạnh/yếu khác cấu hình, mỗi máy vật lý được gán hàng trăm điểm ảo (Virtual Nodes / VNodes) rải đều khắp vòng.',
    whenToUseVi: [
      'Phân phối dữ liệu trên cụm Cache phân tán, cơ sở dữ liệu phân tán (Cassandra, DynamoDB) hoặc định tuyến kết nối có trạng thái (chat gateway, rate-limit counter).',
      'Khi cụm thường xuyên co giãn số lượng node mà không muốn gây bão Cache Miss toàn diện.',
    ],
    tradeoffsVi: [
      'Số lượng VNodes cao (100–256 mỗi node) giúp độ lệch chuẩn tải giảm xuống dưới 5% nhưng tốn thêm chút bộ nhớ bảng định tuyến và bước đồng bộ metadata cụm.',
      'Không hỗ trợ truy vấn khoảng (range query) trên khóa gốc nếu không kết hợp khóa phân vùng ghép.',
    ],
    failureModeVi:
      'Triển khai vòng băm chỉ với 1 vị trí duy nhất cho mỗi node vật lý (không dùng Virtual Nodes): khi 1 node rời cụm, toàn bộ 100% tải của node đó đổ dồn sang duy nhất node kế cận thay vì san đều cho tất cả các node còn lại.',
    configSnippet: `# Tỷ lệ khóa phải di chuyển khi cụm đổi từ N = 8 lên N = 9 node:
Modulo hash (key % N):  ~88.9% khóa đổi máy -> Cache Miss Spike đồng loạt!
Consistent Hash Ring:   1 / 9 ≈ 11.1% khóa đổi máy (88.9% giữ nguyên chỗ)`,
  },
  {
    id: 'sd_btree_vs_lsm',
    term: 'B-Tree vs LSM-Tree & Write-Ahead Log (WAL)',
    aliases: ['B-Tree', 'LSM-Tree', 'Write-Ahead Log', 'WAL', 'SSTable', 'Compaction'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S4-08', 'S4-04'],
    relatedPatternIds: ['sd_negative_caching_bloom', 'sd_search_inverted_index'],
    shortVi:
      'B-Tree cập nhật trang đĩa cố định tại chỗ nên tối ưu đọc và truy vấn khoảng; LSM-Tree ghi tuần tự vào WAL + MemTable rồi nén nền SSTable nên đạt thông lượng ghi rất cao.',
    shortEn:
      'B-Trees update fixed-size pages in place for predictable reads; LSM-Trees convert random writes into sequential WAL + SSTable appends.',
    mechanismVi:
      'Mọi bộ máy lưu trữ bền vững đều ghi tuần tự vào Write-Ahead Log (WAL) trước để phục hồi sau sự cố mất điện. B-Tree (PostgreSQL, MySQL InnoDB) lưu dữ liệu theo các trang 4–16 KB trên cây cân bằng thấp tầng (`O(log_B N)`), đọc cực nhanh với đúng 1 bản cho mỗi khóa nhưng gây I/O ngẫu nhiên và phân mảnh trang khi ghi dày. LSM-Tree (RocksDB, Cassandra, ScyllaDB) ghi thẳng vào cấu trúc sắp xếp trên RAM (`MemTable`), khi đầy xả tuần tự thành tệp bất biến `SSTable` trên đĩa, và dùng tiến trình `Compaction` chạy nền để gộp các tầng tệp.',
    whenToUseVi: [
      'Chọn B-Tree cho hệ thống OLTP đa dụng, cần đọc điểm/khoảng ổn định p99 thấp và khóa giao dịch mức dòng.',
      'Chọn LSM-Tree cho tải ghi liên tục cường độ cao (tin nhắn chat, chuỗi thời gian IoT, nhật ký sự kiện, audit log).',
    ],
    tradeoffsVi: [
      'B-Tree có hệ số khuếch đại ghi (Write Amplification) trên I/O ngẫu nhiên cao hơn khi khóa phân bố ngẫu nhiên (như UUIDv4).',
      'LSM-Tree đọc một khóa có thể phải kiểm tra nhiều tầng SSTable (cần Bloom Filter hỗ trợ) và tiến trình Compaction nặng dễ gây gai độ trễ p99 nếu thiếu giới hạn băng thông I/O.',
    ],
    failureModeVi:
      'Chèn khóa chính `UUIDv4` hoàn toàn ngẫu nhiên vào bảng B-Tree hàng trăm triệu dòng: mỗi lượt chèn chạm một trang đĩa lạnh khác nhau ngoài Buffer Pool và gây tách trang (page split) liên tục.',
    configSnippet: `B-Tree Write:   WAL append (seq) + Page Modification in Buffer Pool -> Random Disk Flush
LSM-Tree Write: WAL append (seq) + MemTable insert (RAM) -> Immutable SSTable Flush (seq)
LSM-Tree Read:  MemTable -> Bloom Filter check -> L0..Lk SSTables -> Merge latest`,
  },
  {
    id: 'sd_blob_object_storage',
    term: 'Object / Blob Storage & Presigned URL',
    aliases: ['Object Storage', 'Blob Storage', 'Presigned URL', 'Multipart Upload'],
    category: 'data-sharding',
    glossaryKind: 'ecosystem',
    difficulty: 'Beginner',
    relatedModules: ['S2-12', 'S7-05'],
    relatedPatternIds: ['sd_cdn_edge_caching', 'sd_stateless_tier'],
    shortVi:
      'Tách tệp nhị phân lớn (ảnh, video, bản sao lưu, parquet) ra kho đối tượng chuyên dụng, cho phép client tải lên/tải xuống trực tiếp qua Presigned URL có hạn dùng ngắn.',
    shortEn:
      'Stores immutable binary objects separately from relational DBs, using short-lived presigned URLs for direct client uploads.',
    mechanismVi:
      'Database quan hệ chỉ lưu siêu dữ liệu gọn nhẹ (`object_key`, `mime_type`, `size`, `checksum`, `status`). Khi người dùng cần tải lên tệp 500 MB, API Server kiểm tra quyền, ký một `Presigned URL` có hiệu lực 10 phút kèm điều kiện giới hạn kích thước tối đa, rồi trả về cho trình duyệt/ứng dụng đẩy thẳng các mảnh dữ liệu (`Multipart Upload`) lên S3/GCS/R2 mà không chiếm giữ luồng hay băng thông của tầng App.',
    whenToUseVi: [
      'Lưu trữ hình ảnh, video gốc và các bản đã transcode, tài liệu đính kèm, snapshot dữ liệu và data lake.',
      'Áp dụng quy tắc vòng đời (Lifecycle Policy) tự động chuyển dữ liệu cũ ít đọc sang tầng lưu trữ lạnh chi phí thấp.',
    ],
    tradeoffsVi: [
      'Object Storage không hỗ trợ sửa đổi một vài byte giữa tệp (mọi thay đổi tạo phiên bản đối tượng mới hoàn toàn) và độ trễ truy cập đầu tiên cao hơn ổ khối NVMe (~15–50 ms).',
      'Cần sự kiện callback (S3 Event Notification / Webhook) hoặc bước xác nhận để đồng bộ trạng thái "đã tải xong" với bản ghi metadata trong DB.',
    ],
    failureModeVi:
      'Đẩy luồng upload tệp video hàng trăm MB đi xuyên qua API Server thay vì dùng Presigned URL + Multipart Upload, làm nghẽn băng thông và giữ chặt worker hàng chục giây mỗi tệp.',
    configSnippet: `1. Client -> API: POST /uploads/init { filename, size <= 100MB, sha256 }
2. API -> DB: INSERT media(status='PENDING') & trả về Presigned PUT URL (TTL 600s)
3. Client -> Object Storage: PUT binary trực tiếp (chia phần 8MB nếu file lớn)
4. Storage Event / Complete API -> Queue xử lý ảnh thu nhỏ & bật status='READY'`,
  },
  {
    id: 'sd_search_inverted_index',
    term: 'Search Inverted Index & Prefix Trie',
    aliases: ['Inverted Index', 'Full-Text Search', 'Prefix Trie', 'BM25'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-04', 'S7-07'],
    relatedPatternIds: ['sd_btree_vs_lsm', 'sd_geohash_quadtree'],
    shortVi:
      'Chỉ mục đảo ánh xạ từ mỗi từ vựng đã chuẩn hóa sang danh sách tài liệu chứa từ đó (Posting List) để tìm kiếm toàn văn, còn Prefix Trie tối ưu gợi ý từ khóa gõ dở (Autocomplete).',
    shortEn:
      'Inverted indexes map tokenized terms to sorted document posting lists for full-text search; prefix tries power low-latency typeahead.',
    mechanismVi:
      'Câu lệnh `LIKE "%keyword%"` trên B-Tree buộc phải quét tuần tự toàn bộ bảng. Chỉ mục đảo (Elasticsearch / OpenSearch / Lucene) tách văn bản thành token, đưa về chữ thường, loại bỏ dấu/từ dừng và ghi vào các phân đoạn bất biến (immutable segments): mỗi từ trỏ tới mảng sắp xếp ID tài liệu kèm tần suất để chấm điểm liên quan BM25 và lấy giao tập hợp cực nhanh. Với bài toán gợi ý tức thì dưới 50 ms khi gõ từng ký tự, cây tiền tố (Trie) lưu sẵn danh sách Top-K cụm từ phổ biến ngay tại mỗi nút tiền tố.',
    whenToUseVi: [
      'Tìm kiếm sản phẩm, bài viết, nhật ký hệ thống nhiều trường lọc kết hợp xếp hạng độ phù hợp (Full-text search).',
      'Xây dựng ô gợi ý tìm kiếm thời gian thực (Typeahead / Autocomplete) với hàng chục nghìn truy vấn mỗi giây.',
    ],
    tradeoffsVi: [
      'Chỉ mục đảo tốn dung lượng lưu trữ đáng kể và có độ trễ làm mới (`refresh_interval` ~1s) nên không dùng làm nguồn sự thật giao dịch chính.',
      'Cập nhật trực tiếp cây Trie trên từng lượt tìm kiếm gây tranh chấp khóa; thực tế luôn gom log và dựng lại bản chụp Trie định kỳ theo cửa sổ thời gian.',
    ],
    failureModeVi:
      'Ghi đồng bộ vào cả PostgreSQL và Elasticsearch trong cùng request HTTP mà không qua Outbox/Queue: khi một bên lỗi, kết quả tìm kiếm lệch vĩnh viễn so với dữ liệu gốc.',
    configSnippet: `# Inverted Index Posting List:
"distributed" -> [doc_12, doc_45, doc_108]
"transaction" -> [doc_45, doc_209]
Query("distributed AND transaction") -> Intersect sorted lists -> [doc_45]
# Prefix Trie Node ("sys"): cached topK = [("system design", 9400), ("systemd", 3100)]`,
  },
  {
    id: 'sd_snowflake_distributed_id',
    term: 'Distributed ID Generator (Snowflake & UUIDv7)',
    aliases: ['Snowflake ID', 'UUIDv7', 'Distributed ID', 'Time-Ordered ID'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S3-05', 'S5-02', 'S7-01'],
    relatedPatternIds: ['sd_database_sharding', 'sd_btree_vs_lsm', 'sd_lamport_vector_clocks'],
    shortVi:
      'Sinh khóa định danh duy nhất toàn cục không cần hỏi máy chủ trung tâm, vừa gọn nhẹ vừa sắp xếp tăng dần theo thời gian để tối ưu chèn chỉ mục B-Tree.',
    shortEn:
      'Generates globally unique, time-sortable identifiers locally without central coordination overhead.',
    mechanismVi:
      'Bộ đếm `AUTO_INCREMENT` đơn lẻ biến thành điểm nghẽn và làm lộ tổng số bản ghi, trong khi `UUIDv4` (128-bit ngẫu nhiên) gây phân mảnh nặng cho B-Tree. Cấu trúc Twitter Snowflake gói gọn trong số nguyên `64-bit` gồm: 1 bit dấu + 41 bit mili-giây tính từ mốc epoch (~69 năm) + 10 bit mã máy/datacenter (1.024 node) + 12 bit số thứ tự cục bộ (4.096 ID mỗi mili-giây trên mỗi node). Nếu cần sinh ngay trên client không quản lý mã máy, chuẩn `UUIDv7` đặt 48 bit timestamp ở đầu kết hợp phần ngẫu nhiên phía sau.',
    whenToUseVi: [
      'Khóa chính cho đơn hàng, tin nhắn chat (sắp xếp thứ tự hiển thị theo ID), sự kiện phân tán trên hệ thống nhiều Shard.',
      'Thay thế `UUIDv4` làm khóa chính trong PostgreSQL / MySQL InnoDB để giữ các lượt chèn mới luôn nằm sát cuối trang B-Tree.',
    ],
    tradeoffsVi: [
      'Snowflake chỉ tốn 8 byte (nhỏ bằng nửa UUID 16 byte) nhưng đòi hỏi cấp phát `worker_id` (0..1023) không trùng nhau giữa các pod.',
      'Vì chứa timestamp ở các bit cao, người ngoài có thể suy đoán gần đúng thời điểm tạo bản ghi nếu trả trực tiếp ID thô ra API công khai.',
    ],
    failureModeVi:
      'Đồng hồ hệ thống bị giật lùi vài chục mili-giây do đồng bộ NTP (Clock Rollback): nếu bộ phát Snowflake không kiểm tra và đợi đồng hồ bắt kịp mốc cũ, nó có thể sinh trùng ID trong cùng mili-giây đó.',
    configSnippet: `| 0 (1b) | Timestamp ms since custom epoch (41b) | Worker ID (10b) | Sequence (12b) |
id = ((now_ms - EPOCH) << 22) | (worker_id << 12) | seq
# Nếu now_ms < last_ms (NTP clock skew): tạm đợi hoặc dùng nhánh logical clock!`,
  },
  {
    id: 'sd_geohash_quadtree',
    term: 'Spatial Indexing (Geohash & Quadtree)',
    aliases: ['Geohash', 'Quadtree', 'Spatial Index', 'Proximity Search'],
    category: 'data-sharding',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S7-04', 'S4-04'],
    relatedPatternIds: ['sd_database_sharding', 'sd_hot_key_celebrity'],
    shortVi:
      'Biến tọa độ hai chiều (vĩ độ, kinh độ) thành chuỗi tiền tố một chiều (Geohash) hoặc cây chia tư thích ứng mật độ (Quadtree) để tìm nhanh các đối tượng trong bán kính lân cận.',
    shortEn:
      'Encodes 2D coordinates into 1D prefix strings (Geohash) or adaptive spatial trees (Quadtree) for fast radius queries.',
    mechanismVi:
      'Truy vấn hai điều kiện khoảng `WHERE lat BETWEEN ... AND lng BETWEEN ...` trên chỉ mục B-Tree thông thường chỉ tận dụng hiệu quả được chiều thứ nhất. Geohash xen kẽ các bit nhị phân của kinh độ và vĩ độ thành chuỗi ký tự Base32 (ví dụ độ dài 6 ký tự tương ứng ô ~1.2 km × 0.6 km), biến bài toán tìm lân cận thành tra cứu tiền tố trên 1 ô trung tâm cộng 8 ô kề cạnh. Quadtree chia đệ quy vùng đông đúc (như trung tâm thành phố) thành 4 ô con nhỏ hơn trong khi giữ nguyên ô lớn ở vùng thưa như biển hoặc rừng.',
    whenToUseVi: [
      'Tìm tài xế gần khách trong ứng dụng gọi xe, tìm cửa hàng/nhà hàng trong bán kính 3 km, bản đồ bất động sản.',
      'Phân mảnh bảng vị trí thời gian thực theo vùng địa lý để dữ liệu cùng thành phố nằm gần nhau.',
    ],
    tradeoffsVi: [
      'Geohash cực dễ lưu trên mọi KV store / Redis / SQL chuẩn nhưng kích thước ô cố định theo độ dài chuỗi, dễ tạo Hot Cell ở sân bay/sân vận động.',
      'Quadtree cân bằng số điểm mỗi lá rất đều nhưng lưu trên RAM cần cơ chế chụp ảnh bền vững và phức tạp hơn khi đối tượng di chuyển liên tục mỗi vài giây.',
    ],
    failureModeVi:
      'Chỉ truy vấn duy nhất tiền tố Geohash của người dùng mà quên truy vấn thêm 8 ô láng giềng xung quanh (Boundary Issue): tài xế đứng cách khách chỉ 20 mét nhưng nằm bên kia đường ranh giới ô sẽ không bao giờ được tìm thấy.',
    configSnippet: `# Tìm tài xế quanh tọa độ khách (luôn lấy 1 ô trung tâm + 8 ô kề biên):
center_cell = geohash.encode(lat, lng, precision=6)   # ~1.2km x 0.6km
cells_to_query = [center_cell, *geohash.neighbors(center_cell)]  # Tổng 9 ô
candidates = redis.sunion(*[f"drivers:{c}" for c in cells_to_query])`,
  },

  // ============================================================================
  // 5. MESSAGING & EVENT-DRIVEN (7 patterns)
  // ============================================================================
  {
    id: 'sd_message_queue_backpressure',
    term: 'Message Queue, Bounded Queue & Back-pressure',
    aliases: ['Message Queue', 'Back-pressure', 'Backpressure', 'Bounded Queue', 'Load Shedding'],
    category: 'messaging-async',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-04', 'S4-10', 'S1-02'],
    relatedPatternIds: ['sd_dead_letter_queue', 'sd_utilization_queueing', 'sd_token_bucket_rate_limit'],
    shortVi:
      'Tách rời tốc độ gửi của Producer và tốc độ xử lý của Consumer bằng hàng đợi có giới hạn kích thước, kết hợp tín hiệu giảm tốc ngược (Back-pressure) và loại bỏ tải ưu tiên thấp khi quá ngưỡng.',
    shortEn:
      'Decouples producers and consumers via bounded queues, propagating back-pressure or shedding low-priority load when full.',
    mechanismVi:
      'Hàng đợi hấp thụ các đợt tăng tải ngắn hạn (traffic spike) để API trả lời sớm cho người dùng, còn đội worker rút dần tác vụ nặng xử lý nền kèm xác nhận `ACK`. Tuy nhiên, nếu tốc độ đến trung bình vượt năng lực tiêu thụ trong thời gian dài, hàng đợi không giới hạn (Unbounded Queue) sẽ ngốn hết RAM và làm mọi thông điệp bị quá hạn trước khi tới lượt. Đặt ngưỡng trần (Bounded Queue) buộc Producer chậm lại (Back-pressure) hoặc chủ động từ chối sớm các yêu cầu ít quan trọng (Priority Load Shedding).',
    whenToUseVi: [
      'Hoãn các tác vụ tốn thời gian (gửi email/push, xuất PDF, xử lý ảnh/video, đối soát) ra khỏi luồng phản hồi chính của người dùng.',
      'Làm phẳng đỉnh tải đột biến trước một dịch vụ backend hoặc Database có công suất ghi cố định.',
    ],
    tradeoffsVi: [
      'Chuyển từ kết quả tức thì sang mô hình xử lý sau (client cần polling trạng thái, nhận webhook hoặc thông báo SSE/WebSocket).',
      'Cần giám sát chặt độ trễ tuổi của thông điệp cũ nhất trong hàng đợi (`queue_oldest_message_age_seconds`), không chỉ nhìn mỗi số lượng thông điệp.',
    ],
    failureModeVi:
      'Dùng hàng đợi nội bộ không giới hạn (`unbounded in-memory channel/queue`) kèm tự động xác nhận nhận tin ngay khi rút (`auto-ack` trước khi xử lý xong): vừa dễ tràn bộ nhớ `OOM`, vừa mất sạch job đang chạy khi worker khởi động lại.',
    configSnippet: `MAX_QUEUE_DEPTH = 10_000
if queue.depth() >= MAX_QUEUE_DEPTH:
    if req.priority == "LOW":
        return HTTP_429_RETRY_AFTER   # Load shedding có chọn lọc
# Consumer chỉ gửi ACK sau khi đã xử lý và lưu kết quả bền vững!`,
  },
  {
    id: 'sd_dead_letter_queue',
    term: 'Dead-Letter Queue (DLQ) & Poison Message',
    aliases: ['Dead-Letter Queue', 'DLQ', 'Poison Message', 'Max Receive Count'],
    category: 'messaging-async',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S2-04', 'S4-06', 'S7-03'],
    relatedPatternIds: ['sd_message_queue_backpressure', 'sd_backoff_jitter', 'sd_idempotency_key'],
    shortVi:
      'Hàng đợi cách ly riêng các thông điệp gây lỗi lặp đi lặp lại vượt ngưỡng thử lại tối đa, ngăn một bản tin hỏng làm kẹt toàn bộ luồng tiêu thụ chính.',
    shortEn:
      'Isolates unprocessable poison messages after max retry attempts so healthy queue traffic continues unobstructed.',
    mechanismVi:
      'Một số thông điệp không thể xử lý thành công dù thử lại bao nhiêu lần (ví dụ JSON sai định dạng, tham chiếu bản ghi đã xóa hoặc kích hoạt một lỗi chia cho 0 trong mã worker — gọi là Poison Message). Nếu hàng đợi cứ trả thông điệp đó về đầu luồng vô tận, toàn bộ nhóm worker sẽ bị kẹt cứng (Head-of-Line Blocking). Khi số lần nhận (`receive_count`) vượt ngưỡng cấu hình (thường 3–5 lần kèm backoff), broker tự động chuyển nguyên vẹn payload kèm nguyên nhân lỗi sang Dead-Letter Queue để cảnh báo kỹ sư kiểm tra và phát lại (redrive) sau khi đã sửa lỗi.',
    whenToUseVi: [
      'Bắt buộc cấu hình cho mọi hàng đợi bất đồng bộ trên Production (SQS, RabbitMQ, Kafka Consumer, Redis Streams).',
      'Phân tách rõ lỗi tạm thời do mạng/timeout (nên retry) với lỗi dữ liệu/nghiệp vụ cố định (chuyển thẳng sang DLQ không cần đợi hết 5 lần).',
    ],
    tradeoffsVi: [
      'Tách Poison Message ra DLQ giúp luồng chính thông suốt nhưng có thể làm đảo thứ tự xử lý đối với các sự kiện tiếp theo của cùng thực thể đó.',
      'DLQ nếu không có cảnh báo giám sát và quy trình xử lý định kỳ sẽ âm thầm tích tụ dữ liệu bị bỏ quên.',
    ],
    failureModeVi:
      'Bật DLQ nhưng đặt thời gian giữ tin (retention) quá ngắn hoặc không gắn cảnh báo khi `dlq_messages_visible > 0`, khiến đơn hàng lỗi bị tự động xóa mất sau vài ngày mà không ai hay biết.',
    configSnippet: `RedrivePolicy:
  deadLetterTargetArn: arn:aws:sqs:ap-southeast-1:123:orders-dlq
  maxReceiveCount: 4            # Thử tối đa 4 lần rồi chuyển sang DLQ
MessageRetentionPeriod: 1209600 # Giữ 14 ngày trên DLQ + Alert ngay khi depth > 0`,
  },
  {
    id: 'sd_pubsub_event_streaming',
    term: 'Pub/Sub & Append-Only Event Streaming Log',
    aliases: ['Pub/Sub', 'Event Streaming', 'Consumer Group', 'Partitioned Log'],
    category: 'messaging-async',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S2-11', 'S5-05', 'S1-02'],
    relatedPatternIds: ['sd_message_queue_backpressure', 'sd_transactional_outbox', 'sd_event_sourcing'],
    shortVi:
      'Một sự kiện phát vào Topic được phân phối độc lập cho nhiều dịch vụ đăng ký nhận; với nhật ký phân vùng bất biến (như Kafka), mỗi nhóm tiêu thụ tự quản lý con trỏ offset và có thể tua đọc lại.',
    shortEn:
      'Broadcasts events to multiple independent subscriber groups via partitioned append-only logs with replayable offsets.',
    mechanismVi:
      'Khác với hàng đợi điểm-tới-điểm (một job lấy ra xong là xóa), mô hình Pub/Sub dựa trên nhật ký ghi nối đuôi (Append-Only Partitioned Log) lưu bền vững sự kiện trên đĩa theo khoảng thời gian cấu hình (ví dụ 7–30 ngày). Thứ tự sự kiện được đảm bảo nghiêm ngặt bên trong từng Partition (nhờ định tuyến theo `partition_key` như `order_id`). Nhiều Consumer Group (Analytics, Notification, Fraud Detection, Search Sync) cùng đọc một luồng sự kiện ở tốc độ riêng mà không ảnh hưởng lẫn nhau.',
    whenToUseVi: [
      'Tách sự phụ thuộc giữa dịch vụ cốt lõi (Checkout) và nhiều dịch vụ hệ quả chạy độc lập.',
      'Xử lý luồng sự kiện thông lượng cao cần đảm bảo thứ tự theo khóa thực thể và khả năng tua lại (replay) khi dựng dịch vụ mới.',
    ],
    tradeoffsVi: [
      'Số lượng consumer chạy song song trong cùng một Consumer Group bị giới hạn tối đa bằng số Partition của Topic.',
      'Vận hành cụm Event Streaming (cân bằng lại partition, quản lý dung lượng đĩa, hot partition) phức tạp hơn hàng đợi đơn giản.',
    ],
    failureModeVi:
      'Không chỉ định `partition_key` (để mặc định round-robin ngẫu nhiên) cho các sự kiện vòng đời đơn hàng: sự kiện `OrderPaid` rơi vào partition khác và được xử lý xong trước cả sự kiện `OrderCreated`!',
    configSnippet: `# Ghi kèm khóa thực thể để bảo toàn thứ tự trong cùng Partition:
producer.send(topic="orders.events", key=order.id, value=event_json)
# Quy tắc song song: active_consumers_in_group <= topic_partition_count`,
  },
  {
    id: 'sd_fanout_write_vs_read',
    term: 'Fan-out on Write vs Fan-out on Read (Hybrid Feed)',
    aliases: ['Fan-out on Write', 'Fan-out on Read', 'Hybrid Fan-out', 'Push vs Pull Feed'],
    category: 'messaging-async',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S5-03', 'S7-03'],
    relatedPatternIds: ['sd_hot_key_celebrity', 'sd_message_queue_backpressure', 'sd_cache_aside'],
    shortVi:
      'Đánh đổi thời điểm tính toán bảng tin xã hội: đẩy sẵn ID bài mới vào hộp thư của từng người theo dõi lúc đăng (Write) hay truy vấn gộp lúc mở trang (Read), kết hợp Hybrid cho tài khoản đông người theo dõi.',
    shortEn:
      'Precomputes follower timelines on post creation (push) versus merging followed authors at read time (pull), combined as hybrid for celebrities.',
    mechanismVi:
      'Với Fan-out on Write (Push), khi người dùng A đăng bài, worker bất đồng bộ chèn `post_id` vào danh sách bảng tin trên RAM của tất cả K người theo dõi A, giúp thao tác mở trang bảng tin chỉ tốn 1 lần đọc siêu nhanh `O(1)`. Tuy nhiên nếu A có 30 triệu người theo dõi, một bài đăng sẽ tạo 30 triệu lượt ghi gây trễ hàng phút. Fan-out on Read (Pull) không làm gì lúc đăng, mà khi người dùng mở ứng dụng mới truy vấn các bài mới nhất từ danh sách đang theo dõi rồi trộn lại. Kiến trúc Hybrid thực tế dùng Push cho người dùng thông thường (< 50.000 followers) và dùng Pull trộn lúc đọc riêng cho nhóm tài khoản nổi tiếng.',
    whenToUseVi: [
      'Thiết kế bảng tin mạng xã hội (News Feed), hộp thông báo sự kiện nhóm lớn hoặc luồng hoạt động theo dõi.',
      'Chọn Push khi tỷ lệ đọc cao hơn ghi nhiều lần và số người nhận mỗi sự kiện vừa phải; chuyển sang Hybrid ngay khi phân phối người theo dõi có đuôi rất dài.',
    ],
    tradeoffsVi: [
      'Fan-out on Write tốn nhiều RAM và lượt ghi thừa cho những người dùng không hoạt động (cần chỉ đẩy vào cache của người dùng hoạt động trong 7–14 ngày gần nhất).',
      'Fan-out on Read tiết kiệm hoàn toàn công ghi và bộ nhớ đệm nhưng chịu tải đọc tổng hợp rất nặng vào giờ cao điểm.',
    ],
    failureModeVi:
      'Áp dụng thuần Fan-out on Write cho mọi tài khoản không phân biệt quy mô follower: vài tài khoản triệu người theo dõi đăng bài liên tiếp làm nghẽn toàn bộ hàng đợi fan-out của hệ thống.',
    configSnippet: `on_post_created(author_id, post_id):
  if follower_count(author_id) < 50_000:
    enqueue_fanout_push(author_id, post_id)  # Push cho active followers
on_read_timeline(user_id):
  pushed_ids = feed_cache.zrevrange(user_id, 0, 100)
  celeb_ids  = fetch_latest_from_followed_celebrities(user_id)
  return merge_sort_top_k(pushed_ids, celeb_ids, k=50)`,
  },
  {
    id: 'sd_cqrs',
    term: 'CQRS (Command Query Responsibility Segregation)',
    aliases: ['CQRS', 'Read Projection', 'Read Model'],
    category: 'messaging-async',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S6-05', 'S2-07'],
    relatedPatternIds: ['sd_event_sourcing', 'sd_pubsub_event_streaming', 'sd_replication_lag_ryw'],
    shortVi:
      'Tách biệt mô hình ghi kiểm tra ràng buộc nghiệp vụ (Command Model) với các mô hình đọc đã phi chuẩn hóa tối ưu riêng cho từng màn hình truy vấn (Query Projections).',
    shortEn:
      'Separates the normalized transactional write model from denormalized, query-optimized read projections.',
    mechanismVi:
      'Trong hệ thống phức tạp, lược đồ chuẩn hóa 3NF tối ưu cho tính toàn vẹn lúc ghi giao dịch thường rất chậm khi phải `JOIN` 8–10 bảng kèm lọc tìm kiếm lúc đọc. CQRS tách đường ghi (nhận Command -> kiểm tra bất biến -> ghi vào OLTP Database) và phát sự kiện thay đổi sang luồng bất đồng bộ để cập nhật một hoặc nhiều Read Model chuyên biệt (bảng phẳng tính sẵn tổng, Elasticsearch cho tìm kiếm, Redis cho bảng xếp hạng).',
    whenToUseVi: [
      'Khi tải đọc và tải ghi có đặc thù truy cập khác biệt hoàn toàn và cần mở rộng độc lập theo hai tỷ lệ khác nhau.',
      'Cần kết hợp dữ liệu từ nhiều microservice thành một khung nhìn đọc nhanh mà không gọi chuỗi RPC đồng bộ lúc người dùng mở trang.',
    ],
    tradeoffsVi: [
      'Mô hình đọc cập nhật qua sự kiện mang tính nhất quán cuối cùng (Eventual Consistency): giao diện cần xử lý độ trễ đồng bộ vài trăm mili-giây.',
      'Tăng chi phí lưu trữ bản sao dữ liệu và công sức duy trì pipeline dựng lại (rebuild) Read Projection khi đổi cấu trúc giao diện.',
    ],
    failureModeVi:
      'Áp dụng CQRS tách kho dữ liệu cho các tính năng CRUD đơn giản lưu lượng thấp: tăng gấp đôi độ phức tạp mã nguồn và phát sinh lỗi lệch dữ liệu đọc-ghi không đáng có.',
    configSnippet: `Command Path: POST /orders -> Validate -> Primary SQL (3NF) -> Outbox Event
Projection:   Event Stream -> Projector Worker -> Denormalized Read Store / Search Index
Query Path:   GET /orders/summary -> Đọc thẳng 1 document đã gom sẵn (0 JOIN)`,
  },
  {
    id: 'sd_event_sourcing',
    term: 'Event Sourcing & Immutable Ledger',
    aliases: ['Event Sourcing', 'Event Store', 'Immutable Ledger'],
    category: 'messaging-async',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S6-05', 'S7-06'],
    relatedPatternIds: ['sd_cqrs', 'sd_pubsub_event_streaming', 'sd_idempotency_key'],
    shortVi:
      'Lưu chuỗi sự kiện thay đổi bất biến làm nguồn sự thật duy nhất thay vì chỉ ghi đè trạng thái cuối cùng, cho phép kiểm toán đầy đủ và tái tạo trạng thái tại mọi thời điểm.',
    shortEn:
      'Persists an append-only sequence of domain events as the source of truth rather than overwriting current state in place.',
    mechanismVi:
      'Thay vì chạy `UPDATE accounts SET balance = 850` làm mất dấu lịch sử biến động, hệ thống ghi nối tiếp các sự kiện bất biến (`MoneyDeposited +1000`, `FeeCharged -5`, `MoneyTransferred -145`) kèm số thứ tự tăng nghiêm ngặt cho từng thực thể. Trạng thái hiện tại được tính bằng cách gấp (fold/replay) chuỗi sự kiện từ bản chụp định kỳ gần nhất (Snapshot) cộng các sự kiện phát sinh sau bản chụp đó.',
    whenToUseVi: [
      'Sổ cái kế toán kép (Double-Entry Ledger), ví thanh toán, lịch sử đặt lệnh chứng khoán, quản lý phiên bản tài liệu hoặc hệ thống đòi hỏi nhật ký kiểm toán tuyệt đối.',
      'Khi cần khả năng dựng lại các khung nhìn phân tích mới trong tương lai từ toàn bộ lịch sử sự kiện quá khứ.',
    ],
    tradeoffsVi: [
      'Truy vấn danh sách lọc theo thuộc tính hiện tại rất khó trên kho sự kiện thô nên gần như luôn phải đi kèm CQRS Read Projections.',
      'Tiến hóa lược đồ sự kiện (Event Schema Evolution / Upcasting) và xử lý yêu cầu xóa dữ liệu cá nhân (GDPR Crypto-shredding) đòi hỏi thiết kế kỹ ngay từ đầu.',
    ],
    failureModeVi:
      'Quên tạo cơ chế chụp ảnh trạng thái định kỳ (State Snapshot mỗi 100–500 sự kiện): một tài khoản hoạt động lâu năm phải nạp và cộng lại hàng trăm nghìn sự kiện mỗi lần kiểm tra số dư.',
    configSnippet: `# Khôi phục trạng thái thực thể O(k) nhờ Snapshot định kỳ:
snap  = snapshot_store.latest(account_id)                 # seq = 1400, balance = 5200
delta = event_store.read_since(account_id, after_seq=1400) # Chỉ đọc vài event mới
state = fold(apply_event, snap.state, delta)`,
  },
  {
    id: 'sd_realtime_sse_websocket',
    term: 'Polling, Long Polling, SSE & WebSocket',
    aliases: ['WebSocket', 'Server-Sent Events', 'SSE', 'Long Polling'],
    category: 'messaging-async',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S4-09', 'S7-01'],
    relatedPatternIds: ['sd_pubsub_event_streaming', 'sd_l4_l7_load_balancer', 'sd_backoff_jitter'],
    shortVi:
      'Bốn cơ chế cập nhật thời gian thực từ đơn giản đến hai chiều đầy đủ: Short Polling hỏi định kỳ, Long Polling giữ request chờ sự kiện, SSE đẩy luồng một chiều qua HTTP, và WebSocket giữ kênh song công lâu dài.',
    shortEn:
      'Real-time transport options trading statelessness (Polling) against server-push efficiency (SSE) and full-duplex messaging (WebSocket).',
    mechanismVi:
      'Short Polling dễ cài đặt nhưng phần lớn phản hồi rỗng gây lãng phí RPS khi số client lớn. Long Polling giữ kết nối mở tới khi có dữ liệu mới hoặc hết timeout rồi mở lại. Server-Sent Events (SSE) truyền dòng sự kiện văn bản một chiều từ Server xuống Client trên nền HTTP chuẩn (tự động kết nối lại, đi qua proxy/HTTP2 dễ dàng). WebSocket nâng cấp kết nối thành kênh TCP hai chiều độ trễ thấp, đòi hỏi tầng Gateway có trạng thái kết hợp Pub/Sub nội bộ để định tuyến tin nhắn tới đúng máy chủ đang giữ socket của người nhận.',
    whenToUseVi: [
      'Chọn SSE cho luồng đẩy một chiều từ máy chủ: streaming token AI, thông báo trạng thái đơn hàng, bảng giá trực tiếp, tiến độ build.',
      'Chọn WebSocket cho tương tác hai chiều liên tục độ trễ thấp: nhắn tin chat, cộng tác chỉnh sửa tài liệu, trò chơi trực tuyến.',
    ],
    tradeoffsVi: [
      'Kết nối giữ mở lâu dài (SSE / WebSocket) tiêu tốn bộ nhớ giữ file descriptor, cần tinh chỉnh giới hạn cổng tạm thời và dùng Connection Draining cẩn thận khi deploy.',
      'Khi mở rộng ngang nhiều WebSocket Gateway, bắt buộc có bảng ánh xạ phiên hoặc kênh Pub/Sub liên máy chủ.',
    ],
    failureModeVi:
      'Khi một cụm WebSocket Gateway khởi động lại làm rớt 200.000 kết nối cùng lúc, toàn bộ client gọi reconnect ngay lập tức không có Backoff + Jitter gây nghẽn tầng xác thực và bắt tay TLS (Reconnect Storm).',
    configSnippet: `Short Polling:  Client hỏi mỗi 2s (1M users -> 500k RPS, >90% rỗng)
SSE (1-way):    HTTP Content-Type: text/event-stream (Server -> Client, auto Last-Event-ID)
WebSocket:      HTTP 101 Upgrade -> Full-Duplex TCP + Redis/Kafka PubSub định tuyến liên node`,
  },

  // ============================================================================
  // 6. CONSENSUS & DISTRIBUTED TRANSACTIONS (11 patterns)
  // ============================================================================
  {
    id: 'sd_cap_pacelc',
    term: 'CAP Theorem & PACELC',
    aliases: ['CAP Theorem', 'PACELC', 'Network Partition', 'CP vs AP'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S3-01', 'S1-04', 'S6-03'],
    relatedPatternIds: ['sd_quorum_nwr', 'sd_raft_leader_election', 'sd_crdt'],
    shortVi:
      'Khi xảy ra đứt kết nối mạng giữa các nút (Partition), hệ phân tán buộc phải chọn giữa tính nhất quán tuyến tính (CP) hoặc tính sẵn sàng phản hồi ở cả hai phía (AP); PACELC bổ sung đánh đổi giữa Độ trễ (L) và Nhất quán (C) ngay cả lúc mạng bình thường.',
    shortEn:
      'Under network partitions, distributed stores choose Consistency (CP) or Availability (AP); PACELC adds the normal-case Latency vs Consistency trade-off.',
    mechanismVi:
      'Trong mạng vật lý thực tế, phân tách mạng (P) không thể loại bỏ hoàn toàn, nên không tồn tại hệ thống "CA phân tán". Khi đường truyền liên vùng bị cắt, thiết kế CP từ chối ghi (hoặc cả đọc) ở nhánh thiểu số để tránh lệch dữ liệu; thiết kế AP cho phép cả hai nhánh tiếp tục ghi độc lập rồi hợp nhất sau khi mạng thông trở lại. Mô hình PACELC hoàn thiện bức tranh vận hành hàng ngày: ngay cả khi KHÔNG có đứt mạng (`Else`), việc chờ sao chép đồng bộ sang nhiều nút để giữ `Consistency` luôn phải trả giá bằng `Latency` cao hơn.',
    whenToUseVi: [
      'Chọn CP (hoặc PC/EC) cho số dư tài khoản, khóa kho hàng cuối cùng, bầu chọn leader và quản lý cấu hình cụm.',
      'Chọn AP (hoặc PA/EL) cho giỏ hàng thương mại điện tử, lượt xem, trạng thái hiển thị hồ sơ hoặc DNS/CDN.',
    ],
    tradeoffsVi: [
      'Hệ thống CP trả lỗi tạm thời cho nhánh bị cô lập mạng nhưng không bao giờ bán trùng một chỗ ngồi cho hai khách.',
      'Hệ thống AP luôn nhận thao tác người dùng nhưng đòi hỏi logic giải quyết xung đột (CRDT, Vector Clock hoặc quy tắc nghiệp vụ) khi nối mạng lại.',
    ],
    failureModeVi:
      'Áp dụng cứng một nhãn CP hay AP cho toàn bộ công ty thay vì phân loại theo từng thao tác nghiệp cụ thể (ví dụ đặt đơn có thể tiếp nhận bất đồng bộ AP, còn bước trừ tiền thực hiện kiểm tra chặt CP).',
    configSnippet: `If Partition (P):  Choose Consistency (CP: etcd, Raft, Spanner) vs Availability (AP: Dynamo-style)
Else (Normal E):   Choose Latency (EL: async replica read)      vs Consistency (EC: quorum/leader)`,
  },
  {
    id: 'sd_quorum_nwr',
    term: 'Quorum Consensus (W + R > N) & Sloppy Quorum',
    aliases: ['Quorum', 'Strict Quorum', 'Sloppy Quorum', 'Read Repair'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S3-02', 'S3-03'],
    relatedPatternIds: ['sd_cap_pacelc', 'sd_replication_lag_ryw', 'sd_lamport_vector_clocks'],
    shortVi:
      'Với N bản sao, yêu cầu ghi xác nhận từ W nút và đọc hỏi R nút sao cho W + R > N để tập đọc và tập ghi luôn giao nhau ít nhất một nút chứa giá trị mới nhất.',
    shortEn:
      'Ensures overlap between write and read replica sets when W + R > N across N replicas, tunable per workload.',
    mechanismVi:
      'Trong các hệ lưu trữ không có leader cố định (leaderless như Cassandra, Dynamo, Riak), client hoặc coordinator gửi yêu cầu tới cả N bản sao của khóa. Nếu cấu hình `N = 3, W = 2, R = 2` (`W + R = 4 > 3`), bất kỳ lần đọc 2 nút nào cũng chứa ít nhất 1 nút vừa nhận bản ghi mới nhất (kèm dấu phiên bản để phân biệt bản mới hơn) và chịu được 1 nút ngừng hoạt động. Nút có dữ liệu cũ được phát hiện trong lúc đọc sẽ được cập nhật lại qua cơ chế Read Repair hoặc đồng bộ nền Anti-Entropy (Merkle Tree).',
    whenToUseVi: [
      'Điều chỉnh linh hoạt theo đặc thù tải: đọc rất nhiều đặt `W = 3, R = 1`; cân bằng chịu lỗi đặt `N = 3, W = 2, R = 2`; ưu tiên tốc độ tối đa chấp nhận dữ liệu trễ đặt `W = 1, R = 1`.',
      'Dùng Sloppy Quorum + Hinted Handoff khi muốn vẫn tiếp nhận lượt ghi tạm trên nút khỏe khác lúc nhiều nút chính bị cô lập mạng.',
    ],
    tradeoffsVi: [
      'Độ trễ mỗi thao tác đọc/ghi Quorum bị quyết định bởi nút phản hồi thứ W hoặc thứ R (tăng nhạy cảm với mạng chậm liên vùng).',
      'Sloppy Quorum tăng độ sẵn sàng ghi nhưng trong thời gian chưa bàn giao lại (`Hinted Handoff`), đọc R nút vẫn có thể chưa thấy ngay bản ghi mới.',
    ],
    failureModeVi:
      'Nhầm rằng chỉ cần `W + R > N` là tự động đạt Linearizability tuyệt đối: nếu không có giao thức đồng thuận (CAS/Paxos) hoặc khi hai lượt ghi đồng thời xung đột dựa trên đồng hồ lệch (`LWW`), vẫn xảy ra đọc không đơn điệu hoặc mất cập nhật.',
    configSnippet: `N = 3 replicas:
• Balanced Quorum:  W = 2, R = 2  (W + R = 4 > 3, chịu lỗi 1 node cho cả đọc & ghi)
• Fast Read:        W = 3, R = 1  (đọc 1 node thấy bản mới, nhưng 1 node chết là kẹt ghi)
• Eventual / Fast:  W = 1, R = 1  (W + R = 2 <= 3, độ trễ thấp nhất nhưng có thể đọc cũ)`,
  },
  {
    id: 'sd_raft_leader_election',
    term: 'Raft Consensus & Leader Election',
    aliases: ['Raft', 'Leader Election', 'Election Term', 'Majority Quorum'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-03'],
    relatedPatternIds: ['sd_fencing_token', 'sd_cap_pacelc', 'sd_quorum_nwr'],
    shortVi:
      'Giao thức đồng thuận dựa trên đa số quá bán (⌊N/2⌋ + 1) sử dụng nhiệm kỳ tăng dần (Term) để bầu chọn duy nhất một Leader hợp lệ và sao chép nhật ký lệnh nhất quán.',
    shortEn:
      'Majority-quorum consensus protocol using monotonic election terms and replicated logs to maintain strong consistency.',
    mechanismVi:
      'Mỗi nút trong cụm Raft (etcd, Consul, CockroachDB, TiKV) ở một trong ba trạng thái: Leader, Follower hoặc Candidate, và thời gian logic được chia thành các nhiệm kỳ đánh số tăng dần (`Term`). Leader gửi nhịp tim định kỳ; nếu Follower quá thời gian chờ ngẫu nhiên (`Election Timeout` 150–300 ms) không nhận được tín hiệu, nó tăng `Term`, chuyển thành Candidate và xin phiếu bầu. Chỉ ứng viên có nhật ký cập nhật không kém đa số và giành đủ `⌊N/2⌋ + 1` phiếu mới lên làm Leader. Một mục log chỉ được đánh dấu `Committed` khi đã ghi bền vững trên quá bán số nút.',
    whenToUseVi: [
      'Quản lý cấu hình cụm, danh mục phân mảnh (Shard Directory), cấp phát khóa/lease phân tán và cơ sở dữ liệu NewSQL nhất quán mạnh.',
      'Triển khai cụm số nút lẻ (3 hoặc 5 nút): cụm 3 nút chịu lỗi 1 nút; cụm 5 nút chịu lỗi 2 nút.',
    ],
    tradeoffsVi: [
      'Mọi thao tác ghi bắt buộc đi qua Leader và tốn ít nhất 1 vòng RTT xác nhận của đa số trước khi commit.',
      'Thêm nút chẵn (ví dụ từ 3 lên 4 nút) KHÔNG làm tăng số nút hỏng chịu được (vẫn chỉ chịu được 1 nút chết vì cần 3/4 phiếu) mà còn làm tăng xác suất chậm quorum.',
    ],
    failureModeVi:
      'Đặt cùng một hằng số `election_timeout` y hệt nhau trên mọi nút không có độ lệch ngẫu nhiên, khiến các Candidate chia phiếu ngang nhau lặp đi lặp lại (Split Vote) làm cụm không bầu được Leader.',
    configSnippet: `Cluster Size N = 3 -> Majority Quorum = 2 -> Chịu tối đa 1 node lỗi
Cluster Size N = 5 -> Majority Quorum = 3 -> Chịu tối đa 2 node lỗi
# Randomized Election Timeout: 150ms + uniform_random(0, 150ms) để tránh Split Vote`,
  },
  {
    id: 'sd_fencing_token',
    term: 'Distributed Lease & Fencing Token',
    aliases: ['Fencing Token', 'Distributed Lock', 'GC Pause', 'Epoch Number'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-03', 'S3-07'],
    relatedPatternIds: ['sd_raft_leader_election', 'sd_optimistic_pessimistic_locking'],
    shortVi:
      'Số hiệu đơn điệu tăng dần cấp kèm mỗi lần giữ khóa (Lease), được kho lưu trữ đích kiểm tra để từ chối mọi lệnh ghi đến trễ từ tiến trình giữ khóa cũ bị treo tạm thời.',
    shortEn:
      'Monotonically increasing lease token checked by the storage resource to reject delayed writes from zombie lock holders.',
    mechanismVi:
      'Khóa phân tán luôn phải có thời gian thuê hữu hạn (Lease TTL) để tránh khóa chết khi worker giữ khóa bị sập. Tuy nhiên, nếu Worker 1 đang giữ khóa bị tạm dừng bởi Garbage Collection (Stop-the-World GC pause) hoặc nghẽn mạng dài hơn TTL, dịch vụ khóa sẽ thu hồi và cấp khóa mới cho Worker 2. Khi Worker 1 tỉnh lại, nó vẫn tưởng mình còn quyền và gửi lệnh ghi đè làm hỏng dữ liệu của Worker 2. Giải pháp chuẩn là dịch vụ khóa cấp kèm `fencing_token` tăng dần (`33`, rồi `34`): kho lưu trữ lưu lại token cao nhất từng thấy (`34`) và từ chối thẳng mọi thao tác mang token cũ (`33 < 34`).',
    whenToUseVi: [
      'Bảo vệ tính đúng đắn dữ liệu khi dùng Distributed Lock / Leader Election để ghi vào Database hoặc Object Storage dùng chung.',
      'Ngăn hiện tượng hai Leader cùng ghi (Split-Brain Write) trong lúc chuyển giao quyền điều khiển cụm.',
    ],
    tradeoffsVi: [
      'Đòi hỏi tài nguyên đích (Database / Storage Server) tham gia kiểm tra và lưu giá trị `max_seen_token` trong cùng thao tác nguyên tử.',
      'Nếu dùng khóa chỉ để tránh tính toán trùng lặp hiệu năng (efficiency lock) không ảnh hưởng tính đúng đắn thì không bắt buộc cần Fencing Token.',
    ],
    failureModeVi:
      'Chỉ kiểm tra trạng thái khóa ở phía client (`if lock.is_held(): storage.write()`) mà không truyền `fencing_token` xuống tầng lưu trữ: khoảng trễ mạng hoặc GC ngay sau câu lệnh `if` vẫn để lọt ghi đè sai.',
    configSnippet: `-- Kho lưu trữ kiểm tra nguyên tử Fencing Token tăng nghiêm ngặt:
UPDATE ledger_shards
SET data = :payload, last_token = :incoming_token
WHERE shard_id = :id AND :incoming_token >= last_token;
-- Nếu affected_rows == 0 -> Từ chối lệnh ghi từ tiến trình giữ lease cũ!`,
  },
  {
    id: 'sd_lamport_vector_clocks',
    term: 'Clock Drift, Lamport Timestamp & Vector Clocks',
    aliases: ['Lamport Clock', 'Lamport Timestamp', 'Vector Clock', 'Hybrid Logical Clock', 'Clock Drift'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-06', 'S3-05'],
    relatedPatternIds: ['sd_crdt', 'sd_quorum_nwr', 'sd_snowflake_distributed_id'],
    shortVi:
      'Đồng hồ vật lý giữa các máy luôn lệch nhau (Clock Skew); đồng hồ logic Lamport xác lập thứ tự nhân quả một phần, còn Vector Clock phát hiện chính xác hai sự kiện xảy ra đồng thời có xung đột.',
    shortEn:
      'Tracks causal ordering without relying on skewed physical clocks; vector clocks distinguish causality from concurrent conflicts.',
    mechanismVi:
      'Đồng hồ thời gian thực đồng bộ qua NTP vẫn có thể lệch từ vài mili-giây tới hàng chục mili-giây giữa các máy chủ, khiến quy tắc Last-Write-Wins (`LWW`) dựa trên `wall-clock` âm thầm xóa mất bản ghi mới hơn từ máy có đồng hồ chạy chậm. Đồng hồ Lamport duy trì bộ đếm nguyên `L`: mỗi khi gửi tin kèm `L`, nút nhận cập nhật `L_recv = max(L_local, L_msg) + 1`, đảm bảo nếu `A -> B` (A gây ra B) thì `L(A) < L(B)`. Vector Clock mở rộng thành mảng bộ đếm `[v1..vn]` cho từng nút, cho phép kết luận chính xác bản nào là hậu duệ của bản nào và trường hợp nào hai vector không so sánh được (ghi đồng thời cần hợp nhất).',
    whenToUseVi: [
      'Phát hiện phiên bản xung đột (sibling versions) trong cơ sở dữ liệu phân tán đa điểm ghi hoặc đồng bộ tài liệu ngoại tuyến.',
      'Dùng Hybrid Logical Clock (HLC — như CockroachDB, MongoDB, YugabyteDB) khi cần vừa bám sát thời gian thực vừa bảo toàn tính nhân quả đơn điệu.',
    ],
    tradeoffsVi: [
      'Lamport Timestamp rất gọn (1 số nguyên) nhưng từ `L(A) < L(B)` KHÔNG suy ra được A xảy ra trước B (có thể đồng thời).',
      'Vector Clock phát hiện đầy đủ xung đột nhưng kích thước metadata tăng theo số nút/replica tham gia ghi (cần cơ chế cắt tỉa Version Vector).',
    ],
    failureModeVi:
      'Dùng `System.currentTimeMillis()` của từng máy ứng dụng để gán nhãn giải quyết xung đột `Last-Write-Wins`: một máy lệch NTP nhanh hơn 500 ms sẽ ghi đè thắng mọi cập nhật hợp lệ tiếp theo trong nửa giây đó.',
    configSnippet: `# Quy tắc so sánh hai Vector Clock V(a) và V(b):
• V(a) < V(b)  nếu mọi i: V(a)[i] <= V(b)[i] và tồn tại j: V(a)[j] < V(b)[j]  (a là bản cũ, lấy b)
• Ngược lại nếu không vế nào <= vế kia -> CONCURRENT CONFLICT (cần merge / CRDT)`,
  },
  {
    id: 'sd_two_phase_commit',
    term: 'Two-Phase Commit (2PC)',
    aliases: ['Two-Phase Commit', '2PC', 'Atomic Commit'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-04', 'S3-07'],
    relatedPatternIds: ['sd_saga_compensation', 'sd_optimistic_pessimistic_locking', 'sd_transactional_outbox'],
    shortVi:
      'Giao thức phối hợp nguyên tử hai bước (Prepare rồi Commit/Abort) qua một Coordinator để đảm bảo tất cả các phân mảnh tham gia cùng hoàn tất hoặc cùng hủy bỏ.',
    shortEn:
      'Blocking atomic commitment protocol coordinating a Prepare voting phase followed by a global Commit or Abort phase.',
    mechanismVi:
      'Ở Pha 1 (`Prepare`), Coordinator hỏi từng nút tham gia xem có sẵn sàng commit không; mỗi nút kiểm tra ràng buộc, ghi bền vững trạng thái chuẩn bị vào WAL và giữ chặt khóa dòng liên quan trước khi trả lời `YES`. Nếu 100% nút trả lời `YES`, Coordinator ghi quyết định vào log của mình và sang Pha 2 phát lệnh `COMMIT` cho tất cả; chỉ cần 1 nút trả lời `NO` hoặc quá hạn chờ, Coordinator phát lệnh `ABORT` toàn cục.',
    whenToUseVi: [
      'Giao dịch xuyên phân mảnh bên trong cùng một cụm cơ sở dữ liệu phân tán mạng nội bộ độ trễ thấp (như Spanner kết hợp Paxos trên Coordinator).',
      'Khi nghiệp vụ đòi hỏi tính nguyên tử tức thì không chấp nhận trạng thái trung gian hiển thị ra ngoài.',
    ],
    tradeoffsVi: [
      'Là giao thức chặn (Blocking Protocol): các khóa dữ liệu bị giữ xuyên suốt nhiều vòng gọi mạng làm giảm mạnh thông lượng và tăng nguy cơ cạn connection pool.',
      'Không phù hợp để nối các microservice độc lập thuộc nhiều đội khác nhau hoặc gọi qua API đối tác bên ngoài không hỗ trợ XA.',
    ],
    failureModeVi:
      'Coordinator bị sập đúng ngay sau khi các nút đã trả lời `YES` ở Pha 1 nhưng trước khi nhận được quyết định Pha 2: các nút tham gia rơi vào trạng thái lưỡng lự (`in-doubt`), không dám tự commit hay tự rollback và giữ khóa treo trên các bản ghi nóng.',
    configSnippet: `Phase 1 (Prepare): Coordinator -> [DB_Order, DB_Wallet]: PREPARE tx_91
                   DBs write undo/redo WAL & HOLD ROW LOCKS -> Vote YES
Phase 2 (Commit):  Coordinator logs COMMIT -> sends COMMIT tx_91 -> DBs release locks`,
  },
  {
    id: 'sd_saga_compensation',
    term: 'Saga Pattern & Compensating Transactions',
    aliases: ['Saga Pattern', 'Saga', 'Compensating Transaction', 'Saga Orchestrator'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-04', 'S7-06'],
    relatedPatternIds: ['sd_two_phase_commit', 'sd_idempotency_key', 'sd_transactional_outbox'],
    shortVi:
      'Chia giao dịch xuyên nhiều dịch vụ thành chuỗi các giao dịch cục bộ độc lập; nếu một bước thất bại, thực thi ngược chuỗi giao dịch bù trừ ngữ nghĩa để hoàn tác.',
    shortEn:
      'Models multi-service workflows as sequential local commits paired with semantic compensating actions on failure.',
    mechanismVi:
      'Thay vì giữ khóa xuyên mạng như 2PC, mỗi bước trong Saga (`T1: Tạo đơn PENDING -> T2: Giữ chỗ kho -> T3: Thu tiền`) tự commit ngay trong Database riêng của dịch vụ đó. Nếu `T3` bị từ chối thẻ, Saga kích hoạt tuần tự các bước bù trừ ngược (`C2: Nhả chỗ kho đã giữ -> C1: Chuyển đơn sang CANCELLED`). Có hai cách điều phối: Choreography (các dịch vụ tự lắng nghe sự kiện của nhau — gọn cho 2–3 bước) và Orchestration (một bộ máy trạng thái trung tâm điều khiển rõ ràng từng bước, timeout và thử lại — chuẩn cho quy trình từ 4 bước trở lên).',
    whenToUseVi: [
      'Quy trình đặt vé máy bay + khách sạn, thanh toán thương mại điện tử, giải ngân hoặc xử lý đơn hàng đi qua nhiều microservice/đối tác.',
      'Khi thời gian hoàn tất quy trình kéo dài từ vài trăm mili-giây đến nhiều phút không thể giữ khóa DB.',
    ],
    tradeoffsVi: [
      'Không có tính cô lập (lack of ACD Isolation): trạng thái trung gian hiển thị ngay ra ngoài nên phải thiết kế trạng thái ngữ nghĩa rõ ràng (`PENDING`, `RESERVED`) để tránh bất thường đọc bẩn.',
      'Mọi bước tiến (`Ti`) và mọi bước bù trừ (`Ci`) bắt buộc phải đạt tính lũy đẳng (Idempotent) vì thông điệp bù trừ có thể được gửi lại nhiều lần khi mạng lỗi.',
    ],
    failureModeVi:
      'Đặt một bước không thể hoàn tác (ví dụ gửi email xác nhận thành công hoặc chuyển tiền tức thì không thu hồi được) nằm TRƯỚC bước có tỷ lệ thất bại cao (như kiểm tra gian lận hoặc trừ tồn kho) thay vì xếp các bước có thể hoàn tác lên trước Bước chốt (Pivot Transaction).',
    configSnippet: `Forward:     [T1: CreateOrder(PENDING)] -> [T2: ReserveStock] -> [T3: ChargeCard (Pivot)] -> [T4: ConfirmOrder]
On T3 Fail:  [C2: ReleaseStock (idempotent)] -> [C1: MarkOrderCancelled]
# Nếu chính C2 timeout -> Orchestrator retry có backoff tới khi thành công hoặc cảnh báo vận hành`,
  },
  {
    id: 'sd_optimistic_pessimistic_locking',
    term: 'Optimistic Concurrency (CAS) vs Pessimistic Locking',
    aliases: ['Optimistic Locking', 'Pessimistic Locking', 'Compare-And-Swap', 'SELECT FOR UPDATE', 'Lost Update'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S3-07', 'S7-06'],
    relatedPatternIds: ['sd_fencing_token', 'sd_two_phase_commit', 'sd_idempotency_key'],
    shortVi:
      'Khóa bi quan giữ khóa dòng ngay lúc đọc để chặn giao dịch khác can thiệp; Kiểm soát lạc quan (CAS) không khóa lúc đọc mà kiểm tra cột phiên bản lúc ghi để ngăn lỗi ghi đè mất cập nhật (Lost Update).',
    shortEn:
      'Prevents lost updates either by acquiring exclusive row locks upfront (pessimistic) or verifying a version column on write (optimistic CAS).',
    mechanismVi:
      'Khi hai giao dịch cùng đọc `stock = 1`, cùng trừ trên RAM rồi cùng ghi `stock = 0`, một món hàng bị bán hai lần (Lost Update). Pessimistic Locking dùng `SELECT ... FOR UPDATE` xếp hàng tuần tự các giao dịch chạm cùng dòng ngay tại Database. Optimistic Concurrency Control (OCC / Compare-And-Swap) thêm cột `version`: câu lệnh `UPDATE ... SET stock = stock - 1, version = version + 1 WHERE id = :id AND version = :read_ver` chỉ cho đúng 1 giao dịch cập nhật thành công (`affected_rows = 1`), giao dịch còn lại nhận `0` để đọc mới và thử lại hoặc báo hết hàng.',
    whenToUseVi: [
      'Chọn Optimistic Locking (hoặc câu `UPDATE` điều kiện nguyên tử đơn lẻ `WHERE stock >= :qty`) khi tỷ lệ đụng độ trên cùng một bản ghi thấp đến trung bình hoặc khi người dùng suy nghĩ lâu trên màn hình chỉnh sửa.',
      'Chọn Pessimistic Locking cho giao dịch ngắn bên trong DB khi mức tranh chấp cao và chi phí thử lại toàn bộ logic nghiệp vụ rất đắt.',
    ],
    tradeoffsVi: [
      'Optimistic Locking không giữ khóa kết nối nên thông lượng đọc cao, nhưng khi 100 request cùng tranh đúng 1 dòng trong cùng mili-giây sẽ phát sinh tỷ lệ hủy và thử lại lớn.',
      'Pessimistic Locking tránh lãng phí công tính toán thử lại nhưng dễ gây Deadlock nếu hai giao dịch khóa nhiều dòng không theo thứ tự ID tăng dần thống nhất.',
    ],
    failureModeVi:
      'Mở giao dịch `BEGIN ... SELECT FOR UPDATE` rồi giữ nguyên kết nối đó trong lúc gọi HTTP ra cổng thanh toán bên ngoài mất 3 giây: chỉ vài chục request đồng thời sẽ khóa cứng bảng và làm cạn toàn bộ DB Connection Pool.',
    configSnippet: `-- 1. Optimistic CAS (không giữ khóa trong lúc tính toán):
UPDATE seats SET status = 'BOOKED', version = version + 1
WHERE seat_id = 42 AND status = 'FREE' AND version = 7;

-- 2. Nếu dùng SELECT FOR UPDATE nhiều dòng: luôn sắp xếp ORDER BY id ASC để tránh Deadlock!`,
  },
  {
    id: 'sd_crdt',
    term: 'CRDT (Conflict-Free Replicated Data Types)',
    aliases: ['CRDT', 'G-Counter', 'PN-Counter', 'OR-Set', 'LWW-Element-Set'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S3-08', 'S5-06'],
    relatedPatternIds: ['sd_cap_pacelc', 'sd_lamport_vector_clocks', 'sd_multi_region_active_active'],
    shortVi:
      'Cấu trúc dữ liệu thiết kế phép hợp nhất thỏa tính giao hoán, kết hợp và lũy đẳng để nhiều bản sao ghi độc lập không cần phối hợp khóa mà vẫn tự động hội tụ về cùng một kết quả.',
    shortEn:
      'Data structures with commutative, associative, idempotent merge rules guaranteeing automatic strong eventual convergence.',
    mechanismVi:
      'Trong môi trường đa vùng Active-Active hoặc ứng dụng cộng tác làm việc ngoại tuyến (như Figma, trình soạn thảo chung, giỏ hàng phân tán), việc chờ khóa đồng thuận mỗi lần gõ phím là bất khả thi. CRDT đảm bảo tính nhất quán hội tụ mạnh (Strong Eventual Consistency) bằng đại số bán dàn (join-semilattice). Ví dụ bộ đếm tăng giảm `PN-Counter` lưu hai mảng theo từng mã replica `P[node]` và `N[node]`: khi đồng bộ chỉ lấy `max` trên từng phần tử tương ứng, nên dù thông điệp đến trễ, đảo thứ tự hay gửi lặp nhiều lần thì tổng `sum(P) - sum(N)` trên mọi nút đều hội tụ chính xác tuyệt đối.',
    whenToUseVi: [
      'Bộ đếm phân tán đa vùng (lượt thích, số người đang xem), danh sách giỏ hàng/thẻ đánh dấu (`OR-Set`), tài liệu cộng tác thời gian thực.',
      'Khi hệ thống ưu tiên ghi cục bộ độ trễ 0 RTT liên vùng và hoạt động trơn tru kể cả lúc đứt cáp liên lục địa.',
    ],
    tradeoffsVi: [
      'Dung lượng trạng thái và metadata (mảng theo node hoặc thẻ định danh lần thêm trong `OR-Set`) lớn hơn dữ liệu nguyên thủy thông thường.',
      'Không biểu diễn được các ràng buộc bất biến có giới hạn toàn cục chặt (ví dụ "số dư không bao giờ được âm" hoặc "tồn kho >= 0" vẫn cần đồng thuận hoặc phân bổ hạn mức trước cho từng vùng).',
    ],
    failureModeVi:
      'Dùng tập hợp xóa đơn giản không gắn thẻ phiên bản thêm cho giỏ hàng: người dùng vừa xóa món hàng ở thiết bị A vừa thêm lại ở thiết bị B lúc mất mạng có thể hội tụ sai ý định nếu không dùng đúng `Observed-Remove Set (OR-Set)`.',
    configSnippet: `# G-Counter (Grow-only Counter) trên 3 vùng [US, EU, APAC]:
Region_US:   [12,  0,  4]   # US tự tăng 12, từng biết APAC = 4
Region_APAC: [10,  3,  9]   # APAC tự tăng lên 9, biết EU = 3
merge(a, b) = [max(a[i], b[i]) for i in range(3)] -> [12, 3, 9] (Tổng chuẩn = 24, không mất lượt tăng!)`,
  },
  {
    id: 'sd_idempotency_key',
    term: 'Idempotency Key & At-Least-Once Deduplication',
    aliases: ['Idempotency Key', 'Idempotency', 'Exactly-Once Effect'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S3-04', 'S4-06', 'S4-11', 'S7-06'],
    relatedPatternIds: ['sd_backoff_jitter', 'sd_saga_compensation', 'sd_transactional_outbox'],
    shortVi:
      'Mã định danh duy nhất do client sinh cho mỗi ý định thao tác để dù mạng timeout khiến yêu cầu được gửi lại nhiều lần, máy chủ vẫn chỉ thực hiện tác động nghiệp vụ đúng một lần.',
    shortEn:
      'Client-generated operation token ensuring retried requests execute side effects at most once and return the original result.',
    mechanismVi:
      'Khi client gọi `POST /payments` và gặp lỗi `Read Timeout`, client không thể biết máy chủ đã trừ tiền xong trước khi rớt gói tin phản hồi hay chưa nhận được yêu cầu. Nếu thử lại không có khóa chống trùng, khách hàng bị trừ tiền hai lần. Với `Idempotency-Key` (UUID gắn riêng cho lần bấm thanh toán đó), máy chủ lưu khóa này cùng ràng buộc `UNIQUE (tenant_id, idempotency_key)` trong cùng giao dịch Database với lệnh ghi nghiệp vụ, kèm ảnh chụp mã trạng thái và body phản hồi để nếu gặp lại khóa đó thì trả lại đúng kết quả cũ mà không chạy lại hiệu ứng phụ.',
    whenToUseVi: [
      'Mọi API thay đổi trạng thái không tự nhiên lũy đẳng (`POST` tạo đơn, trừ tiền, phát hành voucher, gửi thông báo) có bật cơ chế Retry.',
      'Mọi Consumer đọc hàng đợi theo cơ chế `At-Least-Once Delivery` (SQS, Kafka, RabbitMQ, Webhook đối tác) để đạt hiệu quả tương đương xử lý đúng một lần.',
    ],
    tradeoffsVi: [
      'Cần bảng lưu trữ khóa đã xử lý kèm TTL dọn dẹp hợp lý (ví dụ 24–72 giờ) và kiểm tra băm tham số đầu vào để phát hiện trường hợp client tái sử dụng nhầm cùng một key cho hai đơn khác nhau.',
      'Phải xử lý trạng thái trung gian `IN_PROGRESS` (trả `409 Conflict` hoặc chờ ngắn) khi request thứ hai đến đúng lúc request đầu tiên vẫn đang chạy dở.',
    ],
    failureModeVi:
      'Kiểm tra khóa trong Redis rồi mới ghi Database ở hai bước rời nhau không có khóa giao dịch: hai request trùng đến cách nhau 1 ms cùng đọc thấy chưa có khóa và cùng thực hiện trừ tiền kép.',
    configSnippet: `-- Ghi nhận Idempotency Key và nghiệp vụ trong CÙNG 1 giao dịch ACID:
BEGIN;
INSERT INTO idempotency_keys (scope, idem_key, req_hash, status)
VALUES (:user_id, :idem_key, :sha256_body, 'PROCESSING')
ON CONFLICT (scope, idem_key) DO NOTHING;
-- Nếu 0 rows inserted -> Đọc bản ghi hiện có: trả kết quả đã lưu hoặc 409 nếu đang PROCESSING`,
  },
  {
    id: 'sd_transactional_outbox',
    term: 'Transactional Outbox & Change Data Capture (CDC)',
    aliases: ['Transactional Outbox', 'Outbox Pattern', 'Outbox', 'Change Data Capture', 'CDC', 'Dual Write'],
    category: 'consensus-tx',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S2-11', 'S3-04', 'S7-06'],
    relatedPatternIds: ['sd_pubsub_event_streaming', 'sd_saga_compensation', 'sd_idempotency_key'],
    shortVi:
      'Ghi cả dữ liệu nghiệp vụ lẫn bản tin sự kiện vào bảng Outbox trong cùng một giao dịch Database cục bộ, sau đó tiến trình tiếp vận hoặc CDC đẩy sang Message Broker để loại bỏ lỗi ghi kép (Dual-Write).',
    shortEn:
      'Eliminates dual-write inconsistency by persisting domain changes and outgoing events in one local ACID transaction, relayed asynchronously.',
    mechanismVi:
      'Nếu ứng dụng `COMMIT` đơn hàng vào PostgreSQL rồi gọi tiếp `kafka.produce()` trong mã nguồn (Dual Write), tiến trình bị sập hoặc mạng đứt giữa hai dòng lệnh sẽ để lại đơn hàng đã lưu nhưng không bao giờ có sự kiện phát đi (hoặc ngược lại nếu gửi sự kiện trước mà rollback DB). Với Transactional Outbox, ứng dụng chèn dòng sự kiện vào bảng `outbox_events` ngay bên trong cùng giao dịch SQL của bảng `orders`. Một tiến trình Relay quét định kỳ (`SELECT ... FOR UPDATE SKIP LOCKED`) hoặc công cụ CDC đọc WAL (Debezium) sẽ đọc bảng Outbox và phát sang Broker cho tới khi nhận được ACK.',
    whenToUseVi: [
      'Mọi nơi cần vừa cập nhật Database vừa phát sự kiện đáng tin cậy sang Kafka/RabbitMQ/SQS hoặc đồng bộ sang kho tìm kiếm/cache.',
      'Làm nền tảng truyền thông điệp tin cậy giữa các bước của Saga Pattern.',
    ],
    tradeoffsVi: [
      'Đảm bảo chắc chắn `At-Least-Once` (không bao giờ mất sự kiện đã commit DB), nhưng nếu Relay sập ngay sau khi vừa gửi Broker mà chưa kịp đánh dấu `published_at`, sự kiện sẽ được gửi lại lần hai -> bên nhận bắt buộc phải xử lý lũy đẳng theo `event_id`.',
      'Tăng gấp đôi số dòng ghi trong giao dịch cục bộ và cần tác vụ dọn dẹp/phân vùng bảng `outbox_events` định kỳ để không phình dung lượng DB.',
    ],
    failureModeVi:
      'Chạy nhiều tiến trình Polling Relay cùng quét bảng Outbox mà thiếu mệnh đề `FOR UPDATE SKIP LOCKED`, khiến mọi worker đều lấy trùng một lô sự kiện và nhân bản lưu lượng gửi lên Broker.',
    configSnippet: `-- 1. Giao dịch nghiệp vụ nguyên tử duy nhất (tránh hoàn toàn Dual-Write):
BEGIN;
  INSERT INTO orders (id, amount, status) VALUES ('ord_88', 250000, 'CREATED');
  INSERT INTO outbox_events (id, aggregate_id, topic, payload)
  VALUES ('evt_901', 'ord_88', 'orders.events', '{"type":"OrderCreated","id":"ord_88"}');
COMMIT;
-- 2. Relay Worker: SELECT * FROM outbox_events WHERE sent_at IS NULL ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED;`,
  },

  // ============================================================================
  // 7. RELIABILITY & OBSERVABILITY (9 patterns)
  // ============================================================================
  {
    id: 'sd_spof_redundancy',
    term: 'Single Point of Failure (SPOF), Multi-AZ & RTO/RPO',
    aliases: ['SPOF', 'Single Point of Failure', 'Multi-AZ', 'RTO', 'RPO', 'Failover'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S3-09', 'S2-01', 'S6-06'],
    relatedPatternIds: ['sd_sla_slo_sli', 'sd_leader_follower_replication', 'sd_multi_region_active_active'],
    shortVi:
      'Loại bỏ mọi thành phần đơn lẻ mà khi hỏng sẽ kéo dừng toàn bộ hệ thống bằng dự phòng trải qua nhiều Availability Zone, đo lường bằng thời gian khôi phục (RTO) và lượng dữ liệu tối đa có thể mất (RPO).',
    shortEn:
      'Eliminates single points of failure via Multi-AZ redundancy, quantified by Recovery Time Objective (RTO) and Recovery Point Objective (RPO).',
    mechanismVi:
      'Một hệ thống dù có 20 máy chủ ứng dụng vẫn ngừng hoạt động hoàn toàn nếu đứng sau duy nhất 1 Load Balancer, 1 NAT Gateway, 1 máy chủ Database không có bản sao hoặc tất cả đặt chung trong 1 tủ nguồn trung tâm dữ liệu. Triển khai Multi-AZ đặt các cặp Load Balancer Active-Active/Active-Standby (VIP/Anycast), rải App Pod và đặt Standby Database ở các khu vực điện-mạng độc lập cách nhau vài đến vài chục km (RTT < 2 ms). `RTO` xác định hệ thống được phép gián đoạn bao lâu để chuyển đổi dự phòng, còn `RPO` xác định mốc dữ liệu tối đa chấp nhận mất tính bằng thời gian.',
    whenToUseVi: [
      'Rà soát sơ đồ kiến trúc trước khi lên Production bằng câu hỏi kiểm tra trên từng khối và từng đường nối: "Nếu thành phần này ngừng phản hồi ngay bây giờ, điều gì xảy ra?".',
      'Xác định phương án sao lưu và nhân bản phù hợp với yêu cầu `RTO` / `RPO` của doanh nghiệp.',
    ],
    tradeoffsVi: [
      'Đạt `RPO = 0` và `RTO < 30s` đòi hỏi nhân bản đồng bộ/bán đồng bộ sang AZ khác kèm bộ điều phối failover tự động được diễn tập định kỳ.',
      'Dự phòng phần cứng KHÔNG chống được lỗi phần mềm hoặc cấu hình sai được đẩy đồng thời lên toàn bộ các nút (cần Canary và phân tách vùng triển khai).',
    ],
    failureModeVi:
      'Có cấu hình Standby Replica và bản sao lưu hàng đêm nhưng chưa từng chạy thử kịch bản khôi phục thật: tới khi sự cố xảy ra mới phát hiện script promote thiếu quyền mạng hoặc bản backup hỏng, làm `RTO` vọt từ 5 phút lên 8 giờ.',
    configSnippet: `RPO (Recovery Point Objective): Lượng dữ liệu tối đa có thể mất (Sync DB = 0s | Async = vài giây | Nightly Backup = 24h)
RTO (Recovery Time Objective):  Thời gian từ lúc sự cố tới lúc dịch vụ chạy lại bình thường
# Checklist SPOF: DNS, LB, API Gateway, Auth/Registry, Cache, Primary DB, NAT Gateway, Cert Expiry`,
  },
  {
    id: 'sd_timeout_deadline',
    term: 'Connection/Read Timeout & Deadline Propagation',
    aliases: ['Deadline Propagation', 'Deadline Cancellation', 'Request Timeout', 'Connect Timeout'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S4-11', 'S1-02'],
    relatedPatternIds: ['sd_backoff_jitter', 'sd_circuit_breaker', 'sd_bulkhead_isolation'],
    shortVi:
      'Mọi lời gọi qua mạng bắt buộc có giới hạn thời gian kết nối và đọc phản hồi, đồng thời truyền ngân sách thời gian còn lại (Deadline) xuyên chuỗi dịch vụ để hủy ngay công việc đã quá hạn của người dùng.',
    shortEn:
      'Bounds every network call with explicit connect/read timeouts and propagates remaining request deadlines across hops.',
    mechanismVi:
      'Một lời gọi HTTP/DB không đặt timeout (hoặc để mặc định vô hạn / 60–120 giây của thư viện) sẽ giữ chặt thread và kết nối khi dịch vụ đích bị chậm mạng hoặc treo khóa, nhanh chóng làm cạn tài nguyên của dịch vụ gọi (Cascading Failure). Ngoài việc đặt `connect_timeout` ngắn (200–1000 ms) và `read_timeout` bám sát p99.9 bình thường cộng biên độ nhỏ, hệ thống nhiều tầng cần truyền `Deadline` tuyệt đối (như gRPC `grpc-timeout` / context cancellation): nếu cổng ngoài cho phép tổng 800 ms và chặng A đã tiêu mất 650 ms, chặng B chỉ còn ngân sách tối đa 150 ms; nếu người dùng đã ngắt kết nối, các truy vấn con phía dưới hủy ngay để tiết kiệm CPU/DB.',
    whenToUseVi: [
      'Quy tắc bắt buộc cho 100% HTTP client, RPC client, Database query, Redis client và SDK bên thứ ba.',
      'Chuỗi gọi đồng bộ từ 2 chặng trở lên nơi độ trễ cộng dồn cần nằm gọn trong ngân sách chờ của người dùng.',
    ],
    tradeoffsVi: [
      'Đặt timeout quá sát p95 lúc bình thường sẽ cắt nhầm các request hợp lệ ngay khi tải hơi nhích lên và kích hoạt retry không cần thiết.',
      'Đặt timeout của dịch vụ tầng trên dài hơn hoặc lệch vô lý so với tầng dưới khiến client đã bỏ cuộc nhưng backend vẫn tiếp tục chạy lãng phí.',
    ],
    failureModeVi:
      'Cấu hình timeout tầng API Gateway là 3 giây nhưng dịch vụ bên dưới đặt timeout 10 giây và không lắng nghe tín hiệu hủy kết nối (`AbortSignal` / `context.Context`): client retry tạo thêm bản sao công việc mới đè lên các bản cũ vẫn đang chạy ngầm.',
    configSnippet: `// Truyền ngân sách thời gian còn lại (Deadline Propagation) + hủy luồng khi hết hạn:
const remainingMs = requestDeadlineEpochMs - Date.now() - SAFETY_MARGIN_MS;
if (remainingMs <= 0) throw new DeadlineExceededError();
await fetch(upstreamUrl, { signal: AbortSignal.timeout(remainingMs) });`,
  },
  {
    id: 'sd_backoff_jitter',
    term: 'Exponential Backoff & Full Jitter',
    aliases: ['Exponential Backoff', 'Full Jitter', 'Retry Storm'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Beginner',
    relatedModules: ['S4-11', 'S4-06', 'S7-01'],
    relatedPatternIds: ['sd_retry_budget', 'sd_timeout_deadline', 'sd_idempotency_key'],
    shortVi:
      'Tăng gấp đôi khoảng chờ tối đa sau mỗi lần thử lại thất bại (có trần dừng) và lấy ngẫu nhiên đều trong khoảng đó (Full Jitter) để phá vỡ các đợt sóng retry đồng bộ.',
    shortEn:
      'Spaces retries exponentially with uniform random jitter to break synchronized retry waves against recovering services.',
    mechanismVi:
      'Khi một dịch vụ chập chờn trong 1 giây làm lỗi 5.000 request cùng lúc, việc thử lại ngay lập tức (immediate retry) làm tải đập vào dịch vụ đang yếu tăng gấp nhiều lần. Ngay cả khi dùng hàm mũ cố định (`1s, 2s, 4s`), cả 5.000 client vẫn thức dậy đồng loạt đúng giây thứ 1, giây thứ 2, giây thứ 4 tạo thành từng đợt sóng xung kích lặp lại. Công thức `Full Jitter` chọn giá trị ngẫu nhiên phân phối đều từ `0` đến `min(cap, base * 2^attempt)`, trải phẳng lưu lượng thử lại thành dòng đều đặn giúp dịch vụ đích kịp hồi phục.',
    whenToUseVi: [
      'Thử lại các lỗi tạm thời có khả năng tự hết (`HTTP 429`, `502`, `503`, `504`, lỗi mạng tạm thời) đối với các thao tác đọc hoặc thao tác ghi đã gắn `Idempotency Key`.',
      'Luồng tự động kết nối lại của hàng trăm nghìn thiết bị di động / IoT / WebSocket sau sự cố mạng.',
    ],
    tradeoffsVi: [
      'Không bao giờ retry các lỗi cố định do dữ liệu đầu vào hoặc quyền hạn (`400 Bad Request`, `401`, `403`, `404`, `422`).',
      'Với request đồng bộ người dùng đang chờ trực tiếp, chỉ nên retry tối đa 1–2 lần với khoảng chờ ngắn; các chuỗi retry dài hàng phút phải đẩy sang hàng đợi nền.',
    ],
    failureModeVi:
      'Mỗi tầng trong chuỗi 4 microservice đều cấu hình `max_retries = 3`: khi dịch vụ đáy cùng bị lỗi, tổng số lời gọi bị nhân theo cấp số mũ `4 × 4 × 4 = 64` lần (Multi-layer Retry Amplification)! Quy tắc chuẩn là chỉ retry tại một tầng duy nhất ngay sát nơi phát sinh hoặc ở rìa kèm Retry Budget.',
    configSnippet: `# AWS Architecture Standard — Exponential Backoff with Full Jitter:
sleep_ms = random.uniform(0, min(MAX_CAP_MS, BASE_MS * (2 ** attempt)))
# Ví dụ BASE_MS = 100, MAX_CAP_MS = 5000:
# attempt 0 -> rand(0..100ms), attempt 1 -> rand(0..200ms), attempt 2 -> rand(0..400ms)`,
  },
  {
    id: 'sd_retry_budget',
    term: 'Retry Budget & Adaptive Throttling',
    aliases: ['Retry Budget', 'Adaptive Retry', 'Retry Amplification'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-11', 'S7-03'],
    relatedPatternIds: ['sd_backoff_jitter', 'sd_circuit_breaker', 'sd_timeout_deadline'],
    shortVi:
      'Giới hạn tổng lưu lượng thử lại không vượt quá một tỷ lệ nhỏ (thường 10%) so với lưu lượng gốc để tự động khóa retry khi dịch vụ đích thực sự đang quá tải toàn diện.',
    shortEn:
      'Caps total retry volume to a fixed fraction (e.g. 10%) of normal request volume to prevent overload amplification.',
    mechanismVi:
      'Khi chỉ có 0.5% gói tin bị rớt ngẫu nhiên trên mạng, retry giúp che giấu hoàn toàn lỗi mà chỉ làm tăng tải thêm 0.5%. Ngược lại, khi dịch vụ đích đang quá tải làm 50% request thất bại, cho phép retry 3 lần sẽ nhân đôi tải đầu vào và khóa chặt dịch vụ đích ở trạng thái quá tải vĩnh viễn. Retry Budget duy trì một bộ đếm dạng Token Bucket ngay tại mỗi client: mỗi request hoàn tất nạp vào `0.1` token, mỗi lần retry tiêu tốn `1.0` token. Khi tỷ lệ lỗi vượt ~10%, rổ token cạn sạch và client tự động ngừng retry ngay lập tức mà chỉ gửi lưu lượng gốc một lần.',
    whenToUseVi: [
      'Cấu hình chuẩn trên các RPC client / Service Mesh (Envoy `retry_budget`, gRPC, Finagle) cho hệ thống giao tiếp nội bộ mật độ cao.',
      'Kết hợp cùng Backoff + Full Jitter để vừa làm phẳng gai ngắn vừa khóa chặt trần tải khuếch đại tối đa (ví dụ không bao giờ vượt 1.1x tải gốc).',
    ],
    tradeoffsVi: [
      'Đặt ngân sách thấp (5%–10%) bảo vệ rất chắc chắn cho backend nhưng khi sự cố diện rộng xảy ra, các request lỗi sớm hơn sẽ không được thử lại.',
      'Cần đặt thêm mức sàn nhỏ (`min_retries_per_second`, ví dụ 3 req/s) để các dịch vụ lưu lượng cực thấp ban đêm không bị khóa retry chỉ vì 1 lỗi ngẫu nhiên.',
    ],
    failureModeVi:
      'Dựa hoàn toàn vào giới hạn `max_attempts = 3` trên từng request riêng lẻ mà không có ngân sách tổng ở mức tiến trình: dưới tải cao, 3 lần thử cho mỗi request vẫn tạo hệ số khuếch đại lên tới 400%.',
    configSnippet: `# Envoy / Service Mesh Retry Budget chuẩn:
retry_budget:
  budget_percent: { value: 10.0 }      # Tối đa +10% tải tăng thêm do retry (trần 1.1x)
  min_retry_concurrency: 3             # Mức sàn cho giai đoạn lưu lượng thấp`,
  },
  {
    id: 'sd_circuit_breaker',
    term: 'Circuit Breaker (Closed / Open / Half-Open)',
    aliases: ['Circuit Breaker', 'Half-Open', 'Fail Fast'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-11', 'S7-03'],
    relatedPatternIds: ['sd_timeout_deadline', 'sd_bulkhead_isolation', 'sd_graceful_degradation'],
    shortVi:
      'Máy trạng thái theo dõi tỷ lệ lỗi/chậm của dịch vụ phụ thuộc: tự động ngắt mạch trả lỗi tức thì (Open) khi vượt ngưỡng sự cố và mở hé thăm dò (Half-Open) trước khi đóng mạch trở lại.',
    shortEn:
      'State machine (Closed, Open, Half-Open) that fails fast when an upstream dependency is degraded and probes recovery safely.',
    mechanismVi:
      'Ở trạng thái bình thường (`Closed`), mọi lời gọi đi qua và được thống kê trong cửa sổ trượt (ví dụ 50 lời gọi gần nhất). Nếu tỷ lệ lỗi/timeout vượt ngưỡng (ví dụ ≥ 50% khi đã có tối thiểu 20 lời gọi), cầu dao chuyển sang trạng thái `Open` trong một khoảng nghỉ (ví dụ 15–30 giây): mọi lời gọi mới lập tức trả về lỗi hoặc dữ liệu dự phòng trong < 0.1 ms mà không tốn socket hay chờ timeout, giải phóng thời gian cho dịch vụ đích hồi phục. Hết khoảng nghỉ, cầu dao chuyển sang `Half-Open` cho phép một vài request thăm dò đi qua: nếu thành công liên tiếp sẽ về lại `Closed`, nếu vẫn lỗi lập tức quay lại `Open`.',
    whenToUseVi: [
      'Bọc quanh lời gọi tới các dịch vụ bên thứ ba (cổng SMS/Email, đối tác vận chuyển, hệ thống gợi ý) hoặc dịch vụ nội bộ không thiết yếu dễ bị chậm.',
      'Kết hợp trực tiếp với một nhánh xử lý dự phòng (Fallback / Graceful Degradation) để người dùng vẫn hoàn tất được luồng chính.',
    ],
    tradeoffsVi: [
      'Đặt ngưỡng kích hoạt quá nhạy hoặc thiếu số mẫu tối thiểu (`minimumNumberOfCalls`) khiến vài lỗi lẻ lúc thưa khách ngắt nhầm toàn bộ kết nối.',
      'Nếu nhiều thực thể khác nhau dùng chung một cầu dao (ví dụ mọi ngân hàng chung 1 Circuit Breaker của cổng chuyển mạch), một ngân hàng bảo trì có thể làm ngắt luôn lưu lượng sang các ngân hàng đang khỏe mạnh khác (cần tách key cầu dao theo đích thực tế).',
    ],
    failureModeVi:
      'Đếm cả các mã lỗi nghiệp vụ phía người dùng (`400 Bad Request`, `404 Not Found`) vào bộ đếm thất bại của Circuit Breaker: một đợt client gửi sai tham số làm ngắt mạch oan dịch vụ backend đang hoạt động hoàn toàn bình thường.',
    configSnippet: `Closed --(failure_rate >= 50% & calls >= 20)--> Open (Fail-fast / Fallback trong 20s)
Open   --(sau 20s wait_duration)--------------> Half-Open (cho qua 5 probe requests)
Half-Open --(5/5 probes thành công)-----------> Closed  |  (bất kỳ probe 5xx/timeout) -> Open`,
  },
  {
    id: 'sd_bulkhead_isolation',
    term: 'Bulkhead Isolation (Resource & Thread Pool Partitioning)',
    aliases: ['Bulkhead', 'Bulkhead Isolation', 'Noisy Neighbor', 'Shuffle Sharding'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-11', 'S5-01'],
    relatedPatternIds: ['sd_circuit_breaker', 'sd_littles_law', 'sd_chaos_blast_radius'],
    shortVi:
      'Phân chia cô lập tài nguyên dùng chung (thread pool, connection pool, hàng đợi, cụm worker) thành các khoang tách biệt để một tính năng hoặc một khách hàng quá tải không làm tê liệt phần còn lại.',
    shortEn:
      'Partitions shared thread pools, connection pools, or worker fleets into isolated compartments to contain fault propagation.',
    mechanismVi:
      'Lấy nguyên lý các vách ngăn kín nước trong thân tàu: nếu dịch vụ Checkout dùng chung một pool 200 luồng cho cả lời gọi Payment cốt lõi lẫn lời gọi Recommendation phụ trợ, khi dịch vụ Recommendation bị chậm 5 giây, cả 200 luồng đều bị chiếm giữ chờ Recommendation khiến chức năng thanh toán ngừng hoạt động hoàn toàn dù Payment vẫn khỏe. Bulkhead cấp hạn ngạch riêng (ví dụ tối đa 25 kết nối/semaphore cho Recommendation, 120 cho Payment) hoặc tách queue/pod riêng cho tác vụ báo cáo nặng và khách hàng lớn.',
    whenToUseVi: [
      'Một tiến trình gọi tới nhiều dịch vụ phụ thuộc có mức độ quan trọng khác nhau (Critical vs Non-critical dependencies).',
      'Hệ thống đa khách hàng (Multi-tenant) cần ngăn hiệu ứng "hàng xóm ồn ào" (Noisy Neighbor) bằng phân vùng tài nguyên hoặc Shuffle Sharding.',
    ],
    tradeoffsVi: [
      'Tài nguyên rỗi ở khoang A không tự động cho khoang B vay vượt trần cứng, nên hiệu suất tận dụng tổng thể thấp hơn một pool gộp chung.',
      'Tách quá nhiều thread pool vật lý làm tăng bộ nhớ ngăn xếp và chi phí chuyển ngữ cảnh (nên dùng Semaphore giới hạn số lời gọi đồng thời cho kiến trúc async/event-loop).',
    ],
    failureModeVi:
      'Dùng chung một hàng đợi duy nhất cho cả thông báo mã OTP giao dịch khẩn cấp lẫn chiến dịch gửi 5 triệu tin khuyến mãi: chiến dịch marketing làm OTP đến muộn 40 phút và hết hiệu lực.',
    configSnippet: `# Cô lập hạn mức đồng thời riêng cho từng dịch vụ phụ thuộc (Semaphore Bulkhead):
payment_bulkhead        = Semaphore(max_concurrent=120, max_wait_ms=100)
recommendation_bulkhead = Semaphore(max_concurrent=20,  max_wait_ms=10) # Quá 20 -> trả rỗng ngay!`,
  },
  {
    id: 'sd_token_bucket_rate_limit',
    term: 'Rate Limiting (Token Bucket & Sliding Window)',
    aliases: ['Token Bucket', 'Leaky Bucket', 'Sliding Window', 'Rate Limiting', 'HTTP 429'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-05', 'S7-02'],
    relatedPatternIds: ['sd_api_gateway_discovery', 'sd_message_queue_backpressure', 'sd_bulkhead_isolation'],
    shortVi:
      'Kiểm soát tốc độ gửi yêu cầu theo người dùng, khóa API hoặc địa chỉ IP; Token Bucket cho phép đợt bùng nổ ngắn có kiểm soát, còn Sliding Window chặn chính xác hiện tượng nhân đôi lưu lượng ở rìa phút.',
    shortEn:
      'Enforces per-client request quotas via Token Bucket (controlled bursts) or Sliding Window Counter, returning HTTP 429.',
    mechanismVi:
      'Trong `Token Bucket`, mỗi khóa có một xô dung tích tối đa `B` (burst) được nạp đều đặn `r` thẻ mỗi giây; mỗi request lấy 1 thẻ, hết thẻ trả về `HTTP 429 Too Many Requests` kèm header `Retry-After`. Khác với `Leaky Bucket` ép đầu ra phẳng tuyệt đối tốc độ cố định, Token Bucket thân thiện với hành vi mở trang tự nhiên của người dùng. Nếu đếm theo cửa sổ cố định (`Fixed Window` theo từng phút tròn), một client có thể gửi dồn giới hạn ở giây `00:59` rồi gửi tiếp gấp đôi ở giây `01:00`; công thức `Sliding Window Counter` nội suy trọng số từ cửa sổ trước và cửa sổ hiện tại chỉ với 2 con số cực nhẹ.',
    whenToUseVi: [
      'Chắn tại lớp API Gateway / Edge để bảo vệ hệ thống khỏi script lạm dụng, quét mật khẩu, hoặc thực thi gói cước phân tầng theo khách hàng.',
      'Chia sẻ bộ đếm nguyên tử qua cụm Redis Lua script (hoặc kết hợp bộ đếm lô cục bộ khi lưu lượng chạm hàng trăm nghìn RPS).',
    ],
    tradeoffsVi: [
      'Gọi Redis tập trung trên mọi request đảm bảo hạn mức chính xác xuyên nhiều Gateway nhưng cộng thêm ~0.5–1 ms độ trễ mạng nội bộ.',
      'Sliding Window Log (lưu dấu thời gian mọi request trong Sorted Set) chính xác tuyệt đối nhưng tốn RAM gấp nhiều lần so với Token Bucket hoặc Sliding Window Counter.',
    ],
    failureModeVi:
      'Cấu hình Rate Limiter ở chế độ `Fail-Closed` khi cụm Redis giữ bộ đếm gặp sự cố kết nối: thay vì tạm thời cho lưu lượng đi qua hoặc chuyển sang giới hạn cục bộ trên từng Gateway (`Fail-Open / Local Fallback`), toàn bộ người dùng hợp lệ bị từ chối 100%.',
    configSnippet: `# Sliding Window Counter xấp xỉ siêu nhẹ O(1) RAM:
weight_prev = (window_sec - elapsed_in_curr_window) / window_sec
estimated   = prev_window_count * weight_prev + curr_window_count
# Phản hồi chuẩn khi vượt ngưỡng:
HTTP/1.1 429 Too Many Requests | Retry-After: 12 | X-RateLimit-Remaining: 0`,
  },
  {
    id: 'sd_graceful_degradation',
    term: 'Graceful Degradation & Fallback Response',
    aliases: ['Graceful Degradation', 'Feature Shedding', 'Static Fallback'],
    category: 'reliability-obs',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S4-10', 'S4-11', 'S6-06'],
    relatedPatternIds: ['sd_circuit_breaker', 'sd_bulkhead_isolation', 'sd_message_queue_backpressure'],
    shortVi:
      'Khi quá tải hoặc một dịch vụ phụ gặp sự cố, hệ thống chủ động rút gọn các tính năng không cốt lõi hoặc trả dữ liệu tĩnh/cũ hợp lý để bảo toàn trọn vẹn luồng nghiệp vụ quan trọng nhất.',
    shortEn:
      'Deliberately disables non-essential features or serves cached/static fallbacks under stress to keep core user journeys working.',
    mechanismVi:
      'Thay vì coi mọi thành phần trên màn hình đều bắt buộc như nhau (chỉ 1 trong 8 microservice lỗi là trả trang trắng `HTTP 500`), ứng dụng phân cấp độ ưu tiên rõ ràng: Tier-0 (tìm sản phẩm, thêm giỏ hàng, thanh toán) và Tier-2 (sản phẩm gợi ý cá nhân hóa, danh sách người vừa xem, huy hiệu xếp hạng). Khi Circuit Breaker của dịch vụ cá nhân hóa mở hoặc tải tổng vượt ngưỡng an toàn, hệ thống tự động trả về danh sách bán chạy tĩnh lưu sẵn trên RAM hoặc ẩn tạm khối phụ trợ đó.',
    whenToUseVi: [
      'Trang chủ thương mại điện tử, trang phát video, luồng đặt xe/đặt món hoặc sự kiện lưu lượng cao.',
      'Kết hợp công tắc điều khiển động (Kill Switch / Operational Feature Flag) để đội vận hành tắt tức thì tính năng nặng mà không cần build lại code.',
    ],
    tradeoffsVi: [
      'Đòi hỏi giao diện phía Client (Web/Mobile) phải thiết kế chịu đựng tốt dữ liệu trả về một phần (`partial response`) mà không văng lỗi render.',
      'Các nhánh mã Fallback ít được chạy ngày thường nên rất dễ bị hỏng ngầm nếu không được kiểm thử định kỳ bằng Fault Injection.',
    ],
    failureModeVi:
      'Cài đặt nhánh Fallback nhưng chính nhánh Fallback đó lại gọi xuống một truy vấn Database nặng không qua cache: khi mạch chính ngắt, lưu lượng dồn sang nhánh Fallback làm nghẽn luôn Database chính.',
    configSnippet: `try {
  recs = await circuitBreaker.exec(() => recoSvc.getPersonalized(userId, { timeout: 80 }));
} catch {
  recs = localMemoryCache.get("top_sellers_global_static"); // 0 network call, 0 DB load!
}`,
  },
  {
    id: 'sd_distributed_tracing_red_use',
    term: 'Distributed Tracing, RED/USE Metrics & Burn-Rate Alerting',
    aliases: ['Distributed Tracing', 'Trace Context', 'RED Metrics', 'USE Method', 'Burn Rate'],
    category: 'reliability-obs',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S4-07', 'S0-09', 'S6-06'],
    relatedPatternIds: ['sd_sla_slo_sli', 'sd_percentiles_tail_latency', 'sd_bottleneck_amdahl'],
    shortVi:
      'Kết hợp 3 trụ cột quan sát hệ thống: Metrics theo phương pháp RED/USE để phát hiện triệu chứng, Distributed Tracing gắn `traceparent` xuyên dịch vụ để khoanh vùng chặng chậm, và Structured Logs để đọc chi tiết ngữ cảnh lỗi.',
    shortEn:
      'Combines RED/USE metrics, W3C trace-context waterfalls across services, structured logs, and SLO burn-rate alerts.',
    mechanismVi:
      'Đối với dịch vụ hướng request, bộ chỉ số **RED** đo `Rate` (RPS), `Errors` (tỷ lệ lỗi), `Duration` (phân vị p50/p95/p99). Đối với tài nguyên phần cứng/hồ kết nối, phương pháp **USE** đo `Utilization` (% bận), `Saturation` (độ dài hàng đợi), `Errors`. Khi cảnh báo tốc độ đốt Error Budget (**Multi-window Burn-Rate**) kích hoạt, kỹ sư mở biểu đồ thác nước **Distributed Trace** (OpenTelemetry chuẩn header `traceparent` truyền `trace_id` và `span_id` qua HTTP/Queue) để nhìn thấy ngay chặng nào trong 12 microservice chiếm 85% tổng thời gian, rồi nhảy thẳng sang dòng Structured JSON Log mang cùng `trace_id`.',
    whenToUseVi: [
      'Tiêu chuẩn bắt buộc cho mọi kiến trúc phân tán, microservices và hàng đợi bất đồng bộ để rút ngắn thời gian chẩn đoán sự cố (MTTD / MTTR).',
      'Áp dụng Tail-based Sampling (giữ lại 100% các trace bị lỗi hoặc vượt p99, lấy mẫu 1%–5% trace bình thường) để kiểm soát chi phí lưu trữ.',
    ],
    tradeoffsVi: [
      'Gắn nhãn có số lượng giá trị vô hạn (High-Cardinality Labels như `user_id`, `order_id`, `request_id`) vào hệ thống Time-Series Metrics (Prometheus) sẽ làm bùng nổ số chuỗi thời gian gây tràn RAM máy giám sát — những trường này chỉ được phép đặt trong Trace và Log!',
      'Truyền ngữ cảnh Trace qua Message Queue đòi hỏi đính kèm header vào metadata của thông điệp.',
    ],
    failureModeVi:
      'Cảnh báo trực tiếp theo CPU nhảy ngắn 1 phút hoặc ngưỡng lỗi rời rạc làm kỹ sư trực ca nhận hàng chục tin báo giả mỗi đêm (Alert Fatigue), dẫn tới bỏ sót cảnh báo suy giảm SLO thực sự.',
    configSnippet: `# W3C Trace Context Header truyền xuyên suốt Gateway -> App -> Queue -> Worker -> DB:
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
# RED Metrics (cho Service):  Rate (req/s) · Errors (5xx/s) · Duration (p50/p95/p99)
# USE Metrics (cho Resource): Utilization (ρ) · Saturation (queue depth) · Errors`,
  },

  // ============================================================================
  // 8. SECURITY, DELIVERY & MULTI-REGION (5 patterns)
  // ============================================================================
  {
    id: 'sd_zero_trust_mtls_jwt',
    term: 'Zero-Trust Service Auth: mTLS, Short-Lived JWT & KMS',
    aliases: ['mTLS', 'Mutual TLS', 'Zero-Trust', 'Short-Lived JWT', 'Envelope Encryption'],
    category: 'security-shipping',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S6-08', 'S6-09', 'S6-10'],
    relatedPatternIds: ['sd_reverse_proxy', 'sd_api_gateway_discovery'],
    shortVi:
      'Không mặc định tin cậy lưu lượng chỉ vì nằm trong mạng nội bộ: xác thực hai chiều và mã hóa đường truyền dịch vụ bằng mTLS, truyền ngữ cảnh quyền hạn bằng JWT ngắn hạn và bảo vệ khóa gốc qua KMS.',
    shortEn:
      'Verifies both service identity (mTLS SPIFFE certs) and end-user claims (short-lived JWTs) on every internal hop without trusting private networks.',
    mechanismVi:
      'Mô hình bảo mật vành đai cũ ("qua khỏi tường lửa ngoài là tin cậy hết") khiến một container bị xâm nhập có thể gọi tự do mọi dịch vụ nội bộ. Trong kiến trúc Zero-Trust, Service Mesh / Workload Identity tự động cấp và xoay vòng chứng chỉ X.509 ngắn hạn (vài giờ) cho từng dịch vụ để bắt tay **Mutual TLS (mTLS)** — vừa mã hóa trên đường truyền nội bộ, vừa kiểm tra chính sách `Service A có được phép gọi endpoint X của Service B không`. Song song đó, danh tính người dùng cuối được truyền qua `JWT` thời hạn ngắn (5–15 phút) ký bất đối xứng (`RS256`/`EdDSA`, kiểm tra qua `JWKS`), còn dữ liệu nhạy cảm trên đĩa dùng mã hóa phong bì (`Envelope Encryption`: khóa dữ liệu `DEK` mã hóa bởi khóa chủ `KEK` trong KMS).',
    whenToUseVi: [
      'Hệ thống tài chính, y tế, SaaS đa khách hàng hoặc cụm microservices dùng chung hạ tầng mạng.',
      'Thay thế hoàn toàn các khóa API tĩnh chia sẻ chung dài hạn giữa các microservice.',
    ],
    tradeoffsVi: [
      'Chứng chỉ mTLS và JWT ngắn hạn đòi hỏi cơ chế xoay vòng tự động và đồng bộ thời gian NTP chính xác giữa các máy chủ.',
      'Kiểm tra quyền sở hữu mức bản ghi (Authorization / chống IDOR & Confused Deputy) vẫn phải được thực hiện tường minh tại tầng dịch vụ đích, mTLS chỉ xác nhận danh tính dịch vụ gọi.',
    ],
    failureModeVi:
      'Dịch vụ nội bộ B tin tưởng mù quáng tham số `user_id` do dịch vụ A truyền sang chỉ vì kết nối mTLS hợp lệ, tạo lỗ hổng Confused Deputy nếu một endpoint công khai của A không kiểm tra quyền sở hữu đối với `user_id` đó.',
    configSnippet: `Transport Identity (Machine): mTLS X.509 SPIFFE ID (spiffe://prod/ns/checkout/sa/order-svc)
User Context (Human):         Authorization: Bearer <Short-Lived JWT exp=10m, aud=payment-svc>
At-Rest Encryption:           Data --(AES-256-GCM via DEK)--> Disk | DEK encrypted by KMS KEK`,
  },
  {
    id: 'sd_canary_feature_flags',
    term: 'Canary Deployment, Blue-Green & Feature Flags',
    aliases: ['Canary Deployment', 'Blue-Green Deployment', 'Feature Flag', 'Progressive Delivery'],
    category: 'security-shipping',
    glossaryKind: 'ecosystem',
    difficulty: 'Intermediate',
    relatedModules: ['S6-12', 'S3-09'],
    relatedPatternIds: ['sd_expand_migrate_contract', 'sd_health_check_draining', 'sd_graceful_degradation'],
    shortVi:
      'Tách thời điểm đưa mã nguồn lên máy chủ khỏi thời điểm bật tính năng cho toàn bộ người dùng: điều phối lưu lượng tăng dần 1% -> 10% -> 50% -> 100% kèm đối chiếu tự động chỉ số lỗi/độ trễ.',
    shortEn:
      'Progressively shifts production traffic to new releases or toggles features dynamically with automated metric-driven rollback.',
    mechanismVi:
      '`Blue-Green` dựng song song môi trường mới hoàn chỉnh, kiểm thử ấm rồi chuyển lưu lượng qua router và giữ môi trường cũ sẵn sàng đảo ngược tức thì. `Canary Deployment` cho phiên bản mới nhận một phần nhỏ lưu lượng thật (1%–5%), tự động so sánh tỷ lệ lỗi 5xx và p99 của nhóm Canary với nhóm Baseline chạy cùng thời điểm; nếu vượt ngưỡng sai lệch thì tự động rút lưu lượng về 0%. `Feature Flags` tách sâu hơn ở mức logic nghiệp vụ: mã mới đã merge vào nhánh chính và deploy an toàn ở trạng thái tắt, sau đó mới mở dần cho nội bộ -> 5% khách hàng -> toàn bộ mà không cần redeploy.',
    whenToUseVi: [
      'Triển khai dịch vụ lưu lượng cao cần giới hạn phạm vi ảnh hưởng của lỗi logic hoặc suy giảm hiệu năng chưa lộ ra ở môi trường Staging.',
      'Dùng Feature Flag làm công tắc ngắt nhanh (Operational Kill Switch) cho các tích hợp mới hoặc thuật toán xếp hạng mới.',
    ],
    tradeoffsVi: [
      'Blue-Green tốn gấp đôi tài nguyên tính toán trong thời gian chuyển giao; Canary đòi hỏi cả hai phiên bản mã nguồn cùng chạy chung trên một lược đồ Database tương thích ngược.',
      'Feature Flags nếu không dọn dẹp sau khi đã phát hành 100% ổn định sẽ để lại các nhánh điều kiện cũ tích tụ thành nợ kỹ thuật khó kiểm thử.',
    ],
    failureModeVi:
      'Chạy Canary 1% chỉ trong 60 giây vào lúc rạng sáng ít lưu lượng: kích thước mẫu quá nhỏ không đủ ý nghĩa thống kê để phát hiện lỗi, đến khi mở lên 100% vào giờ hành chính mới bùng phát sự cố.',
    configSnippet: `# Lộ trình Progressive Delivery có cổng kiểm tra SLI tự động:
Stage 1: 1% traffic  (15 min, min 500 reqs) -> Check error_rate <= baseline + 0.2% & p99 <= 250ms
Stage 2: 10% traffic (15 min)               -> Automated Gate Check
Stage 3: 50% -> 100%                        |  Bất kỳ bước nào vi phạm SLO -> Instant Rollback 0%`,
  },
  {
    id: 'sd_expand_migrate_contract',
    term: 'Zero-Downtime Schema Migration (Expand-Migrate-Contract)',
    aliases: ['Expand-Migrate-Contract', 'Parallel Change', 'Strangler Fig'],
    category: 'security-shipping',
    glossaryKind: 'concept',
    difficulty: 'Intermediate',
    relatedModules: ['S6-12', 'S5-01', 'S2-08'],
    relatedPatternIds: ['sd_canary_feature_flags', 'sd_leader_follower_replication'],
    shortVi:
      'Thay đổi cấu trúc Database hoặc tách dịch vụ qua 3 giai đoạn tương thích ngược liên tiếp (Mở rộng -> Chuyển đổi kép -> Thu gọn) để phiên bản code cũ và mới chạy song song không gián đoạn.',
    shortEn:
      'Evolves database schemas or migrates legacy modules across three backward-compatible phases without downtime.',
    mechanismVi:
      'Trong lúc Rolling Update hoặc Canary, luôn tồn tại thời điểm cả Pod `v1` (mã cũ) và Pod `v2` (mã mới) cùng đọc/ghi vào một Database. Nếu chạy lệnh `ALTER TABLE RENAME COLUMN full_name TO first_name` một bước, toàn bộ Pod `v1` lập tức lỗi hàng loạt. Quy trình **Expand-Migrate-Contract** chia làm 3 đợt phát hành: (1) **Expand**: thêm cột mới cho phép `NULL` (không khóa bảng lâu, dùng `CREATE INDEX CONCURRENTLY`); (2) **Migrate**: deploy code ghi đồng thời cả cột cũ lẫn cột mới, chạy batch backfill theo từng lô nhỏ cho dữ liệu cũ rồi chuyển đường đọc sang cột mới; (3) **Contract**: khi 100% Pod cũ đã ngừng hẳn và ổn định, mới xóa bỏ mã ghi kép và cột cũ. Tương tự ở mức kiến trúc dịch vụ, mẫu **Strangler Fig** dùng Gateway chuyển dần từng nhóm đường dẫn từ Monolith sang dịch vụ mới.',
    whenToUseVi: [
      'Đổi tên cột, tách bảng, đổi kiểu dữ liệu hoặc thêm ràng buộc `NOT NULL` trên bảng Production đang phục vụ trực tuyến 24/7.',
      'Di chuyển từng miền nghiệp vụ từ hệ thống Monolith lâu năm sang dịch vụ mới an toàn, có đường lùi ở mỗi chặng.',
    ],
    tradeoffsVi: [
      'Một thay đổi cấu trúc đơn giản cần 2–3 lần PR/deploy nối tiếp thay vì xong ngay trong 1 commit.',
      'Trong giai đoạn chuyển tiếp cần duy trì logic ghi kép (dual-write trong cùng bảng/giao dịch) và theo dõi tiến độ backfill.',
    ],
    failureModeVi:
      'Thêm cột mới kèm `DEFAULT` nặng (trên các phiên bản DB cũ phải viết lại toàn bảng) hoặc tạo index thiếu `CONCURRENTLY` giữ khóa `ACCESS EXCLUSIVE` trên bảng 100 triệu dòng suốt 15 phút làm treo đứng toàn bộ truy vấn ứng dụng.',
    configSnippet: `Phase 1 (Expand):   ALTER TABLE users ADD COLUMN phone_e164 TEXT NULL; -- Metadata-only, <10ms
Phase 2 (Migrate):  App v2 dual-writes (phone, phone_e164) + Batched Backfill (LIMIT 1000 sleep 50ms)
Phase 3 (Contract): App v3 chỉ dùng phone_e164 -> Sau khi ổn định mới DROP COLUMN phone;`,
  },
  {
    id: 'sd_multi_region_active_active',
    term: 'Multi-Region Active-Passive vs Active-Active',
    aliases: ['Multi-Region', 'Active-Active', 'Active-Passive', 'Geo-Routing'],
    category: 'security-shipping',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S5-06', 'S3-09'],
    relatedPatternIds: ['sd_cap_pacelc', 'sd_crdt', 'sd_spof_redundancy'],
    shortVi:
      'Triển khai hệ thống trải qua nhiều vùng địa lý cách xa nhau để giảm độ trễ toàn cầu và chịu đựng sự cố mất cả một vùng Cloud, cân nhắc giữa một vùng ghi chính (Active-Passive) hay ghi cục bộ đa vùng (Active-Active).',
    shortEn:
      'Spans distant cloud regions for low global latency and regional disaster recovery via single-writer failover or multi-writer partitioning.',
    mechanismVi:
      'Khoảng cách vật lý khóa tốc độ ánh sáng trong cáp quang (RTT giữa Mỹ và Đông Nam Á ~180–220 ms). Trong mô hình **Active-Passive** (hoặc Read-Local / Write-Global), người dùng toàn cầu đọc nhanh từ Replica/Cache tại vùng gần nhất nhưng thao tác ghi chuyển tiếp về vùng Primary duy nhất (hoặc vùng phụ ở chế độ chờ ấm sẵn sàng tiếp quản DNS/Anycast khi vùng chính mất kết nối). Trong mô hình **Active-Active**, mỗi vùng đều tự nhận cả đọc lẫn ghi cục bộ: hoặc bằng cách gắn cố định từng người dùng vào vùng quê hương (`Geo-Partitioning / Home Region` để tránh đụng độ), hoặc chấp nhận ghi đồng thời cùng khóa kèm cơ chế hợp nhất xung đột (`CRDT` / `HLC`).',
    whenToUseVi: [
      'Sản phẩm phục vụ người dùng trên nhiều châu lục cần độ trễ tương tác thấp hoặc yêu cầu pháp lý lưu trữ dữ liệu theo biên giới quốc gia (Data Residency).',
      'Hệ thống trọng yếu đòi hỏi tiếp tục vận hành khi cả một Region của nhà cung cấp đám mây gặp sự cố diện rộng.',
    ],
    tradeoffsVi: [
      'Ghi đồng bộ xuyên lục địa (Global Strong Consistency như Spanner/CockroachDB multi-region quorum) đảm bảo `RPO = 0` không xung đột nhưng mỗi lượt ghi tốn 100–200 ms RTT.',
      'Chi phí băng thông truyền dữ liệu liên vùng (Cross-Region Data Transfer) và vận hành hạ tầng nhân đôi/nhân ba rất lớn.',
    ],
    failureModeVi:
      'Tự động kích hoạt DNS Failover đa vùng dựa trên một tín hiệu thăm dò đơn lẻ bị đứt mạng cục bộ, dẫn tới cả hai vùng cùng tự thăng cấp làm Primary nhận ghi độc lập gây lệch dữ liệu nghiêm trọng (Regional Split-Brain).',
    configSnippet: `• Geo-Pinned Active-Active: User_EU ghi tại eu-central-1, User_APAC ghi tại ap-southeast-1 (0 conflict)
• Global Quorum CP:         Write commit chờ 2/3 regions -> RPO = 0, Write Latency ≈ 120..180ms
• Async Active-Passive:     Local Write ~5ms -> Async cross-region stream (RPO ~1..5s khi failover)`,
  },
  {
    id: 'sd_chaos_blast_radius',
    term: 'Chaos Engineering, Fault Injection & Blast Radius',
    aliases: ['Chaos Engineering', 'Blast Radius', 'Fault Injection', 'Cell-Based Architecture'],
    category: 'security-shipping',
    glossaryKind: 'concept',
    difficulty: 'Advanced',
    relatedModules: ['S6-05', 'S6-06'],
    relatedPatternIds: ['sd_bulkhead_isolation', 'sd_graceful_degradation', 'sd_circuit_breaker'],
    shortVi:
      'Chủ động tiêm lỗi có kiểm soát để kiểm chứng thực tế các cơ chế chịu lỗi trước khi sự cố thật xảy ra, kết hợp kiến trúc chia ô (Cell-Based) để khóa chặt phạm vi ảnh hưởng tối đa (Blast Radius).',
    shortEn:
      'Proactively verifies resilience hypotheses via controlled fault injection while bounding maximum fault impact (blast radius) with cells.',
    mechanismVi:
      'Một cơ chế failover, timeout hay circuit breaker chưa từng được kích hoạt trong điều kiện thực tế rất dễ chứa lỗi cấu hình ẩn. Chaos Engineering thực hiện theo chu trình khoa học: (1) Định nghĩa trạng thái ổn định qua chỉ số kinh doanh/SLI; (2) Nêu giả thuyết "Nếu dịch vụ X trễ thêm 800 ms hoặc AZ-1 mất kết nối, tỷ lệ đặt hàng thành công vẫn đạt ≥ 99.5%"; (3) Tiêm lỗi với phạm vi ảnh hưởng nhỏ nhất (**Minimal Blast Radius**, ví dụ 1% lưu lượng hoặc 1 Cell thử nghiệm) kèm nút dừng khẩn cấp tự động. Ở quy mô lớn, **Cell-Based Architecture** đóng gói hệ thống thành K cụm khép kín độc lập (mỗi Cell phục vụ 5%–10% khách hàng) để ngay cả sự cố nghiêm trọng nhất cũng không bao giờ lan vượt quá 1 Cell.',
    whenToUseVi: [
      'Tổ chức diễn tập định kỳ (GameDay) trên Staging hoặc phân đoạn nhỏ Production để kiểm chứng runbook, cảnh báo và cơ chế Graceful Degradation.',
      'Áp dụng Cell-Based Architecture khi cụm đơn lẻ quá lớn khiến bất kỳ lỗi cấu hình toàn cục nào cũng ảnh hưởng 100% khách hàng.',
    ],
    tradeoffsVi: [
      'Chỉ nên chạy Chaos trên Production khi hệ thống đã có nền tảng Observability vững chắc, cảnh báo chuẩn và cơ chế tự dừng thí nghiệm tức thì.',
      'Kiến trúc chia nhiều Cell làm giảm kích thước sự cố tối đa xuống `1/K` nhưng tăng chi phí vận hành tự động hóa và lớp định tuyến Cell Router.',
    ],
    failureModeVi:
      'Chạy thử nghiệm tiêm lỗi trực tiếp trên Production mà không giới hạn phạm vi đối tượng (Blast Radius = 100%) hoặc không có điều kiện tự động hủy thí nghiệm (`Automated Abort`) ngay khi SLI chạm ngưỡng vi phạm.',
    configSnippet: `# Quy trình thực nghiệm Chaos an toàn:
1. Steady State:  checkout_success_rate >= 99.8% & p99 <= 300ms
2. Fault Inject:  Inject +600ms latency vào fraud-svc cho 2% traffic (header x-chaos-cohort=canary)
3. Abort Rule:    Dừng ngay lập tức nếu error_rate > 0.5% trong 30 giây`,
  },
];

export const SD_COMMAND_PALETTE_GLOSSARY: {
  id: string;
  term: string;
  shortSummary: string;
}[] = SD_ATLAS_PATTERNS.map((p) => ({
  id: p.id,
  term: p.term,
  shortSummary: p.shortVi,
}));

const CATEGORY_LABEL_BY_ID: Record<SdAtlasCategoryId, string> = SD_ATLAS_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = cat.labelVi;
    return acc;
  },
  {} as Record<SdAtlasCategoryId, string>
);

export const MAPPED_SD_GLOSSARY_TERMS: GlossaryTerm[] = SD_ATLAS_PATTERNS.map((p) => ({
  id: p.id,
  term: p.term,
  aliases: Array.from(new Set(p.aliases.filter((a) => a.trim().length >= 3))),
  category: p.glossaryKind ?? 'concept',
  level: SD_PATTERN_LEVEL_TO_SKILL[p.difficulty],
  stageId: 'stage-7',
  shortSummary: p.shortVi,
  detailedExplanation: p.mechanismVi,
  analogy: `[${CATEGORY_LABEL_BY_ID[p.category]} · Bài ${p.relatedModules.join(', ')}] Khi áp dụng: ${p.whenToUseVi[0]} Đánh đổi chính: ${p.tradeoffsVi[0]}`,
  syntaxExample: p.configSnippet,
  commonGotcha: p.failureModeVi,
  relatedTerms: p.relatedPatternIds ?? [],
}));
