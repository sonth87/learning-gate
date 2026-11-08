import React from 'react';
import {
  BookOpen,
  Workflow,
  Server,
  GitBranch,
  ShieldAlert,
  Code2,
  BookMarked,
  GraduationCap,
} from 'lucide-react';
import { useKubeStore } from '../store/useKubeStore';
import { KubeTab } from '../types/kube.types';
import { cn } from '@/utils/cn';

const MOBILE_NAV_ITEMS: {
  id: KubeTab;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'curriculum', shortLabel: 'Giáo trình', icon: BookOpen },
  { id: 'flow-studio', shortLabel: 'Sơ đồ', icon: Workflow },
  { id: 'cluster-sim', shortLabel: 'Cụm K8s', icon: Server },
  { id: 'cicd-sim', shortLabel: 'CI/CD', icon: GitBranch },
  { id: 'incidents', shortLabel: 'Cứu hộ', icon: ShieldAlert },
  { id: 'practice', shortLabel: 'Thực hành', icon: Code2 },
  { id: 'glossary', shortLabel: 'Từ điển', icon: BookMarked },
  { id: 'exams', shortLabel: 'Sát hạch', icon: GraduationCap },
];

export const KubeMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useKubeStore();

  return (
    <nav
      aria-label="Điều hướng chính trên di động"
      className="lg:hidden shrink-0 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-md px-1 pb-[env(safe-area-inset-bottom)] z-30"
    >
      <div className="grid grid-cols-8 items-center">
        {MOBILE_NAV_ITEMS.map((item) => {
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
                  ? 'text-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-sky-400" />
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
