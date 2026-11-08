import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Code2,
  Bookmark,
  MessageSquarePlus,
  X,
  ArrowRightLeft,
  Pin,
} from 'lucide-react';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { CategoryBadge, LevelBadge } from './LevelBadge';
import { cn } from '@/utils/cn';

export const TermPopover: React.FC = () => {
  const activePopover = useNavigationStore((s) => s.activePopover);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);
  const showTermPopover = useNavigationStore((s) => s.showTermPopover);
  const keepTermPopoverOpen = useNavigationStore((s) => s.keepTermPopoverOpen);
  const openNotesDrawer = useNavigationStore((s) => s.openNotesDrawer);
  const showJsTsComparison = useSettingsStore((s) => s.showJsTsComparison);

  const bookmarks = useUserDataStore((s) => s.bookmarks);
  const toggleBookmark = useUserDataStore((s) => s.toggleBookmark);

  if (!activePopover) return null;

  const term = GLOSSARY_BY_ID[activePopover.termId];
  if (!term) return null;

  const isBookmarked = bookmarks.some(
    (b) => b.targetType === 'glossary' && b.targetId === term.id
  );

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isTouchOrTablet = viewportWidth < 1024;

  const cardWidth = Math.min(440, viewportWidth - 24);
  const left = Math.min(
    Math.max(12, activePopover.anchorRect.left - 40),
    viewportWidth - cardWidth - 12
  );

  const showAbove = activePopover.anchorRect.bottom + 380 > viewportHeight;
  const top = showAbove
    ? Math.max(12, activePopover.anchorRect.top - 360)
    : activePopover.anchorRect.bottom + 10;

  const renderCardContent = () => (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <CategoryBadge category={term.category} />
            <LevelBadge level={term.level} />
            {activePopover.pinned && !isTouchOrTablet && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                <Pin className="h-2.5 w-2.5" aria-hidden="true" /> Đã ghim
              </span>
            )}
          </div>
          <h4 className="font-mono text-base font-bold text-white">
            {term.term}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              toggleBookmark({
                targetType: 'glossary',
                targetId: term.id,
                targetTitle: term.term,
                level: term.level,
              })
            }
            aria-label="Đánh dấu thuật ngữ"
            title="Đánh dấu thuật ngữ này"
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              isBookmarked
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => {
              hideTermPopover(true);
              openNotesDrawer('glossary', term.id, `Thuật ngữ: ${term.term}`);
            }}
            aria-label="Thêm ghi chú"
            title="Thêm ghi chú cá nhân cho thuật ngữ này"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => hideTermPopover(true)}
            aria-label="Đóng"
            title="Đóng"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-2.5 space-y-2.5 max-h-[60vh] sm:max-h-[340px] overflow-y-auto pr-1 text-xs leading-relaxed">
        <p className="font-medium text-slate-100">{term.shortSummary}</p>
        <p className="text-slate-300">{term.detailedExplanation}</p>

        {/* Visual Analogy */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
            <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Hình tượng hóa (Mental Model):</span>
          </div>
          <p className="text-amber-100/90">{term.analogy}</p>
        </div>

        {/* Code Example */}
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1">
            <Code2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Ví dụ cú pháp chuẩn:</span>
          </div>
          <pre className="overflow-x-auto font-mono text-[11px] text-sky-200">
            <code>{term.syntaxExample}</code>
          </pre>
        </div>

        {/* Common Gotcha */}
        {term.commonGotcha && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-rose-300 mb-0.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Cẩn thận Bẫy / Lỗi phổ biến:</span>
            </div>
            <p className="text-rose-100/90">{term.commonGotcha}</p>
          </div>
        )}

        {/* JS/TS Equivalent if enabled */}
        {showJsTsComparison && term.jsEquivalent && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Đối chiếu JS/TS:</span>
              <code className="font-mono text-cyan-100">{term.jsEquivalent}</code>
            </div>
          </div>
        )}

        {/* Related Terms */}
        {term.relatedTerms.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Liên quan:</span>
            {term.relatedTerms.map((relId) => {
              const rel = GLOSSARY_BY_ID[relId];
              if (!rel) return null;
              return (
                <button
                  key={relId}
                  onClick={() =>
                    showTermPopover(rel.id, activePopover.anchorRect, true)
                  }
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-sky-300 hover:border-sky-500/50 hover:bg-slate-700"
                >
                  {rel.term}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  // Mobile & Tablet Bottom Sheet (< 1024px)
  if (isTouchOrTablet) {
    return (
      <div
        onClick={() => hideTermPopover(true)}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs lg:hidden"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-t-2xl border-t border-slate-700 bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
        >
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-700" />
          {renderCardContent()}
        </div>
      </div>
    );
  }

  // Desktop Floating Popover (>= 640px)
  return (
    <div
      style={{ top, left, width: cardWidth }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={keepTermPopoverOpen}
      onMouseLeave={() => {
        if (!activePopover.pinned) {
          hideTermPopover(false);
        }
      }}
      className="fixed z-50 rounded-xl border border-slate-700/90 bg-slate-900/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
    >
      {renderCardContent()}
    </div>
  );
};
