import connectDB from '@/lib/mongodb';
import MarketplaceTemplate, { type TemplateStyleConfig } from '@/models/MarketplaceTemplate';
import TemplatePurchase from '@/models/TemplatePurchase';
import { parseMarketplaceTemplateId } from '@/lib/marketplace/ids';

export { marketplaceTemplateId, parseMarketplaceTemplateId } from '@/lib/marketplace/ids';

export async function getMarketplaceStyleConfig(
  templateId: string,
  userId?: string
): Promise<TemplateStyleConfig | null> {
  const mpId = parseMarketplaceTemplateId(templateId);
  if (!mpId) return null;

  await connectDB();
  const row = await MarketplaceTemplate.findById(mpId).lean();
  if (!row || row.status !== 'approved') return null;

  if (row.priceCents > 0 && userId) {
    const owned = await TemplatePurchase.findOne({ userId, templateId: mpId }).lean();
    if (!owned) return null;
  }

  return row.styleConfig as TemplateStyleConfig;
}

export async function listPurchasedTemplateIds(userId: string) {
  await connectDB();
  const purchases = await TemplatePurchase.find({ userId }).lean();
  return purchases.map((p) => p.templateId);
}

export function applyStyleConfigToRender(
  style: TemplateStyleConfig,
  defaults: { captionColor: string; fontFamily: string; captionAnimation: string }
) {
  return {
    captionColor: style.captionColor || defaults.captionColor,
    fontFamily: style.fontFamily || defaults.fontFamily,
    captionAnimation: style.captionAnimation || defaults.captionAnimation,
    fontSize: style.fontSize || 80,
    textShadow: style.textShadow,
    overlayGradient: style.overlayGradient,
  };
}
