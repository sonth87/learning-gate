import { getDb } from './indexedDbClient';
import { ExamAttemptRecord } from '@/types/assessment.types';

export const examRepo = {
  async getAllAttempts(): Promise<ExamAttemptRecord[]> {
    const db = await getDb();
    const all = await db.getAll('exam_history');
    return all.sort((a, b) => b.completedAt - a.completedAt);
  },

  async saveAttempt(
    attempt: Omit<ExamAttemptRecord, 'id' | 'completedAt'>
  ): Promise<ExamAttemptRecord> {
    const db = await getDb();
    const now = Date.now();
    const record: ExamAttemptRecord = {
      ...attempt,
      id: `exam_att_${now}_${Math.random().toString(36).slice(2, 6)}`,
      completedAt: now,
    };
    await db.put('exam_history', record);
    return record;
  },
};
