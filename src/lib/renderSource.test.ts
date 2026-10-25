import { describe, expect, it } from 'vitest';
import { chooseRenderSource, keyBelongsToJob, storageKeyFor } from './renderSource';

const R2 = 'https://acct.r2.cloudflarestorage.com/sermon-clipper';

describe('storageKeyFor', () => {
  it.each([
    ['uploads/job1/abc.mp4', 'uploads/job1/abc.mp4'],
    ['sermons/job1.mp4', 'sermons/job1.mp4'],
    [`${R2}/uploads/job1/abc.mp4`, 'uploads/job1/abc.mp4'],
    [`${R2}/uploads/job1/abc.mp4?X-Amz-Signature=deadbeef&X-Amz-Expires=3600`, 'uploads/job1/abc.mp4'],
    ['https://cdn.vesper.example/uploads/job1/abc.mp4?token=t&expires=1', 'uploads/job1/abc.mp4'],
    ['/api/media?key=uploads%2Fjob1%2Fabc.mp4&exp=1&sig=s', 'uploads/job1/abc.mp4'],
  ])('finds the key in %s', (input, key) => {
    expect(storageKeyFor(input)).toBe(key);
  });

  it.each([null, '', 'https://example.com/video.mp4', '/api/media?key=etc/passwd', 'not a url'])(
    'returns null for %s',
    (input) => {
      expect(storageKeyFor(input)).toBeNull();
    }
  );
});

describe('keyBelongsToJob', () => {
  it('matches upload and sermon keys for the job', () => {
    expect(keyBelongsToJob('uploads/job1/abc.mp4', 'job1')).toBe(true);
    expect(keyBelongsToJob('sermons/job1.mp4', 'job1')).toBe(true);
  });

  it('rejects other jobs, prefixes and path tricks', () => {
    expect(keyBelongsToJob('uploads/job2/abc.mp4', 'job1')).toBe(false);
    expect(keyBelongsToJob('uploads/job10/abc.mp4', 'job1')).toBe(false);
    expect(keyBelongsToJob('uploads/job1/abc.mp4', '')).toBe(false);
    expect(keyBelongsToJob('uploads/a/b.mp4', 'a/../b')).toBe(false);
  });
});

describe('chooseRenderSource', () => {
  it('prefers the progress record, then the sermon record', () => {
    expect(chooseRenderSource({ jobId: 'j', progressPath: 'uploads/j/1.mp4', sermonPath: 'sermons/j.mp4' })).toBe(
      'uploads/j/1.mp4'
    );
    expect(chooseRenderSource({ jobId: 'j', sermonPath: 'sermons/j.mp4', clientUrl: 'uploads/j/2.mp4' })).toBe(
      'sermons/j.mp4'
    );
  });

  it('accepts the browser URL only when it is this job’s file', () => {
    expect(chooseRenderSource({ jobId: 'j', clientUrl: `${R2}/uploads/j/1.mp4?X-Amz-Signature=x` })).toBe('uploads/j/1.mp4');
    expect(chooseRenderSource({ jobId: 'j', clientUrl: 'uploads/someone-else/1.mp4' })).toBeNull();
  });

  it('accepts an external URL only if it is the sermon’s own source', () => {
    const ext = 'https://media.church.example/sunday.mp4';
    expect(chooseRenderSource({ jobId: 'j', clientUrl: ext, sermonVideoUrl: ext })).toBe(ext);
    expect(chooseRenderSource({ jobId: 'j', clientUrl: ext })).toBeNull();
  });
});
