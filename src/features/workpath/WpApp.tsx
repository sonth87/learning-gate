import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Code2,
  FolderGit2,
  Layers,
  ListChecks,
  Map as MapIcon,
  Package,
  Trophy,
} from 'lucide-react';
import { useCurriculum } from './data';
import {
  exSatisfied,
  lessonSatisfied,
  moduleDone,
  quizSatisfied,
} from './logic';
import { useWpNav, useWpProgress } from './store';
import { runCode } from './engine/pyEngine';
import type { WpView } from './types';
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
import { ProjectSamplesHub } from '@/components/samples/ProjectSamplesHub';
import { PythonLibrariesEncyclopedia } from '@/components/libraries/PythonLibrariesEncyclopedia';
import { Spinner } from './components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import {
  ScaleWorkbenchLayout,
  type ModuleStatusSnapshot,
} from '@/components/scale-workbench/ScaleWorkbenchLayout';
import { buildAllPythonScaleLessons } from '@/apps/pymastery/data/pythonLessonBuilder';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

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
    labelVi: 'Bài tập',
    labelEn: 'Exercises',
    tipVi: 'Bài tập lập trình Python chấm tự động (Pyodide)',
    tipEn: 'Auto-graded Python coding exercises (Pyodide)',
    icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'exercises' },
    match: ['exercises', 'exercise'],
  },
  {
    id: 'quiz',
    labelVi: 'Quiz',
    labelEn: 'Quiz',
    tipVi: 'Câu hỏi trắc nghiệm kiểm tra nhanh',
    tipEn: 'Concept & code quizzes',
    icon: <ListChecks className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'quiz', mode: 'mix' },
    match: ['quiz'],
  },
  {
    id: 'flash',
    labelVi: 'Flashcard',
    labelEn: 'Flashcards',
    tipVi: 'Thẻ ghi nhớ SRS & luyện gõ phản xạ',
    tipEn: 'Spaced-repetition flashcards & typing drills',
    icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'flash' },
    match: ['flash', 'drill'],
  },
  {
    id: 'projects',
    labelVi: 'Dự án Thực tế',
    labelEn: 'Real Projects',
    tipVi: 'VS Code IDE Dự án Mẫu & Thư viện Project-Based Learning',
    tipEn: 'Sample Projects IDE & Project-Based Learning Catalog',
    icon: <FolderGit2 className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'projects' },
    match: ['projects'],
  },
  {
    id: 'libraries',
    labelVi: 'Thư viện',
    labelEn: 'Libraries',
    tipVi: 'Các thư viện Python thông dụng theo mảng, phạm vi & khi nào cần cài thêm',
    tipEn: 'Common Python libraries by domain, scope & stdlib vs third-party boundaries',
    icon: <Package className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'libraries' },
    match: ['libraries'],
  },
];

const PracticeViewSwitch: React.FC<{ view: WpView }> = ({ view }) => {
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
    case 'projects':
      return (
        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5">
          <ProjectSamplesHub />
        </div>
      );
    case 'libraries':
      return (
        <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5">
          <PythonLibrariesEncyclopedia />
        </div>
      );
    case 'workbench':
    default:
      return null;
  }
};

