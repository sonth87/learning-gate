import React, { useEffect } from 'react';
import { DeviceLayout, useStore } from '@sonth87/device-layout';
import { ALL_LEARNING_APPS } from '@/apps/appRegistry';

export const App: React.FC = () => {
  useEffect(() => {
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
      } catch (err) {
        console.error('Failed to sync dock apps:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-screen h-screen h-[100dvh] overflow-hidden">
      <DeviceLayout
        apps={ALL_LEARNING_APPS}
        builtInApps={false}
      />
    </div>
  );
};

export default App;
