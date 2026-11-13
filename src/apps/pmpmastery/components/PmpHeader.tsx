import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Compass,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Layers,
  Moon,
  Scale,
  Search,
  Settings,
  Sun,
  Monitor,
  Terminal,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { PmpMasteryLogo } from '@/components/common/AppLogos';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { usePmpCurriculum, usePmpLinks } from '@/features/pmp-course/data';
import { pmpModuleDone } from '@/features/pmp-course/logic';
import { buildMindmapUrl } from '@/features/pmp-course/links';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '@/features/pmp-course/store';
import type { PmpTab } from '@/features/pmp-course/types';
import { cn } from '@/utils/cn';

const PRIMARY_TABS: {
  id: PmpTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'learn',
    label: 'Học tư duy — Lộ trình 16 module, Quiz, Dẫn chứng & SRS',
    shortLabel: 'Học tư duy',
    shortcut: '⌘1',
    icon: GraduationCap,
  },
  {
    id: 'canvas',
    label: 'PMP Mindset Canvas — Bức tranh tổng thể 1 trang',
    shortLabel: 'Mindset Canvas',
    shortcut: '⌘2',
    icon: Layers,
  },
  {
    id: 'decision',
    label: 'Cây quyết định tình huống & 12 ca thực chiến',
    shortLabel: 'Cây quyết định',
    shortcut: '⌘3',
    icon: GitBranch,
  },
  {
    id: 'lookup',
    label: 'Bảng đối chiếu nhanh & Kho Deep Link PMP Mindmap',
    shortLabel: 'Đối chiếu & Link',
    shortcut: '⌘4',
    icon: Scale,
  },
];

export const PmpHeader: React.FC = () => {
  const { activeTab, setActiveTab, isSearchOpen, setSearchOpen } = usePmpAppStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);

  const { data: cur } = usePmpCurriculum();
  const pmpState = usePmpProgress((s) => s.state);
  const doneCount = cur ? cur.modules.filter((m) => pmpModuleDone(pmpState, m, cur.passQuiz)).length : 0;
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
      <header className="sticky top-0 z-40 h-13 sm:h-12 shrink-0 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4">
          {/* Brand + Progress */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="flex min-h-[44px] sm:min-h-0 items-center gap-1.5 sm:gap-2 text-left min-w-0 group cursor-pointer"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                <PmpMasteryLogo size={32} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                    PMP Mastery
                  </span>
                  <span className="hidden md:inline-block rounded-full border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
                    PMBOK 8 · MINDSET
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="h-1 w-10 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-amber-500 transition-all duration-300"
                    />
                  </div>
                  <span className="font-mono">
                    {doneCount}/{totalCount}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Center Nav (lg+) */}
          <nav
            aria-label="Điều hướng học phần PMP Mastery"
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
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/45 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <a
              href="https://pmp-mindmap.vercel.app/?lang=vi"
              target="_blank"
              rel="noopener noreferrer"
              title="Mở ứng dụng đồng hành PMP Mindmap trong tab mới"
              className="hidden sm:inline-flex h-8 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/12 px-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">PMP Mindmap</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>

            <button
              type="button"
              onClick={() => switchLearningApp('kubemastery')}
              title="Mở ứng dụng Docker & K8s Mastery"
              className="hidden md:inline-flex h-8 items-center gap-1 rounded-lg border border-sky-500/35 bg-sky-500/10 px-2 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors cursor-pointer"
            >
              <Boxes className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">K8s</span>
            </button>

            <button
              type="button"
              onClick={() => switchLearningApp('pymastery')}
              title="Mở ứng dụng Python Mastery"
              className="hidden md:inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">Python</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm nhanh module và dẫn chứng PMP"
              className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-amber-400 hover:border-amber-500/40 hover:text-white transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={cycleMobileTheme}
              aria-label={resolvedScheme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
              className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {resolvedScheme === 'light' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-amber-300" />
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
                  colorScheme === 'light' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
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
                  colorScheme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
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
                  colorScheme === 'auto' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
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
              className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && <PmpQuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

const PmpQuickSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const setActiveTab = usePmpAppStore((s) => s.setActiveTab);
  const go = usePmpNav((s) => s.go);
  const markVisited = usePmpProgress((s) => s.markEvidenceVisited);
  const { data: cur } = usePmpCurriculum();
  const { data: linksMap } = usePmpLinks();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const matchedModules = (cur?.modules ?? []).filter(
    (m) =>
      !q ||
      m.id.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
  );
  const matchedLinks = Object.values(linksMap ?? {}).filter(
    (l) =>
      !q ||
      l.label.toLowerCase().includes(q) ||
      l.whyRead.toLowerCase().includes(q) ||
      (l.nodeId ?? '').toLowerCase().includes(q) ||
      (l.flowId ?? '').toLowerCase().includes(q)
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
          <Search className="h-4 w-4 text-amber-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm module (P00..P15), PMBOK 8, Change Request, Risk vs Issue, Scrum, EVM..."
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              Module Tư duy PMP ({matchedModules.length})
            </div>
            <div className="space-y-1">
              {matchedModules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('learn');
                    go({ name: 'module', id: m.id });
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white">
                      <span className="font-mono text-amber-400 mr-1.5">{m.id}</span>
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5">
              Điểm neo Dẫn chứng PMP Mindmap ({matchedLinks.length})
            </div>
            <div className="space-y-1">
              {matchedLinks.slice(0, 15).map((lnk) => (
                <a
                  key={lnk.linkId}
                  href={buildMindmapUrl(lnk)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markVisited(lnk.linkId);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-white">{lnk.label}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{lnk.whyRead}</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
