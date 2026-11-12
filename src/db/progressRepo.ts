import { getDb } from './indexedDbClient';
import { requestBrowserPersistentStorage } from './durableProgressStorage';
import {
  ExerciseSubmissionRecord,
  TargetEntityType,
  UserBookmark,
} from '@/types/user.types';
import { SkillLevel } from '@/types/curriculum.types';

const CLASSIC_LESSONS_KEY = 'pylearn_classic_completed_lessons_v1';
const CLASSIC_SUBMISSIONS_KEY = 'pylearn_classic_submissions_v1';

function readLocalClassicLessons(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CLASSIC_LESSONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeLocalClassicLessons(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLASSIC_LESSONS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // ignore
  }
}

function readLocalClassicSubmissions(): Record<string, ExerciseSubmissionRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLASSIC_SUBMISSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ExerciseSubmissionRecord>) : {};
  } catch {
    return {};
  }
}

function writeLocalClassicSubmissions(map: Record<string, ExerciseSubmissionRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLASSIC_SUBMISSIONS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export const progressRepo = {
  async getCompletedLessonIds(): Promise<string[]> {
    void requestBrowserPersistentStorage();
    const localIds = readLocalClassicLessons();
    try {
      const db = await getDb();
      const records = await db.getAll('completed_lessons');
      const idbIds = records.map((r) => r.lessonId);
      const merged = [...new Set([...idbIds, ...localIds])];
      if (merged.length > localIds.length) writeLocalClassicLessons(merged);
      if (merged.length > idbIds.length) {
        const idbSet = new Set(idbIds);
        for (const id of merged) {
          if (!idbSet.has(id)) {
            await db.put('completed_lessons', { lessonId: id, completedAt: Date.now() });
          }
        }
      }
      return merged;
    } catch {
      return localIds;
    }
  },

  async toggleLessonCompleted(lessonId: string): Promise<boolean> {
    const localSet = new Set(readLocalClassicLessons());
    try {
      const db = await getDb();
      const existing = await db.get('completed_lessons', lessonId);
      if (existing || localSet.has(lessonId)) {
        localSet.delete(lessonId);
        writeLocalClassicLessons([...localSet]);
        if (existing) await db.delete('completed_lessons', lessonId);
        return false;
      }
      localSet.add(lessonId);
      writeLocalClassicLessons([...localSet]);
      await db.put('completed_lessons', { lessonId, completedAt: Date.now() });
      return true;
    } catch {
      if (localSet.has(lessonId)) {
        localSet.delete(lessonId);
        writeLocalClassicLessons([...localSet]);
        return false;
      }
      localSet.add(lessonId);
      writeLocalClassicLessons([...localSet]);
      return true;
    }
  },

  async setLessonCompleted(lessonId: string, completed: boolean): Promise<boolean> {
    const localSet = new Set(readLocalClassicLessons());
    if (completed) localSet.add(lessonId);
    else localSet.delete(lessonId);
    writeLocalClassicLessons([...localSet]);

    try {
      const db = await getDb();
      if (!completed) {
        await db.delete('completed_lessons', lessonId);
        return false;
      }
      const existing = await db.get('completed_lessons', lessonId);
      if (!existing) {
        await db.put('completed_lessons', { lessonId, completedAt: Date.now() });
      }
    } catch {
      // LocalStorage mirror already saved
    }
    return completed;
  },

  async getAllBookmarks(): Promise<UserBookmark[]> {
    try {
      const db = await getDb();
      const list = await db.getAll('bookmarks');
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  },

  async toggleBookmark(params: {
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
    level: SkillLevel;
  }): Promise<boolean> {
    const db = await getDb();
    const id = `${params.targetType}:${params.targetId}`;
    const existing = await db.get('bookmarks', id);
    if (existing) {
      await db.delete('bookmarks', id);
      return false;
    }
    const bookmark: UserBookmark = {
      id,
      targetType: params.targetType,
      targetId: params.targetId,
      targetTitle: params.targetTitle,
      level: params.level,
      createdAt: Date.now(),
    };
    await db.put('bookmarks', bookmark);
    return true;
  },

  async getAllSubmissions(): Promise<Record<string, ExerciseSubmissionRecord>> {
    const localMap = readLocalClassicSubmissions();
    try {
      const db = await getDb();
      const all = await db.getAll('submissions');
      const idbMap = all.reduce((acc, item) => {
        acc[item.exerciseId] = item;
        return acc;
      }, {} as Record<string, ExerciseSubmissionRecord>);

      const merged: Record<string, ExerciseSubmissionRecord> = { ...idbMap };
      let needIdbSync = false;
      for (const [exId, locRec] of Object.entries(localMap)) {
        const idbRec = merged[exId];
        if (!idbRec || locRec.updatedAt > idbRec.updatedAt || (locRec.passed && !idbRec.passed)) {
          merged[exId] = {
            ...locRec,
            passed: Boolean(locRec.passed || idbRec?.passed),
          };
          needIdbSync = true;
        }
      }
      writeLocalClassicSubmissions(merged);
      if (needIdbSync) {
        for (const rec of Object.values(merged)) {
          await db.put('submissions', rec);
        }
      }
      return merged;
    } catch {
      return localMap;
    }
  },

  async saveSubmission(
    exerciseId: string,
    code: string,
    passed: boolean
  ): Promise<ExerciseSubmissionRecord> {
    const record: ExerciseSubmissionRecord = {
      exerciseId,
      code,
      passed,
      updatedAt: Date.now(),
    };
    const localMap = readLocalClassicSubmissions();
    localMap[exerciseId] = {
      ...record,
      passed: Boolean(passed || localMap[exerciseId]?.passed),
    };
    writeLocalClassicSubmissions(localMap);

    try {
      const db = await getDb();
      await db.put('submissions', localMap[exerciseId]);
    } catch {
      // LocalStorage mirror already saved
    }
    return localMap[exerciseId];
  },
};
