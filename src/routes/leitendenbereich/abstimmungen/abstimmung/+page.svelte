<script lang="ts">
  // Port of pages/leitendenbereich/abstimmungen/abstimmung.astro of website-astro
  import { page } from '$app/state';
  import AbstimmungDetailSeite from '#legacy/web/src/components/abstimmungen/AbstimmungDetailSeite.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The page reads ?id= once when it opens; another query opens it anew, as on the website -->
{#key page.url.search}
  <ClientOnly><AbstimmungDetailSeite /></ClientOnly>
{/key}
