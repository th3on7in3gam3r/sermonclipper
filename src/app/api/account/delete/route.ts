import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Sermon from '@/models/Sermon';
import Notification from '@/models/Notification';
import NpsResponse from '@/models/NpsResponse';
import { Webhook, WebhookDelivery } from '@/models/Webhook';
import JobProgress from '@/models/JobProgress';
import { stripe } from '@/lib/stripe';
import { deleteObjectFromR2 } from '@/lib/r2';
import { extractR2Key, isR2StorageUrl } from '@/lib/videoSource';
import { clerkClient } from '@clerk/nextjs/server';

async function deleteStorageUrl(url: string) {
  if (!url || !isR2StorageUrl(url)) return;
  try {
    await deleteObjectFromR2(extractR2Key(url));
  } catch {
    /* best effort */
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !clerkUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { confirm } = await req.json();
  if (confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const sermons = await Sermon.find({ userId }).lean();
  for (const s of sermons) {
    await deleteStorageUrl(s.videoUrl);
    await deleteStorageUrl(s.finalPath || '');
  }

  const jobs = await JobProgress.find({ userId }).lean();
  for (const j of jobs) {
    await deleteStorageUrl(j.finalPath || '');
  }

  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (e) {
      console.error('[Account Delete] Stripe cancel failed:', e);
    }
  }

  const userEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress;

  await Promise.all([
    Sermon.deleteMany({ userId }),
    JobProgress.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    NpsResponse.deleteMany({ userId }),
    Webhook.deleteMany({ userId }),
    WebhookDelivery.deleteMany({ userId }),
    User.deleteOne({ clerkId: userId }),
  ]);

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (e) {
    console.error('[Account Delete] Clerk delete failed:', e);
  }

  if (userEmail) {
    try {
      const { sendAccountDeletedEmail } = await import('@/lib/email');
      await sendAccountDeletedEmail(userEmail);
    } catch (e) {
      console.error('[Account Delete] Confirmation email failed:', e);
    }
  }

  return NextResponse.json({ success: true, message: 'Account deleted' });
}
