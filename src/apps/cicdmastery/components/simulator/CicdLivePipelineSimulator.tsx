import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Terminal,
  Workflow,
  Zap,
  GitPullRequest,
  GitCommitHorizontal,
  Server,
  Activity,
  Sliders,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { cn } from '@/utils/cn';

type SimPipelinePreset = 'gitlab-devsecops' | 'github-lean' | 'gitops-argocd';
type JobStatus = 'idle' | 'running' | 'passed' | 'failed' | 'waiting_approval' | 'cancelled' | 'skipped';

interface SimJobNode {
  id: string;
  stage: string;
  name: string;
  subtitle: string;
  durationLabel: string;
  isDagZero?: boolean;
  status: JobStatus;
}

const INITIAL_GITLAB_JOBS: SimJobNode[] = [
  {
    id: 'lint_and_warm_cache',
    stage: '1. validate',
    name: 'lint_and_warm_cache',
    subtitle: 'npm ci + ESLint + Cache (pull-push)',
    durationLabel: '25s',
    status: 'idle',
  },
  {
    id: 'secret_and_sast_scan',
    stage: '2. security_and_test',
    name: 'secret_and_sast_scan',
    subtitle: 'needs: [] (DAG t=0s) • Semgrep + Gitleaks',
    durationLabel: '18s',
    isDagZero: true,
    status: 'idle',
  },
  {
    id: 'unit_test_shards',
    stage: '2. security_and_test',
    name: 'unit_and_integration_test (4x)',
    subtitle: 'parallel: 4 (--shard=1/4..4/4) • Cache (pull)',
    durationLabel: '3m 00s',
    status: 'idle',
  },
  {
    id: 'build_and_trivy_scan',
    stage: '3. package',
    name: 'build_and_trivy_scan',
    subtitle: 'Docker BuildKit + Trivy (--ignore-unfixed)',
    durationLabel: '1m 15s',
    status: 'idle',
  },
  {
    id: 'deploy_to_staging',
    stage: '4. deploy_staging',
    name: 'deploy_to_staging',
    subtitle: 'resource_group: staging-lock + Smoke /health',
    durationLabel: '40s',
    status: 'idle',
  },
  {
    id: 'approve_and_deploy_prod',
    stage: '5. deploy_prod',
    name: 'approve_and_deploy_prod',
    subtitle: 'when: manual (Gate) • OIDC + K8s Rollout',
    durationLabel: 'Manual Gate',
    status: 'idle',
  },
];

