import React from 'react';
import { BookMarked, BookOpen, Cpu, GraduationCap, ShieldAlert } from 'lucide-react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useRedisNav } from '@/features/devops-course/store';
import { useRedisStore } from '../store/useRedisStore';
import { cn } from '@/utils/cn';

export const RedisMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useRedisStore();
  const redisView = useRedisNav((s) => s.view);
  const goRedis = useRedisNav((s) => s.go);
  const lang = useWorkbenchStore((s) => s.language);

  const items = [
    {
      id: 'learn',
      label: lang === 'en' ? 'Learn' : 'Học',
      icon: BookOpen,
      active: activeTab === 'learn' && redisView.name === 'workbench',
      onClick: () => {
        setActiveTab('learn');
        goRedis({ name: 'workbench' });
      },
    },
    {
      id: 'practice',
      label: lang === 'en' ? 'Practice' : 'Thực hành',
      icon: GraduationCap,
      active: activeTab === 'learn' && redisView.name !== 'workbench',
      onClick: () => {
        setActiveTab('learn');
        if (redisView.name === 'workbench') goRedis({ name: 'exercises' });
      },
    },
    {
      id: 'simulator',
      label: lang === 'en' ? 'RAM Sim' : 'Mô phỏng',
      icon: Cpu,
      active: activeTab === 'simulator',
      onClick: () => setActiveTab('simulator'),
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
      label: lang === 'en' ? 'Big-O' : 'Từ điển',
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
