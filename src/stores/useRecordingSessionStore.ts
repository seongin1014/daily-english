import { create } from 'zustand';

interface RecordingSessionState {
  isRecording: boolean;
  elapsedTime: number;
  currentAmplitude: number;
  setIsRecording: (v: boolean) => void;
  setElapsedTime: (v: number) => void;
  setCurrentAmplitude: (v: number) => void;
  reset: () => void;
}

export const useRecordingSessionStore = create<RecordingSessionState>((set) => ({
  isRecording: false,
  elapsedTime: 0,
  currentAmplitude: 0,
  setIsRecording: (v) => set({ isRecording: v }),
  setElapsedTime: (v) => set({ elapsedTime: v }),
  setCurrentAmplitude: (v) => set({ currentAmplitude: v }),
  reset: () => set({ isRecording: false, elapsedTime: 0, currentAmplitude: 0 }),
}));
