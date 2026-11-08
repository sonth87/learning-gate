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
  Sun,
  Moon,
  Monitor,
  Terminal,
  StickyNote,
  Container,
  PanelLeftOpen,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { CicdMainTab } from '../../types/cicd.types';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { ALL_CICD_LESSONS } from '../../data/cicdCurriculumIndex';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { switchLearningApp } from '@/apps/appRegistry';
import { CicdMasteryLogo } from '@/components/common/AppLogos';
import { cn } from '@/utils/cn';

export const CICD_NAV_TABS: {
  id: CicdMainTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'curriculum',
    label: 'Lộ trình & Sơ đồ Luồng',
    shortLabel: 'Lý thuyết',
    shortcut: '⌘1',
    icon: <BookOpen className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'simulator',
    label: 'Giả lập Pipeline & Traffic',
    shortLabel: 'Giả lập CI/CD',
    shortcut: '⌘2',
    icon: <Workflow className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'warroom',
    label: 'Mô phỏng Tình huống (B1–B7)',
    shortLabel: 'Tình huống',
    shortcut: '⌘3',
    icon: <Flame className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'practice',
    label: 'Thực hành Cấu hình YAML/K8s',
    shortLabel: 'Thực hành',
    shortcut: '⌘4',
    icon: <Code2 className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'blueprints',
    label: '4 Bộ Full Flow Blueprints',
    shortLabel: 'Full Flows',
    shortcut: '⌘5',
    icon: <FolderGit2 className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'flashcards',
    label: 'Flashcards (SRS)',
    shortLabel: 'Flashcards',
    shortcut: '⌘6',
    icon: <Layers className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'exams',
    label: 'Thi Sát hạch',
    shortLabel: 'Sát hạch',
    shortcut: '⌘7',
    icon: <GraduationCap className="h-4 w-4 shrink-0" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển & Ma trận',
    shortLabel: 'Từ điển',
    shortcut: '⌘8',
    icon: <BookMarked className="h-4 w-4 shrink-0" />,
  },
];

export const CicdHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedLessonId,
    setMobileSidebarOpen,
  } = useCicdNavigationStore();
  const { openNotesDrawer } = useNavigationStore();
  const completedLessonIds = useUserDataStore((s) => s.completedLessonIds);

  const colorScheme = useStore((s) => s.colorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);

  const completedCount = ALL_CICD_LESSONS.filter((l) =>
    completedLessonIds.includes(l.id)
  ).length;
  const progressPercent = Math.round(
    (completedCount / ALL_CICD_LESSONS.length) * 100
  );

  const cycleTheme = () => {
    if (colorScheme === 'dark') setColorScheme('light');
    else if (colorScheme === 'light') setColorScheme('auto');
    else setColorScheme('dark');
  };

  return (
    <header className="shrink-0 z-40 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="mx-auto flex h-11 sm:h-12 max-w-[1680px] items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4">
        {/* Left: Mobile Drawer Trigger (on Curriculum tab) + Brand Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          {activeTab === 'curriculum' && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Mở mục lục bài học CI/CD"
              title="Mở mục lục 21 bài học CI/CD"
              className="inline-flex lg:hidden h-7 sm:h-8 items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 text-xs font-bold text-cyan-300 active:scale-95 transition-all"
            >
              <PanelLeftOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Mục lục</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('curriculum')}
            className="flex items-center gap-2 text-left min-w-0 group"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <CicdMasteryLogo size={32} className="h-full w-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                  CI/CD Mastery
                </span>
                <span className="hidden md:inline-flex rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                  01/06
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="h-1 w-8 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono">
                  {completedCount}/{ALL_CICD_LESSONS.length}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs (lg+; < lg uses CicdMobileBottomNav) */}
        <nav
          aria-label="Điều hướng phân hệ CI/CD Mastery"
          className="hidden lg:flex items-center gap-0.5 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 overflow-x-auto no-scrollbar"
        >
          {CICD_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={`${tab.label} (${tab.shortcut})`}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-lg px-2 xl:px-2.5 text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                )}
              >
                {tab.icon}
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions & Quick App Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Switch to Docker & K8s Mastery App Button */}
          <button
            onClick={() => switchLearningApp('kubemastery')}
            title="Chuyển nhanh sang ứng dụng Docker & K8s Mastery"
            className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 sm:px-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition-all"
          >
            <Container className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="hidden md:inline">Docker & K8s</span>
            <span className="hidden sm:inline md:hidden text-[10px]">K8s</span>
          </button>

          {/* Switch to Python Mastery App Button */}
          <button
            onClick={() => switchLearningApp('pymastery')}
            title="Chuyển nhanh sang ứng dụng Python Mastery"
            className="inline-flex h-7 w-7 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 sm:px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Python App</span>
            <span className="hidden sm:inline md:hidden text-[10px]">Py</span>
          </button>

          {/* Notes Drawer */}
          <button
            onClick={() =>
              openNotesDrawer(
                'lesson',
                selectedLessonId,
                `CI/CD: ${selectedLessonId}`
              )
            }
            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white"
            title="Sổ tay Ghi chú"
          >
            <StickyNote className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={cycleTheme}
            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white"
            title="Đổi giao diện Sáng / Tối / Hệ thống"
          >
            {colorScheme === 'light' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : colorScheme === 'dark' ? (
              <Moon className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Monitor className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
