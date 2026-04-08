import { create } from 'zustand';
import type { User } from 'firebase/auth';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  subscription: 'free' | 'pro';
  monthlyUsage: number;
  monthlyLimit: number;
  isProcessing: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (v: boolean) => void;
  setSubscription: (v: 'free' | 'pro') => void;
  setMonthlyUsage: (count: number, limit: number) => void;
  setIsProcessing: (v: boolean) => void;
  setBrowseMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  subscription: 'free',
  monthlyUsage: 0,
  monthlyLimit: 5,
  isProcessing: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, authLoading: false }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setSubscription: (v) => set({ subscription: v, monthlyLimit: v === 'pro' ? 999999 : 5 }),
  setMonthlyUsage: (count, limit) => set({ monthlyUsage: count, monthlyLimit: limit }),
  setIsProcessing: (v) => set({ isProcessing: v }),
  setBrowseMode: () => set({ user: null, isAuthenticated: true, authLoading: false }),
}));
