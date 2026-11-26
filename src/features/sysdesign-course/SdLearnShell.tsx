import React, { useCallback, useEffect, useMemo } from 'react';
import { ArrowLeft, Layers, ListChecks, Map as MapIcon, Trophy } from 'lucide-react';
import { useSdCurriculum, useSdSims } from './data';
import { createSdLiveSimAdapter } from './live/liveSimAdapter';
import { buildSdScaleLessons } from './scale/sdLessonBuilder';
import { lessonSatisfied, quizSatisfied, sdModuleDone } from './logic';
import { useSdNav, useSdProgress } from './store';
import type { SdLearnView } from './types';
import { SdHomeView } from './views/SdHomeView';
import { SdRoadmapView } from './views/SdRoadmapView';
import { SdModuleView } from './views/SdModuleView';
import { SdQuizView } from './views/SdQuizView';
import { SdFlashView } from './views/SdFlashView';
import { Spinner } from '@/features/workpath/components/ui';
import { ProgressSyncBadge } from '@/components/common/ProgressSyncBadge';
import {
  ScaleWorkbenchLayout,
  type ModuleStatusSnapshot,
} from '@/components/scale-workbench/ScaleWorkbenchLayout';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';

const SD_PRACTICE_TABS: {
  id: string;
  labelVi: string;
  labelEn: string;
  tipVi: string;
  tipEn: string;
  icon: React.ReactNode;
  go: SdLearnView;
  match: SdLearnView['name'][];
}[] = [
  {
    id: 'quiz',
    labelVi: 'Quiz',
    labelEn: 'Quiz',
    tipVi: 'Câu hỏi tự kiểm tra (≥ 70% là đạt)',
    tipEn: 'Self-check questions (pass at 70%)',
    icon: <ListChecks className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'quiz', mode: 'mix' },
    match: ['quiz'],
  },
  {
    id: 'flash',
    labelVi: 'Flashcard',
    labelEn: 'Flashcards',
    tipVi: 'Thẻ ghi nhớ Leitner 5 hộp',
    tipEn: '5-box Leitner spaced-repetition flashcards',
    icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
    go: { name: 'flash' },
    match: ['flash'],
  },
];

const ViewSwitch: React.FC<{ view: SdLearnView }> = ({ view }) => {
  switch (view.name) {
    case 'home':
      return <SdHomeView />;
    case 'roadmap':
      return <SdRoadmapView />;
    case 'module':
      return <SdModuleView key={view.id} id={view.id} />;
    case 'quiz':
      return <SdQuizView key={`${view.mode}-${view.moduleId ?? 'all'}`} mode={view.mode} moduleId={view.moduleId} />;
    case 'flash':
      return <SdFlashView key={view.moduleId ?? 'all'} moduleId={view.moduleId} />;
    case 'workbench':
    default:
      return null;
  }
};

const EMPTY_STATUS: ModuleStatusSnapshot = {
  completed: false,
  lessonRead: false,
  passedExercises: 0,
  totalExercises: 0,
  quizPassed: false,
};

