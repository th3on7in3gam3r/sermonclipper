'use client';

import { useUser } from '@clerk/nextjs';
import HardLink from '@/components/shared/HardLink';

interface DashboardAccountPanelProps {
  userData: {
    plan?: string;
    usageCount?: number;
    limit?: number;
  } | null;
  isMobile?: boolean;
  plan?: string;
}

const QUICK_LINKS = [
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/team', label: 'Team', churchProOnly: true },
  { href: '/#pricing', label: 'Upgrade', hideOnPro: true },
] as const;

export default function DashboardAccountPanel({
  userData,
  isMobile = false,
  plan,
}: DashboardAccountPanelProps) {
  const { user, isLoaded } = useUser();

  const effectivePlan = plan || userData?.plan || 'free';
  const planLabel = effectivePlan.replace(/_/g, ' ');
  const usage = userData?.usageCount ?? 0;
  const limitNum = userData?.limit;
  const isUnlimited = limitNum === 999999;
  const clipsRemaining = isUnlimited || limitNum == null ? null : Math.max(0, limitNum - usage);
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Ministry User';
  const email = user?.primaryEmailAddress?.emailAddress;

  const links = QUICK_LINKS.filter((link) => {
    if ('churchProOnly' in link && link.churchProOnly && effectivePlan !== 'church_pro') return false;
    if ('hideOnPro' in link && link.hideOnPro && effectivePlan === 'church_pro') return false;
    return true;
  });

  return (
    <section className={`dashboard-account-card glass-card premium-border animate-in${isMobile ? ' dashboard-account-card--mobile' : ''}`}>
      <div className="dashboard-account-profile">
        {isLoaded && user?.imageUrl ? (
          <img src={user.imageUrl} alt="" className="dashboard-account-avatar" width={52} height={52} />
        ) : (
          <div className="dashboard-account-avatar dashboard-account-avatar--placeholder" aria-hidden="true" />
        )}
        <div className="dashboard-account-identity">
          <span className="vesper-badge badge-violet dashboard-account-badge">Account</span>
          <h2 className="dashboard-account-name">{isLoaded ? displayName : 'Loading…'}</h2>
          {email && <p className="dashboard-account-email">{email}</p>}
        </div>
      </div>

      <div className="dashboard-account-quota">
        <span className="dashboard-account-quota-label">Clips remaining</span>
        <strong className="dashboard-account-quota-value">{isUnlimited ? 'Unlimited' : (clipsRemaining ?? '—')}</strong>
        <span className="dashboard-account-quota-plan">
          {planLabel}
          {!isUnlimited && limitNum != null ? ` · ${usage}/${limitNum} used` : ''}
        </span>
      </div>

      <nav className="dashboard-account-nav" aria-label="Account shortcuts">
        {links.map((link) => (
          <HardLink key={link.href} href={link.href} className="dashboard-account-nav-link">
            {link.label}
          </HardLink>
        ))}
      </nav>
    </section>
  );
}
