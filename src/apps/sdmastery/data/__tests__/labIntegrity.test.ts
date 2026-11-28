// @ts-ignore -- vitest is not listed in package.json devDependencies (tests run via npx vitest)
import { describe, expect, it } from 'vitest';
import {
  makeNode,
  type LinkSpec,
  type PrimitiveKind,
  type SystemModel,
} from '@/features/sysdesign-course/sim';
import {
  LAB_CHALLENGES,
  checkLabIntegrity,
  gradeLabChallenge,
  LAB_INTEGRITY_FAIL_SCORE_CAP,
} from '../labChallenges';
import { checkDataFlowIntegrity } from '../labIntegrity';

const clone = (m: SystemModel): SystemModel => JSON.parse(JSON.stringify(m));
const byId = (id: string) => LAB_CHALLENGES.find((c) => c.id === id)!;

/** Xoá một node cùng mọi link chạm tới nó (kể cả onMissOf) và route của nó. */
function withoutNode(model: SystemModel, nodeId: string): SystemModel {
  const m = clone(model);
  m.nodes = m.nodes.filter((n) => n.id !== nodeId);
  m.links = m.links.filter((l) => l.from !== nodeId && l.to !== nodeId && l.onMissOf !== nodeId);
  if (m.routes) delete m.routes[nodeId];
  return m;
}

/** Dựng model nhỏ: nodes = [id, kind], links = [from, to, mode?, carries?, extra?]. */
function build(
  nodes: [string, PrimitiveKind][],
  links: [string, string, LinkSpec['mode']?, LinkSpec['carries']?, Partial<LinkSpec>?][],
  routes?: SystemModel['routes']
): SystemModel {
  return {
    nodes: nodes.map(([id, kind]) => makeNode(kind, { id })),
    links: links.map(([from, to, mode = 'sync', carries = 'rw', extra = {}]) => ({
      id: `${from}->${to}`,
      from,
      to,
      mode,
      carries,
      ...extra,
    })),
    routes,
  };
}

const codes = (m: SystemModel, readRatio?: number) =>
  checkDataFlowIntegrity(m, readRatio === undefined ? {} : { readRatio }).map((i) => i.code);
const deadNodes = (m: SystemModel, readRatio?: number) =>
  checkDataFlowIntegrity(m, readRatio === undefined ? {} : { readRatio })
    .filter((i) => i.nodeId)
    .map((i) => i.nodeId);

