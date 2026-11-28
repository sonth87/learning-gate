// @ts-ignore -- vitest is not listed in package.json devDependencies (tests run via npx vitest)
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { makeNode, type SystemModel } from '@/features/sysdesign-course/sim';
import {
  LAB_CHALLENGES,
  LAB_LEVELS,
  LAB_LEVEL_META,
  gradeLabChallenge,
  type LabChallengeSpec,
} from '../labChallenges';
import { dataFlowIntegrityIssues } from './labIntegrity';

const clone = (m: SystemModel): SystemModel => JSON.parse(JSON.stringify(m));
const byCode = (code: string) => LAB_CHALLENGES.find((c) => c.code === code)!;
/** Bỏ link/route trỏ tới node đã xoá (giống canvas khi người học xoá một node). */
function prune(m: SystemModel): SystemModel {
  const ids = new Set(m.nodes.map((n) => n.id));
  m.links = m.links.filter((l) => ids.has(l.from) && ids.has(l.to));
  for (const k of Object.keys(m.routes ?? {})) if (!ids.has(k)) delete m.routes![k];
  return m;
}
const setReplicas = (m: SystemModel, id: string, r: number) => {
  const n = m.nodes.find((x) => x.id === id)!;
  n.replicas = r;
  n.params = { ...n.params, replicas: r };
};
const failedRequired = (c: LabChallengeSpec, m: SystemModel) =>
  gradeLabChallenge(c, m)
    .rows.filter((x) => x.required && !x.pass)
    .map((x) => x.id);

const SDC_ROOT = resolve(process.cwd(), 'content/sysdesign/_source/sdc');

