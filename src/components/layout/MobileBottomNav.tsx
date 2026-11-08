import React from 'react';
import {
  BookOpen,
  Code2,
  Layers,
  GraduationCap,
  BookMarked,
  Compass,
} from 'lucide-react';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { cn } from '@/utils/cn';

const MOBILE_NAV_ITEMS: {
  id: MainTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'curriculum',
    label: 'Lộ trình',
    icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'practice',
    label: 'Thực hành',
    icon: <Code2 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <Layers className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'exams',
    label: 'Sát hạch',
    icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển',
    icon: <BookMarked className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'reference',
    label: 'Chuyên đề',
    icon: <Compass className="h-4 w-4" aria-hidden="true" />,
  },
];

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigationStore();

  return (
    <nav
      aria-label="Điều hướng di động"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-6 px-1 py-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
                active
                  ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {item.icon}
              <span className="text-[10px] leading-none tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
