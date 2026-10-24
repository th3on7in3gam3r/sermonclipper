type ClerkLikeUser = {
  emailAddresses?: { emailAddress: string; verification?: { status?: string | null } | null }[];
  firstName?: string | null;
} | null;

/** The owner's Clerk user id — always an admin. */
const OWNER_USER_ID = 'user_3DYwuXu2bJd40YjKuyIoEh0Mvm4';

function envList(name: string, lowercase: boolean): Set<string> {
  return new Set(
    (process.env[name] || '')
      .split(',')
      .map((s) => (lowercase ? s.trim().toLowerCase() : s.trim()))
      .filter(Boolean)
  );
}

/**
 * Admins are matched EXACTLY, never by substring:
 *  - the owner's Clerk user id,
 *  - any id in VESPER_ADMIN_IDS (comma-separated),
 *  - any VERIFIED email in VESPER_ADMIN_EMAILS (comma-separated).
 *
 * Previously anyone whose email *contained* certain words, or whose first name
 * contained "jerless", was an admin — all values a new user chooses at sign-up.
 *
 * Matches /api/user/status admin bypass — keeps export in sync with dashboard plan display.
 */
export function isVesperAdmin(userId: string, clerkUser: ClerkLikeUser): boolean {
  if (!userId) return false;
  if (userId === OWNER_USER_ID) return true;
  if (envList('VESPER_ADMIN_IDS', false).has(userId)) return true; // Clerk ids are case-sensitive

  const adminEmails = envList('VESPER_ADMIN_EMAILS', true);
  if (!clerkUser || adminEmails.size === 0) return false;
  return Boolean(
    clerkUser.emailAddresses?.some(
      (e) => e.verification?.status === 'verified' && adminEmails.has(e.emailAddress.trim().toLowerCase())
    )
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
