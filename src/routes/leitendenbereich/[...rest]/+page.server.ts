import { error, redirect } from '@sveltejs/kit';
import { staffLinkTarget } from '#lib/staffLinks';
import { WEBSITE } from '#lib/website';
import type { PageServerLoad } from './$types';

/** The Nikolausdienst opens on the website (src/lib/staffLinks.ts); every other page lives here. */
export const load: PageServerLoad = ({ url }) => {
  const target = staffLinkTarget(`${url.pathname}${url.search}`);
  if (target?.startsWith(WEBSITE)) redirect(302, target, { external: [WEBSITE] });
  error(404, 'Diese Seite gibt es nicht.');
};
