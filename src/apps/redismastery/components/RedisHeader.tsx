import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  Cpu,
  GraduationCap,
  Monitor,
  Moon,
  Search,
  Settings,
  ShieldAlert,
  Sun,
  Workflow,
  X,
} from 'lucide-react';
import { useStore } from '@sonth87/device-layout';
import { closeLearningApp } from '@/apps/appRegistry';
import { RedisMasteryLogo } from '@/components/common/AppLogos';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useCourseCurriculum } from '@/features/devops-course/data';
import { courseModuleDone } from '@/features/devops-course/logic';
import { useRedisNav, useRedisProgress } from '@/features/devops-course/store';
import { useRedisStore } from '../store/useRedisStore';
import type { RedisMainTab } from '../types/redis.types';
import { REDIS_INCIDENT_SCENARIOS } from '../data/redisIncidentsData';
import { REDIS_GLOSSARY_ENTRIES } from '../data/redisGlossaryData';
import { cn } from '@/utils/cn';

const NAV_TABS: {
  id: RedisMainTab;
  label: string;
  shortLabel: string;
  shortcut: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'learn',
    label: 'Học — 18 module từ cơ bản đến Redis Cluster, bài thực hành, quiz, cấu hình thật',
    shortLabel: 'Học',
    shortcut: '⌘1',
    icon: GraduationCap,
  },
  {
    id: 'simulator',
    label: 'Mô phỏng RAM Eviction · 16384 Hash Slots · Live redis-cli',
    shortLabel: 'Mô phỏng RAM & Cluster',
    shortcut: '⌘2',
    icon: Cpu,
  },
  {
    id: 'flow-studio',
    label: 'Sơ đồ Động — 6 Luồng Kiến trúc Redis',
    shortLabel: 'Sơ đồ Động',
    shortcut: '⌘3',
    icon: Workflow,
  },
  {
    id: 'incidents',
    label: 'War-Room: 8 Sự cố Production Redis',
    shortLabel: 'War-Room',
    shortcut: '⌘4',
    icon: ShieldAlert,
  },
  {
    id: 'glossary',
    label: 'Từ điển Lệnh, Big-O & Node/Python SDK',
    shortLabel: 'Từ điển & Big-O',
    shortcut: '⌘5',
    icon: BookMarked,
  },
];

export const RedisHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab, isSearchOpen, setSearchOpen } = useRedisStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);

  const { data: cur } = useCourseCurriculum('redis');
  const redisState = useRedisProgress((s) => s.state);
  const doneCount = cur ? cur.modules.filter((m) => courseModuleDone(redisState, m, cur.passQuiz)).length : 0;
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
          {/* Brand Logo + Course Progress */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="flex min-h-[44px] sm:min-h-0 items-center gap-1.5 sm:gap-2 text-left min-w-0 group cursor-pointer"
            >
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                <RedisMasteryLogo size={32} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight text-white truncate">
                    RedisMastery
                  </span>
                  <span className="hidden xl:inline-block rounded-full border border-rose-500/35 bg-rose-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-rose-300">
                    REDIS 8 · IN-MEMORY
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="h-1 w-10 sm:w-12 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-rose-500 transition-all duration-300"
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
            aria-label="Điều hướng học phần Redis"
            className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 shrink-0"
          >
            {NAV_TABS.map((tab) => {
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
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
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
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm nhanh module, lệnh và sự cố Redis"
              className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/90 text-rose-400 hover:border-rose-500/40 hover:text-white transition-colors cursor-pointer"
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
                <Moon className="h-3.5 w-3.5 text-rose-400" />
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
                  colorScheme === 'light' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-200'
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
                  colorScheme === 'dark' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-200'
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
                  colorScheme === 'auto' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-200'
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
              className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <span className="h-5 w-px bg-slate-800 shrink-0 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => closeLearningApp('redismastery', windowId)}
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

      {isSearchOpen && <RedisQuickSearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
};

const RedisQuickSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const { setActiveTab, openIncidentInWarRoom } = useRedisStore();
  const goRedis = useRedisNav((s) => s.go);
  const { data: cur } = useCourseCurriculum('redis');

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
      m.summary.toLowerCase().includes(q)
  );
  const matchedIncidents = REDIS_INCIDENT_SCENARIOS.filter(
    (inc) =>
      !q ||
      inc.title.toLowerCase().includes(q) ||
      inc.statusBadge.toLowerCase().includes(q) ||
      inc.alertMessage.toLowerCase().includes(q)
  );
  const matchedGlossary = REDIS_GLOSSARY_ENTRIES.filter(
    (g) => !q || g.term.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q)
  ).slice(0, 6);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/75 p-0 lg:p-4 lg:pt-16 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col lg:h-auto lg:max-h-[80vh] lg:max-w-2xl lg:rounded-2xl border-0 lg:border border-slate-700 bg-slate-900 p-3.5 sm:p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
          <Search className="h-4 w-4 text-rose-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm module (R00..R17), ZADD, XREADGROUP, Stampede, CROSSSLOT..."
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              Module trong Lộ trình Học ({matchedModules.length})
            </div>
            <div className="space-y-1">
              {matchedModules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('learn');
                    goRedis({ name: 'module', id: m.id });
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white">
                      <span className="font-mono text-rose-400 mr-1.5">{m.id}</span>
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              War-Room Sự cố Production ({matchedIncidents.length})
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

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
              Từ điển Lệnh & Big-O ({matchedGlossary.length})
            </div>
            <div className="space-y-1">
              {matchedGlossary.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('glossary');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-mono font-semibold text-white">{g.term}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{g.summary}</div>
                  </div>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300 shrink-0 ml-2">
                    {g.complexity}
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
