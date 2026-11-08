import { CicdPracticeExercise } from '../types/cicd.types';

export const CICD_PRACTICE_EXERCISES: CicdPracticeExercise[] = [
  {
    id: 'cicd-ex-1-lean-github-actions',
    title: 'Bài 1: Cấu hình Concurrency, Service Containers & Smoke Test trên GitHub Actions (Full Flow #1)',
    category: 'github-actions',
    level: 'basic',
    pdfRef: 'Mục 1.4 — Trang 4 & 5 / 21',
    scenario:
      'Đội ngũ phát triển đang gặp 3 vấn đề trên GitHub Actions: (1) Khi dev đẩy 3 commit liên tiếp trên PR, cả 3 lần chạy cùng lúc gây tốn phút miễn phí; (2) Dùng lệnh npm install làm lệch phiên bản thư viện; (3) Bước Smoke Test gọi curl nhưng khi server trả lỗi 500 thì Pipeline vẫn báo xanh!',
    taskDescription:
      'Hãy hoàn thiện file .github/workflows/lean-ci-cd.yml dưới đây theo đúng chuẩn Full Flow #1: bật hủy tự động trên PR (nhưng bảo vệ nhánh main), thêm cờ --health-cmd pg_isready cho Postgres, đổi sang npm ci, và thêm cờ --fail --retry 5 cho lệnh curl ở bước Smoke Test.',
    requirements: [
      'Khối concurrency phải có cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }}',
      'Service postgres phải có --health-cmd pg_isready trong phần options',
      'Sử dụng lệnh npm ci thay vì npm install để cài đặt chính xác theo package-lock.json',
      'Lệnh curl ở bước Smoke Test phải có cờ --fail và --retry 5',
    ],
    language: 'yaml',
    starterCode: `name: Lean CI/CD Pipeline
on:
  push: { branches: ["main"] }
  pull_request: { branches: ["main"] }

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  # TODO 1: Chỉ hủy trên nhánh PR, không hủy ngang trên nhánh main
  cancel-in-progress: false

jobs:
  verify-and-build:
    runs-on: ubuntu-24.04
    timeout-minutes: 12
    services:
      postgres:
        image: postgres:16-alpine
        ports: ["5432:5432"]
        # TODO 2: Thêm cờ kiểm tra sức khỏe pg_isready
        options: --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      # TODO 3: Đổi sang lệnh cài đặt nghiêm ngặt theo lockfile
      - run: npm install
      - run: npm run lint && npm run test:ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/ }

  deploy-staging:
    needs: ["verify-and-build"]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/ }
      # TODO 4: Thêm cờ --fail và --retry 5 cho lệnh curl Smoke Test
      - run: ./scripts/deploy-staging.sh && curl https://staging.api.company.com/health`,
    solutionCode: `name: Lean CI/CD Pipeline
on:
  push: { branches: ["main"] }
  pull_request: { branches: ["main"] }

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}

jobs:
  verify-and-build:
    runs-on: ubuntu-24.04
    timeout-minutes: 12
    services:
      postgres:
        image: postgres:16-alpine
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 3s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint && npm run test:ci && npm run build
      - uses: actions/upload-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/ }

  deploy-staging:
    needs: ["verify-and-build"]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/download-artifact@v4
        with: { name: build-\${{ github.sha }}, path: dist/ }
      - run: ./scripts/deploy-staging.sh && curl --fail --retry 5 --retry-delay 3 https://staging.api.company.com/health`,
    hints: [
      'Ở TODO 1: viết cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }}',
      'Ở TODO 2: thêm --health-cmd pg_isready vào dòng options của postgres',
      'Ở TODO 3: thay npm install bằng npm ci',
      'Ở TODO 4: sửa lệnh curl thành curl --fail --retry 5 https://staging.api.company.com/health',
    ],
    validationRules: [
      {
        id: 'r1-concurrency',
        description: 'Có biểu thức github.ref != \'refs/heads/main\' trong cancel-in-progress',
        mustContainAny: ["github.ref != 'refs/heads/main'", 'github.ref != "refs/heads/main"'],
        errorHint: 'Hãy đặt cancel-in-progress: ${{ github.ref != \'refs/heads/main\' }} để chỉ hủy trên PR.',
      },
      {
        id: 'r2-pg-isready',
        description: 'Service Postgres có cờ --health-cmd pg_isready',
        mustContainAny: ['--health-cmd pg_isready'],
        errorHint: 'Thiếu --health-cmd pg_isready trong phần options của service postgres.',
      },
      {
        id: 'r3-npm-ci',
        description: 'Sử dụng npm ci thay cho npm install',
        mustContainAny: ['npm ci'],
        mustNotContain: ['npm install'],
        errorHint: 'Hãy thay thế hoàn toàn npm install bằng npm ci.',
      },
      {
        id: 'r4-curl-fail',
        description: 'Lệnh curl có cờ --fail và --retry 5',
        mustContainAny: ['--fail'],
        errorHint: 'Lệnh curl cần có cờ --fail (và --retry 5) để trả về mã thoát khác 0 khi gặp HTTP 500/502.',
      },
    ],
    explanationAfterPass:
      'Xuất sắc! Bạn đã hoàn thiện Full Flow #1 chuẩn mực: vừa tiết kiệm số phút Runner nhờ Concurrency thông minh, vừa đảm bảo Database sẵn sàng bằng pg_isready, và bắt chính xác lỗi HTTP 5xx sau khi Deploy bằng curl --fail.',
  },
  {
    id: 'cicd-ex-2-gitlab-dag-sharding-trivy',
    title: 'Bài 2: Tối ưu GitLab CI với Cache pull-only, Đồ thị DAG, Test Sharding (4x) & Trivy Scan (Full Flow #2)',
    category: 'gitlab-ci',
    level: 'advanced',
    pdfRef: 'Mục 2.4 — Trang 7 & 8 / 21',
    scenario:
      'Pipeline GitLab CI của công ty đang chạy quá chậm và thiếu chốt phê duyệt an toàn: (1) Mọi Job đều nén lại Cache ở cuối Job làm mất 50s/máy; (2) Bộ 1.200 bài test chỉ chạy trên 1 container mất 12 phút; (3) Job quét Semgrep phải ngồi chờ bước Lint xong mới chạy; (4) Bước lên Production chưa có khóa tuần tự và chưa chặn duyệt tay.',
    taskDescription:
      'Hãy nâng cấp tệp .gitlab-ci.yml dưới đây theo chuẩn Full Flow #2: đặt cache mặc định là policy: pull, bật parallel: 4 cho bài test, đặt needs: [] cho Semgrep chạy ngay ở giây thứ 0, thêm cờ --ignore-unfixed cho Trivy và bật when: manual + allow_failure: false cho Production.',
    requirements: [
      'Khối default.cache phải đặt policy: pull',
      'Job unit_and_integration_test phải có parallel: 4',
      'Job secret_and_sast_scan phải có needs: [] để chạy ngay ở giây thứ 0 (DAG)',
      'Lệnh trivy image phải có cờ --ignore-unfixed và --exit-code 1',
      'Job approve_and_deploy_prod phải có when: manual và allow_failure: false',
    ],
    language: 'yaml',
    starterCode: `stages: ["validate", "security_and_test", "package", "deploy_prod"]

default:
  cache:
    key: { files: ["package-lock.json"] }
    paths: [".npm/"]
    # TODO 1: Đặt chính sách mặc định chỉ kéo Cache về đọc (pull)
    policy: pull-push

lint_and_warm_cache:
  stage: validate
  cache: { key: { files: ["package-lock.json"] }, paths: [".npm/"], policy: pull-push }
  script: ["npm ci --cache .npm --prefer-offline", "npm run lint"]

unit_and_integration_test:
  stage: security_and_test
  needs: ["lint_and_warm_cache"]
  # TODO 2: Nhân bản thành 4 Container chạy song song (Test Sharding)
  script:
    - npx jest --shard=\$CI_NODE_INDEX/\$CI_NODE_TOTAL --ci

secret_and_sast_scan:
  stage: security_and_test
  # TODO 3: Khai báo DAG mảng rỗng để chạy ngay ở giây thứ 0 không cần chờ Lint
  script: ["semgrep ci --config auto --error"]

build_and_trivy_scan:
  stage: package
  needs: ["unit_and_integration_test", "secret_and_sast_scan"]
  script:
    - docker build -t "\$IMAGE_TAG" .
    # TODO 4: Thêm cờ --exit-code 1 và --ignore-unfixed cho Trivy
    - trivy image --severity CRITICAL,HIGH "\$IMAGE_TAG"

approve_and_deploy_prod:
  stage: deploy_prod
  needs: ["build_and_trivy_scan"]
  resource_group: prod-cluster-lock
  # TODO 5: Cấu hình when: manual và allow_failure: false
  rules:
    - if: '\$CI_COMMIT_BRANCH == "main"'`,
    solutionCode: `stages: ["validate", "security_and_test", "package", "deploy_prod"]

default:
  cache:
    key: { files: ["package-lock.json"] }
    paths: [".npm/"]
    policy: pull

lint_and_warm_cache:
  stage: validate
  cache: { key: { files: ["package-lock.json"] }, paths: [".npm/"], policy: pull-push }
  script: ["npm ci --cache .npm --prefer-offline", "npm run lint"]

unit_and_integration_test:
  stage: security_and_test
  needs: ["lint_and_warm_cache"]
  parallel: 4
  script:
    - npx jest --shard=\$CI_NODE_INDEX/\$CI_NODE_TOTAL --ci

secret_and_sast_scan:
  stage: security_and_test
  needs: []
  script: ["semgrep ci --config auto --error"]

build_and_trivy_scan:
  stage: package
  needs: ["unit_and_integration_test", "secret_and_sast_scan"]
  script:
    - docker build -t "\$IMAGE_TAG" .
    - trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH "\$IMAGE_TAG"

approve_and_deploy_prod:
  stage: deploy_prod
  needs: ["build_and_trivy_scan"]
  resource_group: prod-cluster-lock
  rules:
    - if: '\$CI_COMMIT_BRANCH == "main"'
      when: manual
      allow_failure: false`,
    hints: [
      'Ở TODO 1: đổi policy: pull-push trong khối default thành policy: pull',
      'Ở TODO 2: thêm dòng parallel: 4 bên trong unit_and_integration_test',
      'Ở TODO 3: thêm dòng needs: [] bên trong secret_and_sast_scan',
      'Ở TODO 4: sửa lệnh trivy thành trivy image --exit-code 1 --ignore-unfixed --severity CRITICAL,HIGH "$IMAGE_TAG"',
      'Ở TODO 5: thêm when: manual và allow_failure: false vào trong rules của approve_and_deploy_prod',
    ],
    validationRules: [
      {
        id: 'r1-policy-pull',
        description: 'Khối default dùng policy: pull',
        mustContainAny: ['policy: pull'],
        errorHint: 'Hãy đặt policy: pull trong khối default.cache.',
      },
      {
        id: 'r2-parallel-4',
        description: 'Bật Test Sharding với parallel: 4',
        mustContainAny: ['parallel: 4'],
        errorHint: 'Hãy thêm thuộc tính parallel: 4 cho Job unit_and_integration_test.',
      },
      {
        id: 'r3-needs-empty',
        description: 'Dùng needs: [] để kích hoạt DAG chạy ngay ở giây thứ 0',
        mustContainAny: ['needs: []'],
        errorHint: 'Hãy thêm needs: [] vào Job secret_and_sast_scan.',
      },
      {
        id: 'r4-trivy-ignore-unfixed',
        description: 'Trivy có cờ --ignore-unfixed và --exit-code 1',
        mustContainAny: ['--ignore-unfixed'],
        errorHint: 'Hãy thêm --exit-code 1 --ignore-unfixed vào lệnh trivy image.',
      },
      {
        id: 'r5-manual-gate',
        description: 'Cổng phê duyệt có when: manual và allow_failure: false',
        mustContainAny: ['allow_failure: false'],
        errorHint: 'Hãy thêm when: manual và allow_failure: false vào rules của approve_and_deploy_prod.',
      },
    ],
    explanationAfterPass:
      'Tuyệt vời! Bạn đã làm chủ toàn bộ kỹ thuật cốt lõi của Full Flow #2: tiết kiệm I/O bằng Cache pull, tăng tốc 4 lần bằng Test Sharding + DAG, lọc CVE thông minh bằng --ignore-unfixed và khóa cổng Production bằng Manual Approval Gate.',
  },
  {
    id: 'cicd-ex-3-dockerfile-zero-downtime',
    title: 'Bài 3: Sửa Dockerfile Chuẩn Multi-Stage, Layer Cache, Non-Root & dumb-init Chuyển tiếp SIGTERM (Full Flow #3)',
    category: 'zero-downtime-k8s',
    level: 'pro',
    pdfRef: 'Mục 4.1 (Mảnh ghép 1/3) — Trang 11 / 21',
    scenario:
      'Dockerfile hiện tại của dự án mắc 3 lỗi nghiêm trọng: (1) Copy toàn bộ mã nguồn COPY . . trước khi chạy npm ci khiến mỗi lần sửa 1 dòng code lại mất 3 phút tải lại node_modules; (2) Chạy container bằng tài khoản root mặc định; (3) Dùng lệnh CMD "npm start" dạng Shell làm nuốt mất tín hiệu SIGTERM gây lỗi 502 Bad Gateway khi Kubernetes tắt Pod!',
    taskDescription:
      'Hãy sửa lại Dockerfile Multi-Stage dưới đây theo đúng chuẩn Mảnh ghép 1/3 của Full Flow #3: copy package.json trước khi chạy npm ci, xóa devDependencies bằng npm prune --omit=dev, hạ quyền xuống USER node và dùng ENTRYPOINT ["/usr/bin/dumb-init", "--"] kèm CMD ["node", "dist/server.js"].',
    requirements: [
      'Copy package.json package-lock.json ./ trước lệnh RUN npm ci để tối ưu Docker Layer Cache',
      'Xóa devDependencies sau khi build bằng npm prune --omit=dev',
      'Hạ quyền xuống tài khoản không phải root bằng chỉ thị USER node',
      'Sử dụng Exec Form (ngoặc vuông) với ENTRYPOINT [ "/usr/bin/dumb-init", "--" ] và CMD [ "node", "dist/server.js" ] (không dùng CMD "npm start")',
    ],
    language: 'dockerfile',
    starterCode: `FROM node:20-alpine AS builder
WORKDIR /app
# TODO 1: Copy package.json và package-lock.json TRƯỚC khi chạy npm ci để tận dụng Layer Cache
COPY . .
RUN npm ci
# TODO 2: Thêm '&& npm prune --omit=dev' sau khi build để xóa devDependencies nặng nề
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production
# TODO 3: Hạ quyền xuống tài khoản 'node' (Non-root user)

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
EXPOSE 3000
# TODO 4: Thay CMD "npm start" bằng ENTRYPOINT dumb-init và CMD Exec Form gọi trực tiếp node
CMD "npm start"`,
    solutionCode: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
EXPOSE 3000
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "node", "dist/server.js" ]`,
    hints: [
      'Ở Stage 1: viết COPY package.json package-lock.json ./ rồi RUN npm ci, sau đó mới COPY src/ ./src/',
      'Ở lệnh build: viết RUN npm run build && npm prune --omit=dev',
      'Ở Stage 2: thêm dòng USER node trước khi COPY',
      'Ở cuối file: xóa CMD "npm start" và thay bằng ENTRYPOINT [ "/usr/bin/dumb-init", "--" ] cùng CMD [ "node", "dist/server.js" ]',
    ],
    validationRules: [
      {
        id: 'r1-layer-cache',
        description: 'Copy package.json trước khi chạy npm ci',
        mustContainAny: ['COPY package.json', 'COPY package*.json'],
        errorHint: 'Hãy COPY package.json package-lock.json ./ ở dòng trước RUN npm ci.',
      },
      {
        id: 'r2-prune-dev',
        description: 'Xóa devDependencies bằng npm prune --omit=dev',
        mustContainAny: ['npm prune --omit=dev'],
        errorHint: 'Hãy thêm && npm prune --omit=dev sau lệnh npm run build.',
      },
      {
        id: 'r3-user-node',
        description: 'Hạ quyền xuống USER node',
        mustContainAny: ['USER node'],
        errorHint: 'Hãy thêm chỉ thị USER node ở Stage 2 (runner).',
      },
      {
        id: 'r4-exec-form',
        description: 'Dùng ENTRYPOINT dumb-init và CMD Exec Form (không dùng npm start)',
        mustContainAny: ['"dist/server.js"', "'dist/server.js'"],
        mustNotContain: ['npm start'],
        errorHint: 'Tuyệt đối không dùng CMD "npm start" — hãy dùng ENTRYPOINT ["/usr/bin/dumb-init", "--"] và CMD ["node", "dist/server.js"].',
      },
    ],
    explanationAfterPass:
      'Chính xác! Dockerfile của bạn hiện đã đạt chuẩn Production: tận dụng 100% Layer Cache khi sửa code, loại bỏ toàn bộ gói thừa, chạy dưới quyền non-root an toàn và chuyển tiếp 100% tín hiệu SIGTERM vào Node.js.',
  },
  {
    id: 'cicd-ex-4-k8s-prestop-readiness-manifest',
    title: 'Bài 4: Cấu hình Kubernetes Deployment Chống Lỗi 502 Bad Gateway (maxUnavailable: 0 + ReadinessProbe + preStop)',
    category: 'zero-downtime-k8s',
    level: 'pro',
    pdfRef: 'Mục 4.1 (Mảnh ghép 3/3) & Tình huống B7 — Trang 12, 13 & 21',
    scenario:
      'Mỗi khi chạy Pipeline Deploy lên cụm Kubernetes lúc đông người dùng, hệ thống lại xuất hiện 50–100 request bị lỗi 502 Bad Gateway do Pod cũ đóng cổng HTTP trước khi NGINX Ingress kịp rút IP, và Pod mới nhận traffic khi chưa kết nối xong Database.',
    taskDescription:
      'Hãy hoàn thiện file k8s/deployment.yaml dưới đây theo đúng chuẩn Mảnh ghép 3/3: đặt maxUnavailable: 0, cấu hình readinessProbe kiểm tra cổng /health/ready, và thêm preStop hook ngủ 5 giây (sleep 5) chờ Ingress rút xong IP.',
    requirements: [
      'Cấu hình rollingUpdate với maxSurge: 1 và maxUnavailable: 0',
      'Khai báo readinessProbe gọi httpGet vào path: /health/ready ở port: 3000',
      'Khai báo lifecycle.preStop thực thi lệnh sleep 5 (/bin/sh -c "sleep 5")',
    ],
    language: 'yaml',
    starterCode: `apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service, namespace: production }
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    # TODO 1: Đặt maxUnavailable: 0 để bắt buộc Pod mới phải Ready trước khi tắt Pod cũ
    rollingUpdate: { maxSurge: 1, maxUnavailable: 1 }
  template:
    spec:
      terminationGracePeriodSeconds: 35
      containers:
        - name: app
          image: registry.company.com/order-service:a1b2c3d
          # TODO 2: Thêm readinessProbe kiểm tra httpGet path: /health/ready, port: 3000

          # TODO 3: Thêm lifecycle.preStop chạy lệnh sleep 5 chờ NGINX Ingress rút IP
