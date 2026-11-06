import { POSTFAECHER } from '#legacy/api/lib/postfach-liste';
import { postfachHref } from '#legacy/web/src/lib/postfaecher';

/**
 * The pages of the Leitendenbereich that already live in this app, with what StaffLayout.astro
 * of website-astro took as props. Title, heading and intro still come from the registry of
 * website-astro (`STAFF_MODULES`, `STAFF_SUBPAGES` in lib/staffModules.ts).
 * Every other page of the Leitendenbereich opens on the website (routes/leitendenbereich/[...rest]).
 */
export interface StaffPageOptions {
  /** Who renders the h1: `page` shows heading and intro, `sr-only` a heading for screen readers, `none` leaves it to the content. */
  header: 'page' | 'sr-only' | 'none';
  /** Less space below the intro, for modules whose content must start high up on a phone. */
  compact?: boolean;
  /** Only the content, without header, menu and footer, for views shown in a window of their own. */
  bare?: boolean;
  /** Off for modules that say themselves what works without a connection. */
  offlineNotice?: boolean;
}

export const MOVED_PAGES: Record<string, StaffPageOptions> = {
  '/leitendenbereich': { header: 'none' },
  '/leitendenbereich/aufgaben': { header: 'none', compact: true },
  '/leitendenbereich/aufgaben/projekte': { header: 'page', compact: true },
  '/leitendenbereich/aufgaben/vorlagen': { header: 'page', compact: true },
  '/leitendenbereich/aufgaben/vorschlaege': { header: 'page', compact: true },
  '/leitendenbereich/protokolle': { header: 'page' },
  '/leitendenbereich/protokolle/protokoll': { header: 'sr-only', offlineNotice: false },
  '/leitendenbereich/protokolle/praesentation': { header: 'sr-only', bare: true },
  '/leitendenbereich/abstimmungen': { header: 'none' },
  '/leitendenbereich/abstimmungen/abstimmung': { header: 'none' },
  '/leitendenbereich/personen': { header: 'page' },
  // One page per shared mailbox (email/[postfach]), like getStaticPaths of email/[postfach].astro
  ...Object.fromEntries(
    POSTFAECHER.map((postfach) => [
      postfachHref(postfach.id),
      { header: 'page', compact: true } satisfies StaffPageOptions,
    ])
  ),
  '/leitendenbereich/anwesenheit': { header: 'page' },
  '/leitendenbereich/mitglieder': { header: 'page' },
  '/leitendenbereich/nami-abgleich': { header: 'page' },
  '/leitendenbereich/schnupperanfragen': { header: 'page' },
  '/leitendenbereich/wieder-angemeldet': { header: 'page' },
};

/** The path without a trailing slash, as the registry of website-astro writes it. */
export function staffPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}
