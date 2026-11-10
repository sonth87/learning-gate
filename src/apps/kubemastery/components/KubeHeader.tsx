import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Workflow,
  Server,
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
  Settings,
  Library,
  ChevronDown,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { KubeMasteryLogo } from '@/components/common/AppLogos';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useCourseCurriculum } from '@/features/devops-course/data';
import { courseModuleDone } from '@/features/devops-course/logic';
import { useKubeNav, useKubeProgress } from '@/features/devops-course/store';
import { useKubeStore } from '../store/useKubeStore';
import { KubeTab } from '../types/kube.types';
import { INCIDENT_SCENARIOS } from '../data/incidentsData';
import { cn } from '@/utils/cn';

const PRIMARY_TABS: {
  id: KubeTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'learn',
    label: 'Học — lộ trình, bài thực hành, quiz, đọc cấu hình thật',
    shortLabel: 'Học',
    shortcut: '⌘1',
    icon: GraduationCap,
  },
  {
    id: 'cluster-sim',
    label: 'Mô phỏng Cụm K8s & Terminal',
    shortLabel: 'Mô phỏng Cụm',
    shortcut: '⌘2',
    icon: Server,
  },
  {
    id: 'glossary',
    label: 'Từ điển Liên tưởng & Bảng lệnh',
    shortLabel: 'Từ điển & Lệnh',
    shortcut: '⌘3',
    icon: BookMarked,
  },
];

const MORE_TABS: {
  id: KubeTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'flow-studio', label: 'Sơ đồ Động & Luồng kiến trúc', icon: Workflow },
  { id: 'incidents', label: 'War-Room: 8 Tình huống Sự cố', icon: ShieldAlert },
  { id: 'curriculum', label: 'Giáo trình cũ (4 giai đoạn)', icon: BookOpen },
  { id: 'practice', label: 'Phòng Lab YAML cũ', icon: Code2 },
  { id: 'exams', label: 'Thi sát hạch tổng hợp cũ', icon: GraduationCap },
];

const KubeMoreMenu: React.FC = () => {
  const { activeTab, setActiveTab } = useKubeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = MORE_TABS.some((t) => t.id === activeTab);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-all cursor-pointer',
          active
            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
        )}
      >
        <Library className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Tra cứu</span>
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 w-68 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md"
        >
          <div className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Tài liệu & Phòng thí nghiệm bổ sung
          </div>
          {MORE_TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveTab(t.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm cursor-pointer',
                  activeTab === t.id ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/70'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const KubeHeader: React.FC = () => {
  const { activeTab, setActiveTab, isSearchOpen, setSearchOpen } = useKubeStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);

  const { data: cur } = useCourseCurriculum('kube');
  const kubeState = useKubeProgress((s) => s.state);
  const doneCount = cur ? cur.modules.filter((m) => courseModuleDone(kubeState, m, cur.passQuiz)).length : 0;
  const totalCount = cur?.modules.length ?? 0;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const colorScheme = useStore((s) => s.colorScheme);
  const resolvedScheme = useStore((s) => s.resolvedColorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);

  const cycleMobileTheme = () => {
    setColorScheme(resolvedScheme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-11 sm:h-12 shrink-0 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4">
          {/* Brand Logo + Course Progress */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
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
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="h-1 w-10 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-sky-500 transition-all duration-300"
                    />
                  </div>
                  <span className="font-mono">
                    {doneCount}/{totalCount}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Center Navigation (lg+) */}
          <nav
            aria-label="Điều hướng học phần"
            className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 shrink-0"
          >
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={`${tab.label} (${tab.shortcut})`}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
            <KubeMoreMenu />
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => switchLearningApp('cicdmastery')}
              title="Mở ứng dụng CI/CD Architecture"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-cyan-500/35 bg-cyan-500/10 sm:px-2 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">CI/CD</span>
            </button>

            <button
              type="button"
              onClick={() => switchLearningApp('pymastery')}
              title="Mở ứng dụng Python Mastery"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 sm:px-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">Python</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm nhanh module và sự cố"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-sky-400 hover:border-sky-500/40 hover:text-white transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={cycleMobileTheme}
              aria-label={resolvedScheme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
              className="sm:hidden inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {resolvedScheme === 'light' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-sky-400" />
              )}
            </button>

            <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
              <button
                type="button"
                onClick={() => setColorScheme('light')}
                title="Giao diện Sáng"
                aria-label="Giao diện Sáng"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'light' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setColorScheme('dark')}
                title="Giao diện Tối"
                aria-label="Giao diện Tối"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'dark' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setColorScheme('auto')}
                title="Theo hệ thống"
                aria-label="Theo hệ thống"
                className={cn(
                  'rounded-md p-1 transition-colors cursor-pointer',
                  colorScheme === 'auto' ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Cài đặt & Sao lưu dữ liệu"
              title="Cài đặt & Sao lưu dữ liệu"
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && <KubeQuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

const KubeQuickSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const { setActiveTab, openIncidentInWarRoom } = useKubeStore();
  const goKube = useKubeNav((s) => s.go);
  const { data: cur } = useCourseCurriculum('kube');

  const q = query.trim().toLowerCase();
  const matchedModules = (cur?.modules ?? []).filter(
    (m) =>
      !q ||
      m.id.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q)
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
            placeholder="Tìm module (K00..K19), Dockerfile, Deployment, CrashLoopBackOff..."
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 shrink-0 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Đóng</span>
          </button>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5">
              Module trong Lộ trình Học ({matchedModules.length})
            </div>
            <div className="space-y-1">
              {matchedModules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('learn');
                    goKube({ name: 'module', id: m.id });
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white">
                      <span className="font-mono text-sky-400 mr-1.5">{m.id}</span>
                      {m.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{m.summary}</div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">Cấp {m.level}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              War-Room Cứu hộ Sự cố ({matchedIncidents.length})
            </div>
            <div className="space-y-1">
              {matchedIncidents.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => {
                    openIncidentInWarRoom(inc.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white">{inc.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{inc.alertMessage}</div>
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
