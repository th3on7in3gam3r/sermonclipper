import webpush from 'web-push';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';

let configured = false;

function ensureVapid() {
  if (configured) return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@vesper.biblefunland.com';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  await connectDB();
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { $set: { userId, keys: subscription.keys, createdAt: new Date() } },
    { upsert: true }
  );
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!ensureVapid()) return { sent: 0, skipped: true };

  await connectDB();
  const subs = await PushSubscription.find({ userId }).lean();
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) {
        await PushSubscription.deleteOne({ endpoint: sub.endpoint });
      }
    }
  }

  return { sent };
}
