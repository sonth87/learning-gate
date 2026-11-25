import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Compass,
  ExternalLink,
  FolderTree,
  Layers,
  ListOrdered,
  Package,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react';
import {
  ALL_REAL_WORLD_PROJECTS,
  REAL_WORLD_PROJECT_GROUPS,
} from '@/data/samples/realWorldProjectsData';
import {
  ProjectSourceKind,
  RealWorldProject,
} from '@/types/realWorldProject.types';
import { SkillLevel } from '@/types/curriculum.types';
import { SKILL_LEVELS } from '@/constants/levels';
import { LevelBadge } from '@/components/common/LevelBadge';
import { cn } from '@/utils/cn';

const PROGRESS_STORAGE_KEY = 'lg_rw_projects_progress_v1';

interface SavedProjectProgress {
  doneProjects: Record<string, boolean>;
  doneChapters: Record<string, boolean>;
}

function loadSavedProgress(): SavedProjectProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { doneProjects: {}, doneChapters: {} };
    const parsed = JSON.parse(raw);
    return {
      doneProjects: parsed.doneProjects || {},
      doneChapters: parsed.doneChapters || {},
    };
  } catch {
    return { doneProjects: {}, doneChapters: {} };
  }
}

interface RealWorldProjectsCatalogProps {
  activeIdeProjectId?: string;
  onSelectProjectInIde?: (projectId: string) => void;
}

