import React, { useState } from 'react';
import {
  X,
  MessageSquarePlus,
  Trash2,
  Bookmark,
  StickyNote,
  Save,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from './LevelBadge';

export const NotesDrawer: React.FC = () => {
  const { notesDrawerTarget, closeNotesDrawer, selectLesson, selectExercise } =
    useNavigationStore();
  const { notes, bookmarks, addOrUpdateNote, removeNote, toggleBookmark } =
    useUserDataStore();

  const [draft, setDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'all_notes' | 'bookmarks'>('current');

  if (!notesDrawerTarget.isOpen) return null;

  const targetNotes = notes.filter(
    (n) => n.targetId === notesDrawerTarget.targetId
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await addOrUpdateNote({
      targetType: notesDrawerTarget.targetType,
      targetId: notesDrawerTarget.targetId,
      targetTitle: notesDrawerTarget.targetTitle,
      content: draft.trim(),
    });
    setDraft('');
  };

  return (
    <div
      onClick={closeNotesDrawer}
      className="fixed inset-0 z-[120] flex justify-end bg-black/75 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full lg:max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl pb-[env(safe-area-inset-bottom)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-3.5 sm:px-5 py-3 sm:py-4">
          <div className="flex items-center gap-2 min-w-0">
            <StickyNote className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                Ghi chú & Đánh dấu (IndexedDB)
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-[260px]">
                {notesDrawerTarget.targetTitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeNotesDrawer}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-500/40 shrink-0"
          >
            <X className="h-4 w-4" />
            <span>Đóng</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/50 p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('current')}
            className={`rounded-lg py-2 transition-colors ${
              activeTab === 'current'
                ? 'bg-slate-800 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mục đang xem ({targetNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('all_notes')}
            className={`rounded-lg py-2 transition-colors ${
              activeTab === 'all_notes'
                ? 'bg-slate-800 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mọi ghi chú ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`rounded-lg py-2 transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-slate-800 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã lưu ({bookmarks.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'current' && (
            <>
              <form onSubmit={handleSave} className="space-y-2.5">
                <label className="block text-xs font-medium text-slate-300">
                  Thêm ghi chú / bình luận cá nhân cho mục này:
                </label>
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ghi lại ý tưởng, đoạn code mẫu hoặc điểm cần nhớ..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu vào IndexedDB</span>
                </button>
              </form>

              <div className="space-y-2.5 pt-2">
                {targetNotes.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">
                    Chưa có ghi chú nào cho mục này.
                  </p>
                ) : (
                  targetNotes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {new Date(n.updatedAt).toLocaleString('vi-VN')}
                        </span>
                        <button
                          onClick={() => removeNote(n.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {n.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'all_notes' && (
            <div className="space-y-2.5">
              {notes.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  Bạn chưa tạo ghi chú nào.
                </p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-300 truncate">
                        {n.targetTitle}
                      </span>
                      <button
                        onClick={() => removeNote(n.id)}
                        className="text-rose-400 hover:text-rose-300 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="space-y-2.5">
              {bookmarks.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  Chưa có mục đánh dấu (Bookmark) nào.
                </p>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3"
                  >
                    <button
                      onClick={() => {
                        if (bm.targetType === 'lesson') {
                          selectLesson(bm.targetId);
                          closeNotesDrawer();
                        } else if (bm.targetType === 'exercise') {
                          selectExercise(bm.targetId);
                          closeNotesDrawer();
                        }
                      }}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <LevelBadge level={bm.level} />
                        <span className="text-[10px] uppercase text-slate-500">
                          {bm.targetType}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate hover:text-amber-300">
                        {bm.targetTitle}
                      </p>
                    </button>
                    <button
                      onClick={() =>
                        toggleBookmark({
                          targetType: bm.targetType,
                          targetId: bm.targetId,
                          targetTitle: bm.targetTitle,
                          level: bm.level,
                        })
                      }
                      className="text-amber-400 hover:text-rose-400 p-1"
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
