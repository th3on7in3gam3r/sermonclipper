'use client';

interface PwaOfflineBannerProps {
  offline: boolean;
}

export function PwaOfflineBanner({ offline }: PwaOfflineBannerProps) {
  if (!offline) return null;

  return (
    <div className="pwa-offline-banner" role="status">
      You&apos;re offline — showing your last saved clips
    </div>
  );
}
