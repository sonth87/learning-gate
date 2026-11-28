import React, { useEffect, useRef, useState } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Code2,
  Bookmark,
  MessageSquarePlus,
  X,
  ArrowRightLeft,
  Pin,
  GripHorizontal,
} from 'lucide-react';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import {
  useNavigationStore,
  type ActiveTermPopover,
  type PinnedTermPopover,
} from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { CategoryBadge, LevelBadge } from './LevelBadge';
import { getAppContainerWidth, getAppContainerHeight } from '@/utils/viewport';
import { cn } from '@/utils/cn';
import { useShallow } from 'zustand/react/shallow';

interface AnchorRect {
  top: number;
  left: number;
  bottom: number;
  width: number;
}

function computeInitialCoords(
  anchorRect: AnchorRect,
  viewportWidth: number,
  viewportHeight: number
): { left: number; top: number; cardWidth: number } {
  let rootLeft = 0;
  let rootTop = 0;
  if (typeof document !== 'undefined') {
    const rootEl = document.querySelector('.pylearn-root') as HTMLElement | null;
    if (rootEl) {
      const r = rootEl.getBoundingClientRect();
      rootLeft = r.left;
      rootTop = r.top;
    }
  }

  const cardWidth = Math.min(430, Math.max(280, viewportWidth - 24));
  const relLeft = anchorRect.left - rootLeft;
  const relTop = anchorRect.top - rootTop;
  const relBottom = anchorRect.bottom - rootTop;

  const left = Math.min(
    Math.max(12, relLeft - 40),
    Math.max(12, viewportWidth - cardWidth - 12)
  );
  const showAbove = relBottom + 380 > viewportHeight;
  const top = showAbove
    ? Math.max(12, relTop - 360)
    : Math.min(Math.max(12, relBottom + 10), Math.max(12, viewportHeight - 160));

  return { left, top, cardWidth };
}

interface TermCardInstanceProps {
  termId: string;
  pinned: boolean;
  pinnedId?: string;
  anchorRect: AnchorRect;
  savedPosition?: { left: number; top: number };
  zIndex: number;
  viewportWidth: number;
  viewportHeight: number;
  isTouchOrTablet: boolean;
  onClose: () => void;
  onPinFromHover?: () => void;
  onFocusPinned?: () => void;
  onCommitPosition?: (pos: { left: number; top: number }) => void;
  onKeepHoverOpen?: () => void;
  onHoverLeave?: () => void;
}

