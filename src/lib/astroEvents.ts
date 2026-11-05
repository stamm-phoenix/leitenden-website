/**
 * Fires the page events of Astro's client router on SvelteKit navigations, because components
 * of website-astro react to them: the guard against losing unsaved input
 * (`astro:before-preparation`, lib/unsavedChanges.ts) and refreshes after a page change
 * (`astro:after-swap`, `astro:page-load`).
 */
import { afterNavigate, beforeNavigate } from '$app/navigation';
import type { TransitionBeforePreparationEvent } from './astroTransitions';

export function bridgeAstroEvents(): void {
  beforeNavigate((navigation) => {
    // Reload and closing the tab: `beforeunload` of the guard asks the browser's own question
    if (navigation.type === 'leave' || !navigation.to) return;
    const original = async (): Promise<void> => {};
    const event = Object.assign(new Event('astro:before-preparation', { cancelable: true }), {
      to: navigation.to.url,
      from: navigation.from?.url ?? new URL(location.href),
      // SvelteKit undoes a stopped back/forward itself; the guard then starts it as a new visit
      navigationType: 'push' as const,
      loader: original,
    }) satisfies TransitionBeforePreparationEvent;
    document.dispatchEvent(event);
    // The guard replaces the loader to stall the navigation while it asks
    if (event.loader !== original || event.defaultPrevented) navigation.cancel();
  });
  afterNavigate((navigation) => {
    if (navigation.type === 'enter') return;
    document.dispatchEvent(new Event('astro:after-swap'));
    document.dispatchEvent(new Event('astro:page-load'));
  });
}
