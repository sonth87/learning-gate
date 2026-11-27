import React from 'react';
import { Hourglass } from 'lucide-react';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { SD_TABS, type SdMainTab } from '../sd.types';

/** Placeholder ngắn cho tab chưa làm. Mỗi tab thật thay thế component này ở mốc ghi trên thẻ. */
export const SdPlaceholder: React.FC<{ tab: SdMainTab }> = ({ tab }) => {
  const lang = useWorkbenchStore((s) => s.language);
  const meta = SD_TABS[tab];
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="dts-card-tactile max-w-md rounded-2xl bg-[var(--dts-panel-elevated)] p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]">
          <Hourglass className="h-5 w-5" />
        </div>
        <h2 className="font-mono text-lg font-extrabold text-[var(--dts-ink)]">
          {lang === 'en' ? meta.labelEn : meta.labelVi}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--dts-ink-soft)]">
          {lang === 'en' ? meta.descEn : meta.descVi}
        </p>
        <p className="mt-3 font-mono text-xs font-bold text-[var(--dts-ink-muted)]">
          {lang === 'en' ? `Not built yet. Planned: ${meta.milestone}` : `Chưa làm. Dự kiến: ${meta.milestone}`}
        </p>
      </div>
    </div>
  );
};
