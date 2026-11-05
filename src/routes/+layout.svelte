<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { initTheme } from '#legacy/web/src/lib/theme';
  import { bridgeAstroEvents } from '#lib/astroEvents';

  let { children }: { children: Snippet } = $props();

  bridgeAstroEvents();
  onMount(() => initTheme());
</script>

{@render children()}
