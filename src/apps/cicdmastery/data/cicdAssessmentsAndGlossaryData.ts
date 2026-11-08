import {
  CicdExamSet,
  CicdFlashcard,
  CicdGlossaryTerm,
} from '../types/cicd.types';

export const CICD_FLASHCARDS: CicdFlashcard[] = [
  {
    id: 'cicd-card-1',
    category: 'Fundamental',
    level: 'fundamental',
    pdfRef: 'Mục 1.1 — Trang 2',
    frontQuestion: 'Sự khác biệt cốt lõi giữa Continuous Delivery và Continuous Deployment là gì?',
    backAnswer:
      'Continuous Delivery tự động đóng gói và đẩy lên Staging, nhưng cần bước bấm nút phê duyệt thủ công (Manual Approval Gate) để lên Production. Continuous Deployment tự động 100% đưa mọi commit vượt qua kiểm thử thẳng lên Production kèm Auto-Rollback.',
    codeSnippet: `# Continuous Delivery (GitLab CI):\nrules: [{ if: '$CI_COMMIT_BRANCH == "main"', when: manual, allow_failure: false }]`,
    keyTakeaway: 'Delivery = Duyệt tay ở cổng Production; Deployment = Tự động 100% lên Production.',
  },
  {
    id: 'cicd-card-2',
    category: 'Fundamental',
    level: 'fundamental',
    pdfRef: 'Mục 1.2 — Trang 3',
    frontQuestion: 'Sự khác biệt về môi trường thực thi giữa các Job trong cùng một Stage và các Step trong cùng một Job là gì?',
    backAnswer:
      'Mỗi Job khởi chạy song song trên một môi trường sạch độc lập (Ephemeral Environment) và KHÔNG tự chia sẻ ổ cứng với Job khác. Các Step bên trong cùng một Job chạy tuần tự và CHIA SẺ chung RAM, CPU cùng thư mục $WORKSPACE.',
    keyTakeaway: 'Khác Job = Khác máy (truyền qua Artifact); Cùng Job khác Step = Cùng máy ($WORKSPACE).',
  },
  {
    id: 'cicd-card-3',
    category: 'Fundamental',
    level: 'basic',
    pdfRef: 'Mục 1.4 — Trang 4 & 5',
    frontQuestion: 'Tại sao trong Full Flow #1 phải dùng cờ --health-cmd pg_isready cho Postgres và cờ --fail cho lệnh curl?',
    backAnswer:
      '--health-cmd pg_isready đảm bảo container PostgreSQL đã thực sự khởi động xong và sẵn sàng nhận kết nối trước khi chạy prisma migrate deploy. Cờ curl --fail ép curl trả về mã thoát khác 0 (exit code != 0) khi ứng dụng trả về lỗi HTTP 500/502.',
    codeSnippet: `curl --fail --retry 5 --retry-delay 3 https://staging.api.company.com/health`,
    keyTakeaway: 'Không có --fail, lệnh curl vẫn trả về exit code 0 kể cả khi server bị lỗi 502 Bad Gateway!',
  },
  {
    id: 'cicd-card-4',
    category: 'Intermediate',
    level: 'basic',
    pdfRef: 'Mục 2.1 — Trang 5',
    frontQuestion: 'Phân biệt đúng bản chất của Cache và Artifact trong CI/CD?',
    backAnswer:
      'Cache dùng để lưu các thư mục thư viện tải từ Internet (~/.npm, ~/.m2, .venv) tái sử dụng GIỮA các lần chạy Pipeline khác nhau (Across Pipelines), khóa theo hashFiles(lockfile). Artifact dùng để lưu sản phẩm biên dịch (dist/, .jar, junit.xml) truyền từ Job trước sang Job sau TRONG CÙNG một Pipeline (Within a Pipeline).',
    keyTakeaway: 'Cache = Thư viện (Across Pipelines); Artifact = Sản phẩm build dist/ (Within a Pipeline).',
  },
  {
    id: 'cicd-card-5',
    category: 'Intermediate',
    level: 'advanced',
    pdfRef: 'Mục 2.2 & 2.3 — Trang 6',
    frontQuestion: 'Kể tên 5 lớp quét bảo mật trong DevSecOps (Shift-Left) và cơ chế xác thực OIDC với Cloud?',
    backAnswer:
      '5 lớp: (1) Secret Scanning (Gitleaks), (2) SAST (Semgrep/SonarQube), (3) SCA (Trivy/Snyk quét lockfile), (4) Container & IaC Scan (Trivy/Checkov), (5) DAST (OWASP ZAP trên Staging). OIDC: CI Server cấp thẻ JWT ngắn hạn có chữ ký số xác nhận repo/branch để đổi lấy Temporary Token (15–60 phút) từ AWS STS / GCP thay vì lưu khóa tĩnh.',
    keyTakeaway: 'OIDC loại bỏ hoàn toàn AWS_SECRET_ACCESS_KEY tĩnh khỏi biến môi trường CI.',
  },
  {
    id: 'cicd-card-6',
    category: 'Intermediate',
    level: 'advanced',
    pdfRef: 'Mục 2.4 — Trang 7 & 8',
    frontQuestion: 'Tại sao trong Full Flow #2 chỉ Job đầu tiên dùng policy: pull-push còn các Job sau dùng policy: pull, và cờ --ignore-unfixed của Trivy có tác dụng gì?',
    backAnswer:
      'Chỉ Job đầu tiên nén và đẩy Cache (pull-push), các Job sau chỉ đọc (pull) giúp tiết kiệm 30–60 giây nén file ở cuối mỗi Job. Cờ --ignore-unfixed trong Trivy chỉ chặn Pipeline với các lỗ hổng CRITICAL/HIGH đã có bản vá từ nhà phát hành, tránh làm tắc nghẽn Pipeline vì lỗi chưa có thuốc chữa.',
    keyTakeaway: 'pull-only tiết kiệm I/O cuối Job; --ignore-unfixed giúp cảnh báo bảo mật luôn khả thi.',
  },
  {
    id: 'cicd-card-7',
    category: 'Advanced',
    level: 'advanced',
    pdfRef: 'Mục 3.1 & 3.2 — Trang 9 & 10',
    frontQuestion: 'So sánh Blue-Green vs. Canary Release và giải thích tại sao GitOps (Pull-based) an toàn hơn Push-based CD?',
    backAnswer:
      'Blue-Green dựng cụm Green song song và chuyển 100% traffic tức thì tại Load Balancer (Rollback < 1s nhưng tốn gấp đôi RAM/CPU). Canary dịch chuyển tăng dần 5% → 25% → 100% dựa trên chỉ số 5xx/P99 (Blast Radius nhỏ nhất). GitOps an toàn hơn vì CI không giữ khóa quản trị K8s; ArgoCD nằm trong cụm K8s nội bộ chủ động PULL từ GitOps Repo.',
    keyTakeaway: 'GitOps đảo chiều từ Push sang Pull: Cụm Production không mở cổng API quản trị ra ngoài cho CI.',
  },
  {
    id: 'cicd-card-8',
    category: 'Advanced',
    level: 'pro',
    pdfRef: 'Mục 3.3 & 3.4 — Trang 10',
    frontQuestion: 'Trình bày 3 pha của Expand-and-Contract DB Migration và 4 chỉ số DORA ở mức Elite?',
    backAnswer:
      '3 pha DB Migration: (1) Expand: Thêm cột mới cho phép NULL + code v1.1 ghi đồng thời 2 cột (Dual-Write); (2) Backfill & Switch Read: Đồng bộ dữ liệu cũ sang cột mới + v1.2 đọc cột mới; (3) Contract: Khi v2.0 ổn định mới DROP COLUMN cũ. 4 chỉ số DORA Elite: Deployment Frequency (nhiều lần/ngày), Lead Time (< 1 giờ), Change Failure Rate (< 15%), MTTR (< 1 giờ).',
    keyTakeaway: 'Không bao giờ DROP/RENAME COLUMN ngay trong khi v1.0 và v2.0 đang cùng chạy Rolling Update.',
  },
  {
    id: 'cicd-card-9',
    category: 'Zero-Downtime',
    level: 'pro',
    pdfRef: 'Mục 4.1 & Tình huống B7 — Trang 11–13 & 21',
    frontQuestion: 'Tại sao cần đủ cả 3 mảnh ghép (Dockerfile dumb-init Exec Form + Express server.close() + K8s preStop sleep 5) mới triệt tiêu được lỗi 502 Bad Gateway?',
    backAnswer:
      '(1) Nếu dùng CMD "npm start", /bin/sh nuốt mất SIGTERM; (2) Nếu thiếu server.close(), app tắt phụp ngay làm đứt giao dịch SQL đang chạy dở; (3) Khi K8s tắt Pod, NGINX Ingress mất 1–3s để cập nhật bảng IP — nếu thiếu preStop: sleep 5, app đóng cổng HTTP ở mili-giây đầu tiên khiến request đang bay tới đâm vào cổng đóng gây lỗi 502!',
    codeSnippet: `ENTRYPOINT ["/usr/bin/dumb-init", "--"]\nCMD ["node", "dist/server.js"]\n# K8s: preStop: { exec: { command: ["/bin/sh", "-c", "sleep 5"] } }`,
    keyTakeaway: 'preStop: sleep 5 chờ Ingress rút xong IP rồi mới gửi SIGTERM vào dumb-init → server.close().',
  },
  {
    id: 'cicd-card-10',
    category: 'Troubleshooting',
    level: 'master',
    pdfRef: 'Phần II — Chuyên đề A2, B2, B3, B5 (Trang 16–20)',
    frontQuestion: 'Giải thích ý nghĩa mã lỗi Exit code 137 trên CI và thứ tự ưu tiên khi lộ AWS Secret Key trên Git?',
    backAnswer:
      'Exit code 137 = 128 + 9 (SIGKILL): Tiến trình ngốn vượt trần RAM của Container nên bị Linux Kernel OOM Killer tiêu diệt. Khi lộ AWS Secret Key trên Git: lệnh git rm hoàn toàn vô tác dụng (vì còn trong .git/objects). Bước 1 bắt buộc là Thu hồi & Xoay vòng khóa ngay lập tức trên AWS IAM (Revoke & Rotate First), sau đó mới dùng git-filter-repo xóa lịch sử.',
    keyTakeaway: '137 = OOM Killer (SIGKILL 9). Lộ Secret = Revoke & Rotate khóa TRƯỚC, xóa lịch sử Git SAU.',
  },
];

