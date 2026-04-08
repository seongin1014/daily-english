export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Expression {
  id: number;
  recording_id: number;
  korean: string;
  english: string;
  context_korean: string | null;
  context_english: string | null;
  difficulty: Difficulty;
  is_auto_extracted: number | boolean;
  created_at: string;
}
