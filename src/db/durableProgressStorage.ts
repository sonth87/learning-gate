import { getDb } from './indexedDbClient';
import { emptyState } from '@/features/workpath/logic';
import type {
  CardRecord,
  DrillRecord,
  ExerciseRecord,
  LogEntry,
  QuizRecord,
  WpState,
} from '@/features/workpath/types';

export type ProgressSlotId = 'wp' | 'kube' | 'cicd' | 'pmp';

export interface StorageSyncMeta {
  status: 'idle' | 'saving' | 'synced' | 'local-only' | 'error';
  localOk: boolean;
  idbOk: boolean;
  persistedGranted: boolean | null;
  lastSavedAt: number | null;
}

const LOCAL_MIRROR_KEYS: Record<ProgressSlotId, string> = {
  wp: 'pylearn_wp_state_mirror_v2',
  kube: 'pylearn_course_state_mirror_v2_kube',
  cicd: 'pylearn_course_state_mirror_v2_cicd',
  pmp: 'pylearn_course_state_mirror_v2_pmp',
};

let persistPromise: Promise<boolean | null> | null = null;

/**
 * Yêu cầu trình duyệt cấp quyền Persistent Storage để tránh Safari ITP / trình duyệt
 * tự động dọn dẹp IndexedDB & LocalStorage sau vài ngày không vào.
 */
export function requestBrowserPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return Promise.resolve(null);
  }
  if (!persistPromise) {
    persistPromise = Promise.race<boolean | null>([
      (async () => {
        try {
          if (typeof navigator.storage.persisted === 'function') {
            const already = await navigator.storage.persisted();
            if (already) return true;
          }
          if (typeof navigator.storage.persist === 'function') {
            return await navigator.storage.persist();
          }
        } catch {
          // Ignore browser permission errors
        }
        return null;
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 900)),
    ]);
  }
  return persistPromise;
}

export function normalizeWpState(raw?: Partial<WpState> | null): WpState {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    v: 1,
    started: typeof raw.started === 'string' && raw.started ? raw.started : base.started,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    resetAt: typeof raw.resetAt === 'number' ? raw.resetAt : undefined,
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) ? raw.xp : 0,
    lessons: raw.lessons && typeof raw.lessons === 'object' ? { ...raw.lessons } : {},
    skippedModules:
      raw.skippedModules && typeof raw.skippedModules === 'object' ? { ...raw.skippedModules } : {},
    skippedLessons:
      raw.skippedLessons && typeof raw.skippedLessons === 'object' ? { ...raw.skippedLessons } : {},
    skippedQuizzes:
      raw.skippedQuizzes && typeof raw.skippedQuizzes === 'object' ? { ...raw.skippedQuizzes } : {},
    quiz: raw.quiz && typeof raw.quiz === 'object' ? structuredClone(raw.quiz) : {},
    quizWrong: Array.isArray(raw.quizWrong) ? [...raw.quizWrong] : [],
    exercises: raw.exercises && typeof raw.exercises === 'object' ? structuredClone(raw.exercises) : {},
    catalog: raw.catalog && typeof raw.catalog === 'object' ? structuredClone(raw.catalog) : {},
    cards: raw.cards && typeof raw.cards === 'object' ? structuredClone(raw.cards) : {},
    drills: raw.drills && typeof raw.drills === 'object' ? structuredClone(raw.drills) : {},
    log: Array.isArray(raw.log) ? [...raw.log] : [],
  };
}

export function stateRichness(s: WpState | null | undefined): number {
  if (!s) return 0;
  return (
    s.xp +
    Object.keys(s.lessons ?? {}).length * 10 +
    Object.keys(s.skippedModules ?? {}).length * 5 +
    Object.keys(s.skippedLessons ?? {}).length * 3 +
    Object.keys(s.skippedQuizzes ?? {}).length * 3 +
    Object.keys(s.quiz ?? {}).length * 8 +
    Object.keys(s.exercises ?? {}).length * 10 +
    Object.keys(s.catalog ?? {}).length * 4 +
    Object.keys(s.cards ?? {}).length * 2 +
    Object.keys(s.drills ?? {}).length * 4 +
    (s.log?.length ?? 0)
  );
}

export function hasMeaningfulProgress(s: WpState | null | undefined): boolean {
  return stateRichness(s) > 0;
}

