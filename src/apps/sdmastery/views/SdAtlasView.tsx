import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Layers,
  MessageSquarePlus,
  Scale,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSdCurriculum } from '@/features/sysdesign-course/data';
import { useSdNav } from '@/features/sysdesign-course/store';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import {
  SD_ATLAS_CATEGORIES,
  SD_ATLAS_PATTERNS,
  SD_PATTERN_LEVEL_TO_SKILL,
  type SdAtlasCategoryId,
  type SdAtlasCategoryMeta,
  type SdAtlasDifficulty,
  type SdAtlasPattern,
} from '../data/atlasPatterns';
import { useSdStore } from '../store/useSdStore';

export interface SdAtlasViewProps {
  initialTermId?: string | null;
  onOpenModule?: (moduleId: string) => void;
}

const TONE_BADGE_CLASSES: Record<SdAtlasCategoryMeta['tone'], string> = {
  blue: 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] border-[var(--dts-border-soft)]',
  green: 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border-soft)]',
  amber: 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] border-[var(--dts-border-soft)]',
  purple: 'bg-[var(--dts-purple-bg)] text-[var(--dts-purple-ink)] border-[var(--dts-border-soft)]',
  orange: 'bg-[var(--dts-orange-bg)] text-[var(--dts-orange-ink)] border-[var(--dts-border-soft)]',
  rose: 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] border-[var(--dts-border-soft)]',
};

const DIFFICULTY_STYLES: Record<
  SdAtlasDifficulty,
  { vi: string; en: string; className: string }
> = {
  Beginner: {
    vi: 'Cơ bản',
    en: 'Beginner',
    className: 'bg-[var(--dts-green-soft)] text-[var(--dts-green-ink)] border-[var(--dts-border-soft)]',
  },
  Intermediate: {
    vi: 'Trung cấp',
    en: 'Intermediate',
    className: 'bg-[var(--dts-amber-soft)] text-[var(--dts-amber-ink)] border-[var(--dts-border-soft)]',
  },
  Advanced: {
    vi: 'Nâng cao',
    en: 'Advanced',
    className: 'bg-[var(--dts-purple-soft)] text-[var(--dts-purple-ink)] border-[var(--dts-border-soft)]',
  },
};