export const CICD_EXAM_SETS: CicdExamSet[] = [
  {
    id: 'cicd-exam-1-fundamental',
    title: 'Đề Sát hạch #1: Nền tảng Kiến trúc CI/CD & Lean Pipeline (Cấp độ Fundamental)',
    subtitle: 'Kiểm tra kiến thức Phần I — Cấp độ 1 (Trang 1–5): CI vs. Delivery vs. Deployment, 6 Thực thể, Git Branching & Full Flow #1',
    level: 'fundamental',
    durationMinutes: 15,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q1-1',
        question: 'Trong kiến trúc hệ thống, điểm khác biệt ranh giới giữa Continuous Delivery và Continuous Deployment là gì?',
        options: [
          'Continuous Delivery chỉ chạy Unit Test, còn Continuous Deployment mới đóng gói Docker Image.',
          'Continuous Delivery tự động triển khai lên Staging nhưng cần bước phê duyệt thủ công (Manual Approval Gate) để lên Production; còn Continuous Deployment tự động đưa thẳng lên Production.',
          'Continuous Delivery dành cho GitHub Actions, còn Continuous Deployment dành cho GitLab CI.',
          'Continuous Deployment không cần cơ chế giám sát hay Auto-Rollback.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 1.1 (PDF Trang 2): Continuous Delivery dừng lại trước môi trường Production chờ bấm nút phê duyệt thủ công (Manual Approval Gate), trong khi Continuous Deployment tự động đi thẳng lên Production.',
        pdfRef: 'Mục 1.1 — Trang 2 / 21',
      },
      {
        id: 'q1-2',
        question: 'Nguyên tắc bảo mật sống còn nào được nêu trong Bảng 1.2 đối với thành phần số 6 (Runner / Agent)?',
        options: [
          'Luôn chạy mọi Job bằng quyền root trên máy chủ vật lý.',
          'Tuyệt đối không cho phép Pull Request từ kho Fork lạ chạy trên Self-hosted Runner nằm trong mạng nội bộ.',
          'Tất cả các Job khác nhau phải dùng chung một ổ cứng cố định để tiết kiệm dung lượng.',
          'Không bao giờ đặt timeout cho Runner.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Bảng 1.2 (PDF Trang 3): Pull Request từ kho Fork lạ có thể chứa mã độc do kẻ tấn công sửa trong file workflow; nếu chạy trên Self-hosted Runner nội bộ sẽ làm lộ toàn bộ mạng VPC.',
        pdfRef: 'Mục 1.2 — Trang 3 / 21',
      },
      {
        id: 'q1-3',
        question: 'Trong chiến lược Trunk-Based Development, làm thế nào để các lập trình viên hợp nhất (merge) code vào nhánh main hàng ngày mà không làm lộ các tính năng lớn chưa hoàn thiện cho người dùng cuối?',
        options: [
          'Tạo nhánh release/* kéo dài 3 tháng rồi mới merge.',
          'Ẩn các tính năng chưa hoàn thiện đằng sau Feature Flags (Feature Toggles).',
          'Tắt toàn bộ Pipeline CD trong suốt thời gian phát triển.',
          'Chỉ commit vào máy cá nhân mà không push lên Git.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 1.3 (PDF Trang 3): Trong Trunk-Based Development, những tính năng lớn chưa hoàn thiện được ẩn sau Feature Flags (Feature Toggles) thay vì nằm trên nhánh riêng suốt nhiều tuần.',
        pdfRef: 'Mục 1.3 — Trang 3 / 21',
      },
      {
        id: 'q1-4',
        question: 'Trong Full Flow #1 (.github/workflows/lean-ci-cd.yml), biểu thức cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }} giải quyết bài toán gì?',
        codeContext: `concurrency:\n  group: \${{ github.workflow }}-\${{ github.ref }}\n  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}`,
        options: [
          'Hủy mọi Pipeline đang chạy trên nhánh main khi có Pull Request mới.',
          'Chỉ tự động hủy các lần chạy thừa khi lập trình viên đẩy nhiều commit liên tiếp trên nhánh PR, nhưng bảo vệ nhánh main luôn chạy trọn vẹn.',
          'Xóa toàn bộ lịch sử commit trên nhánh PR.',
          'Tắt tính năng kiểm thử Database trên nhánh main.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Giải thích Full Flow #1 (PDF Trang 5): Biểu thức đảm bảo chỉ tự động hủy các lần chạy cũ trên nhánh PR để tiết kiệm tài nguyên, còn khi đã vào nhánh main thì không được hủy ngang.',
        pdfRef: 'Mục 1.4 — Trang 4 & 5 / 21',
      },
      {
        id: 'q1-5',
        question: 'Tại sao bước Smoke Test ở cuối Full Flow #1 phải viết là curl --fail --retry 5 --retry-delay 3 https://staging.api.company.com/health?',
        options: [
          'Vì nếu thiếu cờ --fail, lệnh curl vẫn trả về exit code 0 (thành công) ngay cả khi máy chủ trả về mã lỗi HTTP 500 hoặc 502.',
          'Vì cờ --fail giúp tăng tốc độ mạng lên gấp 5 lần.',
          'Vì curl mặc định tự động sửa lỗi code trên Staging.',
          'Vì GitHub Actions cấm dùng lệnh curl nếu không có --fail.',
        ],
        correctIndex: 0,
        explanation:
          'Theo Giải thích Full Flow #1 (PDF Trang 5): Nếu ứng dụng trả về mã lỗi HTTP 500/502, chỉ khi có cờ --fail thì lệnh curl mới trả về mã thoát khác 0 (exit code != 0) để báo động đỏ ngay lập tức.',
        pdfRef: 'Mục 1.4 — Trang 5 / 21',
      },
    ],
  },
  {
    id: 'cicd-exam-2-intermediate-devsecops',
    title: 'Đề Sát hạch #2: Tối ưu hóa Hiệu năng, DAG, DevSecOps 5 Lớp & OIDC (Cấp độ Intermediate)',
    subtitle: 'Kiểm tra kiến thức Phần I — Cấp độ 2 (Trang 5–8): Cache vs. Artifact, Sharding, 5 Lớp Bảo mật, OIDC & Full Flow #2',
    level: 'advanced',
    durationMinutes: 20,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q2-1',
        question: 'Phát biểu nào sau đây phân biệt ĐÚNG bản chất của Cache và Artifact?',
        options: [
          'Cache dùng để lưu thư mục dist/ truyền sang bước Deploy; Artifact dùng để lưu ~/.npm.',
          'Cache lưu các thư mục thư viện tải từ Internet (~/.npm, .venv) tái sử dụng GIỮA các lần chạy Pipeline khác nhau (Across Pipelines); Artifact lưu kết quả biên dịch (dist/, .jar, junit.xml) truyền từ Job trước sang Job sau TRONG CÙNG một Pipeline.',
          'Cache và Artifact hoàn toàn giống nhau, chỉ khác tên gọi giữa GitHub và GitLab.',
          'Khóa định danh của Artifact luôn tính theo hashFiles của package-lock.json.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 2.1 (PDF Trang 5): Cache dùng Across Pipelines cho thư viện (~/.npm) gắn khóa hashFiles(lockfile); Artifact dùng Within a Pipeline cho sản phẩm đóng gói (dist/, junit.xml).',
        pdfRef: 'Mục 2.1 — Trang 5 / 21',
      },
      {
        id: 'q2-2',
        question: 'Trong Full Flow #2 (.gitlab-ci.yml), tại sao Job secret_and_sast_scan lại khai báo needs: [] (mảng rỗng)?',
        codeContext: `secret_and_sast_scan:\n  stage: security_and_test\n  needs: []\n  image: returntocorp/semgrep:latest`,
        options: [
          'Để vô hiệu hóa Job đó không cho chạy.',
          'Để kích hoạt đồ thị DAG giúp Job quét bảo mật chạy ngay lập tức ở giây thứ 0 mà không cần chờ bước Lint ở Stage validate hoàn tất.',
          'Để xóa toàn bộ biến môi trường của Job.',
          'Để ép Job chạy sau cùng khi Deploy đã xong.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 2.1 & Full Flow #2 (PDF Trang 6 & 7): needs: [] với mảng rỗng trong đồ thị DAG cho phép Job khởi chạy ngay ở giây thứ 0 mà không cần đợi Stage trước.',
        pdfRef: 'Mục 2.4 — Trang 7 / 21',
      },
      {
        id: 'q2-3',
        question: 'Trong 5 lớp quét bảo mật DevSecOps (Bảng 2.2), công cụ nào thuộc lớp SCA (Software Composition Analysis — Phân tích thư viện mã nguồn mở đối chiếu CVE) và Container Scan?',
        options: [
          'ESLint và Prettier',
          'Trivy (hoặc Snyk / Grype)',
          'PM2 và NGINX',
          'dumb-init và tini',
        ],
        correctIndex: 1,
        explanation:
          'Theo Bảng 2.2 (PDF Trang 6): Trivy là công cụ tiêu chuẩn cho cả lớp 3 (SCA kiểm tra lockfile đối chiếu CVE) và lớp 4 (Container & IaC Scan).',
        pdfRef: 'Mục 2.2 — Trang 6 / 21',
      },
      {
        id: 'q2-4',
        question: 'Tại sao cờ --ignore-unfixed lại rất quan trọng khi chạy lệnh trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH trong Full Flow #2?',
        options: [
          'Để bỏ qua toàn bộ các lỗi bảo mật và luôn cho Pipeline báo xanh.',
          'Chỉ chặn Pipeline đối với những lỗ hổng CRITICAL/HIGH mà nhà phát hành thư viện/OS ĐÃ CÓ bản vá, giúp lập trình viên nâng cấp được ngay và tránh làm tắc nghẽn Pipeline vì các lỗi chưa có bản vá trên toàn cầu.',
          'Để tự động xóa các thư viện bị lỗi khỏi mã nguồn.',
          'Để tắt kết nối mạng của Trivy.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Giải thích Full Flow #2 (PDF Trang 8): Cờ --ignore-unfixed chỉ chặn các lỗi đã có bản vá (fixed), tránh làm tê liệt quy trình phát triển bởi các CVE chưa có bản sửa từ upstream.',
        pdfRef: 'Mục 2.4 — Trang 8 / 21',
      },
      {
        id: 'q2-5',
        question: 'Cơ chế xác thực không mật khẩu OIDC (OpenID Connect) hoạt động như thế nào giữa CI Server và AWS/GCP?',
        options: [
          'Lưu khóa tĩnh AWS_SECRET_ACCESS_KEY vào file .env trong kho Git.',
          'Khi Job chạy, CI Server cấp một thẻ JWT Token ngắn hạn có chữ ký số xác nhận danh tính kho Git và tên nhánh; AWS STS / GCP Workload Identity kiểm tra chữ ký đó và cấp lại một Temporary Token tự hủy sau 15–60 phút.',
          'Gửi mật khẩu root của AWS qua tin nhắn Slack cho lập trình viên nhập vào CI.',
          'Mở toàn bộ quyền truy cập công khai không cần xác thực cho cụm Production.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 2.3 (PDF Trang 6): OIDC Federation dùng JWT Token có chữ ký số của CI Server để đổi lấy Temporary Token ngắn hạn (15–60 phút) từ AWS STS / GCP.',
        pdfRef: 'Mục 2.3 — Trang 6 / 21',
      },
    ],
  },
  {
    id: 'cicd-exam-3-advanced-and-warroom',
    title: 'Đề Sát hạch #3: Zero-Downtime, GitOps, DB Migration & Xử lý Sự cố Thực chiến (Advanced & Master)',
    subtitle: 'Kiểm tra kiến thức Cấp độ 3, Phần Mở rộng & Phần II (Trang 8–21): Blue-Green/Canary, GitOps, Expand-and-Contract, Full Flow #3/#4 & Tình huống B1–B7',
    level: 'master',
    durationMinutes: 25,
    passingScorePercent: 80,
    questions: [
      {
        id: 'q3-1',
        question: 'Trong kiến trúc GitOps (Pull-based CD với ArgoCD — Hình 3.2), tại sao cụm Production Kubernetes lại an toàn hơn mô hình Push-based truyền thống?',
        options: [
          'Vì CI Runner giữ mật khẩu root của cụm Production và chạy lệnh ssh.',
          'Vì cụm Production nằm trong mạng nội bộ đóng kín, không mở cổng API quản trị ra ngoài cho CI Server; ArgoCD Controller bên trong cụm chủ động kéo (PULL) cấu hình từ GitOps Config Repo về và tự động đồng bộ (Reconcile).',
          'Vì GitOps không sử dụng Docker Image hay Container Registry.',
          'Vì GitOps xóa toàn bộ lịch sử Git sau mỗi lần triển khai.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Mục 3.2 & Hình 3.2 (PDF Trang 9–10): Mô hình GitOps đảo ngược luồng từ Push sang Pull — ArgoCD nằm bên trong cụm chủ động Pull từ Git Manifest Repo, giúp cụm Production đóng kín hoàn toàn trước CI Server bên ngoài.',
        pdfRef: 'Mục 3.2 — Trang 9 & 10 / 21',
      },
      {
        id: 'q3-2',
        question: 'Khi chạy Rolling Update hoặc Canary Release, tại sao phải áp dụng mẫu thiết kế 3 pha Expand-and-Contract cho Database Migration?',
        options: [
          'Vì trong quá trình chuyển giao, cả code cũ (v1.0) và code mới (v2.0) cùng truy cập vào một Database tại cùng thời điểm; nếu xóa hoặc đổi tên cột ngay sẽ làm Pod v1.0 bị lỗi và không thể Rollback.',
          'Để giảm dung lượng ổ cứng của CI Runner.',
          'Vì Kubernetes tự động xóa bảng Database mỗi khi tạo Pod mới.',
          'Để bỏ qua việc viết câu lệnh SQL.',
        ],
        correctIndex: 0,
        explanation:
          'Theo Mục 3.3 (PDF Trang 10): Khi v1.0 và v2.0 cùng chạy song song, mọi thay đổi Schema phải chia làm 3 pha tương thích ngược: Expand (thêm cột NULL + Dual-Write) → Backfill & Switch Read → Contract (DROP COLUMN khi v2.0 đã ổn định).',
        pdfRef: 'Mục 3.3 — Trang 10 / 21',
      },
      {
        id: 'q3-3',
        question: 'Trong Tình huống B7 & Full Flow #3, nguyên nhân gốc rễ nào gây ra 50–100 request bị lỗi 502 Bad Gateway mỗi khi Kubernetes tắt Pod cũ lúc đông người dùng?',
        options: [
          'Do CPU của máy lập trình viên bị quá nhiệt.',
          'Sự bất đồng bộ 1–3 giây khi rút Pod cũ: Kubernetes gửi SIGTERM vào Container song song với việc báo NGINX Ingress cập nhật danh sách IP; ứng dụng nhận SIGTERM đã lập tức đóng cổng HTTP ở mili-giây đầu tiên trong khi Ingress mất 1–3 giây mới rút xong IP!',
          'Do dùng định dạng YAML thay vì JSON.',
          'Do cổng 3000 không hỗ trợ giao thức HTTP.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Tình huống B7 (PDF Trang 21): Việc đồng bộ bảng định tuyến của Ingress mất 1–3 giây, nên phải thêm lifecycle.preStop ("sleep 5") để chờ Ingress rút sạch IP trước khi gửi SIGTERM vào ứng dụng.',
        pdfRef: 'Tình huống B7 — Trang 21 / 21',
      },
      {
        id: 'q3-4',
        question: 'Trong Tình huống B2 (Hai PR merge cách nhau 30s, Commit B xong trước lên Prod rồi bị Commit A xong sau ghi đè code cũ lên), cấu hình Concurrency chuẩn cho Job Deploy Production (CD) là gì?',
        options: [
          'Đặt cancel-in-progress: true cho Job Deploy Production để hủy ngang lệnh Helm/Terraform đang chạy dở.',
          'Tuyệt đối KHÔNG hủy ngang (cancel-in-progress: false) để tránh làm hỏng State Lock của hạ tầng, mà đưa vào hàng đợi khóa tuần tự (group: production-deploy-lock / resource_group newest_first) và chỉ giữ lại bản mới nhất chờ chạy.',
          'Cấm lập trình viên merge code vào buổi chiều.',
          'Xóa nhánh main sau mỗi lần merge.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Tình huống B2 (PDF Trang 18): Ở nhánh PR (CI) thì bật cancel-in-progress: true, nhưng ở bước Deploy Production (CD) bắt buộc đặt cancel-in-progress: false kết hợp khóa hàng đợi tuần tự để bảo vệ State Lock và chống ghi đè.',
        pdfRef: 'Tình huống B2 — Trang 18 / 21',
      },
      {
        id: 'q3-5',
        question: 'Trong Tình huống B3, khi lập trình viên vô tình commit file chứa AWS Secret Key và Database Password lên kho Git, hành động ĐẦU TIÊN theo đúng thứ tự ưu tiên là gì?',
        options: [
          'Chạy lệnh git rm file đó rồi tạo một commit mới đẩy lên.',
          'Bước 1 — Thu hồi và Xoay vòng khóa ngay lập tức (Revoke & Rotate First): Vô hiệu hóa AWS Access Key trên IAM, đổi mật khẩu Database và thay khóa ký JWT TRƯỚC KHI dọn dẹp lịch sử Git bằng git-filter-repo.',
          'Đổi tên kho Git sang tên khác.',
          'Chờ 1 tuần xem có ai phát hiện không rồi mới xử lý.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Tình huống B3 (PDF Trang 19): Lệnh git rm hoàn toàn không có tác dụng bảo mật vì mật khẩu vẫn nằm trong .git/objects. Phải coi mọi thông tin chạm vào Git là đã lộ hoàn toàn và thực hiện Bước 1 (Revoke & Rotate First) ngay lập tức!',
        pdfRef: 'Tình huống B3 — Trang 19 / 21',
      },
      {
        id: 'q3-6',
        question: 'Trong Tình huống B5 ("Works on Local, Fails on CI"), khi tiến trình build/test trên CI tự ngắt với mã thoát Exit code 137, nguyên nhân kỹ thuật là gì?',
        options: [
          'Sai cú pháp dấu chấm phẩy trong file JavaScript.',
          'Mã 137 = 128 + 9 (SIGKILL): Tiến trình build/test ngốn vượt trần RAM của Container nên bị Linux Kernel OOM Killer tiêu diệt.',
          'Lập trình viên quên cài đặt Git trên máy cá nhân.',
          'File script chứa ký tự xuống dòng CRLF của Windows.',
        ],
        correctIndex: 1,
        explanation:
          'Theo Bảng B5 (PDF Trang 20): Mã 137 = 128 + 9 (SIGKILL) do tiến trình vượt trần RAM của Container và bị Linux Kernel OOM Killer tiêu diệt. Khắc phục bằng NODE_OPTIONS="--max-old-space-size=3072", giảm số worker hoặc tăng RAM Runner.',
        pdfRef: 'Tình huống B5 — Trang 20 / 21',
      },
    ],
  },
];

export const CICD_GLOSSARY_TERMS: CicdGlossaryTerm[] = [
  {
    id: 'term-ci',
    term: 'Continuous Integration (CI)',
    category: 'Core Architecture',
    level: 'fundamental',
    shortDef: 'Quy trình hợp nhất mã nguồn vào nhánh chung nhiều lần mỗi ngày kèm Build, Lint và Automated Test.',
    deepExplanation:
      'Mục tiêu cốt lõi của CI là phát hiện lỗi sớm nhất có thể (Fail Fast) và loại bỏ tình trạng xung đột diện rộng (Merge Hell) khi ghép code muộn.',
    codeExample: `on:\n  push: { branches: ["main"] }\n  pull_request: { branches: ["main"] }`,
    relatedTerms: ['Continuous Delivery', 'Continuous Deployment', 'Fail Fast'],
  },
  {
    id: 'term-cd-delivery',
    term: 'Continuous Delivery (CD)',
    category: 'Core Architecture',
    level: 'fundamental',
    shortDef: 'Tự động đóng gói và triển khai lên Staging, nhưng cần bước phê duyệt thủ công (Manual Approval Gate) để lên Production.',
    deepExplanation:
      'Đảm bảo mã nguồn luôn ở trạng thái sẵn sàng phát hành bất cứ lúc nào, đồng thời tuân thủ nguyên tắc Phân tách nhiệm vụ (Segregation of Duties) trong các ngành Tài chính, Ngân hàng, Y tế (PCI-DSS, SOC2).',
    codeExample: `rules:\n  - if: '$CI_COMMIT_BRANCH == "main"'\n    when: manual\n    allow_failure: false`,
    relatedTerms: ['Continuous Deployment', 'Manual Approval Gate', 'Protected Environments'],
  },
  {
    id: 'term-cd-deployment',
    term: 'Continuous Deployment (CD)',
    category: 'Core Architecture',
    level: 'basic',
    shortDef: 'Cấp độ tự động hóa cao nhất: mọi commit vượt qua kiểm thử tự động đi thẳng lên Production không cần con người can thiệp.',
    deepExplanation:
      'Đòi hỏi lưới kiểm thử tự động đa tầng vững chắc, Feature Flags, giám sát thời gian thực (Observability) và cơ chế tự động hoàn tác (Auto-Rollback).',
    relatedTerms: ['Continuous Delivery', 'Feature Flags', 'Canary Release'],
  },
  {
    id: 'term-dag',
    term: 'DAG (Directed Acyclic Graph)',
    category: 'Optimization & DORA',
    level: 'basic',
    shortDef: 'Đồ thị phụ thuộc trực tiếp giữa các Job thông qua từ khóa needs: [...].',
    deepExplanation:
      'Thay vì bắt mọi Job ở Stage sau phải đợi toàn bộ Stage trước hoàn tất, từ khóa needs: [...] (hoặc needs: [] để chạy ngay ở giây thứ 0) giúp phá bỏ điểm nghẽn tuần tự.',
    codeExample: `secret_and_sast_scan:\n  stage: security_and_test\n  needs: [] # Chạy ngay ở giây thứ 0!`,
    relatedTerms: ['Test Sharding', 'Stage', 'Job'],
  },
  {
    id: 'term-test-sharding',
    term: 'Test Sharding & Matrix Strategy',
    category: 'Optimization & DORA',
    level: 'basic',
    shortDef: 'Chia bộ kiểm thử lớn thành N phần chạy đồng thời trên N Container song song.',
    deepExplanation:
      'Sử dụng parallel: 4 trên GitLab CI (cấp biến $CI_NODE_INDEX/$CI_NODE_TOTAL) hoặc strategy.matrix trên GitHub Actions kết hợp cờ --shard=1/4 để rút ngắn thời gian chạy test đi N lần.',
    codeExample: `parallel: 4\nscript:\n  - npx jest --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL --ci`,
    relatedTerms: ['DAG', 'Ephemeral Environment'],
  },
  {
    id: 'term-oidc',
    term: 'OIDC (OpenID Connect Federation)',
    category: 'DevSecOps & Cloud',
    level: 'advanced',
    shortDef: 'Chuẩn xác thực không mật khẩu giữa CI Server và Cloud (AWS STS / GCP Workload Identity) bằng thẻ JWT ngắn hạn.',
    deepExplanation:
      'Thay thế hoàn toàn cặp khóa tĩnh AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY bằng JWT Token có chữ ký số xác nhận repo và branch, đổi lấy Temporary Token tự hủy sau 15–60 phút.',
    codeExample: `permissions:\n  id-token: write\n  contents: read`,
    relatedTerms: ['Shift-Left Security', 'Secret Scanning'],
  },
  {
    id: 'term-gitops',
    term: 'GitOps (Pull-based CD)',
    category: 'Deployment & GitOps',
    level: 'pro',
    shortDef: 'Kiến trúc triển khai đảo ngược: Agent bên trong cụm Kubernetes (ArgoCD/FluxCD) chủ động kéo (Pull) cấu hình từ Git.',
    deepExplanation:
      'Giúp cụm Production đóng kín cổng quản trị từ bên ngoài, không cần cấp quyền cluster-admin cho CI Runner, đồng thời tự động phát hiện và sửa lỗi lệch cấu hình (Configuration Drift).',
    relatedTerms: ['ArgoCD', 'Configuration Drift', 'Single Source of Truth'],
  },
  {
    id: 'term-expand-contract',
    term: 'Expand-and-Contract Pattern',
    category: 'Deployment & GitOps',
    level: 'pro',
    shortDef: 'Mẫu thiết kế 3 pha giúp thay đổi Schema Database không gây gián đoạn khi chạy Rolling Update hoặc Canary.',
    deepExplanation:
      'Gồm Pha 1 (Expand: Thêm cột NULL + Dual-Write ghi cả 2 cột), Pha 2 (Backfill dữ liệu cũ & chuyển sang đọc cột mới), và Pha 3 (Contract: Xóa cột cũ bằng DROP COLUMN khi bản mới đã ổn định 100%).',
    relatedTerms: ['Rolling Update', 'Canary Release', 'Zero-Downtime'],
  },
  {
    id: 'term-dora',
    term: 'DORA Metrics (4 Chỉ số DORA)',
    category: 'Optimization & DORA',
    level: 'pro',
    shortDef: 'Bộ 4 chỉ số tiêu chuẩn quốc tế đo lường Tốc độ và Độ ổn định của hệ thống CI/CD.',
    deepExplanation:
      'Gồm: (1) Deployment Frequency (Tần suất triển khai — Elite: nhiều lần/ngày), (2) Lead Time for Changes (Thời gian từ commit đến Production — Elite: < 1 giờ), (3) Change Failure Rate (Tỷ lệ lỗi — Elite: < 15%), và (4) MTTR (Thời gian khôi phục trung bình — Elite: < 1 giờ).',
    relatedTerms: ['Auto-Rollback', 'Lead Time', 'MTTR'],
  },
  {
    id: 'term-graceful-shutdown',
    term: 'Graceful Shutdown & preStop Hook',
    category: 'Zero-Downtime & K8s',
    level: 'pro',
    shortDef: 'Cơ chế phối hợp giữa K8s preStop (sleep 5), dumb-init (PID 1) và server.close() để đạt 0% lỗi 502 Bad Gateway.',
    deepExplanation:
      'Khi tắt Pod cũ, preStop ngủ 5 giây chờ NGINX Ingress rút xong IP khỏi bảng định tuyến, sau đó gửi SIGTERM qua dumb-init (Exec Form) vào ứng dụng để ngừng nhận kết nối mới nhưng xử lý nốt 100% các giao dịch đang dở trước khi đóng DB Pool.',
    codeExample: `ENTRYPOINT ["/usr/bin/dumb-init", "--"]\nCMD ["node", "dist/server.js"]`,
    relatedTerms: ['Readiness Probe', 'Exit Code 137', 'Kaniko Rootless'],
  },
];
