import React, { useEffect, useRef } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import { ALL_LEARNING_APPS, PYMASTERY_CONFIG } from '@/apps/appRegistry';

export const App: React.FC = () => {
  const autoLaunchedRef = useRef(false);

  useEffect(() => {
    if (autoLaunchedRef.current) return;
    autoLaunchedRef.current = true;

    const timer = setTimeout(() => {
      try {
        const store = useStore.getState();

        // Keep Python Mastery pinned in the Dock so it remains visible even if closed
        if (!store.dockAppIds.includes('pymastery')) {
          useStore.setState({ dockAppIds: ['pymastery'] });
        }

        const existing = Object.values(store.windows).find(
          (w) => w.appId === 'pymastery'
        );

        if (!existing && store.launchApp) {
          // Open as a normal centered window first so prevRect is preserved when exiting Full Screen
          const winId = store.launchApp(PYMASTERY_CONFIG, {
            isFullScreen: false,
            isMaximized: false,
          });
          if (winId && store.enterFullScreen) {
            store.enterFullScreen(winId);
          }
        }
      } catch (err) {
        console.error('Failed to auto-launch PyMastery:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-screen h-screen h-[100dvh] overflow-hidden">
      <DeviceLayout
        apps={ALL_LEARNING_APPS}
        builtInApps={false}
        fallbackMenuBarAppId="pymastery"
      />
    </div>
  );
};

export default App;