const ATLAS_I18N = {
  vi: {
    badge: 'TỪ ĐIỂN MẪU & THUẬT NGỮ KIẾN TRÚC',
    title: 'Từ điển Mẫu Thiết kế Hệ thống (Pattern Atlas)',
    subtitle:
      'Tra cứu nhanh cơ chế hoạt động, điều kiện áp dụng, đánh đổi kỹ thuật, lỗi thường gặp và công thức cấu hình cho các mẫu kiến trúc phân tán.',
    searchPlaceholder:
      'Tìm mẫu, thuật ngữ, bí danh hoặc mã bài (VD: Singleflight, Raft, Quorum, Outbox, p99, S2-02)...',
    allCategories: 'Tất cả nhóm',
    allLevels: 'Mọi cấp độ',
    bookmarkedOnly: 'Đã đánh dấu',
    showingCount: (shown: number, total: number) => `Hiển thị ${shown} / ${total} mẫu`,
    resetFilters: 'Đặt lại bộ lọc',
    emptyTitle: 'Không tìm thấy mẫu phù hợp với bộ lọc hiện tại.',
    emptyHint: 'Hãy thử từ khóa ngắn hơn hoặc đặt lại bộ lọc nhóm / đánh dấu.',
    openPopover: 'Mở Popover nổi',
    openPopoverHint: 'Mở thẻ giải nghĩa nổi có thể ghim và kéo di chuyển trên màn hình',
    notesBtn: 'Ghi chú',
    notesCount: (n: number) => `Ghi chú (${n})`,
    bookmarkBtn: 'Đánh dấu',
    bookmarkedBtn: 'Đã lưu',
    studyModule: (modId: string) => `Học bài ${modId}`,
    aliasesLabel: 'Tên gọi / Từ khóa:',
    sectionConcept: 'Khái niệm & Cơ chế hoạt động',
    sectionWhenToUse: 'Khi nào nên dùng',
    sectionTradeoffs: 'Đánh đổi kỹ thuật (Trade-offs)',
    sectionGotcha: 'Điểm hỏng thường gặp (Gotcha)',
    sectionSnippet: 'Công thức / Cấu hình mẫu',
    sectionRelated: 'Mẫu thiết kế liên quan',
    copyBtn: 'Sao chép',
    copiedBtn: 'Đã chép',
  },
  en: {
    badge: 'SYSTEM DESIGN PATTERN ATLAS & GLOSSARY',
    title: 'System Design Pattern Atlas',
    subtitle:
      'Reference mechanisms, applicability rules, engineering trade-offs, common failure modes, and formulas/configs across distributed system patterns.',
    searchPlaceholder:
      'Search patterns, aliases, mechanisms, or module IDs (e.g. Singleflight, Raft, Quorum, Outbox, p99, S2-02)...',
    allCategories: 'All Categories',
    allLevels: 'All Levels',
    bookmarkedOnly: 'Bookmarked',
    showingCount: (shown: number, total: number) => `Showing ${shown} of ${total} patterns`,
    resetFilters: 'Reset filters',
    emptyTitle: 'No patterns match the current filters.',
    emptyHint: 'Try clearing the search query or switching category / bookmark filters.',
    openPopover: 'Open Popover',
    openPopoverHint: 'Open a draggable floating glossary card',
    notesBtn: 'Notes',
    notesCount: (n: number) => `Notes (${n})`,
    bookmarkBtn: 'Bookmark',
    bookmarkedBtn: 'Saved',
    studyModule: (modId: string) => `Study ${modId}`,
    aliasesLabel: 'Aliases / Tokens:',
    sectionConcept: 'Concept & Mechanism',
    sectionWhenToUse: 'When to Use',
    sectionTradeoffs: 'Engineering Trade-offs',
    sectionGotcha: 'Common Failure Mode (Gotcha)',
    sectionSnippet: 'Formula / Reference Config',
    sectionRelated: 'Related Patterns',
    copyBtn: 'Copy',
    copiedBtn: 'Copied',
  },
} as const;

const CATEGORY_MAP: Record<SdAtlasCategoryId, SdAtlasCategoryMeta> = SD_ATLAS_CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SdAtlasCategoryId, SdAtlasCategoryMeta>
);

const PATTERN_BY_ID: Record<string, SdAtlasPattern> = SD_ATLAS_PATTERNS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, SdAtlasPattern>
);

