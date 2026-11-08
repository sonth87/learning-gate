import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  MessageSquarePlus,
  Circle,
  Search,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bug,
  Puzzle,
  ArrowRightLeft,
  Cpu,
  Dumbbell,
  Layers,
  X,
  SlidersHorizontal,
  ListFilter,
  RotateCcw,
} from 'lucide-react';
import { ALL_EXERCISES } from '@/data/practice/exercisesData';
import { PracticeCategory } from '@/types/practice.types';
import { StageId, SkillLevel } from '@/types/curriculum.types';
import { SKILL_LEVELS } from '@/constants/levels';
import { CURRICULUM_STAGES } from '@/constants/stages';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { ExerciseGuidePanel } from './ExerciseGuidePanel';
import { CodeWorkspace } from './CodeWorkspace';
import { cn } from '@/utils/cn';

const CATEGORY_META: {
  id: PracticeCategory | 'all';
  label: string;
  shortLabel: string;
  badgeColor: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'all',
    label: 'Tất cả chuyên mục',
    shortLabel: 'Tất cả',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: <Layers className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'code-gym',
    label: 'Code Gym & Pythonic',
    shortLabel: 'Code Gym',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'js-to-py',
    label: 'Chuyển đổi JS/TS → Python',
    shortLabel: 'JS/TS → Py',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'debug-rescue',
    label: 'Săn Bug & Cứu hộ Code',
    shortLabel: 'Săn Bug',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: <Bug className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'brain-teaser',
    label: 'Giải đố Cơ chế',
    shortLabel: 'Giải đố',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: <Puzzle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'architecture',
    label: 'Backend, Async & Data',
    shortLabel: 'Kiến trúc/Async',
    badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    icon: <Cpu className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

export const PracticeHub: React.FC = () => {
  const {
    selectedExerciseId,
    selectExercise,
    filterLevel,
    setFilterLevel,
    openNotesDrawer,
  } = useNavigationStore();
  const { submissions } = useUserDataStore();

  const [selectedCategory, setSelectedCategory] = useState<
    PracticeCategory | 'all'
  >('all');
  const [selectedStage, setSelectedStage] = useState<StageId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'unsolved' | 'solved'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'split' | 'guide' | 'editor'>(
    'split'
  );

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_EXERCISES.filter((ex) => {
      if (filterLevel !== 'all' && ex.level !== filterLevel) return false;
      if (
        selectedCategory !== 'all' &&
        (ex.category || 'code-gym') !== selectedCategory
      ) {
        return false;
      }
      if (selectedStage !== 'all' && ex.stageId !== selectedStage) return false;
      const isSolved = Boolean(submissions[ex.id]?.passed);
      if (statusFilter === 'solved' && !isSolved) return false;
      if (statusFilter === 'unsolved' && isSolved) return false;
      if (q) {
        const matchTitle = ex.title.toLowerCase().includes(q);
        const matchProblem = ex.problemStatement.toLowerCase().includes(q);
        const matchId = ex.id.toLowerCase().includes(q);
        if (!matchTitle && !matchProblem && !matchId) return false;
      }
      return true;
    });
  }, [
    filterLevel,
    selectedCategory,
    selectedStage,
    statusFilter,
    searchQuery,
    submissions,
  ]);

  const currentExercise =
    filteredExercises.find((e) => e.id === selectedExerciseId) ||
    ALL_EXERCISES.find((e) => e.id === selectedExerciseId) ||
    filteredExercises[0] ||
    ALL_EXERCISES[0];

  const currentIndexInFiltered = filteredExercises.findIndex(
    (e) => e.id === currentExercise.id
  );

  const solvedCount = ALL_EXERCISES.filter(
    (ex) => submissions[ex.id]?.passed
  ).length;

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStage !== 'all' ? 1 : 0) +
    (filterLevel !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedStage('all');
    setFilterLevel('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const handleRandomChallenge = () => {
    const pool = filteredExercises.filter((ex) => !submissions[ex.id]?.passed);
    const targetPool = pool.length > 0 ? pool : filteredExercises;
    if (targetPool.length === 0) return;
    const randomEx =
      targetPool[Math.floor(Math.random() * targetPool.length)];
    selectExercise(randomEx.id);
    setIsPickerOpen(false);
  };

  const handlePrevExercise = () => {
    if (filteredExercises.length === 0) return;
    const idx =
      currentIndexInFiltered > 0
        ? currentIndexInFiltered - 1
        : filteredExercises.length - 1;
    selectExercise(filteredExercises[idx].id);
  };

  const handleNextExercise = () => {
    if (filteredExercises.length === 0) return;
    const idx =
      currentIndexInFiltered >= 0 &&
      currentIndexInFiltered < filteredExercises.length - 1
        ? currentIndexInFiltered + 1
        : 0;
    selectExercise(filteredExercises[idx].id);
  };

  const currentCatMeta =
    CATEGORY_META.find(
      (c) => c.id === (currentExercise.category || 'code-gym')
    ) || CATEGORY_META[1];

  const isCurrentSolved = Boolean(submissions[currentExercise.id]?.passed);

  return (
    <div className="mx-auto max-w-[1680px] px-3 sm:px-6 py-3.5 space-y-3.5">
      {/* Single Sleek Unified Top IDE Bar */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 px-3.5 py-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Problem Selector Trigger + Prev/Next */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Prev/Next Navigation */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/90 p-0.5 shrink-0">
              <button
                onClick={handlePrevExercise}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Bài tập trước"
                aria-label="Bài tập trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-emerald-400 select-none">
                {currentIndexInFiltered >= 0 ? currentIndexInFiltered + 1 : 1}/
                {filteredExercises.length || ALL_EXERCISES.length}
              </span>
              <button
                onClick={handleNextExercise}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Bài tập tiếp theo"
                aria-label="Bài tập tiếp theo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Active Exercise Selector Button (Opens Problem Browser) */}
            <button
              onClick={() => setIsPickerOpen((v) => !v)}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left min-w-0 flex-1 sm:flex-initial sm:max-w-2xl transition-all cursor-pointer',
                isPickerOpen
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/80 text-slate-100 hover:border-slate-700 hover:bg-slate-900'
              )}
              title="Bấm để mở danh sách 70 bài tập & bộ lọc"
            >
              {isCurrentSolved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <ListFilter className="h-4 w-4 text-emerald-400 shrink-0" />
              )}

              <span className="font-mono text-sm sm:text-base font-bold text-white truncate">
                {currentExercise.title}
              </span>

              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <LevelBadge level={currentExercise.level} />
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                    currentCatMeta.badgeColor
                  )}
                >
                  {currentCatMeta.icon}
                  <span>{currentCatMeta.shortLabel}</span>
                </span>
              </div>

              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 shrink-0 ml-auto sm:ml-1 transition-transform duration-200',
                  isPickerOpen && 'rotate-180 text-emerald-400'
                )}
              />
            </button>
          </div>

          {/* Right: Compact Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Progress Badge */}
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Đã giải {solvedCount}/{ALL_EXERCISES.length}
              </span>
            </span>

            {/* Filter & Problem List Toggle Button */}
            <button
              onClick={() => setIsPickerOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                isPickerOpen || activeFilterCount > 0
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:bg-slate-800'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Chọn bài & Lọc</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-950">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Random Challenge Button */}
            <button
              onClick={handleRandomChallenge}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/15 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
              title="Chọn ngẫu nhiên 1 bài tập chưa giải"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ngẫu nhiên</span>
            </button>

            {/* Notes Button */}
            <button
              onClick={() =>
                openNotesDrawer(
                  'exercise',
                  currentExercise.id,
                  currentExercise.title
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mở ghi chú cá nhân cho bài tập này"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ghi chú</span>
            </button>
          </div>
        </div>

        {/* Collapsible Drawer: Problem Browser & Filters (Only shown when user clicks "Chọn bài & Lọc" or Title) */}
        {isPickerOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-3 animate-in fade-in duration-150">
            {/* Search + Category Pills + Dropdowns */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Category Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {CATEGORY_META.map((cat) => {
                  const count =
                    cat.id === 'all'
                      ? ALL_EXERCISES.length
                      : ALL_EXERCISES.filter(
                          (e) => (e.category || 'code-gym') === cat.id
                        ).length;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer',
                        active
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                      )}
                    >
                      {cat.icon}
                      <span>{cat.shortLabel}</span>
                      <span className="rounded bg-slate-900 px-1 font-mono text-[10px] text-slate-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Compact Select Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên bài, từ khóa..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedStage}
                  onChange={(e) =>
                    setSelectedStage(e.target.value as StageId | 'all')
                  }
                  aria-label="Lọc theo Giai đoạn"
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Mọi Giai đoạn (1–7)</option>
                  {CURRICULUM_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      GĐ {st.number}: {st.title.replace(/^Giai đoạn \d+:\s*/, '')}
                    </option>
                  ))}
                </select>

                <select
                  value={filterLevel}
                  onChange={(e) =>
                    setFilterLevel(e.target.value as SkillLevel | 'all')
                  }
                  aria-label="Lọc theo Cấp độ"
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Mọi Cấp độ</option>
                  {SKILL_LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.label} — {lvl.viLabel}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'unsolved' | 'solved'
                    )
                  }
                  aria-label="Lọc theo Trạng thái"
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">Mọi trạng thái</option>
                  <option value="unsolved">Chưa giải</option>
                  <option value="solved">Đã vượt qua ✓</option>
                </select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Xóa lọc</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scannable Multi-Column Problem Grid */}
            {filteredExercises.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
                Không có bài tập nào khớp với bộ lọc hiện tại.{' '}
                <button
                  onClick={resetAllFilters}
                  className="text-emerald-400 underline font-semibold ml-1 cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredExercises.map((ex, idx) => {
                  const isSelected = ex.id === currentExercise.id;
                  const isPassed = submissions[ex.id]?.passed;
                  const catMeta =
                    CATEGORY_META.find(
                      (c) => c.id === (ex.category || 'code-gym')
                    ) || CATEGORY_META[1];

                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        selectExercise(ex.id);
                        setIsPickerOpen(false);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-white shadow-xs'
                          : 'border-slate-800/90 bg-slate-950/75 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isPassed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle
                            className={cn(
                              'h-3.5 w-3.5 shrink-0',
                              isSelected ? 'text-emerald-400' : 'text-slate-600'
                            )}
                          />
                        )}
                        <span className="font-mono text-[11px] text-slate-500 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold truncate">
                          {ex.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            'hidden sm:inline-flex items-center rounded border px-1.5 py-0.2 text-[10px] font-medium',
                            catMeta.badgeColor
                          )}
                        >
                          {catMeta.shortLabel}
                        </span>
                        <LevelBadge level={ex.level} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile & Tablet Mode Switcher (< lg): Quickly jump between Problem Guide and Code Editor */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 lg:hidden">
        <button
          onClick={() => setMobilePane('split')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobilePane === 'split'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Xem cả 2
        </button>
        <button
          onClick={() => setMobilePane('guide')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobilePane === 'guide'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Đề bài & Gợi ý
        </button>
        <button
          onClick={() => setMobilePane('editor')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors',
            mobilePane === 'editor'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Code & Chấm bài
        </button>
      </div>

      {/* 2-Column Split IDE Workspace: Tabbed Guide Left, Editor & Test Runner Right */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        <div
          className={cn(
            'lg:col-span-5 min-w-0',
            mobilePane === 'editor' && 'hidden lg:block'
          )}
        >
          <ExerciseGuidePanel exercise={currentExercise} />
        </div>
        <div
          className={cn(
            'lg:col-span-7 min-w-0',
            mobilePane === 'guide' && 'hidden lg:block'
          )}
        >
          <CodeWorkspace exercise={currentExercise} />
        </div>
      </div>
    </div>
  );
};
