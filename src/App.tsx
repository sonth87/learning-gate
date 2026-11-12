import React, { useEffect } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import { ALL_LEARNING_APPS } from '@/apps/appRegistry';

export const App: React.FC = () => {
  useEffect(() => {
    const syncResponsiveDeviceTheme = () => {
      try {
        const store = useStore.getState();
        const w = window.innerWidth;
        const ua = navigator.userAgent || '';
        const isAndroid = /Android/i.test(ua);
        const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
        const isMobilePhone = w <= 768 || /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
        const isTablet = (!isMobilePhone && w > 768 && w <= 1024) || isIPad;

        if (isMobilePhone && (store.osTheme === 'macos' || store.osTheme === 'windows' || store.osTheme === 'ipad')) {
          store.setOSTheme(isAndroid ? 'android' : 'iphone');
        } else if (isTablet && (store.osTheme === 'macos' || store.osTheme === 'windows')) {
          store.setOSTheme('ipad');
        }
      } catch (err) {
        console.error('Failed to sync responsive OS theme:', err);
      }
    };

    const timer = setTimeout(() => {
      try {
        const store = useStore.getState();

        // Keep Python Mastery, Docker & K8s Mastery, and CI/CD Mastery pinned in the Dock
        // without auto-launching any window by default (DeviceLayout handles URL-based opening).
        const nextDock = Array.from(
          new Set([
            ...store.dockAppIds,
            'pymastery',
            'kubemastery',
            'cicdmastery',
          ])
        );
        useStore.setState({ dockAppIds: nextDock });
        syncResponsiveDeviceTheme();
      } catch (err) {
        console.error('Failed to sync dock apps:', err);
      }
    }, 80);

    window.addEventListener('resize', syncResponsiveDeviceTheme);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', syncResponsiveDeviceTheme);
    };
  }, []);

  // `fixed inset-0` tracks the visible viewport on mobile browsers. `h-screen`
  // (100vh) is the *large* viewport on iOS Safari and pushed the bottom of the
  // UI (e.g. PyMastery's bottom nav) underneath the browser toolbar.
  return (
    <div className="fixed inset-0 overflow-hidden">
      <DeviceLayout
        apps={ALL_LEARNING_APPS}
        builtInApps={false}
      />
    </div>
  );
};

export default App;