`,
    solutionCode: `apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service, namespace: production }
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    spec:
      terminationGracePeriodSeconds: 35
      containers:
        - name: app
          image: registry.company.com/order-service:a1b2c3d
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
            periodSeconds: 3
            successThreshold: 2
          lifecycle:
            preStop: { exec: { command: [ "/bin/sh", "-c", "sleep 5" ] } }`,
    hints: [
      'Ở TODO 1: đổi maxUnavailable: 1 thành maxUnavailable: 0',
      'Ở TODO 2: thêm khối readinessProbe: với httpGet: { path: /health/ready, port: 3000 }',
      'Ở TODO 3: thêm khối lifecycle: với preStop: { exec: { command: [ "/bin/sh", "-c", "sleep 5" ] } }',
    ],
    validationRules: [
      {
        id: 'r1-max-unavailable-0',
        description: 'Đặt maxUnavailable: 0 trong rollingUpdate',
        mustContainAny: ['maxUnavailable: 0'],
        errorHint: 'Hãy đặt maxUnavailable: 0 để không làm hụt số lượng Pod đang phục vụ.',
      },
      {
        id: 'r2-readiness-probe',
        description: 'Cấu hình readinessProbe gọi vào /health/ready',
        mustContainAny: ['/health/ready'],
        errorHint: 'Hãy thêm readinessProbe kiểm tra đường dẫn /health/ready.',
      },
      {
        id: 'r3-prestop-sleep',
        description: 'Cấu hình preStop hook chạy sleep 5',
        mustContainAny: ['sleep 5'],
        errorHint: 'Hãy thêm lifecycle.preStop chạy lệnh sleep 5 để chờ Ingress rút IP.',
      },
    ],
    explanationAfterPass:
      'Hoàn hảo! Với maxUnavailable: 0, readinessProbe (/health/ready) và preStop: sleep 5, cụm Kubernetes của bạn đã triệt tiêu hoàn toàn khoảng trống bất đồng bộ 1–3 giây của NGINX Ingress.',
  },
  {
    id: 'cicd-ex-5-b2-race-condition-concurrency',
    title: 'Bài 5: Xử lý Sự cố Ghi đè Phiên bản (Deployment Race Condition — Tình huống B2 & OIDC)',
    category: 'troubleshooting',
    level: 'master',
    pdfRef: 'Tình huống B2 (Trang 18) & Mục 4.3 (Trang 14)',
    scenario:
      'Hai lập trình viên vừa merge 2 PR cách nhau 30 giây (Commit A trước, Commit B sau). Pipeline của B chạy xong trước và lên Production, sau đó Pipeline của A mới xong và ghi đè code cũ (A) lên code mới (B)! Ngoài ra, bước Deploy đang dùng khóa tĩnh AWS_SECRET_ACCESS_KEY thay vì OIDC.',
    taskDescription:
      'Hãy sửa lại file workflow dưới đây để: (1) Cấp quyền id-token: write cho OIDC; (2) Ở Job ci_verify trên PR, bật cancel-in-progress: true; (3) Ở Job cd_production, đặt group: production-deploy-lock và bắt buộc đặt cancel-in-progress: false để xếp hàng tuần tự an toàn mà không làm hỏng Terraform/Helm State.',
    requirements: [
      'Khai báo permissions có id-token: write để sinh JWT Token xác thực OIDC',
      'Job ci_verify có cancel-in-progress: true',
      'Job cd_production có group: production-deploy-lock và cancel-in-progress: false',
    ],
    language: 'yaml',
    starterCode: `permissions:
  # TODO 1: Cấp quyền sinh JWT Token ngắn hạn cho OIDC
  contents: read

