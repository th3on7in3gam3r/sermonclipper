import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhook extends Document {
  userId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
}

export interface IWebhookDelivery extends Document {
  webhookId: string;
  userId: string;
  event: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastError?: string;
  createdAt: Date;
}

const WebhookSchema = new Schema({
  userId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: { type: [String], default: ['clip.created'] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const WebhookDeliverySchema = new Schema({
  webhookId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  event: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastError: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Webhook = mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', WebhookSchema);
export const WebhookDelivery =
  mongoose.models.WebhookDelivery ||
  mongoose.model<IWebhookDelivery>('WebhookDelivery', WebhookDeliverySchema);
