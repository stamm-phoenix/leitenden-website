/**
 * Stand-in for `@azure/functions`, which the API of website-astro imports (see
 * `vite/legacyCode.ts`). `app.http()` only records the routes; `router.ts` answers requests
 * with them. `app.timer()` records the timers; the Container Apps Jobs run them (timers.ts).
 */
import type { HttpFunctionOptions, TimerFunctionOptions } from './types';
import { registerRoute } from './registry';
import { registerTimer } from './timers';

export type {
  Cookie,
  HttpFunctionOptions,
  HttpHandler,
  HttpMethod,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  Timer,
  TimerFunctionOptions,
  TimerHandler,
} from './types';

export const app = {
  http(name: string, options: HttpFunctionOptions): void {
    registerRoute(name, options);
  },
  timer(name: string, options: TimerFunctionOptions): void {
    registerTimer(name, options);
  },
  setup(): void {},
};
