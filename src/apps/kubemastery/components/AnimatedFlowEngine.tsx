import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  Workflow,
  Terminal,
  Info,
  Maximize2,
  ArrowRight,
  ArrowDown,
  Layers,
  Activity,
} from 'lucide-react';
import { ANIMATED_FLOWS_DATA } from '../data/animatedFlowsData';
import { AnimatedFlowType } from '../types/kube.types';
import { cn } from '@/utils/cn';

const COLOR_STYLES = {
  sky: {
    border: 'border-sky-500/45',
    bg: 'bg-sky-500/10',
    activeRing: 'ring-2 ring-sky-400 shadow-lg shadow-sky-500/20',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    text: 'text-sky-300',
    hex: '#38bdf8',
  },
  emerald: {
    border: 'border-emerald-500/45',
    bg: 'bg-emerald-500/10',
    activeRing: 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    text: 'text-emerald-300',
    hex: '#10b981',
  },
  amber: {
    border: 'border-amber-500/45',
    bg: 'bg-amber-500/10',
    activeRing: 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    text: 'text-amber-300',
    hex: '#f59e0b',
  },
  violet: {
    border: 'border-violet-500/45',
    bg: 'bg-violet-500/10',
    activeRing: 'ring-2 ring-violet-400 shadow-lg shadow-violet-500/20',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    text: 'text-violet-300',
    hex: '#a855f7',
  },
  rose: {
    border: 'border-rose-500/45',
    bg: 'bg-rose-500/10',
    activeRing: 'ring-2 ring-rose-400 shadow-lg shadow-rose-500/20',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    text: 'text-rose-300',
    hex: '#f43f5e',
  },
  cyan: {
    border: 'border-cyan-500/45',
    bg: 'bg-cyan-500/10',
    activeRing: 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    text: 'text-cyan-300',
    hex: '#22d3ee',
  },
};

interface AnimatedFlowEngineProps {
  flowId: AnimatedFlowType;
  compact?: boolean;
  onOpenFullStudio?: (flowId: AnimatedFlowType) => void;
}

