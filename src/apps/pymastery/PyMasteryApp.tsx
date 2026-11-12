import React, { useCallback, useEffect } from 'react';
import { useStore, useMenuAction, useContextAction } from '@sonth87/device-layout';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { useUserDataStore } from '@/stores/useUserDataStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { LessonView } from '@/components/curriculum/LessonView';
import { PythonPlaygroundIDE } from '@/components/playground/PythonPlaygroundIDE';
import { PracticeHub } from '@/components/practice/PracticeHub';
import { ProjectSamplesHub } from '@/components/samples/ProjectSamplesHub';
import { FlashcardDeck } from '@/components/assessment/FlashcardDeck';
import { ExamCenter } from '@/components/assessment/ExamCenter';
import { GlossaryExplorer } from '@/components/glossary/GlossaryExplorer';
import { ReferenceHub } from '@/components/reference/ReferenceHub';
import { TermPopover } from '@/components/common/TermPopover';
import { NotesDrawer } from '@/components/common/NotesDrawer';
import { GlobalSearchModal } from '@/components/common/GlobalSearchModal';
import { SetupGuideModal } from '@/components/common/SetupGuideModal';
import { WpApp } from '@/features/workpath/WpApp';
import { useWpProgress } from '@/features/workpath/store';
import { cn } from '@/utils/cn';

export interface PyMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const PyMasteryApp: React.FC<PyMasteryAppProps> = ({ windowId }) => {
  const {
    activeTab,
    setActiveTab,
    hideTermPopover,
    setSearchOpen,
    setSettingsOpen,
    isSetupGuideOpen,
    setupGuideProject,
    setSetupGuideOpen,
    openNotesDrawer,
    selectedLessonId,
  } = useNavigationStore();
  const hydrateAll = useUserDataStore((s) => s.hydrateAll);
  const hydrateWp = useWpProgress((s) => s.hydrate);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const toggleJsTsComparison = useSettingsStore((s) => s.toggleJsTsComparison);

  // Read resolved color scheme from DeviceLayout so Control Center & PyMastery stay in sync
  const deviceColorScheme = useStore((s) => s.colorScheme);
  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  useEffect(() => {
    hydrateAll();
    hydrateWp();
  }, [hydrateAll, hydrateWp]);

  // When user changes theme from DeviceLayout Control Center, sync back to useSettingsStore
  useEffect(() => {
    const mapped = deviceColorScheme === 'auto' ? 'system' : deviceColorScheme;
    if (useSettingsStore.getState().theme !== mapped) {
      setTheme(mapped);
    }
  }, [deviceColorScheme, setTheme]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchOpen(true);
      } else if (action === 'openNotes') {
        openNotesDrawer('lesson', selectedLessonId, `Bài học: ${selectedLessonId}`);
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action === 'toggleJsTs') {
        toggleJsTsComparison();
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as MainTab;
        setActiveTab(tab);
      }
    },
    [openNotesDrawer, selectedLessonId, setActiveTab, setSearchOpen, setSettingsOpen, toggleJsTsComparison]
  );

  useMenuAction('pymastery', handleAction, windowId);
  useContextAction('pymastery', handleAction);

  const isLight = deviceResolvedScheme === 'light';

  return (
    <div
      onClick={() => hideTermPopover(false)}
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark',
        fontSize === 'sm' && 'text-sm',
        fontSize === 'base' && 'text-base',
        fontSize === 'lg' && 'text-lg'
      )}
    >
      <Header />

      {/* Main Content Area: Header and MobileBottomNav stay pinned, only main content area scrolls */}
      <main className="flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {activeTab === 'learn' && <WpApp />}

        {activeTab === 'curriculum' && (
          <div className="flex h-full w-full flex-row overflow-hidden">
            <Sidebar />
            <LessonView />
          </div>
        )}

        {activeTab === 'playground' && (
          <div className="h-full overflow-y-auto">
            <PythonPlaygroundIDE />
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="h-full overflow-y-auto">
            <PracticeHub />
          </div>
        )}
        {activeTab === 'samples' && (
          <div className="h-full overflow-y-auto">
            <ProjectSamplesHub />
          </div>
        )}
        {activeTab === 'flashcards' && (
          <div className="h-full overflow-y-auto">
            <FlashcardDeck />
          </div>
        )}
        {activeTab === 'exams' && (
          <div className="h-full overflow-y-auto">
            <ExamCenter />
          </div>
        )}
        {activeTab === 'glossary' && (
          <div className="h-full overflow-y-auto">
            <GlossaryExplorer />
          </div>
        )}
        {activeTab === 'reference' && (
          <div className="h-full overflow-y-auto">
            <ReferenceHub />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <MobileBottomNav />

      {/* Global Interactive Overlays */}
      <TermPopover />
      <NotesDrawer />
      <GlobalSearchModal />
      <SettingsModal />
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setSetupGuideOpen(false)}
        sampleProject={setupGuideProject}
      />
    </div>
  );
};

export default PyMasteryApp;
