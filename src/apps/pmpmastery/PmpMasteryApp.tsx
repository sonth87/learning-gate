import React, { useCallback, useEffect, useMemo } from 'react';
import { useContextAction, useMenuAction } from '@sonth87/device-layout';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { PmpLearnShell } from '@/features/pmp-course/PmpLearnShell';
import { usePmpCurriculum, usePmpLinks } from '@/features/pmp-course/data';
import { MindmapQuickPreviewModal } from '@/features/pmp-course/links';
import { usePmpAppStore, usePmpNav, usePmpProgress } from '@/features/pmp-course/store';
import type { PmpTab } from '@/features/pmp-course/types';
import { PmpCanvasView } from '@/features/pmp-course/views/PmpCanvasView';
import { PmpDecisionTreeView } from '@/features/pmp-course/views/PmpDecisionTreeView';
import { PmpLookupView } from '@/features/pmp-course/views/PmpLookupView';
import { buildPmpScaleLessons } from '@/features/devops-course/scale/courseLessonBuilder';
import { useCourseEnOverlay } from '@/data/i18n/loader';
import { ScaleCommandPalette } from '@/components/scale-workbench/ScaleCommandPalette';
import { PMP_BLUEPRINTS, PMP_LEVEL_TITLES } from './data/pmpScaleCurator';
import { PmpHeader } from './components/PmpHeader';
import { PmpMobileBottomNav } from './components/PmpMobileBottomNav';
import { TermPopover } from '@/components/common/TermPopover';
import { NotesDrawer } from '@/components/common/NotesDrawer';
import { cn } from '@/utils/cn';

export interface PmpMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const PmpMasteryApp: React.FC<PmpMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab, previewLink, closeQuickPreview } = usePmpAppStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hideTermPopover = useNavigationStore((s) => s.hideTermPopover);
  const hydratePmp = usePmpProgress((s) => s.hydrate);
  const markVisited = usePmpProgress((s) => s.markEvidenceVisited);
  const goPmp = usePmpNav((s) => s.go);

  const workbenchTheme = useWorkbenchStore((s) => s.workbenchTheme);
  const setSearchPaletteOpen = useWorkbenchStore((s) => s.setSearchPaletteOpen);
  const setCourseCursor = useWorkbenchStore((s) => s.setCourseCursor);
  const setExpandedLevel = useWorkbenchStore((s) => s.setExpandedLevel);

  const { data: cur } = usePmpCurriculum();
  const { data: linksMap } = usePmpLinks();
  const enOverlay = useCourseEnOverlay('pmp');

  const scaleLessons = useMemo(
    () => (cur ? buildPmpScaleLessons(cur, PMP_LEVEL_TITLES, PMP_BLUEPRINTS, enOverlay) : []),
    [cur, enOverlay]
  );

  const glossaryItems = useMemo(
    () =>
      Object.values(linksMap ?? {}).map((l) => ({
        id: l.linkId,
        term: l.label,
        shortSummary: l.whyRead,
      })),
    [linksMap]
  );

  useEffect(() => {
    hydratePmp();
  }, [hydratePmp]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchPaletteOpen(true, 'pmpmastery');
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action === 'openMindmapExternal') {
        window.open('https://pmp-mindmap.vercel.app/?lang=vi', '_blank', 'noopener,noreferrer');
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as PmpTab;
        setActiveTab(tab);
        if (tab === 'learn') {
          goPmp({ name: 'workbench' });
        }
      }
    },
    [goPmp, setActiveTab, setSearchPaletteOpen, setSettingsOpen]
  );

  useMenuAction('pmpmastery', handleAction, windowId);
  useContextAction('pmpmastery', handleAction);

  const isLight = workbenchTheme === 'light';

  return (
    <div
      onClick={() => hideTermPopover(false)}
      className={cn(
        'pylearn-root dts-shell @container/app relative w-full h-full min-h-0 min-w-0 bg-[var(--dts-canvas)] text-[var(--dts-ink)] flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light dts-light' : 'pylearn-dark dts-dark'
      )}
    >
      <PmpHeader windowId={windowId} />

      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && <PmpLearnShell />}
        {activeTab === 'canvas' && (
          <div className="h-full overflow-y-auto">
            <PmpCanvasView />
          </div>
        )}
        {activeTab === 'decision' && (
          <div className="h-full overflow-y-auto">
            <PmpDecisionTreeView />
          </div>
        )}
        {activeTab === 'lookup' && (
          <div className="h-full overflow-y-auto">
            <PmpLookupView />
          </div>
        )}
      </main>

      <PmpMobileBottomNav />
      <MindmapQuickPreviewModal
        link={previewLink}
        onClose={closeQuickPreview}
        onVisited={markVisited}
      />
      <TermPopover />
      <NotesDrawer />
      <ScaleCommandPalette
        courseId="pmpmastery"
        lessons={scaleLessons}
        glossaryItems={glossaryItems}
        onSelectLessonStep={(moduleId, stepIdx) => {
          const lesson = scaleLessons.find((l) => l.moduleId === moduleId);
          const stepObj = lesson?.steps[stepIdx];
          setCourseCursor(
            'pmpmastery',
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
          if (lesson) setExpandedLevel('pmpmastery', lesson.level);
          setActiveTab('learn');
          goPmp({ name: 'workbench' });
        }}
        onSelectGlossaryTerm={() => {
          setActiveTab('lookup');
        }}
      />
      <SettingsModal />
    </div>
  );
};

export default PmpMasteryApp;
