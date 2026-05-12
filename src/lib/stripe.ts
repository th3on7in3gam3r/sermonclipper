import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazily initialise the Stripe client so the module can be imported at
 * build-time without requiring STRIPE_SECRET_KEY in the environment.
 * The key is only required when an API route actually calls getStripe().
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
  }

  _stripe = new Stripe(key, {
    apiVersion: '2025-01-27.acacia' as any,
    appInfo: {
      name: 'Vesper Studio',
      version: '1.0.0',
    },
  });

  return _stripe;
}

/** @deprecated use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});
