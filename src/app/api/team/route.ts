import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Team, { type ITeamInvite } from '@/models/Team';
import User from '@/models/User';
import { sendTeamInviteEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/siteConfig';

async function getOrCreateTeam(ownerId: string, ownerEmail: string, ownerName: string) {
  let team = await Team.findOne({ ownerId });
  if (!team) {
    team = await Team.create({
      ownerId,
      name: `${ownerName}'s Team`,
      members: [{ userId: ownerId, email: ownerEmail, name: ownerName, role: 'owner' }],
    });
  }
  return team;
}

export async function GET() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (dbUser?.plan !== 'church_pro') {
    return NextResponse.json({ error: 'Team access requires Church Pro.' }, { status: 403 });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const name = clerkUser.fullName || clerkUser.firstName || 'Owner';
  const team = await getOrCreateTeam(userId, email, name);

  return NextResponse.json({
    name: team.name,
    seatLimit: team.seatLimit,
    memberCount: team.members.length,
    members: team.members,
    pendingInvites: team.pendingInvites.map((i: ITeamInvite) => ({
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
    })),
    isOwner: team.ownerId === userId,
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, role = 'editor' } = await req.json();
  if (!email || !['editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid invite' }, { status: 400 });
  }

  await connectDB();
  const dbUser = await User.findOne({ clerkId: userId });
  if (dbUser?.plan !== 'church_pro') {
    return NextResponse.json({ error: 'Team access requires Church Pro.' }, { status: 403 });
  }

  const ownerEmail = clerkUser.emailAddresses[0]?.emailAddress || '';
  const ownerName = clerkUser.fullName || clerkUser.firstName || 'Team owner';
  const team = await getOrCreateTeam(userId, ownerEmail, ownerName);

  if (team.ownerId !== userId) {
    return NextResponse.json({ error: 'Only the owner can invite members.' }, { status: 403 });
  }

  if (team.members.length >= team.seatLimit) {
    return NextResponse.json({ error: 'Seat limit reached. Remove a member or upgrade.' }, { status: 403 });
  }

  team.pendingInvites.push({ email, role });
  await team.save();

  const invite = team.pendingInvites[team.pendingInvites.length - 1];
  const inviteUrl = `${SITE_URL}/dashboard/team/join?token=${invite.token}`;

  const inviterDb = await User.findOne({ clerkId: userId });
  await sendTeamInviteEmail(
    email,
    {
      inviterName: ownerName,
      teamName: team.name,
      inviteUrl,
      role: role === 'editor' ? 'Editor' : 'Viewer',
    },
    inviterDb?.emailUnsubscribeToken
  );

  try {
    const { markChecklist } = await import('@/lib/checklist');
    await markChecklist(userId, 'invitedTeamMember');
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ ok: true, inviteUrl });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberEmail = req.nextUrl.searchParams.get('email');
  if (!memberEmail) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  await connectDB();
  const team = await Team.findOne({ ownerId: userId });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  team.members = team.members.filter(
    (m: { email: string; role: string }) => m.email !== memberEmail || m.role === 'owner'
  );
  await team.save();

  return NextResponse.json({ ok: true });
}
