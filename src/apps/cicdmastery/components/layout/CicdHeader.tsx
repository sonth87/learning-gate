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
  StickyNote,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { CicdMainTab } from '../../types/cicd.types';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { ALL_CICD_LESSONS } from '../../data/cicdCurriculumIndex';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { switchLearningApp } from '@/apps/appRegistry';
import {
  PyMasteryLogo,
  KubeMasteryLogo,
  CicdMasteryLogo,
} from '@/components/common/AppLogos';
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
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: 'simulator',
    label: 'Giả lập Pipeline & Traffic',
    shortLabel: 'Giả lập CI/CD',
    shortcut: '⌘2',
    icon: <Workflow className="h-4 w-4" />,
  },
  {
    id: 'warroom',
    label: 'Mô phỏng Tình huống (B1–B7)',
    shortLabel: 'Tình huống',
    shortcut: '⌘3',
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: 'practice',
    label: 'Thực hành Cấu hình YAML/K8s',
    shortLabel: 'Thực hành',
    shortcut: '⌘4',
    icon: <Code2 className="h-4 w-4" />,
  },
  {
    id: 'blueprints',
    label: '4 Bộ Full Flow Blueprints',
    shortLabel: 'Full Flows',
    shortcut: '⌘5',
    icon: <FolderGit2 className="h-4 w-4" />,
  },
  {
    id: 'flashcards',
    label: 'Flashcards (SRS)',
    shortLabel: 'Flashcards',
    shortcut: '⌘6',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    id: 'exams',
    label: 'Thi Sát hạch',
    shortLabel: 'Thi Sát hạch',
    shortcut: '⌘7',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển & Ma trận',
    shortLabel: 'Từ điển',
    shortcut: '⌘8',
    icon: <BookMarked className="h-4 w-4" />,
  },
];

export const CicdHeader: React.FC = () => {
  const { activeTab, setActiveTab, selectedLessonId } =
    useCicdNavigationStore();
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
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-5">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md overflow-hidden">
            <CicdMasteryLogo className="h-full w-full" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-extrabold tracking-tight text-white">
                CI/CD Mastery
              </span>
              <span className="hidden sm:inline-flex rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                Chuyên đề 01/06
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Kiến trúc Thực chiến • DAG • DevSecOps • GitOps • Zero-Downtime
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CICD_NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                )}
              >
                {tab.icon}
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions & Quick App Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Progress Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs">
            <div className="h-2 w-14 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-cyan-300">
              {progressPercent}%
            </span>
          </div>

          {/* Switch to Docker & K8s Mastery App Button */}
          <button
            onClick={() => switchLearningApp('kubemastery')}
            title="Chuyển nhanh sang ứng dụng Docker & K8s Mastery"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-2.5 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition-all"
          >
            <KubeMasteryLogo className="h-4 w-4 shrink-0 rounded-sm" />
            <span className="hidden sm:inline">Docker & K8s</span>
          </button>

          {/* Switch to Python Mastery App Button */}
          <button
            onClick={() => switchLearningApp('pymastery')}
            title="Chuyển nhanh sang ứng dụng Python Mastery"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-all"
          >
            <PyMasteryLogo className="h-4 w-4 shrink-0 rounded-sm" />
            <span className="hidden sm:inline">Python App</span>
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white"
            title="Sổ tay Ghi chú"
          >
            <StickyNote className="h-4 w-4 text-cyan-400" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={cycleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white"
            title="Đổi giao diện Sáng / Tối / Hệ thống"
          >
            {colorScheme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : colorScheme === 'dark' ? (
              <Moon className="h-4 w-4 text-cyan-400" />
            ) : (
              <Monitor className="h-4 w-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-bar for Tablet/Mobile (< xl) */}
      <div className="flex xl:hidden items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 bg-slate-900/60 px-3 py-1.5">
        {CICD_NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
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
  );
};