/**
 * Hợp nhất không phá huỷ (non-destructive merge) giữa bản ghi IndexedDB, LocalStorage và RAM:
 * - Không bao giờ làm mất bài đã đạt ('passed'), lesson đã đọc, kỷ lục quiz, SRS flashcard hay XP.
 * - Vẫn tôn trọng thao tác bật/tắt "Bỏ qua" hoặc code đang gõ mới nhất dựa theo `updatedAt`.
 */
export function mergeWpStates(
  first: Partial<WpState> | null | undefined,
  second: Partial<WpState> | null | undefined
): WpState {
  if (!first && !second) return emptyState();
  if (!first) return normalizeWpState(second);
  if (!second) return normalizeWpState(first);

  const a = normalizeWpState(first);
  const b = normalizeWpState(second);

  // Nếu một bên vừa chủ động Reset toàn bộ tiến độ sau thời điểm cập nhật của bên kia
  if (a.resetAt && a.resetAt > (b.updatedAt ?? 0) && !hasMeaningfulProgress(a)) return a;
  if (b.resetAt && b.resetAt > (a.updatedAt ?? 0) && !hasMeaningfulProgress(b)) return b;

  const aTime = a.updatedAt ?? 0;
  const bTime = b.updatedAt ?? 0;
  const [newer, older] =
    aTime > bTime
      ? [a, b]
      : bTime > aTime
        ? [b, a]
        : stateRichness(a) >= stateRichness(b)
          ? [a, b]
          : [b, a];

  const lessons: Record<string, number> = { ...older.lessons };
  for (const [k, t] of Object.entries(newer.lessons)) {
    lessons[k] = k in lessons ? Math.min(lessons[k], t) : t;
  }

  // Với cờ bỏ qua (toggleable): nếu cả 2 đều có mốc thời gian thì ưu tiên bản mới hơn để cho phép "Hoàn tác bỏ qua",
  // còn nếu một bên là bản rỗng chưa từng lưu (`updatedAt === 0` & không có dữ liệu) thì giữ nguyên dữ liệu bên kia.
  const olderIsBlank = (older.updatedAt ?? 0) === 0 && !hasMeaningfulProgress(older);
  const skippedModules = olderIsBlank
    ? { ...older.skippedModules, ...newer.skippedModules }
    : { ...(newer.skippedModules ?? {}) };
  const skippedLessons = olderIsBlank
    ? { ...older.skippedLessons, ...newer.skippedLessons }
    : { ...(newer.skippedLessons ?? {}) };
  const skippedQuizzes = olderIsBlank
    ? { ...older.skippedQuizzes, ...newer.skippedQuizzes }
    : { ...(newer.skippedQuizzes ?? {}) };

  const quiz: Record<string, QuizRecord> = {};
  for (const k of new Set([...Object.keys(older.quiz), ...Object.keys(newer.quiz)])) {
    const qa = older.quiz[k];
    const qb = newer.quiz[k];
    if (qa && qb) {
      quiz[k] = {
        best: Math.max(qa.best, qb.best),
        bestCorrect: Math.max(qa.bestCorrect, qb.bestCorrect),
        attempts: Math.max(qa.attempts, qb.attempts),
      };
    } else {
      quiz[k] = structuredClone((qb ?? qa)!);
    }
  }

  const exercises: Record<string, ExerciseRecord> = {};
  for (const k of new Set([...Object.keys(older.exercises), ...Object.keys(newer.exercises)])) {
    const ea = older.exercises[k];
    const eb = newer.exercises[k];
    if (ea && eb) {
      const passed = ea.status === 'passed' || eb.status === 'passed';
      const status = passed ? 'passed' : eb.status;
      exercises[k] = {
        status,
        attempts: Math.max(ea.attempts, eb.attempts),
        hints: Math.max(ea.hints, eb.hints),
        solutionViewed: ea.solutionViewed || eb.solutionViewed || undefined,
        lastScore: eb.lastScore ?? ea.lastScore,
        passedAt:
          ea.passedAt && eb.passedAt
            ? Math.min(ea.passedAt, eb.passedAt)
            : (ea.passedAt ?? eb.passedAt),
        skippedAt: status === 'skipped' ? (eb.skippedAt ?? ea.skippedAt ?? Date.now()) : undefined,
        code: eb.code ?? ea.code,
      };
    } else {
      exercises[k] = structuredClone((eb ?? ea)!);
    }
  }

  const catalog: WpState['catalog'] = { ...older.catalog };
  for (const [k, v] of Object.entries(newer.catalog)) {
    const prev = catalog[k];
    if (!prev || v.t >= prev.t) catalog[k] = { ...v };
  }

  const cards: Record<string, CardRecord> = { ...older.cards };
  for (const [k, v] of Object.entries(newer.cards)) {
    const prev = cards[k];
    if (!prev || v.due >= prev.due || v.box >= prev.box) cards[k] = { ...v };
  }

  const drills: Record<string, DrillRecord> = {};
  for (const k of new Set([...Object.keys(older.drills), ...Object.keys(newer.drills)])) {
    const da = older.drills[k];
    const db = newer.drills[k];
    if (da && db) {
      drills[k] = {
        bestAcc: Math.max(da.bestAcc, db.bestAcc),
        bestWpm: Math.max(da.bestWpm, db.bestWpm),
        runs: Math.max(da.runs, db.runs),
      };
    } else {
      drills[k] = { ...(db ?? da)! };
    }
  }

  const seenLog = new Set<string>();
  const mergedLog: LogEntry[] = [];
  for (const item of [...older.log, ...newer.log]) {
    const sig = `${item.t}|${item.event}|${item.xp}`;
    if (!seenLog.has(sig)) {
      seenLog.add(sig);
      mergedLog.push(item);
    }
  }
  mergedLog.sort((x, y) => x.t - y.t);
  const trimmedLog = mergedLog.slice(-2000);
  const logSumXp = mergedLog.reduce((sum, x) => sum + (x.xp || 0), 0);

  return {
    v: 1,
    started: older.started <= newer.started ? older.started : newer.started,
    updatedAt: Math.max(older.updatedAt ?? 0, newer.updatedAt ?? 0),
    resetAt: newer.resetAt ?? older.resetAt,
    xp: Math.max(older.xp, newer.xp, logSumXp),
    lessons,
    skippedModules,
    skippedLessons,
    skippedQuizzes,
    quiz,
    quizWrong: newer.quizWrong.length || !olderIsBlank ? [...newer.quizWrong] : [...older.quizWrong],
    exercises,
    catalog,
    cards,
    drills,
    log: trimmedLog,
  };
}

