import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Terminal,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { PracticeExercise, VerificationResult } from '@/types/practice.types';
import { verifyExerciseCode } from '@/utils/codeVerifier';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';

export const CodeWorkspace: React.FC<{ exercise: PracticeExercise }> = ({
  exercise,
}) => {
  const { submissions, saveExerciseSubmission } = useUserDataStore();
  const savedRecord = submissions[exercise.id];

  const [code, setCode] = useState(savedRecord?.code || exercise.starterCode);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = submissions[exercise.id];
    setCode(existing?.code || exercise.starterCode);
    setResult(null);
    setCursorPos({ line: 1, col: 1 });
  }, [exercise.id, exercise.starterCode, submissions]);

  const handleRunTests = async () => {
    const res = verifyExerciseCode(exercise, code);
    setResult(res);
    await saveExerciseSubmission(exercise.id, code, res.allPassed);
  };

  const handleReset = () => {
    setCode(exercise.starterCode);
    setResult(null);
  };

  const handleFillSolution = () => {
    setCode(exercise.solutionCode);
    const res = verifyExerciseCode(exercise, exercise.solutionCode);
    setResult(res);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const updateCursorMetrics = (el: HTMLTextAreaElement) => {
    const pos = el.selectionStart || 0;
    const textBefore = el.value.slice(0, pos);
    const linesBefore = textBefore.split('\n');
    setCursorPos({
      line: linesBefore.length,
      col: linesBefore[linesBefore.length - 1].length + 1,
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;

    // Ctrl/Cmd + Enter -> Run Tests
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunTests();
      return;
    }

    // Tab / Shift+Tab -> Indent / Unindent by 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const linePrefix = value.slice(lineStart, selectionStart);
        const removeCount = linePrefix.match(/^ {1,4}/)?.[0].length || 0;
        if (removeCount > 0) {
          const nextValue =
            value.slice(0, lineStart) +
            value.slice(lineStart + removeCount);
          setCode(nextValue);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = Math.max(
              lineStart,
              selectionStart - removeCount
            );
            updateCursorMetrics(el);
          });
        }
      } else {
        const spaces = '    ';
        const nextValue =
          value.slice(0, selectionStart) +
          spaces +
          value.slice(selectionEnd);
        setCode(nextValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = selectionStart + spaces.length;
          updateCursorMetrics(el);
        });
      }
      return;
    }

    // Enter -> Auto-indent (and +4 spaces after ':')
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLineBeforeCursor = value.slice(lineStart, selectionStart);
      const baseIndent = currentLineBeforeCursor.match(/^\s*/)?.[0] || '';
      const trimmedBefore = currentLineBeforeCursor.trimEnd();
      const extraIndent = trimmedBefore.endsWith(':') ? '    ' : '';
      const insertion = '\n' + baseIndent + extraIndent;

      const nextValue =
        value.slice(0, selectionStart) +
        insertion +
        value.slice(selectionEnd);
      setCode(nextValue);
      requestAnimationFrame(() => {
        const nextPos = selectionStart + insertion.length;
        el.selectionStart = el.selectionEnd = nextPos;
        updateCursorMetrics(el);
      });
    }
  };

  const lines = code.split('\n');
  const lineCount = lines.length;
  const displayLineCount = Math.max(lineCount, 14);
  const editorHeightPx = Math.min(Math.max(displayLineCount * 24 + 32, 340), 540);

  return (
    <div className="space-y-4">
      {/* IDE Editor Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        {/* IDE Top Tab & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-3.5 py-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-300">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>solution.py</span>
            </div>

            {savedRecord?.passed && (
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                ✓ Đã giải
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              title="Sao chép code"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              title="Khôi phục code khởi tạo ban đầu"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleFillSolution}
              title="Điền lời giải chuẩn Pythonic vào trình soạn thảo"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lời giải mẫu</span>
            </button>

            <button
              onClick={handleRunTests}
              title="Chạy kiểm thử (Ctrl/Cmd + Enter)"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Chạy & Chấm bài</span>
            </button>
          </div>
        </div>

        {/* Syntax-Highlighted Overlay Code Editor */}
        <div
          className="ide-dark-surface relative flex bg-[#090d16] font-mono text-[13px] leading-6"
          style={{ height: `${editorHeightPx}px` }}
        >
          {/* Line Numbers Gutter */}
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="select-none overflow-hidden border-r border-slate-800/80 bg-slate-900/60 py-4 px-2.5 text-right font-mono text-[12px] leading-6 text-slate-600 shrink-0 w-11"
          >
            {Array.from({ length: displayLineCount }).map((_, i) => {
              const ln = i + 1;
              const isCurrent = ln === cursorPos.line;
              return (
                <div
                  key={ln}
                  className={
                    isCurrent
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-600'
                  }
                >
                  {ln}
                </div>
              );
            })}
          </div>

          {/* Synchronized Highlight Layer + Transparent Editable Textarea */}
          <div className="relative flex-1 overflow-hidden">
            <pre
              ref={preRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-4 font-mono text-[13px] leading-6 whitespace-pre tab-size-4"
            >
              <code>
                {renderHighlightedPython(code)}
                {code.endsWith('\n') ? ' ' : ''}
              </code>
            </pre>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                updateCursorMetrics(e.target);
              }}
              onClick={(e) => updateCursorMetrics(e.currentTarget)}
              onKeyUp={(e) => updateCursorMetrics(e.currentTarget)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Trình soạn thảo code Python"
              className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 whitespace-pre text-transparent caret-emerald-400 selection:bg-emerald-500/25 focus:outline-none tab-size-4"
            />
          </div>
        </div>

        {/* IDE Bottom Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/90 bg-slate-900/90 px-3.5 py-1.5 font-mono text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Spaces: 4</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden md:inline text-emerald-400/90">
              Phím tắt: Tab (Thụt lề) • Ctrl/⌘ + Enter (Chạy Test)
            </span>
          </div>

          {/* Syntax Color Mini Legend */}
          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-purple-300">Keyword</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              <span className="text-sky-300">Function</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              <span className="text-cyan-300">Builtin</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              <span className="text-amber-300">String</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-pink-400" />
              <span className="text-pink-300">Operator</span>
            </span>
          </div>
        </div>
      </div>

      {/* Test Cases & Output Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Bộ Kiểm thử (Test Cases) & Kết quả Chấm bài
            </h4>
          </div>
          {result ? (
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                result.allPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              Đạt {result.passedCount}/{result.totalCount} Test Cases
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-400">
              {exercise.testCases.length} kịch bản kiểm thử tự động
            </span>
          )}
        </div>

        <div className="grid gap-2.5">
          {(result ? result.results : exercise.testCases).map((tc, idx) => {
            const isVerified = 'passed' in tc;
            const passed = isVerified ? tc.passed : false;

            return (
              <div
                key={idx}
                className={`rounded-xl border p-3 text-xs space-y-2 transition-colors ${
                  !isVerified
                    ? 'border-slate-800 bg-slate-950/70'
                    : passed
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {isVerified ? (
                      passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                    )}
                    <span>
                      Test #{idx + 1}:{' '}
                      <span className="font-mono text-slate-200">
                        {renderHighlightedPython(tc.description)}
                      </span>
                    </span>
                  </div>
                  {isVerified && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase shrink-0 ${
                        passed
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {passed ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>

                <div className="ide-dark-surface flex flex-wrap items-center gap-2 rounded-lg border border-slate-800/80 bg-[#090d16] px-2.5 py-1.5 font-mono text-[11px]">
                  <span className="text-slate-400 shrink-0">
                    Expected Output:
                  </span>
                  <code className="break-all">
                    {renderHighlightedPython(tc.expectedOutput)}
                  </code>
                </div>

                {isVerified && (
                  <div
                    className={`text-xs pt-0.5 font-medium ${
                      passed ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {tc.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {result && (
          <div className="ide-dark-surface rounded-xl border border-slate-800 bg-[#090d16] p-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400 mb-1.5">
              <span>$ python3 solution.py — Console Output</span>
              <span
                className={
                  result.allPassed ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                Exit code: {result.allPassed ? '0' : '1'}
              </span>
            </div>
            <pre className="font-mono text-xs leading-5 whitespace-pre-wrap">
              <code>{renderHighlightedPython(result.simulatedStdout)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
