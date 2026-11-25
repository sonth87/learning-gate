import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  LayoutGrid,
  Moon,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@sonth87/device-layout';
import { closeLearningApp, type LearningAppId } from '@/apps/appRegistry';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import { WORKBENCH_I18N } from './i18n';
import { cn } from '@/utils/cn';

const LANGUAGES: { code: WorkbenchLang; native: string }[] = [
  { code: 'vi', native: 'Tiếng Việt' },
  { code: 'en', native: 'English' },
];

export interface ScaleHeaderTabItem {
  id: string;
  labelVi: string;
  labelEn: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export interface ScaleHeaderMoreItem {
  id: string;
  labelVi: string;
  labelEn: string;
  icon: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}

export interface ScaleAppHeaderProps {
  appId: LearningAppId;
  brandTitle: string;
  logo: React.ReactNode;
  onBrandClick: () => void;
  primaryTabs: ScaleHeaderTabItem[];
  moreItems?: ScaleHeaderMoreItem[];
  windowId?: string;
}

export const ScaleAppHeader: React.FC<ScaleAppHeaderProps> = ({
  appId,
  brandTitle,
  logo,
  onBrandClick,
  primaryTabs,
  moreItems = [],
  windowId,
}) => {
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const setAppTheme = useSettingsStore((s) => s.setTheme);
  const setDeviceColorScheme = useStore((s) => s.setColorScheme);

  const {
    lang,
    setLanguage,
    theme,
    setWorkbenchTheme,
    isSearchPaletteOpen,
    setSearchPaletteOpen,
  } = useWorkbenchStore(
    useShallow((s) => ({
      lang: s.language,
      setLanguage: s.setLanguage,
      theme: s.workbenchTheme,
      setWorkbenchTheme: s.setWorkbenchTheme,
      isSearchPaletteOpen: s.isSearchPaletteOpen,
      setSearchPaletteOpen: s.setSearchPaletteOpen,
    }))
  );

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const t = WORKBENCH_I18N[lang];
  const isMoreActive = moreItems.some((m) => m.active);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPaletteOpen(!isSearchPaletteOpen, appId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [appId, isSearchPaletteOpen, setSearchPaletteOpen]);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setWorkbenchTheme(next);
    setAppTheme(next);
    setDeviceColorScheme(next);
  };

  return (
    <header className="@container shrink-0 z-40 border-b-[1.5px] border-[var(--dts-border)] bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <div className="mx-auto flex h-12 max-w-[1920px] items-center justify-between gap-2 px-3 sm:px-4">
        {/* Left: Brand + Primary Mode Tabs (@container adaptive) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBrandClick}
            className="group flex items-center gap-2 text-left shrink-0 cursor-pointer"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] shadow-[1.5px_1.5px_0_var(--dts-shadow-color)]">
              {logo}
            </div>
            <span className="font-mono text-sm font-extrabold tracking-tight text-[var(--dts-ink)]">
              {brandTitle}
            </span>
          </button>

          <nav
            aria-label="Primary learning modes"
            className="hidden @[680px]:flex items-center gap-1 ml-1 shrink-0"
          >
            {primaryTabs.map((tab, idx) => {
              const lbl = lang === 'en' ? tab.labelEn : tab.labelVi;
              return (
                <button
                  key={tab.id}
                  type="button"
                  title={lbl}
                  onClick={tab.onClick}
                  aria-current={tab.active ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer',
                    tab.active
                      ? 'dts-card-tactile bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                      : 'text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                  )}
                >
                  {tab.icon}
                  <span
                    className={cn(
                      tab.active
                        ? 'inline'
                        : idx < 2
                          ? 'hidden @[900px]:inline'
                          : idx === 2
                            ? 'hidden @[1020px]:inline'
                            : 'hidden @[1140px]:inline'
                    )}
                  >
                    {lbl}
                  </span>
                </button>
              );
            })}

            {moreItems.length > 0 && (
              <div ref={moreRef} className="relative shrink-0">
                <button
                  type="button"
                  title={t.tabs.more}
                  onClick={() => setMoreMenuOpen((o) => !o)}
                  className={cn(
                    'inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-xl px-2.5 py-1 font-mono text-xs font-bold transition-all cursor-pointer',
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
                    className="dts-card-tactile absolute left-0 top-full z-50 mt-2 w-68 rounded-2xl bg-[var(--dts-panel)] p-1.5"
                  >
                    {moreItems.map((item) => {
                      const lbl = lang === 'en' ? item.labelEn : item.labelVi;
                      if (item.href) {
                        return (
                          <a
                            key={item.id}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMoreMenuOpen(false)}
                            className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-xs font-semibold text-[var(--dts-ink)] transition-colors hover:bg-[var(--dts-panel-muted)]"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              {item.icon}
                              <span className="truncate">{lbl}</span>
                            </span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-65" />
                          </a>
                        );
                      }
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            item.onClick?.();
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-xs font-semibold transition-colors cursor-pointer',
                            item.active
                              ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                              : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                          )}
                        >
                          {item.icon}
                          <span>{lbl}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right: Search ⌘K · Language VI/EN · Paper/Espresso Theme · Settings · Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchPaletteOpen(true, appId)}
            aria-label={t.searchPlaceholder}
            title={`${t.searchPlaceholder} (⌘K)`}
            className="dts-btn-tactile inline-flex h-8 shrink-0 whitespace-nowrap items-center justify-between gap-2 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 @[1260px]:w-48 @[1440px]:w-56 font-mono text-xs text-[var(--dts-ink-muted)] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--dts-ink)]" />
              <span className="hidden @[1260px]:inline truncate">
                {t.searchPlaceholder}
              </span>
            </span>
            <kbd className="hidden @[820px]:inline-block rounded border border-[var(--dts-border-soft)] bg-[var(--dts-panel-muted)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--dts-ink)]">
              ⌘K
            </kbd>
          </button>

          {/* Language Switcher (VI / EN) */}
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen((o) => !o)}
              aria-label="Select Language"
              className="dts-btn-tactile inline-flex h-8 items-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] cursor-pointer"
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
                        'flex w-full items-center justify-between rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer',
                        selected
                          ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                          : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                      )}
                    >
                      <span>
                        {l.native}{' '}
                        <span className="text-[10px] opacity-65">
                          ({l.code.toUpperCase()})
                        </span>
                      </span>
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paper Light / Espresso Dark Theme Toggle (Desktop >= 1024px; on Mobile/Tablet accessible inside Settings) */}
          <button
            type="button"
            onClick={handleToggleTheme}
            title={theme === 'light' ? t.themes.dark : t.themes.light}
            aria-label="Toggle Paper Light / Espresso Dark theme"
            className="dts-btn-tactile hidden @[1024px]:inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] cursor-pointer"
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
            onClick={() => closeLearningApp(appId, windowId)}
            aria-label={t.closeApp}
            className="dts-btn-tactile inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-[var(--dts-panel-elevated)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-ink)] hover:bg-[var(--dts-rose-bg)] hover:text-[var(--dts-rose-ink)] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden @[1120px]:inline">{t.closeApp}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
