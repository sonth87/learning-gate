import React, { useMemo } from 'react';
import type { MenuBarExtraItem, MenuBarExtraStatus } from '@sonth87/device-layout';
import {
  Cloud,
  LogIn,
  LogOut,
  RefreshCw,
  Settings,
  User,
  UserCheck,
} from 'lucide-react';
import { useCloudSyncStore } from '@/stores/useCloudSyncStore';
import { useNavigationStore } from '@/stores/useNavigationStore';

function formatSyncTime(ts: number | null): string | null {
  if (!ts || ts <= 0) return null;
  try {
    return new Date(ts).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
}

export function useCloudMenuBarExtras(): MenuBarExtraItem[] {
  const configured = useCloudSyncStore((s) => s.configured);
  const authReady = useCloudSyncStore((s) => s.authReady);
  const signingIn = useCloudSyncStore((s) => s.signingIn);
  const user = useCloudSyncStore((s) => s.user);
  const syncStatus = useCloudSyncStore((s) => s.syncStatus);
  const lastCloudSyncAt = useCloudSyncStore((s) => s.lastCloudSyncAt);
  const lastError = useCloudSyncStore((s) => s.lastError);
  const signInWithGoogle = useCloudSyncStore((s) => s.signInWithGoogle);
  const signOut = useCloudSyncStore((s) => s.signOut);
  const syncNow = useCloudSyncStore((s) => s.syncNow);
  const setSettingsOpen = useNavigationStore((s) => s.setSettingsOpen);

  return useMemo(() => {
    if (!configured) return [];

    let status: MenuBarExtraStatus | undefined;
    if (user) {
      if (syncStatus === 'syncing') status = 'busy';
      else if (syncStatus === 'error') status = 'error';
      else status = 'ok';
    }

    const timeStr = formatSyncTime(lastCloudSyncAt);

    const icon = user ? (
      user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'Google user'}
          className="h-4 w-4 rounded-full object-cover ring-1 ring-white/40"
          referrerPolicy="no-referrer"
        />
      ) : (
        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
      )
    ) : (
      <User className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
    );

    const content = user ? (
      <div className="w-64 space-y-2.5 text-xs">
        <div className="flex items-center gap-2.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google'}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold shrink-0">
              {(user.displayName || user.email || 'G')[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {user.displayName || 'Tài khoản Google'}
            </p>
            <p className="text-[11px] opacity-70 truncate">{user.email || user.uid}</p>
          </div>
        </div>

        <div className="rounded-lg bg-black/15 dark:bg-white/10 px-2.5 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Cloud className="h-3 w-3 text-sky-400 shrink-0" />
              {syncStatus === 'syncing'
                ? 'Đang đồng bộ Cloud...'
                : syncStatus === 'error'
                  ? 'Lỗi đồng bộ Cloud'
                  : 'Đã đồng bộ Learning Gate'}
            </span>
            {timeStr && (
              <span className="font-mono text-[10px] opacity-75 shrink-0">{timeStr}</span>
            )}
          </div>
          {lastError && (
            <p className="text-[10px] text-rose-400 leading-snug">{lastError}</p>
          )}
        </div>

        <div className="h-px bg-current/10" />

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => void syncNow(false)}
            disabled={syncStatus === 'syncing'}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-sky-400 shrink-0 ${
                syncStatus === 'syncing' ? 'animate-spin' : ''
              }`}
            />
            <span>{syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 opacity-75 shrink-0" />
            <span>Cài đặt &amp; Sao lưu</span>
          </button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span>Đăng xuất Google</span>
          </button>
        </div>
      </div>
    ) : (
      <div className="w-64 space-y-2.5 text-xs">
        <div className="space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Learning Gate Cloud</span>
          </p>
          <p className="text-[11px] opacity-75 leading-relaxed">
            Đăng nhập Google để đồng bộ tiến trình học trên toàn bộ các app (Python, K8s, CI/CD,
            Redis, PMP).
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={!authReady || signingIn}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" />
          <span>{signingIn ? 'Đang mở Google...' : 'Đăng nhập bằng Google'}</span>
        </button>

        {lastError && (
          <p className="text-[10px] text-rose-400 leading-snug">{lastError}</p>
        )}
      </div>
    );

    const item: MenuBarExtraItem = {
      id: 'learning-gate-google-user',
      label: user
        ? `${user.displayName || user.email || 'Google'} — Learning Gate`
        : 'Đăng nhập Google — Learning Gate',
      icon,
      status,
      content,
    };

    return [item];
  }, [
    configured,
    authReady,
    signingIn,
    user,
    syncStatus,
    lastCloudSyncAt,
    lastError,
    signInWithGoogle,
    signOut,
    syncNow,
    setSettingsOpen,
  ]);
}
