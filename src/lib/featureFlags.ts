import connectDB from '@/lib/mongodb';
import FeatureFlag from '@/models/FeatureFlag';
import { isInRollout } from '@/lib/hash';

export type FlagRecord = {
  flagName: string;
  enabled: boolean;
  rolloutPercentage: number;
};

export async function getAllFlags(): Promise<FlagRecord[]> {
  await connectDB();
  const flags = await FeatureFlag.find().lean();
  return flags.map((f) => ({
    flagName: f.flagName,
    enabled: f.enabled,
    rolloutPercentage: f.rolloutPercentage,
  }));
}

export async function getEnabledFlagsForUser(userId: string): Promise<Record<string, boolean>> {
  const flags = await getAllFlags();
  const result: Record<string, boolean> = {};
  for (const flag of flags) {
    result[flag.flagName] = flag.enabled && isInRollout(userId, flag.flagName, flag.rolloutPercentage);
  }
  return result;
}

export function isFlagEnabled(flags: Record<string, boolean>, flagName: string): boolean {
  return flags[flagName] === true;
}
