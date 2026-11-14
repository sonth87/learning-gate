import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { useRedisNav } from '@/features/devops-course/store';
import { REDIS_FLOW_SCENARIOS } from '../data/redisFlowsData';
import { useRedisStore } from '../store/useRedisStore';
import type { RedisFlowNode } from '../types/redis.types';
import { cn } from '@/utils/cn';

const TONE_STYLES: Record<RedisFlowNode['tone'], { active: string; idle: string; dot: string }> = {
  rose: {
    active: 'border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-500/10',
    idle: 'border-slate-800 bg-slate-900/70 opacity-75',
    dot: 'bg-rose-400',
  },
  amber: {
    active: 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10',
    idle: 'border-slate-800 bg-slate-900/70 opacity-75',
    dot: 'bg-amber-400',
  },
  emerald: {
    active: 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10',
    idle: 'border-slate-800 bg-slate-900/70 opacity-75',
    dot: 'bg-emerald-400',
  },
  sky: {
    active: 'border-sky-500 bg-sky-500/15 shadow-lg shadow-sky-500/10',
    idle: 'border-slate-800 bg-slate-900/70 opacity-75',
    dot: 'bg-sky-400',
  },
  violet: {
    active: 'border-violet-500 bg-violet-500/15 shadow-lg shadow-violet-500/10',
    idle: 'border-slate-800 bg-slate-900/70 opacity-75',
    dot: 'bg-violet-400',
  },
};

export const RedisFlowStudio: React.FC = () => {
  const { selectedFlowId, openFlowInStudio, setActiveTab } = useRedisStore();
  const goRedis = useRedisNav((s) => s.go);
  const scenario = REDIS_FLOW_SCENARIOS.find((f) => f.id === selectedFlowId) ?? REDIS_FLOW_SCENARIOS[0];

  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [scenario.id]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev + 1 >= scenario.steps.length) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 3400);
    return () => window.clearInterval(timer);
  }, [playing, scenario.steps.length]);

  const step = scenario.steps[stepIdx] ?? scenario.steps[0];
  const fromNode = scenario.nodes.find((n) => n.id === step.packetFrom);
  const toNode = scenario.nodes.find((n) => n.id === step.packetTo);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
            <Workflow className="h-3.5 w-3.5" />
            <span>REDIS ARCHITECTURE FLOW STUDIO</span>
          </div>
          <h1 className="mt-1.5 text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            Mô phỏng Từng bước 6 Luồng Kiến trúc Cốt lõi của Redis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Bấm Chạy tự động hoặc Tiến/Lùi từng nhịp để quan sát cách gói tin, khoá nguyên tử và vùng nhớ vận hành bên dưới nắp máy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab('learn');
            goRedis({ name: 'module', id: scenario.moduleRef });
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-colors cursor-pointer"
        >
          <span>Đọc bài học {scenario.moduleRef}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scenario Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {REDIS_FLOW_SCENARIOS.map((item) => {
          const active = item.id === scenario.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openFlowInStudio(item.id)}
              className={cn(
                'flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer',
                active
                  ? 'border-rose-500/60 bg-rose-500/15 shadow-sm'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  {item.badge}
                </span>
                <span className="text-[10px] text-slate-400">{item.steps.length} bước</span>
              </div>
              <div className="mt-1 text-xs sm:text-sm font-bold text-white line-clamp-2">{item.title}</div>
            </button>
          );
        })}
      </div>

      {/* Interactive Stage Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">{scenario.title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{scenario.summary}</p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(0);
              }}
              title="Đặt lại về Bước 1"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={stepIdx === 0}
              onClick={() => {
                setPlaying(false);
                setStepIdx((i) => Math.max(0, i - 1));
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trước</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (stepIdx === scenario.steps.length - 1) setStepIdx(0);
                setPlaying((p) => !p);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{playing ? 'Tạm dừng' : 'Chạy tự động'}</span>
            </button>
            <button
              type="button"
              disabled={stepIdx >= scenario.steps.length - 1}
              onClick={() => {
                setPlaying(false);
                setStepIdx((i) => Math.min(scenario.steps.length - 1, i + 1));
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <span>Tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step Timeline Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {scenario.steps.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(idx);
              }}
              className={cn(
                'rounded-xl border px-3 py-2 text-left transition-all cursor-pointer',
                idx === stepIdx
                  ? 'border-rose-500/60 bg-rose-500/15 text-white'
                  : idx < stepIdx
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="font-mono text-[10px] font-bold uppercase">
                Bước {idx + 1}/{scenario.steps.length}
              </div>
              <div className="mt-0.5 text-xs font-semibold line-clamp-1">{s.latencyBadge}</div>
            </button>
          ))}
        </div>

        {/* Visual Architecture Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenario.nodes.map((node, idx) => {
            const isActive = step.activeNodes.includes(node.id);
            const styles = TONE_STYLES[node.tone];
            return (
              <div
                key={node.id}
                className={cn(
                  'relative rounded-xl border-2 p-3.5 transition-all duration-300',
                  isActive ? styles.active : styles.idle
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    #{idx + 1} · {node.lane}
                  </span>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-transform',
                      styles.dot,
                      isActive ? 'scale-125 animate-pulse' : 'opacity-35'
                    )}
                  />
                </div>
                <div className="mt-1.5 text-sm font-extrabold text-white">{node.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-300">{node.sublabel}</div>
              </div>
            );
          })}
        </div>

        {/* Animated Packet Transfer Banner */}
        {step.packetLabel && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {fromNode?.label ?? step.packetFrom} → {toNode?.label ?? step.packetTo}:
              </span>
              <code className="rounded bg-slate-950/70 px-2 py-0.5 font-mono text-xs text-amber-300">
                {step.packetLabel}
              </code>
            </div>
            <span className="rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-rose-200">
              {step.latencyBadge}
            </span>
          </div>
        )}

        {/* Active Step Narrative + Command Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
            <div className="text-sm sm:text-base font-extrabold text-white">{step.title}</div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">{step.explanation}</p>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-400 mb-2">
              <Terminal className="h-3.5 w-3.5" />
              <span>Lệnh / Mã nguồn minh họa</span>
            </div>
            <pre className="flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
              {step.commandSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
