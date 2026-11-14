import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  HelpCircle,
  ShieldAlert,
  Terminal,
  XCircle,
} from 'lucide-react';
import { useRedisNav } from '@/features/devops-course/store';
import { REDIS_INCIDENT_SCENARIOS } from '../data/redisIncidentsData';
import { useRedisStore } from '../store/useRedisStore';
import { cn } from '@/utils/cn';

export const RedisIncidentWarRoom: React.FC = () => {
  const { selectedIncidentId, openIncidentInWarRoom, setActiveTab } = useRedisStore();
  const goRedis = useRedisNav((s) => s.go);

  const incident =
    REDIS_INCIDENT_SCENARIOS.find((i) => i.id === selectedIncidentId) ?? REDIS_INCIDENT_SCENARIOS[0];

  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPickedOptionId(null);
    setShowHint(false);
  }, [incident.id]);

  const pickedOption = incident.options.find((o) => o.id === pickedOptionId) ?? null;
  const currentP99 = pickedOption ? pickedOption.p99AfterMs : incident.p99BeforeMs;
  const currentDbLoad = pickedOption ? pickedOption.dbLoadAfterPct : incident.dbLoadBeforePct;
  const isResolved = Boolean(pickedOption?.isCorrect);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>REDIS PRODUCTION INCIDENT WAR-ROOM ({Object.keys(resolvedIds).length}/8 ĐÃ CỨU HỘ)</span>
          </div>
          <h1 className="mt-1.5 text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            8 Tình huống Giải cứu Sự cố Redis Thực chiến lúc 2h Sáng
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Đọc log giám sát, chẩn đoán nguyên nhân gốc và chọn phương án khắc phục để kéo P99 Latency & tải Database về ngưỡng an toàn.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab('learn');
            goRedis({ name: 'module', id: incident.moduleRef });
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
        >
          <span>Ôn lý thuyết {incident.moduleRef}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Incident Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {REDIS_INCIDENT_SCENARIOS.map((item) => {
          const active = item.id === incident.id;
          const solved = resolvedIds[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openIncidentInWarRoom(item.id)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all cursor-pointer',
                active
                  ? 'border-rose-500 bg-rose-500/15 shadow-sm'
                  : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-mono text-[10px] font-bold text-rose-300">
                  {item.code} · {item.severity}
                </span>
                {solved ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                    {item.moduleRef}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs font-bold text-white line-clamp-2">{item.title}</div>
            </button>
          );
        })}
      </div>

      {/* Main War-Room Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Telemetry & Logs */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                <AlertTriangle className="h-3 w-3" />
                {incident.statusBadge}
              </span>
              <h2 className="mt-1.5 text-base font-extrabold text-white">{incident.title}</h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{incident.alertMessage}</p>

          {/* Live Gauges */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              className={cn(
                'rounded-xl border p-3 transition-colors',
                isResolved
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-rose-500/40 bg-rose-500/10'
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Activity className="h-3.5 w-3.5 text-rose-400" />
                <span>P99 Latency</span>
              </div>
              <div
                className={cn(
                  'mt-1 font-mono text-lg sm:text-xl font-extrabold',
                  isResolved ? 'text-emerald-300' : 'text-rose-300'
                )}
              >
                {currentP99} ms
              </div>
              <div className="text-[10px] text-slate-400">
                Mục tiêu SLA: &lt; 5.0 ms
              </div>
            </div>

            <div
              className={cn(
                'rounded-xl border p-3 transition-colors',
                isResolved
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-amber-500/40 bg-amber-500/10'
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span>Tải Primary DB</span>
              </div>
              <div
                className={cn(
                  'mt-1 font-mono text-lg sm:text-xl font-extrabold',
                  isResolved ? 'text-emerald-300' : 'text-amber-300'
                )}
              >
                {currentDbLoad}%
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, currentDbLoad)}%` }}
                  className={cn(
                    'h-full transition-all duration-500',
                    isResolved ? 'bg-emerald-400' : 'bg-rose-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Telemetry Log Terminal */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-slate-400">
              <Terminal className="h-3.5 w-3.5 text-rose-400" />
              <span>SLOWLOG & PRODUCTION TELEMETRY</span>
            </div>
            <div className="space-y-1 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              {incident.telemetryLogs.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Hint Toggle */}
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showHint ? 'Ẩn gợi ý chẩn đoán' : 'Xem gợi ý chẩn đoán của SRE Lead'}</span>
          </button>
          {showHint && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed">
              {incident.diagnosticHint}
            </div>
          )}
        </div>

        {/* Right: Remediation Action Choices */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Chọn hành động khắc phục trên Production:
            </h3>
            <p className="text-xs text-slate-400">
              Cẩn trọng: một số phương án "chữa cháy cảm tính" sẽ gây mất dữ liệu, Deadlock hoặc làm nổ OOM nghiêm trọng hơn!
            </p>
          </div>

          <div className="space-y-2.5">
            {incident.options.map((opt) => {
              const selected = pickedOptionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setPickedOptionId(opt.id);
                    if (opt.isCorrect) {
                      setResolvedIds((prev) => ({ ...prev, [incident.id]: true }));
                    }
                  }}
                  className={cn(
                    'w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer space-y-2',
                    selected
                      ? opt.isCorrect
                        ? 'border-emerald-500 bg-emerald-500/15'
                        : 'border-rose-500 bg-rose-500/15'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {opt.label}
                    </span>
                    {selected &&
                      (opt.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      ))}
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900/90 px-2.5 py-1.5 font-mono text-[11px] text-rose-200 whitespace-pre-wrap">
                    {opt.command}
                  </pre>
                </button>
              );
            })}
          </div>

          {pickedOption && (
            <div
              className={cn(
                'rounded-xl border p-4 space-y-2',
                pickedOption.isCorrect
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                  : 'border-rose-500/50 bg-rose-500/10 text-rose-100'
              )}
            >
              <div className="font-bold text-xs sm:text-sm">
                {pickedOption.isCorrect
                  ? 'Khắc phục thành công — Hệ thống đã ổn định xanh!'
                  : 'Phương án chưa an toàn — Sự cố vẫn tiếp diễn!'}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{pickedOption.feedback}</p>
              {pickedOption.isCorrect && (
                <div className="pt-2 border-t border-emerald-500/30 text-xs text-emerald-200">
                  <strong>Nguyên nhân gốc (Post-Mortem):</strong> {incident.rootCause}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
