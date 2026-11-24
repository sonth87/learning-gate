import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Layers,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  PMP_BOOK_TERM_DECK,
  PMP_TERM_AREAS,
  type PmpBookTermCard,
  type PmpTermAreaId,
} from '@/data/courses/pmp/termDeck';
import { usePmpCurriculum } from '../data';
import { pmpDueCards } from '../logic';
import { usePmpNav, usePmpProgress } from '../store';
import { CourseMarkdown } from '@/features/devops-course/components/CourseMarkdown';
import { CourseBar, CourseBtn } from '@/features/devops-course/components/CourseUi';
import { Callout, Spinner } from '@/features/workpath/components/ui';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

type DeckMode = 'term-to-def' | 'def-to-term' | 'match-group' | 'srs-reflex';

interface DeckProgressState {
  knownIds: string[];
  learningIds: string[];
  flaggedIds: string[];
}

const DECK_STORAGE_KEY = 'pmp_book_term_deck_v1';

function loadDeckProgress(): DeckProgressState {
  if (typeof window === 'undefined') {
    return { knownIds: [], learningIds: [], flaggedIds: [] };
  }
  try {
    const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return { knownIds: [], learningIds: [], flaggedIds: [] };
    const parsed = JSON.parse(raw) as Partial<DeckProgressState>;
    return {
      knownIds: Array.isArray(parsed.knownIds) ? parsed.knownIds : [],
      learningIds: Array.isArray(parsed.learningIds) ? parsed.learningIds : [],
      flaggedIds: Array.isArray(parsed.flaggedIds) ? parsed.flaggedIds : [],
    };
  } catch {
    return { knownIds: [], learningIds: [], flaggedIds: [] };
  }
}

