import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Search,
  Lightbulb,
  AlertTriangle,
  Bookmark,
  MessageSquarePlus,
  ArrowRightLeft,
  Package,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns,
  X,
  Code2,
  Filter,
  Zap,
} from 'lucide-react';
import { ALL_GLOSSARY_TERMS, GLOSSARY_BY_ID } from '@/data/glossary';
import { PYTHON_LIBRARIES_CATALOG } from '@/data/libraries/pythonLibrariesCatalog';
import { QUICK_SYNTAX_DECLARATIONS } from '@/data/glossary/quickSyntaxDeclarationsData';
import { PythonLibrariesEncyclopedia } from '@/components/libraries/PythonLibrariesEncyclopedia';
import { PythonQuickSyntaxGuide } from '@/components/glossary/PythonQuickSyntaxGuide';
import { GlossaryCategory, GlossaryTerm } from '@/types/glossary.types';
import { SkillLevel } from '@/types/curriculum.types';
import { SKILL_LEVELS } from '@/constants/levels';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { CategoryBadge, LevelBadge } from '@/components/common/LevelBadge';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

const CATEGORY_FILTERS: { id: GlossaryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả danh mục' },
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

const GlossaryDetailCard: React.FC<{
  term: GlossaryTerm;
  isBookmarked: boolean;
  showJsTsComparison: boolean;
  onToggleBookmark: () => void;
  onOpenNotes: () => void;
  onSelectRelatedTerm: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}> = ({
  term,
  isBookmarked,
  showJsTsComparison,
  onToggleBookmark,
  onOpenNotes,
  onSelectRelatedTerm,
  index,
  total,
  onPrev,
  onNext,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(term.syntaxExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 overflow-hidden shadow-xl flex flex-col justify-between">
      <div>
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500" />

        {/* Header */}
        <div className="border-b border-slate-800/90 bg-slate-950/70 p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={term.category} />
              <LevelBadge level={term.level} showVi />
            </div>

            <div className="flex items-center gap-1.5">
              {typeof index === 'number' &&
                typeof total === 'number' &&
                total > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <span className="font-mono text-xs text-slate-400 mr-1">
                      {index + 1} / {total}
                    </span>
                    <button
                      type="button"
                      onClick={onPrev}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Mục trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onNext}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Mục tiếp theo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

              <button
                type="button"
                onClick={onToggleBookmark}
                className={cn(
                  'inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                  isBookmarked
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
                title="Đánh dấu thuật ngữ"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {isBookmarked ? 'Đã lưu' : 'Lưu'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenNotes}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                title="Ghi chú cá nhân"
              >
                <MessageSquarePlus className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Ghi chú</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="font-mono text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">
                {term.term}
              </h2>
              {term.aliases && term.aliases.length > 0 && (
                <span className="font-mono text-xs text-slate-400">
                  ({term.aliases.join(', ')})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
              {term.shortSummary}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Detailed Explanation */}
          <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 space-y-1.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              📖 Bản chất & Giải thích Chi tiết
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {term.detailedExplanation}
            </p>
          </div>

          {/* Analogy + Gotcha Grid */}
          <div
            className={cn(
              'grid grid-cols-1 gap-3.5',
              term.commonGotcha && 'lg:grid-cols-2'
            )}
          >
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Hình tượng hóa (Mental Model)</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed">
                {term.analogy}
              </p>
            </div>

            {term.commonGotcha && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>Bẫy & Lỗi phổ biến cần tránh</span>
                </div>
                <p className="text-xs sm:text-sm text-rose-100/95 leading-relaxed">
                  {term.commonGotcha}
                </p>
              </div>
            )}
          </div>

          {/* Syntax-Highlighted Code Block */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#090d16] shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/90 px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <Code2 className="h-3.5 w-3.5 text-emerald-400 ml-1" />
                <span>Ví dụ Cú pháp & Cách dùng Python</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã copy</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="ide-dark-surface overflow-x-auto p-4 font-mono text-xs leading-relaxed select-text">
              <code>{renderHighlightedPython(term.syntaxExample, false)}</code>
            </pre>
          </div>

          {/* Conditional JS/TS Equivalent */}
          {showJsTsComparison && term.jsEquivalent && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-500/35 bg-cyan-950/20 px-4 py-3 text-xs text-cyan-200">
              <ArrowRightLeft className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="font-bold text-cyan-300">
                Tương đương bên JS/TS / Node.js:
              </span>
              <code className="font-mono bg-slate-950 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-cyan-200">
                {term.jsEquivalent}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Related Terms */}
      {term.relatedTerms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 bg-slate-950/60 px-5 py-3">
          <span className="text-[11px] font-semibold text-slate-400">
            Thuật ngữ liên quan:
          </span>
          {term.relatedTerms.map((rId) => {
            const rel = GLOSSARY_BY_ID[rId];
            if (!rel) return null;
            return (
              <button
                key={rId}
                type="button"
                onClick={(e) => onSelectRelatedTerm(rel.id, e)}
                className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300 hover:border-amber-400/60 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {rel.term}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const GlossaryExplorer: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'quick-syntax' | 'libraries' | 'glossary'
  >('quick-syntax');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [level, setLevel] = useState<SkillLevel | 'all'>('all');
  const [layoutMode, setLayoutMode] = useState<'studio' | 'grid'>('studio');
  const [selectedTermId, setSelectedTermId] = useState<string>(
    ALL_GLOSSARY_TERMS[0]?.id || ''
  );
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  const { openNotesDrawer, showTermPopover } = useNavigationStore();
  const { showJsTsComparison, toggleJsTsComparison } = useSettingsStore();
  const { bookmarks, toggleBookmark } = useUserDataStore();

  const filtered = useMemo(() => {
    return ALL_GLOSSARY_TERMS.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (level !== 'all' && item.level !== level) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          item.term.toLowerCase().includes(q) ||
          item.shortSummary.toLowerCase().includes(q) ||
          item.detailedExplanation.toLowerCase().includes(q) ||
          item.analogy.toLowerCase().includes(q) ||
          (item.aliases &&
            item.aliases.some((a) => a.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [category, level, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_GLOSSARY_TERMS.length };
    for (const t of ALL_GLOSSARY_TERMS) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_GLOSSARY_TERMS.length };
    for (const t of ALL_GLOSSARY_TERMS) {
      counts[t.level] = (counts[t.level] || 0) + 1;
    }
    return counts;
  }, []);

  const activeIndex = useMemo(() => {
    const idx = filtered.findIndex((t) => t.id === selectedTermId);
    return idx >= 0 ? idx : 0;
  }, [filtered, selectedTermId]);

  const activeTerm = filtered[activeIndex];

  const handleSelectRelatedTerm = (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const existsInFiltered = filtered.some((t) => t.id === id);
    if (layoutMode === 'studio' && existsInFiltered) {
      setSelectedTermId(id);
    } else if (layoutMode === 'studio') {
      setCategory('all');
      setLevel('all');
      setSearch('');
      setSelectedTermId(id);
    } else {
      const r = e.currentTarget.getBoundingClientRect();
      showTermPopover(
        id,
        {
          top: r.top,
          left: r.left,
          bottom: r.bottom,
          width: r.width,
        },
        true
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] p-3 sm:p-6 space-y-3.5 sm:space-y-5">
      {/* Top Studio Header & Section Switcher */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-amber-500/15 border border-fuchsia-500/40 text-fuchsia-300 shadow-inner">
              <BookMarked className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <h1 className="text-xs sm:text-xl font-extrabold text-white tracking-tight">
                Cú pháp & Khai báo Nhanh, Thư viện & Từ điển Python
              </h1>
              <p className="hidden sm:block text-xs text-slate-400">
                Xem nhanh <strong>{QUICK_SYNTAX_DECLARATIONS.length} mẫu Khai báo & Cú pháp Quick & Easy (python.org)</strong>, tra cứu <strong>{PYTHON_LIBRARIES_CATALOG.length} nhóm Thư viện Chuẩn & Thực chiến</strong> cùng <strong>{ALL_GLOSSARY_TERMS.length} Từ khóa, Built-ins & Dunder</strong>.
              </p>
            </div>
          </div>

          {/* Section Switcher Pills (3 compact columns on mobile instead of 3 tall stacked rows!) */}
          <div className="grid grid-cols-3 lg:inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1 gap-1 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('quick-syntax')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer truncate',
                activeSection === 'quick-syntax'
                  ? 'bg-amber-400 text-[#020617] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">Cú pháp ({QUICK_SYNTAX_DECLARATIONS.length})</span>
              <span className="hidden sm:inline">
                Khai báo & Cú pháp Nhanh ({QUICK_SYNTAX_DECLARATIONS.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('libraries')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer truncate',
                activeSection === 'libraries'
                  ? 'bg-emerald-500 text-[#020617] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">Thư viện ({PYTHON_LIBRARIES_CATALOG.length})</span>
              <span className="hidden sm:inline">
                Thư viện Chuẩn & Thực chiến ({PYTHON_LIBRARIES_CATALOG.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('glossary')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer truncate',
                activeSection === 'glossary'
                  ? 'bg-sky-400 text-[#020617] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <BookMarked className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">Từ điển ({ALL_GLOSSARY_TERMS.length})</span>
              <span className="hidden sm:inline">
                Từ điển Từ khóa & Built-ins ({ALL_GLOSSARY_TERMS.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 0: QUICK & EASY TO LEARN + SYNTAX & DECLARATIONS GUIDE */}
      {activeSection === 'quick-syntax' ? (
        <PythonQuickSyntaxGuide />
      ) : activeSection === 'libraries' ? (
        /* SECTION 1: PYTHON LIBRARIES ENCYCLOPEDIA */
        <PythonLibrariesEncyclopedia />
      ) : (
        /* SECTION 2: PYTHON KEYWORDS, BUILT-INS & DUNDER GLOSSARY STUDIO */
        <div className="space-y-4">
          {/* Mobile & Tablet Quick Term Selector & Filter Toggle Bar (< lg) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/90 px-3.5 py-2.5 lg:hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {filtered.length > 1 && layoutMode === 'studio' && (
                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx =
                        (activeIndex - 1 + filtered.length) % filtered.length;
                      setSelectedTermId(filtered[prevIdx].id);
                    }}
                    aria-label="Mục trước"
                    className="rounded-lg p-1 text-slate-300 hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-1.5 font-mono text-[11px] font-bold text-amber-300">
                    {activeIndex + 1}/{filtered.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (activeIndex + 1) % filtered.length;
                      setSelectedTermId(filtered[nextIdx].id);
                    }}
                    aria-label="Mục tiếp theo"
                    className="rounded-lg p-1 text-slate-300 hover:bg-slate-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300 truncate">
                {activeTerm ? activeTerm.term : 'Từ điển Python'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileListOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer shrink-0',
                isMobileListOpen ||
                  category !== 'all' ||
                  level !== 'all' ||
                  search.trim() !== ''
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                  : 'border-slate-700 bg-slate-800 text-slate-200'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>
                {isMobileListOpen
                  ? 'Đóng Danh mục'
                  : `Tra cứu & Lọc (${filtered.length})`}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT PANE (4 cols on desktop, collapsible on mobile/tablet): Search, Filters & Term Directory */}
            <aside
              className={cn(
                'lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-4 space-y-4 shadow-lg',
                !isMobileListOpen && 'hidden lg:block'
              )}
            >
            {/* Search & Layout Mode Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  <Filter className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tra cứu Từ điển ({filtered.length})</span>
                </span>

                <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('studio')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                      layoutMode === 'studio'
                        ? 'bg-amber-400 text-[#020617]'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                    title="Chế độ Tra cứu 2 Cột (Master-Detail)"
                  >
                    <Columns className="h-3 w-3" />
                    <span>Chi tiết</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('grid')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer',
                      layoutMode === 'grid'
                        ? 'bg-amber-400 text-[#020617]'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                    title="Chế độ Lưới Thẻ Đầy đủ"
                  >
                    <LayoutGrid className="h-3 w-3" />
                    <span>Lưới thẻ</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm: yield, __init__, enumerate, async, uv..."
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Dropdown & Level Pills */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Phân loại Thuật ngữ:
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as GlossaryCategory | 'all')
                  }
                  aria-label="Lọc theo Phân loại"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  {CATEGORY_FILTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({categoryCounts[c.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400">
                    Cấp độ Kỹ năng:
                  </label>
                  <button
                    type="button"
                    onClick={toggleJsTsComparison}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer',
                      showJsTsComparison
                        ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    )}
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>So sánh JS/TS: {showJsTsComparison ? 'BẬT' : 'TẮT'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLevel('all')}
                    className={cn(
                      'rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer truncate',
                      level === 'all'
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                    )}
                  >
                    Tất cả ({levelCounts.all})
                  </button>
                  {SKILL_LEVELS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer truncate',
                        level === l.id
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                      )}
                    >
                      {l.label} ({levelCounts[l.id] || 0})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Term List */}
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Danh mục Thuật ngữ ({filtered.length})
                </span>
                {filtered.length > 0 && layoutMode === 'studio' && (
                  <span className="font-mono text-[11px] text-amber-300">
                    #{activeIndex + 1}/{filtered.length}
                  </span>
                )}
              </div>

              <div className="max-h-[450px] overflow-y-auto space-y-1.5 pr-1">
                {filtered.map((item) => {
                  const isSelected =
                    layoutMode === 'studio' && activeTerm?.id === item.id;
                  const isBookmarked = bookmarks.some(
                    (b) => b.targetType === 'glossary' && b.targetId === item.id
                  );

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedTermId(item.id);
                        setIsMobileListOpen(false);
                        if (layoutMode === 'grid') {
                          setLayoutMode('studio');
                        }
                      }}
                      className={cn(
                        'w-full flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/15 shadow-sm'
                          : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300 truncate">
                            {item.term}
                          </span>
                          {isBookmarked && (
                            <Bookmark className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>
                        <LevelBadge level={item.level} />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {item.shortSummary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* RIGHT PANE (8 cols): Active Term Deep-Dive OR Full Card Grid */}
          <section className="lg:col-span-8 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center space-y-3">
                <Search className="mx-auto h-8 w-8 text-slate-400" />
                <p className="text-sm font-bold text-slate-200">
                  Không tìm thấy thuật ngữ nào khớp với bộ lọc hiện tại.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('all');
                    setLevel('all');
                    setSearch('');
                  }}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-[#020617] cursor-pointer"
                >
                  Xem toàn bộ {ALL_GLOSSARY_TERMS.length} mục
                </button>
              </div>
            ) : layoutMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 items-start">
                {filtered.map((term, idx) => {
                  const isBookmarked = bookmarks.some(
                    (b) => b.targetType === 'glossary' && b.targetId === term.id
                  );
                  return (
                    <GlossaryDetailCard
                      key={term.id}
                      term={term}
                      isBookmarked={isBookmarked}
                      showJsTsComparison={showJsTsComparison}
                      onToggleBookmark={() =>
                        toggleBookmark({
                          targetType: 'glossary',
                          targetId: term.id,
                          targetTitle: term.term,
                          level: term.level,
                        })
                      }
                      onOpenNotes={() =>
                        openNotesDrawer(
                          'glossary',
                          term.id,
                          `Thuật ngữ: ${term.term}`
                        )
                      }
                      onSelectRelatedTerm={handleSelectRelatedTerm}
                      index={idx}
                      total={filtered.length}
                    />
                  );
                })}
              </div>
            ) : (
              activeTerm && (
                <GlossaryDetailCard
                  term={activeTerm}
                  isBookmarked={bookmarks.some(
                    (b) =>
                      b.targetType === 'glossary' &&
                      b.targetId === activeTerm.id
                  )}
                  showJsTsComparison={showJsTsComparison}
                  onToggleBookmark={() =>
                    toggleBookmark({
                      targetType: 'glossary',
                      targetId: activeTerm.id,
                      targetTitle: activeTerm.term,
                      level: activeTerm.level,
                    })
                  }
                  onOpenNotes={() =>
                    openNotesDrawer(
                      'glossary',
                      activeTerm.id,
                      `Thuật ngữ: ${activeTerm.term}`
                    )
                  }
                  onSelectRelatedTerm={handleSelectRelatedTerm}
                  index={activeIndex}
                  total={filtered.length}
                  onPrev={() => {
                    const prevIdx =
                      (activeIndex - 1 + filtered.length) % filtered.length;
                    setSelectedTermId(filtered[prevIdx].id);
                  }}
                  onNext={() => {
                    const nextIdx = (activeIndex + 1) % filtered.length;
                    setSelectedTermId(filtered[nextIdx].id);
                  }}
                />
              )
            )}
          </section>
          </div>
        </div>
      )}
    </div>
  );
};
