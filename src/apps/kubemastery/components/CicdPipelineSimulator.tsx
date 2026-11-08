import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Layers,
  Package,
  Rocket,
  Terminal,
  ArrowRight,
  Clock,
  HardDrive,
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
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>([
    'idle',
    'idle',
    'idle',
    'idle',
    'idle',
  ]);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    'Sẵn sàng chạy dây chuyền CI/CD & GitOps. Hãy điều chỉnh các công tắc cấu hình bên dưới rồi bấm "Trigger Git Push & Chạy Pipeline"!',
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
    setPipelineLogs([
      `Đã nạp "${found.title}". Bấm "Trigger Git Push & Chạy Pipeline" để xem kết quả thực thi!`,
    ]);
  };

  const runPipelineSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setStageStatuses(['running', 'idle', 'idle', 'idle', 'idle']);
    setPipelineLogs([
      `[GIT PUSH] Branch: ${activeScenario.gitBranch} | Commit: "${activeScenario.commitMessage}" by ${activeScenario.author}`,
      `[STAGE 1/5] Đang chạy Unit Test & Kiểm tra cú pháp TypeScript...`,
    ]);

    // Stage 1 -> Stage 2
    setTimeout(() => {
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

  const STAGES_META = [
    { title: '1. Git Push & Test', sub: 'npm ci && npm test' },
    {
      title: '2. Docker Build & Cache',
      sub: optimizeLayerCache ? 'Cache Hit (1.8s)' : 'Cache Miss (240s)',
    },
    {
      title: '3. Trivy Security Scan',
      sub: runAsNonRootUser ? 'USER node (Pass)' : 'Root Risk (Block!)',
    },
    {
      title: '4. Push Registry & Helm',
      sub: useMultiStageBuild ? 'OCI Image 58MB' : 'OCI Image 910MB',
    },
    {
      title: '5. ArgoCD K8s Rollout',
      sub: enableReadinessProbe ? 'Zero-Downtime' : 'No Readiness Probe',
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-violet-500/35 bg-gradient-to-r from-violet-500/15 via-sky-500/10 to-slate-900 p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
          <GitBranch className="h-4 w-4 shrink-0" />
          <span>Phòng Giả Lập Dây Chuyền CI/CD & GitOps Thực Chiến (GitHub Actions + Trivy + Helm + ArgoCD)</span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Mô Phỏng Tự Động Hóa Từ Lúc Gộp Code (Merge PR) Đến Khi Lên Cụm Kubernetes
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Thử bật/tắt các nguyên tắc vàng (Layer Cache, Multi-stage Build, Hạ quyền USER node, Readiness Probe) và bấm chạy Pipeline để xem hệ thống CI/CD phản ứng như thế nào!
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
              Bảng Điều Khiển Cấu Hình Pipeline (Bật/Tắt Để Thử Nghiệm)
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

        {/* 5 Interactive Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <button
            onClick={() => setOptimizeLayerCache((v) => !v)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              optimizeLayerCache
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">1. Thứ tự Dockerfile</div>
            <div className="font-bold mt-0.5">
              {optimizeLayerCache ? '✓ Khóa Layer Cache' : '✗ Vỡ Cache (COPY . . đầu)'}
            </div>
          </button>

          <button
            onClick={() => setUseMultiStageBuild((v) => !v)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              useMultiStageBuild
                ? 'border-sky-500/45 bg-sky-500/15 text-sky-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">2. Kích thước Image</div>
            <div className="font-bold mt-0.5">
              {useMultiStageBuild ? '✓ Multi-stage (58MB)' : '✗ Single-stage (910MB)'}
            </div>
          </button>

          <button
            onClick={() => setRunAsNonRootUser((v) => !v)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              runAsNonRootUser
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/55 bg-rose-500/15 text-rose-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">3. Bảo mật Container</div>
            <div className="font-bold mt-0.5">
              {runAsNonRootUser ? '✓ Hạ quyền USER node' : '✗ Chạy quyền root (Nguy hiểm)'}
            </div>
          </button>

          <button
            onClick={() => setEnableReadinessProbe((v) => !v)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              enableReadinessProbe
                ? 'border-violet-500/45 bg-violet-500/15 text-violet-200'
                : 'border-amber-500/45 bg-amber-500/15 text-amber-200'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">4. Khám sức khỏe K8s</div>
            <div className="font-bold mt-0.5">
              {enableReadinessProbe ? '✓ Có Readiness Probe' : '✗ Tắt Readiness Probe'}
            </div>
          </button>

          <button
            onClick={() => setArgocdAutoSync((v) => !v)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              argocdAutoSync
                ? 'border-cyan-500/45 bg-cyan-500/15 text-cyan-200'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            )}
          >
            <div className="font-mono text-[10px] uppercase opacity-75">5. Chế độ GitOps</div>
            <div className="font-bold mt-0.5">
              {argocdAutoSync ? '✓ ArgoCD Auto-Sync' : 'Manual kubectl apply'}
            </div>
          </button>
        </div>

        {/* Visual 5-Stage Pipeline Progress Graph */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
          {STAGES_META.map((st, idx) => {
            const status = stageStatuses[idx];
            return (
              <div
                key={st.title}
                className={cn(
                  'rounded-xl border p-3.5 transition-all space-y-1.5',
                  status === 'idle' && 'border-slate-800 bg-slate-950/70 text-slate-400',
                  status === 'running' &&
                    'border-sky-400 bg-sky-500/15 text-sky-200 ring-2 ring-sky-400/60 animate-pulse',
                  status === 'passed' &&
                    'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
                  status === 'warning' &&
                    'border-amber-500/50 bg-amber-500/15 text-amber-200',
                  status === 'failed' &&
                    'border-rose-500/60 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/50'
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
                </div>
                <div className="text-xs font-extrabold text-white">{st.title}</div>
                <div className="font-mono text-[11px] opacity-90">{st.sub}</div>
              </div>
            );
          })}
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
            .github/workflows/deploy.yml (Pipeline CI Chuẩn)
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] text-slate-200 leading-relaxed">
            {activeScenario.workflowYamlPreview}
          </pre>
        </div>

        <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
          <div className="font-mono text-xs font-bold text-violet-400">
            argocd-application.yaml (Đồng bộ GitOps Tự động)
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] text-slate-200 leading-relaxed">
            {activeScenario.argocdManifestPreview}
          </pre>
        </div>
      </div>
    </div>
  );
};
