import { describe, expect, it } from 'vitest';
import { deterministicBucket, isInRollout } from './hash';

describe('deterministicBucket', () => {
  it('returns stable values for the same input', () => {
    expect(deterministicBucket('user-123:flag')).toBe(deterministicBucket('user-123:flag'));
  });

  it('returns values in 0..99 range', () => {
    for (let i = 0; i < 50; i++) {
      const bucket = deterministicBucket(`test-${i}`);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });
});

describe('isInRollout', () => {
  it('includes everyone at 100%', () => {
    expect(isInRollout('user-a', 'flag', 100)).toBe(true);
  });

  it('excludes everyone at 0%', () => {
    expect(isInRollout('user-a', 'flag', 0)).toBe(false);
  });
});