export function getLocalMirrorKey(slot: ProgressSlotId): string {
  return LOCAL_MIRROR_KEYS[slot];
}

export function readLocalProgressMirror(slot: ProgressSlotId): WpState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_MIRROR_KEYS[slot]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WpState>;
    return normalizeWpState(parsed);
  } catch {
    return null;
  }
}

export function writeLocalProgressMirror(slot: ProgressSlotId, state: WpState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(LOCAL_MIRROR_KEYS[slot], JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn(`[durableProgressStorage] Không ghi được LocalStorage (${slot}):`, e);
    return false;
  }
}

export function clearLocalProgressMirror(slot: ProgressSlotId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCAL_MIRROR_KEYS[slot]);
  } catch {
    // ignore
  }
}

async function readIdbProgress(slot: ProgressSlotId): Promise<{ state: WpState | null; ok: boolean }> {
  try {
    const db = await getDb();
    if (slot === 'wp') {
      const rec = await db.get('wp_state', 'main');
      return { state: rec?.state ? normalizeWpState(rec.state) : null, ok: true };
    }
    const rec = await db.get('course_state', slot);
    return { state: rec?.state ? normalizeWpState(rec.state) : null, ok: true };
  } catch (e) {
    console.warn(`[durableProgressStorage] Không đọc được IndexedDB (${slot}):`, e);
    return { state: null, ok: false };
  }
}

async function writeIdbProgress(slot: ProgressSlotId, state: WpState): Promise<boolean> {
  try {
    const db = await getDb();
    if (slot === 'wp') {
      await db.put('wp_state', { key: 'main', state });
    } else {
      await db.put('course_state', { courseId: slot, state });
    }
    return true;
  } catch (e) {
    console.error(`[durableProgressStorage] Không ghi được IndexedDB (${slot}):`, e);
    return false;
  }
}

/** Hàng đợi ghi IndexedDB theo từng slot để ghi ngay lập tức mà không chồng chéo transaction */
const inflightQueues: Record<
  ProgressSlotId,
  { running: boolean; latest: WpState | null; listeners: ((ok: boolean) => void)[] }
> = {
  wp: { running: false, latest: null, listeners: [] },
  kube: { running: false, latest: null, listeners: [] },
  cicd: { running: false, latest: null, listeners: [] },
  pmp: { running: false, latest: null, listeners: [] },
};

