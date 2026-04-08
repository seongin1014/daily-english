import { calculateNextReview, buttonToQuality } from '../src/lib/sm2';

describe('SM-2 Algorithm', () => {
  const freshCard = { easeFactor: 2.5, interval: 0, repetitions: 0 };

  describe('buttonToQuality', () => {
    it('maps again to 1', () => expect(buttonToQuality('again')).toBe(1));
    it('maps hard to 3', () => expect(buttonToQuality('hard')).toBe(3));
    it('maps good to 4', () => expect(buttonToQuality('good')).toBe(4));
    it('maps easy to 5', () => expect(buttonToQuality('easy')).toBe(5));
  });

  describe('calculateNextReview', () => {
    it('resets on "again" (quality < 3)', () => {
      const result = calculateNextReview(1, { easeFactor: 2.5, interval: 10, repetitions: 5 });
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('first success sets interval to 1 day', () => {
      const result = calculateNextReview(4, freshCard);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('second success sets interval to 6 days', () => {
      const result = calculateNextReview(4, { easeFactor: 2.5, interval: 1, repetitions: 1 });
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('third success multiplies by ease factor', () => {
      const result = calculateNextReview(4, { easeFactor: 2.5, interval: 6, repetitions: 2 });
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.repetitions).toBe(3);
    });

    it('ease factor never drops below 1.3', () => {
      // Repeated "again" should not drop ease below 1.3
      let state = { ...freshCard };
      for (let i = 0; i < 10; i++) {
        const result = calculateNextReview(1, state);
        state = { easeFactor: result.easeFactor, interval: result.interval, repetitions: result.repetitions };
      }
      expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('easy increases ease factor', () => {
      const result = calculateNextReview(5, freshCard);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('hard decreases ease factor', () => {
      const result = calculateNextReview(3, freshCard);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('returns valid nextReview date string', () => {
      const result = calculateNextReview(4, freshCard);
      expect(result.nextReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('nextReview is today for "again"', () => {
      const result = calculateNextReview(1, freshCard);
      const today = new Date().toISOString().split('T')[0];
      expect(result.nextReview).toBe(today);
    });

    it('nextReview is tomorrow for first success', () => {
      const result = calculateNextReview(4, freshCard);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.nextReview).toBe(tomorrow.toISOString().split('T')[0]);
    });

    it('consecutive easy reviews accelerate intervals', () => {
      let state = { ...freshCard };
      const intervals: number[] = [];
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(5, state);
        intervals.push(result.interval);
        state = { easeFactor: result.easeFactor, interval: result.interval, repetitions: result.repetitions };
      }
      // Each interval should be larger than the previous (after the first two fixed intervals)
      for (let i = 2; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });
  });
});
