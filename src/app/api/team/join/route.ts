import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Team, { type ITeamInvite } from '@/models/Team';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  await connectDB();
  const team = await Team.findOne({ 'pendingInvites.token': token });
  if (!team) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  const invite = team.pendingInvites.find((i: ITeamInvite) => i.token === token);
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  return NextResponse.json({
    teamName: team.name,
    role: invite.role,
    email: invite.email,
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  if (!userId || !clerkUser) return NextResponse.json({ error: 'Sign in to accept invite' }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  await connectDB();
  const team = await Team.findOne({ 'pendingInvites.token': token });
  if (!team) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

  const inviteIdx = team.pendingInvites.findIndex((i: ITeamInvite) => i.token === token);
  const invite = team.pendingInvites[inviteIdx];
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
  }

  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (userEmail?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address.' },
      { status: 403 }
    );
  }

  if (team.members.length >= team.seatLimit) {
    return NextResponse.json({ error: 'Team is full.' }, { status: 403 });
  }

  team.members.push({
    userId,
    email: invite.email,
    name: clerkUser.fullName || clerkUser.firstName,
    role: invite.role,
  });
  team.pendingInvites.splice(inviteIdx, 1);
  await team.save();

  return NextResponse.json({ ok: true, teamName: team.name });
}
