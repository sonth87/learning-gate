import React from 'react';
import {
  Container,
  BookOpen,
  Workflow,
  Server,
  GitBranch,
  ShieldAlert,
  Code2,
  BookMarked,
  GraduationCap,
  Search,
  Sun,
  Moon,
  Monitor,
  Boxes,
  Terminal,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { KubeMasteryLogo } from '@/components/common/AppLogos';
import { useKubeStore } from '../store/useKubeStore';
import { KubeTab } from '../types/kube.types';
import { KUBE_LESSONS } from '../data/curriculumData';
import { INCIDENT_SCENARIOS } from '../data/incidentsData';
import { cn } from '@/utils/cn';

const NAV_TABS: {
  id: KubeTab;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}[] = [
  {
    id: 'curriculum',
    label: 'Giáo trình 4 Giai đoạn',
    shortLabel: 'Giáo trình',
    icon: BookOpen,
  },
  {
    id: 'flow-studio',
    label: 'Sơ đồ Động & Luồng',
    shortLabel: 'Sơ đồ Động',
    icon: Workflow,
    badge: 'LIVE',
  },
  {
    id: 'cluster-sim',
    label: 'Mô phỏng Cụm K8s',
    shortLabel: 'Cụm K8s',
    icon: Server,
    badge: 'SIM',
  },
  {
    id: 'cicd-sim',
    label: 'Giả lập CI/CD & GitOps',
    shortLabel: 'CI/CD Lab',
    icon: GitBranch,
  },
  {
    id: 'incidents',
    label: 'Cứu hộ 8 Sự cố',
    shortLabel: '8 Sự cố',
    icon: ShieldAlert,
    badge: '8 CA',
  },
  {
    id: 'practice',
    label: 'Thực hành Viết YAML',
    shortLabel: 'Thực hành',
    icon: Code2,
  },
  {
    id: 'glossary',
    label: 'Từ điển & Bảng lệnh',
    shortLabel: 'Từ điển',
    icon: BookMarked,
  },
  {
    id: 'exams',
    label: 'Flashcard & Sát hạch',
    shortLabel: 'Sát hạch',
    icon: GraduationCap,
  },
];

export const KubeHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    completedLessonIds,
    solvedIncidentIds,
    isSearchOpen,
    setSearchOpen,
  } = useKubeStore();

  const colorScheme = useStore((s) => s.colorScheme);
  const resolvedScheme = useStore((s) => s.resolvedColorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);

  const cycleMobileTheme = () => {
    const next = resolvedScheme === 'light' ? 'dark' : 'light';
    setColorScheme(next);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-11 sm:h-12 shrink-0 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4">
          {/* Brand Logo + Progress */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <button
              onClick={() => setActiveTab('curriculum')}
              className="flex items-center gap-2 text-left group cursor-pointer"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                <KubeMasteryLogo size={32} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                    KubeMastery
                  </span>
                  <span className="hidden md:inline-block rounded-full border border-sky-500/35 bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-300">
                    DOCKER & K8S
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
                  <span>
                    {completedLessonIds.length}/{KUBE_LESSONS.length} bài
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">
                    {solvedIncidentIds.length}/{INCIDENT_SCENARIOS.length} sự cố
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Center Navigation Pills (lg+) */}
          <nav
            aria-label="Điều hướng học phần"
            className="hidden lg:flex items-center gap-0.5 rounded-xl border border-slate-800/90 bg-slate-900/70 p-0.5 overflow-x-auto no-scrollbar"
          >
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 xl:px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden 2xl:inline">{tab.label}</span>
                  <span className="2xl:hidden">{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'hidden xl:inline-block rounded px-1 py-0.2 font-mono text-[9px] font-bold',
                        isActive
                          ? 'bg-sky-400 text-slate-950'
                          : 'bg-slate-800 text-sky-400'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Switch to CI/CD Mastery */}
            <button
              onClick={() => switchLearningApp('cicdmastery')}
              title="Mở ứng dụng CI/CD & DevOps Mastery"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-amber-500/35 bg-amber-500/10 sm:px-2 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">CI/CD</span>
            </button>

            {/* Switch to Python Mastery */}
            <button
              onClick={() => switchLearningApp('pymastery')}
              title="Mở ứng dụng Python Mastery"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 sm:px-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Python</span>
            </button>

            {/* Quick Search Modal Button */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm nhanh bài học và sự cố"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 sm:px-2.5 text-xs text-slate-300 hover:border-sky-500/40 hover:text-white transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span className="hidden xl:inline text-[11px]">Tìm nhanh...</span>
            </button>

            {/* Mobile Single-Tap Theme Toggle (< sm) */}
            <button
              onClick={cycleMobileTheme}
              aria-label={
                resolvedScheme === 'light'
                  ? 'Chuyển sang giao diện Tối'
                  : 'Chuyển sang giao diện Sáng'
              }
              title={
                resolvedScheme === 'light'
                  ? 'Đang ở chế độ Sáng (Bấm để chuyển sang Tối)'
                  : 'Đang ở chế độ Tối (Bấm để chuyển sang Sáng)'
              }
              className="sm:hidden inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {resolvedScheme === 'light' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-sky-400" />
              )}
            </button>

            {/* Desktop/Tablet 3-Button Theme Switcher (sm+) */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
              <button
                onClick={() => setColorScheme('light')}
                title="Giao diện Sáng"
                aria-label="Giao diện Sáng"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'light'
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setColorScheme('dark')}
                title="Giao diện Tối"
                aria-label="Giao diện Tối"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'dark'
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setColorScheme('auto')}
                title="Theo hệ thống"
                aria-label="Theo hệ thống"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'auto'
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <KubeQuickSearchModal onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
};

const KubeQuickSearchModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [query, setQuery] = React.useState('');
  const { selectLesson, openIncidentInWarRoom } = useKubeStore();

  const q = query.trim().toLowerCase();
  const matchedLessons = KUBE_LESSONS.filter(
    (l) =>
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.shortDescription.toLowerCase().includes(q)
  );
  const matchedIncidents = INCIDENT_SCENARIOS.filter(
    (inc) =>
      !q ||
      inc.title.toLowerCase().includes(q) ||
      inc.statusBadge.toLowerCase().includes(q) ||
      inc.alertMessage.toLowerCase().includes(q)
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/75 p-0 lg:p-4 lg:pt-16 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col lg:h-auto lg:max-h-[80vh] lg:max-w-2xl lg:rounded-2xl border-0 lg:border border-slate-700 bg-slate-900 p-3.5 sm:p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
          <Search className="h-4 w-4 text-sky-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài học, lệnh kubectl, CrashLoopBackOff..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 shrink-0 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Đóng</span>
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5">
              Bài học trong Giáo trình ({matchedLessons.length})
            </div>
            <div className="space-y-1">
              {matchedLessons.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    selectLesson(l.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-white">{l.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {l.shortDescription}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 shrink-0 ml-2">
                    Bài {l.order}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              Tình huống Cứu hộ Sự cố ({matchedIncidents.length})
            </div>
            <div className="space-y-1">
              {matchedIncidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => {
                    openIncidentInWarRoom(inc.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-white">{inc.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {inc.alertMessage}
                    </div>
                  </div>
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] text-rose-300 shrink-0 ml-2">
                    {inc.statusBadge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
