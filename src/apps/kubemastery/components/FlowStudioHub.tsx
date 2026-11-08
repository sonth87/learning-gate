import React, { useState } from 'react';
import {
  Workflow,
  Layers,
  Network,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ANIMATED_FLOW_LIST } from '../data/animatedFlowsData';
import { useKubeStore } from '../store/useKubeStore';
import { AnimatedFlowEngine } from './AnimatedFlowEngine';
import { cn } from '@/utils/cn';

export const FlowStudioHub: React.FC = () => {
  const { selectedFlowId, openFlowInStudio } = useKubeStore();

  // Interactive Widget 1: Dockerfile Layer Cache & Multi-Stage Simulator
  const [copyOrderCorrect, setCopyOrderCorrect] = useState(true);
  const [useMultiStage, setUseMultiStage] = useState(true);
  const [changedFile, setChangedFile] = useState<'code-only' | 'package-json'>('code-only');

  // Interactive Widget 2: Live Traffic & Label Selector Simulator
  const [serviceSelector, setServiceSelector] = useState<'app=shop-web' | 'app=web-shop'>('app=shop-web');
  const [serviceTargetPort, setServiceTargetPort] = useState<3000 | 8080>(3000);
  const [pod2Ready, setPod2Ready] = useState(true);

  const isDepsCached = copyOrderCorrect && changedFile === 'code-only';
  const buildTimeSeconds = isDepsCached ? 2.1 : 245.0;
  const imageSizeMb = useMultiStage ? 58 : 890;

  const selectorMatches = serviceSelector === 'app=shop-web';
  const portMatches = serviceTargetPort === 3000;
  const isTrafficHealthy = selectorMatches && portMatches;

  return (
    <div className="mx-auto max-w-[1440px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Studio Banner */}
      <div className="rounded-2xl border border-sky-500/35 bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-slate-900 p-4 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
          <Workflow className="h-4 w-4 shrink-0" />
          <span>Phòng Lab Sơ Đồ Động & Minh Họa Luồng Hoạt Động (Visual Flow Studio)</span>
        </div>
        <h1 className="font-mono text-lg sm:text-2xl font-extrabold text-white">
          Trực Quan Hóa Luồng Hoạt Động Docker & Kubernetes Bằng Animation Tương Tác
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Thay vì học vẹt qua chữ viết khô khan, hãy quan sát trực tiếp cách các gói tin, tầng bánh Layer Cache, vòng lặp Control Loop và phác đồ bắt bệnh vận hành theo thời gian thực.
        </p>
      </div>

      {/* Flow Selector Pills */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chọn Sơ đồ Động để Quan sát Chi tiết ({ANIMATED_FLOW_LIST.length} Luồng Cốt lõi):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {ANIMATED_FLOW_LIST.map((flow, idx) => {
            const active = flow.id === selectedFlowId;
            return (
              <button
                key={flow.id}
                onClick={() => openFlowInStudio(flow.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all flex flex-col justify-between space-y-1.5',
                  active
                    ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-400/50 shadow-md'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800/70'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 border border-slate-700">
                    Flow #{idx + 1} • {flow.pdfFigureRef.split(' ')[0]} {flow.pdfFigureRef.split(' ')[1]}
                  </span>
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="text-xs font-bold text-white line-clamp-2">
                  {flow.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Animated Flow Engine */}
      <AnimatedFlowEngine flowId={selectedFlowId} />

      {/* 2 Interactive Visual Sandboxes Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sandbox 1: Interactive Dockerfile Layer Cache & Multi-Stage Visualizer */}
        <div className="rounded-2xl border border-amber-500/35 bg-slate-900/75 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Mô phỏng Tương tác 1: Các Tầng Bánh Kem (Layer Cache & Multi-stage)
                </h3>
                <p className="text-xs text-slate-400">
                  Bật/tắt thứ tự lệnh COPY để thấy vì sao đặt sai chỗ làm mất 4 phút build!
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <button
              onClick={() => setCopyOrderCorrect((v) => !v)}
              className={cn(
                'rounded-xl border p-2.5 text-left transition-all',
                copyOrderCorrect
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-rose-500/50 bg-rose-500/15 text-rose-300'
              )}
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Thứ tự lệnh COPY</div>
              <div className="font-bold mt-0.5">
                {copyOrderCorrect ? '✓ COPY package.json trước' : '✗ COPY . . ngay ở đầu'}
              </div>
            </button>

            <button
              onClick={() => setUseMultiStage((v) => !v)}
              className={cn(
                'rounded-xl border p-2.5 text-left transition-all',
                useMultiStage
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                  : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
              )}
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Kiến trúc Build</div>
              <div className="font-bold mt-0.5">
                {useMultiStage ? '✓ Multi-stage (2 tầng)' : '✗ Single-stage (Gộp chung)'}
              </div>
            </button>

            <button
              onClick={() =>
                setChangedFile((f) => (f === 'code-only' ? 'package-json' : 'code-only'))
              }
              className="rounded-xl border border-violet-500/50 bg-violet-500/15 p-2.5 text-left text-violet-300 transition-all"
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Thao tác vừa sửa</div>
              <div className="font-bold mt-0.5">
                {changedFile === 'code-only'
                  ? 'Sửa 1 dòng code server.ts'
                  : 'Cài thêm thư viện mới'}
              </div>
            </button>
          </div>

          {/* Animated Cake Layers Stack */}
          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
              <span className="text-emerald-300">Tầng 1: FROM node:20-alpine + WORKDIR</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                CACHED (0.0s)
              </span>
            </div>

            {copyOrderCorrect ? (
              <>
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 transition-all',
                    isDepsCached
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  )}
                >
                  <span>Tầng 2: COPY package*.json ./ → RUN npm ci (250MB)</span>
                  <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold">
                    {isDepsCached ? '⚡ CACHE HIT (0.0s)!' : 'REBUILD (240s)'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sky-300">
                  <span>Tầng 3: COPY . . → RUN npm run build</span>
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold">
                    CHẠY LẠI (2.1s)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-rose-300">
                  <span>Tầng 2: COPY . . (Vừa sửa 1 dòng code → Đổi mã băm!)</span>
                  <span className="rounded bg-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                    VỠ CACHE!
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-rose-300 animate-pulse">
                  <span>Tầng 3: RUN npm ci (Bị vạ lây phải tải lại 250MB!)</span>
                  <span className="rounded bg-rose-500/30 px-2 py-0.5 text-[10px] font-bold">
                    TẢI LẠI MẤT 240s!
                  </span>
                </div>
              </>
            )}

            {useMultiStage && (
              <div className="flex items-center justify-between rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-violet-300">
                <span>Stage 2 (Runner): USER node + COPY --from=builder ./dist</span>
                <span className="rounded bg-violet-500/30 px-2 py-0.5 text-[10px] font-bold">
                  PHÒNG SẠCH 58MB
                </span>
              </div>
            )}
          </div>

          {/* Metrics Comparison Footer */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <div className="text-slate-400">Thời gian Build Image:</div>
              <div
                className={cn(
                  'font-mono text-base font-extrabold mt-0.5',
                  buildTimeSeconds < 10 ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {buildTimeSeconds} giây {buildTimeSeconds < 10 ? '(Siêu tốc)' : '(Quá chậm!)'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
              <div className="text-slate-400">Dung lượng Image cuối cùng:</div>
              <div
                className={cn(
                  'font-mono text-base font-extrabold mt-0.5',
                  imageSizeMb < 100 ? 'text-sky-400' : 'text-amber-400'
                )}
              >
                {imageSizeMb} MB {imageSizeMb < 100 ? '(Chuẩn Multi-stage)' : '(Chứa cả rác!)'}
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox 2: Interactive K8s Traffic & Selector Mismatch Simulator */}
        <div className="rounded-2xl border border-emerald-500/35 bg-slate-900/75 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Mô phỏng Tương tác 2: Đường Dây Mạng Ingress → Service → Pod
                </h3>
                <p className="text-xs text-slate-400">
                  Thử đổi nhãn Selector hoặc cổng targetPort để xem vì sao Pod Running mà Web vẫn sập!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <button
              onClick={() =>
                setServiceSelector((s) =>
                  s === 'app=shop-web' ? 'app=web-shop' : 'app=shop-web'
                )
              }
              className={cn(
                'rounded-xl border p-2.5 text-left transition-all',
                selectorMatches
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-rose-500/50 bg-rose-500/15 text-rose-300'
              )}
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Service Selector</div>
              <div className="font-mono font-bold mt-0.5">{serviceSelector}</div>
            </button>

            <button
              onClick={() => setServiceTargetPort((p) => (p === 3000 ? 8080 : 3000))}
              className={cn(
                'rounded-xl border p-2.5 text-left transition-all',
                portMatches
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                  : 'border-rose-500/50 bg-rose-500/15 text-rose-300'
              )}
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Service targetPort</div>
              <div className="font-mono font-bold mt-0.5">targetPort: {serviceTargetPort}</div>
            </button>

            <button
              onClick={() => setPod2Ready((r) => !r)}
              className={cn(
                'rounded-xl border p-2.5 text-left transition-all',
                pod2Ready
                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                  : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
              )}
            >
              <div className="font-mono text-[10px] uppercase opacity-80">Readiness Pod #2</div>
              <div className="font-bold mt-0.5">
                {pod2Ready ? '✓ Pod #2 Sẵn sàng' : '⚠ Pod #2 Đang bận DB'}
              </div>
            </button>
          </div>

          {/* Live Network Routing Diagram */}
          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              <span className="text-amber-300">1. Khách hàng (https://shop.com) → Ingress:80</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span
                className={cn(
                  'font-bold',
                  isTrafficHealthy ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                2. Service ({serviceSelector} | :{serviceTargetPort})
              </span>
            </div>

            {/* Endpoints Output Preview */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px]">
              <div className="text-slate-400">$ kubectl get endpoints web-app-service</div>
              {selectorMatches ? (
                <div className="text-emerald-300 font-bold mt-0.5">
                  ENDPOINTS: 10.244.1.12:{serviceTargetPort}
                  {pod2Ready ? `, 10.244.2.15:${serviceTargetPort}` : ' (Pod #2 tạm rút tên do Readiness=False)'}
                </div>
              ) : (
                <div className="text-rose-400 font-bold mt-0.5 animate-pulse">
                  ENDPOINTS: &lt;none&gt; (Lệch nhãn! Service tìm "{serviceSelector}" nhưng Pod dán "app=shop-web")
                </div>
              )}
            </div>

            {/* Pods Target Boxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={cn(
                  'rounded-lg border p-2.5',
                  isTrafficHealthy
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/50 opacity-60'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Pod #1 (10.244.1.12)</span>
                  <span className="text-[10px] text-emerald-400">Ready</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  label: <span className="text-sky-300">app=shop-web</span> | port:{' '}
                  <span className="text-amber-300">3000</span>
                </div>
              </div>

              <div
                className={cn(
                  'rounded-lg border p-2.5',
                  isTrafficHealthy && pod2Ready
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-amber-500/40 bg-amber-500/10 opacity-75'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Pod #2 (10.244.2.15)</span>
                  <span
                    className={cn(
                      'text-[10px]',
                      pod2Ready ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  >
                    {pod2Ready ? 'Ready' : 'NotReady (Bận)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  label: <span className="text-sky-300">app=shop-web</span> | port:{' '}
                  <span className="text-amber-300">3000</span>
                </div>
              </div>
            </div>
          </div>

          {/* HTTP Response Status Callout */}
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border p-3 text-xs',
              isTrafficHealthy
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            )}
          >
            {isTrafficHealthy ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>HTTP 200 OK:</strong> Luồng mạng thông suốt từ Ingress → Service → Cổng 3000 của{' '}
                  {pod2Ready ? 'cả 2 Pod!' : 'Pod #1 (Pod #2 được Readiness Probe bảo vệ tạm ngưng nhận khách).'}
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>
                  <strong>HTTP 502 Bad Gateway / Connection Refused:</strong>{' '}
                  {!selectorMatches
                    ? 'Danh bạ Endpoints trống rỗng (<none>) do lệch nhãn Selector!'
                    : 'Tổng đài Service gõ nhầm vào cổng 8080 đang đóng kín (Container thực tế mở cổng 3000)!'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
