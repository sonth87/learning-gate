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
} from 'lucide-react';
import { ALL_FLASHCARDS } from '@/data/flashcards/flashcardsData';
import { SKILL_LEVELS } from '@/constants/levels';
import { CURRICULUM_STAGES } from '@/constants/stages';
import { SrsRating } from '@/types/assessment.types';
import { SkillLevel, StageId } from '@/types/curriculum.types';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

type SrsFilterMode = 'all' | 'due' | 'new' | 'mastered';

export const FlashcardDeck: React.FC = () => {
  const { srsStates, rateFlashcard } = useUserDataStore();
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<StageId | 'all'>('all');
  const [srsMode, setSrsMode] = useState<SrsFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffledIds, setShuffledIds] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const now = Date.now();

  const dueCount = useMemo(
    () =>
      ALL_FLASHCARDS.filter((c) => {
        const st = srsStates[c.id];
        return !st || st.nextReviewAt <= now;
      }).length,
    [srsStates, now]
  );

  const cards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = ALL_FLASHCARDS.filter((c) => {
      if (selectedLevel !== 'all' && c.level !== selectedLevel) return false;
      if (selectedStage !== 'all' && c.stageId !== selectedStage) return false;
      const st = srsStates[c.id];
      if (srsMode === 'due' && st && st.nextReviewAt > now) return false;
      if (srsMode === 'new' && st) return false;
      if (srsMode === 'mastered' && (!st || st.box < 3)) return false;
      if (q) {
        const mFront = c.frontQuestion.toLowerCase().includes(q);
        const mBack = c.backAnswer.toLowerCase().includes(q);
        const mCat = c.category.toLowerCase().includes(q);
        if (!mFront && !mBack && !mCat) return false;
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
    srsMode,
    searchQuery,
    srsStates,
    now,
    shuffledIds,
  ]);

  const safeIdx = cards.length > 0 && currentIndex < cards.length ? currentIndex : 0;
  const currentCard = cards[safeIdx] || ALL_FLASHCARDS[0];
  const cardSrs = srsStates[currentCard.id];

  const handleRate = useCallback(
    async (rating: SrsRating) => {
      await rateFlashcard(currentCard.id, rating);
      setIsFlipped(false);
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
  };

  // Keyboard shortcuts: Space to flip, Left/Right to navigate, 1-4 to grade when flipped
  useEffect(() => {
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
        setIsFlipped(false);
        if (cards.length > 0) {
          setCurrentIndex((prev) => (prev + 1) % cards.length);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsFlipped(false);
        if (cards.length > 0) {
          setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        if (e.key === '2') handleRate('hard');
        if (e.key === '3') handleRate('good');
        if (e.key === '4') handleRate('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cards.length, isFlipped, handleRate]);

  const reviewedCount = Object.keys(srsStates).length;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-5">
      {/* Header & SRS Stats */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold text-white">
                  Flashcards Ôn tập Thông minh (Spaced Repetition - SRS)
                </h1>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                  {ALL_FLASHCARDS.length} Thẻ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đã ôn tập {reviewedCount}/{ALL_FLASHCARDS.length} thẻ • Cần ôn hôm nay: <strong className="text-emerald-400">{dueCount}</strong> thẻ (Phím tắt: <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px]">Space</kbd> lật thẻ, <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px]">←/→</kbd> chuyển, <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px]">1-4</kbd> chấm SRS).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                placeholder="Tìm khái niệm, từ khóa..."
                className="w-full sm:w-52 rounded-xl border border-slate-800 bg-slate-950/90 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentIndex(0);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleShuffle}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer shrink-0"
              title="Trộn ngẫu nhiên thứ tự thẻ"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Trộn thẻ</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: SRS Mode, Stage, and Level */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
          {/* SRS Mode Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {(
              [
                { id: 'all', label: `Tất cả (${ALL_FLASHCARDS.length})` },
                { id: 'due', label: `Cần ôn (${dueCount})` },
                {
                  id: 'new',
                  label: `Chưa học (${ALL_FLASHCARDS.length - reviewedCount})`,
                },
                { id: 'mastered', label: 'Đã thuộc (Hộp 3+)' },
              ] as { id: SrsFilterMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSrsMode(m.id);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer',
                  srsMode === m.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                )}
              >
                {m.id === 'due' && <Clock className="h-3 w-3" />}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value as StageId | 'all');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              aria-label="Lọc theo Giai đoạn"
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 shrink-0 focus:outline-none"
            >
              <option value="all">Mọi Giai đoạn (1–7)</option>
              {CURRICULUM_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  GĐ {st.number}: {st.title.replace(/^Giai đoạn \d+:\s*/, '')}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSelectedLevel('all');
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0',
                selectedLevel === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              )}
            >
              Mọi cấp
            </button>
            {SKILL_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevel(lvl.id);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0',
                  selectedLevel === lvl.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            Không có thẻ Flashcard nào khớp với bộ lọc hiện tại.
          </p>
          <button
            onClick={() => {
              setSelectedLevel('all');
              setSelectedStage('all');
              setSrsMode('all');
              setSearchQuery('');
            }}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
          >
            Xem toàn bộ {ALL_FLASHCARDS.length} thẻ
          </button>
        </div>
      ) : (
        /* Main Flashcard */
        <div className="rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6 min-h-[380px] flex flex-col justify-between">
          {/* Card Top Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">
                Thẻ {safeIdx + 1}/{cards.length}
              </span>
              <LevelBadge level={currentCard.level} showVi />
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-sky-300">
                {currentCard.category}
              </span>
            </div>

            {cardSrs && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Hộp SRS #{cardSrs.box} • Chu kỳ: {cardSrs.intervalDays} ngày
              </span>
            )}
          </div>

          {/* Front or Back Content */}
          {!isFlipped ? (
            <div
              onClick={() => setIsFlipped(true)}
              className="cursor-pointer py-8 space-y-4 text-center"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> Câu hỏi / Khái niệm (Bấm vào thẻ hoặc nhấn Space để lật)
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white max-w-2xl mx-auto leading-relaxed">
                {currentCard.frontQuestion}
              </h2>
              {currentCard.frontHint && (
                <p className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 italic">
                  <Lightbulb
                    className="h-3.5 w-3.5 text-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Gợi ý: {currentCard.frontHint}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Đáp án & Giải thích Bản chất:
                </div>
                <p className="text-sm text-slate-100 leading-relaxed">
                  <RichTextWithTerms text={currentCard.backAnswer} />
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Lightbulb className="h-4 w-4" />
                  <span>Hình tượng hóa dễ nhớ:</span>
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  {currentCard.backAnalogy}
                </p>
              </div>

              {currentCard.codeSnippet && (
                <pre className="ide-dark-surface overflow-x-auto rounded-xl border border-slate-800 bg-[#090d16] p-3.5 font-mono text-xs leading-5">
                  <code>{renderHighlightedPython(currentCard.codeSnippet)}</code>
                </pre>
              )}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(
                    (prev) => (prev - 1 + cards.length) % cards.length
                  );
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <button
                onClick={() => setIsFlipped((f) => !f)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>{isFlipped ? 'Lật lại Câu hỏi' : 'Lật xem Đáp án'}</span>
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => (prev + 1) % cards.length);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Tiếp <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* SRS Grading Buttons */}
            {isFlipped && (
              <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 sm:pt-0">
                <span className="col-span-2 sm:col-span-1 text-[11px] text-slate-400 mr-1">
                  Đánh giá mức độ nhớ (SRS):
                </span>
                <button
                  onClick={() => handleRate('again')}
                  className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-2 sm:py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
                >
                  [1] Quên (10p)
                </button>
                <button
                  onClick={() => handleRate('hard')}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-2 sm:py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
                >
                  [2] Khó (1 ngày)
                </button>
                <button
                  onClick={() => handleRate('good')}
                  className="rounded-lg bg-sky-500/20 border border-sky-500/40 px-3 py-2 sm:py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30"
                >
                  [3] Tốt (2+ ngày)
                </button>
                <button
                  onClick={() => handleRate('easy')}
                  className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 sm:py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                >
                  [4] Rất dễ (4+ ngày)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
