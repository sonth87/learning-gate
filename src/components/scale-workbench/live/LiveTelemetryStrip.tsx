import React, { useEffect, useRef } from 'react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  pickText,
  type LiveMetricSpec,
  type LiveSimFrame,
  type LiveSimSource,
  type StageTelemetryItem,
} from '../types';
import { WORKBENCH_I18N } from '../i18n';
import { evalLiveMetricTone, formatLiveMetric } from './simTimelineMath';

export interface LiveTelemetryStripProps {
  source: LiveSimSource;
  specs?: LiveMetricSpec[];
  fallbackTelemetry: StageTelemetryItem[];
  lang: WorkbenchLang;
}

const DEFAULT_SPECS: LiveMetricSpec[] = [
  {
    metric: 'offeredRps',
    label: { vi: 'Lưu lượng', en: 'Traffic' },
    format: 'rps',
  },
  {
    metric: 'p99',
    label: { vi: 'Độ trễ p99', en: 'p99 Latency' },
    format: 'ms',
    tone: { warnAbove: 150, badAbove: 300 },
  },
  {
    metric: 'errorRate',
    label: { vi: 'Tỉ lệ lỗi', en: 'Error Rate' },
    format: 'pct',
    tone: { warnAbove: 0.01, badAbove: 0.05 },
  },
  {
    metric: 'costPerHour',
    label: { vi: 'Chi phí', en: 'Cost' },
    format: 'usd-hour',
  },
];

function barClassForTone(tone: 'default' | 'ok' | 'warn' | 'bad'): string {
  return tone === 'ok'
    ? 'bg-[#4caf50]'
    : tone === 'bad'
      ? 'bg-[#e5534b]'
      : tone === 'warn'
        ? 'bg-[#e8a33a]'
        : 'bg-transparent';
}

function valClassForTone(tone: 'default' | 'ok' | 'warn' | 'bad'): string {
  return tone === 'ok'
    ? 'font-mono text-[12px] font-extrabold tabular-nums leading-snug text-[#2e6b19] dark:text-[#a8e686]'
    : tone === 'bad'
      ? 'font-mono text-[12px] font-extrabold tabular-nums leading-snug text-[#b82c24] dark:text-[#fca5a5]'
      : tone === 'warn'
        ? 'font-mono text-[12px] font-extrabold tabular-nums leading-snug text-[#8a5708] dark:text-[#fde68a]'
        : 'font-mono text-[12px] font-extrabold tabular-nums leading-snug text-[var(--dts-ink)]';
}

/**
 * Dải KPI trực tiếp (05 §5.3): tự subscribe `frameSource` ở 5 Hz và ghi trực tiếp vào DOM (`textContent`/`className`)
 * để không gây re-render cho `ScaleWorkbenchLayout`.
 */
export const LiveTelemetryStrip: React.FC<LiveTelemetryStripProps> = ({
  source,
  specs,
  fallbackTelemetry,
  lang,
}) => {
  const activeSpecs = (specs && specs.length > 0 ? specs : DEFAULT_SPECS).slice(0, 4);
  const valRefs = useRef<Array<HTMLDivElement | null>>([]);
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const t = WORKBENCH_I18N[lang];

  useEffect(() => {
    const applyFrame = (f: LiveSimFrame) => {
      for (let i = 0; i < activeSpecs.length; i++) {
        const sp = activeSpecs[i];
        const raw = f.metrics[sp.metric];
        const valEl = valRefs.current[i];
        const barEl = barRefs.current[i];
        if (valEl) {
          const formatted = formatLiveMetric(raw, sp.format);
          if (valEl.textContent !== formatted) valEl.textContent = formatted;
          const tone = evalLiveMetricTone(raw, sp.tone);
          const nextCls = valClassForTone(tone);
          if (valEl.className !== nextCls) valEl.className = nextCls;
          if (barEl) {
            const nextBar = cn(
              'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r',
              barClassForTone(tone)
            );
            if (barEl.className !== nextBar) barEl.className = nextBar;
          }
        }
      }
    };

    const initial = source.getFrame();
    if (initial) applyFrame(initial);
    return source.subscribe(applyFrame, { hz: 5 });
  }, [source, activeSpecs]);

  const initialFrame = source.getFrame();

  return (
    <div
      className="flex flex-wrap items-stretch gap-1.5"
      title={t.live.disclaimer}
    >
      {activeSpecs.map((sp, idx) => {
        const fb = fallbackTelemetry[idx];
        const raw = initialFrame?.metrics[sp.metric];
        const initText =
          initialFrame !== null
            ? formatLiveMetric(raw, sp.format)
            : fb
              ? pickText(fb.value, lang)
              : '—';
        const initTone =
          initialFrame !== null
            ? evalLiveMetricTone(raw, sp.tone)
            : fb?.tone ?? 'default';

        return (
          <div
            key={sp.metric}
            className="relative flex min-w-0 flex-col rounded-[9px] border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2.5 py-1 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          >
            <span
              ref={(el) => {
                barRefs.current[idx] = el;
              }}
              className={cn(
                'absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r',
                barClassForTone(initTone)
              )}
            />
            <div className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)] leading-tight">
              {pickText(sp.label, lang)}
            </div>
            <div
              ref={(el) => {
                valRefs.current[idx] = el;
              }}
              className={valClassForTone(initTone)}
            >
              {initText}
            </div>
          </div>
        );
      })}
    </div>
  );
};
