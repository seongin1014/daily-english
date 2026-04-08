export interface Review {
  id: number;
  expression_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  last_review: string | null;
}

export interface ReviewWithExpression extends Review {
  korean: string;
  english: string;
  context_korean: string | null;
  context_english: string | null;
  difficulty: string;
}
