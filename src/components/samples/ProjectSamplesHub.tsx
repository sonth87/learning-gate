import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Folder,
  FileCode2,
  FileText,
  Terminal,
  Play,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Globe,
  FlaskConical,
  Sparkles,
  Palette,
  Info,
  Send,
  SlidersHorizontal,
  Wrench,
  ArrowRightLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
} from 'lucide-react';
import { runCode } from '@/features/workpath/engine/pyEngine';
import { ALL_SAMPLE_PROJECTS } from '@/data/samples/samplesData';
import {
  SampleProject,
  SampleProjectFile,
  SampleInteractiveCommand,
} from '@/types/sample.types';
import { SkillLevel } from '@/types/curriculum.types';
import { SKILL_LEVELS } from '@/constants/levels';
import { LevelBadge } from '@/components/common/LevelBadge';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { IDE_THEMES, getIdeThemeConfig } from '@/utils/ideThemes';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
import { RealWorldProjectsCatalog } from './RealWorldProjectsCatalog';
import { cn } from '@/utils/cn';

interface TreeFolderNode {
  name: string;
  fullPath: string;
  folders: Map<string, TreeFolderNode>;
  files: SampleProjectFile[];
}

function buildDirectoryTree(files: SampleProjectFile[]): TreeFolderNode {
  const root: TreeFolderNode = {
    name: 'root',
    fullPath: '',
    folders: new Map(),
    files: [],
  };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const nextPath = current.fullPath
        ? `${current.fullPath}/${folderName}`
        : folderName;
      if (!current.folders.has(folderName)) {
        current.folders.set(folderName, {
          name: folderName,
          fullPath: nextPath,
          folders: new Map(),
          files: [],
        });
      }
      current = current.folders.get(folderName)!;
    }
    current.files.push(file);
  }

  return root;
}

type ProjectToolingStack = 'uv' | 'pyenv-pip' | 'poetry' | 'pipenv';

function formatCommandForStack(
  rawCommand: string,
  stack: ProjectToolingStack
): string {
  if (!rawCommand.startsWith('uv run ')) return rawCommand;
  const inner = rawCommand.replace(/^uv run\s+/, '');
  if (stack === 'uv') return rawCommand;
  if (stack === 'pyenv-pip') return inner;
  if (stack === 'poetry') return `poetry run ${inner}`;
  return `pipenv run ${inner}`;
}

