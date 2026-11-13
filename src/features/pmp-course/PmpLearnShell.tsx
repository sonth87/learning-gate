import React, { useEffect } from 'react';
import { Home, Layers, ListChecks, Map as MapIcon } from 'lucide-react';
import { usePmpNav, usePmpProgress } from './store';
import type { PmpLearnView } from './types';
import { PmpHomeView } from './views/PmpHomeView';
import { PmpRoadmapView } from './views/PmpRoadmapView';
import { PmpModuleView } from './views/PmpModuleView';
import { PmpQuizView } from './views/PmpQuizView';
import { PmpFlashView } from './views/PmpFlashView';
import { Spinner } from '@/features/workpath/components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import { cn } from '@/utils/cn';

const SUB_TABS: {
  label: string;
  short: string;
  icon: React.ReactNode;
  go: PmpLearnView;
  match: PmpLearnView['name'][];
}[] = [
  { label: 'Tổng quan', short: 'Tổng quan', icon: <Home className="h-4 w-4" />, go: { name: 'home' }, match: ['home'] },
  { label: 'Lộ trình 16 bài', short: 'Lộ trình', icon: <MapIcon className="h-4 w-4" />, go: { name: 'roadmap' }, match: ['roadmap', 'module'] },
  { label: 'Quiz tình huống', short: 'Quiz', icon: <ListChecks className="h-4 w-4" />, go: { name: 'quiz', mode: 'mix' }, match: ['quiz'] },
  { label: 'Flashcard SRS', short: 'Flashcard', icon: <Layers className="h-4 w-4" />, go: { name: 'flash' }, match: ['flash'] },
];

const ViewSwitch: React.FC<{ view: PmpLearnView }> = ({ view }) => {
  switch (view.name) {
    case 'home':
      return <PmpHomeView />;
    case 'roadmap':
      return <PmpRoadmapView />;
    case 'module':
      return <PmpModuleView key={view.id} id={view.id} />;
    case 'quiz':
      return <PmpQuizView key={`${view.mode}-${view.moduleId ?? 'all'}`} mode={view.mode} moduleId={view.moduleId} />;
    case 'flash':
      return <PmpFlashView key={view.moduleId ?? 'all'} moduleId={view.moduleId} />;
  }
};

export const PmpLearnShell: React.FC = () => {
  const view = usePmpNav((x) => x.view);
  const go = usePmpNav((x) => x.go);
  const hydrated = usePmpProgress((x) => x.hydrated);
  const hydrate = usePmpProgress((x) => x.hydrate);
  const syncMeta = usePmpProgress((x) => x.syncMeta);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.getElementById('course-scroll-pmp')?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label="Các phần của đường học Tư duy PMP"
        className="shrink-0 border-b border-slate-800/80 bg-slate-950/80 px-2 sm:px-4"
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 py-1.5">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
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
                    active
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
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
      <div className="min-h-0 flex-1 overflow-y-auto" id="course-scroll-pmp">
        {hydrated ? <ViewSwitch view={view} /> : <Spinner label="Đang tải tiến độ Tư duy PMP…" />}
      </div>
    </div>
  );
};
