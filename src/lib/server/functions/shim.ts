/**
 * Stand-in for `@azure/functions`, which the API of website-astro imports (see
 * `vite/legacyCode.ts`). `app.http()` only records the routes; `router.ts` answers requests
 * with them. Timers keep running in the Function App of website-astro for now, so `app.timer()`
 * records nothing.
 */
import type { HttpFunctionOptions } from './types';
import { registerRoute } from './registry';

export type {
  Cookie,
  HttpFunctionOptions,
  HttpHandler,
  HttpMethod,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  Timer,
} from './types';

export const app = {
  http(name: string, options: HttpFunctionOptions): void {
    registerRoute(name, options);
  },
  timer(): void {},
  setup(): void {},
};
