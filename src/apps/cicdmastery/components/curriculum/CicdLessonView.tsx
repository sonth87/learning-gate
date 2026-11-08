import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquarePlus,
  BookOpen,
  Target,
  Sparkles,
  Code2,
  Layers,
  ShieldAlert,
  FlaskConical,
  PanelLeftOpen,
  Workflow,
  ArrowRight,
  Info,
  MousePointerClick,
  ArrowRightLeft,
  Play,
  Terminal,
  AlertTriangle,
} from 'lucide-react';
import {
  ALL_CICD_LESSONS,
  CICD_LESSON_BY_ID,
} from '../../data/cicdCurriculumIndex';
import { CICD_STAGE_MAP } from '../../data/cicdStages';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import {
  useUserDataStore,
  REQUIRED_LESSON_STUDY_SECONDS,
} from '@/stores/useUserDataStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import { CodeBlock } from '@/components/common/CodeBlock';
import { CicdVisualBlueprintRenderer } from '../diagrams/CicdVisualBlueprintRenderer';
import { cn } from '@/utils/cn';

type SectionFilter = 'all' | 'theory-flow' | 'code-compare' | 'gotchas-dora';

const NODE_COLORS = {
  amber: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    title: 'text-amber-300',
  },
  sky: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    title: 'text-sky-300',
  },
  emerald: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    title: 'text-emerald-300',
  },
  violet: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    title: 'text-violet-300',
  },
  rose: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    title: 'text-rose-300',
  },
};

