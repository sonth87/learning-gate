import { getDb } from './indexedDbClient';
import { FullBackupPayload, UserSettings } from '@/types/user.types';

export const backupService = {
  async exportBackup(currentSettings: UserSettings): Promise<FullBackupPayload> {
    const db = await getDb();
    const [completedLessons, notes, bookmarks, submissions, srsStates, examHistory] =
      await Promise.all([
        db.getAll('completed_lessons'),
        db.getAll('notes'),
        db.getAll('bookmarks'),
        db.getAll('submissions'),
        db.getAll('srs_states'),
        db.getAll('exam_history'),
      ]);

    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      settings: currentSettings,
      completedLessonIds: completedLessons.map((c) => c.lessonId),
      notes,
      bookmarks,
      submissions,
      srsStates,
      examHistory,
    };
  },

  async importBackup(payload: FullBackupPayload): Promise<void> {
    const db = await getDb();

    const tx = db.transaction(
      [
        'completed_lessons',
        'notes',
        'bookmarks',
        'submissions',
        'srs_states',
        'exam_history',
      ],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore('completed_lessons').clear(),
      tx.objectStore('notes').clear(),
      tx.objectStore('bookmarks').clear(),
      tx.objectStore('submissions').clear(),
      tx.objectStore('srs_states').clear(),
      tx.objectStore('exam_history').clear(),
    ]);

    for (const lessonId of payload.completedLessonIds || []) {
      await tx.objectStore('completed_lessons').put({
        lessonId,
        completedAt: payload.exportedAt || Date.now(),
      });
    }
    for (const note of payload.notes || []) {
      await tx.objectStore('notes').put(note);
    }
    for (const bm of payload.bookmarks || []) {
      await tx.objectStore('bookmarks').put(bm);
    }
    for (const sub of payload.submissions || []) {
      await tx.objectStore('submissions').put(sub);
    }
    for (const srs of payload.srsStates || []) {
      await tx.objectStore('srs_states').put(srs);
    }
    for (const exam of payload.examHistory || []) {
      await tx.objectStore('exam_history').put(exam);
    }

    await tx.done;
  },
};
