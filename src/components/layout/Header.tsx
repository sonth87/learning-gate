import React, { useEffect, useRef, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  FolderGit2,
  Globe,
  GraduationCap,
  LayoutGrid,
  Moon,
  Search,
  Settings,
  StickyNote,
  Sun,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@sonth87/device-layout';
import { closeLearningApp } from '@/apps/appRegistry';
import { PyMasteryLogo } from '@/components/common/AppLogos';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useWpNav } from '@/features/workpath/store';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import { WORKBENCH_I18N } from '@/components/scale-workbench/i18n';
import { cn } from '@/utils/cn';

const LANGUAGES: { code: WorkbenchLang; label: string; native: string }[] = [
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'en', label: 'English', native: 'English' },
];

export const Header: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const {
    activeTab,
    setActiveTab,
    setSettingsOpen,
    setSetupGuideOpen,
    openNotesDrawer,
    selectedLessonId,
  } = useNavigationStore();

  const wpView = useWpNav((s) => s.view);
  const goWp = useWpNav((s) => s.go);

  const {
    lang,
    setLanguage,
    theme,
    setWorkbenchTheme,
    setSearchPaletteOpen,
  } = useWorkbenchStore(
    useShallow((s) => ({
      lang: s.language,
      setLanguage: s.setLanguage,
      theme: s.workbenchTheme,
      setWorkbenchTheme: s.setWorkbenchTheme,
      setSearchPaletteOpen: s.setSearchPaletteOpen,
    }))
  );

  const setAppTheme = useSettingsStore((s) => s.setTheme);
  const setDeviceColorScheme = useStore((s) => s.setColorScheme);
  const { notes, bookmarks } = useUserDataStore();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const t = WORKBENCH_I18N[lang];
  const totalNotes = notes.length + bookmarks.length;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setWorkbenchTheme(next);
    setAppTheme(next);
    setDeviceColorScheme(next);
  };

  const isLearnMode = activeTab === 'learn' && wpView.name === 'workbench';
  const isPracticeMode = activeTab === 'learn' && wpView.name !== 'workbench';
  const isLabMode = activeTab === 'playground';
  const isCheatsheetsMode = activeTab === 'glossary';
  const isMoreActive = ['samples', 'exams', 'reference', 'curriculum', 'practice', 'flashcards'].includes(
    activeTab
  );

  const extraItems: {
    id: MainTab | 'setup' | 'notes';
    labelVi: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'samples',
      labelVi: 'Dự án Thực tế & PBL (IDE)',
      labelEn: 'Real Projects & PBL (IDE)',
      icon: <FolderGit2 className="h-3.5 w-3.5" />,
    },
    {
      id: 'exams',
      labelVi: 'Trung tâm Thi sát hạch',
      labelEn: 'Certification Exams',
      icon: <GraduationCap className="h-3.5 w-3.5" />,
    },
    {
      id: 'reference',
      labelVi: 'Chuyên đề Sâu & Clean Arch',
      labelEn: 'Deep Dives & Clean Arch',
      icon: <Compass className="h-3.5 w-3.5" />,
    },
    {
      id: 'curriculum',
      labelVi: 'Giáo trình Tra cứu 7 Giai đoạn',
      labelEn: '7-Stage Reference Archive',
      icon: <BookOpen className="h-3.5 w-3.5" />,
    },
    {
      id: 'setup',
      labelVi: 'Hướng dẫn Cài đặt uv / VS Code',
      labelEn: 'Setup Python / uv / VS Code',
      icon: <Wrench className="h-3.5 w-3.5" />,
    },
    {
      id: 'notes',
      labelVi: `Ghi chú & Đánh dấu (${totalNotes})`,
      labelEn: `Notes & Bookmarks (${totalNotes})`,
      icon: <StickyNote className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <header className="@container shrink-0 z-40 border-b-[1.5px] border-[var(--dts-border)] bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <div className="mx-auto flex h-12 max-w-[1920px] items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left: Brand + Primary 4 Mode Tabs (Container-query adaptive for floating DeviceLayout windows) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('learn');
              goWp({ name: 'workbench' });
            }}
            className="group flex items-center gap-2 text-left shrink-0"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] shadow-[1.5px_1.5px_0_var(--dts-shadow-color)]">
              <PyMasteryLogo className="h-full w-full" />
            </div>
            <span className="font-mono text-sm font-extrabold tracking-tight text-[var(--dts-ink)]">
              Python Mastery
            </span>
          </button>

          {/* 4 Primary Mode Tabs (adapts to actual window width via @container) */}
          <nav
            aria-label="Primary learning modes"
            className="hidden @[680px]:flex items-center gap-1 ml-1 shrink-0"
          >
            <button
              type="button"
              title={t.tabs.learn}
              onClick={() => {
                setActiveTab('learn');
                goWp({ name: 'workbench' });
              }}
              className={cn(
                'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all',
                isLearnMode
                  ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(isLearnMode ? 'inline' : 'hidden @[900px]:inline')}>
                {t.tabs.learn}
              </span>
            </button>

            <button
              type="button"
              title={t.tabs.practice}
              onClick={() => {
                setActiveTab('learn');
                if (wpView.name === 'workbench') {
                  goWp({ name: 'exercises' });
                }
              }}
              className={cn(
                'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all',
                isPracticeMode
                  ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(isPracticeMode ? 'inline' : 'hidden @[900px]:inline')}>
                {t.tabs.practice}
              </span>
            </button>

            <button
              type="button"
              title={t.tabs.lab}
              onClick={() => setActiveTab('playground')}
              className={cn(
                'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all',
                isLabMode
                  ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(isLabMode ? 'inline' : 'hidden @[1020px]:inline')}>
                {t.tabs.lab}
              </span>
            </button>

            <button
              type="button"
              title={t.tabs.cheatsheets}
              onClick={() => setActiveTab('glossary')}
              className={cn(
                'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all',
                isCheatsheetsMode
                  ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                  : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
              )}
            >
              <BookMarked className="h-3.5 w-3.5 shrink-0" />
              <span className={cn(isCheatsheetsMode ? 'inline' : 'hidden @[1140px]:inline')}>
                {t.tabs.cheatsheets}
              </span>
            </button>

            {/* More Hubs Dropdown */}
            <div ref={moreRef} className="relative shrink-0">
              <button
                type="button"
                title={t.tabs.more}
                onClick={() => setMoreMenuOpen((o) => !o)}
                className={cn(
                  'inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all',
                  isMoreActive || moreMenuOpen
                    ? 'dts-card-tactile bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                    : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden @[1180px]:inline">{t.tabs.more}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>

              {moreMenuOpen && (
                <div
                  role="menu"
                  className="dts-card-tactile absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl bg-[var(--dts-panel)] p-1.5"
                >
                  {extraItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        if (item.id === 'setup') {
                          setSetupGuideOpen(true);
                        } else if (item.id === 'notes') {
                          openNotesDrawer(
                            'lesson',
                            selectedLessonId,
                            `Lesson: ${selectedLessonId}`
                          );
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-xs font-semibold transition-colors',
                        activeTab === item.id
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                      )}
                    >
                      {item.icon}
                      <span>{lang === 'en' ? item.labelEn : item.labelVi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Search ⌘K Bar · Language Picker · Paper/Dark Theme Toggle · Settings · Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wide Tactile Search Trigger (adapts to @container width) */}
          <button
            type="button"
            onClick={() => setSearchPaletteOpen(true, 'pymastery')}
            aria-label={t.searchPlaceholder}
            title={`${t.searchPlaceholder} (⌘K)`}
            className="dts-btn-tactile inline-flex h-8 items-center justify-between gap-2.5 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 @[1160px]:w-56 @[1360px]:w-64 font-mono text-xs text-[var(--dts-ink-muted)]"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink)]" />
              <span className="hidden @[1160px]:inline truncate">{t.searchPlaceholder}</span>
            </span>
            <kbd className="hidden @[860px]:inline-block rounded border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--dts-ink)]">
              ⌘K
            </kbd>
          </button>

          {/* Language Switcher Dropdown (VI / EN) */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              aria-label="Select Language"
              className="dts-btn-tactile inline-flex h-8 items-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-ink)]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang.toUpperCase()}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {langMenuOpen && (
              <div
                role="menu"
                className="dts-card-tactile absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl bg-[var(--dts-panel)] p-1.5"
              >
                {LANGUAGES.map((l) => {
                  const selected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setLanguage(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition-colors',
                        selected
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                      )}
                    >
                      <span>
                        {l.native}{' '}
                        <span className="text-[10px] opacity-65">({l.code.toUpperCase()})</span>
                      </span>
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paper Light / Espresso Dark Theme Toggle (Desktop >= lg; on Mobile/Tablet accessible inside Settings) */}
          <button
            type="button"
            onClick={handleToggleTheme}
            title={theme === 'light' ? t.themes.dark : t.themes.light}
            aria-label="Toggle Paper Light / Espresso Dark theme"
            className="dts-btn-tactile hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-300" />
            )}
          </button>

          {/* Preferences & Backup (Always visible; replaces Theme slot on Mobile/Tablet) */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Cài đặt & Đăng nhập đồng bộ"
            aria-label="Preferences & Backup"
            className="dts-btn-tactile inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Close Window back to DeviceLayout Desktop */}
          <button
            type="button"
            onClick={() => closeLearningApp('pymastery', windowId)}
            aria-label={t.closeApp}
            className="dts-btn-tactile inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] hover:bg-[var(--dts-rose-bg)] hover:text-[var(--dts-rose-ink)]"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">{t.closeApp}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