function saveDeckProgress(next: DeckProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const PmpFlashView: React.FC<{ moduleId?: string }> = ({ moduleId }) => {
  const { data: cur } = usePmpCurriculum();
  const rate = usePmpProgress((x) => x.rateCard);
  const { go, back } = usePmpNav();
  const lang = useWorkbenchStore((s) => s.language);

  const [mode, setMode] = useState<DeckMode>('term-to-def');
  const [selectedArea, setSelectedArea] = useState<PmpTermAreaId | 'all'>('all');
  const [onlyLearning, setOnlyLearning] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [deckState, setDeckState] = useState<DeckProgressState>(() => loadDeckProgress());

  // Card deck state
  const [cardIdx, setCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Match-the-group state
  const [groupIdx, setGroupIdx] = useState(0);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [matchChecked, setMatchChecked] = useState(false);
  const [showGroupReview, setShowGroupReview] = useState(true);

  // Legacy SRS Reflex state
  const [srsIdx, setSrsIdx] = useState(0);
  const [srsFlipped, setSrsFlipped] = useState(false);
  const [srsPracticeAll, setSrsPracticeAll] = useState(false);
  const [srsRemembered, setSrsRemembered] = useState(0);

  const knownSet = useMemo(() => new Set(deckState.knownIds), [deckState.knownIds]);
  const learningSet = useMemo(() => new Set(deckState.learningIds), [deckState.learningIds]);
  const flaggedSet = useMemo(() => new Set(deckState.flaggedIds), [deckState.flaggedIds]);

  const updateDeck = (updater: (prev: DeckProgressState) => DeckProgressState) => {
    setDeckState((prev) => {
      const next = updater(prev);
      saveDeckProgress(next);
      return next;
    });
  };

  const markCardStatus = (id: string, known: boolean) => {
    updateDeck((prev) => {
      const k = new Set(prev.knownIds);
      const l = new Set(prev.learningIds);
      if (known) {
        k.add(id);
        l.delete(id);
      } else {
        l.add(id);
        k.delete(id);
      }
      return { ...prev, knownIds: Array.from(k), learningIds: Array.from(l) };
    });
  };

  const toggleFlag = (id: string) => {
    updateDeck((prev) => {
      const f = new Set(prev.flaggedIds);
      if (f.has(id)) f.delete(id);
      else f.add(id);
      return { ...prev, flaggedIds: Array.from(f) };
    });
  };

  const areaCounts = useMemo(() => {
    const counts = new Map<PmpTermAreaId, number>();
    for (const c of PMP_BOOK_TERM_DECK) {
      counts.set(c.area, (counts.get(c.area) ?? 0) + 1);
    }
    return counts;
  }, []);

  const filteredCards = useMemo(() => {
    let list = PMP_BOOK_TERM_DECK.filter((c) => {
      if (selectedArea !== 'all' && c.area !== selectedArea) return false;
      if (onlyLearning && !learningSet.has(c.id)) return false;
      if (onlyFlagged && !flaggedSet.has(c.id)) return false;
      return true;
    });
    if (shuffleSeed > 0) {
      list = shuffleArr(list);
    }
    return list;
  }, [selectedArea, onlyLearning, onlyFlagged, learningSet, flaggedSet, shuffleSeed]);

  const matchGroups = useMemo(() => {
    const bySub = new Map<string, PmpBookTermCard[]>();
    for (const c of PMP_BOOK_TERM_DECK) {
      if (selectedArea !== 'all' && c.area !== selectedArea) continue;
      const key = `${c.area}::${c.subtopic}`;
      const arr = bySub.get(key) ?? [];
      arr.push(c);
      bySub.set(key, arr);
    }
    return Array.from(bySub.entries())
      .map(([key, items]) => ({
        key,
        area: items[0].area,
        subtopic: items[0].subtopic,
        items: items.slice(0, 4),
      }))
      .filter((g) => g.items.length >= 3);
  }, [selectedArea]);

  const safeCardIdx = filteredCards.length > 0 ? Math.min(cardIdx, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeCardIdx];

  const safeGroupIdx = matchGroups.length > 0 ? groupIdx % matchGroups.length : 0;
  const activeGroup = matchGroups[safeGroupIdx];

  const shuffledMatchTerms = useMemo(() => {
    if (!activeGroup) return [];
    return shuffleArr(activeGroup.items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.key, safeGroupIdx, selectedArea]);

  const resetMatchState = () => {
    setAssignments({});
    setSelectedChipId(null);
    setMatchChecked(false);
  };

  useEffect(() => {
    setCardIdx(0);
    setCardFlipped(false);
    setGroupIdx(0);
    resetMatchState();
  }, [selectedArea, onlyLearning, onlyFlagged]);

  // Legacy SRS cards
  const srsCards = useMemo(() => {
    if (!cur) return [];
    const st = usePmpProgress.getState().state;
    const list = pmpDueCards(st, cur, moduleId, srsPracticeAll);
    return [...list].sort(() => Math.random() - 0.5).slice(0, 20);
  }, [cur, moduleId, srsPracticeAll]);
  const activeSrsCard = srsCards[srsIdx];

  const answerSrs = (ok: boolean) => {
    if (!activeSrsCard) return;
    rate(activeSrsCard.id, ok);
    if (ok) setSrsRemembered((n) => n + 1);
    setSrsIdx((n) => n + 1);
    setSrsFlipped(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.matches?.('input,textarea,select')) return;

      if (mode === 'srs-reflex') {
        if (ev.key === ' ') {
          ev.preventDefault();
          setSrsFlipped((f) => !f);
        } else if (srsFlipped && ev.key === '1') {
          answerSrs(false);
        } else if (srsFlipped && ev.key === '2') {
          answerSrs(true);
        }
        return;
      }

      if (mode === 'term-to-def' || mode === 'def-to-term') {
        if (!activeCard) return;
        if (ev.key === ' ') {
          ev.preventDefault();
          setCardFlipped((f) => !f);
        } else if (ev.key === 'ArrowRight') {
          setCardIdx((i) => Math.min(filteredCards.length - 1, i + 1));
          setCardFlipped(false);
        } else if (ev.key === 'ArrowLeft') {
          setCardIdx((i) => Math.max(0, i - 1));
          setCardFlipped(false);
        } else if (ev.key === '1') {
          markCardStatus(activeCard.id, false);
          if (safeCardIdx < filteredCards.length - 1) {
            setCardIdx(safeCardIdx + 1);
            setCardFlipped(false);
          }
        } else if (ev.key === '2') {
          markCardStatus(activeCard.id, true);
          if (safeCardIdx < filteredCards.length - 1) {
            setCardIdx(safeCardIdx + 1);
            setCardFlipped(false);
          }
        } else if (ev.key.toLowerCase() === 'f') {
          toggleFlag(activeCard.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeCard, safeCardIdx, filteredCards.length, srsFlipped, activeSrsCard]);

  if (!cur) return <Spinner />;

  const areaMeta = (id: PmpTermAreaId) =>
    PMP_TERM_AREAS.find((a) => a.id === id) ?? { id, labelVi: id, labelEn: id };

  const assignedTermIds = new Set(Object.values(assignments));
  const unassignedChips = shuffledMatchTerms.filter((t) => !assignedTermIds.has(t.id));
  const matchedCount = activeGroup
    ? activeGroup.items.filter((it) => assignments[it.id] === it.id).length
    : 0;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 text-[var(--dts-ink)]">
      {/* Header & Counters (modeled after PMP Term Deck) */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl sm:text-2xl font-extrabold tracking-tight">
            {lang === 'en' ? 'PMP Book Term Deck & SRS' : 'Kho Thuật Ngữ Theo Sách PMBOK & Ghép Nhóm'}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--dts-ink-muted)]">
            {lang === 'en'
              ? 'Master core PMBOK terms, Vietnamese equivalents, and easily confused concepts across 13 knowledge areas.'
              : 'Ôn trọn bộ khái niệm, công thức & thuật ngữ dễ nhầm theo từng chương sách PMBOK kèm chế độ ghép nhóm 4 cặp.'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-xs">
            <span>
              <b className="text-[var(--dts-ink)]">{PMP_BOOK_TERM_DECK.length}</b>{' '}
              <span className="text-[var(--dts-ink-muted)]">thẻ sách</span>
            </span>
            <span>
              <b className="text-[var(--dts-green-ink)]">{deckState.knownIds.length}</b>{' '}
              <span className="text-[var(--dts-ink-muted)]">đã thuộc</span>
            </span>
            <span>
              <b className="text-[var(--dts-amber-ink)]">{deckState.learningIds.length}</b>{' '}
              <span className="text-[var(--dts-ink-muted)]">đang ôn</span>
            </span>
            <span>
              <b className="text-[var(--dts-rose-ink)]">{deckState.flaggedIds.length}</b>{' '}
              <span className="text-[var(--dts-ink-muted)]">gắn cờ</span>
            </span>
          </div>
        </div>

        <CourseBtn accent="amber" onClick={back}>
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </CourseBtn>
      </div>

      {/* Mode Tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'term-to-def', label: 'Thuật ngữ → Định nghĩa' },
            { id: 'def-to-term', label: 'Định nghĩa → Thuật ngữ' },
            { id: 'match-group', label: 'Ghép nhóm 4 cặp' },
            { id: 'srs-reflex', label: 'Phản xạ SRS (Leitner)' },
          ] as Array<{ id: DeckMode; label: string }>
        ).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                'dts-btn-tactile rounded-full px-3.5 py-1.5 font-mono text-xs font-extrabold transition-all cursor-pointer',
                active
                  ? 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
                  : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Book Area Filters + Status Toggles (shown for Book Term Deck modes) */}
      {mode !== 'srs-reflex' && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedArea('all')}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                selectedArea === 'all'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
              )}
            >
              Tất cả · {PMP_BOOK_TERM_DECK.length}
            </button>
            {PMP_TERM_AREAS.map((area) => {
              const count = areaCounts.get(area.id) ?? 0;
              const active = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedArea(area.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer',
                    active
                      ? 'border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                  )}
                >
                  {area.labelVi} · {count}
                </button>
              );
            })}
          </div>

          {mode !== 'match-group' && (
            <div className="flex flex-wrap items-center justify-end gap-4 font-mono text-xs text-[var(--dts-ink-soft)]">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyLearning}
                  onChange={(e) => setOnlyLearning(e.target.checked)}
                  className="accent-amber-600"
                />
                <span>Chỉ thẻ đang ôn</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyFlagged}
                  onChange={(e) => setOnlyFlagged(e.target.checked)}
                  className="accent-rose-600"
                />
                <span>Chỉ thẻ gắn cờ ⚑</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* MODE 1 & 2: TERM <-> DEFINITION INDEX CARD */}
      {(mode === 'term-to-def' || mode === 'def-to-term') && (
        <>
          {!activeCard ? (
            <div className="dts-panel rounded-2xl p-6 text-center space-y-3">
              <p className="font-mono text-sm font-bold">
                Không có thẻ nào khớp bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedArea('all');
                  setOnlyLearning(false);
                  setOnlyFlagged(false);
                }}
                className="dts-btn-tactile rounded-xl bg-[var(--dts-amber-bg)] px-3.5 py-1.5 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]"
              >
                Hiển thị lại toàn bộ thẻ
              </button>
            </div>
          ) : (
            <>
              <div
                onClick={() => setCardFlipped((f) => !f)}
                className="dts-card-tactile flex min-h-[260px] cursor-pointer flex-col justify-between rounded-2xl bg-[var(--dts-panel-elevated)] p-6 sm:p-7 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-rose-500/35 pb-2.5 font-mono text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    <span>
                      {areaMeta(activeCard.area).labelEn} · {activeCard.subtopic}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {knownSet.has(activeCard.id) && (
                        <span className="rounded bg-[var(--dts-green-bg)] px-1.5 py-0.5 text-[9.5px] text-[var(--dts-green-ink)]">
                          Đã thuộc
                        </span>
                      )}
                      {learningSet.has(activeCard.id) && (
                        <span className="rounded bg-[var(--dts-amber-bg)] px-1.5 py-0.5 text-[9.5px] text-[var(--dts-amber-ink)]">
                          Đang ôn
                        </span>
                      )}
                      {flaggedSet.has(activeCard.id) && (
                        <span className="rounded bg-[var(--dts-rose-bg)] px-1.5 py-0.5 text-[9.5px] text-[var(--dts-rose-ink)]">
                          ⚑ Đã gắn cờ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Front */}
                  <div className="mt-5">
                    {mode === 'term-to-def' ? (
                      <h2 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--dts-ink)]">
                        {activeCard.term}
                      </h2>
                    ) : (
                      <p className="text-base sm:text-lg font-semibold leading-relaxed text-[var(--dts-ink)]">
                        {activeCard.definition}
                      </p>
                    )}
                  </div>

                  {/* Card Back (Revealed on flip) */}
                  {cardFlipped && (
                    <div className="mt-5 border-t border-[var(--dts-border-soft)] pt-4 space-y-2.5 animate-in fade-in duration-150">
                      {mode === 'term-to-def' ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--dts-amber-soft)] px-2.5 py-1 font-mono text-xs font-extrabold text-[var(--dts-amber-ink)]">
                            Tiếng Việt: {activeCard.viTerm}
                          </div>
                          <p className="text-sm sm:text-[15px] leading-relaxed font-medium text-[var(--dts-ink)]">
                            {activeCard.definition}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="font-mono text-xl sm:text-2xl font-extrabold text-[var(--dts-green-ink)]">
                            {activeCard.term}
                          </div>
                          <div className="font-mono text-xs font-bold text-[var(--dts-amber-ink)]">
                            Tiếng Việt: {activeCard.viTerm}
                          </div>
                        </>
                      )}

                      {activeCard.compareWith && activeCard.compareWith.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[11px] text-[var(--dts-ink-muted)]">
                          <span>Đối chiếu phân biệt:</span>
                          {activeCard.compareWith.map((cw) => (
                            <span
                              key={cw}
                              className="rounded border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 py-0.5 font-bold text-[var(--dts-ink-soft)]"
                            >
                              {cw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 font-mono text-xs text-[var(--dts-ink-muted)]">
                  {cardFlipped
                    ? 'Nhấn để úp thẻ lại · hoặc chọn mức độ nắm vững bên dưới.'
                    : mode === 'term-to-def'
                      ? 'Tự nhẩm định nghĩa trong đầu, rồi bấm vào thẻ (hoặc Space) để lật.'
                      : 'Đây là thuật ngữ nào? Bấm vào thẻ (hoặc Space) để kiểm tra.'}
                </div>
              </div>

              {/* Navigation & Rating Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeCardIdx === 0}
                    onClick={() => {
                      setCardIdx((i) => Math.max(0, i - 1));
                      setCardFlipped(false);
                    }}
                    className="dts-btn-tactile inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] disabled:opacity-40 cursor-pointer"
                    aria-label="Thẻ trước"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeCardIdx >= filteredCards.length - 1}
                    onClick={() => {
                      setCardIdx((i) => Math.min(filteredCards.length - 1, i + 1));
                      setCardFlipped(false);
                    }}
                    className="dts-btn-tactile inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] disabled:opacity-40 cursor-pointer"
                    aria-label="Thẻ tiếp theo"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShuffleSeed((s) => s + 1);
                      setCardIdx(0);
                      setCardFlipped(false);
                    }}
                    className="dts-btn-tactile inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--dts-panel-elevated)] px-3 font-mono text-xs font-bold cursor-pointer"
                  >
                    <Shuffle className="h-3.5 w-3.5" /> Xáo trộn
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFlag(activeCard.id)}
                    className={cn(
                      'dts-btn-tactile inline-flex h-9 items-center gap-1.5 rounded-xl px-3 font-mono text-xs font-bold cursor-pointer',
                      flaggedSet.has(activeCard.id)
                        ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                        : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                    )}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {flaggedSet.has(activeCard.id) ? 'Đã gắn cờ' : 'Gắn cờ'}
                  </button>
                </div>

                <span className="font-mono text-xs font-bold text-[var(--dts-ink-muted)] tabular-nums">
                  {safeCardIdx + 1} / {filteredCards.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markCardStatus(activeCard.id, false);
                      if (safeCardIdx < filteredCards.length - 1) {
                        setCardIdx(safeCardIdx + 1);
                        setCardFlipped(false);
                      }
                    }}
                    className="dts-btn-tactile rounded-xl bg-[var(--dts-rose-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-rose-ink)] cursor-pointer"
                  >
                    Cần ôn lại <kbd className="ml-1 hidden opacity-70 sm:inline">1</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markCardStatus(activeCard.id, true);
                      if (safeCardIdx < filteredCards.length - 1) {
                        setCardIdx(safeCardIdx + 1);
                        setCardFlipped(false);
                      }
                    }}
                    className="dts-btn-tactile rounded-xl bg-[var(--dts-green-bg)] px-3.5 py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)] cursor-pointer"
                  >
                    Đã thuộc <kbd className="ml-1 hidden opacity-70 sm:inline">2</kbd>
                  </button>
                </div>
              </div>

              <p className="mt-2 font-mono text-[11px] text-[var(--dts-ink-muted)]">
                Phím tắt: <kbd className="rounded border px-1">Space</kbd> lật thẻ ·{' '}
                <kbd className="rounded border px-1">←</kbd>{' '}
                <kbd className="rounded border px-1">→</kbd> chuyển thẻ ·{' '}
                <kbd className="rounded border px-1">1</kbd> Cần ôn ·{' '}
                <kbd className="rounded border px-1">2</kbd> Đã thuộc ·{' '}
                <kbd className="rounded border px-1">F</kbd> Gắn cờ
              </p>
            </>
          )}
        </>
      )}

      {/* MODE 3: MATCH THE GROUP (4 Terms <-> 4 Definitions + Review Grid) */}
      {mode === 'match-group' && activeGroup && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="font-extrabold text-[var(--dts-ink)]">
              {areaMeta(activeGroup.area).labelEn} · {activeGroup.subtopic}
            </span>
            <span className="text-[var(--dts-ink-muted)]">
              Bộ {safeGroupIdx + 1}/{matchGroups.length}
              {matchChecked && (
                <>
                  {' · '}
                  <b className="text-[var(--dts-green-ink)]">
                    Đúng {matchedCount}/{activeGroup.items.length} cặp
                  </b>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
            {/* Left column: Term Chips */}
            <div>
              <div className="mb-2 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Thuật ngữ ({unassignedChips.length})
              </div>
              <div className="space-y-2 rounded-2xl border border-dashed border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-3 min-h-[140px]">
                {unassignedChips.length === 0 ? (
                  <p className="text-center font-mono text-[11px] text-[var(--dts-ink-muted)] py-6">
                    Đã ghép hết tất cả thẻ sang ô định nghĩa! Bấm <b>Kiểm tra</b> bên dưới.
                  </p>
                ) : (
                  unassignedChips.map((chip) => {
                    const isPicked = selectedChipId === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        draggable={!matchChecked}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', chip.id);
                          setSelectedChipId(chip.id);
                        }}
                        onClick={() =>
                          setSelectedChipId((curId) => (curId === chip.id ? null : chip.id))
                        }
                        className={cn(
                          'dts-btn-tactile w-full rounded-xl px-3 py-2 text-left font-mono text-xs font-extrabold transition-all cursor-grab active:cursor-grabbing',
                          isPicked
                            ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] ring-2 ring-amber-500/40'
                            : 'bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)]'
                        )}
                      >
                        {chip.term}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right column: Definition Drop Slots */}
            <div>
              <div className="mb-2 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                Định nghĩa theo sách
              </div>
              <div className="space-y-2.5">
                {activeGroup.items.map((defItem) => {
                  const placedTermId = assignments[defItem.id];
                  const placedTerm = placedTermId
                    ? activeGroup.items.find((t) => t.id === placedTermId)
                    : undefined;
                  const isCorrect = matchChecked && placedTermId === defItem.id;
                  const isWrong = matchChecked && placedTermId !== defItem.id;

                  return (
                    <div
                      key={defItem.id}
                      onDragOver={(e) => {
                        if (!matchChecked) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (matchChecked) return;
                        e.preventDefault();
                        const droppedId = e.dataTransfer.getData('text/plain') || selectedChipId;
                        if (!droppedId) return;
                        setAssignments((prev) => {
                          const next = { ...prev };
                          for (const [k, v] of Object.entries(next)) {
                            if (v === droppedId) delete next[k];
                          }
                          next[defItem.id] = droppedId;
                          return next;
                        });
                        setSelectedChipId(null);
                      }}
                      onClick={() => {
                        if (matchChecked) return;
                        if (selectedChipId) {
                          setAssignments((prev) => {
                            const next = { ...prev };
                            for (const [k, v] of Object.entries(next)) {
                              if (v === selectedChipId) delete next[k];
                            }
                            next[defItem.id] = selectedChipId;
                            return next;
                          });
                          setSelectedChipId(null);
                        } else if (placedTermId) {
                          setAssignments((prev) => {
                            const next = { ...prev };
                            delete next[defItem.id];
                            return next;
                          });
                        }
                      }}
                      className={cn(
                        'rounded-2xl border p-3.5 transition-colors',
                        !matchChecked &&
                          'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] hover:border-[var(--dts-border)] cursor-pointer',
                        isCorrect &&
                          'border-emerald-500 bg-[var(--dts-green-soft)]',
                        isWrong && 'border-rose-500 bg-[var(--dts-rose-soft)]'
                      )}
                    >
                      <p className="text-xs sm:text-[13px] font-medium leading-relaxed text-[var(--dts-ink)]">
                        {defItem.definition}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-dashed border-[var(--dts-line-strong)] bg-[var(--dts-panel)]/70 px-3 py-2 font-mono text-xs">
                        {placedTerm ? (
                          <>
                            <span className="font-extrabold text-[var(--dts-ink)]">
                              {placedTerm.term}
                            </span>
                            {!matchChecked && (
                              <span className="text-[10.5px] text-[var(--dts-ink-muted)]">
                                Bấm để gỡ
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-[var(--dts-ink-muted)]">
                            {selectedChipId
                              ? 'Bấm vào đây để đặt thuật ngữ đang chọn'
                              : 'Kéo thuật ngữ vào đây (hoặc chạm chọn thẻ bên trái rồi chạm vào ô này)'}
                          </span>
                        )}
                      </div>

                      {isWrong && (
                        <div className="mt-2 font-mono text-[11px] font-extrabold text-[var(--dts-rose-ink)]">
                          Đáp án đúng: {defItem.term} ({defItem.viTerm})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={resetMatchState}
              className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-panel-elevated)] px-3.5 py-2 font-mono text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Làm lại
            </button>
            <button
              type="button"
              onClick={() => {
                setMatchChecked(true);
                setShowGroupReview(true);
                for (const item of activeGroup.items) {
                  markCardStatus(item.id, assignments[item.id] === item.id);
                }
              }}
              className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-blue-bg)] px-4 py-2 font-mono text-xs font-extrabold text-[var(--dts-blue-ink)] cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" /> Kiểm tra
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupIdx((g) => (g + 1) % matchGroups.length);
                resetMatchState();
              }}
              className="dts-btn-tactile inline-flex items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-4 py-2 font-mono text-xs font-extrabold text-[var(--dts-green-ink)] cursor-pointer"
            >
              Bộ tiếp theo <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapsible 2x2 Review Set Grid after Check */}
          {matchChecked && (
            <div className="rounded-2xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--dts-amber-ink)]" />
                  Đối chiếu chi tiết bộ thẻ này
                </div>
                <button
                  type="button"
                  onClick={() => setShowGroupReview((v) => !v)}
                  className="font-mono text-xs font-bold text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)] cursor-pointer"
                >
                  {showGroupReview ? 'Thu gọn' : 'Mở rộng'}
                </button>
              </div>
              {showGroupReview && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeGroup.items.map((item) => {
                    const ok = assignments[item.id] === item.id;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-mono text-sm font-extrabold text-[var(--dts-ink)]">
                              {item.term}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-[var(--dts-amber-ink)]">
                              {item.viTerm}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold',
                              ok
                                ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                                : 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                            )}
                          >
                            {ok ? (
                              <>
                                <Check className="h-3 w-3" /> khớp
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3" /> nhầm
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-[var(--dts-ink-soft)]">
                          {item.definition}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          {item.compareWith && item.compareWith.length > 0 ? (
                            <span className="font-mono text-[10px] text-[var(--dts-ink-muted)]">
                              So với: {item.compareWith.join(', ')}
                            </span>
                          ) : (
                            <span />
                          )}
                          <button
                            type="button"
                            onClick={() => toggleFlag(item.id)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold cursor-pointer',
                              flaggedSet.has(item.id)
                                ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)]'
                                : 'text-[var(--dts-ink-muted)] hover:text-[var(--dts-ink)]'
                            )}
                          >
                            <Flag className="h-2.5 w-2.5" />
                            {flaggedSet.has(item.id) ? 'Đã cờ' : 'Gắn cờ'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 4: LEGACY SRS SITUATIONAL REFLEX CARDS */}
      {mode === 'srs-reflex' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--dts-ink-muted)]">
              <Layers className="h-3.5 w-3.5" />
              Lặp lại ngắt quãng 5 hộp: nhớ → giãn lịch 1 · 2 · 4 · 8 · 16 ngày
            </span>
          </div>

          {srsCards.length === 0 ? (
            <div className="space-y-3">
              <Callout tone="ok">
                Không có thẻ phản xạ nào đến hạn ôn hôm nay 🎉. Đọc thêm module để mở khoá thẻ mới, hoặc bấm bên dưới để ôn trước bộ thẻ phản xạ cốt lõi.
              </Callout>
              <CourseBtn variant="primary" accent="amber" onClick={() => setSrsPracticeAll(true)}>
                Ôn thử ngay các thẻ có sẵn
              </CourseBtn>
            </div>
          ) : srsIdx >= srsCards.length ? (
            <div className="space-y-3">
              <Callout tone="ok">
                Hoàn tất phiên ôn phản xạ: nhớ vững <b>{srsRemembered}</b>/{srsCards.length} thẻ.
              </Callout>
              <CourseBtn variant="primary" accent="amber" onClick={() => go({ name: 'home' })}>
                Về tổng quan
              </CourseBtn>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-3 font-mono text-xs text-[var(--dts-ink-muted)]">
                <span>
                  Thẻ {srsIdx + 1}/{srsCards.length} · {activeSrsCard.id}
                </span>
                <CourseBar value={srsIdx / srsCards.length} accent="amber" className="max-w-[200px]" />
              </div>
              <div className="dts-card-tactile flex min-h-[240px] flex-col justify-center rounded-2xl bg-[var(--dts-panel-elevated)] p-6 sm:p-8">
                <CourseMarkdown source={activeSrsCard.front} accent="amber" className="text-lg" />
                {srsFlipped && (
                  <>
                    <hr className="my-4 border-[var(--dts-border-soft)]" />
                    <CourseMarkdown source={activeSrsCard.back} accent="amber" />
                  </>
                )}
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {srsFlipped ? (
                  <>
                    <CourseBtn variant="danger" accent="amber" onClick={() => answerSrs(false)}>
                      Chưa chắc / Quên <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">1</kbd>
                    </CourseBtn>
                    <CourseBtn variant="primary" accent="amber" onClick={() => answerSrs(true)}>
                      ✔ Phản xạ chuẩn <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">2</kbd>
                    </CourseBtn>
                  </>
                ) : (
                  <CourseBtn variant="primary" accent="amber" onClick={() => setSrsFlipped(true)}>
                    Lật xem phản xạ chuẩn PMI <kbd className="ml-1 hidden rounded bg-black/15 px-1 text-[10px] sm:inline">Space</kbd>
                  </CourseBtn>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
