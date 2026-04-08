import { getDatabase } from './schema';
import type { QuizResult, QuizType } from '../types/quiz';

export async function saveQuizResult(
  quizType: QuizType,
  totalQuestions: number,
  correctAnswers: number,
  expressionIds: number[]
): Promise<number> {
  const db = await getDatabase();
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const result = await db.runAsync(
    'INSERT INTO quiz_results (quiz_type, total_questions, correct_answers, score, expression_ids) VALUES (?, ?, ?, ?, ?)',
    quizType, totalQuestions, correctAnswers, score, JSON.stringify(expressionIds)
  );
  return result.lastInsertRowId;
}

export async function getRecentQuizResults(limit: number = 10): Promise<QuizResult[]> {
  const db = await getDatabase();
  return db.getAllAsync<QuizResult>(
    'SELECT * FROM quiz_results ORDER BY completed_at DESC LIMIT ?',
    limit
  );
}
