import { CicdLesson } from '../types/cicd.types';

export const LESSONS_STAGE_2_TO_3: CicdLesson[] = [
  {
    id: 'cicd-L2-1-cache-artifact-dag-sharding',
    stageId: 'cicd-stage-2',
    order: 6,
    title: '2.1. Tối ưu hóa Tốc độ: Phân biệt Cache vs. Artifact, Đồ thị DAG và Song song hóa (Test Sharding)',
    shortTitle: '2.1. Cache vs. Artifact, DAG & Sharding',
    level: 'basic',
    estimatedMinutes: 25,
    pdfRef: 'Mục 2.1 — Trang 5 & 6 / 21',
    summary:
      'Khi quy mô dự án tăng lên, việc tải lại hàng Gigabyte thư viện và chờ các Stage chạy tuần tự sẽ làm nghẽn quy trình phát triển. Cấp độ Intermediate giải quyết bài toán hiệu năng qua 3 cơ chế: Cache vs. Artifact, Đồ thị DAG (needs) và Test Sharding (parallel / matrix).',
    keyObjectives: [
      'Phân biệt tuyệt đối mục đích, phạm vi sống và đối tượng lưu trữ của Cache (Across Pipelines) so với Artifact (Within a Pipeline).',
      'Thiết kế Đồ thị phụ thuộc trực tiếp DAG (Directed Acyclic Graph) bằng từ khóa needs: [...] để phá bỏ điểm nghẽn chờ toàn bộ Stage trước.',
      'Chia nhỏ bộ kiểm thử lớn thành N phần chạy đồng thời bằng Test Sharding (parallel: 4 với $CI_NODE_INDEX/$CI_NODE_TOTAL hoặc strategy.matrix).',
    ],
    svgBlueprint: 'svg-cache-vs-artifact-dag',
    theorySections: [
      {
        heading: '1. Phân biệt Bản chất: Cache vs. Artifact (PDF Trang 5)',
        body: 'Rất nhiều lập trình viên dùng nhầm Cache để truyền file build dist/ sang bước Deploy, hoặc dùng Artifact để lưu thư mục node_modules. Dưới đây là ranh giới kỹ thuật chuẩn:',
        bulletPoints: [
          'Cache (Bộ nhớ đệm thư viện — Across Pipelines): Dùng để lưu các thư mục tải về từ Internet (~/.npm, ~/.m2/repository, .venv) nhằm tái sử dụng giữa các lần chạy Pipeline khác nhau (Commit hôm nay dùng lại Cache của Commit hôm qua). Khóa định danh Cache luôn tính theo mã băm của lockfile: hashFiles(\'**/package-lock.json\'). Cache hoạt động theo nguyên lý "Best-effort" (nếu mất Cache thì CI chỉ tải lại từ mạng chứ không làm hỏng tính đúng đắn).',
          'Artifact (Sản phẩm đóng gói — Within a Pipeline): Dùng để lưu kết quả biên dịch (dist/, file .jar, báo cáo junit.xml) để truyền từ Job trước sang Job sau trong cùng một Pipeline (từ Job Build sang Job Deploy) hoặc lưu trữ phục vụ kiểm toán.',
        ],
      },
      {
        heading: '2. Đồ thị Phụ thuộc Trực tiếp DAG (Directed Acyclic Graph) & Test Sharding (PDF Trang 6)',
        body: 'Trong mô hình Stage tuần tự cổ điển, mọi Job ở Stage sau phải đợi Job chậm nhất ở Stage trước hoàn tất. Cơ chế DAG và Test Sharding giải phóng hoàn toàn nút thắt này:',
        bulletPoints: [
          'DAG (Directed Acyclic Graph): Từ khóa needs: [...] cho phép một Job khởi chạy ngay lập tức khi Job tiền điều kiện trực tiếp của nó vừa hoàn thành (hoặc dùng needs: [] với mảng rỗng để Job chạy ngay ở giây thứ 0 mà không cần chờ bước Lint).',
          'Test Sharding & Matrix Strategy: Chia bộ kiểm thử lớn (ví dụ 1.200 bài test tốn 12 phút) thành N phần chạy đồng thời trên N Container song song (parallel: 4 trên GitLab CI truyền --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL hoặc strategy.matrix trên GitHub Actions), rút ngắn thời gian chạy xuống chỉ còn 3 phút.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Kho Nguyên liệu Dùng Chung (Cache) vs. Hộp Thành phẩm Xuất xưởng (Artifact)',
      realWorldScenario:
        'Trong một căn bếp nhà hàng 5 sao phục vụ hàng trăm thực khách mỗi tối:',
      mappingPoints: [
        {
          realWorld: 'Tủ gia vị & Nguyên liệu sơ chế sẵn dùng xuyên suốt từ ca sáng sang ca tối',
          cicdEquivalent: 'Cache (~/.npm, .venv gắn khóa hashFiles(lockfile))',
          explanation: 'Giúp đầu bếp không phải chạy ra chợ mua lại muối tiêu mỗi khi có đơn hàng (Pipeline) mới.',
        },
        {
          realWorld: 'Đĩa món ăn vừa nấu xong đặt lên khay chuyển cho nhân viên bê ra bàn khách',
          cicdEquivalent: 'Artifact (dist/, build-${{ github.sha }}, junit.xml)',
          explanation: 'Sản phẩm của riêng đơn hàng (Pipeline) đó, truyền từ bếp (Job Build) sang bàn ăn (Job Deploy).',
        },
        {
          realWorld: '4 đầu bếp cùng chia nhau thái 4 rổ rau cùng lúc thay vì 1 người thái hết',
          cicdEquivalent: 'Test Sharding (parallel: 4 / --shard=1/4 .. 4/4)',
          explanation: 'Chia 1.200 bài test cho 4 Container độc lập chạy đồng thời, giảm thời gian chờ xuống 1/4.',
        },
      ],
      mentalModelTip:
        'Không bao giờ dùng Cache để truyền thư mục dist/ sang Job Deploy (vì Cache có thể bị ghi đè bởi nhánh khác!). Luôn dùng Artifact gắn mã ${{ github.sha }} cho sản phẩm biên dịch.',
    },
    diagrams: [
      {
        id: 'diag-cache-artifact-dag',
        title: 'Cơ chế Tối ưu Hóa Tốc độ: Cache (pull-push / pull), Artifact & Đồ thị DAG',
        subtitle: 'Bấm vào từng cơ chế để xem cách cắt giảm 75% thời gian chờ đợi của Pipeline',
        type: 'comparison-boxes',
        svgBlueprint: 'svg-cache-vs-artifact-dag',
        nodes: [
          {
            id: 'opt-cache',
            badge: 'Across Pipelines',
            title: '1. Dependency Cache',
            subtitle: '~/.npm, ~/.m2, .venv (Khóa theo Lockfile)',
            detail:
              'Tái sử dụng thư viện tải từ Internet giữa các lần chạy Pipeline khác nhau. Chỉ Job đầu tiên dùng policy: pull-push, các Job sau dùng policy: pull để tiết kiệm 30–60s nén file.',
            highlightColor: 'amber',
          },
          {
            id: 'opt-artifact',
            badge: 'Within a Pipeline',
            title: '2. Build Artifact',
            subtitle: 'dist/, .jar, junit.xml (Truyền giữa các Job)',
            detail:
              'Đóng gói kết quả biên dịch ở Job Build để truyền sang Job Deploy trong cùng 1 Pipeline hoặc lưu báo cáo kiểm toán.',
            highlightColor: 'sky',
          },
          {
            id: 'opt-dag-sharding',
            badge: 'DAG & Parallelism',
            title: '3. Đồ thị DAG & Test Sharding',
            subtitle: 'needs: [...] + parallel: 4 (--shard=1/4)',
            detail:
              'Phá bỏ rào cản chờ tuần tự bằng needs: [] (chạy ngay ở giây thứ 0) và nhân bản Job thành N Container chia nhau chạy bộ kiểm thử lớn.',
            highlightColor: 'emerald',
          },
        ],
        caption: 'Mục 2.1 (PDF Trang 5–6): Ba trụ cột tăng tốc Pipeline trong các dự án quy mô lớn.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L2-1-sharding-matrix',
        title: 'Cấu hình Test Sharding trên cả GitLab CI (parallel: 4) và GitHub Actions (strategy.matrix)',
        language: 'yaml',
        description:
          'Cách chia bộ 1.200 bài kiểm thử Jest/Playwright ra 4 Container chạy song song trên cả hai nền tảng:',
        code: `# --- A. GITLAB CI: Dùng từ khóa 'parallel: 4' tự động cấp biến $CI_NODE_INDEX & $CI_NODE_TOTAL ---
unit_and_integration_test:
  stage: security_and_test
  needs: ["lint_and_warm_cache"] # DAG: Chạy ngay khi bước Lint xong
  parallel: 4                    # Tự động nhân bản thành 4 Container (1/4, 2/4, 3/4, 4/4)
  script:
    - npm ci --cache .npm --prefer-offline
    - npx jest --shard=\$CI_NODE_INDEX/\$CI_NODE_TOTAL --coverage --ci

# --- B. GITHUB ACTIONS: Dùng 'strategy.matrix' để chia 4 luồng tương đương ---
jobs:
  test-sharded:
    runs-on: ubuntu-24.04
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx jest --shard=\${{ matrix.shard }}/4 --ci`,
        outputOrImpact: 'Rút ngắn thời gian chạy bộ kiểm thử từ 12 phút xuống còn đúng 3 phút.',
        annotations: [
          { line: 5, explanation: 'parallel: 4 trên GitLab CI tự động tạo 4 Job con và tiêm sẵn biến $CI_NODE_INDEX (1..4) và $CI_NODE_TOTAL (4).' },
          { line: 8, explanation: 'Cờ --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL giúp Jest/Playwright tự động chia đều danh sách file test không bị trùng lặp.' },
          { line: 17, explanation: 'Trên GitHub Actions, strategy.matrix với mảng shard: [1, 2, 3, 4] đạt hiệu quả tương đương.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Cơ chế Cache & Test Sharding',
        githubActionsWay: 'Dùng actions/cache@v4 (hoặc cache: "npm" trong setup-node) với hashFiles("**/package-lock.json") và strategy.matrix.',
        gitlabCiWay: 'Dùng cache: { key: { files: ["package-lock.json"] }, policy: pull-push | pull } và từ khóa gốc parallel: N.',
        architecturalNote: 'GitLab CI hỗ trợ phân tách rất tinh tế giữa policy: pull-push (đọc + ghi) và policy: pull (chỉ đọc) ngay ở cấp độ từng Job.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L2-1-cache-node-modules',
        title: 'Cache trực tiếp thư mục node_modules thay vì cache thư mục ~/.npm',
        severity: 'warning',
        symptom: 'Khi nâng cấp hoặc chuyển nhánh, các gói C++ Native Addons trong node_modules bị lỗi hoặc việc nén hàng chục nghìn file nhỏ trong node_modules còn chậm hơn cả tải mới.',
        whyItHappens: 'Thư mục node_modules chứa hàng trăm nghìn file nhỏ và symlink phụ thuộc OS. Chuẩn công nghiệp là cache thư mục kho lưu trữ gói đã nén (~/.npm hoặc .npm/) rồi dùng npm ci --prefer-offline để giải nén siêu tốc.',
        wrongConfig: `cache:
  paths: ["node_modules/"] # Chứa hàng vạn file nhỏ, dễ lệch kiến trúc nhị phân`,
        rightConfig: `cache:
  key: { files: ["package-lock.json"] }
  paths: [".npm/"]
script:
  - npm ci --cache .npm --prefer-offline`,
        fixExplanation: 'Luôn cache thư mục ~/.npm (hoặc .npm/) kết hợp npm ci --prefer-offline như trong Full Flow #2 của tài liệu.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L2-1',
        title: 'Thời gian Thực thi Pipeline khi Áp dụng Cache pull-only + DAG + Test Sharding (4x)',
        claim: 'Kết hợp 3 kỹ thuật ở Cấp độ Intermediate giúp cắt giảm 75% tổng thời gian chạy Pipeline.',
        methodology: 'Đo trên dự án Node.js/TypeScript thực tế có 1.200 bài test và 800MB dependencies.',
        metrics: [
          {
            label: 'Cache pull-only + DAG (needs) + Sharding (parallel: 4)',
            valueText: '3 phút 20 giây',
            barPercent: 92,
            isOptimal: true,
            note: 'Chạy song song ngay từ giây thứ 0, không tốn thời gian nén lại Cache ở cuối Job.',
          },
          {
            label: 'Chạy tuần tự truyền thống + Tải lại npm mỗi Job',
            valueText: '16 phút 40 giây',
            barPercent: 20,
            isOptimal: false,
            note: 'Mỗi Job mất 2 phút tải mạng + 12 phút chạy test trên 1 luồng đơn.',
          },
        ],
        takeaway: 'Hiểu sâu Cache policy, DAG và Sharding là bước nhảy vọt từ Junior lên Senior DevOps Engineer.',
      },
    ],
    bestPractices: [
      'Luôn tính khóa Cache dựa trên nội dung file lock (package-lock.json, pnpm-lock.yaml, poetry.lock) thay vì đặt tên tĩnh.',
      'Chỉ cho phép 1 Job đầu tiên cập nhật Cache (policy: pull-push), toàn bộ các Job phía sau chỉ tải về đọc (policy: pull).',
    ],
  },
  {
    id: 'cicd-L2-2-devsecops-and-oidc',
    stageId: 'cicd-stage-2',
    order: 7,
    title: '2.2 & 2.3. Tích hợp Bảo mật vào Đường ống (DevSecOps Shift-Left) & Xác thực Cloud Không mật khẩu với OIDC',
    shortTitle: '2.2. DevSecOps 5 Lớp & OIDC',
    level: 'advanced',
    estimatedMinutes: 25,
    pdfRef: 'Mục 2.2 & 2.3 — Trang 6 / 21',
    summary:
      'Mô hình Shift-Left Security chuyển 5 chốt kiểm soát an ninh (Secret Scanning, SAST, SCA, Container/IaC Scan, DAST) về ngay giai đoạn CI, đồng thời loại bỏ hoàn toàn khóa tĩnh AWS_SECRET_ACCESS_KEY bằng chuẩn xác thực OIDC Federation.',
    keyObjectives: [
      'Nắm vững mục tiêu phát hiện rủi ro và bộ công cụ tiêu chuẩn của 5 lớp quét bảo mật trong DevSecOps (Bảng 2.2).',
      'Hiểu tại sao lưu cặp khóa tĩnh AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY trong CI là lỗ hổng bảo mật lớn.',
      'Làm chủ luồng cấp phát JWT Token ngắn hạn và Temporary Credentials tự hủy sau 15–60 phút của OIDC (OpenID Connect).',
    ],
    svgBlueprint: 'svg-devsecops-oidc',
    theorySections: [
      {
        heading: '1. Năm Lớp Quét Bảo mật trong Mô hình Shift-Left Security (Bảng 2.2 — PDF Trang 6)',
        body: 'Thay vì đợi đến khi ứng dụng đã triển khai lên Production mới mời đội Pentest vào kiểm tra, mô hình Shift-Left Security dịch chuyển 5 lớp phòng thủ tự động về phía bên trái (ngay trong đường ống CI):',
        bulletPoints: [
          '1. Secret Scanning: Phát hiện lập trình viên vô tình đưa AWS Key, DB Password, Private Key, API Token vào lịch sử commit Git. Công cụ tiêu chuẩn: Gitleaks, TruffleHog, GitGuardian.',
          '2. SAST (Static Application Security Testing — Phân tích mã tĩnh): Quét cây cú pháp mã nguồn (AST) để tìm lỗ hổng bảo mật (SQL Injection, XSS, Path Traversal) và lỗi chất lượng code. Công cụ tiêu chuẩn: SonarQube, Semgrep, CodeQL.',
          '3. SCA (Software Composition Analysis — Phân tích thư viện): Kiểm tra các thư viện mã nguồn mở (package-lock.json, pom.xml, go.sum) đối chiếu với danh mục lỗ hổng toàn cầu CVE. Công cụ tiêu chuẩn: Trivy, Snyk, OWASP Dependency-Check.',
          '4. Container & IaC Scan: Quét các gói hệ điều hành trong Docker Image (Alpine/Debian) và lỗi cấu hình bảo mật trong Dockerfile, Kubernetes YAML, Terraform. Công cụ tiêu chuẩn: Trivy, Grype, Checkov, Hadolint.',
          '5. DAST (Dynamic Application Security Testing — Kiểm thử động): Giả lập tấn công hộp đen (Black-box) từ bên ngoài vào ứng dụng đang chạy thử nghiệm trên môi trường Staging. Công cụ tiêu chuẩn: OWASP ZAP, Nuclei.',
        ],
      },
      {
        heading: '2. Xác thực Không mật khẩu với Cloud bằng OIDC (OpenID Connect — Mục 2.3 PDF Trang 6)',
        body: 'Thay vì tạo cặp khóa tĩnh AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY có thời hạn vĩnh viễn rồi lưu vào biến môi trường của CI (rất dễ bị rò rỉ và không tự hết hạn), chuẩn công nghiệp hiện nay là dùng OIDC Federation: Khi Job chạy, CI Server cấp một thẻ JWT Token ngắn hạn có chữ ký số xác nhận danh tính kho Git và tên nhánh (ví dụ ref: refs/heads/main). AWS STS / GCP Workload Identity kiểm tra chữ ký đó và cấp lại một Temporary Token tự hủy sau 15–60 phút.',
      },
    ],
    visualAnalogy: {
      title: '5 Trạm Kiểm soát An ninh Sân bay & Thẻ Ra vào Tự hủy sau 15 Phút (OIDC)',
      realWorldScenario:
        'Hãy hình dung quy trình kiểm tra an ninh tại một sân bay quốc tế:',
      mappingPoints: [
        {
          realWorld: 'Máy soi hành lý xách tay tìm vật cấm (Secret) & Máy soi bản thiết kế (SAST/SCA)',
          cicdEquivalent: 'Lớp 1–4: Gitleaks (Secret) → Semgrep (SAST) → Trivy (SCA & Container Scan)',
          explanation: 'Chặn ngay từ cửa vào nếu phát hiện chìa khóa mật hoặc linh kiện có lỗi CVE.',
        },
        {
          realWorld: 'Đội đặc nhiệm diễn tập thử đột nhập vào tòa nhà mẫu (Staging)',
          cicdEquivalent: 'Lớp 5: DAST (OWASP ZAP / Nuclei)',
          explanation: 'Tấn công thử nghiệm hộp đen vào ứng dụng đang chạy thật trên Staging.',
        },
        {
          realWorld: 'Thẻ từ khách VIP chỉ mở được đúng Cổng B trong vòng 15 phút rồi tự vô hiệu hóa (thay vì đưa chìa khóa vạn năng vĩnh viễn)',
          cicdEquivalent: 'OIDC Federation (JWT Token → AWS STS Temporary Token 15–60 phút)',
          explanation: 'Không lưu bất kỳ mật khẩu tĩnh nào trong CI; thẻ tự hủy ngay khi Job kết thúc.',
        },
      ],
      mentalModelTip:
        'SAST tìm lỗi trong code DO BẠN VIẾT; SCA tìm lỗi trong thư viện DO NGƯỜI KHÁC VIẾT (npm/pip/maven); DAST tìm lỗi khi ứng dụng ĐANG CHẠY THẬT.',
    },
    diagrams: [
      {
        id: 'diag-devsecops-5-layers',
        title: 'Phễu 5 Lớp Quét Bảo mật Shift-Left & Xác thực OIDC Không mật khẩu',
        subtitle: 'Bấm vào từng lớp để xem mục tiêu phát hiện rủi ro và công cụ tiêu chuẩn',
        type: 'pipeline',
        svgBlueprint: 'svg-devsecops-oidc',
        nodes: [
          {
            id: 'sec-1-secret',
            badge: 'Lớp 1: Secret Scan',
            title: 'Gitleaks / TruffleHog',
            subtitle: 'Quét lịch sử Commit Git',
            detail:
              'Phát hiện lập trình viên vô tình đưa AWS Key, DB Password, Private Key, API Token vào mã nguồn hoặc lịch sử commit Git.',
            highlightColor: 'rose',
          },
          {
            id: 'sec-2-sast',
            badge: 'Lớp 2: SAST',
            title: 'Semgrep / SonarQube / CodeQL',
            subtitle: 'Phân tích cây cú pháp mã tĩnh',
            detail:
              'Quét mã nguồn ứng dụng để tìm lỗ hổng SQL Injection, XSS, Path Traversal, Hardcoded Secret ngay khi mở PR.',
            highlightColor: 'amber',
          },
          {
            id: 'sec-3-4-sca-container',
            badge: 'Lớp 3 & 4: SCA + Image',
            title: 'Trivy / Snyk / Checkov',
            subtitle: 'Quét Lockfile, Docker OS & K8s YAML',
            detail:
              'Đối chiếu thư viện mã nguồn mở (package-lock.json) và các gói OS (Alpine/Debian) trong Docker Image với cơ sở dữ liệu CVE toàn cầu.',
            highlightColor: 'sky',
          },
          {
            id: 'sec-5-dast-oidc',
            badge: 'Lớp 5: DAST & OIDC',
            title: 'OWASP ZAP & Cloud OIDC',
            subtitle: 'Kiểm thử động Staging + JWT sang AWS STS',
            detail:
              'Giả lập tấn công Black-box trên Staging bằng OWASP ZAP/Nuclei, sau đó dùng OIDC JWT Token ngắn hạn để lấy quyền triển khai AWS/GCP.',
            highlightColor: 'emerald',
          },
        ],
        caption: 'Bảng 2.2 & Mục 2.3 (PDF Trang 6): Tích hợp toàn diện bảo mật tự động vào đường ống CI/CD.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L2-2-oidc-aws',
        title: 'Cấu hình Xác thực AWS Không mật khẩu bằng OIDC trên GitHub Actions',
        language: 'yaml',
        description:
          'Loại bỏ hoàn toàn AWS_SECRET_ACCESS_KEY tĩnh bằng cách cấp quyền id-token: write để đổi JWT ngắn hạn lấy Temporary Role:',
        code: `permissions:
  id-token: write # BẮT BUỘC: Cấp quyền cho GitHub Actions sinh JWT Token có chữ ký số
  contents: read

jobs:
  deploy-aws-eks:
    runs-on: ubuntu-24.04
    environment: production
    steps:
      - name: 1. Assume AWS Role via Passwordless OIDC Federation
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
          role-duration-seconds: 900 # Token tạm thời tự động hủy sau 15 phút (900s)

      - name: 2. Push Verified Image & Rollout to EKS
        run: ./scripts/rollout-prod.sh "\${{ github.sha }}"`,
        outputOrImpact: 'Không có bất kỳ khóa bí mật dài hạn nào được lưu trên GitHub Secrets, miễn nhiễm với rủi ro rò rỉ khóa tĩnh.',
        annotations: [
          { line: 2, explanation: 'id-token: write cho phép Runner yêu cầu OIDC Provider của GitHub ký một JWT xác nhận repo và branch.' },
          { line: 12, explanation: 'AWS IAM kiểm tra Trust Policy (chỉ khớp đúng repo và ref: refs/heads/main) rồi trả về STS Token ngắn hạn.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Cấu hình OIDC Federation với AWS / GCP',
        githubActionsWay: 'Khai báo permissions: { id-token: write } và dùng action aws-actions/configure-aws-credentials@v4.',
        gitlabCiWay: 'Khai báo khối id_tokens: { GITLAB_OIDC_TOKEN: { aud: https://gitlab.com } } và gọi aws sts assume-role-with-web-identity.',
        architecturalNote: 'Trong Trust Policy trên AWS IAM, luôn khóa chặt điều kiện sub (Subject) chỉ cho phép nhánh refs/heads/main được phép Assume Role Production.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L2-2-oidc-wildcard',
        title: 'Cấu hình OIDC Trust Policy trên AWS dùng dấu sao (*) quá rộng cho mọi nhánh hoặc mọi repo',
        severity: 'critical',
        symptom: 'Bất kỳ lập trình viên nào mở nhánh nháp feature/test cũng có thể sửa file workflow để Assume Role quản trị Production AWS!',
        whyItHappens: 'Trong AWS IAM Trust Policy, nếu đặt "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:*" thì mọi nhánh đều xin được Token Production.',
        wrongConfig: `"Condition": {
  "StringLike": {
    "token.actions.githubusercontent.com:sub": "repo:company/payment-api:*"
  }
}`,
        rightConfig: `"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:sub": "repo:company/payment-api:ref:refs/heads/main"
  }
}`,
        fixExplanation: 'Luôn khóa chính xác StringEquals vào nhánh refs/heads/main hoặc environment:production trong Trust Policy của AWS IAM.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L2-2-shift-left',
        title: 'Chi phí Khắc phục Lỗ hổng Bảo mật theo Giai đoạn Phát hiện (Shift-Left)',
        claim: 'Phát hiện lỗi SQLi hoặc lộ Secret ngay ở bước CI trên PR tiết kiệm hơn 95% chi phí và thời gian so với khi đã lên Production.',
        methodology: 'Nghiên cứu NIST & IBM Systems Sciences Institute về chi phí sửa lỗi phần mềm.',
        metrics: [
          {
            label: 'Phát hiện ở giai đoạn PR / CI (Gitleaks + Semgrep + Trivy)',
            valueText: '5 phút sửa ngay trước khi Merge',
            barPercent: 95,
            isOptimal: true,
            note: 'Lập trình viên đang nhớ rõ ngữ cảnh code, chưa ảnh hưởng dữ liệu thật.',
          },
          {
            label: 'Phát hiện sau khi đã lên Production',
            valueText: 'Hàng chục giờ ứng cứu & xoay vòng khóa',
            barPercent: 12,
            isOptimal: false,
            note: 'Phải thu hồi khóa, viết bản vá khẩn cấp và kiểm toán nhật ký truy cập.',
          },
        ],
        takeaway: 'Shift-Left Security giúp bảo mật trở thành thói quen tự động trong từng commit.',
      },
    ],
    bestPractices: [
      'Chạy Secret Scanning (Gitleaks) và SAST (Semgrep) song song ngay từ giây thứ 0 bằng DAG (needs: []) để báo lỗi nhanh nhất.',
      'Thay thế 100% các khóa Cloud tĩnh (AWS_ACCESS_KEY_ID, GCP Service Account JSON) bằng OIDC Federation.',
    ],
  },
  {
    id: 'cicd-L2-4-full-flow-2-gitlab-devsecops',
    stageId: 'cicd-stage-2',
    order: 8,
    title: '2.4. Ví dụ Full Luồng (Level 2): Pipeline DevSecOps Đa tầng với DAG, Quét Bảo mật & Quy trình Phê duyệt (Approval Gate)',
    shortTitle: '2.4. Full Flow #2: GitLab DevSecOps',
    level: 'advanced',
    estimatedMinutes: 30,
    pdfRef: 'Mục 2.4 — Trang 6, 7 & 8 / 21',
    summary:
      'Mổ xẻ tệp cấu hình .gitlab-ci.yml cấp độ Doanh nghiệp đi qua 5 giai đoạn: Kiểm thử chia luồng song song (Test Sharding) → Quét Secret & SAST bằng đồ thị DAG → Đóng gói Docker Multi-stage & Quét lỗ hổng Trivy → Tự động lên Staging → Chờ Tech Lead bấm nút Phê duyệt (Manual Approval Gate) mới lên Production.',
    keyObjectives: [
      'Hiểu chiến lược Cache pull-push ở Job đầu tiên kết hợp policy: pull ở các Job sau để tiết kiệm 30–60 giây nén file.',
      'Hiểu ý nghĩa cờ --ignore-unfixed --severity CRITICAL,HIGH trong Trivy Scan để không làm tắc nghẽn Pipeline bởi các CVE chưa có bản vá.',
      'Nắm vững cơ chế khóa tuần tự resource_group chống xung đột triển khai và chốt phê duyệt when: manual + allow_failure: false.',
    ],
    svgBlueprint: 'svg-cache-vs-artifact-dag',
    theorySections: [
      {
        heading: '1. Kiến trúc 5 Giai đoạn của Full Flow #2 (.gitlab-ci.yml — PDF Trang 7 & 8)',
        body: 'Full Flow #2 đại diện cho chuẩn mực đường ống CI/CD trong các doanh nghiệp lớn, kết hợp tối ưu hiệu năng cao và kiểm soát an ninh chặt chẽ:',
        bulletPoints: [
          'Chiến lược Cache pull-push vs. pull: Mặc định ở khối default:, toàn bộ Pipeline dùng policy: pull (chỉ tải Cache về đọc). Chỉ duy nhất Job đầu tiên (lint_and_warm_cache) được bật policy: pull-push để nén và đẩy Cache lên kho lưu trữ, giúp tiết kiệm 30–60 giây nén file ở cuối mỗi Job phía sau.',
          'Đồ thị DAG (needs: []) cho Bảo mật: Job secret_and_sast_scan khai báo needs: [] (mảng rỗng) giúp Semgrep chạy ngay ở giây thứ 0 mà không cần chờ bước Lint hoàn tất.',
          'Chia nhỏ kiểm thử tự động (parallel: 4): GitLab tự động nhân bản Job unit_and_integration_test thành 4 Container chạy song song và cấp biến $CI_NODE_INDEX (1..4) và $CI_NODE_TOTAL (4). Jest nhận tham số --shard=1/4 để mỗi máy chỉ chạy đúng 25% số file test, rút ngắn thời gian từ 12 phút xuống còn 3 phút.',
          'Cờ --ignore-unfixed trong Trivy Scan: Chỉ chặn Pipeline (--exit-code 1) đối với những lỗ hổng bảo mật mức CRITICAL/HIGH mà nhà phát hành thư viện/hệ điều hành đã có bản vá (giúp lập trình viên có thể nâng cấp được ngay, tránh làm tắc nghẽn Pipeline vì các lỗi chưa có bản vá trên toàn cầu).',
          'Khóa tuần tự resource_group & Chốt Phê duyệt (when: manual + allow_failure: false): resource_group: staging-cluster-lock chống 2 pipeline cùng ghi đè lên Staging một lúc. Sau khi lên Staging, Pipeline dừng ở trạng thái Blocked/Waiting chờ Tech Lead / Release Manager bấm nút Play/Approve để đẩy đúng $IMAGE_TAG lên Production.',
        ],
      },
      {
        heading: '2. Tại sao tuyệt đối không dùng tag :latest cho Docker Image?',
        body: 'Ngay ở dòng đầu tiên của Full Flow #2, biến IMAGE_TAG được gắn cứng theo mã băm của commit: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA". Nếu dùng :latest, khi hai Pipeline chạy gần nhau, bước Build của commit sau có thể ghi đè tag :latest trước khi bước Deploy của commit trước kịp chạy, hoặc khi cần Rollback trên Kubernetes bạn sẽ không biết bản :latest trước đó là bản nào!',
      },
    ],
    visualAnalogy: {
      title: 'Dây chuyền Lắp ráp Ô tô Đa Luồng & Chốt Kiểm định An toàn Quốc gia',
      realWorldScenario:
        'Hãy hình dung nhà máy sản xuất xe hơi hiện đại:',
      mappingPoints: [
        {
          realWorld: 'Chỉ có đội Kho vận đầu ca được quyền sắp xếp lại kho phụ tùng, các tổ lắp ráp sau chỉ việc lấy ra dùng',
          cicdEquivalent: 'lint_and_warm_cache (policy: pull-push) vs. default (policy: pull)',
          explanation: 'Các tổ lắp ráp xong việc không mất thời gian đóng thùng cất lại phụ tùng vào kho.',
        },
        {
          realWorld: 'Đội kiểm tra an ninh bản vẽ bắt tay vào việc ngay lập tức ở giây thứ 0 song song với đội sơ chế',
          cicdEquivalent: 'secret_and_sast_scan với needs: [] (DAG)',
          explanation: 'Không lãng phí 1 giây chờ đợi nào.',
        },
        {
          realWorld: 'Chỉ giữ xe lại xưởng nếu lỗi kỹ thuật đó ĐÃ CÓ phụ tùng thay thế từ hãng',
          cicdEquivalent: 'trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH',
          explanation: 'Thực tế và khả thi: bắt buộc dev vá ngay các lỗi đã có bản sửa, không làm tê liệt nhà máy vì lỗi chưa có thuốc chữa.',
        },
      ],
      mentalModelTip:
        'Ba kỹ thuật tạo nên đẳng cấp của Full Flow #2: (1) Cache pull-push/pull, (2) Trivy --ignore-unfixed, và (3) resource_group kết hợp when: manual.',
    },
    diagrams: [
      {
        id: 'diag-full-flow-2',
        title: 'Sơ đồ Đồ thị DAG 5 Giai đoạn của Full Flow #2 (.gitlab-ci.yml)',
        subtitle: 'Tái hiện luồng chạy song song giữa Lint, 4x Sharded Tests, Semgrep SAST, Trivy Scan và Approval Gate',
        type: 'pipeline',
        svgBlueprint: 'svg-cache-vs-artifact-dag',
        nodes: [
          {
            id: 'ff2-validate',
            badge: 'Stage 1: validate',
            title: 'lint_and_warm_cache',
            subtitle: 'policy: pull-push + Fail-Fast Lint',
            detail:
              'Chạy npm ci --prefer-offline, kiểm tra lint + typecheck nhanh và là Job duy nhất nén đẩy Cache lên kho lưu trữ.',
            highlightColor: 'amber',
          },
          {
            id: 'ff2-test-sec',
            badge: 'Stage 2: security_and_test',
            title: '4x Test Shards + Semgrep DAG',
            subtitle: 'parallel: 4 & needs: [] (Chạy ở giây 0)',
            detail:
              'secret_and_sast_scan chạy ngay ở giây 0 nhờ needs: []. Ngay khi lint xong, 4 container Jest chạy song song (--shard=1/4..4/4) với cache policy: pull.',
            highlightColor: 'sky',
          },
          {
            id: 'ff2-package',
            badge: 'Stage 3: package',
            title: 'build_and_trivy_scan',
            subtitle: 'Docker BuildKit + Trivy --ignore-unfixed',
            detail:
              'Đóng gói Docker Image gắn tag $CI_COMMIT_SHORT_SHA, tận dụng --cache-from và quét lỗ hổng CRITICAL/HIGH bằng Trivy trước khi push lên Registry.',
            highlightColor: 'emerald',
          },
          {
            id: 'ff2-staging-prod',
            badge: 'Stage 4 & 5: deploy',
            title: 'Staging Auto → Manual Prod Gate',
            subtitle: 'resource_group + when: manual',
            detail:
              'Tự động rollout lên Staging với khóa resource_group chống đụng độ, sau đó dừng ở trạng thái Waiting chờ Tech Lead bấm Approve để lên Production.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Full Flow #2 (PDF Trang 7–8): Đường ống DevSecOps 5 giai đoạn chuẩn doanh nghiệp.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L2-4-full-flow-2',
        title: 'Full Flow #2: .gitlab-ci.yml (Nguyên bản từ PDF Trang 7–8)',
        language: 'yaml',
        description:
          'Tệp cấu hình GitLab CI hoàn chỉnh tích hợp Cache tối ưu, DAG, Test Sharding, Semgrep SAST, Trivy Scan và Manual Approval Gate:',
        code: `stages: [ "validate", "security_and_test", "package", "deploy_staging", "deploy_prod" ]

variables:
  IMAGE_TAG: "\$CI_REGISTRY_IMAGE:\$CI_COMMIT_SHORT_SHA" # Tag bất biến gắn theo mã commit, tuyệt đối không dùng :latest
  DOCKER_BUILDKIT: "1" # Kích hoạt công cụ BuildKit tăng tốc độ xử lý Layer song song

# [1] CACHE TOÀN CỤC: Khóa cache dựa theo nội dung file package-lock.json, mặc định chỉ kéo về (pull) để tiết kiệm I/O
default:
  cache:
    key: { files: [ "package-lock.json" ] }
    paths: [ ".npm/" ]
    policy: pull

# [2] GIAI ĐOẠN VALIDATE: Cài đặt thư viện, kiểm tra Linter nhanh (Fail-Fast) và cập nhật Cache (pull-push)
lint_and_warm_cache:
  stage: validate
  image: node:20-alpine
  cache: { key: { files: [ "package-lock.json" ] }, paths: [ ".npm/" ], policy: pull-push }
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run lint && npm run typecheck

# [3] GIAI ĐOẠN SECURITY & TEST: Chạy song song Unit Test (chia 4 luồng), Gitleaks (DAG) và Semgrep SAST
unit_and_integration_test:
  stage: security_and_test
  needs: [ "lint_and_warm_cache" ]
  image: node:20-alpine
  parallel: 4 # Test Sharding: Chia bộ 1.200 bài test ra 4 Container chạy song song (--shard=1/4 .. 4/4)
  script:
    - npm ci --cache .npm --prefer-offline
    - npx jest --shard=\$CI_NODE_INDEX/\$CI_NODE_TOTAL --coverage --ci
  artifacts: { when: always, reports: { junit: junit.xml } }

secret_and_sast_scan:
  stage: security_and_test
  needs: [] # DAG: Mảng rỗng giúp Job quét bảo mật chạy ngay ở giây thứ 0 mà không cần chờ bước Lint
  image: returntocorp/semgrep:latest
  script:
    - semgrep ci --config auto --error # Chặn đứng Pipeline nếu phát hiện lỗi SQLi, XSS, Hardcoded Secret

# [4] GIAI ĐOẠN PACKAGE: Đóng gói Docker Image bằng Kaniko/BuildKit và quét lỗ hổng CVE bằng Trivy
build_and_trivy_scan:
  stage: package
  needs: [ "unit_and_integration_test", "secret_and_sast_scan" ]
  image: docker:26.1
  services: [ "docker:26.1-dind" ]
  script:
    - docker login -u "\$CI_REGISTRY_USER" -p "\$CI_REGISTRY_PASSWORD" "\$CI_REGISTRY"
    - docker build --pull --cache-from "\$CI_REGISTRY_IMAGE:cache" -t "\$IMAGE_TAG" .
    - trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH "\$IMAGE_TAG"
    - docker push "\$IMAGE_TAG"

# [5] GIAI ĐOẠN DEPLOY STAGING & CHỐT PHÊ DUYỆT PRODUCTION (MANUAL APPROVAL GATE)
deploy_to_staging:
  stage: deploy_staging
  needs: [ "build_and_trivy_scan" ]
  environment: { name: staging, url: https://staging.app.vn }
  resource_group: staging-cluster-lock # Khóa tuần tự: Chống 2 pipeline cùng ghi đè lên Staging một lúc
  script: [ "./scripts/k8s-rollout.sh staging \$IMAGE_TAG" ]

approve_and_deploy_prod:
  stage: deploy_prod
  needs: [ "deploy_to_staging" ]
  rules: [ { if: '\$CI_COMMIT_BRANCH == "main"', when: manual, allow_failure: false } ]
  environment: { name: production, url: https://app.vn }
  resource_group: prod-cluster-lock
  script: [ "./scripts/k8s-rollout.sh production \$IMAGE_TAG" ]`,
        outputOrImpact: 'Đường ống doanh nghiệp chuẩn mực: Nhanh (DAG + Sharding + Pull Cache), An toàn (Semgrep + Trivy) và Kiểm soát chặt (Resource Group + Manual Gate).',
        annotations: [
          { line: 4, explanation: 'Luôn gắn tag Image theo mã commit ($CI_COMMIT_SHORT_SHA), tuyệt đối không dùng :latest.' },
          { line: 12, explanation: 'Mặc định toàn cục là policy: pull để 4 container chạy test không tốn thời gian nén và upload lại Cache.' },
          { line: 36, explanation: 'needs: [] kích hoạt đồ thị DAG cho phép Semgrep chạy ngay lập tức ở giây thứ 0.' },
          { line: 50, explanation: 'trivy image --exit-code 1 --ignore-unfixed chặn đứng lệnh docker push nếu có lỗi CRITICAL/HIGH đã có bản vá.' },
          { line: 58, explanation: 'resource_group đảm bảo tại một thời điểm chỉ có đúng 1 Pipeline được phép chạy lệnh rollout vào cụm.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Khóa tuần tự chống xung đột Deploy (Deployment Lock)',
        githubActionsWay: 'Dùng concurrency: { group: production-deploy-lock, cancel-in-progress: false }.',
        gitlabCiWay: 'Dùng từ khóa chuyên dụng resource_group: prod-cluster-lock (có thể kèm process_mode: newest_first).',
        architecturalNote: 'Cả hai cơ chế đều đảm bảo nếu 2 PR được merge sát nhau, chúng sẽ xếp hàng tuần tự thay vì chạy đè lên nhau.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L2-4-manual-allow-failure',
        title: 'Quên đặt allow_failure: false khi dùng when: manual trên GitLab CI',
        severity: 'warning',
        symptom: 'Trên GitLab CI, khi chỉ viết when: manual mà không ghi rõ allow_failure: false, GitLab mặc định coi Job đó là "Optional" (allow_failure: true) nên đánh dấu cả Pipeline là Passed và cho chạy tiếp các Stage sau dù chưa ai bấm duyệt!',
        whyItHappens: 'Hành vi mặc định của GitLab CI cho when: manual là không chặn đường ống trừ khi khai báo tường minh allow_failure: false.',
        wrongConfig: `rules:
  - if: '$CI_COMMIT_BRANCH == "main"'
    when: manual # Mặc định allow_failure là true -> Không chặn thực sự!`,
        rightConfig: `rules:
  - if: '$CI_COMMIT_BRANCH == "main"'
    when: manual
    allow_failure: false # Bắt buộc dừng ở trạng thái Blocked chờ duyệt`,
        fixExplanation: 'Luôn đi kèm cặp bài trùng when: manual và allow_failure: false cho mọi cổng phê duyệt (Approval Gate).',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L2-4',
        title: 'Tiết kiệm I/O nhờ Chiến lược Cache pull-push (1 Job) vs. pull (N Jobs)',
        claim: 'Chuyển các Job chạy Test Sharding sang policy: pull giúp tiết kiệm 40–60 giây ở cuối mỗi Job.',
        methodology: 'So sánh thời gian bước "Saving cache" cuối Job trên 4 container song song.',
        metrics: [
          {
            label: '1 Job pull-push + 4 Shards chỉ pull',
            valueText: '0 giây nén Cache ở cuối 4 Shards',
            barPercent: 96,
            isOptimal: true,
            note: 'Các Shard hoàn thành bài test là đóng Container ngay lập tức.',
          },
          {
            label: 'Cả 5 Job đều để mặc định pull-push',
            valueText: '4 Shards tranh nhau nén & ghi đè Cache mất ~50s/máy',
            barPercent: 25,
            isOptimal: false,
            note: 'Lãng phí băng thông mạng và I/O ổ cứng vô ích.',
          },
        ],
        takeaway: 'Chi tiết nhỏ như policy: pull tạo nên sự khác biệt lớn khi chạy hàng trăm Pipeline mỗi ngày.',
      },
    ],
    bestPractices: [
      'Luôn lưu báo cáo kiểm thử dưới dạng JUnit XML (artifacts: { when: always, reports: { junit: junit.xml } }) để hiển thị trực tiếp bài test lỗi ngay trên giao diện Merge Request.',
      'Quét Trivy ngay sau bước docker build và TRƯỚC bước docker push để không bao giờ đẩy Image chứa mã độc/CVE lên Container Registry.',
    ],
    relatedSimulators: [
      {
        label: 'Chạy Мо phỏng Full Flow #2 (DAG + Trivy + Manual Gate)',
        targetTab: 'simulator',
      },
      {
        label: 'Mở IDE Khám phá Full Flow #2 (.gitlab-ci.yml)',
        targetTab: 'blueprints',
        targetId: 'full-flow-2-gitlab-devsecops',
      },
    ],
  },
  {
    id: 'cicd-L3-1-zero-downtime-deployment-strategies',
    stageId: 'cicd-stage-3',
    order: 9,
    title: '3.1. Các Chiến lược Triển khai Không Gián đoạn (Zero-Downtime Deployment Strategies)',
    shortTitle: '3.1. Blue-Green, Canary & Rolling',
    level: 'advanced',
    estimatedMinutes: 25,
    pdfRef: 'Mục 3.1 & Hình 3.1 — Trang 8 & 9 / 21',
    summary:
      'Để cập nhật phiên bản mới cho hệ thống đang phục vụ hàng chục nghìn kết nối đồng thời mà không làm rớt bất kỳ yêu cầu nào của người dùng, kỹ sư cần lựa chọn đúng trong 5 chiến lược điều phối lưu lượng: Recreate, Rolling Update, Blue-Green, Canary Release và Shadow/Dark Traffic.',
    keyObjectives: [
      'Phân tích cơ chế vận hành, ưu điểm lớn nhất và sự đánh đổi/hạn chế của cả 5 chiến lược triển khai (Bảng 3.1).',
      'Hiểu rõ sơ đồ Hình 3.1 so sánh cách điều hướng lưu lượng giữa Blue-Green Deployment (Chuyển mạch 100%) và Canary Release (Dịch chuyển lưu lượng tăng dần 5% → 25% → 100%).',
      'Biết khi nào nên chọn Rolling Update, Blue-Green, Canary hay Shadow Traffic cho bài toán thực tế.',
    ],
    svgBlueprint: 'svg-bluegreen-vs-canary',
    theorySections: [
      {
        heading: '1. So sánh Trực quan: Blue-Green Deployment vs. Canary Release (Hình 3.1 — PDF Trang 9)',
        body: 'Hai chiến lược nổi tiếng nhất để kiểm soát rủi ro khi phát hành phiên bản mới lên Production có triết lý điều phối lưu lượng rất khác nhau:',
        bulletPoints: [
          '1. Blue-Green Deployment (Chuyển mạch 100%): Dựng cụm GREEN (v2.0 — Bản mới) song song hoàn toàn với cụm BLUE (v1.0 — Bản cũ đang phục vụ 100% khách hàng). Sau khi chạy Smoke Test trực tiếp trên cụm GREEN thành công, Load Balancer (Router / Ingress) chuyển mạch 100% Traffic sang cụm GREEN trong dưới 1 giây. Cụm BLUE được giữ nguyên ở chế độ chờ để sẵn sàng Rollback tức thì nếu có sự cố.',
          '2. Canary Release (Dịch chuyển lưu lượng tăng dần): Thông qua Service Mesh (Istio) hoặc Argo Rollouts, hệ thống chỉ điều hướng 5% lưu lượng người dùng thực vào Canary Pods (v2.0), trong khi 95% vẫn vào Stable Pods (v1.0). Hệ thống tự động đo lường chỉ số lỗi HTTP 5xx và độ trễ P99 (qua Prometheus); nếu ổn định mới nâng dần lên 25% → 50% → 100%.',
        ],
      },
      {
        heading: '2. Ma trận 5 Chiến lược Triển khai (Bảng 3.1 — PDF Trang 9)',
        body: 'Ngoài Blue-Green và Canary, kiến trúc sư cần nắm rõ toàn bộ 5 chiến lược để đánh đổi giữa Tài nguyên (CPU/RAM), Tốc độ Rollback và Bán kính ảnh hưởng (Blast Radius):',
        bulletPoints: [
          'Recreate: Tắt toàn bộ instance v1.0 rồi mới khởi chạy các instance v2.0. Ưu điểm: Đơn giản, không bao giờ tồn tại 2 phiên bản chạy song song. Hạn chế: Gây gián đoạn dịch vụ (Downtime); chỉ dùng cho môi trường nội bộ/Dev.',
          'Rolling Update: Thay thế cuốn chiếu từng nhóm Pod v1.0 bằng Pod v2.0 cho đến khi hoàn tất. Ưu điểm: Tiết kiệm tài nguyên, được hỗ trợ mặc định bởi Kubernetes Deployment. Hạn chế: Quá trình Rollback phải cuộn ngược từng bước; có thời điểm v1 và v2 cùng tồn tại.',
          'Blue-Green: Dựng cụm Green (v2.0) song song với cụm Blue (v1.0), kiểm thử xong thì chuyển 100% lưu lượng sang Green. Ưu điểm: Chuyển mạch và Rollback tức thì (dưới 1 giây) ngay tại tầng Load Balancer. Hạn chế: Đòi hỏi gấp đôi tài nguyên tính toán (CPU/RAM) trong thời gian chuyển giao.',
          'Canary Release: Cho 1%–5% người dùng thực truy cập vào v2.0; nếu HTTP 5xx và độ trễ P99 ổn định mới nâng dần lên 25%, 50%, 100%. Ưu điểm: Bán kính ảnh hưởng (Blast Radius) nhỏ nhất, kiểm chứng bằng tải thực tế. Hạn chế: Cần hạ tầng định tuyến thông minh (Istio, NGINX, Argo Rollouts) và Prometheus.',
          'Shadow / Dark Traffic: Nhân bản (Mirror) lưu lượng thực từ v1.0 gửi ngầm sang v2.0 để kiểm tra hiệu năng nhưng không trả kết quả của v2.0 cho khách hàng. Ưu điểm: Thử tải bằng 100% lưu lượng Production thật mà không ảnh hưởng người dùng. Hạn chế: Rất phức tạp với các API ghi dữ liệu (POST/PUT) vì cần tránh ghi trùng xuống DB.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Nâng cấp Nhà ga Sân bay Đang Đón Khách',
      realWorldScenario:
        'Hãy hình dung 5 cách nâng cấp nhà ga hành khách từ phiên bản cũ (v1.0) lên phiên bản mới (v2.0):',
      mappingPoints: [
        {
          realWorld: 'Đóng cửa toàn bộ sân bay 2 ngày để đập đi xây lại (Recreate)',
          cicdEquivalent: 'Recreate Strategy',
          explanation: 'Dễ làm nhất nhưng hành khách không thể bay (Downtime 100%).',
        },
        {
          realWorld: 'Đóng từng quầy làm thủ tục cũ, thay bằng quầy mới lần lượt từ quầy số 1 đến số 20 (Rolling Update)',
          cicdEquivalent: 'Rolling Update (Kubernetes Default)',
          explanation: 'Không tốn thêm mặt bằng, nhà ga vẫn hoạt động liên tục.',
        },
        {
          realWorld: 'Xây nguyên Nhà ga T2 mới tinh bên cạnh T1, kiểm tra xong thì gạt biển chỉ dẫn 100% xe buýt sang T2 (Blue-Green)',
          cicdEquivalent: 'Blue-Green Deployment',
          explanation: 'Chuyển đổi trong 1 giây; nếu T2 mất điện thì gạt biển quay lại T1 ngay lập tức, nhưng tốn gấp đôi diện tích đất.',
        },
        {
          realWorld: 'Mời 5% hành khách đi thử qua cổng mới, đo thời gian xếp hàng thấy tốt mới mở dần cho 25%, 50%, 100% (Canary)',
          cicdEquivalent: 'Canary Release (Argo Rollouts / Istio)',
          explanation: 'Nếu cổng mới có lỗi, chỉ tối đa 5% khách bị ảnh hưởng (Blast Radius nhỏ nhất).',
        },
      ],
      mentalModelTip:
        'Canary tối ưu về "Giảm bán kính rủi ro (Blast Radius)"; Blue-Green tối ưu về "Tốc độ Rollback tức thì (< 1s)"; Rolling Update tối ưu về "Tiết kiệm chi phí RAM/CPU".',
    },
    diagrams: [
      {
        id: 'diag-hinh-3-1',
        title: 'Hình 3.1: So sánh Cơ chế Điều hướng Lưu lượng giữa Blue-Green, Canary, Rolling & Shadow',
        subtitle: 'Bấm vào từng chiến lược để phân tích Cơ chế vận hành, Ưu điểm lớn nhất và Đánh đổi',
        type: 'comparison-boxes',
        svgBlueprint: 'svg-bluegreen-vs-canary',
        nodes: [
          {
            id: 'strat-blue-green',
            badge: 'Chuyển mạch 100%',
            title: 'Blue-Green Deployment',
            subtitle: 'Load Balancer gạt 100% Traffic sang Green',
            detail:
              'Dựng cụm Green (v2.0) song song với cụm Blue (v1.0). Vượt qua Smoke Test thì chuyển 100% lưu lượng sang Green. Rollback dưới 1 giây tại Load Balancer nhưng tốn gấp đôi CPU/RAM lúc chuyển giao.',
            highlightColor: 'emerald',
          },
          {
            id: 'strat-canary',
            badge: 'Tăng dần 5% → 100%',
            title: 'Canary Release',
            subtitle: '5% → 25% → 50% → 100% (Đo 5xx & P99)',
            detail:
              'Service Mesh / Argo Rollouts điều hướng 1%–5% người dùng thực vào v2.0. Tự động kiểm tra Prometheus (HTTP 5xx, Latency P99) trước khi nâng dần lên 100%. Blast Radius nhỏ nhất.',
            highlightColor: 'sky',
          },
          {
            id: 'strat-rolling-shadow',
            badge: 'Cuốn chiếu & Mirror',
            title: 'Rolling Update & Shadow Traffic',
            subtitle: 'Thay từng Pod vs. Nhân bản Traffic ngầm',
            detail:
              'Rolling Update thay thế cuốn chiếu từng Pod (tiết kiệm tài nguyên). Shadow/Dark Traffic nhân bản 100% request thật gửi ngầm sang v2.0 để thử tải mà không trả kết quả v2.0 cho khách.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Hình 3.1 & Bảng 3.1 (PDF Trang 9): Lựa chọn chiến lược điều phối lưu lượng theo yêu cầu SLA và hạ tầng.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L3-1-argo-rollouts-canary',
        title: 'Cấu hình Canary Release Tự động Đo lường Prometheus với Argo Rollouts',
        language: 'yaml',
        description:
          'Định nghĩa kịch bản Canary dịch chuyển lưu lượng từ 5% → 25% → 50% → 100% và tự động Rollback nếu tỷ lệ lỗi HTTP 5xx vượt quá 1%:',
        code: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service
spec:
  replicas: 20
  strategy:
    canary:
      steps:
        - setWeight: 5               # Bước 1: Mở 5% lưu lượng thực vào Canary (v2.0)
        - pause: { duration: 3m }    # Theo dõi trong 3 phút
        - analysis:                  # Tự động truy vấn Prometheus kiểm tra Error Rate & P99
            templates:
              - templateName: success-rate-and-p99-check
        - setWeight: 25              # Bước 2: Nếu ổn định, nâng lên 25%
        - pause: { duration: 5m }
        - setWeight: 50              # Bước 3: Nâng lên 50%
        - pause: { duration: 5m }
        # Sau bước cuối cùng, tự động nâng lên 100% và hoàn tất Rollout`,
        outputOrImpact: 'Nếu ở mốc 5% chỉ số HTTP 5xx tăng vọt, Argo Rollouts tự động hủy đợt phát hành và trả 100% traffic về bản Stable v1.0.',
        annotations: [
          { line: 10, explanation: 'setWeight: 5 chỉ cho phép 5% lưu lượng người dùng chạm vào phiên bản v2.0 mới.' },
          { line: 12, explanation: 'Khối analysis kết nối trực tiếp với Prometheus để đánh giá sức khỏe tự động trước khi tăng lưu lượng.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Công cụ Thực thi Chiến lược Zero-Downtime trên Kubernetes',
        githubActionsWay: 'Kết hợp GitHub Actions với kubectl rollout (Rolling Update) hoặc cập nhật GitOps repo để Argo Rollouts chạy Canary/Blue-Green.',
        gitlabCiWay: 'Hỗ trợ Incremental Rollouts gốc hoặc tích hợp với Argo Rollouts / Flagger + Istio / NGINX Ingress.',
        architecturalNote: 'Kubernetes Deployment mặc định chỉ hỗ trợ Recreate và RollingUpdate; muốn làm Blue-Green hoặc Canary tự động theo metric cần dùng thêm Argo Rollouts hoặc Flagger.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L3-1-shadow-write',
        title: 'Bật Shadow / Dark Traffic cho các API ghi dữ liệu (POST /thanh-toan, PUT /don-hang) mà không lọc hiệu ứng phụ',
        severity: 'critical',
        symptom: 'Khách hàng bấm thanh toán 1 lần nhưng bị trừ tiền 2 lần hoặc nhận được 2 email xác nhận đơn hàng!',
        whyItHappens: 'Shadow Traffic nhân bản (Mirror) request thật từ v1.0 gửi sang v2.0. Nếu v2.0 dùng chung Database Production hoặc cổng thanh toán thật, cả v1.0 và v2.0 đều thực thi lệnh ghi!',
        wrongConfig: `# Mirror toàn bộ request POST/PUT sang v2.0 đang trỏ thẳng vào DB Production thật`,
        rightConfig: `# Chỉ bật Shadow Traffic cho các API đọc (GET) hoặc trỏ v2.0 vào Sandbox DB / Mock External Gateway`,
        fixExplanation: 'Bảng 3.1 (PDF Trang 9): Shadow Traffic rất phức tạp với các API ghi dữ liệu (POST/PUT) vì cần tránh ghi trùng xuống Database.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L3-1',
        title: 'So sánh Bán kính Ảnh hưởng (Blast Radius) và Thời gian Rollback',
        claim: 'Canary giới hạn rủi ro ở mức 1%–5% người dùng, trong khi Blue-Green cho tốc độ Rollback dưới 1 giây.',
        methodology: 'Đối chiếu khi triển khai một phiên bản v2.0 có lỗi tiềm ẩn.',
        metrics: [
          {
            label: 'Canary Release (Bán kính ảnh hưởng nhỏ nhất)',
            valueText: 'Chỉ 1%–5% request gặp lỗi trước khi Auto-Rollback',
            barPercent: 96,
            isOptimal: true,
            note: '95%–99% khách hàng hoàn toàn không hề biết có sự cố.',
          },
          {
            label: 'Recreate Strategy (Tắt cũ bật mới)',
            valueText: '100% khách hàng bị gián đoạn (Downtime)',
            barPercent: 10,
            isOptimal: false,
            note: 'Chỉ được phép dùng cho môi trường phát triển nội bộ.',
          },
        ],
        takeaway: 'Hệ thống càng quan trọng (Core FinTech, E-commerce), càng phải tiến tới Blue-Green hoặc Canary Release.',
      },
    ],
    bestPractices: [
      'Với hầu hết Microservices tiêu chuẩn, RollingUpdate cấu hình đúng (maxUnavailable: 0 + ReadinessProbe + preStop) đã đáp ứng tốt Zero-Downtime mà không tốn gấp đôi RAM.',
      'Với các dịch vụ lõi nhạy cảm (Thanh toán, Xác thực), ưu tiên dùng Canary Release (Argo Rollouts) kết hợp cảnh báo độ trễ P99 và tỷ lệ lỗi 5xx.',
    ],
    relatedSimulators: [
      {
        label: 'Mở Mô phỏng Điều phối Lưu lượng Blue-Green & Canary',
        targetTab: 'simulator',
      },
    ],
  },
  {
    id: 'cicd-L3-2-gitops-pull-vs-push',
    stageId: 'cicd-stage-3',
    order: 10,
    title: '3.2. Kiến trúc GitOps (Pull-based CD với ArgoCD/FluxCD) vs. Push-based CD Truyền thống',
    shortTitle: '3.2. Kiến trúc GitOps (ArgoCD)',
    level: 'pro',
    estimatedMinutes: 25,
    pdfRef: 'Mục 3.2 & Hình 3.2 — Trang 9 & 10 / 21',
    summary:
      'Trong mô hình truyền thống (Push-based), CI Runner giữ chứng chỉ quản trị cụm Production và đẩy lệnh từ ngoài vào. Kiến trúc GitOps (Pull-based với ArgoCD/FluxCD) đảo ngược luồng này: một Agent nằm bên trong cụm Kubernetes chủ động kéo (Pull) cấu hình từ Git Manifest Repo về và tự động đồng bộ trạng thái.',
    keyObjectives: [
      'Hiểu rủi ro an ninh chí mạng của mô hình Push-based CD truyền thống khi CI Runner bị xâm nhập.',
      'Nắm vững luồng hoạt động 6 bước của mô hình GitOps (Hình 3.2) giữa Vùng CI và Production K8s Cluster (Mạng nội bộ đóng kín).',
      'Hiểu cơ chế phát hiện cấu hình lệch (Configuration Drift) và tự động đồng bộ (Reconcile) của ArgoCD Controller.',
    ],
    svgBlueprint: 'svg-gitops-pull-vs-push',
    theorySections: [
      {
        heading: '1. Tại sao Push-based CD Truyền thống lại Nguy hiểm cho Cụm Production? (PDF Trang 9)',
        body: 'Trong mô hình truyền thống (Push-based), CI Runner giữ chứng chỉ quản trị cụm Production (kubeconfig / cluster-admin token) và chạy lệnh kubectl apply hoặc helm upgrade từ bên ngoài đẩy vào cụm. Điều này tạo ra 2 lỗ hổng lớn: (1) Cụm Kubernetes Production phải mở cổng API quản trị ra ngoài mạng cho CI Runner truy cập, và (2) Nếu CI Server bị xâm nhập (ví dụ qua lỗ hổng plugin hoặc Supply Chain Attack), kẻ tấn công chiếm toàn quyền điều khiển cụm Production!',
      },
      {
        heading: '2. Kiến trúc GitOps (Pull-based CD) hoạt động như thế nào? (Hình 3.2 — PDF Trang 10)',
        body: 'Kiến trúc GitOps (với ArgoCD hoặc FluxCD) đảo ngược hoàn toàn chiều kết nối bằng cách tách làm 2 vùng độc lập:',
        bulletPoints: [
          'VÙNG CI (Xây dựng & Kiểm định): [1. App Source Git (Code ứng dụng)] → [2. CI Pipeline (Test & Scan)] → Đẩy bản dựng vào [3. Container Registry (Image v1.2.4)] → Cuối cùng CI chỉ commit cập nhật tag app:v1.2.4 vào [4. GitOps Config Repo (Source of Truth chứa K8s YAML/Helm)]. Vùng CI hoàn toàn KHÔNG biết mật khẩu của cụm Kubernetes!',
          'PRODUCTION K8S CLUSTER (Mạng Nội Bộ Đóng Kín): Cụm Production không mở cổng API quản trị ra ngoài cho CI Server. Bên trong cụm có [5. ArgoCD Controller] chủ động kéo (PULL) từ GitOps Config Repo liên tục → Phát hiện cấu hình lệch (Drift) giữa Git và thực tế → Tự động đồng bộ (Reconcile) sang [6. Production Pods (Deployments, Services, Ingress, ConfigMaps)].',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Giao hàng Tận Кét sắt Ngân hàng (Push) vs. Hộp thư Niêm phong bên ngoài (GitOps Pull)',
      realWorldScenario:
        'Hãy tưởng tượng cách chuyển tài liệu vào Kho tiền Trung tâm của Ngân hàng:',
      mappingPoints: [
        {
          realWorld: 'Đưa chìa khóa Kho tiền cho nhân viên giao hàng bên ngoài để họ tự mở cửa bước vào đặt tài liệu (Push-based CD)',
          cicdEquivalent: 'Push-based CD (CI Runner giữ kubeconfig & gọi kubectl apply)',
          explanation: 'Nếu nhân viên giao hàng bị kẻ gian khống chế, kẻ gian có sẵn chìa khóa bước thẳng vào Kho tiền!',
        },
        {
          realWorld: 'Nhân viên giao hàng chỉ được đặt bản thiết kế vào Hộp thư Niêm phong ngoài sảnh; Bảo vệ bên trong Kho tiền chủ động ra lấy vào (GitOps Pull-based)',
          cicdEquivalent: 'GitOps Pull-based CD (CI cập nhật GitOps Repo ← ArgoCD bên trong K8s chủ động PULL)',
          explanation: 'Kho tiền đóng kín 100% từ bên ngoài; nhân viên giao hàng (CI) không có bất kỳ quyền hạn nào đối với Kho tiền (Production K8s).',
        },
      ],
      mentalModelTip:
        'Trong GitOps: "Git là Nguồn Sự Thật Duy Nhất (Single Source of Truth)". Nếu ai đó lén SSH/kubectl vào sửa tay trên cụm Production, ArgoCD sẽ phát hiện lệch (Out-of-Sync / Drift) và tự động ghi đè lại đúng như trong Git!',
    },
    diagrams: [
      {
        id: 'diag-hinh-3-2-gitops',
        title: 'Hình 3.2: Mô hình GitOps (Pull-based CD) — Cụm Production Không mở Cổng Quản trị ra ngoài',
        subtitle: 'Tái hiện nguyên bản sơ đồ Hình 3.2 (PDF Trang 10) gồm 6 khối từ App Source Git đến Production Pods',
        type: 'pipeline',
        svgBlueprint: 'svg-gitops-pull-vs-push',
        nodes: [
          {
            id: 'gitops-1-2-ci',
            badge: 'Khối 1 & 2 (Vùng CI)',
            title: 'App Source Git & CI Pipeline',
            subtitle: 'Code ứng dụng → Test & Scan',
            detail:
              'Lập trình viên đẩy code vào kho App Source Git. CI Pipeline chạy kiểm thử tự động và quét bảo mật DevSecOps.',
            highlightColor: 'sky',
          },
          {
            id: 'gitops-3-registry',
            badge: 'Khối 3 (Vùng CI)',
            title: 'Container Registry',
            subtitle: 'Lưu trữ Image v1.2.4 bất biến',
            detail:
              'CI đóng gói Docker Image đã vượt qua kiểm định Trivy và đẩy lên Container Registry với tag v1.2.4.',
            highlightColor: 'amber',
          },
          {
            id: 'gitops-4-config-repo',
            badge: 'Khối 4 (Source of Truth)',
            title: 'GitOps Config Repo',
            subtitle: 'Cập nhật tag app:v1.2.4 trong K8s YAML/Helm',
            detail:
              'Thay vì gọi kubectl apply, bước cuối của CI chỉ commit thay đổi dòng image: app:v1.2.4 vào kho GitOps Config Repo.',
            highlightColor: 'emerald',
          },
          {
            id: 'gitops-5-6-argocd',
            badge: 'Khối 5 & 6 (K8s Nội bộ)',
            title: 'ArgoCD Controller (PULL) → Pods',
            subtitle: 'Pull Git • Phát hiện Drift • Tự động Reconcile',
            detail:
              'Nằm trong mạng nội bộ đóng kín của Production K8s Cluster, ArgoCD chủ động PULL từ GitOps Repo, phát hiện cấu hình lệch (Drift) và đồng bộ xuống Production Pods.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Hình 3.2 (PDF Trang 10): Đảo ngược luồng từ Push sang Pull giúp cô lập bảo mật tuyệt đối cho cụm Production.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L3-2-argocd-app',
        title: 'Khai báo ArgoCD Application Tự động Đồng bộ (Auto-Sync & Self-Heal Drift)',
        language: 'yaml',
        description:
          'Cấu hình ArgoCD bên trong cụm Kubernetes chủ động theo dõi GitOps Config Repo, tự động áp dụng thay đổi và tự động sửa lại nếu có người can thiệp thủ công (selfHeal: true):',
        code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-service-prod
  namespace: argocd
spec:
  project: production
  source:
    repoURL: https://github.com/company/gitops-k8s-manifests.git
    targetRevision: main
    path: apps/order-service/overlays/production
  destination:
    server: https://kubernetes.default.svc # Chạy ngay bên trong cụm K8s nội bộ!
    namespace: production
  syncPolicy:
    automated:
      prune: true    # Tự động xóa tài nguyên K8s nếu file YAML tương ứng bị xóa khỏi Git
      selfHeal: true # Tự động khôi phục trạng thái chuẩn nếu ai đó sửa tay (Drift) trên cụm!`,
        outputOrImpact: 'Mọi thao tác triển khai hoặc Rollback trên Production giờ đây chỉ đơn giản là một lệnh git commit hoặc git revert trên GitOps Repo.',
        annotations: [
          { line: 9, explanation: 'ArgoCD chủ động kéo (PULL) cấu hình từ kho GitOps Manifest Repo.' },
          { line: 13, explanation: 'Kết nối trực tiếp tới API nội bộ của cụm (kubernetes.default.svc), không cần mở cổng ra Internet.' },
          { line: 18, explanation: 'selfHeal: true phát hiện mọi thay đổi trái phép (Configuration Drift) và lập tức đồng bộ lại theo Git.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Tích hợp GitOps Pull-based',
        githubActionsWay: 'CI cập nhật file values.yaml trong GitOps Repo (dùng yq + git commit) để ArgoCD/FluxCD bên trong cụm K8s tự kéo về.',
        gitlabCiWay: 'Hỗ trợ cả ArgoCD/FluxCD chuẩn hoặc GitLab Agent for Kubernetes (agentk) chạy bên trong cụm chủ động mở kênh Pull về GitLab.',
        architecturalNote: 'Tuyệt đối tách riêng App Source Repo (chứa code ứng dụng) và GitOps Config Repo (chứa K8s YAML/Helm) để tránh vòng lặp vô hạn (Infinite CI Trigger Loop).',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L3-2-infinite-loop',
        title: 'Đặt chung K8s Manifest và Code ứng dụng trong cùng 1 Repo mà quên lọc đường dẫn CI',
        severity: 'warning',
        symptom: 'Pipeline CI chạy lặp lại vô tận không bao giờ dừng (Commit 1 → CI chạy → CI commit cập nhật tag Image vào repo → kích hoạt lại CI lần 2 → lặp vô hạn)!',
        whyItHappens: 'Khi CI tự động commit tag Image mới vào chính nhánh main của kho chứa code mà không tách repo hoặc không dùng paths-ignore / [skip ci].',
        wrongConfig: `# CI commit thẳng vào cùng repo không có bộ lọc paths-ignore`,
        rightConfig: `# Tách riêng GitOps Config Repo (Chuẩn Hình 3.2) hoặc thêm paths-ignore: ['k8s/**']`,
        fixExplanation: 'Sơ đồ Hình 3.2 tách bạch rõ Khối 1 (App Source Git) và Khối 4 (GitOps Config Repo) để phân quyền độc lập và chống lặp vô hạn.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L3-2',
        title: 'So sánh Thời gian Khôi phục Thảm họa (Disaster Recovery) giữa GitOps và Push-based',
        claim: 'Khi cần dựng lại toàn bộ cụm Kubernetes ở Region mới, GitOps với ArgoCD chỉ mất vài phút để đồng bộ toàn bộ 50 Microservices.',
        methodology: 'Thử nghiệm dựng lại cụm Production từ trạng thái trắng.',
        metrics: [
          {
            label: 'GitOps (Trỏ ArgoCD vào GitOps Config Repo)',
            valueText: '5 phút tự động Reconcile toàn cụm',
            barPercent: 95,
            isOptimal: true,
            note: 'Toàn bộ trạng thái mong muốn nằm sẵn trong Git.',
          },
          {
            label: 'Push-based truyền thống (Chạy lại 50 Pipeline CI rời rạc)',
            valueText: '2–3 giờ bấm chạy lại từng repo',
            barPercent: 20,
            isOptimal: false,
            note: 'Phụ thuộc thứ tự chạy và trạng thái của từng Pipeline cũ.',
          },
        ],
        takeaway: 'GitOps biến việc quản trị cụm Kubernetes từ các câu lệnh rời rạc thành trạng thái khai báo có kiểm toán 100%.',
      },
    ],
    bestPractices: [
      'Không bao giờ cấp quyền cluster-admin của cụm Production cho CI Runner bên ngoài; hãy chuyển sang mô hình GitOps Pull-based.',
      'Bật tính năng selfHeal: true trên ArgoCD và khóa quyền chạy lệnh kubectl edit thủ công của lập trình viên trên Production.',
    ],
  },
  {
    id: 'cicd-L3-3-monorepo-db-migration-dora',
    stageId: 'cicd-stage-3',
    order: 11,
    title: '3.3 & 3.4. Thiết kế Pipeline cho Monorepo, Database Migration (Expand-and-Contract) & 4 Chỉ số DORA',
    shortTitle: '3.3. Monorepo, DB Migration & DORA',
    level: 'pro',
    estimatedMinutes: 25,
    pdfRef: 'Mục 3.3 & 3.4 — Trang 10 / 21',
    summary:
      'Làm chủ kỹ thuật Affected-Only Execution cho Monorepo (chỉ build dịch vụ bị ảnh hưởng bởi git diff), mẫu thiết kế 3 pha Expand-and-Contract giúp thay đổi Schema Database mà không gây lỗi khi chạy Rolling Update/Canary, và bộ 4 chỉ số quốc tế DORA.',
    keyObjectives: [
      'Hiểu cách kết hợp Path Filtering (rules:changes / dorny/paths-filter) với Nx/Turborepo/Bazel để tối ưu Monorepo.',
      'Thuộc lòng 3 pha của mẫu thiết kế Database Migration Không Gián đoạn (Expand → Backfill & Switch Read → Contract).',
      'Nắm vững 4 chỉ số DORA (Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR) và ngưỡng chuẩn mức Elite.',
    ],
    svgBlueprint: 'svg-expand-contract-ai-gate',
    theorySections: [
      {
        heading: '1. Tối ưu hóa Monorepo — Affected-Only Execution (Mục 3.3 — PDF Trang 10)',
        body: 'Khi đặt hàng chục Microservices trong cùng một kho Git (Monorepo), tuyệt đối không build lại tất cả mỗi khi có commit. Giải pháp chuẩn là kết hợp Path Filtering (rules:changes trên GitLab hoặc dorny/paths-filter trên GitHub) với công cụ phân tích đồ thị phụ thuộc (Nx, Turborepo, Bazel) để chỉ kiểm thử và đóng gói đúng những dịch vụ bị ảnh hưởng bởi git diff.',
      },
      {
        heading: '2. Database Migration Không Gián đoạn — Expand-and-Contract Pattern (Mục 3.3 — PDF Trang 10)',
        body: 'Đây là bài toán sống còn ở cấp độ Senior/Architect: Khi chạy Rolling Update hoặc Canary, code cũ (v1.0) và code mới (v2.0) CÙNG TRUY CẬP vào một Database tại cùng thời điểm! Nếu bạn đổi tên cột trực tiếp (RENAME COLUMN) hoặc xóa cột cũ ngay lập tức, các Pod v1.0 đang chạy sẽ lập tức báo lỗi SQL 500! Vì vậy, mọi thay đổi Schema phải chia làm 3 pha tương thích ngược:',
        bulletPoints: [
          'Pha 1 — Expand (Mở rộng): Thêm cột mới cho phép NULL (giữ nguyên cột cũ). Cập nhật code v1.1 ghi đồng thời vào cả 2 cột (Dual-Write). Nếu v1.1 lỗi, Rollback về v1.0 an toàn 100%.',
          'Pha 2 — Backfill & Switch Read: Chạy script đồng bộ dữ liệu lịch sử từ cột cũ sang cột mới (Backfill), sau đó cập nhật code v1.2 chuyển sang đọc từ cột mới.',
          'Pha 3 — Contract (Thu gọn): Sau khi v2.0 hoàn toàn không còn dùng cột cũ và đã chạy ổn định trên Production, mới thực thi lệnh DROP COLUMN để xóa cột cũ.',
        ],
      },
      {
        heading: '3. Bốn Chỉ số Quốc tế DORA Đánh giá Hiệu quả Hệ thống CI/CD (Mục 3.4 — PDF Trang 10)',
        body: 'Tiêu chuẩn quốc tế DORA (DevOps Research and Assessment) đo lường mức độ trưởng thành của CI/CD qua 4 chỉ số cân bằng giữa Tốc độ (Velocity) và Độ ổn định (Stability):',
        bulletPoints: [
          '1. Deployment Frequency (Tần suất triển khai — Tốc độ): Mức Elite đạt nhiều lần mỗi ngày (On-demand).',
          '2. Lead Time for Changes (Thời gian từ lúc commit đến khi chạy trên Production — Tốc độ): Mức Elite đạt dưới 1 giờ.',
          '3. Change Failure Rate (Tỷ lệ bản triển khai gây lỗi — Độ ổn định): Mức Elite đạt dưới 15%.',
          '4. Mean Time to Recovery - MTTR (Thời gian khôi phục trung bình khi có sự cố — Độ ổn định): Mức Elite đạt dưới 1 giờ nhờ cơ chế Auto-Rollback.',
        ],
      },
    ],
    visualAnalogy: {
      title: 'Xây Cầu Mới Bên Cạnh Cầu Cũ Đang Có Xe Chạy (Expand-and-Contract)',
      realWorldScenario:
        'Hãy hình dung việc thay thế một cây cầu huyết mạch mà không được phép chặn xe dù chỉ 1 phút:',
      mappingPoints: [
        {
          realWorld: 'Pha 1 (Expand): Xây thêm làn cầu mới bên cạnh làn cầu cũ, mở lối cho xe đi cả hai bên',
          cicdEquivalent: 'Pha 1: ADD COLUMN ... NULL + Code v1.1 Dual-Write ghi cả 2 cột',
          explanation: 'Cả xe quen đường cũ (Pod v1.0) và xe đi đường mới (Pod v1.1) đều chạy bình thường; có thể quay đầu bất cứ lúc nào.',
        },
        {
          realWorld: 'Pha 2 (Backfill & Switch Read): Chuyển toàn bộ dữ liệu cũ sang làn mới và hướng dẫn xe đọc biển báo làn mới',
          cicdEquivalent: 'Pha 2: Script Backfill dữ liệu cũ + Code v1.2 đọc từ cột mới',
          explanation: 'Đảm bảo làn cầu mới đã có đầy đủ dữ liệu lịch sử như làn cũ.',
        },
        {
          realWorld: 'Pha 3 (Contract): Khi 100% xe đã đi trên cầu mới và không còn chiếc nào trên cầu cũ, mới tháo dỡ cầu cũ',
          cicdEquivalent: 'Pha 3: Code v2.0 ngừng chạm cột cũ → Chạy lệnh DROP COLUMN',
          explanation: 'Tháo dỡ an toàn tuyệt đối mà không gây sập bất kỳ giao dịch nào.',
        },
      ],
      mentalModelTip:
        'Quy tắc vàng khi chạy Rolling Update / Canary: "Database Migration ở phiên bản N phải luôn tương thích ngược 100% với Mã nguồn ở phiên bản N-1".',
    },
    diagrams: [
      {
        id: 'diag-expand-contract-dora',
        title: 'Sơ đồ 3 Pha Expand-and-Contract DB Migration & 4 Chỉ số DORA Mức Elite',
        subtitle: 'Bấm vào từng pha để xem cách nâng cấp Database không gián đoạn khi v1.0 và v2.0 cùng chạy',
        type: 'pipeline',
        svgBlueprint: 'svg-expand-contract-ai-gate',
        nodes: [
          {
            id: 'ec-phase-1',
            badge: 'Pha 1: Expand',
            title: 'Mở rộng Schema & Dual-Write',
            subtitle: 'ADD COLUMN NULL + v1.1 ghi đồng thời 2 cột',
            detail:
              'Thêm cột mới cho phép NULL (giữ nguyên cột cũ). Cập nhật code v1.1 ghi đồng thời vào cả 2 cột. Nếu v1.1 lỗi, Rollback về v1.0 an toàn 100%.',
            highlightColor: 'sky',
          },
          {
            id: 'ec-phase-2',
            badge: 'Pha 2: Backfill & Switch',
            title: 'Đồng bộ Dữ liệu & Đọc Cột Mới',
            subtitle: 'Backfill dữ liệu cũ + v1.2 chuyển đọc cột mới',
            detail:
              'Chạy script đồng bộ dữ liệu lịch sử từ cột cũ sang cột mới theo từng lô (Batch), sau đó cập nhật code v1.2 đọc hoàn toàn từ cột mới.',
            highlightColor: 'amber',
          },
          {
            id: 'ec-phase-3',
            badge: 'Pha 3: Contract',
            title: 'Thu gọn Schema (DROP COLUMN)',
            subtitle: 'v2.0 bỏ cột cũ → Thực thi DROP COLUMN',
            detail:
              'Sau khi v2.0 hoàn toàn không còn dùng cột cũ và chạy ổn định trên Production, mới thực thi lệnh DROP COLUMN để xóa cột cũ.',
            highlightColor: 'emerald',
          },
          {
            id: 'ec-dora-4',
            badge: '4 Chỉ số DORA Elite',
            title: 'Tốc độ & Độ Ổn định Chuẩn Quốc tế',
            subtitle: 'Deploy कई lần/ngày • Lead Time < 1h • CFR < 15% • MTTR < 1h',
            detail:
              'Bốn chỉ số DORA đo lường toàn diện sức khỏe CI/CD: Deployment Frequency, Lead Time for Changes, Change Failure Rate và Mean Time to Recovery.',
            highlightColor: 'violet',
          },
        ],
        caption: 'Mục 3.3 & 3.4 (PDF Trang 10): Kết hợp Monorepo Affected-Only, Expand-and-Contract và bộ thước đo DORA.',
      },
    ],
    codeExamples: [
      {
        id: 'code-L3-3-monorepo-nx',
        title: 'Tối ưu Monorepo: Chỉ Kiểm thử & Build các Dịch vụ bị Ảnh hưởng bởi git diff (Affected-Only)',
        language: 'yaml',
        description:
          'Kết hợp Path Filtering và Nx/Turborepo để khi sửa 1 dòng trong order-service thì không build lại 29 Microservices còn lại:',
        code: `# --- A. GITLAB CI: Dùng rules:changes lọc theo thư mục dịch vụ ---
build_order_service:
  stage: package
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      changes:
        - apps/order-service/**/*
        - libs/shared-dto/**/* # Tự động chạy nếu thư viện dùng chung bị sửa
  script:
    - docker build -t "$CI_REGISTRY_IMAGE/order-service:$CI_COMMIT_SHORT_SHA" apps/order-service

# --- B. NX / TURBOREPO: Tự động tính đồ thị phụ thuộc (Dependency Graph) theo git diff ---
test_affected_monorepo:
  stage: security_and_test
  script:
    - npx nx affected --target=test --base=origin/main~1 --head=HEAD --parallel=4`,
        outputOrImpact: 'Giảm 85% khối lượng tính toán trên Monorepo có hàng chục Microservices.',
        annotations: [
          { line: 6, explanation: 'Khối changes: chỉ kích hoạt Job khi commit thực sự chạm vào thư mục order-service hoặc shared-dto.' },
          { line: 16, explanation: 'Lệnh nx affected tự động phân tích cây import để chỉ chạy test cho đúng những app bị ảnh hưởng bởi git diff.' },
        ],
      },
    ],
    platformComparisons: [
      {
        feature: 'Lọc Đường dẫn cho Monorepo (Path Filtering)',
        githubActionsWay: 'Dùng paths: ["apps/order/**"] ở cấp độ workflow hoặc action dorny/paths-filter@v3 kết hợp Nx/Turborepo.',
        gitlabCiWay: 'Hỗ trợ gốc cực mạnh với rules:changes và Parent-Child Dynamic Pipelines.',
        architecturalNote: 'Khi dùng Monorepo, luôn kết hợp Path Filtering cấp thư mục với công cụ hiểu đồ thị phụ thuộc code như Nx hoặc Turborepo.',
      },
    ],
    gotchas: [
      {
        id: 'gotcha-L3-3-drop-column',
        title: 'Chạy lệnh ALTER TABLE DROP COLUMN hoặc RENAME COLUMN ngay trong cùng đợt Deploy với code mới',
        severity: 'critical',
        symptom: 'Trong 2 phút diễn ra Rolling Update, một nửa số request của khách hàng bị lỗi 500 Internal Server Error (Column does not exist), và nếu bản mới bị lỗi thì KHÔNG THỂ Rollback về bản cũ!',
        whyItHappens: 'Bước Migration chạy trước xóa mất cột cũ trong khi các Pod v1.0 vẫn đang sống và thực hiện câu lệnh SELECT/INSERT vào cột đó!',
        wrongConfig: `-- SAI LẦM CHẾT NGƯỜI: Đổi tên hoặc xóa cột ngay lập tức trong 1 lần deploy
ALTER TABLE users RENAME COLUMN full_name TO display_name;`,
        rightConfig: `-- CHUẨN EXPAND-AND-CONTRACT:
-- Đợt 1 (Expand): Thêm cột mới cho phép NULL, code v1.1 ghi cả 2 cột
ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NULL;`,
        fixExplanation: 'Luôn tuân thủ 3 pha Expand → Backfill & Switch Read → Contract khi thay đổi Schema trên hệ thống Zero-Downtime.',
      },
    ],
    benchmarks: [
      {
        id: 'bench-L3-3-dora',
        title: 'Thước đo 4 Chỉ số DORA cấp độ Elite (DevOps Research and Assessment)',
        claim: 'Các tổ chức đạt mức DORA Elite vừa có tốc độ phát hành nhanh nhất vừa có tỷ lệ lỗi thấp nhất.',
        methodology: 'Chuẩn phân loại quốc tế DORA (PDF Trang 10).',
        metrics: [
          {
            label: '1. Deployment Frequency & 2. Lead Time for Changes',
            valueText: 'Nhiều lần/ngày & Dưới 1 giờ từ Commit → Prod',
            barPercent: 95,
            isOptimal: true,
            note: 'Đo lường tốc độ phản ứng của hệ thống CI/CD.',
          },
          {
            label: '3. Change Failure Rate & 4. MTTR (Khôi phục sự cố)',
            valueText: 'Tỷ lệ lỗi < 15% & Thời gian khôi phục < 1 giờ',
            barPercent: 94,
            isOptimal: true,
            note: 'Nhờ DevSecOps, Canary Release, Expand-and-Contract và Auto-Rollback.',
          },
        ],
        takeaway: 'Tốc độ và Độ ổn định không hề đối lập nhau khi đường ống CI/CD được thiết kế đúng kiến trúc.',
      },
    ],
    bestPractices: [
      'Không bao giờ thực hiện lệnh DROP COLUMN hoặc RENAME COLUMN trong cùng một bản phát hành với thay đổi code.',
      'Đo lường 4 chỉ số DORA hàng tháng để phát hiện sớm nút thắt cổ chai trong quy trình phát triển và vận hành.',
    ],
  },
];
