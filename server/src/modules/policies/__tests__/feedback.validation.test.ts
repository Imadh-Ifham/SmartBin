import { feedbackDateSchema } from '../policy.controller';
import { z } from 'zod';

describe('feedbackDateSchema transform', () => {
  test('rejects empty string', () => {
    const parsed = feedbackDateSchema.safeParse('');
    expect(parsed.success).toBe(false);
  });

  test('rejects invalid date string', () => {
    const parsed = feedbackDateSchema.safeParse('not-a-date');
    expect(parsed.success).toBe(false);
  });

  test('accepts valid date string and Date object', () => {
    const parsed1 = feedbackDateSchema.safeParse('2025-10-01');
    expect(parsed1.success).toBe(true);
    const parsed2 = feedbackDateSchema.safeParse(new Date('2025-10-01'));
    expect(parsed2.success).toBe(true);
  });
});
