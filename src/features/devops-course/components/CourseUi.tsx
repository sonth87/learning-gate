import React from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import type { GradeResult, RunResult } from '@/features/workpath/types';
import { Callout } from '@/features/workpath/components/ui';
import { CourseInline } from './CourseMarkdown';
import type { DevOpsAccent } from '../types';
import { cn } from '@/utils/cn';

export const CourseBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
    accent?: DevOpsAccent;
  }
> = ({ variant = 'ghost', accent = 'sky', className, ...p }) => (
  <button
    type="button"
    {...p}
    className={cn(
      'inline-flex min-h-[44px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 sm:px-3 sm:py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
      variant === 'primary' &&
        (accent === 'cyan'
          ? 'border-cyan-500/60 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-semibold'
          : accent === 'amber'
            ? 'border-amber-500/60 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold'
            : 'border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400 font-semibold'),
      variant === 'ghost' && 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800',
      variant === 'danger' && 'border-rose-500/50 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
      className
    )}
  />
);

export const CourseBar: React.FC<{ value: number; accent?: DevOpsAccent; className?: string }> = ({
  value,
  accent = 'sky',
  className,
}) => {
  const v = Math.max(0, Math.min(1, value));
  const fill =
    v >= 1
      ? 'bg-emerald-500'
      : accent === 'cyan'
        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
        : accent === 'amber'
          ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
          : 'bg-gradient-to-r from-sky-500 to-emerald-500';
  return (
    <div
      className={cn('h-2 w-full rounded-full bg-slate-800 overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={Math.round(v * 100)}
    >
      <div className={cn('h-full rounded-full transition-all duration-300', fill)} style={{ width: `${v * 100}%` }} />
    </div>
  );
};

export const CourseRunOutput: React.FC<{
  result: RunResult;
  accent?: DevOpsAccent;
  onGoto?: (line: number) => void;
}> = ({ result, accent = 'sky', onGoto }) => {
  const err = result.stderr.trim();
  const lineMatch = err.match(/dòng (\d+)|line (\d+)/i);
  const lineNo = lineMatch ? Number(lineMatch[1] ?? lineMatch[2]) : null;

  return (
    <div className="space-y-2">
      {result.stdout && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Kết quả phân tích / Terminal
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[13px] text-slate-100">
            {result.stdout}
          </pre>
        </>
      )}
      {err && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lỗi phân tích</div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 font-mono text-[13px] text-rose-300">
            {err}
          </pre>
          <Callout tone="warn" className="flex flex-wrap items-center gap-2">
            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Kiểm tra thụt lề <b>2 dấu cách</b> (không dùng phím Tab cứng trong YAML), dấu <code>:</code> phải có khoảng trắng theo sau (<code>key: value</code>).
            </span>
            {lineNo && onGoto && (
              <CourseBtn accent={accent} onClick={() => onGoto(lineNo)} className="ml-auto min-h-[44px] sm:min-h-0 !px-2.5 sm:!py-1 text-xs">
                Đi tới dòng {lineNo}
              </CourseBtn>
            )}
          </Callout>
        </>
      )}
      <div className="text-xs text-slate-500">
        {result.exitCode === 0 ? '✔ hợp lệ' : `✘ mã thoát ${result.exitCode}`} · {result.ms} ms
      </div>
    </div>
  );
};

export const CourseGradeOutput: React.FC<{
  result: GradeResult;
  accent?: DevOpsAccent;
  onGoto?: (line: number) => void;
}> = ({ result, accent = 'sky', onGoto }) => {
  if (result.import_error) {
    const lineMatch = result.import_error.match(/dòng (\d+)|line (\d+)/i);
    const lineNo = lineMatch ? Number(lineMatch[1] ?? lineMatch[2]) : null;
    return (
      <Callout tone="bad">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <b>Cấu hình / lệnh bị lỗi cú pháp nên chưa thể kiểm tra:</b>
          {lineNo && onGoto && (
            <CourseBtn accent={accent} onClick={() => onGoto(lineNo)} className="min-h-[44px] sm:min-h-0 !px-2.5 sm:!py-1 text-xs">
              Đi tới dòng {lineNo}
            </CourseBtn>
          )}
        </div>
        <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[13px]">{result.import_error}</pre>
      </Callout>
    );
  }

  return (
    <div className="space-y-1.5">
      {result.tests.map((t) =>
        t.status === 'pass' ? (
          <div
            key={t.name}
            className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">
              <CourseInline text={t.doc || t.name} accent={accent} />
            </span>
          </div>
        ) : (
          <div key={t.name} className={cn('rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm')}>
            <div className="flex flex-wrap items-start justify-between gap-2 font-medium text-rose-300">
              <div className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <CourseInline text={t.doc || t.name} accent={accent} />
                </span>
              </div>
              {t.line && onGoto && (
                <CourseBtn accent={accent} onClick={() => onGoto(t.line!)} className="min-h-[44px] sm:min-h-0 !px-2.5 sm:!py-0.5 text-xs">
                  Đi tới dòng {t.line}
                </CourseBtn>
              )}
            </div>
            {t.got !== undefined && (
              <div className="mt-1.5 grid gap-1 text-[13px] sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nhận được</div>
                  <code className="block overflow-auto rounded bg-rose-950/60 px-2 py-1 font-mono text-rose-300">
                    {t.got}
                  </code>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mong đợi</div>
                  <code className="block overflow-auto rounded bg-emerald-950/60 px-2 py-1 font-mono text-emerald-300">
                    {t.expected}
                  </code>
                </div>
              </div>
            )}
            {t.message && (
              <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-xs text-amber-300">{t.message}</pre>
            )}
          </div>
        )
      )}
    </div>
  );
};
