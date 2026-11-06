import { NIKOLAUS_CONTROL_MODULE, NIKOLAUS_MODULES } from '#legacy/web/src/lib/staffModules';
import { MOVED_PAGES, staffRegistryPath } from '#lib/staffPages';
import { WEBSITE } from '#lib/website';

/**
 * The pages of the Nikolausdienst stay on the website for now (#14): the menu, the start page,
 * favorites and Neuigkeiten link to them with their path, and leitendenbereich/[...rest] sends
 * them on to the website.
 */
export const NIKOLAUS_PAGES: readonly string[] = [NIKOLAUS_CONTROL_MODULE, ...NIKOLAUS_MODULES].map(
  (module) => module.href
);

/**
 * Where a link of the Leitendenbereich to `path` leads: the path itself for a page of this app,
 * the page on the website for the Nikolausdienst, `undefined` for a page that exists nowhere.
 */
export function staffLinkTarget(path: string): string | undefined {
  const url = new URL(path, WEBSITE);
  const registered = staffRegistryPath(url.pathname);
  if (MOVED_PAGES[registered]) return path;
  if (NIKOLAUS_PAGES.includes(registered)) return `${WEBSITE}${url.pathname}${url.search}`;
  return undefined;
}
