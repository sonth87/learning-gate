import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  KIND_DEFAULTS,
  validate,
  type LoadProfile,
  type NodeId,
  type SystemModel,
} from '@/features/sysdesign-course/sim';
import {
  gridToCanvas,
  isCanvasPos,
  isGridPos,
  type CanvasPos,
} from '../components/lab/canvasGeometry';

/** v1: toạ độ ô {col,row} (lưới 156×114); v2: toạ độ chấm {x,y} (canvas tự do, DOT = 26 px). */
export const LAB_DRAFTS_VERSION = 2;

export type LabCanvasMode = 'starter' | 'blank' | 'reference';

/** Bản nháp canvas của một template (sandbox hoặc một challenge). */
export interface LabDraft {
  model: SystemModel;
  /** Góc trên-trái thẻ theo đơn vị chấm. */
  positions: Record<NodeId, CanvasPos>;
  load: LoadProfile;
  readRatio: number;
  durationSec: number;
  canvasMode: LabCanvasMode;
  savedAt: number;
}

interface LabDraftsState {
  drafts: Record<string, LabDraft>;
  /** Số gợi ý đã mở theo challenge — chỉ tăng, không bao giờ giảm (kể cả khi reset). */
  hints: Record<string, number>;
  saveDraft: (templateId: string, draft: Omit<LabDraft, 'savedAt'>) => void;
  clearDraft: (templateId: string) => void;
  raiseHints: (templateId: string, count: number) => void;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isLoadProfile(v: unknown): v is LoadProfile {
  if (!isObj(v)) return false;
  if (v.kind === 'steady') return isNum(v.rps);
  if (v.kind === 'ramp') return isNum(v.from) && isNum(v.to) && isNum(v.overSec);
  if (v.kind === 'spike') {
    return (
      isNum(v.base) &&
      isNum(v.peak) &&
      isNum(v.atSec) &&
      isNum(v.holdSec) &&
      isNum(v.riseSec) &&
      isNum(v.fallSec)
    );
  }
  return false;
}

/** Kiểm tra hình dạng dữ liệu đọc từ localStorage; trả về null nếu hỏng / lỗi thời. */
export function sanitizeDraft(raw: unknown): LabDraft | null {
  try {
    if (!isObj(raw)) return null;
    const { model, positions, load, readRatio, durationSec, canvasMode } = raw;
    if (!isObj(model) || !Array.isArray(model.nodes) || !Array.isArray(model.links)) return null;
    if (!isObj(positions)) return null;
    if (!isLoadProfile(load)) return null;
    if (!isNum(readRatio) || readRatio < 0 || readRatio > 1) return null;
    if (!isNum(durationSec) || durationSec < 5 || durationSec > 600) return null;
    if (canvasMode !== 'starter' && canvasMode !== 'blank' && canvasMode !== 'reference') {
      return null;
    }
    const ids = new Set<string>();
    const outPositions: Record<NodeId, CanvasPos> = {};
    for (const n of model.nodes) {
      if (!isObj(n) || typeof n.id !== 'string' || typeof n.kind !== 'string') return null;
      if (!(n.kind in KIND_DEFAULTS) || ids.has(n.id)) return null;
      if (!isObj(n.params) || !isObj(n.capacity) || !isObj(n.latency) || !isObj(n.label)) {
        return null;
      }
      ids.add(n.id);
      const p = positions[n.id];
      if (isCanvasPos(p)) {
        outPositions[n.id] = { x: p.x, y: p.y };
      } else if (
        // Phòng hờ: bản nháp lưới cũ lọt qua migrate (vd. ghi bởi tab cũ) vẫn nạp đúng chỗ
        isGridPos(p) &&
        Number.isInteger(p.col) &&
        Number.isInteger(p.row) &&
        Math.abs(p.col) <= 500 &&
        Math.abs(p.row) <= 500
      ) {
        outPositions[n.id] = gridToCanvas(p);
      } else {
        return null;
      }
    }
    for (const l of model.links) {
      if (!isObj(l) || typeof l.id !== 'string') return null;
      if (typeof l.from !== 'string' || typeof l.to !== 'string') return null;
      if (!ids.has(l.from) || !ids.has(l.to)) return null;
    }
    validate(model as unknown as SystemModel);
    return {
      model: model as unknown as SystemModel,
      positions: outPositions,
      load,
      readRatio,
      durationSec,
      canvasMode,
      savedAt: isNum(raw.savedAt) ? raw.savedAt : 0,
    };
  } catch {
    return null;
  }
}

/** Chuyển dữ liệu persist cũ sang phiên bản hiện tại (v1 lưới ô → v2 toạ độ chấm). */
export function migrateLabDrafts(persisted: unknown, version: number): unknown {
  if (!isObj(persisted)) return persisted;
  if (version >= 2) return persisted;
  const drafts = isObj(persisted.drafts) ? persisted.drafts : {};
  const nextDrafts: Record<string, unknown> = {};
  for (const [tid, d] of Object.entries(drafts)) {
    if (!isObj(d) || !isObj(d.positions)) {
      nextDrafts[tid] = d; // hỏng → sanitizeDraft sẽ loại khi đọc
      continue;
    }
    const pos: Record<string, unknown> = {};
    for (const [id, p] of Object.entries(d.positions)) {
      pos[id] = isGridPos(p) ? gridToCanvas(p) : p;
    }
    nextDrafts[tid] = { ...d, positions: pos };
  }
  return { ...persisted, drafts: nextDrafts };
}

export const useLabDrafts = create<LabDraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      hints: {},
      saveDraft: (templateId, draft) =>
        set((s) => ({
          drafts: { ...s.drafts, [templateId]: { ...draft, savedAt: Date.now() } },
        })),
      clearDraft: (templateId) =>
        set((s) => {
          if (!(templateId in s.drafts)) return s;
          const next = { ...s.drafts };
          delete next[templateId];
          return { drafts: next };
        }),
      raiseHints: (templateId, count) =>
        set((s) =>
          (s.hints[templateId] ?? 0) >= count
            ? s
            : { hints: { ...s.hints, [templateId]: count } }
        ),
    }),
    {
      name: 'lg_sd_lab_drafts_v1',
      version: LAB_DRAFTS_VERSION,
      partialize: (s) => ({ drafts: s.drafts, hints: s.hints }),
      migrate: (persisted, version) => migrateLabDrafts(persisted, version) as LabDraftsState,
    }
  )
);

/** Đọc bản nháp đã kiểm tra hợp lệ của một template (null nếu không có / hỏng). */
export function readValidDraft(templateId: string): LabDraft | null {
  return sanitizeDraft(useLabDrafts.getState().drafts[templateId]);
}

/** Stringify ổn định (sắp xếp key) để so sánh canvas với preset. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (isObj(v)) {
      return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)));
    }
    return v;
  });
}
