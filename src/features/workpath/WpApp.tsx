import React, { useEffect } from 'react';
import { BookOpen, Code2, Home, Layers, ListChecks, Map as MapIcon } from 'lucide-react';
import { useWpNav, useWpProgress } from './store';
import type { WpView } from './types';
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
import { Spinner } from './components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import { cn } from '@/utils/cn';

const TABS: { label: string; short: string; icon: React.ReactNode; go: WpView; match: WpView['name'][] }[] = [
  { label: 'Tổng quan', short: 'Tổng quan', icon: <Home className="h-4 w-4" />, go: { name: 'home' }, match: ['home'] },
  { label: 'Lộ trình', short: 'Lộ trình', icon: <MapIcon className="h-4 w-4" />, go: { name: 'roadmap' }, match: ['roadmap', 'module'] },
  { label: 'Bài tập', short: 'Bài tập', icon: <Code2 className="h-4 w-4" />, go: { name: 'exercises' }, match: ['exercises', 'exercise'] },
  { label: 'Quiz', short: 'Quiz', icon: <ListChecks className="h-4 w-4" />, go: { name: 'quiz', mode: 'mix' }, match: ['quiz'] },
  { label: 'Flashcard & luyện gõ', short: 'Ôn tập', icon: <Layers className="h-4 w-4" />, go: { name: 'flash' }, match: ['flash', 'drill'] },
  { label: 'Đọc code thật', short: 'Code thật', icon: <BookOpen className="h-4 w-4" />, go: { name: 'browse', preset: 'forme' }, match: ['browse', 'read'] },
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

/**
 * Tab "Học": đường học chính (nội dung và cách chấm bài từ WorkPath).
 * Một luồng duy nhất: Lộ trình → Module (lesson → quiz → bài tập) → Đọc code thật → Ôn tập.
 */
export const WpApp: React.FC = () => {
  const view = useWpNav((x) => x.view);
  const go = useWpNav((x) => x.go);
  const hydrated = useWpProgress((x) => x.hydrated);
  const hydrate = useWpProgress((x) => x.hydrate);
  const syncMeta = useWpProgress((x) => x.syncMeta);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.getElementById('wp-scroll')?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Các phần của đường học" className="shrink-0 border-b border-slate-800/80 bg-slate-950/80 px-2 sm:px-4">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 py-1.5">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.match.includes(view.name);
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => go(t.go)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
                    active ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
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
      <div className="min-h-0 flex-1 overflow-y-auto" id="wp-scroll">
        {hydrated ? <ViewSwitch view={view} /> : <Spinner label="Đang tải tiến độ…" />}
      </div>
    </div>
  );
};

export default WpApp;
