import React, { useCallback, useEffect } from 'react';
import {
  useStore,
  useMenuAction,
  useContextAction,
} from '@sonth87/device-layout';
import { switchLearningApp, type LearningAppId } from '@/apps/appRegistry';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { DevOpsCourseApp } from '@/features/devops-course/DevOpsCourseApp';
import { useCicdProgress } from '@/features/devops-course/store';
import type { RelatedToolLink } from '@/features/devops-course/types';
import { CicdMainTab } from './types/cicd.types';
import { useCicdNavigationStore } from './stores/useCicdNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { CicdHeader } from './components/layout/CicdHeader';
import { CicdMobileBottomNav } from './components/layout/CicdMobileBottomNav';
import { CicdSidebar } from './components/curriculum/CicdSidebar';
import { CicdLessonView } from './components/curriculum/CicdLessonView';
import { CicdLivePipelineSimulator } from './components/simulator/CicdLivePipelineSimulator';
import { CicdIncidentWarRoom } from './components/warroom/CicdIncidentWarRoom';
import { CicdPracticeLab } from './components/practice/CicdPracticeLab';
import { CicdBlueprintsExplorer } from './components/blueprints/CicdBlueprintsExplorer';
import { CicdFlashcardDeck } from './components/assessment/CicdFlashcardDeck';
import { CicdExamCenter } from './components/assessment/CicdExamCenter';
import { CicdGlossaryAndMatrices } from './components/glossary/CicdGlossaryAndMatrices';
import { NotesDrawer } from '@/components/common/NotesDrawer';
import { cn } from '@/utils/cn';

export interface CicdMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const CicdMasteryApp: React.FC<CicdMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab, selectWarRoom, selectBlueprint, setSimulatorMode } = useCicdNavigationStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hydrateAll = useUserDataStore((s) => s.hydrateAll);
  const hydrateCicd = useCicdProgress((s) => s.hydrate);
  const fontSize = useSettingsStore((s) => s.fontSize);

  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const isLight = deviceResolvedScheme === 'light';

  useEffect(() => {
    hydrateAll();
    hydrateCicd();
  }, [hydrateAll, hydrateCicd]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as CicdMainTab;
        setActiveTab(tab);
      }
    },
    [setActiveTab, setSettingsOpen]
  );

  useMenuAction('cicdmastery', handleAction, windowId);
  useContextAction('cicdmastery', handleAction);

  const handleRelatedTool = useCallback(
    (link: RelatedToolLink) => {
      if (link.kind === 'warroom') {
        selectWarRoom(link.targetId);
      } else if (link.kind === 'blueprint') {
        selectBlueprint(link.targetId);
      } else if (link.kind === 'simulator-preset') {
        setSimulatorMode(link.targetId === 'traffic' ? 'traffic' : 'pipeline');
      } else if (link.kind === 'tab') {
        setActiveTab(link.targetId as CicdMainTab);
      } else if (link.kind === 'cross-app') {
        switchLearningApp(link.targetId as LearningAppId);
      }
    },
    [selectBlueprint, selectWarRoom, setActiveTab, setSimulatorMode]
  );

  return (
    <div
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark',
        fontSize === 'sm' && 'text-sm',
        fontSize === 'base' && 'text-base',
        fontSize === 'lg' && 'text-lg'
      )}
    >
      <CicdHeader />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && <DevOpsCourseApp courseId="cicd" onOpenRelatedTool={handleRelatedTool} />}

        {activeTab === 'curriculum' && (
          <div className="flex h-full w-full flex-row overflow-hidden">
            <CicdSidebar />
            <CicdLessonView />
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="h-full overflow-y-auto">
            <CicdLivePipelineSimulator />
          </div>
        )}

        {activeTab === 'warroom' && (
          <div className="h-full overflow-y-auto">
            <CicdIncidentWarRoom />
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="h-full overflow-y-auto">
            <CicdPracticeLab />
          </div>
        )}

        {activeTab === 'blueprints' && (
          <div className="h-full overflow-y-auto">
            <CicdBlueprintsExplorer />
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="h-full overflow-y-auto">
            <CicdFlashcardDeck />
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="h-full overflow-y-auto">
            <CicdExamCenter />
          </div>
        )}

        {activeTab === 'glossary' && (
          <div className="h-full overflow-y-auto">
            <CicdGlossaryAndMatrices />
          </div>
        )}
      </main>

      <CicdMobileBottomNav />

      <NotesDrawer />
      <SettingsModal />
    </div>
  );
};

export default CicdMasteryApp;