const TermPopoverCard: React.FC<TermCardInstanceProps> = ({
  termId,
  pinned,
  anchorRect,
  savedPosition,
  zIndex,
  viewportWidth,
  viewportHeight,
  isTouchOrTablet,
  onClose,
  onPinFromHover,
  onFocusPinned,
  onCommitPosition,
  onKeepHoverOpen,
  onHoverLeave,
}) => {
  const showTermPopover = useNavigationStore((s) => s.showTermPopover);
  const openNotesDrawer = useNavigationStore((s) => s.openNotesDrawer);
  const showJsTsComparison = useSettingsStore((s) => s.showJsTsComparison);
  const bookmarks = useUserDataStore((s) => s.bookmarks);
  const toggleBookmark = useUserDataStore((s) => s.toggleBookmark);
  const lang = useWorkbenchStore((s) => s.language);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const initial = computeInitialCoords(anchorRect, viewportWidth, viewportHeight);
  const cardWidth = initial.cardWidth;
  const resolvedLeft = Math.min(
    Math.max(8, savedPosition ? savedPosition.left : initial.left),
    Math.max(8, viewportWidth - cardWidth - 8)
  );
  const resolvedTop = Math.min(
    Math.max(8, savedPosition ? savedPosition.top : initial.top),
    Math.max(8, viewportHeight - 72)
  );

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    curLeft: number;
    curTop: number;
  } | null>(null);

  useEffect(() => {
    if (!pinned || isTouchOrTablet) return;
    if (!savedPosition && onCommitPosition) {
      onCommitPosition({ left: resolvedLeft, top: resolvedTop });
    }
    // Only commit once on mount if no savedPosition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const term = GLOSSARY_BY_ID[termId];
  if (!term) return null;

  const isBookmarked = bookmarks.some(
    (b) => b.targetType === 'glossary' && b.targetId === term.id
  );

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pinned || isTouchOrTablet || e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest('button, a, [data-no-drag="true"]')) return;

    e.preventDefault();
    e.stopPropagation();
    onFocusPinned?.();

    const curLeft = resolvedLeft;
    const curTop = resolvedTop;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: curLeft,
      origTop: curTop,
      curLeft,
      curTop,
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    const maxLeft = Math.max(8, getAppContainerWidth() - cardWidth - 8);
    const maxTop = Math.max(8, getAppContainerHeight() - 72);
    const nextLeft = Math.max(8, Math.min(maxLeft, st.origLeft + dx));
    const nextTop = Math.max(8, Math.min(maxTop, st.origTop + dy));
    st.curLeft = nextLeft;
    st.curTop = nextTop;
    if (cardRef.current) {
      cardRef.current.style.left = `${nextLeft}px`;
      cardRef.current.style.top = `${nextTop}px`;
    }
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(st.pointerId);
    } catch {
      // ignore
    }
    dragRef.current = null;
    setIsDragging(false);
    onCommitPosition?.({ left: st.curLeft, top: st.curTop });
  };

  const renderCardContent = () => (
    <>
      {/* Header (draggable when pinned on desktop) */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
        className={cn(
          'flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5',
          pinned &&
            !isTouchOrTablet &&
            (isDragging
              ? 'cursor-grabbing select-none'
              : 'cursor-grab select-none')
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {pinned && !isTouchOrTablet && (
              <GripHorizontal
                className="h-3.5 w-3.5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            )}
            <CategoryBadge category={term.category} />
            <LevelBadge level={term.level} />
            {pinned && !isTouchOrTablet && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                <Pin className="h-2.5 w-2.5" aria-hidden="true" /> {lang === 'en' ? 'Pinned' : 'Đã ghim'}
              </span>
            )}
          </div>
          <h4 className="font-mono text-base font-bold text-white truncate">
            {term.term}
          </h4>
        </div>

        <div
          data-no-drag="true"
          onPointerDown={(e) => e.stopPropagation()}
          className="flex shrink-0 items-center gap-1"
        >
          {!pinned && !isTouchOrTablet && onPinFromHover && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPinFromHover();
              }}
              aria-label={lang === 'en' ? 'Pin term popup' : 'Ghim popup thuật ngữ'}
              title={lang === 'en' ? 'Pin to keep open and drag to move' : 'Ghim để giữ mở và kéo di chuyển'}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
            >
              <Pin className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              toggleBookmark({
                targetType: 'glossary',
                targetId: term.id,
                targetTitle: term.term,
                level: term.level,
              })
            }
            aria-label={lang === 'en' ? 'Bookmark term' : 'Đánh dấu thuật ngữ'}
            title={lang === 'en' ? 'Bookmark this term' : 'Đánh dấu thuật ngữ này'}
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
            type="button"
            onClick={() => {
              onClose();
              openNotesDrawer('glossary', term.id, `${lang === 'en' ? 'Term' : 'Thuật ngữ'}: ${term.term}`);
            }}
            aria-label={lang === 'en' ? 'Add note' : 'Thêm ghi chú'}
            title={lang === 'en' ? 'Add personal note for this term' : 'Thêm ghi chú cá nhân cho thuật ngữ này'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'en' ? 'Close' : 'Đóng'}
            title={lang === 'en' ? 'Close' : 'Đóng'}
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
            <span>{lang === 'en' ? 'Mental Model:' : 'Hình tượng hóa (Mental Model):'}</span>
          </div>
          <p className="text-amber-100/90">{term.analogy}</p>
        </div>

        {/* Code Example */}
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1">
            <Code2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>{lang === 'en' ? 'Syntax Example:' : 'Ví dụ cú pháp chuẩn:'}</span>
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
              <span>{lang === 'en' ? 'Common Gotcha:' : 'Cẩn thận Bẫy / Lỗi phổ biến:'}</span>
            </div>
            <p className="text-rose-100/90">{term.commonGotcha}</p>
          </div>
        )}

        {/* JS/TS Equivalent if enabled */}
        {showJsTsComparison && term.jsEquivalent && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{lang === 'en' ? 'JS/TS Equivalent:' : 'Đối chiếu JS/TS:'}</span>
              <code className="font-mono text-cyan-100">{term.jsEquivalent}</code>
            </div>
          </div>
        )}

        {/* Related Terms */}
        {term.relatedTerms.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">{lang === 'en' ? 'Related:' : 'Liên quan:'}</span>
            {term.relatedTerms.map((relId) => {
              const rel = GLOSSARY_BY_ID[relId];
              if (!rel) return null;
              return (
                <button
                  key={relId}
                  type="button"
                  onClick={() => {
                    const nextAnchor = cardRef.current
                      ? {
                          top: resolvedTop + 28,
                          left: resolvedLeft + 68,
                          bottom: resolvedTop + 44,
                          width: 80,
                        }
                      : anchorRect;
                    showTermPopover(rel.id, nextAnchor, true);
                  }}
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
        style={{ zIndex }}
        onClick={onClose}
        className="absolute inset-0 flex items-end justify-center bg-black/70 backdrop-blur-xs lg:hidden overflow-hidden"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-t-2xl border-t border-slate-700 bg-slate-900 p-4 shadow-2xl"
        >
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-700" />
          {renderCardContent()}
        </div>
      </div>
    );
  }

  // Desktop Floating Popover (>= 1024px) — Draggable when pinned!
  return (
    <div
      ref={cardRef}
      data-term-popover-id={termId}
      data-term-pinned={pinned ? 'true' : 'false'}
      style={{
        top: resolvedTop,
        left: resolvedLeft,
        width: cardWidth,
        zIndex,
        touchAction: pinned ? 'none' : undefined,
      }}
      onPointerDown={() => {
        if (pinned) onFocusPinned?.();
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onKeepHoverOpen}
      onMouseLeave={() => {
        if (!pinned) {
          onHoverLeave?.();
        }
      }}
      className={cn(
        'fixed rounded-xl border bg-slate-900/95 p-4 shadow-2xl shadow-black/70 backdrop-blur-md',
        pinned
          ? 'border-amber-500/45 ring-1 ring-amber-400/20'
          : 'border-slate-700/90 animate-in fade-in zoom-in-95 duration-150',
        isDragging && 'shadow-[0_24px_48px_rgba(0,0,0,0.85)]'
      )}
    >
      {renderCardContent()}
    </div>
  );
};

export const TermPopover: React.FC = () => {
  const {
    activePopover,
    pinnedPopovers,
    hideTermPopover,
    keepTermPopoverOpen,
    pinActivePopover,
    closePinnedPopover,
    bringPinnedPopoverToFront,
    updatePinnedPopoverPosition,
  } = useNavigationStore(
    useShallow((s) => ({
      activePopover: s.activePopover as ActiveTermPopover | null,
      pinnedPopovers: s.pinnedPopovers as PinnedTermPopover[],
      hideTermPopover: s.hideTermPopover,
      keepTermPopoverOpen: s.keepTermPopoverOpen,
      pinActivePopover: s.pinActivePopover,
      closePinnedPopover: s.closePinnedPopover,
      bringPinnedPopoverToFront: s.bringPinnedPopoverToFront,
      updatePinnedPopoverPosition: s.updatePinnedPopoverPosition,
    }))
  );

  if (!activePopover && pinnedPopovers.length === 0) return null;

  const viewportWidth = getAppContainerWidth();
  const viewportHeight = getAppContainerHeight();
  const isTouchOrTablet = viewportWidth < 1024;

  // On mobile/tablet bottom sheet, show the most recently focused/pinned popover (or active hover)
  if (isTouchOrTablet) {
    const topPinned =
      pinnedPopovers.length > 0
        ? [...pinnedPopovers].sort((a, b) => b.zIndex - a.zIndex)[0]
        : null;
    const sheetItem = topPinned
      ? {
          termId: topPinned.termId,
          pinned: true,
          anchorRect: topPinned.anchorRect,
          zIndex: topPinned.zIndex,
          onClose: () => closePinnedPopover(topPinned.id),
        }
      : activePopover
        ? {
            termId: activePopover.termId,
            pinned: activePopover.pinned,
            anchorRect: activePopover.anchorRect,
            zIndex: 90,
            onClose: () => hideTermPopover(true),
          }
        : null;

    if (!sheetItem) return null;

    return (
      <TermPopoverCard
        key={`sheet-${sheetItem.termId}`}
        termId={sheetItem.termId}
        pinned={sheetItem.pinned}
        anchorRect={sheetItem.anchorRect}
        zIndex={sheetItem.zIndex}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        isTouchOrTablet={true}
        onClose={sheetItem.onClose}
      />
    );
  }

  return (
    <>
      {pinnedPopovers.map((pop) => (
        <TermPopoverCard
          key={`pinned-${pop.id}`}
          termId={pop.termId}
          pinned={true}
          pinnedId={pop.id}
          anchorRect={pop.anchorRect}
          savedPosition={pop.position}
          zIndex={pop.zIndex}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          isTouchOrTablet={false}
          onClose={() => closePinnedPopover(pop.id)}
          onFocusPinned={() => bringPinnedPopoverToFront(pop.id)}
          onCommitPosition={(pos) => updatePinnedPopoverPosition(pop.id, pos)}
        />
      ))}

      {activePopover &&
        !pinnedPopovers.some((p) => p.termId === activePopover.termId) && (
          <TermPopoverCard
            key={`hover-${activePopover.termId}`}
            termId={activePopover.termId}
            pinned={false}
            anchorRect={activePopover.anchorRect}
            zIndex={200}
            viewportWidth={viewportWidth}
            viewportHeight={viewportHeight}
            isTouchOrTablet={false}
            onClose={() => hideTermPopover(true)}
            onPinFromHover={pinActivePopover}
            onKeepHoverOpen={keepTermPopoverOpen}
            onHoverLeave={() => hideTermPopover(false)}
          />
        )}
    </>
  );
};
