import mongoose, { Schema, Document } from 'mongoose';

export type MarketplaceTemplateStatus = 'pending' | 'approved' | 'rejected';

export type TemplateStyleConfig = {
  captionColor: string;
  fontFamily: string;
  fontSize?: number;
  captionAnimation?: string;
  textShadow?: string;
  overlayGradient?: string;
  animationCss?: string;
};

export interface IMarketplaceTemplate extends Document {
  designerUserId: string;
  designerName?: string;
  name: string;
  description?: string;
  previewVideoUrl?: string;
  styleConfig: TemplateStyleConfig;
  priceCents: number;
  status: MarketplaceTemplateStatus;
  featured: boolean;
  isNew: boolean;
  purchaseCount: number;
  stripeProductId?: string;
  createdAt: Date;
  approvedAt?: Date;
}

const MarketplaceTemplateSchema = new Schema({
  designerUserId: { type: String, required: true, index: true },
  designerName: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  previewVideoUrl: { type: String },
  styleConfig: { type: Schema.Types.Mixed, required: true },
  priceCents: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  featured: { type: Boolean, default: false },
  isNew: { type: Boolean, default: true },
  purchaseCount: { type: Number, default: 0 },
  stripeProductId: { type: String },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
});

export default mongoose.models.MarketplaceTemplate ||
  mongoose.model<IMarketplaceTemplate>('MarketplaceTemplate', MarketplaceTemplateSchema);
