import mongoose, { Schema, Document } from 'mongoose';

export type AnalyticsPlatform = 'youtube' | 'instagram' | 'tiktok';

export interface IClipMetric extends Document {
  userId: string;
  clipId: string;
  platform: AnalyticsPlatform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  saves: number;
  watchTimeSeconds: number;
  avgViewDurationSeconds: number;
  ctr: number;
  completionRate: number;
  capturedAt: Date;
}

const ClipMetricSchema = new Schema({
  userId: { type: String, required: true, index: true },
  clipId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['youtube', 'instagram', 'tiktok'], required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  watchTimeSeconds: { type: Number, default: 0 },
  avgViewDurationSeconds: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  capturedAt: { type: Date, default: Date.now, index: true },
});

ClipMetricSchema.index({ clipId: 1, platform: 1, capturedAt: -1 });
ClipMetricSchema.index({ userId: 1, capturedAt: -1 });

export default mongoose.models.ClipMetric || mongoose.model<IClipMetric>('ClipMetric', ClipMetricSchema);
