import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Wrench,
  Code2,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Laptop,
  Monitor,
  Server,
  FolderGit2,
  Layers,
  Package,
  ArrowRightLeft,
  Compass,
  FileCode2,
  Play,
  Zap,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SampleProject } from '@/types/sample.types';
import { PythonLibrariesEncyclopedia } from '@/components/libraries/PythonLibrariesEncyclopedia';
import { PythonQuickSyntaxGuide } from '@/components/glossary/PythonQuickSyntaxGuide';
import { cn } from '@/utils/cn';

export interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleProject?: SampleProject;
}

type OsType = 'macos' | 'windows' | 'linux';
type GuideTab =
  | 'zero-anatomy'
  | 'quick-syntax'
  | 'uv-workflow'
  | 'non-uv-workflow'
  | 'libraries'
  | 'ide'
  | 'troubleshoot'
  | 'project';
type NonUvStack = 'pyenv-venv-pip' | 'poetry' | 'pipenv';

interface StepComparisonItem {
  label: string;
  command: string;
  note?: string;
}

const GuidedStepBlock: React.FC<{
  stepNumber: string;
  title: string;
  badge?: string;
  explanation: string;
  code: string;
  pythonOtherEquivalents?: StepComparisonItem[];
  nodeJsEquivalents?: StepComparisonItem[];
  showJsTsComparison: boolean;
}> = ({
  stepNumber,
  title,
  badge,
  explanation,
  code,
  pythonOtherEquivalents,
  nodeJsEquivalents,
  showJsTsComparison,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 overflow-hidden shadow-md">
      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 font-mono text-xs font-extrabold text-emerald-300 shrink-0">
            {stepNumber}
          </span>
          <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
            {title}
          </h4>
          {badge && (
            <span className="hidden sm:inline-flex rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Đã copy</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy lệnh</span>
            </>
          )}
        </button>
      </div>

      {/* Plain-language Explanation for Beginners */}
      <div className="px-4 py-3 text-xs text-slate-200 leading-relaxed border-b border-slate-800/60 bg-slate-900/50">
        {explanation}
      </div>

      {/* Annotated Command Block */}
      <pre className="p-4 font-mono text-xs leading-relaxed text-emerald-300 overflow-x-auto select-text bg-slate-950/60">
        {code}
      </pre>

      {/* Equivalents Footer: Other Python tools + Conditional Node.js / JS-TS Comparison */}
      {((pythonOtherEquivalents && pythonOtherEquivalents.length > 0) ||
        (showJsTsComparison &&
          nodeJsEquivalents &&
          nodeJsEquivalents.length > 0)) && (
        <div className="border-t border-slate-800/80 bg-slate-950/90 px-4 py-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            🔄 Tương ứng với:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pythonOtherEquivalents && pythonOtherEquivalents.length > 0 && (
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-2.5 space-y-1.5">
                <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 shrink-0" />
                  <span>Python (Công cụ khác / Truyền thống):</span>
                </div>
                {pythonOtherEquivalents.map((item, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="text-[11px] text-slate-400 font-medium">
                      • {item.label}:
                    </div>
                    <code className="block rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-sky-200 overflow-x-auto">
                      {item.command}
                    </code>
                    {item.note && (
                      <div className="text-[10px] text-slate-400 italic">
                        {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showJsTsComparison &&
              nodeJsEquivalents &&
              nodeJsEquivalents.length > 0 && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-2.5 space-y-1.5">
                  <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
                    <span>Node.js / JS / TS (Để bạn dễ hình dung):</span>
                  </div>
                  {nodeJsEquivalents.map((item, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="text-[11px] text-slate-300 font-medium">
                        • {item.label}:
                      </div>
                      <code className="block rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                        {item.command}
                      </code>
                      {item.note && (
                        <div className="text-[10px] text-cyan-300/80 italic">
                          {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  sampleProject,
}) => {
  const { selectLesson } = useNavigationStore();
  const { showJsTsComparison, toggleJsTsComparison } = useSettingsStore();
  const [selectedOs, setSelectedOs] = useState<OsType>('macos');
  const [activeTab, setActiveTab] = useState<GuideTab>(
    sampleProject ? 'project' : 'zero-anatomy'
  );
  const [nonUvStack, setNonUvStack] = useState<NonUvStack>('pyenv-venv-pip');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(sampleProject ? 'project' : 'zero-anatomy');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, sampleProject]);

  if (!isOpen) return null;

  const handleOpenLesson = (lessonId: string) => {
    selectLesson(lessonId);
    onClose();
  };

  const baseCmd = (
    sampleProject?.interactiveCommands[0]?.command || 'uv run python main.py'
  ).replace(/^uv run\s+/, '');

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col bg-slate-950 lg:bg-slate-950/85 lg:items-center lg:justify-center lg:p-4 lg:backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-slate-950 overflow-hidden lg:h-auto lg:max-h-[92%] lg:max-w-6xl lg:rounded-2xl lg:border lg:border-slate-700/80 lg:shadow-2xl"
      >
        {/* Top Header: Full-screen Mobile Navigation Bar (< lg) & Desktop Modal Header (lg+) */}
        <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-900/95 px-3 py-2.5 sm:px-5 sm:py-3 shrink-0">
          {/* Row 1: Back/Close + Title + Desktop Actions + Always-Visible Close Button */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* Mobile & Tablet Back Button (< lg) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Quay lại"
              className="inline-flex lg:hidden items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs font-extrabold text-slate-100 active:scale-95 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Quay lại</span>
            </button>

            {/* Title Area (properly constrained with flex-1 min-w-0 so it NEVER pushes Close button off-screen) */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="hidden sm:flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Wrench className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-xs sm:text-sm lg:text-base font-extrabold text-white truncate">
                    Cẩm nang Cài đặt & Quản lý Dự án Python
                  </h2>
                  <span className="hidden xl:inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shrink-0">
                    Từ Zero đến Production
                  </span>
                </div>
                <p className="hidden md:block text-xs text-slate-400 truncate">
                  Giải thích từ gốc pyproject.toml, .venv, Entrypoint và 2 phương pháp quản lý dự án (Dùng uv & Không dùng uv)
                </p>
              </div>
            </div>

            {/* Always-Visible Close Button (Mobile, Tablet & Desktop) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cẩm nang"
              className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-extrabold text-rose-200 hover:bg-rose-500/25 hover:text-white active:scale-95 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Đóng</span>
            </button>
          </div>

          {/* Row 2: Quick Lesson Shortcuts & JS/TS Toggle (Scrollable horizontally without pushing layout) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={toggleJsTsComparison}
              aria-pressed={showJsTsComparison}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer',
                showJsTsComparison
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
              )}
              title="Ẩn / Hiện phần so sánh tương đương với Node.js (JS/TS)"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
              <span>
                So sánh JS/TS: {showJsTsComparison ? 'BẬT' : 'TẮT'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenLesson('s0-install-setup-uv-pyenv-ide')}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Bài 1.0A (uv)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenLesson('s0-workflow-pyenv-venv-poetry-pipenv')
              }
              className="inline-flex items-center gap-1 rounded-xl bg-sky-500/15 border border-sky-500/40 px-2.5 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span>Bài 1.0B (pyenv/Poetry)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleOpenLesson('s0-stdlib-and-third-party-ecosystem')
              }
              className="inline-flex items-center gap-1 rounded-xl bg-violet-500/15 border border-violet-500/40 px-2.5 py-1 text-[11px] font-bold text-violet-300 hover:bg-violet-500/25 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Bài 1.0C (Thư viện)</span>
            </button>
          </div>
        </div>

        {/* OS Selector + Main Workflow Tabs Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/40 px-3 py-2 sm:px-6">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:overflow-x-auto no-scrollbar py-0.5">
            {sampleProject && (
              <button
                type="button"
                onClick={() => setActiveTab('project')}
                className={cn(
                  'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                  activeTab === 'project'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                )}
              >
                <FolderGit2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Chạy Dự án #{sampleProject.number}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('zero-anatomy')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'zero-anatomy'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">0. Giải phẫu Dự án</span>
              <span className="hidden sm:inline">0. Giải phẫu Dự án từ Zero (Cần biết trước tiên!)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quick-syntax')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'quick-syntax'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-amber-200 border border-amber-500/35 hover:border-amber-500/60'
              )}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">⚡ Cú pháp Nhanh</span>
              <span className="hidden sm:inline">⚡ Khai báo & Cú pháp Nhanh (Quick & Easy)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('uv-workflow')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'uv-workflow'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">Cách 1: Dùng `uv`</span>
              <span className="hidden sm:inline">Cách 1: Quản lý Dự án bằng `uv`</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('non-uv-workflow')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'non-uv-workflow'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">Cách 2: pyenv / Poetry</span>
              <span className="hidden sm:inline">Cách 2: Không dùng `uv` (pyenv / pip / Poetry / Pipenv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('libraries')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'libraries'
                  ? 'bg-violet-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden truncate">📚 Thư viện Python</span>
              <span className="hidden sm:inline">📚 Thư viện Chuẩn & Thực chiến (Stdlib & Third-Party)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ide')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'ide'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">VS Code / Cursor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('troubleshoot')}
              className={cn(
                'inline-flex items-center justify-center sm:justify-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer truncate',
                activeTab === 'troubleshoot'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Sửa Lỗi</span>
            </button>
          </div>

          {/* OS Selector Pills */}
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 shrink-0">
            <span className="flex items-center justify-center px-1.5 text-[11px] font-semibold text-slate-400">
              OS:
            </span>
            <button
              type="button"
              onClick={() => setSelectedOs('macos')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'macos'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Laptop className="h-3.5 w-3.5 shrink-0" />
              <span>macOS</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOs('windows')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'windows'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <span>Windows</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOs('linux')}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer',
                selectedOs === 'linux'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Server className="h-3.5 w-3.5 shrink-0" />
              <span>Linux</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ===================================================================== */}
          {/* TAB 00: PROJECT ANATOMY FROM ZERO (pyproject.toml, .venv, Entrypoint) */}
          {/* ===================================================================== */}
          {activeTab === 'zero-anatomy' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Dành cho Người mới hoàn toàn với Python (Đi từ con số 0)
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Mở một dự án Python ra thì gồm những file gì? Đầu vào (Entrypoint) nằm ở đâu? Cần gì để chạy được?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Khi mới chuyển sang Python, bạn sẽ thấy những cái tên lạ lẫm như{' '}
                  <code>pyproject.toml</code>, <code>.venv</code>,{' '}
                  <code>__init__.py</code>, <code>if __name__ == &quot;__main__&quot;:</code>.
                  Hãy xem giải phẫu chi tiết từng thành phần ngay dưới đây:
                </p>
              </div>

              {/* 1. Anatomy of Files in a Python Project */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-emerald-300 flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 shrink-0" />
                  <span>
                    1. Giải nghĩa 6 File & Thư mục Cốt lõi trong mọi Dự án Python
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      name: 'pyproject.toml',
                      role: 'Trái tim cấu hình của dự án Python hiện đại (Chuẩn PEP 621)',
                      detail:
                        'Khai báo tên dự án, phiên bản Python yêu cầu (requires-python = ">=3.12"), danh sách các thư viện cần cài (dependencies), thư viện dev (pytest, ruff) và cấu hình công cụ.',
                      jsEquivalent:
                        'Chính là file package.json trong Node.js!',
                    },
                    {
                      name: '.venv/ (Thư mục Môi trường ảo)',
                      role: 'Thư mục cô lập chứa Python và toàn bộ thư viện đã tải về của riêng dự án',
                      detail:
                        'Khác với npm mặc định cài gói vào ./node_modules, pip của Python mặc định cài vào ổ cứng chung của hệ điều hành gây xung đột. Vì vậy ta tạo thư mục .venv/ ngay trong dự án để nhốt toàn bộ thư viện vào .venv/lib/python3.12/site-packages/. Luôn cho .venv/ vào .gitignore!',
                      jsEquivalent:
                        'Chính là thư mục node_modules/ + bản sao binary node riêng cho dự án!',
                    },
                    {
                      name: 'uv.lock / poetry.lock / requirements.txt',
                      role: 'File khóa cứng phiên bản thư viện (Lockfile)',
                      detail:
                        'Trong khi pyproject.toml chỉ ghi khoảng phiên bản (VD: fastapi>=0.115), file lock ghi chính xác từng con số phiên bản và mã SHA256 của mọi thư viện con để máy bạn và server chạy giống nhau 100%.',
                      jsEquivalent:
                        'Chính là package-lock.json / pnpm-lock.yaml / yarn.lock!',
                    },
                    {
                      name: '.python-version',
                      role: 'File ghim phiên bản Python của dự án',
                      detail:
                        'Chỉ chứa đúng 1 dòng văn bản (ví dụ: 3.12 hoặc 3.12.7). Khi bạn cd vào thư mục dự án, uv hoặc pyenv đọc file này để tự động dùng đúng Python 3.12.',
                      jsEquivalent: 'Chính là file .nvmrc hoặc .node-version!',
                    },
                    {
                      name: '__init__.py (Nằm trong các thư mục code)',
                      role: 'File đánh dấu một thư mục là một Python Package có thể import được',
                      detail:
                        'Có thể để trống (0 byte) hoặc dùng để gom các hàm/class xuất ra ngoài. Nhờ có file này trong src/my_app/__init__.py mà bạn mới viết được lệnh: from my_app.services import ...',
                      jsEquivalent:
                        'Tương tự file index.ts / index.js đại diện cho cả thư mục module!',
                    },
                    {
                      name: '__pycache__/ (*.pyc)',
                      role: 'Thư mục bộ nhớ đệm Bytecode do Python tự sinh ra khi chạy',
                      detail:
                        'Khi bạn chạy code, Python dịch file .py sang mã Bytecode (.pyc) và lưu vào __pycache__/ để lần chạy sau khởi động nhanh hơn. Bạn không bao giờ sửa thư mục này và luôn đưa vào .gitignore.',
                      jsEquivalent:
                        'Tương tự thư mục cache biên dịch .next/cache hoặc dist/.tsbuildinfo.',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5"
                    >
                      <div className="font-mono text-xs font-extrabold text-amber-300">
                        {item.name}
                      </div>
                      <div className="text-xs font-bold text-white">
                        {item.role}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {item.detail}
                      </p>
                      {showJsTsComparison && (
                        <div className="mt-1 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                          💡 <strong>So với Node.js/JS:</strong>{' '}
                          {item.jsEquivalent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. What is the Entrypoint of a Python Project & How to Know Which File to Run? */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-sky-300 flex items-center gap-2">
                  <Play className="h-4 w-4 shrink-0" />
                  <span>
                    2. Đầu vào (Entrypoint) của 1 dự án Python là gì? Làm sao biết phải chạy file nào?
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {showJsTsComparison
                    ? 'Trong Node.js, bạn nhìn vào mục "main" hoặc "scripts": { "start": "node index.js" } trong package.json để biết chạy file nào. '
                    : ''}
                  Trong Python, có <strong>3 kiểu đầu vào (Entrypoint)</strong> chuẩn mà bạn sẽ gặp trong mọi dự án:
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                    <span className="inline-block rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                      Kiểu 1 • Dự án nhỏ / Script đơn
                    </span>
                    <div className="text-xs font-bold text-white">
                      File <code>main.py</code> (hoặc <code>app.py</code>) ở gốc dự án
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Cuối file luôn có dòng chốt chặn:{' '}
                      <code className="text-amber-300">
                        if __name__ == &quot;__main__&quot;: main()
                      </code>{' '}
                      (nghĩa là: khi chạy trực tiếp file này thì gọi hàm{' '}
                      <code>main()</code>).
                    </p>
                    <pre className="rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {`# Chạy bằng uv:\nuv run main.py\n\n# Chạy bằng python (.venv):\npython main.py`}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                    <span className="inline-block rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                      Kiểu 2 • Dự án Chuẩn Nhiều File (src/ layout)
                    </span>
                    <div className="text-xs font-bold text-white">
                      File <code>src/&lt;tên_package&gt;/main.py</code>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Khi code chia vào thư mục <code>src/</code>, ta{' '}
                      <strong>chạy từ thư mục gốc bằng cờ <code>-m</code> (Module mode)</strong>{' '}
                      để Python nạp đúng đường dẫn <code>import</code> của toàn dự án:
                    </p>
                    <pre className="rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-sky-300 overflow-x-auto">
                      {`# Chạy module bằng cờ -m:\nuv run python -m ten_package.main\n\n# Hoặc trong (.venv):\npython -m ten_package.main`}
                    </pre>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                    <span className="inline-block rounded bg-violet-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
                      Kiểu 3 • Web API (FastAPI / Django) & CLI
                    </span>
                    <div className="text-xs font-bold text-white">
                      Qua ASGI Server (<code>uvicorn</code>) hoặc{' '}
                      <code>[project.scripts]</code>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Với Web FastAPI, đầu vào là đối tượng{' '}
                      <code>app = FastAPI()</code> trong <code>main.py</code>. Với CLI, đầu vào khai báo trong mục{' '}
                      <code>[project.scripts]</code> của <code>pyproject.toml</code>:
                    </p>
                    <pre className="rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-violet-300 overflow-x-auto">
                      {`# Chạy Web Server FastAPI:\nuv run uvicorn app.main:app --reload\n\n# Chạy bộ kiểm thử Pytest:\nuv run pytest`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 3. Annotated pyproject.toml Example */}
              <GuidedStepBlock
                stepNumber="Giải phẫu"
                title="Bên trong file 'pyproject.toml' có gì? (Đọc hiểu từng dòng có comment)"
                badge="pyproject.toml ≈ package.json"
                explanation="Đây là nội dung thực tế của một file pyproject.toml chuẩn trong dự án Python. Mỗi mục đều được comment giải thích rõ vai trò để bạn nhìn vào bất kỳ dự án nào cũng hiểu ngay:"
                code={`[project]
name = "order-service"                  # Tên dự án (giống "name" trong package.json)
version = "0.1.0"                       # Phiên bản dự án (giống "version")
description = "Dịch vụ xử lý đơn hàng"
requires-python = ">=3.12"              # Yêu cầu máy phải dùng Python từ 3.12 trở lên (giống "engines")

# Danh sách thư viện chạy chính thức (Tự động thêm vào khi bạn gõ 'uv add <tên_gói>')
# -> Giống mục "dependencies" trong package.json
dependencies = [
    "fastapi>=0.115.0",
    "pydantic>=2.9.0",
]

# Điểm vào dòng lệnh (Entrypoint CLI): Gõ 'uv run start-order' sẽ gọi hàm main() trong file main.py!
# -> Giống mục "bin" hoặc "scripts" trong package.json
[project.scripts]
start-order = "order_service.main:main"

# Danh sách thư viện chỉ dùng lúc lập trình & kiểm thử (Tự động thêm khi gõ 'uv add --dev <gói>')
# -> Giống mục "devDependencies" trong package.json
[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "ruff>=0.7.0",
]`}
                showJsTsComparison={showJsTsComparison}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 1: METHOD 1 — COMPLETE WORKFLOW WITH UV (STEP-BY-STEP + JS/TS)    */}
          {/* ===================================================================== */}
          {activeTab === 'uv-workflow' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Phương pháp 1 • Quản lý Dự án Toàn diện bằng `uv` (Khuyên dùng số 1)
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Từ lúc cài đặt, khởi tạo dự án, thêm thư viện đến khi chạy code bằng `uv` (Kèm giải thích & đối chiếu)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bạn có thể bật/tắt nút <strong>&quot;So sánh Node.js/JS&quot;</strong> ở góc trên bên phải cửa sổ này để hiện hoặc ẩn phần đối chiếu với <code>npm / nvm / node</code>.
                </p>
              </div>

              <GuidedStepBlock
                stepNumber="Bước 0"
                title={`Cài đặt công cụ 'uv' và tải Python 3.12 lên máy (${selectedOs.toUpperCase()})`}
                badge="Chỉ cần làm 1 lần đầu tiên"
                explanation="Kể cả khi máy tính mới mua chưa hề cài Python, bạn chỉ cần cài uv rồi bảo uv tải Python 3.12 về. Đồng thời đặt Python 3.12 làm bản mặc định toàn máy (Global) để dùng ở mọi nơi."
                code={
                  selectedOs === 'macos'
                    ? `# 1. Cài đặt uv lên macOS (qua curl hoặc: brew install uv)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Tải Python 3.12 (và 3.10 nếu cần chạy dự án cũ) về máy:
uv python install 3.12 3.10

# 3. Đặt Python 3.12 làm bản mặc định toàn máy (Global):
uv python install 3.12 --default
uv python pin --global 3.12`
                    : selectedOs === 'windows'
                    ? `# 1. Mở Windows PowerShell và chạy lệnh cài đặt uv:
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Tải Python 3.12 về máy:
uv python install 3.12

# 3. Đặt Python 3.12 làm bản mặc định toàn máy (Global):
uv python install 3.12 --default
uv python pin --global 3.12`
                    : `# 1. Cài đặt uv trên Linux / Ubuntu / WSL2:
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env

# 2. Tải Python 3.12 và đặt làm mặc định toàn máy (Global):
uv python install 3.12 --default
uv python pin --global 3.12`
                }
                pythonOtherEquivalents={[
                  {
                    label: 'Python truyền thống (Dùng pyenv)',
                    command:
                      'brew install pyenv && pyenv install 3.12.7 && pyenv global 3.12.7',
                    note: 'Phải cấu hình thêm biến môi trường PYENV_ROOT và eval "$(pyenv init -)" vào ~/.zshrc',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js (Dùng nvm / fnm)',
                    command: 'nvm install 22 && nvm alias default 22',
                    note: 'uv đóng vai trò giống hệt nvm + pnpm gộp làm một!',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 1"
                title="Tạo và khởi tạo dự án mới (Khởi tạo cấu trúc Source Code)"
                badge="uv init"
                explanation="Thay vì phải tự tạo thư mục, tự tạo file cấu hình và .gitignore thủ công, bạn chỉ cần chạy một lệnh duy nhất. uv sẽ tự tạo thư mục dự án, file pyproject.toml, file .python-version và file code đầu vào main.py."
                code={`# Cách A: Tạo dự án Ứng dụng / Web / Script tiêu chuẩn:
uv init my-project
cd my-project

# (Hoặc Cách B: Tạo dự án lớn chia theo cấu trúc thư mục 'src/my_project/' chuẩn Production):
# uv init --package my-project && cd my-project

# Ghim phiên bản Python riêng cho dự án này (ghi vào file .python-version):
uv python pin 3.12`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python cũ (venv + pip)',
                    command:
                      'mkdir my-project && cd my-project && pyenv local 3.12.7 && python -m venv .venv',
                  },
                  {
                    label: 'Poetry',
                    command: 'poetry new my-project && cd my-project',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js (npm / pnpm)',
                    command:
                      'mkdir my-project && cd my-project && npm init -y && node -v > .nvmrc',
                    note: 'Sinh ra package.json (tương ứng pyproject.toml) và .nvmrc (tương ứng .python-version)',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 2"
                title="Thêm thư viện (Dependencies) vào dự án"
                badge="uv add"
                explanation="Khi bạn thêm thư viện bằng 'uv add', uv sẽ tự động tạo thư mục môi trường ảo '.venv/' ngay trong dự án (nếu chưa có), tải thư viện với tốc độ cực nhanh, tự động ghi tên thư viện vào file 'pyproject.toml' và khóa phiên bản vào file 'uv.lock'."
                code={`# 1. Cài đặt thư viện chạy chính thức (Production dependencies):
uv add requests rich

# 2. Cài đặt thư viện chỉ dùng lúc lập trình / kiểm thử (--dev):
uv add --dev pytest ruff

# 3. Nếu muốn gỡ bỏ một thư viện:
# uv remove requests`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python cũ (pip + requirements.txt)',
                    command:
                      'source .venv/bin/activate && pip install requests rich && pip freeze > requirements.txt',
                    note: 'Phải nhớ kích hoạt .venv trước rồi tự chạy pip freeze thủ công để lưu lại danh sách gói.',
                  },
                  {
                    label: 'Poetry / Pipenv',
                    command:
                      'poetry add requests rich  (hoặc: pipenv install requests rich)',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js (npm / pnpm / yarn)',
                    command:
                      'npm install requests rich && npm install -D vitest eslint',
                    note: 'Tự động tải gói vào node_modules/ (tương ứng .venv/) và ghi vào package.json + package-lock.json',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 3"
                title="Chạy code Python & Kiểm thử của bạn (Không cần activate thủ công!)"
                badge="uv run"
                explanation="uv có cơ chế thông minh là 'uv run'. Lệnh này đảm bảo file code của bạn luôn được chạy bên trong môi trường ảo '.venv' của dự án mà bạn không cần phải nhớ lệnh kích hoạt (source .venv/bin/activate) rườm rà."
                code={`# 1. Chạy file đầu vào đơn lẻ (ví dụ main.py hoặc hello.py):
uv run main.py

# 2. Chạy dự án có cấu trúc thư mục src/ dưới dạng Module (cờ -m):
uv run python -m my_project.main

# 3. Chạy bộ kiểm thử tự động (pytest) hoặc công cụ kiểm tra code (ruff):
uv run pytest
uv run ruff check .`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python cũ (Phải kích hoạt .venv trước khi chạy)',
                    command:
                      'source .venv/bin/activate && python main.py && pytest',
                    note: 'Trên Windows PowerShell phải gõ: .venv\\Scripts\\Activate.ps1 rồi mới gõ python main.py',
                  },
                  {
                    label: 'Poetry / Pipenv',
                    command:
                      'poetry run python main.py  (hoặc: pipenv run python main.py)',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js',
                    command: 'node main.js   hoặc   npm start / npx vitest',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 4"
                title="Khi tải (git clone) dự án của người khác về máy thì làm sao để chạy?"
                badge="uv sync"
                explanation="Khi bạn git clone một dự án Python có sẵn file 'pyproject.toml' và 'uv.lock' về máy, trong đó chưa có thư mục '.venv/'. Bạn chỉ cần gõ đúng 1 lệnh 'uv sync' để tái tạo toàn bộ môi trường giống hệt người viết."
                code={`# 1. Clone dự án về máy và đi vào thư mục:
git clone https://github.com/team/awesome-python-app.git
cd awesome-python-app

# 2. Tự động đọc .python-version, tạo .venv và cài đặt 100% thư viện từ uv.lock:
uv sync

# 3. Chạy ứng dụng ngay lập tức:
uv run main.py`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python cũ (venv + requirements.txt)',
                    command:
                      'python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt',
                  },
                  {
                    label: 'Poetry / Pipenv',
                    command: 'poetry install   (hoặc: pipenv sync --dev)',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js',
                    command: 'npm ci   hoặc   pnpm install --frozen-lockfile',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: METHOD 2 — WORKFLOW WITHOUT UV (pyenv / venv / pip / Poetry)   */}
          {/* ===================================================================== */}
          {activeTab === 'non-uv-workflow' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Phương pháp 2 • Quản lý Dự án khi KHÔNG dùng `uv`
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    Hướng dẫn từng bước kèm giải thích cho `pyenv + venv + pip`, `Poetry` và `Pipenv`
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Chọn công cụ mà dự án hoặc công ty của bạn đang sử dụng bên dưới để xem quy trình đầy đủ từ Bước 1 đến Bước 4:
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNonUvStack('pyenv-venv-pip')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'pyenv-venv-pip'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>
                      2A. Bộ Chuẩn: pyenv + venv / virtualenv + pip
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNonUvStack('poetry')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'poetry'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Package className="h-3.5 w-3.5" />
                    <span>2B. Bộ Doanh nghiệp: pyenv + Poetry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNonUvStack('pipenv')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer',
                      nonUvStack === 'pipenv'
                        ? 'bg-sky-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-sky-500/50'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>2C. Bộ Web / Django: pyenv + Pipenv</span>
                  </button>
                </div>
              </div>

              {/* STACK 2A: PYENV + VENV + PIP */}
              {nonUvStack === 'pyenv-venv-pip' && (
                <div className="space-y-4">
                  <GuidedStepBlock
                    stepNumber="Bước 1 (2A)"
                    title={`Cài đặt 'pyenv' và chọn Phiên bản Python cho máy & dự án (${selectedOs.toUpperCase()})`}
                    badge="pyenv global & pyenv local"
                    explanation="Vì bản thân lệnh 'pip' hay 'venv' không biết tự tải phiên bản Python mới về máy, ta dùng 'pyenv' để tải Python 3.12.7. Lệnh 'pyenv global' đặt bản mặc định cho toàn máy, còn 'pyenv local' tạo file .python-version cho riêng thư mục dự án."
                    code={
                      selectedOs === 'macos'
                        ? `# 1. Cài pyenv qua Homebrew và nạp vào ~/.zshrc (Chỉ làm 1 lần):
brew update && brew install pyenv
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc

# 2. Tải Python 3.12.7 và đặt làm mặc định toàn máy (Global):
pyenv install 3.12.7
pyenv global 3.12.7`
                        : selectedOs === 'windows'
                        ? `# 1. Cài pyenv-win trên Windows PowerShell:
Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/pyenv-win/pyenv-win/master/pyenv-win/install-pyenv-win.ps1" -OutFile "./install-pyenv-win.ps1"
&"./install-pyenv-win.ps1"

# 2. Tải Python 3.12.7 và đặt làm mặc định toàn máy:
pyenv install 3.12.7
pyenv global 3.12.7`
                        : `# 1. Cài pyenv trên Linux và nạp vào ~/.bashrc:
curl https://pyenv.run | bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc
source ~/.bashrc

# 2. Tải Python 3.12.7 và đặt làm mặc định toàn máy:
pyenv install 3.12.7
pyenv global 3.12.7`
                    }
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js (nvm)',
                        command: 'nvm install 22.11.0 && nvm alias default 22.11.0',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 2 (2A)"
                    title="Tạo thư mục dự án, tạo Môi trường ảo (.venv) và Kích hoạt (Activate)"
                    badge="python -m venv .venv"
                    explanation="Trong cách truyền thống, sau khi tạo thư mục dự án, bạn dùng module 'venv' có sẵn của Python để tạo thư mục '.venv/'. Điểm khác biệt lớn nhất cần nhớ: Bạn BẮT BUỘC phải chạy lệnh 'activate' để chui vào bên trong môi trường ảo (thấy chữ (.venv) ở đầu dòng lệnh) trước khi cài thư viện hay chạy code!"
                    code={
                      selectedOs === 'windows'
                        ? `# 1. Tạo thư mục dự án và ghim phiên bản Python cho dự án:
mkdir my-project
cd my-project
pyenv local 3.12.7          # Tạo file .python-version

# 2. Tạo thư mục môi trường ảo '.venv':
python -m venv .venv
# (Hoặc nếu dùng công cụ virtualenv: virtualenv -p python3.12 .venv)

# 3. KÍCH HOẠT môi trường ảo trên Windows PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.venv\\Scripts\\Activate.ps1
# -> Con trỏ dòng lệnh sẽ đổi thành: (.venv) PS C:\\my-project>`
                        : `# 1. Tạo thư mục dự án và ghim phiên bản Python cho dự án:
mkdir my-project && cd my-project
pyenv local 3.12.7          # Tạo file .python-version

# 2. Tạo thư mục môi trường ảo '.venv':
python -m venv .venv
# (Hoặc nếu dùng công cụ virtualenv: virtualenv -p python3.12 .venv)

# 3. KÍCH HOẠT môi trường ảo trên macOS / Linux:
source .venv/bin/activate
# -> Con trỏ dòng lệnh sẽ đổi thành: (.venv) $`
                    }
                    pythonOtherEquivalents={[
                      {
                        label: 'Nếu dùng uv',
                        command: 'uv init my-project && cd my-project',
                      },
                    ]}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'mkdir my-project && cd my-project && npm init -y',
                        note: 'Node.js không cần bước activate vì node tự động tìm thư viện trong ./node_modules',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 3 (2A)"
                    title="Cài đặt thư viện bằng 'pip' và đóng băng ra 'requirements.txt'"
                    badge="pip install & pip freeze"
                    explanation="Khi đầu dòng lệnh đã hiện '(.venv)', bạn dùng 'pip install' để tải thư viện vào '.venv/'. Vì pip không tự động ghi tên gói vào file cấu hình khi cài, bạn phải chạy thêm 'pip freeze > requirements.txt' (hoặc dùng bộ công cụ pip-compile / pip-sync) để lưu lại danh sách thư viện."
                    code={`# 1. Nâng cấp pip bên trong (.venv) lên bản mới nhất:
(.venv) $ python -m pip install --upgrade pip

# 2. Cài đặt thư viện vào (.venv):
(.venv) $ pip install requests fastapi uvicorn pytest

# 3. Xuất danh sách toàn bộ thư viện đã cài ra file requirements.txt:
(.venv) $ pip freeze > requirements.txt

# 4. Khi người khác clone dự án về, họ kích hoạt .venv rồi chạy lệnh sau để cài lại:
(.venv) $ pip install -r requirements.txt`}
                    pythonOtherEquivalents={[
                      {
                        label: 'Chuẩn nâng cao với pip-tools (Khuyên dùng khi dùng pip)',
                        command:
                          'pip install pip-tools && pip-compile requirements.in -o requirements.txt && pip-sync',
                        note: 'Giúp tách riêng gói chính (trong requirements.in) và gói con đã khóa (trong requirements.txt).',
                      },
                    ]}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'npm install requests fastify',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 4 (2A)"
                    title="Chạy code Python và Thoát khỏi môi trường ảo khi xong việc"
                    badge="python main.py & deactivate"
                    explanation="Khi đang đứng trong môi trường ảo '(.venv)', lệnh 'python' và 'pytest' đã trỏ thẳng vào '.venv/bin/python' của dự án nên bạn gọi trực tiếp. Khi muốn thoát ra ngoài, gõ 'deactivate'."
                    code={`# 1. Chạy file đầu vào main.py (khi đang ở trong (.venv)):
(.venv) $ python main.py

# 2. Hoặc chạy dưới dạng module nếu code đặt trong thư mục src/:
(.venv) $ pip install -e .          # Liên kết thư mục src/ vào .venv
(.venv) $ python -m my_project.main

# 3. Chạy kiểm thử pytest:
(.venv) $ pytest

# 4. Khi làm việc xong và muốn thoát khỏi môi trường ảo (.venv):
(.venv) $ deactivate`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'node main.js && npx vitest',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />
                </div>
              )}

              {/* STACK 2B: PYENV + POETRY */}
              {nonUvStack === 'poetry' && (
                <div className="space-y-4">
                  <GuidedStepBlock
                    stepNumber="Bước 1 (2B)"
                    title="Cài đặt Poetry, cấu hình .venv trong dự án & Khởi tạo dự án mới"
                    badge="poetry new / init"
                    explanation="Poetry là công cụ quản lý dự án toàn diện rất phổ biến trong doanh nghiệp (dùng pyproject.toml và poetry.lock). Lưu ý quan trọng nhất: Hãy bật 'virtualenvs.in-project true' để Poetry tạo thư mục .venv/ ngay trong dự án của bạn."
                    code={`# 1. Cài đặt Poetry và bật chế độ tạo .venv ngay trong thư mục dự án (Làm 1 lần):
pipx install poetry
poetry config virtualenvs.in-project true

# 2. Tạo dự án mới với cấu trúc chuẩn src/ layout:
poetry new --src my-project
cd my-project

# 3. Chọn phiên bản Python cho dự án (kết hợp pyenv):
pyenv local 3.12.7
poetry env use 3.12`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js (pnpm / yarn)',
                        command: 'mkdir my-project && cd my-project && pnpm init',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 2 (2B)"
                    title="Thêm thư viện vào dự án và khóa phiên bản vào 'poetry.lock'"
                    badge="poetry add & poetry install"
                    explanation="Khi bạn gõ 'poetry add', Poetry tự động giải quyết phụ thuộc, cài gói vào .venv/, ghi vào pyproject.toml và khóa chặt phiên bản vào file poetry.lock."
                    code={`# 1. Thêm thư viện chạy chính thức:
poetry add requests fastapi uvicorn

# 2. Thêm thư viện cho nhóm phát triển / kiểm thử (--group dev):
poetry add --group dev pytest ruff

# 3. Khi clone dự án của người khác có sẵn poetry.lock về máy, chỉ cần chạy:
poetry install`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'pnpm add requests && pnpm add -D vitest',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 3 (2B)"
                    title="Chạy code Python và Kiểm thử với 'poetry run'"
                    badge="poetry run"
                    explanation="Tương tự uv run, lệnh 'poetry run' giúp bạn chạy thẳng file Python hoặc pytest bên trong môi trường ảo .venv của dự án mà không cần kích hoạt thủ công."
                    code={`# 1. Chạy file đơn hoặc module chính của dự án:
poetry run python -m my_project.main

# 2. Chạy bộ kiểm thử pytest:
poetry run pytest

# 3. Hoặc nếu muốn mở hẳn cửa sổ Shell đã kích hoạt .venv:
poetry shell`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'pnpm run start   hoặc   pnpm test',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />
                </div>
              )}

              {/* STACK 2C: PYENV + PIPENV */}
              {nonUvStack === 'pipenv' && (
                <div className="space-y-4">
                  <GuidedStepBlock
                    stepNumber="Bước 1 (2C)"
                    title="Khởi tạo dự án và Môi trường ảo với 'Pipenv' (Pipfile)"
                    badge="pipenv --python 3.12"
                    explanation="Pipenv kết hợp pip và virtualenv, sử dụng cặp file 'Pipfile' (thay cho requirements.txt) và 'Pipfile.lock'. Hãy đặt biến PIPENV_VENV_IN_PROJECT=1 để thư mục .venv/ nằm ngay trong dự án."
                    code={`# 1. Cài đặt Pipenv và cấu hình đặt .venv trong dự án:
pipx install pipenv
export PIPENV_VENV_IN_PROJECT=1

# 2. Tạo thư mục dự án và khởi tạo môi trường với Python 3.12:
mkdir my-project && cd my-project
pyenv local 3.12.7
pipenv --python 3.12`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'mkdir my-project && cd my-project && npm init -y',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />

                  <GuidedStepBlock
                    stepNumber="Bước 2 (2C)"
                    title="Cài đặt thư viện vào Pipfile, khóa Pipfile.lock & Chạy code"
                    badge="pipenv install & pipenv run"
                    explanation="Dùng 'pipenv install' để cài gói chính, 'pipenv install --dev' cho gói kiểm thử, và dùng 'pipenv run' để thực thi code."
                    code={`# 1. Cài đặt thư viện chính (ghi vào [packages] trong Pipfile):
pipenv install requests django

# 2. Cài đặt thư viện dev (ghi vào [dev-packages] trong Pipfile):
pipenv install --dev pytest ruff

# 3. Khi clone dự án về máy hoặc deploy lên Server, cài chính xác từ Pipfile.lock:
pipenv sync --dev

# 4. Chạy ứng dụng bên trong môi trường ảo của Pipenv:
pipenv run python main.py
pipenv run pytest`}
                    nodeJsEquivalents={[
                      {
                        label: 'Node.js',
                        command: 'npm install requests && npm start',
                      },
                    ]}
                    showJsTsComparison={showJsTsComparison}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 0: SAMPLE PROJECT LOCAL RUN GUIDE (STEP-BY-STEP + JS/TS)          */}
          {/* ===================================================================== */}
          {activeTab === 'project' && sampleProject && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Hướng dẫn Từng Bước Chạy Dự án #{sampleProject.number}:{' '}
                    {sampleProject.title} ({sampleProject.slug}/)
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  • <strong>Đầu vào (Entrypoint) của dự án này:</strong> File{' '}
                  <code className="text-amber-300 font-mono font-bold">
                    {sampleProject.defaultFilePath}
                  </code>
                  {' • '}
                  <strong>Lệnh khởi chạy chính:</strong>{' '}
                  <code className="text-emerald-300 font-mono font-bold">
                    {sampleProject.interactiveCommands[0]?.command}
                  </code>
                </p>
              </div>

              <GuidedStepBlock
                stepNumber="Bước 1"
                title={`Tạo thư mục dự án '${sampleProject.slug}' và khởi tạo môi trường Python 3.12`}
                badge="Khởi tạo dự án"
                explanation={`Tạo thư mục gốc ${sampleProject.slug}/ và thiết lập môi trường ảo .venv với Python 3.12. Sau đó tạo các file theo đúng cây thư mục bên trái (bấm nút 'Copy file' ở từng tab để lấy code).`}
                code={
                  selectedOs === 'windows'
                    ? `# Lệnh với uv (trên Windows PowerShell):
mkdir ${sampleProject.slug}
cd ${sampleProject.slug}
uv python install 3.12
uv python pin 3.12`
                    : `# Lệnh với uv (trên macOS / Linux):
mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug}
uv python install 3.12
uv python pin 3.12`
                }
                pythonOtherEquivalents={[
                  {
                    label: 'Nếu dùng pyenv + venv truyền thống',
                    command:
                      selectedOs === 'windows'
                        ? `mkdir ${sampleProject.slug} && cd ${sampleProject.slug} && pyenv local 3.12.7 && python -m venv .venv && .venv\\Scripts\\Activate.ps1`
                        : `mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug} && pyenv local 3.12.7 && python3 -m venv .venv && source .venv/bin/activate`,
                  },
                  {
                    label: 'Nếu dùng Poetry',
                    command: `mkdir -p ${sampleProject.slug} && cd ${sampleProject.slug} && poetry env use 3.12`,
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js tương đương',
                    command: `mkdir ${sampleProject.slug} && cd ${sampleProject.slug} && nvm use 22`,
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 2"
                title="Cài đặt các thư viện phụ thuộc (Dependencies) từ file pyproject.toml"
                badge="Đồng bộ .venv"
                explanation="Sau khi bạn đã có file pyproject.toml và các file mã nguồn trong thư mục src/, chạy lệnh đồng bộ dưới đây để cài đặt toàn bộ thư viện cần thiết và liên kết thư mục src/ vào môi trường ảo .venv."
                code={`# Lệnh uv (Tự tạo .venv, cài gói trong pyproject.toml và gắn package src/):
uv sync`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python truyền thống (Khi đã kích hoạt .venv)',
                    command: 'python -m pip install --upgrade pip && pip install -e . pytest ruff',
                    note: 'Cờ "-e ." giúp cài đặt chính thư mục src/ của dự án vào .venv để lệnh import không bị lỗi.',
                  },
                  {
                    label: 'Poetry / Pipenv',
                    command: 'poetry install   (hoặc: pipenv install -e . --dev)',
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js tương đương',
                    command: 'npm install   hoặc   pnpm install',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 3"
                title={`Chạy điểm đầu vào (Entrypoint) của dự án và Chạy kiểm thử Pytest`}
                badge="Chạy code & Test"
                explanation={`Điểm đầu vào (Entrypoint) của dự án này nằm tại file '${sampleProject.defaultFilePath}'. Vì dự án tổ chức theo cấu trúc package chuyên nghiệp, ta chạy qua lệnh dưới đây:`}
                code={`# 1. Chạy ứng dụng chính:
uv run ${baseCmd}

# 2. Chạy bộ kiểm thử tự động (Unit Tests):
uv run pytest -v`}
                pythonOtherEquivalents={[
                  {
                    label: 'Python truyền thống (Trong .venv đã activate)',
                    command: `${baseCmd}   và   pytest -v`,
                  },
                  {
                    label: 'Poetry / Pipenv',
                    command: `poetry run ${baseCmd}   (hoặc: pipenv run ${baseCmd})`,
                  },
                ]}
                nodeJsEquivalents={[
                  {
                    label: 'Node.js tương đương',
                    command: 'npm start   và   npm test',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />
            </div>
          )}

          {/* TAB 3: VS CODE / CURSOR SETUP */}
          {activeTab === 'ide' && (
            <div className="space-y-4">
              <GuidedStepBlock
                stepNumber="Bước 1 IDE"
                title="Cài đặt bộ 4 Extensions chuẩn cho VS Code / Cursor"
                badge="Extensions bắt buộc"
                explanation="Để VS Code hoặc Cursor có thể tô màu cú pháp, gợi ý hàm (IntelliSense), báo lỗi kiểu dữ liệu và tự động căn lề 4 dấu cách chuẩn PEP 8 khi lưu file, hãy cài đặt 4 extension sau:"
                code={`# Chạy trên Terminal để cài nhanh cho VS Code (hoặc thay 'code' bằng 'cursor'):
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension charliermarsh.ruff
code --install-extension tamasfe.even-better-toml`}
                nodeJsEquivalents={[
                  {
                    label: 'Tương đương bên VS Code cho JS/TS',
                    command:
                      'ESLint (dbaeumer.vscode-eslint) + Prettier (esbenp.prettier-vscode)',
                    note: 'Trong Python: Pylance đóng vai trò như TypeScript Server, còn Ruff đóng vai trò gộp cả ESLint + Prettier!',
                  },
                ]}
                showJsTsComparison={showJsTsComparison}
              />

              <GuidedStepBlock
                stepNumber="Bước 2 IDE"
                title="Trỏ VS Code / Cursor vào đúng môi trường ảo (.venv) của dự án"
                badge="Select Interpreter"
                explanation="Khác với VS Code tự động đọc ./node_modules của JS/TS, trong Python bạn cần chỉ cho VS Code biết phải dùng trình thông dịch Python nằm trong thư mục '.venv/' của dự án. Bạn có thể bấm Cmd/Ctrl + Shift + P -> chọn 'Python: Select Interpreter' -> chọn './.venv/bin/python', hoặc tạo file .vscode/settings.json dưới đây:"
                code={`// File: .vscode/settings.json (Đặt trong thư mục dự án)
{
  // Tự động chọn Python bên trong thư mục .venv của dự án
  "python.defaultInterpreterPath": "${
    selectedOs === 'windows'
      ? '${workspaceFolder}\\\\.venv\\\\Scripts\\\\python.exe'
      : '${workspaceFolder}/.venv/bin/python'
  }",
  "python.terminal.activateEnvironment": true,

  // Bật kiểm tra kiểu dữ liệu (giống checkJs / strict trong tsconfig.json)
  "python.analysis.typeCheckingMode": "standard",
  "python.analysis.autoImportCompletions": true,

  // Tự động Format code và sắp xếp lại dòng import mỗi khi bấm Save (Cmd+S / Ctrl+S)
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  }
}`}
                showJsTsComparison={showJsTsComparison}
              />
            </div>
          )}

          {/* TAB 4: TROUBLESHOOTING FOR BEGINNERS */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-3.5">
              {[
                {
                  title:
                    '1. Lỗi "error: externally-managed-environment" khi gõ pip install trên macOS / Ubuntu',
                  cause:
                    'Bạn đang gõ pip install trực tiếp vào Python của hệ điều hành mà chưa tạo hoặc chưa kích hoạt môi trường ảo .venv.',
                  fix: 'Nếu dùng uv: chạy `uv add <tên_gói>`. Nếu không dùng uv: chạy `python3 -m venv .venv && source .venv/bin/activate && pip install <tên_gói>` (hoặc `poetry add` / `pipenv install`).',
                },
                {
                  title:
                    '2. Poetry hoặc Pipenv tạo môi trường ảo ở đâu đó ngoài dự án khiến VS Code không thấy thư mục .venv',
                  cause:
                    'Mặc định Poetry và Pipenv lưu virtualenv tập trung trong thư mục Cache của hệ điều hành.',
                  fix: 'Với Poetry: chạy `poetry config virtualenvs.in-project true`. Với Pipenv: đặt biến môi trường `export PIPENV_VENV_IN_PROJECT=1` trước khi chạy `pipenv install`.',
                },
                {
                  title:
                    '3. Lỗi đỏ "Activate.ps1 cannot be loaded because running scripts is disabled" trên Windows PowerShell',
                  cause:
                    'Mặc định Windows PowerShell chặn chạy các file script .ps1 của người dùng.',
                  fix: 'Mở PowerShell và chạy lệnh: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`. Hoặc dùng `uv run` / `poetry run` / `pipenv run` để không cần gọi Activate.ps1.',
                },
                {
                  title:
                    '4. Cài pyenv xong, đã chạy pyenv global 3.12.7 nhưng gõ python --version vẫn ra bản cũ',
                  cause:
                    'Bạn chưa thêm thư mục shims của pyenv vào biến môi trường PATH trong file cấu hình Shell (`~/.zshrc` trên macOS hoặc `~/.bashrc` trên Linux).',
                  fix: 'Chạy 3 lệnh cấu hình `PYENV_ROOT`, `PATH` và `eval "$(pyenv init -)"` rồi chạy `source ~/.zshrc`.',
                },
                {
                  title:
                    '5. Lỗi "ModuleNotFoundError: No module named ..." khi chạy file nằm trong thư mục src/',
                  cause:
                    'Project chưa được cài đặt ở chế độ Editable vào trong `.venv`, hoặc bạn đang chạy trực tiếp đường dẫn file con thay vì chạy từ gốc dự án.',
                  fix: 'Cài đặt package nội bộ vào `.venv` bằng `uv sync` / `pip install -e .` / `poetry install` và chạy qua cờ `-m` (ví dụ `python -m ten_package.main`).',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Nguyên nhân:</strong>{' '}
                    {item.cause}
                  </p>
                  <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 font-mono">
                    <strong>Cách khắc phục:</strong> {item.fix}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB: LIBRARIES ENCYCLOPEDIA */}
          {activeTab === 'libraries' && <PythonLibrariesEncyclopedia />}

          {/* TAB: QUICK & EASY SYNTAX AND DECLARATIONS */}
          {activeTab === 'quick-syntax' && <PythonQuickSyntaxGuide />}
        </div>

        {/* Sticky Bottom Bar on Mobile & Tablet (< lg) so user can always close effortlessly with thumb */}
        <div className="flex lg:hidden items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/95 px-3.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shrink-0">
          <button
            type="button"
            onClick={toggleJsTsComparison}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer',
              showJsTsComparison
                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 bg-slate-950 text-slate-400'
            )}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
            <span>JS/TS: {showJsTsComparison ? 'BẬT' : 'TẮT'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 active:scale-98 transition-all shadow-md cursor-pointer"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>Đóng Cẩm nang & Quay lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
