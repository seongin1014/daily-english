import { getDatabase } from './schema';
import type { Review, ReviewWithExpression } from '../types/review';

export async function getDueCards(): Promise<ReviewWithExpression[]> {
  const db = await getDatabase();
  return db.getAllAsync<ReviewWithExpression>(
    `SELECT r.*, e.korean, e.english, e.context_korean, e.context_english, e.difficulty
     FROM reviews r
     JOIN expressions e ON r.expression_id = e.id
     WHERE r.next_review <= date('now')
     ORDER BY r.next_review ASC`
  );
}

export async function getDueCardCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM reviews WHERE next_review <= date('now')"
  );
  return result?.count ?? 0;
}

export async function updateReview(
  expressionId: number,
  easeFactor: number,
  interval: number,
  repetitions: number,
  nextReview: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE reviews SET ease_factor = ?, interval = ?, repetitions = ?, next_review = ?, last_review = date('now')
     WHERE expression_id = ?`,
    easeFactor, interval, repetitions, nextReview, expressionId
  );
}

export interface StudyStats {
  mastered: number;
  learning: number;
  newCards: number;
  total: number;
}

export async function getStudyStats(): Promise<StudyStats> {
  const db = await getDatabase();
  const mastered = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews WHERE repetitions >= 5 AND ease_factor >= 2.5'
  );
  const learning = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews WHERE repetitions > 0 AND NOT (repetitions >= 5 AND ease_factor >= 2.5)'
  );
  const newCards = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews WHERE repetitions = 0'
  );
  const total = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews'
  );
  return {
    mastered: mastered?.count ?? 0,
    learning: learning?.count ?? 0,
    newCards: newCards?.count ?? 0,
    total: total?.count ?? 0,
  };
}

export async function getTodayReviewCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM reviews WHERE date(last_review) = date('now')"
  );
  return result?.count ?? 0;
}

export async function getWeeklyActivity(): Promise<number[]> {
  const db = await getDatabase();
  // Returns review count for each of the last 7 days (Mon-Sun)
  const days: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM reviews WHERE date(last_review) = date('now', ? || ' days')",
      `-${i}`
    );
    days.push(result?.count ?? 0);
  }
  return days;
}

export async function getHardestExpressions(limit: number = 5): Promise<{ korean: string; english: string; ease_factor: number }[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT e.korean, e.english, r.ease_factor
     FROM reviews r JOIN expressions e ON r.expression_id = e.id
     WHERE r.repetitions > 0
     ORDER BY r.ease_factor ASC
     LIMIT ?`,
    limit
  );
}

export async function getStreak(): Promise<number> {
  const db = await getDatabase();
  // Count consecutive days with at least one review
  const rows = await db.getAllAsync<{ review_date: string }>(
    `SELECT DISTINCT date(last_review) as review_date FROM reviews
     WHERE last_review IS NOT NULL
     ORDER BY review_date DESC
     LIMIT 30`
  );
  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (rows[i].review_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
