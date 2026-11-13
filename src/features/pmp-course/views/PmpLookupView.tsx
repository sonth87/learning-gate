import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  Link2,
  Scale,
  Search,
} from 'lucide-react';
import { usePmpComparisons, usePmpLinks } from '../data';
import { pmpEvidenceVisited } from '../logic';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '../store';
import { buildMindmapUrl, getLinkKindBadge } from '../links';
import { Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter } from '../components/PmpShared';
import { cn } from '@/utils/cn';

const CATEGORY_LABEL: Record<string, string> = {
  all: 'Tất cả bảng đối chiếu',
  approach: 'Phương pháp & Agile',
  governance: 'Governance & Tài liệu',
  people: 'Con người & Xung đột',
  execution: 'Phạm vi · Chi phí · Rủi ro',
  'pmbok8-bridge': 'PMBOK 8 ↔ PMA',
};

export const PmpLookupView: React.FC = () => {
  const { data: comparisons } = usePmpComparisons();
  const { data: linksMap } = usePmpLinks();
  const s = usePmpProgress((x) => x.state);
  const markVisited = usePmpProgress((x) => x.markEvidenceVisited);
  const openQuickPreview = usePmpAppStore((x) => x.openQuickPreview);
  const setActiveTab = usePmpAppStore((x) => x.setActiveTab);
  const go = usePmpNav((x) => x.go);

  const [section, setSection] = useState<'comparisons' | 'links'>('comparisons');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [linkKindFilter, setLinkKindFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const allLinks = useMemo(() => (linksMap ? Object.values(linksMap) : []), [linksMap]);

  if (!comparisons || !linksMap) return <Spinner />;

  const q = query.trim().toLowerCase();

  const filteredComparisons = comparisons.filter((c) => {
    if (catFilter !== 'all' && c.category !== catFilter) return false;
    if (!q) return true;
    const blob = `${c.title} ${c.subtitle} ${c.examTip} ${c.rows.flat().join(' ')}`.toLowerCase();
    return blob.includes(q);
  });

  const filteredLinks = allLinks.filter((l) => {
    if (linkKindFilter !== 'all') {
      if (linkKindFilter === 'core' && !(l.kind === 'node' && l.edition === 'core')) return false;
      if (linkKindFilter === 'book' && !(l.kind === 'node' && l.edition === 'book')) return false;
      if (linkKindFilter === 'flow' && l.kind !== 'flow') return false;
      if (linkKindFilter === 'practice' && l.kind !== 'practice' && l.kind !== 'panorama') return false;
    }
    if (!q) return true;
    const blob = `${l.linkId} ${l.label} ${l.whyRead} ${l.bridgeNote ?? ''} ${l.topicId ?? ''} ${l.nodeId ?? ''} ${l.flowId ?? ''}`.toLowerCase();
    return blob.includes(q);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-3.5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/75 p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Bảng Đối Chiếu Nhanh &amp; Kho Deep Link PMP Mindmap
          </h1>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-400">
            Phân biệt tức thì các cặp khái niệm hay gây bẫy nhất trong đề thi PMP và mở thẳng đúng Node / Flow / Phòng luyện tập đã kiểm chứng ID 100%.
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setSection('comparisons')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              section === 'comparisons' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Bảng so sánh ({comparisons.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('links')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              section === 'links' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Kho Deep Link ({allLinks.length})</span>
          </button>
        </div>
      </header>

      {/* Search & Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              section === 'comparisons'
                ? 'Tìm cặp khái niệm: Risk vs Issue, QA vs QC, Reserve, Charter, Agile, PMBOK 8...'
                : 'Tìm node, flow, chủ đề: core.mindset, flow.change, stakeholder, risk...'
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-500/60 focus:outline-none"
          />
        </div>

        {section === 'comparisons' ? (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORY_LABEL).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setCatFilter(k)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  catFilter === k
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'core', label: 'Core Map' },
              { id: 'book', label: 'Book Map' },
              { id: 'flow', label: '19 Flows' },
              { id: 'practice', label: 'Practice & Panorama' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLinkKindFilter(item.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  linkKindFilter === item.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {section === 'comparisons' ? (
        <div className="space-y-5">
          {filteredComparisons.map((table) => (
            <article
              key={table.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">{table.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{table.subtitle}</p>
                </div>
                <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                  {table.provenanceLabel}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] uppercase tracking-wider text-amber-300">
                      {table.headers.map((h, idx) => (
                        <th key={idx} className="p-2.5 font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {table.rows.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/35">
                        {r.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={cn(
                              'p-2.5 align-top leading-relaxed',
                              cIdx === 0 ? 'font-bold text-white whitespace-nowrap' : 'text-slate-300'
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-3.5 py-2.5 text-xs">
                <div className="text-amber-100">
                  <b className="text-amber-300">💡 Mẹo phản xạ phòng thi:</b> {table.examTip}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('learn');
                      go({ name: 'module', id: table.moduleId });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>{table.moduleId}</span>
                  </button>
                  {table.evidenceLinkIds.map((lid) => {
                    const lnk = linksMap[lid];
                    if (!lnk) return null;
                    return (
                      <a
                        key={lid}
                        href={buildMindmapUrl(lnk)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markVisited(lnk.linkId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{lnk.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredLinks.map((lnk) => {
            const url = buildMindmapUrl(lnk);
            const visited = pmpEvidenceVisited(s, lnk.linkId);
            const badge = getLinkKindBadge(lnk.kind, lnk.edition);
            return (
              <div
                key={lnk.linkId}
                className={cn(
                  'flex flex-col justify-between rounded-xl border bg-slate-900/75 p-4',
                  visited ? 'border-emerald-500/35' : 'border-slate-800'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold', badge.cls)}>
                      {badge.label}
                    </span>
                    {visited && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Đã xem
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white">{lnk.label}</h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{lnk.whyRead}</p>
                  {lnk.bridgeNote && (
                    <p className="mt-1.5 text-[11px] text-sky-300">Đối chiếu: {lnk.bridgeNote}</p>
                  )}
                  <p className="mt-1.5 break-all font-mono text-[10px] text-slate-500">{url}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-slate-800">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markVisited(lnk.linkId)}
                    className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-amber-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Mở trong tab mới</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => openQuickPreview(lnk)}
                    className="hidden lg:inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Xem nhanh</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PmpTrademarkFooter />
    </div>
  );
};
