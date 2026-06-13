'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { isFlagEnabled as checkFlag } from '@/lib/featureFlagsClient';

type FlagsContextValue = {
  flags: Record<string, boolean>;
  loaded: boolean;
  isEnabled: (name: string) => boolean;
  refresh: () => Promise<void>;
};

const FlagsContext = createContext<FlagsContextValue>({
  flags: {},
  loaded: false,
  isEnabled: () => false,
  refresh: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFlags({});
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch('/api/flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || {});
      }
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    if (isLoaded) void refresh();
  }, [isLoaded, refresh]);

  const value = useMemo(
    () => ({
      flags,
      loaded,
      isEnabled: (name: string) => checkFlag(flags, name),
      refresh,
    }),
    [flags, loaded, refresh]
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FlagsContext);
}