function enqueueIdbWrite(slot: ProgressSlotId, state: WpState): Promise<boolean> {
  const q = inflightQueues[slot];
  q.latest = state;
  return new Promise<boolean>((resolve) => {
    q.listeners.push(resolve);
    if (q.running) return;
    q.running = true;
    void (async () => {
      let ok = true;
      while (q.latest) {
        const snap = q.latest;
        q.latest = null;
        ok = await writeIdbProgress(slot, snap);
      }
      const callbacks = q.listeners.splice(0, q.listeners.length);
      q.running = false;
      for (const cb of callbacks) cb(ok);
    })();
  });
}

/**
 * Tải tiến độ từ CẢ IndexedDB & LocalStorage, hợp nhất an toàn và tự phục hồi bên bị thiếu.
 */
export async function loadDurableProgress(
  slot: ProgressSlotId,
  inMemoryState?: WpState
): Promise<{ state: WpState; meta: StorageSyncMeta }> {
  const persistedPromise = requestBrowserPersistentStorage();
  const localState = readLocalProgressMirror(slot);
  const idbRes = await readIdbProgress(slot);

  let merged = mergeWpStates(idbRes.state, localState);
  if (inMemoryState && hasMeaningfulProgress(inMemoryState)) {
    merged = mergeWpStates(merged, inMemoryState);
  }

  let localOk = localState !== null;
  let idbOk = idbRes.ok;

  // Tự đồng bộ chéo (self-healing) nếu một trong hai nơi lưu bị thiếu hoặc cũ hơn
  if (hasMeaningfulProgress(merged)) {
    if (!localState || (localState.updatedAt ?? 0) < (merged.updatedAt ?? 0) || stateRichness(localState) < stateRichness(merged)) {
      localOk = writeLocalProgressMirror(slot, merged);
    }
    if (!idbRes.state || (idbRes.state.updatedAt ?? 0) < (merged.updatedAt ?? 0) || stateRichness(idbRes.state) < stateRichness(merged)) {
      idbOk = await enqueueIdbWrite(slot, merged);
    }
  } else {
    // Kiểm tra khả năng ghi LocalStorage nhẹ nhàng
    localOk = typeof window !== 'undefined' && Boolean(window.localStorage);
  }

  const persistedGranted = await persistedPromise;
  const lastSavedAt = merged.updatedAt && merged.updatedAt > 0 ? merged.updatedAt : null;

  return {
    state: merged,
    meta: {
      status: idbOk && localOk ? 'synced' : localOk ? 'local-only' : 'error',
      localOk,
      idbOk,
      persistedGranted,
      lastSavedAt,
    },
  };
}

/**
 * Lưu kép tức thì:
 * 1. Ghi ĐỒNG BỘ (0ms) vào LocalStorage ngay trong call stack để tắt tab đột ngột không bao giờ mất bài.
 * 2. Đẩy NGAY vào hàng đợi IndexedDB bất đồng bộ và báo trạng thái hoàn tất.
 */
export function saveDurableProgress(
  slot: ProgressSlotId,
  state: WpState,
  onMeta?: (meta: Partial<StorageSyncMeta>) => void
): Promise<boolean> {
  const now = state.updatedAt || Date.now();
  const stamped: WpState = state.updatedAt ? state : { ...state, updatedAt: now };
  const localOk = writeLocalProgressMirror(slot, stamped);

  onMeta?.({
    status: 'saving',
    localOk,
    lastSavedAt: now,
  });

  return enqueueIdbWrite(slot, stamped).then((idbOk) => {
    onMeta?.({
      status: idbOk && localOk ? 'synced' : localOk ? 'local-only' : 'error',
      localOk,
      idbOk,
      lastSavedAt: now,
    });
    return localOk || idbOk;
  });
}

export async function clearDurableProgress(slot: ProgressSlotId): Promise<WpState> {
  const now = Date.now();
  const fresh: WpState = {
    ...emptyState(),
    updatedAt: now,
    resetAt: now,
  };
  writeLocalProgressMirror(slot, fresh);
  try {
    const db = await getDb();
    if (slot === 'wp') {
      await db.put('wp_state', { key: 'main', state: fresh });
    } else {
      await db.put('course_state', { courseId: slot, state: fresh });
    }
  } catch (e) {
    console.warn(`[durableProgressStorage] Lỗi xoá IndexedDB (${slot}):`, e);
  }
  return fresh;
}
