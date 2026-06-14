import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplatePurchase extends Document {
  userId: string;
  templateId: string;
  priceCents: number;
  stripeSessionId?: string;
  purchasedAt: Date;
}

const TemplatePurchaseSchema = new Schema({
  userId: { type: String, required: true, index: true },
  templateId: { type: String, required: true, index: true },
  priceCents: { type: Number, default: 0 },
  stripeSessionId: { type: String },
  purchasedAt: { type: Date, default: Date.now },
});

TemplatePurchaseSchema.index({ userId: 1, templateId: 1 }, { unique: true });

export default mongoose.models.TemplatePurchase ||
  mongoose.model<ITemplatePurchase>('TemplatePurchase', TemplatePurchaseSchema);
