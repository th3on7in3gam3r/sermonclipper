import 'server-only';
import Team from '@/models/Team';

/** The user plus everyone on their team (owner and members). Caller must have connected to the DB. */
export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const team = (await Team.findOne({ ownerId: userId })) || (await Team.findOne({ 'members.userId': userId }));
  if (!team) return [userId];
  const ids = new Set<string>([team.ownerId]);
  for (const m of team.members) {
    if (m.userId) ids.add(m.userId);
  }
  return [...ids];
}
