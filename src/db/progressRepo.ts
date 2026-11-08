import { getDb } from './indexedDbClient';
import {
  ExerciseSubmissionRecord,
  TargetEntityType,
  UserBookmark,
} from '@/types/user.types';
import { SkillLevel } from '@/types/curriculum.types';

export const progressRepo = {
  async getCompletedLessonIds(): Promise<string[]> {
    const db = await getDb();
    const records = await db.getAll('completed_lessons');
    return records.map((r) => r.lessonId);
  },

  async toggleLessonCompleted(lessonId: string): Promise<boolean> {
    const db = await getDb();
    const existing = await db.get('completed_lessons', lessonId);
    if (existing) {
      await db.delete('completed_lessons', lessonId);
      return false;
    } else {
      await db.put('completed_lessons', { lessonId, completedAt: Date.now() });
      return true;
    }
  },

  async getAllBookmarks(): Promise<UserBookmark[]> {
    const db = await getDb();
    const list = await db.getAll('bookmarks');
    return list.sort((a, b) => b.createdAt - a.createdAt);
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
    const db = await getDb();
    const all = await db.getAll('submissions');
    return all.reduce((acc, item) => {
      acc[item.exerciseId] = item;
      return acc;
    }, {} as Record<string, ExerciseSubmissionRecord>);
  },

  async saveSubmission(
    exerciseId: string,
    code: string,
    passed: boolean
  ): Promise<ExerciseSubmissionRecord> {
    const db = await getDb();
    const record: ExerciseSubmissionRecord = {
      exerciseId,
      code,
      passed,
      updatedAt: Date.now(),
    };
    await db.put('submissions', record);
    return record;
  },
};
