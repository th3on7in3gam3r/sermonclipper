import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { sendPushToUser } from '@/lib/push';

export async function createNotification(input: {
  userId: string;
  type: string;
  message: string;
  link?: string;
  pushTitle?: string;
}) {
  await connectDB();
  const row = await Notification.create(input);

  void sendPushToUser(input.userId, {
    title: input.pushTitle || 'Vesper Studio',
    body: input.message,
    url: input.link || '/dashboard',
    tag: input.type,
  }).catch(() => {});

  return row;
}
