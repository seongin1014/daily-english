import { create } from 'zustand';

interface StudySessionState {
  currentCardIndex: number;
  isFlipped: boolean;
  sessionScore: number;
  totalCards: number;
  setCurrentCardIndex: (v: number) => void;
  setIsFlipped: (v: boolean) => void;
  incrementScore: () => void;
  setTotalCards: (v: number) => void;
  nextCard: () => void;
  reset: () => void;
}

export const useStudySessionStore = create<StudySessionState>((set) => ({
  currentCardIndex: 0,
  isFlipped: false,
  sessionScore: 0,
  totalCards: 0,
  setCurrentCardIndex: (v) => set({ currentCardIndex: v }),
  setIsFlipped: (v) => set({ isFlipped: v }),
  incrementScore: () => set((s) => ({ sessionScore: s.sessionScore + 1 })),
  setTotalCards: (v) => set({ totalCards: v }),
  nextCard: () => set((s) => ({
    currentCardIndex: s.currentCardIndex + 1,
    isFlipped: false,
  })),
  reset: () => set({ currentCardIndex: 0, isFlipped: false, sessionScore: 0, totalCards: 0 }),
}));
