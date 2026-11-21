import React, { useEffect, useState } from 'react';
import { Check, Copy, Play, RotateCcw, Terminal } from 'lucide-react';
import type { WorkbenchLang } from '@/stores/useWorkbenchStore';
import type { RunResult } from '@/features/workpath/types';
import { pickText, type CodeTraceScene } from './types';
import { cn } from '@/utils/cn';

export interface CodeTraceStageProps {
  trace: CodeTraceScene;
  lang: WorkbenchLang;
  onRunCode?: (code: string) => Promise<RunResult>;
}

export const CodeTraceStage: React.FC<CodeTraceStageProps> = ({
  trace,
  lang,
  onRunCode,
}) => {
  const [code, setCode] = useState(trace.code);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="grid h-full min-h-0 w-full gap-3 p-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
      {/* Left: Editable & Runnable Code Card (No fake diagram!) */}
      <div className="ide-dark-surface flex min-h-[210px] flex-col overflow-hidden rounded-xl border border-[#3a332b] bg-[#1c1916] text-[#f4ede2] shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-[#312b24] bg-[#24201c] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e5534b]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#efb041]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7fc278]" />
            </span>
            <span className="font-mono text-[11px] font-bold text-[#c7bba8]">
              {pickText(trace.badge, lang)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              title="Copy"
              className="rounded-md border border-[#3d362e] bg-[#2c2722] p-1 text-[#b5aa99] hover:text-white"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            {code !== trace.code && (
              <button
                type="button"
                onClick={() => {
                  setCode(trace.code);
                  setOutput(null);
                }}
                title="Reset"
                className="rounded-md border border-[#3d362e] bg-[#2c2722] p-1 text-[#b5aa99] hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {onRunCode && (
              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#211e1b] bg-[#cfe3b2] px-2.5 py-1 font-mono text-[11px] font-extrabold text-[#1d2b14] shadow-[1px_1.5px_0_#110f0c] hover:bg-[#dcecc4] disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>
                  {running
                    ? lang === 'en'
                      ? 'Running…'
                      : 'Đang chạy…'
                    : lang === 'en'
                      ? 'Run Live'
                      : 'Chạy thử'}
                </span>
              </button>
            )}
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          aria-label="Interactive snippet editor"
          className="min-h-0 flex-1 resize-none bg-transparent p-3.5 font-mono text-[12.5px] leading-[1.65] text-[#f4ede2] outline-none"
        />

        {output && (
          <div className="max-h-28 overflow-y-auto border-t border-[#312b24] bg-[#141210] px-3.5 py-2 font-mono text-xs">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9a8f7e]">
              <Terminal className="h-3 w-3" />
              <span>stdout · {output.ms} ms</span>
            </div>
            {output.stdout && (
              <pre className="whitespace-pre-wrap text-[#a8e686]">{output.stdout}</pre>
            )}
            {output.stderr && (
              <pre className="whitespace-pre-wrap text-[#fda4af]">{output.stderr}</pre>
            )}
            {!output.stdout && !output.stderr && (
              <span className="text-[#8f8473]">
                {lang === 'en'
                  ? '✔ Executed cleanly (no printed output — add print(...) to inspect values).'
                  : '✔ Chạy thành công (chưa có lệnh print — thêm print(...) để xem kết quả).'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Crisp Step-by-Step Trace / Evaluation Table */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-3.5">
        <div className="mb-2.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--dts-ink-muted)]">
          {pickText(trace.traceTitle, lang)}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-0.5">
          {trace.rows.map((row, idx) => {
            const pillCls =
              row.tone === 'ok'
                ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)] border-[var(--dts-border)]'
                : row.tone === 'bad'
                  ? 'bg-[var(--dts-rose-bg)] text-[var(--dts-rose-ink)] border-[#c93b32]'
                  : row.tone === 'warn'
                    ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] border-[var(--dts-border)]'
                    : 'bg-[var(--dts-panel-muted)] text-[var(--dts-ink)] border-[var(--dts-line-strong)]';

            return (
              <div
                key={idx}
                className="flex flex-col gap-1 rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--dts-ink-muted)]">
                    {row.step}
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 font-mono text-[11px] font-extrabold',
                      pillCls
                    )}
                  >
                    {pickText(row.result, lang)}
                  </span>
                </div>
                <code className="font-mono text-[12px] font-semibold text-[var(--dts-ink)] break-words">
                  {pickText(row.expr, lang)}
                </code>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
