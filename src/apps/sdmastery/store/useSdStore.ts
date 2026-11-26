import { create } from 'zustand';
import type { SdMainTab } from '../sd.types';

interface SdAppState {
  activeTab: SdMainTab;
  setActiveTab: (tab: SdMainTab) => void;
}

export const useSdStore = create<SdAppState>((set) => ({
  activeTab: 'learn',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
