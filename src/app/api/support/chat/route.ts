import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import SupportConversation from '@/models/SupportConversation';
import {
  buildBugReportTemplate,
  detectClientContext,
  isPrioritySupportPlan,
  isSupportOnline,
  matchHelpArticles,
  supportResponseExpectation,
} from '@/lib/support/chatHelpers';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const body = await req.json();
  const { message, mode } = body as { message?: string; mode?: 'bug' | 'chat' };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  await connectDB();
  const dbUser = userId ? await User.findOne({ clerkId: userId }).lean() : null;
  const plan = dbUser?.plan || 'free';
  const priority = isPrioritySupportPlan(plan);
  const online = isSupportOnline();

  const articles = mode === 'bug' ? [] : matchHelpArticles(message);
  const assistantReply =
    articles.length > 0
      ? `I found this article — does it help? **${articles[0].title}** (/help/${articles[0].slug})`
      : online
        ? priority
          ? 'Thanks — your message is in the **Priority Support** queue. A teammate will reply shortly.'
          : 'Thanks! A support teammate will follow up soon.'
        : "We're offline — leave a message and we'll reply within 4 hours.";

  if (userId) {
    await SupportConversation.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { createdAt: new Date(), plan, priority },
        $set: { plan, priority, updatedAt: new Date() },
        $push: {
          messages: {
            $each: [
              { role: 'user', text: message, createdAt: new Date() },
              {
                role: 'assistant',
                text: assistantReply,
                articleSlug: articles[0]?.slug,
                createdAt: new Date(),
              },
            ],
          },
        },
      },
      { upsert: true }
    );
  }

  return NextResponse.json({
    reply: assistantReply,
    articles: articles.map((a) => ({ title: a.title, slug: a.slug, href: `/help/${a.slug}` })),
    online,
    responseExpectation: supportResponseExpectation(plan),
    priority,
    user: {
      name: clerkUser?.fullName || dbUser?.whiteLabel?.churchName,
      email: clerkUser?.primaryEmailAddress?.emailAddress || dbUser?.email,
      plan,
    },
  });
}

export async function GET() {
  const { userId } = await auth();
  let plan = 'free';
  if (userId) {
    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId }).lean();
    plan = dbUser?.plan || 'free';
  }
  const ctx = detectClientContext();

  return NextResponse.json({
    online: isSupportOnline(),
    responseExpectation: supportResponseExpectation(plan),
    priority: isPrioritySupportPlan(plan),
    bugTemplate: buildBugReportTemplate(ctx),
    tawkPropertyId: process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || null,
  });
}
