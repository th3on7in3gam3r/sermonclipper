'use client';

import DashboardAccountPanel from '@/components/dashboard/DashboardAccountPanel';
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist';
import DashboardAnalyticsPanel from '@/components/dashboard/DashboardAnalyticsPanel';
import DashboardStreakPanel from '@/components/dashboard/DashboardStreakPanel';
import PushNotificationPrompt from '@/components/pwa/PushNotificationPrompt';
import MilestoneToastListener from '@/components/dashboard/MilestoneToastListener';

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
      <MilestoneToastListener />
      <PushNotificationPrompt />
      <DashboardStreakPanel />
      <GettingStartedChecklist />
      <DashboardAnalyticsPanel />
      <DashboardAccountPanel userData={userData} isMobile={isPhone} plan={userData?.plan} />
    </section>
  );
}
