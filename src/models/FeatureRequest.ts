import mongoose, { Schema, Document } from 'mongoose';

export type FeatureRequestStatus =
  | 'Under Review'
  | 'Planned'
  | 'In Progress'
  | 'Shipped'
  | "Won't Build";

export interface IFeatureRequest extends Document {
  title: string;
  description?: string;
  category: string;
  votes: number;
  voterIds: string[];
  status: FeatureRequestStatus;
  createdAt: Date;
}

const FeatureRequestSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'Other' },
  votes: { type: Number, default: 1 },
  voterIds: { type: [String], default: [] },
  status: { type: String, default: 'Under Review' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FeatureRequest ||
  mongoose.model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema);
