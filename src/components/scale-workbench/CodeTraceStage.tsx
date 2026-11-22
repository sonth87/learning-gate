import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWorkbenchStore, type WorkbenchLang } from '@/stores/useWorkbenchStore';
import type { RunResult } from '@/features/workpath/types';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { WorkbenchCodeSurface } from './WorkbenchCodeSurface';
import { pickText, type CodeTraceScene } from './types';
import { cn } from '@/utils/cn';

export interface CodeTraceStageProps {
  trace: CodeTraceScene;
  lang: WorkbenchLang;
  onRunCode?: (code: string) => Promise<RunResult>;
}

function looksLikeCodeExpr(str: string): boolean {
  return /[()[\]{}=:'"+*/<>]|^\s*(def|class|if|for|while|import|from|return|SET|GET|HSET|ZADD|FROM|RUN|COPY|kubectl|docker)\b/.test(
    str
  );
}

export const CodeTraceStage: React.FC<CodeTraceStageProps> = ({
  trace,
  lang,
  onRunCode,
}) => {
  const [code, setCode] = useState(trace.code);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const { isCollapsed, toggleCollapsed, workbenchTheme } = useWorkbenchStore(
    useShallow((s) => ({
      isCollapsed: s.isCodeTraceCollapsed,
      toggleCollapsed: s.toggleCodeTraceCollapsed,
      workbenchTheme: s.workbenchTheme,
    }))
  );
  const isWorkbenchLight = workbenchTheme === 'light';

  useEffect(() => {
    setCode(trace.code);
    setOutput(null);
  }, [trace.code]);

  const handleRun = async () => {
    if (!onRunCode || running) return;
    setRunning(true);
    try {
      const res = await onRunCode(code);
      setOutput(res);
    } finally {
      setRunning(false);
    }
  };

  const rawBadge = pickText(trace.badge, lang).replace(/\s*\(Không cần vẽ sơ đồ\)/i, '');

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2.5 p-0.5 lg:flex-row">
      {/* Left: Syntax-Highlighted, Themeable & Runnable IDE Surface */}
      <WorkbenchCodeSurface
        code={code}
        defaultCode={trace.code}
        onChange={setCode}
        onRun={onRunCode ? handleRun : undefined}
        running={running}
        output={output}
        onReset={() => {
          setCode(trace.code);
          setOutput(null);
        }}
        titleBadge={rawBadge}
        lang={lang}
        className="min-h-[210px] min-w-0 flex-1"
      />

      {/* Right: Collapsible & Spacious Step-by-Step Quick Analysis Panel */}
      {isCollapsed ? (
        <>
          {/* Desktop Collapsed Slim Vertical Rail */}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={
              lang === 'en'
                ? 'Expand Quick Analysis panel'
                : 'Mở rộng Bảng phân tích nhanh'
            }
            aria-label={
              lang === 'en'
                ? 'Expand Quick Analysis panel'
                : 'Mở rộng Bảng phân tích nhanh'
            }
            className="dts-btn-tactile hidden lg:flex w-[42px] shrink-0 flex-col items-center justify-between rounded-xl bg-[var(--dts-panel-elevated)] py-3 text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)] cursor-pointer"
          >
            <PanelRightOpen className="h-4 w-4 shrink-0 text-[var(--dts-ink-soft)]" />
            <span
              style={{ writingMode: 'vertical-rl' }}
              className="rotate-180 font-mono text-[10px] font-extrabold uppercase tracking-widest text-[var(--dts-ink-muted)] select-none"
            >
              {lang === 'en' ? 'QUICK TRACE' : 'PHÂN TÍCH NHANH'}
            </span>
            <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-full border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] px-1 font-mono text-[10px] font-extrabold text-[var(--dts-amber-ink)]">
              {trace.rows.length}
            </span>
          </button>

          {/* Compact Narrow-Viewport Collapsed Bar */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="dts-btn-tactile flex lg:hidden shrink-0 items-center justify-between gap-2 rounded-xl bg-[var(--dts-panel-elevated)] px-3 py-2 font-mono text-[11px] font-extrabold text-[var(--dts-ink)] cursor-pointer"
          >
            <span className="truncate">
              {lang === 'en' ? 'Quick Analysis' : 'Bảng phân tích nhanh'}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[var(--dts-ink-muted)]">
              <span className="rounded-full border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] px-1.5 py-0.2 text-[10px] text-[var(--dts-amber-ink)]">
                {trace.rows.length}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
          </button>
        </>
      ) : (
        <div
          title={pickText(trace.traceTitle, lang)}
          className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3 lg:w-[44%] lg:max-w-[392px] lg:min-w-[272px]"
        >
          {/* Clean 1-Line Panel Header */}
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink)]">
                {lang === 'en' ? 'Quick Analysis' : 'Bảng phân tích nhanh'}
              </span>
              <span className="inline-flex h-4.5 min-w-[20px] shrink-0 items-center justify-center rounded-full border border-[var(--dts-line-strong)] bg-[var(--dts-panel-muted)] px-1.5 font-mono text-[10px] font-extrabold text-[var(--dts-ink-soft)]">
                {trace.rows.length}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleCollapsed}
              title={
                lang === 'en'
                  ? 'Collapse Quick Analysis panel'
                  : 'Thu gọn Bảng phân tích nhanh'
              }
              aria-label={
                lang === 'en'
                  ? 'Collapse Quick Analysis panel'
                  : 'Thu gọn Bảng phân tích nhanh'
              }
              className="inline-flex h-6 items-center gap-1 rounded-lg border border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2 font-mono text-[10px] font-bold text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)] cursor-pointer shrink-0"
            >
              <span>{lang === 'en' ? 'Hide' : 'Thu gọn'}</span>
              <PanelRightClose className="hidden lg:block h-3 w-3" />
              <ChevronUp className="lg:hidden h-3 w-3" />
            </button>
          </div>

          {/* Spacious Full-Width Cards (Code never shares horizontal row with tag pill!) */}
          <div className="min-h-0 flex-1 overflow-y-auto space-y-2.5 pr-0.5">
            {trace.rows.map((row, idx) => {
              const pillCls =
                row.tone === 'ok'
                  ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border)]'
                  : row.tone === 'bad'
                    ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] border-[#c93b32]'
                    : row.tone === 'warn'
                      ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] border-[var(--dts-border)]'
                      : 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink)] border-[var(--dts-line-strong)]';

              const stepIsCode = looksLikeCodeExpr(row.step);
              const exprText = pickText(row.expr, lang);
              const exprIsCode = !stepIsCode && looksLikeCodeExpr(exprText);

              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] p-3"
                >
                  {/* Row 1: Compact Index / Label + Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                      {stepIsCode ? `#${idx + 1}` : row.step}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] font-extrabold leading-tight',
                        pillCls
                      )}
                    >
                      {pickText(row.result, lang)}
                    </span>
                  </div>

                  {/* Row 2 (if step is code): Full-Width Syntax-Highlighted Code Box without Scrollbar */}
                  {stepIsCode && (
                    <code className="block w-full rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] px-2.5 py-1.5 font-mono text-[11.5px] font-semibold leading-relaxed whitespace-pre-wrap break-words text-[var(--dts-ink)]">
                      {renderHighlightedPython(row.step, isWorkbenchLight)}
                    </code>
                  )}

                  {/* Row 3: Explanation / Evaluated Value */}
                  {exprIsCode ? (
                    <code className="block w-full rounded-lg border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] px-2.5 py-1.5 font-mono text-[11.5px] font-semibold leading-relaxed whitespace-pre-wrap break-words text-[var(--dts-ink)]">
                      {renderHighlightedPython(exprText, isWorkbenchLight)}
                    </code>
                  ) : (
                    <p className="text-[12.5px] font-medium leading-relaxed text-[var(--dts-ink)] break-words">
                      {exprText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
