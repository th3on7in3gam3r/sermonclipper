import toast from 'react-hot-toast';
import { navigateTo } from '@/lib/navigate';

type OpenBillingPortalOptions = {
  /** Deep-link Stripe portal to the subscription cancellation flow. */
  cancel?: boolean;
};

export async function openBillingPortal(options: OpenBillingPortalOptions = {}): Promise<boolean> {
  try {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel: options.cancel === true }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

    if (!res.ok) {
      toast.error(data.error || 'Could not open billing portal. Please try again.');
      return false;
    }

    if (!data.url) {
      toast.error('Billing portal link unavailable. Please contact support.');
      return false;
    }

    navigateTo(data.url);
    return true;
  } catch {
    toast.error('Network error opening billing portal.');
    return false;
  }
}
