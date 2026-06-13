import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { stripe } from '@/lib/stripe';
import { SITE_URL } from '@/lib/siteConfig';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account yet. Subscribe to a plan first.' },
      { status: 400 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${SITE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const planPrices: Record<string, { label: string; price: string; amount: number }> = {
    free: { label: 'Free', price: '$0/mo', amount: 0 },
    creator: { label: 'Creator', price: '$19/mo', amount: 1900 },
    church_pro: { label: 'Church Pro', price: '$49/mo', amount: 4900 },
  };

  const planInfo = planPrices[dbUser.plan] || planPrices.free;
  let nextBillingDate: string | null = null;
  let paymentMethod: { last4?: string; exp?: string } | null = null;
  const invoices: { id: string; date: string; amount: string; pdfUrl?: string }[] = [];

  if (dbUser.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: dbUser.stripeCustomerId,
        status: 'all',
        limit: 1,
      });
      const sub = subscriptions.data[0];
      const periodEnd = sub ? (sub as { current_period_end?: number }).current_period_end : undefined;
      if (periodEnd) {
        nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }

      const customer = await stripe.customers.retrieve(dbUser.stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method'],
      });
      if (!customer.deleted) {
        const pm = customer.invoice_settings?.default_payment_method;
        if (pm && typeof pm === 'object' && pm.object === 'payment_method' && pm.card) {
          paymentMethod = {
            last4: pm.card.last4,
            exp: `${pm.card.exp_month}/${String(pm.card.exp_year).slice(-2)}`,
          };
        }
      }

      const invoiceList = await stripe.invoices.list({ customer: dbUser.stripeCustomerId, limit: 12 });
      for (const inv of invoiceList.data) {
        invoices.push({
          id: inv.id,
          date: inv.created
            ? new Date(inv.created * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—',
          amount: `$${((inv.amount_paid || 0) / 100).toFixed(2)}`,
          pdfUrl: inv.invoice_pdf || undefined,
        });
      }
    } catch (err) {
      console.error('[Billing summary]', err);
    }
  }

  return NextResponse.json({
    plan: dbUser.plan,
    planLabel: planInfo.label,
    planPrice: planInfo.price,
    status: dbUser.status,
    nextBillingDate,
    paymentMethod,
    invoices,
    email: clerkUser?.emailAddresses?.[0]?.emailAddress,
    cancelAtPeriodEnd: dbUser.status === 'canceled',
  });
}
