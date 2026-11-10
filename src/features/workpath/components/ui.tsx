import React from 'react';
import { cn } from '@/utils/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...p }) => (
  <div className={cn('rounded-xl border border-slate-800 bg-slate-900/70 p-4', className)} {...p} />
);

export const Bar: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-800 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(v * 100)}>
      <div className={cn('h-full rounded-full transition-all duration-300', v >= 1 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-sky-500')} style={{ width: `${v * 100}%` }} />
    </div>
  );
};

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info';
const TONES: Record<Tone, string> = {
  neutral: 'border-slate-700 text-slate-400 bg-slate-900',
  ok: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  warn: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
  bad: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
  info: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
};

export const Pill: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'neutral', children, className }) => (
  <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}>{children}</span>
);

export const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }> = ({
  variant = 'ghost',
  className,
  ...p
}) => (
  <button
    {...p}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
      variant === 'primary' && 'border-emerald-500/60 bg-emerald-500 text-slate-950 hover:bg-emerald-400',
      variant === 'ghost' && 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800',
      variant === 'danger' && 'border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
      className
    )}
  />
);

export const Stars: React.FC<{ n: number; max?: number }> = ({ n, max = 5 }) => (
  <span className="tracking-tight text-amber-400" aria-label={`${n}/${max} sao`}>
    {'★'.repeat(n)}
    <span className="text-slate-700">{'★'.repeat(Math.max(0, max - n))}</span>
  </span>
);

export const PageHeader: React.FC<{ title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }> = ({ title, sub, right }) => (
  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </div>
);

export const Callout: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'warn', children, className }) => (
  <div className={cn('rounded-lg border px-3 py-2 text-sm', TONES[tone], className)}>{children}</div>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Đang tải…' }) => (
  <div className="flex items-center gap-2 p-6 text-sm text-slate-400">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
    {label}
  </div>
);
