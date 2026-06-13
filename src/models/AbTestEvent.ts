import mongoose, { Schema, Document } from 'mongoose';

export type AbTestEventType = 'impression' | 'click' | 'signup';

export interface IAbTestEvent extends Document {
  testName: string;
  variant: 'A' | 'B' | 'C';
  eventType: AbTestEventType;
  anonymousId?: string;
  userId?: string;
  createdAt: Date;
}

const AbTestEventSchema = new Schema({
  testName: { type: String, required: true, index: true },
  variant: { type: String, enum: ['A', 'B', 'C'], required: true },
  eventType: { type: String, enum: ['impression', 'click', 'signup'], required: true },
  anonymousId: { type: String, index: true },
  userId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.AbTestEvent || mongoose.model<IAbTestEvent>('AbTestEvent', AbTestEventSchema);
