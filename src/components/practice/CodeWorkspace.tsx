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
  Palette,
} from 'lucide-react';
import { PracticeExercise, VerificationResult } from '@/types/practice.types';
import { verifyExerciseCode } from '@/utils/codeVerifier';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { IDE_THEMES, getIdeThemeConfig } from '@/utils/ideThemes';
import {
  getPythonCompletions,
  CompletionItem,
  CompletionKind,
} from '@/utils/pythonAutocompleter';
import { cn } from '@/utils/cn';

const KIND_BADGE_MAP: Record<
  CompletionKind,
  {
    label: string;
    darkStyle: React.CSSProperties;
    lightStyle: React.CSSProperties;
  }
> = {
  variable: {
    label: 'VAR',
    darkStyle: {
      backgroundColor: 'rgba(14, 165, 233, 0.18)',
      color: '#38bdf8',
      borderColor: 'rgba(56, 189, 248, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(2, 132, 199, 0.12)',
      color: '#0369a1',
      borderColor: 'rgba(2, 132, 199, 0.3)',
    },
  },
  keyword: {
    label: 'KW',
    darkStyle: {
      backgroundColor: 'rgba(168, 85, 247, 0.18)',
      color: '#c084fc',
      borderColor: 'rgba(192, 132, 252, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(126, 34, 206, 0.12)',
      color: '#7e22ce',
      borderColor: 'rgba(126, 34, 206, 0.3)',
    },
  },
  builtin: {
    label: 'FN',
    darkStyle: {
      backgroundColor: 'rgba(6, 182, 212, 0.18)',
      color: '#22d3ee',
      borderColor: 'rgba(34, 211, 238, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(14, 116, 144, 0.12)',
      color: '#0e7490',
      borderColor: 'rgba(14, 116, 144, 0.3)',
    },
  },
  method: {
    label: 'METH',
    darkStyle: {
      backgroundColor: 'rgba(245, 158, 11, 0.18)',
      color: '#fbbf24',
      borderColor: 'rgba(251, 191, 36, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(180, 83, 9, 0.12)',
      color: '#b45309',
      borderColor: 'rgba(180, 83, 9, 0.3)',
    },
  },
  type: {
    label: 'TYPE',
    darkStyle: {
      backgroundColor: 'rgba(16, 185, 129, 0.18)',
      color: '#34d399',
      borderColor: 'rgba(52, 211, 153, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(4, 120, 87, 0.12)',
      color: '#047857',
      borderColor: 'rgba(4, 120, 87, 0.3)',
    },
  },
  dunder: {
    label: 'DUND',
    darkStyle: {
      backgroundColor: 'rgba(99, 102, 241, 0.18)',
      color: '#818cf8',
      borderColor: 'rgba(129, 140, 248, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(67, 56, 202, 0.12)',
      color: '#4338ca',
      borderColor: 'rgba(67, 56, 202, 0.3)',
    },
  },
  snippet: {
    label: 'SNIP',
    darkStyle: {
      backgroundColor: 'rgba(244, 63, 94, 0.18)',
      color: '#fb7185',
      borderColor: 'rgba(251, 113, 133, 0.35)',
    },
    lightStyle: {
      backgroundColor: 'rgba(190, 18, 60, 0.12)',
      color: '#be123c',
      borderColor: 'rgba(190, 18, 60, 0.3)',
    },
  },
};

