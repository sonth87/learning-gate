import React from 'react';
import { BookMarked, Cpu, GraduationCap, ShieldAlert, Workflow } from 'lucide-react';
import { useRedisStore } from '../store/useRedisStore';
import type { RedisMainTab } from '../types/redis.types';
import { cn } from '@/utils/cn';

const MOBILE_ITEMS: {
  id: RedisMainTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'learn', label: 'Học', shortLabel: 'Học', icon: GraduationCap },
  { id: 'simulator', label: 'Mô phỏng RAM', shortLabel: 'Mô phỏng', icon: Cpu },
  { id: 'flow-studio', label: 'Sơ đồ Động', shortLabel: 'Sơ đồ', icon: Workflow },
  { id: 'incidents', label: 'War-Room', shortLabel: 'Sự cố', icon: ShieldAlert },
  { id: 'glossary', label: 'Từ điển Big-O', shortLabel: 'Từ điển', icon: BookMarked },
];

export const RedisMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useRedisStore();

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-0.5 px-1 py-1">
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
                'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 cursor-pointer',
                active
                  ? 'text-rose-400 bg-rose-500/15 border border-rose-500/35 font-extrabold shadow-2xs'
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
