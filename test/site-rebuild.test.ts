import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import type { InvocationContext } from '@azure/functions';
import { requestSiteRebuildIn } from '../src/lib/server/siteRebuild';
import { replacementOf } from '../vite/legacyCode';

const file = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));

const realFetch = globalThis.fetch;
const realToken = process.env.GITHUB_REBUILD_TOKEN;
const calls: string[] = [];
const context = { log: () => undefined, warn: () => undefined } as unknown as InvocationContext;

beforeEach(() => {
  calls.length = 0;
  process.env.GITHUB_REBUILD_TOKEN = 'test-token';
  globalThis.fetch = mock(async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(null, { status: 204 });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realToken === undefined) delete process.env.GITHUB_REBUILD_TOKEN;
  else process.env.GITHUB_REBUILD_TOKEN = realToken;
});

// Saving a Gruppenstunde in production refreshes the public pages of the website
test('production asks GitHub for the content build of the website', async () => {
  await requestSiteRebuildIn(null, 'gruppenstunden', context);
  expect(calls).toEqual(['https://api.github.com/repos/stamm-phoenix/website-astro/dispatches']);
});

// A preview has the token of main, but its data is test data in the preview database
test('a PR preview never starts the content build of the production website', async () => {
  for (const area of ['gruppenstunden', 'blog', 'downloads', 'faq', 'leitende', 'nikolaus']) {
    await requestSiteRebuildIn('leitende-pr-13', area, context);
  }
  expect(calls).toEqual([]);
});

test('areas without public content start nothing', async () => {
  await requestSiteRebuildIn(null, 'aufgaben', context);
  expect(calls).toEqual([]);
});

test('the API of website-astro gets the replacement', () => {
  expect(
    replacementOf(
      file('../vendor/website-astro/api/lib/site-rebuild.ts'),
      file('../vendor/website-astro/api/lib/pflege-api.ts')
    )
  ).toBe(file('../src/lib/server/siteRebuild.ts'));
});
