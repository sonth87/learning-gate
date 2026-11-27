import React, { useState } from 'react';
import { Eraser, Flame, Hourglass, Power, Rocket, Unplug, X, Zap } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import type { LiveChaosKind } from '../types';
import { WORKBENCH_I18N } from '../i18n';

export interface ActiveChaosPick {
  kind: LiveChaosKind;
  accept: ('node' | 'link')[];
  opts?: { addMs?: number; share?: number };
}

export interface ChaosToolboxProps {
  allowed: LiveChaosKind[];
  lang: WorkbenchLang;
  activePick: ActiveChaosPick | null;
  onStartPick: (pick: ActiveChaosPick | null) => void;
  lastToast?: string | null;
  compact?: boolean;
}

const CHAOS_META: Record<
  LiveChaosKind,
  {
    accept: ('node' | 'link')[];
    Icon: React.FC<{ className?: string }>;
    labelKey: 'kill' | 'slow' | 'partition' | 'expireCache' | 'hotKey' | 'badDeploy';
  }
> = {
  kill: { accept: ['node'], Icon: Power, labelKey: 'kill' },
  slow: { accept: ['node'], Icon: Hourglass, labelKey: 'slow' },
  partition: { accept: ['link'], Icon: Unplug, labelKey: 'partition' },
  'expire-cache': { accept: ['node'], Icon: Eraser, labelKey: 'expireCache' },
  'hot-key': { accept: ['node'], Icon: Flame, labelKey: 'hotKey' },
  'bad-deploy': { accept: ['node'], Icon: Rocket, labelKey: 'badDeploy' },
};

/**
 * ChaosToolbox (05 §5.5): bộ công cụ tiêm sự cố trực tiếp trên sân khấu.
 * Bấm công cụ ⇒ vào `pickMode` (click node/link mục tiêu trên stage để tiêm, Esc để hủy).
 */
export const ChaosToolbox: React.FC<ChaosToolboxProps> = ({
  allowed,
  lang,
  activePick,
  onStartPick,
  lastToast,
  compact,
}) => {
  const t = WORKBENCH_I18N[lang];
  const [open, setOpen] = useState(false);
  const [slowAddMs, setSlowAddMs] = useState<number>(200);
  const [hotShare, setHotShare] = useState<number>(0.6);

  if (!allowed || allowed.length === 0) return null;

  const handleSelectTool = (kind: LiveChaosKind) => {
    if (activePick?.kind === kind) {
      onStartPick(null);
      return;
    }
    const meta = CHAOS_META[kind];
    const opts =
      kind === 'slow'
        ? { addMs: slowAddMs }
        : kind === 'hot-key'
          ? { share: hotShare }
          : undefined;
    onStartPick({ kind, accept: meta.accept, opts });
    setOpen(false);
  };

  return (
    <div data-no-pan="true" className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t.live.chaos.title}
        aria-expanded={open}
        className={cn(
          'dts-btn-tactile inline-flex cursor-pointer items-center gap-1 rounded-xl font-mono text-[11px] font-bold',
          compact ? 'h-7 px-2' : 'h-8 px-2.5',
          activePick
            ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] font-extrabold'
            : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
        )}
      >
        <Zap className="h-3.5 w-3.5 shrink-0" />
        <span className={cn(compact && 'hidden sm:inline')}>{t.live.chaos.title}</span>
      </button>

      {activePick && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--dts-border)] bg-[var(--dts-rose-soft)] px-2.5 py-1 font-mono text-[10.5px] font-bold text-[var(--dts-rose-ink)]"
        >
          <span>{t.live.chaos.pickHint}</span>
          <button
            type="button"
            onClick={() => onStartPick(null)}
            aria-label={t.live.chaos.pickCancel}
            className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded hover:bg-black/10"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {lastToast && !activePick && (
        <span
          role="status"
          aria-live="polite"
          className="hidden md:inline-block rounded-lg bg-[var(--dts-amber-soft)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--dts-amber-ink)]"
        >
          {lastToast}
        </span>
      )}

      {open && (
        <div className="dts-card-tactile absolute right-0 top-full z-40 mt-1.5 w-64 rounded-2xl bg-[var(--dts-panel-elevated)] p-3 text-[var(--dts-ink)] shadow-xl">
          <div className="mb-2 font-mono text-[11px] font-extrabold">
            {t.live.chaos.title}
          </div>

          <div className="space-y-1.5">
            {allowed.map((kind) => {
              const meta = CHAOS_META[kind];
              if (!meta) return null;
              const { Icon } = meta;
              const active = activePick?.kind === kind;
              return (
                <div
                  key={kind}
                  className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-1.5"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectTool(kind)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 text-left font-mono text-[11px] font-bold transition-colors',
                      active
                        ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] font-extrabold'
                        : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.live.chaos[meta.labelKey]}</span>
                    </span>
                    <span className="text-[9.5px] uppercase text-[var(--dts-ink-muted)]">
                      {meta.accept.join('/')}
                    </span>
                  </button>

                  {kind === 'slow' && (
                    <div className="mt-1 flex items-center gap-1 px-1">
                      {([50, 200, 1000] as const).map((ms) => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => setSlowAddMs(ms)}
                          className={cn(
                            'flex-1 cursor-pointer rounded border py-0.5 font-mono text-[9.5px] font-bold',
                            slowAddMs === ms
                              ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                              : 'border-[var(--dts-line-strong)] text-[var(--dts-ink-muted)]'
                          )}
                        >
                          +{ms}ms
                        </button>
                      ))}
                    </div>
                  )}

                  {kind === 'hot-key' && (
                    <div className="mt-1 flex items-center gap-1 px-1">
                      {([0.3, 0.6, 0.9] as const).map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setHotShare(sh)}
                          className={cn(
                            'flex-1 cursor-pointer rounded border py-0.5 font-mono text-[9.5px] font-bold',
                            Math.abs(hotShare - sh) < 0.01
                              ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                              : 'border-[var(--dts-line-strong)] text-[var(--dts-ink-muted)]'
                          )}
                        >
                          {Math.round(sh * 100)}%
                        </button>
                      ))}
                    </div>
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
