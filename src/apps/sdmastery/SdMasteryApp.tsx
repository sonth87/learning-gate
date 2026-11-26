import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextAction, useMenuAction } from '@sonth87/device-layout';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { SdLearnShell } from '@/features/sysdesign-course/SdLearnShell';
import { SdCreditsView } from '@/features/sysdesign-course/views/SdCreditsView';
import { useSdCurriculum, useSdSims } from '@/features/sysdesign-course/data';
import { buildSdScaleLessons } from '@/features/sysdesign-course/scale/sdLessonBuilder';
import { useSdNav, useSdProgress } from '@/features/sysdesign-course/store';
import { ScaleCommandPalette } from '@/components/scale-workbench/ScaleCommandPalette';
import { TermPopover } from '@/components/common/TermPopover';
import { NotesDrawer } from '@/components/common/NotesDrawer';
import { cn } from '@/utils/cn';
import { SD_TAB_ORDER, type SdMainTab } from './sd.types';
import { useSdStore } from './store/useSdStore';
import { SdHeader } from './components/SdHeader';
import { SdMobileBottomNav } from './components/SdMobileBottomNav';
import { SD_COMMAND_PALETTE_GLOSSARY } from './data/atlasPatterns';
import { SdLabView } from './views/SdLabView';
import { SdWarRoomView } from './views/SdWarRoomView';
import { SdCasesView } from './views/SdCasesView';
import { SdAtlasView } from './views/SdAtlasView';
import { SdInterviewView } from './views/SdInterviewView';

export interface SdMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const SdMasteryApp: React.FC<SdMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab } = useSdStore();
  const [atlasInitialTermId, setAtlasInitialTermId] = useState<string | null>(null);
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);
  const hydrateSd = useSdProgress((s) => s.hydrate);
  const goSd = useSdNav((s) => s.go);

  const workbenchTheme = useWorkbenchStore((s) => s.workbenchTheme);
  const setSearchPaletteOpen = useWorkbenchStore((s) => s.setSearchPaletteOpen);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = useSdCurriculum();
  const { data: sims } = useSdSims();
  const scaleLessons = useMemo(() => (cur ? buildSdScaleLessons(cur, sims) : []), [cur, sims]);

  useEffect(() => {
    hydrateSd();
  }, [hydrateSd]);

  const openModuleInLearn = useCallback(
    (moduleId: string, stepIdx = 0) => {
      const lesson = scaleLessons.find((l) => l.moduleId === moduleId);
      const stepObj = lesson?.steps[stepIdx];
      setCourseCursor(
        'sdmastery',
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
      if (lesson) setExpandedLevel('sdmastery', lesson.level);
      setActiveTab('learn');
      goSd({ name: 'workbench' });
    },
    [goSd, scaleLessons, setActiveTab, setCourseCursor, setExpandedLevel]
  );

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchPaletteOpen(true, 'sdmastery');
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as SdMainTab;
        if (!SD_TAB_ORDER.includes(tab)) return;
        setActiveTab(tab);
        if (tab === 'learn') goSd({ name: 'workbench' });
      }
    },
    [goSd, setActiveTab, setSearchPaletteOpen, setSettingsOpen]
  );

  useMenuAction('sdmastery', handleAction, windowId);
  useContextAction('sdmastery', handleAction);

  const isLight = workbenchTheme === 'light';

  return (
    <div
      onClick={() => hideTermPopover(false)}
      className={cn(
        'pylearn-root dts-shell @container/app relative w-full h-full min-h-0 min-w-0 bg-[var(--dts-canvas)] text-[var(--dts-ink)] flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light dts-light' : 'pylearn-dark dts-dark'
      )}
    >
      <SdHeader windowId={windowId} />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && <SdLearnShell />}
        {activeTab === 'lab' && <SdLabView />}
        {activeTab === 'warroom' && <SdWarRoomView onOpenModule={openModuleInLearn} />}
        {activeTab === 'cases' && <SdCasesView onOpenModule={openModuleInLearn} />}
        {activeTab === 'atlas' && (
          <SdAtlasView initialTermId={atlasInitialTermId} onOpenModule={openModuleInLearn} />
        )}
        {activeTab === 'interview' && (
          <SdInterviewView
            onOpenModule={openModuleInLearn}
            onOpenLab={() => setActiveTab('lab')}
          />
        )}
        {activeTab === 'credits' && (
          <div className="h-full overflow-y-auto">
            <SdCreditsView />
          </div>
        )}
      </main>

      <SdMobileBottomNav />
      <TermPopover />
      <NotesDrawer />
      <ScaleCommandPalette
        courseId="sdmastery"
        lessons={scaleLessons}
        glossaryItems={SD_COMMAND_PALETTE_GLOSSARY}
        onSelectLessonStep={(moduleId, stepIdx) => {
          openModuleInLearn(moduleId, stepIdx);
        }}
        onSelectGlossaryTerm={(termId) => {
          setAtlasInitialTermId(termId);
          setActiveTab('atlas');
        }}
      />
      <SettingsModal />
    </div>
  );
};

export default SdMasteryApp;
