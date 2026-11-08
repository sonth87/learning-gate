import React, { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { SetupGuideModal } from '@/components/common/SetupGuideModal';
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
import { IDE_THEMES, getIdeThemeConfig } from '@/utils/ideThemes';
import { renderHighlightedPython } from '@/utils/pythonHighlighter';
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
  const [isLocalSetupOpen, setIsLocalSetupOpen] = useState(false);
  const [toolingStack, setToolingStack] = useState<ProjectToolingStack>('uv');

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
    setRunCount((c) => c + 1);
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
              onClick={() => setActiveFilePath(file.path)}
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
    <div className="mx-auto max-w-[1680px] px-3 sm:px-6 py-3.5 space-y-3.5">
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLocalSetupOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Xem hướng dẫn cài đặt Python, uv / pyenv, tạo .venv và chạy dự án mẫu này trên máy thật"
            >
              <Wrench className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Cài đặt Python (uv/pyenv) & Chạy trên Máy thật</span>
            </button>

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 font-mono text-xs text-slate-300">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>{currentProject.complexityLabel}</span>
            </span>

            <button
              onClick={() => setIsProjectPickerOpen((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                isProjectPickerOpen
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:bg-slate-800'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Danh sách {ALL_SAMPLE_PROJECTS.length} Project Mẫu</span>
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

      {/* Main 12-Column IDE Layout: Left Explorer & Architecture (4 cols) + Right Code Editor & Interactive Terminal (8 cols) */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* LEFT PANE: Directory Tree Explorer + Architecture Standards */}
        <div className="lg:col-span-4 space-y-3.5 min-w-0">
          {/* File Explorer Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  Cấu trúc Thư mục Dự án
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {currentProject.files.length} files
              </span>
            </div>

            <div className="p-3 bg-slate-950/50">
              {/* Project Root Folder Header */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 pb-1.5 mb-1.5 border-b border-slate-800/80">
                <FolderOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{currentProject.slug}/</span>
              </div>

              {renderTreeNode(directoryTree, 0)}
            </div>
          </div>

          {/* Project Overview & Architecture Best Practices Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Chuẩn Tổ chức & Kiến trúc Dự án</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentProject.summary}
            </p>

            <div className="space-y-2 pt-1">
              {currentProject.architectureNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-slate-800/90 bg-slate-950/60 p-2.5 text-xs text-slate-300 leading-relaxed"
                >
                  <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                    0{i + 1}.
                  </span>
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {currentProject.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg border border-slate-700/80 bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Multi-Tab IDE Code Viewer + Interactive Terminal / cURL Playground */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {/* IDE Code Viewer Window */}
          <div
            className="rounded-2xl border overflow-hidden shadow-xl transition-colors"
            style={{
              borderColor: activeIdeTheme.barBorder,
              backgroundColor: activeIdeTheme.editorBg,
            }}
          >
            {/* IDE Open File Tabs Bar: Left Traffic Lights (Fixed) | Middle Scrollable File Tabs | Right Copy Button (Fixed) */}
            <div
              className="flex items-center justify-between border-b px-3 py-2"
              style={{
                backgroundColor: activeIdeTheme.barBg,
                borderColor: activeIdeTheme.barBorder,
              }}
            >
              {/* Left Pinned Window Dots */}
              <div
                className="hidden sm:flex items-center gap-1.5 pr-3 border-r shrink-0"
                style={{ borderColor: activeIdeTheme.barBorder }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>

              {/* Middle Scrollable File Tabs with Clean Margin & Spacing */}
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar px-2 sm:px-3">
                {currentProject.files.map((file) => {
                  const fileName = file.path.split('/').pop() || file.path;
                  const isActive = file.path === activeFile.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setActiveFilePath(file.path)}
                      title={file.path}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all shrink-0 cursor-pointer',
                        isActive
                          ? activeIdeTheme.isLight
                            ? 'border-emerald-600/60 bg-emerald-500/15 text-emerald-800 font-bold shadow-2xs'
                            : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold shadow-2xs'
                          : activeIdeTheme.isLight
                          ? 'border-slate-300/80 bg-white/60 text-slate-700 hover:bg-white hover:text-slate-950'
                          : 'border-slate-800/80 bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800/70'
                      )}
                    >
                      {file.language === 'python' ? (
                        <FileCode2
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            activeIdeTheme.isLight
                              ? 'text-blue-600'
                              : 'text-sky-400'
                          )}
                        />
                      ) : (
                        <FileText
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            activeIdeTheme.isLight
                              ? 'text-amber-600'
                              : 'text-amber-400'
                          )}
                        />
                      )}
                      <span>{fileName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Pinned Copy Button (Never scrolls or overlaps file tabs) */}
              <div
                className="pl-2.5 border-l shrink-0 flex items-center"
                style={{ borderColor: activeIdeTheme.barBorder }}
              >
                <button
                  onClick={handleCopyFileCode}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shrink-0 transition-colors cursor-pointer',
                    activeIdeTheme.isLight
                      ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-2xs'
                      : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-2xs'
                  )}
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

            {/* Syntax-Highlighted Code Body with Line Numbers */}
            <div
              className={cn(
                'flex overflow-x-auto font-mono text-[13px] leading-6 max-h-[420px] overflow-y-auto',
                !activeIdeTheme.isLight && 'ide-dark-surface'
              )}
              style={{ backgroundColor: activeIdeTheme.editorBg }}
            >
              <div
                aria-hidden="true"
                className="select-none border-r py-4 px-2.5 text-right font-mono text-[12px] leading-6 shrink-0 w-11"
                style={{
                  backgroundColor: activeIdeTheme.gutterBg,
                  borderColor: activeIdeTheme.gutterBorder,
                  color: activeIdeTheme.gutterText,
                }}
              >
                {codeLines.map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>

              <pre className="m-0 p-4 font-mono text-[13px] leading-6 whitespace-pre flex-1">
                <code>
                  {renderHighlightedPython(
                    activeFile.code,
                    activeIdeTheme.isLight
                  )}
                </code>
              </pre>
            </div>

            {/* IDE Bottom Status Bar + Bottom-Right Theme Switcher Icon */}
            <div
              className="relative flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-1.5 font-mono text-[11px]"
              style={{
                backgroundColor: activeIdeTheme.barBg,
                borderColor: activeIdeTheme.barBorder,
                color: activeIdeTheme.barText,
              }}
            >
              <div className="flex items-center gap-3">
                <span>{codeLines.length} dòng</span>
                <span className="opacity-40">|</span>
                <span>UTF-8 • Python 3.12</span>
              </div>

              {/* Bottom-Right IDE Theme Switcher Icon */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setIsThemeMenuOpen((v) => !v)}
                  title="Đổi màu nền & giao diện IDE (Tự động lưu)"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer',
                    activeIdeTheme.isLight
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                  )}
                >
                  <Palette className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="flex items-center gap-0.5">
                    {activeIdeTheme.swatchColors.map((hex, i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full border border-black/20"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                  <span className="text-[10px]">
                    {activeIdeTheme.name.split(' (')[0]}
                  </span>
                </button>

                {isThemeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsThemeMenuOpen(false)}
                    />
                    <div className="absolute right-0 bottom-8 z-40 w-64 rounded-2xl border border-slate-700 bg-slate-900 p-2 text-slate-100 shadow-2xl space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
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
                            className={cn(
                              'w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                              active
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'hover:bg-slate-800 text-slate-200'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="flex items-center gap-0.5 rounded-md border border-slate-700 p-1 shrink-0"
                                style={{ backgroundColor: t.editorBg }}
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
                              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
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

          {/* Interactive Terminal & Dual-Track Project Management Workflow */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3.5 shadow-xl">
            {/* Project Management Tooling Switcher (Method 1: uv vs Method 2: pyenv/pip, Poetry, Pipenv) */}
            <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">
                    Chọn Phương pháp Quản lý Dự án & Chạy Lệnh (Xuyên suốt 16 Project):
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

              {/* Detailed 3-Step Guided Cards with Explanations + Python Old + Node.js Comparison */}
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
                    title="Bấm để mở ngay file đầu vào (Entrypoint) của dự án này"
                  >
                    {currentProject.defaultFilePath}
                  </button>
                  <span className="hidden lg:inline text-[11px] text-slate-400">
                    (File chứa hàm khởi chạy chính • Cấu hình thư viện nằm ở{' '}
                    <button
                      type="button"
                      onClick={() => setActiveFilePath('pyproject.toml')}
                      className="text-amber-300 underline hover:text-amber-200 cursor-pointer font-mono"
                    >
                      pyproject.toml
                    </button>
                    )
                  </span>
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
                <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-emerald-300">
                        Bước 1 • Khởi tạo Dự án & Version
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        .python-version + .venv
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {toolingStack === 'uv' &&
                        'Thay vì tự tạo thư mục, môi trường ảo .venv và file cấu hình thủ công, bạn chỉ cần chạy uv init và ghim Python 3.12:'}
                      {toolingStack === 'pyenv-pip' &&
                        'Tạo thư mục dự án, dùng pyenv chọn Python 3.12.7, tạo thư mục môi trường ảo .venv và kích hoạt (activate) nó lên:'}
                      {toolingStack === 'poetry' &&
                        'Khởi tạo dự án với Poetry (bật chế độ đặt .venv ngay trong dự án) và chọn phiên bản Python 3.12:'}
                      {toolingStack === 'pipenv' &&
                        'Tạo thư mục dự án, đặt biến lưu .venv trong dự án và khởi tạo Pipenv với Python 3.12:'}
                    </p>
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

                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80 text-[10px]">
                    <div className="text-slate-400">
                      <strong className="text-sky-300">• Tương ứng Python khác:</strong>{' '}
                      <code className="font-mono text-slate-200">
                        {toolingStack === 'uv'
                          ? 'mkdir app && cd app && python -m venv .venv'
                          : 'uv init ' + currentProject.slug}
                      </code>
                    </div>
                    {showJsTsComparison && (
                      <div className="text-cyan-300/90">
                        <strong>• Tương ứng Node.js:</strong>{' '}
                        <code className="font-mono text-cyan-200">
                          mkdir {currentProject.slug} && cd {currentProject.slug}{' '}
                          && npm init -y
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 2 CARD */}
                <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-sky-300">
                        Bước 2 • Thêm & Đồng bộ Thư viện
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        pyproject.toml ≈ package.json
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {toolingStack === 'uv' &&
                        'uv tự động tạo thư mục .venv (tương đương node_modules), tải thư viện siêu tốc, ghi vào pyproject.toml và khóa vào uv.lock:'}
                      {toolingStack === 'pyenv-pip' &&
                        'Khi đã đứng trong (.venv), dùng pip để cài đặt thư viện cùng source code dự án (-e .) và lưu danh sách ra requirements.txt:'}
                      {toolingStack === 'poetry' &&
                        'Poetry tự động tải thư viện vào .venv, ghi nhận vào pyproject.toml và khóa chặt phiên bản vào file poetry.lock:'}
                      {toolingStack === 'pipenv' &&
                        'Pipenv cài đặt thư viện vào .venv, ghi nhận vào Pipfile và khóa mã băm SHA256 vào Pipfile.lock:'}
                    </p>
                    <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-sky-300 overflow-x-auto">
                      {toolingStack === 'uv' &&
                        `# Đồng bộ từ pyproject.toml (hoặc thêm mới: uv add <gói>):\nuv sync\nuv add --dev pytest ruff`}
                      {toolingStack === 'pyenv-pip' &&
                        `# Cài package dự án (-e .) + công cụ test:\npip install -e . pytest ruff\npip freeze > requirements.txt`}
                      {toolingStack === 'poetry' &&
                        `# Cài từ pyproject.toml (hoặc: poetry add <gói>):\npoetry install\npoetry add --group dev pytest ruff`}
                      {toolingStack === 'pipenv' &&
                        `# Cài vào Pipfile & khóa Pipfile.lock:\npipenv install -e .\npipenv install --dev pytest ruff`}
                    </pre>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80 text-[10px]">
                    <div className="text-slate-400">
                      <strong className="text-sky-300">• Tương ứng Python khác:</strong>{' '}
                      <code className="font-mono text-slate-200">
                        {toolingStack === 'uv'
                          ? 'pip install <gói> && pip freeze > requirements.txt'
                          : 'uv add <gói> / uv sync'}
                      </code>
                    </div>
                    {showJsTsComparison && (
                      <div className="text-cyan-300/90">
                        <strong>• Tương ứng Node.js:</strong>{' '}
                        <code className="font-mono text-cyan-200">
                          npm install &lt;gói&gt; / pnpm install
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* STEP 3 CARD */}
                <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-extrabold text-amber-300">
                        Bước 3 • Chạy Đầu vào & Kiểm thử
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Entrypoint Runner
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {toolingStack === 'uv' &&
                        'Lệnh uv run đảm bảo code luôn chạy bên trong môi trường ảo .venv của dự án mà bạn không cần bận tâm việc activate thủ công:'}
                      {toolingStack === 'pyenv-pip' &&
                        'Khi môi trường (.venv) đang được kích hoạt (activate), bạn gọi trực tiếp lệnh python và pytest để chạy điểm đầu vào của dự án:'}
                      {toolingStack === 'poetry' &&
                        'Dùng lệnh poetry run để thực thi điểm đầu vào của dự án và chạy bộ kiểm thử bên trong môi trường ảo của Poetry:'}
                      {toolingStack === 'pipenv' &&
                        'Dùng lệnh pipenv run để chạy điểm đầu vào của dự án bên trong môi trường ảo đã khóa của Pipenv:'}
                    </p>
                    <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-amber-300 overflow-x-auto">
                      {`${formatCommandForStack(
                        currentProject.interactiveCommands[0]?.command ||
                          'uv run python main.py',
                        toolingStack
                      )}\n${formatCommandForStack('uv run pytest -v', toolingStack)}`}
                    </pre>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-800/80 text-[10px]">
                    <div className="text-slate-400">
                      <strong className="text-sky-300">• Tương ứng Python khác:</strong>{' '}
                      <code className="font-mono text-slate-200">
                        {toolingStack === 'uv'
                          ? 'source .venv/bin/activate && ' +
                            formatCommandForStack(
                              currentProject.interactiveCommands[0]?.command ||
                                'uv run python main.py',
                              'pyenv-pip'
                            )
                          : currentProject.interactiveCommands[0]?.command}
                      </code>
                    </div>
                    {showJsTsComparison && (
                      <div className="text-cyan-300/90">
                        <strong>• Tương ứng Node.js:</strong>{' '}
                        <code className="font-mono text-cyan-200">
                          node index.js / npm start &amp;&amp; npm test
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Terminal Tương tác & Giả lập Gọi API / cURL / Pytest
                </h3>
              </div>

              <span className="font-mono text-[11px] text-slate-400">
                Bấm vào kịch bản bên dưới hoặc sửa tham số lệnh rồi nhấn Thực thi
              </span>
            </div>

            {/* Preset Interactive Command / cURL Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {currentProject.interactiveCommands.map((cmd) => {
                const isActive = cmd.id === activeCommandId;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => handleSelectCommand(cmd)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                      isActive
                        ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-xs'
                        : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    )}
                  >
                    {cmd.kind === 'curl' ? (
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    ) : cmd.kind === 'pytest' ? (
                      <FlaskConical className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-emerald-400 fill-current" />
                    )}
                    <span>{cmd.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Editable Command / cURL Runner Bar */}
            <form
              onSubmit={handleExecuteCustomCommand}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs">
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Thực thi</span>
              </button>
            </form>

            {/* HTTP Response Status Pill (for cURL / FastAPI / RAG commands) */}
            {activeHttpMeta && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                    {activeHttpMeta.method}
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {activeHttpMeta.endpoint}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-bold',
                      activeHttpMeta.statusCode >= 200 &&
                        activeHttpMeta.statusCode < 300
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    )}
                  >
                    HTTP {activeHttpMeta.statusText}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Latency: {activeHttpMeta.latencyMs}ms
                  </span>
                </div>
              </div>
            )}

            {/* Terminal Output Console */}
            <div
              key={runCount}
              className={cn(
                'rounded-xl border p-3.5 font-mono text-xs leading-5 overflow-x-auto animate-in fade-in duration-150',
                !activeIdeTheme.isLight && 'ide-dark-surface'
              )}
              style={{
                backgroundColor: activeIdeTheme.editorBg,
                borderColor: activeIdeTheme.barBorder,
              }}
            >
              <div
                className="flex items-center justify-between text-[11px] pb-2 mb-2 border-b"
                style={{
                  color: activeIdeTheme.gutterText,
                  borderColor: activeIdeTheme.barBorder,
                }}
              >
                <span>
                  Terminal Output ({currentProject.slug}) — Lần chạy #{runCount}
                </span>
                <span className="text-emerald-400 font-semibold">
                  ✓ Ready
                </span>
              </div>
              <pre className="whitespace-pre-wrap">
                <code>
                  {renderHighlightedPython(
                    terminalOutput,
                    activeIdeTheme.isLight
                  )}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Local Environment & Project Setup Modal */}
      <SetupGuideModal
        isOpen={isLocalSetupOpen}
        onClose={() => setIsLocalSetupOpen(false)}
        sampleProject={currentProject}
      />
    </div>
  );
};
