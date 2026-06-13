import mongoose, { Schema, Document } from 'mongoose';

export interface INpsResponse extends Document {
  userId: string;
  score: number;
  feedback?: string;
  createdAt: Date;
}

const NpsSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  score: { type: Number, required: true, min: 0, max: 10 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.NpsResponse || mongoose.model<INpsResponse>('NpsResponse', NpsSchema);
