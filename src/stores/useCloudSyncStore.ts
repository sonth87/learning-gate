import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  getFirebaseAuth,
  getGoogleProvider,
  isFirebaseConfigured,
} from '@/lib/firebaseClient';
import {
  registerCloudProgressHooks,
  type ProgressSlotId,
  type StorageSyncMeta,
} from '@/db/durableProgressStorage';
import {
  ALL_PROGRESS_SLOTS,
  pushClassicUserDataToCloud,
  pushSettingsToCloud,
  pushSlotToCloud,
  setLocalSettingsUpdatedAt,
  syncClassicUserDataWithCloud,
  syncSettingsWithCloud,
  syncSlotWithCloud,
} from '@/db/cloudSyncService';
import { registerUserDataChangeHook, useUserDataStore } from './useUserDataStore';
import { useSettingsStore } from './useSettingsStore';
import { useWpProgress } from '@/features/workpath/store';
import {
  useCicdProgress,
  useKubeProgress,
  useRedisProgress,
} from '@/features/devops-course/store';
import { usePmpProgress } from '@/features/pmp-course/store';
import type { WpState } from '@/features/workpath/types';
import type { UserSettings } from '@/types/user.types';

export interface CloudUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface CloudSyncStoreState {
  configured: boolean;
  authReady: boolean;
  signingIn: boolean;
  user: CloudUserProfile | null;
  syncStatus: CloudSyncStatus;
  lastCloudSyncAt: number | null;
  lastError: string | null;

  initAuthListener: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: (silent?: boolean) => Promise<void>;
}

const SLOT_PUSH_DEBOUNCE_MS = 1500;
const USERDATA_PUSH_DEBOUNCE_MS = 2500;
const SETTINGS_PUSH_DEBOUNCE_MS = 1500;
const VISIBILITY_RESYNC_COOLDOWN_MS = 60_000;

const pendingSlotTimers = new Map<ProgressSlotId, ReturnType<typeof setTimeout>>();
const pendingSlotStates = new Map<ProgressSlotId, WpState>();
let pendingUserDataTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettingsTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteSettings = false;
let authListenerInitialized = false;
let syncInFlight: Promise<void> | null = null;

function toUserProfile(u: User | null): CloudUserProfile | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

function getSlotInMemoryState(slot: ProgressSlotId): WpState {
  switch (slot) {
    case 'wp':
      return useWpProgress.getState().state;
    case 'kube':
      return useKubeProgress.getState().state;
    case 'cicd':
      return useCicdProgress.getState().state;
    case 'redis':
      return useRedisProgress.getState().state;
    case 'pmp':
      return usePmpProgress.getState().state;
  }
}

function applyMergedSlotToStore(slot: ProgressSlotId, nextState: WpState): void {
  const apply = (cur: { hydrated: boolean; syncMeta: StorageSyncMeta }) => ({
    state: nextState,
    hydrated: true,
    syncMeta: {
      ...cur.syncMeta,
      status: 'synced' as const,
      localOk: true,
      idbOk: true,
      lastSavedAt: nextState.updatedAt || Date.now(),
    },
  });

  switch (slot) {
    case 'wp':
      useWpProgress.setState((cur) => apply(cur));
      break;
    case 'kube':
      useKubeProgress.setState((cur) => apply(cur));
      break;
    case 'cicd':
      useCicdProgress.setState((cur) => apply(cur));
      break;
    case 'redis':
      useRedisProgress.setState((cur) => apply(cur));
      break;
    case 'pmp':
      usePmpProgress.setState((cur) => apply(cur));
      break;
  }
}

function isSlotHydrated(slot: ProgressSlotId): boolean {
  switch (slot) {
    case 'wp':
      return useWpProgress.getState().hydrated;
    case 'kube':
      return useKubeProgress.getState().hydrated;
    case 'cicd':
      return useCicdProgress.getState().hydrated;
    case 'redis':
      return useRedisProgress.getState().hydrated;
    case 'pmp':
      return usePmpProgress.getState().hydrated;
  }
}

function pickUserSettings(s: ReturnType<typeof useSettingsStore.getState>): UserSettings {
  return {
    theme: s.theme,
    ideTheme: s.ideTheme,
    organizationMode: s.organizationMode,
    showJsTsComparison: s.showJsTsComparison,
    enableAutoHighlight: s.enableAutoHighlight,
    highlightKeywords: s.highlightKeywords,
    highlightBuiltins: s.highlightBuiltins,
    highlightConcepts: s.highlightConcepts,
    fontSize: s.fontSize,
  };
}

function formatAuthError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Bạn đã đóng cửa sổ đăng nhập Google.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Tên miền hiện tại chưa được thêm vào Authorized Domains trong Firebase Console.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Lỗi kết nối mạng khi liên hệ Google / Firebase.';
  }
  if (code === 'permission-denied') {
    return 'Không có quyền ghi Firestore. Hãy kiểm tra Security Rules.';
  }
  return err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đồng bộ Google.';
}

