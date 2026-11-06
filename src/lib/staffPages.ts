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
  /** What the notice without a connection says instead, for modules that keep working offline. */
  offlineText?: string;
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
  '/leitendenbereich/aktionen': { header: 'page' },
  '/leitendenbereich/aktionen/aktion': { header: 'none' },
  '/leitendenbereich/aktionen/fahrten': { header: 'none' },
  '/leitendenbereich/fotos': { header: 'page', compact: true },
  '/leitendenbereich/wieder-angemeldet': { header: 'page' },
  '/leitendenbereich/essensplanungen': { header: 'page' },
  '/leitendenbereich/essensplanung-steuerung': { header: 'page' },
  '/leitendenbereich/essensplanung-zutaten': { header: 'page' },
  '/leitendenbereich/belege': { header: 'none' },
  '/leitendenbereich/eigenbeleg': { header: 'page' },
  '/leitendenbereich/abrechnung': { header: 'page' },
  '/leitendenbereich/abrechnung/detail': {
    header: 'none',
    offlineText:
      'Deine Eingaben bleiben auf dieser offenen Seite stehen. Neue Daten laden erst wieder, wenn du online bist.',
  },
  '/leitendenbereich/beitraege': { header: 'page' },
  '/leitendenbereich/kostenstellen': { header: 'page' },
  '/leitendenbereich/sammelbestellungen': { header: 'none' },
  '/leitendenbereich/sammelbestellungen/detail': { header: 'none' },
  '/leitendenbereich/inventur': { header: 'page' },
  '/leitendenbereich/redaktion': { header: 'page' },
  '/leitendenbereich/gruppenstunden': { header: 'none' },
  '/leitendenbereich/gruppenstunden-hinweise': { header: 'none' },
  '/leitendenbereich/leitende': { header: 'page' },
  '/leitendenbereich/downloads': { header: 'page' },
  '/leitendenbereich/problemmeldungen': { header: 'page' },
  '/leitendenbereich/fragen-und-antworten': { header: 'page' },
  '/leitendenbereich/qr-code': { header: 'page' },
};

export interface DetailPage {
  /** The list page; the ID is the one path segment below it. */
  parent: string;
  /** The path of the detail page in the registry of website-astro and in `MOVED_PAGES`. */
  page: string;
}

/**
 * Detail pages whose URL carries the ID in the path, e.g. `/leitendenbereich/abrechnung/evt_…`:
 * on the website a rewrite in staticwebapp.config.json served the page registered as `page`
 * for every path below `parent`; here they are routes with a parameter (`[id]`).
 */
export const DETAIL_PAGES: DetailPage[] = [
  { parent: '/leitendenbereich/abrechnung', page: '/leitendenbereich/abrechnung/detail' },
  {
    parent: '/leitendenbereich/sammelbestellungen',
    page: '/leitendenbereich/sammelbestellungen/detail',
  },
];

/** The path without a trailing slash, as the registry of website-astro writes it. */
export function staffPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

/**
 * The path of the registry (`MOVED_PAGES`, `staffPage` of website-astro) for `pathname`: the
 * registered detail page for a path with an ID, otherwise the path itself.
 */
export function staffRegistryPath(pathname: string): string {
  const path = staffPath(pathname);
  const detail = DETAIL_PAGES.find(({ parent }) => {
    const rest = path.startsWith(`${parent}/`) ? path.slice(parent.length + 1) : '';
    return rest !== '' && !rest.includes('/');
  });
  return detail?.page ?? path;
}
