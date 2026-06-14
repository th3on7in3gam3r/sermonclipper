import mongoose, { Schema, Document } from 'mongoose';

export interface IBetaFeedback extends Document {
  userId: string;
  feature: string;
  worksWell?: string;
  confusing?: string;
  missing?: string;
  createdAt: Date;
}

const BetaFeedbackSchema = new Schema({
  userId: { type: String, required: true, index: true },
  feature: { type: String, required: true, index: true },
  worksWell: { type: String },
  confusing: { type: String },
  missing: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.BetaFeedback ||
  mongoose.model<IBetaFeedback>('BetaFeedback', BetaFeedbackSchema);
