import { createHmac } from 'crypto';
import connectDB from '@/lib/mongodb';
import { Webhook, WebhookDelivery } from '@/models/Webhook';

export async function dispatchWebhook(userId: string, event: string, data: Record<string, unknown>) {
  await connectDB();
  const hooks = await Webhook.find({ userId, active: true, events: event }).lean();
  if (hooks.length === 0) return;

  const payload = { event, timestamp: new Date().toISOString(), data };

  for (const hook of hooks) {
    const delivery = await WebhookDelivery.create({
      webhookId: String(hook._id),
      userId,
      event,
      payload,
      status: 'pending',
      attempts: 0,
    });

    await attemptDelivery(hook.url, hook.secret, payload, String(delivery._id), 0);
  }
}

async function attemptDelivery(
  url: string,
  secret: string,
  payload: Record<string, unknown>,
  deliveryId: string,
  attempt: number
) {
  const body = JSON.stringify(payload);
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  const signature = `sha256=${sig}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Vesper-Signature': signature },
      body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await WebhookDelivery.updateOne(
      { _id: deliveryId },
      { $set: { status: 'success', attempts: attempt + 1 } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Delivery failed';
    const next = attempt + 1;
    if (next >= 3) {
      await WebhookDelivery.updateOne(
        { _id: deliveryId },
        { $set: { status: 'failed', attempts: next, lastError: msg } }
      );
      return;
    }
    await WebhookDelivery.updateOne({ _id: deliveryId }, { $set: { attempts: next, lastError: msg } });
    setTimeout(() => attemptDelivery(url, secret, payload, deliveryId, next), Math.pow(2, next) * 1000);
  }
}
