import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import MarketplaceTemplate from '@/models/MarketplaceTemplate';
import TemplatePurchase from '@/models/TemplatePurchase';
import { marketplaceTemplateId } from '@/lib/marketplace/templateEngine';

export async function GET() {
  const { userId } = await auth();
  await connectDB();

  const templates = await MarketplaceTemplate.find({ status: 'approved' })
    .sort({ featured: -1, isNew: -1, createdAt: -1 })
    .lean();

  let purchased = new Set<string>();
  if (userId) {
    const rows = await TemplatePurchase.find({ userId }).lean();
    purchased = new Set(rows.map((r) => r.templateId));
  }

  return NextResponse.json({
    templates: templates.map((t) => ({
      id: marketplaceTemplateId(String(t._id)),
      mongoId: String(t._id),
      name: t.name,
      description: t.description,
      previewVideoUrl: t.previewVideoUrl,
      priceCents: t.priceCents,
      featured: t.featured,
      isNew: t.isNew,
      designerName: t.designerName,
      owned: purchased.has(String(t._id)) || t.priceCents === 0,
      free: t.priceCents === 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, previewVideoUrl, styleConfig, priceCents = 0 } = body;

  if (!name || !styleConfig?.captionColor) {
    return NextResponse.json({ error: 'Name and style config required' }, { status: 400 });
  }

  const price = Math.min(Math.max(Number(priceCents) || 0, 0), 900);

  await connectDB();
  const row = await MarketplaceTemplate.create({
    designerUserId: userId,
    name,
    description,
    previewVideoUrl,
    styleConfig,
    priceCents: price,
    status: 'pending',
  });

  return NextResponse.json({ ok: true, id: String(row._id), status: 'pending' });
}
