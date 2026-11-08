import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  BookOpen,
  Code2,
  Sparkles,
  ArrowRight,
  Eye,
  CornerDownLeft,
} from 'lucide-react';
import { ALL_LESSONS } from '@/data/curriculum';
import { ALL_GLOSSARY_TERMS } from '@/data/glossary';
import { ALL_EXERCISES } from '@/data/practice/exercisesData';
import { STAGE_MAP } from '@/constants/stages';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { CategoryBadge, LevelBadge } from './LevelBadge';
import { cn } from '@/utils/cn';

type SearchCategory = 'all' | 'terms' | 'lessons' | 'exercises';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    selectLesson,
    selectExercise,
    setActiveTab,
    showTermPopover,
  } = useNavigationStore();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Global shortcut listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  // Filter terms
  const matchedTerms = q
    ? ALL_GLOSSARY_TERMS.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.shortSummary.toLowerCase().includes(q) ||
          t.detailedExplanation.toLowerCase().includes(q) ||
          (t.aliases && t.aliases.some((a) => a.toLowerCase().includes(q)))
      ).slice(0, 10)
    : ALL_GLOSSARY_TERMS.slice(0, 6);

  // Filter lessons
  const matchedLessons = q
    ? ALL_LESSONS.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.shortDescription.toLowerCase().includes(q) ||
          l.theoryParagraphs.some((p) => p.toLowerCase().includes(q))
      ).slice(0, 8)
    : ALL_LESSONS.slice(0, 4);

  // Filter exercises
  const matchedExercises = q
    ? ALL_EXERCISES.filter(
        (ex) =>
          ex.title.toLowerCase().includes(q) ||
          ex.problemStatement.toLowerCase().includes(q)
      ).slice(0, 8)
    : ALL_EXERCISES.slice(0, 3);

  // Build unified item list for keyboard navigation
  type SearchItem =
    | { type: 'term'; data: (typeof matchedTerms)[0] }
    | { type: 'lesson'; data: (typeof matchedLessons)[0] }
    | { type: 'exercise'; data: (typeof matchedExercises)[0] };

  const unifiedItems: SearchItem[] = [];

  if (activeCategory === 'all' || activeCategory === 'terms') {
    matchedTerms.forEach((data) => unifiedItems.push({ type: 'term', data }));
  }
  if (activeCategory === 'all' || activeCategory === 'lessons') {
    matchedLessons.forEach((data) => unifiedItems.push({ type: 'lesson', data }));
  }
  if (activeCategory === 'all' || activeCategory === 'exercises') {
    matchedExercises.forEach((data) =>
      unifiedItems.push({ type: 'exercise', data })
    );
  }

  const handleSelectItem = (item: SearchItem) => {
    setSearchOpen(false);
    if (item.type === 'lesson') {
      selectLesson(item.data.id);
      setActiveTab('curriculum');
    } else if (item.type === 'exercise') {
      selectExercise(item.data.id);
      setActiveTab('practice');
    } else if (item.type === 'term') {
      setActiveTab('glossary');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < unifiedItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : unifiedItems.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (unifiedItems[selectedIndex]) {
        handleSelectItem(unifiedItems[selectedIndex]);
      }
    }
  };

  const totalCount =
    matchedTerms.length + matchedLessons.length + matchedExercises.length;

  return (
    <div
      onClick={() => setSearchOpen(false)}
      className="absolute inset-0 z-[100] flex flex-col bg-slate-950 lg:items-center lg:justify-center lg:bg-black/80 lg:backdrop-blur-xs lg:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full h-full lg:h-auto lg:max-h-[min(86%,680px)] lg:max-w-2xl rounded-none lg:rounded-2xl border-0 lg:border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-3 sm:px-4 py-3 shrink-0 bg-slate-900/95">
          <Search className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm bài học, từ khóa (yield, async), hàm (print, sys)..."
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
          />

          {/* Clear query button */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              title="Xóa nội dung"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Close Modal button */}
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Đóng tìm kiếm"
            className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-extrabold text-rose-200 hover:bg-rose-500/25 hover:text-white active:scale-95 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Đóng</span>
          </button>
        </div>

        {/* Filter Category Tabs (4-column grid on mobile so all tabs fit without horizontal scrolling) */}
        <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 shrink-0 text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSelectedIndex(0);
            }}
            className={cn(
              'rounded-lg px-2 py-1.5 font-medium transition-colors text-center truncate',
              activeCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('terms');
              setSelectedIndex(0);
            }}
            className={cn(
              'rounded-lg px-2 py-1.5 font-medium transition-colors flex items-center justify-center gap-1 truncate',
              activeCategory === 'terms'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate">Thuật ngữ ({matchedTerms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('lessons');
              setSelectedIndex(0);
            }}
            className={cn(
              'rounded-lg px-2 py-1.5 font-medium transition-colors flex items-center justify-center gap-1 truncate',
              activeCategory === 'lessons'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <BookOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">Bài học ({matchedLessons.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('exercises');
              setSelectedIndex(0);
            }}
            className={cn(
              'rounded-lg px-2 py-1.5 font-medium transition-colors flex items-center justify-center gap-1 truncate',
              activeCategory === 'exercises'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            <Code2 className="h-3 w-3 shrink-0" />
            <span className="truncate">Bài tập ({matchedExercises.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {unifiedItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">
                Không tìm thấy kết quả phù hợp với &quot;{query}&quot;.
              </p>
              <p className="text-xs text-slate-500">
                Thử tìm theo từ khóa như: <code className="font-mono text-amber-300">print</code>, <code className="font-mono text-amber-300">sys</code>, <code className="font-mono text-amber-300">yield</code>, <code className="font-mono text-amber-300">list</code>...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unifiedItems.map((item, idx) => {
                const isSelected = selectedIndex === idx;

                if (item.type === 'term') {
                  const term = item.data;
                  return (
                    <div
                      key={`term-${term.id}`}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        'group flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-mono text-sm font-bold text-amber-300 group-hover:text-amber-200">
                            {term.term}
                          </span>
                          <CategoryBadge category={term.category} />
                          <LevelBadge level={term.level} />
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {term.shortSummary}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchOpen(false);
                            const r = e.currentTarget.getBoundingClientRect();
                            showTermPopover(
                              term.id,
                              {
                                top: Math.max(80, r.top - 60),
                                left: Math.max(20, r.left - 180),
                                bottom: r.bottom,
                                width: 200,
                              },
                              true
                            );
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
                          title="Xem nhanh trong popup"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'lesson') {
                  const lesson = item.data;
                  const stage = STAGE_MAP[lesson.stageId];
                  return (
                    <div
                      key={`lesson-${lesson.id}`}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        'group flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-sky-500/60 bg-sky-500/10 shadow-md ring-1 ring-sky-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="rounded bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-sky-300">
                            GĐ {stage?.number || 1} • {lesson.estimatedMinutes}p
                          </span>
                          <LevelBadge level={lesson.level} />
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-200">
                            {lesson.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {lesson.shortDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                      </div>
                    </div>
                  );
                }

                if (item.type === 'exercise') {
                  const ex = item.data;
                  return (
                    <div
                      key={`ex-${ex.id}`}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        'group flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Code2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <LevelBadge level={ex.level} />
                          <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-200">
                            {ex.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {ex.problemStatement}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 self-center">
                        <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Mobile & Tablet (< lg) Sticky Bottom Close Bar + Desktop (lg+) Shortcut Footer */}
        <div className="flex lg:hidden items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/95 px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shrink-0">
          <span className="font-mono text-xs font-bold text-amber-400">
            {totalCount} kết quả
          </span>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="flex-1 max-w-xs inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300 active:scale-98 transition-all shadow-md cursor-pointer"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>Đóng Tìm kiếm & Quay lại</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
                ↑↓
              </kbd>
              <span>Di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
                <CornerDownLeft className="h-3 w-3 inline" />
              </kbd>
              <span>Chọn</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">
                esc
              </kbd>
              <span>Đóng</span>
            </span>
          </div>

          <span className="font-mono text-[11px] text-emerald-400">
            {totalCount} kết quả
          </span>
        </div>
      </div>
    </div>
  );
};
