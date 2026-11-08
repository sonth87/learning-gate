import React, { useState } from 'react';
import {
  BookMarked,
  Search,
  Lightbulb,
  AlertTriangle,
  Bookmark,
  MessageSquarePlus,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronsDownUp,
  Sparkles,
} from 'lucide-react';
import { ALL_GLOSSARY_TERMS, GLOSSARY_BY_ID } from '@/data/glossary';
import { GlossaryCategory } from '@/types/glossary.types';
import { SkillLevel } from '@/types/curriculum.types';
import { SKILL_LEVELS } from '@/constants/levels';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { CategoryBadge, LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

const CATEGORY_FILTERS: { id: GlossaryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'keyword', label: 'Từ khóa (Keywords)' },
  { id: 'declaration', label: 'Khai báo & Cú pháp' },
  { id: 'builtin_func', label: 'Hàm Tích hợp (Built-ins)' },
  { id: 'stdlib', label: 'Thư viện Chuẩn (Standard Library)' },
  { id: 'method', label: 'Phương thức (Methods)' },
  { id: 'builtin_type', label: 'Kiểu Dữ liệu (Types)' },
  { id: 'dunder', label: 'Dunder / Magic Methods' },
  { id: 'concept', label: 'Khái niệm & Cơ chế' },
  { id: 'ecosystem', label: 'Công cụ & Hệ sinh thái' },
];

