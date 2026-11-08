import React from 'react';
import { LEVEL_MAP } from '@/constants/levels';
import { SkillLevel } from '@/types/curriculum.types';
import { GlossaryCategory } from '@/types/glossary.types';
import { cn } from '@/utils/cn';

export const LevelBadge: React.FC<{
  level: SkillLevel;
  showVi?: boolean;
  size?: 'xs' | 'sm';
}> = ({ level, showVi = false, size = 'xs' }) => {
  const meta = LEVEL_MAP[level];
  if (!meta) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold tracking-wide uppercase whitespace-nowrap shrink-0',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        meta.bgClass,
        meta.textClass,
        meta.borderClass
      )}
    >
      <span>{meta.label}</span>
      {showVi && <span className="opacity-80 font-normal normal-case">• {meta.viLabel}</span>}
    </span>
  );
};

const CATEGORY_META: Record<
  GlossaryCategory,
  { label: string; classes: string }
> = {
  keyword: {
    label: 'Từ khóa (Keyword)',
    classes: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  },
  declaration: {
    label: 'Khai báo & Cú pháp',
    classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
  builtin_func: {
    label: 'Hàm Tích hợp (Built-in)',
    classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  method: {
    label: 'Phương thức (Method)',
    classes: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  },
  builtin_type: {
    label: 'Kiểu Dữ liệu (Type)',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  dunder: {
    label: 'Dunder / Magic Method',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  concept: {
    label: 'Khái niệm & Cơ chế',
    classes: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  ecosystem: {
    label: 'Công cụ & Hệ sinh thái',
    classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  stdlib: {
    label: 'Thư viện Chuẩn (Standard Library)',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};

export const CategoryBadge: React.FC<{ category: GlossaryCategory }> = ({
  category,
}) => {
  const info = CATEGORY_META[category];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0',
        info.classes
      )}
    >
      {info.label}
    </span>
  );
};
