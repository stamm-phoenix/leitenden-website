import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { POSTFAECHER } from '#legacy/api/lib/postfach-liste';
import { fotoOrdnerLink } from '#legacy/api/lib/foto-pfade';
import { konversationLink } from '#legacy/api/lib/postfach-mails';
import { schnupperStammMail } from '#legacy/api/lib/schnupper-mails';
import { SCHNUPPER_STUFEN } from '#legacy/api/lib/schnupper-model';
import type { StaffSchnupperAnfrage } from '#legacy/api/lib/schnupper-model';
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

/** The page the button of the mail about a new Schnupperstunden-Anfrage leads to. */
function schnupperMailPath(): string {
  const anfrage: StaffSchnupperAnfrage = {
    id: 1,
    alter: 8,
    kindVorname: '',
    name: 'Test',
    email: 'test@example.org',
    telefon: '',
    wunschzeit: 'Dienstag',
    nachricht: '',
    stufe: SCHNUPPER_STUFEN[0],
    etag: 'x',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'offen',
    termin: null,
    antwort: '',
    antwortMail: null,
    bearbeitetVon: null,
    bearbeitetAm: null,
  };
  const { html } = schnupperStammMail(anfrage, 'https://example.org');
  const links = [...html.matchAll(/href="(https:\/\/example\.org[^"]*)"/g)].map((m) => m[1]);
  expect(links).toHaveLength(1);
  return new URL(links[0]).pathname;
}

// Links in the mails of website-astro (api/lib/leitendenrunde-termin.ts,
// aufgaben-erinnerung-mails.ts, postfach-mails.ts, schnupper-mails.ts, foto-benachrichtigung.ts
// via foto-pfade.ts) keep their path here; query and hash are read by the components
test('the staff pages linked from mails live in this app', () => {
  for (const path of [
    '/leitendenbereich/aufgaben',
    '/leitendenbereich/protokolle',
    '/leitendenbereich/protokolle/protokoll',
    schnupperMailPath(),
    new URL(fotoOrdnerLink('Aktionen/2026'), 'https://example.org').pathname,
    ...POSTFAECHER.map(
      (postfach) => new URL(konversationLink('https://example.org', postfach.id, 'x')).pathname
    ),
  ]) {
    expect(MOVED_PAGES[path]).toBeDefined();
  }
});
