import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  pickText,
  type LiveMarker,
  type LiveSimFrame,
  type LiveSimSession,
  type LiveSimSpec,
} from '../types';
import { WORKBENCH_I18N } from '../i18n';
import {
  buildSparklinePath,
  clampSeekT,
  decimateMinMax,
  formatLiveMetric,
} from './simTimelineMath';

export interface SimTimelineProps {
  session: LiveSimSession;
  spec: LiveSimSpec;
  lang: WorkbenchLang;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  onTogglePlay: () => void;
  onChangeSpeed: (s: 1 | 2 | 5) => void;
  onSeek: (tSec: number) => void;
  onReset: () => void;
}

const SPARK_W = 600;
const SPARK_H = 26;

interface RowConfig {
  key: 'offered' | 'p99' | 'errorRate' | 'queue' | 'cost';
  metricKey: string;
  labelKey: 'rps' | 'p99' | 'errors' | 'queue' | 'cost';
  format: 'rps' | 'ms' | 'pct' | 'count' | 'usd-hour';
  stroke: string;
  minMaxDefault: number;
  responsiveClass?: string;
  sloMetric?: 'p99' | 'errorRate';
}

const ROWS: RowConfig[] = [
  {
    key: 'offered',
    metricKey: 'offeredRps',
    labelKey: 'rps',
    format: 'rps',
    stroke: '#3b82f6',
    minMaxDefault: 1000,
    responsiveClass: 'hidden @[480px]/timeline:flex',
  },
  {
    key: 'p99',
    metricKey: 'p99',
    labelKey: 'p99',
    format: 'ms',
    stroke: '#e8883a',
    minMaxDefault: 400,
    sloMetric: 'p99',
  },
  {
    key: 'errorRate',
    metricKey: 'errorRate',
    labelKey: 'errors',
    format: 'pct',
    stroke: '#e5534b',
    minMaxDefault: 0.2,
    sloMetric: 'errorRate',
  },
  {
    key: 'queue',
    metricKey: 'queueTotal',
    labelKey: 'queue',
    format: 'count',
    stroke: '#a855f7',
    minMaxDefault: 500,
    responsiveClass: 'hidden @[620px]/timeline:flex',
  },
  {
    key: 'cost',
    metricKey: 'costPerHour',
    labelKey: 'cost',
    format: 'usd-hour',
    stroke: '#14b8a6',
    minMaxDefault: 5,
    responsiveClass: 'hidden @[960px]/timeline:flex',
  },
];

/**
 * SimTimeline (05 §5.2): thanh tua kiểu video editor, sparkline SVG tự vẽ (cập nhật ~10 Hz qua DOM ref,
 * không setState mỗi tick), đường SLO, mốc sự kiện, vùng chưa mô phỏng, cảnh báo xem quá khứ.
 */
