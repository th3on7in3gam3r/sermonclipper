import type Stripe from 'stripe';

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

const PLAN_ENV_KEYS: Record<PaidPlanId, string[]> = {
  creator: ['STRIPE_PRICE_ID_CREATOR', 'NEXT_PUBLIC_STRIPE_PRICE_ID_CREATOR'],
  church_pro: ['STRIPE_PRICE_ID_CHURCH_PRO', 'NEXT_PUBLIC_STRIPE_PRICE_ID_CHURCH_PRO'],
};

function formatUsd(cents: number | null | undefined): string {
  if (cents == null) return 'unknown amount';
  return `$${(cents / 100).toFixed(2)}/mo`;
}

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return PAID_PLAN_IDS.includes(plan as PaidPlanId);
}

export type ResolvedStripePrice =
  | { ok: true; priceId: string; envKey: string }
  | { ok: false; error: string };

/** Pick the first env price ID whose Stripe amount matches the plan. */
export async function resolveStripePriceForPlan(
  plan: PaidPlanId,
  stripe: Stripe
): Promise<ResolvedStripePrice> {
  const expected = PLAN_AMOUNT_CENTS[plan];
  const mismatches: string[] = [];

  for (const envKey of PLAN_ENV_KEYS[plan]) {
    const priceId = process.env[envKey]?.trim();
    if (!priceId) continue;

    try {
      const stripePrice = await stripe.prices.retrieve(priceId);
      if (stripePrice.unit_amount === expected) {
        return { ok: true, priceId, envKey };
      }
      mismatches.push(
        `${envKey} → ${formatUsd(stripePrice.unit_amount)} (expected ${formatUsd(expected)})`
      );
    } catch {
      mismatches.push(`${envKey} → invalid price ID`);
    }
  }

  if (mismatches.length === 0) {
    return {
      ok: false,
      error: `${PLAN_LABELS[plan]} billing is not configured. Add ${PLAN_ENV_KEYS[plan].join(' or ')} in Vercel.`,
    };
  }

  return {
    ok: false,
    error: `${PLAN_LABELS[plan]} price is misconfigured in Vercel: ${mismatches.join('; ')}. In Stripe, copy the ${formatUsd(expected)} price ID into ${PLAN_ENV_KEYS[plan].at(-1)}.`,
  };
}
