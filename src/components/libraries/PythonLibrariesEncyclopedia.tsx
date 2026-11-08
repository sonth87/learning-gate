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

const LibraryDetailCard: React.FC<{
  lib: PythonLibraryGuide;
  showJsTsComparison: boolean;
}> = ({ lib, showJsTsComparison }) => {
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg space-y-0">
      {/* Top Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/90 bg-slate-950/80 px-4 py-3.5 sm:px-5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2.5 py-0.5 font-mono text-[11px] font-extrabold border',
                lib.kind === 'stdlib'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
              )}
            >
              {lib.kind === 'stdlib'
                ? '⚡ Thư viện Chuẩn (Có sẵn trong Python)'
                : '📦 Thư viện Thực chiến (Third-Party)'}
            </span>
            <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {lib.domainLabel}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-white pt-0.5">
            {lib.title}
          </h3>
        </div>

        {/* Install Command Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs shrink-0">
          <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          {lib.kind === 'stdlib' ? (
            <span className="text-emerald-300 font-semibold">
              Có sẵn — chỉ cần import!
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-emerald-300 font-bold">
                {lib.installCmd.uv}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-300">{lib.installCmd.pip}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleCopyInstall}
            className="ml-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-sans text-[10px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {copiedInstall ? 'Đã copy' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Body Grid */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* 1. What It Is & Problem Solved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              🎯 Thư viện này là gì & Dùng để làm gì?
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {lib.whatItIs}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              💡 Giải quyết vấn đề thực tế gì?
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {lib.problemSolved}
            </p>
          </div>
        </div>

        {/* 2. Key APIs / Commonly Used Functions & Classes */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/50 p-3.5 space-y-2.5">
          <div className="text-xs font-extrabold text-sky-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>
              Những Hàm / Class / Tính năng liên quan hay được dùng nhất trong `{lib.name}`:
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lib.keyApis.map((api, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-2 space-y-0.5"
              >
                <code className="font-mono text-xs font-bold text-amber-300">
                  {api.symbol}
                </code>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {api.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Annotated Real-world Usage Code */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3.5 py-2 bg-slate-900/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Cách dùng thực tế (Kèm comment giải thích từng bước):</span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
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
          <pre className="p-4 font-mono text-xs leading-5 overflow-x-auto select-text ide-dark-surface">
            <code>{renderHighlightedPython(lib.usageCode, false)}</code>
          </pre>
        </div>

        {/* 4. Tips, Tricks & Best Practices + Alternatives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Tips & Tricks */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-2">
            <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 shrink-0" />
              <span>Tips, Tricks & Bẫy cần tránh khi sử dụng:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200 leading-relaxed">
              {lib.tipsAndTricks.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Alternatives in Python */}
          <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5 space-y-2">
            <div className="text-xs font-extrabold text-violet-300 flex items-center gap-1.5">
              <GitCompare className="h-3.5 w-3.5 shrink-0" />
              <span>
                Thư viện khác thay thế / Mở rộng (Khi nào chọn cái nào?):
              </span>
            </div>
            <div className="space-y-2">
              {lib.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800/90 bg-slate-950/70 px-3 py-2 space-y-0.5"
                >
                  <div className="font-mono text-xs font-bold text-violet-200">
                    🔄 {alt.name}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {alt.whenToChoose}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Conditional Node.js / JS-TS Comparison */}
        {showJsTsComparison && (
          <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Tương ứng bên Node.js / JS / TS:{' '}
                  <code className="rounded bg-slate-950 px-2 py-0.5 font-mono text-cyan-200">
                    {lib.nodeJsEquivalent.packages}
                  </code>
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lib.nodeJsEquivalent.explanation}
              </p>
            </div>
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

  const stdlibCount = PYTHON_LIBRARIES_CATALOG.filter(
    (l) => l.kind === 'stdlib'
  ).length;
  const thirdPartyCount = PYTHON_LIBRARIES_CATALOG.filter(
    (l) => l.kind === 'third-party'
  ).length;

  return (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Kind Switcher: All vs Stdlib vs Third-Party */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setKindFilter('all')}
              className={cn(
                'rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                kindFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              Tất cả ({PYTHON_LIBRARIES_CATALOG.length} bộ thư viện)
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('stdlib')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                kindFilter === 'stdlib'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                Thư viện Chuẩn có sẵn (Standard Library: {stdlibCount})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setKindFilter('third-party')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                kindFilter === 'third-party'
                  ? 'bg-sky-400 text-slate-950 shadow-xs'
                  : 'bg-slate-950 text-sky-300 border border-sky-500/30 hover:bg-sky-500/10'
              )}
            >
              <Package className="h-3.5 w-3.5" />
              <span>
                Thư viện Thực chiến cài thêm (Third-Party: {thirdPartyCount})
              </span>
            </button>
          </div>

          {/* Search + JS/TS Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm pathlib, httpx, pydantic, zod, axios..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={toggleJsTsComparison}
              aria-pressed={showJsTsComparison}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0',
                showJsTsComparison
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
              )}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>
                So sánh Node.js/JS: {showJsTsComparison ? 'BẬT' : 'TẮT'}
              </span>
            </button>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {LIBRARY_DOMAINS.map((dom) => (
            <button
              key={dom.id}
              type="button"
              onClick={() => setDomainFilter(dom.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                domainFilter === dom.id
                  ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950/70 text-slate-400 border border-slate-800/80 hover:text-slate-200'
              )}
            >
              {dom.label}
            </button>
          ))}
        </div>
      </div>

      {/* Library Cards List */}
      <div className="space-y-4">
        {filteredLibraries.map((lib) => (
          <LibraryDetailCard
            key={lib.id}
            lib={lib}
            showJsTsComparison={showJsTsComparison}
          />
        ))}

        {filteredLibraries.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
            Không tìm thấy thư viện nào khớp với từ khóa &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>
    </div>
  );
};
