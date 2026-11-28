import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LabConfirmDialogProps {
  open: boolean;
  tone?: 'default' | 'amber';
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Hộp thoại xác nhận nhỏ theo phong cách DTS (không dùng window.confirm). */
export const LabConfirmDialog: React.FC<LabConfirmDialogProps> = ({
  open,
  tone = 'default',
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl border-2 border-[var(--dts-border)] bg-[var(--dts-panel-elevated)] p-4 text-[var(--dts-ink)] shadow-[3px_4px_0_var(--dts-shadow-color)]"
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--dts-border)]',
              tone === 'amber'
                ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                : 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm font-extrabold">{title}</div>
            <div className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-[var(--dts-ink-soft)]">
              {body}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="dts-btn-tactile rounded-xl bg-[var(--dts-panel)] px-3 py-1 text-xs font-extrabold text-[var(--dts-ink)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'dts-btn-tactile rounded-xl px-3 py-1 text-xs font-extrabold',
              tone === 'amber'
                ? 'bg-[var(--dts-amber-bg)] text-[var(--dts-amber-ink)]'
                : 'bg-[var(--dts-blue-bg)] text-[var(--dts-blue-ink)]'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
