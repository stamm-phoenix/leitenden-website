import { redirect } from '@sveltejs/kit';
import { WEBSITE } from '#lib/website';
import type { PageServerLoad } from './$types';

/**
 * The Essensplanung for guests stays on the website. Links of its components with a path only
 * (e.g. „Zur Essensplanung“ in EssenPlanungen.svelte) open there; the browser keeps the hash
 * with the link token.
 */
export const load: PageServerLoad = ({ url }) => {
  redirect(302, `${WEBSITE}${url.pathname}${url.search}`, { external: [WEBSITE] });
};
