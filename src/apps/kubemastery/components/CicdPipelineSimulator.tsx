import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  FileCode2,
  Code2,
  Sparkles,
} from 'lucide-react';
import { CICD_SCENARIOS } from '../data/cicdScenariosData';
import { cn } from '@/utils/cn';

type StageStatus = 'idle' | 'running' | 'passed' | 'warning' | 'failed';

export const CicdPipelineSimulator: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    CICD_SCENARIOS[0].id
  );
  const [optimizeLayerCache, setOptimizeLayerCache] = useState(true);
  const [useMultiStageBuild, setUseMultiStageBuild] = useState(true);
  const [runAsNonRootUser, setRunAsNonRootUser] = useState(true);
  const [enableReadinessProbe, setEnableReadinessProbe] = useState(true);
  const [argocdAutoSync, setArgocdAutoSync] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>([
    'idle',
    'idle',
    'idle',
    'idle',
    'idle',
  ]);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    'Sẵn sàng chạy dây chuyền CI/CD & GitOps. Bấm vào bất kỳ Stage nào (1→5) để soi Code tương ứng hoặc bấm "Trigger Git Push & Chạy Pipeline"!',
  ]);

  const activeScenario =
    CICD_SCENARIOS.find((s) => s.id === selectedScenarioId) || CICD_SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    const found = CICD_SCENARIOS.find((s) => s.id === id);
    if (!found) return;
    setSelectedScenarioId(id);
    setOptimizeLayerCache(found.defaultOptions.optimizeLayerCache);
    setUseMultiStageBuild(found.defaultOptions.useMultiStageBuild);
    setRunAsNonRootUser(found.defaultOptions.runAsNonRootUser);
    setEnableReadinessProbe(found.defaultOptions.enableReadinessProbe);
    setArgocdAutoSync(found.defaultOptions.argocdAutoSync);
    setStageStatuses(['idle', 'idle', 'idle', 'idle', 'idle']);
    setSelectedStageIdx(0);
    setPipelineLogs([
      `Đã nạp "${found.title}". Bấm "Trigger Git Push & Chạy Pipeline" để xem kết quả thực thi và Code đồng bộ theo từng Stage!`,
    ]);
  };

  const runPipelineSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setSelectedStageIdx(0);
    setStageStatuses(['running', 'idle', 'idle', 'idle', 'idle']);
    setPipelineLogs([
      `[GIT PUSH] Branch: ${activeScenario.gitBranch} | Commit: "${activeScenario.commitMessage}" by ${activeScenario.author}`,
      `[STAGE 1/5] Đang chạy Unit Test & Kiểm tra cú pháp TypeScript...`,
    ]);

    // Stage 1 -> Stage 2
    setTimeout(() => {
      setSelectedStageIdx(1);
      setStageStatuses(['passed', 'running', 'idle', 'idle', 'idle']);
      const cacheMsg = optimizeLayerCache
        ? '⚡ CACHE HIT: Tầng COPY package.json & RUN npm ci lấy từ bộ nhớ đệm trong 0.0s!'
        : '⚠️ CACHE MISS: Do đặt COPY . . ở đầu file nên phải tải lại 280MB thư viện (mất 240s)!';
      const sizeMsg = useMultiStageBuild
        ? '✓ Multi-stage Build: Đã tách Builder sang Runner Alpine -> Kích thước Image: 58MB!'
        : '⚠️ Single-stage Build: Chứa cả trình biên dịch và rác -> Kích thước Image phình to: 910MB!';

      setPipelineLogs((prev) => [
        ...prev,
        `✓ [STAGE 1 PASS] 48/48 Unit Tests passed (1.4s).`,
        `[STAGE 2/5] Đang đóng gói OCI Image: docker build -t myregistry.io/shop-web:v1.4.0 .`,
        `  -> ${cacheMsg}`,
        `  -> ${sizeMsg}`,
      ]);

      // Stage 2 -> Stage 3 (Trivy Security Gate)
      setTimeout(() => {
        setSelectedStageIdx(2);
        setStageStatuses([
          'passed',
          optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
          'running',
          'idle',
          'idle',
        ]);
        setPipelineLogs((prev) => [
          ...prev,
          `[STAGE 3/5] Đang quét bảo mật Container bằng Trivy: trivy image myregistry.io/shop-web:v1.4.0...`,
        ]);

        setTimeout(() => {
          if (!runAsNonRootUser) {
            setSelectedStageIdx(2);
            setStageStatuses([
              'passed',
              optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
              'failed',
              'idle',
              'idle',
            ]);
            setPipelineLogs((prev) => [
              ...prev,
              `✗ [STAGE 3 FAILED — CHẶN BỞI CỔNG BẢO MẬT TRIVY]:`,
              `  CRITICAL DS002: Image đang chạy dưới quyền quản trị tối cao 'root'!`,
              `  👉 GIẢI PHÁP: Hãy bật công tắc "Hạ quyền USER node (Non-Root)" ở bảng cấu hình rồi bấm chạy lại Pipeline!`,
            ]);
            setIsRunning(false);
            return;
          }

          // Passed Trivy -> Stage 4 (Push & GitOps Commit)
          setSelectedStageIdx(3);
          setStageStatuses([
            'passed',
            optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
            'passed',
            'running',
            'idle',
          ]);
          setPipelineLogs((prev) => [
            ...prev,
            `✓ [STAGE 3 PASS] Trivy Scan: 0 Critical CVEs, Container chạy dưới quyền 'USER node' an toàn!`,
            `[STAGE 4/5] Đang đẩy Image lên Registry & cập nhật tag v1.4.0 vào kho GitOps Helm Chart...`,
          ]);

          // Stage 4 -> Stage 5 (ArgoCD Sync & K8s Rollout)
          setTimeout(() => {
            setSelectedStageIdx(4);
            setStageStatuses([
              'passed',
              optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
              'passed',
              'passed',
              'running',
            ]);
            setPipelineLogs((prev) => [
              ...prev,
              `✓ [STAGE 4 PASS] Đã đẩy myregistry.io/shop-web:v1.4.0 và cập nhật values-prod.yaml.`,
              `[STAGE 5/5] ArgoCD phát hiện thay đổi trên Git -> Đang đồng bộ (Sync) Rolling Update lên cụm K8s Production...`,
            ]);

            setTimeout(() => {
              if (!enableReadinessProbe) {
                setStageStatuses([
                  'passed',
                  optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
                  'passed',
                  'passed',
                  'warning',
                ]);
                setPipelineLogs((prev) => [
                  ...prev,
                  `⚠️ [STAGE 5 CẢNH BÁO DOWNTIME]: Do tắt Readiness Probe, Tổng đài Service đã gửi khách hàng vào Pod mới ngay ở giây thứ 1 khi chưa nối xong Database (gây 12 giây lỗi 502)!`,
                  `👉 MẸO: Hãy bật công tắc "Readiness Probe (/health/ready)" để đạt Zero-Downtime 100%!`,
                ]);
              } else {
                setStageStatuses([
                  'passed',
                  optimizeLayerCache && useMultiStageBuild ? 'passed' : 'warning',
                  'passed',
                  'passed',
                  'passed',
                ]);
                setPipelineLogs((prev) => [
                  ...prev,
                  `✓ [STAGE 5 PASS — ZERO DOWNTIME 100%]: ArgoCD Synced & Healthy!`,
                  `  -> Bật Pod v1.4.0 mới -> Đợi Readiness Probe (/health/ready) báo 200 OK -> Tắt Pod cũ cuốn chiếu.`,
                  `🎉 HOÀN TẤT CHU TRÌNH CI/CD & GITOPS CHUẨN DOANH NGHIỆP!`,
                ]);
              }
              setIsRunning(false);
            }, 900);
          }, 800);
        }, 850);
      }, 850);
    }, 750);
  };

  // Dynamic Stage Code & Explanations synchronized with the 5 Stages + 5 Toggles
  const STAGE_CODE_DETAILS = [
    {
      title: 'Stage 1: Git Push, Checkout & Unit Test',
      file: '.github/workflows/deploy.yml (Lines 1–28)',
      isOptimal: true,
      code: `name: CI/CD & GitOps Pipeline
on:
  push:
    branches: [${activeScenario.gitBranch}]

concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: \${{ github.ref != 'refs/heads/main' }}

jobs:
  unit-test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm' # Khóa Cache theo mã băm package-lock.json
      - name: Install & Run Fast Unit Tests
        run: |
          npm ci
          npm run lint
          npm test`,
      explanation:
        'Khi lập trình viên gộp code (git push), GitHub Actions lập tức khởi tạo máy ảo sạch (ubuntu-24.04), nạp bộ nhớ đệm ~/.npm theo lockfile và chạy bộ kiểm thử đơn vị (48 tests) trong 1.4 giây.',
    },
    {
      title: 'Stage 2: Docker Build, Layer Cache & Multi-Stage',
      file: 'Dockerfile (Cập nhật trực tiếp theo Công tắc #1 & #2)',
      isOptimal: optimizeLayerCache && useMultiStageBuild,
      code: `${
        useMultiStageBuild
          ? `# ✅ ĐANG BẬT MULTI-STAGE BUILD (Tách riêng giai đoạn biên dịch & chạy thật):
FROM node:20-alpine AS builder
WORKDIR /app`
          : `# ⚠️ ĐANG TẮT MULTI-STAGE BUILD (Gộp chung mọi thứ vào 1 Image nặng 910MB!):
FROM node:20 AS monolithic-stage
WORKDIR /app`
      }
${
  optimizeLayerCache
    ? `# ✅ ĐANG BẬT KHÓA LAYER CACHE: Chỉ copy package*.json trước!
# Nếu không đổi thư viện, Docker tái sử dụng 100% tầng npm ci trong 0.0s!
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build`
    : `# 🚨 ĐANG TẮT LAYER CACHE: Đặt COPY . . lên đầu file!
# Chỉ sửa 1 dấu chấm trong code cũng làm vỡ Cache, bắt tải lại 280MB thư viện (mất 240s)!
COPY . .
RUN npm ci && npm run build`
}
${
  useMultiStageBuild
    ? `
# Giai đoạn 2 (Runner siêu nhẹ 58MB - Không chứa trình biên dịch và mã nguồn thô):
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules`
    : `# (Không có giai đoạn Runner tách rời -> Image xuất xưởng chứa nguyên rác build 910MB!)`
}`,
      explanation:
        'Thử bấm Công tắc #1 (Thứ tự Dockerfile) và Công tắc #2 (Multi-stage Build) ở trên: bạn sẽ thấy thứ tự lệnh COPY và giai đoạn FROM ... AS runner trong Dockerfile thay đổi ngay lập tức!',
    },
    {
      title: 'Stage 3: Cổng Quét Bảo Mật Trivy & Quyền Non-Root',
      file: 'Dockerfile + .github/workflows/deploy.yml (Stage 3)',
      isOptimal: runAsNonRootUser,
      code: `# 1. Cấu hình quyền bên trong Dockerfile (Công tắc #3):
${
  runAsNonRootUser
    ? `# ✅ ĐANG BẬT HẠ QUYỀN NON-ROOT:
RUN addgroup -S appgroup && adduser -S nodeuser -G appgroup
USER nodeuser  # Tiến trình chạy dưới quyền user thường, an toàn tuyệt đối!`
    : `# 🚨 ĐANG TẮT HẠ QUYỀN (Mặc định chạy bằng quyền tối cao ROOT!):
# USER root    # <-- Nếu hacker chiếm được ứng dụng, họ làm chủ toàn bộ Container!`
}

# 2. Bước quét Trivy trong .github/workflows/deploy.yml:
      - name: Trivy Container & Misconfiguration Scan
        run: |
          trivy image \\
            --exit-code 1 \\
            --ignore-unfixed \\
            --scanners vuln,misconfig \\
            --severity CRITICAL,HIGH \\
            myregistry.io/shop-web:v1.4.0`,
      explanation:
        'Trivy quét cả lỗ hổng thư viện (CVE) lẫn lỗi cấu hình Dockerfile (DS002: Running as root). Khi tắt Công tắc #3, lệnh trivy trả về exit code 1 và chặn đứng Pipeline trước khi đẩy Image lên mạng!',
    },
    {
      title: 'Stage 4: Đẩy OCI Image & Cập nhật Kho GitOps Helm',
      file: '.github/workflows/deploy.yml (Lines 52–74)',
      isOptimal: true,
      code: `  publish-and-bump-gitops:
    needs: [unit-test, build-and-trivy-scan]
    runs-on: ubuntu-24.04
    steps:
      - name: Push Verified OCI Image (${useMultiStageBuild ? '58MB' : '910MB'})
        run: docker push myregistry.io/shop-web:v1.4.0

      - name: Update Image Tag in GitOps Config Repository
        run: |
          git clone https://x-access-token:\${{ secrets.GITOPS_PAT }}@github.com/org/k8s-gitops.git
          cd k8s-gitops
          yq -i '.image.tag = "v1.4.0"' helm/shop-web/values-prod.yaml
          git commit -am "chore(release): promote shop-web v1.4.0 to production"
          git push origin main`,
      explanation:
        'Điểm khác biệt cốt lõi của GitOps: CI Runner không hề gọi lệnh kubectl apply vào cụm Production! CI chỉ đẩy Image đã vượt qua Trivy lên Registry rồi tạo Commit đổi tag v1.4.0 trong kho GitOps.',
    },
    {
      title: 'Stage 5: ArgoCD Tự Động Đồng Bộ & K8s Readiness Probe',
      file: 'k8s/deployment.yaml + argocd-application.yaml (Công tắc #4 & #5)',
      isOptimal: enableReadinessProbe && argocdAutoSync,
      code: `# 1. Cấu hình Đồng bộ GitOps trên ArgoCD (Công tắc #5):
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-web-prod
spec:
  syncPolicy:
${
  argocdAutoSync
    ? `    automated:
      prune: true      # Tự xóa tài nguyên thừa
      selfHeal: true   # Tự phục hồi nếu ai đó sửa tay trên cụm K8s`
    : `    # ⚠️ Đang tắt Auto-Sync: Phải vào giao diện ArgoCD bấm nút Sync thủ công!`
}

---
# 2. Cấu hình Khám sức khỏe K8s Pod (Công tắc #4 — k8s/deployment.yaml):
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: shop-web
          image: myregistry.io/shop-web:v1.4.0
${
  enableReadinessProbe
    ? `          # ✅ ĐANG BẬT READINESS PROBE: Đợi Pod mới nối xong DB & trả về 200 OK
          # thì K8s Service mới mở van chuyển khách hàng sang (Zero-Downtime 100%):
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 3
            periodSeconds: 5`
    : `          # 🚨 ĐANG TẮT READINESS PROBE:
          # K8s tưởng Pod vừa tạo ra ở giây thứ 1 đã sẵn sàng nên đổ khách hàng vào ngay
          # khi ứng dụng chưa nối xong Database -> Gây 12 giây lỗi 502 Bad Gateway!`
}`,
      explanation:
        'ArgoCD bên trong cụm K8s phát hiện commit mới trên GitOps Repo và thực thi Rolling Update. Hãy bật/tắt Công tắc #4 (Readiness Probe) và #5 (ArgoCD Auto-Sync) để xem file YAML thay đổi trực tiếp!',
    },
  ];

  const STAGES_META = [
    {
      title: '1. Git Push & Test',
      sub: 'npm ci && npm test',
      fileBadge: 'deploy.yml',
    },
    {
      title: '2. Docker Build & Cache',
      sub: optimizeLayerCache ? 'Cache Hit (1.8s)' : 'Cache Miss (240s)',
      fileBadge: 'Dockerfile',
    },
    {
      title: '3. Trivy Security Scan',
      sub: runAsNonRootUser ? 'USER node (Pass)' : 'Root Risk (Block!)',
      fileBadge: 'Dockerfile + Trivy',
    },
    {
      title: '4. Push Registry & Helm',
      sub: useMultiStageBuild ? 'OCI Image 58MB' : 'OCI Image 910MB',
      fileBadge: 'values-prod.yaml',
    },
    {
      title: '5. ArgoCD K8s Rollout',
      sub: enableReadinessProbe ? 'Zero-Downtime' : 'No Readiness Probe',
      fileBadge: 'deployment.yaml',
    },
  ];

  const activeStageDetail =
    STAGE_CODE_DETAILS[selectedStageIdx] || STAGE_CODE_DETAILS[0];

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-violet-500/35 bg-gradient-to-r from-violet-500/15 via-sky-500/10 to-slate-900 p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
          <GitBranch className="h-4 w-4 shrink-0" />
          <span>
            Phòng Giả Lập Dây Chuyền CI/CD & GitOps Thực Chiến (Đồng bộ Code Thời Gian Thực)
          </span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Mô Phỏng Tự Động Hóa Từ Lúc Gộp Code (Merge PR) Đến Khi Lên Cụm Kubernetes
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Thử bật/tắt 5 công tắc cấu hình, bấm vào bất kỳ Stage nào (1→5) hoặc bấm chạy Pipeline để xem{' '}
          <strong className="text-sky-300">
            đoạn Code YAML / Dockerfile / Kubernetes tương ứng với từng bước hoạt động
          </strong>{' '}
          biến đổi trực tiếp ngay bên dưới!
        </p>
      </div>

      {/* Scenario Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CICD_SCENARIOS.map((sc) => {
          const active = sc.id === selectedScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all flex flex-col justify-between space-y-2',
                active
                  ? 'border-violet-400 bg-violet-500/15 ring-2 ring-violet-400/50'
                  : 'border-slate-800 bg-slate-900/70 hover:bg-slate-800/70'
              )}
            >
              <div className="space-y-1">
                <span className="inline-block rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
                  {sc.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {sc.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Configuration Toggles + Trigger Button */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Bảng Điều Khiển Cấu Hình Pipeline (Bật/Tắt Để Xem Code Thay Đổi Trực Tiếp)
            </h2>
            <p className="text-xs text-slate-400">
              Branch: <code className="text-sky-300">{activeScenario.gitBranch}</code> • Commit:{' '}
              <code className="text-amber-300">{activeScenario.commitMessage}</code>
            </p>
          </div>

          <button
            onClick={runPipelineSimulation}
            disabled={isRunning}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs sm:text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 shadow-md transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>
              {isRunning
                ? 'Đang chạy dây chuyền CI/CD...'
                : 'Trigger Git Push & Chạy Pipeline'}
            </span>
          </button>
        </div>

        {/* 5 Interactive Toggles (Clicking a toggle also focuses the corresponding Stage Code!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <button
            onClick={() => {
              setOptimizeLayerCache((v) => !v);
              setSelectedStageIdx(1);
            }}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              optimizeLayerCache
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">
              1. Thứ tự Dockerfile (Stage 2)
            </div>
            <div className="font-bold mt-0.5">
              {optimizeLayerCache
                ? '✓ Khóa Layer Cache'
                : '✗ Vỡ Cache (COPY . . đầu)'}
            </div>
          </button>

          <button
            onClick={() => {
              setUseMultiStageBuild((v) => !v);
              setSelectedStageIdx(1);
            }}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              useMultiStageBuild
                ? 'border-sky-500/45 bg-sky-500/15 text-sky-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">
              2. Kích thước Image (Stage 2)
            </div>
            <div className="font-bold mt-0.5">
              {useMultiStageBuild
                ? '✓ Multi-stage (58MB)'
                : '✗ Single-stage (910MB)'}
            </div>
          </button>

          <button
            onClick={() => {
              setRunAsNonRootUser((v) => !v);
              setSelectedStageIdx(2);
            }}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              runAsNonRootUser
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/55 bg-rose-500/15 text-rose-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">
              3. Bảo mật Container (Stage 3)
            </div>
            <div className="font-bold mt-0.5">
              {runAsNonRootUser
                ? '✓ Hạ quyền USER node'
                : '✗ Chạy quyền root (Nguy hiểm)'}
            </div>
          </button>

          <button
            onClick={() => {
              setEnableReadinessProbe((v) => !v);
              setSelectedStageIdx(4);
            }}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              enableReadinessProbe
                ? 'border-violet-500/45 bg-violet-500/15 text-violet-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">
              4. Khám sức khỏe K8s (Stage 5)
            </div>
            <div className="font-bold mt-0.5">
              {enableReadinessProbe
                ? '✓ Có Readiness Probe'
                : '✗ Tắt Readiness Probe'}
            </div>
          </button>

          <button
            onClick={() => {
              setArgocdAutoSync((v) => !v);
              setSelectedStageIdx(4);
            }}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              argocdAutoSync
                ? 'border-cyan-500/45 bg-cyan-500/15 text-cyan-200'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">
              5. Chế độ GitOps (Stage 5)
            </div>
            <div className="font-bold mt-0.5">
              {argocdAutoSync ? '✓ ArgoCD Auto-Sync' : 'Manual kubectl apply'}
            </div>
          </button>
        </div>

        {/* Visual 5-Stage Pipeline Progress Graph (Clickable to Inspect Stage Code!) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              👇 <strong className="text-sky-300">Bấm vào từng ô Stage (1 → 5)</strong> để xem đoạn Code CI/CD tương ứng với hoạt động đó:
            </span>
            <span className="font-mono text-[11px] text-sky-300">
              Đang soi: Stage {selectedStageIdx + 1}/5
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {STAGES_META.map((st, idx) => {
              const status = stageStatuses[idx];
              const isSelected = selectedStageIdx === idx;
              return (
                <button
                  key={st.title}
                  onClick={() => setSelectedStageIdx(idx)}
                  className={cn(
                    'rounded-xl border p-3.5 transition-all space-y-1.5 text-left cursor-pointer',
                    status === 'idle' &&
                      'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700',
                    status === 'running' &&
                      'border-sky-400 bg-sky-500/15 text-sky-200 ring-2 ring-sky-400/60 animate-pulse',
                    status === 'passed' &&
                      'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
                    status === 'warning' &&
                      'border-amber-500/50 bg-amber-500/15 text-amber-200',
                    status === 'failed' &&
                      'border-rose-500/60 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/50',
                    isSelected &&
                      'ring-2 ring-sky-400 border-sky-400 shadow-lg shadow-sky-500/10'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold">
                      Stage {idx + 1}
                    </span>
                    {status === 'passed' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    )}
                    {status === 'failed' && (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    )}
                    {status === 'idle' && isSelected && (
                      <Code2 className="h-3.5 w-3.5 text-sky-400" />
                    )}
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {st.title}
                  </div>
                  <div className="font-mono text-[11px] opacity-90">
                    {st.sub}
                  </div>
                  <div className="pt-1">
                    <span className="inline-block rounded bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 font-mono text-[9px] text-sky-300">
                      📄 {st.fileBadge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================
            NEW: SYNCHRONIZED STAGE CODE X-RAY INSPECTOR
           ================================================================= */}
        <div className="ide-dark-surface rounded-2xl border border-sky-500/40 bg-slate-950 p-4 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-sky-400" />
              <span className="font-mono text-xs sm:text-sm font-extrabold text-white">
                Code Thực Thi Của {activeStageDetail.title}
              </span>
              <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                {activeStageDetail.file}
              </span>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold border',
                activeStageDetail.isOptimal
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-rose-500/50 bg-rose-500/15 text-rose-300'
              )}
            >
              {activeStageDetail.isOptimal
                ? '✅ Cấu hình Chuẩn Production'
                : '⚠️ Đang chứa Lỗi / Chưa Tối Ưu'}
            </span>
          </div>

          <pre
            className={cn(
              'rounded-xl border p-3.5 font-mono text-xs overflow-x-auto leading-relaxed',
              activeStageDetail.isOptimal
                ? 'border-slate-800 bg-slate-900/90 text-sky-200'
                : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
            )}
          >
            {activeStageDetail.code}
          </pre>

          <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{activeStageDetail.explanation}</span>
          </div>
        </div>

        {/* Live Pipeline Execution Console */}
        <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span>GitHub Actions + Trivy + ArgoCD Execution Log</span>
            </span>
            <span>
              Build Time: {optimizeLayerCache ? '1.8s' : '240.0s'} • Image:{' '}
              {useMultiStageBuild ? '58MB' : '910MB'}
            </span>
          </div>
          {pipelineLogs.map((line, i) => (
            <div
              key={i}
              className={cn(
                'leading-relaxed',
                line.startsWith('✓') || line.startsWith('🎉')
                  ? 'text-emerald-300 font-semibold'
                  : line.startsWith('✗')
                  ? 'text-rose-400 font-bold'
                  : line.startsWith('⚠️') || line.includes('CẢNH BÁO')
                  ? 'text-amber-300'
                  : 'text-slate-200'
              )}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Reference Code Previews (GitHub Actions Workflow + ArgoCD Application YAML) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
          <div className="font-mono text-xs font-bold text-sky-400">
            .github/workflows/deploy.yml (Toàn bộ File Pipeline CI Chuẩn)
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] text-slate-200 leading-relaxed">
            {activeScenario.workflowYamlPreview}
          </pre>
        </div>

        <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
          <div className="font-mono text-xs font-bold text-violet-400">
            argocd-application.yaml (Toàn bộ File Đồng bộ GitOps Tự động)
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] text-slate-200 leading-relaxed">
            {activeScenario.argocdManifestPreview}
          </pre>
        </div>
      </div>
    </div>
  );
};
