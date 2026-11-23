import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebaseClient';
import { getDb } from './indexedDbClient';
import {
  hasMeaningfulProgress,
  loadDurableProgress,
  mergeWpStates,
  normalizeWpState,
  saveDurableProgress,
  stateRichness,
  type ProgressSlotId,
} from './durableProgressStorage';
import type { WpState } from '@/features/workpath/types';
import type {
  ExerciseSubmissionRecord,
  UserBookmark,
  UserNote,
  UserSettings,
} from '@/types/user.types';
import type { ExamAttemptRecord, FlashcardSrsState } from '@/types/assessment.types';

export const ALL_PROGRESS_SLOTS: ProgressSlotId[] = ['wp', 'kube', 'cicd', 'pmp', 'redis'];

const LESSON_STUDY_SECONDS_STORAGE_KEY = 'pylearn_lesson_study_seconds_v1';
const SETTINGS_UPDATED_AT_KEY = 'pylearn_settings_updated_at_v1';

export interface ClassicUserDataPayload {
  completedLessonIds: string[];
  lessonStudySeconds: Record<string, number>;
  notes: UserNote[];
  bookmarks: UserBookmark[];
  submissions: Record<string, ExerciseSubmissionRecord>;
  srsStates: Record<string, FlashcardSrsState>;
  examHistory: ExamAttemptRecord[];
  updatedAt: number;
}

export interface CloudSettingsPayload {
  settings: UserSettings;
  updatedAt: number;
}

function progressDocRef(uid: string, docId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firestore is not configured.');
  return doc(db, 'users', uid, 'progress', docId);
}

export function getLocalSettingsUpdatedAt(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(SETTINGS_UPDATED_AT_KEY);
    const num = raw ? Number(raw) : 0;
    return Number.isFinite(num) ? num : 0;
  } catch {
    return 0;
  }
}

export function setLocalSettingsUpdatedAt(ts: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_UPDATED_AT_KEY, String(ts));
  } catch {
    // Ignore storage quota errors
  }
}

export async function pushSlotToCloud(
  uid: string,
  slot: ProgressSlotId,
  state: WpState
): Promise<void> {
  const updatedAt = state.updatedAt || Date.now();
  await setDoc(progressDocRef(uid, `slot_${slot}`), {
    state,
    updatedAt,
  });
}

export async function pullSlotFromCloud(
  uid: string,
  slot: ProgressSlotId
): Promise<WpState | null> {
  const snap = await getDoc(progressDocRef(uid, `slot_${slot}`));
  if (!snap.exists()) return null;
  const data = snap.data() as { state?: Partial<WpState>; updatedAt?: number } | undefined;
  if (!data?.state) return null;
  return normalizeWpState({
    ...data.state,
    updatedAt: data.state.updatedAt ?? data.updatedAt ?? 0,
  });
}

export async function syncSlotWithCloud(
  uid: string,
  slot: ProgressSlotId,
  inMemoryState?: WpState
): Promise<{ state: WpState; cloudUpdated: boolean; localUpdated: boolean }> {
  const { state: localState } = await loadDurableProgress(slot, inMemoryState);
  const cloudState = await pullSlotFromCloud(uid, slot);

  if (!cloudState) {
    if (hasMeaningfulProgress(localState) || localState.resetAt) {
      await pushSlotToCloud(uid, slot, localState);
      return { state: localState, cloudUpdated: true, localUpdated: false };
    }
    return { state: localState, cloudUpdated: false, localUpdated: false };
  }

  const merged = mergeWpStates(localState, cloudState);

  const localNeedsUpdate =
    (merged.updatedAt ?? 0) > (localState.updatedAt ?? 0) ||
    stateRichness(merged) > stateRichness(localState) ||
    (merged.resetAt ?? 0) > (localState.resetAt ?? 0);

  const cloudNeedsUpdate =
    (merged.updatedAt ?? 0) > (cloudState.updatedAt ?? 0) ||
    stateRichness(merged) > stateRichness(cloudState) ||
    (merged.resetAt ?? 0) > (cloudState.resetAt ?? 0);

  if (localNeedsUpdate) {
    await saveDurableProgress(slot, merged, undefined, { skipCloudPush: true });
  }
  if (cloudNeedsUpdate) {
    await pushSlotToCloud(uid, slot, merged);
  }

  return {
    state: merged,
    cloudUpdated: cloudNeedsUpdate,
    localUpdated: localNeedsUpdate,
  };
}

