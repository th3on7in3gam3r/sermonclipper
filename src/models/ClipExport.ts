import mongoose, { Schema, Document } from 'mongoose';

export interface IClipExport extends Document {
  userId: string;
  clipId: string;
  renderUrl: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

const ClipExportSchema = new Schema({
  userId: { type: String, required: true, index: true },
  clipId: { type: String, required: true, index: true },
  renderUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ClipExportSchema.index({ userId: 1, clipId: 1 }, { unique: true });

export default mongoose.models.ClipExport || mongoose.model<IClipExport>('ClipExport', ClipExportSchema);
