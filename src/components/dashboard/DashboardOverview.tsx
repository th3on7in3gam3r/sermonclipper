'use client';

import DashboardAccountPanel from '@/components/dashboard/DashboardAccountPanel';
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist';
import DashboardAnalyticsPanel from '@/components/dashboard/DashboardAnalyticsPanel';

interface DashboardOverviewProps {
  userData: {
    plan?: string;
    usageCount?: number;
    limit?: number;
    lastUsageReset?: string;
  } | null;
  isPhone?: boolean;
}

export default function DashboardOverview({ userData, isPhone }: DashboardOverviewProps) {
  return (
    <section className="dashboard-overview" aria-label="Dashboard overview">
      <GettingStartedChecklist />
      <DashboardAnalyticsPanel />
      <DashboardAccountPanel userData={userData} isMobile={isPhone} plan={userData?.plan} />
    </section>
  );
}
