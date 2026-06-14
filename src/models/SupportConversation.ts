import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  articleSlug?: string;
  createdAt: Date;
}

export interface ISupportConversation extends Document {
  userId: string;
  plan: string;
  priority: boolean;
  messages: ISupportMessage[];
  updatedAt: Date;
  createdAt: Date;
}

const SupportMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    text: { type: String, required: true },
    articleSlug: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SupportConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  plan: { type: String, default: 'free' },
  priority: { type: Boolean, default: false },
  messages: { type: [SupportMessageSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SupportConversation ||
  mongoose.model<ISupportConversation>('SupportConversation', SupportConversationSchema);
