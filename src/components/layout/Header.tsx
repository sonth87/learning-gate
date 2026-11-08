import React from 'react';
import {
  BookOpen,
  Code2,
  FolderGit2,
  Layers,
  GraduationCap,
  BookMarked,
  Compass,
  Search,
  Settings,
  StickyNote,
  ArrowRightLeft,
  Sun,
  Moon,
  Monitor,
  Wrench,
  Terminal,
  Container,
  Workflow,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { ALL_LESSONS } from '@/data/curriculum';
import { cn } from '@/utils/cn';

const NAV_TABS: {
  id: MainTab;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'curriculum',
    label: 'Lộ trình & Lý thuyết',
    shortcut: '⌘1',
    icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'playground',
    label: 'Playground & Studio IDE',
    shortcut: '⌘2',
    icon: <Terminal className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'practice',
    label: 'Thực hành Code',
    shortcut: '⌘3',
    icon: <Code2 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'samples',
    label: 'Dự án Mẫu (16 Projects IDE)',
    shortcut: '⌘4',
    icon: <FolderGit2 className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'flashcards',
    label: 'Flashcards (SRS)',
    shortcut: '⌘5',
    icon: <Layers className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'exams',
    label: 'Thi Sát hạch',
    shortcut: '⌘6',
    icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển & Thư viện Python',
    shortcut: '⌘7',
    icon: <BookMarked className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'reference',
    label: 'Chuyên đề PDF',
    shortcut: '⌘8',
    icon: <Compass className="h-4 w-4" aria-hidden="true" />,
  },
];

