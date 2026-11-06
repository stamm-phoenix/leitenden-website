import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import { CHANGELOG } from '#legacy/web/src/lib/changelogEntries';
import {
  NIKOLAUS_CONTROL_MODULE,
  NIKOLAUS_MODULES,
  STAFF_DEFAULT_QUICK,
  STAFF_FAVORITE_PATHS,
  STAFF_HOME,
  STAFF_MODULES,
  STAFF_SUBPAGES,
} from '#legacy/web/src/lib/staffModules';
import { NIKOLAUS_PAGES, staffLinkTarget } from '../src/lib/staffLinks';
import { MOVED_PAGES } from '../src/lib/staffPages';
import { load } from '../src/routes/leitendenbereich/[...rest]/+page.server';

const ROOT = join(import.meta.dir, '..');
const LEGACY_COMPONENTS = 'vendor/website-astro/web/src/components';

/** Components of the start page, the menu and the sidebar with links written into them. */
const NAVIGATION_SOURCES = [
  'StaffDashboard.svelte',
  'StaffGreeting.svelte',
  'StaffModuleSection.svelte',
  'StaffModuleSearch.svelte',
  'StaffCommonTasks.svelte',
  'StaffNav.svelte',
  'StaffNavPanel.svelte',
  'StaffSidebar.svelte',
  'NikolausStaffSection.svelte',
  'NikolausStaffNotice.svelte',
  'changelog/ChangelogNotice.svelte',
  'changelog/ChangelogBadge.svelte',
].map((file) => `${LEGACY_COMPONENTS}/${file}`);
const OWN_SOURCES = [
  'src/routes/leitendenbereich/+page.svelte',
  'src/routes/leitendenbereich/+layout.svelte',
  'src/lib/components/StaffHeader.svelte',
];

/** Paths of the Leitendenbereich written into a component, up to an ID, query or anchor. */
function writtenPaths(file: string): string[] {
  const source = readFileSync(join(ROOT, file), 'utf8');
  return (
    [...source.matchAll(/\/leitendenbereich[^"'`{}?#\s<]*/g)]
      .map((match) => match[0])
      // Comments name the Astro pages a component was taken from
      .filter((path) => !path.endsWith('.astro'))
  );
}

/** Every page the start page, the menu, the sidebar, favorites and Neuigkeiten link to. */
function linkedPages(): string[] {
  const changelogLinks = CHANGELOG.flatMap((entry) =>
    entry.changes.flatMap((change) => (typeof change === 'string' ? [] : [change.href]))
  );
  return [
    STAFF_HOME.href,
    ...STAFF_MODULES.map((module) => module.href),
    NIKOLAUS_CONTROL_MODULE.href,
    ...NIKOLAUS_MODULES.map((module) => module.href),
    ...STAFF_SUBPAGES.map((page) => page.href),
    ...STAFF_FAVORITE_PATHS,
    ...STAFF_DEFAULT_QUICK,
    ...changelogLinks,
    ...[...NAVIGATION_SOURCES, ...OWN_SOURCES].flatMap(writtenPaths),
  ];
}

test('every link of the start page, the menu and Neuigkeiten leads to a page', () => {
  const pages = linkedPages();
  expect(pages.length).toBeGreaterThan(80);
  // A path here is a page that neither lives in this app nor is one of the Nikolausdienst
  const nowhere = [...new Set(pages)].filter((path) => staffLinkTarget(path) === undefined);
  expect(nowhere).toEqual([]);
});

test('only the pages of the Nikolausdienst open on the website', () => {
  for (const path of new Set(linkedPages())) {
    const target = staffLinkTarget(path);
    const nikolaus = NIKOLAUS_PAGES.some((page) => path === page || path === `${page}/`);
    expect(target).toBe(nikolaus ? `https://www.stamm-phoenix.de${path}` : path);
  }
  for (const page of NIKOLAUS_PAGES) expect(MOVED_PAGES[page]).toBeUndefined();
  expect(NIKOLAUS_PAGES).toContain('/leitendenbereich/nikolaus-steuerung');
  expect(NIKOLAUS_PAGES).toContain('/leitendenbereich/nikolaus-dispo');
});

/** What leitendenbereich/[...rest] answers for `path`. */
function answer(path: string): unknown {
  const url = new URL(path, 'https://leitende.example.org');
  try {
    load({ url } as Parameters<typeof load>[0]);
  } catch (thrown) {
    return thrown;
  }
  return undefined;
}

test('a page of the Nikolausdienst opened here goes on to the website', () => {
  expect(answer('/leitendenbereich/nikolaus-dispo?tag=2026-12-05')).toMatchObject({
    status: 302,
    location: 'https://www.stamm-phoenix.de/leitendenbereich/nikolaus-dispo?tag=2026-12-05',
  });
  expect(answer('/leitendenbereich/nikolaus-steuerung/')).toMatchObject({
    status: 302,
    location: 'https://www.stamm-phoenix.de/leitendenbereich/nikolaus-steuerung/',
  });
});

test('a page that exists nowhere is not found here', () => {
  expect(answer('/leitendenbereich/gibt-es-nicht')).toMatchObject({ status: 404 });
});

/** The pages of the Leitendenbereich on the website, as paths (index pages without `index`). */
function websitePages(): string[] {
  const pages = join(ROOT, 'vendor/website-astro/web/src/pages');
  return readdirSync(join(pages, 'leitendenbereich'), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.astro'))
    .map((file) => `/leitendenbereich/${file.replace(/\.astro$/, '')}`.replace(/\/index$/, ''))
    .flatMap((path) =>
      // One page per shared mailbox, as getStaticPaths of email/[postfach].astro
      path.endsWith('/[postfach]')
        ? Object.keys(MOVED_PAGES).filter((page) => page.startsWith('/leitendenbereich/email/'))
        : [path]
    );
}

// A page of the website that is neither here nor of the Nikolausdienst was missed by the move
test('every page of the Leitendenbereich on the website lives here or is of the Nikolausdienst', () => {
  const pages = websitePages();
  expect(pages).toContain('/leitendenbereich/neuigkeiten');
  expect(pages.filter((path) => staffLinkTarget(path) === undefined)).toEqual([]);
});
