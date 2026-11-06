<script lang="ts">
  // Port of pages/leitendenbereich/abstimmungen/abstimmung.astro of website-astro
  import { page } from '$app/state';
  import AbstimmungDetailSeite from '#legacy/web/src/components/abstimmungen/AbstimmungDetailSeite.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The page reads the poll from ?id= once when it opens; another one opens it anew -->
{#key page.url.searchParams.get('id')}
  <ClientOnly><AbstimmungDetailSeite /></ClientOnly>
{/key}