export const useCloudSyncStore = create<CloudSyncStoreState>((set, get) => {
  const flushPendingPushes = async () => {
    const uid = get().user?.uid;
    if (!uid) return;

    const tasks: Promise<void>[] = [];

    for (const [slot, timer] of pendingSlotTimers.entries()) {
      clearTimeout(timer);
      pendingSlotTimers.delete(slot);
      const state = pendingSlotStates.get(slot);
      pendingSlotStates.delete(slot);
      if (state) {
        tasks.push(pushSlotToCloud(uid, slot, state));
      }
    }

    if (pendingUserDataTimer) {
      clearTimeout(pendingUserDataTimer);
      pendingUserDataTimer = null;
      tasks.push(pushClassicUserDataToCloud(uid));
    }

    if (pendingSettingsTimer) {
      clearTimeout(pendingSettingsTimer);
      pendingSettingsTimer = null;
      tasks.push(pushSettingsToCloud(uid, pickUserSettings(useSettingsStore.getState())));
    }

    if (tasks.length === 0) return;

    set({ syncStatus: 'syncing', lastError: null });
    try {
      await Promise.all(tasks);
      set({ syncStatus: 'synced', lastCloudSyncAt: Date.now(), lastError: null });
    } catch (err) {
      console.warn('[useCloudSyncStore] Flush cloud sync failed:', err);
      set({ syncStatus: 'error', lastError: formatAuthError(err) });
    }
  };

  const scheduleSlotPush = (slot: ProgressSlotId, state: WpState) => {
    const uid = get().user?.uid;
    if (!uid) return;

    pendingSlotStates.set(slot, state);
    const prevTimer = pendingSlotTimers.get(slot);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      pendingSlotTimers.delete(slot);
      const latestState = pendingSlotStates.get(slot);
      pendingSlotStates.delete(slot);
      const currentUid = get().user?.uid;
      if (!currentUid || !latestState) return;

      set({ syncStatus: 'syncing', lastError: null });
      void pushSlotToCloud(currentUid, slot, latestState)
        .then(() => {
          set({ syncStatus: 'synced', lastCloudSyncAt: Date.now(), lastError: null });
        })
        .catch((err) => {
          console.warn(`[useCloudSyncStore] Push slot ${slot} failed:`, err);
          set({ syncStatus: 'error', lastError: formatAuthError(err) });
        });
    }, SLOT_PUSH_DEBOUNCE_MS);

    pendingSlotTimers.set(slot, timer);
  };

  const scheduleUserDataPush = () => {
    const uid = get().user?.uid;
    if (!uid) return;

    if (pendingUserDataTimer) clearTimeout(pendingUserDataTimer);
    pendingUserDataTimer = setTimeout(() => {
      pendingUserDataTimer = null;
      const currentUid = get().user?.uid;
      if (!currentUid) return;

      set({ syncStatus: 'syncing', lastError: null });
      void pushClassicUserDataToCloud(currentUid)
        .then(() => {
          set({ syncStatus: 'synced', lastCloudSyncAt: Date.now(), lastError: null });
        })
        .catch((err) => {
          console.warn('[useCloudSyncStore] Push classic_userdata failed:', err);
          set({ syncStatus: 'error', lastError: formatAuthError(err) });
        });
    }, USERDATA_PUSH_DEBOUNCE_MS);
  };

  const scheduleSettingsPush = () => {
    const uid = get().user?.uid;
    if (!uid || isApplyingRemoteSettings) return;

    setLocalSettingsUpdatedAt(Date.now());
    if (pendingSettingsTimer) clearTimeout(pendingSettingsTimer);
    pendingSettingsTimer = setTimeout(() => {
      pendingSettingsTimer = null;
      const currentUid = get().user?.uid;
      if (!currentUid) return;

      void pushSettingsToCloud(currentUid, pickUserSettings(useSettingsStore.getState())).catch(
        (err) => {
          console.warn('[useCloudSyncStore] Push settings failed:', err);
        }
      );
    }, SETTINGS_PUSH_DEBOUNCE_MS);
  };

  return {
    configured: isFirebaseConfigured(),
    authReady: !isFirebaseConfigured(),
    signingIn: false,
    user: null,
    syncStatus: 'idle',
    lastCloudSyncAt: null,
    lastError: null,

    initAuthListener: () => {
      if (authListenerInitialized) return () => {};
      authListenerInitialized = true;

      registerCloudProgressHooks({
        onSaveSlot: (slot, state) => {
          scheduleSlotPush(slot, state);
        },
        onClearSlot: (slot, freshState) => {
          const uid = get().user?.uid;
          if (!uid) return;
          const prevTimer = pendingSlotTimers.get(slot);
          if (prevTimer) clearTimeout(prevTimer);
          pendingSlotTimers.delete(slot);
          pendingSlotStates.delete(slot);
          void pushSlotToCloud(uid, slot, freshState).catch((err) => {
            console.warn(`[useCloudSyncStore] Clear slot ${slot} on cloud failed:`, err);
          });
        },
      });

      registerUserDataChangeHook(() => {
        scheduleUserDataPush();
      });

      const unsubSettings = useSettingsStore.subscribe(() => {
        scheduleSettingsPush();
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          void flushPendingPushes();
        } else if (document.visibilityState === 'visible') {
          const { user, lastCloudSyncAt } = get();
          if (
            user &&
            (!lastCloudSyncAt || Date.now() - lastCloudSyncAt > VISIBILITY_RESYNC_COOLDOWN_MS)
          ) {
            void get().syncNow(true);
          }
        }
      };

      const handlePageHide = () => {
        void flushPendingPushes();
      };

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('pagehide', handlePageHide);
      }

      const auth = getFirebaseAuth();
      if (!auth) {
        set({ configured: false, authReady: true });
        return () => {
          unsubSettings();
          if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
          if (typeof window !== 'undefined') {
            window.removeEventListener('pagehide', handlePageHide);
          }
        };
      }

      const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
        const profile = toUserProfile(fbUser);
        const prevUid = get().user?.uid;
        set({
          configured: true,
          authReady: true,
          user: profile,
          signingIn: false,
          lastError: null,
        });

        if (profile && profile.uid !== prevUid) {
          void get().syncNow(false);
        } else if (!profile) {
          set({ syncStatus: 'idle', lastCloudSyncAt: null });
        }
      });

      return () => {
        unsubAuth();
        unsubSettings();
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        if (typeof window !== 'undefined') {
          window.removeEventListener('pagehide', handlePageHide);
        }
      };
    },

    signInWithGoogle: async () => {
      const auth = getFirebaseAuth();
      if (!auth) {
        set({
          lastError: 'Firebase chưa được cấu hình (thiếu biến môi trường VITE_FIREBASE_*).',
        });
        return;
      }

      set({ signingIn: true, lastError: null });
      try {
        await signInWithPopup(auth, getGoogleProvider());
      } catch (err) {
        const code = (err as { code?: string } | null)?.code || '';
        if (code === 'auth/popup-blocked') {
          try {
            await signInWithRedirect(auth, getGoogleProvider());
            return;
          } catch (redirectErr) {
            set({ signingIn: false, lastError: formatAuthError(redirectErr) });
            return;
          }
        }
        set({ signingIn: false, lastError: formatAuthError(err) });
      }
    },

    signOut: async () => {
      const auth = getFirebaseAuth();
      if (!auth) return;
      await flushPendingPushes();
      for (const timer of pendingSlotTimers.values()) clearTimeout(timer);
      pendingSlotTimers.clear();
      pendingSlotStates.clear();
      if (pendingUserDataTimer) {
        clearTimeout(pendingUserDataTimer);
        pendingUserDataTimer = null;
      }
      if (pendingSettingsTimer) {
        clearTimeout(pendingSettingsTimer);
        pendingSettingsTimer = null;
      }
      await firebaseSignOut(auth);
      set({ user: null, syncStatus: 'idle', lastCloudSyncAt: null, lastError: null });
    },

    syncNow: async (silent = false) => {
      const uid = get().user?.uid;
      if (!uid) return;
      if (syncInFlight) return syncInFlight;

      const run = (async () => {
        if (!silent) {
          set({ syncStatus: 'syncing', lastError: null });
        }
        try {
          await flushPendingPushes();

          // 1. Sync all 5 Learning Gate course/workpath slots in parallel
          const slotResults = await Promise.all(
            ALL_PROGRESS_SLOTS.map(async (slot) => {
              const inMemory = getSlotInMemoryState(slot);
              const res = await syncSlotWithCloud(uid, slot, inMemory);
              return { slot, res };
            })
          );

          for (const { slot, res } of slotResults) {
            if (res.localUpdated || !isSlotHydrated(slot)) {
              applyMergedSlotToStore(slot, res.state);
            }
          }

          // 2. Sync classic Python user data (lessons, notes, bookmarks, submissions, SRS, exams)
          const classicUpdatedLocally = await syncClassicUserDataWithCloud(uid);
          if (classicUpdatedLocally) {
            await useUserDataStore.getState().hydrateAll();
          }

          // 3. Sync user settings
          const remoteSettings = await syncSettingsWithCloud(
            uid,
            pickUserSettings(useSettingsStore.getState())
          );
          if (remoteSettings) {
            isApplyingRemoteSettings = true;
            try {
              useSettingsStore.getState().replaceAllSettings(remoteSettings);
              if (remoteSettings.theme) {
                useSettingsStore.getState().setTheme(remoteSettings.theme);
              }
            } finally {
              isApplyingRemoteSettings = false;
            }
          }

          set({
            syncStatus: 'synced',
            lastCloudSyncAt: Date.now(),
            lastError: null,
          });
        } catch (err) {
          console.warn('[useCloudSyncStore] syncNow failed:', err);
          set({
            syncStatus: 'error',
            lastError: formatAuthError(err),
          });
        } finally {
          syncInFlight = null;
        }
      })();

      syncInFlight = run;
      return run;
    },
  };
});
