import { getDb } from './indexedDbClient';
import { TargetEntityType, UserNote } from '@/types/user.types';

export const notesRepo = {
  async getAllNotes(): Promise<UserNote[]> {
    const db = await getDb();
    const all = await db.getAll('notes');
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getNotesByTarget(targetId: string): Promise<UserNote[]> {
    const db = await getDb();
    const list = await db.getAllFromIndex('notes', 'by-target', targetId);
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async saveNote(params: {
    id?: string;
    targetType: TargetEntityType;
    targetId: string;
    targetTitle: string;
    content: string;
  }): Promise<UserNote> {
    const db = await getDb();
    const now = Date.now();
    const existing = params.id ? await db.get('notes', params.id) : undefined;
    const note: UserNote = {
      id: params.id || `note_${now}_${Math.random().toString(36).slice(2, 7)}`,
      targetType: params.targetType,
      targetId: params.targetId,
      targetTitle: params.targetTitle,
      content: params.content,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    await db.put('notes', note);
    return note;
  },

  async deleteNote(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('notes', id);
  },
};