describe('LAB catalog metadata', () => {
  it('has ≥ 15 labs with unique ids and codes', () => {
    expect(LAB_CHALLENGES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(LAB_CHALLENGES.map((c) => c.id)).size).toBe(LAB_CHALLENGES.length);
    expect(new Set(LAB_CHALLENGES.map((c) => c.code)).size).toBe(LAB_CHALLENGES.length);
  });

  it('has ≥ 3 labs per level and is sorted by level', () => {
    for (const lv of LAB_LEVELS) {
      expect(LAB_CHALLENGES.filter((c) => c.level === lv).length).toBeGreaterThanOrEqual(3);
    }
    const order = LAB_CHALLENGES.map((c) => LAB_LEVELS.indexOf(c.level));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('expert labs are multi-scenario (≥ 3 scenarios)', () => {
    for (const c of LAB_CHALLENGES.filter((x) => x.level === 'expert')) {
      expect(c.scenarios.length).toBeGreaterThanOrEqual(3);
    }
  });

  for (const c of LAB_CHALLENGES) {
    describe(c.code, () => {
      it('difficulty and XP are derived from the level', () => {
        expect(c.difficulty).toBe(LAB_LEVEL_META[c.level].difficulty);
        expect(c.xp).toBe(LAB_LEVEL_META[c.level].xp);
      });

      it('has concepts, an estimate and SDC source references that exist', () => {
        expect(c.concepts.length).toBeGreaterThan(0);
        for (const t of c.concepts) {
          expect(t.vi.length).toBeGreaterThan(0);
          expect(t.en.length).toBeGreaterThan(0);
        }
        expect(c.estMinutes).toBeGreaterThan(0);
        expect(c.sourceRef.length).toBeGreaterThan(0);
        for (const ref of c.sourceRef) {
          expect(ref.path.startsWith(`phase-${ref.phase}/`)).toBe(true);
          expect({ path: ref.path, exists: existsSync(resolve(SDC_ROOT, ref.path)) }).toEqual({
            path: ref.path,
            exists: true,
          });
        }
      });

      it('has 3–4 progressive hints', () => {
        expect(c.hints.length).toBeGreaterThanOrEqual(3);
        expect(c.hints.length).toBeLessThanOrEqual(4);
      });

      it('par cost sits 10–30% above the reference cost', () => {
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        expect(c.parCostPerHour).toBeGreaterThanOrEqual(r.costPerHour * 1.1);
        expect(c.parCostPerHour).toBeLessThanOrEqual(r.costPerHour * 1.3);
      });

      it('reference and starter satisfy the data-flow integrity rules', () => {
        expect(dataFlowIntegrityIssues(c.referenceSolution.model)).toEqual([]);
        expect(dataFlowIntegrityIssues(c.starter.model)).toEqual([]);
      });

      it('locked nodes exist in every preset that locks them', () => {
        for (const p of [c.starter, c.blank, c.referenceSolution]) {
          const ids = new Set(p.model.nodes.map((n) => n.id));
          for (const id of p.lockedNodeIds) expect(ids.has(id)).toBe(true);
        }
      });

      it('fixed scenario events target nodes that exist and are locked in starter, reference and blank', () => {
        for (const sc of c.scenarios) {
          for (const ev of sc.events ?? []) {
            if (!('node' in ev)) continue;
            for (const p of [c.starter, c.referenceSolution, c.blank]) {
              expect(p.model.nodes.some((n) => n.id === ev.node)).toBe(true);
              expect(p.lockedNodeIds).toContain(ev.node);
            }
          }
        }
      });

      it('presets use the first scenario load', () => {
        const sc = c.scenarios[0];
        for (const p of [c.starter, c.blank, c.referenceSolution]) {
          expect(p.load).toEqual(sc.load);
          expect(p.readRatio).toBe(sc.readRatio);
        }
      });
    });
  }
});

describe('data-flow integrity helper', () => {
  it('flags dead ends, writes that miss durable storage and queues without a pull worker', () => {
    const m = clone(byCode('LAB-02').referenceSolution.model);
    expect(dataFlowIntegrityIssues(m)).toEqual([]);

    const noWorker = prune({ ...clone(m), nodes: m.nodes.filter((n) => n.id !== 'order-worker') });
    expect(
      dataFlowIntegrityIssues(noWorker).some((x) => x.startsWith('queue-without-pull-worker'))
    ).toBe(true);

    const cacheOnly = prune({ ...clone(m), nodes: m.nodes.filter((n) => n.id !== 'db') });
    expect(dataFlowIntegrityIssues(cacheOnly).some((x) => x.startsWith('dead-end:cache'))).toBe(
      true
    );

    const toSearch = clone(byCode('LAB-11').referenceSolution.model);
    toSearch.links = toSearch.links.filter((l) => l.id !== 'api-sql');
    toSearch.links.find((l) => l.id === 'api-search')!.carries = 'rw';
    expect(
      dataFlowIntegrityIssues(toSearch).some((x) => x.startsWith('write-path-ends-at:search'))
    ).toBe(true);
  });
});

describe('new labs: the starter fails for the lesson, wrong fixes fail too', () => {
  it('LAB-06: 3 instances are not enough at the 6,000 RPS peak', () => {
    const c = byCode('LAB-06');
    const m = clone(c.referenceSolution.model);
    setReplicas(m, 'api', 3);
    expect(gradeLabChallenge(c, m).passed).toBe(false);
  });

  it('LAB-07: starter fails on SLO (not budget); scaling SQL up instead of fixing the pool busts the budget', () => {
    const c = byCode('LAB-07');
    const starterFails = failedRequired(c, c.starter.model);
    expect(starterFails).not.toContain('budget:cost');
    expect(starterFails.some((id) => id.startsWith('sc:'))).toBe(true);
    const m = clone(c.starter.model);
    const db = m.nodes.find((n) => n.id === 'db')!;
    db.params = { ...db.params, sizeFactor: 2 };
    expect(failedRequired(c, m)).toContain('budget:cost');
  });

  it('LAB-08: timeout without degrade, or degrade without timeout, both fail', () => {
    const c = byCode('LAB-08');
    const noDegrade = clone(c.referenceSolution.model);
    noDegrade.links.find((l) => l.id === 'api-reviews')!.fallback = 'error';
    expect(gradeLabChallenge(c, noDegrade).passed).toBe(false);
    const noTimeout = clone(c.referenceSolution.model);
    delete noTimeout.links.find((l) => l.id === 'api-reviews')!.timeoutMs;
    expect(gradeLabChallenge(c, noTimeout).passed).toBe(false);
  });

  it('LAB-09: TTL jitter alone does not stop the stampede; singleflight does', () => {
    const c = byCode('LAB-09');
    const m = clone(c.starter.model);
    const cache = m.nodes.find((n) => n.id === 'cache')!;
    cache.params = { ...cache.params, ttlJitterPct: 0.15 };
    expect(gradeLabChallenge(c, m).passed).toBe(false);
    cache.params = { ...cache.params, singleflight: true };
    expect(gradeLabChallenge(c, m).passed).toBe(true);
  });

  it('LAB-10: the starter only fails on latency (sync email on the response path)', () => {
    const c = byCode('LAB-10');
    expect(failedRequired(c, c.starter.model)).toEqual(['sc:steady-1200:p99-100']);
  });

  it('LAB-11: scaling SQL up far enough busts the budget', () => {
    const c = byCode('LAB-11');
    const m = clone(c.starter.model);
    const db = m.nodes.find((n) => n.id === 'catalog-db')!;
    db.params = { ...db.params, poolSize: 64, sizeFactor: 3 };
    expect(failedRequired(c, m)).toContain('budget:cost');
  });

  it('LAB-12: immediate retries cause a metastable failure; breaker-only and fallback-only both fail', () => {
    const c = byCode('LAB-12');
    expect(failedRequired(c, c.starter.model)).toContain('sc:carrier-slowdown:p99-after');

    const breakerOnly = clone(c.starter.model);
    const l1 = breakerOnly.links.find((l) => l.id === 'api-carrier')!;
    delete l1.retry;
    l1.breaker = c.referenceSolution.model.links.find((l) => l.id === 'api-carrier')!.breaker;
    expect(failedRequired(c, breakerOnly)).toContain('sc:carrier-slowdown:err-run');

    const degradeOnly = clone(c.starter.model);
    const l2 = degradeOnly.links.find((l) => l.id === 'api-carrier')!;
    delete l2.retry;
    l2.fallback = 'degrade';
    expect(failedRequired(c, degradeOnly)).toContain('sc:carrier-slowdown:carrier-breathes');
  });

  it('LAB-13: the DNS TTL bounds failover (≤ 4 s passes, 5 s and 60 s fail)', () => {
    const c = byCode('LAB-13');
    const withTtl = (ttl: number) => {
      const m = clone(c.referenceSolution.model);
      m.nodes.find((n) => n.id === 'dns')!.params.ttlSec = ttl;
      return gradeLabChallenge(c, m).passed;
    };
    expect(withTtl(4)).toBe(true);
    expect(withTtl(5)).toBe(false);
    expect(withTtl(60)).toBe(false);
  });

  it('LAB-14: each missing ingredient breaks a different scenario', () => {
    const c = byCode('LAB-14');
    const noQueue = clone(c.referenceSolution.model);
    noQueue.nodes = noQueue.nodes.filter((n) => n.id !== 'order-queue' && n.id !== 'order-worker');
    for (const l of noQueue.links) if (l.carries === 'r') l.carries = 'rw';
    expect(failedRequired(c, prune(noQueue)).some((id) => id.startsWith('sc:order-spike:'))).toBe(
      true
    );

    const onePool = clone(c.referenceSolution.model);
    onePool.nodes = onePool.nodes.filter((n) => n.id !== 'api-b');
    setReplicas(onePool, 'api-a', 4);
    expect(failedRequired(c, prune(onePool)).some((id) => id.startsWith('sc:pool-outage:'))).toBe(
      true
    );

    const noCdn = clone(c.referenceSolution.model);
    noCdn.nodes = noCdn.nodes.filter((n) => n.id !== 'cdn');
    noCdn.links.push({
      id: 'client-lb',
      from: 'client',
      to: 'lb',
      mode: 'sync',
      carries: 'rw',
      timeoutMs: 2000,
    });
    expect(failedRequired(c, prune(noCdn)).some((id) => id.startsWith('sc:global-reads:'))).toBe(
      true
    );
  });

  it('LAB-15: CDN wired straight to the pools (no LB) fails the outage; SQL instead of NoSQL fails', () => {
    const c = byCode('LAB-15');
    const noLb = clone(c.referenceSolution.model);
    noLb.nodes = noLb.nodes.filter((n) => n.id !== 'lb');
    noLb.links.push({
      id: 'cdn-a',
      from: 'cdn',
      to: 'api-a',
      mode: 'sync',
      carries: 'rw',
      timeoutMs: 1500,
    });
    noLb.links.push({
      id: 'cdn-b',
      from: 'cdn',
      to: 'api-b',
      mode: 'sync',
      carries: 'rw',
      timeoutMs: 1500,
    });
    expect(failedRequired(c, prune(noLb)).some((id) => id.startsWith('sc:pool-outage:'))).toBe(
      true
    );

    const sql = clone(c.referenceSolution.model);
    const i = sql.nodes.findIndex((n) => n.id === 'store');
    sql.nodes[i] = makeNode('sql', {
      id: 'store',
      label: sql.nodes[i].label,
      zone: 'az-a',
      params: { poolSize: 16 },
    });
    expect(gradeLabChallenge(c, sql).passed).toBe(false);
  });

  it('LAB-16: more shards do not fix the celebrity hot key; salting does', () => {
    const c = byCode('LAB-16');
    const m = clone(c.referenceSolution.model);
    const t = m.nodes.find((n) => n.id === 'timeline')!;
    t.params = { ...t.params, shards: 32, hotKeySalt: 1 };
    expect(failedRequired(c, m).some((id) => id.startsWith('sc:celebrity:'))).toBe(true);
    t.params = { ...t.params, shards: 6, hotKeySalt: 2 };
    expect(gradeLabChallenge(c, m).passed).toBe(true);
  });
});
