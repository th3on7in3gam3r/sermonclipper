'use client';

import DashboardAccountPanel from '@/components/dashboard/DashboardAccountPanel';
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist';
import DashboardAnalyticsPanel from '@/components/dashboard/DashboardAnalyticsPanel';
import DashboardStreakPanel from '@/components/dashboard/DashboardStreakPanel';
import DashboardQuickPanel from '@/components/dashboard/DashboardQuickPanel';
import PushNotificationPrompt from '@/components/pwa/PushNotificationPrompt';
import MilestoneToastListener from '@/components/dashboard/MilestoneToastListener';
import type { SermonRecord } from '@/components/dashboard/ClipLibrary';

interface DashboardOverviewProps {
  userData: {
    plan?: string;
    usageCount?: number;
    limit?: number;
    lastUsageReset?: string;
  } | null;
  isPhone?: boolean;
  sermons?: SermonRecord[];
  sermonsLoading?: boolean;
}

export default function DashboardOverview({
  userData,
  isPhone,
  sermons = [],
  sermonsLoading = false,
}: DashboardOverviewProps) {
  return (
    <section className="dashboard-overview" aria-label="Dashboard overview">
      <MilestoneToastListener />
      <PushNotificationPrompt />

      <div className="dashboard-overview-row dashboard-overview-row--top">
        <div className="dashboard-overview-left">
          <DashboardStreakPanel />
          <DashboardQuickPanel sermons={sermons} loading={sermonsLoading} />
        </div>
        <GettingStartedChecklist compact />
      </div>

      <div className="dashboard-overview-row dashboard-overview-row--bottom">
        <DashboardAnalyticsPanel />
        <DashboardAccountPanel userData={userData} isMobile={isPhone} plan={userData?.plan} />
      </div>
    </section>
  );
}
