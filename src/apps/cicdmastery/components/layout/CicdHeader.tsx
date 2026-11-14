import React, { useEffect, useRef, useState } from 'react';
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
  PanelLeftOpen,
  Settings,
  Library,
  ChevronDown,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { CicdMainTab } from '../../types/cicd.types';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { closeLearningApp } from '@/apps/appRegistry';
import { CicdMasteryLogo } from '@/components/common/AppLogos';
import { useCourseCurriculum } from '@/features/devops-course/data';
import { courseModuleDone } from '@/features/devops-course/logic';
import { useCicdProgress } from '@/features/devops-course/store';
import { cn } from '@/utils/cn';

const PRIMARY_TABS: {
  id: CicdMainTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'learn',
    label: 'Học — lộ trình, bài thực hành, quiz, đọc workflow thật',
    shortLabel: 'Học',
    shortcut: '⌘1',
    icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    id: 'simulator',
    label: 'Giả lập Pipeline, DAG & Zero-Downtime Traffic',
    shortLabel: 'Giả lập Pipeline',
    shortcut: '⌘2',
    icon: <Workflow className="h-3.5 w-3.5 shrink-0" />,
  },
  {
    id: 'glossary',
    label: 'Từ điển & Ma trận Kiến trúc CI/CD',
    shortLabel: 'Từ điển & Ma trận',
    shortcut: '⌘3',
    icon: <BookMarked className="h-3.5 w-3.5 shrink-0" />,
  },
];

const MORE_TABS: {
  id: CicdMainTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'warroom', label: 'War-Room: Tình huống Thực chiến (B1–B7)', icon: <Flame className="h-4 w-4 shrink-0" /> },
  { id: 'blueprints', label: '4 Bộ Full Flow Blueprints IDE', icon: <FolderGit2 className="h-4 w-4 shrink-0" /> },
  { id: 'curriculum', label: 'Giáo trình gốc (6 trụ cột PDF)', icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  { id: 'practice', label: 'Bài thực hành cũ', icon: <Code2 className="h-4 w-4 shrink-0" /> },
  { id: 'flashcards', label: 'Flashcards cũ', icon: <Layers className="h-4 w-4 shrink-0" /> },
  { id: 'exams', label: 'Thi Sát hạch cũ', icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
];

const CicdMoreMenu: React.FC = () => {
  const { activeTab, setActiveTab } = useCicdNavigationStore();
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
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
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
          className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md"
        >
          <div className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Tài liệu & Công cụ tra cứu bổ sung
          </div>
          {MORE_TABS.map((t) => (
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
                activeTab === t.id ? 'bg-slate-800 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/70'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CicdHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab, selectedLessonId, setMobileSidebarOpen } = useCicdNavigationStore();
  const { openNotesDrawer, setSettingsOpen } = useNavigationStore();

  const { data: cur } = useCourseCurriculum('cicd');
  const cicdState = useCicdProgress((s) => s.state);
  const doneCount = cur ? cur.modules.filter((m) => courseModuleDone(cicdState, m, cur.passQuiz)).length : 0;
  const totalCount = cur?.modules.length ?? 0;
  const progressPercent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const colorScheme = useStore((s) => s.colorScheme);
  const setColorScheme = useStore((s) => s.setColorScheme);

  const cycleTheme = () => {
    if (colorScheme === 'dark') setColorScheme('light');
    else if (colorScheme === 'light') setColorScheme('auto');
    else setColorScheme('dark');
  };

  return (
    <header className="shrink-0 z-40 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md select-none">
      <div className="mx-auto flex h-13 sm:h-12 max-w-[1680px] items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4">
        {/* Left: Mobile Drawer Trigger (only on legacy Curriculum tab) + Brand Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          {activeTab === 'curriculum' && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Mở mục lục bài học CI/CD"
              className="inline-flex lg:hidden min-h-[44px] sm:min-h-0 sm:h-8 items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 text-xs font-bold text-cyan-300 active:scale-95 transition-all cursor-pointer"
            >
              <PanelLeftOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Mục lục</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('learn')}
            className="flex min-h-[44px] sm:min-h-0 items-center gap-1.5 sm:gap-2 text-left min-w-0 group cursor-pointer"
          >
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <CicdMasteryLogo size={32} className="h-full w-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                  CI/CD Mastery
                </span>
                <span className="hidden md:inline-flex rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                  PIPELINE & GITOPS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="h-1 w-10 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono">
                  {doneCount}/{totalCount}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs (lg+) */}
        <nav
          aria-label="Điều hướng phân hệ CI/CD Mastery"
          className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 shrink-0"
        >
          {PRIMARY_TABS.map((tab) => {
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
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                )}
              >
                {tab.icon}
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
          <CicdMoreMenu />
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => openNotesDrawer('lesson', selectedLessonId, `CI/CD: ${selectedLessonId}`)}
            className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer"
            title="Sổ tay Ghi chú"
            aria-label="Sổ tay Ghi chú"
          >
            <StickyNote className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={cycleTheme}
            className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer"
            title="Đổi giao diện Sáng / Tối / Hệ thống"
            aria-label="Đổi giao diện Sáng / Tối / Hệ thống"
          >
            {colorScheme === 'light' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : colorScheme === 'dark' ? (
              <Moon className="h-3.5 w-3.5 text-cyan-400" />
            ) : (
              <Monitor className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Cài đặt & Sao lưu dữ liệu"
            title="Cài đặt & Sao lưu dữ liệu"
            className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-500/40 hover:text-white cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <span className="h-5 w-px bg-slate-800 shrink-0 mx-0.5" aria-hidden="true" />

          <button
            type="button"
            onClick={() => closeLearningApp('cicdmastery', windowId)}
            aria-label="Đóng ứng dụng về màn hình chính"
            title="Đóng ứng dụng về màn hình chính"
            className="inline-flex h-10 w-10 sm:h-8 sm:w-auto items-center justify-center gap-1 rounded-lg border border-slate-700/90 bg-slate-900/90 sm:px-2.5 text-xs font-semibold text-slate-300 hover:border-rose-500/50 hover:bg-rose-500/15 hover:text-rose-300 active:bg-rose-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <X className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Đóng</span>
          </button>
        </div>
      </div>
    </header>
  );
};
