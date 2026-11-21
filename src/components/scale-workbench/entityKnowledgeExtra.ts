import type { BilingualText, StageInspectorInfo } from './types';

const bi = (vi: string, en: string): BilingualText => ({ vi, en });

/**
 * Curated deep-dive knowledge base for Redis, Docker/Kubernetes, CI/CD & GitOps, and PMP (PMBOK 8 / ECO 2026)
 * so hovering/clicking ANY block, connector, or pill tag across all 5 apps explains What / How / Why / Tips & Case Study.
 */
export const EXTRA_ENTITY_KNOWLEDGE: Array<{
  match: RegExp;
  info: StageInspectorInfo;
}> = [
  // ===================== REDIS MASTERY =====================
  {
    match: /resp|epoll|kqueue|in-memory|single-thread/i,
    info: {
      title: bi('Redis Event Loop & I/O Multiplexing (RESP)', 'Redis Single-Threaded Event Loop & RESP'),
      kindLabel: bi('Kiến trúc Lõi Redis', 'Core Redis Engine'),
      what: bi(
        'Vòng lặp xử lý lệnh đơn luồng trên RAM kết hợp epoll/kqueue theo dõi hàng chục nghìn kết nối TCP đồng thời.',
        'A single-threaded in-memory command execution loop backed by OS-level epoll/kqueue I/O multiplexing.'
      ),
      how: bi(
        'Redis 8 dùng đa luồng I/O để đọc/phân tích gói giao thức RESP từ socket, sau đó xếp hàng thực thi tuần tự từng lệnh trên RAM trong vài micro-giây mà không cần khóa Mutex.',
        'I/O threads parse incoming RESP frames while a single main thread executes data-structure commands sequentially with zero lock contention.'
      ),
      why: bi(
        'Loại bỏ hoàn toàn chi phí Context Switch và tranh chấp khóa (Lock Contention), đạt >100.000 ops/sec với độ trễ dưới 1ms.',
        'Eliminates lock contention and race conditions inside data structures while sustaining >100k ops/sec at sub-millisecond latency.'
      ),
      tipOrCase: bi(
        'Case Study Production: Chỉ một lệnh O(N) như KEYS * trên 10 triệu key sẽ chặn đứng luồng chính trong vài giây khiến toàn bộ ứng dụng timeout! Luôn thay bằng SCAN và UNLINK (xóa bất đồng bộ).',
        'Production Pitfall: Running O(N) commands like KEYS * freezes the single execution thread for all clients! Always use SCAN and non-blocking UNLINK.'
      ),
    },
  },
  {
    match: /skip list|zset|zadd|leaderboard/i,
    info: {
      title: bi('Sorted Set (ZSet) & Cấu trúc Skip List O(log N)', 'Sorted Set (ZSet) & Skip List'),
      kindLabel: bi('Cấu trúc dữ liệu Redis', 'Redis Data Structure'),
      what: bi(
        'Tập hợp phần tử duy nhất được sắp xếp tự động theo điểm số (score float64), kết hợp bảng băm Dict O(1) và danh sách nhảy nhiều tầng Skip List O(log N).',
        'Dual-indexed structure combining a hash table (member -> score in O(1)) with a multi-level Skip List (ordered range/rank in O(log N)).'
      ),
      how: bi(
        'Khi ZADD cập nhật điểm, Dict kiểm tra sự tồn tại trong O(1) còn Skip List nhảy qua các tầng con trỏ thưa từ cao xuống thấp để chèn đúng thứ tự trong O(log N).',
        'Uses probabilistic express lanes across sorted nodes so range queries (ZRANGE) and rank lookups (ZREVRANK) run in logarithmic time.'
      ),
      why: bi(
        'Nhanh và đơn giản hơn cây cân bằng Red-Black Tree khi duyệt dải phần tử liên tiếp (ZRANGEBYSCORE), lý tưởng cho Bảng xếp hạng thời gian thực và Sliding-Window Rate Limiter.',
        'Outperforms SQL ORDER BY on high-write leaderboards, priority queues, and sliding-window rate limiters.'
      ),
    },
  },
  {
    match: /stream|xadd|xreadgroup|pel|xack|xautoclaim|pub\/sub/i,
    info: {
      title: bi('Redis Streams, Consumer Group & Danh sách PEL', 'Redis Streams, Consumer Groups & PEL'),
      kindLabel: bi('Hàng đợi Sự kiện Bền vững', 'Durable Event Log'),
      what: bi(
        'Nhật ký sự kiện chỉ ghi nối tiếp (Append-only Radix Tree) hỗ trợ chia tải qua Consumer Group và theo dõi tin nhắn chưa xác nhận trong PEL (Pending Entries List).',
        'Append-only persistent log with Consumer Group fan-out, Pending Entries List (PEL), and crash recovery.'
      ),
      how: bi(
        'XREADGROUP giao mỗi sự kiện cho 1 worker và ghi vào PEL; chỉ khi worker xử lý xong và gửi XACK tin nhắn mới rời PEL. Nếu worker sập, XAUTOCLAIM thu hồi tin bị treo sang worker khác.',
        'Delivers messages to group consumers, tracks unacknowledged IDs in PEL until XACK, and reclaims stalled work via XAUTOCLAIM.'
      ),
      why: bi(
        'Khắc phục nhược điểm "bắn rồi quên" (mất tin khi client rớt mạng) của Pub/Sub truyền thống, đảm bảo ngữ nghĩa At-least-once delivery.',
        'Prevents message loss on consumer disconnects (unlike fire-and-forget Pub/Sub) and enables horizontal worker scaling.'
      ),
    },
  },
  {
    match: /stampede|singleflight|cache-aside|penetration|avalanche|bloom/i,
    info: {
      title: bi('Phòng vệ Caching: Cache-Aside, Stampede & Bloom Filter', 'Resilient Caching: Stampede, Penetration & Jitter'),
      kindLabel: bi('Kiến trúc Caching Thực chiến', 'Caching Architecture'),
      what: bi(
        'Tổ hợp kỹ thuật bảo vệ Database phía sau Redis trước 3 sự cố lớn: Cache Stampede (bão hết hạn key nóng), Penetration (truy vấn ID ảo) và Avalanche (hết hạn đồng loạt).',
        'Defensive patterns protecting primary databases from Cache Stampede, Penetration, and synchronized TTL Avalanche.'
      ),
      how: bi(
        'Dùng khóa Singleflight / Mutex để chỉ 1 request xuống DB nạp lại key nóng, gắn Bloom Filter chặn sớm ID không tồn tại ngay tại biên, và cộng TTL Jitter ngẫu nhiên (±10–20%).',
        'Coalesces concurrent misses via Singleflight locks, filters non-existent IDs via Bloom Filter, and staggers expirations with random TTL jitter.'
      ),
      why: bi(
        'Giữ cho Database chính không bị sập dây chuyền vào đúng khoảnh khắc một key trang chủ có 50.000 RPS vừa hết TTL.',
        'Prevents cascading database meltdowns when hot keys expire or malicious bots query random IDs.'
      ),
    },
  },
  {
    match: /16384|crc16|hash slot|hashtag|crossslot|sentinel|psync/i,
    info: {
      title: bi('Phân mảnh 16.384 Hash Slots & High Availability (Sentinel / Cluster)', 'Redis Cluster 16,384 Hash Slots & HA'),
      kindLabel: bi('Hệ thống Phân tán Redis', 'Distributed Sharding & Failover'),
      what: bi(
        'Cơ chế chia ngang không gian khóa thành 16.384 Hash Slots định tuyến bằng CRC16(key) % 16384 trên nhiều cặp Master–Replica.',
        'Horizontal sharding across 16,384 deterministic CRC16 hash slots with automatic Master-Replica failover.'
      ),
      how: bi(
        'Client băm tên key (hoặc phần nằm trong dấu ngoặc nhọn {user:42}) để gửi lệnh thẳng tới đúng nút Master giữ slot đó; Gossip protocol và Quorum bầu chọn Master mới khi nút cũ mất kết nối.',
        'Clients route commands directly to the shard owning CRC16(key) % 16384; hash tags {tag} co-locate related keys onto the same slot.'
      ),
      why: bi(
        'Vượt giới hạn RAM của một máy chủ đơn lẻ và duy trì hoạt động liên tục không gián đoạn khi một node phần cứng gặp sự cố.',
        'Scales RAM/write throughput linearly across nodes while avoiding CROSSSLOT errors via explicit {hashtag} co-location.'
      ),
    },
  },
  {
    match: /rdb|aof|fork|cow|copy-on-write|jemalloc|eviction|lfu|lru/i,
    info: {
      title: bi('Quản trị RAM (jemalloc / LFU) & Bền vững RDB / Hybrid AOF', 'Memory Eviction (LFU) & CoW Persistence'),
      kindLabel: bi('Bộ nhớ & Lưu trữ Bền vững', 'Memory & Persistence'),
      what: bi(
        'Cơ chế cấp phát bộ nhớ chống phân mảnh jemalloc, chính sách giải phóng bộ nhớ Eviction khi đầy RAM (allkeys-lfu) và sao lưu đĩa bằng BGSAVE fork() Copy-on-Write kết hợp AOF.',
        'jemalloc memory management, LFU/LRU eviction policies, and non-blocking RDB/AOF persistence via OS Copy-on-Write.'
      ),
      how: bi(
        'Khi BGSAVE chạy, tiến trình con đọc các trang RAM tĩnh để ghi đĩa trong khi tiến trình cha chỉ nhân bản những trang bộ nhớ thực sự bị ghi đè (Copy-on-Write).',
        'Child process snapshots memory pages via OS Copy-on-Write while main thread continues serving traffic.'
      ),
      why: bi(
        'Đặt trần maxmemory khoảng 65–75% giới hạn container giúp dành đủ Headroom cho trang Copy-on-Write và bộ đệm client, tránh bị Linux OOM Killer giết tiến trình (Exit 137).',
        'Leaving 25–35% RAM headroom prevents OOMKills during high-write BGSAVE/AOF rewrite forks.'
      ),
    },
  },

  // ===================== KUBERNETES & DOCKER MASTERY =====================
  {
    match: /cgroups|namespace|oom|137|multi-stage|layer cache|docker/i,
    info: {
      title: bi('Container Isolation (Namespaces · cgroups) & Multi-stage Image', 'Linux Container Isolation & Multi-Stage Build'),
      kindLabel: bi('Nền tảng Container', 'Container Runtime'),
      what: bi(
        'Container là tiến trình Linux thông thường được cô lập tầm nhìn bằng Namespaces (PID, NET, MNT) và giới hạn tài nguyên cứng bằng cgroups, khởi chạy từ các tầng ảnh bất biến (OverlayFS Layers).',
        'Isolated Linux processes bounded by kernel namespaces and cgroups, packaged as immutable layered OCI images.'
      ),
      how: bi(
        'Dockerfile sắp xếp bước ít đổi (COPY package-lock.json + npm ci) lên trước để tận dụng Layer Cache, sau đó dùng Multi-stage chỉ chép thành phẩm sang image runtime tối giản chạy dưới quyền non-root.',
        'Caches dependency layers separately from source code and strips build toolchains via Multi-stage FROM stages.'
      ),
      why: bi(
        'Giảm kích thước image từ >1 GB xuống <120 MB, thu hẹp bề mặt tấn công CVE và tăng tốc độ kéo ảnh (Image Pull) khi mở rộng Pod.',
        'Cuts image size by 80–90%, eliminates compiler CVEs in production, and speeds up node scaling.'
      ),
      tipOrCase: bi(
        'Chẩn đoán nhanh Exit Code 137: Mã thoát 137 (128 + SIGKILL 9) báo hiệu tiến trình bên trong vượt ngưỡng memory limit của cgroup và bị Linux Kernel OOM Killer buộc dừng ngay lập tức.',
        'Troubleshooting Tip: Exit Code 137 (128 + SIGKILL) means the kernel cgroup OOM Killer terminated your container for exceeding memory.limits.'
      ),
    },
  },
  {
    match: /apiserver|etcd|controller|scheduler|reconcil|desired/i,
    info: {
      title: bi('Kubernetes Control Plane & Vòng lặp Đối soát (Reconciliation Loop)', 'K8s Control Plane & Reconciliation Loop'),
      kindLabel: bi('Bộ não Điều phối Cụm', 'Cluster Control Plane'),
      what: bi(
        'Kiến trúc khai báo trung tâm gồm kube-apiserver (cổng giao tiếp duy nhất), kho trạng thái nhất quán etcd, kube-scheduler và các Controller chạy vòng lặp đối soát liên tục.',
        'Declarative control plane where Controllers continuously drive Current State toward Desired State stored in etcd.'
      ),
      how: bi(
        'Mọi thành phần chỉ nói chuyện qua API Server (Watch stream). Khi phát hiện số Pod thực tế lệch khỏi spec.replicas trong etcd, Controller tự động tạo hoặc thu hồi Pod cho tới khi khớp.',
        'Watches resource specs via API Server and takes corrective actions whenever observed cluster state drifts from desired YAML.'
      ),
      why: bi(
        'Đảm bảo khả năng tự phục hồi (Self-Healing): khi một Node vật lý gặp sự cố, cụm tự động lập lịch lại Pod sang Node khỏe mạnh mà không cần can thiệp thủ công.',
        'Provides automatic self-healing against node crashes and process failures without manual intervention.'
      ),
    },
  },
  {
    match: /deployment|replicaset|rolling|pod|crashloop|imagepull/i,
    info: {
      title: bi('Deployment → ReplicaSet → Pod & Rolling Update Không Gián Đoạn', 'Deployment, ReplicaSet & Zero-Downtime Rollout'),
      kindLabel: bi('Quản lý Workload K8s', 'Workload Controller'),
      what: bi(
        'Chuỗi phân cấp 3 tầng trong đó Deployment quản lý lịch sử phiên bản và điều khiển hai ReplicaSet (cũ/mới) thay thế Pod dần dần.',
        'Three-tier workload hierarchy orchestrating zero-downtime RollingUpdates and instant rollbacks across ReplicaSets.'
      ),
      how: bi(
        'Theo thông số maxSurge và maxUnavailable, K8s bật Pod phiên bản mới lên, đợi vượt qua Readiness Probe nhận lưu lượng êm ái rồi mới gửi SIGTERM tắt Pod cũ.',
        'Scales up the new ReplicaSet, waits for Readiness Probes to pass, and gracefully drains old Pods one batch at a time.'
      ),
      why: bi(
        'Đảm bảo nâng cấp phiên bản sản phẩm hàng chục lần mỗi ngày không rơi bất kỳ request nào và cho phép kubectl rollout undo tức thì nếu bản mới phát sinh lỗi.',
        'Enables safe continuous deployments and 1-command rollbacks if error rates spike.'
      ),
    },
  },
  {
    match: /service|clusterip|coredns|ingress|gateway|endpoint|networkpolicy/i,
    info: {
      title: bi('Định tuyến Mạng K8s: Ingress / Gateway → Service → Endpoints → Pod', 'K8s Networking: Ingress → Service → Pod'),
      kindLabel: bi('Mạng & Cân bằng tải Cụm', 'Cluster Networking'),
      what: bi(
        'Chuỗi định tuyến tách biệt địa chỉ IP ảo ổn định (Service ClusterIP + tên miền CoreDNS) khỏi địa chỉ IP động thường xuyên thay đổi của các Pod.',
        'Decoupled L7/L4 traffic routing from external TLS Ingress through stable Service VIPs to healthy Pod endpoints.'
      ),
      how: bi(
        'Ingress/Gateway xử lý tên miền HTTP & chứng chỉ TLS rồi chuyển tới Service; Service lọc các Pod khớp selector VÀ đã đạt Readiness=True để ghi vào EndpointSlice (kube-proxy / eBPF).',
        'Matches Pod labels + Readiness status to populate EndpointSlices programmed into kernel iptables/IPVS/eBPF.'
      ),
      why: bi(
        'Tránh lỗi 502 Bad Gateway khi Pod khởi động lại hoặc mở rộng quy mô, đồng thời cho phép khóa chặt lưu lượng Đông–Tây bằng NetworkPolicy Zero-Trust.',
        'Eliminates broken hardcoded IPs and prevents traffic from hitting unready or terminating Pods.'
      ),
      tipOrCase: bi(
        'Mẹo bắt bệnh 502/Connection Refused trong 10 giây: Chạy ngay kubectl get endpoints <svc> — nếu danh sách trống rỗng (<none>), 95% là sai lệch nhãn selector.matchLabels hoặc sai cổng targetPort!',
        '10-Second Debug Trick: Run kubectl get endpoints <svc> — if empty, check Service selector labels and container targetPort!'
      ),
    },
  },
  {
    match: /probe|readiness|liveness|startup|hpa|qos|pvc|statefulset/i,
    info: {
      title: bi('Probes Sức Khỏe, Tự Động Co Giãn (HPA) & Lưu Trữ Bền Vững (PVC)', 'Health Probes, HPA Autoscaling & Stateful PVC'),
      kindLabel: bi('Độ tin cậy & Co giãn', 'Reliability & Scaling'),
      what: bi(
        'Hệ thống kiểm tra sinh tồn 3 chốt (Startup · Readiness · Liveness), co giãn số lượng Pod tự động theo tải (HPA) và gắn ổ đĩa mạng bền vững qua PersistentVolumeClaim.',
        'Lifecycle health probes, metrics-driven HorizontalPodAutoscaler, and persistent block/file storage claims.'
      ),
      how: bi(
        'Readiness thất bại chỉ tạm ngắt lưu lượng mạng (không giết Pod); Liveness thất bại mới khởi động lại container; HPA tính toán số bản sao dựa trên tỷ lệ CPU/Memory thực tế chia cho resources.requests.',
        'Readiness gates traffic routing, Liveness restarts deadlocked containers, and HPA scales replicas from resource request utilization.'
      ),
      why: bi(
        'Tách biệt rõ trạng thái "đang bận tải dữ liệu khởi động" với "bị treo cứng Deadlock", tránh vòng lặp tự sát CrashLoopBackOff dây chuyền khi hệ thống chịu tải cao.',
        'Prevents cascading restart storms under heavy load while preserving stateful data across Pod rescheduling.'
      ),
    },
  },

  // ===================== CI/CD & GITOPS MASTERY =====================
  {
    match: /runner|workflow|dag|needs|matrix|artifact|cache|lockfile/i,
    info: {
      title: bi('Đồ thị Pipeline DAG, Ephemeral Runner & Phân tách Cache vs Artifact', 'Pipeline DAG, Ephemeral Runners & Cache'),
      kindLabel: bi('Kiến trúc CI Pipeline', 'CI Pipeline Engine'),
      what: bi(
        'Đồ thị thực thi có hướng không chu trình (DAG) điều phối các Job chạy song song trên máy ảo dùng một lần (Ephemeral Runner), kết hợp Cache Key theo mã băm lockfile.',
        'Directed Acyclic Graph of isolated CI jobs running on clean ephemeral VMs/containers with content-addressed dependency caching.'
      ),
      how: bi(
        'Mỗi Step kiểm tra mã thoát (Exit Code != 0 dừng ngay Fail-fast); Cache lưu thư mục phụ thuộc theo hashFiles(lockfile) giữa các lần chạy, còn Artifact truyền bản dựng đã biên dịch giữa các Job trong cùng 1 lần chạy.',
        'Uses lockfile hashes for cross-run dependency caches and immutable artifacts for inter-job build promotion.'
      ),
      why: bi(
        'Đảm bảo môi trường kiểm thử sạch 100% tái lập được (Reproducible Build) trong khi rút ngắn thời gian phản hồi PR từ 20 phút xuống dưới 3 phút.',
        'Guarantees clean reproducible builds while keeping developer PR feedback loops fast.'
      ),
    },
  },
  {
    match: /oidc|sha|trivy|sast|sbom|devsecops|injection|github_token/i,
    info: {
      title: bi('Bảo mật DevSecOps & Xác thực Cloud với Keyless OIDC', 'DevSecOps Gates & Keyless Cloud OIDC'),
      kindLabel: bi('Bảo mật Chuỗi cung ứng Phần mềm', 'Supply-Chain Security'),
      what: bi(
        'Kiến trúc bảo mật CI/CD Pipeline gồm: quyền tối thiểu GITHUB_TOKEN, ghim Action theo commit SHA 40 ký tự, cổng quét Secret/SAST/SCA/Trivy CVE và cấp phát chứng thực ngắn hạn qua OIDC.',
        'Zero-standing-privilege CI security combining pinned commit SHAs, vulnerability gates, SBOM attestation, and OIDC federation.'
      ),
      how: bi(
        'Thay vì lưu AWS/GCP Secret Key dài hạn trong kho CI, Runner xin JWT ký số từ IdP của GitHub/GitLab đổi lấy đám mây STS Token tự hủy sau 15 phút (ràng buộc chặt theo đúng nhánh/repo).',
        'Exchanges short-lived cryptographic OIDC JWTs with cloud IAM trust policies instead of storing long-lived static secrets.'
      ),
      why: bi(
        'Triệt tiêu nguy cơ lộ khóa đám mây vĩnh viễn, chặn đứng tấn công chuỗi cung ứng qua thẻ tag giả mạo và lỗ hổng Script Injection trong biểu thức ${{ ... }}.',
        'Eliminates leaked static cloud keys, supply-chain tag hijacking, and untrusted PR script injection.'
      ),
    },
  },
  {
    match: /canary|blue-green|argocd|gitops|expand|contract|dora/i,
    info: {
      title: bi('Phát Hành Không Gián Đoạn (Canary / Blue-Green) & Pull-Based GitOps (ArgoCD)', 'Progressive Delivery & Pull-Based GitOps'),
      kindLabel: bi('Triển khai Thực chiến (CD)', 'Continuous Delivery & GitOps'),
      what: bi(
        'Chiến lược dịch chuyển lưu lượng từng phần có kiểm soát (Canary 5% → 25% → 100%) kết hợp mô hình ArgoCD kéo trạng thái chuẩn từ Git về cụm đích.',
        'Progressive traffic shifting (Canary / Blue-Green) paired with pull-based ArgoCD GitOps reconciliation.'
      ),
      how: bi(
        'CI chỉ đóng gói Image bất biến và mở commit cập nhật tag vào kho Git Manifest; ArgoCD bên trong cụm K8s tự kéo thay đổi về đồng bộ, phát hiện lệch cấu hình (Drift) và tự động Rollback nếu tỷ lệ lỗi 5xx vượt ngưỡng.',
        'ArgoCD pulls desired manifests from Git inside the cluster firewall, eliminating cluster admin credentials in external CI runners.'
      ),
      why: bi(
        'Giới hạn bán kính ảnh hưởng sự cố (Blast Radius) xuống vài phần trăm người dùng, giữ nhật ký kiểm toán đầy đủ trên Git và tối ưu 4 chỉ số DORA.',
        'Minimizes deployment blast radius, enforces Git as the single audit source of truth, and prevents breaking DB schema locks via Expand-and-Contract.'
      ),
    },
  },

  // ===================== PMP MASTERY (PMBOK 8 & ECO 2026) =====================
  {
    match: /pmbok|eco|outcome|benefit|mvp|mmf|mindset|assess|analyze/i,
    info: {
      title: bi('Tư duy Chuẩn PMI (PMBOK® 8 & ECO 2026): Phân tích trước & Tối ưu Giá trị', 'PMI Mindset (PMBOK 8 & ECO 2026): Value & Assess First'),
      kindLabel: bi('Nguyên tắc Cốt lõi PMI', 'Core PMI Principle'),
      what: bi(
        'Hệ quy chiếu ra quyết định của Giám đốc Dự án chuyên nghiệp: đánh giá thành công bằng Giá trị & Lợi ích bền vững (Outcome/Benefits) chứ không chỉ bàn giao đủ đầu mục (Output).',
        'PMI decision framework prioritizing holistic value delivery (Outcomes & Benefits) and disciplined impact analysis before action.'
      ),
      how: bi(
        'Khi gặp tình huống bất ngờ trong đề thi PMP: luôn Đánh giá/Xác minh thông tin trước (Assess/Review) → Họp giải quyết trực tiếp cùng nhóm (Collaborate) → Tuân thủ quy trình quản trị; tuyệt đối không leo thang vội lên Sponsor hay sa thải thành viên.',
        'Follows the Golden Reflex: Verify & Assess impact first -> Collaborate face-to-face with the team -> Follow governance; never escalate prematurely or punish individuals.'
      ),
      why: bi(
        'Giúp loại bỏ ngay 2 đáp án bẫy cảm tính đời thực và thích ứng chuẩn xác với đề thi mới ECO 2026 (People 33% · Process 41% · Business Environment tăng mạnh lên 26%).',
        'Separates disciplined Servant/Steward leadership from reactive firefighting across People (33%), Process (41%), and Business Environment (26%).'
      ),
    },
  },
  {
    match: /predictive|iterative|incremental|agile|hybrid|stacey|scrum|dor|dod|wip|kanban/i,
    info: {
      title: bi('Vận hành Thích ứng: Phổ Phát triển, Ranh giới Scrum & Giới hạn WIP Kanban', 'Adaptive Delivery: Agile, Scrum Gates & Kanban WIP'),
      kindLabel: bi('Phương pháp Phát triển Dự án', 'Development Approach'),
      what: bi(
        'Lựa chọn phương pháp tiếp cận theo độ bất định (Predictive · Iterative · Incremental · Agile · Hybrid), ranh giới 3 vai trò Scrum (PO · Developers · SM) và luồng kéo giới hạn WIP.',
        'Tailoring delivery cadence to uncertainty while respecting strict Scrum accountabilities and Little’s Law WIP limits.'
      ),
      how: bi(
        'Product Owner sắp xếp thứ tự ưu tiên Backlog theo giá trị; Developers tự ước lượng & quyết định cách làm kỹ thuật; cổng DoR lọc đầu vào Sprint, AC kiểm từng Story, DoD khóa chuẩn phát hành; WIP Limit ngăn ứ nghẽn cục bộ.',
        'PO owns value ordering, Developers own estimation/execution, SM removes impediments, and WIP caps force finishing work before starting new items.'
      ),
      why: bi(
        'Ngăn chặn cạm bẫy vi quản lý (PM/PO tự áp đặt ước lượng giờ cho nhóm) và giảm mạnh thời gian chu kỳ (Lead Time) theo định luật Little.',
        'Protects team autonomy, prevents multitasking bottlenecks, and delivers working increments early.'
      ),
    },
  },
  {
    match: /charter|ccb|picc|wpd|wpi|wpr|verified|accepted|validate scope|control quality/i,
    info: {
      title: bi('Quản trị Baseline (PICC / CCB), Luồng WPD→WPI→WPR & Chuỗi Nghiệm thu', 'Governance (PICC / CCB) & Deliverable Acceptance Chain'),
      kindLabel: bi('Quản trị Dự án Chuẩn PMI', 'Predictive Governance'),
      what: bi(
        'Khung kiểm soát chính thức từ thẩm quyền Project Charter, cổng duyệt thay đổi tích hợp (PICC/CCB), dòng tinh luyện dữ liệu báo cáo đến quy trình nghiệm thu hai bước.',
        'Formal project authority, Integrated Change Control (CCB), performance reporting, and two-stage quality/scope acceptance.'
      ),
      how: bi(
        'Mọi thay đổi chạm vào Baseline phải đánh giá tác động rồi trình Change Request qua CCB; sản phẩm hoàn thành đi qua Control Quality nội bộ tạo Verified Deliverable rồi mới sang Validate Scope để khách hàng ký nhận Accepted Deliverable.',
        'Routes baseline changes through impact assessment + CCB, and sequences internal Control Quality (Verified) strictly BEFORE client Validate Scope (Accepted).'
      ),
      why: bi(
        'Chặn đứng cả hai tệ nạn Scope Creep (thêm phạm vi không kiểm soát) và Gold Plating (tự ý thêm tính năng thừa không ai yêu cầu).',
        'Prevents uncontrolled Scope Creep, Gold Plating, and unverified handoffs to customers.'
      ),
    },
  },
  {
    match: /cpi|spi|evm|critical path|float|contingency|management reserve|risk|issue|ffp|adkar|first|best/i,
    info: {
      title: bi('Critical Path, EVM (CPI/SPI), Risk vs Issue & Phân tích Câu hỏi PMP', 'Critical Path, EVM, Risk vs Issue & Question Analysis'),
      kindLabel: bi('Kiểm soát Tiến độ, Chi phí & Rủi ro', 'Schedule, Cost, Risk & Exam Strategy'),
      what: bi(
        'Bộ công cụ định lượng sức khỏe dự án (Float=0, CPI=EV/AC, SPI=EV/PV), phân định Quỹ dự phòng / Risk vs Issue và chiến thuật phân tích từ khóa câu hỏi tình huống.',
        'Quantitative health metrics (CPM/EVM), Risk Register vs Issue Log boundaries, and 65-second exam question analysis.'
      ),
      how: bi(
        'Sự kiện chưa xảy ra (Uncertain) quản lý trong Risk Register + quỹ Contingency (PM tự chủ); sự kiện ĐÃ XẢY RA ghi vào Issue Log + hành động khắc phục ngay; rủi ro chưa biết trước (Unknown-Unknowns) phải xin Change Request dùng Management Reserve.',
        'Distinguishes future Risks (Contingency Reserve) from present Issues (Issue Log + Workaround) and Unknown-Unknowns (Management Reserve via CCB).'
      ),
      why: bi(
        'Là chìa khóa giải quyết chính xác các câu hỏi bẫy kinh điển nhất của đề thi PMP trong dưới 65 giây mỗi câu (phân biệt rõ câu hỏi FIRST/NEXT tìm bước đánh giá đầu tiên với câu hỏi BEST tìm giải pháp xử lý gốc rễ).',
        'Cracks the highest-frequency PMP exam traps by matching chronological FIRST actions vs root-cause BEST resolutions.'
      ),
    },
  },
];
