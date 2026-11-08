import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Workflow,
  Server,
  GitBranch,
  Stethoscope,
  Code2,
  BookMarked,
  GraduationCap,
  Search,
  Sun,
  Moon,
  Monitor,
  Container,
  Terminal,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { KUBE_LESSONS } from '../data/curriculumData';
import { INCIDENT_SCENARIOS } from '../data/incidentsData';
import { ANIMATED_FLOW_LIST } from '../data/animatedFlowsData';
import { useKubeStore } from '../store/useKubeStore';
import { KubeTab } from '../types/kube.types';
import { cn } from '@/utils/cn';

export const KUBE_NAV_TABS: {
  id: KubeTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'curriculum',
    label: 'Lộ trình & Lý thuyết',
    shortLabel: 'Lý thuyết',
    shortcut: '⌘1',
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 'flow-studio',
    label: 'Sơ đồ Động (Animated Flows)',
    shortLabel: 'Sơ đồ Động',
    shortcut: '⌘2',
    icon: <Workflow className="h-4 w-4" />,
  },
  {
    id: 'cluster-sim',
    label: 'Mô phỏng Cụm K8s & Terminal',
    shortLabel: 'Cụm K8s',
    shortcut: '⌘3',
    icon: <Server className="h-4 w-4" />,
  },
  {
    id: 'cicd-sim',
    label: 'Giả lập CI/CD & GitOps',
    shortLabel: 'CI/CD',
    shortcut: '⌘4',
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: 'incidents',
    label: '8 Tình huống Sự cố (War-Room)',
    shortLabel: 'Xử lý Lỗi',
    shortcut: '⌘5',
    icon: <Stethoscope className="h-4 w-4" />,
  },
  {
    id: 'practice',
    label: 'Luyện tập Viết YAML/Dockerfile',
    shortLabel: 'Luyện tập',
    shortcut: '⌘6',
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển Liên tưởng & Cheatsheet',
    shortLabel: 'Từ điển/Lệnh',
    shortcut: '⌘7',
    icon: <BookMarked className="h-4 w-4" />,
  },
  {
    id: 'exams',
    label: 'Flashcards & Thi Sát hạch',
    shortLabel: 'Sát hạch',
    shortcut: '⌘8',
    icon: <GraduationCap className="h-4 w-4" />,
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
    selectLesson,
    openFlowInStudio,
    openIncidentInWarRoom,
  } = useKubeStore();

  const [query, setQuery] = useState('');

  const deviceColorScheme = useStore((s) => s.colorScheme);
  const setDeviceColorScheme = useStore((s) => s.setColorScheme);
  const activeThemeMode =
    deviceColorScheme === 'auto' ? 'system' : deviceColorScheme;

  const progressPct = Math.round(
    (completedLessonIds.length / KUBE_LESSONS.length) * 100
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSearchOpen]);

  const q = query.trim().toLowerCase();
  const matchedLessons = KUBE_LESSONS.filter(
    (l) =>
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.shortDescription.toLowerCase().includes(q)
  );
  const matchedFlows = ANIMATED_FLOW_LIST.filter(
    (f) =>
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.subtitle.toLowerCase().includes(q)
  );
  const matchedIncidents = INCIDENT_SCENARIOS.filter(
    (inc) =>
      !q ||
      inc.title.toLowerCase().includes(q) ||
      inc.statusBadge.toLowerCase().includes(q)
  );

  return (
    <>
      <header className="shrink-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-[1680px] items-center justify-between gap-2 px-3 sm:px-4">
          {/* Brand Logo */}
          <button
            onClick={() => setActiveTab('curriculum')}
            className="flex items-center gap-2.5 text-left min-w-0 shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 shadow-xs">
              <Container className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-white truncate">
                  KubeMastery
                </span>
                <span className="hidden sm:inline-block rounded bg-sky-500/15 border border-sky-500/35 px-1.5 py-0.2 font-mono text-[10px] font-bold text-sky-300">
                  Docker & K8s Lab
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="h-1 w-12 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${progressPct}%` }}
                    className="h-full bg-sky-400 transition-all duration-300"
                  />
                </div>
                <span className="font-mono">
                  {completedLessonIds.length}/{KUBE_LESSONS.length} bài •{' '}
                  {solvedIncidentIds.length}/8 sự cố
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Tabs (xl+) */}
          <nav
            aria-label="Điều hướng phân hệ Docker & K8s"
            className="hidden xl:flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1"
          >
            {KUBE_NAV_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={`${tab.label} (${tab.shortcut})`}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all',
                    active
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/45 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  )}
                >
                  {tab.icon}
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => switchLearningApp('cicdmastery')}
              title="Chuyển sang App học CI/CD Architecture (CI/CD Mastery)"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-cyan-500/45 bg-cyan-500/15 px-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition-all"
            >
              <Workflow className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">CI/CD App</span>
            </button>

            <button
              onClick={() => switchLearningApp('pymastery')}
              title="Chuyển sang App học Python (PyMastery)"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Python App</span>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800"
            >
              <Search className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tìm nhanh</span>
              <kbd className="hidden md:inline rounded bg-slate-800 px-1 font-mono text-[10px] text-sky-300">
                ⌘K
              </kbd>
            </button>

            <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
              <button
                onClick={() => setDeviceColorScheme('light')}
                title="Giao diện Sáng"
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md',
                  activeThemeMode === 'light'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeviceColorScheme('dark')}
                title="Giao diện Tối"
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md',
                  activeThemeMode === 'dark'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeviceColorScheme('auto')}
                title="Tự động"
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md',
                  activeThemeMode === 'system'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tablet/Mobile Horizontal Scrollable Tab Strip (< xl) */}
        <div className="flex xl:hidden items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/70 bg-slate-950 px-3 py-1.5">
          {KUBE_NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0',
                  active
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {tab.icon}
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Quick Search Modal (⌘K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <Search className="h-4 w-4 text-sky-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm bài học, sơ đồ động, sự cố OOMKilled, ImagePullBackOff, lệnh kubectl..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-sky-400 mb-1.5">
                  Bài học Lý thuyết ({matchedLessons.length})
                </div>
                <div className="space-y-1">
                  {matchedLessons.slice(0, 4).map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        selectLesson(l.id);
                        setSearchOpen(false);
                      }}
                      className="w-full rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <div className="font-bold text-white">{l.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {l.shortDescription}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-emerald-400 mb-1.5">
                  Sơ đồ Động Tương tác ({matchedFlows.length})
                </div>
                <div className="space-y-1">
                  {matchedFlows.slice(0, 3).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        openFlowInStudio(f.id);
                        setSearchOpen(false);
                      }}
                      className="w-full rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <div className="font-bold text-white">{f.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] font-bold uppercase text-rose-400 mb-1.5">
                  Tình huống Sự cố Thực chiến ({matchedIncidents.length})
                </div>
                <div className="space-y-1">
                  {matchedIncidents.slice(0, 4).map((inc) => (
                    <button
                      key={inc.id}
                      onClick={() => {
                        openIncidentInWarRoom(inc.id);
                        setSearchOpen(false);
                      }}
                      className="w-full rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-left hover:bg-slate-800"
                    >
                      <div className="font-bold text-white">{inc.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
