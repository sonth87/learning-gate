import React from 'react';
import { useStore, useMenuAction, useContextAction } from '@sonth87/device-layout';
import { useKubeStore } from './store/useKubeStore';
import { KubeTab } from './types/kube.types';
import { KubeHeader } from './components/KubeHeader';
import { CurriculumView } from './components/CurriculumView';
import { FlowStudioHub } from './components/FlowStudioHub';
import { ClusterSimulatorLab } from './components/ClusterSimulatorLab';
import { CicdPipelineSimulator } from './components/CicdPipelineSimulator';
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
  const { activeTab, setActiveTab, setSearchOpen } = useKubeStore();
  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const isLight = deviceResolvedScheme === 'light';

  const handleAction = (action: string) => {
    if (action === 'quickSearch') {
      setSearchOpen(true);
    } else if (action.startsWith('tab:')) {
      const tab = action.replace('tab:', '') as KubeTab;
      setActiveTab(tab);
    }
  };

  useMenuAction('kubemastery', handleAction, windowId);
  useContextAction('kubemastery', handleAction);

  return (
    <div
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark'
      )}
    >
      <KubeHeader />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
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
        {activeTab === 'cicd-sim' && (
          <div className="h-full overflow-y-auto">
            <CicdPipelineSimulator />
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
    </div>
  );
};

export default KubeMasteryApp;
