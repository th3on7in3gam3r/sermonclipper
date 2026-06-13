import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpFeedback extends Document {
  slug: string;
  helpful: boolean;
  userId?: string;
  createdAt: Date;
}

const HelpFeedbackSchema = new Schema({
  slug: { type: String, required: true, index: true },
  helpful: { type: Boolean, required: true },
  userId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.HelpFeedback ||
  mongoose.model<IHelpFeedback>('HelpFeedback', HelpFeedbackSchema);
