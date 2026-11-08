import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Code2,
  Copy,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Layers,
  LayoutList,
  Filter,
  Play,
} from 'lucide-react';
import {
  PYTHON_ORG_HERO_SLIDES,
  QUICK_SYNTAX_CATEGORIES,
  QUICK_SYNTAX_DECLARATIONS,
  QuickSyntaxCategoryId,
  QuickSyntaxDeclarationItem,
} from '@/data/glossary/quickSyntaxDeclarationsData';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { cn } from '@/utils/cn';

const DeclarationDetailCard: React.FC<{
  item: QuickSyntaxDeclarationItem;
  showJsTsComparison: boolean;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}> = ({ item, showJsTsComparison, index, total, onPrev, onNext }) => {
  const [copiedExample, setCopiedExample] = useState(false);
  const [copiedFormIdx, setCopiedFormIdx] = useState<number | null>(null);

  const handleCopyExample = () => {
    navigator.clipboard.writeText(item.codeExample);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 1600);
  };

  const handleCopyForm = (idx: number, syntax: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedFormIdx(idx);
    setTimeout(() => setCopiedFormIdx(null), 1400);
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 overflow-hidden shadow-2xl">
      {/* Top Gradient Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-sky-500" />

      {/* Header */}
      <div className="border-b border-slate-800/90 bg-slate-950/70 p-4 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 font-mono text-xs font-extrabold text-emerald-300">
              {item.categoryLabel}
            </span>
            <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 font-mono text-xs font-bold text-amber-300">
              {item.badge}
            </span>
          </div>

          {typeof index === 'number' && typeof total === 'number' && total > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-slate-400 mr-1">
                {index + 1} / {total}
              </span>
              {onPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Chủ đề trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Chủ đề tiếp theo"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-xl font-extrabold text-white leading-snug">
            {item.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {item.summary}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* 1. All Declaration Forms & Variants Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Layers className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Tất cả các cách Khai báo & Cú pháp sử dụng:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.declarationForms.map((form, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3.5 flex flex-col justify-between space-y-2.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300">
                      {form.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyForm(idx, form.syntax)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white cursor-pointer shrink-0"
                    >
                      {copiedFormIdx === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-300">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="ide-dark-surface rounded-xl border border-slate-800/90 bg-[#090d16] p-3 font-mono text-xs leading-5 overflow-x-auto select-text">
                    <code>{renderHighlightedPython(form.syntax, false)}</code>
                  </pre>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed border-t border-slate-800/70 pt-2">
                  💡 {form.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Complete Runnable Code Example + Simulated Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden flex flex-col shadow-inner">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/90 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <Code2 className="h-4 w-4 text-emerald-400 ml-1" />
                <span>Ví dụ Thực hành Tổng hợp</span>
              </div>
              <button
                type="button"
                onClick={handleCopyExample}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 cursor-pointer"
              >
                {copiedExample ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Đã copy</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="ide-dark-surface flex-1 p-4 font-mono text-xs leading-6 overflow-x-auto select-text">
              <code>{renderHighlightedPython(item.codeExample, false)}</code>
            </pre>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-slate-950/90 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Terminal className="h-4 w-4 shrink-0" />
                <span>Kết quả in ra màn hình (Output)</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                stdout
              </span>
            </div>
            <pre className="flex-1 p-4 font-mono text-xs leading-6 text-emerald-300 overflow-x-auto whitespace-pre-wrap select-text">
              {item.output}
            </pre>
          </div>
        </div>

        {/* 3. Details, Rules & Common Gotchas */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Lưu ý Quan trọng & Cạm bẫy cần tránh:</span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {item.detailsAndGotchas.map((pt, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. Conditional JS/TS Equivalent */}
        {showJsTsComparison && (
          <div className="rounded-2xl border border-cyan-500/35 bg-cyan-950/20 p-4 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-cyan-300">
              <ArrowRightLeft className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Đối chiếu bên JavaScript / TypeScript:</span>
            </div>
            <code className="block rounded-xl bg-slate-950 border border-cyan-500/30 px-3 py-2 font-mono text-xs text-cyan-200 overflow-x-auto">
              {item.jsEquivalent.syntax}
            </code>
            <p className="text-xs text-slate-300 leading-relaxed">
              {item.jsEquivalent.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const PythonQuickSyntaxGuide: React.FC = () => {
  const { showJsTsComparison, toggleJsTsComparison } = useSettingsStore();

  // Top python.org Interactive Carousel State
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [codeStyle, setCodeStyle] = useState<'repl' | 'script'>('repl');
  const [copiedSlide, setCopiedSlide] = useState(false);

  // 9-Category Declaration Explorer State
  const [selectedCategory, setSelectedCategory] =
    useState<QuickSyntaxCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    QUICK_SYNTAX_DECLARATIONS[0].id
  );
  const [expandAllMode, setExpandAllMode] = useState(true);
  const [isMobileDirectoryOpen, setIsMobileDirectoryOpen] = useState(false);

  const activeSlide =
    PYTHON_ORG_HERO_SLIDES[activeSlideIdx] || PYTHON_ORG_HERO_SLIDES[0];

  const handleCopySlide = () => {
    const text =
      codeStyle === 'repl'
        ? activeSlide.replCode
        : activeSlide.cleanScriptCode;
    navigator.clipboard.writeText(text);
    setCopiedSlide(true);
    setTimeout(() => setCopiedSlide(false), 1600);
  };

  const filteredDeclarations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return QUICK_SYNTAX_DECLARATIONS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        const matchCode = item.codeExample.toLowerCase().includes(q);
        const matchForms = item.declarationForms.some(
          (f) =>
            f.label.toLowerCase().includes(q) ||
            f.syntax.toLowerCase().includes(q) ||
            f.note.toLowerCase().includes(q)
        );
        return matchTitle || matchSummary || matchCode || matchForms;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const activeItemIndex = useMemo(() => {
    const idx = filteredDeclarations.findIndex((d) => d.id === selectedItemId);
    return idx >= 0 ? idx : 0;
  }, [filteredDeclarations, selectedItemId]);

  const activeItem = filteredDeclarations[activeItemIndex];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          PART 1: "QUICK & EASY TO LEARN" INTERACTIVE SHOWCASE (python.org style)
         ===================================================================== */}
      <div className="rounded-3xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Quick & Easy to Learn • Phong cách trang chủ python.org</span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-white">
              Làm quen Cú pháp Python trong 5 Phút qua 5 Đoạn Code Kinh Điển
            </h2>
            <p className="text-xs text-slate-300">
              Bấm chọn từng thẻ (1 → 5) để xem cách Python in Unicode, nhập dữ liệu, viết hàm Fibonacci, biến đổi mảng với List Comprehension và tạo Object.
            </p>
          </div>

          {/* Slide Number Pills (1..5) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
            {PYTHON_ORG_HERO_SLIDES.map((s, idx) => {
              const active = idx === activeSlideIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0',
                    active
                      ? 'border-amber-400 bg-amber-400 text-[#020617] shadow-md'
                      : 'border-slate-700 bg-slate-900/90 text-slate-300 hover:border-slate-600 hover:text-white'
                  )}
                >
                  <span className="font-mono">#{s.slideNumber}</span>
                  <span className="hidden sm:inline">
                    {s.slideNumber === 1 && 'In & Nhập (I/O)'}
                    {s.slideNumber === 2 && 'Hàm & Fibonacci'}
                    {s.slideNumber === 3 && 'List & enumerate'}
                    {s.slideNumber === 4 && 'Toán tử / // **'}
                    {s.slideNumber === 5 && 'Dict & Dataclass'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Slide Terminal + Explanation Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left 7 cols: Interactive REPL / Script Window */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden flex flex-col shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-3.5 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-xs font-extrabold text-amber-300 truncate">
                  #{activeSlide.slideNumber}. {activeSlide.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {/* Switch between python.org >>> REPL view and clean .py file view */}
                <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCodeStyle('repl')}
                    className={cn(
                      'rounded-md px-2 py-0.5 transition-colors cursor-pointer',
                      codeStyle === 'repl'
                        ? 'bg-amber-400 text-[#020617]'
                        : 'text-slate-400 hover:text-white'
                    )}
                    title="Hiển thị dấu nhắc >>> giống trang chủ python.org"
                  >
                    &gt;&gt;&gt; REPL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeStyle('script')}
                    className={cn(
                      'rounded-md px-2 py-0.5 transition-colors cursor-pointer',
                      codeStyle === 'script'
                        ? 'bg-emerald-400 text-[#020617]'
                        : 'text-slate-400 hover:text-white'
                    )}
                    title="Hiển thị dạng file .py sạch để copy chạy ngay"
                  >
                    File .py
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySlide}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 cursor-pointer"
                >
                  {copiedSlide ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <pre className="ide-dark-surface flex-1 p-4 font-mono text-xs sm:text-[13px] leading-6 overflow-x-auto select-text">
              <code>
                {renderHighlightedPython(
                  codeStyle === 'repl'
                    ? activeSlide.replCode
                    : activeSlide.cleanScriptCode,
                  false
                )}
              </code>
            </pre>

            {codeStyle === 'script' && (
              <div className="border-t border-slate-800/90 bg-slate-950/90 px-4 py-2.5 font-mono text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Play className="h-3 w-3 fill-current" />
                  <span>Kết quả khi chạy file (Output):</span>
                </div>
                <pre className="text-emerald-300 whitespace-pre-wrap">
                  {activeSlide.output}
                </pre>
              </div>
            )}
          </div>

          {/* Right 5 cols: Point-by-Point Breakdown & Prev/Next Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-slate-900/90 p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-300">
                {activeSlide.subtitle}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Giải thích chi tiết từng dòng:
                </div>
                <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                  {activeSlide.explanationPoints.map((pt, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5"
                    >
                      <span className="font-mono text-[11px] font-extrabold text-amber-400 shrink-0">
                        0{i + 1}.
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {showJsTsComparison && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200 leading-relaxed">
                  <strong className="text-cyan-300 block mb-0.5">
                    ⇄ Đối chiếu bên JS/TS:
                  </strong>
                  {activeSlide.jsComparison}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() =>
                  setActiveSlideIdx(
                    (prev) =>
                      (prev - 1 + PYTHON_ORG_HERO_SLIDES.length) %
                      PYTHON_ORG_HERO_SLIDES.length
                  )
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Ví dụ trước</span>
              </button>

              <span className="font-mono text-xs font-bold text-slate-400">
                Slide {activeSlide.slideNumber} / {PYTHON_ORG_HERO_SLIDES.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setActiveSlideIdx(
                    (prev) => (prev + 1) % PYTHON_ORG_HERO_SLIDES.length
                  )
                }
                className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-extrabold text-[#020617] hover:bg-amber-300 cursor-pointer"
              >
                <span>Ví dụ tiếp</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PART 2: ALL DECLARATIONS & OPERATIONS BY CATEGORY (9 Core Categories)
         ===================================================================== */}
      <div className="space-y-4">
        {/* Category Filter Bar & Search Controls */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-4 space-y-3.5 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-lg font-extrabold text-white">
                Bảng Tra cứu Toàn bộ Cách Khai báo & Thao tác trong Python (9 Nhóm Cốt lõi)
              </h2>
              <p className="text-xs text-slate-400">
                Xem chi tiết mọi cách khai báo biến, ép kiểu, toán tử, điều kiện, vòng lặp, hàm (`def`/`lambda`), mảng (`list`/`tuple`/`set`) và object (`dict`/`dataclass`/`class`).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleJsTsComparison}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                  showJsTsComparison
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                )}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>So sánh JS/TS: {showJsTsComparison ? 'BẬT' : 'TẮT'}</span>
              </button>

              <button
                type="button"
                onClick={() => setExpandAllMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>
                  {expandAllMode
                    ? 'Đang trải toàn bộ (Bấm để xem từng mục)'
                    : 'Trải toàn bộ trên 1 trang'}
                </span>
              </button>
            </div>
          </div>

          {/* Search + Horizontal Scrollable Category Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative sm:w-72 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm: ép kiểu, for, enumerate, def, dict, class..."
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

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
              {QUICK_SYNTAX_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      const firstMatch = QUICK_SYNTAX_DECLARATIONS.find(
                        (d) => cat.id === 'all' || d.category === cat.id
                      );
                      if (firstMatch) setSelectedItemId(firstMatch.id);
                    }}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0',
                      active
                        ? 'border-emerald-500 bg-emerald-500 text-[#020617] shadow-sm'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white'
                    )}
                  >
                    {cat.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Display Either Full Expanded Cheat-Sheet OR 2-Column Studio View */}
        {filteredDeclarations.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center space-y-3">
            <p className="text-sm font-bold text-slate-200">
              Không tìm thấy mục khai báo nào khớp với từ khóa &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-[#020617] cursor-pointer"
            >
              Xem toàn bộ {QUICK_SYNTAX_DECLARATIONS.length} chuyên đề khai báo
            </button>
          </div>
        ) : expandAllMode ? (
          <div className="space-y-6">
            {filteredDeclarations.map((item, idx) => (
              <DeclarationDetailCard
                key={item.id}
                item={item}
                showJsTsComparison={showJsTsComparison}
                index={idx}
                total={filteredDeclarations.length}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile & Tablet Quick Item Selector Bar (< lg) */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800/90 bg-slate-900/90 px-3.5 py-2.5 lg:hidden">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-xs font-extrabold text-emerald-300 truncate">
                  {activeItem?.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDirectoryOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 shrink-0"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>
                  {isMobileDirectoryOpen
                    ? 'Đóng Danh mục'
                    : `Chọn Chủ đề (${filteredDeclarations.length})`}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <aside
                className={cn(
                  'lg:col-span-4 rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3.5 space-y-2 shadow-lg',
                  !isMobileDirectoryOpen && 'hidden lg:block'
                )}
              >
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 px-1 pb-1">
                  Danh mục Khai báo ({filteredDeclarations.length})
                </div>
                {filteredDeclarations.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setIsMobileDirectoryOpen(false);
                      }}
                      className={cn(
                        'w-full flex flex-col gap-1 rounded-xl border p-3 text-left transition-all cursor-pointer',
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-white'
                          : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      )}
                    >
                      <span className="font-mono text-[10px] font-bold text-emerald-400">
                        {item.categoryLabel}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.title}
                      </span>
                    </button>
                  );
                })}
              </aside>

              <div className="lg:col-span-8">
                {activeItem && (
                  <DeclarationDetailCard
                    item={activeItem}
                    showJsTsComparison={showJsTsComparison}
                    index={activeItemIndex}
                    total={filteredDeclarations.length}
                    onPrev={() => {
                      const prevIdx =
                        (activeItemIndex - 1 + filteredDeclarations.length) %
                        filteredDeclarations.length;
                      setSelectedItemId(filteredDeclarations[prevIdx].id);
                    }}
                    onNext={() => {
                      const nextIdx =
                        (activeItemIndex + 1) % filteredDeclarations.length;
                      setSelectedItemId(filteredDeclarations[nextIdx].id);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
