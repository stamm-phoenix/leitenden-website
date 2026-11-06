<script lang="ts">
  // From StaffLayout.astro of website-astro: pages and data need the connection
  import { onMount } from 'svelte';

  /** A module that keeps working offline says so in its own words (slot „offline“ there). */
  let { text }: { text?: string } = $props();

  let online = $state(true);
  onMount(() => {
    const update = (): void => {
      online = navigator.onLine;
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
</script>

<div role="status" aria-live="polite">
  {#if !online}
    <p class="mb-4 border-l-4 border-warning py-1 pl-3 text-warning">
      <strong>Keine Verbindung zum Internet.</strong>
      {text ??
        'Lass diese Seite offen, deine Eingaben bleiben stehen. Speichern und andere Seiten gehen erst wieder, wenn du online bist.'}
    </p>
  {/if}
</div>
