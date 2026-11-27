import React, { useEffect, useState } from 'react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  pickText,
  type LiveLinkFrame,
  type LiveNodeFrame,
  type LiveSimFrame,
  type LiveSimSession,
  type LiveSimSpec,
} from '@/components/scale-workbench/types';
import { WORKBENCH_I18N } from '@/components/scale-workbench/i18n';
import {
  buildSparklinePath,
  decimateMinMax,
} from '@/components/scale-workbench/live/simTimelineMath';

export interface NodeLivePanelProps {
  session: LiveSimSession;
  spec: LiveSimSpec;
  entity: { kind: 'node' | 'link'; id: string };
  lang: WorkbenchLang;
}

/** Giải thích "Vì sao có trạng thái này?" (1–2 câu) suy trực tiếp từ số liệu của node (05 §3.6). */
export function explainNodeLiveState(
  nf: LiveNodeFrame,
  lang: WorkbenchLang
): string {
  const rho = nf.metrics?.rho ?? nf.loadPct / 100;
  const lambda = Math.round(nf.metrics?.lambda ?? 0);
  const served = Math.round(nf.metrics?.served ?? 0);
  const q = Math.round(nf.queue ?? 0);
  const p99 = Math.round(nf.metrics?.p99 ?? 0);
  const errPct = ((nf.metrics?.errorRate ?? 0) * 100).toFixed(1);

  if (lang === 'en') {
    if (nf.state === 'down') {
      return 'This node is stopped: incoming requests fail immediately until it recovers or the load balancer removes it.';
    }
    if (nf.state === 'recovering') {
      return `Warming up (${Math.round((nf.warm ?? 0) * 100)}%): effective capacity is temporarily reduced while caches and pools warm.`;
    }
    if (nf.state === 'overloaded' || rho >= 1) {
      return `ρ = ${rho.toFixed(2)} ≥ 1: arrival rate (${lambda} req/s) exceeds capacity (${served} req/s served), so queue builds up (${q} waiting) and p99 reaches ${p99} ms (${errPct}% errors).`;
    }
    if (nf.state === 'saturated' || rho >= 0.85) {
      return `ρ = ${rho.toFixed(2)} is approaching 1: queueing delay grows nonlinearly even before capacity is exceeded (p99 ≈ ${p99} ms).`;
    }
    if (nf.state === 'busy') {
      return `ρ = ${rho.toFixed(2)} (moderate load): processing ${served} req/s with p99 ≈ ${p99} ms and minimal queueing.`;
    }
    return `ρ = ${rho.toFixed(2)} (plenty of headroom): arrival rate ${lambda} req/s is well below capacity.`;
  }

  if (nf.state === 'down') {
    return 'Thành phần đang dừng hoạt động: mọi request đi tới bị từ chối cho đến khi khởi động lại hoặc Load Balancer chuyển hướng.';
  }
  if (nf.state === 'recovering') {
    return `Đang khởi động lại và làm ấm (${Math.round((nf.warm ?? 0) * 100)}%): năng lực xử lý tạm thời thấp hơn mức thiết kế.`;
  }
  if (nf.state === 'overloaded' || rho >= 1) {
    return `ρ = ${rho.toFixed(2).replace('.', ',')} ≥ 1: tải vào (${lambda} req/s) vượt năng lực phục vụ (${served} req/s) nên hàng đợi dồn (${q} request chờ), p99 tại chỗ ${p99} ms (lỗi ${errPct}%).`;
  }
  if (nf.state === 'saturated' || rho >= 0.85) {
    return `ρ = ${rho.toFixed(2).replace('.', ',')} tiến gần 1: thời gian chờ trong hàng đợi bắt đầu tăng nhanh theo đường cong phi tuyến (p99 ≈ ${p99} ms).`;
  }
  if (nf.state === 'busy') {
    return `ρ = ${rho.toFixed(2).replace('.', ',')} (đang bận): phục vụ ${served} req/s với p99 ≈ ${p99} ms, hàng đợi chưa tích lũy.`;
  }
  return `ρ = ${rho.toFixed(2).replace('.', ',')} (còn nhiều dư địa): tải vào ${lambda} req/s thấp hơn nhiều so với năng lực tối đa.`;
}

/**
 * NodeLivePanel (05 §3.6, §6): nội dung `liveSlot` trong thẻ Inspector khi người học click một node hoặc link.
 * Tự subscribe `session.source` ở 5 Hz; huỷ subscribe khi đóng thẻ.
 */
