import mongoose, { Schema, Document } from 'mongoose';

export interface IModerationLog extends Document {
  userId: string;
  jobId?: string;
  outcome: 'pass' | 'flag' | 'block';
  reasons: string[];
  status: 'pending_review' | 'cleared' | 'blocked' | 'approved';
  automated: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const ModerationLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  jobId: { type: String, index: true },
  outcome: { type: String, enum: ['pass', 'flag', 'block'], required: true },
  reasons: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['pending_review', 'cleared', 'blocked', 'approved'],
    default: 'pending_review',
  },
  automated: { type: Boolean, default: true },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ModerationLog ||
  mongoose.model<IModerationLog>('ModerationLog', ModerationLogSchema);
