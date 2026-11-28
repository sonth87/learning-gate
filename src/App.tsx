import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import { getLearningApps } from '@/apps/appRegistry';
import { LearningGateGlyph, LearningGateLogo } from '@/components/common/AppLogos';
import { useWorkbenchStore } from '@/stores/useWorkbenchStore';
import { useSettingsStore, resolveWorkbenchTheme } from '@/stores/useSettingsStore';
import { useCloudSyncStore } from '@/stores/useCloudSyncStore';
import { useCloudMenuBarExtras } from '@/components/common/MenuBarUserExtra';

const SHELL_STABILIZED_KEY = 'pylearn_desktop_shell_stabilized_v1';

function detectHardwareFormFactor(): 'phone' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }
  const ua = navigator.userAgent || '';
  const isPhoneUA = /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isPhoneUA) return 'phone';

  const hasCoarsePrimaryPointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(pointer: fine)').matches;

  const isIPadUA =
    /iPad/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1 && hasCoarsePrimaryPointer);
  const isAndroidTabletUA =
    (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
    (/Linux/i.test(ua) && !/Android/i.test(ua) && navigator.maxTouchPoints > 1 && hasCoarsePrimaryPointer);

  if (isIPadUA || isAndroidTabletUA) return 'tablet';
  return 'desktop';
}