export const CicdLessonView: React.FC = () => {
  const {
    selectedLessonId,
    selectLesson,
    setActiveTab,
    selectBlueprint,
    setMobileSidebarOpen,
  } = useCicdNavigationStore();
  const { openNotesDrawer } = useNavigationStore();
  const {
    completedLessonIds,
    lessonStudySeconds,
    toggleLessonComplete,
    addLessonStudyTime,
    bookmarks,
    toggleBookmark,
    notes,
  } = useUserDataStore();

  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [selectedNodeMap, setSelectedNodeMap] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const lesson = CICD_LESSON_BY_ID[selectedLessonId] || ALL_CICD_LESSONS[0];
  const stage = CICD_STAGE_MAP[lesson.stageId];

  const currentIdx = ALL_CICD_LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? ALL_CICD_LESSONS[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < ALL_CICD_LESSONS.length - 1
      ? ALL_CICD_LESSONS[currentIdx + 1]
      : null;

  const isCompleted = completedLessonIds.includes(lesson.id);
  const studiedSeconds = lessonStudySeconds[lesson.id] || 0;
  const isBookmarked = bookmarks.some(
    (b) => b.targetType === 'lesson' && b.targetId === lesson.id
  );
  const lessonNotesCount = notes.filter(
    (n) => n.targetType === 'lesson' && n.targetId === lesson.id
  ).length;

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      addLessonStudyTime(lesson.id, 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lesson.id, addLessonStudyTime]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 h-full overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        {/* Top Mobile Bar & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex lg:hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
            >
              <PanelLeftOpen className="h-4 w-4 text-cyan-400" />
              <span>Mục lục</span>
            </button>

            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'all', label: 'Tất cả', icon: <Layers className="h-3.5 w-3.5" /> },
                  { id: 'theory-flow', label: 'Lý thuyết & Sơ đồ Luồng', icon: <Workflow className="h-3.5 w-3.5" /> },
                  { id: 'code-compare', label: 'YAML, Code & Đối chiếu', icon: <Code2 className="h-3.5 w-3.5" /> },
                  { id: 'gotchas-dora', label: 'Bẫy & Chỉ số Thực tế', icon: <ShieldAlert className="h-3.5 w-3.5" /> },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSectionFilter(f.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all',
                    sectionFilter === f.id
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  )}
                >
                  {f.icon}
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-mono text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{formatTimer(studiedSeconds)}</span>
            </span>

            <button
              onClick={() =>
                toggleBookmark({
                  targetType: 'lesson',
                  targetId: lesson.id,
                  targetTitle: lesson.title,
                  level: lesson.level,
                })
              }
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                isBookmarked
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() =>
                openNotesDrawer('lesson', lesson.id, `CI/CD: ${lesson.shortTitle}`)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-cyan-500/40"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Ghi chú ({lessonNotesCount})</span>
            </button>

            <button
              onClick={() => toggleLessonComplete(lesson.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold transition-all',
                isCompleted
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isCompleted
                  ? 'Đã hoàn thành'
                  : studiedSeconds >= REQUIRED_LESSON_STUDY_SECONDS
                  ? 'Đánh dấu xong'
                  : 'Hoàn thành'}
              </span>
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/30 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300">
                Phần {stage.number}: {stage.pdfPartLabel}
              </span>
              <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 font-mono text-xs text-amber-300">
                📄 {lesson.pdfRef}
              </span>
              <LevelBadge level={lesson.level} />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              ⏱ ~{lesson.estimatedMinutes} phút đọc & thực hành
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            {lesson.title}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {lesson.summary}
          </p>

          {/* Key Objectives Box */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Target className="h-4 w-4" />
              <span>Mục tiêu Kiến trúc Trọng tâm</span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-1">
              {lesson.keyObjectives.map((obj, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-sm text-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Jump to Interactive Simulators */}
          {lesson.relatedSimulators && lesson.relatedSimulators.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {lesson.relatedSimulators.map((sim, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (sim.targetTab === 'blueprints' && sim.targetId) {
                      selectBlueprint(sim.targetId);
                    } else {
                      setActiveTab(sim.targetTab);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{sim.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </header>

        {/* SECTION 1: INTERACTIVE SVG FLOW BLUEPRINT & DIAGRAMS */}
        {(sectionFilter === 'all' || sectionFilter === 'theory-flow') && (
          <div className="space-y-6">
            {/* Animated SVG Blueprint */}
            <CicdVisualBlueprintRenderer blueprintType={lesson.svgBlueprint} />

            {/* Interactive Step-by-Step Node Diagrams */}
            {lesson.diagrams.map((diagram) => {
              const activeNodeId =
                selectedNodeMap[diagram.id] || diagram.nodes[0]?.id;
              const activeNode =
                diagram.nodes.find((n) => n.id === activeNodeId) ||
                diagram.nodes[0];

              return (
                <section
                  key={diagram.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Sơ đồ Luồng Hoạt động Tương tác (Interactive Node Flow)
                      </span>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        {diagram.title}
                      </h2>
                      <p className="text-xs text-slate-400">{diagram.subtitle}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300">
                      <MousePointerClick className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Bấm vào từng khối để mổ xẻ cơ chế</span>
                    </span>
                  </div>

                  <div
                    className={cn(
                      'grid gap-3',
                      diagram.nodes.length === 3
                        ? 'sm:grid-cols-3'
                        : diagram.nodes.length >= 4
                        ? 'sm:grid-cols-2 lg:grid-cols-4'
                        : 'sm:grid-cols-2'
                    )}
                  >
                    {diagram.nodes.map((node, idx) => {
                      const col = NODE_COLORS[node.highlightColor || 'sky'];
                      const isSelected = node.id === activeNode?.id;
                      return (
                        <button
                          key={node.id}
                          onClick={() =>
                            setSelectedNodeMap((prev) => ({
                              ...prev,
                              [diagram.id]: node.id,
                            }))
                          }
                          className={cn(
                            'rounded-xl border p-3.5 text-left transition-all flex flex-col justify-between space-y-2',
                            col.border,
                            col.bg,
                            isSelected
                              ? 'ring-2 ring-cyan-400 shadow-md scale-[1.01]'
                              : 'opacity-85 hover:opacity-100'
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  'rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                                  col.badge
                                )}
                              >
                                {node.badge}
                              </span>
                              {idx < diagram.nodes.length - 1 && (
                                <ArrowRight className="hidden lg:block h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                            <h3 className={cn('text-xs font-bold', col.title)}>
                              {node.title}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-200">
                              {node.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {activeNode && (
                    <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>
                          Giải thích chuyên sâu [{activeNode.badge}]:{' '}
                          {activeNode.title}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-6">
                        {activeNode.detail}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 border-t border-slate-800/70 pt-2">
                    📌 {diagram.caption}
                  </div>
                </section>
              );
            })}

            {/* Deep Theory Sections */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Kiến thức Chuyên sâu & Cơ chế Vận hành (Theo Tài liệu Chuẩn)
                </h2>
              </div>

              <div className="space-y-5">
                {lesson.theorySections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 space-y-2.5"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-cyan-300">
                      {sec.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {sec.body}
                    </p>
                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul className="space-y-2 pt-1">
                        {sec.bulletPoints.map((bp, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-2.5 rounded-lg bg-slate-900/80 border border-slate-800/70 p-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Visual Mental Model Analogy */}
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Hình tượng hóa Thực tế: {lesson.visualAnalogy.title}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {lesson.visualAnalogy.realWorldScenario}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.visualAnalogy.mappingPoints.map((mp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-1.5"
                  >
                    <div className="text-xs font-bold text-amber-300">
                      🌍 Thực tế: {mp.realWorld}
                    </div>
                    <div className="font-mono text-xs font-semibold text-cyan-300">
                      ⚙️ CI/CD: {mp.cicdEquivalent}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {mp.explanation}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 font-medium">
                💡 <strong>Mẹo Tư duy Kiến trúc:</strong>{' '}
                {lesson.visualAnalogy.mentalModelTip}
              </div>
            </section>
          </div>
        )}

        {/* SECTION 2: CODE EXAMPLES & PLATFORM COMPARISONS */}
        {(sectionFilter === 'all' || sectionFilter === 'code-compare') && (
          <div className="space-y-6">
            {/* Annotated Code / YAML Examples */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Cấu hình Chuẩn Thực chiến & Giải thích Từng dòng
                </h2>
              </div>

              {lesson.codeExamples.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {ex.title}
                      </h3>
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan-300 border border-slate-700">
                        {ex.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {ex.description}
                    </p>
                  </div>

                  <CodeBlock code={ex.code} language={ex.language} />

                  {ex.annotations.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
                      <div className="text-xs font-bold text-cyan-400">
                        🔍 Giải thích chi tiết ý nghĩa cấu hình:
                      </div>
                      <div className="grid gap-2">
                        {ex.annotations.map((ann, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300"
                          >
                            <span className="shrink-0 rounded bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                              Dòng {ann.line}
                            </span>
                            <span>{ann.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ex.outputOrImpact && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                      ✅ <strong>Tác động Kiến trúc:</strong> {ex.outputOrImpact}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Platform Comparison: GitHub Actions vs GitLab CI */}
            {lesson.platformComparisons.length > 0 && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-sky-400" />
                  <h2 className="text-base font-bold text-white">
                    Đối chiếu Song song: GitHub Actions ↔ GitLab CI/CD
                  </h2>
                </div>

                <div className="space-y-3">
                  {lesson.platformComparisons.map((cmp, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
                    >
                      <div className="text-xs sm:text-sm font-bold text-white">
                        {cmp.feature}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 space-y-1.5">
                          <div className="font-mono text-[11px] font-bold text-sky-300">
                            🐙 GitHub Actions (.github/workflows/*.yml)
                          </div>
                          <p className="text-xs text-slate-200">
                            {cmp.githubActionsWay}
                          </p>
                          {cmp.githubSnippet && (
                            <pre className="mt-1 rounded bg-slate-950 p-2 font-mono text-[11px] text-sky-200 overflow-x-auto">
                              {cmp.githubSnippet}
                            </pre>
                          )}
                        </div>
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
                          <div className="font-mono text-[11px] font-bold text-amber-300">
                            🦊 GitLab CI/CD (.gitlab-ci.yml)
                          </div>
                          <p className="text-xs text-slate-200">
                            {cmp.gitlabCiWay}
                          </p>
                          {cmp.gitlabSnippet && (
                            <pre className="mt-1 rounded bg-slate-950 p-2 font-mono text-[11px] text-amber-200 overflow-x-auto">
                              {cmp.gitlabSnippet}
                            </pre>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        💡 <strong>Ghi chú Kiến trúc:</strong>{' '}
                        {cmp.architecturalNote}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* SECTION 3: GOTCHAS, BENCHMARKS & BEST PRACTICES */}
        {(sectionFilter === 'all' || sectionFilter === 'gotchas-dora') && (
          <div className="space-y-6">
            {/* Common Issues & Gotchas */}
            <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <h2 className="text-base font-bold text-white">
                  Bẫy Kinh điển & Sự cố Thường gặp trong Vận hành
                </h2>
              </div>

              {lesson.gotchas.map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-rose-300">
                      🚨 {g.title}
                    </h3>
                    <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-rose-300">
                      {g.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Hiện tượng:</strong> {g.symptom}
                  </p>
                  <p className="text-xs text-slate-300">
                    <strong>Nguyên nhân gốc rễ:</strong> {g.whyItHappens}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3">
                      <div className="text-[11px] font-bold text-rose-300 mb-1">
                        ❌ Cấu hình Sai / Nguy hiểm:
                      </div>
                      <pre className="font-mono text-[11px] text-rose-200 overflow-x-auto whitespace-pre-wrap">
                        {g.wrongConfig}
                      </pre>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
                      <div className="text-[11px] font-bold text-emerald-300 mb-1">
                        ✅ Cấu hình Chuẩn Khắc phục:
                      </div>
                      <pre className="font-mono text-[11px] text-emerald-200 overflow-x-auto whitespace-pre-wrap">
                        {g.rightConfig}
                      </pre>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-300">
                    🛠️ <strong>Cách xử lý triệt để:</strong> {g.fixExplanation}
                  </p>
                </div>
              ))}
            </section>

            {/* Benchmarks & DORA Proofs */}
            {lesson.benchmarks.map((b) => (
              <section
                key={b.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">
                    Minh chứng Hiệu năng & Đo lường Thực tế: {b.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">{b.claim}</p>

                <div className="space-y-3">
                  {b.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-white">
                          {m.label}
                        </span>
                        <span
                          className={cn(
                            'font-mono font-bold',
                            m.isOptimal ? 'text-emerald-400' : 'text-amber-400'
                          )}
                        >
                          {m.valueText}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            m.isOptimal ? 'bg-emerald-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${m.barPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">{m.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Bottom Prev / Next Lesson Navigation */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-6">
          {prevLesson ? (
            <button
              onClick={() => selectLesson(prevLesson.id)}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-left hover:border-cyan-500/40 transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase text-slate-400">
                  Bài trước
                </div>
                <div className="text-xs font-bold text-white">
                  {prevLesson.shortTitle}
                </div>
              </div>
            </button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <button
              onClick={() => selectLesson(nextLesson.id)}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-3 text-right hover:bg-cyan-500/25 transition-all"
            >
              <div>
                <div className="text-[10px] uppercase text-cyan-300">
                  Bài tiếp theo
                </div>
                <div className="text-xs font-bold text-white">
                  {nextLesson.shortTitle}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
            >
              <Play className="h-4 w-4" />
              <span>Chuyển sang Phòng Giả lập CI/CD Thực chiến</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
