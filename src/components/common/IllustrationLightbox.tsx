import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Cpu,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import {
  TechnicalDiagramCanvas,
  hasTechnicalDiagram,
} from '@/components/illustrations/diagramRegistry';
import { cn } from '@/utils/cn';

export type IllustrationAccent = 'sky' | 'cyan' | 'amber' | 'rose' | 'emerald';
export type IllustrationTone = 'sky' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';

export interface IllustrationCalloutItem {
  num?: string | number;
  label: string;
  desc: string;
  tone?: IllustrationTone;
}

export interface IllustrationFigureProps {
  src?: string;
  diagram?: string;
  alt?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  callouts?: IllustrationCalloutItem[];
  accent?: IllustrationAccent;
  renderInline?: (text: string) => React.ReactNode;
  className?: string;
}

const CALLOUT_TONES: Record<
  IllustrationTone,
  { border: string; bg: string; numCls: string; titleCls: string }
> = {
  sky: {
    border: 'border-sky-500/35',
    bg: 'bg-sky-500/[0.06]',
    numCls: 'border-sky-500/45 bg-sky-500/18 text-sky-300',
    titleCls: 'text-sky-300',
  },
  cyan: {
    border: 'border-cyan-500/35',
    bg: 'bg-cyan-500/[0.06]',
    numCls: 'border-cyan-500/45 bg-cyan-500/18 text-cyan-300',
    titleCls: 'text-cyan-300',
  },
  emerald: {
    border: 'border-emerald-500/35',
    bg: 'bg-emerald-500/[0.06]',
    numCls: 'border-emerald-500/45 bg-emerald-500/18 text-emerald-300',
    titleCls: 'text-emerald-300',
  },
  amber: {
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/[0.06]',
    numCls: 'border-amber-500/45 bg-amber-500/18 text-amber-300',
    titleCls: 'text-amber-300',
  },
  rose: {
    border: 'border-rose-500/35',
    bg: 'bg-rose-500/[0.06]',
    numCls: 'border-rose-500/45 bg-rose-500/18 text-rose-300',
    titleCls: 'text-rose-300',
  },
  violet: {
    border: 'border-violet-500/35',
    bg: 'bg-violet-500/[0.06]',
    numCls: 'border-violet-500/45 bg-violet-500/18 text-violet-300',
    titleCls: 'text-violet-300',
  },
  slate: {
    border: 'border-slate-700',
    bg: 'bg-slate-900/70',
    numCls: 'border-slate-600 bg-slate-800 text-slate-200',
    titleCls: 'text-slate-200',
  },
};

const ACCENT_UI: Record<
  IllustrationAccent,
  { eyebrow: string; badge: string; ring: string; activeTab: string }
> = {
  sky: {
    eyebrow: 'text-sky-400',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    ring: 'hover:border-sky-500/55',
    activeTab: 'border-sky-500/50 bg-sky-500/20 text-sky-300',
  },
  cyan: {
    eyebrow: 'text-cyan-400',
    badge: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
    ring: 'hover:border-cyan-500/55',
    activeTab: 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300',
  },
  amber: {
    eyebrow: 'text-amber-400',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    ring: 'hover:border-amber-500/55',
    activeTab: 'border-amber-500/50 bg-amber-500/20 text-amber-300',
  },
  rose: {
    eyebrow: 'text-rose-400',
    badge: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    ring: 'hover:border-rose-500/55',
    activeTab: 'border-rose-500/50 bg-rose-500/20 text-rose-300',
  },
  emerald: {
    eyebrow: 'text-emerald-400',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    ring: 'hover:border-emerald-500/55',
    activeTab: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300',
  },
};

type LightboxTab = 'diagram' | 'poster';

