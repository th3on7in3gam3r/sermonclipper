import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'creator' | 'church_pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  usageCount: number;
  lastUsageReset: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  stripeCustomerId: { type: String, unique: true, sparse: true },
  stripeSubscriptionId: { type: String, unique: true, sparse: true },
  plan: { type: String, enum: ['free', 'creator', 'church_pro'], default: 'free' },
  status: { type: String, default: 'active' },
  usageCount: { type: Number, default: 0 },
  lastUsageReset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