export const App: React.FC = () => {
  const shellRootRef = useRef<HTMLDivElement>(null);
  const workbenchTheme = useWorkbenchStore((s) => s.workbenchTheme);
  const workbenchLang = useWorkbenchStore((s) => s.language);
  const learningApps = useMemo(() => getLearningApps(workbenchLang), [workbenchLang]);
  const settingsTheme = useSettingsStore((s) => s.theme);
  const menuBarExtras = useCloudMenuBarExtras();
  const hasOpenWindow = useStore((s) =>
    Object.values(s.windows).some((w) => !w.isMinimized)
  );

  // Fix iOS Safari / Standalone PWA stuck bottom gap after keyboard open/close or input focus:
  // Always keep window scroll at (0, 0) and snap the root container back to full viewport height.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewport = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      const el = shellRootRef.current;
      const vv = window.visualViewport;
      if (!el || !vv) return;
      const keyboardOpen = window.innerHeight - vv.height > 120;
      if (keyboardOpen) {
        el.style.height = `${vv.height}px`;
        el.style.bottom = 'auto';
      } else {
        el.style.height = '';
        el.style.bottom = '';
      }
    };

    const onFocusOut = () => {
      syncViewport();
      window.setTimeout(syncViewport, 80);
      window.setTimeout(syncViewport, 250);
    };

    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('focusout', onFocusOut);
    window.addEventListener('orientationchange', onFocusOut);
    return () => {
      window.visualViewport?.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('orientationchange', onFocusOut);
    };
  }, []);

  // Sync iOS Safari / Add-to-Home-Screen safe-area background & <meta name="theme-color">
  // so top & bottom safe areas never show stark white bars on iPhone / iPad.
  useEffect(() => {
    const surfaceColor = hasOpenWindow
      ? workbenchTheme === 'dark'
        ? '#26221e'
        : '#efe4d4'
      : '#0f172a';

    document.documentElement.style.backgroundColor = surfaceColor;
    document.body.style.backgroundColor = surfaceColor;

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', surfaceColor);
  }, [workbenchTheme, hasOpenWindow]);

  // Keep workbenchTheme in sync with OS color scheme when Settings theme is 'system' (Auto).
  useEffect(() => {
    if (settingsTheme !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => {
      const resolved = resolveWorkbenchTheme('system');
      if (useWorkbenchStore.getState().workbenchTheme !== resolved) {
        useWorkbenchStore.getState().setWorkbenchTheme(resolved);
      }
    };
    syncSystemTheme();
    mq.addEventListener('change', syncSystemTheme);
    return () => mq.removeEventListener('change', syncSystemTheme);
  }, [settingsTheme]);

  useEffect(() => {
    const unsubCloudAuth = useCloudSyncStore.getState().initAuthListener();
    return () => {
      unsubCloudAuth();
    };
  }, []);

  useEffect(() => {
    const syncInitialShellState = () => {
      try {
        const store = useStore.getState();
        const formFactor = detectHardwareFormFactor();

        // Keep Python Mastery, Docker & K8s Mastery, CI/CD Mastery, and PMP Mastery pinned in the Dock
        // without auto-launching any window by default (DeviceLayout handles URL-based opening).
        const nextDock = Array.from(
          new Set([
            ...store.dockAppIds,
            'pymastery',
            'redismastery',
            'kubemastery',
            'cicdmastery',
            'pmpmastery',
            'sdmastery',
          ])
        );

        let alreadyStabilized = false;
        try {
          alreadyStabilized = window.localStorage.getItem(SHELL_STABILIZED_KEY) === '1';
        } catch {
          alreadyStabilized = false;
        }

        // One-time stabilization:
        // 1) Disable LiquidGlass WebGL shader + SVG feDisplacementMap backdrop-filter by default
        //    to prevent Chromium/WebKit GPU compositor whole-window black/transparent blinking.
        // 2) Heal desktop browsers that previously got stuck in 'iphone'/'ipad' OS theme when
        //    resizing narrow windows or opening DevTools on localhost.
        if (!alreadyStabilized) {
          if (store.glassEnabled && store.setGlassEnabled) {
            store.setGlassEnabled(false);
          }
          if (
            formFactor === 'desktop' &&
            (store.osTheme === 'iphone' || store.osTheme === 'android' || store.osTheme === 'ipad')
          ) {
            store.setOSTheme('macos');
          }
          try {
            window.localStorage.setItem(SHELL_STABILIZED_KEY, '1');
          } catch {
            // Ignore storage quota / privacy mode errors
          }
        }

        // Only auto-select mobile/tablet OS chrome on real mobile/tablet hardware,
        // NEVER on desktop window resize / DevTools open-close (which would unmount WindowManager
        // or kick open apps out of Fullscreen while `.pylearn-root` already handles @container queries).
        if (formFactor === 'phone' && (store.osTheme === 'macos' || store.osTheme === 'windows' || store.osTheme === 'ipad')) {
          const isAndroid = /Android/i.test(navigator.userAgent || '');
          store.setOSTheme(isAndroid ? 'android' : 'iphone');
        } else if (formFactor === 'tablet' && (store.osTheme === 'macos' || store.osTheme === 'windows')) {
          store.setOSTheme('ipad');
        }

        useStore.setState({ dockAppIds: nextDock });
      } catch (err) {
        console.error('Failed to initialize shell state:', err);
      }
    };

    const timer = setTimeout(syncInitialShellState, 60);
    return () => clearTimeout(timer);
  }, []);

  // Prevent pressing Escape inside inputs, editors, or dialogs inside `.pylearn-root`
  // from bubbling to `Window.tsx` and accidentally yanking the learning app out of Fullscreen.
  const handleShellKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]')) {
      e.stopPropagation();
    }
  }, []);

  // `fixed inset-0` tracks the visible viewport on mobile browsers. `h-screen`
  // (100vh) is the *large* viewport on iOS Safari and pushed the bottom of the
  // UI (e.g. PyMastery's bottom nav) underneath the browser toolbar.
  return (
    <div
      ref={shellRootRef}
      className="fixed inset-0 overflow-hidden"
      onKeyDown={handleShellKeyDown}
    >
      <DeviceLayout
        apps={learningApps}
        builtInApps={false}
        menuBarExtras={menuBarExtras}
        macOSAppleIcon={<LearningGateGlyph />}
        windowsStartIcon={<LearningGateLogo className="h-5 w-5 rounded-[5px]" />}
      />
    </div>
  );
};

export default App;
