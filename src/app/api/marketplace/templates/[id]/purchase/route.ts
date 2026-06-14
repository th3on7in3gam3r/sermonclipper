import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import MarketplaceTemplate from '@/models/MarketplaceTemplate';
import TemplatePurchase from '@/models/TemplatePurchase';
import { getStripe } from '@/lib/stripe';
import { SITE_URL } from '@/lib/siteConfig';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  await connectDB();
  const template = await MarketplaceTemplate.findById(id).lean();
  if (!template || template.status !== 'approved') {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  if (template.priceCents === 0) {
    await TemplatePurchase.findOneAndUpdate(
      { userId, templateId: id },
      { $set: { priceCents: 0, purchasedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, unlocked: true });
  }

  const owned = await TemplatePurchase.findOne({ userId, templateId: id }).lean();
  if (owned) return NextResponse.json({ ok: true, unlocked: true });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: template.priceCents,
          product_data: { name: `Vesper template: ${template.name}` },
        },
        quantity: 1,
      },
    ],
    metadata: {
      clerkId: userId,
      templateId: id,
      type: 'marketplace_template',
    },
    success_url: `${SITE_URL}/dashboard?template_purchased=${id}`,
    cancel_url: `${SITE_URL}/dashboard`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
