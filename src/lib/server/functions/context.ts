/**
 * What the endpoints (router.ts) and the timers (timers.ts) of website-astro both need: the
 * folder of their assets and the context of one call.
 */
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { InvocationContext } from './types';

declare global {
  var __legacyApiDir: string | undefined;
}

/** The API reads its assets relative to its bundle (`api/dist/bundle`, see vite/legacyCode.ts). */
export function useLegacyApiDir(): void {
  globalThis.__legacyApiDir ??= resolve('vendor/website-astro/api/dist/bundle');
}

/** The context of one call of the function `name`; it logs to the console of the container. */
export function createContext(name: string): InvocationContext {
  const invocationId = randomUUID();
  const prefix = `[${name}]`;
  return {
    invocationId,
    functionName: name,
    log: (...args) => console.log(prefix, ...args),
    trace: (...args) => console.debug(prefix, ...args),
    debug: (...args) => console.debug(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
  };
}
