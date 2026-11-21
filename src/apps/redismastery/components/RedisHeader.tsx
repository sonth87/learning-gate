import React from 'react';
import {
  BookMarked,
  BookOpen,
  Cpu,
  GraduationCap,
  ShieldAlert,
  Workflow,
} from 'lucide-react';
import { RedisMasteryLogo } from '@/components/common/AppLogos';
import { ScaleAppHeader } from '@/components/scale-workbench/ScaleAppHeader';
import { useRedisNav } from '@/features/devops-course/store';
import { useRedisStore } from '../store/useRedisStore';

export const RedisHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab } = useRedisStore();
  const redisView = useRedisNav((s) => s.view);
  const goRedis = useRedisNav((s) => s.go);

  const isLearnWorkbench = activeTab === 'learn' && redisView.name === 'workbench';
  const isPracticeView = activeTab === 'learn' && redisView.name !== 'workbench';

  return (
    <ScaleAppHeader
      appId="redismastery"
      brandTitle="Redis Mastery"
      logo={<RedisMasteryLogo size={28} className="h-full w-full" />}
      onBrandClick={() => {
        setActiveTab('learn');
        goRedis({ name: 'workbench' });
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
            goRedis({ name: 'workbench' });
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
            if (redisView.name === 'workbench') {
              goRedis({ name: 'exercises' });
            }
          },
        },
        {
          id: 'simulator',
          labelVi: 'RAM Sim',
          labelEn: 'RAM Sim',
          icon: <Cpu className="h-3.5 w-3.5 shrink-0" />,
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
          id: 'flow-studio',
          labelVi: 'Flow Studio (6 Luồng Kiến trúc)',
          labelEn: 'Flow Studio (6 Architecture Flows)',
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
      ]}
    />
  );
};
