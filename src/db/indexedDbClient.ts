import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ExerciseSubmissionRecord,
  UserBookmark,
  UserNote,
} from '@/types/user.types';
import { ExamAttemptRecord, FlashcardSrsState } from '@/types/assessment.types';
import type { WpState } from '@/features/workpath/types';

export interface PyLearnDBSchema extends DBSchema {
  notes: {
    key: string;
    value: UserNote;
    indexes: { 'by-target': string };
  };
  bookmarks: {
    key: string;
    value: UserBookmark;
    indexes: { 'by-target': string };
  };
  completed_lessons: {
    key: string;
    value: { lessonId: string; completedAt: number };
  };
  submissions: {
    key: string;
    value: ExerciseSubmissionRecord;
  };
  srs_states: {
    key: string;
    value: FlashcardSrsState;
  };
  exam_history: {
    key: string;
    value: ExamAttemptRecord;
    indexes: { 'by-exam': string };
  };
  /** Tiến độ đường học WorkPath: một bản ghi duy nhất, khoá 'main' */
  wp_state: {
    key: string;
    value: { key: string; state: WpState };
  };
}

const DB_NAME = 'pylearn_mastery_db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<PyLearnDBSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<PyLearnDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PyLearnDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('by-target', 'targetId');
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bmStore.createIndex('by-target', 'targetId');
        }
        if (!db.objectStoreNames.contains('completed_lessons')) {
          db.createObjectStore('completed_lessons', { keyPath: 'lessonId' });
        }
        if (!db.objectStoreNames.contains('submissions')) {
          db.createObjectStore('submissions', { keyPath: 'exerciseId' });
        }
        if (!db.objectStoreNames.contains('srs_states')) {
          db.createObjectStore('srs_states', { keyPath: 'cardId' });
        }
        if (!db.objectStoreNames.contains('exam_history')) {
          const examStore = db.createObjectStore('exam_history', { keyPath: 'id' });
          examStore.createIndex('by-exam', 'examId');
        }
        if (!db.objectStoreNames.contains('wp_state')) {
          db.createObjectStore('wp_state', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}
