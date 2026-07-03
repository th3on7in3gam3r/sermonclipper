export type PaidPlanId = 'creator' | 'church_pro';

export const PAID_PLAN_IDS: PaidPlanId[] = ['creator', 'church_pro'];

/** Expected Stripe recurring price in cents — used to catch misconfigured price IDs. */
export const PLAN_AMOUNT_CENTS: Record<PaidPlanId, number> = {
  creator: 1900,
  church_pro: 4900,
};

export const PLAN_LABELS: Record<PaidPlanId, string> = {
  creator: 'Creator',
  church_pro: 'Church Pro',
};

function readPriceId(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Resolve Stripe price ID from plan on the server (never trust client-sent price IDs). */
export function getStripePriceIdForPlan(plan: string): string | null {
  if (plan === 'creator') {
    return readPriceId('STRIPE_PRICE_ID_CREATOR', 'NEXT_PUBLIC_STRIPE_PRICE_ID_CREATOR') ?? null;
  }
  if (plan === 'church_pro') {
    return readPriceId('STRIPE_PRICE_ID_CHURCH_PRO', 'NEXT_PUBLIC_STRIPE_PRICE_ID_CHURCH_PRO') ?? null;
  }
  return null;
}

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return PAID_PLAN_IDS.includes(plan as PaidPlanId);
}