export const SimTimeline: React.FC<SimTimelineProps> = ({
  session,
  spec,
  lang,
  isPlaying,
  speed,
  onTogglePlay,
  onChangeSpeed,
  onSeek,
  onReset,
}) => {
  const t = WORKBENCH_I18N[lang];
  const durationSec = session.durationSec || 90;
  const startAtSec = spec.startAtSec ?? 0;

  const timeTextRef = useRef<HTMLSpanElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const unsimZoneRef = useRef<HTMLDivElement | null>(null);
  const pastBannerRef = useRef<HTMLDivElement | null>(null);

  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const dotRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const valRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const sloLineRefs = useRef<Record<string, SVGLineElement | null>>({});

  const draggingRef = useRef<{ active: boolean; wasPlaying: boolean; rafId: number; pendingT: number | null }>({
    active: false,
    wasPlaying: false,
    rafId: 0,
    pendingT: null,
  });

  const [markers, setMarkers] = useState<LiveMarker[]>(() => session.markers());

  const updateDomFromSession = useCallback(
    (frame: LiveSimFrame | null) => {
      const curT = frame ? frame.t : session.getT();
      const headT = session.getHeadT();
      const dur = Math.max(1, durationSec);

      if (timeTextRef.current) {
        const txt = t.live.time(curT, dur);
        if (timeTextRef.current.textContent !== txt) timeTextRef.current.textContent = txt;
      }

      if (sliderRef.current) {
        sliderRef.current.setAttribute('aria-valuemax', headT.toFixed(1));
        sliderRef.current.setAttribute('aria-valuenow', curT.toFixed(1));
        sliderRef.current.setAttribute('aria-valuetext', `${curT.toFixed(1)} s`);
      }

      const curPct = Math.max(0, Math.min(100, (curT / dur) * 100));
      const headPct = Math.max(0, Math.min(100, (headT / dur) * 100));

      if (playheadRef.current) {
        playheadRef.current.style.left = `${curPct.toFixed(2)}%`;
      }
      if (unsimZoneRef.current) {
        unsimZoneRef.current.style.left = `${headPct.toFixed(2)}%`;
        unsimZoneRef.current.style.width = `${Math.max(0, 100 - headPct).toFixed(2)}%`;
      }
      if (pastBannerRef.current) {
        const isPast = headT - curT > 0.25;
        pastBannerRef.current.style.display = isPast ? 'flex' : 'none';
        if (isPast) {
          pastBannerRef.current.textContent = t.live.pastWarning(curT);
        }
      }

      for (const row of ROWS) {
        const ser = session.series(row.key);
        const dec = decimateMinMax(ser.t, ser.v, ser.length, 240);
        const sloSpec = row.sloMetric ? spec.slo?.find((s) => s.metric === row.sloMetric) : undefined;
        const yMax = Math.max(
          row.minMaxDefault,
          dec.maxV * 1.12,
          sloSpec ? sloSpec.value * 1.25 : 0
        );

        const pathEl = pathRefs.current[row.key];
        if (pathEl) {
          const d = buildSparklinePath(dec.t, dec.v, dur, yMax, SPARK_W, SPARK_H, 2);
          pathEl.setAttribute('d', d);
        }

        const sloEl = sloLineRefs.current[row.key];
        if (sloEl && sloSpec) {
          const yRatio = Math.max(0, Math.min(1, sloSpec.value / yMax));
          const y = (2 + (SPARK_H - 4) * (1 - yRatio)).toFixed(1);
          sloEl.setAttribute('y1', y);
          sloEl.setAttribute('y2', y);
        }

        const curVal = frame?.metrics[row.metricKey] ?? (dec.v.length > 0 ? dec.v[dec.v.length - 1] : 0);
        const dotEl = dotRefs.current[row.key];
        if (dotEl) {
          const cx = ((curT / dur) * SPARK_W).toFixed(1);
          const yRatio = Math.max(0, Math.min(1, curVal / yMax));
          const cy = (2 + (SPARK_H - 4) * (1 - yRatio)).toFixed(1);
          dotEl.setAttribute('cx', cx);
          dotEl.setAttribute('cy', cy);
        }

        const valEl = valRefs.current[row.key];
        if (valEl) {
          const formatted = formatLiveMetric(curVal, row.format);
          if (valEl.textContent !== formatted) valEl.textContent = formatted;
        }
      }
    },
    [session, durationSec, spec.slo, t.live]
  );

  useEffect(() => {
    updateDomFromSession(session.source.getFrame());
    setMarkers(session.markers());
    let tickCount = 0;
    return session.source.subscribe(
      (f) => {
        updateDomFromSession(f);
        tickCount++;
        if (tickCount % 5 === 0) {
          const nextM = session.markers();
          setMarkers((prev) => (prev.length === nextM.length ? prev : nextM));
        }
      },
      { hz: 10 }
    );
  }, [session, updateDomFromSession]);

  const scheduleSeekFromClientX = useCallback(
    (clientX: number) => {
      const el = sliderRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetT = clampSeekT(ratio * durationSec, session.getHeadT(), durationSec);
      draggingRef.current.pendingT = targetT;
      if (!draggingRef.current.rafId) {
        draggingRef.current.rafId = requestAnimationFrame(() => {
          draggingRef.current.rafId = 0;
          const pt = draggingRef.current.pendingT;
          if (pt !== null) {
            onSeek(pt);
            updateDomFromSession(session.source.getFrame());
          }
        });
      }
    },
    [durationSec, onSeek, session, updateDomFromSession]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    draggingRef.current.active = true;
    draggingRef.current.wasPlaying = isPlaying;
    if (isPlaying) onTogglePlay();
    scheduleSeekFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current.active) return;
    scheduleSeekFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current.active) return;
    draggingRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (draggingRef.current.wasPlaying && !isPlaying) {
      onTogglePlay();
    }
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = session.getT();
    const head = session.getHeadT();
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const step = e.shiftKey ? 10 : 1;
      onSeek(clampSeekT(cur + step, head, durationSec));
      updateDomFromSession(session.source.getFrame());
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const step = e.shiftKey ? 10 : 1;
      onSeek(clampSeekT(cur - step, head, durationSec));
      updateDomFromSession(session.source.getFrame());
    } else if (e.key === 'Home') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(clampSeekT(startAtSec, head, durationSec));
      updateDomFromSession(session.source.getFrame());
    } else if (e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      onSeek(clampSeekT(head, head, durationSec));
      updateDomFromSession(session.source.getFrame());
    }
  };

  const handleJumpNextMarker = () => {
    const cur = session.getT();
    const head = session.getHeadT();
    const nextM = markers.find((m) => m.t > cur + 0.15 && m.t <= head);
    const target = nextM ? nextM.t : clampSeekT(cur + 10, head, durationSec);
    onSeek(target);
    updateDomFromSession(session.source.getFrame());
  };

  const handleJumpStart = () => {
    onSeek(clampSeekT(startAtSec, session.getHeadT(), durationSec));
    updateDomFromSession(session.source.getFrame());
  };

  const tickMarks = [0, Math.round(durationSec * 0.25), Math.round(durationSec * 0.5), Math.round(durationSec * 0.75), durationSec];

  return (
    <div
      data-no-pan="true"
      className="dts-panel @container/timeline shrink-0 rounded-2xl px-3 py-2 select-none"
    >
      {/* Top control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5">
            <button
              type="button"
              onClick={handleJumpStart}
              title={t.live.backToStart}
              aria-label={t.live.backToStart}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              title={isPlaying ? t.pause : t.play}
              aria-label={isPlaying ? t.pause : t.play}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] font-bold"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleJumpNextMarker}
              title={t.live.nextMarker}
              aria-label={t.live.nextMarker}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Speed selector 1x / 2x / 5x */}
          <div
            role="group"
            aria-label={t.live.speed}
            className="inline-flex items-center gap-0.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5 font-mono text-[11px]"
          >
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                title={t.live.playbackSpeed(s)}
                aria-pressed={speed === s}
                className={cn(
                  'h-6 min-w-[28px] cursor-pointer rounded-lg px-1.5 font-bold transition-colors',
                  speed === s
                    ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] font-extrabold'
                    : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                )}
              >
                {s}×
              </button>
            ))}
          </div>

          <span
            ref={timeTextRef}
            className="font-mono text-[11.5px] font-extrabold tabular-nums text-[var(--dts-ink)]"
          >
            {t.live.time(session.getT(), durationSec)}
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          title={t.replay}
          className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 font-mono text-[11px] font-bold text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden @[480px]/timeline:inline">{t.live.backToStart}</span>
        </button>
      </div>

      {/* Past warning banner */}
      <div
        ref={pastBannerRef}
        style={{ display: 'none' }}
        className="mb-1.5 items-center rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-amber-soft)] px-2.5 py-1 font-mono text-[10.5px] font-bold text-[var(--dts-amber-ink)]"
      />

      {/* Scrubber & Sparklines area */}
      <div className="relative flex flex-col gap-0.5">
        {ROWS.map((row) => {
          const sloSpec = row.sloMetric ? spec.slo?.find((s) => s.metric === row.sloMetric) : undefined;
          return (
            <div
              key={row.key}
              className={cn('flex items-center gap-2', row.responsiveClass ?? 'flex')}
            >
              <span className="w-9 shrink-0 font-mono text-[9.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                {t.live.series[row.labelKey]}
              </span>
              <div className="relative h-[26px] min-w-0 flex-1 overflow-hidden rounded bg-[var(--dts-panel-muted)]/60">
                <svg
                  viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                  preserveAspectRatio="none"
                  className="h-full w-full overflow-visible"
                >
                  {sloSpec && (
                    <line
                      ref={(el) => {
                        sloLineRefs.current[row.key] = el;
                      }}
                      x1={0}
                      x2={SPARK_W}
                      y1={8}
                      y2={8}
                      stroke="#e5534b"
                      strokeWidth={1}
                      strokeDasharray="4 3"
                      opacity={0.75}
                    />
                  )}
                  <path
                    ref={(el) => {
                      pathRefs.current[row.key] = el;
                    }}
                    d=""
                    fill="none"
                    stroke={row.stroke}
                    strokeWidth={1.75}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle
                    ref={(el) => {
                      dotRefs.current[row.key] = el;
                    }}
                    cx={0}
                    cy={SPARK_H - 2}
                    r={3.2}
                    fill={row.stroke}
                    stroke="var(--dts-panel)"
                    strokeWidth={1.2}
                  />
                </svg>
                {sloSpec && (
                  <span className="pointer-events-none absolute right-1.5 top-0.5 font-mono text-[8.5px] font-bold text-[#e5534b]">
                    {t.live.slo(
                      row.sloMetric === 'p99' ? 'p99' : 'ERR',
                      row.sloMetric === 'p99' ? `${sloSpec.value} ms` : `${(sloSpec.value * 100).toFixed(1)}%`
                    )}
                  </span>
                )}
              </div>
              <span
                ref={(el) => {
                  valRefs.current[row.key] = el;
                }}
                className="w-18 shrink-0 text-right font-mono text-[10.5px] font-extrabold tabular-nums text-[var(--dts-ink)]"
              >
                —
              </span>
            </div>
          );
        })}

        {/* Interactive scrub overlay covering the sparkline column */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="w-9 shrink-0" />
          <div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label={t.live.seekLabel}
            aria-valuemin={0}
            aria-valuemax={session.getHeadT()}
            aria-valuenow={session.getT()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleSliderKeyDown}
            className="relative h-6 min-w-0 flex-1 cursor-ew-resize rounded-md border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-0.5 focus:outline-2 focus:outline-[var(--dts-blue-ink)]"
          >
            {/* Unsimulated region hatch */}
            <div
              ref={unsimZoneRef}
              title={t.live.notSimulated}
              className="pointer-events-none absolute top-0 bottom-0 right-0 rounded-r-md bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(128,128,128,0.14)_4px,rgba(128,128,128,0.14)_8px)]"
            />

            {/* Time ticks */}
            <div className="pointer-events-none absolute inset-x-1.5 inset-y-0 flex items-center justify-between font-mono text-[9px] text-[var(--dts-ink-muted)]">
              {tickMarks.map((tm) => (
                <span key={tm}>{tm}s</span>
              ))}
            </div>

            {/* Event & learner markers */}
            {markers.map((m, idx) => {
              const leftPct = Math.max(0, Math.min(100, (m.t / durationSec) * 100));
              const glyph =
                m.kind === 'learner' ? '⚡' : m.kind === 'alert' ? '▲' : '◆';
              return (
                <button
                  key={`${m.t}-${idx}`}
                  type="button"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={() => {
                    onSeek(clampSeekT(m.t, session.getHeadT(), durationSec));
                    updateDomFromSession(session.source.getFrame());
                  }}
                  style={{ left: `${leftPct.toFixed(2)}%` }}
                  title={`${m.t.toFixed(1)}s — ${pickText(m.label, lang)}`}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer font-mono text-[10px] leading-none text-[var(--dts-amber-ink)] hover:scale-125"
                >
                  {glyph}
                </button>
              );
            })}

            {/* Playhead vertical cursor */}
            <div
              ref={playheadRef}
              className="pointer-events-none absolute -top-1 -bottom-1 w-[2px] -translate-x-1/2 bg-[var(--dts-ink)]"
            >
              <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-[var(--dts-panel)] bg-[var(--dts-ink)]" />
            </div>
          </div>
          <span className="w-18 shrink-0 text-right font-mono text-[9px] text-[var(--dts-ink-muted)]">
            {t.live.notSimulated}
          </span>
        </div>
      </div>
    </div>
  );
};
