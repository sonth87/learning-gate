import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Award,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { CURRICULUM_STAGES, STAGE_MAP } from '@/constants/stages';
import { SKILL_LEVELS } from '@/constants/levels';
import { getLessonsByLevel, getLessonsByStage } from '@/data/curriculum';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const Sidebar: React.FC = () => {
  const {
    selectedLessonId,
    selectLesson,
    setSetupGuideOpen,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useNavigationStore();
  const { organizationMode, setOrganizationMode } = useSettingsStore();
  const { completedLessonIds } = useUserDataStore();

  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const matchesQuery = (title: string, desc: string) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.trim().toLowerCase();
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  };

  const renderSidebarContent = () => (
    <>
      {/* Top Sticky Controls: Grouping Mode + Quick Filter */}
      <div className="p-3.5 border-b border-slate-800/80 space-y-2.5 bg-slate-950/90 backdrop-blur-md">
        {/* Grouping Mode Segmented Switcher */}
        <div
          role="group"
          aria-label="Chế độ phân nhóm lộ trình"
          className="grid grid-cols-2 rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs"
        >
          <button
            onClick={() => setOrganizationMode('by-stage')}
            aria-pressed={organizationMode === 'by-stage'}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all',
              organizationMode === 'by-stage'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <FolderKanban className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>7 Giai đoạn</span>
          </button>
          <button
            onClick={() => setOrganizationMode('by-level')}
            aria-pressed={organizationMode === 'by-level'}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all',
              organizationMode === 'by-level'
                ? 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Award className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>5 Cấp độ</span>
          </button>
        </div>

        {/* Quick Filter Input */}
        <div className="relative">
          <Search
            className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Lọc nhanh bài học..."
            aria-label="Lọc nhanh bài học"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-7 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none transition-colors"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              aria-label="Xóa bộ lọc"
              className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Curriculum Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Quick Beginner Setup Card */}
        <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-slate-900/90 to-slate-900 p-3 space-y-2 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Wrench className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Cẩm nang Quản lý Dự án (2 Cách)
                </div>
                <div className="text-xs font-bold text-white truncate">
                  Cách 1 (uv) & Cách 2 (pyenv/pip/Poetry)
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Hướng dẫn quản lý Version, Source Code & Dependency bằng{' '}
            <code className="text-emerald-300 font-mono">uv</code> hoặc bằng{' '}
            <code className="text-sky-300 font-mono">pyenv + venv + pip / Poetry / Pipenv</code>:
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => selectLesson('s0-install-setup-uv-pyenv-ide')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer',
                selectedLessonId === 's0-install-setup-uv-pyenv-ide'
                  ? 'border-emerald-500/60 bg-emerald-500/25 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-emerald-500/40'
              )}
            >
              <BookOpen className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>1.0A: Dùng uv</span>
            </button>
            <button
              type="button"
              onClick={() =>
                selectLesson('s0-workflow-pyenv-venv-poetry-pipenv')
              }
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors cursor-pointer',
                selectedLessonId === 's0-workflow-pyenv-venv-poetry-pipenv'
                  ? 'border-sky-500/60 bg-sky-500/25 text-sky-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-sky-500/40'
              )}
            >
              <BookOpen className="h-3 w-3 text-sky-400 shrink-0" />
              <span>1.0B: pyenv/Poetry</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSetupGuideOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            <Wrench className="h-3 w-3 shrink-0" />
            <span>Mở Cẩm nang Tương tác (Đủ 2 Phương pháp)</span>
          </button>
        </div>

        {/* View 1: Grouped by 7 Stages */}
        {organizationMode === 'by-stage' &&
          CURRICULUM_STAGES.map((stage) => {
            const allStageLessons = getLessonsByStage(stage.id);
            const lessons = allStageLessons.filter((l) =>
              matchesQuery(l.title, l.shortDescription)
            );
            if (lessons.length === 0) return null;

            const completedInStage = allStageLessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;
            const hasSelected = allStageLessons.some(
              (l) => l.id === selectedLessonId
            );
            const isCollapsed =
              !filterQuery && collapsedGroups[stage.id] && !hasSelected;

            return (
              <div
                key={stage.id}
                className="rounded-xl border border-slate-800/70 bg-slate-900/30 overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(stage.id)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex flex-col gap-1 px-3 py-2.5 text-left hover:bg-slate-900/70 transition-colors"
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 whitespace-nowrap">
                        Giai đoạn {stage.number}
                      </span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        • {stage.durationWeeks}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {completedInStage}/{allStageLessons.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                  </div>

                  <h3 className="w-full text-xs font-semibold text-slate-200 truncate">
                    {stage.title.replace(/^Giai đoạn \d+:\s*/, '')}
                  </h3>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-slate-800/60 p-1.5 space-y-0.5">
                    {lessons.map((lesson) => {
                      const isSelected = selectedLessonId === lesson.id;
                      const isCompleted = completedLessonIds.includes(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson.id)}
                          className={cn(
                            'w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-all border-l-2',
                            isSelected
                              ? 'border-l-emerald-400 bg-slate-800/90 text-white shadow-xs'
                              : 'border-l-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white'
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-emerald-400"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle
                                className={cn(
                                  'h-3.5 w-3.5',
                                  isSelected ? 'text-emerald-400' : 'text-slate-600'
                                )}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={cn(
                                'text-xs leading-snug line-clamp-2',
                                isSelected ? 'font-semibold text-white' : 'font-medium'
                              )}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <LevelBadge level={lesson.level} />
                              <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-500">
                                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                                {lesson.estimatedMinutes}p
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        {/* View 2: Grouped by 5 Levels */}
        {organizationMode === 'by-level' &&
          SKILL_LEVELS.map((lvl) => {
            const allLevelLessons = getLessonsByLevel(lvl.id);
            const lessons = allLevelLessons.filter((l) =>
              matchesQuery(l.title, l.shortDescription)
            );
            if (lessons.length === 0) return null;

            const completedInLevel = allLevelLessons.filter((l) =>
              completedLessonIds.includes(l.id)
            ).length;
            const hasSelected = allLevelLessons.some(
              (l) => l.id === selectedLessonId
            );
            const isCollapsed =
              !filterQuery && collapsedGroups[lvl.id] && !hasSelected;

            return (
              <div
                key={lvl.id}
                className="rounded-xl border border-slate-800/70 bg-slate-900/30 overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(lvl.id)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex flex-col gap-1.5 px-3 py-2.5 text-left hover:bg-slate-900/70 transition-colors"
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <LevelBadge level={lvl.id} />
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {lvl.viLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {completedInLevel}/{allLevelLessons.length}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                  </div>

                  <p className="w-full text-[11px] text-slate-400 truncate">
                    {lvl.tagline}
                  </p>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-slate-800/60 p-1.5 space-y-0.5">
                    {lessons.map((lesson) => {
                      const isSelected = selectedLessonId === lesson.id;
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      const stageInfo = STAGE_MAP[lesson.stageId];

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson.id)}
                          className={cn(
                            'w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-all border-l-2',
                            isSelected
                              ? 'border-l-emerald-400 bg-slate-800/90 text-white shadow-xs'
                              : 'border-l-transparent text-slate-300 hover:bg-slate-900/80 hover:text-white'
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-emerald-400"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle
                                className={cn(
                                  'h-3.5 w-3.5',
                                  isSelected ? 'text-emerald-400' : 'text-slate-600'
                                )}
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p
                              className={cn(
                                'text-xs leading-snug line-clamp-2',
                                isSelected ? 'font-semibold text-white' : 'font-medium'
                              )}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                              <span>GĐ {stageInfo.number}</span>
                              <span>{lesson.estimatedMinutes}p</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (lg+) */}
      <aside
        aria-label="Danh mục bài học"
        className="hidden lg:flex lg:w-72 xl:w-80 shrink-0 border-r border-slate-800/80 bg-slate-950/60 h-full flex-col overflow-hidden"
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer (< lg) */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-50 flex lg:hidden bg-black/75 backdrop-blur-xs"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            aria-label="Danh mục bài học di động"
            className="flex h-full w-[min(86vw,340px)] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <span className="font-mono text-xs font-bold text-white">
                  Lộ trình 7 Giai đoạn Python
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Đóng danh mục"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
};
