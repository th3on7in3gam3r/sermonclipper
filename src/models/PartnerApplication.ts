import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerApplication extends Document {
  name: string;
  agency: string;
  website?: string;
  churchesServed?: string;
  services?: string;
  status: 'pending' | 'approved' | 'rejected';
  affiliateCode?: string;
  createdAt: Date;
}

const PartnerApplicationSchema = new Schema({
  name: { type: String, required: true },
  agency: { type: String, required: true },
  website: { type: String },
  churchesServed: { type: String },
  services: { type: String },
  status: { type: String, default: 'pending' },
  affiliateCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PartnerApplication ||
  mongoose.model<IPartnerApplication>('PartnerApplication', PartnerApplicationSchema);
