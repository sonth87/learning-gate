import React from 'react';
import {
  BookOpen,
  Workflow,
  Flame,
  Code2,
  FolderGit2,
  Layers,
  GraduationCap,
  BookMarked,
} from 'lucide-react';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { CicdMainTab } from '../../types/cicd.types';
import { cn } from '@/utils/cn';

const CICD_MOBILE_NAV: {
  id: CicdMainTab;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'curriculum', shortLabel: 'Lộ trình', icon: BookOpen },
  { id: 'simulator', shortLabel: 'Giả lập', icon: Workflow },
  { id: 'warroom', shortLabel: 'Sự cố', icon: Flame },
  { id: 'practice', shortLabel: 'Thực hành', icon: Code2 },
  { id: 'blueprints', shortLabel: 'Blueprints', icon: FolderGit2 },
  { id: 'flashcards', shortLabel: 'Thẻ nhớ', icon: Layers },
  { id: 'exams', shortLabel: 'Sát hạch', icon: GraduationCap },
  { id: 'glossary', shortLabel: 'Từ điển', icon: BookMarked },
];

export const CicdMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useCicdNavigationStore();

  return (
    <nav
      aria-label="Điều hướng CI/CD trên di động"
      className="lg:hidden shrink-0 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md px-1 pb-[env(safe-area-inset-bottom)] z-30"
    >
      <div className="grid grid-cols-8 items-center">
        {CICD_MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 min-h-[48px] rounded-lg transition-colors cursor-pointer',
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-cyan-400" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[9px] leading-tight truncate max-w-full">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
