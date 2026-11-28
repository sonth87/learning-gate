// @ts-ignore -- vitest is not listed in package.json devDependencies (tests run via npx vitest)
import { describe, expect, it } from 'vitest';
import { LAB_CHALLENGES } from '../../data/labChallenges';
import { gridToCanvas } from '../../components/lab/canvasGeometry';
import { LAB_DRAFTS_VERSION, migrateLabDrafts, sanitizeDraft } from '../useLabDrafts';

const c1 = LAB_CHALLENGES[0];

function legacyDraft() {
  return {
    model: JSON.parse(JSON.stringify(c1.starter.model)),
    positions: { client: { col: 0, row: 2 }, app: { col: 3, row: 2 }, db: { col: 5, row: 2 } },
    load: { kind: 'steady', rps: 5000 },
    readRatio: 0.9,
    durationSec: 60,
    canvasMode: 'starter',
    savedAt: 123,
  };
}

describe('lab drafts: v1 (grid cells) → v2 (dot coordinates)', () => {
  it('is version 2', () => {
    expect(LAB_DRAFTS_VERSION).toBe(2);
  });

  it('migrate converts {col,row} positions to dot coords at the same place', () => {
    const migrated = migrateLabDrafts(
      { drafts: { [c1.id]: legacyDraft() }, hints: { [c1.id]: 1 } },
      1
    ) as { drafts: Record<string, { positions: Record<string, unknown> }>; hints: unknown };
    expect(migrated.hints).toEqual({ [c1.id]: 1 });
    expect(migrated.drafts[c1.id].positions).toEqual({
      client: gridToCanvas({ col: 0, row: 2 }),
      app: gridToCanvas({ col: 3, row: 2 }),
      db: gridToCanvas({ col: 5, row: 2 }),
    });
    // The starter preset is authored on the same legacy cells → identical after migration
    expect(migrated.drafts[c1.id].positions).toEqual(c1.starter.positions);
    const d = sanitizeDraft(migrated.drafts[c1.id]);
    expect(d).not.toBeNull();
    expect(d!.positions.app).toEqual({ x: 19, y: 10 });
  });

  it('migrate leaves v2 data untouched', () => {
    const v2 = { drafts: { x: { positions: { a: { x: 1, y: 2 } } } }, hints: {} };
    expect(migrateLabDrafts(v2, 2)).toBe(v2);
  });

  it('sanitizeDraft accepts integer dot coords (incl. negative) and rejects bad ones', () => {
    const base = legacyDraft();
    const ok = { ...base, positions: { client: { x: -4, y: 0 }, app: { x: 19, y: 10 }, db: { x: 31, y: 10 } } };
    expect(sanitizeDraft(ok)?.positions.client).toEqual({ x: -4, y: 0 });
    expect(sanitizeDraft({ ...ok, positions: { ...ok.positions, app: { x: 1.5, y: 0 } } })).toBeNull();
    expect(sanitizeDraft({ ...ok, positions: { ...ok.positions, app: { x: 1e7, y: 0 } } })).toBeNull();
    expect(sanitizeDraft({ ...ok, positions: { client: { x: 0, y: 0 } } })).toBeNull(); // missing nodes
  });

  it('sanitizeDraft still converts a stray legacy draft', () => {
    const d = sanitizeDraft(legacyDraft());
    expect(d?.positions.db).toEqual(gridToCanvas({ col: 5, row: 2 }));
  });
});
