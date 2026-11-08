import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  Lock,
  Terminal,
  Workflow,
  Zap,
  GitCommitHorizontal,
  Activity,
  Code2,
  FileCode2,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { cn } from '@/utils/cn';

type SimPipelinePreset = 'gitlab-devsecops' | 'github-lean' | 'gitops-argocd';
type JobStatus =
  | 'idle'
  | 'running'
  | 'passed'
  | 'failed'
  | 'waiting_approval'
  | 'cancelled'
  | 'skipped';

interface SimJobNode {
  id: string;
  stage: string;
  name: string;
  subtitle: string;
  durationLabel: string;
  isDagZero?: boolean;
  status: JobStatus;
  codeFile: string;
  lineRange: string;
  yamlSnippet: string;
  chaosFailSnippet?: string;
  codeBreakdown: string[];
}

const PRESET_JOBS_MAP: Record<SimPipelinePreset, SimJobNode[]> = {
  'gitlab-devsecops': [
    {
      id: 'lint_and_warm_cache',
      stage: '1. validate',
      name: 'lint_and_warm_cache',
      subtitle: 'npm ci + ESLint + Cache (pull-push)',
      durationLabel: '25s',
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 22–38',
      yamlSnippet: `lint_and_warm_cache:
  stage: validate
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
    policy: pull-push   # Duy nhất Job đầu tiên được nén & đẩy Cache mới
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run lint
    - npm run typecheck`,
      codeBreakdown: [
        'key.files: [package-lock.json] — Tự động băm (hash) lockfile làm khóa Cache; chỉ tải mới khi đổi thư viện.',
        'policy: pull-push — Chỉ duy nhất Job đầu tiên làm ấm (warm) và cập nhật Cache lên kho lưu trữ.',
        'npm run lint && npm run typecheck — Chốt chặn Fail-Fast kiểm tra cú pháp trong 25 giây đầu.',
      ],
    },
    {
      id: 'secret_and_sast_scan',
      stage: '2. security_and_test',
      name: 'secret_and_sast_scan',
      subtitle: 'needs: [] (DAG t=0s) • Semgrep + Gitleaks',
      durationLabel: '18s',
      isDagZero: true,
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 44–57',
      yamlSnippet: `secret_and_sast_scan:
  stage: security_and_test
  needs: []             # DAG: Chạy ngay ở giây 0.0s, KHÔNG chờ stage validate!
  cache: []             # Tắt tải Cache vì quét mã nguồn tĩnh không cần node_modules
  script:
    - gitleaks detect --source . --verbose --exit-code 1
    - semgrep ci --config p/owasp-top-ten --error`,
      chaosFailSnippet: `# 🚨 KHI BẬT BẪY LỘ SECRET: File src/config/aws.ts chứa khóa thật
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

# Lệnh trên Runner lập tức bắt được và trả về Exit Code 1:
$ gitleaks detect --source . --verbose --exit-code 1
├── Finding: AWS Access Token at src/config/aws.ts:14
└── ❌ exit code 1 -> Chặn đứng toàn bộ Pipeline ngay ở giây thứ 18!`,
      codeBreakdown: [
        'needs: [] — Phá bỏ hàng rào tuần tự của Stage; kích hoạt chạy song song ngay ở giây thứ 0.',
        'cache: [] — Bỏ qua bước tải thư viện để tiết kiệm 15–20 giây I/O.',
        'gitleaks detect --exit-code 1 & semgrep --error — Phát hiện lộ khóa AWS/DB hoặc lỗi SQLi/XSS là đánh trượt Pipeline ngay.',
      ],
    },
    {
      id: 'unit_test_shards',
      stage: '2. security_and_test',
      name: 'unit_and_integration_test (4x)',
      subtitle: 'parallel: 4 (--shard=1/4..4/4) • Cache (pull)',
      durationLabel: '3m 00s',
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 59–82',
      yamlSnippet: `unit_and_integration_test:
  stage: security_and_test
  needs: ["lint_and_warm_cache"]
  parallel: 4           # Nhân bản 4 Container chạy đồng thời: 1/4, 2/4, 3/4, 4/4
  services:
    - name: postgres:16-alpine
      alias: db
    - name: redis:7-alpine
      alias: cache
  cache:
    key:
      files: [package-lock.json]
    paths: [.npm/]
    policy: pull        # Chỉ kéo Cache về dùng, KHÔNG nén tải lên lại!
  script:
    - npm ci --cache .npm --prefer-offline
    - npx jest --shard="$CI_NODE_INDEX/$CI_NODE_TOTAL" --coverage`,
      codeBreakdown: [
        'parallel: 4 + --shard="$CI_NODE_INDEX/$CI_NODE_TOTAL" — Chia 1.200 bài test cho 4 Runner chạy song song, rút từ 12 phút xuống 3 phút.',
        'policy: pull — Ngăn 4 container cùng nén và đẩy lại bộ Cache cuối giờ, tiết kiệm 2–4 phút mỗi lần chạy.',
        'services: [postgres:16-alpine, redis:7-alpine] — Khởi tạo Database & Redis thật đi kèm, tự hủy sạch sẽ sau khi test xong.',
      ],
    },
    {
      id: 'build_and_trivy_scan',
      stage: '3. package',
      name: 'build_and_trivy_scan',
      subtitle: 'Docker BuildKit + Trivy (--ignore-unfixed)',
      durationLabel: '1m 15s',
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 88–109',
      yamlSnippet: `build_and_trivy_scan:
  stage: package
  needs: ["secret_and_sast_scan", "unit_and_integration_test"]
  script:
    - docker build --cache-from $IMAGE_NAME:latest -t $IMAGE_NAME:$CI_COMMIT_SHORT_SHA .
    # Quét Image vừa đóng gói TRƯỚC KHI đẩy lên Registry:
    - trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH $IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    - docker push $IMAGE_NAME:$CI_COMMIT_SHORT_SHA`,
      chaosFailSnippet: `# 🚨 KHI BẬT BẪY LỖ HỔNG CVE TRONG CONTAINER IMAGE:
$ trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH $IMAGE_NAME:a1b2c3d
┌───────────────┬────────────────┬──────────┬───────────────────┬───────────────┐
│   Library     │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │
├───────────────┼────────────────┼──────────┼───────────────────┼───────────────┤
│ libcrypto3    │ CVE-2026-9912  │ CRITICAL │ 3.1.4-r0          │ 3.1.4-r5      │
└───────────────┴────────────────┴──────────┴───────────────────┴───────────────┘
❌ Trivy trả về exit code 1 -> Lệnh "docker push" phía sau KHÔNG BAO GIỜ được chạy!`,
      codeBreakdown: [
        'trivy image --exit-code 1 --severity CRITICAL,HIGH — Chặn đứng lệnh docker push nếu Image chứa lỗ hổng nghiêm trọng.',
        '--ignore-unfixed — Chỉ chặn khi lỗ hổng ĐÃ CÓ bản vá chính thức, giúp đội ngũ không bị kẹt bởi cảnh báo giả.',
        'Tag bằng $CI_COMMIT_SHORT_SHA — Định danh bất biến (Immutable Artifact) thay vì ghi đè tag :latest.',
      ],
    },
    {
      id: 'deploy_to_staging',
      stage: '4. deploy_staging',
      name: 'deploy_to_staging',
      subtitle: 'resource_group: staging-lock + Smoke /health',
      durationLabel: '40s',
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 115–129',
      yamlSnippet: `deploy_to_staging:
  stage: deploy_staging
  needs: ["build_and_trivy_scan"]
  resource_group: staging-cluster-lock  # Chống 2 pipeline deploy đè lên nhau!
  environment:
    name: staging
    url: https://staging.app.vn
  script:
    - ./scripts/deploy-k8s.sh staging $IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    - curl --fail --retry 5 --retry-delay 3 https://staging.app.vn/health`,
      chaosFailSnippet: `# 🚨 KHI BẬT BẪY STAGING TRẢ VỀ HTTP 500:
$ curl --fail --retry 5 --retry-delay 3 https://staging.app.vn/health
Warning: Transient problem: HTTP error Will retry in 3 seconds. 5 retries left.
curl: (22) The requested URL returned error: 500 Internal Server Error
❌ Nhờ cờ --fail, curl trả về mã lỗi 22 -> Tự động kích hoạt helm rollback staging!`,
      codeBreakdown: [
        'resource_group: staging-cluster-lock — Cấp khóa độc quyền, chống lỗi Race Condition (Tình huống B2).',
        'curl --fail --retry 5 --retry-delay 3 — Nếu không có --fail, curl vẫn trả về exit code 0 khi gặp HTTP 500 (khiến CI tưởng nhầm là thành công!).',
      ],
    },
    {
      id: 'approve_and_deploy_prod',
      stage: '5. deploy_prod',
      name: 'approve_and_deploy_prod',
      subtitle: 'when: manual (Gate) • OIDC + K8s Rollout',
      durationLabel: 'Manual Gate',
      status: 'idle',
      codeFile: '.gitlab-ci.yml',
      lineRange: 'Lines 135–154',
      yamlSnippet: `approve_and_deploy_prod:
  stage: deploy_prod
  needs: ["deploy_to_staging"]
  resource_group: prod-cluster-lock     # Khóa tuần tự cụm Production
  id_tokens:
    AWS_OIDC_TOKEN:
      aud: https://gitlab.com           # Xác thực OIDC không mật khẩu tĩnh
  environment:
    name: production
    url: https://app.vn
  when: manual                          # CỔNG PHÊ DUYỆT THỦ CÔNG (Continuous Delivery)
  allow_failure: false                  # Bắt buộc chờ Tech Lead bấm nút Approve
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
  script:
    - ./scripts/assume-aws-oidc-role.sh
    - ./scripts/deploy-k8s.sh production $IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    - curl --fail --retry 5 --retry-delay 3 https://app.vn/health`,
      codeBreakdown: [
        'when: manual + allow_failure: false — Chốt chặn Continuous Delivery: tạm dừng Pipeline chờ Tech Lead/Release Manager phê duyệt.',
        'id_tokens (AWS_OIDC_TOKEN) — Đổi JWT ngắn hạn lấy quyền AWS STS trong 15 phút, loại bỏ 100% khóa AWS_SECRET_ACCESS_KEY tĩnh.',
        'resource_group: prod-cluster-lock — Đảm bảo không bao giờ có 2 phiên bản cùng ghi đè lên Production.',
      ],
    },
  ],
  'github-lean': [
    {
      id: 'lint_and_warm_cache',
      stage: '1. Concurrency & Checkout',
      name: 'concurrency + actions/setup-node',
      subtitle: 'cancel-in-progress: true + Lockfile Cache',
      durationLabel: '15s',
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 11–44',
      yamlSnippet: `concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}

jobs:
  verify-and-build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4
        with:
          node-version: 20
          cache: 'npm' # Tự động băm package-lock.json làm khóa Cache`,
      codeBreakdown: [
        'cancel-in-progress: github.ref != refs/heads/main — Tự động hủy các lần chạy PR cũ khi dev đẩy commit mới liên tiếp, nhưng bảo vệ nhánh main.',
        'Ghim cứng mã băm Commit SHA 40 ký tự cho mọi Action bên thứ 3 để chống tấn công chuỗi cung ứng (Chuyên đề A3).',
      ],
    },
    {
      id: 'secret_and_sast_scan',
      stage: '2. Lint & Security',
      name: 'Fail-Fast Lint, SAST & Typecheck',
      subtitle: 'npm ci + ESLint + Semgrep SAST',
      durationLabel: '20s',
      isDagZero: true,
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 46–56',
      yamlSnippet: `      - name: Install Exact Dependencies
        run: npm ci

      - name: Lint, Typecheck & Secret Scan (Fail-Fast)
        run: |
          npx gitleaks detect --source . --exit-code 1
          npm run lint
          npm run typecheck`,
      chaosFailSnippet: `# 🚨 Lệnh gitleaks detect trả về mã lỗi 1 ngay tại Step "Lint, Typecheck & Secret Scan":
Error: Secret detected in src/config/aws.ts (Rule: aws-access-token)
Error: Process completed with exit code 1.
-> Các Step phía sau (Unit Test, Build, Deploy) bị hủy bỏ ngay lập tức!`,
      codeBreakdown: [
        'npm ci — Cài đặt chính xác 100% phiên bản trong package-lock.json; nếu lệch lockfile sẽ báo lỗi ngay.',
        'Chạy gitleaks + lint + typecheck trước khi chạy bộ Test để tiết kiệm thời gian máy chủ.',
      ],
    },
    {
      id: 'unit_test_shards',
      stage: '2. Service Containers',
      name: 'Postgres 16 & Redis 7 Integration Test',
      subtitle: 'services: postgres:16 + --health-cmd pg_isready',
      durationLabel: '45s',
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 19–35 & 58–63',
      yamlSnippet: `    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: ci_user
          POSTGRES_PASSWORD: ci_password
          POSTGRES_DB: app_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - name: Run Unit & Integration Tests
        env:
          DATABASE_URL: postgresql://ci_user:ci_password@localhost:5432/app_test
        run: npm test -- --coverage`,
      codeBreakdown: [
        '--health-cmd pg_isready — Đảm bảo Runner đợi PostgreSQL 16 khởi động xong 100% rồi mới chạy npm test, chống lỗi Flaky Test kết nối DB.',
        'Ephemeral Service Containers — Tự động xóa sạch DB và Redis ngay khi Job kết thúc.',
      ],
    },
    {
      id: 'build_and_trivy_scan',
      stage: '3. Build & Upload Artifact',
      name: 'Build Bundle & Upload Artifact dist/',
      subtitle: 'npm run build + upload-artifact@v4 (retention: 7d)',
      durationLabel: '35s',
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 65–76',
      yamlSnippet: `      - name: Build Production Bundle & Scan CVE
        run: |
          npm run build
          trivy fs --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH .

      - name: Upload Build Artifact
        uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882 # v4
        with:
          name: production-dist-\${{ github.sha }}
          path: dist/
          retention-days: 7`,
      chaosFailSnippet: `# 🚨 Trivy phát hiện CVE-2026-9912 CRITICAL đã có bản vá:
$ trivy fs --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH .
Total: 1 (CRITICAL: 1) -> Process completed with exit code 1.
-> Không tạo Artifact và chặn đứng Job deploy-production phía sau!`,
      codeBreakdown: [
        'upload-artifact@v4 — Đóng gói thư mục dist/ gắn kèm mã băm github.sha để chuyển giao nguyên vẹn sang Job Deploy.',
        'retention-days: 7 — Tự động dọn dẹp sau 7 ngày để không tốn phí lưu trữ đám mây.',
      ],
    },
    {
      id: 'deploy_to_staging',
      stage: '4. Download & Smoke Staging',
      name: 'Download Artifact & Smoke Test Staging',
      subtitle: 'download-artifact + curl --fail --retry 5',
      durationLabel: '30s',
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 78–96',
      yamlSnippet: `  deploy-staging:
    needs: verify-and-build
    runs-on: ubuntu-24.04
    steps:
      - name: Download Verified Artifact (Không biên dịch lại!)
        uses: actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16 # v4
        with:
          name: production-dist-\${{ github.sha }}
          path: dist/

      - name: Deploy & Smoke Test Staging
        run: |
          ./scripts/deploy-staging.sh
          curl --fail --retry 5 --retry-delay 3 https://staging.app.vn/health`,
      chaosFailSnippet: `# 🚨 Cổng /health trên Staging trả về HTTP 500:
$ curl --fail --retry 5 --retry-delay 3 https://staging.app.vn/health
curl: (22) The requested URL returned error: 500
Error: Process completed with exit code 22 -> Chặn không cho lên Production!`,
      codeBreakdown: [
        'Build Once, Deploy Anywhere — Tải đúng gói dist/ đã qua kiểm thử ở Job trước, tuyệt đối không chạy lại npm run build.',
        'curl --fail --retry 5 — Kiểm tra sức khỏe thực tế sau khi triển khai.',
      ],
    },
    {
      id: 'approve_and_deploy_prod',
      stage: '5. Protected Env + OIDC Prod',
      name: 'deploy-production (Environment Gate)',
      subtitle: 'environment: production + OIDC id-token: write',
      durationLabel: 'Manual Gate',
      status: 'idle',
      codeFile: '.github/workflows/lean-ci-cd.yml',
      lineRange: 'Lines 98–124',
      yamlSnippet: `  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    permissions:
      id-token: write   # Cấp quyền sinh JWT OIDC ngắn hạn
      contents: read
    environment:
      name: production  # Kích hoạt Required Reviewers Gate trên GitHub
      url: https://api.example.com
    steps:
      - uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
      - name: Rollout & Verify Health
        run: |
          ./scripts/deploy-prod.sh
          curl --fail --retry 5 --retry-delay 3 https://api.example.com/health`,
      codeBreakdown: [
        'environment: production — Kích hoạt cổng Required Reviewers trên GitHub (chờ Tech Lead bấm Approve).',
        'permissions: id-token: write + configure-aws-credentials — Đổi thẻ OIDC JWT lấy Temporary Credentials từ AWS STS.',
      ],
    },
  ],
  'gitops-argocd': [
    {
      id: 'lint_and_warm_cache',
      stage: '1. App Repo CI',
      name: 'Lint, Typecheck & Cache Warm',
      subtitle: 'App Repo: npm ci + ESLint',
      durationLabel: '20s',
      status: 'idle',
      codeFile: '.github/workflows/gitops-ci.yml',
      lineRange: 'Lines 10–28',
      yamlSnippet: `name: App Repo CI (Không giữ kubeconfig!)
on:
  push:
    branches: [main]
jobs:
  ci-verify:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint && npm run typecheck`,
      codeBreakdown: [
        'Trong kiến trúc GitOps (Mục 3.2), CI Runner chỉ làm nhiệm vụ kiểm thử và đóng gói Image, tuyệt đối KHÔNG giữ khóa kubeconfig của cụm K8s.',
      ],
    },
    {
      id: 'secret_and_sast_scan',
      stage: '2. Shift-Left Security',
      name: 'Gitleaks Secret & Semgrep SAST',
      subtitle: 'needs: [] • Quét lỗ hổng mã nguồn',
      durationLabel: '18s',
      isDagZero: true,
      status: 'idle',
      codeFile: '.github/workflows/gitops-ci.yml',
      lineRange: 'Lines 30–42',
      yamlSnippet: `  security-sast:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Secret & SAST Gate
        run: |
          gitleaks detect --source . --exit-code 1
          semgrep ci --config p/owasp-top-ten --error`,
      chaosFailSnippet: `# 🚨 Gitleaks chặn đứng Pipeline vì phát hiện khóa nhạy cảm trong commit!`,
      codeBreakdown: [
        'Quét song song ngay từ giây thứ 0 để phát hiện sớm rò rỉ khóa bí mật.',
      ],
    },
    {
      id: 'unit_test_shards',
      stage: '2. Parallel Shards',
      name: 'Matrix 4x Test Shards',
      subtitle: 'strategy.matrix.shard: [1/4, 2/4, 3/4, 4/4]',
      durationLabel: '2m 40s',
      status: 'idle',
      codeFile: '.github/workflows/gitops-ci.yml',
      lineRange: 'Lines 44–60',
      yamlSnippet: `  test-shards:
    needs: ci-verify
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx jest --shard=\${{ matrix.shard }}/4`,
      codeBreakdown: [
        'strategy.matrix.shard — Chia bộ kiểm thử thành 4 luồng chạy song song trên GitHub Actions.',
      ],
    },
    {
      id: 'build_and_trivy_scan',
      stage: '3. OCI Image & Trivy',
      name: 'BuildKit Rootless & Trivy Scan',
      subtitle: 'Quét CVE Image & Đẩy lên Container Registry',
      durationLabel: '1m 10s',
      status: 'idle',
      codeFile: '.github/workflows/gitops-ci.yml',
      lineRange: 'Lines 62–80',
      yamlSnippet: `  build-and-push-image:
    needs: [security-sast, test-shards]
    steps:
      - name: Build & Scan Container Image
        run: |
          docker build -t registry.app.vn/order-api:\${{ github.sha }} .
          trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH registry.app.vn/order-api:\${{ github.sha }}
          docker push registry.app.vn/order-api:\${{ github.sha }}`,
      chaosFailSnippet: `# 🚨 Trivy chặn không cho đẩy Image nhiễm CVE CRITICAL lên Registry!`,
      codeBreakdown: [
        'Chỉ khi Image vượt qua Trivy Scan (0 CRITICAL/HIGH có bản vá) thì mới được đẩy lên Container Registry.',
      ],
    },
    {
      id: 'deploy_to_staging',
      stage: '4. Update GitOps Repo',
      name: 'Commit Image Tag vào GitOps Config Repo',
      subtitle: 'yq -i .image.tag = "a1b2c3d" k8s/staging/values.yaml',
      durationLabel: '15s',
      status: 'idle',
      codeFile: '.github/workflows/gitops-ci.yml',
      lineRange: 'Lines 82–102',
      yamlSnippet: `  update-gitops-manifest:
    needs: build-and-push-image
    steps:
      - name: Clone GitOps Config Repo & Bump Image Tag
        run: |
          git clone https://x-access-token:\${{ secrets.GITOPS_PAT }}@github.com/org/k8s-gitops-repo.git
          cd k8s-gitops-repo
          yq -i '.image.tag = "a1b2c3d"' apps/order-api/staging-values.yaml
          git commit -am "chore(release): bump order-api to a1b2c3d"
          git push origin main`,
      chaosFailSnippet: `# 🚨 ArgoCD phát hiện Pod mới trên Staging bị CrashLoopBackOff / HTTP 500 -> Dừng tiến trình Promotion!`,
      codeBreakdown: [
        'Điểm cốt lõi của GitOps: CI KHÔNG gọi kubectl apply! CI chỉ cập nhật mã tag mới (a1b2c3d) vào kho GitOps Config Repo.',
      ],
    },
    {
      id: 'approve_and_deploy_prod',
      stage: '5. ArgoCD Pull & Sync',
      name: 'ArgoCD Pull-based Reconciliation (Prod)',
      subtitle: 'selfHeal: true + prune: true (Đóng cổng Firewall chiều vào)',
      durationLabel: 'Manual Gate',
      status: 'idle',
      codeFile: 'argocd/order-api-prod.yaml',
      lineRange: 'Lines 1–32',
      yamlSnippet: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-api-production
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/org/k8s-gitops-repo.git
    targetRevision: main
    path: apps/order-api/production
  destination:
    server: https://kubernetes.default.svc # Chạy nội bộ bên trong cụm K8s!
    namespace: production
  syncPolicy:
    automated:
      prune: true       # Tự xóa tài nguyên thừa không còn trong Git
      selfHeal: true    # Tự khôi phục nếu ai đó sửa tay bằng kubectl (Chống Drift)
    syncOptions:
      - CreateNamespace=true`,
      codeBreakdown: [
        'Pull-based Reconciliation — ArgoCD nằm bên trong cụm K8s chủ động kéo (pull) cấu hình từ Git về, không cần mở cổng Firewall chiều vào.',
        'selfHeal: true — Nếu ai đó gõ lệnh sửa tay trên cụm (Configuration Drift), ArgoCD lập tức ghi đè lại đúng chuẩn trên Git.',
      ],
    },
  ],
};

export const CicdLivePipelineSimulator: React.FC = () => {
  const { selectedSimulatorMode, setSimulatorMode } = useCicdNavigationStore();

  // --- MODE 1: PIPELINE & DAG SIMULATOR STATE ---
  const [preset, setPreset] = useState<SimPipelinePreset>('gitlab-devsecops');
  const [jobs, setJobs] = useState<SimJobNode[]>(
    PRESET_JOBS_MAP['gitlab-devsecops']
  );
  const [selectedJobId, setSelectedJobId] = useState<string>(
    'lint_and_warm_cache'
  );
  const [codeViewTab, setCodeViewTab] = useState<'step-xray' | 'full-file'>(
    'step-xray'
  );
  const [showConcurrencyBanner, setShowConcurrencyBanner] = useState(false);
  const [mobileSimSection, setMobileSimSection] = useState<
    'all' | 'board-code' | 'config-chaos' | 'logs'
  >('all');

  const [isRunning, setIsRunning] = useState(false);
  const [injectSecretLeak, setInjectSecretLeak] = useState(false);
  const [injectTrivyCve, setInjectTrivyCve] = useState(false);
  const [injectStaging500, setInjectStaging500] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[CI/CD Engine Ready] Bấm vào bất kỳ ô Job nào để soi Code YAML của bước đó, hoặc bấm "Kích hoạt Chạy Pipeline" để xem Code tự động nhảy theo từng bước đang chạy!',
  ]);
  const [runCounter, setRunCounter] = useState(104);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- MODE 2: ZERO-DOWNTIME & TRAFFIC SHIFTING SIMULATOR STATE ---
  const [deployStrategy, setDeployStrategy] = useState<
    'blue-green' | 'canary' | 'rolling' | 'recreate'
  >('canary');
  const [canaryWeight, setCanaryWeight] = useState(5);
  const [blueGreenActive, setBlueGreenActive] = useState<'blue' | 'green'>(
    'blue'
  );
  const [hasDumbInitExecForm, setHasDumbInitExecForm] = useState(true);
  const [hasServerCloseSigterm, setHasServerCloseSigterm] = useState(true);
  const [hasPreStopSleep5, setHasPreStopSleep5] = useState(true);
  const [activeTrafficCodeTab, setActiveTrafficCodeTab] = useState<
    'dockerfile' | 'server-ts' | 'k8s-deployment' | 'strategy-manifest'
  >('k8s-deployment');
  const [isRolloutSimRunning, setIsRolloutSimRunning] = useState(false);
  const [rolloutPhaseText, setRolloutPhaseText] = useState(
    'Hệ thống đang chạy ổn định ở phiên bản v1.0 (1,200 req/s).'
  );
  const [trafficMetrics, setTrafficMetrics] = useState({
    totalRequests: 12000,
    ok200Count: 12000,
    error502Count: 0,
    p99LatencyMs: 38,
  });
  const [trafficEvents, setTrafficEvents] = useState<string[]>([
    '[K8s Ingress] Đang điều phối 1,200 RPS. Bấm "Triển khai v2.0 Giữa Giờ Cao Điểm" để kiểm nghiệm Zero-Downtime!',
  ]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const appendLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  const resetPipeline = (targetPreset: SimPipelinePreset = preset) => {
    clearTimers();
    setIsRunning(false);
    setShowConcurrencyBanner(false);
    const freshJobs = PRESET_JOBS_MAP[targetPreset].map((j) => ({
      ...j,
      status: 'idle' as JobStatus,
    }));
    setJobs(freshJobs);
    setSelectedJobId(freshJobs[0].id);
    setLogs([
      `[Pipeline #${runCounter}] Đã đặt lại trạng thái sạch (Ephemeral Environment). Bấm vào từng Job để xem Code YAML hoặc bấm "Kích hoạt Chạy Pipeline".`,
    ]);
  };

  const startPipelineSimulation = (isPrBurst = false) => {
    clearTimers();
    setIsRunning(true);
    setShowConcurrencyBanner(isPrBurst);
    if (mobileSimSection === 'config-chaos') {
      setMobileSimSection('board-code');
    }
    const nextRun = runCounter + (isPrBurst ? 3 : 1);
    setRunCounter(nextRun);

    const baseJobs = PRESET_JOBS_MAP[preset];

    const initialLog: string[] = [];
    if (isPrBurst) {
      initialLog.push(
        `⚡ [Trigger] Dev vừa đẩy 3 commit liên tiếp lên nhánh PR trong 10 giây (#${nextRun - 2}, #${nextRun - 1}, #${nextRun})!`
      );
      initialLog.push(
        `🛑 [Concurrency Guard] group: ci-workflow-refs/pull/18 -> Tự động CANCELLED Run #${nextRun - 2} & Run #${nextRun - 1} để tiết kiệm số phút Runner!`
      );
    }
    initialLog.push(
      `🚀 [Pipeline #${nextRun}] Khởi chạy với kiến trúc: ${preset.toUpperCase()} (Commit SHA: a1b2c3d)`
    );
    initialLog.push(
      `⚡ [DAG Engine] Kích hoạt song song ở t=0.0s: Job 'lint_and_warm_cache' VÀ Job 'secret_and_sast_scan' (nhờ needs: [])!`
    );
    setLogs(initialLog);

    // Step 1: Start Lint & SAST simultaneously (DAG) -> Focus SAST or Lint
    setSelectedJobId(
      injectSecretLeak ? 'secret_and_sast_scan' : 'lint_and_warm_cache'
    );
    setJobs(
      baseJobs.map((j) =>
        j.id === 'lint_and_warm_cache' || j.id === 'secret_and_sast_scan'
          ? { ...j, status: 'running' }
          : { ...j, status: 'idle' }
      )
    );

    // T = 1.2s: SAST finishes (or fails if Secret Leak is injected!)
    const t1 = setTimeout(() => {
      setSelectedJobId('secret_and_sast_scan');
      if (injectSecretLeak) {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'secret_and_sast_scan')
              return { ...j, status: 'failed' };
            if (j.id === 'lint_and_warm_cache')
              return { ...j, status: 'cancelled' };
            return { ...j, status: 'skipped' };
          })
        );
        appendLog(
          '🚨 [Gitleaks & Semgrep SAST] PHÁT HIỆN LỖ HỔNG NGHIÊM TRỌNG tại src/config/aws.ts: Hardcoded AWS_SECRET_ACCESS_KEY!'
        );
        appendLog(
          '❌ [Fail-Fast Security Gate] Step trả về exit code 1 -> Chặn đứng toàn bộ Pipeline ngay ở giây thứ 18! (Xem Tình huống B3 để ứng cứu)'
        );
        setIsRunning(false);
        return;
      }

      appendLog(
        '✅ [secret_and_sast_scan] Semgrep SAST & Gitleaks: 0 lỗ hổng SQLi/XSS/Secret (18s).'
      );
      setJobs((prev) =>
        prev.map((j) =>
          j.id === 'secret_and_sast_scan' ? { ...j, status: 'passed' } : j
        )
      );
    }, 1100);

    // T = 2.2s: Lint finishes -> Start 4x Test Shards
    const t2 = setTimeout(() => {
      if (injectSecretLeak) return;
      setSelectedJobId('unit_test_shards');
      appendLog(
        '✅ [lint_and_warm_cache] npm ci + ESLint + Typecheck PASSED. Đã nén đẩy Cache ~/.npm (policy: pull-push).'
      );
      appendLog(
        '🔀 [Test Sharding] Nhân bản 4 Container chạy song song (parallel: 4, jest --shard=1/4..4/4) kèm Postgres 16 & Redis 7 thật (policy: pull)...'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'lint_and_warm_cache') return { ...j, status: 'passed' };
          if (j.id === 'unit_test_shards') return { ...j, status: 'running' };
          return j;
        })
      );
    }, 2200);

    // T = 3.6s: 4x Test Shards finish -> Start Docker Build & Trivy Scan
    const t3 = setTimeout(() => {
      if (injectSecretLeak) return;
      setSelectedJobId('build_and_trivy_scan');
      appendLog(
        '✅ [unit_and_integration_test] Cả 4/4 Shards hoàn tất 1.200 bài test trong 3m00s (tiết kiệm 9 phút)! Không tốn thời gian nén lại Cache nhờ policy: pull.'
      );
      appendLog(
        '🐳 [build_and_trivy_scan] Đang đóng gói Multi-stage Docker Image (tag: registry.app.vn/api:a1b2c3d) và quét lỗ hổng bằng Trivy...'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'unit_test_shards') return { ...j, status: 'passed' };
          if (j.id === 'build_and_trivy_scan')
            return { ...j, status: 'running' };
          return j;
        })
      );
    }, 3600);

    // T = 5.0s: Trivy Scan finishes (or fails if CVE is injected!)
    const t4 = setTimeout(() => {
      if (injectSecretLeak) return;
      if (injectTrivyCve) {
        setSelectedJobId('build_and_trivy_scan');
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'build_and_trivy_scan')
              return { ...j, status: 'failed' };
            if (
              j.id === 'deploy_to_staging' ||
              j.id === 'approve_and_deploy_prod'
            )
              return { ...j, status: 'skipped' };
            return j;
          })
        );
        appendLog(
          '🚨 [Trivy Scan] trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH'
        );
        appendLog(
          '❌ [Trivy Scan] Phát hiện CVE-2026-9912 (CRITICAL - Đã có bản vá 1.4.2) trong gói thư viện! Chặn đứng lệnh docker push!'
        );
        setIsRunning(false);
        return;
      }

      setSelectedJobId('deploy_to_staging');
      appendLog(
        '✅ [build_and_trivy_scan] Trivy Scan PASSED (0 lỗi CRITICAL/HIGH có bản vá). Đã đẩy Image registry.app.vn/api:a1b2c3d.'
      );
      appendLog(
        '🚀 [deploy_to_staging] Đang giữ khóa resource_group: staging-cluster-lock và triển khai lên Staging...'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'build_and_trivy_scan')
            return { ...j, status: 'passed' };
          if (j.id === 'deploy_to_staging') return { ...j, status: 'running' };
          return j;
        })
      );
    }, 5000);

    // T = 6.4s: Staging Smoke Test finishes -> Pause at Manual Approval Gate
    const t5 = setTimeout(() => {
      if (injectSecretLeak || injectTrivyCve) return;
      if (injectStaging500) {
        setSelectedJobId('deploy_to_staging');
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'deploy_to_staging') return { ...j, status: 'failed' };
            if (j.id === 'approve_and_deploy_prod')
              return { ...j, status: 'skipped' };
            return j;
          })
        );
        appendLog(
          '🚨 [Smoke Test] curl --fail --retry 5 https://staging.app.vn/health -> HTTP 500 Internal Server Error (5/5 lần thử thất bại)!'
        );
        appendLog(
          '⏪ [Auto-Rollback] Cờ --fail trả về exit code 22 -> Tự động cuộn ngược Staging về bản ổn định trước đó và chặn lên Production!'
        );
        setIsRunning(false);
        return;
      }

      setSelectedJobId('approve_and_deploy_prod');
      appendLog(
        '✅ [deploy_to_staging] Smoke Test: curl --fail --retry 5 https://staging.app.vn/health -> HTTP 200 OK {"status":"ready"}.'
      );
      appendLog(
        '⏸️ [MANUAL APPROVAL GATE] Pipeline tạm dừng tại Job "approve_and_deploy_prod" (when: manual, allow_failure: false, Protected Environment).'
      );
      appendLog(
        '👉 Hãy bấm nút "Tech Lead: Approve & Deploy Prod" màu vàng trên thẻ Job thứ 6 để cấp JWT OIDC và hoàn tất Rollout!'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'deploy_to_staging') return { ...j, status: 'passed' };
          if (j.id === 'approve_and_deploy_prod')
            return { ...j, status: 'waiting_approval' };
          return j;
        })
      );
      setIsRunning(false);
    }, 6400);

    timersRef.current = [t1, t2, t3, t4, t5];
  };

  const handleManualApproveProd = () => {
    setSelectedJobId('approve_and_deploy_prod');
    setJobs((prev) =>
      prev.map((j) =>
        j.id === 'approve_and_deploy_prod' ? { ...j, status: 'running' } : j
      )
    );
    appendLog(
      '🔐 [Release Manager Gate] Đã xác nhận chữ ký Tech Lead (prevent_self_review: true).'
    );
    appendLog(
      '🪪 [OIDC Federation] Cấp thẻ JWT Token ngắn hạn (ref: refs/heads/main) -> AWS STS cấp Temporary Token (15 phút).'
    );
    const t = setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === 'approve_and_deploy_prod' ? { ...j, status: 'passed' } : j
        )
      );
      appendLog(
        '🎉 [Production Live] Rollout hoàn tất với resource_group: prod-cluster-lock! Phiên bản a1b2c3d đã chạy trên Production với 0% Downtime!'
      );
    }, 1000);
    timersRef.current.push(t);
  };

  // --- MODE 2 HANDLER: SIMULATE K8S ROLLOUT UNDER HIGH TRAFFIC ---
  const triggerZeroDowntimeRolloutTest = () => {
    setIsRolloutSimRunning(true);
    const newEvents: string[] = [];

    if (deployStrategy === 'recreate') {
      setActiveTrafficCodeTab('strategy-manifest');
      newEvents.push(
        '⚠️ [Recreate Strategy] Tắt toàn bộ 4 Pod v1.0 trước khi bật Pod v2.0 -> Hệ thống bị gián đoạn (Downtime) hoàn toàn trong lúc chờ Pod mới khởi động!'
      );
      setTrafficMetrics({
        totalRequests: 15000,
        ok200Count: 13200,
        error502Count: 1800,
        p99LatencyMs: 2400,
      });
      setRolloutPhaseText(
        '❌ Recreate gây gián đoạn dịch vụ (1,800 request bị lỗi 502/503) — Chỉ dùng cho môi trường nội bộ!'
      );
      setTrafficEvents(newEvents);
      setIsRolloutSimRunning(false);
      return;
    }

    // Check the 3 Zero-Downtime Pieces (Full Flow #3 & Tình huống B7)
    let droppedRequests = 0;
    if (!hasPreStopSleep5) {
      droppedRequests += 68;
      setActiveTrafficCodeTab('k8s-deployment');
      newEvents.push(
        '🚨 [Thiếu Mảnh ghép 3: preStop sleep 5] NGINX Ingress mất 1–3 giây để rút IP Pod v1.0, nhưng ứng dụng đã đóng cổng HTTP ngay ở mili-giây đầu tiên -> 68 request đâm vào cổng đóng bị lỗi 502 Bad Gateway!'
      );
    } else {
      newEvents.push(
        '✅ [Mảnh ghép 3: preStop sleep 5] Pod v1.0 ngủ chờ 5 giây cho NGINX Ingress rút sạch IP khỏi bảng định tuyến trước khi phát SIGTERM.'
      );
    }

    if (!hasDumbInitExecForm) {
      droppedRequests += 45;
      setActiveTrafficCodeTab('dockerfile');
      newEvents.push(
        '🚨 [Thiếu Mảnh ghép 1: dumb-init Exec Form] Dùng CMD "npm start" khiến /bin/sh chiếm PID 1 và nuốt mất tín hiệu SIGTERM! Đợi hết 35s Kernel giết cứng bằng SIGKILL làm đứt 45 giao dịch!'
      );
    } else {
      newEvents.push(
        '✅ [Mảnh ghép 1: dumb-init + Exec Form] PID 1 chuyển tiếp chính xác tín hiệu SIGTERM vào tiến trình Node.js.'
      );
    }

    if (!hasServerCloseSigterm) {
      droppedRequests += 32;
      setActiveTrafficCodeTab('server-ts');
      newEvents.push(
        '🚨 [Thiếu Mảnh ghép 2: server.close()] Ứng dụng nhận SIGTERM và thoát ngay lập tức làm ngắt 32 câu lệnh SQL đang thanh toán dở!'
      );
    } else {
      newEvents.push(
        '✅ [Mảnh ghép 2: server.close() → dbPool.end()] Ngừng nhận TCP mới nhưng giữ sống các HTTP request đang xử lý dở cho đến khi trả kết quả 200 OK xong.'
      );
    }

    const total = 15600;
    const okCount = total - droppedRequests;
    setTrafficMetrics({
      totalRequests: total,
      ok200Count: okCount,
      error502Count: droppedRequests,
      p99LatencyMs: droppedRequests === 0 ? 41 : 480,
    });

    if (droppedRequests === 0) {
      if (deployStrategy === 'blue-green') setBlueGreenActive('green');
      if (deployStrategy === 'canary') setCanaryWeight(100);
      setRolloutPhaseText(
        '🎉 ZERO-DOWNTIME TUYỆT ĐỐI: Đủ cả 3 mảnh ghép (Dockerfile + SIGTERM server.close + K8s preStop) — 15,600/15,600 request thành công (0 lỗi 502)!'
      );
    } else {
      setRolloutPhaseText(
        `🚨 XUẤT HIỆN ${droppedRequests} LỖI 502 BAD GATEWAY! Xem ngay đoạn Code bị báo đỏ ở khung bên dưới để biết chính xác dòng cấu hình nào gây lỗi.`
      );
    }

    setTrafficEvents(newEvents);
    setIsRolloutSimRunning(false);
  };

  const activeJob =
    jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const passedJobsCount = jobs.filter((j) => j.status === 'passed').length;
  const activeChaosCount =
    (injectSecretLeak ? 1 : 0) +
    (injectTrivyCve ? 1 : 0) +
    (injectStaging500 ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1440px] px-2.5 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-16">
      {/* Top Simulator Mode Switcher */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-emerald-500/10 p-3.5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Workflow className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>
              Giả lập CI/CD & Đồng bộ Code Thời gian Thực (Live Code X-Ray)
            </span>
          </div>
          <h1 className="text-base sm:text-2xl font-extrabold text-white leading-snug">
            Mô phỏng Đường ống CI/CD, Đồ thị DAG, Cổng Duyệt & Zero-Downtime Traffic
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Quan sát trực tiếp từng bước Pipeline chạy đến đâu thì{' '}
            <strong className="text-cyan-300">
              đoạn Code YAML / Dockerfile / K8s tương ứng sáng lên đến đó
            </strong>
            .
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setSimulatorMode('pipeline')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all',
              selectedSimulatorMode === 'pipeline'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            )}
          >
            <Workflow className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">1. Pipeline & Code YAML</span>
          </button>
          <button
            onClick={() => setSimulatorMode('traffic')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold transition-all',
              selectedSimulatorMode === 'traffic'
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            )}
          >
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">2. Traffic & Lỗi 502</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SIMULATOR MODE 1: LIVE PIPELINE & DAG EXECUTION ENGINE + CODE X-RAY
         ===================================================================== */}
      {selectedSimulatorMode === 'pipeline' && (
        <div className="space-y-4">
          {/* Mobile Sticky One-Thumb Action & Section Switcher Bar (< lg) */}
          <div className="lg:hidden sticky top-0 z-20 rounded-xl border border-slate-800 bg-slate-950/95 p-2.5 backdrop-blur-md space-y-2 shadow-lg">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => startPipelineSimulation(false)}
                disabled={isRunning}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-extrabold text-slate-950 disabled:opacity-50 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>
                  {isRunning ? 'Đang chạy Pipeline...' : 'Chạy Pipeline & Soi Code'}
                </span>
              </button>
              <button
                onClick={() => startPipelineSimulation(true)}
                disabled={isRunning}
                title="Giả lập Push 3 Commit liên tiếp trên PR"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-2 text-[11px] font-bold text-amber-300 disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>3x PR</span>
              </button>
              <button
                onClick={() => resetPipeline(preset)}
                title="Đặt lại Đường ống"
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  {
                    id: 'board-code',
                    label: `🔀 Sơ đồ & Code (${passedJobsCount}/${jobs.length})`,
                  },
                  {
                    id: 'config-chaos',
                    label: `⚙️ Kịch bản & Bẫy (${activeChaosCount})`,
                  },
                  { id: 'logs', label: `📟 Log (${logs.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMobileSimSection(tab.id)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-all',
                    mobileSimSection === tab.id
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12 items-start">
            {/* Left Control & Chaos Injection Panel (4 cols) */}
            <div
              className={cn(
                'lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4 sm:space-y-5',
                mobileSimSection !== 'all' &&
                  mobileSimSection !== 'config-chaos' &&
                  'hidden lg:block'
              )}
            >
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Chọn Kiến trúc Đường ống (Tự động đổi bộ Code YAML)
              </div>
              <div className="grid gap-2">
                {(
                  [
                    {
                      id: 'gitlab-devsecops',
                      title: 'Full Flow #2: GitLab DevSecOps (.gitlab-ci.yml)',
                      desc: 'DAG (needs: []) + 4x Test Shards + Trivy + Manual Gate',
                    },
                    {
                      id: 'github-lean',
                      title: 'Full Flow #1: GitHub Actions (lean-ci-cd.yml)',
                      desc: 'Concurrency Guard + Postgres/Redis thật + Smoke Test',
                    },
                    {
                      id: 'gitops-argocd',
                      title: 'Mô hình GitOps Pull-based (ArgoCD + App CI)',
                      desc: 'CI bump tag vào GitOps Repo ← ArgoCD nội bộ tự Pull',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPreset(item.id);
                      resetPipeline(item.id);
                    }}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-all',
                      preset === item.id
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-white ring-1 ring-cyan-500/40'
                        : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                    )}
                  >
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chaos Injection Toggles */}
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                <span>2. Cài Bẫy Sự cố (Chaos / Fault Injection)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bật thử các lỗi thực tế để xem câu lệnh nào trong YAML bắt được lỗi và chặn đứng Pipeline:
              </p>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={injectSecretLeak}
                  onChange={(e) => {
                    setInjectSecretLeak(e.target.checked);
                    if (e.target.checked) setSelectedJobId('secret_and_sast_scan');
                  }}
                  className="mt-0.5 rounded border-slate-700 accent-rose-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-rose-300">
                    🔑 Lộ AWS_SECRET_ACCESS_KEY trong code
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Soi bước <code className="text-rose-200">secret_and_sast_scan</code> (gitleaks --exit-code 1) chặn ở giây thứ 0.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-amber-500/40">
                <input
                  type="checkbox"
                  checked={injectTrivyCve}
                  onChange={(e) => {
                    setInjectTrivyCve(e.target.checked);
                    if (e.target.checked) setSelectedJobId('build_and_trivy_scan');
                  }}
                  className="mt-0.5 rounded border-slate-700 accent-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-amber-300">
                    🛡️ Thư viện chứa lỗ hổng CVE Critical (Đã có bản vá)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Soi bước <code className="text-amber-200">build_and_trivy_scan</code> (trivy --exit-code 1 --ignore-unfixed).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-violet-500/40">
                <input
                  type="checkbox"
                  checked={injectStaging500}
                  onChange={(e) => {
                    setInjectStaging500(e.target.checked);
                    if (e.target.checked) setSelectedJobId('deploy_to_staging');
                  }}
                  className="mt-0.5 rounded border-slate-700 accent-violet-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-violet-300">
                    💥 Cổng /health trên Staging trả về HTTP 500
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Soi bước <code className="text-violet-200">deploy_to_staging</code> (curl --fail --retry 5).
                  </div>
                </div>
              </label>
            </div>

            {/* Action Trigger Buttons */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => startPipelineSimulation(false)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Kích hoạt Chạy Pipeline (Đồng bộ Code theo Bước)</span>
              </button>

              <button
                onClick={() => startPipelineSimulation(true)}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 transition-all"
              >
                <Zap className="h-4 w-4" />
                <span>Giả lập Push 3 Commit Liên tiếp trên PR (Concurrency)</span>
              </button>

              <button
                onClick={() => resetPipeline(preset)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại Đường ống</span>
              </button>
            </div>
          </div>

          {/* Right Live DAG Graph + Synchronized YAML Code Inspector + Console Logs (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Concurrency YAML Highlight Banner when PR Burst is triggered */}
            {showConcurrencyBanner && (
              <div className="ide-dark-surface rounded-2xl border border-amber-500/50 bg-amber-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold text-amber-300">
                    <Zap className="h-4 w-4" />
                    ĐOẠN CODE CONCURRENCY VỪA TỰ ĐỘNG HỦY 2 COMMIT CŨ TRÊN PR:
                  </span>
                  <span className="font-mono text-[11px] text-amber-200">
                    Tiết kiệm 66% số phút CI Runner
                  </span>
                </div>
                <pre className="rounded-xl border border-amber-500/30 bg-slate-950 p-3 font-mono text-xs text-amber-200 overflow-x-auto leading-relaxed">
                  {`# Khai báo ở đầu file .github/workflows/lean-ci-cd.yml (hoặc interruptible: true trên GitLab CI):
concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.ref }}
  # Hủy ngay lập tức các lần chạy PR cũ khi có commit mới, nhưng bảo vệ nhánh main:
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}`}
                </pre>
              </div>
            )}

            {/* Visual DAG Pipeline Status Board (Clickable Nodes!) */}
            <div
              className={cn(
                'rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:p-5 space-y-3 sm:space-y-4',
                mobileSimSection !== 'all' &&
                  mobileSimSection !== 'board-code' &&
                  'hidden lg:block'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <GitCommitHorizontal className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="font-mono text-xs font-bold text-white">
                    Pipeline #{runCounter} • Bấm vào ô Job để soi Code YAML 👇
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-mono">
                  <span className="text-emerald-400">● Pass</span>
                  <span className="text-sky-400">● Run</span>
                  <span className="text-amber-400">● Gate</span>
                  <span className="text-rose-400">● Fail</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {jobs.map((job) => {
                  const isSelected = job.id === selectedJobId;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedJobId(job.id);
                        }
                      }}
                      className={cn(
                        'rounded-xl border p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2 transition-all cursor-pointer text-left relative',
                        job.status === 'idle' &&
                          'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700',
                        job.status === 'running' &&
                          'border-sky-500 bg-sky-500/15 text-white ring-2 ring-sky-400/50 animate-pulse',
                        job.status === 'passed' &&
                          'border-emerald-500/50 bg-emerald-500/10 text-white',
                        job.status === 'failed' &&
                          'border-rose-500 bg-rose-500/15 text-white ring-2 ring-rose-500/50',
                        job.status === 'waiting_approval' &&
                          'border-amber-500 bg-amber-500/15 text-white ring-2 ring-amber-400/60',
                        (job.status === 'cancelled' ||
                          job.status === 'skipped') &&
                          'border-slate-800 bg-slate-950/30 text-slate-500 opacity-60',
                        isSelected &&
                          'ring-2 ring-cyan-400 border-cyan-400 shadow-lg shadow-cyan-500/10'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold text-cyan-300 border border-slate-700 truncate">
                          {job.stage}
                        </span>
                        <span className="font-mono text-[9px] sm:text-[10px] shrink-0">
                          {job.status === 'passed' && '✅'}
                          {job.status === 'running' && '⏳'}
                          {job.status === 'failed' && '❌'}
                          {job.status === 'waiting_approval' && '⏸️'}
                          {job.status === 'cancelled' && '🚫'}
                          {job.status === 'skipped' && '⏭️'}
                          {job.status === 'idle' && job.durationLabel}
                        </span>
                      </div>

                      <div className="text-[11px] sm:text-xs font-bold leading-snug flex items-center justify-between gap-1">
                        <span className="truncate">{job.name}</span>
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/40 shrink-0">
                            <Code2 className="h-3 w-3" />
                            Code
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono line-clamp-2">
                        {job.subtitle}
                      </div>

                      {job.status === 'waiting_approval' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualApproveProd();
                          }}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 rounded-lg bg-amber-400 px-2 py-1.5 text-[10px] sm:text-[11px] font-extrabold text-slate-950 hover:bg-amber-300 shadow-md"
                        >
                          <Lock className="h-3 w-3 shrink-0" />
                          <span>Approve & Deploy</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===============================================================
                NEW: LIVE SYNCHRONIZED CI/CD CODE X-RAY INSPECTOR
               =============================================================== */}
            <div
              className={cn(
                'ide-dark-surface rounded-2xl border border-cyan-500/40 bg-slate-950 p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl',
                mobileSimSection !== 'all' &&
                  mobileSimSection !== 'board-code' &&
                  'hidden lg:block'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
                    <FileCode2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-extrabold text-white">
                        Code CI/CD Tương ứng: {activeJob.name}
                      </span>
                      <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-slate-700">
                        {activeJob.codeFile} ({activeJob.lineRange})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tự động nhảy theo bước đang chạy hoặc bước bạn đang bấm chọn ở sơ đồ trên
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
                  <button
                    onClick={() => setCodeViewTab('step-xray')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                      codeViewTab === 'step-xray'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Code của Bước Này (X-Ray)</span>
                  </button>
                  <button
                    onClick={() => setCodeViewTab('full-file')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                      codeViewTab === 'full-file'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Toàn bộ File Pipeline ({ jobs.length } Jobs)</span>
                  </button>
                </div>
              </div>

              {codeViewTab === 'step-xray' ? (
                <div className="grid gap-4 lg:grid-cols-12 items-start">
                  {/* YAML Code Snippet of the Active Job */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>📄 {activeJob.codeFile}</span>
                      <span
                        className={cn(
                          'font-bold',
                          activeJob.status === 'running' && 'text-sky-400',
                          activeJob.status === 'passed' && 'text-emerald-400',
                          activeJob.status === 'failed' && 'text-rose-400',
                          activeJob.status === 'waiting_approval' &&
                            'text-amber-400'
                        )}
                      >
                        Trạng thái: {activeJob.status.toUpperCase()}
                      </span>
                    </div>
                    <pre className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed">
                      {activeJob.yamlSnippet}
                    </pre>

                    {/* Show Chaos Fault Snippet if this job failed or if chaos is toggled for this job */}
                    {activeJob.chaosFailSnippet &&
                      ((activeJob.id === 'secret_and_sast_scan' &&
                        injectSecretLeak) ||
                        (activeJob.id === 'build_and_trivy_scan' &&
                          injectTrivyCve) ||
                        (activeJob.id === 'deploy_to_staging' &&
                          injectStaging500)) && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 space-y-1.5">
                          <div className="font-mono text-[11px] font-extrabold text-rose-300">
                            🔍 Cận cảnh Lệnh Bắt Lỗi Khi Bật Bẫy Sự Cố (Chaos Injection):
                          </div>
                          <pre className="font-mono text-[11px] text-rose-200 overflow-x-auto leading-relaxed">
                            {activeJob.chaosFailSnippet}
                          </pre>
                        </div>
                      )}
                  </div>

                  {/* Line-by-Line Architecture Breakdown */}
                  <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                      <span>Giải phẫu Ý nghĩa Từng Dòng Cấu hình:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {activeJob.codeBreakdown.map((item, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg border border-slate-800/90 bg-slate-950/80 p-2.5 leading-relaxed"
                        >
                          <span className="text-cyan-400 font-bold mr-1.5">
                            #{idx + 1}:
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Full File Pipeline View with Active Job Highlighted */
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {jobs.map((j) => {
                    const isCurrent = j.id === selectedJobId;
                    return (
                      <div
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={cn(
                          'rounded-xl border p-3 transition-all cursor-pointer',
                          isCurrent
                            ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/50'
                            : 'border-slate-800/80 bg-slate-900/40 opacity-75 hover:opacity-100'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                          <span className="font-bold text-cyan-300">
                            # {j.stage} — {j.name} ({j.lineRange})
                          </span>
                          {isCurrent && (
                            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                              Đang chọn / Đang chạy
                            </span>
                          )}
                        </div>
                        <pre className="font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                          {j.yamlSnippet}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Streaming CI Runner Terminal Logs */}
            <div
              className={cn(
                'ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-3.5 sm:p-4 space-y-3',
                mobileSimSection !== 'all' &&
                  mobileSimSection !== 'logs' &&
                  'hidden lg:block'
              )}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">
                    CI Runner Live Console Output (ubuntu-24.04 / K8s Executor)
                  </span>
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                  $WORKSPACE: /builds/company/order-service
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-xs p-2">
                {logs.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'leading-relaxed',
                      line.includes('✅') || line.includes('🎉')
                        ? 'text-emerald-300'
                        : line.includes('🚨') || line.includes('❌')
                        ? 'text-rose-300 font-bold'
                        : line.includes('⏸️') ||
                          line.includes('👉') ||
                          line.includes('⚡')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    )}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* =====================================================================
          SIMULATOR MODE 2: ZERO-DOWNTIME K8S TRAFFIC & SIGTERM LAB + LIVE CODE
         ===================================================================== */}
      {selectedSimulatorMode === 'traffic' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Controls: Strategy & 3 Zero-Downtime Pieces (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                1. Chọn Chiến lược Điều phối Lưu lượng (Mục 3.1)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'canary', label: 'Canary Release (5%→100%)' },
                    { id: 'blue-green', label: 'Blue-Green (100% Switch)' },
                    { id: 'rolling', label: 'Rolling Update (K8s)' },
                    { id: 'recreate', label: 'Recreate (Có Downtime!)' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setDeployStrategy(st.id);
                      setActiveTrafficCodeTab('strategy-manifest');
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-xs font-bold transition-all text-left',
                      deployStrategy === st.id
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {deployStrategy === 'canary' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">
                      Tỷ lệ lưu lượng sang Canary v2.0:
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      Stable v1.0: {100 - canaryWeight}% | Canary v2.0:{' '}
                      {canaryWeight}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={canaryWeight}
                    onChange={(e) => {
                      setCanaryWeight(Number(e.target.value));
                      setActiveTrafficCodeTab('strategy-manifest');
                    }}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0%</span>
                    <span>5% (Thử tải)</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>100% (Hoàn tất)</span>
                  </div>
                </div>
              )}

              {deployStrategy === 'blue-green' && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Nhãn Load Balancer Service Selector:
                  </span>
                  <button
                    onClick={() => {
                      setBlueGreenActive((v) =>
                        v === 'blue' ? 'green' : 'blue'
                      );
                      setActiveTrafficCodeTab('strategy-manifest');
                    }}
                    className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 font-mono font-bold text-cyan-300 hover:bg-cyan-500/30"
                  >
                    version: {blueGreenActive} (Bấm để Switch)
                  </button>
                </div>
              )}
            </div>

            {/* The 3 Zero-Downtime Pieces (Full Flow #3 & Tình huống B7) */}
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                2. Bộ 3 Mảnh ghép Code Chống Lỗi 502 Bad Gateway (Full Flow #3 & B7)
              </div>
              <p className="text-[11px] text-slate-400">
                Bật/tắt từng mảnh ghép dưới đây để xem{' '}
                <strong className="text-white">
                  mã nguồn Dockerfile, server.ts và deployment.yaml ở khung bên phải biến đổi trực tiếp
                </strong>{' '}
                như thế nào:
              </p>

              <label
                onClick={() => setActiveTrafficCodeTab('dockerfile')}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                  hasDumbInitExecForm
                    ? 'border-emerald-500/40 bg-slate-950'
                    : 'border-rose-500/60 bg-rose-950/20'
                )}
              >
                <input
                  type="checkbox"
                  checked={hasDumbInitExecForm}
                  onChange={(e) => {
                    setHasDumbInitExecForm(e.target.checked);
                    setActiveTrafficCodeTab('dockerfile');
                  }}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    Mảnh ghép 1/3: Dockerfile dumb-init + Exec Form
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ENTRYPOINT [&quot;/usr/bin/dumb-init&quot;, &quot;--&quot;]
                    CMD [&quot;node&quot;, &quot;dist/server.js&quot;]
                  </div>
                </div>
              </label>

              <label
                onClick={() => setActiveTrafficCodeTab('server-ts')}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                  hasServerCloseSigterm
                    ? 'border-emerald-500/40 bg-slate-950'
                    : 'border-rose-500/60 bg-rose-950/20'
                )}
              >
                <input
                  type="checkbox"
                  checked={hasServerCloseSigterm}
                  onChange={(e) => {
                    setHasServerCloseSigterm(e.target.checked);
                    setActiveTrafficCodeTab('server-ts');
                  }}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    Mảnh ghép 2/3: Backend bắt SIGTERM gọi server.close()
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Giữ sống HTTP request đang thanh toán dở rồi mới đóng dbPool
                  </div>
                </div>
              </label>

              <label
                onClick={() => setActiveTrafficCodeTab('k8s-deployment')}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                  hasPreStopSleep5
                    ? 'border-emerald-500/40 bg-slate-950'
                    : 'border-rose-500/60 bg-rose-950/20'
                )}
              >
                <input
                  type="checkbox"
                  checked={hasPreStopSleep5}
                  onChange={(e) => {
                    setHasPreStopSleep5(e.target.checked);
                    setActiveTrafficCodeTab('k8s-deployment');
                  }}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    Mảnh ghép 3/3: K8s maxUnavailable: 0 + preStop: sleep 5
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Ngủ 5s chờ NGINX Ingress rút xong IP Pod cũ (1–3s) trước khi gửi SIGTERM
                  </div>
                </div>
              </label>
            </div>

            <button
              onClick={triggerZeroDowntimeRolloutTest}
              disabled={isRolloutSimRunning}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-extrabold text-slate-950 hover:bg-cyan-400 transition-all shadow-lg"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Triển khai v2.0 Giữa Giờ Cao Điểm (1,200 RPS)</span>
            </button>
          </div>

          {/* Right Live Telemetry + Reactive 4-Tab Code Inspector (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="text-[10px] uppercase text-slate-400 font-bold">
                  Tổng Request
                </div>
                <div className="font-mono text-lg font-extrabold text-white mt-1">
                  {trafficMetrics.totalRequests.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="text-[10px] uppercase text-emerald-300 font-bold">
                  HTTP 200 OK
                </div>
                <div className="font-mono text-lg font-extrabold text-emerald-400 mt-1">
                  {trafficMetrics.ok200Count.toLocaleString()}
                </div>
              </div>
              <div
                className={cn(
                  'rounded-xl border p-3.5',
                  trafficMetrics.error502Count === 0
                    ? 'border-slate-800 bg-slate-900/80'
                    : 'border-rose-500 bg-rose-500/20 animate-pulse'
                )}
              >
                <div className="text-[10px] uppercase text-rose-300 font-bold">
                  Lỗi 502 Bad Gateway
                </div>
                <div
                  className={cn(
                    'font-mono text-lg font-extrabold mt-1',
                    trafficMetrics.error502Count === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  )}
                >
                  {trafficMetrics.error502Count}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <div className="text-[10px] uppercase text-cyan-300 font-bold">
                  Độ trễ P99
                </div>
                <div className="font-mono text-lg font-extrabold text-cyan-300 mt-1">
                  {trafficMetrics.p99LatencyMs} ms
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div
              className={cn(
                'rounded-xl border p-4 text-xs sm:text-sm font-bold',
                trafficMetrics.error502Count === 0
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-rose-500/50 bg-rose-500/15 text-rose-200'
              )}
            >
              {rolloutPhaseText}
            </div>

            {/* ===============================================================
                NEW: REACTIVE ZERO-DOWNTIME & STRATEGY CODE INSPECTOR
               =============================================================== */}
            <div className="ide-dark-surface rounded-2xl border border-cyan-500/40 bg-slate-950 p-4 space-y-3 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-xs font-extrabold text-white">
                    Code Cấu hình Thực tế Đang Áp dụng (Tự động đổi khi Bật/Tắt Công tắc):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      {
                        id: 'dockerfile',
                        label: '1. Dockerfile',
                        ok: hasDumbInitExecForm,
                      },
                      {
                        id: 'server-ts',
                        label: '2. src/server.ts',
                        ok: hasServerCloseSigterm,
                      },
                      {
                        id: 'k8s-deployment',
                        label: '3. k8s/deployment.yaml',
                        ok: hasPreStopSleep5,
                      },
                      {
                        id: 'strategy-manifest',
                        label: `4. Chiến lược (${deployStrategy})`,
                        ok: deployStrategy !== 'recreate',
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTrafficCodeTab(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition-all border',
                        activeTrafficCodeTab === tab.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {tab.ok ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-rose-400" />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeTrafficCodeTab === 'dockerfile' && (
                <pre
                  className={cn(
                    'rounded-xl border p-3.5 font-mono text-xs overflow-x-auto leading-relaxed',
                    hasDumbInitExecForm
                      ? 'border-emerald-500/40 bg-emerald-950/15 text-emerald-200'
                      : 'border-rose-500/50 bg-rose-950/25 text-rose-200'
                  )}
                >
                  {hasDumbInitExecForm
                    ? `# ✅ CHUẨN ZERO-DOWNTIME (Full Flow #3 — Dockerfile):
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Dùng dumb-init ở PID 1 + Exec Form (mảng JSON) để chuyển tiếp SIGTERM vào Node.js:
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]`
                    : `# 🚨 CẤU HÌNH SAI GÂY ĐỨT KẾT NỐI 502 (Khi tắt Mảnh ghép 1):
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist

