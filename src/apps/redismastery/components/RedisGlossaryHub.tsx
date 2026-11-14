import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookMarked, Code2, Search, Sparkles, Terminal } from 'lucide-react';
import { REDIS_GLOSSARY_ENTRIES } from '../data/redisGlossaryData';
import type { RedisComplexityClass, RedisGlossaryCategory } from '../types/redis.types';
import { cn } from '@/utils/cn';

const CATEGORIES: ('Tất cả' | RedisGlossaryCategory)[] = [
  'Tất cả',
  'String & Keyspace',
  'Hash · List · Set',
  'ZSet · Probabilistic · Geo',
  'Streams · PubSub · Lua',
  'Caching · Lock · Rate Limit',
  'Persistence · Cluster · Ops',
];

const COMPLEXITY_BADGE: Record<RedisComplexityClass, string> = {
  'O(1)': 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  'O(log N)': 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  'O(N) Cẩn trọng': 'border-amber-500/40 bg-amber-500/15 text-amber-300',
};

export const RedisGlossaryHub: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'Tất cả' | RedisGlossaryCategory>('Tất cả');
  const [sdkLang, setSdkLang] = useState<'cli' | 'node' | 'python'>('cli');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REDIS_GLOSSARY_ENTRIES.filter((entry) => {
      if (category !== 'Tất cả' && entry.category !== category) return false;
      if (!q) return true;
      return (
        entry.term.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.analogy.toLowerCase().includes(q) ||
        entry.cliExample.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-7 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
            <BookMarked className="h-3.5 w-3.5" />
            <span>REDIS 8 COMMANDS · BIG-O · NODE & PYTHON SDK</span>
          </div>
          <h1 className="mt-1.5 text-lg sm:text-2xl font-extrabold text-white tracking-tight">
            Từ điển Liên tưởng, Độ phức tạp Big-O & Mẫu Code Thực chiến
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Mọi lệnh trên Redis chạy tuần tự trên Main Thread — kiểm tra Big-O trước khi đưa lên Production và đối chiếu trực tiếp sang <code className="font-mono text-rose-300">ioredis</code> (Node/TS) & <code className="font-mono text-emerald-300">redis-py</code> (Python).
          </p>
        </div>

        {/* Global SDK Switcher */}
        <div className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1 self-start">
          <button
            type="button"
            onClick={() => setSdkLang('cli')}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              sdkLang === 'cli' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>redis-cli</span>
          </button>
          <button
            type="button"
            onClick={() => setSdkLang('node')}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              sdkLang === 'node' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Node.js (ioredis)</span>
          </button>
          <button
            type="button"
            onClick={() => setSdkLang('python')}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              sdkLang === 'python' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Python (redis-py)</span>
          </button>
        </div>
      </div>

      {/* Search + Category Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm lệnh hoặc khái niệm: HEXPIRE, ZRANGE, BF.EXISTS, XAUTOCLAIM, HashTag, LFU..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-rose-500/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                category === cat
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((entry) => {
          const code =
            sdkLang === 'cli'
              ? entry.cliExample
              : sdkLang === 'node'
              ? entry.nodeExample
              : entry.pythonExample;

          return (
            <div
              key={entry.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/85 p-4 space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {entry.category}
                    </div>
                    <h2 className="mt-0.5 font-mono text-sm sm:text-base font-extrabold text-white">
                      {entry.term}
                    </h2>
                  </div>
                  <span
                    title={entry.complexityDetail}
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold',
                      COMPLEXITY_BADGE[entry.complexity]
                    )}
                  >
                    {entry.complexity}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400">{entry.complexityDetail}</div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{entry.summary}</p>

                <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Liên tưởng JS/Python:</strong> {entry.analogy}
                  </span>
                </div>

                {entry.productionDanger && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý Production:</strong> {entry.productionDanger}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>
                    {sdkLang === 'cli'
                      ? 'redis-cli'
                      : sdkLang === 'node'
                      ? 'TypeScript · ioredis'
                      : 'Python · redis-py'}
                  </span>
                </div>
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                  {code}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
