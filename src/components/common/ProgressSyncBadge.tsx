import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Loader2,
} from 'lucide-react';
import type { StorageSyncMeta } from '@/db/durableProgressStorage';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useCloudSyncStore } from '@/stores/useCloudSyncStore';
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
  const cloudConfigured = useCloudSyncStore((s) => s.configured);
  const cloudUser = useCloudSyncStore((s) => s.user);
  const cloudStatus = useCloudSyncStore((s) => s.syncStatus);
  const lastCloudSyncAt = useCloudSyncStore((s) => s.lastCloudSyncAt);
  const cloudError = useCloudSyncStore((s) => s.lastError);

  const timeStr = formatTime(meta.lastSavedAt);
  const cloudTimeStr = formatTime(lastCloudSyncAt);

  const isLocalSaving = meta.status === 'saving';
  const isBoth = meta.status === 'synced' && meta.localOk && meta.idbOk;
  const isLocalOnly = meta.status === 'local-only' || (meta.localOk && !meta.idbOk);
  const isLocalError = meta.status === 'error' && !meta.localOk && !meta.idbOk;

  const isCloudSignedIn = Boolean(cloudUser);
  const isCloudSyncing = isCloudSignedIn && cloudStatus === 'syncing';
  const isCloudError = isCloudSignedIn && cloudStatus === 'error';
  const isCloudSynced = isCloudSignedIn && cloudStatus === 'synced';

  const isBusy = isLocalSaving || isCloudSyncing;
  const isError = isLocalError || isCloudError;

  const tooltip = [
    isBoth
      ? 'Tiến độ học tập đã được lưu kép an toàn vào cả LocalStorage và IndexedDB.'
      : isLocalOnly
        ? 'Tiến độ đã được lưu đồng bộ vào LocalStorage (IndexedDB đang khởi tạo hoặc bị chặn ở chế độ ẩn danh).'
        : isLocalSaving
          ? 'Đang ghi tiến độ vào LocalStorage & IndexedDB...'
          : 'Không ghi được bộ nhớ trình duyệt — hãy bấm để xuất file JSON sao lưu.',
    isCloudSignedIn
      ? isCloudSyncing
        ? `Đang đồng bộ lên Google Cloud (${cloudUser?.email || cloudUser?.displayName || 'Google'})...`
        : isCloudError
          ? `Lỗi đồng bộ Google Cloud: ${cloudError || 'Không xác định'}`
          : `Đã đồng bộ toàn bộ Learning Gate với tài khoản ${cloudUser?.email || 'Google'}${cloudTimeStr ? ` lúc ${cloudTimeStr}` : ''}.`
      : cloudConfigured
        ? 'Chưa đăng nhập Google — bấm để đăng nhập và đồng bộ tiến độ giữa các thiết bị.'
        : null,
    meta.persistedGranted ? 'Đã bật chống dọn dẹp bộ nhớ tự động của trình duyệt.' : null,
    timeStr ? `Lưu local gần nhất: ${timeStr}.` : null,
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
          : isBusy
            ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
            : isCloudSynced || isBoth
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/15'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15',
        className
      )}
    >
      {isBusy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : isError ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : isCloudSignedIn && cloudUser?.photoURL ? (
        <img
          src={cloudUser.photoURL}
          alt={cloudUser.displayName || 'Google'}
          className="h-3.5 w-3.5 rounded-full object-cover shrink-0 ring-1 ring-emerald-400/50"
          referrerPolicy="no-referrer"
        />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}

      {isCloudSignedIn ? (
        <Cloud className="hidden md:inline h-3 w-3 shrink-0 opacity-85" aria-hidden="true" />
      ) : (
        <Database className="hidden md:inline h-3 w-3 shrink-0 opacity-80" aria-hidden="true" />
      )}

      <span className="hidden lg:inline">
        {isLocalSaving
          ? 'Đang lưu...'
          : isCloudSyncing
            ? 'Đang đồng bộ Cloud...'
            : isLocalError
              ? 'Lỗi lưu bộ nhớ'
              : isCloudError
                ? 'Lỗi đồng bộ Cloud'
                : isCloudSignedIn
                  ? 'Local + Google Cloud'
                  : isBoth
                    ? 'Đã lưu (Local + IDB)'
                    : 'Đã lưu (Local)'}
      </span>
      <span className="lg:hidden">
        {isBusy
          ? 'Đồng bộ...'
          : isError
            ? 'Lỗi'
            : isCloudSignedIn
              ? 'Cloud'
              : 'Đã lưu'}
      </span>
      {(cloudTimeStr || timeStr) && !isBusy && (
        <span className="hidden xl:inline font-mono text-[10px] opacity-80">
          · {isCloudSignedIn && cloudTimeStr ? cloudTimeStr : timeStr}
        </span>
      )}
      {!isCloudSignedIn && cloudConfigured && (
        <CloudOff className="hidden xl:inline h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
};
