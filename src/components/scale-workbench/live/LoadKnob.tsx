import React, { useEffect, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import type { LiveSimFrame, LiveSimSession } from '../types';
import { WORKBENCH_I18N } from '../i18n';

export interface LoadKnobProps {
  session: LiveSimSession;
  lang: WorkbenchLang;
  compact?: boolean;
}

const QUICK_MULTS = [0.5, 1, 2, 5] as const;

/** Đổi hệ số nhân [0.1 .. 10] sang vị trí slider tuyến tính [-1 .. 1] (log10). */
export function multToLogSlider(mult: number): number {
  const clamped = Math.max(0.1, Math.min(10, mult));
  return Math.log10(clamped);
}

/** Đổi vị trí slider [-1 .. 1] sang hệ số nhân [0.1 .. 10]. */
export function logSliderToMult(val: number): number {
  const raw = Math.pow(10, Math.max(-1, Math.min(1, val)));
  return Math.round(raw * 100) / 100;
}

/**
 * LoadKnob (05 §5.4): điều chỉnh hệ số tải ×0.1..×10 (thang logarit) + 4 nút chọn nhanh,
 * debounce 80 ms khi kéo slider, hiển thị RPS hiện tại qua DOM ref (không re-render cha).
 */
export const LoadKnob: React.FC<LoadKnobProps> = ({ session, lang, compact }) => {
  const t = WORKBENCH_I18N[lang];
  const [mult, setMult] = useState<number>(() => session.getLoadMultiplier?.() ?? 1);
  const [open, setOpen] = useState(false);
  const rpsRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setMult(session.getLoadMultiplier?.() ?? 1);
  }, [session]);

  useEffect(() => {
    const updateRps = (f: LiveSimFrame | null) => {
      if (!rpsRef.current || !f) return;
      const rps = f.metrics.offeredRps ?? 0;
      const txt = t.live.load.current(rps);
      if (rpsRef.current.textContent !== txt) rpsRef.current.textContent = txt;
    };
    updateRps(session.source.getFrame());
    return session.source.subscribe((f) => updateRps(f), { hz: 5 });
  }, [session, t.live.load]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const applyMultiplier = (next: number, immediate = false) => {
    setMult(next);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (immediate) {
      session.setLoadMultiplier(next);
    } else {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        session.setLoadMultiplier(next);
      }, 80);
    }
  };

  return (
    <div data-no-pan="true" className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t.live.load.title}
        aria-expanded={open}
        className={cn(
          'dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl font-mono text-[11px] font-bold',
          compact ? 'h-7 px-2' : 'h-8 px-2.5',
          mult !== 1
            ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] font-extrabold'
            : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
        )}
      >
        <Gauge className="h-3.5 w-3.5 shrink-0" />
        <span>×{mult >= 1 ? mult.toFixed(mult % 1 === 0 ? 0 : 1) : mult.toFixed(2)}</span>
      </button>

      {open && (
        <div className="dts-card-tactile absolute right-0 top-full z-40 mt-1.5 w-64 rounded-2xl bg-[var(--dts-panel-elevated)] p-3 text-[var(--dts-ink)] shadow-xl">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] font-extrabold">
            <span>{t.live.load.title}</span>
            <span className="rounded bg-[var(--dts-blue-bg)] px-1.5 py-0.5 text-[var(--dts-blue-ink)]">
              ×{mult.toFixed(2)}
            </span>
          </div>

          <input
            type="range"
            min={-1}
            max={1}
            step={0.02}
            value={multToLogSlider(mult)}
            aria-label={t.live.load.multiplier}
            onChange={(e) => applyMultiplier(logSliderToMult( Number(e.target.value) ), false)}
            className="w-full cursor-pointer accent-[var(--dts-blue-ink)]"
          />

          <div className="mt-2 flex items-center justify-between gap-1">
            {QUICK_MULTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => applyMultiplier(q, true)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg border py-1 font-mono text-[10.5px] font-bold transition-colors',
                  Math.abs(mult - q) < 0.03
                    ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
                    : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                )}
              >
                ×{q}
              </button>
            ))}
          </div>

          <div
            ref={rpsRef}
            className="mt-2 border-t border-[var(--dts-border-soft)] pt-1.5 font-mono text-[10.5px] text-[var(--dts-ink-muted)]"
          >
            {t.live.load.current(session.source.getFrame()?.metrics.offeredRps ?? 0)}
          </div>
        </div>
      )}
    </div>
  );
};
