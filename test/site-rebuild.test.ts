import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import type { InvocationContext } from '@azure/functions';
import { requestSiteRebuildIn } from '../src/lib/server/siteRebuild';
import { legacyCode, replacementOf } from '../vite/legacyCode';

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

/** The dispatches of `requestSiteRebuild` in a process with `env` (test/fixtures). */
function dispatchesWith(env: Record<string, string>): string {
  const run = Bun.spawnSync([process.execPath, file('fixtures/site-rebuild-run.ts')], {
    env: { ...process.env, GITHUB_REBUILD_TOKEN: 'test-token', PREVIEW_DATABASE: '', ...env },
  });
  expect(run.exitCode).toBe(0);
  return run.stdout.toString().trim();
}

// The revision of a PR preview gets its database name as environment variable (container-app.sh)
test('the API reads from the environment whether it runs as a preview', () => {
  expect(dispatchesWith({})).toBe('1');
  expect(dispatchesWith({ PREVIEW_DATABASE: 'leitende-pr-13' })).toBe('0');
});

/** What the plugin resolves `source` imported by `importer` to, with Vite's resolution faked. */
async function resolveWithPlugin(source: string, importer: string, id: string): Promise<unknown> {
  const resolveId = legacyCode().resolveId as (
    this: unknown,
    source: string,
    importer: string,
    options: object
  ) => Promise<unknown>;
  const context = { resolve: async (): Promise<{ id: string }> => ({ id }) };
  return resolveId.call(context, source, importer, {});
}

// Both places of website-astro that ask for a content build
test('the API of website-astro gets the replacement', async () => {
  const original = file('../vendor/website-astro/api/lib/site-rebuild.ts');
  const replacement = file('../src/lib/server/siteRebuild.ts');
  for (const [source, importer] of [
    ['./site-rebuild', '../vendor/website-astro/api/lib/pflege-api.ts'],
    ['../lib/site-rebuild', '../vendor/website-astro/api/endpoints/intern-nikolaus-steuerung.ts'],
  ]) {
    expect(await resolveWithPlugin(source, file(importer), original)).toBe(replacement);
    expect(replacementOf(original, file(importer))).toBe(replacement);
  }
  // The replacement itself imports the original
  expect(
    await resolveWithPlugin('#legacy/api/lib/site-rebuild', replacement, original)
  ).toBeUndefined();
});
