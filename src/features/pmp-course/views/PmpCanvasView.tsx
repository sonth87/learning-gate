import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  GitBranch,
  Layers,
  Scale,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { usePmpCanvas, usePmpLinks } from '../data';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '../store';
import { buildMindmapUrl, DEFAULT_MINDMAP_BASE_URL } from '../links';
import type { CanvasCardItem, ProvenanceKind } from '../types';
import { Spinner } from '@/features/workpath/components/ui';
import { PmpTrademarkFooter, ProvenancePill } from '../components/PmpShared';
import { cn } from '@/utils/cn';

const TONE_CLS: Record<CanvasCardItem['tone'], string> = {
  amber: 'border-amber-500/40 bg-amber-500/[0.06] hover:border-amber-400/75',
  emerald: 'border-emerald-500/40 bg-emerald-500/[0.06] hover:border-emerald-400/75',
  sky: 'border-sky-500/40 bg-sky-500/[0.06] hover:border-sky-400/75',
  violet: 'border-violet-500/40 bg-violet-500/[0.06] hover:border-violet-400/75',
  rose: 'border-rose-500/40 bg-rose-500/[0.06] hover:border-rose-400/75',
  cyan: 'border-cyan-500/40 bg-cyan-500/[0.06] hover:border-cyan-400/75',
};

