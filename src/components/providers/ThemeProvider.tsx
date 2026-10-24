'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { LIGHT_QUERY, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

/*
 * Theme lives in a tiny external store (localStorage + OS preference) read via
 * useSyncExternalStore. The provider always renders the same tree: an earlier
 * version swapped `<>children</>` for `<Provider>children</Provider>` after
 * mount, which made React remount the entire app (and re-run every effect and
 * API call) right after hydration.
 */

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const mq = window.matchMedia(LIGHT_QUERY);
  mq.addEventListener('change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener('change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writeTheme(next: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => writeTheme(next), []);
  const toggleTheme = useCallback(() => writeTheme(readTheme() === 'dark' ? 'light' : 'dark'), []);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
