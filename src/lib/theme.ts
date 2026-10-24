/** Shared by the server layout (inline script) and the client ThemeProvider. */

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'vesper-theme';

/**
 * Vesper is dark by default (it's a video tool, and the brand is "dusk").
 * Light mode is only used when the visitor picks it with the toggle — not
 * inferred from the OS setting.
 */
export const DEFAULT_THEME: Theme = 'dark';

/** Inline <head> script: applies the saved theme before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.setAttribute('data-theme',t==='light'?'light':'${DEFAULT_THEME}')}catch(e){}})();`;
