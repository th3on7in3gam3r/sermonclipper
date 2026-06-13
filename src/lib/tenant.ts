import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { isPrimaryAppHost, normalizeHost } from '@/lib/whiteLabel';

export async function resolveTenantByHost(host: string) {
  const normalized = normalizeHost(host);
  if (isPrimaryAppHost(normalized)) return null;

  await connectDB();
  const user = await User.findOne({
    'whiteLabel.customDomainVerified': true,
    'whiteLabel.customDomain': normalized,
  }).lean();

  if (!user?.whiteLabel) return null;
  return {
    clerkId: user.clerkId,
    whiteLabel: user.whiteLabel,
  };
}
