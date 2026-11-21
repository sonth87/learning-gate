import React, { useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Layers, ListChecks, Map as MapIcon, Trophy } from 'lucide-react';
import { usePmpCurriculum } from './data';
import { lessonSatisfied, pmpModuleDone, quizSatisfied } from './logic';
import { usePmpAppStore, usePmpNav, usePmpProgress } from './store';
import type { PmpLearnView } from './types';
import { buildPmpScaleLessons } from '@/features/devops-course/scale/courseLessonBuilder';
import { PMP_BLUEPRINTS, PMP_LEVEL_TITLES } from '@/apps/pmpmastery/data/pmpScaleCurator';
import { PmpHomeView } from './views/PmpHomeView';
import { PmpRoadmapView } from './views/PmpRoadmapView';
import { PmpModuleView } from './views/PmpModuleView';
import { PmpQuizView } from './views/PmpQuizView';
import { PmpFlashView } from './views/PmpFlashView';
import { Spinner } from '@/features/workpath/components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import {
  ScaleWorkbenchLayout,
  type ModuleStatusSnapshot,
} from '@/components/scale-workbench/ScaleWorkbenchLayout';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

const PMP_PRACTICE_TABS: {
  id: string;
  labelVi: string;
  labelEn: string;
  tipVi: string;
  tipEn: string;
  icon: React.ReactNode;
  go: PmpLearnView;
  match: PmpLearnView['name'][];
}[] = [
  {
    id: 'quiz',
    labelVi: 'Quiz tình huống',
    labelEn: 'Situational Quiz',
    tipVi: 'Câu hỏi tình huống chuẩn tư duy PMI (≥ 70% đạt)',
    tipEn: 'PMI-style situational decision quizzes',
    icon: <ListChecks className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'quiz', mode: 'mix' },
    match: ['quiz'],
  },
  {
    id: 'flash',
    labelVi: 'Flashcard SRS',
    labelEn: 'SRS Flashcards',
    tipVi: 'Thẻ ghi nhớ phản xạ Leitner 5 hộp',
    tipEn: '5-box Leitner spaced-repetition flashcards',
    icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'flash' },
    match: ['flash'],
  },
];

const ViewSwitch: React.FC<{ view: PmpLearnView }> = ({ view }) => {
  switch (view.name) {
    case 'home':
      return <PmpHomeView />;
    case 'roadmap':
      return <PmpRoadmapView />;
    case 'module':
      return <PmpModuleView key={view.id} id={view.id} />;
    case 'quiz':
      return (
        <PmpQuizView
          key={`${view.mode}-${view.moduleId ?? 'all'}`}
          mode={view.mode}
          moduleId={view.moduleId}
        />
      );
    case 'flash':
      return <PmpFlashView key={view.moduleId ?? 'all'} moduleId={view.moduleId} />;
    case 'workbench':
    default:
      return null;
  }
};

export const PmpLearnShell: React.FC = () => {
  const view = usePmpNav((x) => x.view);
  const go = usePmpNav((x) => x.go);
  const setActivePmpTab = usePmpAppStore((s) => s.setActiveTab);

  const hydrated = usePmpProgress((x) => x.hydrated);
  const hydrate = usePmpProgress((x) => x.hydrate);
  const pmpState = usePmpProgress((x) => x.state);
  const markLessonRead = usePmpProgress((x) => x.markLessonRead);
  const syncMeta = usePmpProgress((x) => x.syncMeta);

  const lang = useWorkbenchStore((s) => s.language);
  const currentCursorModId = useWorkbenchStore(
    (s) => s.cursors.pmpmastery?.moduleId ?? 'P00'
  );
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = usePmpCurriculum();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect legacy { name: 'module', id } clicks from Canvas/DecisionTree/Roadmap straight into the interactive Workbench!
  useEffect(() => {
    if (view.name === 'module' && cur) {
      const targetMod = cur.modules.find((m) => m.id === view.id);
      if (targetMod) {
        setCourseCursor('pmpmastery', targetMod.id, 0);
        setExpandedLevel('pmpmastery', targetMod.level);
        go({ name: 'workbench' });
      }
    }
  }, [view, cur, setCourseCursor, setExpandedLevel, go]);

  useEffect(() => {
    document.getElementById('course-scroll-pmp')?.scrollTo({ top: 0 });
  }, [view]);

  const scaleLessons = useMemo(
    () => (cur ? buildPmpScaleLessons(cur, PMP_LEVEL_TITLES, PMP_BLUEPRINTS) : []),
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
        completed: pmpModuleDone(pmpState, mod, cur.passQuiz),
        lessonRead: lessonSatisfied(pmpState, mod.id),
        passedExercises: 0,
        totalExercises: 0,
        quizPassed: quizSatisfied(pmpState, mod.id, cur.passQuiz),
      };
    },
    [cur, pmpState]
  );

  if (!hydrated || !cur) {
    return (
      <Spinner
        label={
          lang === 'en'
            ? 'Loading interactive PMP Mindset workbench…'
            : 'Đang tải bàn học mô hình Tư duy PMP…'
        }
      />
    );
  }

  if (view.name === 'workbench') {
    return (
      <ScaleWorkbenchLayout
        courseId="pmpmastery"
        lessons={scaleLessons}
        getModuleStatus={getModuleStatus}
        onMarkLessonComplete={(moduleId) => {
          markLessonRead(moduleId);
        }}
        onOpenQuiz={(moduleId) =>
          go({ name: 'quiz', mode: 'module', moduleId })
        }
        onOpenFlashcards={(moduleId) =>
          go({ name: 'flash', moduleId })
        }
        onOpenReadings={() => setActivePmpTab('lookup')}
      />
    );
  }

  const ctxMod =
    ('moduleId' in view && view.moduleId) || currentCursorModId || 'P00';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <nav
        aria-label="Practice navigation"
        className="@container shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 sm:px-3.5"
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
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
              <span className="hidden @[520px]:inline">
                {lang === 'en' ? 'Lesson' : 'Bài học'}
              </span>
              <span className="rounded bg-black/8 px-1 py-0.2 text-[10.5px]">
                {ctxMod}
              </span>
            </button>

            <div
              role="tablist"
              aria-label={lang === 'en' ? 'Practice modes' : 'Chế độ ôn luyện'}
              className="inline-flex min-w-0 items-center gap-0.5 rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5"
            >
              {PMP_PRACTICE_TABS.map((tab) => {
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
                    <span className={cn(active ? 'inline' : 'hidden @[580px]:inline')}>
                      {lang === 'en' ? tab.labelEn : tab.labelVi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go({ name: 'roadmap' })}
              title={
                lang === 'en'
                  ? 'Full 16-module PMP syllabus roadmap'
                  : 'Bản đồ lộ trình 16 bài học PMP'
              }
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-bold transition-all cursor-pointer',
                view.name === 'roadmap' || view.name === 'module'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)] font-extrabold'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
              )}
            >
              <MapIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden @[740px]:inline">
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
              <span>{pmpState.xp} XP</span>
            </button>

            <ProgressSyncBadge meta={syncMeta} />
          </div>
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto" id="course-scroll-pmp">
        <ViewSwitch view={view} />
      </div>
    </div>
  );
};