# ❌ SAI LẦM: Dùng Shell Form hoặc gọi qua npm start!
# /bin/sh sẽ chiếm giữ PID 1 và NUỐT MẤT tín hiệu SIGTERM từ Kubernetes!
# Sau 35 giây chờ đợi vô ích, Linux Kernel giết cứng bằng SIGKILL (mã 137)!
CMD "npm start"`}
                </pre>
              )}

              {activeTrafficCodeTab === 'server-ts' && (
                <pre
                  className={cn(
                    'rounded-xl border p-3.5 font-mono text-xs overflow-x-auto leading-relaxed',
                    hasServerCloseSigterm
                      ? 'border-emerald-500/40 bg-emerald-950/15 text-emerald-200'
                      : 'border-rose-500/50 bg-rose-950/25 text-rose-200'
                  )}
                >
                  {hasServerCloseSigterm
                    ? `// ✅ CHUẨN ZERO-DOWNTIME (Full Flow #3 — src/server.ts):
let isShuttingDown = false;

app.get('/health/ready', (req, res) => {
  if (isShuttingDown) return res.status(503).json({ status: 'draining' });
  return res.status(200).json({ status: 'ready' });
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  // 1. Ngừng nhận kết nối TCP mới, nhưng GIỮ SỐNG các HTTP request đang chạy dở:
  server.close(async () => {
    // 2. Chỉ đóng kết nối Database SAU KHI khách hàng cuối cùng đã nhận HTTP 200 OK:
    await dbPool.end();
    process.exit(0);
  });
});`
                    : `// 🚨 CẤU HÌNH SAI GÂY ĐỨT GIAO DỊCH ĐANG XỬ LÝ (Khi tắt Mảnh ghép 2):
