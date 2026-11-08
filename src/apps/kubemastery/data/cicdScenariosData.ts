import { CicdPipelineScenario } from '../types/kube.types';

export const CICD_SCENARIOS: CicdPipelineScenario[] = [
  {
    id: 'cicd-prod-standard',
    title: 'Kịch bản 1: Quy trình Chuẩn Doanh Nghiệp (Multi-stage + Layer Cache + ArgoCD GitOps)',
    subtitle: 'Lập trình viên vừa gộp code (Merge PR), GitHub Actions tự build Image siêu nhẹ 58MB trong 18 giây nhờ Cache, quét Trivy 0 lỗ hổng và ArgoCD tự đồng bộ Rolling Update lên K8s.',
    badge: 'Chuẩn Vàng DevOps',
    gitBranch: 'main',
    commitMessage: 'feat(checkout): optimize flash-sale discount engine v1.4.0',
    author: 'minh.nguyen (Senior Backend)',
    defaultOptions: {
      optimizeLayerCache: true,
      useMultiStageBuild: true,
      runAsNonRootUser: true,
      enableReadinessProbe: true,
      argocdAutoSync: true,
    },
    dockerfilePreview: `FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
USER node
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
    workflowYamlPreview: `name: Production CI/CD & GitOps
on:
  push:
    branches: [ main ]
jobs:
  build-scan-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Unit & Integration Tests
        run: npm ci && npm test
      - name: Build Multi-stage OCI Image with BuildKit Cache
        run: docker build --cache-from=myregistry.io/shop-web:cache -t myregistry.io/shop-web:v1.4.0 .
      - name: Trivy Container Security Scan (Check Non-Root & CVEs)
        run: trivy image --exit-code 1 --severity CRITICAL myregistry.io/shop-web:v1.4.0
      - name: Push Image & Update GitOps Manifest Repo
        run: |
          docker push myregistry.io/shop-web:v1.4.0
          yq -i '.image.tag = "v1.4.0"' helm/shop-web/values-prod.yaml`,
    argocdManifestPreview: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-web-production
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/company/k8s-gitops-manifests.git
    path: helm/shop-web
    helm:
      valueFiles: [ values-prod.yaml ]
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true`,
  },
  {
    id: 'cicd-broken-security-cache',
    title: 'Kịch bản 2: Lỗi Vỡ Layer Cache & Bị Chặn Tại Cổng Bảo Mật Trivy (Chạy quyền Root)',
    subtitle: 'Trải nghiệm điều gì xảy ra khi lập trình viên viết COPY . . ở đầu Dockerfile và quên hạ quyền USER node: Build chậm gấp 15 lần và bị Trivy chặn đứng trước khi lên K8s!',
    badge: 'Mô phỏng Chặn Lỗi Bảo Mật',
    gitBranch: 'hotfix/quick-patch',
    commitMessage: 'fix: urgent patch without USER node and broken cache order',
    author: 'intern.dev',
    defaultOptions: {
      optimizeLayerCache: false,
      useMultiStageBuild: false,
      runAsNonRootUser: false,
      enableReadinessProbe: true,
      argocdAutoSync: true,
    },
    dockerfilePreview: `# CẢNH BÁO: Dockerfile chưa tối ưu!
FROM node:20
WORKDIR /usr/src/app
COPY . .
RUN npm install
# Thiếu Multi-stage & đang chạy mặc định quyền root!
CMD ["node", "dist/server.js"]`,
    workflowYamlPreview: `# Pipeline sẽ phát hiện Image nặng 940MB và Trivy báo lỗi DS002 (Running as root user)!
# Bật công tắc "Hạ quyền USER node" và "Multi-stage Build" ở bảng điều khiển để vượt qua cổng kiểm duyệt!`,
    argocdManifestPreview: `# ArgoCD đang khóa chốt chặn bảo vệ Production: Không đồng bộ Image chưa vượt qua cổng Trivy Security!`,
  },
  {
    id: 'cicd-missing-probe-downtime',
    title: 'Kịch bản 3: Nâng cấp Gây Gián đoạn Do Tắt Readiness Probe & Tự động Rollback',
    subtitle: 'Khi tắt Readiness Probe, K8s đẩy khách hàng vào Pod mới ngay ở giây đầu tiên khi chưa nối xong Database gây lỗi 502 hàng loạt!',
    badge: 'Mô phỏng Zero-Downtime vs. Downtime',
    gitBranch: 'release/v1.5.0',
    commitMessage: 'chore: deploy heavy migration release v1.5.0',
    author: 'devops.lead',
    defaultOptions: {
      optimizeLayerCache: true,
      useMultiStageBuild: true,
      runAsNonRootUser: true,
      enableReadinessProbe: false,
      argocdAutoSync: true,
    },
    dockerfilePreview: `# Image đã tối ưu tốt (58MB), nhưng hãy chú ý công tắc "Bật Readiness Probe" ở bước Triển khai K8s!`,
    workflowYamlPreview: `# Khi Readiness Probe bị tắt, Tổng đài Service sẽ gửi khách vào Pod v1.5.0 ngay khi container vừa tạo nhưng ứng dụng bên trong chưa khởi động xong!`,
    argocdManifestPreview: `# Bật công tắc "Readiness Probe (/health/ready)" để đảm bảo Zero Downtime 100%!`,
  },
];
