import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureFlag extends Document {
  flagName: string;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: Date;
}

const FeatureFlagSchema = new Schema({
  flagName: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  rolloutPercentage: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
