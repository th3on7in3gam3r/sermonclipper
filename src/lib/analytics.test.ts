import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const posthog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
};

vi.mock('posthog-js', () => ({ default: posthog }));

let consent = true;
vi.mock('@/lib/consent', () => ({ hasAnalyticsConsent: () => consent }));

async function freshModule() {
  vi.resetModules();
  return import('./analytics');
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('analytics (lazy PostHog)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test');
    consent = true;
    posthog.init.mockClear();
    posthog.capture.mockClear();
    posthog.identify.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does not load PostHog without consent', async () => {
    consent = false;
    const a = await freshModule();
    a.captureEvent('page_viewed');
    await flush();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('does not load PostHog without a key', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
    const a = await freshModule();
    a.captureEvent('page_viewed');
    await flush();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it('queues calls made before load and replays them in order', async () => {
    const a = await freshModule();
    a.identifyUser('user_1');
    a.captureEvent('page_viewed', { page: 'landing' });
    expect(posthog.capture).not.toHaveBeenCalled();
    await flush();
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.identify).toHaveBeenCalledWith('user_1', undefined);
    expect(posthog.capture).toHaveBeenCalledWith('page_viewed', { page: 'landing' });
    expect(posthog.identify.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.capture.mock.invocationCallOrder[0]
    );
  });

  it('initializes only once across many calls', async () => {
    const a = await freshModule();
    a.initAnalytics();
    a.initAnalytics();
    a.captureEvent('one');
    await flush();
    a.captureEvent('two');
    expect(posthog.init).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledTimes(2);
  });
});
