/** Deterministic 0–99 bucket for consistent feature rollouts and A/B assignment. */
export function deterministicBucket(input: string, mod = 100): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % mod;
}

export function isInRollout(userId: string, flagName: string, rolloutPercentage: number): boolean {
  if (rolloutPercentage >= 100) return true;
  if (rolloutPercentage <= 0) return false;
  return deterministicBucket(`${flagName}:${userId}`) < rolloutPercentage;
}

export type HeroCtaVariant = 'A' | 'B' | 'C';

const HERO_CTA_LABELS: Record<HeroCtaVariant, string> = {
  A: 'Get Started',
  B: 'Create Your First Reel Free',
  C: 'Try Vesper Free — No Credit Card',
};

export function getHeroCtaVariant(anonymousId: string): HeroCtaVariant {
  const bucket = deterministicBucket(`hero-cta:${anonymousId}`, 3);
  return bucket === 0 ? 'A' : bucket === 1 ? 'B' : 'C';
}

export function getHeroCtaLabel(variant: HeroCtaVariant): string {
  return HERO_CTA_LABELS[variant];
}
