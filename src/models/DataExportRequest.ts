import mongoose, { Schema, Document } from 'mongoose';

export type DataExportStatus = 'queued' | 'processing' | 'complete' | 'failed';

export interface IDataExportRequest extends Document {
  userId: string;
  jobId: string;
  status: DataExportStatus;
  downloadUrl?: string;
  expiresAt?: Date;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
}

const DataExportRequestSchema = new Schema({
  userId: { type: String, required: true, index: true },
  jobId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['queued', 'processing', 'complete', 'failed'],
    default: 'queued',
  },
  downloadUrl: { type: String },
  expiresAt: { type: Date },
  errorMessage: { type: String },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

export default mongoose.models.DataExportRequest ||
  mongoose.model<IDataExportRequest>('DataExportRequest', DataExportRequestSchema);
