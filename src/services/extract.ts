import type { Difficulty } from '../types/expression';

interface ExtractedExpression {
  korean: string;
  english: string;
  contextKorean: string | null;
  contextEnglish: string | null;
  difficulty: Difficulty;
}

/**
 * Split Korean text into sentences by punctuation.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!。？！])\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Score difficulty based on English translation characteristics.
 */
function scoreDifficulty(english: string): Difficulty {
  const words = english.split(/\s+/).length;
  if (words <= 3) return 'beginner';
  if (words <= 10) return 'intermediate';
  return 'advanced';
}

/**
 * Extract sentence-pair expressions from Korean transcript and English translations.
 * Each Korean sentence is paired 1:1 with its individual English translation.
 * Filters out sentences < 3 words (greetings like "안녕" → "Hi").
 */
export function extractExpressions(
  koreanSentences: string[],
  englishTranslations: string[]
): ExtractedExpression[] {
  const expressions: ExtractedExpression[] = [];
  const count = Math.min(koreanSentences.length, englishTranslations.length);

  for (let i = 0; i < count; i++) {
    const korean = koreanSentences[i].trim();
    const english = englishTranslations[i].trim();

    if (!korean || !english) continue;

    // Filter: skip sentences with < 3 English words
    const wordCount = english.split(/\s+/).length;
    if (wordCount < 3) continue;

    // Context: surrounding sentences
    const prevKorean = i > 0 ? koreanSentences[i - 1] : null;
    const nextKorean = i < count - 1 ? koreanSentences[i + 1] : null;
    const contextKorean = [prevKorean, korean, nextKorean].filter(Boolean).join(' ');

    const prevEnglish = i > 0 ? englishTranslations[i - 1] : null;
    const nextEnglish = i < count - 1 ? englishTranslations[i + 1] : null;
    const contextEnglish = [prevEnglish, english, nextEnglish].filter(Boolean).join(' ');

    expressions.push({
      korean,
      english,
      contextKorean,
      contextEnglish,
      difficulty: scoreDifficulty(english),
    });
  }

  return expressions;
}

export { splitSentences };
