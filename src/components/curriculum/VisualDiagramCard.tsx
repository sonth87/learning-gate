import React, { useState } from 'react';
import {
  Workflow,
  ArrowRight,
  ArrowDown,
  GitCommitHorizontal,
  Layers,
  Info,
  MousePointerClick,
  BookmarkCheck,
} from 'lucide-react';
import { LessonDiagram } from '@/types/curriculum.types';
import { RichTextWithTerms } from '@/components/common/RichTextWithTerms';
import { cn } from '@/utils/cn';

const NODE_COLOR_STYLES = {
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'text-amber-300',
  },
  sky: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    title: 'text-sky-300',
  },
  emerald: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    title: 'text-emerald-300',
  },
  violet: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    title: 'text-violet-300',
  },
  rose: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    title: 'text-rose-300',
  },
};

export const VisualDiagramCard: React.FC<{ diagrams?: LessonDiagram[] }> = ({
  diagrams,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<Record<string, string>>(
    {}
  );

  if (!diagrams || diagrams.length === 0) return null;

  return (
    <section id="sec-diagrams" className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-2">
        <Workflow className="h-5 w-5 text-sky-400" aria-hidden="true" />
        <h2 className="text-base font-bold text-white">
          Sơ đồ Luồng Hoạt động & Minh họa Trực quan
        </h2>
      </div>

      <div className="space-y-5">
        {diagrams.map((diagram) => {
          const activeId =
            selectedNodeId[diagram.id] || diagram.nodes[0]?.id || '';
          const activeNode =
            diagram.nodes.find((n) => n.id === activeId) || diagram.nodes[0];

          return (
            <div
              key={diagram.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
            >
              {/* Diagram Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    {diagram.type === 'pipeline' && 'Sơ đồ Luồng Xử lý (Pipeline Flow)'}
                    {diagram.type === 'version-timeline' &&
                      'Dòng Thời gian & Sự Khác biệt Phiên bản'}
                    {diagram.type === 'comparison-boxes' &&
                      'Sơ đồ Đối chiếu Cấu trúc'}
                    {diagram.type === 'architecture-layers' &&
                      'Sơ đồ Phân tầng Kiến trúc'}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {diagram.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {diagram.subtitle}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  <MousePointerClick className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Chọn từng khối để xem giải thích sâu</span>
                </span>
              </div>

              {/* 1. PIPELINE FLOW LAYOUT */}
              {diagram.type === 'pipeline' && (
                <div className="grid gap-3 md:grid-cols-4 items-stretch">
                  {diagram.nodes.map((node, idx) => {
                    const color =
                      NODE_COLOR_STYLES[node.highlightColor || 'sky'];
                    const isSelected = node.id === activeNode?.id;

                    return (
                      <div key={node.id} className="relative flex flex-col">
                        <button
                          onClick={() =>
                            setSelectedNodeId((prev) => ({
                              ...prev,
                              [diagram.id]: node.id,
                            }))
                          }
                          className={cn(
                            'flex-1 rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between space-y-2',
                            color.border,
                            color.bg,
                            isSelected
                              ? 'ring-2 ring-emerald-400/80 shadow-sm'
                              : 'opacity-80 hover:opacity-100'
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                                  color.badge
                                )}
                              >
                                {node.badge || `Bước ${idx + 1}`}
                              </span>
                              {idx < diagram.nodes.length - 1 && (
                                <ArrowRight
                                  className="hidden md:block h-4 w-4 text-slate-400"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <h4
                              className={cn(
                                'text-xs font-bold',
                                color.title
                              )}
                            >
                              {node.title}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-200">
                              {node.subtitle}
                            </p>
                          </div>
                        </button>
                        {idx < diagram.nodes.length - 1 && (
                          <div className="flex md:hidden justify-center py-1">
                            <ArrowDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. VERSION TIMELINE LAYOUT */}
              {diagram.type === 'version-timeline' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {diagram.nodes.map((node) => {
                    const color =
                      NODE_COLOR_STYLES[node.highlightColor || 'emerald'];
                    const isSelected = node.id === activeNode?.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() =>
                          setSelectedNodeId((prev) => ({
                            ...prev,
                            [diagram.id]: node.id,
                          }))
                        }
                        className={cn(
                          'rounded-xl border p-3.5 text-left transition-all space-y-1.5',
                          color.border,
                          color.bg,
                          isSelected
                            ? 'ring-2 ring-emerald-400/80 shadow-sm'
                            : 'opacity-80 hover:opacity-100'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] font-bold',
                              color.badge
                            )}
                          >
                            <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                            {node.badge}
                          </span>
                        </div>
                        <h4 className={cn('text-xs font-bold', color.title)}>
                          {node.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 line-clamp-2">
                          {node.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. COMPARISON BOXES LAYOUT */}
              {diagram.type === 'comparison-boxes' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {diagram.nodes.map((node, idx) => {
                    const color =
                      NODE_COLOR_STYLES[node.highlightColor || 'violet'];
                    const isSelected = node.id === activeNode?.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() =>
                          setSelectedNodeId((prev) => ({
                            ...prev,
                            [diagram.id]: node.id,
                          }))
                        }
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer',
                          color.border,
                          color.bg,
                          isSelected
                            ? 'ring-2 ring-emerald-400 shadow-md scale-[1.01]'
                            : 'opacity-85 hover:opacity-100 hover:border-slate-600'
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold',
                                color.badge
                              )}
                            >
                              {node.badge || `Lựa chọn #${idx + 1}`}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              #{idx + 1}
                            </span>
                          </div>

                          <h4 className={cn('text-sm font-bold leading-snug', color.title)}>
                            {node.title}
                          </h4>

                          <p className="text-xs text-slate-300 font-mono leading-relaxed">
                            {node.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. ARCHITECTURE LAYERS LAYOUT */}
              {diagram.type === 'architecture-layers' && (
                <div className="flex flex-col gap-2.5">
                  {diagram.nodes.map((node, idx) => {
                    const color =
                      NODE_COLOR_STYLES[node.highlightColor || 'violet'];
                    const isSelected = node.id === activeNode?.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() =>
                          setSelectedNodeId((prev) => ({
                            ...prev,
                            [diagram.id]: node.id,
                          }))
                        }
                        className={cn(
                          'w-full rounded-xl border p-3.5 text-left transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 cursor-pointer',
                          color.border,
                          color.bg,
                          isSelected
                            ? 'ring-2 ring-emerald-400 shadow-md'
                            : 'opacity-85 hover:opacity-100'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                          <span
                            className={cn(
                              'shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold',
                              color.badge
                            )}
                          >
                            {node.badge || `Tầng ${idx + 1}`}
                          </span>
                          <h4 className={cn('text-xs sm:text-sm font-bold truncate', color.title)}>
                            {node.title}
                          </h4>
                        </div>
                        <span className="font-mono text-xs text-slate-300 shrink-0">
                          {node.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Node Detailed Inspector Panel */}
              {activeNode && (
                <div className="rounded-xl border border-emerald-500/30 bg-slate-950/90 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Giải thích chi tiết khối [{activeNode.badge || activeNode.title}]:{' '}
                      {activeNode.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-6">
                    <RichTextWithTerms text={activeNode.detail} />
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-800/70 pt-2.5">
                <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                <span>
                  <RichTextWithTerms text={diagram.caption} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
