/**
 * Adapter nối engine thuần TS (`src/features/sysdesign-course/sim/`) với `ScaleWorkbenchLayout` / `ScaleStageSvg`
 * theo `05-live-stage.md` §2.1 và ADR-005.
 *
 * `scale-workbench/*` không import file này; `SdLearnShell` truyền `liveSimAdapter` xuống `ScaleWorkbenchLayout`.
 */
import React from 'react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import type {
  BilingualText,
  LiveChaosKind,
  LiveKnobDescriptor,
  LiveLinkFrame,
  LiveMarker,
  LiveNodeFrame,
  LivePacket,
  LiveSeries,
  LiveSimAdapter,
  LiveSimFrame,
  LiveSimSession,
  LiveSimSource,
  LiveSimSpec,
  LiveTrace,
  LiveTraceSpan,
  PacketKind,
} from '@/components/scale-workbench/types';
import { WORKBENCH_I18N } from '@/components/scale-workbench/i18n';
import { formatCount } from '@/components/scale-workbench/live/liveFrameMath';
import {
  createSim,
  DT,
  nodeKey,
  traceRequest,
  type BadgeCode,
  type DistributiveOmit,
  type InputChange,
  type KnobValue,
  type Sim,
  type SimFrame,
  type SimPacketKind,
  type SimScenario,
  type TimedEvent,
} from '../sim';
import type { SdSimsMap } from '../scale/sdLessonBuilder';
import { NodeLivePanel } from './NodeLivePanel';

function badgeToBilingual(
  code: BadgeCode,
  value: number | undefined
): BilingualText {
  const viB = WORKBENCH_I18N.vi.live.badges;
  const enB = WORKBENCH_I18N.en.live.badges;
  switch (code) {
    case 'LAG':
      return {
        vi: viB.LAG(value ?? 0),
        en: enB.LAG(value ?? 0),
      };
    case 'QUEUE':
      return {
        vi: viB.QUEUE(formatCount(value ?? 0)),
        en: enB.QUEUE(formatCount(value ?? 0)),
      };
    default:
      return {
        vi: viB[code],
        en: enB[code],
      };
  }
}

/** Chuyển `SimFrame` của engine sang `LiveSimFrame` của workbench (05 §2). */
export function simFrameToLiveFrame(f: SimFrame): LiveSimFrame {
  const nodes: Record<string, LiveNodeFrame> = {};
  for (const [id, nf] of Object.entries(f.nodes)) {
    const lnf: LiveNodeFrame = {
      state: nf.state,
      loadPct: nf.loadPct,
      queuePct: nf.queuePct,
      queue: nf.queue,
      metrics: {
        rho: nf.rho,
        lambda: nf.lambda,
        served: nf.served,
        p50: nf.latency.p50,
        p95: nf.latency.p95,
        p99: nf.latency.p99,
        errorRate: nf.errorRate,
      },
    };
    if (nf.badge) {
      lnf.badge = {
        text: badgeToBilingual(nf.badge.code, nf.badge.value),
        tone: nf.badge.tone,
      };
    }
    if (typeof nf.warm === 'number') lnf.warm = nf.warm;
    if (typeof nf.lagMs === 'number') lnf.lagMs = nf.lagMs;
    if (typeof nf.hitRatio === 'number') lnf.hitPct = nf.hitRatio * 100;
    nodes[id] = lnf;
  }

  const links: Record<string, LiveLinkFrame> = {};
  for (const [id, lf] of Object.entries(f.links)) {
    const llf: LiveLinkFrame = {
      rps: lf.rps,
      throughput: lf.throughput,
      errorRate: lf.errorRate,
      style: lf.style,
    };
    if (lf.breaker) llf.breaker = lf.breaker;
    links[id] = llf;
  }

  const packets: LivePacket[] = f.packets.map((p) => ({
    id: p.id,
    linkId: p.linkId,
    kind: p.kind as PacketKind,
    reverse: p.reverse,
    progress: p.progress,
    fate: p.fate,
  }));

  const m = f.metrics;
  return {
    tick: f.tick,
    t: f.t,
    nodes,
    links,
    packets,
    packetScale: f.packetScale,
    metrics: {
      offeredRps: m.offeredRps,
      goodputRps: m.goodputRps,
      errorRate: m.errorRate,
      p50: m.latency.p50,
      p95: m.latency.p95,
      p99: m.latency.p99,
      retryRps: m.retryRps,
      amplification: m.amplification,
      queueTotal: m.queueTotal,
      inflight: m.inflight,
      costPerHour: m.costPerHour,
      costCumUsd: m.costCumUsd,
    },
  };
}