export const NodeLivePanel: React.FC<NodeLivePanelProps> = ({
  session,
  spec,
  entity,
  lang,
}) => {
  const t = WORKBENCH_I18N[lang];
  const [frame, setFrame] = useState<LiveSimFrame | null>(() =>
    session.source.getFrame()
  );

  useEffect(() => {
    setFrame(session.source.getFrame());
    return session.source.subscribe((f) => setFrame(f), { hz: 5 });
  }, [session, entity.id, entity.kind]);

  if (!frame) return null;

  if (entity.kind === 'link') {
    const lf: LiveLinkFrame | undefined = frame.links[entity.id];
    if (!lf) return null;
    return (
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">RPS</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(lf.rps).toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Goodput</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(lf.throughput).toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">ERR</div>
            <div className="font-extrabold tabular-nums">
              {(lf.errorRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nf: LiveNodeFrame | undefined = frame.nodes[entity.id];
  if (!nf) return null;

  const rho = nf.metrics?.rho ?? nf.loadPct / 100;
  const lambda = nf.metrics?.lambda ?? 0;
  const served = nf.metrics?.served ?? 0;
  const p50 = nf.metrics?.p50 ?? 0;
  const p99 = nf.metrics?.p99 ?? 0;
  const errRate = nf.metrics?.errorRate ?? 0;

  const rhoSeries = session.nodeSeries?.(entity.id, 'rho');
  const rhoDec = rhoSeries
    ? decimateMinMax(rhoSeries.t, rhoSeries.v, rhoSeries.length, 120)
    : null;
  const rhoPath =
    rhoDec && rhoDec.t.length > 1
      ? buildSparklinePath(
          rhoDec.t,
          rhoDec.v,
          session.durationSec,
          Math.max(1.2, rhoDec.maxV * 1.1),
          240,
          24,
          2
        )
      : '';

  const allowedKnobKeys = new Set(
    (spec.controls.knobs ?? [])
      .filter((k) => k.node === entity.id)
      .map((k) => k.key)
  );
  const nodeKnobs = session
    .knobs()
    .filter((k) => k.node === entity.id && allowedKnobKeys.has(k.key));

  return (
    <div className="space-y-2 font-mono text-[11px]">
      {/* State + key metrics grid */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="text-[9px] text-[var(--dts-ink-muted)]">ρ (tải)</div>
          <div
            className={cn(
              'font-extrabold tabular-nums',
              rho >= 1
                ? 'text-[#e5534b]'
                : rho >= 0.85
                  ? 'text-[#e8883a]'
                  : 'text-[var(--dts-ink)]'
            )}
          >
            {rho.toFixed(2)} ({t.live.states[nf.state]})
          </div>
        </div>

        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="text-[9px] text-[var(--dts-ink-muted)]">λ / Served</div>
          <div className="font-extrabold tabular-nums">
            {Math.round(lambda)} / {Math.round(served)}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="text-[9px] text-[var(--dts-ink-muted)]">p50 / p99</div>
          <div className="font-extrabold tabular-nums">
            {p50 < 10 ? p50.toFixed(1) : Math.round(p50)} / {Math.round(p99)} ms
          </div>
        </div>

        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="text-[9px] text-[var(--dts-ink-muted)]">
            {t.live.series.queue}
          </div>
          <div className="font-extrabold tabular-nums">
            {Math.round(nf.queue ?? 0)}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="text-[9px] text-[var(--dts-ink-muted)]">ERR</div>
          <div className="font-extrabold tabular-nums">
            {(errRate * 100).toFixed(1)}%
          </div>
        </div>

        {typeof nf.hitPct === 'number' ? (
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Hit Ratio</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(nf.hitPct)}%
            </div>
          </div>
        ) : typeof nf.lagMs === 'number' ? (
          <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
            <div className="text-[9px] text-[var(--dts-ink-muted)]">Lag</div>
            <div className="font-extrabold tabular-nums">
              {Math.round(nf.lagMs)} ms
            </div>
          </div>
        ) : null}
      </div>

      {/* Mini sparkline of rho */}
      {rhoPath && (
        <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1">
          <div className="mb-0.5 text-[9px] text-[var(--dts-ink-muted)]">
            {t.live.inspector.sparkline60s} (ρ)
          </div>
          <svg
            viewBox="0 0 240 24"
            preserveAspectRatio="none"
            className="h-6 w-full"
          >
            <path
              d={rhoPath}
              fill="none"
              stroke="#e8883a"
              strokeWidth={1.6}
            />
          </svg>
        </div>
      )}

      {/* Why this state? */}
      <div className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-2.5 py-1.5 text-[11px] leading-snug">
        <div className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--dts-ink-muted)]">
          {t.live.inspector.whyState}
        </div>
        <p className="mt-0.5 font-sans text-[11.5px] text-[var(--dts-ink)]">
          {explainNodeLiveState(nf, lang)}
        </p>
      </div>

      {/* Inline knobs if allowed for this node */}
      {nodeKnobs.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {nodeKnobs.map((k) => (
            <div
              key={k.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-1"
            >
              <span className="text-[10px] font-bold">
                {pickText(k.label, lang)}
              </span>
              {k.type === 'number' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={k.min ?? 1}
                    max={k.max ?? 100}
                    step={k.step ?? 1}
                    value={Number(k.value)}
                    onChange={(e) =>
                      session.setKnob(k.node, k.key, Number(e.target.value))
                    }
                    className="w-20 cursor-pointer accent-[var(--dts-blue-ink)]"
                  />
                  <span className="w-12 text-right font-extrabold tabular-nums">
                    {Number(k.value).toLocaleString('en-US')}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
