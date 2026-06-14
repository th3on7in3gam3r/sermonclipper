import Stripe from 'stripe';
import { logSecretAccess } from '@/lib/secrets/accessLog';

export function constructStripeEvent(body: string, signature: string): Stripe.Event {
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_PREVIOUS,
  ].filter(Boolean) as string[];

  if (secrets.length === 0) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  void logSecretAccess({ secretId: 'stripe_webhook', service: 'webhooks/stripe' });

  let lastError: unknown;
  for (const secret of secrets) {
    try {
      return Stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Webhook signature verification failed');
}
