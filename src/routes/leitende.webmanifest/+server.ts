import type { RequestHandler } from '@sveltejs/kit';
import websiteManifest from '#legacy/web/public/leitendenbereich.webmanifest?raw';
import { appManifest } from '#lib/appManifest';
import type { WebAppManifest } from '#lib/appManifest';

const body = JSON.stringify(appManifest(JSON.parse(websiteManifest) as WebAppManifest), null, 2);

/** Public like the website's: browsers load the manifest without the login cookie. */
export const GET: RequestHandler = () =>
  new Response(body, {
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