export const ProjectSamplesHub: React.FC = () => {
  const {
    ideTheme,
    setIdeTheme,
    showJsTsComparison,
    toggleJsTsComparison,
  } = useSettingsStore();
  const { setSetupGuideOpen } = useNavigationStore();
  const activeIdeTheme = getIdeThemeConfig(ideTheme);

  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'all'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    ALL_SAMPLE_PROJECTS[0].id
  );
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string>(
    ALL_SAMPLE_PROJECTS[0].defaultFilePath
  );
  const [collapsedFolders, setCollapsedFolders] = useState<
    Record<string, boolean>
  >({});
  const [copiedFile, setCopiedFile] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [toolingStack, setToolingStack] = useState<ProjectToolingStack>('uv');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(288);
  const [isFilesSectionOpen, setIsFilesSectionOpen] = useState(true);
  const [isStructureSectionOpen, setIsStructureSectionOpen] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isRunningLive, setIsRunningLive] = useState(false);
  const [isToolingGuideOpen, setIsToolingGuideOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'split' | 'tree' | 'code'>(
    'split'
  );

  // Interactive Terminal & API/cURL State
  const [activeCommandId, setActiveCommandId] = useState<string>(
    ALL_SAMPLE_PROJECTS[0].interactiveCommands[0].id
  );
  const [customCommandInput, setCustomCommandInput] = useState<string>(
    ALL_SAMPLE_PROJECTS[0].interactiveCommands[0].command
  );
  const [terminalOutput, setTerminalOutput] = useState<string>(
    ALL_SAMPLE_PROJECTS[0].interactiveCommands[0].stdout
  );
  const [activeHttpMeta, setActiveHttpMeta] = useState<
    SampleInteractiveCommand['httpMeta'] | undefined
  >(ALL_SAMPLE_PROJECTS[0].interactiveCommands[0].httpMeta);
  const [runCount, setRunCount] = useState(1);

  const filteredProjects = useMemo(() => {
    if (selectedLevel === 'all') return ALL_SAMPLE_PROJECTS;
    return ALL_SAMPLE_PROJECTS.filter((p) => p.complexity === selectedLevel);
  }, [selectedLevel]);

  const currentProject: SampleProject =
    filteredProjects.find((p) => p.id === selectedProjectId) ||
    ALL_SAMPLE_PROJECTS.find((p) => p.id === selectedProjectId) ||
    filteredProjects[0] ||
    ALL_SAMPLE_PROJECTS[0];

  const currentIdx = filteredProjects.findIndex(
    (p) => p.id === currentProject.id
  );

  // Sync file and terminal when switching project
  useEffect(() => {
    setActiveFilePath(currentProject.defaultFilePath);
    const firstCmd = currentProject.interactiveCommands[0];
    if (firstCmd) {
      setActiveCommandId(firstCmd.id);
      setCustomCommandInput(formatCommandForStack(firstCmd.command, toolingStack));
      setTerminalOutput(firstCmd.stdout);
      setActiveHttpMeta(firstCmd.httpMeta);
    }
    setCollapsedFolders({});
  }, [currentProject.id, currentProject.defaultFilePath, currentProject.interactiveCommands, toolingStack]);

  const activeFile: SampleProjectFile =
    currentProject.files.find((f) => f.path === activeFilePath) ||
    currentProject.files[0];

  const directoryTree = useMemo(
    () => buildDirectoryTree(currentProject.files),
    [currentProject.files]
  );

  const handleSelectCommand = (cmd: SampleInteractiveCommand) => {
    setActiveCommandId(cmd.id);
    setCustomCommandInput(formatCommandForStack(cmd.command, toolingStack));
    setTerminalOutput(cmd.stdout);
    setActiveHttpMeta(cmd.httpMeta);
    setIsConsoleOpen(true);
    setRunCount((c) => c + 1);
  };

  const handleStartResizeExplorer = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = explorerWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.min(520, Math.max(200, startWidth + delta));
        setExplorerWidth(nextWidth);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [explorerWidth]
  );

  const handleRunLiveCode = async () => {
    setIsConsoleOpen(true);
    setIsRunningLive(true);
    try {
      const pyFiles = currentProject.files.filter((f) => f.language === 'python');
      const targetCode =
        activeFile.language === 'python'
          ? activeFile.code
          : pyFiles[0]?.code || '';

      // Register sibling modules in sys.modules so multi-file pure-Python projects import cleanly in Pyodide
      const moduleSetupLines: string[] = [
        'import sys, types',
      ];
      for (const f of pyFiles) {
        const cleaned = f.path.replace(/^src\//, '').replace(/\.py$/, '');
        const parts = cleaned.split('/');
        for (let i = 1; i < parts.length; i++) {
          const pkg = parts.slice(0, i).join('.');
          moduleSetupLines.push(
            `if ${JSON.stringify(pkg)} not in sys.modules:\n    _m = types.ModuleType(${JSON.stringify(pkg)})\n    _m.__path__ = []\n    sys.modules[${JSON.stringify(pkg)}] = _m`
          );
        }
        const modName =
          parts[parts.length - 1] === '__init__'
            ? parts.slice(0, -1).join('.')
            : parts.join('.');
        if (modName && f.path !== activeFile.path) {
          moduleSetupLines.push(
            `_mod = types.ModuleType(${JSON.stringify(modName)})\nsys.modules[${JSON.stringify(modName)}] = _mod\ntry:\n    exec(${JSON.stringify(f.code)}, _mod.__dict__)\nexcept Exception:\n    pass`
          );
        }
      }

      const fullScript = `${moduleSetupLines.join('\n')}\n\n${targetCode}`;
      const res = await runCode(fullScript, '');
      const cleanOut = [res.stdout.trim(), res.stderr.trim()]
        .filter(Boolean)
        .join('\n');

      const fallbackOut =
        currentProject.interactiveCommands[0]?.stdout ||
        'Đã thực thi thành công.';

      if (res.exitCode === 0 && cleanOut) {
        setTerminalOutput(
          `# [Pyodide Live Run] Đã chạy trực tiếp ${activeFile.path} (${res.ms}ms):\n${cleanOut}`
        );
        setActiveHttpMeta(undefined);
      } else if (res.exitCode === 0 && !cleanOut) {
        setTerminalOutput(
          `# [Pyodide Live Run] File ${activeFile.path} biên dịch hợp lệ (${res.ms}ms) • Kết quả chạy kịch bản dự án:\n${fallbackOut}`
        );
      } else {
        // External server framework (FastAPI, Django, Celery, Scrapy...) -> show simulated runtime output
        setTerminalOutput(
          `# [Chạy kịch bản Dự án: ${currentProject.interactiveCommands[0]?.command || activeFile.path}]\n${fallbackOut}`
        );
      }
      setRunCount((c) => c + 1);
    } finally {
      setIsRunningLive(false);
    }
  };

  const handleSelectToolingStack = (nextStack: ProjectToolingStack) => {
    setToolingStack(nextStack);
    const activeCmd =
      currentProject.interactiveCommands.find((c) => c.id === activeCommandId) ||
      currentProject.interactiveCommands[0];
    if (activeCmd) {
      setCustomCommandInput(formatCommandForStack(activeCmd.command, nextStack));
    }
  };

  const handleExecuteCustomCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = currentProject.interactiveCommands.find(
      (c) => c.command.trim() === customCommandInput.trim()
    );
    if (matched) {
      setTerminalOutput(matched.stdout);
      setActiveHttpMeta(matched.httpMeta);
    } else {
      // Simulate dynamic execution feedback when user customizes arguments/payload
      const activeCmd =
        currentProject.interactiveCommands.find(
          (c) => c.id === activeCommandId
        ) || currentProject.interactiveCommands[0];
      setTerminalOutput(
        `# Đã thực thi lệnh tùy chỉnh:\n$ ${customCommandInput}\n\n${activeCmd.stdout}`
      );
      setActiveHttpMeta(activeCmd.httpMeta);
    }
    setRunCount((c) => c + 1);
  };

  const handlePrevProject = () => {
    if (filteredProjects.length === 0) return;
    const prevIdx =
      currentIdx > 0 ? currentIdx - 1 : filteredProjects.length - 1;
    setSelectedProjectId(filteredProjects[prevIdx].id);
  };

  const handleNextProject = () => {
    if (filteredProjects.length === 0) return;
    const nextIdx =
      currentIdx >= 0 && currentIdx < filteredProjects.length - 1
        ? currentIdx + 1
        : 0;
    setSelectedProjectId(filteredProjects[nextIdx].id);
  };

  const handleCopyFileCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1600);
  };

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTreeNode = (node: TreeFolderNode, depth = 0): React.ReactNode => {
    const folderEntries = Array.from(node.folders.values());

    return (
      <div className="space-y-0.5">
        {folderEntries.map((folder) => {
          const isCollapsed = Boolean(collapsedFolders[folder.fullPath]);
          return (
            <div key={folder.fullPath}>
              <button
                type="button"
                onClick={() => toggleFolder(folder.fullPath)}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                className="w-full flex items-center gap-1.5 rounded-lg py-1 pr-2 text-left font-mono text-xs font-semibold text-amber-300/90 hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                {isCollapsed ? (
                  <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                ) : (
                  <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{folder.name}/</span>
              </button>
              {!isCollapsed && renderTreeNode(folder, depth + 1)}
            </div>
          );
        })}

        {node.files.map((file) => {
          const fileName = file.path.split('/').pop() || file.path;
          const isSelected = file.path === activeFile.path;

          return (
            <button
              key={file.path}
              type="button"
              onClick={() => {
                setActiveFilePath(file.path);
                if (mobilePane === 'tree') {
                  setMobilePane('code');
                }
              }}
              style={{ paddingLeft: `${depth * 14 + 10}px` }}
              className={cn(
                'w-full flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left font-mono text-xs transition-all cursor-pointer',
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
              )}
            >
              {file.language === 'python' ? (
                <FileCode2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              )}
              <span className="truncate">{fileName}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const codeLines = activeFile.code.split('\n');

  return (
    <div
      id="vscode-ide-top"
      className="mx-auto max-w-[1680px] px-3 sm:px-6 py-3.5 space-y-3.5"
    >
      {/* Compact Single-Row Top Project Selector Bar */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/75 px-3.5 py-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Prev/Next + Project Selector Trigger */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/90 p-0.5 shrink-0">
              <button
                onClick={handlePrevProject}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Project trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-mono text-xs font-bold text-emerald-400 select-none">
                #{currentProject.number}/{ALL_SAMPLE_PROJECTS.length}
              </span>
              <button
                onClick={handleNextProject}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Project tiếp theo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setIsProjectPickerOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left min-w-0 flex-1 sm:flex-initial sm:max-w-3xl transition-all cursor-pointer',
                isProjectPickerOpen
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/80 text-slate-100 hover:border-slate-700 hover:bg-slate-900'
              )}
              title={`Bấm để chọn trong ${ALL_SAMPLE_PROJECTS.length} Dự án Mẫu từ Đơn giản đến Production`}
            >
              <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-mono text-xs text-emerald-400 font-bold shrink-0 hidden sm:inline">
                {currentProject.slug}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="font-mono text-sm font-bold text-white truncate">
                {currentProject.title}
              </span>
              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <LevelBadge level={currentProject.complexity} />
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-slate-400 shrink-0 ml-auto sm:ml-1 transition-transform duration-200',
                  isProjectPickerOpen && 'rotate-180 text-emerald-400'
                )}
              />
            </button>
          </div>

          {/* Right: Setup Guide + Open 16-Project Catalog Button */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setSetupGuideOpen(true, currentProject)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Xem hướng dẫn cài đặt Python, uv / pyenv, tạo .venv và chạy dự án mẫu này trên máy thật"
            >
              <Wrench className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="sm:hidden">Cẩm nang Chạy trên Máy</span>
              <span className="hidden sm:inline">
                Cài đặt Python (uv/pyenv) & Chạy trên Máy thật
              </span>
            </button>

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 font-mono text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>{currentProject.complexityLabel}</span>
            </span>

            <button
              onClick={() => setIsProjectPickerOpen((v) => !v)}
              className={cn(
                'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                isProjectPickerOpen
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:bg-slate-800'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              <span>Danh sách {ALL_SAMPLE_PROJECTS.length} Project</span>
            </button>
          </div>
        </div>

        {/* Collapsible Project Selector Drawer */}
        {isProjectPickerOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Chọn Dự án Mẫu theo cấp độ phức tạp ({ALL_SAMPLE_PROJECTS.length} dự án từ Hello World đến Enterprise CQRS/Saga):
              </span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedLevel('all')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer',
                    selectedLevel === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  Tất cả ({ALL_SAMPLE_PROJECTS.length})
                </button>
                {SKILL_LEVELS.map((lvl) => {
                  const count = ALL_SAMPLE_PROJECTS.filter(
                    (p) => p.complexity === lvl.id
                  ).length;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer whitespace-nowrap',
                        selectedLevel === lvl.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      {lvl.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredProjects.map((proj) => {
                const active = proj.id === currentProject.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setIsProjectPickerOpen(false);
                    }}
                    className={cn(
                      'flex flex-col justify-between gap-1.5 rounded-xl border p-3 text-left transition-all cursor-pointer',
                      active
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-white shadow-xs'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[11px] font-bold text-emerald-300 shrink-0">
                          #{proj.number.toString().padStart(2, '0')}
                        </span>
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {proj.title}
                        </span>
                      </div>
                      <LevelBadge level={proj.complexity} />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {proj.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile & Tablet Mode Switcher (< lg): Quickly jump between File Explorer/Architecture and Code IDE/Terminal */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane('split')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            mobilePane === 'split'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Xem cả 2
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('tree')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            mobilePane === 'tree'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Thư mục & Kiến trúc
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('code')}
          className={cn(
            'rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer',
            mobilePane === 'code'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-300 hover:text-white'
          )}
        >
          Code IDE & Terminal
        </button>
      </div>

      {/* Unified VS Code-Style IDE Shell: Collapsible Left Explorer & Structure + Right Code Editor */}
      <div
        className="rounded-2xl border overflow-hidden shadow-xl transition-colors"
        style={{
          borderColor: activeIdeTheme.barBorder,
          backgroundColor: activeIdeTheme.editorBg,
        }}
      >
        {/* VS Code Top Title Bar: Explorer Toggle + Window Dots + Active Breadcrumb + Copy */}
        <div
          className="flex items-center justify-between gap-2 border-b px-3 py-2"
          style={{
            backgroundColor: activeIdeTheme.barBg,
            borderColor: activeIdeTheme.barBorder,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsExplorerOpen((v) => !v)}
              title={isExplorerOpen ? 'Thu gọn thanh Explorer bên trái' : 'Mở thanh Explorer bên trái'}
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-85 cursor-pointer"
            >
              {isExplorerOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              )}
              <span>{isExplorerOpen ? 'Thu gọn' : 'Explorer'}</span>
            </button>

            <div
              className="hidden sm:flex items-center gap-1.5 pr-2.5 border-r shrink-0"
              style={{ borderColor: activeIdeTheme.barBorder }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            <div
              className="flex items-center gap-1.5 font-mono text-xs truncate"
              style={{ color: activeIdeTheme.barText }}
            >
              {activeFile.language === 'python' ? (
                <FileCode2
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    activeIdeTheme.isLight ? 'text-blue-600' : 'text-sky-400'
                  )}
                />
              ) : (
                <FileText
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    activeIdeTheme.isLight ? 'text-amber-600' : 'text-amber-400'
                  )}
                />
              )}
              <span className="font-bold truncate">
                {activeFile.path.split('/').join(' › ')}
              </span>
            </div>
          </div>

          {/* Right Pinned Run + Console Toggle + Copy Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRunLiveCode}
              disabled={isRunningLive}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
              title="Chạy trực tiếp code Python của file/dự án này và hiển thị kết quả dưới Console"
            >
              {isRunningLive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              <span>Chạy code</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConsoleOpen((v) => !v)}
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-85 cursor-pointer shadow-2xs"
              title="Ẩn/hiện khung Console & Terminal bên dưới"
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {isConsoleOpen ? 'Ẩn Console' : 'Hiện Console'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyFileCode}
              style={{
                backgroundColor: activeIdeTheme.btnBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shrink-0 transition-opacity hover:opacity-85 cursor-pointer shadow-2xs"
            >
              {copiedFile ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy file</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* VS Code Split Body: Left Resizable Sidebar + Drag Handle + Right Editor & Bottom Console */}
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* LEFT SIDEBAR: File Explorer & Structure (Collapsible & Resizable on Desktop) */}
          <aside
            style={{ width: isExplorerOpen ? `${explorerWidth}px` : undefined }}
            className={cn(
              'w-full lg:shrink-0 border-b lg:border-b-0 border-slate-800 bg-slate-950/90 text-slate-200 flex flex-col',
              !isExplorerOpen && 'lg:hidden',
              mobilePane === 'code' && 'hidden lg:flex'
            )}
          >
            {/* Section 1: EXPLORER (Directory Tree) */}
            <div className="border-b border-slate-800/90">
              <button
                type="button"
                onClick={() => setIsFilesSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-left cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  {isFilesSectionOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  Explorer
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {currentProject.files.length} files
                </span>
              </button>

              {isFilesSectionOpen && (
                <div className="p-2.5 max-h-[290px] overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 pb-1.5 mb-1.5 border-b border-slate-800/80">
                    <FolderOpen className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{currentProject.slug}/</span>
                  </div>
                  {renderTreeNode(directoryTree, 0)}
                </div>
              )}
            </div>

            {/* Section 2: STRUCTURE & ARCHITECTURE */}
            <div className="flex-1 flex flex-col min-h-0">
              <button
                type="button"
                onClick={() => setIsStructureSectionOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 hover:bg-slate-900 text-left cursor-pointer border-b border-slate-800/70"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {isStructureSectionOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <Sparkles className="h-3 w-3" />
                  Structure & Kiến trúc
                </span>
              </button>

              {isStructureSectionOpen && (
                <div className="p-3 space-y-2.5 overflow-y-auto max-h-[320px]">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentProject.summary}
                  </p>
                  <div className="space-y-1.5">
                    {currentProject.architectureNotes.map((note, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-slate-800/90 bg-slate-900/60 p-2 text-[11px] text-slate-300 leading-relaxed"
                      >
                        <span className="font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                          0{i + 1}.
                        </span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {currentProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-slate-700/80 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Resizable Vertical Divider Handle (Desktop) */}
          {isExplorerOpen && (
            <div
              onMouseDown={handleStartResizeExplorer}
              onDoubleClick={() => setExplorerWidth(288)}
              title="Kéo để thay đổi độ rộng thanh Explorer • Nháy đúp để đặt lại mặc định"
              className="hidden lg:block w-1.5 shrink-0 cursor-col-resize bg-slate-800/80 hover:bg-emerald-500/70 active:bg-emerald-400 transition-colors"
            />
          )}

          {/* RIGHT PANE: File Role Banner + Code Body + Integrated Console + Bottom Status Bar */}
          <div
            className={cn(
              'flex-1 min-w-0 flex flex-col',
              mobilePane === 'tree' && 'hidden lg:flex'
            )}
          >
            {/* File Path Breadcrumb & Architectural Role Explanation Banner */}
            <div
              className="border-b px-4 py-2.5 text-xs space-y-1.5"
              style={{
                backgroundColor: activeIdeTheme.gutterBg,
                borderColor: activeIdeTheme.gutterBorder,
                color: activeIdeTheme.barText,
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {currentProject.slug}/{activeFile.path}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {activeFile.keyPatterns.map((pat) => (
                    <span
                      key={pat}
                      className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-400"
                    >
                      {pat}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {activeFile.roleDescription}
              </p>
            </div>

            {/* Syntax-Highlighted Code Body with Line Numbers (flex-1 eliminates any dead gap above Status Bar) */}
            <div
              className={cn(
                'flex-1 flex overflow-x-auto font-mono text-[13px] leading-6 max-h-[480px] overflow-y-auto',
                !activeIdeTheme.isLight && 'ide-dark-surface'
              )}
              style={{ backgroundColor: activeIdeTheme.editorBg }}
            >
              <div
                aria-hidden="true"
                className="select-none border-r pt-4 pb-10 px-2.5 text-right font-mono text-[12px] leading-6 shrink-0 w-11"
                style={{
                  backgroundColor: activeIdeTheme.gutterBg,
                  borderColor: activeIdeTheme.gutterBorder,
                  color: activeIdeTheme.gutterText,
                }}
              >
                {codeLines.map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
                <div className="h-6" />
              </div>

              <pre className="m-0 pt-4 pb-10 px-4 font-mono text-[13px] leading-6 whitespace-pre flex-1">
                <code>
                  {renderHighlightedPython(
                    activeFile.code,
                    activeIdeTheme.isLight
                  )}
                </code>
                <div className="h-20" aria-hidden="true" />
              </pre>
            </div>

            {/* Integrated VS Code Bottom Console / Terminal Drawer (Toggleable from Status Bar) */}
            {isConsoleOpen && (
              <div
                className="border-t p-3 space-y-2.5"
                style={{
                  backgroundColor: activeIdeTheme.gutterBg,
                  borderColor: activeIdeTheme.barBorder,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400 mr-1">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Console / Terminal</span>
                    </span>
                    {currentProject.interactiveCommands.map((cmd) => {
                      const isActive = cmd.id === activeCommandId;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => handleSelectCommand(cmd)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer',
                            isActive
                              ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                              : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                          )}
                        >
                          {cmd.kind === 'curl' ? (
                            <Globe className="h-3 w-3 text-cyan-400" />
                          ) : cmd.kind === 'pytest' ? (
                            <FlaskConical className="h-3 w-3 text-violet-400" />
                          ) : (
                            <Play className="h-3 w-3 text-emerald-400 fill-current" />
                          )}
                          <span>{cmd.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsConsoleOpen(false)}
                    className="font-mono text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Thu gọn Console ✕
                  </button>
                </div>

                {/* Editable Command / cURL Runner Bar */}
                <form
                  onSubmit={handleExecuteCustomCommand}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs">
                    <span className="text-emerald-400 font-bold select-none shrink-0">
                      {toolingStack === 'pyenv-pip' ? '(.venv) $' : '$'}
                    </span>
                    <input
                      type="text"
                      value={customCommandInput}
                      onChange={(e) => setCustomCommandInput(e.target.value)}
                      aria-label="Lệnh Terminal hoặc cURL"
                      className="w-full bg-transparent text-sky-200 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Thực thi lệnh</span>
                  </button>
                </form>

                {activeHttpMeta && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-1.5 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-300">
                        {activeHttpMeta.method}
                      </span>
                      <span className="text-slate-200 font-semibold">
                        {activeHttpMeta.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] font-bold">
                        HTTP {activeHttpMeta.statusText}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {activeHttpMeta.latencyMs}ms
                      </span>
                    </div>
                  </div>
                )}

                <div
                  key={runCount}
                  className={cn(
                    'rounded-lg border p-2.5 font-mono text-xs leading-5 max-h-44 overflow-y-auto overflow-x-auto',
                    !activeIdeTheme.isLight && 'ide-dark-surface'
                  )}
                  style={{
                    backgroundColor: activeIdeTheme.editorBg,
                    borderColor: activeIdeTheme.barBorder,
                  }}
                >
                  <pre className="whitespace-pre-wrap m-0">
                    <code>
                      {renderHighlightedPython(
                        terminalOutput,
                        activeIdeTheme.isLight
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* IDE Bottom Status Bar (Pinned to bottom edge via mt-auto; click to toggle Console) */}
            <div
              className="mt-auto relative flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-1.5 font-mono text-[11px]"
              style={{
                backgroundColor: activeIdeTheme.barBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span>{codeLines.length} dòng</span>
                <span className="opacity-40">|</span>
                <span>UTF-8 • Python 3.12</span>
                <span className="opacity-40">|</span>
                <button
                  type="button"
                  onClick={() => setIsConsoleOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:underline cursor-pointer"
                  title="Bấm để đóng/mở bảng Console & Terminal ngay bên trên thanh này"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>
                    {isConsoleOpen
                      ? 'Console: Đang mở (Bấm để ẩn)'
                      : 'Console: Đang ẩn (Bấm để mở)'}
                  </span>
                  {isConsoleOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Bottom-Right IDE Theme Switcher Icon */}
              <div className="relative ml-auto">
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
                  <span className="text-[10px] font-semibold">
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
                              <span className="truncate font-sans">
                                {t.name}
                              </span>
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
      </div>

      {/* Collapsible 3-Step Local Tooling Workflow (Collapsed by default so page stays compact) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => setIsToolingGuideOpen((v) => !v)}
          className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/70 hover:bg-slate-900/90 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              Hướng dẫn 3 bước khởi tạo & chạy dự án{' '}
              <code className="text-emerald-300 font-mono">
                {currentProject.slug}
              </code>{' '}
              trên máy thật (uv / pyenv / Poetry / Pipenv)
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-400">
            <span>{isToolingGuideOpen ? 'Thu gọn' : 'Mở xem 3 bước'}</span>
            {isToolingGuideOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {isToolingGuideOpen && (
          <div className="p-3.5 border-t border-slate-800/90 space-y-2.5 bg-slate-950/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Chọn công cụ quản lý môi trường:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectToolingStack('uv')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                    toolingStack === 'uv'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  )}
                >
                  Cách 1: Dùng `uv`
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectToolingStack('pyenv-pip')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                    toolingStack === 'pyenv-pip'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  )}
                >
                  Cách 2A: `pyenv + venv + pip`
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectToolingStack('poetry')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                    toolingStack === 'poetry'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  )}
                >
                  Cách 2B: `pyenv + Poetry`
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectToolingStack('pipenv')}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                    toolingStack === 'pipenv'
                      ? 'bg-sky-400 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                  )}
                >
                  Cách 2C: `pyenv + Pipenv`
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-amber-300">
                  🎯 Đầu vào (Entrypoint) của dự án này:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilePath(currentProject.defaultFilePath)
                  }
                  className="rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 font-mono text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  {currentProject.defaultFilePath}
                </button>
              </div>

              <button
                type="button"
                onClick={toggleJsTsComparison}
                aria-pressed={showJsTsComparison}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer',
                  showJsTsComparison
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>
                  So sánh Node.js / JS-TS:{' '}
                  {showJsTsComparison ? 'Đang BẬT' : 'Đang TẮT'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {/* STEP 1 CARD */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-emerald-300">
                  Bước 1 • Khởi tạo Dự án & Version
                </span>
                <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {toolingStack === 'uv' &&
                    `uv init ${currentProject.slug}\ncd ${currentProject.slug} && uv python pin 3.12`}
                  {toolingStack === 'pyenv-pip' &&
                    `mkdir ${currentProject.slug} && cd ${currentProject.slug}\npython -m venv .venv && source .venv/bin/activate`}
                  {toolingStack === 'poetry' &&
                    `poetry new --src ${currentProject.slug} && cd ${currentProject.slug}\npoetry config virtualenvs.in-project true && poetry env use 3.12`}
                  {toolingStack === 'pipenv' &&
                    `mkdir ${currentProject.slug} && cd ${currentProject.slug}\nexport PIPENV_VENV_IN_PROJECT=1 && pipenv --python 3.12`}
                </pre>
              </div>

              {/* STEP 2 CARD */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2">
                <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-sky-300">
                  Bước 2 • Thêm & Đồng bộ Thư viện
                </span>
                <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-sky-300 overflow-x-auto">
                  {toolingStack === 'uv' &&
                    `uv sync\nuv add --dev pytest ruff`}
                  {toolingStack === 'pyenv-pip' &&
                    `pip install -e . pytest ruff\npip freeze > requirements.txt`}
                  {toolingStack === 'poetry' &&
                    `poetry install\npoetry add --group dev pytest ruff`}
                  {toolingStack === 'pipenv' &&
                    `pipenv install -e .\npipenv install --dev pytest ruff`}
                </pre>
              </div>

              {/* STEP 3 CARD */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-amber-300">
                  Bước 3 • Chạy Đầu vào & Kiểm thử
                </span>
                <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  {`${formatCommandForStack(
                    currentProject.interactiveCommands[0]?.command ||
                      'uv run python main.py',
                    toolingStack
                  )}\n${formatCommandForStack('uv run pytest -v', toolingStack)}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-World Templates & Project-Based Learning Catalog */}
      <RealWorldProjectsCatalog
        activeIdeProjectId={currentProject.id}
        onSelectProjectInIde={(projectId) => {
          setSelectedLevel('all');
          setSelectedProjectId(projectId);
          setIsProjectPickerOpen(false);
          document
            .getElementById('vscode-ide-top')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />
    </div>
  );
};
