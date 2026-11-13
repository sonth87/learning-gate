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
  /** Tiến độ các khoá học khác theo courseId ('kube' | 'cicd' | 'pmp') */
  course_state: {
    key: string;
    value: { courseId: string; state: WpState };
  };
}

const DB_NAME = 'pylearn_mastery_db';
const DB_VERSION = 3;
const IDB_OPEN_TIMEOUT_MS = 1800;

let dbPromise: Promise<IDBPDatabase<PyLearnDBSchema>> | null = null;

function ensureSchema(db: IDBPDatabase<PyLearnDBSchema>): void {
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
  if (!db.objectStoreNames.contains('course_state')) {
    db.createObjectStore('course_state', { keyPath: 'courseId' });
  }
}

function openAtVersion(version?: number): Promise<IDBPDatabase<PyLearnDBSchema>> {
  return new Promise<IDBPDatabase<PyLearnDBSchema>>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      dbPromise = null;
      reject(new Error(`IndexedDB "${DB_NAME}" open timed out after ${IDB_OPEN_TIMEOUT_MS}ms.`));
    }, IDB_OPEN_TIMEOUT_MS);

    openDB<PyLearnDBSchema>(DB_NAME, version, {
      upgrade(db) {
        ensureSchema(db);
      },
      blocked() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        dbPromise = null;
        reject(new Error(`IndexedDB "${DB_NAME}" upgrade is blocked by another open tab.`));
      },
      blocking(_currentVersion, _blockedVersion, event) {
        const targetDb = event.target as IDBDatabase | null;
        try {
          targetDb?.close();
        } catch {
          // ignore
        }
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    })
      .then((db) => {
        if (settled) {
          try {
            db.close();
          } catch {
            // ignore
          }
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(db);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        dbPromise = null;
        reject(err);
      });
  });
}

async function openDbWithGuard(): Promise<IDBPDatabase<PyLearnDBSchema>> {
  try {
    return await openAtVersion(DB_VERSION);
  } catch (err) {
    // Nếu trình duyệt từng nâng cấp lên version > DB_VERSION (VersionError), mở theo version hiện có của trình duyệt
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'VersionError') {
      return await openAtVersion(undefined);
    }
    throw err;
  }
}

export function getDb(): Promise<IDBPDatabase<PyLearnDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDbWithGuard();
  }
  return dbPromise;
}