function readLocalStudySeconds(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LESSON_STUDY_SECONDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeLocalStudySeconds(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LESSON_STUDY_SECONDS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export async function exportLocalClassicUserData(): Promise<ClassicUserDataPayload> {
  const db = await getDb();
  const [completedLessons, notes, bookmarks, submissionsArr, srsArr, examHistory] =
    await Promise.all([
      db.getAll('completed_lessons'),
      db.getAll('notes'),
      db.getAll('bookmarks'),
      db.getAll('submissions'),
      db.getAll('srs_states'),
      db.getAll('exam_history'),
    ]);

  const submissions: Record<string, ExerciseSubmissionRecord> = {};
  for (const sub of submissionsArr) {
    submissions[sub.exerciseId] = sub;
  }

  const srsStates: Record<string, FlashcardSrsState> = {};
  for (const srs of srsArr) {
    srsStates[srs.cardId] = srs;
  }

  return {
    completedLessonIds: completedLessons.map((c) => c.lessonId),
    lessonStudySeconds: readLocalStudySeconds(),
    notes,
    bookmarks,
    submissions,
    srsStates,
    examHistory,
    updatedAt: Date.now(),
  };
}

function hasClassicUserData(data: ClassicUserDataPayload): boolean {
  return (
    data.completedLessonIds.length > 0 ||
    Object.keys(data.lessonStudySeconds).length > 0 ||
    data.notes.length > 0 ||
    data.bookmarks.length > 0 ||
    Object.keys(data.submissions).length > 0 ||
    Object.keys(data.srsStates).length > 0 ||
    data.examHistory.length > 0
  );
}

export function mergeClassicUserData(
  local: ClassicUserDataPayload,
  cloud: ClassicUserDataPayload
): ClassicUserDataPayload {
  const completedLessonIds = Array.from(
    new Set([...(local.completedLessonIds ?? []), ...(cloud.completedLessonIds ?? [])])
  );

  const lessonStudySeconds: Record<string, number> = { ...(cloud.lessonStudySeconds ?? {}) };
  for (const [lessonId, sec] of Object.entries(local.lessonStudySeconds ?? {})) {
    lessonStudySeconds[lessonId] = Math.max(lessonStudySeconds[lessonId] ?? 0, sec ?? 0);
  }

  const noteMap = new Map<string, UserNote>();
  for (const n of [...(cloud.notes ?? []), ...(local.notes ?? [])]) {
    const prev = noteMap.get(n.id);
    if (!prev || (n.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) {
      noteMap.set(n.id, n);
    }
  }

  const bookmarkMap = new Map<string, UserBookmark>();
  for (const b of [...(cloud.bookmarks ?? []), ...(local.bookmarks ?? [])]) {
    if (!bookmarkMap.has(b.id)) bookmarkMap.set(b.id, b);
  }

  const submissions: Record<string, ExerciseSubmissionRecord> = { ...(cloud.submissions ?? {}) };
  for (const [exId, sub] of Object.entries(local.submissions ?? {})) {
    const prev = submissions[exId];
    if (!prev) {
      submissions[exId] = sub;
    } else if (sub.passed && !prev.passed) {
      submissions[exId] = sub;
    } else if (prev.passed && !sub.passed) {
      submissions[exId] = prev;
    } else if ((sub.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) {
      submissions[exId] = sub;
    }
  }

  const srsStates: Record<string, FlashcardSrsState> = { ...(cloud.srsStates ?? {}) };
  for (const [cardId, srs] of Object.entries(local.srsStates ?? {})) {
    const prev = srsStates[cardId];
    if (!prev) {
      srsStates[cardId] = srs;
    } else if ((srs.lastReviewedAt ?? 0) > (prev.lastReviewedAt ?? 0)) {
      srsStates[cardId] = srs;
    } else if (
      (srs.lastReviewedAt ?? 0) === (prev.lastReviewedAt ?? 0) &&
      (srs.reviewCount ?? 0) > (prev.reviewCount ?? 0)
    ) {
      srsStates[cardId] = srs;
    }
  }

  const examMap = new Map<string, ExamAttemptRecord>();
  for (const ex of [...(cloud.examHistory ?? []), ...(local.examHistory ?? [])]) {
    if (!examMap.has(ex.id)) examMap.set(ex.id, ex);
  }

  return {
    completedLessonIds,
    lessonStudySeconds,
    notes: Array.from(noteMap.values()),
    bookmarks: Array.from(bookmarkMap.values()),
    submissions,
    srsStates,
    examHistory: Array.from(examMap.values()).sort((a, b) => b.completedAt - a.completedAt),
    updatedAt: Math.max(local.updatedAt ?? 0, cloud.updatedAt ?? 0, Date.now()),
  };
}

async function writeMergedClassicUserDataToLocal(merged: ClassicUserDataPayload): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ['completed_lessons', 'notes', 'bookmarks', 'submissions', 'srs_states', 'exam_history'],
    'readwrite'
  );

  const now = Date.now();
  await Promise.all([
    ...merged.completedLessonIds.map((lessonId) =>
      tx.objectStore('completed_lessons').put({ lessonId, completedAt: now })
    ),
    ...merged.notes.map((n) => tx.objectStore('notes').put(n)),
    ...merged.bookmarks.map((b) => tx.objectStore('bookmarks').put(b)),
    ...Object.values(merged.submissions).map((s) => tx.objectStore('submissions').put(s)),
    ...Object.values(merged.srsStates).map((s) => tx.objectStore('srs_states').put(s)),
    ...merged.examHistory.map((e) => tx.objectStore('exam_history').put(e)),
  ]);
  await tx.done;
  writeLocalStudySeconds(merged.lessonStudySeconds);
}

export async function pushClassicUserDataToCloud(uid: string): Promise<void> {
  const payload = await exportLocalClassicUserData();
  await setDoc(progressDocRef(uid, 'classic_userdata'), payload);
}

export async function syncClassicUserDataWithCloud(uid: string): Promise<boolean> {
  const local = await exportLocalClassicUserData();
  const snap = await getDoc(progressDocRef(uid, 'classic_userdata'));

  if (!snap.exists()) {
    if (hasClassicUserData(local)) {
      await setDoc(progressDocRef(uid, 'classic_userdata'), local);
    }
    return false;
  }

  const cloud = snap.data() as ClassicUserDataPayload;
  const merged = mergeClassicUserData(local, cloud);
  await writeMergedClassicUserDataToLocal(merged);

  const cloudCount =
    (cloud.completedLessonIds?.length ?? 0) +
    (cloud.notes?.length ?? 0) +
    (cloud.bookmarks?.length ?? 0) +
    Object.keys(cloud.submissions ?? {}).length +
    Object.keys(cloud.srsStates ?? {}).length +
    (cloud.examHistory?.length ?? 0);

  const mergedCount =
    merged.completedLessonIds.length +
    merged.notes.length +
    merged.bookmarks.length +
    Object.keys(merged.submissions).length +
    Object.keys(merged.srsStates).length +
    merged.examHistory.length;

  const studySum = (m: Record<string, number> | undefined) =>
    Object.values(m ?? {}).reduce((acc, v) => acc + (v || 0), 0);

  if (
    mergedCount > cloudCount ||
    studySum(merged.lessonStudySeconds) > studySum(cloud.lessonStudySeconds)
  ) {
    await setDoc(progressDocRef(uid, 'classic_userdata'), merged);
  }

  return true;
}

export async function pushSettingsToCloud(uid: string, settings: UserSettings): Promise<void> {
  const now = Date.now();
  setLocalSettingsUpdatedAt(now);
  await setDoc(progressDocRef(uid, 'settings'), {
    settings,
    updatedAt: now,
  } satisfies CloudSettingsPayload);
}

export async function syncSettingsWithCloud(
  uid: string,
  localSettings: UserSettings
): Promise<UserSettings | null> {
  const snap = await getDoc(progressDocRef(uid, 'settings'));
  const localUpdatedAt = getLocalSettingsUpdatedAt();

  if (!snap.exists()) {
    await pushSettingsToCloud(uid, localSettings);
    return null;
  }

  const cloud = snap.data() as Partial<CloudSettingsPayload>;
  if (cloud?.settings && (cloud.updatedAt ?? 0) > localUpdatedAt) {
    setLocalSettingsUpdatedAt(cloud.updatedAt ?? Date.now());
    return cloud.settings;
  }

  if (localUpdatedAt > (cloud.updatedAt ?? 0)) {
    await pushSettingsToCloud(uid, localSettings);
  }
  return null;
}