describe('checkDataFlowIntegrity — rules', () => {
  it('client -> service -> sql is valid', () => {
    const m = build([['c', 'client'], ['s', 'service'], ['db', 'sql']], [['c', 's'], ['s', 'db']]);
    expect(codes(m)).toEqual([]);
  });

  it('client without any outgoing link is reported', () => {
    const m = build([['c', 'client'], ['db', 'sql']], []);
    expect(codes(m)).toEqual(['client-unconnected']);
  });

  it('client -> LB with the LB as a dead end fails and names the LB', () => {
    const m = build([['c', 'client'], ['lb', 'lb']], [['c', 'lb']]);
    expect(deadNodes(m)).toEqual(['lb']);
    expect(codes(m)).toContain('reads-no-storage');
    expect(codes(m)).toContain('writes-no-storage');
    const issue = checkDataFlowIntegrity(m).find((i) => i.nodeId === 'lb')!;
    expect(issue.message.vi).toContain('“lb”');
    expect(issue.message.en).toContain('“lb”');
  });

  it('rate limiter and gateway must forward', () => {
    const m = build(
      [['c', 'client'], ['rl', 'rate-limiter'], ['gw', 'gateway']],
      [['c', 'rl'], ['rl', 'gw']]
    );
    expect(deadNodes(m)).toEqual(['gw']);
  });

  it('cache without a miss path fails', () => {
    const m = build([['c', 'client'], ['s', 'service'], ['cache', 'cache']], [['c', 's'], ['s', 'cache', 'sync', 'r']]);
    expect(codes(m, 1)).toContain('cache-no-miss-path');
    expect(codes(m, 1)).toContain('reads-no-storage');
  });

  it('read-through cache (cache -> db) is valid', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['cache', 'cache'], ['db', 'sql']],
      [['c', 's'], ['s', 'cache'], ['cache', 'db']]
    );
    expect(codes(m)).toEqual([]);
  });

  it('cache-aside via an onMissOf link is valid', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['cache', 'cache'], ['db', 'sql']],
      [['c', 's'], ['s', 'cache', 'sync', 'r'], ['s', 'db', 'sync', 'rw', { onMissOf: 'cache' }]]
    );
    expect(codes(m)).toEqual([]);
  });

  it('a split LB needs every branch to reach storage', () => {
    const m = build(
      [['c', 'client'], ['lb', 'lb'], ['a', 'service'], ['b', 'service'], ['db', 'sql']],
      [['c', 'lb'], ['lb', 'a'], ['lb', 'b'], ['a', 'db']]
    );
    expect(deadNodes(m)).toEqual(['b']);
  });

  it('a fan-out service only needs one branch to storage (side calls are fine)', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['auth', 'service'], ['db', 'sql']],
      [['c', 's'], ['s', 'auth'], ['s', 'db']]
    );
    expect(codes(m)).toEqual([]);
  });

  it('queue without a consumer is a dead end', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['q', 'queue'], ['db', 'sql']],
      [['c', 's'], ['s', 'db', 'sync', 'r'], ['s', 'q', 'async', 'w']]
    );
    expect(codes(m, 0.5)).toContain('queue-no-consumer');
    expect(codes(m, 0.5)).toContain('writes-no-storage');
    expect(deadNodes(m, 0.5)).toEqual(['q']);
  });

  it('queue -> worker -> db carries writes to durable storage', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['q', 'queue'], ['w', 'worker'], ['db', 'sql']],
      [['c', 's'], ['s', 'db', 'sync', 'r'], ['s', 'q', 'async', 'w'], ['q', 'w', 'pull', 'w'], ['w', 'db', 'sync', 'w']]
    );
    expect(codes(m, 0.5)).toEqual([]);
  });

  it('worker without a sink fails', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['q', 'queue'], ['w', 'worker'], ['db', 'sql']],
      [['c', 's'], ['s', 'db', 'sync', 'r'], ['s', 'q', 'async', 'w'], ['q', 'w', 'pull', 'w']]
    );
    expect(deadNodes(m, 0.5)).toEqual(['w']);
    expect(codes(m, 0.5)).toContain('writes-no-storage');
  });

  it('missing write path is detected, and ignored when the scenario is read-only', () => {
    const m = build([['c', 'client'], ['s', 'service'], ['db', 'sql']], [['c', 's'], ['s', 'db', 'sync', 'r']]);
    expect(codes(m, 0.9)).toContain('writes-no-storage');
    expect(deadNodes(m, 0.9)).toEqual(['s']);
    expect(codes(m, 1)).toEqual([]);
  });

  it('search is a valid read sink but not a durable write sink', () => {
    const m = build([['c', 'client'], ['s', 'service'], ['idx', 'search']], [['c', 's'], ['s', 'idx']]);
    expect(codes(m, 1)).toEqual([]);
    expect(codes(m, 0.5)).toContain('writes-no-storage');
  });

  it('replicate links do not carry requests', () => {
    const m = build(
      [['c', 'client'], ['s', 'service'], ['db', 'sql'], ['r', 'sql']],
      [['c', 's', 'replicate'], ['s', 'db'], ['db', 'r', 'replicate']]
    );
    expect(codes(m)).toEqual(['client-unconnected']);
    const m2 = build(
      [['c', 'client'], ['lb', 'lb'], ['db', 'sql']],
      [['c', 'lb'], ['lb', 'db', 'replicate']]
    );
    expect(deadNodes(m2)).toEqual(['lb']);
  });

  it('disabled nodes are excluded', () => {
    const m = build([['c', 'client'], ['s', 'service'], ['db', 'sql']], [['c', 's'], ['s', 'db']]);
    m.nodes.find((n) => n.id === 'db')!.params.enabled = false;
    expect(deadNodes(m)).toEqual(['s']);
  });
});

