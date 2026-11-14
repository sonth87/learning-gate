import { create } from 'zustand';
import type { RedisFlowId, RedisMainTab, RedisSimMode } from '../types/redis.types';

interface RedisAppState {
  activeTab: RedisMainTab;
  simMode: RedisSimMode;
  selectedFlowId: RedisFlowId;
  selectedIncidentId: string;
  isSearchOpen: boolean;
  setActiveTab: (tab: RedisMainTab) => void;
  setSimMode: (mode: RedisSimMode) => void;
  openSimulatorMode: (mode: RedisSimMode) => void;
  openFlowInStudio: (flowId: RedisFlowId) => void;
  openIncidentInWarRoom: (incidentId: string) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useRedisStore = create<RedisAppState>((set) => ({
  activeTab: 'learn',
  simMode: 'memory',
  selectedFlowId: 'event-loop-pipeline',
  selectedIncidentId: 'inc-cache-stampede',
  isSearchOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSimMode: (simMode) => set({ simMode }),
  openSimulatorMode: (simMode) => set({ activeTab: 'simulator', simMode }),
  openFlowInStudio: (selectedFlowId) => set({ activeTab: 'flow-studio', selectedFlowId }),
  openIncidentInWarRoom: (selectedIncidentId) => set({ activeTab: 'incidents', selectedIncidentId }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
}));