export const GlossaryExplorer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'collapsed' | 'expanded'>('collapsed');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { openNotesDrawer, showTermPopover } = useNavigationStore();
  const { showJsTsComparison } = useSettingsStore();
  const { bookmarks, toggleBookmark } = useUserDataStore();

  const filtered = ALL_GLOSSARY_TERMS.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (level !== 'all' && item.level !== level) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        item.term.toLowerCase().includes(q) ||
        item.shortSummary.toLowerCase().includes(q) ||
        item.detailedExplanation.toLowerCase().includes(q) ||
        item.analogy.toLowerCase().includes(q) ||
        (item.aliases && item.aliases.some((a) => a.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const toggleCardExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllViewMode = () => {
    if (viewMode === 'collapsed') {
      setViewMode('expanded');
      setExpandedIds(new Set(filtered.map((t) => t.id)));
    } else {
      setViewMode('collapsed');
      setExpandedIds(new Set());
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 space-y-6">
      {/* Header & Search */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
              <BookMarked className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
                Hệ thống Từ khóa, Hàm Tích hợp, Thư viện Chuẩn & Dunder
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
                  {ALL_GLOSSARY_TERMS.length} mục
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Tra cứu nhanh bản chất, hình tượng hóa thực tế, ví dụ code thực thi và các cạm bẫy thường gặp.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lọc từ khóa, sys, os, dis, print, json..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category & Level Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:flex-wrap">
            {CATEGORY_FILTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all',
                  category === c.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:flex-wrap">
            <button
              onClick={() => setLevel('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
                level === 'all'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              Mọi cấp độ
            </button>
            {SKILL_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
                  level === l.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold">{filtered.length}</span>
            <span>mục phù hợp</span>
            {search && (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-amber-300">
                Từ khóa: &quot;{search}&quot;
              </span>
            )}
          </div>

          {/* Expand All / Collapse All Toggle Button */}
          <button
            onClick={toggleAllViewMode}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/60 hover:bg-slate-800 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
          >
            {viewMode === 'expanded' ? (
              <>
                <ChevronsDownUp className="h-4 w-4 text-amber-400" />
                <span>Thu gọn tất cả</span>
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-4 w-4 text-emerald-400" />
                <span>Trải tất cả ra (Chi tiết)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {filtered.map((term) => {
          const isBookmarked = bookmarks.some(
            (b) => b.targetType === 'glossary' && b.targetId === term.id
          );
          const isExpanded =
            viewMode === 'expanded' || expandedIds.has(term.id);

          return (
            <div
              key={term.id}
              className={cn(
                'rounded-2xl border transition-all duration-200 flex flex-col justify-between',
                isExpanded
                  ? 'border-slate-700 bg-slate-900/80 p-5 space-y-4 shadow-lg ring-1 ring-amber-500/20'
                  : 'border-slate-800/90 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-900/70'
              )}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => toggleCardExpand(term.id)}
                    className="cursor-pointer group select-none flex-1 min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <CategoryBadge category={term.category} />
                      <LevelBadge level={term.level} showVi />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-base sm:text-lg font-extrabold text-amber-300 group-hover:text-amber-200 transition-colors">
                        {term.term}
                      </h3>
                      {term.aliases && term.aliases.length > 0 && (
                        <span className="hidden sm:inline font-mono text-[11px] text-slate-500 truncate">
                          ({term.aliases[0]})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        toggleBookmark({
                          targetType: 'glossary',
                          targetId: term.id,
                          targetTitle: term.term,
                          level: term.level,
                        })
                      }
                      className={cn(
                        'rounded-lg p-1.5 transition-colors cursor-pointer',
                        isBookmarked
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      )}
                      title="Đánh dấu"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        openNotesDrawer(
                          'glossary',
                          term.id,
                          `Thuật ngữ: ${term.term}`
                        )
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                      title="Ghi chú cá nhân"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </button>
                    {/* Expand/Collapse Accordion Trigger */}
                    <button
                      onClick={() => toggleCardExpand(term.id)}
                      className={cn(
                        'rounded-lg p-1.5 transition-colors cursor-pointer',
                        isExpanded
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      )}
                      title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Short Summary (Always visible) */}
                <p
                  onClick={() => toggleCardExpand(term.id)}
                  className={cn(
                    'mt-2 text-xs text-slate-300 cursor-pointer select-none leading-relaxed',
                    !isExpanded && 'line-clamp-2 text-slate-400'
                  )}
                >
                  {term.shortSummary}
                </p>

                {/* Collapsed Hint */}
                {!isExpanded && (
                  <div
                    onClick={() => toggleCardExpand(term.id)}
                    className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400/80 hover:text-emerald-300 cursor-pointer transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Bấm để mở rộng ví dụ code, hình tượng hóa & lưu ý</span>
                  </div>
                )}

                {/* EXPANDED CONTENT AREA */}
                {isExpanded && (
                  <div className="space-y-3.5 pt-3.5 mt-3 border-t border-slate-800/80">
                    {/* Detailed Explanation */}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {term.detailedExplanation}
                    </p>

                    {/* Analogy */}
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                        <span>Hình tượng hóa (Mental Model):</span>
                      </div>
                      <p className="text-amber-100/90 leading-relaxed">
                        {term.analogy}
                      </p>
                    </div>

                    {/* Syntax Example */}
                    <div>
                      <div className="mb-1 text-[11px] font-mono text-slate-400 font-semibold">
                        Ví dụ cú pháp Python:
                      </div>
                      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-sky-200 leading-5">
                        <code>{term.syntaxExample}</code>
                      </pre>
                    </div>

                    {/* Common Gotcha */}
                    {term.commonGotcha && (
                      <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-300">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Bẫy & Lỗi phổ biến (Gotchas):</span>
                        </div>
                        <p className="text-rose-100/90 leading-relaxed">
                          {term.commonGotcha}
                        </p>
                      </div>
                    )}

                    {/* JS/TS Comparison */}
                    {showJsTsComparison && term.jsEquivalent && (
                      <div className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                        <span>
                          <strong>Tương đương JS/TS / Node.js:</strong>{' '}
                          <code className="font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded text-cyan-300">
                            {term.jsEquivalent}
                          </code>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Related Terms (Only shown when expanded) */}
              {isExpanded && term.relatedTerms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-3 mt-3">
                  <span className="text-[11px] text-slate-400">Liên kết:</span>
                  {term.relatedTerms.map((rId) => {
                    const rel = GLOSSARY_BY_ID[rId];
                    if (!rel) return null;
                    return (
                      <button
                        key={rId}
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          showTermPopover(
                            rel.id,
                            {
                              top: r.top,
                              left: r.left,
                              bottom: r.bottom,
                              width: r.width,
                            },
                            true
                          );
                        }}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-sky-300 hover:border-amber-400/60 transition-colors"
                      >
                        {rel.term}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
