import React, { useCallback, useEffect } from 'react';
import { useContextAction, useMenuAction, useStore } from '@sonth87/device-layout';
import { SettingsModal } from '@/components/layout/SettingsModal';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { PmpLearnShell } from '@/features/pmp-course/PmpLearnShell';
import { MindmapQuickPreviewModal } from '@/features/pmp-course/links';
import { usePmpAppStore, usePmpProgress } from '@/features/pmp-course/store';
import type { PmpTab } from '@/features/pmp-course/types';
import { PmpCanvasView } from '@/features/pmp-course/views/PmpCanvasView';
import { PmpDecisionTreeView } from '@/features/pmp-course/views/PmpDecisionTreeView';
import { PmpLookupView } from '@/features/pmp-course/views/PmpLookupView';
import { PmpHeader } from './components/PmpHeader';
import { PmpMobileBottomNav } from './components/PmpMobileBottomNav';
import { cn } from '@/utils/cn';

export interface PmpMasteryAppProps {
  appId?: string;
  windowId?: string;
}

export const PmpMasteryApp: React.FC<PmpMasteryAppProps> = ({ windowId }) => {
  const { activeTab, setActiveTab, setSearchOpen, previewLink, closeQuickPreview } = usePmpAppStore();
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const hydratePmp = usePmpProgress((s) => s.hydrate);
  const markVisited = usePmpProgress((s) => s.markEvidenceVisited);
  const deviceResolvedScheme = useStore((s) => s.resolvedColorScheme);
  const isLight = deviceResolvedScheme === 'light';

  useEffect(() => {
    hydratePmp();
  }, [hydratePmp]);

  const handleAction = useCallback(
    (action: string) => {
      if (action === 'quickSearch') {
        setSearchOpen(true);
      } else if (action === 'openSettings') {
        setSettingsOpen(true);
      } else if (action === 'openMindmapExternal') {
        window.open('https://pmp-mindmap.vercel.app/?lang=vi', '_blank', 'noopener,noreferrer');
      } else if (action.startsWith('tab:')) {
        const tab = action.replace('tab:', '') as PmpTab;
        setActiveTab(tab);
      }
    },
    [setActiveTab, setSearchOpen, setSettingsOpen]
  );

  useMenuAction('pmpmastery', handleAction, windowId);
  useContextAction('pmpmastery', handleAction);

  return (
    <div
      className={cn(
        'pylearn-root @container/app relative w-full h-full min-h-0 min-w-0 bg-slate-950 text-slate-100 flex flex-col overflow-hidden transition-colors duration-200 select-text',
        isLight ? 'pylearn-light' : 'pylearn-dark'
      )}
    >
      <PmpHeader />

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
      <SettingsModal />
    </div>
  );
};

export default PmpMasteryApp;
