import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Sparkles,
  Lightbulb,
  ArrowRightLeft,
  Copy,
  Check,
  Terminal,
  Code2,
  GitCompare,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutList,
  BookOpen,
} from 'lucide-react';
import {
  LIBRARY_DOMAINS,
  LibraryDomainId,
  LibraryKind,
  PYTHON_LIBRARIES_CATALOG,
  PythonLibraryGuide,
} from '@/data/libraries/pythonLibrariesCatalog';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

const LibraryDetailPanel: React.FC<{
  lib: PythonLibraryGuide;
  showJsTsComparison: boolean;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}> = ({ lib, showJsTsComparison, index, total, onPrev, onNext }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lib.usageCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  const handleCopyInstall = () => {
    const text =
      lib.kind === 'stdlib'
        ? lib.installCmd.uv
        : `${lib.installCmd.uv}   # Hoặc: ${lib.installCmd.pip}`;
    navigator.clipboard.writeText(text);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 1600);
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 overflow-hidden shadow-2xl">
      {/* Top Accent Bar */}
      <div
        className={cn(
          'h-1.5 w-full',
          lib.kind === 'stdlib'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
            : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500'
        )}
      />

      {/* Header */}
      <div className="border-b border-slate-800/90 bg-slate-950/70 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-extrabold border',
                lib.kind === 'stdlib'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
              )}
            >
              {lib.kind === 'stdlib' ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Thư viện Chuẩn (Có sẵn trong Python)</span>
                </>
              ) : (
                <>
                  <Package className="h-3.5 w-3.5" />
                  <span>Thư viện Thực chiến (Third-Party PyPI)</span>
                </>
              )}
            </span>

            <span className="rounded-lg bg-slate-800/90 border border-slate-700 px-2.5 py-1 text-xs font-bold text-slate-300">
              {lib.domainLabel}
            </span>
          </div>

          {typeof index === 'number' && typeof total === 'number' && total > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-slate-400 mr-1">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={onPrev}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                title="Thư viện trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                title="Thư viện tiếp theo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
            {lib.title}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-semibold text-slate-400">
              Module / Gói cốt lõi:
            </span>
            <span className="rounded-md border border-slate-700/80 bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
              {lib.name}
            </span>
          </div>
        </div>

        {/* Install / Import Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
            {lib.kind === 'stdlib' ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-sans text-xs">
                  Cách nạp:
                </span>
                <code className="text-emerald-300 font-bold">
                  {lib.installCmd.uv}
                </code>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-sans text-[10px] font-semibold text-emerald-300">
                  Không cần cài đặt
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-sans">Dùng uv:</span>
                <code className="rounded bg-slate-950 px-2 py-0.5 text-emerald-300 font-bold">
                  {lib.installCmd.uv}
                </code>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 font-sans">Dùng pip:</span>
                <code className="rounded bg-slate-950 px-2 py-0.5 text-sky-300">
                  {lib.installCmd.pip}
                </code>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyInstall}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 font-sans text-xs font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
          >
            {copiedInstall ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Đã copy</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy lệnh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* 1. What It Is & Problem Solved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/10 p-4 space-y-1.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              🎯 Thư viện này là gì & Dùng để làm gì?
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {lib.whatItIs}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-950/10 p-4 space-y-1.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              💡 Giải quyết bài toán thực tế gì?
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {lib.problemSolved}
            </p>
          </div>
        </div>

        {/* 2. Key APIs */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/50 p-4 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400 shrink-0" />
            <span>
              Các Hàm / Class / Tính năng hay được dùng nhất trong {lib.name}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {lib.keyApis.map((api, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-3 space-y-1"
              >
                <code className="font-mono text-xs font-extrabold text-amber-300 block">
                  {api.symbol}
                </code>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {api.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Annotated Real-world Usage Code */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#090d16] shadow-inner">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 px-4 py-2.5 bg-slate-950/90">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <Code2 className="h-4 w-4 text-emerald-400 ml-1" />
              <span>Code Mẫu Thực Chiến (Có giải thích từng bước)</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã copy code</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy code mẫu</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto select-text ide-dark-surface">
            <code>{renderHighlightedPython(lib.usageCode, false)}</code>
          </pre>
        </div>

        {/* 4. Tips & Tricks + Alternatives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Tips, Tricks & Bẫy cần tránh</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
              {lib.tipsAndTricks.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5">
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-4 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
              <GitCompare className="h-4 w-4 text-violet-400 shrink-0" />
              <span>Thư viện Thay thế / Mở rộng trong Python</span>
            </div>
            <div className="space-y-2">
              {lib.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 space-y-1"
                >
                  <div className="font-mono text-xs font-extrabold text-violet-200">
                    🔄 {alt.name}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {alt.whenToChoose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Conditional Node.js / JS-TS Equivalent */}
        {showJsTsComparison && (
          <div className="rounded-2xl border border-cyan-500/35 bg-cyan-950/20 p-4 space-y-1">
            <div className="text-xs font-extrabold text-cyan-300 flex flex-wrap items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Tương đương bên Node.js / TypeScript:</span>
              <code className="rounded-lg bg-slate-950 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-cyan-200">
                {lib.nodeJsEquivalent.packages}
              </code>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed pl-6">
              {lib.nodeJsEquivalent.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const PythonLibrariesEncyclopedia: React.FC = () => {
  const { showJsTsComparison, toggleJsTsComparison } = useSettingsStore();
  const [kindFilter, setKindFilter] = useState<'all' | LibraryKind>('all');
  const [domainFilter, setDomainFilter] = useState<LibraryDomainId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibId, setSelectedLibId] = useState<string>(
    PYTHON_LIBRARIES_CATALOG[0]?.id || ''
  );
  const [viewAllMode, setViewAllMode] = useState(false);
  const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState(false);

  const filteredLibraries = useMemo(() => {
    return PYTHON_LIBRARIES_CATALOG.filter((lib) => {
      if (kindFilter !== 'all' && lib.kind !== kindFilter) return false;
      if (domainFilter !== 'all' && lib.domain !== domainFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          lib.name.toLowerCase().includes(q) ||
          lib.title.toLowerCase().includes(q) ||
          lib.whatItIs.toLowerCase().includes(q) ||
          lib.problemSolved.toLowerCase().includes(q) ||
          lib.nodeJsEquivalent.packages.toLowerCase().includes(q) ||
          lib.keyApis.some(
            (a) =>
              a.symbol.toLowerCase().includes(q) ||
              a.description.toLowerCase().includes(q)
          ) ||
          lib.alternatives.some((alt) => alt.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [kindFilter, domainFilter, searchQuery]);

  const activeIndex = useMemo(() => {
    const idx = filteredLibraries.findIndex((l) => l.id === selectedLibId);
    return idx >= 0 ? idx : 0;
  }, [filteredLibraries, selectedLibId]);

  const activeLibrary = filteredLibraries[activeIndex];

  const stdlibCount = PYTHON_LIBRARIES_CATALOG.filter(
    (l) => l.kind === 'stdlib'
  ).length;
  const thirdPartyCount = PYTHON_LIBRARIES_CATALOG.filter(
    (l) => l.kind === 'third-party'
  ).length;

  return (
    <div className="space-y-4">
      {/* Mobile & Tablet Quick Library Selector Bar (< lg) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/90 px-3.5 py-2.5 lg:hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {filteredLibraries.length > 1 && !viewAllMode && (
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const prevIdx =
                    (activeIndex - 1 + filteredLibraries.length) %
                    filteredLibraries.length;
                  setSelectedLibId(filteredLibraries[prevIdx].id);
                }}
                aria-label="Thư viện trước"
                className="rounded-lg p-1 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold text-emerald-400">
                {activeIndex + 1}/{filteredLibraries.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (activeIndex + 1) % filteredLibraries.length;
                  setSelectedLibId(filteredLibraries[nextIdx].id);
                }}
                aria-label="Thư viện tiếp theo"
                className="rounded-lg p-1 text-slate-300 hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <span className="font-mono text-xs font-extrabold text-amber-300 truncate">
            {activeLibrary ? activeLibrary.name : 'Danh mục Thư viện'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileCatalogOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer shrink-0',
            isMobileCatalogOpen ||
              kindFilter !== 'all' ||
              domainFilter !== 'all' ||
              searchQuery.trim() !== ''
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
              : 'border-slate-700 bg-slate-800 text-slate-200'
          )}
        >
          <Package className="h-3.5 w-3.5" />
          <span>
            {isMobileCatalogOpen
              ? 'Đóng Danh mục'
              : `Chọn & Lọc (${filteredLibraries.length})`}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT SIDEBAR (4 cols on desktop, collapsible on mobile/tablet): Library Catalog & Filters */}
        <aside
          className={cn(
            'lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-4 space-y-4 shadow-lg',
            !isMobileCatalogOpen && 'hidden lg:block'
          )}
        >
        {/* Search Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Danh mục Thư viện ({filteredLibraries.length})
            </span>
            <button
              type="button"
              onClick={toggleJsTsComparison}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer',
                showJsTsComparison
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400'
              )}
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>JS/TS: {showJsTsComparison ? 'BẬT' : 'TẮT'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm pathlib, httpx, pydantic, zod, axios..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Kind Filter Tabs */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setKindFilter('all')}
            className={cn(
              'rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer',
              kindFilter === 'all'
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
            )}
          >
            Tất cả ({PYTHON_LIBRARIES_CATALOG.length})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('stdlib')}
            className={cn(
              'rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer',
              kindFilter === 'stdlib'
                ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
            )}
          >
            ⚡ Có sẵn ({stdlibCount})
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('third-party')}
            className={cn(
              'rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer',
              kindFilter === 'third-party'
                ? 'border-sky-500/60 bg-sky-500/20 text-sky-300'
                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
            )}
          >
            📦 PyPI ({thirdPartyCount})
          </button>
        </div>

        {/* Domain Select */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Lọc theo Nhóm Bài toán:
          </label>
          <select
            value={domainFilter}
            onChange={(e) =>
              setDomainFilter(e.target.value as LibraryDomainId)
            }
            aria-label="Lọc theo Nhóm Bài toán"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            {LIBRARY_DOMAINS.map((dom) => (
              <option key={dom.id} value={dom.id}>
                {dom.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switch: Single Detail vs Expand All */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
          <span className="text-[11px] font-bold text-slate-400">
            Chế độ hiển thị:
          </span>
          <button
            type="button"
            onClick={() => setViewAllMode((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 cursor-pointer"
          >
            <LayoutList className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {viewAllMode ? 'Xem từng thư viện' : 'Trải toàn bộ danh sách'}
            </span>
          </button>
        </div>

        {/* Scrollable Library List */}
        <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1">
          {filteredLibraries.map((lib) => {
            const isSelected =
              !viewAllMode && activeLibrary?.id === lib.id;
            return (
              <button
                key={lib.id}
                type="button"
                onClick={() => {
                  setSelectedLibId(lib.id);
                  setIsMobileCatalogOpen(false);
                  if (viewAllMode) setViewAllMode(false);
                }}
                className={cn(
                  'w-full flex flex-col gap-1 rounded-xl border p-3 text-left transition-all cursor-pointer',
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/15 shadow-sm'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-extrabold text-white truncate">
                    {lib.name}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0',
                      lib.kind === 'stdlib'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-sky-500/15 text-sky-300'
                    )}
                  >
                    {lib.kind === 'stdlib' ? 'Stdlib' : 'PyPI'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 line-clamp-1">
                  {lib.domainLabel}
                </span>
                {showJsTsComparison && (
                  <span className="font-mono text-[10px] text-cyan-300/90 truncate">
                    ⇄ JS/TS: {lib.nodeJsEquivalent.packages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT STAGE (8 cols): Selected Library Deep Dive OR All Libraries */}
      <section className="lg:col-span-8 space-y-5">
        {filteredLibraries.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-12 text-center space-y-3">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-200">
              Không tìm thấy thư viện nào khớp với từ khóa &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setKindFilter('all');
                setDomainFilter('all');
                setSearchQuery('');
              }}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-[#020617] cursor-pointer"
            >
              Xem toàn bộ {PYTHON_LIBRARIES_CATALOG.length} nhóm thư viện
            </button>
          </div>
        ) : viewAllMode ? (
          <div className="space-y-5">
            {filteredLibraries.map((lib, idx) => (
              <LibraryDetailPanel
                key={lib.id}
                lib={lib}
                showJsTsComparison={showJsTsComparison}
                index={idx}
                total={filteredLibraries.length}
              />
            ))}
          </div>
        ) : (
          activeLibrary && (
            <LibraryDetailPanel
              lib={activeLibrary}
              showJsTsComparison={showJsTsComparison}
              index={activeIndex}
              total={filteredLibraries.length}
              onPrev={() => {
                const prevIdx =
                  (activeIndex - 1 + filteredLibraries.length) %
                  filteredLibraries.length;
                setSelectedLibId(filteredLibraries[prevIdx].id);
              }}
              onNext={() => {
                const nextIdx = (activeIndex + 1) % filteredLibraries.length;
                setSelectedLibId(filteredLibraries[nextIdx].id);
              }}
            />
          )
        )}
      </section>
      </div>
    </div>
  );
};
