import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Search,
  ChevronDown,
  ChevronRight,
  Workflow,
  X,
} from 'lucide-react';
import { ALL_CICD_LESSONS } from '../../data/cicdCurriculumIndex';
import { CICD_STAGES } from '../../data/cicdStages';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

export const CicdSidebar: React.FC = () => {
  const {
    selectedLessonId,
    selectLesson,
    filterLevel,
    setFilterLevel,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useCicdNavigationStore();
  const completedLessonIds = useUserDataStore((s) => s.completedLessonIds);

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedStages, setCollapsedStages] = useState<
    Record<string, boolean>
  >({});

  const toggleStage = (stageId: string) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const filteredLessons = useMemo(() => {
    return ALL_CICD_LESSONS.filter((lesson) => {
      if (filterLevel !== 'all' && lesson.level !== filterLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          lesson.title.toLowerCase().includes(q) ||
          lesson.shortTitle.toLowerCase().includes(q) ||
          lesson.summary.toLowerCase().includes(q) ||
          lesson.pdfRef.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterLevel, searchQuery]);

  const completedCicdCount = useMemo(
    () =>
      ALL_CICD_LESSONS.filter((l) => completedLessonIds.includes(l.id)).length,
    [completedLessonIds]
  );

  const renderSidebarBody = (isMobileDrawer = false) => (
    <div className="flex h-full w-full flex-col bg-slate-950 select-none overflow-hidden">
      {/* Progress & Filter Header */}
      <div className="border-b border-slate-800/80 p-3 sm:p-3.5 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Workflow className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
              Lộ trình CI/CD (21 Trang PDF)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
              {completedCicdCount}/{ALL_CICD_LESSONS.length} Bài
            </span>
            {isMobileDrawer && (
              <button
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Đóng mục lục"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm DAG, OIDC, ArgoCD, Trivy, 502..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
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

        {/* Level Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'fundamental', label: 'Fundamental' },
              { id: 'basic', label: 'Basic' },
              { id: 'advanced', label: 'Intermediate' },
              { id: 'pro', label: 'Advanced' },
              { id: 'master', label: 'Thực chiến' },
            ] as const
          ).map((lv) => (
            <button
              key={lv.id}
              onClick={() => setFilterLevel(lv.id)}
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all whitespace-nowrap shrink-0',
                filterLevel === lv.id
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              )}
            >
              {lv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage & Lesson Tree */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {CICD_STAGES.map((stage) => {
          const stageLessons = filteredLessons.filter(
            (l) => l.stageId === stage.id
          );
          if (stageLessons.length === 0) return null;
          const isCollapsed = !!collapsedStages[stage.id];

          return (
            <div
              key={stage.id}
              className="rounded-xl border border-slate-800/90 bg-slate-900/40 overflow-hidden"
            >
              <button
                onClick={() => toggleStage(stage.id)}
                className="flex w-full items-start justify-between gap-2 bg-slate-900/80 px-3 py-2.5 text-left hover:bg-slate-900 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                      PHẦN {stage.number}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 truncate">
                      {stage.pdfPartLabel}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 leading-snug">
                    {stage.title}
                  </div>
                </div>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 mt-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 mt-1" />
                )}
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-800/50 p-1.5 space-y-1">
                  {stageLessons.map((lesson) => {
                    const isSelected = lesson.id === selectedLessonId;
                    const isDone = completedLessonIds.includes(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => selectLesson(lesson.id)}
                        className={cn(
                          'w-full flex items-start gap-2.5 rounded-lg p-2 text-left transition-all',
                          isSelected
                            ? 'bg-cyan-500/15 border border-cyan-500/40 text-white shadow-xs'
                            : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle
                              className={cn(
                                'h-4 w-4',
                                isSelected ? 'text-cyan-400' : 'text-slate-600'
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-xs font-semibold leading-snug">
                            {lesson.shortTitle}
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <LevelBadge level={lesson.level} size="xs" />
                            <span className="font-mono text-[10px] text-slate-400 truncate">
                              {lesson.pdfRef.split('—')[0]}
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
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (lg+) */}
      <aside
        aria-label="Danh mục bài học CI/CD"
        className="hidden lg:flex lg:w-76 xl:w-80 shrink-0 border-r border-slate-800 bg-slate-950 h-full flex-col overflow-hidden"
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer (< lg) */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute inset-0 z-50 flex lg:hidden bg-black/75 backdrop-blur-xs"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            aria-label="Danh mục bài học CI/CD trên di động"
            className="flex h-full w-[min(88vw,340px)] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl"
          >
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
};
