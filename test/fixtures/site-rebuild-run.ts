/**
 * Saves a change of the Gruppenstunden through `requestSiteRebuild` as the API does, with the
 * environment of the process (`PREVIEW_DATABASE`), and prints how often GitHub was asked.
 * Run by test/site-rebuild.test.ts in a process of its own: the preview name is read on import.
 */
import type { InvocationContext } from '@azure/functions';
import { requestSiteRebuild } from '../../src/lib/server/siteRebuild';

let calls = 0;
globalThis.fetch = (async () => {
  calls += 1;
  return new Response(null, { status: 204 });
}) as unknown as typeof fetch;
const context = { log: () => undefined, warn: () => undefined } as unknown as InvocationContext;
await requestSiteRebuild('gruppenstunden', context);
console.log(calls);
