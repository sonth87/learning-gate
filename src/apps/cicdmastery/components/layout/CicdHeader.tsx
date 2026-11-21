import React from 'react';
import {
  BookMarked,
  BookOpen,
  Code2,
  Flame,
  FolderGit2,
  GraduationCap,
  Layers,
  StickyNote,
  Workflow,
} from 'lucide-react';
import { CicdMasteryLogo } from '@/components/common/AppLogos';
import { ScaleAppHeader } from '@/components/scale-workbench/ScaleAppHeader';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useCicdNav } from '@/features/devops-course/store';
import { useCicdNavigationStore } from '../../stores/useCicdNavigationStore';

export const CicdHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab, selectedLessonId } = useCicdNavigationStore();
  const { openNotesDrawer } = useNavigationStore();
  const cicdView = useCicdNav((s) => s.view);
  const goCicd = useCicdNav((s) => s.go);

  const isLearnWorkbench = activeTab === 'learn' && cicdView.name === 'workbench';
  const isPracticeView = activeTab === 'learn' && cicdView.name !== 'workbench';

  return (
    <ScaleAppHeader
      appId="cicdmastery"
      brandTitle="CI/CD Mastery"
      logo={<CicdMasteryLogo size={28} className="h-full w-full" />}
      onBrandClick={() => {
        setActiveTab('learn');
        goCicd({ name: 'workbench' });
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
            goCicd({ name: 'workbench' });
          },
        },
        {
          id: 'practice-nav',
          labelVi: 'Thực hành',
          labelEn: 'Practice',
          icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
          active: isPracticeView,
          onClick: () => {
            setActiveTab('learn');
            if (cicdView.name === 'workbench') {
              goCicd({ name: 'exercises' });
            }
          },
        },
        {
          id: 'simulator',
          labelVi: 'Pipeline Sim',
          labelEn: 'Pipeline Sim',
          icon: <Workflow className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'simulator',
          onClick: () => setActiveTab('simulator'),
        },
        {
          id: 'glossary',
          labelVi: 'Tra cứu',
          labelEn: 'Reference',
          icon: <BookMarked className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'glossary',
          onClick: () => setActiveTab('glossary'),
        },
      ]}
      moreItems={[
        {
          id: 'warroom',
          labelVi: 'Xử lý Sự cố Pipeline (B1–B7)',
          labelEn: 'Pipeline Incidents (B1–B7)',
          icon: <Flame className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'warroom',
          onClick: () => setActiveTab('warroom'),
        },
        {
          id: 'blueprints',
          labelVi: '4 Bộ Full Flow Blueprints IDE',
          labelEn: '4 Full-Flow Blueprints IDE',
          icon: <FolderGit2 className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'blueprints',
          onClick: () => setActiveTab('blueprints'),
        },
        {
          id: 'curriculum',
          labelVi: 'Giáo trình gốc (6 Trụ cột PDF)',
          labelEn: '6-Pillar Reference Archive',
          icon: <BookOpen className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'curriculum',
          onClick: () => setActiveTab('curriculum'),
        },
        {
          id: 'practice',
          labelVi: 'Phòng Lab Thực hành YAML',
          labelEn: 'YAML Sandbox Labs',
          icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'practice',
          onClick: () => setActiveTab('practice'),
        },
        {
          id: 'flashcards',
          labelVi: 'Bộ thẻ Flashcards',
          labelEn: 'Flashcards Deck',
          icon: <Layers className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'flashcards',
          onClick: () => setActiveTab('flashcards'),
        },
        {
          id: 'exams',
          labelVi: 'Trung tâm Thi sát hạch',
          labelEn: 'Certification Exams',
          icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'exams',
          onClick: () => setActiveTab('exams'),
        },
        {
          id: 'notes',
          labelVi: 'Sổ tay Ghi chú',
          labelEn: 'Study Notes',
          icon: <StickyNote className="h-3.5 w-3.5 shrink-0" />,
          onClick: () =>
            openNotesDrawer('lesson', selectedLessonId, `CI/CD: ${selectedLessonId}`),
        },
      ]}
    />
  );
};
