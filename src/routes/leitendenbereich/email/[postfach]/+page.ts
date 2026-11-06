import { error } from '@sveltejs/kit';
import { POSTFAECHER } from '#legacy/api/lib/postfach-liste';
import type { PostfachEintrag } from '#legacy/api/lib/postfach-liste';
import type { PageLoad } from './$types';

/** The mailboxes of api/lib/postfach-liste.ts, like getStaticPaths of email/[postfach].astro. */
export const load: PageLoad = ({ params }): { postfach: PostfachEintrag } => {
  const postfach = POSTFAECHER.find((eintrag) => eintrag.id === params.postfach);
  if (!postfach) error(404, 'Dieses Postfach gibt es nicht.');
  return { postfach };
};
