import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export type ChecklistKey =
  | 'uploadedSermon'
  | 'createdClip'
  | 'customizedCaption'
  | 'exportedReel'
  | 'connectedSocial'
  | 'invitedTeamMember';

export async function markChecklist(userId: string, key: ChecklistKey) {
  if (!userId) return;
  await connectDB();
  await User.updateOne({ clerkId: userId }, { $set: { [`checklist.${key}`]: true } });
}
