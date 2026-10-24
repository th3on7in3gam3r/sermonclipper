import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectivePlan, isVesperAdmin } from './adminBypass';

const user = (email: string, firstName = 'Pat', status = 'verified') => ({
  firstName,
  emailAddresses: [{ emailAddress: email, verification: { status } }],
});

describe('isVesperAdmin', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('recognizes the owner id', () => {
    expect(isVesperAdmin('user_3DYwuXu2bJd40YjKuyIoEh0Mvm4', null)).toBe(true);
  });

  it('does NOT grant admin from user-chosen names or email substrings', () => {
    expect(isVesperAdmin('user_x', user('pat@example.com', 'Jerless'))).toBe(false);
    expect(isVesperAdmin('user_x', user('yahweh.fan@gmail.com'))).toBe(false);
    expect(isVesperAdmin('user_x', user('theonlinegamer123@gmail.com'))).toBe(false);
  });

  it('accepts exact ids from VESPER_ADMIN_IDS', () => {
    vi.stubEnv('VESPER_ADMIN_IDS', 'user_a, user_B');
    expect(isVesperAdmin('user_B', null)).toBe(true);
    expect(isVesperAdmin('user_b', null)).toBe(false); // ids are case-sensitive
    expect(isVesperAdmin('user_c', null)).toBe(false);
  });

  it('accepts only verified, exact emails from VESPER_ADMIN_EMAILS', () => {
    vi.stubEnv('VESPER_ADMIN_EMAILS', 'Owner@Example.com');
    expect(isVesperAdmin('user_x', user('owner@example.com'))).toBe(true);
    expect(isVesperAdmin('user_x', user('owner@example.com', 'Pat', 'unverified'))).toBe(false);
    expect(isVesperAdmin('user_x', user('owner@example.com.evil.io'))).toBe(false);
  });

  it('requires a user id', () => {
    vi.stubEnv('VESPER_ADMIN_EMAILS', 'owner@example.com');
    expect(isVesperAdmin('', user('owner@example.com'))).toBe(false);
  });
});

describe('effectivePlan', () => {
  it('gives admins church_pro and otherwise trusts only known paid plans', () => {
    expect(effectivePlan(undefined, 'user_3DYwuXu2bJd40YjKuyIoEh0Mvm4', null)).toBe('church_pro');
    expect(effectivePlan('creator', 'user_x', null)).toBe('creator');
    expect(effectivePlan('enterprise', 'user_x', null)).toBe('free');
  });
});