export const IllustrationLightbox: React.FC<{
  open: boolean;
  onClose: () => void;
  portalTarget: HTMLElement | null;
  src?: string;
  diagram?: string;
  initialTab: LightboxTab;
  alt?: string;
  title?: string;
  subtitle?: string;
  callouts?: IllustrationCalloutItem[];
  accent: IllustrationAccent;
  isLight: boolean;
  renderText: (t: string) => React.ReactNode;
}> = ({
  open,
  onClose,
  portalTarget,
  src,
  diagram,
  initialTab,
  alt,
  title,
  subtitle,
  callouts,
  accent,
  isLight,
  renderText,
}) => {
  const hasDiagram = hasTechnicalDiagram(diagram);
  const hasPoster = Boolean(src);
  const [tab, setTab] = useState<LightboxTab>(initialTab);
  const [zoom, setZoom] = useState<number>(1);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setZoom(1);
      requestAnimationFrame(() => dialogRef.current?.focus());
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(2.4, Number((z + 0.35).toFixed(2))));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(1, Number((z - 0.35).toFixed(2))));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener('keydown', onKeyCapture, true);
    return () => window.removeEventListener('keydown', onKeyCapture, true);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const ui = ACCENT_UI[accent];
  const target = portalTarget ?? document.body;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title || alt || 'Xem phóng to hình minh hoạ'}
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-[999] flex flex-col bg-black/85 backdrop-blur-md outline-none select-text"
    >
      {/* Top Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 px-3.5 py-2.5 sm:px-5 shrink-0"
      >
        <div className="min-w-0 flex-1">
          <div className={cn('font-mono text-[10px] font-bold uppercase tracking-wider', ui.eyebrow)}>
            Chế độ phóng to chi tiết · Nhấn Esc để đóng
          </div>
          {title && (
            <div className="truncate text-sm sm:text-base font-bold text-white">{renderText(title)}</div>
          )}
        </div>

        {hasDiagram && hasPoster && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => {
                setTab('diagram');
                setZoom(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                tab === 'diagram' ? ui.activeTab : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Giải phẫu Kỹ thuật</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('poster');
                setZoom(1);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                tab === 'poster' ? ui.activeTab : 'border-transparent text-slate-400 hover:text-white'
              )}
            >
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ẩn dụ Trực quan</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, Number((z - 0.35).toFixed(2))))}
            disabled={zoom <= 1}
            aria-label="Thu nhỏ"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center font-mono text-xs font-bold text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.4, Number((z + 0.35).toFixed(2))))}
            disabled={zoom >= 2.4}
            aria-label="Phóng to"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Đặt lại 100%"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">100%</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ phóng to"
            className="ml-1 inline-flex h-8 items-center gap-1 rounded-lg border border-rose-500/45 bg-rose-500/15 px-2.5 text-xs font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
          >
            <X className="h-4 w-4 text-rose-400" />
            <span>Đóng</span>
          </button>
        </div>
      </div>

      {/* Main Zoomable Canvas */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="flex-1 min-h-0 overflow-auto p-3 sm:p-6 flex items-center justify-center"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: zoom === 1 ? 'min(100%, 1180px)' : `${Math.round(1080 * zoom)}px`,
            maxWidth: zoom === 1 ? '1180px' : 'none',
          }}
          className="rounded-2xl border border-slate-700/90 bg-slate-950 p-3 sm:p-5 shadow-2xl transition-[width] duration-150"
        >
          {tab === 'diagram' && hasDiagram && diagram ? (
            <TechnicalDiagramCanvas diagramId={diagram} isLight={isLight} className="w-full h-auto" />
          ) : hasPoster && src ? (
            <img
              src={src}
              alt={alt || title || 'Hình minh hoạ trực quan'}
              className="mx-auto block h-auto w-full rounded-xl object-contain"
            />
          ) : null}

          {(subtitle || (callouts && callouts.length > 0)) && zoom === 1 && (
            <div className="mt-4 border-t border-slate-800 pt-3.5 space-y-2.5">
              {subtitle && <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{renderText(subtitle)}</p>}
              {callouts && callouts.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {callouts.map((c, idx) => {
                    const ct = CALLOUT_TONES[c.tone ?? accent];
                    return (
                      <div
                        key={idx}
                        className={cn('flex items-start gap-2.5 rounded-xl border p-2.5', ct.border, ct.bg)}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold',
                            ct.numCls
                          )}
                        >
                          {c.num ?? idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 text-xs leading-snug">
                          <div className={cn('font-bold', ct.titleCls)}>{renderText(c.label)}</div>
                          <div className="mt-0.5 text-slate-300">{renderText(c.desc)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    target
  );
};

export const IllustrationFigure: React.FC<IllustrationFigureProps> = ({
  src,
  diagram,
  alt,
  badge,
  title,
  subtitle,
  caption,
  callouts,
  accent = 'sky',
  renderInline,
  className,
}) => {
  const isLight = useStore((s) => s.resolvedColorScheme) === 'light';
  const rootRef = useRef<HTMLElement>(null);
  const [lightboxTab, setLightboxTab] = useState<LightboxTab | null>(null);
  const [imgError, setImgError] = useState(false);

  const hasDiagram = hasTechnicalDiagram(diagram);
  const hasPoster = Boolean(src) && !imgError;

  if (!hasDiagram && !hasPoster) return null;

  const ui = ACCENT_UI[accent];
  const renderText = (text: string): React.ReactNode => (renderInline ? renderInline(text) : text);
  const portalTarget = rootRef.current?.closest('.pylearn-root') as HTMLElement | null;

  return (
    <figure
      ref={rootRef}
      className={cn(
        'my-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5 sm:p-4 shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/90 pb-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider',
                ui.eyebrow
              )}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Hình minh hoạ trực quan</span>
            </span>
            {badge && (
              <span className={cn('rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold', ui.badge)}>
                {badge}
              </span>
            )}
          </div>
          {title && <h4 className="text-sm sm:text-base font-bold text-white leading-snug">{renderText(title)}</h4>}
          {subtitle && <p className="text-xs text-slate-400 leading-relaxed">{renderText(subtitle)}</p>}
        </div>

        <button
          type="button"
          onClick={() => setLightboxTab(hasDiagram ? 'diagram' : 'poster')}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 font-mono text-[11px] font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white cursor-pointer"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Phóng to</span>
        </button>
      </div>

      {/* Hybrid or Single Visual Stage */}
      {hasDiagram && hasPoster && diagram && src ? (
        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-stretch">
          {/* Layer 1: AI Visual Metaphor Poster */}
          <button
            type="button"
            onClick={() => setLightboxTab('poster')}
            aria-label="Phóng to poster ẩn dụ trực quan"
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-left transition-all cursor-zoom-in',
              ui.ring
            )}
          >
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <ImageIcon className="h-3 w-3" aria-hidden="true" />
                <span>Ẩn dụ trực quan</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 group-hover:text-white">
                <ZoomIn className="h-3 w-3" /> Zoom
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-950">
              <img
                src={src}
                alt={alt || title || 'Poster ẩn dụ trực quan'}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
                className="h-full max-h-[300px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
          </button>

          {/* Layer 2: Precision Vector Technical Anatomy */}
          <button
            type="button"
            onClick={() => setLightboxTab('diagram')}
            aria-label="Phóng to sơ đồ giải phẫu kỹ thuật"
            className={cn(
              'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 text-left transition-all cursor-zoom-in',
              ui.ring
            )}
          >
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Cpu className="h-3 w-3" aria-hidden="true" />
                <span>Sơ đồ giải phẫu kỹ thuật (Vector)</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 group-hover:text-white">
                <ZoomIn className="h-3 w-3" /> Zoom
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-950/90 p-1.5">
              <TechnicalDiagramCanvas diagramId={diagram} isLight={isLight} className="w-full h-auto" />
            </div>
          </button>
        </div>
      ) : hasDiagram && diagram ? (
        <button
          type="button"
          onClick={() => setLightboxTab('diagram')}
          aria-label={title ? `Phóng to sơ đồ: ${title}` : 'Phóng to sơ đồ kỹ thuật'}
          className={cn(
            'group relative block w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/65 p-2 sm:p-3 text-left transition-all cursor-zoom-in',
            ui.ring
          )}
        >
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-950/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300 opacity-80 transition-opacity group-hover:opacity-100 group-hover:text-white">
            <ZoomIn className="h-3 w-3" aria-hidden="true" />
            <span>Bấm để phóng to</span>
          </span>
          <TechnicalDiagramCanvas diagramId={diagram} isLight={isLight} className="w-full h-auto" />
        </button>
      ) : hasPoster && src ? (
        <button
          type="button"
          onClick={() => setLightboxTab('poster')}
          aria-label={alt || title || 'Phóng to hình minh hoạ'}
          className={cn(
            'group relative block w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/65 p-2 text-left transition-all cursor-zoom-in',
            ui.ring
          )}
        >
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-950/85 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-300 opacity-85 transition-opacity group-hover:opacity-100 group-hover:text-white">
            <ZoomIn className="h-3 w-3" aria-hidden="true" />
            <span>Bấm để phóng to</span>
          </span>
          <img
            src={src}
            alt={alt || title || 'Hình minh hoạ'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="mx-auto block max-h-[420px] w-full rounded-lg object-contain"
          />
        </button>
      ) : null}

      {/* Numbered Callout Cards ① ② ③ */}
      {callouts && callouts.length > 0 && (
        <div
          className={cn(
            'mt-3 grid gap-2.5',
            callouts.length === 2
              ? 'md:grid-cols-2'
              : callouts.length >= 4
                ? 'sm:grid-cols-2 xl:grid-cols-4'
                : 'md:grid-cols-3'
          )}
        >
          {callouts.map((c, idx) => {
            const ct = CALLOUT_TONES[c.tone ?? accent];
            return (
              <div
                key={idx}
                className={cn('flex items-start gap-2.5 rounded-xl border p-2.5 sm:p-3', ct.border, ct.bg)}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-extrabold',
                    ct.numCls
                  )}
                >
                  {c.num ?? idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className={cn('text-xs sm:text-[13px] font-bold leading-snug', ct.titleCls)}>
                    {renderText(c.label)}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">{renderText(c.desc)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {caption && (
        <figcaption className="mt-2.5 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
          {renderText(caption)}
        </figcaption>
      )}

      <IllustrationLightbox
        open={lightboxTab !== null}
        onClose={() => setLightboxTab(null)}
        portalTarget={portalTarget}
        src={hasPoster ? src : undefined}
        diagram={hasDiagram ? diagram : undefined}
        initialTab={lightboxTab ?? (hasDiagram ? 'diagram' : 'poster')}
        alt={alt}
        title={title}
        subtitle={subtitle}
        callouts={callouts}
        accent={accent}
        isLight={isLight}
        renderText={renderText}
      />
    </figure>
  );
};