export const CodeWorkspace: React.FC<{ exercise: PracticeExercise }> = ({
  exercise,
}) => {
  const { submissions, saveExerciseSubmission } = useUserDataStore();
  const { ideTheme, setIdeTheme } = useSettingsStore();
  const savedRecord = submissions[exercise.id];

  const activeIdeTheme = getIdeThemeConfig(ideTheme);

  const [code, setCode] = useState(savedRecord?.code || exercise.starterCode);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // IntelliSense / Auto-completion State
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [selectedCompletionIdx, setSelectedCompletionIdx] = useState(0);
  const [replaceRange, setReplaceRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 0 });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existing = useUserDataStore.getState().submissions[exercise.id];
    setCode(existing?.code || exercise.starterCode);
    setResult(null);
    setCursorPos({ line: 1, col: 1 });
    setCompletions([]);
  }, [exercise.id, exercise.starterCode]);

  const handleRunTests = async () => {
    setCompletions([]);
    const res = verifyExerciseCode(exercise, code);
    setResult(res);
    await saveExerciseSubmission(exercise.id, code, res.allPassed);
  };

  const handleReset = () => {
    setCode(exercise.starterCode);
    setResult(null);
    setCompletions([]);
  };

  const handleFillSolution = () => {
    setCode(exercise.solutionCode);
    setCompletions([]);
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

  const updateAutocomplete = (
    nextCode: string,
    cursorIdx: number
  ) => {
    const { replaceStart, suggestions } = getPythonCompletions(
      nextCode,
      cursorIdx,
      `${exercise.starterCode}\n${exercise.solutionCode}`
    );
    setCompletions(suggestions);
    setSelectedCompletionIdx(0);
    setReplaceRange({ start: replaceStart, end: cursorIdx });
  };

  const applyCompletion = (item: CompletionItem) => {
    const el = textareaRef.current;
    if (!el) return;

    const nextCode =
      code.slice(0, replaceRange.start) +
      item.insertText +
      code.slice(replaceRange.end);

    setCode(nextCode);
    setCompletions([]);

    requestAnimationFrame(() => {
      el.focus();
      const nextCursor = replaceRange.start + item.insertText.length;
      el.selectionStart = el.selectionEnd = nextCursor;
      updateCursorMetrics(el);
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

    // Ctrl + Space -> Force trigger IntelliSense
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      updateAutocomplete(value, selectionStart);
      return;
    }

    // Handle IntelliSense Popup keyboard navigation when open
    if (completions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCompletionIdx((prev) => (prev + 1) % completions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCompletionIdx(
          (prev) => (prev - 1 + completions.length) % completions.length
        );
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        applyCompletion(completions[selectedCompletionIdx] || completions[0]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setCompletions([]);
        return;
      }
    }

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
  const editorHeightPx = Math.min(
    Math.max(displayLineCount * 24 + 32, 340),
    540
  );

  // Calculate IntelliSense popup position relative to active cursor line/col
  const popupTopPx = Math.min(
    Math.max(cursorPos.line * 24 + 14, 40),
    editorHeightPx - 190
  );
  const isSmallViewport =
    typeof window !== 'undefined' && window.innerWidth < 640;
  const popupLeftPx = isSmallViewport
    ? 8
    : Math.min(Math.max((cursorPos.col - 1) * 7.8 + 16, 16), 240);

  const handleInsertTouchText = (snippet: string, cursorBackOffset = 0) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const nextValue = code.slice(0, start) + snippet + code.slice(end);
    setCode(nextValue);
    requestAnimationFrame(() => {
      el.focus();
      const nextPos = start + snippet.length - cursorBackOffset;
      el.selectionStart = el.selectionEnd = nextPos;
      updateCursorMetrics(el);
      updateAutocomplete(nextValue, nextPos);
    });
  };

  const handleTouchUnindent = () => {
    const el = textareaRef.current;
    if (!el) return;
    const selectionStart = el.selectionStart || 0;
    const lineStart = code.lastIndexOf('\n', selectionStart - 1) + 1;
    const linePrefix = code.slice(lineStart, selectionStart);
    const removeCount = linePrefix.match(/^ {1,4}/)?.[0].length || 0;
    if (removeCount > 0) {
      const nextValue =
        code.slice(0, lineStart) + code.slice(lineStart + removeCount);
      setCode(nextValue);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = Math.max(
          lineStart,
          selectionStart - removeCount
        );
        updateCursorMetrics(el);
      });
    }
  };

  const handleTouchTriggerSuggest = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    updateAutocomplete(code, el.selectionStart || 0);
  };

  return (
    <div className="space-y-4">
      {/* IDE Editor Card */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xl transition-colors"
        style={{
          borderColor: activeIdeTheme.barBorder,
          backgroundColor: activeIdeTheme.editorBg,
        }}
      >
        {/* IDE Top Tab & Action Bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2 transition-colors"
          style={{
            backgroundColor: activeIdeTheme.barBg,
            borderColor: activeIdeTheme.barBorder,
            color: activeIdeTheme.barText,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold"
              style={{
                backgroundColor: activeIdeTheme.editorBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.isLight ? '#0550ae' : '#6ee7b7',
              }}
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>solution.py</span>
            </div>

            {savedRecord?.passed && (
              <span className="rounded-md bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
                ✓ Đã giải
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              title="Sao chép code"
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-85 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Đã chép</span>
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
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-85 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleFillSolution}
              title="Điền lời giải chuẩn Pythonic vào trình soạn thảo"
              style={{
                backgroundColor: activeIdeTheme.isLight
                  ? 'rgba(79, 70, 229, 0.10)'
                  : 'rgba(99, 102, 241, 0.18)',
                borderColor: activeIdeTheme.isLight
                  ? 'rgba(79, 70, 229, 0.30)'
                  : 'rgba(129, 140, 248, 0.40)',
                color: activeIdeTheme.isLight ? '#4338ca' : '#a5b4fc',
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-85 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lời giải mẫu</span>
            </button>

            <button
              onClick={handleRunTests}
              title="Chạy kiểm thử (Ctrl/Cmd + Enter)"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-[#020617] hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Chạy & Chấm bài</span>
            </button>
          </div>
        </div>

        {/* Syntax-Highlighted Overlay Code Editor + Floating IntelliSense */}
        <div
          className={cn(
            'relative flex font-mono text-[13px] leading-6 transition-colors',
            !activeIdeTheme.isLight && 'ide-dark-surface'
          )}
          style={{
            height: `${editorHeightPx}px`,
            backgroundColor: activeIdeTheme.editorBg,
          }}
        >
          {/* Line Numbers Gutter */}
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="select-none overflow-hidden border-r py-4 px-2.5 text-right font-mono text-[12px] leading-6 shrink-0 w-11 transition-colors"
            style={{
              backgroundColor: activeIdeTheme.gutterBg,
              borderColor: activeIdeTheme.gutterBorder,
            }}
          >
            {Array.from({ length: displayLineCount }).map((_, i) => {
              const ln = i + 1;
              const isCurrent = ln === cursorPos.line;
              return (
                <div
                  key={ln}
                  style={{
                    color: isCurrent
                      ? activeIdeTheme.gutterActiveText
                      : activeIdeTheme.gutterText,
                    fontWeight: isCurrent ? 700 : 400,
                  }}
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
                {renderHighlightedPython(code, activeIdeTheme.isLight)}
                {code.endsWith('\n') ? ' ' : ''}
              </code>
            </pre>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => {
                const nextVal = e.target.value;
                const nextPos = e.target.selectionStart || 0;
                setCode(nextVal);
                updateCursorMetrics(e.target);
                updateAutocomplete(nextVal, nextPos);
              }}
              onClick={(e) => {
                updateCursorMetrics(e.currentTarget);
                setCompletions([]);
              }}
              onKeyUp={(e) => {
                if (
                  ![
                    'ArrowDown',
                    'ArrowUp',
                    'Enter',
                    'Tab',
                    'Escape',
                  ].includes(e.key)
                ) {
                  updateCursorMetrics(e.currentTarget);
                }
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Delay closing so clicking a suggestion registers first
                setTimeout(() => setCompletions([]), 180);
              }}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Trình soạn thảo code Python"
              className={cn(
                'absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 whitespace-pre text-transparent focus:outline-none tab-size-4',
                activeIdeTheme.caretClass,
                activeIdeTheme.selectionClass
              )}
            />

            {/* Floating Python IntelliSense Auto-Complete Popup (Matches Active IDE Theme) */}
            {completions.length > 0 && (
              <div
                style={{
                  top: `${popupTopPx}px`,
                  left: `${popupLeftPx}px`,
                  backgroundColor: activeIdeTheme.popupBg,
                  borderColor: activeIdeTheme.popupBorder,
                  color: activeIdeTheme.popupText,
                }}
                className="absolute z-30 w-[calc(100%-16px)] max-w-80 sm:w-96 sm:max-w-96 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in duration-100"
              >
                <div
                  style={{
                    backgroundColor: activeIdeTheme.popupHeaderBg,
                    borderColor: activeIdeTheme.popupBorder,
                    color: activeIdeTheme.popupMutedText,
                  }}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 border-b text-[10px] font-mono whitespace-nowrap"
                >
                  <span className="font-bold">Gợi ý Python (IntelliSense)</span>
                  <span className="opacity-90">↑↓ chọn • Tab/Enter chèn • Esc</span>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {completions.map((item, idx) => {
                    const isSelected = idx === selectedCompletionIdx;
                    const badge = KIND_BADGE_MAP[item.kind];

                    return (
                      <button
                        key={`${item.kind}-${item.label}`}
                        type="button"
                        onMouseEnter={() => setSelectedCompletionIdx(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyCompletion(item);
                        }}
                        style={{
                          backgroundColor: isSelected
                            ? activeIdeTheme.popupActiveBg
                            : 'transparent',
                          color: isSelected
                            ? activeIdeTheme.popupActiveText
                            : activeIdeTheme.popupText,
                          borderBottom:
                            idx < completions.length - 1
                              ? `1px solid ${activeIdeTheme.popupBorder}55`
                              : 'none',
                          borderLeft: isSelected
                            ? `3px solid ${activeIdeTheme.popupActiveAccent}`
                            : '3px solid transparent',
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left font-mono text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={
                              activeIdeTheme.isLight
                                ? badge.lightStyle
                                : badge.darkStyle
                            }
                            className="rounded border px-1.5 py-0.2 text-[9px] font-bold shrink-0"
                          >
                            {badge.label}
                          </span>
                          <span className="font-bold truncate">
                            {item.label}
                          </span>
                        </div>
                        <span
                          style={{ color: activeIdeTheme.popupMutedText }}
                          className="text-[10px] font-sans truncate max-w-[175px]"
                        >
                          {item.detail}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Quick Touch Coding Bar (< lg): Tab, Unindent, Suggest & Python Symbols */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t px-3 py-1.5 font-mono text-xs lg:hidden"
          style={{
            backgroundColor: activeIdeTheme.gutterBg,
            borderColor: activeIdeTheme.barBorder,
            color: activeIdeTheme.barText,
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleInsertTouchText('    ');
            }}
            style={{
              backgroundColor: activeIdeTheme.btnBg,
              borderColor: activeIdeTheme.barBorder,
              color: activeIdeTheme.barText,
            }}
            className="rounded-lg border px-2.5 py-1 text-[11px] font-bold shrink-0 active:scale-95"
          >
            ⇥ Tab (4sp)
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleTouchUnindent();
            }}
            style={{
              backgroundColor: activeIdeTheme.btnBg,
              borderColor: activeIdeTheme.barBorder,
              color: activeIdeTheme.barText,
            }}
            className="rounded-lg border px-2 py-1 text-[11px] font-semibold shrink-0 active:scale-95"
          >
            ⇤ Lùi
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleTouchTriggerSuggest();
            }}
            style={{
              backgroundColor: activeIdeTheme.popupActiveBg,
              borderColor: activeIdeTheme.popupActiveAccent,
              color: activeIdeTheme.popupActiveText,
            }}
            className="rounded-lg border px-2.5 py-1 text-[11px] font-bold shrink-0 active:scale-95"
          >
            💡 Gợi ý
          </button>
          {[
            { label: ':', text: ':', back: 0 },
            { label: '=', text: ' = ', back: 0 },
            { label: '_', text: '_', back: 0 },
            { label: '( )', text: '()', back: 1 },
            { label: '[ ]', text: '[]', back: 1 },
            { label: '" "', text: '""', back: 1 },
            { label: '->', text: ' -> ', back: 0 },
          ].map((sym) => (
            <button
              key={sym.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleInsertTouchText(sym.text, sym.back);
              }}
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="rounded-lg border px-2.5 py-1 text-[11px] font-bold shrink-0 active:scale-95"
            >
              {sym.label}
            </button>
          ))}
        </div>

        {/* IDE Bottom Status Bar + Bottom-Right Theme Switcher Icon */}
        <div
          className="relative flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-1.5 font-mono text-[11px] transition-colors"
          style={{
            backgroundColor: activeIdeTheme.barBg,
            borderColor: activeIdeTheme.barBorder,
            color: activeIdeTheme.barText,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="hidden sm:inline opacity-40">|</span>
            <span className="hidden sm:inline opacity-80">
              Gợi ý tự động • Ctrl+Space (Mở gợi ý) • Tab (Chèn)
            </span>
          </div>

          {/* Right Side: Syntax Legend + Bottom-Right IDE Color Theme Picker Icon */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className="hidden xl:flex items-center gap-2 text-[10px] opacity-85">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Keyword</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span>Function</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>String</span>
              </span>
            </div>

            {/* Small Icon at Bottom-Right Corner to Switch IDE Color Theme (Persisted) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((v) => !v)}
                title="Đổi màu nền & giao diện IDE (Tự động lưu)"
                style={{
                  backgroundColor: activeIdeTheme.btnBg,
                  borderColor: activeIdeTheme.barBorder,
                  color: activeIdeTheme.barText,
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-85 cursor-pointer shadow-2xs"
              >
                <Palette
                  className="h-3.5 w-3.5"
                  style={{ color: activeIdeTheme.popupActiveAccent }}
                />
                <span className="flex items-center gap-0.5">
                  {activeIdeTheme.swatchColors.map((hex, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full border border-black/20"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span className="hidden sm:inline text-[10px] font-semibold">
                  {activeIdeTheme.name.split(' (')[0]}
                </span>
              </button>

              {isThemeMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsThemeMenuOpen(false)}
                  />
                  <div
                    style={{
                      backgroundColor: activeIdeTheme.popupBg,
                      borderColor: activeIdeTheme.popupBorder,
                      color: activeIdeTheme.popupText,
                    }}
                    className="absolute right-0 bottom-8 z-40 w-64 rounded-2xl border p-2 shadow-2xl space-y-1"
                  >
                    <div
                      style={{
                        borderColor: activeIdeTheme.popupBorder,
                        color: activeIdeTheme.popupMutedText,
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b"
                    >
                      Chọn Màu Giao Diện IDE (Tự lưu)
                    </div>
                    {IDE_THEMES.map((t) => {
                      const active = t.id === activeIdeTheme.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setIdeTheme(t.id);
                            setIsThemeMenuOpen(false);
                          }}
                          style={{
                            backgroundColor: active
                              ? activeIdeTheme.popupActiveBg
                              : 'transparent',
                            color: active
                              ? activeIdeTheme.popupActiveText
                              : activeIdeTheme.popupText,
                            borderColor: active
                              ? activeIdeTheme.popupActiveAccent
                              : 'transparent',
                          }}
                          className="w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition-colors cursor-pointer font-semibold"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="flex items-center gap-0.5 rounded-md border p-1 shrink-0"
                              style={{
                                backgroundColor: t.editorBg,
                                borderColor: t.barBorder,
                              }}
                            >
                              {t.swatchColors.map((hex, i) => (
                                <span
                                  key={i}
                                  className="h-2.5 w-2.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                            </span>
                            <span className="truncate font-sans">{t.name}</span>
                          </div>
                          {active && (
                            <Check
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: activeIdeTheme.popupActiveAccent }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
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
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                result.allPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {result.allPassed ? '✓ Thành công: ' : '✕ Báo lỗi: '}
              Đạt {result.passedCount}/{result.totalCount} Test Cases
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-400">
              {exercise.testCases.length} kịch bản kiểm thử tự động
            </span>
          )}
        </div>

        {/* Prominent Console Output Terminal right at top when Run is clicked */}
        {result && (
          <div
            className={cn(
              'rounded-xl border p-3.5 transition-all',
              !activeIdeTheme.isLight && 'ide-dark-surface',
              result.allPassed
                ? 'ring-1 ring-emerald-500/40'
                : 'ring-1 ring-rose-500/40'
            )}
            style={{
              backgroundColor: activeIdeTheme.editorBg,
              borderColor: result.allPassed ? '#10b98166' : '#f43f5e66',
            }}
          >
            <div
              className="flex items-center justify-between text-[11px] font-mono font-semibold mb-2 pb-1.5 border-b"
              style={{
                color: activeIdeTheme.gutterText,
                borderColor: activeIdeTheme.barBorder,
              }}
            >
              <span>$ python3 solution.py — Console Output</span>
              <span
                className={
                  result.allPassed
                    ? 'text-emerald-400 font-bold'
                    : 'text-rose-400 font-bold'
                }
              >
                Exit code: {result.allPassed ? '0 (OK)' : '1 (FAILED)'}
              </span>
            </div>
            <pre className="font-mono text-xs leading-5 whitespace-pre-wrap">
              <code>
                {renderHighlightedPython(
                  result.simulatedStdout,
                  activeIdeTheme.isLight
                )}
              </code>
            </pre>
          </div>
        )}

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

                <div
                  className={cn(
                    'flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[11px]',
                    !activeIdeTheme.isLight && 'ide-dark-surface'
                  )}
                  style={{
                    backgroundColor: activeIdeTheme.editorBg,
                    borderColor: activeIdeTheme.barBorder,
                  }}
                >
                  <span
                    className="shrink-0"
                    style={{ color: activeIdeTheme.gutterText }}
                  >
                    Expected Output:
                  </span>
                  <code className="break-all">
                    {renderHighlightedPython(
                      tc.expectedOutput,
                      activeIdeTheme.isLight
                    )}
                  </code>
                </div>

                {isVerified && (
                  <div
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      passed
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {passed ? '✓ ' : '✕ Lỗi: '}
                    {tc.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
