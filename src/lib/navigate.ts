/** Full-page navigation — reliable when the PWA service worker is active. */
export function navigateTo(href: string): void {
  window.location.assign(href);
}