export const CicdLivePipelineSimulator: React.FC = () => {
  const { selectedSimulatorMode, setSimulatorMode } = useCicdNavigationStore();

  // --- MODE 1: PIPELINE & DAG SIMULATOR STATE ---
  const [preset, setPreset] = useState<SimPipelinePreset>('gitlab-devsecops');
  const [jobs, setJobs] = useState<SimJobNode[]>(INITIAL_GITLAB_JOBS);
  const [isRunning, setIsRunning] = useState(false);
  const [injectSecretLeak, setInjectSecretLeak] = useState(false);
  const [injectTrivyCve, setInjectTrivyCve] = useState(false);
  const [injectStaging500, setInjectStaging500] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[CI/CD Engine Ready] Chọn kịch bản hoặc bật công tắc giả lập lỗi (Chaos Injection), sau đó bấm "Kích hoạt Pipeline" để xem luồng hoạt động như thật.',
  ]);
  const [runCounter, setRunCounter] = useState(104);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- MODE 2: ZERO-DOWNTIME & TRAFFIC SHIFTING SIMULATOR STATE ---
  const [deployStrategy, setDeployStrategy] = useState<
    'blue-green' | 'canary' | 'rolling' | 'recreate'
  >('canary');
  const [canaryWeight, setCanaryWeight] = useState(5);
  const [blueGreenActive, setBlueGreenActive] = useState<'blue' | 'green'>('blue');
  const [hasDumbInitExecForm, setHasDumbInitExecForm] = useState(true);
  const [hasServerCloseSigterm, setHasServerCloseSigterm] = useState(true);
  const [hasPreStopSleep5, setHasPreStopSleep5] = useState(true);
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

  const resetPipeline = () => {
    clearTimers();
    setIsRunning(false);
    setJobs(INITIAL_GITLAB_JOBS.map((j) => ({ ...j, status: 'idle' })));
    setLogs([
      `[Pipeline #${runCounter}] Đã đặt lại trạng thái sạch (Ephemeral Environment). Sẵn sàng chạy mới.`,
    ]);
  };

  const startPipelineSimulation = (isPrBurst = false) => {
    clearTimers();
    setIsRunning(true);
    const nextRun = runCounter + (isPrBurst ? 3 : 1);
    setRunCounter(nextRun);

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
      `🚀 [Pipeline #${nextRun}] Khởi chạy với preset: ${preset.toUpperCase()} (Commit SHA: a1b2c3d)`
    );
    initialLog.push(
      `⚡ [DAG Engine] Kích hoạt song song ở t=0.0s: Job 'lint_and_warm_cache' VÀ Job 'secret_and_sast_scan' (nhờ needs: [])!`
    );
    setLogs(initialLog);

    // Step 1: Start Lint & SAST simultaneously (DAG)
    setJobs(
      INITIAL_GITLAB_JOBS.map((j) =>
        j.id === 'lint_and_warm_cache' || j.id === 'secret_and_sast_scan'
          ? { ...j, status: 'running' }
          : { ...j, status: 'idle' }
      )
    );

    // T = 1.2s: SAST finishes (or fails if Secret Leak is injected!)
    const t1 = setTimeout(() => {
      if (injectSecretLeak) {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'secret_and_sast_scan') return { ...j, status: 'failed' };
            if (j.id === 'lint_and_warm_cache') return { ...j, status: 'cancelled' };
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
      appendLog(
        '✅ [unit_and_integration_test] Cả 4/4 Shards hoàn tất 1.200 bài test trong 3m00s (tiết kiệm 9 phút)! Không tốn thời gian nén lại Cache nhờ policy: pull.'
      );
      appendLog(
        '🐳 [build_and_trivy_scan] Đang đóng gói Multi-stage Docker Image (tag: registry.app.vn/api:a1b2c3d) và quét lỗ hổng bằng Trivy...'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'unit_test_shards') return { ...j, status: 'passed' };
          if (j.id === 'build_and_trivy_scan') return { ...j, status: 'running' };
          return j;
        })
      );
    }, 3600);

    // T = 5.0s: Trivy Scan finishes (or fails if CVE is injected!)
    const t4 = setTimeout(() => {
      if (injectSecretLeak) return;
      if (injectTrivyCve) {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'build_and_trivy_scan') return { ...j, status: 'failed' };
            if (j.id === 'deploy_to_staging' || j.id === 'approve_and_deploy_prod')
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

      appendLog(
        '✅ [build_and_trivy_scan] Trivy Scan PASSED (0 lỗi CRITICAL/HIGH có bản vá). Đã đẩy Image registry.app.vn/api:a1b2c3d.'
      );
      appendLog(
        '🚀 [deploy_to_staging] Đang giữ khóa resource_group: staging-cluster-lock và triển khai lên Staging...'
      );
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === 'build_and_trivy_scan') return { ...j, status: 'passed' };
          if (j.id === 'deploy_to_staging') return { ...j, status: 'running' };
          return j;
        })
      );
    }, 5000);

    // T = 6.4s: Staging Smoke Test finishes -> Pause at Manual Approval Gate
    const t5 = setTimeout(() => {
      if (injectSecretLeak || injectTrivyCve) return;
      if (injectStaging500) {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === 'deploy_to_staging') return { ...j, status: 'failed' };
            if (j.id === 'approve_and_deploy_prod') return { ...j, status: 'skipped' };
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

      appendLog(
        '✅ [deploy_to_staging] Smoke Test: curl --fail --retry 5 https://staging.app.vn/health -> HTTP 200 OK {"status":"ready"}.'
      );
      appendLog(
        '⏸️ [MANUAL APPROVAL GATE] Pipeline tạm dừng tại Job "approve_and_deploy_prod" (when: manual, allow_failure: false, Protected Environment).'
      );
      appendLog(
        '👉 Hãy bấm nút "Tech Lead: Phê duyệt & Triển khai Production" màu xanh bên dưới để cấp JWT OIDC và hoàn tất Rollout!'
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
        `🚨 XUẤT HIỆN ${droppedRequests} LỖI 502 BAD GATEWAY! Hãy bật đủ cả 3 mảnh ghép bên dưới để đạt Zero-Downtime.`
      );
    }

    setTrafficEvents(newEvents);
    setIsRolloutSimRunning(false);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Top Simulator Mode Switcher */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900 to-emerald-500/10 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Workflow className="h-4 w-4" />
            <span>Phòng Giả lập Hoạt động CI/CD & Điều phối Kubernetes Thời gian Thực</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-white">
            Mô phỏng Đường ống CI/CD, Đồ thị DAG, Cổng Duyệt & Zero-Downtime Traffic
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
            Trải nghiệm trực tiếp cách Pipeline thực thi song song, tự động hủy PR thừa, chặn lỗ hổng DevSecOps, dừng chờ Tech Lead bấm Approve và điều phối lưu lượng Blue-Green / Canary không rớt request.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setSimulatorMode('pipeline')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all',
              selectedSimulatorMode === 'pipeline'
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            )}
          >
            <Workflow className="h-4 w-4" />
            <span>1. Giả lập Chạy Pipeline & DAG</span>
          </button>
          <button
            onClick={() => setSimulatorMode('traffic')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all',
              selectedSimulatorMode === 'traffic'
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            )}
          >
            <Activity className="h-4 w-4" />
            <span>2. Mô phỏng Traffic & Zero-Downtime 502</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SIMULATOR MODE 1: LIVE PIPELINE & DAG EXECUTION ENGINE
         ===================================================================== */}
      {selectedSimulatorMode === 'pipeline' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Control & Chaos Injection Panel (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Chọn Kiến trúc Đường ống
              </div>
              <div className="grid gap-2">
                {(
                  [
                    {
                      id: 'gitlab-devsecops',
                      title: 'Full Flow #2: GitLab DevSecOps 5 Stages',
                      desc: 'DAG (needs: []) + 4x Test Shards + Trivy + Manual Gate',
                    },
                    {
                      id: 'github-lean',
                      title: 'Full Flow #1: GitHub Actions Lean CI/CD',
                      desc: 'Concurrency Guard + Postgres/Redis thật + Smoke Test',
                    },
                    {
                      id: 'gitops-argocd',
                      title: 'Mô hình GitOps Pull-based (ArgoCD)',
                      desc: 'CI cập nhật GitOps Repo ← ArgoCD nội bộ chủ động Pull',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPreset(item.id);
                      resetPipeline();
                    }}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-all',
                      preset === item.id
                        ? 'border-cyan-500/50 bg-cyan-500/15 text-white'
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
                Bật thử các lỗi thực tế để xem các chốt chặn DevSecOps và Smoke Test phản ứng như thế nào:
              </p>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-rose-500/40">
                <input
                  type="checkbox"
                  checked={injectSecretLeak}
                  onChange={(e) => setInjectSecretLeak(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 accent-rose-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-rose-300">
                    🔑 Lộ AWS_SECRET_ACCESS_KEY trong code
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Kiểm tra xem Gitleaks / Semgrep SAST (DAG giây thứ 0) có chặn đứng Pipeline không.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-amber-500/40">
                <input
                  type="checkbox"
                  checked={injectTrivyCve}
                  onChange={(e) => setInjectTrivyCve(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 accent-amber-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-amber-300">
                    🛡️ Thư viện chứa lỗ hổng CVE Critical (Đã có bản vá)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Kiểm tra cờ trivy image --exit-code 1 --ignore-unfixed chặn trước khi docker push.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer hover:border-violet-500/40">
                <input
                  type="checkbox"
                  checked={injectStaging500}
                  onChange={(e) => setInjectStaging500(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 accent-violet-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-violet-300">
                    💥 Cổng /health trên Staging trả về HTTP 500
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Kiểm tra lệnh Smoke Test (curl --fail --retry 5) báo động đỏ và kích hoạt Auto-Rollback.
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
                <span>Kích hoạt Chạy Pipeline (git push main)</span>
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
                onClick={resetPipeline}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại Đường ống</span>
              </button>
            </div>
          </div>

          {/* Right Live DAG Graph & Streaming Console Logs (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Visual DAG Pipeline Status Board */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GitCommitHorizontal className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-white">
                    Pipeline #{runCounter} • branch: main • commit: a1b2c3d
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-emerald-400">● Passed</span>
                  <span className="text-sky-400">● Running</span>
                  <span className="text-amber-400">● Waiting Approval</span>
                  <span className="text-rose-400">● Failed</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className={cn(
                        'rounded-xl border p-3.5 space-y-2 transition-all',
                        job.status === 'idle' &&
                          'border-slate-800 bg-slate-950/60 text-slate-400',
                        job.status === 'running' &&
                          'border-sky-500 bg-sky-500/15 text-white ring-2 ring-sky-400/50 animate-pulse',
                        job.status === 'passed' &&
                          'border-emerald-500/50 bg-emerald-500/10 text-white',
                        job.status === 'failed' &&
                          'border-rose-500 bg-rose-500/15 text-white ring-2 ring-rose-500/50',
                        job.status === 'waiting_approval' &&
                          'border-amber-500 bg-amber-500/15 text-white ring-2 ring-amber-400/60',
                        (job.status === 'cancelled' || job.status === 'skipped') &&
                          'border-slate-800 bg-slate-950/30 text-slate-500 opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-slate-700">
                          {job.stage}
                        </span>
                        <span className="font-mono text-[10px]">
                          {job.status === 'passed' && '✅ PASSED'}
                          {job.status === 'running' && '⏳ RUNNING...'}
                          {job.status === 'failed' && '❌ FAILED (exit 1)'}
                          {job.status === 'waiting_approval' && '⏸️ BLOCKED'}
                          {job.status === 'cancelled' && '🚫 CANCELLED'}
                          {job.status === 'skipped' && '⏭️ SKIPPED'}
                          {job.status === 'idle' && `⏱ ${job.durationLabel}`}
                        </span>
                      </div>

                      <div className="text-xs font-bold leading-snug">
                        {job.name}
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {job.subtitle}
                      </div>

                      {job.status === 'waiting_approval' && (
                        <button
                          onClick={handleManualApproveProd}
                          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold text-slate-950 hover:bg-amber-300 shadow-md"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Tech Lead: Approve & Deploy Prod</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Streaming CI Runner Terminal Logs */}
            <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">
                    CI Runner Live Console Output (ubuntu-24.04 / K8s Executor)
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  $WORKSPACE: /builds/company/order-service
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs p-2">
                {logs.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'leading-relaxed',
                      line.includes('✅') || line.includes('🎉')
                        ? 'text-emerald-300'
                        : line.includes('🚨') || line.includes('❌')
                        ? 'text-rose-300 font-bold'
                        : line.includes('⏸️') || line.includes('👉') || line.includes('⚡')
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
      )}

      {/* =====================================================================
          SIMULATOR MODE 2: ZERO-DOWNTIME K8S TRAFFIC & SIGTERM LAB
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
                    onClick={() => setDeployStrategy(st.id)}
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
                      Stable v1.0: {100 - canaryWeight}% | Canary v2.0: {canaryWeight}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={canaryWeight}
                    onChange={(e) => setCanaryWeight(Number(e.target.value))}
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
            </div>

            {/* The 3 Zero-Downtime Pieces (Full Flow #3 & Tình huống B7) */}
            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                2. Bộ 3 Mảnh ghép Chống Lỗi 502 Bad Gateway (Full Flow #3 & B7)
              </div>
              <p className="text-[11px] text-slate-400">
                Hãy thử tắt bớt 1 trong 3 mảnh ghép dưới đây rồi bấm Deploy để xem tại sao hệ thống bị rớt request 502:
              </p>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDumbInitExecForm}
                  onChange={(e) => setHasDumbInitExecForm(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">
                    Mảnh ghép 1/3: Dockerfile dumb-init + Exec Form
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ENTRYPOINT [&quot;/usr/bin/dumb-init&quot;, &quot;--&quot;] CMD [&quot;node&quot;, &quot;dist/server.js&quot;]
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasServerCloseSigterm}
                  onChange={(e) => setHasServerCloseSigterm(e.target.checked)}
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

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPreStopSleep5}
                  onChange={(e) => setHasPreStopSleep5(e.target.checked)}
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

          {/* Right Live Telemetry & Pod Matrix (7 cols) */}
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
