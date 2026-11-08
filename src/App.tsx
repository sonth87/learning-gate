import React, { useEffect, useRef } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import {
  ALL_LEARNING_APPS,
  CICD_MASTERY_CONFIG,
  KUBEMASTERY_CONFIG,
  PYMASTERY_CONFIG,
} from '@/apps/appRegistry';

export const App: React.FC = () => {
  const autoLaunchedRef = useRef(false);

  useEffect(() => {
    if (autoLaunchedRef.current) return;
    autoLaunchedRef.current = true;

    const timer = setTimeout(() => {
      try {
        const store = useStore.getState();

        // Keep Python Mastery, Docker & K8s Mastery, and CI/CD Mastery pinned in the Dock
        const nextDock = Array.from(
          new Set([
            ...store.dockAppIds,
            'pymastery',
            'kubemastery',
            'cicdmastery',
          ])
        );
        useStore.setState({ dockAppIds: nextDock });

        const existingCicd = Object.values(store.windows).find(
          (w) => w.appId === 'cicdmastery'
        );
        const existingKube = Object.values(store.windows).find(
          (w) => w.appId === 'kubemastery'
        );
        const existingPy = Object.values(store.windows).find(
          (w) => w.appId === 'pymastery'
        );

        if (!existingCicd && !existingKube && !existingPy && store.launchApp) {
          // Launch apps in the workspace and focus CI/CD Mastery
          store.launchApp(PYMASTERY_CONFIG, {
            isFullScreen: false,
            isMaximized: false,
          });
          store.launchApp(KUBEMASTERY_CONFIG, {
            isFullScreen: false,
            isMaximized: false,
          });
          const cicdWinId = store.launchApp(CICD_MASTERY_CONFIG, {
            isFullScreen: false,
            isMaximized: false,
          });
          if (cicdWinId && store.enterFullScreen) {
            store.enterFullScreen(cicdWinId);
          }
        } else if (!existingCicd && store.launchApp) {
          const cicdWinId = store.launchApp(CICD_MASTERY_CONFIG, {
            isFullScreen: false,
            isMaximized: false,
          });
          if (cicdWinId && store.enterFullScreen) {
            store.enterFullScreen(cicdWinId);
          }
        }
      } catch (err) {
        console.error('Failed to auto-launch learning apps:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-screen h-screen h-[100dvh] overflow-hidden">
      <DeviceLayout
        apps={ALL_LEARNING_APPS}
        builtInApps={false}
        fallbackMenuBarAppId="cicdmastery"
      />
    </div>
  );
};

export default App;
