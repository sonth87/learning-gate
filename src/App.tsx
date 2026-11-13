import React, { useCallback, useEffect } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import { ALL_LEARNING_APPS } from '@/apps/appRegistry';

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
  const isAndroidTabletUA = /Android/i.test(ua) && !/Mobile/i.test(ua);

  if (isIPadUA || isAndroidTabletUA) return 'tablet';
  return 'desktop';
}

export const App: React.FC = () => {
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
            'kubemastery',
            'cicdmastery',
            'pmpmastery',
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

  // Prevent fullscreen top-edge chrome peek (`clientY <= 6` / `clientY < 50` in MacOSTheme)
  // from repeatedly slamming MenuBar + WindowChrome down over app headers (`0..48px`)
  // during normal tab clicks, while still allowing intentional reveal at the literal top 1px edge.
  const handleShellMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const state = useStore.getState();
    if (state.fullscreenChromeRevealed) return;
    if (e.clientY > 1 && e.clientY < 52) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.pylearn-root')) {
        e.stopPropagation();
      }
    }
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
      className="fixed inset-0 overflow-hidden"
      onMouseMove={handleShellMouseMove}
      onKeyDown={handleShellKeyDown}
    >
      <DeviceLayout
        apps={ALL_LEARNING_APPS}
        builtInApps={false}
      />
    </div>
  );
};

export default App;
