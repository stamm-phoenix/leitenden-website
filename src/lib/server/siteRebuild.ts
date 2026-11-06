/**
 * Replaces `api/lib/site-rebuild.ts` of website-astro (vite/legacyCode.ts). A PR preview of this
 * app saves into its own preview database, but its revision has the same `GITHUB_REBUILD_TOKEN`
 * as `main` (AGENTS.md „Configuration“): it must never start the content refresh of the
 * production website, which would bake the production data anyway. Production asks as before.
 */
import type { InvocationContext } from '@azure/functions';
import {
  PUBLIC_CONTENT_AREAS,
  requestSiteRebuild as requestWebsiteRebuild,
} from '#legacy/api/lib/site-rebuild';
import { PREVIEW_DATABASE } from './deployment';

export * from '#legacy/api/lib/site-rebuild';

/** `requestSiteRebuild` for a deployment with the preview database `previewDatabase`. */
export async function requestSiteRebuildIn(
  previewDatabase: string | null,
  area: string,
  context: InvocationContext
): Promise<void> {
  if (!previewDatabase) return requestWebsiteRebuild(area, context);
  if (PUBLIC_CONTENT_AREAS.has(area)) {
    context.log(`[rebuild] PR preview (${previewDatabase}): no content build for ${area}`);
  }
}

/** Asks GitHub for a content build of the website, only in production; never fails. */
export function requestSiteRebuild(area: string, context: InvocationContext): Promise<void> {
  return requestSiteRebuildIn(PREVIEW_DATABASE, area, context);
}
