import React, { useCallback, useEffect, useMemo } from 'react';
import { useMenuAction, useContextAction } from '@sonth87/device-layout';
import { switchLearningApp, type LearningAppId } from '@/apps/appRegistry';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { DevOpsCourseApp } from '@/features/devops-course/DevOpsCourseApp';
import { useCourseCurriculum } from '@/features/devops-course/data';
import { buildDevOpsScaleLessons } from '@/features/devops-course/scale/courseLessonBuilder';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useKubeNav, useKubeProgress } from '@/features/devops-course/store';
import type { RelatedToolLink } from '@/features/devops-course/types';
import { ScaleCommandPalette } from '@/components/scale-workbench/ScaleCommandPalette';
import { useKubeStore } from './store/useKubeStore';
import { AnimatedFlowType, KubeTab } from './types/kube.types';
import { KUBE_BLUEPRINTS, KUBE_LEVEL_TITLES } from './data/kubeScaleCurator';
import { KubeHeader } from './components/KubeHeader';
import { KubeMobileBottomNav } from './components/KubeMobileBottomNav';
import { CurriculumView } from './components/CurriculumView';
import { FlowStudioHub } from './components/FlowStudioHub';
import { ClusterSimulatorLab } from './components/ClusterSimulatorLab';
import { IncidentWarRoom } from './components/IncidentWarRoom';
import { PracticeLabsHub } from './components/PracticeLabsHub';
import { GlossaryAndCheatsheetHub } from './components/GlossaryAndCheatsheetHub';
import { KubeExamCenter } from './components/KubeExamCenter';
import { TermPopover } from '@/components/common/TermPopover';
import { NotesDrawer } from '@/components/common/NotesDrawer';
import { cn } from '@/utils/cn';

export interface KubeMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const KubeMasteryApp: React.FC<KubeMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab, openFlowInStudio, openIncidentInWarRoom } = useKubeStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);
  const hydrateKube = useKubeProgress((s) => s.hydrate);
  const goKube = useKubeNav((s) => s.go);

  const workbenchTheme = useWorkbenchStore((s) => s.workbenchTheme);
  const setSearchPaletteOpen = useWorkbenchStore((s) => s.setSearchPaletteOpen);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = useCourseCurriculum('kube');
  const enOverlay = useCourseEnOverlay('kube');
  const scaleLessons = useMemo(
    () =>
      cur
        ? buildDevOpsScaleLessons('kube', cur, KUBE_LEVEL_TITLES, KUBE_BLUEPRINTS, enOverlay)
        : [],
    [cur, enOverlay]
  );

  useEffect(() => {
    hydrateKube();
  }, [hydrateKube]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchPaletteOpen(true, 'kubemastery');
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as KubeTab;
        setActiveTab(tab);
        if (tab === 'learn') {
          goKube({ name: 'workbench' });
        }
      }
    },
    [goKube, setActiveTab, setSearchPaletteOpen, setSettingsOpen]
  );

  useMenuAction('kubemastery', handleAction, windowId);
  useContextAction('kubemastery', handleAction);

  const handleRelatedTool = useCallback(
    (link: RelatedToolLink) => {
      if (link.kind === 'flow') {
        openFlowInStudio(link.targetId as AnimatedFlowType);
      } else if (link.kind === 'incident') {
        openIncidentInWarRoom(link.targetId);
      } else if (link.kind === 'tab') {
        setActiveTab(link.targetId as KubeTab);
      } else if (link.kind === 'cross-app') {
        switchLearningApp(link.targetId as LearningAppId);
      }
    },
    [openFlowInStudio, openIncidentInWarRoom, setActiveTab]
  );

  const isLight = workbenchTheme === 'light';

  return (
    <div
      onClick={() => hideTermPopover(false)}
      className={cn(
        'pylearn-root dts-shell @container/app relative w-full h-full min-h-0 min-w-0 bg-[var(--dts-canvas)] text-[var(--dts-ink)] flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light dts-light' : 'pylearn-dark dts-dark'
      )}
    >
      <KubeHeader windowId={windowId} />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && <DevOpsCourseApp courseId="kube" onOpenRelatedTool={handleRelatedTool} />}
        {activeTab === 'curriculum' && <CurriculumView />}
        {activeTab === 'flow-studio' && (
          <div className="h-full overflow-y-auto">
            <FlowStudioHub />
          </div>
        )}
        {activeTab === 'cluster-sim' && (
          <div className="h-full overflow-y-auto">
            <ClusterSimulatorLab />
          </div>
        )}
        {activeTab === 'incidents' && (
          <div className="h-full overflow-y-auto">
            <IncidentWarRoom />
          </div>
        )}
        {activeTab === 'practice' && (
          <div className="h-full overflow-y-auto">
            <PracticeLabsHub />
          </div>
        )}
        {activeTab === 'glossary' && (
          <div className="h-full overflow-y-auto">
            <GlossaryAndCheatsheetHub />
          </div>
        )}
        {activeTab === 'exams' && (
          <div className="h-full overflow-y-auto">
            <KubeExamCenter />
          </div>
        )}
      </main>

      <KubeMobileBottomNav />
      <TermPopover />
      <NotesDrawer />
      <ScaleCommandPalette
        courseId="kubemastery"
        lessons={scaleLessons}
        onSelectLessonStep={(moduleId, stepIdx) => {
          const lesson = scaleLessons.find((l) => l.moduleId === moduleId);
          const stepObj = lesson?.steps[stepIdx];
          setCourseCursor(
            'kubemastery',
            moduleId,
            stepIdx,
            lesson && stepObj
              ? {
                  moduleTitleVi: lesson.title.vi,
                  moduleTitleEn: lesson.title.en,
                  stepTitleVi: stepObj.title.vi,
                  stepTitleEn: stepObj.title.en,
                }
              : undefined
          );
          if (lesson) setExpandedLevel('kubemastery', lesson.level);
          setActiveTab('learn');
          goKube({ name: 'workbench' });
        }}
        onSelectGlossaryTerm={() => {
          setActiveTab('glossary');
        }}
      />
      <SettingsModal />
    </div>
  );
};

export default KubeMasteryApp;