export const PmpCanvasView: React.FC = () => {
  const { data: canvas } = usePmpCanvas();
  const { data: linksMap } = usePmpLinks();
  const setActiveTab = usePmpAppStore((x) => x.setActiveTab);
  const openQuickPreview = usePmpAppStore((x) => x.openQuickPreview);
  const go = usePmpNav((x) => x.go);
  const markVisited = usePmpProgress((x) => x.markEvidenceVisited);

  const [filter, setFilter] = useState<'all' | ProvenanceKind>('all');
  const [selected, setSelected] = useState<CanvasCardItem | null>(null);

  if (!canvas) return <Spinner />;

  const jumpToModule = (moduleId: string) => {
    setSelected(null);
    setActiveTab('learn');
    go({ name: 'module', id: moduleId });
  };

  const matchFilter = (p: ProvenanceKind) => filter === 'all' || filter === p;

  return (
    <div className="mx-auto max-w-[1520px] space-y-5 p-3.5 sm:p-6">
      {/* Top Canvas Banner + ECO 07/2026 Weight Bar */}
      <header className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/12 via-slate-900/95 to-slate-950 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/45 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-amber-300">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span>BỨC TRANH TỔNG HỢP 1 TRANG · PMP MINDSET CANVAS</span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-white">
              Hệ Quy Chiếu Ra Quyết Định Chuẩn PMI (PMBOK® 8 · ECO 07/2026 · PMA Bridge)
            </h1>
            <p className="mt-1 max-w-4xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bấm vào bất kỳ thẻ nào bên dưới để xem nhanh <b>3 ý cốt lõi + bẫy phản xạ đời thực</b>, nhảy thẳng tới Module tương ứng hoặc mở Node/Flow dẫn chứng bên PMP Mindmap.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Tất cả nguồn' },
                { id: 'pmbok8', label: 'PMBOK 8 (2025)' },
                { id: 'eco2026', label: 'ECO 07/2026' },
                { id: 'pma-bridge', label: 'PMA / Mindmap' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  filter === btn.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ECO 07/2026 vs 2021 Strip */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-violet-300">
              Tỷ trọng đề thi PMP ECO mới (Hiệu lực {canvas.eco2026.effectiveDate} · 180 câu / 240 phút · 26 Tasks)
            </span>
            <span className="text-[11px] text-slate-400">
              Đối chiếu ECO 2021 cũ trong Mindmap: People 42% · Process 50% · Business 8%
            </span>
          </div>

          <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
            {canvas.eco2026.domains.map((dom) => (
              <div key={dom.id} className="rounded-lg border border-slate-800 bg-slate-900/75 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{dom.name}</span>
                  <span className="font-mono text-xs font-extrabold text-amber-300">
                    {dom.weight2026}%{' '}
                    <span className="font-normal text-[10px] text-slate-400">
                      ({dom.tasks2026} tasks · cũ {dom.weight2021}%)
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-amber-500" style={{ width: `${dom.weight2026}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">{dom.shiftSummary}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 4-Quadrant One-Page Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* QUADRANT 1: 6 PMBOK 8 PRINCIPLES + 6 PMA REFLEXES */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Vùng 1 · 6 Nguyên Tắc PMBOK 8 &amp; 6 Phản Xạ Vàng PMA</span>
            </h2>
            <ProvenancePill kind="pmbok8" label="Standard §3.3–3.8" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {canvas.principles.filter((c) => matchFilter(c.provenance)).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all cursor-pointer',
                  TONE_CLS[item.tone]
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[10px] font-extrabold text-amber-300">{item.code}</span>
                  <span className="font-mono text-[10px] text-slate-400">{item.moduleId}</span>
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-white leading-snug">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">{item.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-sky-500/25 bg-slate-950/75 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                6 Phản xạ phòng thi cốt lõi (Core Mindset — Handout PMA)
              </span>
              <ProvenancePill kind="pma-bridge" label="core.mindset" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {canvas.pmaGoldenReflexes.map((ref) => {
                const lnk = linksMap?.[ref.linkId];
                return (
                  <div
                    key={ref.id}
                    className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-xs"
                  >
                    <div>
                      <div className="font-bold text-sky-200">{ref.title}</div>
                      <p className="mt-0.5 text-[11px] text-slate-300 leading-snug">{ref.viRule}</p>
                      <p className="mt-1 text-[10px] text-rose-300">✗ Tránh: {ref.trap}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => jumpToModule(ref.moduleId)}
                        className="font-mono text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        {ref.moduleId} →
                      </button>
                      {lnk && (
                        <a
                          href={buildMindmapUrl(lnk)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markVisited(lnk.linkId)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300 hover:text-sky-200"
                        >
                          <span>Mindmap</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* QUADRANT 2: ROLES & AUTHORITY BOUNDARIES */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Users className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>Vùng 2 · Vai Trò &amp; Ranh Giới Thẩm Quyền Bất Khả Xâm Phạm</span>
            </h2>
            <ProvenancePill kind="eco2026" label="People & Governance" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {canvas.roles.filter((c) => matchFilter(c.provenance)).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all cursor-pointer',
                  TONE_CLS[role.tone]
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[10px] font-extrabold text-emerald-300">{role.code}</span>
                  <span className="font-mono text-[10px] text-slate-400">{role.moduleId}</span>
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-white leading-snug">{role.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">{role.subtitle}</div>
              </button>
            ))}
          </div>
        </section>

        {/* QUADRANT 3: DEVELOPMENT SPECTRUM & 5 FOCUS AREAS */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <Layers className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>Vùng 3 · Phổ Cách Tiếp Cận &amp; 5 Focus Areas (PMBOK 8 §4)</span>
            </h2>
            <ProvenancePill kind="pmbok8" label="Standard §4.2 & §4.5" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {canvas.approaches.filter((c) => matchFilter(c.provenance)).map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelected(app)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all cursor-pointer',
                  TONE_CLS[app.tone]
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[10px] font-extrabold text-cyan-300">{app.code}</span>
                  <span className="font-mono text-[10px] text-slate-400">{app.moduleId}</span>
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-white leading-snug">{app.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-300 line-clamp-2">{app.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="mb-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              5 Project Management Focus Areas (Áp dụng cho cả Predictive · Agile · Hybrid)
            </div>
            <div className="space-y-1.5">
              {canvas.focusAreas.map((fa, idx) => (
                <div
                  key={fa.id}
                  className="rounded-lg border border-slate-800/90 bg-slate-900/75 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-white">
                      <span className="mr-1.5 font-mono text-amber-400">{idx + 1}.</span>
                      {fa.name} <span className="text-slate-400 font-normal">({fa.viName})</span>
                    </span>
                    <span className="text-[11px] text-amber-200">{fa.coreQuestion}</span>
                  </div>
                  <div className="mt-1 grid gap-1.5 sm:grid-cols-2 text-[11px] text-slate-300">
                    <div>
                      <b className="text-sky-300">Predictive:</b> {fa.predictiveNote}
                    </div>
                    <div>
                      <b className="text-emerald-300">Adaptive:</b> {fa.adaptiveNote}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUADRANT 4: 5-STEP SITUATIONAL DECISION CYCLE */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
              <GitBranch className="h-4 w-4 text-amber-400" aria-hidden="true" />
              <span>Vùng 4 · Chu Trình 5 Bước Xử Lý Câu Hỏi Tình Huống</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('decision')}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <span>Mở Cây quyết định</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {canvas.decisionCycle.map((dc) => (
              <div
                key={dc.step}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
              >
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-[11px] font-extrabold text-slate-950">
                    {dc.step}
                  </span>
                  <span className="text-sm">{dc.title}</span>
                </div>
                <p className="mt-1.5 text-slate-200 leading-relaxed">{dc.action}</p>
                <p className="mt-1 text-[11px] text-rose-300">✗ Bẫy cần tránh: {dc.neverDo}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs">
            <span className="text-violet-200">
              Muốn nhìn toàn bộ 14 chủ đề trong không gian vũ trụ 3 góc nhìn?
            </span>
            <a
              href={`${DEFAULT_MINDMAP_BASE_URL}/?v=panorama&lang=vi`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 font-bold text-white hover:bg-violet-400 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở Panorama bên PMP Mindmap</span>
            </a>
          </div>
        </section>
      </div>

      {/* BRIDGE MATRIX: 7 PMBOK 8 PERFORMANCE DOMAINS <-> 14 MINDMAP TOPICS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
              BẢNG BẮC CẦU TRUNG THỰC · KHÔNG NHẦM THUẬT NGỮ
            </div>
            <h2 className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-white">
              <Scale className="h-4 w-4 text-sky-400" aria-hidden="true" />
              <span>7 Performance Domains (40 Quy trình PMBOK 8) ↔ 14 Chủ đề PMP Mindmap</span>
            </h2>
          </div>
          <ProvenancePill kind="pmbok8" label="PMBOK 8 Table 2-1 (tr.9)" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-3">Miền PMBOK 8 (Số quy trình)</th>
                <th className="py-2.5 px-3">Trọng tâm trong PMBOK 8</th>
                <th className="py-2.5 px-3">Chủ đề tương ứng bên Mindmap</th>
                <th className="py-2.5 px-3">Điểm lệch / Lưu ý bắc cầu</th>
                <th className="py-2.5 pl-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {canvas.domainBridge.map((row) => {
                const lnk = linksMap?.[row.linkId];
                return (
                  <tr key={row.pmbok8Domain} className="hover:bg-slate-800/35">
                    <td className="py-3 pr-3 align-top font-bold text-white whitespace-nowrap">
                      {row.pmbok8Domain}{' '}
                      <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                        {row.pmbok8ProcessesCount} QT
                      </span>
                    </td>
                    <td className="py-3 px-3 align-top text-slate-300 leading-relaxed">{row.pmbok8KeyFocus}</td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.mindmapTopics.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-sky-500/35 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-slate-400 leading-relaxed">{row.bridgeExplanation}</td>
                    <td className="py-3 pl-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => jumpToModule(row.moduleId)}
                          className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1 font-mono text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                        >
                          {row.moduleId}
                        </button>
                        {lnk && (
                          <a
                            href={buildMindmapUrl(lnk)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markVisited(lnk.linkId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-500/50 hover:text-sky-300"
                          >
                            <span>Mở Map</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Modal for Selected Canvas Card */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-amber-400">{selected.code}</span>
                  <ProvenancePill kind={selected.provenance} label={selected.provenanceLabel} />
                </div>
                <h3 className="mt-1.5 text-lg font-extrabold text-white">{selected.title}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selected.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                3 Ý cốt lõi cần nhớ để ra quyết định
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                {selected.essence.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-200">
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-rose-300 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Bẫy phản xạ đời thực
              </div>
              <p className="leading-relaxed">{selected.realWorldTrap}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => jumpToModule(selected.moduleId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Học sâu tại Module {selected.moduleId}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selected.evidenceLinkIds.map((lid) => {
                  const lnk = linksMap?.[lid];
                  if (!lnk) return null;
                  return (
                    <div key={lid} className="inline-flex items-center gap-1">
                      <a
                        href={buildMindmapUrl(lnk)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markVisited(lnk.linkId)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{lnk.label}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(null);
                          openQuickPreview(lnk);
                        }}
                        title="Xem nhanh trên Desktop"
                        className="hidden lg:inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-2 text-slate-300 hover:border-amber-500/50 hover:text-amber-300 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <PmpTrademarkFooter />
    </div>
  );
};