export const SdAtlasView: React.FC<SdAtlasViewProps> = ({ initialTermId, onOpenModule }) => {
  const { lang, setCourseCursor, setExpandedLevel } = useWorkbenchStore(
    useShallow((s) => ({
      lang: s.language,
      setCourseCursor: s.setCourseCursor,
      setExpandedLevel: s.setExpandedLevel,
    }))
  );
  const { bookmarks, notes, toggleBookmark } = useUserDataStore(
    useShallow((s) => ({
      bookmarks: s.bookmarks,
      notes: s.notes,
      toggleBookmark: s.toggleBookmark,
    }))
  );
  const openNotesDrawer = useNavigationStore((s) => s.openNotesDrawer);
  const setActiveTab = useSdStore((s) => s.setActiveTab);
  const goSd = useSdNav((s) => s.go);
  const { data: curriculum } = useSdCurriculum();

  const t = ATLAS_I18N[lang];

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SdAtlasCategoryId>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | SdAtlasDifficulty>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialTermId && PATTERN_BY_ID[initialTermId]) {
      return initialTermId;
    }
    return SD_ATLAS_PATTERNS[0].id;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const detailScrollRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (initialTermId && PATTERN_BY_ID[initialTermId]) {
      setSelectedId(initialTermId);
      setSelectedCategory('all');
      setSelectedDifficulty('all');
      setOnlyBookmarked(false);
      setQuery('');
      requestAnimationFrame(() => {
        itemRefs.current[initialTermId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
  }, [initialTermId]);

  const moduleTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (curriculum?.modules) {
      for (const m of curriculum.modules) {
        map[m.id] = lang === 'en' && m.titleEn ? m.titleEn : m.title;
      }
    }
    return map;
  }, [curriculum, lang]);

  const moduleLevelMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (curriculum?.modules) {
      for (const m of curriculum.modules) {
        map[m.id] = m.level;
      }
    }
    return map;
  }, [curriculum]);

  const bookmarkedIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookmarks) {
      if (b.targetType === 'glossary') {
        set.add(b.targetId);
      }
    }
    return set;
  }, [bookmarks]);

  const noteCountsByTermId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      if (n.targetType === 'glossary') {
        counts[n.targetId] = (counts[n.targetId] || 0) + 1;
      }
    }
    return counts;
  }, [notes]);

  const normalizedQuery = query.trim().toLowerCase();

  // Matches search + difficulty + bookmark so category pills show live contextual counts
  const baseMatchedPatterns = useMemo(() => {
    return SD_ATLAS_PATTERNS.filter((p) => {
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) {
        return false;
      }
      if (onlyBookmarked && !bookmarkedIds.has(p.id)) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        p.term.toLowerCase().includes(normalizedQuery) ||
        p.shortVi.toLowerCase().includes(normalizedQuery) ||
        p.shortEn.toLowerCase().includes(normalizedQuery) ||
        p.mechanismVi.toLowerCase().includes(normalizedQuery) ||
        p.aliases.some((a) => a.toLowerCase().includes(normalizedQuery)) ||
        p.relatedModules.some((m) => m.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [normalizedQuery, selectedDifficulty, onlyBookmarked, bookmarkedIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<SdAtlasCategoryId, number> = {
      foundation: 0,
      'scaling-lb': 0,
      'caching-cdn': 0,
      'data-sharding': 0,
      'messaging-async': 0,
      'consensus-tx': 0,
      'reliability-obs': 0,
      'security-shipping': 0,
    };
    for (const p of baseMatchedPatterns) {
      counts[p.category] += 1;
    }
    return counts;
  }, [baseMatchedPatterns]);

  const filteredPatterns = useMemo(() => {
    if (selectedCategory === 'all') return baseMatchedPatterns;
    return baseMatchedPatterns.filter((p) => p.category === selectedCategory);
  }, [baseMatchedPatterns, selectedCategory]);

  const sdBookmarkCount = useMemo(() => {
    let count = 0;
    for (const p of SD_ATLAS_PATTERNS) {
      if (bookmarkedIds.has(p.id)) count += 1;
    }
    return count;
  }, [bookmarkedIds]);

  const selectedPattern: SdAtlasPattern | undefined = useMemo(() => {
    const inFiltered = filteredPatterns.find((p) => p.id === selectedId);
    if (inFiltered) return inFiltered;
    if (filteredPatterns.length > 0) return filteredPatterns[0];
    return PATTERN_BY_ID[selectedId] ?? SD_ATLAS_PATTERNS[0];
  }, [filteredPatterns, selectedId]);

  useEffect(() => {
    if (detailScrollRef.current) {
      detailScrollRef.current.scrollTop = 0;
    }
  }, [selectedPattern?.id]);

  const handleTogglePatternBookmark = (pattern: SdAtlasPattern, e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleBookmark({
      targetType: 'glossary',
      targetId: pattern.id,
      targetTitle: pattern.term,
      level: SD_PATTERN_LEVEL_TO_SKILL[pattern.difficulty],
    });
  };

  const handleOpenModule = (moduleId: string) => {
    if (onOpenModule) {
      onOpenModule(moduleId);
      return;
    }
    setCourseCursor('sdmastery', moduleId, 0);
    const lv = moduleLevelMap[moduleId];
    if (typeof lv === 'number') {
      setExpandedLevel('sdmastery', lv);
    }
    setActiveTab('learn');
    goSd({ name: 'workbench' });
  };

  const handleSelectRelatedPattern = (patternId: string) => {
    const target = PATTERN_BY_ID[patternId];
    if (!target) return;
    setSelectedId(patternId);
    if (selectedCategory !== 'all' && target.category !== selectedCategory) {
      setSelectedCategory('all');
    }
    if (selectedDifficulty !== 'all' && target.difficulty !== selectedDifficulty) {
      setSelectedDifficulty('all');
    }
    if (onlyBookmarked && !bookmarkedIds.has(patternId)) {
      setOnlyBookmarked(false);
    }
    if (normalizedQuery) {
      const inCurrent = filteredPatterns.some((p) => p.id === patternId);
      if (!inCurrent) setQuery('');
    }
    requestAnimationFrame(() => {
      itemRefs.current[patternId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  const handleCopySnippet = async (pattern: SdAtlasPattern) => {
    try {
      await navigator.clipboard.writeText(pattern.configSnippet);
      setCopiedId(pattern.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === pattern.id ? null : prev));
      }, 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const resetAllFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setOnlyBookmarked(false);
  };

  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedCategory !== 'all' ||
    selectedDifficulty !== 'all' ||
    onlyBookmarked;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      {/* Top Header & Filter Controls */}
      <div className="shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3.5 py-3 sm:px-5 sm:py-3.5">
        <div className="mx-auto max-w-[1440px] space-y-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dts-border-soft)] bg-[var(--dts-amber-soft)] px-2.5 py-0.5 font-mono text-[10.5px] font-extrabold text-[var(--dts-amber-ink)]">
                <BookMarked className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{t.badge}</span>
              </div>
              <h1 className="mt-1 font-mono text-base font-extrabold tracking-tight text-[var(--dts-ink)] sm:text-xl">
                {t.title}
              </h1>
              <p className="mt-0.5 max-w-3xl text-xs leading-relaxed text-[var(--dts-ink-soft)]">
                {t.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end font-mono text-xs text-[var(--dts-ink-muted)]">
              <span>{t.showingCount(filteredPatterns.length, SD_ATLAS_PATTERNS.length)}</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] px-2 py-1 text-[11px] font-bold text-[var(--dts-ink)] transition-colors hover:bg-[var(--dts-amber-soft)] cursor-pointer"
                >
                  {t.resetFilters}
                </button>
              )}
            </div>
          </div>

          {/* Search + Difficulty + Bookmark Row */}
          <div className="flex flex-col gap-2 @[760px]/app:flex-row @[760px]/app:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dts-ink-muted)]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="w-full rounded-xl border-[1.4px] border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] py-2 pl-9 pr-8 font-mono text-xs text-[var(--dts-ink)] placeholder:text-[var(--dts-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--dts-amber-bg)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Difficulty Segmented Control */}
              <div className="inline-flex items-center rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] p-0.5">
                {(['all', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => {
                  const active = selectedDifficulty === lvl;
                  const label =
                    lvl === 'all'
                      ? t.allLevels
                      : lang === 'en'
                        ? DIFFICULTY_STYLES[lvl].en
                        : DIFFICULTY_STYLES[lvl].vi;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedDifficulty(lvl)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                        active
                          ? 'border border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] shadow-2xs'
                          : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Bookmarked Toggle */}
              <button
                type="button"
                onClick={() => setOnlyBookmarked((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                  onlyBookmarked
                    ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                )}
              >
                <Bookmark
                  className={cn('h-3.5 w-3.5 shrink-0', onlyBookmarked && 'fill-current')}
                  aria-hidden="true"
                />
                <span>{t.bookmarkedOnly}</span>
                <span className="rounded-full bg-[var(--dts-panel-muted)] px-1.5 py-0.2 text-[10px] text-[var(--dts-ink)]">
                  {sdBookmarkCount}
                </span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills with Live Counts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                selectedCategory === 'all'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Layers className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{t.allCategories}</span>
              <span className="opacity-80">({baseMatchedPatterns.length})</span>
            </button>

            {SD_ATLAS_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const count = categoryCounts[cat.id];
              return (
                <button
                  key={cat.id}
                  type="button"
                  title={lang === 'en' ? cat.shortEn : cat.shortVi}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                    active
                      ? cn('border-[var(--dts-border)]', TONE_BADGE_CLASSES[cat.tone])
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]',
                    count === 0 && !active && 'opacity-55'
                  )}
                >
                  <span>{lang === 'en' ? cat.labelEn : cat.labelVi}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Master-Detail Split Body */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col overflow-y-auto @[860px]/app:flex-row @[860px]/app:overflow-hidden">
        {filteredPatterns.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="dts-card-tactile max-w-md rounded-2xl p-6">
              <Search className="mx-auto h-7 w-7 text-[var(--dts-ink-muted)]" />
              <p className="mt-2.5 font-mono text-sm font-bold text-[var(--dts-ink)]">
                {t.emptyTitle}
              </p>
              <p className="mt-1 text-xs text-[var(--dts-ink-soft)]">{t.emptyHint}</p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="dts-btn-tactile mt-4 rounded-xl bg-[var(--dts-amber-bg)] px-4 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)] cursor-pointer"
              >
                {t.resetFilters}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Left Master List */}
            <aside className="w-full shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)]/55 p-3 @[860px]/app:h-full @[860px]/app:w-[370px] @[1120px]/app:w-[420px] @[860px]/app:overflow-y-auto @[860px]/app:border-b-0 @[860px]/app:border-r">
              <div className="space-y-2">
                {filteredPatterns.map((pattern) => {
                  const isSelected = selectedPattern?.id === pattern.id;
                  const isStarred = bookmarkedIds.has(pattern.id);
                  const catMeta = CATEGORY_MAP[pattern.category];
                  const diffStyle = DIFFICULTY_STYLES[pattern.difficulty];

                  return (
                    <button
                      key={pattern.id}
                      ref={(el) => {
                        itemRefs.current[pattern.id] = el;
                      }}
                      type="button"
                      onClick={() => setSelectedId(pattern.id)}
                      className={cn(
                        'w-full rounded-xl p-3 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'dts-card-tactile bg-[var(--dts-panel-elevated)]'
                          : 'border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)]/75 hover:border-[var(--dts-line-strong)] hover:bg-[var(--dts-panel-elevated)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                              TONE_BADGE_CLASSES[catMeta.tone]
                            )}
                          >
                            {lang === 'en' ? catMeta.labelEn : catMeta.labelVi}
                          </span>
                          <span
                            className={cn(
                              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                              diffStyle.className
                            )}
                          >
                            {lang === 'en' ? diffStyle.en : diffStyle.vi}
                          </span>
                        </div>

                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={isStarred ? t.bookmarkedBtn : t.bookmarkBtn}
                          onClick={(e) => handleTogglePatternBookmark(pattern, e)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTogglePatternBookmark(
                                pattern,
                                e as unknown as React.MouseEvent
                              );
                            }
                          }}
                          className={cn(
                            'shrink-0 rounded-lg p-1 transition-colors',
                            isStarred
                              ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                              : 'text-[var(--dts-ink-muted)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                          )}
                        >
                          <Bookmark className={cn('h-3.5 w-3.5', isStarred && 'fill-current')} />
                        </span>
                      </div>

                      <div className="mt-1.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] sm:text-[13px]">
                        {pattern.term}
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[var(--dts-ink-soft)]">
                        {lang === 'en' ? pattern.shortEn : pattern.shortVi}
                      </p>

                      {pattern.relatedModules.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {pattern.relatedModules.map((modId) => (
                            <span
                              key={modId}
                              className="rounded border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--dts-ink-soft)]"
                            >
                              {modId}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Detail Panel */}
            {selectedPattern && (
              <section
                ref={detailScrollRef}
                className="min-w-0 flex-1 p-3.5 sm:p-5 @[860px]/app:h-full @[860px]/app:overflow-y-auto"
              >
                <div className="mx-auto max-w-4xl space-y-4">
                  {/* Pattern Hero Header Card */}
                  <div className="dts-card-tactile rounded-2xl bg-[var(--dts-panel-elevated)] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold',
                              TONE_BADGE_CLASSES[CATEGORY_MAP[selectedPattern.category].tone]
                            )}
                          >
                            {lang === 'en'
                              ? CATEGORY_MAP[selectedPattern.category].labelEn
                              : CATEGORY_MAP[selectedPattern.category].labelVi}
                          </span>
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold',
                              DIFFICULTY_STYLES[selectedPattern.difficulty].className
                            )}
                          >
                            {lang === 'en'
                              ? DIFFICULTY_STYLES[selectedPattern.difficulty].en
                              : DIFFICULTY_STYLES[selectedPattern.difficulty].vi}
                          </span>
                          <span className="font-mono text-[10.5px] text-[var(--dts-ink-muted)]">
                            #{selectedPattern.id}
                          </span>
                        </div>

                        <h2 className="font-mono text-lg font-extrabold text-[var(--dts-ink)] sm:text-xl">
                          {selectedPattern.term}
                        </h2>
                      </div>

                      {/* Action Buttons: Popover, Notes, Bookmark */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          title={t.openPopoverHint}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            useNavigationStore.getState().showTermPopover(
                              selectedPattern.id,
                              {
                                top: rect.top,
                                left: rect.left,
                                bottom: rect.bottom,
                                width: rect.width,
                              },
                              true
                            );
                          }}
                          className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-3 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)] cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{t.openPopover}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotesDrawer(
                              'glossary',
                              selectedPattern.id,
                              `Thuật ngữ: ${selectedPattern.term}`
                            );
                          }}
                          className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-panel)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] cursor-pointer"
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {noteCountsByTermId[selectedPattern.id]
                              ? t.notesCount(noteCountsByTermId[selectedPattern.id])
                              : t.notesBtn}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleTogglePatternBookmark(selectedPattern, e)}
                          className={cn(
                            'dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold cursor-pointer',
                            bookmarkedIds.has(selectedPattern.id)
                              ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                              : 'bg-[var(--dts-panel)] text-[var(--dts-ink)]'
                          )}
                        >
                          <Bookmark
                            className={cn(
                              'h-3.5 w-3.5 shrink-0',
                              bookmarkedIds.has(selectedPattern.id) && 'fill-current'
                            )}
                            aria-hidden="true"
                          />
                          <span>
                            {bookmarkedIds.has(selectedPattern.id)
                              ? t.bookmarkedBtn
                              : t.bookmarkBtn}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Bilingual Summary Lead-in */}
                    <p className="mt-3 rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-3.5 py-2.5 text-sm font-medium leading-relaxed text-[var(--dts-ink)]">
                      {lang === 'en' ? selectedPattern.shortEn : selectedPattern.shortVi}
                    </p>

                    {/* Aliases & Module Links */}
                    <div className="mt-3 flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      {selectedPattern.aliases.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-[var(--dts-ink-muted)]">
                            {t.aliasesLabel}
                          </span>
                          {selectedPattern.aliases.map((alias) => (
                            <span
                              key={alias}
                              className="rounded-md border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--dts-ink-soft)]"
                            >
                              {alias}
                            </span>
                          ))}
                        </div>
                      )}

                      {selectedPattern.relatedModules.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selectedPattern.relatedModules.map((modId) => (
                            <button
                              key={modId}
                              type="button"
                              title={
                                moduleTitleMap[modId]
                                  ? `${modId} — ${moduleTitleMap[modId]}`
                                  : t.studyModule(modId)
                              }
                              onClick={() => handleOpenModule(modId)}
                              className="dts-btn-tactile inline-flex items-center gap-1 rounded-lg bg-[var(--dts-green-bg)] px-2.5 py-1 font-mono text-[11px] font-extrabold text-[var(--dts-green-ink)] cursor-pointer"
                            >
                              <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>{t.studyModule(modId)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 1: Concept & Mechanism */}
                  <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-4 sm:p-5">
                    <div className="mb-2 flex items-center gap-2 font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                      <Sparkles
                        className="h-4 w-4 shrink-0 text-[var(--dts-blue-ink)]"
                        aria-hidden="true"
                      />
                      <h3>{t.sectionConcept}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--dts-ink-soft)]">
                      {selectedPattern.mechanismVi}
                    </p>
                  </div>

                  {/* Section 2 & 3: When to Use & Engineering Trade-offs */}
                  <div className="grid grid-cols-1 gap-4 @[720px]/app:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-4">
                      <div className="mb-2.5 flex items-center gap-2 font-mono text-sm font-extrabold text-[var(--dts-green-ink)]">
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <h3>{t.sectionWhenToUse}</h3>
                      </div>
                      <ul className="space-y-2 text-xs leading-relaxed text-[var(--dts-ink-soft)] sm:text-[13px]">
                        {selectedPattern.whenToUseVi.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dts-green-ink)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-4">
                      <div className="mb-2.5 flex items-center gap-2 font-mono text-sm font-extrabold text-[var(--dts-amber-ink)]">
                        <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <h3>{t.sectionTradeoffs}</h3>
                      </div>
                      <ul className="space-y-2 text-xs leading-relaxed text-[var(--dts-ink-soft)] sm:text-[13px]">
                        {selectedPattern.tradeoffsVi.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dts-amber-ink)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Section 4: Common Failure Mode / Gotcha */}
                  <div className="rounded-2xl border border-[var(--dts-border-soft)] bg-[var(--dts-rose-soft)] p-4">
                    <div className="mb-1.5 flex items-center gap-2 font-mono text-sm font-extrabold text-[var(--dts-rose-ink)]">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <h3>{t.sectionGotcha}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--dts-rose-ink)] sm:text-[13.5px]">
                      {selectedPattern.failureModeVi}
                    </p>
                  </div>

                  {/* Section 5: Formula / Reference Config */}
                  <div className="ide-dark-surface overflow-hidden rounded-2xl border border-[var(--dts-border)] bg-slate-950 text-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300">
                        <Code2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                        <span>{t.sectionSnippet}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopySnippet(selectedPattern)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-200 transition-colors hover:border-slate-500 cursor-pointer"
                      >
                        {copiedId === selectedPattern.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                            <span>{t.copiedBtn}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" aria-hidden="true" />
                            <span>{t.copyBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-sky-100 whitespace-pre">
                      <code>{selectedPattern.configSnippet}</code>
                    </pre>
                  </div>

                  {/* Section 6: Related Patterns */}
                  {selectedPattern.relatedPatternIds &&
                    selectedPattern.relatedPatternIds.length > 0 && (
                      <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-4">
                        <div className="mb-2 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                          {t.sectionRelated}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedPattern.relatedPatternIds.map((relId) => {
                            const rel = PATTERN_BY_ID[relId];
                            if (!rel) return null;
                            return (
                              <button
                                key={relId}
                                type="button"
                                onClick={() => handleSelectRelatedPattern(relId)}
                                className="rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--dts-ink)] transition-colors hover:border-[var(--dts-border)] hover:bg-[var(--dts-purple-soft)] cursor-pointer"
                              >
                                {rel.term}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SdAtlasView;
