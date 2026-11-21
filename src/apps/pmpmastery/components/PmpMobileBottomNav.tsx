import React from 'react';
import { BookOpen, GitBranch, GraduationCap, Layers, Scale } from 'lucide-react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { usePmpAppStore, usePmpNav } from '@/features/pmp-course/store';
import { cn } from '@/utils/cn';

export const PmpMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = usePmpAppStore();
  const pmpView = usePmpNav((s) => s.view);
  const goPmp = usePmpNav((s) => s.go);
  const lang = useWorkbenchStore((s) => s.language);

  const items = [
    {
      id: 'learn',
      label: lang === 'en' ? 'Learn' : 'Học',
      icon: BookOpen,
      active: activeTab === 'learn' && pmpView.name === 'workbench',
      onClick: () => {
        setActiveTab('learn');
        goPmp({ name: 'workbench' });
      },
    },
    {
      id: 'practice',
      label: lang === 'en' ? 'Quiz' : 'Quiz',
      icon: GraduationCap,
      active: activeTab === 'learn' && pmpView.name !== 'workbench',
      onClick: () => {
        setActiveTab('learn');
        if (pmpView.name === 'workbench') goPmp({ name: 'quiz', mode: 'mix' });
      },
    },
    {
      id: 'canvas',
      label: 'Canvas',
      icon: Layers,
      active: activeTab === 'canvas',
      onClick: () => setActiveTab('canvas'),
    },
    {
      id: 'decision',
      label: lang === 'en' ? 'Decisions' : 'Quyết định',
      icon: GitBranch,
      active: activeTab === 'decision',
      onClick: () => setActiveTab('decision'),
    },
    {
      id: 'lookup',
      label: lang === 'en' ? 'Lookup' : 'Tra cứu',
      icon: Scale,
      active: activeTab === 'lookup',
      onClick: () => setActiveTab('lookup'),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="shrink-0 z-40 border-t-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel)] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-1.5 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] transition-all cursor-pointer',
                item.active
                  ? 'dts-card-tactile bg-[var(--dts-green-bg)] font-extrabold text-[var(--dts-green-ink)]'
                  : 'text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)] font-semibold'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
