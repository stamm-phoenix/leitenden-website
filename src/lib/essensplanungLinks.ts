/**
 * Replaces web/src/lib/essensplanung.ts of website-astro for its components (vite/legacyCode.ts):
 * the links to a Planung and to joining one point to the website, where the Essensplanung for
 * guests stays, instead of the origin of this app.
 */
import {
  beitrittUrl as websiteBeitrittUrl,
  planungUrl as websitePlanungUrl,
} from '#legacy/web/src/lib/essensplanung';
import { WEBSITE } from '#lib/website';

export * from '#legacy/web/src/lib/essensplanung';

export function planungUrl(token: string, origin: string = WEBSITE): string {
  return websitePlanungUrl(token, origin);
}

export function beitrittUrl(token: string, origin: string = WEBSITE): string {
  return websiteBeitrittUrl(token, origin);
}
