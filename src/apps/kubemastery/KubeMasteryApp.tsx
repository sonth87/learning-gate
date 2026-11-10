import React, { useCallback, useEffect } from 'react';
import { useStore, useMenuAction, useContextAction } from '@sonth87/device-layout';
import { switchLearningApp } from '@/apps/appRegistry';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { DevOpsCourseApp } from '@/features/devops-course/DevOpsCourseApp';
import { useKubeProgress } from '@/features/devops-course/store';
import type { RelatedToolLink } from '@/features/devops-course/types';
import { useKubeStore } from './store/useKubeStore';
import { AnimatedFlowType, KubeTab } from './types/kube.types';
import { KubeHeader } from './components/KubeHeader';
import { KubeMobileBottomNav } from './components/KubeMobileBottomNav';
import { CurriculumView } from './components/CurriculumView';
import { FlowStudioHub } from './components/FlowStudioHub';
import { ClusterSimulatorLab } from './components/ClusterSimulatorLab';
import { IncidentWarRoom } from './components/IncidentWarRoom';
import { PracticeLabsHub } from './components/PracticeLabsHub';
import { GlossaryAndCheatsheetHub } from './components/GlossaryAndCheatsheetHub';
import { KubeExamCenter } from './components/KubeExamCenter';
import { cn } from '@/utils/cn';

export interface KubeMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const KubeMasteryApp: React.FC<KubeMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab, setSearchOpen, openFlowInStudio, openIncidentInWarRoom } = useKubeStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hydrateKube = useKubeProgress((s) => s.hydrate);
  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const isLight = deviceResolvedScheme === 'light';

  useEffect(() => {
    hydrateKube();
  }, [hydrateKube]);

  const handleAction = (action: string) => {
    if (action === 'quickSearch') {
      setSearchOpen(true);
    } else if (action === 'openSettings') {
      setSettingsOpen(true);
    } else if (action.startsWith('tab:')) {
      const tab = action.replace('tab:', '') as KubeTab;
      setActiveTab(tab);
    }
  };

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
        switchLearningApp(link.targetId as 'pymastery' | 'kubemastery' | 'cicdmastery');
      }
    },
    [openFlowInStudio, openIncidentInWarRoom, setActiveTab]
  );

  return (
    <div
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark'
      )}
    >
      <KubeHeader />

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
      <SettingsModal />
    </div>
  );
};

export default KubeMasteryApp;
