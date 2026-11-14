import React, { useCallback, useEffect } from 'react';
import { useContextAction, useMenuAction, useStore } from '@sonth87/device-layout';
import { switchLearningApp, type LearningAppId } from '@/apps/appRegistry';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { DevOpsCourseApp } from '@/features/devops-course/DevOpsCourseApp';
import { useRedisProgress } from '@/features/devops-course/store';
import type { RelatedToolLink } from '@/features/devops-course/types';
import { useRedisStore } from './store/useRedisStore';
import type { RedisFlowId, RedisMainTab, RedisSimMode } from './types/redis.types';
import { RedisHeader } from './components/RedisHeader';
import { RedisMobileBottomNav } from './components/RedisMobileBottomNav';
import { RedisSimulatorLab } from './components/RedisSimulatorLab';
import { RedisFlowStudio } from './components/RedisFlowStudio';
import { RedisIncidentWarRoom } from './components/RedisIncidentWarRoom';
import { RedisGlossaryHub } from './components/RedisGlossaryHub';
import { cn } from '@/utils/cn';

export interface RedisMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const RedisMasteryApp: React.FC<RedisMasteryAppProps> = ({ windowId }) => {
  const {
    activeTab,
    setActiveTab,
    openSimulatorMode,
    openFlowInStudio,
    openIncidentInWarRoom,
    setSearchOpen,
  } = useRedisStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hydrateRedis = useRedisProgress((s) => s.hydrate);
  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const isLight = deviceResolvedScheme === 'light';

  useEffect(() => {
    hydrateRedis();
  }, [hydrateRedis]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchOpen(true);
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as RedisMainTab;
        setActiveTab(tab);
      }
    },
    [setActiveTab, setSearchOpen, setSettingsOpen]
  );

  useMenuAction('redismastery', handleAction, windowId);
  useContextAction('redismastery', handleAction);

  const handleRelatedTool = useCallback(
    (link: RelatedToolLink) => {
      if (link.kind === 'flow') {
        openFlowInStudio(link.targetId as RedisFlowId);
      } else if (link.kind === 'incident' || link.kind === 'warroom') {
        openIncidentInWarRoom(link.targetId);
      } else if (link.kind === 'simulator-preset') {
        openSimulatorMode(link.targetId as RedisSimMode);
      } else if (link.kind === 'tab') {
        setActiveTab(link.targetId as RedisMainTab);
      } else if (link.kind === 'cross-app') {
        switchLearningApp(link.targetId as LearningAppId);
      }
    },
    [openFlowInStudio, openIncidentInWarRoom, openSimulatorMode, setActiveTab]
  );

  return (
    <div
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark'
      )}
    >
      <RedisHeader />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && (
          <DevOpsCourseApp courseId="redis" onOpenRelatedTool={handleRelatedTool} />
        )}
        {activeTab === 'simulator' && (
          <div className="h-full overflow-y-auto">
            <RedisSimulatorLab />
          </div>
        )}
        {activeTab === 'flow-studio' && (
          <div className="h-full overflow-y-auto">
            <RedisFlowStudio />
          </div>
        )}
        {activeTab === 'incidents' && (
          <div className="h-full overflow-y-auto">
            <RedisIncidentWarRoom />
          </div>
        )}
        {activeTab === 'glossary' && (
          <div className="h-full overflow-y-auto">
            <RedisGlossaryHub />
          </div>
        )}
      </main>

      <RedisMobileBottomNav />
      <SettingsModal />
    </div>
  );
};

export default RedisMasteryApp;
