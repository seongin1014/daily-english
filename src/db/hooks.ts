import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllRecordings, getRecording } from './recordings';
import { getExpressionsByRecording, getAllExpressions, getExpressionCount, getTodayExpressionCount, getExpressionCountByRecording } from './expressions';
import { getDueCards, getDueCardCount, getStudyStats, getStreak, getTodayReviewCount, getWeeklyActivity, getHardestExpressions, type StudyStats } from './reviews';
import { getSetting } from './settings';
import type { Recording } from '../types/recording';
import type { Expression } from '../types/expression';
import type { ReviewWithExpression } from '../types/review';

// Simple version counter for invalidation
let _version = 0;
const _listeners = new Set<() => void>();

export function invalidateDB() {
  _version++;
  _listeners.forEach(fn => fn());
}

function useDBQuery<T>(queryFn: () => Promise<T>, initialValue: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await queryFn();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      console.error('DB query error:', err);
      if (mountedRef.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    _listeners.add(refresh);
    return () => {
      mountedRef.current = false;
      _listeners.delete(refresh);
    };
  }, [refresh]);

  return { data, loading, refresh };
}

export function useRecordings() {
  return useDBQuery(() => getAllRecordings(), [] as Recording[]);
}

export function useRecording(id: number) {
  return useDBQuery(() => getRecording(id), null as Recording | null, [id]);
}

export function useExpressions(recordingId?: number) {
  return useDBQuery(
    () => recordingId ? getExpressionsByRecording(recordingId) : getAllExpressions(),
    [] as Expression[],
    [recordingId]
  );
}

export function useDueCards() {
  return useDBQuery(() => getDueCards(), [] as ReviewWithExpression[]);
}

export function useDueCardCount() {
  return useDBQuery(() => getDueCardCount(), 0);
}

export function useStudyStats() {
  return useDBQuery(() => getStudyStats(), { mastered: 0, learning: 0, newCards: 0, total: 0 } as StudyStats);
}

export function useStreak() {
  return useDBQuery(() => getStreak(), 0);
}

export function useExpressionCount() {
  return useDBQuery(() => getExpressionCount(), 0);
}

export function useTodayExpressionCount() {
  return useDBQuery(() => getTodayExpressionCount(), 0);
}

export function useTodayReviewCount() {
  return useDBQuery(() => getTodayReviewCount(), 0);
}

export function useWeeklyActivity() {
  return useDBQuery(() => getWeeklyActivity(), [0, 0, 0, 0, 0, 0, 0] as number[]);
}

export function useHardestExpressions(limit: number = 5) {
  return useDBQuery(
    () => getHardestExpressions(limit),
    [] as { korean: string; english: string; ease_factor: number }[],
    [limit]
  );
}

export function useSetting(key: string, defaultValue: string) {
  return useDBQuery(
    async () => {
      const val = await getSetting(key);
      return val ?? defaultValue;
    },
    defaultValue,
    [key]
  );
}

export function useExpressionCountByRecording(recordingId: number) {
  return useDBQuery(() => getExpressionCountByRecording(recordingId), 0, [recordingId]);
}
