import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { POSTFAECHER } from '#legacy/api/lib/postfach-liste';
import { konversationLink } from '#legacy/api/lib/postfach-mails';
import { staffPage } from '#legacy/web/src/lib/staffModules';
import { MOVED_PAGES } from '../src/lib/staffPages';

const ROUTES = join(import.meta.dir, '../src/routes');

/** The route of a page; the mailboxes share email/[postfach]. */
function routeOf(path: string): string {
  return path.replace(/^\/leitendenbereich\/email\/[^/]+$/, '/leitendenbereich/email/[postfach]');
}

test('every moved page has a route and an entry in the registry of website-astro', () => {
  for (const path of Object.keys(MOVED_PAGES)) {
    expect(existsSync(join(ROUTES, routeOf(path), '+page.svelte'))).toBe(true);
    expect(staffPage(path).href).toBe(path);
  }
});

test('every shared mailbox has its page here', () => {
  for (const postfach of POSTFAECHER) {
    expect(MOVED_PAGES[`/leitendenbereich/email/${postfach.id}`]).toBeDefined();
  }
});

// Links in the mails of website-astro (api/lib/leitendenrunde-termin.ts,
// aufgaben-erinnerung-mails.ts, postfach-mails.ts) keep their path here; query and hash are read
// by the components
test('the staff pages linked from mails live in this app', () => {
  for (const path of [
    '/leitendenbereich/aufgaben',
    '/leitendenbereich/protokolle',
    '/leitendenbereich/protokolle/protokoll',
    ...POSTFAECHER.map(
      (postfach) => new URL(konversationLink('https://example.org', postfach.id, 'x')).pathname
    ),
  ]) {
    expect(MOVED_PAGES[path]).toBeDefined();
  }
});
