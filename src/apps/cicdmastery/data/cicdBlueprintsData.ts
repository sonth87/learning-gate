import { CicdFullFlowBlueprint } from '../types/cicd.types';

export const CICD_FULL_FLOW_BLUEPRINTS: CicdFullFlowBlueprint[] = [
  {
    id: 'full-flow-1-lean-github-actions',
    badge: 'Full Flow #1 (Level 1)',
    title: 'Lean CI/CD Pipeline với Service Containers (Postgres 16 + Redis 7) & Auto-Deploy Staging',
    subtitle: 'Từ Mục 1.4 (PDF Trang 3–5): Kiểm soát Concurrency, Kiểm thử DB thật, Truyền Artifact & Smoke Test',
    level: 'basic',
    pdfRef: 'Full Flow #1 — Trang 4 & 5 / 21',
    architectureOverview:
      'Tệp cấu hình GitHub Actions hoàn chỉnh cho một dự án thực tế: tự động hủy các lần chạy thừa khi lập trình viên đẩy commit liên tiếp trên PR, dựng Container PostgreSQL 16 & Redis 7 tạm thời để chạy Integration Test thật, đóng gói bản dựng truyền qua Artifact và tự động triển khai lên môi trường Staging kèm bước kiểm tra sức khỏe (Smoke Test).',
    asciiFlow: `git push / PR (main)
  └──► [Concurrency Guard: cancel-in-progress on PR, keep on main]
         └──► Job 1: verify-and-build (ubuntu-24.04, timeout: 12m)
                ├── Services: postgres:16-alpine (pg_isready) + redis:7-alpine
                ├── Step 1-3: checkout@v4 → setup-node@v4 (cache npm) → npm ci
                ├── Step 4: lint && typecheck && prisma migrate deploy && test:ci
                └── Step 5-6: npm run build → upload-artifact (build-\${{ github.sha }})
                       └──► Job 2: deploy-staging (needs: verify-and-build, only push main)
                              ├── Step 1: download-artifact (build-\${{ github.sha }})
                              └── Step 2: ./scripts/deploy-staging.sh && curl --fail --retry 5 /health`,
    files: [
      {
        path: '.github/workflows/lean-ci-cd.yml',
        language: 'yaml',
        roleBadge: 'GitHub Actions Workflow',
        summary: 'Tệp cấu hình chính điều phối Verify, Service Containers, Build Artifact và Deploy Staging.',
        content: `name: Lean CI/CD Pipeline (Verify, Build & Staging Deploy)
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
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 3s --health-retries 5
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
        highlights: [
          {
            title: 'Khối concurrency thông minh',
            detail: 'Biểu thức github.ref != \'refs/heads/main\' chỉ hủy lần chạy cũ trên PR, bảo vệ nhánh main chạy trọn vẹn.',
          },
          {
            title: 'Service Containers thật (Postgres 16 + Redis 7)',
            detail: 'Dùng --health-cmd pg_isready để đợi DB sẵn sàng trước khi chạy prisma migrate deploy.',
          },
        ],
      },
      {
        path: 'scripts/deploy-staging.sh',
        language: 'bash',
        roleBadge: 'Deploy & Smoke Script',
        summary: 'Script đồng bộ gói dist/ đã kiểm định lên máy chủ Staging.',
        content: `#!/usr/bin/env bash
set -euo pipefail

echo "[DEPLOY-STAGING] Bắt đầu triển khai gói dist/ lên môi trường Staging..."
# Bật set -euo pipefail để dừng ngay lập tức nếu bất kỳ lệnh nào trả về exit code != 0
rsync -avz --delete ./dist/ deploy@staging.api.company.com:/var/www/app/dist/
ssh deploy@staging.api.company.com "pm2 reload ecosystem.config.js --update-env"
echo "[DEPLOY-STAGING] Cập nhật tiến trình hoàn tất. Chuyển sang bước Smoke Test..."`,
        highlights: [
          {
            title: 'set -euo pipefail',
            detail: 'Chuẩn mực viết Shell Script trong CI/CD: tự động dừng và trả về mã lỗi nếu có biến rỗng hoặc lệnh trong pipe bị lỗi.',
          },
        ],
      },
    ],
    interactiveCommands: [
      {
        command: 'gh workflow run lean-ci-cd.yml --ref feature/payment-v2',
        label: 'Test Push 3 Commit trên PR (Concurrency Cancel)',
        simulatedOutput: `[Concurrency] Group: Lean CI/CD Pipeline-refs/pull/42/merge
[Concurrency] Phát hiện 2 lần chạy cũ (#101, #102) trên nhánh PR -> CANCELLED!
[Runner ubuntu-24.04] Khởi chạy Run #103 (timeout: 12m)...
[Services] Starting postgres:16-alpine (5432) & redis:7-alpine (6379)...
[Healthcheck] pg_isready -> localhost:5432 - accepting connections (OK)
[Step 3] npm ci -> Added 642 packages from cache in 2.4s
[Step 4] eslint: 0 errors | tsc: 0 errors | prisma migrate: 3 migrations applied | jest: 48/48 passed!
[Step 6] Artifact 'build-9f8e7d6' (4.2 MB) uploaded successfully.
[Job deploy-staging] Skipped (Condition: github.ref == 'refs/heads/main' is false on PR).`,
      },
      {
        command: 'git checkout main && git merge feature/payment-v2 && git push',
        label: 'Merge vào main (Full Verify + Deploy Staging + Smoke Test)',
        simulatedOutput: `[Trigger] Event: push on refs/heads/main (cancel-in-progress: false)
[Job verify-and-build] PASSED in 1m 42s -> Uploaded artifact 'build-a1b2c3d'
[Job deploy-staging] Downloading artifact 'build-a1b2c3d' into dist/...
[Deploy] ./scripts/deploy-staging.sh -> PM2 zero-downtime reload completed.
[Smoke Test] curl --fail --retry 5 https://staging.api.company.com/health
  Attempt 1: HTTP 200 OK {"status":"ready","db":"connected","redis":"ok"}
[Pipeline] SUCCESS — Staging environment https://staging.api.company.com is live!`,
      },
    ],
  },
  {
    id: 'full-flow-2-gitlab-devsecops',
    badge: 'Full Flow #2 (Level 2)',
    title: 'Pipeline DevSecOps 5 Giai đoạn + Đồ thị DAG + Trivy Scan + Quy trình Phê duyệt Production',
    subtitle: 'Từ Mục 2.4 (PDF Trang 6–8): Cache pull-push/pull, Test Sharding 4x, Semgrep SAST, Trivy & Manual Gate',
    level: 'advanced',
    pdfRef: 'Full Flow #2 — Trang 7 & 8 / 21',
    architectureOverview:
      'Đường ống GitLab CI cấp độ Doanh nghiệp đi qua 5 giai đoạn: Kiểm tra Linter và làm ấm Cache (pull-push) → Chạy song song 4 luồng Test Sharding (policy: pull) và quét Semgrep SAST ngay ở giây thứ 0 bằng DAG (needs: []) → Đóng gói Docker Image và quét CVE bằng Trivy (--ignore-unfixed) → Tự động lên Staging với khóa resource_group → Dừng chờ Tech Lead bấm nút Phê duyệt (Manual Approval Gate) mới lên Production.',
    asciiFlow: `Stage 1: validate          Stage 2: security_and_test         Stage 3: package             Stage 4 & 5: deploy
┌────────────────────┐     ┌────────────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│lint_and_warm_cache │────►│unit_and_integration (4x)   │────►│build_and_trivy_scan  │────►│deploy_to_staging     │
│(policy: pull-push) │     │(parallel: 4, policy: pull) │     │Docker + Trivy HIGH   │     │(resource_group lock) │
└────────────────────┘     └────────────────────────────┘     └──────────────────────┘     └──────────┬───────────┘
                           ┌────────────────────────────┐                ▲                            │
(Giây thứ 0 - DAG) ───────►│secret_and_sast_scan        │────────────────┘                            ▼
                           │(needs: [], Semgrep SAST)   │                                  ┌──────────────────────┐
                           └────────────────────────────┘                                  │approve_and_deploy    │
                                                                                           │(when: manual, Gate)  │
                                                                                           └──────────────────────┘`,
    files: [
      {
        path: '.gitlab-ci.yml',
        language: 'yaml',
        roleBadge: 'Enterprise GitLab Pipeline',
        summary: 'Tệp cấu hình 5 giai đoạn tích hợp DAG, Sharding, Semgrep, Trivy và Manual Approval Gate.',
        content: `stages: [ "validate", "security_and_test", "package", "deploy_staging", "deploy_prod" ]

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
        highlights: [
          {
            title: 'Chiến lược Cache pull-push vs. pull',
            detail: 'Chỉ lint_and_warm_cache nén đẩy Cache; 4 container test phía sau chỉ pull giúp tiết kiệm 30–60s mỗi máy.',
          },
          {
            title: 'Trivy --ignore-unfixed',
            detail: 'Chỉ chặn Pipeline với các lỗ hổng CRITICAL/HIGH đã có bản vá từ nhà phát hành.',
          },
        ],
      },
    ],
    interactiveCommands: [
      {
        command: 'gitlab-runner exec docker secret_and_sast_scan',
        label: 'Chạy thử Quét Bảo mật Semgrep SAST & Trivy Scan',
        simulatedOutput: `[DAG Engine] secret_and_sast_scan started at t=0.0s (needs: [])
[Semgrep] Scanning 142 files with ruleset 'auto' (OWASP Top 10, SQLi, XSS, Secrets)...
[Semgrep] 0 blocking findings! Passed in 18s.
[Test Sharding] 4/4 containers (jest --shard=1/4..4/4) completed 1,200 tests in 2m 54s!
[Trivy Scan] Scanning image registry.app.vn/core:a1b2c3d (--ignore-unfixed --severity CRITICAL,HIGH)...
[Trivy Scan] OS (alpine 3.20): 0 CRITICAL, 0 HIGH | Node.js deps: 0 CRITICAL, 0 HIGH -> EXIT 0
[Staging] Deployed to https://staging.app.vn (resource_group: staging-cluster-lock)
[Production Gate] Job 'approve_and_deploy_prod' is BLOCKED (when: manual, allow_failure: false) — Waiting for Tech Lead approval!`,
      },
    ],
  },
  {
    id: 'full-flow-3-zero-downtime-suite',
    badge: 'Full Flow #3 (Zero-Downtime)',
    title: 'Bộ 3 Mảnh ghép Code & Cấu hình Đạt Zero-Downtime Tuyệt đối (0% Lỗi 502 Bad Gateway)',
    subtitle: 'Từ Mục 4.1 & Tình huống B7 (PDF Trang 11–13 & 21): Dockerfile dumb-init + Express SIGTERM + K8s Manifest',
    level: 'pro',
    pdfRef: 'Full Flow #3 — Trang 11, 12 & 13 / 21',
    architectureOverview:
      'Để không bị rớt bất kỳ kết nối nào (không bị lỗi 502 Bad Gateway) trong lúc CI/CD đang cập nhật phiên bản mới, cả 3 tầng Đóng gói Docker (Multi-stage + dumb-init + Exec Form) → Mã nguồn Ứng dụng (Readiness Probe + SIGTERM server.close) → Cấu hình Hạ tầng Kubernetes (maxUnavailable: 0 + preStop: sleep 5) phải khớp với nhau tuyệt đối.',
    asciiFlow: `[K8s RollingUpdate: maxSurge=1, maxUnavailable=0]
  1. Khởi tạo Pod v2.0 mới ──► Gọi /health/ready (SELECT 1) ──► 2 lần 200 OK liên tiếp ──► Mở van Traffic vào v2.0
  2. Quyết định tắt Pod v1.0 cũ:
       ├── Luồng A (Mạng): NGINX Ingress rút IP của Pod v1.0 khỏi bảng định tuyến (Mất 1–3 giây)
       └── Luồng B (Pod v1.0): Chạy preStop Hook ("sleep 5") đợi Ingress rút xong IP!
             └──► Hết 5s: Gửi SIGTERM vào PID 1 (/usr/bin/dumb-init)
                    └──► Chuyển tiếp SIGTERM vào Node.js: process.on('SIGTERM')
                           ├── Đặt isShuttingDown = true (/health/ready trả 503 draining)
                           ├── Gọi server.close(): Ngừng nhận TCP mới, giữ sống request đang thanh toán dở
                           └── Khi toàn bộ HTTP request xong: dbPool.end() → redis.quit() → process.exit(0)`,
    files: [
      {
        path: 'Dockerfile',
        language: 'dockerfile',
        roleBadge: 'Mảnh ghép 1/3: Dockerfile',
        summary: 'Multi-Stage Build + Non-Root User (node) + dumb-init làm PID 1 + Exec Form chuyển tiếp SIGTERM.',
        content: `# --- STAGE 1: BUILDER (Chứa đầy đủ công cụ biên dịch TypeScript/Go/Java, nhưng không đưa lên Production) ---
FROM node:20-alpine AS builder
WORKDIR /app
# Copy file khai báo thư viện trước để tận dụng tối đa Docker Layer Cache khi chỉ sửa code trong thư mục src/
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --omit=dev # Biên dịch sang JS rồi xóa toàn bộ devDependencies nặng nề

# --- STAGE 2: PRODUCTION RUNTIME (Siêu nhẹ, bảo mật, chạy bằng tài khoản non-root và giữ nguyên tín hiệu OS) ---
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init # Cài đặt dumb-init làm PID 1 để chuyển tiếp SIGTERM chính xác vào Node.js
WORKDIR /app
ENV NODE_ENV=production
USER node # Hạ quyền xuống user 'node' (UID 1000) để chống leo thang đặc quyền nếu ứng dụng bị khai thác
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
EXPOSE 3000
# BẮT BUỘC dùng Exec Form (ngoặc vuông) kết hợp dumb-init; tuyệt đối không viết CMD "npm start"
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "node", "dist/server.js" ]`,
        highlights: [
          {
            title: 'Tại sao cấm dùng CMD "npm start"?',
            detail: 'Dạng chuỗi khởi chạy /bin/sh chiếm PID 1 và nuốt mất tín hiệu SIGTERM khiến hàm graceful shutdown không bao giờ chạy.',
          },
        ],
      },
      {
        path: 'src/server.ts',
        language: 'typescript',
        roleBadge: 'Mảnh ghép 2/3: Backend Code',
        summary: 'Xử lý Readiness Probe (/health/ready) và bắt tín hiệu SIGTERM đóng kết nối êm ái.',
        content: `import express from 'express';
import { dbPool, redisClient } from './infra';
const app = express();
let isShuttingDown = false; // Cờ trạng thái báo hiệu tiến trình đang trong pha chuẩn bị tắt

// [1] ENDPOINT READINESS PROBE: Kubernetes gọi mỗi 3 giây để quyết định có đổ lưu lượng người dùng vào Pod này không
app.get('/health/ready', async (req, res) => {
  if (isShuttingDown) return res.status(503).json({ status: 'draining' }); // Báo 503 ngay khi bắt đầu tắt để ngắt luồng
  await dbPool.query('SELECT 1'); // Kiểm tra kết nối Database thực tế đã sẵn sàng chưa
  return res.status(200).json({ status: 'ready' });
});

const server = app.listen(3000);

// [2] XỬ LÝ GRACEFUL SHUTDOWN KHI NHẬN TÍN HIỆU SIGTERM TỪ KUBERNETES / DOCKER
process.on('SIGTERM', async () => {
  isShuttingDown = true;
  // Ngừng nhận kết nối TCP mới, nhưng GIỮ SỐNG các request đang xử lý dở (ví dụ đang thanh toán đơn hàng)
  server.close(async () => {
    await dbPool.end(); // Chỉ đóng kết nối Database sau khi toàn bộ HTTP request đang chạy đã trả kết quả xong
    await redisClient.quit();
    process.exit(0); // Thoát sạch với mã 0
  });
});`,
        highlights: [
          {
            title: 'Đóng DB Pool bên trong callback của server.close()',
            detail: 'Đảm bảo các câu lệnh SQL của giao dịch đang chạy dở được hoàn tất 100% trước khi ngắt kết nối Database.',
          },
        ],
      },
      {
        path: 'k8s/deployment.yaml',
        language: 'yaml',
        roleBadge: 'Mảnh ghép 3/3: K8s Manifest',
        summary: 'Cấu hình RollingUpdate (maxUnavailable: 0) + Readiness Probe + preStop Hook (sleep 5).',
        content: `apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service, namespace: production }
spec:
  replicas: 4
  # [1] CHIẾN LƯỢC CUỐN CHIẾU: maxUnavailable=0 bắt buộc Pod v2.0 mới phải Sống & Ready trước khi được phép tắt Pod v1.0 cũ
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    spec:
      terminationGracePeriodSeconds: 35 # Cho phép tối đa 35 giây để hoàn tất preStop + Graceful Shutdown trước khi SIGKILL
      containers:
        - name: app
          image: registry.company.com/order-service:a1b2c3d
          # [2] READINESS PROBE: Chỉ khi /health/ready trả về 200 OK trong 2 lần liên tiếp thì Ingress mới mở van lưu lượng
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
            periodSeconds: 3
            successThreshold: 2
          # [3] PRESTOP HOOK: Ngủ 5 giây chờ NGINX Ingress rút xong IP của Pod khỏi bảng định tuyến rồi mới gửi SIGTERM
          lifecycle:
            preStop: { exec: { command: [ "/bin/sh", "-c", "sleep 5" ] } }`,
        highlights: [
          {
            title: 'preStop: sleep 5',
            detail: 'Chờ NGINX Ingress cập nhật xong bảng Endpoints (mất 1–3s) trước khi gửi SIGTERM đóng cổng HTTP của ứng dụng.',
          },
        ],
      },
    ],
    interactiveCommands: [
      {
        command: 'kubectl rollout status deployment/order-service -n production',
        label: 'Chạy Kiểm tra Cuốn chiếu Zero-Downtime (0% Dropped Requests)',
        simulatedOutput: `[K8s Rollout] Creating new Pod order-service-v2-8f9c (maxSurge: 1, maxUnavailable: 0)...
[ReadinessProbe] GET /health/ready -> 200 OK (1/2) ... 200 OK (2/2) -> Pod v2 is READY!
[Terminating Pod v1] Running preStop hook: /bin/sh -c "sleep 5"
  [t=1.8s] NGINX Ingress removed Pod v1 IP (10.244.1.14) from upstream pool.
  [t=5.0s] preStop finished -> Sending SIGTERM to PID 1 (dumb-init) -> Forwarded to Node.js!
  [t=5.0s] server.close() called: Waiting for 3 in-flight payment requests to finish...
  [t=6.4s] All 3 in-flight requests returned HTTP 200 OK -> Closing dbPool & redisClient -> Exit 0!
[Result] Rollout complete! Total requests processed: 14,500 | HTTP 502 Bad Gateway: 0 (Zero-Downtime Verified!)`,
      },
    ],
  },
  {
    id: 'full-flow-4-ai-review-codeowners',
    badge: 'Full Flow #4 (AI & Governance)',
    title: 'Phân quyền Đa tầng (.github/CODEOWNERS + OIDC) & AI Review Tự động (CodeRabbit + Self-Hosted Qodo PR-Agent)',
    subtitle: 'Từ Mục 4.3 & 4.4 (PDF Trang 14–16): Huấn luyện AI bắt lỗi SQL Lock CONCURRENTLY, N+1 Query & Bảo mật Mã nguồn',
    level: 'master',
    pdfRef: 'Full Flow #4 — Trang 14, 15 & 16 / 21',
    architectureOverview:
      'Kết hợp hệ thống AI Reviewer tự động (.coderabbit.yaml với path_instructions chuyên biệt cho từng thư mục và Qodo PR-Agent tự chạy trong CI Runner nội bộ) cùng 3 chốt kiểm duyệt doanh nghiệp (.github/CODEOWNERS, QA Staging Gate, Protected Environment + AWS OIDC).',
    asciiFlow: `Dev mở / cập nhật PR (opened, synchronize)
  ├──► [Chốt 0: AI First-Responder (.coderabbit.yaml / Self-Hosted Qodo PR-Agent)]
  │      ├── Vẽ Sequence Diagram & Tóm tắt luồng
  │      ├── Kiểm tra src/api/**/*.ts: Bắt lỗi SQLi, N+1 Query, thiếu Zod & @RequireRole
  │      └── Kiểm tra db/migrations/**/*.sql: Cảnh báo ĐỎ nếu thiếu CONCURRENTLY hoặc có DROP COLUMN
  ├──► [Chốt 1: .github/CODEOWNERS]
  │      └── Bắt buộc @fintech-architects / @dba-team / @devops-sec-leads bấm Approve
  └──► [Chốt 2 & 3: Staging E2E → Protected Production Gate (prevent_self_review) → AWS OIDC Rollout]`,
    files: [
      {
        path: '.coderabbit.yaml',
        language: 'yaml',
        roleBadge: 'CodeRabbit AI Config',
        summary: 'Cấu hình AI Review bằng Tiếng Việt, chế độ chill giảm nhiễu và huấn luyện quy tắc riêng theo thư mục.',
        content: `# --- PHẦN A: Tệp .coderabbit.yaml (Đặt ở gốc kho Git để điều khiển hành vi AI Review trên từng PR & Commit) ---
language: "vi-VN" # Yêu cầu AI viết toàn bộ nhận xét, biểu đồ luồng và gợi ý sửa lỗi bằng Tiếng Việt
reviews:
  profile: "chill" # Chọn 'chill' để AI chỉ tập trung bắt lỗi nặng (Logic/Security/Perf), bỏ qua lỗi vặt
  request_changes_workflow: true # Tự động đánh dấu 'Request Changes' chặn Merge nếu phát hiện lỗ hổng nghiêm trọng
  high_level_summary: true # Tự động sinh bản tóm tắt PR và biểu đồ Sequence Diagram ở đầu trang
  auto_review: { enabled: true, drafts: false, base_branches: [ "main", "develop" ] }
  # Loại trừ các file tự sinh/lockfile để tiết kiệm Token và giúp AI tập trung 100% vào code nghiệp vụ
  path_filters: [ "!**/dist/**", "!**/*.lock", "!**/package-lock.json", "!**/__snapshots__/**" ]
  # Huấn luyện quy chuẩn riêng cho từng vùng thư mục của dự án
  path_instructions:
    - path: "src/api/**/*.ts"
      instructions: "Kiểm tra lỗi SQL Injection, N+1 Query trong vòng lặp, bắt buộc validate input bằng Zod và kiểm tra quyền truy cập."
    - path: "db/migrations/**/*.sql"
      instructions: "Cảnh báo ĐỎ nếu có lệnh DROP COLUMN, RENAME COLUMN hoặc tạo Index không có từ khóa CONCURRENTLY gây khóa bảng Production."`,
        highlights: [
          {
            title: 'path_instructions biến AI thành chuyên gia DBA',
            detail: 'Tự động phát hiện lệnh CREATE INDEX thiếu CONCURRENTLY vốn sẽ làm treo bảng Production khi chạy Migration.',
          },
        ],
      },
      {
        path: '.github/workflows/ai-pr-agent.yml',
        language: 'yaml',
        roleBadge: 'Self-Hosted PR-Agent',
        summary: 'Chạy AI Qodo PR-Agent mã nguồn mở ngay trong CI Runner nội bộ kết nối LLM riêng của doanh nghiệp.',
        content: `# --- PHẦN B: .github/workflows/ai-pr-agent.yml (Tự chạy AI PR-Agent mã nguồn mở ngay trong CI Runner nội bộ) ---
on:
  pull_request: { types: [ opened, synchronize ] } # Chạy khi mở PR mới hoặc khi dev đẩy thêm commit vào PR
jobs:
  ai_review_step:
    runs-on: ubuntu-24.04
    permissions: { issues: write, pull-requests: write, contents: read }
    steps:
      - name: Run Automated AI Describe, Review & Code Suggestions
        uses: Codium-ai/pr-agent@v0.24
        env:
          OPENAI_KEY: \${{ secrets.INTERNAL_LLM_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          pr_reviewer.extra_instructions: "Chỉ nhận xét các lỗi tiềm ẩn về Race Condition, Memory Leak, Security; trả lời bằng Tiếng Việt."`,
        highlights: [
          {
            title: 'Giải pháp 100% On-Premise cho Ngân hàng/Tài chính (Tình huống B6)',
            detail: 'Mã nguồn không đi ra ngoài Internet mà kết nối thẳng tới Private LLM Endpoint nội bộ.',
          },
        ],
      },
      {
        path: '.github/CODEOWNERS',
        language: 'yaml',
        roleBadge: 'Code Review Gate',
        summary: 'Phân quyền phê duyệt bắt buộc theo từng vùng thư mục mã nguồn.',
        content: `# --- PHẦN A: Tệp .github/CODEOWNERS (Tự động chỉ định bắt buộc ai phải bấm Approve PR theo từng vùng mã nguồn) ---
*                       @company/backend-seniors    # Mặc định mọi file cần ít nhất 1 Senior Dev duyệt
/src/modules/payment/   @company/fintech-architects # Chạm vào logic Thanh toán bắt buộc Kiến trúc sư duyệt
/db/migrations/         @company/dba-team           # Thay đổi cấu trúc bảng DB bắt buộc nhóm DBA duyệt
/.github/workflows/     @company/devops-sec-leads   # Sửa file CI/CD bắt buộc nhóm DevSecOps duyệt`,
        highlights: [
          {
            title: 'Khóa chặt thư mục /.github/workflows/',
            detail: 'Ngăn chặn lập trình viên tự ý sửa file CI để bỏ qua bước quét bảo mật hoặc lấy trộm biến môi trường.',
          },
        ],
      },
      {
        path: '.github/workflows/prod-release.yml',
        language: 'yaml',
        roleBadge: 'OIDC Prod Release Gate',
        summary: 'Chặn chờ Release Manager duyệt trên Protected Environment và xác thực AWS qua OIDC.',
        content: `# --- PHẦN B: .github/workflows/prod-release.yml (Chặn chờ Release Manager duyệt + Xác thực AWS qua OIDC) ---
permissions:
  id-token: write # Bắt buộc cấp quyền sinh JWT Token ngắn hạn để xác thực OIDC với AWS (Không dùng Secret Key tĩnh)
  contents: read
jobs:
  deploy-production:
    needs: [ "deploy-staging", "e2e-playwright-test" ]
    runs-on: ubuntu-24.04
    # Gắn với Environment 'production' (đã cấu hình Required Reviewers + Prevent Self-Review trong GitHub Settings)
    environment: { name: production, url: https://api.company.com }
    steps:
      - name: 1. Assume AWS Production Role via Passwordless OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
      - name: 2. Rollout Verified Image to EKS Production Cluster
        run: ./scripts/rollout-prod.sh "\${{ github.sha }}"`,
        highlights: [
          {
            title: 'Passwordless OIDC + Protected Environment',
            detail: 'Chỉ khi Release Manager bấm duyệt, GitHub mới cấp JWT Token ngắn hạn để Assume Role trên AWS EKS.',
          },
        ],
      },
    ],
    interactiveCommands: [
      {
        command: 'gh pr create --title "feat: add user email index & payment endpoint"',
        label: 'Mô phỏng Mở PR Có Lỗi Thiếu CONCURRENTLY (Xem AI Reviewer Bắt Lỗi)',
        simulatedOutput: `[PR #208 Opened] Triggering AI Reviewer (.coderabbit.yaml, profile: chill, lang: vi-VN)...
[@coderabbitai] Đã sinh biểu đồ Sequence Diagram cho luồng Thanh toán.
[@coderabbitai] 🚨 CẢNH BÁO ĐỎ tại file db/migrations/20261108_add_idx.sql (Dòng 1):
  Code hiện tại: CREATE INDEX idx_user_email ON users(email);
  Rủi ro: Thiếu từ khóa CONCURRENTLY sẽ gây khóa ghi (ShareLock) toàn bộ bảng 'users' trên Production!
  Gợi ý sửa nhanh (Commit Suggestion):
  + CREATE INDEX CONCURRENTLY idx_user_email ON users(email);
[CODEOWNERS Gate] Yêu cầu chữ ký bắt buộc từ: @company/fintech-architects và @company/dba-team.`,
      },
    ],
  },
];
