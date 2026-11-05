/**
 * Stand-in for `astro:transitions/client`, which components of website-astro import (alias in
 * vite.config.ts). SvelteKit navigates here; `astroEvents.ts` fires the Astro events those
 * components listen to.
 */
import { goto } from '$app/navigation';

export interface NavigateOptions {
  history?: 'auto' | 'push' | 'replace';
}

export function navigate(href: string, options: NavigateOptions = {}): Promise<void> {
  return goto(href, { replaceState: options.history === 'replace' });
}

/** The part of Astro's event that the components of website-astro read or set. */
export interface TransitionBeforePreparationEvent extends Event {
  readonly to: URL;
  readonly from: URL;
  readonly navigationType: 'push' | 'replace' | 'traverse';
  loader: () => Promise<void>;
}

/** Never fired here: SvelteKit has no document swap with a view transition. */
export interface TransitionBeforeSwapEvent extends Event {
  readonly viewTransition: { finished: Promise<void> };
  readonly newDocument: Document;
}
