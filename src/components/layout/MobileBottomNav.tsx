import React, { useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Compass,
  FolderGit2,
  GraduationCap,
  MoreHorizontal,
  Terminal,
} from 'lucide-react';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { useWpNav } from '@/features/workpath/store';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { WORKBENCH_I18N } from '@/components/scale-workbench/i18n';
import { cn } from '@/utils/cn';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigationStore();
  const wpView = useWpNav((s) => s.view);
  const goWp = useWpNav((s) => s.go);
  const lang = useWorkbenchStore((s) => s.language);
  const t = WORKBENCH_I18N[lang];
  const [moreOpen, setMoreOpen] = useState(false);

  const isLearn = activeTab === 'learn' && wpView.name === 'workbench';
  const isPractice = activeTab === 'learn' && wpView.name !== 'workbench';

  const moreItems: { id: MainTab; labelVi: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'samples', labelVi: '16 Dự án Mẫu', labelEn: 'Sample Projects', icon: <FolderGit2 className="h-4 w-4" /> },
    { id: 'exams', labelVi: 'Thi sát hạch', labelEn: 'Exams', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'reference', labelVi: 'Chuyên đề PDF', labelEn: 'Deep Dives', icon: <Compass className="h-4 w-4" /> },
    { id: 'curriculum', labelVi: 'Giáo trình 7 giai đoạn', labelEn: '7-Stage Archive', icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="shrink-0 z-40 border-t-[1.5px] border-[var(--dts-border)] bg-[var(--dts-panel)] pb-[env(safe-area-inset-bottom)] text-[var(--dts-ink)] lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-1.5 py-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('learn');
            goWp({ name: 'workbench' });
          }}
          className={cn(
            'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] font-bold transition-all',
            isLearn
              ? 'border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
              : 'text-[var(--dts-ink-soft)]'
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="truncate">{lang === 'en' ? 'Learn' : 'Mô hình'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('learn');
            goWp({ name: 'exercises' });
          }}
          className={cn(
            'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] font-bold transition-all',
            isPractice
              ? 'border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
              : 'text-[var(--dts-ink-soft)]'
          )}
        >
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span className="truncate">{lang === 'en' ? 'Practice' : 'Bài tập'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playground')}
          className={cn(
            'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] font-bold transition-all',
            activeTab === 'playground'
              ? 'border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
              : 'text-[var(--dts-ink-soft)]'
          )}
        >
          <Terminal className="h-4 w-4 shrink-0" />
          <span className="truncate">IDE</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('glossary')}
          className={cn(
            'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] font-bold transition-all',
            activeTab === 'glossary'
              ? 'border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-green-bg)] text-[var(--dts-green-ink)]'
              : 'text-[var(--dts-ink-soft)]'
          )}
        >
          <BookMarked className="h-4 w-4 shrink-0" />
          <span className="truncate">{lang === 'en' ? 'Docs' : 'Từ điển'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={cn(
            'flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-mono text-[10px] font-bold transition-all',
            moreOpen
              ? 'border-[1.5px] border-[var(--dts-border)] bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
              : 'text-[var(--dts-ink-soft)]'
          )}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" />
          <span className="truncate">{t.tabs.more}</span>
        </button>
      </div>

      {moreOpen && (
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-1.5 border-t border-[var(--dts-border-soft)] px-2.5 py-2">
          {moreItems.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                setActiveTab(it.id);
                setMoreOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-[var(--dts-border-soft)] bg-[var(--dts-panel-elevated)] px-3 py-2 text-left font-mono text-xs font-bold text-[var(--dts-ink)]"
            >
              {it.icon}
              <span>{lang === 'en' ? it.labelEn : it.labelVi}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
