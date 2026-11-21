import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Layers,
  ListChecks,
  Map as MapIcon,
  Trophy,
} from 'lucide-react';
import { COURSE_META, CourseProvider } from './context';
import { useCourseCurriculum } from './data';
import {
  courseModuleDone,
  exSatisfied,
  lessonSatisfied,
  quizSatisfied,
} from './logic';
import { COURSE_NAV_STORES, COURSE_PROGRESS_STORES } from './store';
import type { DevOpsCourseId, RelatedToolLink, WpView } from './types';
import {
  buildDevOpsScaleLessons,
  runDevOpsSnippetLive,
} from './scale/courseLessonBuilder';
import { REDIS_BLUEPRINTS, REDIS_LEVEL_TITLES } from '@/apps/redismastery/data/redisScaleCurator';
import { KUBE_BLUEPRINTS, KUBE_LEVEL_TITLES } from '@/apps/kubemastery/data/kubeScaleCurator';
import { CICD_BLUEPRINTS, CICD_LEVEL_TITLES } from '@/apps/cicdmastery/data/cicdScaleCurator';
import { HomeView } from './views/HomeView';
import { RoadmapView } from './views/RoadmapView';
import { ModuleView } from './views/ModuleView';
import { ExerciseListView } from './views/ExerciseListView';
import { ExerciseView } from './views/ExerciseView';
import { QuizView } from './views/QuizView';
import { FlashView } from './views/FlashView';
import { DrillView } from './views/DrillView';
import { BrowseView } from './views/BrowseView';
import { ReadView } from './views/ReadView';
import { Spinner } from '@/features/workpath/components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import {
  ScaleWorkbenchLayout,
  type ModuleStatusSnapshot,
} from '@/components/scale-workbench/ScaleWorkbenchLayout';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

const WORKBENCH_SLOT_BY_COURSE: Record<DevOpsCourseId, string> = {
  redis: 'redismastery',
  kube: 'kubemastery',
  cicd: 'cicdmastery',
};

const CORE_PRACTICE_TABS: {
  id: string;
  labelVi: string;
  labelEn: string;
  tipVi: string;
  tipEn: string;
  icon: React.ReactNode;
  go: WpView;
  match: WpView['name'][];
}[] = [
  {
    id: 'exercises',
    labelVi: 'Thực hành',
    labelEn: 'Labs',
    tipVi: 'Bài thực hành cấu hình & CLI chấm tự động trên trình duyệt',
    tipEn: 'Auto-graded browser CLI & config labs',
    icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'exercises' },
    match: ['exercises', 'exercise'],
  },
  {
    id: 'quiz',
    labelVi: 'Quiz',
    labelEn: 'Quiz',
    tipVi: 'Câu hỏi trắc nghiệm kiểm tra kiến trúc & xử lý sự cố',
    tipEn: 'Architecture & troubleshooting quizzes',
    icon: <ListChecks className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'quiz', mode: 'mix' },
    match: ['quiz'],
  },
  {
    id: 'flash',
    labelVi: 'Flashcard',
    labelEn: 'Flashcards',
    tipVi: 'Thẻ ghi nhớ SRS & luyện gõ câu lệnh chuẩn',
    tipEn: 'SRS flashcards & CLI command drills',
    icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'flash' },
    match: ['flash', 'drill'],
  },
  {
    id: 'browse',
    labelVi: 'Cấu hình thật',
    labelEn: 'Real Configs',
    tipVi: 'Đọc & phân tích cấu hình Production thực tế',
    tipEn: 'Inspect real-world production configs & workflows',
    icon: <BookOpen className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'browse', preset: 'all' },
    match: ['browse', 'read'],
  },
];

const ViewSwitch: React.FC<{ view: WpView }> = ({ view }) => {
  switch (view.name) {
    case 'home':
      return <HomeView />;
    case 'roadmap':
      return <RoadmapView />;
    case 'module':
      return <ModuleView key={view.id} id={view.id} />;
    case 'exercises':
      return <ExerciseListView moduleId={view.moduleId} status={view.status} />;
    case 'exercise':
      return <ExerciseView key={view.code} code={view.code} />;
    case 'quiz':
      return (
        <QuizView
          key={`${view.mode}-${view.moduleId ?? ''}`}
          mode={view.mode}
          moduleId={view.moduleId}
        />
      );
    case 'flash':
      return <FlashView key={view.moduleId ?? 'all'} moduleId={view.moduleId} />;
    case 'drill':
      return <DrillView key={view.moduleId} moduleId={view.moduleId} />;
    case 'browse':
      return <BrowseView preset={view.preset} />;
    case 'read':
      return <ReadView key={view.n} n={view.n} />;
    case 'workbench':
    default:
      return null;
  }
};

