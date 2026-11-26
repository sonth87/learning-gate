import React from 'react';
import { BookMarked, BookOpen, Briefcase, FlaskConical, Library, ScrollText, ShieldAlert } from 'lucide-react';
import { SdMasteryLogo } from '@/components/common/AppLogos';
import { ScaleAppHeader } from '@/components/scale-workbench/ScaleAppHeader';
import { useSdNav } from '@/features/sysdesign-course/store';
import { SD_TABS, type SdMainTab } from '../sd.types';
import { useSdStore } from '../store/useSdStore';

const ICON = 'h-3.5 w-3.5 shrink-0';

export const SdHeader: React.FC<{ windowId?: string }> = ({ windowId }) => {
  const { activeTab, setActiveTab } = useSdStore();
  const goSd = useSdNav((s) => s.go);

  const item = (id: SdMainTab, icon: React.ReactNode, extra?: () => void) => ({
    id,
    labelVi: SD_TABS[id].labelVi,
    labelEn: SD_TABS[id].labelEn,
    icon,
    active: activeTab === id,
    onClick: () => {
      setActiveTab(id);
      extra?.();
    },
  });

  return (
    <ScaleAppHeader
      appId="sdmastery"
      brandTitle="System Design Mastery"
      logo={<SdMasteryLogo size={28} className="h-full w-full" />}
      onBrandClick={() => {
        setActiveTab('learn');
        goSd({ name: 'workbench' });
      }}
      windowId={windowId}
      primaryTabs={[
        item('learn', <BookOpen className={ICON} />, () => goSd({ name: 'workbench' })),
        item('lab', <FlaskConical className={ICON} />),
        item('warroom', <ShieldAlert className={ICON} />),
        item('cases', <Briefcase className={ICON} />),
      ]}
      moreItems={[
        item('atlas', <BookMarked className={ICON} />),
        item('interview', <ScrollText className={ICON} />),
        item('credits', <Library className={ICON} />),
      ]}
    />
  );
};
