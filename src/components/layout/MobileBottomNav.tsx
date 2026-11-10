import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  FolderGit2,
  Layers,
  GraduationCap,
  BookMarked,
  Compass,
  Terminal,
  MoreHorizontal,
} from 'lucide-react';
import { MainTab, useNavigationStore } from '@/stores/useNavigationStore';
import { cn } from '@/utils/cn';

const MOBILE_NAV_ITEMS: {
  id: MainTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  { id: 'learn', label: 'Học', shortLabel: 'Học', icon: <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { id: 'playground', label: 'Sân chơi', shortLabel: 'Sân chơi', icon: <Terminal className="h-4 w-4 shrink-0" aria-hidden="true" /> },
  { id: 'glossary', label: 'Từ điển', shortLabel: 'Từ điển', icon: <BookMarked className="h-4 w-4 shrink-0" aria-hidden="true" /> },
];

/** Tài liệu tra cứu bổ sung — gom vào mục "Thêm" cho gọn */
const MORE_ITEMS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
  { id: 'curriculum', label: 'Giáo trình cũ (7 giai đoạn)', icon: <BookOpen className="h-4 w-4" aria-hidden="true" /> },
  { id: 'practice', label: 'Bài thực hành cũ', icon: <Code2 className="h-4 w-4" aria-hidden="true" /> },
  { id: 'samples', label: 'Dự án mẫu', icon: <FolderGit2 className="h-4 w-4" aria-hidden="true" /> },
  { id: 'flashcards', label: 'Flashcards cũ', icon: <Layers className="h-4 w-4" aria-hidden="true" /> },
  { id: 'exams', label: 'Thi sát hạch', icon: <GraduationCap className="h-4 w-4" aria-hidden="true" /> },
  { id: 'reference', label: 'Chuyên đề PDF', icon: <Compass className="h-4 w-4" aria-hidden="true" /> },
];

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useNavigationStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((i) => i.id === activeTab);

  return (
    <nav
      aria-label="Điều hướng di động và máy tính bảng"
      className="shrink-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid grid-cols-4 gap-0.5 px-1 py-1 max-w-3xl">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={cn(
                'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 cursor-pointer',
                active
                  ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/35 font-extrabold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent font-medium'
              )}
            >
              {item.icon}
              <span className="text-[9px] sm:text-[10px] leading-tight tracking-tight whitespace-nowrap truncate max-w-full sm:hidden">
                {item.shortLabel}
              </span>
              <span className="hidden sm:inline text-[10px] leading-tight tracking-tight whitespace-nowrap truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          title="Tài liệu tra cứu khác"
          className={cn(
            'flex min-h-[46px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 transition-all active:scale-95 cursor-pointer',
            moreActive || moreOpen ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/35 font-extrabold' : 'text-slate-400 hover:text-slate-200 border border-transparent font-medium'
          )}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-[9px] sm:text-[10px] leading-tight">Thêm</span>
        </button>
      </div>
      {moreOpen && (
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-1 border-t border-slate-800/90 px-2 py-2">
          {MORE_ITEMS.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                setActiveTab(i.id);
                setMoreOpen(false);
              }}
              className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs', activeTab === i.id ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-800/70')}
            >
              {i.icon}
              {i.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
