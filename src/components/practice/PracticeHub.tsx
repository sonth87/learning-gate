import React, { useState, useMemo } from 'react';
import {
  Code2,
  CheckCircle2,
  MessageSquarePlus,
  Circle,
  Search,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Bug,
  Puzzle,
  ArrowRightLeft,
  Cpu,
  Dumbbell,
  Layers,
  X,
} from 'lucide-react';
import { ALL_EXERCISES } from '@/data/practice/exercisesData';
import { PracticeCategory } from '@/types/practice.types';
import { StageId } from '@/types/curriculum.types';
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
    label: 'Giải đố Cơ chế (Brain Teasers)',
    shortLabel: 'Giải đố',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: <Puzzle className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    id: 'architecture',
    label: 'Backend, AsyncIO, Data & AI',
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'solved'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleRandomChallenge = () => {
    const pool = filteredExercises.filter((ex) => !submissions[ex.id]?.passed);
    const targetPool = pool.length > 0 ? pool : filteredExercises;
    if (targetPool.length === 0) return;
    const randomEx =
      targetPool[Math.floor(Math.random() * targetPool.length)];
    selectExercise(randomEx.id);
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

  return (
    <div className="mx-auto max-w-[1680px] px-4 sm:px-6 py-5 space-y-4">
      {/* Compact IDE Control Bar */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-base font-bold text-white">
                  Code Gym & Đấu trường Thực hành Python
                </h1>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                  Đã giải {solvedCount}/{ALL_EXERCISES.length} bài
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thiết kế cho lập trình viên đã biết code chuyển sang làm chủ Python: Code Gym, Chuyển đổi JS/TS → Python, Săn Bug, Giải đố & Kiến trúc Production.
              </p>
            </div>
          </div>

          {/* Search & Random Challenge Action */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài tập, từ khóa..."
                className="w-full sm:w-56 rounded-xl border border-slate-800 bg-slate-950/90 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
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

            <button
              onClick={handleRandomChallenge}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer shrink-0"
              title="Chọn ngẫu nhiên 1 bài tập chưa giải trong bộ lọc hiện tại"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Thử thách Ngẫu nhiên</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/70">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:flex-wrap">
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
                    'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 sm:py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer',
                    active
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/80'
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className="rounded bg-slate-900/90 px-1.5 py-0.2 font-mono text-[10px] text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stage, Level & Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:flex-wrap">
            <select
              value={selectedStage}
              onChange={(e) =>
                setSelectedStage(e.target.value as StageId | 'all')
              }
              aria-label="Lọc theo Giai đoạn"
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 shrink-0 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">Mọi Giai đoạn (1–7)</option>
              {CURRICULUM_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  GĐ {st.number}: {st.title.replace(/^Giai đoạn \d+:\s*/, '')}
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
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 shrink-0 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="unsolved">Chưa giải</option>
              <option value="solved">Đã vượt qua ✓</option>
            </select>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setFilterLevel('all')}
                className={cn(
                  'rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                  filterLevel === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                )}
              >
                Mọi cấp
              </button>
              {SKILL_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setFilterLevel(lvl.id)}
                  className={cn(
                    'rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                    filterLevel === lvl.id
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  )}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Exercise Switcher Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80 pb-1">
          {filteredExercises.length === 0 ? (
            <div className="py-2 text-xs text-slate-400">
              Không có bài tập nào khớp với bộ lọc hiện tại. Hãy bấm Reset bộ lọc để xem toàn bộ {ALL_EXERCISES.length} bài tập.
            </div>
          ) : (
            filteredExercises.map((ex, idx) => {
              const isSelected = ex.id === currentExercise.id;
              const isPassed = submissions[ex.id]?.passed;

              return (
                <button
                  key={ex.id}
                  onClick={() => selectExercise(ex.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left whitespace-nowrap transition-all shrink-0 cursor-pointer',
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  )}
                >
                  {isPassed ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isSelected ? 'text-emerald-400' : 'text-slate-600'
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-mono text-[11px] text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold max-w-[260px] truncate">
                    {ex.title}
                  </span>
                  <LevelBadge level={ex.level} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Exercise Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={currentExercise.level} showVi size="sm" />
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold',
              currentCatMeta.badgeColor
            )}
          >
            {currentCatMeta.icon}
            <span>{currentCatMeta.shortLabel}</span>
          </span>
          <h2 className="font-mono text-base sm:text-lg font-bold text-white">
            {currentExercise.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevExercise}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              title="Bài tập trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trước</span>
            </button>
            <span className="font-mono text-xs text-slate-400 px-1.5">
              {currentIndexInFiltered >= 0 ? currentIndexInFiltered + 1 : 1}/
              {filteredExercises.length || ALL_EXERCISES.length}
            </span>
            <button
              onClick={handleNextExercise}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              title="Bài tập tiếp theo"
            >
              <span>Tiếp</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() =>
              openNotesDrawer(
                'exercise',
                currentExercise.id,
                currentExercise.title
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MessageSquarePlus
              className="h-3.5 w-3.5 text-amber-400"
              aria-hidden="true"
            />
            <span>Ghi chú</span>
          </button>
        </div>
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
