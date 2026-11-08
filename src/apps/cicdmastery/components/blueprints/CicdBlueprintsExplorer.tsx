import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FileCode2,
  Terminal,
  Play,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CICD_FULL_FLOW_BLUEPRINTS } from '../../data/cicdBlueprintsData';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { CodeBlock } from '@/components/common/CodeBlock';
import { cn } from '@/utils/cn';

export const CicdBlueprintsExplorer: React.FC = () => {
  const { selectedBlueprintId, selectBlueprint } = useCicdNavigationStore();

  const blueprint =
    CICD_FULL_FLOW_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) ||
    CICD_FULL_FLOW_BLUEPRINTS[0];

  const [selectedFilePath, setSelectedFilePath] = useState(
    blueprint.files[0].path
  );
  const [terminalOutput, setTerminalOutput] = useState(
    blueprint.interactiveCommands[0]?.simulatedOutput || ''
  );

  useEffect(() => {
    setSelectedFilePath(blueprint.files[0].path);
    setTerminalOutput(blueprint.interactiveCommands[0]?.simulatedOutput || '');
  }, [blueprint]);

  const activeFile =
    blueprint.files.find((f) => f.path === selectedFilePath) ||
    blueprint.files[0];

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Blueprint Selector Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CICD_FULL_FLOW_BLUEPRINTS.map((bp) => {
          const active = bp.id === blueprint.id;
          return (
            <button
              key={bp.id}
              onClick={() => selectBlueprint(bp.id)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all flex flex-col justify-between gap-2',
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-white ring-2 ring-cyan-400/50 shadow-md'
                  : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                    {bp.badge}
                  </span>
                  <LevelBadge level={bp.level} size="sm" />
                </div>
                <div className="text-xs font-bold leading-snug">{bp.title}</div>
              </div>
              <div className="font-mono text-[10px] text-amber-300">
                📄 {bp.pdfRef}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Blueprint Overview & ASCII Architecture */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase text-cyan-400">
            {blueprint.badge} • {blueprint.pdfRef}
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">
            {blueprint.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {blueprint.architectureOverview}
          </p>
        </div>

        <div className="ide-dark-surface rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-x-auto">
          <div className="text-[11px] font-bold uppercase text-amber-400 mb-1.5">
            Sơ đồ Luồng Thực thi Tổng thể (End-to-End Flow):
          </div>
          <pre className="font-mono text-xs leading-relaxed text-cyan-200">
            {blueprint.asciiFlow}
          </pre>
        </div>
      </div>

      {/* File Tree + Code Inspector + Simulated Runner */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left File Tree & Highlights (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-200">
            <FolderGit2 className="h-4 w-4 text-cyan-400" />
            <span>Các Mảnh ghép Cấu hình trong Bộ mẫu</span>
          </div>

          <div className="space-y-2">
            {blueprint.files.map((f) => {
              const active = f.path === activeFile.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelectedFilePath(f.path)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition-all space-y-1',
                    active
                      ? 'border-cyan-500/50 bg-cyan-500/15 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                      {f.path}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                      {f.roleBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{f.summary}</p>
                </button>
              );
            })}
          </div>

          {/* Highlights of Active File */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Điểm nhấn Kỹ thuật trong {activeFile.path}:</span>
            </div>
            {activeFile.highlights.map((hl, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 text-xs"
              >
                <div className="font-bold text-white">{hl.title}</div>
                <p className="text-slate-300">{hl.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right File Code & Interactive Terminal Simulation (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-white">
                📄 {activeFile.path}
              </span>
              <span className="text-xs text-slate-400">{activeFile.summary}</span>
            </div>
            <CodeBlock code={activeFile.content} language={activeFile.language} />
          </div>

          {/* Interactive Command Simulator */}
          <div className="ide-dark-surface rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                <Terminal className="h-4 w-4" />
                <span>Chạy Thử Kịch bản Thực thi của {blueprint.badge}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {blueprint.interactiveCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTerminalOutput(cmd.simulatedOutput)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <pre className="font-mono text-xs leading-relaxed text-emerald-300 overflow-x-auto whitespace-pre-wrap p-2">
              {terminalOutput}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
