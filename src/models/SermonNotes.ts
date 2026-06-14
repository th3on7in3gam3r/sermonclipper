import mongoose, { Schema, type Document } from 'mongoose';

export interface ISermonNotes extends Document {
  jobId: string;
  userId: string;
  slug: string;
  published: boolean;
  title: string;
  scriptureReferences: string[];
  keyPoints: string[];
  quotes: { text: string; timestampSeconds?: number }[];
  reflectionQuestions: string[];
  transcript: string;
  updatedAt: Date;
  createdAt: Date;
}

const SermonNotesSchema = new Schema<ISermonNotes>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    published: { type: Boolean, default: false },
    title: { type: String, required: true },
    scriptureReferences: { type: [String], default: [] },
    keyPoints: { type: [String], default: [] },
    quotes: { type: Schema.Types.Mixed, default: [] },
    reflectionQuestions: { type: [String], default: [] },
    transcript: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.SermonNotes || mongoose.model<ISermonNotes>('SermonNotes', SermonNotesSchema);
