import React from 'react';
import {
  BookOpen,
  Compass,
  GitBranch,
  GraduationCap,
  Layers,
  Scale,
} from 'lucide-react';
import { PmpMasteryLogo } from '@/components/common/AppLogos';
import { ScaleAppHeader } from '@/components/scale-workbench/ScaleAppHeader';
import { usePmpAppStore, usePmpNav } from '@/features/pmp-course/store';

export const PmpHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab } = usePmpAppStore();
  const pmpView = usePmpNav((s) => s.view);
  const goPmp = usePmpNav((s) => s.go);

  const isLearnWorkbench = activeTab === 'learn' && pmpView.name === 'workbench';
  const isPracticeView = activeTab === 'learn' && pmpView.name !== 'workbench';

  return (
    <ScaleAppHeader
      appId="pmpmastery"
      brandTitle="PMP Mastery"
      logo={<PmpMasteryLogo size={28} className="h-full w-full" />}
      onBrandClick={() => {
        setActiveTab('learn');
        goPmp({ name: 'workbench' });
      }}
      windowId={windowId}
      primaryTabs={[
        {
          id: 'learn',
          labelVi: 'Bài học',
          labelEn: 'Learn',
          icon: <BookOpen className="h-3.5 w-3.5 shrink-0" />,
          active: isLearnWorkbench,
          onClick: () => {
            setActiveTab('learn');
            goPmp({ name: 'workbench' });
          },
        },
        {
          id: 'practice',
          labelVi: 'Thực hành',
          labelEn: 'Practice',
          icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
          active: isPracticeView,
          onClick: () => {
            setActiveTab('learn');
            if (pmpView.name === 'workbench') {
              goPmp({ name: 'quiz', mode: 'mix' });
            }
          },
        },
        {
          id: 'canvas',
          labelVi: 'Canvas',
          labelEn: 'Canvas',
          icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'canvas',
          onClick: () => setActiveTab('canvas'),
        },
        {
          id: 'decision',
          labelVi: 'Cây quyết định',
          labelEn: 'Decision Tree',
          icon: <GitBranch className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'decision',
          onClick: () => setActiveTab('decision'),
        },
      ]}
      moreItems={[
        {
          id: 'lookup',
          labelVi: 'Đối chiếu nhanh & Kho Deep Link',
          labelEn: 'Comparison Tables & Deep Links',
          icon: <Scale className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'lookup',
          onClick: () => setActiveTab('lookup'),
        },
        {
          id: 'mindmap-ext',
          labelVi: 'Mở PMP Mindmap (Web ngoài)',
          labelEn: 'Open PMP Mindmap Companion',
          icon: <Compass className="h-3.5 w-3.5 shrink-0" />,
          href: 'https://pmp-mindmap.vercel.app/?lang=vi',
        },
      ]}
    />
  );
};