describe('integrity on the LAB challenges', () => {
  for (const c of LAB_CHALLENGES) {
    const readRatio = c.scenarios.map((s) => s.readRatio);
    describe(c.code, () => {
      it('reference passes integrity and still earns 3 stars / 100', () => {
        expect(checkDataFlowIntegrity(c.referenceSolution.model, { readRatio })).toEqual([]);
        const r = gradeLabChallenge(c, c.referenceSolution.model);
        expect(r.rows[0].category).toBe('integrity');
        expect(r.rows[0].pass).toBe(true);
        expect(r.stars).toBe(3);
        expect(r.score).toBe(100);
      });

      it('starter and blank fail', () => {
        for (const m of [c.starter.model, c.blank.model]) {
          const r = gradeLabChallenge(c, m);
          expect(r.passed).toBe(false);
          expect(r.stars).toBe(0);
        }
        const blank = gradeLabChallenge(c, c.blank.model);
        expect(blank.rows[0].pass).toBe(false);
        expect(blank.score).toBeLessThanOrEqual(LAB_INTEGRITY_FAIL_SCORE_CAP);
      });

      it('client-only design with no links scores <= 20', () => {
        const m = clone(c.referenceSolution.model);
        m.links = [];
        const r = gradeLabChallenge(c, m);
        expect(r.passed).toBe(false);
        expect(r.score).toBeLessThanOrEqual(20);
      });

      for (const node of c.referenceSolution.model.nodes) {
        if (node.kind === 'client') continue;
        it(`reference minus “${node.id}” (${node.kind}) does not pass`, () => {
          const m = withoutNode(c.referenceSolution.model, node.id);
          const issues = checkLabIntegrity(c, m);
          const r = gradeLabChallenge(c, m);
          expect(r.rows[0].pass).toBe(issues.length === 0);
          const storageKinds: PrimitiveKind[] = ['sql', 'nosql', 'blob'];
          const otherSameKind = c.referenceSolution.model.nodes.some(
            (n) => n.id !== node.id && n.kind === node.kind
          );
          // Xoá nơi lưu trữ duy nhất / hàng đợi ghi duy nhất ⇒ hỏng toàn vẹn dữ liệu.
          if ((storageKinds.includes(node.kind) || node.kind === 'queue') && !otherSameKind) {
            expect(issues.length).toBeGreaterThan(0);
          }
          if (issues.length > 0) {
            expect(r.passed).toBe(false);
            expect(r.stars).toBe(0);
            expect(r.score).toBeLessThanOrEqual(20);
          }
          // Mọi biến thể thiếu một node trong lời giải mẫu đều không đạt (lời giải mẫu đã tối giản).
          expect(r.passed).toBe(false);
        });
      }
    });
  }

  it('LAB-01 reference minus SQL fails (was: passed 2★ 98/100)', () => {
    const c = byId('lab-01-read-api');
    const r = gradeLabChallenge(c, withoutNode(c.referenceSolution.model, 'db'));
    expect(r.passed).toBe(false);
    expect(r.score).toBeLessThanOrEqual(20);
  });

  it('LAB-01 reference minus Catalog API fails with a dead end at the Load Balancer', () => {
    const c = byId('lab-01-read-api');
    const m = withoutNode(c.referenceSolution.model, 'app');
    const issues = checkDataFlowIntegrity(m, { readRatio: 0.9 });
    expect(issues.some((i) => i.code === 'dead-end' && i.nodeId === 'lb')).toBe(true);
    expect(gradeLabChallenge(c, m).score).toBeLessThanOrEqual(20);
  });

  it('LAB-01 client -> service -> cache (no miss path) fails integrity', () => {
    const c = byId('lab-01-read-api');
    const m = withoutNode(c.referenceSolution.model, 'db');
    m.nodes = m.nodes.filter((n) => n.id !== 'lb');
    m.links = m.links.filter((l) => l.from !== 'lb' && l.to !== 'lb');
    m.links.push({ id: 'client-app', from: 'client', to: 'app', mode: 'sync', carries: 'rw' });
    const issues = checkDataFlowIntegrity(m, { readRatio: 0.9 });
    expect(issues.some((i) => i.nodeId === 'cache')).toBe(true);
    const r = gradeLabChallenge(c, m);
    expect(r.passed).toBe(false);
    expect(r.score).toBeLessThanOrEqual(20);
  });

  it('LAB-02 reference minus Queue fails (was: passed 95/100)', () => {
    const c = byId('lab-02-flash-sale');
    const r = gradeLabChallenge(c, withoutNode(c.referenceSolution.model, 'order-queue'));
    expect(r.rows[0].pass).toBe(false);
    expect(r.passed).toBe(false);
    expect(r.score).toBeLessThanOrEqual(20);
  });
});

describe('required (locked) scenario nodes cannot be dodged', () => {
  for (const c of LAB_CHALLENGES) {
    const required = c.starter.lockedNodeIds.filter((id) => id !== 'client');
    for (const id of required) {
      it(`${c.code}: disconnecting “${id}” from the reference fails integrity`, () => {
        const ref = c.referenceSolution.model;
        const m = { ...ref, links: ref.links.filter((l) => l.to !== id) };
        const r = gradeLabChallenge(c, m);
        expect(r.passed).toBe(false);
        expect(r.score).toBeLessThanOrEqual(LAB_INTEGRITY_FAIL_SCORE_CAP);
        expect(checkLabIntegrity(c, m).some((i) => i.code === 'required-node-unreachable')).toBe(true);
      });
    }
  }
});
