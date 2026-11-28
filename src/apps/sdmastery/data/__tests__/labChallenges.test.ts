// @ts-ignore -- vitest is not listed in package.json devDependencies (tests run via npx vitest)
import { describe, expect, it } from 'vitest';
import type { SystemModel } from '@/features/sysdesign-course/sim';
import { LAB_CHALLENGES, gradeLabChallenge } from '../labChallenges';

const clone = (m: SystemModel): SystemModel => JSON.parse(JSON.stringify(m));
const byId = (id: string) => LAB_CHALLENGES.find((c) => c.id === id)!;

describe('LAB challenges: reference / starter / blank', () => {
  for (const c of LAB_CHALLENGES) {
    describe(c.code, () => {
      it('reference solution passes with 3 stars', () => {
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        expect(r.validModel).toBe(true);
        expect(r.rows.filter((x) => x.required && !x.pass).map((x) => x.id)).toEqual([]);
        expect(r.passed).toBe(true);
        expect(r.stars).toBe(3);
      });

      it('starter fails', () => {
        const r = gradeLabChallenge(c, c.starter.model);
        expect(r.passed).toBe(false);
        expect(r.stars).toBe(0);
      });

      it('integrity row comes first and is required', () => {
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        expect(r.rows[0].id).toBe('integrity:data-flow');
        expect(r.rows[0].category).toBe('integrity');
        expect(r.rows[0].required).toBe(true);
      });

      it('starter (valid data flow, failing SLOs) scores below the 69 fail ceiling', () => {
        const r = gradeLabChallenge(c, c.starter.model);
        expect(r.rows[0].pass).toBe(true);
        expect(r.score).toBeLessThanOrEqual(65);
      });

      it('blank fails', () => {
        const r = gradeLabChallenge(c, c.blank.model);
        expect(r.passed).toBe(false);
        expect(r.stars).toBe(0);
      });

      it('reference cost <= par <= max, with a meaningful par margin', () => {
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        expect(r.costPerHour).toBeLessThanOrEqual(c.parCostPerHour);
        expect(c.parCostPerHour).toBeLessThanOrEqual(c.maxCostPerHour);
        // par should sit at most ~30% above the reference cost
        expect(c.parCostPerHour).toBeLessThanOrEqual(r.costPerHour * 1.3);
      });

      it('topology checks are recommendations and never required for pass', () => {
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        const topo = r.rows.filter((x) => x.category === 'topology');
        expect(topo.length).toBe(c.topology.length);
        expect(topo.every((x) => !x.required)).toBe(true);
      });

      it('bilingual text is present', () => {
        for (const t of [c.title, c.summary, c.prompt, c.explain, ...c.hints]) {
          expect(t.vi.length).toBeGreaterThan(0);
          expect(t.en.length).toBeGreaterThan(0);
        }
        const json = JSON.stringify([c.hints, c.explain, c.prompt]);
        expect(json).not.toMatch(/Tarjan|findSpofs/);
      });
    });
  }
});

describe('alternative valid designs are not blocked by topology', () => {
  const c1 = byId('lab-01-read-api');

  it('LAB-01 without a Load Balancer (client -> app directly) still passes, but not 3 stars', () => {
    const m = clone(c1.referenceSolution.model);
    m.nodes = m.nodes.filter((n) => n.id !== 'lb');
    m.links = m.links.filter((l) => l.id !== 'client-lb' && l.id !== 'lb-app');
    delete m.routes!.lb;
    m.links.push({ id: 'client-app', from: 'client', to: 'app', mode: 'sync', carries: 'rw', timeoutMs: 1500 });
    const r = gradeLabChallenge(c1, m);
    expect(r.rows.find((x) => x.id === 'integrity:data-flow')!.pass).toBe(true);
    expect(r.rows.find((x) => x.id === 'topo:topo-lb')!.pass).toBe(false);
    expect(r.passed).toBe(true);
    expect(r.stars).toBeLessThan(3);
    expect(r.stars).toBeGreaterThanOrEqual(1);
  });

  it('LAB-01 without a Cache is judged on SLO/cost, not on topology', () => {
    const m = clone(c1.referenceSolution.model);
    m.nodes = m.nodes.filter((n) => n.id !== 'cache');
    m.links = m.links.filter((l) => l.id !== 'app-cache' && l.id !== 'cache-db');
    delete m.routes!.cache;
    m.links.push({ id: 'app-db', from: 'app', to: 'db', mode: 'sync', carries: 'rw', timeoutMs: 800 });
    const db = m.nodes.find((n) => n.id === 'db')!;
    db.params = { ...db.params, sizeFactor: 4, poolSize: 48 };
    const r = gradeLabChallenge(c1, m);
    expect(r.rows.find((x) => x.id === 'integrity:data-flow')!.pass).toBe(true);
    expect(r.rows.find((x) => x.id === 'topo:topo-cache')!.pass).toBe(false);
    // Whatever the verdict, no topology row may be the reason it fails.
    const failedRequired = r.rows.filter((x) => x.required && !x.pass);
    expect(failedRequired.every((x) => x.category !== 'topology')).toBe(true);
    expect(r.stars).toBeLessThan(3);
  });

  it('sloppy over-provisioned LAB-01 design passes but misses 3 stars on cost', () => {
    const m = clone(c1.referenceSolution.model);
    const app = m.nodes.find((n) => n.id === 'app')!;
    app.replicas = 8;
    app.params = { ...app.params, replicas: 8 };
    const r = gradeLabChallenge(c1, m);
    expect(r.passed).toBe(true);
    expect(r.costPerHour).toBeGreaterThan(c1.parCostPerHour * 1.05);
    expect(r.stars).toBe(2);
  });
});