export const WpApp: React.FC = () => {
  const view = useWpNav((x) => x.view);
  const go = useWpNav((x) => x.go);
  const hydrated = useWpProgress((x) => x.hydrated);
  const hydrate = useWpProgress((x) => x.hydrate);
  const wpState = useWpProgress((x) => x.state);
  const markLessonRead = useWpProgress((x) => x.markLessonRead);
  const syncMeta = useWpProgress((x) => x.syncMeta);

  const lang = useWorkbenchStore((s) => s.language);
  const currentCursorModId = useWorkbenchStore(
    (s) => s.cursors.pymastery?.moduleId ?? 'M00'
  );
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = useCurriculum();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect legacy { name: 'module', id } clicks from Home/Roadmap straight into the interactive Workbench!
  useEffect(() => {
    if (view.name === 'module' && cur) {
      const targetMod = cur.modules.find((m) => m.id === view.id);
      if (targetMod) {
        setCourseCursor('pymastery', targetMod.id, 0);
        setExpandedLevel('pymastery', targetMod.level);
        go({ name: 'workbench' });
      }
    }
  }, [view, cur, setCourseCursor, setExpandedLevel, go]);

  useEffect(() => {
    document.getElementById('wp-scroll')?.scrollTo({ top: 0 });
  }, [view]);

  const scaleLessons = useMemo(
    () => (cur ? buildAllPythonScaleLessons(cur) : []),
    [cur]
  );

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
        completed: moduleDone(wpState, mod, cur.passQuiz),
        lessonRead: lessonSatisfied(wpState, mod.id),
        passedExercises: mod.exercises.filter((e) =>
          exSatisfied(wpState, e.id, mod.id)
        ).length,
        totalExercises: mod.exercises.length,
        quizPassed: quizSatisfied(wpState, mod.id, cur.passQuiz),
      };
    },
    [cur, wpState]
  );

  const handleRunSnippet = useCallback(async (code: string) => {
    return runCode(code, '');
  }, []);

  if (!hydrated || !cur) {
    return (
      <Spinner
        label={
          lang === 'en'
            ? 'Loading interactive Python workbench…'
            : 'Đang tải bàn học mô hình tương tác…'
        }
      />
    );
  }

  // Primary Learn Mode: Full-screen 3-Column Designed-to-Scale Interactive Workbench
  if (view.name === 'workbench') {
    return (
      <ScaleWorkbenchLayout
        courseId="pymastery"
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
          go({ name: 'projects' })
        }
        onRunCodeSnippet={handleRunSnippet}
      />
    );
  }

  // Practice & Secondary Views Mode (Exercises, Quiz, Flashcards, Drills, Real Code, Stats)
  const isRoadmapActive = view.name === 'roadmap' || view.name === 'module';
  const isHomeActive = view.name === 'home';
  const contextModuleId =
    ('moduleId' in view && view.moduleId) ? view.moduleId : currentCursorModId;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <nav
        aria-label="Practice navigation"
        className="@container shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 sm:px-3.5"
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-2 gap-y-1.5 py-1.5">
          {/* Left + Center: Contextual Back Pill + Segmented Core Practice Switcher */}
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <button
              type="button"
              onClick={() => go({ name: 'workbench' })}
              title={
                lang === 'en'
                  ? `Back to interactive lesson (${contextModuleId})`
                  : `Quay lại bài học tương tác (${contextModuleId})`
              }
              className="dts-btn-tactile inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden @[560px]:inline">
                {lang === 'en' ? 'Lesson' : 'Bài học'}
              </span>
              <span className="rounded bg-black/8 px-1 py-0.2 text-[10.5px]">
                {contextModuleId}
              </span>
            </button>

            {/* Unified Segmented Control for the 4 Core Practice Activities */}
            <div
              role="tablist"
              aria-label={lang === 'en' ? 'Practice modes' : 'Chế độ luyện tập'}
              className="no-scrollbar inline-flex max-w-full min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5"
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

          {/* Right: Compact Roadmap + Live XP/Streak Button + Sync Status */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go({ name: 'roadmap' })}
              title={
                lang === 'en'
                  ? 'Full 33-module syllabus roadmap'
                  : 'Bản đồ lộ trình 33 bài học'
              }
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-bold transition-all cursor-pointer',
                isRoadmapActive
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
                isHomeActive
                  ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
              )}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0 text-[#d98a1e]" />
              <span>{wpState.xp} XP</span>
            </button>

            <ProgressSyncBadge meta={syncMeta} />
          </div>
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto" id="wp-scroll">
        <PracticeViewSwitch view={view} />
      </div>
    </div>
  );
};

export default WpApp;
