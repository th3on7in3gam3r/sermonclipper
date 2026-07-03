'use client';

import DashboardAccountPanel from '@/components/dashboard/DashboardAccountPanel';
import GettingStartedChecklist from '@/components/dashboard/GettingStartedChecklist';
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
      <DashboardStreakPanel />
      <GettingStartedChecklist compact />
      <DashboardQuickPanel sermons={sermons} loading={sermonsLoading} />
      <DashboardAccountPanel userData={userData} isMobile={isPhone} plan={userData?.plan} />
    </section>
  );
}
