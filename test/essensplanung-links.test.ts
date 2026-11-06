import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { beitrittUrl, planungUrl } from '../src/lib/essensplanungLinks';
import { legacyCode } from '../vite/legacyCode';
import { load } from '../src/routes/essensplanung/[...rest]/+page.server';

const file = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));
const ORIGINAL = file('../vendor/website-astro/web/src/lib/essensplanung.ts');
const LINKS = file('../src/lib/essensplanungLinks.ts');
const COMPONENT = file(
  '../vendor/website-astro/web/src/components/essensplanung/MeineEssensplanungen.svelte'
);

// The Essensplanung for guests stays on the website; this app runs on another host
test('links to a Planung and to joining one point to the website', () => {
  expect(planungUrl('abc')).toBe('https://www.stamm-phoenix.de/essensplanung/planung#t=abc');
  expect(beitrittUrl('abc')).toBe('https://www.stamm-phoenix.de/essensplanung/beitreten#b=abc');
});

/** What the plugin resolves `source` imported by `importer` to, with Vite's resolution faked. */
async function resolveWithPlugin(source: string, importer: string): Promise<unknown> {
  const resolveId = legacyCode().resolveId as (
    this: unknown,
    source: string,
    importer: string,
    options: object
  ) => Promise<unknown>;
  const context = { resolve: async (): Promise<{ id: string }> => ({ id: ORIGINAL }) };
  return resolveId.call(context, source, importer, {});
}

test('components of website-astro get the links of this app', async () => {
  expect(await resolveWithPlugin('../../lib/essensplanung', COMPONENT)).toBe(LINKS);
  // The replacement itself imports the original
  expect(await resolveWithPlugin('#legacy/web/src/lib/essensplanung', LINKS)).toBeUndefined();
});

test('paths of the Essensplanung for guests open on the website', () => {
  for (const [path, target] of [
    ['/essensplanung', 'https://www.stamm-phoenix.de/essensplanung'],
    ['/essensplanung/planung?x=1', 'https://www.stamm-phoenix.de/essensplanung/planung?x=1'],
  ]) {
    const url = new URL(path, 'https://leitende.example.org');
    expect(() => load({ url } as Parameters<typeof load>[0])).toThrow(
      expect.objectContaining({ status: 302, location: target })
    );
  }
});
