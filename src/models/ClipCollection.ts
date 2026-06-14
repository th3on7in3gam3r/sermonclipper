import mongoose, { Schema, Document } from 'mongoose';

export interface IClipCollection extends Document {
  userId: string;
  name: string;
  description?: string;
  coverClipId?: string;
  clipIds: string[];
  isPublic: boolean;
  publicSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClipCollectionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  coverClipId: { type: String },
  clipIds: { type: [String], default: [] },
  isPublic: { type: Boolean, default: false },
  publicSlug: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ClipCollection ||
  mongoose.model<IClipCollection>('ClipCollection', ClipCollectionSchema);
