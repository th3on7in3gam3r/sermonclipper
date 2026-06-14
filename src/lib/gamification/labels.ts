export const MILESTONE_TYPES = [
  'first_clip',
  'first_export',
  'clips_10',
  'first_social_post',
  'first_team_member',
  'clips_100',
  'one_year',
] as const;

export type MilestoneType = (typeof MILESTONE_TYPES)[number];

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  first_clip: 'First Clip Created 🎬',
  first_export: 'First Export 📤',
  clips_10: '10 Clips Created 🎯',
  first_social_post: 'First Social Post 📱',
  first_team_member: 'First Team Member Added 👥',
  clips_100: '100 Clips Created 💯',
  one_year: '1 Year on Vesper 🏆',
};