describe('LAB-03 failover drill', () => {
  const c3 = byId('lab-03-zero-spof');
  const failoverRows = (m: SystemModel) =>
    gradeLabChallenge(c3, m).rows.filter((x) => x.id.startsWith('sc:ha-failover-drill:'));

  it('reference passes every failover constraint', () => {
    const rows = failoverRows(c3.referenceSolution.model);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((x) => x.pass)).toBe(true);
  });

  it('a single Service node fails the drill even if static SPOF rules and steady SLOs pass', () => {
    const m = clone(c3.referenceSolution.model);
    m.nodes = m.nodes.filter((n) => n.id !== 'pay-svc-b');
    m.links = m.links.filter((l) => l.id !== 'lb-svc-b' && l.id !== 'svc-b-cache');
    delete m.routes!['pay-svc-b'];
    const a = m.nodes.find((n) => n.id === 'pay-svc-a')!;
    a.replicas = 3;
    a.params = { ...a.params, replicas: 3 };
    const r = gradeLabChallenge(c3, m);
    expect(r.rows.find((x) => x.id === 'struct:struct-no-spof')!.pass).toBe(true);
    expect(r.rows.find((x) => x.id === 'sc:ha-steady-3k:err-1pct')!.pass).toBe(true);
    expect(failoverRows(m).some((x) => !x.pass)).toBe(true);
    expect(r.passed).toBe(false);
  });

  it('a single Service node with replicas = 1 fails the drill', () => {
    const m = clone(c3.referenceSolution.model);
    m.nodes = m.nodes.filter((n) => n.id !== 'pay-svc-b');
    m.links = m.links.filter((l) => l.id !== 'lb-svc-b' && l.id !== 'svc-b-cache');
    delete m.routes!['pay-svc-b'];
    const a = m.nodes.find((n) => n.id === 'pay-svc-a')!;
    a.replicas = 1;
    a.params = { ...a.params, replicas: 1 };
    const r = gradeLabChallenge(c3, m);
    expect(failoverRows(m).some((x) => !x.pass)).toBe(true);
    expect(r.passed).toBe(false);
  });

  it('renaming the Service nodes does not dodge the drill', () => {
    const m = clone(c3.referenceSolution.model);
    m.nodes = m.nodes.filter((n) => n.id !== 'pay-svc-b');
    m.links = m.links.filter((l) => l.id !== 'lb-svc-b' && l.id !== 'svc-b-cache');
    delete m.routes!['pay-svc-b'];
    expect(failoverRows(m).some((x) => !x.pass)).toBe(true);
  });
});

describe('LAB-05 hot key', () => {
  const c5 = byId('lab-05-sharded-store');

  it('more shards alone do not fix an 80% hot key', () => {
    const m = clone(c5.referenceSolution.model);
    const ns = m.nodes.find((n) => n.kind === 'nosql')!;
    ns.params = { ...ns.params, shards: 12, hotKeySalt: 1 };
    const r = gradeLabChallenge(c5, m);
    expect(r.passed).toBe(false);
    expect(r.rows.find((x) => x.id === 'topo:topo-hot-key-mitigation')!.pass).toBe(false);
  });

  it('key salting fixes it', () => {
    const m = clone(c5.referenceSolution.model);
    const ns = m.nodes.find((n) => n.kind === 'nosql')!;
    ns.params = { ...ns.params, shards: 4, hotKeySalt: 2 };
    expect(gradeLabChallenge(c5, m).passed).toBe(true);
  });
});

describe('scoring formula', () => {
  const c1 = byId('lab-01-read-api');

  it('cost points are not awarded when SLOs fail (a design that does nothing is cheap)', () => {
    const r = gradeLabChallenge(c1, c1.starter.model);
    expect(r.rows.find((x) => x.id === 'budget:cost')!.pass).toBe(true);
    expect(r.rows.filter((x) => x.category === 'slo').some((x) => !x.pass)).toBe(true);
    expect(r.score).toBeLessThan(40);
  });

  it('a passing design still scores >= 70', () => {
    const m = clone(c1.referenceSolution.model);
    const app = m.nodes.find((n) => n.id === 'app')!;
    app.replicas = 8;
    app.params = { ...app.params, replicas: 8 };
    expect(gradeLabChallenge(c1, m).score).toBeGreaterThanOrEqual(70);
  });
});
