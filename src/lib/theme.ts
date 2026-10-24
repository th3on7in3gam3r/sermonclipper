/** Shared by the server layout (inline script) and the client ThemeProvider. */

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'vesper-theme';
export const LIGHT_QUERY = '(prefers-color-scheme: light)';

/**
 * Inline <head> script: sets data-theme before first paint so light-mode
 * visitors don't see a dark flash while JS loads. Mirrors readTheme() in
 * ThemeProvider.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('${LIGHT_QUERY}').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
