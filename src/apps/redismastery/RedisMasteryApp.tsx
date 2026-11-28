import React, { useCallback, useEffect, useMemo } from 'react';
import { useContextAction, useMenuAction } from '@sonth87/device-layout';
import { switchLearningApp, type LearningAppId } from '@/apps/appRegistry';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { DevOpsCourseApp } from '@/features/devops-course/DevOpsCourseApp';
import { useCourseCurriculum } from '@/features/devops-course/data';
import { buildDevOpsScaleLessons } from '@/features/devops-course/scale/courseLessonBuilder';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { useRedisNav, useRedisProgress } from '@/features/devops-course/store';
import type { RelatedToolLink } from '@/features/devops-course/types';
import { ScaleCommandPalette } from '@/components/scale-workbench/ScaleCommandPalette';
import { useRedisStore } from './store/useRedisStore';
import type { RedisFlowId, RedisMainTab, RedisSimMode } from './types/redis.types';
import { REDIS_BLUEPRINTS, REDIS_LEVEL_TITLES } from './data/redisScaleCurator';
import { REDIS_GLOSSARY_ENTRIES } from './data/redisGlossaryData';
import { RedisHeader } from './components/RedisHeader';
import { RedisMobileBottomNav } from './components/RedisMobileBottomNav';
import { RedisSimulatorLab } from './components/RedisSimulatorLab';
import { RedisFlowStudio } from './components/RedisFlowStudio';
import { RedisIncidentWarRoom } from './components/RedisIncidentWarRoom';
import { RedisGlossaryHub } from './components/RedisGlossaryHub';
import { TermPopover } from '@/components/common/TermPopover';
import { NotesDrawer } from '@/components/common/NotesDrawer';
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
  } = useRedisStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);
  const hydrateRedis = useRedisProgress((s) => s.hydrate);
  const goRedis = useRedisNav((s) => s.go);

  const workbenchTheme = useWorkbenchStore((s) => s.workbenchTheme);
  const setSearchPaletteOpen = useWorkbenchStore((s) => s.setSearchPaletteOpen);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = useCourseCurriculum('redis');
  const enOverlay = useCourseEnOverlay('redis');
  const scaleLessons = useMemo(
    () =>
      cur
        ? buildDevOpsScaleLessons('redis', cur, REDIS_LEVEL_TITLES, REDIS_BLUEPRINTS, enOverlay)
        : [],
    [cur, enOverlay]
  );

  const glossaryItems = useMemo(
    () =>
      REDIS_GLOSSARY_ENTRIES.map((g) => ({
        id: g.id,
        term: `${g.term} (${g.complexity})`,
        shortSummary: g.summary,
      })),
    []
  );

  useEffect(() => {
    hydrateRedis();
  }, [hydrateRedis]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchPaletteOpen(true, 'redismastery');
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as RedisMainTab;
        setActiveTab(tab);
        if (tab === 'learn') {
          goRedis({ name: 'workbench' });
        }
      }
    },
    [goRedis, setActiveTab, setSearchPaletteOpen, setSettingsOpen]
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

  const isLight = workbenchTheme === 'light';

  return (
    <div
      onClick={() => hideTermPopover(false)}
      className={cn(
        'pylearn-root dts-shell @container/app relative w-full h-full min-h-0 min-w-0 bg-[var(--dts-canvas)] text-[var(--dts-ink)] flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light dts-light' : 'pylearn-dark dts-dark'
      )}
    >
      <RedisHeader windowId={windowId} />

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
      <TermPopover />
      <NotesDrawer />
      <ScaleCommandPalette
        courseId="redismastery"
        lessons={scaleLessons}
        glossaryItems={glossaryItems}
        onSelectLessonStep={(moduleId, stepIdx) => {
          const lesson = scaleLessons.find((l) => l.moduleId === moduleId);
          const stepObj = lesson?.steps[stepIdx];
          setCourseCursor(
            'redismastery',
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
          if (lesson) setExpandedLevel('redismastery', lesson.level);
          setActiveTab('learn');
          goRedis({ name: 'workbench' });
        }}
        onSelectGlossaryTerm={() => {
          setActiveTab('glossary');
        }}
      />
      <SettingsModal />
    </div>
  );
};

export default RedisMasteryApp;
