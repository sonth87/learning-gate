import { CicdLesson } from '../types/cicd.types';

export const LESSONS_STAGE_0_TO_1: CicdLesson[] = [
  {
    id: 'cicd-L0-six-pillars-overview',
    stageId: 'cicd-stage-0',
    order: 1,
    title: '0. Bản đồ Tổng quan: Lộ trình 6 Công nghệ Trụ cột Hạ tầng & Hệ thống Phân tán',
    shortTitle: '0. Bản đồ 6 Công nghệ Trụ cột',
    level: 'fundamental',
    estimatedMinutes: 15,
    pdfRef: 'Mục 0 — Trang 1 / 21',
    summary:
      'Để thiết kế, triển khai và vận hành các hệ thống phần mềm hiện đại với khả năng chịu tải và độ sẵn sàng cao, kỹ sư cần làm chủ 6 công nghệ có tính liên kết chặt chẽ: CI/CD, Docker, Redis, RabbitMQ, Kafka và Kubernetes.',
    keyObjectives: [
      'Hiểu vị trí "đường ống nhạc trưởng" của Chuyên đề 1 (CI/CD) kết nối mã nguồn với 5 trụ cột hạ tầng phía sau.',
      'Nắm rõ vai trò kiến trúc và trọng tâm từ Cơ bản đến Nâng cao của từng công nghệ trong chuỗi 6 chuyên đề.',
      'Hình dung luồng đi của một dòng code từ lúc lập trình viên gõ lệnh git push cho đến khi chạy trên cụm Kubernetes với Redis, RabbitMQ và Kafka.',
    ],
    svgBlueprint: 'svg-six-pillars',
    theorySections: [
      {
        heading: '1. Tại sao Kỹ sư Hệ thống cần làm chủ đồng bộ 6 Công nghệ Trụ cột?',
        body: 'Trong kiến trúc phần mềm hiện đại (Cloud-Native & Distributed Systems), không một công nghệ đơn lẻ nào giải quyết được toàn bộ bài toán từ phát triển đến vận hành chịu tải cao. Tài liệu mở đầu bằng Chuyên đề 1 (CI/CD) vì đây chính là đường ống tự động hóa kết nối mã nguồn của lập trình viên với toàn bộ hạ tầng Container (Docker), Bộ nhớ đệm (Redis), Hàng đợi tin nhắn (RabbitMQ), Luồng sự kiện (Kafka) và Cụm điều phối (Kubernetes) phía sau.',
        bulletPoints: [
          '1. CI/CD (Tài liệu này): Tự động hóa kiểm thử, kiểm tra bảo mật (DevSecOps), đóng gói và phân phối phần mềm. Trọng tâm: Pipeline Architecture, Runner/Executor, Caching vs. Artifacts, DAG, DevSecOps (Gitleaks/SAST/Trivy), OIDC, Blue-Green/Canary, GitOps (ArgoCD) & DB Migration.',
          '2. Docker: Đóng gói ứng dụng và môi trường chạy thành đơn vị Container chuẩn hóa. Trọng tâm: Namespaces/Cgroups, UnionFS, Multi-stage Build, Distroless/Alpine, Layer Caching, Networking, Volumes, Rootless Container & Security Hardening.',
          '3. Redis: Lưu trữ In-Memory tốc độ cao, Caching, Distributed Lock, Pub/Sub. Trọng tâm: Cấu trúc dữ liệu, Single-threaded Event Loop, RDB vs. AOF, Eviction Policies, Cache Stampede/Penetration/Avalanche, Sentinel, Cluster & Redlock.',
          '4. RabbitMQ: Message Broker định tuyến linh hoạt (Smart Broker / Dumb Consumer). Trọng tâm: AMQP 0-9-1, Exchanges (Direct, Topic, Fanout, Headers), ACK/NACK, Prefetch Count, Dead Letter Exchange (DLX), Delayed Queue & Quorum Queues.',
          '5. Kafka: Event Streaming phân tán thông lượng lớn (Dumb Broker / Smart Consumer). Trọng tâm: Topics, Partitions, Offset, Consumer Group Rebalance, Zero-Copy, Pagecache, ISR & acks, Idempotent Producer, Transactional Outbox & Exactly-Once.',
          '6. Kubernetes (K8s): Điều phối Container tự động: Tự phục hồi, Co giãn và Quản lý vòng đời. Trọng tâm: Control Plane & Node, Pod Lifecycle, Probes (Liveness/Readiness/Startup), Services/Ingress, ConfigMap/Secret, HPA/VPA, StatefulSet & Helm.',
        ],
      },
      {
        heading: '2. Mối liên kết hữu cơ giữa CI/CD và 5 Trụ cột còn lại',
        body: 'Khi bạn thiết kế một Pipeline CI/CD thực chiến, cả 5 công nghệ kia đều xuất hiện trực tiếp bên trong hoặc ở đích đến của đường ống: CI Runner khởi tạo Service Containers (PostgreSQL, Redis, RabbitMQ) để chạy Integration Test thật; dùng Docker Multi-stage Build để đóng gói Image siêu nhẹ; chạy Database Migration tương thích ngược; và cuối cùng đồng bộ trạng thái lên cụm Kubernetes qua ArgoCD (GitOps).',
      },
    ],
    visualAnalogy: {
      title: 'Tổ hợp Nhà máy Sản xuất & Vận tải Thông minh',
      realWorldScenario:
        'Hãy tưởng tượng một tập đoàn sản xuất công nghệ cao từ khâu thiết kế bản vẽ cho đến khi phân phối sản phẩm tới hàng triệu khách hàng:',
      mappingPoints: [
        {
          realWorld: 'Dây chuyền lắp ráp & Kiểm định tự động (Robot QC)',
          cicdEquivalent: '1. CI/CD Pipeline (GitHub Actions / GitLab CI / ArgoCD)',
          explanation: 'Tự động kiểm tra chất lượng bản vẽ (Lint/SAST), lắp ráp thử nghiệm (Build/Test) và vận chuyển ra cảng.',
        },
        {
          realWorld: 'Thùng Container tiêu chuẩn quốc tế ISO',
          cicdEquivalent: '2. Docker Container (Multi-stage, Alpine/Distroless)',
          explanation: 'Đóng gói hàng hóa đồng nhất để đặt lên bất kỳ tàu biển hay xe tải nào cũng chạy giống hệt nhau.',
        },
        {
          realWorld: 'Quầy lấy hàng siêu tốc ngay cửa kho & Tổng đài điều phối đơn',
          cicdEquivalent: '3. Redis (In-Memory Cache) + 4. RabbitMQ + 5. Kafka',
          explanation: 'Redis phản hồi dưới 1ms; RabbitMQ định tuyến tác vụ linh hoạt; Kafka lưu vết hàng triệu sự kiện thời gian thực.',
        },
        {
          realWorld: 'Hệ thống Cảng biển tự động hóa điều phối đội tàu',
          cicdEquivalent: '6. Kubernetes (Control Plane, Pods, Probes, HPA)',
          explanation: 'Tự động thay thế tàu hỏng (Self-healing), tăng thêm tàu khi cao điểm (Autoscaling) và điều hướng luồng khách (Ingress).',
        },
      ],
      mentalModelTip:
        'CI/CD là "xương sống tự động hóa": Nếu CI/CD yếu, dù kiến trúc K8s hay Kafka có xịn đến đâu thì mỗi lần cập nhật code vẫn sẽ gây sập hệ thống (Downtime) hoặc lọt lỗ hổng bảo mật lên Production.',
    },
    diagrams: [
      {
        id: 'diag-six-pillars-flow',
        title: 'Luồng Liên kết 6 Công nghệ Trụ cột trong Hệ thống Thực tế',
        subtitle: 'Bấm vào từng trụ cột để xem vai trò và các kỹ thuật cốt lõi từ Cơ bản đến Nâng cao',
        type: 'pipeline',
        svgBlueprint: 'svg-six-pillars',
        nodes: [
          {
            id: 'p1-cicd',
            badge: 'Chuyên đề 1',
            title: 'CI/CD Architecture',
            subtitle: 'Pipeline, DAG, DevSecOps, GitOps',
            detail:
              'Tự động hóa kiểm thử, quét bảo mật 5 lớp (Gitleaks/Semgrep/Trivy), xác thực OIDC không mật khẩu, điều phối Blue-Green/Canary và GitOps (ArgoCD) cùng Expand-and-Contract DB Migration.',
            highlightColor: 'emerald',
          },
          {
            id: 'p2-docker',
            badge: 'Chuyên đề 2',
            title: 'Docker Container',
            subtitle: 'Multi-stage, Layer Cache, Rootless',
            detail:
              'Đóng gói ứng dụng chuẩn hóa bằng Namespaces/Cgroups và UnionFS. Trong CI/CD, kỹ thuật Multi-stage Build + dumb-init + Non-root user giúp giảm Image từ 1GB xuống ~80MB và chuyển tiếp đúng tín hiệu SIGTERM.',
            highlightColor: 'sky',
          },
          {
            id: 'p3-data-messaging',
            badge: 'Chuyên đề 3, 4, 5',
            title: 'Redis • RabbitMQ • Kafka',
            subtitle: 'Cache, Smart Broker & Event Stream',
            detail:
              'Bộ 3 xử lý dữ liệu và bất đồng bộ: Redis (Single-threaded Event Loop, Redlock), RabbitMQ (AMQP 0-9-1, DLX, Quorum Queues) và Kafka (Zero-Copy, ISR, Transactional Outbox, Exactly-Once).',
            highlightColor: 'amber',
          },
          {
            id: 'p6-k8s',
            badge: 'Chuyên đề 6',
            title: 'Kubernetes (K8s)',
            subtitle: 'Probes, RollingUpdate, HPA, Helm',
            detail:
              'Đích đến của CD Pipeline: Quản lý vòng đời Pod với Readiness/Liveness/Startup Probes, preStop Hook, HPA/VPA tự động co giãn và đóng gói cấu hình qua Helm / Kustomize.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Bảng 0.1 (PDF Trang 1): 6 công nghệ trụ cột tạo nên nền tảng Kỹ sư Hạ tầng & Hệ thống Phân tán.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L0-pillar-integration',
        title: 'Sự hội tụ của 6 Công nghệ ngay trong một tệp cấu hình CI/CD',
        language: 'yaml',
        description:
          'Đoạn trích minh họa cách một Pipeline CI/CD (Trụ cột 1) khởi chạy Service Containers Redis & RabbitMQ (Trụ cột 3 & 4), đóng gói Docker Image (Trụ cột 2) và cập nhật Helm Chart cho Kubernetes (Trụ cột 6):',
        code: `jobs:
  integration-and-package:
    runs-on: ubuntu-24.04
    services:
      redis:
        image: redis:7-alpine       # [Trụ cột 3] In-Memory Cache thật cho Integration Test
        ports: ["6379:6379"]
      rabbitmq:
        image: rabbitmq:3.13-alpine # [Trụ cột 4] Message Broker AMQP thật
        ports: ["5672:5672"]
    steps:
      - uses: actions/checkout@v4
      - name: Run Integration Tests against Real Redis & RabbitMQ
        run: npm ci && npm run test:integration
      - name: Build Multi-stage Docker Image # [Trụ cột 2]
        run: docker build --target runner -t registry.io/order-svc:\${{ github.sha }} .
      - name: Update K8s GitOps Manifest     # [Trụ cột 6]
        run: ./scripts/update-argocd-image-tag.sh \${{ github.sha }}`,
        outputOrImpact: 'Kết nối liền mạch từ kiểm thử tích hợp đa dịch vụ đến đóng gói Container và triển khai Kubernetes.',
        annotations: [
          { line: 4, explanation: 'Khởi tạo các dịch vụ hạ tầng phụ trợ (Redis, RabbitMQ) bằng Container thật ngay trong CI Runner.' },
          { line: 14, explanation: 'Đóng gói bản dựng Production bằng Docker Multi-stage Build gắn mã băm Commit SHA bất biến.' },
          { line: 16, explanation: 'Cập nhật tag Image mới vào kho GitOps để ArgoCD bên trong cụm Kubernetes tự động kéo (Pull) về.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Vai trò trong Hệ sinh thái 6 Trụ cột',
        githubActionsWay: 'Kết nối chặt với GitHub PR, AI Review (CodeRabbit) & Cloud OIDC (AWS/GCP).',
        gitlabCiWay: 'Nền tảng All-in-One DevSecOps tích hợp sẵn Container Registry, Environments & K8s Agent.',
        architecturalNote: 'Dù chọn công cụ nào, nguyên lý thiết kế Pipeline, Docker Layer Caching, DevSecOps và Zero-Downtime K8s đều giống nhau 100%.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L0-1',
        title: 'Học rời rạc từng công nghệ mà không thấy điểm giao thoa',
        severity: 'warning',
        symptom: 'Viết code chạy tốt trên máy cá nhân, đóng gói Docker xong nhưng khi CI/CD đẩy lên Kubernetes lại bị lỗi 502 Bad Gateway hoặc mất kết nối Redis/DB.',
        whyItHappens: 'Thiếu sự phối hợp giữa Dockerfile (ENTRYPOINT), mã nguồn (SIGTERM handler) và cấu hình Kubernetes (Readiness Probe + preStop Hook).',
        wrongConfig: `# Chỉ quan tâm viết script build đơn giản, bỏ mặc hạ tầng phía sau
CMD "npm start"`,
        rightConfig: `# Phối hợp đồng bộ Docker + App + K8s
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]`,
        fixExplanation: 'Luôn tư duy theo luồng End-to-End: một thay đổi ở Dockerfile sẽ tác động trực tiếp đến hành vi Graceful Shutdown của Pod trên Kubernetes.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L0-dora',
        title: 'Tác động của Kiến trúc CI/CD Chuẩn mực lên Hiệu suất Đội ngũ (DORA Elite)',
        claim: 'Hệ thống áp dụng đồng bộ CI/CD tự động + Container hóa + GitOps giúp tăng tốc độ phát hành gấp hàng chục lần đồng thời giảm mạnh tỷ lệ lỗi.',
        methodology: 'Đối chiếu giữa quy trình Deploy thủ công truyền thống (SSH & chạy script) và kiến trúc CI/CD + GitOps hiện đại.',
        metrics: [
          {
            label: 'Thời gian đưa 1 commit lên Production (Lead Time)',
            valueText: '< 30 phút (Elite) vs. 2 tuần (Thủ công)',
            barPercent: 92,
            isOptimal: true,
            note: 'Nhờ tự động hóa toàn bộ Lint, Test Sharding, Security Scan và GitOps Sync.',
          },
          {
            label: 'Thời gian khôi phục khi sự cố (MTTR)',
            valueText: '< 1 phút (Blue-Green/Argo Rollback) vs. 4 giờ',
            barPercent: 96,
            isOptimal: true,
            note: 'Chuyển mạch tức thì tại Load Balancer hoặc git revert trên GitOps repo.',
          },
        ],
        takeaway: 'Làm chủ Chuyên đề 1 (CI/CD) là chìa khóa mở ra năng lực vận hành toàn bộ 5 công nghệ hạ tầng còn lại.',
      },
    ],
    bestPractices: [
      'Luôn nhìn nhận CI/CD là một phần của kiến trúc hệ thống (System Architecture), không chỉ là vài dòng script bash.',
      'Mọi thay đổi hạ tầng, cấu hình mạng, Database schema và quy trình build đều phải được định nghĩa bằng mã nguồn (Everything-as-Code).',
    ],
    relatedSimulators: [
      {
        label: 'Mở Giả lập Đường ống CI/CD Sống động',
        targetTab: 'simulator',
      },
    ],
  },
  {
    id: 'cicd-L1-1-ci-delivery-deployment',
    stageId: 'cicd-stage-1',
    order: 2,
    title: '1.1. Phân biệt Bản chất: Continuous Integration, Continuous Delivery và Continuous Deployment',
    shortTitle: '1.1. CI vs. Delivery vs. Deployment',
    level: 'fundamental',
    estimatedMinutes: 20,
    pdfRef: 'Mục 1.1 & Hình 1.1 — Trang 2 / 21',
    summary:
      'Thuật ngữ "CI/CD" thường được nhắc đến như một cụm từ đơn lẻ, nhưng trong kiến trúc hệ thống, nó bao gồm 3 cấp độ tự động hóa với ranh giới kỹ thuật rất rõ ràng.',
    keyObjectives: [
      'Phân biệt chính xác mục tiêu và ranh giới kỹ thuật của Continuous Integration (CI), Continuous Delivery (CD) và Continuous Deployment (CD).',
      'Nắm vững sơ đồ chuỗi giá trị Hình 1.1 từ Git Commit đến Production và vòng lặp phản hồi tự động (Telemetry & Auto-Rollback).',
      'Hiểu tại sao Continuous Delivery dừng lại ở Manual Approval Gate trong khi Continuous Deployment tự động 100%.',
    ],
    svgBlueprint: 'svg-ci-delivery-deployment',
    theorySections: [
      {
        heading: '1. Ba cấp độ tự động hóa trong thuật ngữ "CI/CD"',
        body: 'Trong thực tế phỏng vấn và thiết kế hệ thống, rất nhiều lập trình viên nhầm lẫn chữ "CD" chỉ có một nghĩa. Thực chất, chữ "CD" đại diện cho hai cấp độ trưởng thành khác nhau:',
        bulletPoints: [
          'Continuous Integration (CI — Tích hợp liên tục): Quy trình các lập trình viên hợp nhất (merge) mã nguồn vào nhánh chung (main hoặc develop) nhiều lần mỗi ngày. Mỗi lần đẩy code lên, hệ thống tự động biên dịch (Build), kiểm tra quy chuẩn code (Linting) và chạy kiểm thử tự động (Unit/Integration Test). Mục tiêu cốt lõi là phát hiện lỗi sớm nhất có thể (Fail Fast) và loại bỏ tình trạng xung đột diện rộng ("Merge Hell") khi ghép code muộn.',
          'Continuous Delivery (CD — Chuyển giao liên tục): Nối tiếp CI, mã nguồn sau khi vượt qua mọi bài kiểm thử sẽ tự động được đóng gói thành bản dựng hoàn chỉnh (Docker Image/Artifact) và tự động triển khai lên môi trường Staging/UAT. Tuy nhiên, để đưa lên môi trường Production cần một bước bấm nút phê duyệt thủ công (Manual Approval Gate) từ người có thẩm quyền (Tech Lead / Release Manager).',
          'Continuous Deployment (CD — Triển khai liên tục): Cấp độ tự động hóa cao nhất. Mọi commit vượt qua toàn bộ chuỗi kiểm thử tự động trên Pipeline sẽ tự động đi thẳng lên môi trường Production mà không cần con người can thiệp. Mô hình này đòi hỏi độ phủ kiểm thử cao, giám sát thời gian thực (Observability) và cơ chế tự động hoàn tác (Auto-Rollback).',
        ],
      },
      {
        heading: '2. Phân tích Sơ đồ Chuỗi giá trị Hình 1.1 (PDF Trang 2)',
        body: 'Chuỗi giá trị CI/CD chia làm 2 giai đoạn lớn kèm một vòng lặp phản hồi khép kín: Giai đoạn 1 (Continuous Integration) gồm [1. Git Commit: Push / Merge PR] → [2. Verify & Test: Lint / Unit / SAST] → [3. Package: Docker / Artifact]. Giai đoạn 2 (Continuous Delivery vs. Deployment) gồm [4. Staging Env: Integration / E2E] → Rẽ nhánh tại cổng kiểm soát (Delivery: Duyệt tay Manual Gate vs. Deployment: Tự động 100%) → [5. Production: Live Release]. Từ Production luôn có một đường phản hồi ngược về bước 1 (Vòng lặp phản hồi tự động: Test Reports, Security Alerts, Telemetry & Auto-Rollback).',
      },
    ],
    visualAnalogy: {
      title: 'Dây chuyền Chế biến Thực phẩm & Cổng Xuất xưởng',
      realWorldScenario:
        'Hãy so sánh việc phát hành phần mềm với một nhà máy sản xuất sữa tươi tiệt trùng:',
      mappingPoints: [
        {
          realWorld: 'Kiểm định nguyên liệu & Pha chế tự động mỗi giờ',
          cicdEquivalent: 'Continuous Integration (CI)',
          explanation: 'Mỗi mẻ sữa mới đưa vào đều được máy tự động đo độ sạch (Lint), kiểm tra vi sinh (Unit Test) và đóng hộp (Package). Nếu hỏng báo động ngay (Fail Fast).',
        },
        {
          realWorld: 'Xếp sẵn lên kho xuất hàng, chờ Quản đốc ký lệnh mới mở cổng xe tải',
          cicdEquivalent: 'Continuous Delivery (Manual Approval Gate)',
          explanation: 'Mọi hộp sữa đã đóng thùng hoàn hảo ở kho Staging, sẵn sàng 100%, nhưng cần 1 cú bấm nút phê duyệt của Quản đốc để xuất ra siêu thị (Production).',
        },
        {
          realWorld: 'Băng chuyền tự động chạy thẳng từ nhà máy ra kệ siêu thị kèm cảm biến thu hồi tự động',
          cicdEquivalent: 'Continuous Deployment (Full Auto + Auto-Rollback)',
          explanation: 'Không cần ai bấm nút. Hễ qua trạm kiểm định là tự động lên kệ Production. Nếu cảm biến nhiệt độ phát hiện bất thường, băng chuyền tự động rút lô hàng về ngay.',
        },
      ],
      mentalModelTip:
        'Continuous Delivery = "Luôn sẵn sàng lên Production bất cứ lúc nào (nhưng quyết định bấm nút là của con người)". Continuous Deployment = "Vượt qua bài test là tự động lên Production ngay lập tức".',
    },
    diagrams: [
      {
        id: 'diag-hinh-1-1',
        title: 'Hình 1.1: Chuỗi giá trị từ Continuous Integration đến Continuous Delivery / Continuous Deployment',
        subtitle: 'Tái hiện nguyên bản sơ đồ Hình 1.1 (PDF Trang 2) — Bấm vào từng bước để xem cơ chế kỹ thuật',
        type: 'pipeline',
        svgBlueprint: 'svg-ci-delivery-deployment',
        nodes: [
          {
            id: 'step-1-commit',
            badge: 'Bước 1 (CI)',
            title: '1. Git Commit',
            subtitle: 'Push / Merge PR',
            detail:
              'Lập trình viên đẩy commit lên nhánh feature/* hoặc hợp nhất vào main. Webhook kích hoạt Pipeline ngay lập tức.',
            highlightColor: 'sky',
          },
          {
            id: 'step-2-verify',
            badge: 'Bước 2 (CI)',
            title: '2. Verify & Test',
            subtitle: 'Lint / Unit / SAST',
            detail:
              'Kiểm tra quy chuẩn code (ESLint/Ruff), kiểm tra kiểu tĩnh (Typecheck), chạy Unit Test và quét mã tĩnh tìm lỗ hổng bảo mật (SAST). Phát hiện lỗi sớm nhất (Fail Fast).',
            highlightColor: 'emerald',
          },
          {
            id: 'step-3-package',
            badge: 'Bước 3 (CI)',
            title: '3. Package',
            subtitle: 'Docker / Artifact',
            detail:
              'Biên dịch mã nguồn và đóng gói thành đơn vị bất biến (Docker Image gắn tag SHA của commit hoặc gói Artifact dist/).',
            highlightColor: 'amber',
          },
          {
            id: 'step-4-staging',
            badge: 'Bước 4 (CD)',
            title: '4. Staging Env',
            subtitle: 'Integration / E2E',
            detail:
              'Tự động triển khai bản dựng lên môi trường Staging/UAT để chạy kiểm thử tích hợp E2E và Smoke Test thực tế.',
            highlightColor: 'violet',
          },
          {
            id: 'step-5-gate-prod',
            badge: 'Bước 5 (CD → Prod)',
            title: '5. Gate & Production',
            subtitle: 'Manual Gate vs. Auto Release',
            detail:
              'Điểm phân ranh giới: Continuous Delivery dừng chờ bấm nút duyệt tay (Manual Approval Gate), còn Continuous Deployment đi thẳng lên Production Live Release kèm vòng lặp Auto-Rollback.',
            highlightColor: 'rose',
          },
        ],
        caption: 'Hình 1.1 (PDF Trang 2): Vòng lặp phản hồi tự động kết nối Production ngược về Git Commit qua Telemetry & Auto-Rollback.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L1-1-delivery-vs-deployment',
        title: 'Đối chiếu Cấu hình: Continuous Delivery (Duyệt tay) vs. Continuous Deployment (Tự động)',
        language: 'yaml',
        description:
          'Trên GitLab CI, chỉ một thuộc tính when: manual trong khối rules sẽ quyết định đường ống của bạn là Continuous Delivery hay Continuous Deployment:',
        code: `# --- TRƯỜNG HỢP A: CONTINUOUS DELIVERY (Có chốt phê duyệt thủ công) ---
deploy_prod_delivery:
  stage: deploy_prod
  needs: ["deploy_staging"]
  environment: { name: production, url: https://app.vn }
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual          # Dừng lại ở trạng thái Blocked/Waiting chờ Tech Lead bấm Play
      allow_failure: false  # Bắt buộc phải duyệt thì Pipeline mới tính là hoàn tất

# --- TRƯỜNG HỢP B: CONTINUOUS DEPLOYMENT (Tự động 100% lên Production) ---
deploy_prod_deployment:
  stage: deploy_prod
  needs: ["deploy_staging", "e2e_smoke_test"]
  environment: { name: production, url: https://app.vn }
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: on_success      # Tự động chạy ngay lập tức khi Staging & E2E Test vừa Pass!`,
        outputOrImpact: 'Ranh giới kỹ thuật rõ ràng giữa when: manual (Delivery) và when: on_success (Deployment).',
        annotations: [
          { line: 8, explanation: 'when: manual tạo ra Manual Approval Gate — đặc trưng cốt lõi của Continuous Delivery.' },
          { line: 9, explanation: 'allow_failure: false chặn đứng các bước phía sau cho đến khi có người có thẩm quyền bấm nút Approve.' },
          { line: 18, explanation: 'when: on_success đưa commit thẳng lên Production không cần con người can thiệp (Continuous Deployment).' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Cách tạo Manual Approval Gate (Continuous Delivery)',
        githubActionsWay: 'Cấu hình GitHub Environments (Settings → Environments → production → Required reviewers) và gắn environment: production vào Job.',
        gitlabCiWay: 'Dùng rules: [{ when: manual, allow_failure: false }] kết hợp Protected Environments trên GitLab.',
        githubSnippet: `deploy-prod:\n  environment: production # Tự động dừng chờ Required Reviewers duyệt`,
        gitlabSnippet: `deploy-prod:\n  rules: [{ if: '$CI_COMMIT_BRANCH == "main"', when: manual, allow_failure: false }]`,
        architecturalNote: 'Trong các tổ chức Tài chính/Ngân hàng (PCI-DSS, SOC2), bắt buộc dùng Continuous Delivery để đảm bảo nguyên tắc Phân tách nhiệm vụ (Segregation of Duties).',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L1-1-1',
        title: 'Bật Continuous Deployment (Full Auto) khi chưa có Smoke Test & Auto-Rollback',
        severity: 'critical',
        symptom: 'Một commit chứa lỗi cấu hình biến môi trường vượt qua Unit Test và tự động đẩy thẳng lên Production lúc nửa đêm làm sập toàn bộ hệ thống.',
        whyItHappens: 'Unit Test thường dùng Mock nên không phát hiện được lỗi kết nối thực tế hoặc lỗi khởi động HTTP Server.',
        wrongConfig: `script:
  - ./scripts/deploy-prod.sh # Đẩy xong coi như thành công, không kiểm tra sức khỏe!`,
        rightConfig: `script:
  - ./scripts/deploy-prod.sh
  - curl --fail --retry 5 --retry-delay 3 https://api.company.com/health || ./scripts/rollback.sh`,
        fixExplanation: 'Muốn tiến lên Continuous Deployment, bắt buộc phải có Post-Deploy Smoke Test (/health) và kịch bản tự động Rollback khi phát hiện lỗi.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L1-1',
        title: 'Mức độ Rủi ro khi Hợp nhất Code (Merge) theo Tần suất CI',
        claim: 'Hợp nhất code hàng ngày (Continuous Integration) giảm hơn 85% thời gian giải quyết xung đột (Merge Conflict) so với giữ nhánh riêng nhiều tuần.',
        methodology: 'Đo lường thời gian review và sửa lỗi xung đột khi merge PR theo độ tuổi của nhánh.',
        metrics: [
          {
            label: 'Merge hàng ngày (Trunk-based / CI chuẩn)',
            valueText: '~5 phút review, 0 conflict lớn',
            barPercent: 95,
            isOptimal: true,
            note: 'Phát hiện lệch logic ngay ở vài chục dòng code đầu tiên.',
          },
          {
            label: 'Giữ nhánh feature 3 tuần mới Merge',
            valueText: '2–3 ngày gỡ conflict & re-test',
            barPercent: 20,
            isOptimal: false,
            note: 'Hàng nghìn dòng code va chạm nhau gây hiệu ứng dây chuyền.',
          },
        ],
        takeaway: 'CI không chỉ là công cụ chạy test tự động, mà là kỷ luật ghép code nhỏ và liên tục mỗi ngày.',
      },
    ],
    bestPractices: [
      'Luôn bắt đầu bằng việc xây dựng CI vững chắc + Continuous Delivery lên Staging trước khi cân nhắc Continuous Deployment.',
      'Với các hệ thống Core Banking, Thanh toán, Y tế (chịu chuẩn PCI-DSS, SOC2, ISO 27001), luôn giữ Manual Approval Gate (Continuous Delivery) ở bước Production.',
    ],
  },
  {
    id: 'cicd-L1-2-six-core-components',
    stageId: 'cicd-stage-1',
    order: 3,
    title: '1.2. Sáu Thành phần Kiến trúc Cốt lõi của Mọi Công cụ CI/CD',
    shortTitle: '1.2. Sáu Thành phần Cốt lõi',
    level: 'fundamental',
    estimatedMinutes: 25,
    pdfRef: 'Mục 1.2 — Trang 2 & 3 / 21',
    summary:
      'Dù sử dụng GitLab CI, GitHub Actions, Jenkins, CircleCI hay Azure Pipelines, bản chất kiến trúc của chúng đều xoay quanh 6 thực thể chuẩn: Trigger, Pipeline/Workflow, Stage, Job, Step và Runner/Agent.',
    keyObjectives: [
      'Hiểu bản chất kỹ thuật, cơ chế vận hành và nguyên tắc thiết kế thực tế của từng thành phần trong 6 thực thể chuẩn.',
      'Nắm rõ sự cô lập giữa các Job (Ephemeral Environment — không chia sẻ ổ cứng) so với các Step trong cùng một Job (chia sẻ RAM, CPU và $WORKSPACE).',
      'Nắm nguyên tắc bảo mật sống còn đối với Self-hosted Runner khi xử lý Pull Request từ kho Fork lạ.',
    ],
    svgBlueprint: 'svg-six-core-entities',
    theorySections: [
      {
        heading: '1. Phân tích Chi tiết 6 Thực thể Chuẩn (Bảng 1.2 — PDF Trang 2 & 3)',
        body: 'Khi chuyển đổi giữa GitHub Actions, GitLab CI hay Jenkins, bạn không cần học vẹt lại từ đầu nếu nắm vững 6 thành phần kiến trúc bất biến sau:',
        bulletPoints: [
          '1. Trigger (Bộ kích hoạt): Sự kiện khởi chạy Pipeline như push, pull_request, tag, schedule (Cronjob định kỳ), hoặc workflow_dispatch / API Webhook. Nguyên tắc thiết kế: Phân tầng Trigger — ở PR chỉ chạy Lint + Unit Test nhanh; chỉ chạy Full E2E Suite khi merge vào nhánh chính.',
          '2. Pipeline / Workflow: Quy trình tổng thể được định nghĩa bằng mã nguồn (Pipeline-as-Code, như .gitlab-ci.yml hoặc .github/workflows/*.yml). Nguyên tắc thiết kế: Lưu trữ chung kho Git với ứng dụng để kiểm soát phiên bản và áp dụng quy trình Code Review cho cả file CI.',
          '3. Stage (Giai đoạn): Nhóm logic các tác vụ theo thứ tự tuần tự (ví dụ: validate → test → build → security → deploy). Nguyên tắc thiết kế: Nếu một Stage thất bại, các Stage đứng sau tự động dừng ngay để tiết kiệm tài nguyên tính toán.',
          '4. Job (Tác vụ độc lập): Đơn vị thực thi độc lập trong một Stage. Mặc định các Job cùng một Stage chạy song song (Parallel) trên các máy/Container tách biệt. Nguyên tắc thiết kế: Mỗi Job khởi chạy trên một môi trường sạch (Ephemeral Environment), không tự chia sẻ ổ cứng với Job khác.',
          '5. Step (Bước lệnh): Các câu lệnh Shell hoặc Action nhỏ chạy tuần tự bên trong cùng một Job (cùng chia sẻ RAM, CPU và thư mục $WORKSPACE). Nguyên tắc thiết kế: Mọi lệnh trả về mã thoát khác 0 (exit code != 0) sẽ lập tức đánh dấu Step đó thất bại và dừng Job.',
          '6. Runner / Agent: Máy chủ hoặc Container trực tiếp nhận lệnh từ CI Server để chạy Job, gồm Managed/Shared Runner và Self-hosted Runner. Nguyên tắc thiết kế: Tuyệt đối không cho phép Pull Request từ kho Fork lạ chạy trên Self-hosted Runner nằm trong mạng nội bộ.',
        ],
      },
      {
        heading: '2. Điểm khác biệt sống còn giữa Job và Step (Tại sao file vừa build ở Job A lại biến mất ở Job B?)',
        body: 'Đây là bẫy phổ biến nhất với người mới: Các Step nằm trong cùng 1 Job thì chạy tuần tự trên cùng một Container nên Step 2 đọc được thư mục node_modules hoặc dist/ do Step 1 tạo ra. Ngược lại, Job 1 và Job 2 chạy trên 2 máy ảo/Container hoàn toàn độc lập (Ephemeral Environment) và bị xóa sạch ngay khi Job kết thúc. Muốn truyền dữ liệu giữa các Job, bắt buộc phải dùng Cache hoặc Artifact.',
      },
    ],
    visualAnalogy: {
      title: 'Tòa soạn Báo chí Tự động',
      realWorldScenario:
        'Hãy hình dung quy trình xuất bản một tờ báo điện tử mỗi khi phóng viên gửi bài:',
      mappingPoints: [
        {
          realWorld: 'Chuông báo có bài viết mới gửi về (Trigger)',
          cicdEquivalent: '1. Trigger (push, pull_request, schedule)',
          explanation: 'Sự kiện đánh thức toàn bộ dây chuyền biên tập hoạt động.',
        },
        {
          realWorld: 'Sổ tay quy trình xuất bản chuẩn của tòa soạn (Pipeline) & Các phòng ban tuần tự (Stages)',
          cicdEquivalent: '2. Pipeline (.yml) & 3. Stage (validate → test → deploy)',
          explanation: 'Bài viết phải qua phòng Chính tả xong mới được sang phòng Kiểm chứng và phòng Xuất bản.',
        },
        {
          realWorld: 'Các biên tập viên làm việc song song trong các phòng kín riêng biệt (Jobs)',
          cicdEquivalent: '4. Job (Chạy song song trên Ephemeral Container độc lập)',
          explanation: 'Mỗi biên tập viên ngồi một phòng riêng (không dùng chung bàn làm việc/ổ cứng).',
        },
        {
          realWorld: 'Danh sách gạch đầu dòng công việc của 1 biên tập viên trên bàn mình (Steps) & Bản thân người thực hiện (Runner)',
          cicdEquivalent: '5. Step (Chia sẻ $WORKSPACE, dừng khi exit != 0) & 6. Runner/Agent',
          explanation: 'Trên cùng 1 bàn làm việc ($WORKSPACE), các bước diễn ra tuần tự từng bước một.',
        },
      ],
      mentalModelTip:
        'Nhớ quy tắc: "Khác Job = Khác Máy (Không chung ổ cứng, chạy song song). Cùng Job khác Step = Cùng Máy (Chung $WORKSPACE, chạy tuần tự, dừng ngay nếu exit code != 0)".',
    },
    diagrams: [
      {
        id: 'diag-six-entities',
        title: 'Cấu trúc Phân cấp 6 Thực thể Cốt lõi của Hệ thống CI/CD',
        subtitle: 'Từ sự kiện Trigger bên ngoài đến từng dòng lệnh Step bên trong Container của Runner',
        type: 'architecture-layers',
        svgBlueprint: 'svg-six-core-entities',
        nodes: [
          {
            id: 'ent-1-trigger',
            badge: '1. Trigger',
            title: 'Bộ kích hoạt (push, pull_request, tag, schedule)',
            subtitle: 'Phân tầng: PR chạy nhanh | Main chạy Full Suite',
            detail:
              'Khởi nguồn của mọi lần chạy. Thiết kế chuẩn là lọc theo sự kiện và đường dẫn để không lãng phí tài nguyên Runner.',
            highlightColor: 'amber',
          },
          {
            id: 'ent-2-pipeline',
            badge: '2. Pipeline / Workflow',
            title: 'Định nghĩa Pipeline-as-Code (.gitlab-ci.yml / .github/workflows/*.yml)',
            subtitle: 'Version-controlled chung kho Git với ứng dụng',
            detail:
              'Lưu trữ ngay trong kho Git giúp mọi thay đổi quy trình build/deploy đều được theo dõi lịch sử và bắt buộc qua Code Review.',
            highlightColor: 'sky',
          },
          {
            id: 'ent-3-stage',
            badge: '3. Stage',
            title: 'Giai đoạn Tuần tự (validate → test → build → security → deploy)',
            subtitle: 'Chốt chặn tuần tự: Stage trước lỗi thì Stage sau hủy ngay',
            detail:
              'Đặt các Stage nhẹ và dễ lỗi (như validate/lint) lên đầu tiên để áp dụng nguyên lý Fail-Fast, bảo vệ tài nguyên tính toán.',
            highlightColor: 'emerald',
          },
          {
            id: 'ent-4-job',
            badge: '4. Job',
            title: 'Tác vụ Độc lập (Chạy song song trên Ephemeral Environment)',
            subtitle: 'Môi trường sạch, không chia sẻ ổ cứng với Job khác',
            detail:
              'Mỗi Job được cấp phát một VM/Container mới tinh. Muốn truyền thư mục dist/ từ Job Build sang Job Deploy phải dùng Artifact.',
            highlightColor: 'violet',
          },
          {
            id: 'ent-5-6-step-runner',
            badge: '5. Step & 6. Runner',
            title: 'Bước lệnh Tuần tự ($WORKSPACE, exit code != 0) trên Runner/Agent',
            subtitle: 'Managed Runner vs. Self-hosted Runner (Cấm Fork PR lạ)',
            detail:
              'Các Step chia sẻ chung RAM, CPU và $WORKSPACE. Nếu một lệnh trả về exit code != 0, Job dừng ngay lập tức.',
            highlightColor: 'rose',
          },
        ],
        caption: 'Bảng 1.2 (PDF Trang 2–3): Sáu thực thể kiến trúc bất biến trên mọi nền tảng CI/CD.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L1-2-exit-code-and-workspace',
        title: 'Cơ chế $WORKSPACE và Exit Code != 0 bên trong các Step của một Job',
        language: 'yaml',
        description:
          'Minh họa cách các Step trong cùng 1 Job chia sẻ chung thư mục làm việc ($GITHUB_WORKSPACE / $CI_PROJECT_DIR) và dừng ngay khi gặp mã thoát khác 0:',
        code: `jobs:
  demo-job-isolation:
    runs-on: ubuntu-24.04 # [6. Runner] Cấp phát 1 máy ảo Ephemeral sạch
    steps:
      - name: Step 1 - Tạo file trong $WORKSPACE
        run: |
          echo "v1.2.0" > version.txt
          ls -la version.txt

      - name: Step 2 - Đọc file từ Step 1 & Kiểm tra Exit Code
        run: |
          cat version.txt # Đọc được vì Step 1 và Step 2 nằm trong CÙNG 1 Job!
          # Nếu lệnh dưới trả về exit code != 0, Step 2 sẽ FAIL và Step 3 bị hủy ngay
          npm run lint

      - name: Step 3 - Chỉ chạy khi Step 1 & Step 2 trả về exit code 0
        run: echo "Lint thành công, tiếp tục đóng gói!"`,
        outputOrImpact: 'Step 1, 2, 3 dùng chung ổ cứng $WORKSPACE; bất kỳ lệnh nào trả về mã != 0 sẽ dừng đứng Job.',
        annotations: [
          { line: 3, explanation: 'Mỗi Job được khởi tạo trên một Runner mới tinh (Ephemeral Environment).' },
          { line: 7, explanation: 'Step 1 ghi file version.txt vào thư mục $WORKSPACE của Job hiện tại.' },
          { line: 12, explanation: 'Step 2 đọc được trực tiếp version.txt vì cùng chia sẻ RAM, CPU và $WORKSPACE với Step 1.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Ánh xạ 6 Thành phần giữa GitHub Actions và GitLab CI',
        githubActionsWay: 'Workflow (.github/workflows/*.yml) → on: (Trigger) → jobs: (Dùng needs để tạo Stage) → steps: (uses / run) → runs-on: (Runner).',
        gitlabCiWay: 'Pipeline (.gitlab-ci.yml) → rules/only (Trigger) → stages: (Stage tường minh) → job_name: (Job) → script: (Steps) → tags: (Runner).',
        architecturalNote: 'Trên GitHub Actions, khái niệm Stage được thể hiện thông qua chuỗi phụ thuộc needs: [...] giữa các Job.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L1-2-fork-runner',
        title: 'Cho phép Pull Request từ kho Fork lạ chạy trên Self-hosted Runner nội bộ',
        severity: 'critical',
        symptom: 'Kẻ tấn công bên ngoài Fork kho mã nguồn mở hoặc kho public của công ty, sửa file .github/workflows/ci.yml thêm lệnh đánh cắp biến môi trường và quét mạng nội bộ (VPC), rồi mở Pull Request.',
        whyItHappens: 'Khi PR được mở, nếu Self-hosted Runner nằm trong mạng nội bộ nhận chạy Job từ PR đó, đoạn script độc hại của kẻ tấn công sẽ được thực thi ngay bên trong mạng nội bộ công ty!',
        wrongConfig: `# NGUY HIỂM: Dùng self-hosted runner cho mọi pull_request từ bên ngoài
on: [pull_request]
jobs:
  test:
    runs-on: self-hosted`,
        rightConfig: `# AN TOÀN: Chỉ dùng Managed/Ephemeral Cloud Runner cho PR, hoặc khóa quyền chạy workflow từ Fork
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-24.04 # Cô lập hoàn toàn khỏi mạng nội bộ`,
        fixExplanation: 'Nguyên tắc thiết kế thực tế (PDF Trang 3): Tuyệt đối không cho phép Pull Request từ kho Fork lạ chạy trên Self-hosted Runner nằm trong mạng nội bộ.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L1-2-trigger',
        title: 'Hiệu quả Phân tầng Trigger (PR Fast Check vs. Main Full Suite)',
        claim: 'Phân tầng Trigger giúp giảm 70% thời gian chờ phản hồi trên Pull Request và tiết kiệm 60% số phút Runner.',
        methodology: 'So sánh chạy Full E2E Suite trên mọi commit PR so với chỉ chạy Lint + Unit Test trên PR.',
        metrics: [
          {
            label: 'Phân tầng Trigger (PR: Lint + Unit | Main: Full E2E)',
            valueText: '2 phút phản hồi PR',
            barPercent: 90,
            isOptimal: true,
            note: 'Dev nhận kết quả review gần như tức thì.',
          },
          {
            label: 'Chạy Full E2E trên mọi commit PR',
            valueText: '25 phút chờ mỗi lần sửa nhỏ',
            barPercent: 25,
            isOptimal: false,
            note: 'Làm nghẽn hàng đợi Runner của cả công ty.',
          },
        ],
        takeaway: 'Thiết kế Trigger thông minh là bước tối ưu chi phí đầu tiên của mọi kiến trúc sư CI/CD.',
      },
    ],
    bestPractices: [
      'Luôn lưu file cấu hình Pipeline chung kho Git với mã nguồn ứng dụng và áp dụng CODEOWNERS bắt buộc DevSecOps duyệt khi ai đó sửa file CI.',
      'Mỗi Job phải được thiết kế hoàn toàn độc lập (Idempotent & Ephemeral), không phụ thuộc vào trạng thái rác còn sót lại trên máy chủ Runner.',
    ],
  },
  {
    id: 'cicd-L1-3-git-branching-strategies',
    stageId: 'cicd-stage-1',
    order: 4,
    title: '1.3. Chiến lược Phân nhánh Git (Branching Strategies) gắn với CI/CD',
    shortTitle: '1.3. Chiến lược Phân nhánh Git',
    level: 'fundamental',
    estimatedMinutes: 20,
    pdfRef: 'Mục 1.3 — Trang 3 / 21',
    summary:
      'Kiến trúc đường ống CI/CD phụ thuộc trực tiếp vào cách đội ngũ tổ chức nhánh Git: từ GitFlow truyền thống nhiều nhánh dài hạn, GitHub Flow tinh gọn cho đến chuẩn mực hiệu năng cao Trunk-Based Development kết hợp Feature Flags.',
    keyObjectives: [
      'So sánh cấu trúc, ưu nhược điểm và mức độ tương thích CI/CD của GitFlow, GitHub Flow và Trunk-Based Development.',
      'Hiểu tại sao GitFlow gây cản trở CI/CD hiện đại do các nhánh tách rời quá lâu.',
      'Nắm vững cơ chế Feature Flags (Feature Toggles) trong Trunk-Based Development để tách rời hành động Deploy kỹ thuật khỏi hành động Release tính năng.',
    ],
    svgBlueprint: 'svg-git-branching',
    theorySections: [
      {
        heading: '1. Ba Chiến lược Phân nhánh Git điển hình (PDF Trang 3)',
        body: 'Chiến lược phân nhánh quyết định tần suất tích hợp code (CI) và độ phức tạp của luồng triển khai (CD):',
        bulletPoints: [
          'GitFlow (Truyền thống): Duy trì nhiều nhánh dài hạn (main, develop, feature/*, release/*, hotfix/*). Phù hợp với phần mềm đóng gói theo chu kỳ dài (On-premise, Mobile App theo quý), nhưng gây cản trở CI/CD hiện đại vì các nhánh tách rời quá lâu tạo ra xung đột lớn (Merge Hell) khi hợp nhất.',
          'GitHub Flow (Tinh gọn): Chỉ giữ một nhánh chính duy nhất là main luôn ở trạng thái sẵn sàng triển khai. Lập trình viên tách nhánh feature/* ngắn hạn, mở Pull Request để chạy CI, review xong thì merge vào main và triển khai ngay.',
          'Trunk-Based Development (Chuẩn mực CI/CD hiệu năng cao): Các lập trình viên hợp nhất các thay đổi nhỏ trực tiếp vào nhánh main (Trunk) hàng ngày (hoặc qua các nhánh PR cực ngắn chỉ sống vài giờ). Những tính năng lớn chưa hoàn thiện được ẩn sau Feature Flags (Feature Toggles) thay vì nằm trên nhánh riêng suốt nhiều tuần.',
        ],
      },
      {
        heading: '2. Sức mạnh của Feature Flags trong Trunk-Based Development',
        body: 'Câu hỏi kinh điển là: "Nếu tính năng Thanh toán Quốc tế cần 3 tuần mới code xong mà ngày nào cũng merge vào main để deploy lên Production thì khách hàng thấy giao diện làm dở sao?". Câu trả lời chính là Feature Flags: Mã nguồn mới được bọc trong điều kiện if (featureFlags.isEnabled("intl_payment", user)) — nhờ đó code vẫn được tích hợp, kiểm thử và đẩy lên Production hàng ngày mà không hề hiển thị cho người dùng cuối cho đến khi sẵn sàng bật công tắc.',
      },
    ],
    visualAnalogy: {
      title: 'Thi công Đường cao tốc: Đóng đường từng quý vs. Thi công cuốn chiếu từng làn có rào chắn',
      realWorldScenario:
        'Hãy so sánh cách nâng cấp một tuyến đường cao tốc đang hoạt động:',
      mappingPoints: [
        {
          realWorld: 'Xây một con đường phụ tách biệt suốt 6 tháng rồi mới nối vào đường chính (GitFlow)',
          cicdEquivalent: 'GitFlow (main, develop, feature/*, release/*, hotfix/*)',
          explanation: 'Đến ngày nối vào đường chính thì độ cao mặt đường đã lệch nhau hoàn toàn, gây tắc nghẽn nghiêm trọng.',
        },
        {
          realWorld: 'Mở làn rẽ ngắn thi công trong 1–2 ngày rồi nhập làn ngay (GitHub Flow)',
          cicdEquivalent: 'GitHub Flow (main + short-lived feature/* PR)',
          explanation: 'Đơn giản, gọn nhẹ, kiểm định chất lượng ngay tại điểm nhập làn (Pull Request).',
        },
        {
          realWorld: 'Nâng cấp trực tiếp từng mét đường mỗi ngày và đặt biển che tạm (Feature Flags) khi chưa sơn xong',
          cicdEquivalent: 'Trunk-Based Development + Feature Flags',
          explanation: 'Đường chính (main) luôn mới nhất mỗi ngày. Khi nào sơn xong toàn tuyến chỉ cần mở biển che (bật Flag) trong 1 giây!',
        },
      ],
      mentalModelTip:
        'Tách rời "Deployment" (Đưa code lên máy chủ Production) khỏi "Release" (Bật tính năng cho khách hàng dùng) bằng Feature Flags là bí quyết cốt lõi của các đội ngũ đạt chuẩn DORA Elite.',
    },
    diagrams: [
      {
        id: 'diag-branching-compare',
        title: 'Đối chiếu 3 Chiến lược Phân nhánh Git gắn với CI/CD',
        subtitle: 'Sự tiến hóa từ đa nhánh phức tạp sang Trunk-Based Development tốc độ cao',
        type: 'comparison-boxes',
        svgBlueprint: 'svg-git-branching',
        nodes: [
          {
            id: 'br-gitflow',
            badge: 'Truyền thống',
            title: 'GitFlow',
            subtitle: 'main • develop • feature/* • release/* • hotfix/*',
            detail:
              'Duy trì nhiều nhánh dài hạn. Phù hợp phần mềm đóng gói chu kỳ dài nhưng gây cản trở Continuous Integration vì nhánh sống quá lâu tạo xung đột lớn khi ghép code.',
            highlightColor: 'amber',
          },
          {
            id: 'br-githubflow',
            badge: 'Tinh gọn',
            title: 'GitHub Flow',
            subtitle: 'main (luôn sẵn sàng) + feature/* ngắn hạn',
            detail:
              'Chỉ giữ một nhánh chính duy nhất là main. Tách nhánh feature/* ngắn hạn, mở PR chạy CI tự động, review xong thì merge vào main và triển khai ngay.',
            highlightColor: 'sky',
          },
          {
            id: 'br-trunk',
            badge: 'Chuẩn mực Elite',
            title: 'Trunk-Based Development',
            subtitle: 'Merge vào main hàng ngày + Feature Flags',
            detail:
              'Hợp nhất các thay đổi nhỏ vào nhánh main (Trunk) mỗi ngày. Tính năng lớn chưa hoàn thiện được ẩn sau Feature Toggles thay vì tách nhánh riêng nhiều tuần.',
            highlightColor: 'emerald',
          },
        ],
        caption: 'Mục 1.3 (PDF Trang 3): Trunk-Based Development kết hợp Feature Flags là nền tảng để đạt Continuous Deployment.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L1-3-feature-flag',
        title: 'Sử dụng Feature Flag để Merge code vào main hàng ngày (Trunk-Based Development)',
        language: 'typescript',
        description:
          'Cách lập trình viên đẩy code mới lên nhánh main và triển khai lên Production mỗi ngày mà vẫn an toàn tuyệt đối:',
        code: `// src/services/checkoutService.ts
import { featureFlagClient } from '@/infra/unleash';

export async function processCheckout(order: OrderInput, user: UserContext) {
  // Tính năng mới đang phát triển dở (chỉ bật cho nhóm Internal QA hoặc 1% Canary)
  const useNewStripeV3Engine = await featureFlagClient.isEnabled(
    'checkout_stripe_v3_engine',
    { userId: user.id, role: user.role }
  );

  if (useNewStripeV3Engine) {
    return await executeStripeV3Payment(order); // Code mới được CI/CD kiểm thử mỗi ngày
  }

  // Luồng ổn định hiện tại cho 99% khách hàng Production
  return await executeLegacyPayment(order);
}`,
        outputOrImpact: 'Nếu thuật toán mới gặp sự cố trên Production, chỉ cần tắt Feature Flag trên Dashboard trong 1 giây mà không cần đợi build lại Pipeline!',
        annotations: [
          { line: 6, explanation: 'Kiểm tra trạng thái Feature Flag theo ngữ cảnh người dùng (Internal QA, Beta Users, hoặc % lưu lượng).' },
          { line: 12, explanation: 'Nhánh code mới được hợp nhất vào main hàng ngày, giúp CI chạy Lint/Typecheck/Unit Test liên tục.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Cấu hình Trigger theo Chiến lược Nhánh',
        githubActionsWay: 'Với GitHub Flow / Trunk-Based: chỉ cần cấu hình on: push: branches: ["main"] và pull_request: branches: ["main"].',
        gitlabCiWay: 'Sử dụng workflow: rules để chạy Merge Request Pipeline cho nhánh ngắn hạn và Branch Pipeline cho nhánh main.',
        architecturalNote: 'Càng ít nhánh dài hạn, tệp cấu hình YAML của CI/CD càng ngắn gọn, dễ hiểu và ít bị lỗi trùng lặp Pipeline.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L1-3-long-lived-branch',
        title: 'Giữ nhánh feature/* tách rời khỏi main suốt 3–4 tuần',
        severity: 'warning',
        symptom: 'Trên nhánh feature/* bài test CI vẫn báo xanh (Pass), nhưng vừa bấm Merge vào main thì làm gãy toàn bộ nhánh main.',
        whyItHappens: 'Trong 3 tuần đó, nhánh main đã thay đổi cấu trúc bảng Database hoặc chữ ký hàm dùng chung mà nhánh feature/* chưa cập nhật (Semantic Merge Conflict).',
        wrongConfig: `# Để nhánh feature sống độc lập nhiều tuần, chỉ chạy CI trên code cũ của nhánh đó`,
        rightConfig: `# Bật "Require branches to be up to date before merging" (GitHub) hoặc "Merge Trains" (GitLab)
# Kết hợp chia nhỏ tính năng để merge vào main mỗi 1-2 ngày`,
        fixExplanation: 'Kết hợp Trunk-Based Development với tính năng Merge Queue / Merge Trains để CI luôn kiểm thử bản ghép mới nhất với nhánh main.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L1-3-trunk',
        title: 'So sánh Tần suất Triển khai theo Chiến lược Phân nhánh (Báo cáo DORA)',
        claim: 'Các đội ngũ áp dụng Trunk-Based Development có tần suất triển khai (Deployment Frequency) cao gấp 5–10 lần so với GitFlow đa nhánh.',
        methodology: 'Khảo sát DORA State of DevOps trên hàng nghìn tổ chức công nghệ.',
        metrics: [
          {
            label: 'Trunk-Based Development + Feature Flags',
            valueText: 'Nhiều lần mỗi ngày (On-demand)',
            barPercent: 95,
            isOptimal: true,
            note: 'Batch size nhỏ giúp dễ dàng cô lập lỗi và Rollback tức thì.',
          },
          {
            label: 'GitFlow truyền thống (Release branch theo đợt)',
            valueText: '1 lần mỗi 2–4 tuần',
            barPercent: 22,
            isOptimal: false,
            note: 'Mỗi đợt Release chứa hàng trăm commit nên rủi ro lỗi rất cao.',
          },
        ],
        takeaway: 'Giảm kích thước mỗi lần thay đổi (Small Batch Size) thông qua Trunk-Based Development là nền tảng của CI/CD hiện đại.',
      },
    ],
    bestPractices: [
      'Với các dự án Web/Cloud/Microservices mới, ưu tiên chọn GitHub Flow hoặc Trunk-Based Development thay vì GitFlow phức tạp.',
      'Luôn dọn dẹp (xóa) các Feature Flags cũ trong code sau khi tính năng mới đã chạy ổn định 100% trên Production để tránh nợ kỹ thuật.',
    ],
  },
  {
    id: 'cicd-L1-4-full-flow-1-lean-pipeline',
    stageId: 'cicd-stage-1',
    order: 5,
    title: '1.4. Ví dụ Full Luồng (Level 1): Quy trình CI/CD Tinh gọn (Lean Pipeline) từ Kiểm thử Database thật đến Triển khai Staging',
    shortTitle: '1.4. Full Flow #1: Lean Pipeline',
    level: 'basic',
    estimatedMinutes: 30,
    pdfRef: 'Mục 1.4 — Trang 3, 4 & 5 / 21',
    summary:
      'Mổ xẻ chi tiết tệp cấu hình GitHub Actions hoàn chỉnh (.github/workflows/lean-ci-cd.yml): tự động hủy các lần chạy thừa (Concurrency), dựng Container PostgreSQL 16 & Redis 7 thật để chạy Integration Test, đóng gói Artifact và tự động triển khai Staging kèm Smoke Test.',
    keyObjectives: [
      'Hiểu cơ chế khối concurrency và tại sao biểu thức cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }} bảo vệ nhánh main.',
      'Làm chủ kỹ thuật khai báo Service Containers (postgres:16-alpine và redis:7-alpine) kèm cờ --health-cmd pg_isready.',
      'Hiểu luồng truyền sản phẩm biên dịch giữa 2 Job độc lập qua upload-artifact / download-artifact và kiểm tra sức khỏe hậu triển khai bằng curl --fail --retry 5.',
    ],
    svgBlueprint: 'svg-six-core-entities',
    theorySections: [
      {
        heading: '1. Kiến trúc Tổng thể của Full Flow #1 (.github/workflows/lean-ci-cd.yml)',
        body: 'Trong thực tế, nhiều dự án mắc 2 sai lầm ở cấp độ cơ bản: (1) Dùng Mock giả lập Database khi chạy test nên bỏ sót lỗi cú pháp SQL hoặc lỗi Migration, và (2) Khi lập trình viên đẩy 3 commit sửa lỗi chính tả liên tiếp trong 1 phút trên PR thì cả 3 Pipeline cùng chạy gây lãng phí số phút miễn phí của Runner. Full Flow #1 giải quyết triệt để cả hai bài toán này trong một tệp cấu hình tinh gọn gồm 2 Job: verify-and-build và deploy-staging.',
        bulletPoints: [
          'Khối concurrency: Nhóm các lần chạy theo ${{ github.workflow }}-${{ github.ref }}. Biểu thức cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }} đảm bảo chỉ tự động hủy các lần chạy cũ trên nhánh PR, còn khi đã vào nhánh main thì phải chạy trọn vẹn để không làm hỏng quá trình Deploy.',
          'Khối services (postgres, redis): Thay vì dùng Mock giả lập dễ bỏ sót lỗi SQL, CI Runner tự động tải Docker Image của PostgreSQL 16 và Redis 7 về chạy song song với Job. Cờ --health-cmd pg_isready đợi Database khởi động xong rồi mới cho phép bước npx prisma migrate deploy và npm run test:ci chạy. Khi Job kết thúc, 2 container này tự động bị hủy sạch.',
          'Khối upload-artifact & download-artifact: Do 2 Job verify-and-build và deploy-staging chạy trên 2 máy ảo độc lập, ta không biên dịch lại code ở bước Deploy mà đóng gói thư mục dist/ gắn mã băm build-${{ github.sha }} để truyền sang Job Deploy.',
          'Lệnh curl --fail --retry 5 --retry-delay 3 (Smoke Test): Ngay sau khi cập nhật Staging, CI tự động gọi vào cổng /health tối đa 5 lần (mỗi lần cách nhau 3 giây). Nếu ứng dụng trả về mã lỗi HTTP 500/502, lệnh curl --fail sẽ trả về mã thoát khác 0 để báo động đỏ ngay lập tức.',
        ],
      },
      {
        heading: '2. Tại sao phải dùng npm ci thay vì npm install trên CI?',
        body: 'Trong Step 3 của Full Flow #1, ta gọi lệnh npm ci (Clean Install) thay vì npm install. Lệnh npm install có thể tự ý cập nhật phiên bản thư viện mới hơn và sửa lại file package-lock.json, dẫn đến tình trạng code chạy trên CI khác với máy lập trình viên. Ngược lại, npm ci xóa sạch node_modules cũ, cài đặt chính xác 100% phiên bản trong package-lock.json và lập tức báo lỗi (Fail Fast) nếu package.json và package-lock.json bị lệch nhau.',
      },
    ],
    visualAnalogy: {
      title: 'Phòng Thử nghiệm Động cơ Dựng Tạm & Chuyến Xe Giao hàng Niêm phong',
      realWorldScenario:
        'Hãy hình dung cách kiểm định và bàn giao một cỗ máy công nghiệp:',
      mappingPoints: [
        {
          realWorld: 'Hủy bản kiểm định cũ nếu kỹ sư vừa gửi bản vẽ mới hơn sau 10 giây',
          cicdEquivalent: 'concurrency: cancel-in-progress (Trên nhánh PR)',
          explanation: 'Tránh lãng phí phòng thử nghiệm cho các bản nháp đã lỗi thời.',
        },
        {
          realWorld: 'Lắp bình xăng và bình ắc-quy thật vào động cơ để nổ máy thử (rồi tháo dẹp sau khi test)',
          cicdEquivalent: 'services: postgres:16-alpine & redis:7-alpine (--health-cmd pg_isready)',
          explanation: 'Kiểm thử trực tiếp với Database và Cache thật thay vì chỉ mô phỏng trên giấy (Mock).',
        },
        {
          realWorld: 'Đóng thùng niêm phong gắn mã số seri duy nhất gửi sang đội lắp đặt',
          cicdEquivalent: 'upload-artifact / download-artifact (build-${{ github.sha }})',
          explanation: 'Đội lắp đặt (Job deploy-staging) dùng đúng gói hàng đã kiểm định, không tự lắp ráp lại.',
        },
        {
          realWorld: 'Bấm công tắc kiểm tra đèn báo xanh 5 lần sau khi lắp đặt xong',
          cicdEquivalent: 'Smoke Test: curl --fail --retry 5 https://staging.../health',
          explanation: 'Đảm bảo dịch vụ thực sự sống và phản hồi HTTP 200 OK trước khi kết thúc Pipeline.',
        },
      ],
      mentalModelTip:
        'Nguyên tắc "Build Once, Deploy Anywhere": Biên dịch một lần duy nhất ở Job Build, niêm phong bằng mã băm ${{ github.sha }} và truyền qua Artifact/Registry.',
    },
    diagrams: [
      {
        id: 'diag-full-flow-1',
        title: 'Sơ đồ Luồng Thực thi Full Flow #1 (.github/workflows/lean-ci-cd.yml)',
        subtitle: 'Từ kiểm soát Concurrency, khởi tạo Service Containers đến truyền Artifact và Smoke Test Staging',
        type: 'pipeline',
        svgBlueprint: 'svg-six-core-entities',
        nodes: [
          {
            id: 'ff1-concurrency',
            badge: '[1] & [2] Trigger + Concurrency',
            title: 'Lọc Sự kiện & Hủy Lần chạy Thừa',
            subtitle: 'cancel-in-progress trên PR, giữ nguyên trên main',
            detail:
              'Kích hoạt khi push hoặc pull_request vào main. Nếu dev push 3 commit liên tiếp trên PR, tự động hủy 2 lần chạy cũ để tiết kiệm số phút Runner.',
            highlightColor: 'amber',
          },
          {
            id: 'ff1-services',
            badge: '[3] Service Containers',
            title: 'Postgres 16 & Redis 7 Thật',
            subtitle: '--health-cmd pg_isready đợi DB sẵn sàng',
            detail:
              'Khởi chạy song song container postgres:16-alpine (port 5432) và redis:7-alpine (port 6379). Đợi pg_isready trả về OK mới chạy tiếp các Step.',
            highlightColor: 'sky',
          },
          {
            id: 'ff1-verify-build',
            badge: 'Steps 1 → 6',
            title: 'Verify, Integration Test & Upload Artifact',
            subtitle: 'npm ci → lint → prisma migrate → test:ci → build',
            detail:
              'Tự động cache ~/.npm, cài đặt nghiêm ngặt bằng npm ci, chạy Migration + Test thật với Postgres/Redis, đóng gói dist/ và upload artifact build-${{ github.sha }}.',
            highlightColor: 'emerald',
          },
          {
            id: 'ff1-deploy-staging',
            badge: '[4] Job deploy-staging',
            title: 'Download Artifact & Smoke Test',
            subtitle: 'Chỉ chạy khi push vào main + curl --fail --retry 5',
            detail:
              'Tải gói build-${{ github.sha }} về máy ảo mới, chạy deploy-staging.sh và gọi curl --fail --retry 5 vào /health để xác nhận dịch vụ sống.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Full Flow #1 (PDF Trang 4–5): Quy trình CI/CD tinh gọn nhưng đầy đủ các chốt bảo vệ thực chiến.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L1-4-full-flow-1',
        title: 'Full Flow #1: .github/workflows/lean-ci-cd.yml (Nguyên bản từ PDF Trang 4–5)',
        language: 'yaml',
        description:
          'Toàn bộ tệp cấu hình GitHub Actions chuẩn mực cho dự án thực tế với đầy đủ chú thích kỹ thuật:',
        code: `name: Lean CI/CD Pipeline (Verify, Build & Staging Deploy)
# [1] TRIGGERS: Kích hoạt khi đẩy code lên nhánh main hoặc khi mở/cập nhật Pull Request
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

# [2] CONCURRENCY: Nếu dev push 3 commit liên tiếp trong 1 phút trên cùng nhánh PR, tự động hủy 2 lần chạy cũ
concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }} # Chỉ hủy trên PR, không hủy ngang trên nhánh main

jobs:
  verify-and-build:
    runs-on: ubuntu-24.04
    timeout-minutes: 12 # Chặn đứng nếu Job bị treo quá 12 phút để bảo vệ số phút miễn phí của Runner
    # [3] SERVICE CONTAINERS: Khởi tạo DB Postgres 16 và Redis 7 thật đi kèm để chạy Integration Test
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_USER: ci_user, POSTGRES_PASSWORD: ci_pass, POSTGRES_DB: app_test }
        ports: [ "5432:5432" ]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: [ "6379:6379" ]
    steps:
      - name: 1. Checkout Source Code
        uses: actions/checkout@v4
      - name: 2. Setup Node.js 20 & Auto-Cache npm
        uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' } # Tự động cache ~/.npm dựa theo hash của package-lock.json
      - name: 3. Install Dependencies (Strict Lockfile)
        run: npm ci # Cài đặt chính xác 100% theo package-lock.json, báo lỗi nếu lệch phiên bản
      - name: 4. Run Linter, Typecheck & DB Integration Tests
        env:
          DATABASE_URL: postgresql://ci_user:ci_pass@localhost:5432/app_test
          REDIS_URL: redis://localhost:6379
        run: npm run lint && npm run typecheck && npx prisma migrate deploy && npm run test:ci
      - name: 5. Build Production Artifact & Upload
        run: npm run build
      - name: 6. Save Build Bundle for Deploy Job
        uses: actions/upload-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/, retention-days: 7 }

  # [4] DEPLOY STAGING: Chỉ chạy khi code được merge vào nhánh 'main' và bước verify-and-build đã thành công
  deploy-staging:
    needs: [ "verify-and-build" ]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-24.04
    environment: { name: staging, url: https://staging.api.company.com }
    steps:
      - name: Download Verified Build Bundle
        uses: actions/download-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/ }
      - name: Deploy & Run Post-Deploy Smoke Test
        run: ./scripts/deploy-staging.sh && curl --fail --retry 5 --retry-delay 3 https://staging.api.company.com/health`,
        outputOrImpact: 'Tự động hóa hoàn chỉnh từ khâu kiểm thử tích hợp với DB thật đến triển khai Staging và kiểm tra sức khỏe.',
        annotations: [
          { line: 12, explanation: 'Biểu thức github.ref != \'refs/heads/main\' ngăn việc hủy ngang Pipeline khi đang chạy trên nhánh main.' },
          { line: 17, explanation: 'timeout-minutes: 12 bảo vệ tài khoản khỏi các tiến trình bị treo vô hạn (mặc định của GitHub lên tới 360 phút!).' },
          { line: 25, explanation: '--health-cmd pg_isready đảm bảo PostgreSQL đã sẵn sàng nhận kết nối TCP trước khi chạy prisma migrate.' },
          { line: 49, explanation: 'Đóng gói thư mục dist/ gắn mã băm commit SHA để truyền sang Job deploy-staging.' },
          { line: 61, explanation: 'curl --fail trả về exit code != 0 nếu HTTP status là 4xx/5xx, kết hợp --retry 5 chờ ứng dụng khởi động.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Khởi tạo Database thật đi kèm Job (Service Containers)',
        githubActionsWay: 'Khai báo khối services: bên trong Job kèm ports: ["5432:5432"] và options: --health-cmd pg_isready.',
        gitlabCiWay: 'Khai báo danh sách services: - postgres:16-alpine và truy cập qua hostname mặc định postgres:5432.',
        architecturalNote: 'Trên GitHub Actions (chạy trực tiếp trên VM Ubuntu), ta kết nối qua localhost:5432; còn trên GitLab CI Docker Executor, các service được nối mạng qua tên alias (ví dụ postgres:5432).',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L1-4-curl-without-fail',
        title: 'Gọi lệnh curl kiểm tra Smoke Test nhưng quên cờ --fail (-f)',
        severity: 'critical',
        symptom: 'Ứng dụng trên Staging bị lỗi 500 Internal Server Error hoặc 502 Bad Gateway, nhưng bước Smoke Test trên CI vẫn báo màu xanh (Passed)!',
        whyItHappens: 'Mặc định lệnh curl chỉ cần nhận được phản hồi HTTP từ máy chủ (kể cả mã lỗi 500 hay 502) là vẫn trả về exit code 0! Phải truyền cờ --fail (hoặc -f) thì curl mới trả về exit code 22 khi gặp HTTP >= 400.',
        wrongConfig: `run: ./scripts/deploy.sh && curl https://staging.api.company.com/health`,
        rightConfig: `run: ./scripts/deploy.sh && curl --fail --retry 5 --retry-delay 3 https://staging.api.company.com/health`,
        fixExplanation: 'Luôn dùng bộ cờ chuẩn: curl --fail --retry 5 --retry-delay 3 trong mọi kịch bản Smoke Test.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L1-4',
        title: 'Tác động của timeout-minutes và concurrency trên GitHub Actions',
        claim: 'Thiết lập timeout-minutes: 12 và concurrency giúp tiết kiệm trung bình 35% chi phí số phút CI hàng tháng.',
        methodology: 'Thống kê số phút tiêu thụ trước và sau khi bật tự động hủy PR cũ và giới hạn timeout.',
        metrics: [
          {
            label: 'Có Concurrency + timeout-minutes: 12',
            valueText: 'Tiết kiệm ~35% số phút Runner',
            barPercent: 92,
            isOptimal: true,
            note: 'Hủy ngay các lần chạy thừa và chặn đứng tiến trình treo.',
          },
          {
            label: 'Mặc định (Không concurrency, timeout 360 phút)',
            valueText: '1 lần treo test ngốn mất 6 giờ quota!',
            barPercent: 25,
            isOptimal: false,
            note: 'Một bài test chờ input có thể đốt sạch số phút miễn phí cả tháng.',
          },
        ],
        takeaway: 'Luôn khai báo concurrency và timeout-minutes ở mọi Workflow thực tế.',
      },
    ],
    bestPractices: [
      'Luôn đặt timeout-minutes (10–15 phút) cho mọi Job để tránh một bài test bị treo đốt sạch 360 phút mặc định của Runner.',
      'Không bao giờ chạy lại npm run build ở Job Deploy — hãy dùng upload-artifact / download-artifact hoặc Container Image gắn mã SHA.',
    ],
    relatedSimulators: [
      {
        label: 'Chạy thử Full Flow #1 trong Phòng Giả lập CI/CD',
        targetTab: 'simulator',
      },
      {
        label: 'Mở IDE Xem & Tương tác Full Flow #1',
        targetTab: 'blueprints',
        targetId: 'full-flow-1-lean-github-actions',
      },
    ],
  },
];
