/**
 * The web app manifest of this app: the one of website-astro
 * (`web/public/leitendenbereich.webmanifest`, see its `docs/leitendenbereich-app.md`) with the
 * addresses of this app. Name, icons and colours stay those of the website.
 */

/** The fields of the website's manifest this module relies on; the rest is passed through. */
export interface WebAppManifest {
  id: string;
  start_url: string;
  scope: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
  [field: string]: unknown;
}

/** Where this app links its manifest (the website's path stays the website's static file). */
export const APP_MANIFEST_PATH = '/leitende.webmanifest';

/**
 * - `start_url`: the start page; without a login the server sends to the login and back, so
 *   the website's start page `/leitendenbereich-app/` is not needed here.
 * - `scope`: the whole app, so login (`/.auth/…`), logout and `/abgemeldet` stay in the app
 *   window (on iOS a page outside the scope opens in Safari, which has other cookies).
 * - `id`: an installed app is identified by its origin plus `id`. This app has another origin
 *   than the website, so it is a new app on the home screen whatever `id` says. Never change it
 *   once people installed the app, or their home screen gets a second icon.
 */
export const APP_ADDRESSES = {
  id: '/leitendenbereich',
  start_url: '/leitendenbereich',
  scope: '/',
} as const;

export function appManifest(websiteManifest: WebAppManifest): WebAppManifest {
  return { ...websiteManifest, ...APP_ADDRESSES };
}
