import React, { useState } from 'react';
import {
  BookOpen,
  Workflow,
  Server,
  ShieldAlert,
  Code2,
  BookMarked,
  GraduationCap,
  MoreHorizontal,
} from 'lucide-react';
import { useKubeStore } from '../store/useKubeStore';
import { KubeTab } from '../types/kube.types';
import { cn } from '@/utils/cn';

const PRIMARY_ITEMS: {
  id: KubeTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'learn', label: 'Học', shortLabel: 'Học', icon: GraduationCap },
  { id: 'cluster-sim', label: 'Mô phỏng Cụm', shortLabel: 'Cụm K8s', icon: Server },
  { id: 'glossary', label: 'Từ điển & Lệnh', shortLabel: 'Từ điển', icon: BookMarked },
];

const MORE_ITEMS: {
  id: KubeTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'flow-studio', label: 'Sơ đồ Động & Luồng', icon: Workflow },
  { id: 'incidents', label: 'War-Room: 8 Sự cố', icon: ShieldAlert },
  { id: 'curriculum', label: 'Giáo trình cũ', icon: BookOpen },
  { id: 'practice', label: 'Lab YAML cũ', icon: Code2 },
  { id: 'exams', label: 'Sát hạch cũ', icon: GraduationCap },
];

export const KubeMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useKubeStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((i) => i.id === activeTab);

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-0.5 px-1 py-1">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMoreOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 cursor-pointer',
                active
                  ? 'text-sky-400 bg-sky-500/15 border border-sky-500/35 font-extrabold shadow-2xs'
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
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          title="Tra cứu & Công cụ bổ sung"
          className={cn(
            'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 cursor-pointer',
            moreActive || moreOpen
              ? 'text-sky-400 bg-sky-500/15 border border-sky-500/35 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 border border-transparent font-medium'
          )}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-[10px] leading-tight">Thêm</span>
        </button>
      </div>
      {moreOpen && (
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-1 border-t border-slate-800/90 px-2 py-2">
          {MORE_ITEMS.map((i) => {
            const Icon = i.icon;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => {
                  setActiveTab(i.id);
                  setMoreOpen(false);
                }}
                className={cn(
                  'flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-left text-xs cursor-pointer',
                  activeTab === i.id ? 'bg-slate-800 text-sky-400' : 'text-slate-300 hover:bg-slate-800/70'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {i.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};
