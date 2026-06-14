import mongoose, { Schema, Document } from 'mongoose';
import { MILESTONE_TYPES, type MilestoneType } from '@/lib/gamification/labels';

export type { MilestoneType };

export interface IUserMilestone extends Document {
  userId: string;
  milestoneType: MilestoneType;
  achievedAt: Date;
}

const UserMilestoneSchema = new Schema({
  userId: { type: String, required: true, index: true },
  milestoneType: { type: String, enum: MILESTONE_TYPES, required: true },
  achievedAt: { type: Date, default: Date.now },
});

UserMilestoneSchema.index({ userId: 1, milestoneType: 1 }, { unique: true });

export default mongoose.models.UserMilestone ||
  mongoose.model<IUserMilestone>('UserMilestone', UserMilestoneSchema);
