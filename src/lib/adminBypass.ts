type ClerkLikeUser = {
  emailAddresses?: { emailAddress: string }[];
  firstName?: string | null;
} | null;

/** Matches /api/user/status admin bypass — keeps export in sync with dashboard plan display. */
export function isVesperAdmin(userId: string, clerkUser: ClerkLikeUser): boolean {
  if (!clerkUser) return false;
  return (
    userId === 'user_3DYwuXu2bJd40YjKuyIoEh0Mvm4' ||
    clerkUser.emailAddresses?.some((e) => e.emailAddress.includes('yahweh')) ||
    clerkUser.emailAddresses?.some((e) => e.emailAddress.includes('theonlinegamer')) ||
    clerkUser.firstName?.toLowerCase().includes('jerless') ||
    false
  );
}

export function effectivePlan(
  dbPlan: string | undefined,
  userId: string,
  clerkUser: ClerkLikeUser
): 'free' | 'creator' | 'church_pro' {
  if (isVesperAdmin(userId, clerkUser)) return 'church_pro';
  if (dbPlan === 'creator' || dbPlan === 'church_pro') return dbPlan;
  return 'free';
}
