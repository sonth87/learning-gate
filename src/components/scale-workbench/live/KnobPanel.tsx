import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  pickText,
  type LiveKnobDescriptor,
  type LiveSimSession,
} from '../types';
import { WORKBENCH_I18N } from '../i18n';

export interface KnobPanelProps {
  session: LiveSimSession;
  allowed?: { node: string; key: string }[];
  lang: WorkbenchLang;
  compact?: boolean;
}

/**
 * KnobPanel (05 §5.6): bảng chỉnh tham số trực tiếp (replicas, capacityKeys, sizeFactor, ttlSec, algorithm…).
 * Thay đổi gọi `session.setKnob` (debounce 120 ms cho slider) và có nút đặt lại giá trị gốc.
 */
export const KnobPanel: React.FC<KnobPanelProps> = ({
  session,
  allowed,
  lang,
  compact,
}) => {
  const t = WORKBENCH_I18N[lang];
  const [open, setOpen] = useState(false);
  const [, setVersion] = useState(0);
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      for (const id of Object.values(timersRef.current)) {
        window.clearTimeout(id);
      }
    };
  }, []);

  if (!allowed || allowed.length === 0) return null;

  const allowedSet = new Set(allowed.map((a) => `${a.node}:${a.key}`));
  const knobs: LiveKnobDescriptor[] = session
    .knobs()
    .filter((k) => allowedSet.has(`${k.node}:${k.key}`));

  if (knobs.length === 0) return null;

  const modifiedCount = knobs.filter(
    (k) => k.defaultValue !== undefined && k.value !== k.defaultValue
  ).length;

  const handleKnobChange = (
    k: LiveKnobDescriptor,
    val: number | string | boolean,
    debounce: boolean
  ) => {
    const id = `${k.node}:${k.key}`;
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    if (!debounce) {
      session.setKnob(k.node, k.key, val);
      setVersion((v) => v + 1);
    } else {
      timersRef.current[id] = window.setTimeout(() => {
        delete timersRef.current[id];
        session.setKnob(k.node, k.key, val);
        setVersion((v) => v + 1);
      }, 120);
    }
  };

  const handleResetKnob = (k: LiveKnobDescriptor) => {
    if (session.resetKnob) {
      session.resetKnob(k.node, k.key);
    } else if (k.defaultValue !== undefined) {
      session.setKnob(k.node, k.key, k.defaultValue);
    }
    setVersion((v) => v + 1);
  };

  return (
    <div data-no-pan="true" className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t.live.knobs.title}
        aria-expanded={open}
        className={cn(
          'dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl font-mono text-[11px] font-bold',
          compact ? 'h-7 px-2' : 'h-8 px-2.5',
          modifiedCount > 0
            ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
            : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        <span className={cn(compact && 'hidden sm:inline')}>{t.live.knobs.title}</span>
        {modifiedCount > 0 && (
          <span className="rounded-full bg-black/15 px-1.5 text-[10px]">
            {modifiedCount}
          </span>
        )}
      </button>

      {open && (
        <div className="dts-card-tactile absolute right-0 top-full z-40 mt-1.5 w-72 max-h-96 overflow-y-auto rounded-2xl bg-[var(--dts-panel-elevated)] p-3 text-[var(--dts-ink)] shadow-xl">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] font-extrabold">
            <span>{t.live.knobs.title}</span>
          </div>

          <div className="space-y-2.5">
            {knobs.map((k) => {
              const isModified =
                k.defaultValue !== undefined && k.value !== k.defaultValue;
              return (
                <div
                  key={`${k.node}:${k.key}`}
                  className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-1 font-mono text-[10.5px]">
                    <span className="font-bold text-[var(--dts-ink)]">
                      <span className="mr-1 rounded bg-[var(--dts-panel-muted)] px-1 py-0.5 text-[9.5px] text-[var(--dts-blue-ink)]">
                        {k.node}
                      </span>
                      {pickText(k.label, lang)}
                    </span>
                    {isModified && (
                      <button
                        type="button"
                        onClick={() => handleResetKnob(k)}
                        title={t.live.knobs.reset}
                        className="inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-[9.5px] text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>

                  {k.type === 'number' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={k.min ?? 1}
                        max={k.max ?? 100}
                        step={k.step ?? 1}
                        value={Number(k.value)}
                        onChange={(e) =>
                          handleKnobChange(k, Number(e.target.value), true)
                        }
                        className="min-w-0 flex-1 cursor-pointer accent-[var(--dts-blue-ink)]"
                      />
                      <span className="w-16 shrink-0 text-right font-mono text-[10.5px] font-extrabold tabular-nums">
                        {Number(k.value).toLocaleString('en-US')}
                        {k.unit ? ` ${k.unit}` : ''}
                      </span>
                    </div>
                  )}

                  {k.type === 'select' && k.options && (
                    <select
                      value={String(k.value)}
                      onChange={(e) => handleKnobChange(k, e.target.value, false)}
                      className="w-full rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 font-mono text-[11px] font-bold text-[var(--dts-ink)]"
                    >
                      {k.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {pickText(opt.label, lang)}
                        </option>
                      ))}
                    </select>
                  )}

                  {k.type === 'bool' && (
                    <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[11px]">
                      <input
                        type="checkbox"
                        checked={Boolean(k.value)}
                        onChange={(e) => handleKnobChange(k, e.target.checked, false)}
                        className="accent-[var(--dts-blue-ink)]"
                      />
                      <span>{k.value ? 'ON' : 'OFF'}</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
