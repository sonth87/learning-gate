/** Fixtures nhỏ cho sim.test.ts (04 §9.4): S1-03 + vài scenario tối giản. */
import { makeNode } from '../../primitives';
import type { LinkSpec, LoadProfile, NodeSpec, SimScenario, SystemModel, TimedEvent } from '../../model';

export const NOISELESS = { noise: false, maxPackets: 0 } as const;

let uid = 0;
export function link(from: string, to: string, over: Partial<LinkSpec> = {}): LinkSpec {
  return { id: over.id ?? `${from}-${to}${over.carries ? '-' + over.carries : ''}`, from, to, mode: 'sync', netClass: 'same-az', ...over };
}

export function scenario(
  id: string, nodes: NodeSpec[], links: LinkSpec[], load: LoadProfile, over: Partial<Omit<SimScenario, 'model'>> = {},
  routes?: SystemModel['routes'],
): SimScenario {
  uid++;
  return {
    id, durationSec: 60, load, events: [],
    seed: 1000 + uid, mix: { readRatio: 0.9 }, clientTimeoutMs: 3000, options: { ...NOISELESS }, ...over,
    model: { nodes, links, routes },
  };
}

const client = () => makeNode('client', { id: 'client', zone: 'internet' });

/** client → node đơn (μ, S). */
export function singleNode(opsPerSec: number, baseMs: number, load: LoadProfile, over: Partial<Omit<SimScenario, 'model'>> = {}, linkOver: Partial<LinkSpec> = {}): SimScenario {
  return scenario('single', [
    client(),
    makeNode('service', { id: 'node', opsPerSec, baseMs, cv: 0.3, zone: 'internet' }),
  ], [link('client', 'node', { netMs: 0, ...linkOver })], load, { mix: { readRatio: 1 }, ...over });
}

/** S1-03 "Data Flow & Bottlenecks" (04 §10). */
export function s103(over: Partial<Omit<SimScenario, 'model'>> = {}, tweak?: (n: Record<string, NodeSpec>) => void): SimScenario {
  const nodes: Record<string, NodeSpec> = {
    client: client(),
    lb: makeNode('lb', { id: 'lb', zone: 'az-a' }),
    app1: makeNode('service', { id: 'app1', zone: 'az-a', params: { replicas: 1, poolSize: 22 } }),
    app2: makeNode('service', { id: 'app2', zone: 'az-a', params: { replicas: 1, poolSize: 22 } }),
    app3: makeNode('service', { id: 'app3', zone: 'az-a', params: { replicas: 1, poolSize: 22 } }),
    cache: makeNode('cache', {
      id: 'cache', zone: 'az-a', initial: { warm: 1 },
      params: { ttlSec: 120, ttlJitterPct: 0, hitRatioMax: 0.75, workingSetKeys: 50000, capacityKeys: 25000, warmupSec: 20, singleflight: false },
    }),
    db: makeNode('sql', { id: 'db', zone: 'az-a', params: { poolSize: 7, sizeFactor: 1, maxConnections: 500, queueLimit: 3000 } }),
  };
  if (tweak) tweak(nodes);
  const links: LinkSpec[] = [
    { id: 'client-lb', from: 'client', to: 'lb', mode: 'sync', netClass: 'internet', timeoutMs: 2000 },
    { id: 'lb-app1', from: 'lb', to: 'app1', mode: 'sync', netClass: 'same-az', timeoutMs: 1500 },
    { id: 'lb-app2', from: 'lb', to: 'app2', mode: 'sync', netClass: 'same-az', timeoutMs: 1500 },
    { id: 'lb-app3', from: 'lb', to: 'app3', mode: 'sync', netClass: 'same-az', timeoutMs: 1500 },
    { id: 'app1-cache', from: 'app1', to: 'cache', mode: 'sync', netClass: 'same-az', timeoutMs: 100 },
    { id: 'app2-cache', from: 'app2', to: 'cache', mode: 'sync', netClass: 'same-az', timeoutMs: 100 },
    { id: 'app3-cache', from: 'app3', to: 'cache', mode: 'sync', netClass: 'same-az', timeoutMs: 100 },
    { id: 'cache-db', from: 'cache', to: 'db', mode: 'sync', netClass: 'same-az', timeoutMs: 800,
      retry: { max: 2, backoff: 'none', baseMs: 0, jitter: 'none' } },
  ];
  return {
    id: 'S1-03/ramp', seed: 1103, durationSec: 90, mix: { readRatio: 0.9 }, clientTimeoutMs: 2000,
    load: { kind: 'ramp', from: 200, to: 5000, overSec: 60 }, events: [],
    model: {
      nodes: Object.values(nodes), links,
      routes: { client: 'split', lb: 'split', app1: 'all-sequential', app2: 'all-sequential', app3: 'all-sequential', cache: 'split' },
    },
    options: { ...NOISELESS },
    ...over,
  };
}

export type { TimedEvent };
