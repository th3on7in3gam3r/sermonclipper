import { beforeEach, describe, expect, it, vi } from 'vitest';

const getInternalFetchUrl = vi.fn(async (key: string, ttl: number) => `https://signed.example/${key}?ttl=${ttl}`);
vi.mock('./cdn', () => ({ getInternalFetchUrl: (key: string, ttl: number) => getInternalFetchUrl(key, ttl) }));

import { resolveShotstackVideoUrl } from './shotstackVideoUrl';

describe('resolveShotstackVideoUrl', () => {
  beforeEach(() => getInternalFetchUrl.mockClear());

  it('re-signs an old, possibly expired signed R2 link from its key', async () => {
    const stale =
      'https://acct.r2.cloudflarestorage.com/sermon-clipper/uploads/job1/abc.mp4?X-Amz-Signature=old&X-Amz-Expires=3600';
    await expect(resolveShotstackVideoUrl(stale)).resolves.toBe('https://signed.example/uploads/job1/abc.mp4?ttl=7200');
  });

  it('re-signs CDN links and app-relative /api/media links', async () => {
    await resolveShotstackVideoUrl('https://cdn.example/uploads/job1/abc.mp4?token=t&expires=1');
    await resolveShotstackVideoUrl('/api/media?key=sermons%2Fjob1.mp4&exp=1&sig=s');
    expect(getInternalFetchUrl.mock.calls.map((c) => c[0])).toEqual(['uploads/job1/abc.mp4', 'sermons/job1.mp4']);
  });

  it('passes public external HTTPS videos through', async () => {
    await expect(resolveShotstackVideoUrl('https://media.church.example/sunday.mp4')).resolves.toBe(
      'https://media.church.example/sunday.mp4'
    );
    expect(getInternalFetchUrl).not.toHaveBeenCalled();
  });

  it('refuses links the render service could never download', async () => {
    await expect(resolveShotstackVideoUrl('/videos/sunday.mp4')).rejects.toThrow(/public web address/);
    await expect(resolveShotstackVideoUrl('http://insecure.example/a.mp4')).rejects.toThrow(/public web address/);
  });
});
