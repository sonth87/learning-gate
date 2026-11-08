import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Layers,
  RotateCw,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Search,
  Shuffle,
  Clock,
  X,
  Copy,
  Check,
  LayoutGrid,
  CreditCard,
  Eye,
  BookOpen,
  Flame,
  Filter,
  Keyboard,
} from 'lucide-react';
import { ALL_FLASHCARDS } from '@/data/flashcards/flashcardsData';
import { GLOSSARY_BY_ID } from '@/data/glossary';
import { SKILL_LEVELS } from '@/constants/levels';
import { CURRICULUM_STAGES } from '@/constants/stages';
import { SrsRating } from '@/types/assessment.types';
import { SkillLevel, StageId } from '@/types/curriculum.types';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

type SrsFilterMode = 'all' | 'due' | 'new' | 'mastered';
type DeckViewMode = 'study' | 'grid';

const STAGE_SHORT_NAMES: Record<StageId, string> = {
  'stage-1': 'GĐ 1: Zero & Cú pháp Cốt lõi',
  'stage-2': 'GĐ 2: Cấu trúc Dữ liệu, Hàm & OOP',
  'stage-3': 'GĐ 3: Kiến trúc Dự án, Packaging & Test',
  'stage-4': 'GĐ 4: CPython Internals & Metaprogramming',
  'stage-5': 'GĐ 5: GIL, Đa luồng & AsyncIO',
  'stage-6': 'GĐ 6: FastAPI, SQLAlchemy & Distributed',
  'stage-7': 'GĐ 7: Data Engineering, AI/LLM & Profiling',
};

