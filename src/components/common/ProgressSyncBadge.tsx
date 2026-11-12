import React from 'react';
import { AlertTriangle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import type { StorageSyncMeta } from '@/db/durableProgressStorage';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { cn } from '@/utils/cn';

function formatTime(ts: number | null): string | null {
  if (!ts || ts <= 0) return null;
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return null;
  }
}

export const ProgressSyncBadge: React.FC<{ meta: StorageSyncMeta; className?: string }> = ({
  meta,
  className,
}) => {
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);
  const timeStr = formatTime(meta.lastSavedAt);

  const isSaving = meta.status === 'saving';
  const isBoth = meta.status === 'synced' && meta.localOk && meta.idbOk;
  const isLocalOnly = meta.status === 'local-only' || (meta.localOk && !meta.idbOk);
  const isError = meta.status === 'error' && !meta.localOk && !meta.idbOk;

  const tooltip = [
    isBoth
      ? 'Tiến độ học tập đã được lưu kép an toàn vào cả LocalStorage và IndexedDB.'
      : isLocalOnly
        ? 'Tiến độ đã được lưu đồng bộ vào LocalStorage (IndexedDB đang khởi tạo hoặc bị chặn ở chế độ ẩn danh).'
        : isSaving
          ? 'Đang ghi tiến độ vào LocalStorage & IndexedDB...'
          : 'Không ghi được bộ nhớ trình duyệt — hãy bấm để xuất file JSON sao lưu.',
    meta.persistedGranted ? 'Đã bật chống dọn dẹp bộ nhớ tự động của trình duyệt.' : null,
    timeStr ? `Lần lưu gần nhất: ${timeStr}.` : null,
    'Lưu ý: Dữ liệu trình duyệt gắn theo từng cổng (ví dụ localhost:5173) và hồ sơ trình duyệt. Bấm vào đây để mở Cài đặt & Sao lưu JSON.',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={() => setSettingsOpen(true)}
      title={tooltip}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
        isError
          ? 'border-rose-500/45 bg-rose-500/12 text-rose-300 hover:bg-rose-500/20'
          : isSaving
            ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
            : isBoth
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/15'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15',
        className
      )}
    >
      {isSaving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : isError ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <Database className="hidden md:inline h-3 w-3 shrink-0 opacity-80" aria-hidden="true" />
      <span className="hidden lg:inline">
        {isSaving
          ? 'Đang lưu...'
          : isError
            ? 'Lỗi lưu bộ nhớ'
            : isBoth
              ? 'Đã lưu (Local + IndexedDB)'
              : 'Đã lưu (Local)'}
      </span>
      <span className="lg:hidden">
        {isSaving ? 'Lưu...' : isError ? 'Lỗi lưu' : 'Đã lưu'}
      </span>
      {timeStr && !isSaving && (
        <span className="hidden xl:inline font-mono text-[10px] opacity-80">· {timeStr}</span>
      )}
    </button>
  );
};
