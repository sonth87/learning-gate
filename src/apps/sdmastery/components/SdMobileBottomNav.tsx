import React, { useState } from 'react';
import { BookMarked, BookOpen, Briefcase, FlaskConical, MoreHorizontal, ScrollText, ShieldAlert } from 'lucide-react';
import { useSdNav } from '@/features/sysdesign-course/store';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { cn } from '@/utils/cn';
import { SD_TABS, type SdMainTab } from '../sd.types';
import { useSdStore } from '../store/useSdStore';

const ICONS: Record<SdMainTab, React.ComponentType<{ className?: string }>> = {
  learn: BookOpen,
  lab: FlaskConical,
  warroom: ShieldAlert,
  cases: Briefcase,
  atlas: BookMarked,
  interview: ScrollText,
};

const PRIMARY: SdMainTab[] = ['learn', 'lab', 'warroom', 'cases'];
const MORE: SdMainTab[] = ['atlas', 'interview'];

/** Thanh điều hướng dưới: chỉ hiện khi cửa sổ app hẹp (< 680px, cùng ngưỡng với header). */
export const SdMobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useSdStore();
  const goSd = useSdNav((s) => s.go);
  const lang = useWorkbenchStore((s) => s.language);
  const [moreOpen, setMoreOpen] = useState(false);

  const open = (id: SdMainTab) => {
    setActiveTab(id);
    setMoreOpen(false);
    if (id === 'learn') goSd({ name: 'workbench' });
  };
  const label = (id: SdMainTab) => (lang === 'en' ? SD_TABS[id].labelEn : SD_TABS[id].labelVi);
  const moreActive = MORE.includes(activeTab);

  const btn = (active: boolean) =>
    cn(
      'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] transition-all cursor-pointer',
      active
        ? 'dts-card-tactile bg-[var(--dts-green-bg)] font-extrabold text-[var(--dts-green-ink)]'
        : 'text-[var(--dts-ink-soft)] hover:text-[var(--dts-ink)] font-semibold'
    );

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg-mobile-bottom-nav relative z-40 shrink-0 border-t-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel)] pb-[env(safe-area-inset-bottom)] @[680px]/app:hidden"
    >
      {moreOpen && (
        <div
          role="menu"
          className="dts-card-tactile absolute bottom-full right-2 mb-2 w-52 rounded-2xl bg-[var(--dts-panel)] p-1.5"
        >
          {MORE.map((id) => {
            const Icon = ICONS[id];
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => open(id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left font-mono text-xs font-semibold',
                  activeTab === id
                    ? 'bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
                    : 'text-[var(--dts-ink)] hover:bg-[var(--dts-panel-muted)]'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label(id)}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-1.5 py-1">
        {PRIMARY.map((id) => {
          const Icon = ICONS[id];
          return (
            <button key={id} type="button" onClick={() => open(id)} className={btn(activeTab === id)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full truncate">{label(id)}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((o) => !o)}
          className={btn(moreActive || moreOpen)}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" />
          <span className="max-w-full truncate">{lang === 'en' ? 'More' : 'Thêm'}</span>
        </button>
      </div>
    </nav>
  );
};
