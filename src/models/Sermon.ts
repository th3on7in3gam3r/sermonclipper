import mongoose, { Schema, Document } from 'mongoose';

export interface ISermon extends Document {
  userId: string;
  jobId: string;
  title: string;
  mainTheme: string;
  videoUrl: string;
  finalPath?: string;
  analysis: Record<string, unknown>;
  createdAt: Date;
}

const SermonSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  jobId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  mainTheme: { type: String },
  videoUrl: { type: String, required: true },
  finalPath: { type: String },
  analysis: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sermon || mongoose.model<ISermon>('Sermon', SermonSchema);
