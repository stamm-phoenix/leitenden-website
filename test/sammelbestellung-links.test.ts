import { expect, test } from 'bun:test';
import type { HttpRequest } from '@azure/functions';
import { getSiteUrl } from '#legacy/api/lib/site-url';
import { sammelUrl } from '#legacy/api/lib/sammelbestellung-list';
import { APP_CONFIG } from '../src/lib/server/config';
import { WEBSITE } from '../src/lib/website';

/** A request as the adapter hands it to the endpoints (src/lib/server/functions/router.ts). */
function requestTo(url: string, headers: Record<string, string> = {}): HttpRequest {
  return { url, headers: new Headers(headers) } as unknown as HttpRequest;
}

const PRODUCTION = `https://${APP_CONFIG.hosts.production}`;
const PREVIEW = PRODUCTION.replace('leitenden-website.', 'leitenden-website---pr-12.');

// The order pages for parents stay on the website: the invitation link that leaders copy
// (api/endpoints/intern-pflege-sammelbestellungen.ts) and the links in the messages to parents
// are built from getSiteUrl(), which knows only the hosts of the website
test('links of the Sammelbestellungen for parents point to the website', () => {
  expect(PREVIEW).not.toBe(PRODUCTION);
  for (const request of [
    requestTo(`${PRODUCTION}/api/intern/pflege/sammelbestellungen/1`),
    requestTo(`${PREVIEW}/api/intern/pflege/sammelbestellungen/1`),
    requestTo('http://10.0.0.5:3000/api/intern/pflege/sammelbestellungen/1', {
      'x-forwarded-host': APP_CONFIG.hosts.production,
    }),
  ]) {
    expect(getSiteUrl(request)).toBe(WEBSITE);
  }

  process.env.SAMMELBESTELLUNG_LINK_SECRET ??= 'x'.repeat(32);
  const link = new URL(sammelUrl(getSiteUrl(requestTo(PRODUCTION)), 'campaign', '7'));
  expect(link.origin).toBe(WEBSITE);
  expect(link.pathname).toBe('/mitgliederbereich/sammelbestellungen');
});