export const AnimatedFlowEngine: React.FC<AnimatedFlowEngineProps> = ({
  flowId,
  compact = false,
  onOpenFullStudio,
}) => {
  const flow = ANIMATED_FLOWS_DATA[flowId];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState<number>(3600);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    flow?.nodes[0]?.id || ''
  );

  useEffect(() => {
    setCurrentStepIdx(0);
    setSelectedNodeId(flow?.nodes[0]?.id || '');
  }, [flowId, flow]);

  useEffect(() => {
    if (!isPlaying || !flow) return;
    const timer = window.setInterval(() => {
      setCurrentStepIdx((prev) => {
        const next = (prev + 1) % flow.steps.length;
        const firstActiveNode = flow.steps[next]?.activeNodeIds[0];
        if (firstActiveNode) {
          setSelectedNodeId(firstActiveNode);
        }
        return next;
      });
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speedMs, flow]);

  if (!flow) return null;

  const activeStep = flow.steps[currentStepIdx] || flow.steps[0];
  const inspectedNode =
    flow.nodes.find((n) => n.id === selectedNodeId) || flow.nodes[0];

  const handleSelectStep = (idx: number) => {
    setIsPlaying(false);
    setCurrentStepIdx(idx);
    const firstNode = flow.steps[idx]?.activeNodeIds[0];
    if (firstNode) setSelectedNodeId(firstNode);
  };

  return (
    <div className="rounded-2xl border border-sky-500/35 bg-slate-900/80 p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-lg">
      {/* Top Header & Animation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5 sm:pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-sky-300">
              <Workflow className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span>SƠ ĐỒ ĐỘNG (LIVE FLOW)</span>
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-amber-300 border border-slate-700">
              {flow.pdfFigureRef}
            </span>
          </div>
          <h3 className="text-sm sm:text-lg font-extrabold text-white leading-snug">
            {flow.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {flow.subtitle}
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={() =>
              handleSelectStep(
                (currentStepIdx - 1 + flow.steps.length) % flow.steps.length
              )
            }
            title="Bước trước"
            aria-label="Bước trước"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer',
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Chạy Animation</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              handleSelectStep((currentStepIdx + 1) % flow.steps.length)
            }
            title="Bước tiếp theo"
            aria-label="Bước tiếp theo"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <select
            aria-label="Tốc độ Animation"
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2 font-mono text-[11px] text-slate-300"
          >
            <option value={5000}>0.7x (Chậm)</option>
            <option value={3600}>1.0x (Chuẩn)</option>
            <option value={2200}>1.6x (Nhanh)</option>
          </select>

          {compact && onOpenFullStudio && (
            <button
              onClick={() => onOpenFullStudio(flow.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/25 transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Phòng Lab Sơ đồ</span>
              <span className="sm:hidden">Mở Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Animated Canvas Container */}
      <div className="ide-dark-surface relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4 space-y-3.5 sm:space-y-4">
        {/* Top Live Status Telemetry Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/90 pb-3">
          <div className="flex items-start sm:items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 mt-1 sm:mt-0 shrink-0">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  isPlaying ? 'animate-ping bg-emerald-400' : 'bg-amber-400'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2.5 w-2.5 rounded-full',
                  isPlaying ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 leading-snug">
              BƯỚC {activeStep.stepNumber}/{flow.steps.length}:{' '}
              {activeStep.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] text-sky-300">
              Actor: {activeStep.actor}
            </span>
            {activeStep.highlightBadge && (
              <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-300">
                {activeStep.highlightBadge}
              </span>
            )}
          </div>
        </div>

        {/* ============================================================
            1. MOBILE VERTICAL ANIMATED PIPELINE (< md)
            Crisp, readable, touch-friendly vertical flow with live animated
            connector pulses and packet transfer badges between steps!
           ============================================================ */}
        <div className="md:hidden space-y-1.5 py-1">
          {flow.nodes.map((node, idx) => {
            const c = COLOR_STYLES[node.color] || COLOR_STYLES.sky;
            const isNodeActive = activeStep.activeNodeIds.includes(node.id);
            const isSelected = selectedNodeId === node.id;
            const nextNode = flow.nodes[idx + 1];
            const isLinkActive =
              nextNode &&
              activeStep.activeNodeIds.includes(node.id) &&
              activeStep.activeNodeIds.includes(nextNode.id);

            return (
              <React.Fragment key={node.id}>
                <button
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    'w-full rounded-xl border p-2.5 text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer',
                    c.border,
                    c.bg,
                    isNodeActive && c.activeRing,
                    isSelected && 'border-white/70',
                    !isNodeActive && !isSelected && 'opacity-75'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold',
                        isNodeActive
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      )}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className={cn('text-xs font-bold truncate', c.text)}>
                        {node.label.replace(/^\d+\.\s*/, '')}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">
                        {node.sublabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                        c.badge
                      )}
                    >
                      {node.analogyLabel}
                    </span>
                    {isNodeActive && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    )}
                  </div>
                </button>

                {/* Vertical Connector Line + Animated Packet Badge between Nodes */}
                {nextNode && (
                  <div className="flex items-center gap-2 pl-5 py-0.5">
                    <div
                      className={cn(
                        'w-0.5 h-5 rounded-full transition-colors',
                        isLinkActive
                          ? 'bg-emerald-400 shadow-xs shadow-emerald-400'
                          : 'bg-slate-800'
                      )}
                    />
                    <ArrowDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform',
                        isLinkActive
                          ? 'text-emerald-400 animate-bounce'
                          : 'text-slate-600'
                      )}
                    />
                    {isLinkActive && activeStep.packetPath && (
                      <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300 truncate">
                        ⚡ {activeStep.packetPath.label}
                      </span>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ============================================================
            2. TABLET & DESKTOP HORIZONTAL SVG HIGHWAY (md+)
           ============================================================ */}
        <div className="hidden md:block relative py-2 overflow-x-auto">
          <svg
            viewBox="0 0 920 135"
            className="w-full min-w-[680px] h-32 select-none"
            aria-label={flow.title}
          >
            <defs>
              <linearGradient
                id={`grad-${flow.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.25" />
              </linearGradient>
              <filter
                id="glow-orb"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Lines */}
            <line
              x1="20"
              y1="68"
              x2="900"
              y2="68"
              stroke="#1e293b"
              strokeWidth="3"
              strokeDasharray="6 6"
            />

            {/* Dynamic Connecting Lines & Animated Flowing Particles between Nodes */}
            {flow.nodes.map((node, idx) => {
              if (idx >= flow.nodes.length - 1) return null;
              const nextNode = flow.nodes[idx + 1];
              const total = flow.nodes.length;
              const spacing = 840 / Math.max(1, total - 1);
              const x1 = 40 + idx * spacing;
              const x2 = 40 + (idx + 1) * spacing;
              const isLinkActive =
                activeStep.activeNodeIds.includes(node.id) &&
                activeStep.activeNodeIds.includes(nextNode.id);

              return (
                <g key={`${node.id}-${nextNode.id}`}>
                  <line
                    x1={x1}
                    y1="68"
                    x2={x2}
                    y2="68"
                    stroke={isLinkActive ? '#10b981' : '#334155'}
                    strokeWidth={isLinkActive ? '4' : '2'}
                  />
                  {isLinkActive && (
                    <>
                      <circle r="6" fill="#34d399" filter="url(#glow-orb)">
                        <animate
                          attributeName="cx"
                          from={x1}
                          to={x2}
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          from="68"
                          to="68"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="4" fill="#38bdf8" filter="url(#glow-orb)">
                        <animate
                          attributeName="cx"
                          from={x1}
                          to={x2}
                          begin="0.6s"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          from="68"
                          to="68"
                          begin="0.6s"
                          dur="1.2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                </g>
              );
            })}

            {/* SVG Nodes */}
            {flow.nodes.map((node, idx) => {
              const total = flow.nodes.length;
              const spacing = 840 / Math.max(1, total - 1);
              const cx = 40 + idx * spacing;
              const isNodeActive = activeStep.activeNodeIds.includes(node.id);
              const isNodeSelected = selectedNodeId === node.id;
              const colorHex = COLOR_STYLES[node.color]?.hex || '#38bdf8';

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer"
                >
                  {isNodeActive && (
                    <circle
                      cx={cx}
                      cy="68"
                      r="28"
                      fill="none"
                      stroke={colorHex}
                      strokeWidth="2"
                      opacity="0.6"
                    >
                      <animate
                        attributeName="r"
                        values="22;33;22"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0.15;0.8"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  <circle
                    cx={cx}
                    cy="68"
                    r={isNodeActive ? '22' : '18'}
                    fill={isNodeActive ? '#0f172a' : '#020617'}
                    stroke={colorHex}
                    strokeWidth={isNodeActive || isNodeSelected ? '3.5' : '2'}
                  />

                  <text
                    x={cx}
                    y="73"
                    textAnchor="middle"
                    fill={isNodeActive ? '#ffffff' : '#94a3b8'}
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    #{idx + 1}
                  </text>

                  <text
                    x={cx}
                    y="24"
                    textAnchor="middle"
                    fill={isNodeActive ? colorHex : '#cbd5e1'}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {node.label.replace(/^\d+\.\s*/, '').slice(0, 22)}
                  </text>

                  <text
                    x={cx}
                    y="116"
                    textAnchor="middle"
                    fill={isNodeActive ? '#fcd34d' : '#64748b'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {node.analogyLabel.slice(0, 24)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Packet Transfer Live Banner */}
        {activeStep.packetPath && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-bounce shrink-0" />
            <span className="font-mono text-slate-300">Luồng tín hiệu:</span>
            <span className="font-mono font-bold text-sky-300">
              {flow.nodes.find((n) => n.id === activeStep.packetPath?.from)
                ?.label || activeStep.packetPath.from}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-300 border border-emerald-500/40">
              {activeStep.packetPath.label}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-bold text-amber-300">
              {flow.nodes.find((n) => n.id === activeStep.packetPath?.to)
                ?.label || activeStep.packetPath.to}
            </span>
          </div>
        )}

        {/* Active Step Command & Explanation Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 font-mono text-xs text-amber-300 min-w-0">
              <Terminal className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5 sm:mt-0" />
              <code className="font-bold break-all sm:break-normal">
                {activeStep.commandOrEvent}
              </code>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {flow.steps.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  onClick={() => handleSelectStep(idx)}
                  className={cn(
                    'h-7 px-2.5 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer shrink-0',
                    idx === currentStepIdx
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  B{s.stepNumber}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {activeStep.description}
          </p>
        </div>
      </div>

      {/* Interactive Node Cards Grid (Desktop/Tablet md+ & Deep Dive Inspector for All Screens) */}
      <div className="space-y-2.5">
        <div className="hidden md:flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>
              Các Thành phần trong Luồng (Chạm vào từng khối để xem giải thích &
              liên tưởng):
            </span>
          </span>
        </div>

        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {flow.nodes.map((node) => {
            const c = COLOR_STYLES[node.color] || COLOR_STYLES.sky;
            const isInActiveStep = activeStep.activeNodeIds.includes(node.id);
            const isSelected = selectedNodeId === node.id;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer',
                  c.border,
                  c.bg,
                  isInActiveStep && c.activeRing,
                  isSelected && 'border-white/70',
                  !isInActiveStep &&
                    !isSelected &&
                    'opacity-75 hover:opacity-100'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                        c.badge
                      )}
                    >
                      {node.analogyLabel}
                    </span>
                    {isInActiveStep && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <h4 className={cn('text-xs font-bold leading-snug', c.text)}>
                    {node.label}
                  </h4>
                  <p className="font-mono text-[11px] text-slate-300">
                    {node.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Node Deep Dive Inspector (Visible on Mobile & Desktop) */}
        {inspectedNode && (
          <div className="rounded-xl border border-emerald-500/35 bg-slate-950/90 p-3 sm:p-3.5 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span>
                  Giải mã [{inspectedNode.label}] — Liên tưởng:{' '}
                  <span className="text-amber-300">
                    {inspectedNode.analogyLabel}
                  </span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {inspectedNode.sublabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed sm:pl-6">
              {inspectedNode.details}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Takeaway Callout */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 sm:px-3.5 py-2.5 text-xs text-slate-200">
        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-bold">
            Đúc kết Thực chiến:{' '}
          </strong>
          {flow.interactiveTakeaway}
        </div>
      </div>
    </div>
  );
};
