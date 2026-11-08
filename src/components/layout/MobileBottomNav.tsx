import React from 'react';
import {
  BookOpen,
  Code2,
  FolderGit2,
  Layers,
  GraduationCap,
  BookMarked,
  Compass,
  Terminal,
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
    id: 'playground',
    label: 'Playground',
    icon: <Terminal className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'practice',
    label: 'Thực hành',
    icon: <Code2 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'samples',
    label: 'Dự án Mẫu',
    icon: <FolderGit2 className="h-4 w-4" aria-hidden="true" />,
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
      aria-label="Điều hướng di động và máy tính bảng"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex items-center overflow-x-auto no-scrollbar sm:grid sm:max-w-3xl sm:grid-cols-8 gap-0.5 px-1.5 py-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[48px] min-w-[66px] sm:min-w-0 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 transition-all active:scale-95 cursor-pointer',
                active
                  ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 font-bold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              )}
            >
              {item.icon}
              <span className="text-[10px] leading-none tracking-tight whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
