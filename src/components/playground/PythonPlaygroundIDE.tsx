import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Terminal,
  Package,
  FileCode2,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Palette,
  Layers,
  Activity,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Send,
  Code2,
  SplitSquareVertical,
  Download,
  ChevronRight,
} from 'lucide-react';
import {
  PLAYGROUND_TEMPLATES,
  PLAYGROUND_PACKAGES,
  PlaygroundFile,
  PlaygroundPackageInfo,
} from '@/data/playground/playgroundTemplatesData';
import {
  executePlaygroundWorkspace,
  executePlaygroundTerminalCommand,
  PlaygroundLogItem,
  PlaygroundVariableItem,
} from '@/utils/playgroundEngine';
import {
  getPythonCompletions,
  CompletionItem,
  CompletionKind,
} from '@/utils/pythonAutocompleter';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { IDE_THEMES, getIdeThemeConfig } from '@/utils/ideThemes';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getAppContainerWidth } from '@/utils/viewport';
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
    label: 'MOD/TYPE',
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

type ConsoleTab = 'output' | 'terminal' | 'logs' | 'variables';
type MobilePlaygroundView = 'split' | 'editor' | 'console' | 'packages';

export const PythonPlaygroundIDE: React.FC = () => {
  const { ideTheme, setIdeTheme } = useSettingsStore();
  const activeIdeTheme = getIdeThemeConfig(ideTheme);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    PLAYGROUND_TEMPLATES[0].id
  );
  const activeTemplate =
    PLAYGROUND_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    PLAYGROUND_TEMPLATES[0];

  const [files, setFiles] = useState<PlaygroundFile[]>(() =>
    activeTemplate.files.map((f) => ({ ...f }))
  );
  const [activeFileName, setActiveFileName] = useState<string>(
    activeTemplate.entryFile
  );
  const [installedPackages, setInstalledPackages] = useState<string[]>(() => [
    ...activeTemplate.installedPackages,
  ]);

  const [preferPyodide, setPreferPyodide] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastEngineUsed, setLastEngineUsed] = useState<
    'instant-smart' | 'pyodide-wasm'
  >('instant-smart');
  const [lastDurationMs, setLastDurationMs] = useState<number>(6);
  const [exitCode, setExitCode] = useState<0 | 1>(0);

  const [stdoutLines, setStdoutLines] = useState<string[]>(
    () => activeTemplate.expectedOutputLines
  );
  const [stderrLines, setStderrLines] = useState<string[]>([]);
  const [logs, setLogs] = useState<PlaygroundLogItem[]>(() =>
    activeTemplate.expectedLogs.map((l, idx) => ({
      id: `init-log-${idx}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      level: l.level,
      source: activeTemplate.entryFile,
      message: l.message,
    }))
  );
  const [variables, setVariables] = useState<PlaygroundVariableItem[]>(
    () => activeTemplate.expectedVariables
  );

  // Interactive Terminal REPL History
  const [terminalLines, setTerminalLines] = useState<
    { id: string; kind: 'input' | 'output'; text: string }[]
  >([
    {
      id: 'welcome-1',
      kind: 'output',
      text: 'Python 3.12.7 Interactive REPL & uv CLI — Gõ biểu thức Python (VD: 2 ** 10), tên biến hoặc lệnh CLI (help, uv add pydantic, pip list, ls)',
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // UI Layout states
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('output');
  const [mobileView, setMobileView] = useState<MobilePlaygroundView>('split');
  const [showPackageDrawer, setShowPackageDrawer] = useState<boolean>(false);
  const [pkgSearch, setPkgSearch] = useState<string>('');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [newFileModalOpen, setNewFileModalOpen] = useState<boolean>(false);
  const [newFileNameInput, setNewFileNameInput] = useState<string>('');

  // Editor & IntelliSense State
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [selectedCompletionIdx, setSelectedCompletionIdx] = useState(0);
  const [replaceRange, setReplaceRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: 0 });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const activeFile =
    files.find((f) => f.name === activeFileName) || files[0];
  const code = activeFile?.content || '';

  const setCode = (nextContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.name === activeFile.name ? { ...f, content: nextContent } : f
      )
    );
  };

  // Switch template handler
  const handleSelectTemplate = (templateId: string) => {
    const tpl = PLAYGROUND_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    setFiles(tpl.files.map((f) => ({ ...f })));
    setActiveFileName(tpl.entryFile);
    setInstalledPackages([...tpl.installedPackages]);
    setStdoutLines([...tpl.expectedOutputLines]);
    setStderrLines([]);
    setExitCode(0);
    setVariables([...tpl.expectedVariables]);
    setLogs(
      tpl.expectedLogs.map((l, idx) => ({
        id: `tpl-log-${Date.now()}-${idx}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        level: l.level,
        source: tpl.entryFile,
        message: l.message,
      }))
    );
    setCompletions([]);
    if (mobileView === 'packages') {
      setMobileView('split');
    }
  };

  // Run workspace code
  const handleRunCode = async () => {
    setCompletions([]);
    setIsRunning(true);
    try {
      const res = await executePlaygroundWorkspace(
        files,
        activeTemplate.entryFile,
        preferPyodide,
        activeTemplate
      );
      setLastEngineUsed(res.engine);
      setLastDurationMs(res.durationMs);
      setExitCode(res.exitCode);
      setStdoutLines(res.stdoutLines);
      setStderrLines(res.stderrLines);
      setVariables(res.variables);
      setLogs((prev) => [...res.logs, ...prev].slice(0, 40));
      setConsoleTab('output');
      if (mobileView === 'editor') {
        setMobileView('console');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetWorkspace = () => {
    handleSelectTemplate(selectedTemplateId);
  };

  // Install or import package helper
  const handleInstallPackage = (pkgIdOrName: string) => {
    const cleanId = pkgIdOrName.trim().toLowerCase();
    const pkgInfo = PLAYGROUND_PACKAGES.find(
      (p) => p.id === cleanId || p.name.toLowerCase() === cleanId
    );
    if (!installedPackages.includes(cleanId)) {
      setInstalledPackages((prev) => [...prev, cleanId]);
    }

    // Also add to pyproject.toml if it's a third-party package
    if (!pkgInfo || pkgInfo.kind === 'third-party') {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.name !== 'pyproject.toml') return f;
          if (f.content.includes(`"${cleanId}`)) return f;
          const updated = f.content.replace(
            /dependencies\s*=\s*\[([\s\S]*?)\]/,
            (_, inner) => {
              const trimmedInner = inner.trim();
              const depSpec = pkgInfo
                ? `"${pkgInfo.name}>=${pkgInfo.version}"`
                : `"${cleanId}"`;
              return trimmedInner
                ? `dependencies = [\n    ${trimmedInner},\n    ${depSpec},\n]`
                : `dependencies = [\n    ${depSpec},\n]`;
            }
          );
          return { ...f, content: updated };
        })
      );
    }

    setLogs((prev) => [
      {
        id: `pkg-${Date.now()}`,
        timestamp: new Date().toTimeString().split(' ')[0],
        level: 'INFO',
        source: 'uv package manager',
        message: `Đã cài đặt & kích hoạt gói '${cleanId}' trong môi trường dự án`,
      },
      ...prev,
    ]);
  };

  const handleInsertImportSnippet = (pkg: PlaygroundPackageInfo) => {
    handleInstallPackage(pkg.id);
    // Switch to main.py if currently on pyproject.toml
    const targetFileName =
      activeFile.language === 'python'
        ? activeFile.name
        : activeTemplate.entryFile;
    setActiveFileName(targetFileName);

    setFiles((prev) =>
      prev.map((f) => {
        if (f.name !== targetFileName) return f;
        const alreadyHasImport = f.content.includes(pkg.importStatement);
        const nextHeader = alreadyHasImport
          ? f.content
          : `${pkg.importStatement}\n${f.content}`;
        return {
          ...f,
          content: `${nextHeader.trimEnd()}\n\n# Thử nghiệm ${pkg.name}:\n${pkg.sampleSnippet}\n`,
        };
      })
    );

    if (mobileView === 'packages') {
      setMobileView('split');
    }
  };

  // Create new file in workspace
  const handleAddNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newFileNameInput.trim();
    if (!name) return;
    if (!name.endsWith('.py') && !name.endsWith('.json') && !name.endsWith('.toml')) {
      name = `${name}.py`;
    }
    if (files.some((f) => f.name === name)) {
      setActiveFileName(name);
      setNewFileModalOpen(false);
      setNewFileNameInput('');
      return;
    }
    const lang: PlaygroundFile['language'] = name.endsWith('.toml')
      ? 'toml'
      : name.endsWith('.json')
      ? 'json'
      : 'python';
    const starter =
      lang === 'python'
        ? `# Module: ${name}\n\ndef helper_message() -> str:\n    return "Xin chào từ module ${name}!"\n`
        : lang === 'json'
        ? `{\n  "env": "development"\n}\n`
        : '';

    setFiles((prev) => [...prev, { name, language: lang, content: starter }]);
    setActiveFileName(name);
    setNewFileModalOpen(false);
    setNewFileNameInput('');
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === activeTemplate.entryFile || fileName === 'pyproject.toml')
      return;
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    if (activeFileName === fileName) {
      setActiveFileName(activeTemplate.entryFile);
    }
  };

  // Terminal REPL command submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = terminalInput.trim();
    if (!raw) return;

    const res = executePlaygroundTerminalCommand(
      raw,
      files,
      installedPackages,
      variables,
      handleInstallPackage
    );

    if (res.clearTerminal) {
      setTerminalLines([]);
      setTerminalInput('');
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      { id: `in-${Date.now()}`, kind: 'input', text: raw },
      ...res.outputLines.map((line, idx) => ({
        id: `out-${Date.now()}-${idx}`,
        kind: 'output' as const,
        text: line,
      })),
    ]);
    setTerminalInput('');
  };

  useEffect(() => {
    if (consoleTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, consoleTab]);

  // Editor helpers
  const updateCursorMetrics = (el: HTMLTextAreaElement) => {
    const pos = el.selectionStart || 0;
    const textBefore = el.value.slice(0, pos);
    const linesBefore = textBefore.split('\n');
    setCursorPos({
      line: linesBefore.length,
      col: linesBefore[linesBefore.length - 1].length + 1,
    });
  };

  const extraWorkspaceContext = files
    .filter((f) => f.name !== activeFile.name && f.language === 'python')
    .map((f) => f.content)
    .join('\n');

  const updateAutocomplete = (nextCode: string, cursorIdx: number) => {
    if (activeFile.language !== 'python') {
      setCompletions([]);
      return;
    }
    const { replaceStart, suggestions } = getPythonCompletions(
      nextCode,
      cursorIdx,
      extraWorkspaceContext
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

    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      updateAutocomplete(value, selectionStart);
      return;
    }

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

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const linePrefix = value.slice(lineStart, selectionStart);
        const removeCount = linePrefix.match(/^ {1,4}/)?.[0].length || 0;
        if (removeCount > 0) {
          const nextValue =
            value.slice(0, lineStart) + value.slice(lineStart + removeCount);
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
          value.slice(0, selectionStart) + spaces + value.slice(selectionEnd);
        setCode(nextValue);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = selectionStart + spaces.length;
          updateCursorMetrics(el);
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLineBeforeCursor = value.slice(lineStart, selectionStart);
      const baseIndent = currentLineBeforeCursor.match(/^\s*/)?.[0] || '';
      const trimmedBefore = currentLineBeforeCursor.trimEnd();
      const extraIndent = trimmedBefore.endsWith(':') ? '    ' : '';
      const insertion = '\n' + baseIndent + extraIndent;

      const nextValue =
        value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
      setCode(nextValue);
      requestAnimationFrame(() => {
        const nextPos = selectionStart + insertion.length;
        el.selectionStart = el.selectionEnd = nextPos;
        updateCursorMetrics(el);
      });
    }
  };

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

  const lines = code.split('\n');
  const displayLineCount = Math.max(lines.length, 16);
  const editorHeightPx = Math.min(
    Math.max(displayLineCount * 24 + 32, 340),
    540
  );

  const popupTopPx = Math.min(
    Math.max(cursorPos.line * 24 + 14, 40),
    editorHeightPx - 190
  );
  const isSmallViewport = getAppContainerWidth() < 640;
  const popupLeftPx = isSmallViewport
    ? 8
    : Math.min(Math.max((cursorPos.col - 1) * 7.8 + 16, 16), 240);

  const filteredPackages = PLAYGROUND_PACKAGES.filter((p) => {
    if (!pkgSearch.trim()) return true;
    const q = pkgSearch.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-[1600px] p-3 sm:p-5 space-y-4">
      {/* Top Playground Studio Header & Template Picker */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-indigo-500/20 border border-emerald-500/40 text-emerald-300 shadow-inner">
              <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-lg font-extrabold text-white tracking-tight">
                  Python 3.12 Playground & Studio IDE
                </h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/35 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  IntelliSense + REPL
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400">
                Viết code, tự động gợi ý hàm/module, import thư viện, chia tách đa file (`.py`), xem Output, Logs, Biến bộ nhớ & gõ lệnh trực tiếp trên cả Desktop và Mobile/Tablet.
              </p>
            </div>
          </div>

          {/* Right Controls: Engine Mode + Package Manager Button + Run Button */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreferPyodide((v) => !v)}
              title="Chuyển đổi giữa Instant Engine (chạy tức thì 0ms) và CPython 3.12 WebAssembly (Pyodide)"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate',
                preferPyodide
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
              )}
            >
              <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">
                {preferPyodide
                  ? 'CPython 3.12 Wasm'
                  : 'Engine: Instant (0ms)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPackageDrawer((v) => !v);
                if (getAppContainerWidth() < 1024) {
                  setMobileView((mv) =>
                    mv === 'packages' ? 'split' : 'packages'
                  );
                }
              }}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate',
                showPackageDrawer || mobileView === 'packages'
                  ? 'border-violet-500/60 bg-violet-500/20 text-violet-200'
                  : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-violet-500/40'
              )}
            >
              <Package className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="truncate">Thư viện & Import ({installedPackages.length})</span>
            </button>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetWorkspace}
                title="Khôi phục mẫu code ban đầu"
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-[#020617] hover:bg-emerald-400 disabled:opacity-60 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                <span>{isRunning ? 'Đang chạy...' : 'Chạy Code'}</span>
                <kbd className="hidden md:inline-block rounded bg-emerald-950/30 px-1.5 py-0.2 font-mono text-[10px] text-emerald-950">
                  ⌘↵
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Template Selector: Compact Select Dropdown on Mobile (< sm) + Horizontal Pills on sm+ */}
        <div className="pt-1 border-t border-slate-800/70">
          <div className="flex flex-col sm:hidden gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chọn Mẫu Playground ({PLAYGROUND_TEMPLATES.length} mẫu thực hành):
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              aria-label="Chọn mẫu Playground"
              className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-3 py-2 text-xs font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
            >
              {PLAYGROUND_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.title} ({tpl.badge})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Mẫu Playground:
            </span>
            {PLAYGROUND_TEMPLATES.map((tpl) => {
              const active = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer',
                    active
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-xs'
                      : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white'
                  )}
                >
                  <span>{tpl.title}</span>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.2 text-[10px] font-mono',
                      active
                        ? 'bg-emerald-500/25 text-emerald-200'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {tpl.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile & Tablet (< lg) View Mode Switcher Bar */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-slate-800/90 bg-slate-900/95 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView('split')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold transition-all',
            mobileView === 'split'
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <SplitSquareVertical className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Chia đôi</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold transition-all',
            mobileView === 'editor'
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <Code2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Code IDE</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('console')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold transition-all',
            mobileView === 'console'
              ? 'bg-emerald-500 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <Terminal className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            Output ({stdoutLines.length + stderrLines.length})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView('packages')}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-extrabold transition-all',
            mobileView === 'packages'
              ? 'bg-violet-400 text-slate-950 shadow-xs'
              : 'text-slate-300 hover:text-white'
          )}
        >
          <Package className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Thư viện</span>
        </button>
      </div>

      {/* Collapsible Library & Import Drawer (Desktop toggle or Mobile 'packages' tab) */}
      {(showPackageDrawer || mobileView === 'packages') && (
        <div
          className={cn(
            'rounded-2xl border border-violet-500/35 bg-slate-900/95 p-4 sm:p-5 shadow-xl space-y-4',
            !showPackageDrawer && mobileView !== 'packages' && 'hidden'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-400" />
                <span>
                  Trình Quản lý Thư viện, Cài đặt (`uv add`) & Chèn Nhanh `import`
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Bấm <strong>"Chèn Import + Code mẫu"</strong> để tự động khai báo thư viện vào file `.py` và cập nhật `pyproject.toml`.
              </p>
            </div>
            <input
              type="text"
              value={pkgSearch}
              onChange={(e) => setPkgSearch(e.target.value)}
              placeholder="Tìm thư viện (math, decimal, json, pydantic, httpx...)"
              className="w-full sm:w-72 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredPackages.map((pkg) => {
              const isInstalled = installedPackages.includes(pkg.id);
              return (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/85 p-3 flex flex-col justify-between gap-2.5 hover:border-violet-500/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-white">
                          {pkg.name}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.2 font-mono text-[10px] font-bold',
                            pkg.kind === 'stdlib'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                          )}
                        >
                          {pkg.kind === 'stdlib' ? 'Stdlib' : `v${pkg.version}`}
                        </span>
                      </div>
                      {isInstalled && (
                        <span className="text-[10px] font-bold text-emerald-400">
                          ✓ Đã nạp
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {pkg.summary}
                    </p>
                    <code className="block rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 font-mono text-[11px] text-amber-300 truncate">
                      {pkg.importStatement}
                    </code>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInsertImportSnippet(pkg)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-violet-500/20 border border-violet-500/40 px-2.5 py-1.5 text-[11px] font-bold text-violet-200 hover:bg-violet-500/30 transition-colors cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      <span>Chèn Import + Code mẫu</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split Workspace: Left = Multi-File Code Editor | Right = Output, Terminal REPL, Logs & Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: MULTI-FILE PYTHON IDE (7 cols on Desktop) */}
        <div
          className={cn(
            'lg:col-span-7 space-y-3',
            (mobileView === 'console' || mobileView === 'packages') &&
              'hidden lg:block'
          )}
        >
          <div
            className="rounded-2xl border overflow-hidden shadow-xl transition-colors"
            style={{
              borderColor: activeIdeTheme.barBorder,
              backgroundColor: activeIdeTheme.editorBg,
            }}
          >
            {/* IDE Top File Tabs & Action Bar */}
            <div
              className="flex items-center justify-between gap-2 border-b px-2.5 sm:px-3 py-2 transition-colors min-w-0"
              style={{
                backgroundColor: activeIdeTheme.barBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
            >
              {/* File Tabs (flex-1 min-w-0 so it scrolls horizontally without wrapping Copy/Run to a new row) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
                <div className="hidden sm:flex items-center gap-1.5 mr-1.5 shrink-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>

                {files.map((file) => {
                  const isCurrent = file.name === activeFile.name;
                  const isDeletable =
                    file.name !== activeTemplate.entryFile &&
                    file.name !== 'pyproject.toml';
                  return (
                    <div
                      key={file.name}
                      className="inline-flex items-center rounded-lg border overflow-hidden shrink-0 transition-all"
                      style={{
                        backgroundColor: isCurrent
                          ? activeIdeTheme.editorBg
                          : 'transparent',
                        borderColor: isCurrent
                          ? activeIdeTheme.popupActiveAccent
                          : activeIdeTheme.barBorder,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFileName(file.name);
                          setCompletions([]);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-semibold cursor-pointer"
                        style={{
                          color: isCurrent
                            ? activeIdeTheme.isLight
                              ? '#0550ae'
                              : '#6ee7b7'
                            : activeIdeTheme.barText,
                        }}
                      >
                        <FileCode2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{file.name}</span>
                      </button>
                      {isDeletable && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.name)}
                          title={`Xóa file ${file.name}`}
                          className="pr-2 pl-0.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setNewFileModalOpen((v) => !v)}
                  title="Tạo thêm file module .py mới trong dự án"
                  style={{
                    backgroundColor: activeIdeTheme.btnBg,
                    borderColor: activeIdeTheme.barBorder,
                    color: activeIdeTheme.barText,
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold hover:opacity-85 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>File .py</span>
                </button>
              </div>

              {/* Editor Quick Copy & Run */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1500);
                  }}
                  style={{
                    backgroundColor: activeIdeTheme.btnBg,
                    borderColor: activeIdeTheme.barBorder,
                    color: activeIdeTheme.barText,
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium hover:opacity-85 cursor-pointer"
                >
                  {copiedCode ? (
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
                  type="button"
                  onClick={handleRunCode}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-extrabold text-[#020617] hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Chạy</span>
                </button>
              </div>
            </div>

            {/* Inline New File Creator Bar */}
            {newFileModalOpen && (
              <form
                onSubmit={handleAddNewFile}
                className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3.5 py-2"
              >
                <span className="text-xs font-semibold text-slate-300">
                  Tên file mới:
                </span>
                <input
                  type="text"
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="VD: helpers.py hoặc schemas.py"
                  autoFocus
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  Tạo file
                </button>
                <button
                  type="button"
                  onClick={() => setNewFileModalOpen(false)}
                  className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
              </form>
            )}

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

              {/* Synchronized Highlight Layer + Editable Textarea */}
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
                    setTimeout(() => setCompletions([]), 180);
                  }}
                  onScroll={handleScroll}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  aria-label={`Soạn thảo file ${activeFile.name}`}
                  className={cn(
                    'absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 whitespace-pre text-transparent focus:outline-none tab-size-4',
                    activeIdeTheme.caretClass,
                    activeIdeTheme.selectionClass
                  )}
                />

                {/* Floating Python IntelliSense Auto-Complete Popup */}
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
                      <span className="font-bold">
                        Gợi ý Python & Module (IntelliSense)
                      </span>
                      <span className="opacity-90">
                        ↑↓ chọn • Tab/Enter chèn • Esc
                      </span>
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

            {/* Quick Touch Coding Bar (Always visible on Mobile/Tablet < lg, plus quick snippet buttons) */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t px-3 py-1.5 font-mono text-xs"
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
                className="rounded-lg border px-2.5 py-1 text-[11px] font-bold shrink-0 active:scale-95 cursor-pointer"
              >
                ⇥ Tab
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
                className="rounded-lg border px-2 py-1 text-[11px] font-semibold shrink-0 active:scale-95 cursor-pointer"
              >
                ⇤ Lùi
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const el = textareaRef.current;
                  if (!el) return;
                  el.focus();
                  updateAutocomplete(code, el.selectionStart || 0);
                }}
                style={{
                  backgroundColor: activeIdeTheme.popupActiveBg,
                  borderColor: activeIdeTheme.popupActiveAccent,
                  color: activeIdeTheme.popupActiveText,
                }}
                className="rounded-lg border px-2.5 py-1 text-[11px] font-bold shrink-0 active:scale-95 cursor-pointer"
              >
                💡 Gợi ý
              </button>
              {[
                { label: 'import', text: 'import ', back: 0 },
                { label: 'from', text: 'from ', back: 0 },
                { label: 'print()', text: 'print()', back: 1 },
                { label: 'f""', text: 'f""', back: 1 },
                { label: 'def', text: 'def ', back: 0 },
                { label: ':', text: ':', back: 0 },
                { label: '=', text: ' = ', back: 0 },
                { label: '( )', text: '()', back: 1 },
                { label: '[ ]', text: '[]', back: 1 },
                { label: '{ }', text: '{}', back: 1 },
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
                  className="rounded-lg border px-2 py-1 text-[11px] font-bold shrink-0 active:scale-95 cursor-pointer"
                >
                  {sym.label}
                </button>
              ))}
            </div>

            {/* IDE Bottom Status Bar + Theme Picker */}
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
                  {activeFile.name} • Ln {cursorPos.line}, Col {cursorPos.col}
                </span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span className="hidden sm:inline opacity-80">
                  Gõ `import `, `math.`, `json.` hoặc Ctrl+Space để mở gợi ý
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsThemeMenuOpen((v) => !v)}
                    style={{
                      backgroundColor: activeIdeTheme.btnBg,
                      borderColor: activeIdeTheme.barBorder,
                      color: activeIdeTheme.barText,
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium hover:opacity-85 cursor-pointer"
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
                          Chọn Màu Giao Diện IDE
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
                                <span className="truncate font-sans">
                                  {t.name}
                                </span>
                              </div>
                              {active && (
                                <Check
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{
                                    color: activeIdeTheme.popupActiveAccent,
                                  }}
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
        </div>

        {/* RIGHT PANE: OUTPUT, INTERACTIVE TERMINAL REPL, LOGS & VARIABLES INSPECTOR (5 cols on Desktop) */}
        <div
          className={cn(
            'lg:col-span-5 space-y-3',
            (mobileView === 'editor' || mobileView === 'packages') &&
              'hidden lg:block'
          )}
        >
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 overflow-hidden shadow-xl flex flex-col">
            {/* Console Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setConsoleTab('output')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer',
                    consoleTab === 'output'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span>Output</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.2 font-mono text-[10px]',
                      consoleTab === 'output'
                        ? 'bg-slate-950/20 text-slate-950'
                        : stderrLines.length > 0
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {stdoutLines.length + stderrLines.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsoleTab('terminal')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer',
                    consoleTab === 'terminal'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span>Terminal & REPL (&gt;&gt;&gt;)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsoleTab('logs')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer',
                    consoleTab === 'logs'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span>Logs ({logs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsoleTab('variables')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer',
                    consoleTab === 'variables'
                      ? 'bg-violet-400 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  )}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span>Biến ({variables.length})</span>
                </button>
              </div>
            </div>

            {/* Execution Status Subbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/70 px-3.5 py-2 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                {exitCode === 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Exit: 0 (OK)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Exit: 1 (Exception)</span>
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{lastDurationMs}ms</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300">
                  {lastEngineUsed === 'pyodide-wasm'
                    ? 'CPython 3.12 (Wasm)'
                    : 'Instant Runtime'}
                </span>
              </div>

              {consoleTab === 'output' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        [...stdoutLines, ...stderrLines].join('\n')
                      );
                      setCopiedOutput(true);
                      setTimeout(() => setCopiedOutput(false), 1500);
                    }}
                    className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    {copiedOutput ? 'Đã copy' : 'Copy Output'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStdoutLines([]);
                      setStderrLines([]);
                    }}
                    className="rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: STDOUT / STDERR OUTPUT */}
            {consoleTab === 'output' && (
              <div
                className={cn(
                  'p-4 font-mono text-xs leading-6 min-h-[340px] max-h-[520px] overflow-y-auto space-y-2',
                  !activeIdeTheme.isLight && 'ide-dark-surface'
                )}
                style={{ backgroundColor: activeIdeTheme.editorBg }}
              >
                <div
                  className="text-[11px] pb-1.5 border-b"
                  style={{
                    color: activeIdeTheme.gutterText,
                    borderColor: activeIdeTheme.barBorder,
                  }}
                >
                  $ uv run python {activeTemplate.entryFile}
                </div>

                {stdoutLines.length === 0 && stderrLines.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-sans text-xs">
                    Chưa có dữ liệu đầu ra. Hãy dùng hàm{' '}
                    <code className="text-emerald-400 font-mono">print()</code>{' '}
                    và bấm <strong>Chạy Code</strong>!
                  </div>
                ) : (
                  <>
                    {stdoutLines.map((line, idx) => (
                      <div
                        key={`out-${idx}`}
                        className="whitespace-pre-wrap break-words"
                      >
                        {renderHighlightedPython(line, activeIdeTheme.isLight)}
                      </div>
                    ))}
                    {stderrLines.map((err, idx) => (
                      <div
                        key={`err-${idx}`}
                        className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-rose-300 whitespace-pre-wrap break-words"
                      >
                        {err}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: INTERACTIVE TERMINAL & PYTHON REPL (>>>) */}
            {consoleTab === 'terminal' && (
              <div className="flex flex-col min-h-[340px] max-h-[520px] bg-slate-950">
                {/* Quick One-Tap REPL / CLI Command Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800/80 bg-slate-900/60 px-3 py-1.5">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    Lệnh mẫu:
                  </span>
                  {[
                    '[x**2 for x in range(6)]',
                    '2 ** 16',
                    'pip list',
                    'uv add pydantic',
                    'ls',
                    'cat pyproject.toml',
                    'help',
                    'clear',
                  ].map((sampleCmd) => (
                    <button
                      key={sampleCmd}
                      type="button"
                      onClick={() => {
                        const res = executePlaygroundTerminalCommand(
                          sampleCmd,
                          files,
                          installedPackages,
                          variables,
                          handleInstallPackage
                        );
                        if (res.clearTerminal) {
                          setTerminalLines([]);
                          return;
                        }
                        setTerminalLines((prev) => [
                          ...prev,
                          {
                            id: `in-${Date.now()}`,
                            kind: 'input',
                            text: sampleCmd,
                          },
                          ...res.outputLines.map((line, i) => ({
                            id: `out-${Date.now()}-${i}`,
                            kind: 'output' as const,
                            text: line,
                          })),
                        ]);
                      }}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-amber-300 hover:border-amber-500/50 shrink-0 cursor-pointer"
                    >
                      {sampleCmd}
                    </button>
                  ))}
                </div>

                {/* Terminal Scroll Output */}
                <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs space-y-1.5">
                  {terminalLines.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        'whitespace-pre-wrap break-words leading-relaxed',
                        entry.kind === 'input'
                          ? 'text-amber-300 font-bold'
                          : 'text-slate-200'
                      )}
                    >
                      {entry.kind === 'input' ? `>>> ${entry.text}` : entry.text}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Interactive Command Input */}
                <form
                  onSubmit={handleTerminalSubmit}
                  className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-3 py-2"
                >
                  <span className="font-mono text-xs font-extrabold text-amber-400">
                    &gt;&gt;&gt;
                  </span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Gõ lệnh Python (2**10) hoặc CLI (uv add httpx, pip list, ls, help)..."
                    className="flex-1 bg-transparent font-mono text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Gửi</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: STRUCTURED LOGS */}
            {consoleTab === 'logs' && (
              <div className="p-3.5 min-h-[340px] max-h-[520px] overflow-y-auto space-y-2 bg-slate-950/90">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-2.5 font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.2 text-[10px] font-bold',
                          log.level === 'ERROR'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.level === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        )}
                      >
                        {log.level}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.source} • {log.timestamp}
                      </span>
                    </div>
                    <div className="text-slate-200 break-words">
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: VARIABLES & MEMORY INSPECTOR */}
            {consoleTab === 'variables' && (
              <div className="p-3.5 min-h-[340px] max-h-[520px] overflow-y-auto space-y-2.5 bg-slate-950/90">
                <div className="text-xs text-slate-400">
                  Danh sách các biến toàn cục trong bộ nhớ sau lần chạy gần nhất:
                </div>
                {variables.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Chưa có biến nào được ghi nhận.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variables.map((v) => (
                      <div
                        key={v.name}
                        className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 flex flex-col gap-1 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sky-300">
                            {v.name}
                          </span>
                          <span className="rounded bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.2 text-[10px] text-violet-300">
                            {v.type}
                          </span>
                        </div>
                        <div className="text-emerald-300 break-all text-[11px]">
                          {v.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Tips Card under Console */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Mẹo sử dụng Playground hiệu quả:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 list-disc pl-4">
              <li>
                Gõ <code className="text-emerald-300">import </code> hoặc{' '}
                <code className="text-emerald-300">math.</code>,{' '}
                <code className="text-emerald-300">json.</code>,{' '}
                <code className="text-emerald-300">re.</code> để mở danh sách gợi ý hàm tự động (IntelliSense).
              </li>
              <li>
                Bấm nút <strong>+ File .py</strong> trên thanh tab của Editor để tạo thêm module mới và dùng{' '}
                <code className="text-sky-300">from ten_file import ...</code>.
              </li>
              <li>
                Chuyển sang tab <strong>Terminal &amp; REPL (&gt;&gt;&gt;)</strong> để tính nhanh biểu thức hoặc gõ{' '}
                <code className="text-amber-300">uv add pydantic</code>,{' '}
                <code className="text-amber-300">pip list</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
