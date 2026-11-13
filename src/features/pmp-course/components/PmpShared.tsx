import React from 'react';
import type { ProvenanceKind } from '../types';
import { cn } from '@/utils/cn';

export const PROVENANCE_STYLE: Record<ProvenanceKind, { cls: string }> = {
  pmbok8: {
    cls: 'border-amber-500/45 bg-amber-500/15 text-amber-300',
  },
  eco2026: {
    cls: 'border-violet-500/45 bg-violet-500/15 text-violet-300',
  },
  'pma-bridge': {
    cls: 'border-sky-500/45 bg-sky-500/15 text-sky-300',
  },
};

export const ProvenancePill: React.FC<{
  kind: ProvenanceKind;
  label: string;
  detail?: string;
  className?: string;
}> = ({ kind, label, detail, className }) => (
  <span
    title={detail}
    className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold tracking-tight',
      PROVENANCE_STYLE[kind]?.cls ?? PROVENANCE_STYLE.pmbok8.cls,
      className
    )}
  >
    {label}
  </span>
);

export const PmpTrademarkFooter: React.FC<{ className?: string }> = ({ className }) => (
  <footer
    className={cn(
      'mt-8 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-[11px] leading-relaxed text-slate-400',
      className
    )}
  >
    <p>
      <b>Tuyên bố độc lập &amp; Nhãn hiệu:</b> PMP®, PMBOK®, và PMI® là các nhãn hiệu đã đăng ký của{' '}
      <i>Project Management Institute, Inc.</i> <b>Learning Gate — PMP Mastery</b> là công cụ tổng hợp tư duy độc lập,
      diễn đạt mới hoàn toàn bằng tiếng Việt, không liên kết, không được tài trợ hay chứng thực bởi PMI hoặc PMA. Dẫn chứng
      chi tiết và kho luyện tập tình huống được mở trực tiếp trên ứng dụng đồng hành{' '}
      <a
        href="https://pmp-mindmap.vercel.app/?lang=vi"
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-400 underline underline-offset-2 hover:text-amber-300"
      >
        PMP Mindmap
      </a>
      .
    </p>
  </footer>
);
