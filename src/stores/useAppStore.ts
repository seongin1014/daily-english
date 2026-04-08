import { create } from 'zustand';

interface AppState {
  isProcessing: boolean;
  apiKeyConfigured: boolean;
  setIsProcessing: (v: boolean) => void;
  setApiKeyConfigured: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isProcessing: false,
  apiKeyConfigured: false,
  setIsProcessing: (v) => set({ isProcessing: v }),
  setApiKeyConfigured: (v) => set({ apiKeyConfigured: v }),
}));