const ProjectBreakdownCard: React.FC<{
  project: RealWorldProject;
  isOpenedInIde: boolean;
  isProjectDone: boolean;
  doneChapters: Record<string, boolean>;
  onToggleProjectDone: (projectId: string) => void;
  onToggleChapterDone: (chapterKey: string) => void;
  onOpenInIde?: (projectId: string) => void;
}> = ({
  project,
  isOpenedInIde,
  isProjectDone,
  doneChapters,
  onToggleProjectDone,
  onToggleChapterDone,
  onOpenInIde,
}) => {
  // Collapsed by default so the user can scan the catalog easily and expand only what they are reading
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTree, setShowTree] = useState(true);
  const [showChapters, setShowChapters] = useState(true);

  const totalChapters = project.chapters?.length ?? 0;
  const completedChaptersCount = useMemo(() => {
    if (!project.chapters) return 0;
    return project.chapters.filter(
      (_, idx) => doneChapters[`${project.id}:${idx}`]
    ).length;
  }, [project.chapters, project.id, doneChapters]);

  return (
    <article
      className={cn(
        'rounded-2xl border bg-slate-900/80 p-3.5 sm:p-4 space-y-3 shadow-md transition-colors',
        isOpenedInIde
          ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
          : isProjectDone
            ? 'border-emerald-500/40 bg-slate-900/60'
            : 'border-slate-800 hover:border-slate-700'
      )}
    >
      {/* Compact Header Row: Always Visible */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Mark Read / Progress Checkbox */}
          <button
            type="button"
            onClick={() => onToggleProjectDone(project.id)}
            title={
              isProjectDone
                ? 'Đã đánh dấu đọc xong (Bấm để bỏ đánh dấu)'
                : 'Đánh dấu đã đọc / hoàn thành dự án này'
            }
            className={cn(
              'mt-0.5 rounded-lg p-1 transition-colors cursor-pointer shrink-0',
              isProjectDone
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {isProjectDone ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide',
                  project.kind === 'production-template'
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                )}
              >
                {project.kind === 'production-template'
                  ? 'Production Template'
                  : 'Build From Scratch (PBL)'}
              </span>
              <LevelBadge level={project.complexity} size="sm" />
              <span className="rounded-md border border-slate-700/80 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                {project.scaleLabel}
              </span>
              {totalChapters > 0 && (
                <span className="rounded-md border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-violet-300">
                  {completedChaptersCount}/{totalChapters} chương đã đọc
                </span>
              )}
              {isProjectDone && (
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  ✓ Đã đọc hiểu
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <h4
                onClick={() => setIsExpanded((v) => !v)}
                className="text-sm sm:text-base font-bold text-white hover:text-emerald-300 leading-snug cursor-pointer"
              >
                {project.title}
              </h4>
              <span className="font-mono text-xs text-emerald-400">
                ({project.repoName})
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {project.summary}
            </p>

            {/* Quick Library Pills in Collapsed View */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {project.libraries.map((lib) => (
                <span
                  key={lib.name}
                  title={`${lib.role}: ${lib.whyNeeded}`}
                  className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-amber-300/90"
                >
                  {lib.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {onOpenInIde && project.ideFiles.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenInIde(project.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                isOpenedInIde
                  ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                  : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>
                {isOpenedInIde
                  ? `Đang mở trên IDE (${project.ideFiles.length} files)`
                  : `Mở Code IDE (${project.ideFiles.length} files)`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              isExpanded
                ? 'border-sky-500/50 bg-sky-500/20 text-sky-200'
                : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
            )}
          >
            <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết & Chương'}</span>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            title="Mở trang GitHub hoặc bài hướng dẫn gốc"
          >
            <span>Nguồn</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Expandable Deep Breakdown (Only shown when user clicks "Xem chi tiết & Chương") */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/90 space-y-3.5 animate-in fade-in duration-150">
          {/* Purpose + How It Works Grid */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                <Compass className="h-3.5 w-3.5 shrink-0" />
                <span>Project này để làm gì?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {project.purpose}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Workflow className="h-3.5 w-3.5 shrink-0" />
                <span>Hoạt động như thế nào?</span>
              </div>
              <ol className="space-y-1.5">
                {project.howItWorks.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                  >
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.2 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Libraries & Their Roles */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Thư viện sử dụng & Vai trò (Giải thích cho người mới)</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {project.libraries.map((lib) => (
                <div
                  key={lib.name}
                  className="rounded-lg border border-slate-800/90 bg-slate-900/70 p-2.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {lib.name}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200">
                      {lib.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {lib.whyNeeded}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Chapters / Step-by-Step Articles Breakdown with Per-Chapter Checkboxes */}
          {project.chapters && project.chapters.length > 0 && (
            <div className="rounded-xl border border-violet-500/30 bg-slate-950/90 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowChapters((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-violet-950/30 hover:bg-violet-950/50 text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 font-mono text-xs font-bold text-violet-200">
                  {showChapters ? (
                    <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-violet-400" />
                  )}
                  <ListOrdered className="h-4 w-4 text-violet-400" />
                  <span>
                    Lộ trình Chi tiết từng Chương / Bài học (Đã đọc{' '}
                    {completedChaptersCount}/{project.chapters.length} phần — Bấm
                    tích chọn từng chương để nhớ đang đọc đến đâu)
                  </span>
                </span>
                <span className="font-mono text-[10px] text-violet-300">
                  {showChapters ? 'Thu gọn' : 'Mở rộng'}
                </span>
              </button>

              {showChapters && (
                <div className="p-3.5 grid gap-2 sm:grid-cols-2 border-t border-violet-500/20 max-h-[420px] overflow-y-auto">
                  {project.chapters.map((ch, idx) => {
                    const chKey = `${project.id}:${idx}`;
                    const isChDone = Boolean(doneChapters[chKey]);
                    return (
                      <div
                        key={`${ch.chapter}-${idx}`}
                        className={cn(
                          'rounded-lg border p-2.5 space-y-1 flex flex-col justify-between transition-colors',
                          isChDone
                            ? 'border-emerald-500/40 bg-emerald-950/20'
                            : 'border-slate-800 bg-slate-900/80'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleChapterDone(chKey)}
                              className="inline-flex items-center gap-1.5 cursor-pointer text-left"
                              title="Đánh dấu đã đọc chương này"
                            >
                              {isChDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="rounded bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.2 font-mono text-[10px] font-bold text-violet-300 shrink-0">
                                {ch.chapter}
                              </span>
                            </button>
                            {ch.url && (
                              <a
                                href={ch.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 hover:underline shrink-0"
                              >
                                <span>Đọc bài gốc</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white leading-snug">
                            {ch.title}
                          </h5>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {ch.summaryVi}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Commented Directory Tree + Reading Focus */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTree((v) => !v)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-900/80 hover:bg-slate-900 text-left cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-200">
                {showTree ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
                <FolderTree className="h-3.5 w-3.5 text-amber-400" />
                <span>Cấu trúc Thư mục & Giải thích từng thành phần</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {showTree ? 'Thu gọn' : 'Mở rộng'}
              </span>
            </button>

            {showTree && (
              <div className="p-3.5 space-y-3 border-t border-slate-800/80">
                <pre className="font-mono text-[11px] sm:text-xs leading-5 text-slate-300 overflow-x-auto whitespace-pre">
                  {project.directoryTree}
                </pre>

                <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200 leading-relaxed">
                  <BookOpen className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300">
                      Người mới nên đọc gì trước:{' '}
                    </span>
                    <span>{project.readingFocus}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export const RealWorldProjectsCatalog: React.FC<
  RealWorldProjectsCatalogProps
> = ({ activeIdeProjectId, onSelectProjectInIde }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedKind, setSelectedKind] = useState<'all' | ProjectSourceKind>(
    'all'
  );
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [progress, setProgress] =
    useState<SavedProjectProgress>(loadSavedProgress);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const handleToggleProjectDone = (projectId: string) => {
    setProgress((prev) => ({
      ...prev,
      doneProjects: {
        ...prev.doneProjects,
        [projectId]: !prev.doneProjects[projectId],
      },
    }));
  };

  const handleToggleChapterDone = (chapterKey: string) => {
    setProgress((prev) => ({
      ...prev,
      doneChapters: {
        ...prev.doneChapters,
        [chapterKey]: !prev.doneChapters[chapterKey],
      },
    }));
  };

  const totalDoneProjects = useMemo(
    () =>
      ALL_REAL_WORLD_PROJECTS.filter((p) => progress.doneProjects[p.id]).length,
    [progress.doneProjects]
  );

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_REAL_WORLD_PROJECTS.filter((p) => {
      if (selectedGroup !== 'all' && p.groupId !== selectedGroup) return false;
      if (selectedKind !== 'all' && p.kind !== selectedKind) return false;
      if (selectedLevel !== 'all' && p.complexity !== selectedLevel)
        return false;
      if (!q) return true;

      const haystack = [
        p.title,
        p.repoName,
        p.summary,
        p.purpose,
        ...p.tags,
        ...p.libraries.map((l) => `${l.name} ${l.role}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedGroup, selectedKind, selectedLevel, searchQuery]);

  const visibleGroups = useMemo(() => {
    return REAL_WORLD_PROJECT_GROUPS.map((group) => ({
      group,
      projects: filteredProjects.filter((p) => p.groupId === group.id),
    })).filter((entry) => entry.projects.length > 0);
  }, [filteredProjects]);

  return (
    <section
      id="real-world-pbl-catalog"
      className="pt-4 border-t border-slate-800 space-y-5"
    >
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 p-5 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                <Layers className="h-3.5 w-3.5" />
                <span>
                  10 Chuyên mục • {ALL_REAL_WORLD_PROJECTS.length} Dự án Thực tế
                  & PBL
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  Tiến độ đọc: {totalDoneProjects}/
                  {ALL_REAL_WORLD_PROJECTS.length} dự án hoàn thành
                </span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Thư viện Dự án Thực tế & Project-Based Learning
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
              Các dự án được{' '}
              <strong className="text-emerald-300">
                thu gọn mặc định để dễ theo dõi tổng quan
              </strong>
              . Bấm <em>"Mở Code IDE"</em> để nạp file lên VS Code IDE phía trên,
              bấm <em>"Xem chi tiết & Chương"</em> để bung sơ đồ luồng chạy và các
              chương bài học, hoặc tích vào vòng tròn bên trái để đánh dấu tiến độ
              đọc của bạn.
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid gap-2.5 md:grid-cols-12 pt-1">
          <div className="md:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên repo, thư viện (FastAPI, Flask, Celery, uv, Scrapy)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Tất cả loại' },
                { id: 'production-template', label: 'Production Template' },
                { id: 'pbl-tutorial', label: 'Build From Scratch (PBL)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedKind(opt.id)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  selectedKind === opt.id
                    ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 flex items-center gap-1.5">
            <select
              aria-label="Lọc theo mức độ phức tạp"
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as SkillLevel | 'all')
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Mọi mức độ phức tạp</option>
              {SKILL_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.label} — {lvl.viLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Group Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedGroup('all')}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
              selectedGroup === 'all'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
            )}
          >
            Tất cả 10 nhóm ({ALL_REAL_WORLD_PROJECTS.length})
          </button>
          {REAL_WORLD_PROJECT_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.id)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                selectedGroup === g.id
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
              )}
            >
              {g.number}. {g.title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Groups & Collapsible Project Cards */}
      {visibleGroups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-300">
            Không tìm thấy dự án nào khớp bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedGroup('all');
              setSelectedKind('all');
              setSelectedLevel('all');
              setSearchQuery('');
            }}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleGroups.map(({ group, projects }) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);
            const groupDoneCount = projects.filter(
              (p) => progress.doneProjects[p.id]
            ).length;

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedGroups((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                    className="w-full flex flex-wrap items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-300 shrink-0">
                        {String(group.number).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {group.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {group.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                        {groupDoneCount}/{projects.length} đã đọc
                      </span>
                      {isGroupCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {!isGroupCollapsed && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200/90 leading-relaxed">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-300">
                          Gợi ý cho người mới:{' '}
                        </strong>
                        {group.beginnerTip}
                      </span>
                    </div>
                  )}
                </div>

                {!isGroupCollapsed && (
                  <div className="space-y-2.5 pl-1 sm:pl-2">
                    {projects.map((proj) => (
                      <ProjectBreakdownCard
                        key={proj.id}
                        project={proj}
                        isOpenedInIde={activeIdeProjectId === proj.id}
                        isProjectDone={Boolean(progress.doneProjects[proj.id])}
                        doneChapters={progress.doneChapters}
                        onToggleProjectDone={handleToggleProjectDone}
                        onToggleChapterDone={handleToggleChapterDone}
                        onOpenInIde={onSelectProjectInIde}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
