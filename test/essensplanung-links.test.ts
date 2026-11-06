import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { beitrittUrl, datumKurz, planungUrl } from '../src/lib/essensplanungLinks';
import { datumKurz as websiteDatumKurz } from '#legacy/web/src/lib/essensplanung';
import { replacementOf } from '../vite/legacyCode';
import { load } from '../src/routes/essensplanung/[...rest]/+page.server';

const file = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));
const ORIGINAL = file('../vendor/website-astro/web/src/lib/essensplanung.ts');
const LINKS = file('../src/lib/essensplanungLinks.ts');

// The Essensplanung for guests stays on the website; this app runs on another host
test('links to a Planung and to joining one point to the website', () => {
  expect(planungUrl('abc')).toBe('https://www.stamm-phoenix.de/essensplanung/planung#t=abc');
  expect(beitrittUrl('abc')).toBe('https://www.stamm-phoenix.de/essensplanung/beitreten#b=abc');
});

test('the rest of the module stays the one of website-astro', () => {
  expect(datumKurz).toBe(websiteDatumKurz);
});

test('components of website-astro get the links of this app', () => {
  const component = file('../vendor/website-astro/web/src/components/essensplanung/X.svelte');
  expect(replacementOf(ORIGINAL, component)).toBe(LINKS);
  // The replacement itself imports the original
  expect(replacementOf(ORIGINAL, LINKS)).toBeUndefined();
});

test('paths of the Essensplanung for guests open on the website', () => {
  const url = new URL('https://leitende.example.org/essensplanung/planung?x=1');
  try {
    load({ url } as Parameters<typeof load>[0]);
    throw new Error('no redirect');
  } catch (error: unknown) {
    expect(error).toMatchObject({
      status: 302,
      location: 'https://www.stamm-phoenix.de/essensplanung/planung?x=1',
    });
  }
});