const HeaderTooltip: React.FC<{
  label: string;
  shortcut?: string;
  align?: 'center' | 'right' | 'left';
  children: React.ReactNode;
}> = ({ label, shortcut, align = 'center', children }) => (
  <div className="group/tip relative inline-flex">
    {children}
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 delay-150',
        'absolute top-full mt-2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-700/90 bg-slate-900/95 px-2.5 py-1 text-[11px] font-medium text-slate-100 shadow-lg backdrop-blur-md',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'right' && 'right-0',
        align === 'left' && 'left-0'
      )}
    >
      <span>{label}</span>
      {shortcut && (
        <kbd className="rounded bg-slate-800 px-1 py-0.2 font-mono text-[10px] text-emerald-400 border border-slate-700">
          {shortcut}
        </kbd>
      )}
    </div>
  </div>
);

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setSearchOpen,
    setSettingsOpen,
    setSetupGuideOpen,
    openNotesDrawer,
    selectedLessonId,
  } = useNavigationStore();

  const {
    setTheme,
    showJsTsComparison,
    toggleJsTsComparison,
  } = useSettingsStore();

  const deviceColorScheme = useStore((s) => s.colorScheme);
  const setDeviceColorScheme = useStore((s) => s.setColorScheme);

  const activeThemeMode =
    deviceColorScheme === 'auto' ? 'system' : deviceColorScheme;

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    setDeviceColorScheme(mode === 'system' ? 'auto' : mode);
  };

  const { completedLessonIds, notes, bookmarks } = useUserDataStore();

  const progressPercent = Math.round(
    (completedLessonIds.length / ALL_LESSONS.length) * 100
  );

  const totalNotesAndBookmarks = notes.length + bookmarks.length;

  return (
    <header className="shrink-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-11 sm:h-12 max-w-[1680px] items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-4">
        {/* Left: Brand & Compact Progress Pill */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <HeaderTooltip
            label={`Tiến độ hoàn thành: ${completedLessonIds.length}/${ALL_LESSONS.length} bài (${progressPercent}%)`}
            align="left"
          >
            <button
              onClick={() => setActiveTab('curriculum')}
              className="group flex items-center gap-2 text-left focus-visible:outline-none min-w-0"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 transition-transform duration-200 group-hover:scale-105 overflow-hidden">
                <img
                  src="/favicon.svg"
                  alt="Learning Gate"
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                    PyMastery
                  </span>
                  <span className="hidden sm:inline-block rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-400">
                    Learning Gate
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="h-1 w-10 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full bg-emerald-500 transition-all duration-300"
                    />
                  </div>
                  <span className="font-mono">
                    {completedLessonIds.length}/{ALL_LESSONS.length}
                  </span>
                </div>
              </div>
            </button>
          </HeaderTooltip>
        </div>

        {/* Center: Icon-Only Module Navigation with Hover Tooltips (lg+ Desktop; Mobile & Tablet use MobileBottomNav) */}
        <nav
          aria-label="Điều hướng phân hệ chính"
          className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 shrink-0"
        >
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <HeaderTooltip
                key={tab.id}
                label={tab.label}
                shortcut={tab.shortcut}
              >
                <button
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-7 w-8 items-center justify-center rounded-lg transition-all duration-150',
                    active
                      ? 'bg-slate-800 text-emerald-400 shadow-xs border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  )}
                >
                  {tab.icon}
                </button>
              </HeaderTooltip>
            );
          })}
        </nav>

        {/* Right: Icon-Only Utility Cluster with Hover Tooltips */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Switch to CI/CD Mastery App Button */}
          <HeaderTooltip
            label="Mở App học CI/CD Architecture (CI/CD Mastery)"
            align="right"
          >
            <button
              onClick={() => switchLearningApp('cicdmastery')}
              aria-label="Mở App học CI/CD Architecture"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-500/45 bg-cyan-500/15 px-2 sm:px-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-500/60 transition-all cursor-pointer shadow-xs"
            >
              <Workflow className="h-3.5 w-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline whitespace-nowrap">
                CI/CD App
              </span>
            </button>
          </HeaderTooltip>

          {/* Switch to Docker & K8s Mastery App Button */}
          <HeaderTooltip
            label="Mở App học Docker & Kubernetes (KubeMastery)"
            align="right"
          >
            <button
              onClick={() => switchLearningApp('kubemastery')}
              aria-label="Mở App học Docker & Kubernetes"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-sky-500/45 bg-sky-500/15 px-2 sm:px-2.5 text-xs font-bold text-sky-300 hover:bg-sky-500/25 hover:border-sky-500/60 transition-all cursor-pointer shadow-xs"
            >
              <Container className="h-3.5 w-3.5 text-sky-400 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline whitespace-nowrap">
                Docker & K8s App
              </span>
            </button>
          </HeaderTooltip>

          {/* Quick Setup Guide Button (Python / uv / pyenv / VS Code) */}
          <HeaderTooltip
            label="Hướng dẫn Cài đặt Python, uv / pyenv, .venv & VS Code"
            align="right"
          >
            <button
              onClick={() => setSetupGuideOpen(true)}
              aria-label="Hướng dẫn Cài đặt Python, uv / pyenv, .venv & VS Code"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 sm:px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xs"
            >
              <Wrench className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline whitespace-nowrap">
                Cài đặt Python / uv / pyenv
              </span>
            </button>
          </HeaderTooltip>

          {/* Quick Search Cmd+K (Icon Only) */}
          <HeaderTooltip label="Tìm kiếm nhanh" shortcut="⌘K" align="right">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm nhanh (Cmd+K)"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-amber-400 hover:border-slate-700 hover:bg-slate-800/80 hover:text-amber-300 transition-all cursor-pointer shadow-xs"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </HeaderTooltip>

          {/* JS/TS Comparison Mode Toggle (Icon Only) */}
          <HeaderTooltip
            label={`Đối chiếu JS/TS (${showJsTsComparison ? 'Đang bật' : 'Đang tắt'})`}
            align="right"
          >
            <button
              onClick={toggleJsTsComparison}
              aria-label="Bật/Tắt chế độ đối chiếu JS/TS"
              aria-pressed={showJsTsComparison}
              className={cn(
                'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                showJsTsComparison
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span
                className={cn(
                  'absolute top-1 right-1 h-1.5 w-1.5 rounded-full',
                  showJsTsComparison ? 'bg-cyan-400' : 'bg-slate-600'
                )}
              />
            </button>
          </HeaderTooltip>

          {/* Notes & Bookmarks Drawer Button (Icon Only) */}
          <HeaderTooltip label="Ghi chú & Đánh dấu" align="right">
            <button
              onClick={() =>
                openNotesDrawer(
                  'lesson',
                  selectedLessonId,
                  `Bài học: ${selectedLessonId}`
                )
              }
              aria-label="Mở ngăn Ghi chú & Đánh dấu"
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
              {totalNotesAndBookmarks > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 font-mono text-[9px] font-bold text-slate-950">
                  {totalNotesAndBookmarks}
                </span>
              )}
            </button>
          </HeaderTooltip>

          {/* Mobile Quick Theme Toggle (< sm) */}
          <button
            onClick={() =>
              handleSelectTheme(activeThemeMode === 'light' ? 'dark' : 'light')
            }
            aria-label="Đổi giao diện Sáng / Tối"
            className="inline-flex sm:hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-amber-400 hover:bg-slate-800 transition-colors"
          >
            {activeThemeMode === 'light' ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            )}
          </button>

          {/* Theme Switcher: Icons Only (sm+) */}
          <div
            role="group"
            aria-label="Chế độ giao diện Sáng / Tối / Tự động"
            className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 shrink-0"
          >
            <HeaderTooltip label="Giao diện Sáng (Light)" align="right">
              <button
                onClick={() => handleSelectTheme('light')}
                aria-label="Giao diện Sáng (Light)"
                aria-pressed={activeThemeMode === 'light'}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  activeThemeMode === 'light'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </HeaderTooltip>
            <HeaderTooltip label="Giao diện Tối (Dark)" align="right">
              <button
                onClick={() => handleSelectTheme('dark')}
                aria-label="Giao diện Tối (Dark)"
                aria-pressed={activeThemeMode === 'dark'}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  activeThemeMode === 'dark'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </HeaderTooltip>
            <HeaderTooltip label="Tự động theo hệ thống (Auto)" align="right">
              <button
                onClick={() => handleSelectTheme('system')}
                aria-label="Tự động theo hệ thống (Auto)"
                aria-pressed={activeThemeMode === 'system'}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                  activeThemeMode === 'system'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </HeaderTooltip>
          </div>

          {/* Settings & JSON Backup (Icon Only) */}
          <HeaderTooltip label="Cài đặt & Sao lưu dữ liệu" shortcut="⌘," align="right">
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Cài đặt & Sao lưu dữ liệu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </HeaderTooltip>
        </div>
      </div>
    </header>
  );
};