process.on('SIGTERM', () => {
  console.log('Nhận SIGTERM -> Thoát ngay lập tức!');
  // ❌ SAI LẦM: Không gọi server.close() mà thoát thẳng hoặc đóng DB ngay!
  // Toàn bộ 32 khách hàng đang thanh toán dở bị cắt ngang kết nối (502 Bad Gateway)!
  process.exit(0);
});`}
                </pre>
              )}

              {activeTrafficCodeTab === 'k8s-deployment' && (
                <pre
                  className={cn(
                    'rounded-xl border p-3.5 font-mono text-xs overflow-x-auto leading-relaxed',
                    hasPreStopSleep5
                      ? 'border-emerald-500/40 bg-emerald-950/15 text-emerald-200'
                      : 'border-rose-500/50 bg-rose-950/25 text-rose-200'
                  )}
                >
                  {hasPreStopSleep5
                    ? `# ✅ CHUẨN ZERO-DOWNTIME (Full Flow #3 — k8s/deployment.yaml):
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0 # Bắt buộc Pod v2.0 mới phải Ready 100% trước khi rút Pod v1.0 cũ!
  template:
    spec:
      terminationGracePeriodSeconds: 35
      containers:
        - name: api
          lifecycle:
            preStop:
              exec:
                # Ngủ 5 giây chờ NGINX Ingress cập nhật xong bảng IP (mất 1–3s)
                # rồi Kubelet mới được phép phát tín hiệu SIGTERM vào Container:
                command: ["/bin/sh", "-c", "sleep 5"]`
                    : `# 🚨 CẤU HÌNH SAI GÂY LỖI ĐUA TỐC ĐỘ ASYNC 502 (Khi tắt Mảnh ghép 3):
