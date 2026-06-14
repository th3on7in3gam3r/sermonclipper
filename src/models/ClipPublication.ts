import mongoose, { Schema, Document } from 'mongoose';
import type { AnalyticsPlatform } from '@/models/ClipMetric';

export interface IClipPublication extends Document {
  userId: string;
  clipId: string;
  platform: AnalyticsPlatform;
  externalId: string;
  postUrl?: string;
  publishedAt: Date;
}

const ClipPublicationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  clipId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['youtube', 'instagram', 'tiktok'], required: true },
  externalId: { type: String, required: true },
  postUrl: { type: String },
  publishedAt: { type: Date, default: Date.now },
});

ClipPublicationSchema.index({ userId: 1, clipId: 1, platform: 1 });

export default mongoose.models.ClipPublication ||
  mongoose.model<IClipPublication>('ClipPublication', ClipPublicationSchema);