export const FlashcardDeck: React.FC = () => {
  const { srsStates, rateFlashcard } = useUserDataStore();
  const { showTermPopover } = useNavigationStore();

  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<StageId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [srsMode, setSrsMode] = useState<SrsFilterMode>('all');
  const [deckViewMode, setDeckViewMode] = useState<DeckViewMode>('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const now = Date.now();

  // Compute SRS summary statistics across all 320 cards
  const srsStats = useMemo(() => {
    let due = 0;
    let mastered = 0;
    let learning = 0;
    let unseen = 0;

    for (const c of ALL_FLASHCARDS) {
      const st = srsStates[c.id];
      if (!st) {
        unseen++;
        due++;
      } else {
        if (st.nextReviewAt <= now) due++;
        if (st.box >= 3) mastered++;
        else learning++;
      }
    }

    return {
      total: ALL_FLASHCARDS.length,
      due,
      mastered,
      learning,
      unseen,
      reviewed: ALL_FLASHCARDS.length - unseen,
    };
  }, [srsStates, now]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_FLASHCARDS.length };
    for (const c of ALL_FLASHCARDS) {
      counts[c.level] = (counts[c.level] || 0) + 1;
    }
    return counts;
  }, []);

  const categoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of ALL_FLASHCARDS) {
      if (selectedLevel !== 'all' && c.level !== selectedLevel) continue;
      if (selectedStage !== 'all' && c.stageId !== selectedStage) continue;
      map.set(c.category, (map.get(c.category) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedLevel, selectedStage]);

  const cards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = ALL_FLASHCARDS.filter((c) => {
      if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
      if (selectedStage !== 'all' && c.stageId !== selectedStage) return false;
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      const st = srsStates[c.id];
      if (srsMode === 'due' && st && st.nextReviewAt > now) return false;
      if (srsMode === 'new' && st) return false;
      if (srsMode === 'mastered' && (!st || st.box < 3)) return false;
      if (q) {
        const mFront = c.frontQuestion.toLowerCase().includes(q);
        const mBack = c.backAnswer.toLowerCase().includes(q);
        const mCat = c.category.toLowerCase().includes(q);
        const mCode = c.codeSnippet ? c.codeSnippet.toLowerCase().includes(q) : false;
        if (!mFront && !mBack && !mCat && !mCode) return false;
      }
      return true;
    });

    if (shuffledIds) {
      const orderMap = new Map(shuffledIds.map((id, i) => [id, i]));
      return [...filtered].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      );
    }
    return filtered;
  }, [
    selectedLevel,
    selectedStage,
    selectedCategory,
    srsMode,
    searchQuery,
    srsStates,
    now,
    shuffledIds,
  ]);

  const safeIdx = cards.length > 0 && currentIndex < cards.length ? currentIndex : 0;
  const currentCard = cards[safeIdx] || ALL_FLASHCARDS[0];
  const cardSrs = srsStates[currentCard.id];

  const handleSelectCard = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setIsFlipped(false);
    setShowHint(false);
  }, []);

  const handlePrev = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const handleNext = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      await rateFlashcard(currentCard.id, rating);
      setIsFlipped(false);
      setShowHint(false);
      if (cards.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
      }
    },
    [currentCard.id, rateFlashcard, cards.length]
  );

  const handleShuffle = () => {
    const ids = ALL_FLASHCARDS.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffledIds(ids);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleResetFilters = () => {
    setSelectedLevel('all');
    setSelectedStage('all');
    setSelectedCategory('all');
    setSrsMode('all');
    setSearchQuery('');
    setShuffledIds(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleCopyCode = (cardId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCardId(cardId);
    setTimeout(() => setCopiedCardId(null), 1600);
  };

  // Keyboard shortcuts in Study Mode: Space to flip, Left/Right to navigate, H for hint, 1-4 to grade
  useEffect(() => {
    if (deckViewMode !== 'study') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'h' && !isFlipped) {
        e.preventDefault();
        setShowHint((h) => !h);
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deckViewMode, isFlipped, handleNext, handlePrev, handleRate]);

  const progressPercent =
    cards.length > 0 ? Math.round(((safeIdx + 1) / cards.length) * 100) : 0;

  const hasActiveFilters =
    selectedLevel !== 'all' ||
    selectedStage !== 'all' ||
    selectedCategory !== 'all' ||
    srsMode !== 'all' ||
    searchQuery.trim() !== '' ||
    shuffledIds !== null;

  return (
    <div className="mx-auto max-w-[1440px] p-3 sm:p-6 space-y-3.5 sm:space-y-5">
      {/* Top Studio Banner: Title, 4 SRS Metric Cards & View Switcher */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-3 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/15 border border-emerald-500/40 text-emerald-400 shadow-inner">
              <Layers className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-xl font-extrabold text-white tracking-tight">
                  Flashcards Studio & Ôn tập Ngắt quãng (SRS)
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 font-mono text-[10px] sm:text-xs font-bold text-emerald-300">
                  {ALL_FLASHCARDS.length} Thẻ
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400">
                Bao phủ từ Zero (Cài đặt <code className="text-emerald-300">uv</code>,{' '}
                <code className="text-sky-300">.venv</code>, <code className="text-amber-300">pyproject.toml</code>, Cú pháp, Thư viện Chuẩn) đến CPython Internals, AsyncIO, FastAPI & AI Production.
              </p>
            </div>
          </div>

          {/* Right Controls: Study Mode vs Grid Mode + Shuffle (Single row on mobile!) */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 shrink-0">
            <div className="grid grid-cols-2 sm:inline-flex flex-1 sm:flex-initial rounded-xl border border-slate-800 bg-slate-950 p-1 gap-0.5">
              <button
                type="button"
                onClick={() => setDeckViewMode('study')}
                className={cn(
                  'inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate',
                  deckViewMode === 'study'
                    ? 'bg-emerald-500 text-[#020617] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Lật thẻ (SRS)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeckViewMode('grid')}
                className={cn(
                  'inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate',
                  deckViewMode === 'grid'
                    ? 'bg-emerald-500 text-[#020617] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Đọc lướt ({cards.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
              title="Trộn ngẫu nhiên thứ tự thẻ"
            >
              <Shuffle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Trộn ngẫu nhiên</span>
              <span className="sm:hidden">Trộn</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive SRS Status Filter Cards (4 compact columns on mobile!) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 pt-0.5">
          {[
            {
              id: 'all' as SrsFilterMode,
              label: 'Tổng số thẻ',
              shortLabel: 'Tổng thẻ',
              count: srsStats.total,
              sub: 'Toàn bộ 7 Giai đoạn',
              activeBorder: 'border-sky-500/60 bg-sky-500/10',
              badgeColor: 'text-sky-300',
              icon: <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-400 shrink-0" />,
            },
            {
              id: 'due' as SrsFilterMode,
              label: 'Cần ôn hôm nay',
              shortLabel: 'Cần ôn',
              count: srsStats.due,
              sub: 'Đến hạn + Thẻ mới',
              activeBorder: 'border-amber-500/60 bg-amber-500/10',
              badgeColor: 'text-amber-300',
              icon: <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />,
            },
            {
              id: 'new' as SrsFilterMode,
              label: 'Chưa từng lật',
              shortLabel: 'Thẻ mới',
              count: srsStats.unseen,
              sub: `Đã học ${srsStats.reviewed} thẻ`,
              activeBorder: 'border-indigo-500/60 bg-indigo-500/10',
              badgeColor: 'text-indigo-300',
              icon: <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400 shrink-0" />,
            },
            {
              id: 'mastered' as SrsFilterMode,
              label: 'Đã thuộc lòng',
              shortLabel: 'Đã thuộc',
              count: srsStats.mastered,
              sub: 'Đạt Hộp SRS 3–5',
              activeBorder: 'border-emerald-500/60 bg-emerald-500/10',
              badgeColor: 'text-emerald-300',
              icon: <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />,
            },
          ].map((stat) => {
            const active = srsMode === stat.id;
            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => {
                  setSrsMode(stat.id);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-2 sm:p-3 text-center sm:text-left transition-all cursor-pointer',
                  active
                    ? stat.activeBorder
                    : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700'
                )}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] sm:text-xs font-bold text-slate-300">
                    {stat.icon}
                    <span className="truncate sm:hidden">{stat.shortLabel}</span>
                    <span className="hidden sm:inline truncate">{stat.label}</span>
                  </div>
                  <div className="hidden sm:block text-[11px] text-slate-400 truncate">
                    {stat.sub}
                  </div>
                </div>
                <span
                  className={cn(
                    'font-mono text-sm sm:text-xl font-extrabold shrink-0 sm:ml-2 mt-0.5 sm:mt-0',
                    stat.badgeColor
                  )}
                >
                  {stat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile & Tablet Quick Filter & Playlist Toggle Bar (< lg) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/90 px-3.5 py-2.5 lg:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-xs font-extrabold text-emerald-300 shrink-0">
            #{safeIdx + 1}/{cards.length}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate">
            {currentCard.category}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileFilterOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer',
            isMobileFilterOpen || hasActiveFilters
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
              : 'border-slate-700 bg-slate-800 text-slate-200'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>
            {isMobileFilterOpen
              ? 'Đóng Bộ lọc & Danh sách'
              : `Bộ lọc & Danh sách (${cards.length} thẻ)`}
          </span>
        </button>
      </div>

      {/* Main 2-Pane Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANE (4 cols on desktop, collapsible on mobile/tablet): Filters & Scrollable Card Navigator */}
        <aside
          className={cn(
            'lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-900/80 p-4 space-y-4 shadow-lg',
            !isMobileFilterOpen && 'hidden lg:block'
          )}
        >
          {/* Search Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-300">
                <Filter className="h-3.5 w-3.5 text-emerald-400" />
                <span>Bộ lọc & Tìm kiếm Thẻ</span>
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-rose-400 hover:underline cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                placeholder="Tìm: uv, .venv, pathlib, asyncio, FastAPI..."
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentIndex(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Skill Level Pills Grid */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400">
              Cấp độ Kỹ năng:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedLevel('all');
                  setSelectedCategory('all');
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer truncate',
                  selectedLevel === 'all'
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                )}
              >
                Tất cả ({levelCounts.all})
              </button>
              {SKILL_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(lvl.id);
                    setSelectedCategory('all');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer truncate',
                    selectedLevel === lvl.id
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                  )}
                >
                  {lvl.label} ({levelCounts[lvl.id] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Stage & Topic Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Giai đoạn Lộ trình (1–7):
              </label>
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value as StageId | 'all');
                  setSelectedCategory('all');
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                aria-label="Lọc theo Giai đoạn"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Tất cả 7 Giai đoạn ({ALL_FLASHCARDS.length} thẻ)</option>
                {CURRICULUM_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {STAGE_SHORT_NAMES[st.id] || st.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Chủ đề Chuyên sâu ({categoryOptions.length} nhóm):
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                aria-label="Lọc theo Chủ đề"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Mọi Chủ đề ({cards.length} thẻ)</option>
                {categoryOptions.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {cat} ({count} thẻ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrollable Card Playlist */}
          <div className="border-t border-slate-800/80 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                Danh sách Thẻ ({cards.length})
              </span>
              {cards.length > 0 && (
                <span className="font-mono text-[11px] text-emerald-400">
                  Đang chọn #{safeIdx + 1}/{cards.length}
                </span>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {cards.map((c, idx) => {
                const isCurrent = idx === safeIdx;
                const st = srsStates[c.id];
                const dotColor = !st
                  ? 'bg-slate-600'
                  : st.box >= 3
                    ? 'bg-emerald-400'
                    : 'bg-amber-400';

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      handleSelectCard(idx);
                      setIsMobileFilterOpen(false);
                      if (deckViewMode === 'grid') {
                        setDeckViewMode('study');
                      }
                    }}
                    className={cn(
                      'w-full flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer',
                      isCurrent
                        ? 'border-emerald-500/60 bg-emerald-500/15 shadow-sm'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full shrink-0',
                        dotColor
                      )}
                      title={
                        !st
                          ? 'Chưa học'
                          : `Hộp SRS #${st.box} (Chu kỳ ${st.intervalDays} ngày)`
                      }
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          #{idx + 1} • {c.category}
                        </span>
                        <LevelBadge level={c.level} />
                      </div>
                      <p
                        className={cn(
                          'text-xs line-clamp-2 leading-snug',
                          isCurrent
                            ? 'font-bold text-white'
                            : 'font-medium text-slate-300'
                        )}
                      >
                        {c.frontQuestion}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN STAGE (8 cols on desktop): Study Card Arena OR Grid Cheat-Sheet */}
        <section className="lg:col-span-8 space-y-4">
          {cards.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Không tìm thấy thẻ Flashcard nào khớp với bộ lọc
                </h3>
                <p className="text-xs text-slate-400">
                  Hãy thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ {ALL_FLASHCARDS.length} thẻ.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-[#020617] hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                Xem toàn bộ {ALL_FLASHCARDS.length} thẻ
              </button>
            </div>
          ) : deckViewMode === 'grid' ? (
            /* ================================================================
               MODE 2: GRID / CHEAT-SHEET VIEW (Read & Compare Multiple Cards)
               ================================================================ */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
                <div className="text-xs font-bold text-slate-200">
                  Chế độ Đọc lướt & Tra cứu Nhanh ({cards.length} thẻ)
                </div>
                <span className="text-[11px] text-slate-400">
                  Bấm vào bất kỳ thẻ nào nếu muốn mở lại ở Chế độ Lật thẻ (SRS)
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-5 space-y-3.5 shadow-md hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300">
                          #{idx + 1}
                        </span>
                        <LevelBadge level={card.level} showVi />
                        <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                          {card.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {STAGE_SHORT_NAMES[card.stageId]}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCard(idx);
                          setDeckViewMode('study');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 cursor-pointer"
                      >
                        <CreditCard className="h-3 w-3" />
                        <span>Luyện thẻ này</span>
                      </button>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                      {card.frontQuestion}
                    </h3>

                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <RichTextWithTerms text={card.backAnswer} />
                    </div>

                    <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 px-3.5 py-2.5 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Hình tượng hóa:</strong> {card.backAnalogy}
                      </span>
                    </div>

                    {card.codeSnippet && (
                      <div className="rounded-xl border border-slate-800 bg-[#090d16] overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-3 py-1.5">
                          <span className="font-mono text-[10px] text-slate-400">
                            Python Snippet
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyCode(card.id, card.codeSnippet!)
                            }
                            className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                          >
                            {copiedCardId === card.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-300">Đã copy</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="ide-dark-surface overflow-x-auto p-3.5 font-mono text-xs leading-5">
                          <code>{renderHighlightedPython(card.codeSnippet)}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ================================================================
               MODE 1: INTERACTIVE STUDY CARD ARENA (Tactile Layered Card)
               ================================================================ */
            <div className="space-y-4">
              {/* Top Progress Bar & Position Header */}
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 px-4 py-3 space-y-2 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 font-mono font-extrabold text-emerald-300">
                      Thẻ {safeIdx + 1} / {cards.length}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-300 font-semibold truncate">
                      {STAGE_SHORT_NAMES[currentCard.stageId]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 5-Box SRS Visual Indicator */}
                    <div className="flex items-center gap-1.5" title="Cấp độ ghi nhớ SRS (Hộp 1 -> Hộp 5)">
                      <span className="text-[11px] text-slate-400">Hộp SRS:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((boxNum) => (
                          <span
                            key={boxNum}
                            className={cn(
                              'h-2.5 w-2.5 rounded-sm transition-all',
                              cardSrs && cardSrs.box >= boxNum
                                ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                                : 'bg-slate-800 border border-slate-700'
                            )}
                          />
                        ))}
                      </div>
                      {cardSrs && (
                        <span className="font-mono text-[11px] font-bold text-emerald-300">
                          ({cardSrs.intervalDays}d)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Smooth Progress Track */}
                <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Layered Flashcard Stack Container */}
              <div className="relative pb-2">
                {/* Decorative Stacked Card Layers Behind */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-6 -bottom-1 h-6 rounded-3xl border border-slate-800/50 bg-slate-900/40"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-6 rounded-3xl border border-slate-800/70 bg-slate-900/60"
                />

                {/* Primary Flashcard Surface */}
                <div
                  className={cn(
                    'relative rounded-3xl border bg-slate-900 shadow-2xl overflow-hidden transition-all duration-200',
                    isFlipped
                      ? 'border-emerald-500/45'
                      : 'border-slate-700/90 hover:border-slate-600'
                  )}
                >
                  {/* Top Accent Strip */}
                  <div
                    className={cn(
                      'h-1.5 w-full',
                      isFlipped
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
                        : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500'
                    )}
                  />

                  {/* Card Metadata Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/60 px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={currentCard.level} showVi />
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{currentCard.category}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                          isFlipped
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        )}
                      >
                        {isFlipped ? 'Mặt sau • Đáp án' : 'Mặt trước • Câu hỏi'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Front (Question) vs Back (Complete Explanation) */}
                  {!isFlipped ? (
                    <div className="p-6 sm:p-10 flex flex-col justify-between min-h-[340px] space-y-6">
                      {/* Clickable Question Area */}
                      <div
                        onClick={() => setIsFlipped(true)}
                        className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer space-y-5 py-4"
                      >
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/80 px-3.5 py-1 text-xs font-medium text-slate-300">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Suy nghĩ câu trả lời rồi bấm vào thẻ (hoặc phím Space) để đối chiếu</span>
                        </div>

                        <h2 className="text-lg sm:text-2xl font-extrabold text-white max-w-2xl leading-relaxed tracking-tight">
                          {currentCard.frontQuestion}
                        </h2>
                      </div>

                      {/* Optional Hint Reveal Box */}
                      <div className="flex flex-col items-center gap-2.5 pt-2">
                        {currentCard.frontHint && !showHint && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHint(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem Gợi ý mở đường (Phím H)</span>
                          </button>
                        )}

                        {currentCard.frontHint && showHint && (
                          <div className="w-full max-w-xl rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                              <Lightbulb className="h-3.5 w-3.5" />
                              <span>Gợi ý:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed">
                              {currentCard.frontHint}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 sm:p-7 space-y-4">
                      {/* Keep Question Context Visible at the Top of the Back Side */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Câu hỏi đang trả lời:
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-200 leading-snug">
                          {currentCard.frontQuestion}
                        </div>
                      </div>

                      {/* Core Explanation Card */}
                      <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/15 p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Đáp án & Bản chất Kỹ thuật</span>
                        </div>
                        <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                          <RichTextWithTerms text={currentCard.backAnswer} />
                        </div>
                      </div>

                      {/* Real-World Analogy Callout */}
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                          <span>Hình tượng hóa Thực tế (Mental Model)</span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed">
                          {currentCard.backAnalogy}
                        </p>
                      </div>

                      {/* Code Snippet Window with Copy Button */}
                      {currentCard.codeSnippet && (
                        <div className="rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden shadow-inner">
                          <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/90 px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                              <span className="ml-1 font-mono text-[11px] font-semibold text-slate-400">
                                Minh họa Python Thực chiến
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyCode(
                                  currentCard.id,
                                  currentCard.codeSnippet!
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                            >
                              {copiedCardId === currentCard.id ? (
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
                          <pre className="ide-dark-surface overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                            <code>
                              {renderHighlightedPython(currentCard.codeSnippet)}
                            </code>
                          </pre>
                        </div>
                      )}

                      {/* Related Glossary Terms Chips */}
                      {currentCard.relatedTermIds &&
                        currentCard.relatedTermIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400">
                              Tra cứu thuật ngữ liên quan:
                            </span>
                            {currentCard.relatedTermIds.map((termId) => {
                              const termObj = GLOSSARY_BY_ID[termId];
                              if (!termObj) return null;
                              return (
                                <button
                                  key={termId}
                                  type="button"
                                  onClick={(e) => {
                                    const r =
                                      e.currentTarget.getBoundingClientRect();
                                    showTermPopover(
                                      termObj.id,
                                      {
                                        top: r.top,
                                        left: r.left,
                                        bottom: r.bottom,
                                        width: r.width,
                                      },
                                      true
                                    );
                                  }}
                                  className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                                >
                                  {termObj.term}
                                </button>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Card Bottom Dock: Navigation & SRS Rating Bar */}
                  <div className="border-t border-slate-800/90 bg-slate-950/80 px-3.5 sm:px-5 py-3.5 sm:py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4 shrink-0" />
                          <span>Thẻ trước</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsFlipped((f) => !f)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-2.5 sm:px-5 py-2 text-xs font-extrabold text-[#020617] hover:bg-emerald-400 shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
                        >
                          <RotateCw className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {isFlipped ? 'Úp lại' : 'Lật Đáp án'}
                            <span className="hidden sm:inline"> (Space)</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={handleNext}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <span>Thẻ tiếp</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </button>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Keyboard className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          Phím tắt: <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">Space</kbd> lật •{' '}
                          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">←/→</kbd> chuyển •{' '}
                          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">1–4</kbd> chấm SRS
                        </span>
                      </div>
                    </div>

                    {/* 4 Ergonomic SRS Grading Cards when Flipped */}
                    {isFlipped && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            Đánh giá mức độ nhớ của bạn để thuật toán SRS hẹn lịch ôn lại:
                          </span>
                          <span className="text-slate-400">
                            Nhấn phím <kbd className="font-mono text-emerald-300">1</kbd>,{' '}
                            <kbd className="font-mono text-emerald-300">2</kbd>,{' '}
                            <kbd className="font-mono text-emerald-300">3</kbd> hoặc{' '}
                            <kbd className="font-mono text-emerald-300">4</kbd>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => handleRate('again')}
                            className="flex flex-col items-start rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-left hover:bg-rose-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-extrabold text-rose-300">
                                Quên / Chưa rõ
                              </span>
                              <kbd className="rounded bg-rose-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-200">
                                1
                              </kbd>
                            </div>
                            <span className="text-[11px] text-rose-200/80 mt-0.5">
                              Ôn lại sau 10 phút
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRate('hard')}
                            className="flex flex-col items-start rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-left hover:bg-amber-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-extrabold text-amber-300">
                                Còn ngập ngừng
                              </span>
                              <kbd className="rounded bg-amber-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-200">
                                2
                              </kbd>
                            </div>
                            <span className="text-[11px] text-amber-200/80 mt-0.5">
                              Ôn lại sau 1 ngày
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRate('good')}
                            className="flex flex-col items-start rounded-xl border border-sky-500/40 bg-sky-500/10 p-2.5 text-left hover:bg-sky-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-extrabold text-sky-300">
                                Nhớ tốt
                              </span>
                              <kbd className="rounded bg-sky-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-200">
                                3
                              </kbd>
                            </div>
                            <span className="text-[11px] text-sky-200/80 mt-0.5">
                              Chu kỳ 2–4+ ngày
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRate('easy')}
                            className="flex flex-col items-start rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-left hover:bg-emerald-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-xs font-extrabold text-emerald-300">
                                Rất dễ / Thuộc làu
                              </span>
                              <kbd className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                                4
                              </kbd>
                            </div>
                            <span className="text-[11px] text-emerald-200/80 mt-0.5">
                              Chu kỳ 5–14+ ngày
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
