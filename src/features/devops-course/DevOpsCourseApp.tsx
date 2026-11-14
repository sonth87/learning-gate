import React, { useEffect, useMemo } from 'react';
import { BookOpen, Code2, Home, Layers, ListChecks, Map as MapIcon } from 'lucide-react';
import { COURSE_META, CourseProvider } from './context';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from './store';
import type { DevOpsCourseId, RelatedToolLink, WpView } from './types';
import { HomeView } from './views/HomeView';
import { RoadmapView } from './views/RoadmapView';
import { ModuleView } from './views/ModuleView';
import { ExerciseListView } from './views/ExerciseListView';
import { ExerciseView } from './views/ExerciseView';
import { QuizView } from './views/QuizView';
import { FlashView } from './views/FlashView';
import { DrillView } from './views/DrillView';
import { BrowseView } from './views/BrowseView';
import { ReadView } from './views/ReadView';
import { Spinner } from '@/features/workpath/components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import { cn } from '@/utils/cn';

const SUB_TABS: { label: string; short: string; icon: React.ReactNode; go: WpView; match: WpView['name'][] }[] = [
  { label: 'Tổng quan', short: 'Tổng quan', icon: <Home className="h-4 w-4" />, go: { name: 'home' }, match: ['home'] },
  { label: 'Lộ trình', short: 'Lộ trình', icon: <MapIcon className="h-4 w-4" />, go: { name: 'roadmap' }, match: ['roadmap', 'module'] },
  { label: 'Bài thực hành', short: 'Thực hành', icon: <Code2 className="h-4 w-4" />, go: { name: 'exercises' }, match: ['exercises', 'exercise'] },
  { label: 'Quiz', short: 'Quiz', icon: <ListChecks className="h-4 w-4" />, go: { name: 'quiz', mode: 'mix' }, match: ['quiz'] },
  { label: 'Flashcard & luyện gõ', short: 'Ôn tập', icon: <Layers className="h-4 w-4" />, go: { name: 'flash' }, match: ['flash', 'drill'] },
  { label: 'Đọc cấu hình thật', short: 'Cấu hình thật', icon: <BookOpen className="h-4 w-4" />, go: { name: 'browse', preset: 'all' }, match: ['browse', 'read'] },
];

const ViewSwitch: React.FC<{ view: WpView }> = ({ view }) => {
  switch (view.name) {
    case 'home':
      return <HomeView />;
    case 'roadmap':
      return <RoadmapView />;
    case 'module':
      return <ModuleView key={view.id} id={view.id} />;
    case 'exercises':
      return <ExerciseListView moduleId={view.moduleId} status={view.status} />;
    case 'exercise':
      return <ExerciseView key={view.code} code={view.code} />;
    case 'quiz':
      return <QuizView key={`${view.mode}-${view.moduleId ?? ''}`} mode={view.mode} moduleId={view.moduleId} />;
    case 'flash':
      return <FlashView key={view.moduleId ?? 'all'} moduleId={view.moduleId} />;
    case 'drill':
      return <DrillView key={view.moduleId} moduleId={view.moduleId} />;
    case 'browse':
      return <BrowseView preset={view.preset} />;
    case 'read':
      return <ReadView key={view.n} n={view.n} />;
  }
};

export interface DevOpsCourseAppProps {
  courseId: DevOpsCourseId;
  onOpenRelatedTool?: (link: RelatedToolLink) => void;
}

export const DevOpsCourseApp: React.FC<DevOpsCourseAppProps> = ({ courseId, onOpenRelatedTool }) => {
  const navStore = COURSE_NAV_STORES[courseId];
  const progressStore = COURSE_PROGRESS_STORES[courseId];
  const view = navStore((x) => x.view);
  const go = navStore((x) => x.go);
  const hydrated = progressStore((x) => x.hydrated);
  const hydrate = progressStore((x) => x.hydrate);
  const syncMeta = progressStore((x) => x.syncMeta);

  const meta = useMemo(
    () => ({
      ...COURSE_META[courseId],
      onOpenRelatedTool,
    }),
    [courseId, onOpenRelatedTool]
  );

  const scrollId = `course-scroll-${courseId}`;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.getElementById(scrollId)?.scrollTo({ top: 0 });
  }, [view, scrollId]);

  const activePill =
    meta.accent === 'cyan'
      ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
      : meta.accent === 'rose'
        ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
        : 'border-sky-500/50 bg-sky-500/15 text-sky-300';

  return (
    <CourseProvider value={meta}>
      <div className="flex h-full min-h-0 flex-col">
        <nav
          aria-label="Các phần của đường học"
          className="shrink-0 border-b border-slate-800/80 bg-slate-950/80 px-2 sm:px-4"
        >
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 py-1.5">
            <div className="flex gap-1 overflow-x-auto">
              {SUB_TABS.map((t) => {
                const active = t.match.includes(view.name);
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => go(t.go)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-[44px] sm:min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                      active ? activePill : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    )}
                  >
                    {t.icon}
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.short}</span>
                  </button>
                );
              })}
            </div>
            <ProgressSyncBadge meta={syncMeta} />
          </div>
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto" id={scrollId}>
          {hydrated ? <ViewSwitch view={view} /> : <Spinner label="Đang tải tiến độ…" />}
        </div>
      </div>
    </CourseProvider>
  );
};

export default DevOpsCourseApp;
