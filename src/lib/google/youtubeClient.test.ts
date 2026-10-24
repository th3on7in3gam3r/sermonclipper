import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createOAuthClient } from './youtubeClient';

describe('createOAuthClient', () => {
  it('returns an independent client per call so credentials never leak between users', () => {
    const a = createOAuthClient({ access_token: 'token-user-a' });
    const b = createOAuthClient({ access_token: 'token-user-b' });

    expect(a).not.toBe(b);
    expect(a.credentials.access_token).toBe('token-user-a');
    expect(b.credentials.access_token).toBe('token-user-b');
  });

  it('starts with no credentials when none are given', () => {
    expect(createOAuthClient().credentials).toEqual({});
  });
});
