export interface ReviewState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ReviewResult extends ReviewState {
  nextReview: string; // ISO date string (YYYY-MM-DD)
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Quality mapping from UI buttons:
 *   다시 (Again) = 1
 *   어려움 (Hard) = 3
 *   괜찮음 (Good) = 4
 *   쉬움 (Easy) = 5
 */
export function calculateNextReview(
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  current: ReviewState
): ReviewResult {
  let { easeFactor, interval, repetitions } = current;

  if (quality < 3) {
    // Failed — reset repetitions, keep ease factor
    repetitions = 0;
    interval = 0;
  } else {
    // Successful review
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  // Minimum ease factor is 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (interval === 0 ? 0 : interval));
  const nextReview = nextDate.toISOString().split('T')[0];

  return { easeFactor, interval, repetitions, nextReview };
}

/**
 * Map UI button to SM-2 quality score
 */
export type SRButtonType = 'again' | 'hard' | 'good' | 'easy';

export function buttonToQuality(button: SRButtonType): 0 | 1 | 2 | 3 | 4 | 5 {
  switch (button) {
    case 'again': return 1;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
  }
}
