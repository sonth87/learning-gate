import React from 'react';
import { Activity, CheckCircle2, X, XCircle } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  pickText,
  type LiveTrace,
  type LiveTraceSpan,
} from '../types';
import { WORKBENCH_I18N } from '../i18n';

export interface RequestTracerButtonProps {
  onTraceSample: () => void;
  lang: WorkbenchLang;
  compact?: boolean;
  active?: boolean;
}

export const RequestTracerButton: React.FC<RequestTracerButtonProps> = ({
  onTraceSample,
  lang,
  compact,
  active,
}) => {
  const t = WORKBENCH_I18N[lang];
  return (
    <button
      type="button"
      onClick={onTraceSample}
      title={t.live.tracer.title}
      className={cn(
        'dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl font-mono text-[11px] font-bold',
        compact ? 'h-7 px-2' : 'h-8 px-2.5',
        active
          ? 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)] font-extrabold'
          : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
      )}
    >
      <Activity className="h-3.5 w-3.5 shrink-0" />
      <span className={cn(compact && 'hidden sm:inline')}>{t.live.tracer.trace}</span>
    </button>
  );
};

export interface RequestTracerDrawerProps {
  trace: LiveTrace | null;
  lang: WorkbenchLang;
  onClose: () => void;
}

function spanBarColor(span: LiveTraceSpan): string {
  switch (span.kind) {
    case 'net':
      return 'bg-[#64748b]';
    case 'queue':
      return 'bg-[#f2994a]';
    case 'service':
      return 'bg-[#52b788]';
    case 'retry-wait':
      return 'bg-[#94a3b8]';
    case 'timeout':
    default:
      return 'bg-[#e5534b]';
  }
}

/**
 * RequestTracerDrawer (05 §5.7): biểu đồ waterfall cho 1 request đại diện lấy mẫu từ `traceRequest` của engine.
 * Neo ở đáy stage, đóng bằng Esc hoặc nút ×, không chặn thao tác trên stage.
 */
export const RequestTracerDrawer: React.FC<RequestTracerDrawerProps> = ({
  trace,
  lang,
  onClose,
}) => {
  if (!trace) return null;
  const t = WORKBENCH_I18N[lang];
  const totalMs = Math.max(0.1, trace.totalMs);
  const isOk = trace.outcome === 'ok';

  return (
    <div
      data-no-pan="true"
      role="region"
      aria-label={t.live.tracer.title}
      className="dts-card-tactile pointer-events-auto absolute inset-x-2.5 bottom-2.5 z-30 max-h-[220px] flex flex-col overflow-hidden rounded-2xl bg-[var(--dts-panel-elevated)]/96 text-[var(--dts-ink)] shadow-xl backdrop-blur-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="font-extrabold">
            Request #{trace.packetId ?? 1}
            {trace.packetKind ? ` (${trace.packetKind})` : ''}
          </span>
          <span className="text-[var(--dts-ink-muted)]">·</span>
          <span className="font-extrabold tabular-nums">
            {t.live.tracer.total(trace.totalMs)}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold',
              isOk
                ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                : 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
            )}
          >
            {isOk ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span>{t.live.tracer.outcome[trace.outcome]}</span>
            {trace.attempts && trace.attempts > 1 && (
              <span>({t.live.tracer.retries(trace.attempts)})</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-mono text-[9.5px] text-[var(--dts-ink-muted)]">
            {t.live.tracer.representativeNote}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.live.tracer.close}
            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Waterfall spans */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1.5 space-y-1">
        {trace.spans.map((sp) => {
          const leftPct = Math.max(0, Math.min(98, (sp.startMs / totalMs) * 100));
          const widthPct = Math.max(1.5, Math.min(100 - leftPct, (sp.durMs / totalMs) * 100));
          const kindLabel =
            sp.kind === 'retry-wait'
              ? t.live.tracer.spans.retryWait
              : t.live.tracer.spans[sp.kind];

          return (
            <div
              key={sp.id}
              className={cn(
                'flex items-center gap-2 rounded-lg px-1.5 py-0.5 font-mono text-[10.5px]',
                sp.isSlowest && 'bg-[var(--dts-amber-soft)]/70 font-bold'
              )}
            >
              <span className="w-28 shrink-0 truncate text-[var(--dts-ink)]">
                {pickText(sp.label, lang)}
              </span>

              <div className="relative h-3.5 min-w-0 flex-1 rounded bg-[var(--dts-panel-muted)]">
                <div
                  style={{
                    left: `${leftPct.toFixed(1)}%`,
                    width: `${widthPct.toFixed(1)}%`,
                  }}
                  className={cn(
                    'absolute top-0.5 bottom-0.5 rounded-xs',
                    spanBarColor(sp)
                  )}
                />
              </div>

              <span className="w-16 shrink-0 text-right tabular-nums text-[var(--dts-ink)]">
                {sp.durMs >= 10 ? Math.round(sp.durMs) : sp.durMs.toFixed(1)} ms
              </span>

              <span className="w-24 shrink-0 truncate text-[9.5px] text-[var(--dts-ink-muted)]">
                {kindLabel}
              </span>

              {sp.isSlowest && typeof sp.slowestSharePct === 'number' && (
                <span className="hidden md:inline shrink-0 text-[9.5px] font-extrabold text-[var(--dts-amber-ink)]">
                  ← {t.live.tracer.slowest(sp.slowestSharePct)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