export interface DevOpsCourseAppProps {
  courseId: DevOpsCourseId;
  onOpenRelatedTool?: (link: RelatedToolLink) => void;
}

export const DevOpsCourseApp: React.FC<DevOpsCourseAppProps> = ({
  courseId,
  onOpenRelatedTool,
}) => {
  const workbenchSlot = WORKBENCH_SLOT_BY_COURSE[courseId];
  const navStore = COURSE_NAV_STORES[courseId];
  const progressStore = COURSE_PROGRESS_STORES[courseId];

  const view = navStore((x) => x.view);
  const go = navStore((x) => x.go);
  const hydrated = progressStore((x) => x.hydrated);
  const hydrate = progressStore((x) => x.hydrate);
  const courseState = progressStore((x) => x.state);
  const markLessonRead = progressStore((x) => x.markLessonRead);
  const syncMeta = progressStore((x) => x.syncMeta);

  const lang = useWorkbenchStore((s) => s.language);
  const currentCursorModId = useWorkbenchStore(
    (s) => s.cursors[workbenchSlot]?.moduleId
  );
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = useCourseCurriculum(courseId);

  const meta = useMemo(
    () => ({
      ...COURSE_META[courseId],
      onOpenRelatedTool,
    }),
    [courseId, onOpenRelatedTool]
  );

  const scrollId = `course-scroll-${courseId}`;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect legacy { name: 'module', id } clicks straight into the interactive Workbench!
  useEffect(() => {
    if (view.name === 'module' && cur) {
      const targetMod = cur.modules.find((m) => m.id === view.id);
      if (targetMod) {
        setCourseCursor(workbenchSlot, targetMod.id, 0);
        setExpandedLevel(workbenchSlot, targetMod.level);
        go({ name: 'workbench' });
      }
    }
  }, [view, cur, workbenchSlot, setCourseCursor, setExpandedLevel, go]);

  useEffect(() => {
    document.getElementById(scrollId)?.scrollTo({ top: 0 });
  }, [view, scrollId]);

  const scaleLessons = useMemo(() => {
    if (!cur) return [];
    if (courseId === 'redis') {
      return buildDevOpsScaleLessons('redis', cur, REDIS_LEVEL_TITLES, REDIS_BLUEPRINTS);
    }
    if (courseId === 'kube') {
      return buildDevOpsScaleLessons('kube', cur, KUBE_LEVEL_TITLES, KUBE_BLUEPRINTS);
    }
    return buildDevOpsScaleLessons('cicd', cur, CICD_LEVEL_TITLES, CICD_BLUEPRINTS);
  }, [cur, courseId]);

  const getModuleStatus = useCallback(
    (moduleId: string): ModuleStatusSnapshot => {
      if (!cur) {
        return {
          completed: false,
          lessonRead: false,
          passedExercises: 0,
          totalExercises: 0,
          quizPassed: false,
        };
      }
      const mod = cur.modules.find((m) => m.id === moduleId);
      if (!mod) {
        return {
          completed: false,
          lessonRead: false,
          passedExercises: 0,
          totalExercises: 0,
          quizPassed: false,
        };
      }
      return {
        completed: courseModuleDone(courseState, mod, cur.passQuiz),
        lessonRead: lessonSatisfied(courseState, mod.id),
        passedExercises: mod.exercises.filter((e) =>
          exSatisfied(courseState, e.id, mod.id)
        ).length,
        totalExercises: mod.exercises.length,
        quizPassed: quizSatisfied(courseState, mod.id, cur.passQuiz),
      };
    },
    [cur, courseState]
  );

  const handleRunSnippet = useCallback(
    async (code: string) => runDevOpsSnippetLive(courseId, code),
    [courseId]
  );

  const sandboxTitle =
    courseId === 'redis'
      ? 'Redis 8 Engine (redis-cli / conf)'
      : courseId === 'kube'
        ? 'Docker & K8s Dry-Run Validator'
        : 'CI/CD YAML & CLI Dry-Run';

  const runCodeLabel =
    lang === 'en'
      ? courseId === 'redis'
        ? 'Run Redis'
        : 'Dry-Run'
      : courseId === 'redis'
        ? 'Chạy Redis'
        : 'Kiểm tra / Chạy thử';

  if (!hydrated || !cur) {
    return (
      <Spinner
        label={
          lang === 'en'
            ? 'Loading interactive architecture workbench…'
            : 'Đang tải bàn học mô hình tương tác…'
        }
      />
    );
  }

  return (
    <CourseProvider value={meta}>
      {view.name === 'workbench' ? (
        <ScaleWorkbenchLayout
          courseId={workbenchSlot}
          lessons={scaleLessons}
          getModuleStatus={getModuleStatus}
          onMarkLessonComplete={(moduleId) => {
            markLessonRead(moduleId);
          }}
          onOpenQuiz={(moduleId) =>
            go({ name: 'quiz', mode: 'module', moduleId })
          }
          onOpenExercises={(moduleId) =>
            go({ name: 'exercises', moduleId })
          }
          onOpenFlashcards={(moduleId) =>
            go({ name: 'flash', moduleId })
          }
          onOpenReadings={() =>
            go({ name: 'browse', preset: 'all' })
          }
          onRunCodeSnippet={handleRunSnippet}
          sandboxTitle={sandboxTitle}
          runCodeLabel={runCodeLabel}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
          <nav
            aria-label="Practice navigation"
            className="@container shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 sm:px-3.5"
          >
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 py-1.5">
              {/* Left + Center: Contextual Back Pill + Unified Segmented Practice Switcher */}
              <div className="flex min-w-0 items-center gap-2">
                {(() => {
                  const ctxMod =
                    ('moduleId' in view && view.moduleId) ||
                    currentCursorModId ||
                    scaleLessons[0]?.moduleId ||
                    '';
                  return (
                    <button
                      type="button"
                      onClick={() => go({ name: 'workbench' })}
                      title={
                        lang === 'en'
                          ? `Back to interactive lesson (${ctxMod})`
                          : `Quay lại bài học tương tác (${ctxMod})`
                      }
                      className="dts-btn-tactile inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden @[560px]:inline">
                        {lang === 'en' ? 'Lesson' : 'Bài học'}
                      </span>
                      <span className="rounded bg-black/8 px-1 py-0.2 text-[10.5px]">
                        {ctxMod}
                      </span>
                    </button>
                  );
                })()}

                <div
                  role="tablist"
                  aria-label={lang === 'en' ? 'Practice modes' : 'Chế độ luyện tập'}
                  className="inline-flex min-w-0 items-center gap-0.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5"
                >
                  {CORE_PRACTICE_TABS.map((tab) => {
                    const active = tab.match.includes(view.name);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        title={lang === 'en' ? tab.tipEn : tab.tipVi}
                        onClick={() => go(tab.go)}
                        className={cn(
                          'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 font-mono text-xs font-bold transition-all cursor-pointer',
                          active
                            ? 'border border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1px_1px_0_var(--dts-shadow-color)] font-extrabold'
                            : 'border border-transparent text-[var(--dts-ink-soft)] hover:bg-[var(--dts-panel-muted)] hover:text-[var(--dts-ink)]'
                        )}
                      >
                        {tab.icon}
                        <span
                          className={cn(
                            active ? 'inline' : 'hidden @[620px]:inline'
                          )}
                        >
                          {lang === 'en' ? tab.labelEn : tab.labelVi}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Compact Roadmap + Live XP Button + Sync Status */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => go({ name: 'roadmap' })}
                  title={
                    lang === 'en'
                      ? 'Full syllabus roadmap'
                      : 'Bản đồ lộ trình toàn khóa'
                  }
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-bold transition-all cursor-pointer',
                    view.name === 'roadmap' || view.name === 'module'
                      ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)] font-extrabold'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
                  )}
                >
                  <MapIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden @[780px]:inline">
                    {lang === 'en' ? 'Roadmap' : 'Lộ trình'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => go({ name: 'home' })}
                  title={
                    lang === 'en'
                      ? 'XP, rank & daily study streak'
                      : 'Tổng quan điểm XP, cấp bậc & chuỗi ngày học'
                  }
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-extrabold tabular-nums transition-all cursor-pointer',
                    view.name === 'home'
                      ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
                      : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 shrink-0 text-[#d98a1e]" />
                  <span>{courseState.xp} XP</span>
                </button>

                <ProgressSyncBadge meta={syncMeta} />
              </div>
            </div>
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto" id={scrollId}>
            <ViewSwitch view={view} />
          </div>
        </div>
      )}
    </CourseProvider>
  );
};

export default DevOpsCourseApp;