export const SdLearnShell: React.FC = () => {
  const view = useSdNav((x) => x.view);
  const go = useSdNav((x) => x.go);

  const hydrated = useSdProgress((x) => x.hydrated);
  const hydrate = useSdProgress((x) => x.hydrate);
  const sdState = useSdProgress((x) => x.state);
  const markLessonRead = useSdProgress((x) => x.markLessonRead);
  const syncMeta = useSdProgress((x) => x.syncMeta);

  const lang = useWorkbenchStore((s) => s.language);
  const cursorModId = useWorkbenchStore((s) => s.cursors.sdmastery?.moduleId);

  const { data: cur } = useSdCurriculum();
  const { data: sims } = useSdSims();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.getElementById('course-scroll-sd')?.scrollTo({ top: 0 });
  }, [view]);

  const scaleLessons = useMemo(() => (cur ? buildSdScaleLessons(cur, sims) : []), [cur, sims]);
  const liveSimAdapter = useMemo(() => createSdLiveSimAdapter(sims), [sims]);

  const getModuleStatus = useCallback(
    (moduleId: string): ModuleStatusSnapshot => {
      const mod = cur?.modules.find((m) => m.id === moduleId);
      if (!cur || !mod) return EMPTY_STATUS;
      return {
        completed: sdModuleDone(sdState, mod, cur.passQuiz),
        lessonRead: lessonSatisfied(sdState, mod.id),
        passedExercises: 0,
        totalExercises: 0,
        quizPassed: quizSatisfied(sdState, mod.id, cur.passQuiz),
      };
    },
    [cur, sdState]
  );

  if (!hydrated || !cur || !sims) {
    return <Spinner label={lang === 'en' ? 'Loading System Design workbench…' : 'Đang tải bàn học System Design…'} />;
  }

  if (view.name === 'workbench') {
    return (
      <ScaleWorkbenchLayout
        courseId="sdmastery"
        lessons={scaleLessons}
        getModuleStatus={getModuleStatus}
        onMarkLessonComplete={(moduleId) => {
          markLessonRead(moduleId);
        }}
        onOpenQuiz={(moduleId) => go({ name: 'quiz', mode: 'module', moduleId })}
        onOpenFlashcards={(moduleId) => go({ name: 'flash', moduleId })}
        liveSimAdapter={liveSimAdapter}
      />
    );
  }

  const ctxMod = ('moduleId' in view && view.moduleId) || ('id' in view && view.id) || cursorModId || '';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--dts-canvas)] text-[var(--dts-ink)]">
      <nav
        aria-label="Practice navigation"
        className="@container shrink-0 border-b border-[var(--dts-line-strong)] bg-[var(--dts-panel)] px-2.5 sm:px-3.5"
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-2 gap-y-1.5 py-1.5">
          <div className="flex min-w-0 max-w-full items-center gap-2">
            <button
              type="button"
              onClick={() => go({ name: 'workbench' })}
              title={lang === 'en' ? 'Back to interactive lesson' : 'Quay lại bài học tương tác'}
              className="dts-btn-tactile inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--dts-green-bg)] px-2.5 font-mono text-xs font-extrabold text-[var(--dts-green-ink)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden @[520px]:inline">{lang === 'en' ? 'Lesson' : 'Bài học'}</span>
              {ctxMod && <span className="py-0.2 rounded bg-black/8 px-1 text-[10.5px]">{ctxMod}</span>}
            </button>

            <div
              role="tablist"
              aria-label={lang === 'en' ? 'Practice modes' : 'Chế độ ôn luyện'}
              className="no-scrollbar inline-flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] p-0.5"
            >
              {SD_PRACTICE_TABS.map((tab) => {
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
                      'inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[9px] px-2.5 font-mono text-xs font-bold transition-all',
                      active
                        ? 'border border-[var(--dts-border)] bg-[var(--dts-blue-bg)] font-extrabold text-[var(--dts-blue-ink)] shadow-[1px_1px_0_var(--dts-shadow-color)]'
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go({ name: 'roadmap' })}
              title={lang === 'en' ? 'Full syllabus roadmap' : 'Lộ trình toàn bộ các bài'}
              className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-bold transition-all',
                view.name === 'roadmap' || view.name === 'module'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] font-extrabold text-[var(--dts-blue-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)]'
              )}
            >
              <MapIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden @[740px]:inline">{lang === 'en' ? 'Roadmap' : 'Lộ trình'}</span>
            </button>

            <button
              type="button"
              onClick={() => go({ name: 'home' })}
              title={lang === 'en' ? 'XP, rank & daily study streak' : 'Tổng quan XP, cấp bậc và chuỗi ngày học'}
              className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 font-mono text-xs font-extrabold tabular-nums transition-all',
                view.name === 'home'
                  ? 'border-[var(--dts-border)] bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)] shadow-[1px_1.5px_0_var(--dts-shadow-color)]'
                  : 'border-[var(--dts-line-strong)] bg-[var(--dts-panel-elevated)] text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
              )}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0 text-[#d98a1e]" />
              <span>{sdState.xp} XP</span>
            </button>

            <ProgressSyncBadge meta={syncMeta} />
          </div>
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto" id="course-scroll-sd">
        <ViewSwitch view={view} />
      </div>
    </div>
  );
};
