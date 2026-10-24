import { describe, expect, it } from 'vitest';
import { getYouTubeId, nextPollDelay, wrapWords } from './helpers';

describe('getYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ?start=10', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('parses %s', (url, id) => {
    expect(getYouTubeId(url)).toBe(id);
  });

  it.each([null, undefined, '', 'https://cdn.example.com/sermon.mp4', 'https://youtu.be/short'])(
    'returns null for %s',
    (url) => {
      expect(getYouTubeId(url)).toBeNull();
    }
  );
});

describe('nextPollDelay', () => {
  it('polls every 2s for the first two minutes', () => {
    expect(nextPollDelay(0)).toBe(2000);
    expect(nextPollDelay(119_000)).toBe(2000);
  });

  it('backs off to 5s, then 10s', () => {
    expect(nextPollDelay(3 * 60_000)).toBe(5000);
    expect(nextPollDelay(30 * 60_000)).toBe(10000);
  });

  it('stops after the max duration', () => {
    expect(nextPollDelay(60 * 60_000)).toBeNull();
    expect(nextPollDelay(5000, 5000)).toBeNull();
  });
});

describe('wrapWords', () => {
  const measure = (s: string) => s.length; // 1 unit per char

  it('keeps short text on one line', () => {
    expect(wrapWords('grace upon grace', 40, measure)).toEqual(['grace upon grace ']);
  });

  it('wraps when a line would exceed the width', () => {
    expect(wrapWords('aaa bbb ccc', 8, measure)).toEqual(['aaa bbb ', 'ccc ']);
  });

  it('never leaves an empty first line for one long word', () => {
    expect(wrapWords('supercalifragilistic', 5, measure)).toEqual(['supercalifragilistic ']);
  });
});
