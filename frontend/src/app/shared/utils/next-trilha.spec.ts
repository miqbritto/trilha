import { nextTrilhaCountdown } from './next-trilha';

describe('Next daily track countdown', () => {
  it('counts down to midnight in the game timezone', () => {
    expect(nextTrilhaCountdown(new Date('2026-09-29T00:21:00Z'))).toBe('2H 39M');
  });

  it('rounds up the last minute instead of showing zero early', () => {
    expect(nextTrilhaCountdown(new Date('2026-09-29T02:59:59Z'))).toBe('0H 01M');
  });

  it('starts a new countdown at midnight', () => {
    expect(nextTrilhaCountdown(new Date('2026-09-29T03:00:00Z'))).toBe('24H 00M');
  });
});
