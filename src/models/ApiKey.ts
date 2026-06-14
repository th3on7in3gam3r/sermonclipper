import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  userId: string;
  name: string;
  keyHash: string;
  prefix: string;
  last4: string;
  mode: 'live' | 'test';
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, required: true },
  last4: { type: String, required: true },
  mode: { type: String, enum: ['live', 'test'], default: 'live' },
  lastUsedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
