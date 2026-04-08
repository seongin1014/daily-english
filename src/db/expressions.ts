import { getDatabase } from './schema';
import type { Expression, Difficulty } from '../types/expression';

export async function createExpression(
  recordingId: number,
  korean: string,
  english: string,
  contextKorean: string | null,
  contextEnglish: string | null,
  difficulty: Difficulty,
  isAutoExtracted: boolean = true
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO expressions (recording_id, korean, english, context_korean, context_english, difficulty, is_auto_extracted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    recordingId, korean, english, contextKorean, contextEnglish, difficulty, isAutoExtracted ? 1 : 0
  );
  // Create initial review record for SR
  await db.runAsync(
    `INSERT INTO reviews (expression_id) VALUES (?)`,
    result.lastInsertRowId
  );
  return result.lastInsertRowId;
}

export async function getExpressionsByRecording(recordingId: number): Promise<Expression[]> {
  const db = await getDatabase();
  return db.getAllAsync<Expression>(
    'SELECT * FROM expressions WHERE recording_id = ? ORDER BY id ASC',
    recordingId
  );
}

export async function getAllExpressions(): Promise<Expression[]> {
  const db = await getDatabase();
  return db.getAllAsync<Expression>(
    'SELECT * FROM expressions ORDER BY created_at DESC'
  );
}

export async function getExpressionCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM expressions');
  return result?.count ?? 0;
}

export async function getTodayExpressionCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM expressions WHERE date(created_at) = date('now')"
  );
  return result?.count ?? 0;
}
