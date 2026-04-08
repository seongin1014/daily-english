export type QuizType = 'multiple_choice' | 'fill_blank';

export interface QuizResult {
  id: number;
  quiz_type: QuizType;
  total_questions: number;
  correct_answers: number;
  score: number;
  expression_ids: string; // JSON array
  completed_at: string;
}

export interface QuizQuestion {
  expressionId: number;
  korean: string;
  english: string;
  contextKorean: string | null;
  contextEnglish: string | null;
}

export interface MultipleChoiceQuestion extends QuizQuestion {
  options: string[];
  correctIndex: number;
}

export interface FillBlankQuestion extends QuizQuestion {
  sentence: string; // English sentence with ___
  answer: string;   // correct word/phrase
  hint: string;     // Korean hint
}
