/**
 * Replaces `api/lib/deployment.ts` of website-astro (vite/legacyCode.ts). There the deploy
 * workflow rewrites the file for each PR preview; here each revision of the Container App gets
 * the names as environment variables (.github/scripts/container-app.sh). Unset is production.
 */
export const PREVIEW_DATABASE: string | null = process.env.PREVIEW_DATABASE || null;
export const PREVIEW_CONTAINER: string | null = process.env.PREVIEW_CONTAINER || null;
export const PREVIEW_PLAYWRIGHT_API: string | null = process.env.PREVIEW_PLAYWRIGHT_API || null;
