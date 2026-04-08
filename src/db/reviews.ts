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
  const result = await db.getFirstAsync<{
    total: number; mastered: number; learning: number; new_cards: number;
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN repetitions >= 5 AND ease_factor >= 2.5 THEN 1 ELSE 0 END) as mastered,
      SUM(CASE WHEN repetitions > 0 AND NOT (repetitions >= 5 AND ease_factor >= 2.5) THEN 1 ELSE 0 END) as learning,
      SUM(CASE WHEN repetitions = 0 THEN 1 ELSE 0 END) as new_cards
    FROM reviews`
  );
  return {
    mastered: result?.mastered ?? 0,
    learning: result?.learning ?? 0,
    newCards: result?.new_cards ?? 0,
    total: result?.total ?? 0,
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
  const rows = await db.getAllAsync<{ days_ago: number; count: number }>(
    `SELECT CAST(julianday(date('now')) - julianday(date(last_review)) AS INTEGER) AS days_ago,
            COUNT(*) as count
     FROM reviews
     WHERE last_review IS NOT NULL AND date(last_review) >= date('now', '-6 days')
     GROUP BY days_ago`
  );
  // Map into 7-element array [6 days ago ... today]
  const result = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rows) {
    const idx = 6 - row.days_ago;
    if (idx >= 0 && idx < 7) result[idx] = row.count;
  }
  return result;
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
