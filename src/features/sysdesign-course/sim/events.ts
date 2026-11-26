/**
 * Áp sự kiện (04 §2.2) và thay đổi đầu vào của người học (04 §1 InputChange) vào state/inputs.
 * Các hàm ở đây thay đổi đối số tại chỗ (state là bản của engine, không phải bản đã checkpoint).
 */
import { DT, DT_MS, type CompiledModel, type TimedEvent } from './model';
import type { InputRecord, SimInputs, SimState } from './types';

export const RESTART_SEC = 5;
export const ROLLOUT_SEC = 10;
export const BAD_DEPLOY_FAULT = 0.4;
export const BAD_DEPLOY_ADD_MS = 150;

export function initialInputs(): SimInputs {
  return { loadMultiplier: 1, params: {}, links: {} };
}

/**
 * Gộp một InputRecord vào `inputs`. Trả về TimedEvent (at = tick·DT) nếu là chaos tiêm tức thì,
 * để engine bắn ở đúng tick đó; ngược lại trả null.
 */
export function applyInput(inputs: SimInputs, rec: InputRecord): TimedEvent | null {
  const ch = rec.change;
  switch (ch.type) {
    case 'load':
      inputs.loadMultiplier = ch.multiplier;
      return null;
    case 'load-profile':
      inputs.loadProfileOverride = { profile: ch.profile, fromTick: rec.tick };
      return null;
    case 'knob': {
      const cur = inputs.params[ch.node] ?? (inputs.params[ch.node] = {});
      cur[ch.key] = ch.value;
      return null;
    }
    case 'link': {
      const cur = inputs.links[ch.link] ?? (inputs.links[ch.link] = {});
      Object.assign(cur, ch.patch);
      return null;
    }
    case 'event':
      return { ...ch.event, at: rec.tick * DT } as TimedEvent;
  }
}

/** Gộp inputLog (đã sắp xếp theo tick) tới hết `tick` (tick ≤ k). */
export function foldInputs(log: readonly InputRecord[], tick: number): SimInputs {
  const inputs = initialInputs();
  for (const r of log) {
    if (r.tick > tick) break;
    applyInput(inputs, r);
  }
  return inputs;
}

/** Tác động của một sự kiện lên state tại tick k (04 §2.2). */
export function applyEvent(_c: CompiledModel, s: SimState, ev: TimedEvent, k: number): void {
  switch (ev.type) {
    case 'crash': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      rt.up = false;
      rt.downSinceTick = k;
      rt.queue = 0;
      rt.warmProgress = 0;
      rt.recoveringUntilTick = undefined;
      rt.cacheWarm = 0;
      rt.cacheNextExpiryTick = undefined;
      return;
    }
    case 'recover': {
      const rt = s.nodes[ev.node];
      if (!rt || (rt.up && rt.recoveringUntilTick === undefined)) return;
      rt.up = true;
      rt.downSinceTick = undefined;
      rt.recoveringUntilTick = k + Math.round((RESTART_SEC * 1000) / DT_MS);
      rt.warmProgress = 0;
      rt.queue = 0;
      rt.cacheWarm = 0;
      rt.cacheNextExpiryTick = undefined;
      return;
    }
    case 'slowdown': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      rt.slowAddMs += ev.addMs;
      if (ev.durationSec !== undefined) {
        const until = k + Math.round(ev.durationSec / DT);
        rt.slowUntilTick = rt.slowUntilTick === undefined ? until : Math.max(rt.slowUntilTick, until);
      }
      return;
    }
    case 'partition': {
      const lr = s.links[ev.link];
      if (lr) lr.partitioned = true;
      return;
    }
    case 'heal': {
      const lr = s.links[ev.link];
      if (lr) lr.partitioned = false;
      return;
    }
    case 'cache-expire-all': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      rt.cacheWarm = 0;
      rt.cacheCohort = 0;
      rt.cacheNextExpiryTick = undefined;
      return;
    }
    case 'hot-key': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      rt.hotShare = Math.min(1, Math.max(0, ev.share));
      rt.hotUntilTick = ev.durationSec !== undefined ? k + Math.round(ev.durationSec / DT) : undefined;
      return;
    }
    case 'deploy': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      const bad = ev.bad === true;
      rt.deploy = { startTick: k, endTick: k + Math.round(ROLLOUT_SEC / DT), bad, version: ev.version };
      rt.faultErrorRate = bad ? BAD_DEPLOY_FAULT : 0;
      return;
    }
    case 'rollback': {
      const rt = s.nodes[ev.node];
      if (!rt) return;
      rt.faultErrorRate = 0;
      rt.deploy = { startTick: k, endTick: k + Math.round(ROLLOUT_SEC / DT), bad: false, version: 'rollback' };
      return;
    }
  }
}
