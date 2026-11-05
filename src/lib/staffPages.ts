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
}

export const MOVED_PAGES: Record<string, StaffPageOptions> = {
  '/leitendenbereich': { header: 'none' },
  '/leitendenbereich/aufgaben': { header: 'none', compact: true },
  '/leitendenbereich/aufgaben/projekte': { header: 'page', compact: true },
  '/leitendenbereich/aufgaben/vorlagen': { header: 'page', compact: true },
  '/leitendenbereich/aufgaben/vorschlaege': { header: 'page', compact: true },
  '/leitendenbereich/wieder-angemeldet': { header: 'page' },
};

/** The path without a trailing slash, as the registry of website-astro writes it. */
export function staffPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}
