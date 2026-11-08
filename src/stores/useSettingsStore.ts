import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore as useDeviceStore } from '@sonth87/device-layout';
import {
  CurriculumOrganizationMode,
  ThemeMode,
  UserSettings,
} from '@/types/user.types';

interface SettingsState extends UserSettings {
  setOrganizationMode: (mode: CurriculumOrganizationMode) => void;
  toggleJsTsComparison: () => void;
  setShowJsTsComparison: (val: boolean) => void;
  toggleAutoHighlight: () => void;
  setHighlightCategory: (
    cat: 'highlightKeywords' | 'highlightBuiltins' | 'highlightConcepts',
    val: boolean
  ) => void;
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  setTheme: (theme: ThemeMode) => void;
  replaceAllSettings: (settings: UserSettings) => void;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  organizationMode: 'by-stage',
  showJsTsComparison: true,
  enableAutoHighlight: true,
  highlightKeywords: true,
  highlightBuiltins: true,
  highlightConcepts: true,
  fontSize: 'base',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setOrganizationMode: (mode) => set({ organizationMode: mode }),
      toggleJsTsComparison: () =>
        set((s) => ({ showJsTsComparison: !s.showJsTsComparison })),
      setShowJsTsComparison: (val) => set({ showJsTsComparison: val }),
      toggleAutoHighlight: () =>
        set((s) => ({ enableAutoHighlight: !s.enableAutoHighlight })),
      setHighlightCategory: (cat, val) => set({ [cat]: val }),
      setFontSize: (fontSize) => set({ fontSize }),
      setTheme: (theme) => {
        set({ theme });
        const mapped = theme === 'system' ? 'auto' : theme;
        if (useDeviceStore.getState().colorScheme !== mapped) {
          useDeviceStore.getState().setColorScheme(mapped);
        }
      },
      replaceAllSettings: (settings) => set({ ...settings }),
    }),
    {
      name: 'pylearn_settings_v1',
    }
  )
);
