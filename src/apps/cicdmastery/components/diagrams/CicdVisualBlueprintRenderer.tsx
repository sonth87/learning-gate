import React, { useState } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  Workflow,
  ShieldCheck,
  GitBranch,
  Layers,
  Server,
  Activity,
} from 'lucide-react';
import { CicdSvgBlueprintType } from '../../types/cicd.types';
import { cn } from '@/utils/cn';

interface BlueprintProps {
  blueprintType: CicdSvgBlueprintType;
}

export const CicdVisualBlueprintRenderer: React.FC<BlueprintProps> = ({
  blueprintType,
}) => {
  const [animateFlow, setAnimateFlow] = useState(true);
  const [activeSubMode, setActiveSubMode] = useState<'modeA' | 'modeB'>('modeA');
  const [fitMobileScreen, setFitMobileScreen] = useState(false);

  return (
    <div className="ide-dark-surface rounded-2xl border border-cyan-500/30 bg-slate-950 p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-xl">
      {/* Top Blueprint Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/90 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Sơ đồ Kiến trúc & Luồng Động
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 font-mono text-[9px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live SVG
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Sơ đồ kiến trúc trực quan mô phỏng luồng dữ liệu, tín hiệu và ranh giới hệ thống
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(blueprintType === 'svg-bluegreen-vs-canary' ||
            blueprintType === 'svg-gitops-pull-vs-push' ||
            blueprintType === 'svg-zero-downtime-sigterm') && (
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setActiveSubMode('modeA')}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[10px] sm:text-[11px] font-semibold transition-all',
                  activeSubMode === 'modeA'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {blueprintType === 'svg-bluegreen-vs-canary' && '1. Blue-Green'}
                {blueprintType === 'svg-gitops-pull-vs-push' && 'GitOps Pull'}
                {blueprintType === 'svg-zero-downtime-sigterm' && 'Zero-Downtime'}
              </button>
              <button
                onClick={() => setActiveSubMode('modeB')}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[10px] sm:text-[11px] font-semibold transition-all',
                  activeSubMode === 'modeB'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {blueprintType === 'svg-bluegreen-vs-canary' && '2. Canary'}
                {blueprintType === 'svg-gitops-pull-vs-push' && 'Push-based'}
                {blueprintType === 'svg-zero-downtime-sigterm' && 'Lỗi 502!'}
              </button>
            </div>
          )}

          {/* Mobile Zoom / Fit Toggle (< md) */}
          <button
            onClick={() => setFitMobileScreen((v) => !v)}
            className="md:hidden inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 text-[11px] font-bold text-cyan-300"
          >
            <span>
              {fitMobileScreen ? '🔍 Phóng to chữ' : '↔ Thu vừa màn hình'}
            </span>
          </button>

          <button
            onClick={() => setAnimateFlow((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-cyan-500/50"
          >
            {animateFlow ? (
              <>
                <Pause className="h-3 w-3 text-amber-400" />
                <span>Dừng</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>Chạy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Swipe Hint Banner when zoomed for readability */}
      {!fitMobileScreen && (
        <div className="md:hidden flex items-center justify-between rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-mono text-cyan-200">
          <span>↔ Vuốt ngang trên sơ đồ để đọc rõ từng chi tiết kỹ thuật</span>
          <span className="text-cyan-400 font-bold">Touch Pan</span>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div
        className={cn(
          'w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-800/80 bg-[#050b16] p-2 sm:p-3',
          fitMobileScreen && '[&_svg]:!min-w-0'
        )}
      >
        {/* 1. SIX PILLARS OVERVIEW */}
        {blueprintType === 'svg-six-pillars' && (
          <svg viewBox="0 0 920 280" className="w-full min-w-[680px] h-auto">
            <defs>
              <linearGradient id="gradCicd" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect x="10" y="10" width="900" height="260" rx="14" fill="#081021" stroke="#1e293b" />
            <text x="30" y="36" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
              BẢN ĐỒ TỔNG QUAN 6 CÔNG NGHỆ TRỤ CỘT: TỪ GIT COMMIT ĐẾN HẠ TẦNG PHÂN TÁN CHỊU TẢI CAO
            </text>

            {/* Pillar 1: CI/CD Conductor */}
            <rect x="28" y="55" width="185" height="190" rx="12" fill="url(#gradCicd)" stroke="#10b981" strokeWidth="2" />
            <text x="42" y="80" fill="#6ee7b7" fontSize="11" fontWeight="bold" fontFamily="monospace">
              TRỤ CỘT 1: NHẠC TRƯỞNG
            </text>
            <text x="42" y="102" fill="#ffffff" fontSize="15" fontWeight="bold">
              1. CI/CD Pipeline
            </text>
            <text x="42" y="124" fill="#cbd5e1" fontSize="11">
              • Lint / Test Sharding
            </text>
            <text x="42" y="144" fill="#cbd5e1" fontSize="11">
              • DevSecOps (SAST/Trivy)
            </text>
            <text x="42" y="164" fill="#cbd5e1" fontSize="11">
              • OIDC Passwordless
            </text>
            <text x="42" y="184" fill="#cbd5e1" fontSize="11">
              • GitOps (ArgoCD Pull)
            </text>
            <rect x="42" y="202" width="155" height="26" rx="6" fill="#064e3b" stroke="#10b981" />
            <text x="52" y="219" fill="#a7f3d0" fontSize="10" fontFamily="monospace">
              Tài liệu Chuyên đề 01/06
            </text>

            {/* Arrow 1 -> 2 */}
            <line x1="213" y1="150" x2="265" y2="150" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray={animateFlow ? '6 4' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />}
            </line>

            {/* Pillar 2: Docker */}
            <rect x="265" y="55" width="175" height="190" rx="12" fill="#0c1e36" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="280" y="80" fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
              TRỤ CỘT 2: ĐÓNG GÓI
            </text>
            <text x="280" y="102" fill="#ffffff" fontSize="15" fontWeight="bold">
              2. Docker Image
            </text>
            <text x="280" y="124" fill="#cbd5e1" fontSize="11">
              • Multi-stage Build
            </text>
            <text x="280" y="144" fill="#cbd5e1" fontSize="11">
              • Layer Caching
            </text>
            <text x="280" y="164" fill="#cbd5e1" fontSize="11">
              • Non-root + dumb-init
            </text>
            <text x="280" y="184" fill="#cbd5e1" fontSize="11">
              • Kaniko Rootless
            </text>

            {/* Arrow 2 -> 6 */}
            <line x1="440" y1="150" x2="490" y2="150" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray={animateFlow ? '6 4' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />}
            </line>

            {/* Pillar 6: Kubernetes Cluster wrapping Pillars 3, 4, 5 */}
            <rect x="490" y="50" width="402" height="200" rx="14" fill="#131129" stroke="#8b5cf6" strokeWidth="2" />
            <text x="508" y="74" fill="#c4b5fd" fontSize="12" fontWeight="bold" fontFamily="monospace">
              6. KUBERNETES CLUSTER (Probes, Rolling/Canary, HPA, Helm)
            </text>

            {/* Pillar 3: Redis */}
            <rect x="508" y="90" width="118" height="142" rx="10" fill="#1e152a" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="518" y="112" fill="#fda4af" fontSize="12" fontWeight="bold">
              3. Redis
            </text>
            <text x="518" y="130" fill="#cbd5e1" fontSize="10">
              • In-Memory Cache
            </text>
            <text x="518" y="148" fill="#cbd5e1" fontSize="10">
              • Redlock / PubSub
            </text>
            <text x="518" y="166" fill="#cbd5e1" fontSize="10">
              • RDB vs. AOF
            </text>
            <text x="518" y="184" fill="#cbd5e1" fontSize="10">
              • Stampede Guard
            </text>

            {/* Pillar 4: RabbitMQ */}
            <rect x="636" y="90" width="118" height="142" rx="10" fill="#1c1917" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="646" y="112" fill="#fcd34d" fontSize="12" fontWeight="bold">
              4. RabbitMQ
            </text>
            <text x="646" y="130" fill="#cbd5e1" fontSize="10">
              • Smart Broker
            </text>
            <text x="646" y="148" fill="#cbd5e1" fontSize="10">
              • AMQP Exchanges
            </text>
            <text x="646" y="166" fill="#cbd5e1" fontSize="10">
              • ACK/NACK & DLX
            </text>
            <text x="646" y="184" fill="#cbd5e1" fontSize="10">
              • Quorum Queues
            </text>

            {/* Pillar 5: Kafka */}
            <rect x="764" y="90" width="114" height="142" rx="10" fill="#0f222d" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="774" y="112" fill="#67e8f9" fontSize="12" fontWeight="bold">
              5. Kafka
            </text>
            <text x="774" y="130" fill="#cbd5e1" fontSize="10">
              • Event Streaming
            </text>
            <text x="774" y="148" fill="#cbd5e1" fontSize="10">
              • Partitions & ISR
            </text>
            <text x="774" y="166" fill="#cbd5e1" fontSize="10">
              • Zero-Copy I/O
            </text>
            <text x="774" y="184" fill="#cbd5e1" fontSize="10">
              • Outbox Pattern
            </text>
          </svg>
        )}

        {/* 2. HINH 1.1: CI vs DELIVERY vs DEPLOYMENT */}
        {blueprintType === 'svg-ci-delivery-deployment' && (
          <svg viewBox="0 0 920 270" className="w-full min-w-[680px] h-auto">
            {/* Stage 1 Box */}
            <rect x="16" y="15" width="425" height="175" rx="12" fill="#0a1628" stroke="#0284c7" strokeDasharray="5 3" strokeWidth="1.5" />
            <text x="30" y="38" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              GIAI ĐOẠN 1: CONTINUOUS INTEGRATION (CI — TÍCH HỢP LIÊN TỤC)
            </text>

            {/* Stage 2 Box */}
            <rect x="458" y="15" width="446" height="175" rx="12" fill="#0b1d1c" stroke="#10b981" strokeDasharray="5 3" strokeWidth="1.5" />
            <text x="472" y="38" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
              GIAI ĐOẠN 2: CONTINUOUS DELIVERY vs. CONTINUOUS DEPLOYMENT
            </text>

            {/* Node 1 */}
            <rect x="28" y="62" width="118" height="82" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="40" y="88" fill="#7dd3fc" fontSize="12" fontWeight="bold">1. Git Commit</text>
            <text x="40" y="108" fill="#cbd5e1" fontSize="10">Push / Merge PR</text>
            <text x="40" y="126" fill="#94a3b8" fontSize="9" fontFamily="monospace">main / feature/*</text>

            {/* Node 2 */}
            <rect x="168" y="62" width="122" height="82" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.8" />
            <text x="178" y="88" fill="#6ee7b7" fontSize="12" fontWeight="bold">2. Verify & Test</text>
            <text x="178" y="108" fill="#cbd5e1" fontSize="10">Lint / Unit / SAST</text>
            <text x="178" y="126" fill="#94a3b8" fontSize="9" fontFamily="monospace">Fail-Fast Check</text>

            {/* Node 3 */}
            <rect x="312" y="62" width="115" height="82" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="324" y="88" fill="#fcd34d" fontSize="12" fontWeight="bold">3. Package</text>
            <text x="324" y="108" fill="#cbd5e1" fontSize="10">Docker / Artifact</text>
            <text x="324" y="126" fill="#94a3b8" fontSize="9" fontFamily="monospace">Immutable SHA</text>

            {/* Node 4 */}
            <rect x="472" y="62" width="122" height="82" rx="10" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.8" />
            <text x="484" y="88" fill="#c4b5fd" fontSize="12" fontWeight="bold">4. Staging Env</text>
            <text x="484" y="108" fill="#cbd5e1" fontSize="10">Integration / E2E</text>
            <text x="484" y="126" fill="#94a3b8" fontSize="9" fontFamily="monospace">Smoke /health</text>

            {/* Gate Node */}
            <rect x="616" y="54" width="142" height="98" rx="10" fill="#1f160f" stroke="#f59e0b" strokeWidth="2" />
            <text x="626" y="76" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">RANH GIỚI KỸ THUẬT</text>
            <text x="626" y="96" fill="#fde68a" fontSize="11" fontWeight="bold">• Delivery: Duyệt tay</text>
            <text x="634" y="111" fill="#cbd5e1" fontSize="9" fontFamily="monospace">(Manual Approval Gate)</text>
            <text x="626" y="130" fill="#6ee7b7" fontSize="11" fontWeight="bold">• Deployment: Tự động</text>
            <text x="634" y="144" fill="#cbd5e1" fontSize="9" fontFamily="monospace">(100% Auto Release)</text>

            {/* Node 5 */}
            <rect x="778" y="62" width="114" height="82" rx="10" fill="#062c22" stroke="#10b981" strokeWidth="2" />
            <text x="790" y="88" fill="#34d399" fontSize="12" fontWeight="bold">5. Production</text>
            <text x="790" y="108" fill="#ecfdf5" fontSize="10">Live Release</text>
            <text x="790" y="126" fill="#6ee7b7" fontSize="9" fontFamily="monospace">Zero-Downtime</text>

            {/* Forward Arrows */}
            {[146, 290, 427, 594, 758].map((x, idx) => (
              <line
                key={idx}
                x1={x}
                y1="103"
                x2={x + 21}
                y2="103"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray={animateFlow ? '5 3' : undefined}
              >
                {animateFlow && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.9s" repeatCount="indefinite" />}
              </line>
            ))}

            {/* Feedback Loop Arrow (Bottom) */}
            <path
              d="M 835 145 L 835 230 L 85 230 L 85 146"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeDasharray={animateFlow ? '7 4' : '4 4'}
            >
              {animateFlow && <animate attributeName="stroke-dashoffset" from="0" to="22" dur="1.2s" repeatCount="indefinite" />}
            </path>
            <rect x="235" y="212" width="450" height="30" rx="8" fill="#2a0a18" stroke="#f43f5e" />
            <text x="255" y="231" fill="#fda4af" fontSize="11" fontWeight="bold">
              ◀── Vòng lặp phản hồi tự động (Test Reports, Security Alerts, Telemetry & Auto-Rollback)
            </text>
          </svg>
        )}

        {/* 3. SIX CORE ENTITIES & RUNNER ISOLATION */}
        {blueprintType === 'svg-six-core-entities' && (
          <svg viewBox="0 0 920 275" className="w-full min-w-[680px] h-auto">
            <rect x="14" y="14" width="892" height="248" rx="14" fill="#081120" stroke="#334155" />
            <text x="30" y="38" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
              2. PIPELINE / WORKFLOW (.github/workflows/*.yml | .gitlab-ci.yml) — ĐỊNH NGHĨA BẰNG MÃ NGUỒN
            </text>

            {/* 1. Trigger */}
            <rect x="28" y="55" width="138" height="186" rx="10" fill="#1e1b18" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="40" y="78" fill="#fbbf24" fontSize="12" fontWeight="bold">1. Trigger</text>
            <text x="40" y="98" fill="#e2e8f0" fontSize="10" fontFamily="monospace">• push / PR</text>
            <text x="40" y="116" fill="#e2e8f0" fontSize="10" fontFamily="monospace">• tag / release</text>
            <text x="40" y="134" fill="#e2e8f0" fontSize="10" fontFamily="monospace">• schedule (cron)</text>
            <text x="40" y="152" fill="#e2e8f0" fontSize="10" fontFamily="monospace">• workflow_dispatch</text>
            <rect x="38" y="172" width="118" height="54" rx="6" fill="#291d12" stroke="#d97706" />
            <text x="45" y="190" fill="#fde68a" fontSize="9" fontWeight="bold">Concurrency Guard:</text>
            <text x="45" y="205" fill="#cbd5e1" fontSize="9" fontFamily="monospace">cancel-in-progress</text>
            <text x="45" y="218" fill="#34d399" fontSize="9" fontFamily="monospace">chỉ hủy trên PR!</text>

            {/* 3. Stages & 4. Jobs */}
            <rect x="190" y="55" width="470" height="186" rx="10" fill="#0b172a" stroke="#0284c7" strokeWidth="1.8" />
            <text x="205" y="76" fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
              3. STAGES (Tuần tự) & 4. JOBS (Song song trên Ephemeral Containers độc lập)
            </text>

            {/* Job A */}
            <rect x="205" y="90" width="212" height="136" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
            <text x="216" y="110" fill="#6ee7b7" fontSize="11" fontWeight="bold">Job 1: verify-and-build</text>
            <text x="216" y="128" fill="#cbd5e1" fontSize="10">5. Steps (Chung $WORKSPACE):</text>
            <text x="222" y="145" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">Step 1: checkout & setup-node</text>
            <text x="222" y="161" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">Step 2: npm ci (Strict Lockfile)</text>
            <text x="222" y="177" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">Services: Postgres 16 + Redis 7</text>
            <text x="222" y="193" fill="#fcd34d" fontSize="9.5" fontFamily="monospace">Step 6: upload-artifact (dist/)</text>
            <text x="222" y="212" fill="#fda4af" fontSize="9" fontFamily="monospace">exit code != 0 ──► Dừng ngay!</text>

            {/* Artifact Bridge */}
            <line x1="417" y1="158" x2="438" y2="158" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray={animateFlow ? '5 3' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.8s" repeatCount="indefinite" />}
            </line>

            {/* Job B */}
            <rect x="438" y="90" width="206" height="136" rx="8" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="450" y="110" fill="#c4b5fd" fontSize="11" fontWeight="bold">Job 2: deploy-staging</text>
            <text x="450" y="128" fill="#cbd5e1" fontSize="10">Máy ảo Ephemeral mới tinh:</text>
            <text x="456" y="146" fill="#fcd34d" fontSize="9.5" fontFamily="monospace">Step 1: download-artifact</text>
            <text x="456" y="164" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">Step 2: ./deploy-staging.sh</text>
            <text x="456" y="182" fill="#34d399" fontSize="9.5" fontFamily="monospace">Step 3: curl --fail --retry 5</text>
            <text x="456" y="200" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace">https://staging.../health</text>

            {/* 6. Runner */}
            <rect x="682" y="55" width="210" height="186" rx="10" fill="#17132a" stroke="#8b5cf6" strokeWidth="1.8" />
            <text x="696" y="78" fill="#c4b5fd" fontSize="12" fontWeight="bold">6. Runner / Agent</text>
            <text x="696" y="100" fill="#e2e8f0" fontSize="10.5">• Managed Cloud Runner</text>
            <text x="696" y="120" fill="#e2e8f0" fontSize="10.5">• Self-hosted Runner (VPC)</text>
            <rect x="694" y="138" width="186" height="88" rx="8" fill="#2c0b16" stroke="#f43f5e" />
            <text x="704" y="158" fill="#fda4af" fontSize="10" fontWeight="bold">🚨 NGUYÊN TẮC BẢO MẬT:</text>
            <text x="704" y="176" fill="#fecdd3" fontSize="9.5">Cấm tuyệt đối PR từ kho</text>
            <text x="704" y="192" fill="#fecdd3" fontSize="9.5">Fork lạ chạy trên Self-hosted</text>
            <text x="704" y="208" fill="#fecdd3" fontSize="9.5">Runner trong mạng nội bộ!</text>
          </svg>
        )}

        {/* 4. GIT BRANCHING STRATEGIES */}
        {blueprintType === 'svg-git-branching' && (
          <svg viewBox="0 0 920 265" className="w-full min-w-[680px] h-auto">
            {/* GitFlow */}
            <rect x="14" y="14" width="285" height="236" rx="12" fill="#171311" stroke="#f59e0b" />
            <text x="28" y="38" fill="#fbbf24" fontSize="12" fontWeight="bold">1. GitFlow (Truyền thống — Chu kỳ dài)</text>
            <line x1="35" y1="68" x2="275" y2="68" stroke="#38bdf8" strokeWidth="3" />
            <text x="35" y="60" fill="#7dd3fc" fontSize="10" fontFamily="monospace">main</text>
            <line x1="35" y1="115" x2="275" y2="115" stroke="#f59e0b" strokeWidth="3" />
            <text x="35" y="107" fill="#fcd34d" fontSize="10" fontFamily="monospace">develop</text>
            <path d="M 70 115 L 95 160 L 210 160 L 235 115" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
            <text x="95" y="176" fill="#fda4af" fontSize="10" fontFamily="monospace">feature/* (Sống nhiều tuần → Xung đột!)</text>
            <text x="28" y="215" fill="#cbd5e1" fontSize="10.5">Nhánh tách rời quá lâu gây "Merge Hell"</text>
            <text x="28" y="232" fill="#94a3b8" fontSize="10">Cản trở Continuous Integration hiện đại.</text>

            {/* GitHub Flow */}
            <rect x="316" y="14" width="285" height="236" rx="12" fill="#0b1727" stroke="#38bdf8" />
            <text x="330" y="38" fill="#38bdf8" fontSize="12" fontWeight="bold">2. GitHub Flow (Tinh gọn — PR ngắn)</text>
            <line x1="336" y1="85" x2="578" y2="85" stroke="#10b981" strokeWidth="3.5" />
            <text x="336" y="74" fill="#6ee7b7" fontSize="10" fontFamily="monospace">main (Luôn sẵn sàng Deploy)</text>
            <path d="M 380 85 L 405 140 L 495 140 L 520 85" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray={animateFlow ? '5 3' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />}
            </path>
            <circle cx="450" cy="140" r="6" fill="#38bdf8" />
            <text x="385" y="164" fill="#7dd3fc" fontSize="10" fontFamily="monospace">PR: Chạy CI + Review → Merge & Deploy</text>
            <text x="330" y="215" fill="#cbd5e1" fontSize="10.5">Chỉ duy trì 1 nhánh chính duy nhất là main.</text>
            <text x="330" y="232" fill="#94a3b8" fontSize="10">Phù hợp đa số dự án Web / Microservices.</text>

            {/* Trunk-Based */}
            <rect x="618" y="14" width="288" height="236" rx="12" fill="#071f18" stroke="#10b981" strokeWidth="2" />
            <text x="632" y="38" fill="#34d399" fontSize="12" fontWeight="bold">3. Trunk-Based (Chuẩn mực CI/CD Elite)</text>
            <line x1="638" y1="95" x2="885" y2="95" stroke="#10b981" strokeWidth="4" />
            <text x="638" y="80" fill="#6ee7b7" fontSize="10" fontFamily="monospace">main (Trunk — Merge hàng ngày)</text>
            {[675, 735, 795, 850].map((cx, i) => (
              <circle key={i} cx={cx} cy="95" r="7" fill="#34d399" stroke="#052e16" strokeWidth="2" />
            ))}
            <rect x="638" y="125" width="246" height="54" rx="8" fill="#064e3b" stroke="#10b981" />
            <text x="650" y="145" fill="#a7f3d0" fontSize="10.5" fontWeight="bold">🔒 Feature Flags (Feature Toggles):</text>
            <text x="650" y="164" fill="#ecfdf5" fontSize="9.5" fontFamily="monospace">Ẩn tính năng đang làm dở sau Flag</text>
            <text x="632" y="215" fill="#cbd5e1" fontSize="10.5">Hợp nhất thay đổi nhỏ vào main mỗi ngày.</text>
            <text x="632" y="232" fill="#6ee7b7" fontSize="10" fontWeight="bold">Tách rời Deploy kỹ thuật khỏi Release!</text>
          </svg>
        )}

        {/* 5. CACHE VS ARTIFACT & DAG SHARDING */}
        {blueprintType === 'svg-cache-vs-artifact-dag' && (
          <svg viewBox="0 0 920 280" className="w-full min-w-[680px] h-auto">
            {/* Left: Cache vs Artifact */}
            <rect x="14" y="14" width="420" height="252" rx="12" fill="#0a1424" stroke="#334155" />
            <text x="28" y="38" fill="#fbbf24" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              PHÂN BIỆT BẢN CHẤT: CACHE vs. ARTIFACT
            </text>

            {/* Cache Box */}
            <rect x="28" y="52" width="392" height="94" rx="10" fill="#1c160d" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="40" y="74" fill="#fcd34d" fontSize="12" fontWeight="bold">
              1. CACHE (Across Pipelines — Giữa các Pipeline)
            </text>
            <text x="40" y="94" fill="#e2e8f0" fontSize="10.5">
              Lưu thư viện tải từ Internet: ~/.npm, ~/.m2/repository, .venv
            </text>
            <text x="40" y="114" fill="#38bdf8" fontSize="10" fontFamily="monospace">
              Key: hashFiles(&apos;**/package-lock.json&apos;)
            </text>
            <text x="40" y="132" fill="#6ee7b7" fontSize="10" fontFamily="monospace">
              Job 1: policy: pull-push | Các Job sau: policy: pull (-60s!)
            </text>

            {/* Artifact Box */}
            <rect x="28" y="158" width="392" height="94" rx="10" fill="#0c1d2c" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="40" y="180" fill="#7dd3fc" fontSize="12" fontWeight="bold">
              2. ARTIFACT (Within a Pipeline — Nội bộ 1 Pipeline)
            </text>
            <text x="40" y="200" fill="#e2e8f0" fontSize="10.5">
              Lưu sản phẩm biên dịch: dist/, file .jar, báo cáo junit.xml
            </text>
            <text x="40" y="220" fill="#fcd34d" fontSize="10" fontFamily="monospace">
              Truyền từ Job Build ──► Job Deploy (build-$&#123;&#123; github.sha &#125;&#125;)
            </text>
            <text x="40" y="238" fill="#cbd5e1" fontSize="10">
              Hoặc lưu trữ phục vụ kiểm toán chất lượng sau khi chạy.
            </text>

            {/* Right: DAG & Test Sharding */}
            <rect x="450" y="14" width="456" height="252" rx="12" fill="#09191f" stroke="#10b981" />
            <text x="466" y="38" fill="#34d399" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              ĐỒ THỊ DAG (needs: []) & TEST SHARDING (parallel: 4)
            </text>

            {/* Giây 0 */}
            <rect x="468" y="62" width="132" height="72" rx="8" fill="#0f172a" stroke="#f59e0b" />
            <text x="478" y="84" fill="#fcd34d" fontSize="10.5" fontWeight="bold">lint_and_warm_cache</text>
            <text x="478" y="102" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">policy: pull-push</text>
            <text x="478" y="118" fill="#94a3b8" fontSize="9">Chạy ở t = 0s</text>

            <rect x="468" y="164" width="132" height="76" rx="8" fill="#231024" stroke="#f43f5e" strokeWidth="1.8" />
            <text x="478" y="186" fill="#fda4af" fontSize="10.5" fontWeight="bold">secret_and_sast</text>
            <text x="478" y="204" fill="#fecdd3" fontSize="9.5" fontFamily="monospace">needs: [] (DAG!)</text>
            <text x="478" y="222" fill="#34d399" fontSize="9" fontWeight="bold">Chạy ngay ở t = 0s!</text>

            {/* 4 Shards */}
            {[56, 98, 140, 182].map((y, idx) => (
              <g key={idx}>
                <line x1="600" y1="98" x2="635" y2={y + 15} stroke="#38bdf8" strokeWidth="1.8" strokeDasharray={animateFlow ? '4 2' : undefined} />
                <rect x="635" y={y} width="128" height="32" rx="6" fill="#0f2537" stroke="#38bdf8" />
                <text x="645" y={y + 20} fill="#bae6fd" fontSize="10" fontFamily="monospace">
                  Jest --shard={idx + 1}/4
                </text>
                <line x1="763" y1={y + 15} x2="792" y2="145" stroke="#10b981" strokeWidth="1.8" />
              </g>
            ))}

            {/* DAG Line from SAST to Package */}
            <line x1="600" y1="202" x2="792" y2="165" stroke="#f43f5e" strokeWidth="2" strokeDasharray={animateFlow ? '5 3' : undefined} />

            {/* Package & Trivy */}
            <rect x="792" y="105" width="102" height="90" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
            <text x="800" y="130" fill="#a7f3d0" fontSize="10.5" fontWeight="bold">Docker Build</text>
            <text x="800" y="148" fill="#6ee7b7" fontSize="10" fontWeight="bold">+ Trivy Scan</text>
            <text x="800" y="168" fill="#ecfdf5" fontSize="9" fontFamily="monospace">--ignore-unfixed</text>
            <text x="800" y="183" fill="#fcd34d" fontSize="9" fontFamily="monospace">12p ──► 3p!</text>
          </svg>
        )}

        {/* 6. DEVSECOPS 5 LAYERS & OIDC */}
        {blueprintType === 'svg-devsecops-oidc' && (
          <svg viewBox="0 0 920 275" className="w-full min-w-[680px] h-auto">
            {/* 5 Shift-Left Security Layers */}
            <rect x="14" y="14" width="510" height="248" rx="12" fill="#0b1324" stroke="#334155" />
            <text x="28" y="38" fill="#38bdf8" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              DEVSECOPS SHIFT-LEFT: 5 CHỐT KIỂM SOÁT AN NINH TỰ ĐỘNG
            </text>

            {[
              { x: 26, title: '1. Secret', tool: 'Gitleaks', risk: 'AWS Key, DB Pass', color: '#f43f5e' },
              { x: 124, title: '2. SAST', tool: 'Semgrep', risk: 'SQLi, XSS, AST', color: '#f59e0b' },
              { x: 222, title: '3. SCA', tool: 'Trivy / Snyk', risk: 'Lockfile CVEs', color: '#38bdf8' },
              { x: 320, title: '4. Image/IaC', tool: 'Trivy/Checkov', risk: 'OS & K8s YAML', color: '#a78bfa' },
              { x: 418, title: '5. DAST', tool: 'OWASP ZAP', risk: 'Black-box Staging', color: '#10b981' },
            ].map((item, idx) => (
              <g key={idx}>
                <rect x={item.x} y="56" width="90" height="186" rx="8" fill="#0f172a" stroke={item.color} strokeWidth="1.8" />
                <text x={item.x + 8} y="82" fill={item.color} fontSize="11" fontWeight="bold">
                  {item.title}
                </text>
                <text x={item.x + 8} y="108" fill="#ffffff" fontSize="10.5" fontWeight="bold" fontFamily="monospace">
                  {item.tool}
                </text>
                <text x={item.x + 8} y="138" fill="#94a3b8" fontSize="9.5">
                  Phát hiện:
                </text>
                <text x={item.x + 8} y="156" fill="#cbd5e1" fontSize="9.5">
                  {item.risk}
                </text>
                <rect x={item.x + 8} y="195" width="74" height="28" rx="5" fill="#1e293b" />
                <text x={item.x + 15} y="213" fill="#34d399" fontSize="9.5" fontFamily="monospace">
                  Gate #{idx + 1}
                </text>
              </g>
            ))}

            {/* Right: OIDC Passwordless Flow */}
            <rect x="540" y="14" width="366" height="248" rx="12" fill="#0a1e1c" stroke="#10b981" strokeWidth="1.8" />
            <text x="556" y="38" fill="#6ee7b7" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              XÁC THỰC CLOUD KHÔNG MẬT KHẨU (OIDC)
            </text>

            <rect x="558" y="56" width="145" height="68" rx="8" fill="#0f172a" stroke="#38bdf8" />
            <text x="570" y="78" fill="#7dd3fc" fontSize="11" fontWeight="bold">CI Server (OIDC)</text>
            <text x="570" y="96" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">id-token: write</text>
            <text x="570" y="112" fill="#94a3b8" fontSize="9">Ký số JWT ngắn hạn</text>

            <rect x="742" y="56" width="148" height="68" rx="8" fill="#0f172a" stroke="#f59e0b" />
            <text x="754" y="78" fill="#fcd34d" fontSize="11" fontWeight="bold">AWS STS / GCP IAM</text>
            <text x="754" y="96" fill="#cbd5e1" fontSize="9.5">Kiểm tra chữ ký &</text>
            <text x="754" y="112" fill="#6ee7b7" fontSize="9" fontFamily="monospace">ref: refs/heads/main</text>

            {/* Arrow JWT */}
            <line x1="703" y1="78" x2="742" y2="78" stroke="#38bdf8" strokeWidth="2" strokeDasharray={animateFlow ? '4 2' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.8s" repeatCount="indefinite" />}
            </line>
            {/* Arrow STS Token */}
            <line x1="742" y1="104" x2="703" y2="104" stroke="#10b981" strokeWidth="2" strokeDasharray={animateFlow ? '4 2' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.8s" repeatCount="indefinite" />}
            </line>

            <rect x="558" y="142" width="332" height="102" rx="8" fill="#052e16" stroke="#10b981" />
            <text x="572" y="165" fill="#6ee7b7" fontSize="11" fontWeight="bold">
              ✅ Cấp Temporary Token Tự hủy sau 15–60 Phút:
            </text>
            <text x="572" y="186" fill="#ecfdf5" fontSize="10">
              • Loại bỏ 100% khóa tĩnh AWS_ACCESS_KEY_ID vĩnh viễn.
            </text>
            <text x="572" y="206" fill="#ecfdf5" fontSize="10">
              • Chống rò rỉ khóa từ biến môi trường của CI Runner.
            </text>
            <text x="572" y="226" fill="#fcd34d" fontSize="10" fontFamily="monospace">
              • Kaniko Rootless đẩy Image không cần --privileged!
            </text>
          </svg>
        )}

        {/* 7. HINH 3.1: BLUE-GREEN VS CANARY */}
        {blueprintType === 'svg-bluegreen-vs-canary' && (
          <svg viewBox="0 0 920 270" className="w-full min-w-[680px] h-auto">
            {/* Left: Blue-Green */}
            <rect
              x="14"
              y="14"
              width="435"
              height="242"
              rx="12"
              fill="#091628"
              stroke={activeSubMode === 'modeA' ? '#10b981' : '#334155'}
              strokeWidth={activeSubMode === 'modeA' ? '2.5' : '1.2'}
            />
            <text x="28" y="38" fill="#38bdf8" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              1. BLUE-GREEN DEPLOYMENT (Chuyển mạch 100% tức thì)
            </text>

            <rect x="28" y="102" width="118" height="72" rx="8" fill="#1e1b18" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="38" y="128" fill="#fcd34d" fontSize="11" fontWeight="bold">Load Balancer</text>
            <text x="38" y="148" fill="#cbd5e1" fontSize="9.5">(Router / Ingress)</text>

            {/* Blue Cluster */}
            <rect x="210" y="56" width="222" height="78" rx="8" fill="#0c1e38" stroke="#38bdf8" strokeDasharray="4 2" />
            <text x="224" y="80" fill="#7dd3fc" fontSize="11.5" fontWeight="bold">Cụm BLUE (v1.0 — Bản cũ)</text>
            <text x="224" y="100" fill="#cbd5e1" fontSize="10">Giữ nguyên ở chế độ chờ (Standby)</text>
            <text x="224" y="118" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">Sẵn sàng Rollback &lt; 1 giây!</text>

            {/* Green Cluster */}
            <rect x="210" y="152" width="222" height="82" rx="8" fill="#063224" stroke="#10b981" strokeWidth="2" />
            <text x="224" y="176" fill="#34d399" fontSize="11.5" fontWeight="bold">Cụm GREEN (v2.0 — Bản mới)</text>
            <text x="224" y="196" fill="#ecfdf5" fontSize="10">Nhận 100% Traffic sau Smoke Test</text>
            <text x="224" y="216" fill="#fcd34d" fontSize="9.5" fontFamily="monospace">Đánh đổi: Gấp đôi RAM/CPU</text>

            {/* Blue-Green Traffic Lines */}
            <line x1="146" y1="125" x2="210" y2="95" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="155" y="96" fill="#64748b" fontSize="10" fontFamily="monospace">0%</text>
            <line x1="146" y1="150" x2="210" y2="192" stroke="#10b981" strokeWidth="3.5" strokeDasharray={animateFlow ? '6 3' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />}
            </line>
            <text x="152" y="188" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">100%</text>

            {/* Right: Canary Release */}
            <rect
              x="466"
              y="14"
              width="440"
              height="242"
              rx="12"
              fill="#0f1526"
              stroke={activeSubMode === 'modeB' ? '#f59e0b' : '#334155'}
              strokeWidth={activeSubMode === 'modeB' ? '2.5' : '1.2'}
            />
            <text x="480" y="38" fill="#fcd34d" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              2. CANARY RELEASE (Dịch chuyển lưu lượng tăng dần)
            </text>

            <rect x="480" y="102" width="122" height="72" rx="8" fill="#1e1b18" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="490" y="128" fill="#fcd34d" fontSize="11" fontWeight="bold">Service Mesh /</text>
            <text x="490" y="148" fill="#cbd5e1" fontSize="10">Argo Rollouts</text>

            {/* Stable Pods */}
            <rect x="665" y="56" width="224" height="78" rx="8" fill="#0c1e38" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="678" y="80" fill="#7dd3fc" fontSize="11.5" fontWeight="bold">Stable Pods (v1.0)</text>
            <text x="678" y="102" fill="#e2e8f0" fontSize="10.5" fontFamily="monospace">95% ──► 75% ──► 0% Traffic</text>
            <text x="678" y="120" fill="#94a3b8" fontSize="9.5">Phục vụ phần lớn người dùng</text>

            {/* Canary Pods */}
            <rect x="665" y="152" width="224" height="82" rx="8" fill="#1e1633" stroke="#a78bfa" strokeWidth="2" />
            <text x="678" y="176" fill="#c4b5fd" fontSize="11.5" fontWeight="bold">Canary Pods (v2.0)</text>
            <text x="678" y="198" fill="#34d399" fontSize="10.5" fontFamily="monospace">5% ──► 25% ──► 100% Traffic</text>
            <text x="678" y="218" fill="#fcd34d" fontSize="9.5">Đo HTTP 5xx & Latency P99</text>

            {/* Canary Traffic Lines */}
            <line x1="602" y1="125" x2="665" y2="95" stroke="#38bdf8" strokeWidth="3" strokeDasharray={animateFlow ? '6 3' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.9s" repeatCount="indefinite" />}
            </line>
            <text x="612" y="96" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">95%</text>

            <line x1="602" y1="150" x2="665" y2="192" stroke="#a78bfa" strokeWidth="2" strokeDasharray={animateFlow ? '4 3' : undefined}>
              {animateFlow && <animate attributeName="stroke-dashoffset" from="14" to="0" dur="0.9s" repeatCount="indefinite" />}
            </line>
            <text x="616" y="188" fill="#c4b5fd" fontSize="11" fontWeight="bold" fontFamily="monospace">5%</text>
          </svg>
        )}

        {/* 8. HINH 3.2: GITOPS PULL-BASED VS PUSH-BASED */}
        {blueprintType === 'svg-gitops-pull-vs-push' && (
          <svg viewBox="0 0 920 275" className="w-full min-w-[680px] h-auto">
            {/* Left: Vùng CI */}
            <rect x="14" y="14" width="435" height="246" rx="12" fill="#0a1628" stroke="#38bdf8" strokeDasharray="5 3" strokeWidth="1.5" />
            <text x="28" y="38" fill="#38bdf8" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              VÙNG CI (Xây dựng & Kiểm định — Không giữ khóa K8s!)
            </text>

            <rect x="28" y="56" width="118" height="66" rx="8" fill="#0f172a" stroke="#64748b" />
            <text x="38" y="80" fill="#ffffff" fontSize="11" fontWeight="bold">1. App Source Git</text>
            <text x="38" y="100" fill="#94a3b8" fontSize="10">Code ứng dụng</text>

            <rect x="168" y="56" width="118" height="66" rx="8" fill="#0f172a" stroke="#38bdf8" />
            <text x="178" y="80" fill="#7dd3fc" fontSize="11" fontWeight="bold">2. CI Pipeline</text>
            <text x="178" y="100" fill="#cbd5e1" fontSize="10">Test & Scan</text>

            <rect x="308" y="56" width="124" height="66" rx="8" fill="#0f172a" stroke="#10b981" />
            <text x="320" y="80" fill="#6ee7b7" fontSize="11" fontWeight="bold">3. Registry</text>
            <text x="320" y="100" fill="#cbd5e1" fontSize="10" fontFamily="monospace">Image v1.2.4</text>

            <rect x="65" y="156" width="335" height="82" rx="10" fill="#1c160c" stroke="#f59e0b" strokeWidth="2" />
            <text x="82" y="182" fill="#fcd34d" fontSize="12" fontWeight="bold">
              4. GitOps Config Repo (Source of Truth)
            </text>
            <text x="82" y="204" fill="#fde68a" fontSize="10.5" fontFamily="monospace">
              Cập nhật tag app:v1.2.4 trong K8s YAML / Helm
            </text>
            <text x="82" y="222" fill="#94a3b8" fontSize="9.5">
              Mọi thay đổi hạ tầng đều lưu vết lịch sử Git 100%
            </text>

            {/* CI Internal Arrows */}
            <line x1="146" y1="88" x2="168" y2="88" stroke="#38bdf8" strokeWidth="2" />
            <line x1="286" y1="88" x2="308" y2="88" stroke="#10b981" strokeWidth="2" />
            <line x1="227" y1="122" x2="227" y2="156" stroke="#f59e0b" strokeWidth="2" />

            {/* Right: Production K8s Cluster */}
            <rect x="486" y="14" width="420" height="246" rx="12" fill="#06221c" stroke="#10b981" strokeWidth="2.2" />
            <text x="502" y="38" fill="#34d399" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              PRODUCTION K8S CLUSTER (Mạng Nội Bộ Đóng Kín)
            </text>

            <rect x="506" y="68" width="192" height="156" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.8" />
            <text x="518" y="94" fill="#6ee7b7" fontSize="12" fontWeight="bold">5. ArgoCD Controller</text>
            <text x="518" y="118" fill="#e2e8f0" fontSize="10">• Chủ động Pull Git liên tục</text>
            <text x="518" y="140" fill="#fcd34d" fontSize="10">• Phát hiện cấu hình lệch (Drift)</text>
            <text x="518" y="162" fill="#34d399" fontSize="10">• Tự động đồng bộ (Reconcile)</text>
            <text x="518" y="195" fill="#94a3b8" fontSize="9" fontFamily="monospace">selfHeal: true | prune: true</text>

            <rect x="722" y="68" width="166" height="156" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            <text x="734" y="94" fill="#7dd3fc" fontSize="12" fontWeight="bold">6. Production Pods</text>
            <text x="734" y="120" fill="#cbd5e1" fontSize="10">• Deployments</text>
            <text x="734" y="140" fill="#cbd5e1" fontSize="10">• Services & Ingress</text>
            <text x="734" y="160" fill="#cbd5e1" fontSize="10">• ConfigMaps</text>
            <text x="734" y="195" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace">Running: app:v1.2.4</text>

            <line x1="698" y1="146" x2="722" y2="146" stroke="#10b981" strokeWidth="2.5" />

            {/* PULL Arrow Across Firewall */}
            <path
              d="M 506 196 L 400 196"
              fill="none"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeDasharray={animateFlow ? '7 4' : undefined}
            >
              {animateFlow && <animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.8s" repeatCount="indefinite" />}
            </path>
            <rect x="424" y="168" width="56" height="22" rx="5" fill="#064e3b" stroke="#10b981" />
            <text x="435" y="183" fill="#6ee7b7" fontSize="10" fontWeight="bold" fontFamily="monospace">
              PULL
            </text>
          </svg>
        )}

        {/* 9. HINH 4.1 & B7: ZERO-DOWNTIME SIGTERM & PRESTOP */}
        {blueprintType === 'svg-zero-downtime-sigterm' && (
          <svg viewBox="0 0 920 280" className="w-full min-w-[680px] h-auto">
            <rect x="14" y="14" width="892" height="252" rx="12" fill="#08111f" stroke="#334155" />
            <text x="28" y="38" fill="#38bdf8" fontSize="11.5" fontWeight="bold" fontFamily="monospace">
              {activeSubMode === 'modeA'
                ? 'HÌNH 4.1 & FULL FLOW #3: CHUỖI 5 BƯỚC PHỐI HỢP ĐẠT ZERO-DOWNTIME TUYỆT ĐỐI (0% LỖI 502)'
                : 'TÌNH HUỐNG B7: TẠI SAO THIẾU preStop HOOK LẠI GÂY RA 50–100 REQUEST LỖI 502 BAD GATEWAY?'}
            </text>

            {[
              {
                x: 26,
                badge: 'Bước 1 (K8s)',
                title: 'Pod v2.0 Ready',
                sub: 'maxUnavailable: 0',
                desc: '/health/ready trả 200 OK x2 lần trước khi tắt Pod v1.0',
                color: '#38bdf8',
              },
              {
                x: 202,
                badge: 'Bước 2 (Network)',
                title: 'preStop: sleep 5',
                sub: 'Đợi Ingress rút IP',
                desc:
                  activeSubMode === 'modeA'
                    ? 'Ngủ 5s chờ NGINX Ingress rút sạch IP Pod v1.0 (mất 1–3s)'
                    : '❌ Thiếu preStop: Ingress chưa kịp rút IP (mất 1–3s)!',
                color: activeSubMode === 'modeA' ? '#f59e0b' : '#f43f5e',
              },
              {
                x: 378,
                badge: 'Bước 3 (PID 1)',
                title: 'dumb-init Exec Form',
                sub: 'Chuyển tiếp SIGTERM',
                desc: 'ENTRYPOINT ["dumb-init", "--"] truyền SIGTERM vào Node.js',
                color: '#a78bfa',
              },
              {
                x: 554,
                badge: 'Bước 4 (App Code)',
                title: 'server.close()',
                sub: 'Giữ sống giao dịch dở',
                desc: 'Ngừng nhận TCP mới nhưng đợi SQL thanh toán đang chạy xong',
                color: '#10b981',
              },
              {
                x: 730,
                badge: 'Bước 5 (Clean Exit)',
                title: 'dbPool.end() → Exit 0',
                sub: 'GracePeriod < 35s',
                desc: 'Đóng kết nối DB & Redis sạch sẽ, thoát mã 0 trước SIGKILL',
                color: '#10b981',
              },
            ].map((step, idx) => (
              <g key={idx}>
                <rect x={step.x} y="58" width="160" height="145" rx="10" fill="#0f172a" stroke={step.color} strokeWidth="1.8" />
                <text x={step.x + 12} y="80" fill={step.color} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {step.badge}
                </text>
                <text x={step.x + 12} y="102" fill="#ffffff" fontSize="12" fontWeight="bold">
                  {step.title}
                </text>
                <text x={step.x + 12} y="122" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
                  {step.sub}
                </text>
                <foreignObject x={step.x + 10} y="132" width="140" height="65">
                  <div className="text-[10px] leading-snug text-slate-300">
                    {step.desc}
                  </div>
                </foreignObject>
                {idx < 4 && (
                  <line
                    x1={step.x + 160}
                    y1="130"
                    x2={step.x + 176}
                    y2="130"
                    stroke={step.color}
                    strokeWidth="2.5"
                    strokeDasharray={animateFlow ? '4 2' : undefined}
                  >
                    {animateFlow && <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.7s" repeatCount="indefinite" />}
                  </line>
                )}
              </g>
            ))}

            {/* Bottom Summary Bar */}
            <rect
              x="26"
              y="216"
              width="864"
              height="36"
              rx="8"
              fill={activeSubMode === 'modeA' ? '#052e16' : '#2c0b16'}
              stroke={activeSubMode === 'modeA' ? '#10b981' : '#f43f5e'}
            />
            <text x="42" y="238" fill={activeSubMode === 'modeA' ? '#6ee7b7' : '#fda4af'} fontSize="11" fontWeight="bold" fontFamily="monospace">
              {activeSubMode === 'modeA'
                ? '✅ KẾT QUẢ: 100% Request thành công (0% lỗi 502 Bad Gateway) ngay cả khi Deploy lúc 10.000 người dùng đồng thời!'
                : '🚨 KẾT QUẢ KHI THIẾU preStop: Request bay tới trong 1–3 giây đầu đâm vào cổng HTTP đã đóng ──► LỖI 502 BAD GATEWAY!'}
            </text>
          </svg>
        )}

        {/* 10. EXPAND-AND-CONTRACT DB MIGRATION & AI REVIEW GATE */}
        {blueprintType === 'svg-expand-contract-ai-gate' && (
          <svg viewBox="0 0 920 275" className="w-full min-w-[680px] h-auto">
            {/* Top half: Expand-and-Contract 3 Phases */}
            <rect x="14" y="12" width="892" height="122" rx="10" fill="#091526" stroke="#38bdf8" />
            <text x="28" y="34" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">
              DATABASE MIGRATION KHÔNG GIÁN ĐOẠN (EXPAND-AND-CONTRACT PATTERN — 3 PHA TƯƠNG THÍCH NGƯỢC)
            </text>

            <rect x="28" y="46" width="272" height="74" rx="8" fill="#0f172a" stroke="#38bdf8" />
            <text x="40" y="66" fill="#7dd3fc" fontSize="11" fontWeight="bold">Pha 1 — Expand (Mở rộng)</text>
            <text x="40" y="84" fill="#e2e8f0" fontSize="10">Thêm cột mới cho phép NULL.</text>
            <text x="40" y="102" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace">Code v1.1 Dual-Write (Rollback 100%)</text>

            <rect x="324" y="46" width="272" height="74" rx="8" fill="#0f172a" stroke="#f59e0b" />
            <text x="336" y="66" fill="#fcd34d" fontSize="11" fontWeight="bold">Pha 2 — Backfill & Switch Read</text>
            <text x="336" y="84" fill="#e2e8f0" fontSize="10">Chạy script đồng bộ dữ liệu cũ sang mới.</text>
            <text x="336" y="102" fill="#fcd34d" fontSize="9.5" fontFamily="monospace">Code v1.2 chuyển đọc từ cột mới</text>

            <rect x="620" y="46" width="272" height="74" rx="8" fill="#0f172a" stroke="#10b981" />
            <text x="632" y="66" fill="#34d399" fontSize="11" fontWeight="bold">Pha 3 — Contract (Thu gọn)</text>
            <text x="632" y="84" fill="#e2e8f0" fontSize="10">Khi v2.0 ổn định & bỏ hẳn cột cũ:</text>
            <text x="632" y="102" fill="#fda4af" fontSize="9.5" fontFamily="monospace">Thực thi lệnh DROP COLUMN an toàn</text>

            {/* Bottom half: AI Reviewer + 3 Enterprise Approval Gates */}
            <rect x="14" y="146" width="892" height="118" rx="10" fill="#141126" stroke="#a78bfa" />
            <text x="28" y="168" fill="#c4b5fd" fontSize="11" fontWeight="bold" fontFamily="monospace">
              LUỒNG PHỐI HỢP AI REVIEWER (CODERABBIT / PR-AGENT) & 3 CHỐT PHÊ DUYỆT ĐA TẦNG (APPROVAL GATES)
            </text>

            {[
              { x: 28, title: 'AI First-Responder', sub: '.coderabbit.yaml (chill)', note: 'Bắt SQLi, N+1, thiếu CONCURRENTLY', color: '#a78bfa' },
              { x: 248, title: 'Chốt 1: CODEOWNERS', sub: '@fintech-architects / @dba', note: 'Phân quyền duyệt theo thư mục', color: '#38bdf8' },
              { x: 468, title: 'Chốt 2: QA Staging Gate', sub: 'Playwright E2E + UAT', note: 'Tạm dừng chờ QA nghiệm thu', color: '#f59e0b' },
              { x: 688, title: 'Chốt 3: Release Manager', sub: 'Protected Env + OIDC', note: 'prevent_self_review: true', color: '#10b981' },
            ].map((g, i) => (
              <g key={i}>
                <rect x={g.x} y="180" width="204" height="70" rx="8" fill="#0f172a" stroke={g.color} strokeWidth="1.6" />
                <text x={g.x + 10} y="200" fill={g.color} fontSize="10.5" fontWeight="bold">{g.title}</text>
                <text x={g.x + 10} y="218" fill="#ffffff" fontSize="9.5" fontFamily="monospace">{g.sub}</text>
                <text x={g.x + 10} y="236" fill="#94a3b8" fontSize="9">{g.note}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
};
