import { describe, expect, it } from 'vitest';
import { describeRenderFailure } from './renderErrors';

describe('describeRenderFailure', () => {
  it('explains download failures (expired links, 403s)', () => {
    const f = describeRenderFailure('Asset could not be downloaded: 403 Forbidden');
    expect(f.message).toMatch(/couldn’t download the sermon video/);
    expect(f.detail).toBe('Asset could not be downloaded: 403 Forbidden');
  });

  it('explains clips that run past the end of the video', () => {
    expect(describeRenderFailure('Clip length exceeds the duration of the asset').message).toMatch(/past the end/);
  });

  it('explains unreadable formats', () => {
    expect(describeRenderFailure('Unsupported codec or variable frame rate').message).toMatch(/standard MP4/);
  });

  it('does not mistake a missing font for a download failure', () => {
    expect(describeRenderFailure('Font not found: Open Sans Bold').message).toMatch(/caption font/);
  });

  it('keeps unknown reasons as detail with a generic message', () => {
    const f = describeRenderFailure('Something odd happened');
    expect(f.message).toBe('Shotstack couldn’t finish this export.');
    expect(f.detail).toBe('Something odd happened');
  });

  it('handles a missing reason', () => {
    expect(describeRenderFailure(undefined)).toEqual({ message: 'The export didn’t finish. Try again in a minute.' });
  });
});
