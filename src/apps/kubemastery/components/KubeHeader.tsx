import React from 'react';
import {
  BookMarked,
  BookOpen,
  Code2,
  GraduationCap,
  Server,
  ShieldAlert,
  Workflow,
} from 'lucide-react';
import { KubeMasteryLogo } from '@/components/common/AppLogos';
import { ScaleAppHeader } from '@/components/scale-workbench/ScaleAppHeader';
import { useKubeNav } from '@/features/devops-course/store';
import { useKubeStore } from '../store/useKubeStore';

export const KubeHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab } = useKubeStore();
  const kubeView = useKubeNav((s) => s.view);
  const goKube = useKubeNav((s) => s.go);

  const isLearnWorkbench = activeTab === 'learn' && kubeView.name === 'workbench';
  const isPracticeView = activeTab === 'learn' && kubeView.name !== 'workbench';

  return (
    <ScaleAppHeader
      appId="kubemastery"
      brandTitle="Kube Mastery"
      logo={<KubeMasteryLogo size={28} className="h-full w-full" />}
      onBrandClick={() => {
        setActiveTab('learn');
        goKube({ name: 'workbench' });
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
            goKube({ name: 'workbench' });
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
            if (kubeView.name === 'workbench') {
              goKube({ name: 'exercises' });
            }
          },
        },
        {
          id: 'cluster-sim',
          labelVi: 'Cluster Sim',
          labelEn: 'Cluster Sim',
          icon: <Server className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'cluster-sim',
          onClick: () => setActiveTab('cluster-sim'),
        },
        {
          id: 'glossary',
          labelVi: 'Tra cứu',
          labelEn: 'Cheatsheets',
          icon: <BookMarked className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'glossary',
          onClick: () => setActiveTab('glossary'),
        },
      ]}
      moreItems={[
        {
          id: 'flow-studio',
          labelVi: 'Flow Studio (Luồng Kiến trúc)',
          labelEn: 'Flow Studio (Architecture Flows)',
          icon: <Workflow className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'flow-studio',
          onClick: () => setActiveTab('flow-studio'),
        },
        {
          id: 'incidents',
          labelVi: 'Xử lý Sự cố Production (8 Ca)',
          labelEn: 'Production Incidents (8 Cases)',
          icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'incidents',
          onClick: () => setActiveTab('incidents'),
        },
        {
          id: 'curriculum',
          labelVi: 'Giáo trình Tra cứu 4 Giai đoạn',
          labelEn: '4-Stage Reference Archive',
          icon: <BookOpen className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'curriculum',
          onClick: () => setActiveTab('curriculum'),
        },
        {
          id: 'practice',
          labelVi: 'Phòng Lab YAML Chuyên đề',
          labelEn: 'YAML Sandbox Labs',
          icon: <Code2 className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'practice',
          onClick: () => setActiveTab('practice'),
        },
        {
          id: 'exams',
          labelVi: 'Trung tâm Thi sát hạch',
          labelEn: 'Certification Exams',
          icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" />,
          active: activeTab === 'exams',
          onClick: () => setActiveTab('exams'),
        },
      ]}
    />
  );
};
