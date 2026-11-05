import { redirect } from '@sveltejs/kit';
import { WEBSITE } from '#lib/website';
import type { PageServerLoad } from './$types';

/** Modules that have not moved yet open on the website (src/lib/staffPages.ts). */
export const load: PageServerLoad = ({ url }) => {
  redirect(302, `${WEBSITE}${url.pathname}${url.search}`, { external: [WEBSITE] });
};
