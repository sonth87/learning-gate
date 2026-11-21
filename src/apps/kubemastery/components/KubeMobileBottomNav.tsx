import React from 'react';
import { BookMarked, BookOpen, GraduationCap, Server, ShieldAlert } from 'lucide-react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useKubeNav } from '@/features/devops-course/store';
import { useKubeStore } from '../store/useKubeStore';
import { cn } from '@/utils/cn';

export const KubeMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useKubeStore();
  const kubeView = useKubeNav((s) => s.view);
  const goKube = useKubeNav((s) => s.go);
  const lang = useWorkbenchStore((s) => s.language);

  const items = [
    {
      id: 'learn',
      label: lang === 'en' ? 'Learn' : 'Học',
      icon: BookOpen,
      active: activeTab === 'learn' && kubeView.name === 'workbench',
      onClick: () => {
        setActiveTab('learn');
        goKube({ name: 'workbench' });
      },
    },
    {
      id: 'practice',
      label: lang === 'en' ? 'Practice' : 'Thực hành',
      icon: GraduationCap,
      active: activeTab === 'learn' && kubeView.name !== 'workbench',
      onClick: () => {
        setActiveTab('learn');
        if (kubeView.name === 'workbench') goKube({ name: 'exercises' });
      },
    },
    {
      id: 'cluster-sim',
      label: lang === 'en' ? 'Cluster' : 'Cụm K8s',
      icon: Server,
      active: activeTab === 'cluster-sim',
      onClick: () => setActiveTab('cluster-sim'),
    },
    {
      id: 'incidents',
      label: lang === 'en' ? 'War-Room' : 'Sự cố',
      icon: ShieldAlert,
      active: activeTab === 'incidents',
      onClick: () => setActiveTab('incidents'),
    },
    {
      id: 'glossary',
      label: lang === 'en' ? 'Commands' : 'Từ điển',
      icon: BookMarked,
      active: activeTab === 'glossary',
      onClick: () => setActiveTab('glossary'),
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
