/**
 * Replaces web/src/lib/blog.ts of website-astro for its components (vite/legacyCode.ts): the
 * page of a published post („Ansehen“, „Auf der Website ansehen“) is on the website, which bakes
 * it, not on this app's host.
 */
import { getBlogPostUrl as websiteBlogPostPath } from '#legacy/web/src/lib/blog';
import { WEBSITE } from '#lib/website';

export * from '#legacy/web/src/lib/blog';

/** Page of a published post on the website. */
export function getBlogPostUrl(id: string): string {
  return `${WEBSITE}${websiteBlogPostPath(id)}`;
}