jobs:
  ci_verify:
    runs-on: ubuntu-24.04
    concurrency:
      group: ci-\${{ github.workflow }}-\${{ github.ref }}
      # TODO 2: Hủy ngay lần test cũ trên nhánh PR
      cancel-in-progress: false
    steps:
      - run: npm ci && npm test

  cd_production:
    needs: ["ci_verify"]
    runs-on: ubuntu-24.04
    environment: production
    # TODO 3: Thêm khối concurrency với group: production-deploy-lock và cancel-in-progress: false
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
      - run: ./scripts/rollout-prod.sh "\${{ github.sha }}"`,
    solutionCode: `permissions:
  id-token: write
  contents: read

jobs:
  ci_verify:
    runs-on: ubuntu-24.04
    concurrency:
      group: ci-\${{ github.workflow }}-\${{ github.ref }}
      cancel-in-progress: true
    steps:
      - run: npm ci && npm test

  cd_production:
    needs: ["ci_verify"]
    runs-on: ubuntu-24.04
    environment: production
    concurrency:
      group: production-deploy-lock
      cancel-in-progress: false
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsProdDeployRole
          aws-region: ap-southeast-1
      - run: ./scripts/rollout-prod.sh "\${{ github.sha }}"`,
    hints: [
      'Ở TODO 1: thêm dòng id-token: write dưới khối permissions:',
      'Ở TODO 2: đổi thành cancel-in-progress: true trong ci_verify',
      'Ở TODO 3: thêm concurrency: { group: production-deploy-lock, cancel-in-progress: false } vào cd_production',
    ],
    validationRules: [
      {
        id: 'r1-oidc-perm',
        description: 'Cấp quyền id-token: write cho OIDC',
        mustContainAny: ['id-token: write'],
        errorHint: 'Hãy thêm id-token: write vào khối permissions.',
      },
      {
        id: 'r2-ci-cancel-true',
        description: 'Bật cancel-in-progress: true cho ci_verify',
        mustContainAny: ['cancel-in-progress: true'],
        errorHint: 'Job ci_verify cần có cancel-in-progress: true.',
      },
      {
        id: 'r3-prod-lock',
        description: 'Khóa tuần tự production-deploy-lock với cancel-in-progress: false',
        mustContainAny: ['production-deploy-lock'],
        errorHint: 'Job cd_production cần có group: production-deploy-lock và cancel-in-progress: false.',
      },
    ],
    explanationAfterPass:
      'Đỉnh cao! Bạn đã giải quyết triệt để Tình huống B2 (Out-of-order Deployment Race Condition) kết hợp xác thực OIDC không mật khẩu.',
  },
];
