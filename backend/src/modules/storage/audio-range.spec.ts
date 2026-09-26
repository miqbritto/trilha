import { audioRange, AudioRangeError } from './audio-range';

describe('audio ranges', () => {
  it.each([
    ['bytes=0-9', 'bytes=0-9'],
    ['bytes=10-', 'bytes=10-99'],
    ['bytes=-10', 'bytes=90-99'],
    ['bytes=-200', 'bytes=0-99'],
    ['bytes=90-200', 'bytes=90-99'],
  ])('normalizes %s', (input, expected) => {
    expect(audioRange(input, 100)).toBe(expected);
  });
  it.each(['bytes=100-', 'bytes=9-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,4-5', 'invalid', 'bytes=99999999999999999-'])('rejects %s', input => {
    expect(() => audioRange(input, 100)).toThrow(AudioRangeError);
  });
});