spec:
  strategy:
    rollingUpdate:
      maxUnavailable: 25% # ❌ Cho phép giết Pod cũ ngay cả khi Pod mới chưa khởi động xong!
  template:
    spec:
      containers:
        - name: api
          # ❌ THIẾU lifecycle.preStop sleep 5!
          # Container đóng cổng HTTP ở mili-giây thứ 1, trong khi NGINX Ingress
          # mất 1–3 giây mới rút xong IP -> 68 request đâm vào cổng đóng (502)!`}
                </pre>
              )}

              {activeTrafficCodeTab === 'strategy-manifest' && (
                <pre className="rounded-xl border border-cyan-500/30 bg-slate-900/90 p-3.5 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed">
                  {deployStrategy === 'canary' &&
                    `# Kịch bản Canary Release (Argo Rollouts / NGINX Canary Weight = ${canaryWeight}%):
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-api
spec:
  strategy:
    canary:
      steps:
        - setWeight: ${canaryWeight} # Hiện đang điều hướng ${canaryWeight}% request thật sang v2.0 (${100 - canaryWeight}% ở v1.0)
        - pause: { duration: 5m }   # Tự động theo dõi tỷ lệ lỗi 5xx & P99 Latency trước khi tăng lên 100%`}
                  {deployStrategy === 'blue-green' &&
                    `# Kịch bản Blue-Green Deployment (Kubernetes Service Selector Switch):
apiVersion: v1
kind: Service
metadata:
  name: order-api-public
spec:
  selector:
    app: order-api
    version: ${blueGreenActive} # <-- Bấm Switch đổi nhãn từ "blue" (v1.0) sang "green" (v2.0) trong 1ms!`}
                  {deployStrategy === 'rolling' &&
                    `# Kịch bản Rolling Update cuốn chiếu chuẩn Kubernetes:
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Bật thêm 1 Pod v2.0 mới (tổng cộng 5 Pod)
      maxUnavailable: 0  # Đợi Pod v2.0 báo Readiness Probe 200 OK rồi mới tắt 1 Pod v1.0 cũ`}
                  {deployStrategy === 'recreate' &&
                    `# ⚠️ Kịch bản Recreate (Gây Downtime hoàn toàn — KHÔNG dùng cho Production!):
spec:
  replicas: 4
  strategy:
    type: Recreate # Xóa toàn bộ 4 Pod v1.0 cùng lúc -> Hệ thống chết 100% trong lúc chờ Pod v2.0 bật lên!`}
                </pre>
              )}
            </div>

            {/* Detailed Analysis Log */}
            <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <div className="font-mono text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2">
                Nhật ký Đồng bộ NGINX Ingress, Kubernetes Kubelet & Tiến trình Node.js:
              </div>
              <div className="space-y-2 font-mono text-xs">
                {trafficEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-2 rounded-lg border leading-relaxed',
                      ev.includes('🚨') || ev.includes('⚠️')
                        ? 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                        : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                    )}
                  >
                    {ev}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
