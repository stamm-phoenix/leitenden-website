import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { staffPage } from '#legacy/web/src/lib/staffModules';
import { MOVED_PAGES } from '../src/lib/staffPages';

const ROUTES = join(import.meta.dir, '../src/routes');

test('every moved page has a route and an entry in the registry of website-astro', () => {
  for (const path of Object.keys(MOVED_PAGES)) {
    expect(existsSync(join(ROUTES, path, '+page.svelte'))).toBe(true);
    expect(staffPage(path).href).toBe(path);
  }
});

// Links in the mails of website-astro (api/lib/leitendenrunde-termin.ts,
// aufgaben-erinnerung-mails.ts) keep their path here; query and hash are read by the components
test('the staff pages linked from mails live in this app', () => {
  for (const path of [
    '/leitendenbereich/aufgaben',
    '/leitendenbereich/protokolle',
    '/leitendenbereich/protokolle/protokoll',
  ]) {
    expect(MOVED_PAGES[path]).toBeDefined();
  }
});
