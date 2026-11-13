import React from 'react';
import { GitBranch, GraduationCap, Layers, Scale } from 'lucide-react';
import { usePmpAppStore } from '@/features/pmp-course/store';
import type { PmpTab } from '@/features/pmp-course/types';
import { cn } from '@/utils/cn';

const MOBILE_ITEMS: {
  id: PmpTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'learn', label: 'Học tư duy', shortLabel: 'Học', icon: GraduationCap },
  { id: 'canvas', label: 'Mindset Canvas', shortLabel: 'Canvas', icon: Layers },
  { id: 'decision', label: 'Cây quyết định', shortLabel: 'Quyết định', icon: GitBranch },
  { id: 'lookup', label: 'Đối chiếu & Link', shortLabel: 'Tra cứu', icon: Scale },
];

export const PmpMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = usePmpAppStore();

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-0.5 px-1 py-1">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 transition-all active:scale-95 cursor-pointer',
                active
                  ? 'text-amber-400 bg-amber-500/15 border border-amber-500/35 font-extrabold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent font-medium'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[10px] leading-tight tracking-tight whitespace-nowrap truncate max-w-full sm:hidden">
                {item.shortLabel}
              </span>
              <span className="hidden sm:inline text-[10px] leading-tight tracking-tight whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
