<script lang="ts">
  /**
   * For people who start the old app of the website: after the move the website forwards
   * `/leitendenbereich*` here with `?von=website` (website-astro, issue #17 of this repo). The
   * hint asks once per device to put this app on the home screen instead.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
  import ActionButton from '#legacy/web/src/components/ui/ActionButton.svelte';

  /** Query parameter the website's forwarding adds. */
  const FROM_PARAM = 'von';
  const FROM_WEBSITE = 'website';
  const DISMISSED_KEY = 'phoenix:app-umzug-hinweis:v1';

  /** Chrome's install prompt; not in the DOM types. */
  interface InstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  let visible = $state(false);
  let ios = $state(false);
  let installPrompt = $state<InstallPromptEvent | null>(null);
  let installed = $state(false);

  function dismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }

  function dismiss(): void {
    visible = false;
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Without storage the hint only comes back on the next start of the old app
    }
  }

  async function install(): Promise<void> {
    const prompt = installPrompt;
    if (!prompt) return;
    installPrompt = null;
    await prompt.prompt();
    if ((await prompt.userChoice).outcome === 'accepted') installed = true;
  }

  onMount(() => {
    const url = new URL(page.url.href);
    if (url.searchParams.get(FROM_PARAM) !== FROM_WEBSITE) return;
    // Out of the address, so a reload or a copied link does not bring the hint back
    url.searchParams.delete(FROM_PARAM);
    try {
      replaceState(url, page.state);
    } catch {
      // Only cosmetic: the hint shows anyway and `Nicht mehr anzeigen` keeps it away
    }
    if (dismissed()) return;

    // Safari on iPhone and iPad (an iPad reports a Mac, but has `navigator.standalone`)
    ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || 'standalone' in navigator;
    visible = true;
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      installPrompt = event as InstallPromptEvent;
    };
    const onInstalled = (): void => {
      installed = true;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  });
</script>

{#if visible}
  <section aria-labelledby="app-umzug-titel" class="surface mb-6 border-l-4 border-l-brand-900 p-4">
    <h2 id="app-umzug-titel" class="font-serif text-lg text-brand-900">
      Der Leitendenbereich hat eine neue Adresse
    </h2>
    {#if !installed}
      <p class="mt-2 text-neutral-700">
        Leg den Leitendenbereich neu auf deinen Startbildschirm. Das alte Symbol kannst du danach
        löschen.
      </p>
      {#if !installPrompt}
        <p class="mt-2 text-neutral-700">
          {ios
            ? 'Öffne diese Seite in Safari, tippe auf „Teilen“ und dann auf „Zum Home-Bildschirm“.'
            : 'Öffne diese Seite im Browser und wähle im Menü „App installieren“ oder „Zum Startbildschirm hinzufügen“.'}
        </p>
      {/if}
    {/if}
    <div role="status">
      {#if installed}
        <p class="mt-2 text-success">
          Auf den Startbildschirm gelegt. Das alte Symbol kannst du jetzt löschen.
        </p>
      {/if}
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      {#if installPrompt && !installed}
        <ActionButton variant="primary" class="min-h-11" onclick={install}>
          Auf den Startbildschirm legen
        </ActionButton>
      {/if}
      <ActionButton class="min-h-11" onclick={dismiss}>
        {installed ? 'Schließen' : 'Nicht mehr anzeigen'}
      </ActionButton>
    </div>
  </section>
{/if}
