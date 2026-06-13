import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function createNotification(input: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) {
  await connectDB();
  return Notification.create(input);
}