interface Subscriber {
  cb: (f: LiveSimFrame) => void;
  minIntervalMs: number;
  lastCallMs: number;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

/** Dựng một `LiveSimSession` từ `SimScenario` và `LiveSimSpec`. */
export function createLiveSimSession(
  scenario: SimScenario,
  spec: LiveSimSpec
): LiveSimSession {
  const sim: Sim = createSim(scenario);
  const startAtSec = Math.max(
    0,
    Math.min(scenario.durationSec, spec.startAtSec ?? 0)
  );
  if (startAtSec > 0) {
    sim.runUntil(startAtSec);
  }

  const getSimFrame = (): SimFrame => sim.frame() ?? sim.step();
  let currentLiveFrame: LiveSimFrame = simFrameToLiveFrame(getSimFrame());
  const subscribers = new Set<Subscriber>();
  let loadMultiplier = 1;
  const knobValues = new Map<string, KnobValue>();
  for (const n of scenario.model.nodes) {
    for (const k of n.knobs) {
      const initVal = n.params[k.key] ?? k.default;
      knobValues.set(`${n.id}:${k.key}`, initVal);
    }
  }

  const notifySubscribers = (force = false) => {
    const ts = nowMs();
    for (const sub of subscribers) {
      if (force || ts - sub.lastCallMs >= sub.minIntervalMs) {
        sub.lastCallMs = ts;
        sub.cb(currentLiveFrame);
      }
    }
  };

  const refreshFrame = (forceNotify = false) => {
    currentLiveFrame = simFrameToLiveFrame(getSimFrame());
    notifySubscribers(forceNotify);
  };

  const source: LiveSimSource = {
    getFrame() {
      return currentLiveFrame;
    },
    subscribe(cb, opts) {
      const hz = Math.max(1, Math.min(60, opts?.hz ?? 10));
      const sub: Subscriber = {
        cb,
        minIntervalMs: 1000 / hz,
        lastCallMs: -Infinity,
      };
      subscribers.add(sub);
      return () => {
        subscribers.delete(sub);
      };
    },
  };

  const applyInputAndStep = (change: InputChange) => {
    sim.setInput(change);
    if (sim.t < scenario.durationSec) {
      sim.step();
    }
    refreshFrame(true);
  };

  return {
    source,
    durationSec: scenario.durationSec,

    advanceTo(tSec: number): number {
      const clamped = Math.max(0, Math.min(scenario.durationSec, tSec));
      const targetTick = Math.round(clamped / DT);
      let ran = 0;
      while (getSimFrame().tick < targetTick && getSimFrame().t < scenario.durationSec) {
        sim.step();
        ran++;
      }
      if (ran > 0) {
        refreshFrame(false);
      }
      return ran;
    },

    getT(): number {
      return currentLiveFrame.t;
    },

    getHeadT(): number {
      const len = sim.recorder.length;
      return len <= 0 ? 0 : Math.round((len - 1) * DT * 10) / 10;
    },

    seek(tSec: number): void {
      const headT = this.getHeadT();
      const target = Math.max(0, Math.min(headT, tSec));
      sim.scrub(target);
      refreshFrame(true);
    },

    reset(): void {
      sim.reset();
      loadMultiplier = 1;
      knobValues.clear();
      for (const n of scenario.model.nodes) {
        for (const k of n.knobs) {
          knobValues.set(`${n.id}:${k.key}`, n.params[k.key] ?? k.default);
        }
      }
      if (startAtSec > 0) {
        sim.runUntil(startAtSec);
      }
      refreshFrame(true);
    },

    getLoadMultiplier(): number {
      return loadMultiplier;
    },

    setLoadMultiplier(x: number): void {
      const safe = Math.max(0.1, Math.min(10, Number(x) || 1));
      loadMultiplier = safe;
      applyInputAndStep({ type: 'load', multiplier: safe });
    },

    setKnob(node: string, key: string, value: KnobValue): void {
      knobValues.set(`${node}:${key}`, value);
      applyInputAndStep({ type: 'knob', node, key, value });
    },

    resetKnob(node: string, key: string): void {
      const nodeSpec = scenario.model.nodes.find((n) => n.id === node);
      const knobSpec = nodeSpec?.knobs.find((k) => k.key === key);
      if (!nodeSpec || !knobSpec) return;
      const defVal = nodeSpec.params[key] ?? knobSpec.default;
      knobValues.set(`${node}:${key}`, defVal);
      applyInputAndStep({ type: 'knob', node, key, value: defVal });
    },

    inject(kind: LiveChaosKind, target, opts): void {
      let ev: DistributiveOmit<TimedEvent, 'at'> | null = null;
      switch (kind) {
        case 'kill':
          if (target.node) ev = { type: 'crash', node: target.node };
          break;
        case 'slow':
          if (target.node) {
            ev = {
              type: 'slowdown',
              node: target.node,
              addMs: opts?.addMs ?? 200,
              durationSec: 20,
            };
          }
          break;
        case 'partition':
          if (target.link) ev = { type: 'partition', link: target.link };
          break;
        case 'expire-cache':
          if (target.node) ev = { type: 'cache-expire-all', node: target.node };
          break;
        case 'hot-key':
          if (target.node) {
            ev = {
              type: 'hot-key',
              node: target.node,
              share: opts?.share ?? 0.6,
              durationSec: 20,
            };
          }
          break;
        case 'bad-deploy':
          if (target.node) {
            ev = {
              type: 'deploy',
              node: target.node,
              version: 'v-bad',
              bad: true,
            };
          }
          break;
      }
      if (ev) {
        applyInputAndStep({ type: 'event', event: ev });
      }
    },

    knobs(): LiveKnobDescriptor[] {
      const out: LiveKnobDescriptor[] = [];
      for (const n of scenario.model.nodes) {
        for (const k of n.knobs) {
          if (k.live === false) continue;
          const defaultVal = n.params[k.key] ?? k.default;
          const curVal = knobValues.get(`${n.id}:${k.key}`) ?? defaultVal;
          out.push({
            node: n.id,
            key: k.key,
            label: k.label,
            type: k.type,
            min: k.min,
            max: k.max,
            step: k.step,
            unit: k.unit,
            options: k.options,
            value: curVal,
            defaultValue: defaultVal,
            changeCost: k.changeCost ?? 1,
          });
        }
      }
      return out;
    },

    series(metric: string): LiveSeries {
      const rec = sim.recorder;
      const tCol = rec.series('t');
      const len = rec.length;
      if (metric === 'queue' || metric === 'queueTotal') {
        const sum = new Float32Array(len);
        for (const n of scenario.model.nodes) {
          const qCol = rec.series(nodeKey(n.id, 'queue'));
          for (let i = 0; i < len; i++) sum[i] += qCol[i];
        }
        return { t: tCol, v: sum, length: len };
      }
      const key =
        metric === 'offeredRps'
          ? 'offered'
          : metric === 'goodputRps'
            ? 'goodput'
            : metric === 'costPerHour'
              ? 'cost'
              : metric;
      try {
        const vCol = rec.series(key);
        return { t: tCol, v: vCol, length: len };
      } catch {
        return { t: tCol, v: new Float32Array(len), length: len };
      }
    },

    nodeSeries(nodeId: string, field: 'rho' | 'p99' | 'queue' | 'lambda'): LiveSeries {
      const rec = sim.recorder;
      const tCol = rec.series('t');
      const len = rec.length;
      if (field === 'p99') {
        return { t: tCol, v: rec.series('p99'), length: len };
      }
      try {
        return {
          t: tCol,
          v: rec.series(nodeKey(nodeId, field)),
          length: len,
        };
      } catch {
        return { t: tCol, v: new Float32Array(len), length: len };
      }
    },

    markers(): LiveMarker[] {
      const out: LiveMarker[] = [];
      for (const m of sim.recorder.markers) {
        const target = m.node ?? m.link ?? '';
        out.push({
          t: m.t,
          kind: m.source === 'learner' ? 'learner' : 'event',
          nodeId: m.node,
          label: {
            vi: `${m.type}${target ? ` (${target})` : ''}`,
            en: `${m.type}${target ? ` (${target})` : ''}`,
          },
        });
      }
      for (const rec of sim.recorder.log) {
        if (rec.change.type === 'event') continue;
        const tSec = rec.tick * DT;
        const desc =
          rec.change.type === 'load'
            ? `×${rec.change.multiplier.toFixed(1)}`
            : rec.change.type === 'knob'
              ? `${rec.change.node}.${rec.change.key}=${String(rec.change.value)}`
              : rec.change.type;
        out.push({
          t: tSec,
          kind: 'learner',
          label: { vi: desc, en: desc },
        });
      }
      return out.sort((a, b) => a.t - b.t);
    },

    trace(hint): LiveTrace | null {
      const simKind: SimPacketKind | undefined =
        hint?.kind &&
        hint.kind !== 'pointer' &&
        hint.kind !== 'mutation'
          ? (hint.kind as SimPacketKind)
          : undefined;
      const raw = traceRequest(sim.compiled, getSimFrame(), {
        packetId: hint?.packetId,
        linkId: hint?.linkId,
        kind: simKind,
      });
      if (!raw) return null;

      const spans: LiveTraceSpan[] = raw.spans.map((sp, idx) => {
        const entityLabel = sp.nodeId ?? sp.linkId ?? sp.kind;
        const attemptSuffix =
          sp.attempt && sp.attempt > 1 ? ` #${sp.attempt}` : '';
        const noteSuffix =
          sp.note === 'cache-hit'
            ? ' (HIT)'
            : sp.note === 'cache-miss'
              ? ' (MISS)'
              : '';
        const text = `${entityLabel}${attemptSuffix}${noteSuffix}`;
        const isSlowest = raw.slowest.index === idx;
        return {
          id: `${idx}-${entityLabel}`,
          nodeId: sp.nodeId,
          linkId: sp.linkId,
          kind: sp.kind,
          label: { vi: text, en: text },
          startMs: sp.startMs,
          durMs: sp.durMs,
          ok: sp.ok,
          isSlowest,
          slowestSharePct: isSlowest ? raw.slowest.share * 100 : undefined,
        };
      });

      return {
        packetId: raw.packetId ?? undefined,
        packetKind: raw.kind as PacketKind,
        totalMs: raw.totalMs,
        attempts: raw.attempts,
        outcome: raw.outcome,
        spans,
      };
    },

    dispose(): void {
      subscribers.clear();
      sim.dispose();
    },
  };
}

/** Tạo `LiveSimAdapter` từ bản đồ `sims.json` đã nạp. */
export function createSdLiveSimAdapter(
  sims: SdSimsMap | null
): LiveSimAdapter {
  return {
    open(spec: LiveSimSpec): LiveSimSession | null {
      if (!sims) return null;
      const doc = sims[spec.simId];
      const scenario = doc?.scenario as SimScenario | undefined;
      if (!scenario || !scenario.model || typeof scenario.durationSec !== 'number') {
        return null;
      }
      return createLiveSimSession(scenario, spec);
    },
    renderNodeLiveSlot(session, spec, entity, lang: WorkbenchLang) {
      return React.createElement(NodeLivePanel, {
        session,
        spec,
        entity,
        lang,
      });
    },
  };
}
