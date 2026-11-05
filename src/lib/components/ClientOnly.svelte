<script lang="ts">
  /**
   * Renders its content only in the browser, like `client:only` in Astro: the components of
   * website-astro that load their data on start were never rendered on a server.
   */
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let mounted = $state(false);
  onMount(() => (mounted = true));
</script>

{#if mounted}
  {@render children()}
{/if}
